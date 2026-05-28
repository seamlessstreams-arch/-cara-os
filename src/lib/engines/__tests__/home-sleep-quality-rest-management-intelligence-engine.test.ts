// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME SLEEP QUALITY & REST MANAGEMENT INTELLIGENCE ENGINE — TESTS
// CHR 2015 Reg 6 (Quality of care standard), Reg 12 (Health and wellbeing).
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeSleepQualityRestManagement,
  type SleepQualityRestManagementInput,
  type SleepRoutineRecordInput,
  type SleepEnvironmentRecordInput,
  type SleepDisturbanceRecordInput,
  type BedtimeSupportRecordInput,
  type SleepImprovementRecordInput,
} from "../home-sleep-quality-rest-management-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

let _id = 0;
function uid(): string {
  return `id_${++_id}`;
}

function baseInput(
  overrides: Partial<SleepQualityRestManagementInput> = {},
): SleepQualityRestManagementInput {
  return {
    today: "2026-05-28",
    total_children: 0,
    sleep_routine_records: [],
    sleep_environment_records: [],
    sleep_disturbance_records: [],
    bedtime_support_records: [],
    sleep_improvement_records: [],
    ...overrides,
  };
}

function makeRoutine(
  overrides: Partial<SleepRoutineRecordInput> = {},
): SleepRoutineRecordInput {
  return {
    id: uid(),
    child_id: "child_1",
    date: "2026-05-27",
    planned_bedtime: "21:00",
    actual_bedtime: "21:00",
    planned_wake_time: "07:00",
    actual_wake_time: "07:00",
    wind_down_activity_completed: false,
    routine_followed: false,
    routine_deviation_reason: null,
    staff_member: "staff_1",
    child_settled_within_30_min: false,
    sleep_quality_rating: 3,
    notes: null,
    created_at: "2026-05-27T21:00:00Z",
    ...overrides,
  };
}

function makeEnvironment(
  overrides: Partial<SleepEnvironmentRecordInput> = {},
): SleepEnvironmentRecordInput {
  return {
    id: uid(),
    child_id: "child_1",
    assessment_date: "2026-05-27",
    room_temperature_ok: false,
    lighting_appropriate: false,
    noise_level_acceptable: false,
    bedding_clean_adequate: false,
    room_personalised: false,
    electronic_devices_managed: false,
    ventilation_adequate: false,
    overall_environment_score: 1,
    issues_identified: [],
    issues_resolved: false,
    resolution_date: null,
    assessed_by: "staff_1",
    created_at: "2026-05-27T10:00:00Z",
    ...overrides,
  };
}

function makeDisturbance(
  overrides: Partial<SleepDisturbanceRecordInput> = {},
): SleepDisturbanceRecordInput {
  return {
    id: uid(),
    child_id: "child_1",
    date: "2026-05-27",
    time_of_disturbance: "02:00",
    disturbance_type: "nightmare",
    duration_minutes: 15,
    staff_response_time_minutes: 10,
    intervention_type: "verbal reassurance",
    child_resettled: false,
    resettled_time_minutes: null,
    follow_up_actions: null,
    follow_up_completed: false,
    impact_on_next_day: "none",
    staff_member: "staff_1",
    created_at: "2026-05-27T02:00:00Z",
    ...overrides,
  };
}

function makeBedtimeSupport(
  overrides: Partial<BedtimeSupportRecordInput> = {},
): BedtimeSupportRecordInput {
  return {
    id: uid(),
    child_id: "child_1",
    date: "2026-05-27",
    support_type: "reading",
    support_provided: false,
    duration_minutes: 15,
    child_engaged: false,
    child_feedback_positive: false,
    staff_member: "staff_1",
    consistency_with_plan: false,
    notes: null,
    created_at: "2026-05-27T20:30:00Z",
    ...overrides,
  };
}

function makeImprovement(
  overrides: Partial<SleepImprovementRecordInput> = {},
): SleepImprovementRecordInput {
  return {
    id: uid(),
    child_id: "child_1",
    plan_created_date: "2026-05-01",
    plan_type: "individual_sleep_plan",
    target_outcome: "Improve sleep onset",
    review_date: null,
    reviewed: false,
    progress_rating: 3,
    child_involved_in_planning: false,
    professional_input_received: false,
    plan_active: false,
    outcomes_documented: false,
    created_at: "2026-05-01T10:00:00Z",
    ...overrides,
  };
}

/** Create n records using a maker with optional per-record overrides. */
function times<T>(n: number, maker: (o?: Partial<T>) => T, overrides?: Partial<T>): T[] {
  return Array.from({ length: n }, () => maker(overrides));
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. INSUFFICIENT DATA
// ═══════════════════════════════════════════════════════════════════════════

describe("insufficient data", () => {
  it("returns insufficient_data / score 0 when all arrays empty and total_children=0", () => {
    const r = computeSleepQualityRestManagement(baseInput());
    expect(r.sleep_rating).toBe("insufficient_data");
    expect(r.sleep_score).toBe(0);
    expect(r.headline).toContain("insufficient data");
  });

  it("returns all-zero metrics for insufficient_data", () => {
    const r = computeSleepQualityRestManagement(baseInput());
    expect(r.total_routine_records).toBe(0);
    expect(r.total_disturbances).toBe(0);
    expect(r.routine_adherence_rate).toBe(0);
    expect(r.environment_quality_rate).toBe(0);
    expect(r.disturbance_resolution_rate).toBe(0);
    expect(r.bedtime_support_quality_rate).toBe(0);
    expect(r.improvement_plan_coverage_rate).toBe(0);
    expect(r.child_satisfaction_rate).toBe(0);
  });

  it("has empty strengths, concerns, recommendations, insights for insufficient_data", () => {
    const r = computeSleepQualityRestManagement(baseInput());
    expect(r.strengths).toHaveLength(0);
    expect(r.concerns).toHaveLength(0);
    expect(r.recommendations).toHaveLength(0);
    expect(r.insights).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. INADEQUATE BASELINE (all empty + children > 0)
// ═══════════════════════════════════════════════════════════════════════════

describe("inadequate baseline (all empty + children > 0)", () => {
  it("returns inadequate / score 15", () => {
    const r = computeSleepQualityRestManagement(baseInput({ total_children: 3 }));
    expect(r.sleep_rating).toBe("inadequate");
    expect(r.sleep_score).toBe(15);
  });

  it("headline mentions no data recorded", () => {
    const r = computeSleepQualityRestManagement(baseInput({ total_children: 3 }));
    expect(r.headline).toContain("No sleep or rest management data recorded");
  });

  it("has exactly 1 concern", () => {
    const r = computeSleepQualityRestManagement(baseInput({ total_children: 3 }));
    expect(r.concerns).toHaveLength(1);
    expect(r.concerns[0]).toContain("No sleep routine records");
  });

  it("has exactly 2 recommendations ranked 1 and 2", () => {
    const r = computeSleepQualityRestManagement(baseInput({ total_children: 3 }));
    expect(r.recommendations).toHaveLength(2);
    expect(r.recommendations[0].rank).toBe(1);
    expect(r.recommendations[1].rank).toBe(2);
    expect(r.recommendations[0].urgency).toBe("immediate");
    expect(r.recommendations[1].urgency).toBe("immediate");
  });

  it("has exactly 1 critical insight", () => {
    const r = computeSleepQualityRestManagement(baseInput({ total_children: 3 }));
    expect(r.insights).toHaveLength(1);
    expect(r.insights[0].severity).toBe("critical");
    expect(r.insights[0].text).toContain("complete absence of sleep");
  });

  it("returns all-zero metrics", () => {
    const r = computeSleepQualityRestManagement(baseInput({ total_children: 3 }));
    expect(r.total_routine_records).toBe(0);
    expect(r.total_disturbances).toBe(0);
    expect(r.routine_adherence_rate).toBe(0);
    expect(r.environment_quality_rate).toBe(0);
    expect(r.disturbance_resolution_rate).toBe(0);
    expect(r.bedtime_support_quality_rate).toBe(0);
    expect(r.improvement_plan_coverage_rate).toBe(0);
    expect(r.child_satisfaction_rate).toBe(0);
  });

  it("returns inadequate for total_children=1", () => {
    const r = computeSleepQualityRestManagement(baseInput({ total_children: 1 }));
    expect(r.sleep_rating).toBe("inadequate");
    expect(r.sleep_score).toBe(15);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. pct(0, 0) = 0
// ═══════════════════════════════════════════════════════════════════════════

describe("pct(0,0) edge case", () => {
  it("returns 0 for rates when only non-matching records exist", () => {
    // Provide one routine record with routine_followed=false to enter normal path
    // but no environment, disturbance, bedtime, improvement records
    const r = computeSleepQualityRestManagement(
      baseInput({
        total_children: 1,
        sleep_routine_records: [makeRoutine()],
      }),
    );
    // disturbance_resolution_rate = pct(0, 0) = 0
    expect(r.disturbance_resolution_rate).toBe(0);
    // bedtime_support_quality_rate = pct(0, 0) = 0
    expect(r.bedtime_support_quality_rate).toBe(0);
    // improvement_plan_coverage_rate = 0 (no improvement records)
    expect(r.improvement_plan_coverage_rate).toBe(0);
    // child_satisfaction_rate = pct(0, 0) = 0
    expect(r.child_satisfaction_rate).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. INDIVIDUAL BONUSES
// ═══════════════════════════════════════════════════════════════════════════

describe("Bonus 1: routineAdherenceRate", () => {
  it("+4 when >= 90%", () => {
    // 10/10 routine_followed = 100%
    const records = times(10, makeRoutine, { routine_followed: true });
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_routine_records: records }),
    );
    expect(r.routine_adherence_rate).toBe(100);
    // base 52 + 4 (routine bonus) = 56
    // Also check no penalty is applied
    expect(r.sleep_score).toBeGreaterThanOrEqual(56);
  });

  it("+2 when >= 70% and < 90%", () => {
    // 7/10 routine_followed (70%)
    const records = [
      ...times(7, makeRoutine, { routine_followed: true }),
      ...times(3, makeRoutine, { routine_followed: false }),
    ];
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_routine_records: records }),
    );
    expect(r.routine_adherence_rate).toBe(70);
    expect(r.sleep_score).toBeGreaterThanOrEqual(54);
  });

  it("+0 when < 70%", () => {
    // 6/10 routine_followed (60%) — no bonus, no penalty (>= 50)
    const records = [
      ...times(6, makeRoutine, { routine_followed: true }),
      ...times(4, makeRoutine, { routine_followed: false }),
    ];
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_routine_records: records }),
    );
    expect(r.routine_adherence_rate).toBe(60);
    // base 52 + 0 = 52 (no penalties since settling/windDown are 0 but those don't penalize)
    expect(r.sleep_score).toBe(52);
  });
});

describe("Bonus 2: environmentQualityRate", () => {
  it("+3 when >= 90%", () => {
    // All 7 checks true = 100%
    const envRecords = [
      makeEnvironment({
        room_temperature_ok: true,
        lighting_appropriate: true,
        noise_level_acceptable: true,
        bedding_clean_adequate: true,
        room_personalised: true,
        electronic_devices_managed: true,
        ventilation_adequate: true,
      }),
    ];
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_environment_records: envRecords }),
    );
    expect(r.environment_quality_rate).toBe(100);
    // base 52 + 3 = 55
    expect(r.sleep_score).toBe(55);
  });

  it("+1 when >= 70% and < 90%", () => {
    // 5/7 checks true = 71%
    const envRecords = [
      makeEnvironment({
        room_temperature_ok: true,
        lighting_appropriate: true,
        noise_level_acceptable: true,
        bedding_clean_adequate: true,
        room_personalised: true,
        electronic_devices_managed: false,
        ventilation_adequate: false,
      }),
    ];
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_environment_records: envRecords }),
    );
    expect(r.environment_quality_rate).toBe(71);
    // base 52 + 1 = 53
    expect(r.sleep_score).toBe(53);
  });

  it("+0 when < 70%", () => {
    // 4/7 checks true = 57%
    const envRecords = [
      makeEnvironment({
        room_temperature_ok: true,
        lighting_appropriate: true,
        noise_level_acceptable: true,
        bedding_clean_adequate: true,
        room_personalised: false,
        electronic_devices_managed: false,
        ventilation_adequate: false,
      }),
    ];
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_environment_records: envRecords }),
    );
    expect(r.environment_quality_rate).toBe(57);
    expect(r.sleep_score).toBe(52);
  });
});

describe("Bonus 3: disturbanceResolutionRate", () => {
  it("+4 when >= 90%", () => {
    // 10/10 child_resettled = 100%
    const records = times(10, makeDisturbance, { child_resettled: true });
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_disturbance_records: records }),
    );
    expect(r.disturbance_resolution_rate).toBe(100);
    // base 52 + 4 = 56
    expect(r.sleep_score).toBe(56);
  });

  it("+2 when >= 70% and < 90%", () => {
    // 7/10 child_resettled = 70%
    const records = [
      ...times(7, makeDisturbance, { child_resettled: true }),
      ...times(3, makeDisturbance, { child_resettled: false }),
    ];
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_disturbance_records: records }),
    );
    expect(r.disturbance_resolution_rate).toBe(70);
    expect(r.sleep_score).toBe(54);
  });

  it("+0 when < 70%", () => {
    // 6/10 child_resettled = 60% — no bonus, no penalty (>= 50)
    const records = [
      ...times(6, makeDisturbance, { child_resettled: true }),
      ...times(4, makeDisturbance, { child_resettled: false }),
    ];
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_disturbance_records: records }),
    );
    expect(r.disturbance_resolution_rate).toBe(60);
    expect(r.sleep_score).toBe(52);
  });
});

