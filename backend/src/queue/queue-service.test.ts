import { describe, expect, it } from "vitest";

import { retryDelayMs } from "./queue-service.js";

describe("queue retry", () => {
  it("uses bounded exponential backoff", () => {
    expect(retryDelayMs(1)).toBe(1_000);
    expect(retryDelayMs(2)).toBe(2_000);
    expect(retryDelayMs(5)).toBe(16_000);
    expect(retryDelayMs(20)).toBe(512_000);
  });
});
