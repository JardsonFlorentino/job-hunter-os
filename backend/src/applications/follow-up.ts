import { ApplicationStatus, FollowUpStatus, type PrismaClient } from "@prisma/client";

const MAX_FOLLOW_UPS = 2;

export async function createFollowUpDraft(prisma: PrismaClient, applicationId: string, now = new Date()): Promise<string | null> {
  const application = await prisma.application.findUniqueOrThrow({ where: { id: applicationId }, include: { follow_ups: true, inbox_messages: true, opportunity: { include: { company: true } } } });
  if (application.status !== ApplicationStatus.SUBMITTED || application.inbox_messages.length > 0 || application.follow_ups.length >= MAX_FOLLOW_UPS) return null;
  const sequence = application.follow_ups.length + 1;
  const scheduledAt = new Date(now.getTime() + (sequence === 1 ? 7 : 14) * 86_400_000);
  const draft = await prisma.followUp.create({ data: {
    application_id: application.id, sequence, status: FollowUpStatus.DRAFT, scheduled_at: scheduledAt,
    subject: `Acompanhamento — ${application.opportunity.title}`,
    body: `Olá, gostaria de acompanhar o processo referente à oportunidade de ${application.opportunity.title}. Continuo disponível para conversar e fornecer informações adicionais.\n\nJardson Florentino`,
  }, select: { id: true } });
  return draft.id;
}

export async function prepareFollowUpDrafts(prisma: PrismaClient, now = new Date()): Promise<number> {
  const applications = await prisma.application.findMany({ where: { status: ApplicationStatus.SUBMITTED, inbox_messages: { none: {} } }, select: { id: true } });
  let created = 0;
  for (const application of applications) if (await createFollowUpDraft(prisma, application.id, now)) created += 1;
  return created;
}
