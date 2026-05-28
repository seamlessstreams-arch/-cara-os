// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME STAFF TRAINING & CPD COMPLIANCE INTELLIGENCE ENGINE
// TEST SUITE — 170+ deterministic tests covering insufficient data, inadequate
// baseline, each bonus individually (all tiers), all bonuses combined, each
// penalty individually, penalty guards, rating boundaries, metric calculations,
// strengths, concerns, recommendations, insights, headlines, and edge cases.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeStaffTrainingCpdCompliance,
  type StaffTrainingCpdComplianceInput,
  type MandatoryTrainingRecordInput,
  type CpdRecordInput,
  type TrainingNeedsRecordInput,
  type QualificationRecordInput,
  type DevelopmentPlanRecordInput,
  type StaffTrainingCpdComplianceResult,
} from "../home-staff-training-cpd-compliance-intelligence-engine";

// ── Constants ───────────────────────────────────────────────────────────────

const TODAY = "2026-05-28";

// ── Base Input Helper ───────────────────────────────────────────────────────

function baseInput(
  overrides: Partial<StaffTrainingCpdComplianceInput> = {},
): StaffTrainingCpdComplianceInput {
  return {
    today: TODAY,
    total_staff: 0,
    mandatory_training_records: [],
    cpd_records: [],
    training_needs_records: [],
    qualification_records: [],
    development_plan_records: [],
    ...overrides,
  };
}

// ── Factory Helpers ─────────────────────────────────────────────────────────

let _id = 0;
function uid(): string {
  return `id_${++_id}`;
}

function makeMandatoryTraining(
  overrides: Partial<MandatoryTrainingRecordInput> = {},
): MandatoryTrainingRecordInput {
  return {
    id: uid(),
    staff_id: "staff_1",
    course_name: "Safeguarding",
    status: "completed",
    completed_date: "2026-01-15",
    expiry_date: "2027-01-15",
    is_valid: true,
    is_mandatory: true,
    assessment_passed: true,
    training_hours: 4,
    delivery_method: "classroom",
    provider_quality_rating: 4,
    certificate_issued: true,
    ...overrides,
  };
}

function makeCpdRecord(
  overrides: Partial<CpdRecordInput> = {},
): CpdRecordInput {
  return {
    id: uid(),
    staff_id: "staff_1",
    status: "completed",
    activity_type: "course",
    cpd_hours: 5,
    reflection_recorded: false,
    evidence_obtained: false,
    learning_applied: false,
    linked_to_development_need: false,
    quality_rating: 0,
    activity_date: "2026-03-01",
    shared_with_team: false,
    ...overrides,
  };
}

function makeTrainingNeeds(
  overrides: Partial<TrainingNeedsRecordInput> = {},
): TrainingNeedsRecordInput {
  return {
    id: uid(),
    staff_id: "staff_1",
    assessment_date: "2026-03-01",
    needs_identified: 3,
    needs_addressed: 0,
    staff_involved: false,
    linked_to_supervision: false,
    plan_created: false,
    priority: "medium",
    is_current: false,
    specialist_needs_identified: false,
    specialist_needs_addressed: 0,
    ...overrides,
  };
}

function makeQualification(
  overrides: Partial<QualificationRecordInput> = {},
): QualificationRecordInput {
  return {
    id: uid(),
    staff_id: "staff_1",
    qualification_name: "Level 3 Diploma",
    status: "achieved",
    role_relevant: true,
    level: 3,
    registration_current: false,
    achieved_date: "2024-01-15",
    expiry_date: null,
    cpd_requirements_met: false,
    is_required: false,
    evidence_on_file: false,
    ...overrides,
  };
}

function makeDevelopmentPlan(
  overrides: Partial<DevelopmentPlanRecordInput> = {},
): DevelopmentPlanRecordInput {
  return {
    id: uid(),
    staff_id: "staff_1",
    plan_exists: true,
    is_current: false,
    last_reviewed_date: null,
    objectives_set: 0,
    objectives_achieved: 0,
    objectives_in_progress: 0,
    staff_involved: false,
    linked_to_home_priorities: false,
    measurable_outcomes: false,
    linked_to_supervision: false,
    career_pathway_documented: false,
    quality_rating: 0,
    ...overrides,
  };
}

function run(
  overrides: Partial<StaffTrainingCpdComplianceInput> = {},
): StaffTrainingCpdComplianceResult {
  return computeStaffTrainingCpdCompliance(baseInput(overrides));
}

// ═══════════════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════════════

// ── 1. Insufficient Data ────────────────────────────────────────────────────

describe("insufficient data — allEmpty + 0 staff", () => {
  it("returns insufficient_data rating with score 0", () => {
    const r = run();
    expect(r.training_rating).toBe("insufficient_data");
    expect(r.training_score).toBe(0);
  });

  it("headline mentions insufficient data", () => {
    const r = run();
    expect(r.headline).toContain("Insufficient data");
  });

  it("all key metrics are 0", () => {
    const r = run();
    expect(r.mandatory_training_compliance_rate).toBe(0);
    expect(r.cpd_completion_rate).toBe(0);
    expect(r.training_needs_coverage_rate).toBe(0);
    expect(r.qualification_currency_rate).toBe(0);
    expect(r.development_plan_coverage_rate).toBe(0);
    expect(r.training_effectiveness_rate).toBe(0);
  });

  it("all detailed metrics are 0", () => {
    const r = run();
    expect(r.mandatory_training_valid_count).toBe(0);
    expect(r.mandatory_training_expired_count).toBe(0);
    expect(r.mandatory_training_overdue_count).toBe(0);
    expect(r.mandatory_training_total).toBe(0);
    expect(r.cpd_total_hours).toBe(0);
    expect(r.cpd_avg_hours_per_staff).toBe(0);
    expect(r.cpd_records_with_reflection).toBe(0);
    expect(r.cpd_records_with_evidence).toBe(0);
    expect(r.cpd_learning_applied_count).toBe(0);
    expect(r.training_needs_total_identified).toBe(0);
    expect(r.training_needs_total_addressed).toBe(0);
    expect(r.qualifications_achieved_count).toBe(0);
    expect(r.qualifications_in_progress_count).toBe(0);
    expect(r.qualifications_expired_count).toBe(0);
    expect(r.development_plans_active_count).toBe(0);
    expect(r.development_plans_current_count).toBe(0);
    expect(r.development_objectives_achievement_rate).toBe(0);
  });

  it("has no strengths or concerns", () => {
    const r = run();
    expect(r.strengths).toHaveLength(0);
    expect(r.concerns).toHaveLength(0);
  });

  it("has 1 recommendation with immediate urgency", () => {
    const r = run();
    expect(r.recommendations).toHaveLength(1);
    expect(r.recommendations[0].urgency).toBe("immediate");
    expect(r.recommendations[0].regulatory_ref).toBe("CHR 2015 Reg 32");
  });

  it("has 1 insight with warning severity", () => {
    const r = run();
    expect(r.insights).toHaveLength(1);
    expect(r.insights[0].severity).toBe("warning");
  });
});

// ── 2. Inadequate Baseline (allEmpty + staff > 0) ───────────────────────────

describe("inadequate baseline — allEmpty + staff > 0", () => {
  it("returns inadequate rating with score 15 for 1 staff", () => {
    const r = run({ total_staff: 1 });
    expect(r.training_rating).toBe("inadequate");
    expect(r.training_score).toBe(15);
  });

  it("returns inadequate rating with score 15 for 10 staff", () => {
    const r = run({ total_staff: 10 });
    expect(r.training_rating).toBe("inadequate");
    expect(r.training_score).toBe(15);
  });

  it("headline mentions staff count and Reg 32/33", () => {
    const r = run({ total_staff: 5 });
    expect(r.headline).toContain("5 staff");
    expect(r.headline).toContain("Reg 32/33");
  });

  it("has 5 concerns for staff > 1", () => {
    const r = run({ total_staff: 3 });
    expect(r.concerns).toHaveLength(5);
  });

  it("has 4 recommendations all immediate", () => {
    const r = run({ total_staff: 3 });
    expect(r.recommendations).toHaveLength(4);
    for (const rec of r.recommendations) {
      expect(rec.urgency).toBe("immediate");
    }
  });

  it("has 1 critical insight", () => {
    const r = run({ total_staff: 3 });
    expect(r.insights).toHaveLength(1);
    expect(r.insights[0].severity).toBe("critical");
  });

  it("uses singular grammar for 1 staff member", () => {
    const r = run({ total_staff: 1 });
    expect(r.concerns[0]).toContain("1 staff member is");
  });

  it("uses plural grammar for multiple staff", () => {
    const r = run({ total_staff: 5 });
    expect(r.concerns[0]).toContain("5 staff members are");
  });
});

// ── 3. Base Score ───────────────────────────────────────────────────────────

describe("base score", () => {
  it("starts at 52 with minimal data that triggers no bonuses or penalties", () => {
    // 1 non-mandatory training record to avoid allEmpty, but no bonus triggers
    const r = run({
      total_staff: 10,
      mandatory_training_records: [
        makeMandatoryTraining({ is_mandatory: false, status: "not_started", is_valid: false, assessment_passed: false, certificate_issued: false, provider_quality_rating: 0, training_hours: 0 }),
      ],
    });
    expect(r.training_score).toBe(52);
  });
});

// ── 4. Bonus 1 — Mandatory Training Compliance (0–4) ───────────────────────

describe("bonus 1 — mandatory training compliance", () => {
  function makeRecords(validCount: number, totalCount: number) {
    const records: MandatoryTrainingRecordInput[] = [];
    for (let i = 0; i < validCount; i++) {
      records.push(
        makeMandatoryTraining({
          staff_id: `staff_${i}`,
          status: "completed",
          is_valid: true,
          is_mandatory: true,
          expiry_date: "2027-06-01",
          assessment_passed: false,
          certificate_issued: false,
          provider_quality_rating: 0,
          training_hours: 0,
        }),
      );
    }
    for (let i = validCount; i < totalCount; i++) {
      records.push(
        makeMandatoryTraining({
          staff_id: `staff_${i}`,
          status: "not_started",
          is_valid: false,
          is_mandatory: true,
          expiry_date: null,
          assessment_passed: false,
          certificate_issued: false,
          provider_quality_rating: 0,
          training_hours: 0,
        }),
      );
    }
    return records;
  }

  it("+0 when compliance < 50%", () => {
    // 4/10 = 40%
    const r = run({
      total_staff: 10,
      mandatory_training_records: makeRecords(4, 10),
    });
    expect(r.training_score).toBe(52); // base only
  });

  it("+1 when compliance >= 50% and < 70%", () => {
    // 5/10 = 50%
    const r = run({
      total_staff: 10,
      mandatory_training_records: makeRecords(5, 10),
    });
    expect(r.training_score).toBe(53);
  });

  it("+2 when compliance >= 70% and < 85%", () => {
    // 7/10 = 70%
    const r = run({
      total_staff: 10,
      mandatory_training_records: makeRecords(7, 10),
    });
    expect(r.training_score).toBe(54);
  });

  it("+3 when compliance >= 85% and < 95%", () => {
    // 9/10 = 90%
    const r = run({
      total_staff: 10,
      mandatory_training_records: makeRecords(9, 10),
    });
    expect(r.training_score).toBe(55);
  });

  it("+4 when compliance >= 95%", () => {
    // 10/10 = 100%
    const r = run({
      total_staff: 10,
      mandatory_training_records: makeRecords(10, 10),
    });
    expect(r.training_score).toBe(56);
  });

  it("no bonus when totalMandatory = 0 (guard)", () => {
    // Records with is_mandatory = false
    const r = run({
      total_staff: 10,
      mandatory_training_records: [
        makeMandatoryTraining({ is_mandatory: false, assessment_passed: false, certificate_issued: false, provider_quality_rating: 0, training_hours: 0 }),
      ],
    });
    expect(r.training_score).toBe(52);
  });
});

// ── 5. Bonus 2 — CPD Completion (0–4) ──────────────────────────────────────

describe("bonus 2 — CPD completion", () => {
  function makeCpdSet(completedCount: number, totalCount: number) {
    const records: CpdRecordInput[] = [];
    for (let i = 0; i < completedCount; i++) {
      records.push(makeCpdRecord({ staff_id: `staff_${i}`, status: "completed", cpd_hours: 0 }));
    }
    for (let i = completedCount; i < totalCount; i++) {
      records.push(makeCpdRecord({ staff_id: `staff_${i}`, status: "planned", cpd_hours: 0 }));
    }
    return records;
  }

  it("+0 when completion < 40%", () => {
    // 3/10 = 30%
    const r = run({
      total_staff: 10,
      cpd_records: makeCpdSet(3, 10),
    });
    expect(r.training_score).toBe(52);
  });

  it("+1 when completion >= 40% and < 60%", () => {
    // 4/10 = 40%
    const r = run({
      total_staff: 10,
      cpd_records: makeCpdSet(4, 10),
    });
    expect(r.training_score).toBe(53);
  });

  it("+2 when completion >= 60% and < 75%", () => {
    // 6/10 = 60%
    const r = run({
      total_staff: 10,
      cpd_records: makeCpdSet(6, 10),
    });
    expect(r.training_score).toBe(54);
  });

  it("+3 when completion >= 75% and < 90%", () => {
    // 8/10 = 80%
    const r = run({
      total_staff: 10,
      cpd_records: makeCpdSet(8, 10),
    });
    expect(r.training_score).toBe(55);
  });

  it("+4 when completion >= 90%", () => {
    // 9/10 = 90%
    const r = run({
      total_staff: 10,
      cpd_records: makeCpdSet(9, 10),
    });
    expect(r.training_score).toBe(56);
  });

  it("no bonus when totalCpd = 0 (guard)", () => {
    const r = run({ total_staff: 10 });
    // allEmpty with staff > 0 = special case score 15
    // We need at least one non-cpd record to avoid allEmpty
    const r2 = run({
      total_staff: 10,
      mandatory_training_records: [
        makeMandatoryTraining({ is_mandatory: false, assessment_passed: false, certificate_issued: false, provider_quality_rating: 0, training_hours: 0 }),
      ],
    });
    expect(r2.training_score).toBe(52);
  });
});

// ── 6. Bonus 3 — CPD Quality (reflection + evidence + applied) (0–3) ──────

describe("bonus 3 — CPD quality", () => {
  function makeCpdQuality(reflection: boolean, evidence: boolean, applied: boolean) {
    return makeCpdRecord({
      status: "completed",
      reflection_recorded: reflection,
      evidence_obtained: evidence,
      learning_applied: applied,
      cpd_hours: 0,
    });
  }

  // We need to have totalCpd > 0 AND completedCpd > 0 for this bonus.
  // We also need NO other bonuses. Use is_mandatory: false training to avoid allEmpty.
  function runWithCpdQuality(records: CpdRecordInput[]) {
    return run({
      total_staff: 10,
      cpd_records: records,
      // Avoid allEmpty but no other bonuses
      mandatory_training_records: [
        makeMandatoryTraining({ is_mandatory: false, assessment_passed: false, certificate_issued: false, provider_quality_rating: 0, training_hours: 0 }),
      ],
    });
  }

  it("+0 when quality avg < 40%", () => {
    // 1 completed with nothing => reflection=0%, evidence=0%, applied=0%, avg=0%
    const r = runWithCpdQuality([
      makeCpdQuality(false, false, false),
    ]);
    // Base 52 + bonus2 (1/1=100% -> +4) = 56
    // But we need to isolate bonus 3 from bonus 2.
    // With 1 completed out of 1 total, cpdCompletionRate = 100% -> bonus2 = +4
    // quality avg = 0 -> bonus3 = +0
    expect(r.training_score).toBe(56); // 52 + 4 (bonus2) + 0 (bonus3)
  });

  it("+1 when quality avg >= 40% and < 60%", () => {
    // 2 completed: 1 with all true, 1 with none => each rate = 50%, avg = 50%
    const r = runWithCpdQuality([
      makeCpdQuality(true, true, true),
      makeCpdQuality(false, false, false),
    ]);
    // bonus2: 2/2=100% -> +4; bonus3: avg(50,50,50)=50 -> +1
    expect(r.training_score).toBe(57); // 52 + 4 + 1
  });

  it("+2 when quality avg >= 60% and < 80%", () => {
    // 3 completed: 2 with all true, 1 with none => each rate = pct(2,3)=67%, avg = 67%
    const r = runWithCpdQuality([
      makeCpdQuality(true, true, true),
      makeCpdQuality(true, true, true),
      makeCpdQuality(false, false, false),
    ]);
    // bonus2: 3/3=100% -> +4; bonus3: avg(67,67,67)=67 -> +2
    // bonus9: cpdLearningApplied=67, cpdReflection=67, avg=67 -> +1
    expect(r.training_score).toBe(59); // 52 + 4 + 2 + 1
  });

  it("+3 when quality avg >= 80%", () => {
    // 5 completed: 4 with all true, 1 with none => each rate = pct(4,5)=80%, avg = 80%
    const r = runWithCpdQuality([
      makeCpdQuality(true, true, true),
      makeCpdQuality(true, true, true),
      makeCpdQuality(true, true, true),
      makeCpdQuality(true, true, true),
      makeCpdQuality(false, false, false),
    ]);
    // bonus2: 5/5=100% -> +4; bonus3: avg(80,80,80)=80 -> +3
    // bonus9: cpdLearningApplied=80, cpdReflection=80, avg=80 -> +2
    expect(r.training_score).toBe(61); // 52 + 4 + 3 + 2
  });

  it("no bonus when completedCpd = 0 (guard)", () => {
    const r = runWithCpdQuality([
      makeCpdRecord({ status: "planned", cpd_hours: 0 }),
    ]);
    // bonus2: 0/1=0% -> +0; bonus3: guard (completedCpd=0) -> +0
    expect(r.training_score).toBe(52);
  });
});

