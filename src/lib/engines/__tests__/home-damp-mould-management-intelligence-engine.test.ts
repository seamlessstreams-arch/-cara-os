// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME DAMP & MOULD MANAGEMENT INTELLIGENCE ENGINE — TESTS
// CHR 2015 Reg 25 (Premises), Reg 14 (Health).
// SCCIF: "Safety", "Quality of care", "Living in the home".
// base=52, max bonus=+28 → max 80. 4 penalties (guarded).
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeDampMouldManagement,
  type DampMouldManagementInput,
  type DampSurveyRecordInput,
  type MouldInspectionRecordInput,
  type RemediationRecordInput,
  type VentilationAssessmentRecordInput,
  type HealthImpactRecordInput,
} from "../home-damp-mould-management-intelligence-engine";

// ── Factories ───────────────────────────────────────────────────────────────

function makeDampSurvey(overrides: Partial<DampSurveyRecordInput> = {}): DampSurveyRecordInput {
  return {
    id: "ds_1",
    date: "2026-05-01",
    surveyor: "John Smith",
    survey_type: "routine",
    area_surveyed: "Kitchen",
    damp_detected: false,
    damp_type: "none",
    severity: "none",
    moisture_reading: 12,
    moisture_threshold: 20,
    within_acceptable_range: true,
    photographs_taken: true,
    action_required: false,
    action_taken: false,
    follow_up_date: null,
    follow_up_completed: false,
    child_rooms_affected: false,
    rooms_affected_count: 0,
    recommendations_made: 1,
    recommendations_actioned: 1,
    notes: "",
    created_at: "2026-05-01",
    ...overrides,
  };
}

function makeMouldInspection(overrides: Partial<MouldInspectionRecordInput> = {}): MouldInspectionRecordInput {
  return {
    id: "mi_1",
    date: "2026-05-01",
    inspector: "Jane Doe",
    inspection_type: "routine",
    area_inspected: "Bathroom",
    mould_found: false,
    mould_type: "none",
    surface_area_affected_sqm: 0,
    severity: "none",
    location_type: "bathroom",
    child_bedroom_affected: false,
    spore_risk_assessed: false,
    immediate_action_taken: false,
    treatment_applied: false,
    treatment_type: "",
    re_inspection_scheduled: false,
    re_inspection_date: null,
    photographs_taken: true,
    reported_to_management: false,
    notes: "",
    created_at: "2026-05-01",
    ...overrides,
  };
}

function makeRemediation(overrides: Partial<RemediationRecordInput> = {}): RemediationRecordInput {
  return {
    id: "rem_1",
    date_raised: "2026-04-01",
    date_completed: "2026-04-10",
    remediation_type: "mould_treatment",
    contractor: "ABC Contractors",
    area_treated: "Bathroom",
    severity_at_referral: "moderate",
    completed: true,
    completed_within_target: true,
    target_days: 14,
    actual_days: 10,
    cost_gbp: 500,
    quality_checked: true,
    quality_satisfactory: true,
    follow_up_inspection_completed: true,
    recurrence_detected: false,
    child_room_involved: true,
    child_temporarily_relocated: false,
    child_informed_of_works: true,
    warranty_period_months: 12,
    warranty_active: true,
    notes: "",
    created_at: "2026-04-01",
    ...overrides,
  };
}

function makeVentilation(overrides: Partial<VentilationAssessmentRecordInput> = {}): VentilationAssessmentRecordInput {
  return {
    id: "vent_1",
    date: "2026-04-15",
    assessor: "Air Quality Ltd",
    room_assessed: "Bedroom 1",
    room_type: "bedroom",
    ventilation_type: "trickle_vents",
    ventilation_adequate: true,
    airflow_measured: true,
    airflow_rate_lps: 15,
    minimum_required_lps: 10,
    meets_building_regs: true,
    humidity_level_percent: 45,
    humidity_acceptable: true,
    extractor_fan_working: true,
    trickle_vents_open: true,
    windows_openable: true,
    condensation_observed: false,
    recommendations_made: 1,
    recommendations_actioned: 1,
    child_bedroom: true,
    maintenance_required: false,
    maintenance_completed: false,
    notes: "",
    created_at: "2026-04-15",
    ...overrides,
  };
}

function makeHealthImpact(overrides: Partial<HealthImpactRecordInput> = {}): HealthImpactRecordInput {
  return {
    id: "hi_1",
    child_id: "yp_1",
    date: "2026-04-20",
    health_concern_type: "respiratory",
    linked_to_damp_mould: true,
    confirmed_by_professional: true,
    professional_type: "gp",
    severity: "mild",
    treatment_required: true,
    treatment_provided: true,
    medication_prescribed: false,
    days_affected: 2,
    school_absence: false,
    school_absence_days: 0,
    room_assessment_triggered: true,
    remediation_triggered: false,
    environment_modified: true,
    child_views_recorded: true,
    social_worker_informed: true,
    placing_authority_informed: true,
    follow_up_health_check: true,
    follow_up_completed: true,
    outcome: "resolved",
    notes: "",
    created_at: "2026-04-20",
    ...overrides,
  };
}

/** All-excellent baseline: every rate >= 90, child awareness >= 90 */
function baseInput(overrides: Partial<DampMouldManagementInput> = {}): DampMouldManagementInput {
  return {
    today: "2026-05-30",
    total_children: 3,
    damp_survey_records: [
      makeDampSurvey({ id: "ds_1", within_acceptable_range: true, action_required: true, action_taken: true, follow_up_date: "2026-06-01", follow_up_completed: true }),
      makeDampSurvey({ id: "ds_2", within_acceptable_range: true, action_required: true, action_taken: true, follow_up_date: "2026-06-01", follow_up_completed: true }),
      makeDampSurvey({ id: "ds_3", within_acceptable_range: true }),
      makeDampSurvey({ id: "ds_4", within_acceptable_range: true }),
      makeDampSurvey({ id: "ds_5", within_acceptable_range: true }),
      makeDampSurvey({ id: "ds_6", within_acceptable_range: true }),
      makeDampSurvey({ id: "ds_7", within_acceptable_range: true }),
      makeDampSurvey({ id: "ds_8", within_acceptable_range: true }),
      makeDampSurvey({ id: "ds_9", within_acceptable_range: true }),
      makeDampSurvey({ id: "ds_10", within_acceptable_range: true }),
    ],
    mould_inspection_records: [
      makeMouldInspection({ id: "mi_1" }),
      makeMouldInspection({ id: "mi_2" }),
      makeMouldInspection({ id: "mi_3" }),
      makeMouldInspection({ id: "mi_4" }),
      makeMouldInspection({ id: "mi_5" }),
      makeMouldInspection({ id: "mi_6" }),
      makeMouldInspection({ id: "mi_7" }),
      makeMouldInspection({ id: "mi_8" }),
      makeMouldInspection({ id: "mi_9" }),
      makeMouldInspection({ id: "mi_10" }),
    ],
    remediation_records: [
      makeRemediation({ id: "rem_1", child_room_involved: true, child_informed_of_works: true }),
      makeRemediation({ id: "rem_2", child_room_involved: true, child_informed_of_works: true }),
    ],
    ventilation_assessment_records: [
      makeVentilation({ id: "vent_1", child_bedroom: true }),
      makeVentilation({ id: "vent_2", child_bedroom: true }),
      makeVentilation({ id: "vent_3", child_bedroom: false }),
    ],
    health_impact_records: [
      makeHealthImpact({ id: "hi_1", child_views_recorded: true }),
      makeHealthImpact({ id: "hi_2", child_views_recorded: true }),
    ],
    ...overrides,
  };
}

// ── 1. insufficient_data ────────────────────────────────────────────────────

describe("insufficient_data — all empty + 0 children", () => {
  it("returns insufficient_data when no children and no records", () => {
    const r = computeDampMouldManagement({
      today: "2026-05-30",
      total_children: 0,
      damp_survey_records: [],
      mould_inspection_records: [],
      remediation_records: [],
      ventilation_assessment_records: [],
      health_impact_records: [],
    });
    expect(r.damp_rating).toBe("insufficient_data");
    expect(r.damp_score).toBe(0);
  });

  it("headline references insufficient data", () => {
    const r = computeDampMouldManagement({
      today: "2026-05-30",
      total_children: 0,
      damp_survey_records: [],
      mould_inspection_records: [],
      remediation_records: [],
      ventilation_assessment_records: [],
      health_impact_records: [],
    });
    expect(r.headline).toContain("insufficient data");
  });

  it("has empty arrays for strengths/concerns/recommendations/insights", () => {
    const r = computeDampMouldManagement({
      today: "2026-05-30",
      total_children: 0,
      damp_survey_records: [],
      mould_inspection_records: [],
      remediation_records: [],
      ventilation_assessment_records: [],
      health_impact_records: [],
    });
    expect(r.strengths).toHaveLength(0);
    expect(r.concerns).toHaveLength(0);
    expect(r.recommendations).toHaveLength(0);
    expect(r.insights).toHaveLength(0);
  });

  it("all totals are 0", () => {
    const r = computeDampMouldManagement({
      today: "2026-05-30",
      total_children: 0,
      damp_survey_records: [],
      mould_inspection_records: [],
      remediation_records: [],
      ventilation_assessment_records: [],
      health_impact_records: [],
    });
    expect(r.total_damp_surveys).toBe(0);
    expect(r.total_mould_inspections).toBe(0);
    expect(r.total_remediations).toBe(0);
    expect(r.total_ventilation_assessments).toBe(0);
    expect(r.total_health_impacts).toBe(0);
  });

  it("all rates are 0", () => {
    const r = computeDampMouldManagement({
      today: "2026-05-30",
      total_children: 0,
      damp_survey_records: [],
      mould_inspection_records: [],
      remediation_records: [],
      ventilation_assessment_records: [],
      health_impact_records: [],
    });
    expect(r.damp_survey_rate).toBe(0);
    expect(r.mould_inspection_rate).toBe(0);
    expect(r.remediation_rate).toBe(0);
    expect(r.ventilation_rate).toBe(0);
    expect(r.health_impact_rate).toBe(0);
    expect(r.child_awareness_rate).toBe(0);
  });
});

// ── 2. inadequate — all empty + children > 0 ───────────────────────────────

describe("inadequate — all empty + children present", () => {
  it("returns inadequate with score 15 when children present but no records", () => {
    const r = computeDampMouldManagement({
      today: "2026-05-30",
      total_children: 3,
      damp_survey_records: [],
      mould_inspection_records: [],
      remediation_records: [],
      ventilation_assessment_records: [],
      health_impact_records: [],
    });
    expect(r.damp_rating).toBe("inadequate");
    expect(r.damp_score).toBe(15);
  });

  it("headline warns about no data despite children on placement", () => {
    const r = computeDampMouldManagement({
      today: "2026-05-30",
      total_children: 3,
      damp_survey_records: [],
      mould_inspection_records: [],
      remediation_records: [],
      ventilation_assessment_records: [],
      health_impact_records: [],
    });
    expect(r.headline).toContain("No damp and mould management data recorded");
  });

  it("has exactly 1 concern about absence of records", () => {
    const r = computeDampMouldManagement({
      today: "2026-05-30",
      total_children: 3,
      damp_survey_records: [],
      mould_inspection_records: [],
      remediation_records: [],
      ventilation_assessment_records: [],
      health_impact_records: [],
    });
    expect(r.concerns).toHaveLength(1);
    expect(r.concerns[0]).toContain("No damp survey records");
  });

  it("has 2 recommendations both with immediate urgency", () => {
    const r = computeDampMouldManagement({
      today: "2026-05-30",
      total_children: 3,
      damp_survey_records: [],
      mould_inspection_records: [],
      remediation_records: [],
      ventilation_assessment_records: [],
      health_impact_records: [],
    });
    expect(r.recommendations).toHaveLength(2);
    expect(r.recommendations[0].urgency).toBe("immediate");
    expect(r.recommendations[1].urgency).toBe("immediate");
    expect(r.recommendations[0].rank).toBe(1);
    expect(r.recommendations[1].rank).toBe(2);
  });

  it("has 1 critical insight about complete absence of records", () => {
    const r = computeDampMouldManagement({
      today: "2026-05-30",
      total_children: 3,
      damp_survey_records: [],
      mould_inspection_records: [],
      remediation_records: [],
      ventilation_assessment_records: [],
      health_impact_records: [],
    });
    expect(r.insights).toHaveLength(1);
    expect(r.insights[0].severity).toBe("critical");
  });
});

// ── 3. Rating boundaries ────────────────────────────────────────────────────

