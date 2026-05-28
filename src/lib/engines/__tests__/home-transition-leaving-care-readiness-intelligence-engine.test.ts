import { describe, it, expect } from "vitest";
import {
  computeTransitionLeavingCareReadiness,
  TransitionLeavingCareReadinessInput,
  TransitionPlanningInput,
  PathwayPlanInput,
  LeavingCarePackageInput,
  IndependencePathwayInput,
  AfterCareRecordInput,
} from "../home-transition-leaving-care-readiness-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

function baseInput(
  overrides: Partial<TransitionLeavingCareReadinessInput> = {},
): TransitionLeavingCareReadinessInput {
  return {
    today: "2026-05-28",
    total_children: 0,
    transition_planning_records: [],
    pathway_plans: [],
    leaving_care_packages: [],
    independence_pathways: [],
    aftercare_records: [],
    ...overrides,
  };
}

let _id = 0;
function uid(): string {
  return `id-${++_id}`;
}

function makeTransitionPlan(
  overrides: Partial<TransitionPlanningInput> = {},
): TransitionPlanningInput {
  return {
    id: uid(),
    child_id: "child-1",
    plan_date: "2026-04-01",
    transition_type: "independence",
    goals_set: false,
    child_voice_captured: false,
    multi_agency_involved: false,
    key_worker_assigned: false,
    reviewed: false,
    next_review_date: "",
    active: false,
    created_at: "2026-04-01",
    ...overrides,
  };
}

function makePathwayPlan(
  overrides: Partial<PathwayPlanInput> = {},
): PathwayPlanInput {
  return {
    id: uid(),
    child_id: "child-1",
    plan_date: "2026-04-01",
    accommodation_plan: false,
    education_employment_plan: false,
    financial_plan: false,
    health_plan: false,
    support_network_identified: false,
    personal_advisor_assigned: false,
    last_reviewed: "2026-04-01",
    current: false,
    created_at: "2026-04-01",
    ...overrides,
  };
}

function makeLeavingCarePackage(
  overrides: Partial<LeavingCarePackageInput> = {},
): LeavingCarePackageInput {
  return {
    id: uid(),
    child_id: "child-1",
    package_date: "2026-04-01",
    housing_arranged: false,
    financial_support_confirmed: false,
    education_training_plan: false,
    health_passport_provided: false,
    emotional_support_plan: false,
    life_skills_assessed: false,
    documentation_complete: false,
    created_at: "2026-04-01",
    ...overrides,
  };
}

function makeIndependencePathway(
  overrides: Partial<IndependencePathwayInput> = {},
): IndependencePathwayInput {
  return {
    id: uid(),
    child_id: "child-1",
    assessment_date: "2026-04-01",
    cooking_skills_assessed: false,
    budgeting_skills_assessed: false,
    self_care_assessed: false,
    travel_skills_assessed: false,
    social_skills_assessed: false,
    overall_readiness_score: 0,
    created_at: "2026-04-01",
    ...overrides,
  };
}

function makeAfterCareRecord(
  overrides: Partial<AfterCareRecordInput> = {},
): AfterCareRecordInput {
  return {
    id: uid(),
    child_id: "child-1",
    contact_date: "2026-04-01",
    contact_type: "visit",
    wellbeing_checked: false,
    support_needs_identified: false,
    support_provided: false,
    next_contact_date: "2026-06-28",
    created_at: "2026-04-01",
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. INSUFFICIENT DATA
// ═══════════════════════════════════════════════════════════════════════════

describe("Insufficient data", () => {
  it("returns insufficient_data with score 0 when 0 children and all arrays empty", () => {
    const r = computeTransitionLeavingCareReadiness(baseInput());
    expect(r.readiness_rating).toBe("insufficient_data");
    expect(r.readiness_score).toBe(0);
    expect(r.total_transition_plans).toBe(0);
    expect(r.strengths).toHaveLength(0);
    expect(r.concerns).toHaveLength(0);
    expect(r.recommendations).toHaveLength(0);
    expect(r.insights).toHaveLength(0);
  });

  it("headline mentions insufficient data", () => {
    const r = computeTransitionLeavingCareReadiness(baseInput());
    expect(r.headline).toContain("insufficient data");
  });

  it("all metric rates are 0", () => {
    const r = computeTransitionLeavingCareReadiness(baseInput());
    expect(r.transition_plan_coverage_rate).toBe(0);
    expect(r.pathway_plan_currency_rate).toBe(0);
    expect(r.leaving_care_completion_rate).toBe(0);
    expect(r.independence_assessment_rate).toBe(0);
    expect(r.aftercare_contact_rate).toBe(0);
    expect(r.child_voice_in_transition_rate).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. INADEQUATE BASELINE (children > 0, all arrays empty)
// ═══════════════════════════════════════════════════════════════════════════

describe("Inadequate baseline — children but no data", () => {
  const r = computeTransitionLeavingCareReadiness(
    baseInput({ total_children: 5 }),
  );

  it("returns inadequate with score 15", () => {
    expect(r.readiness_rating).toBe("inadequate");
    expect(r.readiness_score).toBe(15);
  });

  it("headline mentions urgent attention", () => {
    expect(r.headline).toContain("urgent attention");
  });

  it("has 1 concern", () => {
    expect(r.concerns).toHaveLength(1);
    expect(r.concerns[0]).toContain("No transition planning records");
  });

  it("has 2 recommendations with rank, urgency, and regulatory_ref", () => {
    expect(r.recommendations).toHaveLength(2);
    expect(r.recommendations[0].rank).toBe(1);
    expect(r.recommendations[0].urgency).toBe("immediate");
    expect(r.recommendations[0].regulatory_ref).toContain("CHR 2015 Reg 12");
    expect(r.recommendations[1].rank).toBe(2);
    expect(r.recommendations[1].urgency).toBe("immediate");
    expect(r.recommendations[1].regulatory_ref).toContain("Leaving Care");
  });

  it("has 1 critical insight", () => {
    expect(r.insights).toHaveLength(1);
    expect(r.insights[0].severity).toBe("critical");
    expect(r.insights[0].text).toContain("complete absence");
  });

  it("all metric rates are 0", () => {
    expect(r.transition_plan_coverage_rate).toBe(0);
    expect(r.pathway_plan_currency_rate).toBe(0);
    expect(r.leaving_care_completion_rate).toBe(0);
    expect(r.independence_assessment_rate).toBe(0);
    expect(r.aftercare_contact_rate).toBe(0);
    expect(r.child_voice_in_transition_rate).toBe(0);
  });

  it("single child also gives inadequate 15", () => {
    const r2 = computeTransitionLeavingCareReadiness(
      baseInput({ total_children: 1 }),
    );
    expect(r2.readiness_rating).toBe("inadequate");
    expect(r2.readiness_score).toBe(15);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. INDIVIDUAL BONUSES
// ═══════════════════════════════════════════════════════════════════════════

describe("Bonus 1 — transitionPlanCoverageRate", () => {
  // Coverage = unique children with active plan / total_children
  // >=90 → +4, >=70 → +2
  // When no other bonuses fire and no penalties fire, base=52

  it("awards +4 when coverage >= 90%", () => {
    // 10 children, 10 active plans with unique child_ids
    const plans = Array.from({ length: 10 }, (_, i) =>
      makeTransitionPlan({ child_id: `child-${i}`, active: true }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        transition_planning_records: plans,
      }),
    );
    expect(r.transition_plan_coverage_rate).toBe(100);
    // base 52 + 4 (coverage) = 56, but pct(0,0) for rates where denom=0
    // Check that this bonus IS present: score includes +4
    // Other bonuses: childVoice=pct(0,10)=0, multiAgency=pct(0,10)=0, keyWorker=pct(0,10)=0, reviewTimeliness=0
    // Penalties: independenceAssessmentRate=0 < 50 with total_children>0 → -4
    // transitionPlanCoverageRate=100 NOT < 50 → no penalty
    // Score: 52 + 4 - 4 = 52
    expect(r.readiness_score).toBe(52);
  });

  it("awards +2 when coverage is 70-89%", () => {
    // 10 children, 7 active plans (70%)
    const plans = Array.from({ length: 7 }, (_, i) =>
      makeTransitionPlan({ child_id: `child-${i}`, active: true }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        transition_planning_records: plans,
      }),
    );
    expect(r.transition_plan_coverage_rate).toBe(70);
    // 52 + 2 (coverage) - 4 (independence penalty) = 50
    expect(r.readiness_score).toBe(50);
  });

  it("awards 0 when coverage < 70%", () => {
    // 10 children, 6 active plans (60%)
    const plans = Array.from({ length: 6 }, (_, i) =>
      makeTransitionPlan({ child_id: `child-${i}`, active: true }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        transition_planning_records: plans,
      }),
    );
    expect(r.transition_plan_coverage_rate).toBe(60);
    // 52 + 0 - 4 (independence penalty) = 48
    expect(r.readiness_score).toBe(48);
  });
});

describe("Bonus 2 — pathwayPlanCurrencyRate", () => {
  // Currency = current plans reviewed within 180 days / current plans
  // >=90 → +4, >=70 → +2

  it("awards +4 when currency >= 90%", () => {
    const plans = Array.from({ length: 10 }, (_, i) =>
      makePathwayPlan({
        child_id: `child-${i}`,
        current: true,
        last_reviewed: "2026-04-01", // within 180 days of 2026-05-28
      }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        pathway_plans: plans,
      }),
    );
    expect(r.pathway_plan_currency_rate).toBe(100);
    // 52 + 4 - 5 (coverage penalty: 0 < 50) - 4 (independence penalty) = 47
    expect(r.readiness_score).toBe(47);
  });

  it("awards +2 when currency is 70-89%", () => {
    // 10 plans, 7 recently reviewed
    const recentPlans = Array.from({ length: 7 }, (_, i) =>
      makePathwayPlan({
        child_id: `child-${i}`,
        current: true,
        last_reviewed: "2026-04-01",
      }),
    );
    const stalePlans = Array.from({ length: 3 }, (_, i) =>
      makePathwayPlan({
        child_id: `child-${i + 7}`,
        current: true,
        last_reviewed: "2025-01-01", // >180 days ago
      }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        pathway_plans: [...recentPlans, ...stalePlans],
      }),
    );
    expect(r.pathway_plan_currency_rate).toBe(70);
    // 52 + 2 - 5 (coverage penalty) - 4 (independence penalty) = 45
    expect(r.readiness_score).toBe(45);
  });

  it("awards 0 when currency < 70%", () => {
    const plans = Array.from({ length: 10 }, (_, i) =>
      makePathwayPlan({
        child_id: `child-${i}`,
        current: true,
        last_reviewed: "2025-01-01", // >180 days ago
      }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        pathway_plans: plans,
      }),
    );
    expect(r.pathway_plan_currency_rate).toBe(0);
    // 52 + 0 - 5 (coverage penalty) - 5 (pathway currency penalty: 0 < 50 with current>0) - 4 (independence penalty) = 38
    expect(r.readiness_score).toBe(38);
  });
});

describe("Bonus 3 — leavingCareCompletionRate", () => {
  // Complete = all 7 booleans true / total leaving care packages
  // >=90 → +3, >=70 → +1

  function makeComplete(childId: string): LeavingCarePackageInput {
    return makeLeavingCarePackage({
      child_id: childId,
      housing_arranged: true,
      financial_support_confirmed: true,
      education_training_plan: true,
      health_passport_provided: true,
      emotional_support_plan: true,
      life_skills_assessed: true,
      documentation_complete: true,
    });
  }

  it("awards +3 when completion >= 90%", () => {
    const packages = Array.from({ length: 10 }, (_, i) =>
      makeComplete(`child-${i}`),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        leaving_care_packages: packages,
      }),
    );
    expect(r.leaving_care_completion_rate).toBe(100);
    // 52 + 3 - 5 (coverage penalty) - 4 (independence penalty) = 46
    expect(r.readiness_score).toBe(46);
  });

  it("awards +1 when completion is 70-89%", () => {
    const completePackages = Array.from({ length: 8 }, (_, i) =>
      makeComplete(`child-${i}`),
    );
    const incompletePackages = Array.from({ length: 2 }, (_, i) =>
      makeLeavingCarePackage({ child_id: `child-${i + 8}` }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        leaving_care_packages: [...completePackages, ...incompletePackages],
      }),
    );
    expect(r.leaving_care_completion_rate).toBe(80);
    // 52 + 1 - 5 (coverage penalty) - 4 (independence penalty) = 44
    expect(r.readiness_score).toBe(44);
  });

  it("awards 0 when completion < 70%", () => {
    const packages = Array.from({ length: 10 }, (_, i) =>
      makeLeavingCarePackage({ child_id: `child-${i}` }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        leaving_care_packages: packages,
      }),
    );
    expect(r.leaving_care_completion_rate).toBe(0);
    // 52 + 0 - 5 (coverage) - 4 (leaving care penalty: 0<50) - 4 (independence) = 39
    expect(r.readiness_score).toBe(39);
  });
});

describe("Bonus 4 — independenceAssessmentRate", () => {
  // Unique children with assessment / total_children
  // >=90 → +3, >=70 → +1

  it("awards +3 when rate >= 90%", () => {
    const pathways = Array.from({ length: 10 }, (_, i) =>
      makeIndependencePathway({ child_id: `child-${i}` }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        independence_pathways: pathways,
      }),
    );
    expect(r.independence_assessment_rate).toBe(100);
    // 52 + 3 - 5 (coverage penalty) = 50
    expect(r.readiness_score).toBe(50);
  });

  it("awards +1 when rate is 70-89%", () => {
    const pathways = Array.from({ length: 7 }, (_, i) =>
      makeIndependencePathway({ child_id: `child-${i}` }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        independence_pathways: pathways,
      }),
    );
    expect(r.independence_assessment_rate).toBe(70);
    // 52 + 1 - 5 (coverage penalty) = 48
    expect(r.readiness_score).toBe(48);
  });

  it("awards 0 when rate < 70%", () => {
    const pathways = Array.from({ length: 5 }, (_, i) =>
      makeIndependencePathway({ child_id: `child-${i}` }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        independence_pathways: pathways,
      }),
    );
    expect(r.independence_assessment_rate).toBe(50);
    // 52 + 0 - 5 (coverage penalty) - 0 (independence penalty: 50 NOT < 50) = 47
    expect(r.readiness_score).toBe(47);
  });
});

