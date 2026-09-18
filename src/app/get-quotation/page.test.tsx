import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/features/quotes/quote-form", () => ({ QuoteForm: () => <div>Quote form</div> }));

import GetQuotationPage from "./page";

describe("quotation page introduction", () => {
  it("does not describe the security deposit as separate in the introduction", () => {
    render(<GetQuotationPage />);
    expect(screen.getByText("Rates are in USD. A 50% payment confirms your stay and the balance is due ten weeks before arrival.")).toBeInTheDocument();
    expect(screen.queryByText(/security deposit is separate/i)).not.toBeInTheDocument();
  });

  it("shows the base nightly rate for every seasonal time band", () => {
    render(<GetQuotationPage />);

    expect(screen.getByRole("heading", { name: "Published rates" })).toBeInTheDocument();
    expect(screen.getByText("15 May – 15 November")).toBeInTheDocument();
    expect(screen.getByText("16 November – 17 December")).toBeInTheDocument();
    expect(screen.getByText("18 December – 3 January")).toBeInTheDocument();
    expect(screen.getByText("4 January – 14 May")).toBeInTheDocument();
    expect(screen.getAllByText("$1,250")).toHaveLength(2);
    expect(screen.getByText("$1,200")).toBeInTheDocument();
    expect(screen.getByText("$1,500")).toBeInTheDocument();
  });

  it("places the published rates directly beneath the payment information", () => {
    render(<GetQuotationPage />);

    const introduction = screen.getByText(/a 50% payment confirms your stay/i).closest(".quotation-intro");
    expect(introduction).toContainElement(screen.getByRole("heading", { name: "Published rates" }));
  });
});
