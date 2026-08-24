import { ApplicationStatus, PrismaClient } from "@prisma/client";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { createApplicationOnce, saveOpportunity } from "./opportunity-repository.js";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const integration = testDatabaseUrl ? describe : describe.skip;
let prisma: PrismaClient | undefined;
let profileId = "";

integration("opportunity domain", () => {
  beforeAll(async () => {
    if (!testDatabaseUrl) throw new Error("TEST_DATABASE_URL não configurada.");
    prisma = new PrismaClient({ datasourceUrl: testDatabaseUrl });
    await prisma.$connect();
    const profile = await prisma.candidateProfile.create({ data: { nome: "Teste", email: "teste@example.test", anos_experiencia: 0 } });
    profileId = profile.id;
  });

  afterEach(async () => {
    if (!prisma) return;
    await prisma.applicationEvent.deleteMany();
    await prisma.generatedMaterial.deleteMany();
    await prisma.application.deleteMany();
    await prisma.jobSource.deleteMany();
    await prisma.opportunity.deleteMany();
    await prisma.company.deleteMany();
  });

  afterAll(async () => {
    await prisma?.candidateProfile.deleteMany();
    await prisma?.$disconnect();
  });

  it("agrupa duas fontes exatas na mesma oportunidade", async () => {
    if (!prisma) throw new Error("Banco indisponível.");
    const base = { title: "Full Stack Junior", company: "Acme", location: "Remoto", description: "React e Node" };
    const first = await saveOpportunity(prisma, { ...base, url: "https://github.com/acme/jobs/issues/42?utm_source=x" });
    const second = await saveOpportunity(prisma, { ...base, url: "https://www.linkedin.com/jobs/view/123456?trackingId=x" });
    expect(first.opportunityId).toBe(second.opportunityId);
    expect(await prisma.opportunity.count()).toBe(1);
    expect(await prisma.jobSource.count()).toBe(2);
  });

  it("cria uma única candidatura sob concorrência", async () => {
    if (!prisma) throw new Error("Banco indisponível.");
    const saved = await saveOpportunity(prisma, { title: "Backend Junior", company: "Beta", url: "https://example.test/jobs/99" });
    const ids = await Promise.all(Array.from({ length: 8 }, () => createApplicationOnce(prisma as PrismaClient, saved.opportunityId, profileId, ApplicationStatus.DRAFT)));
    expect(new Set(ids).size).toBe(1);
    expect(await prisma.application.count()).toBe(1);
    expect(await prisma.applicationEvent.count()).toBe(1);
  });
});
