// ══════════════════════════════════════════════════════════════════════════════
// CARA — IMPACT & RISK ASSESSMENT SERVICE TESTS
// Pure-function unit tests for impact risk assessment metrics computation,
// alert identification, constant validation, and CRUD fallback behaviour
// (Supabase disabled). CHR 2015 Reg 12 (children receive care from
// appropriate staff), Reg 14 (care planning — placement matching),
// Reg 36 (notifications).
// SCCIF: Helped & Protected — "Impact risk assessments are thorough."
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  isSupabaseEnabled: () => false,
  createServerClient: () => null,
}));

import {
  _testing,
  ASSESSMENT_STATUSES,
  RISK_LEVELS,
  COMPATIBILITY_FACTORS,
  IMPACT_AREAS,
  MITIGATION_STATUSES,
  listAssessments,
  createAssessment,
  updateAssessment,
} from "../impact-risk-assessment-service";

import type { ImpactAssessment } from "../impact-risk-assessment-service";

const { computeAssessmentMetrics, identifyAssessmentAlerts } = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

/** Date string N days ago from now. */
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
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

/** Build a minimal ImpactAssessment with sensible defaults. */
function makeAssessment(
  overrides: Partial<ImpactAssessment> = {},
): ImpactAssessment {
  return {
    id: "assess-1",
    home_id: "home-1",
    child_id: "child-1",
    child_name: "Alice Smith",
    referral_date: daysAgo(14),
    assessment_date: daysAgo(7),
    assessed_by: "staff-1",
    status: "completed",
    overall_risk_level: "medium",
    compatibility_factors: [],
    impact_areas: [],
    mitigations: [],
    existing_children_consulted: true,
    existing_children_views: "Children are happy with placement",
    staff_consulted: true,
    staff_views: "Staff support the placement",
    recommendation: "accept",
    conditions: null,
    approved_by: null,
    approval_date: null,
    review_date: daysFromNow(90),
    notes: null,
    created_at: daysAgoISO(7),
    updated_at: daysAgoISO(7),
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

describe("ASSESSMENT_STATUSES", () => {
  it("has exactly 5 statuses", () => {
    expect(ASSESSMENT_STATUSES).toHaveLength(5);
  });

  it("contains unique status values", () => {
    const values = ASSESSMENT_STATUSES.map((s) => s.status);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = ASSESSMENT_STATUSES.map((s) => s.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes draft", () => {
    expect(ASSESSMENT_STATUSES.find((s) => s.status === "draft")).toBeTruthy();
  });

  it("includes in_progress", () => {
    expect(
      ASSESSMENT_STATUSES.find((s) => s.status === "in_progress"),
    ).toBeTruthy();
  });

  it("includes completed", () => {
    expect(
      ASSESSMENT_STATUSES.find((s) => s.status === "completed"),
    ).toBeTruthy();
  });

  it("includes approved", () => {
    expect(
      ASSESSMENT_STATUSES.find((s) => s.status === "approved"),
    ).toBeTruthy();
  });

  it("includes rejected", () => {
    expect(
      ASSESSMENT_STATUSES.find((s) => s.status === "rejected"),
    ).toBeTruthy();
  });

  it("each entry has a non-empty label", () => {
    for (const s of ASSESSMENT_STATUSES) {
      expect(s.label.length).toBeGreaterThan(0);
    }
  });
});

describe("RISK_LEVELS", () => {
  it("has exactly 5 levels", () => {
    expect(RISK_LEVELS).toHaveLength(5);
  });

  it("contains unique level values", () => {
    const values = RISK_LEVELS.map((r) => r.level);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = RISK_LEVELS.map((r) => r.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes very_low", () => {
    expect(RISK_LEVELS.find((r) => r.level === "very_low")).toBeTruthy();
  });

  it("includes low", () => {
    expect(RISK_LEVELS.find((r) => r.level === "low")).toBeTruthy();
  });

  it("includes medium", () => {
    expect(RISK_LEVELS.find((r) => r.level === "medium")).toBeTruthy();
  });

  it("includes high", () => {
    expect(RISK_LEVELS.find((r) => r.level === "high")).toBeTruthy();
  });

  it("includes very_high", () => {
    expect(RISK_LEVELS.find((r) => r.level === "very_high")).toBeTruthy();
  });

  it("each entry has a non-empty label", () => {
    for (const r of RISK_LEVELS) {
      expect(r.label.length).toBeGreaterThan(0);
    }
  });
});

describe("COMPATIBILITY_FACTORS", () => {
  it("has exactly 14 factors", () => {
    expect(COMPATIBILITY_FACTORS).toHaveLength(14);
  });

  it("contains unique factor values", () => {
    const values = COMPATIBILITY_FACTORS.map((f) => f.factor);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = COMPATIBILITY_FACTORS.map((f) => f.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes age_range", () => {
    expect(
      COMPATIBILITY_FACTORS.find((f) => f.factor === "age_range"),
    ).toBeTruthy();
  });

  it("includes gender_dynamics", () => {
    expect(
      COMPATIBILITY_FACTORS.find((f) => f.factor === "gender_dynamics"),
    ).toBeTruthy();
  });

  it("includes behavioural_needs", () => {
    expect(
      COMPATIBILITY_FACTORS.find((f) => f.factor === "behavioural_needs"),
    ).toBeTruthy();
  });

  it("includes emotional_needs", () => {
    expect(
      COMPATIBILITY_FACTORS.find((f) => f.factor === "emotional_needs"),
    ).toBeTruthy();
  });

  it("includes safeguarding_history", () => {
    expect(
      COMPATIBILITY_FACTORS.find((f) => f.factor === "safeguarding_history"),
    ).toBeTruthy();
  });

  it("includes education_needs", () => {
    expect(
      COMPATIBILITY_FACTORS.find((f) => f.factor === "education_needs"),
    ).toBeTruthy();
  });

  it("includes health_needs", () => {
    expect(
      COMPATIBILITY_FACTORS.find((f) => f.factor === "health_needs"),
    ).toBeTruthy();
  });

  it("includes cultural_background", () => {
    expect(
      COMPATIBILITY_FACTORS.find((f) => f.factor === "cultural_background"),
    ).toBeTruthy();
  });

  it("includes language", () => {
    expect(
      COMPATIBILITY_FACTORS.find((f) => f.factor === "language"),
    ).toBeTruthy();
  });

  it("includes family_contact_patterns", () => {
    expect(
      COMPATIBILITY_FACTORS.find((f) => f.factor === "family_contact_patterns"),
    ).toBeTruthy();
  });

  it("includes peer_relationships", () => {
    expect(
      COMPATIBILITY_FACTORS.find((f) => f.factor === "peer_relationships"),
    ).toBeTruthy();
  });

  it("includes substance_misuse_risk", () => {
    expect(
      COMPATIBILITY_FACTORS.find((f) => f.factor === "substance_misuse_risk"),
    ).toBeTruthy();
  });

  it("includes exploitation_risk", () => {
    expect(
      COMPATIBILITY_FACTORS.find((f) => f.factor === "exploitation_risk"),
    ).toBeTruthy();
  });

  it("includes other", () => {
    expect(
      COMPATIBILITY_FACTORS.find((f) => f.factor === "other"),
    ).toBeTruthy();
  });

  it("each entry has a non-empty label", () => {
    for (const f of COMPATIBILITY_FACTORS) {
      expect(f.label.length).toBeGreaterThan(0);
    }
  });
});

describe("IMPACT_AREAS", () => {
  it("has exactly 10 areas", () => {
    expect(IMPACT_AREAS).toHaveLength(10);
  });

  it("contains unique area values", () => {
    const values = IMPACT_AREAS.map((a) => a.area);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = IMPACT_AREAS.map((a) => a.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes existing_children_safety", () => {
    expect(
      IMPACT_AREAS.find((a) => a.area === "existing_children_safety"),
    ).toBeTruthy();
  });

  it("includes existing_children_wellbeing", () => {
    expect(
      IMPACT_AREAS.find((a) => a.area === "existing_children_wellbeing"),
    ).toBeTruthy();
  });

  it("includes staffing_capacity", () => {
    expect(
      IMPACT_AREAS.find((a) => a.area === "staffing_capacity"),
    ).toBeTruthy();
  });

  it("includes bedroom_availability", () => {
    expect(
      IMPACT_AREAS.find((a) => a.area === "bedroom_availability"),
    ).toBeTruthy();
  });

  it("includes therapeutic_environment", () => {
    expect(
      IMPACT_AREAS.find((a) => a.area === "therapeutic_environment"),
    ).toBeTruthy();
  });

  it("includes education_provision", () => {
    expect(
      IMPACT_AREAS.find((a) => a.area === "education_provision"),
    ).toBeTruthy();
  });

  it("includes group_dynamics", () => {
    expect(
      IMPACT_AREAS.find((a) => a.area === "group_dynamics"),
    ).toBeTruthy();
  });

  it("includes regulatory_compliance", () => {
    expect(
      IMPACT_AREAS.find((a) => a.area === "regulatory_compliance"),
    ).toBeTruthy();
  });

  it("includes community_impact", () => {
    expect(
      IMPACT_AREAS.find((a) => a.area === "community_impact"),
    ).toBeTruthy();
  });

  it("includes financial_viability", () => {
    expect(
      IMPACT_AREAS.find((a) => a.area === "financial_viability"),
    ).toBeTruthy();
  });

  it("each entry has a non-empty label", () => {
    for (const a of IMPACT_AREAS) {
      expect(a.label.length).toBeGreaterThan(0);
    }
  });
});

describe("MITIGATION_STATUSES", () => {
  it("has exactly 4 statuses", () => {
    expect(MITIGATION_STATUSES).toHaveLength(4);
  });

  it("contains unique status values", () => {
    const values = MITIGATION_STATUSES.map((m) => m.status);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = MITIGATION_STATUSES.map((m) => m.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes identified", () => {
    expect(
      MITIGATION_STATUSES.find((m) => m.status === "identified"),
    ).toBeTruthy();
  });

  it("includes in_progress", () => {
    expect(
      MITIGATION_STATUSES.find((m) => m.status === "in_progress"),
    ).toBeTruthy();
  });

  it("includes implemented", () => {
    expect(
      MITIGATION_STATUSES.find((m) => m.status === "implemented"),
    ).toBeTruthy();
  });

  it("includes reviewed", () => {
    expect(
      MITIGATION_STATUSES.find((m) => m.status === "reviewed"),
    ).toBeTruthy();
  });

  it("each entry has a non-empty label", () => {
    for (const m of MITIGATION_STATUSES) {
      expect(m.label.length).toBeGreaterThan(0);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. computeAssessmentMetrics
// ═══════════════════════════════════════════════════════════════════════════

describe("computeAssessmentMetrics", () => {
  // ── Empty input ──────────────────────────────────────────────────────

  it("returns zeroed metrics for empty array", () => {
    const m = computeAssessmentMetrics([]);
    expect(m.total_assessments).toBe(0);
    expect(m.completed_assessments).toBe(0);
    expect(m.pending_assessments).toBe(0);
    expect(m.accepted).toBe(0);
    expect(m.rejected).toBe(0);
    expect(m.accepted_with_conditions).toBe(0);
    expect(m.avg_risk_level).toBeNull();;
    expect(m.high_risk_count).toBe(0);
    expect(m.children_consulted_rate).toBeNull();;
    expect(m.staff_consulted_rate).toBeNull();;
    expect(m.open_mitigations).toBe(0);
    expect(Object.keys(m.by_risk_level)).toHaveLength(0);
    expect(Object.keys(m.by_recommendation)).toHaveLength(0);
  });

  // ── total_assessments ────────────────────────────────────────────────

  it("total_assessments equals the number of items", () => {
    const assessments = [
      makeAssessment({ id: "a1" }),
      makeAssessment({ id: "a2" }),
      makeAssessment({ id: "a3" }),
    ];
    const m = computeAssessmentMetrics(assessments);
    expect(m.total_assessments).toBe(3);
  });

  it("total_assessments is 1 for a single assessment", () => {
    const m = computeAssessmentMetrics([makeAssessment()]);
    expect(m.total_assessments).toBe(1);
  });

  // ── completed_assessments ────────────────────────────────────────────

  it("counts completed status as completed", () => {
    const assessments = [makeAssessment({ status: "completed" })];
    const m = computeAssessmentMetrics(assessments);
    expect(m.completed_assessments).toBe(1);
  });

  it("counts approved status as completed", () => {
    const assessments = [makeAssessment({ status: "approved" })];
    const m = computeAssessmentMetrics(assessments);
    expect(m.completed_assessments).toBe(1);
  });

  it("counts rejected status as completed", () => {
    const assessments = [makeAssessment({ status: "rejected" })];
    const m = computeAssessmentMetrics(assessments);
    expect(m.completed_assessments).toBe(1);
  });

  it("does not count draft as completed", () => {
    const assessments = [makeAssessment({ status: "draft" })];
    const m = computeAssessmentMetrics(assessments);
    expect(m.completed_assessments).toBe(0);
  });

  it("does not count in_progress as completed", () => {
    const assessments = [makeAssessment({ status: "in_progress" })];
    const m = computeAssessmentMetrics(assessments);
    expect(m.completed_assessments).toBe(0);
  });

  it("counts multiple completed statuses correctly", () => {
    const assessments = [
      makeAssessment({ id: "a1", status: "completed" }),
      makeAssessment({ id: "a2", status: "approved" }),
      makeAssessment({ id: "a3", status: "rejected" }),
      makeAssessment({ id: "a4", status: "draft" }),
      makeAssessment({ id: "a5", status: "in_progress" }),
    ];
    const m = computeAssessmentMetrics(assessments);
    expect(m.completed_assessments).toBe(3);
  });

  // ── pending_assessments ──────────────────────────────────────────────

  it("counts draft as pending", () => {
    const assessments = [makeAssessment({ status: "draft" })];
    const m = computeAssessmentMetrics(assessments);
    expect(m.pending_assessments).toBe(1);
  });

  it("counts in_progress as pending", () => {
    const assessments = [makeAssessment({ status: "in_progress" })];
    const m = computeAssessmentMetrics(assessments);
    expect(m.pending_assessments).toBe(1);
  });

  it("does not count completed as pending", () => {
    const assessments = [makeAssessment({ status: "completed" })];
    const m = computeAssessmentMetrics(assessments);
    expect(m.pending_assessments).toBe(0);
  });

  it("pending + completed equals total", () => {
    const assessments = [
      makeAssessment({ id: "a1", status: "draft" }),
      makeAssessment({ id: "a2", status: "in_progress" }),
      makeAssessment({ id: "a3", status: "completed" }),
      makeAssessment({ id: "a4", status: "approved" }),
    ];
    const m = computeAssessmentMetrics(assessments);
    expect(m.pending_assessments + m.completed_assessments).toBe(
      m.total_assessments,
    );
  });

  // ── accepted / rejected / accepted_with_conditions ───────────────────

  it("counts accept recommendations", () => {
    const assessments = [
      makeAssessment({ id: "a1", recommendation: "accept" }),
      makeAssessment({ id: "a2", recommendation: "accept" }),
    ];
    const m = computeAssessmentMetrics(assessments);
    expect(m.accepted).toBe(2);
  });

  it("counts reject recommendations", () => {
    const assessments = [
      makeAssessment({ id: "a1", recommendation: "reject" }),
    ];
    const m = computeAssessmentMetrics(assessments);
    expect(m.rejected).toBe(1);
  });

  it("counts accept_with_conditions recommendations", () => {
    const assessments = [
      makeAssessment({ id: "a1", recommendation: "accept_with_conditions" }),
      makeAssessment({ id: "a2", recommendation: "accept_with_conditions" }),
      makeAssessment({ id: "a3", recommendation: "accept_with_conditions" }),
    ];
    const m = computeAssessmentMetrics(assessments);
    expect(m.accepted_with_conditions).toBe(3);
  });

  it("does not count defer as accepted or rejected", () => {
    const assessments = [makeAssessment({ recommendation: "defer" })];
    const m = computeAssessmentMetrics(assessments);
    expect(m.accepted).toBe(0);
    expect(m.rejected).toBe(0);
    expect(m.accepted_with_conditions).toBe(0);
  });

  it("counts mixed recommendations correctly", () => {
    const assessments = [
      makeAssessment({ id: "a1", recommendation: "accept" }),
      makeAssessment({ id: "a2", recommendation: "reject" }),
      makeAssessment({ id: "a3", recommendation: "accept_with_conditions" }),
      makeAssessment({ id: "a4", recommendation: "defer" }),
      makeAssessment({ id: "a5", recommendation: "accept" }),
    ];
    const m = computeAssessmentMetrics(assessments);
    expect(m.accepted).toBe(2);
    expect(m.rejected).toBe(1);
    expect(m.accepted_with_conditions).toBe(1);
  });

  // ── avg_risk_level ───────────────────────────────────────────────────

  it("avg_risk_level is 1 for all very_low", () => {
    const assessments = [
      makeAssessment({ id: "a1", overall_risk_level: "very_low" }),
      makeAssessment({ id: "a2", overall_risk_level: "very_low" }),
    ];
    const m = computeAssessmentMetrics(assessments);
    expect(m.avg_risk_level).toBe(1);
  });

  it("avg_risk_level is 2 for all low", () => {
    const assessments = [
      makeAssessment({ id: "a1", overall_risk_level: "low" }),
    ];
    const m = computeAssessmentMetrics(assessments);
    expect(m.avg_risk_level).toBe(2);
  });

  it("avg_risk_level is 3 for all medium", () => {
    const assessments = [
      makeAssessment({ id: "a1", overall_risk_level: "medium" }),
    ];
    const m = computeAssessmentMetrics(assessments);
    expect(m.avg_risk_level).toBe(3);
  });

  it("avg_risk_level is 4 for all high", () => {
    const assessments = [
      makeAssessment({ id: "a1", overall_risk_level: "high" }),
    ];
    const m = computeAssessmentMetrics(assessments);
    expect(m.avg_risk_level).toBe(4);
  });

  it("avg_risk_level is 5 for all very_high", () => {
    const assessments = [
      makeAssessment({ id: "a1", overall_risk_level: "very_high" }),
    ];
    const m = computeAssessmentMetrics(assessments);
    expect(m.avg_risk_level).toBe(5);
  });

  it("avg_risk_level averages mixed risk levels", () => {
    const assessments = [
      makeAssessment({ id: "a1", overall_risk_level: "very_low" }), // 1
      makeAssessment({ id: "a2", overall_risk_level: "very_high" }), // 5
    ];
    const m = computeAssessmentMetrics(assessments);
    // (1+5)/2 = 3.0
    expect(m.avg_risk_level).toBe(3);
  });

  it("avg_risk_level rounds to one decimal place", () => {
    const assessments = [
      makeAssessment({ id: "a1", overall_risk_level: "low" }), // 2
      makeAssessment({ id: "a2", overall_risk_level: "medium" }), // 3
      makeAssessment({ id: "a3", overall_risk_level: "high" }), // 4
    ];
    const m = computeAssessmentMetrics(assessments);
    // (2+3+4)/3 = 3.0
    expect(m.avg_risk_level).toBe(3);
  });

  it("avg_risk_level rounds fractional results correctly", () => {
    const assessments = [
      makeAssessment({ id: "a1", overall_risk_level: "very_low" }), // 1
      makeAssessment({ id: "a2", overall_risk_level: "low" }), // 2
      makeAssessment({ id: "a3", overall_risk_level: "medium" }), // 3
    ];
    const m = computeAssessmentMetrics(assessments);
    // (1+2+3)/3 = 2.0
    expect(m.avg_risk_level).toBe(2);
  });

  it("avg_risk_level is 0 for empty array", () => {
    const m = computeAssessmentMetrics([]);
    expect(m.avg_risk_level).toBeNull();;
  });

  // ── high_risk_count ──────────────────────────────────────────────────

  it("counts high risk level", () => {
    const assessments = [
      makeAssessment({ id: "a1", overall_risk_level: "high" }),
    ];
    const m = computeAssessmentMetrics(assessments);
    expect(m.high_risk_count).toBe(1);
  });

  it("counts very_high risk level", () => {
    const assessments = [
      makeAssessment({ id: "a1", overall_risk_level: "very_high" }),
    ];
    const m = computeAssessmentMetrics(assessments);
    expect(m.high_risk_count).toBe(1);
  });

  it("counts both high and very_high", () => {
    const assessments = [
      makeAssessment({ id: "a1", overall_risk_level: "high" }),
      makeAssessment({ id: "a2", overall_risk_level: "very_high" }),
      makeAssessment({ id: "a3", overall_risk_level: "high" }),
    ];
    const m = computeAssessmentMetrics(assessments);
    expect(m.high_risk_count).toBe(3);
  });

  it("does not count medium as high risk", () => {
    const assessments = [
      makeAssessment({ id: "a1", overall_risk_level: "medium" }),
    ];
    const m = computeAssessmentMetrics(assessments);
    expect(m.high_risk_count).toBe(0);
  });

  it("does not count low or very_low as high risk", () => {
    const assessments = [
      makeAssessment({ id: "a1", overall_risk_level: "low" }),
      makeAssessment({ id: "a2", overall_risk_level: "very_low" }),
    ];
    const m = computeAssessmentMetrics(assessments);
    expect(m.high_risk_count).toBe(0);
  });

  // ── children_consulted_rate ──────────────────────────────────────────

  it("children_consulted_rate is 100 when all consulted", () => {
    const assessments = [
      makeAssessment({ id: "a1", existing_children_consulted: true }),
      makeAssessment({ id: "a2", existing_children_consulted: true }),
    ];
    const m = computeAssessmentMetrics(assessments);
    expect(m.children_consulted_rate).toBe(100);
  });

  it("children_consulted_rate is 0 when none consulted", () => {
    const assessments = [
      makeAssessment({ id: "a1", existing_children_consulted: false }),
      makeAssessment({ id: "a2", existing_children_consulted: false }),
    ];
    const m = computeAssessmentMetrics(assessments);
    expect(m.children_consulted_rate).toBe(0);
  });

  it("children_consulted_rate is 50 for half consulted", () => {
    const assessments = [
      makeAssessment({ id: "a1", existing_children_consulted: true }),
      makeAssessment({ id: "a2", existing_children_consulted: false }),
    ];
    const m = computeAssessmentMetrics(assessments);
    expect(m.children_consulted_rate).toBe(50);
  });

  it("children_consulted_rate rounds to one decimal", () => {
    const assessments = [
      makeAssessment({ id: "a1", existing_children_consulted: true }),
      makeAssessment({ id: "a2", existing_children_consulted: false }),
      makeAssessment({ id: "a3", existing_children_consulted: false }),
    ];
    const m = computeAssessmentMetrics(assessments);
    // 1/3 = 33.3%
    expect(m.children_consulted_rate).toBe(33.3);
  });

  it("children_consulted_rate is 0 for empty array", () => {
    const m = computeAssessmentMetrics([]);
    expect(m.children_consulted_rate).toBeNull();;
  });

  // ── staff_consulted_rate ─────────────────────────────────────────────

  it("staff_consulted_rate is 100 when all consulted", () => {
    const assessments = [
      makeAssessment({ id: "a1", staff_consulted: true }),
      makeAssessment({ id: "a2", staff_consulted: true }),
    ];
    const m = computeAssessmentMetrics(assessments);
    expect(m.staff_consulted_rate).toBe(100);
  });

  it("staff_consulted_rate is 0 when none consulted", () => {
    const assessments = [
      makeAssessment({ id: "a1", staff_consulted: false }),
    ];
    const m = computeAssessmentMetrics(assessments);
    expect(m.staff_consulted_rate).toBe(0);
  });

  it("staff_consulted_rate rounds to one decimal", () => {
    const assessments = [
      makeAssessment({ id: "a1", staff_consulted: true }),
      makeAssessment({ id: "a2", staff_consulted: true }),
      makeAssessment({ id: "a3", staff_consulted: false }),
    ];
    const m = computeAssessmentMetrics(assessments);
    // 2/3 = 66.7%
    expect(m.staff_consulted_rate).toBe(66.7);
  });

  it("staff_consulted_rate is 0 for empty array", () => {
    const m = computeAssessmentMetrics([]);
    expect(m.staff_consulted_rate).toBeNull();;
  });

  // ── open_mitigations ─────────────────────────────────────────────────

  it("counts identified mitigations as open", () => {
    const assessments = [
      makeAssessment({
        mitigations: [
          {
            risk: "Behavioural conflict",
            mitigation: "1:1 supervision",
            responsible_person: "staff-1",
            status: "identified",
            review_date: daysFromNow(30),
          },
        ],
      }),
    ];
    const m = computeAssessmentMetrics(assessments);
    expect(m.open_mitigations).toBe(1);
  });

  it("counts in_progress mitigations as open", () => {
    const assessments = [
      makeAssessment({
        mitigations: [
          {
            risk: "Education disruption",
            mitigation: "School liaison",
            responsible_person: "staff-2",
            status: "in_progress",
            review_date: daysFromNow(14),
          },
        ],
      }),
    ];
    const m = computeAssessmentMetrics(assessments);
    expect(m.open_mitigations).toBe(1);
  });

  it("does not count implemented mitigations as open", () => {
    const assessments = [
      makeAssessment({
        mitigations: [
          {
            risk: "Safety risk",
            mitigation: "Additional locks",
            responsible_person: "staff-1",
            status: "implemented",
            review_date: daysFromNow(30),
          },
        ],
      }),
    ];
    const m = computeAssessmentMetrics(assessments);
    expect(m.open_mitigations).toBe(0);
  });

  it("does not count reviewed mitigations as open", () => {
    const assessments = [
      makeAssessment({
        mitigations: [
          {
            risk: "Peer conflict",
            mitigation: "Separate routines",
            responsible_person: "staff-1",
            status: "reviewed",
            review_date: daysAgo(5),
          },
        ],
      }),
    ];
    const m = computeAssessmentMetrics(assessments);
    expect(m.open_mitigations).toBe(0);
  });

  it("counts open mitigations across multiple assessments", () => {
    const assessments = [
      makeAssessment({
        id: "a1",
        mitigations: [
          {
            risk: "R1",
            mitigation: "M1",
            responsible_person: "s1",
            status: "identified",
            review_date: daysFromNow(30),
          },
          {
            risk: "R2",
            mitigation: "M2",
            responsible_person: "s2",
            status: "in_progress",
            review_date: daysFromNow(14),
          },
        ],
      }),
      makeAssessment({
        id: "a2",
        mitigations: [
          {
            risk: "R3",
            mitigation: "M3",
            responsible_person: "s1",
            status: "identified",
            review_date: daysFromNow(7),
          },
          {
            risk: "R4",
            mitigation: "M4",
            responsible_person: "s2",
            status: "implemented",
            review_date: daysAgo(3),
          },
        ],
      }),
    ];
    const m = computeAssessmentMetrics(assessments);
    expect(m.open_mitigations).toBe(3);
  });

  it("open_mitigations is 0 when no mitigations exist", () => {
    const assessments = [makeAssessment({ mitigations: [] })];
    const m = computeAssessmentMetrics(assessments);
    expect(m.open_mitigations).toBe(0);
  });

  // ── by_risk_level ────────────────────────────────────────────────────

  it("by_risk_level tallies each risk level", () => {
    const assessments = [
      makeAssessment({ id: "a1", overall_risk_level: "low" }),
      makeAssessment({ id: "a2", overall_risk_level: "low" }),
      makeAssessment({ id: "a3", overall_risk_level: "high" }),
      makeAssessment({ id: "a4", overall_risk_level: "medium" }),
    ];
    const m = computeAssessmentMetrics(assessments);
    expect(m.by_risk_level["low"]).toBe(2);
    expect(m.by_risk_level["high"]).toBe(1);
    expect(m.by_risk_level["medium"]).toBe(1);
  });

  it("by_risk_level only includes present levels", () => {
    const assessments = [
      makeAssessment({ id: "a1", overall_risk_level: "very_low" }),
    ];
    const m = computeAssessmentMetrics(assessments);
    expect(m.by_risk_level["very_low"]).toBe(1);
    expect(m.by_risk_level["high"]).toBeUndefined();
  });

  it("by_risk_level is empty for empty input", () => {
    const m = computeAssessmentMetrics([]);
    expect(Object.keys(m.by_risk_level)).toHaveLength(0);
  });

  // ── by_recommendation ────────────────────────────────────────────────

  it("by_recommendation tallies each recommendation", () => {
    const assessments = [
      makeAssessment({ id: "a1", recommendation: "accept" }),
      makeAssessment({ id: "a2", recommendation: "accept" }),
      makeAssessment({ id: "a3", recommendation: "reject" }),
      makeAssessment({ id: "a4", recommendation: "defer" }),
      makeAssessment({ id: "a5", recommendation: "accept_with_conditions" }),
    ];
    const m = computeAssessmentMetrics(assessments);
    expect(m.by_recommendation["accept"]).toBe(2);
    expect(m.by_recommendation["reject"]).toBe(1);
    expect(m.by_recommendation["defer"]).toBe(1);
    expect(m.by_recommendation["accept_with_conditions"]).toBe(1);
  });

  it("by_recommendation only includes present recommendations", () => {
    const assessments = [
      makeAssessment({ id: "a1", recommendation: "reject" }),
    ];
    const m = computeAssessmentMetrics(assessments);
    expect(m.by_recommendation["reject"]).toBe(1);
    expect(m.by_recommendation["accept"]).toBeUndefined();
  });

  it("by_recommendation is empty for empty input", () => {
    const m = computeAssessmentMetrics([]);
    expect(Object.keys(m.by_recommendation)).toHaveLength(0);
  });

  // ── Combined / integration ───────────────────────────────────────────

  it("handles a single fully-populated assessment", () => {
    const assessment = makeAssessment({
      status: "approved",
      overall_risk_level: "high",
      recommendation: "accept_with_conditions",
      existing_children_consulted: true,
      staff_consulted: true,
      mitigations: [
        {
          risk: "R1",
          mitigation: "M1",
          responsible_person: "s1",
          status: "identified",
          review_date: daysFromNow(30),
        },
        {
          risk: "R2",
          mitigation: "M2",
          responsible_person: "s2",
          status: "implemented",
          review_date: daysAgo(5),
        },
      ],
    });
    const m = computeAssessmentMetrics([assessment]);
    expect(m.total_assessments).toBe(1);
    expect(m.completed_assessments).toBe(1);
    expect(m.pending_assessments).toBe(0);
    expect(m.accepted).toBe(0);
    expect(m.rejected).toBe(0);
    expect(m.accepted_with_conditions).toBe(1);
    expect(m.avg_risk_level).toBe(4);
    expect(m.high_risk_count).toBe(1);
    expect(m.children_consulted_rate).toBe(100);
    expect(m.staff_consulted_rate).toBe(100);
    expect(m.open_mitigations).toBe(1);
    expect(m.by_risk_level["high"]).toBe(1);
    expect(m.by_recommendation["accept_with_conditions"]).toBe(1);
  });

  it("handles many assessments with diverse data", () => {
    const assessments = [
      makeAssessment({
        id: "a1",
        status: "completed",
        overall_risk_level: "low",
        recommendation: "accept",
        existing_children_consulted: true,
        staff_consulted: true,
        mitigations: [],
      }),
      makeAssessment({
        id: "a2",
        status: "draft",
        overall_risk_level: "very_high",
        recommendation: "reject",
        existing_children_consulted: false,
        staff_consulted: false,
        mitigations: [
          {
            risk: "R1",
            mitigation: "M1",
            responsible_person: "s1",
            status: "identified",
            review_date: daysFromNow(7),
          },
        ],
      }),
      makeAssessment({
        id: "a3",
        status: "approved",
        overall_risk_level: "medium",
        recommendation: "accept_with_conditions",
        existing_children_consulted: true,
        staff_consulted: false,
        mitigations: [
          {
            risk: "R2",
            mitigation: "M2",
            responsible_person: "s2",
            status: "in_progress",
            review_date: daysFromNow(14),
          },
          {
            risk: "R3",
            mitigation: "M3",
            responsible_person: "s2",
            status: "reviewed",
            review_date: daysAgo(3),
          },
        ],
      }),
    ];
    const m = computeAssessmentMetrics(assessments);
    expect(m.total_assessments).toBe(3);
    expect(m.completed_assessments).toBe(2); // completed + approved
    expect(m.pending_assessments).toBe(1); // draft
    expect(m.accepted).toBe(1);
    expect(m.rejected).toBe(1);
    expect(m.accepted_with_conditions).toBe(1);
    // (2+5+3)/3 = 3.3
    expect(m.avg_risk_level).toBe(3.3);
    expect(m.high_risk_count).toBe(1); // very_high
    // 2/3 consulted = 66.7
    expect(m.children_consulted_rate).toBe(66.7);
    // 1/3 staff consulted = 33.3
    expect(m.staff_consulted_rate).toBe(33.3);
    expect(m.open_mitigations).toBe(2); // identified + in_progress
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. identifyAssessmentAlerts
// ═══════════════════════════════════════════════════════════════════════════

describe("identifyAssessmentAlerts", () => {
  const now = new Date();

  // ── No alerts scenario ───────────────────────────────────────────────

  it("returns no alerts for a fully compliant assessment", () => {
    const assessment = makeAssessment({
      status: "completed",
      overall_risk_level: "low",
      existing_children_consulted: true,
      staff_consulted: true,
      review_date: daysFromNow(90),
      mitigations: [],
    });
    const alerts = identifyAssessmentAlerts([assessment], now);
    expect(alerts).toHaveLength(0);
  });

  it("returns no alerts for empty array", () => {
    const alerts = identifyAssessmentAlerts([], now);
    expect(alerts).toHaveLength(0);
  });

  // ── very_high_risk (critical) ────────────────────────────────────────

  it("raises critical alert for very_high risk level", () => {
    const assessment = makeAssessment({
      id: "a1",
      child_name: "Jake Brown",
      overall_risk_level: "very_high",
    });
    const alerts = identifyAssessmentAlerts([assessment], now);
    const alert = alerts.find((a) => a.type === "very_high_risk");
    expect(alert).toBeTruthy();
    expect(alert!.severity).toBe("critical");
    expect(alert!.id).toBe("a1");
  });

  it("very_high_risk alert message includes child name", () => {
    const assessment = makeAssessment({
      child_name: "Emma Wilson",
      overall_risk_level: "very_high",
    });
    const alerts = identifyAssessmentAlerts([assessment], now);
    const alert = alerts.find((a) => a.type === "very_high_risk");
    expect(alert!.message).toContain("Emma Wilson");
  });

  it("very_high_risk alert message mentions very high risk", () => {
    const assessment = makeAssessment({ overall_risk_level: "very_high" });
    const alerts = identifyAssessmentAlerts([assessment], now);
    const alert = alerts.find((a) => a.type === "very_high_risk");
    expect(alert!.message).toContain("very high");
  });

  it("does not raise very_high_risk for high risk level", () => {
    const assessment = makeAssessment({ overall_risk_level: "high" });
    const alerts = identifyAssessmentAlerts([assessment], now);
    const alert = alerts.find((a) => a.type === "very_high_risk");
    expect(alert).toBeUndefined();
  });

  it("does not raise very_high_risk for medium risk level", () => {
    const assessment = makeAssessment({ overall_risk_level: "medium" });
    const alerts = identifyAssessmentAlerts([assessment], now);
    const alert = alerts.find((a) => a.type === "very_high_risk");
    expect(alert).toBeUndefined();
  });

  // ── high_risk (high) ─────────────────────────────────────────────────

  it("raises high alert for high risk level", () => {
    const assessment = makeAssessment({
      id: "a1",
      child_name: "Sam Green",
      overall_risk_level: "high",
    });
    const alerts = identifyAssessmentAlerts([assessment], now);
    const alert = alerts.find((a) => a.type === "high_risk");
    expect(alert).toBeTruthy();
    expect(alert!.severity).toBe("high");
    expect(alert!.id).toBe("a1");
  });

  it("high_risk alert message includes child name", () => {
    const assessment = makeAssessment({
      child_name: "Leo Adams",
      overall_risk_level: "high",
    });
    const alerts = identifyAssessmentAlerts([assessment], now);
    const alert = alerts.find((a) => a.type === "high_risk");
    expect(alert!.message).toContain("Leo Adams");
  });

  it("high_risk alert message mentions high risk", () => {
    const assessment = makeAssessment({ overall_risk_level: "high" });
    const alerts = identifyAssessmentAlerts([assessment], now);
    const alert = alerts.find((a) => a.type === "high_risk");
    expect(alert!.message).toContain("high");
  });

  it("does not raise high_risk for very_high (uses very_high_risk instead)", () => {
    const assessment = makeAssessment({ overall_risk_level: "very_high" });
    const alerts = identifyAssessmentAlerts([assessment], now);
    const alert = alerts.find((a) => a.type === "high_risk");
    expect(alert).toBeUndefined();
  });

  it("does not raise high_risk for medium risk level", () => {
    const assessment = makeAssessment({ overall_risk_level: "medium" });
    const alerts = identifyAssessmentAlerts([assessment], now);
    const alert = alerts.find((a) => a.type === "high_risk");
    expect(alert).toBeUndefined();
  });

  it("does not raise high_risk for low or very_low", () => {
    const assessments = [
      makeAssessment({ id: "a1", overall_risk_level: "low" }),
      makeAssessment({ id: "a2", overall_risk_level: "very_low" }),
    ];
    const alerts = identifyAssessmentAlerts(assessments, now);
    const highRiskAlerts = alerts.filter((a) => a.type === "high_risk");
    expect(highRiskAlerts).toHaveLength(0);
  });

  // ── children_not_consulted (high) ────────────────────────────────────

  it("raises high alert when children not consulted and status is not draft", () => {
    const assessment = makeAssessment({
      id: "a1",
      child_name: "Mia Taylor",
      existing_children_consulted: false,
      status: "completed",
    });
    const alerts = identifyAssessmentAlerts([assessment], now);
    const alert = alerts.find((a) => a.type === "children_not_consulted");
    expect(alert).toBeTruthy();
    expect(alert!.severity).toBe("high");
    expect(alert!.id).toBe("a1");
  });

  it("children_not_consulted alert message includes child name", () => {
    const assessment = makeAssessment({
      child_name: "Noah Clark",
      existing_children_consulted: false,
      status: "in_progress",
    });
    const alerts = identifyAssessmentAlerts([assessment], now);
    const alert = alerts.find((a) => a.type === "children_not_consulted");
    expect(alert!.message).toContain("Noah Clark");
  });

  it("children_not_consulted alert mentions Reg 7", () => {
    const assessment = makeAssessment({
      existing_children_consulted: false,
      status: "completed",
    });
    const alerts = identifyAssessmentAlerts([assessment], now);
    const alert = alerts.find((a) => a.type === "children_not_consulted");
    expect(alert!.message).toContain("Reg 7");
  });

  it("does not raise children_not_consulted for draft status", () => {
    const assessment = makeAssessment({
      existing_children_consulted: false,
      status: "draft",
    });
    const alerts = identifyAssessmentAlerts([assessment], now);
    const alert = alerts.find((a) => a.type === "children_not_consulted");
    expect(alert).toBeUndefined();
  });

  it("does not raise children_not_consulted when children were consulted", () => {
    const assessment = makeAssessment({
      existing_children_consulted: true,
      status: "completed",
    });
    const alerts = identifyAssessmentAlerts([assessment], now);
    const alert = alerts.find((a) => a.type === "children_not_consulted");
    expect(alert).toBeUndefined();
  });

  it("raises children_not_consulted for in_progress status", () => {
    const assessment = makeAssessment({
      existing_children_consulted: false,
      status: "in_progress",
    });
    const alerts = identifyAssessmentAlerts([assessment], now);
    const alert = alerts.find((a) => a.type === "children_not_consulted");
    expect(alert).toBeTruthy();
  });

  it("raises children_not_consulted for approved status", () => {
    const assessment = makeAssessment({
      existing_children_consulted: false,
      status: "approved",
    });
    const alerts = identifyAssessmentAlerts([assessment], now);
    const alert = alerts.find((a) => a.type === "children_not_consulted");
    expect(alert).toBeTruthy();
  });

  it("raises children_not_consulted for rejected status", () => {
    const assessment = makeAssessment({
      existing_children_consulted: false,
      status: "rejected",
    });
    const alerts = identifyAssessmentAlerts([assessment], now);
    const alert = alerts.find((a) => a.type === "children_not_consulted");
    expect(alert).toBeTruthy();
  });

  // ── staff_not_consulted (medium) ─────────────────────────────────────

  it("raises medium alert when staff not consulted and status is not draft", () => {
    const assessment = makeAssessment({
      id: "a1",
      child_name: "Lily Evans",
      staff_consulted: false,
      status: "completed",
    });
    const alerts = identifyAssessmentAlerts([assessment], now);
    const alert = alerts.find((a) => a.type === "staff_not_consulted");
    expect(alert).toBeTruthy();
    expect(alert!.severity).toBe("medium");
    expect(alert!.id).toBe("a1");
  });

  it("staff_not_consulted alert message includes child name", () => {
    const assessment = makeAssessment({
      child_name: "Ruby Thomas",
      staff_consulted: false,
      status: "approved",
    });
    const alerts = identifyAssessmentAlerts([assessment], now);
    const alert = alerts.find((a) => a.type === "staff_not_consulted");
    expect(alert!.message).toContain("Ruby Thomas");
  });

  it("does not raise staff_not_consulted for draft status", () => {
    const assessment = makeAssessment({
      staff_consulted: false,
      status: "draft",
    });
    const alerts = identifyAssessmentAlerts([assessment], now);
    const alert = alerts.find((a) => a.type === "staff_not_consulted");
    expect(alert).toBeUndefined();
  });

  it("does not raise staff_not_consulted when staff were consulted", () => {
    const assessment = makeAssessment({
      staff_consulted: true,
      status: "completed",
    });
    const alerts = identifyAssessmentAlerts([assessment], now);
    const alert = alerts.find((a) => a.type === "staff_not_consulted");
    expect(alert).toBeUndefined();
  });

  it("raises staff_not_consulted for in_progress status", () => {
    const assessment = makeAssessment({
      staff_consulted: false,
      status: "in_progress",
    });
    const alerts = identifyAssessmentAlerts([assessment], now);
    const alert = alerts.find((a) => a.type === "staff_not_consulted");
    expect(alert).toBeTruthy();
  });

  it("raises staff_not_consulted for rejected status", () => {
    const assessment = makeAssessment({
      staff_consulted: false,
      status: "rejected",
    });
    const alerts = identifyAssessmentAlerts([assessment], now);
    const alert = alerts.find((a) => a.type === "staff_not_consulted");
    expect(alert).toBeTruthy();
  });

  // ── review_overdue (medium) ──────────────────────────────────────────

  it("raises medium alert when review date is past", () => {
    const assessment = makeAssessment({
      id: "a1",
      child_name: "Oscar King",
      review_date: daysAgo(10),
      status: "completed",
    });
    const alerts = identifyAssessmentAlerts([assessment], now);
    const alert = alerts.find((a) => a.type === "review_overdue");
    expect(alert).toBeTruthy();
    expect(alert!.severity).toBe("medium");
    expect(alert!.id).toBe("a1");
  });

  it("review_overdue alert message includes child name", () => {
    const assessment = makeAssessment({
      child_name: "Ivy White",
      review_date: daysAgo(5),
      status: "approved",
    });
    const alerts = identifyAssessmentAlerts([assessment], now);
    const alert = alerts.find((a) => a.type === "review_overdue");
    expect(alert!.message).toContain("Ivy White");
  });

  it("review_overdue alert message includes the overdue date", () => {
    const overdueDate = daysAgo(15);
    const assessment = makeAssessment({
      review_date: overdueDate,
      status: "completed",
    });
    const alerts = identifyAssessmentAlerts([assessment], now);
    const alert = alerts.find((a) => a.type === "review_overdue");
    expect(alert!.message).toContain(overdueDate);
  });

  it("does not raise review_overdue for future review date", () => {
    const assessment = makeAssessment({
      review_date: daysFromNow(30),
      status: "completed",
    });
    const alerts = identifyAssessmentAlerts([assessment], now);
    const alert = alerts.find((a) => a.type === "review_overdue");
    expect(alert).toBeUndefined();
  });

  it("does not raise review_overdue when review_date is null", () => {
    const assessment = makeAssessment({
      review_date: null,
      status: "completed",
    });
    const alerts = identifyAssessmentAlerts([assessment], now);
    const alert = alerts.find((a) => a.type === "review_overdue");
    expect(alert).toBeUndefined();
  });

  it("does not raise review_overdue for rejected status", () => {
    const assessment = makeAssessment({
      review_date: daysAgo(10),
      status: "rejected",
    });
    const alerts = identifyAssessmentAlerts([assessment], now);
    const alert = alerts.find((a) => a.type === "review_overdue");
    expect(alert).toBeUndefined();
  });

  it("raises review_overdue for draft status with past review date", () => {
    const assessment = makeAssessment({
      review_date: daysAgo(5),
      status: "draft",
    });
    const alerts = identifyAssessmentAlerts([assessment], now);
    const alert = alerts.find((a) => a.type === "review_overdue");
    expect(alert).toBeTruthy();
  });

  it("raises review_overdue for approved status with past review date", () => {
    const assessment = makeAssessment({
      review_date: daysAgo(20),
      status: "approved",
    });
    const alerts = identifyAssessmentAlerts([assessment], now);
    const alert = alerts.find((a) => a.type === "review_overdue");
    expect(alert).toBeTruthy();
  });

  it("raises review_overdue for in_progress status with past review date", () => {
    const assessment = makeAssessment({
      review_date: daysAgo(3),
      status: "in_progress",
    });
    const alerts = identifyAssessmentAlerts([assessment], now);
    const alert = alerts.find((a) => a.type === "review_overdue");
    expect(alert).toBeTruthy();
  });

  // ── mitigations_outstanding (high) ───────────────────────────────────

  it("raises high alert for approved assessment with identified mitigations", () => {
    const assessment = makeAssessment({
      id: "a1",
      child_name: "Harry Scott",
      status: "approved",
      mitigations: [
        {
          risk: "R1",
          mitigation: "M1",
          responsible_person: "s1",
          status: "identified",
          review_date: daysFromNow(14),
        },
      ],
    });
    const alerts = identifyAssessmentAlerts([assessment], now);
    const alert = alerts.find((a) => a.type === "mitigations_outstanding");
    expect(alert).toBeTruthy();
    expect(alert!.severity).toBe("high");
    expect(alert!.id).toBe("a1");
  });

  it("raises alert for approved assessment with in_progress mitigations", () => {
    const assessment = makeAssessment({
      id: "a1",
      status: "approved",
      mitigations: [
        {
          risk: "R1",
          mitigation: "M1",
          responsible_person: "s1",
          status: "in_progress",
          review_date: daysFromNow(14),
        },
      ],
    });
    const alerts = identifyAssessmentAlerts([assessment], now);
    const alert = alerts.find((a) => a.type === "mitigations_outstanding");
    expect(alert).toBeTruthy();
  });

  it("mitigations_outstanding alert message includes child name", () => {
    const assessment = makeAssessment({
      child_name: "Ella Moore",
      status: "approved",
      mitigations: [
        {
          risk: "R1",
          mitigation: "M1",
          responsible_person: "s1",
          status: "identified",
          review_date: daysFromNow(7),
        },
      ],
    });
    const alerts = identifyAssessmentAlerts([assessment], now);
    const alert = alerts.find((a) => a.type === "mitigations_outstanding");
    expect(alert!.message).toContain("Ella Moore");
  });

  it("mitigations_outstanding alert message includes count of outstanding mitigations", () => {
    const assessment = makeAssessment({
      status: "approved",
      mitigations: [
        {
          risk: "R1",
          mitigation: "M1",
          responsible_person: "s1",
          status: "identified",
          review_date: daysFromNow(7),
        },
        {
          risk: "R2",
          mitigation: "M2",
          responsible_person: "s2",
          status: "in_progress",
          review_date: daysFromNow(14),
        },
        {
          risk: "R3",
          mitigation: "M3",
          responsible_person: "s3",
          status: "implemented",
          review_date: daysAgo(3),
        },
      ],
    });
    const alerts = identifyAssessmentAlerts([assessment], now);
    const alert = alerts.find((a) => a.type === "mitigations_outstanding");
    expect(alert!.message).toContain("2");
  });

  it("does not raise mitigations_outstanding for non-approved status", () => {
    const statuses = ["draft", "in_progress", "completed", "rejected"] as const;
    for (const status of statuses) {
      const assessment = makeAssessment({
        status,
        mitigations: [
          {
            risk: "R1",
            mitigation: "M1",
            responsible_person: "s1",
            status: "identified",
            review_date: daysFromNow(14),
          },
        ],
      });
      const alerts = identifyAssessmentAlerts([assessment], now);
      const alert = alerts.find((a) => a.type === "mitigations_outstanding");
      expect(alert).toBeUndefined();
    }
  });

  it("does not raise mitigations_outstanding when all mitigations are implemented", () => {
    const assessment = makeAssessment({
      status: "approved",
      mitigations: [
        {
          risk: "R1",
          mitigation: "M1",
          responsible_person: "s1",
          status: "implemented",
          review_date: daysAgo(5),
        },
        {
          risk: "R2",
          mitigation: "M2",
          responsible_person: "s2",
          status: "reviewed",
          review_date: daysAgo(3),
        },
      ],
    });
    const alerts = identifyAssessmentAlerts([assessment], now);
    const alert = alerts.find((a) => a.type === "mitigations_outstanding");
    expect(alert).toBeUndefined();
  });

  it("does not raise mitigations_outstanding when no mitigations exist", () => {
    const assessment = makeAssessment({
      status: "approved",
      mitigations: [],
    });
    const alerts = identifyAssessmentAlerts([assessment], now);
    const alert = alerts.find((a) => a.type === "mitigations_outstanding");
    expect(alert).toBeUndefined();
  });

  // ── now parameter override ───────────────────────────────────────────

  it("uses now parameter to evaluate review_overdue", () => {
    const assessment = makeAssessment({
      review_date: "2025-06-01",
      status: "completed",
    });
    const pastNow = new Date("2025-07-01");
    const alerts = identifyAssessmentAlerts([assessment], pastNow);
    const alert = alerts.find((a) => a.type === "review_overdue");
    expect(alert).toBeTruthy();
  });

  it("now parameter prevents review_overdue when date is in future relative to now", () => {
    const assessment = makeAssessment({
      review_date: "2025-08-01",
      status: "completed",
    });
    const earlyNow = new Date("2025-06-01");
    const alerts = identifyAssessmentAlerts([assessment], earlyNow);
    const alert = alerts.find((a) => a.type === "review_overdue");
    expect(alert).toBeUndefined();
  });

  it("now parameter defaults correctly (does not throw without it)", () => {
    const assessment = makeAssessment({
      review_date: daysAgo(5),
      status: "completed",
    });
    const alerts = identifyAssessmentAlerts([assessment]);
    const alert = alerts.find((a) => a.type === "review_overdue");
    expect(alert).toBeTruthy();
  });

  // ── Multiple alerts on single assessment ─────────────────────────────

  it("raises multiple alerts for a single problematic assessment", () => {
    const assessment = makeAssessment({
      id: "a1",
      overall_risk_level: "very_high",
      existing_children_consulted: false,
      staff_consulted: false,
      status: "approved",
      review_date: daysAgo(10),
      mitigations: [
        {
          risk: "R1",
          mitigation: "M1",
          responsible_person: "s1",
          status: "identified",
          review_date: daysFromNow(14),
        },
      ],
    });
    const alerts = identifyAssessmentAlerts([assessment], now);
    const types = alerts.map((a) => a.type);
    expect(types).toContain("very_high_risk");
    expect(types).toContain("children_not_consulted");
    expect(types).toContain("staff_not_consulted");
    expect(types).toContain("review_overdue");
    expect(types).toContain("mitigations_outstanding");
  });

  // ── Multiple assessments ─────────────────────────────────────────────

  it("raises alerts independently for multiple assessments", () => {
    const a1 = makeAssessment({
      id: "a1",
      overall_risk_level: "very_high",
      existing_children_consulted: true,
      staff_consulted: true,
      status: "completed",
      review_date: daysFromNow(90),
    });
    const a2 = makeAssessment({
      id: "a2",
      overall_risk_level: "low",
      existing_children_consulted: false,
      staff_consulted: false,
      status: "in_progress",
      review_date: daysFromNow(30),
    });
    const alerts = identifyAssessmentAlerts([a1, a2], now);
    const veryHigh = alerts.filter((a) => a.type === "very_high_risk");
    const childNotConsulted = alerts.filter(
      (a) => a.type === "children_not_consulted",
    );
    const staffNotConsulted = alerts.filter(
      (a) => a.type === "staff_not_consulted",
    );
    expect(veryHigh).toHaveLength(1);
    expect(veryHigh[0].id).toBe("a1");
    expect(childNotConsulted).toHaveLength(1);
    expect(childNotConsulted[0].id).toBe("a2");
    expect(staffNotConsulted).toHaveLength(1);
    expect(staffNotConsulted[0].id).toBe("a2");
  });

  it("raises very_high_risk and high_risk for different assessments", () => {
    const a1 = makeAssessment({
      id: "a1",
      overall_risk_level: "very_high",
    });
    const a2 = makeAssessment({
      id: "a2",
      overall_risk_level: "high",
    });
    const alerts = identifyAssessmentAlerts([a1, a2], now);
    const veryHigh = alerts.find((a) => a.type === "very_high_risk");
    const high = alerts.find((a) => a.type === "high_risk");
    expect(veryHigh).toBeTruthy();
    expect(veryHigh!.id).toBe("a1");
    expect(high).toBeTruthy();
    expect(high!.id).toBe("a2");
  });

  // ── Alert structure validation ───────────────────────────────────────

  it("each alert has required fields: type, severity, message, id", () => {
    const assessment = makeAssessment({
      id: "a1",
      overall_risk_level: "very_high",
      existing_children_consulted: false,
      staff_consulted: false,
      status: "approved",
      review_date: daysAgo(5),
      mitigations: [
        {
          risk: "R1",
          mitigation: "M1",
          responsible_person: "s1",
          status: "identified",
          review_date: daysFromNow(7),
        },
      ],
    });
    const alerts = identifyAssessmentAlerts([assessment], now);
    for (const a of alerts) {
      expect(a).toHaveProperty("type");
      expect(a).toHaveProperty("severity");
      expect(a).toHaveProperty("message");
      expect(a).toHaveProperty("id");
      expect(typeof a.type).toBe("string");
      expect(["critical", "high", "medium"]).toContain(a.severity);
      expect(a.message.length).toBeGreaterThan(0);
    }
  });

  it("severity levels are correct: very_high_risk=critical, high_risk=high", () => {
    const assessments = [
      makeAssessment({ id: "a1", overall_risk_level: "very_high" }),
      makeAssessment({ id: "a2", overall_risk_level: "high" }),
    ];
    const alerts = identifyAssessmentAlerts(assessments, now);
    const vhr = alerts.find((a) => a.type === "very_high_risk");
    const hr = alerts.find((a) => a.type === "high_risk");
    expect(vhr!.severity).toBe("critical");
    expect(hr!.severity).toBe("high");
  });

  it("severity levels are correct: children_not_consulted=high, staff_not_consulted=medium", () => {
    const assessment = makeAssessment({
      existing_children_consulted: false,
      staff_consulted: false,
      status: "completed",
    });
    const alerts = identifyAssessmentAlerts([assessment], now);
    const cnc = alerts.find((a) => a.type === "children_not_consulted");
    const snc = alerts.find((a) => a.type === "staff_not_consulted");
    expect(cnc!.severity).toBe("high");
    expect(snc!.severity).toBe("medium");
  });

  it("severity levels are correct: review_overdue=medium, mitigations_outstanding=high", () => {
    const assessment = makeAssessment({
      status: "approved",
      review_date: daysAgo(10),
      mitigations: [
        {
          risk: "R1",
          mitigation: "M1",
          responsible_person: "s1",
          status: "identified",
          review_date: daysFromNow(14),
        },
      ],
    });
    const alerts = identifyAssessmentAlerts([assessment], now);
    const ro = alerts.find((a) => a.type === "review_overdue");
    const mo = alerts.find((a) => a.type === "mitigations_outstanding");
    expect(ro!.severity).toBe("medium");
    expect(mo!.severity).toBe("high");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. CRUD FALLBACK (Supabase disabled)
// ═══════════════════════════════════════════════════════════════════════════

describe("CRUD fallback (Supabase disabled)", () => {
  // ── listAssessments ──────────────────────────────────────────────────

  it("listAssessments returns ok: true with empty array", async () => {
    const result = await listAssessments("home-1");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listAssessments returns ok: true with status filter", async () => {
    const result = await listAssessments("home-1", { status: "approved" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listAssessments returns ok: true with riskLevel filter", async () => {
    const result = await listAssessments("home-1", { riskLevel: "high" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listAssessments returns ok: true with limit filter", async () => {
    const result = await listAssessments("home-1", { limit: 10 });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listAssessments result data is an array type", async () => {
    const result = await listAssessments("home-1");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(Array.isArray(result.data)).toBe(true);
    }
  });

  // ── createAssessment ─────────────────────────────────────────────────

  it("createAssessment returns ok: false with error message", async () => {
    const result = await createAssessment({
      homeId: "home-1",
      childId: "child-1",
      childName: "Alice Smith",
      referralDate: daysAgo(14),
      assessmentDate: daysAgo(7),
      assessedBy: "staff-1",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Supabase not configured");
    }
  });

  it("createAssessment returns error even with full input", async () => {
    const result = await createAssessment({
      homeId: "home-1",
      childId: "child-1",
      childName: "Alice Smith",
      referralDate: daysAgo(14),
      assessmentDate: daysAgo(7),
      assessedBy: "staff-1",
      status: "completed",
      overallRiskLevel: "medium",
      compatibilityFactors: [
        { factor: "age_range", rating: "low", notes: "Similar ages" },
      ],
      impactAreas: [
        {
          area: "existing_children_safety",
          impact_level: "low",
          description: "Low impact",
        },
      ],
      mitigations: [
        {
          risk: "Behavioural",
          mitigation: "Supervision plan",
          responsible_person: "staff-1",
          status: "identified",
          review_date: daysFromNow(30),
        },
      ],
      existingChildrenConsulted: true,
      existingChildrenViews: "Children are happy",
      staffConsulted: true,
      staffViews: "Staff support placement",
      recommendation: "accept_with_conditions",
      conditions: "Additional supervision needed",
      reviewDate: daysFromNow(90),
      notes: "Test notes",
    });
    expect(result.ok).toBe(false);
  });

  it("createAssessment error message is a string", async () => {
    const result = await createAssessment({
      homeId: "home-1",
      childId: "child-1",
      childName: "Test",
      referralDate: daysAgo(7),
      assessmentDate: daysAgo(3),
      assessedBy: "staff-1",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(typeof result.error).toBe("string");
    }
  });

  // ── updateAssessment ─────────────────────────────────────────────────

  it("updateAssessment returns ok: false with error message", async () => {
    const result = await updateAssessment("assess-1", { status: "approved" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Supabase not configured");
    }
  });

  it("updateAssessment returns error for any update payload", async () => {
    const result = await updateAssessment("assess-1", {
      overall_risk_level: "low",
      notes: "Updated",
    });
    expect(result.ok).toBe(false);
  });

  it("updateAssessment error message is a string", async () => {
    const result = await updateAssessment("assess-1", { status: "rejected" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(typeof result.error).toBe("string");
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. EDGE CASES
// ═══════════════════════════════════════════════════════════════════════════

describe("Edge cases", () => {
  const now = new Date();
  it("computeAssessmentMetrics handles assessment with all mitigations implemented", () => {
    const assessment = makeAssessment({
      mitigations: [
        {
          risk: "R1",
          mitigation: "M1",
          responsible_person: "s1",
          status: "implemented",
          review_date: daysAgo(5),
        },
        {
          risk: "R2",
          mitigation: "M2",
          responsible_person: "s2",
          status: "reviewed",
          review_date: daysAgo(3),
        },
      ],
    });
    const m = computeAssessmentMetrics([assessment]);
    expect(m.open_mitigations).toBe(0);
  });

  it("computeAssessmentMetrics handles large number of assessments", () => {
    const assessments = Array.from({ length: 100 }, (_, i) =>
      makeAssessment({
        id: `a${i}`,
        overall_risk_level: i % 2 === 0 ? "low" : "high",
        recommendation: i % 3 === 0 ? "accept" : "reject",
      }),
    );
    const m = computeAssessmentMetrics(assessments);
    expect(m.total_assessments).toBe(100);
    expect(m.high_risk_count).toBe(50);
  });

  it("identifyAssessmentAlerts handles assessment with every possible issue", () => {
    const assessment = makeAssessment({
      id: "a-worst",
      child_name: "Max Worst",
      overall_risk_level: "very_high",
      existing_children_consulted: false,
      staff_consulted: false,
      status: "approved",
      review_date: daysAgo(30),
      mitigations: [
        {
          risk: "R1",
          mitigation: "M1",
          responsible_person: "s1",
          status: "identified",
          review_date: daysFromNow(14),
        },
        {
          risk: "R2",
          mitigation: "M2",
          responsible_person: "s2",
          status: "in_progress",
          review_date: daysFromNow(7),
        },
      ],
    });
    const alerts = identifyAssessmentAlerts([assessment], now);
    expect(alerts.length).toBeGreaterThanOrEqual(5);
    const types = alerts.map((a) => a.type);
    expect(types).toContain("very_high_risk");
    expect(types).toContain("children_not_consulted");
    expect(types).toContain("staff_not_consulted");
    expect(types).toContain("review_overdue");
    expect(types).toContain("mitigations_outstanding");
  });

  it("identifyAssessmentAlerts handles assessment with no issues at all", () => {
    const assessment = makeAssessment({
      overall_risk_level: "very_low",
      existing_children_consulted: true,
      staff_consulted: true,
      status: "completed",
      review_date: daysFromNow(180),
      mitigations: [],
    });
    const alerts = identifyAssessmentAlerts([assessment], now);
    expect(alerts).toHaveLength(0);
  });

  it("computeAssessmentMetrics children_consulted_rate with two thirds consulted", () => {
    const assessments = [
      makeAssessment({ id: "a1", existing_children_consulted: true }),
      makeAssessment({ id: "a2", existing_children_consulted: true }),
      makeAssessment({ id: "a3", existing_children_consulted: false }),
    ];
    const m = computeAssessmentMetrics(assessments);
    // 2/3 = 66.7%
    expect(m.children_consulted_rate).toBe(66.7);
  });

  it("computeAssessmentMetrics staff_consulted_rate with one sixth consulted", () => {
    const assessments = Array.from({ length: 6 }, (_, i) =>
      makeAssessment({
        id: `a${i}`,
        staff_consulted: i === 0,
      }),
    );
    const m = computeAssessmentMetrics(assessments);
    // 1/6 = 16.7%
    expect(m.staff_consulted_rate).toBe(16.7);
  });

  it("computeAssessmentMetrics avg_risk_level for very_low + low = 1.5", () => {
    const assessments = [
      makeAssessment({ id: "a1", overall_risk_level: "very_low" }), // 1
      makeAssessment({ id: "a2", overall_risk_level: "low" }), // 2
    ];
    const m = computeAssessmentMetrics(assessments);
    // (1+2)/2 = 1.5
    expect(m.avg_risk_level).toBe(1.5);
  });

  it("identifyAssessmentAlerts does not double-alert very_high as both very_high_risk and high_risk", () => {
    const assessment = makeAssessment({ overall_risk_level: "very_high" });
    const alerts = identifyAssessmentAlerts([assessment], now);
    const veryHigh = alerts.filter((a) => a.type === "very_high_risk");
    const high = alerts.filter((a) => a.type === "high_risk");
    expect(veryHigh).toHaveLength(1);
    expect(high).toHaveLength(0);
  });

  it("computeAssessmentMetrics by_risk_level counts all five levels correctly", () => {
    const assessments = [
      makeAssessment({ id: "a1", overall_risk_level: "very_low" }),
      makeAssessment({ id: "a2", overall_risk_level: "low" }),
      makeAssessment({ id: "a3", overall_risk_level: "medium" }),
      makeAssessment({ id: "a4", overall_risk_level: "high" }),
      makeAssessment({ id: "a5", overall_risk_level: "very_high" }),
    ];
    const m = computeAssessmentMetrics(assessments);
    expect(Object.keys(m.by_risk_level)).toHaveLength(5);
    expect(m.by_risk_level["very_low"]).toBe(1);
    expect(m.by_risk_level["low"]).toBe(1);
    expect(m.by_risk_level["medium"]).toBe(1);
    expect(m.by_risk_level["high"]).toBe(1);
    expect(m.by_risk_level["very_high"]).toBe(1);
  });
});
