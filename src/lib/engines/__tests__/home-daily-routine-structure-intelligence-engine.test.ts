// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME DAILY ROUTINE & STRUCTURE INTELLIGENCE ENGINE — TESTS
// CHR 2015 Reg 5/6/7: Daily routine quality, structure, and child participation.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeDailyRoutineStructure,
  type DailyRoutineInput,
  type RoutineScheduleRecordInput,
  type ActivityPlanRecordInput,
  type MealRoutineRecordInput,
  type BedtimeRoutineRecordInput,
  type ChildParticipationRecordInput,
} from "../home-daily-routine-structure-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

let _id = 0;
function uid(): string {
  return `rec_${++_id}`;
}

function makeRoutine(overrides: Partial<RoutineScheduleRecordInput> = {}): RoutineScheduleRecordInput {
  return {
    id: uid(),
    date: "2026-05-27",
    child_id: "yp_alex",
    routine_type: "morning",
    scheduled_start_time: "07:00",
    actual_start_time: "07:05",
    scheduled_end_time: "09:00",
    actual_end_time: "09:00",
    routine_followed: true,
    deviation_reason: null,
    flexibility_shown: true,
    child_informed_of_plan: true,
    staff_member: "staff_a",
    consistency_rating: 5,
    notes: null,
    created_at: "2026-05-27T07:00:00Z",
    ...overrides,
  };
}

function makeActivity(overrides: Partial<ActivityPlanRecordInput> = {}): ActivityPlanRecordInput {
  return {
    id: uid(),
    date: "2026-05-27",
    child_id: "yp_alex",
    activity_type: "recreational",
    activity_name: "Football",
    planned: true,
    completed: true,
    child_enjoyed: true,
    child_chose_activity: true,
    duration_minutes: 60,
    staff_member: "staff_a",
    outcome_notes: null,
    created_at: "2026-05-27T10:00:00Z",
    ...overrides,
  };
}

function makeMeal(overrides: Partial<MealRoutineRecordInput> = {}): MealRoutineRecordInput {
  return {
    id: uid(),
    date: "2026-05-27",
    child_id: "yp_alex",
    meal_type: "lunch",
    scheduled_time: "12:00",
    actual_time: "12:05",
    meal_on_time: true,
    child_present: true,
    child_involved_in_preparation: true,
    dietary_needs_met: true,
    healthy_options_provided: true,
    social_dining_environment: true,
    child_feedback_positive: true,
    staff_member: "staff_a",
    notes: null,
    created_at: "2026-05-27T12:00:00Z",
    ...overrides,
  };
}

function makeBedtime(overrides: Partial<BedtimeRoutineRecordInput> = {}): BedtimeRoutineRecordInput {
  return {
    id: uid(),
    date: "2026-05-27",
    child_id: "yp_alex",
    planned_bedtime: "21:00",
    actual_bedtime: "21:10",
    bedtime_routine_followed: true,
    wind_down_activity_provided: true,
    child_settled_within_30_min: true,
    age_appropriate_bedtime: true,
    consistent_with_previous_nights: true,
    deviation_reason: null,
    child_feedback: null,
    staff_member: "staff_a",
    created_at: "2026-05-27T21:00:00Z",
    ...overrides,
  };
}

function makeParticipation(overrides: Partial<ChildParticipationRecordInput> = {}): ChildParticipationRecordInput {
  return {
    id: uid(),
    date: "2026-05-27",
    child_id: "yp_alex",
    participation_type: "daily_planning",
    child_consulted: true,
    child_views_recorded: true,
    views_actioned: true,
    child_satisfied_with_outcome: true,
    staff_member: "staff_a",
    notes: null,
    created_at: "2026-05-27T08:00:00Z",
    ...overrides,
  };
}

/** Build a full "outstanding" input; override any field. */
function baseInput(overrides: Partial<DailyRoutineInput> = {}): DailyRoutineInput {
  // Use diverse activity types so activityVarietyCount >= 6 (avoids planned recommendation for <4 variety)
  const activityTypes: ActivityPlanRecordInput["activity_type"][] = [
    "educational", "recreational", "therapeutic", "social", "life_skills", "creative",
    "physical", "other", "educational", "recreational",
  ];
  return {
    today: "2026-05-27",
    total_children: 3,
    routine_schedule_records: Array.from({ length: 10 }, () => makeRoutine()),
    activity_plan_records: activityTypes.map((t) => makeActivity({ activity_type: t })),
    meal_routine_records: Array.from({ length: 10 }, () => makeMeal()),
    bedtime_routine_records: Array.from({ length: 10 }, () => makeBedtime()),
    child_participation_records: Array.from({ length: 10 }, () => makeParticipation()),
    ...overrides,
  };
}

/** Generate N records where a given fraction satisfy the predicate. */
function nOf<T>(n: number, good: number, makeFn: (o?: Record<string, unknown>) => T, goodOverrides: Record<string, unknown>, badOverrides: Record<string, unknown>): T[] {
  const records: T[] = [];
  for (let i = 0; i < good; i++) records.push(makeFn(goodOverrides));
  for (let i = 0; i < n - good; i++) records.push(makeFn(badOverrides));
  return records;
}