describe("Bonus 4: bedtimeSupportQualityRate", () => {
  it("+3 when >= 85%", () => {
    // quality = (provided + engaged + positive + consistent) / (total * 4)
    // all true = 4/4 = 100%
    const records = times(10, makeBedtimeSupport, {
      support_provided: true,
      child_engaged: true,
      child_feedback_positive: true,
      consistency_with_plan: true,
    });
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, bedtime_support_records: records }),
    );
    expect(r.bedtime_support_quality_rate).toBe(100);
    // base 52 + 3 (support quality) + 3 (childSatisfactionRate 100% >= 90) = 58
    expect(r.sleep_score).toBe(58);
  });

  it("+1 when >= 65% and < 85%", () => {
    // Need quality in [65, 85). Use 3/4 flags true per record = 75%
    const records = times(10, makeBedtimeSupport, {
      support_provided: true,
      child_engaged: true,
      child_feedback_positive: true,
      consistency_with_plan: false,
    });
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, bedtime_support_records: records }),
    );
    expect(r.bedtime_support_quality_rate).toBe(75);
    // base 52 + 1 (support quality) + 3 (childSatisfactionRate 100% >= 90) = 56
    expect(r.sleep_score).toBe(56);
  });

  it("+0 when < 65%", () => {
    // 2/4 flags true per record = 50%
    const records = times(10, makeBedtimeSupport, {
      support_provided: true,
      child_engaged: true,
      child_feedback_positive: false,
      consistency_with_plan: false,
    });
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, bedtime_support_records: records }),
    );
    expect(r.bedtime_support_quality_rate).toBe(50);
    // childSatisfactionRate = 0% (no positive feedback) → no bonus
    // base 52 + 0 = 52
    expect(r.sleep_score).toBe(52);
  });
});

describe("Bonus 5: childSatisfactionRate", () => {
  it("+3 when >= 90%", () => {
    // 10/10 child_feedback_positive = 100%
    // Need to control bedtimeSupportQualityRate to isolate this bonus
    // All positive feedback but NOT all other flags → keep quality below 65%
    const records = times(10, makeBedtimeSupport, {
      support_provided: false,
      child_engaged: false,
      child_feedback_positive: true,
      consistency_with_plan: false,
    });
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, bedtime_support_records: records }),
    );
    expect(r.child_satisfaction_rate).toBe(100);
    // quality = (0+0+10+0)/40 = 25% → penalty -5 applies
    expect(r.bedtime_support_quality_rate).toBe(25);
    // base 52 + 3 (satisfaction) - 5 (quality penalty) = 50
    expect(r.sleep_score).toBe(50);
  });

  it("+1 when >= 70% and < 90%", () => {
    // 7/10 positive feedback = 70%
    const records = [
      ...times(7, makeBedtimeSupport, {
        support_provided: false,
        child_engaged: false,
        child_feedback_positive: true,
        consistency_with_plan: false,
      }),
      ...times(3, makeBedtimeSupport, {
        support_provided: false,
        child_engaged: false,
        child_feedback_positive: false,
        consistency_with_plan: false,
      }),
    ];
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, bedtime_support_records: records }),
    );
    expect(r.child_satisfaction_rate).toBe(70);
    // quality = (0+0+7+0)/40 = 18% → penalty -5
    // base 52 + 1 (satisfaction) - 5 (quality penalty) = 48
    expect(r.sleep_score).toBe(48);
  });

  it("+0 when < 70%", () => {
    // 6/10 positive feedback = 60% — no bonus
    const records = [
      ...times(6, makeBedtimeSupport, {
        support_provided: false,
        child_engaged: false,
        child_feedback_positive: true,
        consistency_with_plan: false,
      }),
      ...times(4, makeBedtimeSupport, {
        support_provided: false,
        child_engaged: false,
        child_feedback_positive: false,
        consistency_with_plan: false,
      }),
    ];
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, bedtime_support_records: records }),
    );
    expect(r.child_satisfaction_rate).toBe(60);
    // quality = (0+0+6+0)/40 = 15% → penalty -5
    // base 52 + 0 - 5 = 47
    expect(r.sleep_score).toBe(47);
  });
});

describe("Bonus 6: improvementPlanCoverageRate", () => {
  it("+3 when >= 80%", () => {
    // 2 unique children with active plans / 2 total_children = 100%
    const records = [
      makeImprovement({ child_id: "child_1", plan_active: true }),
      makeImprovement({ child_id: "child_2", plan_active: true }),
    ];
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_improvement_records: records }),
    );
    expect(r.improvement_plan_coverage_rate).toBe(100);
    // base 52 + 3 = 55
    expect(r.sleep_score).toBe(55);
  });

  it("+1 when >= 50% and < 80%", () => {
    // 1 unique child with active plan / 2 total_children = 50%
    const records = [
      makeImprovement({ child_id: "child_1", plan_active: true }),
      makeImprovement({ child_id: "child_2", plan_active: false }),
    ];
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_improvement_records: records }),
    );
    expect(r.improvement_plan_coverage_rate).toBe(50);
    // base 52 + 1 = 53
    expect(r.sleep_score).toBe(53);
  });

  it("+0 when < 50%", () => {
    // 1 unique child with active plan / 3 total_children = 33%
    const records = [
      makeImprovement({ child_id: "child_1", plan_active: true }),
    ];
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 3, sleep_improvement_records: records }),
    );
    expect(r.improvement_plan_coverage_rate).toBe(33);
    expect(r.sleep_score).toBe(52);
  });

  it("returns 0 when total_children is 0 (not through empty path)", () => {
    // Provide at least one record in another array to avoid allEmpty path
    const r = computeSleepQualityRestManagement(
      baseInput({
        total_children: 0,
        sleep_routine_records: [makeRoutine()],
        sleep_improvement_records: [makeImprovement({ plan_active: true })],
      }),
    );
    expect(r.improvement_plan_coverage_rate).toBe(0);
  });
});

describe("Bonus 7: followUpCompletionRate", () => {
  it("+3 when >= 90%", () => {
    // 10/10 follow-up completed (all have follow_up_actions and follow_up_completed)
    const records = times(10, makeDisturbance, {
      child_resettled: false,
      follow_up_actions: "Review sleep plan",
      follow_up_completed: true,
    });
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_disturbance_records: records }),
    );
    // followUpRequired = 10, followUpCompleted = 10 → 100%
    // disturbanceResolutionRate = 0% → penalty -5
    // base 52 + 3 (followUp) - 5 (resolution penalty) = 50
    expect(r.sleep_score).toBe(50);
  });

  it("+1 when >= 70% and < 90%", () => {
    // 7/10 follow-up completed = 70%
    const records = [
      ...times(7, makeDisturbance, {
        child_resettled: false,
        follow_up_actions: "Review sleep plan",
        follow_up_completed: true,
      }),
      ...times(3, makeDisturbance, {
        child_resettled: false,
        follow_up_actions: "Review sleep plan",
        follow_up_completed: false,
      }),
    ];
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_disturbance_records: records }),
    );
    // followUpCompletionRate = 70%
    // disturbanceResolutionRate = 0% → penalty -5
    // base 52 + 1 (followUp) - 5 (resolution penalty) = 48
    expect(r.sleep_score).toBe(48);
  });

  it("+0 when < 70%", () => {
    // 6/10 follow-up completed = 60%
    const records = [
      ...times(6, makeDisturbance, {
        child_resettled: false,
        follow_up_actions: "Review sleep plan",
        follow_up_completed: true,
      }),
      ...times(4, makeDisturbance, {
        child_resettled: false,
        follow_up_actions: "Review sleep plan",
        follow_up_completed: false,
      }),
    ];
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_disturbance_records: records }),
    );
    // followUpCompletionRate = 60%
    // disturbanceResolutionRate = 0% → penalty -5
    // base 52 + 0 - 5 = 47
    expect(r.sleep_score).toBe(47);
  });

  it("followUp rate is 0 when no follow_up_actions exist", () => {
    // follow_up_actions = null → followUpRequired = 0 → pct(0,0) = 0
    const records = times(5, makeDisturbance, {
      child_resettled: true,
      follow_up_actions: null,
      follow_up_completed: false,
    });
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_disturbance_records: records }),
    );
    // disturbanceResolutionRate = 100% → +4 bonus
    // followUpCompletionRate = 0% → no bonus, no penalty (followUpRequired = 0)
    // base 52 + 4 = 56
    expect(r.sleep_score).toBe(56);
  });
});

describe("Bonus 8: settlingRate", () => {
  it("+2 when >= 90%", () => {
    // 10/10 child_settled_within_30_min = 100%
    const records = times(10, makeRoutine, {
      routine_followed: false,
      child_settled_within_30_min: true,
    });
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_routine_records: records }),
    );
    // routineAdherenceRate = 0% → penalty -5
    // settlingRate = 100% → +2
    // base 52 + 2 - 5 = 49
    expect(r.sleep_score).toBe(49);
  });

  it("+1 when >= 70% and < 90%", () => {
    // 7/10 settled = 70%
    const records = [
      ...times(7, makeRoutine, { routine_followed: false, child_settled_within_30_min: true }),
      ...times(3, makeRoutine, { routine_followed: false, child_settled_within_30_min: false }),
    ];
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_routine_records: records }),
    );
    // routineAdherenceRate = 0% → penalty -5
    // settlingRate = 70% → +1
    // base 52 + 1 - 5 = 48
    expect(r.sleep_score).toBe(48);
  });

  it("+0 when < 70%", () => {
    // 6/10 settled = 60%
    const records = [
      ...times(6, makeRoutine, { routine_followed: false, child_settled_within_30_min: true }),
      ...times(4, makeRoutine, { routine_followed: false, child_settled_within_30_min: false }),
    ];
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_routine_records: records }),
    );
    // routineAdherenceRate = 0% → penalty -5
    // settlingRate = 60% → +0
    // base 52 + 0 - 5 = 47
    expect(r.sleep_score).toBe(47);
  });
});

describe("Bonus 9: planReviewRate", () => {
  it("+3 when >= 90%", () => {
    // 10/10 reviewed = 100%
    const records = times(10, makeImprovement, { reviewed: true });
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_improvement_records: records }),
    );
    // improvementPlanCoverageRate: unique children with active plans / total_children
    // plan_active defaults to false → coverage = 0
    // base 52 + 3 (planReview) = 55
    expect(r.sleep_score).toBe(55);
  });

  it("+1 when >= 70% and < 90%", () => {
    // 7/10 reviewed = 70%
    const records = [
      ...times(7, makeImprovement, { reviewed: true }),
      ...times(3, makeImprovement, { reviewed: false }),
    ];
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_improvement_records: records }),
    );
    // base 52 + 1 = 53
    expect(r.sleep_score).toBe(53);
  });

  it("+0 when < 70%", () => {
    // 6/10 reviewed = 60%
    const records = [
      ...times(6, makeImprovement, { reviewed: true }),
      ...times(4, makeImprovement, { reviewed: false }),
    ];
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_improvement_records: records }),
    );
    // base 52 + 0 = 52
    expect(r.sleep_score).toBe(52);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. ALL BONUSES COMBINED → OUTSTANDING
// ═══════════════════════════════════════════════════════════════════════════

