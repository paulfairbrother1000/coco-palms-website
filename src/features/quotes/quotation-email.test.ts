import { describe, expect, it } from "vitest";
import { renderQuotationEmail } from "./quotation-email";
import type { PublicQuote } from "./public-quote";

const quote: PublicQuote = {
  token: "public-token-1234",
  reference: "PUBLIC-T",
  name: "Paul Fairbrother",
  email: "paul@example.com",
  arrival: "2027-06-01",
  departure: "2027-06-08",
  adults: 2,
  childrenSixToSeventeen: 1,
  childrenUnderSix: 1,
  createdAt: "2026-09-17T12:00:00Z",
  expiresAt: "2026-09-20T12:00:00Z",
  calculation: {
    nights: 7,
    guests: 4,
    levyGuests: 3,
    accommodation: 7000,
    rateBreakdown: [{ period: "15th May to 15th Nov", nights: 7, rate: 1000, total: 7000 }],
    longStayDiscount: 0,
    secondaryDiscount: 0,
    secondaryDiscountType: null,
    discountedAccommodation: 7000,
    shortStayLevy: 0,
    abst: 1190,
    governmentLevy: 105,
    fees: 514.75,
    quotationTotal: 8809.75,
    securityDeposit: 2000,
    dueToConfirm: 4404.88,
    balanceDue: 4404.87,
    balanceDueDaysBeforeArrival: 70,
    balanceDueDate: "2027-03-23",
  },
};

describe("renderQuotationEmail", () => {
  it("uses the requested copy and includes the website quotation breakdown", () => {
    const email = renderQuotationEmail(quote, "https://preview.example.com");

    expect(email.subject).toBe("Coco Palms Enquiry");
    expect(email.text).toContain("Dear Paul,");
    expect(email.text).toContain("Thank you for your interest in Coco Palms.");
    expect(email.text).toContain("available for 7 nights between 1 June 2027 and 8 June 2027");
    expect(email.text).toContain("$8,809.75 USD for 2 adults, 1 child aged 6 or over and 1 child under 6");
    expect(email.text).toContain("refundable deposit of $2,000.00 USD is also required");
    expect(email.text).toContain("7 nights × $1,000.00 — 15th May to 15th Nov: $7,000.00");
    expect(email.text).toContain("Government levy — 3 guests aged 6+ × 7 nights × $5: $105.00");
    expect(email.text).toContain("Quotation total: $8,809.75");
    expect(email.text).toContain("Due on booking: $4,404.88");
    expect(email.text).toContain("Balance due 10 weeks before arrival: $4,404.87");
    expect(email.html).toContain("<strong>$8,809.75 USD</strong>");
    expect(email.html).toContain("<strong>$1,000.00</strong>");
    expect(email.html).toContain("<strong>$7,000.00</strong>");
    expect(email.html).toContain("Regards<br>Coco Palms Team");
  });

  it("omits party groups with a zero count", () => {
    const email = renderQuotationEmail({
      ...quote,
      adults: 6,
      childrenSixToSeventeen: 0,
      childrenUnderSix: 0,
      calculation: { ...quote.calculation, guests: 6, levyGuests: 6 },
    }, "https://preview.example.com");

    expect(email.text).toContain("for 6 adults.");
    expect(email.text).not.toContain("child");
  });

  it("includes only the non-zero child band", () => {
    const email = renderQuotationEmail({
      ...quote,
      adults: 4,
      childrenSixToSeventeen: 0,
      childrenUnderSix: 2,
      calculation: { ...quote.calculation, guests: 6, levyGuests: 4 },
    }, "https://preview.example.com");

    expect(email.text).toContain("for 4 adults and 2 children under 6.");
    expect(email.text).not.toContain("aged 6 or over");
  });
});
