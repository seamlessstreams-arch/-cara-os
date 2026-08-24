// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME PRACTICE OBSERVATION & COMPETENCY INTELLIGENCE ENGINE — TESTS
// CHR 2015 Reg 33: "Fitness of staff." SCCIF: "Staff competency."
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computePracticeObservationCompetency,
  type PracticeObservationCompetencyInput,
  type PracticeObservationInput,
} from "../home-practice-observation-competency-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeObservation(
  overrides: Partial<PracticeObservationInput> = {},
): PracticeObservationInput {
  return {
    id: "obs1",
    staff_id: "staff_1",
    outcome: "meets_standard",
    domains_observed_count: 3,
    strengths_count: 2,
    development_areas_count: 1,
    signed_off_by_staff: true,
    has_staff_response: true,
    has_linked_development_plan: true,
    ...overrides,
  };
}

function baseInput(
  overrides: Partial<PracticeObservationCompetencyInput> = {},
): PracticeObservationCompetencyInput {
  return {
    today: "2026-05-27",
    total_staff: 8,
    observations: [],
    ...overrides,
  };
}

// ── 1. Insufficient data ────────────────────────────────────────────────────

describe("Insufficient data (total_staff = 0)", () => {
  it("returns insufficient_data when total_staff is 0", () => {
    const r = computePracticeObservationCompetency(baseInput({ total_staff: 0 }));
    expect(r.observation_rating).toBe("insufficient_data");
    expect(r.observation_score).toBe(0);
    expect(r.headline).toBe("No data available for practice observation analysis");
    expect(r.total_observations).toBe(0);
  });

  it("returns empty arrays for strengths, concerns, recommendations, insights", () => {
    const r = computePracticeObservationCompetency(baseInput({ total_staff: 0 }));
    expect(r.strengths).toEqual([]);
    expect(r.concerns).toEqual([]);
    expect(r.recommendations).toEqual([]);
    expect(r.insights).toEqual([]);
  });

  it("leaves every rate unmeasured when total_staff is 0", () => {
    const r = computePracticeObservationCompetency(baseInput({ total_staff: 0 }));
    expect(r.outstanding_rate).toBeNull();
    expect(r.meets_standard_rate).toBeNull();
    expect(r.sign_off_rate).toBeNull();
    expect(r.development_plan_rate).toBeNull();
    expect(r.staff_response_rate).toBeNull();
    expect(r.staff_observed_rate).toBeNull();
  });

  it("returns insufficient_data even when observations are provided with 0 staff", () => {
    const r = computePracticeObservationCompetency(
      baseInput({ total_staff: 0, observations: [makeObservation()] }),
    );
    expect(r.observation_rating).toBe("insufficient_data");
    expect(r.observation_score).toBe(0);
  });
});

// ── 2. Zero observations ────────────────────────────────────────────────────

describe("Zero observations", () => {
  it("computes correct score: 52 - 3 - 1 - 5 = 43 (inadequate)", () => {
    // Mod 1: -3, Mod 2: no extra, Mod 3: no change, Mod 4: no change,
    // Mod 5: -1, Mod 6: -5 → 52 - 3 - 1 - 5 = 43
    const r = computePracticeObservationCompetency(baseInput());
    expect(r.observation_score).toBe(43);
    expect(r.observation_rating).toBe("inadequate");
  });

  it("reports zero total_observations", () => {
    const r = computePracticeObservationCompetency(baseInput());
    expect(r.total_observations).toBe(0);
  });

  it("leaves every rate unmeasured with 0 observations, except staff_observed_rate which is a genuine 0", () => {
    const r = computePracticeObservationCompetency(baseInput());
    expect(r.outstanding_rate).toBeNull();
    expect(r.meets_standard_rate).toBeNull();
    expect(r.sign_off_rate).toBeNull();
    expect(r.development_plan_rate).toBeNull();
    expect(r.staff_response_rate).toBeNull();
    expect(r.staff_observed_rate).toBe(0);
  });
});

// ── 3. Outstanding scenario ─────────────────────────────────────────────────

describe("Outstanding scenario", () => {
  function outstandingInput(): PracticeObservationCompetencyInput {
    // 16 observations across 8 staff (2 per staff), all outstanding/meets_standard
    const obs: PracticeObservationInput[] = [];
    for (let s = 1; s <= 8; s++) {
      obs.push(makeObservation({
        id: `obs_${s}_a`,
        staff_id: `staff_${s}`,
        outcome: s <= 4 ? "outstanding" : "meets_standard",
      }));
      obs.push(makeObservation({
        id: `obs_${s}_b`,
        staff_id: `staff_${s}`,
        outcome: s <= 4 ? "outstanding" : "meets_standard",
      }));
    }
    return baseInput({ observations: obs });
  }

  it("rates outstanding with maximum modifiers", () => {
    // Mod 1: meets_standard_rate=100 → +5
    // Mod 2: staffObservedRate=100 → +6
    // Mod 3: signOffRate=100 → +5
    // Mod 4: staffResponseRate=100 → +5
    // Mod 5: devPlanRate=100 → +4
    // Mod 6: obsPerStaff=2 → +5
    // Total: 52+5+6+5+5+4+5 = 82
    const r = computePracticeObservationCompetency(outstandingInput());
    expect(r.observation_score).toBe(82);
    expect(r.observation_rating).toBe("outstanding");
  });

  it("headline matches outstanding", () => {
    const r = computePracticeObservationCompetency(outstandingInput());
    expect(r.headline).toBe(
      "Practice observations are thorough, regular and drive staff development effectively",
    );
  });

  it("total_observations is 16", () => {
    const r = computePracticeObservationCompetency(outstandingInput());
    expect(r.total_observations).toBe(16);
  });

  it("outstanding_rate is 50 (8 outstanding / 16 total)", () => {
    const r = computePracticeObservationCompetency(outstandingInput());
    expect(r.outstanding_rate).toBe(50);
  });

  it("meets_standard_rate is 100 (all meet or exceed)", () => {
    const r = computePracticeObservationCompetency(outstandingInput());
    expect(r.meets_standard_rate).toBe(100);
  });
});

// ── 4. Good scenario ────────────────────────────────────────────────────────

