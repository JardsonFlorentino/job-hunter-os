import { ApplicationEventType, ApplicationStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const schema = z.object({ url: z.url(), kind: z.literal("SUBMISSION_CONFIRMED") });

function canonical(raw: string): string {
  const url = new URL(raw); url.hash = "";
  const retained = new URLSearchParams();
  for (const key of ["currentJobId", "jobId", "gh_jid"]) { const value = url.searchParams.get(key); if (value) retained.set(key, value); }
  url.search = retained.toString(); url.hostname = url.hostname.toLowerCase(); url.pathname = url.pathname.replace(/\/$/, "");
  return url.toString();
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const payload = schema.parse(await request.json());
    const source = await prisma.jobSource.findFirst({ where: { OR: [{ raw_url: payload.url }, { canonical_url: canonical(payload.url) }] }, include: { opportunity: { include: { applications: { orderBy: { created_at: "desc" }, take: 1 } } } } });
    const application = source?.opportunity.applications[0];
    if (!application) return NextResponse.json({ error: "Candidatura não encontrada." }, { status: 404 });
    await prisma.$transaction([
      prisma.application.update({ where: { id: application.id }, data: { status: ApplicationStatus.SUBMITTED, submitted_at: application.submitted_at ?? new Date(), channel: application.channel ?? "ASSISTED_EXTENSION" } }),
      prisma.applicationEvent.create({ data: { application_id: application.id, type: ApplicationEventType.SUBMITTED, from_status: application.status, to_status: ApplicationStatus.SUBMITTED, message: "Confirmação de envio detectada pela extensão assistida." } }),
    ]);
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Payload inválido" }, { status: 400 });
  }
}
