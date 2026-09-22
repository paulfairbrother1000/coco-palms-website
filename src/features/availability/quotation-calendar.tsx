"use client";

import { addMonths, eachDayOfInterval, endOfMonth, format, getDay, isBefore, isSameDay, parseISO, startOfMonth } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { antiguaToday, isBeforeEarliestArrival, isTooShortDeparture } from "./booking-policy";
import { canSelectRange, dateIso, isDateUnavailable, type UnavailableRange } from "./date-range";

type Props = {
  ranges: UnavailableRange[];
  arrival: string;
  departure: string;
  onChange: (arrival: string, departure: string) => void;
};

export function QuotationCalendar({ ranges, arrival, departure, onChange }: Props) {
  const now = new Date();
  const today = antiguaToday(now);
  const arrivalDate = arrival ? parseISO(arrival) : null;
  const departureDate = departure ? parseISO(departure) : null;
  const [month, setMonth] = useState(startOfMonth(arrivalDate ?? today));
  const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });
  const selectedNights = useMemo(() => arrivalDate && departureDate ? eachDayOfInterval({ start: arrivalDate, end: departureDate }).slice(0, -1).map(dateIso) : [], [arrivalDate, departureDate]);

  function choose(date: Date) {
    if (isBeforeEarliestArrival(date, now) || isDateUnavailable(date, ranges) || isTooShortDeparture(date, arrivalDate)) return;
    if (!arrivalDate || departureDate || !isBefore(arrivalDate, date)) {
      onChange(dateIso(date), "");
      return;
    }
    if (canSelectRange(arrivalDate, date, ranges)) onChange(arrival, dateIso(date));
  }

  return <div className="calendar-shell quotation-calendar">
    <div className="calendar-toolbar">
      <button type="button" aria-label="Previous month" onClick={() => setMonth(addMonths(month, -1))} disabled={!isBefore(startOfMonth(today), month)}><ChevronLeft /></button>
      <h2>{format(month, "MMMM yyyy")}</h2>
      <button type="button" aria-label="Next month" onClick={() => setMonth(addMonths(month, 1))}><ChevronRight /></button>
    </div>
    <div className="calendar-weekdays">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <span key={day}>{day}</span>)}</div>
    <div className="calendar-grid">
      {Array.from({ length: getDay(startOfMonth(month)) }, (_, index) => <span key={`empty-${index}`} />)}
      {days.map((date) => {
        const blocked = isDateUnavailable(date, ranges) || isBeforeEarliestArrival(date, now) || isTooShortDeparture(date, arrivalDate);
        const selected = (arrivalDate && isSameDay(date, arrivalDate)) || (departureDate && isSameDay(date, departureDate));
        const inRange = selectedNights.includes(dateIso(date));
        return <button
          type="button"
          key={date.toISOString()}
          disabled={blocked}
          aria-label={`${format(date, "MMMM d, yyyy")}${blocked ? ", unavailable" : ", available"}`}
          className={selected ? "selected" : inRange ? "in-range" : blocked ? "blocked" : ""}
          onClick={() => choose(date)}
        >{format(date, "d")}</button>;
      })}
    </div>
    <div className="calendar-key"><span><i className="available" />Available</span><span><i className="unavailable" />Unavailable</span><span><i className="selected-key" />Your stay</span></div>
    <p className="form-note">Select your arrival date, then your departure date.</p>
  </div>;
}
