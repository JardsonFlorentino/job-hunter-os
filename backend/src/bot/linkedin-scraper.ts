import { chromium, type Browser, type Page } from "playwright";

import { prisma } from "../prisma/client.js";
import { saveDiscoveredJob } from "../jobs/job-repository.js";

const LINKEDIN_JOBS_URL = "https://www.linkedin.com/jobs/search/";
const NAVIGATION_TIMEOUT_MS = 30_000;
const RESULTS_TIMEOUT_MS = 15_000;

interface ScrapedLinkedinJob {
  titulo: string;
  empresa: string;
  link: string;
  localizacao: string | null;
  descricao: string | null;
  contato_email: string | null;
}

const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;

export function normalizeJobDescription(value: string): string {
  const namedEntities: Record<string, string> = { nbsp: " ", amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>|<\/li>|<\/div>|<\/h[1-6]>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (entity, code: string) => {
      if (code.startsWith("#x")) return String.fromCodePoint(Number.parseInt(code.slice(2), 16));
      if (code.startsWith("#")) return String.fromCodePoint(Number.parseInt(code.slice(1), 10));
      return namedEntities[code.toLowerCase()] ?? entity;
    })
    .replace(/[ \t]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
export async function readLinkedinJobDescription(page: Page): Promise<string | null> {
  const structuredDescription = await page.locator('script[type="application/ld+json"]').evaluateAll(
    (scripts) => {
      for (const script of scripts) {
        try {
          const parsed: unknown = JSON.parse(script.textContent ?? "null");
          const entries: unknown[] = Array.isArray(parsed) ? [...parsed] : [parsed];
          while (entries.length > 0) {
            const entry = entries.shift();
            if (typeof entry !== "object" || entry === null) continue;
            const record = entry as Record<string, unknown>;
            const types = Array.isArray(record["@type"]) ? record["@type"] : [record["@type"]];
            if (types.includes("JobPosting")) {
              const sections = [record.description, record.responsibilities, record.qualifications]
                .flatMap((value) => Array.isArray(value) ? value : [value])
                .filter((value): value is string => typeof value === "string" && value.trim().length > 0);
              if (sections.length > 0) return sections.join("\n\n");
            }
            for (const value of Object.values(record)) {
              if (Array.isArray(value)) entries.push(...value);
              else if (typeof value === "object" && value !== null) entries.push(value);
            }
          }
        } catch { /* JSON-LD inválido */ }
      }
      return null;
    },
  );

  if (structuredDescription) {
    const plainText = normalizeJobDescription(structuredDescription);
    if (plainText) return plainText;
  }

  const description = page.locator(
    ".show-more-less-html__markup, .description__text, .jobs-description__content, .jobs-box__html-content, [data-job-description], article [class*='description']",
  ).first();
  try {
    await description.waitFor({ state: "attached", timeout: 4_000 });
    const text = normalizeJobDescription(await description.innerText());
    if (text) return text;
  } catch { /* tenta metadados públicos abaixo */ }

  const metadata = await page.locator('meta[property="og:description"], meta[name="description"]').first().getAttribute("content").catch(() => null);
  const normalizedMetadata = metadata ? normalizeJobDescription(metadata) : "";
  return normalizedMetadata.length >= 80 ? normalizedMetadata : null;
}

export async function extractJobDescription(page: Page, url: string): Promise<string | null> {
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: NAVIGATION_TIMEOUT_MS });
    await page.waitForTimeout(750);
    try {
      return await readLinkedinJobDescription(page);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "";
      if (!message.includes("Execution context was destroyed")) throw error;
      await page.waitForTimeout(1_000);
      return await readLinkedinJobDescription(page);
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    console.warn(`[LinkedIn Scraper] Descrição indisponível para ${url}: ${message}`);
    return null;
  }
}

export function normalizeLinkedinUrl(rawUrl: string): string {
  const url = new URL(rawUrl, "https://www.linkedin.com");
  return `${url.origin}${url.pathname}`;
}

