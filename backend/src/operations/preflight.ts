import "dotenv/config";

import { PrismaClient } from "@prisma/client";

import { parseRuntimeConfig } from "../config/environment.js";

interface CheckResult {
  name: string;
  ok: boolean;
  detail: string;
  blocking: boolean;
}

function present(name: string): boolean {
  return Boolean(process.env[name]?.trim());
}

async function main(): Promise<void> {
  const checks: CheckResult[] = [];
  let config;
  try {
    config = parseRuntimeConfig(process.env);
    checks.push({ name: "config", ok: true, detail: "schema valido", blocking: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "erro desconhecido";
    checks.push({ name: "config", ok: false, detail: message, blocking: true });
    print(checks);
    process.exitCode = 1;
    return;
  }

  checks.push(
    { name: "safe-mode", ok: config.DRY_RUN && config.APPLICATION_MODE === "OBSERVE" && config.EXTERNAL_ACTIONS_KILL_SWITCH, detail: `dryRun=${config.DRY_RUN}; mode=${config.APPLICATION_MODE}; killSwitch=${config.EXTERNAL_ACTIONS_KILL_SWITCH}`, blocking: true },
    { name: "external-email", ok: !config.ALLOW_EXTERNAL_EMAIL_SEND, detail: `authorized=${config.ALLOW_EXTERNAL_EMAIL_SEND}; dailyLimit=${config.MAX_APPLICATIONS_PER_DAY}`, blocking: true },
    { name: "ai-provider", ok: true, detail: config.AI_PROVIDER, blocking: false },
    { name: "ai-secret", ok: config.AI_PROVIDER === "groq" ? present("GROQ_API_KEY") : present("OPENROUTER_API_KEY"), detail: (config.AI_PROVIDER === "groq" ? present("GROQ_API_KEY") : present("OPENROUTER_API_KEY")) ? "presente" : "ausente", blocking: false },
    { name: "smtp-secret", ok: present("SMTP_USER") && present("SMTP_PASSWORD"), detail: present("SMTP_USER") && present("SMTP_PASSWORD") ? "presente" : "incompleto", blocking: false },
    { name: "imap-secret", ok: present("IMAP_USER") && present("IMAP_PASSWORD"), detail: present("IMAP_USER") && present("IMAP_PASSWORD") ? "presente" : "incompleto", blocking: false },
  );

  const prisma = new PrismaClient();
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.push({ name: "database", ok: true, detail: "conectado", blocking: true });
    const [profiles, approvedFacts, preferences, targets, opportunities, applications] = await Promise.all([
      prisma.candidateProfile.count(),
      prisma.skill.count({ where: { approved: true } }),
      prisma.jobPreference.count(),
      prisma.careerPageTarget.count({ where: { enabled: true } }),
      prisma.opportunity.count(),
      prisma.application.count(),
    ]);
    checks.push(
      { name: "candidate-profile", ok: profiles > 0, detail: `${profiles} perfil(is)`, blocking: true },
      { name: "approved-career-data", ok: approvedFacts > 0, detail: `${approvedFacts} skill(s) aprovada(s)`, blocking: true },
      { name: "job-preferences", ok: preferences > 0, detail: `${preferences} preferencia(s)`, blocking: true },
      { name: "career-targets", ok: targets > 0, detail: `${targets} alvo(s) habilitado(s)`, blocking: false },
      { name: "history", ok: true, detail: `${opportunities} oportunidade(s); ${applications} candidatura(s)`, blocking: false },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "erro desconhecido";
    checks.push({ name: "database", ok: false, detail: message, blocking: true });
  } finally {
    await prisma.$disconnect();
  }

  print(checks);
  if (checks.some((check) => check.blocking && !check.ok)) process.exitCode = 1;
}

function print(checks: CheckResult[]): void {
  console.info("Job Hunter OS - preflight seguro (nenhum segredo e exibido)");
  for (const check of checks) {
    console.info(`${check.ok ? "PASS" : check.blocking ? "BLOCK" : "WARN"} | ${check.name} | ${check.detail}`);
  }
}

void main();
