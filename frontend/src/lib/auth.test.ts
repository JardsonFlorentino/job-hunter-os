import { afterEach, describe, expect, it } from "vitest";

import { hasSameOrigin, verifyExtensionToken } from "./auth";

const originalToken = process.env.EXTENSION_API_TOKEN;

afterEach(() => {
  if (originalToken === undefined) delete process.env.EXTENSION_API_TOKEN;
  else process.env.EXTENSION_API_TOKEN = originalToken;
});

describe("extension API token", () => {
  it("accepts the configured bearer token", () => {
    process.env.EXTENSION_API_TOKEN = "extension_test_token_with_at_least_32_chars";
    const request = new Request("https://jobhunter.example/api/assistant/opportunity", { headers: { authorization: `Bearer ${process.env.EXTENSION_API_TOKEN}` } });
    expect(verifyExtensionToken(request)).toBe(true);
  });

  it("rejects absent, short or different tokens", () => {
    process.env.EXTENSION_API_TOKEN = "extension_test_token_with_at_least_32_chars";
    expect(verifyExtensionToken(new Request("https://jobhunter.example/api/assistant/opportunity"))).toBe(false);
    expect(verifyExtensionToken(new Request("https://jobhunter.example/api/assistant/opportunity", { headers: { authorization: "Bearer wrong_token_with_at_least_32_characters" } }))).toBe(false);
    process.env.EXTENSION_API_TOKEN = "short";
    expect(verifyExtensionToken(new Request("https://jobhunter.example/api/assistant/opportunity", { headers: { authorization: "Bearer short" } }))).toBe(false);
  });
});
describe("same-origin mutation protection", () => {
  it("accepts matching host and forwarded HTTPS protocol", () => {
    const request = new Request("http://frontend:3000/api/action-center", { headers: {
      origin: "https://jobhunter.example",
      host: "frontend:3000",
      "x-forwarded-host": "jobhunter.example",
      "x-forwarded-proto": "https",
    } });
    expect(hasSameOrigin(request)).toBe(true);
  });

  it("rejects different hosts, protocol downgrade and missing origin", () => {
    expect(hasSameOrigin(new Request("https://jobhunter.example/api/action-center", { headers: { origin: "https://evil.example", host: "jobhunter.example" } }))).toBe(false);
    expect(hasSameOrigin(new Request("https://jobhunter.example/api/action-center", { headers: { origin: "http://jobhunter.example", host: "jobhunter.example" } }))).toBe(false);
    expect(hasSameOrigin(new Request("https://jobhunter.example/api/action-center", { headers: { host: "jobhunter.example" } }))).toBe(false);
  });
});