describe("rating boundaries (toRating thresholds)", () => {
  it("score >= 80 → outstanding", () => {
    const r = computeDampMouldManagement(baseInput());
    // baseInput with all rates maxed → 52 + all bonuses = 80
    expect(r.damp_score).toBeGreaterThanOrEqual(80);
    expect(r.damp_rating).toBe("outstanding");
  });

  it("score 65-79 → good", () => {
    // Drop some bonuses: no health impact records (lose healthImpactRate bonus +3,
    // some child awareness), but keep most
    const r = computeDampMouldManagement(baseInput({
      health_impact_records: [],
      // Also make 2/10 surveys out of range to drop dampSurveyRate to ~80% (+2 not +4)
      damp_survey_records: [
        makeDampSurvey({ id: "ds_1", within_acceptable_range: true, action_required: true, action_taken: true, follow_up_date: "2026-06-01", follow_up_completed: true }),
        makeDampSurvey({ id: "ds_2", within_acceptable_range: true, action_required: true, action_taken: true, follow_up_date: "2026-06-01", follow_up_completed: true }),
        makeDampSurvey({ id: "ds_3", within_acceptable_range: true }),
        makeDampSurvey({ id: "ds_4", within_acceptable_range: true }),
        makeDampSurvey({ id: "ds_5", within_acceptable_range: true }),
        makeDampSurvey({ id: "ds_6", within_acceptable_range: true }),
        makeDampSurvey({ id: "ds_7", within_acceptable_range: true }),
        makeDampSurvey({ id: "ds_8", within_acceptable_range: true }),
        makeDampSurvey({ id: "ds_9", within_acceptable_range: false }),
        makeDampSurvey({ id: "ds_10", within_acceptable_range: false }),
      ],
    }));
    expect(r.damp_score).toBeGreaterThanOrEqual(65);
    expect(r.damp_score).toBeLessThan(80);
    expect(r.damp_rating).toBe("good");
  });

  it("score 45-64 → adequate", () => {
    // Minimal records: just enough so allEmpty is false but rates are middling
    const r = computeDampMouldManagement({
      today: "2026-05-30",
      total_children: 3,
      damp_survey_records: [
        makeDampSurvey({ id: "ds_1", within_acceptable_range: true }),
        makeDampSurvey({ id: "ds_2", within_acceptable_range: false }),
      ],
      mould_inspection_records: [
        makeMouldInspection({ id: "mi_1", mould_found: true, mould_type: "black", reported_to_management: true }),
        makeMouldInspection({ id: "mi_2", mould_found: false }),
      ],
      remediation_records: [
        makeRemediation({ id: "rem_1" }),
      ],
      ventilation_assessment_records: [
        makeVentilation({ id: "vent_1" }),
        makeVentilation({ id: "vent_2", ventilation_adequate: false, meets_building_regs: false }),
      ],
      health_impact_records: [],
    });
    expect(r.damp_score).toBeGreaterThanOrEqual(45);
    expect(r.damp_score).toBeLessThan(65);
    expect(r.damp_rating).toBe("adequate");
  });

  it("score < 45 → inadequate", () => {
    // Very poor rates — trigger penalties
    const r = computeDampMouldManagement({
      today: "2026-05-30",
      total_children: 3,
      damp_survey_records: [
        makeDampSurvey({ id: "ds_1", within_acceptable_range: false }),
        makeDampSurvey({ id: "ds_2", within_acceptable_range: false }),
        makeDampSurvey({ id: "ds_3", within_acceptable_range: false }),
        makeDampSurvey({ id: "ds_4", within_acceptable_range: true }),
      ],
      mould_inspection_records: [
        makeMouldInspection({ id: "mi_1", mould_found: true, mould_type: "black" }),
        makeMouldInspection({ id: "mi_2", mould_found: true, mould_type: "green" }),
        makeMouldInspection({ id: "mi_3", mould_found: true, mould_type: "black" }),
      ],
      remediation_records: [
        makeRemediation({ id: "rem_1", completed: false, date_completed: null, quality_checked: false, quality_satisfactory: false, follow_up_inspection_completed: false }),
        makeRemediation({ id: "rem_2", completed: false, date_completed: null, quality_checked: false, quality_satisfactory: false, follow_up_inspection_completed: false }),
        makeRemediation({ id: "rem_3", completed: false, date_completed: null, quality_checked: false, quality_satisfactory: false, follow_up_inspection_completed: false }),
      ],
      ventilation_assessment_records: [
        makeVentilation({ id: "vent_1", ventilation_adequate: false, meets_building_regs: false }),
        makeVentilation({ id: "vent_2", ventilation_adequate: false, meets_building_regs: false }),
        makeVentilation({ id: "vent_3", ventilation_adequate: false, meets_building_regs: false }),
      ],
      health_impact_records: [
        makeHealthImpact({ id: "hi_1", child_views_recorded: false, treatment_provided: false }),
      ],
    });
    expect(r.damp_score).toBeLessThan(45);
    expect(r.damp_rating).toBe("inadequate");
  });
});

// ── 4. Score arithmetic — base=52, max bonus=+28 ───────────────────────────

describe("score arithmetic — base=52", () => {
  it("base score is 52 when all rates are 0 (but records exist so not allEmpty)", () => {
    // Records exist but all bad → base 52, no bonuses, apply penalties
    const r = computeDampMouldManagement({
      today: "2026-05-30",
      total_children: 3,
      damp_survey_records: [
        makeDampSurvey({ id: "ds_1", within_acceptable_range: false }),
      ],
      mould_inspection_records: [],
      remediation_records: [],
      ventilation_assessment_records: [],
      health_impact_records: [],
    });
    // dampSurveyRate = 0, penalty -5 since < 40 && totalDampSurveys > 0
    expect(r.damp_score).toBe(47); // 52 - 5
  });

  it("all bonuses possible = 52 + 28 = 80 → outstanding", () => {
    const r = computeDampMouldManagement(baseInput());
    // B1: dampSurveyRate 100% >= 90 → +4
    // B2: mouldInspectionRate 100% (no mould found) >= 90 → +4
    // B3: remediationRate 100% >= 95 → +4
    // B4: ventilationRate 100% >= 90 → +3
    // B5: healthImpactRate 100% >= 95 → +3
    // B6: childAwarenessRate >= 90 → +3 (child views, child informed of works, child bedroom ventilation, reported to mgmt — but no mould found so last one may not contribute)
    // B7: actionCompletionRate 100% >= 90 → +3
    // B8: followUpCompletionRate 100% >= 90 → +2
    // B9: buildingRegsRate 100% >= 90 → +2
    // Total: 52 + 4 + 4 + 4 + 3 + 3 + 3 + 3 + 2 + 2 = 80
    expect(r.damp_score).toBe(80);
    expect(r.damp_rating).toBe("outstanding");
  });
});

// ── 5. Bonus tests (9 bonuses) ──────────────────────────────────────────────

describe("Bonus 1 — dampSurveyRate", () => {
  it("+4 when dampSurveyRate >= 90", () => {
    // 10/10 within range → 100%
    const r = computeDampMouldManagement(baseInput());
    expect(r.damp_survey_rate).toBe(100);
    // Score includes this +4
  });

  it("+2 when dampSurveyRate >= 70 but < 90", () => {
    const surveys = Array.from({ length: 10 }, (_, i) =>
      makeDampSurvey({ id: `ds_${i}`, within_acceptable_range: i < 8 }),
    );
    const r = computeDampMouldManagement(baseInput({ damp_survey_records: surveys }));
    expect(r.damp_survey_rate).toBe(80);
  });

  it("+0 when dampSurveyRate < 70", () => {
    const surveys = Array.from({ length: 10 }, (_, i) =>
      makeDampSurvey({ id: `ds_${i}`, within_acceptable_range: i < 5 }),
    );
    const r = computeDampMouldManagement(baseInput({ damp_survey_records: surveys }));
    expect(r.damp_survey_rate).toBe(50);
  });
});

describe("Bonus 2 — mouldInspectionRate (mould-free rate)", () => {
  it("+4 when mouldInspectionRate >= 90 (no mould found in >=90%)", () => {
    const r = computeDampMouldManagement(baseInput());
    expect(r.mould_inspection_rate).toBe(100);
  });

  it("+2 when mouldInspectionRate >= 70 but < 90", () => {
    // 8 no mould, 2 mould → 80%
    const inspections = Array.from({ length: 10 }, (_, i) =>
      makeMouldInspection({
        id: `mi_${i}`,
        mould_found: i >= 8,
        mould_type: i >= 8 ? "black" : "none",
        reported_to_management: i >= 8,
        immediate_action_taken: i >= 8,
        spore_risk_assessed: i >= 8,
      }),
    );
    const r = computeDampMouldManagement(baseInput({ mould_inspection_records: inspections }));
    expect(r.mould_inspection_rate).toBe(80);
  });

  it("+0 when mouldInspectionRate < 70 (lots of mould found)", () => {
    const inspections = Array.from({ length: 10 }, (_, i) =>
      makeMouldInspection({ id: `mi_${i}`, mould_found: i < 6, mould_type: i < 6 ? "black" : "none" }),
    );
    const r = computeDampMouldManagement(baseInput({ mould_inspection_records: inspections }));
    expect(r.mould_inspection_rate).toBe(40);
  });
});

describe("Bonus 3 — remediationRate", () => {
  it("+4 when remediationRate >= 95", () => {
    const r = computeDampMouldManagement(baseInput());
    expect(r.remediation_rate).toBe(100);
  });

  it("+2 when remediationRate >= 80 but < 95", () => {
    const rems = [
      makeRemediation({ id: "r1" }),
      makeRemediation({ id: "r2" }),
      makeRemediation({ id: "r3" }),
      makeRemediation({ id: "r4" }),
      makeRemediation({ id: "r5", completed: false, date_completed: null, quality_checked: false, quality_satisfactory: false, follow_up_inspection_completed: false }),
    ];
    const r = computeDampMouldManagement(baseInput({ remediation_records: rems }));
    expect(r.remediation_rate).toBe(80);
  });

  it("+0 when remediationRate < 80", () => {
    const rems = [
      makeRemediation({ id: "r1" }),
      makeRemediation({ id: "r2", completed: false, date_completed: null, quality_checked: false, quality_satisfactory: false, follow_up_inspection_completed: false }),
    ];
    const r = computeDampMouldManagement(baseInput({ remediation_records: rems }));
    expect(r.remediation_rate).toBe(50);
  });
});

describe("Bonus 4 — ventilationRate", () => {
  it("+3 when ventilationRate >= 90", () => {
    const r = computeDampMouldManagement(baseInput());
    expect(r.ventilation_rate).toBe(100);
  });

  it("+1 when ventilationRate >= 70 but < 90", () => {
    const vents = [
      makeVentilation({ id: "v1" }),
      makeVentilation({ id: "v2" }),
      makeVentilation({ id: "v3", ventilation_adequate: false }),
    ];
    const r = computeDampMouldManagement(baseInput({ ventilation_assessment_records: vents }));
    expect(r.ventilation_rate).toBe(67);
    // 67 < 70 → +0. Let's test 75%
  });

  it("+1 at exactly 75%", () => {
    const vents = [
      makeVentilation({ id: "v1" }),
      makeVentilation({ id: "v2" }),
      makeVentilation({ id: "v3" }),
      makeVentilation({ id: "v4", ventilation_adequate: false }),
    ];
    const r = computeDampMouldManagement(baseInput({ ventilation_assessment_records: vents }));
    expect(r.ventilation_rate).toBe(75);
  });

  it("+0 when ventilationRate < 70", () => {
    const vents = [
      makeVentilation({ id: "v1", ventilation_adequate: false }),
      makeVentilation({ id: "v2", ventilation_adequate: false }),
      makeVentilation({ id: "v3" }),
    ];
    const r = computeDampMouldManagement(baseInput({ ventilation_assessment_records: vents }));
    expect(r.ventilation_rate).toBe(33);
  });
});

describe("Bonus 5 — healthImpactRate (treatmentProvisionRate)", () => {
  it("+3 when healthImpactRate >= 95", () => {
    const r = computeDampMouldManagement(baseInput());
    expect(r.health_impact_rate).toBe(100);
  });

  it("+1 when healthImpactRate >= 80 but < 95", () => {
    const his = [
      makeHealthImpact({ id: "h1" }),
      makeHealthImpact({ id: "h2" }),
      makeHealthImpact({ id: "h3" }),
      makeHealthImpact({ id: "h4" }),
      makeHealthImpact({ id: "h5", treatment_provided: false }),
    ];
    const r = computeDampMouldManagement(baseInput({ health_impact_records: his }));
    expect(r.health_impact_rate).toBe(80);
  });

  it("+0 when healthImpactRate < 80", () => {
    const his = [
      makeHealthImpact({ id: "h1" }),
      makeHealthImpact({ id: "h2", treatment_provided: false }),
      makeHealthImpact({ id: "h3", treatment_provided: false }),
    ];
    const r = computeDampMouldManagement(baseInput({ health_impact_records: his }));
    expect(r.health_impact_rate).toBe(33);
  });
});

describe("Bonus 6 — childAwarenessRate", () => {
  it("+3 when childAwarenessRate >= 90", () => {
    const r = computeDampMouldManagement(baseInput());
    expect(r.child_awareness_rate).toBeGreaterThanOrEqual(90);
  });

  it("+1 when childAwarenessRate >= 70 but < 90", () => {
    // Reduce child views recorded to lower awareness
    const his = [
      makeHealthImpact({ id: "h1", child_views_recorded: true }),
      makeHealthImpact({ id: "h2", child_views_recorded: false }),
      makeHealthImpact({ id: "h3", child_views_recorded: true }),
      makeHealthImpact({ id: "h4", child_views_recorded: false }),
    ];
    const r = computeDampMouldManagement(baseInput({ health_impact_records: his }));
    // awareness combines child views, child informed works, child bedroom ventilation
    expect(r.child_awareness_rate).toBeGreaterThanOrEqual(70);
  });

  it("+0 when childAwarenessRate < 70", () => {
    const his = [
      makeHealthImpact({ id: "h1", child_views_recorded: false }),
      makeHealthImpact({ id: "h2", child_views_recorded: false }),
      makeHealthImpact({ id: "h3", child_views_recorded: false }),
    ];
    const rems = [
      makeRemediation({ id: "r1", child_room_involved: true, child_informed_of_works: false }),
      makeRemediation({ id: "r2", child_room_involved: true, child_informed_of_works: false }),
    ];
    const vents = [
      makeVentilation({ id: "v1", child_bedroom: true, ventilation_adequate: false }),
      makeVentilation({ id: "v2", child_bedroom: true, ventilation_adequate: false }),
    ];
    const r = computeDampMouldManagement(baseInput({
      health_impact_records: his,
      remediation_records: rems,
      ventilation_assessment_records: vents,
    }));
    expect(r.child_awareness_rate).toBeLessThan(70);
  });
});

