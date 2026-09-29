import { spawnSync } from "node:child_process";
import { config as loadEnvFile } from "dotenv";
import { PrismaClient } from "../generated/prisma-node/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { seedAdminUser } from "./seed-helpers";

// `.env` is gitignored and is written only by the deploy pipeline, so it is
// never present in a checkout and cannot affect a real user deploy. It is
// loaded with `override` because Netlify resolves the build environment from
// the *site's* stored variables, which outrank the CI job's own environment;
// without this the pipeline's value would silently lose to a stale or
// placeholder value set in the Netlify dashboard.
loadEnvFile({ path: ".env", override: true, quiet: true });

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
  let parsed: URL;
  try {
    parsed = new URL(DATABASE_URL);
  } catch {
    fail(
      "DATABASE_URL is not a valid URL. It must be a full connection string " +
        'such as "postgresql://user:password@host:5432/database".',
    );
  }

  if (parsed.protocol !== "postgresql:" && parsed.protocol !== "postgres:") {
    fail(
      `DATABASE_URL must use the postgresql:// scheme (found ` +
        `${parsed.protocol.replace(":", "")}://).`,
    );
  }

  if (!parsed.hostname) {
    fail("DATABASE_URL has no host. Check the connection string.");
  }

  if (/\s/.test(DATABASE_URL)) {
    fail(
      "DATABASE_URL contains whitespace, so it looks like a placeholder " +
        "rather than a connection string. Set the real value in your " +
        "platform's environment variables.",
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
