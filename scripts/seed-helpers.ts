import { PrismaClient } from "../generated/prisma-node/client";
import { genId } from "../lib/id";
import { hashPassword } from "../lib/password";

export interface SeedConfig {
  email?: string;
  password?: string;
  name?: string;
}

export async function seedAdminUser(
  prisma: PrismaClient,
  config: SeedConfig,
): Promise<"created" | "skipped" | "exists"> {
  const email = config.email?.trim().toLowerCase();
  const password = config.password;
  const name = config.name?.trim() || "Admin";

  if (!email || !password) {
    console.log(
      "[seed] SEED_USER_EMAIL or SEED_USER_PASSWORD not set; skipping admin user.",
    );
    return "skipped";
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(
      `[seed] User already exists. Password left unchanged for ${email}`,
    );
    return "exists";
  }

  try {
    await prisma.user.create({
      data: {
        id: genId(),
        email,
        name,
        passwordHash: await hashPassword(password),
      },
    });
  } catch (err) {
    if ((err as { code?: string }).code === "P2002") {
      console.log(
        `[seed] User already exists. Password left unchanged for ${email}`,
      );
      return "exists";
    }
    throw err;
  }
  console.log(`[seed] Seeded admin user ${email}`);
  return "created";
}
