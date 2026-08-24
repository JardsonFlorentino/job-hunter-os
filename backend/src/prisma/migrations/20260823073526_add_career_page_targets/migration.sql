-- CreateTable
CREATE TABLE "career_page_targets" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "careers_url" TEXT NOT NULL,
    "platform" "JobSourcePlatform" NOT NULL,
    "identifier" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "career_page_targets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "career_page_targets_careers_url_key" ON "career_page_targets"("careers_url");

-- CreateIndex
CREATE INDEX "career_page_targets_enabled_priority_idx" ON "career_page_targets"("enabled", "priority");

-- CreateIndex
CREATE INDEX "career_page_targets_platform_identifier_idx" ON "career_page_targets"("platform", "identifier");
