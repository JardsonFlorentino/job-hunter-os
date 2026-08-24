import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { chromium, type Browser } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  extractContactEmail,
  readGithubIssueDescription,
} from "./github-scraper.js";
import { readLinkedinJobDescription } from "./linkedin-scraper.js";

let browser: Browser | undefined;

async function fixture(name: string): Promise<string> {
  return readFile(
    fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url)),
    "utf8",
  );
}

beforeAll(async () => {
  browser = await chromium.launch({ headless: true });
});

afterAll(async () => {
  await browser?.close();
});

describe("parsers offline dos scrapers", () => {
  it("extrai descrição e e-mail de uma issue fixture do GitHub", async () => {
    if (!browser) throw new Error("Browser de teste indisponível.");
    const page = await browser.newPage();
    await page.setContent(await fixture("github-issue.html"));

    const description = await readGithubIssueDescription(page);
    expect(description).toContain("React, Node.js e TypeScript");
    expect(extractContactEmail(description)).toBe("talentos@empresa.dev");
    await page.close();
  });

  it("extrai e limpa JobPosting JSON-LD do LinkedIn", async () => {
    if (!browser) throw new Error("Browser de teste indisponível.");
    const page = await browser.newPage();
    await page.setContent(await fixture("linkedin-job.html"));

    const description = await readLinkedinJobDescription(page);
    expect(description).toBe(
      "Construa interfaces com React & TypeScript. Conhecimento de Next.js é desejável.",
    );
    await page.close();
  });
});
