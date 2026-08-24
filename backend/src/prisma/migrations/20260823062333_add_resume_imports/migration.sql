-- CreateEnum
CREATE TYPE "ResumeImportStatus" AS ENUM ('PENDING_REVIEW', 'REVIEWED', 'REJECTED');

-- CreateTable
CREATE TABLE "resume_imports" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "source_sha256" TEXT NOT NULL,
    "raw_text" TEXT NOT NULL,
    "proposals" JSONB NOT NULL,
    "status" "ResumeImportStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(3),

    CONSTRAINT "resume_imports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "resume_imports_source_sha256_key" ON "resume_imports"("source_sha256");

-- CreateIndex
CREATE INDEX "resume_imports_profile_id_status_idx" ON "resume_imports"("profile_id", "status");

-- AddForeignKey
ALTER TABLE "resume_imports" ADD CONSTRAINT "resume_imports_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "candidate_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
