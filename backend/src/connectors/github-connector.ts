import { JobSourcePlatform } from "@prisma/client";
import { chromium, type Browser, type Page } from "playwright";

import { extractContactEmail, readGithubIssueDescription } from "../bot/github-scraper.js";
import type { ConnectorContext, ConnectorHealth, DiscoveredJobReference, JobSourceConnector } from "./types.js";

const REPOSITORIES = ["frontendbr/vagas", "backend-br/vagas"] as const;
const TIMEOUT_MS = 30_000;

function companyFromTitle(title: string): string {
  for (const pattern of [/\bna\s+([^|]+)$/i, /\bat\s+([^|]+)$/i, /\s[-–—]\s([^|]+)$/]) {
    const value = title.match(pattern)?.[1]?.trim();
    if (value) return value;
  }
  return "Não informada";
}

function locationFromTitle(title: string): string | null {
  return title.match(/^\s*\[([^\]]+)]/)?.[1]?.trim() ?? null;
}

export class GithubConnector implements JobSourceConnector {
  readonly name = "github-public-issues";
  readonly platform = JobSourcePlatform.GITHUB;
  private browser: Browser | null = null;
  private detailPage: Page | null = null;

  async healthCheck(context: ConnectorContext): Promise<ConnectorHealth> {
    const started = Date.now();
    const response = await fetch("https://github.com/frontendbr/vagas/issues", { signal: context.signal });
    return { healthy: response.ok, latencyMs: Date.now() - started, message: `HTTP ${response.status}`, checkedAt: new Date() };
  }

  async discover(context: ConnectorContext): Promise<DiscoveredJobReference[]> {
    this.browser ??= await chromium.launch({ headless: true });
    const page = await this.browser.newPage();
    this.detailPage ??= await this.browser.newPage();
    const discovered = new Map<string, DiscoveredJobReference>();
    for (const repository of REPOSITORIES) {
      if (context.signal.aborted) throw new Error("Descoberta GitHub cancelada.");
      await page.goto(`https://github.com/${repository}/issues`, { waitUntil: "domcontentloaded", timeout: TIMEOUT_MS });
      const issues = await page.locator(`a[href^="/${repository}/issues/"]`).evaluateAll((anchors, repo) => anchors.map((anchor) => ({ title: anchor.textContent?.trim() ?? "", path: anchor.getAttribute("href") ?? "" })).filter((issue) => issue.title && new RegExp(`^/${repo.replace("/", "\\/")}/issues/\\d+$`).test(issue.path)), repository);
      for (const issue of issues) {
        const url = new URL(issue.path, "https://github.com").toString();
        discovered.set(url, { externalId: issue.path, url, title: issue.title, company: companyFromTitle(issue.title), location: locationFromTitle(issue.title) });
      }
    }
    await page.close();
    return [...discovered.values()];
  }

  async enrich(reference: DiscoveredJobReference): Promise<{ title: string; company: string; url: string; location: string | null; description: string | null; contactEmail: string | null }> {
    if (!this.detailPage) throw new Error("Connector GitHub não foi inicializado.");
    await this.detailPage.goto(reference.url, { waitUntil: "domcontentloaded", timeout: TIMEOUT_MS });
    const description = await readGithubIssueDescription(this.detailPage);
    return { title: reference.title, company: reference.company, url: reference.url, location: reference.location, description, contactEmail: extractContactEmail(description) };
  }

  async dispose(): Promise<void> {
    await this.browser?.close();
    this.browser = null;
    this.detailPage = null;
  }
}
