import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HomePage from "./page";

describe("home page", () => {
  it("introduces Coco Palms and leads with the quotation journey", () => {
    render(<HomePage />);
    expect(screen.getByRole("heading", { name: "Welcome to Coco Palms" })).toHaveClass("hero-title");
    expect(screen.getAllByRole("link", { name: /get quotation/i })[0]).toHaveAttribute("href", "/get-quotation");
  });
});
