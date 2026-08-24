import { describe, expect, it } from "vitest";

import { parseRuntimeConfig } from "../config/environment.js";
import { evaluateAutomaticEmail } from "./operating-policy.js";

function config(overrides: Record<string, string> = {}) {
  return parseRuntimeConfig({
    DATABASE_URL: "postgresql://user:pass@localhost:5432/test",
    OPENROUTER_API_KEY: "test",
    SMTP_HOST: "localhost",
    SMTP_USER: "owner@example.com",
    SMTP_PASSWORD: "test",
    DRY_RUN: "false",
    APPLICATION_MODE: "AUTO_EMAIL",
    EXTERNAL_ACTIONS_KILL_SWITCH: "false",
    ALLOW_EXTERNAL_EMAIL_SEND: "true",
    MAX_APPLICATIONS_PER_DAY: "2",
    MIN_AUTO_EMAIL_SCORE: "85",
    AUTO_EMAIL_COMPANY_ALLOWLIST: "Acme",
    ...overrides,
  });
}

describe("evaluateAutomaticEmail", () => {
  it("permite somente quando todas as travas estao satisfeitas", () => {
    expect(evaluateAutomaticEmail(config(), { company: "ACME", matchScore: 90, sentToday: 0 }).allowed).toBe(true);
  });

  it.each([
    ["score", { company: "Acme", matchScore: 84, sentToday: 0 }],
    ["limite", { company: "Acme", matchScore: 90, sentToday: 2 }],
    ["allowlist", { company: "Outra", matchScore: 90, sentToday: 0 }],
  ])("bloqueia por %s", (_reason, candidate) => {
    expect(evaluateAutomaticEmail(config(), candidate).allowed).toBe(false);
  });
});