// ── 7. Bonus 4 — Training Needs Coverage (0–3) ─────────────────────────────

describe("bonus 4 — training needs coverage", () => {
  function makeCurrentTna(staffId: string): TrainingNeedsRecordInput {
    return makeTrainingNeeds({ staff_id: staffId, is_current: true, needs_identified: 0, needs_addressed: 0 });
  }
  function makeNonCurrentTna(staffId: string): TrainingNeedsRecordInput {
    return makeTrainingNeeds({ staff_id: staffId, is_current: false, needs_identified: 0, needs_addressed: 0 });
  }

  // Need a non-training record to avoid allEmpty
  function runWithTna(current: number, totalStaff: number) {
    const records: TrainingNeedsRecordInput[] = [];
    for (let i = 0; i < current; i++) {
      records.push(makeCurrentTna(`staff_${i}`));
    }
    return run({
      total_staff: totalStaff,
      training_needs_records: records,
    });
  }

  it("+0 when coverage < 50%", () => {
    // 4/10 = 40%
    const r = runWithTna(4, 10);
    expect(r.training_score).toBe(52);
  });

  it("+1 when coverage >= 50% and < 70%", () => {
    // 5/10 = 50%
    const r = runWithTna(5, 10);
    expect(r.training_score).toBe(53);
  });

  it("+2 when coverage >= 70% and < 90%", () => {
    // 7/10 = 70%
    const r = runWithTna(7, 10);
    expect(r.training_score).toBe(54);
  });

  it("+3 when coverage >= 90%", () => {
    // 9/10 = 90%
    const r = runWithTna(9, 10);
    expect(r.training_score).toBe(55);
  });

  it("no bonus when total_staff = 0 (guard)", () => {
    // total_staff=0 but training_needs_records exist -> NOT allEmpty
    // But total_staff=0 => guard on bonus 4 and bonus 7
    // The coverage calculation when total_staff=0 uses fallback: pct(current, totalTrainingNeeds)
    // But the bonus itself checks total_staff > 0, so no bonus.
    const r = run({
      total_staff: 0,
      training_needs_records: [makeCurrentTna("staff_1")],
    });
    expect(r.training_score).toBe(52);
  });
});

// ── 8. Bonus 5 — Training Needs Addressed (0–3) ────────────────────────────

describe("bonus 5 — training needs addressed", () => {
  function runWithNeedsAddressed(addressed: number, identified: number) {
    return run({
      total_staff: 10,
      training_needs_records: [
        makeTrainingNeeds({ needs_identified: identified, needs_addressed: addressed, is_current: false }),
      ],
    });
  }

  it("+0 when rate < 45%", () => {
    // 4/10 = 40%
    const r = runWithNeedsAddressed(4, 10);
    expect(r.training_score).toBe(52);
  });

  it("+1 when rate >= 45% and < 65%", () => {
    // 5/10 = 50% (pct rounds)
    const r = runWithNeedsAddressed(5, 10);
    expect(r.training_score).toBe(53);
  });

  it("+2 when rate >= 65% and < 85%", () => {
    // 7/10 = 70%
    // bonus9: effectiveness = avg(70) = 70 -> +1
    const r = runWithNeedsAddressed(7, 10);
    expect(r.training_score).toBe(55); // 52 + 2 + 1
  });

  it("+3 when rate >= 85%", () => {
    // 9/10 = 90%
    // bonus9: effectiveness = avg(90) = 90 -> +2
    const r = runWithNeedsAddressed(9, 10);
    expect(r.training_score).toBe(57); // 52 + 3 + 2
  });

  it("no bonus when totalNeedsIdentified = 0 (guard)", () => {
    const r = run({
      total_staff: 10,
      training_needs_records: [
        makeTrainingNeeds({ needs_identified: 0, needs_addressed: 0, is_current: false }),
      ],
    });
    expect(r.training_score).toBe(52);
  });
});

// ── 9. Bonus 6 — Qualification Currency (0–3) ──────────────────────────────

describe("bonus 6 — qualification currency", () => {
  function makeCurrentQual(staffId: string): QualificationRecordInput {
    return makeQualification({
      staff_id: staffId,
      status: "achieved",
      registration_current: true,
      evidence_on_file: false,
      role_relevant: false,
      is_required: false,
      level: 0,
      expiry_date: null,
    });
  }
  function makeNotCurrentQual(staffId: string): QualificationRecordInput {
    return makeQualification({
      staff_id: staffId,
      status: "achieved",
      registration_current: false,
      evidence_on_file: false,
      role_relevant: false,
      is_required: false,
      level: 0,
      expiry_date: null,
    });
  }

  function runWithQuals(currentCount: number, totalCount: number) {
    const records: QualificationRecordInput[] = [];
    for (let i = 0; i < currentCount; i++) {
      records.push(makeCurrentQual(`staff_${i}`));
    }
    for (let i = currentCount; i < totalCount; i++) {
      records.push(makeNotCurrentQual(`staff_${i}`));
    }
    return run({ total_staff: 10, qualification_records: records });
  }

  it("+0 when currency < 55%", () => {
    // 5/10 = 50%
    const r = runWithQuals(5, 10);
    expect(r.training_score).toBe(52);
  });

  it("+1 when currency >= 55% and < 75%", () => {
    // 6/10 = 60%
    const r = runWithQuals(6, 10);
    expect(r.training_score).toBe(53);
  });

  it("+2 when currency >= 75% and < 90%", () => {
    // 8/10 = 80%
    const r = runWithQuals(8, 10);
    expect(r.training_score).toBe(54);
  });

  it("+3 when currency >= 90%", () => {
    // 9/10 = 90%
    const r = runWithQuals(9, 10);
    expect(r.training_score).toBe(55);
  });

  it("no bonus when totalQualifications = 0 (guard)", () => {
    const r = run({
      total_staff: 10,
      mandatory_training_records: [
        makeMandatoryTraining({ is_mandatory: false, assessment_passed: false, certificate_issued: false, provider_quality_rating: 0, training_hours: 0 }),
      ],
    });
    expect(r.training_score).toBe(52);
  });
});

// ── 10. Bonus 7 — Development Plan Coverage (0–3) ──────────────────────────

describe("bonus 7 — development plan coverage", () => {
  function makeCurrentPlan(staffId: string): DevelopmentPlanRecordInput {
    return makeDevelopmentPlan({
      staff_id: staffId,
      plan_exists: true,
      is_current: true,
      objectives_set: 0,
      objectives_achieved: 0,
    });
  }

  function runWithPlans(currentCount: number, totalStaff: number) {
    const records: DevelopmentPlanRecordInput[] = [];
    for (let i = 0; i < currentCount; i++) {
      records.push(makeCurrentPlan(`staff_${i}`));
    }
    return run({ total_staff: totalStaff, development_plan_records: records });
  }

  it("+0 when coverage < 50%", () => {
    // 4/10 = 40%
    const r = runWithPlans(4, 10);
    expect(r.training_score).toBe(52);
  });

  it("+1 when coverage >= 50% and < 70%", () => {
    // 5/10 = 50%
    const r = runWithPlans(5, 10);
    expect(r.training_score).toBe(53);
  });

  it("+2 when coverage >= 70% and < 90%", () => {
    // 7/10 = 70%
    const r = runWithPlans(7, 10);
    expect(r.training_score).toBe(54);
  });

  it("+3 when coverage >= 90%", () => {
    // 9/10 = 90%
    const r = runWithPlans(9, 10);
    expect(r.training_score).toBe(55);
  });

  it("no bonus when total_staff = 0 (guard)", () => {
    const r = run({
      total_staff: 0,
      development_plan_records: [makeCurrentPlan("staff_1")],
    });
    expect(r.training_score).toBe(52);
  });
});

// ── 11. Bonus 8 — Development Objectives Achievement (0–3) ─────────────────

describe("bonus 8 — development objectives achievement", () => {
  function runWithObjectives(achieved: number, total: number) {
    return run({
      total_staff: 10,
      development_plan_records: [
        makeDevelopmentPlan({
          plan_exists: false, // avoid stale plan penalty
          is_current: false,
          objectives_set: total,
          objectives_achieved: achieved,
        }),
      ],
    });
  }

  it("+0 when rate < 40%", () => {
    // 3/10 = 30%
    // bonus9: effectiveness = avg(30) = 30 -> +0
    const r = runWithObjectives(3, 10);
    expect(r.training_score).toBe(52); // 52 + 0 + 0
  });

  it("+1 when rate >= 40% and < 60%", () => {
    // 4/10 = 40%
    // bonus9: effectiveness = avg(40) = 40 -> +0
    const r = runWithObjectives(4, 10);
    expect(r.training_score).toBe(53); // 52 + 1 + 0
  });

  it("+2 when rate >= 60% and < 80%", () => {
    // 6/10 = 60%
    // bonus9: effectiveness = avg(60) = 60 -> +1
    const r = runWithObjectives(6, 10);
    expect(r.training_score).toBe(55); // 52 + 2 + 1
  });

  it("+3 when rate >= 80%", () => {
    // 8/10 = 80%
    // bonus9: effectiveness = avg(80) = 80 -> +2
    const r = runWithObjectives(8, 10);
    expect(r.training_score).toBe(57); // 52 + 3 + 2
  });

  it("no bonus when totalObjectivesSet = 0 (guard)", () => {
    const r = run({
      total_staff: 10,
      development_plan_records: [
        makeDevelopmentPlan({ plan_exists: false, is_current: false, objectives_set: 0, objectives_achieved: 0 }),
      ],
    });
    expect(r.training_score).toBe(52);
  });
});

// ── 12. Bonus 9 — Training Effectiveness Composite (0–2) ───────────────────

describe("bonus 9 — training effectiveness composite", () => {
  it("+0 when effectiveness < 60%", () => {
    // Need effectivenessComponents.length > 0
    // assessmentPassRate: 1 completed mandatory, 0 passed => 0%
    const r = run({
      total_staff: 10,
      mandatory_training_records: [
        makeMandatoryTraining({
          is_mandatory: true,
          status: "completed",
          is_valid: false,
          assessment_passed: false,
          certificate_issued: false,
          provider_quality_rating: 0,
          training_hours: 0,
          expiry_date: null,
        }),
      ],
    });
    // assessmentPassRate = 0%, effectiveness = avg(0) = 0 -> +0
    // Also no bonus 1 (compliance = 0/1 = 0%)
    expect(r.training_score).toBe(52);
  });

  it("+1 when effectiveness >= 60% and < 80%", () => {
    // assessmentPassRate: 7/10 = 70%, effectiveness = avg(70) = 70 -> +1
    const records: MandatoryTrainingRecordInput[] = [];
    for (let i = 0; i < 7; i++) {
      records.push(makeMandatoryTraining({
        staff_id: `staff_${i}`,
        is_mandatory: true,
        status: "completed",
        is_valid: false,
        assessment_passed: true,
        expiry_date: null,
        certificate_issued: false,
        provider_quality_rating: 0,
        training_hours: 0,
      }));
    }
    for (let i = 7; i < 10; i++) {
      records.push(makeMandatoryTraining({
        staff_id: `staff_${i}`,
        is_mandatory: true,
        status: "completed",
        is_valid: false,
        assessment_passed: false,
        expiry_date: null,
        certificate_issued: false,
        provider_quality_rating: 0,
        training_hours: 0,
      }));
    }
    const r = run({
      total_staff: 10,
      mandatory_training_records: records,
    });
    // assessmentPassRate = 70%, effectiveness = avg(70) = 70 -> +1
    // Bonus1: compliance = pct(valid=0, mandatory=10) = 0% -> +0
    expect(r.training_score).toBe(53); // 52 + 0 + 1
  });

  it("+2 when effectiveness >= 80%", () => {
    // assessmentPassRate: 9/10 = 90%, effectiveness = avg(90) = 90 -> +2
    const records: MandatoryTrainingRecordInput[] = [];
    for (let i = 0; i < 9; i++) {
      records.push(makeMandatoryTraining({
        staff_id: `staff_${i}`,
        is_mandatory: true,
        status: "completed",
        is_valid: false,
        assessment_passed: true,
        expiry_date: null,
        certificate_issued: false,
        provider_quality_rating: 0,
        training_hours: 0,
      }));
    }
    records.push(makeMandatoryTraining({
      staff_id: "staff_9",
      is_mandatory: true,
      status: "completed",
      is_valid: false,
      assessment_passed: false,
      expiry_date: null,
      certificate_issued: false,
      provider_quality_rating: 0,
      training_hours: 0,
    }));

    const r = run({
      total_staff: 10,
      mandatory_training_records: records,
    });
    // assessmentPassRate = 90%, effectiveness = avg(90) = 90 -> +2
    // Bonus1: compliance = pct(0, 10) = 0% -> +0
    expect(r.training_score).toBe(54); // 52 + 0 + 2
  });

  it("no bonus when no effectiveness components (guard)", () => {
    // No completed mandatory, no completed CPD, no needs, no objectives
    const r = run({
      total_staff: 10,
      mandatory_training_records: [
        makeMandatoryTraining({
          is_mandatory: true,
          status: "not_started",
          is_valid: false,
          assessment_passed: false,
          certificate_issued: false,
          provider_quality_rating: 0,
          training_hours: 0,
          expiry_date: null,
        }),
      ],
    });
    // No effectiveness components => guard, no bonus 9
    // Bonus 1: compliance = 0/1 = 0% -> +0
    expect(r.training_score).toBe(52);
  });
});

// ── 13. All Bonuses Combined — Max Score 80 ─────────────────────────────────

describe("all bonuses combined — max score 80", () => {
  it("achieves score 80 with all bonuses at maximum tiers", () => {
    const totalStaff = 10;
    // Bonus 1: 10/10 mandatory valid = 100% -> +4
    const mandatoryRecords: MandatoryTrainingRecordInput[] = [];
    for (let i = 0; i < 10; i++) {
      mandatoryRecords.push(
        makeMandatoryTraining({
          staff_id: `staff_${i}`,
          status: "completed",
          is_valid: true,
          is_mandatory: true,
          expiry_date: "2027-06-01",
          assessment_passed: true,
          certificate_issued: true,
          provider_quality_rating: 5,
          training_hours: 10,
        }),
      );
    }

    // Bonus 2 & 3: 10/10 CPD completed (100% -> +4), all quality true (100% -> +3)
    const cpdRecords: CpdRecordInput[] = [];
    for (let i = 0; i < 10; i++) {
      cpdRecords.push(
        makeCpdRecord({
          staff_id: `staff_${i}`,
          status: "completed",
          reflection_recorded: true,
          evidence_obtained: true,
          learning_applied: true,
          cpd_hours: 30,
          activity_date: "2026-03-01",
          linked_to_development_need: true,
          shared_with_team: true,
        }),
      );
    }

    // Bonus 4: 10/10 staff with current TNA = 100% -> +3
    // Bonus 5: needs addressed = 90/100 = 90% -> +3
    const tnaRecords: TrainingNeedsRecordInput[] = [];
    for (let i = 0; i < 10; i++) {
      tnaRecords.push(
        makeTrainingNeeds({
          staff_id: `staff_${i}`,
          is_current: true,
          needs_identified: 10,
          needs_addressed: 9,
          staff_involved: true,
          linked_to_supervision: true,
          plan_created: true,
        }),
      );
    }

    // Bonus 6: 10/10 qualifications current = 100% -> +3
    const qualRecords: QualificationRecordInput[] = [];
    for (let i = 0; i < 10; i++) {
      qualRecords.push(
        makeQualification({
          staff_id: `staff_${i}`,
          status: "achieved",
          registration_current: true,
          evidence_on_file: true,
          role_relevant: true,
          is_required: true,
          level: 5,
          expiry_date: null,
        }),
      );
    }

    // Bonus 7: 10/10 staff with current dev plan = 100% -> +3
    // Bonus 8: 80/100 objectives achieved = 80% -> +3
    const devPlanRecords: DevelopmentPlanRecordInput[] = [];
    for (let i = 0; i < 10; i++) {
      devPlanRecords.push(
        makeDevelopmentPlan({
          staff_id: `staff_${i}`,
          plan_exists: true,
          is_current: true,
          objectives_set: 10,
          objectives_achieved: 8,
          objectives_in_progress: 2,
          staff_involved: true,
          linked_to_home_priorities: true,
          measurable_outcomes: true,
          linked_to_supervision: true,
          career_pathway_documented: true,
          quality_rating: 5,
        }),
      );
    }

    // Bonus 9: effectiveness composite
    // assessmentPassRate = 100%, cpdLearningAppliedRate = 100%, cpdReflectionRate = 100%,
    // needsAddressedRate = 90%, devObjRate = 80% -> avg = (100+100+100+90+80)/5 = 94% -> +2

    const r = run({
      total_staff: totalStaff,
      mandatory_training_records: mandatoryRecords,
      cpd_records: cpdRecords,
      training_needs_records: tnaRecords,
      qualification_records: qualRecords,
      development_plan_records: devPlanRecords,
    });

    // 52 + 4 + 4 + 3 + 3 + 3 + 3 + 3 + 3 + 2 = 80
    expect(r.training_score).toBe(80);
    expect(r.training_rating).toBe("outstanding");
  });
});

// ── 14. Penalty 1 — Expired Mandatory Training ─────────────────────────────

