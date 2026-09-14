import { PrismaClient } from "../generated/prisma-node/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { genId } from "../lib/id";
import { hashPassword } from "../lib/password";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  const email = process.env.SEED_USER_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_USER_PASSWORD;
  const name = process.env.SEED_USER_NAME?.trim() || "Admin";

  if (!email || !password) {
    console.error("SEED_USER_EMAIL and SEED_USER_PASSWORD must be set in .env");
    process.exit(1);
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      console.log(`User already exists (password left unchanged): ${email}`);
      return;
    }

    await prisma.user.create({
      data: {
        id: genId(),
        email,
        name,
        passwordHash: await hashPassword(password),
      },
    });

    console.log(`Seeded user: ${email}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
