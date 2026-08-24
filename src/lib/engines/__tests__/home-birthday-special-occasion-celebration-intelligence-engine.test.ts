// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME BIRTHDAY & SPECIAL OCCASION CELEBRATION INTELLIGENCE ENGINE TESTS
// Comprehensive test suite covering birthday planning, celebration execution,
// gift provision, memory-making, child satisfaction, scoring, bonuses,
// penalties, strengths, concerns, recommendations, insights, and edge cases.
// CHR 2015 Reg 5, Reg 7, SCCIF "Experiences and progress of children".
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeBirthdaySpecialOccasionCelebration,
  type BirthdayCelebrationInput,
  type BirthdayPlanRecordInput,
  type CelebrationExecutionRecordInput,
  type GiftProvisionRecordInput,
  type MemoryMakingRecordInput,
  type ChildSatisfactionRecordInput,
} from "../home-birthday-special-occasion-celebration-intelligence-engine";

const TODAY = "2026-05-25";

// ── Factories ───────────────────────────────────────────────────────────────

let _id = 0;
function uid(): string {
  return `test_${++_id}`;
}

function makeBirthdayPlan(
  overrides: Partial<BirthdayPlanRecordInput> = {},
): BirthdayPlanRecordInput {
  return {
    id: uid(),
    child_id: "child_1",
    child_name: "Alex",
    birthday_date: "2026-06-15",
    plan_created: true,
    plan_created_date: "2026-06-01",
    days_advance_planned: 14,
    child_consulted: true,
    child_wishes_documented: true,
    child_chose_theme: true,
    child_chose_guests: true,
    child_chose_food: true,
    child_chose_activity: true,
    budget_allocated: true,
    budget_amount: 100,
    cultural_considerations_documented: true,
    dietary_needs_considered: true,
    family_contact_arranged: true,
    social_worker_notified: true,
    plan_reviewed_by_manager: true,
    special_requests_noted: ["chocolate cake"],
    special_requests_fulfilled: ["chocolate cake"],
    notes: "",
    created_at: "2026-06-01",
    ...overrides,
  };
}

function makeCelebration(
  overrides: Partial<CelebrationExecutionRecordInput> = {},
): CelebrationExecutionRecordInput {
  return {
    id: uid(),
    child_id: "child_1",
    celebration_type: "birthday",
    date: "2026-06-15",
    celebration_held: true,
    held_on_actual_date: true,
    venue: "in_home",
    guests_invited: 5,
    guests_attended: 4,
    staff_participated: true,
    staff_enthusiasm_rating: 5,
    peers_participated: true,
    peers_count: 3,
    family_attended: true,
    family_members_count: 2,
    decorations_provided: true,
    cake_or_treat_provided: true,
    personalised_to_child: true,
    child_led_planning: true,
    celebration_duration_minutes: 120,
    atmosphere_rating: 5,
    cultural_appropriateness: true,
    inclusive_of_all_children: true,
    safeguarding_considered: true,
    risk_assessment_completed: true,
    notes: "",
    created_at: "2026-06-15",
    ...overrides,
  };
}

function makeGift(
  overrides: Partial<GiftProvisionRecordInput> = {},
): GiftProvisionRecordInput {
  return {
    id: uid(),
    child_id: "child_1",
    occasion: "birthday",
    date: "2026-06-15",
    gift_provided: true,
    gift_personalised: true,
    child_preferences_considered: true,
    age_appropriate: true,
    budget_adequate: true,
    budget_amount: 50,
    gift_wrapped: true,
    presented_thoughtfully: true,
    child_reaction_positive: true,
    equitable_with_peers: true,
    family_contribution_enabled: true,
    social_worker_contribution_enabled: true,
    receipt_documented: true,
    savings_contribution_made: true,
    notes: "",
    created_at: "2026-06-15",
    ...overrides,
  };
}

function makeMemory(
  overrides: Partial<MemoryMakingRecordInput> = {},
): MemoryMakingRecordInput {
  return {
    id: uid(),
    child_id: "child_1",
    celebration_id: "celeb_1",
    activity_type: "photo",
    date: "2026-06-15",
    activity_completed: true,
    child_participated: true,
    child_consented: true,
    memory_stored_securely: true,
    added_to_life_story: true,
    shared_with_family: true,
    child_has_copy: true,
    quality_rating: 5,
    staff_facilitated: true,
    peers_involved: true,
    notes: "",
    created_at: "2026-06-15",
    ...overrides,
  };
}

function makeSatisfaction(
  overrides: Partial<ChildSatisfactionRecordInput> = {},
): ChildSatisfactionRecordInput {
  return {
    id: uid(),
    child_id: "child_1",
    celebration_id: "celeb_1",
    celebration_type: "birthday",
    date: "2026-06-15",
    overall_satisfaction: 5,
    felt_special: true,
    felt_listened_to: true,
    would_change_anything: false,
    change_suggestions: [],
    favourite_moment: "The cake",
    felt_included: true,
    felt_equal_to_peers: true,
    celebration_matched_wishes: true,
    child_voice_captured: true,
    feedback_acted_upon: true,
    follow_up_completed: true,
    notes: "",
    created_at: "2026-06-15",
    ...overrides,
  };
}

function baseInput(
  overrides: Partial<BirthdayCelebrationInput> = {},
): BirthdayCelebrationInput {
  return {
    today: TODAY,
    total_children: 3,
    birthday_plan_records: [],
    celebration_execution_records: [],
    gift_provision_records: [],
    memory_making_records: [],
    child_satisfaction_records: [],
    ...overrides,
  };
}

function run(overrides: Partial<BirthdayCelebrationInput> = {}) {
  return computeBirthdaySpecialOccasionCelebration(baseInput(overrides));
}

// Helper: create N records with given factory and overrides
function makeN<T>(n: number, factory: (o?: any) => T, overrides: Partial<T> = {}): T[] {
  return Array.from({ length: n }, () => factory(overrides));
}

// ══════════════════════════════════════════════════════════════════════════════
// 1. INSUFFICIENT DATA
// ══════════════════════════════════════════════════════════════════════════════

