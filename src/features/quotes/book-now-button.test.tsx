import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BookNowButton } from "./book-now-button";

const details = {
  arrival: "2027-06-01",
  departure: "2027-06-08",
  nights: 7,
  adults: 2,
  childrenSixToSeventeen: 1,
  childrenUnderSix: 0,
  quotationTotal: 8809.75,
  dueToConfirm: 4404.875,
  securityDeposit: 2000,
};

describe("BookNowButton", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("replaces the booking action with a clear route to a new quotation when the quote has expired", () => {
    render(<BookNowButton token="quote-token" details={details} disabled />);

    expect(screen.getByRole("button", { name: "Quotation expired" })).toBeDisabled();
    expect(screen.getByText("This quotation has expired. A new quotation is required before you can proceed.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Get a new quotation" })).toHaveAttribute("href", "/rates-and-availability");
    expect(screen.queryByRole("button", { name: "Book Now" })).not.toBeInTheDocument();
  });

  it("opens a named confirmation dialog with every booking detail before fetching", async () => {
    const fetchMock = vi.spyOn(global, "fetch");
    const user = userEvent.setup();
    const { container } = render(<BookNowButton token="quote-token" details={details} />);

    expect(fetchMock).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Book Now" }));

    const dialog = screen.getByRole("dialog", { name: "Confirm your booking request" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(container).toHaveAttribute("inert");
    expect(container).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByRole("heading", { name: "Confirm your booking request" })).toHaveFocus();
    expect(screen.getByText("1 June 2027")).toBeInTheDocument();
    expect(screen.getByText("8 June 2027")).toBeInTheDocument();
    expect(screen.getByText("Nights").nextSibling).toHaveTextContent("7");
    expect(screen.getByText("Adults").nextSibling).toHaveTextContent("2");
    expect(screen.getByText("Children aged 6 or over").nextSibling).toHaveTextContent("1");
    expect(screen.getByText("Children under 6").nextSibling).toHaveTextContent("0");
    expect(screen.getByText("$8,809.75")).toBeInTheDocument();
    expect(screen.getByText("$4,404.88")).toBeInTheDocument();
    expect(screen.getByText("$2,000.00")).toBeInTheDocument();
    expect(screen.getByText("This is a request to proceed with the booking. Your dates are not secured until Coco Palms confirms the booking and the required deposit has been paid.")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("contains forward and backward keyboard focus within the dialog", async () => {
    const user = userEvent.setup();
    render(<BookNowButton token="quote-token" details={details} />);

    await user.click(screen.getByRole("button", { name: "Book Now" }));
    await user.tab();
    expect(screen.getByRole("button", { name: "Go back" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "Confirm booking request" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "Go back" })).toHaveFocus();
    await user.tab({ shift: true });
    expect(screen.getByRole("button", { name: "Confirm booking request" })).toHaveFocus();
  });

  it("goes back without fetching and restores focus to Book Now", async () => {
    const fetchMock = vi.spyOn(global, "fetch");
    const user = userEvent.setup();
    const { container } = render(<BookNowButton token="quote-token" details={details} />);
    const bookNow = screen.getByRole("button", { name: "Book Now" });

    await user.click(bookNow);
    await user.click(screen.getByRole("button", { name: "Go back" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(bookNow).toHaveFocus();
    expect(container).not.toHaveAttribute("inert");
    expect(container).not.toHaveAttribute("aria-hidden");
  });

  it("closes on Escape and restores focus without fetching", async () => {
    const fetchMock = vi.spyOn(global, "fetch");
    const user = userEvent.setup();
    render(<BookNowButton token="quote-token" details={details} />);
    const bookNow = screen.getByRole("button", { name: "Book Now" });

    await user.click(bookNow);
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(bookNow).toHaveFocus();
  });

  it("sends one token-only POST and prevents a second submission while pending", async () => {
    let resolveFetch!: (response: Response) => void;
    const fetchMock = vi.spyOn(global, "fetch").mockImplementation(() => new Promise((resolve) => {
      resolveFetch = resolve;
    }));
    const user = userEvent.setup();
    render(<BookNowButton token="quote-token" details={details} />);

    await user.click(screen.getByRole("button", { name: "Book Now" }));
    const confirm = screen.getByRole("button", { name: "Confirm booking request" });
    await user.click(confirm);
    await user.click(confirm);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith("/api/quotes/quote-token/book-now", { method: "POST" });

    resolveFetch(new Response(JSON.stringify({ ok: true }), { status: 200 }));

    expect(await screen.findByRole("button", { name: "Request sent" })).toBeDisabled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    const completion = screen.getByRole("status");
    expect(completion.textContent).toBe("Thank you. Coco Palms has received your request. Your dates are not secured until your booking is confirmed and the required deposit has been paid.");
    expect(completion).toHaveFocus();
  });

  it("blocks Go back and Escape while a submission is pending, then displays its failure", async () => {
    let resolveFetch!: (response: Response) => void;
    vi.spyOn(global, "fetch").mockImplementation(() => new Promise((resolve) => {
      resolveFetch = resolve;
    }));
    const user = userEvent.setup();
    render(<BookNowButton token="quote-token" details={details} />);

    await user.click(screen.getByRole("button", { name: "Book Now" }));
    await user.click(screen.getByRole("button", { name: "Confirm booking request" }));

    const goBack = screen.getByRole("button", { name: "Go back" });
    expect(goBack).toBeDisabled();
    await user.click(goBack);
    expect(screen.getByRole("dialog", { name: "Confirm your booking request" })).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.getByRole("dialog", { name: "Confirm your booking request" })).toBeInTheDocument();

    resolveFetch(new Response(JSON.stringify({ error: "Failed." }), { status: 500 }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Your request could not be sent. Please try again.");
    expect(screen.getByRole("button", { name: "Go back" })).toBeEnabled();
  });

  it("keeps a retry action when the request was recorded but notification failed", async () => {
    const fetchMock = vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({
        error: "Your request was recorded, but the notification could not be sent. Please try again.",
        recorded: true,
      }), { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    const user = userEvent.setup();
    render(<BookNowButton token="quote-token" details={details} />);

    await user.click(screen.getByRole("button", { name: "Book Now" }));
    await user.click(screen.getByRole("button", { name: "Confirm booking request" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Your request was recorded, but the notification could not be sent. Please try again.");
    expect(screen.getByRole("button", { name: "Retry notification" })).toBeEnabled();
    expect(screen.getByRole("dialog", { name: "Confirm your booking request" })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "Retry notification" }));

    expect(await screen.findByRole("button", { name: "Request sent" })).toBeDisabled();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenLastCalledWith("/api/quotes/quote-token/book-now", { method: "POST" });
  });

  it("shows the generic error without claiming an unrecorded request was stored", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(new Response(JSON.stringify({ error: "Failed." }), { status: 500 }));
    const user = userEvent.setup();
    render(<BookNowButton token="quote-token" details={details} />);

    await user.click(screen.getByRole("button", { name: "Book Now" }));
    await user.click(screen.getByRole("button", { name: "Confirm booking request" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Your request could not be sent. Please try again.");
    expect(screen.getByRole("alert")).not.toHaveTextContent(/recorded/i);
  });
});
