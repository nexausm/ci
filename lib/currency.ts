import type { CurrencyCode } from "./types";

export const CURRENCIES: Record<
  CurrencyCode,
  { symbol: string; label: string }
> = {
  BDT: { symbol: "৳", label: "BDT" },
  USD: { symbol: "$", label: "USD" },
};
