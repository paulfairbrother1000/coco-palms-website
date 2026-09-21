import { AvailabilityCalendar, type UnavailableRange } from "@/features/availability/availability-calendar";
import { COCO_PALMS_ICAL_URL, loadUnavailableRanges } from "@/features/availability/load-unavailable-ranges";
import { createPublicSupabaseClient } from "@/lib/supabase/public";
import { PublishedRatesCard } from "@/features/quotes/published-rates-card";

export const metadata = { title: "Rates & Availability" };
export const dynamic = "force-dynamic";

export default async function AvailabilityPage() {
  const start = new Date().toISOString().slice(0, 10);
  const end = `${new Date().getUTCFullYear() + 2}-12-31`;
  const ranges = await loadUnavailableRanges({
    start,
    end,
    async fetchIcs() {
      const response = await fetch(process.env.GOOGLE_CALENDAR_ICAL_URL ?? COCO_PALMS_ICAL_URL, { cache: "no-store" });
      if (!response.ok) throw new Error("Google Calendar could not be loaded.");
      return response.text();
    },
    async getDatabaseRanges() {
      const { data, error } = await createPublicSupabaseClient().rpc("get_unavailable_ranges", { p_start: start, p_end: end });
      if (error) throw error;
      return (data ?? []) as UnavailableRange[];
    },
  });
  return <><section className="page-hero"><span className="eyebrow">Plan with confidence</span><h1>Rates & Availability</h1><p>Select available arrival and departure dates to begin your quotation.</p></section><section className="section availability-layout"><AvailabilityCalendar ranges={ranges} /><PublishedRatesCard /></section></>;
}