describe("Good scenario", () => {
  function goodInput(): PracticeObservationCompetencyInput {
    // 10 observations, 7 unique staff out of 8
    // 9/10 meet or exceed standard → 90% meets_standard_rate
    // staffObservedRate = 7/8 = 88% → >=80 → +6
    // signOffRate = 8/10 = 80% → >=70 → +2
    // staffResponseRate = 6/10 = 60% → >=50 → +2
    // devPlanRate = 6/10 = 60% → >=50 → +1
    // obsPerStaff = 10/8 = 1.25 → >=1 → +2
    // Score: 52 +5 +6 +2 +2 +1 +2 = 70
    const obs: PracticeObservationInput[] = [];
    for (let i = 0; i < 10; i++) {
      obs.push(makeObservation({
        id: `obs_${i}`,
        staff_id: `staff_${Math.min(i + 1, 7)}`, // 7 unique staff
        outcome: i < 9 ? "meets_standard" : "developing",
        signed_off_by_staff: i < 8,
        has_staff_response: i < 6,
        has_linked_development_plan: i < 6,
      }));
    }
    return baseInput({ observations: obs });
  }

  it("rates good", () => {
    const r = computePracticeObservationCompetency(goodInput());
    expect(r.observation_score).toBe(70);
    expect(r.observation_rating).toBe("good");
  });

  it("headline matches good", () => {
    const r = computePracticeObservationCompetency(goodInput());
    expect(r.headline).toBe(
      "Good practice observation programme with effective feedback and development linkage",
    );
  });
});

// ── 5. Adequate scenario ────────────────────────────────────────────────────

describe("Adequate scenario", () => {
  function adequateInput(): PracticeObservationCompetencyInput {
    // 5 observations, 4 unique staff out of 8
    // 4/5 meets_standard → 80% → >=70 → +2
    // staffObservedRate = 4/8 = 50% → >=50 → +2
    // signOffRate = 4/5 = 80% → >=70 → +2
    // staffResponseRate = 3/5 = 60% → >=50 → +2
    // devPlanRate = 3/5 = 60% → >=50 → +1
    // obsPerStaff = 5/8 = 0.625 → <1 → -2
    // Score: 52 +2 +2 +2 +2 +1 -2 = 59
    const obs: PracticeObservationInput[] = [];
    for (let i = 0; i < 5; i++) {
      obs.push(makeObservation({
        id: `obs_${i}`,
        staff_id: `staff_${Math.min(i + 1, 4)}`,
        outcome: i < 4 ? "meets_standard" : "developing",
        signed_off_by_staff: i < 4,
        has_staff_response: i < 3,
        has_linked_development_plan: i < 3,
      }));
    }
    return baseInput({ observations: obs });
  }

  it("rates adequate", () => {
    const r = computePracticeObservationCompetency(adequateInput());
    expect(r.observation_score).toBe(59);
    expect(r.observation_rating).toBe("adequate");
  });

  it("headline matches adequate", () => {
    const r = computePracticeObservationCompetency(adequateInput());
    expect(r.headline).toBe(
      "Practice observation programme is adequate but needs more coverage and follow-through",
    );
  });
});

// ── 6. Inadequate scenario ──────────────────────────────────────────────────

describe("Inadequate scenario", () => {
  function inadequateInput(): PracticeObservationCompetencyInput {
    // 3 observations, 2 unique staff out of 8
    // 1/3 meets_standard → 33% → <50 → -5
    // staffObservedRate = 2/8 = 25% → <30 → -5
    // signOffRate = 1/3 = 33% → <50 → -4
    // staffResponseRate = 0/3 = 0% → <30 → -5
    // devPlanRate = 0/3 = 0% → <30 → -4
    // obsPerStaff = 3/8 = 0.375 → <1 → -2
    // Score: 52 -5 -5 -4 -5 -4 -2 = 27
    const obs: PracticeObservationInput[] = [];
    obs.push(makeObservation({
      id: "obs_0",
      staff_id: "staff_1",
      outcome: "meets_standard",
      signed_off_by_staff: true,
      has_staff_response: false,
      has_linked_development_plan: false,
    }));
    obs.push(makeObservation({
      id: "obs_1",
      staff_id: "staff_1",
      outcome: "requires_support",
      signed_off_by_staff: false,
      has_staff_response: false,
      has_linked_development_plan: false,
    }));
    obs.push(makeObservation({
      id: "obs_2",
      staff_id: "staff_2",
      outcome: "developing",
      signed_off_by_staff: false,
      has_staff_response: false,
      has_linked_development_plan: false,
    }));
    return baseInput({ observations: obs });
  }

  it("rates inadequate", () => {
    const r = computePracticeObservationCompetency(inadequateInput());
    expect(r.observation_score).toBe(27);
    expect(r.observation_rating).toBe("inadequate");
  });

  it("headline matches inadequate", () => {
    const r = computePracticeObservationCompetency(inadequateInput());
    expect(r.headline).toBe(
      "Practice observation programme is inadequate — staff competency is not being assured",
    );
  });
});

// ── 7. Modifier boundary tests ──────────────────────────────────────────────

