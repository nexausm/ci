import { DEFAULT_TEMPLATE_ID } from "@/lib/invoice-templates";

const COOKIE_NAME = "invoice_template";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function readTemplateId(): string {
  if (typeof document === "undefined") return DEFAULT_TEMPLATE_ID;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${COOKIE_NAME}=`));
  if (!match) return DEFAULT_TEMPLATE_ID;
  return match.slice(COOKIE_NAME.length + 1) || DEFAULT_TEMPLATE_ID;
}

export function writeTemplateId(id: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(id)}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}
