import { describe, expect, it } from "vitest";
import { renderBookNowEmail } from "./book-now-email";
import type { PublicQuote } from "./public-quote";

const quote = {
  token: "public-token-1234", reference: "PUBLIC-T", name: "Paul Fairbrother", email: "paul@example.com",
  arrival: "2027-06-01", departure: "2027-06-08", adults: 2, childrenSixToSeventeen: 1, childrenUnderSix: 1,
  createdAt: "2026-09-17T12:00:00Z", expiresAt: "2026-09-20T12:00:00Z",
  calculation: { nights: 7, guests: 4, levyGuests: 3, accommodation: 7000, rateBreakdown: [{ period: "15th May to 15th Nov", nights: 7, rate: 1000, total: 7000 }], longStayDiscount: 0, secondaryDiscount: 0, secondaryDiscountType: null, discountedAccommodation: 7000, shortStayLevy: 0, abst: 1190, governmentLevy: 105, fees: 514.75, quotationTotal: 8809.75, securityDeposit: 2000, dueToConfirm: 4404.88, balanceDue: 4404.87, balanceDueDaysBeforeArrival: 70, balanceDueDate: "2027-03-23" },
} satisfies PublicQuote;

describe("renderBookNowEmail", () => {
  it("identifies the website source and includes the client and complete quotation", () => {
    const email = renderBookNowEmail(quote, "2026-09-17T14:00:00Z");
    expect(email.to).toBe("hello@cocopalms-antigua.com");
    expect(email.subject).toContain("Book Now");
    expect(email.text).toContain("Source: Website");
    expect(email.text).toContain("Paul Fairbrother (paul@example.com)");
    expect(email.text).toContain("Adults: 2");
    expect(email.text).toContain("Children aged 6–17: 1");
    expect(email.text).toContain("Quotation total: $8,809.75");
    expect(email.text).toContain("Administration fee (5%, including refundable security deposit)");
    expect(email.text).toContain("Requested: 17 September 2026 at 14:00 UTC");
  });

  it("escapes customer-controlled values in the HTML email", () => {
    const email = renderBookNowEmail({ ...quote, name: "<script>alert(1)</script>" }, "2026-09-17T14:00:00Z");
    expect(email.html).not.toContain("<script>");
    expect(email.html).toContain("&lt;script&gt;");
  });
});
