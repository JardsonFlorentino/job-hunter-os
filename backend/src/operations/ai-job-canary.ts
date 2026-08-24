import "dotenv/config";

import { callAi } from "../ai/client.js";
import { parseJobFitAnalysis } from "../ai/job-analysis.js";
import { ANALYZE_JOB_PROMPT } from "../ai/prompts.js";
import { loadApprovedCareerContext, serializeApprovedCareerContext } from "../career-dna/context.js";
import { prisma } from "../prisma/client.js";

async function main(): Promise<void> {
  const profile = await prisma.candidateProfile.findFirst({ orderBy: { updated_at: "desc" } });
  if (!profile) throw new Error("Perfil nao encontrado.");
  const job = await prisma.job.findFirst({
    where: { status: "PENDENTE", descricao: { not: null } },
    orderBy: { created_at: "asc" },
  });
  if (!job) throw new Error("Nenhuma vaga pendente com descricao para o canario.");
  const context = await loadApprovedCareerContext(prisma, profile.id);
  const input = `CAREER_DNA_APROVADO:\n${serializeApprovedCareerContext(context)}\n\nVAGA:\n${JSON.stringify({ titulo: job.titulo, empresa: job.empresa, localizacao: job.localizacao, descricao: job.descricao, link: job.link }, null, 2)}`;
  const analysis = parseJobFitAnalysis(await callAi(input, ANALYZE_JOB_PROMPT, { json: true }));
  console.info(JSON.stringify({ pass: true, jobId: job.id, decision: analysis.decision, matchScore: analysis.matchScore, descriptionSufficient: analysis.descriptionSufficient }));
  console.info("[AI Job Canary] Nenhum registro foi alterado.");
}

void main()
  .catch((error: unknown) => { console.error(`[AI Job Canary] FAIL: ${error instanceof Error ? error.message : "erro desconhecido"}`); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
