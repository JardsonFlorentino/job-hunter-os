import { FollowUpStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
const schema = z.object({ id: z.string().min(1), approved: z.boolean() });
export async function PATCH(request: Request): Promise<NextResponse> { try { const input = schema.parse(await request.json()); const result = await prisma.followUp.updateMany({ where: { id: input.id, status: FollowUpStatus.DRAFT }, data: { status: input.approved ? FollowUpStatus.APPROVED : FollowUpStatus.CANCELED, approved_at: input.approved ? new Date() : null } }); if (!result.count) return NextResponse.json({ error: "Acompanhamento não encontrado ou já decidido." }, { status: 409 }); return NextResponse.json({ ok: true }); } catch (error: unknown) { return NextResponse.json({ error: error instanceof Error ? error.message : "Dados inválidos" }, { status: 400 }); } }
