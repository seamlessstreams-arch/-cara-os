// ══════════════════════════════════════════════════════════════════════════════
// ARIA Home Dynamics snapshotter tests
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db/store";
import { generateHomeDynamicsSnapshot } from "@/lib/aria/aria-home-dynamics";

const HOME_ID = "home_oak";

function todayMinus(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

describe("generateHomeDynamicsSnapshot", () => {
  beforeEach(() => {
    // Best-effort cleanup for snapshot list between runs (collection
    // appended to in-memory). We only assert on counts produced *now*.
  });

  it("creates a snapshot with the expected shape", () => {
    const snap = generateHomeDynamicsSnapshot(HOME_ID, { windowDays: 14 });
    expect(snap.id).toMatch(/^hds_/);
    expect(snap.home_id).toBe(HOME_ID);
    expect(snap.window_days).toBe(14);
    expect(snap.indicators.length).toBeGreaterThan(0);
    expect(["green", "amber", "red"]).toContain(snap.overall_status);
    expect(snap.is_ai_draft).toBe(true);
    expect(snap.narrative_summary).toMatch(/manager review required/i);
  });

  it("counts incidents in window for the home", () => {
    db.incidents.create({
      reference: "INC-TEST-1",
      type: "physical_intervention",
      severity: "high",
      child_id: "yp_alex",
      date: todayMinus(2),
      time: "12:00",
      location: null,
      description: "test",
      immediate_action: "test",
      reported_by: "u1",
      witnesses: [],
      body_map_required: false,
      body_map_completed: false,
      body_map_url: null,
      notifications: [],
      requires_oversight: true,
      oversight_note: null,
      oversight_by: null,
      oversight_at: null,
      status: "open",
      outcome: null,
      lessons_learned: null,
      linked_task_ids: [],
      linked_document_ids: [],
      home_id: HOME_ID,
    });

    const snap = generateHomeDynamicsSnapshot(HOME_ID, { windowDays: 7 });
    expect(snap.incidents_total).toBeGreaterThanOrEqual(1);
    expect(snap.incidents_high_severity).toBeGreaterThanOrEqual(1);
    expect(snap.incidents_oversight_outstanding).toBeGreaterThanOrEqual(1);
  });

  it("ignores incidents outside the window", () => {
    const snap = generateHomeDynamicsSnapshot(HOME_ID, { windowDays: 1, asOf: todayMinus(365) });
    expect(snap.incidents_total).toBe(0);
    expect(snap.restraints_total).toBe(0);
  });

  it("persists each snapshot and exposes latestForHome", () => {
    const before = db.ariaHomeDynamicsSnapshots.findAll(HOME_ID).length;
    const a = generateHomeDynamicsSnapshot(HOME_ID, { windowDays: 7 });
    const b = generateHomeDynamicsSnapshot(HOME_ID, { windowDays: 28 });
    const after = db.ariaHomeDynamicsSnapshots.findAll(HOME_ID).length;
    expect(after).toBe(before + 2);
    expect(db.ariaHomeDynamicsSnapshots.findById(a.id)).not.toBeUndefined();
    expect(db.ariaHomeDynamicsSnapshots.findById(b.id)).not.toBeUndefined();
    expect(db.ariaHomeDynamicsSnapshots.latestForHome(HOME_ID)).not.toBeNull();
  });

  it("computes 100% staffing stability when there are no shifts", () => {
    const snap = generateHomeDynamicsSnapshot("home_does_not_exist", { windowDays: 7 });
    expect(snap.staffing_stability_pct).toBe(100);
    expect(snap.shifts_scheduled).toBe(0);
  });

  it("escalates overall_status to red when an active missing episode exists", () => {
    db.missingEpisodes.create({
      child_id: "yp_alex",
      date_missing: todayMinus(0),
      time_missing: "10:00",
      date_returned: null,
      time_returned: null,
      duration_hours: null,
      risk_level: "high",
      location_last_seen: "school",
      return_location: null,
      reported_to_police: true,
      police_reference: null,
      reported_to_la: false,
      la_notified_at: null,
      return_interview_completed: false,
      return_interview_by: null,
      return_interview_date: null,
      return_interview_notes: null,
      contextual_safeguarding_risk: false,
      linked_incident_id: null,
      pattern_notes: null,
      status: "active",
      home_id: HOME_ID,
    });
    const snap = generateHomeDynamicsSnapshot(HOME_ID, { windowDays: 7 });
    expect(snap.missing_episodes_active).toBeGreaterThanOrEqual(1);
    expect(snap.overall_status).toBe("red");
  });
});
