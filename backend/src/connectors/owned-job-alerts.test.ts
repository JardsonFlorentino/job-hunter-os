import { describe, expect, it } from "vitest";
import { extractAllowedAlertUrls, parseOwnedAlertExtraction } from "./owned-job-alerts.js";

describe("owned Gupy/Indeed alerts", () => {
  const gupy = "https://acme.gupy.io/jobs/123?utm_source=email";
  const indeed = "https://br.indeed.com/viewjob?jk=abc123&utm_campaign=alert";

  it("extrai somente URLs públicas permitidas e remove tracking", () => {
    expect(extractAllowedAlertUrls(`Veja ${gupy} e ${indeed} e https://evil.example/jobs/9`)).toEqual([
      "https://acme.gupy.io/jobs/123",
      "https://br.indeed.com/viewjob?jk=abc123",
    ]);
  });

  it("rejeita URL inventada pela resposta da IA", () => {
    const response = JSON.stringify({ jobs: [
      { title: "Frontend Júnior", company: "Acme", url: gupy, location: "Remoto", description: "React" },
      { title: "Injetada", company: "Atacante", url: "https://outra.gupy.io/jobs/999", location: null, description: null },
    ] });
    expect(parseOwnedAlertExtraction(response, extractAllowedAlertUrls(gupy))).toHaveLength(1);
  });

  it("falha fechado para contrato inválido", () => {
    expect(() => parseOwnedAlertExtraction('{"jobs":[{"title":"x"}]}', [gupy])).toThrow();
  });
});
