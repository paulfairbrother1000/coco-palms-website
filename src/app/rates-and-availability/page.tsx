import { AvailabilityCalendar, type UnavailableRange } from "@/features/availability/availability-calendar";
import { COCO_PALMS_ICAL_URL, loadUnavailableRanges } from "@/features/availability/load-unavailable-ranges";
import { createPublicSupabaseClient } from "@/lib/supabase/public";

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
  return <><section className="page-hero"><span className="eyebrow">Plan with confidence</span><h1>Rates & Availability</h1><p>Unavailable dates are blanked out directly from the Coco Palms Google Calendar. Select available arrival and departure dates to begin your quotation.</p></section><section className="section availability-layout"><AvailabilityCalendar ranges={ranges} /><aside className="rates-card"><span className="eyebrow">Nightly rates</span><h3>Published rates</h3><dl><div><dt>15 May – 15 November</dt><dd>$1,200</dd></div><div><dt>16 November – 17 December</dt><dd>$1,250</dd></div><div><dt>18 December – 3 January</dt><dd>$1,500</dd></div><div><dt>4 January – 14 May</dt><dd>$1,250</dd></div></dl><p>Minimum stay is 5 nights. Four nights may be available with a $500 short-stay levy. A 10-night minimum applies over the festive period.</p><p className="form-note">All rates are USD and subject to taxes, government levy and fees shown in your quotation.</p></aside></section></>;
}