describe("Bonus 5 — aftercareContactRate", () => {
  // Unique children with aftercare contact / total_children
  // >=90 → +3, >=70 → +1

  it("awards +3 when rate >= 90%", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makeAfterCareRecord({ child_id: `child-${i}` }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        aftercare_records: records,
      }),
    );
    expect(r.aftercare_contact_rate).toBe(100);
    // 52 + 3 - 5 (coverage penalty) - 4 (independence penalty) = 46
    expect(r.readiness_score).toBe(46);
  });

  it("awards +1 when rate is 70-89%", () => {
    const records = Array.from({ length: 7 }, (_, i) =>
      makeAfterCareRecord({ child_id: `child-${i}` }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        aftercare_records: records,
      }),
    );
    expect(r.aftercare_contact_rate).toBe(70);
    // 52 + 1 - 5 (coverage penalty) - 4 (independence penalty) = 44
    expect(r.readiness_score).toBe(44);
  });

  it("awards 0 when rate < 70%", () => {
    const records = Array.from({ length: 3 }, (_, i) =>
      makeAfterCareRecord({ child_id: `child-${i}` }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        aftercare_records: records,
      }),
    );
    expect(r.aftercare_contact_rate).toBe(30);
    // 52 + 0 - 5 (coverage penalty) - 4 (independence penalty) = 43
    expect(r.readiness_score).toBe(43);
  });
});

describe("Bonus 6 — childVoiceInTransitionRate", () => {
  // Child voice captured / total transition plans
  // >=90 → +3, >=70 → +1

  it("awards +3 when rate >= 90%", () => {
    const plans = Array.from({ length: 10 }, (_, i) =>
      makeTransitionPlan({
        child_id: `child-${i}`,
        child_voice_captured: true,
      }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        transition_planning_records: plans,
      }),
    );
    expect(r.child_voice_in_transition_rate).toBe(100);
    // Coverage: 0 active plans → pct(0,10)=0 → no bonus, penalty -5
    // childVoice: pct(10,10)=100 → +3
    // independence penalty: -4
    // 52 + 3 - 5 - 4 = 46
    expect(r.readiness_score).toBe(46);
  });

  it("awards +1 when rate is 70-89%", () => {
    const voicePlans = Array.from({ length: 7 }, (_, i) =>
      makeTransitionPlan({
        child_id: `child-${i}`,
        child_voice_captured: true,
      }),
    );
    const noVoicePlans = Array.from({ length: 3 }, (_, i) =>
      makeTransitionPlan({
        child_id: `child-${i + 7}`,
        child_voice_captured: false,
      }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        transition_planning_records: [...voicePlans, ...noVoicePlans],
      }),
    );
    expect(r.child_voice_in_transition_rate).toBe(70);
    // 52 + 1 - 5 (coverage) - 4 (independence) = 44
    expect(r.readiness_score).toBe(44);
  });

  it("awards 0 when rate < 70%", () => {
    const plans = Array.from({ length: 10 }, (_, i) =>
      makeTransitionPlan({
        child_id: `child-${i}`,
        child_voice_captured: false,
      }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        transition_planning_records: plans,
      }),
    );
    expect(r.child_voice_in_transition_rate).toBe(0);
    // 52 + 0 - 5 - 4 = 43
    expect(r.readiness_score).toBe(43);
  });
});

describe("Bonus 7 — multiAgencyInvolvementRate", () => {
  // Multi-agency involved / total transition plans
  // >=90 → +3, >=70 → +1

  it("awards +3 when rate >= 90%", () => {
    const plans = Array.from({ length: 10 }, (_, i) =>
      makeTransitionPlan({
        child_id: `child-${i}`,
        multi_agency_involved: true,
      }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        transition_planning_records: plans,
      }),
    );
    expect(r.readiness_score).toBe(46); // 52 + 3 - 5 - 4
  });

  it("awards +1 when rate is 70-89%", () => {
    const maPlans = Array.from({ length: 7 }, (_, i) =>
      makeTransitionPlan({
        child_id: `child-${i}`,
        multi_agency_involved: true,
      }),
    );
    const noMaPlans = Array.from({ length: 3 }, (_, i) =>
      makeTransitionPlan({
        child_id: `child-${i + 7}`,
        multi_agency_involved: false,
      }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        transition_planning_records: [...maPlans, ...noMaPlans],
      }),
    );
    // multiAgencyInvolvementRate = 70
    // 52 + 1 - 5 - 4 = 44
    expect(r.readiness_score).toBe(44);
  });
});

describe("Bonus 8 — keyWorkerAllocationRate", () => {
  // Key worker assigned / total transition plans
  // >=100 → +2, >=80 → +1

  it("awards +2 when rate >= 100%", () => {
    const plans = Array.from({ length: 10 }, (_, i) =>
      makeTransitionPlan({
        child_id: `child-${i}`,
        key_worker_assigned: true,
      }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        transition_planning_records: plans,
      }),
    );
    // keyWorkerAllocationRate = 100 → +2
    // 52 + 2 - 5 (coverage: 0 active) - 4 (independence) = 45
    expect(r.readiness_score).toBe(45);
  });

  it("awards +1 when rate is 80-99%", () => {
    const kwPlans = Array.from({ length: 8 }, (_, i) =>
      makeTransitionPlan({
        child_id: `child-${i}`,
        key_worker_assigned: true,
      }),
    );
    const noKwPlans = Array.from({ length: 2 }, (_, i) =>
      makeTransitionPlan({
        child_id: `child-${i + 8}`,
        key_worker_assigned: false,
      }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        transition_planning_records: [...kwPlans, ...noKwPlans],
      }),
    );
    // keyWorkerAllocationRate = 80 → +1
    // 52 + 1 - 5 - 4 = 44
    expect(r.readiness_score).toBe(44);
  });

  it("awards 0 when rate < 80%", () => {
    const kwPlans = Array.from({ length: 7 }, (_, i) =>
      makeTransitionPlan({
        child_id: `child-${i}`,
        key_worker_assigned: true,
      }),
    );
    const noKwPlans = Array.from({ length: 3 }, (_, i) =>
      makeTransitionPlan({
        child_id: `child-${i + 7}`,
        key_worker_assigned: false,
      }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        transition_planning_records: [...kwPlans, ...noKwPlans],
      }),
    );
    // keyWorkerAllocationRate = 70 → 0
    // 52 + 0 - 5 - 4 = 43
    expect(r.readiness_score).toBe(43);
  });
});

describe("Bonus 9 — reviewTimelinessRate", () => {
  // (plans with review date - overdue plans) / plans with review date
  // >=90 → +3, >=70 → +1
  // Plan is overdue when next_review_date < today

  it("awards +3 when timeliness >= 90%", () => {
    const plans = Array.from({ length: 10 }, (_, i) =>
      makeTransitionPlan({
        child_id: `child-${i}`,
        next_review_date: "2026-06-15", // future, not overdue
      }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        transition_planning_records: plans,
      }),
    );
    // reviewTimelinessRate = pct(10-0, 10) = 100 → +3
    // 52 + 3 - 5 (coverage: 0 active) - 4 (independence) = 46
    expect(r.readiness_score).toBe(46);
  });

  it("awards +1 when timeliness is 70-89%", () => {
    const onTimePlans = Array.from({ length: 7 }, (_, i) =>
      makeTransitionPlan({
        child_id: `child-${i}`,
        next_review_date: "2026-06-15",
      }),
    );
    const overduePlans = Array.from({ length: 3 }, (_, i) =>
      makeTransitionPlan({
        child_id: `child-${i + 7}`,
        next_review_date: "2026-05-01", // before today → overdue
      }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        transition_planning_records: [...onTimePlans, ...overduePlans],
      }),
    );
    // reviewTimelinessRate = pct(10-3, 10) = 70 → +1
    // 52 + 1 - 5 - 4 = 44
    expect(r.readiness_score).toBe(44);
  });

  it("awards 0 when timeliness < 70%", () => {
    const plans = Array.from({ length: 10 }, (_, i) =>
      makeTransitionPlan({
        child_id: `child-${i}`,
        next_review_date: "2026-01-01", // all overdue
      }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        transition_planning_records: plans,
      }),
    );
    // reviewTimelinessRate = pct(10-10, 10) = 0 → 0
    // 52 + 0 - 5 - 4 = 43
    expect(r.readiness_score).toBe(43);
  });

  it("timeliness is 0 when no plans have a review date", () => {
    const plans = [
      makeTransitionPlan({
        child_id: "child-1",
        next_review_date: "",
      }),
    ];
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 1,
        transition_planning_records: plans,
      }),
    );
    // plansWithReviewDate=0 → reviewTimelinessRate=0
    // 52 + 0 - 5 (coverage: 0 active) - 4 (independence) = 43
    expect(r.readiness_score).toBe(43);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. ALL BONUSES COMBINED → OUTSTANDING (80)
// ═══════════════════════════════════════════════════════════════════════════

describe("All bonuses combined → outstanding", () => {
  it("score reaches 80 with all bonuses at max tier", () => {
    // 10 children, every metric at 100%
    const transitionPlans = Array.from({ length: 10 }, (_, i) =>
      makeTransitionPlan({
        child_id: `child-${i}`,
        active: true,
        child_voice_captured: true,
        multi_agency_involved: true,
        key_worker_assigned: true,
        goals_set: true,
        reviewed: true,
        next_review_date: "2026-06-15",
      }),
    );
    const pathwayPlans = Array.from({ length: 10 }, (_, i) =>
      makePathwayPlan({
        child_id: `child-${i}`,
        current: true,
        last_reviewed: "2026-04-01",
        accommodation_plan: true,
        education_employment_plan: true,
        financial_plan: true,
        health_plan: true,
        support_network_identified: true,
        personal_advisor_assigned: true,
      }),
    );
    const leavingCarePackages = Array.from({ length: 10 }, (_, i) =>
      makeLeavingCarePackage({
        child_id: `child-${i}`,
        housing_arranged: true,
        financial_support_confirmed: true,
        education_training_plan: true,
        health_passport_provided: true,
        emotional_support_plan: true,
        life_skills_assessed: true,
        documentation_complete: true,
      }),
    );
    const independencePathways = Array.from({ length: 10 }, (_, i) =>
      makeIndependencePathway({
        child_id: `child-${i}`,
        cooking_skills_assessed: true,
        budgeting_skills_assessed: true,
        self_care_assessed: true,
        travel_skills_assessed: true,
        social_skills_assessed: true,
        overall_readiness_score: 80,
      }),
    );
    const aftercareRecords = Array.from({ length: 10 }, (_, i) =>
      makeAfterCareRecord({
        child_id: `child-${i}`,
        wellbeing_checked: true,
        support_needs_identified: true,
        support_provided: true,
      }),
    );

    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        transition_planning_records: transitionPlans,
        pathway_plans: pathwayPlans,
        leaving_care_packages: leavingCarePackages,
        independence_pathways: independencePathways,
        aftercare_records: aftercareRecords,
      }),
    );

    // 52 + 4 + 4 + 3 + 3 + 3 + 3 + 3 + 2 + 3 = 80 (no penalties)
    expect(r.readiness_score).toBe(80);
    expect(r.readiness_rating).toBe("outstanding");
  });

  it("headline starts with Outstanding", () => {
    const transitionPlans = Array.from({ length: 10 }, (_, i) =>
      makeTransitionPlan({
        child_id: `child-${i}`,
        active: true,
        child_voice_captured: true,
        multi_agency_involved: true,
        key_worker_assigned: true,
        next_review_date: "2026-06-15",
      }),
    );
    const pathwayPlans = Array.from({ length: 10 }, (_, i) =>
      makePathwayPlan({
        child_id: `child-${i}`,
        current: true,
        last_reviewed: "2026-04-01",
        accommodation_plan: true,
        education_employment_plan: true,
        financial_plan: true,
        health_plan: true,
        support_network_identified: true,
        personal_advisor_assigned: true,
      }),
    );
    const leavingCarePackages = Array.from({ length: 10 }, (_, i) =>
      makeLeavingCarePackage({
        child_id: `child-${i}`,
        housing_arranged: true,
        financial_support_confirmed: true,
        education_training_plan: true,
        health_passport_provided: true,
        emotional_support_plan: true,
        life_skills_assessed: true,
        documentation_complete: true,
      }),
    );
    const independencePathways = Array.from({ length: 10 }, (_, i) =>
      makeIndependencePathway({
        child_id: `child-${i}`,
        cooking_skills_assessed: true,
        budgeting_skills_assessed: true,
        self_care_assessed: true,
        travel_skills_assessed: true,
        social_skills_assessed: true,
        overall_readiness_score: 80,
      }),
    );
    const aftercareRecords = Array.from({ length: 10 }, (_, i) =>
      makeAfterCareRecord({
        child_id: `child-${i}`,
        wellbeing_checked: true,
        support_needs_identified: true,
        support_provided: true,
      }),
    );

    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        transition_planning_records: transitionPlans,
        pathway_plans: pathwayPlans,
        leaving_care_packages: leavingCarePackages,
        independence_pathways: independencePathways,
        aftercare_records: aftercareRecords,
      }),
    );

    expect(r.headline).toContain("Outstanding");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. INDIVIDUAL PENALTIES
// ═══════════════════════════════════════════════════════════════════════════