export async function extractJobs(page: Page): Promise<ScrapedLinkedinJob[]> {
  const cardSelector = [
    "li:has(a.base-card__full-link)",
    ".base-search-card",
    ".job-search-card",
  ].join(", ");

  try {
    await page.locator(cardSelector).first().waitFor({
      state: "attached",
      timeout: RESULTS_TIMEOUT_MS,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Erro desconhecido";

    console.warn(
      `[LinkedIn Scraper] Resultados não ficaram disponíveis; possível bloqueio ou página vazia: ${message}`,
    );
    return [];
  }

  return page.locator(cardSelector).evaluateAll((cards) =>
    cards
      .map((card) => {
        const linkElement = card.querySelector<HTMLAnchorElement>(
          "a.base-card__full-link, a[href*='/jobs/view/']",
        );
        const titleElement = card.querySelector<HTMLElement>(
          ".base-search-card__title, .job-search-card__title, h3",
        );
        const companyElement = card.querySelector<HTMLElement>(
          ".base-search-card__subtitle, .job-search-card__company-name, h4",
        );
        const locationElement = card.querySelector<HTMLElement>(
          ".job-search-card__location",
        );

        return {
          titulo: titleElement?.textContent?.trim() ?? "",
          empresa: companyElement?.textContent?.trim() || "Não informada",
          link: linkElement?.href ?? "",
          localizacao: locationElement?.textContent?.trim() || null,
          descricao: null,
          contato_email: null,
        };
      })
      .filter((job) => job.titulo.length > 0 && job.link.length > 0),
  );
}

async function saveJobIfNew(job: ScrapedLinkedinJob): Promise<boolean> {
  return (await saveDiscoveredJob(prisma, job)).created;
}

export async function scrapeLinkedinVagas(
  searchTerm: string,
): Promise<number> {
  const normalizedSearchTerm = searchTerm.trim();

  if (!normalizedSearchTerm) {
    throw new Error("O termo de busca do LinkedIn não pode estar vazio.");
  }

  let browser: Browser | undefined;

  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({
      locale: "pt-BR",
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36",
    });
    const searchUrl = new URL(LINKEDIN_JOBS_URL);
    searchUrl.searchParams.set("keywords", normalizedSearchTerm);
    searchUrl.searchParams.set("location", "Brasil");

    await page.goto(searchUrl.toString(), {
      waitUntil: "domcontentloaded",
      timeout: NAVIGATION_TIMEOUT_MS,
    });

    const scrapedJobs = await extractJobs(page);
    const detailPage = await browser.newPage({ locale: "pt-BR" });
    const uniqueJobs = new Map<string, ScrapedLinkedinJob>();

    for (const job of scrapedJobs) {
      try {
        const link = normalizeLinkedinUrl(job.link);
        uniqueJobs.set(link, { ...job, link });
      } catch {
        console.warn(`[LinkedIn Scraper] URL de vaga inválida ignorada.`);
      }
    }

    let createdJobs = 0;

    for (const job of uniqueJobs.values()) {
      try {
        const existingJob = await prisma.job.findUnique({
          where: { link: job.link },
          select: { descricao: true },
        });
        const shouldEnrich = !existingJob || !existingJob.descricao;
        const descricao = shouldEnrich
          ? await extractJobDescription(detailPage, job.link)
          : existingJob.descricao;
        const enrichedJob: ScrapedLinkedinJob = {
          ...job,
          descricao,
          contato_email: descricao?.match(EMAIL_PATTERN)?.[0]?.toLowerCase() ?? null,
        };

        if (await saveJobIfNew(enrichedJob)) {
          createdJobs += 1;
        }
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro desconhecido";

        console.error(
          `[LinkedIn Scraper] Falha ao salvar ${job.link}: ${message}`,
        );
      }
    }

    console.info(
      `[LinkedIn Scraper] ${uniqueJobs.size} vagas encontradas; ${createdJobs} novas vagas salvas.`,
    );

    return createdJobs;
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Erro desconhecido";

    console.error(
      `[LinkedIn Scraper] Navegação bloqueada ou indisponível: ${message}`,
    );
    throw new Error(`Não foi possível executar o scraper do LinkedIn: ${message}`);
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro desconhecido";
        console.error(`[LinkedIn Scraper] Falha ao fechar o browser: ${message}`);
      }
    }
  }
}
