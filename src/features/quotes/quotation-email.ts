import { format, parseISO } from "date-fns";
import type { PublicQuote } from "./public-quote";

export type QuotationEmailQuote = Pick<
  PublicQuote,
  | "name"
  | "email"
  | "arrival"
  | "departure"
  | "adults"
  | "childrenSixToSeventeen"
  | "childrenUnderSix"
  | "calculation"
>;

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] ?? character);

function partyDescription(quote: QuotationEmailQuote) {
  const groups = [
    quote.adults > 0 ? `${quote.adults} ${quote.adults === 1 ? "adult" : "adults"}` : null,
    quote.childrenSixToSeventeen > 0 ? `${quote.childrenSixToSeventeen} ${quote.childrenSixToSeventeen === 1 ? "child aged 6 or over" : "children aged 6 or over"}` : null,
    quote.childrenUnderSix > 0 ? `${quote.childrenUnderSix} ${quote.childrenUnderSix === 1 ? "child under 6" : "children under 6"}` : null,
  ].filter((group): group is string => Boolean(group));

  if (groups.length < 2) return groups[0] ?? "your party";
  if (groups.length === 2) return `${groups[0]} and ${groups[1]}`;
  return `${groups.slice(0, -1).join(", ")} and ${groups.at(-1)}`;
}

export function renderQuotationEmail(quote: QuotationEmailQuote, siteUrl: string) {
  const firstName = quote.name.trim().split(/\s+/)[0] || "Guest";
  const customerName = quote.name.trim().replace(/\s+/g, " ");
  const logoUrl = `${siteUrl.replace(/\/$/, "")}/images/cocopalms-logo.jpg`;
  const fromDate = format(parseISO(quote.arrival), "d MMMM yyyy");
  const toDate = format(parseISO(quote.departure), "d MMMM yyyy");
  const party = partyDescription(quote);
  const rows = [
    ...quote.calculation.rateBreakdown.map((line) => ({
      textLabel: `${line.nights} ${line.nights === 1 ? "night" : "nights"} × ${money.format(line.rate)} — ${line.period}`,
      htmlLabel: `${line.nights} ${line.nights === 1 ? "night" : "nights"} × <strong>${money.format(line.rate)}</strong> — ${escapeHtml(line.period)}`,
      amount: line.total,
    })),
    ...(quote.calculation.longStayDiscount ? [{ textLabel: "Long-stay discount", htmlLabel: "Long-stay discount", amount: quote.calculation.longStayDiscount }] : []),
    ...(quote.calculation.shortStayLevy ? [{ textLabel: "Four-night short-stay charge", htmlLabel: "Four-night short-stay charge", amount: quote.calculation.shortStayLevy }] : []),
    { textLabel: "ABST — 17% of accommodation and applicable charges", htmlLabel: "ABST — 17% of accommodation and applicable charges", amount: quote.calculation.abst },
    {
      textLabel: `Government levy — ${quote.calculation.levyGuests} guests aged 6+ × ${quote.calculation.nights} nights × $5`,
      htmlLabel: `Government levy — ${quote.calculation.levyGuests} guests aged 6+ × ${quote.calculation.nights} nights × <strong>$5</strong>`,
      amount: quote.calculation.governmentLevy,
    },
    { textLabel: "Administration fee — 5% including the refundable $2,000 security deposit", htmlLabel: "Administration fee — 5% including the refundable <strong>$2,000</strong> security deposit", amount: quote.calculation.fees },
  ];
  const summaryRows = [
    { label: "Quotation total", amount: quote.calculation.quotationTotal },
    { label: "Due on booking", amount: quote.calculation.dueToConfirm },
    { label: "Balance due 10 weeks before arrival", amount: quote.calculation.balanceDue },
  ];
  const textRows = [
    ...rows.map((row) => `${row.textLabel}: ${money.format(row.amount)}`),
    ...summaryRows.map((row) => `${row.label}: ${money.format(row.amount)}`),
  ].join("\n");
  const htmlRows = [...rows.map((row) => ({ label: row.htmlLabel, amount: row.amount })), ...summaryRows]
    .map((row) => `<tr><td style="padding:8px 0;border-bottom:1px solid #dde5e2">${row.label}</td><td style="padding:8px 0;border-bottom:1px solid #dde5e2;text-align:right;white-space:nowrap"><strong>${money.format(row.amount)}</strong></td></tr>`)
    .join("");
  const subject = `Coco Palms Quotation for ${customerName}`;
  const text = `Dear ${firstName},\n\nThank you for your interest in Coco Palms.\n\nWe’re very pleased to tell you that Coco Palms is available for ${quote.calculation.nights} ${quote.calculation.nights === 1 ? "night" : "nights"} between ${fromDate} and ${toDate}.\n\nThe cost of the booking would be ${money.format(quote.calculation.quotationTotal)} USD for ${party}.\n\nAn additional, refundable deposit of ${money.format(quote.calculation.securityDeposit)} USD is also required.\n\nA breakdown of the quotation is as follows\n\n${textRows}\n\nSeparate refundable security deposit: ${money.format(quote.calculation.securityDeposit)}\n\nPlease let us know if you would like to proceed with a booking or if we can answer any further questions for you.\n\nRegards\n\nCoco Palms Team`;
  const html = `<div style="font-family:Avenir,Arial,sans-serif;color:#111;max-width:680px;margin:auto"><div style="padding:24px 28px 0;text-align:center"><img src="${escapeHtml(logoUrl)}" alt="Coco Palms Antigua" width="190" height="96" style="display:block;margin:0 auto;border:0;max-width:100%;height:auto"></div><div style="padding:28px"><p>Dear ${escapeHtml(firstName)},</p><p>Thank you for your interest in Coco Palms.</p><p>We’re very pleased to tell you that Coco Palms is available for ${quote.calculation.nights} ${quote.calculation.nights === 1 ? "night" : "nights"} between ${escapeHtml(fromDate)} and ${escapeHtml(toDate)}.</p><p>The cost of the booking would be <strong>${money.format(quote.calculation.quotationTotal)} USD</strong> for ${escapeHtml(party)}.</p><p>An additional, refundable deposit of <strong>${money.format(quote.calculation.securityDeposit)} USD</strong> is also required.</p><p>A breakdown of the quotation is as follows</p><table style="width:100%;border-collapse:collapse">${htmlRows}</table><p>Separate refundable security deposit: <strong>${money.format(quote.calculation.securityDeposit)}</strong></p><p>Please let us know if you would like to proceed with a booking or if we can answer any further questions for you.</p><p>Regards<br>Coco Palms Team</p></div></div>`;
  return { subject, text, html };
}

export function createQuotationEmailMessage(quote: QuotationEmailQuote, siteUrl: string) {
  return {
    to: quote.email,
    cc: "hello@cocopalms-antigua.com",
    replyTo: "hello@cocopalms-antigua.com",
    ...renderQuotationEmail(quote, siteUrl),
  };
}
