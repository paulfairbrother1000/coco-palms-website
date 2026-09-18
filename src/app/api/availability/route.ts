import { NextRequest, NextResponse } from "next/server";
import { COCO_PALMS_ICAL_URL, loadUnavailableRanges } from "@/features/availability/load-unavailable-ranges";
import { createPublicSupabaseClient } from "@/lib/supabase/public";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const start = params.get("start") ?? new Date().toISOString().slice(0, 10);
  const end = params.get("end") ?? `${new Date().getUTCFullYear() + 2}-12-31`;
  try {
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
        return data ?? [];
      },
    });
    return NextResponse.json({ ranges });
  } catch {
    return NextResponse.json({ error: "Availability could not be loaded." }, { status: 503 });
  }
}
