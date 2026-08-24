import { ApplicationEventType, ApplicationStatus, Prisma, type PrismaClient } from "@prisma/client";

import { canonicalizeJobUrl, detectPlatform, extractExternalId, hashText, normalizeText, opportunityFingerprint } from "./normalization.js";

const MAX_TRANSACTION_RETRIES = 10;

function retryDelay(attempt: number): Promise<void> {
  const exponentialMs = Math.min(250, 10 * 2 ** attempt);
  const jitterMs = Math.floor(Math.random() * 20);
  return new Promise((resolve) => setTimeout(resolve, exponentialMs + jitterMs));
}

export interface DiscoveredOpportunityInput {
  title: string;
  company: string;
  url: string;
  location?: string | null;
  description?: string | null;
  contactEmail?: string | null;
  salaryText?: string | null;
}

export async function saveOpportunity(prisma: PrismaClient, input: DiscoveredOpportunityInput, attempt = 0): Promise<{ opportunityId: string; sourceId: string }> {
  const canonicalUrl = canonicalizeJobUrl(input.url);
  const platform = detectPlatform(canonicalUrl);
  const externalId = extractExternalId(canonicalUrl, platform);
  const fingerprint = opportunityFingerprint(input);

  try {
    return await prisma.$transaction(async (tx) => {
      const existingSource = await tx.jobSource.findUnique({ where: { canonical_url: canonicalUrl }, select: { id: true, opportunity_id: true } });
      if (existingSource) {
        await tx.jobSource.update({
          where: { id: existingSource.id },
          data: { raw_url: input.url, last_seen_at: new Date() },
        });
        await tx.opportunity.update({
          where: { id: existingSource.opportunity_id },
          data: {
            last_seen_at: new Date(),
            ...(input.description != null ? { description: input.description, description_hash: hashText(input.description) } : {}),
            ...(input.contactEmail != null ? { contact_email: input.contactEmail } : {}),
            ...(input.salaryText != null ? { salary_text: input.salaryText } : {}),
            ...(input.location != null ? { location: input.location, normalized_location: normalizeText(input.location) || null } : {}),
          },
        });
        return { opportunityId: existingSource.opportunity_id, sourceId: existingSource.id };
      }

      const company = await tx.company.upsert({
        where: { normalized_name: normalizeText(input.company) },
        create: { name: input.company.trim(), normalized_name: normalizeText(input.company) },
        update: { name: input.company.trim() },
        select: { id: true },
      });
      const opportunity = await tx.opportunity.upsert({
        where: { fingerprint },
        create: {
          company_id: company.id, title: input.title.trim(), normalized_title: normalizeText(input.title),
          location: input.location ?? null, normalized_location: normalizeText(input.location) || null,
          description: input.description ?? null, description_hash: hashText(input.description), fingerprint,
          contact_email: input.contactEmail ?? null, salary_text: input.salaryText ?? null,
        },
        update: {
          last_seen_at: new Date(),
          ...(input.description != null ? { description: input.description, description_hash: hashText(input.description) } : {}),
          ...(input.contactEmail != null ? { contact_email: input.contactEmail } : {}),
          ...(input.salaryText != null ? { salary_text: input.salaryText } : {}),
        },
        select: { id: true },
      });
      const source = await tx.jobSource.create({
        data: { opportunity_id: opportunity.id, platform, external_id: externalId, canonical_url: canonicalUrl, raw_url: input.url },
        select: { id: true },
      });
      return { opportunityId: opportunity.id, sourceId: source.id };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, maxWait: 10_000, timeout: 15_000 });
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034" && attempt < MAX_TRANSACTION_RETRIES) {
      await retryDelay(attempt);
      return saveOpportunity(prisma, input, attempt + 1);
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const source = await prisma.jobSource.findFirst({
        where: { OR: [
          { canonical_url: canonicalUrl },
          ...(externalId ? [{ platform, external_id: externalId }] : []),
        ] },
        select: { id: true, opportunity_id: true },
      });
      if (source) return { opportunityId: source.opportunity_id, sourceId: source.id };
      const opportunity = await prisma.opportunity.findUnique({ where: { fingerprint }, select: { id: true } });
      if (!opportunity && attempt < MAX_TRANSACTION_RETRIES) {
        await retryDelay(attempt);
        return saveOpportunity(prisma, input, attempt + 1);
      }
      if (!opportunity) throw error;
      const createdSource = await prisma.jobSource.upsert({
        where: { canonical_url: canonicalUrl },
        create: { opportunity_id: opportunity.id, platform, external_id: externalId, canonical_url: canonicalUrl, raw_url: input.url },
        update: { last_seen_at: new Date(), raw_url: input.url }, select: { id: true },
      });
      return { opportunityId: opportunity.id, sourceId: createdSource.id };
    }
    throw error;
  }
}

export async function createApplicationOnce(prisma: PrismaClient, opportunityId: string, profileId: string, status: ApplicationStatus = ApplicationStatus.DRAFT, attempt = 0): Promise<string> {
  try {
    return await prisma.$transaction(async (tx) => {
      const existing = await tx.application.findUnique({ where: { opportunity_id_profile_id: { opportunity_id: opportunityId, profile_id: profileId } }, select: { id: true } });
      if (existing) return existing.id;
      const application = await tx.application.create({ data: { opportunity_id: opportunityId, profile_id: profileId, status }, select: { id: true } });
      await tx.applicationEvent.create({ data: { application_id: application.id, type: ApplicationEventType.CREATED, to_status: status, message: "Candidatura criada pela trava transacional de duplicidade." } });
      return application.id;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, maxWait: 10_000, timeout: 15_000 });
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && ["P2002", "P2028", "P2034"].includes(error.code) && attempt < MAX_TRANSACTION_RETRIES) {
      const existing = await prisma.application.findUnique({ where: { opportunity_id_profile_id: { opportunity_id: opportunityId, profile_id: profileId } }, select: { id: true } });
      if (existing) return existing.id;
      await retryDelay(attempt);
      return createApplicationOnce(prisma, opportunityId, profileId, status, attempt + 1);
    }
    throw error;
  }
}
