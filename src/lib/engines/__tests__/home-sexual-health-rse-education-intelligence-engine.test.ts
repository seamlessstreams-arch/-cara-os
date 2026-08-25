// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME SEXUAL HEALTH & RSE EDUCATION INTELLIGENCE ENGINE TESTS
// Comprehensive test suite: unit + integration
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeSexualHealthRseEducation,
  type SexualHealthRseInput,
  type RseEducationRecordInput,
  type SexualHealthScreeningRecordInput,
  type AgeGuidanceRecordInput,
  type ConsentEducationRecordInput,
  type SafeguardingAwarenessRecordInput,
  type SexualHealthRseResult,
} from "../home-sexual-health-rse-education-intelligence-engine";

// ── Factories ───────────────────────────────────────────────────────────────

function makeRseRecord(overrides: Partial<RseEducationRecordInput> = {}): RseEducationRecordInput {
  return {
    id: "rse_1",
    child_id: "yp_1",
    session_date: "2026-05-01",
    session_type: "one_to_one",
    topic: "relationships",
    facilitator_name: "Staff A",
    facilitator_qualified: true,
    duration_minutes: 45,
    child_engaged: true,
    child_feedback_positive: true,
    learning_objectives_met: true,
    follow_up_needed: false,
    follow_up_completed: false,
    age_appropriate: true,
    materials_used: true,
    parent_carer_informed: true,
    notes_recorded: true,
    created_at: "2026-05-01",
    ...overrides,
  };
}

function makeScreeningRecord(overrides: Partial<SexualHealthScreeningRecordInput> = {}): SexualHealthScreeningRecordInput {
  return {
    id: "scr_1",
    child_id: "yp_1",
    screening_type: "routine",
    date_due: "2026-05-01",
    date_completed: "2026-05-01",
    completed: true,
    overdue: false,
    provider: "gp",
    child_consented: true,
    outcome_recorded: true,
    follow_up_needed: false,
    follow_up_completed: false,
    confidentiality_explained: true,
    child_comfortable: true,
    staff_supported_attendance: true,
    created_at: "2026-05-01",
    ...overrides,
  };
}

function makeGuidanceRecord(overrides: Partial<AgeGuidanceRecordInput> = {}): AgeGuidanceRecordInput {
  return {
    id: "guid_1",
    child_id: "yp_1",
    guidance_date: "2026-05-01",
    guidance_type: "verbal",
    topic: "puberty",
    age_appropriate: true,
    developmental_stage_considered: true,
    child_understanding_confirmed: true,
    child_questions_answered: true,
    delivered_by: "Staff A",
    delivered_by_qualified: true,
    parent_carer_aware: true,
    cultural_sensitivity_considered: true,
    follow_up_planned: false,
    follow_up_completed: false,
    notes_recorded: true,
    created_at: "2026-05-01",
    ...overrides,
  };
}

function makeConsentRecord(overrides: Partial<ConsentEducationRecordInput> = {}): ConsentEducationRecordInput {
  return {
    id: "con_1",
    child_id: "yp_1",
    session_date: "2026-05-01",
    session_type: "one_to_one",
    topic: "what_is_consent",
    child_demonstrated_understanding: true,
    child_can_articulate_consent: true,
    child_identifies_pressure: true,
    child_knows_who_to_tell: true,
    facilitator_name: "Staff A",
    facilitator_qualified: true,
    age_appropriate: true,
    scenario_practice_included: true,
    child_feedback_positive: true,
    review_date: null,
    review_overdue: false,
    notes_recorded: true,
    created_at: "2026-05-01",
    ...overrides,
  };
}

function makeSafeguardingRecord(overrides: Partial<SafeguardingAwarenessRecordInput> = {}): SafeguardingAwarenessRecordInput {
  return {
    id: "sg_1",
    child_id: "yp_1",
    assessment_date: "2026-05-01",
    assessment_type: "formal",
    child_knows_safe_adults: true,
    child_knows_how_to_report: true,
    child_understands_exploitation: true,
    child_understands_online_risks: true,
    child_understands_grooming: true,
    child_can_identify_unsafe_situations: true,
    child_confidence_score: 8,
    child_willingness_to_disclose: true,
    staff_confidence_in_child: 4,
    areas_for_development: [],
    support_plan_in_place: true,
    review_date: null,
    review_overdue: false,
    created_at: "2026-05-01",
    ...overrides,
  };
}

function baseInput(overrides: Partial<SexualHealthRseInput> = {}): SexualHealthRseInput {
  return {
    today: "2026-05-29",
    total_children: 0,
    rse_education_records: [],
    sexual_health_screening_records: [],
    age_guidance_records: [],
    consent_education_records: [],
    safeguarding_awareness_records: [],
    ...overrides,
  };
}

/** Build a fully-positive input with N children, each having all record types */
function buildFullInput(n: number): SexualHealthRseInput {
  const rseTopics: RseEducationRecordInput["topic"][] = [
    "relationships", "consent", "online_safety", "healthy_boundaries",
    "identity_diversity", "contraception", "sti_awareness", "emotional_wellbeing",
    "puberty", "exploitation_awareness",
  ];
  const rse: RseEducationRecordInput[] = [];
  const scr: SexualHealthScreeningRecordInput[] = [];
  const guid: AgeGuidanceRecordInput[] = [];
  const con: ConsentEducationRecordInput[] = [];
  const sg: SafeguardingAwarenessRecordInput[] = [];

  for (let i = 1; i <= n; i++) {
    const cid = `yp_${i}`;
    rse.push(makeRseRecord({ id: `rse_${i}`, child_id: cid, topic: rseTopics[(i - 1) % rseTopics.length] }));
    scr.push(makeScreeningRecord({ id: `scr_${i}`, child_id: cid }));
    guid.push(makeGuidanceRecord({ id: `guid_${i}`, child_id: cid }));
    con.push(makeConsentRecord({ id: `con_${i}`, child_id: cid }));
    sg.push(makeSafeguardingRecord({ id: `sg_${i}`, child_id: cid }));
  }

  return {
    today: "2026-05-29",
    total_children: n,
    rse_education_records: rse,
    sexual_health_screening_records: scr,
    age_guidance_records: guid,
    consent_education_records: con,
    safeguarding_awareness_records: sg,
  };
}

/**
 * Build input with poor quality AND low coverage.
 * n records exist but total_children = n * 4 so coverage = 25%.
 * All quality metrics are bad (false/low).
 */
function buildPoorInput(n: number): SexualHealthRseInput {
  const totalChildren = n * 4; // ensures 25% coverage rates
  const rse: RseEducationRecordInput[] = [];
  const scr: SexualHealthScreeningRecordInput[] = [];
  const guid: AgeGuidanceRecordInput[] = [];
  const con: ConsentEducationRecordInput[] = [];
  const sg: SafeguardingAwarenessRecordInput[] = [];

  for (let i = 1; i <= n; i++) {
    const cid = `yp_${i}`;
    rse.push(makeRseRecord({
      id: `rse_${i}`,
      child_id: cid,
      facilitator_qualified: false,
      child_engaged: false,
      child_feedback_positive: false,
      learning_objectives_met: false,
      age_appropriate: false,
      notes_recorded: false,
      parent_carer_informed: false,
      follow_up_needed: true,
      follow_up_completed: false,
    }));
    scr.push(makeScreeningRecord({
      id: `scr_${i}`,
      child_id: cid,
      completed: false,
      overdue: true,
      child_consented: false,
      outcome_recorded: false,
      confidentiality_explained: false,
      child_comfortable: false,
      staff_supported_attendance: false,
      follow_up_needed: true,
      follow_up_completed: false,
    }));
    guid.push(makeGuidanceRecord({
      id: `guid_${i}`,
      child_id: cid,
      age_appropriate: false,
      developmental_stage_considered: false,
      child_understanding_confirmed: false,
      child_questions_answered: false,
      delivered_by_qualified: false,
      cultural_sensitivity_considered: false,
      notes_recorded: false,
      follow_up_planned: true,
      follow_up_completed: false,
    }));
    con.push(makeConsentRecord({
      id: `con_${i}`,
      child_id: cid,
      child_demonstrated_understanding: false,
      child_can_articulate_consent: false,
      child_identifies_pressure: false,
      child_knows_who_to_tell: false,
      facilitator_qualified: false,
      age_appropriate: false,
      scenario_practice_included: false,
      child_feedback_positive: false,
      review_overdue: true,
      notes_recorded: false,
    }));
    sg.push(makeSafeguardingRecord({
      id: `sg_${i}`,
      child_id: cid,
      child_knows_safe_adults: false,
      child_knows_how_to_report: false,
      child_understands_exploitation: false,
      child_understands_online_risks: false,
      child_understands_grooming: false,
      child_can_identify_unsafe_situations: false,
      child_confidence_score: 2,
      child_willingness_to_disclose: false,
      staff_confidence_in_child: 1,
      support_plan_in_place: false,
      review_overdue: true,
    }));
  }

  return {
    today: "2026-05-29",
    total_children: totalChildren,
    rse_education_records: rse,
    sexual_health_screening_records: scr,
    age_guidance_records: guid,
    consent_education_records: con,
    safeguarding_awareness_records: sg,
  };
}

// ── Helper ──────────────────────────────────────────────────────────────────

function run(input: SexualHealthRseInput): SexualHealthRseResult {
  return computeSexualHealthRseEducation(input);
}

// ═══════════════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════════════

// ── insufficient_data ──────────────────────────────────────────────────────

describe("insufficient_data", () => {
  it("returns insufficient_data when all arrays empty and total_children=0", () => {
    const r = run(baseInput());
    expect(r.rse_rating).toBe("insufficient_data");
    expect(r.rse_score).toBe(0);
  });

  it("sets all rates to null for insufficient_data", () => {
    const r = run(baseInput());
    expect(r.rse_delivery_rate).toBeNull();
    expect(r.health_screening_rate).toBeNull();
    expect(r.age_appropriate_rate).toBeNull();
    expect(r.consent_education_rate).toBeNull();
    expect(r.safeguarding_awareness_rate).toBeNull();
    expect(r.child_confidence_rate).toBeNull();
    expect(r.screening_compliance_avg).toBe(0);
    expect(r.consent_understanding_avg).toBe(0);
  });

  it("has empty strengths, concerns, recommendations, insights", () => {
    const r = run(baseInput());
    expect(r.strengths).toHaveLength(0);
    expect(r.concerns).toHaveLength(0);
    expect(r.recommendations).toHaveLength(0);
    expect(r.insights).toHaveLength(0);
  });

  it("headline mentions insufficient data", () => {
    const r = run(baseInput());
    expect(r.headline).toContain("insufficient data");
  });

  it("total_rse_sessions is 0", () => {
    const r = run(baseInput());
    expect(r.total_rse_sessions).toBe(0);
  });
});

// ── inadequate floor (children but no records) ────────────────────────────

describe("inadequate floor (children, no records)", () => {
  it("returns inadequate with score 15 when children present but all records empty", () => {
    const r = run(baseInput({ total_children: 4 }));
    expect(r.rse_rating).toBe("inadequate");
    expect(r.rse_score).toBe(15);
  });

  it("produces 1 concern about missing data", () => {
    const r = run(baseInput({ total_children: 4 }));
    expect(r.concerns.length).toBe(1);
    expect(r.concerns[0]).toContain("No RSE education sessions");
  });

  it("produces 2 recommendations", () => {
    const r = run(baseInput({ total_children: 4 }));
    expect(r.recommendations).toHaveLength(2);
    expect(r.recommendations[0].urgency).toBe("immediate");
    expect(r.recommendations[1].urgency).toBe("immediate");
  });

  it("produces 1 critical insight", () => {
    const r = run(baseInput({ total_children: 4 }));
    expect(r.insights).toHaveLength(1);
    expect(r.insights[0].severity).toBe("critical");
  });

  it("headline mentions urgent attention", () => {
    const r = run(baseInput({ total_children: 2 }));
    expect(r.headline).toContain("urgent attention");
  });

  it("all rates are null", () => {
    const r = run(baseInput({ total_children: 3 }));
    expect(r.rse_delivery_rate).toBeNull();
    expect(r.health_screening_rate).toBeNull();
    expect(r.consent_education_rate).toBeNull();
    expect(r.safeguarding_awareness_rate).toBeNull();
    expect(r.child_confidence_rate).toBeNull();
  });
});

// ── pct(0,0) = 0 ──────────────────────────────────────────────────────────

describe("pct edge cases", () => {
  it("rate(0,0)=null — rates are 0 when no records and no children", () => {
    const r = run(baseInput());
    expect(r.rse_delivery_rate).toBeNull();
    expect(r.health_screening_rate).toBeNull();
    expect(r.age_appropriate_rate).toBeNull();
    expect(r.consent_education_rate).toBeNull();
    expect(r.safeguarding_awareness_rate).toBeNull();
    expect(r.child_confidence_rate).toBeNull();
  });

  it("rates are 0 when children>0 but no records of that type (delivery)", () => {
    const inp = baseInput({
      total_children: 2,
      rse_education_records: [],
      sexual_health_screening_records: [makeScreeningRecord({ child_id: "yp_1" })],
      age_guidance_records: [makeGuidanceRecord({ child_id: "yp_1" })],
      consent_education_records: [makeConsentRecord({ child_id: "yp_1" })],
      safeguarding_awareness_records: [makeSafeguardingRecord({ child_id: "yp_1" })],
    });
    const r = run(inp);
    expect(r.rse_delivery_rate).toBe(0);
  });
});

// ── Outstanding scenario ────────────────────────────────────────────────────

describe("outstanding scenario", () => {
  it("rates outstanding when all children have perfect records", () => {
    const r = run(buildFullInput(4));
    expect(r.rse_rating).toBe("outstanding");
    expect(r.rse_score).toBeGreaterThanOrEqual(80);
  });

  it("score is base(52) + all bonuses when all perfect", () => {
    const r = run(buildFullInput(3));
    // B1 rseDelivery=100 +4, B2 healthScreening=100 +4, B3 ageAppropriate=100(>=95) +3,
    // B4 consentEd=100 +4, B5 safeguardingAwareness=100 +4, B6 childConfidence >=90 +3,
    // B7 consentUnderstandingAvg=100(>=80) +3, B8 rseObjectivesMet=100(>=90) +2, B9 screeningCompliance=100(>=90) +1
    // = 52 + 4+4+3+4+4+3+3+2+1 = 52 + 28 = 80
    expect(r.rse_score).toBe(80);
  });

  it("all 6 rates are 100%", () => {
    const r = run(buildFullInput(3));
    expect(r.rse_delivery_rate).toBe(100);
    expect(r.health_screening_rate).toBe(100);
    expect(r.age_appropriate_rate).toBe(100);
    expect(r.consent_education_rate).toBe(100);
    expect(r.safeguarding_awareness_rate).toBe(100);
    expect(r.child_confidence_rate).toBe(100);
  });

  it("screening_compliance_avg is 100 when all compliant", () => {
    const r = run(buildFullInput(3));
    expect(r.screening_compliance_avg).toBe(100);
  });

  it("consent_understanding_avg is 100 when all understand", () => {
    const r = run(buildFullInput(3));
    expect(r.consent_understanding_avg).toBe(100);
  });

  it("headline mentions outstanding", () => {
    const r = run(buildFullInput(3));
    expect(r.headline).toContain("Outstanding");
  });

  it("has positive strengths", () => {
    const r = run(buildFullInput(3));
    expect(r.strengths.length).toBeGreaterThanOrEqual(5);
  });

  it("has no concerns", () => {
    const r = run(buildFullInput(3));
    expect(r.concerns).toHaveLength(0);
  });

  it("has no recommendations when topic coverage is full", () => {
    // Need >=10 children (or >= 6 with the 10-topic cycle) to cover enough RSE topics
    const r = run(buildFullInput(10));
    expect(r.recommendations).toHaveLength(0);
  });

  it("has positive insights for outstanding rating", () => {
    const r = run(buildFullInput(3));
    const positiveInsights = r.insights.filter(i => i.severity === "positive");
    expect(positiveInsights.length).toBeGreaterThanOrEqual(1);
    expect(positiveInsights.some(i => i.text.includes("outstanding"))).toBe(true);
  });
});

// ── Good scenario ───────────────────────────────────────────────────────────

