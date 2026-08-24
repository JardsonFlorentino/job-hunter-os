import { PrismaClient } from "@prisma/client";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { claimNext, complete, enqueue } from "./queue-service.js";

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
});
