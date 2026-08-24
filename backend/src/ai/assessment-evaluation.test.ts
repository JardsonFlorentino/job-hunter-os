import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { parseJobFitAnalysis } from "./job-analysis.js";

interface Case { name: string; expectedDecision: string; analysis: unknown }
const cases = JSON.parse(readFileSync(fileURLToPath(new URL("./fixtures/assessment-evaluation.json", import.meta.url)), "utf8")) as Case[];

describe("local assessment evaluation dataset", () => {
  for (const scenario of cases) it(scenario.name, () => expect(parseJobFitAnalysis(JSON.stringify(scenario.analysis)).decision).toBe(scenario.expectedDecision));
});
