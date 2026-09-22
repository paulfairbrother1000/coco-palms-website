import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import VillaPage from "./page";

describe("villa page", () => {
  it("shares the existing aerial with five new villa photographs in a mosaic", () => {
    render(<VillaPage />);

    const images = screen.getAllByTestId("villa-mosaic-image");
    expect(images).toHaveLength(6);
    expect(images.map((image) => image.getAttribute("src"))).toEqual(expect.arrayContaining([
      expect.stringContaining("%2Fimages%2Fcoco-palms-home-page.jpeg"),
      expect.stringContaining("%2Fimages%2Fvilla%2Fpool-and-dock-aerial.jpg"),
      expect.stringContaining("%2Fimages%2Fvilla%2Fpool-waterline.jpg"),
      expect.stringContaining("%2Fimages%2Fvilla%2Fsunset-terrace.jpg"),
      expect.stringContaining("%2Fimages%2Fvilla%2Fpool-at-night.jpg"),
      expect.stringContaining("%2Fimages%2Fvilla%2Fwaterfront-aerial.jpg"),
    ]));
  });
});
