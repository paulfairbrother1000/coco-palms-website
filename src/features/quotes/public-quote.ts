import type { QuoteCalculation } from "./types";

export type PublicQuote = {
  token: string;
  reference: string;
  name: string;
  email: string;
  arrival: string;
  departure: string;
  adults: number;
  childrenSixToSeventeen: number;
  childrenUnderSix: number;
  createdAt: string;
  expiresAt: string;
  calculation: QuoteCalculation;
};

function number(value: unknown) { return Number(value ?? 0); }

export function quoteReference(token: string) {
  return token.slice(0, 8).toUpperCase();
}

export function mapDatabaseCalculation(value: Record<string, unknown>): QuoteCalculation {
  return {
    nights: number(value.nights),
    guests: number(value.party_size),
    levyGuests: number(value.levy_guests),
    accommodation: number(value.base_total),
    rateBreakdown: ((value.rate_breakdown as Array<Record<string, unknown>>) ?? []).map((line) => ({ period: String(line.period), nights: number(line.nights), rate: number(line.rate), total: number(line.total) })),
    longStayDiscount: number(value.long_stay_discount),
    secondaryDiscount: number(value.secondary_discount),
    secondaryDiscountType: (value.secondary_discount_type as QuoteCalculation["secondaryDiscountType"]) ?? null,
    discountedAccommodation: number(value.discounted_base),
    shortStayLevy: number(value.short_stay_levy),
    abst: number(value.abst_total),
    governmentLevy: number(value.levy_total),
    fees: number(value.fees_total),
    quotationTotal: number(value.quotation_total),
    securityDeposit: number(value.security_deposit),
    dueToConfirm: number(value.deposit_due),
    balanceDue: number(value.balance_due),
    balanceDueDaysBeforeArrival: 70,
    balanceDueDate: typeof value.balance_due_date === "string" ? value.balance_due_date : undefined,
  };
}

export function publicQuoteFromDatabase(value: Record<string, unknown>): PublicQuote {
  const token = String(value.token ?? value.public_token ?? "");
  const calculation = value.calculation as Record<string, unknown>;
  return {
    token,
    reference: quoteReference(token),
    name: String(value.name ?? value.contact_name ?? ""),
    email: String(value.email ?? value.contact_email ?? ""),
    arrival: String(value.arrival ?? value.start_date ?? ""),
    departure: String(value.departure ?? value.end_date ?? ""),
    adults: number(value.adults_count ?? calculation?.adults_count),
    childrenSixToSeventeen: number(value.children_6_17_count ?? calculation?.children_6_17_count),
    childrenUnderSix: number(value.under6_count ?? calculation?.under6_count),
    createdAt: String(value.created_at ?? new Date().toISOString()),
    expiresAt: String(value.expires_at ?? ""),
    calculation: mapDatabaseCalculation(calculation),
  };
}
