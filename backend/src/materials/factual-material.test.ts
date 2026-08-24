import { describe, expect, it } from "vitest";

import type { ApprovedCareerContext } from "../career-dna/context.js";
import { approvedFormAnswer, buildAtsResumeText, selectRelevantCareerFacts } from "./factual-material.js";

const context: ApprovedCareerContext = {
  experiences: [], educations: [], certifications: [], languages: [], evidences: [],
  projects: [{ name: "API", summary: "API Node", technologies: ["Node.js"], highlights: [] }, { name: "UI", summary: "Interface React", technologies: ["React"], highlights: [] }],
  skills: [{ name: "Node.js", category: "Backend", level: "INTERMEDIARIO", yearsExperience: null }, { name: "React", category: "Frontend", level: "INTERMEDIARIO", yearsExperience: null }],
  approvedAnswers: [{ questionKey: "salary", answer: "R$ 5.000" }],
};

describe("factual materials", () => {
  it("selects relevant approved facts", () => expect(selectRelevantCareerFacts(context, "Backend Node API").projects[0]?.name).toBe("API"));
  it("answers forms only from approved library", () => { expect(approvedFormAnswer(context, "salary")).toBe("R$ 5.000"); expect(approvedFormAnswer(context, "unknown")).toBeNull(); });
  it("ATS text contains only supplied CV data", () => { const text = buildAtsResumeText({ name: "Pessoa", email: "p@example.test", summary: "Resumo aprovado", experiences: [], skills: ["Node.js"] }); expect(text).toContain("Resumo aprovado"); expect(text).not.toContain("React"); });
});
