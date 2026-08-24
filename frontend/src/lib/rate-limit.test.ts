import { describe, expect, it } from "vitest";

import {
  clientIdentifier,
  consumeRateLimit,
  positiveInteger,
  rateLimitHeaders,
} from "./rate-limit";

describe("rate limit", () => {
  it("permite chamadas ate o limite e bloqueia a seguinte", () => {
    const key = `test:${crypto.randomUUID()}`;
    const options = { key, limit: 2, windowMs: 60_000, blockMs: 60_000 };

    expect(consumeRateLimit({ ...options, now: 1_000 }).allowed).toBe(true);
    expect(consumeRateLimit({ ...options, now: 2_000 }).allowed).toBe(true);

    const blocked = consumeRateLimit({ ...options, now: 3_000 });
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBe(60);
    expect(rateLimitHeaders(blocked)["Retry-After"]).toBe("60");
  });

  it("libera novamente depois do periodo de bloqueio", () => {
    const key = `test:${crypto.randomUUID()}`;
    const options = { key, limit: 1, windowMs: 1_000, blockMs: 1_000 };

    expect(consumeRateLimit({ ...options, now: 1_000 }).allowed).toBe(true);
    expect(consumeRateLimit({ ...options, now: 1_100 }).allowed).toBe(false);
    expect(consumeRateLimit({ ...options, now: 2_101 }).allowed).toBe(true);
  });

  it("ignora cabecalhos de IP sem proxy confiavel", () => {
    const request = new Request("http://localhost", {
      headers: { "x-real-ip": "203.0.113.10", "x-forwarded-for": "198.51.100.2" },
    });

    expect(clientIdentifier(request, false)).toBe("direct-client");
    expect(clientIdentifier(request, true)).toBe("203.0.113.10");
  });

  it("usa fallback para configuracoes numericas invalidas", () => {
    expect(positiveInteger(undefined, 5)).toBe(5);
    expect(positiveInteger("0", 5)).toBe(5);
    expect(positiveInteger("12", 5)).toBe(12);
  });
});