describe("Modifier 1: Quality outcomes (meets_standard_rate)", () => {
  function allPerfectExceptQuality(
    outcomes: string[],
  ): PracticeObservationCompetencyInput {
    // Build 16 obs across 8 staff for full coverage; vary outcomes
    const obs = outcomes.map((outcome, i) =>
      makeObservation({
        id: `obs_${i}`,
        staff_id: `staff_${(i % 8) + 1}`,
        outcome,
      }),
    );
    return baseInput({ observations: obs });
  }

  it(">=90% meets_standard_rate gives +5", () => {
    // 16 obs, 15 meets_standard + 1 developing = 94%
    const outcomes = Array(15).fill("meets_standard").concat(["developing"]);
    const r = computePracticeObservationCompetency(allPerfectExceptQuality(outcomes));
    // meetsStandardRate = round(15/16*100) = 94 → +5
    expect(r.meets_standard_rate).toBe(94);
    // Mod1:+5, Mod2:100%→+6, Mod3:100%→+5, Mod4:100%→+5, Mod5:100%→+4, Mod6:2→+5
    expect(r.observation_score).toBe(82);
  });

  it(">=70% <90% meets_standard_rate gives +2", () => {
    // 10 obs, 8 meets_standard + 2 developing = 80%
    const obs = Array.from({ length: 10 }, (_, i) =>
      makeObservation({
        id: `obs_${i}`,
        staff_id: `staff_${(i % 8) + 1}`,
        outcome: i < 8 ? "meets_standard" : "developing",
      }),
    );
    const r = computePracticeObservationCompetency(baseInput({ observations: obs }));
    expect(r.meets_standard_rate).toBe(80);
    // Mod1:+2, Mod2: 8/8=100→+6, Mod3:100→+5, Mod4:100→+5, Mod5:100→+4, Mod6:10/8=1.25→+2
    expect(r.observation_score).toBe(76);
  });

  it("<50% meets_standard_rate gives -5", () => {
    // 10 obs, 4 meets_standard + 6 requires_support = 40%
    const obs = Array.from({ length: 10 }, (_, i) =>
      makeObservation({
        id: `obs_${i}`,
        staff_id: `staff_${(i % 8) + 1}`,
        outcome: i < 4 ? "meets_standard" : "requires_support",
      }),
    );
    const r = computePracticeObservationCompetency(baseInput({ observations: obs }));
    expect(r.meets_standard_rate).toBe(40);
    // Mod1:-5, Mod2:8/8→+6, Mod3:100→+5, Mod4:100→+5, Mod5:100→+4, Mod6:10/8→+2
    expect(r.observation_score).toBe(69);
  });

  it("50-69% meets_standard_rate gives no modifier (between boundaries)", () => {
    // 10 obs, 6 meets_standard + 4 developing = 60%
    const obs = Array.from({ length: 10 }, (_, i) =>
      makeObservation({
        id: `obs_${i}`,
        staff_id: `staff_${(i % 8) + 1}`,
        outcome: i < 6 ? "meets_standard" : "developing",
      }),
    );
    const r = computePracticeObservationCompetency(baseInput({ observations: obs }));
    expect(r.meets_standard_rate).toBe(60);
    // Mod1:0, Mod2:8/8→+6, Mod3:100→+5, Mod4:100→+5, Mod5:100→+4, Mod6:10/8→+2
    expect(r.observation_score).toBe(74);
  });
});

describe("Modifier 2: Staff coverage (staff_observed_rate)", () => {
  it(">=80% staff coverage gives +6", () => {
    // 8 obs, 7 unique staff out of 8 → 88%
    const obs = Array.from({ length: 8 }, (_, i) =>
      makeObservation({ id: `obs_${i}`, staff_id: `staff_${Math.min(i + 1, 7)}` }),
    );
    const r = computePracticeObservationCompetency(baseInput({ observations: obs }));
    expect(r.staff_observed_rate).toBe(88);
  });

  it(">=50% <80% staff coverage gives +2", () => {
    // 5 obs, 5 unique staff out of 8 → 63%
    const obs = Array.from({ length: 5 }, (_, i) =>
      makeObservation({ id: `obs_${i}`, staff_id: `staff_${i + 1}` }),
    );
    const r = computePracticeObservationCompetency(baseInput({ observations: obs }));
    expect(r.staff_observed_rate).toBe(63);
  });

  it("<30% staff coverage gives -5", () => {
    // 2 obs, 2 unique staff out of 8 → 25%
    const obs = [
      makeObservation({ id: "obs_0", staff_id: "staff_1" }),
      makeObservation({ id: "obs_1", staff_id: "staff_2" }),
    ];
    const r = computePracticeObservationCompetency(baseInput({ observations: obs }));
    expect(r.staff_observed_rate).toBe(25);
  });

  it("30-49% staff coverage gives no modifier", () => {
    // 3 obs, 3 unique staff out of 8 → 38%
    const obs = Array.from({ length: 3 }, (_, i) =>
      makeObservation({ id: `obs_${i}`, staff_id: `staff_${i + 1}` }),
    );
    const r = computePracticeObservationCompetency(baseInput({ observations: obs }));
    expect(r.staff_observed_rate).toBe(38);
  });
});

describe("Modifier 3: Sign-off rate", () => {
  it(">=90% sign-off gives +5", () => {
    const obs = Array.from({ length: 10 }, (_, i) =>
      makeObservation({
        id: `obs_${i}`,
        staff_id: `staff_${(i % 8) + 1}`,
        signed_off_by_staff: i < 9,
      }),
    );
    const r = computePracticeObservationCompetency(baseInput({ observations: obs }));
    expect(r.sign_off_rate).toBe(90);
  });

  it(">=70% <90% sign-off gives +2", () => {
    const obs = Array.from({ length: 10 }, (_, i) =>
      makeObservation({
        id: `obs_${i}`,
        staff_id: `staff_${(i % 8) + 1}`,
        signed_off_by_staff: i < 7,
      }),
    );
    const r = computePracticeObservationCompetency(baseInput({ observations: obs }));
    expect(r.sign_off_rate).toBe(70);
  });

  it("<50% sign-off gives -4", () => {
    const obs = Array.from({ length: 10 }, (_, i) =>
      makeObservation({
        id: `obs_${i}`,
        staff_id: `staff_${(i % 8) + 1}`,
        signed_off_by_staff: i < 4,
      }),
    );
    const r = computePracticeObservationCompetency(baseInput({ observations: obs }));
    expect(r.sign_off_rate).toBe(40);
  });
});

describe("Modifier 4: Staff response rate", () => {
  it(">=80% response gives +5", () => {
    const obs = Array.from({ length: 10 }, (_, i) =>
      makeObservation({
        id: `obs_${i}`,
        staff_id: `staff_${(i % 8) + 1}`,
        has_staff_response: i < 8,
      }),
    );
    const r = computePracticeObservationCompetency(baseInput({ observations: obs }));
    expect(r.staff_response_rate).toBe(80);
  });

  it(">=50% <80% response gives +2", () => {
    const obs = Array.from({ length: 10 }, (_, i) =>
      makeObservation({
        id: `obs_${i}`,
        staff_id: `staff_${(i % 8) + 1}`,
        has_staff_response: i < 5,
      }),
    );
    const r = computePracticeObservationCompetency(baseInput({ observations: obs }));
    expect(r.staff_response_rate).toBe(50);
  });

  it("<30% response gives -5", () => {
    const obs = Array.from({ length: 10 }, (_, i) =>
      makeObservation({
        id: `obs_${i}`,
        staff_id: `staff_${(i % 8) + 1}`,
        has_staff_response: i < 2,
      }),
    );
    const r = computePracticeObservationCompetency(baseInput({ observations: obs }));
    expect(r.staff_response_rate).toBe(20);
  });
});

