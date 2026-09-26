import { describe, expect, it } from "vitest";
import nextConfig from "./next.config";

describe("legacy URL redirects", () => {
  it("permanently redirects the former rates URL to the booking page", async () => {
    const redirects = await nextConfig.redirects?.();

    expect(redirects).toContainEqual({
      source: "/rates",
      destination: "/rates-and-availability",
      permanent: true,
    });
  });

  it("sends indexed pages from the previous site to their current equivalents", async () => {
    const redirects = await nextConfig.redirects?.();
    expect(redirects).toEqual(expect.arrayContaining([
      { source: "/ratesoldpage", destination: "/rates-and-availability", permanent: true },
      { source: "/amenities", destination: "/location-and-amenities", permanent: true },
      { source: "/Contact-us", destination: "/contact", permanent: true },
      { source: "/payments", destination: "/rates-and-availability", permanent: true },
    ]));
  });
});
