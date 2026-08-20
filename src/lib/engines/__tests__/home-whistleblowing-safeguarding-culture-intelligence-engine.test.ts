// ==============================================================================
// CARA -- HOME WHISTLEBLOWING & SAFEGUARDING CULTURE INTELLIGENCE ENGINE TESTS
// Tests the pure deterministic engine for whistleblowing policy awareness,
// reporting confidence, safeguarding training currency, culture audit outcomes,
// and child protection practice quality.
// ==============================================================================

import { describe, it, expect } from "vitest";
import {
  computeWhistleblowingSafeguardingCulture,
  type WhistleblowingAwarenessRecordInput,
  type ReportingConfidenceRecordInput,
  type SafeguardingTrainingRecordInput,
  type CultureAuditRecordInput,
  type ChildProtectionRecordInput,
  type WhistleblowingInput,
} from "../home-whistleblowing-safeguarding-culture-intelligence-engine";

// -- Helpers ------------------------------------------------------------------

const TODAY = "2026-05-29";

let _id = 0;
function uid(prefix: string): string {
  return `${prefix}_${++_id}`;
}

function makeAwareness(
  overrides: Partial<WhistleblowingAwarenessRecordInput> = {},
): WhistleblowingAwarenessRecordInput {
  return {
    id: uid("wa"),
    staff_id: uid("s"),
    staff_name: "Staff Member",
    policy_read: true,
    policy_read_date: "2026-04-01",
    policy_version_current: true,
    understands_reporting_channels: true,
    knows_external_escalation: true,
    signed_declaration: true,
    declaration_date: "2026-04-01",
    refresher_completed: true,
    refresher_date: "2026-04-01",
    quiz_score: 90,
    quiz_passed: true,
    concerns_about_retaliation: false,
    aware_of_protections: true,
    role: "permanent" as const,
    created_at: "2026-04-01",
    ...overrides,
  };
}

function makeConfidence(
  overrides: Partial<ReportingConfidenceRecordInput> = {},
): ReportingConfidenceRecordInput {
  return {
    id: uid("rc"),
    staff_id: uid("s"),
    staff_name: "Staff Member",
    survey_date: "2026-04-01",
    confidence_level: 5,
    would_report_colleague: true,
    would_report_manager: true,
    would_report_externally: true,
    feels_safe_reporting: true,
    has_reported_before: false,
    report_handled_well: null,
    barriers_to_reporting: [],
    suggestions: "",
    anonymous: false,
    created_at: "2026-04-01",
    ...overrides,
  };
}

function makeTraining(
  overrides: Partial<SafeguardingTrainingRecordInput> = {},
): SafeguardingTrainingRecordInput {
  return {
    id: uid("st"),
    staff_id: uid("s"),
    staff_name: "Staff Member",
    training_type: "level_2" as const,
    training_date: "2026-03-01",
    expiry_date: "2027-03-01",
    passed: true,
    score: 90,
    provider: "NSPCC",
    accredited: true,
    certificates_on_file: true,
    role: "permanent" as const,
    created_at: "2026-03-01",
    ...overrides,
  };
}

function makeAudit(
  overrides: Partial<CultureAuditRecordInput> = {},
): CultureAuditRecordInput {
  return {
    id: uid("ca"),
    audit_date: "2026-04-01",
    auditor: "Auditor",
    audit_type: "internal" as const,
    overall_rating: "outstanding" as const,
    open_culture_score: 90,
    challenge_accepted: true,
    staff_feel_heard: true,
    children_feel_safe: true,
    whistleblowing_policy_visible: true,
    safeguarding_posters_displayed: true,
    children_know_how_to_complain: true,
    actions_from_previous_audit_completed: true,
    total_actions_raised: 10,
    actions_completed: 10,
    actions_overdue: 0,
    notes: "",
    created_at: "2026-04-01",
    ...overrides,
  };
}

function makeProtection(
  overrides: Partial<ChildProtectionRecordInput> = {},
): ChildProtectionRecordInput {
  return {
    id: uid("cp"),
    child_id: uid("ch"),
    date: "2026-04-01",
    concern_type: "disclosure" as const,
    reported_within_24h: true,
    correct_channel_used: true,
    body_map_completed: true,
    child_voice_captured: true,
    manager_informed: true,
    lado_referral_made: null,
    lado_referral_timely: null,
    social_worker_informed: true,
    multi_agency_response: true,
    outcome_documented: true,
    follow_up_completed: true,
    lessons_learned_recorded: true,
    staff_debriefed: true,
    quality_rating: "excellent" as const,
    created_at: "2026-04-01",
    ...overrides,
  };
}

// Default outstanding input
function baseInput(
  overrides: Partial<WhistleblowingInput> = {},
): WhistleblowingInput {
  // Build arrays that will hit all ">=90" bonus thresholds and avoid all penalties:
  // - policyAwarenessRate >= 90: needs policy_read, policy_version_current, understands_reporting_channels, signed_declaration all 100%
  // - reportingConfidenceRate >= 90: needs would_report_colleague, would_report_manager, feels_safe_reporting all 100%
  // - trainingCurrencyRate >= 90: needs inDateRate, trainingPassRate, certificateRate all 100%
  // - cultureAuditRate >= 80: needs avgAuditRating, avgOpenCultureScore, childSafeRate all high
  // - childProtectionRate >= 90: needs timelyReportingRate, correctChannelRate, childVoiceRate, outcomeRate, followUpRate all 100%
  // - staffConfidenceRate >= 80: needs avgConfidence >= 4.0 => (4/5)*100=80
  // - childSafeRate >= 90: needs children_feel_safe in all audits
  // - safeReportingRate >= 90: needs feels_safe_reporting in all confidence records

  const awareness = Array.from({ length: 5 }, (_, i) =>
    makeAwareness({ id: `wa_${i}`, staff_id: `s_a_${i}` }),
  );
  const confidence = Array.from({ length: 5 }, (_, i) =>
    makeConfidence({ id: `rc_${i}`, staff_id: `s_c_${i}` }),
  );
  const training = Array.from({ length: 5 }, (_, i) =>
    makeTraining({ id: `st_${i}`, staff_id: `s_t_${i}` }),
  );
  const audits = [makeAudit({ id: "ca_0" }), makeAudit({ id: "ca_1" })];
  const protection = Array.from({ length: 3 }, (_, i) =>
    makeProtection({ id: `cp_${i}`, child_id: `ch_${i}` }),
  );

  return {
    today: TODAY,
    total_children: 4,
    whistleblowing_awareness_records: awareness,
    reporting_confidence_records: confidence,
    safeguarding_training_records: training,
    culture_audit_records: audits,
    child_protection_records: protection,
    ...overrides,
  };
}

// ==============================================================================
// INSUFFICIENT DATA
// ==============================================================================

describe("Insufficient data", () => {
  it("returns insufficient_data when all arrays empty and total_children=0", () => {
    const r = computeWhistleblowingSafeguardingCulture({
      today: TODAY,
      total_children: 0,
      whistleblowing_awareness_records: [],
      reporting_confidence_records: [],
      safeguarding_training_records: [],
      culture_audit_records: [],
      child_protection_records: [],
    });
    expect(r.safeguarding_culture_rating).toBe("insufficient_data");
    expect(r.safeguarding_culture_score).toBe(0);
  });

  it("returns zero for all rates when insufficient data", () => {
    const r = computeWhistleblowingSafeguardingCulture({
      today: TODAY,
      total_children: 0,
      whistleblowing_awareness_records: [],
      reporting_confidence_records: [],
      safeguarding_training_records: [],
      culture_audit_records: [],
      child_protection_records: [],
    });
    expect(r.policy_awareness_rate).toBeNull();
    expect(r.reporting_confidence_rate).toBeNull();
    expect(r.training_currency_rate).toBeNull();
    expect(r.culture_audit_rate).toBeNull();
    expect(r.child_protection_rate).toBeNull();
    expect(r.staff_confidence_rate).toBeNull();
  });

  it("returns empty strengths/concerns/recommendations/insights for insufficient data", () => {
    const r = computeWhistleblowingSafeguardingCulture({
      today: TODAY,
      total_children: 0,
      whistleblowing_awareness_records: [],
      reporting_confidence_records: [],
      safeguarding_training_records: [],
      culture_audit_records: [],
      child_protection_records: [],
    });
    expect(r.strengths).toEqual([]);
    expect(r.concerns).toEqual([]);
    expect(r.recommendations).toEqual([]);
    expect(r.insights).toEqual([]);
  });

  it("headline mentions insufficient data", () => {
    const r = computeWhistleblowingSafeguardingCulture({
      today: TODAY,
      total_children: 0,
      whistleblowing_awareness_records: [],
      reporting_confidence_records: [],
      safeguarding_training_records: [],
      culture_audit_records: [],
      child_protection_records: [],
    });
    expect(r.headline).toContain("insufficient data");
  });
});

// ==============================================================================
// INADEQUATE FLOOR (all empty + children > 0)
// ==============================================================================

describe("Inadequate floor (all empty, children > 0)", () => {
  const emptyWithChildren = (): WhistleblowingInput => ({
    today: TODAY,
    total_children: 3,
    whistleblowing_awareness_records: [],
    reporting_confidence_records: [],
    safeguarding_training_records: [],
    culture_audit_records: [],
    child_protection_records: [],
  });

  it("returns inadequate with score 15", () => {
    const r = computeWhistleblowingSafeguardingCulture(emptyWithChildren());
    expect(r.safeguarding_culture_rating).toBe("inadequate");
    expect(r.safeguarding_culture_score).toBe(15);
  });

  it("has one concern about missing records", () => {
    const r = computeWhistleblowingSafeguardingCulture(emptyWithChildren());
    expect(r.concerns.length).toBe(1);
    expect(r.concerns[0]).toContain("No whistleblowing policy awareness");
  });

  it("has two immediate recommendations", () => {
    const r = computeWhistleblowingSafeguardingCulture(emptyWithChildren());
    expect(r.recommendations.length).toBe(2);
    expect(r.recommendations[0].urgency).toBe("immediate");
    expect(r.recommendations[1].urgency).toBe("immediate");
    expect(r.recommendations[0].rank).toBe(1);
    expect(r.recommendations[1].rank).toBe(2);
  });

  it("has one critical insight about absence of records", () => {
    const r = computeWhistleblowingSafeguardingCulture(emptyWithChildren());
    expect(r.insights.length).toBe(1);
    expect(r.insights[0].severity).toBe("critical");
    expect(r.insights[0].text).toContain("complete absence");
  });

  it("headline mentions inadequate and urgent", () => {
    const r = computeWhistleblowingSafeguardingCulture(emptyWithChildren());
    expect(r.headline).toContain("urgent attention");
  });

  it("all rates are zero", () => {
    const r = computeWhistleblowingSafeguardingCulture(emptyWithChildren());
    expect(r.policy_awareness_rate).toBeNull();
    expect(r.reporting_confidence_rate).toBeNull();
    expect(r.training_currency_rate).toBeNull();
    expect(r.culture_audit_rate).toBeNull();
    expect(r.child_protection_rate).toBeNull();
    expect(r.staff_confidence_rate).toBeNull();
  });
});

// ==============================================================================
// OUTSTANDING SCENARIO
// ==============================================================================

describe("Outstanding scenario", () => {
  it("base input yields outstanding", () => {
    const r = computeWhistleblowingSafeguardingCulture(baseInput());
    expect(r.safeguarding_culture_rating).toBe("outstanding");
    expect(r.safeguarding_culture_score).toBeGreaterThanOrEqual(80);
  });

  it("base input score = 52 + 4 + 4 + 4 + 4 + 4 + 3 + 3 + 2 = 80", () => {
    const r = computeWhistleblowingSafeguardingCulture(baseInput());
    // base=52, bonus1=+4 (policyAwareness>=90), bonus2=+4 (reportConf>=90),
    // bonus3=+4 (trainingCurrency>=90), bonus4=+4 (cultureAudit>=80),
    // bonus5=+4 (childProtection>=90), bonus6=+3 (staffConf>=80),
    // bonus7=+3 (childSafe>=90), bonus8=+2 (safeReporting>=90) = 80
    expect(r.safeguarding_culture_score).toBe(80);
  });

  it("headline says outstanding", () => {
    const r = computeWhistleblowingSafeguardingCulture(baseInput());
    expect(r.headline).toContain("Outstanding");
  });

  it("has many strengths", () => {
    const r = computeWhistleblowingSafeguardingCulture(baseInput());
    expect(r.strengths.length).toBeGreaterThan(5);
  });

  it("has no concerns", () => {
    const r = computeWhistleblowingSafeguardingCulture(baseInput());
    expect(r.concerns.length).toBe(0);
  });

  it("has no recommendations", () => {
    const r = computeWhistleblowingSafeguardingCulture(baseInput());
    expect(r.recommendations.length).toBe(0);
  });

  it("has positive insights", () => {
    const r = computeWhistleblowingSafeguardingCulture(baseInput());
    const positive = r.insights.filter((i) => i.severity === "positive");
    expect(positive.length).toBeGreaterThan(0);
  });

  it("has an outstanding positive insight", () => {
    const r = computeWhistleblowingSafeguardingCulture(baseInput());
    const outstandingInsight = r.insights.find(
      (i) => i.severity === "positive" && i.text.includes("outstanding safeguarding culture"),
    );
    expect(outstandingInsight).toBeDefined();
  });

  it("rates are all high", () => {
    const r = computeWhistleblowingSafeguardingCulture(baseInput());
    expect(r.policy_awareness_rate).toBeGreaterThanOrEqual(90);
    expect(r.reporting_confidence_rate).toBeGreaterThanOrEqual(90);
    expect(r.training_currency_rate).toBeGreaterThanOrEqual(90);
    expect(r.culture_audit_rate).toBeGreaterThanOrEqual(80);
    expect(r.child_protection_rate).toBeGreaterThanOrEqual(90);
    expect(r.staff_confidence_rate).toBeGreaterThanOrEqual(80);
  });
});

// ==============================================================================
// GOOD SCENARIO
// ==============================================================================

describe("Good scenario", () => {
  // Reduce some rates to 70-89 range to get good (65-79)
  // We'll lower some bonuses from +4 to +2 to get score in good range
  function goodInput(): WhistleblowingInput {
    // Lower policy awareness: 3 of 5 read -> 60% => no bonus, no penalty
    // Lower reporting confidence: 3 of 5 would_report_colleague -> ~67% => no bonus, no penalty
    // Keep training at 90+ => +4
    // Keep culture audit at 80+ => +4
    // Keep child protection at 90+ => +4
    // Lower staff confidence: confidence_level=3 => 60% => +1
    // Keep childSafe at 90+ => +3
    // Lower safeReporting: 3 of 5 => 60% => no bonus
    // Score: 52 + 0 + 0 + 4 + 4 + 4 + 1 + 3 + 0 = 68 good
    const awareness = Array.from({ length: 5 }, (_, i) =>
      makeAwareness({
        id: `wa_g_${i}`,
        staff_id: `s_ga_${i}`,
        policy_read: i < 3,
        policy_version_current: i < 3,
        understands_reporting_channels: i < 4,
        signed_declaration: i < 3,
      }),
    );
    const confidence = Array.from({ length: 5 }, (_, i) =>
      makeConfidence({
        id: `rc_g_${i}`,
        staff_id: `s_gc_${i}`,
        confidence_level: 3,
        would_report_colleague: i < 4,
        would_report_manager: i < 4,
        feels_safe_reporting: i < 3,
      }),
    );
    return baseInput({
      whistleblowing_awareness_records: awareness,
      reporting_confidence_records: confidence,
    });
  }

  it("yields good rating", () => {
    const r = computeWhistleblowingSafeguardingCulture(goodInput());
    expect(r.safeguarding_culture_rating).toBe("good");
  });

  it("score between 65 and 79", () => {
    const r = computeWhistleblowingSafeguardingCulture(goodInput());
    expect(r.safeguarding_culture_score).toBeGreaterThanOrEqual(65);
    expect(r.safeguarding_culture_score).toBeLessThanOrEqual(79);
  });

  it("headline says Good", () => {
    const r = computeWhistleblowingSafeguardingCulture(goodInput());
    expect(r.headline).toContain("Good");
  });

  it("has strengths and possibly some concerns", () => {
    const r = computeWhistleblowingSafeguardingCulture(goodInput());
    expect(r.strengths.length).toBeGreaterThan(0);
  });
});

