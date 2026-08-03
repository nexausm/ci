import {
  getInvoice,
  updateInvoice,
  deleteInvoice,
} from "@/controllers/invoices";

export const GET = getInvoice;
export const PATCH = updateInvoice;
export const DELETE = deleteInvoice;