describe("good scenario", () => {
  it("rates good when score is 65-79", () => {
    const inp = baseInput({
      total_children: 4,
      rse_education_records: [
        makeRseRecord({ id: "rse_1", child_id: "yp_1" }),
        makeRseRecord({ id: "rse_2", child_id: "yp_2" }),
        makeRseRecord({ id: "rse_3", child_id: "yp_3" }),
      ],
      sexual_health_screening_records: [
        makeScreeningRecord({ id: "scr_1", child_id: "yp_1" }),
        makeScreeningRecord({ id: "scr_2", child_id: "yp_2" }),
        makeScreeningRecord({ id: "scr_3", child_id: "yp_3" }),
        makeScreeningRecord({ id: "scr_4", child_id: "yp_4" }),
      ],
      age_guidance_records: [
        makeGuidanceRecord({ id: "guid_1", child_id: "yp_1" }),
        makeGuidanceRecord({ id: "guid_2", child_id: "yp_2" }),
        makeGuidanceRecord({ id: "guid_3", child_id: "yp_3" }),
        makeGuidanceRecord({ id: "guid_4", child_id: "yp_4" }),
      ],
      consent_education_records: [
        makeConsentRecord({ id: "con_1", child_id: "yp_1" }),
        makeConsentRecord({ id: "con_2", child_id: "yp_2" }),
        makeConsentRecord({ id: "con_3", child_id: "yp_3" }),
        makeConsentRecord({ id: "con_4", child_id: "yp_4" }),
      ],
      safeguarding_awareness_records: [
        makeSafeguardingRecord({ id: "sg_1", child_id: "yp_1" }),
        makeSafeguardingRecord({ id: "sg_2", child_id: "yp_2" }),
        makeSafeguardingRecord({ id: "sg_3", child_id: "yp_3" }),
        makeSafeguardingRecord({ id: "sg_4", child_id: "yp_4" }),
      ],
    });
    const r = run(inp);
    // rse delivery = 75 (3/4) -> no B1
    // health screening = 100 (4/4) -> +4
    // age appropriate = 100 -> +3
    // consent ed = 100 -> +4
    // safeguarding = 100 -> +4
    // child confidence = pct(4+4, 4+4) = 100 -> +3
    // consent understanding = 100 -> +3
    // rse objectives met = 100 -> +2
    // screening compliance = 100 -> +1
    // 52 + 0 + 4 + 3 + 4 + 4 + 3 + 3 + 2 + 1 = 76
    expect(r.rse_score).toBe(76);
    expect(r.rse_rating).toBe("good");
  });

  it("headline mentions good", () => {
    const inp = baseInput({
      total_children: 4,
      rse_education_records: [
        makeRseRecord({ id: "rse_1", child_id: "yp_1" }),
        makeRseRecord({ id: "rse_2", child_id: "yp_2" }),
        makeRseRecord({ id: "rse_3", child_id: "yp_3" }),
      ],
      sexual_health_screening_records: [
        makeScreeningRecord({ id: "scr_1", child_id: "yp_1" }),
        makeScreeningRecord({ id: "scr_2", child_id: "yp_2" }),
        makeScreeningRecord({ id: "scr_3", child_id: "yp_3" }),
        makeScreeningRecord({ id: "scr_4", child_id: "yp_4" }),
      ],
      age_guidance_records: [
        makeGuidanceRecord({ id: "guid_1", child_id: "yp_1" }),
        makeGuidanceRecord({ id: "guid_2", child_id: "yp_2" }),
        makeGuidanceRecord({ id: "guid_3", child_id: "yp_3" }),
        makeGuidanceRecord({ id: "guid_4", child_id: "yp_4" }),
      ],
      consent_education_records: [
        makeConsentRecord({ id: "con_1", child_id: "yp_1" }),
        makeConsentRecord({ id: "con_2", child_id: "yp_2" }),
        makeConsentRecord({ id: "con_3", child_id: "yp_3" }),
        makeConsentRecord({ id: "con_4", child_id: "yp_4" }),
      ],
      safeguarding_awareness_records: [
        makeSafeguardingRecord({ id: "sg_1", child_id: "yp_1" }),
        makeSafeguardingRecord({ id: "sg_2", child_id: "yp_2" }),
        makeSafeguardingRecord({ id: "sg_3", child_id: "yp_3" }),
        makeSafeguardingRecord({ id: "sg_4", child_id: "yp_4" }),
      ],
    });
    const r = run(inp);
    expect(r.headline).toContain("Good");
  });
});

// ── Adequate scenario ───────────────────────────────────────────────────────

describe("adequate scenario", () => {
  it("rates adequate when score is 45-64", () => {
    const inp = baseInput({
      total_children: 4,
      rse_education_records: [
        makeRseRecord({ id: "rse_1", child_id: "yp_1" }),
        makeRseRecord({ id: "rse_2", child_id: "yp_2" }),
      ],
      sexual_health_screening_records: [
        makeScreeningRecord({ id: "scr_1", child_id: "yp_1" }),
        makeScreeningRecord({ id: "scr_2", child_id: "yp_2" }),
      ],
      age_guidance_records: [
        makeGuidanceRecord({ id: "guid_1", child_id: "yp_1" }),
        makeGuidanceRecord({ id: "guid_2", child_id: "yp_2" }),
      ],
      consent_education_records: [
        makeConsentRecord({ id: "con_1", child_id: "yp_1" }),
        makeConsentRecord({ id: "con_2", child_id: "yp_2" }),
      ],
      safeguarding_awareness_records: [
        makeSafeguardingRecord({ id: "sg_1", child_id: "yp_1" }),
        makeSafeguardingRecord({ id: "sg_2", child_id: "yp_2" }),
      ],
    });
    const r = run(inp);
    // All coverage rates = 50% -> no delivery bonuses (B1-B5)
    // ageAppropriateRate = 100 -> +3 (B3)
    // childConfidence = 100 -> +3 (B6)
    // consentUnderstanding = 100 -> +3 (B7)
    // rseObjectives = 100 -> +2 (B8)
    // screeningCompliance = 100 -> +1 (B9)
    // 52 + 3 + 3 + 3 + 2 + 1 = 64
    expect(r.rse_score).toBe(64);
    expect(r.rse_rating).toBe("adequate");
  });

  it("headline mentions adequate", () => {
    const inp = baseInput({
      total_children: 4,
      rse_education_records: [
        makeRseRecord({ id: "rse_1", child_id: "yp_1" }),
        makeRseRecord({ id: "rse_2", child_id: "yp_2" }),
      ],
      sexual_health_screening_records: [
        makeScreeningRecord({ id: "scr_1", child_id: "yp_1" }),
        makeScreeningRecord({ id: "scr_2", child_id: "yp_2" }),
      ],
      age_guidance_records: [
        makeGuidanceRecord({ id: "guid_1", child_id: "yp_1" }),
        makeGuidanceRecord({ id: "guid_2", child_id: "yp_2" }),
      ],
      consent_education_records: [
        makeConsentRecord({ id: "con_1", child_id: "yp_1" }),
        makeConsentRecord({ id: "con_2", child_id: "yp_2" }),
      ],
      safeguarding_awareness_records: [
        makeSafeguardingRecord({ id: "sg_1", child_id: "yp_1" }),
        makeSafeguardingRecord({ id: "sg_2", child_id: "yp_2" }),
      ],
    });
    const r = run(inp);
    expect(r.headline).toContain("Adequate");
  });
});

// ── Inadequate scenario (computed, not floor) ─────────────────────────────

describe("inadequate scenario (computed)", () => {
  it("rates inadequate when all records are poor quality", () => {
    const r = run(buildPoorInput(3));
    expect(r.rse_rating).toBe("inadequate");
    expect(r.rse_score).toBeLessThan(45);
  });

  it("produces many concerns for poor quality data", () => {
    const r = run(buildPoorInput(3));
    expect(r.concerns.length).toBeGreaterThanOrEqual(5);
  });

  it("produces many recommendations for poor quality data", () => {
    const r = run(buildPoorInput(3));
    expect(r.recommendations.length).toBeGreaterThanOrEqual(5);
  });

  it("headline mentions inadequate", () => {
    const r = run(buildPoorInput(3));
    expect(r.headline).toContain("inadequate");
  });

  it("has critical insights", () => {
    const r = run(buildPoorInput(3));
    const criticals = r.insights.filter(i => i.severity === "critical");
    expect(criticals.length).toBeGreaterThanOrEqual(1);
  });
});

// ── Bonus isolation tests ──────────────────────────────────────────────────

describe("Bonus 1: rseDeliveryRate", () => {
  it("+4 when rseDeliveryRate >= 100", () => {
    const inp = baseInput({
      total_children: 2,
      rse_education_records: [
        makeRseRecord({ id: "rse_1", child_id: "yp_1" }),
        makeRseRecord({ id: "rse_2", child_id: "yp_2" }),
      ],
      sexual_health_screening_records: [],
      age_guidance_records: [],
      consent_education_records: [
        makeConsentRecord({ id: "con_1", child_id: "yp_1" }),
      ],
      safeguarding_awareness_records: [
        makeSafeguardingRecord({ id: "sg_1", child_id: "yp_1" }),
      ],
    });
    const r = run(inp);
    // rseDeliveryRate=100 -> +4 (B1)
    // healthScreeningRate=0, but 0 screenings -> no B2, no penalty
    // ageAppropriateRate: no guidance -> 0 -> no B3
    // consentEdRate=50 -> no B4
    // safeguardingRate=50 -> no B5
    // childConfidenceRate = pct(1+1, 1+1) = 100 -> +3 (B6)
    // consentUnderstandingAvg = 100 -> +3 (B7)
    // rseObjectivesMet=100 -> +2 (B8)
    // screeningComplianceAvg=0 -> no B9
    // penalties: none
    // 52 + 4 + 3 + 3 + 2 = 64
    expect(r.rse_score).toBe(64);
  });

  it("+2 when rseDeliveryRate >= 80 but < 100", () => {
    const inp = baseInput({
      total_children: 5,
      rse_education_records: [
        makeRseRecord({ id: "rse_1", child_id: "yp_1" }),
        makeRseRecord({ id: "rse_2", child_id: "yp_2" }),
        makeRseRecord({ id: "rse_3", child_id: "yp_3" }),
        makeRseRecord({ id: "rse_4", child_id: "yp_4" }),
      ],
      consent_education_records: [
        makeConsentRecord({ id: "con_1", child_id: "yp_1" }),
        makeConsentRecord({ id: "con_2", child_id: "yp_2" }),
        makeConsentRecord({ id: "con_3", child_id: "yp_3" }),
      ],
      safeguarding_awareness_records: [
        makeSafeguardingRecord({ id: "sg_1", child_id: "yp_1" }),
        makeSafeguardingRecord({ id: "sg_2", child_id: "yp_2" }),
        makeSafeguardingRecord({ id: "sg_3", child_id: "yp_3" }),
      ],
    });
    const r = run(inp);
    // rse=80 -> +2, childConfidence=100 -> +3, consentUnderstanding=100 -> +3, rseObjectives=100 -> +2
    // 52 + 2 + 3 + 3 + 2 = 62
    expect(r.rse_score).toBe(62);
  });

  it("+0 when rseDeliveryRate < 80", () => {
    const inp = baseInput({
      total_children: 5,
      rse_education_records: [
        makeRseRecord({ id: "rse_1", child_id: "yp_1" }),
        makeRseRecord({ id: "rse_2", child_id: "yp_2" }),
        makeRseRecord({ id: "rse_3", child_id: "yp_3" }),
      ],
      consent_education_records: [
        makeConsentRecord({ id: "con_1", child_id: "yp_1" }),
        makeConsentRecord({ id: "con_2", child_id: "yp_2" }),
        makeConsentRecord({ id: "con_3", child_id: "yp_3" }),
      ],
      safeguarding_awareness_records: [
        makeSafeguardingRecord({ id: "sg_1", child_id: "yp_1" }),
        makeSafeguardingRecord({ id: "sg_2", child_id: "yp_2" }),
        makeSafeguardingRecord({ id: "sg_3", child_id: "yp_3" }),
      ],
    });
    const r = run(inp);
    // rse=60 -> +0, same other bonuses: +3+3+2 = 8
    // 52 + 0 + 8 = 60
    expect(r.rse_score).toBe(60);
  });
});

describe("Bonus 2: healthScreeningRate", () => {
  it("+4 when healthScreeningRate >= 100", () => {
    const inp = baseInput({
      total_children: 2,
      rse_education_records: [
        makeRseRecord({ id: "rse_1", child_id: "yp_1" }),
      ],
      sexual_health_screening_records: [
        makeScreeningRecord({ id: "scr_1", child_id: "yp_1" }),
        makeScreeningRecord({ id: "scr_2", child_id: "yp_2" }),
      ],
      consent_education_records: [
        makeConsentRecord({ id: "con_1", child_id: "yp_1" }),
      ],
      safeguarding_awareness_records: [
        makeSafeguardingRecord({ id: "sg_1", child_id: "yp_1" }),
      ],
    });
    const r = run(inp);
    // healthScreening=100 -> +4, childConfidence=100 -> +3, consentUnderstanding=100 -> +3,
    // rseObjectives=100 -> +2, screeningCompliance=100 -> +1
    // 52 + 4 + 3 + 3 + 2 + 1 = 65
    expect(r.rse_score).toBe(65);
  });

  it("+2 when healthScreeningRate >= 80 but < 100", () => {
    const inp = baseInput({
      total_children: 5,
      rse_education_records: [
        makeRseRecord({ id: "rse_1", child_id: "yp_1" }),
        makeRseRecord({ id: "rse_2", child_id: "yp_2" }),
        makeRseRecord({ id: "rse_3", child_id: "yp_3" }),
      ],
      sexual_health_screening_records: [
        makeScreeningRecord({ id: "scr_1", child_id: "yp_1" }),
        makeScreeningRecord({ id: "scr_2", child_id: "yp_2" }),
        makeScreeningRecord({ id: "scr_3", child_id: "yp_3" }),
        makeScreeningRecord({ id: "scr_4", child_id: "yp_4" }),
      ],
      consent_education_records: [
        makeConsentRecord({ id: "con_1", child_id: "yp_1" }),
        makeConsentRecord({ id: "con_2", child_id: "yp_2" }),
        makeConsentRecord({ id: "con_3", child_id: "yp_3" }),
      ],
      safeguarding_awareness_records: [
        makeSafeguardingRecord({ id: "sg_1", child_id: "yp_1" }),
        makeSafeguardingRecord({ id: "sg_2", child_id: "yp_2" }),
        makeSafeguardingRecord({ id: "sg_3", child_id: "yp_3" }),
      ],
    });
    const r = run(inp);
    // healthScreening=80 -> +2, childConfidence=100 -> +3, consentUnderstanding=100 -> +3,
    // rseObjectives=100 -> +2, screeningCompliance=100 -> +1
    // 52 + 2 + 3 + 3 + 2 + 1 = 63
    expect(r.rse_score).toBe(63);
  });
});

describe("Bonus 3: ageAppropriateRate", () => {
  it("+3 when ageAppropriateRate >= 95", () => {
    const inp = baseInput({
      total_children: 2,
      rse_education_records: [makeRseRecord({ child_id: "yp_1" })],
      age_guidance_records: [
        makeGuidanceRecord({ id: "guid_1", child_id: "yp_1", age_appropriate: true }),
      ],
      consent_education_records: [makeConsentRecord({ child_id: "yp_1" })],
      safeguarding_awareness_records: [makeSafeguardingRecord({ child_id: "yp_1" })],
    });
    const r = run(inp);
    // ageAppropriate=100 -> +3, childConfidence=100 -> +3, consentUnderstanding=100 -> +3, rseObjectives=100 -> +2
    // 52 + 3 + 3 + 3 + 2 = 63
    expect(r.rse_score).toBe(63);
  });

  it("+1 when ageAppropriateRate >= 80 but < 95", () => {
    const inp = baseInput({
      total_children: 2,
      rse_education_records: [makeRseRecord({ child_id: "yp_1" })],
      age_guidance_records: [
        makeGuidanceRecord({ id: "g1", child_id: "yp_1", age_appropriate: true }),
        makeGuidanceRecord({ id: "g2", child_id: "yp_1", age_appropriate: true }),
        makeGuidanceRecord({ id: "g3", child_id: "yp_1", age_appropriate: true }),
        makeGuidanceRecord({ id: "g4", child_id: "yp_1", age_appropriate: true }),
        makeGuidanceRecord({ id: "g5", child_id: "yp_1", age_appropriate: false }),
      ],
      consent_education_records: [makeConsentRecord({ child_id: "yp_1" })],
      safeguarding_awareness_records: [makeSafeguardingRecord({ child_id: "yp_1" })],
    });
    const r = run(inp);
    // ageAppropriateRate = pct(4,5) = 80 -> +1
    // other: +3+3+2 = 8
    // 52 + 1 + 8 = 61
    expect(r.rse_score).toBe(61);
  });
});

describe("Bonus 4: consentEducationRate", () => {
  it("+4 when consentEducationRate >= 100", () => {
    const inp = baseInput({
      total_children: 2,
      rse_education_records: [makeRseRecord({ child_id: "yp_1" })],
      consent_education_records: [
        makeConsentRecord({ id: "con_1", child_id: "yp_1" }),
        makeConsentRecord({ id: "con_2", child_id: "yp_2" }),
      ],
      safeguarding_awareness_records: [makeSafeguardingRecord({ child_id: "yp_1" })],
    });
    const r = run(inp);
    // consentEd=100 -> +4, childConfidence=pct(1+2,1+2)=100 -> +3,
    // consentUnderstanding=100 -> +3, rseObjectives=100 -> +2
    // 52 + 4 + 3 + 3 + 2 = 64
    expect(r.rse_score).toBe(64);
  });

  it("+2 when consentEducationRate >= 80 but < 100", () => {
    const inp = baseInput({
      total_children: 5,
      rse_education_records: [
        makeRseRecord({ id: "rse_1", child_id: "yp_1" }),
        makeRseRecord({ id: "rse_2", child_id: "yp_2" }),
        makeRseRecord({ id: "rse_3", child_id: "yp_3" }),
      ],
      consent_education_records: [
        makeConsentRecord({ id: "con_1", child_id: "yp_1" }),
        makeConsentRecord({ id: "con_2", child_id: "yp_2" }),
        makeConsentRecord({ id: "con_3", child_id: "yp_3" }),
        makeConsentRecord({ id: "con_4", child_id: "yp_4" }),
      ],
      safeguarding_awareness_records: [
        makeSafeguardingRecord({ id: "sg_1", child_id: "yp_1" }),
        makeSafeguardingRecord({ id: "sg_2", child_id: "yp_2" }),
        makeSafeguardingRecord({ id: "sg_3", child_id: "yp_3" }),
      ],
    });
    const r = run(inp);
    // consentEd=80 -> +2, childConfidence=pct(3+4,3+4)=100 -> +3,
    // consentUnderstanding=100 -> +3, rseObjectives=100 -> +2
    // 52 + 2 + 3 + 3 + 2 = 62
    expect(r.rse_score).toBe(62);
  });
});

