import { ApplicationStatus } from "@prisma/client";

const ALREADY_RECORDED = new Set<ApplicationStatus>([
  ApplicationStatus.SUBMITTED,
  ApplicationStatus.TEST,
  ApplicationStatus.INTERVIEW,
  ApplicationStatus.OFFER,
]);

export type SubmissionConfirmationDecision = "RECORD" | "ALREADY_RECORDED" | "BLOCK";

export function submissionConfirmationDecision(status: ApplicationStatus): SubmissionConfirmationDecision {
  if (ALREADY_RECORDED.has(status)) return "ALREADY_RECORDED";
  if (status === ApplicationStatus.DRAFT || status === ApplicationStatus.MANUAL_ACTION) return "RECORD";
  return "BLOCK";
}