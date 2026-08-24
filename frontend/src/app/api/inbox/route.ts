import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";
export async function GET(): Promise<NextResponse> { try { return NextResponse.json(await prisma.inboxMessage.findMany({ orderBy: { received_at: "desc" }, take: 100, include: { application: { include: { opportunity: { include: { company: true } } } } } })); } catch { return NextResponse.json({ error: "Falha ao carregar inbox." }, { status: 500 }); } }