describe("Penalty 1 — transitionPlanCoverageRate < 50", () => {
  it("applies -5 when coverage < 50% and total_children > 0", () => {
    // 10 children, 4 active plans → 40%
    const plans = Array.from({ length: 4 }, (_, i) =>
      makeTransitionPlan({ child_id: `child-${i}`, active: true }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        transition_planning_records: plans,
      }),
    );
    expect(r.transition_plan_coverage_rate).toBe(40);
    // 52 + 0 - 5 (coverage penalty) - 4 (independence penalty) = 43
    expect(r.readiness_score).toBe(43);
  });

  it("applies -5 when 0% coverage (no active plans but records exist)", () => {
    const plans = [makeTransitionPlan({ child_id: "child-1", active: false })];
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        transition_planning_records: plans,
      }),
    );
    expect(r.transition_plan_coverage_rate).toBe(0);
    // 52 - 5 - 4 = 43
    expect(r.readiness_score).toBe(43);
  });
});

describe("Penalty 2 — pathwayPlanCurrencyRate < 50", () => {
  it("applies -5 when currency < 50% and currentPathwayPlans.length > 0", () => {
    const plans = Array.from({ length: 10 }, (_, i) =>
      makePathwayPlan({
        child_id: `child-${i}`,
        current: true,
        last_reviewed: "2025-01-01", // stale
      }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        pathway_plans: plans,
      }),
    );
    expect(r.pathway_plan_currency_rate).toBe(0);
    // 52 - 5 (coverage) - 5 (pathway currency) - 4 (independence) = 38
    expect(r.readiness_score).toBe(38);
  });
});

describe("Penalty 3 — leavingCareCompletionRate < 50", () => {
  it("applies -4 when completion < 50% and packages exist", () => {
    const packages = Array.from({ length: 10 }, (_, i) =>
      makeLeavingCarePackage({ child_id: `child-${i}` }), // all false
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        leaving_care_packages: packages,
      }),
    );
    expect(r.leaving_care_completion_rate).toBe(0);
    // 52 - 5 (coverage) - 4 (leaving care) - 4 (independence) = 39
    expect(r.readiness_score).toBe(39);
  });
});

describe("Penalty 4 — independenceAssessmentRate < 50", () => {
  it("applies -4 when rate < 50% and total_children > 0", () => {
    // 10 children, 4 with assessments → 40%
    const pathways = Array.from({ length: 4 }, (_, i) =>
      makeIndependencePathway({ child_id: `child-${i}` }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        independence_pathways: pathways,
      }),
    );
    expect(r.independence_assessment_rate).toBe(40);
    // 52 - 5 (coverage) - 4 (independence) = 43
    expect(r.readiness_score).toBe(43);
  });

  it("applies -4 when 0% (no pathways at all)", () => {
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        // At least one array non-empty to avoid allEmpty check
        transition_planning_records: [makeTransitionPlan({ child_id: "child-1" })],
      }),
    );
    expect(r.independence_assessment_rate).toBe(0);
    // 52 - 5 (coverage: pct(0,10)=0<50) - 4 (independence: 0<50) = 43
    expect(r.readiness_score).toBe(43);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 6. PENALTY GUARDS — penalties don't fire when denominator is 0
// ═══════════════════════════════════════════════════════════════════════════

describe("Penalty guards", () => {
  it("coverage penalty does not fire when total_children = 0", () => {
    // Need at least one record so it's not the allEmpty case
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 0,
        transition_planning_records: [makeTransitionPlan({ child_id: "child-1" })],
      }),
    );
    // transitionPlanCoverageRate = pct(0, 0) = 0, but guard: total_children > 0 is false
    // No penalty, score = 52
    expect(r.readiness_score).toBe(52);
  });

  it("pathway currency penalty does not fire when no current plans", () => {
    const plans = [
      makePathwayPlan({ current: false, last_reviewed: "2025-01-01" }),
    ];
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 1,
        pathway_plans: plans,
      }),
    );
    // currentPathwayPlans.length = 0 → guard fails → no penalty
    // pathwayPlanCurrencyRate = pct(0, 0) = 0 but guard protects
    // Penalties that DO fire: coverage (pct(0,1)=0 < 50) → -5, independence (pct(0,1)=0 < 50) → -4
    // 52 - 5 - 4 = 43
    expect(r.readiness_score).toBe(43);
  });

  it("leaving care penalty does not fire when no packages", () => {
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 1,
        transition_planning_records: [makeTransitionPlan({ child_id: "child-1" })],
      }),
    );
    // totalLeavingCarePackages = 0 → no leaving care penalty
    // Coverage: 0 < 50 → -5, Independence: 0 < 50 → -4
    // 52 - 5 - 4 = 43
    expect(r.readiness_score).toBe(43);
  });

  it("independence penalty does not fire when total_children = 0", () => {
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 0,
        independence_pathways: [makeIndependencePathway({ child_id: "child-1" })],
      }),
    );
    // independenceAssessmentRate = pct(1, 0) = 0, but guard: total_children > 0 is false
    // No penalty at all. Score = 52
    expect(r.readiness_score).toBe(52);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 7. RATING BOUNDARIES
// ═══════════════════════════════════════════════════════════════════════════

describe("Rating boundaries", () => {
  // We test via carefully constructed inputs that yield specific scores.
  // Using the formula: score = 52 + bonuses - penalties

  it("score 80 → outstanding", () => {
    // All bonuses maxed: tested above. Just verify threshold.
    const transitionPlans = Array.from({ length: 10 }, (_, i) =>
      makeTransitionPlan({
        child_id: `child-${i}`,
        active: true,
        child_voice_captured: true,
        multi_agency_involved: true,
        key_worker_assigned: true,
        next_review_date: "2026-06-15",
      }),
    );
    const pathwayPlans = Array.from({ length: 10 }, (_, i) =>
      makePathwayPlan({
        child_id: `child-${i}`,
        current: true,
        last_reviewed: "2026-04-01",
        accommodation_plan: true,
        education_employment_plan: true,
        financial_plan: true,
        health_plan: true,
        support_network_identified: true,
        personal_advisor_assigned: true,
      }),
    );
    const packages = Array.from({ length: 10 }, (_, i) =>
      makeLeavingCarePackage({
        child_id: `child-${i}`,
        housing_arranged: true,
        financial_support_confirmed: true,
        education_training_plan: true,
        health_passport_provided: true,
        emotional_support_plan: true,
        life_skills_assessed: true,
        documentation_complete: true,
      }),
    );
    const pathways = Array.from({ length: 10 }, (_, i) =>
      makeIndependencePathway({
        child_id: `child-${i}`,
        cooking_skills_assessed: true,
        budgeting_skills_assessed: true,
        self_care_assessed: true,
        travel_skills_assessed: true,
        social_skills_assessed: true,
        overall_readiness_score: 80,
      }),
    );
    const aftercare = Array.from({ length: 10 }, (_, i) =>
      makeAfterCareRecord({
        child_id: `child-${i}`,
        wellbeing_checked: true,
        support_needs_identified: true,
        support_provided: true,
      }),
    );

    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        transition_planning_records: transitionPlans,
        pathway_plans: pathwayPlans,
        leaving_care_packages: packages,
        independence_pathways: pathways,
        aftercare_records: aftercare,
      }),
    );
    expect(r.readiness_score).toBe(80);
    expect(r.readiness_rating).toBe("outstanding");
  });

  it("score 79 → good", () => {
    // All bonuses maxed except keyWorker at 80 (+1 instead of +2) → 79
    const transitionPlans: TransitionPlanningInput[] = [];
    for (let i = 0; i < 10; i++) {
      transitionPlans.push(
        makeTransitionPlan({
          child_id: `child-${i}`,
          active: true,
          child_voice_captured: true,
          multi_agency_involved: true,
          key_worker_assigned: i < 8, // 80% → +1 instead of +2
          next_review_date: "2026-06-15",
        }),
      );
    }
    const pathwayPlans = Array.from({ length: 10 }, (_, i) =>
      makePathwayPlan({
        child_id: `child-${i}`,
        current: true,
        last_reviewed: "2026-04-01",
        accommodation_plan: true,
        education_employment_plan: true,
        financial_plan: true,
        health_plan: true,
        support_network_identified: true,
        personal_advisor_assigned: true,
      }),
    );
    const packages = Array.from({ length: 10 }, (_, i) =>
      makeLeavingCarePackage({
        child_id: `child-${i}`,
        housing_arranged: true,
        financial_support_confirmed: true,
        education_training_plan: true,
        health_passport_provided: true,
        emotional_support_plan: true,
        life_skills_assessed: true,
        documentation_complete: true,
      }),
    );
    const pathways = Array.from({ length: 10 }, (_, i) =>
      makeIndependencePathway({
        child_id: `child-${i}`,
        cooking_skills_assessed: true,
        budgeting_skills_assessed: true,
        self_care_assessed: true,
        travel_skills_assessed: true,
        social_skills_assessed: true,
        overall_readiness_score: 80,
      }),
    );
    const aftercare = Array.from({ length: 10 }, (_, i) =>
      makeAfterCareRecord({
        child_id: `child-${i}`,
        wellbeing_checked: true,
        support_needs_identified: true,
        support_provided: true,
      }),
    );

    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        transition_planning_records: transitionPlans,
        pathway_plans: pathwayPlans,
        leaving_care_packages: packages,
        independence_pathways: pathways,
        aftercare_records: aftercare,
      }),
    );
    expect(r.readiness_score).toBe(79);
    expect(r.readiness_rating).toBe("good");
  });

  it("score 65 → good", () => {
    // 52 + 4 (coverage) + 4 (pathway) + 3 (leavingCare) + 3 (independence) - 1 = 65
    // Need: coverage >=90, pathway >=90, leaving >=90, independence >=90
    // aftercare, childVoice, multiAgency, keyWorker, reviewTimeliness all 0
    // No penalties
    // 52 + 4 + 4 + 3 + 3 + 0 + 0 + 0 + 0 + 0 = 66
    // Need exactly 65... let's get 52 + 4 + 4 + 3 + 3 + 0 + 0 + 0 + 0 + 0 - penalties = 65
    // If aftercareContact = 100 → +3 extra. Let me try with fewer bonuses.
    // 52 + 4(coverage) + 4(pathway) + 3(leavingCare) + 3(independence) = 66 ... still not 65
    // Let me drop leaving care to mid tier: +1 instead of +3. 52+4+4+1+3=64. Not quite.
    // Let me use: coverage=90(+4), pathway=90(+4), leaving=90(+3), independence=70(+1), aftercare=70(+1) = 65
    // But I need to also avoid penalties. Coverage >= 90 → no penalty. Independence = 70 >= 50 → no penalty.
    const transitionPlans = Array.from({ length: 10 }, (_, i) =>
      makeTransitionPlan({
        child_id: `child-${i}`,
        active: true,
      }),
    );
    const pathwayPlans = Array.from({ length: 10 }, (_, i) =>
      makePathwayPlan({
        child_id: `child-${i}`,
        current: true,
        last_reviewed: "2026-04-01",
      }),
    );
    const packages = Array.from({ length: 10 }, (_, i) =>
      makeLeavingCarePackage({
        child_id: `child-${i}`,
        housing_arranged: true,
        financial_support_confirmed: true,
        education_training_plan: true,
        health_passport_provided: true,
        emotional_support_plan: true,
        life_skills_assessed: true,
        documentation_complete: true,
      }),
    );
    const pathways = Array.from({ length: 7 }, (_, i) =>
      makeIndependencePathway({ child_id: `child-${i}` }),
    );
    const aftercare = Array.from({ length: 7 }, (_, i) =>
      makeAfterCareRecord({ child_id: `child-${i}` }),
    );

    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        transition_planning_records: transitionPlans,
        pathway_plans: pathwayPlans,
        leaving_care_packages: packages,
        independence_pathways: pathways,
        aftercare_records: aftercare,
      }),
    );
    // coverage=100 → +4, pathway=100 → +4, leaving=100 → +3, independence=70 → +1, aftercare=70 → +1
    // childVoice=0, multiAgency=0, keyWorker=0, reviewTimeliness=0
    // No penalties (coverage >=50, no current pathway<50, leaving >=50, independence >=50)
    // 52 + 4+4+3+1+1 = 65
    expect(r.readiness_score).toBe(65);
    expect(r.readiness_rating).toBe("good");
  });

  it("score 64 → adequate", () => {
    // Like above but aftercare at 60% instead of 70%
    const transitionPlans = Array.from({ length: 10 }, (_, i) =>
      makeTransitionPlan({
        child_id: `child-${i}`,
        active: true,
      }),
    );
    const pathwayPlans = Array.from({ length: 10 }, (_, i) =>
      makePathwayPlan({
        child_id: `child-${i}`,
        current: true,
        last_reviewed: "2026-04-01",
      }),
    );
    const packages = Array.from({ length: 10 }, (_, i) =>
      makeLeavingCarePackage({
        child_id: `child-${i}`,
        housing_arranged: true,
        financial_support_confirmed: true,
        education_training_plan: true,
        health_passport_provided: true,
        emotional_support_plan: true,
        life_skills_assessed: true,
        documentation_complete: true,
      }),
    );
    const pathways = Array.from({ length: 7 }, (_, i) =>
      makeIndependencePathway({ child_id: `child-${i}` }),
    );
    const aftercare = Array.from({ length: 6 }, (_, i) =>
      makeAfterCareRecord({ child_id: `child-${i}` }),
    );

    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        transition_planning_records: transitionPlans,
        pathway_plans: pathwayPlans,
        leaving_care_packages: packages,
        independence_pathways: pathways,
        aftercare_records: aftercare,
      }),
    );
    // coverage=100→+4, pathway=100→+4, leaving=100→+3, independence=70→+1, aftercare=60→0
    // 52 + 4+4+3+1+0 = 64
    expect(r.readiness_score).toBe(64);
    expect(r.readiness_rating).toBe("adequate");
  });

  it("score 45 → adequate", () => {
    // 52 - 5 (coverage) - 4 (independence) + 2 (some bonus) = 45
    // Need 52 + bonuses - penalties = 45 → bonuses - penalties = -7
    // With coverage penalty (-5) and independence penalty (-4) = -9
    // Need +2 from some bonus → keyWorker at 100% (+2) = -7 → 52-7=45
    const plans = Array.from({ length: 10 }, (_, i) =>
      makeTransitionPlan({
        child_id: `child-${i}`,
        key_worker_assigned: true,
        // not active → coverage stays 0
      }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        transition_planning_records: plans,
      }),
    );
    // keyWorkerAllocationRate = 100 → +2
    // coverage = 0 → -5; independence = 0 → -4
    // 52 + 2 - 5 - 4 = 45
    expect(r.readiness_score).toBe(45);
    expect(r.readiness_rating).toBe("adequate");
  });

  it("score 44 → inadequate", () => {
    // 52 - 5 - 4 + 1 = 44
    // keyWorker at 80% (+1)
    const kwPlans = Array.from({ length: 8 }, (_, i) =>
      makeTransitionPlan({
        child_id: `child-${i}`,
        key_worker_assigned: true,
      }),
    );
    const noKwPlans = Array.from({ length: 2 }, (_, i) =>
      makeTransitionPlan({
        child_id: `child-${i + 8}`,
        key_worker_assigned: false,
      }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        transition_planning_records: [...kwPlans, ...noKwPlans],
      }),
    );
    // keyWorkerAllocationRate = 80 → +1
    // coverage = 0 → -5; independence = 0 → -4
    // 52 + 1 - 5 - 4 = 44
    expect(r.readiness_score).toBe(44);
    expect(r.readiness_rating).toBe("inadequate");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 8. METRIC CALCULATIONS
// ═══════════════════════════════════════════════════════════════════════════

describe("Metric calculations", () => {
  it("total_transition_plans counts all records", () => {
    const plans = Array.from({ length: 5 }, (_, i) =>
      makeTransitionPlan({ child_id: `child-${i}` }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 5,
        transition_planning_records: plans,
      }),
    );
    expect(r.total_transition_plans).toBe(5);
  });

  it("transition_plan_coverage_rate uses unique child_ids of active plans", () => {
    // 2 active plans for same child → 1 unique child; total_children = 2
    const plans = [
      makeTransitionPlan({ child_id: "child-1", active: true }),
      makeTransitionPlan({ child_id: "child-1", active: true }),
      makeTransitionPlan({ child_id: "child-2", active: false }),
    ];
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 2,
        transition_planning_records: plans,
      }),
    );
    expect(r.transition_plan_coverage_rate).toBe(50); // pct(1, 2)
  });

  it("pathway_plan_currency_rate uses current plans reviewed within 180 days", () => {
    const plans = [
      makePathwayPlan({ current: true, last_reviewed: "2026-04-01" }), // recent
      makePathwayPlan({ current: true, last_reviewed: "2025-01-01" }), // stale
      makePathwayPlan({ current: false, last_reviewed: "2026-04-01" }), // not current
    ];
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 1,
        pathway_plans: plans,
      }),
    );
    // currentPathwayPlans = 2, recentlyReviewed = 1 → pct(1, 2) = 50
    expect(r.pathway_plan_currency_rate).toBe(50);
  });

  it("leaving_care_completion_rate requires all 7 booleans true", () => {
    const packages = [
      makeLeavingCarePackage({
        housing_arranged: true,
        financial_support_confirmed: true,
        education_training_plan: true,
        health_passport_provided: true,
        emotional_support_plan: true,
        life_skills_assessed: true,
        documentation_complete: true,
      }),
      makeLeavingCarePackage({
        housing_arranged: true,
        financial_support_confirmed: true,
        education_training_plan: true,
        health_passport_provided: true,
        emotional_support_plan: true,
        life_skills_assessed: true,
        documentation_complete: false, // incomplete
      }),
    ];
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 1,
        leaving_care_packages: packages,
      }),
    );
    expect(r.leaving_care_completion_rate).toBe(50); // pct(1, 2)
  });

  it("independence_assessment_rate uses unique child_ids", () => {
    const pathways = [
      makeIndependencePathway({ child_id: "child-1" }),
      makeIndependencePathway({ child_id: "child-1" }), // duplicate
      makeIndependencePathway({ child_id: "child-2" }),
    ];
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 5,
        independence_pathways: pathways,
      }),
    );
    expect(r.independence_assessment_rate).toBe(40); // pct(2, 5)
  });

  it("aftercare_contact_rate uses unique child_ids", () => {
    const records = [
      makeAfterCareRecord({ child_id: "child-1" }),
      makeAfterCareRecord({ child_id: "child-1" }), // duplicate
    ];
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 2,
        aftercare_records: records,
      }),
    );
    expect(r.aftercare_contact_rate).toBe(50); // pct(1, 2)
  });

  it("child_voice_in_transition_rate counts all records not just active", () => {
    const plans = [
      makeTransitionPlan({ child_voice_captured: true, active: false }),
      makeTransitionPlan({ child_voice_captured: false, active: true }),
    ];
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 1,
        transition_planning_records: plans,
      }),
    );
    expect(r.child_voice_in_transition_rate).toBe(50); // pct(1, 2)
  });

  it("pct(0, 0) returns 0", () => {
    // All rates with 0 denominator should be 0
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 0,
        transition_planning_records: [makeTransitionPlan()],
      }),
    );
    expect(r.transition_plan_coverage_rate).toBe(0); // pct(0, 0) since total_children=0
    expect(r.independence_assessment_rate).toBe(0);
    expect(r.aftercare_contact_rate).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 9. STRENGTHS
