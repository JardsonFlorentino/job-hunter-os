import { PrismaClient, QueueItemStatus } from "@prisma/client";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { claimNext, claimNextOfType, complete, enqueue, fail } from "./queue-service.js";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const integration = testDatabaseUrl ? describe : describe.skip;
let prisma: PrismaClient | undefined;

integration("PostgreSQL queue", () => {
  beforeAll(async () => {
    if (!testDatabaseUrl) throw new Error("TEST_DATABASE_URL não configurada.");
    prisma = new PrismaClient({ datasourceUrl: testDatabaseUrl });
    await prisma.$connect();
  });
  afterEach(async () => { await prisma?.queueItem.deleteMany(); });
  afterAll(async () => { await prisma?.$disconnect(); });

  it("allows only one worker to claim each item", async () => {
    if (!prisma) throw new Error("Banco indisponível.");
    await enqueue(prisma, { type: "ENRICH", dedupeKey: "source:1", payload: { sourceId: "1" } });
    const claims = await Promise.all(Array.from({ length: 8 }, (_, index) => claimNext(prisma as PrismaClient, `worker-${index}`)));
    expect(claims.filter(Boolean)).toHaveLength(1);
    const claimedIndex = claims.findIndex((item) => item !== null);
    const claimed = claims[claimedIndex];
    expect(claimed).not.toBeNull();
    if (claimed) expect(await complete(prisma, claimed.id, `worker-${claimedIndex}`)).toBe(true);
    expect(await prisma.queueItem.count()).toBe(1);
  });

  it("reclaims a failed item of the requested type and sends it to dead-letter after the limit", async () => {
    if (!prisma) throw new Error("Banco indisponível.");
    await enqueue(prisma, { type: "MATERIAL_REGENERATION", dedupeKey: "material:1", payload: { applicationId: "application-1" }, maxAttempts: 2 });
    await enqueue(prisma, { type: "OTHER", dedupeKey: "other:1", payload: { value: 1 } });

    const first = await claimNextOfType(prisma, "materials-worker", "MATERIAL_REGENERATION");
    expect(first?.attempts).toBe(1);
    if (!first) throw new Error("Item de regeneração não foi reivindicado.");
    expect(await fail(prisma, first, "materials-worker", new Error("falha temporária"))).toBe(true);
    expect((await prisma.queueItem.findUniqueOrThrow({ where: { id: first.id } })).status).toBe(QueueItemStatus.FAILED);

    await prisma.queueItem.update({ where: { id: first.id }, data: { next_attempt_at: new Date(0) } });
    const second = await claimNextOfType(prisma, "materials-worker", "MATERIAL_REGENERATION");
    expect(second?.attempts).toBe(2);
    if (!second) throw new Error("Item com falha não foi reivindicado novamente.");
    expect(await fail(prisma, second, "materials-worker", new Error("falha definitiva"))).toBe(true);

    const exhausted = await prisma.queueItem.findUniqueOrThrow({ where: { id: first.id } });
    expect(exhausted.status).toBe(QueueItemStatus.DEAD);
    expect(await claimNextOfType(prisma, "materials-worker", "MATERIAL_REGENERATION")).toBeNull();
    expect((await prisma.queueItem.findUniqueOrThrow({ where: { dedupe_key: "other:1" } })).status).toBe(QueueItemStatus.PENDING);
  });
});
