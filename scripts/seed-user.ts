import "dotenv/config";
import { PrismaClient } from "../generated/prisma-node/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { seedAdminUser } from "./seed-helpers";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  const result = await seedAdminUser(prisma, {
    email: process.env.SEED_USER_EMAIL,
    password: process.env.SEED_USER_PASSWORD,
    name: process.env.SEED_USER_NAME,
  });

  if (result === "skipped") {
    console.error("SEED_USER_EMAIL and SEED_USER_PASSWORD must be set.");
    process.exitCode = 1;
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