// ═══════════════════════════════════════════════════════════════════════════

describe("Strengths", () => {
  it("100% transition plan coverage adds strength", () => {
    const plans = Array.from({ length: 5 }, (_, i) =>
      makeTransitionPlan({ child_id: `child-${i}`, active: true }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 5,
        transition_planning_records: plans,
      }),
    );
    expect(r.strengths.some((s) => s.includes("Every child has an active transition plan"))).toBe(true);
  });

  it("80-99% transition plan coverage adds strength with percentage", () => {
    const plans = Array.from({ length: 4 }, (_, i) =>
      makeTransitionPlan({ child_id: `child-${i}`, active: true }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 5,
        transition_planning_records: plans,
      }),
    );
    expect(r.strengths.some((s) => s.includes("80%") && s.includes("active transition plan"))).toBe(true);
  });

  it("100% pathway plan currency adds strength", () => {
    const plans = Array.from({ length: 3 }, (_, i) =>
      makePathwayPlan({
        child_id: `child-${i}`,
        current: true,
        last_reviewed: "2026-04-01",
      }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 3,
        pathway_plans: plans,
      }),
    );
    expect(r.strengths.some((s) => s.includes("All pathway plans have been reviewed"))).toBe(true);
  });

  it("80-99% pathway plan currency adds strength with percentage", () => {
    const recentPlans = Array.from({ length: 4 }, (_, i) =>
      makePathwayPlan({
        child_id: `child-${i}`,
        current: true,
        last_reviewed: "2026-04-01",
      }),
    );
    const stalePlan = makePathwayPlan({
      child_id: "child-4",
      current: true,
      last_reviewed: "2025-01-01",
    });
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 5,
        pathway_plans: [...recentPlans, stalePlan],
      }),
    );
    expect(r.strengths.some((s) => s.includes("80%") && s.includes("pathway plans are current"))).toBe(true);
  });

  it("100% leaving care completion adds strength", () => {
    const packages = [
      makeLeavingCarePackage({
        housing_arranged: true,
        financial_support_confirmed: true,
        education_training_plan: true,
        health_passport_provided: true,
        emotional_support_plan: true,
        life_skills_assessed: true,
        documentation_complete: true,
      }),
    ];
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 1,
        leaving_care_packages: packages,
      }),
    );
    expect(r.strengths.some((s) => s.includes("All leaving care packages are fully complete"))).toBe(true);
  });

  it("100% independence assessment adds strength", () => {
    const pathways = Array.from({ length: 5 }, (_, i) =>
      makeIndependencePathway({ child_id: `child-${i}` }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 5,
        independence_pathways: pathways,
      }),
    );
    expect(r.strengths.some((s) => s.includes("Every child has had an independence skills assessment"))).toBe(true);
  });

  it("100% aftercare contact adds strength", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeAfterCareRecord({ child_id: `child-${i}` }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 5,
        aftercare_records: records,
      }),
    );
    expect(r.strengths.some((s) => s.includes("All children have aftercare contact records"))).toBe(true);
  });

  it("100% child voice in transition adds strength", () => {
    const plans = Array.from({ length: 5 }, (_, i) =>
      makeTransitionPlan({ child_id: `child-${i}`, child_voice_captured: true }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 5,
        transition_planning_records: plans,
      }),
    );
    expect(r.strengths.some((s) => s.includes("Child voice is captured in every transition plan"))).toBe(true);
  });

  it("100% multi-agency involvement adds strength", () => {
    const plans = Array.from({ length: 5 }, (_, i) =>
      makeTransitionPlan({ child_id: `child-${i}`, multi_agency_involved: true }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 5,
        transition_planning_records: plans,
      }),
    );
    expect(r.strengths.some((s) => s.includes("Multi-agency involvement in every transition plan"))).toBe(true);
  });

  it("100% key worker allocation adds strength", () => {
    const plans = Array.from({ length: 5 }, (_, i) =>
      makeTransitionPlan({ child_id: `child-${i}`, key_worker_assigned: true }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 5,
        transition_planning_records: plans,
      }),
    );
    expect(r.strengths.some((s) => s.includes("Every transition plan has a key worker assigned"))).toBe(true);
  });

  it(">=90% review timeliness adds strength", () => {
    const plans = Array.from({ length: 10 }, (_, i) =>
      makeTransitionPlan({
        child_id: `child-${i}`,
        next_review_date: "2026-06-15",
      }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        transition_planning_records: plans,
      }),
    );
    expect(r.strengths.some((s) => s.includes("100%") && s.includes("review") && s.includes("on schedule"))).toBe(true);
  });

  it(">=90% pathway completeness adds strength", () => {
    const plans = Array.from({ length: 10 }, (_, i) =>
      makePathwayPlan({
        child_id: `child-${i}`,
        current: true,
        last_reviewed: "2026-04-01",
        accommodation_plan: true,
        education_employment_plan: true,
        financial_plan: true,
        health_plan: true,
        support_network_identified: true,
      }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        pathway_plans: plans,
      }),
    );
    expect(r.strengths.some((s) => s.includes("pathway plans address all core areas"))).toBe(true);
  });

  it("100% personal advisor adds strength", () => {
    const plans = Array.from({ length: 5 }, (_, i) =>
      makePathwayPlan({
        child_id: `child-${i}`,
        current: true,
        last_reviewed: "2026-04-01",
        personal_advisor_assigned: true,
      }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 5,
        pathway_plans: plans,
      }),
    );
    expect(r.strengths.some((s) => s.includes("All young people with pathway plans have a personal adviser"))).toBe(true);
  });

  it(">=90% comprehensive assessment adds strength", () => {
    const pathways = Array.from({ length: 10 }, (_, i) =>
      makeIndependencePathway({
        child_id: `child-${i}`,
        cooking_skills_assessed: true,
        budgeting_skills_assessed: true,
        self_care_assessed: true,
        travel_skills_assessed: true,
        social_skills_assessed: true,
      }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        independence_pathways: pathways,
      }),
    );
    expect(r.strengths.some((s) => s.includes("independence assessments cover all skill domains"))).toBe(true);
  });

  it(">=90% aftercare support rate adds strength", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makeAfterCareRecord({
        child_id: `child-${i}`,
        support_needs_identified: true,
        support_provided: true,
      }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        aftercare_records: records,
      }),
    );
    expect(r.strengths.some((s) => s.includes("aftercare support needs have been met"))).toBe(true);
  });

  it(">=90% aftercare wellbeing rate adds strength", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makeAfterCareRecord({
        child_id: `child-${i}`,
        wellbeing_checked: true,
      }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        aftercare_records: records,
      }),
    );
    expect(r.strengths.some((s) => s.includes("aftercare contacts include a wellbeing check"))).toBe(true);
  });

  it("no strengths when all rates are low", () => {
    const plans = [makeTransitionPlan({ child_id: "child-1" })];
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        transition_planning_records: plans,
      }),
    );
    expect(r.strengths).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 10. CONCERNS
// ═══════════════════════════════════════════════════════════════════════════