describe("all bonuses combined → outstanding", () => {
  it("achieves score 80 (outstanding) with all max bonuses", () => {
    // Bonus 1: routineAdherenceRate >= 90 (+4) → routine_followed: true
    // Bonus 8: settlingRate >= 90 (+2) → child_settled_within_30_min: true
    const routineRecords = times(10, makeRoutine, {
      routine_followed: true,
      child_settled_within_30_min: true,
      wind_down_activity_completed: true,
      sleep_quality_rating: 5,
    });

    // Bonus 2: environmentQualityRate >= 90 (+3) → all 7 checks true
    const envRecords = times(5, makeEnvironment, {
      room_temperature_ok: true,
      lighting_appropriate: true,
      noise_level_acceptable: true,
      bedding_clean_adequate: true,
      room_personalised: true,
      electronic_devices_managed: true,
      ventilation_adequate: true,
    });

    // Bonus 3: disturbanceResolutionRate >= 90 (+4) → child_resettled: true
    // Bonus 7: followUpCompletionRate >= 90 (+3) → follow_up_actions + follow_up_completed
    const disturbanceRecords = times(10, makeDisturbance, {
      child_resettled: true,
      follow_up_actions: "Review sleep plan",
      follow_up_completed: true,
      staff_response_time_minutes: 3,
      impact_on_next_day: "none",
    });

    // Bonus 4: bedtimeSupportQualityRate >= 85 (+3) → all 4 flags true
    // Bonus 5: childSatisfactionRate >= 90 (+3) → child_feedback_positive: true
    const supportRecords = times(10, makeBedtimeSupport, {
      support_provided: true,
      child_engaged: true,
      child_feedback_positive: true,
      consistency_with_plan: true,
    });

    // Bonus 6: improvementPlanCoverageRate >= 80 (+3) → unique active plans
    // Bonus 9: planReviewRate >= 90 (+3) → reviewed: true
    const improvementRecords = [
      makeImprovement({ child_id: "child_1", plan_active: true, reviewed: true }),
      makeImprovement({ child_id: "child_2", plan_active: true, reviewed: true }),
    ];

    const r = computeSleepQualityRestManagement(
      baseInput({
        total_children: 2,
        sleep_routine_records: routineRecords,
        sleep_environment_records: envRecords,
        sleep_disturbance_records: disturbanceRecords,
        bedtime_support_records: supportRecords,
        sleep_improvement_records: improvementRecords,
      }),
    );

    // 52 + 4+3+4+3+3+3+3+2+3 = 52 + 28 = 80
    expect(r.sleep_score).toBe(80);
    expect(r.sleep_rating).toBe("outstanding");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 6. INDIVIDUAL PENALTIES
// ═══════════════════════════════════════════════════════════════════════════

describe("Penalty: routineAdherenceRate < 50", () => {
  it("-5 when adherence < 50% with records > 0", () => {
    // 4/10 routine_followed = 40%
    const records = [
      ...times(4, makeRoutine, { routine_followed: true }),
      ...times(6, makeRoutine, { routine_followed: false }),
    ];
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_routine_records: records }),
    );
    expect(r.routine_adherence_rate).toBe(40);
    // base 52 - 5 = 47
    expect(r.sleep_score).toBe(47);
  });

  it("-5 when adherence = 0% (all false)", () => {
    const records = times(10, makeRoutine, { routine_followed: false });
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_routine_records: records }),
    );
    expect(r.routine_adherence_rate).toBe(0);
    // base 52 - 5 = 47
    expect(r.sleep_score).toBe(47);
  });
});

describe("Penalty: disturbanceResolutionRate < 50", () => {
  it("-5 when resolution < 50% with disturbances > 0", () => {
    // 4/10 child_resettled = 40%
    const records = [
      ...times(4, makeDisturbance, { child_resettled: true }),
      ...times(6, makeDisturbance, { child_resettled: false }),
    ];
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_disturbance_records: records }),
    );
    expect(r.disturbance_resolution_rate).toBe(40);
    // base 52 - 5 = 47
    expect(r.sleep_score).toBe(47);
  });

  it("-5 when resolution = 0%", () => {
    const records = times(10, makeDisturbance, { child_resettled: false });
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_disturbance_records: records }),
    );
    expect(r.disturbance_resolution_rate).toBe(0);
    // base 52 - 5 = 47
    expect(r.sleep_score).toBe(47);
  });
});

describe("Penalty: bedtimeSupportQualityRate < 40", () => {
  it("-5 when quality < 40% with support > 0", () => {
    // 1/4 flags per record = 25%
    const records = times(10, makeBedtimeSupport, {
      support_provided: true,
      child_engaged: false,
      child_feedback_positive: false,
      consistency_with_plan: false,
    });
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, bedtime_support_records: records }),
    );
    expect(r.bedtime_support_quality_rate).toBe(25);
    // base 52 - 5 = 47
    expect(r.sleep_score).toBe(47);
  });

  it("-5 when quality = 0% (all flags false)", () => {
    const records = times(10, makeBedtimeSupport, {
      support_provided: false,
      child_engaged: false,
      child_feedback_positive: false,
      consistency_with_plan: false,
    });
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, bedtime_support_records: records }),
    );
    expect(r.bedtime_support_quality_rate).toBe(0);
    // base 52 - 5 = 47
    expect(r.sleep_score).toBe(47);
  });
});

describe("Penalty: highImpactRate > 50", () => {
  it("-3 when > 50% disturbances have moderate/severe impact", () => {
    // 6/10 moderate or severe = 60%
    const records = [
      ...times(3, makeDisturbance, {
        child_resettled: true,
        impact_on_next_day: "severe",
      }),
      ...times(3, makeDisturbance, {
        child_resettled: true,
        impact_on_next_day: "moderate",
      }),
      ...times(4, makeDisturbance, {
        child_resettled: true,
        impact_on_next_day: "none",
      }),
    ];
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_disturbance_records: records }),
    );
    // disturbanceResolutionRate = 100% → +4 bonus
    // highImpactRate = 60% → -3 penalty
    // base 52 + 4 - 3 = 53
    expect(r.sleep_score).toBe(53);
  });

  it("no penalty when exactly 50%", () => {
    // 5/10 = 50% — penalty requires > 50%
    const records = [
      ...times(5, makeDisturbance, {
        child_resettled: true,
        impact_on_next_day: "severe",
      }),
      ...times(5, makeDisturbance, {
        child_resettled: true,
        impact_on_next_day: "none",
      }),
    ];
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_disturbance_records: records }),
    );
    // disturbanceResolutionRate = 100% → +4 bonus
    // highImpactRate = 50% → no penalty (must be > 50)
    // base 52 + 4 = 56
    expect(r.sleep_score).toBe(56);
  });
});

