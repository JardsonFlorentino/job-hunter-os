import { createHash } from "node:crypto";

import { MaterialType, Prisma, type PrismaClient } from "@prisma/client";

const MAX_TRANSACTION_RETRIES = 10;

function retryDelay(attempt: number): Promise<void> {
  const exponentialMs = Math.min(250, 10 * 2 ** attempt);
  const jitterMs = Math.floor(Math.random() * 20);
  return new Promise((resolve) => setTimeout(resolve, exponentialMs + jitterMs));
}

export async function storeGeneratedMaterial(prisma: PrismaClient, input: { applicationId: string; type: MaterialType; text?: string; data?: Buffer; model?: string; promptVersion?: string }, attempt = 0): Promise<string> {
  const bytes = input.data ?? Buffer.from(input.text ?? "", "utf8");
  const contentHash = createHash("sha256").update(bytes).digest("hex");
  try {
    return await prisma.$transaction(async (tx) => {
      const latest = await tx.generatedMaterial.aggregate({ where: { application_id: input.applicationId, type: input.type }, _max: { version: true } });
      const material = await tx.generatedMaterial.create({ data: {
        application_id: input.applicationId, type: input.type, version: (latest._max.version ?? 0) + 1,
        content_text: input.text ?? null, content_data: input.data ?? null, content_hash: contentHash,
        model: input.model ?? null, prompt_version: input.promptVersion ?? null,
      }, select: { id: true } });
      return material.id;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, maxWait: 10_000, timeout: 15_000 });
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && ["P2002", "P2028", "P2034"].includes(error.code) && attempt < MAX_TRANSACTION_RETRIES) {
      await retryDelay(attempt);
      return storeGeneratedMaterial(prisma, input, attempt + 1);
    }
    throw error;
  }
}