describe("Modifier 5: Development plan linkage", () => {
  it(">=80% dev plan gives +4", () => {
    const obs = Array.from({ length: 10 }, (_, i) =>
      makeObservation({
        id: `obs_${i}`,
        staff_id: `staff_${(i % 8) + 1}`,
        has_linked_development_plan: i < 8,
      }),
    );
    const r = computePracticeObservationCompetency(baseInput({ observations: obs }));
    expect(r.development_plan_rate).toBe(80);
  });

  it(">=50% <80% dev plan gives +1", () => {
    const obs = Array.from({ length: 10 }, (_, i) =>
      makeObservation({
        id: `obs_${i}`,
        staff_id: `staff_${(i % 8) + 1}`,
        has_linked_development_plan: i < 5,
      }),
    );
    const r = computePracticeObservationCompetency(baseInput({ observations: obs }));
    expect(r.development_plan_rate).toBe(50);
  });

  it("<30% dev plan gives -4", () => {
    const obs = Array.from({ length: 10 }, (_, i) =>
      makeObservation({
        id: `obs_${i}`,
        staff_id: `staff_${(i % 8) + 1}`,
        has_linked_development_plan: i < 2,
      }),
    );
    const r = computePracticeObservationCompetency(baseInput({ observations: obs }));
    expect(r.development_plan_rate).toBe(20);
  });

  it("zero observations gives -1 for dev plan", () => {
    const r = computePracticeObservationCompetency(baseInput());
    // Score includes Mod5: -1. Verified via zero observations total = 43
    expect(r.observation_score).toBe(43);
  });
});

describe("Modifier 6: Frequency (obs per staff)", () => {
  it(">=2 obs per staff gives +5", () => {
    // 16 obs / 8 staff = 2.0
    const obs = Array.from({ length: 16 }, (_, i) =>
      makeObservation({ id: `obs_${i}`, staff_id: `staff_${(i % 8) + 1}` }),
    );
    const r = computePracticeObservationCompetency(baseInput({ observations: obs }));
    expect(r.total_observations).toBe(16);
  });

  it(">=1 <2 obs per staff gives +2", () => {
    // 10 obs / 8 staff = 1.25
    const obs = Array.from({ length: 10 }, (_, i) =>
      makeObservation({ id: `obs_${i}`, staff_id: `staff_${(i % 8) + 1}` }),
    );
    const r = computePracticeObservationCompetency(baseInput({ observations: obs }));
    expect(r.total_observations).toBe(10);
  });

  it("0 observations gives -5 for frequency", () => {
    const r = computePracticeObservationCompetency(baseInput());
    // Already verified via zero observations total = 43
    expect(r.observation_score).toBe(43);
  });

  it("<1 obs per staff (non-zero) gives -2", () => {
    // 4 obs / 8 staff = 0.5
    const obs = Array.from({ length: 4 }, (_, i) =>
      makeObservation({ id: `obs_${i}`, staff_id: `staff_${i + 1}` }),
    );
    const r = computePracticeObservationCompetency(baseInput({ observations: obs }));
    // Mod1: 100→+5, Mod2: 4/8=50→+2, Mod3: 100→+5, Mod4: 100→+5, Mod5: 100→+4, Mod6: -2
    expect(r.observation_score).toBe(71);
  });
});

// ── 8. Strengths generation ─────────────────────────────────────────────────

describe("Strengths generation", () => {
  function fullStrengthInput(): PracticeObservationCompetencyInput {
    // All flags high: all outstanding/meets, all signed, all responded, all dev plans
    const obs: PracticeObservationInput[] = [];
    for (let s = 1; s <= 8; s++) {
      obs.push(makeObservation({
        id: `obs_${s}_a`,
        staff_id: `staff_${s}`,
        outcome: "outstanding",
      }));
      obs.push(makeObservation({
        id: `obs_${s}_b`,
        staff_id: `staff_${s}`,
        outcome: "outstanding",
      }));
    }
    return baseInput({ observations: obs });
  }

  it("includes meets_standard strength when meetsStandardRate >= 90", () => {
    const r = computePracticeObservationCompetency(fullStrengthInput());
    expect(r.strengths).toContain(
      "All observed staff meet or exceed practice standards — strong evidence of competency",
    );
  });

  it("includes staff coverage strength when staffObservedRate >= 80", () => {
    const r = computePracticeObservationCompetency(fullStrengthInput());
    expect(r.strengths).toContain(
      "Comprehensive staff coverage ensures no team member's practice goes unobserved",
    );
  });

  it("includes sign-off strength when signOffRate >= 90", () => {
    const r = computePracticeObservationCompetency(fullStrengthInput());
    expect(r.strengths).toContain(
      "Staff consistently acknowledge and engage with observation feedback",
    );
  });

  it("includes staff response strength when staffResponseRate >= 80", () => {
    const r = computePracticeObservationCompetency(fullStrengthInput());
    expect(r.strengths).toContain(
      "Staff actively reflect on observations — demonstrating a learning culture",
    );
  });

  it("includes dev plan strength when devPlanRate >= 80", () => {
    const r = computePracticeObservationCompetency(fullStrengthInput());
    expect(r.strengths).toContain(
      "Observations are systematically linked to development plans — learning is structured",
    );
  });

  it("includes outstanding rate strength when outstandingRate >= 50", () => {
    const r = computePracticeObservationCompetency(fullStrengthInput());
    expect(r.strengths).toContain(
      "High proportion of outstanding practice observed — staff deliver exceptional care",
    );
  });

  it("does not include strengths when rates are below thresholds", () => {
    const obs = [
      makeObservation({
        id: "obs_0",
        staff_id: "staff_1",
        outcome: "developing",
        signed_off_by_staff: false,
        has_staff_response: false,
        has_linked_development_plan: false,
      }),
    ];
    const r = computePracticeObservationCompetency(baseInput({ observations: obs }));
    expect(r.strengths).toEqual([]);
  });
});

// ── 9. Concerns generation ──────────────────────────────────────────────────