describe("insufficient_data", () => {
  it("returns insufficient_data when all arrays empty and total_children=0", () => {
    const r = run({ total_children: 0 });
    expect(r.celebration_rating).toBe("insufficient_data");
    expect(r.celebration_score).toBe(0);
    expect(r.headline).toContain("insufficient data");
    expect(r.birthday_planning_rate).toBe(0);
    expect(r.celebration_execution_rate).toBe(0);
    expect(r.gift_provision_rate).toBe(0);
    expect(r.memory_making_rate).toBe(0);
    expect(r.child_satisfaction_rate).toBe(0);
    expect(r.child_choice_rate).toBe(0);
    expect(r.strengths).toHaveLength(0);
    expect(r.concerns).toHaveLength(0);
    expect(r.recommendations).toHaveLength(0);
    expect(r.insights).toHaveLength(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. INADEQUATE FLOOR — children present, all arrays empty
// ══════════════════════════════════════════════════════════════════════════════

describe("inadequate floor (children present, no records)", () => {
  it("returns inadequate with score=15 when children>0 and all arrays empty", () => {
    const r = run({ total_children: 4 });
    expect(r.celebration_rating).toBe("inadequate");
    expect(r.celebration_score).toBe(15);
  });

  it("headline mentions no data recorded", () => {
    const r = run({ total_children: 2 });
    expect(r.headline).toContain("No birthday or celebration data recorded");
  });

  it("produces exactly 1 concern about no records", () => {
    const r = run({ total_children: 1 });
    expect(r.concerns).toHaveLength(1);
    expect(r.concerns[0]).toContain("No birthday plans");
  });

  it("produces exactly 2 recommendations", () => {
    const r = run({ total_children: 3 });
    expect(r.recommendations).toHaveLength(2);
    expect(r.recommendations[0].urgency).toBe("immediate");
    expect(r.recommendations[1].urgency).toBe("immediate");
    expect(r.recommendations[0].rank).toBe(1);
    expect(r.recommendations[1].rank).toBe(2);
  });

  it("produces exactly 1 critical insight about absent records", () => {
    const r = run({ total_children: 1 });
    expect(r.insights).toHaveLength(1);
    expect(r.insights[0].severity).toBe("critical");
    expect(r.insights[0].text).toContain("complete absence");
  });

  it("all rates are 0", () => {
    const r = run({ total_children: 5 });
    expect(r.birthday_planning_rate).toBe(0);
    expect(r.celebration_execution_rate).toBe(0);
    expect(r.gift_provision_rate).toBe(0);
    expect(r.memory_making_rate).toBe(0);
    expect(r.child_satisfaction_rate).toBe(0);
    expect(r.child_choice_rate).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. OUTSTANDING SCENARIO
// ══════════════════════════════════════════════════════════════════════════════

describe("outstanding scenario", () => {
  function outstandingInput(): Partial<BirthdayCelebrationInput> {
    return {
      total_children: 3,
      birthday_plan_records: makeN(10, makeBirthdayPlan),
      celebration_execution_records: makeN(10, makeCelebration),
      gift_provision_records: makeN(10, makeGift),
      memory_making_records: makeN(10, makeMemory),
      child_satisfaction_records: makeN(10, makeSatisfaction),
    };
  }

  it("returns outstanding rating", () => {
    const r = run(outstandingInput());
    expect(r.celebration_rating).toBe("outstanding");
  });

  it("score is >= 80", () => {
    const r = run(outstandingInput());
    expect(r.celebration_score).toBeGreaterThanOrEqual(80);
  });

  it("score is clamped at max 100", () => {
    const r = run(outstandingInput());
    expect(r.celebration_score).toBeLessThanOrEqual(100);
  });

  it("all 6 rates are 100%", () => {
    const r = run(outstandingInput());
    expect(r.birthday_planning_rate).toBe(100);
    expect(r.celebration_execution_rate).toBe(100);
    expect(r.gift_provision_rate).toBe(100);
    expect(r.memory_making_rate).toBe(100);
    expect(r.child_satisfaction_rate).toBe(100);
    expect(r.child_choice_rate).toBe(100);
  });

  it("headline mentions outstanding", () => {
    const r = run(outstandingInput());
    expect(r.headline).toContain("Outstanding");
  });

  it("has strengths and no concerns", () => {
    const r = run(outstandingInput());
    expect(r.strengths.length).toBeGreaterThan(0);
    expect(r.concerns).toHaveLength(0);
  });

  it("has no recommendations when everything is perfect", () => {
    const r = run(outstandingInput());
    expect(r.recommendations).toHaveLength(0);
  });

  it("has positive insights", () => {
    const r = run(outstandingInput());
    const positive = r.insights.filter((i) => i.severity === "positive");
    expect(positive.length).toBeGreaterThan(0);
  });

  it("max score from base 52 + all bonuses = 80", () => {
    // base=52, max bonuses: 4+4+3+3+4+3+3+2+2 = 28 => 52+28 = 80
    const r = run(outstandingInput());
    expect(r.celebration_score).toBe(80);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. GOOD SCENARIO
// ══════════════════════════════════════════════════════════════════════════════

describe("good scenario", () => {
  function goodInput(): Partial<BirthdayCelebrationInput> {
    // 8 out of 10 => 80% for most metrics (>= 70 threshold)
    // But some rates below 90 so lower bonus tier
    const plans = [
      ...makeN(8, makeBirthdayPlan),
      ...makeN(2, makeBirthdayPlan, { plan_created: false, child_consulted: false, child_wishes_documented: false, child_chose_theme: false, child_chose_guests: false, child_chose_food: false, child_chose_activity: false }),
    ];
    const celebs = [
      ...makeN(8, makeCelebration),
      ...makeN(2, makeCelebration, { celebration_held: false, personalised_to_child: false }),
    ];
    const gifts = [
      ...makeN(8, makeGift),
      ...makeN(2, makeGift, { gift_provided: false }),
    ];
    const memories = [
      ...makeN(8, makeMemory),
      ...makeN(2, makeMemory, { activity_completed: false, added_to_life_story: false }),
    ];
    const satisfaction = [
      ...makeN(8, makeSatisfaction),
      ...makeN(2, makeSatisfaction, { overall_satisfaction: 2, felt_special: false }),
    ];
    return {
      total_children: 3,
      birthday_plan_records: plans,
      celebration_execution_records: celebs,
      gift_provision_records: gifts,
      memory_making_records: memories,
      child_satisfaction_records: satisfaction,
    };
  }

  it("returns good rating", () => {
    const r = run(goodInput());
    expect(r.celebration_rating).toBe("good");
  });

  it("score is between 65 and 79 inclusive", () => {
    const r = run(goodInput());
    expect(r.celebration_score).toBeGreaterThanOrEqual(65);
    expect(r.celebration_score).toBeLessThanOrEqual(79);
  });

  it("headline mentions Good", () => {
    const r = run(goodInput());
    expect(r.headline).toContain("Good");
  });

  it("has both strengths and concerns", () => {
    const r = run(goodInput());
    expect(r.strengths.length).toBeGreaterThan(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. ADEQUATE SCENARIO
// ══════════════════════════════════════════════════════════════════════════════

describe("adequate scenario", () => {
  function adequateInput(): Partial<BirthdayCelebrationInput> {
    // 6 out of 10 => 60% for many metrics -- below bonus thresholds
    const plans = [
      ...makeN(6, makeBirthdayPlan),
      ...makeN(4, makeBirthdayPlan, { plan_created: false, child_consulted: false, child_wishes_documented: false, child_chose_theme: false, child_chose_guests: false, child_chose_food: false, child_chose_activity: false }),
    ];
    const celebs = [
      ...makeN(6, makeCelebration),
      ...makeN(4, makeCelebration, { celebration_held: false, personalised_to_child: false }),
    ];
    const gifts = [
      ...makeN(6, makeGift),
      ...makeN(4, makeGift, { gift_provided: false }),
    ];
    const memories = [
      ...makeN(6, makeMemory),
      ...makeN(4, makeMemory, { activity_completed: false, added_to_life_story: false }),
    ];
    const satisfaction = [
      ...makeN(6, makeSatisfaction),
      ...makeN(4, makeSatisfaction, { overall_satisfaction: 2, felt_special: false }),
    ];
    return {
      total_children: 3,
      birthday_plan_records: plans,
      celebration_execution_records: celebs,
      gift_provision_records: gifts,
      memory_making_records: memories,
      child_satisfaction_records: satisfaction,
    };
  }

  it("returns adequate rating", () => {
    const r = run(adequateInput());
    expect(r.celebration_rating).toBe("adequate");
  });

  it("score is between 45 and 64 inclusive", () => {
    const r = run(adequateInput());
    expect(r.celebration_score).toBeGreaterThanOrEqual(45);
    expect(r.celebration_score).toBeLessThanOrEqual(64);
  });

  it("headline mentions Adequate", () => {
    const r = run(adequateInput());
    expect(r.headline).toContain("Adequate");
  });

  it("has concerns", () => {
    const r = run(adequateInput());
    expect(r.concerns.length).toBeGreaterThan(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. INADEQUATE SCENARIO (with records)
// ══════════════════════════════════════════════════════════════════════════════

describe("inadequate scenario (low rates)", () => {
  function inadequateInput(): Partial<BirthdayCelebrationInput> {
    // 2 out of 10 => 20% for everything
    const plans = [
      ...makeN(2, makeBirthdayPlan),
      ...makeN(8, makeBirthdayPlan, { plan_created: false, child_consulted: false, child_wishes_documented: false, child_chose_theme: false, child_chose_guests: false, child_chose_food: false, child_chose_activity: false }),
    ];
    const celebs = [
      ...makeN(2, makeCelebration),
      ...makeN(8, makeCelebration, { celebration_held: false, personalised_to_child: false }),
    ];
    const gifts = [
      ...makeN(2, makeGift),
      ...makeN(8, makeGift, { gift_provided: false, gift_personalised: false }),
    ];
    const memories = [
      ...makeN(2, makeMemory),
      ...makeN(8, makeMemory, { activity_completed: false, added_to_life_story: false }),
    ];
    const satisfaction = [
      ...makeN(2, makeSatisfaction),
      ...makeN(8, makeSatisfaction, { overall_satisfaction: 1, felt_special: false, felt_listened_to: false, felt_equal_to_peers: false, celebration_matched_wishes: false, feedback_acted_upon: false }),
    ];
    return {
      total_children: 3,
      birthday_plan_records: plans,
      celebration_execution_records: celebs,
      gift_provision_records: gifts,
      memory_making_records: memories,
      child_satisfaction_records: satisfaction,
    };
  }

  it("returns inadequate rating", () => {
    const r = run(inadequateInput());
    expect(r.celebration_rating).toBe("inadequate");
  });

  it("score is < 45", () => {
    const r = run(inadequateInput());
    expect(r.celebration_score).toBeLessThan(45);
  });

  it("headline mentions inadequate", () => {
    const r = run(inadequateInput());
    expect(r.headline).toContain("inadequate");
  });

  it("has multiple concerns", () => {
    const r = run(inadequateInput());
    expect(r.concerns.length).toBeGreaterThan(3);
  });

  it("has immediate urgency recommendations", () => {
    const r = run(inadequateInput());
    const immediate = r.recommendations.filter((rec) => rec.urgency === "immediate");
    expect(immediate.length).toBeGreaterThan(0);
  });

  it("has critical insights", () => {
    const r = run(inadequateInput());
    const critical = r.insights.filter((i) => i.severity === "critical");
    expect(critical.length).toBeGreaterThan(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 7. pct() EDGE CASES
// ══════════════════════════════════════════════════════════════════════════════

describe("pct(0,0) = 0 contract", () => {
  it("birthday_planning_rate is 0 when no plan records", () => {
    const r = run({
      total_children: 3,
      celebration_execution_records: [makeCelebration()],
    });
    // Empty population: this asserted the fab-0 the helper used to return.
    expect(r.birthday_planning_rate).toBeNull();
    expect(r.birthday_planning_rate).not.toBe(0); // 0% is a claim; nothing was measured
  });

  it("celebration_execution_rate is 0 when no celebration records", () => {
    const r = run({
      total_children: 3,
      birthday_plan_records: [makeBirthdayPlan()],
    });
    // Empty population: this asserted the fab-0 the helper used to return.
    expect(r.celebration_execution_rate).toBeNull();
    expect(r.celebration_execution_rate).not.toBe(0); // 0% is a claim; nothing was measured
  });

  it("gift_provision_rate is 0 when no gift records", () => {
    const r = run({
      total_children: 3,
      birthday_plan_records: [makeBirthdayPlan()],
    });
    // Empty population: this asserted the fab-0 the helper used to return.
    expect(r.gift_provision_rate).toBeNull();
    expect(r.gift_provision_rate).not.toBe(0); // 0% is a claim; nothing was measured
  });

  it("memory_making_rate is 0 when no memory records", () => {
    const r = run({
      total_children: 3,
      birthday_plan_records: [makeBirthdayPlan()],
    });
    // Empty population: this asserted the fab-0 the helper used to return.
    expect(r.memory_making_rate).toBeNull();
    expect(r.memory_making_rate).not.toBe(0); // 0% is a claim; nothing was measured
  });

  it("child_satisfaction_rate is 0 when no satisfaction records", () => {
    const r = run({
      total_children: 3,
      birthday_plan_records: [makeBirthdayPlan()],
    });
    expect(r.child_satisfaction_rate).toBe(0);
  });

  it("child_choice_rate is 0 when no plan records", () => {
    const r = run({
      total_children: 3,
      celebration_execution_records: [makeCelebration()],
    });
    // Empty population: this asserted the fab-0 the helper used to return.
    expect(r.child_choice_rate).toBeNull();
    expect(r.child_choice_rate).not.toBe(0); // 0% is a claim; nothing was measured
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 8. RATE COMPUTATIONS
// ══════════════════════════════════════════════════════════════════════════════

describe("rate computations", () => {
  it("birthday_planning_rate = pct(plans_created, total_plans)", () => {
    const r = run({
      birthday_plan_records: [
        makeBirthdayPlan({ plan_created: true }),
        makeBirthdayPlan({ plan_created: true }),
        makeBirthdayPlan({ plan_created: false }),
      ],
    });
    expect(r.birthday_planning_rate).toBe(67); // 2/3
  });

  it("celebration_execution_rate = pct(held, total_celebrations)", () => {
    const r = run({
      celebration_execution_records: [
        makeCelebration({ celebration_held: true }),
        makeCelebration({ celebration_held: false }),
        makeCelebration({ celebration_held: true }),
        makeCelebration({ celebration_held: true }),
      ],
    });
    expect(r.celebration_execution_rate).toBe(75);
  });

  it("gift_provision_rate = pct(provided, total_gifts)", () => {
    const r = run({
      gift_provision_records: [
        makeGift({ gift_provided: true }),
        makeGift({ gift_provided: false }),
      ],
    });
    expect(r.gift_provision_rate).toBe(50);
  });

  it("memory_making_rate = pct(completed, total_memories)", () => {
    const r = run({
      memory_making_records: [
        makeMemory({ activity_completed: true }),
        makeMemory({ activity_completed: true }),
        makeMemory({ activity_completed: false }),
        makeMemory({ activity_completed: false }),
        makeMemory({ activity_completed: true }),
      ],
    });
    expect(r.memory_making_rate).toBe(60);
  });

  it("child_satisfaction_rate = pct(satisfaction>=4, total)", () => {
    const r = run({
      child_satisfaction_records: [
        makeSatisfaction({ overall_satisfaction: 5 }),
        makeSatisfaction({ overall_satisfaction: 4 }),
        makeSatisfaction({ overall_satisfaction: 3 }),
        makeSatisfaction({ overall_satisfaction: 2 }),
      ],
    });
    expect(r.child_satisfaction_rate).toBe(50); // 2/4
  });

  it("child_choice_rate across 4 choice fields per plan", () => {
    const r = run({
      birthday_plan_records: [
        makeBirthdayPlan({ child_chose_theme: true, child_chose_guests: true, child_chose_food: false, child_chose_activity: false }),
        makeBirthdayPlan({ child_chose_theme: false, child_chose_guests: false, child_chose_food: false, child_chose_activity: false }),
      ],
    });
    // 2 plans * 4 = 8 total opportunities; 2 choices made => 25%
    expect(r.child_choice_rate).toBe(25);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 9. BONUSES — ISOLATION TESTS
// Each test overrides ALL defaults to only activate the target bonus.
// base=52, no penalties active.
// ══════════════════════════════════════════════════════════════════════════════

describe("bonuses in isolation", () => {
  // For isolation: we need records to produce the right rate for the bonus
  // but ensure all OTHER bonus-triggering rates are below thresholds (0%).
  // Also ensure no penalties fire (rates >= 50 or empty arrays).

  describe("Bonus 1: birthdayPlanningRate", () => {
    it("+4 when birthdayPlanningRate >= 90", () => {
      // 10/10 plans created => 100% planning rate
      // All other arrays empty => no other bonuses, no penalties
      const r = run({
        birthday_plan_records: makeN(10, makeBirthdayPlan, {
          child_chose_theme: false,
          child_chose_guests: false,
          child_chose_food: false,
          child_chose_activity: false,
        }),
      });
      // base=52 + birthday_planning(+4) + child_choice: 40/40=100% -> +3
      // Need to isolate: set child choices to false so childChoiceRate=0
      // Plans have plan_created=true by default, child choices all false => choiceRate=0%
      // No celebrations => celebExec=0 (no penalty, 0 records)
      // No gifts => giftProv=0 (no penalty, 0 records)
      // No memories => memoryMaking=0 (no penalty, 0 records)
      // No satisfaction => childSatisfaction=0 (no penalty, 0 records)
      // personalisationRate: no celebrations => 0
      // feltSpecialRate: no satisfaction => 0
      // lifeStoryRate: no memories => 0
      // No penalties: all guarded by record count > 0
      expect(r.celebration_score).toBe(56); // 52 + 4
    });

    it("+2 when birthdayPlanningRate >= 70 and < 90", () => {
      // 8 out of 10 => 80%
      const plans = [
        ...makeN(8, makeBirthdayPlan, { child_chose_theme: false, child_chose_guests: false, child_chose_food: false, child_chose_activity: false }),
        ...makeN(2, makeBirthdayPlan, { plan_created: false, child_chose_theme: false, child_chose_guests: false, child_chose_food: false, child_chose_activity: false }),
      ];
      const r = run({ birthday_plan_records: plans });
      expect(r.celebration_score).toBe(54); // 52 + 2
    });

    it("+0 when birthdayPlanningRate < 70", () => {
      // 6/10 => 60%
      const plans = [
        ...makeN(6, makeBirthdayPlan, { child_chose_theme: false, child_chose_guests: false, child_chose_food: false, child_chose_activity: false }),
        ...makeN(4, makeBirthdayPlan, { plan_created: false, child_chose_theme: false, child_chose_guests: false, child_chose_food: false, child_chose_activity: false }),
      ];
      const r = run({ birthday_plan_records: plans });
      expect(r.celebration_score).toBe(52); // no bonus, no penalty (60% >= 50)
    });
  });

  describe("Bonus 2: celebrationExecutionRate", () => {
    it("+4 when celebrationExecutionRate >= 90", () => {
      const celebs = makeN(10, makeCelebration, { personalised_to_child: false });
      const r = run({ celebration_execution_records: celebs });
      // personalisationRate = 0% (all false) => no bonus 7
      expect(r.celebration_score).toBe(56); // 52 + 4
    });

    it("+2 when celebrationExecutionRate >= 70 and < 90", () => {
      const celebs = [
        ...makeN(8, makeCelebration, { personalised_to_child: false }),
        ...makeN(2, makeCelebration, { celebration_held: false, personalised_to_child: false }),
      ];
      const r = run({ celebration_execution_records: celebs });
      expect(r.celebration_score).toBe(54); // 52 + 2
    });

    it("+0 when celebrationExecutionRate < 70", () => {
      const celebs = [
        ...makeN(6, makeCelebration, { personalised_to_child: false }),
        ...makeN(4, makeCelebration, { celebration_held: false, personalised_to_child: false }),
      ];
      const r = run({ celebration_execution_records: celebs });
      expect(r.celebration_score).toBe(52);
    });
  });

  describe("Bonus 3: giftProvisionRate", () => {
    it("+3 when giftProvisionRate >= 90", () => {
      const r = run({ gift_provision_records: makeN(10, makeGift) });
      expect(r.celebration_score).toBe(55); // 52 + 3
    });

    it("+1 when giftProvisionRate >= 70 and < 90", () => {
      const gifts = [
        ...makeN(8, makeGift),
        ...makeN(2, makeGift, { gift_provided: false }),
      ];
      const r = run({ gift_provision_records: gifts });
      expect(r.celebration_score).toBe(53); // 52 + 1
    });

    it("+0 when giftProvisionRate < 70", () => {
      const gifts = [
        ...makeN(6, makeGift),
        ...makeN(4, makeGift, { gift_provided: false }),
      ];
      const r = run({ gift_provision_records: gifts });
      expect(r.celebration_score).toBe(52);
    });
  });

  describe("Bonus 4: memoryMakingRate", () => {
    it("+3 when memoryMakingRate >= 90", () => {
      // lifeStoryRate = 100% => +2 bonus 9 as well
      // Need to isolate: set added_to_life_story false
      const memories = makeN(10, makeMemory, { added_to_life_story: false });
      const r2 = run({ memory_making_records: memories });
      expect(r2.celebration_score).toBe(55); // 52 + 3
    });

    it("+1 when memoryMakingRate >= 70 and < 90", () => {
      const memories = [
        ...makeN(8, makeMemory, { added_to_life_story: false }),
        ...makeN(2, makeMemory, { activity_completed: false, added_to_life_story: false }),
      ];
      const r = run({ memory_making_records: memories });
      expect(r.celebration_score).toBe(53); // 52 + 1
    });

    it("+0 when memoryMakingRate < 70", () => {
      const memories = [
        ...makeN(6, makeMemory, { added_to_life_story: false }),
        ...makeN(4, makeMemory, { activity_completed: false, added_to_life_story: false }),
      ];
      const r = run({ memory_making_records: memories });
      expect(r.celebration_score).toBe(52);
    });
  });

  describe("Bonus 5: childSatisfactionRate", () => {
    it("+4 when childSatisfactionRate >= 90", () => {
      const sats = makeN(10, makeSatisfaction, { felt_special: false });
      const r = run({ child_satisfaction_records: sats });
      // feltSpecialRate=0 => no bonus 8
      expect(r.celebration_score).toBe(56); // 52 + 4
    });

    it("+2 when childSatisfactionRate >= 70 and < 90", () => {
      const sats = [
        ...makeN(8, makeSatisfaction, { felt_special: false }),
        ...makeN(2, makeSatisfaction, { overall_satisfaction: 2, felt_special: false }),
      ];
      const r = run({ child_satisfaction_records: sats });
      expect(r.celebration_score).toBe(54); // 52 + 2
    });

    it("+0 when childSatisfactionRate < 70", () => {
      const sats = [
        ...makeN(6, makeSatisfaction, { felt_special: false }),
        ...makeN(4, makeSatisfaction, { overall_satisfaction: 2, felt_special: false }),
      ];
      const r = run({ child_satisfaction_records: sats });
      expect(r.celebration_score).toBe(52);
    });
  });

  describe("Bonus 6: childChoiceRate", () => {
    it("+3 when childChoiceRate >= 80", () => {
      // All 10 plans have choices=true => choiceRate = 40/40 = 100% => +3
      // birthdayPlanningRate = 0/10 = 0% => penalty -5
      // score = 52 + 3 - 5 = 50
      // Better: use 6 plan_created=true and 4 plan_created=false => 60% (no bonus, no penalty)
      const plans3 = [
        ...makeN(6, makeBirthdayPlan),
        ...makeN(4, makeBirthdayPlan, { plan_created: false }),
      ];
      // All 10 have all choices=true => childChoiceRate=40/40=100% => +3
      // birthdayPlanningRate=60% => no bonus (< 70), no penalty (>= 50)
      const r = run({ birthday_plan_records: plans3 });
      expect(r.celebration_score).toBe(55); // 52 + 3
    });

    it("+1 when childChoiceRate >= 60 and < 80", () => {
      // 7 have all choices, 3 have none => 28/40 = 70% >= 60 => +1
      // birthdayPlanningRate = 0/10 => penalty -5
      // score = 52 + 1 - 5 = 48
      // Better: set 6 plans plan_created=true to get 60% planning (no penalty, no bonus)
      const plans2 = [
        ...makeN(6, makeBirthdayPlan),
        ...makeN(1, makeBirthdayPlan, { plan_created: false }),
        ...makeN(3, makeBirthdayPlan, { plan_created: false, child_chose_theme: false, child_chose_guests: false, child_chose_food: false, child_chose_activity: false }),
      ];
      // choices: 7*4 = 28 out of 40 = 70% => +1
      // birthdayPlanningRate = 6/10 = 60% => no bonus, no penalty
      const r = run({ birthday_plan_records: plans2 });
      expect(r.celebration_score).toBe(53); // 52 + 1
    });

    it("+0 when childChoiceRate < 60", () => {
      const plans = [
        ...makeN(6, makeBirthdayPlan, { child_chose_theme: false, child_chose_guests: false, child_chose_food: false, child_chose_activity: false }),
        ...makeN(4, makeBirthdayPlan, { plan_created: false, child_chose_theme: false, child_chose_guests: false, child_chose_food: false, child_chose_activity: false }),
      ];
      // choiceRate = 0/40 = 0%
      // birthdayPlanningRate = 6/10 = 60% => no bonus, no penalty
      const r = run({ birthday_plan_records: plans });
      expect(r.celebration_score).toBe(52);
    });
  });

  describe("Bonus 7: personalisationRate", () => {
    it("+3 when personalisationRate >= 90", () => {
      // celebrationExecutionRate=0% => penalty -5 (totalCelebrations > 0)
      // personalisationRate = 10/10 = 100% => +3
      // score = 52 + 3 - 5 = 50
      // Better: set celebration_held to 60% to avoid penalty and bonus
      const celebs2 = [
        ...makeN(6, makeCelebration),
        ...makeN(4, makeCelebration, { celebration_held: false }),
      ];
      // celebrationExecutionRate = 60% => no bonus 2, no penalty
      // personalisationRate = 10/10 = 100% => +3
      const r = run({ celebration_execution_records: celebs2 });
      expect(r.celebration_score).toBe(55); // 52 + 3
    });

    it("+1 when personalisationRate >= 70 and < 90", () => {
      // celebrationExecutionRate = 6/10 = 60% => no bonus, no penalty
      // personalisationRate = 6/10 = 60%? No: first 6 have personalised=true, next 4 have false => 6/10=60%. That's < 70.
      // Need 7/10 => 70%
      const celebs2 = [
        ...makeN(6, makeCelebration),
        ...makeN(1, makeCelebration, { celebration_held: false }),
        ...makeN(3, makeCelebration, { celebration_held: false, personalised_to_child: false }),
      ];
      // celebrationExecutionRate = 6/10 = 60% => no bonus, no penalty
      // personalisationRate = 7/10 = 70% => +1
      const r = run({ celebration_execution_records: celebs2 });
      expect(r.celebration_score).toBe(53); // 52 + 1
    });

    it("+0 when personalisationRate < 70", () => {
      const celebs = [
        ...makeN(6, makeCelebration, { personalised_to_child: false }),
        ...makeN(4, makeCelebration, { celebration_held: false, personalised_to_child: false }),
      ];
      // personalisationRate = 0% => no bonus
      // celebrationExecutionRate = 6/10 = 60% => no penalty, no bonus
      const r = run({ celebration_execution_records: celebs });
      expect(r.celebration_score).toBe(52);
    });
  });

  describe("Bonus 8: feltSpecialRate", () => {
    it("+2 when feltSpecialRate >= 90", () => {
      // childSatisfactionRate = 0/10 = 0% => penalty -4 (< 30 && count>0)
      // feltSpecialRate = 100% => +2
      // score = 52 + 2 - 4 = 50
      // Better: satisfaction=4 on 6 => 60% (no bonus 5, no penalty)
      const sats2 = [
        ...makeN(6, makeSatisfaction, { overall_satisfaction: 4 }),
        ...makeN(4, makeSatisfaction, { overall_satisfaction: 3 }),
      ];
      // childSatisfactionRate = 6/10 = 60% => no bonus 5, no penalty (>= 30)
      // feltSpecialRate = 10/10 = 100% => +2
      const r = run({ child_satisfaction_records: sats2 });
      expect(r.celebration_score).toBe(54); // 52 + 2
    });

    it("+1 when feltSpecialRate >= 70 and < 90", () => {
      const sats = [
        ...makeN(6, makeSatisfaction, { overall_satisfaction: 4 }),
        ...makeN(1, makeSatisfaction, { overall_satisfaction: 3 }),
        ...makeN(3, makeSatisfaction, { overall_satisfaction: 3, felt_special: false }),
      ];
      // childSatisfactionRate = 6/10 = 60% => no bonus, no penalty
      // feltSpecialRate = 7/10 = 70% => +1
      const r = run({ child_satisfaction_records: sats });
      expect(r.celebration_score).toBe(53); // 52 + 1
    });

    it("+0 when feltSpecialRate < 70", () => {
      const sats = [
        ...makeN(6, makeSatisfaction, { overall_satisfaction: 4, felt_special: false }),
        ...makeN(4, makeSatisfaction, { overall_satisfaction: 3, felt_special: false }),
      ];
      // feltSpecialRate = 0% => no bonus
      const r = run({ child_satisfaction_records: sats });
      expect(r.celebration_score).toBe(52);
    });
  });

  describe("Bonus 9: lifeStoryRate", () => {
    it("+2 when lifeStoryRate >= 80", () => {
      const memories = makeN(10, makeMemory, { activity_completed: false });
      // memoryMakingRate = 0% => penalty? No, memoryMakingRate < 50 && totalMemoryRecords>0 is not a penalty.
      // Only 4 penalties exist: birthdayPlanning, celebExec, giftProv, childSatisfaction.
      // memoryMakingRate=0% has no penalty. But bonus 4 won't fire.
      // lifeStoryRate = 10/10 = 100% => +2
      // Also memoryMakingRate=0% => no bonus 4
      const r = run({ memory_making_records: memories });
      expect(r.celebration_score).toBe(54); // 52 + 2
    });

    it("+1 when lifeStoryRate >= 50 and < 80", () => {
      const memories = [
        ...makeN(6, makeMemory, { activity_completed: false }),
        ...makeN(4, makeMemory, { activity_completed: false, added_to_life_story: false }),
      ];
      // lifeStoryRate = 6/10 = 60% => +1
      // memoryMakingRate = 0% => no bonus 4, no penalty
      const r = run({ memory_making_records: memories });
      expect(r.celebration_score).toBe(53); // 52 + 1
    });

    it("+0 when lifeStoryRate < 50", () => {
      const memories = [
        ...makeN(4, makeMemory, { activity_completed: false }),
        ...makeN(6, makeMemory, { activity_completed: false, added_to_life_story: false }),
      ];
      // lifeStoryRate = 4/10 = 40% => no bonus
      const r = run({ memory_making_records: memories });
      expect(r.celebration_score).toBe(52);
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 10. PENALTIES — ISOLATION TESTS
// ══════════════════════════════════════════════════════════════════════════════

describe("penalties in isolation", () => {
  describe("Penalty 1: birthdayPlanningRate < 50", () => {
    it("-5 when birthdayPlanningRate < 50 and plans exist", () => {
      const plans = [
        ...makeN(4, makeBirthdayPlan, { child_chose_theme: false, child_chose_guests: false, child_chose_food: false, child_chose_activity: false }),
        ...makeN(6, makeBirthdayPlan, { plan_created: false, child_chose_theme: false, child_chose_guests: false, child_chose_food: false, child_chose_activity: false }),
      ];
      // birthdayPlanningRate = 4/10 = 40% => -5
      // childChoiceRate = 16/40 = 40% => no bonus
      const r = run({ birthday_plan_records: plans });
      expect(r.celebration_score).toBe(47); // 52 - 5
    });

    it("no penalty when birthdayPlanningRate < 50 but no plans", () => {
      const r = run({ celebration_execution_records: [makeCelebration({ personalised_to_child: false })] });
      // birthdayPlanningRate = 0 (pct(0,0)=0), but totalBirthdayPlans=0 => guard prevents penalty
      expect(r.celebration_score).toBeGreaterThanOrEqual(52); // no penalty applied
    });
  });

  describe("Penalty 2: celebrationExecutionRate < 50", () => {
    it("-5 when celebrationExecutionRate < 50 and celebrations exist", () => {
      const celebs = [
        ...makeN(4, makeCelebration, { personalised_to_child: false }),
        ...makeN(6, makeCelebration, { celebration_held: false, personalised_to_child: false }),
      ];
      // celebrationExecutionRate = 4/10 = 40% => -5
      const r = run({ celebration_execution_records: celebs });
      expect(r.celebration_score).toBe(47); // 52 - 5
    });

    it("no penalty when no celebration records exist", () => {
      const r = run({ birthday_plan_records: [makeBirthdayPlan({ child_chose_theme: false, child_chose_guests: false, child_chose_food: false, child_chose_activity: false })] });
      expect(r.celebration_score).toBeGreaterThanOrEqual(52);
    });
  });

  describe("Penalty 3: giftProvisionRate < 50", () => {
    it("-4 when giftProvisionRate < 50 and gifts exist", () => {
      const gifts = [
        ...makeN(4, makeGift),
        ...makeN(6, makeGift, { gift_provided: false }),
      ];
      // giftProvisionRate = 4/10 = 40% => -4
      const r = run({ gift_provision_records: gifts });
      expect(r.celebration_score).toBe(48); // 52 - 4
    });

    it("no penalty when no gift records exist", () => {
      const r = run({ birthday_plan_records: [makeBirthdayPlan({ child_chose_theme: false, child_chose_guests: false, child_chose_food: false, child_chose_activity: false })] });
      expect(r.celebration_score).toBeGreaterThanOrEqual(52);
    });
  });

  describe("Penalty 4: childSatisfactionRate < 30", () => {
    it("-4 when childSatisfactionRate < 30 and records exist", () => {
      const sats = [
        ...makeN(2, makeSatisfaction, { overall_satisfaction: 4, felt_special: false }),
        ...makeN(8, makeSatisfaction, { overall_satisfaction: 2, felt_special: false }),
      ];
      // childSatisfactionRate = 2/10 = 20% => -4
      const r = run({ child_satisfaction_records: sats });
      expect(r.celebration_score).toBe(48); // 52 - 4
    });

    it("no penalty when childSatisfactionRate >= 30", () => {
      const sats = [
        ...makeN(4, makeSatisfaction, { overall_satisfaction: 4, felt_special: false }),
        ...makeN(6, makeSatisfaction, { overall_satisfaction: 3, felt_special: false }),
      ];
      // childSatisfactionRate = 4/10 = 40% => >= 30, no penalty
      const r = run({ child_satisfaction_records: sats });
      expect(r.celebration_score).toBe(52);
    });

    it("no penalty when no satisfaction records exist", () => {
      const r = run({ birthday_plan_records: [makeBirthdayPlan({ child_chose_theme: false, child_chose_guests: false, child_chose_food: false, child_chose_activity: false })] });
      expect(r.celebration_score).toBeGreaterThanOrEqual(52);
    });
  });

  describe("all penalties combined", () => {
    it("maximum penalty is -18 (5+5+4+4), score floors at 34", () => {
      const plans = makeN(10, makeBirthdayPlan, {
        plan_created: false,
        child_chose_theme: false,
        child_chose_guests: false,
        child_chose_food: false,
        child_chose_activity: false,
      });
      const celebs = makeN(10, makeCelebration, {
        celebration_held: false,
        personalised_to_child: false,
      });
      const gifts = makeN(10, makeGift, { gift_provided: false });
      const sats = makeN(10, makeSatisfaction, {
        overall_satisfaction: 1,
        felt_special: false,
      });
      const r = run({
        birthday_plan_records: plans,
        celebration_execution_records: celebs,
        gift_provision_records: gifts,
        child_satisfaction_records: sats,
      });
      // birthdayPlanningRate=0% => -5
      // celebExec=0% => -5
      // giftProv=0% => -4
      // childSatisfaction=0% => -4
      // 52 - 18 = 34
      expect(r.celebration_score).toBe(34);
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 11. SCORE CLAMPING
// ══════════════════════════════════════════════════════════════════════════════

describe("score clamping", () => {
  it("score never exceeds 100", () => {
    // Even with all bonuses, base 52 + 28 = 80, so 100 isn't reachable
    // but test the clamp contract
    const r = run({
      birthday_plan_records: makeN(10, makeBirthdayPlan),
      celebration_execution_records: makeN(10, makeCelebration),
      gift_provision_records: makeN(10, makeGift),
      memory_making_records: makeN(10, makeMemory),
      child_satisfaction_records: makeN(10, makeSatisfaction),
    });
    expect(r.celebration_score).toBeLessThanOrEqual(100);
  });

  it("score never goes below 0", () => {
    // All penalties fire: 52 - 18 = 34, which is > 0
    // But test the contract
    const r = run({
      birthday_plan_records: makeN(10, makeBirthdayPlan, { plan_created: false, child_chose_theme: false, child_chose_guests: false, child_chose_food: false, child_chose_activity: false }),
      celebration_execution_records: makeN(10, makeCelebration, { celebration_held: false, personalised_to_child: false }),
      gift_provision_records: makeN(10, makeGift, { gift_provided: false }),
      child_satisfaction_records: makeN(10, makeSatisfaction, { overall_satisfaction: 1, felt_special: false }),
    });
    expect(r.celebration_score).toBeGreaterThanOrEqual(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 12. RATING THRESHOLDS
// ══════════════════════════════════════════════════════════════════════════════

describe("rating thresholds", () => {
  // We need to engineer exact scores to test boundary conditions.
  // base=52, we can add bonuses or penalties to hit specific scores.

  it("score=80 => outstanding", () => {
    // All bonuses => 52 + 28 = 80
    const r = run({
      birthday_plan_records: makeN(10, makeBirthdayPlan),
      celebration_execution_records: makeN(10, makeCelebration),
      gift_provision_records: makeN(10, makeGift),
      memory_making_records: makeN(10, makeMemory),
      child_satisfaction_records: makeN(10, makeSatisfaction),
    });
    expect(r.celebration_score).toBe(80);
    expect(r.celebration_rating).toBe("outstanding");
  });

  it("score=79 => good (just below outstanding)", () => {
    // feltSpecialRate = 9/10 = 90% => still +2. Need < 90.
    const sats2 = [
      ...makeN(8, makeSatisfaction),
      ...makeN(2, makeSatisfaction, { felt_special: false }),
    ];
    // feltSpecialRate = 8/10 = 80% => +1 (was +2, saving 1)
    const r = run({
      birthday_plan_records: makeN(10, makeBirthdayPlan),
      celebration_execution_records: makeN(10, makeCelebration),
      gift_provision_records: makeN(10, makeGift),
      memory_making_records: makeN(10, makeMemory),
      child_satisfaction_records: sats2,
    });
    // childSatisfactionRate = 8/10 = 80% => still +2? No wait, all 10 have satisfaction=5 by default.
    // sats2: 8 have satisfaction=5, 2 have satisfaction=5 but felt_special=false
    // childSatisfactionRate = 10/10 = 100% => +4
    // feltSpecialRate = 8/10 = 80% => +1 instead of +2 => saves 1
    // Total: 52 + 4+4+3+3+4+3+3+1+2 = 52 + 27 = 79
    expect(r.celebration_score).toBe(79);
    expect(r.celebration_rating).toBe("good");
  });

  it("score=65 => good (lower boundary)", () => {
    // 52 + 13 = 65
    // Bonuses 1-5 at lower tier: +2+2+1+1+2 = 8
    // + bonus 6 lower: +1, bonus 7 lower: +1, bonus 8 lower: +1, bonus 9 lower: +1 => 4
    // 8 + 4 = 12 => 52 + 12 = 64. Need 13.
    // Adjust: use some at high tier.
    // Let's use: bonus 1 high (+4), bonus 2 low (+2), bonus 6 low (+1), rest 0 => +7 = 59. Not enough.
    // Let's just set celebration_execution at >=90 (+4), birthday_planning at >=90 (+4), gift at >=90 (+3), child_choice at >=60 (+1), childSatisfaction at >=70 (+2) => 4+4+3+1+2 = 14? Too much.
    // Just target: +4 (birthday) +4 (celeb) +3 (gift) +2 (satisfaction low) = 13
    // birthdayPlanning 100%: plan_created true, child choices all false
    // celebExec 100%: personalised false
    // giftProv 100%
    // childSatisfaction >=70, <90: e.g. 7/10 with >=4
    // feltSpecial: all false, lifeStory: empty
    const r = run({
      birthday_plan_records: makeN(10, makeBirthdayPlan, { child_chose_theme: false, child_chose_guests: false, child_chose_food: false, child_chose_activity: false }),
      celebration_execution_records: makeN(10, makeCelebration, { personalised_to_child: false }),
      gift_provision_records: makeN(10, makeGift),
      child_satisfaction_records: [
        ...makeN(7, makeSatisfaction, { overall_satisfaction: 4, felt_special: false }),
        ...makeN(3, makeSatisfaction, { overall_satisfaction: 2, felt_special: false }),
      ],
    });
    // birthday: 100% => +4
    // celeb: 100% => +4
    // gift: 100% => +3
    // memory: empty => 0
    // satisfaction: 7/10=70% => +2
    // childChoice: 0% => 0
    // personalisation: 0% => 0
    // feltSpecial: 0% => 0
    // lifeStory: empty => 0
    // penalties: none
    // 52 + 4+4+3+2 = 65
    expect(r.celebration_score).toBe(65);
    expect(r.celebration_rating).toBe("good");
  });

  it("score=64 => adequate (just below good)", () => {
    // satisfaction: 6/10=60% => no bonus, no penalty (>=30)
    // 52 + 4+4+3 = 63? Wait let me recalculate:
    // birthday: +4, celeb: +4, gift: +3 = +11 => 52+11=63
    // Need +12. Add childChoice at >=60: need some choices.
    // Actually, I realize the prior test computed to 65 with +2 satisfaction. Without it: 52+11=63.
    // For 64: add +1 bonus somewhere. lifeStoryRate >= 50: need memory records with added_to_life_story.
    const r2 = run({
      birthday_plan_records: makeN(10, makeBirthdayPlan, { child_chose_theme: false, child_chose_guests: false, child_chose_food: false, child_chose_activity: false }),
      celebration_execution_records: makeN(10, makeCelebration, { personalised_to_child: false }),
      gift_provision_records: makeN(10, makeGift),
      memory_making_records: [
        ...makeN(6, makeMemory, { activity_completed: false }),
        ...makeN(4, makeMemory, { activity_completed: false, added_to_life_story: false }),
      ],
      child_satisfaction_records: [
        ...makeN(6, makeSatisfaction, { overall_satisfaction: 4, felt_special: false }),
        ...makeN(4, makeSatisfaction, { overall_satisfaction: 2, felt_special: false }),
      ],
    });
    // lifeStoryRate = 6/10 = 60% => +1
    // memoryMakingRate = 0% => no bonus 4
    // total: 52 + 4+4+3+0+0+0+0+0+1 = 64
    expect(r2.celebration_score).toBe(64);
    expect(r2.celebration_rating).toBe("adequate");
  });

  it("score=45 => adequate (lower boundary)", () => {
    // 52 - 7 = 45
    // Need penalties totalling 7: birthday penalty (-5) + one partial
    // birthday penalty -5 + giftProv penalty -4 = -9 => 52-9=43. Too much.
    // Just birthday penalty -5 => 47, need -2 more.
    // Can't get partial penalties. Penalties are -5, -5, -4, -4.
    // -5 => 47, -4 => 48. Neither hits 45.
    // -5 + bonus: 52 -5 + bonus = need bonus of -2 from 47 to get 45.
    // That doesn't work either. We can combine penalties: -5 (birthday) + some bonus.
    // Or get 52 - 5 - 4 = 43 (below). Hmm.
    // Actually: 52 + bonuses - penalties.
    // 52 + 2 (birthday>=70) - 4 (gift<50) - 5 (celeb<50) = 52 + 2 - 9 = 45
    const plans = [
      ...makeN(8, makeBirthdayPlan, { child_chose_theme: false, child_chose_guests: false, child_chose_food: false, child_chose_activity: false }),
      ...makeN(2, makeBirthdayPlan, { plan_created: false, child_chose_theme: false, child_chose_guests: false, child_chose_food: false, child_chose_activity: false }),
    ];
    const celebs = [
      ...makeN(4, makeCelebration, { personalised_to_child: false }),
      ...makeN(6, makeCelebration, { celebration_held: false, personalised_to_child: false }),
    ];
    const gifts = [
      ...makeN(4, makeGift),
      ...makeN(6, makeGift, { gift_provided: false }),
    ];
    const r = run({
      birthday_plan_records: plans,
      celebration_execution_records: celebs,
      gift_provision_records: gifts,
    });
    // birthday: 80% => +2
    // celeb: 40% => -5
    // gift: 40% => -4
    // 52 + 2 - 5 - 4 = 45
    expect(r.celebration_score).toBe(45);
    expect(r.celebration_rating).toBe("adequate");
  });

  it("score=44 => inadequate (just below adequate)", () => {
    const celebs = [
      ...makeN(4, makeCelebration, { personalised_to_child: false }),
      ...makeN(6, makeCelebration, { celebration_held: false, personalised_to_child: false }),
    ];
    const gifts = [
      ...makeN(4, makeGift),
      ...makeN(6, makeGift, { gift_provided: false }),
    ];
    // birthday: 70% => +2
    // celeb: 40% => -5
    // gift: 40% => -4
    // 52 + 2 - 5 - 4 = 45. Still 45!
    // Need one less point. Drop birthday to 60%:
    const plans2 = [
      ...makeN(6, makeBirthdayPlan, { child_chose_theme: false, child_chose_guests: false, child_chose_food: false, child_chose_activity: false }),
      ...makeN(4, makeBirthdayPlan, { plan_created: false, child_chose_theme: false, child_chose_guests: false, child_chose_food: false, child_chose_activity: false }),
    ];
    // birthdayPlanning = 0% => -5 penalty too. Let's avoid.
    // Use birthday 60% (no penalty, no bonus) + celeb 40% (-5) + gift 40% (-4) + lifeStory 50% (+1)
    const r3 = run({
      birthday_plan_records: plans2,
      celebration_execution_records: celebs,
      gift_provision_records: gifts,
      memory_making_records: [
        ...makeN(5, makeMemory, { activity_completed: false }),
        ...makeN(5, makeMemory, { activity_completed: false, added_to_life_story: false }),
      ],
    });
    // birthday: 60% => 0
    // celeb: 40% => -5
    // gift: 40% => -4
    // lifeStory: 50% => +1
    // 52 + 1 - 5 - 4 = 44
    expect(r3.celebration_score).toBe(44);
    expect(r3.celebration_rating).toBe("inadequate");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 13. STRENGTHS
// ══════════════════════════════════════════════════════════════════════════════

describe("strengths", () => {
  it("birthdayPlanningRate >= 90 strength", () => {
    const r = run({
      birthday_plan_records: makeN(10, makeBirthdayPlan, { child_chose_theme: false, child_chose_guests: false, child_chose_food: false, child_chose_activity: false, child_consulted: false }),
    });
    expect(r.strengths.some((s) => s.includes("100%") && s.includes("personalised plans"))).toBe(true);
  });

  it("birthdayPlanningRate >= 70 (lower tier) strength", () => {
    const plans = [
      ...makeN(7, makeBirthdayPlan, { child_chose_theme: false, child_chose_guests: false, child_chose_food: false, child_chose_activity: false, child_consulted: false }),
      ...makeN(3, makeBirthdayPlan, { plan_created: false, child_chose_theme: false, child_chose_guests: false, child_chose_food: false, child_chose_activity: false, child_consulted: false }),
    ];
    const r = run({ birthday_plan_records: plans });
    expect(r.strengths.some((s) => s.includes("70%") && s.includes("birthday planning rate"))).toBe(true);
  });

  it("childConsultationRate >= 90 strength", () => {
    const r = run({
      birthday_plan_records: makeN(10, makeBirthdayPlan, { child_chose_theme: false, child_chose_guests: false, child_chose_food: false, child_chose_activity: false }),
    });
    expect(r.strengths.some((s) => s.includes("consulted") && s.includes("100%"))).toBe(true);
  });

  it("childConsultationRate >= 70 (lower tier) strength", () => {
    const plans = [
      ...makeN(7, makeBirthdayPlan, { child_chose_theme: false, child_chose_guests: false, child_chose_food: false, child_chose_activity: false }),
      ...makeN(3, makeBirthdayPlan, { child_consulted: false, child_chose_theme: false, child_chose_guests: false, child_chose_food: false, child_chose_activity: false }),
    ];
    const r = run({ birthday_plan_records: plans });
    expect(r.strengths.some((s) => s.includes("consultation rate"))).toBe(true);
  });

  it("childChoiceRate >= 80 strength", () => {
    const r = run({
      birthday_plan_records: makeN(10, makeBirthdayPlan),
    });
    expect(r.strengths.some((s) => s.includes("celebration choices made by children"))).toBe(true);
  });

  it("childChoiceRate >= 60 (lower tier) strength", () => {
    const plans = [
      ...makeN(7, makeBirthdayPlan),
      ...makeN(3, makeBirthdayPlan, { child_chose_theme: false, child_chose_guests: false, child_chose_food: false, child_chose_activity: false }),
    ];
    const r = run({ birthday_plan_records: plans });
    // 28/40 = 70% => >= 60 but not >= 80? Actually 70 < 80 => lower tier
    expect(r.strengths.some((s) => s.includes("child choice rate"))).toBe(true);
  });

  it("advancePlanningRate >= 80 strength", () => {
    const r = run({
      birthday_plan_records: makeN(10, makeBirthdayPlan, { days_advance_planned: 21, child_chose_theme: false, child_chose_guests: false, child_chose_food: false, child_chose_activity: false, child_consulted: false }),
    });
    expect(r.strengths.some((s) => s.includes("14 days in advance"))).toBe(true);
  });

  it("celebrationExecutionRate >= 90 strength", () => {
    const r = run({
      celebration_execution_records: makeN(10, makeCelebration, { personalised_to_child: false }),
    });
    expect(r.strengths.some((s) => s.includes("celebration execution rate"))).toBe(true);
  });

  it("celebrationExecutionRate >= 70 (lower tier) strength", () => {
    const celebs = [
      ...makeN(7, makeCelebration, { personalised_to_child: false }),
      ...makeN(3, makeCelebration, { celebration_held: false, personalised_to_child: false }),
    ];
    const r = run({ celebration_execution_records: celebs });
    expect(r.strengths.some((s) => s.includes("celebrations executed"))).toBe(true);
  });

  it("onDateRate >= 90 strength", () => {
    const r = run({
      celebration_execution_records: makeN(10, makeCelebration, { personalised_to_child: false }),
    });
    expect(r.strengths.some((s) => s.includes("actual date"))).toBe(true);
  });

  it("personalisationRate >= 90 strength", () => {
    const r = run({
      celebration_execution_records: makeN(10, makeCelebration),
    });
    expect(r.strengths.some((s) => s.includes("personalised to the individual child"))).toBe(true);
  });

  it("personalisationRate >= 70 (lower tier) strength", () => {
    const celebs = [
      ...makeN(7, makeCelebration),
      ...makeN(3, makeCelebration, { personalised_to_child: false }),
    ];
    const r = run({ celebration_execution_records: celebs });
    expect(r.strengths.some((s) => s.includes("personalisation rate"))).toBe(true);
  });

  it("staffEnthusiasmAvg >= 4.0 strength", () => {
    const r = run({
      celebration_execution_records: makeN(10, makeCelebration, { staff_enthusiasm_rating: 4, personalised_to_child: false }),
    });
    expect(r.strengths.some((s) => s.includes("Staff enthusiasm"))).toBe(true);
  });

  it("peerParticipationRate >= 80 strength", () => {
    const celebs = [
      ...makeN(9, makeCelebration, { personalised_to_child: false }),
      makeCelebration({ peers_participated: false, personalised_to_child: false }),
    ];
    const r = run({ celebration_execution_records: celebs });
    expect(r.strengths.some((s) => s.includes("Peers participate"))).toBe(true);
  });

  it("familyAttendanceRate >= 50 strength", () => {
    const celebs = [
      ...makeN(5, makeCelebration, { personalised_to_child: false }),
      ...makeN(5, makeCelebration, { family_attended: false, personalised_to_child: false }),
    ];
    const r = run({ celebration_execution_records: celebs });
    expect(r.strengths.some((s) => s.includes("Family members attend"))).toBe(true);
  });

  it("decorationsRate >= 90 && cakeRate >= 90 strength", () => {
    const r = run({
      celebration_execution_records: makeN(10, makeCelebration, { personalised_to_child: false }),
    });
    expect(r.strengths.some((s) => s.includes("Decorations and cake"))).toBe(true);
  });

  it("atmosphereAvg >= 4.0 strength", () => {
    const r = run({
      celebration_execution_records: makeN(10, makeCelebration, { atmosphere_rating: 4, personalised_to_child: false }),
    });
    expect(r.strengths.some((s) => s.includes("atmosphere averages"))).toBe(true);
  });

  it("giftProvisionRate >= 90 strength", () => {
    const r = run({ gift_provision_records: makeN(10, makeGift) });
    expect(r.strengths.some((s) => s.includes("gift provision rate") && s.includes("every child receives"))).toBe(true);
  });

  it("giftProvisionRate >= 70 (lower tier) strength", () => {
    const gifts = [
      ...makeN(7, makeGift),
      ...makeN(3, makeGift, { gift_provided: false }),
    ];
    const r = run({ gift_provision_records: gifts });
    expect(r.strengths.some((s) => s.includes("gift provision rate") && s.includes("most children"))).toBe(true);
  });

  it("giftPersonalisationRate >= 90 strength", () => {
    const r = run({ gift_provision_records: makeN(10, makeGift) });
    expect(r.strengths.some((s) => s.includes("gifts personalised"))).toBe(true);
  });

  it("giftPersonalisationRate >= 70 (lower tier) strength", () => {
    const gifts = [
      ...makeN(7, makeGift),
      ...makeN(3, makeGift, { gift_personalised: false }),
    ];
    const r = run({ gift_provision_records: gifts });
    expect(r.strengths.some((s) => s.includes("gift personalisation rate"))).toBe(true);
  });

  it("equityRate >= 90 strength", () => {
    const r = run({ gift_provision_records: makeN(10, makeGift) });
    expect(r.strengths.some((s) => s.includes("equitable with peers"))).toBe(true);
  });

  it("thoughtfulPresentationRate >= 90 strength", () => {
    const r = run({ gift_provision_records: makeN(10, makeGift) });
    expect(r.strengths.some((s) => s.includes("presented thoughtfully"))).toBe(true);
  });

  it("positiveReactionRate >= 90 strength", () => {
    const r = run({ gift_provision_records: makeN(10, makeGift) });
    expect(r.strengths.some((s) => s.includes("positive child reactions"))).toBe(true);
  });

  it("memoryMakingRate >= 90 strength", () => {
    const r = run({ memory_making_records: makeN(10, makeMemory) });
    expect(r.strengths.some((s) => s.includes("memory-making activities completed"))).toBe(true);
  });

  it("memoryMakingRate >= 70 (lower tier) strength", () => {
    const memories = [
      ...makeN(7, makeMemory),
      ...makeN(3, makeMemory, { activity_completed: false }),
    ];
    const r = run({ memory_making_records: memories });
    expect(r.strengths.some((s) => s.includes("memory-making completion rate"))).toBe(true);
  });

  it("lifeStoryRate >= 80 strength", () => {
    const r = run({ memory_making_records: makeN(10, makeMemory) });
    expect(r.strengths.some((s) => s.includes("life stories"))).toBe(true);
  });

  it("childCopyRate >= 80 strength", () => {
    const r = run({ memory_making_records: makeN(10, makeMemory) });
    expect(r.strengths.some((s) => s.includes("personal copies"))).toBe(true);
  });

  it("memoryQualityAvg >= 4.0 strength", () => {
    const r = run({ memory_making_records: makeN(10, makeMemory, { quality_rating: 4 }) });
    expect(r.strengths.some((s) => s.includes("Memory-making quality"))).toBe(true);
  });

  it("childSatisfactionRate >= 90 strength", () => {
    const r = run({
      child_satisfaction_records: makeN(10, makeSatisfaction),
    });
    expect(r.strengths.some((s) => s.includes("rate their celebration experience 4 or 5"))).toBe(true);
  });

  it("childSatisfactionRate >= 70 (lower tier) strength", () => {
    const sats = [
      ...makeN(7, makeSatisfaction),
      ...makeN(3, makeSatisfaction, { overall_satisfaction: 2 }),
    ];
    const r = run({ child_satisfaction_records: sats });
    expect(r.strengths.some((s) => s.includes("child satisfaction rate"))).toBe(true);
  });

  it("feltSpecialRate >= 90 strength", () => {
    const r = run({ child_satisfaction_records: makeN(10, makeSatisfaction) });
    expect(r.strengths.some((s) => s.includes("felt special") && s.includes("uniquely valued"))).toBe(true);
  });

  it("feltSpecialRate >= 70 (lower tier) strength", () => {
    const sats = [
      ...makeN(7, makeSatisfaction),
      ...makeN(3, makeSatisfaction, { felt_special: false }),
    ];
    const r = run({ child_satisfaction_records: sats });
    expect(r.strengths.some((s) => s.includes("felt special") && s.includes("their day is about them"))).toBe(true);
  });

  it("feltListenedToRate >= 90 strength", () => {
    const r = run({ child_satisfaction_records: makeN(10, makeSatisfaction) });
    expect(r.strengths.some((s) => s.includes("felt listened to"))).toBe(true);
  });

  it("wishMatchRate >= 90 strength", () => {
    const r = run({ child_satisfaction_records: makeN(10, makeSatisfaction) });
    expect(r.strengths.some((s) => s.includes("matched children's wishes"))).toBe(true);
  });

  it("feltEqualRate >= 90 strength", () => {
    const r = run({ child_satisfaction_records: makeN(10, makeSatisfaction) });
    expect(r.strengths.some((s) => s.includes("treated equally to peers"))).toBe(true);
  });

  it("feedbackActionRate >= 80 strength", () => {
    const r = run({ child_satisfaction_records: makeN(10, makeSatisfaction) });
    expect(r.strengths.some((s) => s.includes("Feedback acted upon"))).toBe(true);
  });

  it("specialRequestFulfilmentRate >= 90 strength", () => {
    const r = run({
      birthday_plan_records: makeN(10, makeBirthdayPlan, {
        special_requests_noted: ["a", "b"],
        special_requests_fulfilled: ["a", "b"],
        child_chose_theme: false,
        child_chose_guests: false,
        child_chose_food: false,
        child_chose_activity: false,
        child_consulted: false,
      }),
    });
    expect(r.strengths.some((s) => s.includes("special birthday requests fulfilled"))).toBe(true);
  });

  it("culturalConsiderationRate >= 90 strength", () => {
    const r = run({
      birthday_plan_records: makeN(10, makeBirthdayPlan, { child_chose_theme: false, child_chose_guests: false, child_chose_food: false, child_chose_activity: false, child_consulted: false }),
    });
    expect(r.strengths.some((s) => s.includes("Cultural considerations"))).toBe(true);
  });

  it("familyContactRate >= 80 strength", () => {
    const r = run({
      birthday_plan_records: makeN(10, makeBirthdayPlan, { child_chose_theme: false, child_chose_guests: false, child_chose_food: false, child_chose_activity: false, child_consulted: false }),
    });
    expect(r.strengths.some((s) => s.includes("Family contact arranged"))).toBe(true);
  });

  it("safeguardingRate >= 90 strength", () => {
    const r = run({
      celebration_execution_records: makeN(10, makeCelebration, { personalised_to_child: false }),
    });
    expect(r.strengths.some((s) => s.includes("Safeguarding considered"))).toBe(true);
  });

  it("secureStorageRate >= 90 strength", () => {
    const r = run({ memory_making_records: makeN(10, makeMemory) });
    expect(r.strengths.some((s) => s.includes("stored securely"))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 14. CONCERNS
// ══════════════════════════════════════════════════════════════════════════════

describe("concerns", () => {
  it("birthdayPlanningRate < 50 concern", () => {
    const plans = [
      ...makeN(4, makeBirthdayPlan, { child_chose_theme: false, child_chose_guests: false, child_chose_food: false, child_chose_activity: false }),
      ...makeN(6, makeBirthdayPlan, { plan_created: false, child_chose_theme: false, child_chose_guests: false, child_chose_food: false, child_chose_activity: false }),
    ];
    const r = run({ birthday_plan_records: plans });
    expect(r.concerns.some((c) => c.includes("40%") && c.includes("plans created"))).toBe(true);
  });

  it("birthdayPlanningRate 50-69 concern", () => {
    const plans = [
      ...makeN(6, makeBirthdayPlan, { child_chose_theme: false, child_chose_guests: false, child_chose_food: false, child_chose_activity: false }),
      ...makeN(4, makeBirthdayPlan, { plan_created: false, child_chose_theme: false, child_chose_guests: false, child_chose_food: false, child_chose_activity: false }),
    ];
    const r = run({ birthday_plan_records: plans });
    expect(r.concerns.some((c) => c.includes("Birthday planning rate at 60%"))).toBe(true);
  });

  it("childConsultationRate < 50 concern", () => {
    const plans = makeN(10, makeBirthdayPlan, { child_consulted: false, child_chose_theme: false, child_chose_guests: false, child_chose_food: false, child_chose_activity: false });
    const r = run({ birthday_plan_records: plans });
    expect(r.concerns.some((c) => c.includes("consulted") && c.includes("0%"))).toBe(true);
  });

  it("childConsultationRate 50-69 concern", () => {
    const plans = [
      ...makeN(6, makeBirthdayPlan, { child_chose_theme: false, child_chose_guests: false, child_chose_food: false, child_chose_activity: false }),
      ...makeN(4, makeBirthdayPlan, { child_consulted: false, child_chose_theme: false, child_chose_guests: false, child_chose_food: false, child_chose_activity: false }),
    ];
    const r = run({ birthday_plan_records: plans });
    expect(r.concerns.some((c) => c.includes("consultation rate at 60%"))).toBe(true);
  });

  it("childChoiceRate < 50 concern", () => {
    const plans = makeN(10, makeBirthdayPlan, { child_chose_theme: false, child_chose_guests: false, child_chose_food: false, child_chose_activity: false });
    const r = run({ birthday_plan_records: plans });
    expect(r.concerns.some((c) => c.includes("celebration choices made by children"))).toBe(true);
  });

  it("celebrationExecutionRate < 50 concern", () => {
    const celebs = [
      ...makeN(4, makeCelebration, { personalised_to_child: false }),
      ...makeN(6, makeCelebration, { celebration_held: false, personalised_to_child: false }),
    ];
    const r = run({ celebration_execution_records: celebs });
    expect(r.concerns.some((c) => c.includes("40%") && c.includes("celebrations executed"))).toBe(true);
  });

  it("celebrationExecutionRate 50-69 concern", () => {
    const celebs = [
      ...makeN(6, makeCelebration, { personalised_to_child: false }),
      ...makeN(4, makeCelebration, { celebration_held: false, personalised_to_child: false }),
    ];
    const r = run({ celebration_execution_records: celebs });
    expect(r.concerns.some((c) => c.includes("Celebration execution rate at 60%"))).toBe(true);
  });

  it("onDateRate < 50 concern", () => {
    const celebs = makeN(10, makeCelebration, { held_on_actual_date: false, personalised_to_child: false });
    const r = run({ celebration_execution_records: celebs });
    expect(r.concerns.some((c) => c.includes("actual date"))).toBe(true);
  });

  it("personalisationRate < 50 concern", () => {
    const celebs = makeN(10, makeCelebration, { personalised_to_child: false });
    const r = run({ celebration_execution_records: celebs });
    expect(r.concerns.some((c) => c.includes("0%") && c.includes("personalised"))).toBe(true);
  });

  it("personalisationRate 50-69 concern", () => {
    const celebs = [
      ...makeN(6, makeCelebration),
      ...makeN(4, makeCelebration, { personalised_to_child: false }),
    ];
    const r = run({ celebration_execution_records: celebs });
    expect(r.concerns.some((c) => c.includes("Personalisation rate at 60%"))).toBe(true);
  });

  it("staffEnthusiasmAvg < 3.0 concern", () => {
    const celebs = makeN(10, makeCelebration, { staff_enthusiasm_rating: 2, personalised_to_child: false });
    const r = run({ celebration_execution_records: celebs });
    expect(r.concerns.some((c) => c.includes("Staff enthusiasm"))).toBe(true);
  });

  it("atmosphereAvg < 3.0 concern", () => {
    const celebs = makeN(10, makeCelebration, { atmosphere_rating: 2, personalised_to_child: false });
    const r = run({ celebration_execution_records: celebs });
    expect(r.concerns.some((c) => c.includes("atmosphere averages only"))).toBe(true);
  });

  it("giftProvisionRate < 50 concern", () => {
    const gifts = [
      ...makeN(4, makeGift),
      ...makeN(6, makeGift, { gift_provided: false }),
    ];
    const r = run({ gift_provision_records: gifts });
    expect(r.concerns.some((c) => c.includes("40%") && c.includes("gift provision rate"))).toBe(true);
  });

  it("giftProvisionRate 50-69 concern", () => {
    const gifts = [
      ...makeN(6, makeGift),
      ...makeN(4, makeGift, { gift_provided: false }),
    ];
    const r = run({ gift_provision_records: gifts });
    expect(r.concerns.some((c) => c.includes("Gift provision at 60%"))).toBe(true);
  });

  it("giftPersonalisationRate < 50 concern", () => {
    const gifts = makeN(10, makeGift, { gift_personalised: false });
    const r = run({ gift_provision_records: gifts });
    expect(r.concerns.some((c) => c.includes("gifts personalised"))).toBe(true);
  });

  it("equityRate < 70 concern", () => {
    const gifts = [
      ...makeN(6, makeGift),
      ...makeN(4, makeGift, { equitable_with_peers: false }),
    ];
    const r = run({ gift_provision_records: gifts });
    expect(r.concerns.some((c) => c.includes("equitable with peers"))).toBe(true);
  });

  it("budgetAdequacyRate < 50 concern", () => {
    const gifts = makeN(10, makeGift, { budget_adequate: false });
    const r = run({ gift_provision_records: gifts });
    expect(r.concerns.some((c) => c.includes("gift budgets considered adequate"))).toBe(true);
  });

  it("memoryMakingRate < 50 concern", () => {
    const memories = [
      ...makeN(4, makeMemory),
      ...makeN(6, makeMemory, { activity_completed: false }),
    ];
    const r = run({ memory_making_records: memories });
    expect(r.concerns.some((c) => c.includes("40%") && c.includes("memory-making activities completed"))).toBe(true);
  });

  it("memoryMakingRate 50-69 concern", () => {
    const memories = [
      ...makeN(6, makeMemory),
      ...makeN(4, makeMemory, { activity_completed: false }),
    ];
    const r = run({ memory_making_records: memories });
    expect(r.concerns.some((c) => c.includes("Memory-making at 60%"))).toBe(true);
  });

  it("lifeStoryRate < 50 concern", () => {
    const memories = makeN(10, makeMemory, { added_to_life_story: false });
    const r = run({ memory_making_records: memories });
    expect(r.concerns.some((c) => c.includes("life stories"))).toBe(true);
  });

  it("childConsentRate < 70 concern", () => {
    const memories = [
      ...makeN(6, makeMemory),
      ...makeN(4, makeMemory, { child_consented: false }),
    ];
    const r = run({ memory_making_records: memories });
    expect(r.concerns.some((c) => c.includes("consent") && c.includes("60%"))).toBe(true);
  });

  it("childSatisfactionRate < 30 concern", () => {
    const sats = [
      ...makeN(2, makeSatisfaction),
      ...makeN(8, makeSatisfaction, { overall_satisfaction: 2, felt_special: false }),
    ];
    const r = run({ child_satisfaction_records: sats });
    expect(r.concerns.some((c) => c.includes("20%") && c.includes("rate celebrations 4+"))).toBe(true);
  });

  it("childSatisfactionRate 30-69 concern", () => {
    const sats = [
      ...makeN(5, makeSatisfaction),
      ...makeN(5, makeSatisfaction, { overall_satisfaction: 2 }),
    ];
    const r = run({ child_satisfaction_records: sats });
    expect(r.concerns.some((c) => c.includes("Child satisfaction at 50%"))).toBe(true);
  });

  it("feltSpecialRate < 50 concern", () => {
    const sats = makeN(10, makeSatisfaction, { felt_special: false });
    const r = run({ child_satisfaction_records: sats });
    expect(r.concerns.some((c) => c.includes("0%") && c.includes("felt special"))).toBe(true);
  });

  it("feltSpecialRate 50-69 concern", () => {
    const sats = [
      ...makeN(6, makeSatisfaction),
      ...makeN(4, makeSatisfaction, { felt_special: false }),
    ];
    const r = run({ child_satisfaction_records: sats });
    expect(r.concerns.some((c) => c.includes("60%") && c.includes("felt special"))).toBe(true);
  });

  it("feltListenedToRate < 50 concern", () => {
    const sats = makeN(10, makeSatisfaction, { felt_listened_to: false });
    const r = run({ child_satisfaction_records: sats });
    expect(r.concerns.some((c) => c.includes("felt listened to"))).toBe(true);
  });

  it("feltEqualRate < 50 concern", () => {
    const sats = makeN(10, makeSatisfaction, { felt_equal_to_peers: false });
    const r = run({ child_satisfaction_records: sats });
    expect(r.concerns.some((c) => c.includes("treated equally to peers"))).toBe(true);
  });

  it("wishMatchRate < 50 concern", () => {
    const sats = makeN(10, makeSatisfaction, { celebration_matched_wishes: false });
    const r = run({ child_satisfaction_records: sats });
    expect(r.concerns.some((c) => c.includes("matched children's wishes"))).toBe(true);
  });

  it("feedbackActionRate < 50 concern", () => {
    const sats = makeN(10, makeSatisfaction, { feedback_acted_upon: false });
    const r = run({ child_satisfaction_records: sats });
    expect(r.concerns.some((c) => c.includes("Feedback acted upon"))).toBe(true);
  });

  it("no birthday plans despite children on placement (partial records)", () => {
    const r = run({
      total_children: 3,
      celebration_execution_records: [makeCelebration({ personalised_to_child: false })],
    });
    expect(r.concerns.some((c) => c.includes("No birthday plan records"))).toBe(true);
  });

  it("no gift records despite children on placement (partial records)", () => {
    const r = run({
      total_children: 3,
      celebration_execution_records: [makeCelebration({ personalised_to_child: false })],
    });
    expect(r.concerns.some((c) => c.includes("No gift provision records"))).toBe(true);
  });

  it("no memory records despite children on placement (partial records)", () => {
    const r = run({
      total_children: 3,
      celebration_execution_records: [makeCelebration({ personalised_to_child: false })],
    });
    expect(r.concerns.some((c) => c.includes("No memory-making records"))).toBe(true);
  });

  it("no satisfaction records despite children on placement (partial records)", () => {
    const r = run({
      total_children: 3,
      celebration_execution_records: [makeCelebration({ personalised_to_child: false })],
    });
    expect(r.concerns.some((c) => c.includes("No child satisfaction records"))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 15. RECOMMENDATIONS
// ══════════════════════════════════════════════════════════════════════════════

describe("recommendations", () => {
  it("birthdayPlanningRate < 50 generates immediate recommendation", () => {
    const plans = makeN(10, makeBirthdayPlan, { plan_created: false, child_chose_theme: false, child_chose_guests: false, child_chose_food: false, child_chose_activity: false });
    const r = run({ birthday_plan_records: plans });
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("personalised birthday plans"))).toBe(true);
  });

  it("celebrationExecutionRate < 50 generates immediate recommendation", () => {
    const celebs = makeN(10, makeCelebration, { celebration_held: false, personalised_to_child: false });
    const r = run({ celebration_execution_records: celebs });
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("deliver planned celebrations"))).toBe(true);
  });

  it("giftProvisionRate < 50 generates immediate recommendation", () => {
    const gifts = makeN(10, makeGift, { gift_provided: false });
    const r = run({ gift_provision_records: gifts });
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("personalised, age-appropriate gifts"))).toBe(true);
  });

  it("childSatisfactionRate < 30 generates immediate recommendation", () => {
    const sats = makeN(10, makeSatisfaction, { overall_satisfaction: 1, felt_special: false });
    const r = run({ child_satisfaction_records: sats });
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("satisfaction is critically low"))).toBe(true);
  });

  it("childChoiceRate < 50 generates immediate recommendation", () => {
    const plans = makeN(10, makeBirthdayPlan, { child_chose_theme: false, child_chose_guests: false, child_chose_food: false, child_chose_activity: false });
    const r = run({ birthday_plan_records: plans });
    expect(r.recommendations.some((rec) => rec.recommendation.includes("genuine choice"))).toBe(true);
  });

  it("feltSpecialRate < 50 generates immediate recommendation", () => {
    const sats = makeN(10, makeSatisfaction, { felt_special: false });
    const r = run({ child_satisfaction_records: sats });
    expect(r.recommendations.some((rec) => rec.recommendation.includes("feel special"))).toBe(true);
  });

  it("personalisationRate < 50 generates immediate recommendation", () => {
    const celebs = makeN(10, makeCelebration, { personalised_to_child: false, celebration_held: false });
    const r = run({ celebration_execution_records: celebs });
    expect(r.recommendations.some((rec) => rec.recommendation.includes("generic, one-size-fits-all"))).toBe(true);
  });

  it("memoryMakingRate < 50 generates soon recommendation", () => {
    const memories = makeN(10, makeMemory, { activity_completed: false });
    const r = run({ memory_making_records: memories });
    expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("memory-making as a standard part"))).toBe(true);
  });

  it("lifeStoryRate < 50 generates soon recommendation", () => {
    const memories = makeN(10, makeMemory, { added_to_life_story: false });
    const r = run({ memory_making_records: memories });
    expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("life story work"))).toBe(true);
  });

  it("equityRate < 70 generates soon recommendation", () => {
    const gifts = [
      ...makeN(6, makeGift),
      ...makeN(4, makeGift, { equitable_with_peers: false }),
    ];
    const r = run({ gift_provision_records: gifts });
    expect(r.recommendations.some((rec) => rec.recommendation.includes("gift equity"))).toBe(true);
  });

  it("feedbackActionRate < 50 generates soon recommendation", () => {
    const sats = makeN(10, makeSatisfaction, { feedback_acted_upon: false });
    const r = run({ child_satisfaction_records: sats });
    expect(r.recommendations.some((rec) => rec.recommendation.includes("feedback-to-action loop"))).toBe(true);
  });

  it("familyContactRate < 50 generates soon recommendation", () => {
    const plans = makeN(10, makeBirthdayPlan, { family_contact_arranged: false, child_chose_theme: false, child_chose_guests: false, child_chose_food: false, child_chose_activity: false });
    const r = run({ birthday_plan_records: plans });
    expect(r.recommendations.some((rec) => rec.recommendation.includes("family contact"))).toBe(true);
  });

  it("birthdayPlanningRate 50-69 generates soon recommendation", () => {
    const plans = [
      ...makeN(6, makeBirthdayPlan, { child_chose_theme: false, child_chose_guests: false, child_chose_food: false, child_chose_activity: false }),
      ...makeN(4, makeBirthdayPlan, { plan_created: false, child_chose_theme: false, child_chose_guests: false, child_chose_food: false, child_chose_activity: false }),
    ];
    const r = run({ birthday_plan_records: plans });
    expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("birthday planning rate to at least 70%"))).toBe(true);
  });

  it("celebrationExecutionRate 50-69 generates planned recommendation", () => {
    const celebs = [
      ...makeN(6, makeCelebration, { personalised_to_child: false }),
      ...makeN(4, makeCelebration, { celebration_held: false, personalised_to_child: false }),
    ];
    const r = run({ celebration_execution_records: celebs });
    expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("celebration execution to at least 70%"))).toBe(true);
  });

  it("giftProvisionRate 50-69 generates planned recommendation", () => {
    const gifts = [
      ...makeN(6, makeGift),
      ...makeN(4, makeGift, { gift_provided: false }),
    ];
    const r = run({ gift_provision_records: gifts });
    expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("gift provision rate to at least 70%"))).toBe(true);
  });

  it("childSatisfactionRate 30-69 generates planned recommendation", () => {
    const sats = [
      ...makeN(5, makeSatisfaction, { felt_special: false }),
      ...makeN(5, makeSatisfaction, { overall_satisfaction: 2, felt_special: false }),
    ];
    const r = run({ child_satisfaction_records: sats });
    expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("targeted personalisation"))).toBe(true);
  });

  it("no birthday plans (but not allEmpty) generates immediate recommendation", () => {
    const r = run({
      total_children: 3,
      celebration_execution_records: [makeCelebration({ personalised_to_child: false })],
    });
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("birthday planning for every child"))).toBe(true);
  });

  it("no gift records (but not allEmpty) generates soon recommendation", () => {
    const r = run({
      total_children: 3,
      celebration_execution_records: [makeCelebration({ personalised_to_child: false })],
    });
    expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("recording gift provision"))).toBe(true);
  });

  it("no memory records (but not allEmpty) generates soon recommendation", () => {
    const r = run({
      total_children: 3,
      celebration_execution_records: [makeCelebration({ personalised_to_child: false })],
    });
    expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("memory-making activities"))).toBe(true);
  });

  it("no satisfaction records (but not allEmpty) generates soon recommendation", () => {
    const r = run({
      total_children: 3,
      celebration_execution_records: [makeCelebration({ personalised_to_child: false })],
    });
    expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("satisfaction surveys"))).toBe(true);
  });

  it("recommendation ranks are sequential", () => {
    const plans = makeN(10, makeBirthdayPlan, { plan_created: false, child_chose_theme: false, child_chose_guests: false, child_chose_food: false, child_chose_activity: false });
    const celebs = makeN(10, makeCelebration, { celebration_held: false, personalised_to_child: false });
    const gifts = makeN(10, makeGift, { gift_provided: false });
    const sats = makeN(10, makeSatisfaction, { overall_satisfaction: 1, felt_special: false, felt_listened_to: false, felt_equal_to_peers: false, celebration_matched_wishes: false, feedback_acted_upon: false });
    const r = run({
      birthday_plan_records: plans,
      celebration_execution_records: celebs,
      gift_provision_records: gifts,
      child_satisfaction_records: sats,
    });
    for (let i = 0; i < r.recommendations.length; i++) {
      expect(r.recommendations[i].rank).toBe(i + 1);
    }
  });

  it("all recommendations have a regulatory_ref", () => {
    const plans = makeN(10, makeBirthdayPlan, { plan_created: false, child_chose_theme: false, child_chose_guests: false, child_chose_food: false, child_chose_activity: false });
    const r = run({ birthday_plan_records: plans });
    for (const rec of r.recommendations) {
      expect(rec.regulatory_ref.length).toBeGreaterThan(0);
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 16. INSIGHTS
// ══════════════════════════════════════════════════════════════════════════════

describe("insights", () => {
  describe("critical insights", () => {
    it("birthdayPlanningRate < 50 critical insight", () => {
      const plans = makeN(10, makeBirthdayPlan, { plan_created: false, child_chose_theme: false, child_chose_guests: false, child_chose_food: false, child_chose_activity: false });
      const r = run({ birthday_plan_records: plans });
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("birthday planning"))).toBe(true);
    });

    it("celebrationExecutionRate < 50 critical insight", () => {
      const celebs = makeN(10, makeCelebration, { celebration_held: false, personalised_to_child: false });
      const r = run({ celebration_execution_records: celebs });
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("celebrations delivered"))).toBe(true);
    });

    it("giftProvisionRate < 50 critical insight", () => {
      const gifts = makeN(10, makeGift, { gift_provided: false });
      const r = run({ gift_provision_records: gifts });
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("gift provision rate"))).toBe(true);
    });

    it("childSatisfactionRate < 30 critical insight", () => {
      const sats = makeN(10, makeSatisfaction, { overall_satisfaction: 1, felt_special: false });
      const r = run({ child_satisfaction_records: sats });
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("rate celebrations positively"))).toBe(true);
    });

    it("feltSpecialRate < 50 critical insight", () => {
      const sats = makeN(10, makeSatisfaction, { felt_special: false });
      const r = run({ child_satisfaction_records: sats });
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("felt special"))).toBe(true);
    });

    it("no birthday plans AND no gift records critical insight", () => {
      const r = run({
        total_children: 3,
        celebration_execution_records: [makeCelebration({ personalised_to_child: false })],
      });
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("No birthday planning or gift provision records"))).toBe(true);
    });
  });

  describe("warning insights", () => {
    it("birthdayPlanningRate 50-69 warning", () => {
      const plans = [
        ...makeN(6, makeBirthdayPlan, { child_chose_theme: false, child_chose_guests: false, child_chose_food: false, child_chose_activity: false }),
        ...makeN(4, makeBirthdayPlan, { plan_created: false, child_chose_theme: false, child_chose_guests: false, child_chose_food: false, child_chose_activity: false }),
      ];
      const r = run({ birthday_plan_records: plans });
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Birthday planning at 60%"))).toBe(true);
    });

    it("celebrationExecutionRate 50-69 warning", () => {
      const celebs = [
        ...makeN(6, makeCelebration, { personalised_to_child: false }),
        ...makeN(4, makeCelebration, { celebration_held: false, personalised_to_child: false }),
      ];
      const r = run({ celebration_execution_records: celebs });
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Celebration execution at 60%"))).toBe(true);
    });

    it("personalisationRate 50-69 warning", () => {
      const celebs = [
        ...makeN(6, makeCelebration),
        ...makeN(4, makeCelebration, { personalised_to_child: false }),
      ];
      const r = run({ celebration_execution_records: celebs });
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Personalisation at 60%"))).toBe(true);
    });

    it("childChoiceRate 50-79 warning", () => {
      // childChoiceRate >= 50 and < 80
      const plans = [
        ...makeN(6, makeBirthdayPlan),
        ...makeN(4, makeBirthdayPlan, { child_chose_theme: false, child_chose_guests: false, child_chose_food: false, child_chose_activity: false }),
      ];
      // choices: 6*4 = 24 out of 40 = 60% => >=50, <80 => warning
      const r = run({ birthday_plan_records: plans });
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Child choice rate at 60%"))).toBe(true);
    });

    it("giftProvisionRate 50-69 warning", () => {
      const gifts = [
        ...makeN(6, makeGift),
        ...makeN(4, makeGift, { gift_provided: false }),
      ];
      const r = run({ gift_provision_records: gifts });
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Gift provision at 60%"))).toBe(true);
    });

    it("memoryMakingRate 50-69 warning", () => {
      const memories = [
        ...makeN(6, makeMemory),
        ...makeN(4, makeMemory, { activity_completed: false }),
      ];
      const r = run({ memory_making_records: memories });
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Memory-making at 60%"))).toBe(true);
    });

    it("childSatisfactionRate 30-69 warning", () => {
      const sats = [
        ...makeN(5, makeSatisfaction, { felt_special: false }),
        ...makeN(5, makeSatisfaction, { overall_satisfaction: 2, felt_special: false }),
      ];
      const r = run({ child_satisfaction_records: sats });
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Child satisfaction at 50%"))).toBe(true);
    });

    it("feltSpecialRate 50-69 warning", () => {
      const sats = [
        ...makeN(6, makeSatisfaction),
        ...makeN(4, makeSatisfaction, { felt_special: false }),
      ];
      const r = run({ child_satisfaction_records: sats });
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("60%") && i.text.includes("felt special"))).toBe(true);
    });

    it("equityRate 50-69 warning", () => {
      const gifts = [
        ...makeN(6, makeGift),
        ...makeN(4, makeGift, { equitable_with_peers: false }),
      ];
      const r = run({ gift_provision_records: gifts });
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Gift equity at 60%"))).toBe(true);
    });

    it("wouldChangeRate >= 40 warning", () => {
      const sats = [
        ...makeN(5, makeSatisfaction, { would_change_anything: true }),
        ...makeN(5, makeSatisfaction, { would_change_anything: false }),
      ];
      const r = run({ child_satisfaction_records: sats });
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("50%") && i.text.includes("would change something"))).toBe(true);
    });

    it("staffEnthusiasmAvg 3.0-3.99 warning", () => {
      const celebs = makeN(10, makeCelebration, { staff_enthusiasm_rating: 3, personalised_to_child: false });
      const r = run({ celebration_execution_records: celebs });
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Staff enthusiasm at 3"))).toBe(true);
    });

    it("familyContactRate 30-49 warning", () => {
      const plans = [
        ...makeN(4, makeBirthdayPlan, { child_chose_theme: false, child_chose_guests: false, child_chose_food: false, child_chose_activity: false }),
        ...makeN(6, makeBirthdayPlan, { family_contact_arranged: false, child_chose_theme: false, child_chose_guests: false, child_chose_food: false, child_chose_activity: false }),
      ];
      const r = run({ birthday_plan_records: plans });
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Family contact arranged for only 40%"))).toBe(true);
    });
  });

  describe("celebration type diversity insight", () => {
    it("4+ celebration types produces positive diversity insight", () => {
      const celebs = [
        makeCelebration({ celebration_type: "birthday", personalised_to_child: false }),
        makeCelebration({ celebration_type: "christmas", personalised_to_child: false }),
        makeCelebration({ celebration_type: "easter", personalised_to_child: false }),
        makeCelebration({ celebration_type: "eid", personalised_to_child: false }),
      ];
      const r = run({ celebration_execution_records: celebs });
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("4 different types"))).toBe(true);
    });

    it("fewer than 4 celebration types does not produce diversity insight", () => {
      const celebs = [
        makeCelebration({ celebration_type: "birthday", personalised_to_child: false }),
        makeCelebration({ celebration_type: "christmas", personalised_to_child: false }),
      ];
      const r = run({ celebration_execution_records: celebs });
      expect(r.insights.some((i) => i.text.includes("different types of occasions"))).toBe(false);
    });
  });

  describe("positive insights", () => {
    it("outstanding rating produces positive outcome insight", () => {
      const r = run({
        birthday_plan_records: makeN(10, makeBirthdayPlan),
        celebration_execution_records: makeN(10, makeCelebration),
        gift_provision_records: makeN(10, makeGift),
        memory_making_records: makeN(10, makeMemory),
        child_satisfaction_records: makeN(10, makeSatisfaction),
      });
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("outstanding birthday and celebration provision"))).toBe(true);
    });

    it("birthdayPlanningRate >= 90 && childConsultationRate >= 90 positive insight", () => {
      const r = run({
        birthday_plan_records: makeN(10, makeBirthdayPlan, { child_chose_theme: false, child_chose_guests: false, child_chose_food: false, child_chose_activity: false }),
      });
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("birthday planning with") && i.text.includes("child consultation"))).toBe(true);
    });

    it("celebrationExecutionRate >= 90 && personalisationRate >= 90 positive insight", () => {
      const r = run({
        celebration_execution_records: makeN(10, makeCelebration),
      });
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("execution with") && i.text.includes("personalisation"))).toBe(true);
    });

    it("giftProvisionRate >= 90 && giftPersonalisationRate >= 90 positive insight", () => {
      const r = run({ gift_provision_records: makeN(10, makeGift) });
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("gift provision with") && i.text.includes("personalisation"))).toBe(true);
    });

    it("childSatisfactionRate >= 90 && feltSpecialRate >= 90 positive insight", () => {
      const r = run({ child_satisfaction_records: makeN(10, makeSatisfaction) });
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("satisfaction with") && i.text.includes("feeling special"))).toBe(true);
    });

    it("memoryMakingRate >= 90 && lifeStoryRate >= 80 positive insight", () => {
      const r = run({ memory_making_records: makeN(10, makeMemory) });
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("memory-making with") && i.text.includes("life stories"))).toBe(true);
    });

    it("childChoiceRate >= 80 && wishMatchRate >= 90 positive insight", () => {
      const r = run({
        birthday_plan_records: makeN(10, makeBirthdayPlan),
        child_satisfaction_records: makeN(10, makeSatisfaction),
      });
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("child choice with") && i.text.includes("wish fulfilment"))).toBe(true);
    });

    it("feedbackActionRate >= 80 && followUpRate >= 80 positive insight", () => {
      const r = run({ child_satisfaction_records: makeN(10, makeSatisfaction) });
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("feedback acted upon with") && i.text.includes("follow-up"))).toBe(true);
    });

    it("specialRequestFulfilmentRate >= 90 positive insight", () => {
      const r = run({
        birthday_plan_records: makeN(10, makeBirthdayPlan, {
          special_requests_noted: ["a"],
          special_requests_fulfilled: ["a"],
          child_chose_theme: false,
          child_chose_guests: false,
          child_chose_food: false,
          child_chose_activity: false,
        }),
      });
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("special birthday requests fulfilled"))).toBe(true);
    });

    it("familyContactRate >= 80 && familyAttendanceRate >= 50 positive insight", () => {
      const r = run({
        birthday_plan_records: makeN(10, makeBirthdayPlan, { child_chose_theme: false, child_chose_guests: false, child_chose_food: false, child_chose_activity: false }),
        celebration_execution_records: makeN(10, makeCelebration, { personalised_to_child: false }),
      });
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("Family contact arranged") && i.text.includes("family attendance"))).toBe(true);
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 17. HEADLINE FORMAT
// ══════════════════════════════════════════════════════════════════════════════

describe("headline format", () => {
  it("outstanding headline is fixed string", () => {
    const r = run({
      birthday_plan_records: makeN(10, makeBirthdayPlan),
      celebration_execution_records: makeN(10, makeCelebration),
      gift_provision_records: makeN(10, makeGift),
      memory_making_records: makeN(10, makeMemory),
      child_satisfaction_records: makeN(10, makeSatisfaction),
    });
    expect(r.headline).toBe("Outstanding birthday and celebration provision -- every child feels valued, special, and celebrated with personalised, memorable experiences.");
  });

  it("good headline includes strength and concern counts", () => {
    const plans = [
      ...makeN(8, makeBirthdayPlan),
      ...makeN(2, makeBirthdayPlan, { plan_created: false, child_chose_theme: false, child_chose_guests: false, child_chose_food: false, child_chose_activity: false }),
    ];
    const celebs = [
      ...makeN(8, makeCelebration),
      ...makeN(2, makeCelebration, { celebration_held: false, personalised_to_child: false }),
    ];
    const r = run({
      birthday_plan_records: plans,
      celebration_execution_records: celebs,
      gift_provision_records: makeN(10, makeGift),
      memory_making_records: makeN(10, makeMemory),
      child_satisfaction_records: makeN(10, makeSatisfaction),
    });
    expect(r.headline).toContain("Good");
    expect(r.headline).toContain("strength");
  });

  it("adequate headline includes concern count", () => {
    const plans = [
      ...makeN(6, makeBirthdayPlan, { child_chose_theme: false, child_chose_guests: false, child_chose_food: false, child_chose_activity: false }),
      ...makeN(4, makeBirthdayPlan, { plan_created: false, child_chose_theme: false, child_chose_guests: false, child_chose_food: false, child_chose_activity: false }),
    ];
    const r = run({ birthday_plan_records: plans });
    expect(r.headline).toContain("Adequate");
    expect(r.headline).toContain("concern");
  });

  it("inadequate headline includes concern count", () => {
    const plans = makeN(10, makeBirthdayPlan, { plan_created: false, child_chose_theme: false, child_chose_guests: false, child_chose_food: false, child_chose_activity: false });
    const celebs = makeN(10, makeCelebration, { celebration_held: false, personalised_to_child: false });
    const r = run({
      birthday_plan_records: plans,
      celebration_execution_records: celebs,
    });
    expect(r.headline).toContain("inadequate");
    expect(r.headline).toContain("concern");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 18. EDGE CASES
// ══════════════════════════════════════════════════════════════════════════════

describe("edge cases", () => {
  it("single record in each array", () => {
    const r = run({
      birthday_plan_records: [makeBirthdayPlan()],
      celebration_execution_records: [makeCelebration()],
      gift_provision_records: [makeGift()],
      memory_making_records: [makeMemory()],
      child_satisfaction_records: [makeSatisfaction()],
    });
    expect(r.celebration_rating).toBe("outstanding");
    expect(r.birthday_planning_rate).toBe(100);
    expect(r.celebration_execution_rate).toBe(100);
    expect(r.gift_provision_rate).toBe(100);
    expect(r.memory_making_rate).toBe(100);
    expect(r.child_satisfaction_rate).toBe(100);
    expect(r.child_choice_rate).toBe(100);
  });

  it("total_children=0 with records still computes (not insufficient_data)", () => {
    const r = run({
      total_children: 0,
      birthday_plan_records: [makeBirthdayPlan()],
    });
    // Not allEmpty (plans exist), not allEmpty+children>0
    // Should proceed to normal scoring
    expect(r.celebration_rating).not.toBe("insufficient_data");
  });

  it("special requests with 0 noted gives 0% fulfilment rate (no division error)", () => {
    const r = run({
      birthday_plan_records: [makeBirthdayPlan({ special_requests_noted: [], special_requests_fulfilled: [] })],
    });
    // pct(0,0) = 0, no crash
    expect(r.celebration_score).toBeGreaterThan(0);
  });

  it("all records have negative/minimum values do not crash", () => {
    const r = run({
      birthday_plan_records: [makeBirthdayPlan({ days_advance_planned: 0, budget_amount: 0 })],
      celebration_execution_records: [makeCelebration({ guests_invited: 0, guests_attended: 0, peers_count: 0, family_members_count: 0, celebration_duration_minutes: 0, staff_enthusiasm_rating: 1, atmosphere_rating: 1 })],
      gift_provision_records: [makeGift({ budget_amount: 0 })],
      memory_making_records: [makeMemory({ quality_rating: 1 })],
      child_satisfaction_records: [makeSatisfaction({ overall_satisfaction: 1 })],
    });
    expect(r.celebration_score).toBeGreaterThanOrEqual(0);
    expect(r.celebration_score).toBeLessThanOrEqual(100);
  });

  it("mixed celebration types are counted correctly", () => {
    const celebs = [
      makeCelebration({ celebration_type: "birthday" }),
      makeCelebration({ celebration_type: "christmas" }),
      makeCelebration({ celebration_type: "eid" }),
    ];
    const r = run({ celebration_execution_records: celebs });
    expect(r.celebration_execution_rate).toBe(100);
  });

  it("large dataset (100 records per array) does not crash", () => {
    const r = run({
      birthday_plan_records: makeN(100, makeBirthdayPlan),
      celebration_execution_records: makeN(100, makeCelebration),
      gift_provision_records: makeN(100, makeGift),
      memory_making_records: makeN(100, makeMemory),
      child_satisfaction_records: makeN(100, makeSatisfaction),
    });
    expect(r.celebration_rating).toBe("outstanding");
    expect(r.celebration_score).toBe(80);
  });

  it("exactly at boundary: 50% birthdayPlanningRate avoids penalty", () => {
    const plans = [
      ...makeN(5, makeBirthdayPlan, { child_chose_theme: false, child_chose_guests: false, child_chose_food: false, child_chose_activity: false }),
      ...makeN(5, makeBirthdayPlan, { plan_created: false, child_chose_theme: false, child_chose_guests: false, child_chose_food: false, child_chose_activity: false }),
    ];
    const r = run({ birthday_plan_records: plans });
    // 50% >= 50 => no penalty
    expect(r.celebration_score).toBe(52);
  });

  it("exactly 49% birthdayPlanningRate triggers penalty", () => {
    // Need 49%: not achievable with integers exactly. Round(49/100)=49.
    // Need n/d where round(n/d * 100) = 49 => e.g. 49/100 or simpler approximation
    // 17/35 = 48.57% => rounds to 49? No: Math.round(17/35*100) = Math.round(48.57) = 49
    // But 35 records is a lot. Let's use something smaller.
    // Actually with 100 records: 49 created, 51 not => exactly 49%
    const plans = [
      ...makeN(49, makeBirthdayPlan, { child_chose_theme: false, child_chose_guests: false, child_chose_food: false, child_chose_activity: false }),
      ...makeN(51, makeBirthdayPlan, { plan_created: false, child_chose_theme: false, child_chose_guests: false, child_chose_food: false, child_chose_activity: false }),
    ];
    const r = run({ birthday_plan_records: plans });
    expect(r.birthday_planning_rate).toBe(49);
    expect(r.celebration_score).toBe(47); // 52 - 5
  });

  it("only birthday plans and celebrations, no other records", () => {
    const r = run({
      birthday_plan_records: makeN(5, makeBirthdayPlan, { child_chose_theme: false, child_chose_guests: false, child_chose_food: false, child_chose_activity: false }),
      celebration_execution_records: makeN(5, makeCelebration, { personalised_to_child: false }),
    });
    // birthday: 100% => +4
    // celeb: 100% => +4
    // no gift/memory/satisfaction bonuses or penalties
    // concerns about missing records
    expect(r.celebration_score).toBe(60); // 52 + 4 + 4
    expect(r.concerns.some((c) => c.includes("No gift provision records"))).toBe(true);
    expect(r.concerns.some((c) => c.includes("No memory-making records"))).toBe(true);
    expect(r.concerns.some((c) => c.includes("No child satisfaction records"))).toBe(true);
  });

  it("satisfaction of exactly 4 counts as positive", () => {
    const sats = [makeSatisfaction({ overall_satisfaction: 4, felt_special: false })];
    const r = run({ child_satisfaction_records: sats });
    expect(r.child_satisfaction_rate).toBe(100);
  });

  it("satisfaction of exactly 3 does not count as positive", () => {
    const sats = [makeSatisfaction({ overall_satisfaction: 3, felt_special: false })];
    const r = run({ child_satisfaction_records: sats });
    expect(r.child_satisfaction_rate).toBe(0);
  });

  it("days_advance_planned exactly 14 counts for advance planning", () => {
    const plans = [makeBirthdayPlan({ days_advance_planned: 14, child_chose_theme: false, child_chose_guests: false, child_chose_food: false, child_chose_activity: false, child_consulted: false })];
    const r = run({ birthday_plan_records: plans });
    expect(r.strengths.some((s) => s.includes("14 days in advance"))).toBe(true);
  });

  it("days_advance_planned 13 does not count for advance planning", () => {
    const plans = [makeBirthdayPlan({ days_advance_planned: 13, child_chose_theme: false, child_chose_guests: false, child_chose_food: false, child_chose_activity: false, child_consulted: false })];
    const r = run({ birthday_plan_records: plans });
    expect(r.strengths.some((s) => s.includes("14 days in advance"))).toBe(false);
  });

  it("result shape includes all expected fields", () => {
    const r = run({ total_children: 0 });
    expect(r).toHaveProperty("celebration_rating");
    expect(r).toHaveProperty("celebration_score");
    expect(r).toHaveProperty("headline");
    expect(r).toHaveProperty("birthday_planning_rate");
    expect(r).toHaveProperty("celebration_execution_rate");
    expect(r).toHaveProperty("gift_provision_rate");
    expect(r).toHaveProperty("memory_making_rate");
    expect(r).toHaveProperty("child_satisfaction_rate");
    expect(r).toHaveProperty("child_choice_rate");
    expect(r).toHaveProperty("strengths");
    expect(r).toHaveProperty("concerns");
    expect(r).toHaveProperty("recommendations");
    expect(r).toHaveProperty("insights");
  });
});
