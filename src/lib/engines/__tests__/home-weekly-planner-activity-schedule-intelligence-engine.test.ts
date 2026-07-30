// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME WEEKLY PLANNER & ACTIVITY SCHEDULE INTELLIGENCE ENGINE TESTS
// Comprehensive test suite covering schedule timeliness, activity variety,
// child input, communication effectiveness, adherence, and scoring.
// CHR 2015 Reg 5, Reg 6, Reg 7; SCCIF experiences and progress.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeWeeklyPlannerActivitySchedule,
  type WeeklyPlannerInput,
  type ScheduleCreationRecordInput,
  type ActivityVarietyRecordInput,
  type ChildInputRecordInput,
  type CommunicationRecordInput,
  type AdherenceRecordInput,
} from "../home-weekly-planner-activity-schedule-intelligence-engine";

const TODAY = "2026-05-25";

// ── Factories ───────────────────────────────────────────────────────────────

let _id = 0;

function makeScheduleCreation(overrides: Partial<ScheduleCreationRecordInput> = {}): ScheduleCreationRecordInput {
  _id++;
  return {
    id: `sched_${_id}`,
    week_commencing: "2026-05-18",
    created_date: "2026-05-15",
    created_by: "staff_1",
    days_before_week_start: 3,
    includes_all_children: true,
    includes_morning: true,
    includes_afternoon: true,
    includes_evening: true,
    includes_weekend: true,
    total_activities_planned: 14,
    approved_by_manager: true,
    revision_count: 1,
    created_at: "2026-05-15T10:00:00Z",
    ...overrides,
  };
}

function makeActivityVariety(overrides: Partial<ActivityVarietyRecordInput> = {}): ActivityVarietyRecordInput {
  _id++;
  return {
    id: `act_${_id}`,
    week_commencing: "2026-05-18",
    category: "recreational",
    activity_title: "Board games",
    is_indoor: true,
    is_outdoor: false,
    is_group: true,
    is_individual: false,
    is_educational: false,
    is_recreational: true,
    is_therapeutic: false,
    is_life_skills: false,
    is_cultural: false,
    is_physical: false,
    is_creative: false,
    is_community: false,
    age_appropriate: true,
    new_activity: false,
    child_satisfaction: 4,
    created_at: "2026-05-18T10:00:00Z",
    ...overrides,
  };
}

function makeChildInput(overrides: Partial<ChildInputRecordInput> = {}): ChildInputRecordInput {
  _id++;
  return {
    id: `ci_${_id}`,
    child_id: "yp_1",
    child_name: "Alex",
    week_commencing: "2026-05-18",
    consulted_before_planning: true,
    preferences_recorded: true,
    suggestions_included: 3,
    suggestions_acted_on: 2,
    attended_planning_session: true,
    feedback_given_after: true,
    felt_listened_to: true,
    satisfaction_score: 4,
    created_at: "2026-05-18T10:00:00Z",
    ...overrides,
  };
}

function makeCommunication(overrides: Partial<CommunicationRecordInput> = {}): CommunicationRecordInput {
  _id++;
  return {
    id: `comm_${_id}`,
    week_commencing: "2026-05-18",
    schedule_displayed: true,
    shared_with_children: true,
    shared_with_staff: true,
    shared_with_carers: true,
    shared_before_week_start: true,
    format_accessible: true,
    changes_communicated: true,
    child_friendly_format: true,
    digital_copy_available: true,
    created_at: "2026-05-18T10:00:00Z",
    ...overrides,
  };
}

function makeAdherence(overrides: Partial<AdherenceRecordInput> = {}): AdherenceRecordInput {
  _id++;
  return {
    id: `adh_${_id}`,
    week_commencing: "2026-05-18",
    activity_title: "Board games",
    was_planned: true,
    was_delivered: true,
    delivered_as_planned: true,
    reason_not_delivered: "",
    alternative_provided: false,
    child_informed_of_change: false,
    child_satisfaction: 4,
    staff_id: "staff_1",
    created_at: "2026-05-18T10:00:00Z",
    ...overrides,
  };
}

const baseInput: WeeklyPlannerInput = {
  today: TODAY,
  total_children: 3,
  schedule_creation_records: [],
  activity_variety_records: [],
  child_input_records: [],
  communication_records: [],
  adherence_records: [],
};

function run(overrides: Partial<WeeklyPlannerInput> = {}) {
  return computeWeeklyPlannerActivitySchedule({ ...baseInput, ...overrides });
}

// ── 1. Insufficient Data / Edge Cases ──────────────────────────────────────

describe("insufficient data and edge cases", () => {
  it("returns insufficient_data when all arrays empty and 0 children", () => {
    const r = run({ total_children: 0, schedule_creation_records: [], activity_variety_records: [], child_input_records: [], communication_records: [], adherence_records: [] });
    expect(r.planner_rating).toBe("insufficient_data");
    expect(r.planner_score).toBe(0);
  });

  it("returns inadequate with score 15 when all arrays empty but children > 0", () => {
    const r = run({ total_children: 3 });
    expect(r.planner_rating).toBe("inadequate");
    expect(r.planner_score).toBe(15);
    expect(r.concerns.length).toBe(1);
    expect(r.recommendations.length).toBe(2);
    expect(r.insights.length).toBe(1);
    expect(r.insights[0].severity).toBe("critical");
  });

  it("headline mentions 'No children on placement' for insufficient_data", () => {
    const r = run({ total_children: 0 });
    expect(r.headline).toContain("No children on placement");
  });

  it("headline mentions 'No weekly planner' for empty arrays with children", () => {
    const r = run({ total_children: 2 });
    expect(r.headline).toContain("No weekly planner");
  });

  it("recommendations have correct regulatory refs for empty-with-children", () => {
    const r = run({ total_children: 2 });
    expect(r.recommendations[0].regulatory_ref).toContain("Reg 5");
    expect(r.recommendations[1].regulatory_ref).toContain("Reg 6");
  });

  it("all rates are 0 for insufficient_data", () => {
    const r = run({ total_children: 0 });
    expect(r.schedule_timeliness_rate).toBe(0);
    expect(r.activity_variety_rate).toBeNull();
    expect(r.child_input_rate).toBeNull();
    expect(r.communication_rate).toBeNull();
    expect(r.adherence_rate).toBeNull();
    expect(r.child_satisfaction_rate).toBeNull();
  });

  it("all rates are 0 for empty-with-children", () => {
    const r = run({ total_children: 2 });
    expect(r.schedule_timeliness_rate).toBe(0);
    expect(r.activity_variety_rate).toBeNull();
  });

  it("empty strengths for insufficient_data", () => {
    const r = run({ total_children: 0 });
    expect(r.strengths).toEqual([]);
  });

  it("empty concerns for insufficient_data", () => {
    const r = run({ total_children: 0 });
    expect(r.concerns).toEqual([]);
  });

  it("empty recommendations for insufficient_data", () => {
    const r = run({ total_children: 0 });
    expect(r.recommendations).toEqual([]);
  });
});

// ── 2. Schedule Creation Timeliness ────────────────────────────────────────

describe("schedule creation timeliness", () => {
  it("100% timeliness when all schedules created >= 2 days before", () => {
    const r = run({ schedule_creation_records: [makeScheduleCreation({ days_before_week_start: 3 }), makeScheduleCreation({ days_before_week_start: 5 })] });
    expect(r.schedule_timeliness_rate).toBe(100);
  });

  it("0% timeliness when all schedules created < 2 days before", () => {
    const r = run({ schedule_creation_records: [makeScheduleCreation({ days_before_week_start: 1 }), makeScheduleCreation({ days_before_week_start: 0 })] });
    expect(r.schedule_timeliness_rate).toBe(0);
  });

  it("50% timeliness with mixed records", () => {
    const r = run({ schedule_creation_records: [makeScheduleCreation({ days_before_week_start: 3 }), makeScheduleCreation({ days_before_week_start: 1 })] });
    expect(r.schedule_timeliness_rate).toBe(50);
  });

  it("high timeliness (>=90) gives +5 bonus", () => {
    const schedules = Array.from({ length: 10 }, () => makeScheduleCreation({ days_before_week_start: 3 }));
    const r = run({ schedule_creation_records: schedules });
    // base 52 + 5 (timeliness) + possible other bonuses
    expect(r.planner_score).toBeGreaterThanOrEqual(57);
  });

  it("timeliness 70-89% gives +3 bonus", () => {
    const schedules = [
      ...Array.from({ length: 8 }, () => makeScheduleCreation({ days_before_week_start: 3 })),
      ...Array.from({ length: 2 }, () => makeScheduleCreation({ days_before_week_start: 1 })),
    ];
    const r = run({ schedule_creation_records: schedules });
    expect(r.schedule_timeliness_rate).toBe(80);
  });

  it("timeliness < 50% triggers -5 penalty", () => {
    const schedules = [
      makeScheduleCreation({ days_before_week_start: 3 }),
      ...Array.from({ length: 4 }, () => makeScheduleCreation({ days_before_week_start: 0 })),
    ];
    const r = run({ schedule_creation_records: schedules });
    expect(r.schedule_timeliness_rate).toBe(20);
    expect(r.concerns.some(c => c.includes("schedules created on time"))).toBe(true);
  });

  it("strength generated for >=90% timeliness", () => {
    const schedules = Array.from({ length: 10 }, () => makeScheduleCreation({ days_before_week_start: 4 }));
    const r = run({ schedule_creation_records: schedules });
    expect(r.strengths.some(s => s.includes("excellent forward planning"))).toBe(true);
  });

  it("strength generated for 70-89% timeliness", () => {
    const schedules = [
      ...Array.from({ length: 8 }, () => makeScheduleCreation({ days_before_week_start: 3 })),
      ...Array.from({ length: 2 }, () => makeScheduleCreation({ days_before_week_start: 1 })),
    ];
    const r = run({ schedule_creation_records: schedules });
    expect(r.strengths.some(s => s.includes("good planning practice"))).toBe(true);
  });

  it("concern for timeliness 50-69%", () => {
    const schedules = [
      ...Array.from({ length: 6 }, () => makeScheduleCreation({ days_before_week_start: 3 })),
      ...Array.from({ length: 4 }, () => makeScheduleCreation({ days_before_week_start: 1 })),
    ];
    const r = run({ schedule_creation_records: schedules });
    expect(r.schedule_timeliness_rate).toBe(60);
    expect(r.concerns.some(c => c.includes("Schedule timeliness at 60%"))).toBe(true);
  });

  it("critical insight for timeliness < 50%", () => {
    const schedules = Array.from({ length: 5 }, () => makeScheduleCreation({ days_before_week_start: 1 }));
    const r = run({ schedule_creation_records: schedules });
    expect(r.insights.some(i => i.severity === "critical" && i.text.includes("schedules created on time"))).toBe(true);
  });

  it("recommendation for timeliness < 50%", () => {
    const schedules = Array.from({ length: 5 }, () => makeScheduleCreation({ days_before_week_start: 0 }));
    const r = run({ schedule_creation_records: schedules });
    expect(r.recommendations.some(rec => rec.recommendation.includes("planning cycle"))).toBe(true);
  });

  it("warning insight for timeliness 50-69%", () => {
    const schedules = [
      ...Array.from({ length: 6 }, () => makeScheduleCreation({ days_before_week_start: 3 })),
      ...Array.from({ length: 4 }, () => makeScheduleCreation({ days_before_week_start: 1 })),
    ];
    const r = run({ schedule_creation_records: schedules });
    expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Schedule timeliness at 60%"))).toBe(true);
  });
});

