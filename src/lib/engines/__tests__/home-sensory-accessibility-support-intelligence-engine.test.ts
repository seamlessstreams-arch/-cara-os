// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME SENSORY & ACCESSIBILITY SUPPORT INTELLIGENCE ENGINE TESTS
// Comprehensive test suite for sensory and accessibility analysis.
// Covers CHR 2015 Reg 6 (Quality and purpose of care), Reg 10 (Health &
// wellbeing), Reg 25 (Premises and safety), and SCCIF individual needs.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeSensoryAccessibilitySupport,
  type SensoryAccessibilitySupportInput,
  type SensoryProfileInput,
  type AccessibilityAdaptationInput,
  type SensoryRoomInput,
  type SensoryEquipmentInput,
  type SensoryInterventionInput,
} from "../home-sensory-accessibility-support-intelligence-engine";

// ── Factories ───────────────────────────────────────────────────────────────

let _id = 0;
function uid(): string {
  return `test_${++_id}`;
}

function baseInput(
  overrides: Partial<SensoryAccessibilitySupportInput> = {},
): SensoryAccessibilitySupportInput {
  return {
    today: "2026-05-28",
    total_children: 0,
    sensory_profile_records: [],
    accessibility_adaptation_records: [],
    sensory_room_records: [],
    sensory_equipment_records: [],
    sensory_intervention_records: [],
    ...overrides,
  };
}

function makeProfile(
  overrides: Partial<SensoryProfileInput> = {},
): SensoryProfileInput {
  return {
    id: uid(),
    child_id: "child_1",
    assessment_date: "2026-04-01",
    assessor_name: "Staff A",
    profile_type: "full",
    sensory_needs_identified: 3,
    adaptations_recommended: 2,
    adaptations_implemented: 2,
    review_date: "2026-07-01",
    review_overdue: false,
    child_involved_in_assessment: true,
    parent_carer_consulted: true,
    professional_input: true,
    created_at: "2026-04-01",
    ...overrides,
  };
}

function makeAdaptation(
  overrides: Partial<AccessibilityAdaptationInput> = {},
): AccessibilityAdaptationInput {
  return {
    id: uid(),
    child_id: "child_1",
    adaptation_type: "environmental",
    description: "Noise-reducing headphones provided",
    date_requested: "2026-04-01",
    date_implemented: "2026-04-05",
    implemented: true,
    effectiveness_rating: 4,
    child_feedback_positive: true,
    review_date: "2026-07-01",
    review_overdue: false,
    cost_approved: true,
    created_at: "2026-04-01",
    ...overrides,
  };
}

function makeSensoryRoom(
  overrides: Partial<SensoryRoomInput> = {},
): SensoryRoomInput {
  return {
    id: uid(),
    child_id: "child_1",
    session_date: "2026-05-15",
    duration_minutes: 30,
    purpose: "regulation",
    staff_present: true,
    child_engagement_rating: 4,
    outcome_rating: 4,
    child_requested: true,
    goals_met: true,
    notes_recorded: true,
    created_at: "2026-05-15",
    ...overrides,
  };
}

function makeEquipment(
  overrides: Partial<SensoryEquipmentInput> = {},
): SensoryEquipmentInput {
  return {
    id: uid(),
    equipment_name: "Weighted Blanket",
    equipment_type: "weighted",
    date_acquired: "2026-01-01",
    last_maintenance_date: "2026-05-01",
    maintenance_due_date: "2026-08-01",
    maintenance_overdue: false,
    condition: "good",
    in_use: true,
    safety_checked: true,
    assigned_child_id: "child_1",
    created_at: "2026-01-01",
    ...overrides,
  };
}

function makeIntervention(
  overrides: Partial<SensoryInterventionInput> = {},
): SensoryInterventionInput {
  return {
    id: uid(),
    child_id: "child_1",
    intervention_type: "sensory_diet",
    start_date: "2026-03-01",
    end_date: null,
    active: true,
    sessions_planned: 10,
    sessions_completed: 9,
    baseline_score: 3,
    current_score: 7,
    target_score: 8,
    child_reported_improvement: true,
    staff_reported_improvement: true,
    professional_involved: true,
    review_date: "2026-06-01",
    review_overdue: false,
    created_at: "2026-03-01",
    ...overrides,
  };
}

function run(overrides: Partial<SensoryAccessibilitySupportInput> = {}) {
  return computeSensoryAccessibilitySupport(baseInput(overrides));
}

// ── Tests ───────────────────────────────────────────────────────────────────

// ═══════════════════════════════════════════════════════════════════════════
// 1. INSUFFICIENT DATA
// ═══════════════════════════════════════════════════════════════════════════

describe("insufficient data — no children, all arrays empty", () => {
  it("returns insufficient_data rating", () => {
    const r = run();
    expect(r.sensory_rating).toBe("insufficient_data");
  });

  it("returns score 0", () => {
    const r = run();
    expect(r.sensory_score).toBe(0);
  });

  it("returns correct headline", () => {
    const r = run();
    expect(r.headline).toContain("No children on placement");
    expect(r.headline).toContain("insufficient data");
  });

  it("returns zero metrics", () => {
    const r = run();
    expect(r.total_profiles).toBe(0);
    expect(r.sensory_profile_coverage_rate).toBe(0);
    expect(r.accessibility_adaptation_rate).toBe(0);
    expect(r.sensory_room_utilisation_rate).toBe(0);
    expect(r.equipment_maintenance_rate).toBe(0);
    expect(r.intervention_effectiveness_rate).toBe(0);
    expect(r.child_feedback_rate).toBe(0);
    expect(r.adaptation_effectiveness_avg).toBe(0);
    expect(r.intervention_progress_avg).toBe(0);
  });

  it("returns empty arrays for strengths, concerns, recommendations, insights", () => {
    const r = run();
    expect(r.strengths).toEqual([]);
    expect(r.concerns).toEqual([]);
    expect(r.recommendations).toEqual([]);
    expect(r.insights).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. INADEQUATE BASELINE — children > 0 but all arrays empty
// ═══════════════════════════════════════════════════════════════════════════

describe("inadequate baseline — children present, no records", () => {
  it("returns inadequate rating", () => {
    const r = run({ total_children: 3 });
    expect(r.sensory_rating).toBe("inadequate");
  });

  it("returns score 15", () => {
    const r = run({ total_children: 3 });
    expect(r.sensory_score).toBe(15);
  });

  it("returns correct headline about no data", () => {
    const r = run({ total_children: 3 });
    expect(r.headline).toContain("No sensory or accessibility data recorded");
  });

  it("produces exactly 1 concern", () => {
    const r = run({ total_children: 3 });
    expect(r.concerns).toHaveLength(1);
    expect(r.concerns[0]).toContain("No sensory profiles");
  });

  it("produces exactly 2 recommendations", () => {
    const r = run({ total_children: 3 });
    expect(r.recommendations).toHaveLength(2);
    expect(r.recommendations[0].urgency).toBe("immediate");
    expect(r.recommendations[1].urgency).toBe("immediate");
  });

  it("produces exactly 1 critical insight", () => {
    const r = run({ total_children: 3 });
    expect(r.insights).toHaveLength(1);
    expect(r.insights[0].severity).toBe("critical");
  });

  it("produces zero metrics", () => {
    const r = run({ total_children: 3 });
    expect(r.total_profiles).toBe(0);
    expect(r.sensory_profile_coverage_rate).toBe(0);
    expect(r.accessibility_adaptation_rate).toBe(0);
  });

  it("works with 1 child", () => {
    const r = run({ total_children: 1 });
    expect(r.sensory_rating).toBe("inadequate");
    expect(r.sensory_score).toBe(15);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. INDIVIDUAL BONUSES — each bonus tested in isolation
// ═══════════════════════════════════════════════════════════════════════════

describe("Bonus 1: sensory profile coverage rate", () => {
  // With total_children = 5, need unique child_ids in profiles
  // To isolate: no other arrays contribute bonuses, but we must avoid penalties
  // since profiles alone with 0 adaptations/equipment/interventions won't
  // trigger those penalties (they have guards).

  it("+4 when coverage >= 100%", () => {
    const r = run({
      total_children: 3,
      sensory_profile_records: [
        makeProfile({ child_id: "c1" }),
        makeProfile({ child_id: "c2" }),
        makeProfile({ child_id: "c3" }),
      ],
    });
    // base 52 + 4 (coverage 100%) + no other bonuses from empty arrays
    // profileReviewCompliance: 3/3 not overdue = 100% → +2
    // childInvolvement won't affect score directly
    expect(r.sensory_score).toBe(52 + 4 + 2); // +2 from profileReviewCompliance
  });

  it("+2 when coverage >= 80% but < 100%", () => {
    const r = run({
      total_children: 5,
      sensory_profile_records: [
        makeProfile({ child_id: "c1" }),
        makeProfile({ child_id: "c2" }),
        makeProfile({ child_id: "c3" }),
        makeProfile({ child_id: "c4" }),
      ],
    });
    // coverage = 4/5 = 80% → +2
    // profileReviewCompliance = 4/4 not overdue = 100% → +2
    expect(r.sensory_score).toBe(52 + 2 + 2);
  });

  it("+0 when coverage < 80%", () => {
    const r = run({
      total_children: 5,
      sensory_profile_records: [
        makeProfile({ child_id: "c1" }),
        makeProfile({ child_id: "c2" }),
        makeProfile({ child_id: "c3" }),
      ],
    });
    // coverage = 3/5 = 60% → no bonus
    // profileReviewCompliance = 3/3 = 100% → +2
    expect(r.sensory_score).toBe(52 + 2);
  });
});

describe("Bonus 2: accessibility adaptation rate", () => {
  it("+4 when adaptation rate = 100%", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      accessibility_adaptation_records: [
        makeAdaptation({ implemented: true, effectiveness_rating: 4, child_feedback_positive: true }),
        makeAdaptation({ implemented: true, effectiveness_rating: 4, child_feedback_positive: true }),
      ],
    });
    // base 52
    // bonus1: 1/1 = 100% → +4
    // bonus2: 2/2 = 100% → +4
    // bonus6: childFeedback = (2 positive adaptations + 0 interventions) / (2 + 0) = 100% → +3
    // bonus7: adaptationEffAvg = 4.0 → +3
    // bonus8: profileReviewCompliance 100% → +2
    expect(r.sensory_score).toBe(52 + 4 + 4 + 3 + 3 + 2);
  });

  it("+2 when adaptation rate >= 80% but < 100%", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      accessibility_adaptation_records: [
        makeAdaptation({ implemented: true, effectiveness_rating: 2, child_feedback_positive: false }),
        makeAdaptation({ implemented: true, effectiveness_rating: 2, child_feedback_positive: false }),
        makeAdaptation({ implemented: true, effectiveness_rating: 2, child_feedback_positive: false }),
        makeAdaptation({ implemented: true, effectiveness_rating: 2, child_feedback_positive: false }),
        makeAdaptation({ implemented: false, effectiveness_rating: 1, child_feedback_positive: false }),
      ],
    });
    // adaptation rate = 4/5 = 80% → +2
    // adaptationEffAvg = (2+2+2+2)/4 = 2.0 → no bonus7
    // childFeedback = 0/4 = 0% → no bonus6
    // coverage 100% → +4, profileReview 100% → +2
    expect(r.sensory_score).toBe(52 + 4 + 2 + 2);
  });

  it("+0 when adaptation rate < 80%", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      accessibility_adaptation_records: [
        makeAdaptation({ implemented: true, effectiveness_rating: 2, child_feedback_positive: false }),
        makeAdaptation({ implemented: false }),
        makeAdaptation({ implemented: false }),
      ],
    });
    // adaptation rate = 1/3 = 33% → no bonus, and penalty -5 since <50%
    // adaptationEffAvg = 2/1 = 2.0 → no bonus7
    // childFeedback = 0/(1+0) = 0% → no bonus6
    // coverage 100% → +4, profileReview 100% → +2
    expect(r.sensory_score).toBe(52 + 4 + 2 - 5);
  });
});

describe("Bonus 3: sensory room utilisation rate", () => {
  it("+3 when utilisation >= 80%", () => {
    const r = run({
      total_children: 5,
      sensory_room_records: [
        makeSensoryRoom({ child_id: "c1", child_requested: false, goals_met: false, notes_recorded: false, child_engagement_rating: 1, outcome_rating: 1 }),
        makeSensoryRoom({ child_id: "c2", child_requested: false, goals_met: false, notes_recorded: false, child_engagement_rating: 1, outcome_rating: 1 }),
        makeSensoryRoom({ child_id: "c3", child_requested: false, goals_met: false, notes_recorded: false, child_engagement_rating: 1, outcome_rating: 1 }),
        makeSensoryRoom({ child_id: "c4", child_requested: false, goals_met: false, notes_recorded: false, child_engagement_rating: 1, outcome_rating: 1 }),
      ],
    });
    // utilisation = 4/5 = 80% → +3
    // penalty: coverageRate 0% <50 with total_children>0 → -5
    expect(r.sensory_score).toBe(52 + 3 - 5);
  });

  it("+1 when utilisation >= 60% but < 80%", () => {
    const r = run({
      total_children: 5,
      sensory_room_records: [
        makeSensoryRoom({ child_id: "c1", child_requested: false, goals_met: false, notes_recorded: false, child_engagement_rating: 1, outcome_rating: 1 }),
        makeSensoryRoom({ child_id: "c2", child_requested: false, goals_met: false, notes_recorded: false, child_engagement_rating: 1, outcome_rating: 1 }),
        makeSensoryRoom({ child_id: "c3", child_requested: false, goals_met: false, notes_recorded: false, child_engagement_rating: 1, outcome_rating: 1 }),
      ],
    });
    // utilisation = 3/5 = 60% → +1
    // penalty: coverageRate 0% <50 → -5
    expect(r.sensory_score).toBe(52 + 1 - 5);
  });

  it("+0 when utilisation < 60%", () => {
    const r = run({
      total_children: 5,
      sensory_room_records: [
        makeSensoryRoom({ child_id: "c1", child_requested: false, goals_met: false, notes_recorded: false, child_engagement_rating: 1, outcome_rating: 1 }),
        makeSensoryRoom({ child_id: "c2", child_requested: false, goals_met: false, notes_recorded: false, child_engagement_rating: 1, outcome_rating: 1 }),
      ],
    });
    // utilisation = 2/5 = 40% → no bonus
    // penalty: coverageRate 0% <50 → -5
    expect(r.sensory_score).toBe(52 - 5);
  });
});

