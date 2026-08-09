import qrcode from "qrcode-generator";
import type { CompanyInfo, InvoiceData } from "@/lib/types";
import { CURRENCIES } from "@/lib/currency";
import {
  computeTotals,
  formatMoney,
  formatDateLong,
  formatDateTimeInZone,
  withInstallmentAllocations,
} from "@/lib/totals";

const FONT = "'Inter', 'Noto Sans Devanagari', 'Noto Sans Bengali'";

const pt = (n: number) => Math.round(n * (96 / 72) * 100) / 100;

export const TOP_BAR_HEIGHT = pt(3);

export const PAGE_MARGIN = { side: pt(20), bottom: pt(20), top: pt(15) };

const S = {
  page: `width:794px;background:#FFFFFF;font-family:${FONT};font-size:${pt(10.5)}px;font-weight:500;color:#000000;display:flex;flex-direction:column;`,
  body: `flex:1;display:flex;flex-direction:column;padding:${pt(15)}px ${pt(20)}px;`,
  topBar: `height:${TOP_BAR_HEIGHT}px;background:#000000;`,
  header: `display:flex;align-items:flex-start;gap:${pt(12)}px;margin-bottom:${pt(16)}px;`,
  logoBox: `width:${pt(80)}px;height:${pt(80)}px;flex-shrink:0;`,
  logo: "width:100%;height:100%;object-fit:contain;",
  logoPlaceholder: `width:${pt(80)}px;height:${pt(80)}px;border:2px dashed #ccc;display:flex;align-items:center;justify-content:center;font-size:${pt(8)}px;color:#999;`,
  companyBlock: `flex:1;display:flex;flex-direction:column;justify-content:center;text-align:center;`,
  qrBox: `flex-shrink:0;padding:${pt(6)}px;background:#FFFFFF;display:flex;align-items:center;justify-content:center;`,
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
  sectionLabel: `font-weight:600;font-size:${pt(9)}px;text-transform:uppercase;margin-bottom:${pt(8)}px;`,
  notes: `margin-top:${pt(16)}px;`,
  scheduleHeader: `display:flex;flex-direction:row;border-bottom:1px solid #000;padding-bottom:${pt(6)}px;margin-bottom:${pt(4)}px;font-size:${pt(9)}px;font-weight:600;`,
  scheduleRow: `display:flex;flex-direction:row;border-bottom:1px solid #ccc;padding-top:${pt(4)}px;padding-bottom:${pt(4)}px;font-size:${pt(10)}px;`,
  colInstallmentIndex: `width:${pt(26)}px;`,
  colInstallmentLabel: "flex:1;",
  colInstallmentDue: `width:${pt(88)}px;`,
  colInstallmentAmount: `width:${pt(78)}px;text-align:right;`,
  colInstallmentStatus: `width:${pt(58)}px;text-align:right;`,
  paymentHeader: `display:flex;flex-direction:row;border-bottom:1px solid #000;padding-bottom:${pt(6)}px;margin-bottom:${pt(4)}px;font-size:${pt(9)}px;font-weight:600;`,
  paymentRow: `display:flex;flex-direction:row;border-bottom:1px solid #ccc;padding-top:${pt(4)}px;padding-bottom:${pt(4)}px;font-size:${pt(10)}px;`,
  colPaymentDate: `width:${pt(80)}px;`,
  colPaymentMethod: `width:${pt(60)}px;`,
  colPaymentNote: "flex:1;",
  colPaymentAmount: `width:${pt(80)}px;text-align:right;`,
};

function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}


const ATOMIC = 'data-pgbreak="avoid"';
const PG_HEADER = 'data-pgtype="table-header"';
const PG_ROW = 'data-pgtype="item-row"';

function qrSvg(value: string, size: number): string {
  const qr = qrcode(0, "M");
  qr.addData(value);
  qr.make();
  const count = qr.getModuleCount();
  let cells = "";
  for (let r = 0; r < count; r += 1) {
    for (let c = 0; c < count; c += 1) {
      if (qr.isDark(r, c)) {
        cells += `<rect x="${c}" y="${r}" width="1" height="1" fill="#000000"/>`;
      }
    }
  }
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${count} ${count}" style="display:block;background:#FFFFFF">${cells}</svg>`;
}

function companyHeader(
  company: CompanyInfo,
  uploadedLogoDataUrl?: string | null,
  invoiceId?: string,
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
    <div style="${S.qrBox}">
      ${invoiceId ? qrSvg(`https://billing.nexaus.cloud/${invoiceId}`, pt(64)) : ""}
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
  const totals = computeTotals(data);

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
        ${totals.amountPaid ? `<tr class="${S.totalRow}">
          <td colspan="3" style="border:1px solid #000;"></td>
          <td style="${S.td};font-weight:700;text-align:center;">Balance Due</td>
          <td style="${S.tdRight};font-weight:700;">${formatMoney(totals.balanceDue, symbol)}</td>
        </tr>` : ""}
      </tbody>
    </table>`;
  }

  return `<div style="display:flex;flex-direction:column;margin-bottom:${pt(12)}px;">
    <div style="display:flex;border:1px solid #000;font-weight:700;font-size:${pt(9)}px;" ${ATOMIC} ${PG_HEADER}>
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
        return `<div style="display:flex;border:1px solid #000;border-top:none;min-height:${pt(24)}px;" ${ATOMIC} ${PG_ROW}>
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
    ${totals.amountPaid ? `<div style="display:flex;border:1px solid #000;border-top:none;font-weight:700;">
      <div style="flex:1;border-right:1px solid #000;"></div>
      <div style="width:${pt(60)}px;border-right:1px solid #000;"></div>
      <div style="width:${pt(80)}px;padding:${pt(6)}px;border-right:1px solid #000;text-align:center;">Balance Due</div>
      <div style="width:${pt(100)}px;padding:${pt(6)}px;text-align:right;">${formatMoney(totals.balanceDue, symbol)}</div>
    </div>` : ""}
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
    ${companyHeader(company, uploadedLogoDataUrl, data.id)}
    ${metaRow(data, printDate, timeZone)}
    ${billToFields(data)}
  </div>`;
}

