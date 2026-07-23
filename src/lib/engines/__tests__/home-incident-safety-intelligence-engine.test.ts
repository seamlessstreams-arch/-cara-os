// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME INCIDENT SAFETY INTELLIGENCE ENGINE TESTS
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeHomeIncidentSafety,
  type HomeIncidentSafetyInput,
  type IncidentInput,
  type RestraintInput,
  type NotifiableEventInput,
  type HandoverInput,
} from "../home-incident-safety-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeIncident(overrides: Partial<IncidentInput> = {}): IncidentInput {
  return {
    id: "inc_1",
    type: "physical_intervention",
    severity: "medium",
    child_id: "yp_alex",
    date: "2026-05-20",
    status: "closed",
    body_map_required: false,
    body_map_completed: false,
    requires_oversight: true,
    oversight_completed: true,
    notifications_sent: 2,
    has_lessons_learned: true,
    ...overrides,
  };
}

function makeRestraint(overrides: Partial<RestraintInput> = {}): RestraintInput {
  return {
    id: "rst_1",
    child_id: "yp_alex",
    date: "2026-05-15",
    duration_minutes: 3,
    has_child_debrief: true,
    has_staff_debrief: true,
    body_map_completed: true,
    injury_count: 0,
    ...overrides,
  };
}

function makeNotifiable(overrides: Partial<NotifiableEventInput> = {}): NotifiableEventInput {
  return {
    id: "ne_1",
    date: "2026-05-20",
    event_type: "restraint",
    ofsted_status: "notified_within_24h",
    ...overrides,
  };
}

function makeHandover(overrides: Partial<HandoverInput> = {}): HandoverInput {
  return {
    id: "hnd_1",
    shift_date: "2026-05-20",
    is_completed: true,
    is_signed_off: true,
    child_updates_count: 3,
    flags_count: 2,
    linked_incident_count: 0,
    ...overrides,
  };
}

