import "dotenv/config";

import { JobSourcePlatform } from "@prisma/client";

import { prisma } from "../prisma/client.js";

const targets = [
  {
    name: "CI&T",
    careers_url: "https://jobs.lever.co/ciandt/",
    platform: JobSourcePlatform.LEVER,
    identifier: "ciandt",
    priority: 90,
    notes: "Sugestao para revisao: operacao no Brasil, vagas remotas e oportunidades recorrentes em React/Node.js.",
  },
  {
    name: "Bluelight Consulting",
    careers_url: "https://jobs.lever.co/bluelightconsulting/",
    platform: JobSourcePlatform.LEVER,
    identifier: "bluelightconsulting",
    priority: 80,
    notes: "Sugestao para revisao: vagas remotas na America Latina e busca recorrente por React.",
  },
  {
    name: "Oowlish Technology",
    careers_url: "https://jobs.lever.co/oowlish/",
    platform: JobSourcePlatform.LEVER,
    identifier: "oowlish",
    priority: 70,
    notes: "Sugestao para revisao: vagas remotas no Brasil e oportunidades Full Stack com React/Node.js.",
  },
] as const;

async function main(): Promise<void> {
  for (const target of targets) {
    await prisma.careerPageTarget.upsert({
      where: { careers_url: target.careers_url },
      create: { ...target, enabled: false },
      update: {
        name: target.name,
        platform: target.platform,
        identifier: target.identifier,
        priority: target.priority,
        notes: target.notes,
      },
    });
  }

  console.info(`[Sources] ${targets.length} sugestoes cadastradas e mantidas sob revisao manual.`);
}

void main()
  .catch((error: unknown) => {
    console.error(`[Sources] Falha: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