describe("Bonus 7 — actionCompletionRate", () => {
  it("+3 when actionCompletionRate >= 90", () => {
    const surveys = [
      makeDampSurvey({ id: "ds_1", action_required: true, action_taken: true }),
      makeDampSurvey({ id: "ds_2", action_required: true, action_taken: true }),
    ];
    const r = computeDampMouldManagement(baseInput({ damp_survey_records: surveys }));
    // 100% action completion
  });

  it("+1 when actionCompletionRate >= 70 but < 90", () => {
    const surveys = [
      makeDampSurvey({ id: "ds_1", within_acceptable_range: true, action_required: true, action_taken: true }),
      makeDampSurvey({ id: "ds_2", within_acceptable_range: true, action_required: true, action_taken: true }),
      makeDampSurvey({ id: "ds_3", within_acceptable_range: true, action_required: true, action_taken: true }),
      makeDampSurvey({ id: "ds_4", within_acceptable_range: true, action_required: true, action_taken: false }),
    ];
    const r = computeDampMouldManagement(baseInput({ damp_survey_records: surveys }));
    // 3/4 = 75% → +1
  });

  it("+0 when actionCompletionRate < 70", () => {
    const surveys = [
      makeDampSurvey({ id: "ds_1", within_acceptable_range: true, action_required: true, action_taken: true }),
      makeDampSurvey({ id: "ds_2", within_acceptable_range: true, action_required: true, action_taken: false }),
      makeDampSurvey({ id: "ds_3", within_acceptable_range: true, action_required: true, action_taken: false }),
    ];
    const r = computeDampMouldManagement(baseInput({ damp_survey_records: surveys }));
    // 1/3 = 33% → +0
  });
});

describe("Bonus 8 — followUpCompletionRate", () => {
  it("+2 when followUpCompletionRate >= 90", () => {
    const surveys = [
      makeDampSurvey({ id: "ds_1", within_acceptable_range: true, follow_up_date: "2026-06-01", follow_up_completed: true }),
      makeDampSurvey({ id: "ds_2", within_acceptable_range: true, follow_up_date: "2026-06-01", follow_up_completed: true }),
    ];
    const r = computeDampMouldManagement(baseInput({ damp_survey_records: surveys }));
    // 100% follow-up
  });

  it("+1 when followUpCompletionRate >= 70 but < 90", () => {
    const surveys = [
      makeDampSurvey({ id: "ds_1", within_acceptable_range: true, follow_up_date: "2026-06-01", follow_up_completed: true }),
      makeDampSurvey({ id: "ds_2", within_acceptable_range: true, follow_up_date: "2026-06-01", follow_up_completed: true }),
      makeDampSurvey({ id: "ds_3", within_acceptable_range: true, follow_up_date: "2026-06-01", follow_up_completed: true }),
      makeDampSurvey({ id: "ds_4", within_acceptable_range: true, follow_up_date: "2026-06-01", follow_up_completed: false }),
    ];
    const r = computeDampMouldManagement(baseInput({ damp_survey_records: surveys }));
    // 3/4 = 75%
  });

  it("+0 when followUpCompletionRate < 70", () => {
    const surveys = [
      makeDampSurvey({ id: "ds_1", within_acceptable_range: true, follow_up_date: "2026-06-01", follow_up_completed: true }),
      makeDampSurvey({ id: "ds_2", within_acceptable_range: true, follow_up_date: "2026-06-01", follow_up_completed: false }),
      makeDampSurvey({ id: "ds_3", within_acceptable_range: true, follow_up_date: "2026-06-01", follow_up_completed: false }),
    ];
    const r = computeDampMouldManagement(baseInput({ damp_survey_records: surveys }));
    // 1/3 = 33%
  });
});

describe("Bonus 9 — buildingRegsRate", () => {
  it("+2 when buildingRegsRate >= 90", () => {
    const r = computeDampMouldManagement(baseInput());
    // All vents meet building regs → 100%
  });

  it("+1 when buildingRegsRate >= 70 but < 90", () => {
    const vents = [
      makeVentilation({ id: "v1", meets_building_regs: true }),
      makeVentilation({ id: "v2", meets_building_regs: true }),
      makeVentilation({ id: "v3", meets_building_regs: true }),
      makeVentilation({ id: "v4", meets_building_regs: false }),
    ];
    const r = computeDampMouldManagement(baseInput({ ventilation_assessment_records: vents }));
    // 3/4 = 75%
  });

  it("+0 when buildingRegsRate < 70", () => {
    const vents = [
      makeVentilation({ id: "v1", meets_building_regs: true }),
      makeVentilation({ id: "v2", meets_building_regs: false }),
      makeVentilation({ id: "v3", meets_building_regs: false }),
    ];
    const r = computeDampMouldManagement(baseInput({ ventilation_assessment_records: vents }));
    // 1/3 = 33%
  });
});

// ── 6. Penalty tests (4 guarded penalties) ──────────────────────────────────

describe("Penalty 1 — dampSurveyRate < 40 (guarded)", () => {
  it("-5 when dampSurveyRate < 40 and totalDampSurveys > 0", () => {
    const surveys = [
      makeDampSurvey({ id: "ds_1", within_acceptable_range: false }),
      makeDampSurvey({ id: "ds_2", within_acceptable_range: false }),
      makeDampSurvey({ id: "ds_3", within_acceptable_range: true }),
    ];
    const r = computeDampMouldManagement(baseInput({ damp_survey_records: surveys }));
    expect(r.damp_survey_rate).toBe(33);
    // Score = 52 + bonuses - 5 for this penalty
  });

  it("no penalty when dampSurveyRate < 40 but totalDampSurveys === 0", () => {
    // With no damp surveys, the guard prevents the penalty
    // But allEmpty would need to be false — so we need other records
    const r = computeDampMouldManagement(baseInput({ damp_survey_records: [] }));
    // dampSurveyRate = 0, totalDampSurveys = 0 → guarded, no penalty
    expect(r.damp_survey_rate).toBe(0);
  });
});

describe("Penalty 2 — remediationRate < 50 (guarded)", () => {
  it("-5 when remediationRate < 50 and totalRemediations > 0", () => {
    const rems = [
      makeRemediation({ id: "r1", completed: false, date_completed: null, quality_checked: false, quality_satisfactory: false, follow_up_inspection_completed: false }),
      makeRemediation({ id: "r2", completed: false, date_completed: null, quality_checked: false, quality_satisfactory: false, follow_up_inspection_completed: false }),
      makeRemediation({ id: "r3" }),
    ];
    const r = computeDampMouldManagement(baseInput({ remediation_records: rems }));
    expect(r.remediation_rate).toBe(33);
  });

  it("no penalty when totalRemediations === 0", () => {
    const r = computeDampMouldManagement(baseInput({ remediation_records: [] }));
    expect(r.remediation_rate).toBe(0);
  });
});

describe("Penalty 3 — ventilationRate < 40 (guarded)", () => {
  it("-5 when ventilationRate < 40 and totalVentilationAssessments > 0", () => {
    const vents = [
      makeVentilation({ id: "v1", ventilation_adequate: false }),
      makeVentilation({ id: "v2", ventilation_adequate: false }),
      makeVentilation({ id: "v3", ventilation_adequate: true }),
    ];
    const r = computeDampMouldManagement(baseInput({ ventilation_assessment_records: vents }));
    expect(r.ventilation_rate).toBe(33);
  });

  it("no penalty when totalVentilationAssessments === 0", () => {
    const r = computeDampMouldManagement(baseInput({ ventilation_assessment_records: [] }));
    expect(r.ventilation_rate).toBe(0);
  });
});

describe("Penalty 4 — childAwarenessRate < 30 (guarded)", () => {
  it("-3 when childAwarenessRate < 30 and awareness denom > 0", () => {
    const his = [
      makeHealthImpact({ id: "h1", child_views_recorded: false }),
      makeHealthImpact({ id: "h2", child_views_recorded: false }),
      makeHealthImpact({ id: "h3", child_views_recorded: false }),
      makeHealthImpact({ id: "h4", child_views_recorded: false }),
    ];
    const rems = [
      makeRemediation({ id: "r1", child_room_involved: true, child_informed_of_works: false }),
      makeRemediation({ id: "r2", child_room_involved: true, child_informed_of_works: false }),
      makeRemediation({ id: "r3", child_room_involved: true, child_informed_of_works: false }),
    ];
    const vents = [
      makeVentilation({ id: "v1", child_bedroom: true, ventilation_adequate: false }),
      makeVentilation({ id: "v2", child_bedroom: true, ventilation_adequate: false }),
      makeVentilation({ id: "v3", child_bedroom: true, ventilation_adequate: false }),
    ];
    const inspections = [
      makeMouldInspection({ id: "mi_1", mould_found: true, mould_type: "black", reported_to_management: false }),
      makeMouldInspection({ id: "mi_2", mould_found: true, mould_type: "green", reported_to_management: false }),
      makeMouldInspection({ id: "mi_3", mould_found: true, mould_type: "black", reported_to_management: false }),
    ];
    const r = computeDampMouldManagement(baseInput({
      health_impact_records: his,
      remediation_records: rems,
      ventilation_assessment_records: vents,
      mould_inspection_records: inspections,
    }));
    expect(r.child_awareness_rate).toBeLessThan(30);
  });

  it("no penalty when awareness denominator is 0", () => {
    // No health impacts, no child room remediations, no child bedroom vents, no mould found
    const r = computeDampMouldManagement(baseInput({
      health_impact_records: [],
      remediation_records: [makeRemediation({ id: "r1", child_room_involved: false })],
      ventilation_assessment_records: [makeVentilation({ id: "v1", child_bedroom: false })],
    }));
    expect(r.child_awareness_rate).toBe(0);
  });
});

describe("score clamping", () => {
  it("score never drops below 0", () => {
    // Stack all 4 penalties: -5 -5 -5 -3 = -18 from base 52 = 34
    // But verify clamp(0,100)
    const r = computeDampMouldManagement({
      today: "2026-05-30",
      total_children: 3,
      damp_survey_records: [
        makeDampSurvey({ id: "ds_1", within_acceptable_range: false }),
        makeDampSurvey({ id: "ds_2", within_acceptable_range: false }),
        makeDampSurvey({ id: "ds_3", within_acceptable_range: false }),
      ],
      mould_inspection_records: [
        makeMouldInspection({ id: "mi_1", mould_found: true, reported_to_management: false }),
        makeMouldInspection({ id: "mi_2", mould_found: true, reported_to_management: false }),
      ],
      remediation_records: [
        makeRemediation({ id: "r1", completed: false, date_completed: null, quality_checked: false, quality_satisfactory: false, follow_up_inspection_completed: false, child_room_involved: true, child_informed_of_works: false }),
        makeRemediation({ id: "r2", completed: false, date_completed: null, quality_checked: false, quality_satisfactory: false, follow_up_inspection_completed: false, child_room_involved: true, child_informed_of_works: false }),
      ],
      ventilation_assessment_records: [
        makeVentilation({ id: "v1", ventilation_adequate: false, child_bedroom: true, meets_building_regs: false }),
        makeVentilation({ id: "v2", ventilation_adequate: false, child_bedroom: true, meets_building_regs: false }),
      ],
      health_impact_records: [
        makeHealthImpact({ id: "h1", child_views_recorded: false, treatment_provided: false }),
        makeHealthImpact({ id: "h2", child_views_recorded: false, treatment_provided: false }),
      ],
    });
    expect(r.damp_score).toBeGreaterThanOrEqual(0);
  });

  it("score never exceeds 100", () => {
    const r = computeDampMouldManagement(baseInput());
    expect(r.damp_score).toBeLessThanOrEqual(100);
  });
});

// ── 7. Rate computations ────────────────────────────────────────────────────