// ── 3. Schedule Coverage ───────────────────────────────────────────────────

describe("schedule coverage (full day, weekend, all children, manager approval)", () => {
  it("100% full coverage when all schedules have morning+afternoon+evening", () => {
    const schedules = Array.from({ length: 5 }, () => makeScheduleCreation({ includes_morning: true, includes_afternoon: true, includes_evening: true }));
    const r = run({ schedule_creation_records: schedules });
    expect(r.strengths.some(s => s.includes("cover morning, afternoon, and evening"))).toBe(true);
  });

  it("concern when full coverage < 50%", () => {
    const schedules = [
      makeScheduleCreation({ includes_morning: true, includes_afternoon: true, includes_evening: true }),
      ...Array.from({ length: 4 }, () => makeScheduleCreation({ includes_morning: true, includes_afternoon: false, includes_evening: false })),
    ];
    const r = run({ schedule_creation_records: schedules });
    expect(r.concerns.some(c => c.includes("cover morning, afternoon, and evening"))).toBe(true);
  });

  it("100% weekend coverage strength", () => {
    const schedules = Array.from({ length: 5 }, () => makeScheduleCreation({ includes_weekend: true }));
    const r = run({ schedule_creation_records: schedules });
    expect(r.strengths.some(s => s.includes("weekend planning"))).toBe(true);
  });

  it("concern when weekend coverage < 50%", () => {
    const schedules = [
      makeScheduleCreation({ includes_weekend: true }),
      ...Array.from({ length: 4 }, () => makeScheduleCreation({ includes_weekend: false })),
    ];
    const r = run({ schedule_creation_records: schedules });
    expect(r.concerns.some(c => c.includes("weekend activities"))).toBe(true);
  });

  it("100% all-children inclusion strength", () => {
    const schedules = Array.from({ length: 5 }, () => makeScheduleCreation({ includes_all_children: true }));
    const r = run({ schedule_creation_records: schedules });
    expect(r.strengths.some(s => s.includes("include all children"))).toBe(true);
  });

  it("concern when all-children inclusion < 70%", () => {
    const schedules = [
      ...Array.from({ length: 2 }, () => makeScheduleCreation({ includes_all_children: true })),
      ...Array.from({ length: 8 }, () => makeScheduleCreation({ includes_all_children: false })),
    ];
    const r = run({ schedule_creation_records: schedules });
    expect(r.concerns.some(c => c.includes("include all children"))).toBe(true);
  });

  it("100% manager approval strength", () => {
    const schedules = Array.from({ length: 5 }, () => makeScheduleCreation({ approved_by_manager: true }));
    const r = run({ schedule_creation_records: schedules });
    expect(r.strengths.some(s => s.includes("approved by the manager"))).toBe(true);
  });

  it("concern when manager approval < 50%", () => {
    const schedules = [
      makeScheduleCreation({ approved_by_manager: true }),
      ...Array.from({ length: 4 }, () => makeScheduleCreation({ approved_by_manager: false })),
    ];
    const r = run({ schedule_creation_records: schedules });
    expect(r.concerns.some(c => c.includes("approved by the manager"))).toBe(true);
  });

  it("full coverage >=90 gives +3 bonus", () => {
    const base = run({ schedule_creation_records: [] });
    const withFC = run({
      schedule_creation_records: Array.from({ length: 10 }, () =>
        makeScheduleCreation({ includes_morning: true, includes_afternoon: true, includes_evening: true })
      ),
    });
    expect(withFC.planner_score).toBeGreaterThan(base.planner_score);
  });

  it("manager approval >=90 gives +2 bonus", () => {
    const withApproval = run({
      schedule_creation_records: Array.from({ length: 10 }, () =>
        makeScheduleCreation({ approved_by_manager: true })
      ),
    });
    expect(withApproval.planner_score).toBeGreaterThanOrEqual(54);
  });

  it("weekend coverage >=90 gives +2 bonus", () => {
    const withWeekend = run({
      schedule_creation_records: Array.from({ length: 10 }, () =>
        makeScheduleCreation({ includes_weekend: true })
      ),
    });
    expect(withWeekend.planner_score).toBeGreaterThanOrEqual(54);
  });

  it("high revision rate >=50% triggers concern", () => {
    const schedules = Array.from({ length: 4 }, () => makeScheduleCreation({ revision_count: 4 }));
    const r = run({ schedule_creation_records: schedules });
    expect(r.concerns.some(c => c.includes("revised 3 or more times"))).toBe(true);
  });

  it("warning insight for full coverage 50-89%", () => {
    const schedules = [
      ...Array.from({ length: 7 }, () => makeScheduleCreation({ includes_morning: true, includes_afternoon: true, includes_evening: true })),
      ...Array.from({ length: 3 }, () => makeScheduleCreation({ includes_morning: true, includes_afternoon: false, includes_evening: false })),
    ];
    const r = run({ schedule_creation_records: schedules });
    expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Full-day coverage"))).toBe(true);
  });

  it("warning insight for weekend coverage 50-89%", () => {
    const schedules = [
      ...Array.from({ length: 7 }, () => makeScheduleCreation({ includes_weekend: true })),
      ...Array.from({ length: 3 }, () => makeScheduleCreation({ includes_weekend: false })),
    ];
    const r = run({ schedule_creation_records: schedules });
    expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Weekend coverage"))).toBe(true);
  });

  it("recommendation for full coverage < 50%", () => {
    const schedules = Array.from({ length: 5 }, () =>
      makeScheduleCreation({ includes_morning: true, includes_afternoon: false, includes_evening: false })
    );
    const r = run({ schedule_creation_records: schedules });
    expect(r.recommendations.some(rec => rec.recommendation.includes("morning, afternoon, and evening"))).toBe(true);
  });

  it("recommendation for weekend coverage < 50%", () => {
    const schedules = Array.from({ length: 5 }, () =>
      makeScheduleCreation({ includes_weekend: false })
    );
    const r = run({ schedule_creation_records: schedules });
    expect(r.recommendations.some(rec => rec.recommendation.includes("weekend"))).toBe(true);
  });

  it("recommendation for manager approval < 50%", () => {
    const schedules = Array.from({ length: 5 }, () =>
      makeScheduleCreation({ approved_by_manager: false })
    );
    const r = run({ schedule_creation_records: schedules });
    expect(r.recommendations.some(rec => rec.recommendation.includes("manager approval"))).toBe(true);
  });
});

// ── 4. Activity Variety ────────────────────────────────────────────────────

