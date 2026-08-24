import { JobStatus } from "@prisma/client";
import { chromium, type Browser } from "playwright";

import { prisma } from "../prisma/client.js";

const NAVIGATION_TIMEOUT_MS = 30_000;

type ApplicationRoute = "EASY_APPLY" | "EXTERNAL" | "UNKNOWN";

function isLinkedinJobUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.hostname.endsWith("linkedin.com") && url.pathname.includes("/jobs/view/");
  } catch {
    return false;
  }
}

async function detectApplicationRoute(jobUrl: string): Promise<ApplicationRoute> {
  let browser: Browser | undefined;

  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ locale: "pt-BR" });
    await page.goto(jobUrl, {
      waitUntil: "domcontentloaded",
      timeout: NAVIGATION_TIMEOUT_MS,
    });

    const easyApply = page.getByRole("button", {
      name: /candidatura simplificada|easy apply/i,
    });
    if (await easyApply.count()) return "EASY_APPLY";

    const externalApply = page.locator(
      "a[href]:has-text('Candidatar-se'), a[href]:has-text('Apply'), a[href]:has-text('Inscreva-se')",
    );
    if (await externalApply.count()) return "EXTERNAL";

    return "UNKNOWN";
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    console.warn(`[LinkedIn Apply Router] Não foi possível inspecionar ${jobUrl}: ${message}`);
    return "UNKNOWN";
  } finally {
    if (browser) await browser.close().catch(() => undefined);
  }
}

export async function routeLinkedinApplication(
  jobId: string,
  jobUrl: string,
): Promise<void> {
  if (!isLinkedinJobUrl(jobUrl)) {
    throw new Error("A URL informada não corresponde a uma vaga do LinkedIn.");
  }

  const route = await detectApplicationRoute(jobUrl);
  const guidance: Record<ApplicationRoute, string> = {
    EASY_APPLY: "Candidatura Simplificada detectada; revisão e envio manual necessários no LinkedIn.",
    EXTERNAL: "Candidatura externa detectada; concluir manualmente no portal da empresa.",
    UNKNOWN: "Canal de candidatura não confirmado; revisar manualmente a página da vaga.",
  };

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: { aiReason: true },
  });

  await prisma.job.update({
    where: { id: jobId },
    data: {
      status: JobStatus.MANUAL,
      aiReason: [job?.aiReason, guidance[route]].filter(Boolean).join(" "),
    },
  });

  console.info(`[LinkedIn Apply Router] Vaga ${jobId} encaminhada para MANUAL (${route}).`);
}
