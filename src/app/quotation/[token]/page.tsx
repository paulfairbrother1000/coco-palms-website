import { format, parseISO } from "date-fns";
import { notFound } from "next/navigation";
import { publicQuoteFromDatabase } from "@/features/quotes/public-quote";
import { QuoteResult } from "@/features/quotes/quote-result";
import { createPublicSupabaseClient } from "@/lib/supabase/public";

export default async function QuotationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { data, error } = await createPublicSupabaseClient().rpc("get_public_quote", { p_token: token });
  if (error || !data) notFound();
  const quote = publicQuoteFromDatabase(data as Record<string, unknown>);
  const expired = quote.expiresAt ? new Date(quote.expiresAt).getTime() < Date.now() : false;

  return <>
    <section className="page-hero"><span className="eyebrow">Personal quotation {quote.reference}</span><h1>Your Coco Palms stay</h1><p>{format(parseISO(quote.arrival), "d MMMM yyyy")} to {format(parseISO(quote.departure), "d MMMM yyyy")} · {quote.calculation.nights} nights · {quote.calculation.guests} guests</p></section>
    <section className="section quotation-layout">
      <article><span className="eyebrow">Prepared for</span><h2>{quote.name}</h2>{expired && <p className="form-error">This quotation has expired. Prices and availability must be checked again before proceeding.</p>}<p>Your quotation remains available at this secure link. Dates remain available to other guests until Coco Palms confirms the stay.</p></article>
      <QuoteResult calculation={quote.calculation} publicToken={quote.token} />
    </section>
  </>;
}