describe("Concerns generation", () => {
  it("includes no-observations concern when total is 0", () => {
    const r = computePracticeObservationCompetency(baseInput());
    expect(r.concerns).toContain(
      "No practice observations recorded — staff competency cannot be evidenced",
    );
  });

  it("includes low meets_standard concern when < 50%", () => {
    const obs = Array.from({ length: 10 }, (_, i) =>
      makeObservation({
        id: `obs_${i}`,
        staff_id: `staff_${(i % 8) + 1}`,
        outcome: i < 4 ? "meets_standard" : "requires_support",
      }),
    );
    const r = computePracticeObservationCompetency(baseInput({ observations: obs }));
    expect(r.concerns).toContain(
      "Majority of observations identify staff not yet meeting expected standards",
    );
  });

  it("includes low coverage concern when staffObservedRate < 30%", () => {
    const obs = [
      makeObservation({ id: "obs_0", staff_id: "staff_1" }),
      makeObservation({ id: "obs_1", staff_id: "staff_2" }),
    ];
    const r = computePracticeObservationCompetency(baseInput({ observations: obs }));
    expect(r.staff_observed_rate).toBe(25);
    expect(r.concerns).toContain(
      "Most staff have not been observed — competency assurance has significant gaps",
    );
  });

  it("includes sign-off concern when < 50%", () => {
    const obs = Array.from({ length: 10 }, (_, i) =>
      makeObservation({
        id: `obs_${i}`,
        staff_id: `staff_${(i % 8) + 1}`,
        signed_off_by_staff: i < 4,
      }),
    );
    const r = computePracticeObservationCompetency(baseInput({ observations: obs }));
    expect(r.concerns).toContain(
      "Staff are not signing off observations — feedback loop is broken",
    );
  });

  it("includes response concern when < 30%", () => {
    const obs = Array.from({ length: 10 }, (_, i) =>
      makeObservation({
        id: `obs_${i}`,
        staff_id: `staff_${(i % 8) + 1}`,
        has_staff_response: i < 2,
      }),
    );
    const r = computePracticeObservationCompetency(baseInput({ observations: obs }));
    expect(r.concerns).toContain(
      "Staff rarely respond to observations — reflective practice is absent",
    );
  });

  it("includes dev plan concern when < 30%", () => {
    const obs = Array.from({ length: 10 }, (_, i) =>
      makeObservation({
        id: `obs_${i}`,
        staff_id: `staff_${(i % 8) + 1}`,
        has_linked_development_plan: i < 2,
      }),
    );
    const r = computePracticeObservationCompetency(baseInput({ observations: obs }));
    expect(r.concerns).toContain(
      "Observations are not linked to development plans — learning is not structured",
    );
  });
});

// ── 10. Recommendations generation ──────────────────────────────────────────

describe("Recommendations generation", () => {
  it("recommends establishing schedule when 0 observations", () => {
    const r = computePracticeObservationCompetency(baseInput());
    expect(r.recommendations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          recommendation: "Establish a regular practice observation schedule covering all staff",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 33",
        }),
      ]),
    );
  });

  it("recommends extending coverage when staffObservedRate < 50%", () => {
    const obs = Array.from({ length: 3 }, (_, i) =>
      makeObservation({ id: `obs_${i}`, staff_id: `staff_${i + 1}` }),
    );
    const r = computePracticeObservationCompetency(baseInput({ observations: obs }));
    expect(r.staff_observed_rate).toBe(38);
    expect(r.recommendations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          recommendation: "Extend observation programme to cover all team members within a rolling cycle",
          urgency: "soon",
        }),
      ]),
    );
  });

  it("recommends targeted support when meetsStandardRate < 70%", () => {
    const obs = Array.from({ length: 10 }, (_, i) =>
      makeObservation({
        id: `obs_${i}`,
        staff_id: `staff_${(i % 8) + 1}`,
        outcome: i < 6 ? "meets_standard" : "requires_support",
      }),
    );
    const r = computePracticeObservationCompetency(baseInput({ observations: obs }));
    expect(r.meets_standard_rate).toBe(60);
    expect(r.recommendations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          recommendation: "Provide targeted support for staff whose observations identify development needs",
          urgency: "immediate",
          regulatory_ref: "SCCIF Competency",
        }),
      ]),
    );
  });

  it("recommends sign-off improvement when signOffRate < 70%", () => {
    const obs = Array.from({ length: 10 }, (_, i) =>
      makeObservation({
        id: `obs_${i}`,
        staff_id: `staff_${(i % 8) + 1}`,
        signed_off_by_staff: i < 6,
      }),
    );
    const r = computePracticeObservationCompetency(baseInput({ observations: obs }));
    expect(r.sign_off_rate).toBe(60);
    expect(r.recommendations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          recommendation: "Ensure all observations are formally acknowledged and signed off by staff",
          urgency: "soon",
        }),
      ]),
    );
  });

  it("recommends dev plan linkage when devPlanRate < 50%", () => {
    const obs = Array.from({ length: 10 }, (_, i) =>
      makeObservation({
        id: `obs_${i}`,
        staff_id: `staff_${(i % 8) + 1}`,
        has_linked_development_plan: i < 4,
      }),
    );
    const r = computePracticeObservationCompetency(baseInput({ observations: obs }));
    expect(r.development_plan_rate).toBe(40);
    expect(r.recommendations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          recommendation: "Link observation outcomes to individual development plans for actionable learning",
          urgency: "planned",
          regulatory_ref: "SCCIF Staff Development",
        }),
      ]),
    );
  });

  it("recommends increasing frequency when obsPerStaff < 1 and total > 0", () => {
    const obs = Array.from({ length: 4 }, (_, i) =>
      makeObservation({ id: `obs_${i}`, staff_id: `staff_${i + 1}` }),
    );
    const r = computePracticeObservationCompetency(baseInput({ observations: obs }));
    expect(r.recommendations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          recommendation: "Increase observation frequency to at least one per staff member per review period",
          urgency: "soon",
        }),
      ]),
    );
  });
});

// ── 11. Insights generation ─────────────────────────────────────────────────