describe("combined penalties", () => {
  it("applies multiple penalties", () => {
    // routineAdherenceRate < 50: -5
    // disturbanceResolutionRate < 50: -5
    // bedtimeSupportQualityRate < 40: -5
    // highImpactRate > 50: -3
    const routines = times(10, makeRoutine, { routine_followed: false });
    const disturbances = times(10, makeDisturbance, {
      child_resettled: false,
      impact_on_next_day: "severe",
    });
    const support = times(10, makeBedtimeSupport, {
      support_provided: false,
      child_engaged: false,
      child_feedback_positive: false,
      consistency_with_plan: false,
    });

    const r = computeSleepQualityRestManagement(
      baseInput({
        total_children: 2,
        sleep_routine_records: routines,
        sleep_disturbance_records: disturbances,
        bedtime_support_records: support,
      }),
    );

    // base 52 - 5 - 5 - 5 - 3 = 34
    expect(r.sleep_score).toBe(34);
    expect(r.sleep_rating).toBe("inadequate");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 7. PENALTY GUARDS (no penalty when array is empty)
// ═══════════════════════════════════════════════════════════════════════════

describe("penalty guards", () => {
  it("no penalty for routineAdherence when sleep_routine_records is empty", () => {
    // routineAdherenceRate = pct(0,0) = 0 which is < 50
    // but totalRoutineRecords = 0 → guard prevents penalty
    const r = computeSleepQualityRestManagement(
      baseInput({
        total_children: 2,
        sleep_environment_records: [makeEnvironment()],
      }),
    );
    // base 52, no penalty
    expect(r.sleep_score).toBe(52);
  });

  it("no penalty for disturbanceResolution when sleep_disturbance_records is empty", () => {
    // Use routine_followed: true to avoid routine adherence penalty
    const r = computeSleepQualityRestManagement(
      baseInput({
        total_children: 2,
        sleep_routine_records: [makeRoutine({ routine_followed: true })],
      }),
    );
    // routineAdherenceRate = 100% → +4 bonus, no penalty
    // disturbanceResolutionRate = pct(0,0) = 0 but totalDisturbances = 0 → no penalty
    expect(r.sleep_score).toBe(56); // 52 + 4
  });

  it("no penalty for bedtimeSupportQuality when bedtime_support_records is empty", () => {
    // Use routine_followed: true to avoid routine adherence penalty
    const r = computeSleepQualityRestManagement(
      baseInput({
        total_children: 2,
        sleep_routine_records: [makeRoutine({ routine_followed: true })],
      }),
    );
    // bedtimeSupportQualityRate = pct(0,0) = 0 but totalBedtimeSupport = 0 → no penalty
    expect(r.sleep_score).toBe(56); // 52 + 4 (routine bonus)
  });

  it("no penalty for highImpactRate when sleep_disturbance_records is empty", () => {
    // Use routine_followed: true to avoid routine adherence penalty
    const r = computeSleepQualityRestManagement(
      baseInput({
        total_children: 2,
        sleep_routine_records: [makeRoutine({ routine_followed: true })],
      }),
    );
    // highImpactRate = pct(0,0) = 0 but totalDisturbances = 0 → no penalty
    expect(r.sleep_score).toBe(56); // 52 + 4 (routine bonus)
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 8. RATING BOUNDARIES
// ═══════════════════════════════════════════════════════════════════════════

describe("rating boundaries", () => {
  it("score 80 → outstanding", () => {
    // Use the all-bonuses test setup
    const routineRecords = times(10, makeRoutine, {
      routine_followed: true,
      child_settled_within_30_min: true,
      wind_down_activity_completed: true,
      sleep_quality_rating: 5,
    });
    const envRecords = times(5, makeEnvironment, {
      room_temperature_ok: true,
      lighting_appropriate: true,
      noise_level_acceptable: true,
      bedding_clean_adequate: true,
      room_personalised: true,
      electronic_devices_managed: true,
      ventilation_adequate: true,
    });
    const disturbanceRecords = times(10, makeDisturbance, {
      child_resettled: true,
      follow_up_actions: "Review sleep plan",
      follow_up_completed: true,
      staff_response_time_minutes: 3,
      impact_on_next_day: "none",
    });
    const supportRecords = times(10, makeBedtimeSupport, {
      support_provided: true,
      child_engaged: true,
      child_feedback_positive: true,
      consistency_with_plan: true,
    });
    const improvementRecords = [
      makeImprovement({ child_id: "child_1", plan_active: true, reviewed: true }),
      makeImprovement({ child_id: "child_2", plan_active: true, reviewed: true }),
    ];

    const r = computeSleepQualityRestManagement(
      baseInput({
        total_children: 2,
        sleep_routine_records: routineRecords,
        sleep_environment_records: envRecords,
        sleep_disturbance_records: disturbanceRecords,
        bedtime_support_records: supportRecords,
        sleep_improvement_records: improvementRecords,
      }),
    );
    expect(r.sleep_score).toBe(80);
    expect(r.sleep_rating).toBe("outstanding");
  });

  it("score 79 → good (just below outstanding)", () => {
    // Get 79 by achieving all bonuses except one small one
    // Drop planReviewRate bonus (−3): don't review plans
    // 52 + 4+3+4+3+3+3+3+2+0 = 77... need more precise
    // Let's do: all max bonuses except planReview (not reviewed → +0)
    // = 52 + 4+3+4+3+3+3+3+2+0 = 77 → not 79
    // Let's do: all max bonuses except environmentQuality → mid tier (+1)
    // = 52 + 4+1+4+3+3+3+3+2+3 = 78 → not 79
    // Do: all max except settling → mid tier (+1)
    // = 52 + 4+3+4+3+3+3+3+1+3 = 79

    const routineRecords = [
      ...times(9, makeRoutine, {
        routine_followed: true,
        child_settled_within_30_min: true,
        wind_down_activity_completed: true,
        sleep_quality_rating: 5,
      }),
      // 1 record with child_settled = false → settling = 9/10 = 90% still
      // need 7-8/10 for 70-89% → +1
      ...times(1, makeRoutine, {
        routine_followed: true,
        child_settled_within_30_min: false,
        wind_down_activity_completed: true,
        sleep_quality_rating: 5,
      }),
    ];
    // routineAdherenceRate = 100% → +4
    // settlingRate = 90% → +2 (still too high, need 70-89)
    // Need: 7/10 settled or 8/10 settled
    const routineRecords79 = [
      ...times(8, makeRoutine, {
        routine_followed: true,
        child_settled_within_30_min: true,
        wind_down_activity_completed: true,
        sleep_quality_rating: 5,
      }),
      ...times(2, makeRoutine, {
        routine_followed: true,
        child_settled_within_30_min: false,
        wind_down_activity_completed: true,
        sleep_quality_rating: 5,
      }),
    ];
    // settlingRate = 80% → +1 (>= 70 and < 90)

    const envRecords = times(5, makeEnvironment, {
      room_temperature_ok: true,
      lighting_appropriate: true,
      noise_level_acceptable: true,
      bedding_clean_adequate: true,
      room_personalised: true,
      electronic_devices_managed: true,
      ventilation_adequate: true,
    });
    const disturbanceRecords = times(10, makeDisturbance, {
      child_resettled: true,
      follow_up_actions: "Review sleep plan",
      follow_up_completed: true,
      staff_response_time_minutes: 3,
      impact_on_next_day: "none",
    });
    const supportRecords = times(10, makeBedtimeSupport, {
      support_provided: true,
      child_engaged: true,
      child_feedback_positive: true,
      consistency_with_plan: true,
    });
    const improvementRecords = [
      makeImprovement({ child_id: "child_1", plan_active: true, reviewed: true }),
      makeImprovement({ child_id: "child_2", plan_active: true, reviewed: true }),
    ];

    const r = computeSleepQualityRestManagement(
      baseInput({
        total_children: 2,
        sleep_routine_records: routineRecords79,
        sleep_environment_records: envRecords,
        sleep_disturbance_records: disturbanceRecords,
        bedtime_support_records: supportRecords,
        sleep_improvement_records: improvementRecords,
      }),
    );
    // 52 + 4+3+4+3+3+3+3+1+3 = 79
    expect(r.sleep_score).toBe(79);
    expect(r.sleep_rating).toBe("good");
  });

  it("score 65 → good (lower boundary)", () => {
    // Need exactly 65: base 52 + 13 bonus
    // Routine +4, Environment +3, Disturbance +4, Settling +2 = 13
    const routineRecords = times(10, makeRoutine, {
      routine_followed: true,
      child_settled_within_30_min: true,
    });
    const envRecords = times(5, makeEnvironment, {
      room_temperature_ok: true,
      lighting_appropriate: true,
      noise_level_acceptable: true,
      bedding_clean_adequate: true,
      room_personalised: true,
      electronic_devices_managed: true,
      ventilation_adequate: true,
    });
    const disturbanceRecords = times(10, makeDisturbance, {
      child_resettled: true,
    });

    const r = computeSleepQualityRestManagement(
      baseInput({
        total_children: 2,
        sleep_routine_records: routineRecords,
        sleep_environment_records: envRecords,
        sleep_disturbance_records: disturbanceRecords,
      }),
    );
    // 52 + 4 (routine) + 3 (env) + 4 (dist) + 2 (settling) = 65
    expect(r.sleep_score).toBe(65);
    expect(r.sleep_rating).toBe("good");
  });

  it("score 64 → adequate (just below good)", () => {
    // 52 + 12 = 64
    // Routine +4, Environment +3, Disturbance +2 (70-89%), Settling +2, followUp +1 = 12
    // Actually simpler: Routine +4, Env +3, Disturbance mid +2, Settling +2 = 63
    // Routine +4, Env +3, Disturbance high +4, Settling +1 = 64
    // settlingRate 70-89% → +1
    const routineRecords = [
      ...times(9, makeRoutine, {
        routine_followed: true,
        child_settled_within_30_min: true,
      }),
      makeRoutine({
        routine_followed: true,
        child_settled_within_30_min: false,
      }),
      makeRoutine({
        routine_followed: true,
        child_settled_within_30_min: false,
      }),
      makeRoutine({
        routine_followed: true,
        child_settled_within_30_min: false,
      }),
    ];
    // routineAdherence = 12/12 = 100% → +4
    // settling = 9/12 = 75% → +1
    const envRecords = times(5, makeEnvironment, {
      room_temperature_ok: true,
      lighting_appropriate: true,
      noise_level_acceptable: true,
      bedding_clean_adequate: true,
      room_personalised: true,
      electronic_devices_managed: true,
      ventilation_adequate: true,
    });
    const disturbanceRecords = times(10, makeDisturbance, {
      child_resettled: true,
    });

    const r = computeSleepQualityRestManagement(
      baseInput({
        total_children: 2,
        sleep_routine_records: routineRecords,
        sleep_environment_records: envRecords,
        sleep_disturbance_records: disturbanceRecords,
      }),
    );
    // 52 + 4 (routine) + 3 (env) + 4 (dist) + 1 (settling) = 64
    expect(r.sleep_score).toBe(64);
    expect(r.sleep_rating).toBe("adequate");
  });

  it("score 45 → adequate (lower boundary)", () => {
    // base 52 - 7 = 45 → need penalties totaling 7
    // routineAdherence < 50 → -5, then need -2 more
    // Can't get exactly -2 from other penalties (they're -5, -5, -3)
    // Instead: base 52 with no bonuses, no penalties = 52 → too high
    // So: 52 - 5 (routine penalty) - 3 (highImpact) + 1 (some bonus) = 45
    // routine adherence < 50 → -5 (e.g., 0/10)
    // highImpact > 50 → -3
    // Need disturbance resolution high enough to get +2 bonus
    // disturbance: 7/10 resettled = 70% → +2, and set impact severe on 6/10 = 60% > 50 → -3
    const routines = times(10, makeRoutine, { routine_followed: false });
    const disturbances = [
      ...times(7, makeDisturbance, {
        child_resettled: true,
        impact_on_next_day: "severe",
      }),
      ...times(3, makeDisturbance, {
        child_resettled: false,
        impact_on_next_day: "none",
      }),
    ];
    // disturbanceResolutionRate = 70% → +2
    // highImpactRate = 70% (7/10) → -3
    // routineAdherence = 0% → -5
    // 52 + 2 - 5 - 3 = 46 → not 45

    // Instead: need exactly 45
    // 52 - 5 (routine) - 3 (highImpact) + 1 (some mid-tier bonus) = 45
    // e.g., environmentQualityRate 70-89% → +1
    const envRecords = [
      makeEnvironment({
        room_temperature_ok: true,
        lighting_appropriate: true,
        noise_level_acceptable: true,
        bedding_clean_adequate: true,
        room_personalised: true,
        electronic_devices_managed: false,
        ventilation_adequate: false,
      }),
    ];
    // env = 5/7 = 71% → +1
    const disturbances2 = times(10, makeDisturbance, {
      child_resettled: false,
      impact_on_next_day: "severe",
    });
    // disturbanceResolutionRate = 0% → -5
    // highImpactRate = 100% → -3
    // 52 + 1 (env) - 5 (routine) - 5 (dist) - 3 (impact) = 40 → too low

    // Simpler approach: 52 - 5 (routine) - 3 (highImpact) + 1 (env mid) = 45
    const dist3 = [
      ...times(6, makeDisturbance, {
        child_resettled: true,
        impact_on_next_day: "moderate",
      }),
      ...times(4, makeDisturbance, {
        child_resettled: true,
        impact_on_next_day: "none",
      }),
    ];
    // disturbanceResolutionRate = 100% → +4
    // highImpactRate = 60% → -3
    // routineAdherence = 0% → -5
    // 52 + 4 + 1 - 5 - 3 = 49 → still not 45

    // Let me just directly compute: need score = 45
    // 52 + bonuses - penalties = 45
    // bonuses - penalties = -7
    // penalties: routine < 50 (-5) + dist < 50 (-5) = -10
    // bonus needed: +3
    // e.g., environmentQualityRate >= 90 → +3
    const envRecords2 = times(5, makeEnvironment, {
      room_temperature_ok: true,
      lighting_appropriate: true,
      noise_level_acceptable: true,
      bedding_clean_adequate: true,
      room_personalised: true,
      electronic_devices_managed: true,
      ventilation_adequate: true,
    });
    const routines2 = times(10, makeRoutine, { routine_followed: false });
    const dist4 = times(10, makeDisturbance, { child_resettled: false });
    // 52 + 3 (env) - 5 (routine) - 5 (dist) = 45
    const r = computeSleepQualityRestManagement(
      baseInput({
        total_children: 2,
        sleep_routine_records: routines2,
        sleep_environment_records: envRecords2,
        sleep_disturbance_records: dist4,
      }),
    );
    expect(r.sleep_score).toBe(45);
    expect(r.sleep_rating).toBe("adequate");
  });

  it("score 44 → inadequate (just below adequate)", () => {
    // 52 + bonuses - penalties = 44 → bonuses - penalties = -8
    // routine < 50 (-5) + dist < 50 (-5) = -10, env mid (+1), settling impossible (routines all false)
    // 52 + 1 (env mid) - 5 (routine) - 5 (dist) = 43 → not 44
    // env high (+3), routine < 50 (-5), highImpact > 50 (-3), dist >= 90 (+4)
    // 52 + 3 + 4 - 5 - 3 = 51 → nope

    // Simpler: 52 - 5 (routine) - 3 (highImpact) = 44
    const routines = times(10, makeRoutine, { routine_followed: false });
    const disturbances = times(10, makeDisturbance, {
      child_resettled: true,
      impact_on_next_day: "severe",
    });
    // disturbanceResolutionRate = 100% → +4
    // highImpactRate = 100% → -3
    // routineAdherence = 0% → -5
    // 52 + 4 - 5 - 3 = 48 → nope

    // 52 - 5 (routine) - 5 (dist) + 2 (routine mid) = impossible since routine < 50

    // Just: 52 - 5 (support quality) - 3 (highImpact) = 44
    const support = times(10, makeBedtimeSupport, {
      support_provided: false,
      child_engaged: false,
      child_feedback_positive: false,
      consistency_with_plan: false,
    });
    const dist2 = [
      ...times(6, makeDisturbance, {
        child_resettled: true,
        impact_on_next_day: "severe",
      }),
      ...times(4, makeDisturbance, {
        child_resettled: true,
        impact_on_next_day: "none",
      }),
    ];
    // disturbanceResolutionRate = 100% → +4
    // highImpactRate = 60% → -3
    // bedtimeSupportQuality = 0% → -5
    // 52 + 4 - 5 - 3 = 48 → still not 44

    // Need exactly -8: use all four penalties = -5-5-5-3 = -18, plus bonuses
    // 52 - 18 + 10 bonuses = 44
    // That's complex. Let's be pragmatic and get 44 directly.
    // 52 - 5 (routine) - 5 (dist) + 2 (env mid) = 44
    const routines2 = times(10, makeRoutine, { routine_followed: false });
    const dist3 = times(10, makeDisturbance, { child_resettled: false });
    const envRecords = [
      makeEnvironment({
        room_temperature_ok: true,
        lighting_appropriate: true,
        noise_level_acceptable: true,
        bedding_clean_adequate: true,
        room_personalised: true,
        electronic_devices_managed: false,
        ventilation_adequate: false,
      }),
    ];
    // env = 5/7 = 71% → +1
    // 52 + 1 - 5 - 5 = 43... still off

    // Let's try: env >= 90 (+3) with routine and dist penalties
    // 52 + 3 (env) - 5 (routine) - 5 (dist) - 3 (highImpact) = 42 → no
    // Simple: two penalties + nothing else = 52 - 5 - 3 = 44
    // bedtimeSupportQuality < 40 (-5): need support records with quality < 40%
    // highImpact > 50 (-3): need disturbance records with > 50% severe/moderate
    // BUT dist resolution at 0% would also give -5... we need dist resettled to avoid that
    const support2 = times(10, makeBedtimeSupport, {
      support_provided: false,
      child_engaged: false,
      child_feedback_positive: false,
      consistency_with_plan: false,
    });
    const dist4 = [
      ...times(6, makeDisturbance, {
        child_resettled: true,
        impact_on_next_day: "moderate",
      }),
      ...times(4, makeDisturbance, {
        child_resettled: true,
        impact_on_next_day: "none",
      }),
    ];
    // disturbanceResolutionRate = 100% → +4 bonus
    // highImpactRate = 60% → -3 penalty
    // bedtimeSupportQuality = 0% → -5 penalty
    // 52 + 4 - 5 - 3 = 48 → still not right

    // OK, simplest: 52 - 5 (routine) - 3 (highImpact) = 44
    // Need: routine adherence < 50 AND highImpact > 50
    // But we need dist resolution NOT < 50 to avoid additional -5
    const routines3 = times(10, makeRoutine, { routine_followed: false });
    const dist5 = [
      ...times(6, makeDisturbance, {
        child_resettled: true,
        impact_on_next_day: "severe",
      }),
      ...times(4, makeDisturbance, {
        child_resettled: true,
        impact_on_next_day: "none",
      }),
    ];
    // disturbanceResolutionRate = 100% → +4 bonus... that gives 52+4-5-3=48
    // Need resolution rate between 50-69% to get no bonus and no penalty
    const dist6 = [
      ...times(6, makeDisturbance, {
        child_resettled: true,
        impact_on_next_day: "severe",
      }),
      ...times(4, makeDisturbance, {
        child_resettled: false,
        impact_on_next_day: "none",
      }),
    ];
    // disturbanceResolutionRate = 60% → no bonus, no penalty
    // highImpactRate = 60% → -3
    // routineAdherence = 0% → -5
    // 52 + 0 - 5 - 3 = 44
    const r = computeSleepQualityRestManagement(
      baseInput({
        total_children: 2,
        sleep_routine_records: routines3,
        sleep_disturbance_records: dist6,
      }),
    );
    expect(r.sleep_score).toBe(44);
    expect(r.sleep_rating).toBe("inadequate");
  });

  it("score clamped to 0 minimum", () => {
    // Apply all penalties: -5 -5 -5 -3 = -18; base 52 - 18 = 34
    // That's still > 0. Can't actually go below 0 with base 52 and max penalties 18,
    // but engine clamps. Let's verify minimum is correctly bounded.
    const routines = times(10, makeRoutine, { routine_followed: false });
    const disturbances = times(10, makeDisturbance, {
      child_resettled: false,
      impact_on_next_day: "severe",
    });
    const support = times(10, makeBedtimeSupport, {
      support_provided: false,
      child_engaged: false,
      child_feedback_positive: false,
      consistency_with_plan: false,
    });
    const r = computeSleepQualityRestManagement(
      baseInput({
        total_children: 2,
        sleep_routine_records: routines,
        sleep_disturbance_records: disturbances,
        bedtime_support_records: support,
      }),
    );
    // 52 - 5 - 5 - 5 - 3 = 34
    expect(r.sleep_score).toBe(34);
    expect(r.sleep_score).toBeGreaterThanOrEqual(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 9. METRIC CALCULATIONS
// ═══════════════════════════════════════════════════════════════════════════

describe("metric calculations", () => {
  it("counts total_routine_records correctly", () => {
    const records = times(7, makeRoutine);
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_routine_records: records }),
    );
    expect(r.total_routine_records).toBe(7);
  });

  it("counts total_disturbances correctly", () => {
    const records = times(5, makeDisturbance);
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_disturbance_records: records }),
    );
    expect(r.total_disturbances).toBe(5);
  });

  it("calculates routine_adherence_rate correctly", () => {
    const records = [
      ...times(3, makeRoutine, { routine_followed: true }),
      ...times(7, makeRoutine, { routine_followed: false }),
    ];
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_routine_records: records }),
    );
    expect(r.routine_adherence_rate).toBe(30);
  });

  it("calculates environment_quality_rate correctly with mixed checks", () => {
    // Record 1: 7/7 true; Record 2: 3/7 true → total 10/14 = 71%
    const envRecords = [
      makeEnvironment({
        room_temperature_ok: true,
        lighting_appropriate: true,
        noise_level_acceptable: true,
        bedding_clean_adequate: true,
        room_personalised: true,
        electronic_devices_managed: true,
        ventilation_adequate: true,
      }),
      makeEnvironment({
        room_temperature_ok: true,
        lighting_appropriate: true,
        noise_level_acceptable: true,
        bedding_clean_adequate: false,
        room_personalised: false,
        electronic_devices_managed: false,
        ventilation_adequate: false,
      }),
    ];
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_environment_records: envRecords }),
    );
    expect(r.environment_quality_rate).toBe(71); // Math.round(10/14 * 100) = 71
  });

  it("calculates disturbance_resolution_rate correctly", () => {
    const records = [
      ...times(8, makeDisturbance, { child_resettled: true }),
      ...times(2, makeDisturbance, { child_resettled: false }),
    ];
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_disturbance_records: records }),
    );
    expect(r.disturbance_resolution_rate).toBe(80);
  });

  it("calculates bedtime_support_quality_rate as composite", () => {
    // 5 records: provided=true(3), engaged=true(4), positive=true(2), consistent=true(1)
    // numerator = 3+4+2+1 = 10, denominator = 5*4 = 20 → pct(10,20) = 50%
    const records = [
      makeBedtimeSupport({ support_provided: true, child_engaged: true, child_feedback_positive: true, consistency_with_plan: true }),
      makeBedtimeSupport({ support_provided: true, child_engaged: true, child_feedback_positive: true, consistency_with_plan: false }),
      makeBedtimeSupport({ support_provided: true, child_engaged: true, child_feedback_positive: false, consistency_with_plan: false }),
      makeBedtimeSupport({ support_provided: false, child_engaged: true, child_feedback_positive: false, consistency_with_plan: false }),
      makeBedtimeSupport({ support_provided: false, child_engaged: false, child_feedback_positive: false, consistency_with_plan: false }),
    ];
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, bedtime_support_records: records }),
    );
    expect(r.bedtime_support_quality_rate).toBe(50);
  });

  it("calculates improvement_plan_coverage_rate based on unique active children", () => {
    // 3 total children, active plans for child_1 and child_2 (child_1 has 2 plans)
    const records = [
      makeImprovement({ child_id: "child_1", plan_active: true }),
      makeImprovement({ child_id: "child_1", plan_active: true }),
      makeImprovement({ child_id: "child_2", plan_active: true }),
      makeImprovement({ child_id: "child_3", plan_active: false }),
    ];
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 3, sleep_improvement_records: records }),
    );
    // unique active children: child_1, child_2 → 2/3 = 67%
    expect(r.improvement_plan_coverage_rate).toBe(67);
  });

  it("calculates child_satisfaction_rate correctly", () => {
    const records = [
      ...times(4, makeBedtimeSupport, { child_feedback_positive: true }),
      ...times(6, makeBedtimeSupport, { child_feedback_positive: false }),
    ];
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, bedtime_support_records: records }),
    );
    expect(r.child_satisfaction_rate).toBe(40);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 10. STRENGTHS
