import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

const confirmation = {
  arrival: "2027-06-01",
  departure: "2027-06-08",
  nights: 7,
  adults: 2,
  childrenSixToSeventeen: 0,
  childrenUnderSix: 0,
  quotationTotal: 8773,
  dueToConfirm: 4386.5,
  securityDeposit: 2000,
};

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

  it("passes the confirmation details into the booking dialog", async () => {
    const user = userEvent.setup();
    render(<QuoteResult calculation={calculation} publicToken="quote-token" confirmation={confirmation} />);

    await user.click(screen.getByRole("button", { name: "Book Now" }));

    const dialog = screen.getByRole("dialog", { name: "Confirm your booking request" });
    expect(within(dialog).getByText("1 June 2027")).toBeInTheDocument();
    expect(within(dialog).getByText("Children aged 6 or over").nextSibling).toHaveTextContent("0");
    expect(within(dialog).getByText("Children under 6").nextSibling).toHaveTextContent("0");
    expect(within(dialog).getByText("$8,773.00")).toBeInTheDocument();
  });
});
