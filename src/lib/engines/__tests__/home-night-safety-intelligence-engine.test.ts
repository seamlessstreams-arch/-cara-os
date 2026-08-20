// ══════════════════════════════════════════════════════════════════════════════
// TESTS — Home Night Safety Intelligence Engine
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeHomeNightSafety,
  type HomeNightSafetyInput,
  type WelfareCheckInput,
  type NightCheckInput,
  type NightIncidentInput,
  type NightLogSummary,
  type SleepDisturbanceInput,
  type ChildRef,
} from "../home-night-safety-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

const TODAY = "2026-05-26";

function daysAgo(n: number): string {
  const d = new Date("2026-05-26");
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function makeChild(id: string, name: string): ChildRef {
  return { id, name };
}

function makeWelfareCheck(overrides: Partial<WelfareCheckInput> & { child_id: string }): WelfareCheckInput {
  return { date: daysAgo(1), time: "23:00", status: "asleep", ...overrides };
}

function makeNightCheck(overrides: Partial<NightCheckInput> & { child_id: string }): NightCheckInput {
  return { date: daysAgo(1), time: "02:00", status: "asleep", ...overrides };
}

function makeNightIncident(overrides: Partial<NightIncidentInput> = {}): NightIncidentInput {
  return { date: daysAgo(1), child_id: "yp_1", incident_type: "disturbance", escalated: false, ...overrides };
}

function makeNightLog(overrides: Partial<NightLogSummary> = {}): NightLogSummary {
  return {
    date: daysAgo(1),
    has_waking_night: true,
    has_sleep_in: false,
    check_count: 4,
    incident_count: 0,
    security_issues: 0,
    has_concerns: false,
    ...overrides,
  };
}

function makeDisturbance(overrides: Partial<SleepDisturbanceInput> & { child_id: string }): SleepDisturbanceInput {
  return { date: daysAgo(1), duration_minutes: 15, ...overrides };
}

function baseInput(overrides: Partial<HomeNightSafetyInput> = {}): HomeNightSafetyInput {
  return {
    today: TODAY,
    children: [makeChild("yp_1", "Alex"), makeChild("yp_2", "Jordan")],
    welfare_checks: [],
    night_checks: [],
    night_incidents: [],
    night_logs: [],
    sleep_disturbances: [],
    ...overrides,
  };
}

// Generate consistent nightly checks for all children across N nights
function generateNightlyChecks(nights: number, children: ChildRef[]): WelfareCheckInput[] {
  const checks: WelfareCheckInput[] = [];
  for (let n = 0; n < nights; n++) {
    for (const c of children) {
      checks.push(makeWelfareCheck({ child_id: c.id, date: daysAgo(n + 1), time: "22:00" }));
      checks.push(makeWelfareCheck({ child_id: c.id, date: daysAgo(n + 1), time: "00:00" }));
      checks.push(makeWelfareCheck({ child_id: c.id, date: daysAgo(n + 1), time: "02:00" }));
      checks.push(makeWelfareCheck({ child_id: c.id, date: daysAgo(n + 1), time: "04:00" }));
    }
  }
  return checks;
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("Home Night Safety Intelligence Engine", () => {

  // ── Output Shape ────────────────────────────────────────────────────────

  it("returns correct output shape", () => {
    const r = computeHomeNightSafety(baseInput());
    expect(r).toHaveProperty("generated_at");
    expect(r).toHaveProperty("night_safety_rating");
    expect(r).toHaveProperty("night_safety_score");
    expect(r).toHaveProperty("headline");
    expect(r).toHaveProperty("check_compliance");
    expect(r).toHaveProperty("disturbances");
    expect(r).toHaveProperty("night_incidents");
    expect(r).toHaveProperty("child_profiles");
    expect(r).toHaveProperty("children_of_concern");
    expect(r).toHaveProperty("strengths");
    expect(r).toHaveProperty("concerns");
    expect(r).toHaveProperty("recommendations");
    expect(r).toHaveProperty("insights");
  });

  it("sets generated_at to today", () => {
    const r = computeHomeNightSafety(baseInput());
    expect(r.generated_at).toBe(TODAY);
  });

  // ── Rating Thresholds ──────────────────────────────────────────────────

  it("rates insufficient_data when no monitoring data exists", () => {
    const r = computeHomeNightSafety(baseInput());
    expect(r.night_safety_rating).toBe("insufficient_data");
  });

  it("rates insufficient_data when no children", () => {
    const r = computeHomeNightSafety(baseInput({ children: [] }));
    expect(r.night_safety_rating).toBe("insufficient_data");
  });

  it("rates good/outstanding with consistent checks and no issues", () => {
    const children = [makeChild("yp_1", "Alex"), makeChild("yp_2", "Jordan")];
    const checks = generateNightlyChecks(20, children);
    const logs = Array.from({ length: 20 }, (_, i) => makeNightLog({ date: daysAgo(i + 1) }));

    const r = computeHomeNightSafety(baseInput({ welfare_checks: checks, night_logs: logs }));
    expect(["good", "outstanding"]).toContain(r.night_safety_rating);
    expect(r.night_safety_score).toBeGreaterThanOrEqual(65);
  });

  it("rates inadequate with poor compliance and many incidents", () => {
    const incidents: NightIncidentInput[] = [];
    for (let i = 0; i < 8; i++) {
      incidents.push(makeNightIncident({ date: daysAgo(i + 1), escalated: i < 3 }));
    }
    // Minimal checks — only a few
    const checks = [
      makeWelfareCheck({ child_id: "yp_1", date: daysAgo(1) }),
    ];

    const r = computeHomeNightSafety(baseInput({ welfare_checks: checks, night_incidents: incidents }));
    expect(["inadequate", "adequate"]).toContain(r.night_safety_rating);
    expect(r.night_safety_score).toBeLessThan(65);
  });

  // ── Check Compliance ───────────────────────────────────────────────────

  it("computes check compliance rate correctly", () => {
    const children = [makeChild("yp_1", "Alex"), makeChild("yp_2", "Jordan")];
    const checks = generateNightlyChecks(15, children);

    const r = computeHomeNightSafety(baseInput({ welfare_checks: checks }));
    expect(r.check_compliance.nights_with_checks_30d).toBe(15);
    expect(r.check_compliance.total_nights_30d).toBe(31);
    expect(r.check_compliance.compliance_rate).toBe(48); // 15/31
  });

  it("computes all children checked rate", () => {
    // Night 1: both checked
    const checks = [
      makeWelfareCheck({ child_id: "yp_1", date: daysAgo(1), time: "23:00" }),
      makeWelfareCheck({ child_id: "yp_2", date: daysAgo(1), time: "23:00" }),
      // Night 2: only yp_1 checked
      makeWelfareCheck({ child_id: "yp_1", date: daysAgo(2), time: "23:00" }),
    ];

    const r = computeHomeNightSafety(baseInput({ welfare_checks: checks }));
    expect(r.check_compliance.all_children_checked_rate).toBe(50); // 1 of 2 nights
  });

  it("counts night logs as contributing to compliance", () => {
    const logs = [makeNightLog({ date: daysAgo(1) }), makeNightLog({ date: daysAgo(2) })];
    const r = computeHomeNightSafety(baseInput({ night_logs: logs }));
    expect(r.check_compliance.nights_with_checks_30d).toBeGreaterThanOrEqual(2);
  });

  // ── Disturbances ───────────────────────────────────────────────────────

  it("counts disturbances correctly", () => {
    const disturbances = [
      makeDisturbance({ child_id: "yp_1", date: daysAgo(1) }),
      makeDisturbance({ child_id: "yp_1", date: daysAgo(3) }),
      makeDisturbance({ child_id: "yp_2", date: daysAgo(5) }),
      makeDisturbance({ child_id: "yp_1", date: daysAgo(40) }), // Outside 30d
    ];

    const r = computeHomeNightSafety(baseInput({
      sleep_disturbances: disturbances,
      welfare_checks: [makeWelfareCheck({ child_id: "yp_1" })], // need some data
    }));
    expect(r.disturbances.total_disturbances_30d).toBe(3);
    expect(r.disturbances.children_with_disturbances).toContain("Alex");
    expect(r.disturbances.children_with_disturbances).toContain("Jordan");
  });

  it("counts 7-day disturbances separately", () => {
    const disturbances = [
      makeDisturbance({ child_id: "yp_1", date: daysAgo(2) }),
      makeDisturbance({ child_id: "yp_1", date: daysAgo(15) }),
    ];

    const r = computeHomeNightSafety(baseInput({
      sleep_disturbances: disturbances,
      welfare_checks: [makeWelfareCheck({ child_id: "yp_1" })],
    }));
    expect(r.disturbances.total_disturbances_7d).toBe(1);
    expect(r.disturbances.total_disturbances_30d).toBe(2);
  });

  // ── Night Incidents ────────────────────────────────────────────────────

  it("counts night incidents and escalations", () => {
    const incidents = [
      makeNightIncident({ date: daysAgo(2), incident_type: "disturbance", escalated: false }),
      makeNightIncident({ date: daysAgo(5), incident_type: "self_harm_concern", escalated: true }),
      makeNightIncident({ date: daysAgo(8), incident_type: "missing", escalated: true }),
    ];

    const r = computeHomeNightSafety(baseInput({
      night_incidents: incidents,
      welfare_checks: [makeWelfareCheck({ child_id: "yp_1" })],
    }));
    expect(r.night_incidents.total_incidents_30d).toBe(3);
    expect(r.night_incidents.escalated_count_30d).toBe(2);
    expect(r.night_incidents.incident_types.length).toBe(3);
  });

  it("groups incident types by count", () => {
    const incidents = [
      makeNightIncident({ date: daysAgo(1), incident_type: "disturbance" }),
      makeNightIncident({ date: daysAgo(2), incident_type: "disturbance" }),
      makeNightIncident({ date: daysAgo(3), incident_type: "property" }),
    ];

    const r = computeHomeNightSafety(baseInput({
      night_incidents: incidents,
      welfare_checks: [makeWelfareCheck({ child_id: "yp_1" })],
    }));
    expect(r.night_incidents.incident_types[0].type).toBe("disturbance");
    expect(r.night_incidents.incident_types[0].count).toBe(2);
  });

  // ── Per-Child Profiles ─────────────────────────────────────────────────

  it("computes per-child night profiles", () => {
    const checks = [
      makeWelfareCheck({ child_id: "yp_1", date: daysAgo(1), status: "asleep" }),
      makeWelfareCheck({ child_id: "yp_1", date: daysAgo(2), status: "awake_unsettled" }),
      makeWelfareCheck({ child_id: "yp_1", date: daysAgo(3), status: "asleep" }),
    ];

    const r = computeHomeNightSafety(baseInput({ welfare_checks: checks }));
    const alex = r.child_profiles.find((p) => p.child_id === "yp_1");
    expect(alex).toBeDefined();
    expect(alex!.checks_received_30d).toBe(3);
    expect(alex!.nights_unsettled_30d).toBe(1);
  });

  it("flags children with not_in_room status", () => {
    const checks = [
      makeWelfareCheck({ child_id: "yp_1", date: daysAgo(1), status: "not_in_room" }),
      makeWelfareCheck({ child_id: "yp_1", date: daysAgo(2), status: "asleep" }),
    ];

    const r = computeHomeNightSafety(baseInput({ welfare_checks: checks }));
    const alex = r.child_profiles.find((p) => p.child_id === "yp_1");
    expect(alex!.nights_not_in_room_30d).toBe(1);
    expect(alex!.flags.some((f) => f.includes("Not in room"))).toBe(true);
  });

  it("sorts child profiles by score ascending (lowest first)", () => {
    const checks = [
      // yp_1 has many unsettled nights → low score
      ...Array.from({ length: 5 }, (_, i) => makeWelfareCheck({ child_id: "yp_1", date: daysAgo(i + 1), status: "awake_unsettled" })),
      // yp_2 all asleep → high score
      ...Array.from({ length: 10 }, (_, i) => makeWelfareCheck({ child_id: "yp_2", date: daysAgo(i + 1), status: "asleep" })),
    ];

    const r = computeHomeNightSafety(baseInput({ welfare_checks: checks }));
    expect(r.child_profiles[0].child_id).toBe("yp_1"); // Lowest first
  });

  it("combines welfare checks and night checks for per-child counts", () => {
    const welfareChecks = [
      makeWelfareCheck({ child_id: "yp_1", date: daysAgo(1), time: "22:00" }),
    ];
    const nightChecks = [
      makeNightCheck({ child_id: "yp_1", date: daysAgo(1), time: "02:00" }),
    ];

    const r = computeHomeNightSafety(baseInput({
      welfare_checks: welfareChecks,
      night_checks: nightChecks,
    }));
    const alex = r.child_profiles.find((p) => p.child_id === "yp_1");
    expect(alex!.checks_received_30d).toBe(2);
  });

  // ── Children of Concern ────────────────────────────────────────────────

  it("identifies children of concern by score", () => {
    // yp_1: many unsettled + disturbances + incidents → low score
    const checks = Array.from({ length: 6 }, (_, i) =>
      makeWelfareCheck({ child_id: "yp_1", date: daysAgo(i + 1), status: "awake_unsettled" }),
    );
    const disturbances = Array.from({ length: 5 }, (_, i) =>
      makeDisturbance({ child_id: "yp_1", date: daysAgo(i + 1) }),
    );
    const incidents = [
      makeNightIncident({ date: daysAgo(1), child_id: "yp_1", escalated: true }),
      makeNightIncident({ date: daysAgo(3), child_id: "yp_1" }),
      makeNightIncident({ date: daysAgo(5), child_id: "yp_1" }),
    ];

    const r = computeHomeNightSafety(baseInput({
      welfare_checks: checks,
      sleep_disturbances: disturbances,
      night_incidents: incidents,
    }));
    expect(r.children_of_concern).toContain("Alex");
  });

  // ── Scoring ────────────────────────────────────────────────────────────

  it("boosts score for high check compliance", () => {
    const children = [makeChild("yp_1", "Alex"), makeChild("yp_2", "Jordan")];
    const highCompliance = generateNightlyChecks(28, children);
    const logs = Array.from({ length: 28 }, (_, i) => makeNightLog({ date: daysAgo(i + 1) }));

    const rHigh = computeHomeNightSafety(baseInput({ welfare_checks: highCompliance, night_logs: logs }));

    const lowCompliance = generateNightlyChecks(3, children);
    const rLow = computeHomeNightSafety(baseInput({ welfare_checks: lowCompliance }));

    expect(rHigh.night_safety_score).toBeGreaterThan(rLow.night_safety_score);
  });

  it("penalises score for escalated incidents", () => {
    const checks = generateNightlyChecks(10, [makeChild("yp_1", "Alex"), makeChild("yp_2", "Jordan")]);
    const noIncidents = computeHomeNightSafety(baseInput({ welfare_checks: checks }));

    const withIncidents = computeHomeNightSafety(baseInput({
      welfare_checks: checks,
      night_incidents: [
        makeNightIncident({ date: daysAgo(1), escalated: true }),
        makeNightIncident({ date: daysAgo(3), escalated: true }),
        makeNightIncident({ date: daysAgo(5), escalated: false }),
        makeNightIncident({ date: daysAgo(7), escalated: false }),
        makeNightIncident({ date: daysAgo(9), escalated: false }),
      ],
    }));

    expect(noIncidents.night_safety_score).toBeGreaterThan(withIncidents.night_safety_score);
  });

  it("clamps score to 0-100", () => {
    // Lots of penalties
    const r = computeHomeNightSafety(baseInput({
      children: [makeChild("yp_1", "A"), makeChild("yp_2", "B"), makeChild("yp_3", "C"), makeChild("yp_4", "D")],
      welfare_checks: [makeWelfareCheck({ child_id: "yp_1", status: "not_in_room" })],
      night_incidents: Array.from({ length: 10 }, (_, i) => makeNightIncident({ date: daysAgo(i + 1), escalated: true, child_id: "yp_1" })),
      sleep_disturbances: Array.from({ length: 10 }, (_, i) => makeDisturbance({ child_id: "yp_1", date: daysAgo(i + 1) })),
    }));
    expect(r.night_safety_score).toBeGreaterThanOrEqual(0);
    expect(r.night_safety_score).toBeLessThanOrEqual(100);
  });

  // ── Strengths ──────────────────────────────────────────────────────────

  it("generates strengths for good night safety", () => {
    const children = [makeChild("yp_1", "Alex"), makeChild("yp_2", "Jordan")];
    const checks = generateNightlyChecks(25, children);
    const logs = Array.from({ length: 25 }, (_, i) => makeNightLog({ date: daysAgo(i + 1) }));

    const r = computeHomeNightSafety(baseInput({ welfare_checks: checks, night_logs: logs }));
    expect(r.strengths.length).toBeGreaterThan(0);
  });

  it("generates strength for zero incidents", () => {
    const children = [makeChild("yp_1", "Alex"), makeChild("yp_2", "Jordan")];
    const checks = generateNightlyChecks(10, children);

    const r = computeHomeNightSafety(baseInput({ welfare_checks: checks }));
    const hasIncidentStrength = r.strengths.some((s) => s.includes("Zero night-time incidents"));
    expect(hasIncidentStrength).toBe(true);
  });

  // ── Concerns ───────────────────────────────────────────────────────────

  it("generates concern for no monitoring data", () => {
    const r = computeHomeNightSafety(baseInput());
    const hasConcern = r.concerns.some((c) => c.includes("No overnight monitoring data"));
    expect(hasConcern).toBe(true);
  });

  it("generates concern for low compliance", () => {
    const checks = [
      makeWelfareCheck({ child_id: "yp_1", date: daysAgo(1) }),
      makeWelfareCheck({ child_id: "yp_1", date: daysAgo(5) }),
    ];
    const r = computeHomeNightSafety(baseInput({ welfare_checks: checks }));
    const hasConcern = r.concerns.some((c) => c.includes("compliance") || c.includes("documented welfare checks"));
    expect(hasConcern).toBe(true);
  });

  // ── Recommendations ────────────────────────────────────────────────────

  it("recommends immediate action for no data", () => {
    const r = computeHomeNightSafety(baseInput());
    const hasImmediate = r.recommendations.some((rec) => rec.urgency === "immediate");
    expect(hasImmediate).toBe(true);
  });

  it("recommends care plan review for children of concern", () => {
    const checks = Array.from({ length: 6 }, (_, i) =>
      makeWelfareCheck({ child_id: "yp_1", date: daysAgo(i + 1), status: "awake_unsettled" }),
    );
    const disturbances = Array.from({ length: 5 }, (_, i) =>
      makeDisturbance({ child_id: "yp_1", date: daysAgo(i + 1) }),
    );

    const r = computeHomeNightSafety(baseInput({
      welfare_checks: checks,
      sleep_disturbances: disturbances,
    }));

    if (r.children_of_concern.length > 0) {
      const hasRec = r.recommendations.some((rec) => rec.recommendation.includes("care plan") || rec.recommendation.includes("Alex"));
      expect(hasRec).toBe(true);
    }
  });

  // ── Cara Insights ──────────────────────────────────────────────────────

  it("generates critical insight for no data", () => {
    const r = computeHomeNightSafety(baseInput());
    const hasCritical = r.insights.some((i) => i.severity === "critical");
    expect(hasCritical).toBe(true);
  });

  it("generates positive insight for outstanding safety", () => {
    const children = [makeChild("yp_1", "Alex"), makeChild("yp_2", "Jordan")];
    const checks = generateNightlyChecks(28, children);
    const logs = Array.from({ length: 28 }, (_, i) => makeNightLog({ date: daysAgo(i + 1) }));

    const r = computeHomeNightSafety(baseInput({ welfare_checks: checks, night_logs: logs }));
    if (r.night_safety_rating === "outstanding") {
      const hasPositive = r.insights.some((i) => i.severity === "positive" && i.text.includes("outstanding"));
      expect(hasPositive).toBe(true);
    } else {
      expect(r.night_safety_score).toBeGreaterThanOrEqual(65);
    }
  });

  // ── Headline ───────────────────────────────────────────────────────────

  it("includes rating in headline", () => {
    const r = computeHomeNightSafety(baseInput());
    expect(r.headline).toContain(r.night_safety_rating);
  });

  // ── Empty Input ────────────────────────────────────────────────────────

  it("handles empty input gracefully", () => {
    const r = computeHomeNightSafety({
      today: TODAY,
      children: [],
      welfare_checks: [],
      night_checks: [],
      night_incidents: [],
      night_logs: [],
      sleep_disturbances: [],
    });
    expect(r.night_safety_rating).toBe("insufficient_data");
    expect(r.child_profiles).toEqual([]);
  });
});
