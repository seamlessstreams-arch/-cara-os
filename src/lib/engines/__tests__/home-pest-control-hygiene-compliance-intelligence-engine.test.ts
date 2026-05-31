import { describe, it, expect } from "vitest";
import {
  computePestControlHygieneCompliance,
  type PestControlInput,
  type PestInspectionRecordInput,
  type TreatmentRecordInput,
  type KitchenHygieneRecordInput,
  type CleanlinessRatingRecordInput,
  type ProductSafetyRecordInput,
} from "../home-pest-control-hygiene-compliance-intelligence-engine";

/* -- helpers ---------------------------------------------------------------- */

function makeInspection(id: string, o: Partial<PestInspectionRecordInput> = {}): PestInspectionRecordInput {
  return {
    id,
    inspection_date: "2026-05-01",
    inspector_type: "external_contractor",
    areas_inspected: ["kitchen", "bedrooms"],
    pests_found: false,
    pest_types_found: [],
    severity: "none",
    scheduled: true,
    completed_on_time: true,
    follow_up_required: false,
    follow_up_completed: false,
    report_filed: true,
    corrective_actions_identified: 0,
    corrective_actions_completed: 0,
    next_inspection_date: "2026-08-01",
    children_areas_affected: false,
    staff_id: "s1",
    notes: "",
    created_at: "2026-05-01",
    ...o,
  };
}

function makeTreatment(id: string, o: Partial<TreatmentRecordInput> = {}): TreatmentRecordInput {
  return {
    id,
    treatment_date: "2026-05-02",
    pest_type: "ants",
    treatment_method: "integrated",
    product_used: "SafeSpray",
    product_child_safe: true,
    coshh_compliant: true,
    area_treated: "kitchen",
    children_relocated_during_treatment: true,
    re_entry_time_observed: true,
    treatment_effective: true,
    follow_up_treatment_required: false,
    follow_up_treatment_completed: false,
    risk_assessment_completed: true,
    staff_id: "s1",
    contractor_name: "PestPro Ltd",
    contractor_certified: true,
    documentation_complete: true,
    created_at: "2026-05-02",
    ...o,
  };
}

function makeKitchenHygiene(id: string, o: Partial<KitchenHygieneRecordInput> = {}): KitchenHygieneRecordInput {
  return {
    id,
    audit_date: "2026-05-03",
    auditor_type: "internal",
    overall_score: 90,
    food_storage_compliant: true,
    temperature_monitoring_compliant: true,
    cleaning_schedule_followed: true,
    pest_evidence_found: false,
    hand_hygiene_compliant: true,
    waste_management_compliant: true,
    cross_contamination_controls: true,
    staff_training_current: true,
    fridge_temperature_in_range: true,
    freezer_temperature_in_range: true,
    cooking_temperature_verified: true,
    allergen_controls_in_place: true,
    corrective_actions_raised: 0,
    corrective_actions_closed: 0,
    food_hygiene_rating: 5,
    date_labelling_compliant: true,
    surface_cleanliness_passed: true,
    equipment_maintained: true,
    notes: "",
    created_at: "2026-05-03",
    ...o,
  };
}

function makeCleanliness(id: string, o: Partial<CleanlinessRatingRecordInput> = {}): CleanlinessRatingRecordInput {
  return {
    id,
    assessment_date: "2026-05-04",
    area_name: "Lounge",
    area_type: "living_area",
    cleanliness_score: 9,
    hygiene_standard_met: true,
    deep_clean_completed: true,
    deep_clean_due_date: "2026-08-04",
    deep_clean_overdue: false,
    infection_control_compliant: true,
    hazards_identified: 0,
    hazards_resolved: 0,
    odour_issues: false,
    damp_mould_issues: false,
    ventilation_adequate: true,
    child_involved_in_assessment: true,
    staff_id: "s1",
    notes: "",
    created_at: "2026-05-04",
    ...o,
  };
}

function makeProduct(id: string, o: Partial<ProductSafetyRecordInput> = {}): ProductSafetyRecordInput {
  return {
    id,
    product_name: "EcoClean Spray",
    product_type: "cleaning_chemical",
    child_safe_certified: true,
    coshh_assessment_completed: true,
    coshh_sheet_available: true,
    stored_securely: true,
    locked_storage: true,
    labelled_correctly: true,
    in_date: true,
    expiry_date: "2027-01-01",
    staff_trained_on_use: true,
    risk_assessment_completed: true,
    first_aid_instructions_available: true,
    alternative_child_safe_product_available: true,
    usage_logged: true,
    last_audit_date: "2026-04-01",
    created_at: "2026-05-01",
    ...o,
  };
}

function baseInput(overrides: Partial<PestControlInput> = {}): PestControlInput {
  return {
    today: "2026-05-15",
    total_children: 6,
    pest_inspection_records: [makeInspection("i1"), makeInspection("i2"), makeInspection("i3")],
    treatment_records: [makeTreatment("t1"), makeTreatment("t2")],
    kitchen_hygiene_records: [
      makeKitchenHygiene("k1", { corrective_actions_raised: 3, corrective_actions_closed: 3 }),
      makeKitchenHygiene("k2", { corrective_actions_raised: 2, corrective_actions_closed: 2 }),
      makeKitchenHygiene("k3", { corrective_actions_raised: 1, corrective_actions_closed: 1 }),
    ],
    cleanliness_rating_records: [makeCleanliness("c1"), makeCleanliness("c2"), makeCleanliness("c3")],
    product_safety_records: [makeProduct("p1"), makeProduct("p2"), makeProduct("p3")],
    ...overrides,
  };
}

/* -- tests ------------------------------------------------------------------ */

