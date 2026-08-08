import qrcode from "qrcode-generator";
import type {
  CompanyInfo,
  Installment,
  InvoiceData,
  LineItem,
} from "@/lib/types";
import { CURRENCIES } from "@/lib/currency";
import {
  computeTotals,
  formatMoney,
  formatDateLong,
  nextInstallmentDueDate,
  withInstallmentAllocations,
} from "@/lib/totals";

const FONT = "'Inter', 'Noto Sans Devanagari', 'Noto Sans Bengali'";

const C = {
  bar: "#1565C0",
  text: "#444444",
  dividerGray: "#BFBFBF",
};

const pt = (n: number) => Math.round(n * (96 / 72) * 100) / 100;

export const TOP_BAR_HEIGHT = pt(3);

const S = {
  page: `width:794px;background:#FFFFFF;font-family:${FONT};font-size:${pt(10.5)}px;font-weight:500;color:${C.text};display:flex;flex-direction:column;`,
  topBar: `height:${TOP_BAR_HEIGHT}px;background:${C.bar};`,
  body: `flex:1;display:flex;flex-direction:column;padding:${pt(21)}px ${pt(30)}px ${pt(18)}px;`,
  header: "display:flex;flex-direction:row;align-items:flex-start;",
  logoBox: `width:${pt(144)}px;height:${pt(112.5)}px;margin-right:${pt(19)}px;`,
  logo: "width:100%;height:100%;object-fit:contain;object-position:left top;",
  companyBox: "flex:1;",
  companyName: `font-weight:600;font-size:${pt(15)}px;margin-bottom:${pt(10)}px;`,
  companyLine: `font-size:${pt(10.5)}px;margin-bottom:${pt(3.7)}px;`,
  metaBox: `width:${pt(170)}px;text-align:right;`,
  metaLabel: `font-weight:600;font-size:${pt(9)}px;text-transform:uppercase;margin-bottom:${pt(6)}px;`,
  metaValue: `font-size:${pt(10.5)}px;margin-bottom:${pt(15.5)}px;text-align:right;`,
  metaValueLast: "margin-bottom:0px;",
  billToRow:
    "display:flex;flex-direction:row;justify-content:space-between;align-items:flex-start;",
  billToBlock: "flex:1;",
  qrBox: `padding:${pt(6)}px;background:#FFFFFF;`,
  sectionLabel: `font-weight:600;font-size:${pt(9)}px;text-transform:uppercase;margin-bottom:${pt(14)}px;`,
  billToName: `font-weight:600;font-size:${pt(13.5)}px;margin-bottom:${pt(9.5)}px;`,
  billToLine: `font-size:${pt(10.5)}px;margin-bottom:${pt(3.7)}px;`,
  table: `margin-top:${pt(6)}px;`,
  tableHeader: `display:flex;flex-direction:row;border-top:${pt(0.75)}px solid #000000;border-bottom:${pt(0.75)}px solid #000000;padding-top:${pt(12)}px;padding-bottom:${pt(10)}px;`,
  tableHeaderCell: `font-weight:600;font-size:${pt(9)}px;text-transform:uppercase;`,
  colDescription: "flex:1;",
  colRate: `width:${pt(80)}px;text-align:right;`,
  colQty: `width:${pt(45)}px;text-align:right;`,
  colAmount: `width:${pt(67)}px;text-align:right;`,
  tableRow: `display:flex;flex-direction:row;border-bottom:${pt(0.75)}px solid #BFBFBF;padding-top:${pt(6)}px;padding-bottom:${pt(6)}px;`,
  cellText: `font-size:${pt(10.5)}px;`,
  superscript: `font-size:${pt(7)}px;vertical-align:super;`,
  totalsWrap: `display:flex;flex-direction:row;justify-content:flex-end;margin-top:${pt(16)}px;`,
  totalsBox: `width:${pt(268)}px;`,
  totalsRow: `display:flex;flex-direction:row;justify-content:space-between;margin-bottom:${pt(7)}px;`,
  totalsLabel: `font-weight:600;font-size:${pt(9)}px;text-transform:uppercase;`,
  totalsValue: `font-size:${pt(10.5)}px;`,
  totalsDivider: `height:${pt(0.75)}px;background:${C.dividerGray};margin-bottom:${pt(9)}px;`,
  totalsFinalRow: `display:flex;flex-direction:row;justify-content:space-between;margin-bottom:${pt(7)}px;`,
  totalsFinalLabel: `font-weight:600;font-size:${pt(9)}px;text-transform:uppercase;`,
  totalsFinalValue: `font-size:${pt(10.5)}px;`,
  balanceDueLabel: `font-weight:600;font-size:${pt(9)}px;text-transform:uppercase;text-align:right;margin-bottom:${pt(9)}px;`,
  balanceDueValue: `font-weight:600;font-size:${pt(13.5)}px;text-align:right;`,
  notes: `margin-top:${pt(26)}px;`,
  notesLabel: `font-weight:600;font-size:${pt(9)}px;text-transform:uppercase;margin-bottom:${pt(8)}px;`,
  notesText: `font-size:${pt(10.5)}px;line-height:1.5;`,
  scheduleHeader: `display:flex;flex-direction:row;border-bottom:${pt(0.75)}px solid #000000;padding-bottom:${pt(6)}px;margin-bottom:${pt(4)}px;`,
  scheduleRow: `display:flex;flex-direction:row;border-bottom:${pt(0.75)}px solid #BFBFBF;padding-top:${pt(4)}px;padding-bottom:${pt(4)}px;`,
  colInstallmentIndex: `width:${pt(26)}px;`,
  colInstallmentLabel: "flex:1;",
  colInstallmentDue: `width:${pt(88)}px;`,
  colInstallmentAmount: `width:${pt(78)}px;text-align:right;`,
  colInstallmentStatus: `width:${pt(58)}px;text-align:right;`,
};

