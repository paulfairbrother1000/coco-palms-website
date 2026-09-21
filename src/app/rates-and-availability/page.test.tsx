import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/features/availability/load-unavailable-ranges", () => ({
  COCO_PALMS_ICAL_URL: "https://example.com/calendar.ics",
  loadUnavailableRanges: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/supabase/public", () => ({
  createPublicSupabaseClient: vi.fn(),
}));

import AvailabilityPage from "./page";

describe("rates and availability page", () => {
  it("invites guests to select dates without describing unavailable-date internals", async () => {
    render(await AvailabilityPage());

    expect(screen.getByText("Select available arrival and departure dates to begin your quotation.")).toBeInTheDocument();
    expect(screen.queryByText(/Unavailable dates are blanked out directly from the Coco Palms Google Calendar/i)).not.toBeInTheDocument();
  });
});
