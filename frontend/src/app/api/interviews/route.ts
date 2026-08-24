import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";
export async function GET(): Promise<NextResponse> { try { return NextResponse.json(await prisma.interview.findMany({ orderBy: [{ scheduled_at: "asc" }, { created_at: "desc" }], include: { application: { include: { opportunity: { include: { company: true, requirements: true } } } } } })); } catch { return NextResponse.json({ error: "Falha ao carregar entrevistas." }, { status: 500 }); } }