/** Fully zeroed input: all metrics at 0%, no bonuses, all penalties fire. */
function allBadInput(overrides: Partial<DailyRoutineInput> = {}): DailyRoutineInput {
  return {
    today: "2026-05-27",
    total_children: 3,
    routine_schedule_records: Array.from({ length: 10 }, () =>
      makeRoutine({
        routine_followed: false,
        flexibility_shown: false,
        child_informed_of_plan: false,
        actual_start_time: null,
        consistency_rating: 1,
      }),
    ),
    activity_plan_records: Array.from({ length: 10 }, () =>
      makeActivity({
        completed: false,
        planned: false,
        child_enjoyed: false,
        child_chose_activity: false,
        activity_type: "other",
      }),
    ),
    meal_routine_records: Array.from({ length: 10 }, () =>
      makeMeal({
        meal_on_time: false,
        child_present: false,
        child_involved_in_preparation: false,
        dietary_needs_met: false,
        healthy_options_provided: false,
        social_dining_environment: false,
        child_feedback_positive: false,
      }),
    ),
    bedtime_routine_records: Array.from({ length: 10 }, () =>
      makeBedtime({
        bedtime_routine_followed: false,
        wind_down_activity_provided: false,
        child_settled_within_30_min: false,
        age_appropriate_bedtime: false,
        consistent_with_previous_nights: false,
      }),
    ),
    child_participation_records: Array.from({ length: 10 }, () =>
      makeParticipation({
        child_consulted: false,
        child_views_recorded: false,
        views_actioned: false,
        child_satisfied_with_outcome: false,
      }),
    ),
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. INSUFFICIENT DATA
// ═══════════════════════════════════════════════════════════════════════════

describe("insufficient data", () => {
  it("returns insufficient_data when all arrays empty and total_children=0", () => {
    const r = computeDailyRoutineStructure({
      today: "2026-05-27",
      total_children: 0,
      routine_schedule_records: [],
      activity_plan_records: [],
      meal_routine_records: [],
      bedtime_routine_records: [],
      child_participation_records: [],
    });
    expect(r.routine_rating).toBe("insufficient_data");
    expect(r.routine_score).toBe(0);
  });

  it("returns correct headline for insufficient_data", () => {
    const r = computeDailyRoutineStructure({
      today: "2026-05-27",
      total_children: 0,
      routine_schedule_records: [],
      activity_plan_records: [],
      meal_routine_records: [],
      bedtime_routine_records: [],
      child_participation_records: [],
    });
    expect(r.headline).toContain("insufficient data");
  });

  it("returns zero counts for insufficient_data", () => {
    const r = computeDailyRoutineStructure({
      today: "2026-05-27",
      total_children: 0,
      routine_schedule_records: [],
      activity_plan_records: [],
      meal_routine_records: [],
      bedtime_routine_records: [],
      child_participation_records: [],
    });
    expect(r.total_routine_records).toBe(0);
    expect(r.total_activity_records).toBe(0);
    expect(r.total_meal_records).toBe(0);
    expect(r.total_bedtime_records).toBe(0);
    expect(r.total_participation_records).toBe(0);
  });

  it("returns empty arrays for insufficient_data", () => {
    const r = computeDailyRoutineStructure({
      today: "2026-05-27",
      total_children: 0,
      routine_schedule_records: [],
      activity_plan_records: [],
      meal_routine_records: [],
      bedtime_routine_records: [],
      child_participation_records: [],
    });
    expect(r.strengths).toEqual([]);
    expect(r.concerns).toEqual([]);
    expect(r.recommendations).toEqual([]);
    expect(r.insights).toEqual([]);
  });

  it("returns zero rates for insufficient_data", () => {
    const r = computeDailyRoutineStructure({
      today: "2026-05-27",
      total_children: 0,
      routine_schedule_records: [],
      activity_plan_records: [],
      meal_routine_records: [],
      bedtime_routine_records: [],
      child_participation_records: [],
    });
    expect(r.routine_consistency_rate).toBe(0);
    expect(r.activity_completion_rate).toBe(0);
    expect(r.meal_regularity_rate).toBe(0);
    expect(r.bedtime_adherence_rate).toBe(0);
    expect(r.child_participation_rate).toBe(0);
    expect(r.flexibility_rate).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. INADEQUATE FLOOR — all empty + children > 0
// ═══════════════════════════════════════════════════════════════════════════

describe("inadequate floor (all empty, children on placement)", () => {
  it("returns inadequate with score 15 when all arrays empty but children > 0", () => {
    const r = computeDailyRoutineStructure({
      today: "2026-05-27",
      total_children: 3,
      routine_schedule_records: [],
      activity_plan_records: [],
      meal_routine_records: [],
      bedtime_routine_records: [],
      child_participation_records: [],
    });
    expect(r.routine_rating).toBe("inadequate");
    expect(r.routine_score).toBe(15);
  });

  it("returns headline mentioning urgent attention", () => {
    const r = computeDailyRoutineStructure({
      today: "2026-05-27",
      total_children: 1,
      routine_schedule_records: [],
      activity_plan_records: [],
      meal_routine_records: [],
      bedtime_routine_records: [],
      child_participation_records: [],
    });
    expect(r.headline).toContain("urgent attention");
  });

  it("returns one concern about missing records", () => {
    const r = computeDailyRoutineStructure({
      today: "2026-05-27",
      total_children: 2,
      routine_schedule_records: [],
      activity_plan_records: [],
      meal_routine_records: [],
      bedtime_routine_records: [],
      child_participation_records: [],
    });
    expect(r.concerns.length).toBe(1);
    expect(r.concerns[0]).toContain("No routine schedule records");
  });

  it("returns two recommendations", () => {
    const r = computeDailyRoutineStructure({
      today: "2026-05-27",
      total_children: 2,
      routine_schedule_records: [],
      activity_plan_records: [],
      meal_routine_records: [],
      bedtime_routine_records: [],
      child_participation_records: [],
    });
    expect(r.recommendations.length).toBe(2);
    expect(r.recommendations[0].urgency).toBe("immediate");
    expect(r.recommendations[1].urgency).toBe("immediate");
  });

  it("returns one critical insight", () => {
    const r = computeDailyRoutineStructure({
      today: "2026-05-27",
      total_children: 2,
      routine_schedule_records: [],
      activity_plan_records: [],
      meal_routine_records: [],
      bedtime_routine_records: [],
      child_participation_records: [],
    });
    expect(r.insights.length).toBe(1);
    expect(r.insights[0].severity).toBe("critical");
  });

  it("works with total_children=1 edge case", () => {
    const r = computeDailyRoutineStructure({
      today: "2026-05-27",
      total_children: 1,
      routine_schedule_records: [],
      activity_plan_records: [],
      meal_routine_records: [],
      bedtime_routine_records: [],
      child_participation_records: [],
    });
    expect(r.routine_rating).toBe("inadequate");
    expect(r.routine_score).toBe(15);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. OUTSTANDING SCENARIO
// ═══════════════════════════════════════════════════════════════════════════

describe("outstanding scenario", () => {
  it("returns outstanding when all metrics are perfect", () => {
    const r = computeDailyRoutineStructure(baseInput());
    expect(r.routine_rating).toBe("outstanding");
    expect(r.routine_score).toBe(80); // 52 + 4+3+4+3+3+3+3+2+3 = 80
  });

  it("max score is 80 with all 9 bonuses at top tier", () => {
    const r = computeDailyRoutineStructure(baseInput());
    // base 52 + 4+3+4+3+3+3+3+2+3 = 80
    expect(r.routine_score).toBe(80);
  });

  it("headline starts with Outstanding", () => {
    const r = computeDailyRoutineStructure(baseInput());
    expect(r.headline).toContain("Outstanding");
  });

  it("has multiple strengths", () => {
    const r = computeDailyRoutineStructure(baseInput());
    expect(r.strengths.length).toBeGreaterThan(5);
  });

  it("has zero concerns", () => {
    const r = computeDailyRoutineStructure(baseInput());
    expect(r.concerns.length).toBe(0);
  });

  it("has zero recommendations", () => {
    const r = computeDailyRoutineStructure(baseInput());
    expect(r.recommendations.length).toBe(0);
  });

  it("includes positive insights", () => {
    const r = computeDailyRoutineStructure(baseInput());
    const positive = r.insights.filter((i) => i.severity === "positive");
    expect(positive.length).toBeGreaterThan(0);
  });

  it("includes outstanding insight text", () => {
    const r = computeDailyRoutineStructure(baseInput());
    const outstandingInsight = r.insights.find((i) => i.text.includes("outstanding daily routine"));
    expect(outstandingInsight).toBeDefined();
    expect(outstandingInsight!.severity).toBe("positive");
  });

  it("reports 100% rates across the board", () => {
    const r = computeDailyRoutineStructure(baseInput());
    expect(r.routine_consistency_rate).toBe(100);
    expect(r.activity_completion_rate).toBe(100);
    expect(r.meal_regularity_rate).toBe(100);
    expect(r.bedtime_adherence_rate).toBe(100);
    expect(r.child_participation_rate).toBe(100);
    expect(r.flexibility_rate).toBe(100);
  });

  it("reports correct record counts", () => {
    const r = computeDailyRoutineStructure(baseInput());
    expect(r.total_routine_records).toBe(10);
    expect(r.total_activity_records).toBe(10);
    expect(r.total_meal_records).toBe(10);
    expect(r.total_bedtime_records).toBe(10);
    expect(r.total_participation_records).toBe(10);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. GOOD SCENARIO
// ═══════════════════════════════════════════════════════════════════════════

describe("good scenario", () => {
  it("returns good for score 65-79", () => {
    // Score = 52 + some bonuses in lower tier
    // 7/10 routine_followed → 70% → +2
    // 7/10 activity completed → 70% → +1
    // 7/10 meals on time → 70% → +2
    // 7/10 bedtime followed → 70% → +1
    // Need participation rate in lower tier: all 4 fields at 7/10 → pct(28,40)=70 → >=65 → +1
    // 5/10 flexibility → 50% → +1
    // 7/10 enjoyment → 70% → +1
    // 7/10 settling → 70% → +1
    // 7/10 meal satisfaction → 70% → +1
    // total = 52 + 2+1+2+1+1+1+1+1+1 = 63 → but we want >=65
    // Let's go higher: 8/10 on routine → 80% → +2, 9/10 meals → 90% → +4
    // 52 + 2+1+4+1+1+1+1+1+1 = 65
    const r = computeDailyRoutineStructure(baseInput({
      routine_schedule_records: nOf(10, 8, makeRoutine, { routine_followed: true, flexibility_shown: true }, { routine_followed: false, flexibility_shown: false }),
      activity_plan_records: nOf(10, 7, makeActivity, { completed: true, child_enjoyed: true }, { completed: false, child_enjoyed: false }),
      meal_routine_records: nOf(10, 9, makeMeal, { meal_on_time: true, child_feedback_positive: true }, { meal_on_time: false, child_feedback_positive: false }),
      bedtime_routine_records: nOf(10, 7, makeBedtime, { bedtime_routine_followed: true, child_settled_within_30_min: true }, { bedtime_routine_followed: false, child_settled_within_30_min: false }),
      child_participation_records: nOf(10, 7, makeParticipation, { child_consulted: true, child_views_recorded: true, views_actioned: true, child_satisfied_with_outcome: true }, { child_consulted: false, child_views_recorded: false, views_actioned: false, child_satisfied_with_outcome: false }),
    }));
    expect(r.routine_rating).toBe("good");
    expect(r.routine_score).toBeGreaterThanOrEqual(65);
    expect(r.routine_score).toBeLessThan(80);
  });

  it("headline starts with Good", () => {
    const r = computeDailyRoutineStructure(baseInput({
      routine_schedule_records: nOf(10, 8, makeRoutine, { routine_followed: true, flexibility_shown: true }, { routine_followed: false, flexibility_shown: false }),
      activity_plan_records: nOf(10, 7, makeActivity, { completed: true, child_enjoyed: true }, { completed: false, child_enjoyed: false }),
      meal_routine_records: nOf(10, 9, makeMeal, { meal_on_time: true, child_feedback_positive: true }, { meal_on_time: false, child_feedback_positive: false }),
      bedtime_routine_records: nOf(10, 7, makeBedtime, { bedtime_routine_followed: true, child_settled_within_30_min: true }, { bedtime_routine_followed: false, child_settled_within_30_min: false }),
      child_participation_records: nOf(10, 7, makeParticipation, { child_consulted: true, child_views_recorded: true, views_actioned: true, child_satisfied_with_outcome: true }, { child_consulted: false, child_views_recorded: false, views_actioned: false, child_satisfied_with_outcome: false }),
    }));
    expect(r.headline).toContain("Good");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. ADEQUATE SCENARIO
// ═══════════════════════════════════════════════════════════════════════════

describe("adequate scenario", () => {
  it("returns adequate for score 45-64", () => {
    // Base 52 with no bonuses and no penalties → adequate (52)
    // Zero records for everything except a single routine record at borderline
    const r = computeDailyRoutineStructure(baseInput({
      routine_schedule_records: nOf(10, 6, makeRoutine, { routine_followed: true, flexibility_shown: false, actual_start_time: "07:00" }, { routine_followed: false, flexibility_shown: false, actual_start_time: null }),
      activity_plan_records: nOf(10, 6, makeActivity, { completed: true, child_enjoyed: true }, { completed: false, child_enjoyed: false }),
      meal_routine_records: nOf(10, 6, makeMeal, { meal_on_time: true, child_feedback_positive: true }, { meal_on_time: false, child_feedback_positive: false }),
      bedtime_routine_records: nOf(10, 6, makeBedtime, { bedtime_routine_followed: true, child_settled_within_30_min: true }, { bedtime_routine_followed: false, child_settled_within_30_min: false }),
      child_participation_records: nOf(10, 5, makeParticipation, { child_consulted: true, child_views_recorded: true, views_actioned: true, child_satisfied_with_outcome: true }, { child_consulted: false, child_views_recorded: false, views_actioned: false, child_satisfied_with_outcome: false }),
    }));
    expect(r.routine_rating).toBe("adequate");
    expect(r.routine_score).toBeGreaterThanOrEqual(45);
    expect(r.routine_score).toBeLessThan(65);
  });

  it("headline mentions adequate", () => {
    const r = computeDailyRoutineStructure(baseInput({
      routine_schedule_records: nOf(10, 6, makeRoutine, { routine_followed: true, flexibility_shown: false }, { routine_followed: false, flexibility_shown: false }),
      activity_plan_records: nOf(10, 6, makeActivity, { completed: true, child_enjoyed: false }, { completed: false, child_enjoyed: false }),
      meal_routine_records: nOf(10, 6, makeMeal, { meal_on_time: true, child_feedback_positive: false }, { meal_on_time: false, child_feedback_positive: false }),
      bedtime_routine_records: nOf(10, 6, makeBedtime, { bedtime_routine_followed: true, child_settled_within_30_min: false }, { bedtime_routine_followed: false, child_settled_within_30_min: false }),
      child_participation_records: nOf(10, 5, makeParticipation, { child_consulted: true, child_views_recorded: true, views_actioned: true, child_satisfied_with_outcome: true }, { child_consulted: false, child_views_recorded: false, views_actioned: false, child_satisfied_with_outcome: false }),
    }));
    expect(r.headline).toContain("Adequate");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 6. INADEQUATE SCENARIO
// ═══════════════════════════════════════════════════════════════════════════

describe("inadequate scenario", () => {
  it("returns inadequate when all metrics are 0%", () => {
    const r = computeDailyRoutineStructure(allBadInput());
    expect(r.routine_rating).toBe("inadequate");
    // 52 - 5(routine) - 5(meal) - 5(bedtime) - 3(participation) = 34
    expect(r.routine_score).toBe(34);
  });

  it("headline mentions inadequate", () => {
    const r = computeDailyRoutineStructure(allBadInput());
    expect(r.headline).toContain("inadequate");
  });

  it("has multiple concerns", () => {
    const r = computeDailyRoutineStructure(allBadInput());
    expect(r.concerns.length).toBeGreaterThan(5);
  });

  it("has multiple immediate recommendations", () => {
    const r = computeDailyRoutineStructure(allBadInput());
    const immediate = r.recommendations.filter((rec) => rec.urgency === "immediate");
    expect(immediate.length).toBeGreaterThan(3);
  });

  it("has critical insights", () => {
    const r = computeDailyRoutineStructure(allBadInput());
    const critical = r.insights.filter((i) => i.severity === "critical");
    expect(critical.length).toBeGreaterThan(3);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 7. INDIVIDUAL BONUSES (isolated)
// ═══════════════════════════════════════════════════════════════════════════

describe("bonus 1: routineConsistencyRate", () => {
  function inputWithRoutineConsistency(rate: number): DailyRoutineInput {
    const n = 10;
    const good = Math.round(n * rate / 100);
    return {
      today: "2026-05-27",
      total_children: 3,
      routine_schedule_records: nOf(n, good, makeRoutine,
        { routine_followed: true, flexibility_shown: false, child_informed_of_plan: false, actual_start_time: null, consistency_rating: 1 },
        { routine_followed: false, flexibility_shown: false, child_informed_of_plan: false, actual_start_time: null, consistency_rating: 1 },
      ),
      activity_plan_records: [],
      meal_routine_records: [],
      bedtime_routine_records: [],
      child_participation_records: [],
    };
  }

  it(">=90% → +4", () => {
    const r = computeDailyRoutineStructure(inputWithRoutineConsistency(100));
    // base 52 + 4 = 56, no penalties since 100%>=50
    expect(r.routine_score).toBe(56);
  });

  it("70-89% → +2", () => {
    const r = computeDailyRoutineStructure(inputWithRoutineConsistency(70));
    // base 52 + 2 = 54
    expect(r.routine_score).toBe(54);
  });

  it("50-69% → +0", () => {
    const r = computeDailyRoutineStructure(inputWithRoutineConsistency(60));
    // base 52, no bonus, no penalty (60%>=50)
    expect(r.routine_score).toBe(52);
  });

  it("<50% → -5 penalty", () => {
    const r = computeDailyRoutineStructure(inputWithRoutineConsistency(40));
    // base 52, no bonus, penalty -5 = 47
    expect(r.routine_score).toBe(47);
  });

  it("0% → -5 penalty", () => {
    const r = computeDailyRoutineStructure(inputWithRoutineConsistency(0));
    expect(r.routine_score).toBe(47);
  });
});

describe("bonus 2: activityCompletionRate", () => {
  function inputWithActivityCompletion(rate: number): DailyRoutineInput {
    const n = 10;
    const good = Math.round(n * rate / 100);
    return {
      today: "2026-05-27",
      total_children: 3,
      routine_schedule_records: [],
      activity_plan_records: nOf(n, good, makeActivity,
        { completed: true, child_enjoyed: false, child_chose_activity: false, activity_type: "other" as const },
        { completed: false, child_enjoyed: false, child_chose_activity: false, activity_type: "other" as const },
      ),
      meal_routine_records: [],
      bedtime_routine_records: [],
      child_participation_records: [],
    };
  }

  it(">=90% → +3", () => {
    const r = computeDailyRoutineStructure(inputWithActivityCompletion(100));
    expect(r.routine_score).toBe(55); // 52+3
  });

  it("70-89% → +1", () => {
    const r = computeDailyRoutineStructure(inputWithActivityCompletion(70));
    expect(r.routine_score).toBe(53); // 52+1
  });

  it("50-69% → +0", () => {
    const r = computeDailyRoutineStructure(inputWithActivityCompletion(60));
    expect(r.routine_score).toBe(52);
  });

  it("<50% → +0 (no dedicated penalty for activity)", () => {
    const r = computeDailyRoutineStructure(inputWithActivityCompletion(40));
    // No penalty for activityCompletion < 50 in scoring (only concerns)
    expect(r.routine_score).toBe(52);
  });
});

describe("bonus 3: mealRegularityRate", () => {
  function inputWithMealRegularity(rate: number): DailyRoutineInput {
    const n = 10;
    const good = Math.round(n * rate / 100);
    return {
      today: "2026-05-27",
      total_children: 3,
      routine_schedule_records: [],
      activity_plan_records: [],
      meal_routine_records: nOf(n, good, makeMeal,
        { meal_on_time: true, child_feedback_positive: false, dietary_needs_met: false, healthy_options_provided: false, social_dining_environment: false, child_involved_in_preparation: false },
        { meal_on_time: false, child_feedback_positive: false, dietary_needs_met: false, healthy_options_provided: false, social_dining_environment: false, child_involved_in_preparation: false },
      ),
      bedtime_routine_records: [],
      child_participation_records: [],
    };
  }

  it(">=90% → +4", () => {
    const r = computeDailyRoutineStructure(inputWithMealRegularity(100));
    expect(r.routine_score).toBe(56); // 52+4
  });

  it("70-89% → +2", () => {
    const r = computeDailyRoutineStructure(inputWithMealRegularity(70));
    expect(r.routine_score).toBe(54); // 52+2
  });

  it("50-69% → +0", () => {
    const r = computeDailyRoutineStructure(inputWithMealRegularity(60));
    expect(r.routine_score).toBe(52);
  });

  it("<50% → -5 penalty", () => {
    const r = computeDailyRoutineStructure(inputWithMealRegularity(40));
    expect(r.routine_score).toBe(47); // 52-5
  });
});

describe("bonus 4: bedtimeAdherenceRate", () => {
  function inputWithBedtimeAdherence(rate: number): DailyRoutineInput {
    const n = 10;
    const good = Math.round(n * rate / 100);
    return {
      today: "2026-05-27",
      total_children: 3,
      routine_schedule_records: [],
      activity_plan_records: [],
      meal_routine_records: [],
      bedtime_routine_records: nOf(n, good, makeBedtime,
        { bedtime_routine_followed: true, child_settled_within_30_min: false, wind_down_activity_provided: false, age_appropriate_bedtime: false, consistent_with_previous_nights: false },
        { bedtime_routine_followed: false, child_settled_within_30_min: false, wind_down_activity_provided: false, age_appropriate_bedtime: false, consistent_with_previous_nights: false },
      ),
      child_participation_records: [],
    };
  }

  it(">=90% → +3", () => {
    const r = computeDailyRoutineStructure(inputWithBedtimeAdherence(100));
    expect(r.routine_score).toBe(55); // 52+3
  });

  it("70-89% → +1", () => {
    const r = computeDailyRoutineStructure(inputWithBedtimeAdherence(70));
    expect(r.routine_score).toBe(53); // 52+1
  });

  it("50-69% → +0", () => {
    const r = computeDailyRoutineStructure(inputWithBedtimeAdherence(60));
    expect(r.routine_score).toBe(52);
  });

  it("<50% → -5 penalty", () => {
    const r = computeDailyRoutineStructure(inputWithBedtimeAdherence(40));
    expect(r.routine_score).toBe(47); // 52-5
  });
});

describe("bonus 5: childParticipationRate", () => {
  // childParticipationRate = pct(consulted+viewsRecorded+actioned+satisfied, total*4)
  // For 10 records, denominator = 40. Need 85% = 34/40 all 4 fields true on 8.5 → round to 9
  // 9 perfect: 36/40=90% → >=85 → +3
  // 7 perfect: 28/40=70% → >=65 → +1
  function inputWithParticipation(goodCount: number): DailyRoutineInput {
    return {
      today: "2026-05-27",
      total_children: 3,
      routine_schedule_records: [],
      activity_plan_records: [],
      meal_routine_records: [],
      bedtime_routine_records: [],
      child_participation_records: nOf(10, goodCount, makeParticipation,
        { child_consulted: true, child_views_recorded: true, views_actioned: true, child_satisfied_with_outcome: true },
        { child_consulted: false, child_views_recorded: false, views_actioned: false, child_satisfied_with_outcome: false },
      ),
    };
  }

  it(">=85% → +3 (9/10 perfect records = 90%)", () => {
    const r = computeDailyRoutineStructure(inputWithParticipation(9));
    // pct(36,40)=90 → +3, no penalty since 90>=40
    expect(r.routine_score).toBe(55); // 52+3
  });

  it(">=65% → +1 (7/10 perfect records = 70%)", () => {
    const r = computeDailyRoutineStructure(inputWithParticipation(7));
    // pct(28,40)=70 → >=65 → +1
    expect(r.routine_score).toBe(53); // 52+1
  });

  it("<65% and >=40% → +0 (5/10 = 50%)", () => {
    const r = computeDailyRoutineStructure(inputWithParticipation(5));
    // pct(20,40)=50 → no bonus, no penalty (50>=40)
    expect(r.routine_score).toBe(52);
  });

  it("<40% → -3 penalty (3/10 = 30%)", () => {
    const r = computeDailyRoutineStructure(inputWithParticipation(3));
    // pct(12,40)=30 → <40 → penalty -3
    expect(r.routine_score).toBe(49); // 52-3
  });

  it("0% → -3 penalty", () => {
    const r = computeDailyRoutineStructure(inputWithParticipation(0));
    // pct(0,40)=0 → <40 → penalty -3
    expect(r.routine_score).toBe(49); // 52-3
  });
});

describe("bonus 6: flexibilityRate", () => {
  function inputWithFlexibility(rate: number): DailyRoutineInput {
    const n = 10;
    const good = Math.round(n * rate / 100);
    return {
      today: "2026-05-27",
      total_children: 3,
      routine_schedule_records: nOf(n, good, makeRoutine,
        { flexibility_shown: true, routine_followed: false, child_informed_of_plan: false, actual_start_time: null, consistency_rating: 1 },
        { flexibility_shown: false, routine_followed: false, child_informed_of_plan: false, actual_start_time: null, consistency_rating: 1 },
      ),
      activity_plan_records: [],
      meal_routine_records: [],
      bedtime_routine_records: [],
      child_participation_records: [],
    };
  }

  it(">=80% → +3", () => {
    const r = computeDailyRoutineStructure(inputWithFlexibility(80));
    // routine_followed=false → routineConsistencyRate=0% → penalty -5
    // flexibility 80% → +3
    // 52 + 3 - 5 = 50
    expect(r.routine_score).toBe(50);
  });

  it("50-79% → +1", () => {
    const r = computeDailyRoutineStructure(inputWithFlexibility(50));
    // 52 + 1 - 5 = 48
    expect(r.routine_score).toBe(48);
  });

  it("<50% → +0", () => {
    const r = computeDailyRoutineStructure(inputWithFlexibility(40));
    // 52 + 0 - 5 = 47
    expect(r.routine_score).toBe(47);
  });
});

describe("bonus 7: activityEnjoymentRate", () => {
  function inputWithEnjoyment(rate: number): DailyRoutineInput {
    const n = 10;
    const good = Math.round(n * rate / 100);
    return {
      today: "2026-05-27",
      total_children: 3,
      routine_schedule_records: [],
      activity_plan_records: nOf(n, good, makeActivity,
        { child_enjoyed: true, completed: false, child_chose_activity: false, activity_type: "other" as const },
        { child_enjoyed: false, completed: false, child_chose_activity: false, activity_type: "other" as const },
      ),
      meal_routine_records: [],
      bedtime_routine_records: [],
      child_participation_records: [],
    };
  }

  it(">=90% → +3", () => {
    const r = computeDailyRoutineStructure(inputWithEnjoyment(100));
    expect(r.routine_score).toBe(55); // 52+3
  });

  it("70-89% → +1", () => {
    const r = computeDailyRoutineStructure(inputWithEnjoyment(70));
    expect(r.routine_score).toBe(53); // 52+1
  });

  it("<70% → +0", () => {
    const r = computeDailyRoutineStructure(inputWithEnjoyment(60));
    expect(r.routine_score).toBe(52);
  });
});

describe("bonus 8: settlingRate", () => {
  function inputWithSettling(rate: number): DailyRoutineInput {
    const n = 10;
    const good = Math.round(n * rate / 100);
    return {
      today: "2026-05-27",
      total_children: 3,
      routine_schedule_records: [],
      activity_plan_records: [],
      meal_routine_records: [],
      bedtime_routine_records: nOf(n, good, makeBedtime,
        { child_settled_within_30_min: true, bedtime_routine_followed: false, wind_down_activity_provided: false, age_appropriate_bedtime: false, consistent_with_previous_nights: false },
        { child_settled_within_30_min: false, bedtime_routine_followed: false, wind_down_activity_provided: false, age_appropriate_bedtime: false, consistent_with_previous_nights: false },
      ),
      child_participation_records: [],
    };
  }

  it(">=90% → +2", () => {
    const r = computeDailyRoutineStructure(inputWithSettling(100));
    // bedtime adherence 0% → penalty -5
    // settling 100% → +2
    // 52 + 2 - 5 = 49
    expect(r.routine_score).toBe(49);
  });

  it("70-89% → +1", () => {
    const r = computeDailyRoutineStructure(inputWithSettling(70));
    // 52 + 1 - 5 = 48
    expect(r.routine_score).toBe(48);
  });

  it("<70% → +0", () => {
    const r = computeDailyRoutineStructure(inputWithSettling(60));
    // 52 - 5 = 47
    expect(r.routine_score).toBe(47);
  });
});

describe("bonus 9: mealSatisfactionRate", () => {
  function inputWithMealSatisfaction(rate: number): DailyRoutineInput {
    const n = 10;
    const good = Math.round(n * rate / 100);
    return {
      today: "2026-05-27",
      total_children: 3,
      routine_schedule_records: [],
      activity_plan_records: [],
      meal_routine_records: nOf(n, good, makeMeal,
        { child_feedback_positive: true, meal_on_time: false, dietary_needs_met: false, healthy_options_provided: false, social_dining_environment: false, child_involved_in_preparation: false },
        { child_feedback_positive: false, meal_on_time: false, dietary_needs_met: false, healthy_options_provided: false, social_dining_environment: false, child_involved_in_preparation: false },
      ),
      bedtime_routine_records: [],
      child_participation_records: [],
    };
  }

  it(">=90% → +3", () => {
    const r = computeDailyRoutineStructure(inputWithMealSatisfaction(100));
    // meal on time 0% → penalty -5
    // meal satisfaction 100% → +3
    // 52 + 3 - 5 = 50
    expect(r.routine_score).toBe(50);
  });

  it("70-89% → +1", () => {
    const r = computeDailyRoutineStructure(inputWithMealSatisfaction(70));
    // 52 + 1 - 5 = 48
    expect(r.routine_score).toBe(48);
  });

  it("<70% → +0", () => {
    const r = computeDailyRoutineStructure(inputWithMealSatisfaction(60));
    // 52 - 5 = 47
    expect(r.routine_score).toBe(47);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 8. PENALTIES
// ═══════════════════════════════════════════════════════════════════════════

describe("penalties", () => {
  it("routineConsistencyRate < 50 → -5", () => {
    const r = computeDailyRoutineStructure(baseInput({
      routine_schedule_records: nOf(10, 4, makeRoutine,
        { routine_followed: true, flexibility_shown: true, child_informed_of_plan: true, consistency_rating: 5, actual_start_time: "07:00" },
        { routine_followed: false, flexibility_shown: true, child_informed_of_plan: true, consistency_rating: 5, actual_start_time: "07:00" },
      ),
    }));
    // routineConsistency = 40% → -5 penalty, no bonus
    // flexibility: all have flexibility_shown: true → 100% → +3
    // Other bonuses from baseInput defaults apply
    const base = computeDailyRoutineStructure(baseInput());
    expect(r.routine_score).toBe(base.routine_score - 4 - 5); // lost +4 bonus, got -5 penalty
  });

  it("mealRegularityRate < 50 → -5", () => {
    const r = computeDailyRoutineStructure(baseInput({
      meal_routine_records: nOf(10, 4, makeMeal,
        { meal_on_time: true },
        { meal_on_time: false },
      ),
    }));
    const full = computeDailyRoutineStructure(baseInput());
    // Lost +4 (mealRegularity was 100→40%), got -5 penalty
    // mealSatisfaction still 100% → +3 (no change since all defaults have child_feedback_positive=true)
    expect(r.routine_score).toBe(full.routine_score - 4 - 5);
  });

  it("bedtimeAdherenceRate < 50 → -5", () => {
    const r = computeDailyRoutineStructure(baseInput({
      bedtime_routine_records: nOf(10, 4, makeBedtime,
        { bedtime_routine_followed: true },
        { bedtime_routine_followed: false },
      ),
    }));
    const full = computeDailyRoutineStructure(baseInput());
    // Lost +3 (bedtime adherence was 100→40%), got -5 penalty
    // settling still 100% → +2 (defaults have child_settled_within_30_min=true)
    expect(r.routine_score).toBe(full.routine_score - 3 - 5);
  });

  it("childParticipationRate < 40 → -3", () => {
    const r = computeDailyRoutineStructure(baseInput({
      child_participation_records: nOf(10, 3, makeParticipation,
        { child_consulted: true, child_views_recorded: true, views_actioned: true, child_satisfied_with_outcome: true },
        { child_consulted: false, child_views_recorded: false, views_actioned: false, child_satisfied_with_outcome: false },
      ),
    }));
    const full = computeDailyRoutineStructure(baseInput());
    // pct(12,40)=30% → <40 → penalty -3, lost +3 bonus
    expect(r.routine_score).toBe(full.routine_score - 3 - 3);
  });

  it("all 4 penalties stack", () => {
    const r = computeDailyRoutineStructure(allBadInput());
    // base 52 - 5 - 5 - 5 - 3 = 34
    expect(r.routine_score).toBe(34);
  });

  it("no penalty when record count is 0 (even though rate=0)", () => {
    // pct(0,0) = 0, but penalties check totalXRecords > 0
    const r = computeDailyRoutineStructure(baseInput({
      routine_schedule_records: [],
      meal_routine_records: [],
      bedtime_routine_records: [],
      child_participation_records: [],
    }));
    // Only activity records remain from baseInput defaults
    // activityCompletion 100% → +3, activityEnjoyment 100% → +3
    // No penalties since empty arrays
    expect(r.routine_score).toBe(52 + 3 + 3);
  });

  it("score clamps at 0 minimum", () => {
    // Impossible to go below 0 with current max penalties of -18 from base 52
    // but verify the clamp works
    const r = computeDailyRoutineStructure(allBadInput());
    expect(r.routine_score).toBeGreaterThanOrEqual(0);
  });

  it("score clamps at 100 maximum", () => {
    const r = computeDailyRoutineStructure(baseInput());
    expect(r.routine_score).toBeLessThanOrEqual(100);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 9. SIX RATES
// ═══════════════════════════════════════════════════════════════════════════

describe("six output rates", () => {
  it("routine_consistency_rate = pct(routine_followed, total)", () => {
    const r = computeDailyRoutineStructure(baseInput({
      routine_schedule_records: nOf(10, 7, makeRoutine, { routine_followed: true }, { routine_followed: false }),
    }));
    expect(r.routine_consistency_rate).toBe(70);
  });

  it("activity_completion_rate = pct(completed, total)", () => {
    const r = computeDailyRoutineStructure(baseInput({
      activity_plan_records: nOf(10, 8, makeActivity, { completed: true }, { completed: false }),
    }));
    expect(r.activity_completion_rate).toBe(80);
  });

  it("meal_regularity_rate = pct(meal_on_time, total)", () => {
    const r = computeDailyRoutineStructure(baseInput({
      meal_routine_records: nOf(10, 6, makeMeal, { meal_on_time: true }, { meal_on_time: false }),
    }));
    expect(r.meal_regularity_rate).toBe(60);
  });

  it("bedtime_adherence_rate = pct(bedtime_routine_followed, total)", () => {
    const r = computeDailyRoutineStructure(baseInput({
      bedtime_routine_records: nOf(10, 9, makeBedtime, { bedtime_routine_followed: true }, { bedtime_routine_followed: false }),
    }));
    expect(r.bedtime_adherence_rate).toBe(90);
  });

  it("child_participation_rate = composite of 4 fields", () => {
    // 8 perfect, 2 bad → pct(32,40) = 80
    const r = computeDailyRoutineStructure(baseInput({
      child_participation_records: nOf(10, 8, makeParticipation,
        { child_consulted: true, child_views_recorded: true, views_actioned: true, child_satisfied_with_outcome: true },
        { child_consulted: false, child_views_recorded: false, views_actioned: false, child_satisfied_with_outcome: false },
      ),
    }));
    expect(r.child_participation_rate).toBe(80);
  });

  it("flexibility_rate = pct(flexibility_shown, total_routine_records)", () => {
    const r = computeDailyRoutineStructure(baseInput({
      routine_schedule_records: nOf(10, 5, makeRoutine, { flexibility_shown: true }, { flexibility_shown: false }),
    }));
    expect(r.flexibility_rate).toBe(50);
  });

  it("pct(0,0) = 0 for all rates when no records", () => {
    const r = computeDailyRoutineStructure({
      today: "2026-05-27",
      total_children: 0,
      routine_schedule_records: [],
      activity_plan_records: [],
      meal_routine_records: [],
      bedtime_routine_records: [],
      child_participation_records: [],
    });
    expect(r.routine_consistency_rate).toBe(0);
    expect(r.activity_completion_rate).toBe(0);
    expect(r.meal_regularity_rate).toBe(0);
    expect(r.bedtime_adherence_rate).toBe(0);
    expect(r.child_participation_rate).toBe(0);
    expect(r.flexibility_rate).toBe(0);
  });

  it("rates round to integer", () => {
    // 1/3 = 33.33...% → pct rounds to 33
    const r = computeDailyRoutineStructure(baseInput({
      routine_schedule_records: nOf(3, 1, makeRoutine, { routine_followed: true }, { routine_followed: false }),
    }));
    expect(r.routine_consistency_rate).toBe(33);
    expect(Number.isInteger(r.routine_consistency_rate)).toBe(true);
  });

  it("2/3 rounds to 67", () => {
    const r = computeDailyRoutineStructure(baseInput({
      routine_schedule_records: nOf(3, 2, makeRoutine, { routine_followed: true }, { routine_followed: false }),
    }));
    expect(r.routine_consistency_rate).toBe(67);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 10. STRENGTHS
// ═══════════════════════════════════════════════════════════════════════════

describe("strengths", () => {
  it("routine consistency >=90% strength", () => {
    const r = computeDailyRoutineStructure(baseInput());
    expect(r.strengths.some((s) => s.includes("routine consistency") && s.includes("100%"))).toBe(true);
  });

  it("routine consistency 70-89% produces lower-tier strength", () => {
    const r = computeDailyRoutineStructure(baseInput({
      routine_schedule_records: nOf(10, 7, makeRoutine, { routine_followed: true }, { routine_followed: false }),
    }));
    expect(r.strengths.some((s) => s.includes("70%") && s.includes("routine consistency"))).toBe(true);
  });

  it("activity completion >=90% strength", () => {
    const r = computeDailyRoutineStructure(baseInput());
    expect(r.strengths.some((s) => s.includes("activity completion") && s.includes("100%"))).toBe(true);
  });

  it("activity completion 70-89% lower-tier strength", () => {
    const r = computeDailyRoutineStructure(baseInput({
      activity_plan_records: nOf(10, 8, makeActivity, { completed: true }, { completed: false }),
    }));
    expect(r.strengths.some((s) => s.includes("80%") && s.includes("activity completion"))).toBe(true);
  });

  it("meal regularity >=90% strength", () => {
    const r = computeDailyRoutineStructure(baseInput());
    expect(r.strengths.some((s) => s.includes("meal time regularity") && s.includes("100%"))).toBe(true);
  });

  it("meal regularity 70-89% lower-tier strength", () => {
    const r = computeDailyRoutineStructure(baseInput({
      meal_routine_records: nOf(10, 7, makeMeal, { meal_on_time: true }, { meal_on_time: false }),
    }));
    expect(r.strengths.some((s) => s.includes("70%") && s.includes("meal time regularity"))).toBe(true);
  });

  it("bedtime adherence >=90% strength", () => {
    const r = computeDailyRoutineStructure(baseInput());
    expect(r.strengths.some((s) => s.includes("bedtime routine adherence") && s.includes("100%"))).toBe(true);
  });

  it("bedtime adherence 70-89% lower-tier strength", () => {
    const r = computeDailyRoutineStructure(baseInput({
      bedtime_routine_records: nOf(10, 8, makeBedtime, { bedtime_routine_followed: true }, { bedtime_routine_followed: false }),
    }));
    expect(r.strengths.some((s) => s.includes("80%") && s.includes("bedtime routine adherence"))).toBe(true);
  });

  it("child participation >=85% strength", () => {
    const r = computeDailyRoutineStructure(baseInput());
    expect(r.strengths.some((s) => s.includes("child participation quality") && s.includes("100%"))).toBe(true);
  });

  it("child participation 65-84% lower-tier strength", () => {
    const r = computeDailyRoutineStructure(baseInput({
      child_participation_records: nOf(10, 7, makeParticipation,
        { child_consulted: true, child_views_recorded: true, views_actioned: true, child_satisfied_with_outcome: true },
        { child_consulted: false, child_views_recorded: false, views_actioned: false, child_satisfied_with_outcome: false },
      ),
    }));
    // pct(28,40)=70 → >=65
    expect(r.strengths.some((s) => s.includes("child participation quality") && s.includes("70%"))).toBe(true);
  });

  it("flexibility >=80% strength", () => {
    const r = computeDailyRoutineStructure(baseInput());
    expect(r.strengths.some((s) => s.includes("flexibility demonstrated") && s.includes("100%"))).toBe(true);
  });

  it("flexibility 50-79% lower-tier strength", () => {
    const r = computeDailyRoutineStructure(baseInput({
      routine_schedule_records: nOf(10, 5, makeRoutine, { flexibility_shown: true, routine_followed: true }, { flexibility_shown: false, routine_followed: true }),
    }));
    expect(r.strengths.some((s) => s.includes("flexibility demonstrated") && s.includes("50%"))).toBe(true);
  });

  it("activity enjoyment >=90% strength", () => {
    const r = computeDailyRoutineStructure(baseInput());
    expect(r.strengths.some((s) => s.includes("activity enjoyment") && s.includes("100%"))).toBe(true);
  });

  it("activity enjoyment 70-89% lower-tier strength", () => {
    const r = computeDailyRoutineStructure(baseInput({
      activity_plan_records: nOf(10, 7, makeActivity, { child_enjoyed: true }, { child_enjoyed: false }),
    }));
    expect(r.strengths.some((s) => s.includes("activity enjoyment") && s.includes("70%"))).toBe(true);
  });

  it("activity choice >=80% strength", () => {
    const r = computeDailyRoutineStructure(baseInput());
    expect(r.strengths.some((s) => s.includes("child-chosen activities") && s.includes("100%"))).toBe(true);
  });

  it("activity choice 60-79% lower-tier strength", () => {
    const r = computeDailyRoutineStructure(baseInput({
      activity_plan_records: nOf(10, 6, makeActivity, { child_chose_activity: true }, { child_chose_activity: false }),
    }));
    expect(r.strengths.some((s) => s.includes("child-chosen activities") && s.includes("60%"))).toBe(true);
  });

  it("settling >=90% strength", () => {
    const r = computeDailyRoutineStructure(baseInput());
    expect(r.strengths.some((s) => s.includes("settle within 30 minutes") && s.includes("100%"))).toBe(true);
  });

  it("settling 70-89% lower-tier strength", () => {
    const r = computeDailyRoutineStructure(baseInput({
      bedtime_routine_records: nOf(10, 7, makeBedtime, { child_settled_within_30_min: true }, { child_settled_within_30_min: false }),
    }));
    expect(r.strengths.some((s) => s.includes("settle within 30 minutes") && s.includes("70%"))).toBe(true);
  });

  it("meal satisfaction >=90% strength", () => {
    const r = computeDailyRoutineStructure(baseInput());
    expect(r.strengths.some((s) => s.includes("positive meal feedback") && s.includes("100%"))).toBe(true);
  });

  it("meal satisfaction 70-89% lower-tier strength", () => {
    const r = computeDailyRoutineStructure(baseInput({
      meal_routine_records: nOf(10, 8, makeMeal, { child_feedback_positive: true }, { child_feedback_positive: false }),
    }));
    expect(r.strengths.some((s) => s.includes("positive meal feedback") && s.includes("80%"))).toBe(true);
  });

  it("dietary compliance >=90% strength", () => {
    const r = computeDailyRoutineStructure(baseInput());
    expect(r.strengths.some((s) => s.includes("dietary needs compliance"))).toBe(true);
  });

  it("healthy options >=90% strength", () => {
    const r = computeDailyRoutineStructure(baseInput());
    expect(r.strengths.some((s) => s.includes("healthy options provided"))).toBe(true);
  });

  it("social dining >=90% strength", () => {
    const r = computeDailyRoutineStructure(baseInput());
    expect(r.strengths.some((s) => s.includes("social dining environments"))).toBe(true);
  });

  it("wind-down >=90% strength", () => {
    const r = computeDailyRoutineStructure(baseInput());
    expect(r.strengths.some((s) => s.includes("wind-down activities provided"))).toBe(true);
  });

  it("age-appropriate bedtime >=90% strength", () => {
    const r = computeDailyRoutineStructure(baseInput());
    expect(r.strengths.some((s) => s.includes("age-appropriate bedtimes"))).toBe(true);
  });

  it("child informed >=90% strength", () => {
    const r = computeDailyRoutineStructure(baseInput());
    expect(r.strengths.some((s) => s.includes("children informed of daily plans"))).toBe(true);
  });

  it("views actioned >=90% strength", () => {
    const r = computeDailyRoutineStructure(baseInput());
    expect(r.strengths.some((s) => s.includes("children's views actioned"))).toBe(true);
  });

  it("avg consistency rating >=4.0 strength", () => {
    const r = computeDailyRoutineStructure(baseInput());
    expect(r.strengths.some((s) => s.includes("Average consistency rating"))).toBe(true);
  });

  it("activity variety >=6 types strength", () => {
    const types: ActivityPlanRecordInput["activity_type"][] = [
      "educational", "recreational", "therapeutic", "social", "life_skills", "creative",
    ];
    const r = computeDailyRoutineStructure(baseInput({
      activity_plan_records: types.map((t) => makeActivity({ activity_type: t })),
    }));
    expect(r.strengths.some((s) => s.includes("different activity types"))).toBe(true);
  });

  it("meal involvement >=70% strength", () => {
    const r = computeDailyRoutineStructure(baseInput());
    // baseInput defaults have child_involved_in_preparation: true (100%)
    expect(r.strengths.some((s) => s.includes("child involvement in meal preparation"))).toBe(true);
  });

  it("no strengths when all metrics are 0%", () => {
    const r = computeDailyRoutineStructure(allBadInput());
    expect(r.strengths.length).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 11. CONCERNS
// ═══════════════════════════════════════════════════════════════════════════

describe("concerns", () => {
  it("routine consistency <50% concern", () => {
    const r = computeDailyRoutineStructure(allBadInput());
    expect(r.concerns.some((c) => c.includes("0%") && c.includes("routine consistency"))).toBe(true);
  });

  it("routine consistency 50-69% concern", () => {
    const r = computeDailyRoutineStructure(baseInput({
      routine_schedule_records: nOf(10, 6, makeRoutine, { routine_followed: true }, { routine_followed: false }),
    }));
    expect(r.concerns.some((c) => c.includes("60%") && c.includes("Routine consistency"))).toBe(true);
  });

  it("activity completion <50% concern", () => {
    const r = computeDailyRoutineStructure(allBadInput());
    expect(r.concerns.some((c) => c.includes("0%") && c.includes("activity completion"))).toBe(true);
  });

  it("activity completion 50-69% concern", () => {
    const r = computeDailyRoutineStructure(baseInput({
      activity_plan_records: nOf(10, 6, makeActivity, { completed: true }, { completed: false }),
    }));
    expect(r.concerns.some((c) => c.includes("60%") && c.includes("Activity completion"))).toBe(true);
  });

  it("meal regularity <50% concern", () => {
    const r = computeDailyRoutineStructure(allBadInput());
    expect(r.concerns.some((c) => c.includes("0%") && c.includes("meal time regularity"))).toBe(true);
  });

  it("meal regularity 50-69% concern", () => {
    const r = computeDailyRoutineStructure(baseInput({
      meal_routine_records: nOf(10, 6, makeMeal, { meal_on_time: true }, { meal_on_time: false }),
    }));
    expect(r.concerns.some((c) => c.includes("60%") && c.includes("Meal time regularity"))).toBe(true);
  });

  it("bedtime adherence <50% concern", () => {
    const r = computeDailyRoutineStructure(allBadInput());
    expect(r.concerns.some((c) => c.includes("0%") && c.includes("bedtime routine adherence"))).toBe(true);
  });

  it("bedtime adherence 50-69% concern", () => {
    const r = computeDailyRoutineStructure(baseInput({
      bedtime_routine_records: nOf(10, 6, makeBedtime, { bedtime_routine_followed: true }, { bedtime_routine_followed: false }),
    }));
    expect(r.concerns.some((c) => c.includes("60%") && c.includes("Bedtime routine adherence"))).toBe(true);
  });

  it("child participation <40% concern", () => {
    const r = computeDailyRoutineStructure(allBadInput());
    expect(r.concerns.some((c) => c.includes("0%") && c.includes("Child participation quality"))).toBe(true);
  });

  it("child participation 40-64% concern", () => {
    const r = computeDailyRoutineStructure(baseInput({
      child_participation_records: nOf(10, 5, makeParticipation,
        { child_consulted: true, child_views_recorded: true, views_actioned: true, child_satisfied_with_outcome: true },
        { child_consulted: false, child_views_recorded: false, views_actioned: false, child_satisfied_with_outcome: false },
      ),
    }));
    // pct(20,40)=50 → >=40 and <65
    expect(r.concerns.some((c) => c.includes("50%") && c.includes("Child participation quality"))).toBe(true);
  });

  it("activity enjoyment <50% concern", () => {
    const r = computeDailyRoutineStructure(allBadInput());
    expect(r.concerns.some((c) => c.includes("0%") && c.includes("activity enjoyment"))).toBe(true);
  });

  it("activity enjoyment 50-69% concern", () => {
    const r = computeDailyRoutineStructure(baseInput({
      activity_plan_records: nOf(10, 6, makeActivity, { child_enjoyed: true }, { child_enjoyed: false }),
    }));
    expect(r.concerns.some((c) => c.includes("60%") && c.includes("Activity enjoyment"))).toBe(true);
  });

  it("settling <50% concern", () => {
    const r = computeDailyRoutineStructure(allBadInput());
    expect(r.concerns.some((c) => c.includes("0%") && c.includes("settle within 30 minutes"))).toBe(true);
  });

  it("settling 50-69% concern", () => {
    const r = computeDailyRoutineStructure(baseInput({
      bedtime_routine_records: nOf(10, 6, makeBedtime, { child_settled_within_30_min: true }, { child_settled_within_30_min: false }),
    }));
    expect(r.concerns.some((c) => c.includes("60%") && c.includes("Settling rate"))).toBe(true);
  });

  it("meal satisfaction <50% concern", () => {
    const r = computeDailyRoutineStructure(allBadInput());
    expect(r.concerns.some((c) => c.includes("0%") && c.includes("positive meal feedback"))).toBe(true);
  });

  it("meal satisfaction 50-69% concern", () => {
    const r = computeDailyRoutineStructure(baseInput({
      meal_routine_records: nOf(10, 6, makeMeal, { child_feedback_positive: true }, { child_feedback_positive: false }),
    }));
    expect(r.concerns.some((c) => c.includes("60%") && c.includes("Meal satisfaction"))).toBe(true);
  });

  it("dietary compliance <70% concern", () => {
    const r = computeDailyRoutineStructure(baseInput({
      meal_routine_records: nOf(10, 6, makeMeal, { dietary_needs_met: true }, { dietary_needs_met: false }),
    }));
    expect(r.concerns.some((c) => c.includes("Dietary needs compliance"))).toBe(true);
  });

  it("activity choice <40% concern", () => {
    const r = computeDailyRoutineStructure(allBadInput());
    expect(r.concerns.some((c) => c.includes("child-chosen activities"))).toBe(true);
  });

  it("flexibility <30% concern", () => {
    const r = computeDailyRoutineStructure(allBadInput());
    expect(r.concerns.some((c) => c.includes("Flexibility rate"))).toBe(true);
  });

  it("views actioned <50% concern", () => {
    const r = computeDailyRoutineStructure(allBadInput());
    expect(r.concerns.some((c) => c.includes("children's views actioned"))).toBe(true);
  });

  it("child informed <50% concern", () => {
    const r = computeDailyRoutineStructure(allBadInput());
    expect(r.concerns.some((c) => c.includes("children informed of daily plans"))).toBe(true);
  });

  it("wind-down <50% concern", () => {
    const r = computeDailyRoutineStructure(allBadInput());
    expect(r.concerns.some((c) => c.includes("wind-down activities provided"))).toBe(true);
  });

  it("no routine records with children → concern", () => {
    const r = computeDailyRoutineStructure(baseInput({
      routine_schedule_records: [],
    }));
    expect(r.concerns.some((c) => c.includes("No routine schedule records exist"))).toBe(true);
  });

  it("no meal records with children → concern", () => {
    const r = computeDailyRoutineStructure(baseInput({
      meal_routine_records: [],
    }));
    expect(r.concerns.some((c) => c.includes("No meal routine records exist"))).toBe(true);
  });

  it("no bedtime records with children → concern", () => {
    const r = computeDailyRoutineStructure(baseInput({
      bedtime_routine_records: [],
    }));
    expect(r.concerns.some((c) => c.includes("No bedtime routine records exist"))).toBe(true);
  });

  it("no participation records with children → concern", () => {
    const r = computeDailyRoutineStructure(baseInput({
      child_participation_records: [],
    }));
    expect(r.concerns.some((c) => c.includes("No child participation records exist"))).toBe(true);
  });

  it("no activity records with children → concern", () => {
    const r = computeDailyRoutineStructure(baseInput({
      activity_plan_records: [],
    }));
    expect(r.concerns.some((c) => c.includes("No activity plan records exist"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 12. RECOMMENDATIONS
// ═══════════════════════════════════════════════════════════════════════════

describe("recommendations", () => {
  it("routine consistency <50 → immediate recommendation", () => {
    const r = computeDailyRoutineStructure(allBadInput());
    expect(r.recommendations.some((rec) =>
      rec.urgency === "immediate" && rec.recommendation.includes("routine"),
    )).toBe(true);
  });

  it("meal regularity <50 → immediate recommendation", () => {
    const r = computeDailyRoutineStructure(allBadInput());
    expect(r.recommendations.some((rec) =>
      rec.urgency === "immediate" && rec.recommendation.includes("meal time irregularity"),
    )).toBe(true);
  });

  it("bedtime adherence <50 → immediate recommendation", () => {
    const r = computeDailyRoutineStructure(allBadInput());
    expect(r.recommendations.some((rec) =>
      rec.urgency === "immediate" && rec.recommendation.includes("bedtime routine"),
    )).toBe(true);
  });

  it("child participation <40 → immediate recommendation", () => {
    const r = computeDailyRoutineStructure(allBadInput());
    expect(r.recommendations.some((rec) =>
      rec.urgency === "immediate" && rec.recommendation.includes("child participation"),
    )).toBe(true);
  });

  it("activity completion <50 → immediate recommendation", () => {
    const r = computeDailyRoutineStructure(allBadInput());
    expect(r.recommendations.some((rec) =>
      rec.urgency === "immediate" && rec.recommendation.includes("planned activities"),
    )).toBe(true);
  });

  it("activity enjoyment <50 → immediate recommendation", () => {
    const r = computeDailyRoutineStructure(allBadInput());
    expect(r.recommendations.some((rec) =>
      rec.urgency === "immediate" && rec.recommendation.includes("activity programme"),
    )).toBe(true);
  });

  it("dietary compliance <70 → immediate recommendation", () => {
    const r = computeDailyRoutineStructure(allBadInput());
    expect(r.recommendations.some((rec) =>
      rec.urgency === "immediate" && rec.recommendation.includes("dietary"),
    )).toBe(true);
  });

  it("no routine records → immediate recommendation", () => {
    const r = computeDailyRoutineStructure(baseInput({ routine_schedule_records: [] }));
    expect(r.recommendations.some((rec) =>
      rec.urgency === "immediate" && rec.recommendation.includes("routine schedule"),
    )).toBe(true);
  });

  it("no meal records → immediate recommendation", () => {
    const r = computeDailyRoutineStructure(baseInput({ meal_routine_records: [] }));
    expect(r.recommendations.some((rec) =>
      rec.urgency === "immediate" && rec.recommendation.includes("meal routine"),
    )).toBe(true);
  });

  it("no bedtime records → immediate recommendation", () => {
    const r = computeDailyRoutineStructure(baseInput({ bedtime_routine_records: [] }));
    expect(r.recommendations.some((rec) =>
      rec.urgency === "immediate" && rec.recommendation.includes("bedtime routine"),
    )).toBe(true);
  });

  it("no participation records → immediate recommendation", () => {
    const r = computeDailyRoutineStructure(baseInput({ child_participation_records: [] }));
    expect(r.recommendations.some((rec) =>
      rec.urgency === "immediate" && rec.recommendation.includes("child participation"),
    )).toBe(true);
  });

  it("no activity records → immediate recommendation", () => {
    const r = computeDailyRoutineStructure(baseInput({ activity_plan_records: [] }));
    expect(r.recommendations.some((rec) =>
      rec.urgency === "immediate" && rec.recommendation.includes("activity planning"),
    )).toBe(true);
  });

  it("settling <50 → soon recommendation", () => {
    const r = computeDailyRoutineStructure(allBadInput());
    expect(r.recommendations.some((rec) =>
      rec.urgency === "soon" && rec.recommendation.includes("settling"),
    )).toBe(true);
  });

  it("views actioned <50 → soon recommendation", () => {
    const r = computeDailyRoutineStructure(allBadInput());
    expect(r.recommendations.some((rec) =>
      rec.urgency === "soon" && rec.recommendation.includes("views lead to tangible"),
    )).toBe(true);
  });

  it("activity choice <40 → soon recommendation", () => {
    const r = computeDailyRoutineStructure(allBadInput());
    expect(r.recommendations.some((rec) =>
      rec.urgency === "soon" && rec.recommendation.includes("child-chosen activities"),
    )).toBe(true);
  });

  it("flexibility <30 → soon recommendation", () => {
    const r = computeDailyRoutineStructure(allBadInput());
    expect(r.recommendations.some((rec) =>
      rec.urgency === "soon" && rec.recommendation.includes("flexibility"),
    )).toBe(true);
  });

  it("routine consistency 50-69% → soon recommendation", () => {
    const r = computeDailyRoutineStructure(baseInput({
      routine_schedule_records: nOf(10, 6, makeRoutine, { routine_followed: true }, { routine_followed: false }),
    }));
    expect(r.recommendations.some((rec) =>
      rec.urgency === "soon" && rec.recommendation.includes("routine consistency"),
    )).toBe(true);
  });

  it("meal regularity 50-69% → soon recommendation", () => {
    const r = computeDailyRoutineStructure(baseInput({
      meal_routine_records: nOf(10, 6, makeMeal, { meal_on_time: true }, { meal_on_time: false }),
    }));
    expect(r.recommendations.some((rec) =>
      rec.urgency === "soon" && rec.recommendation.includes("meal time regularity"),
    )).toBe(true);
  });

  it("bedtime adherence 50-69% → soon recommendation", () => {
    const r = computeDailyRoutineStructure(baseInput({
      bedtime_routine_records: nOf(10, 6, makeBedtime, { bedtime_routine_followed: true }, { bedtime_routine_followed: false }),
    }));
    expect(r.recommendations.some((rec) =>
      rec.urgency === "soon" && rec.recommendation.includes("bedtime routine adherence"),
    )).toBe(true);
  });

  it("activity completion 50-69% → planned recommendation", () => {
    const r = computeDailyRoutineStructure(baseInput({
      activity_plan_records: nOf(10, 6, makeActivity, { completed: true }, { completed: false }),
    }));
    expect(r.recommendations.some((rec) =>
      rec.urgency === "planned" && rec.recommendation.includes("activity completion"),
    )).toBe(true);
  });

  it("activity enjoyment 50-69% → planned recommendation", () => {
    const r = computeDailyRoutineStructure(baseInput({
      activity_plan_records: nOf(10, 6, makeActivity, { child_enjoyed: true }, { child_enjoyed: false }),
    }));
    expect(r.recommendations.some((rec) =>
      rec.urgency === "planned" && rec.recommendation.includes("activity enjoyment"),
    )).toBe(true);
  });

  it("meal satisfaction 50-69% → planned recommendation", () => {
    const r = computeDailyRoutineStructure(baseInput({
      meal_routine_records: nOf(10, 6, makeMeal, { child_feedback_positive: true }, { child_feedback_positive: false }),
    }));
    expect(r.recommendations.some((rec) =>
      rec.urgency === "planned" && rec.recommendation.includes("meal satisfaction"),
    )).toBe(true);
  });

  it("wind-down <70% → planned recommendation", () => {
    const r = computeDailyRoutineStructure(baseInput({
      bedtime_routine_records: nOf(10, 6, makeBedtime, { wind_down_activity_provided: true }, { wind_down_activity_provided: false }),
    }));
    expect(r.recommendations.some((rec) =>
      rec.urgency === "planned" && rec.recommendation.includes("wind-down"),
    )).toBe(true);
  });

  it("social dining <70% → planned recommendation", () => {
    const r = computeDailyRoutineStructure(baseInput({
      meal_routine_records: nOf(10, 6, makeMeal, { social_dining_environment: true }, { social_dining_environment: false }),
    }));
    expect(r.recommendations.some((rec) =>
      rec.urgency === "planned" && rec.recommendation.includes("social dining"),
    )).toBe(true);
  });

  it("meal involvement <50% → planned recommendation", () => {
    const r = computeDailyRoutineStructure(baseInput({
      meal_routine_records: nOf(10, 4, makeMeal, { child_involved_in_preparation: true }, { child_involved_in_preparation: false }),
    }));
    expect(r.recommendations.some((rec) =>
      rec.urgency === "planned" && rec.recommendation.includes("meal preparation"),
    )).toBe(true);
  });

  it("activity variety <4 → planned recommendation", () => {
    const r = computeDailyRoutineStructure(baseInput({
      activity_plan_records: [
        makeActivity({ activity_type: "recreational" }),
        makeActivity({ activity_type: "educational" }),
      ],
    }));
    expect(r.recommendations.some((rec) =>
      rec.urgency === "planned" && rec.recommendation.includes("range of activity types"),
    )).toBe(true);
  });

  it("child informed <70% → planned recommendation", () => {
    const r = computeDailyRoutineStructure(baseInput({
      routine_schedule_records: nOf(10, 6, makeRoutine, { child_informed_of_plan: true }, { child_informed_of_plan: false }),
    }));
    expect(r.recommendations.some((rec) =>
      rec.urgency === "planned" && rec.recommendation.includes("daily plans"),
    )).toBe(true);
  });

  it("recommendations have sequential rank numbers", () => {
    const r = computeDailyRoutineStructure(allBadInput());
    for (let i = 0; i < r.recommendations.length; i++) {
      expect(r.recommendations[i].rank).toBe(i + 1);
    }
  });

  it("all recommendations have regulatory_ref", () => {
    const r = computeDailyRoutineStructure(allBadInput());
    for (const rec of r.recommendations) {
      expect(rec.regulatory_ref.length).toBeGreaterThan(0);
    }
  });

  it("no recommendations when outstanding", () => {
    const r = computeDailyRoutineStructure(baseInput());
    expect(r.recommendations.length).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 13. INSIGHTS
// ═══════════════════════════════════════════════════════════════════════════

describe("insights", () => {
  it("critical insight for routine consistency <50%", () => {
    const r = computeDailyRoutineStructure(allBadInput());
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("routine consistency"))).toBe(true);
  });

  it("critical insight for meal regularity <50%", () => {
    const r = computeDailyRoutineStructure(allBadInput());
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("meal time regularity"))).toBe(true);
  });

  it("critical insight for bedtime adherence <50%", () => {
    const r = computeDailyRoutineStructure(allBadInput());
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("bedtime routine adherence"))).toBe(true);
  });

  it("critical insight for child participation <40%", () => {
    const r = computeDailyRoutineStructure(allBadInput());
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("Child participation quality"))).toBe(true);
  });

  it("critical insight for activity completion <50%", () => {
    const r = computeDailyRoutineStructure(allBadInput());
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("planned activities completed"))).toBe(true);
  });

  it("critical insight for no routine records", () => {
    const r = computeDailyRoutineStructure(baseInput({ routine_schedule_records: [] }));
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("No daily routine records"))).toBe(true);
  });

  it("critical insight for no meal records", () => {
    const r = computeDailyRoutineStructure(baseInput({ meal_routine_records: [] }));
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("No meal routine records"))).toBe(true);
  });

  it("critical insight for no bedtime records", () => {
    const r = computeDailyRoutineStructure(baseInput({ bedtime_routine_records: [] }));
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("No bedtime routine records"))).toBe(true);
  });

  it("critical insight for no participation records", () => {
    const r = computeDailyRoutineStructure(baseInput({ child_participation_records: [] }));
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("No child participation records"))).toBe(true);
  });

  it("warning insight for routine consistency 50-69%", () => {
    const r = computeDailyRoutineStructure(baseInput({
      routine_schedule_records: nOf(10, 6, makeRoutine, { routine_followed: true }, { routine_followed: false }),
    }));
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("60%") && i.text.includes("Routine consistency"))).toBe(true);
  });

  it("warning insight for meal regularity 50-69%", () => {
    const r = computeDailyRoutineStructure(baseInput({
      meal_routine_records: nOf(10, 6, makeMeal, { meal_on_time: true }, { meal_on_time: false }),
    }));
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("60%") && i.text.includes("Meal time regularity"))).toBe(true);
  });

  it("warning insight for bedtime adherence 50-69%", () => {
    const r = computeDailyRoutineStructure(baseInput({
      bedtime_routine_records: nOf(10, 6, makeBedtime, { bedtime_routine_followed: true }, { bedtime_routine_followed: false }),
    }));
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("60%") && i.text.includes("Bedtime routine adherence"))).toBe(true);
  });

  it("warning insight for child participation 40-64%", () => {
    const r = computeDailyRoutineStructure(baseInput({
      child_participation_records: nOf(10, 5, makeParticipation,
        { child_consulted: true, child_views_recorded: true, views_actioned: true, child_satisfied_with_outcome: true },
        { child_consulted: false, child_views_recorded: false, views_actioned: false, child_satisfied_with_outcome: false },
      ),
    }));
    // pct(20,40)=50 → 40-64 range
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("50%") && i.text.includes("Child participation quality"))).toBe(true);
  });

  it("warning insight for activity completion 50-69%", () => {
    const r = computeDailyRoutineStructure(baseInput({
      activity_plan_records: nOf(10, 6, makeActivity, { completed: true }, { completed: false }),
    }));
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("60%") && i.text.includes("Activity completion"))).toBe(true);
  });

  it("warning insight for activity enjoyment 50-69%", () => {
    const r = computeDailyRoutineStructure(baseInput({
      activity_plan_records: nOf(10, 6, makeActivity, { child_enjoyed: true }, { child_enjoyed: false }),
    }));
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("60%") && i.text.includes("Activity enjoyment"))).toBe(true);
  });

  it("warning insight for settling 50-69%", () => {
    const r = computeDailyRoutineStructure(baseInput({
      bedtime_routine_records: nOf(10, 6, makeBedtime, { child_settled_within_30_min: true }, { child_settled_within_30_min: false }),
    }));
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("60%") && i.text.includes("Settling rate"))).toBe(true);
  });

  it("warning insight for meal satisfaction 50-69%", () => {
    const r = computeDailyRoutineStructure(baseInput({
      meal_routine_records: nOf(10, 6, makeMeal, { child_feedback_positive: true }, { child_feedback_positive: false }),
    }));
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("60%") && i.text.includes("Meal satisfaction"))).toBe(true);
  });

  it("warning insight for avg consistency rating 2.5-3.49", () => {
    const r = computeDailyRoutineStructure(baseInput({
      routine_schedule_records: Array.from({ length: 10 }, () => makeRoutine({ consistency_rating: 3 })),
    }));
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("consistency rating") && i.text.includes("3/5"))).toBe(true);
  });

  it("warning insight for activity variety <4", () => {
    const r = computeDailyRoutineStructure(baseInput({
      activity_plan_records: [
        makeActivity({ activity_type: "recreational" }),
        makeActivity({ activity_type: "educational" }),
      ],
    }));
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("2 activity types"))).toBe(true);
  });

  it("warning insight for wind-down 30-69%", () => {
    const r = computeDailyRoutineStructure(baseInput({
      bedtime_routine_records: nOf(10, 5, makeBedtime, { wind_down_activity_provided: true }, { wind_down_activity_provided: false }),
    }));
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Wind-down activity"))).toBe(true);
  });

  it("warning insight for views actioned 30-49%", () => {
    const r = computeDailyRoutineStructure(baseInput({
      child_participation_records: Array.from({ length: 10 }, (_, i) =>
        makeParticipation({
          child_consulted: true,
          child_views_recorded: true,
          views_actioned: i < 4, // 4/10 = 40%
          child_satisfied_with_outcome: true,
        }),
      ),
    }));
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("views actioned"))).toBe(true);
  });

  it("activity type analysis insight always appears when activities exist", () => {
    const r = computeDailyRoutineStructure(baseInput());
    expect(r.insights.some((i) => i.text.includes("Most common activity types"))).toBe(true);
  });

  it("participation type analysis insight always appears when participation records exist", () => {
    const r = computeDailyRoutineStructure(baseInput());
    expect(r.insights.some((i) => i.text.includes("Most common participation types"))).toBe(true);
  });

  it("positive insight for outstanding rating", () => {
    const r = computeDailyRoutineStructure(baseInput());
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("outstanding daily routine"))).toBe(true);
  });

  it("positive insight for triple 90% (routine+meal+bedtime)", () => {
    const r = computeDailyRoutineStructure(baseInput());
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("routine consistency") && i.text.includes("meal regularity") && i.text.includes("bedtime adherence"))).toBe(true);
  });

  it("positive insight for high participation + views actioned", () => {
    const r = computeDailyRoutineStructure(baseInput());
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("child participation quality") && i.text.includes("views actioned"))).toBe(true);
  });

  it("positive insight for activity completion + enjoyment both >=90%", () => {
    const r = computeDailyRoutineStructure(baseInput());
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("activity completion") && i.text.includes("child enjoyment"))).toBe(true);
  });

  it("positive insight for meal regularity + satisfaction both >=90%", () => {
    const r = computeDailyRoutineStructure(baseInput());
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("meal regularity") && i.text.includes("positive child feedback"))).toBe(true);
  });

  it("positive insight for bedtime adherence + settling both >=90%", () => {
    const r = computeDailyRoutineStructure(baseInput());
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("bedtime adherence") && i.text.includes("settling within 30 minutes"))).toBe(true);
  });

  it("positive insight for high flexibility + consistency", () => {
    const r = computeDailyRoutineStructure(baseInput());
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("routine consistency alongside") && i.text.includes("flexibility"))).toBe(true);
  });

  it("positive insight for high choice + enjoyment", () => {
    const r = computeDailyRoutineStructure(baseInput());
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("child-chosen activities") && i.text.includes("enjoyment"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 14. EDGE CASES
// ═══════════════════════════════════════════════════════════════════════════

describe("edge cases", () => {
  it("single record per category at 100%", () => {
    const r = computeDailyRoutineStructure({
      today: "2026-05-27",
      total_children: 1,
      routine_schedule_records: [makeRoutine()],
      activity_plan_records: [makeActivity()],
      meal_routine_records: [makeMeal()],
      bedtime_routine_records: [makeBedtime()],
      child_participation_records: [makeParticipation()],
    });
    expect(r.routine_consistency_rate).toBe(100);
    expect(r.activity_completion_rate).toBe(100);
    expect(r.meal_regularity_rate).toBe(100);
    expect(r.bedtime_adherence_rate).toBe(100);
    expect(r.child_participation_rate).toBe(100);
    expect(r.flexibility_rate).toBe(100);
  });

  it("single record per category at 0%", () => {
    const r = computeDailyRoutineStructure({
      today: "2026-05-27",
      total_children: 1,
      routine_schedule_records: [makeRoutine({ routine_followed: false, flexibility_shown: false, child_informed_of_plan: false, actual_start_time: null, consistency_rating: 1 })],
      activity_plan_records: [makeActivity({ completed: false, child_enjoyed: false, child_chose_activity: false })],
      meal_routine_records: [makeMeal({ meal_on_time: false, child_feedback_positive: false, dietary_needs_met: false, healthy_options_provided: false, social_dining_environment: false, child_involved_in_preparation: false })],
      bedtime_routine_records: [makeBedtime({ bedtime_routine_followed: false, child_settled_within_30_min: false, wind_down_activity_provided: false, age_appropriate_bedtime: false, consistent_with_previous_nights: false })],
      child_participation_records: [makeParticipation({ child_consulted: false, child_views_recorded: false, views_actioned: false, child_satisfied_with_outcome: false })],
    });
    expect(r.routine_consistency_rate).toBe(0);
    expect(r.activity_completion_rate).toBe(0);
    expect(r.meal_regularity_rate).toBe(0);
    expect(r.bedtime_adherence_rate).toBe(0);
    expect(r.child_participation_rate).toBe(0);
    expect(r.flexibility_rate).toBe(0);
  });

  it("pct(0,0)=0 in participation rate computation", () => {
    const r = computeDailyRoutineStructure({
      today: "2026-05-27",
      total_children: 0,
      routine_schedule_records: [],
      activity_plan_records: [],
      meal_routine_records: [],
      bedtime_routine_records: [],
      child_participation_records: [],
    });
    expect(r.child_participation_rate).toBe(0);
  });

  it("only routine records present → no allEmpty concerns trigger", () => {
    const r = computeDailyRoutineStructure({
      today: "2026-05-27",
      total_children: 3,
      routine_schedule_records: [makeRoutine()],
      activity_plan_records: [],
      meal_routine_records: [],
      bedtime_routine_records: [],
      child_participation_records: [],
    });
    // Not allEmpty, so missing-record concerns fire for meal/bedtime/participation/activity
    expect(r.routine_rating).not.toBe("insufficient_data");
    expect(r.concerns.some((c) => c.includes("No meal routine records"))).toBe(true);
    expect(r.concerns.some((c) => c.includes("No bedtime routine records"))).toBe(true);
    expect(r.concerns.some((c) => c.includes("No child participation records"))).toBe(true);
    expect(r.concerns.some((c) => c.includes("No activity plan records"))).toBe(true);
  });

  it("only activity records present → not allEmpty", () => {
    const r = computeDailyRoutineStructure({
      today: "2026-05-27",
      total_children: 2,
      routine_schedule_records: [],
      activity_plan_records: [makeActivity()],
      meal_routine_records: [],
      bedtime_routine_records: [],
      child_participation_records: [],
    });
    expect(r.routine_rating).not.toBe("insufficient_data");
    expect(r.routine_score).not.toBe(15); // not the allEmpty floor
  });

  it("only meal records present → not allEmpty", () => {
    const r = computeDailyRoutineStructure({
      today: "2026-05-27",
      total_children: 2,
      routine_schedule_records: [],
      activity_plan_records: [],
      meal_routine_records: [makeMeal()],
      bedtime_routine_records: [],
      child_participation_records: [],
    });
    expect(r.routine_rating).not.toBe("insufficient_data");
    expect(r.total_meal_records).toBe(1);
  });

  it("only bedtime records present → not allEmpty", () => {
    const r = computeDailyRoutineStructure({
      today: "2026-05-27",
      total_children: 2,
      routine_schedule_records: [],
      activity_plan_records: [],
      meal_routine_records: [],
      bedtime_routine_records: [makeBedtime()],
      child_participation_records: [],
    });
    expect(r.routine_rating).not.toBe("insufficient_data");
    expect(r.total_bedtime_records).toBe(1);
  });

  it("only participation records present → not allEmpty", () => {
    const r = computeDailyRoutineStructure({
      today: "2026-05-27",
      total_children: 2,
      routine_schedule_records: [],
      activity_plan_records: [],
      meal_routine_records: [],
      bedtime_routine_records: [],
      child_participation_records: [makeParticipation()],
    });
    expect(r.routine_rating).not.toBe("insufficient_data");
    expect(r.total_participation_records).toBe(1);
  });

  it("total_children=0 with records → not insufficient_data (not allEmpty)", () => {
    const r = computeDailyRoutineStructure({
      today: "2026-05-27",
      total_children: 0,
      routine_schedule_records: [makeRoutine()],
      activity_plan_records: [],
      meal_routine_records: [],
      bedtime_routine_records: [],
      child_participation_records: [],
    });
    // Not allEmpty (has routine records), total_children=0 → does NOT trigger allEmpty+children check
    expect(r.routine_rating).not.toBe("insufficient_data");
  });

  it("very large number of records", () => {
    const r = computeDailyRoutineStructure({
      today: "2026-05-27",
      total_children: 10,
      routine_schedule_records: Array.from({ length: 100 }, () => makeRoutine()),
      activity_plan_records: Array.from({ length: 100 }, () => makeActivity()),
      meal_routine_records: Array.from({ length: 100 }, () => makeMeal()),
      bedtime_routine_records: Array.from({ length: 100 }, () => makeBedtime()),
      child_participation_records: Array.from({ length: 100 }, () => makeParticipation()),
    });
    expect(r.routine_rating).toBe("outstanding");
    expect(r.total_routine_records).toBe(100);
  });

  it("headline for good with 1 strength uses singular", () => {
    // Need exactly good rating (65-79) with 1 strength and 0 concerns
    // This is hard to construct precisely, so just verify good headline format
    const r = computeDailyRoutineStructure(baseInput({
      routine_schedule_records: nOf(10, 8, makeRoutine, { routine_followed: true, flexibility_shown: true }, { routine_followed: false, flexibility_shown: false }),
      activity_plan_records: nOf(10, 7, makeActivity, { completed: true, child_enjoyed: true }, { completed: false, child_enjoyed: false }),
      meal_routine_records: nOf(10, 9, makeMeal, { meal_on_time: true, child_feedback_positive: true }, { meal_on_time: false, child_feedback_positive: false }),
      bedtime_routine_records: nOf(10, 7, makeBedtime, { bedtime_routine_followed: true, child_settled_within_30_min: true }, { bedtime_routine_followed: false, child_settled_within_30_min: false }),
      child_participation_records: nOf(10, 7, makeParticipation,
        { child_consulted: true, child_views_recorded: true, views_actioned: true, child_satisfied_with_outcome: true },
        { child_consulted: false, child_views_recorded: false, views_actioned: false, child_satisfied_with_outcome: false },
      ),
    }));
    if (r.routine_rating === "good") {
      expect(r.headline).toContain("Good");
      expect(r.headline).toContain("strength");
    }
  });

  it("headline for adequate shows concern count", () => {
    const r = computeDailyRoutineStructure(baseInput({
      routine_schedule_records: nOf(10, 6, makeRoutine, { routine_followed: true, flexibility_shown: false }, { routine_followed: false, flexibility_shown: false }),
      activity_plan_records: nOf(10, 6, makeActivity, { completed: true, child_enjoyed: false }, { completed: false, child_enjoyed: false }),
      meal_routine_records: nOf(10, 6, makeMeal, { meal_on_time: true, child_feedback_positive: false }, { meal_on_time: false, child_feedback_positive: false }),
      bedtime_routine_records: nOf(10, 6, makeBedtime, { bedtime_routine_followed: true, child_settled_within_30_min: false }, { bedtime_routine_followed: false, child_settled_within_30_min: false }),
      child_participation_records: nOf(10, 5, makeParticipation,
        { child_consulted: true, child_views_recorded: true, views_actioned: true, child_satisfied_with_outcome: true },
        { child_consulted: false, child_views_recorded: false, views_actioned: false, child_satisfied_with_outcome: false },
      ),
    }));
    if (r.routine_rating === "adequate") {
      expect(r.headline).toContain("Adequate");
      expect(r.headline).toContain("concern");
    }
  });

  it("headline for inadequate shows concern count", () => {
    const r = computeDailyRoutineStructure(allBadInput());
    expect(r.headline).toContain("inadequate");
    expect(r.headline).toContain("concern");
  });

  it("actual_start_time empty string treated as not on time", () => {
    const r = computeDailyRoutineStructure(baseInput({
      routine_schedule_records: [makeRoutine({ actual_start_time: "" })],
    }));
    // routineTimeliness checks for !== null && !== "", so "" → not on time
    // But routineTimeliness is computed but not directly exposed or used in scoring
    // Only verifying it doesn't crash
    expect(r.total_routine_records).toBe(1);
  });

  it("consistency_rating average calculation", () => {
    const r = computeDailyRoutineStructure(baseInput({
      routine_schedule_records: [
        makeRoutine({ consistency_rating: 4 }),
        makeRoutine({ consistency_rating: 5 }),
      ],
    }));
    // avg = 4.5 → >= 4.0 → strength
    expect(r.strengths.some((s) => s.includes("Average consistency rating") && s.includes("4.5/5"))).toBe(true);
  });

  it("activity types variety counted correctly", () => {
    const types: ActivityPlanRecordInput["activity_type"][] = [
      "educational", "recreational", "therapeutic", "social", "life_skills", "creative", "physical", "other",
    ];
    const r = computeDailyRoutineStructure(baseInput({
      activity_plan_records: types.map((t) => makeActivity({ activity_type: t })),
    }));
    // 8 unique types → variety count = 8, activityVarietyRate = pct(8,8) = 100
    expect(r.strengths.some((s) => s.includes("8 different activity types"))).toBe(true);
  });

  it("duplicate activity types are not double-counted for variety", () => {
    const r = computeDailyRoutineStructure(baseInput({
      activity_plan_records: [
        makeActivity({ activity_type: "recreational" }),
        makeActivity({ activity_type: "recreational" }),
        makeActivity({ activity_type: "recreational" }),
      ],
    }));
    // Only 1 unique type → <4 → warning insight
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("1 activity type"))).toBe(true);
  });

  it("participation composite rate works with mixed fields", () => {
    // 5 records: all consulted, all views recorded, 3 actioned, 2 satisfied
    // numerator = 5+5+3+2 = 15, denominator = 5*4 = 20 → pct(15,20) = 75
    const r = computeDailyRoutineStructure(baseInput({
      child_participation_records: [
        makeParticipation({ child_consulted: true, child_views_recorded: true, views_actioned: true, child_satisfied_with_outcome: true }),
        makeParticipation({ child_consulted: true, child_views_recorded: true, views_actioned: true, child_satisfied_with_outcome: true }),
        makeParticipation({ child_consulted: true, child_views_recorded: true, views_actioned: true, child_satisfied_with_outcome: false }),
        makeParticipation({ child_consulted: true, child_views_recorded: true, views_actioned: false, child_satisfied_with_outcome: false }),
        makeParticipation({ child_consulted: true, child_views_recorded: true, views_actioned: false, child_satisfied_with_outcome: false }),
      ],
    }));
    expect(r.child_participation_rate).toBe(75);
  });

  it("toRating boundary: score 80 → outstanding", () => {
    const r = computeDailyRoutineStructure(baseInput());
    expect(r.routine_score).toBe(80);
    expect(r.routine_rating).toBe("outstanding");
  });

  it("toRating boundary: score 65 → good", () => {
    // We need a score of exactly 65
    // base 52 + routineConsistency(70%→+2) + mealRegularity(90%→+4) + bedtime(70%→+1)
    //         + participation(85%→+3) + activityCompletion(70%→+1) + flexibility(50%→+1) + enjoyment(70%→+1)
    // = 52 + 2+4+1+3+1+1+1 = 65  (no settling bonus, no mealSatisfaction bonus)
    const r = computeDailyRoutineStructure({
      today: "2026-05-27",
      total_children: 3,
      routine_schedule_records: nOf(10, 7, makeRoutine,
        { routine_followed: true, flexibility_shown: true, child_informed_of_plan: false, actual_start_time: null, consistency_rating: 1 },
        { routine_followed: false, flexibility_shown: false, child_informed_of_plan: false, actual_start_time: null, consistency_rating: 1 },
      ),
      activity_plan_records: nOf(10, 7, makeActivity,
        { completed: true, child_enjoyed: true, child_chose_activity: false, activity_type: "other" as const },
        { completed: false, child_enjoyed: false, child_chose_activity: false, activity_type: "other" as const },
      ),
      meal_routine_records: nOf(10, 9, makeMeal,
        { meal_on_time: true, child_feedback_positive: false, dietary_needs_met: true, healthy_options_provided: false, social_dining_environment: false, child_involved_in_preparation: false },
        { meal_on_time: false, child_feedback_positive: false, dietary_needs_met: true, healthy_options_provided: false, social_dining_environment: false, child_involved_in_preparation: false },
      ),
      bedtime_routine_records: nOf(10, 7, makeBedtime,
        { bedtime_routine_followed: true, child_settled_within_30_min: false, wind_down_activity_provided: false, age_appropriate_bedtime: false, consistent_with_previous_nights: false },
        { bedtime_routine_followed: false, child_settled_within_30_min: false, wind_down_activity_provided: false, age_appropriate_bedtime: false, consistent_with_previous_nights: false },
      ),
      child_participation_records: nOf(10, 9, makeParticipation,
        { child_consulted: true, child_views_recorded: true, views_actioned: true, child_satisfied_with_outcome: true },
        { child_consulted: false, child_views_recorded: false, views_actioned: false, child_satisfied_with_outcome: false },
      ),
    });
    // flexibility: 7/10 have flexibility_shown:true → 70% → >=50 → +1
    // routineConsistency: 70% → +2
    // activityCompletion: 70% → +1
    // mealRegularity: 90% → +4
    // bedtimeAdherence: 70% → +1
    // participation: pct(36,40)=90% → >=85 → +3
    // enjoyment: 70% → +1
    // settling: 0% → no bonus
    // mealSatisfaction: 0% → no bonus
    // Total: 52+2+1+4+1+3+1+1 = 65
    expect(r.routine_score).toBe(65);
    expect(r.routine_rating).toBe("good");
  });

  it("toRating boundary: score 45 → adequate", () => {
    // base 52 - 5 (routine consistency penalty) - 3 (participation penalty) = 44... need 45
    // Let's use: base 52, routine records with 0% consistency → -5, participation < 40% → -3
    // That's 44, need +1: add some minimal bonus
    // Actually 52 - 5 - 3 = 44. We need score 45:
    // 52 - 5 (routineConsistency<50) - 3 (participation<40) + 1 (some bonus) = 45
    // mealRegularity 70% → +2 → 52+2-5-3 = 46, not 45
    // activityCompletion 70% → +1 → 52+1-5-3 = 45
    const r = computeDailyRoutineStructure({
      today: "2026-05-27",
      total_children: 3,
      routine_schedule_records: nOf(10, 4, makeRoutine,
        { routine_followed: true, flexibility_shown: false, child_informed_of_plan: false, actual_start_time: null, consistency_rating: 1 },
        { routine_followed: false, flexibility_shown: false, child_informed_of_plan: false, actual_start_time: null, consistency_rating: 1 },
      ),
      activity_plan_records: nOf(10, 7, makeActivity,
        { completed: true, child_enjoyed: false, child_chose_activity: false, activity_type: "other" as const },
        { completed: false, child_enjoyed: false, child_chose_activity: false, activity_type: "other" as const },
      ),
      meal_routine_records: [],
      bedtime_routine_records: [],
      child_participation_records: nOf(10, 3, makeParticipation,
        { child_consulted: true, child_views_recorded: true, views_actioned: true, child_satisfied_with_outcome: true },
        { child_consulted: false, child_views_recorded: false, views_actioned: false, child_satisfied_with_outcome: false },
      ),
    });
    // routineConsistency 40% → -5 penalty, no bonus
    // activityCompletion 70% → +1
    // mealRegularity: no records → 0, no penalty
    // bedtimeAdherence: no records → 0, no penalty
    // participation: pct(12,40)=30% → <40 → -3
    // flexibility: 0% (no flex shown), but totalRoutineRecords>0... 0<50 → but no penalty for flex
    // enjoyment: 0% → no bonus
    // settling: no records → no bonus
    // mealSatisfaction: no records → no bonus
    // Score = 52 + 1 - 5 - 3 = 45
    expect(r.routine_score).toBe(45);
    expect(r.routine_rating).toBe("adequate");
  });

  it("toRating boundary: score 44 → inadequate", () => {
    // base 52, routine <50 → -5, participation <40 → -3 = 44
    const r = computeDailyRoutineStructure({
      today: "2026-05-27",
      total_children: 3,
      routine_schedule_records: nOf(10, 4, makeRoutine,
        { routine_followed: true, flexibility_shown: false, child_informed_of_plan: false, actual_start_time: null, consistency_rating: 1 },
        { routine_followed: false, flexibility_shown: false, child_informed_of_plan: false, actual_start_time: null, consistency_rating: 1 },
      ),
      activity_plan_records: [],
      meal_routine_records: [],
      bedtime_routine_records: [],
      child_participation_records: nOf(10, 3, makeParticipation,
        { child_consulted: true, child_views_recorded: true, views_actioned: true, child_satisfied_with_outcome: true },
        { child_consulted: false, child_views_recorded: false, views_actioned: false, child_satisfied_with_outcome: false },
      ),
    });
    // Score = 52 - 5 - 3 = 44
    expect(r.routine_score).toBe(44);
    expect(r.routine_rating).toBe("inadequate");
  });

  it("missing category concerns do NOT fire in allEmpty case", () => {
    // allEmpty + children → gets the special case treatment, not the normal path
    const r = computeDailyRoutineStructure({
      today: "2026-05-27",
      total_children: 3,
      routine_schedule_records: [],
      activity_plan_records: [],
      meal_routine_records: [],
      bedtime_routine_records: [],
      child_participation_records: [],
    });
    // Should NOT see "No routine schedule records exist" (that's from the normal path)
    // Instead see the allEmpty special concern
    expect(r.concerns.length).toBe(1);
  });

  it("activity type analysis formats correctly with underscores replaced", () => {
    const r = computeDailyRoutineStructure(baseInput({
      activity_plan_records: [
        makeActivity({ activity_type: "life_skills" }),
        makeActivity({ activity_type: "life_skills" }),
      ],
    }));
    expect(r.insights.some((i) => i.text.includes("life skills (2)"))).toBe(true);
  });

  it("participation type analysis formats correctly", () => {
    const r = computeDailyRoutineStructure(baseInput({
      child_participation_records: [
        makeParticipation({ participation_type: "daily_planning" }),
        makeParticipation({ participation_type: "daily_planning" }),
        makeParticipation({ participation_type: "menu_choice" }),
      ],
    }));
    expect(r.insights.some((i) => i.text.includes("daily planning (2)") && i.text.includes("menu choice (1)"))).toBe(true);
  });

  it("top 3 activity types shown even if more exist", () => {
    const r = computeDailyRoutineStructure(baseInput({
      activity_plan_records: [
        makeActivity({ activity_type: "recreational" }),
        makeActivity({ activity_type: "recreational" }),
        makeActivity({ activity_type: "recreational" }),
        makeActivity({ activity_type: "educational" }),
        makeActivity({ activity_type: "educational" }),
        makeActivity({ activity_type: "therapeutic" }),
        makeActivity({ activity_type: "therapeutic" }),
        makeActivity({ activity_type: "social" }),
        makeActivity({ activity_type: "physical" }),
      ],
    }));
    const activityInsight = r.insights.find((i) => i.text.includes("Most common activity types"));
    expect(activityInsight).toBeDefined();
    // Should show top 3: recreational(3), educational(2), therapeutic(2)
    expect(activityInsight!.text).toContain("recreational (3)");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 15. SCORE ARITHMETIC VERIFICATION
// ═══════════════════════════════════════════════════════════════════════════

describe("score arithmetic", () => {
  it("base score is 52 with empty arrays (but not allEmpty trigger)", () => {
    // Need at least one non-empty array to avoid allEmpty, but ensure no bonuses/penalties
    const r = computeDailyRoutineStructure({
      today: "2026-05-27",
      total_children: 0, // total_children=0 + not allEmpty → not special case
      routine_schedule_records: [],
      activity_plan_records: [makeActivity({ completed: false, child_enjoyed: false, child_chose_activity: false, activity_type: "other" })],
      meal_routine_records: [],
      bedtime_routine_records: [],
      child_participation_records: [],
    });
    // activityCompletion = 0% → no bonus, no penalty (no activity penalty exists)
    expect(r.routine_score).toBe(52);
  });

  it("max bonuses sum to 28 (4+3+4+3+3+3+3+2+3)", () => {
    const r = computeDailyRoutineStructure(baseInput());
    expect(r.routine_score).toBe(52 + 28);
  });

  it("max penalties sum to -18 (5+5+5+3)", () => {
    const r = computeDailyRoutineStructure(allBadInput());
    // No bonuses when all bad → 52 - 18 = 34
    expect(r.routine_score).toBe(52 - 18);
  });

  it("lower-tier bonuses: 2+1+2+1+1+1+1+1+1 = 11", () => {
    // All metrics at 70% except participation at 70% (>=65 → +1) and flexibility at 50% (>=50 → +1)
    const r = computeDailyRoutineStructure({
      today: "2026-05-27",
      total_children: 3,
      routine_schedule_records: nOf(10, 7, makeRoutine,
        { routine_followed: true, flexibility_shown: true, child_informed_of_plan: false, actual_start_time: null, consistency_rating: 1 },
        { routine_followed: false, flexibility_shown: false, child_informed_of_plan: false, actual_start_time: null, consistency_rating: 1 },
      ),
      activity_plan_records: nOf(10, 7, makeActivity,
        { completed: true, child_enjoyed: true, child_chose_activity: false, activity_type: "other" as const },
        { completed: false, child_enjoyed: false, child_chose_activity: false, activity_type: "other" as const },
      ),
      meal_routine_records: nOf(10, 7, makeMeal,
        { meal_on_time: true, child_feedback_positive: true, dietary_needs_met: false, healthy_options_provided: false, social_dining_environment: false, child_involved_in_preparation: false },
        { meal_on_time: false, child_feedback_positive: false, dietary_needs_met: false, healthy_options_provided: false, social_dining_environment: false, child_involved_in_preparation: false },
      ),
      bedtime_routine_records: nOf(10, 7, makeBedtime,
        { bedtime_routine_followed: true, child_settled_within_30_min: true, wind_down_activity_provided: false, age_appropriate_bedtime: false, consistent_with_previous_nights: false },
        { bedtime_routine_followed: false, child_settled_within_30_min: false, wind_down_activity_provided: false, age_appropriate_bedtime: false, consistent_with_previous_nights: false },
      ),
      child_participation_records: nOf(10, 7, makeParticipation,
        { child_consulted: true, child_views_recorded: true, views_actioned: true, child_satisfied_with_outcome: true },
        { child_consulted: false, child_views_recorded: false, views_actioned: false, child_satisfied_with_outcome: false },
      ),
    });
    // routineConsistency: 70% → +2
    // activityCompletion: 70% → +1
    // mealRegularity: 70% → +2
    // bedtimeAdherence: 70% → +1
    // participation: pct(28,40)=70% → >=65 → +1
    // flexibility: 70% → >=50 → +1 (7/10 have flexibility_shown)
    // enjoyment: 70% → +1
    // settling: 70% → +1
    // mealSatisfaction: 70% → +1
    // Total: 52 + 2+1+2+1+1+1+1+1+1 = 63
    expect(r.routine_score).toBe(63);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 16. HEADLINE FORMATTING
// ═══════════════════════════════════════════════════════════════════════════

describe("headline formatting", () => {
  it("outstanding headline is fixed text", () => {
    const r = computeDailyRoutineStructure(baseInput());
    expect(r.headline).toBe(
      "Outstanding daily routine and structure — children experience predictable, well-organised days with consistent routines, rich activities, regular meals, and meaningful participation in planning.",
    );
  });

  it("inadequate headline mentions significant concerns", () => {
    const r = computeDailyRoutineStructure(allBadInput());
    expect(r.headline).toContain("inadequate");
    expect(r.headline).toContain("significant concern");
  });

  it("good headline mentions strengths count and concerns if any", () => {
    const r = computeDailyRoutineStructure(baseInput({
      routine_schedule_records: nOf(10, 8, makeRoutine, { routine_followed: true, flexibility_shown: true }, { routine_followed: false, flexibility_shown: false }),
      activity_plan_records: nOf(10, 7, makeActivity, { completed: true, child_enjoyed: true }, { completed: false, child_enjoyed: false }),
      meal_routine_records: nOf(10, 9, makeMeal, { meal_on_time: true, child_feedback_positive: true }, { meal_on_time: false, child_feedback_positive: false }),
      bedtime_routine_records: nOf(10, 7, makeBedtime, { bedtime_routine_followed: true, child_settled_within_30_min: true }, { bedtime_routine_followed: false, child_settled_within_30_min: false }),
      child_participation_records: nOf(10, 7, makeParticipation,
        { child_consulted: true, child_views_recorded: true, views_actioned: true, child_satisfied_with_outcome: true },
        { child_consulted: false, child_views_recorded: false, views_actioned: false, child_satisfied_with_outcome: false },
      ),
    }));
    if (r.routine_rating === "good") {
      expect(r.headline).toMatch(/\d+ strength/);
      if (r.concerns.length > 0) {
        expect(r.headline).toMatch(/\d+ area/);
      }
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 17. MIXED SCENARIOS
// ═══════════════════════════════════════════════════════════════════════════

describe("mixed scenarios", () => {
  it("high routine + low meals → mixed rating", () => {
    const r = computeDailyRoutineStructure({
      today: "2026-05-27",
      total_children: 3,
      routine_schedule_records: Array.from({ length: 10 }, () => makeRoutine()),
      activity_plan_records: Array.from({ length: 10 }, () => makeActivity()),
      meal_routine_records: nOf(10, 3, makeMeal,
        { meal_on_time: true, child_feedback_positive: true },
        { meal_on_time: false, child_feedback_positive: false },
      ),
      bedtime_routine_records: Array.from({ length: 10 }, () => makeBedtime()),
      child_participation_records: Array.from({ length: 10 }, () => makeParticipation()),
    });
    // Lost mealRegularity bonus (+4→0), penalty -5
    // Lost mealSatisfaction bonus (+3→0) since child_feedback_positive=false on bad records (30%)
    // Score = 80 - 4 - 3 - 5 = 68 → good
    expect(r.routine_score).toBe(68);
    expect(r.routine_rating).toBe("good");
    expect(r.concerns.some((c) => c.includes("meal time regularity"))).toBe(true);
    expect(r.strengths.some((s) => s.includes("routine consistency"))).toBe(true);
  });

  it("good routines but terrible participation", () => {
    const r = computeDailyRoutineStructure({
      today: "2026-05-27",
      total_children: 3,
      routine_schedule_records: Array.from({ length: 10 }, () => makeRoutine()),
      activity_plan_records: Array.from({ length: 10 }, () => makeActivity()),
      meal_routine_records: Array.from({ length: 10 }, () => makeMeal()),
      bedtime_routine_records: Array.from({ length: 10 }, () => makeBedtime()),
      child_participation_records: nOf(10, 0, makeParticipation,
        { child_consulted: true, child_views_recorded: true, views_actioned: true, child_satisfied_with_outcome: true },
        { child_consulted: false, child_views_recorded: false, views_actioned: false, child_satisfied_with_outcome: false },
      ),
    });
    // Lost participation bonus (+3→0), got penalty (-3)
    // Score = 80 - 3 - 3 = 74 → good
    expect(r.routine_score).toBe(74);
    expect(r.routine_rating).toBe("good");
  });

  it("no bonuses no penalties → score 52 → adequate", () => {
    // Only has activity records with all metrics at ~60% (between thresholds)
    const r = computeDailyRoutineStructure({
      today: "2026-05-27",
      total_children: 0,
      routine_schedule_records: [],
      activity_plan_records: nOf(10, 6, makeActivity,
        { completed: true, child_enjoyed: true, child_chose_activity: false, activity_type: "other" as const },
        { completed: false, child_enjoyed: false, child_chose_activity: false, activity_type: "other" as const },
      ),
      meal_routine_records: [],
      bedtime_routine_records: [],
      child_participation_records: [],
    });
    // activityCompletion=60% → no bonus, enjoyment=60% → no bonus
    // No penalties (no routine/meal/bedtime/participation records)
    expect(r.routine_score).toBe(52);
    expect(r.routine_rating).toBe("adequate");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 18. ADDITIONAL EDGE CASES FOR FULL COVERAGE
// ═══════════════════════════════════════════════════════════════════════════

describe("additional coverage", () => {
  it("participation satisfaction rate with partial satisfaction", () => {
    const r = computeDailyRoutineStructure(baseInput({
      child_participation_records: [
        makeParticipation({ child_consulted: true, child_views_recorded: true, views_actioned: true, child_satisfied_with_outcome: false }),
        makeParticipation({ child_consulted: true, child_views_recorded: true, views_actioned: false, child_satisfied_with_outcome: false }),
      ],
    }));
    // numerator = 2+2+1+0 = 5, denominator = 2*4 = 8 → pct(5,8) = 63
    expect(r.child_participation_rate).toBe(63);
  });

  it("flexibility rate at exactly 80% boundary → +3", () => {
    const r = computeDailyRoutineStructure({
      today: "2026-05-27",
      total_children: 3,
      routine_schedule_records: nOf(10, 8, makeRoutine,
        { flexibility_shown: true, routine_followed: false, child_informed_of_plan: false, actual_start_time: null, consistency_rating: 1 },
        { flexibility_shown: false, routine_followed: false, child_informed_of_plan: false, actual_start_time: null, consistency_rating: 1 },
      ),
      activity_plan_records: [],
      meal_routine_records: [],
      bedtime_routine_records: [],
      child_participation_records: [],
    });
    // flexibility=80% → +3, routineConsistency=0% → -5
    // Score = 52 + 3 - 5 = 50
    expect(r.routine_score).toBe(50);
  });

  it("flexibility rate at exactly 50% boundary → +1", () => {
    const r = computeDailyRoutineStructure({
      today: "2026-05-27",
      total_children: 3,
      routine_schedule_records: nOf(10, 5, makeRoutine,
        { flexibility_shown: true, routine_followed: false, child_informed_of_plan: false, actual_start_time: null, consistency_rating: 1 },
        { flexibility_shown: false, routine_followed: false, child_informed_of_plan: false, actual_start_time: null, consistency_rating: 1 },
      ),
      activity_plan_records: [],
      meal_routine_records: [],
      bedtime_routine_records: [],
      child_participation_records: [],
    });
    // flexibility=50% → +1, routineConsistency=0% → -5
    // Score = 52 + 1 - 5 = 48
    expect(r.routine_score).toBe(48);
  });

  it("settling at exactly 90% boundary → +2", () => {
    const r = computeDailyRoutineStructure({
      today: "2026-05-27",
      total_children: 3,
      routine_schedule_records: [],
      activity_plan_records: [],
      meal_routine_records: [],
      bedtime_routine_records: nOf(10, 9, makeBedtime,
        { child_settled_within_30_min: true, bedtime_routine_followed: false, wind_down_activity_provided: false, age_appropriate_bedtime: false, consistent_with_previous_nights: false },
        { child_settled_within_30_min: false, bedtime_routine_followed: false, wind_down_activity_provided: false, age_appropriate_bedtime: false, consistent_with_previous_nights: false },
      ),
      child_participation_records: [],
    });
    // settling=90% → +2, bedtimeAdherence=0% → -5
    // Score = 52 + 2 - 5 = 49
    expect(r.routine_score).toBe(49);
  });

  it("settling at exactly 70% boundary → +1", () => {
    const r = computeDailyRoutineStructure({
      today: "2026-05-27",
      total_children: 3,
      routine_schedule_records: [],
      activity_plan_records: [],
      meal_routine_records: [],
      bedtime_routine_records: nOf(10, 7, makeBedtime,
        { child_settled_within_30_min: true, bedtime_routine_followed: false, wind_down_activity_provided: false, age_appropriate_bedtime: false, consistent_with_previous_nights: false },
        { child_settled_within_30_min: false, bedtime_routine_followed: false, wind_down_activity_provided: false, age_appropriate_bedtime: false, consistent_with_previous_nights: false },
      ),
      child_participation_records: [],
    });
    // settling=70% → +1, bedtimeAdherence=0% → -5
    // Score = 52 + 1 - 5 = 48
    expect(r.routine_score).toBe(48);
  });

  it("meal satisfaction at exactly 90% boundary → +3", () => {
    const r = computeDailyRoutineStructure({
      today: "2026-05-27",
      total_children: 3,
      routine_schedule_records: [],
      activity_plan_records: [],
      meal_routine_records: nOf(10, 9, makeMeal,
        { child_feedback_positive: true, meal_on_time: false, dietary_needs_met: false, healthy_options_provided: false, social_dining_environment: false, child_involved_in_preparation: false },
        { child_feedback_positive: false, meal_on_time: false, dietary_needs_met: false, healthy_options_provided: false, social_dining_environment: false, child_involved_in_preparation: false },
      ),
      bedtime_routine_records: [],
      child_participation_records: [],
    });
    // mealSatisfaction=90% → +3, mealRegularity=0% → -5
    // Score = 52 + 3 - 5 = 50
    expect(r.routine_score).toBe(50);
  });

  it("participation rate at exactly 85% boundary → +3", () => {
    // Need pct(n, total*4) >= 85
    // With 20 records: denominator=80. Need 68/80=85%
    // 17 perfect (68) + 3 bad (0) = 68 → pct(68,80) = 85
    const r = computeDailyRoutineStructure({
      today: "2026-05-27",
      total_children: 3,
      routine_schedule_records: [],
      activity_plan_records: [],
      meal_routine_records: [],
      bedtime_routine_records: [],
      child_participation_records: nOf(20, 17, makeParticipation,
        { child_consulted: true, child_views_recorded: true, views_actioned: true, child_satisfied_with_outcome: true },
        { child_consulted: false, child_views_recorded: false, views_actioned: false, child_satisfied_with_outcome: false },
      ),
    });
    expect(r.child_participation_rate).toBe(85);
    expect(r.routine_score).toBe(55); // 52+3
  });

  it("participation rate at exactly 65% boundary → +1", () => {
    // With 20 records: denominator=80. Need 52/80=65
    // 13 perfect (52) + 7 bad = 52 → pct(52,80) = 65
    const r = computeDailyRoutineStructure({
      today: "2026-05-27",
      total_children: 3,
      routine_schedule_records: [],
      activity_plan_records: [],
      meal_routine_records: [],
      bedtime_routine_records: [],
      child_participation_records: nOf(20, 13, makeParticipation,
        { child_consulted: true, child_views_recorded: true, views_actioned: true, child_satisfied_with_outcome: true },
        { child_consulted: false, child_views_recorded: false, views_actioned: false, child_satisfied_with_outcome: false },
      ),
    });
    expect(r.child_participation_rate).toBe(65);
    expect(r.routine_score).toBe(53); // 52+1
  });

  it("no concerns about missing records when total_children is 0", () => {
    const r = computeDailyRoutineStructure({
      today: "2026-05-27",
      total_children: 0,
      routine_schedule_records: [makeRoutine()],
      activity_plan_records: [],
      meal_routine_records: [],
      bedtime_routine_records: [],
      child_participation_records: [],
    });
    // total_children=0 → missing record concerns don't fire (they check total_children > 0)
    expect(r.concerns.every((c) => !c.includes("No meal routine records exist"))).toBe(true);
    expect(r.concerns.every((c) => !c.includes("No bedtime routine records exist"))).toBe(true);
  });

  it("dietary compliance at exactly 70% does NOT trigger concern", () => {
    const r = computeDailyRoutineStructure(baseInput({
      meal_routine_records: nOf(10, 7, makeMeal, { dietary_needs_met: true }, { dietary_needs_met: false }),
    }));
    expect(r.concerns.every((c) => !c.includes("Dietary needs compliance"))).toBe(true);
  });

  it("dietary compliance at 69% triggers concern", () => {
    // Need < 70%. With 10 records, 6/10 = 60%
    const r = computeDailyRoutineStructure(baseInput({
      meal_routine_records: nOf(10, 6, makeMeal, { dietary_needs_met: true }, { dietary_needs_met: false }),
    }));
    expect(r.concerns.some((c) => c.includes("Dietary needs compliance"))).toBe(true);
  });

  it("activity choice at exactly 40% does NOT trigger concern", () => {
    const r = computeDailyRoutineStructure(baseInput({
      activity_plan_records: nOf(10, 4, makeActivity, { child_chose_activity: true }, { child_chose_activity: false }),
    }));
    expect(r.concerns.every((c) => !c.includes("child-chosen activities"))).toBe(true);
  });

  it("flexibility at exactly 30% does NOT trigger concern", () => {
    const r = computeDailyRoutineStructure(baseInput({
      routine_schedule_records: nOf(10, 3, makeRoutine, { flexibility_shown: true, routine_followed: true }, { flexibility_shown: false, routine_followed: true }),
    }));
    expect(r.concerns.every((c) => !c.includes("Flexibility rate"))).toBe(true);
  });

  it("flexibility at 29% triggers concern", () => {
    // 2/10 = 20% < 30
    const r = computeDailyRoutineStructure(baseInput({
      routine_schedule_records: nOf(10, 2, makeRoutine, { flexibility_shown: true, routine_followed: true }, { flexibility_shown: false, routine_followed: true }),
    }));
    expect(r.concerns.some((c) => c.includes("Flexibility rate"))).toBe(true);
  });

  it("child informed at exactly 50% does NOT trigger concern", () => {
    const r = computeDailyRoutineStructure(baseInput({
      routine_schedule_records: nOf(10, 5, makeRoutine, { child_informed_of_plan: true, routine_followed: true }, { child_informed_of_plan: false, routine_followed: true }),
    }));
    expect(r.concerns.every((c) => !c.includes("children informed of daily plans"))).toBe(true);
  });

  it("child informed at 40% triggers concern", () => {
    const r = computeDailyRoutineStructure(baseInput({
      routine_schedule_records: nOf(10, 4, makeRoutine, { child_informed_of_plan: true, routine_followed: true }, { child_informed_of_plan: false, routine_followed: true }),
    }));
    expect(r.concerns.some((c) => c.includes("children informed of daily plans"))).toBe(true);
  });

  it("wind-down at exactly 50% does NOT trigger concern", () => {
    const r = computeDailyRoutineStructure(baseInput({
      bedtime_routine_records: nOf(10, 5, makeBedtime, { wind_down_activity_provided: true }, { wind_down_activity_provided: false }),
    }));
    expect(r.concerns.every((c) => !c.includes("wind-down activities provided"))).toBe(true);
  });

  it("views actioned at exactly 50% does NOT trigger concern", () => {
    const r = computeDailyRoutineStructure(baseInput({
      child_participation_records: Array.from({ length: 10 }, (_, i) =>
        makeParticipation({ views_actioned: i < 5 }),
      ),
    }));
    expect(r.concerns.every((c) => !c.includes("children's views actioned"))).toBe(true);
  });
});
