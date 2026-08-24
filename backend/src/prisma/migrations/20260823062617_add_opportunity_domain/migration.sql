-- CreateEnum
CREATE TYPE "JobSourcePlatform" AS ENUM ('GITHUB', 'LINKEDIN', 'GUPY', 'INDEED', 'GREENHOUSE', 'LEVER', 'ASHBY', 'WORKABLE', 'SMARTRECRUITERS', 'COMPANY_SITE', 'EMAIL', 'OTHER');

-- CreateEnum
CREATE TYPE "RequirementKind" AS ENUM ('ESSENTIAL', 'DESIRABLE');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('DRAFT', 'MANUAL_ACTION', 'SUBMITTED', 'TEST', 'INTERVIEW', 'REJECTED', 'WITHDRAWN', 'OFFER');

-- CreateEnum
CREATE TYPE "ApplicationEventType" AS ENUM ('CREATED', 'MATERIAL_GENERATED', 'MANUAL_ACTION_REQUIRED', 'SUBMITTED', 'EMAIL_SENT', 'REPLY_RECEIVED', 'STATUS_CHANGED', 'NOTE');

-- CreateEnum
CREATE TYPE "MaterialType" AS ENUM ('CV_ATS', 'CV_VISUAL', 'EMAIL', 'COVER_LETTER', 'RECRUITER_MESSAGE', 'FORM_ANSWERS');

-- AlterTable
ALTER TABLE "jobs" ADD COLUMN     "opportunity_id" TEXT;

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalized_name" TEXT NOT NULL,
    "website" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunities" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "normalized_title" TEXT NOT NULL,
    "location" TEXT,
    "normalized_location" TEXT,
    "description" TEXT,
    "description_hash" TEXT,
    "fingerprint" TEXT NOT NULL,
    "contact_email" TEXT,
    "salary_text" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "first_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opportunities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_sources" (
    "id" TEXT NOT NULL,
    "opportunity_id" TEXT NOT NULL,
    "platform" "JobSourcePlatform" NOT NULL,
    "external_id" TEXT,
    "canonical_url" TEXT NOT NULL,
    "raw_url" TEXT NOT NULL,
    "discovered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "job_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requirements" (
    "id" TEXT NOT NULL,
    "opportunity_id" TEXT NOT NULL,
    "kind" "RequirementKind" NOT NULL,
    "text" TEXT NOT NULL,
    "normalized_key" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applications" (
    "id" TEXT NOT NULL,
    "opportunity_id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'DRAFT',
    "channel" TEXT,
    "submitted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_events" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "type" "ApplicationEventType" NOT NULL,
    "from_status" "ApplicationStatus",
    "to_status" "ApplicationStatus",
    "message" TEXT,
    "metadata" JSONB,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "generated_materials" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "type" "MaterialType" NOT NULL,
    "version" INTEGER NOT NULL,
    "content_text" TEXT,
    "content_data" BYTEA,
    "content_hash" TEXT NOT NULL,
    "model" TEXT,
    "prompt_version" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "generated_materials_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "companies_normalized_name_key" ON "companies"("normalized_name");

-- CreateIndex
CREATE UNIQUE INDEX "opportunities_fingerprint_key" ON "opportunities"("fingerprint");

-- CreateIndex
CREATE INDEX "opportunities_company_id_normalized_title_idx" ON "opportunities"("company_id", "normalized_title");

-- CreateIndex
CREATE INDEX "opportunities_active_last_seen_at_idx" ON "opportunities"("active", "last_seen_at");

-- CreateIndex
CREATE UNIQUE INDEX "job_sources_canonical_url_key" ON "job_sources"("canonical_url");

-- CreateIndex
CREATE INDEX "job_sources_opportunity_id_idx" ON "job_sources"("opportunity_id");

-- CreateIndex
CREATE UNIQUE INDEX "job_sources_platform_external_id_key" ON "job_sources"("platform", "external_id");

-- CreateIndex
CREATE INDEX "requirements_opportunity_id_kind_idx" ON "requirements"("opportunity_id", "kind");

-- CreateIndex
CREATE INDEX "applications_profile_id_status_idx" ON "applications"("profile_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "applications_opportunity_id_profile_id_key" ON "applications"("opportunity_id", "profile_id");

-- CreateIndex
CREATE INDEX "application_events_application_id_occurred_at_idx" ON "application_events"("application_id", "occurred_at");

-- CreateIndex
CREATE INDEX "generated_materials_application_id_type_idx" ON "generated_materials"("application_id", "type");

-- CreateIndex
CREATE UNIQUE INDEX "generated_materials_application_id_type_version_key" ON "generated_materials"("application_id", "type", "version");

-- CreateIndex
CREATE INDEX "jobs_opportunity_id_idx" ON "jobs"("opportunity_id");

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_sources" ADD CONSTRAINT "job_sources_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requirements" ADD CONSTRAINT "requirements_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "candidate_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_events" ADD CONSTRAINT "application_events_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_materials" ADD CONSTRAINT "generated_materials_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