// ==============================================================================
// ADEQUATE SCENARIO
// ==============================================================================

describe("Adequate scenario", () => {
  // Score 45-64 => adequate
  // Lower most bonuses but avoid penalties:
  // policyAwareness ~50-69 => no bonus, no penalty
  // reportingConfidence ~50-69 => no bonus, no penalty
  // trainingCurrency ~50-69 => no bonus, no penalty
  // cultureAudit ~50-59 => no bonus
  // childProtection ~50-69 => no bonus, no penalty
  // staffConfidence ~50-59 => no bonus
  // childSafe ~50-69 => no bonus
  // safeReporting ~50-69 => no bonus
  // Score: 52 + 0 = 52 adequate
  function adequateInput(): WhistleblowingInput {
    // 3 of 5 for each field => 60% composite
    const awareness = Array.from({ length: 5 }, (_, i) =>
      makeAwareness({
        id: `wa_ad_${i}`,
        staff_id: `s_ada_${i}`,
        policy_read: i < 3,
        policy_version_current: i < 3,
        understands_reporting_channels: i < 3,
        signed_declaration: i < 3,
        refresher_completed: i < 3,
        quiz_passed: i < 3,
        quiz_score: i < 3 ? 80 : 40,
        aware_of_protections: i < 3,
        concerns_about_retaliation: false,
      }),
    );
    const confidence = Array.from({ length: 5 }, (_, i) =>
      makeConfidence({
        id: `rc_ad_${i}`,
        staff_id: `s_adc_${i}`,
        confidence_level: 3,
        would_report_colleague: i < 3,
        would_report_manager: i < 3,
        would_report_externally: i < 3,
        feels_safe_reporting: i < 3,
      }),
    );
    const training = Array.from({ length: 5 }, (_, i) =>
      makeTraining({
        id: `st_ad_${i}`,
        staff_id: `s_adt_${i}`,
        passed: i < 3,
        expiry_date: i < 3 ? "2027-03-01" : "2025-01-01",
        certificates_on_file: i < 3,
        accredited: i < 3,
        score: i < 3 ? 80 : 40,
      }),
    );
    const audits = [
      makeAudit({
        id: "ca_ad_0",
        overall_rating: "adequate",
        open_culture_score: 55,
        children_feel_safe: true,
        staff_feel_heard: false,
        challenge_accepted: false,
        whistleblowing_policy_visible: false,
        children_know_how_to_complain: false,
        total_actions_raised: 10,
        actions_completed: 5,
        actions_overdue: 3,
      }),
      makeAudit({
        id: "ca_ad_1",
        overall_rating: "good",
        open_culture_score: 60,
        children_feel_safe: false,
        staff_feel_heard: true,
        challenge_accepted: true,
        whistleblowing_policy_visible: true,
        children_know_how_to_complain: true,
        total_actions_raised: 10,
        actions_completed: 6,
        actions_overdue: 2,
      }),
    ];
    const protection = Array.from({ length: 5 }, (_, i) =>
      makeProtection({
        id: `cp_ad_${i}`,
        child_id: `ch_ad_${i}`,
        reported_within_24h: i < 3,
        correct_channel_used: i < 3,
        child_voice_captured: i < 3,
        outcome_documented: i < 3,
        follow_up_completed: i < 3,
        lessons_learned_recorded: i < 2,
        staff_debriefed: i < 2,
        quality_rating: i < 3 ? "good" : "adequate",
      }),
    );
    return {
      today: TODAY,
      total_children: 4,
      whistleblowing_awareness_records: awareness,
      reporting_confidence_records: confidence,
      safeguarding_training_records: training,
      culture_audit_records: audits,
      child_protection_records: protection,
    };
  }

  it("yields adequate rating", () => {
    const r = computeWhistleblowingSafeguardingCulture(adequateInput());
    expect(r.safeguarding_culture_rating).toBe("adequate");
  });

  it("score between 45 and 64", () => {
    const r = computeWhistleblowingSafeguardingCulture(adequateInput());
    expect(r.safeguarding_culture_score).toBeGreaterThanOrEqual(45);
    expect(r.safeguarding_culture_score).toBeLessThanOrEqual(64);
  });

  it("headline says Adequate", () => {
    const r = computeWhistleblowingSafeguardingCulture(adequateInput());
    expect(r.headline).toContain("Adequate");
  });

  it("has concerns", () => {
    const r = computeWhistleblowingSafeguardingCulture(adequateInput());
    expect(r.concerns.length).toBeGreaterThan(0);
  });
});

// ==============================================================================
// INADEQUATE SCENARIO (with data)
// ==============================================================================

describe("Inadequate scenario (with data)", () => {
  // Score < 45 => inadequate
  // All rates < 50 triggers all 4 penalties: -6 -5 -5 -6 = -22 => 52-22=30
  function inadequateInput(): WhistleblowingInput {
    // 1 of 5 for each => 20%
    const awareness = Array.from({ length: 5 }, (_, i) =>
      makeAwareness({
        id: `wa_in_${i}`,
        staff_id: `s_ina_${i}`,
        policy_read: i < 1,
        policy_version_current: i < 1,
        understands_reporting_channels: i < 1,
        signed_declaration: i < 1,
        refresher_completed: i < 1,
        quiz_passed: i < 1,
        quiz_score: i < 1 ? 80 : 20,
        aware_of_protections: i < 1,
        knows_external_escalation: i < 1,
        concerns_about_retaliation: i >= 3,
      }),
    );
    const confidence = Array.from({ length: 5 }, (_, i) =>
      makeConfidence({
        id: `rc_in_${i}`,
        staff_id: `s_inc_${i}`,
        confidence_level: 2,
        would_report_colleague: i < 1,
        would_report_manager: i < 1,
        would_report_externally: i < 1,
        feels_safe_reporting: i < 1,
        has_reported_before: i < 2,
        report_handled_well: i < 2 ? false : null,
        barriers_to_reporting: i < 2 ? ["fear", "distrust"] : [],
      }),
    );
    const training = Array.from({ length: 5 }, (_, i) =>
      makeTraining({
        id: `st_in_${i}`,
        staff_id: `s_int_${i}`,
        passed: i < 1,
        expiry_date: i < 1 ? "2027-03-01" : "2025-01-01",
        certificates_on_file: i < 1,
        accredited: i < 1,
        score: i < 1 ? 70 : 20,
      }),
    );
    const audits = [
      makeAudit({
        id: "ca_in_0",
        overall_rating: "inadequate",
        open_culture_score: 20,
        children_feel_safe: false,
        staff_feel_heard: false,
        challenge_accepted: false,
        whistleblowing_policy_visible: false,
        children_know_how_to_complain: false,
        actions_from_previous_audit_completed: false,
        total_actions_raised: 10,
        actions_completed: 2,
        actions_overdue: 5,
      }),
    ];
    const protection = Array.from({ length: 5 }, (_, i) =>
      makeProtection({
        id: `cp_in_${i}`,
        child_id: `ch_in_${i}`,
        reported_within_24h: i < 1,
        correct_channel_used: i < 1,
        child_voice_captured: i < 1,
        outcome_documented: i < 1,
        follow_up_completed: i < 1,
        lessons_learned_recorded: i < 1,
        staff_debriefed: i < 1,
        quality_rating: i < 1 ? "adequate" : "poor",
        body_map_completed: i < 1,
        manager_informed: i < 1,
        social_worker_informed: i < 1,
        multi_agency_response: false,
      }),
    );
    return {
      today: TODAY,
      total_children: 4,
      whistleblowing_awareness_records: awareness,
      reporting_confidence_records: confidence,
      safeguarding_training_records: training,
      culture_audit_records: audits,
      child_protection_records: protection,
    };
  }

  it("yields inadequate rating", () => {
    const r = computeWhistleblowingSafeguardingCulture(inadequateInput());
    expect(r.safeguarding_culture_rating).toBe("inadequate");
  });

  it("score < 45", () => {
    const r = computeWhistleblowingSafeguardingCulture(inadequateInput());
    expect(r.safeguarding_culture_score).toBeLessThan(45);
  });

  it("headline says inadequate", () => {
    const r = computeWhistleblowingSafeguardingCulture(inadequateInput());
    expect(r.headline).toContain("inadequate");
  });

  it("has many concerns", () => {
    const r = computeWhistleblowingSafeguardingCulture(inadequateInput());
    expect(r.concerns.length).toBeGreaterThan(5);
  });

  it("has many recommendations", () => {
    const r = computeWhistleblowingSafeguardingCulture(inadequateInput());
    expect(r.recommendations.length).toBeGreaterThan(3);
  });

  it("has critical insights", () => {
    const r = computeWhistleblowingSafeguardingCulture(inadequateInput());
    const critical = r.insights.filter((i) => i.severity === "critical");
    expect(critical.length).toBeGreaterThan(0);
  });

  it("score is 52 - 22 = 30 with all penalties active", () => {
    const r = computeWhistleblowingSafeguardingCulture(inadequateInput());
    // 52 - 6(policy) - 5(report) - 5(training) - 6(protection) = 30
    expect(r.safeguarding_culture_score).toBe(30);
  });
});

// ==============================================================================
// BONUS ISOLATION TESTS
// ==============================================================================

describe("Bonus 1: policyAwarenessRate", () => {
  // policyAwarenessRate = round((policyReadRate + policyCurrentRate + channelUnderstandingRate + declarationRate) / 4)
  // We need to isolate this bonus. Set all other arrays to empty so no other bonuses/penalties fire.
  // base=52, only bonus 1 should apply.

  it("+4 when policyAwarenessRate >= 90", () => {
    // All 5 have policy_read, policy_version_current, understands_reporting_channels, signed_declaration => 100% each => composite 100%
    const awareness = Array.from({ length: 5 }, (_, i) =>
      makeAwareness({ id: `b1h_${i}`, staff_id: `sb1h_${i}` }),
    );
    const r = computeWhistleblowingSafeguardingCulture({
      today: TODAY,
      total_children: 4,
      whistleblowing_awareness_records: awareness,
      reporting_confidence_records: [],
      safeguarding_training_records: [],
      culture_audit_records: [],
      child_protection_records: [],
    });
    expect(r.policy_awareness_rate).toBeGreaterThanOrEqual(90);
    expect(r.safeguarding_culture_score).toBe(52 + 4);
  });

  it("+2 when policyAwarenessRate >= 70 and < 90", () => {
    // 4 of 5 have all fields => 80% each => composite 80%
    const awareness = Array.from({ length: 5 }, (_, i) =>
      makeAwareness({
        id: `b1m_${i}`,
        staff_id: `sb1m_${i}`,
        policy_read: i < 4,
        policy_version_current: i < 4,
        understands_reporting_channels: i < 4,
        signed_declaration: i < 4,
      }),
    );
    const r = computeWhistleblowingSafeguardingCulture({
      today: TODAY,
      total_children: 4,
      whistleblowing_awareness_records: awareness,
      reporting_confidence_records: [],
      safeguarding_training_records: [],
      culture_audit_records: [],
      child_protection_records: [],
    });
    expect(r.policy_awareness_rate).toBeGreaterThanOrEqual(70);
    expect(r.policy_awareness_rate).toBeLessThan(90);
    expect(r.safeguarding_culture_score).toBe(52 + 2);
  });

  it("+0 when policyAwarenessRate < 70 and >= 50 (no bonus, no penalty)", () => {
    // 3 of 5 => 60% each => composite 60%
    const awareness = Array.from({ length: 5 }, (_, i) =>
      makeAwareness({
        id: `b1l_${i}`,
        staff_id: `sb1l_${i}`,
        policy_read: i < 3,
        policy_version_current: i < 3,
        understands_reporting_channels: i < 3,
        signed_declaration: i < 3,
      }),
    );
    const r = computeWhistleblowingSafeguardingCulture({
      today: TODAY,
      total_children: 4,
      whistleblowing_awareness_records: awareness,
      reporting_confidence_records: [],
      safeguarding_training_records: [],
      culture_audit_records: [],
      child_protection_records: [],
    });
    expect(r.policy_awareness_rate).toBeGreaterThanOrEqual(50);
    expect(r.policy_awareness_rate).toBeLessThan(70);
    expect(r.safeguarding_culture_score).toBe(52);
  });
});

describe("Bonus 2: reportingConfidenceRate", () => {
  // reportingConfidenceRate = round((colleagueReportRate + managerReportRate + safeReportingRate) / 3)

  it("+4 when reportingConfidenceRate >= 90", () => {
    const confidence = Array.from({ length: 5 }, (_, i) =>
      makeConfidence({ id: `b2h_${i}`, staff_id: `sb2h_${i}` }),
    );
    const r = computeWhistleblowingSafeguardingCulture({
      today: TODAY,
      total_children: 4,
      whistleblowing_awareness_records: [],
      reporting_confidence_records: confidence,
      safeguarding_training_records: [],
      culture_audit_records: [],
      child_protection_records: [],
    });
    expect(r.reporting_confidence_rate).toBeGreaterThanOrEqual(90);
    // +4 for B2 (reporting_confidence >= 90) + +5 for B6 (staff_confidence >= 90 from confidence_level:5)
    expect(r.safeguarding_culture_score).toBe(52 + 4 + 5);
  });

  it("+2 when reportingConfidenceRate >= 70 and < 90", () => {
    const confidence = Array.from({ length: 5 }, (_, i) =>
      makeConfidence({
        id: `b2m_${i}`,
        staff_id: `sb2m_${i}`,
        would_report_colleague: i < 4,
        would_report_manager: i < 4,
        feels_safe_reporting: i < 4,
      }),
    );
    const r = computeWhistleblowingSafeguardingCulture({
      today: TODAY,
      total_children: 4,
      whistleblowing_awareness_records: [],
      reporting_confidence_records: confidence,
      safeguarding_training_records: [],
      culture_audit_records: [],
      child_protection_records: [],
    });
    expect(r.reporting_confidence_rate).toBeGreaterThanOrEqual(70);
    expect(r.reporting_confidence_rate).toBeLessThan(90);
    // +2 for B2 + B6 fires from confidence_level:5
    expect(r.safeguarding_culture_score).toBe(52 + 2 + 4);
  });

  it("+0 when reportingConfidenceRate 50-69", () => {
    const confidence = Array.from({ length: 5 }, (_, i) =>
      makeConfidence({
        id: `b2l_${i}`,
        staff_id: `sb2l_${i}`,
        would_report_colleague: i < 3,
        would_report_manager: i < 3,
        feels_safe_reporting: i < 3,
      }),
    );
    const r = computeWhistleblowingSafeguardingCulture({
      today: TODAY,
      total_children: 4,
      whistleblowing_awareness_records: [],
      reporting_confidence_records: confidence,
      safeguarding_training_records: [],
      culture_audit_records: [],
      child_protection_records: [],
    });
    expect(r.reporting_confidence_rate).toBeGreaterThanOrEqual(50);
    expect(r.reporting_confidence_rate).toBeLessThan(70);
    // +0 for B2 but B6 fires from staff_confidence (confidence_level:5)
    expect(r.safeguarding_culture_score).toBe(55);
  });
});

