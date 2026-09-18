import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QuoteForm } from "./quote-form";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("arrival=2027-06-01&departure=2027-06-08"),
}));

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
};

describe("QuoteForm", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("uses a blocked-date calendar instead of editable date fields", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(new Response(JSON.stringify({ ranges: [] }), { status: 200 }));
    const { container } = render(<QuoteForm />);

    expect(container.querySelector('input[type="date"]')).toBeNull();
    expect(await screen.findByRole("heading", { name: "June 2027" })).toBeInTheDocument();
    expect(screen.getByText(/children under 6 are not charged/i)).toBeInTheDocument();
  });

  it("submits the selected stay and displays an itemised quote with Book Now", async () => {
    const fetchMock = vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ ranges: [] }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ calculation, publicToken: "quote-token", emailSent: true }), { status: 200 }));
    const user = userEvent.setup();
    render(<QuoteForm />);

    await screen.findByRole("heading", { name: "June 2027" });
    await user.type(screen.getByLabelText("Name"), "Paul Fairbrother");
    await user.type(screen.getByLabelText("Email"), "paul@example.com");
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "Get Quotation" }));

    await screen.findByRole("heading", { name: "$8,773.00" });
    expect(screen.getByText("7 nights × $1,000.00 — 15th May to 15th Nov")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Book Now" })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenLastCalledWith("/api/quotes", expect.objectContaining({ method: "POST" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });
});
