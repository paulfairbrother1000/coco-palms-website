import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import sitemap from "./sitemap";
import robots from "./robots";

vi.mock("next/font/google", () => ({ Manrope: () => ({ variable: "font-sans" }) }));

import RootLayout, { metadata } from "./layout";

describe("public discovery", () => {
  it("lists current public pages and excludes private quotation and admin URLs", () => {
    const urls = sitemap().map((page) => page.url);
    expect(urls).toContain("https://www.cocopalms-antigua.com/rates-and-availability");
    expect(urls).toContain("https://www.cocopalms-antigua.com/location-and-amenities");
    expect(urls).not.toContain("https://www.cocopalms-antigua.com/ratesoldpage");
    expect(urls.every((url) => !url.includes("/admin") && !url.includes("/quotation/"))).toBe(true);
  });

  it("allows search crawlers and omits non-public endpoints", () => {
    const rules = robots();
    expect(rules.rules).toEqual(expect.arrayContaining([
      expect.objectContaining({ userAgent: "OAI-SearchBot", allow: "/" }),
    ]));
    expect(rules.sitemap).toBe("https://www.cocopalms-antigua.com/sitemap.xml");
    expect(rules.rules).toEqual(expect.arrayContaining([
      expect.objectContaining({ disallow: expect.arrayContaining(["/admin/", "/api/"]) }),
    ]));
  });

  it("identifies the property consistently without altering visible layout", () => {
    expect(metadata.metadataBase?.toString()).toBe("https://www.cocopalms-antigua.com/");
    const { container } = render(<RootLayout><div>Page content</div></RootLayout>);
    const schema = JSON.parse(container.querySelector('script[type="application/ld+json"]')?.textContent ?? "null");
    expect(schema).toMatchObject({
      "@type": "VacationRental",
      name: "Coco Palms Antigua",
      containsPlace: { occupancy: { value: 8 }, numberOfBedrooms: 4, numberOfBathroomsTotal: 3 },
      address: { addressLocality: "Jolly Harbour", addressCountry: "AG" },
    });
  });
});
