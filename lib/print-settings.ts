export type HeaderMode = "first" | "every";
export type FooterMode = "last" | "every";

export interface PrintSettings {
  headerMode: HeaderMode;
  footerMode: FooterMode;
  signatureEnabled: boolean;
}

export const DEFAULT_PRINT_SETTINGS: PrintSettings = {
  headerMode: "first",
  footerMode: "last",
  signatureEnabled: true,
};

const COOKIE_NAME = "invoice_print_settings";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function sanitizePrintSettings(raw: unknown): PrintSettings {
  if (!raw || typeof raw !== "object") return DEFAULT_PRINT_SETTINGS;
  const stored = raw as Partial<PrintSettings>;
  return {
    headerMode: stored.headerMode === "every" ? "every" : "first",
    footerMode: stored.footerMode === "every" ? "every" : "last",
    signatureEnabled: stored.signatureEnabled !== false,
  };
}

export function parsePrintSettingsCookie(cookieHeader: string): PrintSettings {
  const match = cookieHeader
    .split("; ")
    .find((row) => row.startsWith(`${COOKIE_NAME}=`));
  if (!match) return DEFAULT_PRINT_SETTINGS;
  try {
    const value = decodeURIComponent(match.slice(COOKIE_NAME.length + 1));
    return sanitizePrintSettings(JSON.parse(value));
  } catch {
    return DEFAULT_PRINT_SETTINGS;
  }
}

export function readPrintSettings(): PrintSettings {
  if (typeof document === "undefined") return DEFAULT_PRINT_SETTINGS;
  return parsePrintSettingsCookie(document.cookie);
}

export function writePrintSettings(settings: PrintSettings): void {
  if (typeof document === "undefined") return;
  const value = encodeURIComponent(JSON.stringify(settings));
  document.cookie = `${COOKIE_NAME}=${value}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}
