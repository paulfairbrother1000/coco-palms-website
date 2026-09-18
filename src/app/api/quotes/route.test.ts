import { describe, expect, it, vi } from "vitest";
import { createQuotePostHandler } from "./route";

const validBody = {
  name: "Paul Fairbrother",
  email: "paul@example.com",
  arrival: "2027-06-01",
  departure: "2027-06-08",
  adults: 2,
  childrenSixToSeventeen: 0,
  childrenUnderSix: 0,
};

const databaseCalculation = {
  nights: 7,
  party_size: 2,
  levy_guests: 2,
  base_total: 8400,
  rate_breakdown: [{ period: "15th May to 15th Nov", nights: 7, rate: 1200, total: 8400 }],
  long_stay_discount: 0,
  secondary_discount: 0,
  secondary_discount_type: null,
  discounted_base: 8400,
  short_stay_levy: 0,
  abst_total: 1428,
  levy_total: 70,
  fees_total: 594.9,
  quotation_total: 10492.9,
  security_deposit: 2000,
  deposit_due: 5246.45,
  balance_due: 5246.45,
  balance_due_date: "2027-03-23",
};

function request(body: unknown) {
  return new Request("http://localhost/api/quotes", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
}

describe("POST /api/quotes", () => {
  it("rejects a party larger than eight before calling Supabase", async () => {
    const createWebsiteQuote = vi.fn();
    const handler = createQuotePostHandler({ getUnavailableRanges: vi.fn(), createWebsiteQuote });
    const response = await handler(request({ ...validBody, adults: 7, childrenUnderSix: 2 }));

    expect(response.status).toBe(400);
    expect(createWebsiteQuote).not.toHaveBeenCalled();
  });

  it("rejects dates that became unavailable", async () => {
    const handler = createQuotePostHandler({
      getUnavailableRanges: vi.fn().mockResolvedValue([{ start_date: "2027-06-04", end_date: "2027-06-10" }]),
      createWebsiteQuote: vi.fn(),
    });
    const response = await handler(request(validBody));

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "Coco Palms is not available for those dates." });
  });

  it("saves a quotation and returns only its public result", async () => {
    const createWebsiteQuote = vi.fn().mockResolvedValue({ public_token: "public-token", calculation: databaseCalculation });
    const handler = createQuotePostHandler({ getUnavailableRanges: vi.fn().mockResolvedValue([]), createWebsiteQuote });
    const response = await handler(request(validBody));
    const result = await response.json();

    expect(response.status).toBe(201);
    expect(createWebsiteQuote).toHaveBeenCalledWith(expect.objectContaining({ partySize: 2, underSixCount: 0, contactEmail: "paul@example.com" }));
    expect(result.publicToken).toBe("public-token");
    expect(result.calculation.quotationTotal).toBe(10492.9);
    expect(result.calculation.rateBreakdown).toHaveLength(1);
    expect(result.quote_id).toBeUndefined();
  });

  it("emails and displays the calculated quotation when persistence errors", async () => {
    const sendCustomerQuote = vi.fn().mockResolvedValue(undefined);
    const handler = createQuotePostHandler({
      getUnavailableRanges: vi.fn().mockResolvedValue([]),
      createWebsiteQuote: vi.fn().mockRejectedValue(new Error("SUPABASE_SERVICE_ROLE_KEY missing")),
      sendCustomerQuote,
    });
    const response = await handler(request(validBody));
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.emailSent).toBe(true);
    expect(result.calculation.quotationTotal).toBe(10492.9);
    expect(sendCustomerQuote).toHaveBeenCalledOnce();
  });

  it("emails and returns an immediate calculator quotation when persistence is not configured", async () => {
    const sendCustomerQuote = vi.fn().mockResolvedValue(undefined);
    const handler = createQuotePostHandler({
      getUnavailableRanges: vi.fn().mockResolvedValue([]),
      createWebsiteQuote: vi.fn().mockResolvedValue(null),
      sendCustomerQuote,
    });
    const response = await handler(request(validBody));
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.publicToken).toBeUndefined();
    expect(result.emailSent).toBe(true);
    expect(result.calculation.quotationTotal).toBe(10492.9);
    expect(result.calculation.fees).toBe(594.9);
    expect(sendCustomerQuote).toHaveBeenCalledWith(expect.objectContaining({
      name: "Paul Fairbrother",
      email: "paul@example.com",
      adults: 2,
      calculation: expect.objectContaining({ quotationTotal: 10492.9 }),
    }));
  });

  it("keeps the on-screen quotation when fallback email delivery fails", async () => {
    const handler = createQuotePostHandler({
      getUnavailableRanges: vi.fn().mockResolvedValue([]),
      createWebsiteQuote: vi.fn().mockResolvedValue(null),
      sendCustomerQuote: vi.fn().mockRejectedValue(new Error("delivery failed")),
    });
    const response = await handler(request(validBody));
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.emailSent).toBe(false);
    expect(result.calculation.quotationTotal).toBe(10492.9);
  });
});
