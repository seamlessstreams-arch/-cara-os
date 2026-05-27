// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME HEALTH MONITORING INTELLIGENCE ENGINE — TESTS
// CHR 2015 Reg 10/15: Health & Wellbeing monitoring for looked-after children.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeHomeHealthMonitoring,
  type HomeHealthMonitoringInput,
  type AnnualHealthAssessmentInput,
  type HealthPassportInput,
  type ImmunisationInput,
  type DentalInput,
} from "../home-health-monitoring-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeAHA(overrides: Partial<AnnualHealthAssessmentInput> = {}): AnnualHealthAssessmentInput {
  return {
    id: "aha_test",
    child_id: "yp_alex",
    assessment_date: "2026-04-15",
    due_date: "2026-04-30",
    completed_within_deadline: true,
    immunisations_up_to_date: true,
    dental_up_to_date: true,
    optical_up_to_date: true,
    recommendations_count: 2,
    next_assessment_date: "2027-04-15",
    signed_off_by_la: true,
    report_shared: true,
    ...overrides,
  };
}

function makePassport(overrides: Partial<HealthPassportInput> = {}): HealthPassportInput {
  return {
    id: "hp_test",
    child_id: "yp_alex",
    last_updated: "2026-04-01",
    medications_count: 2,
    conditions_count: 1,
    immunisations_up_to_date: true,
    consent_status: "given",
    ...overrides,
  };
}

function makeImmunisation(overrides: Partial<ImmunisationInput> = {}): ImmunisationInput {
  return {
    id: "imm_test",
    child_id: "yp_alex",
    gp_registered: true,
    missed_count: 0,
    caught_up_count: 0,
    upcoming_due_count: 0,
    child_consent: true,
    gp_reviewed: true,
    ...overrides,
  };
}

function makeDental(overrides: Partial<DentalInput> = {}): DentalInput {
  return {
    id: "dent_test",
    child_id: "yp_alex",
    registration_status: "registered",
    last_check_up_date: "2026-03-15",
    next_check_up_due: "2026-09-15",
    has_anxiety: false,
    adjustments_count: 0,
    ...overrides,
  };
}

