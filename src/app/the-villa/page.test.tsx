import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import VillaPage from "./page";

describe("villa page", () => {
  it("shows the approved villa mosaic replacements", () => {
    render(<VillaPage />);

    const images = screen.getAllByTestId("villa-mosaic-image");
    expect(images).toHaveLength(6);
    expect(images.map((image) => image.getAttribute("src"))).toEqual(expect.arrayContaining([
      expect.stringContaining("%2Fimages%2Fcoco-palms-home-page.jpeg"),
      expect.stringContaining("%2Fimages%2Fvilla%2Fgreat-room.jpg"),
      expect.stringContaining("%2Fimages%2Fvilla%2Fdining-area.jpg"),
      expect.stringContaining("%2Fimages%2Fvilla%2Fbedroom.jpg"),
      expect.stringContaining("%2Fimages%2Fvilla%2Fsunset-terrace.jpg"),
      expect.stringContaining("%2Fimages%2Fvilla%2Fwaterfront-aerial.jpg"),
    ]));
  });

  it("uses numerals and the complete approved feature list", () => {
    render(<VillaPage />);

    expect(screen.getByText(/sleeps up to 8 guests across 4 spacious bedrooms/i)).toBeInTheDocument();
    for (const feature of [
      "4 spacious bedrooms",
      "Two ensuite bathrooms plus a house bathroom",
      "Private swimming pool",
      "Covered outdoor kitchen with BBQ, bar area and dining for 10",
      "Private boat dock and waterside lounging deck",
      "Set within Jolly Harbour’s gated community with 24/7 security, an on-site supermarket, sports facilities, a pharmacy, and waterside bars and restaurants",
      "Kayaks and paddleboards for aqua adventures",
      "AC in all bedrooms",
    ]) {
      expect(screen.getByText(feature)).toBeInTheDocument();
    }
    expect(screen.queryByText(/swimming pool and waterside lounging deck/i)).not.toBeInTheDocument();
  });
});