const T = {
  table: `width:100%;border-collapse:collapse;table-layout:fixed;margin-top:${pt(6)}px;line-height:inherit;`,
  th: `font-weight:600;font-size:${pt(9)}px;text-transform:uppercase;padding:${pt(12)}px 0 ${pt(10)}px 0;border-top:${pt(0.75)}px solid #000000;border-bottom:${pt(0.75)}px solid #000000;vertical-align:top;`,
  td: `font-size:${pt(10.5)}px;padding:${pt(6)}px 0;border-bottom:${pt(0.75)}px solid #BFBFBF;vertical-align:top;`,
  colDescription: "width:auto;",
  colRate: `width:${pt(80)}px;`,
  colQty: `width:${pt(45)}px;`,
  colAmount: `width:${pt(67)}px;`,
  left: "text-align:left;",
  right: "text-align:right;",
};

export const PAGE_MARGIN = { side: pt(30), bottom: pt(28), top: pt(21) };

function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function lines(text: string, style: string): string {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => `<div style="${style}">${esc(line)}</div>`)
    .join("");
}

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

function rateOf(item: LineItem): number {
  return Number(item.listRate ?? item.rate) || 0;
}

function totalsRow(
  label: string,
  value: string,
  labelStyle: string,
  valueStyle: string,
): string {
  return `<div style="${S.totalsRow}"><div style="${labelStyle}">${label}</div><div style="${valueStyle}">${value}</div></div>`;
}

const ATOMIC = 'data-pgbreak="avoid"';

const PG_HEADER = 'data-pgtype="table-header"';
const PG_ROW = 'data-pgtype="item-row"';

function companyBlock(company: CompanyInfo): string {
  return `<div style="${S.companyBox}">
    <div style="${S.companyName}">${esc(company.companyName)}</div>
    ${company.addressLines.map((line) => `<div style="${S.companyLine}">${esc(line)}</div>`).join("")}
    ${company.phone ? `<div style="${S.companyLine}">${esc(company.phone)}</div>` : ""}
    ${company.email ? `<div style="${S.companyLine}">${esc(company.email)}</div>` : ""}
  </div>`;
}

function metaBox(items: { label: string; value: string }[]): string {
  return `<div style="${S.metaBox}">${items
    .map(
      (item, i) =>
        `<div style="${S.metaLabel}">${item.label}</div><div style="${S.metaValue}${i === items.length - 1 ? S.metaValueLast : ""}">${esc(item.value)}</div>`,
    )
    .join("")}</div>`;
}

