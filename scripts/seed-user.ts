import { prisma } from "../lib/prisma";
import { genId } from "../lib/id";
import { hashPassword } from "../lib/password";

async function main() {
  const email = (process.env.SEED_USER_EMAIL ?? "admin@nexaus.cloud")
    .trim()
    .toLowerCase();
  const password = process.env.SEED_USER_PASSWORD ?? "admin123";
  const name = process.env.SEED_USER_NAME ?? "Admin";

  if (!email || !password) {
    console.error(
      "SEED_USER_EMAIL and SEED_USER_PASSWORD must be set in .env (or fallbacks will be used).",
    );
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  const id = existing?.id ?? genId();
  const passwordHash = await hashPassword(password);

  await prisma.user.upsert({
    where: { email },
    create: { id, email, name, passwordHash },
    update: { name, passwordHash },
  });

  console.log(`Seeded user: ${email}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
