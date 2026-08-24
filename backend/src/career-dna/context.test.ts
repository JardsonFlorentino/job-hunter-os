import { describe, expect, it } from "vitest";

import { serializeApprovedCareerContext, type ApprovedCareerContext } from "./context.js";

describe("Career DNA approved context", () => {
  it("serializes only the facts supplied by the approved-only query", () => {
    const context: ApprovedCareerContext = {
      experiences: [], projects: [], educations: [], certifications: [], languages: [], approvedAnswers: [],
      skills: [{ name: "TypeScript", category: "Frontend", level: "AVANCADO", yearsExperience: null }],
      evidences: [{ claim: "Entregou o projeto X", result: "Reduziu retrabalho", metric: null, sourceUrl: null }],
    };
    const serialized = serializeApprovedCareerContext(context);
    expect(serialized).toContain("TypeScript");
    expect(serialized).toContain("Reduziu retrabalho");
    expect(serialized).not.toContain("React");
    expect(serialized).not.toContain("8 anos");
  });

  it("keeps an empty context empty instead of inventing candidate claims", () => {
    const empty: ApprovedCareerContext = { experiences: [], projects: [], skills: [], educations: [], certifications: [], languages: [], evidences: [], approvedAnswers: [] };
    expect(serializeApprovedCareerContext(empty)).not.toMatch(/React|Node|anos|gestão/i);
  });
});
