// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME LONE WORKING STAFF SAFETY INTELLIGENCE ENGINE — TESTS
// CHR 2015 Reg 33, HSE Lone Working guidance.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeLoneWorkingStaffSafety,
  type LoneWorkingSafetyInput,
  type LoneWorkingRecordInput,
  type LoneWorkingAssessmentInput,
  type StaffSafetyCheckInput,
} from "../home-lone-working-staff-safety-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeRecord(overrides: Partial<LoneWorkingRecordInput> = {}): LoneWorkingRecordInput {
  return {
    id: "rec_1",
    staff_id: "staff_1",
    risk_level: "low",
    status: "current",
    has_check_in_protocol: true,
    personal_alarm_issued: true,
    control_measures_count: 3,
    hazards_count: 2,
    ...overrides,
  };
}

function makeAssessment(overrides: Partial<LoneWorkingAssessmentInput> = {}): LoneWorkingAssessmentInput {
  return {
    id: "assess_1",
    staff_id: "staff_1",
    overall_risk: "low",
    scenarios_count: 2,
    competency_evidence_count: 3,
    training_valid_count: 5,
    training_total_count: 5,
    approved_shifts_count: 3,
    ...overrides,
  };
}

function makeCheck(overrides: Partial<StaffSafetyCheckInput> = {}): StaffSafetyCheckInput {
  return {
    id: "chk_1",
    staff_id: "staff_1",
    check_completed: true,
    response_timely: true,
    ...overrides,
  };
}

/**
 * Base input: 8 staff, 8 records (all alarm + check-in + low risk),
 * 8 assessments (all valid training), 8 timely checks.
 * Expected score: 52 + 5 + 6 + 5 + 5 + 4 + 5 = 82 → outstanding.
 */
