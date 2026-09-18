import { describe, expect, it, vi } from "vitest";
import { loadUnavailableRanges } from "./load-unavailable-ranges";

const liveIcs = `BEGIN:VCALENDAR\r
BEGIN:VEVENT\r
UID:booking-1\r
DTSTART;VALUE=DATE:20270218\r
DTEND;VALUE=DATE:20270302\r
SUMMARY:Busy\r
END:VEVENT\r
END:VCALENDAR`;

describe("loadUnavailableRanges", () => {
  it("uses Google Calendar as the source of truth when it is reachable", async () => {
    const ranges = await loadUnavailableRanges({
      start: "2027-01-01",
      end: "2027-12-31",
      fetchIcs: vi.fn().mockResolvedValue(liveIcs),
      getDatabaseRanges: vi.fn().mockResolvedValue([
        { start_date: "2027-02-18", end_date: "2027-02-28" },
        { start_date: "2027-04-01", end_date: "2027-04-10" },
      ]),
    });

    expect(ranges).toEqual([{ start_date: "2027-02-18", end_date: "2027-03-02" }]);
  });

  it("falls back to Supabase when Google Calendar cannot be reached", async () => {
    const ranges = await loadUnavailableRanges({
      start: "2027-01-01",
      end: "2027-12-31",
      fetchIcs: vi.fn().mockRejectedValue(new Error("network")),
      getDatabaseRanges: vi.fn().mockResolvedValue([{ start_date: "2027-01-02", end_date: "2027-01-10" }]),
    });

    expect(ranges).toEqual([{ start_date: "2027-01-02", end_date: "2027-01-10" }]);
  });
});
