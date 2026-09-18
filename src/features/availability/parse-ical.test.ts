import { describe, expect, it } from "vitest";
import { parseGoogleCalendarIcs } from "./parse-ical";

describe("parseGoogleCalendarIcs", () => {
  it("parses Google all-day events as half-open unavailable ranges", () => {
    const events = parseGoogleCalendarIcs("BEGIN:VCALENDAR\r\nBEGIN:VEVENT\r\nUID:booking-1\r\nDTSTART;VALUE=DATE:20270605\r\nDTEND;VALUE=DATE:20270609\r\nSUMMARY:Coco Palms booking\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n");
    expect(events).toEqual([{ uid: "booking-1", startDate: "2027-06-05", endDate: "2027-06-09", summary: "Coco Palms booking" }]);
  });

  it("unfolds continued lines and omits cancelled events", () => {
    const events = parseGoogleCalendarIcs("BEGIN:VCALENDAR\nBEGIN:VEVENT\nUID:cancelled\nDTSTART;VALUE=DATE:20270605\nDTEND;VALUE=DATE:20270609\nSTATUS:CANCELLED\nEND:VEVENT\nBEGIN:VEVENT\nUID:booking-2\nDTSTART;VALUE=DATE:20270701\nDTEND;VALUE=DATE:20270706\nSUMMARY:Owner stay in\n Antigua\nEND:VEVENT\nEND:VCALENDAR");
    expect(events).toEqual([{ uid: "booking-2", startDate: "2027-07-01", endDate: "2027-07-06", summary: "Owner stay inAntigua" }]);
  });
});
