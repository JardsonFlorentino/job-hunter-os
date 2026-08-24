-- CreateEnum
CREATE TYPE "ReplyClassification" AS ENUM ('CONFIRMACAO', 'REJEICAO', 'TESTE', 'ENTREVISTA', 'AMBIGUO', 'SUSPEITA_FRAUDE');

-- CreateEnum
CREATE TYPE "FollowUpStatus" AS ENUM ('DRAFT', 'APPROVED', 'SENT', 'CANCELED');

-- AlterTable
ALTER TABLE "applications" ADD COLUMN     "contact_email" TEXT,
ADD COLUMN     "contact_name" TEXT,
ADD COLUMN     "due_at" TIMESTAMP(3),
ADD COLUMN     "next_action" TEXT;

-- CreateTable
CREATE TABLE "inbox_messages" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "application_id" TEXT,
    "message_id" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "subject" TEXT,
    "body_text" TEXT NOT NULL,
    "classification" "ReplyClassification" NOT NULL,
    "fraud_signals" TEXT[],
    "received_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inbox_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "follow_ups" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "status" "FollowUpStatus" NOT NULL DEFAULT 'DRAFT',
    "sequence" INTEGER NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "approved_at" TIMESTAMP(3),
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "follow_ups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interviews" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "scheduled_at" TIMESTAMP(3),
    "deadline_at" TIMESTAMP(3),
    "contact_name" TEXT,
    "contact_email" TEXT,
    "meeting_url" TEXT,
    "notes" TEXT,
    "feedback" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "inbox_messages_message_id_key" ON "inbox_messages"("message_id");

-- CreateIndex
CREATE INDEX "inbox_messages_profile_id_received_at_idx" ON "inbox_messages"("profile_id", "received_at");

-- CreateIndex
CREATE INDEX "inbox_messages_application_id_idx" ON "inbox_messages"("application_id");

-- CreateIndex
CREATE INDEX "follow_ups_status_scheduled_at_idx" ON "follow_ups"("status", "scheduled_at");

-- CreateIndex
CREATE UNIQUE INDEX "follow_ups_application_id_sequence_key" ON "follow_ups"("application_id", "sequence");

-- CreateIndex
CREATE INDEX "interviews_scheduled_at_idx" ON "interviews"("scheduled_at");

-- AddForeignKey
ALTER TABLE "inbox_messages" ADD CONSTRAINT "inbox_messages_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "candidate_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inbox_messages" ADD CONSTRAINT "inbox_messages_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follow_ups" ADD CONSTRAINT "follow_ups_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