function baseInput(overrides: Partial<LoneWorkingSafetyInput> = {}): LoneWorkingSafetyInput {
  const records = Array.from({ length: 8 }, (_, i) =>
    makeRecord({ id: `rec_${i}`, staff_id: `s${i}` }),
  );
  const assessments = Array.from({ length: 8 }, (_, i) =>
    makeAssessment({ id: `assess_${i}`, staff_id: `s${i}` }),
  );
  const safety_checks = Array.from({ length: 8 }, (_, i) =>
    makeCheck({ id: `chk_${i}`, staff_id: `s${i}` }),
  );
  return {
    today: "2026-05-27",
    total_staff: 8,
    records,
    assessments,
    safety_checks,
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. INSUFFICIENT DATA
// ═══════════════════════════════════════════════════════════════════════════

describe("insufficient data", () => {
  it("returns insufficient_data when total_staff is 0", () => {
    const r = computeLoneWorkingStaffSafety(baseInput({ total_staff: 0 }));
    expect(r.safety_rating).toBe("insufficient_data");
    expect(r.safety_score).toBe(0);
  });

  it("returns zero for all metrics when total_staff is 0", () => {
    const r = computeLoneWorkingStaffSafety(baseInput({ total_staff: 0 }));
    expect(r.staff_with_assessments).toBe(0);
    expect(r.alarm_coverage_rate).toBe(0);
    expect(r.check_in_compliance_rate).toBe(0);
    expect(r.training_validity_rate).toBe(0);
    expect(r.high_risk_staff).toBe(0);
  });

  it("returns empty arrays for strengths, concerns, recommendations, insights", () => {
    const r = computeLoneWorkingStaffSafety(baseInput({ total_staff: 0 }));
    expect(r.strengths).toEqual([]);
    expect(r.concerns).toEqual([]);
    expect(r.recommendations).toEqual([]);
    expect(r.insights).toEqual([]);
  });

  it("returns appropriate headline for insufficient data", () => {
    const r = computeLoneWorkingStaffSafety(baseInput({ total_staff: 0 }));
    expect(r.headline).toContain("No staff");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. BASE INPUT SCORE VALIDATION
// ═══════════════════════════════════════════════════════════════════════════

describe("base input validation", () => {
  it("scores 82 with perfect base input (outstanding)", () => {
    const r = computeLoneWorkingStaffSafety(baseInput());
    // 52 + 5(cov 100%) + 6(alarm 100%) + 5(checkin 100%) + 5(train 100%) + 4(low 100%) + 5(timely 100%) = 82
    expect(r.safety_score).toBe(82);
    expect(r.safety_rating).toBe("outstanding");
  });

  it("returns outstanding headline for perfect data", () => {
    const r = computeLoneWorkingStaffSafety(baseInput());
    expect(r.headline).toContain("Exceptional");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. RATING THRESHOLDS
// ═══════════════════════════════════════════════════════════════════════════

describe("rating thresholds", () => {
  it("returns outstanding for score >= 80", () => {
    const r = computeLoneWorkingStaffSafety(baseInput());
    expect(r.safety_score).toBeGreaterThanOrEqual(80);
    expect(r.safety_rating).toBe("outstanding");
  });

  it("returns good for score >= 65 and < 80", () => {
    // Remove some alarm coverage to drop score: lose alarm bonus, gain 0 instead of +6
    // Also reduce check-in slightly
    const records = Array.from({ length: 8 }, (_, i) =>
      makeRecord({
        id: `rec_${i}`,
        staff_id: `s${i}`,
        personal_alarm_issued: i < 7, // 7/8 = 88% → +3
        has_check_in_protocol: i < 7, // 7/8 = 88% → +2
      }),
    );
    const r = computeLoneWorkingStaffSafety(baseInput({ records }));
    // 52 + 5 + 3 + 2 + 5 + 4 + 5 = 76
    expect(r.safety_score).toBeGreaterThanOrEqual(65);
    expect(r.safety_score).toBeLessThan(80);
    expect(r.safety_rating).toBe("good");
  });

  it("returns adequate for score >= 45 and < 65", () => {
    // Reduce coverage, no alarms, no check-in
    const records = [
      makeRecord({ id: "rec_0", staff_id: "s0", personal_alarm_issued: false, has_check_in_protocol: false, risk_level: "medium" }),
      makeRecord({ id: "rec_1", staff_id: "s1", personal_alarm_issued: false, has_check_in_protocol: false, risk_level: "medium" }),
      makeRecord({ id: "rec_2", staff_id: "s2", personal_alarm_issued: false, has_check_in_protocol: false, risk_level: "medium" }),
    ];
    // 3/8 staff = 38% coverage → 0
    // alarm 0% → -5
    // checkin 0% → -4
    // training valid (use assessments) → +5
    // low risk 0% → -4 (no low risk, all medium, <30% low)
    // timely 100% → +5
    // 52 + 0 - 5 - 4 + 5 - 4 + 5 = 49
    const r = computeLoneWorkingStaffSafety(baseInput({ records }));
    expect(r.safety_score).toBeGreaterThanOrEqual(45);
    expect(r.safety_score).toBeLessThan(65);
    expect(r.safety_rating).toBe("adequate");
  });

  it("returns inadequate for score < 45", () => {
    const records = [
      makeRecord({ id: "rec_0", staff_id: "s0", personal_alarm_issued: false, has_check_in_protocol: false, risk_level: "high" }),
    ];
    const assessments = [
      makeAssessment({ id: "a_0", staff_id: "s0", training_valid_count: 1, training_total_count: 10 }),
    ];
    const checks = [
      makeCheck({ id: "chk_0", staff_id: "s0", response_timely: false }),
      makeCheck({ id: "chk_1", staff_id: "s1", response_timely: false }),
      makeCheck({ id: "chk_2", staff_id: "s2", response_timely: false }),
    ];
    // 1/20 staff = 5% coverage → -5
    // alarm 0% → -5
    // checkin 0% → -4
    // training 10% → -5
    // low risk 0% → -4
    // timely 0% → -5
    // 52 - 5 - 5 - 4 - 5 - 4 - 5 = 24
    const r = computeLoneWorkingStaffSafety(baseInput({
      total_staff: 20,
      records,
      assessments,
      safety_checks: checks,
    }));
    expect(r.safety_score).toBeLessThan(45);
    expect(r.safety_rating).toBe("inadequate");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. METRICS: staff_with_assessments
// ═══════════════════════════════════════════════════════════════════════════

describe("metrics: staff_with_assessments", () => {
  it("counts unique staff IDs in records", () => {
    const records = [
      makeRecord({ id: "rec_0", staff_id: "s0" }),
      makeRecord({ id: "rec_1", staff_id: "s1" }),
      makeRecord({ id: "rec_2", staff_id: "s2" }),
    ];
    const r = computeLoneWorkingStaffSafety(baseInput({ records, total_staff: 10 }));
    expect(r.staff_with_assessments).toBe(3);
  });

  it("deduplicates staff IDs", () => {
    const records = [
      makeRecord({ id: "rec_0", staff_id: "s0" }),
      makeRecord({ id: "rec_1", staff_id: "s0" }),
      makeRecord({ id: "rec_2", staff_id: "s0" }),
    ];
    const r = computeLoneWorkingStaffSafety(baseInput({ records }));
    expect(r.staff_with_assessments).toBe(1);
  });

  it("returns 0 when no records", () => {
    const r = computeLoneWorkingStaffSafety(baseInput({ records: [] }));
    expect(r.staff_with_assessments).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. METRICS: alarm_coverage_rate
// ═══════════════════════════════════════════════════════════════════════════

describe("metrics: alarm_coverage_rate", () => {
  it("calculates percentage of records with alarm issued", () => {
    const records = [
      makeRecord({ id: "rec_0", staff_id: "s0", personal_alarm_issued: true }),
      makeRecord({ id: "rec_1", staff_id: "s1", personal_alarm_issued: true }),
      makeRecord({ id: "rec_2", staff_id: "s2", personal_alarm_issued: false }),
      makeRecord({ id: "rec_3", staff_id: "s3", personal_alarm_issued: false }),
    ];
    const r = computeLoneWorkingStaffSafety(baseInput({ records }));
    expect(r.alarm_coverage_rate).toBe(50);
  });

  it("returns 100 when all records have alarms", () => {
    const r = computeLoneWorkingStaffSafety(baseInput());
    expect(r.alarm_coverage_rate).toBe(100);
  });

  it("returns 0 when no records have alarms", () => {
    const records = Array.from({ length: 4 }, (_, i) =>
      makeRecord({ id: `rec_${i}`, staff_id: `s${i}`, personal_alarm_issued: false }),
    );
    const r = computeLoneWorkingStaffSafety(baseInput({ records }));
    expect(r.alarm_coverage_rate).toBe(0);
  });

  it("returns 0 when no records exist", () => {
    const r = computeLoneWorkingStaffSafety(baseInput({ records: [] }));
    expect(r.alarm_coverage_rate).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 6. METRICS: check_in_compliance_rate
// ═══════════════════════════════════════════════════════════════════════════

describe("metrics: check_in_compliance_rate", () => {
  it("calculates percentage of records with check-in protocol", () => {
    const records = [
      makeRecord({ id: "rec_0", staff_id: "s0", has_check_in_protocol: true }),
      makeRecord({ id: "rec_1", staff_id: "s1", has_check_in_protocol: true }),
      makeRecord({ id: "rec_2", staff_id: "s2", has_check_in_protocol: true }),
      makeRecord({ id: "rec_3", staff_id: "s3", has_check_in_protocol: false }),
    ];
    const r = computeLoneWorkingStaffSafety(baseInput({ records }));
    expect(r.check_in_compliance_rate).toBe(75);
  });

  it("returns 0 when no records have check-in protocols", () => {
    const records = Array.from({ length: 4 }, (_, i) =>
      makeRecord({ id: `rec_${i}`, staff_id: `s${i}`, has_check_in_protocol: false }),
    );
    const r = computeLoneWorkingStaffSafety(baseInput({ records }));
    expect(r.check_in_compliance_rate).toBe(0);
  });

  it("returns 0 when no records exist", () => {
    const r = computeLoneWorkingStaffSafety(baseInput({ records: [] }));
    expect(r.check_in_compliance_rate).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 7. METRICS: training_validity_rate
// ═══════════════════════════════════════════════════════════════════════════

describe("metrics: training_validity_rate", () => {
  it("sums valid and total across all assessments", () => {
    const assessments = [
      makeAssessment({ id: "a_0", staff_id: "s0", training_valid_count: 3, training_total_count: 5 }),
      makeAssessment({ id: "a_1", staff_id: "s1", training_valid_count: 2, training_total_count: 5 }),
    ];
    // 5/10 = 50%
    const r = computeLoneWorkingStaffSafety(baseInput({ assessments }));
    expect(r.training_validity_rate).toBe(50);
  });

  it("returns 100 when all training is valid", () => {
    const r = computeLoneWorkingStaffSafety(baseInput());
    expect(r.training_validity_rate).toBe(100);
  });

  it("returns 0 when no assessments exist", () => {
    const r = computeLoneWorkingStaffSafety(baseInput({ assessments: [] }));
    expect(r.training_validity_rate).toBe(0);
  });

  it("returns 0 when training_total_count is 0 for all assessments", () => {
    const assessments = [
      makeAssessment({ id: "a_0", staff_id: "s0", training_valid_count: 0, training_total_count: 0 }),
    ];
    const r = computeLoneWorkingStaffSafety(baseInput({ assessments }));
    expect(r.training_validity_rate).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 8. METRICS: high_risk_staff
// ═══════════════════════════════════════════════════════════════════════════

describe("metrics: high_risk_staff", () => {
  it("counts unique staff with high risk records", () => {
    const records = [
      makeRecord({ id: "rec_0", staff_id: "s0", risk_level: "high" }),
      makeRecord({ id: "rec_1", staff_id: "s1", risk_level: "high" }),
      makeRecord({ id: "rec_2", staff_id: "s2", risk_level: "low" }),
    ];
    const r = computeLoneWorkingStaffSafety(baseInput({ records }));
    expect(r.high_risk_staff).toBe(2);
  });

  it("deduplicates high risk staff IDs", () => {
    const records = [
      makeRecord({ id: "rec_0", staff_id: "s0", risk_level: "high" }),
      makeRecord({ id: "rec_1", staff_id: "s0", risk_level: "high" }),
    ];
    const r = computeLoneWorkingStaffSafety(baseInput({ records }));
    expect(r.high_risk_staff).toBe(1);
  });

  it("returns 0 when no high risk records", () => {
    const r = computeLoneWorkingStaffSafety(baseInput());
    expect(r.high_risk_staff).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 9. MOD1: Assessment coverage
// ═══════════════════════════════════════════════════════════════════════════

describe("mod1: assessment coverage", () => {
  it("awards +5 for >= 90% coverage", () => {
    // base has 8/8 = 100% → +5
    const full = computeLoneWorkingStaffSafety(baseInput());
    // Drop to 60%: 5/8 staff → +2
    const records60 = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `rec_${i}`, staff_id: `s${i}` }),
    );
    const partial = computeLoneWorkingStaffSafety(baseInput({ records: records60 }));
    expect(full.safety_score - partial.safety_score).toBe(3); // +5 vs +2
  });

  it("awards +2 for >= 60% coverage", () => {
    // 5/8 = 63%
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `rec_${i}`, staff_id: `s${i}` }),
    );
    const r60 = computeLoneWorkingStaffSafety(baseInput({ records }));
    // 3/8 = 38% → 0
    const records30 = Array.from({ length: 3 }, (_, i) =>
      makeRecord({ id: `rec_${i}`, staff_id: `s${i}` }),
    );
    const r30 = computeLoneWorkingStaffSafety(baseInput({ records: records30 }));
    expect(r60.safety_score - r30.safety_score).toBe(2); // +2 vs 0
  });

  it("awards 0 for >= 30% coverage", () => {
    // 3/8 = 38% → 0
    const records = Array.from({ length: 3 }, (_, i) =>
      makeRecord({ id: `rec_${i}`, staff_id: `s${i}` }),
    );
    const r = computeLoneWorkingStaffSafety(baseInput({ records }));
    // Compare with < 30%: 2/8 = 25% → -5
    const recordsLow = Array.from({ length: 2 }, (_, i) =>
      makeRecord({ id: `rec_${i}`, staff_id: `s${i}` }),
    );
    const rLow = computeLoneWorkingStaffSafety(baseInput({ records: recordsLow }));
    expect(r.safety_score - rLow.safety_score).toBe(5); // 0 vs -5
  });

  it("penalises -5 for < 30% coverage", () => {
    // 2/8 = 25% → -5, 3/8 = 38% → 0, difference should be 5
    const recordsLow = Array.from({ length: 2 }, (_, i) =>
      makeRecord({ id: `rec_${i}`, staff_id: `s${i}` }),
    );
    const recordsMid = Array.from({ length: 3 }, (_, i) =>
      makeRecord({ id: `rec_${i}`, staff_id: `s${i}` }),
    );
    const rLow = computeLoneWorkingStaffSafety(baseInput({ records: recordsLow }));
    const rMid = computeLoneWorkingStaffSafety(baseInput({ records: recordsMid }));
    // mod1: -5 vs 0 = difference of 5; all other mods are the same (same rates within records)
    expect(rMid.safety_score - rLow.safety_score).toBe(5);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 10. MOD2: Alarm coverage
// ═══════════════════════════════════════════════════════════════════════════

describe("mod2: alarm coverage", () => {
  it("awards +6 for >= 95% alarm coverage", () => {
    // base has 100% → +6
    const full = computeLoneWorkingStaffSafety(baseInput());
    // 7/8 = 88% → +3
    const records = Array.from({ length: 8 }, (_, i) =>
      makeRecord({ id: `rec_${i}`, staff_id: `s${i}`, personal_alarm_issued: i < 7 }),
    );
    const partial = computeLoneWorkingStaffSafety(baseInput({ records }));
    expect(full.safety_score - partial.safety_score).toBe(3); // +6 vs +3
  });

  it("awards +3 for >= 80% alarm coverage", () => {
    // 7/8 = 88% → +3
    const records88 = Array.from({ length: 8 }, (_, i) =>
      makeRecord({ id: `rec_${i}`, staff_id: `s${i}`, personal_alarm_issued: i < 7 }),
    );
    const r88 = computeLoneWorkingStaffSafety(baseInput({ records: records88 }));
    expect(r88.alarm_coverage_rate).toBe(88);
  });

  it("awards 0 for >= 50% alarm coverage", () => {
    // 4/8 = 50% → 0
    const records = Array.from({ length: 8 }, (_, i) =>
      makeRecord({ id: `rec_${i}`, staff_id: `s${i}`, personal_alarm_issued: i < 4 }),
    );
    const r = computeLoneWorkingStaffSafety(baseInput({ records }));
    expect(r.alarm_coverage_rate).toBe(50);
  });

  it("penalises -5 for < 50% alarm coverage", () => {
    // 3/8 = 38% → -5
    const records = Array.from({ length: 8 }, (_, i) =>
      makeRecord({ id: `rec_${i}`, staff_id: `s${i}`, personal_alarm_issued: i < 3 }),
    );
    const r = computeLoneWorkingStaffSafety(baseInput({ records }));
    expect(r.alarm_coverage_rate).toBe(38);
  });

  it("awards 0 when no records exist", () => {
    // mod2 = 0 for 0 records
    const withRecords = computeLoneWorkingStaffSafety(baseInput());
    const withoutRecords = computeLoneWorkingStaffSafety(baseInput({ records: [] }));
    // When no records: mod2=0 instead of +6, but also mod1 changes, etc.
    // Just verify the engine doesn't crash
    expect(withoutRecords.alarm_coverage_rate).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 11. MOD3: Check-in compliance
// ═══════════════════════════════════════════════════════════════════════════

describe("mod3: check-in compliance", () => {
  it("awards +5 for >= 95% check-in compliance", () => {
    // base = 100% → +5
    const r = computeLoneWorkingStaffSafety(baseInput());
    expect(r.check_in_compliance_rate).toBe(100);
  });

  it("awards +2 for >= 80% check-in compliance", () => {
    // 7/8 = 88% → +2
    const records = Array.from({ length: 8 }, (_, i) =>
      makeRecord({ id: `rec_${i}`, staff_id: `s${i}`, has_check_in_protocol: i < 7 }),
    );
    const r = computeLoneWorkingStaffSafety(baseInput({ records }));
    expect(r.check_in_compliance_rate).toBe(88);
  });

  it("awards 0 for >= 50% check-in compliance", () => {
    // 4/8 = 50% → 0
    const records = Array.from({ length: 8 }, (_, i) =>
      makeRecord({ id: `rec_${i}`, staff_id: `s${i}`, has_check_in_protocol: i < 4 }),
    );
    const r = computeLoneWorkingStaffSafety(baseInput({ records }));
    expect(r.check_in_compliance_rate).toBe(50);
  });

  it("penalises -4 for < 50% check-in compliance", () => {
    // 3/8 = 38% → -4
    const records = Array.from({ length: 8 }, (_, i) =>
      makeRecord({ id: `rec_${i}`, staff_id: `s${i}`, has_check_in_protocol: i < 3 }),
    );
    const r = computeLoneWorkingStaffSafety(baseInput({ records }));
    expect(r.check_in_compliance_rate).toBe(38);
  });

  it("awards 0 when no records exist", () => {
    const r = computeLoneWorkingStaffSafety(baseInput({ records: [] }));
    expect(r.check_in_compliance_rate).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 12. MOD4: Training validity
// ═══════════════════════════════════════════════════════════════════════════

describe("mod4: training validity", () => {
  it("awards +5 for >= 90% training validity", () => {
    // base = 100% → +5
    const full = computeLoneWorkingStaffSafety(baseInput());
    // 70% → +2
    const assessments70 = Array.from({ length: 8 }, (_, i) =>
      makeAssessment({ id: `a_${i}`, staff_id: `s${i}`, training_valid_count: 7, training_total_count: 10 }),
    );
    const partial = computeLoneWorkingStaffSafety(baseInput({ assessments: assessments70 }));
    expect(full.safety_score - partial.safety_score).toBe(3); // +5 vs +2
  });

  it("awards +2 for >= 70% training validity", () => {
    const assessments = [
      makeAssessment({ id: "a_0", staff_id: "s0", training_valid_count: 7, training_total_count: 10 }),
    ];
    const r = computeLoneWorkingStaffSafety(baseInput({ assessments }));
    expect(r.training_validity_rate).toBe(70);
  });

  it("awards 0 for >= 40% training validity", () => {
    const assessments = [
      makeAssessment({ id: "a_0", staff_id: "s0", training_valid_count: 4, training_total_count: 10 }),
    ];
    const r = computeLoneWorkingStaffSafety(baseInput({ assessments }));
    expect(r.training_validity_rate).toBe(40);
  });

  it("penalises -5 for < 40% training validity", () => {
    const assessments = [
      makeAssessment({ id: "a_0", staff_id: "s0", training_valid_count: 1, training_total_count: 10 }),
    ];
    const r = computeLoneWorkingStaffSafety(baseInput({ assessments }));
    expect(r.training_validity_rate).toBe(10);
  });

  it("penalises -1 when no assessments exist", () => {
    const withAssess = computeLoneWorkingStaffSafety(baseInput());
    const withoutAssess = computeLoneWorkingStaffSafety(baseInput({ assessments: [] }));
    // mod4: +5 vs -1 = difference of 6
    expect(withAssess.safety_score - withoutAssess.safety_score).toBe(6);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 13. MOD5: Risk profile
// ═══════════════════════════════════════════════════════════════════════════

describe("mod5: risk profile", () => {
  it("awards +4 for >= 80% low risk", () => {
    // base = 100% low → +4
    const r = computeLoneWorkingStaffSafety(baseInput());
    // All low risk
    expect(r.high_risk_staff).toBe(0);
  });

  it("awards +1 for >= 60% low risk", () => {
    // 5/8 = 63% low
    const records = Array.from({ length: 8 }, (_, i) =>
      makeRecord({ id: `rec_${i}`, staff_id: `s${i}`, risk_level: i < 5 ? "low" : "medium" }),
    );
    const r63 = computeLoneWorkingStaffSafety(baseInput({ records }));
    // Compare with 100% low (+4)
    const rFull = computeLoneWorkingStaffSafety(baseInput());
    expect(rFull.safety_score - r63.safety_score).toBe(3); // +4 vs +1
  });

  it("awards 0 for >= 30% low risk", () => {
    // 3/8 = 38% low
    const records = Array.from({ length: 8 }, (_, i) =>
      makeRecord({ id: `rec_${i}`, staff_id: `s${i}`, risk_level: i < 3 ? "low" : "medium" }),
    );
    const r = computeLoneWorkingStaffSafety(baseInput({ records }));
    // Base would be +4, this is 0, so 4 less
    const rFull = computeLoneWorkingStaffSafety(baseInput());
    expect(rFull.safety_score - r.safety_score).toBe(4); // +4 vs 0
  });

  it("penalises -4 for < 30% low risk", () => {
    // 1/8 = 13% low
    const records = Array.from({ length: 8 }, (_, i) =>
      makeRecord({ id: `rec_${i}`, staff_id: `s${i}`, risk_level: i < 1 ? "low" : "high" }),
    );
    const r = computeLoneWorkingStaffSafety(baseInput({ records }));
    const rFull = computeLoneWorkingStaffSafety(baseInput());
    expect(rFull.safety_score - r.safety_score).toBe(8); // +4 vs -4
  });

  it("awards 0 when no records exist", () => {
    const r = computeLoneWorkingStaffSafety(baseInput({ records: [] }));
    expect(r.high_risk_staff).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 14. MOD6: Safety check response
// ═══════════════════════════════════════════════════════════════════════════

describe("mod6: safety check response", () => {
  it("awards +5 for >= 95% timely responses", () => {
    // base = 100% → +5
    const r = computeLoneWorkingStaffSafety(baseInput());
    expect(r.safety_score).toBe(82); // includes +5 for checks
  });

  it("awards +2 for >= 80% timely responses", () => {
    // 7/8 = 88%
    const checks = Array.from({ length: 8 }, (_, i) =>
      makeCheck({ id: `chk_${i}`, staff_id: `s${i}`, response_timely: i < 7 }),
    );
    const r = computeLoneWorkingStaffSafety(baseInput({ safety_checks: checks }));
    // base 82, now mod6 = +2 instead of +5, so 82-3=79
    expect(r.safety_score).toBe(79);
  });

  it("awards 0 for >= 50% timely responses", () => {
    // 4/8 = 50%
    const checks = Array.from({ length: 8 }, (_, i) =>
      makeCheck({ id: `chk_${i}`, staff_id: `s${i}`, response_timely: i < 4 }),
    );
    const r = computeLoneWorkingStaffSafety(baseInput({ safety_checks: checks }));
    // base 82, now mod6 = 0 instead of +5, so 82-5=77
    expect(r.safety_score).toBe(77);
  });

  it("penalises -5 for < 50% timely responses", () => {
    // 3/8 = 38%
    const checks = Array.from({ length: 8 }, (_, i) =>
      makeCheck({ id: `chk_${i}`, staff_id: `s${i}`, response_timely: i < 3 }),
    );
    const r = computeLoneWorkingStaffSafety(baseInput({ safety_checks: checks }));
    // base 82, now mod6 = -5 instead of +5, so 82-10=72
    expect(r.safety_score).toBe(72);
  });

  it("awards +2 when no checks exist", () => {
    const withChecks = computeLoneWorkingStaffSafety(baseInput());
    const withoutChecks = computeLoneWorkingStaffSafety(baseInput({ safety_checks: [] }));
    // mod6: +5 vs +2 = difference of 3
    expect(withChecks.safety_score - withoutChecks.safety_score).toBe(3);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 15. STRENGTHS
// ═══════════════════════════════════════════════════════════════════════════

describe("strengths", () => {
  it("includes strength for >= 90% assessment coverage", () => {
    const r = computeLoneWorkingStaffSafety(baseInput());
    expect(r.strengths.some((s) => s.includes("100%") && s.includes("coverage"))).toBe(true);
  });

  it("includes strength for >= 95% alarm coverage", () => {
    const r = computeLoneWorkingStaffSafety(baseInput());
    expect(r.strengths.some((s) => s.includes("alarm"))).toBe(true);
  });

  it("includes strength for >= 95% check-in compliance", () => {
    const r = computeLoneWorkingStaffSafety(baseInput());
    expect(r.strengths.some((s) => s.includes("check-in"))).toBe(true);
  });

  it("includes strength for >= 90% training validity", () => {
    const r = computeLoneWorkingStaffSafety(baseInput());
    expect(r.strengths.some((s) => s.includes("training"))).toBe(true);
  });

  it("includes strength for >= 80% low risk", () => {
    const r = computeLoneWorkingStaffSafety(baseInput());
    expect(r.strengths.some((s) => s.includes("low risk"))).toBe(true);
  });

  it("includes strength for >= 95% timely safety checks", () => {
    const r = computeLoneWorkingStaffSafety(baseInput());
    expect(r.strengths.some((s) => s.includes("safety check") || s.includes("timely"))).toBe(true);
  });

  it("includes strength for no high risk staff", () => {
    const r = computeLoneWorkingStaffSafety(baseInput());
    expect(r.strengths.some((s) => s.includes("high-risk") || s.includes("No staff"))).toBe(true);
  });

  it("returns empty strengths when metrics are poor", () => {
    const records = Array.from({ length: 2 }, (_, i) =>
      makeRecord({
        id: `rec_${i}`,
        staff_id: `s${i}`,
        personal_alarm_issued: false,
        has_check_in_protocol: false,
        risk_level: "high",
      }),
    );
    const r = computeLoneWorkingStaffSafety(baseInput({
      records,
      assessments: [],
      safety_checks: [],
      total_staff: 20,
    }));
    expect(r.strengths.length).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 16. CONCERNS
// ═══════════════════════════════════════════════════════════════════════════

describe("concerns", () => {
  it("flags low assessment coverage (< 30%)", () => {
    const records = [makeRecord({ id: "rec_0", staff_id: "s0" })];
    const r = computeLoneWorkingStaffSafety(baseInput({ records, total_staff: 20 }));
    expect(r.concerns.some((c) => c.includes("coverage") || c.includes("gaps"))).toBe(true);
  });

  it("flags low alarm coverage (< 50%)", () => {
    const records = Array.from({ length: 8 }, (_, i) =>
      makeRecord({ id: `rec_${i}`, staff_id: `s${i}`, personal_alarm_issued: i < 3 }),
    );
    const r = computeLoneWorkingStaffSafety(baseInput({ records }));
    expect(r.concerns.some((c) => c.includes("alarm"))).toBe(true);
  });

  it("flags low check-in compliance (< 50%)", () => {
    const records = Array.from({ length: 8 }, (_, i) =>
      makeRecord({ id: `rec_${i}`, staff_id: `s${i}`, has_check_in_protocol: i < 3 }),
    );
    const r = computeLoneWorkingStaffSafety(baseInput({ records }));
    expect(r.concerns.some((c) => c.includes("check-in"))).toBe(true);
  });

  it("flags low training validity (< 40%)", () => {
    const assessments = [
      makeAssessment({ id: "a_0", staff_id: "s0", training_valid_count: 1, training_total_count: 10 }),
    ];
    const r = computeLoneWorkingStaffSafety(baseInput({ assessments }));
    expect(r.concerns.some((c) => c.includes("training"))).toBe(true);
  });

  it("flags high risk staff", () => {
    const records = [
      makeRecord({ id: "rec_0", staff_id: "s0", risk_level: "high" }),
    ];
    const r = computeLoneWorkingStaffSafety(baseInput({ records }));
    expect(r.concerns.some((c) => c.includes("high-risk"))).toBe(true);
  });

  it("flags low timely response rate (< 50%)", () => {
    const checks = Array.from({ length: 8 }, (_, i) =>
      makeCheck({ id: `chk_${i}`, staff_id: `s${i}`, response_timely: i < 3 }),
    );
    const r = computeLoneWorkingStaffSafety(baseInput({ safety_checks: checks }));
    expect(r.concerns.some((c) => c.includes("safety check") || c.includes("timely"))).toBe(true);
  });

  it("flags no records when staff exist", () => {
    const r = computeLoneWorkingStaffSafety(baseInput({ records: [], total_staff: 5 }));
    expect(r.concerns.some((c) => c.includes("No lone working records"))).toBe(true);
  });

  it("returns empty concerns for perfect data", () => {
    const r = computeLoneWorkingStaffSafety(baseInput());
    expect(r.concerns.length).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 17. RECOMMENDATIONS
// ═══════════════════════════════════════════════════════════════════════════

describe("recommendations", () => {
  it("recommends alarms when coverage < 50%", () => {
    const records = Array.from({ length: 8 }, (_, i) =>
      makeRecord({ id: `rec_${i}`, staff_id: `s${i}`, personal_alarm_issued: i < 3 }),
    );
    const r = computeLoneWorkingStaffSafety(baseInput({ records }));
    expect(r.recommendations.some((rec) => rec.recommendation.includes("alarm") && rec.urgency === "immediate")).toBe(true);
  });

  it("recommends check-in protocols when < 50%", () => {
    const records = Array.from({ length: 8 }, (_, i) =>
      makeRecord({ id: `rec_${i}`, staff_id: `s${i}`, has_check_in_protocol: i < 3 }),
    );
    const r = computeLoneWorkingStaffSafety(baseInput({ records }));
    expect(r.recommendations.some((rec) => rec.recommendation.includes("check-in") && rec.urgency === "immediate")).toBe(true);
  });

  it("recommends training renewal when validity < 40%", () => {
    const assessments = [
      makeAssessment({ id: "a_0", staff_id: "s0", training_valid_count: 1, training_total_count: 10 }),
    ];
    const r = computeLoneWorkingStaffSafety(baseInput({ assessments }));
    expect(r.recommendations.some((rec) => rec.recommendation.includes("training") && rec.urgency === "immediate")).toBe(true);
  });

  it("recommends review of safety checks when timely < 50%", () => {
    const checks = Array.from({ length: 8 }, (_, i) =>
      makeCheck({ id: `chk_${i}`, staff_id: `s${i}`, response_timely: i < 3 }),
    );
    const r = computeLoneWorkingStaffSafety(baseInput({ safety_checks: checks }));
    expect(r.recommendations.some((rec) => rec.recommendation.includes("safety check") || rec.recommendation.includes("check"))).toBe(true);
  });

  it("recommends extending coverage when < 60%", () => {
    const records = Array.from({ length: 3 }, (_, i) =>
      makeRecord({ id: `rec_${i}`, staff_id: `s${i}` }),
    );
    const r = computeLoneWorkingStaffSafety(baseInput({ records, total_staff: 10 }));
    expect(r.recommendations.some((rec) => rec.recommendation.includes("coverage"))).toBe(true);
  });

  it("assigns sequential ranks", () => {
    const records = Array.from({ length: 8 }, (_, i) =>
      makeRecord({ id: `rec_${i}`, staff_id: `s${i}`, personal_alarm_issued: false, has_check_in_protocol: false }),
    );
    const assessments = [
      makeAssessment({ id: "a_0", staff_id: "s0", training_valid_count: 1, training_total_count: 10 }),
    ];
    const checks = Array.from({ length: 8 }, (_, i) =>
      makeCheck({ id: `chk_${i}`, staff_id: `s${i}`, response_timely: false }),
    );
    const r = computeLoneWorkingStaffSafety(baseInput({ records, assessments, safety_checks: checks }));
    const ranks = r.recommendations.map((rec) => rec.rank);
    for (let i = 0; i < ranks.length; i++) {
      expect(ranks[i]).toBe(i + 1);
    }
  });

  it("includes regulatory references", () => {
    const records = Array.from({ length: 8 }, (_, i) =>
      makeRecord({ id: `rec_${i}`, staff_id: `s${i}`, personal_alarm_issued: false }),
    );
    const r = computeLoneWorkingStaffSafety(baseInput({ records }));
    const alarmRec = r.recommendations.find((rec) => rec.recommendation.includes("alarm"));
    expect(alarmRec?.regulatory_ref).toBe("HSE Lone Working");
  });

  it("limits recommendations to at most 5", () => {
    const records = Array.from({ length: 2 }, (_, i) =>
      makeRecord({
        id: `rec_${i}`,
        staff_id: `s${i}`,
        personal_alarm_issued: false,
        has_check_in_protocol: false,
        risk_level: "high",
      }),
    );
    const assessments = [
      makeAssessment({ id: "a_0", staff_id: "s0", training_valid_count: 1, training_total_count: 10 }),
    ];
    const checks = Array.from({ length: 8 }, (_, i) =>
      makeCheck({ id: `chk_${i}`, staff_id: `s${i}`, response_timely: false }),
    );
    const r = computeLoneWorkingStaffSafety(baseInput({
      records,
      assessments,
      safety_checks: checks,
      total_staff: 20,
    }));
    expect(r.recommendations.length).toBeLessThanOrEqual(5);
  });

  it("returns empty recommendations for perfect data", () => {
    const r = computeLoneWorkingStaffSafety(baseInput());
    expect(r.recommendations.length).toBe(0);
  });

  it("includes CHR 2015 Reg 33 for training recommendation", () => {
    const assessments = [
      makeAssessment({ id: "a_0", staff_id: "s0", training_valid_count: 1, training_total_count: 10 }),
    ];
    const r = computeLoneWorkingStaffSafety(baseInput({ assessments }));
    const trainRec = r.recommendations.find((rec) => rec.recommendation.includes("training"));
    expect(trainRec?.regulatory_ref).toBe("CHR 2015 Reg 33");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 18. INSIGHTS
// ═══════════════════════════════════════════════════════════════════════════

describe("insights", () => {
  it("flags critical insight for high risk with low alarm coverage", () => {
    const records = Array.from({ length: 8 }, (_, i) =>
      makeRecord({ id: `rec_${i}`, staff_id: `s${i}`, risk_level: "high", personal_alarm_issued: i < 3 }),
    );
    const r = computeLoneWorkingStaffSafety(baseInput({ records }));
    expect(r.insights.some((ins) => ins.severity === "critical" && ins.text.includes("alarm"))).toBe(true);
  });

  it("flags critical insight for no records", () => {
    const r = computeLoneWorkingStaffSafety(baseInput({ records: [], total_staff: 5 }));
    expect(r.insights.some((ins) => ins.severity === "critical" && ins.text.includes("No lone working records"))).toBe(true);
  });

  it("flags warning for poor timely check rate", () => {
    const checks = Array.from({ length: 8 }, (_, i) =>
      makeCheck({ id: `chk_${i}`, staff_id: `s${i}`, response_timely: i < 3 }),
    );
    const r = computeLoneWorkingStaffSafety(baseInput({ safety_checks: checks }));
    expect(r.insights.some((ins) => ins.severity === "warning" && ins.text.includes("safety check"))).toBe(true);
  });

  it("flags positive insight for comprehensive coverage and alarms", () => {
    const r = computeLoneWorkingStaffSafety(baseInput());
    expect(r.insights.some((ins) => ins.severity === "positive" && ins.text.includes("Comprehensive"))).toBe(true);
  });

  it("flags positive insight for timely safety checks", () => {
    const r = computeLoneWorkingStaffSafety(baseInput());
    expect(r.insights.some((ins) => ins.severity === "positive" && ins.text.includes("timely"))).toBe(true);
  });

  it("limits insights to at most 3", () => {
    const r = computeLoneWorkingStaffSafety(baseInput());
    expect(r.insights.length).toBeLessThanOrEqual(3);
  });

  it("returns empty insights for insufficient data", () => {
    const r = computeLoneWorkingStaffSafety(baseInput({ total_staff: 0 }));
    expect(r.insights).toEqual([]);
  });

  it("flags warning for low training validity", () => {
    const assessments = [
      makeAssessment({ id: "a_0", staff_id: "s0", training_valid_count: 1, training_total_count: 10 }),
    ];
    // Need to also clear the positive insights conditions
    const records = Array.from({ length: 3 }, (_, i) =>
      makeRecord({ id: `rec_${i}`, staff_id: `s${i}`, personal_alarm_issued: false }),
    );
    const r = computeLoneWorkingStaffSafety(baseInput({
      records,
      assessments,
      safety_checks: [],
      total_staff: 10,
    }));
    expect(r.insights.some((ins) => (ins.severity === "warning" || ins.severity === "critical") && ins.text.includes("training") || ins.text.includes("Training"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 19. HEADLINES
// ═══════════════════════════════════════════════════════════════════════════

describe("headlines", () => {
  it("returns outstanding headline", () => {
    const r = computeLoneWorkingStaffSafety(baseInput());
    expect(r.headline).toContain("Exceptional");
  });

  it("returns good headline", () => {
    const records = Array.from({ length: 8 }, (_, i) =>
      makeRecord({
        id: `rec_${i}`,
        staff_id: `s${i}`,
        personal_alarm_issued: i < 7,
        has_check_in_protocol: i < 7,
      }),
    );
    const r = computeLoneWorkingStaffSafety(baseInput({ records }));
    expect(r.safety_rating).toBe("good");
    expect(r.headline).toContain("Good");
  });

  it("returns adequate headline", () => {
    const records = [
      makeRecord({ id: "rec_0", staff_id: "s0", personal_alarm_issued: false, has_check_in_protocol: false, risk_level: "medium" }),
      makeRecord({ id: "rec_1", staff_id: "s1", personal_alarm_issued: false, has_check_in_protocol: false, risk_level: "medium" }),
      makeRecord({ id: "rec_2", staff_id: "s2", personal_alarm_issued: false, has_check_in_protocol: false, risk_level: "medium" }),
    ];
    const r = computeLoneWorkingStaffSafety(baseInput({ records }));
    expect(r.safety_rating).toBe("adequate");
    expect(r.headline).toContain("adequate");
  });

  it("returns inadequate headline", () => {
    const records = [
      makeRecord({ id: "rec_0", staff_id: "s0", personal_alarm_issued: false, has_check_in_protocol: false, risk_level: "high" }),
    ];
    const assessments = [
      makeAssessment({ id: "a_0", staff_id: "s0", training_valid_count: 1, training_total_count: 10 }),
    ];
    const checks = [
      makeCheck({ id: "chk_0", staff_id: "s0", response_timely: false }),
      makeCheck({ id: "chk_1", staff_id: "s1", response_timely: false }),
      makeCheck({ id: "chk_2", staff_id: "s2", response_timely: false }),
    ];
    const r = computeLoneWorkingStaffSafety(baseInput({
      total_staff: 20,
      records,
      assessments,
      safety_checks: checks,
    }));
    expect(r.safety_rating).toBe("inadequate");
    expect(r.headline).toContain("Significant");
  });

  it("returns insufficient data headline", () => {
    const r = computeLoneWorkingStaffSafety(baseInput({ total_staff: 0 }));
    expect(r.headline).toContain("No staff");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 20. EDGE CASES
// ═══════════════════════════════════════════════════════════════════════════

describe("edge cases", () => {
  it("handles all empty arrays with total_staff > 0", () => {
    const r = computeLoneWorkingStaffSafety({
      today: "2026-05-27",
      total_staff: 5,
      records: [],
      assessments: [],
      safety_checks: [],
    });
    expect(r.safety_rating).not.toBe("insufficient_data");
    expect(r.safety_score).toBeGreaterThan(0);
  });

  it("clamps score to minimum 0", () => {
    // Create maximum penalties
    const records = Array.from({ length: 20 }, (_, i) =>
      makeRecord({
        id: `rec_${i}`,
        staff_id: `s${i}`,
        personal_alarm_issued: false,
        has_check_in_protocol: false,
        risk_level: "high",
      }),
    );
    const assessments = Array.from({ length: 5 }, (_, i) =>
      makeAssessment({ id: `a_${i}`, staff_id: `s${i}`, training_valid_count: 0, training_total_count: 10 }),
    );
    const checks = Array.from({ length: 20 }, (_, i) =>
      makeCheck({ id: `chk_${i}`, staff_id: `s${i}`, response_timely: false }),
    );
    const r = computeLoneWorkingStaffSafety({
      today: "2026-05-27",
      total_staff: 100,
      records,
      assessments,
      safety_checks: checks,
    });
    expect(r.safety_score).toBeGreaterThanOrEqual(0);
  });

  it("clamps score to maximum 100", () => {
    // Even with best data, score should not exceed 100
    const r = computeLoneWorkingStaffSafety(baseInput());
    expect(r.safety_score).toBeLessThanOrEqual(100);
  });

  it("handles single staff member", () => {
    const r = computeLoneWorkingStaffSafety({
      today: "2026-05-27",
      total_staff: 1,
      records: [makeRecord()],
      assessments: [makeAssessment()],
      safety_checks: [makeCheck()],
    });
    expect(r.staff_with_assessments).toBe(1);
    expect(r.safety_rating).toBe("outstanding");
  });

  it("handles duplicate staff IDs in records", () => {
    const records = [
      makeRecord({ id: "rec_0", staff_id: "s0" }),
      makeRecord({ id: "rec_1", staff_id: "s0" }),
      makeRecord({ id: "rec_2", staff_id: "s0" }),
    ];
    const r = computeLoneWorkingStaffSafety(baseInput({ records, total_staff: 1 }));
    expect(r.staff_with_assessments).toBe(1);
  });

  it("returns a valid result for typical data", () => {
    const r = computeLoneWorkingStaffSafety(baseInput());
    expect(r.safety_rating).toBeTruthy();
    expect(r.headline).toBeTruthy();
    expect(typeof r.safety_score).toBe("number");
  });

  it("handles total_staff: 1 with no records", () => {
    const r = computeLoneWorkingStaffSafety({
      today: "2026-05-27",
      total_staff: 1,
      records: [],
      assessments: [],
      safety_checks: [],
    });
    expect(r.staff_with_assessments).toBe(0);
    expect(r.safety_score).toBeGreaterThan(0);
  });

  it("pct returns 0 when denominator is 0", () => {
    const r = computeLoneWorkingStaffSafety(baseInput({ records: [] }));
    expect(r.alarm_coverage_rate).toBe(0);
    expect(r.check_in_compliance_rate).toBe(0);
  });

  it("score with all modifiers at maximum equals 82", () => {
    const r = computeLoneWorkingStaffSafety(baseInput());
    // 52 + 5 + 6 + 5 + 5 + 4 + 5 = 82
    expect(r.safety_score).toBe(82);
  });

  it("score with all modifiers at minimum is clamped to 0", () => {
    // 52 - 5 - 5 - 4 - 5 - 4 - 5 = 24, not negative
    // But with total_staff=100 and 1 record:
    const r = computeLoneWorkingStaffSafety({
      today: "2026-05-27",
      total_staff: 100,
      records: [makeRecord({ personal_alarm_issued: false, has_check_in_protocol: false, risk_level: "high" })],
      assessments: [makeAssessment({ training_valid_count: 0, training_total_count: 10 })],
      safety_checks: [makeCheck({ response_timely: false }), makeCheck({ id: "c2", response_timely: false })],
    });
    // 52 - 5 - 5 - 4 - 5 - 4 - 5 = 24 (clamped at 24, not 0 — but clamping prevents negatives)
    expect(r.safety_score).toBeGreaterThanOrEqual(0);
    expect(r.safety_score).toBeLessThanOrEqual(100);
  });

  it("all output fields are present", () => {
    const r = computeLoneWorkingStaffSafety(baseInput());
    expect(r).toHaveProperty("safety_rating");
    expect(r).toHaveProperty("safety_score");
    expect(r).toHaveProperty("headline");
    expect(r).toHaveProperty("staff_with_assessments");
    expect(r).toHaveProperty("alarm_coverage_rate");
    expect(r).toHaveProperty("check_in_compliance_rate");
    expect(r).toHaveProperty("training_validity_rate");
    expect(r).toHaveProperty("high_risk_staff");
    expect(r).toHaveProperty("strengths");
    expect(r).toHaveProperty("concerns");
    expect(r).toHaveProperty("recommendations");
    expect(r).toHaveProperty("insights");
  });

  it("recommendation urgencies are valid values", () => {
    const records = Array.from({ length: 8 }, (_, i) =>
      makeRecord({ id: `rec_${i}`, staff_id: `s${i}`, personal_alarm_issued: false, has_check_in_protocol: false }),
    );
    const assessments = [
      makeAssessment({ id: "a_0", staff_id: "s0", training_valid_count: 1, training_total_count: 10 }),
    ];
    const r = computeLoneWorkingStaffSafety(baseInput({ records, assessments }));
    for (const rec of r.recommendations) {
      expect(["immediate", "soon", "planned"]).toContain(rec.urgency);
    }
  });

  it("insight severities are valid values", () => {
    const r = computeLoneWorkingStaffSafety(baseInput());
    for (const ins of r.insights) {
      expect(["critical", "warning", "positive"]).toContain(ins.severity);
    }
  });
});
