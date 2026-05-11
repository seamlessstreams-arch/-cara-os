// ══════════════════════════════════════════════════════════════════════════════
// Saved-Time Live Dashboard — engine tests (Milestone 28)
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db/store";
import { loadSavedTimeDashboard } from "@/lib/care-events/saved-time-dashboard";
import type { RouteType } from "@/types/care-events";

const HOME_ID = "home_savedtime_test";

function clearAll() {
  const rows = db.savedTimeMetrics.findAll();
  for (const r of rows.filter((x) => x.home_id === HOME_ID)) {
    const i = rows.indexOf(r); if (i >= 0) rows.splice(i, 1);
  }
}

function seed(opts: {
  care_event_id: string;
  route_type: RouteType;
  minutes_saved: number;
  staff_id: string;
  recorded_at: string;
}) {
  return db.savedTimeMetrics.upsert({
    home_id: HOME_ID,
    activity_description: "auto-routed",
    ...opts,
  });
}

beforeEach(() => clearAll());

describe("loadSavedTimeDashboard", () => {
  it("returns zeros for an empty home", () => {
    const d = loadSavedTimeDashboard(HOME_ID);
    expect(d.all_time.total_minutes).toBe(0);
    expect(d.all_time.total_hours).toBe(0);
    expect(d.all_time.events).toBe(0);
    expect(d.all_time.records).toBe(0);
    expect(d.all_time.by_route_type).toEqual([]);
    expect(d.last_7_days.total_minutes).toBe(0);
    expect(d.last_30_days.total_minutes).toBe(0);
  });

  it("aggregates total minutes and converts to hours (1dp)", () => {
    const now = new Date().toISOString();
    seed({ care_event_id: "ce1", route_type: "incident",  minutes_saved: 30, staff_id: "s1", recorded_at: now });
    seed({ care_event_id: "ce2", route_type: "daily_log", minutes_saved: 45, staff_id: "s1", recorded_at: now });
    const d = loadSavedTimeDashboard(HOME_ID);
    expect(d.all_time.total_minutes).toBe(75);
    expect(d.all_time.total_hours).toBe(1.3); // 75/60 = 1.25 → rounded to 1.3
    expect(d.all_time.records).toBe(2);
  });

  it("counts distinct care events not records", () => {
    const now = new Date().toISOString();
    seed({ care_event_id: "ce1", route_type: "incident",  minutes_saved: 10, staff_id: "s1", recorded_at: now });
    seed({ care_event_id: "ce1", route_type: "daily_log", minutes_saved: 10, staff_id: "s1", recorded_at: now });
    const d = loadSavedTimeDashboard(HOME_ID);
    expect(d.all_time.records).toBe(2);
    expect(d.all_time.events).toBe(1);
  });

  it("buckets by route_type, sorted by minutes desc", () => {
    const now = new Date().toISOString();
    seed({ care_event_id: "a", route_type: "incident",  minutes_saved: 10, staff_id: "s1", recorded_at: now });
    seed({ care_event_id: "b", route_type: "daily_log", minutes_saved: 30, staff_id: "s1", recorded_at: now });
    seed({ care_event_id: "c", route_type: "daily_log", minutes_saved: 5,  staff_id: "s1", recorded_at: now });
    const d = loadSavedTimeDashboard(HOME_ID);
    expect(d.all_time.by_route_type[0].route_type).toBe("daily_log");
    expect(d.all_time.by_route_type[0].minutes_saved).toBe(35);
    expect(d.all_time.by_route_type[1].route_type).toBe("incident");
  });

  it("buckets by staff", () => {
    const now = new Date().toISOString();
    seed({ care_event_id: "a", route_type: "incident", minutes_saved: 10, staff_id: "s1", recorded_at: now });
    seed({ care_event_id: "b", route_type: "incident", minutes_saved: 50, staff_id: "s2", recorded_at: now });
    const d = loadSavedTimeDashboard(HOME_ID);
    expect(d.all_time.by_staff[0].staff_id).toBe("s2");
    expect(d.all_time.by_staff[0].minutes_saved).toBe(50);
  });

  it("groups by_day ascending", () => {
    seed({ care_event_id: "a", route_type: "incident", minutes_saved: 10, staff_id: "s", recorded_at: "2026-05-01T12:00:00Z" });
    seed({ care_event_id: "b", route_type: "incident", minutes_saved: 20, staff_id: "s", recorded_at: "2026-05-03T12:00:00Z" });
    seed({ care_event_id: "c", route_type: "incident", minutes_saved: 5,  staff_id: "s", recorded_at: "2026-05-01T18:00:00Z" });
    const d = loadSavedTimeDashboard(HOME_ID);
    expect(d.all_time.by_day.map((x) => x.date)).toEqual(["2026-05-01", "2026-05-03"]);
    expect(d.all_time.by_day[0].minutes_saved).toBe(15);
  });

  it("filters last_7_days and last_30_days windows by recorded_at", () => {
    const now = new Date();
    const recent = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString();
    const older  = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString();
    const ancient= new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString();
    seed({ care_event_id: "r", route_type: "incident", minutes_saved: 10, staff_id: "s", recorded_at: recent });
    seed({ care_event_id: "o", route_type: "incident", minutes_saved: 20, staff_id: "s", recorded_at: older });
    seed({ care_event_id: "x", route_type: "incident", minutes_saved: 99, staff_id: "s", recorded_at: ancient });
    const d = loadSavedTimeDashboard(HOME_ID);
    expect(d.last_7_days.total_minutes).toBe(10);
    expect(d.last_30_days.total_minutes).toBe(30);
    expect(d.all_time.total_minutes).toBe(129);
  });

  it("excludes other homes", () => {
    db.savedTimeMetrics.upsert({
      home_id: "other_home", care_event_id: "z", route_type: "incident",
      minutes_saved: 999, staff_id: "s", recorded_at: new Date().toISOString(),
      activity_description: "x",
    });
    const d = loadSavedTimeDashboard(HOME_ID);
    expect(d.all_time.total_minutes).toBe(0);
  });

  it("recent activity newest first capped at 20", () => {
    for (let i = 0; i < 25; i++) {
      seed({
        care_event_id: `ce${i}`,
        route_type: "incident",
        minutes_saved: 1,
        staff_id: "s",
        recorded_at: `2026-04-${String((i % 28) + 1).padStart(2, "0")}T12:00:00Z`,
      });
    }
    const d = loadSavedTimeDashboard(HOME_ID);
    expect(d.all_time.recent.length).toBe(20);
    for (let i = 1; i < d.all_time.recent.length; i++) {
      expect(
        d.all_time.recent[i - 1].recorded_at >= d.all_time.recent[i].recorded_at,
      ).toBe(true);
    }
  });
});
