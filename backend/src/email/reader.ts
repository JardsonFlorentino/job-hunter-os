import "dotenv/config";

import {
  ApplicationEventType,
  ApplicationStatus,
  JobStatus,
  ReplyClassification,
} from "@prisma/client";
import { ImapFlow } from "imapflow";
import { simpleParser, type ParsedMail } from "mailparser";

import { callAi } from "../ai/client.js";
import { runtimeConfig } from "../config/runtime.js";
import { prisma } from "../prisma/client.js";
import {
  detectFraudSignals,
  parseReplyClassification,
  REPLY_CLASSIFICATION_PROMPT,
} from "./reply-classification.js";
import { ingestOwnedJobAlert } from "../connectors/owned-job-alerts.js";

const CLASSIFY_REPLY_PROMPT = `
Você classifica respostas de recrutadores a candidaturas de emprego.

Analise o e-mail recebido e responda EXATAMENTE com um único JSON válido, sem Markdown ou texto adicional, no formato:
{"status":"ENTREVISTA"}

O valor de "status" deve ser exclusivamente um destes:
- "ENTREVISTA": convite para conversa, entrevista ou avanço no processo;
- "REJEITADO": recusa, encerramento ou candidatura não selecionada;
- "TESTES": solicitação de teste técnico, desafio, case ou avaliação.

Não adicione propriedades. Se o conteúdo for ambíguo e não representar uma dessas situações, não invente uma classificação.
`.trim();

interface ClassificationResponse {
  status: "ENTREVISTA" | "REJEITADO" | "TESTES";
}

function getRequiredEnvironmentVariable(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`A variável de ambiente ${name} não está configurada.`);
  }

  return value;
}

