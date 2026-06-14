// ══════════════════════════════════════════════════════════════════════════════
// Cara Safeguarding pattern engine tests
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { db } from "@/lib/db/store";
import { runSafeguardingScan } from "@/lib/cara/cara-safeguarding-patterns";

const HOME_ID = "home_oak_sg_test";
const CHILD_ID = "yp_sg_test";

function todayMinus(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function makeIncident(severity: "low" | "medium" | "high" | "critical", date: string, time = "14:00") {
  return db.incidents.create({
    reference: `INC-${Math.random().toString(36).slice(2, 8)}`,
    type: "physical_intervention",
    severity,
    child_id: CHILD_ID,
    date,
    time,
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
}

describe("runSafeguardingScan", () => {
  it("produces an empty result with no records", () => {
    const result = runSafeguardingScan("home_with_no_records_at_all");
    expect(result.patterns).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
    expect(result.inspected.incidents).toBe(0);
  });

  it("detects repeat missing episodes and emits an early warning", () => {
    db.missingEpisodes.create({
      child_id: CHILD_ID,
      date_missing: todayMinus(2),
      time_missing: "14:00",
      date_returned: null,
      time_returned: null,
      duration_hours: null,
      risk_level: "high",
      location_last_seen: "park",
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
      status: "returned",
      home_id: HOME_ID,
    });
    db.missingEpisodes.create({
      child_id: CHILD_ID,
      date_missing: todayMinus(5),
      time_missing: "16:00",
      date_returned: null,
      time_returned: null,
      duration_hours: null,
      risk_level: "medium",
      location_last_seen: "town",
      return_location: null,
      reported_to_police: false,
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
      status: "returned",
      home_id: HOME_ID,
    });

    const r = runSafeguardingScan(HOME_ID);
    const repeat = r.patterns.find((p) => p.pattern_type === "repeat_missing");
    expect(repeat).toBeDefined();
    expect(repeat!.severity).toBe("critical");
    expect(repeat!.is_ai_draft).toBe(true);
    const warning = r.warnings.find((w) => w.warning_type === "repeat_missing");
    expect(warning).toBeDefined();
    expect(warning!.recommended_action).toMatch(/contextual safeguarding/i);
  });

  it("is idempotent: running twice does not create duplicate patterns or warnings", () => {
    makeIncident("low", todayMinus(10));
    makeIncident("medium", todayMinus(5));
    makeIncident("critical", todayMinus(1));
    const a = runSafeguardingScan(HOME_ID);
    const b = runSafeguardingScan(HOME_ID);
    const escalA = a.patterns.filter((p) => p.pattern_type === "escalating_severity");
    const escalB = b.patterns.filter((p) => p.pattern_type === "escalating_severity");
    expect(escalA.length).toBeGreaterThanOrEqual(1);
    expect(escalB.length).toBeGreaterThanOrEqual(1);
    // Same id reused for the open pattern
    expect(escalA[0].id).toBe(escalB[0].id);

    const allOpen = db.caraSafeguardingPatterns.findOpen(HOME_ID);
    const escalCount = allOpen.filter(
      (p) => p.pattern_type === "escalating_severity" && p.child_id === CHILD_ID,
    ).length;
    expect(escalCount).toBe(1);
  });

  it("flags oversight gap when an incident has been awaiting oversight for >= 3 days", () => {
    makeIncident("medium", todayMinus(7));
    const r = runSafeguardingScan(HOME_ID);
    const gap = r.patterns.find((p) => p.pattern_type === "oversight_gap");
    expect(gap).toBeDefined();
  });

  it("detects night-time clustering when 40%+ of incidents fall between 9pm and 6am", () => {
    makeIncident("medium", todayMinus(3), "23:00");
    makeIncident("medium", todayMinus(4), "01:00");
    makeIncident("medium", todayMinus(5), "22:00");
    const r = runSafeguardingScan(HOME_ID);
    const night = r.patterns.find((p) => p.pattern_type === "night_time_cluster");
    expect(night).toBeDefined();
  });
});