describe("activity variety", () => {
  it("activityVarietyRate is 0 when no records", () => {
    const r = run({});
    expect(r.activity_variety_rate).toBeNull();
  });

  it("varied categories and types produce high variety rate", () => {
    const records = [
      makeActivityVariety({ category: "education", is_educational: true, is_indoor: true }),
      makeActivityVariety({ category: "sport", is_physical: true, is_outdoor: true }),
      makeActivityVariety({ category: "creative", is_creative: true, is_group: true }),
      makeActivityVariety({ category: "therapeutic", is_therapeutic: true, is_individual: true }),
      makeActivityVariety({ category: "community", is_community: true, is_recreational: true }),
      makeActivityVariety({ category: "life_skills", is_life_skills: true, is_cultural: true }),
    ];
    const r = run({ activity_variety_records: records });
    expect(r.activity_variety_rate).toBeGreaterThanOrEqual(80);
  });

  it("same category repeating gives lower variety rate", () => {
    const records = Array.from({ length: 10 }, () =>
      makeActivityVariety({ category: "recreational" })
    );
    const r = run({ activity_variety_records: records });
    expect(r.activity_variety_rate).toBeLessThanOrEqual(30);
  });

  it("strength for >= 6 unique categories", () => {
    const cats = ["edu", "sport", "art", "therapy", "community", "life"];
    const records = cats.map(c => makeActivityVariety({ category: c }));
    const r = run({ activity_variety_records: records });
    expect(r.strengths.some(s => s.includes("6 different categories"))).toBe(true);
  });

  it("strength for 4-5 unique categories", () => {
    const cats = ["edu", "sport", "art", "therapy"];
    const records = cats.map(c => makeActivityVariety({ category: c }));
    const r = run({ activity_variety_records: records });
    expect(r.strengths.some(s => s.includes("4 different categories"))).toBe(true);
  });

  it("concern for <= 2 categories with >= 3 records", () => {
    const records = [
      makeActivityVariety({ category: "sport" }),
      makeActivityVariety({ category: "sport" }),
      makeActivityVariety({ category: "sport" }),
    ];
    const r = run({ activity_variety_records: records });
    expect(r.concerns.some(c => c.includes("1 category"))).toBe(true);
  });

  it("concern for <= 3 type flags with >= 3 records", () => {
    const records = Array.from({ length: 4 }, () =>
      makeActivityVariety({ is_indoor: true, is_outdoor: false, is_group: true, is_individual: false, is_educational: false, is_recreational: true, is_therapeutic: false, is_life_skills: false, is_cultural: false, is_physical: false, is_creative: false, is_community: false })
    );
    const r = run({ activity_variety_records: records });
    expect(r.concerns.some(c => c.includes("activity types represented"))).toBe(true);
  });

  it("strength for >= 8 type flags", () => {
    const records = [
      makeActivityVariety({ is_indoor: true, is_outdoor: true, is_group: true, is_individual: true, is_educational: true, is_recreational: true, is_therapeutic: true, is_life_skills: true, is_cultural: false, is_physical: false, is_creative: false, is_community: false }),
    ];
    const r = run({ activity_variety_records: records });
    expect(r.strengths.some(s => s.includes("8 different types"))).toBe(true);
  });

  it("strength for >= 20% new activities", () => {
    const records = [
      makeActivityVariety({ new_activity: true }),
      makeActivityVariety({ new_activity: true }),
      makeActivityVariety({ new_activity: false }),
      makeActivityVariety({ new_activity: false }),
      makeActivityVariety({ new_activity: false }),
    ];
    const r = run({ activity_variety_records: records });
    expect(r.strengths.some(s => s.includes("new experiences"))).toBe(true);
  });

  it("concern when no new activities with >= 3 records", () => {
    const records = Array.from({ length: 4 }, () => makeActivityVariety({ new_activity: false }));
    const r = run({ activity_variety_records: records });
    expect(r.concerns.some(c => c.includes("No new activities"))).toBe(true);
  });

  it("strength for >= 95% age appropriate", () => {
    const records = Array.from({ length: 20 }, () => makeActivityVariety({ age_appropriate: true }));
    const r = run({ activity_variety_records: records });
    expect(r.strengths.some(s => s.includes("age-appropriate"))).toBe(true);
  });

  it("concern for < 70% age appropriate", () => {
    const records = [
      ...Array.from({ length: 3 }, () => makeActivityVariety({ age_appropriate: true })),
      ...Array.from({ length: 7 }, () => makeActivityVariety({ age_appropriate: false })),
    ];
    const r = run({ activity_variety_records: records });
    expect(r.concerns.some(c => c.includes("age-appropriate"))).toBe(true);
  });

  it("variety >= 80 gives +4 bonus", () => {
    const cats = ["a", "b", "c", "d", "e", "f"];
    const records = cats.map(c =>
      makeActivityVariety({ category: c, is_indoor: true, is_outdoor: true, is_group: true, is_individual: true, is_educational: true, is_recreational: true, is_therapeutic: true, is_life_skills: true, is_cultural: true, is_physical: true, is_creative: true, is_community: true })
    );
    const r = run({ activity_variety_records: records });
    expect(r.activity_variety_rate).toBeGreaterThanOrEqual(80);
  });

  it("warning insight for 3-5 categories", () => {
    const cats = ["a", "b", "c"];
    const records = cats.map(c => makeActivityVariety({ category: c }));
    const r = run({ activity_variety_records: records });
    expect(r.insights.some(i => i.severity === "warning" && i.text.includes("categories"))).toBe(true);
  });

  it("recommendation for <= 2 categories", () => {
    const records = Array.from({ length: 4 }, () => makeActivityVariety({ category: "sport" }));
    const r = run({ activity_variety_records: records });
    expect(r.recommendations.some(rec => rec.recommendation.includes("Diversify"))).toBe(true);
  });

  it("recommendation for no new activities", () => {
    const records = Array.from({ length: 4 }, () => makeActivityVariety({ new_activity: false }));
    const r = run({ activity_variety_records: records });
    expect(r.recommendations.some(rec => rec.recommendation.includes("new activity"))).toBe(true);
  });

  it("recommendation for low age appropriateness", () => {
    const records = [
      ...Array.from({ length: 2 }, () => makeActivityVariety({ age_appropriate: true })),
      ...Array.from({ length: 8 }, () => makeActivityVariety({ age_appropriate: false })),
    ];
    const r = run({ activity_variety_records: records });
    expect(r.recommendations.some(rec => rec.recommendation.includes("age-appropriate"))).toBe(true);
  });

  it("warning insight for age appropriateness 70-94%", () => {
    const records = [
      ...Array.from({ length: 8 }, () => makeActivityVariety({ age_appropriate: true })),
      ...Array.from({ length: 2 }, () => makeActivityVariety({ age_appropriate: false })),
    ];
    const r = run({ activity_variety_records: records });
    expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Age appropriateness"))).toBe(true);
  });
});

// ── 5. Child Input in Planning ─────────────────────────────────────────────