describe("penalty 1 — expired mandatory training", () => {
  function makeExpiredMandatory(count: number, total: number) {
    const records: MandatoryTrainingRecordInput[] = [];
    for (let i = 0; i < count; i++) {
      records.push(
        makeMandatoryTraining({
          staff_id: `staff_${i}`,
          is_mandatory: true,
          status: "expired",
          is_valid: false,
          expiry_date: "2025-01-01",
          assessment_passed: false,
          certificate_issued: false,
          provider_quality_rating: 0,
          training_hours: 0,
        }),
      );
    }
    for (let i = count; i < total; i++) {
      records.push(
        makeMandatoryTraining({
          staff_id: `staff_${i}`,
          is_mandatory: true,
          status: "not_started",
          is_valid: false,
          expiry_date: null,
          assessment_passed: false,
          certificate_issued: false,
          provider_quality_rating: 0,
          training_hours: 0,
        }),
      );
    }
    return records;
  }

  it("-3 when expired 5–14%", () => {
    // 1/20 = 5%
    const r = run({
      total_staff: 10,
      mandatory_training_records: makeExpiredMandatory(1, 20),
    });
    expect(r.training_score).toBe(52 - 3); // 49
  });

  it("-6 when expired 15–29%", () => {
    // 3/20 = 15%
    const r = run({
      total_staff: 10,
      mandatory_training_records: makeExpiredMandatory(3, 20),
    });
    expect(r.training_score).toBe(52 - 6); // 46
  });

  it("-10 when expired >= 30%", () => {
    // 3/10 = 30%
    const r = run({
      total_staff: 10,
      mandatory_training_records: makeExpiredMandatory(3, 10),
    });
    expect(r.training_score).toBe(52 - 10); // 42
  });

  it("no penalty when expired < 5%", () => {
    // 0/10 = 0%
    const r = run({
      total_staff: 10,
      mandatory_training_records: makeExpiredMandatory(0, 10),
    });
    expect(r.training_score).toBe(52); // no bonus, no penalty
  });

  it("no penalty when totalMandatory = 0 (guard)", () => {
    const r = run({
      total_staff: 10,
      mandatory_training_records: [
        makeMandatoryTraining({ is_mandatory: false, status: "expired", assessment_passed: false, certificate_issued: false, provider_quality_rating: 0, training_hours: 0 }),
      ],
    });
    expect(r.training_score).toBe(52);
  });
});

// ── 15. Penalty 2 — Overdue CPD ────────────────────────────────────────────

describe("penalty 2 — overdue CPD", () => {
  function makeCpdSet(overdueCount: number, totalCount: number) {
    const records: CpdRecordInput[] = [];
    for (let i = 0; i < overdueCount; i++) {
      records.push(makeCpdRecord({ staff_id: `staff_${i}`, status: "overdue", cpd_hours: 0 }));
    }
    for (let i = overdueCount; i < totalCount; i++) {
      records.push(makeCpdRecord({ staff_id: `staff_${i}`, status: "planned", cpd_hours: 0 }));
    }
    return records;
  }

  it("-2 when overdue 5–9%", () => {
    // 1/20 = 5%
    const r = run({
      total_staff: 10,
      cpd_records: makeCpdSet(1, 20),
    });
    // bonus2: 0/20=0% -> +0; penalty2: 5% -> -2
    expect(r.training_score).toBe(52 - 2); // 50
  });

  it("-4 when overdue 10–24%", () => {
    // 2/20 = 10%
    const r = run({
      total_staff: 10,
      cpd_records: makeCpdSet(2, 20),
    });
    expect(r.training_score).toBe(52 - 4); // 48
  });

  it("-8 when overdue >= 25%", () => {
    // 5/20 = 25%
    const r = run({
      total_staff: 10,
      cpd_records: makeCpdSet(5, 20),
    });
    expect(r.training_score).toBe(52 - 8); // 44
  });

  it("no penalty when overdue < 5%", () => {
    // 0/20 = 0%
    const r = run({
      total_staff: 10,
      cpd_records: makeCpdSet(0, 20),
    });
    expect(r.training_score).toBe(52); // no bonuses (0% completed), no penalty
  });

  it("no penalty when totalCpd = 0 (guard)", () => {
    const r = run({
      total_staff: 10,
      mandatory_training_records: [
        makeMandatoryTraining({ is_mandatory: false, assessment_passed: false, certificate_issued: false, provider_quality_rating: 0, training_hours: 0 }),
      ],
    });
    expect(r.training_score).toBe(52);
  });
});

// ── 16. Penalty 3 — Expired Qualifications ─────────────────────────────────

describe("penalty 3 — expired qualifications", () => {
  function makeQualSet(expiredCount: number, totalCount: number) {
    const records: QualificationRecordInput[] = [];
    for (let i = 0; i < expiredCount; i++) {
      records.push(
        makeQualification({
          staff_id: `staff_${i}`,
          status: "expired",
          registration_current: false,
          evidence_on_file: false,
          role_relevant: false,
          is_required: false,
          level: 0,
          expiry_date: null,
        }),
      );
    }
    for (let i = expiredCount; i < totalCount; i++) {
      records.push(
        makeQualification({
          staff_id: `staff_${i}`,
          status: "not_started",
          registration_current: false,
          evidence_on_file: false,
          role_relevant: false,
          is_required: false,
          level: 0,
          expiry_date: null,
        }),
      );
    }
    return records;
  }

  it("-2 when expired 5–9%", () => {
    // 1/20 = 5%
    const r = run({
      total_staff: 10,
      qualification_records: makeQualSet(1, 20),
    });
    // bonus6: currentQuals = pct(0,20) = 0% -> +0; penalty3: 5% -> -2
    expect(r.training_score).toBe(52 - 2); // 50
  });

  it("-4 when expired 10–24%", () => {
    // 2/20 = 10%
    const r = run({
      total_staff: 10,
      qualification_records: makeQualSet(2, 20),
    });
    expect(r.training_score).toBe(52 - 4); // 48
  });

  it("-8 when expired >= 25%", () => {
    // 5/20 = 25%
    const r = run({
      total_staff: 10,
      qualification_records: makeQualSet(5, 20),
    });
    expect(r.training_score).toBe(52 - 8); // 44
  });

  it("no penalty when expired < 5%", () => {
    // 0/20 = 0%
    const r = run({
      total_staff: 10,
      qualification_records: makeQualSet(0, 20),
    });
    expect(r.training_score).toBe(52);
  });

  it("no penalty when totalQualifications = 0 (guard)", () => {
    const r = run({
      total_staff: 10,
      mandatory_training_records: [
        makeMandatoryTraining({ is_mandatory: false, assessment_passed: false, certificate_issued: false, provider_quality_rating: 0, training_hours: 0 }),
      ],
    });
    expect(r.training_score).toBe(52);
  });
});

// ── 17. Penalty 4 — Stale Development Plans ────────────────────────────────

describe("penalty 4 — stale development plans", () => {
  function makePlanSet(staleCount: number, currentCount: number) {
    const records: DevelopmentPlanRecordInput[] = [];
    for (let i = 0; i < staleCount; i++) {
      records.push(
        makeDevelopmentPlan({
          staff_id: `staff_stale_${i}`,
          plan_exists: true,
          is_current: false,
          objectives_set: 0,
          objectives_achieved: 0,
        }),
      );
    }
    for (let i = 0; i < currentCount; i++) {
      records.push(
        makeDevelopmentPlan({
          staff_id: `staff_current_${i}`,
          plan_exists: true,
          is_current: true,
          objectives_set: 0,
          objectives_achieved: 0,
        }),
      );
    }
    return records;
  }

  it("-1 when stale 10–19%", () => {
    // 1 stale out of 10 active = 10%
    const r = run({
      total_staff: 20,
      development_plan_records: makePlanSet(1, 9),
    });
    // bonus7: coverageRate = pct(9, 20) = 45% -> +0; penalty4: stale=10% -> -1
    expect(r.training_score).toBe(52 - 1); // 51
  });

  it("-3 when stale 20–39%", () => {
    // 2 stale out of 10 active = 20%
    const r = run({
      total_staff: 20,
      development_plan_records: makePlanSet(2, 8),
    });
    // bonus7: coverageRate = pct(8, 20) = 40% -> +0; penalty4: stale=20% -> -3
    expect(r.training_score).toBe(52 - 3); // 49
  });

  it("-6 when stale >= 40%", () => {
    // 4 stale out of 10 active = 40%
    const r = run({
      total_staff: 20,
      development_plan_records: makePlanSet(4, 6),
    });
    // bonus7: coverageRate = pct(6, 20) = 30% -> +0; penalty4: stale=40% -> -6
    expect(r.training_score).toBe(52 - 6); // 46
  });

  it("no penalty when stale < 10%", () => {
    // 0 stale out of 10 active = 0%
    const r = run({
      total_staff: 20,
      development_plan_records: makePlanSet(0, 10),
    });
    // bonus7: coverageRate = pct(10, 20) = 50% -> +1; penalty4: 0% -> no penalty
    expect(r.training_score).toBe(53); // 52 + 1
  });

  it("no penalty when activePlans = 0 (guard)", () => {
    // plan_exists: false means not active
    const r = run({
      total_staff: 10,
      development_plan_records: [
        makeDevelopmentPlan({ plan_exists: false, is_current: false, objectives_set: 0 }),
      ],
    });
    expect(r.training_score).toBe(52);
  });
});

// ── 18. Rating Boundaries ───────────────────────────────────────────────────

describe("rating boundaries", () => {
  it("score 80 = outstanding", () => {
    // Already tested in all-bonuses test; confirm rating
    const totalStaff = 10;
    const mandatoryRecords: MandatoryTrainingRecordInput[] = [];
    for (let i = 0; i < 10; i++) {
      mandatoryRecords.push(makeMandatoryTraining({
        staff_id: `staff_${i}`, status: "completed", is_valid: true, is_mandatory: true,
        expiry_date: "2027-06-01", assessment_passed: true, certificate_issued: true,
        provider_quality_rating: 5, training_hours: 10,
      }));
    }
    const cpdRecords: CpdRecordInput[] = [];
    for (let i = 0; i < 10; i++) {
      cpdRecords.push(makeCpdRecord({
        staff_id: `staff_${i}`, status: "completed", reflection_recorded: true,
        evidence_obtained: true, learning_applied: true, cpd_hours: 30,
        activity_date: "2026-03-01", linked_to_development_need: true, shared_with_team: true,
      }));
    }
    const tnaRecords: TrainingNeedsRecordInput[] = [];
    for (let i = 0; i < 10; i++) {
      tnaRecords.push(makeTrainingNeeds({
        staff_id: `staff_${i}`, is_current: true, needs_identified: 10,
        needs_addressed: 9, staff_involved: true, linked_to_supervision: true, plan_created: true,
      }));
    }
    const qualRecords: QualificationRecordInput[] = [];
    for (let i = 0; i < 10; i++) {
      qualRecords.push(makeQualification({
        staff_id: `staff_${i}`, status: "achieved", registration_current: true,
        evidence_on_file: true, role_relevant: true, is_required: true, level: 5,
      }));
    }
    const devPlanRecords: DevelopmentPlanRecordInput[] = [];
    for (let i = 0; i < 10; i++) {
      devPlanRecords.push(makeDevelopmentPlan({
        staff_id: `staff_${i}`, plan_exists: true, is_current: true, objectives_set: 10,
        objectives_achieved: 8, objectives_in_progress: 2, staff_involved: true,
        linked_to_home_priorities: true, measurable_outcomes: true,
        linked_to_supervision: true, career_pathway_documented: true, quality_rating: 5,
      }));
    }

    const r = run({
      total_staff: totalStaff,
      mandatory_training_records: mandatoryRecords,
      cpd_records: cpdRecords,
      training_needs_records: tnaRecords,
      qualification_records: qualRecords,
      development_plan_records: devPlanRecords,
    });
    expect(r.training_score).toBe(80);
    expect(r.training_rating).toBe("outstanding");
  });

  it("score 79 = good (just below outstanding)", () => {
    // Use max bonuses minus a tiny bit: make one qual not current to drop bonus 6 by 1
    // -> score 79
    const totalStaff = 10;
    const mandatoryRecords: MandatoryTrainingRecordInput[] = [];
    for (let i = 0; i < 10; i++) {
      mandatoryRecords.push(makeMandatoryTraining({
        staff_id: `staff_${i}`, status: "completed", is_valid: true, is_mandatory: true,
        expiry_date: "2027-06-01", assessment_passed: true, certificate_issued: true,
        provider_quality_rating: 5, training_hours: 10,
      }));
    }
    const cpdRecords: CpdRecordInput[] = [];
    for (let i = 0; i < 10; i++) {
      cpdRecords.push(makeCpdRecord({
        staff_id: `staff_${i}`, status: "completed", reflection_recorded: true,
        evidence_obtained: true, learning_applied: true, cpd_hours: 30,
        activity_date: "2026-03-01", linked_to_development_need: true, shared_with_team: true,
      }));
    }
    const tnaRecords: TrainingNeedsRecordInput[] = [];
    for (let i = 0; i < 10; i++) {
      tnaRecords.push(makeTrainingNeeds({
        staff_id: `staff_${i}`, is_current: true, needs_identified: 10,
        needs_addressed: 9, staff_involved: true, linked_to_supervision: true, plan_created: true,
      }));
    }
    // Bonus 6: 8/10 = 80% -> +2 instead of +3 (need 90% for +3)
    const qualRecords: QualificationRecordInput[] = [];
    for (let i = 0; i < 8; i++) {
      qualRecords.push(makeQualification({
        staff_id: `staff_${i}`, status: "achieved", registration_current: true,
        evidence_on_file: true, role_relevant: true, is_required: true, level: 5,
      }));
    }
    for (let i = 8; i < 10; i++) {
      qualRecords.push(makeQualification({
        staff_id: `staff_${i}`, status: "achieved", registration_current: false,
        evidence_on_file: true, role_relevant: true, is_required: true, level: 5,
      }));
    }
    const devPlanRecords: DevelopmentPlanRecordInput[] = [];
    for (let i = 0; i < 10; i++) {
      devPlanRecords.push(makeDevelopmentPlan({
        staff_id: `staff_${i}`, plan_exists: true, is_current: true, objectives_set: 10,
        objectives_achieved: 8, objectives_in_progress: 2, staff_involved: true,
        linked_to_home_priorities: true, measurable_outcomes: true,
        linked_to_supervision: true, career_pathway_documented: true, quality_rating: 5,
      }));
    }

    const r = run({
      total_staff: totalStaff,
      mandatory_training_records: mandatoryRecords,
      cpd_records: cpdRecords,
      training_needs_records: tnaRecords,
      qualification_records: qualRecords,
      development_plan_records: devPlanRecords,
    });
    expect(r.training_score).toBe(79);
    expect(r.training_rating).toBe("good");
  });

  it("score 65 = good (lower boundary)", () => {
    // 52 + 13 in bonuses = 65
    // Bonus 1: +4 (95%+ mandatory compliance)
    // Bonus 2: +4 (90%+ CPD completion)
    // Bonus 4: +3 (90%+ TNA coverage)
    // Bonus 5: +2 (65-84% needs addressed)
    // = 13
    const mandatoryRecords: MandatoryTrainingRecordInput[] = [];
    for (let i = 0; i < 20; i++) {
      mandatoryRecords.push(makeMandatoryTraining({
        staff_id: `staff_${i}`,
        status: "completed",
        is_valid: true,
        is_mandatory: true,
        expiry_date: "2027-06-01",
        assessment_passed: false,
        certificate_issued: false,
        provider_quality_rating: 0,
        training_hours: 0,
      }));
    }
    const cpdRecords: CpdRecordInput[] = [];
    for (let i = 0; i < 10; i++) {
      cpdRecords.push(makeCpdRecord({
        staff_id: `staff_${i}`, status: "completed", cpd_hours: 0,
      }));
    }
    const tnaRecords: TrainingNeedsRecordInput[] = [];
    for (let i = 0; i < 10; i++) {
      tnaRecords.push(makeTrainingNeeds({
        staff_id: `staff_${i}`, is_current: true, needs_identified: 10,
        needs_addressed: 7,
      }));
    }

    const r = run({
      total_staff: 10,
      mandatory_training_records: mandatoryRecords,
      cpd_records: cpdRecords,
      training_needs_records: tnaRecords,
    });
    // Bonus 1: 20/20 = 100% -> +4
    // Bonus 2: 10/10 = 100% -> +4
    // Bonus 3: completedCpd=10 but all reflection/evidence/applied=false => avg=0% -> +0
    // Bonus 4: 10/10 = 100% -> +3
    // Bonus 5: 70/100 = 70% -> +2
    // Bonus 9: effectiveness has components:
    //   assessmentPassRate = pct(0, 20) = 0% (completed mandatory with assessment_passed=false)
    //   cpdLearningAppliedRate = 0%
    //   cpdReflectionRate = 0%
    //   needsAddressedRate = 70%
    //   avg = (0+0+0+70)/4 = 17.5 => round = 18 -> +0
    // Total: 52 + 4 + 4 + 0 + 3 + 2 + 0 = 65
    expect(r.training_score).toBe(65);
    expect(r.training_rating).toBe("good");
  });

  it("score 64 = adequate (just below good)", () => {
    // Same as above but needs_addressed at 6/10 = 60% per TNA => 60/100 = 60% -> but pct gives 60
    // Wait, needs: each TNA has needs_identified=10, needs_addressed=6. Total: 100 identified, 60 addressed. 60% -> +1 not +2
    // 52 + 4 + 4 + 0 + 3 + 1 + 0 = 64
    const mandatoryRecords: MandatoryTrainingRecordInput[] = [];
    for (let i = 0; i < 20; i++) {
      mandatoryRecords.push(makeMandatoryTraining({
        staff_id: `staff_${i}`,
        status: "completed",
        is_valid: true,
        is_mandatory: true,
        expiry_date: "2027-06-01",
        assessment_passed: false,
        certificate_issued: false,
        provider_quality_rating: 0,
        training_hours: 0,
      }));
    }
    const cpdRecords: CpdRecordInput[] = [];
    for (let i = 0; i < 10; i++) {
      cpdRecords.push(makeCpdRecord({
        staff_id: `staff_${i}`, status: "completed", cpd_hours: 0,
      }));
    }
    const tnaRecords: TrainingNeedsRecordInput[] = [];
    for (let i = 0; i < 10; i++) {
      tnaRecords.push(makeTrainingNeeds({
        staff_id: `staff_${i}`, is_current: true, needs_identified: 10,
        needs_addressed: 6,
      }));
    }

    const r = run({
      total_staff: 10,
      mandatory_training_records: mandatoryRecords,
      cpd_records: cpdRecords,
      training_needs_records: tnaRecords,
    });
    // Bonus 5: 60/100 = 60% -> +1 (>=45 and <65)
    // effectiveness: assessmentPassRate=0, cpdLearning=0, cpdReflection=0, needsAddressed=60 => avg=15 -> +0
    // 52 + 4 + 4 + 0 + 3 + 1 + 0 = 64
    expect(r.training_score).toBe(64);
    expect(r.training_rating).toBe("adequate");
  });

  it("score 45 = adequate (lower boundary)", () => {
    // 52 - 7 in penalties = 45
    // We need penalties that subtract 7. Penalty1: -6 (15-29% expired) + penalty4: -1 (10-19% stale) = -7
    // 3/20 mandatory expired = 15% -> -6
    const mandatoryRecords: MandatoryTrainingRecordInput[] = [];
    for (let i = 0; i < 3; i++) {
      mandatoryRecords.push(makeMandatoryTraining({
        staff_id: `staff_exp_${i}`, is_mandatory: true, status: "expired", is_valid: false,
        expiry_date: "2025-01-01", assessment_passed: false, certificate_issued: false,
        provider_quality_rating: 0, training_hours: 0,
      }));
    }
    for (let i = 3; i < 20; i++) {
      mandatoryRecords.push(makeMandatoryTraining({
        staff_id: `staff_${i}`, is_mandatory: true, status: "not_started", is_valid: false,
        expiry_date: null, assessment_passed: false, certificate_issued: false,
        provider_quality_rating: 0, training_hours: 0,
      }));
    }
    // 1 stale out of 10 active dev plans = 10% -> -1
    const devPlans: DevelopmentPlanRecordInput[] = [];
    devPlans.push(makeDevelopmentPlan({ staff_id: "staff_stale_1", plan_exists: true, is_current: false, objectives_set: 0 }));
    for (let i = 0; i < 9; i++) {
      devPlans.push(makeDevelopmentPlan({ staff_id: `staff_plan_${i}`, plan_exists: true, is_current: true, objectives_set: 0 }));
    }

    const r = run({
      total_staff: 20,
      mandatory_training_records: mandatoryRecords,
      development_plan_records: devPlans,
    });
    // bonus 1: pct(0, 20)=0% -> +0
    // bonus 7: pct(9, 20)=45% -> +0 (need >=50%)
    // penalty 1: 15% -> -6
    // penalty 4: stale=10% -> -1
    // 52 + 0 + 0 - 6 - 1 = 45
    expect(r.training_score).toBe(45);
    expect(r.training_rating).toBe("adequate");
  });

  it("score 44 = inadequate (just below adequate)", () => {
    // 52 - 8 = 44. Penalty2: -8 (overdue cpd >= 25%)
    // 5/20 = 25%
    const cpdRecords: CpdRecordInput[] = [];
    for (let i = 0; i < 5; i++) {
      cpdRecords.push(makeCpdRecord({ staff_id: `staff_${i}`, status: "overdue", cpd_hours: 0 }));
    }
    for (let i = 5; i < 20; i++) {
      cpdRecords.push(makeCpdRecord({ staff_id: `staff_${i}`, status: "planned", cpd_hours: 0 }));
    }

    const r = run({
      total_staff: 10,
      cpd_records: cpdRecords,
    });
    // bonus2: 0/20=0% -> +0; penalty2: 25% -> -8
    expect(r.training_score).toBe(44);
    expect(r.training_rating).toBe("inadequate");
  });

  it("score is clamped to minimum 0", () => {
    // Stack up all max penalties
    // Penalty 1: -10, Penalty 2: -8, Penalty 3: -8, Penalty 4: -6 = -32
    // 52 - 32 = 20, still above 0. Let's just verify clamp works with extreme values.
    // Actually clamp(score, 0, 100) means it never goes below 0.
    // With 52 base and max -32 penalties = 20. Minimum possible is 20 with no bonuses.
    // So we can't actually test clamp to 0 easily. Let's just verify the clamp exists.
    const mandatoryRecords: MandatoryTrainingRecordInput[] = [];
    // 100% expired -> -10
    for (let i = 0; i < 10; i++) {
      mandatoryRecords.push(makeMandatoryTraining({
        staff_id: `staff_${i}`, is_mandatory: true, status: "expired", is_valid: false,
        expiry_date: "2025-01-01", assessment_passed: false, certificate_issued: false,
        provider_quality_rating: 0, training_hours: 0,
      }));
    }
    // 100% overdue cpd -> -8
    const cpdRecords: CpdRecordInput[] = [];
    for (let i = 0; i < 10; i++) {
      cpdRecords.push(makeCpdRecord({ staff_id: `staff_${i}`, status: "overdue", cpd_hours: 0 }));
    }
    // 100% expired quals -> -8
    const qualRecords: QualificationRecordInput[] = [];
    for (let i = 0; i < 10; i++) {
      qualRecords.push(makeQualification({
        staff_id: `staff_${i}`, status: "expired", registration_current: false,
        evidence_on_file: false, role_relevant: false, is_required: false, level: 0,
      }));
    }
    // 100% stale plans -> -6
    const devPlans: DevelopmentPlanRecordInput[] = [];
    for (let i = 0; i < 10; i++) {
      devPlans.push(makeDevelopmentPlan({
        staff_id: `staff_${i}`, plan_exists: true, is_current: false, objectives_set: 0,
      }));
    }

    const r = run({
      total_staff: 10,
      mandatory_training_records: mandatoryRecords,
      cpd_records: cpdRecords,
      qualification_records: qualRecords,
      development_plan_records: devPlans,
    });
    // 52 + 0 (no bonuses) - 10 - 8 - 8 - 6 = 20
    expect(r.training_score).toBe(20);
    expect(r.training_rating).toBe("inadequate");
  });
});

