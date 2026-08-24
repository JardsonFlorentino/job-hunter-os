import puppeteer, { type Browser } from "puppeteer";

import { buildHtmlTemplate, type CvData } from "./template.js";

export async function generatePDF(cvData: CvData): Promise<Buffer> {
  let browser: Browser | undefined;

  try {
    const configuredPath = process.env.PUPPETEER_EXECUTABLE_PATH?.trim();
    const executablePath = configuredPath || (await puppeteer.executablePath());
    browser = await puppeteer.launch({
      headless: true,
      executablePath,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    const html = buildHtmlTemplate(cvData);

    await page.setContent(html, {
      waitUntil: "load",
      timeout: 30_000,
    });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    return Buffer.from(pdf);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Erro desconhecido";

    console.error(`[PDF Generator] Falha ao gerar currículo: ${message}`);
    throw new Error(`Não foi possível gerar o currículo em PDF: ${message}`);
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro desconhecido";

        console.error(`[PDF Generator] Falha ao fechar o browser: ${message}`);
      }
    }
  }
}