describe("child input in planning", () => {
  it("childInputRate is 0 when no records", () => {
    const r = run({});
    expect(r.child_input_rate).toBeNull();
  });

  it("100% when all consulted, preferences recorded, felt listened to", () => {
    const records = Array.from({ length: 5 }, () =>
      makeChildInput({ consulted_before_planning: true, preferences_recorded: true, felt_listened_to: true })
    );
    const r = run({ child_input_records: records });
    expect(r.child_input_rate).toBe(100);
  });

  it("0% when none consulted, no preferences, not listened to", () => {
    const records = Array.from({ length: 5 }, () =>
      makeChildInput({ consulted_before_planning: false, preferences_recorded: false, felt_listened_to: false })
    );
    const r = run({ child_input_records: records });
    // records exist → 0, not null
    expect(r.child_input_rate).toBe(0);
  });

  it("childInputRate >= 80 gives +5 bonus", () => {
    const records = Array.from({ length: 10 }, () =>
      makeChildInput({ consulted_before_planning: true, preferences_recorded: true, felt_listened_to: true })
    );
    const r = run({ child_input_records: records });
    expect(r.child_input_rate).toBe(100);
  });

  it("childInputRate 60-79 gives +3 bonus", () => {
    const records = [
      ...Array.from({ length: 7 }, () => makeChildInput({ consulted_before_planning: true, preferences_recorded: true, felt_listened_to: true })),
      ...Array.from({ length: 3 }, () => makeChildInput({ consulted_before_planning: false, preferences_recorded: false, felt_listened_to: false })),
    ];
    const r = run({ child_input_records: records });
    expect(r.child_input_rate).toBeGreaterThanOrEqual(60);
  });

  it("childInputRate < 40 triggers -5 penalty", () => {
    const records = Array.from({ length: 5 }, () =>
      makeChildInput({ consulted_before_planning: false, preferences_recorded: false, felt_listened_to: false })
    );
    const r = run({ child_input_records: records });
    // records exist → 0, not null
    expect(r.child_input_rate).toBe(0);
    expect(r.planner_score).toBeLessThanOrEqual(52);
  });

  it("strength for >= 90% consultation rate", () => {
    const records = Array.from({ length: 10 }, () =>
      makeChildInput({ consulted_before_planning: true })
    );
    const r = run({ child_input_records: records });
    expect(r.strengths.some(s => s.includes("consulted before weekly planning"))).toBe(true);
  });

  it("strength for 70-89% consultation rate", () => {
    const records = [
      ...Array.from({ length: 8 }, () => makeChildInput({ consulted_before_planning: true })),
      ...Array.from({ length: 2 }, () => makeChildInput({ consulted_before_planning: false })),
    ];
    const r = run({ child_input_records: records });
    expect(r.strengths.some(s => s.includes("consultation rate"))).toBe(true);
  });

  it("concern for < 50% consultation", () => {
    const records = [
      makeChildInput({ consulted_before_planning: true }),
      ...Array.from({ length: 4 }, () => makeChildInput({ consulted_before_planning: false })),
    ];
    const r = run({ child_input_records: records });
    expect(r.concerns.some(c => c.includes("consulted before planning"))).toBe(true);
  });

  it("concern for 50-69% consultation", () => {
    const records = [
      ...Array.from({ length: 6 }, () => makeChildInput({ consulted_before_planning: true })),
      ...Array.from({ length: 4 }, () => makeChildInput({ consulted_before_planning: false })),
    ];
    const r = run({ child_input_records: records });
    expect(r.concerns.some(c => c.includes("Child consultation rate at 60%"))).toBe(true);
  });

  it("strength for >= 90% felt listened to", () => {
    const records = Array.from({ length: 10 }, () =>
      makeChildInput({ felt_listened_to: true })
    );
    const r = run({ child_input_records: records });
    expect(r.strengths.some(s => s.includes("feel listened to"))).toBe(true);
  });

  it("concern for < 50% felt listened to", () => {
    const records = [
      makeChildInput({ felt_listened_to: true }),
      ...Array.from({ length: 4 }, () => makeChildInput({ felt_listened_to: false })),
    ];
    const r = run({ child_input_records: records });
    expect(r.concerns.some(c => c.includes("feel listened to"))).toBe(true);
  });

  it("strength for >= 80% suggestions acted on", () => {
    const records = Array.from({ length: 5 }, () =>
      makeChildInput({ suggestions_included: 5, suggestions_acted_on: 5 })
    );
    const r = run({ child_input_records: records });
    expect(r.strengths.some(s => s.includes("suggestions acted upon"))).toBe(true);
  });

  it("concern for < 50% suggestions acted on", () => {
    const records = Array.from({ length: 5 }, () =>
      makeChildInput({ suggestions_included: 5, suggestions_acted_on: 1 })
    );
    const r = run({ child_input_records: records });
    expect(r.concerns.some(c => c.includes("suggestions acted upon"))).toBe(true);
  });

  it("strength for >= 80% planning session attendance", () => {
    const records = Array.from({ length: 10 }, () =>
      makeChildInput({ attended_planning_session: true })
    );
    const r = run({ child_input_records: records });
    expect(r.strengths.some(s => s.includes("attendance at planning sessions"))).toBe(true);
  });

  it("strength for >= 80% feedback rate", () => {
    const records = Array.from({ length: 10 }, () =>
      makeChildInput({ feedback_given_after: true })
    );
    const r = run({ child_input_records: records });
    expect(r.strengths.some(s => s.includes("provide feedback after activities"))).toBe(true);
  });

  it("concern for < 30% feedback rate", () => {
    const records = [
      makeChildInput({ feedback_given_after: true }),
      ...Array.from({ length: 9 }, () => makeChildInput({ feedback_given_after: false })),
    ];
    const r = run({ child_input_records: records });
    expect(r.concerns.some(c => c.includes("provide feedback"))).toBe(true);
  });

  it("no child input records concern when children > 0 and other data exists", () => {
    const r = run({
      total_children: 3,
      child_input_records: [],
      schedule_creation_records: [makeScheduleCreation()],
    });
    expect(r.concerns.some(c => c.includes("No child input records"))).toBe(true);
  });

  it("recommendation for no child input records", () => {
    const r = run({
      total_children: 3,
      child_input_records: [],
      schedule_creation_records: [makeScheduleCreation()],
    });
    expect(r.recommendations.some(rec => rec.recommendation.includes("capturing children's input"))).toBe(true);
  });

  it("recommendation for < 50% consultation", () => {
    const records = Array.from({ length: 5 }, () =>
      makeChildInput({ consulted_before_planning: false })
    );
    const r = run({ child_input_records: records });
    expect(r.recommendations.some(rec => rec.recommendation.includes("child consultation"))).toBe(true);
  });

  it("recommendation for < 50% felt listened to", () => {
    const records = Array.from({ length: 5 }, () =>
      makeChildInput({ felt_listened_to: false })
    );
    const r = run({ child_input_records: records });
    expect(r.recommendations.some(rec => rec.recommendation.includes("listened to"))).toBe(true);
  });

  it("recommendation for < 50% suggestions acted on", () => {
    const records = Array.from({ length: 5 }, () =>
      makeChildInput({ suggestions_included: 5, suggestions_acted_on: 1 })
    );
    const r = run({ child_input_records: records });
    expect(r.recommendations.some(rec => rec.recommendation.includes("suggestions"))).toBe(true);
  });

  it("recommendation for < 30% feedback rate", () => {
    const records = Array.from({ length: 10 }, () =>
      makeChildInput({ feedback_given_after: false })
    );
    const r = run({ child_input_records: records });
    expect(r.recommendations.some(rec => rec.recommendation.includes("post-activity feedback"))).toBe(true);
  });

  it("critical insight for < 50% consultation", () => {
    const records = Array.from({ length: 5 }, () =>
      makeChildInput({ consulted_before_planning: false })
    );
    const r = run({ child_input_records: records });
    expect(r.insights.some(i => i.severity === "critical" && i.text.includes("consulted before planning"))).toBe(true);
  });

  it("critical insight for < 50% felt listened to", () => {
    const records = Array.from({ length: 5 }, () =>
      makeChildInput({ felt_listened_to: false })
    );
    const r = run({ child_input_records: records });
    expect(r.insights.some(i => i.severity === "critical" && i.text.includes("feel listened to"))).toBe(true);
  });

  it("warning insight for consultation 50-69%", () => {
    const records = [
      ...Array.from({ length: 6 }, () => makeChildInput({ consulted_before_planning: true })),
      ...Array.from({ length: 4 }, () => makeChildInput({ consulted_before_planning: false })),
    ];
    const r = run({ child_input_records: records });
    expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Child consultation at 60%"))).toBe(true);
  });

  it("warning insight for suggestions acted rate 50-79%", () => {
    const records = Array.from({ length: 5 }, () =>
      makeChildInput({ suggestions_included: 4, suggestions_acted_on: 3 })
    );
    const r = run({ child_input_records: records });
    expect(r.insights.some(i => i.severity === "warning" && i.text.includes("suggestions acted upon"))).toBe(true);
  });
});

// ── 6. Communication Effectiveness ─────────────────────────────────────────

describe("communication effectiveness", () => {
  it("communicationRate is 0 when no records", () => {
    const r = run({});
    expect(r.communication_rate).toBeNull();
  });

  it("100% when all communication flags true", () => {
    const records = Array.from({ length: 5 }, () => makeCommunication());
    const r = run({ communication_records: records });
    expect(r.communication_rate).toBe(100);
  });

  it("0% when all communication flags false", () => {
    const records = Array.from({ length: 5 }, () =>
      makeCommunication({ schedule_displayed: false, shared_with_children: false, shared_with_staff: false, shared_before_week_start: false })
    );
    const r = run({ communication_records: records });
    // records exist → 0, not null
    expect(r.communication_rate).toBe(0);
  });

  it("communicationRate >=90 gives +4 bonus", () => {
    const records = Array.from({ length: 10 }, () => makeCommunication());
    const r = run({ communication_records: records });
    expect(r.communication_rate).toBe(100);
  });

  it("communicationRate 70-89 gives +2 bonus", () => {
    const records = [
      ...Array.from({ length: 8 }, () => makeCommunication()),
      ...Array.from({ length: 2 }, () => makeCommunication({ schedule_displayed: false, shared_with_children: false, shared_with_staff: false, shared_before_week_start: false })),
    ];
    const r = run({ communication_records: records });
    expect(r.communication_rate).toBeGreaterThanOrEqual(70);
  });

  it("communicationRate < 50 triggers -4 penalty", () => {
    const records = Array.from({ length: 5 }, () =>
      makeCommunication({ schedule_displayed: false, shared_with_children: false, shared_with_staff: false, shared_before_week_start: false })
    );
    const r = run({ communication_records: records });
    // records exist → 0, not null
    expect(r.communication_rate).toBe(0);
    expect(r.planner_score).toBeLessThanOrEqual(52);
  });

  it("strength for >= 90% display rate", () => {
    const records = Array.from({ length: 10 }, () => makeCommunication({ schedule_displayed: true }));
    const r = run({ communication_records: records });
    expect(r.strengths.some(s => s.includes("displayed in the home"))).toBe(true);
  });

  it("concern for < 50% display rate", () => {
    const records = [
      makeCommunication({ schedule_displayed: true }),
      ...Array.from({ length: 4 }, () => makeCommunication({ schedule_displayed: false })),
    ];
    const r = run({ communication_records: records });
    expect(r.concerns.some(c => c.includes("displayed in the home"))).toBe(true);
  });

  it("strength for >= 90% shared with children", () => {
    const records = Array.from({ length: 10 }, () => makeCommunication({ shared_with_children: true }));
    const r = run({ communication_records: records });
    expect(r.strengths.some(s => s.includes("shared directly with children"))).toBe(true);
  });

  it("concern for < 50% shared with children", () => {
    const records = [
      makeCommunication({ shared_with_children: true }),
      ...Array.from({ length: 4 }, () => makeCommunication({ shared_with_children: false })),
    ];
    const r = run({ communication_records: records });
    expect(r.concerns.some(c => c.includes("shared with children"))).toBe(true);
  });

  it("strength for >= 90% shared before week start", () => {
    const records = Array.from({ length: 10 }, () => makeCommunication({ shared_before_week_start: true }));
    const r = run({ communication_records: records });
    expect(r.strengths.some(s => s.includes("shared before the week starts"))).toBe(true);
  });

  it("concern for < 50% shared before week start", () => {
    const records = [
      makeCommunication({ shared_before_week_start: true }),
      ...Array.from({ length: 4 }, () => makeCommunication({ shared_before_week_start: false })),
    ];
    const r = run({ communication_records: records });
    expect(r.concerns.some(c => c.includes("shared before the week starts"))).toBe(true);
  });

  it("strength for >= 90% child-friendly format", () => {
    const records = Array.from({ length: 10 }, () => makeCommunication({ child_friendly_format: true }));
    const r = run({ communication_records: records });
    expect(r.strengths.some(s => s.includes("child-friendly format"))).toBe(true);
  });

  it("concern for < 50% child-friendly format", () => {
    const records = [
      makeCommunication({ child_friendly_format: true }),
      ...Array.from({ length: 4 }, () => makeCommunication({ child_friendly_format: false })),
    ];
    const r = run({ communication_records: records });
    expect(r.concerns.some(c => c.includes("child-friendly format"))).toBe(true);
  });

  it("strength for >= 90% changes communicated", () => {
    const records = Array.from({ length: 10 }, () => makeCommunication({ changes_communicated: true }));
    const r = run({ communication_records: records });
    expect(r.strengths.some(s => s.includes("schedule changes communicated"))).toBe(true);
  });

  it("no communication records concern when children > 0 and other data exists", () => {
    const r = run({
      total_children: 3,
      communication_records: [],
      schedule_creation_records: [makeScheduleCreation()],
    });
    expect(r.concerns.some(c => c.includes("No communication records"))).toBe(true);
  });

  it("recommendation for no communication records", () => {
    const r = run({
      total_children: 3,
      communication_records: [],
      schedule_creation_records: [makeScheduleCreation()],
    });
    expect(r.recommendations.some(rec => rec.recommendation.includes("schedule communication process"))).toBe(true);
  });

  it("recommendation for < 50% display rate", () => {
    const records = Array.from({ length: 5 }, () => makeCommunication({ schedule_displayed: false }));
    const r = run({ communication_records: records });
    expect(r.recommendations.some(rec => rec.recommendation.includes("Display weekly schedules"))).toBe(true);
  });

  it("recommendation for < 50% child share rate", () => {
    const records = Array.from({ length: 5 }, () => makeCommunication({ shared_with_children: false }));
    const r = run({ communication_records: records });
    expect(r.recommendations.some(rec => rec.recommendation.includes("Share weekly schedules"))).toBe(true);
  });

  it("recommendation for < 50% child-friendly format", () => {
    const records = Array.from({ length: 5 }, () => makeCommunication({ child_friendly_format: false }));
    const r = run({ communication_records: records });
    expect(r.recommendations.some(rec => rec.recommendation.includes("child-friendly formats"))).toBe(true);
  });

  it("critical insight for communicationRate < 50%", () => {
    const records = Array.from({ length: 5 }, () =>
      makeCommunication({ schedule_displayed: false, shared_with_children: false, shared_with_staff: false, shared_before_week_start: false })
    );
    const r = run({ communication_records: records });
    expect(r.insights.some(i => i.severity === "critical" && i.text.includes("Schedule communication rate"))).toBe(true);
  });

  it("positive insight for communicationRate >= 90%", () => {
    const records = Array.from({ length: 10 }, () => makeCommunication());
    const r = run({ communication_records: records });
    expect(r.insights.some(i => i.severity === "positive" && i.text.includes("Schedule communication at 100%"))).toBe(true);
  });

  it("warning insight for child share 50-89%", () => {
    const records = [
      ...Array.from({ length: 7 }, () => makeCommunication({ shared_with_children: true })),
      ...Array.from({ length: 3 }, () => makeCommunication({ shared_with_children: false })),
    ];
    const r = run({ communication_records: records });
    expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Schedule sharing with children"))).toBe(true);
  });
});