export function invoiceFooterChrome(_companyName?: string, _invoiceId?: string): string {
  return "";
}

function paymentHistoryTable(data: InvoiceData, symbol: string): string {
  if (!data.payments || data.payments.length === 0) return "";
  const rowCell = (style: string, content: string) =>
    `<div style="${style}">${content}</div>`;
  const rows = data.payments
    .map((p) => {
      return `<div style="${S.paymentRow}" ${ATOMIC}>
      ${rowCell(S.colPaymentDate, esc(formatDateLong(p.date) || "—"))}
      ${rowCell(S.colPaymentMethod, esc(p.method || "—"))}
      ${rowCell(S.colPaymentNote, esc(p.note || "—"))}
      ${rowCell(S.colPaymentAmount, esc(formatMoney(p.amount, symbol)))}
    </div>`;
    })
    .join("");
  const totalReceived = data.payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  return `<div style="${S.notes}" ${ATOMIC}>
    <div style="${S.sectionLabel}">Payment History</div>
    <div style="${S.paymentHeader}" ${PG_HEADER}>
      <div style="${S.colPaymentDate}">Date</div>
      <div style="${S.colPaymentMethod}">Method</div>
      <div style="${S.colPaymentNote}">Note</div>
      <div style="${S.colPaymentAmount}">Amount</div>
    </div>
    ${rows}
    <div style="display:flex;justify-content:flex-end;padding-top:${pt(4)}px;font-weight:600;font-size:${pt(10)}px;">
      Total received: ${esc(formatMoney(totalReceived, symbol))}
    </div>
  </div>`;
}

function scheduleTable(data: InvoiceData, symbol: string): string {
  const scheduled = withInstallmentAllocations(data.installments, data.payments);
  if (scheduled.length === 0) return "";
  const rowCell = (style: string, content: string) =>
    `<div style="${style}">${content}</div>`;
  const rows = scheduled
    .map((inst) => {
      const statusLabel =
        inst.status === "paid"
          ? "Paid"
          : inst.status === "partial"
            ? "Partial"
            : "Unpaid";
      return `<div style="${S.scheduleRow}" ${ATOMIC}>
      ${rowCell(S.colInstallmentIndex, String(inst.seq + 1))}
      ${rowCell(S.colInstallmentLabel, esc(inst.label || "—"))}
      ${rowCell(S.colInstallmentDue, esc(formatDateLong(inst.dueDate) || "—"))}
      ${rowCell(S.colInstallmentAmount, esc(formatMoney(inst.amount, symbol)))}
      ${rowCell(S.colInstallmentStatus, statusLabel)}
    </div>`;
    })
    .join("");
  return `<div style="${S.notes}" ${ATOMIC}>
    <div style="${S.sectionLabel}">Payment Schedule</div>
    <div style="${S.scheduleHeader}" ${PG_HEADER}>
      <div style="${S.colInstallmentIndex}">#</div>
      <div style="${S.colInstallmentLabel}">Label</div>
      <div style="${S.colInstallmentDue}">Due Date</div>
      <div style="${S.colInstallmentAmount}">Amount</div>
      <div style="${S.colInstallmentStatus}">Status</div>
    </div>
    ${rows}
  </div>`;
}

function bodyInnerContent(
  data: InvoiceData,
  realTable = false,
): string {
  const symbol = CURRENCIES[data.currency]?.symbol ?? data.currency;

  return (
    productTable(data, symbol, realTable) +
    paymentHistoryTable(data, symbol) +
    scheduleTable(data, symbol)
  );
}

export function installmentMarkup(data: InvoiceData): string {
  return `<div style="${S.page}">
  <div style="${S.body}">
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
    const headerBlock =
      opts?.headerMode === "first" && opts.company
        ? `<div style="padding:0 ${PAGE_MARGIN.side}px 0;">
            ${companyHeader(opts.company, opts.uploadedLogoDataUrl, data.id)}
            ${metaRow(data, opts.printDate, opts.timeZone)}
            ${billToFields(data)}
          </div>`
        : "";
    return `<div style="${S.page}">
  ${headerBlock}
  <div style="${S.body}">
    ${bodyInnerContent(data, true)}
  </div>
</div>`;
  }
  return `<div style="${S.page}">
  <div style="${S.body}">
    ${bodyInnerContent(data, false)}
  </div>
</div>`;
}
