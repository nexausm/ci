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

const S = {
  page: `width:794px;min-height:1123px;background:#FFFFFF;font-family:${FONT};font-size:10.5px;font-weight:500;color:${C.text};display:flex;flex-direction:column;`,
  topBar: `height:3px;background:${C.bar};`,
  body: "flex:1;display:flex;flex-direction:column;padding:21px 30px 40px;",
  header: "display:flex;flex-direction:row;align-items:flex-start;",
  logoBox: "width:144px;height:112.5px;margin-right:19px;",
  logo: "width:100%;height:100%;object-fit:contain;object-position:left top;",
  companyBox: "flex:1;",
  companyName: "font-weight:600;font-size:15px;margin-bottom:10px;",
  companyLine: "font-size:10.5px;margin-bottom:3.7px;",
  metaBox: "width:170px;text-align:right;",
  metaLabel:
    "font-weight:600;font-size:9px;text-transform:uppercase;margin-bottom:6px;",
  metaValue: "font-size:10.5px;margin-bottom:15.5px;text-align:right;",
  metaValueLast: "margin-bottom:0px;",
  headerDivider: `height:0.75px;background:${C.dividerLight};margin-top:11px;margin-bottom:14px;`,
  billToRow:
    "display:flex;flex-direction:row;justify-content:space-between;align-items:flex-start;",
  billToBlock: "flex:1;",
  qrBox: "padding:6px;background:#FFFFFF;",
  sectionLabel:
    "font-weight:600;font-size:9px;text-transform:uppercase;margin-bottom:14px;",
  billToName: "font-weight:600;font-size:13.5px;margin-bottom:9.5px;",
  billToLine: "font-size:10.5px;margin-bottom:3.7px;",
  table: "margin-top:6px;",
  tableHeader:
    "display:flex;flex-direction:row;border-top:0.75px solid #000000;border-bottom:0.75px solid #000000;padding-top:12px;padding-bottom:10px;",
  tableHeaderCell: "font-weight:600;font-size:9px;text-transform:uppercase;",
  colDescription: "flex:1;",
  colRate: "width:80px;text-align:right;",
  colQty: "width:45px;text-align:right;",
  colAmount: "width:67px;text-align:right;",
  tableRow:
    "display:flex;flex-direction:row;border-bottom:0.75px solid #BFBFBF;padding-top:6px;padding-bottom:6px;",
  cellText: "font-size:10.5px;",
  superscript: "font-size:7px;vertical-align:super;",
  totalsWrap:
    "display:flex;flex-direction:row;justify-content:flex-end;margin-top:16px;",
  totalsBox: "width:268px;",
  totalsRow:
    "display:flex;flex-direction:row;justify-content:space-between;margin-bottom:7px;",
  totalsLabel: "font-weight:600;font-size:9px;text-transform:uppercase;",
  totalsValue: "font-size:10.5px;",
  totalsDivider: `height:0.75px;background:${C.dividerGray};margin-bottom:9px;`,
  totalsDividerFinal: `height:0.75px;background:${C.dividerGray};margin-top:7px;`,
  totalsFinalRow:
    "display:flex;flex-direction:row;justify-content:space-between;margin-bottom:7px;",
  totalsFinalLabel: "font-weight:600;font-size:9px;text-transform:uppercase;",
  totalsFinalValue: "font-size:10.5px;",
  balanceDueLabel:
    "font-weight:600;font-size:9px;text-transform:uppercase;text-align:right;margin-bottom:9px;",
  balanceDueValue: "font-weight:600;font-size:13.5px;text-align:right;",
  notes: "margin-top:26px;",
  notesLabel:
    "font-weight:600;font-size:9px;text-transform:uppercase;margin-bottom:8px;",
  notesText: "font-size:10.5px;line-height:1.5;",
  footer:
    "margin-top:10px;text-align:center;font-size:9px;color:#444444;padding-top:6px;",
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
      <div style="${S.qrBox}">${qrSvg(`https://billing.nexaus.cloud/${data.id}`, 88)}</div>
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
