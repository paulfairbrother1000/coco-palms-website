export type CalendarEvent = { uid: string; startDate: string; endDate: string; summary: string };

function isoDate(value: string) {
  const digits = value.trim().slice(0, 8);
  if (!/^\d{8}$/.test(digits)) return null;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
}

function valueFor(lines: string[], name: string) {
  const line = lines.find((candidate) => candidate === name || candidate.startsWith(`${name}:`) || candidate.startsWith(`${name};`));
  return line?.slice(line.indexOf(":") + 1) ?? "";
}

export function parseGoogleCalendarIcs(ics: string): CalendarEvent[] {
  const unfolded = ics.replace(/\r?\n[ \t]/g, "");
  return unfolded.split(/BEGIN:VEVENT\r?\n/).slice(1).flatMap((block) => {
    const body = block.split(/\r?\nEND:VEVENT/)[0] ?? "";
    const lines = body.split(/\r?\n/);
    if (valueFor(lines, "STATUS").toUpperCase() === "CANCELLED") return [];
    const uid = valueFor(lines, "UID").trim();
    const startDate = isoDate(valueFor(lines, "DTSTART"));
    const endDate = isoDate(valueFor(lines, "DTEND"));
    if (!uid || !startDate || !endDate || endDate <= startDate) return [];
    const summary = valueFor(lines, "SUMMARY").replace(/\\,/g, ",").replace(/\\n/gi, " ").trim() || "Google Calendar block";
    return [{ uid, startDate, endDate, summary }];
  });
}
