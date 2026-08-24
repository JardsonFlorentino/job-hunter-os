import { MaterialType, type Job, type PrismaClient } from "@prisma/client";

import { callAi, configuredAiModel } from "../ai/client.js";
import { serializeApprovedCareerContext, type ApprovedCareerContext } from "../career-dna/context.js";
import { COVER_LETTER_PROMPT, RECRUITER_MESSAGE_PROMPT, approvedFormAnswer } from "./factual-material.js";
import { storeGeneratedMaterial } from "./repository.js";

function materialInput(context: ApprovedCareerContext, job: Job): string {
  return `CAREER_DNA_APROVADO:\n${serializeApprovedCareerContext(context)}\n\nVAGA:\n${JSON.stringify({ titulo: job.titulo, empresa: job.empresa, localizacao: job.localizacao, descricao: job.descricao, link: job.link }, null, 2)}`;
}

export async function generateCoverLetter(prisma: PrismaClient, applicationId: string, context: ApprovedCareerContext, job: Job): Promise<string> {
  const content = await callAi(materialInput(context, job), COVER_LETTER_PROMPT);
  await storeGeneratedMaterial(prisma, { applicationId, type: MaterialType.COVER_LETTER, text: content, model: configuredAiModel(), promptVersion: "cover-letter-v1" });
  return content;
}

export async function generateRecruiterMessage(prisma: PrismaClient, applicationId: string, context: ApprovedCareerContext, job: Job): Promise<string> {
  const content = await callAi(materialInput(context, job), RECRUITER_MESSAGE_PROMPT);
  if (content.length > 400) throw new Error("Mensagem do recrutador excedeu 400 caracteres.");
  await storeGeneratedMaterial(prisma, { applicationId, type: MaterialType.RECRUITER_MESSAGE, text: content, model: configuredAiModel(), promptVersion: "recruiter-message-v1" });
  return content;
}

export function suggestApprovedFormAnswer(context: ApprovedCareerContext, questionKey: string): { answer: string | null; requiresReview: boolean } {
  const answer = approvedFormAnswer(context, questionKey);
  return { answer, requiresReview: answer === null };
}
