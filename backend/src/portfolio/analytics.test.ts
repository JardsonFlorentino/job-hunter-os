import { describe, expect, it } from "vitest";
import { buildConversionRecommendations, calculateFunnel, conversionBreakdowns, sourceConversions } from "../../../frontend/src/lib/analytics.js";

describe("portfolio analytics", () => {
  const applications = [
    { status: "SUBMITTED", opportunity: { sources: [{ platform: "LINKEDIN" }] } },
    { status: "INTERVIEW", opportunity: { sources: [{ platform: "LINKEDIN" }] } },
    { status: "OFFER", opportunity: { sources: [{ platform: "GREENHOUSE" }] } },
    { status: "DRAFT", opportunity: { sources: [{ platform: "GITHUB" }] } },
  ];

  it("calcula o funil sem contar rascunhos como candidaturas", () => {
    expect(calculateFunnel(applications, 12)).toEqual({
      discovered: 12,
      applications: 3,
      responses: 2,
      tests: 0,
      interviews: 2,
      offers: 1,
      responseRate: 66.67,
      interviewRate: 66.67,
    });
  });

  it("compara conversao por fonte", () => {
    expect(sourceConversions(applications)).toEqual([
      { source: "GREENHOUSE", applications: 1, interviews: 1, conversion: 100 },
      { source: "LINKEDIN", applications: 2, interviews: 1, conversion: 50 },
    ]);
  });

  it("não transforma amostra pequena em recomendação enganosa", () => {
    const groups = conversionBreakdowns(applications).sources;
    expect(buildConversionRecommendations(groups, "Fonte")).toEqual([
      "Fonte: amostra insuficiente; aguarde ao menos 3 candidaturas submetidas por grupo.",
    ]);
  });
});