describe("Bonus 4: equipment maintenance rate", () => {
  it("+3 when maintenance = 100%", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      sensory_equipment_records: [
        makeEquipment({ in_use: true, maintenance_overdue: false, safety_checked: true }),
        makeEquipment({ in_use: true, maintenance_overdue: false, safety_checked: true }),
      ],
    });
    // maintenance = 2/2 active, 0 overdue → 100% → +3
    // coverage 100% → +4, profileReview 100% → +2
    expect(r.sensory_score).toBe(52 + 4 + 3 + 2);
  });

  it("+1 when maintenance >= 80% but < 100%", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      sensory_equipment_records: [
        makeEquipment({ in_use: true, maintenance_overdue: false, safety_checked: true }),
        makeEquipment({ in_use: true, maintenance_overdue: false, safety_checked: true }),
        makeEquipment({ in_use: true, maintenance_overdue: false, safety_checked: true }),
        makeEquipment({ in_use: true, maintenance_overdue: false, safety_checked: true }),
        makeEquipment({ in_use: true, maintenance_overdue: true, safety_checked: true }),
      ],
    });
    // maintenance = (5-1)/5 = 80% → +1
    // coverage 100% → +4, profileReview 100% → +2
    expect(r.sensory_score).toBe(52 + 4 + 1 + 2);
  });

  it("+0 when maintenance < 80%", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      sensory_equipment_records: [
        makeEquipment({ in_use: true, maintenance_overdue: false, safety_checked: true }),
        makeEquipment({ in_use: true, maintenance_overdue: true, safety_checked: true }),
        makeEquipment({ in_use: true, maintenance_overdue: true, safety_checked: true }),
      ],
    });
    // maintenance = (3-2)/3 = 33% → no bonus, penalty -4 since <50%
    // coverage 100% → +4, profileReview 100% → +2
    expect(r.sensory_score).toBe(52 + 4 + 2 - 4);
  });
});

describe("Bonus 5: intervention effectiveness rate", () => {
  it("+4 when effectiveness >= 90%", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      sensory_intervention_records: [
        makeIntervention({ current_score: 5, baseline_score: 3, target_score: 8, sessions_planned: 10, sessions_completed: 9, child_reported_improvement: false, staff_reported_improvement: false, professional_involved: false }),
        makeIntervention({ current_score: 6, baseline_score: 4, target_score: 9, sessions_planned: 10, sessions_completed: 9, child_reported_improvement: false, staff_reported_improvement: false, professional_involved: false }),
      ],
    });
    // effectiveness = 2/2 = 100% → +4
    // childFeedback = 0/(0 impl_adaptations + 2 interventions) = 0% → no bonus6
    // sessionCompletion = 18/20 = 90% → +2
    // coverage 100% → +4, profileReview 100% → +2
    expect(r.sensory_score).toBe(52 + 4 + 4 + 2 + 2);
  });

  it("+2 when effectiveness >= 70% but < 90%", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      sensory_intervention_records: [
        makeIntervention({ current_score: 5, baseline_score: 3, target_score: 8, sessions_planned: 10, sessions_completed: 5, child_reported_improvement: false, staff_reported_improvement: false, professional_involved: false }),
        makeIntervention({ current_score: 6, baseline_score: 4, target_score: 9, sessions_planned: 10, sessions_completed: 5, child_reported_improvement: false, staff_reported_improvement: false, professional_involved: false }),
        makeIntervention({ current_score: 2, baseline_score: 3, target_score: 8, sessions_planned: 10, sessions_completed: 5, child_reported_improvement: false, staff_reported_improvement: false, professional_involved: false }),
      ],
    });
    // effectiveness = 2/3 = 67% → rounds to 67% which is < 70 → no bonus
    // Actually pct(2,3) = Math.round(2/3*100) = Math.round(66.67) = 67 → <70 → no +2
    // Need 70%: 7/10 or 3/4
    expect(r.sensory_score).toBe(52 + 4 + 2); // coverage +4, profileReview +2
  });

  it("+2 when effectiveness exactly 70%", () => {
    // Need pct that rounds to exactly 70: 7/10
    const interventions = [];
    for (let i = 0; i < 7; i++) {
      interventions.push(makeIntervention({
        current_score: 5, baseline_score: 3, target_score: 8,
        sessions_planned: 10, sessions_completed: 5,
        child_reported_improvement: false, staff_reported_improvement: false, professional_involved: false,
      }));
    }
    for (let i = 0; i < 3; i++) {
      interventions.push(makeIntervention({
        current_score: 2, baseline_score: 3, target_score: 8,
        sessions_planned: 10, sessions_completed: 5,
        child_reported_improvement: false, staff_reported_improvement: false, professional_involved: false,
      }));
    }
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      sensory_intervention_records: interventions,
    });
    // effectiveness = 7/10 = 70% → +2
    // sessionCompletion = 50/100 = 50% → no bonus9
    // coverage 100% → +4, profileReview 100% → +2
    expect(r.sensory_score).toBe(52 + 4 + 2 + 2);
  });

  it("+0 when effectiveness < 70%", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      sensory_intervention_records: [
        makeIntervention({ current_score: 5, baseline_score: 3, target_score: 8, sessions_planned: 10, sessions_completed: 5, child_reported_improvement: false, staff_reported_improvement: false, professional_involved: false }),
        makeIntervention({ current_score: 2, baseline_score: 3, target_score: 8, sessions_planned: 10, sessions_completed: 5, child_reported_improvement: false, staff_reported_improvement: false, professional_involved: false }),
      ],
    });
    // effectiveness = 1/2 = 50% → no bonus
    // coverage 100% → +4, profileReview 100% → +2
    expect(r.sensory_score).toBe(52 + 4 + 2);
  });
});

describe("Bonus 6: child feedback rate", () => {
  it("+3 when feedback >= 90%", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      accessibility_adaptation_records: [
        makeAdaptation({ implemented: true, effectiveness_rating: 2, child_feedback_positive: true }),
      ],
      sensory_intervention_records: [
        makeIntervention({
          current_score: 5, baseline_score: 3, target_score: 8,
          sessions_planned: 10, sessions_completed: 9,
          child_reported_improvement: true, staff_reported_improvement: false, professional_involved: false,
        }),
      ],
    });
    // childFeedback = (1 adaptation positive + 1 child_reported) / (1 implemented + 1 intervention) = 2/2 = 100% → +3
    // adaptation rate = 1/1 = 100% → +4
    // adaptationEffAvg = 2.0 → no bonus7
    // effectiveness = 1/1 = 100% → +4
    // sessionCompletion = 9/10 = 90% → +2
    // coverage 100% → +4, profileReview 100% → +2
    expect(r.sensory_score).toBe(52 + 4 + 4 + 4 + 3 + 2 + 2);
  });

  it("+1 when feedback >= 70% but < 90%", () => {
    const adaptations = [];
    for (let i = 0; i < 7; i++) {
      adaptations.push(makeAdaptation({
        implemented: true, effectiveness_rating: 2, child_feedback_positive: true,
      }));
    }
    for (let i = 0; i < 3; i++) {
      adaptations.push(makeAdaptation({
        implemented: true, effectiveness_rating: 2, child_feedback_positive: false,
      }));
    }
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      accessibility_adaptation_records: adaptations,
    });
    // childFeedback = 7/(10 + 0) = 70% → +1
    // adaptationRate = 10/10 = 100% → +4
    // adaptationEffAvg = 2.0 → no bonus7
    // coverage 100% → +4, profileReview 100% → +2
    expect(r.sensory_score).toBe(52 + 4 + 4 + 1 + 2);
  });

  it("+0 when feedback < 70%", () => {
    const adaptations = [];
    for (let i = 0; i < 3; i++) {
      adaptations.push(makeAdaptation({
        implemented: true, effectiveness_rating: 2, child_feedback_positive: true,
      }));
    }
    for (let i = 0; i < 7; i++) {
      adaptations.push(makeAdaptation({
        implemented: true, effectiveness_rating: 2, child_feedback_positive: false,
      }));
    }
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      accessibility_adaptation_records: adaptations,
    });
    // childFeedback = 3/10 = 30% → no bonus
    // adaptationRate = 10/10 = 100% → +4
    // adaptationEffAvg = 2.0 → no bonus7
    // coverage 100% → +4, profileReview 100% → +2
    expect(r.sensory_score).toBe(52 + 4 + 4 + 2);
  });
});

describe("Bonus 7: adaptation effectiveness average", () => {
  it("+3 when avg >= 4.0", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      accessibility_adaptation_records: [
        makeAdaptation({ implemented: true, effectiveness_rating: 4, child_feedback_positive: false }),
        makeAdaptation({ implemented: true, effectiveness_rating: 4, child_feedback_positive: false }),
      ],
    });
    // adaptationEffAvg = 4.0 → +3
    // adaptationRate = 2/2 = 100% → +4
    // childFeedback = 0/2 = 0% → no bonus6
    // coverage 100% → +4, profileReview 100% → +2
    expect(r.sensory_score).toBe(52 + 4 + 4 + 3 + 2);
  });

  it("+1 when avg >= 3.0 but < 4.0", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      accessibility_adaptation_records: [
        makeAdaptation({ implemented: true, effectiveness_rating: 3, child_feedback_positive: false }),
        makeAdaptation({ implemented: true, effectiveness_rating: 3, child_feedback_positive: false }),
      ],
    });
    // adaptationEffAvg = 3.0 → +1
    // adaptationRate = 2/2 = 100% → +4
    // childFeedback = 0/2 = 0% → no bonus6
    // coverage 100% → +4, profileReview 100% → +2
    expect(r.sensory_score).toBe(52 + 4 + 4 + 1 + 2);
  });

  it("+0 when avg < 3.0", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      accessibility_adaptation_records: [
        makeAdaptation({ implemented: true, effectiveness_rating: 2, child_feedback_positive: false }),
        makeAdaptation({ implemented: true, effectiveness_rating: 2, child_feedback_positive: false }),
      ],
    });
    // adaptationEffAvg = 2.0 → no bonus
    // adaptationRate = 2/2 = 100% → +4
    // coverage 100% → +4, profileReview 100% → +2
    expect(r.sensory_score).toBe(52 + 4 + 4 + 2);
  });
});

describe("Bonus 8: profile review compliance rate", () => {
  it("+2 when compliance = 100%", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [
        makeProfile({ child_id: "c1", review_overdue: false }),
      ],
    });
    // profileReviewCompliance = 1/1 = 100% → +2
    // coverage 100% → +4
    expect(r.sensory_score).toBe(52 + 4 + 2);
  });

  it("+1 when compliance >= 80% but < 100%", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [
        makeProfile({ child_id: "c1", review_overdue: false }),
        makeProfile({ child_id: "c1", review_overdue: false }),
        makeProfile({ child_id: "c1", review_overdue: false }),
        makeProfile({ child_id: "c1", review_overdue: false }),
        makeProfile({ child_id: "c1", review_overdue: true }),
      ],
    });
    // profileReviewCompliance = 4/5 = 80% → +1
    // coverage = 1 unique child / 1 total = 100% → +4
    expect(r.sensory_score).toBe(52 + 4 + 1);
  });

  it("+0 when compliance < 80%", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [
        makeProfile({ child_id: "c1", review_overdue: false }),
        makeProfile({ child_id: "c1", review_overdue: true }),
        makeProfile({ child_id: "c1", review_overdue: true }),
      ],
    });
    // profileReviewCompliance = 1/3 = 33% → no bonus
    // coverage = 1/1 = 100% → +4
    expect(r.sensory_score).toBe(52 + 4);
  });
});

describe("Bonus 9: session completion rate", () => {
  it("+2 when completion >= 90%", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      sensory_intervention_records: [
        makeIntervention({
          sessions_planned: 10, sessions_completed: 9,
          current_score: 5, baseline_score: 3, target_score: 8,
          child_reported_improvement: false, staff_reported_improvement: false, professional_involved: false,
        }),
      ],
    });
    // sessionCompletion = 9/10 = 90% → +2
    // effectiveness = 1/1 = 100% → +4
    // childFeedback = 0/1 = 0% → no bonus6
    // coverage 100% → +4, profileReview 100% → +2
    expect(r.sensory_score).toBe(52 + 4 + 4 + 2 + 2);
  });

  it("+1 when completion >= 70% but < 90%", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      sensory_intervention_records: [
        makeIntervention({
          sessions_planned: 10, sessions_completed: 7,
          current_score: 5, baseline_score: 3, target_score: 8,
          child_reported_improvement: false, staff_reported_improvement: false, professional_involved: false,
        }),
      ],
    });
    // sessionCompletion = 7/10 = 70% → +1
    // effectiveness = 1/1 = 100% → +4
    // coverage 100% → +4, profileReview 100% → +2
    expect(r.sensory_score).toBe(52 + 4 + 4 + 1 + 2);
  });

  it("+0 when completion < 70%", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      sensory_intervention_records: [
        makeIntervention({
          sessions_planned: 10, sessions_completed: 5,
          current_score: 5, baseline_score: 3, target_score: 8,
          child_reported_improvement: false, staff_reported_improvement: false, professional_involved: false,
        }),
      ],
    });
    // sessionCompletion = 5/10 = 50% → no bonus
    // effectiveness = 1/1 = 100% → +4
    // coverage 100% → +4, profileReview 100% → +2
    expect(r.sensory_score).toBe(52 + 4 + 4 + 2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. ALL BONUSES COMBINED — maximum score
// ═══════════════════════════════════════════════════════════════════════════

describe("all bonuses combined — maximum score", () => {
  function maxInput(): SensoryAccessibilitySupportInput {
    return baseInput({
      total_children: 3,
      sensory_profile_records: [
        makeProfile({ child_id: "c1", review_overdue: false, child_involved_in_assessment: true }),
        makeProfile({ child_id: "c2", review_overdue: false, child_involved_in_assessment: true }),
        makeProfile({ child_id: "c3", review_overdue: false, child_involved_in_assessment: true }),
      ],
      accessibility_adaptation_records: [
        makeAdaptation({ implemented: true, effectiveness_rating: 5, child_feedback_positive: true }),
        makeAdaptation({ implemented: true, effectiveness_rating: 4, child_feedback_positive: true }),
        makeAdaptation({ implemented: true, effectiveness_rating: 4, child_feedback_positive: true }),
      ],
      sensory_room_records: [
        makeSensoryRoom({ child_id: "c1", goals_met: true, notes_recorded: true, child_requested: true }),
        makeSensoryRoom({ child_id: "c2", goals_met: true, notes_recorded: true, child_requested: true }),
        makeSensoryRoom({ child_id: "c3", goals_met: true, notes_recorded: true, child_requested: true }),
      ],
      sensory_equipment_records: [
        makeEquipment({ in_use: true, maintenance_overdue: false, safety_checked: true }),
        makeEquipment({ in_use: true, maintenance_overdue: false, safety_checked: true }),
      ],
      sensory_intervention_records: [
        makeIntervention({
          current_score: 7, baseline_score: 3, target_score: 8,
          sessions_planned: 10, sessions_completed: 10,
          child_reported_improvement: true, staff_reported_improvement: true, professional_involved: true,
        }),
        makeIntervention({
          current_score: 8, baseline_score: 4, target_score: 9,
          sessions_planned: 10, sessions_completed: 9,
          child_reported_improvement: true, staff_reported_improvement: true, professional_involved: true,
        }),
      ],
    });
  }

  it("score = 80 (52 base + 28 bonuses)", () => {
    const r = computeSensoryAccessibilitySupport(maxInput());
    // Bonus 1: coverage 3/3=100% → +4
    // Bonus 2: adaptation 3/3=100% → +4
    // Bonus 3: roomUtil 3/3=100% → +3
    // Bonus 4: equipment 2/2=100% → +3
    // Bonus 5: effectiveness 2/2=100% → +4
    // Bonus 6: childFeedback (3+2)/(3+2)=100% → +3
    // Bonus 7: adaptationEffAvg (5+4+4)/3=4.33 → +3
    // Bonus 8: profileReviewComp 3/3=100% → +2
    // Bonus 9: sessionCompletion 19/20=95% → +2
    // Total: 52 + 4+4+3+3+4+3+3+2+2 = 52+28 = 80
    expect(r.sensory_score).toBe(80);
  });

  it("rating = outstanding", () => {
    const r = computeSensoryAccessibilitySupport(maxInput());
    expect(r.sensory_rating).toBe("outstanding");
  });

  it("headline contains 'Outstanding'", () => {
    const r = computeSensoryAccessibilitySupport(maxInput());
    expect(r.headline).toContain("Outstanding");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. INDIVIDUAL PENALTIES
// ═══════════════════════════════════════════════════════════════════════════

describe("Penalty 1: sensory profile coverage < 50%", () => {
  it("-5 when coverage < 50% and total_children > 0", () => {
    const r = run({
      total_children: 5,
      sensory_profile_records: [
        makeProfile({ child_id: "c1" }),
        makeProfile({ child_id: "c2" }),
      ],
    });
    // coverage = 2/5 = 40% → -5
    // profileReviewCompliance = 2/2 = 100% → +2
    expect(r.sensory_score).toBe(52 + 2 - 5);
  });

  it("no penalty when coverage >= 50%", () => {
    const r = run({
      total_children: 4,
      sensory_profile_records: [
        makeProfile({ child_id: "c1" }),
        makeProfile({ child_id: "c2" }),
      ],
    });
    // coverage = 2/4 = 50% → no penalty, no bonus (< 80)
    // profileReviewCompliance = 2/2 = 100% → +2
    expect(r.sensory_score).toBe(52 + 2);
  });
});

describe("Penalty 2: accessibility adaptation rate < 50%", () => {
  it("-5 when adaptation rate < 50% and totalAdaptations > 0", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      accessibility_adaptation_records: [
        makeAdaptation({ implemented: true, effectiveness_rating: 2, child_feedback_positive: false }),
        makeAdaptation({ implemented: false }),
        makeAdaptation({ implemented: false }),
        makeAdaptation({ implemented: false }),
      ],
    });
    // adaptationRate = 1/4 = 25% → -5
    // adaptationEffAvg = 2.0 → no bonus7
    // childFeedback = 0/(1+0) = 0% → no bonus6
    // coverage 100% → +4, profileReview 100% → +2
    expect(r.sensory_score).toBe(52 + 4 + 2 - 5);
  });

  it("no penalty when adaptation rate >= 50%", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      accessibility_adaptation_records: [
        makeAdaptation({ implemented: true, effectiveness_rating: 2, child_feedback_positive: false }),
        makeAdaptation({ implemented: false }),
      ],
    });
    // adaptationRate = 1/2 = 50% → no penalty, no bonus (<80)
    // coverage 100% → +4, profileReview 100% → +2
    expect(r.sensory_score).toBe(52 + 4 + 2);
  });
});

