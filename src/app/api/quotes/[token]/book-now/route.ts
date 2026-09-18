import { NextResponse } from "next/server";
import { renderBookNowEmail } from "@/features/quotes/book-now-email";
import { publicQuoteFromDatabase, type PublicQuote } from "@/features/quotes/public-quote";
import { sendEmail } from "@/lib/email/resend";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

type Dependencies = {
  getQuote: (token: string) => Promise<{ id: string; quote: PublicQuote } | null>;
  hasRecentRequest: (quoteId: string) => Promise<boolean>;
  sendNotification: (quote: PublicQuote, requestedAt: string) => Promise<void>;
  recordRequest: (quoteId: string, payload: Record<string, unknown>) => Promise<void>;
};

function defaultDependencies(): Dependencies {
  return {
    async getQuote(token) {
      const { data, error } = await createAdminSupabaseClient().from("quotes").select("id,public_token,contact_name,contact_email,start_date,end_date,adults_count,children_6_17_count,under6_count,created_at,expires_at,breakdown").eq("public_token", token).maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return { id: data.id, quote: publicQuoteFromDatabase({ ...data, token: data.public_token, name: data.contact_name, email: data.contact_email, arrival: data.start_date, departure: data.end_date, calculation: data.breakdown }) };
    },
    async hasRecentRequest(quoteId) {
      const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();
      const { data, error } = await createAdminSupabaseClient().from("quote_events").select("id").eq("quote_id", quoteId).eq("event_type", "book_now_requested").gte("created_at", since).limit(1);
      if (error) throw error;
      return Boolean(data?.length);
    },
    async sendNotification(quote, requestedAt) { await sendEmail(renderBookNowEmail(quote, requestedAt)); },
    async recordRequest(quoteId, payload) {
      const { error } = await createAdminSupabaseClient().from("quote_events").insert({ quote_id: quoteId, event_type: "book_now_requested", event_payload: payload });
      if (error) throw error;
    },
  };
}

export function createBookNowPostHandler(dependencies: Dependencies) {
  return async function POST(_request: Request, context: { params: Promise<{ token: string }> }) {
    try {
      const { token } = await context.params;
      const stored = await dependencies.getQuote(token);
      if (!stored) return NextResponse.json({ error: "Quotation not found." }, { status: 404 });
      if (await dependencies.hasRecentRequest(stored.id)) return NextResponse.json({ ok: true, alreadySent: true });
      const requestedAt = new Date().toISOString();
      await dependencies.sendNotification(stored.quote, requestedAt);
      await dependencies.recordRequest(stored.id, { source: "website", requested_at: requestedAt, contact_email: stored.quote.email });
      return NextResponse.json({ ok: true, alreadySent: false });
    } catch {
      return NextResponse.json({ error: "Your enquiry could not be sent." }, { status: 503 });
    }
  };
}

export const POST = createBookNowPostHandler(defaultDependencies());
