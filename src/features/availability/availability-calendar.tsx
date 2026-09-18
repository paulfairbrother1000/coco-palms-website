"use client";

import { addMonths, eachDayOfInterval, endOfMonth, format, getDay, isBefore, isSameDay, startOfDay, startOfMonth } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { canSelectRange, dateIso, isDateUnavailable, type UnavailableRange } from "./date-range";

export type { UnavailableRange } from "./date-range";

export function AvailabilityCalendar({ ranges }: { ranges: UnavailableRange[] }) {
  const [month, setMonth] = useState(startOfMonth(new Date()));
  const [arrival, setArrival] = useState<Date | null>(null);
  const [departure, setDeparture] = useState<Date | null>(null);
  const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });
  const today = startOfDay(new Date());
  const unavailable = useMemo(() => (date: Date) => isDateUnavailable(date, ranges), [ranges]);

  function choose(date: Date) {
    if (isBefore(date, today) || unavailable(date)) return;
    if (!arrival || departure || !isBefore(arrival, date)) { setArrival(date); setDeparture(null); return; }
    if (!canSelectRange(arrival, date, ranges)) return;
    setDeparture(date);
  }

  return <div className="calendar-shell">
    <div className="calendar-toolbar"><button aria-label="Previous month" onClick={() => setMonth(addMonths(month, -1))} disabled={!isBefore(month, startOfMonth(today)) && isSameDay(month, startOfMonth(today))}><ChevronLeft /></button><h2>{format(month, "MMMM yyyy")}</h2><button aria-label="Next month" onClick={() => setMonth(addMonths(month, 1))}><ChevronRight /></button></div>
    <div className="calendar-weekdays">{["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((day) => <span key={day}>{day}</span>)}</div>
    <div className="calendar-grid">{Array.from({ length: getDay(startOfMonth(month)) }, (_, index) => <span key={`empty-${index}`} />)}{days.map((date) => {
      const blocked = unavailable(date); const past = isBefore(date, today); const selected = (arrival && isSameDay(date, arrival)) || (departure && isSameDay(date, departure));
      return <button key={date.toISOString()} disabled={blocked || past} aria-label={`${format(date,"MMMM d, yyyy")}${blocked ? ", unavailable" : ", available"}`} className={selected ? "selected" : blocked ? "blocked" : ""} onClick={() => choose(date)}>{format(date,"d")}</button>;
    })}</div>
    <div className="calendar-key"><span><i className="available" />Available</span><span><i className="unavailable" />Unavailable</span></div>
    <div className="calendar-selection"><div><span className="eyebrow">Selected stay</span><strong>{arrival ? format(arrival,"MMM d, yyyy") : "Choose arrival"} — {departure ? format(departure,"MMM d, yyyy") : "choose departure"}</strong></div>{arrival && departure && <Link className="button" href={`/get-quotation?arrival=${dateIso(arrival)}&departure=${dateIso(departure)}`}>Get Quotation</Link>}</div>
  </div>;
}