describe("Penalty 3: equipment maintenance < 50%", () => {
  it("-4 when maintenance < 50% and activeEquipment > 0", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      sensory_equipment_records: [
        makeEquipment({ in_use: true, maintenance_overdue: true, safety_checked: true }),
        makeEquipment({ in_use: true, maintenance_overdue: true, safety_checked: true }),
      ],
    });
    // maintenance = (2-2)/2 = 0% → -4
    // coverage 100% → +4, profileReview 100% → +2
    expect(r.sensory_score).toBe(52 + 4 + 2 - 4);
  });

  it("no penalty when maintenance >= 50%", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      sensory_equipment_records: [
        makeEquipment({ in_use: true, maintenance_overdue: false, safety_checked: true }),
        makeEquipment({ in_use: true, maintenance_overdue: true, safety_checked: true }),
      ],
    });
    // maintenance = (2-1)/2 = 50% → no penalty, no bonus (<80)
    // coverage 100% → +4, profileReview 100% → +2
    expect(r.sensory_score).toBe(52 + 4 + 2);
  });
});

describe("Penalty 4: intervention effectiveness < 40%", () => {
  it("-4 when effectiveness < 40% and totalInterventions > 0", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      sensory_intervention_records: [
        makeIntervention({
          current_score: 2, baseline_score: 3, target_score: 8,
          sessions_planned: 10, sessions_completed: 5,
          child_reported_improvement: false, staff_reported_improvement: false, professional_involved: false,
        }),
        makeIntervention({
          current_score: 1, baseline_score: 3, target_score: 8,
          sessions_planned: 10, sessions_completed: 5,
          child_reported_improvement: false, staff_reported_improvement: false, professional_involved: false,
        }),
        makeIntervention({
          current_score: 4, baseline_score: 3, target_score: 8,
          sessions_planned: 10, sessions_completed: 5,
          child_reported_improvement: false, staff_reported_improvement: false, professional_involved: false,
        }),
      ],
    });
    // effectiveness = 1/3 = 33% → -4
    // sessionCompletion = 15/30 = 50% → no bonus
    // childFeedback = 0/3 = 0% → no bonus
    // coverage 100% → +4, profileReview 100% → +2
    expect(r.sensory_score).toBe(52 + 4 + 2 - 4);
  });

  it("no penalty when effectiveness >= 40%", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      sensory_intervention_records: [
        makeIntervention({
          current_score: 5, baseline_score: 3, target_score: 8,
          sessions_planned: 10, sessions_completed: 5,
          child_reported_improvement: false, staff_reported_improvement: false, professional_involved: false,
        }),
        makeIntervention({
          current_score: 2, baseline_score: 3, target_score: 8,
          sessions_planned: 10, sessions_completed: 5,
          child_reported_improvement: false, staff_reported_improvement: false, professional_involved: false,
        }),
      ],
    });
    // effectiveness = 1/2 = 50% → no penalty, no bonus (<70)
    // coverage 100% → +4, profileReview 100% → +2
    expect(r.sensory_score).toBe(52 + 4 + 2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 6. PENALTY GUARDS
// ═══════════════════════════════════════════════════════════════════════════

describe("penalty guards — no penalty when guard condition not met", () => {
  it("no profile coverage penalty when total_children = 0", () => {
    // coverage < 50 but total_children = 0 → special case handled above (insufficient data)
    // If we have some profiles but 0 children:
    const r = run({
      total_children: 0,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
    });
    // Actually allEmpty is false so it goes to normal path
    // coverage = 0 children → pct = 0 but penalty guard: total_children > 0 is false → no penalty
    // profileReview = 1/1 = 100% → +2
    expect(r.sensory_score).toBe(52 + 2);
  });

  it("no adaptation penalty when totalAdaptations = 0", () => {
    const r = run({
      total_children: 3,
    });
    // This is allEmpty → special case returns 15
    // We need at least one non-empty array
    const r2 = run({
      total_children: 3,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      // no adaptations → adaptationRate = pct(0,0) = 0, but guard totalAdaptations > 0 is false
    });
    // coverage = 1/3 = 33% → -5 penalty
    // profileReview = 100% → +2
    expect(r2.sensory_score).toBe(52 + 2 - 5);
  });

  it("no equipment penalty when activeEquipment = 0", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      sensory_equipment_records: [
        makeEquipment({ in_use: false, maintenance_overdue: true }),
      ],
    });
    // activeEquipment = 0 → no penalty even if all overdue
    // coverage 100% → +4, profileReview 100% → +2
    expect(r.sensory_score).toBe(52 + 4 + 2);
  });

  it("no intervention penalty when totalInterventions = 0", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
    });
    // no interventions → no penalty
    // coverage 100% → +4, profileReview 100% → +2
    expect(r.sensory_score).toBe(52 + 4 + 2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 7. RATING BOUNDARIES
// ═══════════════════════════════════════════════════════════════════════════

describe("rating boundaries", () => {
  it("score 80 → outstanding", () => {
    const r = run({
      total_children: 3,
      sensory_profile_records: [
        makeProfile({ child_id: "c1" }),
        makeProfile({ child_id: "c2" }),
        makeProfile({ child_id: "c3" }),
      ],
      accessibility_adaptation_records: [
        makeAdaptation({ implemented: true, effectiveness_rating: 5, child_feedback_positive: true }),
        makeAdaptation({ implemented: true, effectiveness_rating: 4, child_feedback_positive: true }),
        makeAdaptation({ implemented: true, effectiveness_rating: 4, child_feedback_positive: true }),
      ],
      sensory_room_records: [
        makeSensoryRoom({ child_id: "c1", goals_met: true, notes_recorded: true, child_requested: true }),
        makeSensoryRoom({ child_id: "c2", goals_met: true, notes_recorded: true, child_requested: true }),
        makeSensoryRoom({ child_id: "c3", goals_met: true, notes_recorded: true, child_requested: true }),
      ],
      sensory_equipment_records: [
        makeEquipment({ in_use: true, maintenance_overdue: false, safety_checked: true }),
        makeEquipment({ in_use: true, maintenance_overdue: false, safety_checked: true }),
      ],
      sensory_intervention_records: [
        makeIntervention({
          current_score: 7, baseline_score: 3, target_score: 8,
          sessions_planned: 10, sessions_completed: 10,
          child_reported_improvement: true, staff_reported_improvement: true, professional_involved: true,
        }),
        makeIntervention({
          current_score: 8, baseline_score: 4, target_score: 9,
          sessions_planned: 10, sessions_completed: 9,
          child_reported_improvement: true, staff_reported_improvement: true, professional_involved: true,
        }),
      ],
    });
    expect(r.sensory_score).toBe(80);
    expect(r.sensory_rating).toBe("outstanding");
  });

  it("score 79 → good (not outstanding)", () => {
    // Get 79: base 52 + bonuses that sum to 27
    // Drop sessionCompletion from max to get 78... need exactly 79
    // Max is 80. Drop bonus9 partially: sessionCompletion 70-89% → +1 instead of +2 → 79
    const r = run({
      total_children: 3,
      sensory_profile_records: [
        makeProfile({ child_id: "c1" }),
        makeProfile({ child_id: "c2" }),
        makeProfile({ child_id: "c3" }),
      ],
      accessibility_adaptation_records: [
        makeAdaptation({ implemented: true, effectiveness_rating: 5, child_feedback_positive: true }),
        makeAdaptation({ implemented: true, effectiveness_rating: 4, child_feedback_positive: true }),
        makeAdaptation({ implemented: true, effectiveness_rating: 4, child_feedback_positive: true }),
      ],
      sensory_room_records: [
        makeSensoryRoom({ child_id: "c1", goals_met: true, notes_recorded: true, child_requested: true }),
        makeSensoryRoom({ child_id: "c2", goals_met: true, notes_recorded: true, child_requested: true }),
        makeSensoryRoom({ child_id: "c3", goals_met: true, notes_recorded: true, child_requested: true }),
      ],
      sensory_equipment_records: [
        makeEquipment({ in_use: true, maintenance_overdue: false, safety_checked: true }),
        makeEquipment({ in_use: true, maintenance_overdue: false, safety_checked: true }),
      ],
      sensory_intervention_records: [
        makeIntervention({
          current_score: 7, baseline_score: 3, target_score: 8,
          sessions_planned: 10, sessions_completed: 8,
          child_reported_improvement: true, staff_reported_improvement: true, professional_involved: true,
        }),
        makeIntervention({
          current_score: 8, baseline_score: 4, target_score: 9,
          sessions_planned: 10, sessions_completed: 7,
          child_reported_improvement: true, staff_reported_improvement: true, professional_involved: true,
        }),
      ],
    });
    // sessionCompletion = 15/20 = 75% → +1 (not +2)
    // All other bonuses same as max → 52 + 4+4+3+3+4+3+3+2+1 = 79
    expect(r.sensory_score).toBe(79);
    expect(r.sensory_rating).toBe("good");
  });

  it("score 65 → good", () => {
    // base 52 + need 13 from bonuses
    // coverage 100% → +4, adaptationRate 100% → +4, profileReview 100% → +2, adaptationEffAvg >=4 → +3 = 13
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      accessibility_adaptation_records: [
        makeAdaptation({ implemented: true, effectiveness_rating: 4, child_feedback_positive: false }),
      ],
    });
    // coverage 100% → +4
    // adaptation 100% → +4
    // adaptationEffAvg 4.0 → +3
    // childFeedback 0/(1+0) = 0% → no bonus
    // profileReview 100% → +2
    // Total: 52 + 4 + 4 + 3 + 2 = 65
    expect(r.sensory_score).toBe(65);
    expect(r.sensory_rating).toBe("good");
  });

  it("score 64 → adequate (not good)", () => {
    // 52 + 12 = 64
    // coverage 100% → +4, adaptationRate 100% → +4, adaptationEffAvg 3.0 → +1 = 9... need 12
    // coverage 100% → +4, adaptationRate 100% → +4, profileReview 100% → +2, adaptationEffAvg >=3.0 → +1, childFeedback >=70 → +1 = 12
    const adaptations = [];
    for (let i = 0; i < 7; i++) {
      adaptations.push(makeAdaptation({
        implemented: true, effectiveness_rating: 3, child_feedback_positive: true,
      }));
    }
    for (let i = 0; i < 3; i++) {
      adaptations.push(makeAdaptation({
        implemented: true, effectiveness_rating: 3, child_feedback_positive: false,
      }));
    }
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      accessibility_adaptation_records: adaptations,
    });
    // coverage 100% → +4
    // adaptation 10/10 = 100% → +4
    // adaptationEffAvg 3.0 → +1
    // childFeedback = 7/(10+0) = 70% → +1
    // profileReview 100% → +2
    // Total: 52 + 4 + 4 + 1 + 1 + 2 = 64
    expect(r.sensory_score).toBe(64);
    expect(r.sensory_rating).toBe("adequate");
  });

  it("score 45 → adequate", () => {
    // base 52 - 7 from penalties = 45
    // Need exactly -7: coverage penalty (-5) + equipment penalty (-4) = -9... too much
    // coverage penalty (-5) + adaptation penalty (-5) = -10 + some bonuses
    // 52 + profileReview +2 - 5 (coverage) - 4 (equipment) = 45
    const r = run({
      total_children: 5,
      sensory_profile_records: [
        makeProfile({ child_id: "c1" }),
        makeProfile({ child_id: "c2" }),
      ],
      sensory_equipment_records: [
        makeEquipment({ in_use: true, maintenance_overdue: true, safety_checked: true }),
        makeEquipment({ in_use: true, maintenance_overdue: true, safety_checked: true }),
      ],
    });
    // coverage = 2/5 = 40% → -5
    // equipmentMaintenance = 0/2 = 0% → -4
    // profileReview = 2/2 = 100% → +2
    // Total: 52 + 2 - 5 - 4 = 45
    expect(r.sensory_score).toBe(45);
    expect(r.sensory_rating).toBe("adequate");
  });

  it("score 44 → inadequate (not adequate)", () => {
    // 52 + profileReview +1 - 5 - 4 = 44
    const r = run({
      total_children: 5,
      sensory_profile_records: [
        makeProfile({ child_id: "c1", review_overdue: false }),
        makeProfile({ child_id: "c2", review_overdue: false }),
        makeProfile({ child_id: "c2", review_overdue: false }),
        makeProfile({ child_id: "c2", review_overdue: false }),
        makeProfile({ child_id: "c2", review_overdue: true }),
      ],
      sensory_equipment_records: [
        makeEquipment({ in_use: true, maintenance_overdue: true, safety_checked: true }),
        makeEquipment({ in_use: true, maintenance_overdue: true, safety_checked: true }),
      ],
    });
    // coverage = 2/5 = 40% → -5
    // equipmentMaintenance = 0/2 = 0% → -4
    // profileReview = 4/5 = 80% → +1
    // Total: 52 + 1 - 5 - 4 = 44
    expect(r.sensory_score).toBe(44);
    expect(r.sensory_rating).toBe("inadequate");
  });

  it("score clamped to 0 minimum", () => {
    // base 52, max penalties = 5+5+4+4 = 18 → 52-18 = 34, can't get below 0 with these alone
    // But that's fine, the clamp(0,100) exists
    // We can't naturally exceed -52 from base with only 18 penalty points
    // Just verify clamping logic exists by confirming score doesn't go negative
    const r = run({
      total_children: 10,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      accessibility_adaptation_records: [
        makeAdaptation({ implemented: false }),
        makeAdaptation({ implemented: false }),
        makeAdaptation({ implemented: false }),
      ],
      sensory_equipment_records: [
        makeEquipment({ in_use: true, maintenance_overdue: true, safety_checked: false }),
        makeEquipment({ in_use: true, maintenance_overdue: true, safety_checked: false }),
      ],
      sensory_intervention_records: [
        makeIntervention({
          current_score: 1, baseline_score: 3, target_score: 8,
          sessions_planned: 10, sessions_completed: 2,
          child_reported_improvement: false, staff_reported_improvement: false, professional_involved: false,
        }),
        makeIntervention({
          current_score: 2, baseline_score: 3, target_score: 8,
          sessions_planned: 10, sessions_completed: 2,
          child_reported_improvement: false, staff_reported_improvement: false, professional_involved: false,
        }),
        makeIntervention({
          current_score: 1, baseline_score: 4, target_score: 8,
          sessions_planned: 10, sessions_completed: 2,
          child_reported_improvement: false, staff_reported_improvement: false, professional_involved: false,
        }),
      ],
    });
    // coverage = 1/10 = 10% → -5
    // adaptation = 0/3 = 0% → -5
    // equipment = 0/2 = 0% → -4
    // intervention = 0/3 = 0% → -4
    // profileReview = 1/1 = 100% → +2
    // Total: 52 + 2 - 5 - 5 - 4 - 4 = 36
    expect(r.sensory_score).toBe(36);
    expect(r.sensory_score).toBeGreaterThanOrEqual(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 8. METRIC CALCULATIONS
// ═══════════════════════════════════════════════════════════════════════════

describe("metric calculations", () => {
  it("total_profiles counts all profile records", () => {
    const r = run({
      total_children: 2,
      sensory_profile_records: [
        makeProfile({ child_id: "c1" }),
        makeProfile({ child_id: "c1" }),
        makeProfile({ child_id: "c2" }),
      ],
    });
    expect(r.total_profiles).toBe(3);
  });

  it("sensory_profile_coverage_rate uses unique child_ids", () => {
    const r = run({
      total_children: 4,
      sensory_profile_records: [
        makeProfile({ child_id: "c1" }),
        makeProfile({ child_id: "c1" }),
        makeProfile({ child_id: "c2" }),
      ],
    });
    // unique children = 2, total = 4 → 50%
    expect(r.sensory_profile_coverage_rate).toBe(50);
  });

  it("accessibility_adaptation_rate = implemented/total", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      accessibility_adaptation_records: [
        makeAdaptation({ implemented: true, effectiveness_rating: 2, child_feedback_positive: false }),
        makeAdaptation({ implemented: true, effectiveness_rating: 2, child_feedback_positive: false }),
        makeAdaptation({ implemented: false }),
        makeAdaptation({ implemented: false }),
      ],
    });
    expect(r.accessibility_adaptation_rate).toBe(50);
  });

  it("sensory_room_utilisation_rate uses unique child_ids", () => {
    const r = run({
      total_children: 4,
      sensory_room_records: [
        makeSensoryRoom({ child_id: "c1", child_requested: false, goals_met: false, notes_recorded: false }),
        makeSensoryRoom({ child_id: "c1", child_requested: false, goals_met: false, notes_recorded: false }),
        makeSensoryRoom({ child_id: "c2", child_requested: false, goals_met: false, notes_recorded: false }),
        makeSensoryRoom({ child_id: "c3", child_requested: false, goals_met: false, notes_recorded: false }),
      ],
    });
    // unique = 3, total = 4 → 75%
    expect(r.sensory_room_utilisation_rate).toBe(75);
  });

  it("equipment_maintenance_rate = (active - overdue_active) / active", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      sensory_equipment_records: [
        makeEquipment({ in_use: true, maintenance_overdue: false }),
        makeEquipment({ in_use: true, maintenance_overdue: false }),
        makeEquipment({ in_use: true, maintenance_overdue: true }),
        makeEquipment({ in_use: false, maintenance_overdue: true }), // not counted (not in use)
      ],
    });
    // active = 3, overdue active = 1 → (3-1)/3 = 67%
    expect(r.equipment_maintenance_rate).toBe(67);
  });

  it("intervention_effectiveness_rate = showing_improvement / total", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      sensory_intervention_records: [
        makeIntervention({ current_score: 5, baseline_score: 3, child_reported_improvement: false, staff_reported_improvement: false, professional_involved: false, sessions_planned: 10, sessions_completed: 5 }),
        makeIntervention({ current_score: 3, baseline_score: 3, child_reported_improvement: false, staff_reported_improvement: false, professional_involved: false, sessions_planned: 10, sessions_completed: 5 }),
        makeIntervention({ current_score: 2, baseline_score: 3, child_reported_improvement: false, staff_reported_improvement: false, professional_involved: false, sessions_planned: 10, sessions_completed: 5 }),
      ],
    });
    // improvement: only first (5>3). 1/3 = 33%
    expect(r.intervention_effectiveness_rate).toBe(33);
  });

  it("child_feedback_rate = (positive_adaptation_feedback + child_reported_improvement) / (implemented + total_interventions)", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      accessibility_adaptation_records: [
        makeAdaptation({ implemented: true, child_feedback_positive: true, effectiveness_rating: 2 }),
        makeAdaptation({ implemented: true, child_feedback_positive: false, effectiveness_rating: 2 }),
        makeAdaptation({ implemented: false, child_feedback_positive: true }), // not counted (not implemented)
      ],
      sensory_intervention_records: [
        makeIntervention({ child_reported_improvement: true, current_score: 5, baseline_score: 3, sessions_planned: 10, sessions_completed: 5, staff_reported_improvement: false, professional_involved: false }),
        makeIntervention({ child_reported_improvement: false, current_score: 2, baseline_score: 3, sessions_planned: 10, sessions_completed: 5, staff_reported_improvement: false, professional_involved: false }),
      ],
    });
    // positive = 1 (adaptation) + 1 (intervention) = 2
    // opportunities = 2 (implemented) + 2 (interventions) = 4
    // 2/4 = 50%
    expect(r.child_feedback_rate).toBe(50);
  });

  it("adaptation_effectiveness_avg computed from implemented only", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      accessibility_adaptation_records: [
        makeAdaptation({ implemented: true, effectiveness_rating: 5, child_feedback_positive: false }),
        makeAdaptation({ implemented: true, effectiveness_rating: 3, child_feedback_positive: false }),
        makeAdaptation({ implemented: false, effectiveness_rating: 1, child_feedback_positive: false }),
      ],
    });
    // implemented: 5+3=8, count=2 → 4.0
    expect(r.adaptation_effectiveness_avg).toBe(4);
  });

  it("intervention_progress_avg clamped 0-100 per intervention", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      sensory_intervention_records: [
        makeIntervention({
          baseline_score: 3, current_score: 9, target_score: 8,
          sessions_planned: 10, sessions_completed: 9,
          child_reported_improvement: false, staff_reported_improvement: false, professional_involved: false,
        }),
        makeIntervention({
          baseline_score: 5, current_score: 2, target_score: 8,
          sessions_planned: 10, sessions_completed: 9,
          child_reported_improvement: false, staff_reported_improvement: false, professional_involved: false,
        }),
      ],
    });
    // First: range=5, progress=6 → 120% → clamped to 100
    // Second: range=3, progress=-3 → -100% → clamped to 0
    // avg = (100 + 0) / 2 = 50
    expect(r.intervention_progress_avg).toBe(50);
  });

  it("intervention_progress_avg skips when target == baseline", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      sensory_intervention_records: [
        makeIntervention({
          baseline_score: 5, current_score: 7, target_score: 5,
          sessions_planned: 10, sessions_completed: 9,
          child_reported_improvement: false, staff_reported_improvement: false, professional_involved: false,
        }),
      ],
    });
    // target == baseline → filtered out → avg = 0
    expect(r.intervention_progress_avg).toBe(0);
  });

  it("pct(0,0) returns 0", () => {
    // When no children, no records, metrics should be 0
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
    });
    // No adaptations → adaptationRate = pct(0,0) = 0
    expect(r.accessibility_adaptation_rate).toBe(0);
    // No sensory room → utilisationRate = pct(0, total_children) but total_children>0 so pct(0,1)=0
    expect(r.sensory_room_utilisation_rate).toBe(0);
    // No equipment → maintenanceRate = 0 (activeEquipment=0 guard)
    expect(r.equipment_maintenance_rate).toBe(0);
    // No interventions → effectivenessRate = pct(0,0) = 0
    expect(r.intervention_effectiveness_rate).toBe(0);
    // childFeedback = pct(0, 0) = 0
    expect(r.child_feedback_rate).toBe(0);
    // adaptationEffAvg = 0 (no implemented)
    expect(r.adaptation_effectiveness_avg).toBe(0);
    // interventionProgressAvg = 0 (no interventions)
    expect(r.intervention_progress_avg).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 9. STRENGTHS
