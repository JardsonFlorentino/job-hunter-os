import "dotenv/config";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function audit(): Promise<void> {
  const [jobs, linkedJobs, opportunities, sources, companies, applications, duplicateApplications] = await Promise.all([
    prisma.job.count(),
    prisma.job.count({ where: { opportunity_id: { not: null } } }),
    prisma.opportunity.count(),
    prisma.jobSource.count(),
    prisma.company.count(),
    prisma.application.count(),
    prisma.$queryRaw<Array<{ opportunity_id: string; profile_id: string; count: bigint }>>`
      SELECT opportunity_id, profile_id, COUNT(*) AS count
      FROM applications
      GROUP BY opportunity_id, profile_id
      HAVING COUNT(*) > 1
    `,
  ]);
  console.info(JSON.stringify({ jobs, linkedJobs, opportunities, sources, companies, applications, duplicateApplicationGroups: duplicateApplications.length }, null, 2));
  if (jobs !== linkedJobs) throw new Error(`${jobs - linkedJobs} vagas históricas não foram vinculadas.`);
  if (duplicateApplications.length > 0) throw new Error("Foram encontradas candidaturas duplicadas.");
}

audit()
  .catch((error: unknown) => { console.error(`[Audit] ${error instanceof Error ? error.message : "Erro desconhecido"}`); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
