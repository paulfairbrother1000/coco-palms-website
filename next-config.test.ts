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
});