// ═══════════════════════════════════════════════════════════════════════════

describe("strengths", () => {
  it("sensory profile coverage 100% strength", () => {
    const r = run({
      total_children: 2,
      sensory_profile_records: [
        makeProfile({ child_id: "c1" }),
        makeProfile({ child_id: "c2" }),
      ],
    });
    expect(r.strengths).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Every child has a sensory profile assessment"),
      ]),
    );
  });

  it("sensory profile coverage 80-99% strength", () => {
    const r = run({
      total_children: 5,
      sensory_profile_records: [
        makeProfile({ child_id: "c1" }),
        makeProfile({ child_id: "c2" }),
        makeProfile({ child_id: "c3" }),
        makeProfile({ child_id: "c4" }),
      ],
    });
    expect(r.strengths).toEqual(
      expect.arrayContaining([
        expect.stringContaining("80% of children have sensory profiles"),
      ]),
    );
  });

  it("adaptation rate 100% strength", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      accessibility_adaptation_records: [
        makeAdaptation({ implemented: true, effectiveness_rating: 2, child_feedback_positive: false }),
      ],
    });
    expect(r.strengths).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Every requested accessibility adaptation has been implemented"),
      ]),
    );
  });

  it("adaptation rate 80-99% strength", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      accessibility_adaptation_records: [
        makeAdaptation({ implemented: true, effectiveness_rating: 2, child_feedback_positive: false }),
        makeAdaptation({ implemented: true, effectiveness_rating: 2, child_feedback_positive: false }),
        makeAdaptation({ implemented: true, effectiveness_rating: 2, child_feedback_positive: false }),
        makeAdaptation({ implemented: true, effectiveness_rating: 2, child_feedback_positive: false }),
        makeAdaptation({ implemented: false }),
      ],
    });
    expect(r.strengths).toEqual(
      expect.arrayContaining([
        expect.stringContaining("80% of accessibility adaptations implemented"),
      ]),
    );
  });

  it("sensory room utilisation 80%+ strength", () => {
    const r = run({
      total_children: 5,
      sensory_profile_records: [
        makeProfile({ child_id: "c1" }),
        makeProfile({ child_id: "c2" }),
        makeProfile({ child_id: "c3" }),
        makeProfile({ child_id: "c4" }),
        makeProfile({ child_id: "c5" }),
      ],
      sensory_room_records: [
        makeSensoryRoom({ child_id: "c1" }),
        makeSensoryRoom({ child_id: "c2" }),
        makeSensoryRoom({ child_id: "c3" }),
        makeSensoryRoom({ child_id: "c4" }),
      ],
    });
    expect(r.strengths).toEqual(
      expect.arrayContaining([
        expect.stringContaining("80% of children are using the sensory room"),
      ]),
    );
  });

  it("sensory room utilisation 60-79% strength", () => {
    const r = run({
      total_children: 5,
      sensory_profile_records: [
        makeProfile({ child_id: "c1" }),
        makeProfile({ child_id: "c2" }),
        makeProfile({ child_id: "c3" }),
        makeProfile({ child_id: "c4" }),
        makeProfile({ child_id: "c5" }),
      ],
      sensory_room_records: [
        makeSensoryRoom({ child_id: "c1" }),
        makeSensoryRoom({ child_id: "c2" }),
        makeSensoryRoom({ child_id: "c3" }),
      ],
    });
    expect(r.strengths).toEqual(
      expect.arrayContaining([
        expect.stringContaining("60% sensory room utilisation"),
      ]),
    );
  });

  it("equipment maintenance 100% strength", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      sensory_equipment_records: [
        makeEquipment({ in_use: true, maintenance_overdue: false }),
      ],
    });
    expect(r.strengths).toEqual(
      expect.arrayContaining([
        expect.stringContaining("All active sensory equipment is maintained"),
      ]),
    );
  });

  it("equipment maintenance 80-99% strength", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      sensory_equipment_records: [
        makeEquipment({ in_use: true, maintenance_overdue: false }),
        makeEquipment({ in_use: true, maintenance_overdue: false }),
        makeEquipment({ in_use: true, maintenance_overdue: false }),
        makeEquipment({ in_use: true, maintenance_overdue: false }),
        makeEquipment({ in_use: true, maintenance_overdue: true }),
      ],
    });
    expect(r.strengths).toEqual(
      expect.arrayContaining([
        expect.stringContaining("80% equipment maintenance compliance"),
      ]),
    );
  });

  it("intervention effectiveness 90%+ strength", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      sensory_intervention_records: [
        makeIntervention({ current_score: 5, baseline_score: 3, child_reported_improvement: false, staff_reported_improvement: false, professional_involved: false, sessions_planned: 10, sessions_completed: 5 }),
      ],
    });
    expect(r.strengths).toEqual(
      expect.arrayContaining([
        expect.stringContaining("100% of sensory interventions showing improvement"),
      ]),
    );
  });

  it("intervention effectiveness 70-89% strength", () => {
    const interventions = [];
    for (let i = 0; i < 7; i++) {
      interventions.push(makeIntervention({
        current_score: 5, baseline_score: 3, child_reported_improvement: false, staff_reported_improvement: false, professional_involved: false, sessions_planned: 10, sessions_completed: 5,
      }));
    }
    for (let i = 0; i < 3; i++) {
      interventions.push(makeIntervention({
        current_score: 2, baseline_score: 3, child_reported_improvement: false, staff_reported_improvement: false, professional_involved: false, sessions_planned: 10, sessions_completed: 5,
      }));
    }
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      sensory_intervention_records: interventions,
    });
    expect(r.strengths).toEqual(
      expect.arrayContaining([
        expect.stringContaining("70% of interventions showing improvement"),
      ]),
    );
  });

  it("child feedback 90%+ strength", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      accessibility_adaptation_records: [
        makeAdaptation({ implemented: true, effectiveness_rating: 3, child_feedback_positive: true }),
      ],
      sensory_intervention_records: [
        makeIntervention({
          child_reported_improvement: true, current_score: 5, baseline_score: 3,
          sessions_planned: 10, sessions_completed: 9, staff_reported_improvement: false, professional_involved: false,
        }),
      ],
    });
    // feedback = 2/2 = 100%
    expect(r.strengths).toEqual(
      expect.arrayContaining([
        expect.stringContaining("100% positive child feedback on sensory support"),
      ]),
    );
  });

  it("child feedback 70-89% strength", () => {
    const adaptations = [];
    for (let i = 0; i < 7; i++) {
      adaptations.push(makeAdaptation({ implemented: true, effectiveness_rating: 3, child_feedback_positive: true }));
    }
    for (let i = 0; i < 3; i++) {
      adaptations.push(makeAdaptation({ implemented: true, effectiveness_rating: 3, child_feedback_positive: false }));
    }
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      accessibility_adaptation_records: adaptations,
    });
    // feedback = 7/10 = 70%
    expect(r.strengths).toEqual(
      expect.arrayContaining([
        expect.stringContaining("70% positive child feedback"),
      ]),
    );
  });

  it("adaptation effectiveness avg >= 4.0 strength", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      accessibility_adaptation_records: [
        makeAdaptation({ implemented: true, effectiveness_rating: 5, child_feedback_positive: false }),
        makeAdaptation({ implemented: true, effectiveness_rating: 4, child_feedback_positive: false }),
      ],
    });
    expect(r.strengths).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Adaptation effectiveness averages 4.5/5"),
      ]),
    );
  });

  it("adaptation effectiveness avg >= 3.0 strength", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      accessibility_adaptation_records: [
        makeAdaptation({ implemented: true, effectiveness_rating: 3, child_feedback_positive: false }),
        makeAdaptation({ implemented: true, effectiveness_rating: 3, child_feedback_positive: false }),
      ],
    });
    expect(r.strengths).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Adaptation effectiveness averages 3/5"),
      ]),
    );
  });

  it("child involvement 90%+ strength", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [
        makeProfile({ child_id: "c1", child_involved_in_assessment: true }),
      ],
    });
    expect(r.strengths).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Children are involved in the vast majority"),
      ]),
    );
  });

  it("child involvement 70-89% strength", () => {
    const profiles = [];
    for (let i = 0; i < 7; i++) {
      profiles.push(makeProfile({ child_id: "c1", child_involved_in_assessment: true }));
    }
    for (let i = 0; i < 3; i++) {
      profiles.push(makeProfile({ child_id: "c1", child_involved_in_assessment: false }));
    }
    const r = run({
      total_children: 1,
      sensory_profile_records: profiles,
    });
    expect(r.strengths).toEqual(
      expect.arrayContaining([
        expect.stringContaining("70% child involvement in sensory assessments"),
      ]),
    );
  });

  it("profile review compliance 100% strength", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [
        makeProfile({ child_id: "c1", review_overdue: false }),
      ],
    });
    expect(r.strengths).toEqual(
      expect.arrayContaining([
        expect.stringContaining("All sensory profile reviews are up to date"),
      ]),
    );
  });

  it("profile review compliance 80-99% strength", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [
        makeProfile({ child_id: "c1", review_overdue: false }),
        makeProfile({ child_id: "c1", review_overdue: false }),
        makeProfile({ child_id: "c1", review_overdue: false }),
        makeProfile({ child_id: "c1", review_overdue: false }),
        makeProfile({ child_id: "c1", review_overdue: true }),
      ],
    });
    expect(r.strengths).toEqual(
      expect.arrayContaining([
        expect.stringContaining("80% of sensory profile reviews on schedule"),
      ]),
    );
  });

  it("session completion 90%+ strength", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      sensory_intervention_records: [
        makeIntervention({
          sessions_planned: 10, sessions_completed: 9,
          current_score: 5, baseline_score: 3,
          child_reported_improvement: false, staff_reported_improvement: false, professional_involved: false,
        }),
      ],
    });
    expect(r.strengths).toEqual(
      expect.arrayContaining([
        expect.stringContaining("90% of planned intervention sessions completed"),
      ]),
    );
  });

  it("session completion 70-89% strength", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      sensory_intervention_records: [
        makeIntervention({
          sessions_planned: 10, sessions_completed: 7,
          current_score: 5, baseline_score: 3,
          child_reported_improvement: false, staff_reported_improvement: false, professional_involved: false,
        }),
      ],
    });
    expect(r.strengths).toEqual(
      expect.arrayContaining([
        expect.stringContaining("70% intervention session completion"),
      ]),
    );
  });

  it("safety check 100% strength", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      sensory_equipment_records: [
        makeEquipment({ in_use: true, safety_checked: true }),
      ],
    });
    expect(r.strengths).toEqual(
      expect.arrayContaining([
        expect.stringContaining("All active sensory equipment has been safety-checked"),
      ]),
    );
  });

  it("professional involvement 80%+ strength", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      sensory_intervention_records: [
        makeIntervention({ professional_involved: true, current_score: 5, baseline_score: 3, sessions_planned: 10, sessions_completed: 5, child_reported_improvement: false, staff_reported_improvement: false }),
      ],
    });
    expect(r.strengths).toEqual(
      expect.arrayContaining([
        expect.stringContaining("100% of interventions involve professional input"),
      ]),
    );
  });

  it("child initiated 50%+ strength", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      sensory_room_records: [
        makeSensoryRoom({ child_id: "c1", child_requested: true }),
        makeSensoryRoom({ child_id: "c1", child_requested: false }),
      ],
    });
    expect(r.strengths).toEqual(
      expect.arrayContaining([
        expect.stringContaining("50% of sensory room sessions are child-initiated"),
      ]),
    );
  });

  it("session documentation 90%+ strength", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      sensory_room_records: [
        makeSensoryRoom({ child_id: "c1", notes_recorded: true }),
      ],
    });
    expect(r.strengths).toEqual(
      expect.arrayContaining([
        expect.stringContaining("100% of sensory room sessions have documented notes"),
      ]),
    );
  });

  it("goals met 80%+ strength", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      sensory_room_records: [
        makeSensoryRoom({ child_id: "c1", goals_met: true }),
      ],
    });
    expect(r.strengths).toEqual(
      expect.arrayContaining([
        expect.stringContaining("100% of sensory room sessions meet their goals"),
      ]),
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 10. CONCERNS
// ═══════════════════════════════════════════════════════════════════════════

describe("concerns", () => {
  it("coverage < 50% concern", () => {
    const r = run({
      total_children: 5,
      sensory_profile_records: [
        makeProfile({ child_id: "c1" }),
        makeProfile({ child_id: "c2" }),
      ],
    });
    expect(r.concerns).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Only 40% of children have sensory profiles"),
      ]),
    );
  });

  it("coverage 50-79% concern", () => {
    const r = run({
      total_children: 5,
      sensory_profile_records: [
        makeProfile({ child_id: "c1" }),
        makeProfile({ child_id: "c2" }),
        makeProfile({ child_id: "c3" }),
      ],
    });
    expect(r.concerns).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Sensory profile coverage at 60%"),
      ]),
    );
  });

  it("no coverage concern when coverage >= 80%", () => {
    const r = run({
      total_children: 5,
      sensory_profile_records: [
        makeProfile({ child_id: "c1" }),
        makeProfile({ child_id: "c2" }),
        makeProfile({ child_id: "c3" }),
        makeProfile({ child_id: "c4" }),
      ],
    });
    const coverageConcern = r.concerns.find((c) =>
      c.includes("sensory profiles") && (c.includes("Only") || c.includes("coverage at")),
    );
    expect(coverageConcern).toBeUndefined();
  });

  it("adaptation rate < 50% concern", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      accessibility_adaptation_records: [
        makeAdaptation({ implemented: false }),
        makeAdaptation({ implemented: false }),
        makeAdaptation({ implemented: true, effectiveness_rating: 2, child_feedback_positive: false }),
      ],
    });
    expect(r.concerns).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Only 33% of requested accessibility adaptations"),
      ]),
    );
  });

  it("adaptation rate 50-79% concern", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      accessibility_adaptation_records: [
        makeAdaptation({ implemented: true, effectiveness_rating: 2, child_feedback_positive: false }),
        makeAdaptation({ implemented: true, effectiveness_rating: 2, child_feedback_positive: false }),
        makeAdaptation({ implemented: true, effectiveness_rating: 2, child_feedback_positive: false }),
        makeAdaptation({ implemented: false }),
      ],
    });
    expect(r.concerns).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Accessibility adaptation rate at 75%"),
      ]),
    );
  });

  it("sensory room utilisation < 40% concern", () => {
    const r = run({
      total_children: 5,
      sensory_profile_records: [
        makeProfile({ child_id: "c1" }),
        makeProfile({ child_id: "c2" }),
        makeProfile({ child_id: "c3" }),
        makeProfile({ child_id: "c4" }),
        makeProfile({ child_id: "c5" }),
      ],
      sensory_room_records: [
        makeSensoryRoom({ child_id: "c1", child_requested: false, goals_met: false, notes_recorded: false }),
      ],
    });
    // utilisation = 1/5 = 20%
    expect(r.concerns).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Sensory room utilisation at only 20%"),
      ]),
    );
  });

  it("no sensory room concern when 0 sessions", () => {
    const r = run({
      total_children: 5,
      sensory_profile_records: [
        makeProfile({ child_id: "c1" }),
        makeProfile({ child_id: "c2" }),
        makeProfile({ child_id: "c3" }),
        makeProfile({ child_id: "c4" }),
        makeProfile({ child_id: "c5" }),
      ],
    });
    const roomConcern = r.concerns.find((c) => c.includes("Sensory room utilisation"));
    expect(roomConcern).toBeUndefined();
  });

  it("equipment maintenance < 50% concern", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      sensory_equipment_records: [
        makeEquipment({ in_use: true, maintenance_overdue: true }),
        makeEquipment({ in_use: true, maintenance_overdue: true }),
      ],
    });
    expect(r.concerns).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Only 0% of active sensory equipment has current maintenance"),
      ]),
    );
  });

  it("equipment maintenance 50-79% concern", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      sensory_equipment_records: [
        makeEquipment({ in_use: true, maintenance_overdue: false }),
        makeEquipment({ in_use: true, maintenance_overdue: false }),
        makeEquipment({ in_use: true, maintenance_overdue: true }),
      ],
    });
    expect(r.concerns).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Equipment maintenance rate at 67%"),
      ]),
    );
  });

  it("intervention effectiveness < 40% concern", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      sensory_intervention_records: [
        makeIntervention({ current_score: 2, baseline_score: 3, sessions_planned: 10, sessions_completed: 5, child_reported_improvement: false, staff_reported_improvement: false, professional_involved: false }),
        makeIntervention({ current_score: 1, baseline_score: 3, sessions_planned: 10, sessions_completed: 5, child_reported_improvement: false, staff_reported_improvement: false, professional_involved: false }),
        makeIntervention({ current_score: 4, baseline_score: 3, sessions_planned: 10, sessions_completed: 5, child_reported_improvement: false, staff_reported_improvement: false, professional_involved: false }),
      ],
    });
    expect(r.concerns).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Only 33% of sensory interventions showing improvement"),
      ]),
    );
  });

  it("intervention effectiveness 40-69% concern", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      sensory_intervention_records: [
        makeIntervention({ current_score: 5, baseline_score: 3, sessions_planned: 10, sessions_completed: 5, child_reported_improvement: false, staff_reported_improvement: false, professional_involved: false }),
        makeIntervention({ current_score: 2, baseline_score: 3, sessions_planned: 10, sessions_completed: 5, child_reported_improvement: false, staff_reported_improvement: false, professional_involved: false }),
      ],
    });
    expect(r.concerns).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Intervention effectiveness at 50%"),
      ]),
    );
  });

  it("child feedback < 50% concern", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      accessibility_adaptation_records: [
        makeAdaptation({ implemented: true, effectiveness_rating: 2, child_feedback_positive: false }),
        makeAdaptation({ implemented: true, effectiveness_rating: 2, child_feedback_positive: false }),
      ],
      sensory_intervention_records: [
        makeIntervention({ child_reported_improvement: false, current_score: 5, baseline_score: 3, sessions_planned: 10, sessions_completed: 5, staff_reported_improvement: false, professional_involved: false }),
      ],
    });
    // feedback = 0/(2+1) = 0%
    expect(r.concerns).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Only 0% positive child feedback"),
      ]),
    );
  });

  it("child feedback 50-69% concern", () => {
    const adaptations = [];
    for (let i = 0; i < 5; i++) {
      adaptations.push(makeAdaptation({ implemented: true, effectiveness_rating: 2, child_feedback_positive: true }));
    }
    for (let i = 0; i < 5; i++) {
      adaptations.push(makeAdaptation({ implemented: true, effectiveness_rating: 2, child_feedback_positive: false }));
    }
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      accessibility_adaptation_records: adaptations,
    });
    // feedback = 5/10 = 50%
    expect(r.concerns).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Child feedback rate at 50%"),
      ]),
    );
  });

  it("overdue profile reviews concern (singular)", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [
        makeProfile({ child_id: "c1", review_overdue: true }),
      ],
    });
    expect(r.concerns).toEqual(
      expect.arrayContaining([
        expect.stringContaining("1 sensory profile review is overdue"),
      ]),
    );
  });

  it("overdue profile reviews concern (plural)", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [
        makeProfile({ child_id: "c1", review_overdue: true }),
        makeProfile({ child_id: "c1", review_overdue: true }),
      ],
    });
    expect(r.concerns).toEqual(
      expect.arrayContaining([
        expect.stringContaining("2 sensory profile reviews are overdue"),
      ]),
    );
  });

  it("overdue adaptation reviews concern", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      accessibility_adaptation_records: [
        makeAdaptation({ implemented: true, effectiveness_rating: 3, child_feedback_positive: false, review_overdue: true }),
      ],
    });
    expect(r.concerns).toEqual(
      expect.arrayContaining([
        expect.stringContaining("1 adaptation review is overdue"),
      ]),
    );
  });

  it("overdue intervention reviews concern", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      sensory_intervention_records: [
        makeIntervention({
          active: true, review_overdue: true,
          current_score: 5, baseline_score: 3, sessions_planned: 10, sessions_completed: 5,
          child_reported_improvement: false, staff_reported_improvement: false, professional_involved: false,
        }),
      ],
    });
    expect(r.concerns).toEqual(
      expect.arrayContaining([
        expect.stringContaining("1 active intervention review is overdue"),
      ]),
    );
  });

  it("poor condition equipment concern (singular)", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      sensory_equipment_records: [
        makeEquipment({ in_use: true, condition: "poor" }),
      ],
    });
    expect(r.concerns).toEqual(
      expect.arrayContaining([
        expect.stringContaining("1 piece of sensory equipment in poor condition"),
      ]),
    );
  });

  it("poor condition equipment concern (plural)", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      sensory_equipment_records: [
        makeEquipment({ in_use: true, condition: "poor" }),
        makeEquipment({ in_use: true, condition: "poor" }),
      ],
    });
    expect(r.concerns).toEqual(
      expect.arrayContaining([
        expect.stringContaining("2 pieces of sensory equipment in poor condition"),
      ]),
    );
  });

  it("safety check < 80% concern", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      sensory_equipment_records: [
        makeEquipment({ in_use: true, safety_checked: false }),
        makeEquipment({ in_use: true, safety_checked: true }),
      ],
    });
    expect(r.concerns).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Only 50% of active sensory equipment has been safety-checked"),
      ]),
    );
  });

  it("child involvement < 50% concern", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [
        makeProfile({ child_id: "c1", child_involved_in_assessment: false }),
        makeProfile({ child_id: "c1", child_involved_in_assessment: false }),
        makeProfile({ child_id: "c1", child_involved_in_assessment: true }),
      ],
    });
    expect(r.concerns).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Children involved in only 33% of sensory assessments"),
      ]),
    );
  });

  it("session completion < 50% concern", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      sensory_intervention_records: [
        makeIntervention({
          sessions_planned: 10, sessions_completed: 3,
          current_score: 5, baseline_score: 3,
          child_reported_improvement: false, staff_reported_improvement: false, professional_involved: false,
        }),
      ],
    });
    expect(r.concerns).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Only 30% of planned intervention sessions completed"),
      ]),
    );
  });

  it("session documentation < 70% concern", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      sensory_room_records: [
        makeSensoryRoom({ child_id: "c1", notes_recorded: true }),
        makeSensoryRoom({ child_id: "c1", notes_recorded: false }),
        makeSensoryRoom({ child_id: "c1", notes_recorded: false }),
      ],
    });
    expect(r.concerns).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Sensory room session documentation at only 33%"),
      ]),
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 11. RECOMMENDATIONS
// ═══════════════════════════════════════════════════════════════════════════

