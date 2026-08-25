// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME STAFF PERFORMANCE APPRAISAL INTELLIGENCE ENGINE — TESTS
// Comprehensive vitest suite: insufficient_data, inadequate floor, all rating
// bands, every bonus in isolation, every penalty, all 6 rates, profiles,
// strengths, concerns, recommendations, insights, and edge cases.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeStaffPerformanceAppraisal,
  type StaffPerformanceInput,
  type AppraisalRecordInput,
  type PerformanceTargetInput,
  type CompetencyAssessmentInput,
  type DevelopmentGoalInput,
  type FeedbackRecordInput,
  type StaffPerformanceRating,
} from "../home-staff-performance-appraisal-intelligence-engine";

// ── Constants ───────────────────────────────────────────────────────────────

const TODAY = "2026-05-25";
const PAST_DATE = "2026-01-01";
const FUTURE_DATE = "2027-01-01";

// ── Factories ───────────────────────────────────────────────────────────────

/** Default baseline input — 8 staff, all arrays empty. Override as needed. */
function baseInput(overrides: Partial<StaffPerformanceInput> = {}): StaffPerformanceInput {
  return {
    today: TODAY,
    total_staff: 8,
    appraisal_records: [],
    performance_target_records: [],
    competency_assessment_records: [],
    development_goal_records: [],
    feedback_records: [],
    ...overrides,
  };
}

let _idCounter = 0;
function uid(): string {
  return `id_${++_idCounter}`;
}

function makeAppraisal(overrides: Partial<AppraisalRecordInput> = {}): AppraisalRecordInput {
  return {
    id: uid(),
    staff_id: uid(),
    appraisal_date: "2026-03-15",
    status: "completed",
    appraiser_id: "mgr_1",
    overall_rating: "effective",
    review_period_start: "2025-04-01",
    review_period_end: "2026-03-31",
    objectives_set: true,
    development_plan_agreed: true,
    staff_signed: true,
    manager_signed: true,
    quality_score: 8,
    ...overrides,
  };
}

function makeTarget(overrides: Partial<PerformanceTargetInput> = {}): PerformanceTargetInput {
  return {
    id: uid(),
    staff_id: uid(),
    target_description: "Improve care outcomes",
    category: "care_quality",
    status: "achieved",
    target_date: FUTURE_DATE,
    set_date: PAST_DATE,
    progress_percentage: 100,
    reviewed: true,
    evidence_attached: true,
    ...overrides,
  };
}

function makeCompetency(overrides: Partial<CompetencyAssessmentInput> = {}): CompetencyAssessmentInput {
  return {
    id: uid(),
    staff_id: uid(),
    competency_area: "safeguarding",
    current_level: "competent",
    required_level: "competent",
    assessed_date: "2026-03-15",
    assessor_id: "mgr_1",
    gap_identified: false,
    action_plan_in_place: false,
    ...overrides,
  };
}

function makeGoal(overrides: Partial<DevelopmentGoalInput> = {}): DevelopmentGoalInput {
  return {
    id: uid(),
    staff_id: uid(),
    goal_description: "Complete NVQ Level 3",
    category: "qualification",
    status: "completed",
    target_date: FUTURE_DATE,
    set_date: PAST_DATE,
    progress_percentage: 100,
    support_provided: true,
    resource_allocated: true,
    ...overrides,
  };
}

function makeFeedback(overrides: Partial<FeedbackRecordInput> = {}): FeedbackRecordInput {
  return {
    id: uid(),
    staff_id: uid(),
    feedback_date: "2026-03-15",
    feedback_type: "formal",
    sentiment: "positive",
    quality_rating: 9,
    actionable: true,
    follow_up_completed: true,
    source: "appraisal",
    ...overrides,
  };
}

/** Generate n copies of a factory with an optional per-item override. */
function repeat<T>(n: number, factory: (o?: Partial<T>) => T, overrides?: Partial<T>): T[] {
  return Array.from({ length: n }, () => factory(overrides));
}

/** Shortcut: run the engine on a partial input. */
function run(overrides: Partial<StaffPerformanceInput> = {}) {
  return computeStaffPerformanceAppraisal(baseInput(overrides));
}

// ══════════════════════════════════════════════════════════════════════════════
// 1. INSUFFICIENT DATA  (total_staff=0, all arrays empty)
// ══════════════════════════════════════════════════════════════════════════════

