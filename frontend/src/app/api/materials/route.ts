import { createHash } from "node:crypto";

import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  try {
    const materials = await prisma.generatedMaterial.findMany({
      orderBy: { created_at: "desc" },
      take: 100,
      select: { id: true, type: true, version: true, content_text: true, content_hash: true, model: true, prompt_version: true, created_at: true, application: { select: { id: true, opportunity: { select: { title: true, company: { select: { name: true } } } } } } },
    });
    return NextResponse.json(materials);
  } catch (error: unknown) {
    console.error(`[API Materials] ${error instanceof Error ? error.message : "Erro desconhecido"}`);
    return NextResponse.json({ error: "Não foi possível carregar os materiais." }, { status: 500 });
  }
}

const editSchema = z.object({ materialId: z.string().min(1), contentText: z.string().min(1) });

export async function PATCH(request: Request): Promise<NextResponse> {
  try {
    const payload = editSchema.parse(await request.json());
    const original = await prisma.generatedMaterial.findUniqueOrThrow({ where: { id: payload.materialId } });
    if (original.content_text === null) return NextResponse.json({ error: "Este material binário não pode ser editado como texto." }, { status: 400 });
    const latest = await prisma.generatedMaterial.aggregate({ where: { application_id: original.application_id, type: original.type }, _max: { version: true } });
    const created = await prisma.generatedMaterial.create({ data: {
      application_id: original.application_id, type: original.type, version: (latest._max.version ?? 0) + 1,
      content_text: payload.contentText, content_hash: createHash("sha256").update(payload.contentText).digest("hex"),
      model: null, prompt_version: "manual-edit",
    } });
    return NextResponse.json(created, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Payload inválido" }, { status: 400 });
  }
}
