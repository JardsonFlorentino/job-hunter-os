import { MaterialType, PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { storeGeneratedMaterial } from "./repository.js";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const integration = testDatabaseUrl ? describe : describe.skip;
let prisma: PrismaClient | undefined;
let applicationId = "";

integration("versioned materials", () => {
  beforeAll(async () => {
    if (!testDatabaseUrl) throw new Error("TEST_DATABASE_URL não configurada.");
    prisma = new PrismaClient({ datasourceUrl: testDatabaseUrl }); await prisma.$connect();
    const profile = await prisma.candidateProfile.create({ data: { nome: "Material Test", email: "material@example.test", anos_experiencia: 0 } });
    const company = await prisma.company.create({ data: { name: "Acme", normalized_name: "acme-material" } });
    const opportunity = await prisma.opportunity.create({ data: { company_id: company.id, title: "Dev", normalized_title: "dev", fingerprint: "material-fingerprint" } });
    const application = await prisma.application.create({ data: { profile_id: profile.id, opportunity_id: opportunity.id } });
    applicationId = application.id;
  });
  afterAll(async () => { if (prisma) { await prisma.generatedMaterial.deleteMany(); await prisma.application.deleteMany(); await prisma.opportunity.deleteMany(); await prisma.company.deleteMany(); await prisma.candidateProfile.deleteMany(); await prisma.$disconnect(); } });

  it("preserves every concurrent text version and hash", async () => {
    if (!prisma) throw new Error("Banco indisponível.");
    await Promise.all(Array.from({ length: 4 }, (_, index) => storeGeneratedMaterial(prisma as PrismaClient, { applicationId, type: MaterialType.EMAIL, text: `versão ${index}` })));
    const materials = await prisma.generatedMaterial.findMany({ orderBy: { version: "asc" } });
    expect(materials.map((item) => item.version)).toEqual([1, 2, 3, 4]);
    expect(new Set(materials.map((item) => item.content_hash)).size).toBe(4);
  });
});