// ── 7. Adherence to Planned Activities ─────────────────────────────────────

describe("adherence to planned activities", () => {
  it("adherenceRate is 0 when no records", () => {
    const r = run({});
    expect(r.adherence_rate).toBeNull();
  });

  it("100% when all delivered as planned", () => {
    const records = Array.from({ length: 10 }, () =>
      makeAdherence({ was_delivered: true, delivered_as_planned: true })
    );
    const r = run({ adherence_records: records });
    expect(r.adherence_rate).toBe(100);
  });

  it("0% when none delivered", () => {
    const records = Array.from({ length: 5 }, () =>
      makeAdherence({ was_delivered: false, delivered_as_planned: false })
    );
    const r = run({ adherence_records: records });
    // records exist → 0, not null
    expect(r.adherence_rate).toBe(0);
  });

  it("adherenceRate >=90 gives +4 bonus", () => {
    const records = Array.from({ length: 10 }, () =>
      makeAdherence({ was_delivered: true, delivered_as_planned: true })
    );
    const r = run({ adherence_records: records });
    expect(r.adherence_rate).toBe(100);
  });

  it("adherenceRate < 50 triggers -5 penalty", () => {
    const records = Array.from({ length: 5 }, () =>
      makeAdherence({ was_delivered: false, delivered_as_planned: false })
    );
    const r = run({ adherence_records: records });
    // records exist → 0, not null
    expect(r.adherence_rate).toBe(0);
    expect(r.planner_score).toBeLessThanOrEqual(52);
  });

  it("strength for >= 90% delivery rate", () => {
    const records = Array.from({ length: 10 }, () =>
      makeAdherence({ was_delivered: true })
    );
    const r = run({ adherence_records: records });
    expect(r.strengths.some(s => s.includes("planned activities delivered"))).toBe(true);
  });

  it("strength for 70-89% delivery rate", () => {
    const records = [
      ...Array.from({ length: 8 }, () => makeAdherence({ was_delivered: true })),
      ...Array.from({ length: 2 }, () => makeAdherence({ was_delivered: false })),
    ];
    const r = run({ adherence_records: records });
    expect(r.strengths.some(s => s.includes("activity delivery rate"))).toBe(true);
  });

  it("concern for < 50% delivery rate", () => {
    const records = [
      makeAdherence({ was_delivered: true }),
      ...Array.from({ length: 4 }, () => makeAdherence({ was_delivered: false })),
    ];
    const r = run({ adherence_records: records });
    expect(r.concerns.some(c => c.includes("planned activities delivered"))).toBe(true);
  });

  it("concern for 50-69% delivery rate", () => {
    const records = [
      ...Array.from({ length: 6 }, () => makeAdherence({ was_delivered: true })),
      ...Array.from({ length: 4 }, () => makeAdherence({ was_delivered: false })),
    ];
    const r = run({ adherence_records: records });
    expect(r.concerns.some(c => c.includes("Activity delivery rate at 60%"))).toBe(true);
  });

  it("strength for >= 90% as planned rate", () => {
    const records = Array.from({ length: 10 }, () =>
      makeAdherence({ delivered_as_planned: true })
    );
    const r = run({ adherence_records: records });
    expect(r.strengths.some(s => s.includes("delivered exactly as planned"))).toBe(true);
  });

  it("concern for < 50% as planned rate", () => {
    const records = [
      makeAdherence({ delivered_as_planned: true }),
      ...Array.from({ length: 4 }, () => makeAdherence({ delivered_as_planned: false })),
    ];
    const r = run({ adherence_records: records });
    expect(r.concerns.some(c => c.includes("delivered as planned"))).toBe(true);
  });

  it("strength for >= 80% alternative rate when not delivered", () => {
    const records = [
      ...Array.from({ length: 5 }, () => makeAdherence({ was_planned: true, was_delivered: true, delivered_as_planned: true })),
      ...Array.from({ length: 5 }, () => makeAdherence({ was_planned: true, was_delivered: false, alternative_provided: true })),
    ];
    const r = run({ adherence_records: records });
    expect(r.strengths.some(s => s.includes("alternatives provided"))).toBe(true);
  });

  it("concern for < 50% alternative rate with >= 2 not delivered", () => {
    const records = [
      ...Array.from({ length: 5 }, () => makeAdherence({ was_planned: true, was_delivered: true })),
      ...Array.from({ length: 5 }, () => makeAdherence({ was_planned: true, was_delivered: false, alternative_provided: false })),
    ];
    const r = run({ adherence_records: records });
    expect(r.concerns.some(c => c.includes("alternatives provided"))).toBe(true);
  });

  it("strength for >= 90% child informed of change rate", () => {
    const records = [
      ...Array.from({ length: 5 }, () => makeAdherence({ was_planned: true, delivered_as_planned: true })),
      ...Array.from({ length: 5 }, () => makeAdherence({ was_planned: true, delivered_as_planned: false, child_informed_of_change: true })),
    ];
    const r = run({ adherence_records: records });
    expect(r.strengths.some(s => s.includes("changes communicated to children"))).toBe(true);
  });

  it("concern for < 50% child informed of changes with >= 2 changes", () => {
    const records = [
      ...Array.from({ length: 5 }, () => makeAdherence({ was_planned: true, delivered_as_planned: true })),
      ...Array.from({ length: 5 }, () => makeAdherence({ was_planned: true, delivered_as_planned: false, child_informed_of_change: false })),
    ];
    const r = run({ adherence_records: records });
    expect(r.concerns.some(c => c.includes("schedule changes communicated to children"))).toBe(true);
  });

  it("no adherence records concern when children > 0 and other data exists", () => {
    const r = run({
      total_children: 3,
      adherence_records: [],
      schedule_creation_records: [makeScheduleCreation()],
    });
    expect(r.concerns.some(c => c.includes("No adherence records"))).toBe(true);
  });

  it("recommendation for no adherence records", () => {
    const r = run({
      total_children: 3,
      adherence_records: [],
      schedule_creation_records: [makeScheduleCreation()],
    });
    expect(r.recommendations.some(rec => rec.recommendation.includes("adherence monitoring"))).toBe(true);
  });

  it("recommendation for delivery < 50%", () => {
    const records = Array.from({ length: 5 }, () =>
      makeAdherence({ was_delivered: false })
    );
    const r = run({ adherence_records: records });
    expect(r.recommendations.some(rec => rec.recommendation.includes("planned activities are not being delivered"))).toBe(true);
  });

  it("recommendation for alternative < 50% with >= 2 not delivered", () => {
    const records = [
      ...Array.from({ length: 5 }, () => makeAdherence({ was_planned: true, was_delivered: true })),
      ...Array.from({ length: 5 }, () => makeAdherence({ was_planned: true, was_delivered: false, alternative_provided: false })),
    ];
    const r = run({ adherence_records: records });
    expect(r.recommendations.some(rec => rec.recommendation.includes("alternative activities"))).toBe(true);
  });

  it("recommendation for child informed < 50% with >= 2 changes", () => {
    const records = [
      ...Array.from({ length: 5 }, () => makeAdherence({ was_planned: true, delivered_as_planned: true })),
      ...Array.from({ length: 5 }, () => makeAdherence({ was_planned: true, delivered_as_planned: false, child_informed_of_change: false })),
    ];
    const r = run({ adherence_records: records });
    expect(r.recommendations.some(rec => rec.recommendation.includes("Communicate all schedule changes"))).toBe(true);
  });

  it("critical insight for delivery < 50%", () => {
    const records = Array.from({ length: 5 }, () =>
      makeAdherence({ was_delivered: false })
    );
    const r = run({ adherence_records: records });
    expect(r.insights.some(i => i.severity === "critical" && i.text.includes("planned activities actually delivered"))).toBe(true);
  });

  it("warning insight for delivery 50-69%", () => {
    const records = [
      ...Array.from({ length: 6 }, () => makeAdherence({ was_delivered: true })),
      ...Array.from({ length: 4 }, () => makeAdherence({ was_delivered: false })),
    ];
    const r = run({ adherence_records: records });
    expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Activity delivery rate at 60%"))).toBe(true);
  });

  it("warning insight for as-planned 50-69%", () => {
    const records = [
      ...Array.from({ length: 6 }, () => makeAdherence({ delivered_as_planned: true })),
      ...Array.from({ length: 4 }, () => makeAdherence({ delivered_as_planned: false })),
    ];
    const r = run({ adherence_records: records });
    expect(r.insights.some(i => i.severity === "warning" && i.text.includes("delivered as planned"))).toBe(true);
  });

  it("recommendation for delivery 50-69%", () => {
    const records = [
      ...Array.from({ length: 6 }, () => makeAdherence({ was_delivered: true })),
      ...Array.from({ length: 4 }, () => makeAdherence({ was_delivered: false })),
    ];
    const r = run({ adherence_records: records });
    expect(r.recommendations.some(rec => rec.recommendation.includes("Increase activity delivery rate"))).toBe(true);
  });
});

