// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — LEAVING CARE / PATHWAY PLANNING SERVICE TESTS
// Pure-function tests for leaving-care metrics computation, alert identification,
// and constant validation. CHR 2015 Reg 14, Children (Leaving Care) Act 2000,
// Reg 36 case records, SCCIF Experiences & Progress.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  _testing,
  ACCOMMODATION_TYPES,
  EDUCATION_STATUS_OPTIONS,
  INDEPENDENCE_SKILL_AREAS,
  ENTITLEMENT_TYPES,
  PATHWAY_PLAN_STATUS,
  PATHWAY_PLAN_TYPES,
  ENTITLEMENT_STATUS,
  ENTITLEMENT_FREQUENCY,
} from "../leaving-care-service";

const { computeLeavingCareMetrics, identifyLeavingCareAlerts } = _testing;

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

/** ISO datetime string N days ago from now. */
function daysAgoISO(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

/** Build a minimal PathwayPlan with sensible defaults. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makePathwayPlan(overrides: Record<string, unknown> = {}): any {
  return {
    id: "pp-1",
    home_id: "home-1",
    child_id: "child-1",
    child_name: "Alice",
    plan_type: "initial",
    status: "active",
    start_date: "2026-01-01",
    target_leaving_date: null,
    accommodation_plan: null,
    accommodation_type: null,
    education_training_plan: null,
    education_status: null,
    employment_plan: null,
    financial_plan: null,
    benefit_entitlements: null,
    health_plan: null,
    registered_gp: true,
    registered_dentist: true,
    emotional_support_plan: null,
    social_network: null,
    life_skills_assessment: null,
    personal_advisor_name: "Jane Doe",
    personal_advisor_contact: "jane@example.com",
    reviewed_by: "staff-1",
    review_date: "2026-03-01",
    next_review_date: daysFromNow(30),
    version: 1,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

/** Build a minimal IndependenceAssessment with sensible defaults. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeAssessment(overrides: Record<string, unknown> = {}): any {
  return {
    id: "ia-1",
    home_id: "home-1",
    child_id: "child-1",
    child_name: "Alice",
    assessment_date: "2026-04-01",
    assessed_by: "staff-1",
    skills: [],
    overall_readiness_score: 65,
    areas_of_strength: ["budgeting"],
    areas_needing_development: ["cooking"],
    recommended_actions: ["Practice meal prep"],
    next_assessment_date: daysFromNow(60),
    created_at: "2026-04-01T00:00:00Z",
    ...overrides,
  };
}

/** Build a minimal LeavingCareEntitlement with sensible defaults. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeEntitlement(overrides: Record<string, unknown> = {}): any {
  return {
    id: "ent-1",
    home_id: "home-1",
    child_id: "child-1",
    child_name: "Alice",
    entitlement_type: "setting_up_home_allowance",
    description: "Setting up home grant",
    amount: 2000,
    frequency: "one_off",
    start_date: "2026-01-01",
    end_date: null,
    status: "active",
    claimed_date: null,
    claimed_amount: null,
    recorded_by: "staff-1",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

// ── ACCOMMODATION_TYPES ──────────────────────────────────────────────────

describe("ACCOMMODATION_TYPES", () => {
  it("has exactly 9 entries", () => {
    expect(ACCOMMODATION_TYPES).toHaveLength(9);
  });

  it("each entry has type and label strings", () => {
    for (const item of ACCOMMODATION_TYPES) {
      expect(typeof item.type).toBe("string");
      expect(typeof item.label).toBe("string");
      expect(item.type.length).toBeGreaterThan(0);
      expect(item.label.length).toBeGreaterThan(0);
    }
  });

  it("has unique type values", () => {
    const types = ACCOMMODATION_TYPES.map((a) => a.type);
    expect(new Set(types).size).toBe(types.length);
  });

  it("has unique label values", () => {
    const labels = ACCOMMODATION_TYPES.map((a) => a.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("contains expected accommodation types", () => {
    const types = ACCOMMODATION_TYPES.map((a) => a.type);
    expect(types).toContain("semi_independent");
    expect(types).toContain("supported_lodgings");
    expect(types).toContain("staying_put");
    expect(types).toContain("university_halls");
    expect(types).toContain("own_tenancy");
    expect(types).toContain("family_return");
    expect(types).toContain("other");
  });
});

// ── EDUCATION_STATUS_OPTIONS ─────────────────────────────────────────────

describe("EDUCATION_STATUS_OPTIONS", () => {
  it("has exactly 8 entries", () => {
    expect(EDUCATION_STATUS_OPTIONS).toHaveLength(8);
  });

  it("each entry has status and label strings", () => {
    for (const item of EDUCATION_STATUS_OPTIONS) {
      expect(typeof item.status).toBe("string");
      expect(typeof item.label).toBe("string");
      expect(item.status.length).toBeGreaterThan(0);
      expect(item.label.length).toBeGreaterThan(0);
    }
  });

  it("has unique status values", () => {
    const statuses = EDUCATION_STATUS_OPTIONS.map((e) => e.status);
    expect(new Set(statuses).size).toBe(statuses.length);
  });

  it("has unique label values", () => {
    const labels = EDUCATION_STATUS_OPTIONS.map((e) => e.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("contains expected statuses including NEET", () => {
    const statuses = EDUCATION_STATUS_OPTIONS.map((e) => e.status);
    expect(statuses).toContain("full_time_education");
    expect(statuses).toContain("apprenticeship");
    expect(statuses).toContain("neet");
    expect(statuses).toContain("university");
  });
});

// ── INDEPENDENCE_SKILL_AREAS ─────────────────────────────────────────────

describe("INDEPENDENCE_SKILL_AREAS", () => {
  it("has exactly 14 entries", () => {
    expect(INDEPENDENCE_SKILL_AREAS).toHaveLength(14);
  });

  it("each entry has area and label strings", () => {
    for (const item of INDEPENDENCE_SKILL_AREAS) {
      expect(typeof item.area).toBe("string");
      expect(typeof item.label).toBe("string");
      expect(item.area.length).toBeGreaterThan(0);
      expect(item.label.length).toBeGreaterThan(0);
    }
  });

  it("has unique area values", () => {
    const areas = INDEPENDENCE_SKILL_AREAS.map((s) => s.area);
    expect(new Set(areas).size).toBe(areas.length);
  });

  it("has unique label values", () => {
    const labels = INDEPENDENCE_SKILL_AREAS.map((s) => s.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("contains expected skill areas", () => {
    const areas = INDEPENDENCE_SKILL_AREAS.map((s) => s.area);
    expect(areas).toContain("budgeting");
    expect(areas).toContain("cooking");
    expect(areas).toContain("tenancy_management");
    expect(areas).toContain("digital_skills");
    expect(areas).toContain("job_searching");
  });
});

// ── ENTITLEMENT_TYPES ────────────────────────────────────────────────────

describe("ENTITLEMENT_TYPES", () => {
  it("has exactly 10 entries", () => {
    expect(ENTITLEMENT_TYPES).toHaveLength(10);
  });

  it("each entry has type and label strings", () => {
    for (const item of ENTITLEMENT_TYPES) {
      expect(typeof item.type).toBe("string");
      expect(typeof item.label).toBe("string");
      expect(item.type.length).toBeGreaterThan(0);
      expect(item.label.length).toBeGreaterThan(0);
    }
  });

  it("has unique type values", () => {
    const types = ENTITLEMENT_TYPES.map((e) => e.type);
    expect(new Set(types).size).toBe(types.length);
  });

  it("has unique label values", () => {
    const labels = ENTITLEMENT_TYPES.map((e) => e.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("contains expected entitlement types", () => {
    const types = ENTITLEMENT_TYPES.map((e) => e.type);
    expect(types).toContain("setting_up_home_allowance");
    expect(types).toContain("clothing_allowance");
    expect(types).toContain("education_bursary");
    expect(types).toContain("council_tax_exemption");
    expect(types).toContain("higher_education_bursary");
    expect(types).toContain("staying_put_support");
  });
});

// ── PATHWAY_PLAN_STATUS ──────────────────────────────────────────────────

describe("PATHWAY_PLAN_STATUS", () => {
  it("has exactly 5 entries", () => {
    expect(PATHWAY_PLAN_STATUS).toHaveLength(5);
  });

  it("has unique values", () => {
    expect(new Set(PATHWAY_PLAN_STATUS).size).toBe(PATHWAY_PLAN_STATUS.length);
  });

  it("contains expected statuses", () => {
    expect(PATHWAY_PLAN_STATUS).toContain("draft");
    expect(PATHWAY_PLAN_STATUS).toContain("active");
    expect(PATHWAY_PLAN_STATUS).toContain("under_review");
    expect(PATHWAY_PLAN_STATUS).toContain("completed");
    expect(PATHWAY_PLAN_STATUS).toContain("archived");
  });

  it("all values are non-empty strings", () => {
    for (const s of PATHWAY_PLAN_STATUS) {
      expect(typeof s).toBe("string");
      expect(s.length).toBeGreaterThan(0);
    }
  });
});

// ── PATHWAY_PLAN_TYPES ───────────────────────────────────────────────────

describe("PATHWAY_PLAN_TYPES", () => {
  it("has exactly 3 entries", () => {
    expect(PATHWAY_PLAN_TYPES).toHaveLength(3);
  });

  it("has unique values", () => {
    expect(new Set(PATHWAY_PLAN_TYPES).size).toBe(PATHWAY_PLAN_TYPES.length);
  });

  it("contains initial, review, and final", () => {
    expect(PATHWAY_PLAN_TYPES).toContain("initial");
    expect(PATHWAY_PLAN_TYPES).toContain("review");
    expect(PATHWAY_PLAN_TYPES).toContain("final");
  });

  it("all values are non-empty strings", () => {
    for (const t of PATHWAY_PLAN_TYPES) {
      expect(typeof t).toBe("string");
      expect(t.length).toBeGreaterThan(0);
    }
  });
});

// ── ENTITLEMENT_STATUS ───────────────────────────────────────────────────

describe("ENTITLEMENT_STATUS", () => {
  it("has exactly 4 entries", () => {
    expect(ENTITLEMENT_STATUS).toHaveLength(4);
  });

  it("has unique values", () => {
    expect(new Set(ENTITLEMENT_STATUS).size).toBe(ENTITLEMENT_STATUS.length);
  });

  it("contains expected statuses", () => {
    expect(ENTITLEMENT_STATUS).toContain("active");
    expect(ENTITLEMENT_STATUS).toContain("pending");
    expect(ENTITLEMENT_STATUS).toContain("expired");
    expect(ENTITLEMENT_STATUS).toContain("claimed");
  });

  it("all values are non-empty strings", () => {
    for (const s of ENTITLEMENT_STATUS) {
      expect(typeof s).toBe("string");
      expect(s.length).toBeGreaterThan(0);
    }
  });
});

// ── ENTITLEMENT_FREQUENCY ────────────────────────────────────────────────

describe("ENTITLEMENT_FREQUENCY", () => {
  it("has exactly 4 entries", () => {
    expect(ENTITLEMENT_FREQUENCY).toHaveLength(4);
  });

  it("has unique values", () => {
    expect(new Set(ENTITLEMENT_FREQUENCY).size).toBe(ENTITLEMENT_FREQUENCY.length);
  });

  it("contains expected frequencies", () => {
    expect(ENTITLEMENT_FREQUENCY).toContain("one_off");
    expect(ENTITLEMENT_FREQUENCY).toContain("weekly");
    expect(ENTITLEMENT_FREQUENCY).toContain("monthly");
    expect(ENTITLEMENT_FREQUENCY).toContain("annual");
  });

  it("all values are non-empty strings", () => {
    for (const f of ENTITLEMENT_FREQUENCY) {
      expect(typeof f).toBe("string");
      expect(f.length).toBeGreaterThan(0);
    }
  });
});

// ── computeLeavingCareMetrics ────────────────────────────────────────────

describe("computeLeavingCareMetrics", () => {
  it("returns zeroes for empty inputs", () => {
    const result = computeLeavingCareMetrics([], [], [], 0);
    expect(result.total_pathway_plans).toBe(0);
    expect(result.active_plans).toBe(0);
    expect(result.draft_plans).toBe(0);
    expect(result.completed_plans).toBe(0);
    expect(result.plan_coverage_pct).toBe(0);
    expect(result.avg_readiness_score).toBe(0);
    expect(result.readiness_above_70_count).toBe(0);
    expect(result.readiness_below_40_count).toBe(0);
    expect(result.total_entitlements).toBe(0);
    expect(result.active_entitlements).toBe(0);
    expect(result.claimed_entitlements).toBe(0);
    expect(result.entitlement_take_up_pct).toBe(0);
    expect(result.total_claimed_amount).toBe(0);
    expect(result.yp_with_gp).toBe(0);
    expect(result.yp_with_dentist).toBe(0);
    expect(result.plans_with_personal_advisor).toBe(0);
    expect(result.avg_plan_version).toBe(0);
  });

  it("counts active, draft, and completed plans correctly", () => {
    const plans = [
      makePathwayPlan({ id: "p1", status: "active" }),
      makePathwayPlan({ id: "p2", status: "active" }),
      makePathwayPlan({ id: "p3", status: "draft" }),
      makePathwayPlan({ id: "p4", status: "completed" }),
      makePathwayPlan({ id: "p5", status: "archived" }),
    ];
    const result = computeLeavingCareMetrics(plans, [], [], 5);
    expect(result.total_pathway_plans).toBe(5);
    expect(result.active_plans).toBe(2);
    expect(result.draft_plans).toBe(1);
    expect(result.completed_plans).toBe(1);
  });

  it("calculates plan coverage percentage from unique children with active/completed plans", () => {
    const plans = [
      makePathwayPlan({ id: "p1", child_id: "c1", status: "active" }),
      makePathwayPlan({ id: "p2", child_id: "c1", status: "completed" }),
      makePathwayPlan({ id: "p3", child_id: "c2", status: "active" }),
      makePathwayPlan({ id: "p4", child_id: "c3", status: "draft" }),
    ];
    const result = computeLeavingCareMetrics(plans, [], [], 4);
    // 2 unique children (c1, c2) out of 4 eligible = 50%
    expect(result.plan_coverage_pct).toBe(50);
  });

  it("returns 0 coverage when totalEligibleYP is 0", () => {
    const plans = [makePathwayPlan({ status: "active" })];
    const result = computeLeavingCareMetrics(plans, [], [], 0);
    expect(result.plan_coverage_pct).toBe(0);
  });

  it("returns 100% coverage when all eligible YP have active plans", () => {
    const plans = [
      makePathwayPlan({ id: "p1", child_id: "c1", status: "active" }),
      makePathwayPlan({ id: "p2", child_id: "c2", status: "active" }),
      makePathwayPlan({ id: "p3", child_id: "c3", status: "completed" }),
    ];
    const result = computeLeavingCareMetrics(plans, [], [], 3);
    expect(result.plan_coverage_pct).toBe(100);
  });

  it("excludes draft and archived plans from coverage calculation", () => {
    const plans = [
      makePathwayPlan({ id: "p1", child_id: "c1", status: "draft" }),
      makePathwayPlan({ id: "p2", child_id: "c2", status: "archived" }),
    ];
    const result = computeLeavingCareMetrics(plans, [], [], 2);
    expect(result.plan_coverage_pct).toBe(0);
  });

  it("computes average readiness score from latest assessment per child", () => {
    const assessments = [
      makeAssessment({ id: "a1", child_id: "c1", assessment_date: "2026-02-01", overall_readiness_score: 60 }),
      makeAssessment({ id: "a2", child_id: "c1", assessment_date: "2026-04-01", overall_readiness_score: 80 }),
      makeAssessment({ id: "a3", child_id: "c2", assessment_date: "2026-03-01", overall_readiness_score: 40 }),
    ];
    const result = computeLeavingCareMetrics([], assessments, [], 0);
    // Latest for c1 = 80, latest for c2 = 40 => avg = (80+40)/2 = 60
    expect(result.avg_readiness_score).toBe(60);
  });

  it("returns 0 average readiness when no assessments exist", () => {
    const result = computeLeavingCareMetrics([], [], [], 5);
    expect(result.avg_readiness_score).toBe(0);
  });

  it("counts readiness scores above 70 correctly", () => {
    const assessments = [
      makeAssessment({ id: "a1", child_id: "c1", overall_readiness_score: 75 }),
      makeAssessment({ id: "a2", child_id: "c2", overall_readiness_score: 70 }),
      makeAssessment({ id: "a3", child_id: "c3", overall_readiness_score: 69 }),
    ];
    const result = computeLeavingCareMetrics([], assessments, [], 0);
    // 75 >= 70, 70 >= 70, 69 < 70
    expect(result.readiness_above_70_count).toBe(2);
  });

  it("counts readiness scores below 40 correctly", () => {
    const assessments = [
      makeAssessment({ id: "a1", child_id: "c1", overall_readiness_score: 39 }),
      makeAssessment({ id: "a2", child_id: "c2", overall_readiness_score: 40 }),
      makeAssessment({ id: "a3", child_id: "c3", overall_readiness_score: 10 }),
    ];
    const result = computeLeavingCareMetrics([], assessments, [], 0);
    // 39 < 40, 40 is NOT < 40, 10 < 40
    expect(result.readiness_below_40_count).toBe(2);
  });

  it("boundary: readiness score exactly 70 counts as above", () => {
    const assessments = [
      makeAssessment({ child_id: "c1", overall_readiness_score: 70 }),
    ];
    const result = computeLeavingCareMetrics([], assessments, [], 0);
    expect(result.readiness_above_70_count).toBe(1);
  });

  it("boundary: readiness score exactly 40 does not count as below", () => {
    const assessments = [
      makeAssessment({ child_id: "c1", overall_readiness_score: 40 }),
    ];
    const result = computeLeavingCareMetrics([], assessments, [], 0);
    expect(result.readiness_below_40_count).toBe(0);
  });

  it("counts total, active, and claimed entitlements", () => {
    const entitlements = [
      makeEntitlement({ id: "e1", status: "active" }),
      makeEntitlement({ id: "e2", status: "active" }),
      makeEntitlement({ id: "e3", status: "claimed", claimed_date: "2026-03-01", claimed_amount: 500 }),
      makeEntitlement({ id: "e4", status: "expired" }),
      makeEntitlement({ id: "e5", status: "pending" }),
    ];
    const result = computeLeavingCareMetrics([], [], entitlements, 0);
    expect(result.total_entitlements).toBe(5);
    expect(result.active_entitlements).toBe(2);
    expect(result.claimed_entitlements).toBe(1);
  });

  it("calculates entitlement take-up percentage correctly", () => {
    const entitlements = [
      makeEntitlement({ id: "e1", status: "claimed", claimed_date: "2026-03-01", claimed_amount: 100 }),
      makeEntitlement({ id: "e2", status: "active" }),
      makeEntitlement({ id: "e3", status: "active" }),
      makeEntitlement({ id: "e4", status: "claimed", claimed_date: "2026-03-01", claimed_amount: 200 }),
    ];
    const result = computeLeavingCareMetrics([], [], entitlements, 0);
    // 2 claimed out of 4 total = 50%
    expect(result.entitlement_take_up_pct).toBe(50);
  });

  it("returns 0 take-up percentage when no entitlements exist", () => {
    const result = computeLeavingCareMetrics([], [], [], 0);
    expect(result.entitlement_take_up_pct).toBe(0);
  });

  it("calculates total claimed amount using claimed_amount when available", () => {
    const entitlements = [
      makeEntitlement({ id: "e1", status: "claimed", amount: 2000, claimed_amount: 1800 }),
      makeEntitlement({ id: "e2", status: "claimed", amount: 500, claimed_amount: 500 }),
    ];
    const result = computeLeavingCareMetrics([], [], entitlements, 0);
    expect(result.total_claimed_amount).toBe(2300);
  });

  it("falls back to amount when claimed_amount is null", () => {
    const entitlements = [
      makeEntitlement({ id: "e1", status: "claimed", amount: 1000, claimed_amount: null }),
    ];
    const result = computeLeavingCareMetrics([], [], entitlements, 0);
    expect(result.total_claimed_amount).toBe(1000);
  });

  it("counts young people with GP registration from latest active plans", () => {
    const plans = [
      makePathwayPlan({ id: "p1", child_id: "c1", status: "active", registered_gp: true, updated_at: "2026-04-01T00:00:00Z" }),
      makePathwayPlan({ id: "p2", child_id: "c2", status: "active", registered_gp: false, updated_at: "2026-04-01T00:00:00Z" }),
      makePathwayPlan({ id: "p3", child_id: "c3", status: "active", registered_gp: true, updated_at: "2026-04-01T00:00:00Z" }),
    ];
    const result = computeLeavingCareMetrics(plans, [], [], 3);
    expect(result.yp_with_gp).toBe(2);
  });

  it("counts young people with dentist registration from latest active plans", () => {
    const plans = [
      makePathwayPlan({ id: "p1", child_id: "c1", status: "active", registered_dentist: true, updated_at: "2026-04-01T00:00:00Z" }),
      makePathwayPlan({ id: "p2", child_id: "c2", status: "active", registered_dentist: false, updated_at: "2026-04-01T00:00:00Z" }),
    ];
    const result = computeLeavingCareMetrics(plans, [], [], 2);
    expect(result.yp_with_dentist).toBe(1);
  });

  it("only considers active plans for GP and dentist counts (ignores draft/completed)", () => {
    const plans = [
      makePathwayPlan({ id: "p1", child_id: "c1", status: "draft", registered_gp: true }),
      makePathwayPlan({ id: "p2", child_id: "c2", status: "completed", registered_gp: true }),
    ];
    const result = computeLeavingCareMetrics(plans, [], [], 2);
    expect(result.yp_with_gp).toBe(0);
    expect(result.yp_with_dentist).toBe(0);
  });

  it("uses latest active plan per child for GP/dentist (by updated_at)", () => {
    const plans = [
      makePathwayPlan({ id: "p1", child_id: "c1", status: "active", registered_gp: false, updated_at: "2026-01-01T00:00:00Z" }),
      makePathwayPlan({ id: "p2", child_id: "c1", status: "active", registered_gp: true, updated_at: "2026-04-01T00:00:00Z" }),
    ];
    const result = computeLeavingCareMetrics(plans, [], [], 1);
    expect(result.yp_with_gp).toBe(1);
  });

  it("counts plans with a personal advisor assigned", () => {
    const plans = [
      makePathwayPlan({ id: "p1", child_id: "c1", status: "active", personal_advisor_name: "Jane", updated_at: "2026-04-01T00:00:00Z" }),
      makePathwayPlan({ id: "p2", child_id: "c2", status: "active", personal_advisor_name: null, updated_at: "2026-04-01T00:00:00Z" }),
      makePathwayPlan({ id: "p3", child_id: "c3", status: "active", personal_advisor_name: "Bob", updated_at: "2026-04-01T00:00:00Z" }),
    ];
    const result = computeLeavingCareMetrics(plans, [], [], 3);
    expect(result.plans_with_personal_advisor).toBe(2);
  });

  it("calculates average plan version", () => {
    const plans = [
      makePathwayPlan({ id: "p1", version: 1 }),
      makePathwayPlan({ id: "p2", version: 3 }),
      makePathwayPlan({ id: "p3", version: 2 }),
    ];
    const result = computeLeavingCareMetrics(plans, [], [], 0);
    // (1+3+2) / 3 = 2.0
    expect(result.avg_plan_version).toBe(2);
  });

  it("rounds average plan version to 1 decimal", () => {
    const plans = [
      makePathwayPlan({ id: "p1", version: 1 }),
      makePathwayPlan({ id: "p2", version: 2 }),
      makePathwayPlan({ id: "p3", version: 3 }),
    ];
    const result = computeLeavingCareMetrics(plans, [], [], 0);
    // (1+2+3) / 3 = 2.0
    expect(result.avg_plan_version).toBe(2);
  });

  it("returns 0 average plan version when no plans exist", () => {
    const result = computeLeavingCareMetrics([], [], [], 0);
    expect(result.avg_plan_version).toBe(0);
  });

  it("handles a comprehensive mixed scenario", () => {
    const plans = [
      makePathwayPlan({ id: "p1", child_id: "c1", status: "active", registered_gp: true, registered_dentist: true, personal_advisor_name: "Jane", version: 2, updated_at: "2026-04-01T00:00:00Z" }),
      makePathwayPlan({ id: "p2", child_id: "c2", status: "active", registered_gp: false, registered_dentist: false, personal_advisor_name: null, version: 1, updated_at: "2026-04-01T00:00:00Z" }),
      makePathwayPlan({ id: "p3", child_id: "c3", status: "draft", version: 1 }),
      makePathwayPlan({ id: "p4", child_id: "c4", status: "completed", version: 3 }),
    ];
    const assessments = [
      makeAssessment({ id: "a1", child_id: "c1", overall_readiness_score: 85 }),
      makeAssessment({ id: "a2", child_id: "c2", overall_readiness_score: 35 }),
    ];
    const entitlements = [
      makeEntitlement({ id: "e1", child_id: "c1", status: "claimed", claimed_amount: 1500 }),
      makeEntitlement({ id: "e2", child_id: "c1", status: "active" }),
      makeEntitlement({ id: "e3", child_id: "c2", status: "expired" }),
    ];
    const result = computeLeavingCareMetrics(plans, assessments, entitlements, 4);

    expect(result.total_pathway_plans).toBe(4);
    expect(result.active_plans).toBe(2);
    expect(result.draft_plans).toBe(1);
    expect(result.completed_plans).toBe(1);
    // c1 (active), c2 (active), c4 (completed) = 3 unique children
    expect(result.plan_coverage_pct).toBe(75);
    // avg of 85 and 35 = 60
    expect(result.avg_readiness_score).toBe(60);
    expect(result.readiness_above_70_count).toBe(1);
    expect(result.readiness_below_40_count).toBe(1);
    expect(result.total_entitlements).toBe(3);
    expect(result.active_entitlements).toBe(1);
    expect(result.claimed_entitlements).toBe(1);
    expect(result.total_claimed_amount).toBe(1500);
    expect(result.yp_with_gp).toBe(1);
    expect(result.yp_with_dentist).toBe(1);
    expect(result.plans_with_personal_advisor).toBe(1);
  });

  it("handles under_review plans (not counted as active, draft, or completed)", () => {
    const plans = [
      makePathwayPlan({ id: "p1", child_id: "c1", status: "under_review" }),
    ];
    const result = computeLeavingCareMetrics(plans, [], [], 1);
    expect(result.total_pathway_plans).toBe(1);
    expect(result.active_plans).toBe(0);
    expect(result.draft_plans).toBe(0);
    expect(result.completed_plans).toBe(0);
    // under_review not included in coverage
    expect(result.plan_coverage_pct).toBe(0);
  });

  it("rounds plan coverage percentage to 1 decimal place", () => {
    const plans = [
      makePathwayPlan({ id: "p1", child_id: "c1", status: "active" }),
    ];
    const result = computeLeavingCareMetrics(plans, [], [], 3);
    // 1/3 = 33.333... => 33.3
    expect(result.plan_coverage_pct).toBe(33.3);
  });

  it("uses latest assessment per child for readiness (ignores older ones)", () => {
    const assessments = [
      makeAssessment({ id: "a1", child_id: "c1", assessment_date: "2026-01-01", overall_readiness_score: 20 }),
      makeAssessment({ id: "a2", child_id: "c1", assessment_date: "2026-04-01", overall_readiness_score: 90 }),
    ];
    const result = computeLeavingCareMetrics([], assessments, [], 0);
    expect(result.avg_readiness_score).toBe(90);
    expect(result.readiness_above_70_count).toBe(1);
    expect(result.readiness_below_40_count).toBe(0);
  });

  it("rounds readiness score average to 1 decimal place", () => {
    const assessments = [
      makeAssessment({ id: "a1", child_id: "c1", overall_readiness_score: 33 }),
      makeAssessment({ id: "a2", child_id: "c2", overall_readiness_score: 67 }),
    ];
    const result = computeLeavingCareMetrics([], assessments, [], 0);
    // (33 + 67) / 2 = 50
    expect(result.avg_readiness_score).toBe(50);
  });

  it("rounds entitlement take-up to 1 decimal place", () => {
    const entitlements = [
      makeEntitlement({ id: "e1", status: "claimed" }),
      makeEntitlement({ id: "e2", status: "active" }),
      makeEntitlement({ id: "e3", status: "active" }),
    ];
    const result = computeLeavingCareMetrics([], [], entitlements, 0);
    // 1/3 = 33.333... => 33.3
    expect(result.entitlement_take_up_pct).toBe(33.3);
  });
});

// ── identifyLeavingCareAlerts ────────────────────────────────────────────

describe("identifyLeavingCareAlerts", () => {
  it("returns no alerts for empty inputs", () => {
    const alerts = identifyLeavingCareAlerts([], [], []);
    expect(alerts).toEqual([]);
  });

  it("returns no alerts when everything is in good shape", () => {
    const plans = [
      makePathwayPlan({
        status: "active",
        next_review_date: daysFromNow(30),
        review_date: daysAgo(30),
        personal_advisor_name: "Jane Doe",
        registered_gp: true,
        registered_dentist: true,
        target_leaving_date: daysFromNow(60),
      }),
    ];
    const assessments = [
      makeAssessment({ overall_readiness_score: 75, next_assessment_date: daysFromNow(30), skills: [] }),
    ];
    const entitlements = [
      makeEntitlement({ status: "claimed", claimed_date: "2026-03-01" }),
    ];
    const alerts = identifyLeavingCareAlerts(plans, assessments, entitlements);
    expect(alerts).toEqual([]);
  });

  // ── Overdue pathway plan reviews ──

  it("generates medium-severity alert for pathway plan review overdue by <= 30 days", () => {
    const plans = [
      makePathwayPlan({
        child_name: "Bob",
        status: "active",
        next_review_date: daysAgo(15),
      }),
    ];
    const alerts = identifyLeavingCareAlerts(plans, [], []);
    const overdueAlerts = alerts.filter((a) => a.type === "overdue_pathway_review");
    expect(overdueAlerts.length).toBeGreaterThanOrEqual(1);
    expect(overdueAlerts[0].severity).toBe("medium");
    expect(overdueAlerts[0].child_name).toBe("Bob");
    expect(overdueAlerts[0].regulation_ref).toBe("Children (Leaving Care) Act 2000");
  });

  it("generates high-severity alert for pathway plan review overdue by > 30 days", () => {
    const plans = [
      makePathwayPlan({
        child_name: "Carol",
        status: "active",
        next_review_date: daysAgo(45),
      }),
    ];
    const alerts = identifyLeavingCareAlerts(plans, [], []);
    const overdueAlerts = alerts.filter((a) => a.type === "overdue_pathway_review");
    expect(overdueAlerts.length).toBeGreaterThanOrEqual(1);
    expect(overdueAlerts[0].severity).toBe("high");
    expect(overdueAlerts[0].child_name).toBe("Carol");
  });

  it("checks overdue reviews for under_review plans too", () => {
    const plans = [
      makePathwayPlan({
        child_name: "Dave",
        status: "under_review",
        next_review_date: daysAgo(10),
      }),
    ];
    const alerts = identifyLeavingCareAlerts(plans, [], []);
    const overdueAlerts = alerts.filter((a) => a.type === "overdue_pathway_review");
    expect(overdueAlerts.length).toBe(1);
    expect(overdueAlerts[0].child_name).toBe("Dave");
  });

  it("does not flag overdue reviews for draft, completed, or archived plans", () => {
    const plans = [
      makePathwayPlan({ id: "p1", status: "draft", next_review_date: daysAgo(60) }),
      makePathwayPlan({ id: "p2", status: "completed", next_review_date: daysAgo(60) }),
      makePathwayPlan({ id: "p3", status: "archived", next_review_date: daysAgo(60) }),
    ];
    const alerts = identifyLeavingCareAlerts(plans, [], []);
    const overdueAlerts = alerts.filter((a) => a.type === "overdue_pathway_review");
    expect(overdueAlerts).toHaveLength(0);
  });

  // ── No review scheduled ──

  it("flags active plan with no review date/next_review_date active for 6+ months", () => {
    const plans = [
      makePathwayPlan({
        child_name: "Eve",
        status: "active",
        start_date: daysAgo(200),
        review_date: null,
        next_review_date: null,
      }),
    ];
    const alerts = identifyLeavingCareAlerts(plans, [], []);
    const noReviewAlerts = alerts.filter((a) => a.type === "no_review_scheduled");
    expect(noReviewAlerts.length).toBe(1);
    expect(noReviewAlerts[0].severity).toBe("high");
    expect(noReviewAlerts[0].child_name).toBe("Eve");
    expect(noReviewAlerts[0].regulation_ref).toBe("Reg 14");
  });

  it("does not flag plan with no review when active less than 6 months", () => {
    const plans = [
      makePathwayPlan({
        status: "active",
        start_date: daysAgo(90),
        review_date: null,
        next_review_date: null,
      }),
    ];
    const alerts = identifyLeavingCareAlerts(plans, [], []);
    const noReviewAlerts = alerts.filter((a) => a.type === "no_review_scheduled");
    expect(noReviewAlerts).toHaveLength(0);
  });

  it("does not flag no_review_scheduled when review_date exists", () => {
    const plans = [
      makePathwayPlan({
        status: "active",
        start_date: daysAgo(200),
        review_date: daysAgo(30),
        next_review_date: null,
      }),
    ];
    const alerts = identifyLeavingCareAlerts(plans, [], []);
    const noReviewAlerts = alerts.filter((a) => a.type === "no_review_scheduled");
    expect(noReviewAlerts).toHaveLength(0);
  });

  // ── No personal advisor ──

  it("flags active plan with no personal advisor", () => {
    const plans = [
      makePathwayPlan({
        child_name: "Frank",
        status: "active",
        personal_advisor_name: null,
      }),
    ];
    const alerts = identifyLeavingCareAlerts(plans, [], []);
    const paAlerts = alerts.filter((a) => a.type === "no_personal_advisor");
    expect(paAlerts.length).toBe(1);
    expect(paAlerts[0].severity).toBe("high");
    expect(paAlerts[0].child_name).toBe("Frank");
    expect(paAlerts[0].regulation_ref).toBe("Children (Leaving Care) Act 2000");
  });

  it("does not flag personal advisor alert when advisor is assigned", () => {
    const plans = [
      makePathwayPlan({ status: "active", personal_advisor_name: "Jane" }),
    ];
    const alerts = identifyLeavingCareAlerts(plans, [], []);
    const paAlerts = alerts.filter((a) => a.type === "no_personal_advisor");
    expect(paAlerts).toHaveLength(0);
  });

  // ── No GP registration ──

  it("flags active plan when registered_gp is false", () => {
    const plans = [
      makePathwayPlan({
        child_name: "Grace",
        status: "active",
        registered_gp: false,
      }),
    ];
    const alerts = identifyLeavingCareAlerts(plans, [], []);
    const gpAlerts = alerts.filter((a) => a.type === "no_gp_registration");
    expect(gpAlerts.length).toBe(1);
    expect(gpAlerts[0].severity).toBe("medium");
    expect(gpAlerts[0].child_name).toBe("Grace");
  });

  it("does not flag GP alert when registered_gp is null", () => {
    const plans = [
      makePathwayPlan({ status: "active", registered_gp: null }),
    ];
    const alerts = identifyLeavingCareAlerts(plans, [], []);
    const gpAlerts = alerts.filter((a) => a.type === "no_gp_registration");
    expect(gpAlerts).toHaveLength(0);
  });

  it("does not flag GP alert when registered_gp is true", () => {
    const plans = [
      makePathwayPlan({ status: "active", registered_gp: true }),
    ];
    const alerts = identifyLeavingCareAlerts(plans, [], []);
    const gpAlerts = alerts.filter((a) => a.type === "no_gp_registration");
    expect(gpAlerts).toHaveLength(0);
  });

  // ── No dentist registration ──

  it("flags active plan when registered_dentist is false", () => {
    const plans = [
      makePathwayPlan({
        child_name: "Harriet",
        status: "active",
        registered_dentist: false,
      }),
    ];
    const alerts = identifyLeavingCareAlerts(plans, [], []);
    const dentistAlerts = alerts.filter((a) => a.type === "no_dentist_registration");
    expect(dentistAlerts.length).toBe(1);
    expect(dentistAlerts[0].severity).toBe("low");
    expect(dentistAlerts[0].child_name).toBe("Harriet");
  });

  it("does not flag dentist alert when registered_dentist is null", () => {
    const plans = [
      makePathwayPlan({ status: "active", registered_dentist: null }),
    ];
    const alerts = identifyLeavingCareAlerts(plans, [], []);
    const dentistAlerts = alerts.filter((a) => a.type === "no_dentist_registration");
    expect(dentistAlerts).toHaveLength(0);
  });

  // ── Leaving date approaching ──

  it("flags active plan when target leaving date is within 30 days", () => {
    const plans = [
      makePathwayPlan({
        child_name: "Isaac",
        status: "active",
        target_leaving_date: daysFromNow(15),
      }),
    ];
    const alerts = identifyLeavingCareAlerts(plans, [], []);
    const leavingAlerts = alerts.filter((a) => a.type === "leaving_date_approaching");
    expect(leavingAlerts.length).toBe(1);
    expect(leavingAlerts[0].severity).toBe("high");
    expect(leavingAlerts[0].child_name).toBe("Isaac");
  });

  it("flags active plan when target leaving date is tomorrow (1 day away)", () => {
    const plans = [
      makePathwayPlan({
        child_name: "Jade",
        status: "active",
        target_leaving_date: daysFromNow(1),
      }),
    ];
    const alerts = identifyLeavingCareAlerts(plans, [], []);
    const leavingAlerts = alerts.filter((a) => a.type === "leaving_date_approaching");
    expect(leavingAlerts.length).toBe(1);
  });

  it("does not flag leaving date when more than 30 days away", () => {
    const plans = [
      makePathwayPlan({
        status: "active",
        target_leaving_date: daysFromNow(60),
      }),
    ];
    const alerts = identifyLeavingCareAlerts(plans, [], []);
    const leavingAlerts = alerts.filter((a) => a.type === "leaving_date_approaching");
    expect(leavingAlerts).toHaveLength(0);
  });

  it("does not flag leaving date when it has already passed", () => {
    const plans = [
      makePathwayPlan({
        status: "active",
        target_leaving_date: daysAgo(5),
      }),
    ];
    const alerts = identifyLeavingCareAlerts(plans, [], []);
    const leavingAlerts = alerts.filter((a) => a.type === "leaving_date_approaching");
    expect(leavingAlerts).toHaveLength(0);
  });

  // ── Stale draft plans ──

  it("flags draft plans older than 30 days", () => {
    const plans = [
      makePathwayPlan({
        child_name: "Karen",
        status: "draft",
        created_at: daysAgoISO(45),
      }),
    ];
    const alerts = identifyLeavingCareAlerts(plans, [], []);
    const staleAlerts = alerts.filter((a) => a.type === "stale_draft_plan");
    expect(staleAlerts.length).toBe(1);
    expect(staleAlerts[0].severity).toBe("medium");
    expect(staleAlerts[0].child_name).toBe("Karen");
  });

  it("does not flag recent draft plans (< 30 days old)", () => {
    const plans = [
      makePathwayPlan({
        status: "draft",
        created_at: daysAgoISO(10),
      }),
    ];
    const alerts = identifyLeavingCareAlerts(plans, [], []);
    const staleAlerts = alerts.filter((a) => a.type === "stale_draft_plan");
    expect(staleAlerts).toHaveLength(0);
  });

  it("does not flag active plans for stale draft check", () => {
    const plans = [
      makePathwayPlan({
        status: "active",
        created_at: daysAgoISO(90),
      }),
    ];
    const alerts = identifyLeavingCareAlerts(plans, [], []);
    const staleAlerts = alerts.filter((a) => a.type === "stale_draft_plan");
    expect(staleAlerts).toHaveLength(0);
  });

  // ── Low readiness scores ──

  it("flags low readiness score below 40 as medium severity", () => {
    const assessments = [
      makeAssessment({
        child_name: "Leo",
        child_id: "c-leo",
        overall_readiness_score: 30,
        skills: [],
      }),
    ];
    const alerts = identifyLeavingCareAlerts([], assessments, []);
    const lowAlerts = alerts.filter((a) => a.type === "low_readiness_score");
    expect(lowAlerts.length).toBe(1);
    expect(lowAlerts[0].severity).toBe("medium");
    expect(lowAlerts[0].child_name).toBe("Leo");
    expect(lowAlerts[0].regulation_ref).toBe("SCCIF Experiences & Progress");
  });

  it("flags very low readiness score below 20 as high severity", () => {
    const assessments = [
      makeAssessment({
        child_name: "Mia",
        child_id: "c-mia",
        overall_readiness_score: 15,
        skills: [],
      }),
    ];
    const alerts = identifyLeavingCareAlerts([], assessments, []);
    const lowAlerts = alerts.filter((a) => a.type === "low_readiness_score");
    expect(lowAlerts.length).toBe(1);
    expect(lowAlerts[0].severity).toBe("high");
  });

  it("does not flag readiness score of exactly 40", () => {
    const assessments = [
      makeAssessment({
        child_id: "c1",
        overall_readiness_score: 40,
        skills: [],
      }),
    ];
    const alerts = identifyLeavingCareAlerts([], assessments, []);
    const lowAlerts = alerts.filter((a) => a.type === "low_readiness_score");
    expect(lowAlerts).toHaveLength(0);
  });

  it("boundary: readiness score of exactly 20 is medium (not high)", () => {
    const assessments = [
      makeAssessment({
        child_id: "c1",
        overall_readiness_score: 20,
        skills: [],
      }),
    ];
    const alerts = identifyLeavingCareAlerts([], assessments, []);
    const lowAlerts = alerts.filter((a) => a.type === "low_readiness_score");
    expect(lowAlerts.length).toBe(1);
    expect(lowAlerts[0].severity).toBe("medium");
  });

  it("uses latest assessment per child for readiness alerts", () => {
    const assessments = [
      makeAssessment({ id: "a1", child_id: "c1", assessment_date: "2026-01-01", overall_readiness_score: 15, skills: [] }),
      makeAssessment({ id: "a2", child_id: "c1", assessment_date: "2026-04-01", overall_readiness_score: 75, skills: [] }),
    ];
    const alerts = identifyLeavingCareAlerts([], assessments, []);
    const lowAlerts = alerts.filter((a) => a.type === "low_readiness_score");
    // Latest score is 75, which is >= 40, so no alert
    expect(lowAlerts).toHaveLength(0);
  });

  // ── Overdue independence assessments ──

  it("flags overdue independence assessment (medium severity for <= 60 days)", () => {
    const assessments = [
      makeAssessment({
        child_name: "Noah",
        child_id: "c-noah",
        overall_readiness_score: 50,
        next_assessment_date: daysAgo(30),
        skills: [],
      }),
    ];
    const alerts = identifyLeavingCareAlerts([], assessments, []);
    const overdueAlerts = alerts.filter((a) => a.type === "overdue_independence_assessment");
    expect(overdueAlerts.length).toBe(1);
    expect(overdueAlerts[0].severity).toBe("medium");
    expect(overdueAlerts[0].child_name).toBe("Noah");
  });

  it("flags overdue independence assessment (high severity for > 60 days)", () => {
    const assessments = [
      makeAssessment({
        child_name: "Olivia",
        child_id: "c-olivia",
        overall_readiness_score: 50,
        next_assessment_date: daysAgo(90),
        skills: [],
      }),
    ];
    const alerts = identifyLeavingCareAlerts([], assessments, []);
    const overdueAlerts = alerts.filter((a) => a.type === "overdue_independence_assessment");
    expect(overdueAlerts.length).toBe(1);
    expect(overdueAlerts[0].severity).toBe("high");
  });

  it("does not flag assessment when next_assessment_date is in the future", () => {
    const assessments = [
      makeAssessment({
        overall_readiness_score: 50,
        next_assessment_date: daysFromNow(30),
        skills: [],
      }),
    ];
    const alerts = identifyLeavingCareAlerts([], assessments, []);
    const overdueAlerts = alerts.filter((a) => a.type === "overdue_independence_assessment");
    expect(overdueAlerts).toHaveLength(0);
  });

  it("does not flag assessment when next_assessment_date is null", () => {
    const assessments = [
      makeAssessment({
        overall_readiness_score: 50,
        next_assessment_date: null,
        skills: [],
      }),
    ];
    const alerts = identifyLeavingCareAlerts([], assessments, []);
    const overdueAlerts = alerts.filter((a) => a.type === "overdue_independence_assessment");
    expect(overdueAlerts).toHaveLength(0);
  });

  // ── Significant skill gaps ──

  it("flags when a child has 3+ skills with gaps of 3+ levels", () => {
    const assessments = [
      makeAssessment({
        child_name: "Petra",
        child_id: "c-petra",
        overall_readiness_score: 50,
        skills: [
          { skill_area: "budgeting", current_level: 1, target_level: 4, notes: "", support_needed: "" },
          { skill_area: "cooking", current_level: 1, target_level: 5, notes: "", support_needed: "" },
          { skill_area: "cleaning", current_level: 2, target_level: 5, notes: "", support_needed: "" },
        ],
      }),
    ];
    const alerts = identifyLeavingCareAlerts([], assessments, []);
    const gapAlerts = alerts.filter((a) => a.type === "significant_skill_gaps");
    expect(gapAlerts.length).toBe(1);
    expect(gapAlerts[0].severity).toBe("medium");
    expect(gapAlerts[0].child_name).toBe("Petra");
  });

  it("does not flag when fewer than 3 skills have 3+ level gaps", () => {
    const assessments = [
      makeAssessment({
        child_id: "c1",
        overall_readiness_score: 50,
        skills: [
          { skill_area: "budgeting", current_level: 1, target_level: 4, notes: "", support_needed: "" },
          { skill_area: "cooking", current_level: 1, target_level: 5, notes: "", support_needed: "" },
          { skill_area: "cleaning", current_level: 3, target_level: 5, notes: "", support_needed: "" },
        ],
      }),
    ];
    const alerts = identifyLeavingCareAlerts([], assessments, []);
    const gapAlerts = alerts.filter((a) => a.type === "significant_skill_gaps");
    expect(gapAlerts).toHaveLength(0);
  });

  it("uses label from INDEPENDENCE_SKILL_AREAS in skill gap message", () => {
    const assessments = [
      makeAssessment({
        child_name: "Quinn",
        child_id: "c-quinn",
        overall_readiness_score: 50,
        skills: [
          { skill_area: "budgeting", current_level: 1, target_level: 5, notes: "", support_needed: "" },
          { skill_area: "cooking", current_level: 1, target_level: 5, notes: "", support_needed: "" },
          { skill_area: "digital_skills", current_level: 1, target_level: 5, notes: "", support_needed: "" },
        ],
      }),
    ];
    const alerts = identifyLeavingCareAlerts([], assessments, []);
    const gapAlerts = alerts.filter((a) => a.type === "significant_skill_gaps");
    expect(gapAlerts.length).toBe(1);
    expect(gapAlerts[0].message).toContain("Budgeting & Money Management");
    expect(gapAlerts[0].message).toContain("Cooking & Meal Preparation");
    expect(gapAlerts[0].message).toContain("Digital Skills");
  });

  it("falls back to skill_area string when not found in INDEPENDENCE_SKILL_AREAS", () => {
    const assessments = [
      makeAssessment({
        child_name: "Ruth",
        child_id: "c-ruth",
        overall_readiness_score: 50,
        skills: [
          { skill_area: "unknown_skill", current_level: 1, target_level: 5, notes: "", support_needed: "" },
          { skill_area: "another_unknown", current_level: 1, target_level: 5, notes: "", support_needed: "" },
          { skill_area: "budgeting", current_level: 1, target_level: 5, notes: "", support_needed: "" },
        ],
      }),
    ];
    const alerts = identifyLeavingCareAlerts([], assessments, []);
    const gapAlerts = alerts.filter((a) => a.type === "significant_skill_gaps");
    expect(gapAlerts.length).toBe(1);
    expect(gapAlerts[0].message).toContain("unknown_skill");
    expect(gapAlerts[0].message).toContain("another_unknown");
  });

  // ── Unclaimed entitlements ──

  it("flags child with 2+ active unclaimed entitlements", () => {
    const entitlements = [
      makeEntitlement({ id: "e1", child_id: "c1", child_name: "Sam", status: "active", claimed_date: null, entitlement_type: "clothing_allowance" }),
      makeEntitlement({ id: "e2", child_id: "c1", child_name: "Sam", status: "active", claimed_date: null, entitlement_type: "birthday_allowance" }),
    ];
    const alerts = identifyLeavingCareAlerts([], [], entitlements);
    const unclaimedAlerts = alerts.filter((a) => a.type === "unclaimed_entitlements");
    expect(unclaimedAlerts.length).toBe(1);
    expect(unclaimedAlerts[0].severity).toBe("medium");
    expect(unclaimedAlerts[0].child_name).toBe("Sam");
    expect(unclaimedAlerts[0].message).toContain("2 unclaimed entitlements");
    expect(unclaimedAlerts[0].regulation_ref).toBe("Children (Leaving Care) Act 2000");
  });

  it("uses label from ENTITLEMENT_TYPES in unclaimed entitlement message", () => {
    const entitlements = [
      makeEntitlement({ id: "e1", child_id: "c1", child_name: "Tina", status: "active", claimed_date: null, entitlement_type: "setting_up_home_allowance" }),
      makeEntitlement({ id: "e2", child_id: "c1", child_name: "Tina", status: "active", claimed_date: null, entitlement_type: "education_bursary" }),
    ];
    const alerts = identifyLeavingCareAlerts([], [], entitlements);
    const unclaimedAlerts = alerts.filter((a) => a.type === "unclaimed_entitlements");
    expect(unclaimedAlerts.length).toBe(1);
    expect(unclaimedAlerts[0].message).toContain("Setting Up Home Allowance");
    expect(unclaimedAlerts[0].message).toContain("Education Bursary");
  });

  it("does not flag child with only 1 active unclaimed entitlement", () => {
    const entitlements = [
      makeEntitlement({ id: "e1", child_id: "c1", status: "active", claimed_date: null }),
    ];
    const alerts = identifyLeavingCareAlerts([], [], entitlements);
    const unclaimedAlerts = alerts.filter((a) => a.type === "unclaimed_entitlements");
    expect(unclaimedAlerts).toHaveLength(0);
  });

  it("does not count claimed entitlements as unclaimed", () => {
    const entitlements = [
      makeEntitlement({ id: "e1", child_id: "c1", status: "active", claimed_date: "2026-03-01" }),
      makeEntitlement({ id: "e2", child_id: "c1", status: "active", claimed_date: null }),
    ];
    const alerts = identifyLeavingCareAlerts([], [], entitlements);
    const unclaimedAlerts = alerts.filter((a) => a.type === "unclaimed_entitlements");
    expect(unclaimedAlerts).toHaveLength(0);
  });

  it("groups unclaimed entitlements by child", () => {
    const entitlements = [
      makeEntitlement({ id: "e1", child_id: "c1", child_name: "Una", status: "active", claimed_date: null, entitlement_type: "clothing_allowance" }),
      makeEntitlement({ id: "e2", child_id: "c1", child_name: "Una", status: "active", claimed_date: null, entitlement_type: "birthday_allowance" }),
      makeEntitlement({ id: "e3", child_id: "c2", child_name: "Vic", status: "active", claimed_date: null, entitlement_type: "travel_costs" }),
      makeEntitlement({ id: "e4", child_id: "c2", child_name: "Vic", status: "active", claimed_date: null, entitlement_type: "contact_costs" }),
      makeEntitlement({ id: "e5", child_id: "c2", child_name: "Vic", status: "active", claimed_date: null, entitlement_type: "education_bursary" }),
    ];
    const alerts = identifyLeavingCareAlerts([], [], entitlements);
    const unclaimedAlerts = alerts.filter((a) => a.type === "unclaimed_entitlements");
    expect(unclaimedAlerts.length).toBe(2);
    const unaAlert = unclaimedAlerts.find((a) => a.child_name === "Una");
    const vicAlert = unclaimedAlerts.find((a) => a.child_name === "Vic");
    expect(unaAlert).toBeDefined();
    expect(vicAlert).toBeDefined();
    expect(vicAlert!.message).toContain("3 unclaimed entitlements");
  });

  // ── Expired unclaimed entitlements ──

  it("flags expired entitlements that were never claimed", () => {
    const entitlements = [
      makeEntitlement({
        id: "e1",
        child_name: "Will",
        status: "expired",
        claimed_date: null,
        entitlement_type: "clothing_allowance",
      }),
    ];
    const alerts = identifyLeavingCareAlerts([], [], entitlements);
    const expiredAlerts = alerts.filter((a) => a.type === "expired_unclaimed_entitlement");
    expect(expiredAlerts.length).toBe(1);
    expect(expiredAlerts[0].severity).toBe("low");
    expect(expiredAlerts[0].child_name).toBe("Will");
    expect(expiredAlerts[0].message).toContain("Clothing Allowance");
    expect(expiredAlerts[0].regulation_ref).toBe("Children (Leaving Care) Act 2000");
  });

  it("does not flag expired entitlements that were claimed", () => {
    const entitlements = [
      makeEntitlement({
        status: "expired",
        claimed_date: "2026-02-01",
      }),
    ];
    const alerts = identifyLeavingCareAlerts([], [], entitlements);
    const expiredAlerts = alerts.filter((a) => a.type === "expired_unclaimed_entitlement");
    expect(expiredAlerts).toHaveLength(0);
  });

  it("falls back to entitlement_type string when type not found in ENTITLEMENT_TYPES", () => {
    const entitlements = [
      makeEntitlement({
        child_name: "Xena",
        status: "expired",
        claimed_date: null,
        entitlement_type: "custom_grant",
      }),
    ];
    const alerts = identifyLeavingCareAlerts([], [], entitlements);
    const expiredAlerts = alerts.filter((a) => a.type === "expired_unclaimed_entitlement");
    expect(expiredAlerts.length).toBe(1);
    expect(expiredAlerts[0].message).toContain("custom_grant");
  });

  // ── Multiple alert types combined ──

  it("generates multiple alert types for the same plan", () => {
    const plans = [
      makePathwayPlan({
        child_name: "Yara",
        status: "active",
        next_review_date: daysAgo(45),
        personal_advisor_name: null,
        registered_gp: false,
        registered_dentist: false,
        target_leaving_date: daysFromNow(10),
        start_date: daysAgo(200),
        review_date: null,
      }),
    ];
    const alerts = identifyLeavingCareAlerts(plans, [], []);
    const types = alerts.map((a) => a.type);
    expect(types).toContain("overdue_pathway_review");
    expect(types).toContain("no_personal_advisor");
    expect(types).toContain("no_gp_registration");
    expect(types).toContain("no_dentist_registration");
    expect(types).toContain("leaving_date_approaching");
  });

  it("produces alerts from all categories simultaneously", () => {
    const plans = [
      makePathwayPlan({
        id: "p1",
        child_id: "c1",
        child_name: "Zara",
        status: "active",
        next_review_date: daysAgo(5),
        personal_advisor_name: "Advisor",
        registered_gp: true,
        registered_dentist: true,
      }),
    ];
    const assessments = [
      makeAssessment({
        child_id: "c2",
        child_name: "Amy",
        overall_readiness_score: 10,
        next_assessment_date: daysAgo(100),
        skills: [
          { skill_area: "budgeting", current_level: 1, target_level: 5, notes: "", support_needed: "" },
          { skill_area: "cooking", current_level: 1, target_level: 5, notes: "", support_needed: "" },
          { skill_area: "cleaning", current_level: 1, target_level: 5, notes: "", support_needed: "" },
        ],
      }),
    ];
    const entitlements = [
      makeEntitlement({ id: "e1", child_id: "c3", child_name: "Bea", status: "expired", claimed_date: null }),
    ];
    const alerts = identifyLeavingCareAlerts(plans, assessments, entitlements);
    const types = new Set(alerts.map((a) => a.type));
    expect(types.has("overdue_pathway_review")).toBe(true);
    expect(types.has("low_readiness_score")).toBe(true);
    expect(types.has("overdue_independence_assessment")).toBe(true);
    expect(types.has("significant_skill_gaps")).toBe(true);
    expect(types.has("expired_unclaimed_entitlement")).toBe(true);
  });

  it("all alerts have required fields: type, severity, message", () => {
    const plans = [
      makePathwayPlan({
        status: "active",
        next_review_date: daysAgo(15),
        personal_advisor_name: null,
        registered_gp: false,
      }),
    ];
    const alerts = identifyLeavingCareAlerts(plans, [], []);
    for (const alert of alerts) {
      expect(typeof alert.type).toBe("string");
      expect(["high", "medium", "low"]).toContain(alert.severity);
      expect(typeof alert.message).toBe("string");
      expect(alert.message.length).toBeGreaterThan(0);
    }
  });
});