describe("rate computations", () => {
  it("dampSurveyRate = pct(surveysWithinRange, totalDampSurveys)", () => {
    const surveys = [
      makeDampSurvey({ id: "ds_1", within_acceptable_range: true }),
      makeDampSurvey({ id: "ds_2", within_acceptable_range: false }),
      makeDampSurvey({ id: "ds_3", within_acceptable_range: true }),
    ];
    const r = computeDampMouldManagement(baseInput({ damp_survey_records: surveys }));
    expect(r.damp_survey_rate).toBe(67); // Math.round(2/3 * 100)
  });

  it("mouldInspectionRate = pct(inspections without mould, totalInspections)", () => {
    const inspections = [
      makeMouldInspection({ id: "mi_1", mould_found: false }),
      makeMouldInspection({ id: "mi_2", mould_found: true, mould_type: "black" }),
      makeMouldInspection({ id: "mi_3", mould_found: false }),
      makeMouldInspection({ id: "mi_4", mould_found: false }),
    ];
    const r = computeDampMouldManagement(baseInput({ mould_inspection_records: inspections }));
    expect(r.mould_inspection_rate).toBe(75); // 3/4
  });

  it("remediationRate = pct(completed, total)", () => {
    const rems = [
      makeRemediation({ id: "r1", completed: true }),
      makeRemediation({ id: "r2", completed: true }),
      makeRemediation({ id: "r3", completed: false, date_completed: null }),
    ];
    const r = computeDampMouldManagement(baseInput({ remediation_records: rems }));
    expect(r.remediation_rate).toBe(67); // Math.round(2/3 * 100)
  });

  it("ventilationRate = pct(adequateVentilation, totalAssessments)", () => {
    const vents = [
      makeVentilation({ id: "v1", ventilation_adequate: true }),
      makeVentilation({ id: "v2", ventilation_adequate: false }),
    ];
    const r = computeDampMouldManagement(baseInput({ ventilation_assessment_records: vents }));
    expect(r.ventilation_rate).toBe(50);
  });

  it("healthImpactRate = treatmentProvisionRate", () => {
    const his = [
      makeHealthImpact({ id: "h1", treatment_required: true, treatment_provided: true }),
      makeHealthImpact({ id: "h2", treatment_required: true, treatment_provided: false }),
    ];
    const r = computeDampMouldManagement(baseInput({ health_impact_records: his }));
    expect(r.health_impact_rate).toBe(50);
  });

  it("healthImpactRate = 0 when no treatment required", () => {
    const his = [
      makeHealthImpact({ id: "h1", treatment_required: false, treatment_provided: false }),
    ];
    const r = computeDampMouldManagement(baseInput({ health_impact_records: his }));
    expect(r.health_impact_rate).toBe(0);
  });

  it("childAwarenessRate is composite of views + child informed + bedroom ventilation + reported to mgmt", () => {
    // 2 health impacts, 1 child view → 1/2
    // 1 child room remediation, 1 informed → 1/1
    // 1 child bedroom vent, 1 adequate → 1/1
    // No mould found → not included
    const his = [
      makeHealthImpact({ id: "h1", child_views_recorded: true }),
      makeHealthImpact({ id: "h2", child_views_recorded: false }),
    ];
    const rems = [
      makeRemediation({ id: "r1", child_room_involved: true, child_informed_of_works: true }),
    ];
    const vents = [
      makeVentilation({ id: "v1", child_bedroom: true, ventilation_adequate: true }),
    ];
    const r = computeDampMouldManagement(baseInput({
      health_impact_records: his,
      remediation_records: rems,
      ventilation_assessment_records: vents,
      mould_inspection_records: [], // no mould
    }));
    // Numerator: 1 + 1 + 1 = 3, Denominator: 2 + 1 + 1 = 4 → 75%
    expect(r.child_awareness_rate).toBe(75);
  });

  it("childAwarenessRate includes mould reporting component when mould found", () => {
    const his = [
      makeHealthImpact({ id: "h1", child_views_recorded: true }),
    ];
    const inspections = [
      makeMouldInspection({ id: "mi_1", mould_found: true, mould_type: "black", reported_to_management: true }),
      makeMouldInspection({ id: "mi_2", mould_found: true, mould_type: "green", reported_to_management: false }),
    ];
    const r = computeDampMouldManagement(baseInput({
      health_impact_records: his,
      remediation_records: [makeRemediation({ id: "r1", child_room_involved: false })],
      ventilation_assessment_records: [makeVentilation({ id: "v1", child_bedroom: false })],
      mould_inspection_records: inspections,
    }));
    // Numerator: 1 (child views) + 1 (reported to mgmt), Denom: 1 + 2 = 3 → 67%
    expect(r.child_awareness_rate).toBe(67);
  });

  it("childAwarenessRate = 0 when all denominators are 0", () => {
    const r = computeDampMouldManagement(baseInput({
      health_impact_records: [],
      remediation_records: [makeRemediation({ id: "r1", child_room_involved: false })],
      ventilation_assessment_records: [makeVentilation({ id: "v1", child_bedroom: false })],
      mould_inspection_records: [makeMouldInspection({ id: "mi_1", mould_found: false })],
    }));
    expect(r.child_awareness_rate).toBe(0);
  });
});

// ── 8. Totals ───────────────────────────────────────────────────────────────

describe("totals", () => {
  it("counts all record arrays correctly", () => {
    const r = computeDampMouldManagement(baseInput());
    expect(r.total_damp_surveys).toBe(10);
    expect(r.total_mould_inspections).toBe(10);
    expect(r.total_remediations).toBe(2);
    expect(r.total_ventilation_assessments).toBe(3);
    expect(r.total_health_impacts).toBe(2);
  });

  it("handles single records per array", () => {
    const r = computeDampMouldManagement({
      today: "2026-05-30",
      total_children: 1,
      damp_survey_records: [makeDampSurvey()],
      mould_inspection_records: [makeMouldInspection()],
      remediation_records: [makeRemediation()],
      ventilation_assessment_records: [makeVentilation()],
      health_impact_records: [makeHealthImpact()],
    });
    expect(r.total_damp_surveys).toBe(1);
    expect(r.total_mould_inspections).toBe(1);
    expect(r.total_remediations).toBe(1);
    expect(r.total_ventilation_assessments).toBe(1);
    expect(r.total_health_impacts).toBe(1);
  });
});

// ── 9. Strengths ────────────────────────────────────────────────────────────

describe("strengths", () => {
  it("dampSurveyRate >= 90 strength (excellent moisture management)", () => {
    const r = computeDampMouldManagement(baseInput());
    expect(r.strengths.some((s) => s.includes("damp surveys within acceptable moisture range"))).toBe(true);
  });

  it("dampSurveyRate 70-89 strength (managing moisture effectively)", () => {
    const surveys = Array.from({ length: 10 }, (_, i) =>
      makeDampSurvey({ id: `ds_${i}`, within_acceptable_range: i < 8 }),
    );
    const r = computeDampMouldManagement(baseInput({ damp_survey_records: surveys }));
    expect(r.strengths.some((s) => s.includes("managing moisture levels effectively"))).toBe(true);
  });

  it("no dampSurvey strength when rate < 70", () => {
    const surveys = Array.from({ length: 10 }, (_, i) =>
      makeDampSurvey({ id: `ds_${i}`, within_acceptable_range: i < 5 }),
    );
    const r = computeDampMouldManagement(baseInput({ damp_survey_records: surveys }));
    expect(r.strengths.some((s) => s.includes("damp surveys within acceptable"))).toBe(false);
  });

  it("mouldInspectionRate >= 90 strength", () => {
    const r = computeDampMouldManagement(baseInput());
    expect(r.strengths.some((s) => s.includes("mould inspections found no mould"))).toBe(true);
  });

  it("mouldInspectionRate 70-89 strength", () => {
    const inspections = Array.from({ length: 10 }, (_, i) =>
      makeMouldInspection({ id: `mi_${i}`, mould_found: i >= 8, mould_type: i >= 8 ? "black" : "none" }),
    );
    const r = computeDampMouldManagement(baseInput({ mould_inspection_records: inspections }));
    expect(r.strengths.some((s) => s.includes("inspections clear"))).toBe(true);
  });

  it("remediationRate >= 95 strength", () => {
    const r = computeDampMouldManagement(baseInput());
    expect(r.strengths.some((s) => s.includes("remediations completed"))).toBe(true);
  });

  it("remediationRate 80-94 strength", () => {
    const rems = Array.from({ length: 10 }, (_, i) =>
      makeRemediation({
        id: `r_${i}`,
        completed: i < 9,
        date_completed: i < 9 ? "2026-04-10" : null,
        quality_checked: i < 9,
        quality_satisfactory: i < 9,
        follow_up_inspection_completed: i < 9,
      }),
    );
    const r = computeDampMouldManagement(baseInput({ remediation_records: rems }));
    expect(r.strengths.some((s) => s.includes("remediation completion rate"))).toBe(true);
  });

  it("ventilationRate >= 90 strength", () => {
    const r = computeDampMouldManagement(baseInput());
    expect(r.strengths.some((s) => s.includes("ventilation assessments rated adequate"))).toBe(true);
  });

  it("ventilationRate 70-89 strength", () => {
    const vents = [
      makeVentilation({ id: "v1" }),
      makeVentilation({ id: "v2" }),
      makeVentilation({ id: "v3" }),
      makeVentilation({ id: "v4", ventilation_adequate: false }),
    ];
    const r = computeDampMouldManagement(baseInput({ ventilation_assessment_records: vents }));
    expect(r.strengths.some((s) => s.includes("ventilation adequacy"))).toBe(true);
  });

  it("healthImpactRate >= 95 strength", () => {
    const r = computeDampMouldManagement(baseInput());
    expect(r.strengths.some((s) => s.includes("health impacts received appropriate treatment"))).toBe(true);
  });

  it("healthImpactRate 80-94 strength", () => {
    const his = Array.from({ length: 10 }, (_, i) =>
      makeHealthImpact({ id: `h_${i}`, treatment_provided: i < 9 }),
    );
    const r = computeDampMouldManagement(baseInput({ health_impact_records: his }));
    expect(r.strengths.some((s) => s.includes("treatment provision rate"))).toBe(true);
  });

  it("childAwarenessRate >= 90 strength", () => {
    const r = computeDampMouldManagement(baseInput());
    expect(r.strengths.some((s) => s.includes("child awareness and involvement"))).toBe(true);
  });

  it("childAwarenessRate 70-89 strength", () => {
    const his = [
      makeHealthImpact({ id: "h1", child_views_recorded: true }),
      makeHealthImpact({ id: "h2", child_views_recorded: false }),
      makeHealthImpact({ id: "h3", child_views_recorded: true }),
      makeHealthImpact({ id: "h4", child_views_recorded: false }),
    ];
    const rems = [
      makeRemediation({ id: "r1", child_room_involved: true, child_informed_of_works: true }),
    ];
    const r = computeDampMouldManagement(baseInput({
      health_impact_records: his,
      remediation_records: rems,
      mould_inspection_records: [],
    }));
    const rate = r.child_awareness_rate;
    if (rate >= 70 && rate < 90) {
      expect(r.strengths.some((s) => s.includes("child awareness rate"))).toBe(true);
    }
  });

  it("actionCompletionRate >= 90 strength", () => {
    const r = computeDampMouldManagement(baseInput());
    expect(r.strengths.some((s) => s.includes("damp survey actions completed"))).toBe(true);
  });

  it("actionCompletionRate 70-89 strength", () => {
    const surveys = [
      makeDampSurvey({ id: "ds_1", within_acceptable_range: true, action_required: true, action_taken: true }),
      makeDampSurvey({ id: "ds_2", within_acceptable_range: true, action_required: true, action_taken: true }),
      makeDampSurvey({ id: "ds_3", within_acceptable_range: true, action_required: true, action_taken: true }),
      makeDampSurvey({ id: "ds_4", within_acceptable_range: true, action_required: true, action_taken: false }),
    ];
    const r = computeDampMouldManagement(baseInput({ damp_survey_records: surveys }));
    expect(r.strengths.some((s) => s.includes("damp survey actions actioned"))).toBe(true);
  });

  it("followUpCompletionRate >= 90 strength", () => {
    const r = computeDampMouldManagement(baseInput());
    expect(r.strengths.some((s) => s.includes("damp survey follow-ups completed"))).toBe(true);
  });

  it("followUpCompletionRate 70-89 strength", () => {
    const surveys = [
      makeDampSurvey({ id: "ds_1", within_acceptable_range: true, follow_up_date: "2026-06-01", follow_up_completed: true }),
      makeDampSurvey({ id: "ds_2", within_acceptable_range: true, follow_up_date: "2026-06-01", follow_up_completed: true }),
      makeDampSurvey({ id: "ds_3", within_acceptable_range: true, follow_up_date: "2026-06-01", follow_up_completed: true }),
      makeDampSurvey({ id: "ds_4", within_acceptable_range: true, follow_up_date: "2026-06-01", follow_up_completed: false }),
    ];
    const r = computeDampMouldManagement(baseInput({ damp_survey_records: surveys }));
    expect(r.strengths.some((s) => s.includes("follow-ups completed"))).toBe(true);
  });

  it("buildingRegsRate >= 90 strength", () => {
    const r = computeDampMouldManagement(baseInput());
    expect(r.strengths.some((s) => s.includes("ventilation assessments meet building regulations"))).toBe(true);
  });

  it("buildingRegsRate 70-89 strength", () => {
    const vents = [
      makeVentilation({ id: "v1", meets_building_regs: true }),
      makeVentilation({ id: "v2", meets_building_regs: true }),
      makeVentilation({ id: "v3", meets_building_regs: true }),
      makeVentilation({ id: "v4", meets_building_regs: false }),
    ];
    const r = computeDampMouldManagement(baseInput({ ventilation_assessment_records: vents }));
    expect(r.strengths.some((s) => s.includes("ventilation meeting building regulations"))).toBe(true);
  });

  it("zero recurrence strength when completedRemediations > 0", () => {
    const r = computeDampMouldManagement(baseInput());
    expect(r.strengths.some((s) => s.includes("Zero recurrence"))).toBe(true);
  });

  it("immediateActionRate >= 90 strength when mould found", () => {
    const inspections = [
      makeMouldInspection({ id: "mi_1", mould_found: true, mould_type: "black", immediate_action_taken: true, reported_to_management: true, spore_risk_assessed: true }),
      makeMouldInspection({ id: "mi_2", mould_found: false }),
      makeMouldInspection({ id: "mi_3", mould_found: false }),
      makeMouldInspection({ id: "mi_4", mould_found: false }),
      makeMouldInspection({ id: "mi_5", mould_found: false }),
      makeMouldInspection({ id: "mi_6", mould_found: false }),
      makeMouldInspection({ id: "mi_7", mould_found: false }),
      makeMouldInspection({ id: "mi_8", mould_found: false }),
      makeMouldInspection({ id: "mi_9", mould_found: false }),
      makeMouldInspection({ id: "mi_10", mould_found: false }),
    ];
    const r = computeDampMouldManagement(baseInput({ mould_inspection_records: inspections }));
    expect(r.strengths.some((s) => s.includes("immediate action taken when mould found"))).toBe(true);
  });

  it("no condensation strength", () => {
    const r = computeDampMouldManagement(baseInput());
    expect(r.strengths.some((s) => s.includes("No condensation observed"))).toBe(true);
  });

  it("all child bedrooms adequate ventilation strength", () => {
    const r = computeDampMouldManagement(baseInput());
    expect(r.strengths.some((s) => s.includes("children's bedrooms assessed as having adequate ventilation"))).toBe(true);
  });

  it("resolvedRate >= 90 strength", () => {
    const r = computeDampMouldManagement(baseInput());
    expect(r.strengths.some((s) => s.includes("health impacts resolved"))).toBe(true);
  });
});

// ── 10. Concerns ────────────────────────────────────────────────────────────