describe("Bonus 5: safeguardingAwarenessRate", () => {
  it("+4 when safeguardingAwarenessRate >= 100", () => {
    const inp = baseInput({
      total_children: 2,
      rse_education_records: [makeRseRecord({ child_id: "yp_1" })],
      consent_education_records: [makeConsentRecord({ child_id: "yp_1" })],
      safeguarding_awareness_records: [
        makeSafeguardingRecord({ id: "sg_1", child_id: "yp_1" }),
        makeSafeguardingRecord({ id: "sg_2", child_id: "yp_2" }),
      ],
    });
    const r = run(inp);
    // safeguarding=100 -> +4, childConfidence=pct(2+1,2+1)=100 -> +3,
    // consentUnderstanding=100 -> +3, rseObjectives=100 -> +2
    // 52 + 4 + 3 + 3 + 2 = 64
    expect(r.rse_score).toBe(64);
  });

  it("+2 when safeguardingAwarenessRate >= 80 but < 100", () => {
    const inp = baseInput({
      total_children: 5,
      rse_education_records: [
        makeRseRecord({ id: "rse_1", child_id: "yp_1" }),
        makeRseRecord({ id: "rse_2", child_id: "yp_2" }),
        makeRseRecord({ id: "rse_3", child_id: "yp_3" }),
      ],
      consent_education_records: [
        makeConsentRecord({ id: "con_1", child_id: "yp_1" }),
        makeConsentRecord({ id: "con_2", child_id: "yp_2" }),
        makeConsentRecord({ id: "con_3", child_id: "yp_3" }),
      ],
      safeguarding_awareness_records: [
        makeSafeguardingRecord({ id: "sg_1", child_id: "yp_1" }),
        makeSafeguardingRecord({ id: "sg_2", child_id: "yp_2" }),
        makeSafeguardingRecord({ id: "sg_3", child_id: "yp_3" }),
        makeSafeguardingRecord({ id: "sg_4", child_id: "yp_4" }),
      ],
    });
    const r = run(inp);
    // safeguarding=80 -> +2, childConfidence=pct(4+3,4+3)=100 -> +3,
    // consentUnderstanding=100 -> +3, rseObjectives=100 -> +2
    // 52 + 2 + 3 + 3 + 2 = 62
    expect(r.rse_score).toBe(62);
  });
});

describe("Bonus 6: childConfidenceRate", () => {
  it("+3 when childConfidenceRate >= 90", () => {
    const inp = baseInput({
      total_children: 2,
      rse_education_records: [makeRseRecord({ child_id: "yp_1" })],
      consent_education_records: [makeConsentRecord({ child_id: "yp_1" })],
      safeguarding_awareness_records: [makeSafeguardingRecord({ child_id: "yp_1" })],
    });
    const r = run(inp);
    // childConfidence = pct(1+1, 1+1) = 100 -> +3
    // 52 + 3 + 3 + 2 = 60
    expect(r.rse_score).toBe(60);
  });

  it("+1 when childConfidenceRate >= 70 but < 90", () => {
    const sgs = [];
    for (let i = 1; i <= 7; i++) {
      sgs.push(makeSafeguardingRecord({ id: `sg_${i}`, child_id: `yp_${i}`, child_confidence_score: 8 }));
    }
    for (let i = 8; i <= 10; i++) {
      sgs.push(makeSafeguardingRecord({ id: `sg_${i}`, child_id: `yp_${i}`, child_confidence_score: 4 }));
    }
    const rseRecs = [];
    for (let i = 1; i <= 10; i++) {
      rseRecs.push(makeRseRecord({ id: `rse_${i}`, child_id: `yp_${i}` }));
    }
    const inp = baseInput({
      total_children: 10,
      rse_education_records: rseRecs,
      safeguarding_awareness_records: sgs,
    });
    const r = run(inp);
    // rse=100 -> +4, consentEd=0 <50 -> penalty -5, safeguarding=100 -> +4,
    // childConfidence = pct(7+0, 10+0) = 70 -> +1
    // consentUnderstanding = 0 (no sessions), rseObjectives=100 -> +2
    // 52 + 4 + 4 + 1 + 2 - 5 = 58
    expect(r.rse_score).toBe(58);
  });

  it("+0 when childConfidenceRate < 70", () => {
    const sgs = [];
    for (let i = 1; i <= 3; i++) {
      sgs.push(makeSafeguardingRecord({ id: `sg_${i}`, child_id: `yp_${i}`, child_confidence_score: 8 }));
    }
    for (let i = 4; i <= 10; i++) {
      sgs.push(makeSafeguardingRecord({ id: `sg_${i}`, child_id: `yp_${i}`, child_confidence_score: 3 }));
    }
    const rseRecs = [];
    for (let i = 1; i <= 10; i++) {
      rseRecs.push(makeRseRecord({ id: `rse_${i}`, child_id: `yp_${i}` }));
    }
    const inp = baseInput({
      total_children: 10,
      rse_education_records: rseRecs,
      safeguarding_awareness_records: sgs,
    });
    const r = run(inp);
    // rse=100 -> +4, consentEd=0 -> -5, safeguarding=100 -> +4,
    // childConfidence = pct(3, 10) = 30 -> +0
    // rseObjectives=100 -> +2
    // 52 + 4 + 4 + 0 + 2 - 5 = 57
    expect(r.rse_score).toBe(57);
  });
});

describe("Bonus 7: consentUnderstandingAvg", () => {
  it("+3 when consentUnderstandingAvg >= 80", () => {
    const inp = baseInput({
      total_children: 2,
      rse_education_records: [makeRseRecord({ child_id: "yp_1" })],
      consent_education_records: [makeConsentRecord({ child_id: "yp_1" })],
      safeguarding_awareness_records: [makeSafeguardingRecord({ child_id: "yp_1" })],
    });
    const r = run(inp);
    expect(r.consent_understanding_avg).toBe(100);
    // 52 + 3(B6) + 3(B7) + 2(B8) = 60
    expect(r.rse_score).toBe(60);
  });

  it("+1 when consentUnderstandingAvg >= 60 but < 80", () => {
    const cons = [
      makeConsentRecord({ id: "c1", child_id: "yp_1" }),
      makeConsentRecord({ id: "c2", child_id: "yp_2" }),
      makeConsentRecord({ id: "c3", child_id: "yp_3" }),
      makeConsentRecord({
        id: "c4",
        child_id: "yp_4",
        child_demonstrated_understanding: false,
        child_can_articulate_consent: false,
        child_identifies_pressure: false,
        child_knows_who_to_tell: false,
      }),
    ];
    const inp = baseInput({
      total_children: 4,
      rse_education_records: Array.from({ length: 4 }, (_, i) => makeRseRecord({ id: `rse_${i}`, child_id: `yp_${i + 1}` })),
      sexual_health_screening_records: Array.from({ length: 4 }, (_, i) => makeScreeningRecord({ id: `scr_${i}`, child_id: `yp_${i + 1}` })),
      age_guidance_records: Array.from({ length: 4 }, (_, i) => makeGuidanceRecord({ id: `guid_${i}`, child_id: `yp_${i + 1}` })),
      consent_education_records: cons,
      safeguarding_awareness_records: Array.from({ length: 4 }, (_, i) => makeSafeguardingRecord({ id: `sg_${i}`, child_id: `yp_${i + 1}` })),
    });
    const r = run(inp);
    // Each metric: 3/4 = 75% -> avg = 75
    expect(r.consent_understanding_avg).toBe(75);
  });

  it("+0 when consentUnderstandingAvg < 60", () => {
    const cons = [
      makeConsentRecord({ id: "c1", child_id: "yp_1" }),
      makeConsentRecord({
        id: "c2", child_id: "yp_2",
        child_demonstrated_understanding: false,
        child_can_articulate_consent: false,
        child_identifies_pressure: false,
        child_knows_who_to_tell: false,
      }),
      makeConsentRecord({
        id: "c3", child_id: "yp_3",
        child_demonstrated_understanding: false,
        child_can_articulate_consent: false,
        child_identifies_pressure: false,
        child_knows_who_to_tell: false,
      }),
      makeConsentRecord({
        id: "c4", child_id: "yp_4",
        child_demonstrated_understanding: false,
        child_can_articulate_consent: false,
        child_identifies_pressure: false,
        child_knows_who_to_tell: false,
      }),
    ];
    const inp = baseInput({
      total_children: 4,
      rse_education_records: Array.from({ length: 4 }, (_, i) => makeRseRecord({ id: `rse_${i}`, child_id: `yp_${i + 1}` })),
      consent_education_records: cons,
      safeguarding_awareness_records: Array.from({ length: 4 }, (_, i) => makeSafeguardingRecord({ id: `sg_${i}`, child_id: `yp_${i + 1}` })),
    });
    const r = run(inp);
    // Each metric: pct(1,4) = 25, avg = 25 -> no B7
    expect(r.consent_understanding_avg).toBe(25);
  });
});

describe("Bonus 8: rseObjectivesMetRate", () => {
  it("+2 when rseObjectivesMetRate >= 90", () => {
    const inp = baseInput({
      total_children: 2,
      rse_education_records: [makeRseRecord({ child_id: "yp_1" })],
      consent_education_records: [makeConsentRecord({ child_id: "yp_1" })],
      safeguarding_awareness_records: [makeSafeguardingRecord({ child_id: "yp_1" })],
    });
    const r = run(inp);
    // rseObjectivesMetRate = 100% -> +2
    expect(r.rse_score).toBe(60);
  });

  it("+1 when rseObjectivesMetRate >= 70 but < 90", () => {
    const rseRecs = [];
    for (let i = 1; i <= 7; i++) {
      rseRecs.push(makeRseRecord({ id: `rse_${i}`, child_id: `yp_${i}`, learning_objectives_met: true }));
    }
    for (let i = 8; i <= 10; i++) {
      rseRecs.push(makeRseRecord({ id: `rse_${i}`, child_id: `yp_${i}`, learning_objectives_met: false }));
    }
    const inp = baseInput({
      total_children: 10,
      rse_education_records: rseRecs,
      consent_education_records: Array.from({ length: 5 }, (_, i) => makeConsentRecord({ id: `con_${i}`, child_id: `yp_${i + 1}` })),
      safeguarding_awareness_records: Array.from({ length: 5 }, (_, i) => makeSafeguardingRecord({ id: `sg_${i}`, child_id: `yp_${i + 1}` })),
    });
    const r = run(inp);
    // rse=100 -> +4, consentEd=50 -> no B4, safeguarding=50 -> no B5,
    // childConfidence=pct(5+5,5+5)=100 -> +3, consentUnderstanding=100 -> +3,
    // rseObjectives=70 -> +1(B8)
    // 52 + 4 + 3 + 3 + 1 = 63
    expect(r.rse_score).toBe(63);
  });
});

describe("Bonus 9: screeningComplianceAvg", () => {
  it("+1 when screeningComplianceAvg >= 90", () => {
    const inp = baseInput({
      total_children: 2,
      rse_education_records: [makeRseRecord({ child_id: "yp_1" })],
      sexual_health_screening_records: [
        makeScreeningRecord({ child_id: "yp_1" }),
      ],
      consent_education_records: [makeConsentRecord({ child_id: "yp_1" })],
      safeguarding_awareness_records: [makeSafeguardingRecord({ child_id: "yp_1" })],
    });
    const r = run(inp);
    expect(r.screening_compliance_avg).toBe(100);
    // 52 + 3(B6) + 3(B7) + 2(B8) + 1(B9) = 61
    expect(r.rse_score).toBe(61);
  });

  it("+0 when screeningComplianceAvg < 90", () => {
    const inp = baseInput({
      total_children: 2,
      rse_education_records: [makeRseRecord({ child_id: "yp_1" })],
      sexual_health_screening_records: [
        makeScreeningRecord({
          child_id: "yp_1",
          completed: false,
          child_consented: false,
          confidentiality_explained: false,
        }),
      ],
      consent_education_records: [makeConsentRecord({ child_id: "yp_1" })],
      safeguarding_awareness_records: [makeSafeguardingRecord({ child_id: "yp_1" })],
    });
    const r = run(inp);
    expect(r.screening_compliance_avg).toBe(0);
  });
});

// ── Penalty tests ──────────────────────────────────────────────────────────

describe("Penalty: rseDeliveryRate < 50", () => {
  it("-5 when rseDeliveryRate < 50 and total_children > 0", () => {
    const inp = baseInput({
      total_children: 10,
      rse_education_records: Array.from({ length: 4 }, (_, i) => makeRseRecord({ id: `rse_${i}`, child_id: `yp_${i + 1}` })),
      consent_education_records: Array.from({ length: 5 }, (_, i) => makeConsentRecord({ id: `con_${i}`, child_id: `yp_${i + 1}` })),
      safeguarding_awareness_records: Array.from({ length: 5 }, (_, i) => makeSafeguardingRecord({ id: `sg_${i}`, child_id: `yp_${i + 1}` })),
    });
    const r = run(inp);
    // rse=40 <50 -> -5
    // childConfidence=pct(5+5,5+5)=100 -> +3, consentUnderstanding=100 -> +3, rseObjectives=100 -> +2
    // 52 + 3+3+2 - 5 = 55
    expect(r.rse_score).toBe(55);
  });

  it("no penalty when rseDeliveryRate >= 50", () => {
    const inp = baseInput({
      total_children: 10,
      rse_education_records: Array.from({ length: 5 }, (_, i) => makeRseRecord({ id: `rse_${i}`, child_id: `yp_${i + 1}` })),
      consent_education_records: Array.from({ length: 5 }, (_, i) => makeConsentRecord({ id: `con_${i}`, child_id: `yp_${i + 1}` })),
      safeguarding_awareness_records: Array.from({ length: 5 }, (_, i) => makeSafeguardingRecord({ id: `sg_${i}`, child_id: `yp_${i + 1}` })),
    });
    const r = run(inp);
    // 52 + 3+3+2 = 60 (no -5)
    expect(r.rse_score).toBe(60);
  });
});

describe("Penalty: consentEducationRate < 50", () => {
  it("-5 when consentEducationRate < 50 and total_children > 0", () => {
    const inp = baseInput({
      total_children: 10,
      rse_education_records: Array.from({ length: 5 }, (_, i) => makeRseRecord({ id: `rse_${i}`, child_id: `yp_${i + 1}` })),
      consent_education_records: Array.from({ length: 4 }, (_, i) => makeConsentRecord({ id: `con_${i}`, child_id: `yp_${i + 1}` })),
      safeguarding_awareness_records: Array.from({ length: 5 }, (_, i) => makeSafeguardingRecord({ id: `sg_${i}`, child_id: `yp_${i + 1}` })),
    });
    const r = run(inp);
    // consentEd=40 <50 -> -5
    // childConfidence=pct(5+4,5+4)=100 -> +3, consentUnderstanding=100 -> +3, rseObjectives=100 -> +2
    // 52 + 3+3+2 - 5 = 55
    expect(r.rse_score).toBe(55);
  });
});

describe("Penalty: safeguardingAwarenessRate < 50", () => {
  it("-4 when safeguardingAwarenessRate < 50 and total_children > 0", () => {
    const inp = baseInput({
      total_children: 10,
      rse_education_records: Array.from({ length: 5 }, (_, i) => makeRseRecord({ id: `rse_${i}`, child_id: `yp_${i + 1}` })),
      consent_education_records: Array.from({ length: 5 }, (_, i) => makeConsentRecord({ id: `con_${i}`, child_id: `yp_${i + 1}` })),
      safeguarding_awareness_records: Array.from({ length: 4 }, (_, i) => makeSafeguardingRecord({ id: `sg_${i}`, child_id: `yp_${i + 1}` })),
    });
    const r = run(inp);
    // safeguarding=40 <50 -> -4
    // childConfidence=pct(4+5,4+5)=100 -> +3, consentUnderstanding=100 -> +3, rseObjectives=100 -> +2
    // 52 + 3+3+2 - 4 = 56
    expect(r.rse_score).toBe(56);
  });
});

describe("Penalty: healthScreeningRate < 40 with screenings", () => {
  it("-4 when healthScreeningRate < 40 and screenings exist", () => {
    const inp = baseInput({
      total_children: 10,
      rse_education_records: Array.from({ length: 5 }, (_, i) => makeRseRecord({ id: `rse_${i}`, child_id: `yp_${i + 1}` })),
      sexual_health_screening_records: Array.from({ length: 3 }, (_, i) => makeScreeningRecord({ id: `scr_${i}`, child_id: `yp_${i + 1}` })),
      consent_education_records: Array.from({ length: 5 }, (_, i) => makeConsentRecord({ id: `con_${i}`, child_id: `yp_${i + 1}` })),
      safeguarding_awareness_records: Array.from({ length: 5 }, (_, i) => makeSafeguardingRecord({ id: `sg_${i}`, child_id: `yp_${i + 1}` })),
    });
    const r = run(inp);
    // healthScreening=30 <40 -> -4
    // screeningCompliance=100 -> +1
    // childConfidence=100 -> +3, consentUnderstanding=100 -> +3, rseObjectives=100 -> +2
    // 52 + 1 + 3 + 3 + 2 - 4 = 57
    expect(r.rse_score).toBe(57);
  });

  it("no penalty when healthScreeningRate < 40 but no screenings exist", () => {
    const inp = baseInput({
      total_children: 2,
      rse_education_records: [makeRseRecord({ child_id: "yp_1" })],
      consent_education_records: [makeConsentRecord({ child_id: "yp_1" })],
      safeguarding_awareness_records: [makeSafeguardingRecord({ child_id: "yp_1" })],
    });
    const r = run(inp);
    // 52 + 3+3+2 = 60
    expect(r.rse_score).toBe(60);
  });
});

describe("combined penalties", () => {
  it("applies multiple penalties simultaneously", () => {
    const inp = baseInput({
      total_children: 10,
      rse_education_records: [makeRseRecord({ id: "rse_1", child_id: "yp_1" })],
      sexual_health_screening_records: [
        makeScreeningRecord({ id: "scr_1", child_id: "yp_1" }),
        makeScreeningRecord({ id: "scr_2", child_id: "yp_2" }),
        makeScreeningRecord({ id: "scr_3", child_id: "yp_3" }),
      ],
      consent_education_records: [makeConsentRecord({ id: "con_1", child_id: "yp_1" })],
      safeguarding_awareness_records: [makeSafeguardingRecord({ id: "sg_1", child_id: "yp_1" })],
    });
    const r = run(inp);
    // rse=10 <50 -> -5, consent=10 <50 -> -5, safeguarding=10 <50 -> -4, healthScreening=30 <40 -> -4
    // childConfidence=pct(1+1,1+1)=100 -> +3, consentUnderstanding=100 -> +3,
    // rseObjectives=100 -> +2, screeningCompliance=100 -> +1
    // 52 + 3+3+2+1 - 5-5-4-4 = 43
    expect(r.rse_score).toBe(43);
    expect(r.rse_rating).toBe("inadequate");
  });
});

// ── Six rates ──────────────────────────────────────────────────────────────

