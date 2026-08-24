import { PrismaClient } from "@prisma/client";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { saveDiscoveredJob, type DiscoveredJobInput } from "./job-repository.js";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const integration = testDatabaseUrl ? describe : describe.skip;
let prisma: PrismaClient | undefined;

const job: DiscoveredJobInput = {
  titulo: "Desenvolvedor Full Stack Júnior",
  empresa: "Empresa Teste",
  link: "https://example.test/jobs/unique-1",
  localizacao: "Remoto",
  descricao: null,
  contato_email: null,
};

integration("saveDiscoveredJob", () => {
  beforeAll(async () => {
    if (!testDatabaseUrl) {
      throw new Error("TEST_DATABASE_URL não configurada para a suíte de integração.");
    }
    prisma = new PrismaClient({ datasourceUrl: testDatabaseUrl });
    await prisma.$connect();
  });

  afterEach(async () => {
    await prisma?.job.deleteMany();
    await prisma?.jobSource.deleteMany();
    await prisma?.opportunity.deleteMany();
    await prisma?.company.deleteMany();
  });

  afterAll(async () => {
    await prisma?.$disconnect();
  });

  it("impede duplicação mesmo com gravações concorrentes", async () => {
    if (!prisma) throw new Error("Banco de integração indisponível.");

    const results = await Promise.all(
      Array.from({ length: 8 }, () => saveDiscoveredJob(prisma as PrismaClient, job)),
    );

    expect(results.filter((result) => result.created)).toHaveLength(1);
    expect(await prisma.job.count({ where: { link: job.link } })).toBe(1);
  });

  it("faz backfill sem alterar o status existente", async () => {
    if (!prisma) throw new Error("Banco de integração indisponível.");

    await saveDiscoveredJob(prisma, job);
    await prisma.job.update({ where: { link: job.link }, data: { status: "IGNORADO" } });

    const result = await saveDiscoveredJob(prisma, {
      ...job,
      descricao: "React e Node.js. Contato: vagas@empresa.test",
      contato_email: "vagas@empresa.test",
    });
    const stored = await prisma.job.findUniqueOrThrow({ where: { link: job.link } });

    expect(result).toEqual({ created: false, enriched: true });
    expect(stored.status).toBe("IGNORADO");
    expect(stored.contato_email).toBe("vagas@empresa.test");
  });
});
