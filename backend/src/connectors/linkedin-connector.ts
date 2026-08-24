import { JobSourcePlatform } from "@prisma/client";
import { chromium, type Browser, type Page } from "playwright";

import { extractJobDescription, extractJobs, normalizeLinkedinUrl } from "../bot/linkedin-scraper.js";
import type { ConnectorContext, ConnectorHealth, DiscoveredJobReference, JobSourceConnector } from "./types.js";

const SEARCH_URL = "https://www.linkedin.com/jobs/search/";
const BRAZIL_GEO_ID = "106057199";
const MAX_RESULTS_PER_RUN = 10;

export function isBrazilLocation(location: string | null): boolean {
  if (!location) return false;
  const normalized = location.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (/\b(brasil|brazil)\b/.test(normalized)) return true;
  if (/\b(recife|maceio)\b/.test(normalized)) return true;
  return /,\s*(ac|al|ap|am|ba|ce|df|es|go|ma|mt|ms|mg|pa|pb|pr|pe|pi|rj|rn|rs|ro|rr|sc|sp|se|to)\b/i.test(location);
}

export class LinkedinConnector implements JobSourceConnector {
  readonly name = "linkedin-public-jobs";
  readonly platform = JobSourcePlatform.LINKEDIN;
  private browser: Browser | null = null;
  private detailPage: Page | null = null;

  constructor(private readonly searchTerm: string, private readonly location = "Brasil") {
    if (!searchTerm.trim()) throw new Error("Termo de busca do LinkedIn vazio.");
  }

  async healthCheck(context: ConnectorContext): Promise<ConnectorHealth> {
    const started = Date.now();
    const response = await fetch("https://www.linkedin.com/jobs/", { signal: context.signal, redirect: "follow" });
    return { healthy: response.ok, latencyMs: Date.now() - started, message: `HTTP ${response.status}`, checkedAt: new Date() };
  }

  async discover(context: ConnectorContext): Promise<DiscoveredJobReference[]> {
    if (context.signal.aborted) throw new Error("Descoberta LinkedIn cancelada.");
    this.browser ??= await chromium.launch({ headless: true });
    const page = await this.browser.newPage({ locale: "pt-BR" });
    this.detailPage ??= await this.browser.newPage({ locale: "pt-BR" });
    const url = new URL(SEARCH_URL);
    url.searchParams.set("keywords", this.searchTerm.trim());
    url.searchParams.set("location", this.location);
    url.searchParams.set("geoId", BRAZIL_GEO_ID);
    url.searchParams.set("f_TPR", "r604800");
    await page.goto(url.toString(), { waitUntil: "domcontentloaded", timeout: 30_000 });
    const jobs = await extractJobs(page);
    await page.close();
    const unique = new Map<string, DiscoveredJobReference>();
    for (const job of jobs) {
      try {
        const normalizedUrl = normalizeLinkedinUrl(job.link);
        unique.set(normalizedUrl, { externalId: normalizedUrl.match(/\/jobs\/view\/(\d+)/)?.[1] ?? null, url: normalizedUrl, title: job.titulo, company: job.empresa, location: job.localizacao });
      } catch { /* URL inválida */ }
    }
    return [...unique.values()].filter((job) => isBrazilLocation(job.location)).slice(0, MAX_RESULTS_PER_RUN);
  }

  async enrich(reference: DiscoveredJobReference): Promise<{ title: string; company: string; url: string; location: string | null; description: string | null; contactEmail: string | null }> {
    if (!this.detailPage) throw new Error("Connector LinkedIn não foi inicializado.");
    const description = await extractJobDescription(this.detailPage, reference.url);
    const contactEmail = description?.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0]?.toLowerCase() ?? null;
    return { title: reference.title, company: reference.company, url: reference.url, location: reference.location, description, contactEmail };
  }

  async dispose(): Promise<void> {
    await this.browser?.close();
    this.browser = null;
    this.detailPage = null;
  }
}
