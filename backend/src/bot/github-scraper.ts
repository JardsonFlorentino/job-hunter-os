import { chromium, type Browser } from "playwright";

import { prisma } from "../prisma/client.js";
import { saveDiscoveredJob } from "../jobs/job-repository.js";

const GITHUB_REPOSITORIES = ["frontendbr/vagas", "backend-br/vagas"] as const;
const NAVIGATION_TIMEOUT_MS = 30_000;

interface ScrapedGithubJob {
  titulo: string;
  empresa: string;
  link: string;
  localizacao: string | null;
  descricao: string | null;
  contato_email: string | null;
}

const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;

export function extractContactEmail(description: string | null): string | null {
  return description?.match(EMAIL_PATTERN)?.[0]?.toLowerCase() ?? null;
}

export async function readGithubIssueDescription(
  page: import("playwright").Page,
): Promise<string | null> {
  const body = page
    .locator("[data-testid='issue-body'], .js-comment-body, .markdown-body")
    .first();
  await body.waitFor({ state: "visible", timeout: 10_000 });
  const text = (await body.innerText()).trim();
  return text || null;
}

async function extractIssueDetails(page: import("playwright").Page, url: string): Promise<string | null> {
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: NAVIGATION_TIMEOUT_MS });
    return await readGithubIssueDescription(page);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    console.warn(`[GitHub Scraper] Não foi possível enriquecer ${url}: ${message}`);
    return null;
  }
}

function extractCompany(title: string): string {
  const patterns = [
    /\bna\s+([^|]+)$/i,
    /\bat\s+([^|]+)$/i,
    /\s[-–—]\s([^|]+)$/,
  ];

  for (const pattern of patterns) {
    const company = title.match(pattern)?.[1]?.trim();

    if (company) {
      return company;
    }
  }

  return "Não informada";
}

function extractLocation(title: string): string | null {
  const location = title.match(/^\s*\[([^\]]+)]/)?.[1]?.trim();
  return location || null;
}

async function saveJobIfNew(job: ScrapedGithubJob): Promise<boolean> {
  return (await saveDiscoveredJob(prisma, job)).created;
}

export async function scrapeGithubVagas(): Promise<number> {
  let browser: Browser | undefined;
  let createdJobs = 0;

  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36",
    });

    for (const repository of GITHUB_REPOSITORIES) {
      const repositoryUrl = `https://github.com/${repository}/issues`;

      try {
        await page.goto(repositoryUrl, {
          waitUntil: "domcontentloaded",
          timeout: NAVIGATION_TIMEOUT_MS,
        });

        const rawIssues = await page
          .locator(`a[href^="/${repository}/issues/"]`)
          .evaluateAll((anchors, expectedRepository) => {
            const issuePathPattern = new RegExp(
              `^/${expectedRepository.replace("/", "\\/")}/issues/\\d+$`,
            );

            return anchors
              .map((anchor) => ({
                title: anchor.textContent?.trim() ?? "",
                path: anchor.getAttribute("href") ?? "",
              }))
              .filter(
                (issue) =>
                  issue.title.length > 0 && issuePathPattern.test(issue.path),
              );
          }, repository);

        const uniqueIssues = new Map(
          rawIssues.map((issue) => [issue.path, issue.title]),
        );

        for (const [path, title] of uniqueIssues) {
          const link = new URL(path, "https://github.com").toString();
          const existingJob = await prisma.job.findUnique({
            where: { link },
            select: { descricao: true },
          });
          const shouldEnrich = !existingJob || !existingJob.descricao;
          const descricao = shouldEnrich ? await extractIssueDetails(page, link) : existingJob.descricao;
          const job: ScrapedGithubJob = {
            titulo: title,
            empresa: extractCompany(title),
            link,
            localizacao: extractLocation(title),
            descricao,
            contato_email: extractContactEmail(descricao),
          };

          if (await saveJobIfNew(job)) {
            createdJobs += 1;
          }
        }

        console.info(
          `[GitHub Scraper] ${repository}: ${uniqueIssues.size} issues encontradas.`,
        );
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro desconhecido";

        console.error(
          `[GitHub Scraper] Falha ao processar ${repositoryUrl}: ${message}`,
        );
      }
    }

    console.info(`[GitHub Scraper] ${createdJobs} novas vagas salvas.`);
    return createdJobs;
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Erro desconhecido";

    console.error(`[GitHub Scraper] Falha geral: ${message}`);
    throw new Error(`Não foi possível executar o scraper do GitHub: ${message}`);
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro desconhecido";
        console.error(`[GitHub Scraper] Falha ao fechar o browser: ${message}`);
      }
    }
  }
}
