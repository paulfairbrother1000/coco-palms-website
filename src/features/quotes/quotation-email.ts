import { format, parseISO } from "date-fns";
import type { PublicQuote } from "./public-quote";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] ?? character);

export function renderQuotationEmail(quote: PublicQuote, siteUrl: string) {
  const link = `${siteUrl.replace(/\/$/, "")}/quotation/${quote.token}`;
  const dates = `${format(parseISO(quote.arrival), "d MMMM yyyy")} to ${format(parseISO(quote.departure), "d MMMM yyyy")}`;
  const lines = [
    ...quote.calculation.rateBreakdown.map((line) => [`${line.period}: ${line.nights} ${line.nights === 1 ? "night" : "nights"} at ${money.format(line.rate)}`, line.total] as const),
    ...(quote.calculation.longStayDiscount ? [["Long-stay discount", quote.calculation.longStayDiscount] as const] : []),
    ...(quote.calculation.shortStayLevy ? [["Four-night short-stay charge", quote.calculation.shortStayLevy] as const] : []),
    ["ABST (17%)", quote.calculation.abst] as const,
    [`Government levy (${quote.calculation.levyGuests} guests aged 6+)`, quote.calculation.governmentLevy] as const,
    ["Administration fee (5%, including refundable security deposit)", quote.calculation.fees] as const,
  ];
  const textLines = lines.map(([label, amount]) => `${label}: ${money.format(amount)}`).join("\n");
  const htmlLines = lines.map(([label, amount]) => `<tr><td style="padding:8px 0;border-bottom:1px solid #dde5e2">${escapeHtml(label)}</td><td style="padding:8px 0;border-bottom:1px solid #dde5e2;text-align:right"><strong>${money.format(amount)}</strong></td></tr>`).join("");
  const subject = `Your Coco Palms quotation ${quote.reference}`;
  const text = `Hello ${quote.name},\n\nThank you for considering Coco Palms Antigua.\n\nStay: ${dates}\nAdults: ${quote.adults}\nChildren aged 6–17: ${quote.childrenSixToSeventeen}\nChildren under 6: ${quote.childrenUnderSix}\n\n${textLines}\nQuotation total: ${money.format(quote.calculation.quotationTotal)}\nDue to confirm: ${money.format(quote.calculation.dueToConfirm)}\nBalance due: ${money.format(quote.calculation.balanceDue)}\nRefundable security deposit: ${money.format(quote.calculation.securityDeposit)}\n\nView your quotation: ${link}\n\nThis quotation does not reserve your dates.\n\nCoco Palms Antigua`;
  const html = `<div style="font-family:Avenir,Arial,sans-serif;color:#111;max-width:680px;margin:auto"><div style="background:#071725;color:white;padding:28px"><h1 style="margin:0">Coco Palms Antigua</h1><p style="margin:8px 0 0">Quotation ${quote.reference}</p></div><div style="padding:28px"><p>Hello ${escapeHtml(quote.name)},</p><p>Thank you for considering Coco Palms Antigua.</p><p><strong>${escapeHtml(dates)}</strong><br>Adults: ${quote.adults}<br>Children aged 6–17: ${quote.childrenSixToSeventeen}<br>Children under 6: ${quote.childrenUnderSix}</p><table style="width:100%;border-collapse:collapse">${htmlLines}<tr><td style="padding:14px 0;font-size:18px">Quotation total</td><td style="padding:14px 0;text-align:right;font-size:18px"><strong>${money.format(quote.calculation.quotationTotal)}</strong></td></tr></table><p>Due to confirm: <strong>${money.format(quote.calculation.dueToConfirm)}</strong><br>Balance due: <strong>${money.format(quote.calculation.balanceDue)}</strong><br>Separate refundable security deposit: <strong>${money.format(quote.calculation.securityDeposit)}</strong></p><p><a href="${escapeHtml(link)}" style="display:inline-block;background:#0b4f7c;color:white;padding:12px 18px;text-decoration:none">View your quotation</a></p><p style="font-size:13px;color:#5e6872">This quotation does not reserve your dates.</p></div></div>`;
  return { subject, text, html };
}