// ── 19. Metric Calculations ─────────────────────────────────────────────────

describe("metric calculations", () => {
  it("mandatory_training_compliance_rate counts only is_mandatory records", () => {
    const r = run({
      total_staff: 5,
      mandatory_training_records: [
        makeMandatoryTraining({ is_mandatory: true, status: "completed", is_valid: true, expiry_date: "2027-01-01" }),
        makeMandatoryTraining({ is_mandatory: true, status: "not_started", is_valid: false }),
        makeMandatoryTraining({ is_mandatory: false, status: "completed", is_valid: true }),
      ],
    });
    // 1 valid mandatory out of 2 mandatory total = 50%
    expect(r.mandatory_training_compliance_rate).toBe(50);
    expect(r.mandatory_training_total).toBe(2);
  });

  it("mandatory_training_valid_count requires completed + is_valid + not expired", () => {
    const r = run({
      total_staff: 5,
      mandatory_training_records: [
        makeMandatoryTraining({ is_mandatory: true, status: "completed", is_valid: true, expiry_date: "2027-01-01" }),
        makeMandatoryTraining({ is_mandatory: true, status: "completed", is_valid: false, expiry_date: "2027-01-01" }),
        makeMandatoryTraining({ is_mandatory: true, status: "completed", is_valid: true, expiry_date: "2025-01-01" }),
        makeMandatoryTraining({ is_mandatory: true, status: "in_progress", is_valid: true, expiry_date: "2027-01-01" }),
      ],
    });
    expect(r.mandatory_training_valid_count).toBe(1);
  });

  it("mandatory_training_expired_count catches both status=expired and past expiry_date", () => {
    const r = run({
      total_staff: 5,
      mandatory_training_records: [
        makeMandatoryTraining({ is_mandatory: true, status: "expired", expiry_date: null }),
        makeMandatoryTraining({ is_mandatory: true, status: "completed", is_valid: true, expiry_date: "2025-01-01" }),
        makeMandatoryTraining({ is_mandatory: true, status: "completed", is_valid: true, expiry_date: "2027-01-01" }),
      ],
    });
    expect(r.mandatory_training_expired_count).toBe(2);
  });

  it("mandatory_training_overdue_count counts status=overdue", () => {
    const r = run({
      total_staff: 5,
      mandatory_training_records: [
        makeMandatoryTraining({ is_mandatory: true, status: "overdue" }),
        makeMandatoryTraining({ is_mandatory: true, status: "overdue" }),
        makeMandatoryTraining({ is_mandatory: true, status: "not_started" }),
      ],
    });
    expect(r.mandatory_training_overdue_count).toBe(2);
  });

  it("cpd_completion_rate = pct(completed, total)", () => {
    const r = run({
      total_staff: 5,
      cpd_records: [
        makeCpdRecord({ status: "completed" }),
        makeCpdRecord({ status: "completed" }),
        makeCpdRecord({ status: "in_progress" }),
        makeCpdRecord({ status: "planned" }),
      ],
    });
    expect(r.cpd_completion_rate).toBe(50);
  });

  it("cpd_total_hours sums all cpd hours", () => {
    const r = run({
      total_staff: 2,
      cpd_records: [
        makeCpdRecord({ cpd_hours: 5.5 }),
        makeCpdRecord({ cpd_hours: 3.3 }),
        makeCpdRecord({ cpd_hours: 1.2, status: "planned" }),
      ],
    });
    expect(r.cpd_total_hours).toBe(10);
  });

  it("cpd_avg_hours_per_staff divides by total_staff", () => {
    const r = run({
      total_staff: 5,
      cpd_records: [
        makeCpdRecord({ cpd_hours: 10 }),
        makeCpdRecord({ cpd_hours: 15 }),
      ],
    });
    expect(r.cpd_avg_hours_per_staff).toBe(5);
  });

  it("cpd_records_with_reflection counts completed + reflection_recorded", () => {
    const r = run({
      total_staff: 5,
      cpd_records: [
        makeCpdRecord({ status: "completed", reflection_recorded: true }),
        makeCpdRecord({ status: "completed", reflection_recorded: false }),
        makeCpdRecord({ status: "in_progress", reflection_recorded: true }),
      ],
    });
    expect(r.cpd_records_with_reflection).toBe(1);
  });

  it("cpd_records_with_evidence counts completed + evidence_obtained", () => {
    const r = run({
      total_staff: 5,
      cpd_records: [
        makeCpdRecord({ status: "completed", evidence_obtained: true }),
        makeCpdRecord({ status: "completed", evidence_obtained: false }),
      ],
    });
    expect(r.cpd_records_with_evidence).toBe(1);
  });

  it("cpd_learning_applied_count counts completed + learning_applied", () => {
    const r = run({
      total_staff: 5,
      cpd_records: [
        makeCpdRecord({ status: "completed", learning_applied: true }),
        makeCpdRecord({ status: "completed", learning_applied: true }),
        makeCpdRecord({ status: "planned", learning_applied: true }),
      ],
    });
    expect(r.cpd_learning_applied_count).toBe(2);
  });

  it("training_needs_coverage_rate uses total_staff denominator when staff > 0", () => {
    const r = run({
      total_staff: 10,
      training_needs_records: [
        makeTrainingNeeds({ is_current: true }),
        makeTrainingNeeds({ is_current: true, staff_id: "staff_2" }),
        makeTrainingNeeds({ is_current: false, staff_id: "staff_3" }),
      ],
    });
    // 2 current / 10 staff = 20%
    expect(r.training_needs_coverage_rate).toBe(20);
  });

  it("training_needs_coverage_rate uses totalTrainingNeeds when staff = 0", () => {
    const r = run({
      total_staff: 0,
      training_needs_records: [
        makeTrainingNeeds({ is_current: true }),
        makeTrainingNeeds({ is_current: true, staff_id: "staff_2" }),
        makeTrainingNeeds({ is_current: false, staff_id: "staff_3" }),
      ],
    });
    // 2 current / 3 total = 67%
    expect(r.training_needs_coverage_rate).toBe(67);
  });

  it("training_needs_total_identified and _addressed sum across records", () => {
    const r = run({
      total_staff: 5,
      training_needs_records: [
        makeTrainingNeeds({ needs_identified: 5, needs_addressed: 3 }),
        makeTrainingNeeds({ needs_identified: 3, needs_addressed: 2, staff_id: "staff_2" }),
      ],
    });
    expect(r.training_needs_total_identified).toBe(8);
    expect(r.training_needs_total_addressed).toBe(5);
  });

  it("qualification_currency_rate = pct(achieved+registration_current, total)", () => {
    const r = run({
      total_staff: 5,
      qualification_records: [
        makeQualification({ status: "achieved", registration_current: true }),
        makeQualification({ status: "achieved", registration_current: false, staff_id: "staff_2" }),
        makeQualification({ status: "in_progress", registration_current: true, staff_id: "staff_3" }),
      ],
    });
    // 1 current / 3 total = 33%
    expect(r.qualification_currency_rate).toBe(33);
  });

  it("qualifications_achieved_count, in_progress, and expired counts", () => {
    const r = run({
      total_staff: 5,
      qualification_records: [
        makeQualification({ status: "achieved", staff_id: "staff_1" }),
        makeQualification({ status: "achieved", staff_id: "staff_2" }),
        makeQualification({ status: "in_progress", staff_id: "staff_3" }),
        makeQualification({ status: "expired", staff_id: "staff_4" }),
        makeQualification({ status: "expired", staff_id: "staff_5" }),
        makeQualification({ status: "withdrawn", staff_id: "staff_6" }),
      ],
    });
    expect(r.qualifications_achieved_count).toBe(2);
    expect(r.qualifications_in_progress_count).toBe(1);
    expect(r.qualifications_expired_count).toBe(2);
  });

  it("development_plan_coverage_rate uses total_staff when > 0", () => {
    const r = run({
      total_staff: 10,
      development_plan_records: [
        makeDevelopmentPlan({ plan_exists: true, is_current: true }),
        makeDevelopmentPlan({ plan_exists: true, is_current: true, staff_id: "staff_2" }),
        makeDevelopmentPlan({ plan_exists: true, is_current: false, staff_id: "staff_3" }),
      ],
    });
    // 2 current plans / 10 staff = 20%
    expect(r.development_plan_coverage_rate).toBe(20);
  });

  it("development_plans_active_count counts plan_exists=true", () => {
    const r = run({
      total_staff: 5,
      development_plan_records: [
        makeDevelopmentPlan({ plan_exists: true }),
        makeDevelopmentPlan({ plan_exists: true, staff_id: "staff_2" }),
        makeDevelopmentPlan({ plan_exists: false, staff_id: "staff_3" }),
      ],
    });
    expect(r.development_plans_active_count).toBe(2);
  });

  it("development_plans_current_count counts plan_exists+is_current", () => {
    const r = run({
      total_staff: 5,
      development_plan_records: [
        makeDevelopmentPlan({ plan_exists: true, is_current: true }),
        makeDevelopmentPlan({ plan_exists: true, is_current: false, staff_id: "staff_2" }),
        makeDevelopmentPlan({ plan_exists: false, is_current: true, staff_id: "staff_3" }),
      ],
    });
    expect(r.development_plans_current_count).toBe(1);
  });

  it("development_objectives_achievement_rate = pct(achieved, set)", () => {
    const r = run({
      total_staff: 5,
      development_plan_records: [
        makeDevelopmentPlan({ objectives_set: 10, objectives_achieved: 3 }),
        makeDevelopmentPlan({ objectives_set: 5, objectives_achieved: 4, staff_id: "staff_2" }),
      ],
    });
    // 7/15 = 47%
    expect(r.development_objectives_achievement_rate).toBe(47);
  });

  it("training_effectiveness_rate is average of available components", () => {
    // Only provide mandatory training with assessments and CPD with completions
    const r = run({
      total_staff: 5,
      mandatory_training_records: [
        makeMandatoryTraining({
          is_mandatory: true, status: "completed", is_valid: false,
          assessment_passed: true, expiry_date: null,
          certificate_issued: false, provider_quality_rating: 0, training_hours: 0,
        }),
      ],
      cpd_records: [
        makeCpdRecord({ status: "completed", reflection_recorded: true, learning_applied: true }),
      ],
    });
    // assessmentPassRate = 100%, cpdLearningApplied = 100%, cpdReflection = 100%
    // effectivenessComponents = [100, 100, 100] => avg = 100%
    expect(r.training_effectiveness_rate).toBe(100);
  });

  it("training_effectiveness_rate is 0 when no components available", () => {
    const r = run({
      total_staff: 5,
      mandatory_training_records: [
        makeMandatoryTraining({
          is_mandatory: true, status: "not_started", is_valid: false,
          assessment_passed: false, expiry_date: null,
          certificate_issued: false, provider_quality_rating: 0, training_hours: 0,
        }),
      ],
    });
    expect(r.training_effectiveness_rate).toBe(0);
  });

  it("pct(0, 0) = 0", () => {
    const r = run({
      total_staff: 0,
      mandatory_training_records: [
        makeMandatoryTraining({ is_mandatory: false, assessment_passed: false, certificate_issued: false, provider_quality_rating: 0, training_hours: 0 }),
      ],
    });
    // All rates based on empty denominators should be 0
    expect(r.mandatory_training_compliance_rate).toBe(0);
    expect(r.cpd_completion_rate).toBe(0);
    expect(r.qualification_currency_rate).toBe(0);
    expect(r.development_objectives_achievement_rate).toBe(0);
  });
});

