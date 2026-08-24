import "dotenv/config";

import { JobStatus } from "@prisma/client";

import { prisma } from "../prisma/client.js";

async function main(): Promise<void> {
  const result = await prisma.job.updateMany({
    where: {
      status: JobStatus.PENDENTE,
      link: { contains: "linkedin.com" },
    },
    data: {
      status: JobStatus.IGNORADO,
      aiReason: "Isolada pelo canario do LinkedIn: localizacao/descricao nao validadas.",
    },
  });
  console.info(`Vagas isoladas: ${result.count}`);
}

void main().finally(() => prisma.$disconnect());
