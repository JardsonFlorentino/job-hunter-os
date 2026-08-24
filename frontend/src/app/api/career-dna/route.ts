import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const nonEmpty = z.string().trim().min(1);
const optionalText = z.string().trim().min(1).nullable().optional();
const optionalDate = z.iso.datetime().nullable().optional();
const stringList = z.array(nonEmpty).default([]);

const createSchema = z.discriminatedUnion("resource", [
  z.object({
    resource: z.literal("experience"),
    title: nonEmpty,
    company: nonEmpty,
    description: nonEmpty,
    start_date: optionalDate,
    end_date: optionalDate,
    current: z.boolean().default(false),
    achievements: stringList,
    technologies: stringList,
  }),
  z.object({
    resource: z.literal("project"),
    name: nonEmpty,
    summary: nonEmpty,
    url: z.url().nullable().optional(),
    repository: z.url().nullable().optional(),
    technologies: stringList,
    highlights: stringList,
  }),
  z.object({
    resource: z.literal("skill"),
    name: nonEmpty,
    category: nonEmpty,
    level: z.enum(["BASICO", "INTERMEDIARIO", "AVANCADO"]),
    years_experience: z.number().min(0).max(80).nullable().optional(),
  }),
  z.object({
    resource: z.literal("education"),
    institution: nonEmpty,
    course: nonEmpty,
    degree: optionalText,
    description: optionalText,
    start_date: optionalDate,
    end_date: optionalDate,
  }),
  z.object({
    resource: z.literal("certification"),
    name: nonEmpty,
    issuer: nonEmpty,
    issued_at: optionalDate,
    expires_at: optionalDate,
    credential_url: z.url().nullable().optional(),
  }),
  z.object({
    resource: z.literal("language"),
    name: nonEmpty,
    level: z.enum(["BASICO", "INTERMEDIARIO", "AVANCADO", "FLUENTE", "NATIVO"]),
  }),
  z.object({
    resource: z.literal("blocked"),
    type: z.enum(["EMPRESA", "TECNOLOGIA", "LOCALIZACAO", "CONDICAO"]),
    value: nonEmpty,
    reason: optionalText,
  }),
  z.object({
    resource: z.literal("answer"),
    question_key: nonEmpty.regex(/^[a-z0-9_-]+$/),
    question: nonEmpty,
    answer: nonEmpty,
  }),
  z.object({
    resource: z.literal("evidence"),
    claim: nonEmpty,
    result: nonEmpty,
    metric: optionalText,
    source_url: z.url().nullable().optional(),
    source_note: optionalText,
  }),
  z.object({
    resource: z.literal("preference"),
    target_titles: stringList,
    target_stacks: stringList,
    target_seniorities: stringList,
    contract_types: stringList,
    work_modes: stringList,
    locations: stringList,
    minimum_clt: z.number().min(0).nullable().optional(),
    minimum_pj: z.number().min(0).nullable().optional(),
    accepts_international: z.boolean().default(false),
  }),
]);

const mutableResource = z.enum([
  "experience",
  "project",
  "skill",
  "education",
  "certification",
  "language",
  "answer",
  "evidence",
]);

const approvalSchema = z.object({
  resource: mutableResource,
  id: nonEmpty,
  approved: z.boolean(),
});

const deleteSchema = z.object({
  resource: z.enum([...mutableResource.options, "blocked"]),
  id: nonEmpty,
});

async function getProfileId(): Promise<string> {
  const profile = await prisma.candidateProfile.findFirst({
    orderBy: { updated_at: "desc" },
    select: { id: true },
  });
  if (!profile) throw new Error("Configure o perfil principal antes de cadastrar informações profissionais.");
  return profile.id;
}

function date(value: string | null | undefined): Date | null {
  return value ? new Date(value) : null;
}

function omitResource<T extends { resource: string }>(
  payload: T,
): Omit<T, "resource"> {
  const { resource, ...data } = payload;
  void resource;
  return data;
}

