import { Prisma, QueueItemStatus, type PrismaClient } from "@prisma/client";

export interface ClaimedQueueItem {
  id: string;
  type: string;
  dedupe_key: string;
  payload: Prisma.JsonValue;
  attempts: number;
  max_attempts: number;
}

export function retryDelayMs(attempt: number): number {
  const boundedAttempt = Math.max(1, Math.min(attempt, 10));
  return Math.min(60 * 60 * 1_000, 1_000 * 2 ** (boundedAttempt - 1));
}

export async function enqueue(prisma: PrismaClient, input: { type: string; dedupeKey: string; payload: Prisma.InputJsonValue; maxAttempts?: number }): Promise<string> {
  const item = await prisma.queueItem.upsert({
    where: { dedupe_key: input.dedupeKey },
    create: { type: input.type, dedupe_key: input.dedupeKey, payload: input.payload, max_attempts: input.maxAttempts ?? 5 },
    update: {},
    select: { id: true },
  });
  return item.id;
}

export async function claimNext(prisma: PrismaClient, workerId: string): Promise<ClaimedQueueItem | null> {
  const rows = await prisma.$queryRaw<ClaimedQueueItem[]>`
    WITH candidate AS (
      SELECT id
      FROM queue_items
      WHERE status IN ('PENDING'::"QueueItemStatus", 'FAILED'::"QueueItemStatus")
        AND next_attempt_at <= NOW()
        AND (locked_at IS NULL OR locked_at < NOW() - INTERVAL '15 minutes')
      ORDER BY next_attempt_at ASC, created_at ASC
      FOR UPDATE SKIP LOCKED
      LIMIT 1
    )
    UPDATE queue_items AS queue
    SET status = 'PROCESSING'::"QueueItemStatus",
        locked_at = NOW(),
        locked_by = ${workerId},
        attempts = queue.attempts + 1,
        updated_at = NOW()
    FROM candidate
    WHERE queue.id = candidate.id
    RETURNING queue.id, queue.type, queue.dedupe_key, queue.payload, queue.attempts, queue.max_attempts
  `;
  return rows[0] ?? null;
}

export async function claimNextOfType(prisma: PrismaClient, workerId: string, type: string): Promise<ClaimedQueueItem | null> {
  const rows = await prisma.$queryRaw<ClaimedQueueItem[]>`
    WITH candidate AS (
      SELECT queued.id
      FROM queue_items AS queued
      WHERE queued.type = ${type}
        AND queued.status IN ('PENDING'::"QueueItemStatus", 'FAILED'::"QueueItemStatus")
        AND queued.attempts < queued.max_attempts
        AND queued.next_attempt_at <= NOW()
        AND (queued.locked_at IS NULL OR queued.locked_at < NOW() - INTERVAL '15 minutes')
      ORDER BY queued.next_attempt_at ASC, queued.created_at ASC
      FOR UPDATE SKIP LOCKED
      LIMIT 1
    )
    UPDATE queue_items AS queue
    SET status = 'PROCESSING'::"QueueItemStatus",
        locked_at = NOW(),
        locked_by = ${workerId},
        attempts = queue.attempts + 1,
        updated_at = NOW()
    FROM candidate
    WHERE queue.id = candidate.id
    RETURNING queue.id, queue.type, queue.dedupe_key, queue.payload, queue.attempts, queue.max_attempts
  `;
  return rows[0] ?? null;
}

export function failureStatus(attempts: number, maxAttempts: number): QueueItemStatus {
  return attempts >= maxAttempts ? QueueItemStatus.DEAD : QueueItemStatus.FAILED;
}

export async function complete(prisma: PrismaClient, itemId: string, workerId: string): Promise<boolean> {
  const result = await prisma.queueItem.updateMany({
    where: { id: itemId, status: QueueItemStatus.PROCESSING, locked_by: workerId },
    data: { status: QueueItemStatus.COMPLETED, completed_at: new Date(), locked_at: null, locked_by: null, last_error: null },
  });
  return result.count === 1;
}

export async function fail(prisma: PrismaClient, item: ClaimedQueueItem, workerId: string, error: unknown): Promise<boolean> {
  const result = await prisma.queueItem.updateMany({
    where: { id: item.id, status: QueueItemStatus.PROCESSING, locked_by: workerId },
    data: {
      status: failureStatus(item.attempts, item.max_attempts),
      next_attempt_at: new Date(Date.now() + retryDelayMs(item.attempts)),
      locked_at: null,
      locked_by: null,
      last_error: error instanceof Error ? error.message : String(error),
    },
  });
  return result.count === 1;
}
