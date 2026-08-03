import {
  getPayment,
  updatePayment,
  deletePayment,
} from "@/controllers/payments";

export const GET = getPayment;
export const PATCH = updatePayment;
export const DELETE = deletePayment;
