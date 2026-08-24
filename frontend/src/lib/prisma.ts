import "server-only";

import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";

if (!process.env.DATABASE_URL) {
  const rootEnvironmentPath = resolve(process.cwd(), "../.env");

  if (existsSync(rootEnvironmentPath)) {
    config({ path: rootEnvironmentPath });
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
