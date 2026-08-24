import { ApplicationEventType, ApplicationStatus, Prisma } from "@prisma/client";

export type ActionCenterDecision =
  | { applicationId: string; action: "APPROVE" }
  | { applicationId: string; action: "IGNORE" }
  | { applicationId: string; action: "POSTPONE" }
  | { applicationId: string; action: "REGENERATE" }
  | { applicationId: string; action: "MARK_MANUAL" }
  | { applicationId: string; action: "MARK_SUBMITTED" };

export function decisionUpdate(decision: ActionCenterDecision, currentStatus: ApplicationStatus, now = new Date()): { data: Prisma.ApplicationUpdateInput; event: Prisma.ApplicationEventUncheckedCreateInput } {
  const base = { application_id: decision.applicationId, type: ApplicationEventType.STATUS_CHANGED, from_status: currentStatus };
  switch (decision.action) {
    case "APPROVE":
      return { data: { status: ApplicationStatus.MANUAL_ACTION, next_action: "Revisar os materiais e concluir a candidatura no canal indicado.", due_at: null }, event: { ...base, to_status: ApplicationStatus.MANUAL_ACTION, message: "Oportunidade aprovada para preparação manual." } };
    case "IGNORE":
      return { data: { status: ApplicationStatus.WITHDRAWN, next_action: null, due_at: null }, event: { ...base, to_status: ApplicationStatus.WITHDRAWN, message: "Oportunidade ignorada por decisão humana." } };
    case "POSTPONE": {
      const dueAt = new Date(now.getTime() + 24 * 60 * 60 * 1_000);
      return { data: { due_at: dueAt, next_action: `Reavaliar em ${dueAt.toISOString()}.` }, event: { ...base, to_status: currentStatus, message: `Decisão adiada até ${dueAt.toISOString()}.` } };
    }
    case "MARK_MANUAL":
      return { data: { status: ApplicationStatus.MANUAL_ACTION, channel: "MANUAL", next_action: "Concluir a candidatura manualmente e confirmar o envio no painel." }, event: { ...base, type: ApplicationEventType.MANUAL_ACTION_REQUIRED, to_status: ApplicationStatus.MANUAL_ACTION, message: "Candidatura encaminhada explicitamente para ação manual." } };
    case "MARK_SUBMITTED":
      return { data: { status: ApplicationStatus.SUBMITTED, channel: "MANUAL", submitted_at: now, next_action: "Aguardar confirmação ou resposta da empresa.", due_at: null }, event: { ...base, type: ApplicationEventType.SUBMITTED, to_status: ApplicationStatus.SUBMITTED, message: "Candidatura manual confirmada pelo usuário." } };
    case "REGENERATE":
      return { data: { status: ApplicationStatus.DRAFT, next_action: "Aguardar regeneração segura dos materiais." }, event: { ...base, type: ApplicationEventType.NOTE, to_status: ApplicationStatus.DRAFT, message: "Regeneração de materiais solicitada pelo usuário." } };
  }
}