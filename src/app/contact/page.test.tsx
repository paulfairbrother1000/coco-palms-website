import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ContactPage from "./page";

describe("contact page", () => {
  it("provides a pre-addressed email enquiry link", () => {
    render(<ContactPage />);
    expect(screen.getByRole("link", { name: /hello@cocopalms-antigua.com/i })).toHaveAttribute(
      "href",
      "mailto:hello@cocopalms-antigua.com?subject=Coco%20Palms%20Enquiry",
    );
  });
});
