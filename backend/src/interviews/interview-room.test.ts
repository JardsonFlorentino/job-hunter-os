import { describe, expect, it } from "vitest";

import type { ApprovedCareerContext } from "../career-dna/context.js";
import { buildInterviewRoom } from "./interview-room.js";

const context: ApprovedCareerContext = { experiences: [], projects: [], skills: [], educations: [], certifications: [], languages: [], approvedAnswers: [], evidences: [{ claim: "Projeto aprovado", result: "Resultado aprovado", metric: "30%", sourceUrl: null }] };

describe("interview room", () => {
  it("builds STAR scaffolding only from approved evidence", () => { const room = buildInterviewRoom(context, ["React"]); expect(room.starStories[0]?.result).toContain("30%"); expect(JSON.stringify(room)).not.toContain("Node.js"); });
  it("does not invent stories when evidence is empty", () => expect(buildInterviewRoom({ ...context, evidences: [] }, []).starStories).toEqual([]));
});
