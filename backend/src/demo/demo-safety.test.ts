import { describe, expect, it } from "vitest";
import { assertSafeDemoDatabase } from "./demo-safety.js";

describe("demo database safety", () => {
  it("aceita somente banco local identificado como demo", () => {
    expect(assertSafeDemoDatabase("postgresql://demo:demo@localhost:5433/job_hunter_demo")).toContain("job_hunter_demo");
  });

  it.each([
    undefined,
    "postgresql://admin:secret@localhost:5432/job_hunter",
    "postgresql://demo:demo@database.example.com:5432/job_hunter_demo",
    "mysql://demo:demo@localhost:3306/job_hunter_demo",
  ])("rejeita destino inseguro: %s", (value) => {
    expect(() => assertSafeDemoDatabase(value)).toThrow();
  });
});
