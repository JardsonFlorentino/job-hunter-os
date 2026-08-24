-- CreateEnum
CREATE TYPE "SkillLevel" AS ENUM ('BASICO', 'INTERMEDIARIO', 'AVANCADO');

-- CreateEnum
CREATE TYPE "LanguageLevel" AS ENUM ('BASICO', 'INTERMEDIARIO', 'AVANCADO', 'FLUENTE', 'NATIVO');

-- CreateEnum
CREATE TYPE "BlockedPreferenceType" AS ENUM ('EMPRESA', 'TECNOLOGIA', 'LOCALIZACAO', 'CONDICAO');

-- CreateTable
CREATE TABLE "experiences" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "current" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT NOT NULL,
    "achievements" TEXT[],
    "technologies" TEXT[],
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "experiences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "url" TEXT,
    "repository" TEXT,
    "technologies" TEXT[],
    "highlights" TEXT[],
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skills" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "level" "SkillLevel" NOT NULL,
    "years_experience" DECIMAL(4,1),
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "educations" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "course" TEXT NOT NULL,
    "degree" TEXT,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "description" TEXT,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "educations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certifications" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "issuer" TEXT NOT NULL,
    "issued_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "credential_url" TEXT,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "certifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidate_languages" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" "LanguageLevel" NOT NULL,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "candidate_languages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_preferences" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "target_titles" TEXT[],
    "target_stacks" TEXT[],
    "target_seniorities" TEXT[],
    "contract_types" TEXT[],
    "work_modes" TEXT[],
    "locations" TEXT[],
    "minimum_clt" DECIMAL(12,2),
    "minimum_pj" DECIMAL(12,2),
    "accepts_international" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blocked_preferences" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "type" "BlockedPreferenceType" NOT NULL,
    "value" TEXT NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blocked_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approved_answers" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "question_key" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "approved_answers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "experiences_profile_id_sort_order_idx" ON "experiences"("profile_id", "sort_order");

-- CreateIndex
CREATE INDEX "projects_profile_id_sort_order_idx" ON "projects"("profile_id", "sort_order");

-- CreateIndex
CREATE INDEX "skills_profile_id_category_idx" ON "skills"("profile_id", "category");

-- CreateIndex
CREATE UNIQUE INDEX "skills_profile_id_name_key" ON "skills"("profile_id", "name");

-- CreateIndex
CREATE INDEX "educations_profile_id_sort_order_idx" ON "educations"("profile_id", "sort_order");

-- CreateIndex
CREATE INDEX "certifications_profile_id_idx" ON "certifications"("profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "candidate_languages_profile_id_name_key" ON "candidate_languages"("profile_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "job_preferences_profile_id_key" ON "job_preferences"("profile_id");

-- CreateIndex
CREATE INDEX "blocked_preferences_profile_id_type_idx" ON "blocked_preferences"("profile_id", "type");

-- CreateIndex
CREATE UNIQUE INDEX "blocked_preferences_profile_id_type_value_key" ON "blocked_preferences"("profile_id", "type", "value");

-- CreateIndex
CREATE INDEX "approved_answers_profile_id_approved_idx" ON "approved_answers"("profile_id", "approved");

-- CreateIndex
CREATE UNIQUE INDEX "approved_answers_profile_id_question_key_key" ON "approved_answers"("profile_id", "question_key");

-- AddForeignKey
ALTER TABLE "experiences" ADD CONSTRAINT "experiences_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "candidate_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "candidate_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skills" ADD CONSTRAINT "skills_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "candidate_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "educations" ADD CONSTRAINT "educations_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "candidate_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certifications" ADD CONSTRAINT "certifications_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "candidate_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_languages" ADD CONSTRAINT "candidate_languages_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "candidate_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_preferences" ADD CONSTRAINT "job_preferences_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "candidate_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blocked_preferences" ADD CONSTRAINT "blocked_preferences_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "candidate_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approved_answers" ADD CONSTRAINT "approved_answers_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "candidate_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