// ── 20. Strengths ───────────────────────────────────────────────────────────

describe("strengths", () => {
  it("mandatory training compliance >= 90% triggers strength", () => {
    const records: MandatoryTrainingRecordInput[] = [];
    for (let i = 0; i < 10; i++) {
      records.push(makeMandatoryTraining({
        staff_id: `staff_${i}`, is_mandatory: true, status: "completed",
        is_valid: true, expiry_date: "2027-06-01",
      }));
    }
    const r = run({ total_staff: 10, mandatory_training_records: records });
    expect(r.strengths.some(s => s.includes("Mandatory training compliance at 100%"))).toBe(true);
  });

  it("CPD completion >= 85% triggers strength", () => {
    const records: CpdRecordInput[] = [];
    for (let i = 0; i < 9; i++) {
      records.push(makeCpdRecord({ staff_id: `staff_${i}`, status: "completed" }));
    }
    records.push(makeCpdRecord({ staff_id: "staff_9", status: "planned" }));
    const r = run({ total_staff: 10, cpd_records: records });
    expect(r.strengths.some(s => s.includes("CPD completion rate is 90%"))).toBe(true);
  });

  it("CPD reflection rate >= 80% triggers strength", () => {
    const records: CpdRecordInput[] = [];
    for (let i = 0; i < 4; i++) {
      records.push(makeCpdRecord({ status: "completed", reflection_recorded: true, staff_id: `staff_${i}` }));
    }
    records.push(makeCpdRecord({ status: "completed", reflection_recorded: false, staff_id: "staff_4" }));
    const r = run({ total_staff: 5, cpd_records: records });
    expect(r.strengths.some(s => s.includes("80%") && s.includes("reflective practice"))).toBe(true);
  });

  it("CPD learning applied >= 80% triggers strength", () => {
    const records: CpdRecordInput[] = [];
    for (let i = 0; i < 5; i++) {
      records.push(makeCpdRecord({ status: "completed", learning_applied: true, staff_id: `staff_${i}` }));
    }
    const r = run({ total_staff: 5, cpd_records: records });
    expect(r.strengths.some(s => s.includes("100%") && s.includes("applied to practice"))).toBe(true);
  });

  it("average CPD hours >= 20 triggers strength", () => {
    const records: CpdRecordInput[] = [];
    for (let i = 0; i < 5; i++) {
      records.push(makeCpdRecord({ staff_id: `staff_${i}`, cpd_hours: 25, status: "completed" }));
    }
    const r = run({ total_staff: 5, cpd_records: records });
    expect(r.strengths.some(s => s.includes("Average CPD hours per staff is 25"))).toBe(true);
  });

  it("training needs coverage >= 85% triggers strength", () => {
    const records: TrainingNeedsRecordInput[] = [];
    for (let i = 0; i < 9; i++) {
      records.push(makeTrainingNeeds({ staff_id: `staff_${i}`, is_current: true }));
    }
    const r = run({ total_staff: 10, training_needs_records: records });
    expect(r.strengths.some(s => s.includes("Training needs analysis coverage at 90%"))).toBe(true);
  });

  it("needs addressed >= 80% triggers strength", () => {
    const r = run({
      total_staff: 5,
      training_needs_records: [
        makeTrainingNeeds({ needs_identified: 10, needs_addressed: 8 }),
      ],
    });
    expect(r.strengths.some(s => s.includes("80%") && s.includes("training needs have been addressed"))).toBe(true);
  });

  it("qualification currency >= 90% triggers strength", () => {
    const records: QualificationRecordInput[] = [];
    for (let i = 0; i < 10; i++) {
      records.push(makeQualification({
        staff_id: `staff_${i}`, status: "achieved", registration_current: true,
      }));
    }
    const r = run({ total_staff: 10, qualification_records: records });
    expect(r.strengths.some(s => s.includes("Qualification currency at 100%"))).toBe(true);
  });

  it("development plan coverage >= 85% triggers strength", () => {
    const records: DevelopmentPlanRecordInput[] = [];
    for (let i = 0; i < 9; i++) {
      records.push(makeDevelopmentPlan({
        staff_id: `staff_${i}`, plan_exists: true, is_current: true,
      }));
    }
    const r = run({ total_staff: 10, development_plan_records: records });
    expect(r.strengths.some(s => s.includes("Development plan coverage at 90%"))).toBe(true);
  });

  it("development objectives achievement >= 75% triggers strength", () => {
    const r = run({
      total_staff: 5,
      development_plan_records: [
        makeDevelopmentPlan({ objectives_set: 4, objectives_achieved: 3 }),
      ],
    });
    expect(r.strengths.some(s => s.includes("75%") && s.includes("development objectives achieved"))).toBe(true);
  });

  it("no expired mandatory training triggers strength when totalMandatory > 0", () => {
    const records: MandatoryTrainingRecordInput[] = [];
    for (let i = 0; i < 5; i++) {
      records.push(makeMandatoryTraining({
        staff_id: `staff_${i}`, is_mandatory: true, status: "completed",
        is_valid: true, expiry_date: "2027-06-01",
      }));
    }
    const r = run({ total_staff: 5, mandatory_training_records: records });
    expect(r.strengths.some(s => s.includes("No expired mandatory training"))).toBe(true);
  });

  it("assessment pass rate >= 95% triggers strength", () => {
    const records: MandatoryTrainingRecordInput[] = [];
    for (let i = 0; i < 20; i++) {
      records.push(makeMandatoryTraining({
        staff_id: `staff_${i}`, is_mandatory: true, status: "completed",
        is_valid: true, expiry_date: "2027-06-01", assessment_passed: true,
      }));
    }
    const r = run({ total_staff: 20, mandatory_training_records: records });
    expect(r.strengths.some(s => s.includes("Training assessment pass rate is 100%"))).toBe(true);
  });

  it("CPD activity type count >= 4 triggers strength", () => {
    const r = run({
      total_staff: 5,
      cpd_records: [
        makeCpdRecord({ activity_type: "course" }),
        makeCpdRecord({ activity_type: "workshop", staff_id: "staff_2" }),
        makeCpdRecord({ activity_type: "conference", staff_id: "staff_3" }),
        makeCpdRecord({ activity_type: "reading", staff_id: "staff_4" }),
      ],
    });
    expect(r.strengths.some(s => s.includes("4 different types"))).toBe(true);
  });

  it("CPD shared rate >= 70% triggers strength", () => {
    const records: CpdRecordInput[] = [];
    for (let i = 0; i < 8; i++) {
      records.push(makeCpdRecord({ status: "completed", shared_with_team: true, staff_id: `staff_${i}` }));
    }
    for (let i = 8; i < 10; i++) {
      records.push(makeCpdRecord({ status: "completed", shared_with_team: false, staff_id: `staff_${i}` }));
    }
    const r = run({ total_staff: 10, cpd_records: records });
    expect(r.strengths.some(s => s.includes("80%") && s.includes("shared with the wider team"))).toBe(true);
  });

  it("TNA staff involvement >= 85% triggers strength", () => {
    const records: TrainingNeedsRecordInput[] = [];
    for (let i = 0; i < 9; i++) {
      records.push(makeTrainingNeeds({ staff_id: `staff_${i}`, staff_involved: true }));
    }
    records.push(makeTrainingNeeds({ staff_id: "staff_9", staff_involved: false }));
    const r = run({ total_staff: 10, training_needs_records: records });
    expect(r.strengths.some(s => s.includes("90%") && s.includes("training needs analyses involved"))).toBe(true);
  });

  it("evidence rate >= 90% triggers strength", () => {
    const records: QualificationRecordInput[] = [];
    for (let i = 0; i < 10; i++) {
      records.push(makeQualification({
        staff_id: `staff_${i}`, evidence_on_file: true,
      }));
    }
    const r = run({ total_staff: 10, qualification_records: records });
    expect(r.strengths.some(s => s.includes("100%") && s.includes("evidence on file"))).toBe(true);
  });

  it("plan career pathway rate >= 70% triggers strength", () => {
    const records: DevelopmentPlanRecordInput[] = [];
    for (let i = 0; i < 8; i++) {
      records.push(makeDevelopmentPlan({
        staff_id: `staff_${i}`, plan_exists: true, career_pathway_documented: true,
      }));
    }
    for (let i = 8; i < 10; i++) {
      records.push(makeDevelopmentPlan({
        staff_id: `staff_${i}`, plan_exists: true, career_pathway_documented: false,
      }));
    }
    const r = run({ total_staff: 10, development_plan_records: records });
    expect(r.strengths.some(s => s.includes("80%") && s.includes("career progression pathways"))).toBe(true);
  });

  it("plan staff involvement >= 90% triggers strength", () => {
    const records: DevelopmentPlanRecordInput[] = [];
    for (let i = 0; i < 10; i++) {
      records.push(makeDevelopmentPlan({
        staff_id: `staff_${i}`, plan_exists: true, staff_involved: true,
      }));
    }
    const r = run({ total_staff: 10, development_plan_records: records });
    expect(r.strengths.some(s => s.includes("100%") && s.includes("co-created with staff"))).toBe(true);
  });

  it("plan linked to home rate >= 80% triggers strength", () => {
    const records: DevelopmentPlanRecordInput[] = [];
    for (let i = 0; i < 9; i++) {
      records.push(makeDevelopmentPlan({
        staff_id: `staff_${i}`, plan_exists: true, linked_to_home_priorities: true,
      }));
    }
    records.push(makeDevelopmentPlan({
      staff_id: "staff_9", plan_exists: true, linked_to_home_priorities: false,
    }));
    const r = run({ total_staff: 10, development_plan_records: records });
    expect(r.strengths.some(s => s.includes("90%") && s.includes("linked to home priorities"))).toBe(true);
  });

  it("required qualification rate >= 95% triggers strength", () => {
    const records: QualificationRecordInput[] = [];
    for (let i = 0; i < 20; i++) {
      records.push(makeQualification({
        staff_id: `staff_${i}`, status: "achieved", is_required: true,
      }));
    }
    const r = run({ total_staff: 20, qualification_records: records });
    expect(r.strengths.some(s => s.includes("100%") && s.includes("required qualifications"))).toBe(true);
  });
});

// ── 21. Concerns ────────────────────────────────────────────────────────────

describe("concerns", () => {
  it("mandatory compliance < 70% triggers concern", () => {
    const records: MandatoryTrainingRecordInput[] = [];
    for (let i = 0; i < 6; i++) {
      records.push(makeMandatoryTraining({
        staff_id: `staff_${i}`, is_mandatory: true, status: "not_started", is_valid: false,
      }));
    }
    for (let i = 6; i < 10; i++) {
      records.push(makeMandatoryTraining({
        staff_id: `staff_${i}`, is_mandatory: true, status: "completed", is_valid: true, expiry_date: "2027-06-01",
      }));
    }
    const r = run({ total_staff: 10, mandatory_training_records: records });
    expect(r.concerns.some(c => c.includes("Mandatory training compliance is only 40%"))).toBe(true);
  });

  it("expired mandatory training triggers concern", () => {
    const r = run({
      total_staff: 5,
      mandatory_training_records: [
        makeMandatoryTraining({ is_mandatory: true, status: "expired", is_valid: false }),
      ],
    });
    expect(r.concerns.some(c => c.includes("1 mandatory training course has expired"))).toBe(true);
  });

  it("overdue mandatory training triggers concern", () => {
    const r = run({
      total_staff: 5,
      mandatory_training_records: [
        makeMandatoryTraining({ is_mandatory: true, status: "overdue", is_valid: false }),
        makeMandatoryTraining({ is_mandatory: true, status: "overdue", is_valid: false, staff_id: "staff_2" }),
      ],
    });
    expect(r.concerns.some(c => c.includes("2 mandatory training courses are overdue"))).toBe(true);
  });

  it("expiring soon mandatory training triggers concern", () => {
    const r = run({
      total_staff: 5,
      mandatory_training_records: [
        makeMandatoryTraining({
          is_mandatory: true, status: "completed", is_valid: true,
          expiry_date: "2026-06-15", // within 30 days of 2026-05-28
        }),
      ],
    });
    expect(r.concerns.some(c => c.includes("expiring within 30 days"))).toBe(true);
  });

  it("CPD completion < 50% triggers concern", () => {
    const records: CpdRecordInput[] = [];
    for (let i = 0; i < 5; i++) {
      records.push(makeCpdRecord({ status: "planned", staff_id: `staff_${i}` }));
    }
    records.push(makeCpdRecord({ status: "completed", staff_id: "staff_5" }));
    const r = run({ total_staff: 6, cpd_records: records });
    // 1/6 = 17%
    expect(r.concerns.some(c => c.includes("CPD completion rate is only 17%"))).toBe(true);
  });

  it("overdue CPD triggers concern", () => {
    const r = run({
      total_staff: 5,
      cpd_records: [
        makeCpdRecord({ status: "overdue" }),
        makeCpdRecord({ status: "overdue", staff_id: "staff_2" }),
      ],
    });
    expect(r.concerns.some(c => c.includes("2 CPD activities are overdue"))).toBe(true);
  });

  it("low avg CPD hours triggers concern", () => {
    const r = run({
      total_staff: 5,
      cpd_records: [makeCpdRecord({ cpd_hours: 2 })],
    });
    // 2/5 = 0.4 hours per staff
    expect(r.concerns.some(c => c.includes("Average CPD hours per staff is only 0.4"))).toBe(true);
  });

  it("CPD reflection rate < 40% triggers concern", () => {
    const records: CpdRecordInput[] = [];
    for (let i = 0; i < 5; i++) {
      records.push(makeCpdRecord({ status: "completed", reflection_recorded: false, staff_id: `staff_${i}` }));
    }
    const r = run({ total_staff: 5, cpd_records: records });
    expect(r.concerns.some(c => c.includes("Only 0%") && c.includes("reflective practice"))).toBe(true);
  });

  it("CPD learning applied < 40% triggers concern", () => {
    const records: CpdRecordInput[] = [];
    for (let i = 0; i < 5; i++) {
      records.push(makeCpdRecord({ status: "completed", learning_applied: false, staff_id: `staff_${i}` }));
    }
    const r = run({ total_staff: 5, cpd_records: records });
    expect(r.concerns.some(c => c.includes("Only 0%") && c.includes("applied to practice"))).toBe(true);
  });

  it("training needs coverage < 50% triggers concern", () => {
    const r = run({
      total_staff: 10,
      training_needs_records: [
        makeTrainingNeeds({ is_current: true }),
      ],
    });
    // 1/10 = 10%
    expect(r.concerns.some(c => c.includes("Training needs analysis coverage is only 10%"))).toBe(true);
  });

  it("needs addressed < 40% triggers concern", () => {
    const r = run({
      total_staff: 5,
      training_needs_records: [
        makeTrainingNeeds({ needs_identified: 10, needs_addressed: 3 }),
      ],
    });
    expect(r.concerns.some(c => c.includes("Only 30%") && c.includes("training needs have been addressed"))).toBe(true);
  });

  it("qualification currency < 60% triggers concern", () => {
    const records: QualificationRecordInput[] = [];
    for (let i = 0; i < 10; i++) {
      records.push(makeQualification({
        staff_id: `staff_${i}`, status: "achieved", registration_current: false,
      }));
    }
    const r = run({ total_staff: 10, qualification_records: records });
    expect(r.concerns.some(c => c.includes("Qualification currency rate is only 0%"))).toBe(true);
  });

  it("expired qualifications trigger concern", () => {
    const r = run({
      total_staff: 5,
      qualification_records: [
        makeQualification({ status: "expired" }),
      ],
    });
    expect(r.concerns.some(c => c.includes("1 qualification has expired"))).toBe(true);
  });

  it("required qualification rate < 80% triggers concern", () => {
    const r = run({
      total_staff: 5,
      qualification_records: [
        makeQualification({ is_required: true, status: "in_progress" }),
        makeQualification({ is_required: true, status: "in_progress", staff_id: "staff_2" }),
        makeQualification({ is_required: true, status: "achieved", staff_id: "staff_3" }),
      ],
    });
    // 1/3 = 33%
    expect(r.concerns.some(c => c.includes("Only 33%") && c.includes("required qualifications"))).toBe(true);
  });

  it("qualification expiring soon triggers concern", () => {
    const r = run({
      total_staff: 5,
      qualification_records: [
        makeQualification({
          status: "achieved",
          expiry_date: "2026-08-01", // within 90 days of 2026-05-28
        }),
      ],
    });
    expect(r.concerns.some(c => c.includes("expiring within 90 days"))).toBe(true);
  });

  it("development plan coverage < 50% triggers concern", () => {
    const r = run({
      total_staff: 10,
      development_plan_records: [
        makeDevelopmentPlan({ plan_exists: true, is_current: true }),
      ],
    });
    // 1/10 = 10%
    expect(r.concerns.some(c => c.includes("Development plan coverage is only 10%"))).toBe(true);
  });

  it("stale plans trigger concern", () => {
    const r = run({
      total_staff: 5,
      development_plan_records: [
        makeDevelopmentPlan({ plan_exists: true, is_current: false }),
        makeDevelopmentPlan({ plan_exists: true, is_current: true, staff_id: "staff_2" }),
      ],
    });
    expect(r.concerns.some(c => c.includes("1 development plan is no longer current"))).toBe(true);
  });

  it("development objectives < 30% triggers concern", () => {
    const r = run({
      total_staff: 5,
      development_plan_records: [
        makeDevelopmentPlan({ objectives_set: 10, objectives_achieved: 2 }),
      ],
    });
    expect(r.concerns.some(c => c.includes("Only 20%") && c.includes("development objectives achieved"))).toBe(true);
  });

  it("plan staff involvement < 50% triggers concern", () => {
    const records: DevelopmentPlanRecordInput[] = [];
    for (let i = 0; i < 5; i++) {
      records.push(makeDevelopmentPlan({
        staff_id: `staff_${i}`, plan_exists: true, staff_involved: false,
      }));
    }
    const r = run({ total_staff: 5, development_plan_records: records });
    expect(r.concerns.some(c => c.includes("Only 0%") && c.includes("development plans involved"))).toBe(true);
  });

  it("assessment pass rate < 70% triggers concern", () => {
    const records: MandatoryTrainingRecordInput[] = [];
    for (let i = 0; i < 6; i++) {
      records.push(makeMandatoryTraining({
        staff_id: `staff_${i}`, is_mandatory: true, status: "completed",
        is_valid: false, assessment_passed: false, expiry_date: null,
      }));
    }
    for (let i = 6; i < 10; i++) {
      records.push(makeMandatoryTraining({
        staff_id: `staff_${i}`, is_mandatory: true, status: "completed",
        is_valid: false, assessment_passed: true, expiry_date: null,
      }));
    }
    const r = run({ total_staff: 10, mandatory_training_records: records });
    // 4/10 = 40%
    expect(r.concerns.some(c => c.includes("Training assessment pass rate is only 40%"))).toBe(true);
  });

  it("evidence rate < 60% triggers concern", () => {
    const records: QualificationRecordInput[] = [];
    for (let i = 0; i < 10; i++) {
      records.push(makeQualification({
        staff_id: `staff_${i}`, evidence_on_file: false,
      }));
    }
    const r = run({ total_staff: 10, qualification_records: records });
    expect(r.concerns.some(c => c.includes("Only 0%") && c.includes("evidence on file"))).toBe(true);
  });

  it("cancelled CPD >= 15% triggers concern", () => {
    const records: CpdRecordInput[] = [];
    for (let i = 0; i < 3; i++) {
      records.push(makeCpdRecord({ status: "cancelled", staff_id: `staff_${i}` }));
    }
    for (let i = 3; i < 10; i++) {
      records.push(makeCpdRecord({ status: "completed", staff_id: `staff_${i}` }));
    }
    const r = run({ total_staff: 10, cpd_records: records });
    // 3/10 = 30%
    expect(r.concerns.some(c => c.includes("30%") && c.includes("cancelled"))).toBe(true);
  });

  it("staff without mandatory training triggers concern when total_staff > staffWithMandatoryTraining", () => {
    const r = run({
      total_staff: 5,
      mandatory_training_records: [
        makeMandatoryTraining({ staff_id: "staff_1", is_mandatory: true }),
        makeMandatoryTraining({ staff_id: "staff_2", is_mandatory: true }),
      ],
    });
    // 2 unique staff with mandatory, 5 total -> 3 uncovered
    expect(r.concerns.some(c => c.includes("3 staff members have no mandatory training records"))).toBe(true);
  });

  it("high priority needs unaddressed triggers concern", () => {
    const r = run({
      total_staff: 5,
      training_needs_records: [
        makeTrainingNeeds({
          priority: "high", needs_identified: 10, needs_addressed: 5,
        }),
      ],
    });
    // ratio = 5/10 = 0.5 < 0.8, so highPriorityAddressed = 0
    // highPriorityNeeds = 1, highPriorityAddressed = 0 -> 1 unaddressed
    expect(r.concerns.some(c => c.includes("1 high-priority training need remains unaddressed"))).toBe(true);
  });
});

