import { NextResponse } from "next/server";
import { calculateQuote, validateQuoteRequest } from "@/features/quotes/calculate-quote";
import { COCO_PALMS_ICAL_URL, loadUnavailableRanges } from "@/features/availability/load-unavailable-ranges";
import { mapDatabaseCalculation, quoteReference, type PublicQuote } from "@/features/quotes/public-quote";
import { quoteRequestSchema, type QuoteRequest } from "@/features/quotes/quote-schema";
import { createQuotationEmailMessage, type QuotationEmailQuote } from "@/features/quotes/quotation-email";
import { quoteExpiryDate } from "@/features/quotes/quote-validity";
import { sendEmail } from "@/lib/email/resend";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createPublicSupabaseClient } from "@/lib/supabase/public";

type UnavailableRange = { start_date: string; end_date: string };
type StoredQuote = { public_token: string; calculation: Record<string, unknown> };

type Dependencies = {
  getUnavailableRanges: (start: string, end: string) => Promise<UnavailableRange[]>;
  createWebsiteQuote: (value: { arrival: string; departure: string; partySize: number; adults: number; childrenSixToSeventeen: number; underSixCount: number; contactEmail: string; contactName: string }) => Promise<StoredQuote | null>;
  sendCustomerQuote?: (quote: QuotationEmailQuote) => Promise<void>;
  now?: () => Date;
};

function defaultDependencies(): Dependencies {
  return {
    async getUnavailableRanges(start, end) {
      return loadUnavailableRanges({
        start,
        end,
        async fetchIcs() {
          const response = await fetch(process.env.GOOGLE_CALENDAR_ICAL_URL ?? COCO_PALMS_ICAL_URL, { cache: "no-store" });
          if (!response.ok) throw new Error("Google Calendar could not be loaded.");
          return response.text();
        },
        async getDatabaseRanges() {
          const { data, error } = await createPublicSupabaseClient().rpc("get_unavailable_ranges", { p_start: start, p_end: end });
          if (error) throw error;
          return data ?? [];
        },
      });
    },
    async createWebsiteQuote(value) {
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
      const { data, error } = await createAdminSupabaseClient().rpc("create_website_quote_v2", {
        p_property_slug: "coco-palms",
        p_start_date: value.arrival,
        p_end_date: value.departure,
        p_adults_count: value.adults,
        p_children_6_17_count: value.childrenSixToSeventeen,
        p_under6_count: value.underSixCount,
        p_contact_email: value.contactEmail,
        p_contact_name: value.contactName,
      });
      if (error) throw error;
      return data as StoredQuote;
    },
    async sendCustomerQuote(quote) {
      const deploymentHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? (deploymentHost ? `https://${deploymentHost}` : "https://coco-palms-dev-site.vercel.app");
      await sendEmail(createQuotationEmailMessage(quote, siteUrl));
    },
  };
}

export function createQuotePostHandler(dependencies: Dependencies) {
  return async function POST(request: Request) {
    const parsed = quoteRequestSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Please check your details." }, { status: 400 });
    const value: QuoteRequest = parsed.data;
    const now = dependencies.now?.() ?? new Date();
    const validationError = validateQuoteRequest(value, now);
    if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

    try {
      const ranges = await dependencies.getUnavailableRanges(value.arrival, value.departure);
      if (ranges.some((range) => range.start_date < value.departure && range.end_date > value.arrival)) return NextResponse.json({ error: "Coco Palms is not available for those dates." }, { status: 409 });
      const localCalculation = calculateQuote({ arrival: value.arrival, departure: value.departure, adults: value.adults, childrenSixToSeventeen: value.childrenSixToSeventeen, childrenUnderSix: value.childrenUnderSix }, now);
      let stored: StoredQuote | null = null;
      try {
        stored = await dependencies.createWebsiteQuote({ arrival: value.arrival, departure: value.departure, partySize: value.adults + value.childrenSixToSeventeen + value.childrenUnderSix, adults: value.adults, childrenSixToSeventeen: value.childrenSixToSeventeen, underSixCount: value.childrenUnderSix, contactEmail: value.email, contactName: value.name });
      } catch {
        stored = null;
      }
      if (!stored) {
        const quote: QuotationEmailQuote = { name: value.name, email: value.email, arrival: value.arrival, departure: value.departure, adults: value.adults, childrenSixToSeventeen: value.childrenSixToSeventeen, childrenUnderSix: value.childrenUnderSix, calculation: localCalculation };
        let emailSent = false;
        try { await dependencies.sendCustomerQuote?.(quote); emailSent = Boolean(dependencies.sendCustomerQuote); } catch { emailSent = false; }
        return NextResponse.json({
          calculation: localCalculation,
          emailSent,
        });
      }
      const calculation = mapDatabaseCalculation(stored.calculation);
      const quote: PublicQuote = { token: stored.public_token, reference: quoteReference(stored.public_token), name: value.name, email: value.email, arrival: value.arrival, departure: value.departure, adults: value.adults, childrenSixToSeventeen: value.childrenSixToSeventeen, childrenUnderSix: value.childrenUnderSix, createdAt: now.toISOString(), expiresAt: quoteExpiryDate(now).toISOString(), calculation };
      let emailSent = false;
      try { await dependencies.sendCustomerQuote?.(quote); emailSent = Boolean(dependencies.sendCustomerQuote); } catch { emailSent = false; }
      return NextResponse.json({ publicToken: stored.public_token, calculation, emailSent }, { status: 201 });
    } catch {
      return NextResponse.json({ error: "Quotation service is temporarily unavailable." }, { status: 503 });
    }
  };
}

export const POST = createQuotePostHandler(defaultDependencies());
