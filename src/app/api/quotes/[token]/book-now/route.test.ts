import { describe, expect, it, vi } from "vitest";
import { createBookNowPostHandler } from "./route";

const quote = { token: "token", reference: "TOKEN", name: "Paul", email: "paul@example.com", arrival: "2027-06-01", departure: "2027-06-08", adults: 2, childrenSixToSeventeen: 0, childrenUnderSix: 0, createdAt: "2026-09-17T12:00:00Z", expiresAt: "2026-09-20T12:00:00Z", calculation: { nights: 7, guests: 2, levyGuests: 2, accommodation: 7000, rateBreakdown: [], longStayDiscount: 0, secondaryDiscount: 0, secondaryDiscountType: null, discountedAccommodation: 7000, shortStayLevy: 0, abst: 1190, governmentLevy: 70, fees: 513, quotationTotal: 8773, securityDeposit: 2000, dueToConfirm: 4386.5, balanceDue: 4386.5, balanceDueDaysBeforeArrival: 70 } };

describe("POST /api/quotes/[token]/book-now", () => {
  it("sends the owner notification and records the request", async () => {
    const sendNotification = vi.fn();
    const recordRequest = vi.fn();
    const handler = createBookNowPostHandler({ getQuote: vi.fn().mockResolvedValue({ id: "quote-id", quote }), hasRecentRequest: vi.fn().mockResolvedValue(false), sendNotification, recordRequest });
    const response = await handler(new Request("http://localhost"), { params: Promise.resolve({ token: "token" }) });
    expect(response.status).toBe(200);
    expect(sendNotification).toHaveBeenCalledWith(quote, expect.any(String));
    expect(recordRequest).toHaveBeenCalledWith("quote-id", expect.objectContaining({ source: "website" }));
  });

  it("does not send a duplicate notification inside the protection window", async () => {
    const sendNotification = vi.fn();
    const handler = createBookNowPostHandler({ getQuote: vi.fn().mockResolvedValue({ id: "quote-id", quote }), hasRecentRequest: vi.fn().mockResolvedValue(true), sendNotification, recordRequest: vi.fn() });
    const response = await handler(new Request("http://localhost"), { params: Promise.resolve({ token: "token" }) });
    expect(response.status).toBe(200);
    expect(sendNotification).not.toHaveBeenCalled();
    expect(await response.json()).toEqual({ ok: true, alreadySent: true });
  });
});
