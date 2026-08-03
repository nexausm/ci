const DEFAULT_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

export const SESSION_MAX_AGE_SECONDS = (() => {
  const raw = process.env.AUTH_SESSION_MAX_AGE;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : DEFAULT_MAX_AGE_SECONDS;
})();
