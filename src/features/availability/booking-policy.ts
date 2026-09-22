import { addDays, differenceInCalendarDays, isAfter, parseISO } from "date-fns";

export const MINIMUM_BOOKING_NOTICE_DAYS = 5;
export const MINIMUM_STAY_NIGHTS = 5;

function antiguaDateIso(now: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Antigua",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

export function antiguaToday(now = new Date()) {
  return parseISO(antiguaDateIso(now));
}

export function earliestArrivalDate(now = new Date()) {
  return addDays(antiguaToday(now), MINIMUM_BOOKING_NOTICE_DAYS);
}

export function isBeforeEarliestArrival(date: Date, now = new Date()) {
  return differenceInCalendarDays(date, earliestArrivalDate(now)) < 0;
}

export function isTooShortDeparture(date: Date, arrival: Date | null) {
  return Boolean(arrival && isAfter(date, arrival) && differenceInCalendarDays(date, arrival) < MINIMUM_STAY_NIGHTS);
}