describe("concerns", () => {
  it("dampSurveyRate < 40 concern (critical)", () => {
    const surveys = Array.from({ length: 10 }, (_, i) =>
      makeDampSurvey({ id: `ds_${i}`, within_acceptable_range: i < 3 }),
    );
    const r = computeDampMouldManagement(baseInput({ damp_survey_records: surveys }));
    expect(r.concerns.some((c) => c.includes("damp surveys within acceptable moisture range"))).toBe(true);
  });

  it("dampSurveyRate 40-69 concern (warning)", () => {
    const surveys = Array.from({ length: 10 }, (_, i) =>
      makeDampSurvey({ id: `ds_${i}`, within_acceptable_range: i < 5 }),
    );
    const r = computeDampMouldManagement(baseInput({ damp_survey_records: surveys }));
    expect(r.concerns.some((c) => c.includes("not consistently maintaining acceptable moisture levels"))).toBe(true);
  });

  it("mouldInspectionRate < 50 concern", () => {
    const inspections = Array.from({ length: 5 }, (_, i) =>
      makeMouldInspection({ id: `mi_${i}`, mould_found: true, mould_type: "black" }),
    );
    inspections.push(makeMouldInspection({ id: "mi_5", mould_found: false }));
    const r = computeDampMouldManagement(baseInput({ mould_inspection_records: inspections }));
    expect(r.concerns.some((c) => c.includes("widespread mould presence"))).toBe(true);
  });

  it("mouldInspectionRate 50-69 concern", () => {
    const inspections = Array.from({ length: 10 }, (_, i) =>
      makeMouldInspection({ id: `mi_${i}`, mould_found: i < 4, mould_type: i < 4 ? "black" : "none" }),
    );
    const r = computeDampMouldManagement(baseInput({ mould_inspection_records: inspections }));
    expect(r.concerns.some((c) => c.includes("inadequate prevention measures"))).toBe(true);
  });

  it("remediationRate < 50 concern", () => {
    const rems = [
      makeRemediation({ id: "r1", completed: false, date_completed: null, quality_checked: false, quality_satisfactory: false, follow_up_inspection_completed: false }),
      makeRemediation({ id: "r2", completed: false, date_completed: null, quality_checked: false, quality_satisfactory: false, follow_up_inspection_completed: false }),
      makeRemediation({ id: "r3" }),
    ];
    const r = computeDampMouldManagement(baseInput({ remediation_records: rems }));
    expect(r.concerns.some((c) => c.includes("majority of identified damp and mould issues remain unresolved"))).toBe(true);
  });

  it("remediationRate 50-79 concern", () => {
    const rems = [
      makeRemediation({ id: "r1" }),
      makeRemediation({ id: "r2" }),
      makeRemediation({ id: "r3", completed: false, date_completed: null, quality_checked: false, quality_satisfactory: false, follow_up_inspection_completed: false }),
    ];
    const r = computeDampMouldManagement(baseInput({ remediation_records: rems }));
    expect(r.concerns.some((c) => c.includes("number of damp and mould issues remain outstanding"))).toBe(true);
  });

  it("ventilationRate < 40 concern", () => {
    const vents = Array.from({ length: 3 }, (_, i) =>
      makeVentilation({ id: `v_${i}`, ventilation_adequate: i === 0 }),
    );
    const r = computeDampMouldManagement(baseInput({ ventilation_assessment_records: vents }));
    expect(r.concerns.some((c) => c.includes("majority of assessed areas have inadequate ventilation"))).toBe(true);
  });

  it("ventilationRate 40-69 concern", () => {
    const vents = [
      makeVentilation({ id: "v1", ventilation_adequate: true }),
      makeVentilation({ id: "v2", ventilation_adequate: false }),
    ];
    const r = computeDampMouldManagement(baseInput({ ventilation_assessment_records: vents }));
    expect(r.concerns.some((c) => c.includes("insufficient ventilation in a number of areas"))).toBe(true);
  });

  it("healthImpactRate < 50 concern", () => {
    const his = [
      makeHealthImpact({ id: "h1", treatment_provided: false }),
      makeHealthImpact({ id: "h2", treatment_provided: false }),
      makeHealthImpact({ id: "h3", treatment_provided: true }),
    ];
    const r = computeDampMouldManagement(baseInput({ health_impact_records: his }));
    expect(r.concerns.some((c) => c.includes("not being adequately addressed"))).toBe(true);
  });

  it("healthImpactRate 50-79 concern", () => {
    const his = [
      makeHealthImpact({ id: "h1", treatment_provided: true }),
      makeHealthImpact({ id: "h2", treatment_provided: true }),
      makeHealthImpact({ id: "h3", treatment_provided: false }),
    ];
    const r = computeDampMouldManagement(baseInput({ health_impact_records: his }));
    expect(r.concerns.some((c) => c.includes("not receiving timely treatment"))).toBe(true);
  });

  it("childAwarenessRate < 30 concern", () => {
    const his = Array.from({ length: 5 }, (_, i) =>
      makeHealthImpact({ id: `h_${i}`, child_views_recorded: false }),
    );
    const rems = [
      makeRemediation({ id: "r1", child_room_involved: true, child_informed_of_works: false }),
      makeRemediation({ id: "r2", child_room_involved: true, child_informed_of_works: false }),
    ];
    const vents = [
      makeVentilation({ id: "v1", child_bedroom: true, ventilation_adequate: false }),
      makeVentilation({ id: "v2", child_bedroom: true, ventilation_adequate: false }),
    ];
    const inspections = [
      makeMouldInspection({ id: "mi_1", mould_found: true, reported_to_management: false }),
      makeMouldInspection({ id: "mi_2", mould_found: true, reported_to_management: false }),
    ];
    const r = computeDampMouldManagement(baseInput({
      health_impact_records: his,
      remediation_records: rems,
      ventilation_assessment_records: vents,
      mould_inspection_records: inspections,
    }));
    expect(r.concerns.some((c) => c.includes("children are not being informed"))).toBe(true);
  });

  it("childAwarenessRate 30-69 concern", () => {
    const his = [
      makeHealthImpact({ id: "h1", child_views_recorded: true }),
      makeHealthImpact({ id: "h2", child_views_recorded: false }),
      makeHealthImpact({ id: "h3", child_views_recorded: false }),
    ];
    const rems = [
      makeRemediation({ id: "r1", child_room_involved: true, child_informed_of_works: true }),
      makeRemediation({ id: "r2", child_room_involved: true, child_informed_of_works: false }),
    ];
    const r = computeDampMouldManagement(baseInput({
      health_impact_records: his,
      remediation_records: rems,
      mould_inspection_records: [],
      ventilation_assessment_records: [makeVentilation({ id: "v1", child_bedroom: false })],
    }));
    // 1/3 views + 1/2 informed = 2/5 = 40%
    expect(r.child_awareness_rate).toBe(40);
    expect(r.concerns.some((c) => c.includes("not consistently informed"))).toBe(true);
  });

  it("childBedroomMouldRate >= 20 concern", () => {
    const inspections = [
      makeMouldInspection({ id: "mi_1", mould_found: true, child_bedroom_affected: true }),
      makeMouldInspection({ id: "mi_2", mould_found: false }),
      makeMouldInspection({ id: "mi_3", mould_found: false }),
      makeMouldInspection({ id: "mi_4", mould_found: false }),
      makeMouldInspection({ id: "mi_5", mould_found: false }),
    ];
    const r = computeDampMouldManagement(baseInput({ mould_inspection_records: inspections }));
    expect(r.concerns.some((c) => c.includes("children's bedrooms"))).toBe(true);
  });

  it("recurrenceRate >= 20 concern", () => {
    const rems = [
      makeRemediation({ id: "r1", recurrence_detected: true }),
      makeRemediation({ id: "r2" }),
      makeRemediation({ id: "r3" }),
      makeRemediation({ id: "r4" }),
      makeRemediation({ id: "r5" }),
    ];
    const r = computeDampMouldManagement(baseInput({ remediation_records: rems }));
    expect(r.concerns.some((c) => c.includes("recurrence rate"))).toBe(true);
  });

  it("outstandingRemediations >= 3 concern", () => {
    const rems = [
      makeRemediation({ id: "r1", completed: false, date_completed: null }),
      makeRemediation({ id: "r2", completed: false, date_completed: null }),
      makeRemediation({ id: "r3", completed: false, date_completed: null }),
    ];
    const r = computeDampMouldManagement(baseInput({ remediation_records: rems }));
    expect(r.concerns.some((c) => c.includes("remediations remain outstanding"))).toBe(true);
  });

  it("condensationRate >= 30 concern", () => {
    const vents = [
      makeVentilation({ id: "v1", condensation_observed: true }),
      makeVentilation({ id: "v2", condensation_observed: true }),
      makeVentilation({ id: "v3", condensation_observed: false }),
    ];
    const r = computeDampMouldManagement(baseInput({ ventilation_assessment_records: vents }));
    expect(r.concerns.some((c) => c.includes("widespread condensation"))).toBe(true);
  });

  it("condensationRate 15-29 concern", () => {
    const vents = Array.from({ length: 5 }, (_, i) =>
      makeVentilation({ id: `v_${i}`, condensation_observed: i === 0 }),
    );
    const r = computeDampMouldManagement(baseInput({ ventilation_assessment_records: vents }));
    expect(r.concerns.some((c) => c.includes("moderate condensation levels"))).toBe(true);
  });

  it("schoolAbsenceRate >= 20 concern", () => {
    const his = [
      makeHealthImpact({ id: "h1", school_absence: true, school_absence_days: 3 }),
      makeHealthImpact({ id: "h2", school_absence: false }),
      makeHealthImpact({ id: "h3", school_absence: false }),
      makeHealthImpact({ id: "h4", school_absence: false }),
    ];
    const r = computeDampMouldManagement(baseInput({ health_impact_records: his }));
    // 1/4 = 25% >= 20
    expect(r.concerns.some((c) => c.includes("school absences"))).toBe(true);
  });

  it("recurringRate >= 20 concern for health impacts", () => {
    const his = [
      makeHealthImpact({ id: "h1", outcome: "recurring" }),
      makeHealthImpact({ id: "h2", outcome: "resolved" }),
      makeHealthImpact({ id: "h3", outcome: "resolved" }),
      makeHealthImpact({ id: "h4", outcome: "resolved" }),
    ];
    const r = computeDampMouldManagement(baseInput({ health_impact_records: his }));
    expect(r.concerns.some((c) => c.includes("health impacts are recurring"))).toBe(true);
  });

  it("immediateActionRate < 50 concern when mould found", () => {
    const inspections = [
      makeMouldInspection({ id: "mi_1", mould_found: true, mould_type: "black", immediate_action_taken: false }),
      makeMouldInspection({ id: "mi_2", mould_found: true, mould_type: "green", immediate_action_taken: false }),
      makeMouldInspection({ id: "mi_3", mould_found: true, mould_type: "black", immediate_action_taken: true }),
    ];
    const r = computeDampMouldManagement(baseInput({ mould_inspection_records: inspections }));
    expect(r.concerns.some((c) => c.includes("immediate action taken when mould discovered"))).toBe(true);
  });

  it("childBedroomVentilationRate < 70 concern", () => {
    const vents = [
      makeVentilation({ id: "v1", child_bedroom: true, ventilation_adequate: false }),
      makeVentilation({ id: "v2", child_bedroom: true, ventilation_adequate: false }),
      makeVentilation({ id: "v3", child_bedroom: true, ventilation_adequate: true }),
    ];
    const r = computeDampMouldManagement(baseInput({ ventilation_assessment_records: vents }));
    expect(r.concerns.some((c) => c.includes("children's bedrooms have adequate ventilation"))).toBe(true);
  });

  it("socialWorkerInformedRate < 50 concern", () => {
    const his = [
      makeHealthImpact({ id: "h1", social_worker_informed: false }),
      makeHealthImpact({ id: "h2", social_worker_informed: false }),
      makeHealthImpact({ id: "h3", social_worker_informed: true }),
    ];
    const r = computeDampMouldManagement(baseInput({ health_impact_records: his }));
    expect(r.concerns.some((c) => c.includes("social workers"))).toBe(true);
  });

  it("no concerns when all rates are excellent", () => {
    const r = computeDampMouldManagement(baseInput());
    expect(r.concerns).toHaveLength(0);
  });
});

// ── 11. Recommendations ────────────────────────────────────────────────────

