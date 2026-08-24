import { JobSourcePlatform } from "@prisma/client";
import { z } from "zod";

import type { DiscoveredOpportunityInput } from "../opportunities/opportunity-repository.js";
import type { ConnectorContext, ConnectorHealth, DiscoveredJobReference, JobSourceConnector } from "./types.js";

function plainText(value: string): string {
  return value.replace(/&nbsp;|&#160;/gi, " ").replace(/&amp;/gi, "&").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&#39;|&apos;/gi, "'").replace(/&quot;/gi, '"').replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

abstract class CachedPublicConnector implements JobSourceConnector {
  abstract readonly name: string;
  abstract readonly platform: JobSourcePlatform;
  protected readonly cache = new Map<string, DiscoveredOpportunityInput>();
  protected abstract endpoint(): string;
  protected abstract load(signal: AbortSignal): Promise<DiscoveredOpportunityInput[]>;

  async healthCheck(context: ConnectorContext): Promise<ConnectorHealth> {
    const started = Date.now();
    const response = await fetch(this.endpoint(), { signal: context.signal, headers: { accept: "application/json" } });
    return { healthy: response.ok, latencyMs: Date.now() - started, message: `HTTP ${response.status}`, checkedAt: new Date() };
  }

  async discover(context: ConnectorContext): Promise<DiscoveredJobReference[]> {
    const jobs = await this.load(context.signal);
    this.cache.clear();
    for (const job of jobs) this.cache.set(job.url, job);
    return jobs.map((job) => ({ externalId: null, url: job.url, title: job.title, company: job.company, location: job.location ?? null }));
  }

  async enrich(reference: DiscoveredJobReference): Promise<DiscoveredOpportunityInput> {
    const cached = this.cache.get(reference.url);
    if (!cached) throw new Error(`Vaga não encontrada no cache do connector: ${reference.url}`);
    return cached;
  }
}

const greenhouseSchema = z.object({ jobs: z.array(z.object({ id: z.number(), title: z.string(), absolute_url: z.url(), location: z.object({ name: z.string() }), content: z.string().optional() })) });

export class GreenhouseConnector extends CachedPublicConnector {
  readonly name: string;
  readonly platform = JobSourcePlatform.GREENHOUSE;
  constructor(private readonly boardToken: string, private readonly companyName = boardToken) { super(); this.name = `greenhouse:${boardToken}`; }
  protected endpoint(): string { return `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(this.boardToken)}/jobs?content=true`; }
  protected async load(signal: AbortSignal): Promise<DiscoveredOpportunityInput[]> {
    const response = await fetch(this.endpoint(), { signal, headers: { accept: "application/json" } });
    if (!response.ok) throw new Error(`Greenhouse HTTP ${response.status}`);
    const parsed = greenhouseSchema.parse(await response.json());
    return parsed.jobs.map((job) => ({ title: job.title, company: this.companyName, url: job.absolute_url, location: job.location.name || null, description: job.content ? plainText(job.content) : null }));
  }
}

const leverSchema = z.array(z.object({ id: z.string(), text: z.string(), hostedUrl: z.url(), categories: z.object({ location: z.string().optional() }).passthrough(), descriptionPlain: z.string().optional(), additionalPlain: z.string().optional() }));

export class LeverConnector extends CachedPublicConnector {
  readonly name: string;
  readonly platform = JobSourcePlatform.LEVER;
  constructor(private readonly siteName: string, private readonly companyName = siteName, private readonly region: "global" | "eu" = "global") { super(); this.name = `lever:${siteName}`; }
  protected endpoint(): string { const host = this.region === "eu" ? "api.eu.lever.co" : "api.lever.co"; return `https://${host}/v0/postings/${encodeURIComponent(this.siteName)}?mode=json`; }
  protected async load(signal: AbortSignal): Promise<DiscoveredOpportunityInput[]> {
    const response = await fetch(this.endpoint(), { signal, headers: { accept: "application/json" } });
    if (!response.ok) throw new Error(`Lever HTTP ${response.status}`);
    const jobs = leverSchema.parse(await response.json());
    return jobs.map((job) => ({ title: job.text, company: this.companyName, url: job.hostedUrl, location: job.categories.location ?? null, description: [job.descriptionPlain, job.additionalPlain].filter(Boolean).join("\n\n") || null }));
  }
}

const ashbySchema = z.object({ jobs: z.array(z.object({ title: z.string(), location: z.string().nullable().optional(), jobUrl: z.url(), descriptionPlain: z.string().nullable().optional(), descriptionHtml: z.string().nullable().optional(), compensation: z.string().nullable().optional(), isListed: z.boolean().optional() }).passthrough()) });

export class AshbyConnector extends CachedPublicConnector {
  readonly name: string;
  readonly platform = JobSourcePlatform.ASHBY;
  constructor(private readonly boardName: string, private readonly companyName = boardName) { super(); this.name = `ashby:${boardName}`; }
  protected endpoint(): string { return `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(this.boardName)}?includeCompensation=true`; }
  protected async load(signal: AbortSignal): Promise<DiscoveredOpportunityInput[]> {
    const response = await fetch(this.endpoint(), { signal, headers: { accept: "application/json" } });
    if (!response.ok) throw new Error(`Ashby HTTP ${response.status}`);
    const parsed = ashbySchema.parse(await response.json());
    return parsed.jobs.filter((job) => job.isListed !== false).map((job) => ({ title: job.title, company: this.companyName, url: job.jobUrl, location: job.location ?? null, description: job.descriptionPlain ?? (job.descriptionHtml ? plainText(job.descriptionHtml) : null), salaryText: job.compensation ?? null }));
  }
}

const smartListSchema = z.object({ content: z.array(z.object({ id: z.string(), name: z.string(), company: z.object({ name: z.string(), identifier: z.string() }), location: z.object({ city: z.string().optional(), region: z.string().optional(), country: z.string().optional(), remote: z.boolean().optional() }).optional() })) });
const smartDetailSchema = z.object({ id: z.string(), name: z.string(), company: z.object({ name: z.string(), identifier: z.string() }), location: z.object({ city: z.string().optional(), region: z.string().optional(), country: z.string().optional(), remote: z.boolean().optional() }).optional(), applyUrl: z.url().optional(), jobAd: z.object({ companyDescription: z.string().optional(), jobDescription: z.string().optional(), qualifications: z.string().optional(), additionalInformation: z.string().optional() }).optional() }).passthrough();

export class SmartRecruitersConnector extends CachedPublicConnector {
  readonly name: string;
  readonly platform = JobSourcePlatform.SMARTRECRUITERS;
  constructor(private readonly companyIdentifier: string, private readonly companyName = companyIdentifier) { super(); this.name = `smartrecruiters:${companyIdentifier}`; }
  protected endpoint(): string { return `https://api.smartrecruiters.com/v1/companies/${encodeURIComponent(this.companyIdentifier)}/postings?limit=100`; }
  protected async load(signal: AbortSignal): Promise<DiscoveredOpportunityInput[]> {
    const response = await fetch(this.endpoint(), { signal, headers: { accept: "application/json" } });
    if (!response.ok) throw new Error(`SmartRecruiters HTTP ${response.status}`);
    const listing = smartListSchema.parse(await response.json());
    const jobs: DiscoveredOpportunityInput[] = [];
    for (const item of listing.content) {
      const detailUrl = `https://api.smartrecruiters.com/v1/companies/${encodeURIComponent(this.companyIdentifier)}/postings/${encodeURIComponent(item.id)}`;
      const detailResponse = await fetch(detailUrl, { signal, headers: { accept: "application/json" } });
      if (!detailResponse.ok) throw new Error(`SmartRecruiters detalhe HTTP ${detailResponse.status}`);
      const detail = smartDetailSchema.parse(await detailResponse.json());
      const locationParts = [detail.location?.remote ? "Remoto" : null, detail.location?.city, detail.location?.region, detail.location?.country].filter(Boolean);
      const description = detail.jobAd ? Object.values(detail.jobAd).filter((part): part is string => typeof part === "string" && part.length > 0).map((part) => plainText(part)).join("\n\n") : null;
      jobs.push({ title: detail.name, company: detail.company.name || this.companyName, url: detail.applyUrl ?? `https://jobs.smartrecruiters.com/${this.companyIdentifier}/${detail.id}`, location: locationParts.join(", ") || null, description });
    }
    return jobs;
  }
}

const workableSchema = z.object({ jobs: z.array(z.object({
  title: z.string(), shortcode: z.string().optional(), url: z.url().optional(), shortlink: z.url().optional(),
  description: z.string().nullable().optional(), description_html: z.string().nullable().optional(),
  location: z.union([z.string(), z.object({ location_str: z.string().nullable().optional() }).passthrough()]).nullable().optional(),
}).passthrough()) });

export class WorkableConnector extends CachedPublicConnector {
  readonly name: string;
  readonly platform = JobSourcePlatform.WORKABLE;
  constructor(private readonly accountSubdomain: string, private readonly companyName = accountSubdomain) { super(); this.name = `workable:${accountSubdomain}`; }
  protected endpoint(): string { return `https://www.workable.com/api/accounts/${encodeURIComponent(this.accountSubdomain)}?details=true`; }
  protected async load(signal: AbortSignal): Promise<DiscoveredOpportunityInput[]> {
    const response = await fetch(this.endpoint(), { signal, headers: { accept: "application/json" } });
    if (!response.ok) throw new Error(`Workable HTTP ${response.status}`);
    const parsed = workableSchema.parse(await response.json());
    return parsed.jobs.flatMap((job) => {
      const url = job.url ?? job.shortlink ?? (job.shortcode ? `https://apply.workable.com/j/${encodeURIComponent(job.shortcode)}` : null);
      if (!url) return [];
      const location = typeof job.location === "string" ? job.location : job.location?.location_str ?? null;
      const description = job.description ?? (job.description_html ? plainText(job.description_html) : null);
      return [{ title: job.title, company: this.companyName, url, location, description }];
    });
  }
}

export { plainText as htmlToPlainText };
