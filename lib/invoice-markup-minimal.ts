import type { CompanyInfo, InvoiceData } from "@/lib/types";
import { CURRENCIES } from "@/lib/currency";
import {
  computeTotals,
  formatMoney,
  formatDateLong,
  formatDateTimeInZone,
} from "@/lib/totals";

const FONT = "'Inter', 'Noto Sans Devanagari', 'Noto Sans Bengali'";
const SERIF_FONT = "'Times New Roman', 'Georgia', serif";

const pt = (n: number) => Math.round(n * (96 / 72) * 100) / 100;

export const TOP_BAR_HEIGHT = pt(3);

export const PAGE_MARGIN = { side: pt(20), bottom: pt(20), top: pt(15) };

const S = {
  page: `width:794px;height:1123px;background:#FFFFFF;font-family:${FONT};font-size:${pt(10.5)}px;font-weight:500;color:#000000;position:relative;display:flex;flex-direction:column;`,
  body: `flex:1;display:flex;flex-direction:column;padding:${pt(15)}px ${pt(20)}px;`,
  topBar: `height:${TOP_BAR_HEIGHT}px;background:#000000;`,
  header: `display:flex;align-items:flex-start;gap:${pt(12)}px;margin-bottom:${pt(16)}px;`,
  logoBox: `width:${pt(80)}px;height:${pt(80)}px;flex-shrink:0;`,
  logo: "width:100%;height:100%;object-fit:contain;",
  logoPlaceholder: `width:${pt(80)}px;height:${pt(80)}px;border:2px dashed #ccc;display:flex;align-items:center;justify-content:center;font-size:${pt(8)}px;color:#999;`,
  companyBlock: `flex:1;display:flex;flex-direction:column;justify-content:center;text-align:center;`,
  invoiceLabel: `font-size:${pt(14)}px;font-weight:1000;font-family:${FONT};margin-bottom:${pt(4)}px;`,
  companyName: `font-size:${pt(18)}px;font-weight:700;color:#D0021B;font-family:${FONT};margin-bottom:${pt(4)}px;`,
  companyTagline: `font-size:${pt(9)}px;font-style:italic;font-weight:600;margin-bottom:${pt(6)}px;`,
  companyAddress: `font-size:${pt(9)}px;font-family:${FONT};line-height:1.4;`,
  metaRow: `display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:${pt(10)}px;font-family:${FONT};font-size:${pt(10)}px;`,
  metaLabel: `font-weight:700;`,
  metaValue: `border-bottom:1px solid #000;padding:0 ${pt(4)}px;width:${pt(300)}px;`,
  fieldRow: `display:flex;align-items:flex-end;margin-bottom:${pt(6)}px;font-family:${FONT};font-size:${pt(10)}px;`,
  fieldLabel: `font-weight:700;white-space:nowrap;margin-right:${pt(4)}px;`,
  fieldValue: `border-bottom:1px solid #000;padding:0 ${pt(4)}px;flex:1;min-height:${pt(14)}px;`,
  addressRow: `margin-bottom:${pt(6)}px;font-family:${FONT};font-size:${pt(10)}px;display: flex;align-items: center;justify-content: center;flex-wrap: nowrap;`,
  addressLabel: `font-weight:700;width:${pt(60)}px;`,
  addressValue: `border-bottom:1px solid #000;padding:0 ${pt(4)}px;display:block;width:100%;`,
  table: `width:100%;border-collapse:collapse;margin-bottom:${pt(10)}px;font-family:${FONT};font-size:${pt(10)}px;`,
  th: `border:1px solid #000;padding:${pt(5)}px ${pt(6)}px;font-weight:700;text-align:center;font-size:${pt(9)}px;`,
  td: `border:1px solid #000;padding:${pt(5)}px ${pt(6)}px;vertical-align:top;`,
  tdCenter: `border:1px solid #000;padding:${pt(5)}px ${pt(6)}px;text-align:center;vertical-align:top;`,
  tdRight: `border:1px solid #000;padding:${pt(5)}px ${pt(6)}px;text-align:right;vertical-align:top;`,
  fillerRow: `border:1px solid #000;height:${pt(20)}px;`,
  totalRow: `font-weight:700;`,
  takaWords: `font-family:${FONT};font-size:${pt(10)}px;margin-bottom:${pt(10)}px;`,
  takaLabel: `font-weight:700;white-space:nowrap;margin-right:${pt(4)}px;`,
  takaValue: `border-bottom:1px solid #000;padding:0 ${pt(4)}px;font-style:italic;flex:1;`,
  signatureArea: `margin-top:auto;display:flex;justify-content:space-between;align-items:flex-end;font-family:${FONT};font-size:${pt(10)}px;position:relative;`,
  signatureLine: `border-top:1px solid #000;width:${pt(200)}px;margin-top:${pt(4)}px;margin-bottom:${pt(4)}px;`,
  signatureLabel: `font-weight:700;`,
  stamp: `position:absolute;right:${pt(100)}px;top:${pt(-35)}px;opacity:0.6;pointer-events:none;user-select:none;`,
  stampCircle: `width:${pt(70)}px;height:${pt(70)}px;border:3px solid #1a365d;border-radius:50%;display:flex;align-items:center;justify-content:center;padding:4px;transform:rotate(12deg);`,
  stampInner: `width:100%;height:100%;border:1px solid #1a365d;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:${pt(5)}px;color:#1a365d;font-weight:700;text-align:center;line-height:1.2;`,
  stampText: `text-transform:uppercase;font-size:${pt(5)}px;`,
  stampDivider: `border-top:1px solid #1a365d;width:60%;margin:2px 0;`,
  stampSince: `font-size:${pt(4)}px;`,
};

