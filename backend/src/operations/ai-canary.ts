import "dotenv/config";

import { z } from "zod";

import { callAi, configuredAiModel } from "../ai/client.js";

const responseSchema = z.object({ ok: z.literal(true) });

async function main(): Promise<void> {
  const provider = process.env.AI_PROVIDER?.trim().toLowerCase() || "groq";
  console.info(`[AI Canary] provider=${provider}; model=${configuredAiModel()}; nenhuma vaga sera processada.`);
  const response = await callAi(
    "Retorne somente um objeto JSON confirmando disponibilidade: {\"ok\":true}",
    "Voce executa um health check tecnico e deve responder exclusivamente JSON valido.",
    { json: true },
  );
  responseSchema.parse(JSON.parse(response) as unknown);
  console.info("[AI Canary] PASS: autenticacao, modelo e JSON mode validados.");
}

void main().catch((error: unknown) => {
  console.error(`[AI Canary] FAIL: ${error instanceof Error ? error.message : "erro desconhecido"}`);
  process.exitCode = 1;
});
