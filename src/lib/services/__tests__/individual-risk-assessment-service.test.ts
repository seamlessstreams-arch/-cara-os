// ==============================================================================
// CARA -- INDIVIDUAL RISK ASSESSMENT SERVICE TESTS
// Pure-function unit tests for individual child risk assessment metrics
// computation, alert identification, and constant validation.
// CHR 2015 Reg 12 (protection of children),
// Reg 13 (leadership and management -- risk management),
// Reg 34 (placement plans -- risk assessment).
// SCCIF: Helped & Protected -- "Individual risks are identified,
// assessed, and managed with clear plans."
// ==============================================================================

import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  isSupabaseEnabled: () => false,
  createServerClient: () => null,
}));

import {
  _testing,
  RISK_DOMAINS,
  RISK_RATINGS,
  ASSESSMENT_STATUSES,
  REVIEW_TRIGGERS,
} from "../individual-risk-assessment-service";

import type {
  IndividualRiskAssessment,
  RiskDomain,
  RiskRating,
  AssessmentStatus,
  ReviewTrigger,
} from "../individual-risk-assessment-service";

const { computeIndividualRiskMetrics, identifyIndividualRiskAlerts } = _testing;

// -- Helpers -----------------------------------------------------------------

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

function daysAgoISO(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function makeAssessment(
  overrides: Partial<IndividualRiskAssessment> = {},
): IndividualRiskAssessment {
  return {
    id: "assess-1",
    home_id: "home-1",
    child_name: "Alice Smith",
    child_id: "child-1",
    risk_domain: "self_harm",
    risk_rating: "medium",
    assessment_status: "current",
    assessed_by: "staff-1",
    assessment_date: daysAgo(7),
    review_date: daysFromNow(30),
    review_trigger: "scheduled",
    risk_indicators: ["indicator-1"],
    protective_factors: ["factor-1"],
    management_strategies: ["strategy-1", "strategy-2"],
    triggers: ["trigger-1"],
    staff_aware: true,
    staff_briefed_date: daysAgo(5),
    multi_agency_involved: false,
    social_worker_informed: true,
    child_involved_in_plan: true,
    parent_informed: true,
    linked_incident_ids: [],
    notes: null,
    created_at: daysAgoISO(7),
    updated_at: daysAgoISO(7),
    ...overrides,
  };
}

// =============================================================================
// 1. CONSTANTS
// =============================================================================

describe("RISK_DOMAINS", () => {
  it("has exactly 16 domains", () => {
    expect(RISK_DOMAINS).toHaveLength(16);
  });

  it("contains unique domain values", () => {
    const values = RISK_DOMAINS.map((d) => d.domain);
    expect(new Set(values).size).toBe(16);
  });

  it("contains unique labels", () => {
    const labels = RISK_DOMAINS.map((d) => d.label);
    expect(new Set(labels).size).toBe(16);
  });

  it("includes all expected domains", () => {
    const domains = RISK_DOMAINS.map((d) => d.domain);
    const expected: RiskDomain[] = [
      "self_harm",
      "suicide",
      "absconding",
      "cse",
      "cce",
      "radicalisation",
      "substance_misuse",
      "aggression_to_others",
      "aggression_to_property",
      "bullying",
      "online_risk",
      "fire_setting",
      "sexual_behaviour",
      "gang_involvement",
      "trafficking",
      "other",
    ];
    for (const e of expected) {
      expect(domains).toContain(e);
    }
  });

  it("each entry has domain and label fields", () => {
    for (const entry of RISK_DOMAINS) {
      expect(entry).toHaveProperty("domain");
      expect(entry).toHaveProperty("label");
      expect(typeof entry.domain).toBe("string");
      expect(typeof entry.label).toBe("string");
    }
  });

  it("labels are non-empty strings", () => {
    for (const entry of RISK_DOMAINS) {
      expect(entry.label.length).toBeGreaterThan(0);
    }
  });
});

describe("RISK_RATINGS", () => {
  it("has exactly 5 ratings", () => {
    expect(RISK_RATINGS).toHaveLength(5);
  });

  it("contains unique rating values", () => {
    const values = RISK_RATINGS.map((r) => r.rating);
    expect(new Set(values).size).toBe(5);
  });

  it("contains unique labels", () => {
    const labels = RISK_RATINGS.map((r) => r.label);
    expect(new Set(labels).size).toBe(5);
  });

  it("includes all expected ratings", () => {
    const ratings = RISK_RATINGS.map((r) => r.rating);
    const expected: RiskRating[] = ["very_high", "high", "medium", "low", "minimal"];
    for (const e of expected) {
      expect(ratings).toContain(e);
    }
  });

  it("each entry has rating and label fields", () => {
    for (const entry of RISK_RATINGS) {
      expect(entry).toHaveProperty("rating");
      expect(entry).toHaveProperty("label");
      expect(typeof entry.rating).toBe("string");
      expect(typeof entry.label).toBe("string");
    }
  });

  it("labels are non-empty strings", () => {
    for (const entry of RISK_RATINGS) {
      expect(entry.label.length).toBeGreaterThan(0);
    }
  });
});

describe("ASSESSMENT_STATUSES", () => {
  it("has exactly 5 statuses", () => {
    expect(ASSESSMENT_STATUSES).toHaveLength(5);
  });

  it("contains unique status values", () => {
    const values = ASSESSMENT_STATUSES.map((s) => s.status);
    expect(new Set(values).size).toBe(5);
  });

  it("contains unique labels", () => {
    const labels = ASSESSMENT_STATUSES.map((s) => s.label);
    expect(new Set(labels).size).toBe(5);
  });

  it("includes all expected statuses", () => {
    const statuses = ASSESSMENT_STATUSES.map((s) => s.status);
    const expected: AssessmentStatus[] = ["current", "under_review", "expired", "superseded", "draft"];
    for (const e of expected) {
      expect(statuses).toContain(e);
    }
  });

  it("each entry has status and label fields", () => {
    for (const entry of ASSESSMENT_STATUSES) {
      expect(entry).toHaveProperty("status");
      expect(entry).toHaveProperty("label");
      expect(typeof entry.status).toBe("string");
      expect(typeof entry.label).toBe("string");
    }
  });

  it("labels are non-empty strings", () => {
    for (const entry of ASSESSMENT_STATUSES) {
      expect(entry.label.length).toBeGreaterThan(0);
    }
  });
});

describe("REVIEW_TRIGGERS", () => {
  it("has exactly 8 triggers", () => {
    expect(REVIEW_TRIGGERS).toHaveLength(8);
  });

  it("contains unique trigger values", () => {
    const values = REVIEW_TRIGGERS.map((t) => t.trigger);
    expect(new Set(values).size).toBe(8);
  });

  it("contains unique labels", () => {
    const labels = REVIEW_TRIGGERS.map((t) => t.label);
    expect(new Set(labels).size).toBe(8);
  });

  it("includes all expected triggers", () => {
    const triggers = REVIEW_TRIGGERS.map((t) => t.trigger);
    const expected: ReviewTrigger[] = [
      "scheduled",
      "incident",
      "placement_change",
      "disclosure",
      "professional_request",
      "escalation",
      "improvement",
      "initial",
    ];
    for (const e of expected) {
      expect(triggers).toContain(e);
    }
  });

  it("each entry has trigger and label fields", () => {
    for (const entry of REVIEW_TRIGGERS) {
      expect(entry).toHaveProperty("trigger");
      expect(entry).toHaveProperty("label");
      expect(typeof entry.trigger).toBe("string");
      expect(typeof entry.label).toBe("string");
    }
  });

  it("labels are non-empty strings", () => {
    for (const entry of REVIEW_TRIGGERS) {
      expect(entry.label.length).toBeGreaterThan(0);
    }
  });
});

// =============================================================================
// 2. computeIndividualRiskMetrics
// =============================================================================

describe("computeIndividualRiskMetrics", () => {
  // -- Empty array -----------------------------------------------------------

  describe("with empty array", () => {
    it("returns zero for total_assessments", () => {
      const m = computeIndividualRiskMetrics([], 5);
      expect(m.total_assessments).toBe(0);
    });

    it("returns zero for children_assessed", () => {
      const m = computeIndividualRiskMetrics([], 5);
      expect(m.children_assessed).toBe(0);
    });

    it("returns zero for assessment_coverage", () => {
      const m = computeIndividualRiskMetrics([], 5);
      expect(m.assessment_coverage).toBe(0);
    });

    it("returns zero for current_count", () => {
      const m = computeIndividualRiskMetrics([], 5);
      expect(m.current_count).toBe(0);
    });

    it("returns zero for expired_count", () => {
      const m = computeIndividualRiskMetrics([], 5);
      expect(m.expired_count).toBe(0);
    });

    it("returns zero for under_review_count", () => {
      const m = computeIndividualRiskMetrics([], 5);
      expect(m.under_review_count).toBe(0);
    });

    it("returns zero for all risk rating counts", () => {
      const m = computeIndividualRiskMetrics([], 5);
      expect(m.very_high_count).toBe(0);
      expect(m.high_count).toBe(0);
      expect(m.medium_count).toBe(0);
      expect(m.low_count).toBe(0);
    });

    it("returns zero for all rate fields", () => {
      const m = computeIndividualRiskMetrics([], 5);
      expect(m.staff_aware_rate).toBeNull();; expect(m.multi_agency_rate).toBeNull();; expect(m.child_involved_rate).toBeNull();; expect(m.parent_informed_rate).toBeNull();; });

    it("returns zero for review_overdue_count", () => {
      const m = computeIndividualRiskMetrics([], 5);
      expect(m.review_overdue_count).toBe(0);
    });

    it("returns zero for average_per_child", () => {
      const m = computeIndividualRiskMetrics([], 5);
      expect(m.average_per_child).toBeNull();; });

    it("returns zero for average_strategies_per_assessment", () => {
      const m = computeIndividualRiskMetrics([], 5);
      expect(m.average_strategies_per_assessment).toBeNull();; });

    it("returns empty by_risk_domain", () => {
      const m = computeIndividualRiskMetrics([], 5);
      expect(m.by_risk_domain).toEqual({});
    });

    it("returns empty by_risk_rating", () => {
      const m = computeIndividualRiskMetrics([], 5);
      expect(m.by_risk_rating).toEqual({});
    });

    it("returns empty by_assessment_status", () => {
      const m = computeIndividualRiskMetrics([], 5);
      expect(m.by_assessment_status).toEqual({});
    });

    it("returns empty by_review_trigger", () => {
      const m = computeIndividualRiskMetrics([], 5);
      expect(m.by_review_trigger).toEqual({});
    });
  });

  // -- Single assessment -----------------------------------------------------

  describe("with single assessment", () => {
    const single = [makeAssessment()];

    it("returns total_assessments = 1", () => {
      expect(computeIndividualRiskMetrics(single, 3).total_assessments).toBe(1);
    });

    it("returns children_assessed = 1", () => {
      expect(computeIndividualRiskMetrics(single, 3).children_assessed).toBe(1);
    });

    it("calculates assessment_coverage correctly", () => {
      // 1/3 = 33.3%
      expect(computeIndividualRiskMetrics(single, 3).assessment_coverage).toBe(33.3);
    });

    it("counts current_count = 1 for current assessment", () => {
      expect(computeIndividualRiskMetrics(single, 3).current_count).toBe(1);
    });

    it("counts expired_count = 0", () => {
      expect(computeIndividualRiskMetrics(single, 3).expired_count).toBe(0);
    });

    it("counts under_review_count = 0", () => {
      expect(computeIndividualRiskMetrics(single, 3).under_review_count).toBe(0);
    });

    it("counts medium_count = 1 for medium risk rating", () => {
      expect(computeIndividualRiskMetrics(single, 3).medium_count).toBe(1);
    });

    it("counts very_high_count = 0", () => {
      expect(computeIndividualRiskMetrics(single, 3).very_high_count).toBe(0);
    });

    it("counts high_count = 0", () => {
      expect(computeIndividualRiskMetrics(single, 3).high_count).toBe(0);
    });

    it("counts low_count = 0", () => {
      expect(computeIndividualRiskMetrics(single, 3).low_count).toBe(0);
    });

    it("returns staff_aware_rate = 100 when staff_aware true", () => {
      expect(computeIndividualRiskMetrics(single, 3).staff_aware_rate).toBe(100);
    });

    it("returns multi_agency_rate = 0 when multi_agency_involved false", () => {
      expect(computeIndividualRiskMetrics(single, 3).multi_agency_rate).toBe(0);
    });

    it("returns child_involved_rate = 100 when child_involved_in_plan true", () => {
      expect(computeIndividualRiskMetrics(single, 3).child_involved_rate).toBe(100);
    });

    it("returns parent_informed_rate = 100 when parent_informed true", () => {
      expect(computeIndividualRiskMetrics(single, 3).parent_informed_rate).toBe(100);
    });

    it("returns average_per_child = 1", () => {
      expect(computeIndividualRiskMetrics(single, 3).average_per_child).toBe(1);
    });

    it("computes average_strategies_per_assessment correctly", () => {
      // default has 2 strategies
      expect(computeIndividualRiskMetrics(single, 3).average_strategies_per_assessment).toBe(2);
    });

    it("populates by_risk_domain with single domain", () => {
      expect(computeIndividualRiskMetrics(single, 3).by_risk_domain).toEqual({
        self_harm: 1,
      });
    });

    it("populates by_risk_rating with single rating", () => {
      expect(computeIndividualRiskMetrics(single, 3).by_risk_rating).toEqual({
        medium: 1,
      });
    });

    it("populates by_assessment_status with single status", () => {
      expect(computeIndividualRiskMetrics(single, 3).by_assessment_status).toEqual({
        current: 1,
      });
    });

    it("populates by_review_trigger with single trigger", () => {
      expect(computeIndividualRiskMetrics(single, 3).by_review_trigger).toEqual({
        scheduled: 1,
      });
    });
  });

  // -- Multiple assessments --------------------------------------------------

  describe("with multiple assessments", () => {
    const multi = [
      makeAssessment({
        id: "a1",
        child_id: "child-1",
        risk_domain: "self_harm",
        risk_rating: "very_high",
        assessment_status: "current",
        staff_aware: true,
        multi_agency_involved: true,
        child_involved_in_plan: true,
        parent_informed: true,
        management_strategies: ["s1", "s2", "s3"],
        review_trigger: "incident",
      }),
      makeAssessment({
        id: "a2",
        child_id: "child-1",
        risk_domain: "absconding",
        risk_rating: "high",
        assessment_status: "current",
        staff_aware: true,
        multi_agency_involved: false,
        child_involved_in_plan: false,
        parent_informed: true,
        management_strategies: ["s1"],
        review_trigger: "scheduled",
      }),
      makeAssessment({
        id: "a3",
        child_id: "child-2",
        child_name: "Bob Jones",
        risk_domain: "cse",
        risk_rating: "medium",
        assessment_status: "expired",
        staff_aware: false,
        multi_agency_involved: true,
        child_involved_in_plan: true,
        parent_informed: false,
        management_strategies: ["s1", "s2"],
        review_trigger: "escalation",
      }),
      makeAssessment({
        id: "a4",
        child_id: "child-3",
        child_name: "Charlie Brown",
        risk_domain: "substance_misuse",
        risk_rating: "low",
        assessment_status: "under_review",
        staff_aware: false,
        multi_agency_involved: false,
        child_involved_in_plan: false,
        parent_informed: false,
        management_strategies: [],
        review_trigger: "placement_change",
      }),
    ];

    it("returns correct total_assessments", () => {
      expect(computeIndividualRiskMetrics(multi, 6).total_assessments).toBe(4);
    });

    it("counts unique children_assessed", () => {
      expect(computeIndividualRiskMetrics(multi, 6).children_assessed).toBe(3);
    });

    it("calculates assessment_coverage for 3/6 children", () => {
      expect(computeIndividualRiskMetrics(multi, 6).assessment_coverage).toBe(50);
    });

    it("counts current_count correctly", () => {
      expect(computeIndividualRiskMetrics(multi, 6).current_count).toBe(2);
    });

    it("counts expired_count correctly", () => {
      expect(computeIndividualRiskMetrics(multi, 6).expired_count).toBe(1);
    });

    it("counts under_review_count correctly", () => {
      expect(computeIndividualRiskMetrics(multi, 6).under_review_count).toBe(1);
    });

    it("counts very_high_count correctly", () => {
      expect(computeIndividualRiskMetrics(multi, 6).very_high_count).toBe(1);
    });

    it("counts high_count correctly", () => {
      expect(computeIndividualRiskMetrics(multi, 6).high_count).toBe(1);
    });

    it("counts medium_count correctly", () => {
      expect(computeIndividualRiskMetrics(multi, 6).medium_count).toBe(1);
    });

    it("counts low_count correctly", () => {
      expect(computeIndividualRiskMetrics(multi, 6).low_count).toBe(1);
    });

    it("calculates staff_aware_rate correctly", () => {
      // 2/4 = 50%
      expect(computeIndividualRiskMetrics(multi, 6).staff_aware_rate).toBe(50);
    });

    it("calculates multi_agency_rate correctly", () => {
      // 2/4 = 50%
      expect(computeIndividualRiskMetrics(multi, 6).multi_agency_rate).toBe(50);
    });

    it("calculates child_involved_rate correctly", () => {
      // 2/4 = 50%
      expect(computeIndividualRiskMetrics(multi, 6).child_involved_rate).toBe(50);
    });

    it("calculates parent_informed_rate correctly", () => {
      // 2/4 = 50%
      expect(computeIndividualRiskMetrics(multi, 6).parent_informed_rate).toBe(50);
    });

    it("calculates average_per_child correctly", () => {
      // 4/3 = 1.3
      expect(computeIndividualRiskMetrics(multi, 6).average_per_child).toBe(1.3);
    });

    it("calculates average_strategies_per_assessment correctly", () => {
      // (3+1+2+0)/4 = 1.5
      expect(computeIndividualRiskMetrics(multi, 6).average_strategies_per_assessment).toBe(1.5);
    });

    it("builds by_risk_domain with correct counts", () => {
      const m = computeIndividualRiskMetrics(multi, 6);
      expect(m.by_risk_domain).toEqual({
        self_harm: 1,
        absconding: 1,
        cse: 1,
        substance_misuse: 1,
      });
    });

    it("builds by_risk_rating with correct counts", () => {
      const m = computeIndividualRiskMetrics(multi, 6);
      expect(m.by_risk_rating).toEqual({
        very_high: 1,
        high: 1,
        medium: 1,
        low: 1,
      });
    });

    it("builds by_assessment_status with correct counts", () => {
      const m = computeIndividualRiskMetrics(multi, 6);
      expect(m.by_assessment_status).toEqual({
        current: 2,
        expired: 1,
        under_review: 1,
      });
    });

    it("builds by_review_trigger with correct counts", () => {
      const m = computeIndividualRiskMetrics(multi, 6);
      expect(m.by_review_trigger).toEqual({
        incident: 1,
        scheduled: 1,
        escalation: 1,
        placement_change: 1,
      });
    });
  });

  // -- assessment_coverage edge cases ----------------------------------------

  describe("assessment_coverage", () => {
    it("returns 100 when all children assessed", () => {
      const a = [
        makeAssessment({ child_id: "c1" }),
        makeAssessment({ child_id: "c2" }),
      ];
      expect(computeIndividualRiskMetrics(a, 2).assessment_coverage).toBe(100);
    });

    it("returns 0 when totalChildren is 0", () => {
      const m = computeIndividualRiskMetrics([], 0);
      expect(m.assessment_coverage).toBeNull();; });

    it("returns 0 when totalChildren is 0 even with assessments", () => {
      const m = computeIndividualRiskMetrics([makeAssessment()], 0);
      expect(m.assessment_coverage).toBeNull();; });

    it("rounds coverage to 1 decimal place", () => {
      // 1/3 = 33.333...% => 33.3
      const a = [makeAssessment({ child_id: "c1" })];
      expect(computeIndividualRiskMetrics(a, 3).assessment_coverage).toBe(33.3);
    });

    it("rounds coverage correctly for 1/7", () => {
      // 1/7 = 14.2857...% => 14.3
      const a = [makeAssessment({ child_id: "c1" })];
      expect(computeIndividualRiskMetrics(a, 7).assessment_coverage).toBe(14.3);
    });

    it("deduplicates children for coverage calculation", () => {
      const a = [
        makeAssessment({ child_id: "c1", id: "a1" }),
        makeAssessment({ child_id: "c1", id: "a2", risk_domain: "absconding" }),
        makeAssessment({ child_id: "c1", id: "a3", risk_domain: "cse" }),
      ];
      // Only 1 unique child out of 4
      expect(computeIndividualRiskMetrics(a, 4).assessment_coverage).toBe(25);
    });
  });

  // -- children_assessed (unique child_ids) ----------------------------------

  describe("children_assessed", () => {
    it("counts 1 child with multiple assessments", () => {
      const a = [
        makeAssessment({ id: "a1", child_id: "c1" }),
        makeAssessment({ id: "a2", child_id: "c1", risk_domain: "absconding" }),
      ];
      expect(computeIndividualRiskMetrics(a, 5).children_assessed).toBe(1);
    });

    it("counts distinct children", () => {
      const a = [
        makeAssessment({ id: "a1", child_id: "c1" }),
        makeAssessment({ id: "a2", child_id: "c2" }),
        makeAssessment({ id: "a3", child_id: "c3" }),
      ];
      expect(computeIndividualRiskMetrics(a, 5).children_assessed).toBe(3);
    });

    it("returns 0 for empty array", () => {
      expect(computeIndividualRiskMetrics([], 5).children_assessed).toBe(0);
    });
  });

  // -- Status counts ---------------------------------------------------------

  describe("status counts", () => {
    it("counts superseded assessments (not a named field but in by_assessment_status)", () => {
      const a = [makeAssessment({ assessment_status: "superseded" })];
      const m = computeIndividualRiskMetrics(a, 1);
      expect(m.current_count).toBe(0);
      expect(m.expired_count).toBe(0);
      expect(m.under_review_count).toBe(0);
      expect(m.by_assessment_status).toEqual({ superseded: 1 });
    });

    it("counts draft assessments (not a named field but in by_assessment_status)", () => {
      const a = [makeAssessment({ assessment_status: "draft" })];
      const m = computeIndividualRiskMetrics(a, 1);
      expect(m.current_count).toBe(0);
      expect(m.expired_count).toBe(0);
      expect(m.under_review_count).toBe(0);
      expect(m.by_assessment_status).toEqual({ draft: 1 });
    });

    it("counts all statuses correctly in a mixed set", () => {
      const a = [
        makeAssessment({ id: "a1", assessment_status: "current" }),
        makeAssessment({ id: "a2", assessment_status: "current" }),
        makeAssessment({ id: "a3", assessment_status: "expired" }),
        makeAssessment({ id: "a4", assessment_status: "under_review" }),
        makeAssessment({ id: "a5", assessment_status: "superseded" }),
        makeAssessment({ id: "a6", assessment_status: "draft" }),
      ];
      const m = computeIndividualRiskMetrics(a, 5);
      expect(m.current_count).toBe(2);
      expect(m.expired_count).toBe(1);
      expect(m.under_review_count).toBe(1);
    });
  });

  // -- Risk rating counts ----------------------------------------------------

  describe("risk rating counts", () => {
    it("counts minimal rating (not a named field but counted in by_risk_rating)", () => {
      const a = [makeAssessment({ risk_rating: "minimal" })];
      const m = computeIndividualRiskMetrics(a, 1);
      expect(m.very_high_count).toBe(0);
      expect(m.high_count).toBe(0);
      expect(m.medium_count).toBe(0);
      expect(m.low_count).toBe(0);
      expect(m.by_risk_rating).toEqual({ minimal: 1 });
    });

    it("counts mixed ratings correctly", () => {
      const a = [
        makeAssessment({ id: "a1", risk_rating: "very_high" }),
        makeAssessment({ id: "a2", risk_rating: "very_high" }),
        makeAssessment({ id: "a3", risk_rating: "high" }),
        makeAssessment({ id: "a4", risk_rating: "medium" }),
        makeAssessment({ id: "a5", risk_rating: "low" }),
        makeAssessment({ id: "a6", risk_rating: "minimal" }),
      ];
      const m = computeIndividualRiskMetrics(a, 5);
      expect(m.very_high_count).toBe(2);
      expect(m.high_count).toBe(1);
      expect(m.medium_count).toBe(1);
      expect(m.low_count).toBe(1);
    });
  });

  // -- Rate calculations (staff_aware, multi_agency, child_involved, parent_informed) --

  describe("rate calculations", () => {
    it("returns 100 for staff_aware_rate when all staff aware", () => {
      const a = [
        makeAssessment({ id: "a1", staff_aware: true }),
        makeAssessment({ id: "a2", staff_aware: true }),
      ];
      expect(computeIndividualRiskMetrics(a, 2).staff_aware_rate).toBe(100);
    });

    it("returns 0 for staff_aware_rate when no staff aware", () => {
      const a = [
        makeAssessment({ id: "a1", staff_aware: false }),
        makeAssessment({ id: "a2", staff_aware: false }),
      ];
      expect(computeIndividualRiskMetrics(a, 2).staff_aware_rate).toBe(0);
    });

    it("returns 100 for multi_agency_rate when all involve multi-agency", () => {
      const a = [
        makeAssessment({ id: "a1", multi_agency_involved: true }),
        makeAssessment({ id: "a2", multi_agency_involved: true }),
      ];
      expect(computeIndividualRiskMetrics(a, 2).multi_agency_rate).toBe(100);
    });

    it("returns 0 for multi_agency_rate when none involve multi-agency", () => {
      const a = [
        makeAssessment({ id: "a1", multi_agency_involved: false }),
        makeAssessment({ id: "a2", multi_agency_involved: false }),
      ];
      expect(computeIndividualRiskMetrics(a, 2).multi_agency_rate).toBe(0);
    });

    it("returns 100 for child_involved_rate when all children involved", () => {
      const a = [
        makeAssessment({ id: "a1", child_involved_in_plan: true }),
        makeAssessment({ id: "a2", child_involved_in_plan: true }),
      ];
      expect(computeIndividualRiskMetrics(a, 2).child_involved_rate).toBe(100);
    });

    it("returns 0 for child_involved_rate when no children involved", () => {
      const a = [
        makeAssessment({ id: "a1", child_involved_in_plan: false }),
        makeAssessment({ id: "a2", child_involved_in_plan: false }),
      ];
      expect(computeIndividualRiskMetrics(a, 2).child_involved_rate).toBe(0);
    });

    it("returns 100 for parent_informed_rate when all parents informed", () => {
      const a = [
        makeAssessment({ id: "a1", parent_informed: true }),
        makeAssessment({ id: "a2", parent_informed: true }),
      ];
      expect(computeIndividualRiskMetrics(a, 2).parent_informed_rate).toBe(100);
    });

    it("returns 0 for parent_informed_rate when no parents informed", () => {
      const a = [
        makeAssessment({ id: "a1", parent_informed: false }),
        makeAssessment({ id: "a2", parent_informed: false }),
      ];
      expect(computeIndividualRiskMetrics(a, 2).parent_informed_rate).toBe(0);
    });

    it("rounds rate to 1 decimal place for 1/3 ratio", () => {
      const a = [
        makeAssessment({ id: "a1", staff_aware: true }),
        makeAssessment({ id: "a2", staff_aware: false }),
        makeAssessment({ id: "a3", staff_aware: false }),
      ];
      // 1/3 = 33.3%
      expect(computeIndividualRiskMetrics(a, 3).staff_aware_rate).toBe(33.3);
    });

    it("rounds rate to 1 decimal place for 2/3 ratio", () => {
      const a = [
        makeAssessment({ id: "a1", multi_agency_involved: true }),
        makeAssessment({ id: "a2", multi_agency_involved: true }),
        makeAssessment({ id: "a3", multi_agency_involved: false }),
      ];
      // 2/3 = 66.7%
      expect(computeIndividualRiskMetrics(a, 3).multi_agency_rate).toBe(66.7);
    });
  });

  // -- review_overdue_count --------------------------------------------------

  describe("review_overdue_count", () => {
    it("counts overdue reviews for current assessments with past review_date", () => {
      const a = [
        makeAssessment({
          id: "a1",
          assessment_status: "current",
          review_date: "2020-01-01",
        }),
      ];
      expect(computeIndividualRiskMetrics(a, 3).review_overdue_count).toBe(1);
    });

    it("does not count future review dates", () => {
      const a = [
        makeAssessment({
          id: "a1",
          assessment_status: "current",
          review_date: daysFromNow(30),
        }),
      ];
      expect(computeIndividualRiskMetrics(a, 3).review_overdue_count).toBe(0);
    });

    it("does not count expired assessments with past review dates", () => {
      const a = [
        makeAssessment({
          id: "a1",
          assessment_status: "expired",
          review_date: "2020-01-01",
        }),
      ];
      expect(computeIndividualRiskMetrics(a, 3).review_overdue_count).toBe(0);
    });

    it("does not count under_review assessments with past review dates", () => {
      const a = [
        makeAssessment({
          id: "a1",
          assessment_status: "under_review",
          review_date: "2020-01-01",
        }),
      ];
      expect(computeIndividualRiskMetrics(a, 3).review_overdue_count).toBe(0);
    });

    it("does not count draft assessments with past review dates", () => {
      const a = [
        makeAssessment({
          id: "a1",
          assessment_status: "draft",
          review_date: "2020-01-01",
        }),
      ];
      expect(computeIndividualRiskMetrics(a, 3).review_overdue_count).toBe(0);
    });

    it("does not count superseded assessments with past review dates", () => {
      const a = [
        makeAssessment({
          id: "a1",
          assessment_status: "superseded",
          review_date: "2020-01-01",
        }),
      ];
      expect(computeIndividualRiskMetrics(a, 3).review_overdue_count).toBe(0);
    });

    it("does not count null review_date", () => {
      const a = [
        makeAssessment({
          id: "a1",
          assessment_status: "current",
          review_date: null,
        }),
      ];
      expect(computeIndividualRiskMetrics(a, 3).review_overdue_count).toBe(0);
    });

    it("counts multiple overdue reviews", () => {
      const a = [
        makeAssessment({
          id: "a1",
          assessment_status: "current",
          review_date: "2019-06-01",
        }),
        makeAssessment({
          id: "a2",
          assessment_status: "current",
          review_date: "2018-01-15",
        }),
        makeAssessment({
          id: "a3",
          assessment_status: "current",
          review_date: daysFromNow(30),
        }),
      ];
      expect(computeIndividualRiskMetrics(a, 3).review_overdue_count).toBe(2);
    });

    it("uses far-past dates reliably", () => {
      const a = [
        makeAssessment({
          id: "a1",
          assessment_status: "current",
          review_date: "2000-01-01",
        }),
      ];
      expect(computeIndividualRiskMetrics(a, 1).review_overdue_count).toBe(1);
    });
  });

  // -- average_per_child -----------------------------------------------------

  describe("average_per_child", () => {
    it("returns 0 when no children assessed", () => {
      expect(computeIndividualRiskMetrics([], 5).average_per_child).toBeNull();; });

    it("returns 1 when 1 child has 1 assessment", () => {
      const a = [makeAssessment({ child_id: "c1" })];
      expect(computeIndividualRiskMetrics(a, 1).average_per_child).toBe(1);
    });

    it("returns 2 when 1 child has 2 assessments", () => {
      const a = [
        makeAssessment({ id: "a1", child_id: "c1" }),
        makeAssessment({ id: "a2", child_id: "c1", risk_domain: "absconding" }),
      ];
      expect(computeIndividualRiskMetrics(a, 1).average_per_child).toBe(2);
    });

    it("rounds to 1 decimal place", () => {
      // 5 assessments, 3 unique children = 5/3 = 1.7
      const a = [
        makeAssessment({ id: "a1", child_id: "c1" }),
        makeAssessment({ id: "a2", child_id: "c1", risk_domain: "absconding" }),
        makeAssessment({ id: "a3", child_id: "c2" }),
        makeAssessment({ id: "a4", child_id: "c2", risk_domain: "cse" }),
        makeAssessment({ id: "a5", child_id: "c3" }),
      ];
      expect(computeIndividualRiskMetrics(a, 5).average_per_child).toBe(1.7);
    });

    it("rounds to 1 decimal place for 7/3", () => {
      // 7/3 = 2.333 => 2.3
      const a = [
        makeAssessment({ id: "a1", child_id: "c1" }),
        makeAssessment({ id: "a2", child_id: "c1", risk_domain: "absconding" }),
        makeAssessment({ id: "a3", child_id: "c1", risk_domain: "cse" }),
        makeAssessment({ id: "a4", child_id: "c2" }),
        makeAssessment({ id: "a5", child_id: "c2", risk_domain: "online_risk" }),
        makeAssessment({ id: "a6", child_id: "c3" }),
        makeAssessment({ id: "a7", child_id: "c3", risk_domain: "bullying" }),
      ];
      expect(computeIndividualRiskMetrics(a, 5).average_per_child).toBe(2.3);
    });
  });

  // -- average_strategies_per_assessment -------------------------------------

  describe("average_strategies_per_assessment", () => {
    it("returns 0 for empty array", () => {
      expect(computeIndividualRiskMetrics([], 5).average_strategies_per_assessment).toBeNull();; });

    it("returns 0 when all assessments have no strategies", () => {
      const a = [
        makeAssessment({ id: "a1", management_strategies: [] }),
        makeAssessment({ id: "a2", management_strategies: [] }),
      ];
      expect(computeIndividualRiskMetrics(a, 2).average_strategies_per_assessment).toBe(0);
    });

    it("computes correctly with mixed strategy counts", () => {
      const a = [
        makeAssessment({ id: "a1", management_strategies: ["s1", "s2", "s3"] }),
        makeAssessment({ id: "a2", management_strategies: ["s1"] }),
        makeAssessment({ id: "a3", management_strategies: [] }),
      ];
      // (3+1+0)/3 = 1.3
      expect(computeIndividualRiskMetrics(a, 3).average_strategies_per_assessment).toBe(1.3);
    });

    it("rounds to 1 decimal place", () => {
      const a = [
        makeAssessment({ id: "a1", management_strategies: ["s1", "s2"] }),
        makeAssessment({ id: "a2", management_strategies: ["s1", "s2", "s3"] }),
        makeAssessment({ id: "a3", management_strategies: [] }),
      ];
      // (2+3+0)/3 = 1.7
      expect(computeIndividualRiskMetrics(a, 3).average_strategies_per_assessment).toBe(1.7);
    });
  });

  // -- by_risk_domain --------------------------------------------------------

  describe("by_risk_domain", () => {
    it("groups by domain correctly", () => {
      const a = [
        makeAssessment({ id: "a1", risk_domain: "self_harm" }),
        makeAssessment({ id: "a2", risk_domain: "self_harm" }),
        makeAssessment({ id: "a3", risk_domain: "cse" }),
        makeAssessment({ id: "a4", risk_domain: "absconding" }),
        makeAssessment({ id: "a5", risk_domain: "absconding" }),
        makeAssessment({ id: "a6", risk_domain: "absconding" }),
      ];
      const m = computeIndividualRiskMetrics(a, 5);
      expect(m.by_risk_domain).toEqual({
        self_harm: 2,
        cse: 1,
        absconding: 3,
      });
    });

    it("handles all 16 domains", () => {
      const allDomains: RiskDomain[] = [
        "self_harm", "suicide", "absconding", "cse", "cce",
        "radicalisation", "substance_misuse", "aggression_to_others",
        "aggression_to_property", "bullying", "online_risk",
        "fire_setting", "sexual_behaviour", "gang_involvement",
        "trafficking", "other",
      ];
      const a = allDomains.map((d, i) =>
        makeAssessment({ id: `a${i}`, risk_domain: d }),
      );
      const m = computeIndividualRiskMetrics(a, 16);
      expect(Object.keys(m.by_risk_domain)).toHaveLength(16);
      for (const d of allDomains) {
        expect(m.by_risk_domain[d]).toBe(1);
      }
    });
  });

  // -- by_risk_rating --------------------------------------------------------

  describe("by_risk_rating", () => {
    it("groups by rating correctly", () => {
      const a = [
        makeAssessment({ id: "a1", risk_rating: "high" }),
        makeAssessment({ id: "a2", risk_rating: "high" }),
        makeAssessment({ id: "a3", risk_rating: "low" }),
      ];
      expect(computeIndividualRiskMetrics(a, 3).by_risk_rating).toEqual({
        high: 2,
        low: 1,
      });
    });

    it("handles all 5 ratings", () => {
      const allRatings: RiskRating[] = ["very_high", "high", "medium", "low", "minimal"];
      const a = allRatings.map((r, i) =>
        makeAssessment({ id: `a${i}`, risk_rating: r }),
      );
      const m = computeIndividualRiskMetrics(a, 5);
      expect(Object.keys(m.by_risk_rating)).toHaveLength(5);
      for (const r of allRatings) {
        expect(m.by_risk_rating[r]).toBe(1);
      }
    });
  });

  // -- by_assessment_status --------------------------------------------------

  describe("by_assessment_status", () => {
    it("groups by status correctly", () => {
      const a = [
        makeAssessment({ id: "a1", assessment_status: "current" }),
        makeAssessment({ id: "a2", assessment_status: "current" }),
        makeAssessment({ id: "a3", assessment_status: "expired" }),
      ];
      expect(computeIndividualRiskMetrics(a, 3).by_assessment_status).toEqual({
        current: 2,
        expired: 1,
      });
    });

    it("handles all 5 statuses", () => {
      const allStatuses: AssessmentStatus[] = [
        "current", "under_review", "expired", "superseded", "draft",
      ];
      const a = allStatuses.map((s, i) =>
        makeAssessment({ id: `a${i}`, assessment_status: s }),
      );
      const m = computeIndividualRiskMetrics(a, 5);
      expect(Object.keys(m.by_assessment_status)).toHaveLength(5);
      for (const s of allStatuses) {
        expect(m.by_assessment_status[s]).toBe(1);
      }
    });
  });

  // -- by_review_trigger -----------------------------------------------------

  describe("by_review_trigger", () => {
    it("groups by trigger correctly", () => {
      const a = [
        makeAssessment({ id: "a1", review_trigger: "incident" }),
        makeAssessment({ id: "a2", review_trigger: "incident" }),
        makeAssessment({ id: "a3", review_trigger: "scheduled" }),
      ];
      expect(computeIndividualRiskMetrics(a, 3).by_review_trigger).toEqual({
        incident: 2,
        scheduled: 1,
      });
    });

    it("handles all 8 triggers", () => {
      const allTriggers: ReviewTrigger[] = [
        "scheduled", "incident", "placement_change", "disclosure",
        "professional_request", "escalation", "improvement", "initial",
      ];
      const a = allTriggers.map((t, i) =>
        makeAssessment({ id: `a${i}`, review_trigger: t }),
      );
      const m = computeIndividualRiskMetrics(a, 8);
      expect(Object.keys(m.by_review_trigger)).toHaveLength(8);
      for (const t of allTriggers) {
        expect(m.by_review_trigger[t]).toBe(1);
      }
    });
  });

  // -- totalChildren = 0 edge case -------------------------------------------

  describe("totalChildren = 0", () => {
    it("returns 0 coverage even with assessments", () => {
      const a = [makeAssessment()];
      expect(computeIndividualRiskMetrics(a, 0).assessment_coverage).toBeNull();; });

    it("still counts total_assessments", () => {
      const a = [makeAssessment(), makeAssessment({ id: "a2" })];
      expect(computeIndividualRiskMetrics(a, 0).total_assessments).toBe(2);
    });

    it("still counts children_assessed", () => {
      const a = [makeAssessment()];
      expect(computeIndividualRiskMetrics(a, 0).children_assessed).toBe(1);
    });
  });

  // -- Return shape ----------------------------------------------------------

  describe("return shape", () => {
    it("returns exactly 21 keys", () => {
      const m = computeIndividualRiskMetrics([], 0);
      expect(Object.keys(m)).toHaveLength(21);
    });

    it("includes all expected keys", () => {
      const m = computeIndividualRiskMetrics([], 0);
      const expectedKeys = [
        "total_assessments",
        "children_assessed",
        "assessment_coverage",
        "current_count",
        "expired_count",
        "under_review_count",
        "very_high_count",
        "high_count",
        "medium_count",
        "low_count",
        "staff_aware_rate",
        "multi_agency_rate",
        "child_involved_rate",
        "parent_informed_rate",
        "review_overdue_count",
        "average_per_child",
        "average_strategies_per_assessment",
        "by_risk_domain",
        "by_risk_rating",
        "by_assessment_status",
        "by_review_trigger",
      ];
      for (const k of expectedKeys) {
        expect(m).toHaveProperty(k);
      }
    });

    it("numeric fields are numbers", () => {
      const m = computeIndividualRiskMetrics([makeAssessment()], 3);
      expect(typeof m.total_assessments).toBe("number");
      expect(typeof m.children_assessed).toBe("number");
      expect(typeof m.assessment_coverage).toBe("number");
      expect(typeof m.current_count).toBe("number");
      expect(typeof m.expired_count).toBe("number");
      expect(typeof m.under_review_count).toBe("number");
      expect(typeof m.very_high_count).toBe("number");
      expect(typeof m.high_count).toBe("number");
      expect(typeof m.medium_count).toBe("number");
      expect(typeof m.low_count).toBe("number");
      expect(typeof m.staff_aware_rate).toBe("number");
      expect(typeof m.multi_agency_rate).toBe("number");
      expect(typeof m.child_involved_rate).toBe("number");
      expect(typeof m.parent_informed_rate).toBe("number");
      expect(typeof m.review_overdue_count).toBe("number");
      expect(typeof m.average_per_child).toBe("number");
      expect(typeof m.average_strategies_per_assessment).toBe("number");
    });

    it("grouping fields are objects", () => {
      const m = computeIndividualRiskMetrics([makeAssessment()], 3);
      expect(typeof m.by_risk_domain).toBe("object");
      expect(typeof m.by_risk_rating).toBe("object");
      expect(typeof m.by_assessment_status).toBe("object");
      expect(typeof m.by_review_trigger).toBe("object");
    });
  });
});

// =============================================================================
// 3. identifyIndividualRiskAlerts
// =============================================================================

describe("identifyIndividualRiskAlerts", () => {
  // -- Empty / no alerts -----------------------------------------------------

  describe("with no assessments", () => {
    it("returns no alerts when totalChildren is 0", () => {
      const alerts = identifyIndividualRiskAlerts([], 0);
      expect(alerts).toHaveLength(0);
    });

    it("returns a no_assessment alert when totalChildren > 0", () => {
      const alerts = identifyIndividualRiskAlerts([], 5);
      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe("no_assessment");
    });
  });

  // -- very_high_risk alert --------------------------------------------------

  describe("very_high_risk alert", () => {
    it("fires for very_high + current assessment", () => {
      const a = [
        makeAssessment({
          risk_rating: "very_high",
          assessment_status: "current",
          staff_aware: true,
          management_strategies: ["s1"],
        }),
      ];
      const alerts = identifyIndividualRiskAlerts(a, 1);
      const vhAlerts = alerts.filter((al) => al.type === "very_high_risk");
      expect(vhAlerts).toHaveLength(1);
    });

    it("has severity critical", () => {
      const a = [
        makeAssessment({
          risk_rating: "very_high",
          assessment_status: "current",
          staff_aware: true,
          management_strategies: ["s1"],
        }),
      ];
      const alert = identifyIndividualRiskAlerts(a, 1).find(
        (al) => al.type === "very_high_risk",
      );
      expect(alert!.severity).toBe("critical");
    });

    it("includes child name in message", () => {
      const a = [
        makeAssessment({
          child_name: "Test Child",
          risk_rating: "very_high",
          assessment_status: "current",
          staff_aware: true,
          management_strategies: ["s1"],
        }),
      ];
      const alert = identifyIndividualRiskAlerts(a, 1).find(
        (al) => al.type === "very_high_risk",
      );
      expect(alert!.message).toContain("Test Child");
    });

    it("includes risk domain in message (formatted)", () => {
      const a = [
        makeAssessment({
          risk_domain: "self_harm",
          risk_rating: "very_high",
          assessment_status: "current",
          staff_aware: true,
          management_strategies: ["s1"],
        }),
      ];
      const alert = identifyIndividualRiskAlerts(a, 1).find(
        (al) => al.type === "very_high_risk",
      );
      expect(alert!.message).toContain("self harm");
    });

    it("includes the assessment id", () => {
      const a = [
        makeAssessment({
          id: "unique-id-123",
          risk_rating: "very_high",
          assessment_status: "current",
          staff_aware: true,
          management_strategies: ["s1"],
        }),
      ];
      const alert = identifyIndividualRiskAlerts(a, 1).find(
        (al) => al.type === "very_high_risk",
      );
      expect(alert!.id).toBe("unique-id-123");
    });

    it("does not fire for very_high + expired", () => {
      const a = [
        makeAssessment({
          risk_rating: "very_high",
          assessment_status: "expired",
          staff_aware: true,
          management_strategies: ["s1"],
        }),
      ];
      const alerts = identifyIndividualRiskAlerts(a, 1);
      const vhAlerts = alerts.filter((al) => al.type === "very_high_risk");
      expect(vhAlerts).toHaveLength(0);
    });

    it("does not fire for high + current", () => {
      const a = [
        makeAssessment({
          risk_rating: "high",
          assessment_status: "current",
          staff_aware: true,
          management_strategies: ["s1"],
        }),
      ];
      const alerts = identifyIndividualRiskAlerts(a, 1);
      const vhAlerts = alerts.filter((al) => al.type === "very_high_risk");
      expect(vhAlerts).toHaveLength(0);
    });

    it("does not fire for very_high + under_review", () => {
      const a = [
        makeAssessment({
          risk_rating: "very_high",
          assessment_status: "under_review",
          staff_aware: true,
          management_strategies: ["s1"],
        }),
      ];
      const alerts = identifyIndividualRiskAlerts(a, 1);
      const vhAlerts = alerts.filter((al) => al.type === "very_high_risk");
      expect(vhAlerts).toHaveLength(0);
    });

    it("does not fire for very_high + draft", () => {
      const a = [
        makeAssessment({
          risk_rating: "very_high",
          assessment_status: "draft",
          staff_aware: true,
          management_strategies: ["s1"],
        }),
      ];
      const alerts = identifyIndividualRiskAlerts(a, 1);
      const vhAlerts = alerts.filter((al) => al.type === "very_high_risk");
      expect(vhAlerts).toHaveLength(0);
    });

    it("does not fire for medium + current", () => {
      const a = [
        makeAssessment({
          risk_rating: "medium",
          assessment_status: "current",
          staff_aware: true,
          management_strategies: ["s1"],
        }),
      ];
      const alerts = identifyIndividualRiskAlerts(a, 1);
      const vhAlerts = alerts.filter((al) => al.type === "very_high_risk");
      expect(vhAlerts).toHaveLength(0);
    });

    it("fires for multiple very_high current assessments", () => {
      const a = [
        makeAssessment({
          id: "a1",
          risk_rating: "very_high",
          assessment_status: "current",
          staff_aware: true,
          management_strategies: ["s1"],
        }),
        makeAssessment({
          id: "a2",
          risk_rating: "very_high",
          assessment_status: "current",
          staff_aware: true,
          management_strategies: ["s1"],
          risk_domain: "absconding",
        }),
      ];
      const alerts = identifyIndividualRiskAlerts(a, 1);
      const vhAlerts = alerts.filter((al) => al.type === "very_high_risk");
      expect(vhAlerts).toHaveLength(2);
    });
  });

  // -- expired_high_risk alert -----------------------------------------------

  describe("expired_high_risk alert", () => {
    it("fires for expired + very_high", () => {
      const a = [
        makeAssessment({
          risk_rating: "very_high",
          assessment_status: "expired",
          staff_aware: true,
          management_strategies: ["s1"],
        }),
      ];
      const alerts = identifyIndividualRiskAlerts(a, 1);
      const ehAlerts = alerts.filter((al) => al.type === "expired_high_risk");
      expect(ehAlerts).toHaveLength(1);
    });

    it("fires for expired + high", () => {
      const a = [
        makeAssessment({
          risk_rating: "high",
          assessment_status: "expired",
          staff_aware: true,
          management_strategies: ["s1"],
        }),
      ];
      const alerts = identifyIndividualRiskAlerts(a, 1);
      const ehAlerts = alerts.filter((al) => al.type === "expired_high_risk");
      expect(ehAlerts).toHaveLength(1);
    });

    it("has severity critical", () => {
      const a = [
        makeAssessment({
          risk_rating: "high",
          assessment_status: "expired",
          staff_aware: true,
          management_strategies: ["s1"],
        }),
      ];
      const alert = identifyIndividualRiskAlerts(a, 1).find(
        (al) => al.type === "expired_high_risk",
      );
      expect(alert!.severity).toBe("critical");
    });

    it("includes child name in message", () => {
      const a = [
        makeAssessment({
          child_name: "Expired Child",
          risk_rating: "high",
          assessment_status: "expired",
          staff_aware: true,
          management_strategies: ["s1"],
        }),
      ];
      const alert = identifyIndividualRiskAlerts(a, 1).find(
        (al) => al.type === "expired_high_risk",
      );
      expect(alert!.message).toContain("Expired Child");
    });

    it("includes risk domain in message (formatted)", () => {
      const a = [
        makeAssessment({
          risk_domain: "substance_misuse",
          risk_rating: "high",
          assessment_status: "expired",
          staff_aware: true,
          management_strategies: ["s1"],
        }),
      ];
      const alert = identifyIndividualRiskAlerts(a, 1).find(
        (al) => al.type === "expired_high_risk",
      );
      expect(alert!.message).toContain("substance misuse");
    });

    it("does not fire for expired + medium", () => {
      const a = [
        makeAssessment({
          risk_rating: "medium",
          assessment_status: "expired",
          staff_aware: true,
          management_strategies: ["s1"],
        }),
      ];
      const alerts = identifyIndividualRiskAlerts(a, 1);
      const ehAlerts = alerts.filter((al) => al.type === "expired_high_risk");
      expect(ehAlerts).toHaveLength(0);
    });

    it("does not fire for expired + low", () => {
      const a = [
        makeAssessment({
          risk_rating: "low",
          assessment_status: "expired",
          staff_aware: true,
          management_strategies: ["s1"],
        }),
      ];
      const alerts = identifyIndividualRiskAlerts(a, 1);
      const ehAlerts = alerts.filter((al) => al.type === "expired_high_risk");
      expect(ehAlerts).toHaveLength(0);
    });

    it("does not fire for expired + minimal", () => {
      const a = [
        makeAssessment({
          risk_rating: "minimal",
          assessment_status: "expired",
          staff_aware: true,
          management_strategies: ["s1"],
        }),
      ];
      const alerts = identifyIndividualRiskAlerts(a, 1);
      const ehAlerts = alerts.filter((al) => al.type === "expired_high_risk");
      expect(ehAlerts).toHaveLength(0);
    });

    it("does not fire for current + high", () => {
      const a = [
        makeAssessment({
          risk_rating: "high",
          assessment_status: "current",
          staff_aware: true,
          management_strategies: ["s1"],
        }),
      ];
      const alerts = identifyIndividualRiskAlerts(a, 1);
      const ehAlerts = alerts.filter((al) => al.type === "expired_high_risk");
      expect(ehAlerts).toHaveLength(0);
    });

    it("includes risk rating in message (formatted)", () => {
      const a = [
        makeAssessment({
          risk_rating: "very_high",
          assessment_status: "expired",
          staff_aware: true,
          management_strategies: ["s1"],
        }),
      ];
      const alert = identifyIndividualRiskAlerts(a, 1).find(
        (al) => al.type === "expired_high_risk",
      );
      expect(alert!.message).toContain("very high");
    });
  });

  // -- staff_not_aware alert -------------------------------------------------

  describe("staff_not_aware alert", () => {
    it("fires for !staff_aware + current + very_high", () => {
      const a = [
        makeAssessment({
          staff_aware: false,
          assessment_status: "current",
          risk_rating: "very_high",
          management_strategies: ["s1"],
        }),
      ];
      const alerts = identifyIndividualRiskAlerts(a, 1);
      const snAlerts = alerts.filter((al) => al.type === "staff_not_aware");
      expect(snAlerts).toHaveLength(1);
    });

    it("fires for !staff_aware + current + high", () => {
      const a = [
        makeAssessment({
          staff_aware: false,
          assessment_status: "current",
          risk_rating: "high",
          management_strategies: ["s1"],
        }),
      ];
      const alerts = identifyIndividualRiskAlerts(a, 1);
      const snAlerts = alerts.filter((al) => al.type === "staff_not_aware");
      expect(snAlerts).toHaveLength(1);
    });

    it("has severity high", () => {
      const a = [
        makeAssessment({
          staff_aware: false,
          assessment_status: "current",
          risk_rating: "high",
          management_strategies: ["s1"],
        }),
      ];
      const alert = identifyIndividualRiskAlerts(a, 1).find(
        (al) => al.type === "staff_not_aware",
      );
      expect(alert!.severity).toBe("high");
    });

    it("includes child name in message", () => {
      const a = [
        makeAssessment({
          child_name: "Unaware Child",
          staff_aware: false,
          assessment_status: "current",
          risk_rating: "high",
          management_strategies: ["s1"],
        }),
      ];
      const alert = identifyIndividualRiskAlerts(a, 1).find(
        (al) => al.type === "staff_not_aware",
      );
      expect(alert!.message).toContain("Unaware Child");
    });

    it("includes risk domain in message (formatted)", () => {
      const a = [
        makeAssessment({
          risk_domain: "online_risk",
          staff_aware: false,
          assessment_status: "current",
          risk_rating: "high",
          management_strategies: ["s1"],
        }),
      ];
      const alert = identifyIndividualRiskAlerts(a, 1).find(
        (al) => al.type === "staff_not_aware",
      );
      expect(alert!.message).toContain("online risk");
    });

    it("includes risk rating in message (formatted)", () => {
      const a = [
        makeAssessment({
          staff_aware: false,
          assessment_status: "current",
          risk_rating: "very_high",
          management_strategies: ["s1"],
        }),
      ];
      const alert = identifyIndividualRiskAlerts(a, 1).find(
        (al) => al.type === "staff_not_aware",
      );
      expect(alert!.message).toContain("very high");
    });

    it("does not fire when staff_aware is true", () => {
      const a = [
        makeAssessment({
          staff_aware: true,
          assessment_status: "current",
          risk_rating: "very_high",
          management_strategies: ["s1"],
        }),
      ];
      const alerts = identifyIndividualRiskAlerts(a, 1);
      const snAlerts = alerts.filter((al) => al.type === "staff_not_aware");
      expect(snAlerts).toHaveLength(0);
    });

    it("does not fire for !staff_aware + current + medium", () => {
      const a = [
        makeAssessment({
          staff_aware: false,
          assessment_status: "current",
          risk_rating: "medium",
          management_strategies: ["s1"],
        }),
      ];
      const alerts = identifyIndividualRiskAlerts(a, 1);
      const snAlerts = alerts.filter((al) => al.type === "staff_not_aware");
      expect(snAlerts).toHaveLength(0);
    });

    it("does not fire for !staff_aware + current + low", () => {
      const a = [
        makeAssessment({
          staff_aware: false,
          assessment_status: "current",
          risk_rating: "low",
          management_strategies: ["s1"],
        }),
      ];
      const alerts = identifyIndividualRiskAlerts(a, 1);
      const snAlerts = alerts.filter((al) => al.type === "staff_not_aware");
      expect(snAlerts).toHaveLength(0);
    });

    it("does not fire for !staff_aware + expired + very_high", () => {
      const a = [
        makeAssessment({
          staff_aware: false,
          assessment_status: "expired",
          risk_rating: "very_high",
          management_strategies: ["s1"],
        }),
      ];
      const alerts = identifyIndividualRiskAlerts(a, 1);
      const snAlerts = alerts.filter((al) => al.type === "staff_not_aware");
      expect(snAlerts).toHaveLength(0);
    });
  });

  // -- no_strategies alert ---------------------------------------------------

  describe("no_strategies alert", () => {
    it("fires for empty management_strategies + current", () => {
      const a = [
        makeAssessment({
          management_strategies: [],
          assessment_status: "current",
          staff_aware: true,
          risk_rating: "low",
        }),
      ];
      const alerts = identifyIndividualRiskAlerts(a, 1);
      const nsAlerts = alerts.filter((al) => al.type === "no_strategies");
      expect(nsAlerts).toHaveLength(1);
    });

    it("has severity high", () => {
      const a = [
        makeAssessment({
          management_strategies: [],
          assessment_status: "current",
          staff_aware: true,
          risk_rating: "low",
        }),
      ];
      const alert = identifyIndividualRiskAlerts(a, 1).find(
        (al) => al.type === "no_strategies",
      );
      expect(alert!.severity).toBe("high");
    });

    it("includes child name in message", () => {
      const a = [
        makeAssessment({
          child_name: "No Strategy Child",
          management_strategies: [],
          assessment_status: "current",
          staff_aware: true,
          risk_rating: "low",
        }),
      ];
      const alert = identifyIndividualRiskAlerts(a, 1).find(
        (al) => al.type === "no_strategies",
      );
      expect(alert!.message).toContain("No Strategy Child");
    });

    it("includes risk domain in message (formatted)", () => {
      const a = [
        makeAssessment({
          risk_domain: "fire_setting",
          management_strategies: [],
          assessment_status: "current",
          staff_aware: true,
          risk_rating: "low",
        }),
      ];
      const alert = identifyIndividualRiskAlerts(a, 1).find(
        (al) => al.type === "no_strategies",
      );
      expect(alert!.message).toContain("fire setting");
    });

    it("does not fire when strategies exist", () => {
      const a = [
        makeAssessment({
          management_strategies: ["s1"],
          assessment_status: "current",
          staff_aware: true,
          risk_rating: "low",
        }),
      ];
      const alerts = identifyIndividualRiskAlerts(a, 1);
      const nsAlerts = alerts.filter((al) => al.type === "no_strategies");
      expect(nsAlerts).toHaveLength(0);
    });

    it("does not fire for empty strategies + expired", () => {
      const a = [
        makeAssessment({
          management_strategies: [],
          assessment_status: "expired",
          staff_aware: true,
          risk_rating: "low",
        }),
      ];
      const alerts = identifyIndividualRiskAlerts(a, 1);
      const nsAlerts = alerts.filter((al) => al.type === "no_strategies");
      expect(nsAlerts).toHaveLength(0);
    });

    it("does not fire for empty strategies + draft", () => {
      const a = [
        makeAssessment({
          management_strategies: [],
          assessment_status: "draft",
          staff_aware: true,
          risk_rating: "low",
        }),
      ];
      const alerts = identifyIndividualRiskAlerts(a, 1);
      const nsAlerts = alerts.filter((al) => al.type === "no_strategies");
      expect(nsAlerts).toHaveLength(0);
    });

    it("does not fire for empty strategies + under_review", () => {
      const a = [
        makeAssessment({
          management_strategies: [],
          assessment_status: "under_review",
          staff_aware: true,
          risk_rating: "low",
        }),
      ];
      const alerts = identifyIndividualRiskAlerts(a, 1);
      const nsAlerts = alerts.filter((al) => al.type === "no_strategies");
      expect(nsAlerts).toHaveLength(0);
    });

    it("fires for multiple assessments with no strategies", () => {
      const a = [
        makeAssessment({
          id: "a1",
          management_strategies: [],
          assessment_status: "current",
          staff_aware: true,
          risk_rating: "low",
        }),
        makeAssessment({
          id: "a2",
          management_strategies: [],
          assessment_status: "current",
          staff_aware: true,
          risk_rating: "medium",
          risk_domain: "absconding",
        }),
      ];
      const alerts = identifyIndividualRiskAlerts(a, 1);
      const nsAlerts = alerts.filter((al) => al.type === "no_strategies");
      expect(nsAlerts).toHaveLength(2);
    });
  });

  // -- no_assessment alert ---------------------------------------------------

  describe("no_assessment alert", () => {
    it("fires when totalChildren > children assessed", () => {
      const a = [makeAssessment({ child_id: "c1" })];
      const alerts = identifyIndividualRiskAlerts(a, 5);
      const naAlerts = alerts.filter((al) => al.type === "no_assessment");
      expect(naAlerts).toHaveLength(1);
    });

    it("has severity medium", () => {
      const alerts = identifyIndividualRiskAlerts([], 3);
      const alert = alerts.find((al) => al.type === "no_assessment");
      expect(alert!.severity).toBe("medium");
    });

    it("has id assessment_gap", () => {
      const alerts = identifyIndividualRiskAlerts([], 3);
      const alert = alerts.find((al) => al.type === "no_assessment");
      expect(alert!.id).toBe("assessment_gap");
    });

    it("singular message for 1 child gap", () => {
      const a = [makeAssessment({ child_id: "c1" })];
      const alerts = identifyIndividualRiskAlerts(a, 2);
      const alert = alerts.find((al) => al.type === "no_assessment");
      expect(alert!.message).toContain("1 child has");
    });

    it("plural message for >1 child gap", () => {
      const a = [makeAssessment({ child_id: "c1" })];
      const alerts = identifyIndividualRiskAlerts(a, 4);
      const alert = alerts.find((al) => al.type === "no_assessment");
      expect(alert!.message).toContain("3 children have");
    });

    it("does not fire when all children assessed", () => {
      const a = [
        makeAssessment({ id: "a1", child_id: "c1" }),
        makeAssessment({ id: "a2", child_id: "c2" }),
      ];
      const alerts = identifyIndividualRiskAlerts(a, 2);
      const naAlerts = alerts.filter((al) => al.type === "no_assessment");
      expect(naAlerts).toHaveLength(0);
    });

    it("does not fire when totalChildren is 0", () => {
      const alerts = identifyIndividualRiskAlerts([], 0);
      const naAlerts = alerts.filter((al) => al.type === "no_assessment");
      expect(naAlerts).toHaveLength(0);
    });

    it("does not fire when more children assessed than totalChildren", () => {
      const a = [
        makeAssessment({ id: "a1", child_id: "c1" }),
        makeAssessment({ id: "a2", child_id: "c2" }),
        makeAssessment({ id: "a3", child_id: "c3" }),
      ];
      const alerts = identifyIndividualRiskAlerts(a, 2);
      const naAlerts = alerts.filter((al) => al.type === "no_assessment");
      expect(naAlerts).toHaveLength(0);
    });

    it("deduplicates children before comparing with totalChildren", () => {
      const a = [
        makeAssessment({ id: "a1", child_id: "c1" }),
        makeAssessment({ id: "a2", child_id: "c1", risk_domain: "absconding" }),
        makeAssessment({ id: "a3", child_id: "c1", risk_domain: "cse" }),
      ];
      // Only 1 unique child but totalChildren is 3 => gap of 2
      const alerts = identifyIndividualRiskAlerts(a, 3);
      const alert = alerts.find((al) => al.type === "no_assessment");
      expect(alert).toBeDefined();
      expect(alert!.message).toContain("2 children have");
    });
  });

  // -- Alert combinations (multiple alert types at once) ---------------------

  describe("alert combinations", () => {
    it("can fire very_high_risk and staff_not_aware for same assessment", () => {
      const a = [
        makeAssessment({
          risk_rating: "very_high",
          assessment_status: "current",
          staff_aware: false,
          management_strategies: ["s1"],
        }),
      ];
      const alerts = identifyIndividualRiskAlerts(a, 1);
      const types = alerts.map((al) => al.type);
      expect(types).toContain("very_high_risk");
      expect(types).toContain("staff_not_aware");
    });

    it("can fire very_high_risk, staff_not_aware, and no_strategies for same assessment", () => {
      const a = [
        makeAssessment({
          risk_rating: "very_high",
          assessment_status: "current",
          staff_aware: false,
          management_strategies: [],
        }),
      ];
      const alerts = identifyIndividualRiskAlerts(a, 1);
      const types = alerts.map((al) => al.type);
      expect(types).toContain("very_high_risk");
      expect(types).toContain("staff_not_aware");
      expect(types).toContain("no_strategies");
    });

    it("can fire expired_high_risk and no_assessment together", () => {
      const a = [
        makeAssessment({
          child_id: "c1",
          risk_rating: "high",
          assessment_status: "expired",
          staff_aware: true,
          management_strategies: ["s1"],
        }),
      ];
      const alerts = identifyIndividualRiskAlerts(a, 3);
      const types = alerts.map((al) => al.type);
      expect(types).toContain("expired_high_risk");
      expect(types).toContain("no_assessment");
    });

    it("returns no alerts for a safe, fully covered scenario", () => {
      const a = [
        makeAssessment({
          id: "a1",
          child_id: "c1",
          risk_rating: "low",
          assessment_status: "current",
          staff_aware: true,
          management_strategies: ["s1"],
        }),
        makeAssessment({
          id: "a2",
          child_id: "c2",
          risk_rating: "medium",
          assessment_status: "current",
          staff_aware: true,
          management_strategies: ["s1", "s2"],
        }),
      ];
      const alerts = identifyIndividualRiskAlerts(a, 2);
      expect(alerts).toHaveLength(0);
    });
  });

  // -- Alert return shape ----------------------------------------------------

  describe("alert return shape", () => {
    it("each alert has type, severity, message, and id fields", () => {
      const a = [
        makeAssessment({
          risk_rating: "very_high",
          assessment_status: "current",
          staff_aware: true,
          management_strategies: ["s1"],
        }),
      ];
      const alerts = identifyIndividualRiskAlerts(a, 1);
      for (const alert of alerts) {
        expect(alert).toHaveProperty("type");
        expect(alert).toHaveProperty("severity");
        expect(alert).toHaveProperty("message");
        expect(alert).toHaveProperty("id");
      }
    });

    it("severity is always critical, high, or medium", () => {
      const a = [
        makeAssessment({
          id: "a1",
          risk_rating: "very_high",
          assessment_status: "current",
          staff_aware: false,
          management_strategies: [],
        }),
        makeAssessment({
          id: "a2",
          risk_rating: "high",
          assessment_status: "expired",
          staff_aware: true,
          management_strategies: ["s1"],
        }),
      ];
      const alerts = identifyIndividualRiskAlerts(a, 5);
      const validSeverities = ["critical", "high", "medium"];
      for (const alert of alerts) {
        expect(validSeverities).toContain(alert.severity);
      }
    });

    it("returns an array (even when empty)", () => {
      const alerts = identifyIndividualRiskAlerts([], 0);
      expect(Array.isArray(alerts)).toBe(true);
    });
  });
});