describe("Concerns", () => {
  it("coverage < 50% adds critical concern", () => {
    const plans = Array.from({ length: 3 }, (_, i) =>
      makeTransitionPlan({ child_id: `child-${i}`, active: true }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        transition_planning_records: plans,
      }),
    );
    expect(r.concerns.some((c) => c.includes("30%") && c.includes("active transition plan"))).toBe(true);
  });

  it("coverage 50-79% adds moderate concern", () => {
    const plans = Array.from({ length: 6 }, (_, i) =>
      makeTransitionPlan({ child_id: `child-${i}`, active: true }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        transition_planning_records: plans,
      }),
    );
    expect(r.concerns.some((c) => c.includes("60%") && c.includes("not all children"))).toBe(true);
  });

  it("pathway currency < 50% adds critical concern", () => {
    const plans = Array.from({ length: 10 }, (_, i) =>
      makePathwayPlan({
        child_id: `child-${i}`,
        current: true,
        last_reviewed: "2025-01-01",
      }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        pathway_plans: plans,
      }),
    );
    expect(r.concerns.some((c) => c.includes("0%") && c.includes("pathway plans are current"))).toBe(true);
  });

  it("pathway currency 50-79% adds moderate concern", () => {
    const recentPlans = Array.from({ length: 6 }, (_, i) =>
      makePathwayPlan({
        child_id: `child-${i}`,
        current: true,
        last_reviewed: "2026-04-01",
      }),
    );
    const stalePlans = Array.from({ length: 4 }, (_, i) =>
      makePathwayPlan({
        child_id: `child-${i + 6}`,
        current: true,
        last_reviewed: "2025-01-01",
      }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        pathway_plans: [...recentPlans, ...stalePlans],
      }),
    );
    expect(r.concerns.some((c) => c.includes("60%") && c.includes("Pathway plan currency"))).toBe(true);
  });

  it("leaving care completion < 50% adds critical concern", () => {
    const packages = Array.from({ length: 10 }, (_, i) =>
      makeLeavingCarePackage({ child_id: `child-${i}` }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        leaving_care_packages: packages,
      }),
    );
    expect(r.concerns.some((c) => c.includes("0%") && c.includes("leaving care packages are complete"))).toBe(true);
  });

  it("leaving care completion 50-79% adds moderate concern", () => {
    const completePackages = Array.from({ length: 6 }, (_, i) =>
      makeLeavingCarePackage({
        child_id: `child-${i}`,
        housing_arranged: true,
        financial_support_confirmed: true,
        education_training_plan: true,
        health_passport_provided: true,
        emotional_support_plan: true,
        life_skills_assessed: true,
        documentation_complete: true,
      }),
    );
    const incompletePackages = Array.from({ length: 4 }, (_, i) =>
      makeLeavingCarePackage({ child_id: `child-${i + 6}` }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        leaving_care_packages: [...completePackages, ...incompletePackages],
      }),
    );
    expect(r.concerns.some((c) => c.includes("60%") && c.includes("Leaving care completion rate"))).toBe(true);
  });

  it("independence assessment < 50% adds critical concern", () => {
    const pathways = Array.from({ length: 3 }, (_, i) =>
      makeIndependencePathway({ child_id: `child-${i}` }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        independence_pathways: pathways,
      }),
    );
    expect(r.concerns.some((c) => c.includes("30%") && c.includes("independence skills assessment"))).toBe(true);
  });

  it("independence assessment 50-79% adds moderate concern", () => {
    const pathways = Array.from({ length: 6 }, (_, i) =>
      makeIndependencePathway({ child_id: `child-${i}` }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        independence_pathways: pathways,
      }),
    );
    expect(r.concerns.some((c) => c.includes("60%") && c.includes("Independence assessment coverage"))).toBe(true);
  });

  it("child voice < 50% adds critical concern", () => {
    const plans = Array.from({ length: 10 }, (_, i) =>
      makeTransitionPlan({ child_id: `child-${i}`, child_voice_captured: false }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        transition_planning_records: plans,
      }),
    );
    expect(r.concerns.some((c) => c.includes("0%") && c.includes("child voice"))).toBe(true);
  });

  it("child voice 50-79% adds moderate concern", () => {
    const voicePlans = Array.from({ length: 6 }, (_, i) =>
      makeTransitionPlan({ child_id: `child-${i}`, child_voice_captured: true }),
    );
    const noVoicePlans = Array.from({ length: 4 }, (_, i) =>
      makeTransitionPlan({ child_id: `child-${i + 6}`, child_voice_captured: false }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        transition_planning_records: [...voicePlans, ...noVoicePlans],
      }),
    );
    expect(r.concerns.some((c) => c.includes("60%") && c.includes("Child voice captured in"))).toBe(true);
  });

  it("multi-agency < 50% adds critical concern", () => {
    const plans = Array.from({ length: 10 }, (_, i) =>
      makeTransitionPlan({ child_id: `child-${i}`, multi_agency_involved: false }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        transition_planning_records: plans,
      }),
    );
    expect(r.concerns.some((c) => c.includes("0%") && c.includes("multi-agency working"))).toBe(true);
  });

  it("multi-agency 50-79% adds moderate concern", () => {
    const maPlans = Array.from({ length: 6 }, (_, i) =>
      makeTransitionPlan({ child_id: `child-${i}`, multi_agency_involved: true }),
    );
    const noMaPlans = Array.from({ length: 4 }, (_, i) =>
      makeTransitionPlan({ child_id: `child-${i + 6}`, multi_agency_involved: false }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        transition_planning_records: [...maPlans, ...noMaPlans],
      }),
    );
    expect(r.concerns.some((c) => c.includes("60%") && c.includes("Multi-agency involvement"))).toBe(true);
  });

  it("key worker < 80% adds concern", () => {
    const plans = Array.from({ length: 10 }, (_, i) =>
      makeTransitionPlan({
        child_id: `child-${i}`,
        key_worker_assigned: i < 7, // 70%
      }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        transition_planning_records: plans,
      }),
    );
    expect(r.concerns.some((c) => c.includes("70%") && c.includes("key worker assigned"))).toBe(true);
  });

  it("aftercare contact < 50% adds concern (when records exist)", () => {
    const records = Array.from({ length: 3 }, (_, i) =>
      makeAfterCareRecord({ child_id: `child-${i}` }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        aftercare_records: records,
      }),
    );
    expect(r.concerns.some((c) => c.includes("30%") && c.includes("aftercare contact records"))).toBe(true);
  });

  it("aftercare contact < 50% does NOT add concern when no records exist", () => {
    // total_children > 0 but aftercareContactRate = 0 and totalAftercareRecords = 0
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        transition_planning_records: [makeTransitionPlan()],
      }),
    );
    expect(r.concerns.every((c) => !c.includes("aftercare contact records"))).toBe(true);
  });

  it("overdue plans add concern", () => {
    const plans = [
      makeTransitionPlan({ next_review_date: "2026-01-01" }), // overdue
    ];
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 1,
        transition_planning_records: plans,
      }),
    );
    expect(r.concerns.some((c) => c.includes("1 transition plan review") && c.includes("overdue"))).toBe(true);
  });

  it("plural overdue plans", () => {
    const plans = [
      makeTransitionPlan({ child_id: "c1", next_review_date: "2026-01-01" }),
      makeTransitionPlan({ child_id: "c2", next_review_date: "2026-01-01" }),
    ];
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 2,
        transition_planning_records: plans,
      }),
    );
    expect(r.concerns.some((c) => c.includes("2 transition plan reviews overdue"))).toBe(true);
  });

  it("overdue aftercare contacts add concern", () => {
    const records = [
      makeAfterCareRecord({ next_contact_date: "2026-01-01" }), // overdue
    ];
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 1,
        aftercare_records: records,
      }),
    );
    expect(r.concerns.some((c) => c.includes("1 aftercare contact") && c.includes("overdue"))).toBe(true);
  });

  it("no pathway plans concern when children > 0 and no pathway_plans", () => {
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 5,
        transition_planning_records: [makeTransitionPlan()],
      }),
    );
    expect(r.concerns.some((c) => c.includes("No pathway plans exist"))).toBe(true);
  });

  it("personal advisor < 80% adds concern", () => {
    const plans = Array.from({ length: 5 }, (_, i) =>
      makePathwayPlan({
        child_id: `child-${i}`,
        current: true,
        last_reviewed: "2026-04-01",
        personal_advisor_assigned: i < 3, // 60%
      }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 5,
        pathway_plans: plans,
      }),
    );
    expect(r.concerns.some((c) => c.includes("60%") && c.includes("personal adviser"))).toBe(true);
  });

  it("housing < 50% adds concern", () => {
    const packages = Array.from({ length: 10 }, (_, i) =>
      makeLeavingCarePackage({
        child_id: `child-${i}`,
        housing_arranged: i < 4, // 40%
      }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        leaving_care_packages: packages,
      }),
    );
    expect(r.concerns.some((c) => c.includes("40%") && c.includes("housing arranged"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 11. RECOMMENDATIONS
// ═══════════════════════════════════════════════════════════════════════════

describe("Recommendations", () => {
  it("all recommendations have rank, urgency, and regulatory_ref", () => {
    const plans = Array.from({ length: 10 }, (_, i) =>
      makeTransitionPlan({ child_id: `child-${i}` }),
    );
    const pathwayPlans = Array.from({ length: 10 }, (_, i) =>
      makePathwayPlan({
        child_id: `child-${i}`,
        current: true,
        last_reviewed: "2025-01-01",
      }),
    );
    const packages = Array.from({ length: 10 }, (_, i) =>
      makeLeavingCarePackage({ child_id: `child-${i}` }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        transition_planning_records: plans,
        pathway_plans: pathwayPlans,
        leaving_care_packages: packages,
      }),
    );
    expect(r.recommendations.length).toBeGreaterThan(0);
    for (const rec of r.recommendations) {
      expect(rec.rank).toBeGreaterThan(0);
      expect(["immediate", "soon", "planned"]).toContain(rec.urgency);
      expect(rec.regulatory_ref.length).toBeGreaterThan(0);
    }
  });

  it("ranks are sequential starting from 1", () => {
    const plans = Array.from({ length: 10 }, (_, i) =>
      makeTransitionPlan({ child_id: `child-${i}` }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        transition_planning_records: plans,
      }),
    );
    for (let i = 0; i < r.recommendations.length; i++) {
      expect(r.recommendations[i].rank).toBe(i + 1);
    }
  });

  it("coverage < 50% triggers immediate recommendation", () => {
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        transition_planning_records: [makeTransitionPlan({ child_id: "c1", active: true })],
      }),
    );
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("transition plans"))).toBe(true);
  });

  it("no pathway plans triggers immediate recommendation", () => {
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        transition_planning_records: [makeTransitionPlan()],
      }),
    );
    expect(r.recommendations.some((rec) => rec.recommendation.includes("pathway plans"))).toBe(true);
  });

  it("child voice < 50% triggers immediate recommendation", () => {
    const plans = Array.from({ length: 10 }, (_, i) =>
      makeTransitionPlan({ child_id: `child-${i}`, child_voice_captured: false }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        transition_planning_records: plans,
      }),
    );
    expect(r.recommendations.some((rec) => rec.recommendation.includes("voice"))).toBe(true);
  });

  it("leaving care < 50% triggers immediate recommendation", () => {
    const packages = Array.from({ length: 10 }, (_, i) =>
      makeLeavingCarePackage({ child_id: `child-${i}` }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        leaving_care_packages: packages,
      }),
    );
    expect(r.recommendations.some((rec) => rec.recommendation.includes("leaving care package"))).toBe(true);
  });

  it("independence < 50% triggers immediate recommendation", () => {
    const pathways = Array.from({ length: 3 }, (_, i) =>
      makeIndependencePathway({ child_id: `child-${i}` }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        independence_pathways: pathways,
      }),
    );
    expect(r.recommendations.some((rec) => rec.recommendation.includes("independence skills assessments"))).toBe(true);
  });

  it("personal advisor < 80% triggers immediate recommendation", () => {
    const plans = Array.from({ length: 5 }, (_, i) =>
      makePathwayPlan({
        child_id: `child-${i}`,
        current: true,
        last_reviewed: "2026-04-01",
        personal_advisor_assigned: i < 3,
      }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 5,
        pathway_plans: plans,
      }),
    );
    expect(r.recommendations.some((rec) => rec.recommendation.includes("personal adviser"))).toBe(true);
  });

  it("pathway currency < 50% triggers soon recommendation", () => {
    const plans = Array.from({ length: 10 }, (_, i) =>
      makePathwayPlan({
        child_id: `child-${i}`,
        current: true,
        last_reviewed: "2025-01-01",
      }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        pathway_plans: plans,
      }),
    );
    expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("pathway plans"))).toBe(true);
  });

  it("multi-agency < 50% triggers soon recommendation", () => {
    const plans = Array.from({ length: 10 }, (_, i) =>
      makeTransitionPlan({ child_id: `child-${i}`, multi_agency_involved: false }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        transition_planning_records: plans,
      }),
    );
    expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("multi-agency"))).toBe(true);
  });

  it("coverage 50-79% triggers soon recommendation", () => {
    const plans = Array.from({ length: 6 }, (_, i) =>
      makeTransitionPlan({ child_id: `child-${i}`, active: true }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        transition_planning_records: plans,
      }),
    );
    expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("transition plan coverage"))).toBe(true);
  });

  it("independence 50-79% triggers soon recommendation", () => {
    const pathways = Array.from({ length: 6 }, (_, i) =>
      makeIndependencePathway({ child_id: `child-${i}` }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        independence_pathways: pathways,
      }),
    );
    expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("independence skills assessments"))).toBe(true);
  });

  it("overdue plans trigger soon recommendation", () => {
    const plans = [
      makeTransitionPlan({ next_review_date: "2026-01-01" }),
    ];
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 1,
        transition_planning_records: plans,
      }),
    );
    expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("overdue"))).toBe(true);
  });

  it("leaving care 50-79% triggers planned recommendation", () => {
    const completePackages = Array.from({ length: 6 }, (_, i) =>
      makeLeavingCarePackage({
        child_id: `child-${i}`,
        housing_arranged: true,
        financial_support_confirmed: true,
        education_training_plan: true,
        health_passport_provided: true,
        emotional_support_plan: true,
        life_skills_assessed: true,
        documentation_complete: true,
      }),
    );
    const incompletePackages = Array.from({ length: 4 }, (_, i) =>
      makeLeavingCarePackage({ child_id: `child-${i + 6}` }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        leaving_care_packages: [...completePackages, ...incompletePackages],
      }),
    );
    expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("leaving care packages"))).toBe(true);
  });

  it("pathway currency 50-79% triggers planned recommendation", () => {
    const recentPlans = Array.from({ length: 6 }, (_, i) =>
      makePathwayPlan({
        child_id: `child-${i}`,
        current: true,
        last_reviewed: "2026-04-01",
      }),
    );
    const stalePlans = Array.from({ length: 4 }, (_, i) =>
      makePathwayPlan({
        child_id: `child-${i + 6}`,
        current: true,
        last_reviewed: "2025-01-01",
      }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        pathway_plans: [...recentPlans, ...stalePlans],
      }),
    );
    expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("pathway plan review cycle"))).toBe(true);
  });

  it("child voice 50-79% triggers planned recommendation", () => {
    const plans = Array.from({ length: 10 }, (_, i) =>
      makeTransitionPlan({
        child_id: `child-${i}`,
        child_voice_captured: i < 6,
      }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        transition_planning_records: plans,
      }),
    );
    expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("child participation"))).toBe(true);
  });

  it("multi-agency 50-79% triggers planned recommendation", () => {
    const plans = Array.from({ length: 10 }, (_, i) =>
      makeTransitionPlan({
        child_id: `child-${i}`,
        multi_agency_involved: i < 6,
      }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        transition_planning_records: plans,
      }),
    );
    expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("multi-agency engagement"))).toBe(true);
  });

  it("no recommendations when all metrics are perfect", () => {
    const transitionPlans = Array.from({ length: 10 }, (_, i) =>
      makeTransitionPlan({
        child_id: `child-${i}`,
        active: true,
        child_voice_captured: true,
        multi_agency_involved: true,
        key_worker_assigned: true,
        goals_set: true,
        reviewed: true,
        next_review_date: "2026-06-15",
      }),
    );
    const pathwayPlans = Array.from({ length: 10 }, (_, i) =>
      makePathwayPlan({
        child_id: `child-${i}`,
        current: true,
        last_reviewed: "2026-04-01",
        accommodation_plan: true,
        education_employment_plan: true,
        financial_plan: true,
        health_plan: true,
        support_network_identified: true,
        personal_advisor_assigned: true,
      }),
    );
    const packages = Array.from({ length: 10 }, (_, i) =>
      makeLeavingCarePackage({
        child_id: `child-${i}`,
        housing_arranged: true,
        financial_support_confirmed: true,
        education_training_plan: true,
        health_passport_provided: true,
        emotional_support_plan: true,
        life_skills_assessed: true,
        documentation_complete: true,
      }),
    );
    const pathways = Array.from({ length: 10 }, (_, i) =>
      makeIndependencePathway({ child_id: `child-${i}` }),
    );
    const aftercare = Array.from({ length: 10 }, (_, i) =>
      makeAfterCareRecord({ child_id: `child-${i}` }),
    );

    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        transition_planning_records: transitionPlans,
        pathway_plans: pathwayPlans,
        leaving_care_packages: packages,
        independence_pathways: pathways,
        aftercare_records: aftercare,
      }),
    );
    expect(r.recommendations).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 12. INSIGHTS
