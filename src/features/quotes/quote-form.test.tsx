import { render, screen, waitFor, within } from "@testing-library/react";
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
    expect(screen.getByLabelText("Children aged 6 or over")).toBeInTheDocument();
    expect(screen.getByText("Select your arrival date, then your departure date.")).toBeInTheDocument();
    expect(screen.queryByText(/usual minimum/i)).not.toBeInTheDocument();
  });

  it("lets mobile users adjust every party number with explicit buttons", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(new Response(JSON.stringify({ ranges: [] }), { status: 200 }));
    const user = userEvent.setup();
    render(<QuoteForm />);

    await screen.findByRole("heading", { name: "June 2027" });
    expect(screen.getByRole("button", { name: "Decrease Adults" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Increase Adults" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Decrease Children aged 6 or over" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Increase Children aged 6 or over" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Decrease Children under 6" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Increase Children under 6" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Increase Children under 6" }));
    expect(screen.getByLabelText("Children under 6")).toHaveValue(1);
  });

  it("keeps party selectors within their allowed limits", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(new Response(JSON.stringify({ ranges: [] }), { status: 200 }));
    const user = userEvent.setup();
    render(<QuoteForm />);

    await screen.findByRole("heading", { name: "June 2027" });
    await user.click(screen.getByRole("button", { name: "Decrease Children under 6" }));
    expect(screen.getByLabelText("Children under 6")).toHaveValue(0);

    const adults = screen.getByLabelText("Adults");
    await user.clear(adults);
    await user.type(adults, "1");
    await user.click(screen.getByRole("button", { name: "Decrease Adults" }));
    expect(adults).toHaveValue(1);
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
    await user.clear(screen.getByLabelText("Children aged 6 or over"));
    await user.type(screen.getByLabelText("Children aged 6 or over"), "1");
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "Get Quotation" }));

    await screen.findByRole("heading", { name: "$8,773.00" });
    expect(screen.getByText("7 nights × $1,000.00 — 15th May to 15th Nov")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Book Now" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Book Now" }));
    const dialog = screen.getByRole("dialog", { name: "Confirm your booking request" });
    expect(within(dialog).getByText("Adults").nextSibling).toHaveTextContent("2");
    expect(within(dialog).getByText("Children aged 6 or over").nextSibling).toHaveTextContent("1");
    expect(within(dialog).getByText("Children under 6").nextSibling).toHaveTextContent("0");
    expect(fetchMock).toHaveBeenLastCalledWith("/api/quotes", expect.objectContaining({ method: "POST" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });
});
