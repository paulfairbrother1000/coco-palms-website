import { describe, expect, it, vi } from "vitest";
import { createCalendarSyncHandler } from "./route";

describe("calendar synchronization route", () => {
  it("rejects requests without the cron secret", async () => {
    const handler = createCalendarSyncHandler({ secret: "secret", fetchIcs: vi.fn(), syncEvents: vi.fn() });
    const response = await handler(new Request("http://localhost/api/calendar/sync"));
    expect(response.status).toBe(401);
  });

  it("imports current iCal events through one database synchronization call", async () => {
    const syncEvents = vi.fn();
    const handler = createCalendarSyncHandler({
      secret: "secret",
      fetchIcs: vi.fn().mockResolvedValue("BEGIN:VCALENDAR\nBEGIN:VEVENT\nUID:booking-1\nDTSTART;VALUE=DATE:20270605\nDTEND;VALUE=DATE:20270609\nSUMMARY:Booked\nEND:VEVENT\nEND:VCALENDAR"),
      syncEvents,
    });
    const response = await handler(new Request("http://localhost/api/calendar/sync", { headers: { authorization: "Bearer secret" } }));
    expect(response.status).toBe(200);
    expect(syncEvents).toHaveBeenCalledWith([{ uid: "booking-1", startDate: "2027-06-05", endDate: "2027-06-09", summary: "Booked" }]);
    expect(await response.json()).toEqual({ ok: true, imported: 1 });
  });
});