describe("recommendations", () => {
  it("coverage < 50% → immediate recommendation", () => {
    const r = run({
      total_children: 5,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
    });
    expect(r.recommendations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          urgency: "immediate",
          recommendation: expect.stringContaining("Urgently complete sensory profile assessments"),
        }),
      ]),
    );
  });

  it("adaptation < 50% → immediate recommendation", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      accessibility_adaptation_records: [
        makeAdaptation({ implemented: false }),
        makeAdaptation({ implemented: false }),
        makeAdaptation({ implemented: true, effectiveness_rating: 2, child_feedback_positive: false }),
      ],
    });
    expect(r.recommendations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          urgency: "immediate",
          recommendation: expect.stringContaining("Urgently implement all outstanding accessibility adaptations"),
        }),
      ]),
    );
  });

  it("equipment maintenance < 50% → immediate recommendation", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      sensory_equipment_records: [
        makeEquipment({ in_use: true, maintenance_overdue: true }),
        makeEquipment({ in_use: true, maintenance_overdue: true }),
      ],
    });
    expect(r.recommendations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          urgency: "immediate",
          recommendation: expect.stringContaining("Immediately address overdue maintenance"),
        }),
      ]),
    );
  });

  it("intervention effectiveness < 40% → immediate recommendation", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      sensory_intervention_records: [
        makeIntervention({ current_score: 2, baseline_score: 3, sessions_planned: 10, sessions_completed: 5, child_reported_improvement: false, staff_reported_improvement: false, professional_involved: false }),
      ],
    });
    expect(r.recommendations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          urgency: "immediate",
          recommendation: expect.stringContaining("Review and redesign ineffective sensory interventions"),
        }),
      ]),
    );
  });

  it("safety check < 80% → immediate recommendation", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      sensory_equipment_records: [
        makeEquipment({ in_use: true, safety_checked: false }),
        makeEquipment({ in_use: true, safety_checked: true }),
      ],
    });
    expect(r.recommendations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          urgency: "immediate",
          recommendation: expect.stringContaining("Complete safety checks on all active sensory equipment"),
        }),
      ]),
    );
  });

  it("poor condition equipment → immediate recommendation", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      sensory_equipment_records: [
        makeEquipment({ in_use: true, condition: "poor" }),
      ],
    });
    expect(r.recommendations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          urgency: "immediate",
          recommendation: expect.stringContaining("Replace or repair sensory equipment in poor condition"),
        }),
      ]),
    );
  });

  it("child feedback < 50% → immediate recommendation", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      accessibility_adaptation_records: [
        makeAdaptation({ implemented: true, effectiveness_rating: 2, child_feedback_positive: false }),
      ],
    });
    expect(r.recommendations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          urgency: "immediate",
          recommendation: expect.stringContaining("Review sensory support with children"),
        }),
      ]),
    );
  });

  it("overdue profile reviews → soon recommendation", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1", review_overdue: true })],
    });
    expect(r.recommendations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          urgency: "soon",
          recommendation: expect.stringContaining("Complete all overdue sensory profile reviews"),
        }),
      ]),
    );
  });

  it("overdue intervention reviews → soon recommendation", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      sensory_intervention_records: [
        makeIntervention({
          active: true, review_overdue: true,
          current_score: 5, baseline_score: 3, sessions_planned: 10, sessions_completed: 5,
          child_reported_improvement: false, staff_reported_improvement: false, professional_involved: false,
        }),
      ],
    });
    expect(r.recommendations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          urgency: "soon",
          recommendation: expect.stringContaining("Complete all overdue intervention reviews"),
        }),
      ]),
    );
  });

  it("coverage 50-79% → soon recommendation", () => {
    const r = run({
      total_children: 5,
      sensory_profile_records: [
        makeProfile({ child_id: "c1" }),
        makeProfile({ child_id: "c2" }),
        makeProfile({ child_id: "c3" }),
      ],
    });
    expect(r.recommendations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          urgency: "soon",
          recommendation: expect.stringContaining("Extend sensory profile coverage"),
        }),
      ]),
    );
  });

  it("adaptation 50-79% → soon recommendation", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      accessibility_adaptation_records: [
        makeAdaptation({ implemented: true, effectiveness_rating: 2, child_feedback_positive: false }),
        makeAdaptation({ implemented: true, effectiveness_rating: 2, child_feedback_positive: false }),
        makeAdaptation({ implemented: true, effectiveness_rating: 2, child_feedback_positive: false }),
        makeAdaptation({ implemented: false }),
      ],
    });
    expect(r.recommendations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          urgency: "soon",
          recommendation: expect.stringContaining("Increase accessibility adaptation implementation rate"),
        }),
      ]),
    );
  });

  it("intervention 40-69% → soon recommendation", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      sensory_intervention_records: [
        makeIntervention({ current_score: 5, baseline_score: 3, sessions_planned: 10, sessions_completed: 5, child_reported_improvement: false, staff_reported_improvement: false, professional_involved: false }),
        makeIntervention({ current_score: 2, baseline_score: 3, sessions_planned: 10, sessions_completed: 5, child_reported_improvement: false, staff_reported_improvement: false, professional_involved: false }),
      ],
    });
    expect(r.recommendations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          urgency: "soon",
          recommendation: expect.stringContaining("Review sensory interventions that are not showing improvement"),
        }),
      ]),
    );
  });

  it("session completion < 70% → soon recommendation", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      sensory_intervention_records: [
        makeIntervention({
          sessions_planned: 10, sessions_completed: 5,
          current_score: 5, baseline_score: 3,
          child_reported_improvement: false, staff_reported_improvement: false, professional_involved: false,
        }),
      ],
    });
    expect(r.recommendations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          urgency: "soon",
          recommendation: expect.stringContaining("Improve intervention session completion rate"),
        }),
      ]),
    );
  });

  it("child involvement < 70% → planned recommendation", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [
        makeProfile({ child_id: "c1", child_involved_in_assessment: false }),
        makeProfile({ child_id: "c1", child_involved_in_assessment: false }),
        makeProfile({ child_id: "c1", child_involved_in_assessment: true }),
      ],
    });
    expect(r.recommendations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          urgency: "planned",
          recommendation: expect.stringContaining("Increase child involvement in sensory assessments"),
        }),
      ]),
    );
  });

  it("session documentation < 70% → planned recommendation", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      sensory_room_records: [
        makeSensoryRoom({ child_id: "c1", notes_recorded: false }),
        makeSensoryRoom({ child_id: "c1", notes_recorded: false }),
        makeSensoryRoom({ child_id: "c1", notes_recorded: true }),
      ],
    });
    expect(r.recommendations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          urgency: "planned",
          recommendation: expect.stringContaining("Improve sensory room session documentation"),
        }),
      ]),
    );
  });

  it("equipment maintenance 50-79% → planned recommendation", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      sensory_equipment_records: [
        makeEquipment({ in_use: true, maintenance_overdue: false }),
        makeEquipment({ in_use: true, maintenance_overdue: false }),
        makeEquipment({ in_use: true, maintenance_overdue: true }),
      ],
    });
    expect(r.recommendations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          urgency: "planned",
          recommendation: expect.stringContaining("Improve equipment maintenance compliance"),
        }),
      ]),
    );
  });

  it("child feedback 50-69% → planned recommendation", () => {
    const adaptations = [];
    for (let i = 0; i < 5; i++) {
      adaptations.push(makeAdaptation({ implemented: true, effectiveness_rating: 2, child_feedback_positive: true }));
    }
    for (let i = 0; i < 5; i++) {
      adaptations.push(makeAdaptation({ implemented: true, effectiveness_rating: 2, child_feedback_positive: false }));
    }
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      accessibility_adaptation_records: adaptations,
    });
    expect(r.recommendations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          urgency: "planned",
          recommendation: expect.stringContaining("Explore ways to improve the positive impact"),
        }),
      ]),
    );
  });

  it("professional involvement < 50% → planned recommendation", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      sensory_intervention_records: [
        makeIntervention({
          professional_involved: false,
          current_score: 5, baseline_score: 3, sessions_planned: 10, sessions_completed: 5,
          child_reported_improvement: false, staff_reported_improvement: false,
        }),
        makeIntervention({
          professional_involved: false,
          current_score: 5, baseline_score: 3, sessions_planned: 10, sessions_completed: 5,
          child_reported_improvement: false, staff_reported_improvement: false,
        }),
      ],
    });
    expect(r.recommendations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          urgency: "planned",
          recommendation: expect.stringContaining("Increase professional involvement in sensory interventions"),
        }),
      ]),
    );
  });

  it("recommendations have sequential rank values", () => {
    const r = run({
      total_children: 10,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      accessibility_adaptation_records: [
        makeAdaptation({ implemented: false }),
        makeAdaptation({ implemented: false }),
      ],
      sensory_equipment_records: [
        makeEquipment({ in_use: true, maintenance_overdue: true, safety_checked: false, condition: "poor" }),
      ],
      sensory_intervention_records: [
        makeIntervention({
          current_score: 1, baseline_score: 3, sessions_planned: 10, sessions_completed: 2,
          child_reported_improvement: false, staff_reported_improvement: false, professional_involved: false,
          active: true, review_overdue: true,
        }),
      ],
    });
    for (let i = 0; i < r.recommendations.length; i++) {
      expect(r.recommendations[i].rank).toBe(i + 1);
    }
  });

  it("recommendations include regulatory_ref", () => {
    const r = run({
      total_children: 5,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
    });
    r.recommendations.forEach((rec) => {
      expect(rec.regulatory_ref).toBeDefined();
      expect(rec.regulatory_ref.length).toBeGreaterThan(0);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 12. INSIGHTS
// ═══════════════════════════════════════════════════════════════════════════

describe("insights — critical", () => {
  it("coverage < 50% → critical insight", () => {
    const r = run({
      total_children: 5,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
    });
    expect(r.insights).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          severity: "critical",
          text: expect.stringContaining("Only 20% of children have sensory profiles"),
        }),
      ]),
    );
  });

  it("adaptation < 50% → critical insight", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      accessibility_adaptation_records: [
        makeAdaptation({ implemented: false }),
        makeAdaptation({ implemented: false }),
        makeAdaptation({ implemented: true, effectiveness_rating: 2, child_feedback_positive: false }),
      ],
    });
    expect(r.insights).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          severity: "critical",
          text: expect.stringContaining("Only 33% of requested adaptations implemented"),
        }),
      ]),
    );
  });

  it("equipment maintenance < 50% → critical insight", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      sensory_equipment_records: [
        makeEquipment({ in_use: true, maintenance_overdue: true }),
        makeEquipment({ in_use: true, maintenance_overdue: true }),
      ],
    });
    expect(r.insights).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          severity: "critical",
          text: expect.stringContaining("Only 0% of active sensory equipment has current maintenance"),
        }),
      ]),
    );
  });

  it("intervention effectiveness < 40% → critical insight", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      sensory_intervention_records: [
        makeIntervention({ current_score: 2, baseline_score: 3, sessions_planned: 10, sessions_completed: 5, child_reported_improvement: false, staff_reported_improvement: false, professional_involved: false }),
      ],
    });
    expect(r.insights).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          severity: "critical",
          text: expect.stringContaining("Only 0% of sensory interventions showing improvement"),
        }),
      ]),
    );
  });

  it("poor condition + safety check < 80% → critical combined insight", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      sensory_equipment_records: [
        makeEquipment({ in_use: true, condition: "poor", safety_checked: false }),
        makeEquipment({ in_use: true, condition: "good", safety_checked: false }),
      ],
    });
    expect(r.insights).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          severity: "critical",
          text: expect.stringContaining("equipment item"),
        }),
      ]),
    );
  });
});

