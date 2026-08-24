import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface ProfilePayload {
  nome?: string;
  email?: string;
  telefone?: string | null;
  localizacao?: string | null;
  github?: string | null;
  linkedin?: string | null;
  portfolio?: string | null;
  pretensao_clt?: string | null;
  pretensao_pj?: string | null;
  anos_experiencia?: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseOptionalMoney(
  value: unknown,
  fieldName: string,
): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;

  if (typeof value !== "string") {
    throw new Error(`${fieldName} deve ser enviado como texto.`);
  }

  const normalized = value.replace(",", ".").trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) {
    throw new Error(`${fieldName} deve ser um valor monetário válido.`);
  }

  return normalized;
}

function parsePayload(value: unknown): ProfilePayload {
  if (!isRecord(value)) {
    throw new Error("O corpo da requisição deve ser um objeto JSON.");
  }

  const payload: ProfilePayload = {};

  if (value.nome !== undefined) {
    if (typeof value.nome !== "string" || !value.nome.trim()) {
      throw new Error("Nome inválido.");
    }
    payload.nome = value.nome.trim();
  }

  if (value.email !== undefined) {
    if (
      typeof value.email !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email)
    ) {
      throw new Error("E-mail inválido.");
    }
    payload.email = value.email.trim().toLowerCase();
  }

  for (const field of ["telefone", "localizacao"] as const) {
    const fieldValue = value[field];
    if (fieldValue !== undefined && fieldValue !== null && typeof fieldValue !== "string") {
      throw new Error(`${field} deve ser enviado como texto.`);
    }
    if (typeof fieldValue === "string") {
      const normalized = fieldValue.trim();
      if (normalized.length > 120) throw new Error(`${field} excede o tamanho permitido.`);
      payload[field] = normalized || null;
    } else if (fieldValue === null) {
      payload[field] = null;
    }
  }

  for (const field of ["github", "linkedin", "portfolio"] as const) {
    const fieldValue = value[field];
    if (fieldValue !== undefined && fieldValue !== null && typeof fieldValue !== "string") {
      throw new Error(`${field} deve ser enviado como texto.`);
    }
    if (typeof fieldValue === "string" && fieldValue.trim()) {
      try {
        payload[field] = new URL(fieldValue.trim()).toString();
      } catch {
        throw new Error(`${field} deve conter uma URL válida.`);
      }
    } else if (fieldValue === null || fieldValue === "") {
      payload[field] = null;
    }
  }

  payload.pretensao_clt = parseOptionalMoney(value.pretensao_clt, "Pretensão CLT");
  payload.pretensao_pj = parseOptionalMoney(value.pretensao_pj, "Pretensão PJ");

  if (value.anos_experiencia !== undefined) {
    if (
      typeof value.anos_experiencia !== "number" ||
      !Number.isInteger(value.anos_experiencia) ||
      value.anos_experiencia < 0 ||
      value.anos_experiencia > 80
    ) {
      throw new Error("Anos de experiência deve ser um inteiro entre 0 e 80.");
    }
    payload.anos_experiencia = value.anos_experiencia;
  }

  return payload;
}

export async function GET(): Promise<NextResponse> {
  try {
    const profile = await prisma.candidateProfile.findFirst({
      orderBy: { updated_at: "desc" },
    });
    return NextResponse.json(profile);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    console.error(`[API Profile] Falha ao buscar perfil: ${message}`);
    return NextResponse.json(
      { error: "Não foi possível carregar o perfil." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const payload = parsePayload(await request.json());
    const currentProfile = await prisma.candidateProfile.findFirst({
      orderBy: { updated_at: "desc" },
    });

    if (!currentProfile && (!payload.nome || !payload.email)) {
      return NextResponse.json(
        { error: "Nome e e-mail são obrigatórios para criar o perfil." },
        { status: 400 },
      );
    }

    const moneyValue = (
      value: string | null | undefined,
    ): Prisma.Decimal | null | undefined =>
      typeof value === "string" ? new Prisma.Decimal(value) : value;

    const profile = currentProfile
      ? await prisma.candidateProfile.update({
          where: { id: currentProfile.id },
          data: {
            nome: payload.nome,
            email: payload.email,
            telefone: payload.telefone,
            localizacao: payload.localizacao,
            github: payload.github,
            linkedin: payload.linkedin,
            portfolio: payload.portfolio,
            pretensao_clt: moneyValue(payload.pretensao_clt),
            pretensao_pj: moneyValue(payload.pretensao_pj),
            anos_experiencia: payload.anos_experiencia,
          },
        })
      : await prisma.candidateProfile.create({
          data: {
            nome: payload.nome as string,
            email: payload.email as string,
            telefone: payload.telefone ?? null,
            localizacao: payload.localizacao ?? null,
            github: payload.github ?? null,
            linkedin: payload.linkedin ?? null,
            portfolio: payload.portfolio ?? null,
            pretensao_clt: moneyValue(payload.pretensao_clt) ?? null,
            pretensao_pj: moneyValue(payload.pretensao_pj) ?? null,
            anos_experiencia: payload.anos_experiencia ?? 1,
          },
        });

    return NextResponse.json(profile);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    console.error(`[API Profile] Falha ao salvar perfil: ${message}`);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
