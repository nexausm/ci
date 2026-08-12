import { PrismaClient } from "@/lib/prisma-client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const isCloudflare = process.env.CF_PAGES === "1";

// On Cloudflare's miniflare local emulation, reusing a pg pool socket after the
// first query deadlocks the worker (deterministic every-other-request hang).
// Rotating connections per query avoids the reuse entirely.
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
  ...(isCloudflare ? { maxUses: 1 } : {}),
});

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