describe("six core rates", () => {
  it("rse_delivery_rate = pct(unique children with RSE, total_children)", () => {
    const inp = baseInput({
      total_children: 5,
      rse_education_records: [
        makeRseRecord({ id: "rse_1", child_id: "yp_1" }),
        makeRseRecord({ id: "rse_2", child_id: "yp_2" }),
        makeRseRecord({ id: "rse_3", child_id: "yp_1" }),
      ],
      consent_education_records: [makeConsentRecord({ child_id: "yp_1" }), makeConsentRecord({ id: "c2", child_id: "yp_2" }), makeConsentRecord({ id: "c3", child_id: "yp_3" })],
      safeguarding_awareness_records: [makeSafeguardingRecord({ child_id: "yp_1" }), makeSafeguardingRecord({ id: "sg2", child_id: "yp_2" }), makeSafeguardingRecord({ id: "sg3", child_id: "yp_3" })],
    });
    const r = run(inp);
    expect(r.rse_delivery_rate).toBe(40);
  });

  it("health_screening_rate = pct(unique children screened, total_children)", () => {
    const inp = baseInput({
      total_children: 4,
      rse_education_records: [makeRseRecord({ child_id: "yp_1" }), makeRseRecord({ id: "r2", child_id: "yp_2" })],
      sexual_health_screening_records: [
        makeScreeningRecord({ id: "scr_1", child_id: "yp_1" }),
        makeScreeningRecord({ id: "scr_2", child_id: "yp_2" }),
        makeScreeningRecord({ id: "scr_3", child_id: "yp_3" }),
      ],
      consent_education_records: [makeConsentRecord({ child_id: "yp_1" }), makeConsentRecord({ id: "c2", child_id: "yp_2" })],
      safeguarding_awareness_records: [makeSafeguardingRecord({ child_id: "yp_1" }), makeSafeguardingRecord({ id: "sg2", child_id: "yp_2" })],
    });
    const r = run(inp);
    expect(r.health_screening_rate).toBe(75);
  });

  it("age_appropriate_rate = pct(age_appropriate guidance, total guidance)", () => {
    const inp = baseInput({
      total_children: 2,
      rse_education_records: [makeRseRecord({ child_id: "yp_1" })],
      age_guidance_records: [
        makeGuidanceRecord({ id: "g1", child_id: "yp_1", age_appropriate: true }),
        makeGuidanceRecord({ id: "g2", child_id: "yp_1", age_appropriate: true }),
        makeGuidanceRecord({ id: "g3", child_id: "yp_1", age_appropriate: false }),
      ],
      consent_education_records: [makeConsentRecord({ child_id: "yp_1" })],
      safeguarding_awareness_records: [makeSafeguardingRecord({ child_id: "yp_1" })],
    });
    const r = run(inp);
    expect(r.age_appropriate_rate).toBe(67);
  });

  it("consent_education_rate = pct(unique children with consent ed, total_children)", () => {
    const inp = baseInput({
      total_children: 5,
      rse_education_records: Array.from({ length: 3 }, (_, i) => makeRseRecord({ id: `rse_${i}`, child_id: `yp_${i + 1}` })),
      consent_education_records: [
        makeConsentRecord({ id: "con_1", child_id: "yp_1" }),
        makeConsentRecord({ id: "con_2", child_id: "yp_2" }),
      ],
      safeguarding_awareness_records: Array.from({ length: 3 }, (_, i) => makeSafeguardingRecord({ id: `sg_${i}`, child_id: `yp_${i + 1}` })),
    });
    const r = run(inp);
    expect(r.consent_education_rate).toBe(40);
  });

  it("safeguarding_awareness_rate = pct(unique children with safeguarding, total_children)", () => {
    const inp = baseInput({
      total_children: 4,
      rse_education_records: [makeRseRecord({ child_id: "yp_1" }), makeRseRecord({ id: "r2", child_id: "yp_2" })],
      consent_education_records: [makeConsentRecord({ child_id: "yp_1" }), makeConsentRecord({ id: "c2", child_id: "yp_2" })],
      safeguarding_awareness_records: [
        makeSafeguardingRecord({ id: "sg_1", child_id: "yp_1" }),
      ],
    });
    const r = run(inp);
    expect(r.safeguarding_awareness_rate).toBe(25);
  });

  it("child_confidence_rate = pct(confident_safeguarding + consent_demonstrated, total_sg + total_consent)", () => {
    const inp = baseInput({
      total_children: 2,
      rse_education_records: [makeRseRecord({ child_id: "yp_1" })],
      consent_education_records: [
        makeConsentRecord({ id: "con_1", child_id: "yp_1", child_demonstrated_understanding: true }),
        makeConsentRecord({ id: "con_2", child_id: "yp_2", child_demonstrated_understanding: false }),
      ],
      safeguarding_awareness_records: [
        makeSafeguardingRecord({ id: "sg_1", child_id: "yp_1", child_confidence_score: 8 }),
        makeSafeguardingRecord({ id: "sg_2", child_id: "yp_2", child_confidence_score: 4 }),
      ],
    });
    const r = run(inp);
    expect(r.child_confidence_rate).toBe(50);
  });
});

// ── screening_compliance_avg ─────────────────────────────────────────────

describe("screening_compliance_avg", () => {
  it("is null when no screenings", () => {
    const r = run(baseInput({ total_children: 2, rse_education_records: [makeRseRecord({ child_id: "yp_1" })], consent_education_records: [makeConsentRecord({ child_id: "yp_1" })], safeguarding_awareness_records: [makeSafeguardingRecord({ child_id: "yp_1" })] }));
    expect(r.screening_compliance_avg).toBeNull();;
  });

  it("averages completion + consent + confidentiality rates", () => {
    const scrs = [
      makeScreeningRecord({ id: "s1", child_id: "yp_1", completed: true, child_consented: true, confidentiality_explained: true }),
      makeScreeningRecord({ id: "s2", child_id: "yp_2", completed: true, child_consented: true, confidentiality_explained: false }),
      makeScreeningRecord({ id: "s3", child_id: "yp_3", completed: true, child_consented: false, confidentiality_explained: false }),
      makeScreeningRecord({ id: "s4", child_id: "yp_4", completed: false, child_consented: false, confidentiality_explained: false }),
    ];
    const inp = baseInput({
      total_children: 4,
      rse_education_records: [makeRseRecord({ child_id: "yp_1" }), makeRseRecord({ id: "r2", child_id: "yp_2" })],
      sexual_health_screening_records: scrs,
      consent_education_records: [makeConsentRecord({ child_id: "yp_1" }), makeConsentRecord({ id: "c2", child_id: "yp_2" })],
      safeguarding_awareness_records: [makeSafeguardingRecord({ child_id: "yp_1" }), makeSafeguardingRecord({ id: "sg2", child_id: "yp_2" })],
    });
    const r = run(inp);
    // completionRate=75, consentRate=50, confidentialityRate=25 -> avg = round(50) = 50
    expect(r.screening_compliance_avg).toBe(50);
  });
});

// ── consent_understanding_avg ────────────────────────────────────────────

describe("consent_understanding_avg", () => {
  it("is null when no consent sessions", () => {
    const r = run(baseInput({ total_children: 2, rse_education_records: [makeRseRecord({ child_id: "yp_1" })], safeguarding_awareness_records: [makeSafeguardingRecord({ child_id: "yp_1" })] }));
    expect(r.consent_understanding_avg).toBeNull();;
  });

  it("averages 4 consent metrics", () => {
    const cons = [
      makeConsentRecord({ id: "c1", child_id: "yp_1" }),
      makeConsentRecord({ id: "c2", child_id: "yp_2", child_knows_who_to_tell: false }),
      makeConsentRecord({ id: "c3", child_id: "yp_3", child_identifies_pressure: false, child_knows_who_to_tell: false }),
      makeConsentRecord({ id: "c4", child_id: "yp_4", child_can_articulate_consent: false, child_identifies_pressure: false, child_knows_who_to_tell: false }),
    ];
    const inp = baseInput({
      total_children: 4,
      rse_education_records: [makeRseRecord({ child_id: "yp_1" }), makeRseRecord({ id: "r2", child_id: "yp_2" })],
      consent_education_records: cons,
      safeguarding_awareness_records: [makeSafeguardingRecord({ child_id: "yp_1" }), makeSafeguardingRecord({ id: "sg2", child_id: "yp_2" })],
    });
    const r = run(inp);
    // understanding=pct(4,4)=100, articulation=pct(3,4)=75, pressure=pct(2,4)=50, knows=pct(1,4)=25
    // avg = round((100+75+50+25)/4) = round(62.5) = 63
    expect(r.consent_understanding_avg).toBe(63);
  });
});

// ── Strengths ──────────────────────────────────────────────────────────────

describe("strengths", () => {
  it("includes RSE delivery strength when rseDeliveryRate >= 100", () => {
    const r = run(buildFullInput(3));
    expect(r.strengths.some(s => s.includes("Every child is receiving relationships and sex education"))).toBe(true);
  });

  it("includes RSE delivery strength at 80%", () => {
    const inp = baseInput({
      total_children: 5,
      rse_education_records: Array.from({ length: 4 }, (_, i) => makeRseRecord({ id: `rse_${i}`, child_id: `yp_${i + 1}` })),
      consent_education_records: Array.from({ length: 3 }, (_, i) => makeConsentRecord({ id: `con_${i}`, child_id: `yp_${i + 1}` })),
      safeguarding_awareness_records: Array.from({ length: 3 }, (_, i) => makeSafeguardingRecord({ id: `sg_${i}`, child_id: `yp_${i + 1}` })),
    });
    const r = run(inp);
    expect(r.strengths.some(s => s.includes("80%") && s.includes("RSE education"))).toBe(true);
  });

  it("includes health screening strength when >= 100", () => {
    const r = run(buildFullInput(3));
    expect(r.strengths.some(s => s.includes("Every child has been supported to access sexual health screening"))).toBe(true);
  });

  it("includes age-appropriate strength when >= 95", () => {
    const r = run(buildFullInput(3));
    expect(r.strengths.some(s => s.includes("age-appropriate"))).toBe(true);
  });

  it("includes consent education strength when >= 100", () => {
    const r = run(buildFullInput(3));
    expect(r.strengths.some(s => s.includes("Every child has received consent education"))).toBe(true);
  });

  it("includes safeguarding awareness strength when >= 100", () => {
    const r = run(buildFullInput(3));
    expect(r.strengths.some(s => s.includes("Every child has had their safeguarding awareness assessed"))).toBe(true);
  });

  it("includes child confidence strength when >= 90", () => {
    const r = run(buildFullInput(3));
    expect(r.strengths.some(s => s.includes("child confidence rate"))).toBe(true);
  });

  it("includes consent understanding strength when >= 80", () => {
    const r = run(buildFullInput(3));
    expect(r.strengths.some(s => s.includes("Consent understanding composite"))).toBe(true);
  });

  it("includes RSE objectives met strength when >= 90", () => {
    const r = run(buildFullInput(3));
    expect(r.strengths.some(s => s.includes("learning objectives"))).toBe(true);
  });

  it("includes facilitator qualified strength when >= 90", () => {
    const r = run(buildFullInput(3));
    expect(r.strengths.some(s => s.includes("qualified facilitators"))).toBe(true);
  });

  it("includes screening consent strength when >= 95", () => {
    const r = run(buildFullInput(3));
    expect(r.strengths.some(s => s.includes("consent is obtained"))).toBe(true);
  });

  it("includes confidentiality explained strength when >= 95", () => {
    const r = run(buildFullInput(3));
    expect(r.strengths.some(s => s.includes("Confidentiality is explained"))).toBe(true);
  });

  it("includes cultural sensitivity strength when >= 90", () => {
    const r = run(buildFullInput(3));
    expect(r.strengths.some(s => s.includes("cultural sensitivity"))).toBe(true);
  });

  it("includes scenario practice strength when >= 80", () => {
    const r = run(buildFullInput(3));
    expect(r.strengths.some(s => s.includes("scenario practice"))).toBe(true);
  });

  it("includes willingness to disclose strength when >= 80", () => {
    const r = run(buildFullInput(3));
    expect(r.strengths.some(s => s.includes("willing to disclose"))).toBe(true);
  });

  it("includes grooming understanding strength when >= 80", () => {
    const r = run(buildFullInput(3));
    expect(r.strengths.some(s => s.includes("understand grooming"))).toBe(true);
  });

  it("includes documentation strength when >= 90", () => {
    const r = run(buildFullInput(3));
    expect(r.strengths.some(s => s.includes("recorded notes"))).toBe(true);
  });

  it("includes RSE follow-up strength when >= 90 and follow-ups needed", () => {
    const inp = buildFullInput(3);
    inp.rse_education_records = inp.rse_education_records.map(r => ({
      ...r,
      follow_up_needed: true,
      follow_up_completed: true,
    }));
    const r = run(inp);
    expect(r.strengths.some(s => s.includes("RSE follow-ups completed"))).toBe(true);
  });

  it("includes screening follow-up strength when >= 90 and follow-ups needed", () => {
    const inp = buildFullInput(3);
    inp.sexual_health_screening_records = inp.sexual_health_screening_records.map(s => ({
      ...s,
      follow_up_needed: true,
      follow_up_completed: true,
    }));
    const r = run(inp);
    expect(r.strengths.some(s => s.includes("screening follow-ups completed"))).toBe(true);
  });

  it("includes RSE topic coverage strength when >= 80", () => {
    const topics: RseEducationRecordInput["topic"][] = [
      "relationships", "consent", "online_safety", "healthy_boundaries",
      "identity_diversity", "contraception", "sti_awareness", "emotional_wellbeing",
    ];
    const rseRecs = topics.map((topic, i) =>
      makeRseRecord({ id: `rse_${i}`, child_id: "yp_1", topic })
    );
    const inp = baseInput({
      total_children: 1,
      rse_education_records: rseRecs,
      sexual_health_screening_records: [makeScreeningRecord({ child_id: "yp_1" })],
      age_guidance_records: [makeGuidanceRecord({ child_id: "yp_1" })],
      consent_education_records: [makeConsentRecord({ child_id: "yp_1" })],
      safeguarding_awareness_records: [makeSafeguardingRecord({ child_id: "yp_1" })],
    });
    const r = run(inp);
    expect(r.strengths.some(s => s.includes("RSE topic coverage"))).toBe(true);
  });
});

// ── Concerns ──────────────────────────────────────────────────────────────