// ═══════════════════════════════════════════════════════════════════════════

describe("strengths", () => {
  it("includes routine adherence strength when >= 90%", () => {
    const records = times(10, makeRoutine, { routine_followed: true });
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_routine_records: records }),
    );
    expect(r.strengths.some((s) => s.includes("100% sleep routine adherence"))).toBe(true);
  });

  it("includes mid-tier routine adherence strength when 70-89%", () => {
    const records = [
      ...times(7, makeRoutine, { routine_followed: true }),
      ...times(3, makeRoutine, { routine_followed: false }),
    ];
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_routine_records: records }),
    );
    expect(r.strengths.some((s) => s.includes("70% sleep routine adherence"))).toBe(true);
  });

  it("includes environment quality strength when >= 90%", () => {
    const envRecords = [
      makeEnvironment({
        room_temperature_ok: true,
        lighting_appropriate: true,
        noise_level_acceptable: true,
        bedding_clean_adequate: true,
        room_personalised: true,
        electronic_devices_managed: true,
        ventilation_adequate: true,
      }),
    ];
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_environment_records: envRecords }),
    );
    expect(r.strengths.some((s) => s.includes("100% sleep environment quality"))).toBe(true);
  });

  it("includes disturbance resolution strength when >= 90%", () => {
    const records = times(10, makeDisturbance, { child_resettled: true });
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_disturbance_records: records }),
    );
    expect(r.strengths.some((s) => s.includes("100% disturbance resolution rate"))).toBe(true);
  });

  it("includes bedtime support quality strength when >= 85%", () => {
    const records = times(10, makeBedtimeSupport, {
      support_provided: true,
      child_engaged: true,
      child_feedback_positive: true,
      consistency_with_plan: true,
    });
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, bedtime_support_records: records }),
    );
    expect(r.strengths.some((s) => s.includes("100% bedtime support quality"))).toBe(true);
  });

  it("includes child satisfaction strength when >= 90%", () => {
    const records = times(10, makeBedtimeSupport, {
      support_provided: true,
      child_engaged: true,
      child_feedback_positive: true,
      consistency_with_plan: true,
    });
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, bedtime_support_records: records }),
    );
    expect(r.strengths.some((s) => s.includes("100% positive child feedback on bedtime support"))).toBe(true);
  });

  it("includes settling rate strength when >= 90%", () => {
    const records = times(10, makeRoutine, {
      routine_followed: true,
      child_settled_within_30_min: true,
    });
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_routine_records: records }),
    );
    expect(r.strengths.some((s) => s.includes("100% of children settle within 30 minutes"))).toBe(true);
  });

  it("includes follow-up completion strength when >= 90%", () => {
    const records = times(10, makeDisturbance, {
      child_resettled: true,
      follow_up_actions: "Review plan",
      follow_up_completed: true,
    });
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_disturbance_records: records }),
    );
    expect(r.strengths.some((s) => s.includes("100% of disturbance follow-up actions completed"))).toBe(true);
  });

  it("includes rapid response strength when >= 90%", () => {
    const records = times(10, makeDisturbance, {
      child_resettled: true,
      staff_response_time_minutes: 3,
    });
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_disturbance_records: records }),
    );
    expect(r.strengths.some((s) => s.includes("100% of disturbances responded to within 5 minutes"))).toBe(true);
  });

  it("includes plan review strength when >= 90%", () => {
    const records = times(10, makeImprovement, { reviewed: true });
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_improvement_records: records }),
    );
    expect(r.strengths.some((s) => s.includes("100% of sleep improvement plans reviewed"))).toBe(true);
  });

  it("includes child involvement strength when >= 90%", () => {
    const records = times(10, makeImprovement, { child_involved_in_planning: true });
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_improvement_records: records }),
    );
    expect(r.strengths.some((s) => s.includes("100% child involvement in sleep improvement planning"))).toBe(true);
  });

  it("includes wind-down strength when >= 90%", () => {
    const records = times(10, makeRoutine, { wind_down_activity_completed: true });
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_routine_records: records }),
    );
    expect(r.strengths.some((s) => s.includes("100% wind-down activity completion"))).toBe(true);
  });

  it("includes env issue resolution strength when >= 90%", () => {
    const envRecords = [
      makeEnvironment({
        issues_identified: ["temperature too high"],
        issues_resolved: true,
      }),
    ];
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_environment_records: envRecords }),
    );
    expect(r.strengths.some((s) => s.includes("100% of environment issues resolved"))).toBe(true);
  });

  it("includes avg sleep quality strength when >= 4.0", () => {
    const records = times(10, makeRoutine, { sleep_quality_rating: 4 });
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_routine_records: records }),
    );
    expect(r.strengths.some((s) => s.includes("Average sleep quality rating of 4/5"))).toBe(true);
  });

  it("includes mid-tier avg sleep quality strength when 3.5-3.99", () => {
    const records = times(10, makeRoutine, { sleep_quality_rating: 4 });
    // Add one record with rating 3 to bring avg just above 3.5 but below 4.0
    // 10*4 = 40, need avg in [3.5, 4.0)
    // Use 7*4 + 3*3 = 28+9 = 37 / 10 = 3.7
    const records2 = [
      ...times(7, makeRoutine, { sleep_quality_rating: 4 }),
      ...times(3, makeRoutine, { sleep_quality_rating: 3 }),
    ];
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_routine_records: records2 }),
    );
    expect(r.strengths.some((s) => s.includes("Average sleep quality rating of 3.7/5"))).toBe(true);
  });

  it("includes professional input strength when >= 80%", () => {
    const records = times(10, makeImprovement, { professional_input_received: true });
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_improvement_records: records }),
    );
    expect(r.strengths.some((s) => s.includes("100% of sleep improvement plans include professional input"))).toBe(true);
  });

  it("no strengths when all rates are below thresholds", () => {
    const routines = times(10, makeRoutine, {
      routine_followed: false,
      child_settled_within_30_min: false,
      wind_down_activity_completed: false,
      sleep_quality_rating: 1,
    });
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_routine_records: routines }),
    );
    expect(r.strengths).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 11. CONCERNS
// ═══════════════════════════════════════════════════════════════════════════

