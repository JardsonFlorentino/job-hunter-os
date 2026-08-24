import { QueueItemStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { failureStatus, retryDelayMs } from "./queue-service.js";

describe("queue retry", () => {
  it("uses bounded exponential backoff", () => {
    expect(retryDelayMs(1)).toBe(1_000);
    expect(retryDelayMs(2)).toBe(2_000);
    expect(retryDelayMs(5)).toBe(16_000);
    expect(retryDelayMs(20)).toBe(512_000);
  });
});

describe("queue failure policy", () => {
  it("keeps retryable work failed until the attempt limit", () => {
    expect(failureStatus(1, 3)).toBe(QueueItemStatus.FAILED);
    expect(failureStatus(2, 3)).toBe(QueueItemStatus.FAILED);
  });

  it("moves exhausted work to the dead-letter state", () => {
    expect(failureStatus(3, 3)).toBe(QueueItemStatus.DEAD);
    expect(failureStatus(4, 3)).toBe(QueueItemStatus.DEAD);
  });
});