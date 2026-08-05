import qrcode from "qrcode-generator";
import type { CompanyInfo, InvoiceData, LineItem } from "@/lib/types";
import { CURRENCIES } from "@/lib/currency";
import { computeTotals, formatMoney, formatDateLong } from "@/lib/totals";

const FONT = "'Inter', 'Noto Sans Devanagari', 'Noto Sans Bengali'";

const C = {
  bar: "#1565C0",
  text: "#444444",
  dividerLight: "#CBD5E1",
  dividerGray: "#BFBFBF",
};

const pt = (n: number) => Math.round(n * (96 / 72) * 100) / 100;

const S = {
  page: `width:794px;min-height:1123px;background:#FFFFFF;font-family:${FONT};font-size:${pt(10.5)}px;font-weight:500;color:${C.text};display:flex;flex-direction:column;`,
  topBar: `height:${pt(3)}px;background:${C.bar};`,
  body: `flex:1;display:flex;flex-direction:column;padding:${pt(21)}px ${pt(30)}px ${pt(40)}px;`,
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
  headerDivider: `height:${pt(0.75)}px;background:${C.dividerLight};margin-top:${pt(11)}px;margin-bottom:${pt(14)}px;`,
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
  totalsDividerFinal: `height:${pt(0.75)}px;background:${C.dividerGray};margin-top:${pt(7)}px;`,
  totalsFinalRow: `display:flex;flex-direction:row;justify-content:space-between;margin-bottom:${pt(7)}px;`,
  totalsFinalLabel: `font-weight:600;font-size:${pt(9)}px;text-transform:uppercase;`,
  totalsFinalValue: `font-size:${pt(10.5)}px;`,
  balanceDueLabel: `font-weight:600;font-size:${pt(9)}px;text-transform:uppercase;text-align:right;margin-bottom:${pt(9)}px;`,
  balanceDueValue: `font-weight:600;font-size:${pt(13.5)}px;text-align:right;`,
  notes: `margin-top:${pt(26)}px;`,
  notesLabel: `font-weight:600;font-size:${pt(9)}px;text-transform:uppercase;margin-bottom:${pt(8)}px;`,
  notesText: `font-size:${pt(10.5)}px;line-height:1.5;`,
  footer: `margin-top:${pt(10)}px;text-align:center;font-size:${pt(9)}px;color:#444444;padding-top:${pt(6)}px;`,
};

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

export function invoiceMarkup(data: InvoiceData, company: CompanyInfo): string {
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

  return `<div style="${S.page}">
  <div style="${S.topBar}"></div>
  <div style="${S.body}">
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
    <div style="${S.headerDivider}"></div>
    <div style="${S.billToRow}">
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
    <div style="${S.table}">
      <div style="${S.tableHeader}">
        ${headerCell(S.colDescription, "Description")}
        ${headerCell(S.colRate, "Rate")}
        ${headerCell(S.colQty, "Qty")}
        ${headerCell(S.colAmount, "Amount")}
      </div>
      ${data.items
        .map(
          (item) => `<div style="${S.tableRow}">
        ${rowCell(S.colDescription, `${esc(item.description || " ")}${item.externalCost ? `<span style="${S.superscript}"> [${externalIndex.get(item.id)}]</span>` : ""}`)}
        ${rowCell(S.colRate, esc(formatMoney(rateOf(item), symbol)))}
        ${rowCell(S.colQty, String(Number(item.qty) || 0))}
        ${rowCell(S.colAmount, esc(formatMoney(rateOf(item) * (Number(item.qty) || 0), symbol)))}
      </div>`,
        )
        .join("")}
    </div>
    <div style="${S.totalsWrap}">
      <div style="${S.totalsBox}">
        ${totalsHtml}
        <div style="${S.totalsDivider}"></div>
        ${totalsRow("Total", esc(formatMoney(totals.total, symbol)), S.totalsFinalLabel, S.totalsFinalValue)}
        <div style="${S.totalsDivider}"></div>
        <div style="${S.balanceDueLabel}">Balance Due</div>
        <div style="${S.balanceDueValue}">${esc(data.currency)} ${esc(formatMoney(totals.balanceDue, symbol))}</div>
        <div style="${S.totalsDividerFinal}"></div>
      </div>
    </div>
    ${
      data.notes
        ? `<div style="${S.notes}"><div style="${S.notesLabel}">Notes</div><div style="${S.notesText}">${esc(data.notes)}</div></div>`
        : ""
    }
    ${
      externalItems.length > 0
        ? `<div style="${S.notes}"><div style="${S.notesLabel}">References</div>${externalItems
            .map(
              (item, i) =>
                `<div style="${S.notesText}">[${i + 1}] ${esc(item.externalCost?.vendor ?? "")}${item.externalCost?.invoiceNumber ? ` ${esc(item.externalCost.invoiceNumber)}` : ""}</div>`,
            )
            .join("")}</div>`
        : ""
    }
    <div style="${S.footer}">Electronically generated. No signature required. Scan the QR code to verify authenticity.</div>
  </div>
</div>`;
}
