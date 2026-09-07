import { describe, it, expect } from "vitest";
import {
  computeSocialSkillsMetrics,
  identifySocialSkillsAlerts,
  type SocialSkillsDevelopmentRecord,
} from "./social-skills-development-service";

function makeRecord(
  overrides: Partial<SocialSkillsDevelopmentRecord> = {},
): SocialSkillsDevelopmentRecord {
  return {
    id: overrides.id ?? "rec-1",
    home_id: "home-1",
    skill_area: "communication",
    competence_level: "developing",
    progress_assessment: "good_progress",
    group_dynamic: "active_participant",
    session_date: "2025-06-01",
    child_name: "Child A",
    child_id: null,
    facilitated_by: "Staff",
    child_engaged: true,
    age_appropriate: true,
    strengths_identified: true,
    targets_set: true,
    positive_reinforcement: true,
    peer_modelling_used: true,
    care_plan_reflects: true,
    social_worker_informed: true,
    family_updated: true,
    school_linked: true,
    therapeutic_input: true,
    recorded_promptly: true,
    issues_found: [],
    actions_taken: [],
    next_review_date: null,
    notes: null,
    created_at: "2025-06-01T00:00:00Z",
    updated_at: "2025-06-01T00:00:00Z",
    ...overrides,
  };
}

// ── Metrics ──────────────────────────────────────────────────────────────

describe("computeSocialSkillsMetrics", () => {
  it("returns zeroes for empty array", () => {
    const m = computeSocialSkillsMetrics([]);
    expect(m.total_sessions).toBe(0);
    expect(m.regression_count).toBe(0);
    expect(m.no_progress_count).toBe(0);
    expect(m.disruptive_count).toBe(0);
    expect(m.withdrawn_count).toBe(0);
    expect(m.child_engaged_rate).toBeNull();;
    expect(m.unique_children).toBe(0);
  });

  it("counts problem categories", () => {
    const records = [
      makeRecord({ progress_assessment: "regression" }),
      makeRecord({ progress_assessment: "no_progress" }),
      makeRecord({ progress_assessment: "no_progress" }),
      makeRecord({ group_dynamic: "disruptive" }),
      makeRecord({ group_dynamic: "withdrawn" }),
    ];
    const m = computeSocialSkillsMetrics(records);
    expect(m.total_sessions).toBe(5);
    expect(m.regression_count).toBe(1);
    expect(m.no_progress_count).toBe(2);
    expect(m.disruptive_count).toBe(1);
    expect(m.withdrawn_count).toBe(1);
  });

  it("computes boolean rates", () => {
    const records = [
      makeRecord({ child_engaged: true, targets_set: false }),
      makeRecord({ child_engaged: false, targets_set: false }),
    ];
    const m = computeSocialSkillsMetrics(records);
    expect(m.child_engaged_rate).toBe(50);
    expect(m.targets_rate).toBe(0);
  });

  it("counts unique children by name", () => {
    const records = [
      makeRecord({ child_name: "Alice" }),
      makeRecord({ child_name: "Alice" }),
      makeRecord({ child_name: "Bob" }),
    ];
    const m = computeSocialSkillsMetrics(records);
    expect(m.unique_children).toBe(2);
  });

  it("builds breakdowns by area, level, progress, dynamic", () => {
    const records = [
      makeRecord({ skill_area: "empathy_building", competence_level: "advanced" }),
      makeRecord({ skill_area: "communication", competence_level: "emerging" }),
    ];
    const m = computeSocialSkillsMetrics(records);
    expect(m.by_skill_area["empathy_building"]).toBe(1);
    expect(m.by_skill_area["communication"]).toBe(1);
    expect(m.by_competence_level["advanced"]).toBe(1);
    expect(m.by_competence_level["emerging"]).toBe(1);
  });
});

// ── Alerts ───────────────────────────────────────────────────────────────

describe("identifySocialSkillsAlerts", () => {
  it("returns no alerts for empty array", () => {
    expect(identifySocialSkillsAlerts([])).toEqual([]);
  });

  it("returns no alerts for fully compliant records", () => {
    expect(identifySocialSkillsAlerts([makeRecord()])).toEqual([]);
  });

  it("fires critical for regression + disruptive", () => {
    const rec = makeRecord({
      progress_assessment: "regression",
      group_dynamic: "disruptive",
    });
    const alerts = identifySocialSkillsAlerts([rec]);
    expect(alerts.some((a) => a.type === "regression_disruptive" && a.severity === "critical")).toBe(true);
  });

  it("fires high alert for no targets set (>= 1)", () => {
    const alerts = identifySocialSkillsAlerts([
      makeRecord({ targets_set: false }),
    ]);
    expect(alerts.some((a) => a.type === "no_targets_set" && a.severity === "high")).toBe(true);
  });

  it("fires high alert for strengths not identified (>= 1)", () => {
    const alerts = identifySocialSkillsAlerts([
      makeRecord({ strengths_identified: false }),
    ]);
    expect(alerts.some((a) => a.type === "strengths_not_identified" && a.severity === "high")).toBe(true);
  });

  it("fires medium alert for no positive reinforcement when count >= 2", () => {
    const records = [
      makeRecord({ id: "r1", positive_reinforcement: false }),
      makeRecord({ id: "r2", positive_reinforcement: false }),
    ];
    const alerts = identifySocialSkillsAlerts(records);
    expect(alerts.some((a) => a.type === "no_positive_reinforcement" && a.severity === "medium")).toBe(true);
  });

  it("does NOT fire no_positive_reinforcement when count is 1", () => {
    const alerts = identifySocialSkillsAlerts([
      makeRecord({ positive_reinforcement: false }),
    ]);
    expect(alerts.some((a) => a.type === "no_positive_reinforcement")).toBe(false);
  });

  it("fires medium alert for no therapeutic input when count >= 2", () => {
    const records = [
      makeRecord({ id: "r1", therapeutic_input: false }),
      makeRecord({ id: "r2", therapeutic_input: false }),
    ];
    const alerts = identifySocialSkillsAlerts(records);
    expect(alerts.some((a) => a.type === "no_therapeutic_input" && a.severity === "medium")).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Tri-state judgements — the vertical template for the services layer
//
// The create defaulted all twelve judgements to `true` (matching the archived
// schema's column defaults, both now dropped), and boolRate divided by every
// record. Together: a session nobody had reviewed scored 100% on all twelve
// rates. These pin the honest behaviour end to end.
// ══════════════════════════════════════════════════════════════════════════════

describe("tri-state judgements", () => {
  const rec = (child_engaged: boolean | null, id: string) =>
    makeRecord({ id, child_engaged });

  it("rates over the records where the question was answered", () => {
    const m = computeSocialSkillsMetrics([rec(true, "a"), rec(null, "b"), rec(null, "c")]);
    // One answered, answered yes: 100% of what is known — not 33% of a
    // denominator padded with silence.
    expect(m.child_engaged_rate).toBe(100);
  });

  it("still counts a recorded no against the rate", () => {
    const m = computeSocialSkillsMetrics([rec(true, "a"), rec(false, "b")]);
    expect(m.child_engaged_rate).toBe(50);
  });

  it("reports null, not a score, when no record answers the question", () => {
    const m = computeSocialSkillsMetrics([rec(null, "a"), rec(null, "b")]);
    expect(m.child_engaged_rate).toBeNull();
  });
});
