import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function canonical(raw: string): string {
  const url = new URL(raw); url.hash = "";
  const retained = new URLSearchParams();
  for (const key of ["currentJobId", "jobId", "gh_jid"]) { const value = url.searchParams.get(key); if (value) retained.set(key, value); }
  url.search = retained.toString(); url.hostname = url.hostname.toLowerCase(); url.pathname = url.pathname.replace(/\/$/, "");
  return url.toString();
}

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const rawUrl = z.url().parse(new URL(request.url).searchParams.get("url"));
    const canonicalUrl = canonical(rawUrl);
    const profile = await prisma.candidateProfile.findFirst({
      orderBy: { updated_at: "desc" },
      select: { id: true, nome: true, email: true, github: true, linkedin: true, portfolio: true, approved_answers: { where: { approved: true }, select: { question_key: true, answer: true } } },
    });
    if (!profile) return NextResponse.json({ error: "Perfil não configurado." }, { status: 404 });
    const source = await prisma.jobSource.findFirst({ where: { OR: [{ canonical_url: canonicalUrl }, { raw_url: rawUrl }] }, include: {
      opportunity: { include: { company: true, assessments: { where: { profile_id: profile.id }, orderBy: { created_at: "desc" }, take: 1 }, applications: { where: { profile_id: profile.id }, take: 1 } } },
    } });
    if (!source) return NextResponse.json({ found: false, profile: { nome: profile.nome, email: profile.email } });
    return NextResponse.json({
      found: true,
      opportunity: { id: source.opportunity.id, title: source.opportunity.title, company: source.opportunity.company.name, assessment: source.opportunity.assessments[0] ?? null, alreadyApplied: source.opportunity.applications.some((application) => ["SUBMITTED", "TEST", "INTERVIEW", "OFFER"].includes(application.status)) },
      profile: { nome: profile.nome, email: profile.email, github: profile.github, linkedin: profile.linkedin, portfolio: profile.portfolio, approvedAnswers: Object.fromEntries(profile.approved_answers.map((answer) => [answer.question_key, answer.answer])) },
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "URL inválida" }, { status: 400 });
  }
}
