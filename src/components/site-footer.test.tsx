import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SiteFooter } from "./site-footer";

describe("site footer", () => {
  it("presents the updated villa message and availability link", () => {
    render(<SiteFooter />);

    expect(screen.getByText("Luxury villa in the heart of the Caribbean")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Check Availability" })).toHaveAttribute("href", "/rates-and-availability");
    expect(screen.queryByText("A private waterfront villa in Jolly Harbour, Antigua.")).not.toBeInTheDocument();
  });
});
