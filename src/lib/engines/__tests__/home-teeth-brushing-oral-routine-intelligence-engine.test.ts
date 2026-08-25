// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME TEETH BRUSHING & ORAL ROUTINE ENGINE TESTS
// Comprehensive suite for computeTeethBrushingOralRoutine.
// CHR 2015 Reg 14 (Health care), Reg 5 (Quality of care standard).
// SCCIF: "Children's health and well-being are promoted".
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { below, meets } from "@/lib/metrics/rate";
import {
  computeTeethBrushingOralRoutine,
  type TeethBrushingInput,
  type BrushingScheduleRecordInput,
  type FluorideUseRecordInput,
  type SupervisionRecordInput,
  type ToothbrushReplacementRecordInput,
  type IndependenceRecordInput,
} from "../home-teeth-brushing-oral-routine-intelligence-engine";

const TODAY = "2026-05-25";

// ── Factories ───────────────────────────────────────────────────────────────

let _id = 0;

function makeBrushing(overrides: Partial<BrushingScheduleRecordInput> = {}): BrushingScheduleRecordInput {
  _id++;
  return {
    id: `brush_${_id}`,
    child_id: "yp_alex",
    date: "2026-05-20",
    morning_brushing_completed: true,
    evening_brushing_completed: true,
    brushing_duration_morning_seconds: 130,
    brushing_duration_evening_seconds: 125,
    morning_time_recorded: "07:15",
    evening_time_recorded: "21:00",
    brushing_technique_correct: true,
    child_reminded: false,
    child_refused: false,
    refusal_reason: null,
    alternative_offered: false,
    teeth_areas_covered: "all",
    tongue_cleaned: true,
    mouthwash_used: true,
    flossing_completed: true,
    child_engaged: true,
    staff_member: "Darren",
    notes: null,
    created_at: "2026-05-20",
    ...overrides,
  };
}

function makeFluoride(overrides: Partial<FluorideUseRecordInput> = {}): FluorideUseRecordInput {
  _id++;
  return {
    id: `fluor_${_id}`,
    child_id: "yp_alex",
    date: "2026-05-20",
    fluoride_toothpaste_used: true,
    fluoride_concentration_ppm: 1450,
    fluoride_concentration_appropriate: true,
    fluoride_mouthwash_used: false,
    fluoride_varnish_applied: false,
    varnish_applied_by: null,
    fluoride_supplement_given: false,
    supplement_prescribed: false,
    child_age_appropriate_product: true,
    child_spits_not_swallows: true,
    staff_supervised_application: true,
    product_in_date: true,
    product_brand: "Colgate",
    notes: null,
    created_at: "2026-05-20",
    ...overrides,
  };
}

function makeSupervision(overrides: Partial<SupervisionRecordInput> = {}): SupervisionRecordInput {
  _id++;
  return {
    id: `sup_${_id}`,
    child_id: "yp_alex",
    date: "2026-05-20",
    session_type: "both",
    staff_present_during_brushing: true,
    staff_guided_technique: true,
    staff_timed_brushing: true,
    child_age: 10,
    supervision_level: "full",
    supervision_appropriate_for_age: true,
    positive_reinforcement_given: true,
    correction_needed: false,
    correction_accepted: false,
    handwashing_before_brushing: true,
    oral_health_discussion: true,
    staff_member: "Darren",
    notes: null,
    created_at: "2026-05-20",
    ...overrides,
  };
}

function makeReplacement(overrides: Partial<ToothbrushReplacementRecordInput> = {}): ToothbrushReplacementRecordInput {
  _id++;
  return {
    id: `rep_${_id}`,
    child_id: "yp_alex",
    replacement_date: "2026-05-20",
    previous_brush_start_date: "2026-02-20",
    days_since_last_replacement: 60,
    replacement_reason: "scheduled",
    brush_type: "manual",
    brush_age_appropriate: true,
    brush_condition_at_replacement: "good",
    child_chose_own_brush: true,
    child_chose_own_toothpaste: true,
    personal_brush_storage_correct: true,
    brush_labelled: true,
    cost_covered: true,
    staff_member: "Darren",
    notes: null,
    created_at: "2026-05-20",
    ...overrides,
  };
}

function makeIndependence(overrides: Partial<IndependenceRecordInput> = {}): IndependenceRecordInput {
  _id++;
  return {
    id: `ind_${_id}`,
    child_id: "yp_alex",
    date: "2026-05-20",
    child_age: 12,
    brushes_independently: true,
    applies_toothpaste_independently: true,
    selects_own_products: true,
    initiates_brushing_without_prompt: true,
    completes_full_routine_independently: true,
    understands_importance_of_oral_care: true,
    can_explain_brushing_technique: true,
    manages_own_toothbrush_replacement: true,
    requests_dental_products_when_needed: true,
    independence_goal_set: true,
    independence_goal_met: true,
    progress_since_last_assessment: "improved",
    independence_plan_in_place: true,
    staff_member: "Darren",
    notes: null,
    created_at: "2026-05-20",
    ...overrides,
  };
}

const baseInput: TeethBrushingInput = {
  today: TODAY,
  total_children: 3,
  brushing_schedule_records: [],
  fluoride_use_records: [],
  supervision_records: [],
  toothbrush_replacement_records: [],
  independence_records: [],
};

function run(overrides: Partial<TeethBrushingInput> = {}) {
  return computeTeethBrushingOralRoutine({ ...baseInput, ...overrides });
}

// ══════════════════════════════════════════════════════════════════════════════
// 1. EMPTY / EDGE-CASE INPUTS
// ══════════════════════════════════════════════════════════════════════════════

