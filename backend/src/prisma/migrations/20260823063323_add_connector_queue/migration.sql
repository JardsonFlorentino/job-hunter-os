-- CreateEnum
CREATE TYPE "QueueItemStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'DEAD');

-- CreateEnum
CREATE TYPE "ConnectorRunStatus" AS ENUM ('RUNNING', 'SUCCESS', 'PARTIAL', 'FAILED');

-- CreateTable
CREATE TABLE "connector_runs" (
    "id" TEXT NOT NULL,
    "connector" TEXT NOT NULL,
    "status" "ConnectorRunStatus" NOT NULL DEFAULT 'RUNNING',
    "discovered" INTEGER NOT NULL DEFAULT 0,
    "enriched" INTEGER NOT NULL DEFAULT 0,
    "persisted" INTEGER NOT NULL DEFAULT 0,
    "error_count" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),

    CONSTRAINT "connector_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "queue_items" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "dedupe_key" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "QueueItemStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 5,
    "next_attempt_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "locked_at" TIMESTAMP(3),
    "locked_by" TEXT,
    "last_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "queue_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "connector_runs_connector_started_at_idx" ON "connector_runs"("connector", "started_at");

-- CreateIndex
CREATE UNIQUE INDEX "queue_items_dedupe_key_key" ON "queue_items"("dedupe_key");

-- CreateIndex
CREATE INDEX "queue_items_status_next_attempt_at_idx" ON "queue_items"("status", "next_attempt_at");

-- CreateIndex
CREATE INDEX "queue_items_locked_at_idx" ON "queue_items"("locked_at");
