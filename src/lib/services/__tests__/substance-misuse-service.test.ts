// ══════════════════════════════════════════════════════════════════════════════
// CARA — SUBSTANCE MISUSE SERVICE TESTS
// Pure-function unit tests for substance misuse metrics computation,
// alert identification, constant validation, and CRUD fallback behaviour
// (Supabase disabled). CHR 2015 Reg 12 (protection from harm — including
// substance-related risks), Reg 34 (notifications to Ofsted of serious events
// including substance misuse incidents), and local safeguarding requirements.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  _testing,
  SUBSTANCE_TYPES,
  RISK_LEVELS,
  FREQUENCY_LEVELS,
  USE_CONTEXTS,
  ASSESSMENT_STATUSES,
  INCIDENT_TYPES,
  listAssessments,
  createAssessment,
  updateAssessment,
  listIncidents,
  createIncident,
} from "../substance-misuse-service";

import type {
  SubstanceAssessment,
  SubstanceIncident,
} from "../substance-misuse-service";

const {
  computeSubstanceMisuseMetrics,
  identifySubstanceMisuseAlerts,
} = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

/** Date string N days ago from now. */
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

/** Like daysAgo but clamped to no earlier than the start of the current calendar
 *  quarter — so "current quarter" fixtures stay in-quarter even in the first days
 *  of a new quarter (otherwise the quarter counts flip to 0 at the boundary). */
function daysAgoInQuarter(n: number): string {
  const now = new Date();
  const q = Math.floor(now.getMonth() / 3);
  const target = new Date();
  target.setDate(target.getDate() - n);
  const sameQuarter = target.getFullYear() === now.getFullYear() && Math.floor(target.getMonth() / 3) === q;
  return (sameQuarter ? target : now).toISOString().split("T")[0];
}

/** Date string N days in the future from now. */
function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