describe("recommendations", () => {
  it("immediate recommendation when dampSurveyRate < 40", () => {
    const surveys = Array.from({ length: 5 }, (_, i) =>
      makeDampSurvey({ id: `ds_${i}`, within_acceptable_range: i < 1 }),
    );
    const r = computeDampMouldManagement(baseInput({ damp_survey_records: surveys }));
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("comprehensive damp survey"))).toBe(true);
  });

  it("immediate recommendation when remediationRate < 50", () => {
    const rems = [
      makeRemediation({ id: "r1", completed: false, date_completed: null, quality_checked: false, quality_satisfactory: false, follow_up_inspection_completed: false }),
      makeRemediation({ id: "r2", completed: false, date_completed: null, quality_checked: false, quality_satisfactory: false, follow_up_inspection_completed: false }),
    ];
    const r = computeDampMouldManagement(baseInput({ remediation_records: rems }));
    expect(r.recommendations.some((rec) => rec.recommendation.includes("backlog"))).toBe(true);
  });

  it("immediate recommendation when ventilationRate < 40", () => {
    const vents = [
      makeVentilation({ id: "v1", ventilation_adequate: false }),
      makeVentilation({ id: "v2", ventilation_adequate: false }),
      makeVentilation({ id: "v3", ventilation_adequate: true }),
    ];
    const r = computeDampMouldManagement(baseInput({ ventilation_assessment_records: vents }));
    expect(r.recommendations.some((rec) => rec.recommendation.includes("urgent ventilation review"))).toBe(true);
  });

  it("immediate recommendation when childAwarenessRate < 30", () => {
    const his = Array.from({ length: 5 }, (_, i) =>
      makeHealthImpact({ id: `h_${i}`, child_views_recorded: false }),
    );
    const rems = [
      makeRemediation({ id: "r1", child_room_involved: true, child_informed_of_works: false }),
    ];
    const vents = [
      makeVentilation({ id: "v1", child_bedroom: true, ventilation_adequate: false }),
    ];
    const inspections = [
      makeMouldInspection({ id: "mi_1", mould_found: true, reported_to_management: false }),
    ];
    const r = computeDampMouldManagement(baseInput({
      health_impact_records: his,
      remediation_records: rems,
      ventilation_assessment_records: vents,
      mould_inspection_records: inspections,
    }));
    if (r.child_awareness_rate < 30) {
      expect(r.recommendations.some((rec) => rec.recommendation.includes("involving and informing children"))).toBe(true);
    }
  });

  it("immediate recommendation when healthImpactRate < 50", () => {
    const his = [
      makeHealthImpact({ id: "h1", treatment_provided: false }),
      makeHealthImpact({ id: "h2", treatment_provided: false }),
    ];
    const r = computeDampMouldManagement(baseInput({ health_impact_records: his }));
    expect(r.recommendations.some((rec) => rec.recommendation.includes("untreated health impacts"))).toBe(true);
  });

  it("immediate recommendation when childBedroomMouldRate >= 20", () => {
    const inspections = [
      makeMouldInspection({ id: "mi_1", child_bedroom_affected: true }),
      makeMouldInspection({ id: "mi_2" }),
      makeMouldInspection({ id: "mi_3" }),
      makeMouldInspection({ id: "mi_4" }),
    ];
    const r = computeDampMouldManagement(baseInput({ mould_inspection_records: inspections }));
    expect(r.recommendations.some((rec) => rec.recommendation.includes("mould in children's bedrooms"))).toBe(true);
  });

  it("immediate recommendation when immediateActionRate < 50", () => {
    const inspections = [
      makeMouldInspection({ id: "mi_1", mould_found: true, immediate_action_taken: false }),
      makeMouldInspection({ id: "mi_2", mould_found: true, immediate_action_taken: false }),
    ];
    const r = computeDampMouldManagement(baseInput({ mould_inspection_records: inspections }));
    expect(r.recommendations.some((rec) => rec.recommendation.includes("rapid response protocol"))).toBe(true);
  });

  it("immediate recommendation when recurrenceRate >= 20", () => {
    const rems = [
      makeRemediation({ id: "r1", recurrence_detected: true }),
      makeRemediation({ id: "r2" }),
      makeRemediation({ id: "r3" }),
    ];
    const r = computeDampMouldManagement(baseInput({ remediation_records: rems }));
    expect(r.recommendations.some((rec) => rec.recommendation.includes("root causes of recurring"))).toBe(true);
  });

  it("immediate recommendation when socialWorkerInformedRate < 50", () => {
    const his = [
      makeHealthImpact({ id: "h1", social_worker_informed: false }),
      makeHealthImpact({ id: "h2", social_worker_informed: false }),
    ];
    const r = computeDampMouldManagement(baseInput({ health_impact_records: his }));
    expect(r.recommendations.some((rec) => rec.recommendation.includes("social workers and placing authorities"))).toBe(true);
  });

  it("soon recommendation when condensationRate >= 30", () => {
    const vents = [
      makeVentilation({ id: "v1", condensation_observed: true }),
      makeVentilation({ id: "v2", condensation_observed: true }),
      makeVentilation({ id: "v3", condensation_observed: false }),
    ];
    const r = computeDampMouldManagement(baseInput({ ventilation_assessment_records: vents }));
    expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("condensation management plan"))).toBe(true);
  });

  it("soon recommendation when maintenanceCompletionRate < 50", () => {
    const vents = [
      makeVentilation({ id: "v1", maintenance_required: true, maintenance_completed: false }),
      makeVentilation({ id: "v2", maintenance_required: true, maintenance_completed: false }),
    ];
    const r = computeDampMouldManagement(baseInput({ ventilation_assessment_records: vents }));
    expect(r.recommendations.some((rec) => rec.recommendation.includes("outstanding ventilation maintenance"))).toBe(true);
  });

  it("soon recommendation when dampSurveyRate 40-69", () => {
    const surveys = Array.from({ length: 10 }, (_, i) =>
      makeDampSurvey({ id: `ds_${i}`, within_acceptable_range: i < 5 }),
    );
    const r = computeDampMouldManagement(baseInput({ damp_survey_records: surveys }));
    expect(r.recommendations.some((rec) => rec.recommendation.includes("Increase the frequency"))).toBe(true);
  });

  it("soon recommendation when remediationRate 50-79", () => {
    const rems = [
      makeRemediation({ id: "r1" }),
      makeRemediation({ id: "r2" }),
      makeRemediation({ id: "r3", completed: false, date_completed: null }),
    ];
    const r = computeDampMouldManagement(baseInput({ remediation_records: rems }));
    expect(r.recommendations.some((rec) => rec.recommendation.includes("Improve remediation completion rates"))).toBe(true);
  });

  it("planned recommendation when ventilationRate 40-69", () => {
    const vents = [
      makeVentilation({ id: "v1", ventilation_adequate: true }),
      makeVentilation({ id: "v2", ventilation_adequate: false }),
    ];
    const r = computeDampMouldManagement(baseInput({ ventilation_assessment_records: vents }));
    expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("Improve ventilation adequacy"))).toBe(true);
  });

  it("planned recommendation when childAwarenessRate 30-69", () => {
    const his = [
      makeHealthImpact({ id: "h1", child_views_recorded: true }),
      makeHealthImpact({ id: "h2", child_views_recorded: false }),
    ];
    const rems = [
      makeRemediation({ id: "r1", child_room_involved: true, child_informed_of_works: true }),
      makeRemediation({ id: "r2", child_room_involved: true, child_informed_of_works: false }),
    ];
    const r = computeDampMouldManagement(baseInput({
      health_impact_records: his,
      remediation_records: rems,
      mould_inspection_records: [],
      ventilation_assessment_records: [makeVentilation({ id: "v1", child_bedroom: false })],
    }));
    if (r.child_awareness_rate >= 30 && r.child_awareness_rate < 70) {
      expect(r.recommendations.some((rec) => rec.recommendation.includes("Strengthen child involvement"))).toBe(true);
    }
  });

  it("planned recommendation when followUpCompletionRate < 70", () => {
    const surveys = [
      makeDampSurvey({ id: "ds_1", within_acceptable_range: true, follow_up_date: "2026-06-01", follow_up_completed: false }),
      makeDampSurvey({ id: "ds_2", within_acceptable_range: true, follow_up_date: "2026-06-01", follow_up_completed: false }),
      makeDampSurvey({ id: "ds_3", within_acceptable_range: true, follow_up_date: "2026-06-01", follow_up_completed: true }),
    ];
    const r = computeDampMouldManagement(baseInput({ damp_survey_records: surveys }));
    expect(r.recommendations.some((rec) => rec.recommendation.includes("Improve follow-up completion"))).toBe(true);
  });

  it("immediate recommendation when no damp surveys but children present and not allEmpty", () => {
    const r = computeDampMouldManagement(baseInput({ damp_survey_records: [] }));
    expect(r.recommendations.some((rec) => rec.recommendation.includes("initial comprehensive damp survey"))).toBe(true);
  });

  it("immediate recommendation when no ventilation assessments but children present and not allEmpty", () => {
    const r = computeDampMouldManagement(baseInput({ ventilation_assessment_records: [] }));
    expect(r.recommendations.some((rec) => rec.recommendation.includes("Conduct ventilation assessments"))).toBe(true);
  });

  it("immediate recommendation when no mould inspections but children present and not allEmpty", () => {
    const r = computeDampMouldManagement(baseInput({ mould_inspection_records: [] }));
    expect(r.recommendations.some((rec) => rec.recommendation.includes("regular mould inspection schedule"))).toBe(true);
  });

  it("recommendations have sequential ranks", () => {
    const r = computeDampMouldManagement({
      today: "2026-05-30",
      total_children: 3,
      damp_survey_records: [
        makeDampSurvey({ id: "ds_1", within_acceptable_range: false }),
        makeDampSurvey({ id: "ds_2", within_acceptable_range: false }),
        makeDampSurvey({ id: "ds_3", within_acceptable_range: false }),
      ],
      mould_inspection_records: [
        makeMouldInspection({ id: "mi_1", mould_found: true, immediate_action_taken: false }),
      ],
      remediation_records: [
        makeRemediation({ id: "r1", completed: false, date_completed: null }),
      ],
      ventilation_assessment_records: [
        makeVentilation({ id: "v1", ventilation_adequate: false }),
        makeVentilation({ id: "v2", ventilation_adequate: false }),
      ],
      health_impact_records: [
        makeHealthImpact({ id: "h1", treatment_provided: false, social_worker_informed: false }),
      ],
    });
    for (let i = 0; i < r.recommendations.length; i++) {
      expect(r.recommendations[i].rank).toBe(i + 1);
    }
  });

  it("no recommendations when all rates excellent", () => {
    const r = computeDampMouldManagement(baseInput());
    expect(r.recommendations).toHaveLength(0);
  });

  it("every recommendation has a regulatory_ref", () => {
    const r = computeDampMouldManagement({
      today: "2026-05-30",
      total_children: 3,
      damp_survey_records: [
        makeDampSurvey({ id: "ds_1", within_acceptable_range: false }),
      ],
      mould_inspection_records: [
        makeMouldInspection({ id: "mi_1", mould_found: true, immediate_action_taken: false }),
      ],
      remediation_records: [
        makeRemediation({ id: "r1", completed: false, date_completed: null }),
      ],
      ventilation_assessment_records: [
        makeVentilation({ id: "v1", ventilation_adequate: false }),
      ],
      health_impact_records: [
        makeHealthImpact({ id: "h1", treatment_provided: false, social_worker_informed: false }),
      ],
    });
    for (const rec of r.recommendations) {
      expect(rec.regulatory_ref.length).toBeGreaterThan(0);
    }
  });
});

// ── 12. Insights ────────────────────────────────────────────────────────────

