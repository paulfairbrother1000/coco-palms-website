import { format, parseISO } from "date-fns";
import type { PublicQuote } from "./public-quote";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] ?? character);
const utcDateTime = new Intl.DateTimeFormat("en-GB", {
  timeZone: "UTC",
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export function renderBookNowEmail(quote: PublicQuote, requestedAt: string) {
  const priceLines = [
    ...quote.calculation.rateBreakdown.map((line) => `${line.period}: ${line.nights} nights at ${money.format(line.rate)} = ${money.format(line.total)}`),
    ...(quote.calculation.longStayDiscount ? [`Long-stay discount: ${money.format(quote.calculation.longStayDiscount)}`] : []),
    ...(quote.calculation.shortStayLevy ? [`Four-night short-stay charge: ${money.format(quote.calculation.shortStayLevy)}`] : []),
    `ABST: ${money.format(quote.calculation.abst)}`,
    `Government levy: ${money.format(quote.calculation.governmentLevy)}`,
    `Administration fee (5%, including refundable security deposit): ${money.format(quote.calculation.fees)}`,
  ];
  const requested = `${utcDateTime.format(parseISO(requestedAt)).replace(" at ", " at ")} UTC`;
  const dates = `${format(parseISO(quote.arrival), "d MMMM yyyy")} to ${format(parseISO(quote.departure), "d MMMM yyyy")}`;
  const text = `BOOK NOW ENQUIRY\n\nSource: Website\nQuotation reference: ${quote.reference}\nRequested: ${requested}\n\nClient: ${quote.name} (${quote.email})\nStay: ${dates}\nNights: ${quote.calculation.nights}\nAdults: ${quote.adults}\nChildren aged 6–17: ${quote.childrenSixToSeventeen}\nChildren under 6: ${quote.childrenUnderSix}\n\n${priceLines.join("\n")}\nQuotation total: ${money.format(quote.calculation.quotationTotal)}\nDue to confirm: ${money.format(quote.calculation.dueToConfirm)}\nBalance: ${money.format(quote.calculation.balanceDue)}\nSeparate refundable security deposit: ${money.format(quote.calculation.securityDeposit)}\n\nThe customer has requested to proceed. No booking or date hold has been created. The dates are not secured until the required deposit has been paid.`;
  const html = `<div style="font-family:Avenir,Arial,sans-serif;color:#111;max-width:700px"><h1 style="color:#0b4f7c">Book Now enquiry</h1><p><strong>Source:</strong> Website<br><strong>Quotation:</strong> ${escapeHtml(quote.reference)}<br><strong>Requested:</strong> ${requested}</p><h2>Client</h2><p>${escapeHtml(quote.name)}<br><a href="mailto:${escapeHtml(quote.email)}">${escapeHtml(quote.email)}</a></p><h2>Stay</h2><p>${dates}<br>Nights: ${quote.calculation.nights}<br>Adults: ${quote.adults}<br>Children aged 6–17: ${quote.childrenSixToSeventeen}<br>Children under 6: ${quote.childrenUnderSix}</p><h2>Quotation</h2><pre style="font-family:Avenir,Arial,sans-serif;white-space:pre-wrap">${priceLines.map(escapeHtml).join("\n")}</pre><p><strong>Quotation total: ${money.format(quote.calculation.quotationTotal)}</strong><br>Due to confirm: ${money.format(quote.calculation.dueToConfirm)}<br>Balance: ${money.format(quote.calculation.balanceDue)}<br>Separate refundable security deposit: ${money.format(quote.calculation.securityDeposit)}</p><p>The customer has requested to proceed. No booking or date hold has been created. The dates are not secured until the required deposit has been paid.</p></div>`;
  return { to: "hello@cocopalms-antigua.com", replyTo: quote.email, subject: `Book Now enquiry ${quote.reference} from ${quote.name}`, text, html };
}
