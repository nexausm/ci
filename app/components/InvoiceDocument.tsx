import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import type { Styles } from "@react-pdf/renderer";
import type { CompanyInfo, InvoiceData } from "@/lib/types";
import { CURRENCIES } from "@/lib/currency";
import { computeTotals, formatMoney, formatDateLong } from "@/lib/totals";

Font.register({ family: "Inter-Medium", src: "/fonts/Inter-Medium.woff" });
Font.register({ family: "Inter-SemiBold", src: "/fonts/Inter-SemiBold.woff" });
Font.register({
  family: "NotoSansDevanagari",
  src: "/fonts/NotoSansDevanagari-Regular.woff",
});
Font.register({
  family: "NotoSansBengali",
  src: "/fonts/NotoSansBengali-Regular.woff",
});

const FONT_REGULAR = ["Inter-Medium", "NotoSansDevanagari", "NotoSansBengali"];
const FONT_BOLD = ["Inter-SemiBold", "NotoSansDevanagari", "NotoSansBengali"];

const TEXT = "#444444";
const COLORS = {
  bar: "#1565C0",
  text: TEXT,
  dividerLight: "#CBD5E1",
  borderDark: "#000000",
  dividerGray: "#BFBFBF",
};

const styles = StyleSheet.create({
  page: {
    fontFamily: FONT_REGULAR,
    fontSize: 10.5,
    color: TEXT,
  },
  topBar: {
    height: 3,
    backgroundColor: COLORS.bar,
  },
  body: {
    paddingHorizontal: 30,
    paddingTop: 21,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  logoBox: {
    width: 144,
    height: 112.5,
    marginRight: 19,
  },
  logo: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    objectPosition: "left top",
  },
  companyBox: {
    flex: 1,
  },
  companyName: {
    fontFamily: FONT_BOLD,
    fontSize: 15,
    marginBottom: 10,
  },
  companyLine: {
    fontSize: 10.5,
    marginBottom: 3.7,
  },
  companyLabel: {
    fontFamily: FONT_BOLD,
  },
  metaBox: {
    width: 170,
    alignItems: "flex-end",
  },
  metaLabel: {
    fontFamily: FONT_BOLD,
    fontSize: 9,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  metaValue: {
    fontSize: 10.5,
    marginBottom: 15.5,
    textAlign: "right",
  },
  headerDivider: {
    height: 0.75,
    backgroundColor: COLORS.dividerLight,
    marginTop: 11,
    marginBottom: 14,
  },
  sectionLabel: {
    fontFamily: FONT_BOLD,
    fontSize: 9,
    textTransform: "uppercase",
    marginBottom: 14,
  },
  billToName: {
    fontFamily: FONT_BOLD,
    fontSize: 13.5,
    marginBottom: 9.5,
  },
  billToLine: {
    fontSize: 10.5,
    marginBottom: 3.7,
  },
  table: {
    marginTop: 23,
  },
  tableHeader: {
    flexDirection: "row",
    borderTopWidth: 0.75,
    borderTopColor: COLORS.borderDark,
    borderBottomWidth: 0.75,
    borderBottomColor: COLORS.borderDark,
    paddingTop: 12,
    paddingBottom: 10,
  },
  tableHeaderCell: {
    fontFamily: FONT_BOLD,
    fontSize: 9,
    textTransform: "uppercase",
  },
  colDescription: { flex: 1 },
  colRate: { width: 80, textAlign: "right" },
  colQty: { width: 45, textAlign: "right" },
  colAmount: { width: 67, textAlign: "right" },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.75,
    borderBottomColor: COLORS.dividerGray,
    paddingVertical: 8,
  },
  cellText: {
    fontSize: 10.5,
  },
  totalsWrap: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 16,
  },
  totalsBox: {
    width: 268,
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  totalsLabel: {
    fontFamily: FONT_BOLD,
    fontSize: 9,
    textTransform: "uppercase",
  },
  totalsValue: {
    fontSize: 10.5,
  },
  totalsDivider: {
    height: 0.75,
    backgroundColor: COLORS.dividerGray,
    marginBottom: 12,
  },
  totalsDividerFinal: {
    height: 0.75,
    backgroundColor: COLORS.dividerGray,
    marginTop: 10,
  },
  totalsFinalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  totalsFinalLabel: {
    fontFamily: FONT_BOLD,
    fontSize: 9,
    textTransform: "uppercase",
  },
  totalsFinalValue: {
    fontSize: 10.5,
  },
  balanceDueLabel: {
    fontFamily: FONT_BOLD,
    fontSize: 9,
    textTransform: "uppercase",
    textAlign: "right",
    marginBottom: 11,
  },
  balanceDueValue: {
    fontFamily: FONT_BOLD,
    fontSize: 13.5,
    textAlign: "right",
  },
  notes: {
    marginTop: 30,
  },
  notesLabel: {
    fontFamily: FONT_BOLD,
    fontSize: 9,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  notesText: {
    fontSize: 10.5,
    lineHeight: 1.5,
  },
});

function Lines({ text, style }: { text: string; style: Styles[string] }) {
  return (
    <>
      {text
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .map((line, i) => (
          <Text key={i} style={style}>
            {line}
          </Text>
        ))}
    </>
  );
}

export function InvoiceDocument({
  data,
  company,
}: {
  data: InvoiceData;
  company: CompanyInfo;
}) {
  const totals = computeTotals(data);
  const symbol = CURRENCIES[data.currency].symbol;

  return (
    <Document title={`Invoice ${data.invoiceNumber || ""}`.trim()}>
      <Page size="A4" style={styles.page}>
        <View style={styles.topBar} fixed />
        <View style={styles.body}>
          <View style={styles.header}>
            {company.logoDataUri ? (
              <View style={styles.logoBox}>
                {/* eslint-disable-next-line jsx-a11y/alt-text */}
                <Image style={styles.logo} src={company.logoDataUri} />
              </View>
            ) : null}

            <View style={styles.companyBox}>
              <Text style={styles.companyName}>{company.companyName}</Text>
              {company.addressLines.map((line, i) => (
                <Text key={i} style={styles.companyLine}>
                  {line}
                </Text>
              ))}
              {company.phone ? (
                <Text style={styles.companyLine}>{company.phone}</Text>
              ) : null}
              {company.email ? (
                <Text style={styles.companyLine}>{company.email}</Text>
              ) : null}
            </View>

            <View style={styles.metaBox}>
              <Text style={styles.metaLabel}>Invoice</Text>
              <Text style={styles.metaValue}>{data.invoiceNumber || "—"}</Text>

              <Text style={styles.metaLabel}>Date</Text>
              <Text style={styles.metaValue}>
                {formatDateLong(data.invoiceDate)}
              </Text>

              <Text style={styles.metaLabel}>Balance Due</Text>
              <Text style={[styles.metaValue, { marginBottom: 0 }]}>
                {formatMoney(totals.balanceDue, symbol)}
              </Text>
            </View>
          </View>

          <View style={styles.headerDivider} />

          <View>
            <Text style={styles.sectionLabel}>Bill To</Text>
            <Text style={styles.billToName}>
              {data.billToName || "Client Name"}
            </Text>
            <Lines text={data.billToAddress} style={styles.billToLine} />
            {data.billToPhone ? (
              <Text style={styles.billToLine}>{data.billToPhone}</Text>
            ) : null}
          </View>

          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.colDescription]}>
                Description
              </Text>
              <Text style={[styles.tableHeaderCell, styles.colRate]}>Rate</Text>
              <Text style={[styles.tableHeaderCell, styles.colQty]}>Qty</Text>
              <Text style={[styles.tableHeaderCell, styles.colAmount]}>
                Amount
              </Text>
            </View>

            {data.items.map((item) => (
              <View key={item.id} style={styles.tableRow} wrap={false}>
                <Text style={[styles.cellText, styles.colDescription]}>
                  {item.description || " "}
                </Text>
                <Text style={[styles.cellText, styles.colRate]}>
                  {formatMoney(Number(item.rate) || 0, symbol)}
                </Text>
                <Text style={[styles.cellText, styles.colQty]}>
                  {Number(item.qty) || 0}
                </Text>
                <Text style={[styles.cellText, styles.colAmount]}>
                  {formatMoney(
                    (Number(item.rate) || 0) * (Number(item.qty) || 0),
                    symbol,
                  )}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.totalsWrap}>
            <View style={styles.totalsBox}>
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>Subtotal</Text>
                <Text style={styles.totalsValue}>
                  {formatMoney(totals.subtotal, symbol)}
                </Text>
              </View>

              {data.discountEnabled && totals.discount !== 0 ? (
                <View style={styles.totalsRow}>
                  <Text style={styles.totalsLabel}>Discount</Text>
                  <Text style={styles.totalsValue}>
                    {formatMoney(-totals.discount, symbol)}
                  </Text>
                </View>
              ) : null}

              {data.taxEnabled && totals.tax !== 0 ? (
                <View style={styles.totalsRow}>
                  <Text style={styles.totalsLabel}>
                    {data.taxLabel || "Tax"}
                  </Text>
                  <Text style={styles.totalsValue}>
                    {formatMoney(totals.tax, symbol)}
                  </Text>
                </View>
              ) : null}

              {data.amountPaid ? (
                <View style={styles.totalsRow}>
                  <Text style={styles.totalsLabel}>Amount Paid</Text>
                  <Text style={styles.totalsValue}>
                    {formatMoney(-data.amountPaid, symbol)}
                  </Text>
                </View>
              ) : null}

              <View style={styles.totalsDivider} />

              <View style={styles.totalsFinalRow}>
                <Text style={styles.totalsFinalLabel}>Total</Text>
                <Text style={styles.totalsFinalValue}>
                  {formatMoney(totals.total, symbol)}
                </Text>
              </View>

              <View style={styles.totalsDivider} />

              <Text style={styles.balanceDueLabel}>Balance Due</Text>
              <Text style={styles.balanceDueValue}>
                {data.currency} {formatMoney(totals.balanceDue, symbol)}
              </Text>

              <View style={styles.totalsDividerFinal} />
            </View>
          </View>

          {data.notes ? (
            <View style={styles.notes}>
              <Text style={styles.notesLabel}>Notes</Text>
              <Text style={styles.notesText}>{data.notes}</Text>
            </View>
          ) : null}
        </View>
      </Page>
    </Document>
  );
}
