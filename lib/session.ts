const raw = process.env.AUTH_SESSION_MAX_AGE;
const parsed = Number(raw);
if (!Number.isFinite(parsed) || parsed <= 0) {
  throw new Error(
    "AUTH_SESSION_MAX_AGE environment variable is required and must be a positive number of seconds",
  );
}

export const SESSION_MAX_AGE_SECONDS = parsed;