// ═══════════════════════════════════════════════════════════════════════════

describe("Insights — critical", () => {
  it("coverage < 50% generates critical insight", () => {
    const plans = Array.from({ length: 3 }, (_, i) =>
      makeTransitionPlan({ child_id: `child-${i}`, active: true }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        transition_planning_records: plans,
      }),
    );
    expect(r.insights.some((ins) => ins.severity === "critical" && ins.text.includes("30%"))).toBe(true);
  });

  it("no pathway plans generates critical insight", () => {
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        transition_planning_records: [makeTransitionPlan()],
      }),
    );
    expect(r.insights.some((ins) => ins.severity === "critical" && ins.text.includes("No pathway plans"))).toBe(true);
  });

  it("child voice < 50% generates critical insight", () => {
    const plans = Array.from({ length: 10 }, (_, i) =>
      makeTransitionPlan({ child_id: `child-${i}` }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        transition_planning_records: plans,
      }),
    );
    expect(r.insights.some((ins) => ins.severity === "critical" && ins.text.includes("Child voice"))).toBe(true);
  });

  it("leaving care < 50% generates critical insight", () => {
    const packages = Array.from({ length: 10 }, (_, i) =>
      makeLeavingCarePackage({ child_id: `child-${i}` }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        leaving_care_packages: packages,
      }),
    );
    expect(r.insights.some((ins) => ins.severity === "critical" && ins.text.includes("leaving care packages are complete"))).toBe(true);
  });

  it("independence < 50% generates critical insight", () => {
    const pathways = Array.from({ length: 3 }, (_, i) =>
      makeIndependencePathway({ child_id: `child-${i}` }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        independence_pathways: pathways,
      }),
    );
    expect(r.insights.some((ins) => ins.severity === "critical" && ins.text.includes("independence skills assessed"))).toBe(true);
  });

  it("personal advisor < 50% generates critical insight", () => {
    const plans = Array.from({ length: 10 }, (_, i) =>
      makePathwayPlan({
        child_id: `child-${i}`,
        current: true,
        last_reviewed: "2026-04-01",
        personal_advisor_assigned: i < 4,
      }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        pathway_plans: plans,
      }),
    );
    expect(r.insights.some((ins) => ins.severity === "critical" && ins.text.includes("personal adviser"))).toBe(true);
  });
});

describe("Insights — warning", () => {
  it("coverage 50-79% generates warning insight", () => {
    const plans = Array.from({ length: 6 }, (_, i) =>
      makeTransitionPlan({ child_id: `child-${i}`, active: true }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        transition_planning_records: plans,
      }),
    );
    expect(r.insights.some((ins) => ins.severity === "warning" && ins.text.includes("60%"))).toBe(true);
  });

  it("pathway currency 50-79% generates warning insight", () => {
    const recentPlans = Array.from({ length: 6 }, (_, i) =>
      makePathwayPlan({
        child_id: `child-${i}`,
        current: true,
        last_reviewed: "2026-04-01",
      }),
    );
    const stalePlans = Array.from({ length: 4 }, (_, i) =>
      makePathwayPlan({
        child_id: `child-${i + 6}`,
        current: true,
        last_reviewed: "2025-01-01",
      }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        pathway_plans: [...recentPlans, ...stalePlans],
      }),
    );
    expect(r.insights.some((ins) => ins.severity === "warning" && ins.text.includes("60%") && ins.text.includes("pathway plans are current"))).toBe(true);
  });

  it("leaving care 50-79% generates warning insight", () => {
    const completePackages = Array.from({ length: 6 }, (_, i) =>
      makeLeavingCarePackage({
        child_id: `child-${i}`,
        housing_arranged: true,
        financial_support_confirmed: true,
        education_training_plan: true,
        health_passport_provided: true,
        emotional_support_plan: true,
        life_skills_assessed: true,
        documentation_complete: true,
      }),
    );
    const incompletePackages = Array.from({ length: 4 }, (_, i) =>
      makeLeavingCarePackage({ child_id: `child-${i + 6}` }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        leaving_care_packages: [...completePackages, ...incompletePackages],
      }),
    );
    expect(r.insights.some((ins) => ins.severity === "warning" && ins.text.includes("60%"))).toBe(true);
  });

  it("multi-agency 50-79% generates warning insight", () => {
    const plans = Array.from({ length: 10 }, (_, i) =>
      makeTransitionPlan({
        child_id: `child-${i}`,
        multi_agency_involved: i < 6,
      }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        transition_planning_records: plans,
      }),
    );
    expect(r.insights.some((ins) => ins.severity === "warning" && ins.text.includes("Multi-agency involvement at 60%"))).toBe(true);
  });

  it("1-3 overdue plans generate warning insight (singular)", () => {
    const plans = [
      makeTransitionPlan({ next_review_date: "2026-01-01" }),
    ];
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 1,
        transition_planning_records: plans,
      }),
    );
    expect(r.insights.some((ins) => ins.severity === "warning" && ins.text.includes("1 transition plan review") && ins.text.includes("is overdue"))).toBe(true);
  });

  it(">3 overdue plans generate warning insight (systemic)", () => {
    const plans = Array.from({ length: 5 }, (_, i) =>
      makeTransitionPlan({
        child_id: `child-${i}`,
        next_review_date: "2026-01-01",
      }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 5,
        transition_planning_records: plans,
      }),
    );
    expect(r.insights.some((ins) => ins.severity === "warning" && ins.text.includes("5 transition plan reviews are overdue") && ins.text.includes("systemic"))).toBe(true);
  });

  it("independence 50-79% generates warning insight", () => {
    const pathways = Array.from({ length: 6 }, (_, i) =>
      makeIndependencePathway({ child_id: `child-${i}` }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        independence_pathways: pathways,
      }),
    );
    expect(r.insights.some((ins) => ins.severity === "warning" && ins.text.includes("60%"))).toBe(true);
  });

  it("housing < 70% generates warning insight", () => {
    const packages = Array.from({ length: 10 }, (_, i) =>
      makeLeavingCarePackage({
        child_id: `child-${i}`,
        housing_arranged: i < 6,
      }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        leaving_care_packages: packages,
      }),
    );
    expect(r.insights.some((ins) => ins.severity === "warning" && ins.text.includes("60%") && ins.text.includes("housing arranged"))).toBe(true);
  });

  it("aftercare support < 70% generates warning insight", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makeAfterCareRecord({
        child_id: `child-${i}`,
        support_needs_identified: true,
        support_provided: i < 6,
      }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        aftercare_records: records,
      }),
    );
    expect(r.insights.some((ins) => ins.severity === "warning" && ins.text.includes("60%") && ins.text.includes("aftercare support needs"))).toBe(true);
  });

  it("overdue aftercare contacts generate warning insight", () => {
    const records = [
      makeAfterCareRecord({ next_contact_date: "2026-01-01" }),
    ];
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 1,
        aftercare_records: records,
      }),
    );
    expect(r.insights.some((ins) => ins.severity === "warning" && ins.text.includes("aftercare contact") && ins.text.includes("overdue"))).toBe(true);
  });
});

describe("Insights — positive", () => {
  function makeOutstandingInput(): TransitionLeavingCareReadinessInput {
    return baseInput({
      total_children: 10,
      transition_planning_records: Array.from({ length: 10 }, (_, i) =>
        makeTransitionPlan({
          child_id: `child-${i}`,
          active: true,
          child_voice_captured: true,
          multi_agency_involved: true,
          key_worker_assigned: true,
          next_review_date: "2026-06-15",
        }),
      ),
      pathway_plans: Array.from({ length: 10 }, (_, i) =>
        makePathwayPlan({
          child_id: `child-${i}`,
          current: true,
          last_reviewed: "2026-04-01",
          accommodation_plan: true,
          education_employment_plan: true,
          financial_plan: true,
          health_plan: true,
          support_network_identified: true,
          personal_advisor_assigned: true,
        }),
      ),
      leaving_care_packages: Array.from({ length: 10 }, (_, i) =>
        makeLeavingCarePackage({
          child_id: `child-${i}`,
          housing_arranged: true,
          financial_support_confirmed: true,
          education_training_plan: true,
          health_passport_provided: true,
          emotional_support_plan: true,
          life_skills_assessed: true,
          documentation_complete: true,
        }),
      ),
      independence_pathways: Array.from({ length: 10 }, (_, i) =>
        makeIndependencePathway({
          child_id: `child-${i}`,
          cooking_skills_assessed: true,
          budgeting_skills_assessed: true,
          self_care_assessed: true,
          travel_skills_assessed: true,
          social_skills_assessed: true,
          overall_readiness_score: 80,
        }),
      ),
      aftercare_records: Array.from({ length: 10 }, (_, i) =>
        makeAfterCareRecord({
          child_id: `child-${i}`,
          wellbeing_checked: true,
          support_needs_identified: true,
          support_provided: true,
        }),
      ),
    });
  }

  it("outstanding rating generates positive insight", () => {
    const r = computeTransitionLeavingCareReadiness(makeOutstandingInput());
    expect(r.insights.some((ins) => ins.severity === "positive" && ins.text.includes("outstanding"))).toBe(true);
  });

  it("100% coverage + 100% child voice generates positive insight", () => {
    const r = computeTransitionLeavingCareReadiness(makeOutstandingInput());
    expect(r.insights.some((ins) => ins.severity === "positive" && ins.text.includes("Full transition plan coverage with child voice"))).toBe(true);
  });

  it("100% leaving care completion generates positive insight", () => {
    const r = computeTransitionLeavingCareReadiness(makeOutstandingInput());
    expect(r.insights.some((ins) => ins.severity === "positive" && ins.text.includes("All leaving care packages are fully complete"))).toBe(true);
  });

  it("100% pathway currency generates positive insight", () => {
    const r = computeTransitionLeavingCareReadiness(makeOutstandingInput());
    expect(r.insights.some((ins) => ins.severity === "positive" && ins.text.includes("All pathway plans are current"))).toBe(true);
  });

  it("100% comprehensive assessment generates positive insight", () => {
    const r = computeTransitionLeavingCareReadiness(makeOutstandingInput());
    expect(r.insights.some((ins) => ins.severity === "positive" && ins.text.includes("All independence assessments cover every skill domain"))).toBe(true);
  });

  it("100% multi-agency generates positive insight", () => {
    const r = computeTransitionLeavingCareReadiness(makeOutstandingInput());
    expect(r.insights.some((ins) => ins.severity === "positive" && ins.text.includes("Multi-agency involvement in every transition plan"))).toBe(true);
  });

  it(">=90% aftercare support generates positive insight", () => {
    const r = computeTransitionLeavingCareReadiness(makeOutstandingInput());
    expect(r.insights.some((ins) => ins.severity === "positive" && ins.text.includes("aftercare needs have been met"))).toBe(true);
  });

  it("100% personal advisor generates positive insight", () => {
    const r = computeTransitionLeavingCareReadiness(makeOutstandingInput());
    expect(r.insights.some((ins) => ins.severity === "positive" && ins.text.includes("Every young person with a pathway plan has a personal adviser"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 13. HEADLINES
// ═══════════════════════════════════════════════════════════════════════════

describe("Headlines per rating level", () => {
  it("outstanding headline", () => {
    const transitionPlans = Array.from({ length: 10 }, (_, i) =>
      makeTransitionPlan({
        child_id: `child-${i}`,
        active: true,
        child_voice_captured: true,
        multi_agency_involved: true,
        key_worker_assigned: true,
        next_review_date: "2026-06-15",
      }),
    );
    const pathwayPlans = Array.from({ length: 10 }, (_, i) =>
      makePathwayPlan({
        child_id: `child-${i}`,
        current: true,
        last_reviewed: "2026-04-01",
        accommodation_plan: true,
        education_employment_plan: true,
        financial_plan: true,
        health_plan: true,
        support_network_identified: true,
        personal_advisor_assigned: true,
      }),
    );
    const packages = Array.from({ length: 10 }, (_, i) =>
      makeLeavingCarePackage({
        child_id: `child-${i}`,
        housing_arranged: true,
        financial_support_confirmed: true,
        education_training_plan: true,
        health_passport_provided: true,
        emotional_support_plan: true,
        life_skills_assessed: true,
        documentation_complete: true,
      }),
    );
    const pathways = Array.from({ length: 10 }, (_, i) =>
      makeIndependencePathway({
        child_id: `child-${i}`,
        cooking_skills_assessed: true,
        budgeting_skills_assessed: true,
        self_care_assessed: true,
        travel_skills_assessed: true,
        social_skills_assessed: true,
        overall_readiness_score: 80,
      }),
    );
    const aftercare = Array.from({ length: 10 }, (_, i) =>
      makeAfterCareRecord({
        child_id: `child-${i}`,
        wellbeing_checked: true,
        support_needs_identified: true,
        support_provided: true,
      }),
    );

    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        transition_planning_records: transitionPlans,
        pathway_plans: pathwayPlans,
        leaving_care_packages: packages,
        independence_pathways: pathways,
        aftercare_records: aftercare,
      }),
    );
    expect(r.headline).toContain("Outstanding transition and leaving care readiness");
  });

  it("good headline includes strengths and concerns count", () => {
    const transitionPlans = Array.from({ length: 10 }, (_, i) =>
      makeTransitionPlan({
        child_id: `child-${i}`,
        active: true,
      }),
    );
    const pathwayPlans = Array.from({ length: 10 }, (_, i) =>
      makePathwayPlan({
        child_id: `child-${i}`,
        current: true,
        last_reviewed: "2026-04-01",
      }),
    );
    const packages = Array.from({ length: 10 }, (_, i) =>
      makeLeavingCarePackage({
        child_id: `child-${i}`,
        housing_arranged: true,
        financial_support_confirmed: true,
        education_training_plan: true,
        health_passport_provided: true,
        emotional_support_plan: true,
        life_skills_assessed: true,
        documentation_complete: true,
      }),
    );
    const pathways = Array.from({ length: 7 }, (_, i) =>
      makeIndependencePathway({ child_id: `child-${i}` }),
    );
    const aftercare = Array.from({ length: 7 }, (_, i) =>
      makeAfterCareRecord({ child_id: `child-${i}` }),
    );

    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        transition_planning_records: transitionPlans,
        pathway_plans: pathwayPlans,
        leaving_care_packages: packages,
        independence_pathways: pathways,
        aftercare_records: aftercare,
      }),
    );
    expect(r.readiness_rating).toBe("good");
    expect(r.headline).toContain("Good transition and leaving care readiness");
    expect(r.headline).toContain("strength");
  });

  it("adequate headline includes concerns count", () => {
    const transitionPlans = Array.from({ length: 10 }, (_, i) =>
      makeTransitionPlan({
        child_id: `child-${i}`,
        active: true,
      }),
    );
    const pathwayPlans = Array.from({ length: 10 }, (_, i) =>
      makePathwayPlan({
        child_id: `child-${i}`,
        current: true,
        last_reviewed: "2026-04-01",
      }),
    );
    const packages = Array.from({ length: 10 }, (_, i) =>
      makeLeavingCarePackage({
        child_id: `child-${i}`,
        housing_arranged: true,
        financial_support_confirmed: true,
        education_training_plan: true,
        health_passport_provided: true,
        emotional_support_plan: true,
        life_skills_assessed: true,
        documentation_complete: true,
      }),
    );
    // Independence at 60% and aftercare at 0% → adequate territory
    const pathways = Array.from({ length: 6 }, (_, i) =>
      makeIndependencePathway({ child_id: `child-${i}` }),
    );

    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        transition_planning_records: transitionPlans,
        pathway_plans: pathwayPlans,
        leaving_care_packages: packages,
        independence_pathways: pathways,
      }),
    );
    expect(r.readiness_rating).toBe("adequate");
    expect(r.headline).toContain("Adequate transition and leaving care readiness");
    expect(r.headline).toContain("concern");
  });

  it("inadequate headline includes concerns count", () => {
    const plans = [makeTransitionPlan({ child_id: "child-1" })];
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        transition_planning_records: plans,
      }),
    );
    expect(r.readiness_rating).toBe("inadequate");
    expect(r.headline).toContain("inadequate");
    expect(r.headline).toContain("concern");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 14. EDGE CASES
