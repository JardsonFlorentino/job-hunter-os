CREATE TABLE "imap_checkpoints" (
    "id" TEXT NOT NULL,
    "account" TEXT NOT NULL,
    "mailbox" TEXT NOT NULL DEFAULT 'INBOX',
    "last_uid" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "imap_checkpoints_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "imap_checkpoints_account_mailbox_key"
ON "imap_checkpoints"("account", "mailbox");
