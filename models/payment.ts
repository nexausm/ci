export const PAYMENT_METHODS = [
  "Cash",
  "Bank Transfer",
  "Card",
  "Mobile Banking",
  "Other",
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export interface Payment {
  id: string;
  date: string;
  amount: number;
  method: PaymentMethod;
  note: string;
}
