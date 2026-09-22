import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/features/quotes/quote-form", () => ({ QuoteForm: () => <div>Interactive quote form</div> }));

import AvailabilityPage from "./page";

describe("rates and availability page", () => {
  it("combines rates, availability and the complete quotation journey", () => {
    render(<AvailabilityPage />);

    expect(screen.getByRole("heading", { name: "Rates & Availability" })).toBeInTheDocument();
    expect(screen.getByText("Select available arrival and departure dates to begin your quotation.")).toBeInTheDocument();
    expect(screen.getByText("Interactive quote form")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Rates" })).toBeInTheDocument();
    expect(screen.getByText("Rates are in USD.")).toBeInTheDocument();
    expect(screen.getByText("A 50% deposit confirms your stay and the balance is due ten weeks before arrival.")).toBeInTheDocument();
    expect(screen.queryByText(/Unavailable dates are blanked out directly from the Coco Palms Google Calendar/i)).not.toBeInTheDocument();
  });
});
