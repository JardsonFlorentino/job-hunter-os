import "dotenv/config";

const REQUEST_TIMEOUT_MS = 30_000;
const MAX_RATE_LIMIT_RETRIES = 3;
const DEFAULT_RETRY_DELAY_MS = 5_000;
const MAX_RETRY_DELAY_MS = 60_000;
const MAX_INLINE_RETRY_AFTER_SECONDS = MAX_RETRY_DELAY_MS / 1_000;
type AiProvider = "groq" | "openrouter";
type AiRole = "system" | "user";

interface AiMessage { role: AiRole; content: string }
interface AiRequest {
  model: string;
  messages: AiMessage[];
  temperature: number;
  max_tokens: number;
  response_format?: { type: "json_object" };
}
interface AiResponse { choices: Array<{ message: { content: string } }> }
interface ProviderSettings { provider: AiProvider; endpoint: string; apiKey: string; model: string }

export class AiProviderError extends Error {
  constructor(
    readonly provider: AiProvider,
    readonly status: number,
    readonly retryAfterSeconds: number | null,
    message: string,
    readonly failedGeneration: string | null = null,
  ) {
    super(message);
    this.name = "AiProviderError";
  }
  get shouldPauseBatch(): boolean { return this.status === 402 || this.status === 429; }
}

function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null; }
function isAiResponse(value: unknown): value is AiResponse {
  if (!isRecord(value) || !Array.isArray(value.choices)) return false;
  const first: unknown = value.choices[0];
  return isRecord(first) && isRecord(first.message) && typeof first.message.content === "string";
}
function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`A variavel ${name} nao esta configurada.`);
  return value;
}
function selectedProvider(): AiProvider {
  const provider = process.env.AI_PROVIDER?.trim().toLowerCase() || "groq";
  if (provider === "groq" || provider === "openrouter") return provider;
  throw new Error(`AI_PROVIDER nao suportado: ${provider}.`);
}
function providerSettings(): ProviderSettings {
  const provider = selectedProvider();
  return provider === "groq"
    ? { provider, endpoint: "https://api.groq.com/openai/v1/chat/completions", apiKey: required("GROQ_API_KEY"), model: process.env.GROQ_MODEL?.trim() || "openai/gpt-oss-20b" }
    : { provider, endpoint: "https://openrouter.ai/api/v1/chat/completions", apiKey: required("OPENROUTER_API_KEY"), model: process.env.OPENROUTER_MODEL?.trim() || "google/gemini-3.7-flash" };
}

export function configuredAiModel(): string {
  return selectedProvider() === "groq"
    ? process.env.GROQ_MODEL?.trim() || "openai/gpt-oss-20b"
    : process.env.OPENROUTER_MODEL?.trim() || "google/gemini-3.7-flash";
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function retryDelayMs(error: AiProviderError, retryIndex: number): number {
  const providerDelay = error.retryAfterSeconds === null
    ? DEFAULT_RETRY_DELAY_MS * 2 ** retryIndex
    : Math.ceil(error.retryAfterSeconds * 1_000);

  return Math.min(Math.max(providerDelay, 0), MAX_RETRY_DELAY_MS);
}

function canRetryRateLimitInline(
  error: AiProviderError,
  attempt: number,
): boolean {
  if (error.status !== 429 || attempt >= MAX_RATE_LIMIT_RETRIES) return false;
  return error.retryAfterSeconds === null
    || error.retryAfterSeconds <= MAX_INLINE_RETRY_AFTER_SECONDS;
}

export async function callAi(prompt: string, systemPrompt?: string, options: { json?: boolean } = {}): Promise<string> {
  const normalizedPrompt = prompt.trim();
  if (!normalizedPrompt) throw new Error("O prompt enviado ao provedor de IA nao pode estar vazio.");
  const settings = providerSettings();
  const messages: AiMessage[] = [];
  if (systemPrompt?.trim()) messages.push({ role: "system", content: systemPrompt.trim() });
  messages.push({ role: "user", content: normalizedPrompt });
  const requestBody: AiRequest = {
    model: settings.model, messages, temperature: 0.2, max_tokens: 1_600,
    ...(options.json ? { response_format: { type: "json_object" as const } } : {}),
  };

  for (let attempt = 0; attempt <= MAX_RATE_LIMIT_RETRIES; attempt += 1) {
    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(settings.endpoint, {
        method: "POST",
        headers: { Authorization: `Bearer ${settings.apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(requestBody), signal: abortController.signal,
      });
      if (!response.ok) {
        const errorBody = await response.text();
        let details = response.statusText;
        let failedGeneration: string | null = null;
        try {
          const parsed: unknown = JSON.parse(errorBody);
          if (isRecord(parsed) && isRecord(parsed.error)) {
            if (typeof parsed.error.message === "string") details = parsed.error.message;
            if (typeof parsed.error.failed_generation === "string") {
              const normalizedGeneration = parsed.error.failed_generation.trim();
              failedGeneration = normalizedGeneration || null;
            }
          }
        } catch { /* corpo nao estruturado */ }
        const retryAfter = Number.parseFloat(response.headers.get("retry-after") ?? "");
        throw new AiProviderError(
          settings.provider,
          response.status,
          Number.isFinite(retryAfter) ? retryAfter : null,
          `${settings.provider} HTTP ${response.status}: ${details}`,
          failedGeneration,
        );
      }
      const responseBody: unknown = await response.json();
      if (!isAiResponse(responseBody)) throw new Error(`${settings.provider} retornou resposta em formato invalido.`);
      const content = responseBody.choices[0]?.message.content.trim();
      if (!content) throw new Error(`${settings.provider} retornou resposta vazia.`);
      return content;
    } catch (error: unknown) {
      if (
        error instanceof AiProviderError
        && error.status === 400
        && options.json
        && error.failedGeneration !== null
      ) {
        console.warn(
          `[AI:${settings.provider}] JSON estruturado rejeitado pelo provedor; encaminhando a geracao parcial para validacao e reparo local.`,
        );
        return error.failedGeneration;
      }
      if (error instanceof AiProviderError && canRetryRateLimitInline(error, attempt)) {
        const waitMs = retryDelayMs(error, attempt);
        console.warn(`[AI:${settings.provider}] Limite temporario; nova tentativa ${attempt + 1}/${MAX_RATE_LIMIT_RETRIES} em ${Math.ceil(waitMs / 1_000)}s.`);
        await delay(waitMs);
        continue;
      }
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      console.error(`[AI:${settings.provider}] Falha: ${message}`);
      if (error instanceof Error && error.name === "AbortError") throw new Error(`A requisicao de IA excedeu ${REQUEST_TIMEOUT_MS / 1_000} segundos.`);
      if (error instanceof AiProviderError) throw error;
      throw new Error(`Nao foi possivel consultar ${settings.provider}: ${message}`);
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new Error(`Nao foi possivel consultar ${settings.provider}: tentativas esgotadas.`);
}
