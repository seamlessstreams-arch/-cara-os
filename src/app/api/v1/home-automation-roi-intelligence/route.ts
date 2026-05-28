// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME AUTOMATION ROI INTELLIGENCE API ROUTE
// GET /api/v1/home-automation-roi-intelligence
// Synthesises savedTimeMetrics, careEventRoutes, and careEvents to assess
// platform automation effectiveness, time savings, routing success rates,
// and operational efficiency gains.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeAutomationROI,
  type SavedTimeMetricInput,
  type CareEventRouteInput,
  type CareEventBasicInput,
} from "@/lib/engines/home-automation-roi-intelligence-engine";

export async function GET() {
  try {
    const store = getStore();
    const today = new Date().toISOString().slice(0, 10);

    const staff = (store.staff ?? []) as any[];
    const total_staff = staff.filter((s: any) => s.is_active !== false).length;

    // Saved time metrics
    const rawMetrics = (store.savedTimeMetrics ?? []) as any[];
    const metrics: SavedTimeMetricInput[] = rawMetrics.map((m: any) => ({
      id: m.id ?? "",
      care_event_id: m.care_event_id ?? "",
      route_type: m.route_type ?? "",
      minutes_saved: typeof m.minutes_saved === "number" ? m.minutes_saved : 0,
      staff_id: m.staff_id ?? "",
      recorded_at: (m.recorded_at ?? today).toString().slice(0, 10),
    }));

    // Care event routes
    const rawRoutes = (store.careEventRoutes ?? []) as any[];
    const routes: CareEventRouteInput[] = rawRoutes.map((r: any) => ({
      id: r.id ?? "",
      care_event_id: r.care_event_id ?? "",
      route_type: r.route_type ?? "",
      status: r.status ?? "pending",
      has_error: !!(r.error_message && r.error_message.trim().length > 0),
      retry_count: typeof r.retry_count === "number" ? r.retry_count : 0,
      time_saved_minutes: typeof r.time_saved_minutes === "number" ? r.time_saved_minutes : 0,
      created_at: (r.created_at ?? today).toString().slice(0, 10),
    }));

    // Care events (basic info)
    const rawEvents = (store.careEvents ?? []) as any[];
    const events: CareEventBasicInput[] = rawEvents.map((e: any) => ({
      id: e.id ?? "",
      child_id: e.child_id ?? "",
      staff_id: e.staff_id ?? "",
      category: e.category ?? "general",
      date: (e.created_at ?? today).toString().slice(0, 10),
      has_routes: rawRoutes.some((r: any) => r.care_event_id === e.id),
    }));

    const result = computeAutomationROI({ today, total_staff, metrics, routes, events });
    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
