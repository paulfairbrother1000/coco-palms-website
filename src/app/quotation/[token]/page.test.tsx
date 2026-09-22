import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import QuotationPage from "./page";

const rpc = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/public", () => ({
  createPublicSupabaseClient: () => ({ rpc }),
}));

vi.mock("next/navigation", () => ({ notFound: vi.fn() }));

const databaseQuote = {
  token: "quote-token",
  name: "Paul Fairbrother",
  email: "paul@example.com",
  arrival: "2027-06-01",
  departure: "2027-06-08",
  adults_count: 2,
  children_6_17_count: 1,
  under6_count: 0,
  created_at: "2026-09-18T12:00:00Z",
  expires_at: "2100-09-20T12:00:00Z",
  calculation: {
    nights: 7,
    party_size: 3,
    levy_guests: 3,
    base_total: 7000,
    rate_breakdown: [{ period: "15th May to 15th Nov", nights: 7, rate: 1000, total: 7000 }],
    long_stay_discount: 0,
    secondary_discount: 0,
    secondary_discount_type: null,
    discounted_base: 7000,
    short_stay_levy: 0,
    abst_total: 1190,
    levy_total: 105,
    fees_total: 514.75,
    quotation_total: 8809.75,
    security_deposit: 2000,
    deposit_due: 4404.875,
    balance_due: 4404.875,
  },
};

describe("QuotationPage", () => {
  beforeEach(() => rpc.mockReset());

  it("enables booking confirmation for a valid public quotation", async () => {
    rpc.mockResolvedValue({ data: databaseQuote, error: null });

    render(await QuotationPage({ params: Promise.resolve({ token: "quote-token" }) }));

    expect(screen.getByRole("button", { name: "Book Now" })).toBeEnabled();
  });

  it("disables booking confirmation for an expired public quotation", async () => {
    rpc.mockResolvedValue({
      data: { ...databaseQuote, expires_at: "2000-09-20T12:00:00Z" },
      error: null,
    });

    render(await QuotationPage({ params: Promise.resolve({ token: "quote-token" }) }));

    expect(screen.getAllByText(/quotation has expired/i)).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Quotation expired" })).toBeDisabled();
    expect(screen.getByRole("link", { name: "Get a new quotation" })).toHaveAttribute("href", "/rates-and-availability");
  });
});
