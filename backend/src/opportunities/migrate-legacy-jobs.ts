import "dotenv/config";

import { ApplicationStatus, JobStatus, PrismaClient } from "@prisma/client";

import { createApplicationOnce, saveOpportunity } from "./opportunity-repository.js";

const prisma = new PrismaClient();

function applicationStatus(status: JobStatus): ApplicationStatus | null {
  switch (status) {
    case JobStatus.APLICADO: return ApplicationStatus.SUBMITTED;
    case JobStatus.MANUAL: return ApplicationStatus.MANUAL_ACTION;
    case JobStatus.TESTES: return ApplicationStatus.TEST;
    case JobStatus.ENTREVISTA: return ApplicationStatus.INTERVIEW;
    case JobStatus.REJEITADO: return ApplicationStatus.REJECTED;
    case JobStatus.PENDENTE:
    case JobStatus.IGNORADO: return null;
  }
}

export async function migrateLegacyJobs(): Promise<{ migrated: number; applications: number }> {
  const profile = await prisma.candidateProfile.findFirst({ orderBy: { updated_at: "desc" }, select: { id: true } });
  if (!profile) throw new Error("CandidateProfile não encontrado.");
  const jobs = await prisma.job.findMany({
    where: { opportunity_id: null },
    orderBy: { created_at: "asc" },
  });
  let migrated = 0;
  let applications = 0;

  for (const job of jobs) {
    const saved = await saveOpportunity(prisma, {
      title: job.titulo, company: job.empresa, url: job.link, location: job.localizacao,
      description: job.descricao, contactEmail: job.contato_email, salaryText: job.salario_informado,
    });
    await prisma.job.update({ where: { id: job.id }, data: { opportunity_id: saved.opportunityId } });
    migrated += 1;
    const status = applicationStatus(job.status);
    if (status) {
      await createApplicationOnce(prisma, saved.opportunityId, profile.id, status);
      applications += 1;
    }
  }
  return { migrated, applications };
}

migrateLegacyJobs()
  .then((result) => console.info(`[Migration] ${result.migrated} vagas vinculadas; ${result.applications} estados de candidatura preservados.`))
  .catch((error: unknown) => { console.error(`[Migration] Falha: ${error instanceof Error ? error.message : "Erro desconhecido"}`); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
