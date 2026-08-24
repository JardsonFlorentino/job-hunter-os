import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  try {
    const profile = await prisma.candidateProfile.findFirst({ orderBy: { updated_at: "desc" }, select: { id: true } });
    if (!profile) return NextResponse.json([]);
    const applications = await prisma.application.findMany({
      where: { profile_id: profile.id, status: { in: ["DRAFT", "MANUAL_ACTION"] } },
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
