import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";

// ── GET /api/v1/saved-time ────────────────────────────────────────────────────
// Returns saved-time metrics aggregated across all care event routes.
// Query params: staff_id, route_type, from_date, to_date

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const staffId   = searchParams.get("staff_id");
    const routeType = searchParams.get("route_type");
    const fromDate  = searchParams.get("from_date");
    const toDate    = searchParams.get("to_date");

    let metrics = db.savedTimeMetrics.findByHome("home_oak");

    if (staffId)   metrics = metrics.filter((m) => m.staff_id === staffId);
    if (routeType) metrics = metrics.filter((m) => m.route_type === routeType);
    if (fromDate)  metrics = metrics.filter((m) => m.recorded_at >= fromDate);
    if (toDate)    metrics = metrics.filter((m) => m.recorded_at <= toDate);

    const totalMinutes = metrics.reduce((sum, m) => sum + m.minutes_saved, 0);
    const totalHours   = +(totalMinutes / 60).toFixed(1);

    // Per-route breakdown
    const byRoute: Record<string, { minutes: number; count: number }> = {};
    for (const m of metrics) {
      if (!byRoute[m.route_type]) byRoute[m.route_type] = { minutes: 0, count: 0 };
      byRoute[m.route_type].minutes += m.minutes_saved;
      byRoute[m.route_type].count += 1;
    }

    // Per-staff breakdown
    const byStaff: Record<string, { minutes: number; count: number }> = {};
    for (const m of metrics) {
      if (!byStaff[m.staff_id]) byStaff[m.staff_id] = { minutes: 0, count: 0 };
      byStaff[m.staff_id].minutes += m.minutes_saved;
      byStaff[m.staff_id].count += 1;
    }

    // Daily breakdown (last 30 days)
    const daily: Record<string, number> = {};
    for (const m of metrics) {
      const day = m.recorded_at.slice(0, 10);
      daily[day] = (daily[day] ?? 0) + m.minutes_saved;
    }
    const dailyArray = Object.entries(daily)
      .map(([date, minutes]) => ({ date, minutes }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30);

    // Enrich top entries with care event
    const topEntries = [...metrics]
      .sort((a, b) => b.minutes_saved - a.minutes_saved)
      .slice(0, 50)
      .map((m) => {
        const careEvent = db.careEvents.findById(m.care_event_id);
        return {
          ...m,
          care_event: careEvent
            ? { id: careEvent.id, title: careEvent.title, category: careEvent.category, event_date: careEvent.event_date }
            : null,
        };
      });

    return NextResponse.json({
      metrics: topEntries,
      meta: {
        total_minutes: totalMinutes,
        total_hours: totalHours,
        total_entries: metrics.length,
        by_route: byRoute,
        by_staff: byStaff,
        daily: dailyArray,
        // Estimate: £14/hr average staff cost
        estimated_value_gbp: +(totalHours * 14).toFixed(2),
      },
    });
  } catch (err) {
    console.error("[saved-time GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
