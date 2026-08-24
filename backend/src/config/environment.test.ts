import { describe, expect, it } from "vitest";

import { parseRuntimeConfig } from "./environment.js";

const baseEnvironment: NodeJS.ProcessEnv = {
  DATABASE_URL: "postgresql://admin:admin123@localhost:5432/jobhunter",
  AI_PROVIDER: "openrouter",
  OPENROUTER_API_KEY: "test-key",
  DRY_RUN: "true",
};

describe("parseRuntimeConfig", () => {
  it("usa defaults seguros e tipados", () => {
    const config = parseRuntimeConfig(baseEnvironment);

    expect(config.DRY_RUN).toBe(true);
    expect(config.SMTP_PORT).toBe(587);
    expect(config.IMAP_PORT).toBe(993);
    expect(config.IMAP_SINCE_DATE).toBe("2026-08-28");
    expect(config.IMAP_BATCH_SIZE).toBe(50);
    expect(config.ENABLE_GITHUB_SCRAPER).toBe(false);
    expect(config.ENABLE_LINKEDIN_SCRAPER).toBe(false);
    expect(config.ENABLE_IMAP).toBe(false);
    expect(config.ENABLE_JOB_PROCESSING).toBe(false);
    expect(config.ENABLE_FOLLOWUP_DRAFTS).toBe(false);
  });

  it("rejeita URL de banco fora do PostgreSQL", () => {
    expect(() =>
      parseRuntimeConfig({
        ...baseEnvironment,
        DATABASE_URL: "mysql://localhost/db",
      }),
    ).toThrow("Variáveis de ambiente inválidas");
  });

  it("exige credenciais externas quando DRY_RUN está desativado", () => {
    expect(() =>
      parseRuntimeConfig({
        ...baseEnvironment,
        DRY_RUN: "false",
        ENABLE_IMAP: "true",
      }),
    ).toThrow("leitura IMAP requer as variáveis");
  });

  it("permite desabilitar recursos sem suas credenciais", () => {
    const config = parseRuntimeConfig({
      DATABASE_URL: baseEnvironment.DATABASE_URL,
      DRY_RUN: "false",
      ENABLE_IMAP: "false",
      ENABLE_JOB_PROCESSING: "false",
    });

    expect(config.ENABLE_IMAP).toBe(false);
    expect(config.ENABLE_JOB_PROCESSING).toBe(false);
  });

  it("seleciona Groq e exige a chave correta quando o processamento esta ativo", () => {
    const config = parseRuntimeConfig({
      DATABASE_URL: baseEnvironment.DATABASE_URL,
      AI_PROVIDER: "groq",
      GROQ_API_KEY: "gsk_test",
      GROQ_MODEL: "openai/gpt-oss-20b",
      ENABLE_JOB_PROCESSING: "true",
      DRY_RUN: "true",
    });
    expect(config.AI_PROVIDER).toBe("groq");
    expect(config.GROQ_MODEL).toBe("openai/gpt-oss-20b");
  });

  it("bloqueia processamento Groq sem GROQ_API_KEY", () => {
    expect(() =>
      parseRuntimeConfig({
        DATABASE_URL: baseEnvironment.DATABASE_URL,
        AI_PROVIDER: "groq",
        ENABLE_JOB_PROCESSING: "true",
        DRY_RUN: "true",
      }),
    ).toThrow("GROQ_API_KEY");
  });
});
