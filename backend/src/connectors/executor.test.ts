import { describe, expect, it, vi } from "vitest";

import { withRetry } from "./executor.js";

describe("connector retry", () => {
  it("recovers from transient failures within the limit", async () => {
    vi.useFakeTimers();
    let calls = 0;
    const promise = withRetry(async () => { calls += 1; if (calls < 3) throw new Error("temporário"); return "ok"; }, { attempts: 3, baseDelayMs: 10 });
    await vi.runAllTimersAsync();
    await expect(promise).resolves.toBe("ok");
    expect(calls).toBe(3);
    vi.useRealTimers();
  });

  it("does not exceed the configured attempts", async () => {
    vi.useFakeTimers();
    const operation = vi.fn(async () => { throw new Error("permanente"); });
    const promise = withRetry(operation, { attempts: 2, baseDelayMs: 10 });
    const assertion = expect(promise).rejects.toThrow("permanente");
    await vi.runAllTimersAsync();
    await assertion;
    expect(operation).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });
});