function baseInput(overrides: Partial<HomeHealthMonitoringInput> = {}): HomeHealthMonitoringInput {
  return {
    today: "2026-05-27",
    total_children: 3,
    annual_health_assessments: [
      makeAHA({ id: "aha_1", child_id: "yp_alex" }),
      makeAHA({ id: "aha_2", child_id: "yp_jordan" }),
      makeAHA({ id: "aha_3", child_id: "yp_casey" }),
    ],
    health_passports: [
      makePassport({ id: "hp_1", child_id: "yp_alex" }),
      makePassport({ id: "hp_2", child_id: "yp_jordan" }),
      makePassport({ id: "hp_3", child_id: "yp_casey" }),
    ],
    immunisations: [
      makeImmunisation({ id: "imm_1", child_id: "yp_alex" }),
      makeImmunisation({ id: "imm_2", child_id: "yp_jordan" }),
      makeImmunisation({ id: "imm_3", child_id: "yp_casey" }),
    ],
    dental_records: [
      makeDental({ id: "dent_1", child_id: "yp_alex" }),
      makeDental({ id: "dent_2", child_id: "yp_jordan" }),
      makeDental({ id: "dent_3", child_id: "yp_casey" }),
    ],
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. INSUFFICIENT DATA
// ═══════════════════════════════════════════════════════════════════════════

describe("insufficient data", () => {
  it("returns insufficient_data when all arrays empty", () => {
    const r = computeHomeHealthMonitoring(baseInput({
      annual_health_assessments: [],
      health_passports: [],
      immunisations: [],
      dental_records: [],
    }));
    expect(r.health_monitoring_rating).toBe("insufficient_data");
    expect(r.health_monitoring_score).toBe(0);
  });

  it("populates empty profiles on insufficient data", () => {
    const r = computeHomeHealthMonitoring(baseInput({
      annual_health_assessments: [],
      health_passports: [],
      immunisations: [],
      dental_records: [],
    }));
    expect(r.assessment.total_assessments).toBe(0);
    expect(r.immunisation.total_records).toBe(0);
    expect(r.dental.total_records).toBe(0);
    expect(r.passport.total_passports).toBe(0);
  });

  it("includes a concern on insufficient data", () => {
    const r = computeHomeHealthMonitoring(baseInput({
      annual_health_assessments: [],
      health_passports: [],
      immunisations: [],
      dental_records: [],
    }));
    expect(r.concerns.length).toBeGreaterThan(0);
    expect(r.concerns[0]).toContain("No health monitoring data");
  });

  it("includes a recommendation on insufficient data", () => {
    const r = computeHomeHealthMonitoring(baseInput({
      annual_health_assessments: [],
      health_passports: [],
      immunisations: [],
      dental_records: [],
    }));
    expect(r.recommendations.length).toBe(1);
    expect(r.recommendations[0].urgency).toBe("immediate");
  });

  it("includes a critical insight on insufficient data", () => {
    const r = computeHomeHealthMonitoring(baseInput({
      annual_health_assessments: [],
      health_passports: [],
      immunisations: [],
      dental_records: [],
    }));
    expect(r.insights.length).toBe(1);
    expect(r.insights[0].severity).toBe("critical");
  });

  it("still computes when only some arrays have data", () => {
    const r = computeHomeHealthMonitoring(baseInput({
      annual_health_assessments: [],
      health_passports: [],
      immunisations: [makeImmunisation()],
      dental_records: [],
    }));
    expect(r.health_monitoring_rating).not.toBe("insufficient_data");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. ASSESSMENT PROFILE
// ═══════════════════════════════════════════════════════════════════════════

describe("assessment profile", () => {
  it("counts total assessments", () => {
    const r = computeHomeHealthMonitoring(baseInput());
    expect(r.assessment.total_assessments).toBe(3);
  });

  it("filters recent assessments within 365 days", () => {
    const r = computeHomeHealthMonitoring(baseInput({
      annual_health_assessments: [
        makeAHA({ id: "aha_1", assessment_date: "2026-04-15" }),    // 42 days ago
        makeAHA({ id: "aha_2", assessment_date: "2025-01-01" }),    // >365 days
      ],
    }));
    expect(r.assessment.recent_365d).toBe(1);
  });

  it("counts unique children assessed", () => {
    const r = computeHomeHealthMonitoring(baseInput({
      annual_health_assessments: [
        makeAHA({ id: "aha_1", child_id: "yp_alex" }),
        makeAHA({ id: "aha_2", child_id: "yp_alex" }),
        makeAHA({ id: "aha_3", child_id: "yp_jordan" }),
      ],
    }));
    expect(r.assessment.children_assessed).toBe(2);
  });

  it("calculates completion rate", () => {
    const r = computeHomeHealthMonitoring(baseInput({
      annual_health_assessments: [
        makeAHA({ id: "aha_1", completed_within_deadline: true }),
        makeAHA({ id: "aha_2", completed_within_deadline: false }),
      ],
    }));
    expect(r.assessment.completion_rate).toBe(50);
  });

  it("calculates immunisation up-to-date rate from AHAs", () => {
    const r = computeHomeHealthMonitoring(baseInput({
      annual_health_assessments: [
        makeAHA({ id: "aha_1", immunisations_up_to_date: true }),
        makeAHA({ id: "aha_2", immunisations_up_to_date: false }),
        makeAHA({ id: "aha_3", immunisations_up_to_date: true }),
      ],
    }));
    expect(r.assessment.immunisations_up_to_date_rate).toBe(67);
  });

  it("calculates dental up-to-date rate", () => {
    const r = computeHomeHealthMonitoring(baseInput({
      annual_health_assessments: [
        makeAHA({ id: "aha_1", dental_up_to_date: true }),
        makeAHA({ id: "aha_2", dental_up_to_date: true }),
        makeAHA({ id: "aha_3", dental_up_to_date: false }),
      ],
    }));
    expect(r.assessment.dental_up_to_date_rate).toBe(67);
  });

  it("calculates optical up-to-date rate", () => {
    const r = computeHomeHealthMonitoring(baseInput({
      annual_health_assessments: [
        makeAHA({ id: "aha_1", optical_up_to_date: true }),
        makeAHA({ id: "aha_2", optical_up_to_date: false }),
      ],
    }));
    expect(r.assessment.optical_up_to_date_rate).toBe(50);
  });

  it("calculates LA sign-off rate", () => {
    const r = computeHomeHealthMonitoring(baseInput({
      annual_health_assessments: [
        makeAHA({ id: "aha_1", signed_off_by_la: true }),
        makeAHA({ id: "aha_2", signed_off_by_la: true }),
        makeAHA({ id: "aha_3", signed_off_by_la: false }),
      ],
    }));
    expect(r.assessment.la_sign_off_rate).toBe(67);
  });

  it("calculates report shared rate", () => {
    const r = computeHomeHealthMonitoring(baseInput({
      annual_health_assessments: [
        makeAHA({ id: "aha_1", report_shared: true }),
        makeAHA({ id: "aha_2", report_shared: false }),
      ],
    }));
    expect(r.assessment.report_shared_rate).toBe(50);
  });

  it("calculates average recommendations", () => {
    const r = computeHomeHealthMonitoring(baseInput({
      annual_health_assessments: [
        makeAHA({ id: "aha_1", recommendations_count: 3 }),
        makeAHA({ id: "aha_2", recommendations_count: 1 }),
      ],
    }));
    expect(r.assessment.avg_recommendations).toBe(2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. IMMUNISATION PROFILE
// ═══════════════════════════════════════════════════════════════════════════

describe("immunisation profile", () => {
  it("counts total records", () => {
    const r = computeHomeHealthMonitoring(baseInput());
    expect(r.immunisation.total_records).toBe(3);
  });

  it("calculates GP registered rate", () => {
    const r = computeHomeHealthMonitoring(baseInput({
      immunisations: [
        makeImmunisation({ id: "i1", gp_registered: true }),
        makeImmunisation({ id: "i2", gp_registered: false }),
      ],
    }));
    expect(r.immunisation.gp_registered_rate).toBe(50);
  });

  it("sums missed and caught-up counts", () => {
    const r = computeHomeHealthMonitoring(baseInput({
      immunisations: [
        makeImmunisation({ id: "i1", missed_count: 2, caught_up_count: 1 }),
        makeImmunisation({ id: "i2", missed_count: 1, caught_up_count: 1 }),
      ],
    }));
    expect(r.immunisation.missed_total).toBe(3);
    expect(r.immunisation.caught_up_total).toBe(2);
  });

  it("sums upcoming due count", () => {
    const r = computeHomeHealthMonitoring(baseInput({
      immunisations: [
        makeImmunisation({ id: "i1", upcoming_due_count: 2 }),
        makeImmunisation({ id: "i2", upcoming_due_count: 3 }),
      ],
    }));
    expect(r.immunisation.upcoming_due_total).toBe(5);
  });

  it("calculates child consent rate", () => {
    const r = computeHomeHealthMonitoring(baseInput({
      immunisations: [
        makeImmunisation({ id: "i1", child_consent: true }),
        makeImmunisation({ id: "i2", child_consent: true }),
        makeImmunisation({ id: "i3", child_consent: false }),
      ],
    }));
    expect(r.immunisation.child_consent_rate).toBe(67);
  });

  it("calculates GP reviewed rate", () => {
    const r = computeHomeHealthMonitoring(baseInput({
      immunisations: [
        makeImmunisation({ id: "i1", gp_reviewed: true }),
        makeImmunisation({ id: "i2", gp_reviewed: false }),
      ],
    }));
    expect(r.immunisation.gp_reviewed_rate).toBe(50);
  });

  it("calculates catch-up ratio", () => {
    const r = computeHomeHealthMonitoring(baseInput({
      immunisations: [
        makeImmunisation({ id: "i1", missed_count: 4, caught_up_count: 2 }),
      ],
    }));
    expect(r.immunisation.catch_up_ratio).toBe(50);
  });

  it("caps catch-up ratio at 100", () => {
    const r = computeHomeHealthMonitoring(baseInput({
      immunisations: [
        makeImmunisation({ id: "i1", missed_count: 1, caught_up_count: 5 }),
      ],
    }));
    expect(r.immunisation.catch_up_ratio).toBe(100);
  });

  it("returns 100 catch-up ratio when no missed", () => {
    const r = computeHomeHealthMonitoring(baseInput({
      immunisations: [
        makeImmunisation({ id: "i1", missed_count: 0, caught_up_count: 0 }),
      ],
    }));
    expect(r.immunisation.catch_up_ratio).toBe(100);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. DENTAL PROFILE
// ═══════════════════════════════════════════════════════════════════════════

describe("dental profile", () => {
  it("counts total records", () => {
    const r = computeHomeHealthMonitoring(baseInput());
    expect(r.dental.total_records).toBe(3);
  });

  it("calculates registered rate", () => {
    const r = computeHomeHealthMonitoring(baseInput({
      dental_records: [
        makeDental({ id: "d1", registration_status: "registered" }),
        makeDental({ id: "d2", registration_status: "not_registered" }),
        makeDental({ id: "d3", registration_status: "waiting_list" }),
      ],
    }));
    expect(r.dental.registered_rate).toBe(33);
  });

  it("counts overdue checkups", () => {
    const r = computeHomeHealthMonitoring(baseInput({
      dental_records: [
        makeDental({ id: "d1", next_check_up_due: "2026-04-01" }),  // overdue
        makeDental({ id: "d2", next_check_up_due: "2026-06-01" }),  // not overdue
        makeDental({ id: "d3", next_check_up_due: "2026-03-15" }),  // overdue
      ],
    }));
    expect(r.dental.overdue_checkups).toBe(2);
  });

  it("counts anxiety", () => {
    const r = computeHomeHealthMonitoring(baseInput({
      dental_records: [
        makeDental({ id: "d1", has_anxiety: true }),
        makeDental({ id: "d2", has_anxiety: false }),
        makeDental({ id: "d3", has_anxiety: true }),
      ],
    }));
    expect(r.dental.anxiety_count).toBe(2);
  });

  it("calculates average adjustments", () => {
    const r = computeHomeHealthMonitoring(baseInput({
      dental_records: [
        makeDental({ id: "d1", adjustments_count: 3 }),
        makeDental({ id: "d2", adjustments_count: 1 }),
      ],
    }));
    expect(r.dental.avg_adjustments).toBe(2);
  });

  it("counts unique children with dental records", () => {
    const r = computeHomeHealthMonitoring(baseInput({
      dental_records: [
        makeDental({ id: "d1", child_id: "yp_alex" }),
        makeDental({ id: "d2", child_id: "yp_alex" }),
        makeDental({ id: "d3", child_id: "yp_jordan" }),
      ],
    }));
    expect(r.dental.children_with_dental).toBe(2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. PASSPORT PROFILE
// ═══════════════════════════════════════════════════════════════════════════

describe("passport profile", () => {
  it("counts total passports", () => {
    const r = computeHomeHealthMonitoring(baseInput());
    expect(r.passport.total_passports).toBe(3);
  });

  it("calculates currency rate (within 6 months)", () => {
    const r = computeHomeHealthMonitoring(baseInput({
      health_passports: [
        makePassport({ id: "hp_1", last_updated: "2026-04-01" }),    // within 6 months
        makePassport({ id: "hp_2", last_updated: "2025-08-01" }),    // >6 months
        makePassport({ id: "hp_3", last_updated: "2026-05-20" }),    // within 6 months
      ],
    }));
    expect(r.passport.currency_rate).toBe(67);
  });

  it("calculates average medications", () => {
    const r = computeHomeHealthMonitoring(baseInput({
      health_passports: [
        makePassport({ id: "hp_1", medications_count: 3 }),
        makePassport({ id: "hp_2", medications_count: 1 }),
      ],
    }));
    expect(r.passport.avg_medications).toBe(2);
  });

  it("calculates average conditions", () => {
    const r = computeHomeHealthMonitoring(baseInput({
      health_passports: [
        makePassport({ id: "hp_1", conditions_count: 2 }),
        makePassport({ id: "hp_2", conditions_count: 4 }),
      ],
    }));
    expect(r.passport.avg_conditions).toBe(3);
  });

  it("calculates consent given rate", () => {
    const r = computeHomeHealthMonitoring(baseInput({
      health_passports: [
        makePassport({ id: "hp_1", consent_status: "given" }),
        makePassport({ id: "hp_2", consent_status: "pending" }),
        makePassport({ id: "hp_3", consent_status: "given" }),
      ],
    }));
    expect(r.passport.consent_given_rate).toBe(67);
  });

  it("accepts consented as a valid consent status", () => {
    const r = computeHomeHealthMonitoring(baseInput({
      health_passports: [
        makePassport({ id: "hp_1", consent_status: "consented" }),
      ],
    }));
    expect(r.passport.consent_given_rate).toBe(100);
  });

  it("calculates immunisations up-to-date rate", () => {
    const r = computeHomeHealthMonitoring(baseInput({
      health_passports: [
        makePassport({ id: "hp_1", immunisations_up_to_date: true }),
        makePassport({ id: "hp_2", immunisations_up_to_date: false }),
      ],
    }));
    expect(r.passport.immunisations_up_to_date_rate).toBe(50);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 6. SCORING — BASE AND MODIFIERS
// ═══════════════════════════════════════════════════════════════════════════

describe("scoring", () => {
  it("achieves outstanding (>=80) with perfect data", () => {
    const r = computeHomeHealthMonitoring(baseInput());
    expect(r.health_monitoring_score).toBeGreaterThanOrEqual(80);
    expect(r.health_monitoring_rating).toBe("outstanding");
  });

  it("base 52 + all 8 bonuses = 80", () => {
    // With perfect data: 52 + 5 + 4 + 4 + 3 + 3 + 3 + 3 + 3 = 80
    const r = computeHomeHealthMonitoring(baseInput());
    expect(r.health_monitoring_score).toBe(80);
  });

  it("AHA completion rate modifier: penalty when no children assessed", () => {
    const r = computeHomeHealthMonitoring(baseInput({
      annual_health_assessments: [],
      total_children: 3,
    }));
    // ahaCompRate = 0 → -5
    expect(r.health_monitoring_score).toBeLessThan(
      computeHomeHealthMonitoring(baseInput()).health_monitoring_score
    );
  });

  it("immunisation coverage penalty when poor catch-up", () => {
    const r = computeHomeHealthMonitoring(baseInput({
      immunisations: [
        makeImmunisation({ id: "i1", missed_count: 5, caught_up_count: 0 }),
        makeImmunisation({ id: "i2", missed_count: 5, caught_up_count: 0 }),
        makeImmunisation({ id: "i3", missed_count: 5, caught_up_count: 0 }),
      ],
    }));
    const perfect = computeHomeHealthMonitoring(baseInput());
    expect(r.health_monitoring_score).toBeLessThan(perfect.health_monitoring_score);
  });

  it("dental registration penalty when not registered", () => {
    const r = computeHomeHealthMonitoring(baseInput({
      dental_records: [
        makeDental({ id: "d1", registration_status: "not_registered" }),
        makeDental({ id: "d2", registration_status: "not_registered" }),
        makeDental({ id: "d3", registration_status: "not_registered" }),
      ],
    }));
    const perfect = computeHomeHealthMonitoring(baseInput());
    expect(r.health_monitoring_score).toBeLessThan(perfect.health_monitoring_score);
  });

  it("passport currency penalty when outdated", () => {
    const r = computeHomeHealthMonitoring(baseInput({
      health_passports: [
        makePassport({ id: "hp_1", last_updated: "2025-01-01" }),
        makePassport({ id: "hp_2", last_updated: "2025-01-01" }),
        makePassport({ id: "hp_3", last_updated: "2025-01-01" }),
      ],
    }));
    const perfect = computeHomeHealthMonitoring(baseInput());
    expect(r.health_monitoring_score).toBeLessThan(perfect.health_monitoring_score);
  });

  it("AHA timeliness penalty when deadlines missed", () => {
    const r = computeHomeHealthMonitoring(baseInput({
      annual_health_assessments: [
        makeAHA({ id: "aha_1", completed_within_deadline: false }),
        makeAHA({ id: "aha_2", completed_within_deadline: false }),
        makeAHA({ id: "aha_3", completed_within_deadline: false }),
      ],
    }));
    const perfect = computeHomeHealthMonitoring(baseInput());
    expect(r.health_monitoring_score).toBeLessThan(perfect.health_monitoring_score);
  });

  it("optical check penalty when not up to date", () => {
    const r = computeHomeHealthMonitoring(baseInput({
      annual_health_assessments: [
        makeAHA({ id: "aha_1", optical_up_to_date: false }),
        makeAHA({ id: "aha_2", optical_up_to_date: false }),
        makeAHA({ id: "aha_3", optical_up_to_date: false }),
      ],
    }));
    const perfect = computeHomeHealthMonitoring(baseInput());
    expect(r.health_monitoring_score).toBeLessThan(perfect.health_monitoring_score);
  });

  it("child consent penalty when no consent", () => {
    const r = computeHomeHealthMonitoring(baseInput({
      immunisations: [
        makeImmunisation({ id: "i1", child_consent: false }),
        makeImmunisation({ id: "i2", child_consent: false }),
        makeImmunisation({ id: "i3", child_consent: false }),
      ],
    }));
    const perfect = computeHomeHealthMonitoring(baseInput());
    expect(r.health_monitoring_score).toBeLessThan(perfect.health_monitoring_score);
  });

  it("LA sign-off penalty when not signed off", () => {
    const r = computeHomeHealthMonitoring(baseInput({
      annual_health_assessments: [
        makeAHA({ id: "aha_1", signed_off_by_la: false }),
        makeAHA({ id: "aha_2", signed_off_by_la: false }),
        makeAHA({ id: "aha_3", signed_off_by_la: false }),
      ],
    }));
    const perfect = computeHomeHealthMonitoring(baseInput());
    expect(r.health_monitoring_score).toBeLessThan(perfect.health_monitoring_score);
  });

  it("score is clamped to [0, 100]", () => {
    // Very bad data → should not go below 0
    const r = computeHomeHealthMonitoring(baseInput({
      total_children: 20,
      annual_health_assessments: [
        makeAHA({ id: "aha_1", completed_within_deadline: false, optical_up_to_date: false, signed_off_by_la: false }),
      ],
      health_passports: [makePassport({ id: "hp_1", last_updated: "2020-01-01" })],
      immunisations: [makeImmunisation({ id: "i1", missed_count: 10, caught_up_count: 0, child_consent: false })],
      dental_records: [makeDental({ id: "d1", registration_status: "not_registered" })],
    }));
    expect(r.health_monitoring_score).toBeGreaterThanOrEqual(0);
    expect(r.health_monitoring_score).toBeLessThanOrEqual(100);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 7. RATING THRESHOLDS
// ═══════════════════════════════════════════════════════════════════════════

describe("rating thresholds", () => {
  it("outstanding when score >= 80", () => {
    const r = computeHomeHealthMonitoring(baseInput());
    expect(r.health_monitoring_score).toBeGreaterThanOrEqual(80);
    expect(r.health_monitoring_rating).toBe("outstanding");
  });

  it("good when score 65-79", () => {
    // All children assessed (3/3 → +5) but weaken timeliness, sign-off, optical
    // Base 52 + 5(AHA) + 4(immun) + 4(dental) + 3(passport) - 1(timeliness 67%) - 1(optical 67%) + 3(consent) - 1(LA 67%) = 68
    const r = computeHomeHealthMonitoring(baseInput({
      annual_health_assessments: [
        makeAHA({ id: "aha_1", child_id: "yp_alex", completed_within_deadline: false, signed_off_by_la: false, optical_up_to_date: false }),
        makeAHA({ id: "aha_2", child_id: "yp_jordan", completed_within_deadline: true, signed_off_by_la: true, optical_up_to_date: true }),
        makeAHA({ id: "aha_3", child_id: "yp_casey", completed_within_deadline: true, signed_off_by_la: true, optical_up_to_date: true }),
      ],
    }));
    expect(r.health_monitoring_score).toBeGreaterThanOrEqual(65);
    expect(r.health_monitoring_score).toBeLessThan(80);
    expect(r.health_monitoring_rating).toBe("good");
  });

  it("adequate when score 45-64", () => {
    // 3 children, 3 AHAs with 3 unique children → ahaCompRate=100% → +5
    // timeliness: 1/3 = 33% → -3, optical: 1/3 = 33% → -3, LA: 1/3 = 33% → -3
    // immunisation: 3 records, all missed_count=2, caught_up=1 → immunCoverage 0% → -4
    // dental: 2 registered, 1 not → 67% → -1
    // passport: 1 current, 2 old → 33% → -3
    // consent: 2/3 = 67% → -1
    // Score: 52 + 5 - 4 - 1 - 3 - 3 - 3 - 1 - 3 = 39... too low
    // Let's be gentler: keep immunisations perfect, weaken only a few axes
    // 4 children, 3 AHAs → ahaCompRate = 75% → +2
    // timeliness: 2/3 → 67% → -1, optical: 2/3 → 67% → -1, LA: 2/3 → 67% → -1
    // immunisation: perfect → +4, dental: 2/3 registered → 67% → -1
    // passport: 2/3 current → 67% → -1, consent: perfect → +3
    // Score: 52 + 2 + 4 - 1 - 1 - 1 - 1 + 3 - 1 = 56
    const r = computeHomeHealthMonitoring(baseInput({
      total_children: 4,
      annual_health_assessments: [
        makeAHA({ id: "aha_1", child_id: "yp_alex", completed_within_deadline: false, signed_off_by_la: false, optical_up_to_date: false }),
        makeAHA({ id: "aha_2", child_id: "yp_jordan" }),
        makeAHA({ id: "aha_3", child_id: "yp_casey" }),
      ],
      health_passports: [
        makePassport({ id: "hp_1" }),
        makePassport({ id: "hp_2" }),
        makePassport({ id: "hp_3", last_updated: "2025-01-01" }),
      ],
      dental_records: [
        makeDental({ id: "d1" }),
        makeDental({ id: "d2" }),
        makeDental({ id: "d3", registration_status: "not_registered" }),
      ],
    }));
    expect(r.health_monitoring_score).toBeGreaterThanOrEqual(45);
    expect(r.health_monitoring_score).toBeLessThan(65);
    expect(r.health_monitoring_rating).toBe("adequate");
  });

  it("inadequate when score < 45", () => {
    const r = computeHomeHealthMonitoring(baseInput({
      total_children: 10,
      annual_health_assessments: [
        makeAHA({ id: "aha_1", completed_within_deadline: false, signed_off_by_la: false, optical_up_to_date: false, immunisations_up_to_date: false, dental_up_to_date: false }),
      ],
      health_passports: [makePassport({ id: "hp_1", last_updated: "2024-01-01" })],
      immunisations: [makeImmunisation({ id: "i1", missed_count: 10, caught_up_count: 0, child_consent: false, gp_registered: false })],
      dental_records: [makeDental({ id: "d1", registration_status: "not_registered" })],
    }));
    expect(r.health_monitoring_score).toBeLessThan(45);
    expect(r.health_monitoring_rating).toBe("inadequate");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 8. STRENGTHS
// ═══════════════════════════════════════════════════════════════════════════

describe("strengths", () => {
  it("includes strength for full AHA coverage", () => {
    const r = computeHomeHealthMonitoring(baseInput());
    expect(r.strengths.some(s => s.includes("All children have annual health assessments"))).toBe(true);
  });

  it("includes strength for 100% completion timeliness", () => {
    const r = computeHomeHealthMonitoring(baseInput());
    expect(r.strengths.some(s => s.includes("100% of assessments completed within deadline"))).toBe(true);
  });

  it("includes strength for full immunisation coverage", () => {
    const r = computeHomeHealthMonitoring(baseInput());
    expect(r.strengths.some(s => s.includes("Full immunisation coverage"))).toBe(true);
  });

  it("includes strength for 100% dental registration", () => {
    const r = computeHomeHealthMonitoring(baseInput());
    expect(r.strengths.some(s => s.includes("All children registered with a dental practice"))).toBe(true);
  });

  it("includes strength for current health passports", () => {
    const r = computeHomeHealthMonitoring(baseInput());
    expect(r.strengths.some(s => s.includes("health passports updated within the last 6 months"))).toBe(true);
  });

  it("includes strength for 100% LA sign-off", () => {
    const r = computeHomeHealthMonitoring(baseInput());
    expect(r.strengths.some(s => s.includes("100% LA sign-off"))).toBe(true);
  });

  it("includes strength for child consent participation", () => {
    const r = computeHomeHealthMonitoring(baseInput());
    expect(r.strengths.some(s => s.includes("informed consent"))).toBe(true);
  });

  it("includes no strengths with poor data", () => {
    const r = computeHomeHealthMonitoring(baseInput({
      total_children: 10,
      annual_health_assessments: [],
      health_passports: [makePassport({ id: "hp_1", last_updated: "2024-01-01" })],
      immunisations: [makeImmunisation({ id: "i1", missed_count: 5, caught_up_count: 0, child_consent: false })],
      dental_records: [makeDental({ id: "d1", registration_status: "not_registered", next_check_up_due: "2026-01-01" })],
    }));
    expect(r.strengths.length).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 9. CONCERNS
// ═══════════════════════════════════════════════════════════════════════════

describe("concerns", () => {
  it("flags children without recent assessment", () => {
    const r = computeHomeHealthMonitoring(baseInput({
      total_children: 5,
      annual_health_assessments: [
        makeAHA({ id: "aha_1", child_id: "yp_alex" }),
        makeAHA({ id: "aha_2", child_id: "yp_jordan" }),
      ],
    }));
    expect(r.concerns.some(c => c.includes("3 children without a health assessment"))).toBe(true);
  });

  it("flags poor completion timeliness", () => {
    const r = computeHomeHealthMonitoring(baseInput({
      annual_health_assessments: [
        makeAHA({ id: "aha_1", completed_within_deadline: false }),
        makeAHA({ id: "aha_2", completed_within_deadline: false }),
        makeAHA({ id: "aha_3", completed_within_deadline: false }),
      ],
    }));
    expect(r.concerns.some(c => c.includes("timeliness needs improvement"))).toBe(true);
  });

  it("flags missed immunisations with poor catch-up", () => {
    const r = computeHomeHealthMonitoring(baseInput({
      immunisations: [
        makeImmunisation({ id: "i1", missed_count: 3, caught_up_count: 1 }),
      ],
    }));
    expect(r.concerns.some(c => c.includes("missed immunisation"))).toBe(true);
  });

  it("flags overdue dental checkups", () => {
    const r = computeHomeHealthMonitoring(baseInput({
      dental_records: [
        makeDental({ id: "d1", next_check_up_due: "2026-03-01" }),
      ],
    }));
    expect(r.concerns.some(c => c.includes("overdue dental check-up"))).toBe(true);
  });

  it("flags low passport currency", () => {
    const r = computeHomeHealthMonitoring(baseInput({
      health_passports: [
        makePassport({ id: "hp_1", last_updated: "2025-01-01" }),
        makePassport({ id: "hp_2", last_updated: "2025-01-01" }),
        makePassport({ id: "hp_3", last_updated: "2025-01-01" }),
      ],
    }));
    expect(r.concerns.some(c => c.includes("health passports updated within 6 months"))).toBe(true);
  });

  it("no concerns with perfect data", () => {
    const r = computeHomeHealthMonitoring(baseInput());
    expect(r.concerns.length).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 10. RECOMMENDATIONS
// ═══════════════════════════════════════════════════════════════════════════

describe("recommendations", () => {
  it("recommends booking AHAs when children not assessed", () => {
    const r = computeHomeHealthMonitoring(baseInput({
      total_children: 5,
      annual_health_assessments: [
        makeAHA({ id: "aha_1", child_id: "yp_alex" }),
      ],
    }));
    expect(r.recommendations.some(rec => rec.recommendation.includes("Book annual health assessments"))).toBe(true);
    expect(r.recommendations[0].urgency).toBe("immediate");
  });

  it("recommends immunisation catch-up when poor", () => {
    const r = computeHomeHealthMonitoring(baseInput({
      immunisations: [
        makeImmunisation({ id: "i1", missed_count: 5, caught_up_count: 0 }),
      ],
    }));
    expect(r.recommendations.some(rec => rec.recommendation.includes("catch-up immunisation schedule"))).toBe(true);
  });

  it("recommends dental appointments when overdue", () => {
    const r = computeHomeHealthMonitoring(baseInput({
      dental_records: [
        makeDental({ id: "d1", next_check_up_due: "2026-03-01" }),
      ],
    }));
    expect(r.recommendations.some(rec => rec.recommendation.includes("Arrange dental appointments"))).toBe(true);
  });

  it("recommends passport updates when low currency", () => {
    const r = computeHomeHealthMonitoring(baseInput({
      health_passports: [
        makePassport({ id: "hp_1", last_updated: "2025-01-01" }),
        makePassport({ id: "hp_2", last_updated: "2025-01-01" }),
      ],
    }));
    expect(r.recommendations.some(rec => rec.recommendation.includes("Update health passports"))).toBe(true);
  });

  it("recommends dental registration when incomplete", () => {
    const r = computeHomeHealthMonitoring(baseInput({
      dental_records: [
        makeDental({ id: "d1", registration_status: "not_registered" }),
      ],
    }));
    expect(r.recommendations.some(rec => rec.recommendation.includes("Register all children"))).toBe(true);
  });

  it("recommends dental anxiety support when present", () => {
    const r = computeHomeHealthMonitoring(baseInput({
      dental_records: [
        makeDental({ id: "d1", has_anxiety: true }),
      ],
    }));
    expect(r.recommendations.some(rec => rec.recommendation.includes("dental anxiety"))).toBe(true);
  });

  it("no recommendations with perfect data", () => {
    const r = computeHomeHealthMonitoring(baseInput());
    expect(r.recommendations.length).toBe(0);
  });

  it("recommendations have sequential ranks", () => {
    const r = computeHomeHealthMonitoring(baseInput({
      total_children: 10,
      annual_health_assessments: [makeAHA({ id: "aha_1", signed_off_by_la: false, optical_up_to_date: false })],
      immunisations: [makeImmunisation({ id: "i1", missed_count: 5, caught_up_count: 0 })],
      dental_records: [makeDental({ id: "d1", registration_status: "not_registered", next_check_up_due: "2026-01-01", has_anxiety: true })],
      health_passports: [makePassport({ id: "hp_1", last_updated: "2024-01-01" })],
    }));
    for (let i = 0; i < r.recommendations.length; i++) {
      expect(r.recommendations[i].rank).toBe(i + 1);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 11. INSIGHTS
// ═══════════════════════════════════════════════════════════════════════════

describe("insights", () => {
  it("critical insight when children not assessed", () => {
    const r = computeHomeHealthMonitoring(baseInput({
      total_children: 5,
      annual_health_assessments: [makeAHA({ id: "aha_1", child_id: "yp_alex" })],
    }));
    expect(r.insights.some(i => i.severity === "critical" && i.text.includes("no annual health assessment"))).toBe(true);
  });

  it("critical insight for low immunisation catch-up", () => {
    const r = computeHomeHealthMonitoring(baseInput({
      immunisations: [
        makeImmunisation({ id: "i1", missed_count: 5, caught_up_count: 1 }),
      ],
    }));
    expect(r.insights.some(i => i.severity === "critical" && i.text.includes("missed immunisations"))).toBe(true);
  });

  it("warning insight for overdue dental appointments", () => {
    const r = computeHomeHealthMonitoring(baseInput({
      dental_records: [
        makeDental({ id: "d1", next_check_up_due: "2026-01-01" }),
        makeDental({ id: "d2", next_check_up_due: "2026-01-01" }),
      ],
    }));
    expect(r.insights.some(i => i.severity === "warning" && i.text.includes("overdue dental"))).toBe(true);
  });

  it("positive insight for perfect assessment and timeliness", () => {
    const r = computeHomeHealthMonitoring(baseInput());
    expect(r.insights.some(i => i.severity === "positive" && i.text.includes("outstanding evidence"))).toBe(true);
  });

  it("positive insight for full immunisation and dental coverage", () => {
    const r = computeHomeHealthMonitoring(baseInput());
    expect(r.insights.some(i => i.severity === "positive" && i.text.includes("statutory health requirements"))).toBe(true);
  });

  it("positive insight for current passports and consent", () => {
    const r = computeHomeHealthMonitoring(baseInput());
    expect(r.insights.some(i => i.severity === "positive" && i.text.includes("child-centred"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 12. HEADLINES
// ═══════════════════════════════════════════════════════════════════════════

describe("headlines", () => {
  it("outstanding headline for outstanding rating", () => {
    const r = computeHomeHealthMonitoring(baseInput());
    expect(r.headline).toContain("Outstanding health monitoring");
  });

  it("good headline for good rating", () => {
    const r = computeHomeHealthMonitoring(baseInput({
      annual_health_assessments: [
        makeAHA({ id: "aha_1", child_id: "yp_alex", completed_within_deadline: false, signed_off_by_la: false, optical_up_to_date: false }),
        makeAHA({ id: "aha_2", child_id: "yp_jordan" }),
        makeAHA({ id: "aha_3", child_id: "yp_casey" }),
      ],
    }));
    expect(r.headline).toContain("Good health monitoring");
  });

  it("adequate headline for adequate rating", () => {
    const r = computeHomeHealthMonitoring(baseInput({
      total_children: 4,
      annual_health_assessments: [
        makeAHA({ id: "aha_1", child_id: "yp_alex", completed_within_deadline: false, signed_off_by_la: false, optical_up_to_date: false }),
        makeAHA({ id: "aha_2", child_id: "yp_jordan" }),
        makeAHA({ id: "aha_3", child_id: "yp_casey" }),
      ],
      health_passports: [
        makePassport({ id: "hp_1" }),
        makePassport({ id: "hp_2" }),
        makePassport({ id: "hp_3", last_updated: "2025-01-01" }),
      ],
      dental_records: [
        makeDental({ id: "d1" }),
        makeDental({ id: "d2" }),
        makeDental({ id: "d3", registration_status: "not_registered" }),
      ],
    }));
    expect(r.headline).toContain("Adequate health monitoring");
  });

  it("inadequate headline for inadequate rating", () => {
    const r = computeHomeHealthMonitoring(baseInput({
      total_children: 10,
      annual_health_assessments: [
        makeAHA({ id: "aha_1", completed_within_deadline: false, signed_off_by_la: false, optical_up_to_date: false }),
      ],
      health_passports: [makePassport({ id: "hp_1", last_updated: "2024-01-01" })],
      immunisations: [makeImmunisation({ id: "i1", missed_count: 10, caught_up_count: 0, child_consent: false })],
      dental_records: [makeDental({ id: "d1", registration_status: "not_registered" })],
    }));
    expect(r.headline).toContain("inadequate");
  });

  it("insufficient_data headline for insufficient data", () => {
    const r = computeHomeHealthMonitoring(baseInput({
      annual_health_assessments: [],
      health_passports: [],
      immunisations: [],
      dental_records: [],
    }));
    expect(r.headline).toContain("Insufficient health monitoring data");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 13. DETERMINISM
// ═══════════════════════════════════════════════════════════════════════════

describe("determinism", () => {
  it("produces identical results for identical input", () => {
    const input = baseInput();
    const r1 = computeHomeHealthMonitoring(input);
    const r2 = computeHomeHealthMonitoring(input);
    expect(r1).toEqual(r2);
  });

  it("uses injectable today parameter (not system clock)", () => {
    const input1 = baseInput({ today: "2026-05-27" });
    const input2 = baseInput({ today: "2027-05-27" });
    // With today one year later, some assessments may be out of 365d window
    const r1 = computeHomeHealthMonitoring(input1);
    const r2 = computeHomeHealthMonitoring(input2);
    // r2 should have fewer recent assessments since they are now >365 days old
    expect(r2.assessment.recent_365d).toBeLessThan(r1.assessment.recent_365d);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 14. EDGE CASES
// ═══════════════════════════════════════════════════════════════════════════

describe("edge cases", () => {
  it("handles 0 total_children without errors", () => {
    const r = computeHomeHealthMonitoring(baseInput({
      total_children: 0,
      annual_health_assessments: [],
      health_passports: [],
      immunisations: [makeImmunisation()],
      dental_records: [],
    }));
    expect(r.health_monitoring_rating).not.toBe("insufficient_data");
  });

  it("handles single child with full data", () => {
    const r = computeHomeHealthMonitoring(baseInput({
      total_children: 1,
      annual_health_assessments: [makeAHA({ id: "aha_1", child_id: "yp_solo" })],
      health_passports: [makePassport({ id: "hp_1", child_id: "yp_solo" })],
      immunisations: [makeImmunisation({ id: "i1", child_id: "yp_solo" })],
      dental_records: [makeDental({ id: "d1", child_id: "yp_solo" })],
    }));
    expect(r.health_monitoring_score).toBe(80);
    expect(r.health_monitoring_rating).toBe("outstanding");
  });

  it("handles dental with empty next_check_up_due", () => {
    const r = computeHomeHealthMonitoring(baseInput({
      dental_records: [
        makeDental({ id: "d1", next_check_up_due: "" }),
      ],
    }));
    expect(r.dental.overdue_checkups).toBe(0);
  });

  it("handles passport updated today", () => {
    const r = computeHomeHealthMonitoring(baseInput({
      health_passports: [
        makePassport({ id: "hp_1", last_updated: "2026-05-27" }),
      ],
    }));
    expect(r.passport.currency_rate).toBe(100);
  });

  it("handles assessment exactly 365 days ago", () => {
    const r = computeHomeHealthMonitoring(baseInput({
      annual_health_assessments: [
        makeAHA({ id: "aha_1", assessment_date: "2025-05-27" }),
      ],
    }));
    expect(r.assessment.recent_365d).toBe(1);
  });

  it("handles assessment 366 days ago as not recent", () => {
    const r = computeHomeHealthMonitoring(baseInput({
      annual_health_assessments: [
        makeAHA({ id: "aha_1", assessment_date: "2025-05-26" }),
      ],
    }));
    expect(r.assessment.recent_365d).toBe(0);
  });

  it("uses singular form when 1 child not assessed", () => {
    const r = computeHomeHealthMonitoring(baseInput({
      total_children: 2,
      annual_health_assessments: [
        makeAHA({ id: "aha_1", child_id: "yp_alex" }),
      ],
    }));
    expect(r.concerns.some(c => c.includes("1 child without"))).toBe(true);
  });

  it("uses plural form when multiple children not assessed", () => {
    const r = computeHomeHealthMonitoring(baseInput({
      total_children: 5,
      annual_health_assessments: [
        makeAHA({ id: "aha_1", child_id: "yp_alex" }),
      ],
    }));
    expect(r.concerns.some(c => c.includes("4 children without"))).toBe(true);
  });
});
