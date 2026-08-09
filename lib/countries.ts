import rawCountries from "@/data/countries.json";

export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string | null;
}

export interface CountryInfo {
  code: string;
  name: string;
  flagSvg: string;
  currencies: CurrencyInfo[];
}

export interface CurrencySummary extends CurrencyInfo {
  countries: CountryInfo[];
}

export const COUNTRIES: CountryInfo[] = rawCountries as CountryInfo[];

export const ALL_CURRENCIES: Record<string, CurrencySummary> = {};

for (const country of COUNTRIES) {
  for (const currency of country.currencies) {
    const existing = ALL_CURRENCIES[currency.code];
    const entry = existing ?? {
      code: currency.code,
      name: currency.name,
      symbol: currency.symbol,
      countries: [],
    };
    if (!entry.name) entry.name = currency.name;
    if (entry.symbol === null) entry.symbol = currency.symbol;
    entry.countries.push(country);
    ALL_CURRENCIES[currency.code] = entry;
  }
}

export function countryByCode(code: string): CountryInfo | undefined {
  return COUNTRIES.find((c) => c.code === code);
}

export function currencyByCode(code: string): CurrencySummary | undefined {
  return ALL_CURRENCIES[code];
}
