import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { QuoteResult } from "./quote-result";
import type { QuoteCalculation } from "./types";

const calculation = {
  nights: 7,
  guests: 2,
  levyGuests: 2,
  accommodation: 7000,
  rateBreakdown: [{ period: "15th May to 15th Nov", nights: 7, rate: 1000, total: 7000 }],
  longStayDiscount: 0,
  secondaryDiscount: 0,
  secondaryDiscountType: null,
  discountedAccommodation: 7000,
  shortStayLevy: 0,
  abst: 1190,
  governmentLevy: 70,
  fees: 513,
  quotationTotal: 8773,
  securityDeposit: 2000,
  dueToConfirm: 4386.5,
  balanceDue: 4386.5,
  balanceDueDaysBeforeArrival: 70,
} satisfies QuoteCalculation;

describe("QuoteResult", () => {
  it("explains each price component and the fee basis", () => {
    render(<QuoteResult calculation={calculation} />);

    expect(screen.getByText("7 nights × $1,000.00 — 15th May to 15th Nov")).toBeInTheDocument();
    expect(screen.getByText("ABST — 17% of accommodation and applicable charges")).toBeInTheDocument();
    expect(screen.getByText("Government levy — 2 guests aged 6+ × 7 nights × $5")).toBeInTheDocument();
    expect(screen.getByText("Administration fee — 5% including the refundable $2,000 security deposit")).toBeInTheDocument();
    expect(screen.getByText("Due on booking")).toBeInTheDocument();
    expect(screen.queryByText("Due to confirm")).not.toBeInTheDocument();
  });

  it("keeps a useful on-screen message when email delivery fails", () => {
    render(<QuoteResult calculation={calculation} emailSent={false} />);

    expect(screen.getByText("Your quotation is displayed here, but the email could not be sent. Please keep this page open and contact us if you need a copy.")).toBeInTheDocument();
  });
});
