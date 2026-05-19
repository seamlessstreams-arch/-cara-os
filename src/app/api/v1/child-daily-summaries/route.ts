import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";

// ── GET /api/v1/child-daily-summaries ────────────────────────────────────────
// Returns child daily summaries, optionally filtered.
// Query params: child_id, from_date, to_date, date

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const childId  = searchParams.get("child_id");
    const fromDate = searchParams.get("from_date");
    const toDate   = searchParams.get("to_date");
    const date     = searchParams.get("date");

    let summaries = db.childDailySummaries.findAll().filter((s) => s.home_id === "home_oak");

    if (childId)  summaries = summaries.filter((s) => s.child_id === childId);
    if (date)     summaries = summaries.filter((s) => s.summary_date === date);
    if (fromDate) summaries = summaries.filter((s) => s.summary_date >= fromDate);
    if (toDate)   summaries = summaries.filter((s) => s.summary_date <= toDate);

    // Enrich with child profile
    const enriched = summaries.map((s) => {
      const child = db.youngPeople.findById(s.child_id);
      // Fetch source care events for this child on this date
      const careEvents = db.careEvents
        .findByChild(s.child_id)
        .filter((ce) => ce.event_date === s.summary_date)
        .map((ce) => ({
          id: ce.id,
          title: ce.title,
          category: ce.category,
          status: ce.status,
          mood_score: ce.mood_score,
          is_significant: ce.is_significant,
          event_time: ce.event_time,
        }));

      return {
        ...s,
        child: child
          ? { id: child.id, name: `${child.first_name} ${child.last_name}`, date_of_birth: child.date_of_birth }
          : null,
        care_events: careEvents,
      };
    });

    // Sort newest first
    enriched.sort((a, b) => b.summary_date.localeCompare(a.summary_date));

    // Children who have summaries
    const childrenWithSummaries = [...new Set(enriched.map((s) => s.child_id))].length;

    // Dates with summaries
    const datesWithSummaries = [...new Set(enriched.map((s) => s.summary_date))].length;

    return NextResponse.json({
      summaries: enriched,
      meta: {
        total: enriched.length,
        children_count: childrenWithSummaries,
        dates_count: datesWithSummaries,
        significant_events: enriched.reduce((sum, s) => sum + s.significant_count, 0),
        total_events: enriched.reduce((sum, s) => sum + s.event_count, 0),
        require_followup: enriched.filter((s) => s.requires_followup).length,
      },
    });
  } catch (err) {
    console.error("[child-daily-summaries GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