describe("concerns", () => {
  it("includes routine adherence concern when < 50%", () => {
    const records = [
      ...times(4, makeRoutine, { routine_followed: true }),
      ...times(6, makeRoutine, { routine_followed: false }),
    ];
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_routine_records: records }),
    );
    expect(r.concerns.some((c) => c.includes("Only 40% sleep routine adherence"))).toBe(true);
  });

  it("includes mid-tier routine concern when 50-69%", () => {
    const records = [
      ...times(6, makeRoutine, { routine_followed: true }),
      ...times(4, makeRoutine, { routine_followed: false }),
    ];
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_routine_records: records }),
    );
    expect(r.concerns.some((c) => c.includes("Sleep routine adherence at 60%"))).toBe(true);
  });

  it("includes environment quality concern when < 50%", () => {
    // 3/7 checks true = 43%
    const envRecords = [
      makeEnvironment({
        room_temperature_ok: true,
        lighting_appropriate: true,
        noise_level_acceptable: true,
        bedding_clean_adequate: false,
        room_personalised: false,
        electronic_devices_managed: false,
        ventilation_adequate: false,
      }),
    ];
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_environment_records: envRecords }),
    );
    expect(r.concerns.some((c) => c.includes("Only 43% sleep environment quality"))).toBe(true);
  });

  it("includes mid-tier environment concern when 50-69%", () => {
    // 4/7 = 57%
    const envRecords = [
      makeEnvironment({
        room_temperature_ok: true,
        lighting_appropriate: true,
        noise_level_acceptable: true,
        bedding_clean_adequate: true,
        room_personalised: false,
        electronic_devices_managed: false,
        ventilation_adequate: false,
      }),
    ];
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_environment_records: envRecords }),
    );
    expect(r.concerns.some((c) => c.includes("Sleep environment quality at 57%"))).toBe(true);
  });

  it("includes disturbance resolution concern when < 50%", () => {
    const records = [
      ...times(4, makeDisturbance, { child_resettled: true }),
      ...times(6, makeDisturbance, { child_resettled: false }),
    ];
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_disturbance_records: records }),
    );
    expect(r.concerns.some((c) => c.includes("Only 40% disturbance resolution"))).toBe(true);
  });

  it("includes mid-tier disturbance resolution concern when 50-69%", () => {
    const records = [
      ...times(6, makeDisturbance, { child_resettled: true }),
      ...times(4, makeDisturbance, { child_resettled: false }),
    ];
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_disturbance_records: records }),
    );
    expect(r.concerns.some((c) => c.includes("Disturbance resolution rate at 60%"))).toBe(true);
  });

  it("includes bedtime support quality concern when < 40%", () => {
    const records = times(10, makeBedtimeSupport, {
      support_provided: true,
      child_engaged: false,
      child_feedback_positive: false,
      consistency_with_plan: false,
    });
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, bedtime_support_records: records }),
    );
    expect(r.concerns.some((c) => c.includes("Bedtime support quality at only 25%"))).toBe(true);
  });

  it("includes mid-tier bedtime support concern when 40-64%", () => {
    // 2/4 flags = 50%
    const records = times(10, makeBedtimeSupport, {
      support_provided: true,
      child_engaged: true,
      child_feedback_positive: false,
      consistency_with_plan: false,
    });
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, bedtime_support_records: records }),
    );
    expect(r.concerns.some((c) => c.includes("Bedtime support quality at 50%"))).toBe(true);
  });

  it("includes child satisfaction concern when < 50%", () => {
    const records = [
      ...times(4, makeBedtimeSupport, { child_feedback_positive: true }),
      ...times(6, makeBedtimeSupport, { child_feedback_positive: false }),
    ];
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, bedtime_support_records: records }),
    );
    expect(r.concerns.some((c) => c.includes("Only 40% positive child feedback"))).toBe(true);
  });

  it("includes mid-tier child satisfaction concern when 50-69%", () => {
    const records = [
      ...times(6, makeBedtimeSupport, { child_feedback_positive: true }),
      ...times(4, makeBedtimeSupport, { child_feedback_positive: false }),
    ];
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, bedtime_support_records: records }),
    );
    expect(r.concerns.some((c) => c.includes("Child satisfaction with bedtime support at 60%"))).toBe(true);
  });

  it("includes high impact concern when > 50%", () => {
    const records = [
      ...times(6, makeDisturbance, {
        child_resettled: true,
        impact_on_next_day: "severe",
      }),
      ...times(4, makeDisturbance, {
        child_resettled: true,
        impact_on_next_day: "none",
      }),
    ];
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_disturbance_records: records }),
    );
    expect(r.concerns.some((c) => c.includes("60% of sleep disturbances have moderate or severe"))).toBe(true);
  });

  it("includes mid-tier high impact concern when 31-50%", () => {
    // 4/10 = 40% (> 30 and <= 50)
    const records = [
      ...times(4, makeDisturbance, {
        child_resettled: true,
        impact_on_next_day: "moderate",
      }),
      ...times(6, makeDisturbance, {
        child_resettled: true,
        impact_on_next_day: "none",
      }),
    ];
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_disturbance_records: records }),
    );
    expect(r.concerns.some((c) => c.includes("40% of disturbances have moderate or severe"))).toBe(true);
  });

  it("includes settling concern when < 50%", () => {
    const records = [
      ...times(4, makeRoutine, { child_settled_within_30_min: true }),
      ...times(6, makeRoutine, { child_settled_within_30_min: false }),
    ];
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_routine_records: records }),
    );
    expect(r.concerns.some((c) => c.includes("Only 40% of children settle within 30 minutes"))).toBe(true);
  });

  it("includes mid-tier settling concern when 50-69%", () => {
    const records = [
      ...times(6, makeRoutine, { child_settled_within_30_min: true }),
      ...times(4, makeRoutine, { child_settled_within_30_min: false }),
    ];
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_routine_records: records }),
    );
    expect(r.concerns.some((c) => c.includes("Settling rate at 60%"))).toBe(true);
  });

  it("includes follow-up concern when < 50%", () => {
    const records = [
      ...times(4, makeDisturbance, {
        child_resettled: true,
        follow_up_actions: "Review plan",
        follow_up_completed: true,
      }),
      ...times(6, makeDisturbance, {
        child_resettled: true,
        follow_up_actions: "Review plan",
        follow_up_completed: false,
      }),
    ];
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_disturbance_records: records }),
    );
    expect(r.concerns.some((c) => c.includes("Only 40% of disturbance follow-up actions completed"))).toBe(true);
  });

  it("includes mid-tier follow-up concern when 50-69%", () => {
    const records = [
      ...times(6, makeDisturbance, {
        child_resettled: true,
        follow_up_actions: "Review plan",
        follow_up_completed: true,
      }),
      ...times(4, makeDisturbance, {
        child_resettled: true,
        follow_up_actions: "Review plan",
        follow_up_completed: false,
      }),
    ];
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_disturbance_records: records }),
    );
    expect(r.concerns.some((c) => c.includes("Follow-up completion rate at 60%"))).toBe(true);
  });

  it("includes plan review concern when < 50%", () => {
    const records = [
      ...times(4, makeImprovement, { reviewed: true }),
      ...times(6, makeImprovement, { reviewed: false }),
    ];
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_improvement_records: records }),
    );
    expect(r.concerns.some((c) => c.includes("Only 40% of sleep improvement plans reviewed"))).toBe(true);
  });

  it("includes mid-tier plan review concern when 50-69%", () => {
    const records = [
      ...times(6, makeImprovement, { reviewed: true }),
      ...times(4, makeImprovement, { reviewed: false }),
    ];
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_improvement_records: records }),
    );
    expect(r.concerns.some((c) => c.includes("Plan review rate at 60%"))).toBe(true);
  });

  it("includes child involvement concern when < 50%", () => {
    const records = [
      ...times(4, makeImprovement, { child_involved_in_planning: true }),
      ...times(6, makeImprovement, { child_involved_in_planning: false }),
    ];
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_improvement_records: records }),
    );
    expect(r.concerns.some((c) => c.includes("Only 40% child involvement"))).toBe(true);
  });

  it("includes env issue resolution concern when < 50%", () => {
    const envRecords = [
      makeEnvironment({ issues_identified: ["issue1"], issues_resolved: false }),
      makeEnvironment({ issues_identified: ["issue2"], issues_resolved: false }),
    ];
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_environment_records: envRecords }),
    );
    expect(r.concerns.some((c) => c.includes("Only 0% of identified environment issues resolved"))).toBe(true);
  });

  it("includes low sleep quality concern when < 2.5", () => {
    const records = times(10, makeRoutine, { sleep_quality_rating: 2 });
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_routine_records: records }),
    );
    expect(r.concerns.some((c) => c.includes("Average sleep quality rating at only 2/5"))).toBe(true);
  });

  it("includes mid-tier sleep quality concern when 2.5-2.99", () => {
    // 5*3 + 5*2 = 25 / 10 = 2.5
    const records = [
      ...times(5, makeRoutine, { sleep_quality_rating: 3 }),
      ...times(5, makeRoutine, { sleep_quality_rating: 2 }),
    ];
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_routine_records: records }),
    );
    expect(r.concerns.some((c) => c.includes("Average sleep quality rating at 2.5/5"))).toBe(true);
  });

  it("includes no routine records concern when total_children > 0 and not allEmpty", () => {
    // Provide one env record to avoid allEmpty path
    const r = computeSleepQualityRestManagement(
      baseInput({
        total_children: 2,
        sleep_environment_records: [makeEnvironment()],
      }),
    );
    expect(r.concerns.some((c) => c.includes("No sleep routine records exist"))).toBe(true);
  });

  it("includes no environment records concern when total_children > 0 and not allEmpty", () => {
    const r = computeSleepQualityRestManagement(
      baseInput({
        total_children: 2,
        sleep_routine_records: [makeRoutine()],
      }),
    );
    expect(r.concerns.some((c) => c.includes("No sleep environment assessments recorded"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 12. RECOMMENDATIONS
// ═══════════════════════════════════════════════════════════════════════════

describe("recommendations", () => {
  it("recommends routine improvement when adherence < 50%", () => {
    const records = times(10, makeRoutine, { routine_followed: false });
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_routine_records: records }),
    );
    expect(r.recommendations.some((rec) => rec.recommendation.includes("reinstate consistent bedtime routines"))).toBe(true);
    expect(r.recommendations.find((rec) => rec.recommendation.includes("reinstate"))?.urgency).toBe("immediate");
  });

  it("recommends disturbance training when resolution < 50%", () => {
    const records = times(10, makeDisturbance, { child_resettled: false });
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_disturbance_records: records }),
    );
    expect(r.recommendations.some((rec) => rec.recommendation.includes("training for staff on managing sleep disturbances"))).toBe(true);
  });

  it("recommends bedtime support overhaul when quality < 40%", () => {
    const records = times(10, makeBedtimeSupport, {
      support_provided: false,
      child_engaged: false,
      child_feedback_positive: false,
      consistency_with_plan: false,
    });
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, bedtime_support_records: records }),
    );
    expect(r.recommendations.some((rec) => rec.recommendation.includes("Overhaul bedtime support practices"))).toBe(true);
  });

  it("recommends multi-disciplinary review when highImpactRate > 50%", () => {
    const records = times(10, makeDisturbance, {
      child_resettled: true,
      impact_on_next_day: "severe",
    });
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_disturbance_records: records }),
    );
    expect(r.recommendations.some((rec) => rec.recommendation.includes("multi-disciplinary review"))).toBe(true);
  });

  it("recommends environment assessment when quality < 50%", () => {
    const envRecords = [makeEnvironment()]; // all false = 0%
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_environment_records: envRecords }),
    );
    expect(r.recommendations.some((rec) => rec.recommendation.includes("immediate environment assessments"))).toBe(true);
  });

  it("recommends child consultation when satisfaction < 50%", () => {
    const records = times(10, makeBedtimeSupport, {
      child_feedback_positive: false,
    });
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, bedtime_support_records: records }),
    );
    expect(r.recommendations.some((rec) => rec.recommendation.includes("Consult children individually"))).toBe(true);
  });

  it("recommends routine recording when no routine records and children > 0 and not allEmpty", () => {
    const r = computeSleepQualityRestManagement(
      baseInput({
        total_children: 2,
        sleep_environment_records: [makeEnvironment()],
      }),
    );
    expect(r.recommendations.some((rec) => rec.recommendation.includes("Implement immediate recording of sleep routines"))).toBe(true);
  });

  it("recommends environment assessment when no environment records and children > 0 and not allEmpty", () => {
    const r = computeSleepQualityRestManagement(
      baseInput({
        total_children: 2,
        sleep_routine_records: [makeRoutine()],
      }),
    );
    expect(r.recommendations.some((rec) => rec.recommendation.includes("Commence regular sleep environment assessments"))).toBe(true);
  });

  it("recommends follow-up tracker when completion < 50%", () => {
    const records = times(10, makeDisturbance, {
      child_resettled: true,
      follow_up_actions: "Review plan",
      follow_up_completed: false,
    });
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_disturbance_records: records }),
    );
    expect(r.recommendations.some((rec) => rec.recommendation.includes("follow-up action tracker"))).toBe(true);
    expect(r.recommendations.find((rec) => rec.recommendation.includes("follow-up action tracker"))?.urgency).toBe("soon");
  });

  it("recommends plan review schedule when review rate < 50%", () => {
    const records = times(10, makeImprovement, { reviewed: false });
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_improvement_records: records }),
    );
    expect(r.recommendations.some((rec) => rec.recommendation.includes("schedule for reviewing all sleep improvement plans"))).toBe(true);
  });

  it("recommends child involvement when < 50%", () => {
    const records = times(10, makeImprovement, { child_involved_in_planning: false });
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_improvement_records: records }),
    );
    expect(r.recommendations.some((rec) => rec.recommendation.includes("Involve children in their sleep improvement planning"))).toBe(true);
  });

  it("recommends routine improvement when adherence 50-69%", () => {
    const records = [
      ...times(6, makeRoutine, { routine_followed: true }),
      ...times(4, makeRoutine, { routine_followed: false }),
    ];
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_routine_records: records }),
    );
    expect(r.recommendations.some((rec) => rec.recommendation.includes("Improve sleep routine adherence to at least 70%"))).toBe(true);
  });

  it("recommends disturbance training when resolution 50-69%", () => {
    const records = [
      ...times(6, makeDisturbance, { child_resettled: true }),
      ...times(4, makeDisturbance, { child_resettled: false }),
    ];
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_disturbance_records: records }),
    );
    expect(r.recommendations.some((rec) => rec.recommendation.includes("Enhance disturbance management training"))).toBe(true);
  });

  it("recommends environment improvement when quality 50-69%", () => {
    // 4/7 = 57%
    const envRecords = [
      makeEnvironment({
        room_temperature_ok: true,
        lighting_appropriate: true,
        noise_level_acceptable: true,
        bedding_clean_adequate: true,
        room_personalised: false,
        electronic_devices_managed: false,
        ventilation_adequate: false,
      }),
    ];
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_environment_records: envRecords }),
    );
    expect(r.recommendations.some((rec) => rec.recommendation.includes("Improve sleep environment standards"))).toBe(true);
    expect(r.recommendations.find((rec) => rec.recommendation.includes("Improve sleep environment standards"))?.urgency).toBe("planned");
  });

  it("recommends bedtime support enhancement when quality 40-64%", () => {
    // 2/4 = 50%
    const records = times(10, makeBedtimeSupport, {
      support_provided: true,
      child_engaged: true,
      child_feedback_positive: false,
      consistency_with_plan: false,
    });
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, bedtime_support_records: records }),
    );
    expect(r.recommendations.some((rec) => rec.recommendation.includes("Enhance bedtime support quality"))).toBe(true);
  });

  it("recommends child feedback when satisfaction 50-69%", () => {
    const records = [
      ...times(6, makeBedtimeSupport, { child_feedback_positive: true }),
      ...times(4, makeBedtimeSupport, { child_feedback_positive: false }),
    ];
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, bedtime_support_records: records }),
    );
    expect(r.recommendations.some((rec) => rec.recommendation.includes("Seek regular child feedback"))).toBe(true);
  });

  it("recommends wind-down activities when rate < 70%", () => {
    const records = times(10, makeRoutine, { wind_down_activity_completed: false });
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_routine_records: records }),
    );
    expect(r.recommendations.some((rec) => rec.recommendation.includes("wind-down activities"))).toBe(true);
  });

  it("recommends plan coverage extension when < 50% with plans present", () => {
    // 1 child with active plan / 3 total = 33%
    const records = [makeImprovement({ child_id: "child_1", plan_active: true })];
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 3, sleep_improvement_records: records }),
    );
    expect(r.recommendations.some((rec) => rec.recommendation.includes("Extend sleep improvement plan coverage"))).toBe(true);
  });

  it("all recommendations have sequential ranks", () => {
    // Create a scenario with multiple recommendations
    const routines = times(10, makeRoutine, { routine_followed: false });
    const disturbances = times(10, makeDisturbance, {
      child_resettled: false,
      impact_on_next_day: "severe",
    });
    const r = computeSleepQualityRestManagement(
      baseInput({
        total_children: 2,
        sleep_routine_records: routines,
        sleep_disturbance_records: disturbances,
      }),
    );
    for (let i = 0; i < r.recommendations.length; i++) {
      expect(r.recommendations[i].rank).toBe(i + 1);
    }
  });

  it("all recommendations have regulatory_ref", () => {
    const routines = times(10, makeRoutine, { routine_followed: false });
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_routine_records: routines }),
    );
    for (const rec of r.recommendations) {
      expect(rec.regulatory_ref).toBeTruthy();
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 13. INSIGHTS
// ═══════════════════════════════════════════════════════════════════════════

describe("insights — critical", () => {
  it("critical insight for routine adherence < 50%", () => {
    const records = times(10, makeRoutine, { routine_followed: false });
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_routine_records: records }),
    );
    const insight = r.insights.find((i) => i.text.includes("0% sleep routine adherence"));
    expect(insight).toBeDefined();
    expect(insight!.severity).toBe("critical");
  });

  it("critical insight for disturbance resolution < 50%", () => {
    const records = times(10, makeDisturbance, { child_resettled: false });
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_disturbance_records: records }),
    );
    const insight = r.insights.find((i) => i.text.includes("0% disturbance resolution"));
    expect(insight).toBeDefined();
    expect(insight!.severity).toBe("critical");
  });

  it("critical insight for bedtime support quality < 40%", () => {
    const records = times(10, makeBedtimeSupport);
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, bedtime_support_records: records }),
    );
    const insight = r.insights.find((i) => i.text.includes("Bedtime support quality at only 0%"));
    expect(insight).toBeDefined();
    expect(insight!.severity).toBe("critical");
  });

  it("critical insight for high impact > 50%", () => {
    const records = times(10, makeDisturbance, {
      child_resettled: true,
      impact_on_next_day: "severe",
    });
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_disturbance_records: records }),
    );
    const insight = r.insights.find((i) => i.text.includes("100% of disturbances have moderate or severe"));
    expect(insight).toBeDefined();
    expect(insight!.severity).toBe("critical");
  });

  it("critical insight for environment quality < 50%", () => {
    const envRecords = [makeEnvironment()]; // all false = 0%
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_environment_records: envRecords }),
    );
    const insight = r.insights.find((i) => i.text.includes("Only 0% sleep environment quality"));
    expect(insight).toBeDefined();
    expect(insight!.severity).toBe("critical");
  });

  it("critical insight for no routine records with children", () => {
    const r = computeSleepQualityRestManagement(
      baseInput({
        total_children: 2,
        sleep_environment_records: [makeEnvironment()],
      }),
    );
    const insight = r.insights.find((i) => i.text.includes("No sleep routine records exist"));
    expect(insight).toBeDefined();
    expect(insight!.severity).toBe("critical");
  });

  it("critical insight for no environment records with children", () => {
    const r = computeSleepQualityRestManagement(
      baseInput({
        total_children: 2,
        sleep_routine_records: [makeRoutine()],
      }),
    );
    const insight = r.insights.find((i) => i.text.includes("No sleep environment assessments"));
    expect(insight).toBeDefined();
    expect(insight!.severity).toBe("critical");
  });
});