function getPort(name: string, defaultValue: number): number {
  const rawValue = process.env[name]?.trim();

  if (!rawValue) {
    return defaultValue;
  }

  const port = Number.parseInt(rawValue, 10);

  if (!Number.isInteger(port) || port <= 0 || port > 65_535) {
    throw new Error(`A variável ${name} deve conter uma porta válida.`);
  }

  return port;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getErrorDetail(
  error: unknown,
  property: "response" | "command",
): unknown {
  return isRecord(error) ? error[property] : undefined;
}

function parseClassification(response: string): ClassificationResponse {
  const normalizedResponse = response
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  const parsed: unknown = JSON.parse(normalizedResponse);

  if (!isRecord(parsed)) {
    throw new Error("A classificação da IA não é um objeto JSON.");
  }

  const validStatuses: ClassificationResponse["status"][] = [
    "ENTREVISTA",
    "REJEITADO",
    "TESTES",
  ];

  if (
    typeof parsed.status !== "string" ||
    !validStatuses.includes(parsed.status as ClassificationResponse["status"])
  ) {
    throw new Error("A IA retornou um status de candidatura inválido.");
  }

  return { status: parsed.status as ClassificationResponse["status"] };
}

function getReferenceIds(mail: ParsedMail): string[] {
  const references = Array.isArray(mail.references)
    ? mail.references
    : mail.references
      ? [mail.references]
      : [];

  return [mail.inReplyTo, ...references].filter((value): value is string =>
    Boolean(value?.trim()),
  );
}

function getReadableText(mail: ParsedMail): string {
  if (mail.text?.trim()) {
    return mail.text.trim();
  }

  if (typeof mail.html === "string" && mail.html.trim()) {
    return mail.html
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  throw new Error("O e-mail não possui conteúdo textual para análise.");
}

async function findRelatedJobId(mail: ParsedMail): Promise<string | null> {
  const referenceIds = getReferenceIds(mail);

  if (referenceIds.length > 0) {
    const referencedLog = await prisma.emailLog.findFirst({
      where: {
        message_id: { in: referenceIds },
      },
      orderBy: { enviado_em: "desc" },
      select: { job_id: true },
    });

    if (referencedLog) {
      return referencedLog.job_id;
    }
  }

  const senderAddresses = mail.from?.value
    .map((sender) => sender.address?.trim())
    .filter((address): address is string => Boolean(address));

  if (!senderAddresses?.length) {
    return null;
  }

  const latestLog = await prisma.emailLog.findFirst({
    where: {
      destinatario: { in: senderAddresses, mode: "insensitive" },
      sucesso: true,
    },
    orderBy: { enviado_em: "desc" },
    select: { job_id: true },
  });

  return latestLog?.job_id ?? null;
}

async function saveCheckpoint(account: string, uid: number): Promise<void> {
  await prisma.imapCheckpoint.upsert({
    where: { account_mailbox: { account, mailbox: "INBOX" } },
    create: { account, mailbox: "INBOX", last_uid: uid },
    update: { last_uid: uid },
  });
}

export async function checkInboxForReplies(): Promise<void> {
  const account = getRequiredEnvironmentVariable("IMAP_USER");
  const sinceDate = new Date(`${runtimeConfig.IMAP_SINCE_DATE}T00:00:00.000Z`);

  if (Number.isNaN(sinceDate.getTime())) {
    throw new Error("IMAP_SINCE_DATE nao representa uma data valida.");
  }

  const client = new ImapFlow({
    host: runtimeConfig.IMAP_HOST?.trim() || "imap.gmail.com",
    port: runtimeConfig.IMAP_PORT,
    secure: runtimeConfig.IMAP_TLS,
    auth: {
      user: account,
      pass: getRequiredEnvironmentVariable("IMAP_PASSWORD"),
    },
    logger: false,
  });

  try {
    await client.connect();
    const mailboxLock = await client.getMailboxLock("INBOX");

    try {
      const checkpoint = await prisma.imapCheckpoint.findUnique({
        where: { account_mailbox: { account, mailbox: "INBOX" } },
        select: { last_uid: true },
      });
      const searchResult = await client.search(
        { seen: false, since: sinceDate },
        { uid: true },
      );
      const pendingUids = (searchResult || [])
        .filter((uid) => uid > (checkpoint?.last_uid ?? 0))
        .sort((left, right) => left - right)
        .slice(0, runtimeConfig.IMAP_BATCH_SIZE);

      console.info(
        `[IMAP] ${pendingUids.length} mensagem(ns) pendente(s) desde ${runtimeConfig.IMAP_SINCE_DATE}; limite ${runtimeConfig.IMAP_BATCH_SIZE}.`,
      );

      for (const uid of pendingUids) {
        for await (const message of client.fetch(
          uid.toString(),
          { uid: true, source: true },
          { uid: true },
        )) {
          try {
            if (!message.source) {
              throw new Error(
                "O servidor IMAP não retornou o conteúdo do e-mail.",
              );
            }

            const parsedMail = await simpleParser(message.source);
            const jobId = await findRelatedJobId(parsedMail);

            if (!jobId) {
              const alertCount = await ingestOwnedJobAlert(
                prisma,
                {
                  subject: parsedMail.subject ?? null,
                  text: getReadableText(parsedMail),
                  html:
                    typeof parsedMail.html === "string"
                      ? parsedMail.html
                      : null,
                },
                callAi,
              );
              if (alertCount > 0) {
                await client.messageFlagsAdd(message.uid, ["\\Seen"], {
                  uid: true,
                });
                await saveCheckpoint(account, message.uid);
                console.info(
                  `[IMAP] Alerta UID ${message.uid}: ${alertCount} vagas públicas persistidas.`,
                );
                continue;
              }
              console.info(
                `[IMAP] E-mail UID ${message.uid} não corresponde a uma candidatura registrada.`,
              );
              await saveCheckpoint(account, message.uid);
              continue;
            }

            const emailText = getReadableText(parsedMail);
            const fraudSignals = detectFraudSignals(emailText);
            const classification =
              fraudSignals.length > 0
                ? ReplyClassification.SUSPEITA_FRAUDE
                : ReplyClassification[
                    parseReplyClassification(
                      await callAi(
                        `Classifique o e-mail abaixo:\n\n${emailText}`,
                        REPLY_CLASSIFICATION_PROMPT,
                        { json: true },
                      ),
                    ).classification
                  ];
            const relatedJob = await prisma.job.findUnique({
              where: { id: jobId },
              include: {
                opportunity: {
                  include: {
                    applications: { orderBy: { created_at: "desc" }, take: 1 },
                  },
                },
              },
            });
            const application = relatedJob?.opportunity?.applications[0];
            const profile = await prisma.candidateProfile.findFirst({
              orderBy: { updated_at: "desc" },
              select: { id: true },
            });
            if (!profile) throw new Error("CandidateProfile não encontrado.");
            const sender = parsedMail.from?.value[0]?.address ?? "desconhecido";
            await prisma.inboxMessage.upsert({
              where: {
                message_id:
                  parsedMail.messageId ??
                  `imap:${getRequiredEnvironmentVariable("IMAP_USER")}:${message.uid}`,
              },
              create: {
                profile_id: profile.id,
                application_id: application?.id ?? null,
                message_id:
                  parsedMail.messageId ??
                  `imap:${getRequiredEnvironmentVariable("IMAP_USER")}:${message.uid}`,
                sender,
                subject: parsedMail.subject ?? null,
                body_text: emailText,
                classification,
                fraud_signals: fraudSignals,
                received_at: parsedMail.date ?? new Date(),
              },
              update: {},
            });

            const jobStatus =
              classification === ReplyClassification.ENTREVISTA
                ? JobStatus.ENTREVISTA
                : classification === ReplyClassification.TESTE
                  ? JobStatus.TESTES
                  : classification === ReplyClassification.REJEICAO
                    ? JobStatus.REJEITADO
                    : null;
            if (jobStatus)
              await prisma.job.update({
                where: { id: jobId },
                data: { status: jobStatus },
              });
            const applicationStatus =
              classification === ReplyClassification.ENTREVISTA
                ? ApplicationStatus.INTERVIEW
                : classification === ReplyClassification.TESTE
                  ? ApplicationStatus.TEST
                  : classification === ReplyClassification.REJEICAO
                    ? ApplicationStatus.REJECTED
                    : null;
            if (application && applicationStatus) {
              await prisma.$transaction([
                prisma.application.update({
                  where: { id: application.id },
                  data: {
                    status: applicationStatus,
                    next_action:
                      classification === ReplyClassification.ENTREVISTA
                        ? "Preparar entrevista"
                        : classification === ReplyClassification.TESTE
                          ? "Concluir teste técnico"
                          : null,
                  },
                }),
                prisma.applicationEvent.create({
                  data: {
                    application_id: application.id,
                    type: ApplicationEventType.REPLY_RECEIVED,
                    from_status: application.status,
                    to_status: applicationStatus,
                    message: `Resposta classificada como ${classification}.`,
                  },
                }),
              ]);
              if (applicationStatus === ApplicationStatus.INTERVIEW) {
                const existingInterview = await prisma.interview.findFirst({
                  where: { application_id: application.id },
                  select: { id: true },
                });
                if (!existingInterview)
                  await prisma.interview.create({
                    data: {
                      application_id: application.id,
                      stage: "Entrevista inicial",
                      contact_email: sender,
                      notes:
                        "Criada automaticamente a partir de resposta classificada; revisar data e detalhes.",
                    },
                  });
              }
            }

            await client.messageFlagsAdd(message.uid, ["\\Seen"], {
              uid: true,
            });

            console.info(
              `[IMAP] Vaga ${jobId}; resposta classificada como ${classification}.`,
            );
            await saveCheckpoint(account, message.uid);
          } catch (error: unknown) {
            const messageText =
              error instanceof Error ? error.message : "Erro desconhecido";

            console.error(
              `[IMAP] Falha ao processar e-mail UID ${message.uid}: ${messageText}`,
            );
            throw error;
          }
        }
      }
    } finally {
      mailboxLock.release();
    }
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Erro desconhecido";

    console.error(
      "[IMAP] Erro detalhado:",
      message,
      getErrorDetail(error, "response"),
      getErrorDetail(error, "command"),
    );
    throw new Error(
      `Não foi possível consultar a caixa de entrada: ${message}`,
    );
  } finally {
    if (client.usable) {
      try {
        await client.logout();
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro desconhecido";

        console.error(`[IMAP] Falha ao encerrar a conexão: ${message}`);
      }
    }
  }
}
