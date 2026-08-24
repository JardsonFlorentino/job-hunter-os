import { describe, expect, it } from "vitest";

import { calculateRankingScore } from "./ranking.js";

const now = new Date("2026-08-23T12:00:00.000Z");
const score = (matchScore: number, lastSeenAt: Date, hasDirectEmail: boolean) => calculateRankingScore({ matchScore, lastSeenAt, hasDirectEmail, sourceCount: 1 }, now);

describe("daily opportunity ranking", () => {
  it("prioritizes higher fit", () => {
    expect(score(90, now, false)).toBeGreaterThan(score(70, now, true));
  });
  it("prioritizes recency for equal fit and effort", () => {
    expect(score(80, now, false)).toBeGreaterThan(score(80, new Date("2026-08-10T12:00:00.000Z"), false));
  });
  it("uses direct contact as lower application effort", () => {
    expect(score(80, now, true)).toBeGreaterThan(score(80, now, false));
  });
});
