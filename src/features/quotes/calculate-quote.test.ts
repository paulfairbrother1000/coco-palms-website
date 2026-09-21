import { describe, expect, it } from "vitest";
import { calculateQuote, validateQuoteRequest } from "./calculate-quote";

describe("calculateQuote", () => {
  it("does not discount a quotation because the party has fewer than three guests", () => {
    const quote = calculateQuote({
      arrival: "2027-06-01",
      departure: "2027-06-08",
      adults: 2,
      childrenSixToSeventeen: 0,
      childrenUnderSix: 0,
    });

    expect(quote.secondaryDiscount).toBe(0);
    expect(quote.secondaryDiscountType).toBe(null);
    expect(quote.quotationTotal).toBe(10492.9);
  });

  it("returns itemised seasonal rates when a stay crosses a rate boundary", () => {
    const quote = calculateQuote({
      arrival: "2027-05-13",
      departure: "2027-05-18",
      adults: 4,
      childrenSixToSeventeen: 0,
      childrenUnderSix: 0,
    });

    expect(quote.rateBreakdown).toEqual([
      { period: "4th Jan to 14th May", nights: 2, rate: 1250, total: 2500 },
      { period: "15th May to 15th Nov", nights: 3, rate: 1200, total: 3600 },
    ]);
  });

  it("segments nights across the published seasonal rates", () => {
    const quote = calculateQuote({
      arrival: "2027-05-13",
      departure: "2027-05-18",
      adults: 4,
      childrenSixToSeventeen: 0,
      childrenUnderSix: 0,
    });
    expect(quote.nights).toBe(5);
    expect(quote.accommodation).toBe(6100);
  });

  it("does not charge the government levy for children under six", () => {
    const quote = calculateQuote({
      arrival: "2027-06-01",
      departure: "2027-06-06",
      adults: 2,
      childrenSixToSeventeen: 1,
      childrenUnderSix: 2,
    });
    expect(quote.guests).toBe(5);
    expect(quote.levyGuests).toBe(3);
    expect(quote.governmentLevy).toBe(75);
  });

  it("matches the calculator fee basis while keeping security separate", () => {
    const quote = calculateQuote({
      arrival: "2027-06-01",
      departure: "2027-06-08",
      adults: 4,
      childrenSixToSeventeen: 0,
      childrenUnderSix: 0,
    });
    expect(quote.discountedAccommodation).toBe(8400);
    expect(quote.abst).toBe(1428);
    expect(quote.governmentLevy).toBe(140);
    expect(quote.fees).toBe(598.4);
    expect(quote.quotationTotal).toBe(10566.4);
    expect(quote.securityDeposit).toBe(2000);
  });

  it("discounts only nights after the first fourteen and applies one secondary discount", () => {
    const quote = calculateQuote({
      arrival: "2027-06-01",
      departure: "2027-06-21",
      adults: 2,
      childrenSixToSeventeen: 0,
      childrenUnderSix: 0,
      secondaryDiscounts: ["four-week", "two-week", "single-occupancy"],
    });
    expect(quote.longStayDiscount).toBe(-1440);
    expect(quote.secondaryDiscountType).toBe("two-week");
    expect(quote.secondaryDiscount).toBe(-4512);
  });
});

describe("validateQuoteRequest", () => {
  it("counts under-six children toward the eight-person occupancy limit", () => {
    expect(validateQuoteRequest({ arrival: "2027-06-01", departure: "2027-06-06", adults: 6, childrenSixToSeventeen: 1, childrenUnderSix: 2 })).toContain("up to 8 guests");
  });

  it("allows four nights with the short-stay levy and rejects shorter stays", () => {
    expect(validateQuoteRequest({ arrival: "2027-06-01", departure: "2027-06-05", adults: 2, childrenSixToSeventeen: 0, childrenUnderSix: 0 })).toEqual(null);
    expect(validateQuoteRequest({ arrival: "2027-06-01", departure: "2027-06-04", adults: 2, childrenSixToSeventeen: 0, childrenUnderSix: 0 })).toBe("Minimum stay is 5 nights. Four night stays are available with an additional $500 short-stay levy.");

    const quote = calculateQuote({ arrival: "2027-06-01", departure: "2027-06-05", adults: 2, childrenSixToSeventeen: 0, childrenUnderSix: 0 });
    expect(quote.nights).toBe(4);
    expect(quote.shortStayLevy).toBe(500);
  });

  it("requires ten nights when the stay overlaps the festive period", () => {
    expect(validateQuoteRequest({ arrival: "2027-12-20", departure: "2027-12-27", adults: 2, childrenSixToSeventeen: 0, childrenUnderSix: 0 })).toMatch(/10 nights/i);
  });
});
