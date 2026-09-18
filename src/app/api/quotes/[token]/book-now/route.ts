import { NextResponse } from "next/server";
import { renderBookNowEmail } from "@/features/quotes/book-now-email";
import { publicQuoteFromDatabase, type PublicQuote } from "@/features/quotes/public-quote";
import { sendEmail } from "@/lib/email/resend";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

type Acceptance =
  | { outcome: "not_found" }
  | { outcome: "expired" }
  | {
      outcome: "accepted";
      quoteId: string;
      requestedAt: string;
      notificationSent: boolean;
    };

type Dependencies = {
  acceptQuote(token: string): Promise<Acceptance>;
  getQuote(quoteId: string): Promise<PublicQuote | null>;
  sendNotification(
    quote: PublicQuote,
    requestedAt: string,
    idempotencyKey: string,
  ): Promise<void>;
  markNotificationSent(quoteId: string): Promise<void>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function acceptanceFromRpc(value: unknown): Acceptance {
  if (!isRecord(value)) throw new Error("Invalid quote acceptance response.");

  if (value.outcome === "not_found") return { outcome: "not_found" };
  if (value.outcome === "expired") return { outcome: "expired" };
  if (
    value.outcome === "accepted" &&
    typeof value.quote_id === "string" &&
    typeof value.requested_at === "string" &&
    typeof value.notification_sent === "boolean"
  ) {
    return {
      outcome: "accepted",
      quoteId: value.quote_id,
      requestedAt: value.requested_at,
      notificationSent: value.notification_sent,
    };
  }

  throw new Error("Invalid quote acceptance response.");
}

function defaultDependencies(): Dependencies {
  return {
    async acceptQuote(token) {
      const { data, error } = await createAdminSupabaseClient().rpc(
        "accept_website_quote",
        { p_token: token },
      );
      if (error) throw error;
      return acceptanceFromRpc(data);
    },
    async getQuote(quoteId) {
      const { data, error } = await createAdminSupabaseClient()
        .from("quotes")
        .select(
          "public_token,contact_name,contact_email,start_date,end_date,adults_count,children_6_17_count,under6_count,created_at,expires_at,breakdown",
        )
        .eq("id", quoteId)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return publicQuoteFromDatabase({
        public_token: data.public_token,
        contact_name: data.contact_name,
        contact_email: data.contact_email,
        start_date: data.start_date,
        end_date: data.end_date,
        adults_count: data.adults_count,
        children_6_17_count: data.children_6_17_count,
        under6_count: data.under6_count,
        created_at: data.created_at,
        expires_at: data.expires_at,
        calculation: data.breakdown,
      });
    },
    async sendNotification(quote, requestedAt, idempotencyKey) {
      await sendEmail(renderBookNowEmail(quote, requestedAt), { idempotencyKey });
    },
    async markNotificationSent(quoteId) {
      const { error } = await createAdminSupabaseClient().rpc(
        "mark_website_booking_request_notified",
        { p_quote_id: quoteId },
      );
      if (error) throw error;
    },
  };
}

export function createBookNowPostHandler(dependencies: Dependencies) {
  return async function POST(
    _request: Request,
    context: { params: Promise<{ token: string }> },
  ) {
    const { token } = await context.params;
    let acceptance: Acceptance;
    try {
      acceptance = await dependencies.acceptQuote(token);
    } catch {
      return NextResponse.json(
        { error: "Your request could not be sent. Please try again." },
        { status: 503 },
      );
    }

    if (acceptance.outcome === "not_found") {
      return NextResponse.json({ error: "Quotation not found." }, { status: 404 });
    }
    if (acceptance.outcome === "expired") {
      return NextResponse.json(
        { error: "This quotation has expired. Please request a new quotation." },
        { status: 410 },
      );
    }
    if (acceptance.notificationSent) {
      return NextResponse.json({ ok: true, alreadySent: true });
    }

    try {
      const quote = await dependencies.getQuote(acceptance.quoteId);
      if (!quote) {
        return NextResponse.json({ error: "Quotation not found." }, { status: 404 });
      }

      await dependencies.sendNotification(
        quote,
        acceptance.requestedAt,
        `coco-palms-booking-request-${acceptance.quoteId}`,
      );
      await dependencies.markNotificationSent(acceptance.quoteId);
      return NextResponse.json({ ok: true, alreadySent: false });
    } catch {
      return NextResponse.json(
        {
          error:
            "Your request was recorded, but the notification could not be sent. Please try again.",
          recorded: true,
        },
        { status: 503 },
      );
    }
  };
}

export const POST = createBookNowPostHandler(defaultDependencies());
