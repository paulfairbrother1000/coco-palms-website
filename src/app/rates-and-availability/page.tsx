import { Suspense } from "react";
import { QuoteForm } from "@/features/quotes/quote-form";
import { PublishedRatesCard } from "@/features/quotes/published-rates-card";

export const metadata = { title: "Rates & Availability" };

export default function RatesAndAvailabilityPage() {
  return (
    <>
      <section className="page-hero">
        <h1>Rates &amp; Availability</h1>
      </section>
      <section className="section quotation-page">
        <div className="quotation-overview">
          <div className="quotation-intro">
            <h2>Plan your water front stay</h2>
            <p>Select available arrival and departure dates to begin your quotation.</p>
            <p>A 50% deposit confirms your stay and the balance is due ten weeks before arrival.</p>
            <p>Rates are in US Dollars (USD).</p>
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
