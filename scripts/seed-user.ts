import mongoose from "mongoose";
import { connectDb } from "../lib/mongodb";
import { genId } from "../lib/id";
import { hashPassword } from "../lib/password";
import { UserModel } from "../models/users";

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

  await connectDb();
  const existing = await UserModel.findOne({ email }).lean();
  const now = new Date().toISOString();
  const id = existing?._id ?? genId();
  const passwordHash = await hashPassword(password);

  await UserModel.updateOne(
    { _id: id },
    {
      $set: {
        email,
        name,
        passwordHash,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      },
    },
    { upsert: true },
  );

  console.log(`Seeded user: ${email}`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