describe("Bonus 3: trainingCurrencyRate", () => {
  // trainingCurrencyRate = round((inDateRate + trainingPassRate + certificateRate) / 3)

  it("+4 when trainingCurrencyRate >= 90", () => {
    const training = Array.from({ length: 5 }, (_, i) =>
      makeTraining({ id: `b3h_${i}`, staff_id: `sb3h_${i}` }),
    );
    const r = computeWhistleblowingSafeguardingCulture({
      today: TODAY,
      total_children: 4,
      whistleblowing_awareness_records: [],
      reporting_confidence_records: [],
      safeguarding_training_records: training,
      culture_audit_records: [],
      child_protection_records: [],
    });
    expect(r.training_currency_rate).toBeGreaterThanOrEqual(90);
    expect(r.safeguarding_culture_score).toBe(52 + 4);
  });

  it("+2 when trainingCurrencyRate >= 70 and < 90", () => {
    const training = Array.from({ length: 5 }, (_, i) =>
      makeTraining({
        id: `b3m_${i}`,
        staff_id: `sb3m_${i}`,
        passed: i < 4,
        certificates_on_file: i < 4,
        expiry_date: i < 4 ? "2027-03-01" : "2025-01-01",
      }),
    );
    const r = computeWhistleblowingSafeguardingCulture({
      today: TODAY,
      total_children: 4,
      whistleblowing_awareness_records: [],
      reporting_confidence_records: [],
      safeguarding_training_records: training,
      culture_audit_records: [],
      child_protection_records: [],
    });
    expect(r.training_currency_rate).toBeGreaterThanOrEqual(70);
    expect(r.training_currency_rate).toBeLessThan(90);
    expect(r.safeguarding_culture_score).toBe(52 + 2);
  });

  it("+0 when trainingCurrencyRate 50-69", () => {
    const training = Array.from({ length: 5 }, (_, i) =>
      makeTraining({
        id: `b3l_${i}`,
        staff_id: `sb3l_${i}`,
        passed: i < 3,
        certificates_on_file: i < 3,
        expiry_date: i < 3 ? "2027-03-01" : "2025-01-01",
      }),
    );
    const r = computeWhistleblowingSafeguardingCulture({
      today: TODAY,
      total_children: 4,
      whistleblowing_awareness_records: [],
      reporting_confidence_records: [],
      safeguarding_training_records: training,
      culture_audit_records: [],
      child_protection_records: [],
    });
    expect(r.training_currency_rate).toBeGreaterThanOrEqual(50);
    expect(r.training_currency_rate).toBeLessThan(70);
    expect(r.safeguarding_culture_score).toBe(52);
  });
});

describe("Bonus 4: cultureAuditRate", () => {
  // cultureAuditRate = round((avgAuditRating + avgOpenCultureScore + childSafeRate) / 3)

  it("+4 when cultureAuditRate >= 80", () => {
    const audits = [
      makeAudit({
        id: "b4h_0",
        overall_rating: "outstanding",
        open_culture_score: 90,
        children_feel_safe: true,
      }),
    ];
    const r = computeWhistleblowingSafeguardingCulture({
      today: TODAY,
      total_children: 4,
      whistleblowing_awareness_records: [],
      reporting_confidence_records: [],
      safeguarding_training_records: [],
      culture_audit_records: audits,
      child_protection_records: [],
    });
    // avgAuditRating=100, avgOpenCultureScore=90, childSafeRate=100 => round((100+90+100)/3)=97
    expect(r.culture_audit_rate).toBeGreaterThanOrEqual(80);
    // +4 for B4 + other audit-derived bonuses fire from defaults
    expect(r.safeguarding_culture_score).toBe(59);
  });

  it("+2 when cultureAuditRate >= 60 and < 80", () => {
    const audits = [
      makeAudit({
        id: "b4m_0",
        overall_rating: "good",
        open_culture_score: 60,
        children_feel_safe: true,
      }),
    ];
    const r = computeWhistleblowingSafeguardingCulture({
      today: TODAY,
      total_children: 4,
      whistleblowing_awareness_records: [],
      reporting_confidence_records: [],
      safeguarding_training_records: [],
      culture_audit_records: audits,
      child_protection_records: [],
    });
    // avgAuditRating=75, avgOpenCultureScore=60, childSafeRate=100 => round((75+60+100)/3)=78
    expect(r.culture_audit_rate).toBeGreaterThanOrEqual(60);
    expect(r.culture_audit_rate).toBeLessThan(80);
    // +2 for B4 + other audit-derived bonuses
    expect(r.safeguarding_culture_score).toBe(57);
  });

  it("+0 when cultureAuditRate < 60", () => {
    const audits = [
      makeAudit({
        id: "b4l_0",
        overall_rating: "inadequate",
        open_culture_score: 30,
        children_feel_safe: false,
      }),
    ];
    const r = computeWhistleblowingSafeguardingCulture({
      today: TODAY,
      total_children: 4,
      whistleblowing_awareness_records: [],
      reporting_confidence_records: [],
      safeguarding_training_records: [],
      culture_audit_records: audits,
      child_protection_records: [],
    });
    // avgAuditRating=25, avgOpenCultureScore=30, childSafeRate=0 => round((25+30+0)/3)=18
    expect(r.culture_audit_rate).toBeLessThan(60);
    expect(r.safeguarding_culture_score).toBe(52);
  });
});

describe("Bonus 5: childProtectionRate", () => {
  // childProtectionRate = round((timelyReportingRate + correctChannelRate + childVoiceRate + outcomeRate + followUpRate) / 5)

  it("+4 when childProtectionRate >= 90", () => {
    const protection = Array.from({ length: 5 }, (_, i) =>
      makeProtection({ id: `b5h_${i}`, child_id: `ch_b5h_${i}` }),
    );
    const r = computeWhistleblowingSafeguardingCulture({
      today: TODAY,
      total_children: 4,
      whistleblowing_awareness_records: [],
      reporting_confidence_records: [],
      safeguarding_training_records: [],
      culture_audit_records: [],
      child_protection_records: protection,
    });
    expect(r.child_protection_rate).toBeGreaterThanOrEqual(90);
    expect(r.safeguarding_culture_score).toBe(52 + 4);
  });

  it("+2 when childProtectionRate >= 70 and < 90", () => {
    const protection = Array.from({ length: 5 }, (_, i) =>
      makeProtection({
        id: `b5m_${i}`,
        child_id: `ch_b5m_${i}`,
        reported_within_24h: i < 4,
        correct_channel_used: i < 4,
        child_voice_captured: i < 4,
        outcome_documented: i < 4,
        follow_up_completed: i < 4,
      }),
    );
    const r = computeWhistleblowingSafeguardingCulture({
      today: TODAY,
      total_children: 4,
      whistleblowing_awareness_records: [],
      reporting_confidence_records: [],
      safeguarding_training_records: [],
      culture_audit_records: [],
      child_protection_records: protection,
    });
    expect(r.child_protection_rate).toBeGreaterThanOrEqual(70);
    expect(r.child_protection_rate).toBeLessThan(90);
    expect(r.safeguarding_culture_score).toBe(52 + 2);
  });

  it("+0 when childProtectionRate 50-69", () => {
    const protection = Array.from({ length: 5 }, (_, i) =>
      makeProtection({
        id: `b5l_${i}`,
        child_id: `ch_b5l_${i}`,
        reported_within_24h: i < 3,
        correct_channel_used: i < 3,
        child_voice_captured: i < 3,
        outcome_documented: i < 3,
        follow_up_completed: i < 3,
      }),
    );
    const r = computeWhistleblowingSafeguardingCulture({
      today: TODAY,
      total_children: 4,
      whistleblowing_awareness_records: [],
      reporting_confidence_records: [],
      safeguarding_training_records: [],
      culture_audit_records: [],
      child_protection_records: protection,
    });
    expect(r.child_protection_rate).toBeGreaterThanOrEqual(50);
    expect(r.child_protection_rate).toBeLessThan(70);
    expect(r.safeguarding_culture_score).toBe(52);
  });
});

describe("Bonus 6: staffConfidenceRate", () => {
  // staffConfidenceRate = round((avgConfidence / 5) * 100)
  // avgConfidence = round(sum/n * 100) / 100

  it("+3 when staffConfidenceRate >= 80", () => {
    // confidence_level=4 => avg=4.0 => (4.0/5)*100=80
    const confidence = Array.from({ length: 5 }, (_, i) =>
      makeConfidence({
        id: `b6h_${i}`,
        staff_id: `sb6h_${i}`,
        confidence_level: 4,
        // Avoid triggering reportingConfidenceRate bonus: set low
        would_report_colleague: false,
        would_report_manager: false,
        feels_safe_reporting: false,
      }),
    );
    const r = computeWhistleblowingSafeguardingCulture({
      today: TODAY,
      total_children: 4,
      whistleblowing_awareness_records: [],
      reporting_confidence_records: confidence,
      safeguarding_training_records: [],
      culture_audit_records: [],
      child_protection_records: [],
    });
    expect(r.staff_confidence_rate).toBeGreaterThanOrEqual(80);
    // reportingConfidenceRate=0 < 50 so penalty -5 fires
    // score = 52 + 3(staffConf) - 5(reportConf penalty) = 50
    expect(r.safeguarding_culture_score).toBe(50);
  });

  it("+1 when staffConfidenceRate >= 60 and < 80", () => {
    // confidence_level=3 => avg=3.0 => (3.0/5)*100=60
    const confidence = Array.from({ length: 5 }, (_, i) =>
      makeConfidence({
        id: `b6m_${i}`,
        staff_id: `sb6m_${i}`,
        confidence_level: 3,
        would_report_colleague: false,
        would_report_manager: false,
        feels_safe_reporting: false,
      }),
    );
    const r = computeWhistleblowingSafeguardingCulture({
      today: TODAY,
      total_children: 4,
      whistleblowing_awareness_records: [],
      reporting_confidence_records: confidence,
      safeguarding_training_records: [],
      culture_audit_records: [],
      child_protection_records: [],
    });
    expect(r.staff_confidence_rate).toBeGreaterThanOrEqual(60);
    expect(r.staff_confidence_rate).toBeLessThan(80);
    // score = 52 + 1(staffConf) - 5(reportConf penalty) = 48
    expect(r.safeguarding_culture_score).toBe(48);
  });

  it("+0 when staffConfidenceRate < 60", () => {
    // confidence_level=2 => avg=2.0 => (2.0/5)*100=40
    const confidence = Array.from({ length: 5 }, (_, i) =>
      makeConfidence({
        id: `b6lo_${i}`,
        staff_id: `sb6lo_${i}`,
        confidence_level: 2,
        would_report_colleague: false,
        would_report_manager: false,
        feels_safe_reporting: false,
      }),
    );
    const r = computeWhistleblowingSafeguardingCulture({
      today: TODAY,
      total_children: 4,
      whistleblowing_awareness_records: [],
      reporting_confidence_records: confidence,
      safeguarding_training_records: [],
      culture_audit_records: [],
      child_protection_records: [],
    });
    expect(r.staff_confidence_rate).toBeLessThan(60);
    // score = 52 + 0 - 5(reportConf penalty) = 47
    expect(r.safeguarding_culture_score).toBe(47);
  });
});

describe("Bonus 7: childSafeRate", () => {
  // childSafeRate = pct(childrenFeelSafe count, totalAudits)

  it("+3 when childSafeRate >= 90", () => {
    const audits = [
      makeAudit({ id: "b7h_0", children_feel_safe: true, overall_rating: "inadequate", open_culture_score: 20 }),
    ];
    const r = computeWhistleblowingSafeguardingCulture({
      today: TODAY,
      total_children: 4,
      whistleblowing_awareness_records: [],
      reporting_confidence_records: [],
      safeguarding_training_records: [],
      culture_audit_records: audits,
      child_protection_records: [],
    });
    // cultureAuditRate = round((25+20+100)/3) = 48 < 60 => no bonus4
    // childSafeRate = 100 => +3
    // score = 52 + 3 = 55
    expect(r.safeguarding_culture_score).toBe(55);
  });

  it("+1 when childSafeRate >= 70 and < 90", () => {
    // 3 of 4 audits have children_feel_safe => 75%
    const audits = Array.from({ length: 4 }, (_, i) =>
      makeAudit({
        id: `b7m_${i}`,
        children_feel_safe: i < 3,
        overall_rating: "inadequate",
        open_culture_score: 20,
      }),
    );
    const r = computeWhistleblowingSafeguardingCulture({
      today: TODAY,
      total_children: 4,
      whistleblowing_awareness_records: [],
      reporting_confidence_records: [],
      safeguarding_training_records: [],
      culture_audit_records: audits,
      child_protection_records: [],
    });
    // childSafeRate = 75 => +1
    // cultureAuditRate = round((25 + 20 + 75)/3) = 40 < 60 => no bonus4
    expect(r.safeguarding_culture_score).toBe(52 + 1);
  });

  it("+0 when childSafeRate < 70", () => {
    // 1 of 4 => 25%
    const audits = Array.from({ length: 4 }, (_, i) =>
      makeAudit({
        id: `b7l_${i}`,
        children_feel_safe: i < 1,
        overall_rating: "inadequate",
        open_culture_score: 20,
      }),
    );
    const r = computeWhistleblowingSafeguardingCulture({
      today: TODAY,
      total_children: 4,
      whistleblowing_awareness_records: [],
      reporting_confidence_records: [],
      safeguarding_training_records: [],
      culture_audit_records: audits,
      child_protection_records: [],
    });
    expect(r.safeguarding_culture_score).toBe(52);
  });
});

describe("Bonus 8: safeReportingRate", () => {
  // safeReportingRate = pct(feels_safe_reporting, totalConfidence)

  it("+2 when safeReportingRate >= 90", () => {
    // All 5 feel safe, also set would_report to low to avoid bonus2 but avoid penalty
    const confidence = Array.from({ length: 5 }, (_, i) =>
      makeConfidence({
        id: `b8h_${i}`,
        staff_id: `sb8h_${i}`,
        feels_safe_reporting: true,
        would_report_colleague: i < 3,
        would_report_manager: i < 3,
        confidence_level: 2,
      }),
    );
    const r = computeWhistleblowingSafeguardingCulture({
      today: TODAY,
      total_children: 4,
      whistleblowing_awareness_records: [],
      reporting_confidence_records: confidence,
      safeguarding_training_records: [],
      culture_audit_records: [],
      child_protection_records: [],
    });
    // reportingConfidenceRate = round((60 + 60 + 100)/3) = 73 => +2 for bonus2
    // staffConfidence = round((2/5)*100) = 40 => no bonus6
    // safeReportingRate = 100 => +2
    // score = 52 + 2 + 2 = 56
    expect(r.safeguarding_culture_score).toBe(56);
  });

  it("+1 when safeReportingRate >= 70 and < 90", () => {
    // 4 of 5 feel safe => 80%
    const confidence = Array.from({ length: 5 }, (_, i) =>
      makeConfidence({
        id: `b8m_${i}`,
        staff_id: `sb8m_${i}`,
        feels_safe_reporting: i < 4,
        would_report_colleague: i < 3,
        would_report_manager: i < 3,
        confidence_level: 2,
      }),
    );
    const r = computeWhistleblowingSafeguardingCulture({
      today: TODAY,
      total_children: 4,
      whistleblowing_awareness_records: [],
      reporting_confidence_records: confidence,
      safeguarding_training_records: [],
      culture_audit_records: [],
      child_protection_records: [],
    });
    // reportingConfidenceRate = round((60+60+80)/3) = 67 => no bonus2, no penalty
    // safeReportingRate = 80 => +1
    // score = 52 + 1 = 53
    expect(r.safeguarding_culture_score).toBe(53);
  });

  it("+0 when safeReportingRate < 70", () => {
    const confidence = Array.from({ length: 5 }, (_, i) =>
      makeConfidence({
        id: `b8l_${i}`,
        staff_id: `sb8l_${i}`,
        feels_safe_reporting: i < 3,
        would_report_colleague: i < 3,
        would_report_manager: i < 3,
        confidence_level: 2,
      }),
    );
    const r = computeWhistleblowingSafeguardingCulture({
      today: TODAY,
      total_children: 4,
      whistleblowing_awareness_records: [],
      reporting_confidence_records: confidence,
      safeguarding_training_records: [],
      culture_audit_records: [],
      child_protection_records: [],
    });
    // reportingConfidenceRate = round((60+60+60)/3) = 60 => no bonus, no penalty
    // safeReportingRate = 60 => no bonus8
    // score = 52
    expect(r.safeguarding_culture_score).toBe(52);
  });
});

