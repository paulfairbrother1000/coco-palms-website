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
});