export async function GET(): Promise<NextResponse> {
  try {
    const profile = await prisma.candidateProfile.findFirst({
      orderBy: { updated_at: "desc" },
      include: {
        experiences: { orderBy: [{ sort_order: "asc" }, { updated_at: "desc" }] },
        projects: { orderBy: [{ sort_order: "asc" }, { updated_at: "desc" }] },
        skills: { orderBy: [{ category: "asc" }, { name: "asc" }] },
        educations: { orderBy: [{ sort_order: "asc" }, { updated_at: "desc" }] },
        certifications: { orderBy: { updated_at: "desc" } },
        languages: { orderBy: { name: "asc" } },
        job_preference: true,
        blocked_items: { orderBy: [{ type: "asc" }, { value: "asc" }] },
        approved_answers: { orderBy: { updated_at: "desc" } },
        evidences: { orderBy: { updated_at: "desc" } },
        resume_imports: {
          orderBy: { created_at: "desc" },
          select: { id: true, original_name: true, status: true, created_at: true, proposals: true },
        },
      },
    });
    return NextResponse.json(profile);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    console.error(`[API Career DNA] Falha ao consultar: ${message}`);
    return NextResponse.json({ error: "Não foi possível carregar o perfil profissional." }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const payload = createSchema.parse(await request.json());
    const profileId = await getProfileId();
    let result: unknown;

    switch (payload.resource) {
      case "experience":
        { const data = omitResource(payload); result = await prisma.experience.create({ data: { ...data, profile_id: profileId, start_date: date(data.start_date), end_date: date(data.end_date) } }); }
        break;
      case "project":
        { const data = omitResource(payload); result = await prisma.project.create({ data: { ...data, profile_id: profileId } }); }
        break;
      case "skill":
        { const data = omitResource(payload); result = await prisma.skill.create({ data: { ...data, profile_id: profileId, years_experience: data.years_experience == null ? null : new Prisma.Decimal(data.years_experience) } }); }
        break;
      case "education":
        { const data = omitResource(payload); result = await prisma.education.create({ data: { ...data, profile_id: profileId, start_date: date(data.start_date), end_date: date(data.end_date) } }); }
        break;
      case "certification":
        { const data = omitResource(payload); result = await prisma.certification.create({ data: { ...data, profile_id: profileId, issued_at: date(data.issued_at), expires_at: date(data.expires_at) } }); }
        break;
      case "language":
        { const data = omitResource(payload); result = await prisma.candidateLanguage.create({ data: { ...data, profile_id: profileId } }); }
        break;
      case "blocked":
        { const data = omitResource(payload); result = await prisma.blockedPreference.create({ data: { ...data, profile_id: profileId } }); }
        break;
      case "answer":
        { const data = omitResource(payload); result = await prisma.approvedAnswer.create({ data: { ...data, profile_id: profileId } }); }
        break;
      case "evidence":
        { const data = omitResource(payload); result = await prisma.careerEvidence.create({ data: { ...data, profile_id: profileId } }); }
        break;
      case "preference":
        { const data = omitResource(payload);
        result = await prisma.jobPreference.upsert({
          where: { profile_id: profileId },
          create: { ...data, profile_id: profileId, minimum_clt: data.minimum_clt == null ? null : new Prisma.Decimal(data.minimum_clt), minimum_pj: data.minimum_pj == null ? null : new Prisma.Decimal(data.minimum_pj) },
          update: { ...data, minimum_clt: data.minimum_clt == null ? null : new Prisma.Decimal(data.minimum_clt), minimum_pj: data.minimum_pj == null ? null : new Prisma.Decimal(data.minimum_pj) },
        });
        }
        break;
    }
    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Payload inválido";
    console.error(`[API Career DNA] Falha ao criar: ${message}`);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(request: Request): Promise<NextResponse> {
  try {
    const payload = approvalSchema.parse(await request.json());
    const profileId = await getProfileId();
    const where = { id: payload.id, profile_id: profileId };

    const result = await (async (): Promise<unknown> => {
      switch (payload.resource) {
        case "experience": return prisma.experience.updateMany({ where, data: { approved: payload.approved } });
        case "project": return prisma.project.updateMany({ where, data: { approved: payload.approved } });
        case "skill": return prisma.skill.updateMany({ where, data: { approved: payload.approved } });
        case "education": return prisma.education.updateMany({ where, data: { approved: payload.approved } });
        case "certification": return prisma.certification.updateMany({ where, data: { approved: payload.approved } });
        case "language": return prisma.candidateLanguage.updateMany({ where, data: { approved: payload.approved } });
        case "answer": return prisma.approvedAnswer.updateMany({ where, data: { approved: payload.approved } });
        case "evidence": return prisma.careerEvidence.updateMany({ where, data: { approved: payload.approved } });
      }
    })();
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Payload inválido";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PUT(request: Request): Promise<NextResponse> {
  try {
    const body: unknown = await request.json();
    const id = z.object({ id: nonEmpty }).parse(body).id;
    const payload = createSchema.parse(body);
    if (payload.resource === "preference") {
      return NextResponse.json({ error: "Preferências usam POST com upsert." }, { status: 400 });
    }
    const profileId = await getProfileId();
    const where = { id, profile_id: profileId };
    let result: { count: number };

    switch (payload.resource) {
      case "experience": { const data = omitResource(payload); result = await prisma.experience.updateMany({ where, data: { ...data, start_date: date(data.start_date), end_date: date(data.end_date), approved: false } }); break; }
      case "project": { const data = omitResource(payload); result = await prisma.project.updateMany({ where, data: { ...data, approved: false } }); break; }
      case "skill": { const data = omitResource(payload); result = await prisma.skill.updateMany({ where, data: { ...data, years_experience: data.years_experience == null ? null : new Prisma.Decimal(data.years_experience), approved: false } }); break; }
      case "education": { const data = omitResource(payload); result = await prisma.education.updateMany({ where, data: { ...data, start_date: date(data.start_date), end_date: date(data.end_date), approved: false } }); break; }
      case "certification": { const data = omitResource(payload); result = await prisma.certification.updateMany({ where, data: { ...data, issued_at: date(data.issued_at), expires_at: date(data.expires_at), approved: false } }); break; }
      case "language": { const data = omitResource(payload); result = await prisma.candidateLanguage.updateMany({ where, data: { ...data, approved: false } }); break; }
      case "blocked": { const data = omitResource(payload); result = await prisma.blockedPreference.updateMany({ where, data }); break; }
      case "answer": { const data = omitResource(payload); result = await prisma.approvedAnswer.updateMany({ where, data: { ...data, approved: false } }); break; }
      case "evidence": { const data = omitResource(payload); result = await prisma.careerEvidence.updateMany({ where, data: { ...data, approved: false } }); break; }
    }
    if (result.count === 0) return NextResponse.json({ error: "Item não encontrado." }, { status: 404 });
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Payload inválido";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request): Promise<NextResponse> {
  try {
    const payload = deleteSchema.parse(await request.json());
    const profileId = await getProfileId();
    const where = { id: payload.id, profile_id: profileId };

    switch (payload.resource) {
      case "experience": await prisma.experience.deleteMany({ where }); break;
      case "project": await prisma.project.deleteMany({ where }); break;
      case "skill": await prisma.skill.deleteMany({ where }); break;
      case "education": await prisma.education.deleteMany({ where }); break;
      case "certification": await prisma.certification.deleteMany({ where }); break;
      case "language": await prisma.candidateLanguage.deleteMany({ where }); break;
      case "answer": await prisma.approvedAnswer.deleteMany({ where }); break;
      case "evidence": await prisma.careerEvidence.deleteMany({ where }); break;
      case "blocked": await prisma.blockedPreference.deleteMany({ where }); break;
    }
    return new NextResponse(null, { status: 204 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Payload inválido";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