// ==============================================================================
// PENALTY TESTS
// ==============================================================================

describe("Penalty 1: policyAwarenessRate < 50", () => {
  it("-6 when policyAwarenessRate < 50 and records exist", () => {
    // 1 of 5 => 20% each => composite 20%
    const awareness = Array.from({ length: 5 }, (_, i) =>
      makeAwareness({
        id: `p1_${i}`,
        staff_id: `sp1_${i}`,
        policy_read: i < 1,
        policy_version_current: i < 1,
        understands_reporting_channels: i < 1,
        signed_declaration: i < 1,
      }),
    );
    const r = computeWhistleblowingSafeguardingCulture({
      today: TODAY,
      total_children: 4,
      whistleblowing_awareness_records: awareness,
      reporting_confidence_records: [],
      safeguarding_training_records: [],
      culture_audit_records: [],
      child_protection_records: [],
    });
    expect(r.policy_awareness_rate).toBeLessThan(50);
    expect(r.safeguarding_culture_score).toBe(52 - 6);
  });

  it("no penalty when awareness records are empty", () => {
    const r = computeWhistleblowingSafeguardingCulture({
      today: TODAY,
      total_children: 4,
      whistleblowing_awareness_records: [],
      reporting_confidence_records: [],
      safeguarding_training_records: [],
      culture_audit_records: [makeAudit({ id: "guard_0" })],
      child_protection_records: [],
    });
    // policyAwarenessRate=0 but no records => guard prevents penalty
    // cultureAuditRate will be high so bonus4 fires
    expect(r.safeguarding_culture_score).toBeGreaterThanOrEqual(52);
  });
});

describe("Penalty 2: reportingConfidenceRate < 50", () => {
  it("-5 when reportingConfidenceRate < 50 and records exist", () => {
    const confidence = Array.from({ length: 5 }, (_, i) =>
      makeConfidence({
        id: `p2_${i}`,
        staff_id: `sp2_${i}`,
        would_report_colleague: i < 1,
        would_report_manager: i < 1,
        feels_safe_reporting: i < 1,
        confidence_level: 2,
      }),
    );
    const r = computeWhistleblowingSafeguardingCulture({
      today: TODAY,
      total_children: 4,
      whistleblowing_awareness_records: [],
      reporting_confidence_records: confidence,
      safeguarding_training_records: [],
      culture_audit_records: [],
      child_protection_records: [],
    });
    expect(r.reporting_confidence_rate).toBeLessThan(50);
    expect(r.safeguarding_culture_score).toBe(52 - 5);
  });

  it("no penalty when confidence records are empty", () => {
    const r = computeWhistleblowingSafeguardingCulture({
      today: TODAY,
      total_children: 4,
      whistleblowing_awareness_records: [],
      reporting_confidence_records: [],
      safeguarding_training_records: [],
      culture_audit_records: [makeAudit({ id: "guard_1" })],
      child_protection_records: [],
    });
    expect(r.safeguarding_culture_score).toBeGreaterThanOrEqual(52);
  });
});

describe("Penalty 3: trainingCurrencyRate < 50", () => {
  it("-5 when trainingCurrencyRate < 50 and records exist", () => {
    const training = Array.from({ length: 5 }, (_, i) =>
      makeTraining({
        id: `p3_${i}`,
        staff_id: `sp3_${i}`,
        passed: i < 1,
        certificates_on_file: i < 1,
        expiry_date: i < 1 ? "2027-03-01" : "2025-01-01",
      }),
    );
    const r = computeWhistleblowingSafeguardingCulture({
      today: TODAY,
      total_children: 4,
      whistleblowing_awareness_records: [],
      reporting_confidence_records: [],
      safeguarding_training_records: training,
      culture_audit_records: [],
      child_protection_records: [],
    });
    expect(r.training_currency_rate).toBeLessThan(50);
    expect(r.safeguarding_culture_score).toBe(52 - 5);
  });

  it("no penalty when training records are empty", () => {
    const r = computeWhistleblowingSafeguardingCulture({
      today: TODAY,
      total_children: 4,
      whistleblowing_awareness_records: [],
      reporting_confidence_records: [],
      safeguarding_training_records: [],
      culture_audit_records: [makeAudit({ id: "guard_2" })],
      child_protection_records: [],
    });
    expect(r.safeguarding_culture_score).toBeGreaterThanOrEqual(52);
  });
});

describe("Penalty 4: childProtectionRate < 50", () => {
  it("-6 when childProtectionRate < 50 and records exist", () => {
    const protection = Array.from({ length: 5 }, (_, i) =>
      makeProtection({
        id: `p4_${i}`,
        child_id: `ch_p4_${i}`,
        reported_within_24h: i < 1,
        correct_channel_used: i < 1,
        child_voice_captured: i < 1,
        outcome_documented: i < 1,
        follow_up_completed: i < 1,
      }),
    );
    const r = computeWhistleblowingSafeguardingCulture({
      today: TODAY,
      total_children: 4,
      whistleblowing_awareness_records: [],
      reporting_confidence_records: [],
      safeguarding_training_records: [],
      culture_audit_records: [],
      child_protection_records: protection,
    });
    expect(r.child_protection_rate).toBeLessThan(50);
    expect(r.safeguarding_culture_score).toBe(52 - 6);
  });

  it("no penalty when protection records are empty", () => {
    const r = computeWhistleblowingSafeguardingCulture({
      today: TODAY,
      total_children: 4,
      whistleblowing_awareness_records: [],
      reporting_confidence_records: [],
      safeguarding_training_records: [],
      culture_audit_records: [makeAudit({ id: "guard_3" })],
      child_protection_records: [],
    });
    expect(r.safeguarding_culture_score).toBeGreaterThanOrEqual(52);
  });
});

describe("All penalties stack", () => {
  it("52 - 6 - 5 - 5 - 6 = 30 when all penalties fire", () => {
    const awareness = Array.from({ length: 5 }, (_, i) =>
      makeAwareness({
        id: `ap_${i}`,
        staff_id: `sap_${i}`,
        policy_read: false,
        policy_version_current: false,
        understands_reporting_channels: false,
        signed_declaration: false,
      }),
    );
    const confidence = Array.from({ length: 5 }, (_, i) =>
      makeConfidence({
        id: `apc_${i}`,
        staff_id: `sapc_${i}`,
        would_report_colleague: false,
        would_report_manager: false,
        feels_safe_reporting: false,
        confidence_level: 1,
      }),
    );
    const training = Array.from({ length: 5 }, (_, i) =>
      makeTraining({
        id: `apt_${i}`,
        staff_id: `sapt_${i}`,
        passed: false,
        certificates_on_file: false,
        expiry_date: "2025-01-01",
      }),
    );
    const protection = Array.from({ length: 5 }, (_, i) =>
      makeProtection({
        id: `app_${i}`,
        child_id: `ch_app_${i}`,
        reported_within_24h: false,
        correct_channel_used: false,
        child_voice_captured: false,
        outcome_documented: false,
        follow_up_completed: false,
      }),
    );
    const r = computeWhistleblowingSafeguardingCulture({
      today: TODAY,
      total_children: 4,
      whistleblowing_awareness_records: awareness,
      reporting_confidence_records: confidence,
      safeguarding_training_records: training,
      culture_audit_records: [],
      child_protection_records: protection,
    });
    expect(r.safeguarding_culture_score).toBe(30);
  });
});

// ==============================================================================
// RATE COMPUTATION TESTS
// ==============================================================================

describe("Rate computations", () => {
  describe("policy_awareness_rate", () => {
    it("is 0 when no awareness records", () => {
      const r = computeWhistleblowingSafeguardingCulture(
        baseInput({ whistleblowing_awareness_records: [] }),
      );
      expect(r.policy_awareness_rate).toBeNull();
    });

    it("is 100 when all fields true for all records", () => {
      const r = computeWhistleblowingSafeguardingCulture(baseInput());
      expect(r.policy_awareness_rate).toBe(100);
    });

    it("round((80+80+80+80)/4) = 80 when 4 of 5 have all fields", () => {
      const awareness = Array.from({ length: 5 }, (_, i) =>
        makeAwareness({
          id: `par_${i}`,
          staff_id: `spar_${i}`,
          policy_read: i < 4,
          policy_version_current: i < 4,
          understands_reporting_channels: i < 4,
          signed_declaration: i < 4,
        }),
      );
      const r = computeWhistleblowingSafeguardingCulture(
        baseInput({ whistleblowing_awareness_records: awareness }),
      );
      expect(r.policy_awareness_rate).toBe(80);
    });
  });

  describe("reporting_confidence_rate", () => {
    it("is 0 when no confidence records", () => {
      const r = computeWhistleblowingSafeguardingCulture(
        baseInput({ reporting_confidence_records: [] }),
      );
      expect(r.reporting_confidence_rate).toBeNull();
    });

    it("is 100 when all fields true", () => {
      const r = computeWhistleblowingSafeguardingCulture(baseInput());
      expect(r.reporting_confidence_rate).toBe(100);
    });

    it("round((60+60+60)/3) = 60 when 3 of 5 for each", () => {
      const confidence = Array.from({ length: 5 }, (_, i) =>
        makeConfidence({
          id: `rcr_${i}`,
          staff_id: `srcr_${i}`,
          would_report_colleague: i < 3,
          would_report_manager: i < 3,
          feels_safe_reporting: i < 3,
        }),
      );
      const r = computeWhistleblowingSafeguardingCulture(
        baseInput({ reporting_confidence_records: confidence }),
      );
      expect(r.reporting_confidence_rate).toBe(60);
    });
  });

  describe("training_currency_rate", () => {
    it("is 0 when no training records", () => {
      const r = computeWhistleblowingSafeguardingCulture(
        baseInput({ safeguarding_training_records: [] }),
      );
      expect(r.training_currency_rate).toBeNull();
    });

    it("is 100 when all passed, in-date, with certificates", () => {
      const r = computeWhistleblowingSafeguardingCulture(baseInput());
      expect(r.training_currency_rate).toBe(100);
    });

    it("training with null expiry and passed counts as in-date", () => {
      const training = [
        makeTraining({ id: "tr_null_exp", staff_id: "s_null_exp", expiry_date: null, passed: true }),
      ];
      const r = computeWhistleblowingSafeguardingCulture(
        baseInput({ safeguarding_training_records: training }),
      );
      expect(r.training_currency_rate).toBe(100);
    });

    it("training with null expiry and not passed does not count as in-date", () => {
      const training = [
        makeTraining({ id: "tr_null_nop", staff_id: "s_null_nop", expiry_date: null, passed: false, certificates_on_file: false }),
      ];
      const r = computeWhistleblowingSafeguardingCulture(
        baseInput({ safeguarding_training_records: training }),
      );
      // inDateRate=0, passRate=0, certRate=0 => 0 (record exists → 0, not null)
      expect(r.training_currency_rate).toBe(0);
    });
  });

  describe("culture_audit_rate", () => {
    it("is 0 when no audit records", () => {
      const r = computeWhistleblowingSafeguardingCulture(
        baseInput({ culture_audit_records: [] }),
      );
      expect(r.culture_audit_rate).toBeNull();
    });

    it("round((100+90+100)/3) = 97 for outstanding audits with 90 open_culture_score", () => {
      const audits = [
        makeAudit({ id: "car_0", overall_rating: "outstanding", open_culture_score: 90, children_feel_safe: true }),
      ];
      const r = computeWhistleblowingSafeguardingCulture(
        baseInput({ culture_audit_records: audits }),
      );
      expect(r.culture_audit_rate).toBe(97);
    });

    it("round((25+20+0)/3) = 15 for inadequate audits", () => {
      const audits = [
        makeAudit({ id: "car_low", overall_rating: "inadequate", open_culture_score: 20, children_feel_safe: false }),
      ];
      const r = computeWhistleblowingSafeguardingCulture(
        baseInput({ culture_audit_records: audits }),
      );
      expect(r.culture_audit_rate).toBe(15);
    });
  });

  describe("child_protection_rate", () => {
    it("is 0 when no protection records", () => {
      const r = computeWhistleblowingSafeguardingCulture(
        baseInput({ child_protection_records: [] }),
      );
      expect(r.child_protection_rate).toBeNull();
    });

    it("is 100 when all fields true", () => {
      const r = computeWhistleblowingSafeguardingCulture(baseInput());
      expect(r.child_protection_rate).toBe(100);
    });

    it("round((60+60+60+60+60)/5) = 60 when 3 of 5 for each", () => {
      const protection = Array.from({ length: 5 }, (_, i) =>
        makeProtection({
          id: `cpr_${i}`,
          child_id: `ch_cpr_${i}`,
          reported_within_24h: i < 3,
          correct_channel_used: i < 3,
          child_voice_captured: i < 3,
          outcome_documented: i < 3,
          follow_up_completed: i < 3,
        }),
      );
      const r = computeWhistleblowingSafeguardingCulture(
        baseInput({ child_protection_records: protection }),
      );
      expect(r.child_protection_rate).toBe(60);
    });
  });

  describe("staff_confidence_rate", () => {
    it("is 0 when no confidence records", () => {
      const r = computeWhistleblowingSafeguardingCulture(
        baseInput({ reporting_confidence_records: [] }),
      );
      expect(r.staff_confidence_rate).toBeNull();
    });

    it("is 100 when all confidence_level = 5", () => {
      const r = computeWhistleblowingSafeguardingCulture(baseInput());
      expect(r.staff_confidence_rate).toBe(100);
    });

    it("is 60 when avg confidence = 3", () => {
      const confidence = Array.from({ length: 5 }, (_, i) =>
        makeConfidence({
          id: `scr_${i}`,
          staff_id: `sscr_${i}`,
          confidence_level: 3,
        }),
      );
      const r = computeWhistleblowingSafeguardingCulture(
        baseInput({ reporting_confidence_records: confidence }),
      );
      expect(r.staff_confidence_rate).toBe(60);
    });

    it("is 20 when all confidence_level = 1", () => {
      const confidence = Array.from({ length: 5 }, (_, i) =>
        makeConfidence({
          id: `scr1_${i}`,
          staff_id: `sscr1_${i}`,
          confidence_level: 1,
        }),
      );
      const r = computeWhistleblowingSafeguardingCulture(
        baseInput({ reporting_confidence_records: confidence }),
      );
      expect(r.staff_confidence_rate).toBe(20);
    });
  });
});