describe("insights — warning", () => {
  it("coverage 50-79% → warning insight", () => {
    const r = run({
      total_children: 5,
      sensory_profile_records: [
        makeProfile({ child_id: "c1" }),
        makeProfile({ child_id: "c2" }),
        makeProfile({ child_id: "c3" }),
      ],
    });
    expect(r.insights).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          severity: "warning",
          text: expect.stringContaining("Sensory profile coverage at 60%"),
        }),
      ]),
    );
  });

  it("adaptation 50-79% → warning insight", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      accessibility_adaptation_records: [
        makeAdaptation({ implemented: true, effectiveness_rating: 2, child_feedback_positive: false }),
        makeAdaptation({ implemented: true, effectiveness_rating: 2, child_feedback_positive: false }),
        makeAdaptation({ implemented: true, effectiveness_rating: 2, child_feedback_positive: false }),
        makeAdaptation({ implemented: false }),
      ],
    });
    expect(r.insights).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          severity: "warning",
          text: expect.stringContaining("Adaptation implementation at 75%"),
        }),
      ]),
    );
  });

  it("intervention 40-69% → warning insight", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      sensory_intervention_records: [
        makeIntervention({ current_score: 5, baseline_score: 3, sessions_planned: 10, sessions_completed: 5, child_reported_improvement: false, staff_reported_improvement: false, professional_involved: false }),
        makeIntervention({ current_score: 2, baseline_score: 3, sessions_planned: 10, sessions_completed: 5, child_reported_improvement: false, staff_reported_improvement: false, professional_involved: false }),
      ],
    });
    expect(r.insights).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          severity: "warning",
          text: expect.stringContaining("Intervention effectiveness at 50%"),
        }),
      ]),
    );
  });

  it("child feedback 50-69% → warning insight", () => {
    const adaptations = [];
    for (let i = 0; i < 5; i++) {
      adaptations.push(makeAdaptation({ implemented: true, effectiveness_rating: 2, child_feedback_positive: true }));
    }
    for (let i = 0; i < 5; i++) {
      adaptations.push(makeAdaptation({ implemented: true, effectiveness_rating: 2, child_feedback_positive: false }));
    }
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      accessibility_adaptation_records: adaptations,
    });
    expect(r.insights).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          severity: "warning",
          text: expect.stringContaining("Child feedback at 50% positive"),
        }),
      ]),
    );
  });

  it("equipment maintenance 50-79% → warning insight", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      sensory_equipment_records: [
        makeEquipment({ in_use: true, maintenance_overdue: false }),
        makeEquipment({ in_use: true, maintenance_overdue: false }),
        makeEquipment({ in_use: true, maintenance_overdue: true }),
      ],
    });
    expect(r.insights).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          severity: "warning",
          text: expect.stringContaining("Equipment maintenance at 67%"),
        }),
      ]),
    );
  });

  it("overdue profile reviews → warning insight", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [
        makeProfile({ child_id: "c1", review_overdue: true }),
      ],
    });
    expect(r.insights).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          severity: "warning",
          text: expect.stringContaining("1 sensory profile review"),
        }),
      ]),
    );
  });

  it("overdue intervention reviews → warning insight", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      sensory_intervention_records: [
        makeIntervention({
          active: true, review_overdue: true,
          current_score: 5, baseline_score: 3, sessions_planned: 10, sessions_completed: 5,
          child_reported_improvement: false, staff_reported_improvement: false, professional_involved: false,
        }),
      ],
    });
    expect(r.insights).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          severity: "warning",
          text: expect.stringContaining("active intervention"),
        }),
      ]),
    );
  });

  it("session completion 50-69% → warning insight", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      sensory_intervention_records: [
        makeIntervention({
          sessions_planned: 10, sessions_completed: 5,
          current_score: 5, baseline_score: 3,
          child_reported_improvement: false, staff_reported_improvement: false, professional_involved: false,
        }),
      ],
    });
    expect(r.insights).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          severity: "warning",
          text: expect.stringContaining("Session completion at 50%"),
        }),
      ]),
    );
  });

  it("child involvement 50-69% → warning insight", () => {
    const profiles = [];
    for (let i = 0; i < 5; i++) {
      profiles.push(makeProfile({ child_id: "c1", child_involved_in_assessment: true }));
    }
    for (let i = 0; i < 5; i++) {
      profiles.push(makeProfile({ child_id: "c1", child_involved_in_assessment: false }));
    }
    const r = run({
      total_children: 1,
      sensory_profile_records: profiles,
    });
    expect(r.insights).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          severity: "warning",
          text: expect.stringContaining("Child involvement in assessments at 50%"),
        }),
      ]),
    );
  });

  it("equipment types insight when >= 3 active", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      sensory_equipment_records: [
        makeEquipment({ in_use: true, equipment_type: "weighted" }),
        makeEquipment({ in_use: true, equipment_type: "fidget" }),
        makeEquipment({ in_use: true, equipment_type: "lighting" }),
      ],
    });
    expect(r.insights).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          severity: "warning",
          text: expect.stringContaining("Active sensory equipment profile:"),
        }),
      ]),
    );
  });

  it("intervention types insight when >= 3 active interventions", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      sensory_intervention_records: [
        makeIntervention({ active: true, intervention_type: "sensory_diet", current_score: 5, baseline_score: 3, sessions_planned: 10, sessions_completed: 9, child_reported_improvement: false, staff_reported_improvement: false, professional_involved: false }),
        makeIntervention({ active: true, intervention_type: "therapeutic", current_score: 6, baseline_score: 4, sessions_planned: 10, sessions_completed: 9, child_reported_improvement: false, staff_reported_improvement: false, professional_involved: false }),
        makeIntervention({ active: true, intervention_type: "environmental_modification", current_score: 7, baseline_score: 5, sessions_planned: 10, sessions_completed: 9, child_reported_improvement: false, staff_reported_improvement: false, professional_involved: false }),
      ],
    });
    expect(r.insights).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          severity: "warning",
          text: expect.stringContaining("Active intervention types:"),
        }),
      ]),
    );
  });
});

