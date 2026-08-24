import { ApplicationEventType, ApplicationStatus, Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { hasSameOrigin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({ opportunityId: z.string().min(1) });
const readySchema = z.object({ applicationId: z.string().min(1) });

export async function POST(request: Request) {
  if (!hasSameOrigin(request)) return NextResponse.json({ error: "Origem da requisição inválida." }, { status: 403 });
  try {
    const { opportunityId } = createSchema.parse(await request.json());
    const profile = await prisma.candidateProfile.findFirst({ orderBy: { updated_at: "desc" }, select: { id: true } });
    if (!profile) return NextResponse.json({ error: "Configure seu perfil antes de preparar uma candidatura." }, { status: 409 });
    const opportunity = await prisma.opportunity.findUnique({ where: { id: opportunityId }, select: { id: true } });
    if (!opportunity) return NextResponse.json({ error: "Oportunidade não encontrada." }, { status: 404 });

    const existing = await prisma.application.findUnique({ where: { opportunity_id_profile_id: { opportunity_id: opportunityId, profile_id: profile.id } } });
    if (existing) return NextResponse.json(existing);
    const application = await prisma.$transaction(async (tx) => {
      const created = await tx.application.create({ data: { opportunity_id: opportunityId, profile_id: profile.id, status: ApplicationStatus.DRAFT } });
      await tx.applicationEvent.create({ data: { application_id: created.id, type: ApplicationEventType.CREATED, to_status: ApplicationStatus.DRAFT, message: "Rascunho criado manualmente na revisão unificada." } });
      return created;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return NextResponse.json(application, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return NextResponse.json({ error: "A candidatura já possui um rascunho." }, { status: 409 });
    return NextResponse.json({ error: error instanceof Error ? error.message : "Dados inválidos." }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  if (!hasSameOrigin(request)) return NextResponse.json({ error: "Origem da requisição inválida." }, { status: 403 });
  try {
    const { applicationId } = readySchema.parse(await request.json());
    const application = await prisma.$transaction(async (tx) => {
      const current = await tx.application.findUnique({ where: { id: applicationId } });
      if (!current) throw new Error("Candidatura não encontrada.");
      if (current.status !== ApplicationStatus.DRAFT) return current;
      const updated = await tx.application.update({ where: { id: applicationId }, data: { status: ApplicationStatus.MANUAL_ACTION, next_action: "Concluir candidatura no canal indicado após revisão final." } });
      await tx.applicationEvent.create({ data: { application_id: applicationId, type: ApplicationEventType.MANUAL_ACTION_REQUIRED, from_status: current.status, to_status: updated.status, message: "Revisão concluída; nenhuma ação externa foi executada." } });
      return updated;
    });
    return NextResponse.json(application);
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Dados inválidos." }, { status: 400 });
  }
}

