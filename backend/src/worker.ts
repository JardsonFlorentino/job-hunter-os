import "dotenv/config";

import { createHash } from "node:crypto";

import { ApplicationEventType, ApplicationStatus, JobStatus, MaterialType, OpportunityDecision, Prisma, PrismaClient, RequirementKind, type CandidateProfile, type Job } from "@prisma/client";

import { AiProviderError, callAi, configuredAiModel } from "./ai/client.js";
import { parseJobFitAnalysis } from "./ai/job-analysis.js";
import { ANALYSIS_PROMPT_VERSION, ANALYZE_JOB_PROMPT, GENERATE_EMAIL_PROMPT } from "./ai/prompts.js";
import { runAllScrapers } from "./bot/runner.js";
import { routeLinkedinApplication } from "./bot/linkedin-apply.js";
import { generatePDF } from "./cv-builder/generator.js";
import { loadApprovedCareerContext, serializeApprovedCareerContext, type ApprovedCareerContext } from "./career-dna/context.js";
import { runtimeConfig } from "./config/runtime.js";
import { checkInboxForReplies } from "./email/reader.js";
import { sendJobApplication } from "./email/sender.js";
import { normalizeText } from "./opportunities/normalization.js";
import { buildAtsResumeText, buildFactualCvData } from "./materials/factual-material.js";
import { generateRecruiterMessage } from "./materials/ai-materials.js";
import { storeGeneratedMaterial } from "./materials/repository.js";
import { createApplicationOnce } from "./opportunities/opportunity-repository.js";
import { prepareFollowUpDrafts } from "./applications/follow-up.js";
import { claimNextOfType, complete, fail } from "./queue/queue-service.js";
import { getAutomaticEmailDecision } from "./applications/operating-policy.js";
import { errorDetails, logger } from "./observability/logger.js";

const prisma = new PrismaClient();
const LOOP_INTERVAL_MS = 3 * 60 * 60 * 1_000;
const AI_INTER_JOB_DELAY_MS = 1_000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function buildJobContext(job: Job): string {
  return JSON.stringify(
    {
      titulo: job.titulo,
      empresa: job.empresa,
      localizacao: job.localizacao,
      salario: job.salario_informado,
      descricao: job.descricao,
      link: job.link,
    },
    null,
    2,
  );
}

