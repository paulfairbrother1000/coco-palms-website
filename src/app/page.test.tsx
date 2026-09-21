import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HomePage from "./page";

describe("home page", () => {
  it("introduces Coco Palms and leads with the quotation journey", () => {
    const { container } = render(<HomePage />);
    expect(screen.getByRole("heading", { name: "Welcome to Coco Palms" })).toHaveClass("hero-title");
    expect(screen.getAllByRole("link", { name: /get quotation/i })[0]).toHaveAttribute("href", "/get-quotation");
    expect(container.querySelector(".hero-shade")).not.toBeInTheDocument();
  });

  it("shows the slow-down photograph and orders the gallery tiles interior first", () => {
    render(<HomePage />);

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
});