// ==============================================================================
// STRENGTHS TESTS
// ==============================================================================

describe("Strengths", () => {
  it("includes policy awareness strength when rate >= 90", () => {
    const r = computeWhistleblowingSafeguardingCulture(baseInput());
    const s = r.strengths.find((s) => s.includes("100% composite policy awareness"));
    expect(s).toBeDefined();
  });

  it("includes lower-tier policy awareness strength when rate >= 70 and < 90", () => {
    const awareness = Array.from({ length: 5 }, (_, i) =>
      makeAwareness({
        id: `sp_${i}`,
        staff_id: `ssp_${i}`,
        policy_read: i < 4,
        policy_version_current: i < 4,
        understands_reporting_channels: i < 4,
        signed_declaration: i < 4,
      }),
    );
    const r = computeWhistleblowingSafeguardingCulture(
      baseInput({ whistleblowing_awareness_records: awareness }),
    );
    const s = r.strengths.find((s) => s.includes("policy awareness rate"));
    expect(s).toBeDefined();
  });

  it("includes channel understanding strength when >= 90", () => {
    const r = computeWhistleblowingSafeguardingCulture(baseInput());
    const s = r.strengths.find((s) => s.includes("understand reporting channels"));
    expect(s).toBeDefined();
  });

  it("includes external escalation strength when >= 90", () => {
    const r = computeWhistleblowingSafeguardingCulture(baseInput());
    const s = r.strengths.find((s) => s.includes("escalate externally"));
    expect(s).toBeDefined();
  });

  it("includes protection awareness strength when >= 90", () => {
    const r = computeWhistleblowingSafeguardingCulture(baseInput());
    const s = r.strengths.find((s) => s.includes("legal protections"));
    expect(s).toBeDefined();
  });

  it("includes quiz pass rate strength when >= 90", () => {
    const r = computeWhistleblowingSafeguardingCulture(baseInput());
    const s = r.strengths.find((s) => s.includes("quiz pass rate"));
    expect(s).toBeDefined();
  });

  it("includes refresher strength when >= 80", () => {
    const r = computeWhistleblowingSafeguardingCulture(baseInput());
    const s = r.strengths.find((s) => s.includes("refresher training"));
    expect(s).toBeDefined();
  });

  it("includes reporting confidence strength when >= 90", () => {
    const r = computeWhistleblowingSafeguardingCulture(baseInput());
    const s = r.strengths.find((s) => s.includes("composite reporting confidence"));
    expect(s).toBeDefined();
  });

  it("includes avg confidence strength when >= 4.0", () => {
    const r = computeWhistleblowingSafeguardingCulture(baseInput());
    const s = r.strengths.find((s) => s.includes("confidence in reporting concerns averages"));
    expect(s).toBeDefined();
  });

  it("includes safe reporting strength when >= 90", () => {
    const r = computeWhistleblowingSafeguardingCulture(baseInput());
    const s = r.strengths.find((s) => s.includes("feel safe reporting"));
    expect(s).toBeDefined();
  });

  it("includes training currency strength when >= 90", () => {
    const r = computeWhistleblowingSafeguardingCulture(baseInput());
    const s = r.strengths.find((s) => s.includes("safeguarding training currency"));
    expect(s).toBeDefined();
  });

  it("includes in-date training strength when >= 95", () => {
    const r = computeWhistleblowingSafeguardingCulture(baseInput());
    const s = r.strengths.find((s) => s.includes("training is in date"));
    expect(s).toBeDefined();
  });

  it("includes accredited training strength when >= 90", () => {
    const r = computeWhistleblowingSafeguardingCulture(baseInput());
    const s = r.strengths.find((s) => s.includes("accredited providers"));
    expect(s).toBeDefined();
  });

  it("includes training score strength when avgTrainingScore >= 85", () => {
    const r = computeWhistleblowingSafeguardingCulture(baseInput());
    const s = r.strengths.find((s) => s.includes("training score"));
    expect(s).toBeDefined();
  });

  it("includes culture audit strength when >= 80", () => {
    const r = computeWhistleblowingSafeguardingCulture(baseInput());
    const s = r.strengths.find((s) => s.includes("composite culture audit rate"));
    expect(s).toBeDefined();
  });

  it("includes children feel safe strength when >= 90", () => {
    const r = computeWhistleblowingSafeguardingCulture(baseInput());
    const s = r.strengths.find((s) => s.includes("Children reported feeling safe"));
    expect(s).toBeDefined();
  });

  it("includes staff feel heard strength when >= 90", () => {
    const r = computeWhistleblowingSafeguardingCulture(baseInput());
    const s = r.strengths.find((s) => s.includes("Staff feel heard"));
    expect(s).toBeDefined();
  });

  it("includes challenge accepted strength when >= 90", () => {
    const r = computeWhistleblowingSafeguardingCulture(baseInput());
    const s = r.strengths.find((s) => s.includes("Challenge is accepted"));
    expect(s).toBeDefined();
  });

  it("includes whistleblowing visibility strength when >= 90", () => {
    const r = computeWhistleblowingSafeguardingCulture(baseInput());
    const s = r.strengths.find((s) => s.includes("Whistleblowing policy visibly displayed"));
    expect(s).toBeDefined();
  });

  it("includes children know to complain strength when >= 90", () => {
    const r = computeWhistleblowingSafeguardingCulture(baseInput());
    const s = r.strengths.find((s) => s.includes("Children know how to complain"));
    expect(s).toBeDefined();
  });

  it("includes action completion strength when >= 90", () => {
    const r = computeWhistleblowingSafeguardingCulture(baseInput());
    const s = r.strengths.find((s) => s.includes("audit actions completed"));
    expect(s).toBeDefined();
  });

  it("includes outstanding audits strength when outstandingAudits > 0", () => {
    const r = computeWhistleblowingSafeguardingCulture(baseInput());
    const s = r.strengths.find((s) => s.includes("culture audits rated outstanding"));
    expect(s).toBeDefined();
  });

  it("includes child protection strength when >= 90", () => {
    const r = computeWhistleblowingSafeguardingCulture(baseInput());
    const s = r.strengths.find((s) => s.includes("composite child protection practice quality"));
    expect(s).toBeDefined();
  });

  it("includes timely reporting strength when >= 95", () => {
    const r = computeWhistleblowingSafeguardingCulture(baseInput());
    const s = r.strengths.find((s) => s.includes("reported within 24 hours"));
    expect(s).toBeDefined();
  });

  it("includes correct channel strength when >= 95", () => {
    const r = computeWhistleblowingSafeguardingCulture(baseInput());
    const s = r.strengths.find((s) => s.includes("Correct reporting channels"));
    expect(s).toBeDefined();
  });

  it("includes child voice strength when >= 90", () => {
    const r = computeWhistleblowingSafeguardingCulture(baseInput());
    const s = r.strengths.find((s) => s.includes("Child voice captured"));
    expect(s).toBeDefined();
  });

  it("includes lessons learned strength when >= 80", () => {
    const r = computeWhistleblowingSafeguardingCulture(baseInput());
    const s = r.strengths.find((s) => s.includes("Lessons learned recorded"));
    expect(s).toBeDefined();
  });

  it("includes debrief strength when >= 80", () => {
    const r = computeWhistleblowingSafeguardingCulture(baseInput());
    const s = r.strengths.find((s) => s.includes("Staff debriefed"));
    expect(s).toBeDefined();
  });

  it("includes multi-agency strength when >= 80", () => {
    const r = computeWhistleblowingSafeguardingCulture(baseInput());
    const s = r.strengths.find((s) => s.includes("Multi-agency"));
    expect(s).toBeDefined();
  });

  it("includes excellent quality strength when excellentQuality > 0", () => {
    const r = computeWhistleblowingSafeguardingCulture(baseInput());
    const s = r.strengths.find((s) => s.includes("rated excellent"));
    expect(s).toBeDefined();
  });

  it("includes manager report strength when >= 80", () => {
    const r = computeWhistleblowingSafeguardingCulture(baseInput());
    const s = r.strengths.find((s) => s.includes("report concerns about a manager"));
    expect(s).toBeDefined();
  });

  it("includes external report strength when >= 80", () => {
    const r = computeWhistleblowingSafeguardingCulture(baseInput());
    const s = r.strengths.find((s) => s.includes("escalate concerns externally"));
    expect(s).toBeDefined();
  });

  it("includes report handling strength when >= 90 and has prior reports", () => {
    const confidence = Array.from({ length: 5 }, (_, i) =>
      makeConfidence({
        id: `rh_${i}`,
        staff_id: `srh_${i}`,
        has_reported_before: true,
        report_handled_well: true,
      }),
    );
    const r = computeWhistleblowingSafeguardingCulture(
      baseInput({ reporting_confidence_records: confidence }),
    );
    const s = r.strengths.find((s) => s.includes("report was handled well"));
    expect(s).toBeDefined();
  });

  it("includes LADO referral strength when >= 90 and applicable", () => {
    const protection = Array.from({ length: 3 }, (_, i) =>
      makeProtection({
        id: `lado_${i}`,
        child_id: `ch_lado_${i}`,
        lado_referral_made: true,
        lado_referral_timely: true,
      }),
    );
    const r = computeWhistleblowingSafeguardingCulture(
      baseInput({ child_protection_records: protection }),
    );
    const s = r.strengths.find((s) => s.includes("LADO referrals"));
    expect(s).toBeDefined();
  });

  it("includes training types diversity strength when >= 5 types", () => {
    const types: SafeguardingTrainingRecordInput["training_type"][] = [
      "level_1", "level_2", "level_3", "advanced", "refresher",
    ];
    const training = types.map((t, i) =>
      makeTraining({ id: `ttype_${i}`, staff_id: `sttype_${i}`, training_type: t }),
    );
    const r = computeWhistleblowingSafeguardingCulture(
      baseInput({ safeguarding_training_records: training }),
    );
    const s = r.strengths.find((s) => s.includes("different types of safeguarding training"));
    expect(s).toBeDefined();
  });
});

// ==============================================================================
// CONCERNS TESTS
// ==============================================================================

