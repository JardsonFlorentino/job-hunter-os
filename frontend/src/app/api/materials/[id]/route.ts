import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  try {
    const { id } = await context.params;
    const material = await prisma.generatedMaterial.findUniqueOrThrow({ where: { id }, select: { type: true, content_data: true } });
    if (material.content_data === null || material.type !== "CV_VISUAL") return NextResponse.json({ error: "PDF não disponível." }, { status: 404 });
    const pdf = Uint8Array.from(material.content_data).buffer;
    return new Response(pdf, { headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="job-hunter-${id}.pdf"`, "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ error: "Material não encontrado." }, { status: 404 });
  }
}
