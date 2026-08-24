import { chromium, type BrowserContext, type Page } from "playwright";

const baseUrl = process.env.DEMO_BASE_URL ?? "http://localhost:3001";
const password = process.env.DEMO_AUTH_PASSWORD;
const parsed = new URL(baseUrl);
if (!new Set(["localhost", "127.0.0.1"]).has(parsed.hostname)) throw new Error("E2E só pode acessar servidor local.");
if (!password) throw new Error("DEMO_AUTH_PASSWORD é obrigatória para o E2E autenticado.");

async function expectText(page: Page, selector: string, expected: string): Promise<void> {
  const locator = page.locator(selector).filter({ hasText: expected }).first();
  await locator.waitFor({ state: "visible", timeout: 10_000 });
}

async function login(page: Page): Promise<void> {
  await page.goto(new URL("/today", baseUrl).toString(), { waitUntil: "networkidle" });
  await page.waitForURL("**/login**");
  await page.getByLabel("Senha de acesso").fill(password as string);
  await page.getByRole("button", { name: "Entrar no Command Center" }).click();
  await page.waitForURL("**/today");
}

async function assertNoHorizontalOverflow(page: Page, name: string): Promise<void> {
  const dimensions = await page.evaluate(() => ({ width: window.innerWidth, scrollWidth: document.documentElement.scrollWidth }));
  if (dimensions.scrollWidth > dimensions.width + 1) throw new Error(`${name} possui overflow horizontal: ${dimensions.scrollWidth}px em viewport de ${dimensions.width}px.`);
}

async function desktopJourney(context: BrowserContext): Promise<void> {
  const page = await context.newPage();
  await page.goto(new URL("/portfolio", baseUrl).toString(), { waitUntil: "networkidle" });
  await expectText(page, "h1", "Tecnologia com visão de negócio e execução");
  await expectText(page, "main", "Dados fictícios para demonstração pública");

  await login(page);
  await expectText(page, "h1", "Olá");
  await expectText(page, "main", "Robô em modo seguro");

  await page.getByRole("link", { name: "Vagas", exact: true }).click();
  await page.waitForURL("**/discover");
  await expectText(page, "h1", "Vagas");
  const cards = page.locator("article");
  if (await cards.count() < 1) throw new Error("Vagas deveria exibir ao menos uma oportunidade fictícia.");
  await cards.first().getByRole("link", { name: "Analisar detalhes" }).click();
  await page.waitForURL(/\/discover\/[a-z0-9]+/);
  await expectText(page, "main", "Matriz de requisitos e evidências");
  await page.getByRole("link", { name: "Revisar candidatura" }).click();
  await page.waitForURL(/\/revisao\/[a-z0-9]+/);
  await expectText(page, "h1", "Revisar candidatura");
  const reviewText = await page.locator("main").innerText();
  if (!reviewText.includes("Materiais da candidatura") && !reviewText.includes("Preparar candidatura")) throw new Error("A revisão não exibiu um estado válido de rascunho ou materiais.");

  await page.goto(new URL("/competencias", baseUrl).toString(), { waitUntil: "networkidle" });
  await expectText(page, "h1", "Competências");
  await expectText(page, "main", "Gerenciar desenvolvimento profissional");
  await page.close();
}

async function mobileJourney(context: BrowserContext): Promise<void> {
  const page = await context.newPage();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(new URL("/portfolio", baseUrl).toString(), { waitUntil: "networkidle" });
  await assertNoHorizontalOverflow(page, "Portfólio público");
  await login(page);
  await assertNoHorizontalOverflow(page, "Visão geral");

  for (const pathname of ["/discover", "/competencias", "/pipeline", "/inbox", "/career-dna"]) {
    await page.goto(new URL(pathname, baseUrl).toString(), { waitUntil: "networkidle" });
    await assertNoHorizontalOverflow(page, pathname);
  }
  await page.close();
}

const browser = await chromium.launch({ headless: true });
try {
  await desktopJourney(await browser.newContext({ viewport: { width: 1440, height: 1000 } }));
  await mobileJourney(await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true }));
  console.log("[E2E] Portfólio público e fluxo autenticado validados em desktop e celular, sem ações externas.");
} finally {
  await browser.close();
}
