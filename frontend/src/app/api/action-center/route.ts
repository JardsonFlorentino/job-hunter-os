import { ApplicationStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { hasSameOrigin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { decisionUpdate } from "./decision-policy";

export const dynamic = "force-dynamic";

const decisionSchema = z.discriminatedUnion("action", [
  z.object({ applicationId: z.string().min(1), action: z.literal("APPROVE") }),
  z.object({ applicationId: z.string().min(1), action: z.literal("IGNORE") }),
  z.object({ applicationId: z.string().min(1), action: z.literal("POSTPONE") }),
  z.object({ applicationId: z.string().min(1), action: z.literal("REGENERATE") }),
  z.object({ applicationId: z.string().min(1), action: z.literal("MARK_MANUAL") }),
  z.object({ applicationId: z.string().min(1), action: z.literal("MARK_SUBMITTED") }),
]);

export async function GET(): Promise<NextResponse> {
  try {
    const profile = await prisma.candidateProfile.findFirst({ orderBy: { updated_at: "desc" }, select: { id: true } });
    if (!profile) return NextResponse.json([]);
    const applications = await prisma.application.findMany({
      where: {
        profile_id: profile.id,
        status: { in: ["DRAFT", "MANUAL_ACTION"] },
        OR: [{ due_at: null }, { due_at: { lte: new Date() } }],
      },
      orderBy: { updated_at: "desc" },
      include: {
        opportunity: { include: { company: true, sources: { orderBy: { discovered_at: "asc" } }, assessments: { where: { profile_id: profile.id }, orderBy: { created_at: "desc" }, take: 1 } } },
        materials: { orderBy: [{ type: "asc" }, { version: "desc" }] },
        follow_ups: { where: { status: "DRAFT" }, orderBy: { scheduled_at: "asc" } },
      },
    });
    const prioritized = applications.sort((left, right) => (right.opportunity.assessments[0]?.match_score ?? 0) - (left.opportunity.assessments[0]?.match_score ?? 0) || right.updated_at.getTime() - left.updated_at.getTime());
    return NextResponse.json(prioritized);
  } catch (error: unknown) {
    console.error(`[API Action Center] ${error instanceof Error ? error.message : "Erro desconhecido"}`);
    return NextResponse.json({ error: "Não foi possível carregar as ações." }, { status: 500 });
  }
}

export async function PATCH(request: Request): Promise<NextResponse> {
  if (!hasSameOrigin(request)) return NextResponse.json({ error: "Origem da requisição inválida." }, { status: 403 });
  try {
    const decision = decisionSchema.parse(await request.json());
    const result = await prisma.$transaction(async (tx) => {
      const current = await tx.application.findUnique({ where: { id: decision.applicationId }, select: { id: true, status: true } });
      if (!current) throw new Error("Candidatura não encontrada.");
      if (current.status !== ApplicationStatus.DRAFT && current.status !== ApplicationStatus.MANUAL_ACTION) throw new Error("Esta candidatura não aceita mais decisões pendentes.");
      const change = decisionUpdate(decision, current.status);
      const application = await tx.application.update({ where: { id: current.id }, data: change.data });
      await tx.applicationEvent.create({ data: change.event });
      if (decision.action === "REGENERATE") {
        const dedupeKey = `material-regeneration:${current.id}`;
        const existingQueueItem = await tx.queueItem.findUnique({ where: { dedupe_key: dedupeKey }, select: { status: true } });
        if (existingQueueItem?.status === "PROCESSING") throw new Error("A regeneração dos materiais já está em andamento.");
        await tx.queueItem.upsert({
          where: { dedupe_key: dedupeKey },
          create: { type: "MATERIAL_REGENERATION", dedupe_key: dedupeKey, payload: { applicationId: current.id } },
          update: { status: "PENDING", attempts: 0, next_attempt_at: new Date(), completed_at: null, locked_at: null, locked_by: null, last_error: null, payload: { applicationId: current.id } },
        });
      }
      return application;
    });
    return NextResponse.json(result);
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Decisão inválida." }, { status: 400 });
  }
}