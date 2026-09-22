import { beforeEach, describe, expect, it, vi } from "vitest";

const { permanentRedirect } = vi.hoisted(() => ({ permanentRedirect: vi.fn() }));

vi.mock("next/navigation", () => ({ permanentRedirect }));

import GetQuotationPage from "./page";

describe("legacy quotation route", () => {
  beforeEach(() => permanentRedirect.mockClear());

  it("redirects to the canonical rates and availability page", async () => {
    await GetQuotationPage({ searchParams: Promise.resolve({}) });
    expect(permanentRedirect).toHaveBeenCalledWith("/rates-and-availability");
  });

  it("preserves selected arrival and departure dates", async () => {
    await GetQuotationPage({
      searchParams: Promise.resolve({ arrival: "2027-02-01", departure: "2027-02-06" }),
    });
    expect(permanentRedirect).toHaveBeenCalledWith(
      "/rates-and-availability?arrival=2027-02-01&departure=2027-02-06",
    );
  });
});
