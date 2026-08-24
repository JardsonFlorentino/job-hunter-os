import { describe, expect, it } from "vitest";

import type { ApprovedCareerContext } from "../career-dna/context.js";
import { suggestApprovedFormAnswer } from "./ai-materials.js";

const empty: ApprovedCareerContext = { experiences: [], projects: [], skills: [], educations: [], certifications: [], languages: [], evidences: [], approvedAnswers: [] };

describe("form suggestions", () => {
  it("requires review for every unknown answer", () => expect(suggestApprovedFormAnswer(empty, "work_authorization")).toEqual({ answer: null, requiresReview: true }));
  it("returns an approved answer without inference", () => expect(suggestApprovedFormAnswer({ ...empty, approvedAnswers: [{ questionKey: "salary", answer: "5000" }] }, "salary")).toEqual({ answer: "5000", requiresReview: false }));
});
