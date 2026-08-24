import { z } from "zod";

const booleanValue = z
  .enum(["true", "false"])
  .default("false")
  .transform((value) => value === "true");

const trueByDefault = z
  .enum(["true", "false"])
  .default("true")
  .transform((value) => value === "true");

const commaList = z.string().default("").transform((value) => value.split(",").map((item) => item.trim()).filter(Boolean));

const environmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().url().startsWith("postgresql://"),
  AI_PROVIDER: z.enum(["groq", "openrouter"]).default("groq"),
  GROQ_API_KEY: z.string().min(1).optional(),
  GROQ_MODEL: z.string().min(1).default("openai/gpt-oss-20b"),
  OPENROUTER_API_KEY: z.string().min(1).optional(),
  OPENROUTER_MODEL: z.string().min(1).default("google/gemini-3.7-flash"),
  SMTP_HOST: z.string().min(1).optional(),
  SMTP_PORT: z.coerce.number().int().min(1).max(65_535).default(587),
  SMTP_SECURE: booleanValue,
  SMTP_USER: z.string().email().optional(),
  SMTP_PASSWORD: z.string().min(1).optional(),
  SMTP_FROM_NAME: z.string().min(1).default("Jardson Florentino"),
  SMTP_FROM_EMAIL: z.string().email().optional(),
  IMAP_HOST: z.string().min(1).optional(),
  IMAP_PORT: z.coerce.number().int().min(1).max(65_535).default(993),
  IMAP_TLS: trueByDefault,
  IMAP_USER: z.string().email().optional(),
  IMAP_PASSWORD: z.string().min(1).optional(),
  DRY_RUN: booleanValue,
  APPLICATION_MODE: z.enum(["OBSERVE", "PREPARE", "AUTO_EMAIL"]).default("OBSERVE"),
  EXTERNAL_ACTIONS_KILL_SWITCH: trueByDefault,
  ALLOW_EXTERNAL_EMAIL_SEND: booleanValue,
  MAX_APPLICATIONS_PER_DAY: z.coerce.number().int().min(0).max(100).default(0),
  MIN_AUTO_EMAIL_SCORE: z.coerce.number().int().min(0).max(100).default(85),
  AUTO_EMAIL_COMPANY_ALLOWLIST: commaList,
  ENABLE_IMAP: booleanValue,
  ENABLE_GITHUB_SCRAPER: booleanValue,
  ENABLE_LINKEDIN_SCRAPER: booleanValue,
  ENABLE_ATS_CONNECTORS: booleanValue,
  GREENHOUSE_BOARDS: commaList,
  LEVER_SITES: commaList,
  ASHBY_BOARDS: commaList,
  SMARTRECRUITERS_COMPANIES: commaList,
  WORKABLE_ACCOUNTS: commaList,
  ENABLE_JOB_PROCESSING: booleanValue,
  ENABLE_FOLLOWUP_DRAFTS: booleanValue,
});

export type RuntimeConfig = z.infer<typeof environmentSchema>;

function requireFields(
  config: RuntimeConfig,
  fields: Array<keyof RuntimeConfig>,
  feature: string,
): void {
  const missing = fields.filter((field) => !config[field]);
  if (missing.length > 0) {
    throw new Error(
      `[Config] ${feature} requer as variáveis: ${missing.join(", ")}.`,
    );
  }
}

export function parseRuntimeConfig(
  environment: NodeJS.ProcessEnv,
): RuntimeConfig {
  const result = environmentSchema.safeParse(environment);
  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`[Config] Variáveis de ambiente inválidas: ${details}`);
  }

  const config = result.data.AI_PROVIDER === "groq"
    ? { ...result.data, OPENROUTER_MODEL: result.data.GROQ_MODEL }
    : result.data;
  if (config.ENABLE_JOB_PROCESSING) {
    requireFields(config, [config.AI_PROVIDER === "groq" ? "GROQ_API_KEY" : "OPENROUTER_API_KEY"], "processamento de vagas");
  }
  if (config.ENABLE_IMAP && !config.DRY_RUN) {
    requireFields(
      config,
      ["IMAP_HOST", "IMAP_USER", "IMAP_PASSWORD"],
      "leitura IMAP",
    );
  }
  if (config.ENABLE_JOB_PROCESSING && !config.DRY_RUN) {
    requireFields(
      config,
      ["SMTP_HOST", "SMTP_USER", "SMTP_PASSWORD"],
      "envio SMTP",
    );
  }

  if (config.APPLICATION_MODE === "AUTO_EMAIL") {
    if (config.DRY_RUN || config.EXTERNAL_ACTIONS_KILL_SWITCH || !config.ALLOW_EXTERNAL_EMAIL_SEND) {
      throw new Error("[Config] AUTO_EMAIL exige DRY_RUN=false, kill switch desligado e ALLOW_EXTERNAL_EMAIL_SEND=true.");
    }
    if (config.MAX_APPLICATIONS_PER_DAY < 1 || config.AUTO_EMAIL_COMPANY_ALLOWLIST.length < 1) {
      throw new Error("[Config] AUTO_EMAIL exige limite diario positivo e allowlist de empresas.");
    }
  }

  return config;
}