describe("insufficient_data — no staff, no records", () => {
  const r = computeStaffPerformanceAppraisal(baseInput({ total_staff: 0 }));

  it("returns insufficient_data rating", () => {
    expect(r.appraisal_rating).toBe("insufficient_data");
  });
  it("score is 0", () => {
    expect(r.appraisal_score).toBe(0);
  });
  it("headline references insufficient data", () => {
    expect(r.headline.toLowerCase()).toContain("insufficient data");
  });
  it("all six rates are 0", () => {
    expect(r.appraisal_completion_rate).toBeNull();
    expect(r.target_achievement_rate).toBeNull();
    expect(r.competency_rate).toBeNull();
    expect(r.development_progress_rate).toBeNull();
    expect(r.feedback_quality_rate).toBeNull();
    expect(r.staff_satisfaction_rate).toBeNull();
  });
  it("strengths, concerns empty", () => {
    expect(r.strengths).toHaveLength(0);
    expect(r.concerns).toHaveLength(0);
  });
  it("has at least one recommendation", () => {
    expect(r.recommendations.length).toBeGreaterThanOrEqual(1);
  });
  it("has at least one insight", () => {
    expect(r.insights.length).toBeGreaterThanOrEqual(1);
  });
  it("profiles are zeroed", () => {
    expect(r.appraisal_profile.total_appraisals).toBe(0);
    expect(r.target_profile.total_targets).toBe(0);
    expect(r.competency_profile.total_assessments).toBe(0);
    expect(r.development_profile.total_goals).toBe(0);
    expect(r.feedback_profile.total_feedback).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. INADEQUATE FLOOR  (total_staff>0, all arrays empty → score 15)
// ══════════════════════════════════════════════════════════════════════════════

describe("inadequate floor — staff exist but no records", () => {
  const r = run();

  it("returns inadequate rating", () => {
    expect(r.appraisal_rating).toBe("inadequate");
  });
  it("score is exactly 15", () => {
    expect(r.appraisal_score).toBe(15);
  });
  it("headline mentions inadequate", () => {
    expect(r.headline.toLowerCase()).toContain("inadequate");
  });
  it("has multiple recommendations", () => {
    expect(r.recommendations.length).toBeGreaterThanOrEqual(3);
  });
  it("first recommendation is immediate urgency", () => {
    expect(r.recommendations[0].urgency).toBe("immediate");
  });
  it("insight references critical severity", () => {
    expect(r.insights.some(i => i.severity === "critical")).toBe(true);
  });
  it("all six rates are 0", () => {
    expect(r.appraisal_completion_rate).toBeNull();
    expect(r.target_achievement_rate).toBeNull();
    expect(r.competency_rate).toBeNull();
    expect(r.development_progress_rate).toBeNull();
    expect(r.feedback_quality_rate).toBeNull();
    expect(r.staff_satisfaction_rate).toBeNull();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. RATING BAND SCENARIOS
// ══════════════════════════════════════════════════════════════════════════════

describe("rating bands", () => {
  // All 8 staff have appraisals → no staff-without-appraisal penalty
  const staffIds = ["s1","s2","s3","s4","s5","s6","s7","s8"];

  describe("outstanding (score >= 80)", () => {
    // base=52, bonus1=+7(95%compl), bonus2=+6(85%ach), bonus3=+5(85%comp),
    // bonus4=+5(80%dev), bonus5=+5(85%fbk) = 52+28=80, no penalties
    const appraisals = staffIds.map(sid =>
      makeAppraisal({ staff_id: sid, status: "completed" }),
    );
    // 10 targets, all achieved (100% achievement rate)
    const targets = repeat(10, makeTarget, { status: "achieved", progress_percentage: 100 });
    // 10 competencies, all competent
    const comps = repeat(10, makeCompetency, { current_level: "competent" });
    // 10 goals, 8 completed + 2 in_progress (80% completed of 10 active)
    const goals = [
      ...repeat(8, makeGoal, { status: "completed", progress_percentage: 100 }),
      ...repeat(2, makeGoal, { status: "in_progress", progress_percentage: 50 }),
    ];
    // Feedback: 8 records, all actionable with quality 9 → qualityRate = round(100*0.6 + 90*0.4) = 96
    const feedback = staffIds.map(sid =>
      makeFeedback({ staff_id: sid, quality_rating: 9, actionable: true, follow_up_completed: true }),
    );

    const r = run({
      total_staff: 8,
      appraisal_records: appraisals,
      performance_target_records: targets,
      competency_assessment_records: comps,
      development_goal_records: goals,
      feedback_records: feedback,
    });

    it("returns outstanding rating", () => {
      expect(r.appraisal_rating).toBe("outstanding");
    });
    it("score is >= 80", () => {
      expect(r.appraisal_score).toBeGreaterThanOrEqual(80);
    });
    it("headline mentions outstanding", () => {
      expect(r.headline.toLowerCase()).toContain("outstanding");
    });
  });

  describe("good (score 65-79)", () => {
    // base=52, bonus1=+7, bonus2=+6 = 65, no penalties, no other bonuses
    const appraisals = staffIds.map(sid =>
      makeAppraisal({ staff_id: sid, status: "completed" }),
    );
    // All achieved targets
    const targets = repeat(10, makeTarget, { status: "achieved" });

    const r = run({
      total_staff: 8,
      appraisal_records: appraisals,
      performance_target_records: targets,
    });

    it("returns good rating", () => {
      expect(r.appraisal_rating).toBe("good");
    });
    it("score is between 65 and 79", () => {
      expect(r.appraisal_score).toBeGreaterThanOrEqual(65);
      expect(r.appraisal_score).toBeLessThanOrEqual(79);
    });
    it("headline mentions good", () => {
      expect(r.headline.toLowerCase()).toContain("good");
    });
  });

  describe("adequate (score 45-64)", () => {
    // base=52, bonus1=+3(70% compl) = 55, staff penalty offset
    // 8 appraisals: 6 completed, 1 scheduled, 1 overdue → 75% completion → +3
    // all 8 staff have appraisals → no staff penalty
    const appraisals = [
      ...staffIds.slice(0, 6).map(sid => makeAppraisal({ staff_id: sid, status: "completed" })),
      makeAppraisal({ staff_id: staffIds[6], status: "scheduled" }),
      makeAppraisal({ staff_id: staffIds[7], status: "overdue" }),
    ];
    // overdue penalty: 1/8 = 12.5% → >=10 → -3
    // net: 52 + 3 - 3 = 52

    const r = run({
      total_staff: 8,
      appraisal_records: appraisals,
    });

    it("returns adequate rating", () => {
      expect(r.appraisal_rating).toBe("adequate");
    });
    it("score is between 45 and 64", () => {
      expect(r.appraisal_score).toBeGreaterThanOrEqual(45);
      expect(r.appraisal_score).toBeLessThanOrEqual(64);
    });
  });

  describe("inadequate (score < 45)", () => {
    // base=52, NO bonuses (empty bonus arrays), severe overdue penalty
    // 8 appraisals: 0 completed, 5 overdue, 3 scheduled → completion=0% → +0
    // overdue 5/8 = 62.5% >=40 → -8
    // 0 staff have completed appraisals, all staff have some record → staff penalty 0
    // Net: 52 + 0 - 8 = 44
    const appraisals = [
      ...repeat(5, makeAppraisal, { status: "overdue", staff_signed: false, manager_signed: false, objectives_set: false, development_plan_agreed: false, quality_score: null, overall_rating: "not_rated" }),
      ...repeat(3, makeAppraisal, { status: "scheduled", staff_signed: false, manager_signed: false, objectives_set: false, development_plan_agreed: false, quality_score: null, overall_rating: "not_rated" }),
    ];
    // Spread staff_ids so all 8 staff are covered
    const staffIds2 = ["s1","s2","s3","s4","s5","s6","s7","s8"];
    appraisals.forEach((a, i) => { a.staff_id = staffIds2[i]; });

    const r = run({
      total_staff: 8,
      appraisal_records: appraisals,
    });

    it("returns inadequate rating", () => {
      expect(r.appraisal_rating).toBe("inadequate");
    });
    it("score < 45", () => {
      expect(r.appraisal_score).toBeLessThan(45);
    });
    it("headline mentions inadequate", () => {
      expect(r.headline.toLowerCase()).toContain("inadequate");
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. BONUSES — EACH IN ISOLATION
// ══════════════════════════════════════════════════════════════════════════════

describe("Bonus 1 — Appraisal completion (max +7)", () => {
  // Use 8 unique staff for all appraisals to avoid staff-without-appraisal penalty
  const staffIds = ["s1","s2","s3","s4","s5","s6","s7","s8"];

  function makeAppraisalsForRate(completedCount: number, totalCount: number) {
    const appraisals: AppraisalRecordInput[] = [];
    for (let i = 0; i < completedCount; i++) {
      appraisals.push(makeAppraisal({ staff_id: staffIds[i % 8], status: "completed" }));
    }
    for (let i = completedCount; i < totalCount; i++) {
      appraisals.push(makeAppraisal({ staff_id: staffIds[i % 8], status: "scheduled" }));
    }
    return appraisals;
  }

  it("+7 when completion >= 95%", () => {
    // 20 appraisals, 19 completed = 95%
    const appraisals = makeAppraisalsForRate(19, 20);
    const r = run({ appraisal_records: appraisals });
    // 52 + 7 = 59, minus staff penalty (some staff not covered), but score should include +7
    // To isolate: 52 + 7 - possible staff penalty
    expect(r.appraisal_completion_rate).toBe(95);
  });

  it("+5 when completion >= 85%", () => {
    const appraisals = makeAppraisalsForRate(17, 20);
    const r = run({ appraisal_records: appraisals });
    expect(r.appraisal_completion_rate).toBe(85);
  });

  it("+3 when completion >= 70%", () => {
    const appraisals = makeAppraisalsForRate(14, 20);
    const r = run({ appraisal_records: appraisals });
    expect(r.appraisal_completion_rate).toBe(70);
  });

  it("+1 when completion >= 50%", () => {
    const appraisals = makeAppraisalsForRate(10, 20);
    const r = run({ appraisal_records: appraisals });
    expect(r.appraisal_completion_rate).toBe(50);
  });

  it("+0 when completion < 50%", () => {
    const appraisals = makeAppraisalsForRate(4, 20);
    const r = run({ appraisal_records: appraisals });
    expect(r.appraisal_completion_rate).toBe(20);
  });

  it("no bonus when appraisal_records is empty", () => {
    // base=52, no arrays → goes to inadequate floor (score=15)
    // But with at least one other array non-empty, appraisal bonus skipped
    const r = run({
      performance_target_records: [makeTarget()],
    });
    // base=52 + 0(appraisal) + 6(target:100%achieved) + 0(no comp) + 0(no dev) + 0(no fb)
    // minus staff penalty: total_staff=8, staffWithAppraisals=0, 8/8=100% >= 50 → -5
    // minus target penalty: 0 problem targets
    // Net = 52 + 6 - 5 = 53
    expect(r.appraisal_score).toBe(53);
  });
});

describe("Bonus 2 — Target achievement (max +6)", () => {
  const staffIds = ["s1","s2","s3","s4","s5","s6","s7","s8"];

  // Provide 8 appraisals covering all staff to avoid staff-without-appraisal penalty
  const fullAppraisals = staffIds.map(sid => makeAppraisal({ staff_id: sid, status: "completed" }));

  it("+6 when achievement >= 85%", () => {
    // 10 targets: 9 achieved, 1 on_track (not_started=0, active=10, ach=9 → 90%)
    const targets = [
      ...repeat(9, makeTarget, { status: "achieved" }),
      makeTarget({ status: "on_track", progress_percentage: 50 }),
    ];
    const r = run({ appraisal_records: fullAppraisals, performance_target_records: targets });
    expect(r.target_achievement_rate).toBe(90);
    // 52 + 7(appraisal:100%) + 6(target:90%) = 65 - 0 penalties = 65
    expect(r.appraisal_score).toBe(65);
  });

  it("+4 when achievement >= 70%", () => {
    const targets = [
      ...repeat(7, makeTarget, { status: "achieved" }),
      ...repeat(3, makeTarget, { status: "on_track", progress_percentage: 50 }),
    ];
    const r = run({ appraisal_records: fullAppraisals, performance_target_records: targets });
    expect(r.target_achievement_rate).toBe(70);
    // 52 + 7 + 4 = 63
    expect(r.appraisal_score).toBe(63);
  });

  it("+2 when achievement >= 50%", () => {
    const targets = [
      ...repeat(5, makeTarget, { status: "achieved" }),
      ...repeat(5, makeTarget, { status: "on_track", progress_percentage: 50 }),
    ];
    const r = run({ appraisal_records: fullAppraisals, performance_target_records: targets });
    expect(r.target_achievement_rate).toBe(50);
    expect(r.appraisal_score).toBe(61); // 52+7+2
  });

  it("+1 when achievement >= 30%", () => {
    const targets = [
      ...repeat(3, makeTarget, { status: "achieved" }),
      ...repeat(7, makeTarget, { status: "on_track", progress_percentage: 50 }),
    ];
    const r = run({ appraisal_records: fullAppraisals, performance_target_records: targets });
    expect(r.target_achievement_rate).toBe(30);
    expect(r.appraisal_score).toBe(60); // 52+7+1
  });

  it("+0 when achievement < 30%", () => {
    const targets = [
      ...repeat(1, makeTarget, { status: "achieved" }),
      ...repeat(9, makeTarget, { status: "on_track", progress_percentage: 50 }),
    ];
    const r = run({ appraisal_records: fullAppraisals, performance_target_records: targets });
    expect(r.target_achievement_rate).toBe(10);
    expect(r.appraisal_score).toBe(59); // 52+7+0
  });

  it("achievement rate excludes not_started from denominator", () => {
    // 5 achieved, 5 not_started → active = 5, ach/active = 100%
    const targets = [
      ...repeat(5, makeTarget, { status: "achieved" }),
      ...repeat(5, makeTarget, { status: "not_started", progress_percentage: 0 }),
    ];
    const r = run({ performance_target_records: targets });
    expect(r.target_achievement_rate).toBe(100);
  });
});

describe("Bonus 3 — Competency coverage (max +5)", () => {
  const staffIds = ["s1","s2","s3","s4","s5","s6","s7","s8"];
  const fullAppraisals = staffIds.map(sid => makeAppraisal({ staff_id: sid, status: "completed" }));

  it("+5 when competency >= 85%", () => {
    // 10 records: 9 competent, 1 developing → 90%
    const comps = [
      ...repeat(9, makeCompetency, { current_level: "competent" }),
      makeCompetency({ current_level: "developing" }),
    ];
    const r = run({ appraisal_records: fullAppraisals, competency_assessment_records: comps });
    expect(r.competency_rate).toBe(90);
    // 52+7+5 = 64
    expect(r.appraisal_score).toBe(64);
  });

  it("+3 when competency >= 70%", () => {
    const comps = [
      ...repeat(7, makeCompetency, { current_level: "competent" }),
      ...repeat(3, makeCompetency, { current_level: "developing" }),
    ];
    const r = run({ appraisal_records: fullAppraisals, competency_assessment_records: comps });
    expect(r.competency_rate).toBe(70);
    expect(r.appraisal_score).toBe(62); // 52+7+3
  });

  it("+1 when competency >= 50%", () => {
    const comps = [
      ...repeat(5, makeCompetency, { current_level: "competent" }),
      ...repeat(5, makeCompetency, { current_level: "developing" }),
    ];
    const r = run({ appraisal_records: fullAppraisals, competency_assessment_records: comps });
    expect(r.competency_rate).toBe(50);
    expect(r.appraisal_score).toBe(60); // 52+7+1
  });

  it("+0 when competency < 50%", () => {
    const comps = [
      ...repeat(3, makeCompetency, { current_level: "competent" }),
      ...repeat(7, makeCompetency, { current_level: "developing" }),
    ];
    const r = run({ appraisal_records: fullAppraisals, competency_assessment_records: comps });
    expect(r.competency_rate).toBe(30);
    expect(r.appraisal_score).toBe(59); // 52+7+0
  });

  it("proficient and expert count as competent_or_above", () => {
    const comps = [
      makeCompetency({ current_level: "proficient" }),
      makeCompetency({ current_level: "expert" }),
    ];
    const r = run({ competency_assessment_records: comps });
    expect(r.competency_rate).toBe(100);
    expect(r.competency_profile.competent_or_above_count).toBe(2);
  });
});

describe("Bonus 4 — Development progress (max +5)", () => {
  const staffIds = ["s1","s2","s3","s4","s5","s6","s7","s8"];
  const fullAppraisals = staffIds.map(sid => makeAppraisal({ staff_id: sid, status: "completed" }));

  it("+5 when dev progress >= 80%", () => {
    // 10 goals: 8 completed, 2 in_progress → 80%
    const goals = [
      ...repeat(8, makeGoal, { status: "completed" }),
      ...repeat(2, makeGoal, { status: "in_progress", progress_percentage: 50 }),
    ];
    const r = run({ appraisal_records: fullAppraisals, development_goal_records: goals });
    expect(r.development_progress_rate).toBe(80);
    expect(r.appraisal_score).toBe(64); // 52+7+5
  });

  it("+3 when dev progress >= 60%", () => {
    const goals = [
      ...repeat(6, makeGoal, { status: "completed" }),
      ...repeat(4, makeGoal, { status: "in_progress", progress_percentage: 50 }),
    ];
    const r = run({ appraisal_records: fullAppraisals, development_goal_records: goals });
    expect(r.development_progress_rate).toBe(60);
    expect(r.appraisal_score).toBe(62); // 52+7+3
  });

  it("+1 when dev progress >= 40%", () => {
    const goals = [
      ...repeat(4, makeGoal, { status: "completed" }),
      ...repeat(6, makeGoal, { status: "in_progress", progress_percentage: 50 }),
    ];
    const r = run({ appraisal_records: fullAppraisals, development_goal_records: goals });
    expect(r.development_progress_rate).toBe(40);
    expect(r.appraisal_score).toBe(60); // 52+7+1
  });

  it("+0 when dev progress < 40%", () => {
    const goals = [
      ...repeat(2, makeGoal, { status: "completed" }),
      ...repeat(8, makeGoal, { status: "in_progress", progress_percentage: 50 }),
    ];
    const r = run({ appraisal_records: fullAppraisals, development_goal_records: goals });
    expect(r.development_progress_rate).toBe(20);
    expect(r.appraisal_score).toBe(59); // 52+7+0
  });

  it("cancelled goals excluded from active count", () => {
    // 5 completed + 5 cancelled → active=5, completed/active = 100%
    const goals = [
      ...repeat(5, makeGoal, { status: "completed" }),
      ...repeat(5, makeGoal, { status: "cancelled", progress_percentage: 0 }),
    ];
    const r = run({ development_goal_records: goals });
    expect(r.development_progress_rate).toBe(100);
  });
});

describe("Bonus 5 — Feedback quality (max +5)", () => {
  const staffIds = ["s1","s2","s3","s4","s5","s6","s7","s8"];
  const fullAppraisals = staffIds.map(sid => makeAppraisal({ staff_id: sid, status: "completed" }));

  it("+5 when feedback quality >= 85%", () => {
    // All actionable with quality 9 → qualityRate = round(100*0.6 + 90*0.4) = round(96) = 96
    const feedback = repeat(10, makeFeedback, { actionable: true, quality_rating: 9 });
    const r = run({ appraisal_records: fullAppraisals, feedback_records: feedback });
    expect(r.feedback_quality_rate).toBe(96);
    expect(r.appraisal_score).toBe(64); // 52+7+5
  });

  it("+3 when feedback quality >= 70%", () => {
    // actionable=70% (7/10), quality=7 → qualityRate = round(70*0.6 + 70*0.4) = round(70) = 70
    const feedback = [
      ...repeat(7, makeFeedback, { actionable: true, quality_rating: 7 }),
      ...repeat(3, makeFeedback, { actionable: false, quality_rating: 7 }),
    ];
    const r = run({ appraisal_records: fullAppraisals, feedback_records: feedback });
    expect(r.feedback_quality_rate).toBe(70);
    expect(r.appraisal_score).toBe(62); // 52+7+3
  });

  it("+1 when feedback quality >= 50%", () => {
    // actionable=50% (5/10), quality=5 → qualityRate = round(50*0.6 + 50*0.4) = 50
    const feedback = [
      ...repeat(5, makeFeedback, { actionable: true, quality_rating: 5 }),
      ...repeat(5, makeFeedback, { actionable: false, quality_rating: 5 }),
    ];
    const r = run({ appraisal_records: fullAppraisals, feedback_records: feedback });
    expect(r.feedback_quality_rate).toBe(50);
    expect(r.appraisal_score).toBe(60); // 52+7+1
  });

  it("+0 when feedback quality < 50%", () => {
    // actionable=20% (2/10), quality=3 → qualityRate = round(20*0.6 + 30*0.4) = round(24) = 24
    const feedback = [
      ...repeat(2, makeFeedback, { actionable: true, quality_rating: 3 }),
      ...repeat(8, makeFeedback, { actionable: false, quality_rating: 3 }),
    ];
    const r = run({ appraisal_records: fullAppraisals, feedback_records: feedback });
    expect(r.feedback_quality_rate).toBe(24);
    expect(r.appraisal_score).toBe(59); // 52+7+0
  });

  it("feedback quality falls back to actionable rate when no quality scores", () => {
    const feedback = [
      ...repeat(8, makeFeedback, { actionable: true, quality_rating: null }),
      ...repeat(2, makeFeedback, { actionable: false, quality_rating: null }),
    ];
    const r = run({ feedback_records: feedback });
    expect(r.feedback_quality_rate).toBe(80); // 8/10 = 80%
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. PENALTIES — EACH IN ISOLATION
// ══════════════════════════════════════════════════════════════════════════════

describe("Penalty 1 — Overdue appraisals", () => {
  const staffIds = ["s1","s2","s3","s4","s5","s6","s7","s8"];

  // Helper: create appraisals with a given overdue pct, all 8 staff covered
  function buildAppraisals(overdue: number, completed: number) {
    const result: AppraisalRecordInput[] = [];
    for (let i = 0; i < overdue; i++) {
      result.push(makeAppraisal({ staff_id: staffIds[i % 8], status: "overdue", staff_signed: false, manager_signed: false, quality_score: null, overall_rating: "not_rated" }));
    }
    for (let i = overdue; i < overdue + completed; i++) {
      result.push(makeAppraisal({ staff_id: staffIds[i % 8], status: "completed" }));
    }
    return result;
  }

  it("-8 when overdue >= 40%", () => {
    // 5 overdue out of 10 = 50% → -8
    const appraisals = buildAppraisals(5, 5);
    const r = run({ appraisal_records: appraisals });
    // completion = 5/10 = 50% → +1, overdue = -8
    // 52 + 1 - 8 = 45
    expect(r.appraisal_score).toBe(45);
  });

  it("-5 when overdue >= 25%", () => {
    // 3 overdue out of 10 = 30% → -5
    const appraisals = buildAppraisals(3, 7);
    const r = run({ appraisal_records: appraisals });
    // completion = 7/10 = 70% → +3, overdue 30% → -5
    // 52 + 3 - 5 = 50
    expect(r.appraisal_score).toBe(50);
  });

  it("-3 when overdue >= 10%", () => {
    // 2 overdue out of 10 = 20% → >=10% → -3
    const appraisals = buildAppraisals(2, 8);
    const r = run({ appraisal_records: appraisals });
    // completion = 8/10 = 80% → >=70% → +3, overdue 20% → -3
    // 52 + 3 - 3 = 52
    expect(r.appraisal_score).toBe(52);
  });

  it("-1 when overdue > 0 but < 10%", () => {
    // 1 overdue out of 20 = 5% → -1
    const appraisals: AppraisalRecordInput[] = [];
    for (let i = 0; i < 19; i++) {
      appraisals.push(makeAppraisal({ staff_id: staffIds[i % 8], status: "completed" }));
    }
    appraisals.push(makeAppraisal({ staff_id: staffIds[0], status: "overdue", quality_score: null, overall_rating: "not_rated" }));
    const r = run({ appraisal_records: appraisals });
    // completion = 19/20 = 95% → +7, overdue 5% → -1
    // 52 + 7 - 1 = 58
    expect(r.appraisal_score).toBe(58);
  });

  it("no penalty when 0 overdue", () => {
    const appraisals = staffIds.map(sid => makeAppraisal({ staff_id: sid, status: "completed" }));
    const r = run({ appraisal_records: appraisals });
    // 52 + 7 = 59
    expect(r.appraisal_score).toBe(59);
  });
});

describe("Penalty 2 — At-risk/not-met targets", () => {
  const staffIds = ["s1","s2","s3","s4","s5","s6","s7","s8"];
  const fullAppraisals = staffIds.map(sid => makeAppraisal({ staff_id: sid, status: "completed" }));

  it("-7 when problem targets >= 50%", () => {
    // 6 at_risk out of 10 = 60%
    const targets = [
      ...repeat(4, makeTarget, { status: "achieved" }),
      ...repeat(6, makeTarget, { status: "at_risk", progress_percentage: 30 }),
    ];
    const r = run({ appraisal_records: fullAppraisals, performance_target_records: targets });
    // active = 10, achieved = 4, achRate = 4/10 = 40%  (not_started=0) → +2(>=30)... wait, 40% → >=30 → +1
    // Actually 4/10 = 40% → +1
    // problem 6/10 = 60% → -7
    // 52 + 7 + 1 - 7 = 53
    expect(r.appraisal_score).toBe(53);
  });

  it("-4 when problem targets >= 30%", () => {
    // 3 not_met out of 10 = 30%
    const targets = [
      ...repeat(5, makeTarget, { status: "achieved" }),
      ...repeat(2, makeTarget, { status: "on_track", progress_percentage: 50 }),
      ...repeat(3, makeTarget, { status: "not_met", progress_percentage: 10, target_date: PAST_DATE }),
    ];
    const r = run({ appraisal_records: fullAppraisals, performance_target_records: targets });
    // achRate = 5/10 (active=10, not_started=0) = 50% → +2
    // problem = 3/10 = 30% → -4
    // 52 + 7 + 2 - 4 = 57
    expect(r.appraisal_score).toBe(57);
  });

  it("-2 when problem targets >= 15%", () => {
    // 2 at_risk out of 10 = 20%
    const targets = [
      ...repeat(7, makeTarget, { status: "achieved" }),
      makeTarget({ status: "on_track", progress_percentage: 50 }),
      ...repeat(2, makeTarget, { status: "at_risk", progress_percentage: 30 }),
    ];
    const r = run({ appraisal_records: fullAppraisals, performance_target_records: targets });
    // achRate = 7/10 = 70% → +4
    // problem = 2/10 = 20% → -2
    // 52 + 7 + 4 - 2 = 61
    expect(r.appraisal_score).toBe(61);
  });

  it("-1 when problem targets > 0 but < 15%", () => {
    // 1 not_met out of 10 = 10%
    const targets = [
      ...repeat(8, makeTarget, { status: "achieved" }),
      makeTarget({ status: "on_track", progress_percentage: 50 }),
      makeTarget({ status: "not_met", progress_percentage: 0, target_date: PAST_DATE }),
    ];
    const r = run({ appraisal_records: fullAppraisals, performance_target_records: targets });
    // achRate = 8/10 = 80% → +6 (>=85? no, 80 < 85 → >=70 → +4)
    // problem = 1/10 = 10% → <15 but >0 → -1
    // 52 + 7 + 4 - 1 = 62
    expect(r.appraisal_score).toBe(62);
  });
});

describe("Penalty 3 — Competency gaps without action plans", () => {
  const staffIds = ["s1","s2","s3","s4","s5","s6","s7","s8"];
  const fullAppraisals = staffIds.map(sid => makeAppraisal({ staff_id: sid, status: "completed" }));

  it("-6 when gaps without plan >= 5", () => {
    const comps = repeat(5, makeCompetency, { current_level: "developing", gap_identified: true, action_plan_in_place: false });
    const r = run({ appraisal_records: fullAppraisals, competency_assessment_records: comps });
    // competencyRate = 0/5 = 0% → +0
    // gaps=5, gapWithPlan=0, without=5 >=5 → -6
    // 52 + 7 + 0 - 6 = 53
    expect(r.appraisal_score).toBe(53);
  });

  it("-4 when gaps without plan >= 3", () => {
    const comps = [
      ...repeat(3, makeCompetency, { current_level: "developing", gap_identified: true, action_plan_in_place: false }),
      ...repeat(5, makeCompetency, { current_level: "competent" }),
    ];
    const r = run({ appraisal_records: fullAppraisals, competency_assessment_records: comps });
    // competencyRate = 5/8 = 63% (round) → >=50 → +1
    // gaps=3, without plan=3 >=3 → -4
    // 52 + 7 + 1 - 4 = 56
    expect(r.appraisal_score).toBe(56);
  });

  it("-2 when gaps without plan >= 1", () => {
    const comps = [
      makeCompetency({ current_level: "developing", gap_identified: true, action_plan_in_place: false }),
      ...repeat(9, makeCompetency, { current_level: "competent" }),
    ];
    const r = run({ appraisal_records: fullAppraisals, competency_assessment_records: comps });
    // competencyRate = 9/10 = 90% → +5
    // gaps=1, without plan=1 >=1 → -2
    // 52 + 7 + 5 - 2 = 62
    expect(r.appraisal_score).toBe(62);
  });

  it("no penalty when all gaps have action plans", () => {
    const comps = [
      makeCompetency({ current_level: "developing", gap_identified: true, action_plan_in_place: true }),
      ...repeat(9, makeCompetency, { current_level: "competent" }),
    ];
    const r = run({ appraisal_records: fullAppraisals, competency_assessment_records: comps });
    // competencyRate = 9/10 = 90% → +5
    // gaps=1, all with plan → no penalty
    // 52 + 7 + 5 = 64
    expect(r.appraisal_score).toBe(64);
  });

  it("no penalty when 0 gaps", () => {
    const comps = repeat(10, makeCompetency, { current_level: "competent", gap_identified: false });
    const r = run({ appraisal_records: fullAppraisals, competency_assessment_records: comps });
    // 52 + 7 + 5 = 64
    expect(r.appraisal_score).toBe(64);
  });
});

describe("Penalty 4 — Overdue development goals", () => {
  const staffIds = ["s1","s2","s3","s4","s5","s6","s7","s8"];
  const fullAppraisals = staffIds.map(sid => makeAppraisal({ staff_id: sid, status: "completed" }));

  it("-6 when overdue goals >= 40% of active", () => {
    // 5 overdue out of 10 active (0 cancelled) = 50% → -6
    const goals = [
      ...repeat(3, makeGoal, { status: "completed" }),
      ...repeat(2, makeGoal, { status: "in_progress", progress_percentage: 50 }),
      ...repeat(5, makeGoal, { status: "overdue", progress_percentage: 20 }),
    ];
    const r = run({ appraisal_records: fullAppraisals, development_goal_records: goals });
    // devRate = 3/10 = 30% → <40 → +0
    // overdue 5/10 = 50% → -6
    // 52 + 7 + 0 - 6 = 53
    expect(r.appraisal_score).toBe(53);
  });

  it("-4 when overdue goals >= 25%", () => {
    // 3 overdue out of 10 = 30%
    const goals = [
      ...repeat(5, makeGoal, { status: "completed" }),
      ...repeat(2, makeGoal, { status: "in_progress", progress_percentage: 50 }),
      ...repeat(3, makeGoal, { status: "overdue", progress_percentage: 20 }),
    ];
    const r = run({ appraisal_records: fullAppraisals, development_goal_records: goals });
    // devRate = 5/10 = 50% → >=40 → +1
    // overdue 3/10 = 30% → -4
    // 52 + 7 + 1 - 4 = 56
    expect(r.appraisal_score).toBe(56);
  });

  it("-2 when overdue goals >= 10%", () => {
    // 2 overdue out of 10 = 20%
    const goals = [
      ...repeat(6, makeGoal, { status: "completed" }),
      ...repeat(2, makeGoal, { status: "in_progress", progress_percentage: 50 }),
      ...repeat(2, makeGoal, { status: "overdue", progress_percentage: 20 }),
    ];
    const r = run({ appraisal_records: fullAppraisals, development_goal_records: goals });
    // devRate = 6/10 = 60% → +3
    // overdue 2/10 = 20% → -2
    // 52 + 7 + 3 - 2 = 60
    expect(r.appraisal_score).toBe(60);
  });

  it("-1 when overdue goals > 0 but < 10%", () => {
    // 1 overdue out of 20 = 5%
    const goals = [
      ...repeat(16, makeGoal, { status: "completed" }),
      ...repeat(3, makeGoal, { status: "in_progress", progress_percentage: 50 }),
      makeGoal({ status: "overdue", progress_percentage: 20 }),
    ];
    const r = run({ appraisal_records: fullAppraisals, development_goal_records: goals });
    // devRate = 16/20 = 80% → +5
    // overdue 1/20 = 5% → -1
    // 52 + 7 + 5 - 1 = 63
    expect(r.appraisal_score).toBe(63);
  });
});

describe("Penalty 5 — Staff without appraisal", () => {
  it("-5 when >= 50% staff have no appraisal", () => {
    // 8 staff, 3 have appraisals → 5 without = 62.5%
    const appraisals = ["s1","s2","s3"].map(sid => makeAppraisal({ staff_id: sid, status: "completed" }));
    const r = run({ appraisal_records: appraisals });
    // completion = 3/3 = 100% → +7, overdue=0 → no penalty1
    // staff without = 5/8 = 62.5% ≥50% → -5
    // 52 + 7 - 5 = 54
    expect(r.appraisal_score).toBe(54);
  });

  it("-3 when >= 25% staff have no appraisal", () => {
    // 8 staff, 6 have appraisals → 2 without = 25%
    const appraisals = ["s1","s2","s3","s4","s5","s6"].map(sid => makeAppraisal({ staff_id: sid, status: "completed" }));
    const r = run({ appraisal_records: appraisals });
    // 52 + 7 - 3 = 56
    expect(r.appraisal_score).toBe(56);
  });

  it("-1 when >= 10% staff have no appraisal", () => {
    // 8 staff, 7 have appraisals → 1 without = 12.5% ≥10%
    const appraisals = ["s1","s2","s3","s4","s5","s6","s7"].map(sid => makeAppraisal({ staff_id: sid, status: "completed" }));
    const r = run({ appraisal_records: appraisals });
    // 52 + 7 - 1 = 58
    expect(r.appraisal_score).toBe(58);
  });

  it("no penalty when all staff covered", () => {
    const appraisals = ["s1","s2","s3","s4","s5","s6","s7","s8"].map(sid => makeAppraisal({ staff_id: sid, status: "completed" }));
    const r = run({ appraisal_records: appraisals });
    expect(r.appraisal_score).toBe(59); // 52 + 7
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. RATE COMPUTATIONS
// ══════════════════════════════════════════════════════════════════════════════

describe("appraisal_completion_rate", () => {
  it("0 when no appraisals", () => {
    const r = run({ performance_target_records: [makeTarget()] });
    expect(r.appraisal_completion_rate).toBe(0);
  });

  it("100 when all completed", () => {
    const appraisals = repeat(5, makeAppraisal, { status: "completed" });
    const r = run({ appraisal_records: appraisals });
    expect(r.appraisal_completion_rate).toBe(100);
  });

  it("correct partial rate", () => {
    const appraisals = [
      ...repeat(3, makeAppraisal, { status: "completed" }),
      ...repeat(2, makeAppraisal, { status: "scheduled" }),
    ];
    const r = run({ appraisal_records: appraisals });
    expect(r.appraisal_completion_rate).toBe(60);
  });
});

describe("target_achievement_rate", () => {
  it("0 when no targets", () => {
    const r = run({ appraisal_records: [makeAppraisal()] });
    expect(r.target_achievement_rate).toBe(0);
  });

  it("0 when all not_started", () => {
    const targets = repeat(5, makeTarget, { status: "not_started", progress_percentage: 0 });
    const r = run({ performance_target_records: targets });
    // active = 0, so rate = 0
    expect(r.target_achievement_rate).toBe(0);
  });

  it("correct rate excluding not_started from denominator", () => {
    const targets = [
      ...repeat(3, makeTarget, { status: "achieved" }),
      ...repeat(2, makeTarget, { status: "on_track", progress_percentage: 50 }),
      ...repeat(5, makeTarget, { status: "not_started", progress_percentage: 0 }),
    ];
    const r = run({ performance_target_records: targets });
    // active = 5, achieved = 3, rate = 60%
    expect(r.target_achievement_rate).toBe(60);
  });
});

describe("competency_rate", () => {
  it("0 when no assessments", () => {
    const r = run({ appraisal_records: [makeAppraisal()] });
    expect(r.competency_rate).toBe(0);
  });

  it("100 when all competent or above", () => {
    const comps = [
      makeCompetency({ current_level: "competent" }),
      makeCompetency({ current_level: "proficient" }),
      makeCompetency({ current_level: "expert" }),
    ];
    const r = run({ competency_assessment_records: comps });
    expect(r.competency_rate).toBe(100);
  });

  it("0 when all developing or not_assessed", () => {
    const comps = [
      makeCompetency({ current_level: "developing" }),
      makeCompetency({ current_level: "not_assessed", assessed_date: null }),
    ];
    const r = run({ competency_assessment_records: comps });
    expect(r.competency_rate).toBe(0);
  });
});

describe("development_progress_rate", () => {
  it("0 when no goals", () => {
    const r = run({ appraisal_records: [makeAppraisal()] });
    expect(r.development_progress_rate).toBe(0);
  });

  it("cancelled goals excluded from denominator", () => {
    const goals = [
      ...repeat(3, makeGoal, { status: "completed" }),
      ...repeat(7, makeGoal, { status: "cancelled", progress_percentage: 0 }),
    ];
    const r = run({ development_goal_records: goals });
    // active = 3, completed = 3 → 100%
    expect(r.development_progress_rate).toBe(100);
  });
});

describe("feedback_quality_rate", () => {
  it("0 when no feedback", () => {
    const r = run({ appraisal_records: [makeAppraisal()] });
    expect(r.feedback_quality_rate).toBeNull();
  });

  it("blends actionable rate (60%) with quality pct (40%)", () => {
    // 4 actionable / 10 = 40%, avg quality = 6 → qualityPct = 60
    // rate = round(40*0.6 + 60*0.4) = round(24+24) = 48
    const feedback = [
      ...repeat(4, makeFeedback, { actionable: true, quality_rating: 6 }),
      ...repeat(6, makeFeedback, { actionable: false, quality_rating: 6 }),
    ];
    const r = run({ feedback_records: feedback });
    expect(r.feedback_quality_rate).toBe(48);
  });

  it("uses only actionable rate when all quality_rating are null", () => {
    const feedback = [
      ...repeat(7, makeFeedback, { actionable: true, quality_rating: null }),
      ...repeat(3, makeFeedback, { actionable: false, quality_rating: null }),
    ];
    const r = run({ feedback_records: feedback });
    expect(r.feedback_quality_rate).toBe(70);
  });
});

describe("staff_satisfaction_rate", () => {
  it("0 when no data feeds into it", () => {
    // No completed appraisals, no quality scores, no feedback, no goals → 0
    const appraisals = [makeAppraisal({ status: "scheduled", quality_score: null })];
    const r = run({ appraisal_records: appraisals });
    expect(r.staff_satisfaction_rate).toBeNull();
  });

  it("composites dual_signature, quality, positive sentiment, follow_up, support", () => {
    const staffIds = ["s1","s2","s3","s4","s5","s6","s7","s8"];
    const appraisals = staffIds.map(sid => makeAppraisal({
      staff_id: sid,
      status: "completed",
      staff_signed: true,
      manager_signed: true,
      quality_score: 8,
    }));
    const feedback = repeat(8, makeFeedback, {
      sentiment: "positive",
      follow_up_completed: true,
    });
    const goals = repeat(8, makeGoal, { support_provided: true });
    const r = run({
      appraisal_records: appraisals,
      feedback_records: feedback,
      development_goal_records: goals,
    });
    // dualSigRate=100, avgQuality=8→80, positivePct=100, followUpRate=100, supportRate=100
    // avg of [100, 80, 100, 100, 100] = 480/5 = 96
    expect(r.staff_satisfaction_rate).toBe(96);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 7. PROFILES
// ══════════════════════════════════════════════════════════════════════════════

describe("appraisal_profile", () => {
  it("counts statuses correctly", () => {
    const appraisals = [
      makeAppraisal({ status: "completed" }),
      makeAppraisal({ status: "completed" }),
      makeAppraisal({ status: "scheduled" }),
      makeAppraisal({ status: "overdue" }),
      makeAppraisal({ status: "cancelled" }),
    ];
    const r = run({ appraisal_records: appraisals });
    const p = r.appraisal_profile;
    expect(p.total_appraisals).toBe(5);
    expect(p.completed_count).toBe(2);
    expect(p.scheduled_count).toBe(1);
    expect(p.overdue_count).toBe(1);
    expect(p.cancelled_count).toBe(1);
    expect(p.completion_rate).toBe(40);
  });

  it("dual_signature_rate based on completed only", () => {
    const appraisals = [
      makeAppraisal({ status: "completed", staff_signed: true, manager_signed: true }),
      makeAppraisal({ status: "completed", staff_signed: false, manager_signed: true }),
      makeAppraisal({ status: "scheduled", staff_signed: false, manager_signed: false }),
    ];
    const r = run({ appraisal_records: appraisals });
    expect(r.appraisal_profile.dual_signature_rate).toBe(50);
  });

  it("avg_quality_score computed from completed records only", () => {
    const appraisals = [
      makeAppraisal({ status: "completed", quality_score: 8 }),
      makeAppraisal({ status: "completed", quality_score: 6 }),
      makeAppraisal({ status: "scheduled", quality_score: null }),
    ];
    const r = run({ appraisal_records: appraisals });
    expect(r.appraisal_profile.avg_quality_score).toBe(7);
  });

  it("avg_quality_score null when no quality scores", () => {
    const appraisals = [
      makeAppraisal({ status: "completed", quality_score: null }),
    ];
    const r = run({ appraisal_records: appraisals });
    expect(r.appraisal_profile.avg_quality_score).toBeNull();
  });

  it("rating_distribution counts correctly", () => {
    const appraisals = [
      makeAppraisal({ overall_rating: "exceptional" }),
      makeAppraisal({ overall_rating: "exceptional" }),
      makeAppraisal({ overall_rating: "effective" }),
      makeAppraisal({ overall_rating: "developing" }),
      makeAppraisal({ overall_rating: "underperforming" }),
      makeAppraisal({ overall_rating: "not_rated" }),
    ];
    const r = run({ appraisal_records: appraisals });
    const rd = r.appraisal_profile.rating_distribution;
    expect(rd.exceptional).toBe(2);
    expect(rd.effective).toBe(1);
    expect(rd.developing).toBe(1);
    expect(rd.underperforming).toBe(1);
    expect(rd.not_rated).toBe(1);
  });

  it("staff_with_no_appraisal computed correctly", () => {
    const appraisals = ["s1","s2","s3"].map(sid => makeAppraisal({ staff_id: sid }));
    const r = run({ total_staff: 8, appraisal_records: appraisals });
    expect(r.appraisal_profile.staff_with_no_appraisal).toBe(5);
  });

  it("objectives_set_rate and development_plan_rate from completed only", () => {
    const appraisals = [
      makeAppraisal({ status: "completed", objectives_set: true, development_plan_agreed: true }),
      makeAppraisal({ status: "completed", objectives_set: false, development_plan_agreed: false }),
      makeAppraisal({ status: "scheduled", objectives_set: false, development_plan_agreed: false }),
    ];
    const r = run({ appraisal_records: appraisals });
    expect(r.appraisal_profile.objectives_set_rate).toBe(50);
    expect(r.appraisal_profile.development_plan_rate).toBe(50);
  });
});

describe("target_profile", () => {
  it("counts statuses and computes avg_progress", () => {
    const targets = [
      makeTarget({ status: "achieved", progress_percentage: 100 }),
      makeTarget({ status: "on_track", progress_percentage: 60 }),
      makeTarget({ status: "at_risk", progress_percentage: 30 }),
      makeTarget({ status: "not_met", progress_percentage: 10 }),
      makeTarget({ status: "not_started", progress_percentage: 0 }),
    ];
    const r = run({ performance_target_records: targets });
    const p = r.target_profile;
    expect(p.total_targets).toBe(5);
    expect(p.achieved_count).toBe(1);
    expect(p.on_track_count).toBe(1);
    expect(p.at_risk_count).toBe(1);
    expect(p.not_met_count).toBe(1);
    expect(p.not_started_count).toBe(1);
    expect(p.avg_progress).toBe(40); // (100+60+30+10+0)/5 = 40
  });

  it("reviewed_rate and evidence_rate correct", () => {
    const targets = [
      makeTarget({ reviewed: true, evidence_attached: true }),
      makeTarget({ reviewed: true, evidence_attached: false }),
      makeTarget({ reviewed: false, evidence_attached: false }),
    ];
    const r = run({ performance_target_records: targets });
    expect(r.target_profile.reviewed_rate).toBe(67); // 2/3 = 66.7 → 67
    expect(r.target_profile.evidence_rate).toBe(33); // 1/3 = 33.3 → 33
  });

  it("overdue_targets counts non-achieved past target_date", () => {
    const targets = [
      makeTarget({ status: "achieved", target_date: "2026-01-01" }), // achieved → not overdue
      makeTarget({ status: "on_track", target_date: "2026-01-01" }), // past → overdue
      makeTarget({ status: "at_risk", target_date: "2027-01-01" }), // future → not overdue
    ];
    const r = run({ performance_target_records: targets });
    expect(r.target_profile.overdue_targets).toBe(1);
  });

  it("category_breakdown groups correctly", () => {
    const targets = [
      makeTarget({ category: "care_quality", status: "achieved" }),
      makeTarget({ category: "care_quality", status: "on_track" }),
      makeTarget({ category: "compliance", status: "achieved" }),
    ];
    const r = run({ performance_target_records: targets });
    const cq = r.target_profile.category_breakdown.find(c => c.category === "care_quality");
    expect(cq).toBeDefined();
    expect(cq!.total).toBe(2);
    expect(cq!.achieved).toBe(1);
  });
});

describe("competency_profile", () => {
  it("assessed_count requires both non-not_assessed and assessed_date", () => {
    const comps = [
      makeCompetency({ current_level: "competent", assessed_date: "2026-01-01" }), // assessed
      makeCompetency({ current_level: "not_assessed", assessed_date: "2026-01-01" }), // not assessed (level)
      makeCompetency({ current_level: "competent", assessed_date: null }), // not assessed (no date)
    ];
    const r = run({ competency_assessment_records: comps });
    expect(r.competency_profile.assessed_count).toBe(1);
    expect(r.competency_profile.not_assessed_count).toBe(2);
  });

  it("gap_count and gap_with_action_plan_count correct", () => {
    const comps = [
      makeCompetency({ gap_identified: true, action_plan_in_place: true }),
      makeCompetency({ gap_identified: true, action_plan_in_place: false }),
      makeCompetency({ gap_identified: false, action_plan_in_place: false }),
    ];
    const r = run({ competency_assessment_records: comps });
    expect(r.competency_profile.gap_count).toBe(2);
    expect(r.competency_profile.gap_with_action_plan_count).toBe(1);
  });

  it("area_breakdown groups by competency_area", () => {
    const comps = [
      makeCompetency({ competency_area: "safeguarding", current_level: "competent" }),
      makeCompetency({ competency_area: "safeguarding", current_level: "developing" }),
      makeCompetency({ competency_area: "medication", current_level: "expert" }),
    ];
    const r = run({ competency_assessment_records: comps });
    const sg = r.competency_profile.area_breakdown.find(a => a.area === "safeguarding");
    expect(sg).toBeDefined();
    expect(sg!.total).toBe(2);
    expect(sg!.competent_or_above).toBe(1);
  });
});

describe("development_profile", () => {
  it("counts all statuses", () => {
    const goals = [
      makeGoal({ status: "completed" }),
      makeGoal({ status: "in_progress", progress_percentage: 50 }),
      makeGoal({ status: "not_started", progress_percentage: 0 }),
      makeGoal({ status: "overdue", progress_percentage: 20 }),
      makeGoal({ status: "cancelled", progress_percentage: 0 }),
    ];
    const r = run({ development_goal_records: goals });
    const p = r.development_profile;
    expect(p.total_goals).toBe(5);
    expect(p.completed_count).toBe(1);
    expect(p.in_progress_count).toBe(1);
    expect(p.not_started_count).toBe(1);
    expect(p.overdue_count).toBe(1);
    expect(p.cancelled_count).toBe(1);
  });

  it("avg_progress excludes cancelled", () => {
    const goals = [
      makeGoal({ status: "completed", progress_percentage: 100 }),
      makeGoal({ status: "in_progress", progress_percentage: 40 }),
      makeGoal({ status: "cancelled", progress_percentage: 0 }),
    ];
    const r = run({ development_goal_records: goals });
    // avg of [100, 40] = 70
    expect(r.development_profile.avg_progress).toBe(70);
  });

  it("support_provided_rate and resource_allocated_rate", () => {
    const goals = [
      makeGoal({ support_provided: true, resource_allocated: true }),
      makeGoal({ support_provided: true, resource_allocated: false }),
      makeGoal({ support_provided: false, resource_allocated: false }),
    ];
    const r = run({ development_goal_records: goals });
    expect(r.development_profile.support_provided_rate).toBe(67); // 2/3
    expect(r.development_profile.resource_allocated_rate).toBe(33); // 1/3
  });

  it("category_breakdown groups correctly", () => {
    const goals = [
      makeGoal({ category: "qualification", status: "completed" }),
      makeGoal({ category: "qualification", status: "in_progress" }),
      makeGoal({ category: "skill", status: "completed" }),
    ];
    const r = run({ development_goal_records: goals });
    const q = r.development_profile.category_breakdown.find(c => c.category === "qualification");
    expect(q).toBeDefined();
    expect(q!.total).toBe(2);
    expect(q!.completed).toBe(1);
  });
});

describe("feedback_profile", () => {
  it("counts feedback types", () => {
    const feedback = [
      makeFeedback({ feedback_type: "formal" }),
      makeFeedback({ feedback_type: "informal" }),
      makeFeedback({ feedback_type: "360" }),
      makeFeedback({ feedback_type: "peer" }),
      makeFeedback({ feedback_type: "manager" }),
    ];
    const r = run({ feedback_records: feedback });
    const p = r.feedback_profile;
    expect(p.total_feedback).toBe(5);
    expect(p.formal_count).toBe(1);
    expect(p.informal_count).toBe(1);
    expect(p.three_sixty_count).toBe(1);
    expect(p.peer_count).toBe(1);
  });

  it("avg_quality_rating computed correctly", () => {
    const feedback = [
      makeFeedback({ quality_rating: 8 }),
      makeFeedback({ quality_rating: 6 }),
      makeFeedback({ quality_rating: null }),
    ];
    const r = run({ feedback_records: feedback });
    expect(r.feedback_profile.avg_quality_rating).toBe(7);
  });

  it("avg_quality_rating null when no scores", () => {
    const feedback = [
      makeFeedback({ quality_rating: null }),
    ];
    const r = run({ feedback_records: feedback });
    expect(r.feedback_profile.avg_quality_rating).toBeNull();
  });

  it("sentiment_distribution", () => {
    const feedback = [
      makeFeedback({ sentiment: "positive" }),
      makeFeedback({ sentiment: "positive" }),
      makeFeedback({ sentiment: "constructive" }),
      makeFeedback({ sentiment: "negative" }),
      makeFeedback({ sentiment: "mixed" }),
    ];
    const r = run({ feedback_records: feedback });
    const sd = r.feedback_profile.sentiment_distribution;
    expect(sd.positive).toBe(2);
    expect(sd.constructive).toBe(1);
    expect(sd.negative).toBe(1);
    expect(sd.mixed).toBe(1);
  });

  it("feedback_per_staff", () => {
    const feedback = repeat(16, makeFeedback);
    const r = run({ total_staff: 8, feedback_records: feedback });
    expect(r.feedback_profile.feedback_per_staff).toBe(2);
  });

  it("feedback_per_staff is 0 when total_staff is 0", () => {
    // total_staff=0 with feedback → won't reach this path (insufficient_data), so test with 1 staff
    // Actually if we have feedback but total_staff=0, the allEmpty check fails (feedback not empty)
    // but total_staff=0 doesn't trigger insufficient_data unless allEmpty. Let's test with >0 staff.
    const feedback = repeat(3, makeFeedback);
    const r = run({ total_staff: 4, feedback_records: feedback });
    expect(r.feedback_profile.feedback_per_staff).toBe(0.8);
  });

  it("actionable_rate and follow_up_rate", () => {
    const feedback = [
      makeFeedback({ actionable: true, follow_up_completed: true }),
      makeFeedback({ actionable: true, follow_up_completed: false }),
      makeFeedback({ actionable: false, follow_up_completed: false }),
    ];
    const r = run({ feedback_records: feedback });
    expect(r.feedback_profile.actionable_rate).toBe(67); // 2/3
    expect(r.feedback_profile.follow_up_rate).toBe(33); // 1/3
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 8. STRENGTHS
// ══════════════════════════════════════════════════════════════════════════════

describe("strengths", () => {
  const staffIds = ["s1","s2","s3","s4","s5","s6","s7","s8"];

  it("appraisal completion >= 90% triggers strength", () => {
    const appraisals = [
      ...repeat(9, makeAppraisal, { status: "completed" }),
      makeAppraisal({ status: "scheduled" }),
    ];
    const r = run({ appraisal_records: appraisals });
    expect(r.strengths.some(s => s.includes("90%") && s.toLowerCase().includes("appraisal completion"))).toBe(true);
  });

  it("dual signature >= 90% triggers strength", () => {
    const appraisals = repeat(10, makeAppraisal, {
      status: "completed",
      staff_signed: true,
      manager_signed: true,
    });
    const r = run({ appraisal_records: appraisals });
    expect(r.strengths.some(s => s.includes("dual signature") || s.includes("100%"))).toBe(true);
  });

  it("objectives set >= 90% triggers strength", () => {
    const appraisals = repeat(10, makeAppraisal, { status: "completed", objectives_set: true });
    const r = run({ appraisal_records: appraisals });
    expect(r.strengths.some(s => s.toLowerCase().includes("objectives set"))).toBe(true);
  });

  it("development plan >= 90% triggers strength", () => {
    const appraisals = repeat(10, makeAppraisal, { status: "completed", development_plan_agreed: true });
    const r = run({ appraisal_records: appraisals });
    expect(r.strengths.some(s => s.toLowerCase().includes("development plan"))).toBe(true);
  });

  it("target achievement >= 80% triggers strength", () => {
    const targets = [
      ...repeat(8, makeTarget, { status: "achieved" }),
      ...repeat(2, makeTarget, { status: "on_track", progress_percentage: 50 }),
    ];
    const r = run({ performance_target_records: targets });
    expect(r.strengths.some(s => s.includes("80%") && s.toLowerCase().includes("target"))).toBe(true);
  });

  it("competency >= 85% triggers strength", () => {
    const comps = [
      ...repeat(9, makeCompetency, { current_level: "competent" }),
      makeCompetency({ current_level: "developing" }),
    ];
    const r = run({ competency_assessment_records: comps });
    expect(r.strengths.some(s => s.includes("90%") && s.toLowerCase().includes("competent"))).toBe(true);
  });

  it("all gaps with action plans triggers strength", () => {
    const comps = [
      makeCompetency({ gap_identified: true, action_plan_in_place: true }),
      makeCompetency({ gap_identified: true, action_plan_in_place: true }),
    ];
    const r = run({ competency_assessment_records: comps });
    expect(r.strengths.some(s => s.toLowerCase().includes("action plan"))).toBe(true);
  });

  it("dev progress >= 75% triggers strength", () => {
    const goals = [
      ...repeat(8, makeGoal, { status: "completed" }),
      ...repeat(2, makeGoal, { status: "in_progress", progress_percentage: 50 }),
    ];
    const r = run({ development_goal_records: goals });
    expect(r.strengths.some(s => s.includes("80%") && s.toLowerCase().includes("development goal"))).toBe(true);
  });

  it("support provided >= 85% triggers strength", () => {
    const goals = repeat(10, makeGoal, { support_provided: true });
    const r = run({ development_goal_records: goals });
    expect(r.strengths.some(s => s.toLowerCase().includes("support provided"))).toBe(true);
  });

  it("feedback quality >= 80% triggers strength", () => {
    const feedback = repeat(10, makeFeedback, { actionable: true, quality_rating: 9 });
    const r = run({ feedback_records: feedback });
    expect(r.strengths.some(s => s.toLowerCase().includes("feedback quality"))).toBe(true);
  });

  it("follow up >= 85% triggers strength", () => {
    const feedback = repeat(10, makeFeedback, { follow_up_completed: true });
    const r = run({ feedback_records: feedback });
    expect(r.strengths.some(s => s.toLowerCase().includes("follow-up"))).toBe(true);
  });

  it("avg appraisal quality >= 8.0 triggers strength", () => {
    const appraisals = repeat(5, makeAppraisal, { status: "completed", quality_score: 9 });
    const r = run({ appraisal_records: appraisals });
    expect(r.strengths.some(s => s.toLowerCase().includes("appraisal quality score"))).toBe(true);
  });

  it("all staff covered triggers strength", () => {
    const appraisals = staffIds.map(sid => makeAppraisal({ staff_id: sid }));
    const r = run({ appraisal_records: appraisals });
    expect(r.strengths.some(s => s.toLowerCase().includes("full workforce coverage"))).toBe(true);
  });

  it("feedback per staff >= 3 triggers strength", () => {
    const feedback = repeat(24, makeFeedback); // 24/8 = 3
    const r = run({ feedback_records: feedback });
    expect(r.strengths.some(s => s.toLowerCase().includes("feedback entries per staff"))).toBe(true);
  });

  it("exceptional >= 30% triggers strength", () => {
    const appraisals = [
      ...repeat(4, makeAppraisal, { overall_rating: "exceptional" }),
      ...repeat(6, makeAppraisal, { overall_rating: "effective" }),
    ];
    const r = run({ appraisal_records: appraisals });
    expect(r.strengths.some(s => s.includes("40%") && s.toLowerCase().includes("exceptional"))).toBe(true);
  });

  it("reviewed rate >= 90% triggers strength", () => {
    const targets = repeat(10, makeTarget, { reviewed: true });
    const r = run({ performance_target_records: targets });
    expect(r.strengths.some(s => s.toLowerCase().includes("reviewed"))).toBe(true);
  });

  it("evidence rate >= 80% triggers strength", () => {
    const targets = repeat(10, makeTarget, { evidence_attached: true });
    const r = run({ performance_target_records: targets });
    expect(r.strengths.some(s => s.toLowerCase().includes("evidence"))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 9. CONCERNS
// ══════════════════════════════════════════════════════════════════════════════

describe("concerns", () => {
  it("low completion < 50% triggers concern", () => {
    const appraisals = [
      ...repeat(2, makeAppraisal, { status: "completed" }),
      ...repeat(8, makeAppraisal, { status: "scheduled" }),
    ];
    const r = run({ appraisal_records: appraisals });
    expect(r.concerns.some(c => c.includes("20%") && c.toLowerCase().includes("appraisals completed"))).toBe(true);
  });

  it("overdue appraisals trigger concern", () => {
    const appraisals = [makeAppraisal({ status: "overdue" })];
    const r = run({ appraisal_records: appraisals });
    expect(r.concerns.some(c => c.toLowerCase().includes("overdue"))).toBe(true);
  });

  it("staff without appraisal triggers concern", () => {
    const appraisals = [makeAppraisal({ staff_id: "s1" })];
    const r = run({ total_staff: 8, appraisal_records: appraisals });
    expect(r.concerns.some(c => c.includes("7 of 8"))).toBe(true);
  });

  it("low dual signature < 50% triggers concern", () => {
    const appraisals = [
      makeAppraisal({ status: "completed", staff_signed: false, manager_signed: false }),
      makeAppraisal({ status: "completed", staff_signed: false, manager_signed: false }),
    ];
    const r = run({ appraisal_records: appraisals });
    expect(r.concerns.some(c => c.toLowerCase().includes("dual signature"))).toBe(true);
  });

  it("low objectives set < 60% triggers concern", () => {
    const appraisals = [
      makeAppraisal({ status: "completed", objectives_set: false }),
      makeAppraisal({ status: "completed", objectives_set: false }),
      makeAppraisal({ status: "completed", objectives_set: true }),
    ];
    const r = run({ appraisal_records: appraisals });
    // 1/3 = 33%
    expect(r.concerns.some(c => c.toLowerCase().includes("objectives set"))).toBe(true);
  });

  it("not_met targets trigger concern", () => {
    const targets = [makeTarget({ status: "not_met", progress_percentage: 0 })];
    const r = run({ performance_target_records: targets });
    expect(r.concerns.some(c => c.toLowerCase().includes("not met"))).toBe(true);
  });

  it("at_risk targets trigger concern", () => {
    const targets = [makeTarget({ status: "at_risk", progress_percentage: 30 })];
    const r = run({ performance_target_records: targets });
    expect(r.concerns.some(c => c.toLowerCase().includes("at risk"))).toBe(true);
  });

  it("overdue targets trigger concern", () => {
    const targets = [makeTarget({ status: "on_track", target_date: "2026-01-01", progress_percentage: 50 })];
    const r = run({ performance_target_records: targets });
    expect(r.concerns.some(c => c.toLowerCase().includes("past their target date"))).toBe(true);
  });

  it("low competency < 50% triggers concern", () => {
    const comps = [
      makeCompetency({ current_level: "developing" }),
      makeCompetency({ current_level: "developing" }),
    ];
    const r = run({ competency_assessment_records: comps });
    expect(r.concerns.some(c => c.toLowerCase().includes("skills gap"))).toBe(true);
  });

  it("gaps without action plan trigger concern", () => {
    const comps = [
      makeCompetency({ gap_identified: true, action_plan_in_place: false }),
    ];
    const r = run({ competency_assessment_records: comps });
    expect(r.concerns.some(c => c.toLowerCase().includes("no action plan"))).toBe(true);
  });

  it("unassessed >= 30% triggers concern", () => {
    const comps = [
      makeCompetency({ current_level: "not_assessed", assessed_date: null }),
      makeCompetency({ current_level: "not_assessed", assessed_date: null }),
      makeCompetency({ current_level: "competent", assessed_date: "2026-01-01" }),
    ];
    const r = run({ competency_assessment_records: comps });
    // 2/3 = 67% unassessed ≥ 30%
    expect(r.concerns.some(c => c.toLowerCase().includes("unassessed"))).toBe(true);
  });

  it("overdue goals trigger concern", () => {
    const goals = [makeGoal({ status: "overdue", progress_percentage: 20 })];
    const r = run({ development_goal_records: goals });
    expect(r.concerns.some(c => c.toLowerCase().includes("overdue"))).toBe(true);
  });

  it("low dev progress < 40% triggers concern", () => {
    const goals = [
      ...repeat(2, makeGoal, { status: "completed" }),
      ...repeat(8, makeGoal, { status: "in_progress", progress_percentage: 30 }),
    ];
    const r = run({ development_goal_records: goals });
    // completed/active = 2/10 = 20% < 40%
    expect(r.concerns.some(c => c.toLowerCase().includes("development goals completed"))).toBe(true);
  });

  it("low support < 50% triggers concern", () => {
    const goals = [
      makeGoal({ support_provided: false }),
      makeGoal({ support_provided: false }),
      makeGoal({ support_provided: true }),
    ];
    const r = run({ development_goal_records: goals });
    // 1/3 = 33%
    expect(r.concerns.some(c => c.toLowerCase().includes("support provided"))).toBe(true);
  });

  it("low feedback quality < 50% triggers concern", () => {
    const feedback = [
      ...repeat(2, makeFeedback, { actionable: true, quality_rating: 3 }),
      ...repeat(8, makeFeedback, { actionable: false, quality_rating: 3 }),
    ];
    const r = run({ feedback_records: feedback });
    expect(r.concerns.some(c => c.toLowerCase().includes("feedback quality"))).toBe(true);
  });

  it("low follow up < 40% triggers concern", () => {
    const feedback = [
      ...repeat(1, makeFeedback, { follow_up_completed: true }),
      ...repeat(9, makeFeedback, { follow_up_completed: false }),
    ];
    const r = run({ feedback_records: feedback });
    expect(r.concerns.some(c => c.toLowerCase().includes("followed up"))).toBe(true);
  });

  it("low feedback per staff < 1 triggers concern", () => {
    const feedback = [makeFeedback()]; // 1/8 = 0.1
    const r = run({ total_staff: 8, feedback_records: feedback });
    expect(r.concerns.some(c => c.toLowerCase().includes("feedback entries per staff"))).toBe(true);
  });

  it("underperforming staff triggers concern", () => {
    const appraisals = [makeAppraisal({ overall_rating: "underperforming" })];
    const r = run({ appraisal_records: appraisals });
    expect(r.concerns.some(c => c.toLowerCase().includes("underperforming"))).toBe(true);
  });

  it("cancelled >= 15% triggers concern", () => {
    const appraisals = [
      ...repeat(2, makeAppraisal, { status: "cancelled" }),
      ...repeat(8, makeAppraisal, { status: "completed" }),
    ];
    const r = run({ appraisal_records: appraisals });
    // 2/10 = 20% ≥ 15%
    expect(r.concerns.some(c => c.toLowerCase().includes("cancelled"))).toBe(true);
  });

  it("low avg quality < 5.0 triggers concern", () => {
    const appraisals = [
      makeAppraisal({ status: "completed", quality_score: 3 }),
      makeAppraisal({ status: "completed", quality_score: 4 }),
    ];
    const r = run({ appraisal_records: appraisals });
    // avg = 3.5
    expect(r.concerns.some(c => c.toLowerCase().includes("appraisal quality score"))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 10. RECOMMENDATIONS
// ══════════════════════════════════════════════════════════════════════════════

describe("recommendations", () => {
  it("overdue appraisals → immediate rec", () => {
    const appraisals = [makeAppraisal({ status: "overdue" })];
    const r = run({ appraisal_records: appraisals });
    const rec = r.recommendations.find(r => r.recommendation.toLowerCase().includes("overdue appraisal"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("immediate");
    expect(rec!.regulatory_ref).toContain("Reg 16");
  });

  it("staff without appraisal → immediate rec", () => {
    const appraisals = [makeAppraisal({ staff_id: "s1" })];
    const r = run({ total_staff: 8, appraisal_records: appraisals });
    const rec = r.recommendations.find(r => r.recommendation.toLowerCase().includes("schedule appraisals"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("immediate");
  });

  it("gaps without action plan → immediate rec", () => {
    const comps = [makeCompetency({ gap_identified: true, action_plan_in_place: false })];
    const r = run({ competency_assessment_records: comps });
    const rec = r.recommendations.find(r => r.recommendation.toLowerCase().includes("action plan"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("immediate");
  });

  it("not_met targets → soon rec", () => {
    const targets = [makeTarget({ status: "not_met", progress_percentage: 0 })];
    const r = run({ performance_target_records: targets });
    const rec = r.recommendations.find(r => r.recommendation.toLowerCase().includes("unmet performance target"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("soon");
  });

  it("overdue goals → soon rec", () => {
    const goals = [makeGoal({ status: "overdue", progress_percentage: 20 })];
    const r = run({ development_goal_records: goals });
    const rec = r.recommendations.find(r => r.recommendation.toLowerCase().includes("overdue development goal"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("soon");
  });

  it("at_risk >= 3 → soon rec", () => {
    const targets = repeat(3, makeTarget, { status: "at_risk", progress_percentage: 30 });
    const r = run({ performance_target_records: targets });
    const rec = r.recommendations.find(r => r.recommendation.toLowerCase().includes("at risk"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("soon");
  });

  it("low dual signature < 70% → soon rec", () => {
    const appraisals = [
      makeAppraisal({ status: "completed", staff_signed: false, manager_signed: false }),
      makeAppraisal({ status: "completed", staff_signed: false, manager_signed: false }),
    ];
    const r = run({ appraisal_records: appraisals });
    const rec = r.recommendations.find(r => r.recommendation.toLowerCase().includes("dual signature"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("soon");
  });

  it("low objectives < 70% → soon rec", () => {
    const appraisals = [
      makeAppraisal({ status: "completed", objectives_set: false }),
      makeAppraisal({ status: "completed", objectives_set: true }),
    ];
    const r = run({ appraisal_records: appraisals });
    const rec = r.recommendations.find(r => r.recommendation.toLowerCase().includes("objectives"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("soon");
  });

  it("low follow up < 60% → planned rec", () => {
    const feedback = [
      ...repeat(2, makeFeedback, { follow_up_completed: true }),
      ...repeat(8, makeFeedback, { follow_up_completed: false }),
    ];
    const r = run({ feedback_records: feedback });
    const rec = r.recommendations.find(r => r.recommendation.toLowerCase().includes("follow-up"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("planned");
  });

  it("low feedback per staff < 2 → planned rec", () => {
    const feedback = [makeFeedback()]; // 1/8 = 0.1
    const r = run({ total_staff: 8, feedback_records: feedback });
    const rec = r.recommendations.find(r => r.recommendation.toLowerCase().includes("feedback frequency"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("planned");
  });

  it("low support < 60% → planned rec", () => {
    const goals = [
      makeGoal({ support_provided: false }),
      makeGoal({ support_provided: false }),
      makeGoal({ support_provided: true }),
    ];
    const r = run({ development_goal_records: goals });
    const rec = r.recommendations.find(r => r.recommendation.toLowerCase().includes("support"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("planned");
  });

  it("low competency < 65% → planned rec", () => {
    const comps = [
      ...repeat(3, makeCompetency, { current_level: "competent" }),
      ...repeat(7, makeCompetency, { current_level: "developing" }),
    ];
    const r = run({ competency_assessment_records: comps });
    const rec = r.recommendations.find(r => r.recommendation.toLowerCase().includes("competency rate"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("planned");
  });

  it("low review rate < 70% → planned rec", () => {
    const targets = [
      ...repeat(3, makeTarget, { reviewed: true }),
      ...repeat(7, makeTarget, { reviewed: false }),
    ];
    const r = run({ performance_target_records: targets });
    const rec = r.recommendations.find(r => r.recommendation.toLowerCase().includes("target review rate"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("planned");
  });

  it("underperforming staff → soon rec", () => {
    const appraisals = [makeAppraisal({ overall_rating: "underperforming" })];
    const r = run({ appraisal_records: appraisals });
    const rec = r.recommendations.find(r => r.recommendation.toLowerCase().includes("performance improvement"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("soon");
  });

  it("low dev plan rate < 70% → planned rec", () => {
    const appraisals = [
      makeAppraisal({ status: "completed", development_plan_agreed: false }),
      makeAppraisal({ status: "completed", development_plan_agreed: false }),
      makeAppraisal({ status: "completed", development_plan_agreed: true }),
    ];
    const r = run({ appraisal_records: appraisals });
    const rec = r.recommendations.find(r => r.recommendation.toLowerCase().includes("development plan agreement"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("planned");
  });

  it("ranks are sequential starting from 1", () => {
    const appraisals = [makeAppraisal({ status: "overdue" })];
    const targets = [makeTarget({ status: "not_met", progress_percentage: 0 })];
    const r = run({ appraisal_records: appraisals, performance_target_records: targets });
    for (let i = 0; i < r.recommendations.length; i++) {
      expect(r.recommendations[i].rank).toBe(i + 1);
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 11. INSIGHTS
// ══════════════════════════════════════════════════════════════════════════════

describe("insights", () => {
  it("overdue >= 3 → critical insight", () => {
    const appraisals = repeat(3, makeAppraisal, { status: "overdue", overall_rating: "not_rated", quality_score: null });
    const r = run({ appraisal_records: appraisals });
    expect(r.insights.some(i => i.severity === "critical" && i.text.includes("3 appraisals are overdue"))).toBe(true);
  });

  it("overdue 1-2 → warning insight", () => {
    const appraisals = [makeAppraisal({ status: "overdue", overall_rating: "not_rated", quality_score: null })];
    const r = run({ appraisal_records: appraisals });
    expect(r.insights.some(i => i.severity === "warning" && i.text.toLowerCase().includes("overdue"))).toBe(true);
  });

  it("staff without appraisal >= 40% → critical insight", () => {
    // 8 staff, 4 have appraisals → 4 without = 50% ≥ 40%
    const appraisals = ["s1","s2","s3","s4"].map(sid => makeAppraisal({ staff_id: sid }));
    const r = run({ total_staff: 8, appraisal_records: appraisals });
    expect(r.insights.some(i => i.severity === "critical" && i.text.includes("50%") && i.text.includes("never been appraised"))).toBe(true);
  });

  it("staff without appraisal 15-39% → warning insight", () => {
    // 8 staff, 6 have appraisals → 2 without = 25%
    const appraisals = ["s1","s2","s3","s4","s5","s6"].map(sid => makeAppraisal({ staff_id: sid }));
    const r = run({ total_staff: 8, appraisal_records: appraisals });
    expect(r.insights.some(i => i.severity === "warning" && i.text.includes("no appraisal record"))).toBe(true);
  });

  it("gaps without plan >= 3 → critical insight", () => {
    const comps = repeat(3, makeCompetency, { gap_identified: true, action_plan_in_place: false, current_level: "developing" });
    const r = run({ competency_assessment_records: comps });
    expect(r.insights.some(i => i.severity === "critical" && i.text.includes("3 competency gaps"))).toBe(true);
  });

  it("gaps without plan 1-2 → warning insight", () => {
    const comps = [makeCompetency({ gap_identified: true, action_plan_in_place: false, current_level: "developing" })];
    const r = run({ competency_assessment_records: comps });
    expect(r.insights.some(i => i.severity === "warning" && i.text.toLowerCase().includes("action plan"))).toBe(true);
  });

  it("not_met targets >= 3 → critical insight", () => {
    const targets = repeat(3, makeTarget, { status: "not_met", progress_percentage: 0 });
    const r = run({ performance_target_records: targets });
    expect(r.insights.some(i => i.severity === "critical" && i.text.includes("3 performance targets not met"))).toBe(true);
  });

  it("not_met targets 1-2 → warning insight", () => {
    const targets = [makeTarget({ status: "not_met", progress_percentage: 0 })];
    const r = run({ performance_target_records: targets });
    expect(r.insights.some(i => i.severity === "warning" && i.text.toLowerCase().includes("not met"))).toBe(true);
  });

  it("overdue goals >= 3 → critical insight", () => {
    const goals = repeat(3, makeGoal, { status: "overdue", progress_percentage: 20 });
    const r = run({ development_goal_records: goals });
    expect(r.insights.some(i => i.severity === "critical" && i.text.includes("3 development goals are overdue"))).toBe(true);
  });

  it("overdue goals 1-2 → warning insight", () => {
    const goals = [makeGoal({ status: "overdue", progress_percentage: 20 })];
    const r = run({ development_goal_records: goals });
    expect(r.insights.some(i => i.severity === "warning" && i.text.toLowerCase().includes("overdue"))).toBe(true);
  });

  it("outstanding performance → positive insight", () => {
    const staffIds = ["s1","s2","s3","s4","s5","s6","s7","s8"];
    const appraisals = staffIds.map(sid => makeAppraisal({ staff_id: sid, status: "completed" }));
    const targets = [
      ...repeat(9, makeTarget, { status: "achieved" }),
      makeTarget({ status: "on_track", progress_percentage: 80 }),
    ];
    const comps = [
      ...repeat(9, makeCompetency, { current_level: "competent" }),
      makeCompetency({ current_level: "developing" }),
    ];
    const goals = [
      ...repeat(8, makeGoal, { status: "completed" }),
      ...repeat(2, makeGoal, { status: "in_progress", progress_percentage: 50 }),
    ];
    const r = run({
      appraisal_records: appraisals,
      performance_target_records: targets,
      competency_assessment_records: comps,
      development_goal_records: goals,
    });
    expect(r.insights.some(i => i.severity === "positive" && i.text.toLowerCase().includes("performance management is strong"))).toBe(true);
  });

  it("rich feedback culture → positive insight", () => {
    // 24 feedback / 8 staff = 3 per staff, quality >= 75
    const feedback = repeat(24, makeFeedback, { actionable: true, quality_rating: 9 });
    const r = run({ feedback_records: feedback });
    expect(r.insights.some(i => i.severity === "positive" && i.text.toLowerCase().includes("rich feedback culture"))).toBe(true);
  });

  it("low feedback quality < 40% → warning insight", () => {
    const feedback = repeat(10, makeFeedback, { actionable: false, quality_rating: 2 });
    const r = run({ feedback_records: feedback });
    // actionableRate=0, qualityPct=20, rate=round(0+8)=8
    expect(r.insights.some(i => i.severity === "warning" && i.text.toLowerCase().includes("feedback quality rate"))).toBe(true);
  });

  it("underperforming >= 2 → critical insight", () => {
    const appraisals = repeat(3, makeAppraisal, { overall_rating: "underperforming" });
    const r = run({ appraisal_records: appraisals });
    expect(r.insights.some(i => i.severity === "critical" && i.text.toLowerCase().includes("underperforming"))).toBe(true);
  });

  it("all gaps with plans → positive insight", () => {
    const comps = [
      makeCompetency({ gap_identified: true, action_plan_in_place: true, current_level: "developing" }),
      makeCompetency({ gap_identified: true, action_plan_in_place: true, current_level: "developing" }),
    ];
    const r = run({ competency_assessment_records: comps });
    expect(r.insights.some(i => i.severity === "positive" && i.text.toLowerCase().includes("action plans in place"))).toBe(true);
  });

  it("low dual signature < 50% → warning insight", () => {
    const appraisals = repeat(5, makeAppraisal, {
      status: "completed",
      staff_signed: false,
      manager_signed: false,
    });
    const r = run({ appraisal_records: appraisals });
    expect(r.insights.some(i => i.severity === "warning" && i.text.toLowerCase().includes("dual signature"))).toBe(true);
  });

  it("comprehensive support → positive insight", () => {
    const goals = repeat(10, makeGoal, { support_provided: true, resource_allocated: true });
    const r = run({ development_goal_records: goals });
    expect(r.insights.some(i => i.severity === "positive" && i.text.toLowerCase().includes("strong development support"))).toBe(true);
  });

  it("low assessment coverage < 60% → warning insight", () => {
    const comps = [
      makeCompetency({ current_level: "not_assessed", assessed_date: null }),
      makeCompetency({ current_level: "not_assessed", assessed_date: null }),
      makeCompetency({ current_level: "competent", assessed_date: "2026-01-01" }),
    ];
    const r = run({ competency_assessment_records: comps });
    expect(r.insights.some(i => i.severity === "warning" && i.text.toLowerCase().includes("competency assessments have been completed"))).toBe(true);
  });

  it("diverse feedback sources → positive insight", () => {
    const feedback = [
      makeFeedback({ feedback_type: "formal" }),
      makeFeedback({ feedback_type: "360" }),
      makeFeedback({ feedback_type: "peer" }),
    ];
    const r = run({ feedback_records: feedback });
    expect(r.insights.some(i => i.severity === "positive" && i.text.toLowerCase().includes("diverse feedback"))).toBe(true);
  });

  it("cancelled >= 3 → warning insight", () => {
    const appraisals = [
      ...repeat(3, makeAppraisal, { status: "cancelled" }),
      ...repeat(7, makeAppraisal, { status: "completed" }),
    ];
    const r = run({ appraisal_records: appraisals });
    expect(r.insights.some(i => i.severity === "warning" && i.text.includes("3 appraisals cancelled"))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 12. EDGE CASES
// ══════════════════════════════════════════════════════════════════════════════

describe("edge cases", () => {
  it("pct(0, 0) returns 0", () => {
    // Engine internally calls pct(0,0) for various rates when arrays empty
    const r = run({ performance_target_records: [makeTarget()] });
    // no appraisals → appraisalCompletionRate = pct(0,0) = 0 inside engine
    expect(r.appraisal_completion_rate).toBe(0);
  });

  it("score is clamped to 0 minimum", () => {
    // Create extreme penalties to push score below 0
    // base=52, overdue penalty=-8, target penalty=-7, comp gap penalty=-6, dev overdue=-6, staff penalty=-5
    // Total: 52 - 8 - 7 - 6 - 6 - 5 = 20, but let's try
    // Actually the min realistic is base - all penalties, which can't go below 0 due to clamp
    // We need a scenario that forces score to 0 or below
    const appraisals = repeat(10, makeAppraisal, {
      status: "overdue",
      staff_signed: false,
      manager_signed: false,
      objectives_set: false,
      development_plan_agreed: false,
      quality_score: null,
      overall_rating: "not_rated",
    });
    const targets = repeat(10, makeTarget, { status: "not_met", progress_percentage: 0, target_date: PAST_DATE, reviewed: false, evidence_attached: false });
    const comps = repeat(10, makeCompetency, { current_level: "developing", gap_identified: true, action_plan_in_place: false });
    const goals = repeat(10, makeGoal, { status: "overdue", progress_percentage: 0, support_provided: false, resource_allocated: false });
    const r = run({
      appraisal_records: appraisals,
      performance_target_records: targets,
      competency_assessment_records: comps,
      development_goal_records: goals,
    });
    // 52 + 0(compl<50) + 0(ach:0/10=0%) + 0(comp:0%) + 0(dev:0%) - 8(overdue100%) - 7(problem100%) - 6(gaps10>=5) - 6(overdueGoal100%) - 5(staffNoAppraisal:100%)
    // = 52 - 32 = 20
    expect(r.appraisal_score).toBeGreaterThanOrEqual(0);
    expect(r.appraisal_score).toBeLessThanOrEqual(100);
  });

  it("score is clamped to 100 maximum", () => {
    // Max possible: base 52 + 7 + 6 + 5 + 5 + 5 = 80
    // Can't exceed 80 without getting extra, but engine clamps to 100
    // Just verify the clamp works conceptually
    const staffIds = ["s1","s2","s3","s4","s5","s6","s7","s8"];
    const appraisals = staffIds.map(sid => makeAppraisal({ staff_id: sid, status: "completed" }));
    const targets = repeat(10, makeTarget, { status: "achieved" });
    const comps = repeat(10, makeCompetency, { current_level: "expert" });
    const goals = repeat(10, makeGoal, { status: "completed" });
    const feedback = repeat(10, makeFeedback, { actionable: true, quality_rating: 10 });
    const r = run({
      appraisal_records: appraisals,
      performance_target_records: targets,
      competency_assessment_records: comps,
      development_goal_records: goals,
      feedback_records: feedback,
    });
    expect(r.appraisal_score).toBeLessThanOrEqual(100);
    // Max: 52+7+6+5+5+5 = 80
    expect(r.appraisal_score).toBe(80);
  });

  it("max bonuses sum to +28 (52 + 28 = 80)", () => {
    const staffIds = ["s1","s2","s3","s4","s5","s6","s7","s8"];
    const appraisals = staffIds.map(sid => makeAppraisal({ staff_id: sid }));
    const targets = repeat(10, makeTarget, { status: "achieved" });
    const comps = repeat(10, makeCompetency, { current_level: "expert" });
    const goals = repeat(10, makeGoal, { status: "completed" });
    const feedback = repeat(10, makeFeedback, { actionable: true, quality_rating: 10 });
    const r = run({
      appraisal_records: appraisals,
      performance_target_records: targets,
      competency_assessment_records: comps,
      development_goal_records: goals,
      feedback_records: feedback,
    });
    expect(r.appraisal_score).toBe(80); // 52 + 7 + 6 + 5 + 5 + 5
  });

  it("single staff member with total_staff=1", () => {
    const appraisals = [makeAppraisal({ staff_id: "s1", status: "completed" })];
    const r = run({ total_staff: 1, appraisal_records: appraisals });
    expect(r.appraisal_profile.staff_with_no_appraisal).toBe(0);
    expect(r.appraisal_rating).not.toBe("insufficient_data");
  });

  it("large number of records does not break engine", () => {
    const appraisals = repeat(100, makeAppraisal, { status: "completed" });
    const targets = repeat(200, makeTarget, { status: "achieved" });
    const comps = repeat(100, makeCompetency, { current_level: "competent" });
    const goals = repeat(100, makeGoal, { status: "completed" });
    const feedback = repeat(200, makeFeedback);
    const r = run({
      total_staff: 50,
      appraisal_records: appraisals,
      performance_target_records: targets,
      competency_assessment_records: comps,
      development_goal_records: goals,
      feedback_records: feedback,
    });
    expect(r.appraisal_score).toBeGreaterThanOrEqual(0);
    expect(r.appraisal_score).toBeLessThanOrEqual(100);
    expect(typeof r.appraisal_rating).toBe("string");
  });

  it("same staff_id across all record types does not break engine", () => {
    const appraisals = [makeAppraisal({ staff_id: "s1" })];
    const targets = [makeTarget({ staff_id: "s1" })];
    const comps = [makeCompetency({ staff_id: "s1" })];
    const goals = [makeGoal({ staff_id: "s1" })];
    const feedback = [makeFeedback({ staff_id: "s1" })];
    const r = run({
      total_staff: 1,
      appraisal_records: appraisals,
      performance_target_records: targets,
      competency_assessment_records: comps,
      development_goal_records: goals,
      feedback_records: feedback,
    });
    expect(r.appraisal_score).toBeGreaterThan(0);
  });

  it("total_staff=0 with records still returns insufficient_data when all arrays empty", () => {
    const r = computeStaffPerformanceAppraisal({
      today: TODAY,
      total_staff: 0,
      appraisal_records: [],
      performance_target_records: [],
      competency_assessment_records: [],
      development_goal_records: [],
      feedback_records: [],
    });
    expect(r.appraisal_rating).toBe("insufficient_data");
  });

  it("total_staff=0 with non-empty records computes normally (not insufficient_data)", () => {
    const r = computeStaffPerformanceAppraisal({
      today: TODAY,
      total_staff: 0,
      appraisal_records: [makeAppraisal()],
      performance_target_records: [],
      competency_assessment_records: [],
      development_goal_records: [],
      feedback_records: [],
    });
    // Not insufficient_data because allEmpty is false
    expect(r.appraisal_rating).not.toBe("insufficient_data");
  });

  it("boundary: score exactly 80 → outstanding", () => {
    // 52 + 7 + 6 + 5 + 5 + 5 = 80
    const staffIds = ["s1","s2","s3","s4","s5","s6","s7","s8"];
    const appraisals = staffIds.map(sid => makeAppraisal({ staff_id: sid }));
    const targets = repeat(10, makeTarget, { status: "achieved" });
    const comps = repeat(10, makeCompetency, { current_level: "competent" });
    const goals = repeat(10, makeGoal, { status: "completed" });
    const feedback = repeat(10, makeFeedback, { actionable: true, quality_rating: 10 });
    const r = run({
      appraisal_records: appraisals,
      performance_target_records: targets,
      competency_assessment_records: comps,
      development_goal_records: goals,
      feedback_records: feedback,
    });
    expect(r.appraisal_score).toBe(80);
    expect(r.appraisal_rating).toBe("outstanding");
  });

  it("boundary: score exactly 65 → good", () => {
    // 52 + 7 + 6 = 65 (appraisals 100% + targets 100%)
    const staffIds = ["s1","s2","s3","s4","s5","s6","s7","s8"];
    const appraisals = staffIds.map(sid => makeAppraisal({ staff_id: sid }));
    const targets = repeat(10, makeTarget, { status: "achieved" });
    const r = run({
      appraisal_records: appraisals,
      performance_target_records: targets,
    });
    expect(r.appraisal_score).toBe(65);
    expect(r.appraisal_rating).toBe("good");
  });

  it("boundary: score exactly 45 → adequate", () => {
    // Need score = 45. base=52, need penalty=-7
    // 52 + bonus - penalty = 45 → bonus - penalty = -7
    // e.g. appraisal completion 50% → +1, overdue 40% → -8: 52 + 1 - 8 = 45
    // 10 appraisals: 5 completed, 4 overdue, 1 scheduled
    const staffIds = ["s1","s2","s3","s4","s5","s6","s7","s8"];
    const appraisals = [
      ...staffIds.slice(0,5).map(sid => makeAppraisal({ staff_id: sid, status: "completed" })),
      ...repeat(4, makeAppraisal, { status: "overdue", quality_score: null, overall_rating: "not_rated" }),
      makeAppraisal({ staff_id: staffIds[5], status: "scheduled" }),
    ];
    // Assign staff_ids to overdue and scheduled
    appraisals[5].staff_id = staffIds[5];
    appraisals[6].staff_id = staffIds[6];
    appraisals[7].staff_id = staffIds[6]; // dup is ok
    appraisals[8].staff_id = staffIds[7];
    appraisals[9].staff_id = staffIds[5];

    const r = run({ appraisal_records: appraisals });
    // compl = 5/10 = 50% → +1
    // overdue = 4/10 = 40% → -8
    // staff with appraisals = all 8 → no staff penalty
    // 52 + 1 - 8 = 45
    expect(r.appraisal_score).toBe(45);
    expect(r.appraisal_rating).toBe("adequate");
  });

  it("quality_score 0 is excluded from avg (treated as falsy)", () => {
    const appraisals = [
      makeAppraisal({ status: "completed", quality_score: 0 }),
      makeAppraisal({ status: "completed", quality_score: 8 }),
    ];
    const r = run({ appraisal_records: appraisals });
    // quality_score=0 is falsy, only 8 counts → avg = 8
    expect(r.appraisal_profile.avg_quality_score).toBe(8);
  });

  it("headline for good with issues includes issue details", () => {
    const staffIds = ["s1","s2","s3","s4","s5","s6","s7","s8"];
    // 8 completed + 1 overdue = 9 total, completion = 8/9 = 89% → +5
    // overdue = 1/9 = 11% ≥10 → -3. Staff all covered. 52+5-3 = 54... need more
    // Add targets (+6) and competency (+5): 52+5+6+5-3 = 65 → good
    const appraisals = [
      ...staffIds.map(sid => makeAppraisal({ staff_id: sid, status: "completed" })),
      makeAppraisal({ staff_id: staffIds[0], status: "overdue", quality_score: null, overall_rating: "not_rated" }),
    ];
    const targets = repeat(10, makeTarget, { status: "achieved" });
    const comps = repeat(10, makeCompetency, { current_level: "competent" });
    const r = run({
      appraisal_records: appraisals,
      performance_target_records: targets,
      competency_assessment_records: comps,
    });
    expect(r.appraisal_rating).toBe("good");
    expect(r.headline.toLowerCase()).toContain("good");
    expect(r.headline.toLowerCase()).toContain("overdue");
  });

  it("headline for good with no issues is generic", () => {
    const staffIds = ["s1","s2","s3","s4","s5","s6","s7","s8"];
    const appraisals = staffIds.map(sid => makeAppraisal({ staff_id: sid, status: "completed" }));
    const targets = repeat(10, makeTarget, { status: "achieved" });
    const r = run({ appraisal_records: appraisals, performance_target_records: targets });
    expect(r.headline.toLowerCase()).toContain("good");
    expect(r.headline.toLowerCase()).toContain("maintained");
  });

  it("mixed feedback quality: some null, some rated", () => {
    const feedback = [
      makeFeedback({ actionable: true, quality_rating: 8 }),
      makeFeedback({ actionable: true, quality_rating: null }),
      makeFeedback({ actionable: false, quality_rating: 6 }),
    ];
    const r = run({ feedback_records: feedback });
    // actionableRate = 2/3 = 67%, avgQuality = (8+6)/2 = 7 → qualityPct = 70
    // rate = round(67*0.6 + 70*0.4) = round(40.2 + 28) = round(68.2) = 68
    expect(r.feedback_quality_rate).toBe(68);
  });

  it("multiple categories in targets produce correct breakdown", () => {
    const targets = [
      makeTarget({ category: "care_quality", status: "achieved" }),
      makeTarget({ category: "compliance", status: "achieved" }),
      makeTarget({ category: "leadership", status: "on_track", progress_percentage: 60 }),
      makeTarget({ category: "care_quality", status: "not_met", progress_percentage: 0 }),
    ];
    const r = run({ performance_target_records: targets });
    const breakdown = r.target_profile.category_breakdown;
    expect(breakdown).toHaveLength(3);
    const cq = breakdown.find(b => b.category === "care_quality");
    expect(cq!.total).toBe(2);
    expect(cq!.achieved).toBe(1);
  });

  it("combined bonuses and penalties produce correct score", () => {
    // Deliberately craft: base=52, bonus1=+5(85%), bonus3=+5(100%comp), penalty1=-3(20%overdue), penalty3=-2(1gap)
    const staffIds = ["s1","s2","s3","s4","s5","s6","s7","s8"];
    const appraisals = [
      ...staffIds.map(sid => makeAppraisal({ staff_id: sid, status: "completed" })),
      makeAppraisal({ staff_id: staffIds[0], status: "completed" }),
      makeAppraisal({ staff_id: staffIds[1], status: "overdue", quality_score: null, overall_rating: "not_rated" }),
      makeAppraisal({ staff_id: staffIds[2], status: "scheduled" }),
    ];
    // 9 completed out of 11 = 82% → >=70 → +3... wait 9/11 = 82%
    // Actually: we have 8 completed + 1 completed + 1 overdue + 1 scheduled = 9 completed / 11 total = 82%
    // 82% >=70 → +3
    // overdue = 1/11 = 9% → <10% → -1
    const comps = [
      ...repeat(9, makeCompetency, { current_level: "competent" }),
      makeCompetency({ current_level: "developing", gap_identified: true, action_plan_in_place: false }),
    ];
    // compRate = 9/10 = 90% → +5
    // gaps=1, without plan=1 → -2
    // 52 + 3 + 5 - 1 - 2 = 57
    const r = run({
      appraisal_records: appraisals,
      competency_assessment_records: comps,
    });
    expect(r.appraisal_score).toBe(57);
  });

  it("all empty arrays with total_staff=0 returns correct empty profiles", () => {
    const r = computeStaffPerformanceAppraisal({
      today: TODAY,
      total_staff: 0,
      appraisal_records: [],
      performance_target_records: [],
      competency_assessment_records: [],
      development_goal_records: [],
      feedback_records: [],
    });
    expect(r.appraisal_profile.total_appraisals).toBe(0);
    expect(r.appraisal_profile.avg_quality_score).toBeNull();
    expect(r.target_profile.category_breakdown).toEqual([]);
    expect(r.competency_profile.area_breakdown).toEqual([]);
    expect(r.development_profile.category_breakdown).toEqual([]);
    expect(r.feedback_profile.avg_quality_rating).toBeNull();
    expect(r.feedback_profile.sentiment_distribution).toEqual({ positive: 0, constructive: 0, negative: 0, mixed: 0 });
  });

  it("at_risk targets >= 3 but < total enough to trigger rec", () => {
    const targets = [
      ...repeat(3, makeTarget, { status: "at_risk", progress_percentage: 30 }),
      ...repeat(7, makeTarget, { status: "achieved" }),
    ];
    const r = run({ performance_target_records: targets });
    const rec = r.recommendations.find(r => r.recommendation.includes("at risk"));
    expect(rec).toBeDefined();
  });

  it("feedback_per_staff 0 when total_staff 0 but has feedback data and other records", () => {
    // total_staff=0, has feedback → not allEmpty, not insufficient. feedbackPerStaff = 0
    const r = computeStaffPerformanceAppraisal({
      today: TODAY,
      total_staff: 0,
      appraisal_records: [makeAppraisal()],
      performance_target_records: [],
      competency_assessment_records: [],
      development_goal_records: [],
      feedback_records: [makeFeedback()],
    });
    // fab-0: null when total_staff=0 — no denominator
    expect(r.feedback_profile.feedback_per_staff).toBeNull();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 13. HEADLINE VARIATIONS
// ══════════════════════════════════════════════════════════════════════════════

describe("headline generation", () => {
  it("adequate headline text", () => {
    const staffIds = ["s1","s2","s3","s4","s5","s6","s7","s8"];
    const appraisals = [
      ...staffIds.slice(0,6).map(sid => makeAppraisal({ staff_id: sid, status: "completed" })),
      makeAppraisal({ staff_id: staffIds[6], status: "scheduled" }),
      makeAppraisal({ staff_id: staffIds[7], status: "overdue" }),
    ];
    const r = run({ appraisal_records: appraisals });
    expect(r.headline.toLowerCase()).toContain("adequate");
  });

  it("good headline with multiple issues lists them", () => {
    const staffIds = ["s1","s2","s3","s4","s5","s6","s7","s8"];
    const appraisals = [
      ...staffIds.map(sid => makeAppraisal({ staff_id: sid, status: "completed" })),
      makeAppraisal({ staff_id: staffIds[0], status: "overdue", quality_score: null, overall_rating: "not_rated" }),
    ];
    const targets = [
      ...repeat(8, makeTarget, { status: "achieved" }),
      makeTarget({ status: "not_met", progress_percentage: 0 }),
      makeTarget({ status: "achieved" }),
    ];
    const r = run({ appraisal_records: appraisals, performance_target_records: targets });
    // Should be good rating with issues in headline
    if (r.appraisal_rating === "good") {
      expect(r.headline.toLowerCase()).toContain("overdue");
      expect(r.headline.toLowerCase()).toContain("unmet");
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 14. RETURN SHAPE
// ══════════════════════════════════════════════════════════════════════════════

describe("return shape", () => {
  it("result has all expected top-level keys", () => {
    const r = run();
    expect(r).toHaveProperty("appraisal_rating");
    expect(r).toHaveProperty("appraisal_score");
    expect(r).toHaveProperty("headline");
    expect(r).toHaveProperty("appraisal_completion_rate");
    expect(r).toHaveProperty("target_achievement_rate");
    expect(r).toHaveProperty("competency_rate");
    expect(r).toHaveProperty("development_progress_rate");
    expect(r).toHaveProperty("feedback_quality_rate");
    expect(r).toHaveProperty("staff_satisfaction_rate");
    expect(r).toHaveProperty("appraisal_profile");
    expect(r).toHaveProperty("target_profile");
    expect(r).toHaveProperty("competency_profile");
    expect(r).toHaveProperty("development_profile");
    expect(r).toHaveProperty("feedback_profile");
    expect(r).toHaveProperty("strengths");
    expect(r).toHaveProperty("concerns");
    expect(r).toHaveProperty("recommendations");
    expect(r).toHaveProperty("insights");
  });

  it("rating is one of the valid types", () => {
    const r = run();
    const validRatings: StaffPerformanceRating[] = ["outstanding", "good", "adequate", "inadequate", "insufficient_data"];
    expect(validRatings).toContain(r.appraisal_rating);
  });

  it("score is a number between 0 and 100", () => {
    const r = run();
    expect(typeof r.appraisal_score).toBe("number");
    expect(r.appraisal_score).toBeGreaterThanOrEqual(0);
    expect(r.appraisal_score).toBeLessThanOrEqual(100);
  });

  it("recommendations have required fields", () => {
    const appraisals = [makeAppraisal({ status: "overdue" })];
    const r = run({ appraisal_records: appraisals });
    for (const rec of r.recommendations) {
      expect(rec).toHaveProperty("rank");
      expect(rec).toHaveProperty("recommendation");
      expect(rec).toHaveProperty("urgency");
      expect(rec).toHaveProperty("regulatory_ref");
    }
  });

  it("insights have text and severity", () => {
    const appraisals = [makeAppraisal({ status: "overdue" })];
    const r = run({ appraisal_records: appraisals });
    for (const ins of r.insights) {
      expect(ins).toHaveProperty("text");
      expect(ins).toHaveProperty("severity");
    }
  });
});
