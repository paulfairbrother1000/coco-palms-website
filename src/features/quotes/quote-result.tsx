"use client";

import type { QuoteCalculation, QuoteConfirmationDetails } from "./types";
import { BookNowButton } from "./book-now-button";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function QuoteResult({
  calculation: quote,
  publicToken,
  emailSent,
  confirmation,
  disabled,
}: {
  calculation: QuoteCalculation;
  publicToken?: string;
  emailSent?: boolean;
  confirmation?: QuoteConfirmationDetails;
  disabled?: boolean;
}) {
  return <section className="quote-result" aria-live="polite">
    <div className="quote-result-head"><div><span className="eyebrow">Your quotation</span><h2>{money.format(quote.quotationTotal)}</h2></div><span className="availability-pill">Dates available</span></div>
    <p>{quote.nights} nights for {quote.guests} {quote.guests === 1 ? "guest" : "guests"}</p>
    <div className="quote-lines">
      {quote.rateBreakdown.map((line) => <div key={line.period}><span>{line.nights} {line.nights === 1 ? "night" : "nights"} × {money.format(line.rate)} — {line.period}</span><strong>{money.format(line.total)}</strong></div>)}
      {quote.longStayDiscount !== 0 && <div><span>Long-stay discount</span><strong>{money.format(quote.longStayDiscount)}</strong></div>}
      {quote.shortStayLevy !== 0 && <div><span>Four-night short-stay charge</span><strong>{money.format(quote.shortStayLevy)}</strong></div>}
      <div><span>ABST — 17% of accommodation and applicable charges</span><strong>{money.format(quote.abst)}</strong></div>
      <div><span>Government levy — {quote.levyGuests} guests aged 6+ × {quote.nights} nights × $5</span><strong>{money.format(quote.governmentLevy)}</strong></div>
      <div><span>Administration fee — 5% including the refundable $2,000 security deposit</span><strong>{money.format(quote.fees)}</strong></div>
    </div>
    <div className="quote-total"><span>Quotation total</span><strong>{money.format(quote.quotationTotal)}</strong></div>
    <div className="payment-summary"><p><span>Due on booking</span><strong>{money.format(quote.dueToConfirm)}</strong></p><p><span>Balance due 10 weeks before arrival</span><strong>{money.format(quote.balanceDue)}</strong></p><p><span>Separate refundable security deposit</span><strong>{money.format(quote.securityDeposit)}</strong></p></div>
    {emailSent === true && <p className="form-note">A copy has been emailed to you.</p>}
    {emailSent === false && publicToken && <p className="form-note">Your quotation is saved, but the email could not be sent. Keep this page open while we resolve it.</p>}
    {emailSent === false && !publicToken && <p className="form-note">Your quotation is displayed here, but the email could not be sent. Please keep this page open and contact us if you need a copy.</p>}
    <p className="form-note">This quotation does not reserve the dates. Selecting Book Now sends an enquiry to Coco Palms.</p>
    <BookNowButton token={publicToken} details={confirmation} disabled={disabled} />
  </section>;
}