function baseInput(overrides: Partial<HomeIncidentSafetyInput> = {}): HomeIncidentSafetyInput {
  return {
    today: "2026-05-26",
    total_children: 3,
    incidents: [
      makeIncident({ id: "i1", date: "2026-05-24", severity: "high", status: "open" }),
      makeIncident({ id: "i2", date: "2026-05-20", severity: "medium", status: "closed" }),
    ],
    restraints: [
      makeRestraint({ id: "r1", date: "2026-05-15" }),
    ],
    notifiable_events: [
      makeNotifiable({ id: "ne1" }),
    ],
    handovers: [
      makeHandover({ id: "h1", shift_date: "2026-05-26" }),
      makeHandover({ id: "h2", shift_date: "2026-05-25" }),
    ],
    ...overrides,
  };
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("Home Incident Safety Intelligence Engine", () => {

  // ── Structure ─────────────────────────────────────────────────────────────

  it("returns a well-shaped result", () => {
    const r = computeHomeIncidentSafety(baseInput());
    expect(r).toHaveProperty("incident_safety_rating");
    expect(r).toHaveProperty("incident_safety_score");
    expect(r).toHaveProperty("headline");
    expect(r).toHaveProperty("incidents");
    expect(r).toHaveProperty("restraints");
    expect(r).toHaveProperty("handovers");
    expect(r).toHaveProperty("strengths");
    expect(r).toHaveProperty("concerns");
    expect(r).toHaveProperty("recommendations");
    expect(r).toHaveProperty("insights");
  });

  it("assigns a valid rating", () => {
    const r = computeHomeIncidentSafety(baseInput());
    expect(["outstanding", "good", "adequate", "inadequate", "insufficient_data"]).toContain(r.incident_safety_rating);
  });

  it("scores between 0 and 100", () => {
    const r = computeHomeIncidentSafety(baseInput());
    expect(r.incident_safety_score).toBeGreaterThanOrEqual(0);
    expect(r.incident_safety_score).toBeLessThanOrEqual(100);
  });

  // ── Insufficient Data ─────────────────────────────────────────────────────

  it("returns insufficient_data with fewer than 2 records", () => {
    const r = computeHomeIncidentSafety(baseInput({
      incidents: [makeIncident()],
      restraints: [],
      notifiable_events: [],
      handovers: [],
    }));
    expect(r.incident_safety_rating).toBe("insufficient_data");
  });

  // ── Incident Profile ──────────────────────────────────────────────────────

  it("counts incidents in 30-day and 90-day windows", () => {
    const r = computeHomeIncidentSafety(baseInput({
      incidents: [
        makeIncident({ id: "i1", date: "2026-05-20" }),
        makeIncident({ id: "i2", date: "2026-05-10" }),
        makeIncident({ id: "i3", date: "2026-03-15" }),  // >30d but <=90d
      ],
    }));
    expect(r.incidents.total_30d).toBe(2);
    expect(r.incidents.total_90d).toBe(3);
  });

  it("counts open incidents", () => {
    const r = computeHomeIncidentSafety(baseInput({
      incidents: [
        makeIncident({ id: "i1", status: "open" }),
        makeIncident({ id: "i2", status: "closed" }),
        makeIncident({ id: "i3", status: "under_review" }),
      ],
    }));
    expect(r.incidents.open_count).toBe(2);
  });

  it("counts critical and high severity in 30 days", () => {
    const r = computeHomeIncidentSafety(baseInput({
      incidents: [
        makeIncident({ id: "i1", severity: "critical", date: "2026-05-22" }),
        makeIncident({ id: "i2", severity: "high", date: "2026-05-20" }),
        makeIncident({ id: "i3", severity: "medium", date: "2026-05-18" }),
      ],
    }));
    expect(r.incidents.critical_count_30d).toBe(1);
    expect(r.incidents.high_count_30d).toBe(1);
  });

  it("breaks down incidents by type", () => {
    const r = computeHomeIncidentSafety(baseInput({
      incidents: [
        makeIncident({ id: "i1", type: "physical_intervention" }),
        makeIncident({ id: "i2", type: "physical_intervention" }),
        makeIncident({ id: "i3", type: "missing_from_care" }),
      ],
    }));
    expect(r.incidents.by_type[0].type).toBe("physical_intervention");
    expect(r.incidents.by_type[0].count).toBe(2);
  });

  it("breaks down incidents by child", () => {
    const r = computeHomeIncidentSafety(baseInput({
      incidents: [
        makeIncident({ id: "i1", child_id: "yp_alex" }),
        makeIncident({ id: "i2", child_id: "yp_alex" }),
        makeIncident({ id: "i3", child_id: "yp_casey" }),
      ],
    }));
    expect(r.incidents.by_child[0].child_id).toBe("yp_alex");
    expect(r.incidents.by_child[0].count).toBe(2);
  });

  it("calculates body map compliance rate", () => {
    const r = computeHomeIncidentSafety(baseInput({
      incidents: [
        makeIncident({ id: "i1", body_map_required: true, body_map_completed: true }),
        makeIncident({ id: "i2", body_map_required: true, body_map_completed: false }),
        makeIncident({ id: "i3", body_map_required: false, body_map_completed: false }),
      ],
    }));
    expect(r.incidents.body_map_compliance_rate).toBe(50);
  });

  it("calculates oversight completion rate", () => {
    const r = computeHomeIncidentSafety(baseInput({
      incidents: [
        makeIncident({ id: "i1", requires_oversight: true, oversight_completed: true }),
        makeIncident({ id: "i2", requires_oversight: true, oversight_completed: false }),
        makeIncident({ id: "i3", requires_oversight: false, oversight_completed: false }),
      ],
    }));
    expect(r.incidents.oversight_completion_rate).toBe(50);
  });

  it("calculates lessons learned rate from closed incidents", () => {
    const r = computeHomeIncidentSafety(baseInput({
      incidents: [
        makeIncident({ id: "i1", status: "closed", has_lessons_learned: true }),
        makeIncident({ id: "i2", status: "closed", has_lessons_learned: false }),
        makeIncident({ id: "i3", status: "open", has_lessons_learned: false }),
      ],
    }));
    expect(r.incidents.lessons_learned_rate).toBe(50);
  });

  it("detects worsening incident trend", () => {
    const r = computeHomeIncidentSafety(baseInput({
      incidents: [
        makeIncident({ id: "i1", date: "2026-03-15" }),  // 72 days ago — first 45d half
        makeIncident({ id: "i2", date: "2026-05-10" }),  // last 45d
        makeIncident({ id: "i3", date: "2026-05-15" }),  // last 45d
        makeIncident({ id: "i4", date: "2026-05-20" }),  // last 45d
      ],
    }));
    expect(r.incidents.trend).toBe("worsening");
  });

  // ── Restraint Profile ─────────────────────────────────────────────────────

  it("counts restraints in 30-day and 90-day windows", () => {
    const r = computeHomeIncidentSafety(baseInput({
      restraints: [
        makeRestraint({ id: "r1", date: "2026-05-20" }),
        makeRestraint({ id: "r2", date: "2026-04-10" }),
        makeRestraint({ id: "r3", date: "2026-03-10" }),
      ],
    }));
    expect(r.restraints.total_30d).toBe(1);
    expect(r.restraints.total_90d).toBe(3);
  });

  it("calculates average duration", () => {
    const r = computeHomeIncidentSafety(baseInput({
      restraints: [
        makeRestraint({ id: "r1", duration_minutes: 3 }),
        makeRestraint({ id: "r2", duration_minutes: 7 }),
      ],
    }));
    expect(r.restraints.avg_duration_minutes).toBe(5);
  });

  it("counts long restraints (>10 min)", () => {
    const r = computeHomeIncidentSafety(baseInput({
      restraints: [
        makeRestraint({ id: "r1", duration_minutes: 3 }),
        makeRestraint({ id: "r2", duration_minutes: 12 }),
        makeRestraint({ id: "r3", duration_minutes: 15 }),
      ],
    }));
    expect(r.restraints.long_restraint_count).toBe(2);
  });

  it("calculates debrief rates", () => {
    const r = computeHomeIncidentSafety(baseInput({
      restraints: [
        makeRestraint({ id: "r1", has_child_debrief: true, has_staff_debrief: true }),
        makeRestraint({ id: "r2", has_child_debrief: false, has_staff_debrief: true }),
      ],
    }));
    expect(r.restraints.child_debrief_rate).toBe(50);
    expect(r.restraints.staff_debrief_rate).toBe(100);
  });

  it("counts injuries from restraints", () => {
    const r = computeHomeIncidentSafety(baseInput({
      restraints: [
        makeRestraint({ id: "r1", injury_count: 0 }),
        makeRestraint({ id: "r2", injury_count: 1 }),
        makeRestraint({ id: "r3", injury_count: 2 }),
      ],
    }));
    expect(r.restraints.injury_count).toBe(3);
  });

  it("breaks down restraints by child", () => {
    const r = computeHomeIncidentSafety(baseInput({
      restraints: [
        makeRestraint({ id: "r1", child_id: "yp_alex" }),
        makeRestraint({ id: "r2", child_id: "yp_alex" }),
        makeRestraint({ id: "r3", child_id: "yp_casey" }),
      ],
    }));
    expect(r.restraints.by_child[0].child_id).toBe("yp_alex");
    expect(r.restraints.by_child[0].count).toBe(2);
  });

  // ── Handover Profile ──────────────────────────────────────────────────────

  it("counts handovers in 30 days", () => {
    const r = computeHomeIncidentSafety(baseInput());
    expect(r.handovers.total_30d).toBe(2);
  });

  it("calculates handover completion rate", () => {
    const r = computeHomeIncidentSafety(baseInput({
      handovers: [
        makeHandover({ id: "h1", is_completed: true }),
        makeHandover({ id: "h2", is_completed: false }),
      ],
    }));
    expect(r.handovers.completion_rate).toBe(50);
  });

  it("calculates handover sign-off rate", () => {
    const r = computeHomeIncidentSafety(baseInput({
      handovers: [
        makeHandover({ id: "h1", is_signed_off: true }),
        makeHandover({ id: "h2", is_signed_off: false }),
        makeHandover({ id: "h3", is_signed_off: true }),
      ],
    }));
    expect(r.handovers.sign_off_rate).toBe(67);
  });

  it("calculates average flags per handover", () => {
    const r = computeHomeIncidentSafety(baseInput({
      handovers: [
        makeHandover({ id: "h1", flags_count: 3 }),
        makeHandover({ id: "h2", flags_count: 1 }),
      ],
    }));
    expect(r.handovers.avg_flags_per_handover).toBe(2);
  });

  // ── Scoring ───────────────────────────────────────────────────────────────

  it("scores high with no incidents and strong compliance", () => {
    const r = computeHomeIncidentSafety(baseInput({
      incidents: [],
      restraints: [],
      notifiable_events: [],
      handovers: [
        makeHandover({ id: "h1" }),
        makeHandover({ id: "h2" }),
        makeHandover({ id: "h3" }),
      ],
    }));
    expect(r.incident_safety_score).toBeGreaterThanOrEqual(65);
    expect(["outstanding", "good"]).toContain(r.incident_safety_rating);
  });

  it("scores lower with many critical incidents", () => {
    const r = computeHomeIncidentSafety(baseInput({
      incidents: [
        makeIncident({ id: "i1", severity: "critical", date: "2026-05-24", status: "open", body_map_required: true, body_map_completed: false }),
        makeIncident({ id: "i2", severity: "critical", date: "2026-05-22", status: "open" }),
        makeIncident({ id: "i3", severity: "high", date: "2026-05-20", status: "open" }),
        makeIncident({ id: "i4", severity: "high", date: "2026-05-18", status: "open" }),
      ],
      restraints: [
        makeRestraint({ id: "r1", date: "2026-05-24", injury_count: 1, has_child_debrief: false }),
        makeRestraint({ id: "r2", date: "2026-05-22", injury_count: 1 }),
        makeRestraint({ id: "r3", date: "2026-05-20" }),
      ],
    }));
    expect(r.incident_safety_score).toBeLessThan(45);
    expect(r.incident_safety_rating).toBe("inadequate");
  });

  it("penalises pending notifiable events", () => {
    const withPending = baseInput({
      notifiable_events: [
        makeNotifiable({ id: "ne1", ofsted_status: "pending" }),
      ],
    });
    const noPending = baseInput({
      notifiable_events: [
        makeNotifiable({ id: "ne1", ofsted_status: "notified_within_24h" }),
      ],
    });
    const rWith = computeHomeIncidentSafety(withPending);
    const rNo = computeHomeIncidentSafety(noPending);
    expect(rNo.incident_safety_score).toBeGreaterThan(rWith.incident_safety_score);
  });

  // ── Strengths ─────────────────────────────────────────────────────────────

  it("generates strength for zero incidents in 30 days", () => {
    const r = computeHomeIncidentSafety(baseInput({
      incidents: [],
    }));
    expect(r.strengths.some(s => s.includes("No incidents") && s.includes("30 days"))).toBe(true);
  });

  it("generates strength for 100% body map compliance", () => {
    const r = computeHomeIncidentSafety(baseInput({
      incidents: [
        makeIncident({ id: "i1", body_map_required: true, body_map_completed: true }),
      ],
    }));
    expect(r.strengths.some(s => s.includes("100% body map"))).toBe(true);
  });

  it("generates strength for 100% debrief compliance", () => {
    const r = computeHomeIncidentSafety(baseInput({
      restraints: [
        makeRestraint({ id: "r1", has_child_debrief: true, has_staff_debrief: true }),
      ],
    }));
    expect(r.strengths.some(s => s.includes("100% debrief") || s.includes("debrief compliance"))).toBe(true);
  });

  // ── Concerns ──────────────────────────────────────────────────────────────

  it("flags critical incidents as concern", () => {
    const r = computeHomeIncidentSafety(baseInput({
      incidents: [
        makeIncident({ id: "i1", severity: "critical", date: "2026-05-24" }),
        makeIncident({ id: "i2", severity: "critical", date: "2026-05-22" }),
      ],
    }));
    expect(r.concerns.some(c => c.includes("critical"))).toBe(true);
  });

  it("flags restraint injuries as concern", () => {
    const r = computeHomeIncidentSafety(baseInput({
      restraints: [
        makeRestraint({ id: "r1", injury_count: 1 }),
      ],
    }));
    expect(r.concerns.some(c => c.includes("injur"))).toBe(true);
  });

  it("flags incident concentration on one child", () => {
    const r = computeHomeIncidentSafety(baseInput({
      total_children: 3,
      incidents: [
        makeIncident({ id: "i1", child_id: "yp_alex" }),
        makeIncident({ id: "i2", child_id: "yp_alex" }),
        makeIncident({ id: "i3", child_id: "yp_alex" }),
        makeIncident({ id: "i4", child_id: "yp_alex" }),
        makeIncident({ id: "i5", child_id: "yp_casey" }),
      ],
    }));
    expect(r.concerns.some(c => c.includes("yp_alex") && c.includes("support plan"))).toBe(true);
  });

  // ── Recommendations ───────────────────────────────────────────────────────

  it("recommends closing open incidents", () => {
    const r = computeHomeIncidentSafety(baseInput({
      incidents: [
        makeIncident({ id: "i1", status: "open" }),
        makeIncident({ id: "i2", status: "open" }),
        makeIncident({ id: "i3", status: "open" }),
      ],
    }));
    const rec = r.recommendations.find(r => r.recommendation.includes("open incident"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("immediate");
  });

  it("recommends submitting pending NEs", () => {
    const r = computeHomeIncidentSafety(baseInput({
      notifiable_events: [
        makeNotifiable({ id: "ne1", ofsted_status: "pending" }),
      ],
    }));
    const rec = r.recommendations.find(r => r.recommendation.includes("pending Ofsted"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("immediate");
  });

  it("recommends reviewing restraint injuries", () => {
    const r = computeHomeIncidentSafety(baseInput({
      restraints: [
        makeRestraint({ id: "r1", injury_count: 1 }),
      ],
    }));
    const rec = r.recommendations.find(r => r.recommendation.includes("injur"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("soon");
  });

  // ── Insights ──────────────────────────────────────────────────────────────

  it("generates critical insight for multiple critical incidents", () => {
    const r = computeHomeIncidentSafety(baseInput({
      incidents: [
        makeIncident({ id: "i1", severity: "critical", date: "2026-05-24" }),
        makeIncident({ id: "i2", severity: "critical", date: "2026-05-22" }),
      ],
    }));
    const ins = r.insights.find(i => i.severity === "critical" && i.text.includes("critical incidents"));
    expect(ins).toBeDefined();
  });

  it("generates positive insight for settled home", () => {
    const r = computeHomeIncidentSafety(baseInput({
      incidents: [],
      restraints: [],
      handovers: [makeHandover({ id: "h1" })],
    }));
    const ins = r.insights.find(i => i.severity === "positive" && i.text.includes("settled"));
    expect(ins).toBeDefined();
  });

  it("generates warning for worsening restraint trend", () => {
    const r = computeHomeIncidentSafety(baseInput({
      restraints: [
        makeRestraint({ id: "r1", date: "2026-05-24" }),
        makeRestraint({ id: "r2", date: "2026-05-20" }),
      ],
    }));
    // trend = worsening because both in last 45d, none in first 45d
    expect(r.restraints.trend).toBe("worsening");
  });

  // ── Headlines ─────────────────────────────────────────────────────────────

  it("produces a non-empty headline", () => {
    const r = computeHomeIncidentSafety(baseInput());
    expect(r.headline.length).toBeGreaterThan(0);
  });

  // ── Edge Cases ────────────────────────────────────────────────────────────

  it("handles zero children gracefully", () => {
    const r = computeHomeIncidentSafety(baseInput({ total_children: 0 }));
    expect(r.incident_safety_score).toBeGreaterThanOrEqual(0);
  });

  it("reports body map compliance as unmeasured when no incident required one", () => {
    const r = computeHomeIncidentSafety(baseInput({
      incidents: [
        makeIncident({ id: "i1", body_map_required: false }),
      ],
    }));
    expect(r.incidents.body_map_compliance_rate).toBeNull();
    expect(r.strengths.some(s => s.includes("body map"))).toBe(false);
    expect(r.concerns.some(c => c.includes("Body map"))).toBe(false);
  });

  it("reports lessons learned as unmeasured when nothing is closed", () => {
    const r = computeHomeIncidentSafety(baseInput({
      incidents: [
        makeIncident({ id: "i1", status: "open" }),
      ],
    }));
    expect(r.incidents.lessons_learned_rate).toBeNull();
    expect(r.strengths.some(s => s.includes("Lessons learned"))).toBe(false);
  });

  it("reports debrief rates as unmeasured when there are no restraints", () => {
    const r = computeHomeIncidentSafety(baseInput({
      restraints: [],
    }));
    expect(r.restraints.child_debrief_rate).toBeNull();
    expect(r.restraints.staff_debrief_rate).toBeNull();
    expect(r.restraints.body_map_rate).toBeNull();
    expect(r.restraints.avg_duration_minutes).toBeNull();
    expect(r.strengths.some(s => s.includes("debrief compliance"))).toBe(false);
  });

  it("handles no handovers in 30 days", () => {
    const r = computeHomeIncidentSafety(baseInput({
      handovers: [],
    }));
    expect(r.handovers.completion_rate).toBeNull();
    expect(r.handovers.sign_off_rate).toBeNull();
    expect(r.handovers.avg_flags_per_handover).toBeNull();
    expect(r.handovers.incident_linked_rate).toBeNull();
    expect(r.handovers.total_30d).toBe(0);
    expect(r.concerns.some(c => c.includes("Handover completion"))).toBe(false);
  });

  it("excludes future-dated incidents from counts", () => {
    const r = computeHomeIncidentSafety(baseInput({
      incidents: [
        makeIncident({ id: "i1", date: "2026-05-20" }),
        makeIncident({ id: "i2", date: "2026-06-15" }),  // future
      ],
    }));
    expect(r.incidents.total_30d).toBe(1);
  });
});