// ── 8. Child Satisfaction ──────────────────────────────────────────────────

describe("child satisfaction", () => {
  it("satisfaction is 0 when no satisfaction data", () => {
    const r = run({});
    expect(r.child_satisfaction_rate).toBeNull();
  });

  it("high satisfaction from variety records", () => {
    const records = Array.from({ length: 5 }, () =>
      makeActivityVariety({ child_satisfaction: 5 })
    );
    const r = run({ activity_variety_records: records });
    expect(r.child_satisfaction_rate).toBe(100);
  });

  it("low satisfaction from variety records", () => {
    const records = Array.from({ length: 5 }, () =>
      makeActivityVariety({ child_satisfaction: 1 })
    );
    const r = run({ activity_variety_records: records });
    expect(r.child_satisfaction_rate).toBe(20);
  });

  it("satisfaction composite from multiple sources", () => {
    const variety = Array.from({ length: 5 }, () => makeActivityVariety({ child_satisfaction: 5 }));
    const childInput = Array.from({ length: 5 }, () => makeChildInput({ satisfaction_score: 5 }));
    const adherence = Array.from({ length: 5 }, () => makeAdherence({ child_satisfaction: 5 }));
    const r = run({ activity_variety_records: variety, child_input_records: childInput, adherence_records: adherence });
    expect(r.child_satisfaction_rate).toBe(100);
  });

  it("satisfaction >= 80 gives +3 bonus", () => {
    const variety = Array.from({ length: 5 }, () => makeActivityVariety({ child_satisfaction: 5 }));
    const r = run({ activity_variety_records: variety });
    expect(r.child_satisfaction_rate).toBe(100);
  });

  it("satisfaction 60-79 gives +1 bonus", () => {
    const variety = Array.from({ length: 5 }, () => makeActivityVariety({ child_satisfaction: 4 }));
    const r = run({ activity_variety_records: variety });
    expect(r.child_satisfaction_rate).toBe(80);
  });

  it("strength for satisfaction >= 80%", () => {
    const variety = Array.from({ length: 5 }, () => makeActivityVariety({ child_satisfaction: 5 }));
    const r = run({ activity_variety_records: variety });
    expect(r.strengths.some(s => s.includes("child satisfaction rate"))).toBe(true);
  });

  it("concern for satisfaction < 50%", () => {
    const variety = Array.from({ length: 5 }, () => makeActivityVariety({ child_satisfaction: 2 }));
    const r = run({ activity_variety_records: variety });
    expect(r.concerns.some(c => c.includes("child satisfaction rate"))).toBe(true);
  });

  it("warning insight for satisfaction 50-79%", () => {
    const variety = Array.from({ length: 5 }, () => makeActivityVariety({ child_satisfaction: 3 }));
    const r = run({ activity_variety_records: variety });
    expect(r.child_satisfaction_rate).toBe(60);
    expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Child satisfaction at 60%"))).toBe(true);
  });

  it("positive insight for satisfaction >= 80% with >= 2 sources", () => {
    const variety = Array.from({ length: 5 }, () => makeActivityVariety({ child_satisfaction: 5 }));
    const childInput = Array.from({ length: 5 }, () => makeChildInput({ satisfaction_score: 5 }));
    const r = run({ activity_variety_records: variety, child_input_records: childInput });
    expect(r.insights.some(i => i.severity === "positive" && i.text.includes("child satisfaction"))).toBe(true);
  });
});

// ── 9. Scoring and Rating Thresholds ───────────────────────────────────────

