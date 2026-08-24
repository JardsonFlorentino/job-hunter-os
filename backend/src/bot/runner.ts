import { runtimeConfig } from "../config/runtime.js";
import { executeConnector } from "../connectors/executor.js";
import { GithubConnector } from "../connectors/github-connector.js";
import { LinkedinConnector } from "../connectors/linkedin-connector.js";
import { AshbyConnector, GreenhouseConnector, LeverConnector, SmartRecruitersConnector, WorkableConnector } from "../connectors/public-ats-connectors.js";
import type { JobSourceConnector } from "../connectors/types.js";
import { loadTargetConnectors } from "../connectors/target-registry.js";
import { prisma } from "../prisma/client.js";

const DEFAULT_LINKEDIN_SEARCH_TERM = "Desenvolvedor Front-end Júnior";

function target(value: string): [string, string] {
  const [identifier, label] = value.split("|", 2);
  return [identifier?.trim() ?? "", label?.trim() || identifier?.trim() || "Não informada"];
}

async function runConnector(connector: JobSourceConnector): Promise<void> {
  try {
    const result = await executeConnector(connector, prisma, new AbortController().signal);
    console.info(`[Scraper Runner] ${connector.name}: ${result.persisted}/${result.discovered} oportunidades persistidas.`);
  } catch (error: unknown) {
    console.error(`[Scraper Runner] ${connector.name} falhou: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
  }
}

export async function runAllScrapers(): Promise<void> {
  try {
    try {
      if (!runtimeConfig.ENABLE_GITHUB_SCRAPER) {
        console.info("[Scraper Runner] GitHub desabilitado por configuração.");
      } else {
      const result = await executeConnector(new GithubConnector(), prisma, new AbortController().signal);
      console.info(`[Scraper Runner] GitHub: ${result.persisted}/${result.discovered} oportunidades persistidas.`);
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Erro desconhecido";
      console.error(`[Scraper Runner] GitHub falhou: ${message}`);
    }

    try {
      if (!runtimeConfig.ENABLE_LINKEDIN_SCRAPER) {
        console.info("[Scraper Runner] LinkedIn desabilitado por configuração.");
      } else {
      const result = await executeConnector(new LinkedinConnector(DEFAULT_LINKEDIN_SEARCH_TERM), prisma, new AbortController().signal);
      console.info(`[Scraper Runner] LinkedIn: ${result.persisted}/${result.discovered} oportunidades persistidas.`);
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Erro desconhecido";
      console.error(`[Scraper Runner] LinkedIn falhou: ${message}`);
    }

    if (runtimeConfig.ENABLE_ATS_CONNECTORS) {
      const connectors: JobSourceConnector[] = [
        ...runtimeConfig.GREENHOUSE_BOARDS.map((entry) => { const [id, name] = target(entry); return new GreenhouseConnector(id, name); }),
        ...runtimeConfig.LEVER_SITES.map((entry) => { const [id, name] = target(entry); return new LeverConnector(id, name); }),
        ...runtimeConfig.ASHBY_BOARDS.map((entry) => { const [id, name] = target(entry); return new AshbyConnector(id, name); }),
        ...runtimeConfig.SMARTRECRUITERS_COMPANIES.map((entry) => { const [id, name] = target(entry); return new SmartRecruitersConnector(id, name); }),
        ...runtimeConfig.WORKABLE_ACCOUNTS.map((entry) => { const [id, name] = target(entry); return new WorkableConnector(id, name); }),
        ...await loadTargetConnectors(prisma),
      ];
      for (const connector of connectors) await runConnector(connector);
    }
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Erro desconhecido";
    console.error(`[Scraper Runner] Falha inesperada: ${message}`);
  }
}
