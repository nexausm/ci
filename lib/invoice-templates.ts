import type { CompanyInfo, InvoiceData, Installment } from "@/lib/types";

export interface TemplateMarkupOptions {
  realTable?: boolean;
  headerMode?: "first" | "every";
  footerMode?: "last" | "every";
  company?: CompanyInfo;
  printDate?: string;
  timeZone?: string;
}

export interface InvoiceTemplate {
  id: string;
  label: string;
  markup: (data: InvoiceData, opts?: TemplateMarkupOptions) => string;
  headerChrome: (
    data: InvoiceData,
    company: CompanyInfo,
    printDate?: string,
    timeZone?: string,
  ) => string;
  footerChrome: (company?: CompanyInfo, invoiceId?: string) => string;
  topBar: () => string;
  pageMargin: { side: number; bottom: number; top: number };
  topBarHeight: number;
  installmentMarkup?: (
    data: InvoiceData,
    installment: Installment,
    opts?: Pick<TemplateMarkupOptions, "headerMode" | "company">,
  ) => string;
  installmentHeaderChrome?: (
    data: InvoiceData,
    installment: Installment,
    company: CompanyInfo,
  ) => string;
}

import {
  invoiceMarkup as standardMarkup,
  invoiceHeaderChrome as standardHeaderChrome,
  invoiceFooterChrome as standardFooterChrome,
  invoiceTopBar as standardTopBar,
  installmentMarkup as standardInstallmentMarkup,
  installmentHeaderChrome as standardInstallmentHeaderChrome,
  PAGE_MARGIN as STANDARD_PAGE_MARGIN,
  TOP_BAR_HEIGHT as STANDARD_TOP_BAR_HEIGHT,
} from "@/lib/invoice-markup";

import {
  invoiceMarkup as minimalMarkup,
  invoiceHeaderChrome as minimalHeaderChrome,
  invoiceFooterChrome as minimalFooterChrome,
  invoiceTopBar as minimalTopBar,
  PAGE_MARGIN as MINIMAL_PAGE_MARGIN,
  TOP_BAR_HEIGHT as MINIMAL_TOP_BAR_HEIGHT,
} from "@/lib/invoice-markup-minimal";

export const TEMPLATES: InvoiceTemplate[] = [
  {
    id: "standard",
    label: "Standard",
    markup: (data, opts) =>
      standardMarkup(data, {
        realTable: opts?.realTable,
        headerMode: opts?.headerMode,
        company: opts?.company,
        printDate: opts?.printDate,
        timeZone: opts?.timeZone,
      }),
    headerChrome: (data, company, printDate, timeZone) =>
      standardHeaderChrome(data, company, printDate, timeZone),
    footerChrome: standardFooterChrome,
    topBar: standardTopBar,
    pageMargin: STANDARD_PAGE_MARGIN,
    topBarHeight: STANDARD_TOP_BAR_HEIGHT,
    installmentMarkup: (data, installment, opts) =>
      standardInstallmentMarkup(data, installment, {
        headerMode: opts?.headerMode,
        company: opts?.company,
      }),
    installmentHeaderChrome: (data, installment, company) =>
      standardInstallmentHeaderChrome(data, installment, company),
  },
  {
    id: "minimal",
    label: "Minimal",
    markup: (data, opts) =>
      minimalMarkup(data, {
        realTable: opts?.realTable,
        headerMode: opts?.headerMode,
        company: opts?.company,
        printDate: opts?.printDate,
        timeZone: opts?.timeZone,
      }),
    headerChrome: (data, company, printDate, timeZone) =>
      minimalHeaderChrome(data, company, printDate, timeZone),
    footerChrome: (company, invoiceId) =>
      minimalFooterChrome(company?.companyName, invoiceId),
    topBar: minimalTopBar,
    pageMargin: MINIMAL_PAGE_MARGIN,
    topBarHeight: MINIMAL_TOP_BAR_HEIGHT,
  },
];

export const DEFAULT_TEMPLATE_ID = "standard";

export function getTemplate(id: string): InvoiceTemplate {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
}