describe("concerns", () => {
  it("concern when rseDeliveryRate < 50", () => {
    const inp = baseInput({
      total_children: 10,
      rse_education_records: [makeRseRecord({ child_id: "yp_1" })],
      consent_education_records: Array.from({ length: 5 }, (_, i) => makeConsentRecord({ id: `con_${i}`, child_id: `yp_${i + 1}` })),
      safeguarding_awareness_records: Array.from({ length: 5 }, (_, i) => makeSafeguardingRecord({ id: `sg_${i}`, child_id: `yp_${i + 1}` })),
    });
    const r = run(inp);
    expect(r.concerns.some(c => c.includes("10%") && c.includes("RSE education"))).toBe(true);
  });

  it("concern when rseDeliveryRate 50-79", () => {
    const inp = baseInput({
      total_children: 10,
      rse_education_records: Array.from({ length: 6 }, (_, i) => makeRseRecord({ id: `rse_${i}`, child_id: `yp_${i + 1}` })),
      consent_education_records: Array.from({ length: 5 }, (_, i) => makeConsentRecord({ id: `con_${i}`, child_id: `yp_${i + 1}` })),
      safeguarding_awareness_records: Array.from({ length: 5 }, (_, i) => makeSafeguardingRecord({ id: `sg_${i}`, child_id: `yp_${i + 1}` })),
    });
    const r = run(inp);
    expect(r.concerns.some(c => c.includes("60%") && c.includes("RSE delivery rate"))).toBe(true);
  });

  it("concern when healthScreeningRate < 40", () => {
    const inp = baseInput({
      total_children: 10,
      rse_education_records: Array.from({ length: 5 }, (_, i) => makeRseRecord({ id: `rse_${i}`, child_id: `yp_${i + 1}` })),
      sexual_health_screening_records: [makeScreeningRecord({ id: "scr_1", child_id: "yp_1" })],
      consent_education_records: Array.from({ length: 5 }, (_, i) => makeConsentRecord({ id: `con_${i}`, child_id: `yp_${i + 1}` })),
      safeguarding_awareness_records: Array.from({ length: 5 }, (_, i) => makeSafeguardingRecord({ id: `sg_${i}`, child_id: `yp_${i + 1}` })),
    });
    const r = run(inp);
    expect(r.concerns.some(c => c.includes("10%") && c.includes("sexual health screening"))).toBe(true);
  });

  it("concern when ageAppropriateRate < 70", () => {
    const inp = baseInput({
      total_children: 2,
      rse_education_records: [makeRseRecord({ child_id: "yp_1" })],
      age_guidance_records: [
        makeGuidanceRecord({ id: "g1", child_id: "yp_1", age_appropriate: true }),
        makeGuidanceRecord({ id: "g2", child_id: "yp_1", age_appropriate: false }),
        makeGuidanceRecord({ id: "g3", child_id: "yp_1", age_appropriate: false }),
      ],
      consent_education_records: [makeConsentRecord({ child_id: "yp_1" })],
      safeguarding_awareness_records: [makeSafeguardingRecord({ child_id: "yp_1" })],
    });
    const r = run(inp);
    expect(r.concerns.some(c => c.includes("33%") && c.includes("age-appropriate"))).toBe(true);
  });

  it("concern when consentEducationRate < 50", () => {
    const r = run(buildPoorInput(3));
    expect(r.concerns.some(c => c.includes("consent education"))).toBe(true);
  });

  it("concern when safeguardingAwarenessRate < 50", () => {
    const inp = baseInput({
      total_children: 10,
      rse_education_records: Array.from({ length: 5 }, (_, i) => makeRseRecord({ id: `rse_${i}`, child_id: `yp_${i + 1}` })),
      consent_education_records: Array.from({ length: 5 }, (_, i) => makeConsentRecord({ id: `con_${i}`, child_id: `yp_${i + 1}` })),
      safeguarding_awareness_records: [makeSafeguardingRecord({ id: "sg_1", child_id: "yp_1" })],
    });
    const r = run(inp);
    expect(r.concerns.some(c => c.includes("10%") && c.includes("safeguarding awareness"))).toBe(true);
  });

  it("concern when childConfidenceRate < 50", () => {
    const sgs = Array.from({ length: 4 }, (_, i) => makeSafeguardingRecord({
      id: `sg_${i}`, child_id: `yp_${i + 1}`, child_confidence_score: 3,
    }));
    const cons = Array.from({ length: 4 }, (_, i) => makeConsentRecord({
      id: `con_${i}`, child_id: `yp_${i + 1}`, child_demonstrated_understanding: false,
    }));
    const inp = baseInput({
      total_children: 4,
      rse_education_records: Array.from({ length: 4 }, (_, i) => makeRseRecord({ id: `rse_${i}`, child_id: `yp_${i + 1}` })),
      consent_education_records: cons,
      safeguarding_awareness_records: sgs,
    });
    const r = run(inp);
    expect(r.concerns.some(c => c.includes("0%") && c.includes("child confidence"))).toBe(true);
  });

  it("concern when consentUnderstandingAvg < 40", () => {
    const cons = Array.from({ length: 4 }, (_, i) => makeConsentRecord({
      id: `con_${i}`, child_id: `yp_${i + 1}`,
      child_demonstrated_understanding: false,
      child_can_articulate_consent: false,
      child_identifies_pressure: false,
      child_knows_who_to_tell: false,
    }));
    const inp = baseInput({
      total_children: 4,
      rse_education_records: Array.from({ length: 4 }, (_, i) => makeRseRecord({ id: `rse_${i}`, child_id: `yp_${i + 1}` })),
      consent_education_records: cons,
      safeguarding_awareness_records: Array.from({ length: 4 }, (_, i) => makeSafeguardingRecord({ id: `sg_${i}`, child_id: `yp_${i + 1}` })),
    });
    const r = run(inp);
    expect(r.consent_understanding_avg).toBe(0);
    expect(r.concerns.some(c => c.includes("Consent understanding composite"))).toBe(true);
  });

  it("concern when overdue screenings exist", () => {
    const inp = baseInput({
      total_children: 2,
      rse_education_records: [makeRseRecord({ child_id: "yp_1" })],
      sexual_health_screening_records: [makeScreeningRecord({ child_id: "yp_1", overdue: true })],
      consent_education_records: [makeConsentRecord({ child_id: "yp_1" })],
      safeguarding_awareness_records: [makeSafeguardingRecord({ child_id: "yp_1" })],
    });
    const r = run(inp);
    expect(r.concerns.some(c => c.includes("overdue"))).toBe(true);
  });

  it("concern when overdue consent reviews exist", () => {
    const inp = baseInput({
      total_children: 2,
      rse_education_records: [makeRseRecord({ child_id: "yp_1" })],
      consent_education_records: [makeConsentRecord({ child_id: "yp_1", review_overdue: true })],
      safeguarding_awareness_records: [makeSafeguardingRecord({ child_id: "yp_1" })],
    });
    const r = run(inp);
    expect(r.concerns.some(c => c.includes("consent education review"))).toBe(true);
  });

  it("concern when overdue safeguarding reviews exist", () => {
    const inp = baseInput({
      total_children: 2,
      rse_education_records: [makeRseRecord({ child_id: "yp_1" })],
      consent_education_records: [makeConsentRecord({ child_id: "yp_1" })],
      safeguarding_awareness_records: [makeSafeguardingRecord({ child_id: "yp_1", review_overdue: true })],
    });
    const r = run(inp);
    expect(r.concerns.some(c => c.includes("safeguarding awareness review"))).toBe(true);
  });

  it("concern when rseFacilitatorQualifiedRate < 50", () => {
    const rseRecs = Array.from({ length: 4 }, (_, i) => makeRseRecord({
      id: `rse_${i}`, child_id: `yp_${i + 1}`, facilitator_qualified: false,
    }));
    const inp = baseInput({
      total_children: 4,
      rse_education_records: rseRecs,
      consent_education_records: Array.from({ length: 4 }, (_, i) => makeConsentRecord({ id: `con_${i}`, child_id: `yp_${i + 1}` })),
      safeguarding_awareness_records: Array.from({ length: 4 }, (_, i) => makeSafeguardingRecord({ id: `sg_${i}`, child_id: `yp_${i + 1}` })),
    });
    const r = run(inp);
    expect(r.concerns.some(c => c.includes("0%") && c.includes("qualified facilitators"))).toBe(true);
  });

  it("concern when screeningConsentRate < 70", () => {
    const scrs = Array.from({ length: 4 }, (_, i) => makeScreeningRecord({
      id: `scr_${i}`, child_id: `yp_${i + 1}`, child_consented: false,
    }));
    const inp = baseInput({
      total_children: 4,
      rse_education_records: Array.from({ length: 4 }, (_, i) => makeRseRecord({ id: `rse_${i}`, child_id: `yp_${i + 1}` })),
      sexual_health_screening_records: scrs,
      consent_education_records: Array.from({ length: 4 }, (_, i) => makeConsentRecord({ id: `con_${i}`, child_id: `yp_${i + 1}` })),
      safeguarding_awareness_records: Array.from({ length: 4 }, (_, i) => makeSafeguardingRecord({ id: `sg_${i}`, child_id: `yp_${i + 1}` })),
    });
    const r = run(inp);
    expect(r.concerns.some(c => c.includes("Consent obtained for only 0%"))).toBe(true);
  });

  it("concern when confidentialityExplainedRate < 70", () => {
    const scrs = Array.from({ length: 4 }, (_, i) => makeScreeningRecord({
      id: `scr_${i}`, child_id: `yp_${i + 1}`, confidentiality_explained: false,
    }));
    const inp = baseInput({
      total_children: 4,
      rse_education_records: Array.from({ length: 4 }, (_, i) => makeRseRecord({ id: `rse_${i}`, child_id: `yp_${i + 1}` })),
      sexual_health_screening_records: scrs,
      consent_education_records: Array.from({ length: 4 }, (_, i) => makeConsentRecord({ id: `con_${i}`, child_id: `yp_${i + 1}` })),
      safeguarding_awareness_records: Array.from({ length: 4 }, (_, i) => makeSafeguardingRecord({ id: `sg_${i}`, child_id: `yp_${i + 1}` })),
    });
    const r = run(inp);
    expect(r.concerns.some(c => c.includes("Confidentiality explained in only 0%"))).toBe(true);
  });

  it("concern when understandsExploitationRate < 50", () => {
    const sgs = Array.from({ length: 4 }, (_, i) => makeSafeguardingRecord({
      id: `sg_${i}`, child_id: `yp_${i + 1}`, child_understands_exploitation: false,
    }));
    const inp = baseInput({
      total_children: 4,
      rse_education_records: Array.from({ length: 4 }, (_, i) => makeRseRecord({ id: `rse_${i}`, child_id: `yp_${i + 1}` })),
      consent_education_records: Array.from({ length: 4 }, (_, i) => makeConsentRecord({ id: `con_${i}`, child_id: `yp_${i + 1}` })),
      safeguarding_awareness_records: sgs,
    });
    const r = run(inp);
    expect(r.concerns.some(c => c.includes("0%") && c.includes("understand exploitation"))).toBe(true);
  });

  it("concern when understandsGroomingRate < 50", () => {
    const sgs = Array.from({ length: 4 }, (_, i) => makeSafeguardingRecord({
      id: `sg_${i}`, child_id: `yp_${i + 1}`, child_understands_grooming: false,
    }));
    const inp = baseInput({
      total_children: 4,
      rse_education_records: Array.from({ length: 4 }, (_, i) => makeRseRecord({ id: `rse_${i}`, child_id: `yp_${i + 1}` })),
      consent_education_records: Array.from({ length: 4 }, (_, i) => makeConsentRecord({ id: `con_${i}`, child_id: `yp_${i + 1}` })),
      safeguarding_awareness_records: sgs,
    });
    const r = run(inp);
    expect(r.concerns.some(c => c.includes("0%") && c.includes("understand grooming"))).toBe(true);
  });

  it("concern when willingnessToDiscloseRate < 50", () => {
    const sgs = Array.from({ length: 4 }, (_, i) => makeSafeguardingRecord({
      id: `sg_${i}`, child_id: `yp_${i + 1}`, child_willingness_to_disclose: false,
    }));
    const inp = baseInput({
      total_children: 4,
      rse_education_records: Array.from({ length: 4 }, (_, i) => makeRseRecord({ id: `rse_${i}`, child_id: `yp_${i + 1}` })),
      consent_education_records: Array.from({ length: 4 }, (_, i) => makeConsentRecord({ id: `con_${i}`, child_id: `yp_${i + 1}` })),
      safeguarding_awareness_records: sgs,
    });
    const r = run(inp);
    expect(r.concerns.some(c => c.includes("0%") && c.includes("willing to disclose"))).toBe(true);
  });

  it("concern when rseDocumentationRate < 70", () => {
    const rseRecs = Array.from({ length: 4 }, (_, i) => makeRseRecord({
      id: `rse_${i}`, child_id: `yp_${i + 1}`, notes_recorded: false,
    }));
    const inp = baseInput({
      total_children: 4,
      rse_education_records: rseRecs,
      consent_education_records: Array.from({ length: 4 }, (_, i) => makeConsentRecord({ id: `con_${i}`, child_id: `yp_${i + 1}` })),
      safeguarding_awareness_records: Array.from({ length: 4 }, (_, i) => makeSafeguardingRecord({ id: `sg_${i}`, child_id: `yp_${i + 1}` })),
    });
    const r = run(inp);
    expect(r.concerns.some(c => c.includes("RSE session documentation"))).toBe(true);
  });

  it("concern when rseFollowUpCompletionRate < 50", () => {
    const rseRecs = Array.from({ length: 4 }, (_, i) => makeRseRecord({
      id: `rse_${i}`, child_id: `yp_${i + 1}`, follow_up_needed: true, follow_up_completed: false,
    }));
    const inp = baseInput({
      total_children: 4,
      rse_education_records: rseRecs,
      consent_education_records: Array.from({ length: 4 }, (_, i) => makeConsentRecord({ id: `con_${i}`, child_id: `yp_${i + 1}` })),
      safeguarding_awareness_records: Array.from({ length: 4 }, (_, i) => makeSafeguardingRecord({ id: `sg_${i}`, child_id: `yp_${i + 1}` })),
    });
    const r = run(inp);
    expect(r.concerns.some(c => c.includes("RSE follow-ups completed"))).toBe(true);
  });

  it("singular overdue screening concern wording", () => {
    const inp = baseInput({
      total_children: 2,
      rse_education_records: [makeRseRecord({ child_id: "yp_1" })],
      sexual_health_screening_records: [makeScreeningRecord({ child_id: "yp_1", overdue: true })],
      consent_education_records: [makeConsentRecord({ child_id: "yp_1" })],
      safeguarding_awareness_records: [makeSafeguardingRecord({ child_id: "yp_1" })],
    });
    const r = run(inp);
    expect(r.concerns.some(c => c.includes("1 sexual health screening is overdue"))).toBe(true);
  });

  it("plural overdue screenings concern wording", () => {
    const inp = baseInput({
      total_children: 2,
      rse_education_records: [makeRseRecord({ child_id: "yp_1" })],
      sexual_health_screening_records: [
        makeScreeningRecord({ id: "s1", child_id: "yp_1", overdue: true }),
        makeScreeningRecord({ id: "s2", child_id: "yp_2", overdue: true }),
      ],
      consent_education_records: [makeConsentRecord({ child_id: "yp_1" })],
      safeguarding_awareness_records: [makeSafeguardingRecord({ child_id: "yp_1" })],
    });
    const r = run(inp);
    expect(r.concerns.some(c => c.includes("2 sexual health screenings are overdue"))).toBe(true);
  });
});

// ── Recommendations ────────────────────────────────────────────────────────

