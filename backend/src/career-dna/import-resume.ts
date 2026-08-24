import "dotenv/config";

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";
import { PDFParse } from "pdf-parse";

const prisma = new PrismaClient();

const HEADINGS = ["RESUMO", "COMPETÊNCIAS TÉCNICAS", "EXPERIÊNCIA PROFISSIONAL", "PROJETOS", "FORMAÇÃO", "IDIOMAS"] as const;
type ResumeHeading = (typeof HEADINGS)[number];

export function splitResumeSections(rawText: string): Partial<Record<ResumeHeading, string>> {
  const normalized = rawText.replace(/-- \d+ of \d+ --/g, "").replace(/\r/g, "").trim();
  const result: Partial<Record<ResumeHeading, string>> = {};
  for (const [index, heading] of HEADINGS.entries()) {
    const start = normalized.indexOf(heading);
    if (start < 0) continue;
    const laterStarts = HEADINGS.slice(index + 1).map((candidate) => normalized.indexOf(candidate, start + heading.length)).filter((position) => position >= 0);
    const end = laterStarts.length > 0 ? Math.min(...laterStarts) : normalized.length;
    result[heading] = normalized.slice(start + heading.length, end).trim();
  }
  return result;
}

export async function importResume(pdfPath: string): Promise<string> {
  const absolutePath = resolve(pdfPath);
  const file = await readFile(absolutePath);
  const sourceSha256 = createHash("sha256").update(file).digest("hex");
  const parser = new PDFParse({ data: file });
  try {
    const extracted = await parser.getText();
    const profile = await prisma.candidateProfile.findFirst({ orderBy: { updated_at: "desc" }, select: { id: true } });
    if (!profile) throw new Error("Configure o perfil principal antes de importar o currículo.");
    const record = await prisma.resumeImport.upsert({
      where: { source_sha256: sourceSha256 },
      create: { profile_id: profile.id, original_name: basename(absolutePath), source_sha256: sourceSha256, raw_text: extracted.text, proposals: splitResumeSections(extracted.text) },
      update: { original_name: basename(absolutePath), raw_text: extracted.text, proposals: splitResumeSections(extracted.text), status: "PENDING_REVIEW", reviewed_at: null },
      select: { id: true },
    });
    return record.id;
  } finally {
    await parser.destroy();
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const inputPath = process.argv[2];
  if (!inputPath) {
    console.error("Uso: npm run career:import-resume -- <caminho-do-pdf>");
    process.exitCode = 1;
  } else {
    importResume(inputPath)
      .then((id) => console.info(`[Career DNA] Currículo importado como pendente: ${id}`))
      .catch((error: unknown) => { console.error(`[Career DNA] Falha na importação: ${error instanceof Error ? error.message : "Erro desconhecido"}`); process.exitCode = 1; })
      .finally(() => prisma.$disconnect());
  }
}