async function prepareCoreMaterials(applicationId: string, job: Job, profile: CandidateProfile, approvedContext: ApprovedCareerContext): Promise<Buffer> {
  const cvData = buildFactualCvData(profile, job, approvedContext);
  const pdfBuffer = await generatePDF(cvData);
  await storeGeneratedMaterial(prisma, { applicationId, type: MaterialType.CV_VISUAL, data: pdfBuffer });
  await storeGeneratedMaterial(prisma, { applicationId, type: MaterialType.CV_ATS, text: buildAtsResumeText(cvData) });
  await generateRecruiterMessage(prisma, applicationId, approvedContext, job);
  await prisma.applicationEvent.create({ data: { application_id: applicationId, type: ApplicationEventType.MATERIAL_GENERATED, message: "Currículo visual, currículo ATS e mensagem ao recrutador gerados a partir do Career DNA aprovado." } });
  return pdfBuffer;
}
async function processJob(job: Job, profile: CandidateProfile, approvedContext: ApprovedCareerContext): Promise<void> {
  const careerContext = serializeApprovedCareerContext(approvedContext);
  const analysisInput = `CAREER_DNA_APROVADO:\n${careerContext}\n\nVAGA:\n${buildJobContext(job)}`;
  const analysisResponse = await callAi(
    analysisInput,
    ANALYZE_JOB_PROMPT,
    { json: true },
  );
  let analysis: ReturnType<typeof parseJobFitAnalysis>;
  try {
    analysis = parseJobFitAnalysis(analysisResponse);
  } catch (parseError: unknown) {
    logger.warn({ event: "job.analysis_json_repair", jobId: job.id, error: parseError instanceof Error ? parseError.message : "JSON inválido" }, "Solicitando uma única correção estrutural à IA.");
    const repairedResponse = await callAi(
      `${analysisInput}\n\nA resposta anterior foi inválida. Gere novamente o JSON completo obedecendo rigorosamente ao schema e às regras.`,
      ANALYZE_JOB_PROMPT,
      { json: true },
    );
    analysis = parseJobFitAnalysis(repairedResponse);
  }

  if (job.opportunity_id) {
    const inputHash = createHash("sha256").update(analysisInput).digest("hex");
    await prisma.$transaction(async (tx) => {
      await tx.opportunityAssessment.upsert({
        where: { opportunity_id_profile_id_prompt_version_input_hash: { opportunity_id: job.opportunity_id!, profile_id: profile.id, prompt_version: ANALYSIS_PROMPT_VERSION, input_hash: inputHash } },
        create: {
          opportunity_id: job.opportunity_id!, profile_id: profile.id,
          decision: OpportunityDecision[analysis.decision], match_score: analysis.matchScore,
          description_sufficient: analysis.descriptionSufficient,
          score_breakdown: analysis.scoreBreakdown as Prisma.InputJsonValue,
          essential_requirements: analysis.essentialRequirements as Prisma.InputJsonValue,
          desirable_requirements: analysis.desirableRequirements as Prisma.InputJsonValue,
          strengths: analysis.strengths, gaps: analysis.gaps, risks: analysis.risks,
          strategy: analysis.strategy, reason: analysis.aiReason,
          model: configuredAiModel(), prompt_version: ANALYSIS_PROMPT_VERSION, input_hash: inputHash,
        },
        update: {},
      });
      await tx.requirement.deleteMany({ where: { opportunity_id: job.opportunity_id! } });
      const requirements = [
        ...analysis.essentialRequirements.map((requirement) => ({ opportunity_id: job.opportunity_id!, kind: RequirementKind.ESSENTIAL, text: requirement.text, normalized_key: normalizeText(requirement.text) })),
        ...analysis.desirableRequirements.map((requirement) => ({ opportunity_id: job.opportunity_id!, kind: RequirementKind.DESIRABLE, text: requirement.text, normalized_key: normalizeText(requirement.text) })),
      ];
      if (requirements.length > 0) await tx.requirement.createMany({ data: requirements });
    });
  }

  logger.info({ event: "job.assessed", jobId: job.id, fit: analysis.fit, matchScore: analysis.matchScore, decision: analysis.decision }, "Vaga avaliada.");

  await prisma.job.update({
    where: { id: job.id },
    data: {
      matchScore: analysis.matchScore,
      aiReason: analysis.aiReason,
    },
  });

  if (analysis.decision === "IGNORAR") {
    await prisma.job.update({
      where: { id: job.id },
      data: {
        status: JobStatus.IGNORADO,
        matchScore: analysis.matchScore,
        aiReason: analysis.aiReason,
      },
    });
    return;
  }

  if (!job.opportunity_id) throw new Error("Vaga sem Opportunity vinculada; preparação de candidatura bloqueada.");
  const initialStatus = analysis.decision === "REVISAR" ? ApplicationStatus.MANUAL_ACTION : ApplicationStatus.DRAFT;
  const applicationId = await createApplicationOnce(prisma, job.opportunity_id, profile.id, initialStatus);
  const pdfBuffer = await prepareCoreMaterials(applicationId, job, profile, approvedContext);

  if (analysis.decision === "REVISAR") {
    await prisma.job.update({ where: { id: job.id }, data: { status: JobStatus.MANUAL, matchScore: analysis.matchScore, aiReason: `${analysis.aiReason} Materiais preparados para revisão.` } });
    return;
  }

  const contactEmail = job.contato_email?.trim();
  if (!contactEmail || !EMAIL_PATTERN.test(contactEmail)) {
    if (job.link.includes("linkedin.com/jobs/")) {
      await routeLinkedinApplication(job.id, job.link);
    } else {
      await prisma.job.update({ where: { id: job.id }, data: { status: JobStatus.MANUAL, matchScore: analysis.matchScore, aiReason: `${analysis.aiReason} Sem contato público; materiais preparados para candidatura manual.` } });
    }
    await prisma.application.update({ where: { id: applicationId }, data: { status: ApplicationStatus.MANUAL_ACTION, channel: "MANUAL", next_action: "Revisar materiais e concluir a candidatura no canal original." } });
    logger.info({ event: "job.manual_required", jobId: job.id, applicationId, reason: "missing_contact", materialsPrepared: true }, "Materiais preparados para candidatura manual.");
    return;
  }

  const emailBody = await callAi(
    `CAREER_DNA_APROVADO:\n${careerContext}\n\nVAGA:\n${buildJobContext(job)}`,
    GENERATE_EMAIL_PROMPT,
  );
  const emailPolicy = await getAutomaticEmailDecision(prisma, runtimeConfig, {
    company: job.empresa,
    matchScore: analysis.matchScore,
  });
  if (!emailPolicy.allowed) {
    await prisma.$transaction([
      prisma.application.update({
        where: { id: applicationId },
        data: { status: ApplicationStatus.MANUAL_ACTION, channel: "EMAIL_DRAFT" },
      }),
      prisma.applicationEvent.create({
        data: {
          application_id: applicationId,
          type: ApplicationEventType.MANUAL_ACTION_REQUIRED,
          from_status: ApplicationStatus.DRAFT,
          to_status: ApplicationStatus.MANUAL_ACTION,
          message: `Envio automatico bloqueado pela politica: ${emailPolicy.reason}.`,
        },
      }),
    ]);
    await storeGeneratedMaterial(prisma, { applicationId, type: MaterialType.EMAIL, text: `Assunto: Candidatura - ${job.titulo} - Jardson Florentino\n\n${emailBody}`, model: configuredAiModel(), promptVersion: "application-email-v2" });
    await prisma.job.update({
      where: { id: job.id },
      data: { status: JobStatus.MANUAL, aiReason: `${analysis.aiReason} Rascunho preparado; ${emailPolicy.reason}.` },
    });
    logger.info({ event: "application.prepared", jobId: job.id, applicationId, reason: emailPolicy.reason }, "Candidatura preparada para revisao manual.");
    return;
  }
  const sent = await sendJobApplication(
    job.id,
    contactEmail,
    `Candidatura — ${job.titulo} — Jardson Florentino`,
    emailBody,
    pdfBuffer,
    job.empresa,
    analysis.matchScore,
  );
  await storeGeneratedMaterial(prisma, { applicationId, type: MaterialType.EMAIL, text: `Assunto: Candidatura — ${job.titulo} — Jardson Florentino\n\n${emailBody}`, model: runtimeConfig.OPENROUTER_MODEL, promptVersion: "application-email-v2" });

  if (sent) {
    await prisma.$transaction([
      prisma.application.update({ where: { id: applicationId }, data: { status: ApplicationStatus.SUBMITTED, channel: "EMAIL", submitted_at: new Date() } }),
      prisma.applicationEvent.create({ data: { application_id: applicationId, type: ApplicationEventType.SUBMITTED, from_status: ApplicationStatus.DRAFT, to_status: ApplicationStatus.SUBMITTED, message: `E-mail enviado para ${contactEmail}.` } }),
    ]);
    await prisma.job.update({
      where: { id: job.id },
      data: {
        status: JobStatus.APLICADO,
        matchScore: analysis.matchScore,
        aiReason: analysis.aiReason,
      },
    });
    logger.info({ event: "application.submitted", jobId: job.id, applicationId, channel: "EMAIL" }, "Candidatura registrada como enviada.");
  } else {
    logger.warn({ event: "application.send_failed", jobId: job.id, applicationId, alert: true }, "Envio falhou; vaga permanece disponível para nova tentativa.");
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function processMaterialRegenerationQueue(): Promise<void> {
  const workerId = `material-regeneration:${process.pid}`;
  for (let processed = 0; processed < 5; processed += 1) {
    const item = await claimNextOfType(prisma, workerId, "MATERIAL_REGENERATION");
    if (!item) break;
    try {
      if (!isRecord(item.payload) || typeof item.payload.applicationId !== "string") throw new Error("Payload de regeneração inválido.");
      const application = await prisma.application.findUnique({
        where: { id: item.payload.applicationId },
        include: { profile: true, opportunity: { include: { legacy_jobs: { orderBy: { updated_at: "desc" }, take: 1 } } } },
      });
      const job = application?.opportunity.legacy_jobs[0];
      if (!application || !job) throw new Error("Candidatura sem vaga legada vinculada para regeneração.");
      const context = await loadApprovedCareerContext(prisma, application.profile.id);
      await prepareCoreMaterials(application.id, job, application.profile, context);
      if (!await complete(prisma, item.id, workerId)) throw new Error("A posse do item de regeneração foi perdida antes da conclusão.");
      logger.info({ event: "materials.regenerated", applicationId: application.id, queueItemId: item.id }, "Materiais regenerados com nova versão auditável.");
    } catch (error: unknown) {
      await fail(prisma, item, workerId, error);
      logger.error({ event: "materials.regeneration_failed", queueItemId: item.id, attempt: item.attempts, maxAttempts: item.max_attempts, ...errorDetails(error) }, "Falha ao regenerar materiais.");
    }
  }
}
export async function processPendingJobs(): Promise<void> {
  const profile = await prisma.candidateProfile.findFirst({
    orderBy: { updated_at: "desc" },
  });

  if (!profile) {
    throw new Error("Nenhum CandidateProfile foi configurado.");
  }
  const careerContext = await loadApprovedCareerContext(prisma, profile.id);

  const pendingJobs = await prisma.job.findMany({
    where: { status: JobStatus.PENDENTE },
    orderBy: { created_at: "asc" },
  });

  logger.info({ event: "jobs.pending_loaded", count: pendingJobs.length }, "Vagas pendentes carregadas.");

  for (const job of pendingJobs) {
    try {
      await processJob(job, profile, careerContext);
      await delay(AI_INTER_JOB_DELAY_MS);
    } catch (error: unknown) {
      logger.error({ event: "job.processing_failed", jobId: job.id, alert: true, ...errorDetails(error) }, "Falha ao processar vaga.");
      if (error instanceof AiProviderError && error.shouldPauseBatch) {
        logger.warn({ event: "ai.batch_paused", status: error.status, retryAfterSeconds: error.retryAfterSeconds, alert: true }, "Lote pausado por limite do provedor de IA.");
        break;
      }
    }
  }
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, milliseconds));
}

