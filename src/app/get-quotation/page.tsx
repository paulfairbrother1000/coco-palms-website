import { Suspense } from "react";
import { QuoteForm } from "@/features/quotes/quote-form";
import { PublishedRatesCard } from "@/features/quotes/published-rates-card";

export const metadata = { title: "Get Quotation" };

export default function GetQuotationPage() {
  return <><section className="page-hero"><span className="eyebrow">Plan your stay</span><h1>Get Quotation</h1><p>Select available dates and enter your party details for an immediate, itemised quotation.</p></section><section className="section quotation-page"><div className="quotation-overview"><div className="quotation-intro"><span className="eyebrow">Coco Palms Antigua</span><h2>Your waterfront stay</h2><p>Rates are in USD. A 50% payment confirms your stay and the balance is due ten weeks before arrival.</p><PublishedRatesCard /></div></div><Suspense fallback={<p>Loading quotation calendar…</p>}><QuoteForm /></Suspense></section></>;
}