/** ISO datetime string N days ago. */
function daysAgoISO(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

/** Build a minimal SubstanceAssessment with sensible defaults. */
function makeAssessment(
  overrides: Partial<SubstanceAssessment> = {},
): SubstanceAssessment {
  return {
    id: "assess-1",
    home_id: "home-1",
    child_id: "child-1",
    child_name: "Test Child",
    assessment_date: daysAgo(10),
    assessed_by: "staff-1",
    substance_type: "alcohol",
    risk_level: "low",
    frequency: "experimental",
    context: null,
    impact_on_health: null,
    impact_on_behaviour: null,
    impact_on_education: null,
    referral_made: false,
    referral_to: null,
    referral_date: null,
    intervention_plan: null,
    next_assessment_date: daysFromNow(30),
    status: "active",
    notes: null,
    created_at: daysAgoISO(10),
    updated_at: daysAgoISO(10),
    ...overrides,
  };
}

/** Build a minimal SubstanceIncident with sensible defaults. */
function makeIncident(
  overrides: Partial<SubstanceIncident> = {},
): SubstanceIncident {
  return {
    id: "inc-1",
    home_id: "home-1",
    child_id: "child-1",
    child_name: "Test Child",
    incident_date: daysAgo(5),
    reported_by: "staff-1",
    substance_type: "alcohol",
    incident_type: "found_substance",
    description: "Substance found in room",
    location: null,
    immediate_action: "Substance confiscated",
    medical_attention: false,
    police_involved: false,
    social_worker_notified: true,
    parent_notified: true,
    ofsted_notified: false,
    follow_up_actions: [],
    follow_up_date: null,
    follow_up_completed: false,
    created_at: daysAgoISO(5),
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

describe("SUBSTANCE_TYPES", () => {
  it("has exactly 10 substance types", () => {
    expect(SUBSTANCE_TYPES).toHaveLength(10);
  });

  it("contains unique type values", () => {
    const types = SUBSTANCE_TYPES.map((t) => t.type);
    expect(new Set(types).size).toBe(types.length);
  });

  it("contains unique label values", () => {
    const labels = SUBSTANCE_TYPES.map((t) => t.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes alcohol", () => {
    expect(SUBSTANCE_TYPES.find((t) => t.type === "alcohol")).toBeDefined();
  });

  it("includes cannabis", () => {
    expect(SUBSTANCE_TYPES.find((t) => t.type === "cannabis")).toBeDefined();
  });

  it("includes cocaine", () => {
    expect(SUBSTANCE_TYPES.find((t) => t.type === "cocaine")).toBeDefined();
  });

  it("includes ecstasy_mdma", () => {
    expect(SUBSTANCE_TYPES.find((t) => t.type === "ecstasy_mdma")).toBeDefined();
  });

  it("includes solvents", () => {
    expect(SUBSTANCE_TYPES.find((t) => t.type === "solvents")).toBeDefined();
  });

  it("includes prescription_misuse", () => {
    expect(SUBSTANCE_TYPES.find((t) => t.type === "prescription_misuse")).toBeDefined();
  });

  it("includes new_psychoactive", () => {
    expect(SUBSTANCE_TYPES.find((t) => t.type === "new_psychoactive")).toBeDefined();
  });

  it("includes tobacco", () => {
    expect(SUBSTANCE_TYPES.find((t) => t.type === "tobacco")).toBeDefined();
  });

  it("includes vaping", () => {
    expect(SUBSTANCE_TYPES.find((t) => t.type === "vaping")).toBeDefined();
  });

  it("includes other", () => {
    expect(SUBSTANCE_TYPES.find((t) => t.type === "other")).toBeDefined();
  });

  it("every entry has both type and label", () => {
    for (const entry of SUBSTANCE_TYPES) {
      expect(entry.type).toBeTruthy();
      expect(entry.label).toBeTruthy();
    }
  });
});

describe("RISK_LEVELS", () => {
  it("has exactly 5 risk levels", () => {
    expect(RISK_LEVELS).toHaveLength(5);
  });

  it("contains unique level values", () => {
    const levels = RISK_LEVELS.map((l) => l.level);
    expect(new Set(levels).size).toBe(levels.length);
  });

  it("contains unique label values", () => {
    const labels = RISK_LEVELS.map((l) => l.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes none", () => {
    expect(RISK_LEVELS.find((l) => l.level === "none")).toBeDefined();
  });

  it("includes low", () => {
    expect(RISK_LEVELS.find((l) => l.level === "low")).toBeDefined();
  });

  it("includes moderate", () => {
    expect(RISK_LEVELS.find((l) => l.level === "moderate")).toBeDefined();
  });

  it("includes significant", () => {
    expect(RISK_LEVELS.find((l) => l.level === "significant")).toBeDefined();
  });

  it("includes serious", () => {
    expect(RISK_LEVELS.find((l) => l.level === "serious")).toBeDefined();
  });

  it("every entry has both level and label", () => {
    for (const entry of RISK_LEVELS) {
      expect(entry.level).toBeTruthy();
      expect(entry.label).toBeTruthy();
    }
  });
});

describe("FREQUENCY_LEVELS", () => {
  it("has exactly 6 frequency levels", () => {
    expect(FREQUENCY_LEVELS).toHaveLength(6);
  });

  it("contains unique frequency values", () => {
    const freqs = FREQUENCY_LEVELS.map((f) => f.frequency);
    expect(new Set(freqs).size).toBe(freqs.length);
  });

  it("contains unique label values", () => {
    const labels = FREQUENCY_LEVELS.map((f) => f.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes never", () => {
    expect(FREQUENCY_LEVELS.find((f) => f.frequency === "never")).toBeDefined();
  });

  it("includes experimental", () => {
    expect(FREQUENCY_LEVELS.find((f) => f.frequency === "experimental")).toBeDefined();
  });

  it("includes occasional", () => {
    expect(FREQUENCY_LEVELS.find((f) => f.frequency === "occasional")).toBeDefined();
  });

  it("includes regular", () => {
    expect(FREQUENCY_LEVELS.find((f) => f.frequency === "regular")).toBeDefined();
  });

  it("includes dependent", () => {
    expect(FREQUENCY_LEVELS.find((f) => f.frequency === "dependent")).toBeDefined();
  });

  it("includes unknown", () => {
    expect(FREQUENCY_LEVELS.find((f) => f.frequency === "unknown")).toBeDefined();
  });

  it("every entry has both frequency and label", () => {
    for (const entry of FREQUENCY_LEVELS) {
      expect(entry.frequency).toBeTruthy();
      expect(entry.label).toBeTruthy();
    }
  });
});

describe("USE_CONTEXTS", () => {
  it("has exactly 5 use contexts", () => {
    expect(USE_CONTEXTS).toHaveLength(5);
  });

  it("contains unique context values", () => {
    const contexts = USE_CONTEXTS.map((c) => c.context);
    expect(new Set(contexts).size).toBe(contexts.length);
  });

  it("contains unique label values", () => {
    const labels = USE_CONTEXTS.map((c) => c.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes peer_pressure", () => {
    expect(USE_CONTEXTS.find((c) => c.context === "peer_pressure")).toBeDefined();
  });

  it("includes self_medication", () => {
    expect(USE_CONTEXTS.find((c) => c.context === "self_medication")).toBeDefined();
  });

  it("includes recreational", () => {
    expect(USE_CONTEXTS.find((c) => c.context === "recreational")).toBeDefined();
  });

  it("includes addiction", () => {
    expect(USE_CONTEXTS.find((c) => c.context === "addiction")).toBeDefined();
  });

  it("includes exploitation", () => {
    expect(USE_CONTEXTS.find((c) => c.context === "exploitation")).toBeDefined();
  });

  it("every entry has both context and label", () => {
    for (const entry of USE_CONTEXTS) {
      expect(entry.context).toBeTruthy();
      expect(entry.label).toBeTruthy();
    }
  });
});

describe("ASSESSMENT_STATUSES", () => {
  it("has exactly 4 assessment statuses", () => {
    expect(ASSESSMENT_STATUSES).toHaveLength(4);
  });

  it("contains unique status values", () => {
    const statuses = ASSESSMENT_STATUSES.map((s) => s.status);
    expect(new Set(statuses).size).toBe(statuses.length);
  });

  it("contains unique label values", () => {
    const labels = ASSESSMENT_STATUSES.map((s) => s.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes active", () => {
    expect(ASSESSMENT_STATUSES.find((s) => s.status === "active")).toBeDefined();
  });

  it("includes monitoring", () => {
    expect(ASSESSMENT_STATUSES.find((s) => s.status === "monitoring")).toBeDefined();
  });

  it("includes resolved", () => {
    expect(ASSESSMENT_STATUSES.find((s) => s.status === "resolved")).toBeDefined();
  });

  it("includes escalated", () => {
    expect(ASSESSMENT_STATUSES.find((s) => s.status === "escalated")).toBeDefined();
  });

  it("every entry has both status and label", () => {
    for (const entry of ASSESSMENT_STATUSES) {
      expect(entry.status).toBeTruthy();
      expect(entry.label).toBeTruthy();
    }
  });
});

describe("INCIDENT_TYPES", () => {
  it("has exactly 8 incident types", () => {
    expect(INCIDENT_TYPES).toHaveLength(8);
  });

  it("contains unique type values", () => {
    const types = INCIDENT_TYPES.map((t) => t.type);
    expect(new Set(types).size).toBe(types.length);
  });

  it("contains unique label values", () => {
    const labels = INCIDENT_TYPES.map((t) => t.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes found_substance", () => {
    expect(INCIDENT_TYPES.find((t) => t.type === "found_substance")).toBeDefined();
  });

  it("includes found_paraphernalia", () => {
    expect(INCIDENT_TYPES.find((t) => t.type === "found_paraphernalia")).toBeDefined();
  });

  it("includes under_influence", () => {
    expect(INCIDENT_TYPES.find((t) => t.type === "under_influence")).toBeDefined();
  });

  it("includes disclosure", () => {
    expect(INCIDENT_TYPES.find((t) => t.type === "disclosure")).toBeDefined();
  });

  it("includes third_party_report", () => {
    expect(INCIDENT_TYPES.find((t) => t.type === "third_party_report")).toBeDefined();
  });

  it("includes positive_test", () => {
    expect(INCIDENT_TYPES.find((t) => t.type === "positive_test")).toBeDefined();
  });

  it("includes suspected_dealing", () => {
    expect(INCIDENT_TYPES.find((t) => t.type === "suspected_dealing")).toBeDefined();
  });

  it("includes overdose", () => {
    expect(INCIDENT_TYPES.find((t) => t.type === "overdose")).toBeDefined();
  });

  it("every entry has both type and label", () => {
    for (const entry of INCIDENT_TYPES) {
      expect(entry.type).toBeTruthy();
      expect(entry.label).toBeTruthy();
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// computeSubstanceMisuseMetrics
// ═══════════════════════════════════════════════════════════════════════════

describe("computeSubstanceMisuseMetrics", () => {
  it("returns zeroed metrics for empty inputs", () => {
    const result = computeSubstanceMisuseMetrics([], []);
    expect(result.children_assessed).toBe(0);
    expect(result.by_risk_level).toEqual({});
    expect(result.by_substance_type).toEqual({});
    expect(result.active_referrals).toBe(0);
    expect(result.incidents_this_quarter).toBe(0);
    expect(result.by_incident_type).toEqual({});
    expect(result.children_with_intervention_plans).toBe(0);
    expect(result.overdue_assessments).toBe(0);
    expect(result.escalated_count).toBe(0);
  });

  // ── children_assessed ──────────────────────────────────────────────

  it("counts unique children assessed", () => {
    const assessments = [
      makeAssessment({ id: "a1", child_id: "c1" }),
      makeAssessment({ id: "a2", child_id: "c2" }),
    ];
    const result = computeSubstanceMisuseMetrics(assessments, []);
    expect(result.children_assessed).toBe(2);
  });

  it("deduplicates children with multiple assessments", () => {
    const assessments = [
      makeAssessment({ id: "a1", child_id: "c1", substance_type: "alcohol" }),
      makeAssessment({ id: "a2", child_id: "c1", substance_type: "cannabis" }),
    ];
    const result = computeSubstanceMisuseMetrics(assessments, []);
    expect(result.children_assessed).toBe(1);
  });

  it("returns 0 children_assessed for empty assessments", () => {
    const result = computeSubstanceMisuseMetrics([], []);
    expect(result.children_assessed).toBe(0);
  });

  it("counts single assessment correctly", () => {
    const assessments = [
      makeAssessment({ id: "a1", child_id: "c1" }),
    ];
    const result = computeSubstanceMisuseMetrics(assessments, []);
    expect(result.children_assessed).toBe(1);
  });

  it("counts many unique children correctly", () => {
    const assessments = [
      makeAssessment({ id: "a1", child_id: "c1" }),
      makeAssessment({ id: "a2", child_id: "c2" }),
      makeAssessment({ id: "a3", child_id: "c3" }),
      makeAssessment({ id: "a4", child_id: "c4" }),
      makeAssessment({ id: "a5", child_id: "c5" }),
    ];
    const result = computeSubstanceMisuseMetrics(assessments, []);
    expect(result.children_assessed).toBe(5);
  });

  // ── by_risk_level ──────────────────────────────────────────────────

  it("groups assessments by risk level correctly", () => {
    const assessments = [
      makeAssessment({ id: "a1", risk_level: "low" }),
      makeAssessment({ id: "a2", risk_level: "low" }),
      makeAssessment({ id: "a3", risk_level: "moderate" }),
      makeAssessment({ id: "a4", risk_level: "serious" }),
    ];
    const result = computeSubstanceMisuseMetrics(assessments, []);
    expect(result.by_risk_level).toEqual({
      low: 2,
      moderate: 1,
      serious: 1,
    });
  });

  it("returns empty by_risk_level for no assessments", () => {
    const result = computeSubstanceMisuseMetrics([], []);
    expect(result.by_risk_level).toEqual({});
  });

  it("handles single risk level across all assessments", () => {
    const assessments = [
      makeAssessment({ id: "a1", risk_level: "significant" }),
      makeAssessment({ id: "a2", risk_level: "significant" }),
    ];
    const result = computeSubstanceMisuseMetrics(assessments, []);
    expect(result.by_risk_level).toEqual({ significant: 2 });
  });

  it("counts all 5 risk levels when present", () => {
    const levels = RISK_LEVELS.map((r) => r.level);
    const assessments = levels.map((level, i) =>
      makeAssessment({ id: `a${i}`, risk_level: level }),
    );
    const result = computeSubstanceMisuseMetrics(assessments, []);
    expect(Object.keys(result.by_risk_level)).toHaveLength(5);
    for (const level of levels) {
      expect(result.by_risk_level[level]).toBe(1);
    }
  });

  // ── by_substance_type ──────────────────────────────────────────────

  it("groups assessments by substance type correctly", () => {
    const assessments = [
      makeAssessment({ id: "a1", substance_type: "alcohol" }),
      makeAssessment({ id: "a2", substance_type: "alcohol" }),
      makeAssessment({ id: "a3", substance_type: "cannabis" }),
      makeAssessment({ id: "a4", substance_type: "cocaine" }),
    ];
    const result = computeSubstanceMisuseMetrics(assessments, []);
    expect(result.by_substance_type).toEqual({
      alcohol: 2,
      cannabis: 1,
      cocaine: 1,
    });
  });

  it("returns empty by_substance_type for no assessments", () => {
    const result = computeSubstanceMisuseMetrics([], []);
    expect(result.by_substance_type).toEqual({});
  });

  it("handles single substance type across all assessments", () => {
    const assessments = [
      makeAssessment({ id: "a1", substance_type: "vaping" }),
      makeAssessment({ id: "a2", substance_type: "vaping" }),
      makeAssessment({ id: "a3", substance_type: "vaping" }),
    ];
    const result = computeSubstanceMisuseMetrics(assessments, []);
    expect(result.by_substance_type).toEqual({ vaping: 3 });
  });

  it("counts all 10 substance types when present", () => {
    const types = SUBSTANCE_TYPES.map((t) => t.type);
    const assessments = types.map((type, i) =>
      makeAssessment({ id: `a${i}`, substance_type: type }),
    );
    const result = computeSubstanceMisuseMetrics(assessments, []);
    expect(Object.keys(result.by_substance_type)).toHaveLength(10);
    for (const type of types) {
      expect(result.by_substance_type[type]).toBe(1);
    }
  });

  // ── active_referrals ───────────────────────────────────────────────

  it("counts active referrals where referral_made and status is active", () => {
    const assessments = [
      makeAssessment({ id: "a1", referral_made: true, status: "active" }),
      makeAssessment({ id: "a2", referral_made: true, status: "active" }),
    ];
    const result = computeSubstanceMisuseMetrics(assessments, []);
    expect(result.active_referrals).toBe(2);
  });

  it("counts active referrals where referral_made and status is monitoring", () => {
    const assessments = [
      makeAssessment({ id: "a1", referral_made: true, status: "monitoring" }),
    ];
    const result = computeSubstanceMisuseMetrics(assessments, []);
    expect(result.active_referrals).toBe(1);
  });

  it("does not count referrals where referral_made is false", () => {
    const assessments = [
      makeAssessment({ id: "a1", referral_made: false, status: "active" }),
    ];
    const result = computeSubstanceMisuseMetrics(assessments, []);
    expect(result.active_referrals).toBe(0);
  });

  it("does not count referrals where status is resolved", () => {
    const assessments = [
      makeAssessment({ id: "a1", referral_made: true, status: "resolved" }),
    ];
    const result = computeSubstanceMisuseMetrics(assessments, []);
    expect(result.active_referrals).toBe(0);
  });

  it("does not count referrals where status is escalated", () => {
    const assessments = [
      makeAssessment({ id: "a1", referral_made: true, status: "escalated" }),
    ];
    const result = computeSubstanceMisuseMetrics(assessments, []);
    expect(result.active_referrals).toBe(0);
  });

  it("counts mixed active and monitoring referrals", () => {
    const assessments = [
      makeAssessment({ id: "a1", referral_made: true, status: "active" }),
      makeAssessment({ id: "a2", referral_made: true, status: "monitoring" }),
      makeAssessment({ id: "a3", referral_made: true, status: "resolved" }),
      makeAssessment({ id: "a4", referral_made: false, status: "active" }),
    ];
    const result = computeSubstanceMisuseMetrics(assessments, []);
    expect(result.active_referrals).toBe(2);
  });

  it("returns 0 active_referrals for empty assessments", () => {
    const result = computeSubstanceMisuseMetrics([], []);
    expect(result.active_referrals).toBe(0);
  });

  // ── incidents_this_quarter ─────────────────────────────────────────

  it("counts incidents within the current quarter", () => {
    const incidents = [
      makeIncident({ id: "i1", incident_date: daysAgoInQuarter(5) }),
      makeIncident({ id: "i2", incident_date: daysAgoInQuarter(10) }),
    ];
    const result = computeSubstanceMisuseMetrics([], incidents);
    expect(result.incidents_this_quarter).toBeGreaterThanOrEqual(2);
  });

  it("excludes incidents from previous quarters", () => {
    const incidents = [
      makeIncident({ id: "i1", incident_date: "2024-01-15" }),
    ];
    const result = computeSubstanceMisuseMetrics([], incidents);
    expect(result.incidents_this_quarter).toBe(0);
  });

  it("returns 0 incidents_this_quarter for empty incidents", () => {
    const result = computeSubstanceMisuseMetrics([], []);
    expect(result.incidents_this_quarter).toBe(0);
  });

  it("counts only current quarter incidents in mixed set", () => {
    const incidents = [
      makeIncident({ id: "i1", incident_date: daysAgoInQuarter(5) }),
      makeIncident({ id: "i2", incident_date: "2024-01-15" }),
      makeIncident({ id: "i3", incident_date: "2023-06-01" }),
    ];
    const result = computeSubstanceMisuseMetrics([], incidents);
    expect(result.incidents_this_quarter).toBe(1);
  });

  // ── by_incident_type ───────────────────────────────────────────────

  it("groups incidents by type correctly", () => {
    const incidents = [
      makeIncident({ id: "i1", incident_type: "found_substance" }),
      makeIncident({ id: "i2", incident_type: "found_substance" }),
      makeIncident({ id: "i3", incident_type: "overdose" }),
      makeIncident({ id: "i4", incident_type: "under_influence" }),
    ];
    const result = computeSubstanceMisuseMetrics([], incidents);
    expect(result.by_incident_type).toEqual({
      found_substance: 2,
      overdose: 1,
      under_influence: 1,
    });
  });

  it("returns empty by_incident_type for no incidents", () => {
    const result = computeSubstanceMisuseMetrics([], []);
    expect(result.by_incident_type).toEqual({});
  });

  it("handles single incident type across all incidents", () => {
    const incidents = [
      makeIncident({ id: "i1", incident_type: "disclosure" }),
      makeIncident({ id: "i2", incident_type: "disclosure" }),
    ];
    const result = computeSubstanceMisuseMetrics([], incidents);
    expect(result.by_incident_type).toEqual({ disclosure: 2 });
  });

  it("counts all 8 incident types when present", () => {
    const types = INCIDENT_TYPES.map((t) => t.type);
    const incidents = types.map((type, i) =>
      makeIncident({ id: `i${i}`, incident_type: type }),
    );
    const result = computeSubstanceMisuseMetrics([], incidents);
    expect(Object.keys(result.by_incident_type)).toHaveLength(8);
    for (const type of types) {
      expect(result.by_incident_type[type]).toBe(1);
    }
  });

  // ── children_with_intervention_plans ───────────────────────────────

  it("counts unique children with intervention plans on active assessments", () => {
    const assessments = [
      makeAssessment({ id: "a1", child_id: "c1", intervention_plan: "CBT referral", status: "active" }),
      makeAssessment({ id: "a2", child_id: "c2", intervention_plan: "Group therapy", status: "active" }),
    ];
    const result = computeSubstanceMisuseMetrics(assessments, []);
    expect(result.children_with_intervention_plans).toBe(2);
  });

  it("counts children with intervention plans on monitoring assessments", () => {
    const assessments = [
      makeAssessment({ id: "a1", child_id: "c1", intervention_plan: "Weekly sessions", status: "monitoring" }),
    ];
    const result = computeSubstanceMisuseMetrics(assessments, []);
    expect(result.children_with_intervention_plans).toBe(1);
  });

  it("does not count children without intervention plans", () => {
    const assessments = [
      makeAssessment({ id: "a1", child_id: "c1", intervention_plan: null, status: "active" }),
    ];
    const result = computeSubstanceMisuseMetrics(assessments, []);
    expect(result.children_with_intervention_plans).toBe(0);
  });

  it("does not count resolved assessments with intervention plans", () => {
    const assessments = [
      makeAssessment({ id: "a1", child_id: "c1", intervention_plan: "Some plan", status: "resolved" }),
    ];
    const result = computeSubstanceMisuseMetrics(assessments, []);
    expect(result.children_with_intervention_plans).toBe(0);
  });

  it("does not count escalated assessments with intervention plans", () => {
    const assessments = [
      makeAssessment({ id: "a1", child_id: "c1", intervention_plan: "Some plan", status: "escalated" }),
    ];
    const result = computeSubstanceMisuseMetrics(assessments, []);
    expect(result.children_with_intervention_plans).toBe(0);
  });

  it("deduplicates children with multiple intervention plans", () => {
    const assessments = [
      makeAssessment({ id: "a1", child_id: "c1", intervention_plan: "Plan A", status: "active" }),
      makeAssessment({ id: "a2", child_id: "c1", intervention_plan: "Plan B", status: "monitoring" }),
    ];
    const result = computeSubstanceMisuseMetrics(assessments, []);
    expect(result.children_with_intervention_plans).toBe(1);
  });

  it("returns 0 children_with_intervention_plans for empty assessments", () => {
    const result = computeSubstanceMisuseMetrics([], []);
    expect(result.children_with_intervention_plans).toBe(0);
  });

  // ── overdue_assessments ────────────────────────────────────────────

  it("counts overdue active assessments with past next_assessment_date", () => {
    const assessments = [
      makeAssessment({ id: "a1", status: "active", next_assessment_date: daysAgo(10) }),
    ];
    const result = computeSubstanceMisuseMetrics(assessments, []);
    expect(result.overdue_assessments).toBe(1);
  });

  it("counts overdue monitoring assessments with past next_assessment_date", () => {
    const assessments = [
      makeAssessment({ id: "a1", status: "monitoring", next_assessment_date: daysAgo(5) }),
    ];
    const result = computeSubstanceMisuseMetrics(assessments, []);
    expect(result.overdue_assessments).toBe(1);
  });

  it("does not count assessments with future next_assessment_date", () => {
    const assessments = [
      makeAssessment({ id: "a1", status: "active", next_assessment_date: daysFromNow(30) }),
    ];
    const result = computeSubstanceMisuseMetrics(assessments, []);
    expect(result.overdue_assessments).toBe(0);
  });

  it("does not count assessments with null next_assessment_date", () => {
    const assessments = [
      makeAssessment({ id: "a1", status: "active", next_assessment_date: null }),
    ];
    const result = computeSubstanceMisuseMetrics(assessments, []);
    expect(result.overdue_assessments).toBe(0);
  });

  it("does not count resolved assessments as overdue", () => {
    const assessments = [
      makeAssessment({ id: "a1", status: "resolved", next_assessment_date: daysAgo(10) }),
    ];
    const result = computeSubstanceMisuseMetrics(assessments, []);
    expect(result.overdue_assessments).toBe(0);
  });

  it("does not count escalated assessments as overdue", () => {
    const assessments = [
      makeAssessment({ id: "a1", status: "escalated", next_assessment_date: daysAgo(10) }),
    ];
    const result = computeSubstanceMisuseMetrics(assessments, []);
    expect(result.overdue_assessments).toBe(0);
  });

  it("counts multiple overdue assessments", () => {
    const assessments = [
      makeAssessment({ id: "a1", status: "active", next_assessment_date: daysAgo(10) }),
      makeAssessment({ id: "a2", status: "monitoring", next_assessment_date: daysAgo(5) }),
      makeAssessment({ id: "a3", status: "active", next_assessment_date: daysFromNow(30) }),
    ];
    const result = computeSubstanceMisuseMetrics(assessments, []);
    expect(result.overdue_assessments).toBe(2);
  });

  it("returns 0 overdue_assessments for empty assessments", () => {
    const result = computeSubstanceMisuseMetrics([], []);
    expect(result.overdue_assessments).toBe(0);
  });

  // ── escalated_count ────────────────────────────────────────────────

  it("counts escalated assessments", () => {
    const assessments = [
      makeAssessment({ id: "a1", status: "escalated" }),
      makeAssessment({ id: "a2", status: "escalated" }),
    ];
    const result = computeSubstanceMisuseMetrics(assessments, []);
    expect(result.escalated_count).toBe(2);
  });

  it("does not count non-escalated assessments", () => {
    const assessments = [
      makeAssessment({ id: "a1", status: "active" }),
      makeAssessment({ id: "a2", status: "monitoring" }),
      makeAssessment({ id: "a3", status: "resolved" }),
    ];
    const result = computeSubstanceMisuseMetrics(assessments, []);
    expect(result.escalated_count).toBe(0);
  });

  it("counts single escalated assessment", () => {
    const assessments = [
      makeAssessment({ id: "a1", status: "escalated" }),
    ];
    const result = computeSubstanceMisuseMetrics(assessments, []);
    expect(result.escalated_count).toBe(1);
  });

  it("returns 0 escalated_count for empty assessments", () => {
    const result = computeSubstanceMisuseMetrics([], []);
    expect(result.escalated_count).toBe(0);
  });

  it("counts escalated among mixed statuses", () => {
    const assessments = [
      makeAssessment({ id: "a1", status: "active" }),
      makeAssessment({ id: "a2", status: "escalated" }),
      makeAssessment({ id: "a3", status: "monitoring" }),
      makeAssessment({ id: "a4", status: "escalated" }),
      makeAssessment({ id: "a5", status: "resolved" }),
    ];
    const result = computeSubstanceMisuseMetrics(assessments, []);
    expect(result.escalated_count).toBe(2);
  });

  // ── Combined scenarios ─────────────────────────────────────────────

  it("handles mixed assessments and incidents together", () => {
    const assessments = [
      makeAssessment({ id: "a1", child_id: "c1", risk_level: "serious", substance_type: "cocaine", referral_made: true, status: "active", intervention_plan: "Specialist referral", next_assessment_date: daysAgo(5) }),
      makeAssessment({ id: "a2", child_id: "c2", risk_level: "low", substance_type: "alcohol", referral_made: false, status: "monitoring", intervention_plan: null, next_assessment_date: daysFromNow(30) }),
      makeAssessment({ id: "a3", child_id: "c3", risk_level: "moderate", substance_type: "cannabis", referral_made: true, status: "resolved", intervention_plan: "Group work", next_assessment_date: daysAgo(10) }),
      makeAssessment({ id: "a4", child_id: "c1", risk_level: "significant", substance_type: "alcohol", referral_made: true, status: "escalated", intervention_plan: "Intensive support", next_assessment_date: null }),
    ];
    const incidents = [
      makeIncident({ id: "i1", incident_type: "overdose", incident_date: daysAgo(5) }),
      makeIncident({ id: "i2", incident_type: "found_substance", incident_date: "2024-01-15" }),
      makeIncident({ id: "i3", incident_type: "overdose", incident_date: daysAgo(10) }),
    ];
    const result = computeSubstanceMisuseMetrics(assessments, incidents);
    expect(result.children_assessed).toBe(3);
    expect(result.by_risk_level).toEqual({ serious: 1, low: 1, moderate: 1, significant: 1 });
    expect(result.by_substance_type).toEqual({ cocaine: 1, alcohol: 2, cannabis: 1 });
    expect(result.active_referrals).toBe(1);
    expect(result.by_incident_type).toEqual({ overdose: 2, found_substance: 1 });
    expect(result.children_with_intervention_plans).toBe(1);
    expect(result.overdue_assessments).toBe(1);
    expect(result.escalated_count).toBe(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// identifySubstanceMisuseAlerts
// ═══════════════════════════════════════════════════════════════════════════

describe("identifySubstanceMisuseAlerts", () => {
  it("returns empty array for empty inputs", () => {
    const alerts = identifySubstanceMisuseAlerts([], []);
    expect(alerts).toHaveLength(0);
  });

  // ── serious_risk_child alerts ──────────────────────────────────────

  describe("serious risk child alerts", () => {
    it("generates critical alert for serious risk child with active status", () => {
      const assessments = [
        makeAssessment({ id: "a1", child_name: "Alex", risk_level: "serious", status: "active", substance_type: "cocaine" }),
      ];
      const alerts = identifySubstanceMisuseAlerts(assessments, []);
      const serious = alerts.filter((a) => a.type === "serious_risk_child");
      expect(serious).toHaveLength(1);
      expect(serious[0].severity).toBe("critical");
      expect(serious[0].id).toBe("a1");
    });

    it("generates critical alert for serious risk child with escalated status", () => {
      const assessments = [
        makeAssessment({ id: "a1", child_name: "Alex", risk_level: "serious", status: "escalated", substance_type: "cocaine" }),
      ];
      const alerts = identifySubstanceMisuseAlerts(assessments, []);
      const serious = alerts.filter((a) => a.type === "serious_risk_child");
      expect(serious).toHaveLength(1);
      expect(serious[0].severity).toBe("critical");
    });

    it("does not flag serious risk child with resolved status", () => {
      const assessments = [
        makeAssessment({ id: "a1", risk_level: "serious", status: "resolved" }),
      ];
      const alerts = identifySubstanceMisuseAlerts(assessments, []);
      const serious = alerts.filter((a) => a.type === "serious_risk_child");
      expect(serious).toHaveLength(0);
    });

    it("does not flag serious risk child with monitoring status", () => {
      const assessments = [
        makeAssessment({ id: "a1", risk_level: "serious", status: "monitoring" }),
      ];
      const alerts = identifySubstanceMisuseAlerts(assessments, []);
      const serious = alerts.filter((a) => a.type === "serious_risk_child");
      expect(serious).toHaveLength(0);
    });

    it("includes child name in serious risk message", () => {
      const assessments = [
        makeAssessment({ id: "a1", child_name: "Alex", risk_level: "serious", status: "active", substance_type: "cocaine" }),
      ];
      const alerts = identifySubstanceMisuseAlerts(assessments, []);
      const serious = alerts.find((a) => a.type === "serious_risk_child");
      expect(serious?.message).toContain("Alex");
    });

    it("includes substance type in serious risk message", () => {
      const assessments = [
        makeAssessment({ id: "a1", child_name: "Alex", risk_level: "serious", status: "active", substance_type: "cocaine" }),
      ];
      const alerts = identifySubstanceMisuseAlerts(assessments, []);
      const serious = alerts.find((a) => a.type === "serious_risk_child");
      expect(serious?.message).toContain("cocaine");
    });

    it("includes Reg 12 reference in serious risk message", () => {
      const assessments = [
        makeAssessment({ id: "a1", child_name: "Alex", risk_level: "serious", status: "active", substance_type: "cocaine" }),
      ];
      const alerts = identifySubstanceMisuseAlerts(assessments, []);
      const serious = alerts.find((a) => a.type === "serious_risk_child");
      expect(serious?.message).toContain("Reg 12");
    });
  });

  // ── significant_risk_child alerts ──────────────────────────────────

  describe("significant risk child alerts", () => {
    it("generates critical alert for significant risk child with active status", () => {
      const assessments = [
        makeAssessment({ id: "a1", child_name: "Beth", risk_level: "significant", status: "active", substance_type: "cannabis" }),
      ];
      const alerts = identifySubstanceMisuseAlerts(assessments, []);
      const significant = alerts.filter((a) => a.type === "significant_risk_child");
      expect(significant).toHaveLength(1);
      expect(significant[0].severity).toBe("critical");
      expect(significant[0].id).toBe("a1");
    });

    it("generates critical alert for significant risk child with escalated status", () => {
      const assessments = [
        makeAssessment({ id: "a1", child_name: "Beth", risk_level: "significant", status: "escalated", substance_type: "cannabis" }),
      ];
      const alerts = identifySubstanceMisuseAlerts(assessments, []);
      const significant = alerts.filter((a) => a.type === "significant_risk_child");
      expect(significant).toHaveLength(1);
      expect(significant[0].severity).toBe("critical");
    });

    it("does not flag significant risk child with resolved status", () => {
      const assessments = [
        makeAssessment({ id: "a1", risk_level: "significant", status: "resolved" }),
      ];
      const alerts = identifySubstanceMisuseAlerts(assessments, []);
      const significant = alerts.filter((a) => a.type === "significant_risk_child");
      expect(significant).toHaveLength(0);
    });

    it("does not flag significant risk child with monitoring status", () => {
      const assessments = [
        makeAssessment({ id: "a1", risk_level: "significant", status: "monitoring" }),
      ];
      const alerts = identifySubstanceMisuseAlerts(assessments, []);
      const significant = alerts.filter((a) => a.type === "significant_risk_child");
      expect(significant).toHaveLength(0);
    });

    it("includes child name in significant risk message", () => {
      const assessments = [
        makeAssessment({ id: "a1", child_name: "Beth", risk_level: "significant", status: "active", substance_type: "cannabis" }),
      ];
      const alerts = identifySubstanceMisuseAlerts(assessments, []);
      const significant = alerts.find((a) => a.type === "significant_risk_child");
      expect(significant?.message).toContain("Beth");
    });

    it("includes substance type in significant risk message", () => {
      const assessments = [
        makeAssessment({ id: "a1", child_name: "Beth", risk_level: "significant", status: "active", substance_type: "cannabis" }),
      ];
      const alerts = identifySubstanceMisuseAlerts(assessments, []);
      const significant = alerts.find((a) => a.type === "significant_risk_child");
      expect(significant?.message).toContain("cannabis");
    });

    it("does not generate serious_risk_child alert for significant risk", () => {
      const assessments = [
        makeAssessment({ id: "a1", risk_level: "significant", status: "active" }),
      ];
      const alerts = identifySubstanceMisuseAlerts(assessments, []);
      const serious = alerts.filter((a) => a.type === "serious_risk_child");
      expect(serious).toHaveLength(0);
    });
  });

  // ── overdue_assessment alerts ──────────────────────────────────────

  describe("overdue assessment alerts", () => {
    it("generates high alert for active assessment with past next_assessment_date", () => {
      const assessments = [
        makeAssessment({ id: "a1", child_name: "Alex", status: "active", next_assessment_date: daysAgo(10) }),
      ];
      const alerts = identifySubstanceMisuseAlerts(assessments, []);
      const overdue = alerts.filter((a) => a.type === "overdue_assessment");
      expect(overdue).toHaveLength(1);
      expect(overdue[0].severity).toBe("high");
      expect(overdue[0].id).toBe("a1");
    });

    it("generates high alert for monitoring assessment with past next_assessment_date", () => {
      const assessments = [
        makeAssessment({ id: "a1", child_name: "Alex", status: "monitoring", next_assessment_date: daysAgo(5) }),
      ];
      const alerts = identifySubstanceMisuseAlerts(assessments, []);
      const overdue = alerts.filter((a) => a.type === "overdue_assessment");
      expect(overdue).toHaveLength(1);
      expect(overdue[0].severity).toBe("high");
    });

    it("does not flag assessment with future next_assessment_date", () => {
      const assessments = [
        makeAssessment({ id: "a1", status: "active", next_assessment_date: daysFromNow(30) }),
      ];
      const alerts = identifySubstanceMisuseAlerts(assessments, []);
      const overdue = alerts.filter((a) => a.type === "overdue_assessment");
      expect(overdue).toHaveLength(0);
    });

    it("does not flag assessment with null next_assessment_date", () => {
      const assessments = [
        makeAssessment({ id: "a1", status: "active", next_assessment_date: null }),
      ];
      const alerts = identifySubstanceMisuseAlerts(assessments, []);
      const overdue = alerts.filter((a) => a.type === "overdue_assessment");
      expect(overdue).toHaveLength(0);
    });

    it("does not flag resolved assessment as overdue", () => {
      const assessments = [
        makeAssessment({ id: "a1", status: "resolved", next_assessment_date: daysAgo(10) }),
      ];
      const alerts = identifySubstanceMisuseAlerts(assessments, []);
      const overdue = alerts.filter((a) => a.type === "overdue_assessment");
      expect(overdue).toHaveLength(0);
    });

    it("does not flag escalated assessment as overdue", () => {
      const assessments = [
        makeAssessment({ id: "a1", status: "escalated", next_assessment_date: daysAgo(10) }),
      ];
      const alerts = identifySubstanceMisuseAlerts(assessments, []);
      const overdue = alerts.filter((a) => a.type === "overdue_assessment");
      expect(overdue).toHaveLength(0);
    });

    it("includes child name in overdue assessment message", () => {
      const assessments = [
        makeAssessment({ id: "a1", child_name: "Alex", status: "active", next_assessment_date: daysAgo(10) }),
      ];
      const alerts = identifySubstanceMisuseAlerts(assessments, []);
      const overdue = alerts.find((a) => a.type === "overdue_assessment");
      expect(overdue?.message).toContain("Alex");
    });

    it("includes days overdue in overdue assessment message", () => {
      const assessments = [
        makeAssessment({ id: "a1", child_name: "Alex", status: "active", next_assessment_date: daysAgo(10) }),
      ];
      const alerts = identifySubstanceMisuseAlerts(assessments, []);
      const overdue = alerts.find((a) => a.type === "overdue_assessment");
      expect(overdue?.message).toContain("10");
    });

    it("includes Reg 12 reference in overdue assessment message", () => {
      const assessments = [
        makeAssessment({ id: "a1", child_name: "Alex", status: "active", next_assessment_date: daysAgo(10) }),
      ];
      const alerts = identifySubstanceMisuseAlerts(assessments, []);
      const overdue = alerts.find((a) => a.type === "overdue_assessment");
      expect(overdue?.message).toContain("Reg 12");
    });
  });

  // ── no_intervention_plan alerts ────────────────────────────────────

  describe("no intervention plan alerts", () => {
    it("generates medium alert for moderate risk without intervention plan", () => {
      const assessments = [
        makeAssessment({ id: "a1", child_name: "Alex", risk_level: "moderate", intervention_plan: null, status: "active" }),
      ];
      const alerts = identifySubstanceMisuseAlerts(assessments, []);
      const noPlan = alerts.filter((a) => a.type === "no_intervention_plan");
      expect(noPlan).toHaveLength(1);
      expect(noPlan[0].severity).toBe("medium");
      expect(noPlan[0].id).toBe("a1");
    });

    it("generates medium alert for significant risk without intervention plan", () => {
      const assessments = [
        makeAssessment({ id: "a1", child_name: "Alex", risk_level: "significant", intervention_plan: null, status: "active" }),
      ];
      const alerts = identifySubstanceMisuseAlerts(assessments, []);
      const noPlan = alerts.filter((a) => a.type === "no_intervention_plan");
      expect(noPlan).toHaveLength(1);
      expect(noPlan[0].severity).toBe("medium");
    });

    it("generates medium alert for serious risk without intervention plan", () => {
      const assessments = [
        makeAssessment({ id: "a1", child_name: "Alex", risk_level: "serious", intervention_plan: null, status: "active" }),
      ];
      const alerts = identifySubstanceMisuseAlerts(assessments, []);
      const noPlan = alerts.filter((a) => a.type === "no_intervention_plan");
      expect(noPlan).toHaveLength(1);
      expect(noPlan[0].severity).toBe("medium");
    });

    it("does not flag low risk without intervention plan", () => {
      const assessments = [
        makeAssessment({ id: "a1", risk_level: "low", intervention_plan: null, status: "active" }),
      ];
      const alerts = identifySubstanceMisuseAlerts(assessments, []);
      const noPlan = alerts.filter((a) => a.type === "no_intervention_plan");
      expect(noPlan).toHaveLength(0);
    });

    it("does not flag none risk without intervention plan", () => {
      const assessments = [
        makeAssessment({ id: "a1", risk_level: "none", intervention_plan: null, status: "active" }),
      ];
      const alerts = identifySubstanceMisuseAlerts(assessments, []);
      const noPlan = alerts.filter((a) => a.type === "no_intervention_plan");
      expect(noPlan).toHaveLength(0);
    });

    it("does not flag moderate risk with intervention plan present", () => {
      const assessments = [
        makeAssessment({ id: "a1", risk_level: "moderate", intervention_plan: "CBT referral", status: "active" }),
      ];
      const alerts = identifySubstanceMisuseAlerts(assessments, []);
      const noPlan = alerts.filter((a) => a.type === "no_intervention_plan");
      expect(noPlan).toHaveLength(0);
    });

    it("does not flag resolved assessment without intervention plan", () => {
      const assessments = [
        makeAssessment({ id: "a1", risk_level: "moderate", intervention_plan: null, status: "resolved" }),
      ];
      const alerts = identifySubstanceMisuseAlerts(assessments, []);
      const noPlan = alerts.filter((a) => a.type === "no_intervention_plan");
      expect(noPlan).toHaveLength(0);
    });

    it("does not flag escalated assessment without intervention plan", () => {
      const assessments = [
        makeAssessment({ id: "a1", risk_level: "moderate", intervention_plan: null, status: "escalated" }),
      ];
      const alerts = identifySubstanceMisuseAlerts(assessments, []);
      const noPlan = alerts.filter((a) => a.type === "no_intervention_plan");
      expect(noPlan).toHaveLength(0);
    });

    it("generates alert for monitoring status without intervention plan", () => {
      const assessments = [
        makeAssessment({ id: "a1", child_name: "Alex", risk_level: "significant", intervention_plan: null, status: "monitoring" }),
      ];
      const alerts = identifySubstanceMisuseAlerts(assessments, []);
      const noPlan = alerts.filter((a) => a.type === "no_intervention_plan");
      expect(noPlan).toHaveLength(1);
    });

    it("includes child name in no intervention plan message", () => {
      const assessments = [
        makeAssessment({ id: "a1", child_name: "Alex", risk_level: "moderate", intervention_plan: null, status: "active" }),
      ];
      const alerts = identifySubstanceMisuseAlerts(assessments, []);
      const noPlan = alerts.find((a) => a.type === "no_intervention_plan");
      expect(noPlan?.message).toContain("Alex");
    });

    it("includes risk level in no intervention plan message", () => {
      const assessments = [
        makeAssessment({ id: "a1", child_name: "Alex", risk_level: "moderate", intervention_plan: null, status: "active" }),
      ];
      const alerts = identifySubstanceMisuseAlerts(assessments, []);
      const noPlan = alerts.find((a) => a.type === "no_intervention_plan");
      expect(noPlan?.message).toContain("moderate");
    });

    it("includes Reg 12 reference in no intervention plan message", () => {
      const assessments = [
        makeAssessment({ id: "a1", child_name: "Alex", risk_level: "moderate", intervention_plan: null, status: "active" }),
      ];
      const alerts = identifySubstanceMisuseAlerts(assessments, []);
      const noPlan = alerts.find((a) => a.type === "no_intervention_plan");
      expect(noPlan?.message).toContain("Reg 12");
    });
  });

  // ── overdose_incident alerts ───────────────────────────────────────

  describe("overdose incident alerts", () => {
    it("generates critical alert for overdose incident", () => {
      const incidents = [
        makeIncident({ id: "i1", child_name: "Alex", incident_type: "overdose", incident_date: daysAgo(2), police_involved: true, social_worker_notified: true, ofsted_notified: true }),
      ];
      const alerts = identifySubstanceMisuseAlerts([], incidents);
      const overdose = alerts.filter((a) => a.type === "overdose_incident");
      expect(overdose).toHaveLength(1);
      expect(overdose[0].severity).toBe("critical");
      expect(overdose[0].id).toBe("i1");
    });

    it("does not generate overdose alert for non-overdose incident types", () => {
      const incidents = [
        makeIncident({ id: "i1", incident_type: "found_substance" }),
        makeIncident({ id: "i2", incident_type: "under_influence" }),
        makeIncident({ id: "i3", incident_type: "disclosure" }),
      ];
      const alerts = identifySubstanceMisuseAlerts([], incidents);
      const overdose = alerts.filter((a) => a.type === "overdose_incident");
      expect(overdose).toHaveLength(0);
    });

    it("includes child name in overdose alert message", () => {
      const incidents = [
        makeIncident({ id: "i1", child_name: "Alex", incident_type: "overdose", incident_date: daysAgo(2), police_involved: true, social_worker_notified: true, ofsted_notified: true }),
      ];
      const alerts = identifySubstanceMisuseAlerts([], incidents);
      const overdose = alerts.find((a) => a.type === "overdose_incident");
      expect(overdose?.message).toContain("Alex");
    });

    it("includes Reg 34 reference in overdose alert message", () => {
      const incidents = [
        makeIncident({ id: "i1", child_name: "Alex", incident_type: "overdose", incident_date: daysAgo(2), police_involved: true, social_worker_notified: true, ofsted_notified: true }),
      ];
      const alerts = identifySubstanceMisuseAlerts([], incidents);
      const overdose = alerts.find((a) => a.type === "overdose_incident");
      expect(overdose?.message).toContain("Reg 34");
    });

    it("flags multiple overdose incidents", () => {
      const incidents = [
        makeIncident({ id: "i1", child_name: "Alex", incident_type: "overdose", incident_date: daysAgo(2), police_involved: true, social_worker_notified: true, ofsted_notified: true }),
        makeIncident({ id: "i2", child_name: "Beth", incident_type: "overdose", incident_date: daysAgo(5), police_involved: true, social_worker_notified: true, ofsted_notified: true }),
      ];
      const alerts = identifySubstanceMisuseAlerts([], incidents);
      const overdose = alerts.filter((a) => a.type === "overdose_incident");
      expect(overdose).toHaveLength(2);
    });
  });

  // ── incident_no_follow_up alerts ───────────────────────────────────

  describe("incident no follow-up alerts", () => {
    it("generates high alert for incident with past follow_up_date and not completed", () => {
      const incidents = [
        makeIncident({ id: "i1", child_name: "Alex", follow_up_date: daysAgo(5), follow_up_completed: false, incident_date: daysAgo(15) }),
      ];
      const alerts = identifySubstanceMisuseAlerts([], incidents);
      const noFollowUp = alerts.filter((a) => a.type === "incident_no_follow_up");
      expect(noFollowUp).toHaveLength(1);
      expect(noFollowUp[0].severity).toBe("high");
      expect(noFollowUp[0].id).toBe("i1");
    });

    it("does not flag incident with completed follow-up", () => {
      const incidents = [
        makeIncident({ id: "i1", follow_up_date: daysAgo(5), follow_up_completed: true }),
      ];
      const alerts = identifySubstanceMisuseAlerts([], incidents);
      const noFollowUp = alerts.filter((a) => a.type === "incident_no_follow_up");
      expect(noFollowUp).toHaveLength(0);
    });

    it("does not flag incident with future follow_up_date", () => {
      const incidents = [
        makeIncident({ id: "i1", follow_up_date: daysFromNow(10), follow_up_completed: false }),
      ];
      const alerts = identifySubstanceMisuseAlerts([], incidents);
      const noFollowUp = alerts.filter((a) => a.type === "incident_no_follow_up");
      expect(noFollowUp).toHaveLength(0);
    });

    it("does not flag incident with null follow_up_date", () => {
      const incidents = [
        makeIncident({ id: "i1", follow_up_date: null, follow_up_completed: false }),
      ];
      const alerts = identifySubstanceMisuseAlerts([], incidents);
      const noFollowUp = alerts.filter((a) => a.type === "incident_no_follow_up");
      expect(noFollowUp).toHaveLength(0);
    });

    it("includes child name in incident no follow-up message", () => {
      const incidents = [
        makeIncident({ id: "i1", child_name: "Alex", follow_up_date: daysAgo(5), follow_up_completed: false, incident_date: daysAgo(15) }),
      ];
      const alerts = identifySubstanceMisuseAlerts([], incidents);
      const noFollowUp = alerts.find((a) => a.type === "incident_no_follow_up");
      expect(noFollowUp?.message).toContain("Alex");
    });
  });

  // ── police_not_recorded alerts ─────────────────────────────────────

  describe("police not recorded alerts", () => {
    it("generates high alert for suspected_dealing without police involvement", () => {
      const incidents = [
        makeIncident({ id: "i1", child_name: "Alex", incident_type: "suspected_dealing", police_involved: false, social_worker_notified: true, ofsted_notified: true }),
      ];
      const alerts = identifySubstanceMisuseAlerts([], incidents);
      const policeNot = alerts.filter((a) => a.type === "police_not_recorded");
      expect(policeNot).toHaveLength(1);
      expect(policeNot[0].severity).toBe("high");
      expect(policeNot[0].id).toBe("i1");
    });

    it("generates high alert for overdose without police involvement", () => {
      const incidents = [
        makeIncident({ id: "i1", child_name: "Alex", incident_type: "overdose", police_involved: false, social_worker_notified: true, ofsted_notified: true }),
      ];
      const alerts = identifySubstanceMisuseAlerts([], incidents);
      const policeNot = alerts.filter((a) => a.type === "police_not_recorded");
      expect(policeNot).toHaveLength(1);
      expect(policeNot[0].severity).toBe("high");
    });

    it("does not flag suspected_dealing with police involved", () => {
      const incidents = [
        makeIncident({ id: "i1", incident_type: "suspected_dealing", police_involved: true, social_worker_notified: true, ofsted_notified: true }),
      ];
      const alerts = identifySubstanceMisuseAlerts([], incidents);
      const policeNot = alerts.filter((a) => a.type === "police_not_recorded");
      expect(policeNot).toHaveLength(0);
    });

    it("does not flag overdose with police involved", () => {
      const incidents = [
        makeIncident({ id: "i1", incident_type: "overdose", police_involved: true, social_worker_notified: true, ofsted_notified: true }),
      ];
      const alerts = identifySubstanceMisuseAlerts([], incidents);
      const policeNot = alerts.filter((a) => a.type === "police_not_recorded");
      expect(policeNot).toHaveLength(0);
    });

    it("does not flag found_substance without police involvement", () => {
      const incidents = [
        makeIncident({ id: "i1", incident_type: "found_substance", police_involved: false }),
      ];
      const alerts = identifySubstanceMisuseAlerts([], incidents);
      const policeNot = alerts.filter((a) => a.type === "police_not_recorded");
      expect(policeNot).toHaveLength(0);
    });

    it("does not flag under_influence without police involvement", () => {
      const incidents = [
        makeIncident({ id: "i1", incident_type: "under_influence", police_involved: false, social_worker_notified: true }),
      ];
      const alerts = identifySubstanceMisuseAlerts([], incidents);
      const policeNot = alerts.filter((a) => a.type === "police_not_recorded");
      expect(policeNot).toHaveLength(0);
    });

    it("includes child name in police not recorded message", () => {
      const incidents = [
        makeIncident({ id: "i1", child_name: "Alex", incident_type: "suspected_dealing", police_involved: false, social_worker_notified: true, ofsted_notified: true }),
      ];
      const alerts = identifySubstanceMisuseAlerts([], incidents);
      const policeNot = alerts.find((a) => a.type === "police_not_recorded");
      expect(policeNot?.message).toContain("Alex");
    });
  });

  // ── social_worker_not_notified alerts ──────────────────────────────

  describe("social worker not notified alerts", () => {
    it("generates high alert for overdose without social worker notification", () => {
      const incidents = [
        makeIncident({ id: "i1", child_name: "Alex", incident_type: "overdose", social_worker_notified: false, police_involved: true, ofsted_notified: true }),
      ];
      const alerts = identifySubstanceMisuseAlerts([], incidents);
      const swNot = alerts.filter((a) => a.type === "social_worker_not_notified");
      expect(swNot).toHaveLength(1);
      expect(swNot[0].severity).toBe("high");
      expect(swNot[0].id).toBe("i1");
    });

    it("generates high alert for suspected_dealing without social worker notification", () => {
      const incidents = [
        makeIncident({ id: "i1", child_name: "Alex", incident_type: "suspected_dealing", social_worker_notified: false, police_involved: true, ofsted_notified: true }),
      ];
      const alerts = identifySubstanceMisuseAlerts([], incidents);
      const swNot = alerts.filter((a) => a.type === "social_worker_not_notified");
      expect(swNot).toHaveLength(1);
      expect(swNot[0].severity).toBe("high");
    });

    it("generates high alert for under_influence without social worker notification", () => {
      const incidents = [
        makeIncident({ id: "i1", child_name: "Alex", incident_type: "under_influence", social_worker_notified: false }),
      ];
      const alerts = identifySubstanceMisuseAlerts([], incidents);
      const swNot = alerts.filter((a) => a.type === "social_worker_not_notified");
      expect(swNot).toHaveLength(1);
      expect(swNot[0].severity).toBe("high");
    });

    it("does not flag overdose with social worker notified", () => {
      const incidents = [
        makeIncident({ id: "i1", incident_type: "overdose", social_worker_notified: true, police_involved: true, ofsted_notified: true }),
      ];
      const alerts = identifySubstanceMisuseAlerts([], incidents);
      const swNot = alerts.filter((a) => a.type === "social_worker_not_notified");
      expect(swNot).toHaveLength(0);
    });

    it("does not flag suspected_dealing with social worker notified", () => {
      const incidents = [
        makeIncident({ id: "i1", incident_type: "suspected_dealing", social_worker_notified: true, police_involved: true, ofsted_notified: true }),
      ];
      const alerts = identifySubstanceMisuseAlerts([], incidents);
      const swNot = alerts.filter((a) => a.type === "social_worker_not_notified");
      expect(swNot).toHaveLength(0);
    });

    it("does not flag found_substance without social worker notification", () => {
      const incidents = [
        makeIncident({ id: "i1", incident_type: "found_substance", social_worker_notified: false }),
      ];
      const alerts = identifySubstanceMisuseAlerts([], incidents);
      const swNot = alerts.filter((a) => a.type === "social_worker_not_notified");
      expect(swNot).toHaveLength(0);
    });

    it("does not flag disclosure without social worker notification", () => {
      const incidents = [
        makeIncident({ id: "i1", incident_type: "disclosure", social_worker_notified: false }),
      ];
      const alerts = identifySubstanceMisuseAlerts([], incidents);
      const swNot = alerts.filter((a) => a.type === "social_worker_not_notified");
      expect(swNot).toHaveLength(0);
    });

    it("includes child name in social worker not notified message", () => {
      const incidents = [
        makeIncident({ id: "i1", child_name: "Alex", incident_type: "overdose", social_worker_notified: false, police_involved: true, ofsted_notified: true }),
      ];
      const alerts = identifySubstanceMisuseAlerts([], incidents);
      const swNot = alerts.find((a) => a.type === "social_worker_not_notified");
      expect(swNot?.message).toContain("Alex");
    });
  });

  // ── ofsted_not_notified alerts ─────────────────────────────────────

  describe("ofsted not notified alerts", () => {
    it("generates critical alert for overdose without Ofsted notification", () => {
      const incidents = [
        makeIncident({ id: "i1", child_name: "Alex", incident_type: "overdose", ofsted_notified: false, police_involved: true, social_worker_notified: true }),
      ];
      const alerts = identifySubstanceMisuseAlerts([], incidents);
      const ofstedNot = alerts.filter((a) => a.type === "ofsted_not_notified");
      expect(ofstedNot).toHaveLength(1);
      expect(ofstedNot[0].severity).toBe("critical");
      expect(ofstedNot[0].id).toBe("i1");
    });

    it("generates critical alert for suspected_dealing without Ofsted notification", () => {
      const incidents = [
        makeIncident({ id: "i1", child_name: "Alex", incident_type: "suspected_dealing", ofsted_notified: false, police_involved: true, social_worker_notified: true }),
      ];
      const alerts = identifySubstanceMisuseAlerts([], incidents);
      const ofstedNot = alerts.filter((a) => a.type === "ofsted_not_notified");
      expect(ofstedNot).toHaveLength(1);
      expect(ofstedNot[0].severity).toBe("critical");
    });

    it("does not flag overdose with Ofsted notified", () => {
      const incidents = [
        makeIncident({ id: "i1", incident_type: "overdose", ofsted_notified: true, police_involved: true, social_worker_notified: true }),
      ];
      const alerts = identifySubstanceMisuseAlerts([], incidents);
      const ofstedNot = alerts.filter((a) => a.type === "ofsted_not_notified");
      expect(ofstedNot).toHaveLength(0);
    });

    it("does not flag suspected_dealing with Ofsted notified", () => {
      const incidents = [
        makeIncident({ id: "i1", incident_type: "suspected_dealing", ofsted_notified: true, police_involved: true, social_worker_notified: true }),
      ];
      const alerts = identifySubstanceMisuseAlerts([], incidents);
      const ofstedNot = alerts.filter((a) => a.type === "ofsted_not_notified");
      expect(ofstedNot).toHaveLength(0);
    });

    it("does not flag under_influence without Ofsted notification", () => {
      const incidents = [
        makeIncident({ id: "i1", incident_type: "under_influence", ofsted_notified: false, social_worker_notified: true }),
      ];
      const alerts = identifySubstanceMisuseAlerts([], incidents);
      const ofstedNot = alerts.filter((a) => a.type === "ofsted_not_notified");
      expect(ofstedNot).toHaveLength(0);
    });

    it("does not flag found_substance without Ofsted notification", () => {
      const incidents = [
        makeIncident({ id: "i1", incident_type: "found_substance", ofsted_notified: false }),
      ];
      const alerts = identifySubstanceMisuseAlerts([], incidents);
      const ofstedNot = alerts.filter((a) => a.type === "ofsted_not_notified");
      expect(ofstedNot).toHaveLength(0);
    });

    it("includes child name in Ofsted not notified message", () => {
      const incidents = [
        makeIncident({ id: "i1", child_name: "Alex", incident_type: "overdose", ofsted_notified: false, police_involved: true, social_worker_notified: true }),
      ];
      const alerts = identifySubstanceMisuseAlerts([], incidents);
      const ofstedNot = alerts.find((a) => a.type === "ofsted_not_notified");
      expect(ofstedNot?.message).toContain("Alex");
    });

    it("includes Reg 34 reference in Ofsted not notified message", () => {
      const incidents = [
        makeIncident({ id: "i1", child_name: "Alex", incident_type: "overdose", ofsted_notified: false, police_involved: true, social_worker_notified: true }),
      ];
      const alerts = identifySubstanceMisuseAlerts([], incidents);
      const ofstedNot = alerts.find((a) => a.type === "ofsted_not_notified");
      expect(ofstedNot?.message).toContain("Reg 34");
    });
  });

  // ── Combined / complex scenarios ───────────────────────────────────

  describe("combined alert scenarios", () => {
    it("generates multiple alert types for overdose incident with missing notifications", () => {
      const incidents = [
        makeIncident({
          id: "i1",
          child_name: "Alex",
          incident_type: "overdose",
          police_involved: false,
          social_worker_notified: false,
          ofsted_notified: false,
        }),
      ];
      const alerts = identifySubstanceMisuseAlerts([], incidents);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("overdose_incident");
      expect(types).toContain("police_not_recorded");
      expect(types).toContain("social_worker_not_notified");
      expect(types).toContain("ofsted_not_notified");
    });

    it("generates both assessment and incident alerts simultaneously", () => {
      const assessments = [
        makeAssessment({
          id: "a1",
          child_name: "Alex",
          risk_level: "serious",
          status: "active",
          substance_type: "cocaine",
          intervention_plan: null,
          next_assessment_date: daysAgo(10),
        }),
      ];
      const incidents = [
        makeIncident({
          id: "i1",
          child_name: "Beth",
          incident_type: "overdose",
          police_involved: true,
          social_worker_notified: true,
          ofsted_notified: true,
        }),
      ];
      const alerts = identifySubstanceMisuseAlerts(assessments, incidents);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("serious_risk_child");
      expect(types).toContain("overdue_assessment");
      expect(types).toContain("no_intervention_plan");
      expect(types).toContain("overdose_incident");
    });

    it("returns no alerts for healthy state", () => {
      const assessments = [
        makeAssessment({
          id: "a1",
          child_id: "c1",
          risk_level: "low",
          status: "active",
          intervention_plan: null,
          next_assessment_date: daysFromNow(30),
        }),
      ];
      const incidents = [
        makeIncident({
          id: "i1",
          child_id: "c1",
          incident_type: "found_substance",
          police_involved: false,
          social_worker_notified: true,
          parent_notified: true,
          ofsted_notified: false,
          follow_up_date: daysFromNow(10),
          follow_up_completed: false,
        }),
      ];
      const alerts = identifySubstanceMisuseAlerts(assessments, incidents);
      expect(alerts).toHaveLength(0);
    });

    it("handles large mixed dataset correctly", () => {
      const assessments = [
        makeAssessment({ id: "a1", child_id: "c1", child_name: "Alex", risk_level: "serious", status: "active", substance_type: "cocaine", intervention_plan: null, next_assessment_date: daysAgo(10) }),
        makeAssessment({ id: "a2", child_id: "c2", child_name: "Beth", risk_level: "significant", status: "escalated", substance_type: "cannabis", intervention_plan: "Group work", next_assessment_date: daysFromNow(30) }),
        makeAssessment({ id: "a3", child_id: "c3", child_name: "Carl", risk_level: "low", status: "resolved", intervention_plan: null, next_assessment_date: daysAgo(20) }),
        makeAssessment({ id: "a4", child_id: "c4", child_name: "Dana", risk_level: "moderate", status: "monitoring", intervention_plan: null, next_assessment_date: daysFromNow(15) }),
      ];
      const incidents = [
        makeIncident({ id: "i1", child_name: "Alex", incident_type: "overdose", police_involved: false, social_worker_notified: false, ofsted_notified: false }),
        makeIncident({ id: "i2", child_name: "Beth", incident_type: "found_substance", follow_up_date: daysAgo(3), follow_up_completed: false, incident_date: daysAgo(10) }),
      ];
      const alerts = identifySubstanceMisuseAlerts(assessments, incidents);
      const types = alerts.map((a) => a.type);
      // Alex: serious_risk_child, overdue_assessment, no_intervention_plan
      expect(types).toContain("serious_risk_child");
      expect(types).toContain("overdue_assessment");
      expect(types).toContain("no_intervention_plan");
      // Beth: significant_risk_child
      expect(types).toContain("significant_risk_child");
      // Dana: no_intervention_plan (moderate + monitoring + no plan)
      // Alex incident: overdose_incident, police_not_recorded, social_worker_not_notified, ofsted_not_notified
      expect(types).toContain("overdose_incident");
      expect(types).toContain("police_not_recorded");
      expect(types).toContain("social_worker_not_notified");
      expect(types).toContain("ofsted_not_notified");
      // Beth incident: incident_no_follow_up
      expect(types).toContain("incident_no_follow_up");
    });

    it("all alerts have required fields: type, severity, message, id", () => {
      const assessments = [
        makeAssessment({ id: "a1", child_name: "Alex", risk_level: "serious", status: "active", substance_type: "cocaine", intervention_plan: null, next_assessment_date: daysAgo(10) }),
      ];
      const incidents = [
        makeIncident({ id: "i1", child_name: "Beth", incident_type: "overdose", police_involved: false, social_worker_notified: false, ofsted_notified: false }),
      ];
      const alerts = identifySubstanceMisuseAlerts(assessments, incidents);
      for (const alert of alerts) {
        expect(alert.type).toBeTruthy();
        expect(alert.severity).toBeTruthy();
        expect(alert.message).toBeTruthy();
        expect(alert.id).toBeTruthy();
      }
    });

    it("all alert severities are valid values", () => {
      const assessments = [
        makeAssessment({ id: "a1", child_name: "Alex", risk_level: "serious", status: "active", substance_type: "cocaine", intervention_plan: null, next_assessment_date: daysAgo(10) }),
      ];
      const incidents = [
        makeIncident({ id: "i1", child_name: "Beth", incident_type: "overdose", police_involved: false, social_worker_notified: false, ofsted_notified: false }),
      ];
      const alerts = identifySubstanceMisuseAlerts(assessments, incidents);
      const validSeverities = ["critical", "high", "medium"];
      for (const alert of alerts) {
        expect(validSeverities).toContain(alert.severity);
      }
    });

    it("suspected_dealing triggers police, social worker, and ofsted alerts when all missing", () => {
      const incidents = [
        makeIncident({
          id: "i1",
          child_name: "Alex",
          incident_type: "suspected_dealing",
          police_involved: false,
          social_worker_notified: false,
          ofsted_notified: false,
        }),
      ];
      const alerts = identifySubstanceMisuseAlerts([], incidents);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("police_not_recorded");
      expect(types).toContain("social_worker_not_notified");
      expect(types).toContain("ofsted_not_notified");
    });

    it("under_influence only triggers social worker alert when not notified", () => {
      const incidents = [
        makeIncident({
          id: "i1",
          child_name: "Alex",
          incident_type: "under_influence",
          police_involved: false,
          social_worker_notified: false,
          ofsted_notified: false,
        }),
      ];
      const alerts = identifySubstanceMisuseAlerts([], incidents);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("social_worker_not_notified");
      expect(types).not.toContain("police_not_recorded");
      expect(types).not.toContain("ofsted_not_notified");
    });

    it("formats substance type with underscores replaced by spaces in messages", () => {
      const assessments = [
        makeAssessment({ id: "a1", child_name: "Alex", risk_level: "serious", status: "active", substance_type: "ecstasy_mdma" }),
      ];
      const alerts = identifySubstanceMisuseAlerts(assessments, []);
      const serious = alerts.find((a) => a.type === "serious_risk_child");
      expect(serious?.message).toContain("ecstasy mdma");
      expect(serious?.message).not.toContain("ecstasy_mdma");
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// CRUD — Substance Assessments (Supabase disabled)
// ═══════════════════════════════════════════════════════════════════════════

describe("listAssessments", () => {
  it("returns ok: true with empty data array when Supabase is disabled", async () => {
    const result = await listAssessments("home-1");
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("returns ok: true with empty data array regardless of childId filter", async () => {
    const result = await listAssessments("home-1", { childId: "child-1" });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("returns ok: true with empty data array regardless of substanceType filter", async () => {
    const result = await listAssessments("home-1", { substanceType: "alcohol" });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("returns ok: true with empty data array regardless of riskLevel filter", async () => {
    const result = await listAssessments("home-1", { riskLevel: "serious" });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("returns ok: true with empty data array regardless of status filter", async () => {
    const result = await listAssessments("home-1", { status: "active" });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("returns ok: true with empty data array regardless of date filters", async () => {
    const result = await listAssessments("home-1", { dateFrom: "2026-01-01", dateTo: "2026-12-31" });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("returns ok: true with empty data array regardless of limit filter", async () => {
    const result = await listAssessments("home-1", { limit: 50 });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("returns ok: true with empty data array regardless of combined filters", async () => {
    const result = await listAssessments("home-1", {
      childId: "child-1",
      substanceType: "cannabis",
      riskLevel: "moderate",
      status: "active",
      dateFrom: "2026-01-01",
      dateTo: "2026-12-31",
      limit: 25,
    });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });
});

describe("createAssessment", () => {
  it("returns ok: false with Supabase not configured error", async () => {
    const result = await createAssessment({
      homeId: "home-1",
      childId: "child-1",
      childName: "Test Child",
      assessmentDate: "2026-05-01",
      assessedBy: "staff-1",
      substanceType: "alcohol",
    });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Supabase not configured");
  });

  it("returns ok: false with Supabase not configured error even with all fields", async () => {
    const result = await createAssessment({
      homeId: "home-1",
      childId: "child-1",
      childName: "Test Child",
      assessmentDate: "2026-05-01",
      assessedBy: "staff-1",
      substanceType: "cocaine",
      riskLevel: "serious",
      frequency: "regular",
      context: "addiction",
      impactOnHealth: "Significant health deterioration",
      impactOnBehaviour: "Aggressive behaviour",
      impactOnEducation: "School attendance dropped",
      referralMade: true,
      referralTo: "CAMHS",
      referralDate: "2026-05-02",
      interventionPlan: "Weekly therapy sessions",
      nextAssessmentDate: "2026-06-01",
      status: "active",
      notes: "Urgent case",
    });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Supabase not configured");
  });
});

describe("updateAssessment", () => {
  it("returns ok: false with Supabase not configured error", async () => {
    const result = await updateAssessment("assess-1", { status: "resolved" });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Supabase not configured");
  });

  it("returns ok: false with Supabase not configured error for any updates", async () => {
    const result = await updateAssessment("assess-1", {
      risk_level: "serious",
      intervention_plan: "Updated plan",
      notes: "Reassessed",
    });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Supabase not configured");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// CRUD — Substance Incidents (Supabase disabled)
// ═══════════════════════════════════════════════════════════════════════════

describe("listIncidents", () => {
  it("returns ok: true with empty data array when Supabase is disabled", async () => {
    const result = await listIncidents("home-1");
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("returns ok: true with empty data array regardless of childId filter", async () => {
    const result = await listIncidents("home-1", { childId: "child-1" });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("returns ok: true with empty data array regardless of substanceType filter", async () => {
    const result = await listIncidents("home-1", { substanceType: "cannabis" });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("returns ok: true with empty data array regardless of incidentType filter", async () => {
    const result = await listIncidents("home-1", { incidentType: "overdose" });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("returns ok: true with empty data array regardless of date filters", async () => {
    const result = await listIncidents("home-1", { dateFrom: "2026-01-01", dateTo: "2026-12-31" });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("returns ok: true with empty data array regardless of limit filter", async () => {
    const result = await listIncidents("home-1", { limit: 50 });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("returns ok: true with empty data array regardless of combined filters", async () => {
    const result = await listIncidents("home-1", {
      childId: "child-1",
      substanceType: "alcohol",
      incidentType: "found_substance",
      dateFrom: "2026-01-01",
      dateTo: "2026-12-31",
      limit: 25,
    });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });
});

describe("createIncident", () => {
  it("returns ok: false with Supabase not configured error", async () => {
    const result = await createIncident({
      homeId: "home-1",
      childId: "child-1",
      childName: "Test Child",
      incidentDate: "2026-05-10",
      reportedBy: "staff-1",
      substanceType: "alcohol",
      incidentType: "found_substance",
    });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Supabase not configured");
  });

  it("returns ok: false with Supabase not configured error even with all fields", async () => {
    const result = await createIncident({
      homeId: "home-1",
      childId: "child-1",
      childName: "Test Child",
      incidentDate: "2026-05-10",
      reportedBy: "staff-1",
      substanceType: "cocaine",
      incidentType: "overdose",
      description: "Child found unresponsive",
      location: "Bedroom",
      immediateAction: "Called 999",
      medicalAttention: true,
      policeInvolved: true,
      socialWorkerNotified: true,
      parentNotified: true,
      ofstedNotified: true,
      followUpActions: [{ action: "Review care plan", assigned_to: "staff-2", due_date: "2026-05-15", completed: false }],
      followUpDate: "2026-05-17",
      followUpCompleted: false,
    });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Supabase not configured");
  });
});