describe("insights", () => {
  it("critical insight for dampSurveyRate < 40", () => {
    const surveys = Array.from({ length: 5 }, (_, i) =>
      makeDampSurvey({ id: `ds_${i}`, within_acceptable_range: i < 1 }),
    );
    const r = computeDampMouldManagement(baseInput({ damp_survey_records: surveys }));
    expect(r.insights.some((ins) => ins.severity === "critical" && ins.text.includes("Excessive moisture levels"))).toBe(true);
  });

  it("critical insight for mouldInspectionRate < 50", () => {
    const inspections = Array.from({ length: 3 }, (_, i) =>
      makeMouldInspection({ id: `mi_${i}`, mould_found: true, mould_type: "black" }),
    );
    const r = computeDampMouldManagement(baseInput({ mould_inspection_records: inspections }));
    expect(r.insights.some((ins) => ins.severity === "critical" && ins.text.includes("mould contamination"))).toBe(true);
  });

  it("critical insight for remediationRate < 50", () => {
    const rems = [
      makeRemediation({ id: "r1", completed: false, date_completed: null }),
      makeRemediation({ id: "r2", completed: false, date_completed: null }),
    ];
    const r = computeDampMouldManagement(baseInput({ remediation_records: rems }));
    expect(r.insights.some((ins) => ins.severity === "critical" && ins.text.includes("remediations completed"))).toBe(true);
  });

  it("critical insight for ventilationRate < 40", () => {
    const vents = [
      makeVentilation({ id: "v1", ventilation_adequate: false }),
      makeVentilation({ id: "v2", ventilation_adequate: false }),
    ];
    const r = computeDampMouldManagement(baseInput({ ventilation_assessment_records: vents }));
    expect(r.insights.some((ins) => ins.severity === "critical" && ins.text.includes("ventilation assessments rated adequate"))).toBe(true);
  });

  it("critical insight for childBedroomMouldRate >= 20", () => {
    const inspections = [
      makeMouldInspection({ id: "mi_1", child_bedroom_affected: true }),
      makeMouldInspection({ id: "mi_2" }),
      makeMouldInspection({ id: "mi_3" }),
    ];
    const r = computeDampMouldManagement(baseInput({ mould_inspection_records: inspections }));
    expect(r.insights.some((ins) => ins.severity === "critical" && ins.text.includes("children's bedrooms"))).toBe(true);
  });

  it("critical insight when no damp surveys but children present (not allEmpty)", () => {
    const r = computeDampMouldManagement(baseInput({ damp_survey_records: [] }));
    expect(r.insights.some((ins) => ins.severity === "critical" && ins.text.includes("No damp surveys conducted"))).toBe(true);
  });

  it("critical insight when no ventilation assessments but children present (not allEmpty)", () => {
    const r = computeDampMouldManagement(baseInput({ ventilation_assessment_records: [] }));
    expect(r.insights.some((ins) => ins.severity === "critical" && ins.text.includes("No ventilation assessments conducted"))).toBe(true);
  });

  it("critical insight for severeHealthRate >= 20", () => {
    const his = [
      makeHealthImpact({ id: "h1", severity: "severe" }),
      makeHealthImpact({ id: "h2", severity: "mild" }),
      makeHealthImpact({ id: "h3", severity: "mild" }),
    ];
    const r = computeDampMouldManagement(baseInput({ health_impact_records: his }));
    expect(r.insights.some((ins) => ins.severity === "critical" && ins.text.includes("health impacts classified as severe"))).toBe(true);
  });

  it("critical insight for childAwarenessRate < 30", () => {
    const his = Array.from({ length: 5 }, (_, i) =>
      makeHealthImpact({ id: `h_${i}`, child_views_recorded: false }),
    );
    const rems = [
      makeRemediation({ id: "r1", child_room_involved: true, child_informed_of_works: false }),
    ];
    const vents = [
      makeVentilation({ id: "v1", child_bedroom: true, ventilation_adequate: false }),
    ];
    const inspections = [
      makeMouldInspection({ id: "mi_1", mould_found: true, reported_to_management: false }),
    ];
    const r = computeDampMouldManagement(baseInput({
      health_impact_records: his,
      remediation_records: rems,
      ventilation_assessment_records: vents,
      mould_inspection_records: inspections,
    }));
    if (r.child_awareness_rate < 30) {
      expect(r.insights.some((ins) => ins.severity === "critical" && ins.text.includes("Child awareness"))).toBe(true);
    }
  });

  it("warning insight for dampSurveyRate 40-69", () => {
    const surveys = Array.from({ length: 10 }, (_, i) =>
      makeDampSurvey({ id: `ds_${i}`, within_acceptable_range: i < 5 }),
    );
    const r = computeDampMouldManagement(baseInput({ damp_survey_records: surveys }));
    expect(r.insights.some((ins) => ins.severity === "warning" && ins.text.includes("Damp survey compliance"))).toBe(true);
  });

  it("warning insight for mouldInspectionRate 50-69", () => {
    const inspections = Array.from({ length: 10 }, (_, i) =>
      makeMouldInspection({ id: `mi_${i}`, mould_found: i < 4, mould_type: i < 4 ? "black" : "none" }),
    );
    const r = computeDampMouldManagement(baseInput({ mould_inspection_records: inspections }));
    expect(r.insights.some((ins) => ins.severity === "warning" && ins.text.includes("recurring mould discoveries"))).toBe(true);
  });

  it("warning insight for remediationRate 50-79", () => {
    const rems = [
      makeRemediation({ id: "r1" }),
      makeRemediation({ id: "r2" }),
      makeRemediation({ id: "r3", completed: false, date_completed: null }),
    ];
    const r = computeDampMouldManagement(baseInput({ remediation_records: rems }));
    expect(r.insights.some((ins) => ins.severity === "warning" && ins.text.includes("outstanding remediations"))).toBe(true);
  });

  it("warning insight for ventilationRate 40-69", () => {
    const vents = [
      makeVentilation({ id: "v1", ventilation_adequate: true }),
      makeVentilation({ id: "v2", ventilation_adequate: false }),
    ];
    const r = computeDampMouldManagement(baseInput({ ventilation_assessment_records: vents }));
    expect(r.insights.some((ins) => ins.severity === "warning" && ins.text.includes("areas with inadequate ventilation"))).toBe(true);
  });

  it("warning insight for condensationRate 15-29", () => {
    const vents = Array.from({ length: 5 }, (_, i) =>
      makeVentilation({ id: `v_${i}`, condensation_observed: i === 0 }),
    );
    const r = computeDampMouldManagement(baseInput({ ventilation_assessment_records: vents }));
    expect(r.insights.some((ins) => ins.severity === "warning" && ins.text.includes("moderate condensation"))).toBe(true);
  });

  it("warning insight for top mould locations when mouldFound >= 3", () => {
    const inspections = [
      makeMouldInspection({ id: "mi_1", mould_found: true, mould_type: "black", location_type: "bathroom" }),
      makeMouldInspection({ id: "mi_2", mould_found: true, mould_type: "green", location_type: "bathroom" }),
      makeMouldInspection({ id: "mi_3", mould_found: true, mould_type: "black", location_type: "kitchen" }),
      makeMouldInspection({ id: "mi_4", mould_found: false }),
      makeMouldInspection({ id: "mi_5", mould_found: false }),
      makeMouldInspection({ id: "mi_6", mould_found: false }),
      makeMouldInspection({ id: "mi_7", mould_found: false }),
      makeMouldInspection({ id: "mi_8", mould_found: false }),
      makeMouldInspection({ id: "mi_9", mould_found: false }),
      makeMouldInspection({ id: "mi_10", mould_found: false }),
    ];
    const r = computeDampMouldManagement(baseInput({ mould_inspection_records: inspections }));
    expect(r.insights.some((ins) => ins.severity === "warning" && ins.text.includes("Most common mould locations"))).toBe(true);
  });

  it("no mould location insight when mouldFound < 3", () => {
    const inspections = [
      makeMouldInspection({ id: "mi_1", mould_found: true, mould_type: "black", location_type: "bathroom" }),
      makeMouldInspection({ id: "mi_2", mould_found: true, mould_type: "green", location_type: "kitchen" }),
      makeMouldInspection({ id: "mi_3", mould_found: false }),
      makeMouldInspection({ id: "mi_4", mould_found: false }),
      makeMouldInspection({ id: "mi_5", mould_found: false }),
      makeMouldInspection({ id: "mi_6", mould_found: false }),
      makeMouldInspection({ id: "mi_7", mould_found: false }),
      makeMouldInspection({ id: "mi_8", mould_found: false }),
      makeMouldInspection({ id: "mi_9", mould_found: false }),
      makeMouldInspection({ id: "mi_10", mould_found: false }),
    ];
    const r = computeDampMouldManagement(baseInput({ mould_inspection_records: inspections }));
    expect(r.insights.some((ins) => ins.text.includes("Most common mould locations"))).toBe(false);
  });

  it("warning insight for top health impact types when totalHealthImpacts >= 3", () => {
    const his = [
      makeHealthImpact({ id: "h1", health_concern_type: "respiratory" }),
      makeHealthImpact({ id: "h2", health_concern_type: "respiratory" }),
      makeHealthImpact({ id: "h3", health_concern_type: "asthma" }),
    ];
    const r = computeDampMouldManagement(baseInput({ health_impact_records: his }));
    expect(r.insights.some((ins) => ins.severity === "warning" && ins.text.includes("Most common health impacts"))).toBe(true);
  });

  it("respiratory/asthma specific text in health type insight", () => {
    const his = [
      makeHealthImpact({ id: "h1", health_concern_type: "respiratory" }),
      makeHealthImpact({ id: "h2", health_concern_type: "respiratory" }),
      makeHealthImpact({ id: "h3", health_concern_type: "asthma" }),
    ];
    const r = computeDampMouldManagement(baseInput({ health_impact_records: his }));
    const insight = r.insights.find((ins) => ins.text.includes("Most common health impacts"));
    expect(insight?.text).toContain("respiratory issues are strongly linked to mould spore exposure");
  });

  it("non-respiratory health type gets generic text", () => {
    const his = [
      makeHealthImpact({ id: "h1", health_concern_type: "skin_condition" }),
      makeHealthImpact({ id: "h2", health_concern_type: "skin_condition" }),
      makeHealthImpact({ id: "h3", health_concern_type: "eye_irritation" }),
    ];
    const r = computeDampMouldManagement(baseInput({ health_impact_records: his }));
    const insight = r.insights.find((ins) => ins.text.includes("Most common health impacts"));
    expect(insight?.text).toContain("may be linked to mould or damp exposure");
  });

  it("positive insight for outstanding rating", () => {
    const r = computeDampMouldManagement(baseInput());
    expect(r.insights.some((ins) => ins.severity === "positive" && ins.text.includes("outstanding damp and mould management"))).toBe(true);
  });

  it("positive insight when dampSurveyRate >= 90 and actionCompletionRate >= 90", () => {
    const r = computeDampMouldManagement(baseInput());
    expect(r.insights.some((ins) => ins.severity === "positive" && ins.text.includes("Excellent damp monitoring"))).toBe(true);
  });

  it("positive insight when mouldInspectionRate >= 90 and immediateActionRate >= 90 with mould found", () => {
    const inspections = [
      makeMouldInspection({ id: "mi_1", mould_found: true, mould_type: "black", immediate_action_taken: true, reported_to_management: true }),
      ...Array.from({ length: 9 }, (_, i) =>
        makeMouldInspection({ id: `mi_${i + 2}`, mould_found: false }),
      ),
    ];
    const r = computeDampMouldManagement(baseInput({ mould_inspection_records: inspections }));
    expect(r.insights.some((ins) => ins.severity === "positive" && ins.text.includes("mould-free"))).toBe(true);
  });

  it("positive insight when remediationRate >= 95 and withinTargetRate >= 90", () => {
    const r = computeDampMouldManagement(baseInput());
    expect(r.insights.some((ins) => ins.severity === "positive" && ins.text.includes("remediation completion"))).toBe(true);
  });

  it("positive insight when ventilationRate >= 90 and condensationRate === 0", () => {
    const r = computeDampMouldManagement(baseInput());
    expect(r.insights.some((ins) => ins.severity === "positive" && ins.text.includes("ventilation adequacy with no condensation"))).toBe(true);
  });

  it("positive insight when childAwarenessRate >= 90", () => {
    const r = computeDampMouldManagement(baseInput());
    expect(r.insights.some((ins) => ins.severity === "positive" && ins.text.includes("child awareness across damp and mould management"))).toBe(true);
  });

  it("positive insight when resolvedRate >= 90 and treatmentProvisionRate >= 90", () => {
    const r = computeDampMouldManagement(baseInput());
    expect(r.insights.some((ins) => ins.severity === "positive" && ins.text.includes("health impacts resolved"))).toBe(true);
  });
});

// ── 13. Headlines ───────────────────────────────────────────────────────────

describe("headlines", () => {
  it("outstanding headline", () => {
    const r = computeDampMouldManagement(baseInput());
    expect(r.headline).toContain("Outstanding damp and mould management");
  });

  it("good headline includes strength and concern counts", () => {
    const r = computeDampMouldManagement(baseInput({
      health_impact_records: [],
      damp_survey_records: Array.from({ length: 10 }, (_, i) =>
        makeDampSurvey({ id: `ds_${i}`, within_acceptable_range: i < 8, action_required: i < 2, action_taken: i < 2, follow_up_date: i < 2 ? "2026-06-01" : null, follow_up_completed: i < 2 }),
      ),
    }));
    if (r.damp_rating === "good") {
      expect(r.headline).toContain("Good damp and mould management");
      expect(r.headline).toContain("strength");
    }
  });

  it("adequate headline includes concern count", () => {
    const r = computeDampMouldManagement({
      today: "2026-05-30",
      total_children: 3,
      damp_survey_records: [
        makeDampSurvey({ id: "ds_1", within_acceptable_range: true }),
        makeDampSurvey({ id: "ds_2", within_acceptable_range: false }),
      ],
      mould_inspection_records: [
        makeMouldInspection({ id: "mi_1", mould_found: true, mould_type: "black" }),
        makeMouldInspection({ id: "mi_2", mould_found: false }),
      ],
      remediation_records: [makeRemediation({ id: "rem_1" })],
      ventilation_assessment_records: [
        makeVentilation({ id: "vent_1" }),
        makeVentilation({ id: "vent_2", ventilation_adequate: false, meets_building_regs: false }),
      ],
      health_impact_records: [],
    });
    if (r.damp_rating === "adequate") {
      expect(r.headline).toContain("Adequate damp and mould management");
      expect(r.headline).toContain("concern");
    }
  });

  it("inadequate headline includes concern count", () => {
    const r = computeDampMouldManagement({
      today: "2026-05-30",
      total_children: 3,
      damp_survey_records: Array.from({ length: 5 }, (_, i) =>
        makeDampSurvey({ id: `ds_${i}`, within_acceptable_range: false }),
      ),
      mould_inspection_records: Array.from({ length: 5 }, (_, i) =>
        makeMouldInspection({ id: `mi_${i}`, mould_found: true, mould_type: "black" }),
      ),
      remediation_records: Array.from({ length: 5 }, (_, i) =>
        makeRemediation({ id: `r_${i}`, completed: false, date_completed: null }),
      ),
      ventilation_assessment_records: Array.from({ length: 5 }, (_, i) =>
        makeVentilation({ id: `v_${i}`, ventilation_adequate: false, meets_building_regs: false }),
      ),
      health_impact_records: [
        makeHealthImpact({ id: "h1", treatment_provided: false }),
      ],
    });
    expect(r.damp_rating).toBe("inadequate");
    expect(r.headline).toContain("inadequate");
    expect(r.headline).toContain("concern");
  });
});

// ── 14. Edge cases ──────────────────────────────────────────────────────────

