import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import VillaPage from "./page";

describe("villa page", () => {
  it("shows the supplied exterior photograph instead of the placeholder", () => {
    render(<VillaPage />);

    expect(screen.getByRole("img", { name: "Coco Palms villa, pool and private dock" })).toHaveAttribute(
      "src",
      expect.stringContaining("%2Fimages%2Fexterior-12.jpg"),
    );
  });
});
