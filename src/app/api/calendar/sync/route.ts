import { NextResponse } from "next/server";
import { COCO_PALMS_ICAL_URL } from "@/features/availability/load-unavailable-ranges";
import { parseGoogleCalendarIcs, type CalendarEvent } from "@/features/availability/parse-ical";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

type Dependencies = {
  secret: string | undefined;
  fetchIcs: () => Promise<string>;
  syncEvents: (events: CalendarEvent[]) => Promise<void>;
};

function defaultDependencies(): Dependencies {
  return {
    secret: process.env.CRON_SECRET,
    async fetchIcs() {
      const url = process.env.GOOGLE_CALENDAR_ICAL_URL ?? COCO_PALMS_ICAL_URL;
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) throw new Error("Google Calendar could not be loaded.");
      return response.text();
    },
    async syncEvents(events) {
      const { error } = await createAdminSupabaseClient().rpc("sync_google_calendar_blocks", { p_property_slug: "coco-palms", p_events: events.map((event) => ({ uid: event.uid, start_date: event.startDate, end_date: event.endDate, summary: event.summary })) });
      if (error) throw error;
    },
  };
}

export function createCalendarSyncHandler(dependencies: Dependencies) {
  return async function handler(request: Request) {
    if (!dependencies.secret || request.headers.get("authorization") !== `Bearer ${dependencies.secret}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    try {
      const events = parseGoogleCalendarIcs(await dependencies.fetchIcs());
      await dependencies.syncEvents(events);
      return NextResponse.json({ ok: true, imported: events.length });
    } catch {
      return NextResponse.json({ error: "Calendar synchronization failed." }, { status: 503 });
    }
  };
}

const handler = createCalendarSyncHandler(defaultDependencies());
export const GET = handler;
export const POST = handler;
