import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/features/quotes/quote-form", () => ({ QuoteForm: () => <div>Interactive quote form</div> }));

import AvailabilityPage from "./page";

describe("rates and availability page", () => {
  it("combines rates, availability and the complete quotation journey", () => {
    const { container } = render(<AvailabilityPage />);

    expect(screen.getByRole("heading", { name: "Rates & Availability" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Plan your water front stay" })).toBeInTheDocument();
    expect(screen.getByText("Select available arrival and departure dates to begin your quotation.")).toBeInTheDocument();
    expect(screen.getByText("Interactive quote form")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Rates" })).toBeInTheDocument();
    expect(screen.getByText("Rates are in US Dollars (USD).")).toBeInTheDocument();
    expect(screen.getByText("A 50% deposit confirms your stay and the balance is due ten weeks before arrival.")).toBeInTheDocument();
    expect(screen.queryByText("Coco Palms Antigua")).not.toBeInTheDocument();
    expect(screen.queryByText(/Unavailable dates are blanked out directly from the Coco Palms Google Calendar/i)).not.toBeInTheDocument();

    const content = container.textContent ?? "";
    expect(content.indexOf("Plan your water front stay")).toBeLessThan(content.indexOf("Select available arrival and departure dates"));
    expect(content.indexOf("Select available arrival and departure dates")).toBeLessThan(content.indexOf("A 50% deposit confirms your stay"));
    expect(content.indexOf("A 50% deposit confirms your stay")).toBeLessThan(content.indexOf("Rates are in US Dollars (USD)."));
  });
});
