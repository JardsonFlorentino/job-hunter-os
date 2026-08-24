-- CreateTable
CREATE TABLE "career_evidences" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "claim" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "metric" TEXT,
    "source_url" TEXT,
    "source_note" TEXT,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "career_evidences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "career_evidences_profile_id_approved_idx" ON "career_evidences"("profile_id", "approved");

-- AddForeignKey
ALTER TABLE "career_evidences" ADD CONSTRAINT "career_evidences_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "candidate_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
