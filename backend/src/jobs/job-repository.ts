import { JobStatus, Prisma, type PrismaClient } from "@prisma/client";

import { saveOpportunity } from "../opportunities/opportunity-repository.js";

export interface DiscoveredJobInput {
  titulo: string;
  empresa: string;
  link: string;
  localizacao: string | null;
  descricao: string | null;
  contato_email: string | null;
}

export interface SaveDiscoveredJobResult {
  created: boolean;
  enriched: boolean;
}

async function enrichExistingJob(
  prisma: PrismaClient,
  link: string,
  job: DiscoveredJobInput,
): Promise<boolean> {
  if (!job.descricao) return false;

  const result = await prisma.job.updateMany({
    where: { link, descricao: null },
    data: {
      descricao: job.descricao,
      contato_email: job.contato_email,
    },
  });
  return result.count > 0;
}

export async function saveDiscoveredJob(
  prisma: PrismaClient,
  job: DiscoveredJobInput,
): Promise<SaveDiscoveredJobResult> {
  let result: SaveDiscoveredJobResult;
  try {
    await prisma.job.create({
      data: {
        ...job,
        status: JobStatus.PENDENTE,
      },
    });
    result = { created: true, enriched: Boolean(job.descricao) };
  } catch (error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const enriched = await enrichExistingJob(prisma, job.link, job);
      result = { created: false, enriched };
    } else {
      throw error;
    }
  }

  const opportunity = await saveOpportunity(prisma, {
    title: job.titulo,
    company: job.empresa,
    url: job.link,
    location: job.localizacao,
    description: job.descricao,
    contactEmail: job.contato_email,
  });
  await prisma.job.update({ where: { link: job.link }, data: { opportunity_id: opportunity.opportunityId } });
  return result;
}