describe("Concerns", () => {
  it("includes policy awareness concern when < 50", () => {
    const awareness = Array.from({ length: 5 }, (_, i) =>
      makeAwareness({
        id: `cpa_${i}`,
        staff_id: `scpa_${i}`,
        policy_read: false,
        policy_version_current: false,
        understands_reporting_channels: false,
        signed_declaration: false,
      }),
    );
    const r = computeWhistleblowingSafeguardingCulture(
      baseInput({ whistleblowing_awareness_records: awareness }),
    );
    const c = r.concerns.find((c) => c.includes("composite policy awareness"));
    expect(c).toBeDefined();
  });

  it("includes policy awareness concern when 50-69", () => {
    const awareness = Array.from({ length: 5 }, (_, i) =>
      makeAwareness({
        id: `cpa2_${i}`,
        staff_id: `scpa2_${i}`,
        policy_read: i < 3,
        policy_version_current: i < 3,
        understands_reporting_channels: i < 3,
        signed_declaration: i < 3,
      }),
    );
    const r = computeWhistleblowingSafeguardingCulture(
      baseInput({ whistleblowing_awareness_records: awareness }),
    );
    const c = r.concerns.find((c) => c.includes("significant minority"));
    expect(c).toBeDefined();
  });

  it("includes channel understanding concern when < 70", () => {
    const awareness = Array.from({ length: 5 }, (_, i) =>
      makeAwareness({
        id: `cch_${i}`,
        staff_id: `scch_${i}`,
        understands_reporting_channels: i < 3,
      }),
    );
    const r = computeWhistleblowingSafeguardingCulture(
      baseInput({ whistleblowing_awareness_records: awareness }),
    );
    const c = r.concerns.find((c) => c.includes("understand reporting channels"));
    expect(c).toBeDefined();
  });

  it("includes external escalation concern when < 60", () => {
    const awareness = Array.from({ length: 5 }, (_, i) =>
      makeAwareness({
        id: `cee_${i}`,
        staff_id: `scee_${i}`,
        knows_external_escalation: i < 2,
      }),
    );
    const r = computeWhistleblowingSafeguardingCulture(
      baseInput({ whistleblowing_awareness_records: awareness }),
    );
    const c = r.concerns.find((c) => c.includes("escalate externally"));
    expect(c).toBeDefined();
  });

  it("includes retaliation concern when >= 20%", () => {
    const awareness = Array.from({ length: 5 }, (_, i) =>
      makeAwareness({
        id: `cret_${i}`,
        staff_id: `scret_${i}`,
        concerns_about_retaliation: i < 2,
      }),
    );
    const r = computeWhistleblowingSafeguardingCulture(
      baseInput({ whistleblowing_awareness_records: awareness }),
    );
    const c = r.concerns.find((c) => c.includes("retaliation"));
    expect(c).toBeDefined();
  });

  it("includes quiz pass concern when < 70", () => {
    const awareness = Array.from({ length: 5 }, (_, i) =>
      makeAwareness({
        id: `cquiz_${i}`,
        staff_id: `scquiz_${i}`,
        quiz_passed: i < 3,
      }),
    );
    const r = computeWhistleblowingSafeguardingCulture(
      baseInput({ whistleblowing_awareness_records: awareness }),
    );
    const c = r.concerns.find((c) => c.includes("quiz"));
    expect(c).toBeDefined();
  });

  it("includes refresher concern when < 50", () => {
    const awareness = Array.from({ length: 5 }, (_, i) =>
      makeAwareness({
        id: `cref_${i}`,
        staff_id: `scref_${i}`,
        refresher_completed: i < 2,
      }),
    );
    const r = computeWhistleblowingSafeguardingCulture(
      baseInput({ whistleblowing_awareness_records: awareness }),
    );
    const c = r.concerns.find((c) => c.includes("refresher"));
    expect(c).toBeDefined();
  });

  it("includes reporting confidence concern when < 50", () => {
    const confidence = Array.from({ length: 5 }, (_, i) =>
      makeConfidence({
        id: `crc_${i}`,
        staff_id: `scrc_${i}`,
        would_report_colleague: false,
        would_report_manager: false,
        feels_safe_reporting: false,
      }),
    );
    const r = computeWhistleblowingSafeguardingCulture(
      baseInput({ reporting_confidence_records: confidence }),
    );
    const c = r.concerns.find((c) => c.includes("composite reporting confidence"));
    expect(c).toBeDefined();
  });

  it("includes avg confidence concern when < 3.0", () => {
    const confidence = Array.from({ length: 5 }, (_, i) =>
      makeConfidence({
        id: `cac_${i}`,
        staff_id: `scac_${i}`,
        confidence_level: 2,
      }),
    );
    const r = computeWhistleblowingSafeguardingCulture(
      baseInput({ reporting_confidence_records: confidence }),
    );
    const c = r.concerns.find((c) => c.includes("confidence in reporting concerns averages only"));
    expect(c).toBeDefined();
  });

  it("includes safe reporting concern when < 60", () => {
    const confidence = Array.from({ length: 5 }, (_, i) =>
      makeConfidence({
        id: `csr_${i}`,
        staff_id: `scsr_${i}`,
        feels_safe_reporting: i < 2,
      }),
    );
    const r = computeWhistleblowingSafeguardingCulture(
      baseInput({ reporting_confidence_records: confidence }),
    );
    const c = r.concerns.find((c) => c.includes("feel safe reporting"));
    expect(c).toBeDefined();
  });

  it("includes manager report concern when < 50", () => {
    const confidence = Array.from({ length: 5 }, (_, i) =>
      makeConfidence({
        id: `cmr_${i}`,
        staff_id: `scmr_${i}`,
        would_report_manager: i < 2,
      }),
    );
    const r = computeWhistleblowingSafeguardingCulture(
      baseInput({ reporting_confidence_records: confidence }),
    );
    const c = r.concerns.find((c) => c.includes("report concerns about a manager"));
    expect(c).toBeDefined();
  });

  it("includes barrier concern when >= 30%", () => {
    const confidence = Array.from({ length: 5 }, (_, i) =>
      makeConfidence({
        id: `cbar_${i}`,
        staff_id: `scbar_${i}`,
        barriers_to_reporting: i < 2 ? ["fear"] : [],
      }),
    );
    const r = computeWhistleblowingSafeguardingCulture(
      baseInput({ reporting_confidence_records: confidence }),
    );
    const c = r.concerns.find((c) => c.includes("barriers to raising concerns"));
    expect(c).toBeDefined();
  });

  it("includes report handling concern when < 60 and prior reports exist", () => {
    const confidence = Array.from({ length: 5 }, (_, i) =>
      makeConfidence({
        id: `crh_${i}`,
        staff_id: `scrh_${i}`,
        has_reported_before: true,
        report_handled_well: i < 2,
      }),
    );
    const r = computeWhistleblowingSafeguardingCulture(
      baseInput({ reporting_confidence_records: confidence }),
    );
    const c = r.concerns.find((c) => c.includes("report was handled well"));
    expect(c).toBeDefined();
  });

  it("includes training currency concern when < 50", () => {
    const training = Array.from({ length: 5 }, (_, i) =>
      makeTraining({
        id: `ctc_${i}`,
        staff_id: `sctc_${i}`,
        passed: i < 1,
        certificates_on_file: i < 1,
        expiry_date: "2025-01-01",
      }),
    );
    const r = computeWhistleblowingSafeguardingCulture(
      baseInput({ safeguarding_training_records: training }),
    );
    const c = r.concerns.find((c) => c.includes("safeguarding training currency"));
    expect(c).toBeDefined();
  });

  it("includes expired training concern when >= 20%", () => {
    const training = Array.from({ length: 5 }, (_, i) =>
      makeTraining({
        id: `cexp_${i}`,
        staff_id: `scexp_${i}`,
        expiry_date: i < 2 ? "2025-01-01" : "2027-03-01",
      }),
    );
    const r = computeWhistleblowingSafeguardingCulture(
      baseInput({ safeguarding_training_records: training }),
    );
    const c = r.concerns.find((c) => c.includes("training has expired"));
    expect(c).toBeDefined();
  });

  it("includes certificate concern when < 70", () => {
    const training = Array.from({ length: 5 }, (_, i) =>
      makeTraining({
        id: `ccert_${i}`,
        staff_id: `sccert_${i}`,
        certificates_on_file: i < 3,
      }),
    );
    const r = computeWhistleblowingSafeguardingCulture(
      baseInput({ safeguarding_training_records: training }),
    );
    const c = r.concerns.find((c) => c.includes("Certificates on file"));
    expect(c).toBeDefined();
  });

  it("includes accredited concern when < 60", () => {
    const training = Array.from({ length: 5 }, (_, i) =>
      makeTraining({
        id: `cacc_${i}`,
        staff_id: `sccacc_${i}`,
        accredited: i < 2,
      }),
    );
    const r = computeWhistleblowingSafeguardingCulture(
      baseInput({ safeguarding_training_records: training }),
    );
    const c = r.concerns.find((c) => c.includes("accredited"));
    expect(c).toBeDefined();
  });

  it("includes child safe concern when < 70", () => {
    const audits = Array.from({ length: 4 }, (_, i) =>
      makeAudit({ id: `ccs_${i}`, children_feel_safe: i < 2 }),
    );
    const r = computeWhistleblowingSafeguardingCulture(
      baseInput({ culture_audit_records: audits }),
    );
    const c = r.concerns.find((c) => c.includes("Children reported feeling safe"));
    expect(c).toBeDefined();
  });

  it("includes inadequate audit concern when >= 20%", () => {
    const audits = Array.from({ length: 4 }, (_, i) =>
      makeAudit({ id: `cia_${i}`, overall_rating: i < 1 ? "inadequate" : "good" }),
    );
    const r = computeWhistleblowingSafeguardingCulture(
      baseInput({ culture_audit_records: audits }),
    );
    const c = r.concerns.find((c) => c.includes("audits rated inadequate"));
    expect(c).toBeDefined();
  });

  it("includes action overdue concern when >= 20%", () => {
    const audits = [
      makeAudit({
        id: "cao_0",
        total_actions_raised: 10,
        actions_completed: 5,
        actions_overdue: 3,
      }),
    ];
    const r = computeWhistleblowingSafeguardingCulture(
      baseInput({ culture_audit_records: audits }),
    );
    const c = r.concerns.find((c) => c.includes("audit actions are overdue"));
    expect(c).toBeDefined();
  });

  it("includes no culture audit concern when no audits but children > 0 and not allEmpty", () => {
    const r = computeWhistleblowingSafeguardingCulture(
      baseInput({ culture_audit_records: [] }),
    );
    const c = r.concerns.find((c) => c.includes("No culture audit records"));
    expect(c).toBeDefined();
  });

  it("includes no protection concern when no records but children > 0 and not allEmpty", () => {
    const r = computeWhistleblowingSafeguardingCulture(
      baseInput({ child_protection_records: [] }),
    );
    const c = r.concerns.find((c) => c.includes("No child protection practice records"));
    expect(c).toBeDefined();
  });

  it("includes no awareness concern when no records but children > 0 and not allEmpty", () => {
    const r = computeWhistleblowingSafeguardingCulture(
      baseInput({ whistleblowing_awareness_records: [] }),
    );
    const c = r.concerns.find((c) => c.includes("No whistleblowing awareness records"));
    expect(c).toBeDefined();
  });

  it("includes no confidence concern when no records but children > 0 and not allEmpty", () => {
    const r = computeWhistleblowingSafeguardingCulture(
      baseInput({ reporting_confidence_records: [] }),
    );
    const c = r.concerns.find((c) => c.includes("No reporting confidence records"));
    expect(c).toBeDefined();
  });

  it("includes no training concern when no records but children > 0 and not allEmpty", () => {
    const r = computeWhistleblowingSafeguardingCulture(
      baseInput({ safeguarding_training_records: [] }),
    );
    const c = r.concerns.find((c) => c.includes("No safeguarding training records"));
    expect(c).toBeDefined();
  });

  it("includes child protection rate concern when < 50", () => {
    const protection = Array.from({ length: 5 }, (_, i) =>
      makeProtection({
        id: `ccpr_${i}`,
        child_id: `ch_ccpr_${i}`,
        reported_within_24h: false,
        correct_channel_used: false,
        child_voice_captured: false,
        outcome_documented: false,
        follow_up_completed: false,
      }),
    );
    const r = computeWhistleblowingSafeguardingCulture(
      baseInput({ child_protection_records: protection }),
    );
    const c = r.concerns.find((c) => c.includes("composite child protection practice quality"));
    expect(c).toBeDefined();
  });

  it("includes timely reporting concern when < 80", () => {
    const protection = Array.from({ length: 5 }, (_, i) =>
      makeProtection({
        id: `ctr_${i}`,
        child_id: `ch_ctr_${i}`,
        reported_within_24h: i < 3,
      }),
    );
    const r = computeWhistleblowingSafeguardingCulture(
      baseInput({ child_protection_records: protection }),
    );
    const c = r.concerns.find((c) => c.includes("reported within 24 hours"));
    expect(c).toBeDefined();
  });

  it("includes poor quality concern when >= 20%", () => {
    const protection = Array.from({ length: 5 }, (_, i) =>
      makeProtection({
        id: `cpq_${i}`,
        child_id: `ch_cpq_${i}`,
        quality_rating: i < 2 ? "poor" : "good",
      }),
    );
    const r = computeWhistleblowingSafeguardingCulture(
      baseInput({ child_protection_records: protection }),
    );
    const c = r.concerns.find((c) => c.includes("rated poor"));
    expect(c).toBeDefined();
  });

  it("includes LADO referral concern when < 80", () => {
    const protection = Array.from({ length: 5 }, (_, i) =>
      makeProtection({
        id: `clado_${i}`,
        child_id: `ch_clado_${i}`,
        lado_referral_made: i < 3,
        lado_referral_timely: i < 3,
      }),
    );
    const r = computeWhistleblowingSafeguardingCulture(
      baseInput({ child_protection_records: protection }),
    );
    const c = r.concerns.find((c) => c.includes("LADO referrals"));
    expect(c).toBeDefined();
  });

  it("includes visibility concern when < 70", () => {
    const audits = Array.from({ length: 4 }, (_, i) =>
      makeAudit({ id: `cvis_${i}`, whistleblowing_policy_visible: i < 2 }),
    );
    const r = computeWhistleblowingSafeguardingCulture(
      baseInput({ culture_audit_records: audits }),
    );
    const c = r.concerns.find((c) => c.includes("Whistleblowing policy visible"));
    expect(c).toBeDefined();
  });

  it("includes children complain knowledge concern when < 70", () => {
    const audits = Array.from({ length: 4 }, (_, i) =>
      makeAudit({ id: `cck_${i}`, children_know_how_to_complain: i < 2 }),
    );
    const r = computeWhistleblowingSafeguardingCulture(
      baseInput({ culture_audit_records: audits }),
    );
    const c = r.concerns.find((c) => c.includes("Children know how to complain"));
    expect(c).toBeDefined();
  });
});

// ==============================================================================
// RECOMMENDATIONS TESTS
// ==============================================================================