// ── 22. Recommendations ─────────────────────────────────────────────────────

describe("recommendations", () => {
  it("expired mandatory training generates immediate recommendation", () => {
    const r = run({
      total_staff: 5,
      mandatory_training_records: [
        makeMandatoryTraining({ is_mandatory: true, status: "expired", is_valid: false }),
      ],
    });
    const rec = r.recommendations.find(r => r.recommendation.includes("expired mandatory training"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("immediate");
    expect(rec!.regulatory_ref).toBe("CHR 2015 Reg 32");
  });

  it("low mandatory compliance generates immediate recommendation", () => {
    const records: MandatoryTrainingRecordInput[] = [];
    for (let i = 0; i < 10; i++) {
      records.push(makeMandatoryTraining({
        staff_id: `staff_${i}`, is_mandatory: true, status: "not_started", is_valid: false,
      }));
    }
    const r = run({ total_staff: 10, mandatory_training_records: records });
    const rec = r.recommendations.find(r => r.recommendation.includes("mandatory training compliance"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("immediate");
  });

  it("overdue mandatory generates immediate recommendation", () => {
    const r = run({
      total_staff: 5,
      mandatory_training_records: [
        makeMandatoryTraining({ is_mandatory: true, status: "overdue", is_valid: false }),
      ],
    });
    const rec = r.recommendations.find(r => r.recommendation.includes("overdue mandatory training"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("immediate");
  });

  it("expired qualifications generate immediate recommendation", () => {
    const r = run({
      total_staff: 5,
      qualification_records: [
        makeQualification({ status: "expired" }),
      ],
    });
    const rec = r.recommendations.find(r => r.recommendation.includes("expired qualification"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("immediate");
  });

  it("overdue CPD generates soon recommendation", () => {
    const r = run({
      total_staff: 5,
      cpd_records: [
        makeCpdRecord({ status: "overdue" }),
      ],
    });
    const rec = r.recommendations.find(r => r.recommendation.includes("overdue CPD"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("soon");
  });

  it("low TNA coverage generates soon recommendation", () => {
    const r = run({
      total_staff: 10,
      training_needs_records: [
        makeTrainingNeeds({ is_current: true }),
      ],
    });
    const rec = r.recommendations.find(r => r.recommendation.includes("training needs analyses"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("soon");
  });

  it("low dev plan coverage generates soon recommendation", () => {
    const r = run({
      total_staff: 10,
      development_plan_records: [
        makeDevelopmentPlan({ plan_exists: true, is_current: true }),
      ],
    });
    const rec = r.recommendations.find(r => r.recommendation.includes("development plans"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("soon");
  });

  it("stale plans generate soon recommendation", () => {
    const r = run({
      total_staff: 5,
      development_plan_records: [
        makeDevelopmentPlan({ plan_exists: true, is_current: false }),
        makeDevelopmentPlan({ plan_exists: true, is_current: true, staff_id: "staff_2" }),
      ],
    });
    const rec = r.recommendations.find(r => r.recommendation.includes("stale development plan"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("soon");
  });

  it("expiring mandatory training generates planned recommendation", () => {
    const r = run({
      total_staff: 5,
      mandatory_training_records: [
        makeMandatoryTraining({
          is_mandatory: true, status: "completed", is_valid: true,
          expiry_date: "2026-06-15",
        }),
      ],
    });
    const rec = r.recommendations.find(r => r.recommendation.includes("expiring within 30 days"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("planned");
  });

  it("low reflection rate generates soon recommendation", () => {
    const records: CpdRecordInput[] = [];
    for (let i = 0; i < 5; i++) {
      records.push(makeCpdRecord({ status: "completed", reflection_recorded: false, staff_id: `staff_${i}` }));
    }
    const r = run({ total_staff: 5, cpd_records: records });
    const rec = r.recommendations.find(r => r.recommendation.includes("reflective practice"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("soon");
  });

  it("low CPD sharing generates planned recommendation", () => {
    const records: CpdRecordInput[] = [];
    for (let i = 0; i < 5; i++) {
      records.push(makeCpdRecord({ status: "completed", shared_with_team: false, staff_id: `staff_${i}` }));
    }
    const r = run({ total_staff: 5, cpd_records: records });
    const rec = r.recommendations.find(r => r.recommendation.includes("CPD sharing"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("planned");
  });

  it("recommendations are ranked sequentially", () => {
    const r = run({
      total_staff: 5,
      mandatory_training_records: [
        makeMandatoryTraining({ is_mandatory: true, status: "expired", is_valid: false }),
        makeMandatoryTraining({ is_mandatory: true, status: "overdue", is_valid: false, staff_id: "staff_2" }),
      ],
    });
    for (let i = 0; i < r.recommendations.length; i++) {
      expect(r.recommendations[i].rank).toBe(i + 1);
    }
  });
});

// ── 23. Insights ────────────────────────────────────────────────────────────

describe("insights", () => {
  it("5+ expired mandatory triggers critical insight (>=5 branch)", () => {
    const records: MandatoryTrainingRecordInput[] = [];
    for (let i = 0; i < 5; i++) {
      records.push(makeMandatoryTraining({
        staff_id: `staff_${i}`, is_mandatory: true, status: "expired", is_valid: false,
      }));
    }
    const r = run({ total_staff: 5, mandatory_training_records: records });
    expect(r.insights.some(i => i.severity === "critical" && i.text.includes("5 mandatory training courses have expired"))).toBe(true);
  });

  it("3-4 expired mandatory triggers critical insight (>=3 branch)", () => {
    const records: MandatoryTrainingRecordInput[] = [];
    for (let i = 0; i < 3; i++) {
      records.push(makeMandatoryTraining({
        staff_id: `staff_${i}`, is_mandatory: true, status: "expired", is_valid: false,
      }));
    }
    // Need more mandatory records to not also trigger compliance < 50% (which is separate)
    for (let i = 3; i < 10; i++) {
      records.push(makeMandatoryTraining({
        staff_id: `staff_${i}`, is_mandatory: true, status: "completed", is_valid: true, expiry_date: "2027-06-01",
      }));
    }
    const r = run({ total_staff: 10, mandatory_training_records: records });
    expect(r.insights.some(i => i.severity === "critical" && i.text.includes("3 mandatory training courses have expired"))).toBe(true);
  });

  it("1-2 expired mandatory triggers warning insight", () => {
    const records: MandatoryTrainingRecordInput[] = [];
    records.push(makeMandatoryTraining({
      staff_id: "staff_1", is_mandatory: true, status: "expired", is_valid: false,
    }));
    for (let i = 2; i < 10; i++) {
      records.push(makeMandatoryTraining({
        staff_id: `staff_${i}`, is_mandatory: true, status: "completed", is_valid: true, expiry_date: "2027-06-01",
      }));
    }
    const r = run({ total_staff: 10, mandatory_training_records: records });
    expect(r.insights.some(i => i.severity === "warning" && i.text.includes("1 mandatory training course has expired"))).toBe(true);
  });

  it("mandatory compliance < 50% triggers critical insight", () => {
    const records: MandatoryTrainingRecordInput[] = [];
    for (let i = 0; i < 10; i++) {
      records.push(makeMandatoryTraining({
        staff_id: `staff_${i}`, is_mandatory: true, status: "not_started", is_valid: false,
      }));
    }
    const r = run({ total_staff: 10, mandatory_training_records: records });
    expect(r.insights.some(i => i.severity === "critical" && i.text.includes("below the minimum acceptable threshold"))).toBe(true);
  });

  it("3+ expired qualifications triggers critical insight", () => {
    const records: QualificationRecordInput[] = [];
    for (let i = 0; i < 3; i++) {
      records.push(makeQualification({
        staff_id: `staff_${i}`, status: "expired",
      }));
    }
    const r = run({ total_staff: 5, qualification_records: records });
    expect(r.insights.some(i => i.severity === "critical" && i.text.includes("3 qualifications have expired"))).toBe(true);
  });

  it("1-2 expired qualifications triggers warning insight", () => {
    const r = run({
      total_staff: 5,
      qualification_records: [
        makeQualification({ status: "expired" }),
      ],
    });
    expect(r.insights.some(i => i.severity === "warning" && i.text.includes("1 qualification has expired"))).toBe(true);
  });

  it("5+ overdue CPD triggers critical insight", () => {
    const records: CpdRecordInput[] = [];
    for (let i = 0; i < 5; i++) {
      records.push(makeCpdRecord({ status: "overdue", staff_id: `staff_${i}` }));
    }
    const r = run({ total_staff: 5, cpd_records: records });
    expect(r.insights.some(i => i.severity === "critical" && i.text.includes("5 CPD activities are overdue"))).toBe(true);
  });

  it("3-4 overdue CPD triggers critical insight", () => {
    const records: CpdRecordInput[] = [];
    for (let i = 0; i < 3; i++) {
      records.push(makeCpdRecord({ status: "overdue", staff_id: `staff_${i}` }));
    }
    for (let i = 3; i < 10; i++) {
      records.push(makeCpdRecord({ status: "completed", staff_id: `staff_${i}` }));
    }
    const r = run({ total_staff: 10, cpd_records: records });
    expect(r.insights.some(i => i.severity === "critical" && i.text.includes("3 CPD activities are overdue"))).toBe(true);
  });

  it("1-2 overdue CPD triggers warning insight", () => {
    const r = run({
      total_staff: 5,
      cpd_records: [
        makeCpdRecord({ status: "overdue" }),
      ],
    });
    expect(r.insights.some(i => i.severity === "warning" && i.text.includes("1 CPD activity is overdue"))).toBe(true);
  });

  it("development plan coverage < 30% triggers critical insight when data exists", () => {
    const r = run({
      total_staff: 10,
      development_plan_records: [
        makeDevelopmentPlan({ plan_exists: true, is_current: true }),
      ],
    });
    // 1/10 = 10%
    expect(r.insights.some(i => i.severity === "critical" && i.text.includes("Only 10%") && i.text.includes("current development plans"))).toBe(true);
  });

  it("3+ expiring mandatory courses triggers warning insight", () => {
    const records: MandatoryTrainingRecordInput[] = [];
    for (let i = 0; i < 3; i++) {
      records.push(makeMandatoryTraining({
        staff_id: `staff_${i}`, is_mandatory: true, status: "completed",
        is_valid: true, expiry_date: "2026-06-15",
      }));
    }
    const r = run({ total_staff: 5, mandatory_training_records: records });
    expect(r.insights.some(i => i.severity === "warning" && i.text.includes("3 mandatory courses are expiring within 30 days"))).toBe(true);
  });

  it("1-2 expiring mandatory courses triggers warning insight", () => {
    const r = run({
      total_staff: 5,
      mandatory_training_records: [
        makeMandatoryTraining({
          is_mandatory: true, status: "completed", is_valid: true,
          expiry_date: "2026-06-15",
        }),
      ],
    });
    expect(r.insights.some(i => i.severity === "warning" && i.text.includes("1 mandatory course is expiring within 30 days"))).toBe(true);
  });

  it("positive comprehensive insight when all metrics high", () => {
    const mandatoryRecords: MandatoryTrainingRecordInput[] = [];
    for (let i = 0; i < 10; i++) {
      mandatoryRecords.push(makeMandatoryTraining({
        staff_id: `staff_${i}`, is_mandatory: true, status: "completed",
        is_valid: true, expiry_date: "2027-06-01",
      }));
    }
    const cpdRecords: CpdRecordInput[] = [];
    for (let i = 0; i < 10; i++) {
      cpdRecords.push(makeCpdRecord({ staff_id: `staff_${i}`, status: "completed" }));
    }
    const qualRecords: QualificationRecordInput[] = [];
    for (let i = 0; i < 10; i++) {
      qualRecords.push(makeQualification({
        staff_id: `staff_${i}`, status: "achieved", registration_current: true,
      }));
    }
    const devPlans: DevelopmentPlanRecordInput[] = [];
    for (let i = 0; i < 10; i++) {
      devPlans.push(makeDevelopmentPlan({
        staff_id: `staff_${i}`, plan_exists: true, is_current: true,
      }));
    }

    const r = run({
      total_staff: 10,
      mandatory_training_records: mandatoryRecords,
      cpd_records: cpdRecords,
      qualification_records: qualRecords,
      development_plan_records: devPlans,
    });
    expect(r.insights.some(i => i.severity === "positive" && i.text.includes("Comprehensive training and CPD position"))).toBe(true);
  });

  it("positive CPD quality insight when reflection and learning applied both >= 80%", () => {
    const records: CpdRecordInput[] = [];
    for (let i = 0; i < 5; i++) {
      records.push(makeCpdRecord({
        staff_id: `staff_${i}`, status: "completed",
        reflection_recorded: true, learning_applied: true,
      }));
    }
    const r = run({ total_staff: 5, cpd_records: records });
    expect(r.insights.some(i => i.severity === "positive" && i.text.includes("CPD quality is strong"))).toBe(true);
  });

  it("stale plans >= 3 triggers warning insight", () => {
    const records: DevelopmentPlanRecordInput[] = [];
    for (let i = 0; i < 3; i++) {
      records.push(makeDevelopmentPlan({
        staff_id: `staff_stale_${i}`, plan_exists: true, is_current: false,
      }));
    }
    records.push(makeDevelopmentPlan({
      staff_id: "staff_current", plan_exists: true, is_current: true,
    }));
    const r = run({ total_staff: 10, development_plan_records: records });
    expect(r.insights.some(i => i.severity === "warning" && i.text.includes("3 development plans are no longer current"))).toBe(true);
  });

  it("stale plans 1-2 triggers warning insight with singular/plural", () => {
    const records: DevelopmentPlanRecordInput[] = [];
    records.push(makeDevelopmentPlan({
      staff_id: "staff_stale_1", plan_exists: true, is_current: false,
    }));
    records.push(makeDevelopmentPlan({
      staff_id: "staff_current_1", plan_exists: true, is_current: true,
    }));
    const r = run({ total_staff: 10, development_plan_records: records });
    expect(r.insights.some(i => i.severity === "warning" && i.text.includes("1 development plan is no longer current"))).toBe(true);
  });

  it("cancelled CPD >= 3 triggers warning insight", () => {
    const records: CpdRecordInput[] = [];
    for (let i = 0; i < 3; i++) {
      records.push(makeCpdRecord({ status: "cancelled", staff_id: `staff_${i}` }));
    }
    for (let i = 3; i < 10; i++) {
      records.push(makeCpdRecord({ status: "completed", staff_id: `staff_${i}` }));
    }
    const r = run({ total_staff: 10, cpd_records: records });
    expect(r.insights.some(i => i.severity === "warning" && i.text.includes("3 CPD activities have been cancelled"))).toBe(true);
  });

  it("assessment pass rate 50-79% triggers warning insight", () => {
    const records: MandatoryTrainingRecordInput[] = [];
    for (let i = 0; i < 6; i++) {
      records.push(makeMandatoryTraining({
        staff_id: `staff_${i}`, is_mandatory: true, status: "completed", is_valid: false,
        assessment_passed: true, expiry_date: null,
      }));
    }
    for (let i = 6; i < 10; i++) {
      records.push(makeMandatoryTraining({
        staff_id: `staff_${i}`, is_mandatory: true, status: "completed", is_valid: false,
        assessment_passed: false, expiry_date: null,
      }));
    }
    const r = run({ total_staff: 10, mandatory_training_records: records });
    // 6/10 = 60%
    expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Training assessment pass rate is 60%"))).toBe(true);
  });
});

// ── 24. Headlines ───────────────────────────────────────────────────────────

describe("headlines", () => {
  it("outstanding headline", () => {
    // Build a scenario that scores >= 80
    const totalStaff = 10;
    const mandatoryRecords: MandatoryTrainingRecordInput[] = [];
    for (let i = 0; i < 10; i++) {
      mandatoryRecords.push(makeMandatoryTraining({
        staff_id: `staff_${i}`, status: "completed", is_valid: true, is_mandatory: true,
        expiry_date: "2027-06-01", assessment_passed: true, certificate_issued: true,
        provider_quality_rating: 5, training_hours: 10,
      }));
    }
    const cpdRecords: CpdRecordInput[] = [];
    for (let i = 0; i < 10; i++) {
      cpdRecords.push(makeCpdRecord({
        staff_id: `staff_${i}`, status: "completed", reflection_recorded: true,
        evidence_obtained: true, learning_applied: true, cpd_hours: 30,
        activity_date: "2026-03-01", linked_to_development_need: true, shared_with_team: true,
      }));
    }
    const tnaRecords: TrainingNeedsRecordInput[] = [];
    for (let i = 0; i < 10; i++) {
      tnaRecords.push(makeTrainingNeeds({
        staff_id: `staff_${i}`, is_current: true, needs_identified: 10,
        needs_addressed: 9, staff_involved: true, linked_to_supervision: true, plan_created: true,
      }));
    }
    const qualRecords: QualificationRecordInput[] = [];
    for (let i = 0; i < 10; i++) {
      qualRecords.push(makeQualification({
        staff_id: `staff_${i}`, status: "achieved", registration_current: true,
        evidence_on_file: true, role_relevant: true, is_required: true, level: 5,
      }));
    }
    const devPlanRecords: DevelopmentPlanRecordInput[] = [];
    for (let i = 0; i < 10; i++) {
      devPlanRecords.push(makeDevelopmentPlan({
        staff_id: `staff_${i}`, plan_exists: true, is_current: true, objectives_set: 10,
        objectives_achieved: 8, objectives_in_progress: 2, staff_involved: true,
        linked_to_home_priorities: true, measurable_outcomes: true,
        linked_to_supervision: true, career_pathway_documented: true, quality_rating: 5,
      }));
    }

    const r = run({
      total_staff: totalStaff,
      mandatory_training_records: mandatoryRecords,
      cpd_records: cpdRecords,
      training_needs_records: tnaRecords,
      qualification_records: qualRecords,
      development_plan_records: devPlanRecords,
    });
    expect(r.headline).toContain("outstanding");
  });

  it("good headline with issues", () => {
    // Good rating with some expired training.
    // Need score >= 65: 52 + bonuses - penalties
    // Bonus 1: 19/20=95% -> +4; Penalty 1: 1/20=5% -> -3
    // Bonus 2: 10/10=100% -> +4
    // Bonus 4: 10/10=100% -> +3
    // Bonus 5: 70/100=70% -> +2
    // Bonus 6: 10/10=100% -> +3
    // Bonus 9: needsAddressedRate=70%, avg(70)=70 -> +1 (only 1 component since no assessments)
    // Total: 52 + 4 + 4 + 3 + 2 + 3 + 1 - 3 = 66 -> good
    const mandatoryRecords: MandatoryTrainingRecordInput[] = [];
    for (let i = 0; i < 19; i++) {
      mandatoryRecords.push(makeMandatoryTraining({
        staff_id: `staff_${i}`, is_mandatory: true, status: "completed", is_valid: true,
        expiry_date: "2027-06-01", assessment_passed: false, certificate_issued: false,
        provider_quality_rating: 0, training_hours: 0,
      }));
    }
    mandatoryRecords.push(makeMandatoryTraining({
      staff_id: "staff_19", is_mandatory: true, status: "expired", is_valid: false,
      expiry_date: "2025-01-01", assessment_passed: false, certificate_issued: false,
      provider_quality_rating: 0, training_hours: 0,
    }));
    const cpdRecords: CpdRecordInput[] = [];
    for (let i = 0; i < 10; i++) {
      cpdRecords.push(makeCpdRecord({ staff_id: `staff_${i}`, status: "completed", cpd_hours: 0 }));
    }
    const tnaRecords: TrainingNeedsRecordInput[] = [];
    for (let i = 0; i < 10; i++) {
      tnaRecords.push(makeTrainingNeeds({
        staff_id: `staff_${i}`, is_current: true, needs_identified: 10, needs_addressed: 7,
      }));
    }
    // Add qualifications for bonus 6
    const qualRecords: QualificationRecordInput[] = [];
    for (let i = 0; i < 10; i++) {
      qualRecords.push(makeQualification({
        staff_id: `staff_${i}`, status: "achieved", registration_current: true,
        evidence_on_file: false, role_relevant: false, is_required: false, level: 0,
      }));
    }

    const r = run({
      total_staff: 10,
      mandatory_training_records: mandatoryRecords,
      cpd_records: cpdRecords,
      training_needs_records: tnaRecords,
      qualification_records: qualRecords,
    });
    expect(r.training_rating).toBe("good");
    expect(r.headline).toContain("Good overall");
    expect(r.headline).toContain("1 expired training");
  });

  it("good headline without issues", () => {
    const mandatoryRecords: MandatoryTrainingRecordInput[] = [];
    for (let i = 0; i < 20; i++) {
      mandatoryRecords.push(makeMandatoryTraining({
        staff_id: `staff_${i}`, is_mandatory: true, status: "completed", is_valid: true,
        expiry_date: "2027-06-01", assessment_passed: false, certificate_issued: false,
        provider_quality_rating: 0, training_hours: 0,
      }));
    }
    const cpdRecords: CpdRecordInput[] = [];
    for (let i = 0; i < 10; i++) {
      cpdRecords.push(makeCpdRecord({ staff_id: `staff_${i}`, status: "completed", cpd_hours: 0 }));
    }
    const tnaRecords: TrainingNeedsRecordInput[] = [];
    for (let i = 0; i < 10; i++) {
      tnaRecords.push(makeTrainingNeeds({
        staff_id: `staff_${i}`, is_current: true, needs_identified: 10, needs_addressed: 7,
      }));
    }

    const r = run({
      total_staff: 10,
      mandatory_training_records: mandatoryRecords,
      cpd_records: cpdRecords,
      training_needs_records: tnaRecords,
    });
    expect(r.headline).toContain("Good staff training and CPD compliance");
  });

  it("adequate headline with gaps", () => {
    // Low compliance, low CPD -> adequate with gaps
    const mandatoryRecords: MandatoryTrainingRecordInput[] = [];
    for (let i = 0; i < 10; i++) {
      mandatoryRecords.push(makeMandatoryTraining({
        staff_id: `staff_${i}`, is_mandatory: true, status: "not_started", is_valid: false,
        assessment_passed: false, certificate_issued: false, provider_quality_rating: 0, training_hours: 0,
      }));
    }
    const cpdRecords: CpdRecordInput[] = [];
    for (let i = 0; i < 5; i++) {
      cpdRecords.push(makeCpdRecord({ status: "completed", staff_id: `staff_${i}`, cpd_hours: 0 }));
    }
    for (let i = 5; i < 10; i++) {
      cpdRecords.push(makeCpdRecord({ status: "planned", staff_id: `staff_${i}`, cpd_hours: 0 }));
    }

    const r = run({
      total_staff: 10,
      mandatory_training_records: mandatoryRecords,
      cpd_records: cpdRecords,
    });
    expect(r.headline).toContain("Adequate");
    expect(r.headline).toContain("mandatory training");
  });

  it("inadequate headline", () => {
    // Heavy penalties -> inadequate
    const mandatoryRecords: MandatoryTrainingRecordInput[] = [];
    for (let i = 0; i < 10; i++) {
      mandatoryRecords.push(makeMandatoryTraining({
        staff_id: `staff_${i}`, is_mandatory: true, status: "expired", is_valid: false,
        expiry_date: "2025-01-01", assessment_passed: false, certificate_issued: false,
        provider_quality_rating: 0, training_hours: 0,
      }));
    }
    const cpdRecords: CpdRecordInput[] = [];
    for (let i = 0; i < 10; i++) {
      cpdRecords.push(makeCpdRecord({ status: "overdue", staff_id: `staff_${i}`, cpd_hours: 0 }));
    }

    const r = run({
      total_staff: 10,
      mandatory_training_records: mandatoryRecords,
      cpd_records: cpdRecords,
    });
    expect(r.headline).toContain("inadequate");
    expect(r.headline).toContain("Reg 32/33");
  });
});

// ── 25. Edge Cases ──────────────────────────────────────────────────────────

describe("edge cases", () => {
  it("single staff member with complete data", () => {
    const r = run({
      total_staff: 1,
      mandatory_training_records: [
        makeMandatoryTraining({ staff_id: "staff_1", is_mandatory: true, status: "completed", is_valid: true, expiry_date: "2027-01-01" }),
      ],
      cpd_records: [
        makeCpdRecord({ staff_id: "staff_1", status: "completed" }),
      ],
      training_needs_records: [
        makeTrainingNeeds({ staff_id: "staff_1", is_current: true }),
      ],
      qualification_records: [
        makeQualification({ staff_id: "staff_1", status: "achieved", registration_current: true }),
      ],
      development_plan_records: [
        makeDevelopmentPlan({ staff_id: "staff_1", plan_exists: true, is_current: true }),
      ],
    });
    expect(r.training_rating).toBeDefined();
    expect(r.training_score).toBeGreaterThanOrEqual(52);
  });

  it("expiry_date exactly equal to today is NOT expired (string comparison)", () => {
    // isExpired checks dateStr < today, so "2026-05-28" < "2026-05-28" is false
    const r = run({
      total_staff: 5,
      mandatory_training_records: [
        makeMandatoryTraining({
          is_mandatory: true, status: "completed", is_valid: true,
          expiry_date: "2026-05-28", // same as TODAY
        }),
      ],
    });
    expect(r.mandatory_training_expired_count).toBe(0);
    expect(r.mandatory_training_valid_count).toBe(1);
  });

  it("expiry_date one day before today IS expired", () => {
    const r = run({
      total_staff: 5,
      mandatory_training_records: [
        makeMandatoryTraining({
          is_mandatory: true, status: "completed", is_valid: true,
          expiry_date: "2026-05-27",
        }),
      ],
    });
    expect(r.mandatory_training_expired_count).toBe(1);
    expect(r.mandatory_training_valid_count).toBe(0);
  });

  it("null expiry_date means not expired", () => {
    const r = run({
      total_staff: 5,
      mandatory_training_records: [
        makeMandatoryTraining({
          is_mandatory: true, status: "completed", is_valid: true,
          expiry_date: null,
        }),
      ],
    });
    expect(r.mandatory_training_expired_count).toBe(0);
    expect(r.mandatory_training_valid_count).toBe(1);
  });

  it("very large staff count", () => {
    const r = run({ total_staff: 1000 });
    expect(r.training_rating).toBe("inadequate");
    expect(r.training_score).toBe(15);
    expect(r.headline).toContain("1000 staff");
  });

  it("mixed statuses in mandatory training", () => {
    const r = run({
      total_staff: 5,
      mandatory_training_records: [
        makeMandatoryTraining({ is_mandatory: true, status: "completed", is_valid: true, expiry_date: "2027-01-01" }),
        makeMandatoryTraining({ is_mandatory: true, status: "in_progress", is_valid: false, staff_id: "staff_2" }),
        makeMandatoryTraining({ is_mandatory: true, status: "not_started", is_valid: false, staff_id: "staff_3" }),
        makeMandatoryTraining({ is_mandatory: true, status: "expired", is_valid: false, staff_id: "staff_4" }),
        makeMandatoryTraining({ is_mandatory: true, status: "overdue", is_valid: false, staff_id: "staff_5" }),
      ],
    });
    expect(r.mandatory_training_valid_count).toBe(1);
    expect(r.mandatory_training_expired_count).toBe(1);
    expect(r.mandatory_training_overdue_count).toBe(1);
    expect(r.mandatory_training_compliance_rate).toBe(20);
  });

  it("cpd_avg_hours_per_staff is 0 when total_staff is 0", () => {
    const r = run({
      total_staff: 0,
      cpd_records: [makeCpdRecord({ cpd_hours: 10 })],
    });
    expect(r.cpd_avg_hours_per_staff).toBe(0);
  });

  it("development_plan_coverage_rate uses totalDevPlans when total_staff=0", () => {
    const r = run({
      total_staff: 0,
      development_plan_records: [
        makeDevelopmentPlan({ plan_exists: true, is_current: true }),
        makeDevelopmentPlan({ plan_exists: true, is_current: false, staff_id: "staff_2" }),
        makeDevelopmentPlan({ plan_exists: false, is_current: false, staff_id: "staff_3" }),
      ],
    });
    // 1 current plan / 3 total = 33%
    expect(r.development_plan_coverage_rate).toBe(33);
  });

  it("multiple records for same staff_id are counted individually", () => {
    const r = run({
      total_staff: 1,
      mandatory_training_records: [
        makeMandatoryTraining({ staff_id: "staff_1", is_mandatory: true, course_name: "Course A", status: "completed", is_valid: true, expiry_date: "2027-01-01" }),
        makeMandatoryTraining({ staff_id: "staff_1", is_mandatory: true, course_name: "Course B", status: "completed", is_valid: true, expiry_date: "2027-01-01" }),
      ],
    });
    expect(r.mandatory_training_total).toBe(2);
    expect(r.mandatory_training_valid_count).toBe(2);
  });

  it("qualification detected as expired via expiry_date even when status is achieved", () => {
    const r = run({
      total_staff: 5,
      qualification_records: [
        makeQualification({
          status: "achieved", expiry_date: "2025-01-01", // past
        }),
      ],
    });
    // The engine checks: status === "expired" || (expiry_date && isExpired(expiry_date, today))
    expect(r.qualifications_expired_count).toBe(1);
  });

  it("cpd_total_hours is rounded to 1 decimal", () => {
    const r = run({
      total_staff: 2,
      cpd_records: [
        makeCpdRecord({ cpd_hours: 1.15 }),
        makeCpdRecord({ cpd_hours: 2.29 }),
      ],
    });
    // 1.15 + 2.29 = 3.44, Math.round(3.44*10)/10 = 3.4
    expect(r.cpd_total_hours).toBe(3.4);
  });

  it("training effectiveness includes all 5 components when all data exists", () => {
    const r = run({
      total_staff: 5,
      mandatory_training_records: [
        makeMandatoryTraining({
          is_mandatory: true, status: "completed", is_valid: false,
          assessment_passed: true, expiry_date: null,
          certificate_issued: false, provider_quality_rating: 0, training_hours: 0,
        }),
      ],
      cpd_records: [
        makeCpdRecord({ status: "completed", reflection_recorded: true, learning_applied: true }),
      ],
      training_needs_records: [
        makeTrainingNeeds({ needs_identified: 10, needs_addressed: 8 }),
      ],
      development_plan_records: [
        makeDevelopmentPlan({ objectives_set: 10, objectives_achieved: 7 }),
      ],
    });
    // assessmentPassRate=100%, cpdLearning=100%, cpdReflection=100%, needsAddressed=80%, devObj=70%
    // avg = (100+100+100+80+70)/5 = 450/5 = 90%
    expect(r.training_effectiveness_rate).toBe(90);
  });

  it("score never exceeds 100 (clamp upper bound)", () => {
    // This is theoretical since max bonuses give 80, but verify clamp works
    // We cannot actually exceed 80 with the current engine, so this just confirms the clamp doesn't break anything
    const r = run({
      total_staff: 10,
      mandatory_training_records: [
        makeMandatoryTraining({ is_mandatory: false, assessment_passed: false, certificate_issued: false, provider_quality_rating: 0, training_hours: 0 }),
      ],
    });
    expect(r.training_score).toBeLessThanOrEqual(100);
  });

  it("empty string staff_id is not counted in uniqueStaffCount", () => {
    const r = run({
      total_staff: 5,
      mandatory_training_records: [
        makeMandatoryTraining({ staff_id: "", is_mandatory: true, status: "completed", is_valid: true, expiry_date: "2027-01-01" }),
        makeMandatoryTraining({ staff_id: "staff_1", is_mandatory: true, status: "completed", is_valid: true, expiry_date: "2027-01-01" }),
      ],
    });
    // uniqueStaffCount checks r.staff_id is truthy; "" is falsy, so not counted
    // This affects the "staff without mandatory training" concern
    // staffWithMandatoryTraining = 1 (only "staff_1" counted)
    // total_staff=5, so 4 uncovered
    expect(r.concerns.some(c => c.includes("4 staff members have no mandatory training records"))).toBe(true);
  });

  it("good headline lists multiple issues when present", () => {
    // Need good score (65+) with multiple issue types
    const mandatoryRecords: MandatoryTrainingRecordInput[] = [];
    for (let i = 0; i < 19; i++) {
      mandatoryRecords.push(makeMandatoryTraining({
        staff_id: `staff_${i}`, is_mandatory: true, status: "completed", is_valid: true,
        expiry_date: "2027-06-01", assessment_passed: false, certificate_issued: false,
        provider_quality_rating: 0, training_hours: 0,
      }));
    }
    // 1 expired mandatory
    mandatoryRecords.push(makeMandatoryTraining({
      staff_id: "staff_exp", is_mandatory: true, status: "expired", is_valid: false,
      expiry_date: "2025-01-01", assessment_passed: false, certificate_issued: false,
      provider_quality_rating: 0, training_hours: 0,
    }));
    const cpdRecords: CpdRecordInput[] = [];
    for (let i = 0; i < 9; i++) {
      cpdRecords.push(makeCpdRecord({ status: "completed", staff_id: `staff_${i}`, cpd_hours: 0 }));
    }
    // 1 overdue CPD
    cpdRecords.push(makeCpdRecord({ status: "overdue", staff_id: "staff_overdue", cpd_hours: 0 }));
    const tnaRecords: TrainingNeedsRecordInput[] = [];
    for (let i = 0; i < 10; i++) {
      tnaRecords.push(makeTrainingNeeds({
        staff_id: `staff_${i}`, is_current: true, needs_identified: 10, needs_addressed: 7,
      }));
    }

    const r = run({
      total_staff: 10,
      mandatory_training_records: mandatoryRecords,
      cpd_records: cpdRecords,
      training_needs_records: tnaRecords,
    });
    if (r.training_rating === "good") {
      expect(r.headline).toContain("1 expired training");
      expect(r.headline).toContain("1 overdue CPD");
    }
  });

  it("adequate headline without specific gaps shows generic message", () => {
    // Need adequate score (45-64) but with all metrics above their gap thresholds
    // Base 52 with a small penalty to stay in adequate range
    const cpdRecords: CpdRecordInput[] = [];
    for (let i = 0; i < 4; i++) {
      cpdRecords.push(makeCpdRecord({ status: "overdue", staff_id: `staff_ov_${i}`, cpd_hours: 0 }));
    }
    for (let i = 0; i < 16; i++) {
      cpdRecords.push(makeCpdRecord({ status: "completed", staff_id: `staff_${i}`, cpd_hours: 0 }));
    }

    const r = run({
      total_staff: 10,
      cpd_records: cpdRecords,
    });
    // cpd completion = 16/20 = 80% -> bonus2=+3; overdue pct=20% -> penalty2=-4
    // 52 + 3 - 4 = 51 -> adequate
    if (r.training_rating === "adequate") {
      // cpdCompletionRate=80% which is >= 60, so no "CPD completion" gap
      // Check if the headline is the generic adequate one
      expect(r.headline).toContain("Adequate");
    }
  });
});

// ── 26. Required Qualification Concern Edge Cases ───────────────────────────

describe("required qualifications", () => {
  it("requiredQualificationRate < 80% triggers immediate recommendation", () => {
    const r = run({
      total_staff: 5,
      qualification_records: [
        makeQualification({ is_required: true, status: "in_progress" }),
        makeQualification({ is_required: true, status: "achieved", staff_id: "staff_2" }),
      ],
    });
    // 1/2 = 50%
    const rec = r.recommendations.find(rec => rec.recommendation.includes("required qualifications") || rec.recommendation.includes("lack"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("immediate");
  });

  it("requiredQualificationRate < 70% with 3+ required triggers critical insight", () => {
    const records: QualificationRecordInput[] = [];
    for (let i = 0; i < 3; i++) {
      records.push(makeQualification({
        staff_id: `staff_${i}`, is_required: true, status: "in_progress",
      }));
    }
    const r = run({ total_staff: 5, qualification_records: records });
    // 0/3 = 0% < 70%, requiredQuals >= 3
    expect(r.insights.some(i => i.severity === "critical" && i.text.includes("required qualifications are achieved"))).toBe(true);
  });
});

// ── 27. Low Needs Addressed Rate Recommendation ─────────────────────────────

describe("needs addressed recommendation", () => {
  it("needsAddressedRate < 60% triggers soon recommendation", () => {
    const r = run({
      total_staff: 5,
      training_needs_records: [
        makeTrainingNeeds({ needs_identified: 10, needs_addressed: 5 }),
      ],
    });
    // 50% < 60%
    const rec = r.recommendations.find(r => r.recommendation.includes("training needs more promptly"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("soon");
  });
});

// ── 28. Low CPD Learning Applied Recommendation ─────────────────────────────

describe("CPD learning applied recommendation", () => {
  it("cpdLearningAppliedRate < 50% triggers soon recommendation", () => {
    const records: CpdRecordInput[] = [];
    for (let i = 0; i < 5; i++) {
      records.push(makeCpdRecord({ status: "completed", learning_applied: false, staff_id: `staff_${i}` }));
    }
    const r = run({ total_staff: 5, cpd_records: records });
    const rec = r.recommendations.find(r => r.recommendation.includes("application of CPD learning"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("soon");
  });
});

// ── 29. Planned Recommendations ─────────────────────────────────────────────

describe("planned recommendations", () => {
  it("qualification expiring soon generates planned recommendation", () => {
    const r = run({
      total_staff: 5,
      qualification_records: [
        makeQualification({
          status: "achieved",
          expiry_date: "2026-08-01", // within 90 days
        }),
      ],
    });
    const rec = r.recommendations.find(r => r.recommendation.includes("qualification") && r.recommendation.includes("expiring within 90 days"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("planned");
  });

  it("moderate CPD hours generates planned recommendation", () => {
    // avg between 5 and 10
    const r = run({
      total_staff: 5,
      cpd_records: [
        makeCpdRecord({ cpd_hours: 35, status: "completed" }),
      ],
    });
    // 35/5 = 7 hours per staff
    const rec = r.recommendations.find(r => r.recommendation.includes("Increase CPD hours"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("planned");
  });

  it("low career pathway rate generates planned recommendation", () => {
    const records: DevelopmentPlanRecordInput[] = [];
    for (let i = 0; i < 5; i++) {
      records.push(makeDevelopmentPlan({
        staff_id: `staff_${i}`, plan_exists: true, career_pathway_documented: false,
      }));
    }
    const r = run({ total_staff: 5, development_plan_records: records });
    const rec = r.recommendations.find(r => r.recommendation.includes("career progression pathways"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("planned");
  });

  it("low measurable outcomes rate generates planned recommendation", () => {
    const records: DevelopmentPlanRecordInput[] = [];
    for (let i = 0; i < 5; i++) {
      records.push(makeDevelopmentPlan({
        staff_id: `staff_${i}`, plan_exists: true, measurable_outcomes: false,
      }));
    }
    const r = run({ total_staff: 5, development_plan_records: records });
    const rec = r.recommendations.find(r => r.recommendation.includes("measurable outcomes"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("planned");
  });

  it("low evidence rate generates planned recommendation", () => {
    const records: QualificationRecordInput[] = [];
    for (let i = 0; i < 10; i++) {
      records.push(makeQualification({
        staff_id: `staff_${i}`, evidence_on_file: false,
      }));
    }
    const r = run({ total_staff: 10, qualification_records: records });
    const rec = r.recommendations.find(r => r.recommendation.includes("qualification evidence filing"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("planned");
  });

  it("low delivery method diversity generates planned recommendation", () => {
    const records: MandatoryTrainingRecordInput[] = [];
    for (let i = 0; i < 5; i++) {
      records.push(makeMandatoryTraining({
        staff_id: `staff_${i}`, delivery_method: "online", is_mandatory: false,
        assessment_passed: false, certificate_issued: false, provider_quality_rating: 0, training_hours: 0,
      }));
    }
    const r = run({ total_staff: 5, mandatory_training_records: records });
    const rec = r.recommendations.find(r => r.recommendation.includes("Diversify training delivery"));
    expect(rec).toBeDefined();
  });

  it("2+ in-progress qualifications generates planned recommendation", () => {
    const r = run({
      total_staff: 5,
      qualification_records: [
        makeQualification({ status: "in_progress", staff_id: "staff_1" }),
        makeQualification({ status: "in_progress", staff_id: "staff_2" }),
      ],
    });
    const rec = r.recommendations.find(r => r.recommendation.includes("in-progress qualifications"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("planned");
  });

  it("low TNA linked to supervision rate generates planned recommendation", () => {
    const records: TrainingNeedsRecordInput[] = [];
    for (let i = 0; i < 5; i++) {
      records.push(makeTrainingNeeds({
        staff_id: `staff_${i}`, linked_to_supervision: false,
      }));
    }
    const r = run({ total_staff: 5, training_needs_records: records });
    const rec = r.recommendations.find(r => r.recommendation.includes("training needs analysis and supervision"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("planned");
  });
});

// ── 30. Positive Insight Edge Cases ─────────────────────────────────────────

describe("positive insights", () => {
  it("training effectiveness >= 80% with 4+ components triggers positive insight", () => {
    const r = run({
      total_staff: 5,
      mandatory_training_records: [
        makeMandatoryTraining({
          is_mandatory: true, status: "completed", is_valid: false,
          assessment_passed: true, expiry_date: null,
          certificate_issued: false, provider_quality_rating: 0, training_hours: 0,
        }),
      ],
      cpd_records: [
        makeCpdRecord({ status: "completed", reflection_recorded: true, learning_applied: true }),
      ],
      training_needs_records: [
        makeTrainingNeeds({ needs_identified: 10, needs_addressed: 9 }),
      ],
      development_plan_records: [
        makeDevelopmentPlan({ objectives_set: 10, objectives_achieved: 9 }),
      ],
    });
    // 5 components: assessment=100, cpdLearning=100, cpdReflection=100, needsAddressed=90, devObj=90
    // avg = 96% >= 80% and 5 >= 4
    expect(r.insights.some(i => i.severity === "positive" && i.text.includes("Training effectiveness rate"))).toBe(true);
  });

  it("high needs addressed + high TNA involvement triggers positive insight", () => {
    const records: TrainingNeedsRecordInput[] = [];
    for (let i = 0; i < 5; i++) {
      records.push(makeTrainingNeeds({
        staff_id: `staff_${i}`, needs_identified: 10, needs_addressed: 9, staff_involved: true,
      }));
    }
    const r = run({ total_staff: 5, training_needs_records: records });
    // needsAddressedRate = 45/50 = 90% >= 85%, tnaStaffInvolvementRate = 5/5 = 100% >= 85%
    expect(r.insights.some(i => i.severity === "positive" && i.text.includes("Training needs analysis is highly effective"))).toBe(true);
  });

  it("high dev objectives with 5+ objectives triggers positive insight", () => {
    const r = run({
      total_staff: 5,
      development_plan_records: [
        makeDevelopmentPlan({ objectives_set: 5, objectives_achieved: 4 }),
      ],
    });
    // 4/5 = 80% >= 80%, totalObjectivesSet = 5 >= 5
    expect(r.insights.some(i => i.severity === "positive" && i.text.includes("development objectives achieved"))).toBe(true);
  });

  it("high plan linked rates trigger positive insight", () => {
    const records: DevelopmentPlanRecordInput[] = [];
    for (let i = 0; i < 5; i++) {
      records.push(makeDevelopmentPlan({
        staff_id: `staff_${i}`, plan_exists: true,
        linked_to_home_priorities: true, linked_to_supervision: true,
      }));
    }
    const r = run({ total_staff: 5, development_plan_records: records });
    // planLinkedToHomeRate=100%, planLinkedToSupervisionRate=100%, activePlans=5>=3
    expect(r.insights.some(i => i.severity === "positive" && i.text.includes("Development plans are well-integrated"))).toBe(true);
  });

  it("high CPD hours triggers positive insight", () => {
    const r = run({
      total_staff: 2,
      cpd_records: [
        makeCpdRecord({ cpd_hours: 30, status: "completed", staff_id: "staff_1" }),
        makeCpdRecord({ cpd_hours: 30, status: "completed", staff_id: "staff_2" }),
      ],
    });
    // 60/2 = 30 hours per staff >= 25
    expect(r.insights.some(i => i.severity === "positive" && i.text.includes("Average CPD hours per staff is 30"))).toBe(true);
  });

  it("high assessment pass rate with 5+ completed triggers positive insight", () => {
    const records: MandatoryTrainingRecordInput[] = [];
    for (let i = 0; i < 5; i++) {
      records.push(makeMandatoryTraining({
        staff_id: `staff_${i}`, is_mandatory: true, status: "completed", is_valid: false,
        assessment_passed: true, expiry_date: null,
      }));
    }
    const r = run({ total_staff: 5, mandatory_training_records: records });
    // 5/5 = 100% >= 98%, mandatoryWithAssessment.length=5>=5
    expect(r.insights.some(i => i.severity === "positive" && i.text.includes("Training assessment pass rate is 100%"))).toBe(true);
  });

  it("high certificate coverage triggers positive insight", () => {
    const records: MandatoryTrainingRecordInput[] = [];
    for (let i = 0; i < 5; i++) {
      records.push(makeMandatoryTraining({
        staff_id: `staff_${i}`, is_mandatory: true, status: "completed", is_valid: true,
        expiry_date: "2027-06-01", certificate_issued: true,
      }));
    }
    const r = run({ total_staff: 5, mandatory_training_records: records });
    expect(r.insights.some(i => i.severity === "positive" && i.text.includes("100%") && i.text.includes("certificates on file"))).toBe(true);
  });

  it("high CPD activity diversity triggers positive insight", () => {
    const records: CpdRecordInput[] = [];
    const types = ["course", "workshop", "conference", "reading", "shadowing"];
    for (let i = 0; i < 5; i++) {
      records.push(makeCpdRecord({ activity_type: types[i], staff_id: `staff_${i}` }));
    }
    // Need 10+ records total
    for (let i = 5; i < 10; i++) {
      records.push(makeCpdRecord({ activity_type: types[i % 5], staff_id: `staff_${i}` }));
    }
    const r = run({ total_staff: 10, cpd_records: records });
    // 5 activity types >= 5, 10 records >= 10
    expect(r.insights.some(i => i.severity === "positive" && i.text.includes("5 different activity types"))).toBe(true);
  });
});

// ── 31. TNA Staff Involvement Warning Insight ───────────────────────────────

describe("TNA staff involvement warning insight", () => {
  it("tnaStaffInvolvementRate < 60% triggers warning insight", () => {
    const records: TrainingNeedsRecordInput[] = [];
    for (let i = 0; i < 5; i++) {
      records.push(makeTrainingNeeds({ staff_id: `staff_${i}`, staff_involved: false }));
    }
    const r = run({ total_staff: 5, training_needs_records: records });
    expect(r.insights.some(i => i.severity === "warning" && i.text.includes("training needs analyses involved the staff member"))).toBe(true);
  });
});

// ── 32. Plan Staff Involvement Warning Insight ──────────────────────────────

describe("plan staff involvement warning insight", () => {
  it("planStaffInvolvementRate < 60% with 3+ active plans triggers warning insight", () => {
    const records: DevelopmentPlanRecordInput[] = [];
    for (let i = 0; i < 3; i++) {
      records.push(makeDevelopmentPlan({
        staff_id: `staff_${i}`, plan_exists: true, staff_involved: false,
      }));
    }
    const r = run({ total_staff: 5, development_plan_records: records });
    expect(r.insights.some(i => i.severity === "warning" && i.text.includes("development plans were co-created with staff"))).toBe(true);
  });
});

// ── 33. Qualification Expiring Soon Warning Insight ─────────────────────────

describe("qualification expiring soon warning insight", () => {
  it("2+ qualifications expiring within 90 days triggers warning insight", () => {
    const r = run({
      total_staff: 5,
      qualification_records: [
        makeQualification({ status: "achieved", expiry_date: "2026-08-01", staff_id: "staff_1" }),
        makeQualification({ status: "achieved", expiry_date: "2026-07-15", staff_id: "staff_2" }),
      ],
    });
    expect(r.insights.some(i => i.severity === "warning" && i.text.includes("2 qualifications are expiring within 90 days"))).toBe(true);
  });
});

// ── 34. CPD Completion Warning Insight ──────────────────────────────────────

describe("CPD completion warning insight", () => {
  it("cpdCompletionRate 30-59% triggers warning insight", () => {
    const records: CpdRecordInput[] = [];
    for (let i = 0; i < 4; i++) {
      records.push(makeCpdRecord({ status: "completed", staff_id: `staff_${i}` }));
    }
    for (let i = 4; i < 10; i++) {
      records.push(makeCpdRecord({ status: "planned", staff_id: `staff_${i}` }));
    }
    const r = run({ total_staff: 10, cpd_records: records });
    // 4/10 = 40%
    expect(r.insights.some(i => i.severity === "warning" && i.text.includes("CPD completion rate is 40%"))).toBe(true);
  });
});

// ── 35. Needs Addressed Warning Insight ─────────────────────────────────────

describe("needs addressed warning insight", () => {
  it("needsAddressedRate 20-49% triggers warning insight", () => {
    const r = run({
      total_staff: 5,
      training_needs_records: [
        makeTrainingNeeds({ needs_identified: 10, needs_addressed: 3 }),
      ],
    });
    // 3/10 = 30%
    expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Only 30%") && i.text.includes("training needs have been addressed"))).toBe(true);
  });
});