function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function numberToWords(num: number): string {
  if (num === 0) return "Zero";
  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  function convertGroup(n: number): string {
    if (n === 0) return "";
    if (n < 20) return ones[n];
    if (n < 100)
      return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
    return (
      ones[Math.floor(n / 100)] +
      " Hundred" +
      (n % 100 ? " and " + convertGroup(n % 100) : "")
    );
  }

  const intPart = Math.floor(num);
  const decPart = Math.round((num - intPart) * 100);

  let result = "";
  if (intPart >= 10000000) {
    result += convertGroup(Math.floor(intPart / 10000000)) + " Crore ";
  }
  if (intPart >= 100000) {
    result +=
      convertGroup(Math.floor((intPart % 10000000) / 100000)) + " Lakh ";
  }
  if (intPart >= 1000) {
    result +=
      convertGroup(Math.floor((intPart % 100000) / 1000)) + " Thousand ";
  }
  if (intPart >= 100) {
    result += convertGroup(Math.floor((intPart % 1000) / 100)) + " Hundred ";
  }
  if (intPart % 100 > 0) {
    result += convertGroup(intPart % 100);
  }

  result = result.trim() + " Taka";
  if (decPart > 0) {
    result += " and " + convertGroup(decPart) + " Paisa";
  }
  result += " Only";
  return result;
}

const ATOMIC = 'data-pgbreak="avoid"';
const PG_ROW = 'data-pgtype="item-row"';

function companyHeader(
  company: CompanyInfo,
  uploadedLogoDataUrl?: string | null,
): string {
  const logoSrc = uploadedLogoDataUrl || company.logoDataUri;
  return `<div style="${S.header}" ${ATOMIC}>
    <div style="${S.logoBox}">
      ${
        logoSrc
          ? `<img style="${S.logo}" src="${esc(logoSrc)}" alt=""/>`
          : `<div style="${S.logoPlaceholder}">Logo</div>`
      }
    </div>
    <div style="${S.companyBlock}">
      <div style="${S.invoiceLabel}">Invoice</div>
      <div style="${S.companyName}">${esc(company.companyName)}</div>
      <div style="${S.companyTagline}">Importer, Wholesaler, Distributor & Supplier of Scientific & Lab Equipment's</div>
      <div style="${S.companyAddress}">
        ${company.addressLines.map((line) => esc(line)).join(", ")}
        ${company.phone ? `<br/>Cell: ${esc(company.phone)}` : ""}
        ${company.email ? `, E-mail: ${esc(company.email)}` : ""}
      </div>
    </div>
  </div>`;
}

function metaRow(
  data: InvoiceData,
  printDate?: string,
  timeZone?: string,
): string {
  return `<div style="${S.metaRow}" ${ATOMIC}>
    <div>
      <span style="${S.metaLabel}">No.</span>
      <span style="${S.metaValue}">${esc(data.invoiceNumber || "")}</span>
    </div>
    <div>
      <span style="${S.metaLabel}">Date :</span>
      <span style="${S.metaValue}">${printDate ? formatDateTimeInZone(printDate, timeZone) : formatDateLong(data.createdAt) || ""}</span>
    </div>
  </div>`;
}

function billToFields(data: InvoiceData): string {
  return `<div ${ATOMIC}>
    <div style="${S.fieldRow}">
      <span style="${S.fieldLabel}">Name :</span>
      <span style="${S.fieldValue}">${esc(data.billToName || "")}</span>
    </div>
    <div style="${S.addressRow}">
      <span style="${S.addressLabel}">Address :</span>
      <span style="${S.addressValue}">${esc(data.billToAddress || "")}</span>
    </div>
  </div>`;
}

