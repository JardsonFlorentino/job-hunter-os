import "dotenv/config";

import nodemailer from "nodemailer";

import { runtimeConfig } from "../config/runtime.js";
import { prisma } from "../prisma/client.js";
import { getAutomaticEmailDecision } from "../applications/operating-policy.js";

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

function isEnabled(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === "true";
}

export async function sendJobApplication(
  jobId: string,
  to: string,
  subject: string,
  bodyText: string,
  pdfBuffer: Buffer,
  company: string,
  matchScore: number,
): Promise<boolean> {
  const policy = await getAutomaticEmailDecision(prisma, runtimeConfig, { company, matchScore });
  if (!policy.allowed) {
    console.warn(`[SMTP] Envio da vaga ${jobId} bloqueado: ${policy.reason}.`);
    return false;
  }

  let success = false;
  let messageId: string | undefined;
  let errorMessage: string | undefined;

  try {
    const fromEmail =
      process.env.SMTP_FROM_EMAIL?.trim() ||
      getRequiredEnvironmentVariable("SMTP_USER");
    const fromName = process.env.SMTP_FROM_NAME?.trim() || "Jardson Florentino";

    const transporter = nodemailer.createTransport({
      host: getRequiredEnvironmentVariable("SMTP_HOST"),
      port: getPort("SMTP_PORT", 587),
      secure: isEnabled(process.env.SMTP_SECURE),
      auth: {
        user: getRequiredEnvironmentVariable("SMTP_USER"),
        pass: getRequiredEnvironmentVariable("SMTP_PASSWORD"),
      },
    });

    const result = await transporter.sendMail({
      from: {
        name: fromName,
        address: fromEmail,
      },
      to,
      subject,
      text: bodyText,
      attachments: [
        {
          filename: "Jardson_Florentino_CV.pdf",
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });

    messageId = result.messageId;
    success = true;

    console.info(
      `[SMTP] Candidatura da vaga ${jobId} enviada para ${to}. Message-ID: ${messageId}`,
    );
  } catch (error: unknown) {
    errorMessage =
      error instanceof Error ? error.message : "Erro desconhecido no envio";

    console.error(
      `[SMTP] Falha ao enviar candidatura da vaga ${jobId} para ${to}: ${errorMessage}`,
    );
  }

  try {
    await prisma.emailLog.create({
      data: {
        job_id: jobId,
        destinatario: to,
        assunto: subject,
        corpo: bodyText,
        message_id: messageId ?? null,
        sucesso: success,
        erro: errorMessage ?? null,
      },
    });
  } catch (error: unknown) {
    const logError =
      error instanceof Error ? error.message : "Erro desconhecido no banco";

    console.error(
      `[SMTP] Não foi possível registrar o EmailLog da vaga ${jobId}: ${logError}`,
    );

    return false;
  }

  return success;
}