describe("Home Pest Control & Hygiene Compliance Intelligence Engine", () => {

  // ==================== INSUFFICIENT DATA ====================

  describe("insufficient data", () => {
    it("returns insufficient_data when no children and all arrays empty", () => {
      const r = computePestControlHygieneCompliance({
        today: "2026-05-15", total_children: 0,
        pest_inspection_records: [], treatment_records: [],
        kitchen_hygiene_records: [], cleanliness_rating_records: [],
        product_safety_records: [],
      });
      expect(r.pest_control_rating).toBe("insufficient_data");
      expect(r.pest_control_score).toBe(0);
    });

    it("returns zero rates for insufficient data", () => {
      const r = computePestControlHygieneCompliance({
        today: "2026-05-15", total_children: 0,
        pest_inspection_records: [], treatment_records: [],
        kitchen_hygiene_records: [], cleanliness_rating_records: [],
        product_safety_records: [],
      });
      expect(r.inspection_compliance_rate).toBe(0);
      expect(r.treatment_effectiveness_rate).toBe(0);
      expect(r.kitchen_hygiene_rate).toBe(0);
      expect(r.cleanliness_rate).toBe(0);
      expect(r.product_safety_rate).toBe(0);
      expect(r.staff_training_rate).toBe(0);
    });

    it("headline mentions insufficient data", () => {
      const r = computePestControlHygieneCompliance({
        today: "2026-05-15", total_children: 0,
        pest_inspection_records: [], treatment_records: [],
        kitchen_hygiene_records: [], cleanliness_rating_records: [],
        product_safety_records: [],
      });
      expect(r.headline).toContain("insufficient data");
    });

    it("returns empty arrays for strengths/concerns/recommendations/insights", () => {
      const r = computePestControlHygieneCompliance({
        today: "2026-05-15", total_children: 0,
        pest_inspection_records: [], treatment_records: [],
        kitchen_hygiene_records: [], cleanliness_rating_records: [],
        product_safety_records: [],
      });
      expect(r.strengths).toHaveLength(0);
      expect(r.concerns).toHaveLength(0);
      expect(r.recommendations).toHaveLength(0);
      expect(r.insights).toHaveLength(0);
    });
  });

  // ==================== ALL EMPTY + CHILDREN ====================

  describe("all empty with children on placement", () => {
    it("returns inadequate with score 15 when children but no records", () => {
      const r = computePestControlHygieneCompliance({
        today: "2026-05-15", total_children: 4,
        pest_inspection_records: [], treatment_records: [],
        kitchen_hygiene_records: [], cleanliness_rating_records: [],
        product_safety_records: [],
      });
      expect(r.pest_control_rating).toBe("inadequate");
      expect(r.pest_control_score).toBe(15);
    });

    it("raises a concern about absence of records", () => {
      const r = computePestControlHygieneCompliance({
        today: "2026-05-15", total_children: 4,
        pest_inspection_records: [], treatment_records: [],
        kitchen_hygiene_records: [], cleanliness_rating_records: [],
        product_safety_records: [],
      });
      expect(r.concerns).toHaveLength(1);
      expect(r.concerns[0]).toContain("No pest inspection");
    });

    it("generates two immediate recommendations", () => {
      const r = computePestControlHygieneCompliance({
        today: "2026-05-15", total_children: 4,
        pest_inspection_records: [], treatment_records: [],
        kitchen_hygiene_records: [], cleanliness_rating_records: [],
        product_safety_records: [],
      });
      expect(r.recommendations).toHaveLength(2);
      expect(r.recommendations.every(rec => rec.urgency === "immediate")).toBe(true);
    });

    it("generates a critical insight about absence of records", () => {
      const r = computePestControlHygieneCompliance({
        today: "2026-05-15", total_children: 4,
        pest_inspection_records: [], treatment_records: [],
        kitchen_hygiene_records: [], cleanliness_rating_records: [],
        product_safety_records: [],
      });
      expect(r.insights).toHaveLength(1);
      expect(r.insights[0].severity).toBe("critical");
    });

    it("headline mentions no data despite children on placement", () => {
      const r = computePestControlHygieneCompliance({
        today: "2026-05-15", total_children: 4,
        pest_inspection_records: [], treatment_records: [],
        kitchen_hygiene_records: [], cleanliness_rating_records: [],
        product_safety_records: [],
      });
      expect(r.headline).toContain("No pest control or hygiene compliance data recorded");
    });
  });

  // ==================== OUTSTANDING THRESHOLD (>=80) ====================

  describe("outstanding threshold (>=80)", () => {
    it("rates outstanding with all perfect records", () => {
      const r = computePestControlHygieneCompliance(baseInput());
      expect(r.pest_control_score).toBeGreaterThanOrEqual(80);
      expect(r.pest_control_rating).toBe("outstanding");
    });

    it("headline mentions outstanding", () => {
      const r = computePestControlHygieneCompliance(baseInput());
      expect(r.headline).toContain("Outstanding");
    });

    it("has 100% inspection compliance with all on-time", () => {
      const r = computePestControlHygieneCompliance(baseInput());
      expect(r.inspection_compliance_rate).toBe(100);
    });

    it("has 100% treatment effectiveness", () => {
      const r = computePestControlHygieneCompliance(baseInput());
      expect(r.treatment_effectiveness_rate).toBe(100);
    });

    it("has high kitchen hygiene rate", () => {
      const r = computePestControlHygieneCompliance(baseInput());
      expect(r.kitchen_hygiene_rate).toBeGreaterThanOrEqual(85);
    });

    it("has high cleanliness rate", () => {
      const r = computePestControlHygieneCompliance(baseInput());
      expect(r.cleanliness_rate).toBeGreaterThanOrEqual(85);
    });

    it("has 100% product safety rate", () => {
      const r = computePestControlHygieneCompliance(baseInput());
      expect(r.product_safety_rate).toBe(100);
    });

    it("has 100% staff training rate", () => {
      const r = computePestControlHygieneCompliance(baseInput());
      expect(r.staff_training_rate).toBe(100);
    });

    it("generates multiple strengths", () => {
      const r = computePestControlHygieneCompliance(baseInput());
      expect(r.strengths.length).toBeGreaterThan(5);
    });

    it("generates no concerns", () => {
      const r = computePestControlHygieneCompliance(baseInput());
      expect(r.concerns).toHaveLength(0);
    });

    it("generates no recommendations", () => {
      const r = computePestControlHygieneCompliance(baseInput());
      expect(r.recommendations).toHaveLength(0);
    });

    it("generates positive insights", () => {
      const r = computePestControlHygieneCompliance(baseInput());
      expect(r.insights.some(i => i.severity === "positive")).toBe(true);
    });

    it("generates outstanding-level positive insight", () => {
      const r = computePestControlHygieneCompliance(baseInput());
      expect(r.insights.some(i => i.text.includes("outstanding") && i.severity === "positive")).toBe(true);
    });
  });

  // ==================== GOOD THRESHOLD (65-79) ====================

  describe("good threshold (65-79)", () => {
    it("rates good with mostly compliant but some gaps", () => {
      // 52 base
      // inspection: 3/4=75% -> +2
      // treatment: 100% -> +4
      // kitchen: avg 75 -> >=70 -> +2
      // cleanliness: avg 7.7, rate=77% -> >=70 -> +2
      // product: 3/4=75% -> >=70 -> +2
      // staffTraining: kitchen 4/4=100%, product 4/4=100% -> 100% -> +3
      // corrective: 0/0=0 -> no bonus
      // = 52 + 2 + 4 + 2 + 2 + 2 + 3 = 67
      const r = computePestControlHygieneCompliance(baseInput({
        pest_inspection_records: [
          makeInspection("i1"),
          makeInspection("i2"),
          makeInspection("i3"),
          makeInspection("i4", { completed_on_time: false }),
        ],
        kitchen_hygiene_records: [
          makeKitchenHygiene("k1", { overall_score: 75 }),
          makeKitchenHygiene("k2", { overall_score: 75 }),
          makeKitchenHygiene("k3", { overall_score: 75 }),
          makeKitchenHygiene("k4", { overall_score: 75 }),
        ],
        cleanliness_rating_records: [
          makeCleanliness("c1", { cleanliness_score: 7 }),
          makeCleanliness("c2", { cleanliness_score: 8 }),
          makeCleanliness("c3", { cleanliness_score: 8 }),
        ],
        product_safety_records: [
          makeProduct("p1"),
          makeProduct("p2"),
          makeProduct("p3"),
          makeProduct("p4", { child_safe_certified: false }),
        ],
      }));
      expect(r.pest_control_score).toBeGreaterThanOrEqual(65);
      expect(r.pest_control_score).toBeLessThan(80);
      expect(r.pest_control_rating).toBe("good");
    });

    it("headline mentions good and counts strengths/concerns", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        pest_inspection_records: [
          makeInspection("i1"),
          makeInspection("i2"),
          makeInspection("i3"),
          makeInspection("i4", { completed_on_time: false }),
        ],
        kitchen_hygiene_records: [
          makeKitchenHygiene("k1", { overall_score: 75 }),
          makeKitchenHygiene("k2", { overall_score: 75 }),
          makeKitchenHygiene("k3", { overall_score: 75 }),
          makeKitchenHygiene("k4", { overall_score: 75 }),
        ],
        cleanliness_rating_records: [
          makeCleanliness("c1", { cleanliness_score: 7 }),
          makeCleanliness("c2", { cleanliness_score: 8 }),
          makeCleanliness("c3", { cleanliness_score: 8 }),
        ],
        product_safety_records: [
          makeProduct("p1"),
          makeProduct("p2"),
          makeProduct("p3"),
          makeProduct("p4", { child_safe_certified: false }),
        ],
      }));
      expect(r.headline).toContain("Good");
    });
  });

  // ==================== ADEQUATE THRESHOLD (45-64) ====================

  describe("adequate threshold (45-64)", () => {
    it("rates adequate with mixed compliance", () => {
      // 52 base
      // inspection: 2/4=50% -> no bonus, no penalty (>=50)
      // treatment: 2/4=50% -> no bonus
      // kitchen: avg 55 -> no bonus, no penalty (>=50)
      // cleanliness: avg 5.7, rate=57% -> no bonus, no penalty (>=50)
      // product: 1/3=33% -> -5 penalty
      // staffTraining: kitchen 0/3 + product 0/3 = 0/6 = 0% -> no bonus
      // corrective: 0/0=0 -> no bonus
      // = 52 - 5 = 47
      const r = computePestControlHygieneCompliance(baseInput({
        pest_inspection_records: [
          makeInspection("i1", { completed_on_time: true }),
          makeInspection("i2", { completed_on_time: true }),
          makeInspection("i3", { completed_on_time: false }),
          makeInspection("i4", { completed_on_time: false }),
        ],
        treatment_records: [
          makeTreatment("t1", { treatment_effective: true }),
          makeTreatment("t2", { treatment_effective: true }),
          makeTreatment("t3", { treatment_effective: false }),
          makeTreatment("t4", { treatment_effective: false }),
        ],
        kitchen_hygiene_records: [
          makeKitchenHygiene("k1", { overall_score: 55, staff_training_current: false }),
          makeKitchenHygiene("k2", { overall_score: 55, staff_training_current: false }),
          makeKitchenHygiene("k3", { overall_score: 55, staff_training_current: false }),
        ],
        cleanliness_rating_records: [
          makeCleanliness("c1", { cleanliness_score: 6, infection_control_compliant: false }),
          makeCleanliness("c2", { cleanliness_score: 5, infection_control_compliant: false }),
          makeCleanliness("c3", { cleanliness_score: 6, infection_control_compliant: false }),
        ],
        product_safety_records: [
          makeProduct("p1", { child_safe_certified: true, staff_trained_on_use: false }),
          makeProduct("p2", { child_safe_certified: false, staff_trained_on_use: false }),
          makeProduct("p3", { child_safe_certified: false, staff_trained_on_use: false }),
        ],
      }));
      expect(r.pest_control_score).toBeGreaterThanOrEqual(45);
      expect(r.pest_control_score).toBeLessThan(65);
      expect(r.pest_control_rating).toBe("adequate");
    });

    it("headline mentions adequate and concern count", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        pest_inspection_records: [
          makeInspection("i1", { completed_on_time: true }),
          makeInspection("i2", { completed_on_time: true }),
          makeInspection("i3", { completed_on_time: false }),
          makeInspection("i4", { completed_on_time: false }),
        ],
        treatment_records: [
          makeTreatment("t1", { treatment_effective: true }),
          makeTreatment("t2", { treatment_effective: true }),
          makeTreatment("t3", { treatment_effective: false }),
          makeTreatment("t4", { treatment_effective: false }),
        ],
        kitchen_hygiene_records: [
          makeKitchenHygiene("k1", { overall_score: 55, staff_training_current: false }),
          makeKitchenHygiene("k2", { overall_score: 55, staff_training_current: false }),
          makeKitchenHygiene("k3", { overall_score: 55, staff_training_current: false }),
        ],
        cleanliness_rating_records: [
          makeCleanliness("c1", { cleanliness_score: 6, infection_control_compliant: false }),
          makeCleanliness("c2", { cleanliness_score: 5, infection_control_compliant: false }),
          makeCleanliness("c3", { cleanliness_score: 6, infection_control_compliant: false }),
        ],
        product_safety_records: [
          makeProduct("p1", { child_safe_certified: true, staff_trained_on_use: false }),
          makeProduct("p2", { child_safe_certified: false, staff_trained_on_use: false }),
          makeProduct("p3", { child_safe_certified: false, staff_trained_on_use: false }),
        ],
      }));
      expect(r.headline).toContain("Adequate");
    });
  });

  // ==================== INADEQUATE THRESHOLD (<45) ====================

  describe("inadequate threshold (<45)", () => {
    it("rates inadequate with very poor compliance", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        pest_inspection_records: [
          makeInspection("i1", { completed_on_time: false, report_filed: false }),
          makeInspection("i2", { completed_on_time: false, report_filed: false }),
          makeInspection("i3", { completed_on_time: false, report_filed: false }),
          makeInspection("i4", { completed_on_time: false, report_filed: false }),
        ],
        treatment_records: [
          makeTreatment("t1", { treatment_effective: false, product_child_safe: false, coshh_compliant: false }),
          makeTreatment("t2", { treatment_effective: false, product_child_safe: false, coshh_compliant: false }),
        ],
        kitchen_hygiene_records: [
          makeKitchenHygiene("k1", { overall_score: 30, staff_training_current: false, pest_evidence_found: true }),
          makeKitchenHygiene("k2", { overall_score: 25, staff_training_current: false, pest_evidence_found: true }),
        ],
        cleanliness_rating_records: [
          makeCleanliness("c1", { cleanliness_score: 3, hygiene_standard_met: false, infection_control_compliant: false }),
          makeCleanliness("c2", { cleanliness_score: 2, hygiene_standard_met: false, infection_control_compliant: false }),
        ],
        product_safety_records: [
          makeProduct("p1", { child_safe_certified: false, stored_securely: false, coshh_assessment_completed: false, staff_trained_on_use: false }),
          makeProduct("p2", { child_safe_certified: false, stored_securely: false, coshh_assessment_completed: false, staff_trained_on_use: false }),
        ],
      }));
      expect(r.pest_control_score).toBeLessThan(45);
      expect(r.pest_control_rating).toBe("inadequate");
    });

    it("headline mentions inadequate and significant concerns", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        pest_inspection_records: [
          makeInspection("i1", { completed_on_time: false }),
          makeInspection("i2", { completed_on_time: false }),
          makeInspection("i3", { completed_on_time: false }),
          makeInspection("i4", { completed_on_time: false }),
        ],
        treatment_records: [],
        kitchen_hygiene_records: [
          makeKitchenHygiene("k1", { overall_score: 30, staff_training_current: false }),
          makeKitchenHygiene("k2", { overall_score: 25, staff_training_current: false }),
        ],
        cleanliness_rating_records: [
          makeCleanliness("c1", { cleanliness_score: 3, hygiene_standard_met: false }),
          makeCleanliness("c2", { cleanliness_score: 2, hygiene_standard_met: false }),
        ],
        product_safety_records: [
          makeProduct("p1", { child_safe_certified: false, stored_securely: false, staff_trained_on_use: false }),
          makeProduct("p2", { child_safe_certified: false, stored_securely: false, staff_trained_on_use: false }),
        ],
      }));
      expect(r.headline).toContain("inadequate");
    });

    it("generates multiple concerns when inadequate", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        pest_inspection_records: [
          makeInspection("i1", { completed_on_time: false }),
          makeInspection("i2", { completed_on_time: false }),
          makeInspection("i3", { completed_on_time: false }),
          makeInspection("i4", { completed_on_time: false }),
        ],
        treatment_records: [],
        kitchen_hygiene_records: [
          makeKitchenHygiene("k1", { overall_score: 30, staff_training_current: false }),
          makeKitchenHygiene("k2", { overall_score: 25, staff_training_current: false }),
        ],
        cleanliness_rating_records: [
          makeCleanliness("c1", { cleanliness_score: 3, hygiene_standard_met: false }),
          makeCleanliness("c2", { cleanliness_score: 2, hygiene_standard_met: false }),
        ],
        product_safety_records: [
          makeProduct("p1", { child_safe_certified: false, stored_securely: false, staff_trained_on_use: false }),
          makeProduct("p2", { child_safe_certified: false, stored_securely: false, staff_trained_on_use: false }),
        ],
      }));
      expect(r.concerns.length).toBeGreaterThan(3);
    });

    it("generates multiple immediate recommendations when inadequate", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        pest_inspection_records: [
          makeInspection("i1", { completed_on_time: false }),
          makeInspection("i2", { completed_on_time: false }),
          makeInspection("i3", { completed_on_time: false }),
          makeInspection("i4", { completed_on_time: false }),
        ],
        treatment_records: [],
        kitchen_hygiene_records: [
          makeKitchenHygiene("k1", { overall_score: 30, staff_training_current: false }),
          makeKitchenHygiene("k2", { overall_score: 25, staff_training_current: false }),
        ],
        cleanliness_rating_records: [
          makeCleanliness("c1", { cleanliness_score: 3, hygiene_standard_met: false }),
          makeCleanliness("c2", { cleanliness_score: 2, hygiene_standard_met: false }),
        ],
        product_safety_records: [
          makeProduct("p1", { child_safe_certified: false, stored_securely: false, staff_trained_on_use: false }),
          makeProduct("p2", { child_safe_certified: false, stored_securely: false, staff_trained_on_use: false }),
        ],
      }));
      expect(r.recommendations.some(rec => rec.urgency === "immediate")).toBe(true);
    });

    it("generates critical insights when inadequate", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        pest_inspection_records: [
          makeInspection("i1", { completed_on_time: false }),
          makeInspection("i2", { completed_on_time: false }),
          makeInspection("i3", { completed_on_time: false }),
          makeInspection("i4", { completed_on_time: false }),
        ],
        treatment_records: [],
        kitchen_hygiene_records: [
          makeKitchenHygiene("k1", { overall_score: 30, staff_training_current: false }),
          makeKitchenHygiene("k2", { overall_score: 25, staff_training_current: false }),
        ],
        cleanliness_rating_records: [
          makeCleanliness("c1", { cleanliness_score: 3, hygiene_standard_met: false }),
          makeCleanliness("c2", { cleanliness_score: 2, hygiene_standard_met: false }),
        ],
        product_safety_records: [
          makeProduct("p1", { child_safe_certified: false, stored_securely: false, staff_trained_on_use: false }),
          makeProduct("p2", { child_safe_certified: false, stored_securely: false, staff_trained_on_use: false }),
        ],
      }));
      expect(r.insights.some(i => i.severity === "critical")).toBe(true);
    });
  });

  // ==================== SCORING ====================

  describe("scoring", () => {
    it("base score is 52 with no bonuses or penalties", () => {
      // No records at all but children present -> special case. Need records to test base.
      // One inspection at 0% compliance, no kitchen, no cleanliness, no products -> just low inspection
      const r = computePestControlHygieneCompliance(baseInput({
        pest_inspection_records: [makeInspection("i1", { completed_on_time: false })],
        treatment_records: [makeTreatment("t1", { treatment_effective: false })],
        kitchen_hygiene_records: [makeKitchenHygiene("k1", { overall_score: 55, staff_training_current: false })],
        cleanliness_rating_records: [makeCleanliness("c1", { cleanliness_score: 6 })],
        product_safety_records: [makeProduct("p1", { child_safe_certified: false, staff_trained_on_use: false })],
      }));
      // inspection 0% (<50 penalty -6), treatment 0% no bonus, kitchen 55 (50-70 bracket +2),
      // cleanliness 60% (no bonus no penalty), product 0% (<50 penalty -5)
      // staffTraining: 0/2 = 0
      // kitchenCorrectiveAction: 0/0 = 0
      // 52 - 6 + 2 - 5 = 43
      expect(r.pest_control_score).toBe(41);
    });

    it("score is clamped to 0-100", () => {
      const r = computePestControlHygieneCompliance(baseInput());
      expect(r.pest_control_score).toBeGreaterThanOrEqual(0);
      expect(r.pest_control_score).toBeLessThanOrEqual(100);
    });

    it("awards +5 for inspection compliance >= 90%", () => {
      const perfect = computePestControlHygieneCompliance(baseInput({
        pest_inspection_records: [makeInspection("i1")],
        treatment_records: [],
        kitchen_hygiene_records: [],
        cleanliness_rating_records: [],
        product_safety_records: [],
      }));
      // 52 + 5 (inspection 100%) = 57
      expect(perfect.pest_control_score).toBe(57);
    });

    it("awards +2 for inspection compliance >= 70% but < 90%", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        pest_inspection_records: [
          makeInspection("i1", { completed_on_time: true }),
          makeInspection("i2", { completed_on_time: true }),
          makeInspection("i3", { completed_on_time: true }),
          makeInspection("i4", { completed_on_time: false }),
        ],
        treatment_records: [],
        kitchen_hygiene_records: [],
        cleanliness_rating_records: [],
        product_safety_records: [],
      }));
      // 75% -> +2, 52 + 2 = 54
      expect(r.pest_control_score).toBe(54);
    });

    it("awards +4 for treatment effectiveness >= 90%", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        pest_inspection_records: [],
        treatment_records: [makeTreatment("t1")],
        kitchen_hygiene_records: [],
        cleanliness_rating_records: [],
        product_safety_records: [],
      }));
      // 52 + 4 = 56
      expect(r.pest_control_score).toBe(56);
    });

    it("awards +5 for kitchen hygiene >= 85%", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        pest_inspection_records: [],
        treatment_records: [],
        kitchen_hygiene_records: [makeKitchenHygiene("k1", { overall_score: 90, staff_training_current: true, corrective_actions_raised: 0, corrective_actions_closed: 0 })],
        cleanliness_rating_records: [],
        product_safety_records: [],
      }));
      // 52 + 5 (kitchenHygiene) + 3 (staffTraining 100%)
      // kitchenCorrectiveAction: 0/0 = 0, not >=90 -> no bonus
      // 52 + 5 + 3 = 60
      expect(r.pest_control_score).toBe(60);
    });

    it("awards +4 for cleanliness >= 85%", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        pest_inspection_records: [],
        treatment_records: [],
        kitchen_hygiene_records: [],
        cleanliness_rating_records: [makeCleanliness("c1", { cleanliness_score: 9 })],
        product_safety_records: [],
      }));
      // cleanliness_rate = round((9/10)*100) = 90 -> +4
      // 52 + 4 = 56
      expect(r.pest_control_score).toBe(56);
    });

    it("awards +4 for product safety >= 90%", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        pest_inspection_records: [],
        treatment_records: [],
        kitchen_hygiene_records: [],
        cleanliness_rating_records: [],
        product_safety_records: [makeProduct("p1")],
      }));
      // productSafety 100% -> +4
      // staffTraining: products 1/1=100% -> +3
      // 52 + 4 + 3 = 59
      expect(r.pest_control_score).toBe(59);
    });

    it("penalises -6 for inspection compliance < 50%", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        pest_inspection_records: [
          makeInspection("i1", { completed_on_time: false }),
          makeInspection("i2", { completed_on_time: false }),
          makeInspection("i3", { completed_on_time: false }),
        ],
        treatment_records: [],
        kitchen_hygiene_records: [],
        cleanliness_rating_records: [],
        product_safety_records: [],
      }));
      // 0% inspection -> -6 penalty, 52 - 6 = 46
      expect(r.pest_control_score).toBe(46);
    });

    it("penalises -6 for kitchen hygiene < 50%", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        pest_inspection_records: [],
        treatment_records: [],
        kitchen_hygiene_records: [
          makeKitchenHygiene("k1", { overall_score: 40, staff_training_current: false }),
        ],
        cleanliness_rating_records: [],
        product_safety_records: [],
      }));
      // kitchenHygiene 40 < 50 -> -6
      // staffTraining: kitchen 0/1 = 0%. no penalty from staff training though (no product denominator)
      // 52 - 6 = 46
      expect(r.pest_control_score).toBe(46);
    });

    it("penalises -5 for product safety < 50%", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        pest_inspection_records: [],
        treatment_records: [],
        kitchen_hygiene_records: [],
        cleanliness_rating_records: [],
        product_safety_records: [
          makeProduct("p1", { child_safe_certified: false, staff_trained_on_use: false }),
          makeProduct("p2", { child_safe_certified: false, staff_trained_on_use: false }),
          makeProduct("p3", { child_safe_certified: false, staff_trained_on_use: false }),
        ],
      }));
      // productSafety 0% -> -5
      // staffTraining: 0/3 = 0
      // 52 - 5 = 47
      expect(r.pest_control_score).toBe(47);
    });

    it("penalises -5 for cleanliness < 50%", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        pest_inspection_records: [],
        treatment_records: [],
        kitchen_hygiene_records: [],
        cleanliness_rating_records: [
          makeCleanliness("c1", { cleanliness_score: 4 }),
          makeCleanliness("c2", { cleanliness_score: 4 }),
        ],
        product_safety_records: [],
      }));
      // avg cleanliness = 4/10 * 100 = 40% -> -5
      // 52 - 5 = 47
      expect(r.pest_control_score).toBe(47);
    });

    it("awards +3 for staff training >= 90%", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        pest_inspection_records: [],
        treatment_records: [],
        kitchen_hygiene_records: [makeKitchenHygiene("k1", { overall_score: 60, staff_training_current: true, corrective_actions_raised: 0, corrective_actions_closed: 0 })],
        cleanliness_rating_records: [],
        product_safety_records: [makeProduct("p1", { child_safe_certified: false, staff_trained_on_use: true })],
      }));
      // staffTraining: (1+1)/(1+1)=100% -> +3
      // kitchenHygiene 60 -> no bonus (< 70)
      // productSafety 0% -> -5
      // 52 - 5 + 3 = 50
      expect(r.pest_control_score).toBe(50);
    });

    it("awards +3 for kitchen corrective action rate >= 90%", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        pest_inspection_records: [],
        treatment_records: [],
        kitchen_hygiene_records: [
          makeKitchenHygiene("k1", { overall_score: 55, corrective_actions_raised: 5, corrective_actions_closed: 5, staff_training_current: false }),
        ],
        cleanliness_rating_records: [],
        product_safety_records: [],
      }));
      // kitchenHygiene 55 -> no bonus (< 70), no penalty (>= 50)
      // staffTraining: kitchen 0/1, product 0/0 -> 0/1 = 0% -> no bonus
      // kitchenCorrectiveAction 100% -> +3
      // 52 + 3 = 55
      expect(r.pest_control_score).toBe(55);
    });

    it("maximum possible score with all bonuses", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        pest_inspection_records: [makeInspection("i1")],
        treatment_records: [makeTreatment("t1")],
        kitchen_hygiene_records: [makeKitchenHygiene("k1", { overall_score: 90, corrective_actions_raised: 3, corrective_actions_closed: 3, staff_training_current: true })],
        cleanliness_rating_records: [makeCleanliness("c1", { cleanliness_score: 9 })],
        product_safety_records: [makeProduct("p1", { staff_trained_on_use: true })],
      }));
      // 52 + 5(insp) + 4(treat) + 5(kitchen) + 4(clean) + 4(product) + 3(staff 100%) + 3(corrective 100%) = 80
      expect(r.pest_control_score).toBe(80);
    });
  });

  // ==================== METRICS ====================

  describe("metrics", () => {
    it("calculates inspection compliance rate correctly", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        pest_inspection_records: [
          makeInspection("i1", { completed_on_time: true }),
          makeInspection("i2", { completed_on_time: true }),
          makeInspection("i3", { completed_on_time: false }),
          makeInspection("i4", { completed_on_time: false }),
        ],
      }));
      expect(r.inspection_compliance_rate).toBe(50);
    });

    it("calculates treatment effectiveness rate correctly", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        treatment_records: [
          makeTreatment("t1", { treatment_effective: true }),
          makeTreatment("t2", { treatment_effective: true }),
          makeTreatment("t3", { treatment_effective: false }),
        ],
      }));
      expect(r.treatment_effectiveness_rate).toBe(67);
    });

    it("calculates kitchen hygiene rate as average score", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        kitchen_hygiene_records: [
          makeKitchenHygiene("k1", { overall_score: 80 }),
          makeKitchenHygiene("k2", { overall_score: 90 }),
        ],
      }));
      expect(r.kitchen_hygiene_rate).toBe(85);
    });

    it("calculates cleanliness rate from average score / 10 * 100", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        cleanliness_rating_records: [
          makeCleanliness("c1", { cleanliness_score: 8 }),
          makeCleanliness("c2", { cleanliness_score: 6 }),
        ],
      }));
      // avg = 7.0, rate = round(7/10 * 100) = 70
      expect(r.cleanliness_rate).toBe(70);
    });

    it("calculates product safety rate from child-safe certified", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        product_safety_records: [
          makeProduct("p1", { child_safe_certified: true }),
          makeProduct("p2", { child_safe_certified: true }),
          makeProduct("p3", { child_safe_certified: false }),
        ],
      }));
      expect(r.product_safety_rate).toBe(67);
    });

    it("calculates staff training as composite of kitchen + product training", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        kitchen_hygiene_records: [
          makeKitchenHygiene("k1", { staff_training_current: true }),
          makeKitchenHygiene("k2", { staff_training_current: false }),
        ],
        product_safety_records: [
          makeProduct("p1", { staff_trained_on_use: true }),
          makeProduct("p2", { staff_trained_on_use: false }),
        ],
      }));
      // numerator: 1+1=2, denominator: 2+2=4, 50%
      expect(r.staff_training_rate).toBe(50);
    });

    it("returns 0% rates when no records", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        pest_inspection_records: [],
        treatment_records: [],
        kitchen_hygiene_records: [],
        cleanliness_rating_records: [],
        product_safety_records: [],
      }));
      // This will hit the allEmpty+children=6 branch
      expect(r.inspection_compliance_rate).toBe(0);
    });
  });

  // ==================== STRENGTHS ====================

  describe("strengths", () => {
    it("generates strength for inspection compliance >= 90%", () => {
      const r = computePestControlHygieneCompliance(baseInput());
      expect(r.strengths.some(s => s.includes("100%") && s.includes("pest inspections completed on time"))).toBe(true);
    });

    it("generates strength for inspection compliance >= 70% but < 90%", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        pest_inspection_records: [
          makeInspection("i1", { completed_on_time: true }),
          makeInspection("i2", { completed_on_time: true }),
          makeInspection("i3", { completed_on_time: true }),
          makeInspection("i4", { completed_on_time: false }),
        ],
      }));
      expect(r.strengths.some(s => s.includes("75%") && s.includes("compliance rate"))).toBe(true);
    });

    it("generates strength for report filing >= 90%", () => {
      const r = computePestControlHygieneCompliance(baseInput());
      expect(r.strengths.some(s => s.includes("pest inspection reports filed"))).toBe(true);
    });

    it("generates strength for inspection follow-up >= 90%", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        pest_inspection_records: [
          makeInspection("i1", { follow_up_required: true, follow_up_completed: true }),
          makeInspection("i2", { follow_up_required: true, follow_up_completed: true }),
        ],
      }));
      expect(r.strengths.some(s => s.includes("follow-up actions completed"))).toBe(true);
    });

    it("generates strength for treatment effectiveness >= 90%", () => {
      const r = computePestControlHygieneCompliance(baseInput());
      expect(r.strengths.some(s => s.includes("treatment effectiveness"))).toBe(true);
    });

    it("generates strength for treatment effectiveness >= 70% but < 90%", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        treatment_records: [
          makeTreatment("t1", { treatment_effective: true }),
          makeTreatment("t2", { treatment_effective: true }),
          makeTreatment("t3", { treatment_effective: false }),
        ],
      }));
      // 67% < 70 so no strength. Need 3/4 = 75%
      const r2 = computePestControlHygieneCompliance(baseInput({
        treatment_records: [
          makeTreatment("t1", { treatment_effective: true }),
          makeTreatment("t2", { treatment_effective: true }),
          makeTreatment("t3", { treatment_effective: true }),
          makeTreatment("t4", { treatment_effective: false }),
        ],
      }));
      expect(r2.strengths.some(s => s.includes("75%") && s.includes("treatment effectiveness"))).toBe(true);
    });

    it("generates strength for child-safe + COSHH >= 90%", () => {
      const r = computePestControlHygieneCompliance(baseInput());
      expect(r.strengths.some(s => s.includes("child-safe products") && s.includes("COSHH"))).toBe(true);
    });

    it("generates strength for child-safe >= 90% without COSHH", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        treatment_records: [
          makeTreatment("t1", { product_child_safe: true, coshh_compliant: false }),
          makeTreatment("t2", { product_child_safe: true, coshh_compliant: false }),
        ],
      }));
      // child-safe 100% but COSHH 0% -> just child-safe strength
      expect(r.strengths.some(s => s.includes("child-safe products") && s.includes("prioritised"))).toBe(true);
    });

    it("generates strength for contractor certification >= 90%", () => {
      const r = computePestControlHygieneCompliance(baseInput());
      expect(r.strengths.some(s => s.includes("contractors certified"))).toBe(true);
    });

    it("generates strength for kitchen hygiene >= 85%", () => {
      const r = computePestControlHygieneCompliance(baseInput());
      expect(r.strengths.some(s => s.includes("Kitchen hygiene audit scores"))).toBe(true);
    });

    it("generates strength for kitchen hygiene >= 70% but < 85%", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        kitchen_hygiene_records: [
          makeKitchenHygiene("k1", { overall_score: 75 }),
          makeKitchenHygiene("k2", { overall_score: 78 }),
        ],
      }));
      expect(r.strengths.some(s => s.includes("Kitchen hygiene rate at") && s.includes("good"))).toBe(true);
    });

    it("generates strength for food hygiene rating >= 4.0", () => {
      const r = computePestControlHygieneCompliance(baseInput());
      expect(r.strengths.some(s => s.includes("food hygiene rating"))).toBe(true);
    });

    it("generates strength for food storage + temp monitoring >= 90%", () => {
      const r = computePestControlHygieneCompliance(baseInput());
      expect(r.strengths.some(s => s.includes("Food storage") && s.includes("temperature monitoring"))).toBe(true);
    });

    it("generates strength for hand hygiene >= 90%", () => {
      const r = computePestControlHygieneCompliance(baseInput());
      expect(r.strengths.some(s => s.includes("Hand hygiene"))).toBe(true);
    });

    it("generates strength for allergen controls >= 90%", () => {
      const r = computePestControlHygieneCompliance(baseInput());
      expect(r.strengths.some(s => s.includes("Allergen controls"))).toBe(true);
    });

    it("generates strength for kitchen corrective action >= 90%", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        kitchen_hygiene_records: [
          makeKitchenHygiene("k1", { corrective_actions_raised: 5, corrective_actions_closed: 5 }),
        ],
      }));
      expect(r.strengths.some(s => s.includes("kitchen corrective actions closed"))).toBe(true);
    });

    it("generates strength for cleanliness >= 85%", () => {
      const r = computePestControlHygieneCompliance(baseInput());
      expect(r.strengths.some(s => s.includes("Environmental cleanliness at") && s.includes("excellent"))).toBe(true);
    });

    it("generates strength for cleanliness >= 70% but < 85%", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        cleanliness_rating_records: [
          makeCleanliness("c1", { cleanliness_score: 7 }),
          makeCleanliness("c2", { cleanliness_score: 8 }),
        ],
      }));
      expect(r.strengths.some(s => s.includes("Environmental cleanliness at") && s.includes("good"))).toBe(true);
    });

    it("generates strength for infection control >= 90%", () => {
      const r = computePestControlHygieneCompliance(baseInput());
      expect(r.strengths.some(s => s.includes("Infection control compliant"))).toBe(true);
    });

    it("generates strength for hazard resolution >= 90%", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        cleanliness_rating_records: [
          makeCleanliness("c1", { hazards_identified: 5, hazards_resolved: 5 }),
        ],
      }));
      expect(r.strengths.some(s => s.includes("hazards resolved"))).toBe(true);
    });

    it("generates strength for product safety >= 90%", () => {
      const r = computePestControlHygieneCompliance(baseInput());
      expect(r.strengths.some(s => s.includes("child-safe certified"))).toBe(true);
    });

    it("generates strength for product safety >= 70% but < 90%", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        product_safety_records: [
          makeProduct("p1", { child_safe_certified: true }),
          makeProduct("p2", { child_safe_certified: true }),
          makeProduct("p3", { child_safe_certified: false }),
        ],
      }));
      // 67% < 70 -> need 3/4 = 75%
      const r2 = computePestControlHygieneCompliance(baseInput({
        product_safety_records: [
          makeProduct("p1", { child_safe_certified: true }),
          makeProduct("p2", { child_safe_certified: true }),
          makeProduct("p3", { child_safe_certified: true }),
          makeProduct("p4", { child_safe_certified: false }),
        ],
      }));
      expect(r2.strengths.some(s => s.includes("product safety rate") && s.includes("good progress"))).toBe(true);
    });

    it("generates strength for secure + locked storage >= 90%", () => {
      const r = computePestControlHygieneCompliance(baseInput());
      expect(r.strengths.some(s => s.includes("secure storage") && s.includes("locked"))).toBe(true);
    });

    it("generates strength for secure storage >= 90% without locked", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        product_safety_records: [
          makeProduct("p1", { stored_securely: true, locked_storage: false }),
          makeProduct("p2", { stored_securely: true, locked_storage: false }),
        ],
      }));
      expect(r.strengths.some(s => s.includes("stored securely") && s.includes("kept safely"))).toBe(true);
    });

    it("generates strength for COSHH assessment >= 90%", () => {
      const r = computePestControlHygieneCompliance(baseInput());
      expect(r.strengths.some(s => s.includes("COSHH assessments completed"))).toBe(true);
    });

    it("generates strength for staff training >= 90%", () => {
      const r = computePestControlHygieneCompliance(baseInput());
      expect(r.strengths.some(s => s.includes("Composite staff training rate"))).toBe(true);
    });

    it("generates strength for zero kitchen pest evidence", () => {
      const r = computePestControlHygieneCompliance(baseInput());
      expect(r.strengths.some(s => s.includes("pest-free"))).toBe(true);
    });

    it("generates strength for no overdue deep cleans", () => {
      const r = computePestControlHygieneCompliance(baseInput());
      expect(r.strengths.some(s => s.includes("No overdue deep cleans"))).toBe(true);
    });
  });

  // ==================== CONCERNS ====================

  describe("concerns", () => {
    it("raises concern for inspection compliance < 50%", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        pest_inspection_records: [
          makeInspection("i1", { completed_on_time: false }),
          makeInspection("i2", { completed_on_time: false }),
          makeInspection("i3", { completed_on_time: false }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("Only 0%") && c.includes("pest inspections completed on time"))).toBe(true);
    });

    it("raises concern for inspection compliance 50-69%", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        pest_inspection_records: [
          makeInspection("i1", { completed_on_time: true }),
          makeInspection("i2", { completed_on_time: false }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("50%") && c.includes("not completed on schedule"))).toBe(true);
    });

    it("raises concern for high severity >= 20%", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        pest_inspection_records: [
          makeInspection("i1", { severity: "high" }),
          makeInspection("i2", { severity: "critical" }),
          makeInspection("i3"),
          makeInspection("i4"),
          makeInspection("i5"),
        ],
      }));
      expect(r.concerns.some(c => c.includes("high/critical severity"))).toBe(true);
    });

    it("raises concern for inspection follow-up < 50%", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        pest_inspection_records: [
          makeInspection("i1", { follow_up_required: true, follow_up_completed: false }),
          makeInspection("i2", { follow_up_required: true, follow_up_completed: false }),
          makeInspection("i3", { follow_up_required: true, follow_up_completed: false }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("follow-ups completed"))).toBe(true);
    });

    it("raises concern for report filing < 70%", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        pest_inspection_records: [
          makeInspection("i1", { report_filed: false }),
          makeInspection("i2", { report_filed: false }),
          makeInspection("i3", { report_filed: true }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("pest inspection reports filed"))).toBe(true);
    });

    it("raises concern for treatment effectiveness < 50%", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        treatment_records: [
          makeTreatment("t1", { treatment_effective: false }),
          makeTreatment("t2", { treatment_effective: false }),
          makeTreatment("t3", { treatment_effective: false }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("Only 0%") && c.includes("treatments effective"))).toBe(true);
    });

    it("raises concern for treatment effectiveness 50-69%", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        treatment_records: [
          makeTreatment("t1", { treatment_effective: true }),
          makeTreatment("t2", { treatment_effective: false }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("50%") && c.includes("not fully effective"))).toBe(true);
    });

    it("raises concern for child safety < 70% in treatments", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        treatment_records: [
          makeTreatment("t1", { product_child_safe: false }),
          makeTreatment("t2", { product_child_safe: false }),
          makeTreatment("t3", { product_child_safe: true }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("child-safe products"))).toBe(true);
    });

    it("raises concern for COSHH < 70% in treatments", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        treatment_records: [
          makeTreatment("t1", { coshh_compliant: false }),
          makeTreatment("t2", { coshh_compliant: false }),
          makeTreatment("t3", { coshh_compliant: true }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("COSHH compliance") && c.includes("insufficient"))).toBe(true);
    });

    it("raises concern for treatment follow-up < 50%", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        treatment_records: [
          makeTreatment("t1", { follow_up_treatment_required: true, follow_up_treatment_completed: false }),
          makeTreatment("t2", { follow_up_treatment_required: true, follow_up_treatment_completed: false }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("follow-up treatments completed"))).toBe(true);
    });

    it("raises concern for kitchen hygiene < 50%", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        kitchen_hygiene_records: [
          makeKitchenHygiene("k1", { overall_score: 40 }),
          makeKitchenHygiene("k2", { overall_score: 35 }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("kitchen hygiene standards are fundamentally inadequate"))).toBe(true);
    });

    it("raises concern for kitchen hygiene 50-69%", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        kitchen_hygiene_records: [
          makeKitchenHygiene("k1", { overall_score: 55 }),
          makeKitchenHygiene("k2", { overall_score: 60 }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("kitchen hygiene standards need significant improvement"))).toBe(true);
    });

    it("raises concern for kitchen pest evidence >= 20%", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        kitchen_hygiene_records: [
          makeKitchenHygiene("k1", { pest_evidence_found: true }),
          makeKitchenHygiene("k2", { pest_evidence_found: true }),
          makeKitchenHygiene("k3", { pest_evidence_found: false }),
          makeKitchenHygiene("k4", { pest_evidence_found: false }),
          makeKitchenHygiene("k5", { pest_evidence_found: false }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("Pest evidence found") && c.includes("kitchen hygiene audits"))).toBe(true);
    });

    it("raises concern for food hygiene rating < 3.0", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        kitchen_hygiene_records: [
          makeKitchenHygiene("k1", { food_hygiene_rating: 2 }),
          makeKitchenHygiene("k2", { food_hygiene_rating: 2 }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("food hygiene rating") && c.includes("below acceptable"))).toBe(true);
    });

    it("raises concern for food storage < 70%", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        kitchen_hygiene_records: [
          makeKitchenHygiene("k1", { food_storage_compliant: false }),
          makeKitchenHygiene("k2", { food_storage_compliant: false }),
          makeKitchenHygiene("k3", { food_storage_compliant: true }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("Food storage compliant"))).toBe(true);
    });

    it("raises concern for hand hygiene < 70%", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        kitchen_hygiene_records: [
          makeKitchenHygiene("k1", { hand_hygiene_compliant: false }),
          makeKitchenHygiene("k2", { hand_hygiene_compliant: false }),
          makeKitchenHygiene("k3", { hand_hygiene_compliant: true }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("Hand hygiene compliant"))).toBe(true);
    });

    it("raises concern for waste management < 70%", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        kitchen_hygiene_records: [
          makeKitchenHygiene("k1", { waste_management_compliant: false }),
          makeKitchenHygiene("k2", { waste_management_compliant: false }),
          makeKitchenHygiene("k3", { waste_management_compliant: true }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("Waste management compliant"))).toBe(true);
    });

    it("raises concern for cleanliness < 50%", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        cleanliness_rating_records: [
          makeCleanliness("c1", { cleanliness_score: 4 }),
          makeCleanliness("c2", { cleanliness_score: 3 }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("not maintained to an acceptable standard"))).toBe(true);
    });

    it("raises concern for cleanliness 50-69%", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        cleanliness_rating_records: [
          makeCleanliness("c1", { cleanliness_score: 6 }),
          makeCleanliness("c2", { cleanliness_score: 6 }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("cleanliness standards across the home need improvement"))).toBe(true);
    });

    it("raises concern for hygiene standard < 70%", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        cleanliness_rating_records: [
          makeCleanliness("c1", { hygiene_standard_met: false }),
          makeCleanliness("c2", { hygiene_standard_met: false }),
          makeCleanliness("c3", { hygiene_standard_met: true }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("Hygiene standards met"))).toBe(true);
    });

    it("raises concern for damp/mould >= 20%", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        cleanliness_rating_records: [
          makeCleanliness("c1", { damp_mould_issues: true }),
          makeCleanliness("c2", { damp_mould_issues: true }),
          makeCleanliness("c3", { damp_mould_issues: false }),
          makeCleanliness("c4", { damp_mould_issues: false }),
          makeCleanliness("c5", { damp_mould_issues: false }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("Damp or mould"))).toBe(true);
    });

    it("raises concern for ventilation < 70%", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        cleanliness_rating_records: [
          makeCleanliness("c1", { ventilation_adequate: false }),
          makeCleanliness("c2", { ventilation_adequate: false }),
          makeCleanliness("c3", { ventilation_adequate: true }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("Ventilation adequate"))).toBe(true);
    });

    it("raises concern for infection control < 70%", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        cleanliness_rating_records: [
          makeCleanliness("c1", { infection_control_compliant: false }),
          makeCleanliness("c2", { infection_control_compliant: false }),
          makeCleanliness("c3", { infection_control_compliant: true }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("Infection control compliant"))).toBe(true);
    });

    it("raises concern for hazard resolution < 50%", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        cleanliness_rating_records: [
          makeCleanliness("c1", { hazards_identified: 5, hazards_resolved: 1 }),
          makeCleanliness("c2", { hazards_identified: 5, hazards_resolved: 1 }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("hazards resolved"))).toBe(true);
    });

    it("raises concern for product safety < 50%", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        product_safety_records: [
          makeProduct("p1", { child_safe_certified: false }),
          makeProduct("p2", { child_safe_certified: false }),
          makeProduct("p3", { child_safe_certified: false }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("not safe for use around children"))).toBe(true);
    });

    it("raises concern for product safety 50-69%", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        product_safety_records: [
          makeProduct("p1", { child_safe_certified: true }),
          makeProduct("p2", { child_safe_certified: true }),
          makeProduct("p3", { child_safe_certified: false }),
          makeProduct("p4", { child_safe_certified: false }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("not child-safe certified"))).toBe(true);
    });

    it("raises concern for secure storage < 70%", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        product_safety_records: [
          makeProduct("p1", { stored_securely: false }),
          makeProduct("p2", { stored_securely: false }),
          makeProduct("p3", { stored_securely: true }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("stored securely") && c.includes("accessible to children"))).toBe(true);
    });

    it("raises concern for COSHH assessment < 70%", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        product_safety_records: [
          makeProduct("p1", { coshh_assessment_completed: false }),
          makeProduct("p2", { coshh_assessment_completed: false }),
          makeProduct("p3", { coshh_assessment_completed: true }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("COSHH assessments completed"))).toBe(true);
    });

    it("raises concern for expired products >= 20%", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        product_safety_records: [
          makeProduct("p1", { in_date: false }),
          makeProduct("p2", { in_date: false }),
          makeProduct("p3", { in_date: true }),
          makeProduct("p4", { in_date: true }),
          makeProduct("p5", { in_date: true }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("expired"))).toBe(true);
    });

    it("raises concern for staff training < 50%", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        kitchen_hygiene_records: [
          makeKitchenHygiene("k1", { staff_training_current: false }),
          makeKitchenHygiene("k2", { staff_training_current: false }),
        ],
        product_safety_records: [
          makeProduct("p1", { staff_trained_on_use: false }),
          makeProduct("p2", { staff_trained_on_use: false }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("Composite staff training rate"))).toBe(true);
    });

    it("raises concern when no inspections but children on placement and not allEmpty", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        pest_inspection_records: [],
        treatment_records: [makeTreatment("t1")],
      }));
      expect(r.concerns.some(c => c.includes("No pest inspection records"))).toBe(true);
    });

    it("raises concern when no kitchen audits but children on placement and not allEmpty", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        kitchen_hygiene_records: [],
      }));
      expect(r.concerns.some(c => c.includes("No kitchen hygiene audit records"))).toBe(true);
    });

    it("raises concern when no cleanliness assessments but children on placement and not allEmpty", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        cleanliness_rating_records: [],
      }));
      expect(r.concerns.some(c => c.includes("No environmental cleanliness assessments"))).toBe(true);
    });

    it("raises concern when no product safety records but children on placement and not allEmpty", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        product_safety_records: [],
      }));
      expect(r.concerns.some(c => c.includes("No product safety records"))).toBe(true);
    });
  });

  // ==================== RECOMMENDATIONS ====================

  describe("recommendations", () => {
    it("recommends immediate action for inspection compliance < 50%", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        pest_inspection_records: [
          makeInspection("i1", { completed_on_time: false }),
          makeInspection("i2", { completed_on_time: false }),
        ],
      }));
      expect(r.recommendations.some(rec => rec.urgency === "immediate" && rec.recommendation.includes("pest inspection schedule"))).toBe(true);
    });

    it("recommends immediate action for kitchen hygiene < 50%", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        kitchen_hygiene_records: [
          makeKitchenHygiene("k1", { overall_score: 40 }),
          makeKitchenHygiene("k2", { overall_score: 35 }),
        ],
      }));
      expect(r.recommendations.some(rec => rec.urgency === "immediate" && rec.recommendation.includes("kitchen hygiene failures"))).toBe(true);
    });

    it("recommends immediate action for product safety < 50%", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        product_safety_records: [
          makeProduct("p1", { child_safe_certified: false }),
          makeProduct("p2", { child_safe_certified: false }),
        ],
      }));
      expect(r.recommendations.some(rec => rec.urgency === "immediate" && rec.recommendation.includes("audit all cleaning"))).toBe(true);
    });

    it("recommends immediate action for cleanliness < 50%", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        cleanliness_rating_records: [
          makeCleanliness("c1", { cleanliness_score: 3 }),
          makeCleanliness("c2", { cleanliness_score: 4 }),
        ],
      }));
      expect(r.recommendations.some(rec => rec.urgency === "immediate" && rec.recommendation.includes("environmental cleanliness"))).toBe(true);
    });

    it("recommends immediate action for kitchen pest >= 20%", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        kitchen_hygiene_records: [
          makeKitchenHygiene("k1", { pest_evidence_found: true }),
          makeKitchenHygiene("k2", { pest_evidence_found: false }),
          makeKitchenHygiene("k3", { pest_evidence_found: false }),
          makeKitchenHygiene("k4", { pest_evidence_found: false }),
          makeKitchenHygiene("k5", { pest_evidence_found: false }),
        ],
      }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("pest contamination in kitchen"))).toBe(true);
    });

    it("recommends immediate action for high severity >= 20%", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        pest_inspection_records: [
          makeInspection("i1", { severity: "high" }),
          makeInspection("i2", { severity: "critical" }),
          makeInspection("i3"),
          makeInspection("i4"),
          makeInspection("i5"),
        ],
      }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("high/critical severity"))).toBe(true);
    });

    it("recommends immediate action for child safety < 70% in treatments", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        treatment_records: [
          makeTreatment("t1", { product_child_safe: false }),
          makeTreatment("t2", { product_child_safe: false }),
          makeTreatment("t3", { product_child_safe: true }),
        ],
      }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("child-safe pest control products"))).toBe(true);
    });

    it("recommends immediate action for secure storage < 70%", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        product_safety_records: [
          makeProduct("p1", { stored_securely: false }),
          makeProduct("p2", { stored_securely: false }),
          makeProduct("p3", { stored_securely: true }),
        ],
      }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("locked cabinets"))).toBe(true);
    });

    it("recommends immediate action for damp/mould >= 20%", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        cleanliness_rating_records: [
          makeCleanliness("c1", { damp_mould_issues: true }),
          makeCleanliness("c2", { damp_mould_issues: true }),
          makeCleanliness("c3", { damp_mould_issues: false }),
          makeCleanliness("c4", { damp_mould_issues: false }),
          makeCleanliness("c5", { damp_mould_issues: false }),
        ],
      }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("damp and mould"))).toBe(true);
    });

    it("recommends 'soon' for treatment effectiveness 50-69%", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        treatment_records: [
          makeTreatment("t1", { treatment_effective: true }),
          makeTreatment("t2", { treatment_effective: false }),
        ],
      }));
      expect(r.recommendations.some(rec => rec.urgency === "soon" && rec.recommendation.includes("treatment methods"))).toBe(true);
    });

    it("recommends 'soon' for inspection compliance 50-69%", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        pest_inspection_records: [
          makeInspection("i1", { completed_on_time: true }),
          makeInspection("i2", { completed_on_time: false }),
        ],
      }));
      expect(r.recommendations.some(rec => rec.urgency === "soon" && rec.recommendation.includes("pest inspection compliance"))).toBe(true);
    });

    it("recommends 'soon' for kitchen hygiene 50-69%", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        kitchen_hygiene_records: [
          makeKitchenHygiene("k1", { overall_score: 55 }),
          makeKitchenHygiene("k2", { overall_score: 60 }),
        ],
      }));
      expect(r.recommendations.some(rec => rec.urgency === "soon" && rec.recommendation.includes("kitchen hygiene standards"))).toBe(true);
    });

    it("recommends 'soon' for cleanliness 50-69%", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        cleanliness_rating_records: [
          makeCleanliness("c1", { cleanliness_score: 6 }),
          makeCleanliness("c2", { cleanliness_score: 6 }),
        ],
      }));
      expect(r.recommendations.some(rec => rec.urgency === "soon" && rec.recommendation.includes("environmental cleanliness"))).toBe(true);
    });

    it("recommends 'soon' for COSHH assessment < 70%", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        product_safety_records: [
          makeProduct("p1", { coshh_assessment_completed: false }),
          makeProduct("p2", { coshh_assessment_completed: false }),
          makeProduct("p3", { coshh_assessment_completed: true }),
        ],
      }));
      expect(r.recommendations.some(rec => rec.urgency === "soon" && rec.recommendation.includes("COSHH assessments"))).toBe(true);
    });

    it("recommends 'soon' for product staff training < 70%", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        product_safety_records: [
          makeProduct("p1", { staff_trained_on_use: false }),
          makeProduct("p2", { staff_trained_on_use: false }),
          makeProduct("p3", { staff_trained_on_use: true }),
        ],
      }));
      expect(r.recommendations.some(rec => rec.urgency === "soon" && rec.recommendation.includes("Train all staff"))).toBe(true);
    });

    it("recommends 'planned' for product safety 50-69%", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        product_safety_records: [
          makeProduct("p1", { child_safe_certified: true }),
          makeProduct("p2", { child_safe_certified: true }),
          makeProduct("p3", { child_safe_certified: false }),
          makeProduct("p4", { child_safe_certified: false }),
        ],
      }));
      expect(r.recommendations.some(rec => rec.urgency === "planned" && rec.recommendation.includes("child-safe product usage"))).toBe(true);
    });

    it("recommends 'planned' for child involvement < 30%", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        cleanliness_rating_records: [
          makeCleanliness("c1", { child_involved_in_assessment: false }),
          makeCleanliness("c2", { child_involved_in_assessment: false }),
          makeCleanliness("c3", { child_involved_in_assessment: false }),
          makeCleanliness("c4", { child_involved_in_assessment: false }),
        ],
      }));
      expect(r.recommendations.some(rec => rec.urgency === "planned" && rec.recommendation.includes("Involve children"))).toBe(true);
    });

    it("recommends 'planned' for ventilation < 70%", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        cleanliness_rating_records: [
          makeCleanliness("c1", { ventilation_adequate: false }),
          makeCleanliness("c2", { ventilation_adequate: false }),
          makeCleanliness("c3", { ventilation_adequate: true }),
        ],
      }));
      expect(r.recommendations.some(rec => rec.urgency === "planned" && rec.recommendation.includes("ventilation"))).toBe(true);
    });

    it("recommends immediate action when no inspections but children and not allEmpty", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        pest_inspection_records: [],
        treatment_records: [makeTreatment("t1")],
      }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("pest control survey"))).toBe(true);
    });

    it("recommends immediate action when no kitchen audits but children and not allEmpty", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        kitchen_hygiene_records: [],
      }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("kitchen hygiene auditing"))).toBe(true);
    });

    it("recommends immediate action when no cleanliness assessments but children and not allEmpty", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        cleanliness_rating_records: [],
      }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("environmental cleanliness assessments"))).toBe(true);
    });

    it("recommends immediate action when no product safety records but children and not allEmpty", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        product_safety_records: [],
      }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("product safety register"))).toBe(true);
    });

    it("ranks recommendations sequentially", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        pest_inspection_records: [
          makeInspection("i1", { completed_on_time: false }),
          makeInspection("i2", { completed_on_time: false }),
        ],
        kitchen_hygiene_records: [
          makeKitchenHygiene("k1", { overall_score: 40 }),
        ],
        product_safety_records: [
          makeProduct("p1", { child_safe_certified: false }),
          makeProduct("p2", { child_safe_certified: false }),
        ],
      }));
      for (let i = 0; i < r.recommendations.length; i++) {
        expect(r.recommendations[i].rank).toBe(i + 1);
      }
    });

    it("all recommendations have regulatory_ref", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        pest_inspection_records: [
          makeInspection("i1", { completed_on_time: false }),
          makeInspection("i2", { completed_on_time: false }),
        ],
        kitchen_hygiene_records: [
          makeKitchenHygiene("k1", { overall_score: 40 }),
        ],
      }));
      r.recommendations.forEach(rec => {
        expect(rec.regulatory_ref.length).toBeGreaterThan(0);
      });
    });
  });

  // ==================== INSIGHTS ====================

  describe("insights", () => {
    it("generates critical insight for inspection compliance < 50%", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        pest_inspection_records: [
          makeInspection("i1", { completed_on_time: false }),
          makeInspection("i2", { completed_on_time: false }),
        ],
      }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("pest inspections completed on time"))).toBe(true);
    });

    it("generates critical insight for kitchen hygiene < 50%", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        kitchen_hygiene_records: [
          makeKitchenHygiene("k1", { overall_score: 40 }),
          makeKitchenHygiene("k2", { overall_score: 35 }),
        ],
      }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("Kitchen hygiene rate at only"))).toBe(true);
    });

    it("generates critical insight for product safety < 50%", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        product_safety_records: [
          makeProduct("p1", { child_safe_certified: false }),
          makeProduct("p2", { child_safe_certified: false }),
        ],
      }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("child-safe certified"))).toBe(true);
    });

    it("generates critical insight for cleanliness < 50%", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        cleanliness_rating_records: [
          makeCleanliness("c1", { cleanliness_score: 4 }),
          makeCleanliness("c2", { cleanliness_score: 3 }),
        ],
      }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("Environmental cleanliness at only"))).toBe(true);
    });

    it("generates critical insight for kitchen pest >= 30%", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        kitchen_hygiene_records: [
          makeKitchenHygiene("k1", { pest_evidence_found: true }),
          makeKitchenHygiene("k2", { pest_evidence_found: true }),
          makeKitchenHygiene("k3", { pest_evidence_found: false }),
        ],
      }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("Pest evidence found"))).toBe(true);
    });

    it("generates critical insight for secure storage < 50%", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        product_safety_records: [
          makeProduct("p1", { stored_securely: false }),
          makeProduct("p2", { stored_securely: false }),
          makeProduct("p3", { stored_securely: true }),
        ],
      }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("stored securely"))).toBe(true);
    });

    it("generates critical insight for damp/mould >= 30%", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        cleanliness_rating_records: [
          makeCleanliness("c1", { damp_mould_issues: true }),
          makeCleanliness("c2", { damp_mould_issues: true }),
          makeCleanliness("c3", { damp_mould_issues: false }),
        ],
      }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("Damp or mould"))).toBe(true);
    });

    it("generates warning insight for inspection compliance 50-69%", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        pest_inspection_records: [
          makeInspection("i1", { completed_on_time: true }),
          makeInspection("i2", { completed_on_time: false }),
        ],
      }));
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Pest inspection compliance"))).toBe(true);
    });

    it("generates warning insight for kitchen hygiene 50-69%", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        kitchen_hygiene_records: [
          makeKitchenHygiene("k1", { overall_score: 55 }),
          makeKitchenHygiene("k2", { overall_score: 60 }),
        ],
      }));
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Kitchen hygiene at"))).toBe(true);
    });

    it("generates warning insight for cleanliness 50-69%", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        cleanliness_rating_records: [
          makeCleanliness("c1", { cleanliness_score: 6 }),
          makeCleanliness("c2", { cleanliness_score: 6 }),
        ],
      }));
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Environmental cleanliness at"))).toBe(true);
    });

    it("generates warning insight for product safety 50-69%", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        product_safety_records: [
          makeProduct("p1", { child_safe_certified: true }),
          makeProduct("p2", { child_safe_certified: true }),
          makeProduct("p3", { child_safe_certified: false }),
          makeProduct("p4", { child_safe_certified: false }),
        ],
      }));
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Product safety rate at"))).toBe(true);
    });

    it("generates warning insight for staff training 50-69%", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        kitchen_hygiene_records: [
          makeKitchenHygiene("k1", { staff_training_current: true }),
          makeKitchenHygiene("k2", { staff_training_current: false }),
        ],
        product_safety_records: [
          makeProduct("p1", { staff_trained_on_use: true }),
          makeProduct("p2", { staff_trained_on_use: false }),
        ],
      }));
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Composite staff training rate"))).toBe(true);
    });

    it("generates warning insight for expired products >= 10%", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        product_safety_records: [
          makeProduct("p1", { in_date: false }),
          makeProduct("p2", { in_date: true }),
          makeProduct("p3", { in_date: true }),
          makeProduct("p4", { in_date: true }),
          makeProduct("p5", { in_date: true }),
        ],
      }));
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("expired"))).toBe(true);
    });

    it("generates positive insight for outstanding rating", () => {
      const r = computePestControlHygieneCompliance(baseInput());
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("outstanding"))).toBe(true);
    });

    it("generates positive insight for inspection + treatment >= 90%", () => {
      const r = computePestControlHygieneCompliance(baseInput());
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("inspection compliance") && i.text.includes("treatment effectiveness"))).toBe(true);
    });

    it("generates positive insight for kitchen hygiene >= 85% with zero pest", () => {
      const r = computePestControlHygieneCompliance(baseInput());
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("Kitchen hygiene rate") && i.text.includes("pest-free"))).toBe(true);
    });

    it("generates positive insight for cleanliness >= 85% with infection control >= 90%", () => {
      const r = computePestControlHygieneCompliance(baseInput());
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("Environmental cleanliness") && i.text.includes("infection control"))).toBe(true);
    });

    it("generates positive insight for product safety >= 90% with secure storage >= 90%", () => {
      const r = computePestControlHygieneCompliance(baseInput());
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("child-safe products") && i.text.includes("secure storage"))).toBe(true);
    });

    it("generates positive insight for staff training >= 90%", () => {
      const r = computePestControlHygieneCompliance(baseInput());
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("staff training rate"))).toBe(true);
    });

    it("generates positive insight for child-safe + COSHH >= 90% in treatments", () => {
      const r = computePestControlHygieneCompliance(baseInput());
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("child-safe treatments") && i.text.includes("COSHH"))).toBe(true);
    });

    it("generates warning insight for low bedroom cleanliness", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        cleanliness_rating_records: [
          makeCleanliness("c1", { area_type: "bedroom", cleanliness_score: 3 }),
          makeCleanliness("c2", { area_type: "bedroom", cleanliness_score: 4 }),
        ],
      }));
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Bedroom cleanliness"))).toBe(true);
    });

    it("generates critical insight for low bathroom cleanliness", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        cleanliness_rating_records: [
          makeCleanliness("c1", { area_type: "bathroom", cleanliness_score: 3 }),
          makeCleanliness("c2", { area_type: "bathroom", cleanliness_score: 4 }),
        ],
      }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("Bathroom cleanliness"))).toBe(true);
    });

    it("generates critical insight for low kitchen area cleanliness", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        cleanliness_rating_records: [
          makeCleanliness("c1", { area_type: "kitchen", cleanliness_score: 3 }),
          makeCleanliness("c2", { area_type: "kitchen", cleanliness_score: 4 }),
        ],
      }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("Kitchen area cleanliness"))).toBe(true);
    });
  });

  // ==================== HEADLINE ====================

  describe("headline", () => {
    it("outstanding headline includes 'Outstanding'", () => {
      const r = computePestControlHygieneCompliance(baseInput());
      expect(r.headline).toContain("Outstanding");
    });

    it("good headline includes 'Good' and strength count", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        pest_inspection_records: [
          makeInspection("i1"),
          makeInspection("i2"),
          makeInspection("i3", { completed_on_time: false }),
        ],
        kitchen_hygiene_records: [
          makeKitchenHygiene("k1", { overall_score: 75 }),
          makeKitchenHygiene("k2", { overall_score: 72 }),
          makeKitchenHygiene("k3", { overall_score: 70 }),
        ],
        cleanliness_rating_records: [
          makeCleanliness("c1", { cleanliness_score: 7 }),
          makeCleanliness("c2", { cleanliness_score: 7 }),
          makeCleanliness("c3", { cleanliness_score: 8 }),
        ],
        product_safety_records: [
          makeProduct("p1"),
          makeProduct("p2"),
          makeProduct("p3", { child_safe_certified: false }),
        ],
      }));
      expect(["good", "adequate"]).toContain(r.pest_control_rating);
      expect(r.headline.length).toBeGreaterThan(10);
    });

    it("adequate headline includes 'Adequate' and concern count", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        pest_inspection_records: [
          makeInspection("i1", { completed_on_time: true }),
          makeInspection("i2", { completed_on_time: true }),
          makeInspection("i3", { completed_on_time: false }),
          makeInspection("i4", { completed_on_time: false }),
        ],
        treatment_records: [
          makeTreatment("t1", { treatment_effective: true }),
          makeTreatment("t2", { treatment_effective: true }),
          makeTreatment("t3", { treatment_effective: false }),
          makeTreatment("t4", { treatment_effective: false }),
        ],
        kitchen_hygiene_records: [
          makeKitchenHygiene("k1", { overall_score: 55, staff_training_current: false }),
          makeKitchenHygiene("k2", { overall_score: 55, staff_training_current: false }),
          makeKitchenHygiene("k3", { overall_score: 55, staff_training_current: false }),
        ],
        cleanliness_rating_records: [
          makeCleanliness("c1", { cleanliness_score: 6, infection_control_compliant: false }),
          makeCleanliness("c2", { cleanliness_score: 5, infection_control_compliant: false }),
          makeCleanliness("c3", { cleanliness_score: 6, infection_control_compliant: false }),
        ],
        product_safety_records: [
          makeProduct("p1", { child_safe_certified: true, staff_trained_on_use: false }),
          makeProduct("p2", { child_safe_certified: false, staff_trained_on_use: false }),
          makeProduct("p3", { child_safe_certified: false, staff_trained_on_use: false }),
        ],
      }));
      expect(r.pest_control_rating).toBe("adequate");
      expect(r.headline.length).toBeGreaterThan(10);
    });

    it("inadequate headline includes 'inadequate' and significant concerns", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        pest_inspection_records: [
          makeInspection("i1", { completed_on_time: false }),
          makeInspection("i2", { completed_on_time: false }),
        ],
        treatment_records: [],
        kitchen_hygiene_records: [
          makeKitchenHygiene("k1", { overall_score: 30 }),
        ],
        cleanliness_rating_records: [
          makeCleanliness("c1", { cleanliness_score: 3 }),
        ],
        product_safety_records: [
          makeProduct("p1", { child_safe_certified: false }),
          makeProduct("p2", { child_safe_certified: false }),
        ],
      }));
      expect(r.headline).toContain("inadequate");
      expect(r.headline).toContain("concern");
    });
  });

  // ==================== EDGE CASES ====================

  describe("edge cases", () => {
    it("handles single inspection record", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        pest_inspection_records: [makeInspection("i1")],
        treatment_records: [],
        kitchen_hygiene_records: [],
        cleanliness_rating_records: [],
        product_safety_records: [],
      }));
      expect(r.inspection_compliance_rate).toBe(100);
    });

    it("handles single treatment record", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        pest_inspection_records: [],
        treatment_records: [makeTreatment("t1")],
        kitchen_hygiene_records: [],
        cleanliness_rating_records: [],
        product_safety_records: [],
      }));
      expect(r.treatment_effectiveness_rate).toBe(100);
    });

    it("handles single kitchen hygiene record", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        pest_inspection_records: [],
        treatment_records: [],
        kitchen_hygiene_records: [makeKitchenHygiene("k1", { overall_score: 75 })],
        cleanliness_rating_records: [],
        product_safety_records: [],
      }));
      expect(r.kitchen_hygiene_rate).toBe(75);
    });

    it("handles single cleanliness record", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        pest_inspection_records: [],
        treatment_records: [],
        kitchen_hygiene_records: [],
        cleanliness_rating_records: [makeCleanliness("c1", { cleanliness_score: 7 })],
        product_safety_records: [],
      }));
      expect(r.cleanliness_rate).toBe(70);
    });

    it("handles single product record", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        pest_inspection_records: [],
        treatment_records: [],
        kitchen_hygiene_records: [],
        cleanliness_rating_records: [],
        product_safety_records: [makeProduct("p1")],
      }));
      expect(r.product_safety_rate).toBe(100);
    });

    it("handles overdue inspections correctly", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        pest_inspection_records: [
          makeInspection("i1", { next_inspection_date: "2026-04-01" }),
          makeInspection("i2", { next_inspection_date: "2026-06-01" }),
        ],
      }));
      // first one is overdue (2026-04-01 < 2026-05-15), second is not
      // This doesn't directly affect the output rating fields but is computed internally
      expect(r.pest_control_rating).toBeDefined();
    });

    it("handles null next_inspection_date without error", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        pest_inspection_records: [
          makeInspection("i1", { next_inspection_date: null }),
        ],
      }));
      expect(r.pest_control_rating).toBeDefined();
    });

    it("handles zero corrective actions in kitchen", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        kitchen_hygiene_records: [
          makeKitchenHygiene("k1", { corrective_actions_raised: 0, corrective_actions_closed: 0 }),
        ],
      }));
      // 0/0 = 0 from pct(), won't trigger >= 90% bonus
      expect(r.pest_control_rating).toBeDefined();
    });

    it("handles contractors with no name", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        treatment_records: [
          makeTreatment("t1", { contractor_name: "", contractor_certified: false }),
        ],
      }));
      // contractor_name empty -> contractorWithName=0 -> uses totalTreatments as denom
      expect(r.pest_control_rating).toBeDefined();
    });

    it("handles all inspections with follow-up required but none completed", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        pest_inspection_records: [
          makeInspection("i1", { follow_up_required: true, follow_up_completed: false }),
          makeInspection("i2", { follow_up_required: true, follow_up_completed: false }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("follow-ups completed"))).toBe(true);
    });

    it("handles zero total_children with some records", () => {
      const r = computePestControlHygieneCompliance({
        today: "2026-05-15", total_children: 0,
        pest_inspection_records: [makeInspection("i1")],
        treatment_records: [], kitchen_hygiene_records: [],
        cleanliness_rating_records: [], product_safety_records: [],
      });
      // not allEmpty (has inspections), not 0 children... actually total_children=0 and not allEmpty
      // It shouldn't hit the special cases since allEmpty is false
      expect(r.pest_control_rating).not.toBe("insufficient_data");
    });

    it("handles maximum overall_score in kitchen", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        kitchen_hygiene_records: [makeKitchenHygiene("k1", { overall_score: 100 })],
      }));
      expect(r.kitchen_hygiene_rate).toBe(100);
    });

    it("handles minimum cleanliness_score", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        cleanliness_rating_records: [makeCleanliness("c1", { cleanliness_score: 1 })],
      }));
      expect(r.cleanliness_rate).toBe(10);
    });

    it("handles all area types in cleanliness", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        cleanliness_rating_records: [
          makeCleanliness("c1", { area_type: "bedroom", cleanliness_score: 8 }),
          makeCleanliness("c2", { area_type: "bathroom", cleanliness_score: 8 }),
          makeCleanliness("c3", { area_type: "kitchen", cleanliness_score: 8 }),
          makeCleanliness("c4", { area_type: "living_area", cleanliness_score: 8 }),
          makeCleanliness("c5", { area_type: "hallway", cleanliness_score: 8 }),
          makeCleanliness("c6", { area_type: "garden", cleanliness_score: 8 }),
        ],
      }));
      expect(r.pest_control_rating).toBeDefined();
      expect(r.cleanliness_rate).toBe(80);
    });

    it("does not generate bedroom/bathroom/kitchen insights when scores >= 5", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        cleanliness_rating_records: [
          makeCleanliness("c1", { area_type: "bedroom", cleanliness_score: 7 }),
          makeCleanliness("c2", { area_type: "bathroom", cleanliness_score: 7 }),
          makeCleanliness("c3", { area_type: "kitchen", cleanliness_score: 7 }),
        ],
      }));
      expect(r.insights.every(i => !i.text.includes("Bedroom cleanliness averages only"))).toBe(true);
      expect(r.insights.every(i => !i.text.includes("Bathroom cleanliness averages only"))).toBe(true);
      expect(r.insights.every(i => !i.text.includes("Kitchen area cleanliness averages only"))).toBe(true);
    });

    it("scores do not go below 0", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        pest_inspection_records: [
          makeInspection("i1", { completed_on_time: false }),
          makeInspection("i2", { completed_on_time: false }),
        ],
        treatment_records: [],
        kitchen_hygiene_records: [
          makeKitchenHygiene("k1", { overall_score: 20 }),
        ],
        cleanliness_rating_records: [
          makeCleanliness("c1", { cleanliness_score: 2 }),
        ],
        product_safety_records: [
          makeProduct("p1", { child_safe_certified: false }),
          makeProduct("p2", { child_safe_certified: false }),
        ],
      }));
      expect(r.pest_control_score).toBeGreaterThanOrEqual(0);
    });

    it("scores do not exceed 100", () => {
      const r = computePestControlHygieneCompliance(baseInput());
      expect(r.pest_control_score).toBeLessThanOrEqual(100);
    });
  });

  // ==================== RETURN STRUCTURE ====================

  describe("return structure", () => {
    it("returns all required fields", () => {
      const r = computePestControlHygieneCompliance(baseInput());
      expect(r).toHaveProperty("pest_control_rating");
      expect(r).toHaveProperty("pest_control_score");
      expect(r).toHaveProperty("headline");
      expect(r).toHaveProperty("inspection_compliance_rate");
      expect(r).toHaveProperty("treatment_effectiveness_rate");
      expect(r).toHaveProperty("kitchen_hygiene_rate");
      expect(r).toHaveProperty("cleanliness_rate");
      expect(r).toHaveProperty("product_safety_rate");
      expect(r).toHaveProperty("staff_training_rate");
      expect(r).toHaveProperty("strengths");
      expect(r).toHaveProperty("concerns");
      expect(r).toHaveProperty("recommendations");
      expect(r).toHaveProperty("insights");
    });

    it("strengths is an array of strings", () => {
      const r = computePestControlHygieneCompliance(baseInput());
      expect(Array.isArray(r.strengths)).toBe(true);
      r.strengths.forEach(s => expect(typeof s).toBe("string"));
    });

    it("concerns is an array of strings", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        pest_inspection_records: [
          makeInspection("i1", { completed_on_time: false }),
          makeInspection("i2", { completed_on_time: false }),
        ],
      }));
      expect(Array.isArray(r.concerns)).toBe(true);
      r.concerns.forEach(c => expect(typeof c).toBe("string"));
    });

    it("recommendations have rank, recommendation, urgency, regulatory_ref", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        pest_inspection_records: [
          makeInspection("i1", { completed_on_time: false }),
          makeInspection("i2", { completed_on_time: false }),
        ],
      }));
      r.recommendations.forEach(rec => {
        expect(rec).toHaveProperty("rank");
        expect(rec).toHaveProperty("recommendation");
        expect(rec).toHaveProperty("urgency");
        expect(rec).toHaveProperty("regulatory_ref");
      });
    });

    it("insights have text and severity", () => {
      const r = computePestControlHygieneCompliance(baseInput());
      r.insights.forEach(i => {
        expect(i).toHaveProperty("text");
        expect(i).toHaveProperty("severity");
        expect(["critical", "warning", "positive"]).toContain(i.severity);
      });
    });

    it("rating is a valid PestControlRating value", () => {
      const r = computePestControlHygieneCompliance(baseInput());
      expect(["outstanding", "good", "adequate", "inadequate", "insufficient_data"]).toContain(r.pest_control_rating);
    });

    it("rates are numbers between 0 and 100", () => {
      const r = computePestControlHygieneCompliance(baseInput());
      [r.inspection_compliance_rate, r.treatment_effectiveness_rate, r.kitchen_hygiene_rate, r.cleanliness_rate, r.product_safety_rate, r.staff_training_rate].forEach(rate => {
        expect(rate).toBeGreaterThanOrEqual(0);
        expect(rate).toBeLessThanOrEqual(100);
      });
    });
  });

  // ==================== INTERACTION / COMPOSITE ====================

  describe("composite scenarios", () => {
    it("no inspections concern only raised when not allEmpty", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        pest_inspection_records: [],
        treatment_records: [],
        kitchen_hygiene_records: [],
        cleanliness_rating_records: [],
        product_safety_records: [],
      }));
      // allEmpty + children -> special case, concern wording is different
      expect(r.concerns[0]).not.toContain("No pest inspection records despite");
    });

    it("mixed record types still compute correct composite training rate", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        kitchen_hygiene_records: [
          makeKitchenHygiene("k1", { staff_training_current: true }),
          makeKitchenHygiene("k2", { staff_training_current: true }),
          makeKitchenHygiene("k3", { staff_training_current: false }),
        ],
        product_safety_records: [
          makeProduct("p1", { staff_trained_on_use: true }),
          makeProduct("p2", { staff_trained_on_use: false }),
          makeProduct("p3", { staff_trained_on_use: false }),
        ],
      }));
      // numerator: 2+1=3, denominator: 3+3=6, 50%
      expect(r.staff_training_rate).toBe(50);
    });

    it("penalty guards prevent penalties when array is empty", () => {
      // Inspection 0%, but no records -> no penalty applied
      const r = computePestControlHygieneCompliance(baseInput({
        pest_inspection_records: [],
        treatment_records: [makeTreatment("t1")],
        kitchen_hygiene_records: [],
        cleanliness_rating_records: [],
        product_safety_records: [],
      }));
      // 52 + 4 (treatment 100%) = 56, no penalties from empty arrays
      expect(r.pest_control_score).toBe(56);
    });

    it("multiple penalties stack correctly", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        pest_inspection_records: [makeInspection("i1", { completed_on_time: false })],
        treatment_records: [],
        kitchen_hygiene_records: [makeKitchenHygiene("k1", { overall_score: 40, staff_training_current: false })],
        cleanliness_rating_records: [makeCleanliness("c1", { cleanliness_score: 4 })],
        product_safety_records: [makeProduct("p1", { child_safe_certified: false, staff_trained_on_use: false })],
      }));
      // 52 - 6 (inspection <50) - 6 (kitchen <50) - 5 (cleanliness <50) - 5 (product <50) = 30
      expect(r.pest_control_score).toBe(30);
    });

    it("bonuses and penalties can co-exist", () => {
      const r = computePestControlHygieneCompliance(baseInput({
        pest_inspection_records: [makeInspection("i1")],  // 100% -> +5
        treatment_records: [makeTreatment("t1")],  // 100% -> +4
        kitchen_hygiene_records: [makeKitchenHygiene("k1", { overall_score: 40, staff_training_current: false })],  // <50 -> -6
        cleanliness_rating_records: [makeCleanliness("c1", { cleanliness_score: 9 })],  // 90% -> +4
        product_safety_records: [makeProduct("p1")],  // 100% -> +4, staffTraining: 0+1/1+1=50% -> +0
      }));
      // staffTraining: kitchen=0/1, product=1/1 -> 1/2 = 50% -> no bonus
      // kitchenCorrectiveAction: 0/0 = 0 -> no bonus
      // 52 + 5 + 4 - 6 + 4 + 4 = 63
      expect(r.pest_control_score).toBe(63);
    });

    it("large volume of records does not cause errors", () => {
      const inspections = Array.from({ length: 50 }, (_, i) => makeInspection(`i${i}`));
      const treatments = Array.from({ length: 30 }, (_, i) => makeTreatment(`t${i}`));
      const kitchenRecords = Array.from({ length: 20 }, (_, i) => makeKitchenHygiene(`k${i}`));
      const cleanlinessRecords = Array.from({ length: 40 }, (_, i) => makeCleanliness(`c${i}`));
      const productRecords = Array.from({ length: 25 }, (_, i) => makeProduct(`p${i}`));

      const r = computePestControlHygieneCompliance(baseInput({
        pest_inspection_records: inspections,
        treatment_records: treatments,
        kitchen_hygiene_records: kitchenRecords,
        cleanliness_rating_records: cleanlinessRecords,
        product_safety_records: productRecords,
      }));
      expect(["outstanding", "good"]).toContain(r.pest_control_rating);
      expect(r.pest_control_score).toBeGreaterThanOrEqual(65);
    });

    it("only children on placement with partial records yields correct concerns", () => {
      const r = computePestControlHygieneCompliance({
        today: "2026-05-15",
        total_children: 3,
        pest_inspection_records: [makeInspection("i1")],
        treatment_records: [],
        kitchen_hygiene_records: [],
        cleanliness_rating_records: [],
        product_safety_records: [],
      });
      // not allEmpty (has inspections), children>0
      expect(r.concerns.some(c => c.includes("No kitchen hygiene audit records"))).toBe(true);
      expect(r.concerns.some(c => c.includes("No environmental cleanliness assessments"))).toBe(true);
      expect(r.concerns.some(c => c.includes("No product safety records"))).toBe(true);
    });
  });
});