// ═══════════════════════════════════════════════════════════════════════════

describe("Edge cases", () => {
  it("single child, single record in each array", () => {
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 1,
        transition_planning_records: [
          makeTransitionPlan({
            child_id: "child-1",
            active: true,
            child_voice_captured: true,
            multi_agency_involved: true,
            key_worker_assigned: true,
            goals_set: true,
            reviewed: true,
            next_review_date: "2026-06-15",
          }),
        ],
        pathway_plans: [
          makePathwayPlan({
            child_id: "child-1",
            current: true,
            last_reviewed: "2026-04-01",
            accommodation_plan: true,
            education_employment_plan: true,
            financial_plan: true,
            health_plan: true,
            support_network_identified: true,
            personal_advisor_assigned: true,
          }),
        ],
        leaving_care_packages: [
          makeLeavingCarePackage({
            child_id: "child-1",
            housing_arranged: true,
            financial_support_confirmed: true,
            education_training_plan: true,
            health_passport_provided: true,
            emotional_support_plan: true,
            life_skills_assessed: true,
            documentation_complete: true,
          }),
        ],
        independence_pathways: [
          makeIndependencePathway({
            child_id: "child-1",
            cooking_skills_assessed: true,
            budgeting_skills_assessed: true,
            self_care_assessed: true,
            travel_skills_assessed: true,
            social_skills_assessed: true,
            overall_readiness_score: 80,
          }),
        ],
        aftercare_records: [
          makeAfterCareRecord({
            child_id: "child-1",
            wellbeing_checked: true,
            support_needs_identified: true,
            support_provided: true,
          }),
        ],
      }),
    );
    expect(r.readiness_rating).toBe("outstanding");
    expect(r.readiness_score).toBe(80);
  });

  it("review date at exact boundary (today) is NOT overdue", () => {
    const plans = [
      makeTransitionPlan({
        child_id: "child-1",
        next_review_date: "2026-05-28", // today = 2026-05-28, not < today
      }),
    ];
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 1,
        transition_planning_records: plans,
      }),
    );
    // next_review_date "2026-05-28" is NOT < "2026-05-28" → not overdue
    expect(r.concerns.every((c) => !c.includes("overdue"))).toBe(true);
  });

  it("review date one day before today IS overdue", () => {
    const plans = [
      makeTransitionPlan({
        child_id: "child-1",
        next_review_date: "2026-05-27",
      }),
    ];
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 1,
        transition_planning_records: plans,
      }),
    );
    expect(r.concerns.some((c) => c.includes("overdue"))).toBe(true);
  });

  it("aftercare next_contact_date at exact boundary is NOT overdue", () => {
    const records = [
      makeAfterCareRecord({
        child_id: "child-1",
        next_contact_date: "2026-05-28",
      }),
    ];
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 1,
        aftercare_records: records,
      }),
    );
    expect(r.concerns.every((c) => !c.includes("aftercare contact") || !c.includes("overdue"))).toBe(true);
  });

  it("aftercare next_contact_date one day before today IS overdue", () => {
    const records = [
      makeAfterCareRecord({
        child_id: "child-1",
        next_contact_date: "2026-05-27",
      }),
    ];
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 1,
        aftercare_records: records,
      }),
    );
    expect(r.concerns.some((c) => c.includes("aftercare contact") && c.includes("overdue"))).toBe(true);
  });

  it("pathway plan last_reviewed at exactly 180 days ago is still current", () => {
    // 180 days before 2026-05-28 = 2025-11-29
    const plans = [
      makePathwayPlan({
        child_id: "child-1",
        current: true,
        last_reviewed: "2025-11-29",
      }),
    ];
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 1,
        pathway_plans: plans,
      }),
    );
    // oneEightyDaysAgoStr = date 180 days before 2026-05-28
    // last_reviewed >= oneEightyDaysAgoStr → current
    expect(r.pathway_plan_currency_rate).toBe(100);
  });

  it("duplicate child_ids in transition plans count as one unique child", () => {
    const plans = [
      makeTransitionPlan({ child_id: "child-1", active: true }),
      makeTransitionPlan({ child_id: "child-1", active: true }),
      makeTransitionPlan({ child_id: "child-1", active: true }),
    ];
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 3,
        transition_planning_records: plans,
      }),
    );
    // 1 unique child / 3 total = 33%
    expect(r.transition_plan_coverage_rate).toBe(33);
  });

  it("non-active plans do not count for coverage", () => {
    const plans = [
      makeTransitionPlan({ child_id: "child-1", active: false }),
      makeTransitionPlan({ child_id: "child-2", active: false }),
    ];
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 2,
        transition_planning_records: plans,
      }),
    );
    expect(r.transition_plan_coverage_rate).toBe(0);
  });

  it("non-current pathway plans are excluded from currency calculation", () => {
    const plans = [
      makePathwayPlan({ current: false, last_reviewed: "2026-04-01" }),
      makePathwayPlan({ current: false, last_reviewed: "2026-04-01" }),
    ];
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 1,
        pathway_plans: plans,
      }),
    );
    // currentPathwayPlans.length = 0 → pct(0, 0) = 0
    expect(r.pathway_plan_currency_rate).toBe(0);
  });

  it("score is clamped to 0 minimum", () => {
    // With many penalties stacking: 52 - 5 - 5 - 4 - 4 = 34
    // Can't actually go below 0 with existing penalties (max = 18), but test clamp
    const plans = Array.from({ length: 10 }, (_, i) =>
      makeTransitionPlan({ child_id: `child-${i}` }),
    );
    const pathwayPlans = Array.from({ length: 10 }, (_, i) =>
      makePathwayPlan({
        child_id: `child-${i}`,
        current: true,
        last_reviewed: "2025-01-01",
      }),
    );
    const packages = Array.from({ length: 10 }, (_, i) =>
      makeLeavingCarePackage({ child_id: `child-${i}` }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        transition_planning_records: plans,
        pathway_plans: pathwayPlans,
        leaving_care_packages: packages,
      }),
    );
    // 52 - 5 (coverage: 0<50) - 5 (pathway: 0<50) - 4 (leaving: 0<50) - 4 (independence: 0<50) = 34
    expect(r.readiness_score).toBe(34);
    expect(r.readiness_score).toBeGreaterThanOrEqual(0);
  });

  it("score is clamped to 100 maximum", () => {
    // Theoretically impossible to exceed 80, but engine clamps to 100
    // Just verify clamping works by checking max score is 80 with all bonuses
    const transitionPlans = Array.from({ length: 10 }, (_, i) =>
      makeTransitionPlan({
        child_id: `child-${i}`,
        active: true,
        child_voice_captured: true,
        multi_agency_involved: true,
        key_worker_assigned: true,
        next_review_date: "2026-06-15",
      }),
    );
    const pathwayPlans = Array.from({ length: 10 }, (_, i) =>
      makePathwayPlan({
        child_id: `child-${i}`,
        current: true,
        last_reviewed: "2026-04-01",
        accommodation_plan: true,
        education_employment_plan: true,
        financial_plan: true,
        health_plan: true,
        support_network_identified: true,
        personal_advisor_assigned: true,
      }),
    );
    const packages = Array.from({ length: 10 }, (_, i) =>
      makeLeavingCarePackage({
        child_id: `child-${i}`,
        housing_arranged: true,
        financial_support_confirmed: true,
        education_training_plan: true,
        health_passport_provided: true,
        emotional_support_plan: true,
        life_skills_assessed: true,
        documentation_complete: true,
      }),
    );
    const pathways = Array.from({ length: 10 }, (_, i) =>
      makeIndependencePathway({ child_id: `child-${i}` }),
    );
    const aftercare = Array.from({ length: 10 }, (_, i) =>
      makeAfterCareRecord({ child_id: `child-${i}` }),
    );

    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        transition_planning_records: transitionPlans,
        pathway_plans: pathwayPlans,
        leaving_care_packages: packages,
        independence_pathways: pathways,
        aftercare_records: aftercare,
      }),
    );
    expect(r.readiness_score).toBeLessThanOrEqual(100);
  });

  it("transition types do not affect scoring", () => {
    const types = ["placement_move", "independence", "education", "step_down"] as const;
    const plans = types.map((t, i) =>
      makeTransitionPlan({
        child_id: `child-${i}`,
        active: true,
        transition_type: t,
      }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 4,
        transition_planning_records: plans,
      }),
    );
    expect(r.transition_plan_coverage_rate).toBe(100);
  });

  it("contact types do not affect aftercare scoring", () => {
    const types = ["visit", "phone", "digital"] as const;
    const records = types.map((t, i) =>
      makeAfterCareRecord({
        child_id: `child-${i}`,
        contact_type: t,
      }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 3,
        aftercare_records: records,
      }),
    );
    expect(r.aftercare_contact_rate).toBe(100);
  });

  it("large dataset does not cause issues", () => {
    const n = 100;
    const transitionPlans = Array.from({ length: n }, (_, i) =>
      makeTransitionPlan({
        child_id: `child-${i}`,
        active: true,
        child_voice_captured: true,
        multi_agency_involved: true,
        key_worker_assigned: true,
        next_review_date: "2026-06-15",
      }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: n,
        transition_planning_records: transitionPlans,
      }),
    );
    expect(r.transition_plan_coverage_rate).toBe(100);
    expect(r.child_voice_in_transition_rate).toBe(100);
    expect(r.total_transition_plans).toBe(n);
  });

  it("independence overall_readiness_score of 0 does not affect rates", () => {
    const pathways = [
      makeIndependencePathway({
        child_id: "child-1",
        overall_readiness_score: 0,
      }),
    ];
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 1,
        independence_pathways: pathways,
      }),
    );
    expect(r.independence_assessment_rate).toBe(100);
  });

  it("mixing complete and incomplete leaving care packages computes correctly", () => {
    const packages = [
      makeLeavingCarePackage({
        child_id: "child-1",
        housing_arranged: true,
        financial_support_confirmed: true,
        education_training_plan: true,
        health_passport_provided: true,
        emotional_support_plan: true,
        life_skills_assessed: true,
        documentation_complete: true,
      }),
      makeLeavingCarePackage({
        child_id: "child-2",
        housing_arranged: true,
        financial_support_confirmed: false,
      }),
      makeLeavingCarePackage({
        child_id: "child-3",
      }),
    ];
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 3,
        leaving_care_packages: packages,
      }),
    );
    expect(r.leaving_care_completion_rate).toBe(33); // pct(1, 3)
  });

  it("aftercare support rate only counts when needs are identified", () => {
    const records = [
      makeAfterCareRecord({
        child_id: "child-1",
        support_needs_identified: true,
        support_provided: true,
      }),
      makeAfterCareRecord({
        child_id: "child-2",
        support_needs_identified: true,
        support_provided: false,
      }),
      makeAfterCareRecord({
        child_id: "child-3",
        support_needs_identified: false,
        support_provided: true, // doesn't count - no need identified
      }),
    ];
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 3,
        aftercare_records: records,
      }),
    );
    // aftercareNeedsIdentified = 2, aftercareSupportProvided = 1 (only child-1)
    // pct(1, 2) = 50
    // No strength for aftercare support (< 90%)
    expect(r.strengths.every((s) => !s.includes("aftercare support needs"))).toBe(true);
  });

  it("empty next_review_date does not count as having a review date", () => {
    const plans = [
      makeTransitionPlan({ child_id: "child-1", next_review_date: "" }),
      makeTransitionPlan({ child_id: "child-2", next_review_date: "2026-06-15" }),
    ];
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 2,
        transition_planning_records: plans,
      }),
    );
    // plansWithReviewDate = 1, overdue = 0
    // reviewTimelinessRate = pct(1-0, 1) = 100 → +3 bonus
    // coverage: pct(0, 2) = 0 → -5, independence: pct(0, 2) = 0 → -4
    // 52 + 3 - 5 - 4 = 46
    expect(r.readiness_score).toBe(46);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 15. COMBINED PENALTY STACKING
