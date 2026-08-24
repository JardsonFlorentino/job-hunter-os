import { describe, expect, it } from "vitest";

import { extensionCorsHeaders } from "./extension-cors";

describe("extension CORS policy", () => {
  it("allows a Chrome extension origin without enabling credentials", () => {
    const headers = extensionCorsHeaders(new Request("https://jobhunter.example/api/assistant/opportunity", { headers: { origin: "chrome-extension://abcdefghijklmnop" } }));
    expect(headers["Access-Control-Allow-Origin"]).toBe("chrome-extension://abcdefghijklmnop");
    expect(headers["Access-Control-Allow-Headers"]).toContain("Authorization");
    expect(headers).not.toHaveProperty("Access-Control-Allow-Credentials");
  });

  it.each(["https://evil.example", "null", "not a url"])("rejects non-extension origin %s", (origin) => {
    expect(extensionCorsHeaders(new Request("https://jobhunter.example/api/assistant/opportunity", { headers: { origin } }))).toEqual({});
  });

  it("does not emit CORS headers when Origin is absent", () => {
    expect(extensionCorsHeaders(new Request("https://jobhunter.example/api/assistant/opportunity"))).toEqual({});
  });
});