function productTable(
  data: InvoiceData,
  symbol: string,
  realTable: boolean,
): string {
  const items = data.items.filter((it) => !it.externalCost);
  const fillerCount = Math.max(0, 10 - items.length);

  if (realTable) {
    return `<table style="${S.table}">
      <thead>
        <tr>
          <th style="${S.th}width:${pt(40)}px;">No.</th>
          <th style="${S.th}">Products Description</th>
          <th style="${S.th}width:${pt(60)}px;">Quantity</th>
          <th style="${S.th}width:${pt(80)}px;">Price</th>
          <th style="${S.th}width:${pt(100)}px;">Total Price</th>
        </tr>
      </thead>
      <tbody>
        ${items
          .map((item, idx) => {
            const total =
              (Number(item.qty) || 0) *
              (Number(item.listRate ?? item.rate) || 0);
            return `<tr ${PG_ROW}>
            <td style="${S.tdCenter}">${idx + 1}</td>
            <td style="${S.td}">
              <div style="font-weight:700;">${esc(item.description || "")}</div>
            </td>
            <td style="${S.tdCenter}">${Number(item.qty) || 0}</td>
            <td style="${S.tdRight}">${formatMoney(Number(item.listRate ?? item.rate) || 0, symbol)}</td>
            <td style="${S.tdRight};font-weight:700;">${formatMoney(total, symbol)}</td>
          </tr>`;
          })
          .join("")}
        ${Array.from({ length: fillerCount })
          .map(
            (_, i) => `
          <tr key="filler-${i}">
            <td style="${S.fillerRow}"></td>
            <td style="${S.fillerRow}"></td>
            <td style="${S.fillerRow}"></td>
            <td style="${S.fillerRow}"></td>
            <td style="${S.fillerRow}"></td>
          </tr>
        `,
          )
          .join("")}
        <tr class="${S.totalRow}">
          <td colspan="3" style="border:1px solid #000;"></td>
          <td style="${S.td};font-weight:700;text-align:center;">Total</td>
          <td style="${S.tdRight};font-weight:700;">${formatMoney(computeTotals(data).total, symbol)}</td>
        </tr>
      </tbody>
    </table>`;
  }

  return `<div style="display:flex;flex-direction:column;margin-bottom:${pt(12)}px;">
    <div style="display:flex;border:1px solid #000;font-weight:700;font-size:${pt(9)}px;">
      <div style="width:${pt(40)}px;padding:${pt(6)}px;border-right:1px solid #000;text-align:center;">No.</div>
      <div style="flex:1;padding:${pt(6)}px;border-right:1px solid #000;text-align:center;">Products Description</div>
      <div style="width:${pt(60)}px;padding:${pt(6)}px;border-right:1px solid #000;text-align:center;">Quantity</div>
      <div style="width:${pt(80)}px;padding:${pt(6)}px;border-right:1px solid #000;text-align:center;">Price</div>
      <div style="width:${pt(100)}px;padding:${pt(6)}px;text-align:center;">Total Price</div>
    </div>
    ${items
      .map((item, idx) => {
        const total =
          (Number(item.qty) || 0) * (Number(item.listRate ?? item.rate) || 0);
        return `<div style="display:flex;border:1px solid #000;border-top:none;min-height:${pt(24)}px;" ${PG_ROW}>
        <div style="width:${pt(40)}px;padding:${pt(6)}px;border-right:1px solid #000;text-align:center;">${idx + 1}</div>
        <div style="flex:1;padding:${pt(6)}px;border-right:1px solid #000;"><span style="font-weight:700;">${esc(item.description || "")}</span></div>
        <div style="width:${pt(60)}px;padding:${pt(6)}px;border-right:1px solid #000;text-align:center;">${Number(item.qty) || 0}</div>
        <div style="width:${pt(80)}px;padding:${pt(6)}px;border-right:1px solid #000;text-align:right;">${formatMoney(Number(item.listRate ?? item.rate) || 0, symbol)}</div>
        <div style="width:${pt(100)}px;padding:${pt(6)}px;text-align:right;font-weight:700;">${formatMoney(total, symbol)}</div>
      </div>`;
      })
      .join("")}
    ${Array.from({ length: fillerCount })
      .map(
        () => `
      <div style="display:flex;border:1px solid #000;border-top:none;height:${pt(24)}px;">
        <div style="width:${pt(40)}px;border-right:1px solid #000;"></div>
        <div style="flex:1;border-right:1px solid #000;"></div>
        <div style="width:${pt(60)}px;border-right:1px solid #000;"></div>
        <div style="width:${pt(80)}px;border-right:1px solid #000;"></div>
        <div style="width:${pt(100)}px;"></div>
      </div>
    `,
      )
      .join("")}
    <div style="display:flex;border:1px solid #000;border-top:none;font-weight:700;">
      <div style="flex:1;border-right:1px solid #000;"></div>
      <div style="width:${pt(60)}px;border-right:1px solid #000;"></div>
      <div style="width:${pt(80)}px;padding:${pt(6)}px;border-right:1px solid #000;text-align:center;">Total</div>
      <div style="width:${pt(100)}px;padding:${pt(6)}px;text-align:right;">${formatMoney(computeTotals(data).total, symbol)}</div>
    </div>
  </div>`;
}