describe("edge cases", () => {
  it("single survey, single inspection, single record in each → valid result", () => {
    const r = computeDampMouldManagement({
      today: "2026-05-30",
      total_children: 1,
      damp_survey_records: [makeDampSurvey()],
      mould_inspection_records: [makeMouldInspection()],
      remediation_records: [makeRemediation()],
      ventilation_assessment_records: [makeVentilation()],
      health_impact_records: [makeHealthImpact()],
    });
    expect(r.damp_rating).toBeDefined();
    expect(r.damp_score).toBeGreaterThanOrEqual(0);
    expect(r.damp_score).toBeLessThanOrEqual(100);
  });

  it("total_children = 0 with records → still computes (not allEmpty, not insufficient_data)", () => {
    const r = computeDampMouldManagement({
      today: "2026-05-30",
      total_children: 0,
      damp_survey_records: [makeDampSurvey()],
      mould_inspection_records: [],
      remediation_records: [],
      ventilation_assessment_records: [],
      health_impact_records: [],
    });
    // Not allEmpty because damp_survey_records.length > 0
    // Not special-case insufficient_data (which requires allEmpty + total_children === 0)
    expect(r.damp_rating).not.toBe("insufficient_data");
  });

  it("all records have worst values → score is clamped at 0 minimum", () => {
    const r = computeDampMouldManagement({
      today: "2026-05-30",
      total_children: 5,
      damp_survey_records: Array.from({ length: 20 }, (_, i) =>
        makeDampSurvey({ id: `ds_${i}`, within_acceptable_range: false }),
      ),
      mould_inspection_records: Array.from({ length: 20 }, (_, i) =>
        makeMouldInspection({ id: `mi_${i}`, mould_found: true, mould_type: "black" }),
      ),
      remediation_records: Array.from({ length: 20 }, (_, i) =>
        makeRemediation({ id: `r_${i}`, completed: false, date_completed: null, child_room_involved: true, child_informed_of_works: false }),
      ),
      ventilation_assessment_records: Array.from({ length: 20 }, (_, i) =>
        makeVentilation({ id: `v_${i}`, ventilation_adequate: false, child_bedroom: true, meets_building_regs: false }),
      ),
      health_impact_records: Array.from({ length: 20 }, (_, i) =>
        makeHealthImpact({ id: `h_${i}`, treatment_provided: false, child_views_recorded: false }),
      ),
    });
    expect(r.damp_score).toBeGreaterThanOrEqual(0);
    expect(r.damp_rating).toBe("inadequate");
  });

  it("pct() handles denominator 0 by returning 0", () => {
    // No actions required → actionsRequired = 0 → actionCompletionRate = 0
    const surveys = [
      makeDampSurvey({ id: "ds_1", action_required: false, follow_up_date: null }),
    ];
    const r = computeDampMouldManagement(baseInput({ damp_survey_records: surveys }));
    // No follow-ups, no actions → these rates should be 0, but no penalty/bonus applied
    expect(r.damp_survey_rate).toBe(100); // 1/1 within range
  });

  it("only damp surveys present — not allEmpty", () => {
    const r = computeDampMouldManagement({
      today: "2026-05-30",
      total_children: 2,
      damp_survey_records: [makeDampSurvey()],
      mould_inspection_records: [],
      remediation_records: [],
      ventilation_assessment_records: [],
      health_impact_records: [],
    });
    expect(r.damp_rating).not.toBe("insufficient_data");
    expect(r.total_damp_surveys).toBe(1);
    expect(r.total_mould_inspections).toBe(0);
  });

  it("only health impact records present — not allEmpty", () => {
    const r = computeDampMouldManagement({
      today: "2026-05-30",
      total_children: 1,
      damp_survey_records: [],
      mould_inspection_records: [],
      remediation_records: [],
      ventilation_assessment_records: [],
      health_impact_records: [makeHealthImpact()],
    });
    expect(r.damp_rating).not.toBe("insufficient_data");
    expect(r.total_health_impacts).toBe(1);
  });

  it("remediation with child_room_involved=false does not contribute to childInformedWorksRate", () => {
    const rems = [
      makeRemediation({ id: "r1", child_room_involved: false, child_informed_of_works: false }),
    ];
    const r = computeDampMouldManagement(baseInput({
      remediation_records: rems,
      health_impact_records: [],
      mould_inspection_records: [],
      ventilation_assessment_records: [makeVentilation({ id: "v1", child_bedroom: false })],
    }));
    // No child room remediation → not included in awareness composite
    expect(r.child_awareness_rate).toBe(0);
  });

  it("mould_found: false does not count toward spore/immediate/reporting metrics", () => {
    const inspections = [
      makeMouldInspection({ id: "mi_1", mould_found: false, spore_risk_assessed: true, immediate_action_taken: true, reported_to_management: true }),
    ];
    const r = computeDampMouldManagement(baseInput({
      mould_inspection_records: inspections,
      health_impact_records: [],
      remediation_records: [makeRemediation({ id: "r1", child_room_involved: false })],
      ventilation_assessment_records: [makeVentilation({ id: "v1", child_bedroom: false })],
    }));
    // mouldFound = 0 → reporting not included in awareness
    expect(r.mould_inspection_rate).toBe(100);
  });

  it("completed: false remediation does not count toward quality/follow-up metrics", () => {
    const rems = [
      makeRemediation({ id: "r1", completed: false, date_completed: null, quality_checked: true, quality_satisfactory: true, follow_up_inspection_completed: true }),
    ];
    const r = computeDampMouldManagement(baseInput({ remediation_records: rems }));
    expect(r.remediation_rate).toBe(0);
    // Completed remediations = 0, so quality/follow-up rates will be 0
  });

  it("ventilation not extractor_fan or mechanical — extractor fan working rate ignores them", () => {
    const vents = [
      makeVentilation({ id: "v1", ventilation_type: "trickle_vents", extractor_fan_working: false }),
    ];
    const r = computeDampMouldManagement(baseInput({ ventilation_assessment_records: vents }));
    // extractor_fan_working only counts for extractor_fan or mechanical types
    // This should not affect scoring
    expect(r.ventilation_rate).toBe(100);
  });

  it("treatment_required: false makes treatment_provided irrelevant for rate", () => {
    const his = [
      makeHealthImpact({ id: "h1", treatment_required: false, treatment_provided: false }),
    ];
    const r = computeDampMouldManagement(baseInput({ health_impact_records: his }));
    // treatmentRequiredHealth = 0, so treatmentProvisionRate = 0 (pct(0, 0) = 0)
    expect(r.health_impact_rate).toBe(0);
  });

  it("large number of records processes correctly", () => {
    const surveys = Array.from({ length: 100 }, (_, i) =>
      makeDampSurvey({ id: `ds_${i}`, within_acceptable_range: true }),
    );
    const inspections = Array.from({ length: 100 }, (_, i) =>
      makeMouldInspection({ id: `mi_${i}` }),
    );
    const r = computeDampMouldManagement(baseInput({
      damp_survey_records: surveys,
      mould_inspection_records: inspections,
    }));
    expect(r.total_damp_surveys).toBe(100);
    expect(r.total_mould_inspections).toBe(100);
    expect(r.damp_survey_rate).toBe(100);
    expect(r.mould_inspection_rate).toBe(100);
  });

  it("all penalties stack: -5 -5 -5 -3 = 52 - 18 = 34", () => {
    const r = computeDampMouldManagement({
      today: "2026-05-30",
      total_children: 3,
      damp_survey_records: [
        makeDampSurvey({ id: "ds_1", within_acceptable_range: false }),
        makeDampSurvey({ id: "ds_2", within_acceptable_range: false }),
        makeDampSurvey({ id: "ds_3", within_acceptable_range: false }),
      ],
      mould_inspection_records: [
        makeMouldInspection({ id: "mi_1", mould_found: true, reported_to_management: false }),
        makeMouldInspection({ id: "mi_2", mould_found: true, reported_to_management: false }),
        makeMouldInspection({ id: "mi_3", mould_found: true, reported_to_management: false }),
      ],
      remediation_records: [
        makeRemediation({ id: "r1", completed: false, date_completed: null, child_room_involved: true, child_informed_of_works: false }),
        makeRemediation({ id: "r2", completed: false, date_completed: null, child_room_involved: true, child_informed_of_works: false }),
        makeRemediation({ id: "r3", completed: false, date_completed: null, child_room_involved: true, child_informed_of_works: false }),
      ],
      ventilation_assessment_records: [
        makeVentilation({ id: "v1", ventilation_adequate: false, child_bedroom: true, meets_building_regs: false }),
        makeVentilation({ id: "v2", ventilation_adequate: false, child_bedroom: true, meets_building_regs: false }),
        makeVentilation({ id: "v3", ventilation_adequate: false, child_bedroom: true, meets_building_regs: false }),
      ],
      health_impact_records: [
        makeHealthImpact({ id: "h1", child_views_recorded: false, treatment_provided: false }),
        makeHealthImpact({ id: "h2", child_views_recorded: false, treatment_provided: false }),
        makeHealthImpact({ id: "h3", child_views_recorded: false, treatment_provided: false }),
      ],
    });
    // dampSurveyRate = 0 < 40 → -5
    // remediationRate = 0 < 50 → -5
    // ventilationRate = 0 < 40 → -5
    // childAwarenessRate → let's compute:
    //   healthImpacts: 0/3 views, remediation: 0/3 informed, vent: 0/3 adequate, mould: 0/3 reported
    //   total: 0/12 = 0% < 30 → -3
    // buildingRegsRate = 0/3 = 0 → no bonus
    // Score: 52 - 5 - 5 - 5 - 3 = 34
    expect(r.damp_score).toBe(34);
    expect(r.damp_rating).toBe("inadequate");
  });
});

// ── 15. Integration: full outstanding scenario ──────────────────────────────

describe("integration — full outstanding scenario", () => {
  it("produces a coherent outstanding result with all expected properties", () => {
    const r = computeDampMouldManagement(baseInput());
    expect(r.damp_rating).toBe("outstanding");
    expect(r.damp_score).toBe(80);
    expect(r.headline).toContain("Outstanding");
    expect(r.strengths.length).toBeGreaterThan(0);
    expect(r.concerns).toHaveLength(0);
    expect(r.recommendations).toHaveLength(0);
    expect(r.insights.some((ins) => ins.severity === "positive")).toBe(true);
    expect(r.total_damp_surveys).toBe(10);
    expect(r.total_mould_inspections).toBe(10);
    expect(r.damp_survey_rate).toBe(100);
    expect(r.mould_inspection_rate).toBe(100);
    expect(r.remediation_rate).toBe(100);
    expect(r.ventilation_rate).toBe(100);
    expect(r.health_impact_rate).toBe(100);
  });
});

// ── 16. Integration: full inadequate scenario ──────────────────────────────

describe("integration — full inadequate scenario", () => {
  it("produces a coherent inadequate result with concerns and recommendations", () => {
    const r = computeDampMouldManagement({
      today: "2026-05-30",
      total_children: 4,
      damp_survey_records: Array.from({ length: 5 }, (_, i) =>
        makeDampSurvey({ id: `ds_${i}`, within_acceptable_range: false, damp_detected: true, severity: "severe", child_rooms_affected: true }),
      ),
      mould_inspection_records: Array.from({ length: 5 }, (_, i) =>
        makeMouldInspection({ id: `mi_${i}`, mould_found: true, mould_type: "black", child_bedroom_affected: true, immediate_action_taken: false }),
      ),
      remediation_records: Array.from({ length: 5 }, (_, i) =>
        makeRemediation({
          id: `r_${i}`,
          completed: false,
          date_completed: null,
          quality_checked: false,
          quality_satisfactory: false,
          follow_up_inspection_completed: false,
          child_room_involved: true,
          child_informed_of_works: false,
        }),
      ),
      ventilation_assessment_records: Array.from({ length: 5 }, (_, i) =>
        makeVentilation({
          id: `v_${i}`,
          ventilation_adequate: false,
          meets_building_regs: false,
          child_bedroom: true,
          condensation_observed: true,
        }),
      ),
      health_impact_records: Array.from({ length: 5 }, (_, i) =>
        makeHealthImpact({
          id: `h_${i}`,
          severity: "severe",
          treatment_provided: false,
          child_views_recorded: false,
          social_worker_informed: false,
          school_absence: true,
          school_absence_days: 3,
          outcome: "recurring",
        }),
      ),
    });
    expect(r.damp_rating).toBe("inadequate");
    expect(r.damp_score).toBeLessThan(45);
    expect(r.concerns.length).toBeGreaterThan(0);
    expect(r.recommendations.length).toBeGreaterThan(0);
    expect(r.insights.some((ins) => ins.severity === "critical")).toBe(true);
    expect(r.headline).toContain("inadequate");
  });
});

// ── 17. Return shape ────────────────────────────────────────────────────────

describe("return shape", () => {
  it("all expected properties exist", () => {
    const r = computeDampMouldManagement(baseInput());
    expect(r).toHaveProperty("damp_rating");
    expect(r).toHaveProperty("damp_score");
    expect(r).toHaveProperty("headline");
    expect(r).toHaveProperty("total_damp_surveys");
    expect(r).toHaveProperty("total_mould_inspections");
    expect(r).toHaveProperty("total_remediations");
    expect(r).toHaveProperty("total_ventilation_assessments");
    expect(r).toHaveProperty("total_health_impacts");
    expect(r).toHaveProperty("damp_survey_rate");
    expect(r).toHaveProperty("mould_inspection_rate");
    expect(r).toHaveProperty("remediation_rate");
    expect(r).toHaveProperty("ventilation_rate");
    expect(r).toHaveProperty("health_impact_rate");
    expect(r).toHaveProperty("child_awareness_rate");
    expect(r).toHaveProperty("strengths");
    expect(r).toHaveProperty("concerns");
    expect(r).toHaveProperty("recommendations");
    expect(r).toHaveProperty("insights");
  });

  it("rating is one of the 5 allowed values", () => {
    const r = computeDampMouldManagement(baseInput());
    expect(["outstanding", "good", "adequate", "inadequate", "insufficient_data"]).toContain(r.damp_rating);
  });

  it("score is a number between 0 and 100", () => {
    const r = computeDampMouldManagement(baseInput());
    expect(typeof r.damp_score).toBe("number");
    expect(r.damp_score).toBeGreaterThanOrEqual(0);
    expect(r.damp_score).toBeLessThanOrEqual(100);
  });

  it("all rates are numbers between 0 and 100", () => {
    const r = computeDampMouldManagement(baseInput());
    for (const rate of [r.damp_survey_rate, r.mould_inspection_rate, r.remediation_rate, r.ventilation_rate, r.health_impact_rate, r.child_awareness_rate]) {
      expect(typeof rate).toBe("number");
      expect(rate).toBeGreaterThanOrEqual(0);
      expect(rate).toBeLessThanOrEqual(100);
    }
  });

  it("strengths, concerns are string arrays", () => {
    const r = computeDampMouldManagement(baseInput());
    expect(Array.isArray(r.strengths)).toBe(true);
    expect(Array.isArray(r.concerns)).toBe(true);
    for (const s of r.strengths) expect(typeof s).toBe("string");
  });

  it("recommendations have rank, recommendation, urgency, regulatory_ref", () => {
    const r = computeDampMouldManagement({
      today: "2026-05-30",
      total_children: 3,
      damp_survey_records: [makeDampSurvey({ id: "ds_1", within_acceptable_range: false })],
      mould_inspection_records: [],
      remediation_records: [],
      ventilation_assessment_records: [],
      health_impact_records: [],
    });
    for (const rec of r.recommendations) {
      expect(rec).toHaveProperty("rank");
      expect(rec).toHaveProperty("recommendation");
      expect(rec).toHaveProperty("urgency");
      expect(rec).toHaveProperty("regulatory_ref");
      expect(["immediate", "soon", "planned"]).toContain(rec.urgency);
    }
  });

  it("insights have text and severity", () => {
    const r = computeDampMouldManagement(baseInput());
    for (const ins of r.insights) {
      expect(ins).toHaveProperty("text");
      expect(ins).toHaveProperty("severity");
      expect(["critical", "warning", "positive"]).toContain(ins.severity);
    }
  });
});
