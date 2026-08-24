import { describe, expect, it } from "vitest";

import { parseJobFitAnalysis } from "./job-analysis.js";

const valid = {
  fit: true, decision: "APLICAR", matchScore: 82, descriptionSufficient: true,
  scoreBreakdown: { stack: 90, seniority: 80, responsibilities: 80, location: 100, language: 70, restrictions: 100 },
  essentialRequirements: [{ text: "React", met: true, evidence: "Skill aprovada" }], desirableRequirements: [],
  strengths: ["React"], gaps: ["Biblioteca secundária"], risks: [], strategy: "Destacar projeto aprovado.", aiReason: "Core compatível.",
};

describe("parseJobFitAnalysis", () => {
  it("accepts a complete explainable decision", () => expect(parseJobFitAnalysis(JSON.stringify(valid))).toEqual(valid));
  it("accepts defensive Markdown fences", () => expect(parseJobFitAnalysis(`\`\`\`json\n${JSON.stringify(valid)}\n\`\`\``).matchScore).toBe(82));
  it("extracts a JSON object surrounded by accidental prose", () => expect(parseJobFitAnalysis(`Resposta:\n${JSON.stringify(valid)}\nFim.`).decision).toBe("APLICAR"));
  it.each([-1, 101, 70.5])("rejects invalid score %s", (matchScore) => expect(() => parseJobFitAnalysis(JSON.stringify({ ...valid, matchScore }))).toThrow("analise de fit invalida"));
  it("blocks auto-apply when description is insufficient", () => expect(() => parseJobFitAnalysis(JSON.stringify({ ...valid, descriptionSufficient: false }))).toThrow("analise de fit invalida"));
  it("requires fit to match the APPLY decision", () => expect(() => parseJobFitAnalysis(JSON.stringify({ ...valid, fit: false }))).toThrow("analise de fit invalida"));
});
