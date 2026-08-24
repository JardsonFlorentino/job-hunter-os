import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json(
      { status: "ok" },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error: unknown) {
    console.error("[HEALTH] Banco de dados indisponivel.", error);
    return NextResponse.json(
      { status: "indisponivel" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