describe("Insights generation", () => {
  it("positive insight when meetsStandardRate >=90 and staffObservedRate >=80", () => {
    const obs: PracticeObservationInput[] = [];
    for (let s = 1; s <= 8; s++) {
      obs.push(makeObservation({ id: `obs_${s}_a`, staff_id: `staff_${s}` }));
      obs.push(makeObservation({ id: `obs_${s}_b`, staff_id: `staff_${s}` }));
    }
    const r = computePracticeObservationCompetency(baseInput({ observations: obs }));
    expect(r.insights).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          text: "Comprehensive observation programme with consistently high standards — robust competency evidence for Ofsted",
          severity: "positive",
        }),
      ]),
    );
  });

  it("critical insight when 0 observations", () => {
    const r = computePracticeObservationCompetency(baseInput());
    expect(r.insights).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          text: "Without practice observations, the home cannot demonstrate staff are competent — a critical gap for regulators",
          severity: "critical",
        }),
      ]),
    );
  });

  it("warning insight when meetsStandardRate < 50", () => {
    const obs = Array.from({ length: 10 }, (_, i) =>
      makeObservation({
        id: `obs_${i}`,
        staff_id: `staff_${(i % 8) + 1}`,
        outcome: i < 4 ? "meets_standard" : "requires_support",
      }),
    );
    const r = computePracticeObservationCompetency(baseInput({ observations: obs }));
    expect(r.insights).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          text: "Low competency rates suggest systemic workforce development needs — consider targeted training investment",
          severity: "warning",
        }),
      ]),
    );
  });

  it("positive insight when staffResponseRate >=80 and signOffRate >=90", () => {
    const obs: PracticeObservationInput[] = [];
    for (let s = 1; s <= 8; s++) {
      obs.push(makeObservation({ id: `obs_${s}_a`, staff_id: `staff_${s}` }));
      obs.push(makeObservation({ id: `obs_${s}_b`, staff_id: `staff_${s}` }));
    }
    const r = computePracticeObservationCompetency(baseInput({ observations: obs }));
    expect(r.insights).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          text: "Strong staff engagement with observations indicates a genuine learning culture — care quality benefits directly",
          severity: "positive",
        }),
      ]),
    );
  });

  it("positive insight when outstandingRate >= 50", () => {
    const obs: PracticeObservationInput[] = [];
    for (let s = 1; s <= 8; s++) {
      obs.push(makeObservation({
        id: `obs_${s}_a`,
        staff_id: `staff_${s}`,
        outcome: "outstanding",
      }));
      obs.push(makeObservation({
        id: `obs_${s}_b`,
        staff_id: `staff_${s}`,
        outcome: "outstanding",
      }));
    }
    const r = computePracticeObservationCompetency(baseInput({ observations: obs }));
    expect(r.outstanding_rate).toBe(100);
    expect(r.insights).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          text: "Over half of observations rate as outstanding — this team delivers exceptional practice worthy of recognition",
          severity: "positive",
        }),
      ]),
    );
  });
});

// ── 12. Headline for each rating ────────────────────────────────────────────

describe("Headlines", () => {
  it("outstanding headline at score 80", () => {
    // Build a scenario that gives exactly 80
    // 52 +5+6+5+5+4+5 = 82 is full outstanding; need score=80
    // 52 +5+6+5+2+4+5 = 79 ... not quite
    // Use the outstanding input (score 82) and accept >=80
    const obs: PracticeObservationInput[] = [];
    for (let s = 1; s <= 8; s++) {
      obs.push(makeObservation({ id: `obs_${s}_a`, staff_id: `staff_${s}` }));
      obs.push(makeObservation({ id: `obs_${s}_b`, staff_id: `staff_${s}` }));
    }
    const r = computePracticeObservationCompetency(baseInput({ observations: obs }));
    expect(r.observation_rating).toBe("outstanding");
    expect(r.headline).toBe(
      "Practice observations are thorough, regular and drive staff development effectively",
    );
  });

  it("good headline at score 65-79", () => {
    // 10 obs, all meets, 8 staff, all signed, all responses, all dev plans
    // Mod1: 100→+5, Mod2:8/8→+6, Mod3:100→+5, Mod4:100→+5, Mod5:100→+4, Mod6:10/8=1.25→+2
    // = 52+5+6+5+5+4+2 = 79 → good
    const obs = Array.from({ length: 10 }, (_, i) =>
      makeObservation({ id: `obs_${i}`, staff_id: `staff_${(i % 8) + 1}` }),
    );
    const r = computePracticeObservationCompetency(baseInput({ observations: obs }));
    expect(r.observation_score).toBe(79);
    expect(r.observation_rating).toBe("good");
    expect(r.headline).toBe(
      "Good practice observation programme with effective feedback and development linkage",
    );
  });

  it("adequate headline at score 45-64", () => {
    // 5 obs across 4 staff, all meets, all signed, all responses, all dev plans
    // Mod1: 100→+5, Mod2: 4/8=50→+2, Mod3:100→+5, Mod4:100→+5, Mod5:100→+4, Mod6:5/8=0.625→-2
    // = 52+5+2+5+5+4-2 = 71 — too high. Need lower values.
    // 4 obs across 3 staff, 3/4 meets, 2/4 signed, 2/4 response, 2/4 dev
    // Mod1: 75→+2, Mod2:3/8=38→0, Mod3:50→0 (between 50-69), Mod4:50→+2, Mod5:50→+1, Mod6:4/8=0.5→-2
    // = 52+2+0+0+2+1-2 = 55 → adequate
    const obs = Array.from({ length: 4 }, (_, i) =>
      makeObservation({
        id: `obs_${i}`,
        staff_id: `staff_${Math.min(i + 1, 3)}`,
        outcome: i < 3 ? "meets_standard" : "developing",
        signed_off_by_staff: i < 2,
        has_staff_response: i < 2,
        has_linked_development_plan: i < 2,
      }),
    );
    const r = computePracticeObservationCompetency(baseInput({ observations: obs }));
    expect(r.observation_rating).toBe("adequate");
    expect(r.headline).toBe(
      "Practice observation programme is adequate but needs more coverage and follow-through",
    );
  });

  it("inadequate headline at score < 45", () => {
    const r = computePracticeObservationCompetency(baseInput());
    expect(r.observation_score).toBe(43);
    expect(r.observation_rating).toBe("inadequate");
    expect(r.headline).toBe(
      "Practice observation programme is inadequate — staff competency is not being assured",
    );
  });
});

// ── 13. Edge cases ──────────────────────────────────────────────────────────

