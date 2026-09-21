const DEFAULT_SESSION_MAX_AGE_SECONDS = 86400;

const raw = process.env.AUTH_SESSION_MAX_AGE;
const parsed = raw === undefined || raw === "" ? NaN : Number(raw);
const SESSION_MAX_AGE_SECONDS =
  Number.isFinite(parsed) && parsed > 0
    ? parsed
    : DEFAULT_SESSION_MAX_AGE_SECONDS;

if (!Number.isFinite(parsed)) {
  console.warn(
    `[session] AUTH_SESSION_MAX_AGE is missing or invalid (got ${
      raw === undefined ? "unset" : `"${raw}"`
    }); defaulting to ${DEFAULT_SESSION_MAX_AGE_SECONDS} seconds.`,
  );
}

export { SESSION_MAX_AGE_SECONDS };