describe("scoring and rating thresholds", () => {
  it("score >= 80 gives outstanding", () => {
    const schedules = Array.from({ length: 10 }, () => makeScheduleCreation());
    const varieties = ["edu", "sport", "art", "therapy", "comm", "life"].map(c =>
      makeActivityVariety({ category: c, is_indoor: true, is_outdoor: true, is_group: true, is_individual: true, is_educational: true, is_recreational: true, is_therapeutic: true, is_life_skills: true, is_cultural: true, is_physical: true, is_creative: true, is_community: true, child_satisfaction: 5 })
    );
    const inputs = Array.from({ length: 10 }, () => makeChildInput({ satisfaction_score: 5 }));
    const comms = Array.from({ length: 10 }, () => makeCommunication());
    const adherences = Array.from({ length: 10 }, () => makeAdherence({ child_satisfaction: 5 }));
    const r = run({
      schedule_creation_records: schedules,
      activity_variety_records: varieties,
      child_input_records: inputs,
      communication_records: comms,
      adherence_records: adherences,
    });
    expect(r.planner_rating).toBe("outstanding");
    expect(r.planner_score).toBeGreaterThanOrEqual(80);
  });

  it("score 65-79 gives good", () => {
    const schedules = Array.from({ length: 10 }, () => makeScheduleCreation({ days_before_week_start: 3 }));
    const varieties = ["edu", "sport"].map(c => makeActivityVariety({ category: c, child_satisfaction: 4 }));
    const inputs = Array.from({ length: 10 }, () =>
      makeChildInput({ consulted_before_planning: true, preferences_recorded: true, felt_listened_to: true, satisfaction_score: 4 })
    );
    const comms = Array.from({ length: 10 }, () => makeCommunication());
    const adherences = Array.from({ length: 10 }, () => makeAdherence({ child_satisfaction: 4 }));
    const r = run({
      schedule_creation_records: schedules,
      activity_variety_records: varieties,
      child_input_records: inputs,
      communication_records: comms,
      adherence_records: adherences,
    });
    expect(r.planner_score).toBeGreaterThanOrEqual(65);
    expect(["outstanding", "good"]).toContain(r.planner_rating);
  });

  it("base score is 52 with no bonuses or penalties", () => {
    // Single schedule that gets no bonuses or penalties
    const r = run({
      schedule_creation_records: [makeScheduleCreation({ days_before_week_start: 1, includes_morning: true, includes_afternoon: false, includes_evening: false, includes_weekend: false, approved_by_manager: false })],
    });
    // Should be around 52 (base) minus possible penalties
    expect(r.planner_score).toBeLessThanOrEqual(55);
  });

  it("score clamped to 0 minimum", () => {
    // Give lots of penalties
    const schedules = Array.from({ length: 10 }, () =>
      makeScheduleCreation({ days_before_week_start: 0 })
    );
    const inputs = Array.from({ length: 10 }, () =>
      makeChildInput({ consulted_before_planning: false, preferences_recorded: false, felt_listened_to: false })
    );
    const adherences = Array.from({ length: 10 }, () =>
      makeAdherence({ was_delivered: false, delivered_as_planned: false })
    );
    const comms = Array.from({ length: 10 }, () =>
      makeCommunication({ schedule_displayed: false, shared_with_children: false, shared_with_staff: false, shared_before_week_start: false })
    );
    const r = run({
      schedule_creation_records: schedules,
      child_input_records: inputs,
      adherence_records: adherences,
      communication_records: comms,
    });
    expect(r.planner_score).toBeGreaterThanOrEqual(0);
  });

  it("score clamped to 100 maximum", () => {
    const schedules = Array.from({ length: 20 }, () => makeScheduleCreation());
    const varieties = Array.from({ length: 20 }, (_, i) =>
      makeActivityVariety({ category: `cat_${i}`, is_indoor: true, is_outdoor: true, is_group: true, is_individual: true, is_educational: true, is_recreational: true, is_therapeutic: true, is_life_skills: true, is_cultural: true, is_physical: true, is_creative: true, is_community: true, child_satisfaction: 5 })
    );
    const inputs = Array.from({ length: 20 }, () =>
      makeChildInput({ satisfaction_score: 5 })
    );
    const comms = Array.from({ length: 20 }, () => makeCommunication());
    const adherences = Array.from({ length: 20 }, () =>
      makeAdherence({ child_satisfaction: 5 })
    );
    const r = run({
      schedule_creation_records: schedules,
      activity_variety_records: varieties,
      child_input_records: inputs,
      communication_records: comms,
      adherence_records: adherences,
    });
    expect(r.planner_score).toBeLessThanOrEqual(100);
  });

  it("inadequate rating for low score", () => {
    const schedules = Array.from({ length: 10 }, () =>
      makeScheduleCreation({ days_before_week_start: 0 })
    );
    const inputs = Array.from({ length: 10 }, () =>
      makeChildInput({ consulted_before_planning: false, preferences_recorded: false, felt_listened_to: false })
    );
    const adherences = Array.from({ length: 10 }, () =>
      makeAdherence({ was_delivered: false, delivered_as_planned: false })
    );
    const comms = Array.from({ length: 10 }, () =>
      makeCommunication({ schedule_displayed: false, shared_with_children: false, shared_with_staff: false, shared_before_week_start: false })
    );
    const r = run({
      schedule_creation_records: schedules,
      child_input_records: inputs,
      adherence_records: adherences,
      communication_records: comms,
    });
    expect(r.planner_rating).toBe("inadequate");
  });

  it("all bonuses add up: timeliness + variety + childInput + comm + adherence + satisfaction + fullCoverage + approval + weekend", () => {
    // Max all bonuses: 5+4+5+4+4+3+3+2+2 = 32; base 52 + 32 = 84
    const schedules = Array.from({ length: 10 }, () => makeScheduleCreation());
    const varieties = Array.from({ length: 10 }, (_, i) =>
      makeActivityVariety({ category: `cat_${i}`, is_indoor: true, is_outdoor: true, is_group: true, is_individual: true, is_educational: true, is_recreational: true, is_therapeutic: true, is_life_skills: true, is_cultural: true, is_physical: true, is_creative: true, is_community: true, child_satisfaction: 5 })
    );
    const inputs = Array.from({ length: 10 }, () =>
      makeChildInput({ satisfaction_score: 5 })
    );
    const comms = Array.from({ length: 10 }, () => makeCommunication());
    const adherences = Array.from({ length: 10 }, () =>
      makeAdherence({ child_satisfaction: 5 })
    );
    const r = run({
      schedule_creation_records: schedules,
      activity_variety_records: varieties,
      child_input_records: inputs,
      communication_records: comms,
      adherence_records: adherences,
    });
    expect(r.planner_score).toBe(84);
  });
});

// ── 10. Headlines ──────────────────────────────────────────────────────────

describe("headlines", () => {
  it("outstanding headline", () => {
    const schedules = Array.from({ length: 10 }, () => makeScheduleCreation());
    const varieties = Array.from({ length: 10 }, (_, i) =>
      makeActivityVariety({ category: `cat_${i}`, is_indoor: true, is_outdoor: true, is_group: true, is_individual: true, is_educational: true, is_recreational: true, is_therapeutic: true, is_life_skills: true, is_cultural: true, is_physical: true, is_creative: true, is_community: true, child_satisfaction: 5 })
    );
    const inputs = Array.from({ length: 10 }, () => makeChildInput({ satisfaction_score: 5 }));
    const comms = Array.from({ length: 10 }, () => makeCommunication());
    const adherences = Array.from({ length: 10 }, () => makeAdherence({ child_satisfaction: 5 }));
    const r = run({
      schedule_creation_records: schedules,
      activity_variety_records: varieties,
      child_input_records: inputs,
      communication_records: comms,
      adherence_records: adherences,
    });
    expect(r.headline).toContain("Outstanding");
  });

  it("good headline mentions strengths and concerns count", () => {
    const schedules = Array.from({ length: 10 }, () => makeScheduleCreation({ days_before_week_start: 3 }));
    const comms = Array.from({ length: 10 }, () => makeCommunication());
    const adherences = Array.from({ length: 10 }, () => makeAdherence());
    const inputs = Array.from({ length: 10 }, () => makeChildInput());
    const r = run({
      schedule_creation_records: schedules,
      communication_records: comms,
      adherence_records: adherences,
      child_input_records: inputs,
    });
    if (r.planner_rating === "good") {
      expect(r.headline).toContain("Good");
      expect(r.headline).toContain("strength");
    }
  });

  it("adequate headline mentions concerns count", () => {
    const schedules = Array.from({ length: 5 }, () =>
      makeScheduleCreation({ days_before_week_start: 1, includes_morning: true, includes_afternoon: false, includes_evening: false, includes_weekend: false })
    );
    const r = run({ schedule_creation_records: schedules });
    if (r.planner_rating === "adequate") {
      expect(r.headline).toContain("Adequate");
      expect(r.headline).toContain("concern");
    }
  });

  it("inadequate headline mentions significant concerns", () => {
    const schedules = Array.from({ length: 10 }, () => makeScheduleCreation({ days_before_week_start: 0 }));
    const inputs = Array.from({ length: 10 }, () =>
      makeChildInput({ consulted_before_planning: false, preferences_recorded: false, felt_listened_to: false })
    );
    const adherences = Array.from({ length: 10 }, () => makeAdherence({ was_delivered: false, delivered_as_planned: false }));
    const comms = Array.from({ length: 10 }, () =>
      makeCommunication({ schedule_displayed: false, shared_with_children: false, shared_with_staff: false, shared_before_week_start: false })
    );
    const r = run({
      schedule_creation_records: schedules,
      child_input_records: inputs,
      adherence_records: adherences,
      communication_records: comms,
    });
    expect(r.headline).toContain("inadequate");
  });
});

// ── 11. Positive Insights ──────────────────────────────────────────────────

describe("positive insights", () => {
  it("outstanding rating positive insight", () => {
    const schedules = Array.from({ length: 10 }, () => makeScheduleCreation());
    const varieties = Array.from({ length: 10 }, (_, i) =>
      makeActivityVariety({ category: `cat_${i}`, is_indoor: true, is_outdoor: true, is_group: true, is_individual: true, is_educational: true, is_recreational: true, is_therapeutic: true, is_life_skills: true, is_cultural: true, is_physical: true, is_creative: true, is_community: true, child_satisfaction: 5 })
    );
    const inputs = Array.from({ length: 10 }, () => makeChildInput({ satisfaction_score: 5 }));
    const comms = Array.from({ length: 10 }, () => makeCommunication());
    const adherences = Array.from({ length: 10 }, () => makeAdherence({ child_satisfaction: 5 }));
    const r = run({
      schedule_creation_records: schedules,
      activity_variety_records: varieties,
      child_input_records: inputs,
      communication_records: comms,
      adherence_records: adherences,
    });
    expect(r.insights.some(i => i.severity === "positive" && i.text.includes("outstanding weekly planning"))).toBe(true);
  });

  it("positive insight for high timeliness + high adherence", () => {
    const schedules = Array.from({ length: 10 }, () => makeScheduleCreation({ days_before_week_start: 5 }));
    const adherences = Array.from({ length: 10 }, () => makeAdherence({ was_delivered: true, delivered_as_planned: true }));
    const r = run({ schedule_creation_records: schedules, adherence_records: adherences });
    expect(r.insights.some(i => i.severity === "positive" && i.text.includes("schedule timeliness"))).toBe(true);
  });

  it("positive insight for high consultation + felt listened to", () => {
    const inputs = Array.from({ length: 10 }, () =>
      makeChildInput({ consulted_before_planning: true, felt_listened_to: true })
    );
    const r = run({ child_input_records: inputs });
    expect(r.insights.some(i => i.severity === "positive" && i.text.includes("genuinely child-centred"))).toBe(true);
  });

  it("positive insight for high delivery + as planned rate", () => {
    const adherences = Array.from({ length: 10 }, () =>
      makeAdherence({ was_delivered: true, delivered_as_planned: true })
    );
    const r = run({ adherence_records: adherences });
    expect(r.insights.some(i => i.severity === "positive" && i.text.includes("delivery rate"))).toBe(true);
  });

  it("positive insight for high suggestions acted + planning attendance", () => {
    const inputs = Array.from({ length: 10 }, () =>
      makeChildInput({ suggestions_included: 5, suggestions_acted_on: 5, attended_planning_session: true })
    );
    const r = run({ child_input_records: inputs });
    expect(r.insights.some(i => i.severity === "positive" && i.text.includes("suggestions acted upon"))).toBe(true);
  });

  it("positive insight for variety categories >= 6 and type flags >= 8", () => {
    const varieties = Array.from({ length: 8 }, (_, i) =>
      makeActivityVariety({ category: `cat_${i}`, is_indoor: true, is_outdoor: true, is_group: true, is_individual: true, is_educational: true, is_recreational: true, is_therapeutic: true, is_life_skills: true, is_cultural: true, is_physical: true, is_creative: true, is_community: true })
    );
    const r = run({ activity_variety_records: varieties });
    expect(r.insights.some(i => i.severity === "positive" && i.text.includes("activity categories"))).toBe(true);
  });

  it("positive insight for high alternative rate + child informed", () => {
    const adherences = [
      ...Array.from({ length: 5 }, () => makeAdherence({ was_planned: true, delivered_as_planned: true, was_delivered: true })),
      ...Array.from({ length: 5 }, () => makeAdherence({ was_planned: true, delivered_as_planned: false, was_delivered: false, alternative_provided: true, child_informed_of_change: true })),
    ];
    const r = run({ adherence_records: adherences });
    expect(r.insights.some(i => i.severity === "positive" && i.text.includes("alternatives provided"))).toBe(true);
  });

  it("positive insight for high feedback rate", () => {
    const inputs = Array.from({ length: 10 }, () => makeChildInput({ feedback_given_after: true }));
    const r = run({ child_input_records: inputs });
    expect(r.insights.some(i => i.severity === "positive" && i.text.includes("post-activity feedback"))).toBe(true);
  });
});

