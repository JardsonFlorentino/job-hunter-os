import "dotenv/config";
import { createHash } from "node:crypto";
import { ApplicationStatus, JobSourcePlatform, OpportunityDecision, PrismaClient } from "@prisma/client";
import { assertSafeDemoDatabase } from "./demo-safety.js";

const databaseUrl = assertSafeDemoDatabase(process.env.DEMO_DATABASE_URL);
const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });

const fixtures = [
  { company: "Aurora Labs Demo", title: "Desenvolvedor Full Stack Júnior", platform: JobSourcePlatform.GREENHOUSE, score: 88, decision: OpportunityDecision.APLICAR, status: ApplicationStatus.INTERVIEW },
  { company: "Norte Digital Demo", title: "Frontend React Júnior", platform: JobSourcePlatform.LINKEDIN, score: 81, decision: OpportunityDecision.APLICAR, status: ApplicationStatus.TEST },
  { company: "Atlas Commerce Demo", title: "Node.js Developer Júnior", platform: JobSourcePlatform.LEVER, score: 74, decision: OpportunityDecision.REVISAR, status: ApplicationStatus.SUBMITTED },
  { company: "Horizonte Tech Demo", title: "Software Engineer Pleno", platform: JobSourcePlatform.ASHBY, score: 54, decision: OpportunityDecision.REVISAR, status: ApplicationStatus.MANUAL_ACTION },
] as const;

function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

async function seed(): Promise<void> {
  const profile = await prisma.candidateProfile.upsert({
    where: { email: "candidato.demo@example.invalid" },
    update: { nome: "Candidato Demonstração", anos_experiencia: 1 },
    create: { nome: "Candidato Demonstração", email: "candidato.demo@example.invalid", anos_experiencia: 1, portfolio: "https://portfolio.example.invalid" },
  });
  await prisma.careerPageTarget.upsert({
    where: { careers_url: "https://example.invalid/careers" },
    update: { name: "Aurora Labs Demo", enabled: false },
    create: { name: "Aurora Labs Demo", careers_url: "https://example.invalid/careers", platform: JobSourcePlatform.GREENHOUSE, identifier: "aurora-demo", enabled: false, priority: 90, notes: "Registro fictício; nunca habilitar contra serviço real." },
  });

  for (const [index, fixture] of fixtures.entries()) {
    const normalizedCompany = fixture.company.toLowerCase().replace(/\s+/g, "-");
    const normalizedTitle = fixture.title.toLowerCase();
    const fingerprint = hash(`demo:${normalizedCompany}:${normalizedTitle}`);
    const company = await prisma.company.upsert({
      where: { normalized_name: normalizedCompany },
      update: { name: fixture.company },
      create: { name: fixture.company, normalized_name: normalizedCompany },
    });
    const opportunity = await prisma.opportunity.upsert({
      where: { fingerprint },
      update: { last_seen_at: new Date() },
      create: {
        company_id: company.id,
        title: fixture.title,
        normalized_title: normalizedTitle,
        description: "Vaga fictícia para demonstrar React, TypeScript, Node.js, colaboração e entrega de projetos. Nenhuma candidatura será enviada.",
        description_hash: hash(`description:${fingerprint}`),
        fingerprint,
        location: index % 2 === 0 ? "Remoto" : "São Paulo - Híbrido",
      },
    });
    await prisma.jobSource.upsert({
      where: { canonical_url: `https://example.invalid/jobs/demo-${index + 1}` },
      update: { last_seen_at: new Date() },
      create: { opportunity_id: opportunity.id, platform: fixture.platform, external_id: `demo-${index + 1}`, canonical_url: `https://example.invalid/jobs/demo-${index + 1}`, raw_url: `https://example.invalid/jobs/demo-${index + 1}`, metadata: { demo: true } },
    });
    await prisma.opportunityAssessment.upsert({
      where: { opportunity_id_profile_id_prompt_version_input_hash: { opportunity_id: opportunity.id, profile_id: profile.id, prompt_version: "demo-v1", input_hash: hash(`assessment:${fingerprint}`) } },
      update: { match_score: fixture.score, decision: fixture.decision },
      create: {
        opportunity_id: opportunity.id, profile_id: profile.id, match_score: fixture.score, decision: fixture.decision,
        description_sufficient: true, score_breakdown: { stack: fixture.score, seniority: 80, responsibilities: 80, location: 90, language: 80, restrictions: 100 },
        essential_requirements: ["TypeScript", "React ou Node.js"], desirable_requirements: ["Next.js"], strengths: ["Base compatível com a stack principal"], gaps: ["Validar contexto específico na entrevista"], risks: [],
        strategy: "Demonstração: destacar evidências aprovadas e revisar antes de aplicar.", reason: "Registro fictício criado exclusivamente para apresentação.", model: "demo/offline", prompt_version: "demo-v1", input_hash: hash(`assessment:${fingerprint}`),
      },
    });
    await prisma.application.upsert({
      where: { opportunity_id_profile_id: { opportunity_id: opportunity.id, profile_id: profile.id } },
      update: { status: fixture.status },
      create: { opportunity_id: opportunity.id, profile_id: profile.id, status: fixture.status, channel: "DEMO", submitted_at: fixture.status !== ApplicationStatus.MANUAL_ACTION ? new Date(Date.now() - index * 86_400_000) : null, next_action: fixture.status === ApplicationStatus.INTERVIEW ? "Preparar entrevista fictícia" : "Revisar demonstração" },
    });
  }

  console.log(`[Demo] Banco isolado preparado com ${fixtures.length} oportunidades e 1 fonte-alvo fictícias.`);
}

seed()
  .catch((error: unknown) => { console.error(`[Demo] Falha: ${error instanceof Error ? error.message : "Erro desconhecido"}`); process.exitCode = 1; })
  .finally(async () => prisma.$disconnect());
