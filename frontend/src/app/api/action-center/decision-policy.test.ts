import { ApplicationEventType, ApplicationStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { decisionUpdate, type ActionCenterDecision } from "./decision-policy";

const now = new Date("2026-08-24T12:00:00.000Z");

function decide(action: ActionCenterDecision["action"]) {
  return decisionUpdate({ applicationId: "application-1", action } as ActionCenterDecision, ApplicationStatus.DRAFT, now);
}

describe("Action Center decision policy", () => {
  it.each([
    ["APPROVE", ApplicationStatus.MANUAL_ACTION, ApplicationEventType.STATUS_CHANGED],
    ["IGNORE", ApplicationStatus.WITHDRAWN, ApplicationEventType.STATUS_CHANGED],
    ["REGENERATE", ApplicationStatus.DRAFT, ApplicationEventType.NOTE],
    ["MARK_MANUAL", ApplicationStatus.MANUAL_ACTION, ApplicationEventType.MANUAL_ACTION_REQUIRED],
    ["MARK_SUBMITTED", ApplicationStatus.SUBMITTED, ApplicationEventType.SUBMITTED],
  ] as const)("maps %s to an audited transition", (action, status, eventType) => {
    const change = decide(action);
    expect(change.data.status).toBe(status);
    expect(change.event.type).toBe(eventType);
    expect(change.event.application_id).toBe("application-1");
  });

  it("postpones exactly 24 hours without changing status", () => {
    const change = decide("POSTPONE");
    expect(change.data.due_at).toEqual(new Date("2026-08-25T12:00:00.000Z"));
    expect(change.event.to_status).toBe(ApplicationStatus.DRAFT);
  });

  it("records the fixed confirmation time for a manual submission", () => {
    expect(decide("MARK_SUBMITTED").data.submitted_at).toEqual(now);
  });
});