describe("insights — positive", () => {
  it("outstanding rating → positive insight", () => {
    const r = run({
      total_children: 3,
      sensory_profile_records: [
        makeProfile({ child_id: "c1" }),
        makeProfile({ child_id: "c2" }),
        makeProfile({ child_id: "c3" }),
      ],
      accessibility_adaptation_records: [
        makeAdaptation({ implemented: true, effectiveness_rating: 5, child_feedback_positive: true }),
        makeAdaptation({ implemented: true, effectiveness_rating: 4, child_feedback_positive: true }),
        makeAdaptation({ implemented: true, effectiveness_rating: 4, child_feedback_positive: true }),
      ],
      sensory_room_records: [
        makeSensoryRoom({ child_id: "c1" }),
        makeSensoryRoom({ child_id: "c2" }),
        makeSensoryRoom({ child_id: "c3" }),
      ],
      sensory_equipment_records: [
        makeEquipment({ in_use: true, maintenance_overdue: false, safety_checked: true }),
        makeEquipment({ in_use: true, maintenance_overdue: false, safety_checked: true }),
      ],
      sensory_intervention_records: [
        makeIntervention({
          current_score: 7, baseline_score: 3, target_score: 8,
          sessions_planned: 10, sessions_completed: 10,
          child_reported_improvement: true, staff_reported_improvement: true, professional_involved: true,
        }),
        makeIntervention({
          current_score: 8, baseline_score: 4, target_score: 9,
          sessions_planned: 10, sessions_completed: 9,
          child_reported_improvement: true, staff_reported_improvement: true, professional_involved: true,
        }),
      ],
    });
    expect(r.sensory_rating).toBe("outstanding");
    expect(r.insights).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          severity: "positive",
          text: expect.stringContaining("outstanding sensory and accessibility support"),
        }),
      ]),
    );
  });

  it("100% coverage + 90%+ child involvement → positive insight", () => {
    const r = run({
      total_children: 2,
      sensory_profile_records: [
        makeProfile({ child_id: "c1", child_involved_in_assessment: true }),
        makeProfile({ child_id: "c2", child_involved_in_assessment: true }),
      ],
    });
    expect(r.insights).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          severity: "positive",
          text: expect.stringContaining("Every child has a sensory profile with high levels of child involvement"),
        }),
      ]),
    );
  });

  it("100% adaptation + effectiveness >= 4.0 → positive insight", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      accessibility_adaptation_records: [
        makeAdaptation({ implemented: true, effectiveness_rating: 5, child_feedback_positive: false }),
        makeAdaptation({ implemented: true, effectiveness_rating: 4, child_feedback_positive: false }),
      ],
    });
    expect(r.insights).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          severity: "positive",
          text: expect.stringContaining("Every requested adaptation implemented with effectiveness averaging"),
        }),
      ]),
    );
  });

  it("90%+ effectiveness + 80%+ child reported → positive insight", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      sensory_intervention_records: [
        makeIntervention({ current_score: 5, baseline_score: 3, child_reported_improvement: true, sessions_planned: 10, sessions_completed: 9, staff_reported_improvement: false, professional_involved: false }),
      ],
    });
    expect(r.insights).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          severity: "positive",
          text: expect.stringContaining("100% of interventions showing improvement with 100% of children reporting benefit"),
        }),
      ]),
    );
  });

  it("100% maintenance + 100% safety → positive insight", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      sensory_equipment_records: [
        makeEquipment({ in_use: true, maintenance_overdue: false, safety_checked: true }),
      ],
    });
    expect(r.insights).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          severity: "positive",
          text: expect.stringContaining("All sensory equipment is maintained and safety-checked"),
        }),
      ]),
    );
  });

  it("80%+ room utilisation + 80%+ goals met → positive insight", () => {
    const r = run({
      total_children: 5,
      sensory_profile_records: [
        makeProfile({ child_id: "c1" }),
        makeProfile({ child_id: "c2" }),
        makeProfile({ child_id: "c3" }),
        makeProfile({ child_id: "c4" }),
        makeProfile({ child_id: "c5" }),
      ],
      sensory_room_records: [
        makeSensoryRoom({ child_id: "c1", goals_met: true }),
        makeSensoryRoom({ child_id: "c2", goals_met: true }),
        makeSensoryRoom({ child_id: "c3", goals_met: true }),
        makeSensoryRoom({ child_id: "c4", goals_met: true }),
      ],
    });
    expect(r.insights).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          severity: "positive",
          text: expect.stringContaining("80% of children accessing the sensory room with 100% of sessions meeting their goals"),
        }),
      ]),
    );
  });

  it("90%+ child feedback → positive insight", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      accessibility_adaptation_records: [
        makeAdaptation({ implemented: true, effectiveness_rating: 3, child_feedback_positive: true }),
      ],
      sensory_intervention_records: [
        makeIntervention({
          child_reported_improvement: true, current_score: 5, baseline_score: 3,
          sessions_planned: 10, sessions_completed: 9, staff_reported_improvement: false, professional_involved: false,
        }),
      ],
    });
    // feedback = 2/2 = 100%
    expect(r.insights).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          severity: "positive",
          text: expect.stringContaining("100% positive child feedback"),
        }),
      ]),
    );
  });

  it("90%+ session completion + 80%+ professional involvement → positive insight", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      sensory_intervention_records: [
        makeIntervention({
          sessions_planned: 10, sessions_completed: 10,
          professional_involved: true,
          current_score: 5, baseline_score: 3,
          child_reported_improvement: false, staff_reported_improvement: false,
        }),
      ],
    });
    expect(r.insights).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          severity: "positive",
          text: expect.stringContaining("100% session completion with 100% professional involvement"),
        }),
      ]),
    );
  });

  it("80%+ staff + 80%+ child reported improvement → positive insight", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      sensory_intervention_records: [
        makeIntervention({
          staff_reported_improvement: true, child_reported_improvement: true,
          current_score: 5, baseline_score: 3, sessions_planned: 10, sessions_completed: 5, professional_involved: false,
        }),
      ],
    });
    expect(r.insights).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          severity: "positive",
          text: expect.stringContaining("Both staff (100%) and children (100%) report improvement"),
        }),
      ]),
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 13. HEADLINES
// ═══════════════════════════════════════════════════════════════════════════