function headerContent(data: InvoiceData, company: CompanyInfo): string {
  const dueDate = data.installmentsEnabled
    ? nextInstallmentDueDate(data) || data.dueDate
    : data.dueDate;
  return `<div ${ATOMIC}>
    <div style="${S.header}">
      ${
        company.logoDataUri
          ? `<div style="${S.logoBox}"><img style="${S.logo}" src="${esc(company.logoDataUri)}" alt=""/></div>`
          : ""
      }
      ${companyBlock(company)}
      ${metaBox([
        { label: "Invoice", value: data.invoiceNumber || "—" },
        { label: "Date", value: formatDateLong(data.invoiceDate) },
        { label: "Due Date", value: formatDateLong(dueDate) || "—" },
      ])}
    </div>
  </div>`;
}

function installmentHeaderContent(
  data: InvoiceData,
  installment: Installment,
  company: CompanyInfo,
): string {
  const totalCount = Math.max(data.installments.length, 1);
  return `<div ${ATOMIC}>
    <div style="${S.header}">
      ${
        company.logoDataUri
          ? `<div style="${S.logoBox}"><img style="${S.logo}" src="${esc(company.logoDataUri)}" alt=""/></div>`
          : ""
      }
      ${companyBlock(company)}
      ${metaBox([
        { label: "Invoice", value: data.invoiceNumber || "—" },
        {
          label: "Installment",
          value: `Installment ${installment.seq + 1} of ${totalCount}`,
        },
        {
          label: "Due Date",
          value: formatDateLong(installment.dueDate) || "—",
        },
      ])}
    </div>
  </div>`;
}

export function invoiceTopBar(): string {
  return `<div style="${S.topBar}"></div>`;
}

export function invoiceHeaderChrome(
  data: InvoiceData,
  company: CompanyInfo,
): string {
  return `${invoiceTopBar()}
  <div style="padding:${PAGE_MARGIN.top}px ${PAGE_MARGIN.side}px 0;">${headerContent(data, company)}</div>`;
}

export function installmentHeaderChrome(
  data: InvoiceData,
  installment: Installment,
  company: CompanyInfo,
): string {
  return `${invoiceTopBar()}
  <div style="padding:${PAGE_MARGIN.top}px ${PAGE_MARGIN.side}px 0;">${installmentHeaderContent(data, installment, company)}</div>`;
}

export function invoiceFooterChrome(): string {
  return `<div style="padding:${pt(8)}px ${PAGE_MARGIN.side}px ${PAGE_MARGIN.bottom}px;text-align:center;font-size:${pt(9)}px;color:${C.text};">Electronically generated. No signature required. Scan the QR code to verify authenticity.</div>`;
}

