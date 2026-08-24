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

export async function readLinkedinJobDescription(page: Page): Promise<string | null> {
  const structuredDescription = await page.locator('script[type="application/ld+json"]').evaluateAll(
    (scripts) => {
      for (const script of scripts) {
        try {
          const parsed: unknown = JSON.parse(script.textContent ?? "null");
          const entries: unknown[] = Array.isArray(parsed) ? parsed : [parsed];
          for (const entry of entries) {
            if (typeof entry !== "object" || entry === null) continue;
            const record = entry as Record<string, unknown>;
            if (record["@type"] === "JobPosting" && typeof record.description === "string") {
              return record.description;
            }
          }
        } catch { /* JSON-LD inválido */ }
      }
      return null;
    },
  );

  if (structuredDescription) {
    const plainText = structuredDescription
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/\s+/g, " ")
      .trim();
    if (plainText) return plainText;
  }

  const description = page.locator(
    ".show-more-less-html__markup, .description__text, .jobs-description__content",
  ).first();
  await description.waitFor({ state: "attached", timeout: 4_000 });
  const text = (await description.innerText()).trim();
  return text || null;
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