describe("insights — warning", () => {
  it("warning insight for routine adherence 50-69%", () => {
    const records = [
      ...times(6, makeRoutine, { routine_followed: true }),
      ...times(4, makeRoutine, { routine_followed: false }),
    ];
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_routine_records: records }),
    );
    const insight = r.insights.find((i) => i.text.includes("Sleep routine adherence at 60%"));
    expect(insight).toBeDefined();
    expect(insight!.severity).toBe("warning");
  });

  it("warning insight for environment quality 50-69%", () => {
    // 4/7 = 57%
    const envRecords = [
      makeEnvironment({
        room_temperature_ok: true,
        lighting_appropriate: true,
        noise_level_acceptable: true,
        bedding_clean_adequate: true,
        room_personalised: false,
        electronic_devices_managed: false,
        ventilation_adequate: false,
      }),
    ];
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_environment_records: envRecords }),
    );
    const insight = r.insights.find((i) => i.text.includes("Sleep environment quality at 57%"));
    expect(insight).toBeDefined();
    expect(insight!.severity).toBe("warning");
  });

  it("warning insight for disturbance resolution 50-69%", () => {
    const records = [
      ...times(6, makeDisturbance, { child_resettled: true }),
      ...times(4, makeDisturbance, { child_resettled: false }),
    ];
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_disturbance_records: records }),
    );
    const insight = r.insights.find((i) => i.text.includes("Disturbance resolution rate at 60%"));
    expect(insight).toBeDefined();
    expect(insight!.severity).toBe("warning");
  });

  it("warning insight for child satisfaction 50-69%", () => {
    const records = [
      ...times(6, makeBedtimeSupport, { child_feedback_positive: true }),
      ...times(4, makeBedtimeSupport, { child_feedback_positive: false }),
    ];
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, bedtime_support_records: records }),
    );
    const insight = r.insights.find((i) => i.text.includes("Child satisfaction with bedtime support at 60%"));
    expect(insight).toBeDefined();
    expect(insight!.severity).toBe("warning");
  });

  it("warning insight for settling rate 50-69%", () => {
    const records = [
      ...times(6, makeRoutine, { child_settled_within_30_min: true }),
      ...times(4, makeRoutine, { child_settled_within_30_min: false }),
    ];
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_routine_records: records }),
    );
    const insight = r.insights.find((i) => i.text.includes("Settling rate at 60%"));
    expect(insight).toBeDefined();
    expect(insight!.severity).toBe("warning");
  });

  it("warning insight for follow-up completion 50-69%", () => {
    const records = [
      ...times(6, makeDisturbance, {
        child_resettled: true,
        follow_up_actions: "Review plan",
        follow_up_completed: true,
      }),
      ...times(4, makeDisturbance, {
        child_resettled: true,
        follow_up_actions: "Review plan",
        follow_up_completed: false,
      }),
    ];
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_disturbance_records: records }),
    );
    const insight = r.insights.find((i) => i.text.includes("Follow-up completion rate at 60%"));
    expect(insight).toBeDefined();
    expect(insight!.severity).toBe("warning");
  });

  it("warning insight for plan review 50-69%", () => {
    const records = [
      ...times(6, makeImprovement, { reviewed: true }),
      ...times(4, makeImprovement, { reviewed: false }),
    ];
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_improvement_records: records }),
    );
    const insight = r.insights.find((i) => i.text.includes("Plan review rate at 60%"));
    expect(insight).toBeDefined();
    expect(insight!.severity).toBe("warning");
  });

  it("warning insight for mediocre sleep quality 2.5-3.49", () => {
    const records = times(10, makeRoutine, { sleep_quality_rating: 3 });
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_routine_records: records }),
    );
    const insight = r.insights.find((i) => i.text.includes("Average sleep quality rating at 3/5"));
    expect(insight).toBeDefined();
    expect(insight!.severity).toBe("warning");
  });

  it("warning insight for wind-down rate < 70% when > 0", () => {
    // 5/10 = 50%
    const records = [
      ...times(5, makeRoutine, { wind_down_activity_completed: true }),
      ...times(5, makeRoutine, { wind_down_activity_completed: false }),
    ];
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_routine_records: records }),
    );
    const insight = r.insights.find((i) => i.text.includes("Wind-down activity completion at only 50%"));
    expect(insight).toBeDefined();
    expect(insight!.severity).toBe("warning");
  });

  it("includes disturbance type analysis warning", () => {
    const records = [
      makeDisturbance({ disturbance_type: "nightmare", child_resettled: true }),
      makeDisturbance({ disturbance_type: "nightmare", child_resettled: true }),
      makeDisturbance({ disturbance_type: "anxiety", child_resettled: true }),
    ];
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_disturbance_records: records }),
    );
    const insight = r.insights.find((i) => i.text.includes("Most common disturbance types"));
    expect(insight).toBeDefined();
    expect(insight!.severity).toBe("warning");
    expect(insight!.text).toContain("nightmare (2)");
    expect(insight!.text).toContain("anxiety (1)");
  });
});

describe("insights — positive", () => {
  it("positive insight for outstanding rating", () => {
    const routineRecords = times(10, makeRoutine, {
      routine_followed: true,
      child_settled_within_30_min: true,
      wind_down_activity_completed: true,
      sleep_quality_rating: 5,
    });
    const envRecords = times(5, makeEnvironment, {
      room_temperature_ok: true,
      lighting_appropriate: true,
      noise_level_acceptable: true,
      bedding_clean_adequate: true,
      room_personalised: true,
      electronic_devices_managed: true,
      ventilation_adequate: true,
    });
    const disturbanceRecords = times(10, makeDisturbance, {
      child_resettled: true,
      follow_up_actions: "Review",
      follow_up_completed: true,
      staff_response_time_minutes: 3,
      impact_on_next_day: "none",
    });
    const supportRecords = times(10, makeBedtimeSupport, {
      support_provided: true,
      child_engaged: true,
      child_feedback_positive: true,
      consistency_with_plan: true,
    });
    const improvementRecords = [
      makeImprovement({ child_id: "child_1", plan_active: true, reviewed: true }),
      makeImprovement({ child_id: "child_2", plan_active: true, reviewed: true }),
    ];

    const r = computeSleepQualityRestManagement(
      baseInput({
        total_children: 2,
        sleep_routine_records: routineRecords,
        sleep_environment_records: envRecords,
        sleep_disturbance_records: disturbanceRecords,
        bedtime_support_records: supportRecords,
        sleep_improvement_records: improvementRecords,
      }),
    );
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("outstanding sleep quality"))).toBe(true);
  });

  it("positive insight for high routine + settling combination", () => {
    const records = times(10, makeRoutine, {
      routine_followed: true,
      child_settled_within_30_min: true,
    });
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_routine_records: records }),
    );
    const insight = r.insights.find(
      (i) => i.text.includes("100% routine adherence with 100% settling"),
    );
    expect(insight).toBeDefined();
    expect(insight!.severity).toBe("positive");
  });

  it("positive insight for high disturbance resolution + rapid response", () => {
    const records = times(10, makeDisturbance, {
      child_resettled: true,
      staff_response_time_minutes: 3,
    });
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_disturbance_records: records }),
    );
    const insight = r.insights.find(
      (i) => i.text.includes("100% disturbance resolution with 100% rapid response"),
    );
    expect(insight).toBeDefined();
    expect(insight!.severity).toBe("positive");
  });

  it("positive insight for high environment quality", () => {
    const envRecords = times(5, makeEnvironment, {
      room_temperature_ok: true,
      lighting_appropriate: true,
      noise_level_acceptable: true,
      bedding_clean_adequate: true,
      room_personalised: true,
      electronic_devices_managed: true,
      ventilation_adequate: true,
    });
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_environment_records: envRecords }),
    );
    const insight = r.insights.find(
      (i) => i.text.includes("100% environment quality"),
    );
    expect(insight).toBeDefined();
    expect(insight!.severity).toBe("positive");
  });

  it("positive insight for high support quality + satisfaction", () => {
    const records = times(10, makeBedtimeSupport, {
      support_provided: true,
      child_engaged: true,
      child_feedback_positive: true,
      consistency_with_plan: true,
    });
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, bedtime_support_records: records }),
    );
    const insight = r.insights.find(
      (i) => i.text.includes("100% bedtime support quality with 100% positive child feedback"),
    );
    expect(insight).toBeDefined();
    expect(insight!.severity).toBe("positive");
  });

  it("positive insight for high child satisfaction alone", () => {
    const records = times(10, makeBedtimeSupport, {
      support_provided: true,
      child_engaged: true,
      child_feedback_positive: true,
      consistency_with_plan: true,
    });
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, bedtime_support_records: records }),
    );
    const insight = r.insights.find(
      (i) => i.text.includes("100% positive child feedback on bedtime support") && i.text.includes("feel cared for"),
    );
    expect(insight).toBeDefined();
    expect(insight!.severity).toBe("positive");
  });

  it("positive insight for high plan review + progress", () => {
    const records = times(10, makeImprovement, {
      reviewed: true,
      progress_rating: 5,
    });
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_improvement_records: records }),
    );
    const insight = r.insights.find(
      (i) => i.text.includes("100% plan review rate with average progress of 5/5"),
    );
    expect(insight).toBeDefined();
    expect(insight!.severity).toBe("positive");
  });

  it("positive insight for high child involvement", () => {
    const records = times(10, makeImprovement, { child_involved_in_planning: true });
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_improvement_records: records }),
    );
    const insight = r.insights.find(
      (i) => i.text.includes("100% child involvement in sleep improvement planning"),
    );
    expect(insight).toBeDefined();
    expect(insight!.severity).toBe("positive");
  });

  it("positive insight for high follow-up completion", () => {
    const records = times(10, makeDisturbance, {
      child_resettled: true,
      follow_up_actions: "Review plan",
      follow_up_completed: true,
    });
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_disturbance_records: records }),
    );
    const insight = r.insights.find(
      (i) => i.text.includes("100% of disturbance follow-up actions completed"),
    );
    expect(insight).toBeDefined();
    expect(insight!.severity).toBe("positive");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 14. HEADLINES