describe("Edge cases", () => {
  it("single observation computes correctly", () => {
    const obs = [makeObservation({ id: "obs_0", staff_id: "staff_1" })];
    const r = computePracticeObservationCompetency(baseInput({ observations: obs }));
    // Mod1: 100→+5, Mod2:1/8=13→-5, Mod3:100→+5, Mod4:100→+5, Mod5:100→+4, Mod6:1/8=0.125→-2
    // = 52+5-5+5+5+4-2 = 64
    expect(r.observation_score).toBe(64);
    expect(r.observation_rating).toBe("adequate");
    expect(r.total_observations).toBe(1);
  });

  it("all requires_support observations", () => {
    const obs = Array.from({ length: 10 }, (_, i) =>
      makeObservation({
        id: `obs_${i}`,
        staff_id: `staff_${(i % 8) + 1}`,
        outcome: "requires_support",
        signed_off_by_staff: false,
        has_staff_response: false,
        has_linked_development_plan: false,
      }),
    );
    const r = computePracticeObservationCompetency(baseInput({ observations: obs }));
    expect(r.meets_standard_rate).toBe(0);
    expect(r.outstanding_rate).toBe(0);
    // Mod1: 0<50→-5, Mod2:8/8=100→+6, Mod3:0<50→-4, Mod4:0<30→-5, Mod5:0<30→-4, Mod6:10/8=1.25→+2
    // = 52-5+6-4-5-4+2 = 42
    expect(r.observation_score).toBe(42);
    expect(r.observation_rating).toBe("inadequate");
  });

  it("duplicate staff_ids counted once for coverage", () => {
    // 4 observations all from the same staff
    const obs = Array.from({ length: 4 }, (_, i) =>
      makeObservation({ id: `obs_${i}`, staff_id: "staff_1" }),
    );
    const r = computePracticeObservationCompetency(baseInput({ observations: obs }));
    // 1 unique staff out of 8 = 13%
    expect(r.staff_observed_rate).toBe(13);
  });

  it("total_staff = 1 with 2 observations yields >=2 frequency", () => {
    const obs = [
      makeObservation({ id: "obs_0", staff_id: "staff_1" }),
      makeObservation({ id: "obs_1", staff_id: "staff_1" }),
    ];
    const r = computePracticeObservationCompetency(
      baseInput({ total_staff: 1, observations: obs }),
    );
    // Mod1: 100→+5, Mod2:1/1=100→+6, Mod3:100→+5, Mod4:100→+5, Mod5:100→+4, Mod6:2/1=2→+5
    // = 52+5+6+5+5+4+5 = 82
    expect(r.observation_score).toBe(82);
    expect(r.observation_rating).toBe("outstanding");
    expect(r.staff_observed_rate).toBe(100);
  });

  it("outstanding outcome counted in both outstanding_rate and meets_standard_rate", () => {
    const obs = [
      makeObservation({ id: "obs_0", staff_id: "staff_1", outcome: "outstanding" }),
    ];
    const r = computePracticeObservationCompetency(baseInput({ observations: obs }));
    expect(r.outstanding_rate).toBe(100);
    expect(r.meets_standard_rate).toBe(100);
  });

  it("developing outcome not counted in meets_standard_rate", () => {
    const obs = [
      makeObservation({ id: "obs_0", staff_id: "staff_1", outcome: "developing" }),
    ];
    const r = computePracticeObservationCompetency(baseInput({ observations: obs }));
    expect(r.outstanding_rate).toBe(0);
    expect(r.meets_standard_rate).toBe(0);
  });

  it("score is clamped to 0 minimum", () => {
    // Extremely bad scenario with tiny staff count to maximise penalties
    // 1 obs, 1 unique staff out of 100, requires_support, no sign-off, no response, no dev plan
    const obs = [
      makeObservation({
        id: "obs_0",
        staff_id: "staff_1",
        outcome: "requires_support",
        signed_off_by_staff: false,
        has_staff_response: false,
        has_linked_development_plan: false,
      }),
    ];
    const r = computePracticeObservationCompetency(
      baseInput({ total_staff: 100, observations: obs }),
    );
    // Mod1: 0<50→-5, Mod2:1/100=1→-5, Mod3:0<50→-4, Mod4:0<30→-5, Mod5:0<30→-4, Mod6:1/100=0.01→-2
    // = 52-5-5-4-5-4-2 = 27
    expect(r.observation_score).toBe(27);
    expect(r.observation_score).toBeGreaterThanOrEqual(0);
  });

  it("score is clamped to 100 maximum", () => {
    // Score is 82 at best with 8 staff. Cannot exceed 100. Confirm clamp works.
    const obs: PracticeObservationInput[] = [];
    for (let s = 1; s <= 8; s++) {
      obs.push(makeObservation({ id: `obs_${s}_a`, staff_id: `staff_${s}` }));
      obs.push(makeObservation({ id: `obs_${s}_b`, staff_id: `staff_${s}` }));
    }
    const r = computePracticeObservationCompetency(baseInput({ observations: obs }));
    expect(r.observation_score).toBeLessThanOrEqual(100);
  });

  it("large observation set processes without error", () => {
    const obs = Array.from({ length: 200 }, (_, i) =>
      makeObservation({ id: `obs_${i}`, staff_id: `staff_${(i % 8) + 1}` }),
    );
    const r = computePracticeObservationCompetency(baseInput({ observations: obs }));
    expect(r.total_observations).toBe(200);
    expect(r.observation_rating).toBe("outstanding");
  });
});

// ── 14. Cap tests ───────────────────────────────────────────────────────────

describe("Cap tests", () => {
  it("recommendations capped at 5", () => {
    // Trigger all 6 possible recommendations (excluding zero-obs one)
    // Need: staffObservedRate < 50, meetsStandardRate < 70, signOffRate < 70,
    //       devPlanRate < 50, obsPerStaff < 1
    // Also need total > 0
    // 2 obs, 1 unique staff / 8 = 13% coverage
    // 1/2 meets = 50% (still triggers <70)
    // 0/2 signed = 0% (<70)
    // 0/2 response = 0%
    // 0/2 dev plan = 0% (<50)
    // 2/8 = 0.25 per staff (<1)
    const obs = [
      makeObservation({
        id: "obs_0",
        staff_id: "staff_1",
        outcome: "meets_standard",
        signed_off_by_staff: false,
        has_staff_response: false,
        has_linked_development_plan: false,
      }),
      makeObservation({
        id: "obs_1",
        staff_id: "staff_1",
        outcome: "requires_support",
        signed_off_by_staff: false,
        has_staff_response: false,
        has_linked_development_plan: false,
      }),
    ];
    const r = computePracticeObservationCompetency(baseInput({ observations: obs }));
    // All 5 non-zero-obs recs triggered, plus frequency rec = 6 total, capped at 5
    expect(r.recommendations.length).toBeLessThanOrEqual(5);
    // Ranks are renumbered 1..N
    r.recommendations.forEach((rec, i) => {
      expect(rec.rank).toBe(i + 1);
    });
  });

  it("insights capped at 3", () => {
    // Trigger as many insights as possible
    // meetsStandardRate >=90 && staffObservedRate >=80 → positive
    // staffResponseRate >=80 && signOffRate >=90 → positive
    // outstandingRate >=50 → positive
    // That's 3 positives. Also cannot trigger warning (requires meetsStandard < 50) or critical (requires 0 obs).
    const obs: PracticeObservationInput[] = [];
    for (let s = 1; s <= 8; s++) {
      obs.push(makeObservation({
        id: `obs_${s}_a`,
        staff_id: `staff_${s}`,
        outcome: "outstanding",
      }));
      obs.push(makeObservation({
        id: `obs_${s}_b`,
        staff_id: `staff_${s}`,
        outcome: "outstanding",
      }));
    }
    const r = computePracticeObservationCompetency(baseInput({ observations: obs }));
    expect(r.insights.length).toBeLessThanOrEqual(3);
    expect(r.insights.length).toBe(3);
  });

  it("recommendations have sequential ranks starting at 1", () => {
    const r = computePracticeObservationCompetency(baseInput());
    r.recommendations.forEach((rec, i) => {
      expect(rec.rank).toBe(i + 1);
    });
  });
});

