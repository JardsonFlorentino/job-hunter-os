import { ApplicationStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { submissionConfirmationDecision } from "./submission-policy";

describe("assisted submission confirmation policy", () => {
  it.each([ApplicationStatus.DRAFT, ApplicationStatus.MANUAL_ACTION])("records confirmation from %s", (status) => {
    expect(submissionConfirmationDecision(status)).toBe("RECORD");
  });

  it.each([ApplicationStatus.SUBMITTED, ApplicationStatus.TEST, ApplicationStatus.INTERVIEW, ApplicationStatus.OFFER])("keeps advanced status %s unchanged", (status) => {
    expect(submissionConfirmationDecision(status)).toBe("ALREADY_RECORDED");
  });

  it.each([ApplicationStatus.REJECTED, ApplicationStatus.WITHDRAWN])("blocks confirmation from terminal status %s", (status) => {
    expect(submissionConfirmationDecision(status)).toBe("BLOCK");
  });
});