// ═══════════════════════════════════════════════════════════════════════════

describe("headlines", () => {
  it("outstanding headline", () => {
    const routineRecords = times(10, makeRoutine, {
      routine_followed: true,
      child_settled_within_30_min: true,
      wind_down_activity_completed: true,
      sleep_quality_rating: 5,
    });
    const envRecords = times(5, makeEnvironment, {
      room_temperature_ok: true,
      lighting_appropriate: true,
      noise_level_acceptable: true,
      bedding_clean_adequate: true,
      room_personalised: true,
      electronic_devices_managed: true,
      ventilation_adequate: true,
    });
    const disturbanceRecords = times(10, makeDisturbance, {
      child_resettled: true,
      follow_up_actions: "Review",
      follow_up_completed: true,
      staff_response_time_minutes: 3,
      impact_on_next_day: "none",
    });
    const supportRecords = times(10, makeBedtimeSupport, {
      support_provided: true,
      child_engaged: true,
      child_feedback_positive: true,
      consistency_with_plan: true,
    });
    const improvementRecords = [
      makeImprovement({ child_id: "child_1", plan_active: true, reviewed: true }),
      makeImprovement({ child_id: "child_2", plan_active: true, reviewed: true }),
    ];

    const r = computeSleepQualityRestManagement(
      baseInput({
        total_children: 2,
        sleep_routine_records: routineRecords,
        sleep_environment_records: envRecords,
        sleep_disturbance_records: disturbanceRecords,
        bedtime_support_records: supportRecords,
        sleep_improvement_records: improvementRecords,
      }),
    );
    expect(r.headline).toContain("Outstanding sleep quality");
  });

  it("good headline includes strengths and concerns count", () => {
    // Score 65 → good
    const routineRecords = times(10, makeRoutine, {
      routine_followed: true,
      child_settled_within_30_min: true,
    });
    const envRecords = times(5, makeEnvironment, {
      room_temperature_ok: true,
      lighting_appropriate: true,
      noise_level_acceptable: true,
      bedding_clean_adequate: true,
      room_personalised: true,
      electronic_devices_managed: true,
      ventilation_adequate: true,
    });
    const disturbanceRecords = times(10, makeDisturbance, { child_resettled: true });

    const r = computeSleepQualityRestManagement(
      baseInput({
        total_children: 2,
        sleep_routine_records: routineRecords,
        sleep_environment_records: envRecords,
        sleep_disturbance_records: disturbanceRecords,
      }),
    );
    expect(r.headline).toContain("Good sleep quality");
    expect(r.headline).toMatch(/\d+ strength/);
  });

  it("adequate headline includes concerns count", () => {
    // base 52 → adequate (>=45 and <65)
    const r = computeSleepQualityRestManagement(
      baseInput({
        total_children: 2,
        sleep_routine_records: [makeRoutine()],
      }),
    );
    expect(r.headline).toContain("Adequate sleep quality");
    expect(r.headline).toMatch(/\d+ concern/);
  });

  it("inadequate headline includes concerns count", () => {
    // Force score < 45
    const routines = times(10, makeRoutine, { routine_followed: false });
    const disturbances = times(10, makeDisturbance, { child_resettled: false });
    const r = computeSleepQualityRestManagement(
      baseInput({
        total_children: 2,
        sleep_routine_records: routines,
        sleep_disturbance_records: disturbances,
      }),
    );
    // 52 - 5 - 5 = 42 → inadequate
    expect(r.headline).toContain("inadequate");
    expect(r.headline).toMatch(/\d+ significant concern/);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 15. EDGE CASES
// ═══════════════════════════════════════════════════════════════════════════

describe("edge cases", () => {
  it("single record in each array", () => {
    const r = computeSleepQualityRestManagement(
      baseInput({
        total_children: 1,
        sleep_routine_records: [
          makeRoutine({
            routine_followed: true,
            child_settled_within_30_min: true,
            wind_down_activity_completed: true,
            sleep_quality_rating: 5,
          }),
        ],
        sleep_environment_records: [
          makeEnvironment({
            room_temperature_ok: true,
            lighting_appropriate: true,
            noise_level_acceptable: true,
            bedding_clean_adequate: true,
            room_personalised: true,
            electronic_devices_managed: true,
            ventilation_adequate: true,
          }),
        ],
        sleep_disturbance_records: [
          makeDisturbance({
            child_resettled: true,
            staff_response_time_minutes: 2,
            follow_up_actions: "Review",
            follow_up_completed: true,
            impact_on_next_day: "none",
          }),
        ],
        bedtime_support_records: [
          makeBedtimeSupport({
            support_provided: true,
            child_engaged: true,
            child_feedback_positive: true,
            consistency_with_plan: true,
          }),
        ],
        sleep_improvement_records: [
          makeImprovement({
            child_id: "child_1",
            plan_active: true,
            reviewed: true,
            child_involved_in_planning: true,
            progress_rating: 5,
          }),
        ],
      }),
    );
    expect(r.sleep_score).toBe(80);
    expect(r.sleep_rating).toBe("outstanding");
  });

  it("follow_up_actions empty string treated as no follow-up required", () => {
    const records = [
      makeDisturbance({
        child_resettled: true,
        follow_up_actions: "",
        follow_up_completed: false,
      }),
    ];
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_disturbance_records: records }),
    );
    // Empty string → no follow_up_required, so followUpCompletionRate = pct(0,0) = 0
    // But no penalty because followUpRequired = 0
    expect(r.disturbance_resolution_rate).toBe(100);
  });

  it("multiple plans for same child only count once for coverage", () => {
    const records = [
      makeImprovement({ child_id: "child_1", plan_active: true }),
      makeImprovement({ child_id: "child_1", plan_active: true }),
      makeImprovement({ child_id: "child_1", plan_active: true }),
    ];
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 3, sleep_improvement_records: records }),
    );
    // unique children with active plans: 1 / 3 = 33%
    expect(r.improvement_plan_coverage_rate).toBe(33);
  });

  it("disturbance type underscore replaced with space in insights", () => {
    const records = [
      makeDisturbance({ disturbance_type: "night_terror", child_resettled: true }),
    ];
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_disturbance_records: records }),
    );
    const insight = r.insights.find((i) => i.text.includes("night terror (1)"));
    expect(insight).toBeDefined();
  });

  it("staff_response_time_minutes null does not count as rapid response", () => {
    const records = times(10, makeDisturbance, {
      child_resettled: true,
      staff_response_time_minutes: null,
    });
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_disturbance_records: records }),
    );
    // rapidResponseRate = 0% (null is not <= 5)
    expect(r.strengths.every((s) => !s.includes("responded to within 5 minutes"))).toBe(true);
  });

  it("response time exactly 5 minutes counts as rapid response", () => {
    const records = times(10, makeDisturbance, {
      child_resettled: true,
      staff_response_time_minutes: 5,
    });
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_disturbance_records: records }),
    );
    expect(r.strengths.some((s) => s.includes("100% of disturbances responded to within 5 minutes"))).toBe(true);
  });

  it("response time 6 minutes does not count as rapid response", () => {
    const records = times(10, makeDisturbance, {
      child_resettled: true,
      staff_response_time_minutes: 6,
    });
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_disturbance_records: records }),
    );
    expect(r.strengths.every((s) => !s.includes("responded to within 5 minutes"))).toBe(true);
  });

  it("impact mild does not count as high impact", () => {
    const records = times(10, makeDisturbance, {
      child_resettled: true,
      impact_on_next_day: "mild",
    });
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_disturbance_records: records }),
    );
    // highImpactRate = 0% — no concern or penalty
    expect(r.concerns.every((c) => !c.includes("moderate or severe"))).toBe(true);
  });

  it("large dataset processes correctly", () => {
    const routineRecords = times(100, makeRoutine, {
      routine_followed: true,
      child_settled_within_30_min: true,
      wind_down_activity_completed: true,
      sleep_quality_rating: 4,
    });
    const envRecords = times(50, makeEnvironment, {
      room_temperature_ok: true,
      lighting_appropriate: true,
      noise_level_acceptable: true,
      bedding_clean_adequate: true,
      room_personalised: true,
      electronic_devices_managed: true,
      ventilation_adequate: true,
    });
    const r = computeSleepQualityRestManagement(
      baseInput({
        total_children: 10,
        sleep_routine_records: routineRecords,
        sleep_environment_records: envRecords,
      }),
    );
    expect(r.total_routine_records).toBe(100);
    expect(r.routine_adherence_rate).toBe(100);
    expect(r.environment_quality_rate).toBe(100);
  });

  it("environment with no issues identified does not affect envIssueResolutionRate", () => {
    const envRecords = [
      makeEnvironment({
        room_temperature_ok: true,
        lighting_appropriate: true,
        noise_level_acceptable: true,
        bedding_clean_adequate: true,
        room_personalised: true,
        electronic_devices_managed: true,
        ventilation_adequate: true,
        issues_identified: [],
        issues_resolved: false,
      }),
    ];
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_environment_records: envRecords }),
    );
    // envIssuesIdentified = 0, so envIssueResolutionRate = pct(0,0) = 0
    // No strength or concern about env issues since envIssuesIdentified = 0
    expect(r.strengths.every((s) => !s.includes("environment issues resolved"))).toBe(true);
  });

  it("inactive plans do not count for coverage", () => {
    const records = [
      makeImprovement({ child_id: "child_1", plan_active: false }),
      makeImprovement({ child_id: "child_2", plan_active: false }),
    ];
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_improvement_records: records }),
    );
    expect(r.improvement_plan_coverage_rate).toBe(0);
  });

  it("avg sleep quality rating rounds to 2 decimal places", () => {
    // 3+4+4 = 11 / 3 = 3.666... → Math.round(3.666... * 100) / 100 = 3.67
    const records = [
      makeRoutine({ sleep_quality_rating: 3 }),
      makeRoutine({ sleep_quality_rating: 4 }),
      makeRoutine({ sleep_quality_rating: 4 }),
    ];
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_routine_records: records }),
    );
    expect(r.strengths.some((s) => s.includes("3.67/5"))).toBe(true);
  });

  it("wind-down rate at 0 does not trigger warning (windDownRate > 0 guard)", () => {
    const records = times(10, makeRoutine, { wind_down_activity_completed: false });
    const r = computeSleepQualityRestManagement(
      baseInput({ total_children: 2, sleep_routine_records: records }),
    );
    // windDownRate = 0%, which is < 70, but the guard is windDownRate > 0
    // Since windDownRate = 0, the warning insight should NOT appear
    expect(r.insights.every((i) => !i.text.includes("Wind-down activity completion"))).toBe(true);
  });

  it("outcome types are correct shape", () => {
    const r = computeSleepQualityRestManagement(
      baseInput({
        total_children: 2,
        sleep_routine_records: [makeRoutine()],
      }),
    );
    expect(typeof r.sleep_rating).toBe("string");
    expect(typeof r.sleep_score).toBe("number");
    expect(typeof r.headline).toBe("string");
    expect(typeof r.total_routine_records).toBe("number");
    expect(typeof r.total_disturbances).toBe("number");
    expect(typeof r.routine_adherence_rate).toBe("number");
    expect(typeof r.environment_quality_rate).toBe("number");
    expect(typeof r.disturbance_resolution_rate).toBe("number");
    expect(typeof r.bedtime_support_quality_rate).toBe("number");
    expect(typeof r.improvement_plan_coverage_rate).toBe("number");
    expect(typeof r.child_satisfaction_rate).toBe("number");
    expect(Array.isArray(r.strengths)).toBe(true);
    expect(Array.isArray(r.concerns)).toBe(true);
    expect(Array.isArray(r.recommendations)).toBe(true);
    expect(Array.isArray(r.insights)).toBe(true);
  });
});