describe("recommendations", () => {
  it("urgent RSE recommendation when rseDeliveryRate < 50", () => {
    const inp = baseInput({
      total_children: 10,
      rse_education_records: [makeRseRecord({ child_id: "yp_1" })],
      consent_education_records: Array.from({ length: 5 }, (_, i) => makeConsentRecord({ id: `con_${i}`, child_id: `yp_${i + 1}` })),
      safeguarding_awareness_records: Array.from({ length: 5 }, (_, i) => makeSafeguardingRecord({ id: `sg_${i}`, child_id: `yp_${i + 1}` })),
    });
    const r = run(inp);
    const rec = r.recommendations.find(rec => rec.recommendation.includes("RSE education programme"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("immediate");
    expect(rec!.regulatory_ref).toContain("Reg 5");
  });

  it("urgent consent recommendation when consentEducationRate < 50", () => {
    const inp = baseInput({
      total_children: 10,
      rse_education_records: Array.from({ length: 5 }, (_, i) => makeRseRecord({ id: `rse_${i}`, child_id: `yp_${i + 1}` })),
      consent_education_records: [makeConsentRecord({ child_id: "yp_1" })],
      safeguarding_awareness_records: Array.from({ length: 5 }, (_, i) => makeSafeguardingRecord({ id: `sg_${i}`, child_id: `yp_${i + 1}` })),
    });
    const r = run(inp);
    const rec = r.recommendations.find(rec => rec.recommendation.includes("consent education"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("immediate");
    expect(rec!.regulatory_ref).toContain("Reg 34");
  });

  it("urgent safeguarding recommendation when safeguardingAwarenessRate < 50", () => {
    const inp = baseInput({
      total_children: 10,
      rse_education_records: Array.from({ length: 5 }, (_, i) => makeRseRecord({ id: `rse_${i}`, child_id: `yp_${i + 1}` })),
      consent_education_records: Array.from({ length: 5 }, (_, i) => makeConsentRecord({ id: `con_${i}`, child_id: `yp_${i + 1}` })),
      safeguarding_awareness_records: [makeSafeguardingRecord({ child_id: "yp_1" })],
    });
    const r = run(inp);
    const rec = r.recommendations.find(rec => rec.recommendation.includes("safeguarding awareness"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("immediate");
  });

  it("urgent health screening recommendation when healthScreeningRate < 40", () => {
    const inp = baseInput({
      total_children: 10,
      rse_education_records: Array.from({ length: 5 }, (_, i) => makeRseRecord({ id: `rse_${i}`, child_id: `yp_${i + 1}` })),
      sexual_health_screening_records: [makeScreeningRecord({ child_id: "yp_1" })],
      consent_education_records: Array.from({ length: 5 }, (_, i) => makeConsentRecord({ id: `con_${i}`, child_id: `yp_${i + 1}` })),
      safeguarding_awareness_records: Array.from({ length: 5 }, (_, i) => makeSafeguardingRecord({ id: `sg_${i}`, child_id: `yp_${i + 1}` })),
    });
    const r = run(inp);
    const rec = r.recommendations.find(rec => rec.recommendation.includes("sexual health screening pathways"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("immediate");
    expect(rec!.regulatory_ref).toContain("Reg 14");
  });

  it("recommendation ranks are sequential", () => {
    const r = run(buildPoorInput(3));
    for (let i = 0; i < r.recommendations.length; i++) {
      expect(r.recommendations[i].rank).toBe(i + 1);
    }
  });

  it("planned recommendation for RSE documentation when < 70", () => {
    const rseRecs = Array.from({ length: 4 }, (_, i) => makeRseRecord({
      id: `rse_${i}`, child_id: `yp_${i + 1}`, notes_recorded: false,
    }));
    const inp = baseInput({
      total_children: 4,
      rse_education_records: rseRecs,
      consent_education_records: Array.from({ length: 4 }, (_, i) => makeConsentRecord({ id: `con_${i}`, child_id: `yp_${i + 1}` })),
      safeguarding_awareness_records: Array.from({ length: 4 }, (_, i) => makeSafeguardingRecord({ id: `sg_${i}`, child_id: `yp_${i + 1}` })),
    });
    const r = run(inp);
    const rec = r.recommendations.find(rec => rec.recommendation.includes("Improve RSE session documentation"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("planned");
  });

  it("planned recommendation for cultural sensitivity when < 70", () => {
    const guids = Array.from({ length: 4 }, (_, i) => makeGuidanceRecord({
      id: `guid_${i}`, child_id: `yp_${i + 1}`, cultural_sensitivity_considered: false,
    }));
    const inp = baseInput({
      total_children: 4,
      rse_education_records: Array.from({ length: 4 }, (_, i) => makeRseRecord({ id: `rse_${i}`, child_id: `yp_${i + 1}` })),
      age_guidance_records: guids,
      consent_education_records: Array.from({ length: 4 }, (_, i) => makeConsentRecord({ id: `con_${i}`, child_id: `yp_${i + 1}` })),
      safeguarding_awareness_records: Array.from({ length: 4 }, (_, i) => makeSafeguardingRecord({ id: `sg_${i}`, child_id: `yp_${i + 1}` })),
    });
    const r = run(inp);
    const rec = r.recommendations.find(rec => rec.recommendation.includes("cultural sensitivity"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("planned");
  });

  it("planned recommendation for scenario practice when < 60", () => {
    const cons = Array.from({ length: 4 }, (_, i) => makeConsentRecord({
      id: `con_${i}`, child_id: `yp_${i + 1}`, scenario_practice_included: false,
    }));
    const inp = baseInput({
      total_children: 4,
      rse_education_records: Array.from({ length: 4 }, (_, i) => makeRseRecord({ id: `rse_${i}`, child_id: `yp_${i + 1}` })),
      consent_education_records: cons,
      safeguarding_awareness_records: Array.from({ length: 4 }, (_, i) => makeSafeguardingRecord({ id: `sg_${i}`, child_id: `yp_${i + 1}` })),
    });
    const r = run(inp);
    const rec = r.recommendations.find(rec => rec.recommendation.includes("scenario practice"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("planned");
  });

  it("soon recommendation to extend RSE when 50-79", () => {
    const inp = baseInput({
      total_children: 10,
      rse_education_records: Array.from({ length: 6 }, (_, i) => makeRseRecord({ id: `rse_${i}`, child_id: `yp_${i + 1}` })),
      consent_education_records: Array.from({ length: 5 }, (_, i) => makeConsentRecord({ id: `con_${i}`, child_id: `yp_${i + 1}` })),
      safeguarding_awareness_records: Array.from({ length: 5 }, (_, i) => makeSafeguardingRecord({ id: `sg_${i}`, child_id: `yp_${i + 1}` })),
    });
    const r = run(inp);
    const rec = r.recommendations.find(rec => rec.recommendation.includes("Extend RSE education"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("soon");
  });

  it("soon recommendation for overdue screenings", () => {
    const inp = baseInput({
      total_children: 4,
      rse_education_records: Array.from({ length: 4 }, (_, i) => makeRseRecord({ id: `rse_${i}`, child_id: `yp_${i + 1}` })),
      sexual_health_screening_records: [makeScreeningRecord({ id: "s1", child_id: "yp_1", overdue: true })],
      consent_education_records: Array.from({ length: 4 }, (_, i) => makeConsentRecord({ id: `con_${i}`, child_id: `yp_${i + 1}` })),
      safeguarding_awareness_records: Array.from({ length: 4 }, (_, i) => makeSafeguardingRecord({ id: `sg_${i}`, child_id: `yp_${i + 1}` })),
    });
    const r = run(inp);
    const rec = r.recommendations.find(rec => rec.recommendation.includes("overdue sexual health screenings"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("soon");
  });
});

// ── Insights ──────────────────────────────────────────────────────────────

describe("insights", () => {
  it("critical insight when rseDeliveryRate < 50", () => {
    const inp = baseInput({
      total_children: 10,
      rse_education_records: [makeRseRecord({ child_id: "yp_1" })],
      consent_education_records: Array.from({ length: 5 }, (_, i) => makeConsentRecord({ id: `con_${i}`, child_id: `yp_${i + 1}` })),
      safeguarding_awareness_records: Array.from({ length: 5 }, (_, i) => makeSafeguardingRecord({ id: `sg_${i}`, child_id: `yp_${i + 1}` })),
    });
    const r = run(inp);
    const insight = r.insights.find(i => i.severity === "critical" && i.text.includes("RSE education"));
    expect(insight).toBeDefined();
  });

  it("critical insight when consentEducationRate < 50", () => {
    const inp = baseInput({
      total_children: 10,
      rse_education_records: Array.from({ length: 5 }, (_, i) => makeRseRecord({ id: `rse_${i}`, child_id: `yp_${i + 1}` })),
      consent_education_records: [makeConsentRecord({ child_id: "yp_1" })],
      safeguarding_awareness_records: Array.from({ length: 5 }, (_, i) => makeSafeguardingRecord({ id: `sg_${i}`, child_id: `yp_${i + 1}` })),
    });
    const r = run(inp);
    const insight = r.insights.find(i => i.severity === "critical" && i.text.includes("consent education"));
    expect(insight).toBeDefined();
  });

  it("critical insight when safeguardingAwarenessRate < 50", () => {
    const inp = baseInput({
      total_children: 10,
      rse_education_records: Array.from({ length: 5 }, (_, i) => makeRseRecord({ id: `rse_${i}`, child_id: `yp_${i + 1}` })),
      consent_education_records: Array.from({ length: 5 }, (_, i) => makeConsentRecord({ id: `con_${i}`, child_id: `yp_${i + 1}` })),
      safeguarding_awareness_records: [makeSafeguardingRecord({ child_id: "yp_1" })],
    });
    const r = run(inp);
    const insight = r.insights.find(i => i.severity === "critical" && i.text.includes("safeguarding awareness"));
    expect(insight).toBeDefined();
  });

  it("critical insight when healthScreeningRate < 40 with screenings", () => {
    const inp = baseInput({
      total_children: 10,
      rse_education_records: Array.from({ length: 5 }, (_, i) => makeRseRecord({ id: `rse_${i}`, child_id: `yp_${i + 1}` })),
      sexual_health_screening_records: [makeScreeningRecord({ child_id: "yp_1" })],
      consent_education_records: Array.from({ length: 5 }, (_, i) => makeConsentRecord({ id: `con_${i}`, child_id: `yp_${i + 1}` })),
      safeguarding_awareness_records: Array.from({ length: 5 }, (_, i) => makeSafeguardingRecord({ id: `sg_${i}`, child_id: `yp_${i + 1}` })),
    });
    const r = run(inp);
    const insight = r.insights.find(i => i.severity === "critical" && i.text.includes("sexual health screening"));
    expect(insight).toBeDefined();
  });

  it("critical insight when willingnessToDiscloseRate < 50", () => {
    const sgs = Array.from({ length: 4 }, (_, i) => makeSafeguardingRecord({
      id: `sg_${i}`, child_id: `yp_${i + 1}`, child_willingness_to_disclose: false,
    }));
    const inp = baseInput({
      total_children: 4,
      rse_education_records: Array.from({ length: 4 }, (_, i) => makeRseRecord({ id: `rse_${i}`, child_id: `yp_${i + 1}` })),
      consent_education_records: Array.from({ length: 4 }, (_, i) => makeConsentRecord({ id: `con_${i}`, child_id: `yp_${i + 1}` })),
      safeguarding_awareness_records: sgs,
    });
    const r = run(inp);
    const insight = r.insights.find(i => i.severity === "critical" && i.text.includes("willing to disclose"));
    expect(insight).toBeDefined();
  });

  it("critical insight when exploitation + grooming both < 50", () => {
    const sgs = Array.from({ length: 4 }, (_, i) => makeSafeguardingRecord({
      id: `sg_${i}`, child_id: `yp_${i + 1}`,
      child_understands_exploitation: false,
      child_understands_grooming: false,
    }));
    const inp = baseInput({
      total_children: 4,
      rse_education_records: Array.from({ length: 4 }, (_, i) => makeRseRecord({ id: `rse_${i}`, child_id: `yp_${i + 1}` })),
      consent_education_records: Array.from({ length: 4 }, (_, i) => makeConsentRecord({ id: `con_${i}`, child_id: `yp_${i + 1}` })),
      safeguarding_awareness_records: sgs,
    });
    const r = run(inp);
    const insight = r.insights.find(i => i.severity === "critical" && i.text.includes("exploitation") && i.text.includes("grooming"));
    expect(insight).toBeDefined();
  });

  it("warning insight when rseDeliveryRate 50-79", () => {
    const inp = baseInput({
      total_children: 10,
      rse_education_records: Array.from({ length: 6 }, (_, i) => makeRseRecord({ id: `rse_${i}`, child_id: `yp_${i + 1}` })),
      consent_education_records: Array.from({ length: 5 }, (_, i) => makeConsentRecord({ id: `con_${i}`, child_id: `yp_${i + 1}` })),
      safeguarding_awareness_records: Array.from({ length: 5 }, (_, i) => makeSafeguardingRecord({ id: `sg_${i}`, child_id: `yp_${i + 1}` })),
    });
    const r = run(inp);
    const insight = r.insights.find(i => i.severity === "warning" && i.text.includes("RSE delivery rate at 60%"));
    expect(insight).toBeDefined();
  });

  it("warning insight when overdue screenings exist", () => {
    const inp = baseInput({
      total_children: 2,
      rse_education_records: [makeRseRecord({ child_id: "yp_1" })],
      sexual_health_screening_records: [
        makeScreeningRecord({ child_id: "yp_1", overdue: true }),
        makeScreeningRecord({ id: "s2", child_id: "yp_2", overdue: true }),
      ],
      consent_education_records: [makeConsentRecord({ child_id: "yp_1" })],
      safeguarding_awareness_records: [makeSafeguardingRecord({ child_id: "yp_1" })],
    });
    const r = run(inp);
    const insight = r.insights.find(i => i.severity === "warning" && i.text.includes("2 screenings overdue"));
    expect(insight).toBeDefined();
  });

  it("positive insight for outstanding rating", () => {
    const r = run(buildFullInput(3));
    const insight = r.insights.find(i => i.severity === "positive" && i.text.includes("outstanding"));
    expect(insight).toBeDefined();
  });

  it("positive insight when RSE delivery 100% + objectives 90%+", () => {
    const r = run(buildFullInput(3));
    const insight = r.insights.find(i => i.severity === "positive" && i.text.includes("Every child receiving RSE"));
    expect(insight).toBeDefined();
  });

  it("positive insight when consent ed 100% + understanding 80%+", () => {
    const r = run(buildFullInput(3));
    const insight = r.insights.find(i => i.severity === "positive" && i.text.includes("Every child receiving consent education"));
    expect(insight).toBeDefined();
  });

  it("positive insight when safeguarding 100% + exploitation + grooming 80%+", () => {
    const r = run(buildFullInput(3));
    const insight = r.insights.find(i => i.severity === "positive" && i.text.includes("Every child assessed"));
    expect(insight).toBeDefined();
  });

  it("positive insight for disclosure + reporting rates 80%+", () => {
    const r = run(buildFullInput(3));
    const insight = r.insights.find(i => i.severity === "positive" && i.text.includes("willing to disclose"));
    expect(insight).toBeDefined();
  });

  it("positive insight for child confidence 90%+", () => {
    const r = run(buildFullInput(3));
    const insight = r.insights.find(i => i.severity === "positive" && i.text.includes("child confidence"));
    expect(insight).toBeDefined();
  });

  it("positive insight for engagement + feedback 90%+", () => {
    const r = run(buildFullInput(3));
    const insight = r.insights.find(i => i.severity === "positive" && i.text.includes("engagement") && i.text.includes("feedback"));
    expect(insight).toBeDefined();
  });

  it("positive insight for cultural sensitivity + developmental 90%+", () => {
    const r = run(buildFullInput(3));
    const insight = r.insights.find(i => i.severity === "positive" && i.text.includes("cultural sensitivity"));
    expect(insight).toBeDefined();
  });

  it("positive insight for staff + child confidence convergence", () => {
    const r = run(buildFullInput(3));
    const insight = r.insights.find(i => i.severity === "positive" && i.text.includes("Staff confidence"));
    expect(insight).toBeDefined();
  });

  it("warning insight for RSE topic distribution when >= 5 sessions and >= 3 topics", () => {
    const topics: RseEducationRecordInput["topic"][] = [
      "relationships", "consent", "online_safety", "relationships", "consent",
    ];
    const rseRecs = topics.map((topic, i) =>
      makeRseRecord({ id: `rse_${i}`, child_id: "yp_1", topic })
    );
    const inp = baseInput({
      total_children: 1,
      rse_education_records: rseRecs,
      consent_education_records: [makeConsentRecord({ child_id: "yp_1" })],
      safeguarding_awareness_records: [makeSafeguardingRecord({ child_id: "yp_1" })],
    });
    const r = run(inp);
    const insight = r.insights.find(i => i.text.includes("Most frequent RSE topics"));
    expect(insight).toBeDefined();
    expect(insight!.severity).toBe("warning");
  });

  it("warning insight for consent topic distribution when >= 3 sessions and >= 2 topics", () => {
    const cons = [
      makeConsentRecord({ id: "c1", child_id: "yp_1", topic: "what_is_consent" }),
      makeConsentRecord({ id: "c2", child_id: "yp_1", topic: "saying_no" }),
      makeConsentRecord({ id: "c3", child_id: "yp_1", topic: "what_is_consent" }),
    ];
    const inp = baseInput({
      total_children: 1,
      rse_education_records: [makeRseRecord({ child_id: "yp_1" })],
      consent_education_records: cons,
      safeguarding_awareness_records: [makeSafeguardingRecord({ child_id: "yp_1" })],
    });
    const r = run(inp);
    const insight = r.insights.find(i => i.text.includes("Most frequent consent topics"));
    expect(insight).toBeDefined();
  });
});

// ── Edge cases ─────────────────────────────────────────────────────────────

describe("edge cases", () => {
  it("total_children = 1 with complete records", () => {
    const r = run(buildFullInput(1));
    expect(r.rse_rating).toBe("outstanding");
    expect(r.rse_score).toBe(80);
    expect(r.total_rse_sessions).toBe(1);
  });

  it("duplicate child_ids in RSE records count as 1 unique child", () => {
    const inp = baseInput({
      total_children: 2,
      rse_education_records: [
        makeRseRecord({ id: "rse_1", child_id: "yp_1" }),
        makeRseRecord({ id: "rse_2", child_id: "yp_1" }),
        makeRseRecord({ id: "rse_3", child_id: "yp_1" }),
      ],
      consent_education_records: [makeConsentRecord({ child_id: "yp_1" })],
      safeguarding_awareness_records: [makeSafeguardingRecord({ child_id: "yp_1" })],
    });
    const r = run(inp);
    expect(r.rse_delivery_rate).toBe(50);
    expect(r.total_rse_sessions).toBe(3);
  });

  it("score is clamped to 0 minimum", () => {
    const r = run(buildPoorInput(3));
    expect(r.rse_score).toBeGreaterThanOrEqual(0);
  });

  it("score is clamped to 100 maximum", () => {
    const r = run(buildFullInput(10));
    expect(r.rse_score).toBeLessThanOrEqual(100);
    expect(r.rse_score).toBe(80);
  });

  it("screening_compliance_avg handles all false metrics", () => {
    const scrs = [makeScreeningRecord({
      child_id: "yp_1",
      completed: false,
      child_consented: false,
      confidentiality_explained: false,
    })];
    const inp = baseInput({
      total_children: 1,
      rse_education_records: [makeRseRecord({ child_id: "yp_1" })],
      sexual_health_screening_records: scrs,
      consent_education_records: [makeConsentRecord({ child_id: "yp_1" })],
      safeguarding_awareness_records: [makeSafeguardingRecord({ child_id: "yp_1" })],
    });
    const r = run(inp);
    expect(r.screening_compliance_avg).toBe(0);
  });

  it("single child with all record types filled out perfectly", () => {
    const r = run(buildFullInput(1));
    expect(r.rse_delivery_rate).toBe(100);
    expect(r.health_screening_rate).toBe(100);
    expect(r.consent_education_rate).toBe(100);
    expect(r.safeguarding_awareness_rate).toBe(100);
    expect(r.child_confidence_rate).toBe(100);
    expect(r.screening_compliance_avg).toBe(100);
    expect(r.consent_understanding_avg).toBe(100);
  });

  it("multiple records per child do not inflate unique child count", () => {
    const inp = baseInput({
      total_children: 1,
      rse_education_records: [
        makeRseRecord({ id: "rse_1", child_id: "yp_1" }),
        makeRseRecord({ id: "rse_2", child_id: "yp_1" }),
      ],
      sexual_health_screening_records: [
        makeScreeningRecord({ id: "scr_1", child_id: "yp_1" }),
        makeScreeningRecord({ id: "scr_2", child_id: "yp_1" }),
      ],
      consent_education_records: [
        makeConsentRecord({ id: "con_1", child_id: "yp_1" }),
        makeConsentRecord({ id: "con_2", child_id: "yp_1" }),
      ],
      safeguarding_awareness_records: [
        makeSafeguardingRecord({ id: "sg_1", child_id: "yp_1" }),
        makeSafeguardingRecord({ id: "sg_2", child_id: "yp_1" }),
      ],
    });
    const r = run(inp);
    expect(r.rse_delivery_rate).toBe(100);
    expect(r.health_screening_rate).toBe(100);
    expect(r.consent_education_rate).toBe(100);
    expect(r.safeguarding_awareness_rate).toBe(100);
  });

  it("toRating boundary: score 80 = outstanding", () => {
    const r = run(buildFullInput(3));
    expect(r.rse_score).toBe(80);
    expect(r.rse_rating).toBe("outstanding");
  });

  it("toRating boundary: score 75 = good (no screenings -> no B2)", () => {
    const inp = buildFullInput(3);
    inp.sexual_health_screening_records = [];
    const r = run(inp);
    // 52 + 4+0+3+4+4+3+3+2+0 = 75
    expect(r.rse_score).toBe(75);
    expect(r.rse_rating).toBe("good");
  });

  it("toRating boundary: score 65 = good", () => {
    const inp = baseInput({
      total_children: 2,
      rse_education_records: [makeRseRecord({ child_id: "yp_1" })],
      sexual_health_screening_records: [
        makeScreeningRecord({ id: "scr_1", child_id: "yp_1" }),
        makeScreeningRecord({ id: "scr_2", child_id: "yp_2" }),
      ],
      consent_education_records: [makeConsentRecord({ child_id: "yp_1" })],
      safeguarding_awareness_records: [makeSafeguardingRecord({ child_id: "yp_1" })],
    });
    const r = run(inp);
    // 52 + 4+3+3+2+1 = 65
    expect(r.rse_score).toBe(65);
    expect(r.rse_rating).toBe("good");
  });

  it("toRating boundary: score 64 = adequate", () => {
    const inp = baseInput({
      total_children: 4,
      rse_education_records: [
        makeRseRecord({ id: "rse_1", child_id: "yp_1" }),
        makeRseRecord({ id: "rse_2", child_id: "yp_2" }),
      ],
      sexual_health_screening_records: [
        makeScreeningRecord({ id: "scr_1", child_id: "yp_1" }),
        makeScreeningRecord({ id: "scr_2", child_id: "yp_2" }),
      ],
      age_guidance_records: [
        makeGuidanceRecord({ id: "guid_1", child_id: "yp_1" }),
        makeGuidanceRecord({ id: "guid_2", child_id: "yp_2" }),
      ],
      consent_education_records: [
        makeConsentRecord({ id: "con_1", child_id: "yp_1" }),
        makeConsentRecord({ id: "con_2", child_id: "yp_2" }),
      ],
      safeguarding_awareness_records: [
        makeSafeguardingRecord({ id: "sg_1", child_id: "yp_1" }),
        makeSafeguardingRecord({ id: "sg_2", child_id: "yp_2" }),
      ],
    });
    const r = run(inp);
    expect(r.rse_score).toBe(64);
    expect(r.rse_rating).toBe("adequate");
  });

  it("toRating boundary: score 43 = inadequate (all penalties)", () => {
    const inp = baseInput({
      total_children: 10,
      rse_education_records: Array.from({ length: 4 }, (_, i) => makeRseRecord({ id: `rse_${i}`, child_id: `yp_${i + 1}` })),
      sexual_health_screening_records: Array.from({ length: 3 }, (_, i) => makeScreeningRecord({ id: `scr_${i}`, child_id: `yp_${i + 1}` })),
      consent_education_records: Array.from({ length: 4 }, (_, i) => makeConsentRecord({ id: `con_${i}`, child_id: `yp_${i + 1}` })),
      safeguarding_awareness_records: Array.from({ length: 4 }, (_, i) => makeSafeguardingRecord({ id: `sg_${i}`, child_id: `yp_${i + 1}` })),
    });
    const r = run(inp);
    // 52 + 3+3+2+1 - 5-5-4-4 = 43
    expect(r.rse_score).toBe(43);
    expect(r.rse_rating).toBe("inadequate");
  });

  it("large number of children (50) with full data", () => {
    const r = run(buildFullInput(50));
    expect(r.rse_rating).toBe("outstanding");
    expect(r.rse_score).toBe(80);
    expect(r.total_rse_sessions).toBe(50);
  });

  it("records exist but total_children = 0 still computes (not insufficient_data)", () => {
    const inp = baseInput({
      total_children: 0,
      rse_education_records: [makeRseRecord({ child_id: "yp_1" })],
    });
    const r = run(inp);
    expect(r.rse_rating).not.toBe("insufficient_data");
    expect(r.rse_delivery_rate).toBe(0);
  });

  it("follow-up needed but completed correctly counted", () => {
    const rseRecs = [
      makeRseRecord({ id: "r1", child_id: "yp_1", follow_up_needed: true, follow_up_completed: true }),
      makeRseRecord({ id: "r2", child_id: "yp_2", follow_up_needed: true, follow_up_completed: false }),
      makeRseRecord({ id: "r3", child_id: "yp_3", follow_up_needed: false, follow_up_completed: false }),
    ];
    const inp = baseInput({
      total_children: 3,
      rse_education_records: rseRecs,
      consent_education_records: Array.from({ length: 3 }, (_, i) => makeConsentRecord({ id: `con_${i}`, child_id: `yp_${i + 1}` })),
      safeguarding_awareness_records: Array.from({ length: 3 }, (_, i) => makeSafeguardingRecord({ id: `sg_${i}`, child_id: `yp_${i + 1}` })),
    });
    const r = run(inp);
    // follow-up completion rate = pct(1, 2) = 50% => < 70 triggers recommendation
    expect(r.recommendations.some(rec => rec.recommendation.includes("RSE follow-up completion"))).toBe(true);
  });

  it("screening outcome_recorded only counted for completed screenings", () => {
    const scrs = [
      makeScreeningRecord({ id: "s1", child_id: "yp_1", completed: true, outcome_recorded: true }),
      makeScreeningRecord({ id: "s2", child_id: "yp_2", completed: false, outcome_recorded: true }),
    ];
    const inp = baseInput({
      total_children: 2,
      rse_education_records: [makeRseRecord({ child_id: "yp_1" })],
      sexual_health_screening_records: scrs,
      consent_education_records: [makeConsentRecord({ child_id: "yp_1" })],
      safeguarding_awareness_records: [makeSafeguardingRecord({ child_id: "yp_1" })],
    });
    const r = run(inp);
    expect(r.health_screening_rate).toBe(100);
  });

  it("handles mixed session types in RSE records", () => {
    const rseRecs: RseEducationRecordInput[] = [
      makeRseRecord({ id: "r1", child_id: "yp_1", session_type: "one_to_one" }),
      makeRseRecord({ id: "r2", child_id: "yp_2", session_type: "group" }),
      makeRseRecord({ id: "r3", child_id: "yp_3", session_type: "workshop" }),
      makeRseRecord({ id: "r4", child_id: "yp_4", session_type: "online" }),
      makeRseRecord({ id: "r5", child_id: "yp_5", session_type: "peer_led" }),
    ];
    const inp = baseInput({
      total_children: 5,
      rse_education_records: rseRecs,
      consent_education_records: Array.from({ length: 5 }, (_, i) => makeConsentRecord({ id: `con_${i}`, child_id: `yp_${i + 1}` })),
      safeguarding_awareness_records: Array.from({ length: 5 }, (_, i) => makeSafeguardingRecord({ id: `sg_${i}`, child_id: `yp_${i + 1}` })),
    });
    const r = run(inp);
    expect(r.total_rse_sessions).toBe(5);
    expect(r.rse_delivery_rate).toBe(100);
  });

  it("guidance topic coverage counts unique topics", () => {
    const guids = [
      makeGuidanceRecord({ id: "g1", child_id: "yp_1", topic: "puberty" }),
      makeGuidanceRecord({ id: "g2", child_id: "yp_1", topic: "puberty" }),
      makeGuidanceRecord({ id: "g3", child_id: "yp_1", topic: "consent" }),
    ];
    const inp = baseInput({
      total_children: 1,
      rse_education_records: [makeRseRecord({ child_id: "yp_1" })],
      age_guidance_records: guids,
      consent_education_records: [makeConsentRecord({ child_id: "yp_1" })],
      safeguarding_awareness_records: [makeSafeguardingRecord({ child_id: "yp_1" })],
    });
    const r = run(inp);
    expect(r.age_appropriate_rate).toBe(100);
  });

  it("consent review overdue singular wording", () => {
    const inp = baseInput({
      total_children: 2,
      rse_education_records: [makeRseRecord({ child_id: "yp_1" })],
      consent_education_records: [makeConsentRecord({ child_id: "yp_1", review_overdue: true })],
      safeguarding_awareness_records: [makeSafeguardingRecord({ child_id: "yp_1" })],
    });
    const r = run(inp);
    expect(r.concerns.some(c => c.includes("1 consent education review is overdue"))).toBe(true);
  });

  it("consent review overdue plural wording", () => {
    const inp = baseInput({
      total_children: 2,
      rse_education_records: [makeRseRecord({ child_id: "yp_1" })],
      consent_education_records: [
        makeConsentRecord({ id: "c1", child_id: "yp_1", review_overdue: true }),
        makeConsentRecord({ id: "c2", child_id: "yp_2", review_overdue: true }),
      ],
      safeguarding_awareness_records: [makeSafeguardingRecord({ child_id: "yp_1" })],
    });
    const r = run(inp);
    expect(r.concerns.some(c => c.includes("2 consent education reviews are overdue"))).toBe(true);
  });

  it("safeguarding review overdue singular wording", () => {
    const inp = baseInput({
      total_children: 2,
      rse_education_records: [makeRseRecord({ child_id: "yp_1" })],
      consent_education_records: [makeConsentRecord({ child_id: "yp_1" })],
      safeguarding_awareness_records: [makeSafeguardingRecord({ child_id: "yp_1", review_overdue: true })],
    });
    const r = run(inp);
    expect(r.concerns.some(c => c.includes("1 safeguarding awareness review is overdue"))).toBe(true);
  });

  it("safeguarding review overdue plural wording", () => {
    const inp = baseInput({
      total_children: 2,
      rse_education_records: [makeRseRecord({ child_id: "yp_1" })],
      consent_education_records: [makeConsentRecord({ child_id: "yp_1" })],
      safeguarding_awareness_records: [
        makeSafeguardingRecord({ id: "sg1", child_id: "yp_1", review_overdue: true }),
        makeSafeguardingRecord({ id: "sg2", child_id: "yp_2", review_overdue: true }),
      ],
    });
    const r = run(inp);
    expect(r.concerns.some(c => c.includes("2 safeguarding awareness reviews are overdue"))).toBe(true);
  });
});

// ── Headline wording ───────────────────────────────────────────────────────

describe("headline wording", () => {
  it("outstanding headline is fixed text", () => {
    const r = run(buildFullInput(3));
    expect(r.headline).toBe("Outstanding RSE education and sexual health support — children receive comprehensive relationships and sex education, consent understanding is strong, and safeguarding awareness is embedded.");
  });

  it("good headline includes strength and concern counts", () => {
    const inp = baseInput({
      total_children: 4,
      rse_education_records: [
        makeRseRecord({ id: "rse_1", child_id: "yp_1" }),
        makeRseRecord({ id: "rse_2", child_id: "yp_2" }),
        makeRseRecord({ id: "rse_3", child_id: "yp_3" }),
      ],
      sexual_health_screening_records: Array.from({ length: 4 }, (_, i) => makeScreeningRecord({ id: `scr_${i}`, child_id: `yp_${i + 1}` })),
      age_guidance_records: Array.from({ length: 4 }, (_, i) => makeGuidanceRecord({ id: `guid_${i}`, child_id: `yp_${i + 1}` })),
      consent_education_records: Array.from({ length: 4 }, (_, i) => makeConsentRecord({ id: `con_${i}`, child_id: `yp_${i + 1}` })),
      safeguarding_awareness_records: Array.from({ length: 4 }, (_, i) => makeSafeguardingRecord({ id: `sg_${i}`, child_id: `yp_${i + 1}` })),
    });
    const r = run(inp);
    expect(r.headline).toContain("Good RSE education");
    expect(r.headline).toContain("strength");
  });

  it("inadequate headline includes concern count", () => {
    const r = run(buildPoorInput(3));
    expect(r.headline).toContain("inadequate");
    expect(r.headline).toContain("concern");
  });
});

// ── total_rse_sessions ────────────────────────────────────────────────────

describe("total_rse_sessions", () => {
  it("counts all RSE records regardless of child duplication", () => {
    const inp = baseInput({
      total_children: 2,
      rse_education_records: [
        makeRseRecord({ id: "rse_1", child_id: "yp_1" }),
        makeRseRecord({ id: "rse_2", child_id: "yp_1" }),
        makeRseRecord({ id: "rse_3", child_id: "yp_2" }),
        makeRseRecord({ id: "rse_4", child_id: "yp_2" }),
        makeRseRecord({ id: "rse_5", child_id: "yp_2" }),
      ],
      consent_education_records: [makeConsentRecord({ child_id: "yp_1" })],
      safeguarding_awareness_records: [makeSafeguardingRecord({ child_id: "yp_1" })],
    });
    const r = run(inp);
    expect(r.total_rse_sessions).toBe(5);
  });
});

// ── Additional boundary + isolation tests ──────────────────────────────────

describe("additional coverage and boundary tests", () => {
  it("healthScreeningRate 40-79 concern (mid-range)", () => {
    const inp = baseInput({
      total_children: 10,
      rse_education_records: Array.from({ length: 5 }, (_, i) => makeRseRecord({ id: `rse_${i}`, child_id: `yp_${i + 1}` })),
      sexual_health_screening_records: Array.from({ length: 5 }, (_, i) => makeScreeningRecord({ id: `scr_${i}`, child_id: `yp_${i + 1}` })),
      consent_education_records: Array.from({ length: 5 }, (_, i) => makeConsentRecord({ id: `con_${i}`, child_id: `yp_${i + 1}` })),
      safeguarding_awareness_records: Array.from({ length: 5 }, (_, i) => makeSafeguardingRecord({ id: `sg_${i}`, child_id: `yp_${i + 1}` })),
    });
    const r = run(inp);
    // healthScreeningRate = 50% -> 40-79 concern
    expect(r.concerns.some(c => c.includes("Health screening rate at 50%"))).toBe(true);
  });

  it("ageAppropriateRate 70-79 concern (mid-range)", () => {
    // 10 guidance records, 7 age_appropriate = 70%
    const guids = [];
    for (let i = 1; i <= 7; i++) {
      guids.push(makeGuidanceRecord({ id: `g${i}`, child_id: "yp_1", age_appropriate: true }));
    }
    for (let i = 8; i <= 10; i++) {
      guids.push(makeGuidanceRecord({ id: `g${i}`, child_id: "yp_1", age_appropriate: false }));
    }
    const inp = baseInput({
      total_children: 2,
      rse_education_records: [makeRseRecord({ child_id: "yp_1" })],
      age_guidance_records: guids,
      consent_education_records: [makeConsentRecord({ child_id: "yp_1" })],
      safeguarding_awareness_records: [makeSafeguardingRecord({ child_id: "yp_1" })],
    });
    const r = run(inp);
    expect(r.age_appropriate_rate).toBe(70);
    expect(r.concerns.some(c => c.includes("Age-appropriate guidance rate at 70%"))).toBe(true);
  });

  it("consentEducationRate 50-79 concern (mid-range)", () => {
    const inp = baseInput({
      total_children: 10,
      rse_education_records: Array.from({ length: 5 }, (_, i) => makeRseRecord({ id: `rse_${i}`, child_id: `yp_${i + 1}` })),
      consent_education_records: Array.from({ length: 6 }, (_, i) => makeConsentRecord({ id: `con_${i}`, child_id: `yp_${i + 1}` })),
      safeguarding_awareness_records: Array.from({ length: 5 }, (_, i) => makeSafeguardingRecord({ id: `sg_${i}`, child_id: `yp_${i + 1}` })),
    });
    const r = run(inp);
    expect(r.consent_education_rate).toBe(60);
    expect(r.concerns.some(c => c.includes("Consent education coverage at 60%"))).toBe(true);
  });

  it("safeguardingAwarenessRate 50-79 concern (mid-range)", () => {
    const inp = baseInput({
      total_children: 10,
      rse_education_records: Array.from({ length: 5 }, (_, i) => makeRseRecord({ id: `rse_${i}`, child_id: `yp_${i + 1}` })),
      consent_education_records: Array.from({ length: 5 }, (_, i) => makeConsentRecord({ id: `con_${i}`, child_id: `yp_${i + 1}` })),
      safeguarding_awareness_records: Array.from({ length: 6 }, (_, i) => makeSafeguardingRecord({ id: `sg_${i}`, child_id: `yp_${i + 1}` })),
    });
    const r = run(inp);
    expect(r.safeguarding_awareness_rate).toBe(60);
    expect(r.concerns.some(c => c.includes("Safeguarding awareness assessment at 60%"))).toBe(true);
  });

  it("childConfidenceRate 50-69 concern (mid-range)", () => {
    // 4 safeguarding: 2 confident, 2 not; 4 consent: 2 demonstrate, 2 not
    const sgs = [
      makeSafeguardingRecord({ id: "sg_1", child_id: "yp_1", child_confidence_score: 8 }),
      makeSafeguardingRecord({ id: "sg_2", child_id: "yp_2", child_confidence_score: 8 }),
      makeSafeguardingRecord({ id: "sg_3", child_id: "yp_3", child_confidence_score: 3 }),
      makeSafeguardingRecord({ id: "sg_4", child_id: "yp_4", child_confidence_score: 3 }),
    ];
    const cons = [
      makeConsentRecord({ id: "c1", child_id: "yp_1", child_demonstrated_understanding: true }),
      makeConsentRecord({ id: "c2", child_id: "yp_2", child_demonstrated_understanding: true }),
      makeConsentRecord({ id: "c3", child_id: "yp_3", child_demonstrated_understanding: false }),
      makeConsentRecord({ id: "c4", child_id: "yp_4", child_demonstrated_understanding: false }),
    ];
    const inp = baseInput({
      total_children: 4,
      rse_education_records: Array.from({ length: 4 }, (_, i) => makeRseRecord({ id: `rse_${i}`, child_id: `yp_${i + 1}` })),
      consent_education_records: cons,
      safeguarding_awareness_records: sgs,
    });
    const r = run(inp);
    // pct(2+2, 4+4) = 50 -> 50-69 range
    expect(r.child_confidence_rate).toBe(50);
    expect(r.concerns.some(c => c.includes("Child confidence rate at 50%"))).toBe(true);
  });

  it("consentUnderstandingAvg 40-59 concern (mid-range)", () => {
    // 4 consent: 2 with all true, 2 with all false -> each metric = 50%, avg = 50
    const cons = [
      makeConsentRecord({ id: "c1", child_id: "yp_1" }),
      makeConsentRecord({ id: "c2", child_id: "yp_2" }),
      makeConsentRecord({ id: "c3", child_id: "yp_3", child_demonstrated_understanding: false, child_can_articulate_consent: false, child_identifies_pressure: false, child_knows_who_to_tell: false }),
      makeConsentRecord({ id: "c4", child_id: "yp_4", child_demonstrated_understanding: false, child_can_articulate_consent: false, child_identifies_pressure: false, child_knows_who_to_tell: false }),
    ];
    const inp = baseInput({
      total_children: 4,
      rse_education_records: Array.from({ length: 4 }, (_, i) => makeRseRecord({ id: `rse_${i}`, child_id: `yp_${i + 1}` })),
      consent_education_records: cons,
      safeguarding_awareness_records: Array.from({ length: 4 }, (_, i) => makeSafeguardingRecord({ id: `sg_${i}`, child_id: `yp_${i + 1}` })),
    });
    const r = run(inp);
    expect(r.consent_understanding_avg).toBe(50);
    expect(r.concerns.some(c => c.includes("Consent understanding at 50%"))).toBe(true);
  });

  it("health screening 80% strength (mid-range)", () => {
    const inp = baseInput({
      total_children: 5,
      rse_education_records: Array.from({ length: 5 }, (_, i) => makeRseRecord({ id: `rse_${i}`, child_id: `yp_${i + 1}` })),
      sexual_health_screening_records: Array.from({ length: 4 }, (_, i) => makeScreeningRecord({ id: `scr_${i}`, child_id: `yp_${i + 1}` })),
      consent_education_records: Array.from({ length: 5 }, (_, i) => makeConsentRecord({ id: `con_${i}`, child_id: `yp_${i + 1}` })),
      safeguarding_awareness_records: Array.from({ length: 5 }, (_, i) => makeSafeguardingRecord({ id: `sg_${i}`, child_id: `yp_${i + 1}` })),
    });
    const r = run(inp);
    expect(r.strengths.some(s => s.includes("80%") && s.includes("sexual health screening"))).toBe(true);
  });

  it("age-appropriate 80% strength (mid-range)", () => {
    // 5 guidance, 4 age_appropriate = 80%
    const guids = [
      makeGuidanceRecord({ id: "g1", child_id: "yp_1", age_appropriate: true }),
      makeGuidanceRecord({ id: "g2", child_id: "yp_1", age_appropriate: true }),
      makeGuidanceRecord({ id: "g3", child_id: "yp_1", age_appropriate: true }),
      makeGuidanceRecord({ id: "g4", child_id: "yp_1", age_appropriate: true }),
      makeGuidanceRecord({ id: "g5", child_id: "yp_1", age_appropriate: false }),
    ];
    const inp = baseInput({
      total_children: 2,
      rse_education_records: [makeRseRecord({ child_id: "yp_1" })],
      age_guidance_records: guids,
      consent_education_records: [makeConsentRecord({ child_id: "yp_1" })],
      safeguarding_awareness_records: [makeSafeguardingRecord({ child_id: "yp_1" })],
    });
    const r = run(inp);
    expect(r.strengths.some(s => s.includes("80%") && s.includes("age-appropriate"))).toBe(true);
  });

  it("consent education 80% strength (mid-range)", () => {
    const inp = baseInput({
      total_children: 5,
      rse_education_records: Array.from({ length: 3 }, (_, i) => makeRseRecord({ id: `rse_${i}`, child_id: `yp_${i + 1}` })),
      consent_education_records: Array.from({ length: 4 }, (_, i) => makeConsentRecord({ id: `con_${i}`, child_id: `yp_${i + 1}` })),
      safeguarding_awareness_records: Array.from({ length: 3 }, (_, i) => makeSafeguardingRecord({ id: `sg_${i}`, child_id: `yp_${i + 1}` })),
    });
    const r = run(inp);
    expect(r.consent_education_rate).toBe(80);
    expect(r.strengths.some(s => s.includes("80%") && s.includes("consent education"))).toBe(true);
  });

  it("safeguarding 80% strength (mid-range)", () => {
    const inp = baseInput({
      total_children: 5,
      rse_education_records: Array.from({ length: 3 }, (_, i) => makeRseRecord({ id: `rse_${i}`, child_id: `yp_${i + 1}` })),
      consent_education_records: Array.from({ length: 3 }, (_, i) => makeConsentRecord({ id: `con_${i}`, child_id: `yp_${i + 1}` })),
      safeguarding_awareness_records: Array.from({ length: 4 }, (_, i) => makeSafeguardingRecord({ id: `sg_${i}`, child_id: `yp_${i + 1}` })),
    });
    const r = run(inp);
    expect(r.safeguarding_awareness_rate).toBe(80);
    expect(r.strengths.some(s => s.includes("80%") && s.includes("safeguarding awareness"))).toBe(true);
  });

  it("child confidence 70% strength (mid-range)", () => {
    // 10 sg: 7 confident, 3 not. No consent for simplicity.
    const sgs = [];
    for (let i = 1; i <= 7; i++) sgs.push(makeSafeguardingRecord({ id: `sg_${i}`, child_id: `yp_${i}`, child_confidence_score: 8 }));
    for (let i = 8; i <= 10; i++) sgs.push(makeSafeguardingRecord({ id: `sg_${i}`, child_id: `yp_${i}`, child_confidence_score: 3 }));
    const inp = baseInput({
      total_children: 10,
      rse_education_records: Array.from({ length: 10 }, (_, i) => makeRseRecord({ id: `rse_${i}`, child_id: `yp_${i + 1}` })),
      safeguarding_awareness_records: sgs,
    });
    const r = run(inp);
    expect(r.child_confidence_rate).toBe(70);
    expect(r.strengths.some(s => s.includes("70%") && s.includes("child confidence"))).toBe(true);
  });

  it("consent understanding 60% strength (mid-range)", () => {
    // 5 consent: 3 all true, 2 all false -> each metric = 60%, avg = 60
    const cons = [
      makeConsentRecord({ id: "c1", child_id: "yp_1" }),
      makeConsentRecord({ id: "c2", child_id: "yp_2" }),
      makeConsentRecord({ id: "c3", child_id: "yp_3" }),
      makeConsentRecord({ id: "c4", child_id: "yp_4", child_demonstrated_understanding: false, child_can_articulate_consent: false, child_identifies_pressure: false, child_knows_who_to_tell: false }),
      makeConsentRecord({ id: "c5", child_id: "yp_5", child_demonstrated_understanding: false, child_can_articulate_consent: false, child_identifies_pressure: false, child_knows_who_to_tell: false }),
    ];
    const inp = baseInput({
      total_children: 5,
      rse_education_records: Array.from({ length: 5 }, (_, i) => makeRseRecord({ id: `rse_${i}`, child_id: `yp_${i + 1}` })),
      consent_education_records: cons,
      safeguarding_awareness_records: Array.from({ length: 5 }, (_, i) => makeSafeguardingRecord({ id: `sg_${i}`, child_id: `yp_${i + 1}` })),
    });
    const r = run(inp);
    expect(r.consent_understanding_avg).toBe(60);
    expect(r.strengths.some(s => s.includes("Consent understanding at 60%"))).toBe(true);
  });

  it("RSE objectives 70% strength (mid-range)", () => {
    // 10 RSE: 7 met, 3 not
    const rseRecs = [];
    for (let i = 1; i <= 7; i++) rseRecs.push(makeRseRecord({ id: `rse_${i}`, child_id: `yp_${i}` }));
    for (let i = 8; i <= 10; i++) rseRecs.push(makeRseRecord({ id: `rse_${i}`, child_id: `yp_${i}`, learning_objectives_met: false }));
    const inp = baseInput({
      total_children: 10,
      rse_education_records: rseRecs,
      consent_education_records: Array.from({ length: 5 }, (_, i) => makeConsentRecord({ id: `con_${i}`, child_id: `yp_${i + 1}` })),
      safeguarding_awareness_records: Array.from({ length: 5 }, (_, i) => makeSafeguardingRecord({ id: `sg_${i}`, child_id: `yp_${i + 1}` })),
    });
    const r = run(inp);
    expect(r.strengths.some(s => s.includes("70%") && s.includes("RSE learning objectives"))).toBe(true);
  });

  it("facilitator qualified 70% strength (mid-range)", () => {
    // 10 RSE: 7 qualified, 3 not
    const rseRecs = [];
    for (let i = 1; i <= 7; i++) rseRecs.push(makeRseRecord({ id: `rse_${i}`, child_id: `yp_${i}` }));
    for (let i = 8; i <= 10; i++) rseRecs.push(makeRseRecord({ id: `rse_${i}`, child_id: `yp_${i}`, facilitator_qualified: false }));
    const inp = baseInput({
      total_children: 10,
      rse_education_records: rseRecs,
      consent_education_records: Array.from({ length: 5 }, (_, i) => makeConsentRecord({ id: `con_${i}`, child_id: `yp_${i + 1}` })),
      safeguarding_awareness_records: Array.from({ length: 5 }, (_, i) => makeSafeguardingRecord({ id: `sg_${i}`, child_id: `yp_${i + 1}` })),
    });
    const r = run(inp);
    expect(r.strengths.some(s => s.includes("70%") && s.includes("qualified facilitators"))).toBe(true);
  });

  it("exploitation recommendation when < 50", () => {
    const sgs = Array.from({ length: 4 }, (_, i) => makeSafeguardingRecord({
      id: `sg_${i}`, child_id: `yp_${i + 1}`, child_understands_exploitation: false,
    }));
    const inp = baseInput({
      total_children: 4,
      rse_education_records: Array.from({ length: 4 }, (_, i) => makeRseRecord({ id: `rse_${i}`, child_id: `yp_${i + 1}` })),
      consent_education_records: Array.from({ length: 4 }, (_, i) => makeConsentRecord({ id: `con_${i}`, child_id: `yp_${i + 1}` })),
      safeguarding_awareness_records: sgs,
    });
    const r = run(inp);
    const rec = r.recommendations.find(rec => rec.recommendation.includes("exploitation awareness education"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("immediate");
  });

  it("grooming recommendation when < 50", () => {
    const sgs = Array.from({ length: 4 }, (_, i) => makeSafeguardingRecord({
      id: `sg_${i}`, child_id: `yp_${i + 1}`, child_understands_grooming: false,
    }));
    const inp = baseInput({
      total_children: 4,
      rse_education_records: Array.from({ length: 4 }, (_, i) => makeRseRecord({ id: `rse_${i}`, child_id: `yp_${i + 1}` })),
      consent_education_records: Array.from({ length: 4 }, (_, i) => makeConsentRecord({ id: `con_${i}`, child_id: `yp_${i + 1}` })),
      safeguarding_awareness_records: sgs,
    });
    const r = run(inp);
    const rec = r.recommendations.find(rec => rec.recommendation.includes("grooming awareness education"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("immediate");
  });

  it("disclosure recommendation when < 50", () => {
    const sgs = Array.from({ length: 4 }, (_, i) => makeSafeguardingRecord({
      id: `sg_${i}`, child_id: `yp_${i + 1}`, child_willingness_to_disclose: false,
    }));
    const inp = baseInput({
      total_children: 4,
      rse_education_records: Array.from({ length: 4 }, (_, i) => makeRseRecord({ id: `rse_${i}`, child_id: `yp_${i + 1}` })),
      consent_education_records: Array.from({ length: 4 }, (_, i) => makeConsentRecord({ id: `con_${i}`, child_id: `yp_${i + 1}` })),
      safeguarding_awareness_records: sgs,
    });
    const r = run(inp);
    const rec = r.recommendations.find(rec => rec.recommendation.includes("barriers to disclosure"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("immediate");
  });

  it("facilitator qualification recommendation when < 50", () => {
    const rseRecs = Array.from({ length: 4 }, (_, i) => makeRseRecord({
      id: `rse_${i}`, child_id: `yp_${i + 1}`, facilitator_qualified: false,
    }));
    const inp = baseInput({
      total_children: 4,
      rse_education_records: rseRecs,
      consent_education_records: Array.from({ length: 4 }, (_, i) => makeConsentRecord({ id: `con_${i}`, child_id: `yp_${i + 1}` })),
      safeguarding_awareness_records: Array.from({ length: 4 }, (_, i) => makeSafeguardingRecord({ id: `sg_${i}`, child_id: `yp_${i + 1}` })),
    });
    const r = run(inp);
    const rec = r.recommendations.find(rec => rec.recommendation.includes("qualified, trained facilitators"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("immediate");
  });

  it("screening consent recommendation when < 70", () => {
    const scrs = Array.from({ length: 4 }, (_, i) => makeScreeningRecord({
      id: `scr_${i}`, child_id: `yp_${i + 1}`, child_consented: false,
    }));
    const inp = baseInput({
      total_children: 4,
      rse_education_records: Array.from({ length: 4 }, (_, i) => makeRseRecord({ id: `rse_${i}`, child_id: `yp_${i + 1}` })),
      sexual_health_screening_records: scrs,
      consent_education_records: Array.from({ length: 4 }, (_, i) => makeConsentRecord({ id: `con_${i}`, child_id: `yp_${i + 1}` })),
      safeguarding_awareness_records: Array.from({ length: 4 }, (_, i) => makeSafeguardingRecord({ id: `sg_${i}`, child_id: `yp_${i + 1}` })),
    });
    const r = run(inp);
    const rec = r.recommendations.find(rec => rec.recommendation.includes("consent protocol"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("immediate");
  });

  it("warning insight for healthScreeningRate 40-79", () => {
    const inp = baseInput({
      total_children: 10,
      rse_education_records: Array.from({ length: 5 }, (_, i) => makeRseRecord({ id: `rse_${i}`, child_id: `yp_${i + 1}` })),
      sexual_health_screening_records: Array.from({ length: 5 }, (_, i) => makeScreeningRecord({ id: `scr_${i}`, child_id: `yp_${i + 1}` })),
      consent_education_records: Array.from({ length: 5 }, (_, i) => makeConsentRecord({ id: `con_${i}`, child_id: `yp_${i + 1}` })),
      safeguarding_awareness_records: Array.from({ length: 5 }, (_, i) => makeSafeguardingRecord({ id: `sg_${i}`, child_id: `yp_${i + 1}` })),
    });
    const r = run(inp);
    const insight = r.insights.find(i => i.severity === "warning" && i.text.includes("Health screening rate at 50%"));
    expect(insight).toBeDefined();
  });

  it("warning insight for consentEducationRate 50-79", () => {
    const inp = baseInput({
      total_children: 10,
      rse_education_records: Array.from({ length: 5 }, (_, i) => makeRseRecord({ id: `rse_${i}`, child_id: `yp_${i + 1}` })),
      consent_education_records: Array.from({ length: 6 }, (_, i) => makeConsentRecord({ id: `con_${i}`, child_id: `yp_${i + 1}` })),
      safeguarding_awareness_records: Array.from({ length: 5 }, (_, i) => makeSafeguardingRecord({ id: `sg_${i}`, child_id: `yp_${i + 1}` })),
    });
    const r = run(inp);
    const insight = r.insights.find(i => i.severity === "warning" && i.text.includes("Consent education coverage at 60%"));
    expect(insight).toBeDefined();
  });

  it("warning insight for safeguardingAwarenessRate 50-79", () => {
    const inp = baseInput({
      total_children: 10,
      rse_education_records: Array.from({ length: 5 }, (_, i) => makeRseRecord({ id: `rse_${i}`, child_id: `yp_${i + 1}` })),
      consent_education_records: Array.from({ length: 5 }, (_, i) => makeConsentRecord({ id: `con_${i}`, child_id: `yp_${i + 1}` })),
      safeguarding_awareness_records: Array.from({ length: 6 }, (_, i) => makeSafeguardingRecord({ id: `sg_${i}`, child_id: `yp_${i + 1}` })),
    });
    const r = run(inp);
    const insight = r.insights.find(i => i.severity === "warning" && i.text.includes("Safeguarding awareness at 60%"));
    expect(insight).toBeDefined();
  });

  it("warning insight for childConfidenceRate 50-69", () => {
    const sgs = [
      makeSafeguardingRecord({ id: "sg_1", child_id: "yp_1", child_confidence_score: 8 }),
      makeSafeguardingRecord({ id: "sg_2", child_id: "yp_2", child_confidence_score: 8 }),
      makeSafeguardingRecord({ id: "sg_3", child_id: "yp_3", child_confidence_score: 3 }),
      makeSafeguardingRecord({ id: "sg_4", child_id: "yp_4", child_confidence_score: 3 }),
    ];
    const cons = [
      makeConsentRecord({ id: "c1", child_id: "yp_1", child_demonstrated_understanding: true }),
      makeConsentRecord({ id: "c2", child_id: "yp_2", child_demonstrated_understanding: true }),
      makeConsentRecord({ id: "c3", child_id: "yp_3", child_demonstrated_understanding: false }),
      makeConsentRecord({ id: "c4", child_id: "yp_4", child_demonstrated_understanding: false }),
    ];
    const inp = baseInput({
      total_children: 4,
      rse_education_records: Array.from({ length: 4 }, (_, i) => makeRseRecord({ id: `rse_${i}`, child_id: `yp_${i + 1}` })),
      consent_education_records: cons,
      safeguarding_awareness_records: sgs,
    });
    const r = run(inp);
    const insight = r.insights.find(i => i.severity === "warning" && i.text.includes("Child confidence rate at 50%"));
    expect(insight).toBeDefined();
  });

  it("warning insight for consentUnderstandingAvg 40-59", () => {
    const cons = [
      makeConsentRecord({ id: "c1", child_id: "yp_1" }),
      makeConsentRecord({ id: "c2", child_id: "yp_2" }),
      makeConsentRecord({ id: "c3", child_id: "yp_3", child_demonstrated_understanding: false, child_can_articulate_consent: false, child_identifies_pressure: false, child_knows_who_to_tell: false }),
      makeConsentRecord({ id: "c4", child_id: "yp_4", child_demonstrated_understanding: false, child_can_articulate_consent: false, child_identifies_pressure: false, child_knows_who_to_tell: false }),
    ];
    const inp = baseInput({
      total_children: 4,
      rse_education_records: Array.from({ length: 4 }, (_, i) => makeRseRecord({ id: `rse_${i}`, child_id: `yp_${i + 1}` })),
      consent_education_records: cons,
      safeguarding_awareness_records: Array.from({ length: 4 }, (_, i) => makeSafeguardingRecord({ id: `sg_${i}`, child_id: `yp_${i + 1}` })),
    });
    const r = run(inp);
    expect(r.consent_understanding_avg).toBe(50);
    const insight = r.insights.find(i => i.severity === "warning" && i.text.includes("Consent understanding at 50%"));
    expect(insight).toBeDefined();
  });

  it("warning insight for ageAppropriateRate 70-94", () => {
    const guids = [];
    for (let i = 1; i <= 8; i++) guids.push(makeGuidanceRecord({ id: `g${i}`, child_id: "yp_1", age_appropriate: true }));
    for (let i = 9; i <= 10; i++) guids.push(makeGuidanceRecord({ id: `g${i}`, child_id: "yp_1", age_appropriate: false }));
    const inp = baseInput({
      total_children: 2,
      rse_education_records: [makeRseRecord({ child_id: "yp_1" })],
      age_guidance_records: guids,
      consent_education_records: [makeConsentRecord({ child_id: "yp_1" })],
      safeguarding_awareness_records: [makeSafeguardingRecord({ child_id: "yp_1" })],
    });
    const r = run(inp);
    expect(r.age_appropriate_rate).toBe(80);
    const insight = r.insights.find(i => i.severity === "warning" && i.text.includes("Age-appropriateness confirmed for 80%"));
    expect(insight).toBeDefined();
  });

  it("warning insight for rseFacilitatorQualifiedRate 50-79", () => {
    const rseRecs = [];
    for (let i = 1; i <= 6; i++) rseRecs.push(makeRseRecord({ id: `rse_${i}`, child_id: `yp_${i}` }));
    for (let i = 7; i <= 10; i++) rseRecs.push(makeRseRecord({ id: `rse_${i}`, child_id: `yp_${i}`, facilitator_qualified: false }));
    const inp = baseInput({
      total_children: 10,
      rse_education_records: rseRecs,
      consent_education_records: Array.from({ length: 5 }, (_, i) => makeConsentRecord({ id: `con_${i}`, child_id: `yp_${i + 1}` })),
      safeguarding_awareness_records: Array.from({ length: 5 }, (_, i) => makeSafeguardingRecord({ id: `sg_${i}`, child_id: `yp_${i + 1}` })),
    });
    const r = run(inp);
    const insight = r.insights.find(i => i.severity === "warning" && i.text.includes("Qualified facilitators for 60%"));
    expect(insight).toBeDefined();
  });

  it("positive insight for comprehensive screening with consent + confidentiality", () => {
    const r = run(buildFullInput(3));
    const insight = r.insights.find(i => i.severity === "positive" && i.text.includes("Sexual health screening is comprehensive"));
    expect(insight).toBeDefined();
  });
});
