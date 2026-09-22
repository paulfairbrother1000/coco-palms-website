import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SiteHeader } from "./site-header";

describe("SiteHeader", () => {
  it("uses the supplied Coco Palms logo", () => {
    render(<SiteHeader />);
    expect(screen.getByRole("img", { name: "Coco Palms Antigua West Indies" }).getAttribute("src"))
      .toContain("cocopalms-logo.jpg");
  });

  it("uses the rates and availability page for the quotation journey", () => {
    render(<SiteHeader />);
    expect(screen.getByRole("link", { name: "Get Quotation" })).toHaveAttribute(
      "href",
      "/rates-and-availability",
    );
  });
});
