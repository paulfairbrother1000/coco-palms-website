import { Suspense } from "react";
import { QuoteForm } from "@/features/quotes/quote-form";
import { PublishedRatesCard } from "@/features/quotes/published-rates-card";

export const metadata = { title: "Rates & Availability" };

export default function RatesAndAvailabilityPage() {
  return (
    <>
      <section className="page-hero">
        <span className="eyebrow">Plan with confidence</span>
        <h1>Rates &amp; Availability</h1>
        <p>Select available arrival and departure dates to begin your quotation.</p>
      </section>
      <section className="section quotation-page">
        <div className="quotation-overview">
          <div className="quotation-intro">
            <span className="eyebrow">Coco Palms Antigua</span>
            <h2>Plan your waterfront stay</h2>
            <p>Rates are in USD.</p>
            <p>A 50% deposit confirms your stay and the balance is due ten weeks before arrival.</p>
            <PublishedRatesCard />
          </div>
        </div>
        <Suspense fallback={<p>Loading availability and quotation calendar…</p>}>
          <QuoteForm />
        </Suspense>
      </section>
    </>
  );
}
