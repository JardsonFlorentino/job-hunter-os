import type { RuntimeConfig } from "../config/environment.js";
import type { PrismaClient } from "@prisma/client";

export interface EmailApplicationCandidate {
  company: string;
  matchScore: number;
  sentToday: number;
}

export interface PolicyDecision {
  allowed: boolean;
  reason: string;
}

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase("pt-BR");
}

export function evaluateAutomaticEmail(
  config: RuntimeConfig,
  candidate: EmailApplicationCandidate,
): PolicyDecision {
  if (config.DRY_RUN) return { allowed: false, reason: "DRY_RUN ativo" };
  if (config.EXTERNAL_ACTIONS_KILL_SWITCH) return { allowed: false, reason: "kill switch ativo" };
  if (config.APPLICATION_MODE !== "AUTO_EMAIL") return { allowed: false, reason: `modo ${config.APPLICATION_MODE}` };
  if (!config.ALLOW_EXTERNAL_EMAIL_SEND) return { allowed: false, reason: "envio externo nao autorizado" };
  if (candidate.matchScore < config.MIN_AUTO_EMAIL_SCORE) return { allowed: false, reason: "score abaixo do limite automatico" };
  if (candidate.sentToday >= config.MAX_APPLICATIONS_PER_DAY) return { allowed: false, reason: "limite diario atingido" };

  const company = normalize(candidate.company);
  const allowedCompanies = config.AUTO_EMAIL_COMPANY_ALLOWLIST.map(normalize);
  if (!allowedCompanies.includes(company)) return { allowed: false, reason: "empresa fora da allowlist" };

  return { allowed: true, reason: "politica de envio satisfeita" };
}

export async function getAutomaticEmailDecision(
  prisma: PrismaClient,
  config: RuntimeConfig,
  candidate: Omit<EmailApplicationCandidate, "sentToday">,
): Promise<PolicyDecision> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const sentToday = await prisma.emailLog.count({
    where: { sucesso: true, enviado_em: { gte: startOfDay } },
  });
  return evaluateAutomaticEmail(config, { ...candidate, sentToday });
}