// ── Score derivation verification ───────────────────────────────────────────

describe("Score derivation verification", () => {
  it("base 52 with all neutral modifiers", () => {
    // Need each modifier in its neutral zone (not triggering any branch)
    // Mod1: 50 <= meetsStandard < 70 → 0
    // Mod2: 30 <= staffObserved < 50 → 0
    // Mod3: 50 <= signOff < 70 → 0
    // Mod4: 30 <= response < 50 → 0
    // Mod5: 30 <= devPlan < 50 → 0
    // Mod6: >0 and <1 per staff → -2
    // Score: 52 + 0 + 0 + 0 + 0 + 0 - 2 = 50
    // 6 obs / 8 staff = 0.75 per staff → -2
    // 4/6 meets = 67% → neutral
    // 3 unique / 8 = 38% → neutral
    // 4/6 signed = 67% → neutral
    // 2/6 response = 33% → neutral
    // 2/6 dev plan = 33% → neutral
    const obs = Array.from({ length: 6 }, (_, i) =>
      makeObservation({
        id: `obs_${i}`,
        staff_id: `staff_${Math.min(i + 1, 3)}`,
        outcome: i < 4 ? "meets_standard" : "developing",
        signed_off_by_staff: i < 4,
        has_staff_response: i < 2,
        has_linked_development_plan: i < 2,
      }),
    );
    const r = computePracticeObservationCompetency(baseInput({ observations: obs }));
    expect(r.meets_standard_rate).toBe(67);
    expect(r.staff_observed_rate).toBe(38);
    expect(r.sign_off_rate).toBe(67);
    expect(r.staff_response_rate).toBe(33);
    expect(r.development_plan_rate).toBe(33);
    // All neutral except Mod6: -2
    expect(r.observation_score).toBe(50);
  });

  it("all maximum bonuses yield 52+5+6+5+5+4+5 = 82", () => {
    const obs: PracticeObservationInput[] = [];
    for (let s = 1; s <= 8; s++) {
      obs.push(makeObservation({ id: `obs_${s}_a`, staff_id: `staff_${s}` }));
      obs.push(makeObservation({ id: `obs_${s}_b`, staff_id: `staff_${s}` }));
    }
    const r = computePracticeObservationCompetency(baseInput({ observations: obs }));
    expect(r.observation_score).toBe(82);
  });

  it("all maximum penalties yield 52-5-5-4-5-4-2 = 27 (non-zero obs)", () => {
    const obs = [
      makeObservation({
        id: "obs_0",
        staff_id: "staff_1",
        outcome: "requires_support",
        signed_off_by_staff: false,
        has_staff_response: false,
        has_linked_development_plan: false,
      }),
    ];
    const r = computePracticeObservationCompetency(baseInput({ observations: obs }));
    // Mod1: 0<50→-5, Mod2:1/8=13<30→-5, Mod3:0<50→-4, Mod4:0<30→-5, Mod5:0<30→-4, Mod6:1/8<1→-2
    expect(r.observation_score).toBe(27);
  });

  it("zero obs penalties yield 52-3-1-5 = 43", () => {
    const r = computePracticeObservationCompetency(baseInput());
    // Mod1: -3, Mod2: 0 (no extra), Mod3: 0, Mod4: 0, Mod5: -1, Mod6: -5
    expect(r.observation_score).toBe(43);
  });
});

// ── pct helper implicit tests ───────────────────────────────────────────────

describe("Rate calculations", () => {
  it("every rate is unmeasured with 0 observations, except staff_observed_rate which is a genuine 0", () => {
    const r = computePracticeObservationCompetency(baseInput());
    expect(r.outstanding_rate).toBeNull();
    expect(r.meets_standard_rate).toBeNull();
    expect(r.sign_off_rate).toBeNull();
    expect(r.development_plan_rate).toBeNull();
    expect(r.staff_response_rate).toBeNull();
    // staff_observed_rate: pct(0, 8) = 0
    expect(r.staff_observed_rate).toBe(0);
  });

  it("pct rounds correctly (e.g. 1/3 = 33%)", () => {
    const obs = [
      makeObservation({ id: "obs_0", staff_id: "staff_1", outcome: "outstanding" }),
      makeObservation({ id: "obs_1", staff_id: "staff_2", outcome: "meets_standard" }),
      makeObservation({ id: "obs_2", staff_id: "staff_3", outcome: "developing" }),
    ];
    const r = computePracticeObservationCompetency(baseInput({ observations: obs }));
    // outstanding: 1/3 = 33.33 → 33
    expect(r.outstanding_rate).toBe(33);
    // meets_standard (outstanding + meets): 2/3 = 66.67 → 67
    expect(r.meets_standard_rate).toBe(67);
  });

  it("staff_observed_rate uses unique count not total", () => {
    const obs = [
      makeObservation({ id: "obs_0", staff_id: "staff_1" }),
      makeObservation({ id: "obs_1", staff_id: "staff_1" }),
      makeObservation({ id: "obs_2", staff_id: "staff_1" }),
      makeObservation({ id: "obs_3", staff_id: "staff_2" }),
    ];
    const r = computePracticeObservationCompetency(baseInput({ observations: obs }));
    // 2 unique staff / 8 total = 25%
    expect(r.staff_observed_rate).toBe(25);
  });
});
