import { eachDayOfInterval, format, isBefore, isEqual } from "date-fns";

export interface UnavailableRange { start_date: string; end_date: string }

export function dateIso(date: Date) {
  return format(date, "yyyy-MM-dd");
}

export function isDateUnavailable(date: Date, ranges: UnavailableRange[]) {
  const value = dateIso(date);
  return ranges.some((range) => value >= range.start_date && value < range.end_date);
}

export function canSelectRange(arrival: Date, departure: Date, ranges: UnavailableRange[]) {
  if (isBefore(departure, arrival) || isEqual(departure, arrival)) return false;
  return !eachDayOfInterval({ start: arrival, end: departure }).slice(0, -1).some((date) => isDateUnavailable(date, ranges));
}