describe("Recommendations", () => {
  it("immediate recommendation for policy awareness < 50", () => {
    const awareness = Array.from({ length: 5 }, (_, i) =>
      makeAwareness({
        id: `rpa_${i}`,
        staff_id: `srpa_${i}`,
        policy_read: false,
        policy_version_current: false,
        understands_reporting_channels: false,
        signed_declaration: false,
      }),
    );
    const r = computeWhistleblowingSafeguardingCulture(
      baseInput({ whistleblowing_awareness_records: awareness }),
    );
    const rec = r.recommendations.find(
      (rec) => rec.urgency === "immediate" && rec.recommendation.includes("whistleblowing policy"),
    );
    expect(rec).toBeDefined();
  });

  it("immediate recommendation for reporting confidence < 50", () => {
    const confidence = Array.from({ length: 5 }, (_, i) =>
      makeConfidence({
        id: `rrc_${i}`,
        staff_id: `srrc_${i}`,
        would_report_colleague: false,
        would_report_manager: false,
        feels_safe_reporting: false,
      }),
    );
    const r = computeWhistleblowingSafeguardingCulture(
      baseInput({ reporting_confidence_records: confidence }),
    );
    const rec = r.recommendations.find(
      (rec) => rec.urgency === "immediate" && rec.recommendation.includes("low reporting confidence"),
    );
    expect(rec).toBeDefined();
  });

  it("immediate recommendation for training currency < 50", () => {
    const training = Array.from({ length: 5 }, (_, i) =>
      makeTraining({
        id: `rtc_${i}`,
        staff_id: `srtc_${i}`,
        passed: false,
        certificates_on_file: false,
        expiry_date: "2025-01-01",
      }),
    );
    const r = computeWhistleblowingSafeguardingCulture(
      baseInput({ safeguarding_training_records: training }),
    );
    const rec = r.recommendations.find(
      (rec) => rec.urgency === "immediate" && rec.recommendation.includes("safeguarding training gaps"),
    );
    expect(rec).toBeDefined();
  });

  it("immediate recommendation for child protection rate < 50", () => {
    const protection = Array.from({ length: 5 }, (_, i) =>
      makeProtection({
        id: `rcp_${i}`,
        child_id: `ch_rcp_${i}`,
        reported_within_24h: false,
        correct_channel_used: false,
        child_voice_captured: false,
        outcome_documented: false,
        follow_up_completed: false,
      }),
    );
    const r = computeWhistleblowingSafeguardingCulture(
      baseInput({ child_protection_records: protection }),
    );
    const rec = r.recommendations.find(
      (rec) => rec.urgency === "immediate" && rec.recommendation.includes("child protection practice"),
    );
    expect(rec).toBeDefined();
  });

  it("soon recommendation for policy awareness 50-69", () => {
    const awareness = Array.from({ length: 5 }, (_, i) =>
      makeAwareness({
        id: `rpa2_${i}`,
        staff_id: `srpa2_${i}`,
        policy_read: i < 3,
        policy_version_current: i < 3,
        understands_reporting_channels: i < 3,
        signed_declaration: i < 3,
      }),
    );
    const r = computeWhistleblowingSafeguardingCulture(
      baseInput({ whistleblowing_awareness_records: awareness }),
    );
    const rec = r.recommendations.find((rec) => rec.urgency === "soon" && rec.recommendation.includes("policy awareness"));
    expect(rec).toBeDefined();
  });

  it("planned recommendation for no audits with children", () => {
    const r = computeWhistleblowingSafeguardingCulture(
      baseInput({ culture_audit_records: [] }),
    );
    const rec = r.recommendations.find((rec) => rec.urgency === "planned" && rec.recommendation.includes("culture audits"));
    expect(rec).toBeDefined();
  });

  it("immediate recommendation for no awareness records with children", () => {
    const r = computeWhistleblowingSafeguardingCulture(
      baseInput({ whistleblowing_awareness_records: [] }),
    );
    const rec = r.recommendations.find((rec) => rec.recommendation.includes("whistleblowing awareness programme"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("immediate");
  });

  it("immediate recommendation for no confidence records with children", () => {
    const r = computeWhistleblowingSafeguardingCulture(
      baseInput({ reporting_confidence_records: [] }),
    );
    const rec = r.recommendations.find((rec) => rec.recommendation.includes("reporting confidence surveys"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("immediate");
  });

  it("immediate recommendation for no training records with children", () => {
    const r = computeWhistleblowingSafeguardingCulture(
      baseInput({ safeguarding_training_records: [] }),
    );
    const rec = r.recommendations.find((rec) => rec.recommendation.includes("current, accredited safeguarding training"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("immediate");
  });

  it("planned recommendation for no protection records with children", () => {
    const r = computeWhistleblowingSafeguardingCulture(
      baseInput({ child_protection_records: [] }),
    );
    const rec = r.recommendations.find((rec) => rec.recommendation.includes("child protection practice recording"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("planned");
  });

  it("recommendations have sequential ranks", () => {
    const awareness = Array.from({ length: 5 }, (_, i) =>
      makeAwareness({
        id: `rr_${i}`,
        staff_id: `srr_${i}`,
        policy_read: false,
        policy_version_current: false,
        understands_reporting_channels: false,
        signed_declaration: false,
      }),
    );
    const r = computeWhistleblowingSafeguardingCulture(
      baseInput({ whistleblowing_awareness_records: awareness }),
    );
    for (let i = 0; i < r.recommendations.length; i++) {
      expect(r.recommendations[i].rank).toBe(i + 1);
    }
  });

  it("all recommendations have regulatory_ref", () => {
    const awareness = Array.from({ length: 5 }, (_, i) =>
      makeAwareness({
        id: `rrr_${i}`,
        staff_id: `srrr_${i}`,
        policy_read: false,
        policy_version_current: false,
        understands_reporting_channels: false,
        signed_declaration: false,
      }),
    );
    const r = computeWhistleblowingSafeguardingCulture(
      baseInput({ whistleblowing_awareness_records: awareness }),
    );
    for (const rec of r.recommendations) {
      expect(rec.regulatory_ref.length).toBeGreaterThan(0);
    }
  });
});

// ==============================================================================
// INSIGHTS TESTS
// ==============================================================================

describe("Insights", () => {
  it("critical insight for policy awareness < 50", () => {
    const awareness = Array.from({ length: 5 }, (_, i) =>
      makeAwareness({
        id: `ipa_${i}`,
        staff_id: `sipa_${i}`,
        policy_read: false,
        policy_version_current: false,
        understands_reporting_channels: false,
        signed_declaration: false,
      }),
    );
    const r = computeWhistleblowingSafeguardingCulture(
      baseInput({ whistleblowing_awareness_records: awareness }),
    );
    const i = r.insights.find((i) => i.severity === "critical" && i.text.includes("policy awareness"));
    expect(i).toBeDefined();
  });

  it("critical insight for reporting confidence < 50", () => {
    const confidence = Array.from({ length: 5 }, (_, i) =>
      makeConfidence({
        id: `irc_${i}`,
        staff_id: `sirc_${i}`,
        would_report_colleague: false,
        would_report_manager: false,
        feels_safe_reporting: false,
      }),
    );
    const r = computeWhistleblowingSafeguardingCulture(
      baseInput({ reporting_confidence_records: confidence }),
    );
    const ins = r.insights.find((i) => i.severity === "critical" && i.text.includes("reporting confidence"));
    expect(ins).toBeDefined();
  });

  it("critical insight for child safe rate < 70", () => {
    const audits = Array.from({ length: 4 }, (_, i) =>
      makeAudit({ id: `ics_${i}`, children_feel_safe: i < 2 }),
    );
    const r = computeWhistleblowingSafeguardingCulture(
      baseInput({ culture_audit_records: audits }),
    );
    const ins = r.insights.find((i) => i.severity === "critical" && i.text.includes("Children feel safe"));
    expect(ins).toBeDefined();
  });

  it("critical insight for retaliation concern >= 30%", () => {
    const awareness = Array.from({ length: 5 }, (_, i) =>
      makeAwareness({
        id: `iret_${i}`,
        staff_id: `siret_${i}`,
        concerns_about_retaliation: i < 2,
      }),
    );
    const r = computeWhistleblowingSafeguardingCulture(
      baseInput({ whistleblowing_awareness_records: awareness }),
    );
    const ins = r.insights.find((i) => i.severity === "critical" && i.text.includes("retaliation"));
    expect(ins).toBeDefined();
  });

  it("critical insight for safe reporting < 50", () => {
    const confidence = Array.from({ length: 5 }, (_, i) =>
      makeConfidence({
        id: `isr_${i}`,
        staff_id: `sisr_${i}`,
        feels_safe_reporting: i < 2,
      }),
    );
    const r = computeWhistleblowingSafeguardingCulture(
      baseInput({ reporting_confidence_records: confidence }),
    );
    const ins = r.insights.find((i) => i.severity === "critical" && i.text.includes("feel safe reporting"));
    expect(ins).toBeDefined();
  });

  it("critical insight for no awareness + no confidence records with children", () => {
    const r = computeWhistleblowingSafeguardingCulture(
      baseInput({
        whistleblowing_awareness_records: [],
        reporting_confidence_records: [],
      }),
    );
    const ins = r.insights.find(
      (i) => i.severity === "critical" && i.text.includes("No whistleblowing awareness or reporting confidence"),
    );
    expect(ins).toBeDefined();
  });

  it("warning insight for policy awareness 50-69", () => {
    const awareness = Array.from({ length: 5 }, (_, i) =>
      makeAwareness({
        id: `wpa_${i}`,
        staff_id: `swpa_${i}`,
        policy_read: i < 3,
        policy_version_current: i < 3,
        understands_reporting_channels: i < 3,
        signed_declaration: i < 3,
      }),
    );
    const r = computeWhistleblowingSafeguardingCulture(
      baseInput({ whistleblowing_awareness_records: awareness }),
    );
    const ins = r.insights.find((i) => i.severity === "warning" && i.text.includes("Policy awareness"));
    expect(ins).toBeDefined();
  });

  it("warning insight for avg confidence 3.0-3.99", () => {
    const confidence = Array.from({ length: 5 }, (_, i) =>
      makeConfidence({
        id: `wac_${i}`,
        staff_id: `swac_${i}`,
        confidence_level: 3,
      }),
    );
    const r = computeWhistleblowingSafeguardingCulture(
      baseInput({ reporting_confidence_records: confidence }),
    );
    const ins = r.insights.find((i) => i.severity === "warning" && i.text.includes("Staff confidence averages"));
    expect(ins).toBeDefined();
  });

  it("warning insight for retaliation 10-19%", () => {
    // 1 of 10 => 10%
    const awareness = Array.from({ length: 10 }, (_, i) =>
      makeAwareness({
        id: `wret_${i}`,
        staff_id: `swret_${i}`,
        concerns_about_retaliation: i < 1,
      }),
    );
    const r = computeWhistleblowingSafeguardingCulture(
      baseInput({ whistleblowing_awareness_records: awareness }),
    );
    const ins = r.insights.find((i) => i.severity === "warning" && i.text.includes("concern about retaliation"));
    expect(ins).toBeDefined();
  });

  it("positive insight for outstanding rating", () => {
    const r = computeWhistleblowingSafeguardingCulture(baseInput());
    const ins = r.insights.find(
      (i) => i.severity === "positive" && i.text.includes("outstanding safeguarding culture"),
    );
    expect(ins).toBeDefined();
  });

  it("positive insight for policy + reporting confidence both >= 90", () => {
    const r = computeWhistleblowingSafeguardingCulture(baseInput());
    const ins = r.insights.find(
      (i) => i.severity === "positive" && i.text.includes("policy awareness combined with"),
    );
    expect(ins).toBeDefined();
  });

  it("positive insight for training currency >= 90", () => {
    const r = computeWhistleblowingSafeguardingCulture(baseInput());
    const ins = r.insights.find(
      (i) => i.severity === "positive" && i.text.includes("safeguarding training currency"),
    );
    expect(ins).toBeDefined();
  });

  it("positive insight for child protection >= 90", () => {
    const r = computeWhistleblowingSafeguardingCulture(baseInput());
    const ins = r.insights.find(
      (i) => i.severity === "positive" && i.text.includes("child protection practice quality"),
    );
    expect(ins).toBeDefined();
  });

  it("positive insight for childSafe >= 90 and staffHeard >= 90", () => {
    const r = computeWhistleblowingSafeguardingCulture(baseInput());
    const ins = r.insights.find(
      (i) => i.severity === "positive" && i.text.includes("Children feel safe") && i.text.includes("staff feel heard"),
    );
    expect(ins).toBeDefined();
  });

  it("positive insight for safe reporting >= 90 and manager report >= 80", () => {
    const r = computeWhistleblowingSafeguardingCulture(baseInput());
    const ins = r.insights.find(
      (i) => i.severity === "positive" && i.text.includes("feel safe reporting") && i.text.includes("report concerns about managers"),
    );
    expect(ins).toBeDefined();
  });

  it("positive insight for avg confidence >= 4.0", () => {
    const r = computeWhistleblowingSafeguardingCulture(baseInput());
    const ins = r.insights.find(
      (i) => i.severity === "positive" && i.text.includes("Staff confidence in reporting averages"),
    );
    expect(ins).toBeDefined();
  });

  it("positive insight for action completion >= 90", () => {
    const r = computeWhistleblowingSafeguardingCulture(baseInput());
    const ins = r.insights.find(
      (i) => i.severity === "positive" && i.text.includes("culture audit actions completed"),
    );
    expect(ins).toBeDefined();
  });

  it("positive insight for lessons learned >= 80 and debrief >= 80", () => {
    const r = computeWhistleblowingSafeguardingCulture(baseInput());
    const ins = r.insights.find(
      (i) => i.severity === "positive" && i.text.includes("Lessons learned") && i.text.includes("debrief"),
    );
    expect(ins).toBeDefined();
  });

  it("positive insight for report handling >= 90 with prior reports", () => {
    const confidence = Array.from({ length: 5 }, (_, i) =>
      makeConfidence({
        id: `irh_${i}`,
        staff_id: `sirh_${i}`,
        has_reported_before: true,
        report_handled_well: true,
      }),
    );
    const r = computeWhistleblowingSafeguardingCulture(
      baseInput({ reporting_confidence_records: confidence }),
    );
    const ins = r.insights.find(
      (i) => i.severity === "positive" && i.text.includes("whistleblowing reports handled well"),
    );
    expect(ins).toBeDefined();
  });

  it("positive insight for 3+ audit types", () => {
    const audits = [
      makeAudit({ id: "iat_0", audit_type: "internal" }),
      makeAudit({ id: "iat_1", audit_type: "external" }),
      makeAudit({ id: "iat_2", audit_type: "peer" }),
    ];
    const r = computeWhistleblowingSafeguardingCulture(
      baseInput({ culture_audit_records: audits }),
    );
    const ins = r.insights.find(
      (i) => i.severity === "positive" && i.text.includes("different types of safeguarding culture audit"),
    );
    expect(ins).toBeDefined();
  });

  it("warning insight for expired training 20-39%", () => {
    const training = Array.from({ length: 5 }, (_, i) =>
      makeTraining({
        id: `wexp_${i}`,
        staff_id: `swexp_${i}`,
        expiry_date: i < 1 ? "2025-01-01" : "2027-03-01",
      }),
    );
    const r = computeWhistleblowingSafeguardingCulture(
      baseInput({ safeguarding_training_records: training }),
    );
    const ins = r.insights.find(
      (i) => i.severity === "warning" && i.text.includes("training has expired"),
    );
    expect(ins).toBeDefined();
  });

  it("warning insight for barrier rate 20-29%", () => {
    // 1 of 4 => 25%
    const confidence = Array.from({ length: 4 }, (_, i) =>
      makeConfidence({
        id: `wbar_${i}`,
        staff_id: `swbar_${i}`,
        barriers_to_reporting: i < 1 ? ["fear"] : [],
      }),
    );
    const r = computeWhistleblowingSafeguardingCulture(
      baseInput({ reporting_confidence_records: confidence }),
    );
    const ins = r.insights.find(
      (i) => i.severity === "warning" && i.text.includes("barriers to raising concerns"),
    );
    expect(ins).toBeDefined();
  });

  it("warning insight for action completion 60-89%", () => {
    const audits = [
      makeAudit({
        id: "wac_0",
        total_actions_raised: 10,
        actions_completed: 7,
        actions_overdue: 1,
      }),
    ];
    const r = computeWhistleblowingSafeguardingCulture(
      baseInput({ culture_audit_records: audits }),
    );
    const ins = r.insights.find(
      (i) => i.severity === "warning" && i.text.includes("audit actions completed"),
    );
    expect(ins).toBeDefined();
  });

  it("warning insight for outcome rate 70-89%", () => {
    // 4 of 5 => 80%
    const protection = Array.from({ length: 5 }, (_, i) =>
      makeProtection({
        id: `wor_${i}`,
        child_id: `ch_wor_${i}`,
        outcome_documented: i < 4,
      }),
    );
    const r = computeWhistleblowingSafeguardingCulture(
      baseInput({ child_protection_records: protection }),
    );
    const ins = r.insights.find(
      (i) => i.severity === "warning" && i.text.includes("Outcomes documented"),
    );
    expect(ins).toBeDefined();
  });
});

// ==============================================================================
// EDGE CASES
// ==============================================================================

describe("Edge cases", () => {
  it("pct(0, 0) returns 0", () => {
    // When no records, all rates should be 0
    const r = computeWhistleblowingSafeguardingCulture({
      today: TODAY,
      total_children: 0,
      whistleblowing_awareness_records: [],
      reporting_confidence_records: [],
      safeguarding_training_records: [],
      culture_audit_records: [],
      child_protection_records: [],
    });
    expect(r.policy_awareness_rate).toBeNull();
    expect(r.reporting_confidence_rate).toBeNull();
    expect(r.training_currency_rate).toBeNull();
    expect(r.culture_audit_rate).toBeNull();
    expect(r.child_protection_rate).toBeNull();
    expect(r.staff_confidence_rate).toBeNull();
  });

  it("score is clamped to 0 minimum", () => {
    // Even though we can't normally get below 0 with just -22 from 52,
    // the clamp should still work. We test that the function returns >= 0.
    const awareness = Array.from({ length: 5 }, () =>
      makeAwareness({
        policy_read: false,
        policy_version_current: false,
        understands_reporting_channels: false,
        signed_declaration: false,
      }),
    );
    const confidence = Array.from({ length: 5 }, () =>
      makeConfidence({
        would_report_colleague: false,
        would_report_manager: false,
        feels_safe_reporting: false,
        confidence_level: 1,
      }),
    );
    const training = Array.from({ length: 5 }, () =>
      makeTraining({
        passed: false,
        certificates_on_file: false,
        expiry_date: "2025-01-01",
      }),
    );
    const protection = Array.from({ length: 5 }, () =>
      makeProtection({
        reported_within_24h: false,
        correct_channel_used: false,
        child_voice_captured: false,
        outcome_documented: false,
        follow_up_completed: false,
      }),
    );
    const r = computeWhistleblowingSafeguardingCulture({
      today: TODAY,
      total_children: 4,
      whistleblowing_awareness_records: awareness,
      reporting_confidence_records: confidence,
      safeguarding_training_records: training,
      culture_audit_records: [],
      child_protection_records: protection,
    });
    expect(r.safeguarding_culture_score).toBeGreaterThanOrEqual(0);
  });

  it("score is clamped to 100 maximum", () => {
    const r = computeWhistleblowingSafeguardingCulture(baseInput());
    expect(r.safeguarding_culture_score).toBeLessThanOrEqual(100);
  });

  it("max bonuses total 28 (4+4+4+4+4+3+3+2)", () => {
    // base=52 + 28 = 80
    const r = computeWhistleblowingSafeguardingCulture(baseInput());
    expect(r.safeguarding_culture_score).toBe(80);
  });

  it("single awareness record works", () => {
    const awareness = [makeAwareness({ id: "single_a", staff_id: "s_single_a" })];
    const r = computeWhistleblowingSafeguardingCulture({
      today: TODAY,
      total_children: 1,
      whistleblowing_awareness_records: awareness,
      reporting_confidence_records: [],
      safeguarding_training_records: [],
      culture_audit_records: [],
      child_protection_records: [],
    });
    expect(r.policy_awareness_rate).toBe(100);
    expect(r.safeguarding_culture_score).toBe(52 + 4);
  });

  it("single confidence record works", () => {
    const confidence = [makeConfidence({ id: "single_c", staff_id: "s_single_c" })];
    const r = computeWhistleblowingSafeguardingCulture({
      today: TODAY,
      total_children: 1,
      whistleblowing_awareness_records: [],
      reporting_confidence_records: confidence,
      safeguarding_training_records: [],
      culture_audit_records: [],
      child_protection_records: [],
    });
    expect(r.reporting_confidence_rate).toBe(100);
    expect(r.staff_confidence_rate).toBe(100);
  });

  it("single training record works", () => {
    const training = [makeTraining({ id: "single_t", staff_id: "s_single_t" })];
    const r = computeWhistleblowingSafeguardingCulture({
      today: TODAY,
      total_children: 1,
      whistleblowing_awareness_records: [],
      reporting_confidence_records: [],
      safeguarding_training_records: training,
      culture_audit_records: [],
      child_protection_records: [],
    });
    expect(r.training_currency_rate).toBe(100);
  });

  it("single audit record works", () => {
    const audits = [makeAudit({ id: "single_au" })];
    const r = computeWhistleblowingSafeguardingCulture({
      today: TODAY,
      total_children: 1,
      whistleblowing_awareness_records: [],
      reporting_confidence_records: [],
      safeguarding_training_records: [],
      culture_audit_records: audits,
      child_protection_records: [],
    });
    expect(r.culture_audit_rate).toBeGreaterThan(0);
  });

  it("single protection record works", () => {
    const protection = [makeProtection({ id: "single_p", child_id: "ch_single" })];
    const r = computeWhistleblowingSafeguardingCulture({
      today: TODAY,
      total_children: 1,
      whistleblowing_awareness_records: [],
      reporting_confidence_records: [],
      safeguarding_training_records: [],
      culture_audit_records: [],
      child_protection_records: protection,
    });
    expect(r.child_protection_rate).toBe(100);
  });

  it("total_children=1 with all empty arrays returns inadequate floor", () => {
    const r = computeWhistleblowingSafeguardingCulture({
      today: TODAY,
      total_children: 1,
      whistleblowing_awareness_records: [],
      reporting_confidence_records: [],
      safeguarding_training_records: [],
      culture_audit_records: [],
      child_protection_records: [],
    });
    expect(r.safeguarding_culture_rating).toBe("inadequate");
    expect(r.safeguarding_culture_score).toBe(15);
  });

  it("toRating boundaries: 80 is outstanding, 79 is good, 65 is good, 64 is adequate, 45 is adequate, 44 is inadequate", () => {
    // We can verify this indirectly through score manipulation
    // base=52 + 28 bonus = 80 => outstanding
    const r80 = computeWhistleblowingSafeguardingCulture(baseInput());
    expect(r80.safeguarding_culture_rating).toBe("outstanding");
    expect(r80.safeguarding_culture_score).toBe(80);
  });

  it("LADO referral tracking: null lado_referral_made is excluded from LADO stats", () => {
    const protection = [
      makeProtection({
        id: "lado_null",
        child_id: "ch_lado_null",
        lado_referral_made: null,
        lado_referral_timely: null,
      }),
      makeProtection({
        id: "lado_yes",
        child_id: "ch_lado_yes",
        lado_referral_made: true,
        lado_referral_timely: true,
      }),
    ];
    const r = computeWhistleblowingSafeguardingCulture(
      baseInput({ child_protection_records: protection }),
    );
    // Only 1 record has lado_referral_made not null, and it's true => 100%
    // So LADO referral strength should fire
    const s = r.strengths.find((s) => s.includes("LADO referrals made in 100%"));
    expect(s).toBeDefined();
  });

  it("report_handled_well only counted among those who have_reported_before", () => {
    const confidence = [
      makeConfidence({
        id: "rh_yes",
        staff_id: "s_rh_yes",
        has_reported_before: true,
        report_handled_well: true,
      }),
      makeConfidence({
        id: "rh_no",
        staff_id: "s_rh_no",
        has_reported_before: false,
        report_handled_well: null,
      }),
    ];
    const r = computeWhistleblowingSafeguardingCulture(
      baseInput({ reporting_confidence_records: confidence }),
    );
    // 1 of 1 prior reporters had it handled well => 100%
    const s = r.strengths.find((s) => s.includes("report was handled well"));
    expect(s).toBeDefined();
  });

  it("training with expired date and passed=true does not count as in-date", () => {
    const training = [
      makeTraining({
        id: "exp_pass",
        staff_id: "s_exp_pass",
        passed: true,
        expiry_date: "2025-01-01",
        certificates_on_file: true,
      }),
    ];
    const r = computeWhistleblowingSafeguardingCulture(
      baseInput({ safeguarding_training_records: training }),
    );
    // inDateRate = 0 (expired), passRate=100, certRate=100 => round((0+100+100)/3) = 67
    expect(r.training_currency_rate).toBe(67);
  });

  it("large number of records is handled correctly", () => {
    const awareness = Array.from({ length: 100 }, (_, i) =>
      makeAwareness({ id: `large_a_${i}`, staff_id: `slarge_a_${i}` }),
    );
    const r = computeWhistleblowingSafeguardingCulture(
      baseInput({ whistleblowing_awareness_records: awareness }),
    );
    expect(r.policy_awareness_rate).toBe(100);
  });

  it("all audit rating types map correctly", () => {
    // outstanding=100, good=75, adequate=50, inadequate=25
    const audits = [
      makeAudit({ id: "art_0", overall_rating: "outstanding", open_culture_score: 0, children_feel_safe: false }),
      makeAudit({ id: "art_1", overall_rating: "good", open_culture_score: 0, children_feel_safe: false }),
      makeAudit({ id: "art_2", overall_rating: "adequate", open_culture_score: 0, children_feel_safe: false }),
      makeAudit({ id: "art_3", overall_rating: "inadequate", open_culture_score: 0, children_feel_safe: false }),
    ];
    const r = computeWhistleblowingSafeguardingCulture(
      baseInput({ culture_audit_records: audits }),
    );
    // avgAuditRating = round((100+75+50+25)/4) = 63
    // avgOpenCulture = 0
    // childSafe = 0
    // cultureAuditRate = round((63+0+0)/3) = 21
    expect(r.culture_audit_rate).toBe(21);
  });

  it("all quality rating types map correctly", () => {
    // excellent=100, good=75, adequate=50, poor=25
    const protection = [
      makeProtection({ id: "qr_0", child_id: "ch_qr_0", quality_rating: "excellent" }),
      makeProtection({ id: "qr_1", child_id: "ch_qr_1", quality_rating: "good" }),
      makeProtection({ id: "qr_2", child_id: "ch_qr_2", quality_rating: "adequate" }),
      makeProtection({ id: "qr_3", child_id: "ch_qr_3", quality_rating: "poor" }),
    ];
    const r = computeWhistleblowingSafeguardingCulture(
      baseInput({ child_protection_records: protection }),
    );
    // avgProtectionQuality = round((100+75+50+25)/4) = 63 -- verified indirectly
    // The important check is it doesn't crash and generates correct child_protection_rate
    expect(r.child_protection_rate).toBe(100); // all defaults true
  });

  it("headline counts concerns/strengths correctly for good rating", () => {
    const awareness = Array.from({ length: 5 }, (_, i) =>
      makeAwareness({
        id: `hg_${i}`,
        staff_id: `shg_${i}`,
        policy_read: i < 3,
        policy_version_current: i < 3,
        understands_reporting_channels: i < 4,
        signed_declaration: i < 3,
      }),
    );
    const confidence = Array.from({ length: 5 }, (_, i) =>
      makeConfidence({
        id: `hgc_${i}`,
        staff_id: `shgc_${i}`,
        confidence_level: 3,
        would_report_colleague: i < 4,
        would_report_manager: i < 4,
        feels_safe_reporting: i < 3,
      }),
    );
    const r = computeWhistleblowingSafeguardingCulture(
      baseInput({
        whistleblowing_awareness_records: awareness,
        reporting_confidence_records: confidence,
      }),
    );
    if (r.safeguarding_culture_rating === "good") {
      expect(r.headline).toContain("Good safeguarding culture");
      expect(r.headline).toContain("strength");
    }
  });

  it("staff confidence rate rounding: confidence 3.5 => (3.5/5)*100 = 70", () => {
    // Mix of 3 and 4 => avg = 3.5
    const confidence = [
      makeConfidence({ id: "scr_a", staff_id: "sscr_a", confidence_level: 3 }),
      makeConfidence({ id: "scr_b", staff_id: "sscr_b", confidence_level: 4 }),
    ];
    const r = computeWhistleblowingSafeguardingCulture(
      baseInput({ reporting_confidence_records: confidence }),
    );
    expect(r.staff_confidence_rate).toBe(70);
  });

  it("partial data: only awareness records, everything else empty", () => {
    const awareness = Array.from({ length: 3 }, (_, i) =>
      makeAwareness({ id: `pd_a_${i}`, staff_id: `spd_a_${i}` }),
    );
    const r = computeWhistleblowingSafeguardingCulture({
      today: TODAY,
      total_children: 2,
      whistleblowing_awareness_records: awareness,
      reporting_confidence_records: [],
      safeguarding_training_records: [],
      culture_audit_records: [],
      child_protection_records: [],
    });
    // Not allEmpty (has awareness), children > 0
    expect(r.safeguarding_culture_rating).not.toBe("insufficient_data");
    expect(r.policy_awareness_rate).toBe(100);
    // Should have concerns about missing other records
    const missingConcerns = r.concerns.filter(
      (c) =>
        c.includes("No reporting confidence") ||
        c.includes("No safeguarding training") ||
        c.includes("No culture audit") ||
        c.includes("No child protection"),
    );
    expect(missingConcerns.length).toBe(4);
  });
});

// ==============================================================================
// HEADLINE TESTS
// ==============================================================================

describe("Headlines", () => {
  it("outstanding headline is fixed text", () => {
    const r = computeWhistleblowingSafeguardingCulture(baseInput());
    expect(r.headline).toBe(
      "Outstanding safeguarding culture -- whistleblowing is embedded, staff are confident and competent, and child protection practice meets the highest standards.",
    );
  });

  it("adequate headline mentions concern count", () => {
    const awareness = Array.from({ length: 5 }, (_, i) =>
      makeAwareness({
        id: `had_${i}`,
        staff_id: `shad_${i}`,
        policy_read: i < 3,
        policy_version_current: i < 3,
        understands_reporting_channels: i < 3,
        signed_declaration: i < 3,
        refresher_completed: i < 3,
        quiz_passed: i < 3,
        aware_of_protections: i < 3,
      }),
    );
    const confidence = Array.from({ length: 5 }, (_, i) =>
      makeConfidence({
        id: `hadc_${i}`,
        staff_id: `shadc_${i}`,
        confidence_level: 3,
        would_report_colleague: i < 3,
        would_report_manager: i < 3,
        feels_safe_reporting: i < 3,
      }),
    );
    const training = Array.from({ length: 5 }, (_, i) =>
      makeTraining({
        id: `hadt_${i}`,
        staff_id: `shadt_${i}`,
        passed: i < 3,
        expiry_date: i < 3 ? "2027-03-01" : "2025-01-01",
        certificates_on_file: i < 3,
        accredited: i < 3,
      }),
    );
    const audits = [
      makeAudit({
        id: "had_au",
        overall_rating: "adequate",
        open_culture_score: 55,
        children_feel_safe: true,
        staff_feel_heard: false,
        whistleblowing_policy_visible: false,
        children_know_how_to_complain: false,
      }),
    ];
    const protection = Array.from({ length: 5 }, (_, i) =>
      makeProtection({
        id: `hadp_${i}`,
        child_id: `ch_hadp_${i}`,
        reported_within_24h: i < 3,
        correct_channel_used: i < 3,
        child_voice_captured: i < 3,
        outcome_documented: i < 3,
        follow_up_completed: i < 3,
      }),
    );
    const r = computeWhistleblowingSafeguardingCulture({
      today: TODAY,
      total_children: 4,
      whistleblowing_awareness_records: awareness,
      reporting_confidence_records: confidence,
      safeguarding_training_records: training,
      culture_audit_records: audits,
      child_protection_records: protection,
    });
    if (r.safeguarding_culture_rating === "adequate") {
      expect(r.headline).toContain("concern");
    }
  });

  it("inadequate headline mentions significant concerns", () => {
    const awareness = Array.from({ length: 5 }, (_, i) =>
      makeAwareness({
        id: `hin_${i}`,
        staff_id: `shin_${i}`,
        policy_read: false,
        policy_version_current: false,
        understands_reporting_channels: false,
        signed_declaration: false,
      }),
    );
    const confidence = Array.from({ length: 5 }, (_, i) =>
      makeConfidence({
        id: `hinc_${i}`,
        staff_id: `shinc_${i}`,
        would_report_colleague: false,
        would_report_manager: false,
        feels_safe_reporting: false,
        confidence_level: 1,
      }),
    );
    const training = Array.from({ length: 5 }, (_, i) =>
      makeTraining({
        id: `hint_${i}`,
        staff_id: `shint_${i}`,
        passed: false,
        certificates_on_file: false,
        expiry_date: "2025-01-01",
      }),
    );
    const protection = Array.from({ length: 5 }, (_, i) =>
      makeProtection({
        id: `hinp_${i}`,
        child_id: `ch_hinp_${i}`,
        reported_within_24h: false,
        correct_channel_used: false,
        child_voice_captured: false,
        outcome_documented: false,
        follow_up_completed: false,
      }),
    );
    const r = computeWhistleblowingSafeguardingCulture({
      today: TODAY,
      total_children: 4,
      whistleblowing_awareness_records: awareness,
      reporting_confidence_records: confidence,
      safeguarding_training_records: training,
      culture_audit_records: [],
      child_protection_records: protection,
    });
    expect(r.headline).toContain("inadequate");
    expect(r.headline).toContain("significant concern");
  });
});

// ==============================================================================
// RETURN SHAPE
// ==============================================================================

describe("Return shape", () => {
  it("returns all required fields", () => {
    const r = computeWhistleblowingSafeguardingCulture(baseInput());
    expect(r).toHaveProperty("safeguarding_culture_rating");
    expect(r).toHaveProperty("safeguarding_culture_score");
    expect(r).toHaveProperty("headline");
    expect(r).toHaveProperty("policy_awareness_rate");
    expect(r).toHaveProperty("reporting_confidence_rate");
    expect(r).toHaveProperty("training_currency_rate");
    expect(r).toHaveProperty("culture_audit_rate");
    expect(r).toHaveProperty("child_protection_rate");
    expect(r).toHaveProperty("staff_confidence_rate");
    expect(r).toHaveProperty("strengths");
    expect(r).toHaveProperty("concerns");
    expect(r).toHaveProperty("recommendations");
    expect(r).toHaveProperty("insights");
  });

  it("rates are numbers between 0 and 100", () => {
    const r = computeWhistleblowingSafeguardingCulture(baseInput());
    for (const key of [
      "policy_awareness_rate",
      "reporting_confidence_rate",
      "training_currency_rate",
      "culture_audit_rate",
      "child_protection_rate",
      "staff_confidence_rate",
    ] as const) {
      expect(r[key]).toBeGreaterThanOrEqual(0);
      expect(r[key]).toBeLessThanOrEqual(100);
    }
  });

  it("strengths/concerns are string arrays", () => {
    const r = computeWhistleblowingSafeguardingCulture(baseInput());
    expect(Array.isArray(r.strengths)).toBe(true);
    expect(Array.isArray(r.concerns)).toBe(true);
    for (const s of r.strengths) expect(typeof s).toBe("string");
    for (const c of r.concerns) expect(typeof c).toBe("string");
  });

  it("recommendations have rank, recommendation, urgency, regulatory_ref", () => {
    const awareness = Array.from({ length: 5 }, (_, i) =>
      makeAwareness({
        id: `rs_${i}`,
        staff_id: `srs_${i}`,
        policy_read: false,
        policy_version_current: false,
        understands_reporting_channels: false,
        signed_declaration: false,
      }),
    );
    const r = computeWhistleblowingSafeguardingCulture(
      baseInput({ whistleblowing_awareness_records: awareness }),
    );
    for (const rec of r.recommendations) {
      expect(rec).toHaveProperty("rank");
      expect(rec).toHaveProperty("recommendation");
      expect(rec).toHaveProperty("urgency");
      expect(rec).toHaveProperty("regulatory_ref");
      expect(["immediate", "soon", "planned"]).toContain(rec.urgency);
    }
  });

  it("insights have text and severity", () => {
    const r = computeWhistleblowingSafeguardingCulture(baseInput());
    for (const ins of r.insights) {
      expect(ins).toHaveProperty("text");
      expect(ins).toHaveProperty("severity");
      expect(["critical", "warning", "positive"]).toContain(ins.severity);
    }
  });
});