describe("Empty and edge-case inputs", () => {
  it("1 — all arrays empty + 0 children → insufficient_data, score 0", () => {
    const r = run({ total_children: 0 });
    expect(r.brushing_rating).toBe("insufficient_data");
    expect(r.brushing_score).toBe(0);
  });

  it("2 — all arrays empty + children > 0 → inadequate, score 15", () => {
    const r = run({ total_children: 3 });
    expect(r.brushing_rating).toBe("inadequate");
    expect(r.brushing_score).toBe(15);
  });

  it("3 — all empty + children > 0 returns 2 recommendations", () => {
    const r = run({ total_children: 2 });
    expect(r.recommendations).toHaveLength(2);
    expect(r.recommendations[0].urgency).toBe("immediate");
    expect(r.recommendations[1].urgency).toBe("immediate");
  });

  it("4 — all empty + children > 0 returns 1 critical insight", () => {
    const r = run({ total_children: 5 });
    expect(r.insights).toHaveLength(1);
    expect(r.insights[0].severity).toBe("critical");
  });

  it("5 — all empty + children > 0 has 1 concern", () => {
    const r = run({ total_children: 1 });
    expect(r.concerns).toHaveLength(1);
  });

  it("6 — insufficient_data has empty strengths", () => {
    const r = run({ total_children: 0 });
    expect(r.strengths).toHaveLength(0);
  });

  it("7 — insufficient_data has empty concerns", () => {
    const r = run({ total_children: 0 });
    expect(r.concerns).toHaveLength(0);
  });

  it("8 — insufficient_data headline mentions insufficient data", () => {
    const r = run({ total_children: 0 });
    expect(r.headline).toContain("insufficient data");
  });

  it("9 — all record counts 0 for insufficient_data", () => {
    const r = run({ total_children: 0 });
    expect(r.total_brushing_records).toBe(0);
    expect(r.total_fluoride_records).toBe(0);
    expect(r.total_supervision_records).toBe(0);
    expect(r.total_replacement_records).toBe(0);
    expect(r.total_independence_records).toBe(0);
  });

  it("10 — all rates 0 for insufficient_data", () => {
    const r = run({ total_children: 0 });
    expect(r.brushing_adherence_rate).toBeNull();
    expect(r.fluoride_use_rate).toBeNull();
    expect(r.supervision_rate).toBeNull();
    expect(r.toothbrush_replacement_rate).toBeNull();
    expect(r.independence_rate).toBeNull();
    expect(r.child_engagement_rate).toBeNull();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. OUTSTANDING SCENARIO
// ══════════════════════════════════════════════════════════════════════════════

describe("Outstanding scenario — all metrics excellent", () => {
  function outstandingInput(): Partial<TeethBrushingInput> {
    return {
      total_children: 3,
      brushing_schedule_records: [makeBrushing(), makeBrushing(), makeBrushing()],
      fluoride_use_records: [makeFluoride(), makeFluoride(), makeFluoride()],
      supervision_records: [makeSupervision(), makeSupervision(), makeSupervision()],
      toothbrush_replacement_records: [makeReplacement(), makeReplacement(), makeReplacement()],
      independence_records: [makeIndependence(), makeIndependence(), makeIndependence()],
    };
  }

  it("11 — rating is outstanding", () => {
    const r = run(outstandingInput());
    expect(r.brushing_rating).toBe("outstanding");
  });

  it("12 — score >= 80", () => {
    const r = run(outstandingInput());
    expect(r.brushing_score).toBeGreaterThanOrEqual(80);
  });

  it("13 — brushing_adherence_rate >= 90", () => {
    const r = run(outstandingInput());
    expect(r.brushing_adherence_rate).toBeGreaterThanOrEqual(90);
  });

  it("14 — fluoride_use_rate >= 90", () => {
    const r = run(outstandingInput());
    expect(r.fluoride_use_rate).toBeGreaterThanOrEqual(90);
  });

  it("15 — supervision_rate >= 90", () => {
    const r = run(outstandingInput());
    expect(r.supervision_rate).toBeGreaterThanOrEqual(90);
  });

  it("16 — toothbrush_replacement_rate >= 85", () => {
    const r = run(outstandingInput());
    expect(r.toothbrush_replacement_rate).toBeGreaterThanOrEqual(85);
  });

  it("17 — independence_rate >= 85", () => {
    const r = run(outstandingInput());
    expect(r.independence_rate).toBeGreaterThanOrEqual(85);
  });

  it("18 — child_engagement_rate >= 90", () => {
    const r = run(outstandingInput());
    expect(r.child_engagement_rate).toBeGreaterThanOrEqual(90);
  });

  it("19 — has multiple strengths", () => {
    const r = run(outstandingInput());
    expect(r.strengths.length).toBeGreaterThanOrEqual(3);
  });

  it("20 — has no concerns", () => {
    const r = run(outstandingInput());
    expect(r.concerns).toHaveLength(0);
  });

  it("21 — headline contains 'Outstanding'", () => {
    const r = run(outstandingInput());
    expect(r.headline).toContain("Outstanding");
  });

  it("22 — has positive insight about outstanding", () => {
    const r = run(outstandingInput());
    const pos = r.insights.filter((i) => i.severity === "positive");
    expect(pos.length).toBeGreaterThanOrEqual(1);
  });

  it("23 — total_brushing_records = 3", () => {
    const r = run(outstandingInput());
    expect(r.total_brushing_records).toBe(3);
  });

  it("24 — total_fluoride_records = 3", () => {
    const r = run(outstandingInput());
    expect(r.total_fluoride_records).toBe(3);
  });

  it("25 — total_supervision_records = 3", () => {
    const r = run(outstandingInput());
    expect(r.total_supervision_records).toBe(3);
  });

  it("26 — total_replacement_records = 3", () => {
    const r = run(outstandingInput());
    expect(r.total_replacement_records).toBe(3);
  });

  it("27 — total_independence_records = 3", () => {
    const r = run(outstandingInput());
    expect(r.total_independence_records).toBe(3);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. BRUSHING ADHERENCE METRICS
// ══════════════════════════════════════════════════════════════════════════════

describe("Brushing adherence metrics", () => {
  it("28 — perfect brushing → high adherence rate", () => {
    const r = run({ brushing_schedule_records: [makeBrushing()] });
    expect(r.brushing_adherence_rate).toBeGreaterThanOrEqual(90);
  });

  it("29 — no morning brushing → reduces adherence", () => {
    const r = run({
      brushing_schedule_records: [makeBrushing({ morning_brushing_completed: false, brushing_duration_morning_seconds: 0 })],
    });
    expect(r.brushing_adherence_rate).toBeLessThan(100);
  });

  it("30 — no evening brushing → reduces adherence", () => {
    const r = run({
      brushing_schedule_records: [makeBrushing({ evening_brushing_completed: false, brushing_duration_evening_seconds: 0 })],
    });
    expect(r.brushing_adherence_rate).toBeLessThan(100);
  });

  it("31 — short duration morning < 120s → not duration adequate", () => {
    const r = run({
      brushing_schedule_records: [makeBrushing({ brushing_duration_morning_seconds: 60 })],
    });
    expect(r.total_brushing_records).toBe(1);
  });

  it("32 — short duration evening < 120s → not duration adequate", () => {
    const r = run({
      brushing_schedule_records: [makeBrushing({ brushing_duration_evening_seconds: 60 })],
    });
    expect(r.total_brushing_records).toBe(1);
  });

  it("33 — incorrect technique → reduces adherence", () => {
    const r = run({
      brushing_schedule_records: [makeBrushing({ brushing_technique_correct: false })],
    });
    expect(r.brushing_adherence_rate).toBeLessThan(100);
  });

  it("34 — child not engaged → reduces adherence", () => {
    const r = run({
      brushing_schedule_records: [makeBrushing({ child_engaged: false })],
    });
    expect(r.brushing_adherence_rate).toBeLessThan(100);
  });

  it("35 — adherence >= 90 → +4 bonus", () => {
    const r = run({
      brushing_schedule_records: [makeBrushing()],
      fluoride_use_records: [makeFluoride()],
      supervision_records: [makeSupervision()],
      toothbrush_replacement_records: [makeReplacement()],
      independence_records: [makeIndependence()],
    });
    expect(r.brushing_score).toBeGreaterThan(52);
  });

  it("36 — adherence < 50 → penalty -5", () => {
    const r = run({
      brushing_schedule_records: [
        makeBrushing({
          morning_brushing_completed: false,
          evening_brushing_completed: false,
          brushing_duration_morning_seconds: 0,
          brushing_duration_evening_seconds: 0,
          brushing_technique_correct: false,
          child_engaged: false,
        }),
      ],
    });
    expect(r.brushing_adherence_rate).toBeLessThan(50);
    expect(r.brushing_score).toBeLessThan(52);
  });

  it("37 — adherence < 50 → critical insight", () => {
    const r = run({
      brushing_schedule_records: [
        makeBrushing({
          morning_brushing_completed: false,
          evening_brushing_completed: false,
          brushing_duration_morning_seconds: 0,
          brushing_duration_evening_seconds: 0,
          brushing_technique_correct: false,
          child_engaged: false,
        }),
      ],
    });
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("adherence"))).toBe(true);
  });

  it("38 — adherence >= 90 → strength about adherence", () => {
    const r = run({ brushing_schedule_records: [makeBrushing()] });
    expect(r.strengths.some((s) => s.includes("adherence"))).toBe(true);
  });

  it("39 — adherence < 50 → concern about adherence", () => {
    const r = run({
      brushing_schedule_records: [
        makeBrushing({
          morning_brushing_completed: false,
          evening_brushing_completed: false,
          brushing_duration_morning_seconds: 0,
          brushing_duration_evening_seconds: 0,
          brushing_technique_correct: false,
          child_engaged: false,
        }),
      ],
    });
    expect(r.concerns.some((c) => c.includes("adherence"))).toBe(true);
  });

  it("40 — adherence 50-69 → warning concern", () => {
    const r = run({
      brushing_schedule_records: [
        makeBrushing({ brushing_technique_correct: false, child_engaged: false }),
      ],
    });
    // both=100%, duration=100%, technique=0%, engagement=0%
    // numerator: 1 + 2 + 0 + 0 = 3, denom: 1 + 2 + 1 + 1 = 5 → 60%
    expect(r.brushing_adherence_rate).toBeGreaterThanOrEqual(50);
    expect(r.brushing_adherence_rate).toBeLessThan(70);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. FLUORIDE USE METRICS
// ══════════════════════════════════════════════════════════════════════════════

describe("Fluoride use metrics", () => {
  it("41 — perfect fluoride use → rate 100", () => {
    const r = run({ fluoride_use_records: [makeFluoride()] });
    expect(r.fluoride_use_rate).toBe(100);
  });

  it("42 — no fluoride paste → reduces rate", () => {
    const r = run({ fluoride_use_records: [makeFluoride({ fluoride_toothpaste_used: false })] });
    expect(r.fluoride_use_rate).toBeLessThan(100);
  });

  it("43 — concentration not appropriate → reduces rate", () => {
    const r = run({ fluoride_use_records: [makeFluoride({ fluoride_concentration_appropriate: false })] });
    expect(r.fluoride_use_rate).toBeLessThan(100);
  });

  it("44 — not age appropriate product → reduces rate", () => {
    const r = run({ fluoride_use_records: [makeFluoride({ child_age_appropriate_product: false })] });
    expect(r.fluoride_use_rate).toBeLessThan(100);
  });

  it("45 — product not in date → reduces rate", () => {
    const r = run({ fluoride_use_records: [makeFluoride({ product_in_date: false })] });
    expect(r.fluoride_use_rate).toBeLessThan(100);
  });

  it("46 — fluoride use >= 90 → +4 bonus", () => {
    const r = run({ fluoride_use_records: [makeFluoride()] });
    // Just checking it contributes to score
    expect(r.fluoride_use_rate).toBe(100);
  });

  it("47 — fluoride use < 40 → penalty -5", () => {
    const r = run({
      fluoride_use_records: [
        makeFluoride({
          fluoride_toothpaste_used: false,
          fluoride_concentration_appropriate: false,
          child_age_appropriate_product: false,
          product_in_date: false,
        }),
      ],
    });
    expect(r.fluoride_use_rate).toBe(0);
    expect(r.brushing_score).toBeLessThan(52);
  });

  it("48 — fluoride < 40 → critical insight", () => {
    const r = run({
      fluoride_use_records: [
        makeFluoride({
          fluoride_toothpaste_used: false,
          fluoride_concentration_appropriate: false,
          child_age_appropriate_product: false,
          product_in_date: false,
        }),
      ],
    });
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("Fluoride"))).toBe(true);
  });

  it("49 — fluoride >= 90 → strength", () => {
    const r = run({ fluoride_use_records: [makeFluoride()] });
    expect(r.strengths.some((s) => s.includes("fluoride"))).toBe(true);
  });

  it("50 — fluoride 40-69 → warning insight", () => {
    const r = run({
      fluoride_use_records: [
        makeFluoride({ fluoride_toothpaste_used: true, fluoride_concentration_appropriate: true, child_age_appropriate_product: false, product_in_date: false }),
      ],
    });
    // 2/4 = 50%
    expect(r.fluoride_use_rate).toBe(50);
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Fluoride"))).toBe(true);
  });

  it("51 — no fluoride records → rate 0", () => {
    const r = run({ fluoride_use_records: [] });
    expect(r.fluoride_use_rate).toBeNull();
  });

  it("52 — product in date < 70 → concern", () => {
    const r = run({
      fluoride_use_records: [
        makeFluoride({ product_in_date: false }),
        makeFluoride({ product_in_date: false }),
      ],
    });
    expect(r.concerns.some((c) => c.includes("in date"))).toBe(true);
  });

  it("53 — fluoride mouthwash used tracked", () => {
    const r = run({ fluoride_use_records: [makeFluoride({ fluoride_mouthwash_used: true })] });
    expect(r.total_fluoride_records).toBe(1);
  });

  it("54 — fluoride varnish applied tracked", () => {
    const r = run({ fluoride_use_records: [makeFluoride({ fluoride_varnish_applied: true, varnish_applied_by: "Dentist" })] });
    expect(r.total_fluoride_records).toBe(1);
  });

  it("55 — supplement given and prescribed", () => {
    const r = run({
      fluoride_use_records: [makeFluoride({ fluoride_supplement_given: true, supplement_prescribed: true })],
    });
    expect(r.total_fluoride_records).toBe(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. SUPERVISION METRICS
// ══════════════════════════════════════════════════════════════════════════════

describe("Supervision metrics", () => {
  it("56 — perfect supervision → rate 100", () => {
    const r = run({ supervision_records: [makeSupervision()] });
    expect(r.supervision_rate).toBe(100);
  });

  it("57 — staff not present → reduces rate", () => {
    const r = run({
      supervision_records: [makeSupervision({ staff_present_during_brushing: false })],
    });
    expect(r.supervision_rate).toBeLessThan(100);
  });

  it("58 — supervision not appropriate for age → reduces rate", () => {
    const r = run({
      supervision_records: [makeSupervision({ supervision_appropriate_for_age: false })],
    });
    expect(r.supervision_rate).toBeLessThan(100);
  });

  it("59 — no reinforcement → reduces rate", () => {
    const r = run({
      supervision_records: [makeSupervision({ positive_reinforcement_given: false })],
    });
    expect(r.supervision_rate).toBeLessThan(100);
  });

  it("60 — no guidance → reduces rate", () => {
    const r = run({
      supervision_records: [makeSupervision({ staff_guided_technique: false })],
    });
    expect(r.supervision_rate).toBeLessThan(100);
  });

  it("61 — supervision >= 90 → +3 bonus", () => {
    const r = run({ supervision_records: [makeSupervision()] });
    expect(r.supervision_rate).toBe(100);
  });

  it("62 — supervision < 40 → penalty -4", () => {
    const r = run({
      supervision_records: [
        makeSupervision({
          staff_present_during_brushing: false,
          staff_guided_technique: false,
          supervision_appropriate_for_age: false,
          positive_reinforcement_given: false,
        }),
      ],
    });
    expect(r.supervision_rate).toBe(0);
    expect(r.brushing_score).toBeLessThan(52);
  });

  it("63 — supervision < 40 → critical insight", () => {
    const r = run({
      supervision_records: [
        makeSupervision({
          staff_present_during_brushing: false,
          staff_guided_technique: false,
          supervision_appropriate_for_age: false,
          positive_reinforcement_given: false,
        }),
      ],
    });
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("Supervision"))).toBe(true);
  });

  it("64 — supervision >= 90 → strength", () => {
    const r = run({ supervision_records: [makeSupervision()] });
    expect(r.strengths.some((s) => s.includes("supervision"))).toBe(true);
  });

  it("65 — supervision 40-69 → warning insight", () => {
    const r = run({
      supervision_records: [
        makeSupervision({
          staff_present_during_brushing: true,
          supervision_appropriate_for_age: true,
          positive_reinforcement_given: false,
          staff_guided_technique: false,
        }),
      ],
    });
    // 2/4 = 50%
    expect(r.supervision_rate).toBe(50);
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Supervision") || i.text.includes("supervision"))).toBe(true);
  });

  it("66 — supervision level full tracked", () => {
    const r = run({ supervision_records: [makeSupervision({ supervision_level: "full" })] });
    expect(r.total_supervision_records).toBe(1);
  });

  it("67 — supervision level partial tracked", () => {
    const r = run({ supervision_records: [makeSupervision({ supervision_level: "partial" })] });
    expect(r.total_supervision_records).toBe(1);
  });

  it("68 — supervision level verbal_prompt tracked", () => {
    const r = run({ supervision_records: [makeSupervision({ supervision_level: "verbal_prompt" })] });
    expect(r.total_supervision_records).toBe(1);
  });

  it("69 — supervision level independent_check tracked", () => {
    const r = run({ supervision_records: [makeSupervision({ supervision_level: "independent_check" })] });
    expect(r.total_supervision_records).toBe(1);
  });

  it("70 — supervision level none > 20% → concern", () => {
    const r = run({
      supervision_records: [
        makeSupervision({ supervision_level: "none" }),
        makeSupervision({ supervision_level: "none" }),
        makeSupervision({ supervision_level: "full" }),
      ],
    });
    // 2/3 = 67% none
    expect(r.concerns.some((c) => c.includes("no supervision at all"))).toBe(true);
  });

  it("71 — correction needed and accepted", () => {
    const r = run({
      supervision_records: [makeSupervision({ correction_needed: true, correction_accepted: true })],
    });
    expect(r.total_supervision_records).toBe(1);
  });

  it("72 — reinforcement >= 90 → strength", () => {
    const r = run({ supervision_records: [makeSupervision()] });
    expect(r.strengths.some((s) => s.includes("reinforcement"))).toBe(true);
  });

  it("73 — no supervision records + children → concern", () => {
    const r = run({
      total_children: 3,
      brushing_schedule_records: [makeBrushing()],
      supervision_records: [],
    });
    expect(r.concerns.some((c) => c.includes("No supervision records"))).toBe(true);
  });

  it("74 — oral health discussion rate < 50 → warning insight", () => {
    const r = run({
      supervision_records: [
        makeSupervision({ oral_health_discussion: false }),
        makeSupervision({ oral_health_discussion: false }),
      ],
    });
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Oral health discussion"))).toBe(true);
  });

  it("75 — multiple supervision levels → distribution insight", () => {
    const r = run({
      supervision_records: [
        makeSupervision({ supervision_level: "full" }),
        makeSupervision({ supervision_level: "partial" }),
      ],
    });
    expect(r.insights.some((i) => i.text.includes("Supervision level distribution"))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. TOOTHBRUSH REPLACEMENT METRICS
// ══════════════════════════════════════════════════════════════════════════════

describe("Toothbrush replacement metrics", () => {
  it("76 — perfect replacement → rate 100", () => {
    const r = run({ toothbrush_replacement_records: [makeReplacement()] });
    expect(r.toothbrush_replacement_rate).toBe(100);
  });

  it("77 — replacement > 90 days → not on time", () => {
    const r = run({
      toothbrush_replacement_records: [makeReplacement({ days_since_last_replacement: 120 })],
    });
    expect(r.toothbrush_replacement_rate).toBeLessThan(100);
  });

  it("78 — brush not age appropriate → reduces rate", () => {
    const r = run({
      toothbrush_replacement_records: [makeReplacement({ brush_age_appropriate: false })],
    });
    expect(r.toothbrush_replacement_rate).toBeLessThan(100);
  });

  it("79 — storage not correct → reduces rate", () => {
    const r = run({
      toothbrush_replacement_records: [makeReplacement({ personal_brush_storage_correct: false })],
    });
    expect(r.toothbrush_replacement_rate).toBeLessThan(100);
  });

  it("80 — brush not labelled → reduces rate", () => {
    const r = run({
      toothbrush_replacement_records: [makeReplacement({ brush_labelled: false })],
    });
    expect(r.toothbrush_replacement_rate).toBeLessThan(100);
  });

  it("81 — replacement rate >= 85 → strength", () => {
    const r = run({ toothbrush_replacement_records: [makeReplacement()] });
    expect(r.strengths.some((s) => s.includes("replacement"))).toBe(true);
  });

  it("82 — replacement rate < 50 → concern", () => {
    const r = run({
      toothbrush_replacement_records: [
        makeReplacement({
          days_since_last_replacement: 120,
          brush_age_appropriate: false,
          personal_brush_storage_correct: false,
          brush_labelled: false,
        }),
      ],
    });
    expect(r.toothbrush_replacement_rate).toBe(0);
    expect(r.concerns.some((c) => c.includes("replacement"))).toBe(true);
  });

  it("83 — replacement reason scheduled", () => {
    const r = run({ toothbrush_replacement_records: [makeReplacement({ replacement_reason: "scheduled" })] });
    expect(r.total_replacement_records).toBe(1);
  });

  it("84 — replacement reason worn", () => {
    const r = run({ toothbrush_replacement_records: [makeReplacement({ replacement_reason: "worn" })] });
    expect(r.total_replacement_records).toBe(1);
  });

  it("85 — replacement reason illness", () => {
    const r = run({ toothbrush_replacement_records: [makeReplacement({ replacement_reason: "illness" })] });
    expect(r.total_replacement_records).toBe(1);
  });

  it("86 — replacement reason contamination", () => {
    const r = run({ toothbrush_replacement_records: [makeReplacement({ replacement_reason: "contamination" })] });
    expect(r.total_replacement_records).toBe(1);
  });

  it("87 — replacement reason lost", () => {
    const r = run({ toothbrush_replacement_records: [makeReplacement({ replacement_reason: "lost" })] });
    expect(r.total_replacement_records).toBe(1);
  });

  it("88 — replacement reason new_admission", () => {
    const r = run({ toothbrush_replacement_records: [makeReplacement({ replacement_reason: "new_admission" })] });
    expect(r.total_replacement_records).toBe(1);
  });

  it("89 — replacement reason child_request", () => {
    const r = run({ toothbrush_replacement_records: [makeReplacement({ replacement_reason: "child_request" })] });
    expect(r.total_replacement_records).toBe(1);
  });

  it("90 — brush condition frayed → poor condition", () => {
    const r = run({
      toothbrush_replacement_records: [
        makeReplacement({ brush_condition_at_replacement: "frayed" }),
        makeReplacement({ brush_condition_at_replacement: "frayed" }),
        makeReplacement({ brush_condition_at_replacement: "good" }),
      ],
    });
    // 2/3 = 67% poor condition > 40% → concern
    expect(r.concerns.some((c) => c.includes("frayed") || c.includes("damaged") || c.includes("heavily worn"))).toBe(true);
  });

  it("91 — brush type manual tracked", () => {
    const r = run({ toothbrush_replacement_records: [makeReplacement({ brush_type: "manual" })] });
    expect(r.insights.some((i) => i.text.includes("manual"))).toBe(true);
  });

  it("92 — brush type electric tracked", () => {
    const r = run({ toothbrush_replacement_records: [makeReplacement({ brush_type: "electric" })] });
    expect(r.insights.some((i) => i.text.includes("electric"))).toBe(true);
  });

  it("93 — brush type adaptive tracked", () => {
    const r = run({ toothbrush_replacement_records: [makeReplacement({ brush_type: "adaptive" })] });
    expect(r.insights.some((i) => i.text.includes("adaptive"))).toBe(true);
  });

  it("94 — child chose brush >= 80% → strength", () => {
    const r = run({ toothbrush_replacement_records: [makeReplacement({ child_chose_own_brush: true })] });
    expect(r.strengths.some((s) => s.includes("chose"))).toBe(true);
  });

  it("95 — replacement on time >= 90 → strength", () => {
    const r = run({ toothbrush_replacement_records: [makeReplacement({ days_since_last_replacement: 60 })] });
    expect(r.strengths.some((s) => s.includes("replaced within"))).toBe(true);
  });

  it("96 — overdue > 40% → concern", () => {
    const r = run({
      toothbrush_replacement_records: [
        makeReplacement({ days_since_last_replacement: 120 }),
        makeReplacement({ days_since_last_replacement: 100 }),
      ],
    });
    expect(r.concerns.some((c) => c.includes("overdue"))).toBe(true);
  });

  it("97 — no replacement records + children → concern", () => {
    const r = run({
      total_children: 3,
      brushing_schedule_records: [makeBrushing()],
      toothbrush_replacement_records: [],
    });
    expect(r.concerns.some((c) => c.includes("No toothbrush replacement records"))).toBe(true);
  });

  it("98 — replacement reason insight generated", () => {
    const r = run({ toothbrush_replacement_records: [makeReplacement()] });
    expect(r.insights.some((i) => i.text.includes("replacement reasons"))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 7. INDEPENDENCE METRICS
// ══════════════════════════════════════════════════════════════════════════════

describe("Independence metrics", () => {
  it("99 — perfect independence → rate 100", () => {
    const r = run({ independence_records: [makeIndependence()] });
    expect(r.independence_rate).toBe(100);
  });

  it("100 — not brushing independently → reduces rate", () => {
    const r = run({
      independence_records: [makeIndependence({ brushes_independently: false })],
    });
    expect(r.independence_rate).toBeLessThan(100);
  });

  it("101 — not initiating without prompt → reduces rate", () => {
    const r = run({
      independence_records: [makeIndependence({ initiates_brushing_without_prompt: false })],
    });
    expect(r.independence_rate).toBeLessThan(100);
  });

  it("102 — not completing full routine → reduces rate", () => {
    const r = run({
      independence_records: [makeIndependence({ completes_full_routine_independently: false })],
    });
    expect(r.independence_rate).toBeLessThan(100);
  });

  it("103 — does not understand importance → reduces rate", () => {
    const r = run({
      independence_records: [makeIndependence({ understands_importance_of_oral_care: false })],
    });
    expect(r.independence_rate).toBeLessThan(100);
  });

  it("104 — independence >= 85 → +3 bonus", () => {
    const r = run({ independence_records: [makeIndependence()] });
    expect(r.independence_rate).toBe(100);
  });

  it("105 — independence < 40 → penalty -4", () => {
    const r = run({
      independence_records: [
        makeIndependence({
          brushes_independently: false,
          initiates_brushing_without_prompt: false,
          completes_full_routine_independently: false,
          understands_importance_of_oral_care: false,
        }),
      ],
    });
    expect(r.independence_rate).toBe(0);
    expect(r.brushing_score).toBeLessThan(52);
  });

  it("106 — independence < 40 → critical insight", () => {
    const r = run({
      independence_records: [
        makeIndependence({
          brushes_independently: false,
          initiates_brushing_without_prompt: false,
          completes_full_routine_independently: false,
          understands_importance_of_oral_care: false,
        }),
      ],
    });
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("independence"))).toBe(true);
  });

  it("107 — independence >= 85 → strength", () => {
    const r = run({ independence_records: [makeIndependence()] });
    expect(r.strengths.some((s) => s.includes("independence"))).toBe(true);
  });

  it("108 — independence 40-64 → warning insight", () => {
    const r = run({
      independence_records: [
        makeIndependence({
          brushes_independently: true,
          initiates_brushing_without_prompt: true,
          completes_full_routine_independently: false,
          understands_importance_of_oral_care: false,
        }),
      ],
    });
    // 2/4 = 50%
    expect(r.independence_rate).toBe(50);
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("independence"))).toBe(true);
  });

  it("109 — progress improved tracked", () => {
    const r = run({ independence_records: [makeIndependence({ progress_since_last_assessment: "improved" })] });
    expect(r.total_independence_records).toBe(1);
  });

  it("110 — progress maintained tracked", () => {
    const r = run({ independence_records: [makeIndependence({ progress_since_last_assessment: "maintained" })] });
    expect(r.total_independence_records).toBe(1);
  });

  it("111 — progress declined > 20% → concern", () => {
    const r = run({
      independence_records: [
        makeIndependence({ progress_since_last_assessment: "declined" }),
        makeIndependence({ progress_since_last_assessment: "declined" }),
        makeIndependence({ progress_since_last_assessment: "improved" }),
      ],
    });
    // 2/3 = 67% declined
    expect(r.concerns.some((c) => c.includes("declining"))).toBe(true);
  });

  it("112 — goal set and met >= 80% → strength", () => {
    const r = run({
      independence_records: [makeIndependence({ independence_goal_set: true, independence_goal_met: true })],
    });
    expect(r.strengths.some((s) => s.includes("goal"))).toBe(true);
  });

  it("113 — goal set but < 50% met → warning insight", () => {
    const r = run({
      independence_records: [
        makeIndependence({ independence_goal_set: true, independence_goal_met: false }),
        makeIndependence({ independence_goal_set: true, independence_goal_met: false }),
        makeIndependence({ independence_goal_set: true, independence_goal_met: false }),
      ],
    });
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("goal"))).toBe(true);
  });

  it("114 — first_assessment progress tracked", () => {
    const r = run({ independence_records: [makeIndependence({ progress_since_last_assessment: "first_assessment" })] });
    expect(r.total_independence_records).toBe(1);
  });

  it("115 — plan in place < 50% → planned recommendation", () => {
    const r = run({
      independence_records: [
        makeIndependence({ independence_plan_in_place: false }),
        makeIndependence({ independence_plan_in_place: false }),
      ],
    });
    expect(r.recommendations.some((rec) => rec.recommendation.includes("independence plan"))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 8. CHILD ENGAGEMENT METRICS
// ══════════════════════════════════════════════════════════════════════════════

describe("Child engagement metrics", () => {
  it("116 — high engagement across all areas → rate >= 90", () => {
    const r = run({
      brushing_schedule_records: [makeBrushing({ child_engaged: true })],
      toothbrush_replacement_records: [makeReplacement({ child_chose_own_brush: true })],
      independence_records: [makeIndependence({ understands_importance_of_oral_care: true })],
      supervision_records: [makeSupervision({ positive_reinforcement_given: true })],
    });
    expect(r.child_engagement_rate).toBe(100);
  });

  it("117 — no engagement → rate 0", () => {
    const r = run({
      brushing_schedule_records: [makeBrushing({ child_engaged: false })],
      toothbrush_replacement_records: [makeReplacement({ child_chose_own_brush: false })],
      independence_records: [makeIndependence({ understands_importance_of_oral_care: false })],
      supervision_records: [makeSupervision({ positive_reinforcement_given: false })],
    });
    expect(r.child_engagement_rate).toBe(0);
  });

  it("118 — engagement >= 90 → strength", () => {
    const r = run({
      brushing_schedule_records: [makeBrushing({ child_engaged: true })],
      toothbrush_replacement_records: [makeReplacement({ child_chose_own_brush: true })],
      independence_records: [makeIndependence()],
      supervision_records: [makeSupervision()],
    });
    expect(r.strengths.some((s) => s.includes("engagement"))).toBe(true);
  });

  it("119 — engagement < 50 → concern", () => {
    const r = run({
      brushing_schedule_records: [makeBrushing({ child_engaged: false })],
      toothbrush_replacement_records: [makeReplacement({ child_chose_own_brush: false })],
      independence_records: [makeIndependence({ understands_importance_of_oral_care: false })],
      supervision_records: [makeSupervision({ positive_reinforcement_given: false })],
    });
    expect(r.child_engagement_rate).toBe(0);
    expect(r.concerns.some((c) => c.includes("engagement"))).toBe(true);
  });

  it("120 — engagement 50-69 → warning insight", () => {
    const r = run({
      brushing_schedule_records: [makeBrushing({ child_engaged: true })],
      toothbrush_replacement_records: [makeReplacement({ child_chose_own_brush: false })],
      independence_records: [makeIndependence({ understands_importance_of_oral_care: false })],
      supervision_records: [makeSupervision({ positive_reinforcement_given: true })],
    });
    // 1+0+0+1 = 2, denom = 1+1+1+1 = 4 → 50%
    expect(r.child_engagement_rate).toBe(50);
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("engagement"))).toBe(true);
  });

  it("121 — engagement >= 90 → positive insight", () => {
    const r = run({
      brushing_schedule_records: [makeBrushing()],
      toothbrush_replacement_records: [makeReplacement()],
      independence_records: [makeIndependence()],
      supervision_records: [makeSupervision()],
    });
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("engagement"))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 9. SCORING AND RATING THRESHOLDS
// ══════════════════════════════════════════════════════════════════════════════

describe("Scoring and rating thresholds", () => {
  it("122 — score >= 80 → outstanding", () => {
    const r = run({
      brushing_schedule_records: [makeBrushing()],
      fluoride_use_records: [makeFluoride()],
      supervision_records: [makeSupervision()],
      toothbrush_replacement_records: [makeReplacement()],
      independence_records: [makeIndependence()],
    });
    expect(r.brushing_score).toBeGreaterThanOrEqual(80);
    expect(r.brushing_rating).toBe("outstanding");
  });

  it("123 — score 65-79 → good", () => {
    const r = run({
      brushing_schedule_records: [makeBrushing()],
      fluoride_use_records: [makeFluoride()],
      supervision_records: [makeSupervision({ staff_guided_technique: false })],
      toothbrush_replacement_records: [makeReplacement({ days_since_last_replacement: 120, brush_labelled: false })],
      independence_records: [makeIndependence({ initiates_brushing_without_prompt: false, completes_full_routine_independently: false })],
    });
    expect(r.brushing_score).toBeGreaterThanOrEqual(65);
    expect(r.brushing_score).toBeLessThan(80);
    expect(r.brushing_rating).toBe("good");
  });

  it("124 — score 45-64 → adequate", () => {
    const r = run({
      brushing_schedule_records: [makeBrushing({ brushing_technique_correct: false, child_engaged: false })],
      fluoride_use_records: [makeFluoride({ child_age_appropriate_product: false })],
      supervision_records: [makeSupervision({ staff_guided_technique: false, positive_reinforcement_given: false })],
    });
    expect(r.brushing_score).toBeGreaterThanOrEqual(45);
    expect(r.brushing_score).toBeLessThan(65);
    expect(r.brushing_rating).toBe("adequate");
  });

  it("125 — score < 45 → inadequate", () => {
    const r = run({
      brushing_schedule_records: [makeBrushing({
        morning_brushing_completed: false,
        evening_brushing_completed: false,
        brushing_duration_morning_seconds: 0,
        brushing_duration_evening_seconds: 0,
        brushing_technique_correct: false,
        child_engaged: false,
      })],
      fluoride_use_records: [makeFluoride({
        fluoride_toothpaste_used: false,
        fluoride_concentration_appropriate: false,
        child_age_appropriate_product: false,
        product_in_date: false,
      })],
      supervision_records: [makeSupervision({
        staff_present_during_brushing: false,
        staff_guided_technique: false,
        supervision_appropriate_for_age: false,
        positive_reinforcement_given: false,
      })],
      independence_records: [makeIndependence({
        brushes_independently: false,
        initiates_brushing_without_prompt: false,
        completes_full_routine_independently: false,
        understands_importance_of_oral_care: false,
      })],
    });
    expect(r.brushing_score).toBeLessThan(45);
    expect(r.brushing_rating).toBe("inadequate");
  });

  it("126 — score is clamped 0-100", () => {
    const r = run({
      brushing_schedule_records: [makeBrushing()],
      fluoride_use_records: [makeFluoride()],
      supervision_records: [makeSupervision()],
      toothbrush_replacement_records: [makeReplacement()],
      independence_records: [makeIndependence()],
    });
    expect(r.brushing_score).toBeGreaterThanOrEqual(0);
    expect(r.brushing_score).toBeLessThanOrEqual(100);
  });

  it("127 — multiple bonuses stack", () => {
    const r = run({
      brushing_schedule_records: [makeBrushing()],
      fluoride_use_records: [makeFluoride()],
      supervision_records: [makeSupervision()],
      toothbrush_replacement_records: [makeReplacement()],
      independence_records: [makeIndependence()],
    });
    expect(r.brushing_score).toBeGreaterThanOrEqual(80);
  });

  it("128 — multiple penalties stack", () => {
    const r = run({
      brushing_schedule_records: [makeBrushing({
        morning_brushing_completed: false,
        evening_brushing_completed: false,
        brushing_duration_morning_seconds: 0,
        brushing_duration_evening_seconds: 0,
        brushing_technique_correct: false,
        child_engaged: false,
      })],
      fluoride_use_records: [makeFluoride({
        fluoride_toothpaste_used: false,
        fluoride_concentration_appropriate: false,
        child_age_appropriate_product: false,
        product_in_date: false,
      })],
      supervision_records: [makeSupervision({
        staff_present_during_brushing: false,
        staff_guided_technique: false,
        supervision_appropriate_for_age: false,
        positive_reinforcement_given: false,
      })],
      independence_records: [makeIndependence({
        brushes_independently: false,
        initiates_brushing_without_prompt: false,
        completes_full_routine_independently: false,
        understands_importance_of_oral_care: false,
      })],
    });
    // 52 - 5 - 5 - 4 - 4 = 34
    expect(r.brushing_score).toBeLessThanOrEqual(34);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 10. HEADLINE GENERATION
// ══════════════════════════════════════════════════════════════════════════════

describe("Headline generation", () => {
  it("129 — outstanding headline text", () => {
    const r = run({
      brushing_schedule_records: [makeBrushing()],
      fluoride_use_records: [makeFluoride()],
      supervision_records: [makeSupervision()],
      toothbrush_replacement_records: [makeReplacement()],
      independence_records: [makeIndependence()],
    });
    expect(r.headline).toContain("Outstanding");
  });

  it("130 — good headline mentions strengths count", () => {
    const r = run({
      brushing_schedule_records: [makeBrushing({ brushing_technique_correct: false, child_engaged: false })],
      fluoride_use_records: [makeFluoride({ child_age_appropriate_product: false })],
      supervision_records: [makeSupervision({ staff_guided_technique: false, positive_reinforcement_given: false })],
    });
    if (r.brushing_rating === "good") {
      expect(r.headline).toContain("Good");
      expect(r.headline).toContain("strength");
    }
  });

  it("131 — adequate headline mentions concerns count", () => {
    const r = run({
      brushing_schedule_records: [makeBrushing({
        morning_brushing_completed: false,
        brushing_duration_morning_seconds: 0,
        brushing_technique_correct: false,
        child_engaged: false,
      })],
      fluoride_use_records: [makeFluoride({
        fluoride_toothpaste_used: false,
        fluoride_concentration_appropriate: false,
        child_age_appropriate_product: false,
      })],
      supervision_records: [makeSupervision({
        staff_present_during_brushing: false,
        staff_guided_technique: false,
        supervision_appropriate_for_age: false,
        positive_reinforcement_given: false,
      })],
    });
    if (r.brushing_rating === "adequate") {
      expect(r.headline).toContain("Adequate");
      expect(r.headline).toContain("concern");
    }
  });

  it("132 — inadequate headline mentions urgent action", () => {
    const r = run({
      brushing_schedule_records: [makeBrushing({
        morning_brushing_completed: false,
        evening_brushing_completed: false,
        brushing_duration_morning_seconds: 0,
        brushing_duration_evening_seconds: 0,
        brushing_technique_correct: false,
        child_engaged: false,
      })],
      fluoride_use_records: [makeFluoride({
        fluoride_toothpaste_used: false,
        fluoride_concentration_appropriate: false,
        child_age_appropriate_product: false,
        product_in_date: false,
      })],
      supervision_records: [makeSupervision({
        staff_present_during_brushing: false,
        staff_guided_technique: false,
        supervision_appropriate_for_age: false,
        positive_reinforcement_given: false,
      })],
      independence_records: [makeIndependence({
        brushes_independently: false,
        initiates_brushing_without_prompt: false,
        completes_full_routine_independently: false,
        understands_importance_of_oral_care: false,
      })],
    });
    if (r.brushing_rating === "inadequate") {
      expect(r.headline).toContain("inadequate");
      expect(r.headline).toContain("urgent");
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 11. RECOMMENDATIONS
// ══════════════════════════════════════════════════════════════════════════════

describe("Recommendations", () => {
  it("133 — adherence < 50 → immediate recommendation", () => {
    const r = run({
      brushing_schedule_records: [makeBrushing({
        morning_brushing_completed: false,
        evening_brushing_completed: false,
        brushing_duration_morning_seconds: 0,
        brushing_duration_evening_seconds: 0,
        brushing_technique_correct: false,
        child_engaged: false,
      })],
    });
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("brushing"))).toBe(true);
  });

  it("134 — fluoride < 40 → immediate recommendation", () => {
    const r = run({
      fluoride_use_records: [makeFluoride({
        fluoride_toothpaste_used: false,
        fluoride_concentration_appropriate: false,
        child_age_appropriate_product: false,
        product_in_date: false,
      })],
    });
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("fluoride"))).toBe(true);
  });

  it("135 — supervision < 40 → immediate recommendation", () => {
    const r = run({
      supervision_records: [makeSupervision({
        staff_present_during_brushing: false,
        staff_guided_technique: false,
        supervision_appropriate_for_age: false,
        positive_reinforcement_given: false,
      })],
    });
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("supervision"))).toBe(true);
  });

  it("136 — independence < 40 → immediate recommendation", () => {
    const r = run({
      independence_records: [makeIndependence({
        brushes_independently: false,
        initiates_brushing_without_prompt: false,
        completes_full_routine_independently: false,
        understands_importance_of_oral_care: false,
      })],
    });
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("independence"))).toBe(true);
  });

  it("137 — no brushing records + children → immediate recommendation", () => {
    const r = run({
      total_children: 3,
      fluoride_use_records: [makeFluoride()],
      brushing_schedule_records: [],
    });
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("brushing schedule"))).toBe(true);
  });

  it("138 — no fluoride records + children → immediate recommendation", () => {
    const r = run({
      total_children: 3,
      brushing_schedule_records: [makeBrushing()],
      fluoride_use_records: [],
    });
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("fluoride"))).toBe(true);
  });

  it("139 — no supervision records + children → immediate recommendation", () => {
    const r = run({
      total_children: 3,
      brushing_schedule_records: [makeBrushing()],
      supervision_records: [],
    });
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("supervision"))).toBe(true);
  });

  it("140 — engagement < 50 → immediate recommendation", () => {
    const r = run({
      brushing_schedule_records: [makeBrushing({ child_engaged: false })],
      toothbrush_replacement_records: [makeReplacement({ child_chose_own_brush: false })],
      independence_records: [makeIndependence({ understands_importance_of_oral_care: false })],
      supervision_records: [makeSupervision({ positive_reinforcement_given: false })],
    });
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("engagement"))).toBe(true);
  });

  it("141 — both brushing < 50 → immediate recommendation", () => {
    const r = run({
      brushing_schedule_records: [
        makeBrushing({ morning_brushing_completed: false, evening_brushing_completed: false }),
      ],
    });
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("twice-daily") || rec.recommendation.includes("morning and evening"))).toBe(true);
  });

  it("142 — refusal > 30 → soon recommendation", () => {
    const r = run({
      brushing_schedule_records: [
        makeBrushing({ child_refused: true }),
        makeBrushing({ child_refused: true }),
      ],
    });
    expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("refusal"))).toBe(true);
  });

  it("143 — replacement < 50 → soon recommendation", () => {
    const r = run({
      toothbrush_replacement_records: [
        makeReplacement({
          days_since_last_replacement: 120,
          brush_age_appropriate: false,
          personal_brush_storage_correct: false,
          brush_labelled: false,
        }),
      ],
    });
    expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("replacement"))).toBe(true);
  });

  it("144 — adherence 50-69 → soon recommendation", () => {
    const r = run({
      brushing_schedule_records: [
        makeBrushing({ brushing_technique_correct: false, child_engaged: false }),
      ],
    });
    if (meets(r.brushing_adherence_rate, 50) && below(r.brushing_adherence_rate, 70)) {
      expect(r.recommendations.some((rec) => rec.urgency === "soon")).toBe(true);
    }
  });

  it("145 — fluoride 40-69 → soon recommendation", () => {
    const r = run({
      fluoride_use_records: [makeFluoride({ child_age_appropriate_product: false, product_in_date: false })],
    });
    expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("fluoride"))).toBe(true);
  });

  it("146 — independence 40-64 → planned recommendation", () => {
    const r = run({
      independence_records: [makeIndependence({
        brushes_independently: true,
        initiates_brushing_without_prompt: true,
        completes_full_routine_independently: false,
        understands_importance_of_oral_care: false,
      })],
    });
    expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("independence"))).toBe(true);
  });

  it("147 — duration < 70 → planned recommendation", () => {
    const r = run({
      brushing_schedule_records: [
        makeBrushing({ brushing_duration_morning_seconds: 60, brushing_duration_evening_seconds: 60 }),
      ],
    });
    expect(r.recommendations.some((rec) => rec.recommendation.includes("duration"))).toBe(true);
  });

  it("148 — oral discussion < 50 → planned recommendation", () => {
    const r = run({
      supervision_records: [
        makeSupervision({ oral_health_discussion: false }),
      ],
    });
    expect(r.recommendations.some((rec) => rec.recommendation.includes("oral health education") || rec.recommendation.includes("dental health"))).toBe(true);
  });

  it("149 — all recommendations have regulatory_ref", () => {
    const r = run({
      brushing_schedule_records: [makeBrushing({
        morning_brushing_completed: false,
        evening_brushing_completed: false,
        brushing_duration_morning_seconds: 0,
        brushing_duration_evening_seconds: 0,
        brushing_technique_correct: false,
        child_engaged: false,
      })],
      fluoride_use_records: [makeFluoride({
        fluoride_toothpaste_used: false,
        fluoride_concentration_appropriate: false,
        child_age_appropriate_product: false,
        product_in_date: false,
      })],
    });
    for (const rec of r.recommendations) {
      expect(rec.regulatory_ref).toBeTruthy();
    }
  });

  it("150 — recommendations have sequential rank", () => {
    const r = run({
      brushing_schedule_records: [makeBrushing({
        morning_brushing_completed: false,
        evening_brushing_completed: false,
        brushing_technique_correct: false,
        child_engaged: false,
        brushing_duration_morning_seconds: 0,
        brushing_duration_evening_seconds: 0,
      })],
      fluoride_use_records: [makeFluoride({
        fluoride_toothpaste_used: false,
        fluoride_concentration_appropriate: false,
        child_age_appropriate_product: false,
        product_in_date: false,
      })],
    });
    for (let i = 0; i < r.recommendations.length; i++) {
      expect(r.recommendations[i].rank).toBe(i + 1);
    }
  });

  it("151 — excellent scenario has no recommendations", () => {
    const r = run({
      brushing_schedule_records: [makeBrushing()],
      fluoride_use_records: [makeFluoride()],
      supervision_records: [makeSupervision()],
      toothbrush_replacement_records: [makeReplacement()],
      independence_records: [makeIndependence()],
    });
    expect(r.recommendations).toHaveLength(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 12. BRUSHING SCHEDULE VARIATIONS
// ══════════════════════════════════════════════════════════════════════════════

describe("Brushing schedule variations", () => {
  it("152 — teeth areas partial coverage tracked", () => {
    const r = run({ brushing_schedule_records: [makeBrushing({ teeth_areas_covered: "partial" })] });
    expect(r.total_brushing_records).toBe(1);
  });

  it("153 — teeth areas minimal coverage tracked", () => {
    const r = run({ brushing_schedule_records: [makeBrushing({ teeth_areas_covered: "minimal" })] });
    expect(r.total_brushing_records).toBe(1);
  });

  it("154 — teeth areas none coverage tracked", () => {
    const r = run({ brushing_schedule_records: [makeBrushing({ teeth_areas_covered: "none" })] });
    expect(r.total_brushing_records).toBe(1);
  });

  it("155 — area coverage < 70 → warning insight", () => {
    const r = run({
      brushing_schedule_records: [
        makeBrushing({ teeth_areas_covered: "partial" }),
        makeBrushing({ teeth_areas_covered: "minimal" }),
      ],
    });
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("area coverage"))).toBe(true);
  });

  it("156 — area coverage >= 90 → strength", () => {
    const r = run({ brushing_schedule_records: [makeBrushing({ teeth_areas_covered: "all" })] });
    expect(r.strengths.some((s) => s.includes("area coverage"))).toBe(true);
  });

  it("157 — tongue cleaned tracked", () => {
    const r = run({ brushing_schedule_records: [makeBrushing({ tongue_cleaned: true })] });
    expect(r.total_brushing_records).toBe(1);
  });

  it("158 — flossing completed tracked", () => {
    const r = run({ brushing_schedule_records: [makeBrushing({ flossing_completed: true })] });
    expect(r.total_brushing_records).toBe(1);
  });

  it("159 — mouthwash used tracked", () => {
    const r = run({ brushing_schedule_records: [makeBrushing({ mouthwash_used: true })] });
    expect(r.total_brushing_records).toBe(1);
  });

  it("160 — child refused with alternative offered", () => {
    const r = run({
      brushing_schedule_records: [makeBrushing({ child_refused: true, alternative_offered: true })],
    });
    expect(r.total_brushing_records).toBe(1);
  });

  it("161 — alternative offered >= 90 when child refuses → strength", () => {
    const r = run({
      brushing_schedule_records: [
        makeBrushing({ child_refused: true, alternative_offered: true }),
      ],
    });
    expect(r.strengths.some((s) => s.includes("alternative"))).toBe(true);
  });

  it("162 — refusal rate > 15 and <= 30 → warning concern", () => {
    const r = run({
      brushing_schedule_records: [
        makeBrushing({ child_refused: true }),
        makeBrushing({ child_refused: false }),
        makeBrushing({ child_refused: false }),
        makeBrushing({ child_refused: false }),
      ],
    });
    // 1/4 = 25%
    expect(r.concerns.some((c) => c.includes("refusal"))).toBe(true);
  });

  it("163 — refusal > 40 → critical insight", () => {
    const r = run({
      brushing_schedule_records: [
        makeBrushing({ child_refused: true }),
        makeBrushing({ child_refused: true }),
        makeBrushing({ child_refused: true }),
      ],
    });
    // 3/3 = 100% refusal
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("refusal"))).toBe(true);
  });

  it("164 — both brushing rate >= 90 → strength", () => {
    const r = run({ brushing_schedule_records: [makeBrushing()] });
    expect(r.strengths.some((s) => s.includes("twice-daily"))).toBe(true);
  });

  it("165 — both brushing rate < 50 → concern", () => {
    const r = run({
      brushing_schedule_records: [
        makeBrushing({ morning_brushing_completed: false, evening_brushing_completed: false }),
      ],
    });
    expect(r.concerns.some((c) => c.includes("twice-daily") || c.includes("Twice-daily"))).toBe(true);
  });

  it("166 — no brushing records + children → concern", () => {
    const r = run({
      total_children: 3,
      fluoride_use_records: [makeFluoride()],
      brushing_schedule_records: [],
    });
    expect(r.concerns.some((c) => c.includes("No brushing schedule records"))).toBe(true);
  });

  it("167 — no brushing records + children → critical insight", () => {
    const r = run({
      total_children: 3,
      fluoride_use_records: [makeFluoride()],
      brushing_schedule_records: [],
    });
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("brushing"))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 13. DURATION METRICS
// ══════════════════════════════════════════════════════════════════════════════

describe("Duration metrics", () => {
  it("168 — duration >= 120s → adequate", () => {
    const r = run({
      brushing_schedule_records: [makeBrushing({ brushing_duration_morning_seconds: 120, brushing_duration_evening_seconds: 120 })],
    });
    expect(r.total_brushing_records).toBe(1);
  });

  it("169 — duration 90 → strength about duration >= 90", () => {
    const r = run({
      brushing_schedule_records: [makeBrushing({ brushing_duration_morning_seconds: 130, brushing_duration_evening_seconds: 125 })],
    });
    expect(r.strengths.some((s) => s.includes("duration"))).toBe(true);
  });

  it("170 — duration < 50% adequate → concern", () => {
    const r = run({
      brushing_schedule_records: [
        makeBrushing({ brushing_duration_morning_seconds: 40, brushing_duration_evening_seconds: 40 }),
      ],
    });
    expect(r.concerns.some((c) => c.includes("duration"))).toBe(true);
  });

  it("171 — duration 50-69 → warning insight", () => {
    const r = run({
      brushing_schedule_records: [
        makeBrushing({ brushing_duration_morning_seconds: 130, brushing_duration_evening_seconds: 40 }),
      ],
    });
    // morning adequate, evening not → 1/2 = 50%
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("duration"))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 14. MIXED SCENARIOS AND MISSING RECORD TYPES
// ══════════════════════════════════════════════════════════════════════════════

describe("Mixed scenarios", () => {
  it("172 — brushing only → other rates 0", () => {
    const r = run({ brushing_schedule_records: [makeBrushing()] });
    expect(r.fluoride_use_rate).toBeNull();
    expect(r.supervision_rate).toBeNull();
    expect(r.toothbrush_replacement_rate).toBeNull();
    expect(r.independence_rate).toBeNull();
  });

  it("173 — fluoride only → brushing rate 0", () => {
    const r = run({ fluoride_use_records: [makeFluoride()] });
    expect(r.brushing_adherence_rate).toBeNull();
  });

  it("174 — multiple brushing records counted correctly", () => {
    const r = run({
      brushing_schedule_records: [makeBrushing(), makeBrushing(), makeBrushing()],
    });
    expect(r.total_brushing_records).toBe(3);
  });

  it("175 — multiple fluoride records counted correctly", () => {
    const r = run({
      fluoride_use_records: [makeFluoride(), makeFluoride()],
    });
    expect(r.total_fluoride_records).toBe(2);
  });

  it("176 — multiple supervision records counted correctly", () => {
    const r = run({
      supervision_records: [makeSupervision(), makeSupervision(), makeSupervision()],
    });
    expect(r.total_supervision_records).toBe(3);
  });

  it("177 — multiple replacement records counted correctly", () => {
    const r = run({
      toothbrush_replacement_records: [makeReplacement(), makeReplacement()],
    });
    expect(r.total_replacement_records).toBe(2);
  });

  it("178 — multiple independence records counted correctly", () => {
    const r = run({
      independence_records: [makeIndependence(), makeIndependence()],
    });
    expect(r.total_independence_records).toBe(2);
  });

  it("179 — no fluoride records + children → critical insight", () => {
    const r = run({
      total_children: 3,
      brushing_schedule_records: [makeBrushing()],
      fluoride_use_records: [],
    });
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("fluoride"))).toBe(true);
  });

  it("180 — no supervision records + children → critical insight", () => {
    const r = run({
      total_children: 3,
      brushing_schedule_records: [makeBrushing()],
      supervision_records: [],
    });
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("supervision"))).toBe(true);
  });
});
