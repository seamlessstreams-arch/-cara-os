// ══════════════════════════════════════════════════════════════════════════════
// Saved-Time Live Dashboard  (Milestone 28)
//
// CLAUDE.md spec: "saved-time dashboard" must be a live update target.
// SavedTimeMetric rows are written by the routing processor whenever a route
// completes. This engine aggregates them per home into a live, multi-window
// dashboard suitable for the manager and the Responsible Individual.
//
// Read-only.
// ══════════════════════════════════════════════════════════════════════════════

import { db } from "@/lib/db/store";
import type { RouteType, SavedTimeMetric } from "@/types/care-events";

export interface SavedTimeBucketByRoute {
  route_type: RouteType;
  minutes_saved: number;
  events: number;
}

export interface SavedTimeBucketByStaff {
  staff_id: string;
  minutes_saved: number;
  events: number;
}

export interface SavedTimeBucketByDay {
  date: string;          // YYYY-MM-DD UTC
  minutes_saved: number;
  events: number;
}

export interface SavedTimeWindow {
  total_minutes: number;
  total_hours: number;          // 1dp
  events: number;               // distinct care events
  records: number;              // SavedTimeMetric row count
  by_route_type: SavedTimeBucketByRoute[]; // sorted desc by minutes_saved
  by_staff: SavedTimeBucketByStaff[];      // sorted desc by minutes_saved
  by_day: SavedTimeBucketByDay[];          // ascending by date
  recent: SavedTimeMetric[];               // newest 20
}

export interface SavedTimeDashboard {
  home_id: string;
  generated_at: string;
  all_time: SavedTimeWindow;
  last_7_days: SavedTimeWindow;
  last_30_days: SavedTimeWindow;
}

function toDate(iso: string): string {
  return iso.slice(0, 10);
}

function buildWindow(rows: SavedTimeMetric[]): SavedTimeWindow {
  const total_minutes = rows.reduce((acc, m) => acc + (m.minutes_saved || 0), 0);
  const events = new Set(rows.map((m) => m.care_event_id)).size;

  // by route_type
  const byRouteMap = new Map<RouteType, SavedTimeBucketByRoute>();
  for (const m of rows) {
    const cur = byRouteMap.get(m.route_type) ?? {
      route_type: m.route_type, minutes_saved: 0, events: 0,
    };
    cur.minutes_saved += m.minutes_saved || 0;
    cur.events += 1;
    byRouteMap.set(m.route_type, cur);
  }
  const by_route_type = [...byRouteMap.values()]
    .sort((a, b) => b.minutes_saved - a.minutes_saved);

  // by staff
  const byStaffMap = new Map<string, SavedTimeBucketByStaff>();
  for (const m of rows) {
    const sid = m.staff_id || "(unknown)";
    const cur = byStaffMap.get(sid) ?? { staff_id: sid, minutes_saved: 0, events: 0 };
    cur.minutes_saved += m.minutes_saved || 0;
    cur.events += 1;
    byStaffMap.set(sid, cur);
  }
  const by_staff = [...byStaffMap.values()]
    .sort((a, b) => b.minutes_saved - a.minutes_saved);

  // by day
  const byDayMap = new Map<string, SavedTimeBucketByDay>();
  for (const m of rows) {
    const d = toDate(m.recorded_at);
    const cur = byDayMap.get(d) ?? { date: d, minutes_saved: 0, events: 0 };
    cur.minutes_saved += m.minutes_saved || 0;
    cur.events += 1;
    byDayMap.set(d, cur);
  }
  const by_day = [...byDayMap.values()].sort((a, b) => a.date.localeCompare(b.date));

  const recent = [...rows]
    .sort((a, b) => b.recorded_at.localeCompare(a.recorded_at))
    .slice(0, 20);

  return {
    total_minutes,
    total_hours: Math.round((total_minutes / 60) * 10) / 10,
    events,
    records: rows.length,
    by_route_type,
    by_staff,
    by_day,
    recent,
  };
}

export function loadSavedTimeDashboard(homeId: string): SavedTimeDashboard {
  const all = db.savedTimeMetrics.findByHome(homeId);
  const now = Date.now();
  const cutoff7  = now - 7  * 24 * 60 * 60 * 1000;
  const cutoff30 = now - 30 * 24 * 60 * 60 * 1000;

  const last7  = all.filter((m) => Date.parse(m.recorded_at) >= cutoff7);
  const last30 = all.filter((m) => Date.parse(m.recorded_at) >= cutoff30);

  return {
    home_id: homeId,
    generated_at: new Date().toISOString(),
    all_time:     buildWindow(all),
    last_7_days:  buildWindow(last7),
    last_30_days: buildWindow(last30),
  };
}
