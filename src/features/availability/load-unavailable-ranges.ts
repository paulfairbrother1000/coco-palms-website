import { parseGoogleCalendarIcs } from "./parse-ical";
import type { UnavailableRange } from "./date-range";

export const COCO_PALMS_ICAL_URL = "https://calendar.google.com/calendar/ical/2rh0olpnohhc5j9emmb35vkbjk%40group.calendar.google.com/public/basic.ics";

type Input = {
  start: string;
  end: string;
  fetchIcs: () => Promise<string>;
  getDatabaseRanges: () => Promise<UnavailableRange[]>;
};

function relevant(range: UnavailableRange, start: string, end: string) {
  return range.start_date < end && range.end_date > start;
}

function mergeRanges(ranges: UnavailableRange[]) {
  return ranges
    .toSorted((left, right) => left.start_date.localeCompare(right.start_date))
    .reduce<UnavailableRange[]>((merged, range) => {
      const previous = merged.at(-1);
      if (previous && range.start_date <= previous.end_date) {
        previous.end_date = previous.end_date > range.end_date ? previous.end_date : range.end_date;
      } else {
        merged.push({ ...range });
      }
      return merged;
    }, []);
}

export async function loadUnavailableRanges({ start, end, fetchIcs, getDatabaseRanges }: Input) {
  const [calendar, database] = await Promise.allSettled([fetchIcs(), getDatabaseRanges()]);
  const liveRanges = calendar.status === "fulfilled"
    ? parseGoogleCalendarIcs(calendar.value).map((event) => ({ start_date: event.startDate, end_date: event.endDate }))
    : [];
  const databaseRanges = database.status === "fulfilled" ? database.value : [];

  if (calendar.status === "rejected" && database.status === "rejected") throw new Error("Availability sources could not be loaded.");
  const sourceOfTruth = calendar.status === "fulfilled" ? liveRanges : databaseRanges;
  return mergeRanges(sourceOfTruth.filter((range) => relevant(range, start, end)));
}
