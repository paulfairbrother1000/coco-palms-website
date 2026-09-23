import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HomePage from "./page";

describe("home page", () => {
  it("introduces Coco Palms and leads with the quotation journey", () => {
    const { container } = render(<HomePage />);
    expect(screen.getByRole("heading", { name: "Welcome to Coco Palms" })).toHaveClass("hero-title");
    for (const link of screen.getAllByRole("link", { name: /get quotation/i })) {
      expect(link).toHaveAttribute("href", "/rates-and-availability");
    }
    expect(screen.queryByRole("link", { name: /view availability/i })).not.toBeInTheDocument();
    expect(container.querySelector(".hero-copy-panel")).toBeInTheDocument();
    expect(container.querySelector(".hero-shade")).not.toBeInTheDocument();
  });

  it("shows the slow-down photograph and orders the gallery tiles interior first", () => {
    render(<HomePage />);

    expect(screen.getByRole("img", { name: "Coco Palms pool and covered waterfront terrace" })).toHaveAttribute(
      "src",
      expect.stringContaining("%2Fimages%2Fvilla-hero.jpg"),
    );

    expect(screen.getByRole("img", { name: "Coco Palms outdoor living beside the pool" })).toHaveAttribute(
      "src",
      expect.stringContaining("%2Fimages%2Fcocopalmshero4.jpg"),
    );

    const tiles = screen.getAllByRole("link", { name: /view gallery/i });
    expect(tiles.map((tile) => tile.getAttribute("href"))).toEqual([
      "/gallery#interior",
      "/gallery#exterior",
      "/gallery#local-area",
    ]);
    expect(screen.getByRole("img", { name: "Interior" })).toHaveAttribute(
      "src",
      expect.stringContaining("%2Fimages%2Finterior-7.jpg"),
    );
  });

  it("uses the approved homepage wording and numerals", () => {
    render(<HomePage />);

    expect(screen.getByText(/contemporary 4-bedroom villa/i)).toBeInTheDocument();
    expect(screen.getByText("Waterfront terraces, poolside lounging and front-row seats for sunset over the harbour.")).toBeInTheDocument();
    expect(screen.getByText("Clear turquoise waters, white-sand beaches and all the colour of Antigua close at hand.")).toBeInTheDocument();
    expect(screen.getByText(/calculate the price, including fees and taxes/i)).toBeInTheDocument();
    expect(screen.queryByText(/published rates, taxes and fees/i)).not.toBeInTheDocument();
  });
});
