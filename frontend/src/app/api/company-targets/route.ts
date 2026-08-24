import { JobSourcePlatform } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const supportedPlatforms = ["GREENHOUSE", "LEVER", "ASHBY", "WORKABLE", "SMARTRECRUITERS", "GUPY", "INDEED", "COMPANY_SITE"] as const;
const targetSchema = z.object({
  name: z.string().trim().min(2).max(120), careersUrl: z.url(), platform: z.enum(supportedPlatforms),
  identifier: z.string().trim().max(120).nullable().optional(), enabled: z.boolean().default(false), priority: z.number().int().min(0).max(100).default(0), notes: z.string().trim().max(1_000).nullable().optional(),
});
const updateSchema = targetSchema.partial().extend({ id: z.string().cuid() });

export async function GET() {
  return NextResponse.json(await prisma.careerPageTarget.findMany({ orderBy: [{ priority: "desc" }, { name: "asc" }] }));
}

export async function POST(request: Request) {
  const parsed = targetSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const target = await prisma.careerPageTarget.create({ data: { name: parsed.data.name, careers_url: parsed.data.careersUrl, platform: JobSourcePlatform[parsed.data.platform], identifier: parsed.data.identifier ?? null, enabled: parsed.data.enabled, priority: parsed.data.priority, notes: parsed.data.notes ?? null } });
  return NextResponse.json(target, { status: 201 });
}

export async function PATCH(request: Request) {
  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { id, ...values } = parsed.data;
  const target = await prisma.careerPageTarget.update({ where: { id }, data: {
    ...(values.name !== undefined ? { name: values.name } : {}), ...(values.careersUrl !== undefined ? { careers_url: values.careersUrl } : {}),
    ...(values.platform !== undefined ? { platform: JobSourcePlatform[values.platform] } : {}), ...(values.identifier !== undefined ? { identifier: values.identifier } : {}),
    ...(values.enabled !== undefined ? { enabled: values.enabled } : {}), ...(values.priority !== undefined ? { priority: values.priority } : {}), ...(values.notes !== undefined ? { notes: values.notes } : {}),
  } });
  return NextResponse.json(target);
}

export async function DELETE(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id || !z.string().cuid().safeParse(id).success) return NextResponse.json({ error: "ID inválido." }, { status: 400 });
  await prisma.careerPageTarget.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