async function runStep(name: string, step: () => Promise<void>): Promise<void> {
  const startedAt = Date.now();
  try {
    logger.info({ event: "worker.step_started", step: name }, "Etapa iniciada.");
    await step();
    logger.info({ event: "worker.step_finished", step: name, durationMs: Date.now() - startedAt }, "Etapa finalizada.");
  } catch (error: unknown) {
    logger.error({ event: "worker.step_failed", step: name, durationMs: Date.now() - startedAt, alert: true, ...errorDetails(error) }, "Etapa falhou sem encerrar o worker.");
  }
}

export async function mainLoop(): Promise<never> {
  logger.info({ event: "worker.started", dryRun: runtimeConfig.DRY_RUN }, "Job Hunter iniciado.");

  while (true) {
    const cycleStartedAt = new Date();

    try {
      logger.info({ event: "worker.cycle_started", cycleStartedAt: cycleStartedAt.toISOString() }, "Novo ciclo iniciado.");
      if (runtimeConfig.ENABLE_IMAP && !runtimeConfig.DRY_RUN) {
        await runStep("leitura da caixa de entrada", checkInboxForReplies);
      }
      if (runtimeConfig.ENABLE_GITHUB_SCRAPER || runtimeConfig.ENABLE_LINKEDIN_SCRAPER) {
        await runStep("execução dos scrapers", runAllScrapers);
      }
      if (runtimeConfig.ENABLE_JOB_PROCESSING && runtimeConfig.APPLICATION_MODE !== "OBSERVE") {
        await runStep("regeneração de materiais solicitados", processMaterialRegenerationQueue);
        await runStep("processamento de vagas pendentes", processPendingJobs);
      } else if (runtimeConfig.ENABLE_JOB_PROCESSING) {
        logger.info({ event: "jobs.processing_skipped", mode: runtimeConfig.APPLICATION_MODE }, "Processamento bloqueado pelo modo de observacao.");
      }
      if (runtimeConfig.ENABLE_FOLLOWUP_DRAFTS) {
        await runStep("preparação de follow-ups para aprovação", async () => { const count = await prepareFollowUpDrafts(prisma); logger.info({ event: "followups.drafts_prepared", count }, "Rascunhos de follow-up preparados."); });
      }
    } catch (error: unknown) {
      logger.fatal({ event: "worker.cycle_failed", alert: true, ...errorDetails(error) }, "Falha global não fatal no ciclo.");
    }

    logger.info({ event: "worker.cycle_finished", durationMs: Date.now() - cycleStartedAt.getTime(), nextRunInMs: LOOP_INTERVAL_MS }, "Ciclo encerrado.");
    await delay(LOOP_INTERVAL_MS);
  }
}

void mainLoop().catch((error: unknown) => {
  logger.fatal({ event: "worker.fatal", alert: true, ...errorDetails(error) }, "Erro fatal inesperado.");
});
