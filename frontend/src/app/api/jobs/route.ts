import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  try {
    const profile = await prisma.candidateProfile.findFirst({ orderBy: { updated_at: "desc" }, select: { id: true } });
    const jobs = await prisma.job.findMany({
      orderBy: { updated_at: "desc" },
      include: {
        email_logs: {
          orderBy: { enviado_em: "desc" },
          take: 1,
          select: { enviado_em: true, sucesso: true, destinatario: true },
        },
        opportunity: {
          select: {
            id: true,
            sources: { orderBy: { discovered_at: "asc" }, select: { id: true, platform: true, canonical_url: true } },
            assessments: profile ? { where: { profile_id: profile.id }, orderBy: { created_at: "desc" }, take: 1, select: { decision: true, match_score: true, strengths: true, gaps: true, risks: true, strategy: true, description_sufficient: true } } : false,
          },
        },
      },
    });
    const seen = new Set<string>();
    const grouped = jobs.filter((job) => {
      const key = job.opportunity?.id ?? job.id;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    return NextResponse.json(grouped);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    console.error(`[API Jobs] Falha ao buscar vagas: ${message}`);
    return NextResponse.json(
      { error: "Não foi possível carregar as vagas." },
      { status: 500 },
    );
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function PATCH(request: Request): Promise<NextResponse> {
  try {
    const body: unknown = await request.json();
    if (!isRecord(body) || typeof body.id !== "string" || !body.id.trim()) {
      return NextResponse.json({ error: "ID da vaga inválido." }, { status: 400 });
    }

    const job = await prisma.job.update({
      where: { id: body.id.trim() },
      data: { status: "PENDENTE" },
    });

    console.info(`[API Jobs] Vaga ${job.id} devolvida à fila por intervenção manual.`);
    return NextResponse.json(job);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    console.error(`[API Jobs] Falha na intervenção manual: ${message}`);
    return NextResponse.json({ error: "Não foi possível devolver a vaga à fila." }, { status: 500 });
  }
}
