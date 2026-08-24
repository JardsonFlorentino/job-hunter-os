import type { PrismaClient } from "@prisma/client";

export interface RankingInput {
  matchScore: number;
  lastSeenAt: Date;
  hasDirectEmail: boolean;
  sourceCount: number;
}

export function calculateRankingScore(input: RankingInput, now = new Date()): number {
  const ageDays = Math.max(0, (now.getTime() - input.lastSeenAt.getTime()) / 86_400_000);
  const recency = Math.max(0, 100 - ageDays * (100 / 14));
  const effort = input.hasDirectEmail ? 100 : input.sourceCount > 1 ? 70 : 45;
  return Math.round((input.matchScore * 0.7 + recency * 0.2 + effort * 0.1) * 100) / 100;
}

export async function getDailyRanking(prisma: PrismaClient, profileId: string, now = new Date(), limit = 30) {
  const opportunities = await prisma.opportunity.findMany({
    where: { active: true, assessments: { some: { profile_id: profileId, decision: { in: ["APLICAR", "REVISAR"] } } } },
    include: { sources: { select: { platform: true } }, assessments: { where: { profile_id: profileId }, orderBy: { created_at: "desc" }, take: 1 } },
  });
  return opportunities
    .flatMap((opportunity) => { const assessment = opportunity.assessments[0]; return assessment ? [{ opportunity, assessment, rankingScore: calculateRankingScore({ matchScore: assessment.match_score, lastSeenAt: opportunity.last_seen_at, hasDirectEmail: Boolean(opportunity.contact_email), sourceCount: opportunity.sources.length }, now) }] : []; })
    .sort((left, right) => right.rankingScore - left.rankingScore)
    .slice(0, limit);
}
