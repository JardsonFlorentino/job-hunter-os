import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "playwright";

const baseUrl = process.env.DEMO_BASE_URL ?? "http://localhost:3001";
const password = process.env.DEMO_AUTH_PASSWORD;
const parsed = new URL(baseUrl);
if (!new Set(["localhost", "127.0.0.1"]).has(parsed.hostname)) {
  throw new Error("Screenshots de demonstração só podem usar servidor local.");
}

const outputDirectory = resolve(process.cwd(), "..", "docs", "screenshots");
const pages = [
  ["portfolio-publico", "/portfolio"],
  ["today", "/today"],
  ["discover", "/discover"],
  ["sources", "/sources"],
  ["pipeline", "/pipeline"],
] as const;

const browser = await chromium.launch({ headless: true });
try {
  await mkdir(outputDirectory, { recursive: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  for (const [name, pathname] of pages) {
    await page.goto(new URL(pathname, baseUrl).toString(), { waitUntil: "networkidle", timeout: 30_000 });
    if (page.url().includes("/login")) {
      if (!password) throw new Error("DEMO_AUTH_PASSWORD é obrigatória para capturar telas privadas.");
      await page.getByLabel("Senha de acesso").fill(password);
      await page.getByRole("button", { name: "Entrar no Command Center" }).click();
      await page.waitForURL(`**${pathname}`);
    }
    await page.screenshot({ path: resolve(outputDirectory, `${name}.png`), fullPage: true });
  }
  console.log(`[Demo] ${pages.length} screenshots fictícios gravados em ${outputDirectory}.`);
} finally {
  await browser.close();
}
