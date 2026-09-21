import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/features/quotes/quote-form", () => ({ QuoteForm: () => <div>Quote form</div> }));

import GetQuotationPage from "./page";

describe("quotation page introduction", () => {
  it("explains the payment terms in separate paragraphs", () => {
    render(<GetQuotationPage />);
    expect(screen.getByText("Rates are in USD.")).toBeInTheDocument();
    expect(screen.getByText("A 50% deposit confirms your stay and the balance is due ten weeks before arrival.")).toBeInTheDocument();
    expect(screen.queryByText(/security deposit is separate/i)).not.toBeInTheDocument();
  });

  it("shows the base nightly rate for every seasonal time band", () => {
    render(<GetQuotationPage />);

    expect(screen.getByRole("heading", { name: "Rates" })).toBeInTheDocument();
    expect(screen.getByText("15 May – 15 November")).toBeInTheDocument();
    expect(screen.getByText("16 November – 17 December")).toBeInTheDocument();
    expect(screen.getByText("18 December – 3 January")).toBeInTheDocument();
    expect(screen.getByText("4 January – 14 May")).toBeInTheDocument();
    expect(screen.getAllByText("$1,250")).toHaveLength(2);
    expect(screen.getByText("$1,200")).toBeInTheDocument();
    expect(screen.getByText("$1,500")).toBeInTheDocument();
  });

  it("places the rates directly beneath the payment information", () => {
    render(<GetQuotationPage />);

    const introduction = screen.getByText(/a 50% deposit confirms your stay/i).closest(".quotation-intro");
    expect(introduction).toContainElement(screen.getByRole("heading", { name: "Rates" }));
    expect(screen.getByText("Minimum stay is 5 nights. (Four nights are considered but are subject to a $500 short-stay levy.)")).toBeInTheDocument();
    expect(screen.getByText("All rates are USD and subject to taxes, government levy and fees which are shown in your quotation.")).toBeInTheDocument();
  });
});
