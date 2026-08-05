import qrcode from "qrcode-generator";
import type { CompanyInfo, InvoiceData, LineItem } from "@/lib/types";
import { CURRENCIES } from "@/lib/currency";
import { computeTotals, formatMoney, formatDateLong } from "@/lib/totals";

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

function headerContent(data: InvoiceData, company: CompanyInfo): string {
  return `<div ${ATOMIC}>
    <div style="${S.header}">
      ${
        company.logoDataUri
          ? `<div style="${S.logoBox}"><img style="${S.logo}" src="${esc(company.logoDataUri)}" alt=""/></div>`
          : ""
      }
      <div style="${S.companyBox}">
        <div style="${S.companyName}">${esc(company.companyName)}</div>
        ${company.addressLines.map((line) => `<div style="${S.companyLine}">${esc(line)}</div>`).join("")}
        ${company.phone ? `<div style="${S.companyLine}">${esc(company.phone)}</div>` : ""}
        ${company.email ? `<div style="${S.companyLine}">${esc(company.email)}</div>` : ""}
      </div>
      <div style="${S.metaBox}">
        <div style="${S.metaLabel}">Invoice</div>
        <div style="${S.metaValue}">${esc(data.invoiceNumber || "—")}</div>
        <div style="${S.metaLabel}">Date</div>
        <div style="${S.metaValue}">${esc(formatDateLong(data.invoiceDate))}</div>
        <div style="${S.metaLabel}">Due Date</div>
        <div style="${S.metaValue}${S.metaValueLast}">${esc(formatDateLong(data.dueDate) || "—")}</div>
      </div>
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