describe("headlines", () => {
  it("outstanding headline", () => {
    const r = run({
      total_children: 3,
      sensory_profile_records: [
        makeProfile({ child_id: "c1" }),
        makeProfile({ child_id: "c2" }),
        makeProfile({ child_id: "c3" }),
      ],
      accessibility_adaptation_records: [
        makeAdaptation({ implemented: true, effectiveness_rating: 5, child_feedback_positive: true }),
        makeAdaptation({ implemented: true, effectiveness_rating: 4, child_feedback_positive: true }),
        makeAdaptation({ implemented: true, effectiveness_rating: 4, child_feedback_positive: true }),
      ],
      sensory_room_records: [
        makeSensoryRoom({ child_id: "c1" }),
        makeSensoryRoom({ child_id: "c2" }),
        makeSensoryRoom({ child_id: "c3" }),
      ],
      sensory_equipment_records: [
        makeEquipment({ in_use: true, maintenance_overdue: false }),
        makeEquipment({ in_use: true, maintenance_overdue: false }),
      ],
      sensory_intervention_records: [
        makeIntervention({
          current_score: 7, baseline_score: 3, target_score: 8,
          sessions_planned: 10, sessions_completed: 10,
          child_reported_improvement: true, staff_reported_improvement: true, professional_involved: true,
        }),
        makeIntervention({
          current_score: 8, baseline_score: 4, target_score: 9,
          sessions_planned: 10, sessions_completed: 9,
          child_reported_improvement: true, staff_reported_improvement: true, professional_involved: true,
        }),
      ],
    });
    expect(r.headline).toContain("Outstanding sensory and accessibility support");
  });

  it("good headline mentions strengths and concerns count", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      accessibility_adaptation_records: [
        makeAdaptation({ implemented: true, effectiveness_rating: 4, child_feedback_positive: false }),
      ],
    });
    expect(r.sensory_rating).toBe("good");
    expect(r.headline).toContain("Good sensory and accessibility support");
    expect(r.headline).toMatch(/\d+ strength/);
  });

  it("adequate headline mentions concerns count", () => {
    const r = run({
      total_children: 5,
      sensory_profile_records: [
        makeProfile({ child_id: "c1" }),
        makeProfile({ child_id: "c2" }),
        makeProfile({ child_id: "c3" }),
      ],
    });
    // score = 52 + 2 (profileReview) = 54 → adequate
    expect(r.sensory_rating).toBe("adequate");
    expect(r.headline).toContain("Adequate sensory and accessibility support");
    expect(r.headline).toMatch(/\d+ concern/);
  });

  it("inadequate headline mentions significant concerns", () => {
    const r = run({
      total_children: 10,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      accessibility_adaptation_records: [
        makeAdaptation({ implemented: false }),
        makeAdaptation({ implemented: false }),
        makeAdaptation({ implemented: false }),
      ],
      sensory_equipment_records: [
        makeEquipment({ in_use: true, maintenance_overdue: true }),
        makeEquipment({ in_use: true, maintenance_overdue: true }),
      ],
      sensory_intervention_records: [
        makeIntervention({
          current_score: 1, baseline_score: 3, sessions_planned: 10, sessions_completed: 2,
          child_reported_improvement: false, staff_reported_improvement: false, professional_involved: false,
        }),
      ],
    });
    // 52 + 2 (profileReview) - 5 (coverage<50) - 5 (adaptation<50) - 4 (equipment<50) - 4 (intervention<40) = 36
    expect(r.sensory_rating).toBe("inadequate");
    expect(r.headline).toContain("Sensory and accessibility support is inadequate");
    expect(r.headline).toMatch(/significant concern/);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 14. EDGE CASES
// ═══════════════════════════════════════════════════════════════════════════

describe("edge cases", () => {
  it("single child with full data", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      accessibility_adaptation_records: [
        makeAdaptation({ implemented: true, effectiveness_rating: 5, child_feedback_positive: true }),
      ],
      sensory_room_records: [
        makeSensoryRoom({ child_id: "c1" }),
      ],
      sensory_equipment_records: [
        makeEquipment({ in_use: true }),
      ],
      sensory_intervention_records: [
        makeIntervention({
          current_score: 7, baseline_score: 3, target_score: 8,
          sessions_planned: 10, sessions_completed: 10,
          child_reported_improvement: true, staff_reported_improvement: true, professional_involved: true,
        }),
      ],
    });
    expect(r.sensory_score).toBeGreaterThanOrEqual(0);
    expect(r.sensory_score).toBeLessThanOrEqual(100);
    expect(r.sensory_rating).toBeDefined();
  });

  it("many children but minimal records", () => {
    const r = run({
      total_children: 20,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
    });
    // coverage = 1/20 = 5% → -5
    // profileReview 100% → +2
    expect(r.sensory_score).toBe(52 + 2 - 5);
    expect(r.sensory_rating).toBe("adequate");
  });

  it("duplicate child_ids in profiles don't inflate coverage", () => {
    const r = run({
      total_children: 3,
      sensory_profile_records: [
        makeProfile({ child_id: "c1" }),
        makeProfile({ child_id: "c1" }),
        makeProfile({ child_id: "c1" }),
      ],
    });
    // unique = 1, total = 3 → 33%
    expect(r.sensory_profile_coverage_rate).toBe(33);
  });

  it("equipment not in use is excluded from maintenance rate", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      sensory_equipment_records: [
        makeEquipment({ in_use: false, maintenance_overdue: true }),
        makeEquipment({ in_use: false, maintenance_overdue: true }),
        makeEquipment({ in_use: false, maintenance_overdue: true }),
      ],
    });
    // activeEquipment = 0 → rate = 0 but no penalty
    expect(r.equipment_maintenance_rate).toBe(0);
  });

  it("all adaptations not implemented", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      accessibility_adaptation_records: [
        makeAdaptation({ implemented: false }),
        makeAdaptation({ implemented: false }),
      ],
    });
    expect(r.accessibility_adaptation_rate).toBe(0);
    expect(r.adaptation_effectiveness_avg).toBe(0);
    // childFeedback: implementedAdaptations=0, totalInterventions=0, opportunities=0, pct(0,0)=0
    expect(r.child_feedback_rate).toBe(0);
  });

  it("interventions with no improvement", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      sensory_intervention_records: [
        makeIntervention({
          baseline_score: 5, current_score: 5, target_score: 8,
          sessions_planned: 10, sessions_completed: 10,
          child_reported_improvement: false, staff_reported_improvement: false, professional_involved: false,
        }),
      ],
    });
    // current == baseline → no improvement → effectiveness = 0%
    expect(r.intervention_effectiveness_rate).toBe(0);
  });

  it("interventions where current > target (exceeded goal)", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      sensory_intervention_records: [
        makeIntervention({
          baseline_score: 3, current_score: 10, target_score: 8,
          sessions_planned: 10, sessions_completed: 10,
          child_reported_improvement: true, staff_reported_improvement: true, professional_involved: false,
        }),
      ],
    });
    expect(r.intervention_effectiveness_rate).toBe(100);
    // progress clamped to 100: range=5, progress=7 → 140% → 100
    expect(r.intervention_progress_avg).toBe(100);
  });

  it("zero sessions planned → session completion = 0", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      sensory_intervention_records: [
        makeIntervention({
          sessions_planned: 0, sessions_completed: 0,
          current_score: 5, baseline_score: 3, target_score: 8,
          child_reported_improvement: false, staff_reported_improvement: false, professional_involved: false,
        }),
      ],
    });
    // pct(0,0) = 0
    expect(r.sensory_score).toBe(52 + 4 + 4 + 2); // coverage +4, effectiveness +4, profileReview +2
  });

  it("only non-active interventions with overdue reviews don't trigger concern", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      sensory_intervention_records: [
        makeIntervention({
          active: false, review_overdue: true,
          current_score: 5, baseline_score: 3, sessions_planned: 10, sessions_completed: 5,
          child_reported_improvement: false, staff_reported_improvement: false, professional_involved: false,
        }),
      ],
    });
    // overdueInterventionReviews only counts active ones → 0
    // activeInterventions = 0 → guard fails → no concern
    const interventionReviewConcern = r.concerns.find((c) =>
      c.includes("active intervention review"),
    );
    expect(interventionReviewConcern).toBeUndefined();
  });

  it("equipment condition poor but not in use doesn't count", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      sensory_equipment_records: [
        makeEquipment({ in_use: false, condition: "poor" }),
      ],
    });
    const poorConcern = r.concerns.find((c) =>
      c.includes("poor condition"),
    );
    expect(poorConcern).toBeUndefined();
  });

  it("replaced equipment condition doesn't trigger poor concern", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      sensory_equipment_records: [
        makeEquipment({ in_use: true, condition: "replaced" }),
      ],
    });
    const poorConcern = r.concerns.find((c) =>
      c.includes("poor condition"),
    );
    expect(poorConcern).toBeUndefined();
  });

  it("sensory room with 0 total_children gives 0 utilisation", () => {
    const r = run({
      total_children: 0,
      sensory_room_records: [
        makeSensoryRoom({ child_id: "c1" }),
      ],
    });
    expect(r.sensory_room_utilisation_rate).toBe(0);
  });

  it("adaptation effectiveness from only non-implemented is 0", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      accessibility_adaptation_records: [
        makeAdaptation({ implemented: false, effectiveness_rating: 5 }),
      ],
    });
    expect(r.adaptation_effectiveness_avg).toBe(0);
  });

  it("mixed profile types still counted", () => {
    const r = run({
      total_children: 4,
      sensory_profile_records: [
        makeProfile({ child_id: "c1", profile_type: "full" }),
        makeProfile({ child_id: "c2", profile_type: "brief" }),
        makeProfile({ child_id: "c3", profile_type: "screening" }),
        makeProfile({ child_id: "c4", profile_type: "specialist" }),
      ],
    });
    expect(r.sensory_profile_coverage_rate).toBe(100);
    expect(r.total_profiles).toBe(4);
  });

  it("sensory room with all purposes counted", () => {
    const r = run({
      total_children: 5,
      sensory_room_records: [
        makeSensoryRoom({ child_id: "c1", purpose: "regulation" }),
        makeSensoryRoom({ child_id: "c2", purpose: "therapy" }),
        makeSensoryRoom({ child_id: "c3", purpose: "recreation" }),
        makeSensoryRoom({ child_id: "c4", purpose: "crisis_support" }),
        makeSensoryRoom({ child_id: "c5", purpose: "scheduled" }),
      ],
    });
    expect(r.sensory_room_utilisation_rate).toBe(100);
  });

  it("all adaptation types counted", () => {
    const types: AccessibilityAdaptationInput["adaptation_type"][] = [
      "environmental", "equipment", "communication", "routine", "dietary", "sensory",
    ];
    const adaptations = types.map((t) =>
      makeAdaptation({ adaptation_type: t, implemented: true, effectiveness_rating: 4, child_feedback_positive: true }),
    );
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      accessibility_adaptation_records: adaptations,
    });
    expect(r.accessibility_adaptation_rate).toBe(100);
  });

  it("all intervention types counted", () => {
    const types: SensoryInterventionInput["intervention_type"][] = [
      "sensory_diet", "therapeutic", "environmental_modification",
      "communication_support", "routine_adaptation", "specialist_referral",
    ];
    const interventions = types.map((t) =>
      makeIntervention({
        intervention_type: t, active: true,
        current_score: 5, baseline_score: 3, sessions_planned: 10, sessions_completed: 9,
        child_reported_improvement: false, staff_reported_improvement: false, professional_involved: false,
      }),
    );
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      sensory_intervention_records: interventions,
    });
    expect(r.intervention_effectiveness_rate).toBe(100);
  });

  it("all equipment types counted", () => {
    const types: SensoryEquipmentInput["equipment_type"][] = [
      "weighted", "fidget", "lighting", "sound", "tactile", "proprioceptive", "vestibular", "other",
    ];
    const equipment = types.map((t) =>
      makeEquipment({ equipment_type: t, in_use: true, maintenance_overdue: false, safety_checked: true }),
    );
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      sensory_equipment_records: equipment,
    });
    expect(r.equipment_maintenance_rate).toBe(100);
  });

  it("large dataset processes without error", () => {
    const profiles = [];
    for (let i = 0; i < 50; i++) {
      profiles.push(makeProfile({ child_id: `c${i}` }));
    }
    const adaptations = [];
    for (let i = 0; i < 100; i++) {
      adaptations.push(makeAdaptation({ implemented: true, effectiveness_rating: 4, child_feedback_positive: true }));
    }
    const sessions = [];
    for (let i = 0; i < 200; i++) {
      sessions.push(makeSensoryRoom({ child_id: `c${i % 50}` }));
    }
    const equipment = [];
    for (let i = 0; i < 30; i++) {
      equipment.push(makeEquipment({ in_use: true }));
    }
    const interventions = [];
    for (let i = 0; i < 40; i++) {
      interventions.push(makeIntervention({
        current_score: 7, baseline_score: 3,
        sessions_planned: 10, sessions_completed: 9,
        child_reported_improvement: true, staff_reported_improvement: true, professional_involved: true,
      }));
    }
    const r = run({
      total_children: 50,
      sensory_profile_records: profiles,
      accessibility_adaptation_records: adaptations,
      sensory_room_records: sessions,
      sensory_equipment_records: equipment,
      sensory_intervention_records: interventions,
    });
    expect(r.sensory_score).toBe(80);
    expect(r.sensory_rating).toBe("outstanding");
  });

  it("overdue reviews plural form for singular", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1", review_overdue: true })],
      sensory_intervention_records: [
        makeIntervention({
          active: true, review_overdue: true,
          current_score: 5, baseline_score: 3, sessions_planned: 10, sessions_completed: 5,
          child_reported_improvement: false, staff_reported_improvement: false, professional_involved: false,
        }),
      ],
    });
    // Singular forms
    expect(r.concerns.some((c) => c.includes("review is overdue"))).toBe(true);
  });

  it("overdue reviews plural form for multiple", () => {
    const r = run({
      total_children: 1,
      sensory_profile_records: [
        makeProfile({ child_id: "c1", review_overdue: true }),
        makeProfile({ child_id: "c1", review_overdue: true }),
      ],
      sensory_intervention_records: [
        makeIntervention({
          active: true, review_overdue: true,
          current_score: 5, baseline_score: 3, sessions_planned: 10, sessions_completed: 5,
          child_reported_improvement: false, staff_reported_improvement: false, professional_involved: false,
        }),
        makeIntervention({
          active: true, review_overdue: true,
          current_score: 5, baseline_score: 3, sessions_planned: 10, sessions_completed: 5,
          child_reported_improvement: false, staff_reported_improvement: false, professional_involved: false,
        }),
      ],
    });
    // Plural forms
    expect(r.concerns.some((c) => c.includes("reviews are overdue"))).toBe(true);
  });

  it("poor condition singular vs plural", () => {
    const r1 = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      sensory_equipment_records: [
        makeEquipment({ in_use: true, condition: "poor" }),
      ],
    });
    expect(r1.concerns.some((c) => c.includes("1 piece of"))).toBe(true);

    const r2 = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      sensory_equipment_records: [
        makeEquipment({ in_use: true, condition: "poor" }),
        makeEquipment({ in_use: true, condition: "poor" }),
        makeEquipment({ in_use: true, condition: "poor" }),
      ],
    });
    expect(r2.concerns.some((c) => c.includes("3 pieces of"))).toBe(true);
  });

  it("intervention overdue reviews singular vs plural in concerns", () => {
    const r1 = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      sensory_intervention_records: [
        makeIntervention({
          active: true, review_overdue: true,
          current_score: 5, baseline_score: 3, sessions_planned: 10, sessions_completed: 5,
          child_reported_improvement: false, staff_reported_improvement: false, professional_involved: false,
        }),
      ],
    });
    expect(r1.concerns.some((c) => c.includes("1 active intervention review is overdue"))).toBe(true);

    const r2 = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      sensory_intervention_records: [
        makeIntervention({
          active: true, review_overdue: true,
          current_score: 5, baseline_score: 3, sessions_planned: 10, sessions_completed: 5,
          child_reported_improvement: false, staff_reported_improvement: false, professional_involved: false,
        }),
        makeIntervention({
          active: true, review_overdue: true,
          current_score: 6, baseline_score: 4, sessions_planned: 10, sessions_completed: 5,
          child_reported_improvement: false, staff_reported_improvement: false, professional_involved: false,
        }),
      ],
    });
    expect(r2.concerns.some((c) => c.includes("2 active intervention reviews are overdue"))).toBe(true);
  });

  it("intervention overdue reviews singular vs plural in insights", () => {
    const r1 = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      sensory_intervention_records: [
        makeIntervention({
          active: true, review_overdue: true,
          current_score: 5, baseline_score: 3, sessions_planned: 10, sessions_completed: 5,
          child_reported_improvement: false, staff_reported_improvement: false, professional_involved: false,
        }),
      ],
    });
    expect(r1.insights.some((i) => i.text.includes("1 active intervention has overdue reviews"))).toBe(true);

    const r2 = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      sensory_intervention_records: [
        makeIntervention({
          active: true, review_overdue: true,
          current_score: 5, baseline_score: 3, sessions_planned: 10, sessions_completed: 5,
          child_reported_improvement: false, staff_reported_improvement: false, professional_involved: false,
        }),
        makeIntervention({
          active: true, review_overdue: true,
          current_score: 6, baseline_score: 4, sessions_planned: 10, sessions_completed: 5,
          child_reported_improvement: false, staff_reported_improvement: false, professional_involved: false,
        }),
      ],
    });
    expect(r2.insights.some((i) => i.text.includes("2 active interventions have overdue reviews"))).toBe(true);
  });

  it("no duplicate strengths or concerns", () => {
    const r = run({
      total_children: 3,
      sensory_profile_records: [
        makeProfile({ child_id: "c1" }),
        makeProfile({ child_id: "c2" }),
        makeProfile({ child_id: "c3" }),
      ],
      accessibility_adaptation_records: [
        makeAdaptation({ implemented: true, effectiveness_rating: 5, child_feedback_positive: true }),
      ],
      sensory_equipment_records: [
        makeEquipment({ in_use: true }),
      ],
    });
    const uniqueStrengths = new Set(r.strengths);
    expect(uniqueStrengths.size).toBe(r.strengths.length);
    const uniqueConcerns = new Set(r.concerns);
    expect(uniqueConcerns.size).toBe(r.concerns.length);
  });

  it("good headline with no concerns", () => {
    // A good rating with no concerns
    const r = run({
      total_children: 1,
      sensory_profile_records: [makeProfile({ child_id: "c1" })],
      accessibility_adaptation_records: [
        makeAdaptation({ implemented: true, effectiveness_rating: 4, child_feedback_positive: false }),
      ],
    });
    expect(r.sensory_rating).toBe("good");
    // The headline format should handle 0 concerns gracefully
    expect(r.headline).toContain("Good sensory and accessibility support");
  });

  it("adequate headline with singular concern", () => {
    const r = run({
      total_children: 4,
      sensory_profile_records: [
        makeProfile({ child_id: "c1" }),
        makeProfile({ child_id: "c2" }),
      ],
    });
    // coverage = 2/4 = 50% → no penalty, concern for 50-79%
    // profileReview 100% → +2
    // score = 54 → adequate
    expect(r.sensory_rating).toBe("adequate");
    expect(r.headline).toMatch(/concern/);
  });
});
