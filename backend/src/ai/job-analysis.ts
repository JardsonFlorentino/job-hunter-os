import { z } from "zod";

const requirementSchema = z.object({ text: z.string().trim().min(1), met: z.boolean(), evidence: z.string().trim().min(1).nullable() });
const score = z.number().int().min(0).max(100);
const analysisSchema = z.object({
  fit: z.boolean(),
  decision: z.enum(["APLICAR", "REVISAR", "IGNORAR"]),
  matchScore: score,
  descriptionSufficient: z.boolean(),
  scoreBreakdown: z.object({ stack: score, seniority: score, responsibilities: score, location: score, language: score, restrictions: score }),
  essentialRequirements: z.array(requirementSchema),
  desirableRequirements: z.array(requirementSchema),
  strengths: z.array(z.string().trim().min(1)),
  gaps: z.array(z.string().trim().min(1)),
  risks: z.array(z.string().trim().min(1)),
  strategy: z.string().trim().min(1),
  aiReason: z.string().trim().min(1),
}).superRefine((value, context) => {
  if (value.fit !== (value.decision === "APLICAR")) context.addIssue({ code: "custom", message: "fit deve corresponder à decisão APLICAR" });
  if (value.decision === "APLICAR" && (value.matchScore < 70 || !value.descriptionSufficient)) context.addIssue({ code: "custom", message: "APLICAR exige score >= 70 e descrição suficiente" });
  if (value.decision === "APLICAR" && value.essentialRequirements.some((requirement) => !requirement.met)) context.addIssue({ code: "custom", path: ["essentialRequirements"], message: "APLICAR não permite requisito essencial não atendido" });
  if (value.decision === "APLICAR" && value.scoreBreakdown.seniority < 60) context.addIssue({ code: "custom", path: ["scoreBreakdown", "seniority"], message: "APLICAR exige senioridade minimamente compatível" });
  if (value.decision === "APLICAR" && value.scoreBreakdown.restrictions < 80) context.addIssue({ code: "custom", path: ["scoreBreakdown", "restrictions"], message: "APLICAR exige elegibilidade e restrições compatíveis" });
});

export type JobFitAnalysis = z.infer<typeof analysisSchema>;

export function parseJobFitAnalysis(response: string): JobFitAnalysis {
  const unfenced = response.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const firstBrace = unfenced.indexOf("{");
  const lastBrace = unfenced.lastIndexOf("}");
  const normalized = firstBrace >= 0 && lastBrace > firstBrace
    ? unfenced.slice(firstBrace, lastBrace + 1)
    : unfenced;
  try {
    return analysisSchema.parse(JSON.parse(normalized) as unknown);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      const fields = [...new Set(error.issues.map((issue) => issue.path.join(".") || "root"))].slice(0, 6);
      throw new Error(`A IA retornou uma analise de fit invalida nos campos: ${fields.join(", ")}.`);
    }
    throw new Error("A IA retornou JSON incompleto ou invalido.");
  }
}