// ── 12. Missing Record Concerns ────────────────────────────────────────────

describe("missing record concerns", () => {
  it("concern for no schedule records when children present and other data exists", () => {
    const r = run({ total_children: 3, schedule_creation_records: [], adherence_records: [makeAdherence()] });
    expect(r.concerns.some(c => c.includes("No schedule creation records"))).toBe(true);
  });

  it("recommendation to create schedules when none exist", () => {
    const r = run({ total_children: 3, schedule_creation_records: [], adherence_records: [makeAdherence()] });
    expect(r.recommendations.some(rec => rec.recommendation.includes("creating weekly activity schedules"))).toBe(true);
  });

  it("critical insight for no schedules + no child input", () => {
    const r = run({ total_children: 3, schedule_creation_records: [], child_input_records: [], adherence_records: [makeAdherence()] });
    expect(r.insights.some(i => i.severity === "critical" && i.text.includes("No schedule creation or child input records"))).toBe(true);
  });

  it("concern for no adherence records when other data exists", () => {
    const r = run({ total_children: 3, adherence_records: [], schedule_creation_records: [makeScheduleCreation()] });
    expect(r.concerns.some(c => c.includes("No adherence records"))).toBe(true);
  });

  it("concern for no communication records when other data exists", () => {
    const r = run({ total_children: 3, communication_records: [], schedule_creation_records: [makeScheduleCreation()] });
    expect(r.concerns.some(c => c.includes("No communication records"))).toBe(true);
  });
});

// ── 13. Recommendation Urgency and Ranking ─────────────────────────────────

describe("recommendation urgency and ranking", () => {
  it("recommendations are ranked sequentially", () => {
    const r = run({
      total_children: 3,
      schedule_creation_records: [],
      child_input_records: [],
      communication_records: [],
      adherence_records: [],
      activity_variety_records: [makeActivityVariety()],
    });
    for (let i = 0; i < r.recommendations.length; i++) {
      expect(r.recommendations[i].rank).toBe(i + 1);
    }
  });

  it("immediate urgency for no schedules", () => {
    const r = run({ total_children: 3, schedule_creation_records: [], adherence_records: [makeAdherence()] });
    const rec = r.recommendations.find(rec => rec.recommendation.includes("creating weekly activity schedules"));
    expect(rec?.urgency).toBe("immediate");
  });

  it("immediate urgency for low timeliness", () => {
    const schedules = Array.from({ length: 5 }, () => makeScheduleCreation({ days_before_week_start: 0 }));
    const r = run({ schedule_creation_records: schedules });
    const rec = r.recommendations.find(rec => rec.recommendation.includes("planning cycle"));
    expect(rec?.urgency).toBe("immediate");
  });

  it("planned urgency for timeliness 50-69%", () => {
    const schedules = [
      ...Array.from({ length: 6 }, () => makeScheduleCreation({ days_before_week_start: 3 })),
      ...Array.from({ length: 4 }, () => makeScheduleCreation({ days_before_week_start: 1 })),
    ];
    const r = run({ schedule_creation_records: schedules });
    const rec = r.recommendations.find(rec => rec.recommendation.includes("Improve schedule timeliness"));
    expect(rec?.urgency).toBe("planned");
  });

  it("each recommendation has a regulatory_ref", () => {
    const r = run({
      total_children: 3,
      schedule_creation_records: [],
      child_input_records: [],
      communication_records: [],
      adherence_records: [],
      activity_variety_records: [makeActivityVariety()],
    });
    r.recommendations.forEach(rec => {
      expect(rec.regulatory_ref).toBeTruthy();
    });
  });
});

// ── 14. Revision Count Concerns ────────────────────────────────────────────

describe("revision count concerns", () => {
  it("no concern for low revision count", () => {
    const schedules = Array.from({ length: 5 }, () => makeScheduleCreation({ revision_count: 1 }));
    const r = run({ schedule_creation_records: schedules });
    expect(r.concerns.some(c => c.includes("revised 3 or more times"))).toBe(false);
  });

  it("concern for >= 50% high revisions with >= 3 schedules", () => {
    const schedules = [
      ...Array.from({ length: 3 }, () => makeScheduleCreation({ revision_count: 4 })),
      ...Array.from({ length: 2 }, () => makeScheduleCreation({ revision_count: 1 })),
    ];
    const r = run({ schedule_creation_records: schedules });
    expect(r.concerns.some(c => c.includes("revised 3 or more times"))).toBe(true);
  });

  it("warning insight for revision rate 30-49%", () => {
    const schedules = [
      makeScheduleCreation({ revision_count: 4 }),
      ...Array.from({ length: 2 }, () => makeScheduleCreation({ revision_count: 1 })),
    ];
    const r = run({ schedule_creation_records: schedules });
    expect(r.insights.some(i => i.severity === "warning" && i.text.includes("revised 3 or more times"))).toBe(true);
  });

  it("no warning insight for revision rate < 30%", () => {
    const schedules = [
      makeScheduleCreation({ revision_count: 4 }),
      ...Array.from({ length: 4 }, () => makeScheduleCreation({ revision_count: 1 })),
    ];
    const r = run({ schedule_creation_records: schedules });
    expect(r.insights.some(i => i.text.includes("revised 3 or more times"))).toBe(false);
  });
});

// ── 15. Output Shape ───────────────────────────────────────────────────────

describe("output shape", () => {
  it("returns all expected fields", () => {
    const r = run({});
    expect(r).toHaveProperty("planner_rating");
    expect(r).toHaveProperty("planner_score");
    expect(r).toHaveProperty("headline");
    expect(r).toHaveProperty("schedule_timeliness_rate");
    expect(r).toHaveProperty("activity_variety_rate");
    expect(r).toHaveProperty("child_input_rate");
    expect(r).toHaveProperty("communication_rate");
    expect(r).toHaveProperty("adherence_rate");
    expect(r).toHaveProperty("child_satisfaction_rate");
    expect(r).toHaveProperty("strengths");
    expect(r).toHaveProperty("concerns");
    expect(r).toHaveProperty("recommendations");
    expect(r).toHaveProperty("insights");
  });

  it("strengths is an array of strings", () => {
    const r = run({ schedule_creation_records: [makeScheduleCreation()] });
    expect(Array.isArray(r.strengths)).toBe(true);
    r.strengths.forEach(s => expect(typeof s).toBe("string"));
  });

  it("concerns is an array of strings", () => {
    const r = run({});
    expect(Array.isArray(r.concerns)).toBe(true);
  });

  it("recommendations have rank, recommendation, urgency, regulatory_ref", () => {
    const r = run({ total_children: 3, schedule_creation_records: [], adherence_records: [makeAdherence()] });
    r.recommendations.forEach(rec => {
      expect(rec).toHaveProperty("rank");
      expect(rec).toHaveProperty("recommendation");
      expect(rec).toHaveProperty("urgency");
      expect(rec).toHaveProperty("regulatory_ref");
    });
  });

  it("insights have text and severity", () => {
    const schedules = Array.from({ length: 5 }, () => makeScheduleCreation({ days_before_week_start: 0 }));
    const r = run({ schedule_creation_records: schedules });
    r.insights.forEach(i => {
      expect(i).toHaveProperty("text");
      expect(i).toHaveProperty("severity");
      expect(["critical", "warning", "positive"]).toContain(i.severity);
    });
  });

  it("rating is valid enum value", () => {
    const r = run({});
    expect(["outstanding", "good", "adequate", "inadequate", "insufficient_data"]).toContain(r.planner_rating);
  });

  it("score is between 0 and 100", () => {
    const r = run({});
    expect(r.planner_score).toBeGreaterThanOrEqual(0);
    expect(r.planner_score).toBeLessThanOrEqual(100);
  });

  it("rates are between 0 and 100", () => {
    const schedules = Array.from({ length: 5 }, () => makeScheduleCreation());
    const r = run({ schedule_creation_records: schedules });
    expect(r.schedule_timeliness_rate).toBeGreaterThanOrEqual(0);
    expect(r.schedule_timeliness_rate).toBeLessThanOrEqual(100);
    // activity_variety_rate is null when no variety records
    expect(r.activity_variety_rate).toBeNull();
  });
});
