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
  it("includes the stay, party, itemised price and secure return link", () => {
    const email = renderQuotationEmail(quote, "https://preview.example.com");

    expect(email.subject).toContain("PUBLIC-T");
    expect(email.text).toContain("Paul Fairbrother");
    expect(email.text).toContain("1 June 2027 to 8 June 2027");
    expect(email.text).toContain("Adults: 2");
    expect(email.text).toContain("Children aged 6–17: 1");
    expect(email.text).toContain("Children under 6: 1");
    expect(email.text).toContain("Quotation total: $8,809.75");
    expect(email.text).toContain("Refundable security deposit: $2,000.00");
    expect(email.text).toContain("Administration fee (5%, including refundable security deposit)");
    expect(email.text).toContain("https://preview.example.com/quotation/public-token-1234");
    expect(email.html).toContain("15th May to 15th Nov");
  });
});
