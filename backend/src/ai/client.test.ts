import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AiProviderError, callAi } from "./client.js";

const originalProvider = process.env.AI_PROVIDER;
const originalGroqKey = process.env.GROQ_API_KEY;
const originalGroqModel = process.env.GROQ_MODEL;

function aiResponse(content: string): Response {
  return new Response(
    JSON.stringify({ choices: [{ message: { content } }] }),
    { status: 200, headers: { "content-type": "application/json" } },
  );
}

function providerError(
  status: number,
  retryAfter = "0",
  failedGeneration?: string,
): Response {
  return new Response(
    JSON.stringify({
      error: {
        message: "limite de teste",
        ...(failedGeneration === undefined
          ? {}
          : { failed_generation: failedGeneration }),
      },
    }),
    {
      status,
      headers: {
        "content-type": "application/json",
        "retry-after": retryAfter,
      },
    },
  );
}

describe("callAi", () => {
  beforeEach(() => {
    process.env.AI_PROVIDER = "groq";
    process.env.GROQ_API_KEY = "gsk_test";
    process.env.GROQ_MODEL = "test-model";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    if (originalProvider === undefined) delete process.env.AI_PROVIDER;
    else process.env.AI_PROVIDER = originalProvider;
    if (originalGroqKey === undefined) delete process.env.GROQ_API_KEY;
    else process.env.GROQ_API_KEY = originalGroqKey;
    if (originalGroqModel === undefined) delete process.env.GROQ_MODEL;
    else process.env.GROQ_MODEL = originalGroqModel;
  });

  it("repete uma chamada limitada e retorna a resposta seguinte", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(providerError(429))
      .mockResolvedValueOnce(aiResponse('{"fit":true}'));
    vi.stubGlobal("fetch", fetchMock);

    await expect(callAi("Analise", undefined, { json: true })).resolves.toBe(
      '{"fit":true}',
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("nao repete erros de pagamento", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(providerError(402));
    vi.stubGlobal("fetch", fetchMock);

    await expect(callAi("Analise")).rejects.toBeInstanceOf(AiProviderError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("pausa imediatamente quando o provedor pede uma espera longa", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(providerError(429, "1766"));
    vi.stubGlobal("fetch", fetchMock);

    await expect(callAi("Analise", undefined, { json: true })).rejects.toMatchObject({
      name: "AiProviderError",
      status: 429,
      retryAfterSeconds: 1766,
      shouldPauseBatch: true,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("encaminha failed_generation para o reparador de JSON", async () => {
    const partialGeneration = '{"fit":true,"matchScore":70';
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(providerError(400, "0", partialGeneration));
    vi.stubGlobal("fetch", fetchMock);

    await expect(callAi("Analise", undefined, { json: true })).resolves.toBe(
      partialGeneration,
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("mantem falha segura quando o erro 400 nao contem geracao parcial", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(providerError(400));
    vi.stubGlobal("fetch", fetchMock);

    await expect(callAi("Analise", undefined, { json: true })).rejects.toMatchObject({
      name: "AiProviderError",
      status: 400,
      failedGeneration: null,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("nao aproveita failed_generation fora de chamadas JSON", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(providerError(400, "0", '{"texto":"parcial"}'));
    vi.stubGlobal("fetch", fetchMock);

    await expect(callAi("Escreva um e-mail")).rejects.toBeInstanceOf(
      AiProviderError,
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