function stamp(): string {
  return `<div style="${S.stamp}">
    <div style="${S.stampCircle}">
      <div style="${S.stampInner}">
        <div style="${S.stampText}">Core Scientific</div>
        <div style="${S.stampText}">Equipment</div>
        <div style="${S.stampDivider}"></div>
        <div style="${S.stampSince}">SINCE 2020</div>
      </div>
    </div>
  </div>`;
}

function signatureArea(companyName: string): string {
  return `<div style="${S.signatureArea}" ${ATOMIC}>
    <div>
      <div style="${S.signatureLine}"></div>
      <div style="${S.signatureLabel}">Received</div>
    </div>
    ${stamp()}
    <div>
      <div style="${S.signatureLine}"></div>
      <div style="${S.signatureLabel};font-style:italic;">For-${esc(companyName)}</div>
    </div>
  </div>`;
}

export function invoiceTopBar(): string {
  return `<div style="${S.topBar}"></div>`;
}

export function invoiceHeaderChrome(
  data: InvoiceData,
  company: CompanyInfo,
  printDate?: string,
  timeZone?: string,
  uploadedLogoDataUrl?: string | null,
): string {
  return `${invoiceTopBar()}
  <div style="padding:${PAGE_MARGIN.top}px ${PAGE_MARGIN.side}px 0;">
    ${companyHeader(company, uploadedLogoDataUrl)}
    ${metaRow(data, printDate, timeZone)}
    ${billToFields(data)}
  </div>`;
}

export function invoiceFooterChrome(): string {
  return "";
}

function bodyInnerContent(
  data: InvoiceData,
  realTable = false,
  uploadedLogoDataUrl?: string | null,
  companyName?: string,
): string {
  const symbol = CURRENCIES[data.currency]?.symbol ?? data.currency;
  const total = computeTotals(data).total;

  return (
    productTable(data, symbol, realTable) +
    `<div style="display:flex;align-items:flex-end;${S.takaWords}" ${ATOMIC}>
        <span style="${S.takaLabel}">Taka In Words:</span>
        <span style="${S.takaValue}">${numberToWords(total)}</span>
      </div>` +
    signatureArea(companyName || "Company")
  );
}

export function installmentMarkup(data: InvoiceData): string {
  const page = S.page.replace(
    "display:flex;flex-direction:column;",
    "display:block;",
  );
  const body = S.body.replace(
    "flex:1;display:flex;flex-direction:column;",
    "display:block;",
  );
  return `<div style="${page}">
  <div style="${body}">
    ${bodyInnerContent(data, false)}
  </div>
</div>`;
}

export function invoiceMarkup(
  data: InvoiceData,
  opts?: {
    realTable?: boolean;
    headerMode?: "first" | "every";
    company?: CompanyInfo;
    printDate?: string;
    timeZone?: string;
    uploadedLogoDataUrl?: string | null;
  },
): string {
  if (opts?.realTable) {
    const page = S.page.replace(
      "display:flex;flex-direction:column;",
      "display:block;",
    );
    const body = S.body.replace(
      "flex:1;display:flex;flex-direction:column;",
      "display:block;",
    );
    const headerBlock =
      opts?.headerMode === "first" && opts.company
        ? `<div style="padding:0 ${PAGE_MARGIN.side}px 0;">
            ${companyHeader(opts.company, opts.uploadedLogoDataUrl)}
            ${metaRow(data, opts.printDate, opts.timeZone)}
            ${billToFields(data)}
          </div>`
        : "";
    return `<div style="${page}">
  ${headerBlock}
  <div style="${body}">
    ${bodyInnerContent(data, true, opts.uploadedLogoDataUrl, opts.company?.companyName)}
  </div>
</div>`;
  }
  return `<div style="${S.page}">
  <div style="${S.body}">
    ${bodyInnerContent(data, false)}
  </div>
</div>`;
}
