import "dotenv/config";
import { spawnSync } from "node:child_process";
import { PrismaClient } from "../generated/prisma-node/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { seedAdminUser } from "./seed-helpers";

const DATABASE_URL = process.env.DATABASE_URL?.trim();

function fail(message: string): never {
  console.error(`[db:setup] FATAL: ${message}`);
  console.error(
    "[db:setup] A database is required. The deployment was aborted because it " +
      "could not be prepared.",
  );
  process.exit(1);
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`timed out after ${ms}ms`)), ms);
  });
  return Promise.race([p, timeout]).finally(() => clearTimeout(timer));
}

async function run() {
  if (!DATABASE_URL) {
    fail(
      "DATABASE_URL is not set. Add a PostgreSQL connection string as a " +
        "build-time environment variable and redeploy.",
    );
  }

  let prisma: PrismaClient;
  try {
    prisma = new PrismaClient({
      adapter: new PrismaPg({ connectionString: DATABASE_URL }),
    });
  } catch (err) {
    fail(`invalid DATABASE_URL: ${String(err)}`);
  }

  try {
    await withTimeout(prisma.$queryRaw`SELECT 1`, 15000);
  } catch (err) {
    await prisma.$disconnect();
    fail(`cannot reach the database: ${String(err)}`);
  }

  const migrate = spawnSync(
    "npx",
    ["--no-install", "prisma", "migrate", "deploy"],
    { stdio: "inherit", env: { ...process.env } },
  );
  if (migrate.status !== 0) {
    await prisma.$disconnect();
    fail(
      `prisma migrate deploy failed (exit ${migrate.status ?? migrate.error?.message ?? "unknown"}).`,
    );
  }

  try {
    await seedAdminUser(prisma, {
      email: process.env.SEED_USER_EMAIL,
      password: process.env.SEED_USER_PASSWORD,
      name: process.env.SEED_USER_NAME,
    });
  } catch (err) {
    await prisma.$disconnect();
    fail(`seeding failed: ${String(err)}`);
  }

  await prisma.$disconnect();
  console.log("[db:setup] Database is ready.");
}

run().catch((err) => {
  fail(String(err));
});
