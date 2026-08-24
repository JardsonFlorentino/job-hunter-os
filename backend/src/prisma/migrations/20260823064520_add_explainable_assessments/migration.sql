-- CreateEnum
CREATE TYPE "OpportunityDecision" AS ENUM ('APLICAR', 'REVISAR', 'IGNORAR');

-- CreateTable
CREATE TABLE "opportunity_assessments" (
    "id" TEXT NOT NULL,
    "opportunity_id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "decision" "OpportunityDecision" NOT NULL,
    "match_score" INTEGER NOT NULL,
    "description_sufficient" BOOLEAN NOT NULL,
    "score_breakdown" JSONB NOT NULL,
    "essential_requirements" JSONB NOT NULL,
    "desirable_requirements" JSONB NOT NULL,
    "strengths" TEXT[],
    "gaps" TEXT[],
    "risks" TEXT[],
    "strategy" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "prompt_version" TEXT NOT NULL,
    "input_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "opportunity_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "opportunity_assessments_profile_id_decision_match_score_idx" ON "opportunity_assessments"("profile_id", "decision", "match_score");

-- CreateIndex
CREATE UNIQUE INDEX "opportunity_assessments_opportunity_id_profile_id_prompt_ve_key" ON "opportunity_assessments"("opportunity_id", "profile_id", "prompt_version", "input_hash");

-- AddForeignKey
ALTER TABLE "opportunity_assessments" ADD CONSTRAINT "opportunity_assessments_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_assessments" ADD CONSTRAINT "opportunity_assessments_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "candidate_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