function bodyInnerContent(data: InvoiceData, realTable = false): string {
  const totals = computeTotals(data);
  const symbol = CURRENCIES[data.currency]?.symbol ?? data.currency;

  const externalIndex = new Map<string, number>();
  let n = 0;
  for (const item of data.items) {
    if (item.externalCost) {
      n += 1;
      externalIndex.set(item.id, n);
    }
  }
  const externalItems = data.items.filter((item) => item.externalCost);

  const headerCell = (style: string, label: string) =>
    `<div style="${S.tableHeaderCell}${style}">${label}</div>`;
  const rowCell = (style: string, content: string) =>
    `<div style="${S.cellText}${style}">${content}</div>`;

  const itemCells = (item: LineItem) => ({
    description: `${esc(item.description || " ")}${item.externalCost ? `<span style="${S.superscript}"> [${externalIndex.get(item.id)}]</span>` : ""}`,
    rate: esc(formatMoney(rateOf(item), symbol)),
    qty: String(Number(item.qty) || 0),
    amount: esc(formatMoney(rateOf(item) * (Number(item.qty) || 0), symbol)),
  });

  const tableHtml = realTable
    ? `<table style="${T.table}">
    <!-- The 96 zero-width trailing columns exist so taepdf's page-break spacer
         (a <tr><td colspan="100">) spans a real, already-declared column count.
         In table-layout:fixed, Chrome re-resolves the column model when a row's
         colspan exceeds the declared columns, collapsing every following row's
         description column and silently disabling the <thead> repeat. -->
    <colgroup>
      <col style="${T.colDescription}"/><col style="${T.colRate}"/><col style="${T.colQty}"/><col style="${T.colAmount}"/>
      ${'<col style="width:0"/>'.repeat(96)}
    </colgroup>
    <thead>
      <tr ${PG_HEADER}>
        <th style="${T.th}${T.left}${T.colDescription}">Description</th>
        <th style="${T.th}${T.right}${T.colRate}">Rate</th>
        <th style="${T.th}${T.right}${T.colQty}">Qty</th>
        <th style="${T.th}${T.right}${T.colAmount}">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${data.items
        .map((item) => {
          const c = itemCells(item);
          return `<tr ${PG_ROW}>
        <td style="${T.td}${T.left}${T.colDescription}">${c.description}</td>
        <td style="${T.td}${T.right}${T.colRate}">${c.rate}</td>
        <td style="${T.td}${T.right}${T.colQty}">${c.qty}</td>
        <td style="${T.td}${T.right}${T.colAmount}">${c.amount}</td>
      </tr>`;
        })
        .join("")}
    </tbody>
  </table>`
    : `<div style="${S.table}">
    <div style="${S.tableHeader}" ${ATOMIC} ${PG_HEADER}>
      ${headerCell(S.colDescription, "Description")}
      ${headerCell(S.colRate, "Rate")}
      ${headerCell(S.colQty, "Qty")}
      ${headerCell(S.colAmount, "Amount")}
    </div>
    ${data.items
      .map((item) => {
        const c = itemCells(item);
        return `<div style="${S.tableRow}" ${ATOMIC} ${PG_ROW}>
      ${rowCell(S.colDescription, c.description)}
      ${rowCell(S.colRate, c.rate)}
      ${rowCell(S.colQty, c.qty)}
      ${rowCell(S.colAmount, c.amount)}
    </div>`;
      })
      .join("")}
  </div>`;

  const totalsHtml = [
    totalsRow(
      "Subtotal",
      esc(formatMoney(totals.subtotal, symbol)),
      S.totalsLabel,
      S.totalsValue,
    ),
    totals.discount !== 0
      ? totalsRow(
          "Discount",
          esc(formatMoney(-totals.discount, symbol)),
          S.totalsLabel,
          S.totalsValue,
        )
      : "",
    totals.credits !== 0
      ? totalsRow(
          "Credit(s) Applied",
          esc(formatMoney(-totals.credits, symbol)),
          S.totalsLabel,
          S.totalsValue,
        )
      : "",
    data.taxEnabled && totals.tax !== 0
      ? totalsRow(
          esc(data.taxLabel || "Tax"),
          esc(formatMoney(totals.tax, symbol)),
          S.totalsLabel,
          S.totalsValue,
        )
      : "",
    totals.adjustment !== 0
      ? totalsRow(
          "Adjustment",
          esc(formatMoney(totals.adjustment, symbol)),
          S.totalsLabel,
          S.totalsValue,
        )
      : "",
    totals.amountPaid
      ? totalsRow(
          "Amount Paid",
          esc(formatMoney(-totals.amountPaid, symbol)),
          S.totalsLabel,
          S.totalsValue,
        )
      : "",
  ].join("");

  return `<div style="${S.billToRow}" ${ATOMIC}>
      <div style="${S.billToBlock}">
        <div style="${S.sectionLabel}">Bill To</div>
        <div style="${S.billToName}">${esc(data.billToName || "Client Name")}</div>
        ${data.billToType === "organization" && data.billToContactName ? `<div style="${S.billToLine}">${esc(data.billToContactName)}</div>` : ""}
        ${lines(data.billToAddress, S.billToLine)}
        ${data.billToPhone ? `<div style="${S.billToLine}">${esc(data.billToPhone)}</div>` : ""}
        ${data.billToEmail ? `<div style="${S.billToLine}">${esc(data.billToEmail)}</div>` : ""}
      </div>
      <div style="${S.qrBox}">${qrSvg(`https://billing.nexaus.cloud/${data.id}`, pt(88))}</div>
    </div>
    ${tableHtml}
    <div style="${S.totalsWrap}" ${ATOMIC}>
      <div style="${S.totalsBox}">
        ${totalsHtml}
        <div style="${S.totalsDivider}"></div>
        ${totalsRow("Total", esc(formatMoney(totals.total, symbol)), S.totalsFinalLabel, S.totalsFinalValue)}
        <div style="${S.totalsDivider}"></div>
        <div style="${S.balanceDueLabel}">Balance Due</div>
        <div style="${S.balanceDueValue}">${esc(data.currency)} ${esc(formatMoney(totals.balanceDue, symbol))}</div>
      </div>
    </div>
    ${
      data.installmentsEnabled && data.installments.length > 0
        ? scheduleTable(data, symbol)
        : ""
    }
    ${
      data.notes
        ? `<div style="${S.notes}" ${ATOMIC}><div style="${S.notesLabel}">Notes</div><div style="${S.notesText}">${esc(data.notes)}</div></div>`
        : ""
    }
    ${
      externalItems.length > 0
        ? `<div style="${S.notes}" ${ATOMIC}><div style="${S.notesLabel}">References</div>${externalItems
            .map(
              (item, i) =>
                `<div style="${S.notesText}">[${i + 1}] ${esc(item.externalCost?.vendor ?? "")}${item.externalCost?.invoiceNumber ? ` ${esc(item.externalCost.invoiceNumber)}` : ""}</div>`,
            )
            .join("")}</div>`
        : ""
    }`;
}

function scheduleTable(
  data: InvoiceData,
  symbol: string,
  highlightId?: string,
): string {
  const scheduled = withInstallmentAllocations(
    data.installments,
    data.payments,
  );
  const headerCell = (style: string, label: string) =>
    `<div style="${S.tableHeaderCell}${style}">${label}</div>`;
  const rowCell = (style: string, content: string) =>
    `<div style="${S.cellText}${style}">${content}</div>`;
  const rows = scheduled
    .map((inst) => {
      const statusLabel =
        inst.status === "paid"
          ? "Paid"
          : inst.status === "partial"
            ? "Partial"
            : "Unpaid";
      const highlight = highlightId && inst.id === highlightId;
      const rowStyle = highlight
        ? `${S.scheduleRow}font-weight:600;`
        : S.scheduleRow;
      return `<div style="${rowStyle}" ${ATOMIC}>
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
      ${headerCell(S.colInstallmentIndex, "#")}
      ${headerCell(S.colInstallmentLabel, "Label")}
      ${headerCell(S.colInstallmentDue, "Due Date")}
      ${headerCell(S.colInstallmentAmount, "Amount")}
      ${headerCell(S.colInstallmentStatus, "Status")}
    </div>
    ${rows}
  </div>`;
}

function installmentDetailBlock(
  data: InvoiceData,
  installment: Installment,
  symbol: string,
): string {
  const headerCell = (style: string, label: string) =>
    `<div style="${S.tableHeaderCell}${style}">${label}</div>`;
  const rowCell = (style: string, content: string) =>
    `<div style="${S.cellText}${style}">${content}</div>`;
  return `<div style="${S.notes}" ${ATOMIC}>
    <div style="${S.sectionLabel}">Installment Details</div>
    <div style="${S.scheduleHeader}" ${PG_HEADER}>
      ${headerCell(S.colInstallmentIndex, "#")}
      ${headerCell(S.colInstallmentLabel, "Label")}
      ${headerCell(S.colInstallmentAmount, "Amount")}
    </div>
    <div style="${S.scheduleRow}">
      ${rowCell(S.colInstallmentIndex, String(installment.seq + 1))}
      ${rowCell(S.colInstallmentLabel, esc(installment.label || "—"))}
      ${rowCell(S.colInstallmentAmount, esc(formatMoney(installment.amount, symbol)))}
    </div>
  </div>`;
}

function installmentBodyInnerContent(
  data: InvoiceData,
  installment: Installment,
): string {
  const totals = computeTotals(data);
  const symbol = CURRENCIES[data.currency]?.symbol ?? data.currency;
  const totalCount = Math.max(data.installments.length, 1);
  const current =
    withInstallmentAllocations(data.installments, data.payments).find(
      (i) => i.id === installment.id,
    ) ?? installment;
  const paidAmount = current.paidAmount ?? 0;
  const dueAmount = Math.max((Number(installment.amount) || 0) - paidAmount, 0);

  return `<div style="${S.billToRow}" ${ATOMIC}>
      <div style="${S.billToBlock}">
        <div style="${S.sectionLabel}">Bill To</div>
        <div style="${S.billToName}">${esc(data.billToName || "Client Name")}</div>
        ${data.billToType === "organization" && data.billToContactName ? `<div style="${S.billToLine}">${esc(data.billToContactName)}</div>` : ""}
        ${lines(data.billToAddress, S.billToLine)}
        ${data.billToPhone ? `<div style="${S.billToLine}">${esc(data.billToPhone)}</div>` : ""}
        ${data.billToEmail ? `<div style="${S.billToLine}">${esc(data.billToEmail)}</div>` : ""}
      </div>
      <div style="${S.qrBox}">${qrSvg(`https://billing.nexaus.cloud/${data.id}`, pt(88))}</div>
    </div>
    ${installmentDetailBlock(data, installment, symbol)}
    <div style="${S.totalsWrap}" ${ATOMIC}>
      <div style="${S.totalsBox}">
        ${totalsRow("Invoice Total", esc(formatMoney(totals.total, symbol)), S.totalsFinalLabel, S.totalsFinalValue)}
        <div style="${S.totalsDivider}"></div>
        ${totalsRow("Amount Paid", esc(formatMoney(paidAmount, symbol)), S.totalsLabel, S.totalsValue)}
        <div style="${S.totalsDivider}"></div>
        <div style="${S.balanceDueLabel}">Installment Amount Due</div>
        <div style="${S.balanceDueValue}">${esc(data.currency)} ${esc(formatMoney(dueAmount, symbol))}</div>
      </div>
    </div>
    ${
      data.notes
        ? `<div style="${S.notes}" ${ATOMIC}><div style="${S.notesLabel}">Notes</div><div style="${S.notesText}">${esc(data.notes)}</div></div>`
        : ""
    }
    <div style="${S.notes}" ${ATOMIC}><div style="${S.notesText}">This is installment ${installment.seq + 1} of ${totalCount} for invoice ${esc(data.invoiceNumber || "—")}. The full invoice total is ${esc(formatMoney(totals.total, symbol))}.</div></div>`;
}

const INSTALLMENT_STAMP: Record<
  string,
  { bg: string; fg: string; label: string }
> = {
  paid: { bg: "#16A34A", fg: "#FFFFFF", label: "PAID" },
  partial: { bg: "#F5B301", fg: "#1F2937", label: "PARTIAL" },
  unpaid: { bg: "#DC2626", fg: "#FFFFFF", label: "UNPAID" },
};

function installmentStatusStamp(status: string): string {
  const stamp = INSTALLMENT_STAMP[status] ?? INSTALLMENT_STAMP.unpaid;
  return `<div style="position:absolute;top:${pt(6)}px;left:50%;transform:translateX(-50%) rotate(45deg);transform-origin:center;background:${stamp.bg};color:${stamp.fg};font-weight:700;font-size:${pt(16)}px;text-transform:uppercase;letter-spacing:${pt(3)}px;padding:${pt(12)}px ${pt(72)}px;box-shadow:0 ${pt(3)}px ${pt(10)}px rgba(0,0,0,0.25);z-index:10;border:${pt(2)}px solid ${stamp.fg};white-space:nowrap;">${stamp.label}</div>`;
}

export function installmentMarkup(
  data: InvoiceData,
  installment: Installment,
  opts?: {
    headerMode?: "first" | "every";
    company?: CompanyInfo;
  },
): string {
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
      ? `<div style="padding:0 ${PAGE_MARGIN.side}px 0;">${installmentHeaderContent(data, installment, opts.company)}</div>`
      : "";
  const current =
    withInstallmentAllocations(data.installments, data.payments).find(
      (i) => i.id === installment.id,
    ) ?? installment;
  return `<div style="${page}">
  ${headerBlock}
  <div style="position:relative;${body}">
    ${installmentStatusStamp(current.status ?? "unpaid")}
    ${installmentBodyInnerContent(data, installment)}
  </div>
</div>`;
}

export function invoiceMarkup(
  data: InvoiceData,
  opts?: {
    realTable?: boolean;
    headerMode?: "first" | "every";
    company?: CompanyInfo;
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
        ? `<div style="padding:0 ${PAGE_MARGIN.side}px 0;">${headerContent(data, opts.company)}</div>`
        : "";
    return `<div style="${page}">
  ${headerBlock}
  <div style="${body}">
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