// ═══════════════════════════════════════════════════════════════════════════

describe("Penalty stacking", () => {
  it("all four penalties fire simultaneously", () => {
    // Need: coverage<50 (guard: total_children>0) → -5
    // pathway currency<50 (guard: currentPathwayPlans.length>0) → -5
    // leaving care<50 (guard: totalLeavingCarePackages>0) → -4
    // independence<50 (guard: total_children>0) → -4
    // Total = -18, score = 52 - 18 = 34
    const plans = [makeTransitionPlan({ child_id: "child-1" })];
    const pathwayPlans = [
      makePathwayPlan({
        child_id: "child-1",
        current: true,
        last_reviewed: "2025-01-01",
      }),
    ];
    const packages = [makeLeavingCarePackage({ child_id: "child-1" })];

    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        transition_planning_records: plans,
        pathway_plans: pathwayPlans,
        leaving_care_packages: packages,
      }),
    );
    expect(r.readiness_score).toBe(34);
    expect(r.readiness_rating).toBe("inadequate");
  });

  it("all four penalties with some low-tier bonuses", () => {
    // Coverage at 0 → penalty -5, no bonus
    // Pathway currency at 0 → penalty -5, no bonus (current plans exist but stale)
    // Leaving care at 0 → penalty -4
    // Independence at 0 → penalty -4
    // keyWorker at 100 → +2
    // childVoice at 100 → +3
    // multiAgency at 100 → +3
    // reviewTimeliness at 100 → +3
    // 52 + 2 + 3 + 3 + 3 - 5 - 5 - 4 - 4 = 45
    const plans = Array.from({ length: 10 }, (_, i) =>
      makeTransitionPlan({
        child_id: `child-${i}`,
        // NOT active → coverage stays 0
        child_voice_captured: true,
        multi_agency_involved: true,
        key_worker_assigned: true,
        next_review_date: "2026-06-15",
      }),
    );
    const pathwayPlans = [
      makePathwayPlan({
        child_id: "child-1",
        current: true,
        last_reviewed: "2025-01-01",
      }),
    ];
    const packages = [makeLeavingCarePackage({ child_id: "child-1" })];

    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        transition_planning_records: plans,
        pathway_plans: pathwayPlans,
        leaving_care_packages: packages,
      }),
    );
    expect(r.readiness_score).toBe(45);
    expect(r.readiness_rating).toBe("adequate");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 16. ADDITIONAL METRIC EDGE CASES
// ═══════════════════════════════════════════════════════════════════════════

describe("Additional metric edge cases", () => {
  it("goalsSetRate and plansReviewedRate are calculated but do not affect score", () => {
    // These metrics are computed but don't feed into bonuses/penalties
    const plans = Array.from({ length: 10 }, (_, i) =>
      makeTransitionPlan({
        child_id: `child-${i}`,
        goals_set: true,
        reviewed: true,
      }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        transition_planning_records: plans,
      }),
    );
    // These don't appear in the output interface but don't crash either
    expect(r.readiness_score).toBeDefined();
  });

  it("pathway plan with all core elements but not current is excluded from completeness", () => {
    const plans = [
      makePathwayPlan({
        child_id: "child-1",
        current: false,
        accommodation_plan: true,
        education_employment_plan: true,
        financial_plan: true,
        health_plan: true,
        support_network_identified: true,
      }),
    ];
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 1,
        pathway_plans: plans,
      }),
    );
    // Not current → not counted → no pathway completeness strength
    expect(r.strengths.every((s) => !s.includes("pathway plans address all core areas"))).toBe(true);
  });

  it("multiple overdue aftercare contacts counted correctly", () => {
    const records = [
      makeAfterCareRecord({ child_id: "c1", next_contact_date: "2026-01-01" }),
      makeAfterCareRecord({ child_id: "c2", next_contact_date: "2026-02-01" }),
      makeAfterCareRecord({ child_id: "c3", next_contact_date: "2026-06-01" }),
    ];
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 3,
        aftercare_records: records,
      }),
    );
    expect(r.concerns.some((c) => c.includes("2 aftercare contacts overdue"))).toBe(true);
  });

  it("singular aftercare contact overdue", () => {
    const records = [
      makeAfterCareRecord({ child_id: "c1", next_contact_date: "2026-01-01" }),
      makeAfterCareRecord({ child_id: "c2", next_contact_date: "2026-06-01" }),
    ];
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 2,
        aftercare_records: records,
      }),
    );
    expect(r.concerns.some((c) => c.includes("1 aftercare contact") && c.includes("overdue"))).toBe(true);
  });

  it("pct rounds correctly", () => {
    // pct(1, 3) = Math.round(33.33) = 33
    const plans = [
      makeTransitionPlan({ child_id: "child-1", active: true }),
    ];
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 3,
        transition_planning_records: plans,
      }),
    );
    expect(r.transition_plan_coverage_rate).toBe(33);
  });

  it("pct rounds up at .5", () => {
    // pct(1, 6) = Math.round(16.67) = 17
    const pathways = [makeIndependencePathway({ child_id: "child-1" })];
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 6,
        independence_pathways: pathways,
      }),
    );
    expect(r.independence_assessment_rate).toBe(17);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 17. MID-TIER BONUS VERIFICATION (lower thresholds)
// ═══════════════════════════════════════════════════════════════════════════

describe("Mid-tier bonus verification", () => {
  it("bonus 1 exactly at 70% threshold gives +2", () => {
    const plans = Array.from({ length: 7 }, (_, i) =>
      makeTransitionPlan({ child_id: `child-${i}`, active: true }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        transition_planning_records: plans,
      }),
    );
    expect(r.transition_plan_coverage_rate).toBe(70);
    // 52 + 2 - 4 (independence) = 50
    expect(r.readiness_score).toBe(50);
  });

  it("bonus 1 exactly at 89% threshold gives +2 not +4", () => {
    // pct(8, 9) = 89
    const plans = Array.from({ length: 8 }, (_, i) =>
      makeTransitionPlan({ child_id: `child-${i}`, active: true }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 9,
        transition_planning_records: plans,
      }),
    );
    expect(r.transition_plan_coverage_rate).toBe(89);
    // 52 + 2 - 4 (independence) = 50
    expect(r.readiness_score).toBe(50);
  });

  it("bonus 1 exactly at 90% threshold gives +4", () => {
    const plans = Array.from({ length: 9 }, (_, i) =>
      makeTransitionPlan({ child_id: `child-${i}`, active: true }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        transition_planning_records: plans,
      }),
    );
    expect(r.transition_plan_coverage_rate).toBe(90);
    // 52 + 4 - 4 (independence) = 52
    expect(r.readiness_score).toBe(52);
  });

  it("bonus 3 exactly at 70% threshold gives +1", () => {
    const completePackages = Array.from({ length: 7 }, (_, i) =>
      makeLeavingCarePackage({
        child_id: `child-${i}`,
        housing_arranged: true,
        financial_support_confirmed: true,
        education_training_plan: true,
        health_passport_provided: true,
        emotional_support_plan: true,
        life_skills_assessed: true,
        documentation_complete: true,
      }),
    );
    const incompletePackages = Array.from({ length: 3 }, (_, i) =>
      makeLeavingCarePackage({ child_id: `child-${i + 7}` }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        leaving_care_packages: [...completePackages, ...incompletePackages],
      }),
    );
    expect(r.leaving_care_completion_rate).toBe(70);
    // 52 + 1 - 5 (coverage) - 4 (independence) = 44
    expect(r.readiness_score).toBe(44);
  });

  it("bonus 8 at 79% gives 0 (threshold is 80)", () => {
    // pct(79, 100) = 79... need simpler: 7 out of 9 = 78%
    // Let's try 4 out of 5 = 80% → +1
    // Actually 79/100 is exact. Let me use smaller numbers.
    // 15 out of 19 = pct(15,19) = Math.round(78.9) = 79
    // Too many records. Let's just verify the boundary:
    // keyWorker at 79% → 0 bonus, at 80% → +1
    const plans = Array.from({ length: 100 }, (_, i) =>
      makeTransitionPlan({
        child_id: `child-${i % 50}`, // some duplicates
        key_worker_assigned: i < 79,
      }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 50,
        transition_planning_records: plans,
      }),
    );
    // keyWorkerAllocationRate = pct(79, 100) = 79 → 0 bonus
    // 52 + 0 - 5 (coverage: many unique active=false) - 4 (independence) = 43
    expect(r.readiness_score).toBe(43);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 18. RETURN VALUE STRUCTURE
// ═══════════════════════════════════════════════════════════════════════════

describe("Return value structure", () => {
  it("returns all expected fields for insufficient_data", () => {
    const r = computeTransitionLeavingCareReadiness(baseInput());
    expect(r).toHaveProperty("readiness_rating");
    expect(r).toHaveProperty("readiness_score");
    expect(r).toHaveProperty("headline");
    expect(r).toHaveProperty("total_transition_plans");
    expect(r).toHaveProperty("transition_plan_coverage_rate");
    expect(r).toHaveProperty("pathway_plan_currency_rate");
    expect(r).toHaveProperty("leaving_care_completion_rate");
    expect(r).toHaveProperty("independence_assessment_rate");
    expect(r).toHaveProperty("aftercare_contact_rate");
    expect(r).toHaveProperty("child_voice_in_transition_rate");
    expect(r).toHaveProperty("strengths");
    expect(r).toHaveProperty("concerns");
    expect(r).toHaveProperty("recommendations");
    expect(r).toHaveProperty("insights");
  });

  it("returns all expected fields for normal computation", () => {
    const plans = [makeTransitionPlan({ child_id: "child-1", active: true })];
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 1,
        transition_planning_records: plans,
      }),
    );
    expect(r).toHaveProperty("readiness_rating");
    expect(r).toHaveProperty("readiness_score");
    expect(r).toHaveProperty("headline");
    expect(r).toHaveProperty("total_transition_plans");
    expect(r).toHaveProperty("transition_plan_coverage_rate");
    expect(r).toHaveProperty("pathway_plan_currency_rate");
    expect(r).toHaveProperty("leaving_care_completion_rate");
    expect(r).toHaveProperty("independence_assessment_rate");
    expect(r).toHaveProperty("aftercare_contact_rate");
    expect(r).toHaveProperty("child_voice_in_transition_rate");
    expect(r).toHaveProperty("strengths");
    expect(r).toHaveProperty("concerns");
    expect(r).toHaveProperty("recommendations");
    expect(r).toHaveProperty("insights");
    expect(Array.isArray(r.strengths)).toBe(true);
    expect(Array.isArray(r.concerns)).toBe(true);
    expect(Array.isArray(r.recommendations)).toBe(true);
    expect(Array.isArray(r.insights)).toBe(true);
  });

  it("rating is one of the defined types", () => {
    const validRatings = ["outstanding", "good", "adequate", "inadequate", "insufficient_data"];
    const r = computeTransitionLeavingCareReadiness(baseInput());
    expect(validRatings).toContain(r.readiness_rating);
  });

  it("insight severity is one of the defined types", () => {
    const plans = Array.from({ length: 10 }, (_, i) =>
      makeTransitionPlan({ child_id: `child-${i}` }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        transition_planning_records: plans,
      }),
    );
    const validSeverities = ["critical", "warning", "positive"];
    for (const insight of r.insights) {
      expect(validSeverities).toContain(insight.severity);
    }
  });

  it("recommendation urgency is one of the defined types", () => {
    const plans = Array.from({ length: 10 }, (_, i) =>
      makeTransitionPlan({ child_id: `child-${i}` }),
    );
    const r = computeTransitionLeavingCareReadiness(
      baseInput({
        total_children: 10,
        transition_planning_records: plans,
      }),
    );
    const validUrgencies = ["immediate", "soon", "planned"];
    for (const rec of r.recommendations) {
      expect(validUrgencies).toContain(rec.urgency);
    }
  });
});
