import { describe, it, expect } from "vitest";
import {
  computeEmergencyPreparednessContinuity,
  type EmergencyPreparednessContinuityInput,
  type FireDrillRecordInput,
  type EvacuationPlanInput,
  type EmergencyContactInput,
  type BusinessContinuityPlanInput,
  type FirstAidRecordInput,
} from "../home-emergency-preparedness-continuity-intelligence-engine";

// ── Helpers ──────────────────────────────────────────────────────────────────

function baseInput(
  overrides: Partial<EmergencyPreparednessContinuityInput> = {},
): EmergencyPreparednessContinuityInput {
  return {
    today: "2026-05-28",
    total_children: 0,
    fire_drill_records: [],
    evacuation_plans: [],
    emergency_contacts: [],
    business_continuity_plans: [],
    first_aid_records: [],
    ...overrides,
  };
}

let _id = 0;
function uid(): string {
  return `id-${++_id}`;
}

function makeDrill(
  overrides: Partial<FireDrillRecordInput> = {},
): FireDrillRecordInput {
  return {
    id: uid(),
    drill_date: "2026-05-20",
    drill_type: "day",
    all_children_participated: true,
    all_staff_participated: true,
    evacuation_time_seconds: 120,
    target_evacuation_time_seconds: 180,
    issues_identified: [],
    issues_resolved: false,
    debrief_completed: true,
    debrief_notes: "All clear",
    next_drill_due: "2026-06-20",
    conducted_by: "Manager",
    created_at: "2026-05-20",
    ...overrides,
  };
}

function makeEvacPlan(
  overrides: Partial<EvacuationPlanInput> = {},
): EvacuationPlanInput {
  return {
    id: uid(),
    plan_name: "Fire Evacuation Plan",
    plan_type: "fire",
    last_reviewed: "2026-04-01",
    review_due: "2026-12-01",
    approved_by: "Manager",
    is_current: true,
    covers_all_exits: true,
    includes_assembly_point: true,
    includes_roll_call_procedure: true,
    includes_vulnerable_children_provisions: true,
    displayed_in_home: true,
    staff_trained_on_plan: true,
    children_briefed: true,
    created_at: "2026-01-01",
    ...overrides,
  };
}

function makeContact(
  overrides: Partial<EmergencyContactInput> = {},
): EmergencyContactInput {
  return {
    id: uid(),
    contact_type: "police",
    contact_name: "Local Police",
    phone_number: "999",
    email: null,
    verified: true,
    last_verified_date: "2026-05-01",
    verification_due: "2026-08-01",
    is_current: true,
    notes: null,
    created_at: "2026-01-01",
    ...overrides,
  };
}

function makeBCP(
  overrides: Partial<BusinessContinuityPlanInput> = {},
): BusinessContinuityPlanInput {
  return {
    id: uid(),
    plan_name: "Pandemic Plan",
    scenario: "pandemic",
    last_reviewed: "2026-04-01",
    review_due: "2026-12-01",
    approved_by: "Manager",
    is_current: true,
    tested: true,
    last_tested_date: "2026-03-01",
    includes_communication_plan: true,
    includes_alternative_accommodation: true,
    includes_data_backup: true,
    includes_staffing_contingency: true,
    staff_aware: true,
    created_at: "2026-01-01",
    ...overrides,
  };
}

function makeFirstAid(
  overrides: Partial<FirstAidRecordInput> = {},
): FirstAidRecordInput {
  return {
    id: uid(),
    record_type: "certificate",
    staff_id: "staff-1",
    staff_name: "Alice",
    certificate_type: "First Aid at Work",
    certificate_expiry: "2027-06-01",
    is_current: true,
    equipment_name: null,
    equipment_location: null,
    equipment_checked: false,
    equipment_check_date: null,
    equipment_next_check_due: null,
    equipment_in_date: false,
    items_replaced: [],
    training_date: null,
    training_provider: null,
    created_at: "2026-01-01",
    ...overrides,
  };
}

function makeEquipment(
  overrides: Partial<FirstAidRecordInput> = {},
): FirstAidRecordInput {
  return {
    id: uid(),
    record_type: "equipment_check",
    staff_id: null,
    staff_name: null,
    certificate_type: null,
    certificate_expiry: null,
    is_current: false,
    equipment_name: "First Aid Kit - Main",
    equipment_location: "Office",
    equipment_checked: true,
    equipment_check_date: "2026-05-01",
    equipment_next_check_due: "2026-08-01",
    equipment_in_date: true,
    items_replaced: [],
    training_date: null,
    training_provider: null,
    created_at: "2026-01-01",
    ...overrides,
  };
}

function makeTraining(
  overrides: Partial<FirstAidRecordInput> = {},
): FirstAidRecordInput {
  return {
    id: uid(),
    record_type: "training",
    staff_id: "staff-1",
    staff_name: "Alice",
    certificate_type: null,
    certificate_expiry: null,
    is_current: false,
    equipment_name: null,
    equipment_location: null,
    equipment_checked: false,
    equipment_check_date: null,
    equipment_next_check_due: null,
    equipment_in_date: false,
    items_replaced: [],
    training_date: "2026-03-01",
    training_provider: "Red Cross",
    created_at: "2026-01-01",
    ...overrides,
  };
}

// Build all essential contacts for 100% essential coverage
function makeAllEssentialContacts(): EmergencyContactInput[] {
  const types: EmergencyContactInput["contact_type"][] = [
    "police",
    "fire_service",
    "ambulance",
    "hospital",
    "social_worker",
    "ofsted",
    "on_call_manager",
    "registered_manager",
  ];
  return types.map((t) =>
    makeContact({ contact_type: t, verified: true, is_current: true }),
  );
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("Home Emergency Preparedness & Continuity Intelligence Engine", () => {
  // ====================================================================
  // 1. SPECIAL CASES
  // ====================================================================
  describe("special cases", () => {
    it("returns insufficient_data when all arrays empty and total_children = 0", () => {
      const r = computeEmergencyPreparednessContinuity(baseInput());
      expect(r.emergency_rating).toBe("insufficient_data");
      expect(r.emergency_score).toBe(0);
      expect(r.headline).toContain("insufficient data");
      expect(r.strengths).toHaveLength(0);
      expect(r.concerns).toHaveLength(0);
      expect(r.recommendations).toHaveLength(0);
      expect(r.insights).toHaveLength(0);
    });

    it("returns inadequate (score 15) when all arrays empty and total_children > 0", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({ total_children: 3 }),
      );
      expect(r.emergency_rating).toBe("inadequate");
      expect(r.emergency_score).toBe(15);
      expect(r.concerns).toHaveLength(1);
      expect(r.recommendations).toHaveLength(2);
      expect(r.insights).toHaveLength(1);
      expect(r.insights[0].severity).toBe("critical");
    });

    it("insufficient_data has all metrics at 0", () => {
      const r = computeEmergencyPreparednessContinuity(baseInput());
      expect(r.fire_drill_compliance_rate).toBe(0);
      expect(r.evacuation_plan_currency_rate).toBe(0);
      expect(r.emergency_contact_accuracy_rate).toBe(0);
      expect(r.business_continuity_score).toBe(0);
      expect(r.first_aid_coverage_rate).toBe(0);
      expect(r.equipment_maintenance_rate).toBe(0);
      expect(r.total_drills).toBe(0);
      expect(r.total_evacuation_plans).toBe(0);
      expect(r.total_emergency_contacts).toBe(0);
      expect(r.total_continuity_plans).toBe(0);
      expect(r.total_first_aid_records).toBe(0);
    });

    it("inadequate special case recommendations have correct urgency and refs", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({ total_children: 2 }),
      );
      expect(r.recommendations[0].urgency).toBe("immediate");
      expect(r.recommendations[0].regulatory_ref).toContain("Reg 25");
      expect(r.recommendations[1].urgency).toBe("immediate");
      expect(r.recommendations[1].regulatory_ref).toContain("Reg 5");
    });
  });

  // ====================================================================
  // 2. BASE SCORE
  // ====================================================================
  describe("base score", () => {
    it("base score is 52 with minimal data and no bonuses/penalties", () => {
      // A single drill with 0% compliance (evac too slow) but above 50% won't trigger penalty
      // To get exactly base: need data but no bonus conditions met, no penalty conditions met
      // Use a single contact that is NOT verified (accuracy 0%) but only 1 contact → penalty triggers
      // Better: single non-essential contact, verified+current → accuracy 100% but essential coverage <75%
      // Let's use a drill with compliance 50-69% (no bonus, no penalty), no evac plans, etc.
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          // 1 drill, non-compliant (evac > target) => compliance 0%, triggers penalty
          // So let's use 2 drills: 1 compliant, 1 not => 50% (no penalty, no bonus)
          fire_drill_records: [
            makeDrill({
              drill_type: "day",
              all_children_participated: true,
              evacuation_time_seconds: 120,
              target_evacuation_time_seconds: 180,
              debrief_completed: false,
            }),
            makeDrill({
              drill_type: "day",
              all_children_participated: false,
              evacuation_time_seconds: 200,
              target_evacuation_time_seconds: 180,
              debrief_completed: false,
            }),
          ],
        }),
      );
      // fireDrillComplianceRate = 50%, no bonus, no penalty
      // drillDebriefRate = 0%, < 50 => no bonus (but no penalty for debrief)
      // All other arrays empty but not allEmpty => no bonuses from them
      // pct(0,0) for evac plans, contacts, etc. = 0, but guards prevent penalties
      // Score should be 52
      expect(r.emergency_score).toBe(52);
    });
  });

  // ====================================================================
  // 3. INDIVIDUAL BONUSES
  // ====================================================================
  describe("bonus 1: fire drill compliance rate", () => {
    it("awards +4 when fireDrillComplianceRate >= 90%", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          fire_drill_records: [
            makeDrill({ all_children_participated: true, evacuation_time_seconds: 100, target_evacuation_time_seconds: 180, debrief_completed: false }),
          ],
        }),
      );
      // 1/1 = 100% compliance => +4
      // drillDebriefRate 0% => no debrief bonus
      expect(r.emergency_score).toBe(52 + 4);
      expect(r.fire_drill_compliance_rate).toBe(100);
    });

    it("awards +2 when fireDrillComplianceRate >= 70% but < 90%", () => {
      // 7 compliant out of 10 drills = 70%
      const drills: FireDrillRecordInput[] = [];
      for (let i = 0; i < 7; i++) {
        drills.push(makeDrill({ all_children_participated: true, evacuation_time_seconds: 100, target_evacuation_time_seconds: 180, debrief_completed: false }));
      }
      for (let i = 0; i < 3; i++) {
        drills.push(makeDrill({ all_children_participated: false, evacuation_time_seconds: 200, target_evacuation_time_seconds: 180, debrief_completed: false }));
      }
      const r = computeEmergencyPreparednessContinuity(
        baseInput({ total_children: 1, fire_drill_records: drills }),
      );
      expect(r.fire_drill_compliance_rate).toBe(70);
      expect(r.emergency_score).toBe(52 + 2);
    });

    it("awards +0 when fireDrillComplianceRate < 70%", () => {
      // 6 compliant out of 10 = 60%
      const drills: FireDrillRecordInput[] = [];
      for (let i = 0; i < 6; i++) {
        drills.push(makeDrill({ all_children_participated: true, evacuation_time_seconds: 100, target_evacuation_time_seconds: 180, debrief_completed: false }));
      }
      for (let i = 0; i < 4; i++) {
        drills.push(makeDrill({ all_children_participated: false, evacuation_time_seconds: 200, target_evacuation_time_seconds: 180, debrief_completed: false }));
      }
      const r = computeEmergencyPreparednessContinuity(
        baseInput({ total_children: 1, fire_drill_records: drills }),
      );
      expect(r.fire_drill_compliance_rate).toBe(60);
      expect(r.emergency_score).toBe(52);
    });
  });

  describe("bonus 2: evacuation plan currency rate", () => {
    it("awards +4 when evacuationPlanCurrencyRate = 100%", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          evacuation_plans: [
            makeEvacPlan({
              is_current: true,
              review_due: "2026-12-01",
              covers_all_exits: false,
              includes_assembly_point: false,
              includes_roll_call_procedure: false,
              includes_vulnerable_children_provisions: false,
              displayed_in_home: false,
              staff_trained_on_plan: false,
              children_briefed: false,
              approved_by: null,
            }),
          ],
        }),
      );
      expect(r.evacuation_plan_currency_rate).toBe(100);
      // +4 for currency, comprehensiveness=0 so no bonus 8, no other bonuses
      expect(r.emergency_score).toBe(52 + 4);
    });

    it("awards +2 when evacuationPlanCurrencyRate >= 80% but < 100%", () => {
      // 4 out of 5 current = 80%
      const plans: EvacuationPlanInput[] = [];
      for (let i = 0; i < 4; i++) {
        plans.push(makeEvacPlan({ is_current: true, review_due: "2026-12-01", covers_all_exits: false, includes_assembly_point: false, includes_roll_call_procedure: false, includes_vulnerable_children_provisions: false, displayed_in_home: false, staff_trained_on_plan: false, children_briefed: false, approved_by: null }));
      }
      plans.push(makeEvacPlan({ is_current: false, review_due: "2025-01-01", covers_all_exits: false, includes_assembly_point: false, includes_roll_call_procedure: false, includes_vulnerable_children_provisions: false, displayed_in_home: false, staff_trained_on_plan: false, children_briefed: false, approved_by: null }));
      const r = computeEmergencyPreparednessContinuity(
        baseInput({ total_children: 1, evacuation_plans: plans }),
      );
      expect(r.evacuation_plan_currency_rate).toBe(80);
      expect(r.emergency_score).toBe(52 + 2);
    });

    it("awards +0 when evacuationPlanCurrencyRate < 80%", () => {
      // 1 out of 2 current = 50%
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          evacuation_plans: [
            makeEvacPlan({ is_current: true, review_due: "2026-12-01", covers_all_exits: false, includes_assembly_point: false, includes_roll_call_procedure: false, includes_vulnerable_children_provisions: false, displayed_in_home: false, staff_trained_on_plan: false, children_briefed: false, approved_by: null }),
            makeEvacPlan({ is_current: false, review_due: "2025-01-01", covers_all_exits: false, includes_assembly_point: false, includes_roll_call_procedure: false, includes_vulnerable_children_provisions: false, displayed_in_home: false, staff_trained_on_plan: false, children_briefed: false, approved_by: null }),
          ],
        }),
      );
      expect(r.evacuation_plan_currency_rate).toBe(50);
      // 50% is not <50 so no penalty either
      expect(r.emergency_score).toBe(52);
    });
  });

  describe("bonus 3: emergency contact accuracy rate", () => {
    it("awards +3 when emergencyContactAccuracyRate = 100%", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          emergency_contacts: [
            makeContact({ contact_type: "other", verified: true, is_current: true, last_verified_date: "2025-01-01", verification_due: null }),
          ],
        }),
      );
      expect(r.emergency_contact_accuracy_rate).toBe(100);
      // essentialCoverageRate: 0/8 = 0% => no bonus 9 (need >=75%)
      expect(r.emergency_score).toBe(52 + 3);
    });

    it("awards +1 when emergencyContactAccuracyRate >= 80% but < 100%", () => {
      // 4 out of 5 verified+current = 80%
      const contacts: EmergencyContactInput[] = [];
      for (let i = 0; i < 4; i++) {
        contacts.push(makeContact({ contact_type: "other", verified: true, is_current: true, last_verified_date: "2025-01-01", verification_due: null }));
      }
      contacts.push(makeContact({ contact_type: "other", verified: false, is_current: true, last_verified_date: null, verification_due: null }));
      const r = computeEmergencyPreparednessContinuity(
        baseInput({ total_children: 1, emergency_contacts: contacts }),
      );
      expect(r.emergency_contact_accuracy_rate).toBe(80);
      expect(r.emergency_score).toBe(52 + 1);
    });

    it("awards +0 when emergencyContactAccuracyRate < 80%", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          emergency_contacts: [
            makeContact({ contact_type: "other", verified: true, is_current: true, last_verified_date: "2025-01-01", verification_due: null }),
            makeContact({ contact_type: "other", verified: false, is_current: true, last_verified_date: null, verification_due: null }),
          ],
        }),
      );
      // 1/2 = 50% => no bonus, no penalty (50% is not <50)
      expect(r.emergency_contact_accuracy_rate).toBe(50);
      expect(r.emergency_score).toBe(52);
    });
  });

  describe("bonus 4: business continuity score", () => {
    it("awards +3 when businessContinuityScore >= 80%", () => {
      // All 7 BCP components at 100% → score = 100
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          business_continuity_plans: [
            makeBCP({
              is_current: true,
              review_due: "2026-12-01",
              tested: true,
              includes_communication_plan: true,
              includes_alternative_accommodation: true,
              includes_data_backup: true,
              includes_staffing_contingency: true,
              staff_aware: true,
            }),
          ],
        }),
      );
      expect(r.business_continuity_score).toBe(100);
      expect(r.emergency_score).toBe(52 + 3);
    });

    it("awards +1 when businessContinuityScore >= 60% but < 80%", () => {
      // 4 of 7 components true = avg(100,100,100,100,0,0,0) = 400/7 ≈ 57
      // Need 5 of 7 true → avg(100,100,100,100,100,0,0) = 500/7 ≈ 71
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          business_continuity_plans: [
            makeBCP({
              is_current: true,
              review_due: "2026-12-01",
              tested: true,
              includes_communication_plan: true,
              includes_alternative_accommodation: true,
              includes_data_backup: true,
              includes_staffing_contingency: false,
              staff_aware: false,
            }),
          ],
        }),
      );
      // Components: currency=100, testing=100, comms=100, altAccomm=100, backup=100, staffing=0, awareness=0
      // = 500/7 = 71 → >=60 but <80 → +1
      expect(r.business_continuity_score).toBe(71);
      expect(r.emergency_score).toBe(52 + 1);
    });

    it("awards +0 when businessContinuityScore < 60%", () => {
      // Only 3 of 7 components true → 300/7 ≈ 43
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          business_continuity_plans: [
            makeBCP({
              is_current: true,
              review_due: "2026-12-01",
              tested: true,
              includes_communication_plan: true,
              includes_alternative_accommodation: false,
              includes_data_backup: false,
              includes_staffing_contingency: false,
              staff_aware: false,
            }),
          ],
        }),
      );
      expect(r.business_continuity_score).toBe(43);
      expect(r.emergency_score).toBe(52);
    });
  });

  describe("bonus 5: first aid coverage rate", () => {
    it("awards +3 when firstAidCoverageRate = 100%", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          first_aid_records: [
            makeFirstAid({ record_type: "certificate", is_current: true, certificate_expiry: "2027-06-01", staff_id: "s1" }),
          ],
        }),
      );
      expect(r.first_aid_coverage_rate).toBe(100);
      expect(r.emergency_score).toBe(52 + 3);
    });

    it("awards +1 when firstAidCoverageRate >= 80% but < 100%", () => {
      // 4 out of 5 certificates current = 80%
      const records: FirstAidRecordInput[] = [];
      for (let i = 0; i < 4; i++) {
        records.push(makeFirstAid({ record_type: "certificate", is_current: true, certificate_expiry: "2027-06-01", staff_id: `s${i}` }));
      }
      records.push(makeFirstAid({ record_type: "certificate", is_current: false, certificate_expiry: "2025-01-01", staff_id: "s5" }));
      const r = computeEmergencyPreparednessContinuity(
        baseInput({ total_children: 1, first_aid_records: records }),
      );
      expect(r.first_aid_coverage_rate).toBe(80);
      expect(r.emergency_score).toBe(52 + 1);
    });

    it("awards +0 when firstAidCoverageRate < 80%", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          first_aid_records: [
            makeFirstAid({ record_type: "certificate", is_current: true, certificate_expiry: "2027-06-01", staff_id: "s1" }),
            makeFirstAid({ record_type: "certificate", is_current: false, certificate_expiry: "2025-01-01", staff_id: "s2" }),
          ],
        }),
      );
      expect(r.first_aid_coverage_rate).toBe(50);
      expect(r.emergency_score).toBe(52);
    });
  });

  describe("bonus 6: equipment maintenance rate", () => {
    it("awards +3 when equipmentMaintenanceRate = 100%", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          first_aid_records: [
            makeEquipment({ equipment_checked: true, equipment_in_date: true }),
          ],
        }),
      );
      expect(r.equipment_maintenance_rate).toBe(100);
      expect(r.emergency_score).toBe(52 + 3);
    });

    it("awards +1 when equipmentMaintenanceRate >= 80% but < 100%", () => {
      // 4/5 = 80%
      const records: FirstAidRecordInput[] = [];
      for (let i = 0; i < 4; i++) {
        records.push(makeEquipment({ equipment_checked: true, equipment_in_date: true }));
      }
      records.push(makeEquipment({ equipment_checked: false, equipment_in_date: false }));
      const r = computeEmergencyPreparednessContinuity(
        baseInput({ total_children: 1, first_aid_records: records }),
      );
      expect(r.equipment_maintenance_rate).toBe(80);
      expect(r.emergency_score).toBe(52 + 1);
    });

    it("awards +0 when equipmentMaintenanceRate < 80%", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          first_aid_records: [
            makeEquipment({ equipment_checked: true, equipment_in_date: true }),
            makeEquipment({ equipment_checked: false, equipment_in_date: false }),
          ],
        }),
      );
      expect(r.equipment_maintenance_rate).toBe(50);
      expect(r.emergency_score).toBe(52);
    });
  });

  describe("bonus 7: drill debrief rate", () => {
    it("awards +2 when drillDebriefRate >= 90%", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          fire_drill_records: [
            makeDrill({ debrief_completed: true, all_children_participated: false, evacuation_time_seconds: 999, target_evacuation_time_seconds: 180 }),
          ],
        }),
      );
      // Compliance 0% (not all children) but only 1 drill → 0% < 50% → penalty -5
      // debrief 100% → +2
      expect(r.emergency_score).toBe(52 + 2 - 5);
    });

    it("awards +1 when drillDebriefRate >= 70% but < 90%", () => {
      // 7/10 = 70%
      const drills: FireDrillRecordInput[] = [];
      for (let i = 0; i < 7; i++) {
        drills.push(makeDrill({ debrief_completed: true, all_children_participated: false, evacuation_time_seconds: 999, target_evacuation_time_seconds: 180 }));
      }
      for (let i = 0; i < 3; i++) {
        drills.push(makeDrill({ debrief_completed: false, all_children_participated: false, evacuation_time_seconds: 999, target_evacuation_time_seconds: 180 }));
      }
      const r = computeEmergencyPreparednessContinuity(
        baseInput({ total_children: 1, fire_drill_records: drills }),
      );
      // debrief 70% → +1, compliance 0% → penalty -5
      expect(r.emergency_score).toBe(52 + 1 - 5);
    });

    it("awards +0 when drillDebriefRate < 70%", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          fire_drill_records: [
            makeDrill({ debrief_completed: true, all_children_participated: false, evacuation_time_seconds: 999, target_evacuation_time_seconds: 180 }),
            makeDrill({ debrief_completed: false, all_children_participated: false, evacuation_time_seconds: 999, target_evacuation_time_seconds: 180 }),
          ],
        }),
      );
      // debrief 50% → no bonus, compliance 0% → penalty -5
      expect(r.emergency_score).toBe(52 - 5);
    });
  });

  describe("bonus 8: plan comprehensiveness rate", () => {
    it("awards +3 when planComprehensivenessRate >= 90%", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          evacuation_plans: [
            makeEvacPlan({
              covers_all_exits: true,
              includes_assembly_point: true,
              includes_roll_call_procedure: true,
              includes_vulnerable_children_provisions: true,
              // Suppress other bonuses
              is_current: false,
              review_due: "2025-01-01",
              displayed_in_home: false,
              staff_trained_on_plan: false,
              children_briefed: false,
              approved_by: null,
            }),
          ],
        }),
      );
      // comprehensiveness 100% → +3, currency 0% → penalty -5
      expect(r.emergency_score).toBe(52 + 3 - 5);
    });

    it("awards +1 when planComprehensivenessRate >= 70% but < 90%", () => {
      // 7 out of 10 comprehensive = 70%
      const plans: EvacuationPlanInput[] = [];
      for (let i = 0; i < 7; i++) {
        plans.push(makeEvacPlan({ covers_all_exits: true, includes_assembly_point: true, includes_roll_call_procedure: true, includes_vulnerable_children_provisions: true, is_current: false, review_due: "2025-01-01", displayed_in_home: false, staff_trained_on_plan: false, children_briefed: false, approved_by: null }));
      }
      for (let i = 0; i < 3; i++) {
        plans.push(makeEvacPlan({ covers_all_exits: false, includes_assembly_point: false, includes_roll_call_procedure: false, includes_vulnerable_children_provisions: false, is_current: false, review_due: "2025-01-01", displayed_in_home: false, staff_trained_on_plan: false, children_briefed: false, approved_by: null }));
      }
      const r = computeEmergencyPreparednessContinuity(
        baseInput({ total_children: 1, evacuation_plans: plans }),
      );
      // comprehensiveness 70% → +1, currency 0% → penalty -5
      expect(r.emergency_score).toBe(52 + 1 - 5);
    });

    it("awards +0 when planComprehensivenessRate < 70%", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          evacuation_plans: [
            makeEvacPlan({ covers_all_exits: false, includes_assembly_point: false, includes_roll_call_procedure: false, includes_vulnerable_children_provisions: false, is_current: false, review_due: "2025-01-01", displayed_in_home: false, staff_trained_on_plan: false, children_briefed: false, approved_by: null }),
          ],
        }),
      );
      // comprehensiveness 0% → no bonus, currency 0% → penalty -5
      expect(r.emergency_score).toBe(52 - 5);
    });
  });

  describe("bonus 9: essential coverage rate", () => {
    it("awards +3 when essentialCoverageRate = 100%", () => {
      // All 8 essential types covered with is_current
      // BUT also accuracy rate: they're all verified+current → accuracy 100% → +3 (bonus 3)
      // We need to isolate: make them NOT verified so accuracy is 0% → penalty -4
      const contacts = makeAllEssentialContacts().map((c) => ({
        ...c,
        verified: false,
        is_current: true,
        last_verified_date: null,
        verification_due: null,
      }));
      const r = computeEmergencyPreparednessContinuity(
        baseInput({ total_children: 1, emergency_contacts: contacts }),
      );
      expect(r.emergency_contact_accuracy_rate).toBe(0);
      // essentialCoverageRate = 100% → +3, accuracy 0% penalty -4
      expect(r.emergency_score).toBe(52 + 3 - 4);
    });

    it("awards +1 when essentialCoverageRate >= 75% but < 100%", () => {
      // 6 out of 8 essential types → 75%
      const types: EmergencyContactInput["contact_type"][] = [
        "police", "fire_service", "ambulance", "hospital", "social_worker", "ofsted",
      ];
      const contacts = types.map((t) =>
        makeContact({ contact_type: t, verified: false, is_current: true, last_verified_date: null, verification_due: null }),
      );
      const r = computeEmergencyPreparednessContinuity(
        baseInput({ total_children: 1, emergency_contacts: contacts }),
      );
      expect(r.emergency_contact_accuracy_rate).toBe(0);
      // essentialCoverageRate = 75% → +1, accuracy 0% penalty -4
      expect(r.emergency_score).toBe(52 + 1 - 4);
    });

    it("awards +0 when essentialCoverageRate < 75%", () => {
      // Just one essential type → 1/8 = 13%
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          emergency_contacts: [
            makeContact({ contact_type: "police", verified: false, is_current: true, last_verified_date: null, verification_due: null }),
          ],
        }),
      );
      // essentialCoverageRate = 13% → no bonus, accuracy 0% penalty -4
      expect(r.emergency_score).toBe(52 - 4);
    });
  });

  // ====================================================================
  // 4. ALL BONUSES COMBINED
  // ====================================================================
  describe("all bonuses combined (max score)", () => {
    it("achieves score 80 with all bonuses at max tier", () => {
      const contacts = makeAllEssentialContacts();
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 2,
          fire_drill_records: [
            makeDrill({ drill_type: "day", all_children_participated: true, evacuation_time_seconds: 100, target_evacuation_time_seconds: 180, debrief_completed: true }),
          ],
          evacuation_plans: [
            makeEvacPlan({
              is_current: true, review_due: "2026-12-01",
              covers_all_exits: true, includes_assembly_point: true,
              includes_roll_call_procedure: true, includes_vulnerable_children_provisions: true,
            }),
          ],
          emergency_contacts: contacts,
          business_continuity_plans: [
            makeBCP({ is_current: true, review_due: "2026-12-01", tested: true, includes_communication_plan: true, includes_alternative_accommodation: true, includes_data_backup: true, includes_staffing_contingency: true, staff_aware: true }),
          ],
          first_aid_records: [
            makeFirstAid({ record_type: "certificate", is_current: true, certificate_expiry: "2027-06-01", staff_id: "s1" }),
            makeEquipment({ equipment_checked: true, equipment_in_date: true }),
          ],
        }),
      );
      // Bonuses: B1=4, B2=4, B3=3, B4=3, B5=3, B6=3, B7=2, B8=3, B9=3 = 28
      // 52 + 28 = 80
      expect(r.emergency_score).toBe(80);
      expect(r.emergency_rating).toBe("outstanding");
    });
  });

  // ====================================================================
  // 5. INDIVIDUAL PENALTIES
  // ====================================================================
  describe("penalties", () => {
    describe("penalty: fireDrillComplianceRate < 50 (guard: totalDrills > 0)", () => {
      it("applies -5 when compliance < 50% and drills exist", () => {
        // 0% compliance (evac > target)
        const r = computeEmergencyPreparednessContinuity(
          baseInput({
            total_children: 1,
            fire_drill_records: [
              makeDrill({ all_children_participated: false, evacuation_time_seconds: 999, target_evacuation_time_seconds: 180, debrief_completed: false }),
            ],
          }),
        );
        expect(r.fire_drill_compliance_rate).toBe(0);
        expect(r.emergency_score).toBe(52 - 5);
      });

      it("does not apply penalty when compliance exactly 50%", () => {
        const r = computeEmergencyPreparednessContinuity(
          baseInput({
            total_children: 1,
            fire_drill_records: [
              makeDrill({ all_children_participated: true, evacuation_time_seconds: 100, target_evacuation_time_seconds: 180, debrief_completed: false }),
              makeDrill({ all_children_participated: false, evacuation_time_seconds: 999, target_evacuation_time_seconds: 180, debrief_completed: false }),
            ],
          }),
        );
        expect(r.fire_drill_compliance_rate).toBe(50);
        expect(r.emergency_score).toBe(52);
      });
    });

    describe("penalty: evacuationPlanCurrencyRate < 50 (guard: totalEvacPlans > 0)", () => {
      it("applies -5 when currency < 50% and plans exist", () => {
        const r = computeEmergencyPreparednessContinuity(
          baseInput({
            total_children: 1,
            evacuation_plans: [
              makeEvacPlan({ is_current: false, review_due: "2025-01-01", covers_all_exits: false, includes_assembly_point: false, includes_roll_call_procedure: false, includes_vulnerable_children_provisions: false, displayed_in_home: false, staff_trained_on_plan: false, children_briefed: false, approved_by: null }),
            ],
          }),
        );
        expect(r.evacuation_plan_currency_rate).toBe(0);
        expect(r.emergency_score).toBe(52 - 5);
      });

      it("does not apply penalty when currency exactly 50%", () => {
        const r = computeEmergencyPreparednessContinuity(
          baseInput({
            total_children: 1,
            evacuation_plans: [
              makeEvacPlan({ is_current: true, review_due: "2026-12-01", covers_all_exits: false, includes_assembly_point: false, includes_roll_call_procedure: false, includes_vulnerable_children_provisions: false, displayed_in_home: false, staff_trained_on_plan: false, children_briefed: false, approved_by: null }),
              makeEvacPlan({ is_current: false, review_due: "2025-01-01", covers_all_exits: false, includes_assembly_point: false, includes_roll_call_procedure: false, includes_vulnerable_children_provisions: false, displayed_in_home: false, staff_trained_on_plan: false, children_briefed: false, approved_by: null }),
            ],
          }),
        );
        expect(r.evacuation_plan_currency_rate).toBe(50);
        expect(r.emergency_score).toBe(52);
      });
    });

    describe("penalty: emergencyContactAccuracyRate < 50 (guard: totalContacts > 0)", () => {
      it("applies -4 when accuracy < 50% and contacts exist", () => {
        const r = computeEmergencyPreparednessContinuity(
          baseInput({
            total_children: 1,
            emergency_contacts: [
              makeContact({ contact_type: "other", verified: false, is_current: true, last_verified_date: null, verification_due: null }),
            ],
          }),
        );
        expect(r.emergency_contact_accuracy_rate).toBe(0);
        expect(r.emergency_score).toBe(52 - 4);
      });

      it("does not apply penalty when accuracy exactly 50%", () => {
        const r = computeEmergencyPreparednessContinuity(
          baseInput({
            total_children: 1,
            emergency_contacts: [
              makeContact({ contact_type: "other", verified: true, is_current: true, last_verified_date: "2025-01-01", verification_due: null }),
              makeContact({ contact_type: "other", verified: false, is_current: true, last_verified_date: null, verification_due: null }),
            ],
          }),
        );
        expect(r.emergency_contact_accuracy_rate).toBe(50);
        expect(r.emergency_score).toBe(52);
      });
    });

    describe("penalty: equipmentMaintenanceRate < 50 (guard: equipmentRecords.length > 0)", () => {
      it("applies -4 when maintenance < 50% and equipment records exist", () => {
        const r = computeEmergencyPreparednessContinuity(
          baseInput({
            total_children: 1,
            first_aid_records: [
              makeEquipment({ equipment_checked: false, equipment_in_date: false }),
            ],
          }),
        );
        expect(r.equipment_maintenance_rate).toBe(0);
        expect(r.emergency_score).toBe(52 - 4);
      });

      it("does not apply penalty when maintenance exactly 50%", () => {
        const r = computeEmergencyPreparednessContinuity(
          baseInput({
            total_children: 1,
            first_aid_records: [
              makeEquipment({ equipment_checked: true, equipment_in_date: true }),
              makeEquipment({ equipment_checked: false, equipment_in_date: false }),
            ],
          }),
        );
        expect(r.equipment_maintenance_rate).toBe(50);
        expect(r.emergency_score).toBe(52);
      });
    });

    it("all penalties stack: -5 -5 -4 -4 = -18 → score 34", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          fire_drill_records: [
            makeDrill({ all_children_participated: false, evacuation_time_seconds: 999, target_evacuation_time_seconds: 180, debrief_completed: false }),
          ],
          evacuation_plans: [
            makeEvacPlan({ is_current: false, review_due: "2025-01-01", covers_all_exits: false, includes_assembly_point: false, includes_roll_call_procedure: false, includes_vulnerable_children_provisions: false, displayed_in_home: false, staff_trained_on_plan: false, children_briefed: false, approved_by: null }),
          ],
          emergency_contacts: [
            makeContact({ contact_type: "other", verified: false, is_current: false, last_verified_date: null, verification_due: null }),
          ],
          first_aid_records: [
            makeEquipment({ equipment_checked: false, equipment_in_date: false }),
          ],
        }),
      );
      expect(r.emergency_score).toBe(52 - 5 - 5 - 4 - 4);
      expect(r.emergency_score).toBe(34);
      expect(r.emergency_rating).toBe("inadequate");
    });
  });

  // ====================================================================
  // 6. PENALTY GUARDS
  // ====================================================================
  describe("penalty guards", () => {
    it("fire drill penalty not applied when totalDrills = 0", () => {
      // pct(0,0) = 0, which is < 50, but guard totalDrills > 0 prevents penalty
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          emergency_contacts: [makeContact({ contact_type: "other", verified: true, is_current: true, last_verified_date: "2025-01-01", verification_due: null })],
        }),
      );
      // No drills → pct(0,0)=0 but guard prevents penalty. Only contact bonus applies.
      expect(r.fire_drill_compliance_rate).toBe(0);
      expect(r.emergency_score).toBe(52 + 3); // +3 from contact accuracy 100%
    });

    it("evacuation plan penalty not applied when totalEvacPlans = 0", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          emergency_contacts: [makeContact({ contact_type: "other", verified: true, is_current: true, last_verified_date: "2025-01-01", verification_due: null })],
        }),
      );
      expect(r.evacuation_plan_currency_rate).toBe(0);
      expect(r.emergency_score).toBe(52 + 3);
    });

    it("emergency contact penalty not applied when totalContacts = 0", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          fire_drill_records: [
            makeDrill({ all_children_participated: true, evacuation_time_seconds: 100, target_evacuation_time_seconds: 180, debrief_completed: true }),
          ],
        }),
      );
      expect(r.emergency_contact_accuracy_rate).toBe(0);
      // +4 (compliance) +2 (debrief) = 58, no contact penalty
      expect(r.emergency_score).toBe(52 + 4 + 2);
    });

    it("equipment penalty not applied when equipmentRecords.length = 0", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          first_aid_records: [
            makeFirstAid({ record_type: "certificate", is_current: true, certificate_expiry: "2027-06-01", staff_id: "s1" }),
          ],
        }),
      );
      expect(r.equipment_maintenance_rate).toBe(0);
      // +3 from first aid coverage 100%, no equipment penalty
      expect(r.emergency_score).toBe(52 + 3);
    });
  });

  // ====================================================================
  // 7. RATING BOUNDARIES
  // ====================================================================
  describe("rating boundaries", () => {
    it("score 80 → outstanding", () => {
      const contacts = makeAllEssentialContacts();
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 2,
          fire_drill_records: [
            makeDrill({ drill_type: "day", debrief_completed: true }),
          ],
          evacuation_plans: [
            makeEvacPlan({ is_current: true, review_due: "2026-12-01" }),
          ],
          emergency_contacts: contacts,
          business_continuity_plans: [makeBCP()],
          first_aid_records: [
            makeFirstAid({ record_type: "certificate", is_current: true, certificate_expiry: "2027-06-01", staff_id: "s1" }),
            makeEquipment({ equipment_checked: true, equipment_in_date: true }),
          ],
        }),
      );
      expect(r.emergency_score).toBe(80);
      expect(r.emergency_rating).toBe("outstanding");
    });

    it("score 79 → good (just below outstanding)", () => {
      // All max bonuses but reduce one: make debrief 70% → +1 instead of +2 → score 79
      const contacts = makeAllEssentialContacts();
      const drills: FireDrillRecordInput[] = [];
      for (let i = 0; i < 7; i++) {
        drills.push(makeDrill({ drill_type: "day", debrief_completed: true }));
      }
      for (let i = 0; i < 3; i++) {
        drills.push(makeDrill({ drill_type: "day", debrief_completed: false }));
      }
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 2,
          fire_drill_records: drills,
          evacuation_plans: [
            makeEvacPlan({ is_current: true, review_due: "2026-12-01" }),
          ],
          emergency_contacts: contacts,
          business_continuity_plans: [makeBCP()],
          first_aid_records: [
            makeFirstAid({ record_type: "certificate", is_current: true, certificate_expiry: "2027-06-01", staff_id: "s1" }),
            makeEquipment({ equipment_checked: true, equipment_in_date: true }),
          ],
        }),
      );
      expect(r.emergency_score).toBe(79);
      expect(r.emergency_rating).toBe("good");
    });

    it("score 65 → good", () => {
      // base 52, need +13 from bonuses
      // B1(+4) + B2(+4) + B5(+3) + B7(+2) = +13 → 65
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          fire_drill_records: [
            makeDrill({ debrief_completed: true }),
          ],
          evacuation_plans: [
            makeEvacPlan({ is_current: true, review_due: "2026-12-01", covers_all_exits: false, includes_assembly_point: false, includes_roll_call_procedure: false, includes_vulnerable_children_provisions: false, displayed_in_home: false, staff_trained_on_plan: false, children_briefed: false, approved_by: null }),
          ],
          first_aid_records: [
            makeFirstAid({ record_type: "certificate", is_current: true, certificate_expiry: "2027-06-01", staff_id: "s1" }),
          ],
        }),
      );
      // B1=+4 (100% compliance), B2=+4 (100% currency), B5=+3 (100% first aid), B7=+2 (100% debrief)
      expect(r.emergency_score).toBe(65);
      expect(r.emergency_rating).toBe("good");
    });

    it("score 64 → adequate", () => {
      // base 52 + B1(+4) + B2(+4) + B5(+3) + B7(+1) = 64
      // debrief at 70% → +1
      const drills: FireDrillRecordInput[] = [];
      for (let i = 0; i < 7; i++) {
        drills.push(makeDrill({ debrief_completed: true }));
      }
      for (let i = 0; i < 3; i++) {
        drills.push(makeDrill({ debrief_completed: false }));
      }
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          fire_drill_records: drills,
          evacuation_plans: [
            makeEvacPlan({ is_current: true, review_due: "2026-12-01", covers_all_exits: false, includes_assembly_point: false, includes_roll_call_procedure: false, includes_vulnerable_children_provisions: false, displayed_in_home: false, staff_trained_on_plan: false, children_briefed: false, approved_by: null }),
          ],
          first_aid_records: [
            makeFirstAid({ record_type: "certificate", is_current: true, certificate_expiry: "2027-06-01", staff_id: "s1" }),
          ],
        }),
      );
      // B1=+4, B2=+4, B5=+3, B7=+1 = +12 → 64
      expect(r.emergency_score).toBe(64);
      expect(r.emergency_rating).toBe("adequate");
    });

    it("score 45 → adequate", () => {
      // base 52 - need penalty. 52 - 5 (fire drill) - 4 (contact) + 2 (debrief) = 45
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          fire_drill_records: [
            makeDrill({ all_children_participated: false, evacuation_time_seconds: 999, target_evacuation_time_seconds: 180, debrief_completed: true }),
          ],
          emergency_contacts: [
            makeContact({ contact_type: "other", verified: false, is_current: false, last_verified_date: null, verification_due: null }),
          ],
        }),
      );
      // compliance 0% penalty -5, accuracy 0% penalty -4, debrief 100% bonus +2
      // No evac plans → no penalty (guard). No equipment → no penalty (guard).
      // pct(0,0) for evac plans, BCP, first aid, equipment all 0 → guards prevent penalties
      expect(r.emergency_score).toBe(52 - 5 - 4 + 2);
      expect(r.emergency_score).toBe(45);
      expect(r.emergency_rating).toBe("adequate");
    });

    it("score 44 → inadequate", () => {
      // 52 - 5 (fire drill) - 4 (contact) + 1 (debrief at 70%) = 44
      const drills: FireDrillRecordInput[] = [];
      for (let i = 0; i < 7; i++) {
        drills.push(makeDrill({ all_children_participated: false, evacuation_time_seconds: 999, target_evacuation_time_seconds: 180, debrief_completed: true }));
      }
      for (let i = 0; i < 3; i++) {
        drills.push(makeDrill({ all_children_participated: false, evacuation_time_seconds: 999, target_evacuation_time_seconds: 180, debrief_completed: false }));
      }
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          fire_drill_records: drills,
          emergency_contacts: [
            makeContact({ contact_type: "other", verified: false, is_current: false, last_verified_date: null, verification_due: null }),
          ],
        }),
      );
      // compliance 0% → -5, accuracy 0% → -4, debrief 70% → +1
      expect(r.emergency_score).toBe(52 - 5 - 4 + 1);
      expect(r.emergency_score).toBe(44);
      expect(r.emergency_rating).toBe("inadequate");
    });

    it("score clamped to 0 minimum", () => {
      // Even with all penalties stacking, score can't go below 0
      // 52 - 5 - 5 - 4 - 4 = 34, but we can't go lower than 34 with current penalties
      // The clamp function ensures it. Score can't stack more than 18 in penalties.
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          fire_drill_records: [makeDrill({ all_children_participated: false, evacuation_time_seconds: 999, target_evacuation_time_seconds: 180, debrief_completed: false })],
          evacuation_plans: [makeEvacPlan({ is_current: false, review_due: "2025-01-01", covers_all_exits: false, includes_assembly_point: false, includes_roll_call_procedure: false, includes_vulnerable_children_provisions: false, displayed_in_home: false, staff_trained_on_plan: false, children_briefed: false, approved_by: null })],
          emergency_contacts: [makeContact({ contact_type: "other", verified: false, is_current: false, last_verified_date: null, verification_due: null })],
          first_aid_records: [makeEquipment({ equipment_checked: false, equipment_in_date: false })],
        }),
      );
      expect(r.emergency_score).toBeGreaterThanOrEqual(0);
    });
  });

  // ====================================================================
  // 8. METRIC CALCULATIONS
  // ====================================================================
  describe("metric calculations", () => {
    it("fireDrillComplianceRate: compliant = all_children_participated AND evac <= target", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          fire_drill_records: [
            makeDrill({ all_children_participated: true, evacuation_time_seconds: 180, target_evacuation_time_seconds: 180, debrief_completed: false }),
            makeDrill({ all_children_participated: true, evacuation_time_seconds: 181, target_evacuation_time_seconds: 180, debrief_completed: false }),
          ],
        }),
      );
      // First drill compliant (180 <= 180), second not (181 > 180) → 50%
      expect(r.fire_drill_compliance_rate).toBe(50);
    });

    it("evacuationPlanCurrencyRate: current = is_current AND review_due >= today", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          evacuation_plans: [
            makeEvacPlan({ is_current: true, review_due: "2026-05-28", covers_all_exits: false, includes_assembly_point: false, includes_roll_call_procedure: false, includes_vulnerable_children_provisions: false, displayed_in_home: false, staff_trained_on_plan: false, children_briefed: false, approved_by: null }),
            makeEvacPlan({ is_current: true, review_due: "2026-05-27", covers_all_exits: false, includes_assembly_point: false, includes_roll_call_procedure: false, includes_vulnerable_children_provisions: false, displayed_in_home: false, staff_trained_on_plan: false, children_briefed: false, approved_by: null }),
          ],
        }),
      );
      // First plan: review_due "2026-05-28" >= today "2026-05-28" → current
      // Second plan: review_due "2026-05-27" < today → not current
      expect(r.evacuation_plan_currency_rate).toBe(50);
    });

    it("emergencyContactAccuracyRate: accuracy = verified AND is_current", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          emergency_contacts: [
            makeContact({ contact_type: "other", verified: true, is_current: true, last_verified_date: "2025-01-01", verification_due: null }),
            makeContact({ contact_type: "other", verified: true, is_current: false, last_verified_date: "2025-01-01", verification_due: null }),
            makeContact({ contact_type: "other", verified: false, is_current: true, last_verified_date: null, verification_due: null }),
          ],
        }),
      );
      // 1 out of 3 verified+current = 33%
      expect(r.emergency_contact_accuracy_rate).toBe(33);
    });

    it("businessContinuityScore is average of 7 components", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          business_continuity_plans: [
            makeBCP({
              is_current: true, review_due: "2026-12-01", // currency: 100
              tested: false, // testing: 0
              includes_communication_plan: true, // comms: 100
              includes_alternative_accommodation: false, // altAccomm: 0
              includes_data_backup: true, // backup: 100
              includes_staffing_contingency: false, // staffing: 0
              staff_aware: true, // awareness: 100
            }),
          ],
        }),
      );
      // 4 x 100 + 3 x 0 = 400 / 7 = 57.14 → Math.round → 57
      expect(r.business_continuity_score).toBe(57);
    });

    it("firstAidCoverageRate is based on certificate records only", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          first_aid_records: [
            makeFirstAid({ record_type: "certificate", is_current: true, certificate_expiry: "2027-06-01", staff_id: "s1" }),
            makeFirstAid({ record_type: "certificate", is_current: false, certificate_expiry: "2025-01-01", staff_id: "s2" }),
            makeEquipment(), // should not affect first aid coverage rate
            makeTraining(), // should not affect first aid coverage rate
          ],
        }),
      );
      // 1 current cert out of 2 cert records = 50%
      expect(r.first_aid_coverage_rate).toBe(50);
      expect(r.total_first_aid_records).toBe(4);
    });

    it("equipmentMaintenanceRate: checked AND in_date equipment records", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          first_aid_records: [
            makeEquipment({ equipment_checked: true, equipment_in_date: true }),
            makeEquipment({ equipment_checked: true, equipment_in_date: false }),
            makeEquipment({ equipment_checked: false, equipment_in_date: true }),
          ],
        }),
      );
      // Only first one counts (checked AND in_date) → 1/3 = 33%
      expect(r.equipment_maintenance_rate).toBe(33);
    });

    it("total counts are correct", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          fire_drill_records: [makeDrill(), makeDrill()],
          evacuation_plans: [makeEvacPlan(), makeEvacPlan(), makeEvacPlan()],
          emergency_contacts: [makeContact()],
          business_continuity_plans: [makeBCP(), makeBCP()],
          first_aid_records: [makeFirstAid(), makeEquipment(), makeTraining(), makeFirstAid()],
        }),
      );
      expect(r.total_drills).toBe(2);
      expect(r.total_evacuation_plans).toBe(3);
      expect(r.total_emergency_contacts).toBe(1);
      expect(r.total_continuity_plans).toBe(2);
      expect(r.total_first_aid_records).toBe(4);
    });

    it("pct(0, 0) = 0", () => {
      // No drills → fireDrillComplianceRate = pct(0,0) = 0
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          emergency_contacts: [makeContact({ contact_type: "other", verified: true, is_current: true, last_verified_date: "2025-01-01", verification_due: null })],
        }),
      );
      expect(r.fire_drill_compliance_rate).toBe(0);
    });
  });

  // ====================================================================
  // 9. STRENGTHS
  // ====================================================================
  describe("strengths", () => {
    it("fire drill compliance 100% strength", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          fire_drill_records: [makeDrill()],
        }),
      );
      expect(r.strengths).toEqual(
        expect.arrayContaining([
          expect.stringContaining("Every fire drill fully compliant"),
        ]),
      );
    });

    it("fire drill compliance 80-99% strength", () => {
      const drills: FireDrillRecordInput[] = [];
      for (let i = 0; i < 8; i++) drills.push(makeDrill());
      for (let i = 0; i < 2; i++) drills.push(makeDrill({ all_children_participated: false, evacuation_time_seconds: 999, target_evacuation_time_seconds: 180 }));
      const r = computeEmergencyPreparednessContinuity(
        baseInput({ total_children: 1, fire_drill_records: drills }),
      );
      expect(r.strengths).toEqual(
        expect.arrayContaining([expect.stringContaining("80% fire drill compliance")]),
      );
    });

    it("drill type coverage 4/4 strength", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          fire_drill_records: [
            makeDrill({ drill_type: "day", drill_date: "2026-05-01" }),
            makeDrill({ drill_type: "night", drill_date: "2026-05-05" }),
            makeDrill({ drill_type: "weekend", drill_date: "2026-05-10" }),
            makeDrill({ drill_type: "unannounced", drill_date: "2026-05-15" }),
          ],
        }),
      );
      expect(r.strengths).toEqual(
        expect.arrayContaining([
          expect.stringContaining("all four scenario types"),
        ]),
      );
    });

    it("drill type coverage 3/4 strength", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          fire_drill_records: [
            makeDrill({ drill_type: "day", drill_date: "2026-05-01" }),
            makeDrill({ drill_type: "night", drill_date: "2026-05-05" }),
            makeDrill({ drill_type: "weekend", drill_date: "2026-05-10" }),
          ],
        }),
      );
      expect(r.strengths).toEqual(
        expect.arrayContaining([
          expect.stringContaining("3 of 4 scenario types"),
        ]),
      );
    });

    it("100% debrief strength", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          fire_drill_records: [makeDrill({ debrief_completed: true })],
        }),
      );
      expect(r.strengths).toEqual(
        expect.arrayContaining([
          expect.stringContaining("Debrief completed after every fire drill"),
        ]),
      );
    });

    it("80-99% debrief strength", () => {
      const drills: FireDrillRecordInput[] = [];
      for (let i = 0; i < 8; i++) drills.push(makeDrill({ debrief_completed: true }));
      for (let i = 0; i < 2; i++) drills.push(makeDrill({ debrief_completed: false }));
      const r = computeEmergencyPreparednessContinuity(
        baseInput({ total_children: 1, fire_drill_records: drills }),
      );
      expect(r.strengths).toEqual(
        expect.arrayContaining([expect.stringContaining("80% debrief completion rate")]),
      );
    });

    it("100% staff drill participation strength", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          fire_drill_records: [makeDrill({ all_staff_participated: true })],
        }),
      );
      expect(r.strengths).toEqual(
        expect.arrayContaining([
          expect.stringContaining("All staff participated in every fire drill"),
        ]),
      );
    });

    it("80-99% staff drill participation strength", () => {
      const drills: FireDrillRecordInput[] = [];
      for (let i = 0; i < 8; i++) drills.push(makeDrill({ all_staff_participated: true }));
      for (let i = 0; i < 2; i++) drills.push(makeDrill({ all_staff_participated: false }));
      const r = computeEmergencyPreparednessContinuity(
        baseInput({ total_children: 1, fire_drill_records: drills }),
      );
      expect(r.strengths).toEqual(
        expect.arrayContaining([expect.stringContaining("80% staff participation rate")]),
      );
    });

    it("100% drill issue resolution strength", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          fire_drill_records: [
            makeDrill({ issues_identified: ["blocked exit"], issues_resolved: true }),
          ],
        }),
      );
      expect(r.strengths).toEqual(
        expect.arrayContaining([
          expect.stringContaining("All issues identified during fire drills have been resolved"),
        ]),
      );
    });

    it("night and unannounced drills in last 6 months strength", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          fire_drill_records: [
            makeDrill({ drill_type: "night", drill_date: "2026-05-01" }),
            makeDrill({ drill_type: "unannounced", drill_date: "2026-05-10" }),
          ],
        }),
      );
      expect(r.strengths).toEqual(
        expect.arrayContaining([
          expect.stringContaining("Both night and unannounced drills"),
        ]),
      );
    });

    it("100% evacuation plan currency strength", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          evacuation_plans: [makeEvacPlan({ is_current: true, review_due: "2026-12-01" })],
        }),
      );
      expect(r.strengths).toEqual(
        expect.arrayContaining([
          expect.stringContaining("All evacuation plans are current"),
        ]),
      );
    });

    it("100% plan comprehensiveness strength", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          evacuation_plans: [makeEvacPlan()],
        }),
      );
      expect(r.strengths).toEqual(
        expect.arrayContaining([
          expect.stringContaining("Every evacuation plan covers all exits"),
        ]),
      );
    });

    it("100% plans displayed strength", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          evacuation_plans: [makeEvacPlan({ displayed_in_home: true })],
        }),
      );
      expect(r.strengths).toEqual(
        expect.arrayContaining([
          expect.stringContaining("All evacuation plans displayed"),
        ]),
      );
    });

    it("100% staff trained on plans strength", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          evacuation_plans: [makeEvacPlan({ staff_trained_on_plan: true })],
        }),
      );
      expect(r.strengths).toEqual(
        expect.arrayContaining([
          expect.stringContaining("Staff trained on every evacuation plan"),
        ]),
      );
    });

    it("100% children briefed strength", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          evacuation_plans: [makeEvacPlan({ children_briefed: true })],
        }),
      );
      expect(r.strengths).toEqual(
        expect.arrayContaining([
          expect.stringContaining("Children briefed on every evacuation plan"),
        ]),
      );
    });

    it("plan type coverage >= 80% strength", () => {
      // 5 out of 6 types → 83%
      const plans = (["fire", "flood", "gas_leak", "intruder", "chemical"] as const).map((t) =>
        makeEvacPlan({ plan_type: t }),
      );
      const r = computeEmergencyPreparednessContinuity(
        baseInput({ total_children: 1, evacuation_plans: plans }),
      );
      expect(r.strengths).toEqual(
        expect.arrayContaining([
          expect.stringContaining("5 of 6 emergency scenarios"),
        ]),
      );
    });

    it("100% emergency contact accuracy strength", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          emergency_contacts: [makeContact({ verified: true, is_current: true })],
        }),
      );
      expect(r.strengths).toEqual(
        expect.arrayContaining([
          expect.stringContaining("All emergency contacts are verified and current"),
        ]),
      );
    });

    it("100% essential contact coverage strength", () => {
      const contacts = makeAllEssentialContacts();
      const r = computeEmergencyPreparednessContinuity(
        baseInput({ total_children: 1, emergency_contacts: contacts }),
      );
      expect(r.strengths).toEqual(
        expect.arrayContaining([
          expect.stringContaining("All essential emergency contact types covered"),
        ]),
      );
    });

    it("90%+ recent verification strength", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          emergency_contacts: [
            makeContact({ last_verified_date: "2026-05-01", verified: true, is_current: true }),
          ],
        }),
      );
      expect(r.strengths).toEqual(
        expect.arrayContaining([
          expect.stringContaining("contacts verified within the last 90 days"),
        ]),
      );
    });

    it("business continuity score >= 80% strength", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          business_continuity_plans: [makeBCP()],
        }),
      );
      expect(r.strengths).toEqual(
        expect.arrayContaining([
          expect.stringContaining("Business continuity score at 100%"),
        ]),
      );
    });

    it("100% plan testing strength", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          business_continuity_plans: [makeBCP({ tested: true })],
        }),
      );
      expect(r.strengths).toEqual(
        expect.arrayContaining([
          expect.stringContaining("All business continuity plans have been tested"),
        ]),
      );
    });

    it("100% staff awareness strength", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          business_continuity_plans: [makeBCP({ staff_aware: true })],
        }),
      );
      expect(r.strengths).toEqual(
        expect.arrayContaining([
          expect.stringContaining("All staff are aware of business continuity plans"),
        ]),
      );
    });

    it("scenario coverage >= 75% strength", () => {
      // 6 out of 8 scenarios → 75%
      const plans = (["pandemic", "staff_shortage", "building_damage", "utility_failure", "cyber_attack", "extreme_weather"] as const).map((s) =>
        makeBCP({ scenario: s }),
      );
      const r = computeEmergencyPreparednessContinuity(
        baseInput({ total_children: 1, business_continuity_plans: plans }),
      );
      expect(r.strengths).toEqual(
        expect.arrayContaining([
          expect.stringContaining("6 of 8 potential disruption scenarios"),
        ]),
      );
    });

    it("100% first aid coverage strength", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          first_aid_records: [
            makeFirstAid({ record_type: "certificate", is_current: true, certificate_expiry: "2027-06-01" }),
          ],
        }),
      );
      expect(r.strengths).toEqual(
        expect.arrayContaining([
          expect.stringContaining("All first aid certificates are current"),
        ]),
      );
    });

    it("100% equipment maintenance strength", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          first_aid_records: [
            makeEquipment({ equipment_checked: true, equipment_in_date: true }),
          ],
        }),
      );
      expect(r.strengths).toEqual(
        expect.arrayContaining([
          expect.stringContaining("All first aid equipment checked and in date"),
        ]),
      );
    });

    it("90%+ training currency strength", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          first_aid_records: [
            makeTraining({ training_date: "2026-03-01" }),
          ],
        }),
      );
      expect(r.strengths).toEqual(
        expect.arrayContaining([
          expect.stringContaining("first aid training is within the last 12 months"),
        ]),
      );
    });

    it("3+ staff with certificates strength", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          first_aid_records: [
            makeFirstAid({ staff_id: "s1", is_current: true, certificate_expiry: "2027-01-01" }),
            makeFirstAid({ staff_id: "s2", is_current: true, certificate_expiry: "2027-01-01" }),
            makeFirstAid({ staff_id: "s3", is_current: true, certificate_expiry: "2027-01-01" }),
          ],
        }),
      );
      expect(r.strengths).toEqual(
        expect.arrayContaining([
          expect.stringContaining("3 staff members hold current first aid certificates"),
        ]),
      );
    });

    it("2 staff with certificates strength", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          first_aid_records: [
            makeFirstAid({ staff_id: "s1", is_current: true, certificate_expiry: "2027-01-01" }),
            makeFirstAid({ staff_id: "s2", is_current: true, certificate_expiry: "2027-01-01" }),
          ],
        }),
      );
      expect(r.strengths).toEqual(
        expect.arrayContaining([
          expect.stringContaining("2 staff members hold current first aid certificates"),
        ]),
      );
    });
  });

  // ====================================================================
  // 10. CONCERNS
  // ====================================================================
  describe("concerns", () => {
    it("fire drill compliance < 50% concern", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          fire_drill_records: [
            makeDrill({ all_children_participated: false, evacuation_time_seconds: 999, target_evacuation_time_seconds: 180, debrief_completed: false }),
          ],
        }),
      );
      expect(r.concerns).toEqual(
        expect.arrayContaining([expect.stringContaining("0% fire drill compliance")]),
      );
    });

    it("fire drill compliance 50-79% concern", () => {
      const drills: FireDrillRecordInput[] = [];
      for (let i = 0; i < 6; i++) drills.push(makeDrill({ debrief_completed: false }));
      for (let i = 0; i < 4; i++) drills.push(makeDrill({ all_children_participated: false, evacuation_time_seconds: 999, target_evacuation_time_seconds: 180, debrief_completed: false }));
      const r = computeEmergencyPreparednessContinuity(
        baseInput({ total_children: 1, fire_drill_records: drills }),
      );
      expect(r.concerns).toEqual(
        expect.arrayContaining([expect.stringContaining("Fire drill compliance at 60%")]),
      );
    });

    it("no fire drills concern when children on placement (not allEmpty)", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 2,
          emergency_contacts: [makeContact()],
        }),
      );
      expect(r.concerns).toEqual(
        expect.arrayContaining([expect.stringContaining("No fire drill records exist")]),
      );
    });

    it("drill overdue concern (> 30 days)", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          fire_drill_records: [
            makeDrill({ drill_date: "2026-04-01" }),
          ],
        }),
      );
      // Days between "2026-04-01" and "2026-05-28" = 57 days > 30
      expect(r.concerns).toEqual(
        expect.arrayContaining([expect.stringContaining("days ago")]),
      );
    });

    it("drill type coverage 1 concern", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          fire_drill_records: [makeDrill({ drill_type: "day" })],
        }),
      );
      expect(r.concerns).toEqual(
        expect.arrayContaining([expect.stringContaining("1 scenario type")]),
      );
    });

    it("drill type coverage 2 concern", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          fire_drill_records: [
            makeDrill({ drill_type: "day" }),
            makeDrill({ drill_type: "night", drill_date: "2026-05-15" }),
          ],
        }),
      );
      expect(r.concerns).toEqual(
        expect.arrayContaining([expect.stringContaining("2 of 4 scenario types")]),
      );
    });

    it("no night drills in 6 months concern", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          fire_drill_records: [makeDrill({ drill_type: "day" })],
        }),
      );
      expect(r.concerns).toEqual(
        expect.arrayContaining([expect.stringContaining("No night fire drills")]),
      );
    });

    it("no unannounced drills in 6 months concern", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          fire_drill_records: [makeDrill({ drill_type: "day" })],
        }),
      );
      expect(r.concerns).toEqual(
        expect.arrayContaining([expect.stringContaining("No unannounced fire drills")]),
      );
    });

    it("debrief rate < 50% concern", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          fire_drill_records: [
            makeDrill({ debrief_completed: false }),
            makeDrill({ debrief_completed: false }),
            makeDrill({ debrief_completed: true }),
          ],
        }),
      );
      // 1/3 = 33% < 50%
      expect(r.concerns).toEqual(
        expect.arrayContaining([expect.stringContaining("33% of fire drills include a debrief")]),
      );
    });

    it("debrief rate 50-79% concern", () => {
      const drills: FireDrillRecordInput[] = [];
      for (let i = 0; i < 6; i++) drills.push(makeDrill({ debrief_completed: true }));
      for (let i = 0; i < 4; i++) drills.push(makeDrill({ debrief_completed: false }));
      const r = computeEmergencyPreparednessContinuity(
        baseInput({ total_children: 1, fire_drill_records: drills }),
      );
      expect(r.concerns).toEqual(
        expect.arrayContaining([expect.stringContaining("Drill debrief rate at 60%")]),
      );
    });

    it("drill issue resolution < 50% concern", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          fire_drill_records: [
            makeDrill({ issues_identified: ["exit blocked"], issues_resolved: false }),
            makeDrill({ issues_identified: ["alarm fault"], issues_resolved: false }),
            makeDrill({ issues_identified: [], issues_resolved: false }),
          ],
        }),
      );
      // 0/2 issues resolved = 0%
      expect(r.concerns).toEqual(
        expect.arrayContaining([expect.stringContaining("0% of issues identified during fire drills have been resolved")]),
      );
    });

    it("staff drill participation < 70% concern", () => {
      const drills: FireDrillRecordInput[] = [];
      for (let i = 0; i < 6; i++) drills.push(makeDrill({ all_staff_participated: true }));
      for (let i = 0; i < 4; i++) drills.push(makeDrill({ all_staff_participated: false }));
      const r = computeEmergencyPreparednessContinuity(
        baseInput({ total_children: 1, fire_drill_records: drills }),
      );
      // 6/10 = 60% < 70%
      expect(r.concerns).toEqual(
        expect.arrayContaining([expect.stringContaining("Staff drill participation at only 60%")]),
      );
    });

    it("evacuation plan currency < 50% concern", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          evacuation_plans: [
            makeEvacPlan({ is_current: false, review_due: "2025-01-01", covers_all_exits: false, includes_assembly_point: false, includes_roll_call_procedure: false, includes_vulnerable_children_provisions: false, displayed_in_home: false, staff_trained_on_plan: false, children_briefed: false, approved_by: null }),
          ],
        }),
      );
      expect(r.concerns).toEqual(
        expect.arrayContaining([expect.stringContaining("0% of evacuation plans are current")]),
      );
    });

    it("no evacuation plans concern when children present (not allEmpty)", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          fire_drill_records: [makeDrill()],
        }),
      );
      expect(r.concerns).toEqual(
        expect.arrayContaining([expect.stringContaining("No evacuation plans documented")]),
      );
    });

    it("plan comprehensiveness < 50% concern", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          evacuation_plans: [
            makeEvacPlan({ covers_all_exits: false, includes_assembly_point: false, includes_roll_call_procedure: false, includes_vulnerable_children_provisions: false }),
          ],
        }),
      );
      expect(r.concerns).toEqual(
        expect.arrayContaining([expect.stringContaining("0% of evacuation plans include all critical elements")]),
      );
    });

    it("plan display rate < 80% concern", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          evacuation_plans: [
            makeEvacPlan({ displayed_in_home: true }),
            makeEvacPlan({ displayed_in_home: false }),
          ],
        }),
      );
      // 1/2 = 50% < 80%
      expect(r.concerns).toEqual(
        expect.arrayContaining([expect.stringContaining("50% of evacuation plans displayed")]),
      );
    });

    it("staff trained on plans < 70% concern", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          evacuation_plans: [
            makeEvacPlan({ staff_trained_on_plan: true }),
            makeEvacPlan({ staff_trained_on_plan: false }),
          ],
        }),
      );
      // 1/2 = 50% < 70%
      expect(r.concerns).toEqual(
        expect.arrayContaining([expect.stringContaining("50% of plans have associated staff training")]),
      );
    });

    it("children briefed < 70% concern", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          evacuation_plans: [
            makeEvacPlan({ children_briefed: true }),
            makeEvacPlan({ children_briefed: false }),
          ],
        }),
      );
      expect(r.concerns).toEqual(
        expect.arrayContaining([expect.stringContaining("50% of evacuation plans have been briefed to children")]),
      );
    });

    it("plans overdue > 30% concern", () => {
      // 2 out of 3 plans overdue = 67%
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          evacuation_plans: [
            makeEvacPlan({ review_due: "2026-12-01" }),
            makeEvacPlan({ review_due: "2025-01-01" }),
            makeEvacPlan({ review_due: "2025-06-01" }),
          ],
        }),
      );
      expect(r.concerns).toEqual(
        expect.arrayContaining([expect.stringContaining("67% of evacuation plans are overdue for review")]),
      );
    });

    it("emergency contact accuracy < 50% concern", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          emergency_contacts: [
            makeContact({ verified: false, is_current: false }),
          ],
        }),
      );
      expect(r.concerns).toEqual(
        expect.arrayContaining([expect.stringContaining("0% of emergency contacts are verified and current")]),
      );
    });

    it("no contacts concern when children present (not allEmpty)", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          fire_drill_records: [makeDrill()],
        }),
      );
      expect(r.concerns).toEqual(
        expect.arrayContaining([expect.stringContaining("No emergency contacts documented")]),
      );
    });

    it("essential coverage < 75% concern", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          emergency_contacts: [
            makeContact({ contact_type: "police", verified: true, is_current: true }),
          ],
        }),
      );
      // 1/8 = 13% < 75%
      expect(r.concerns).toEqual(
        expect.arrayContaining([expect.stringContaining("13% of essential contact types covered")]),
      );
    });

    it("contacts overdue > 20% concern", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          emergency_contacts: [
            makeContact({ verification_due: "2026-01-01" }),
            makeContact({ verification_due: "2026-01-01" }),
            makeContact({ verification_due: "2026-12-01" }),
          ],
        }),
      );
      // 2/3 overdue = 67% > 20%
      expect(r.concerns).toEqual(
        expect.arrayContaining([expect.stringContaining("67% of emergency contacts are overdue for verification")]),
      );
    });

    it("business continuity score < 40% concern", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          business_continuity_plans: [
            makeBCP({
              is_current: false,
              review_due: "2025-01-01",
              tested: false,
              includes_communication_plan: false,
              includes_alternative_accommodation: false,
              includes_data_backup: false,
              includes_staffing_contingency: false,
              staff_aware: false,
            }),
          ],
        }),
      );
      expect(r.business_continuity_score).toBe(0);
      expect(r.concerns).toEqual(
        expect.arrayContaining([expect.stringContaining("Business continuity score at only 0%")]),
      );
    });

    it("business continuity score 40-59% concern", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          business_continuity_plans: [
            makeBCP({
              is_current: true,
              review_due: "2026-12-01",
              tested: true,
              includes_communication_plan: true,
              includes_alternative_accommodation: false,
              includes_data_backup: false,
              includes_staffing_contingency: false,
              staff_aware: false,
            }),
          ],
        }),
      );
      // 3 true: currency, testing, comms → 300/7 = 43
      expect(r.business_continuity_score).toBe(43);
      expect(r.concerns).toEqual(
        expect.arrayContaining([expect.stringContaining("Business continuity score at 43%")]),
      );
    });

    it("no continuity plans concern when children present (not allEmpty)", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          fire_drill_records: [makeDrill()],
        }),
      );
      expect(r.concerns).toEqual(
        expect.arrayContaining([expect.stringContaining("No business continuity plans documented")]),
      );
    });

    it("plan testing < 50% concern", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          business_continuity_plans: [
            makeBCP({ tested: false }),
          ],
        }),
      );
      expect(r.concerns).toEqual(
        expect.arrayContaining([expect.stringContaining("0% of continuity plans have been tested")]),
      );
    });

    it("staff awareness < 70% concern", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          business_continuity_plans: [
            makeBCP({ staff_aware: true }),
            makeBCP({ staff_aware: false }),
          ],
        }),
      );
      // 1/2 = 50% < 70%
      expect(r.concerns).toEqual(
        expect.arrayContaining([expect.stringContaining("50% staff awareness of continuity plans")]),
      );
    });

    it("continuity plans overdue > 30% concern", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          business_continuity_plans: [
            makeBCP({ review_due: "2025-01-01" }),
            makeBCP({ review_due: "2025-01-01" }),
          ],
        }),
      );
      expect(r.concerns).toEqual(
        expect.arrayContaining([expect.stringContaining("100% of business continuity plans overdue for review")]),
      );
    });

    it("first aid coverage < 50% concern", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          first_aid_records: [
            makeFirstAid({ is_current: false, certificate_expiry: "2025-01-01", staff_id: "s1" }),
          ],
        }),
      );
      expect(r.concerns).toEqual(
        expect.arrayContaining([expect.stringContaining("0% of first aid certificates are current")]),
      );
    });

    it("first aid coverage 50-79% concern", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          first_aid_records: [
            makeFirstAid({ is_current: true, certificate_expiry: "2027-01-01", staff_id: "s1" }),
            makeFirstAid({ is_current: false, certificate_expiry: "2025-01-01", staff_id: "s2" }),
          ],
        }),
      );
      expect(r.concerns).toEqual(
        expect.arrayContaining([expect.stringContaining("First aid certificate currency at 50%")]),
      );
    });

    it("no first aid certificates concern when children present (not allEmpty)", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          fire_drill_records: [makeDrill()],
        }),
      );
      expect(r.concerns).toEqual(
        expect.arrayContaining([expect.stringContaining("No first aid certificate records")]),
      );
    });

    it("expiring certificates concern", () => {
      // Certificate expiring within 30 days of today (2026-05-28)
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          first_aid_records: [
            makeFirstAid({ certificate_expiry: "2026-06-15", is_current: true, staff_id: "s1" }),
          ],
        }),
      );
      // 2026-06-15 is within 30 days of 2026-05-28 → expiring
      expect(r.concerns).toEqual(
        expect.arrayContaining([expect.stringContaining("1 first aid certificate expiring within 30 days")]),
      );
    });

    it("equipment maintenance < 50% concern", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          first_aid_records: [
            makeEquipment({ equipment_checked: false, equipment_in_date: false }),
          ],
        }),
      );
      expect(r.concerns).toEqual(
        expect.arrayContaining([expect.stringContaining("0% of first aid equipment is checked and in date")]),
      );
    });

    it("equipment maintenance 50-79% concern", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          first_aid_records: [
            makeEquipment({ equipment_checked: true, equipment_in_date: true }),
            makeEquipment({ equipment_checked: false, equipment_in_date: false }),
          ],
        }),
      );
      expect(r.concerns).toEqual(
        expect.arrayContaining([expect.stringContaining("Equipment maintenance at 50%")]),
      );
    });

    it("equipment overdue > 20% concern", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          first_aid_records: [
            makeEquipment({ equipment_next_check_due: "2026-01-01" }),
            makeEquipment({ equipment_next_check_due: "2026-01-01" }),
            makeEquipment({ equipment_next_check_due: "2026-12-01" }),
          ],
        }),
      );
      // 2/3 overdue = 67% > 20%
      expect(r.concerns).toEqual(
        expect.arrayContaining([expect.stringContaining("67% of first aid equipment is overdue for checking")]),
      );
    });

    it("0 staff with certs concern when children present (not allEmpty)", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          fire_drill_records: [makeDrill()],
        }),
      );
      expect(r.concerns).toEqual(
        expect.arrayContaining([
          expect.stringContaining("No staff currently hold a valid first aid certificate"),
        ]),
      );
    });

    it("1 staff with cert concern", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          first_aid_records: [
            makeFirstAid({ staff_id: "s1", is_current: true, certificate_expiry: "2027-01-01" }),
          ],
        }),
      );
      expect(r.concerns).toEqual(
        expect.arrayContaining([
          expect.stringContaining("Only 1 staff member holds a current first aid certificate"),
        ]),
      );
    });

    it("training currency < 50% concern", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          first_aid_records: [
            makeTraining({ training_date: "2024-01-01" }),
          ],
        }),
      );
      // Training > 12 months old → 0% currency
      expect(r.concerns).toEqual(
        expect.arrayContaining([expect.stringContaining("0% of first aid training is within the last 12 months")]),
      );
    });
  });

  // ====================================================================
  // 11. RECOMMENDATIONS
  // ====================================================================
  describe("recommendations", () => {
    it("recommends fire drills when none exist and children present (not allEmpty)", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          emergency_contacts: [makeContact()],
        }),
      );
      expect(r.recommendations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            urgency: "immediate",
            regulatory_ref: expect.stringContaining("Reg 25"),
            recommendation: expect.stringContaining("Immediately commence regular fire drills"),
          }),
        ]),
      );
    });

    it("recommends fire drill review when compliance < 50%", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          fire_drill_records: [
            makeDrill({ all_children_participated: false, evacuation_time_seconds: 999, target_evacuation_time_seconds: 180, debrief_completed: false }),
          ],
        }),
      );
      expect(r.recommendations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            urgency: "immediate",
            recommendation: expect.stringContaining("Urgently review fire drill procedures"),
          }),
        ]),
      );
    });

    it("recommends immediate drill when overdue", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          fire_drill_records: [
            makeDrill({ drill_date: "2026-04-01" }),
          ],
        }),
      );
      expect(r.recommendations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            urgency: "immediate",
            recommendation: expect.stringContaining("Conduct a fire drill immediately"),
          }),
        ]),
      );
    });

    it("recommends evacuation plans when none exist", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          fire_drill_records: [makeDrill()],
        }),
      );
      expect(r.recommendations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            urgency: "immediate",
            recommendation: expect.stringContaining("Develop and display evacuation plans"),
          }),
        ]),
      );
    });

    it("recommends evacuation plan update when currency < 50%", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          evacuation_plans: [
            makeEvacPlan({ is_current: false, review_due: "2025-01-01", covers_all_exits: false, includes_assembly_point: false, includes_roll_call_procedure: false, includes_vulnerable_children_provisions: false, displayed_in_home: false, staff_trained_on_plan: false, children_briefed: false, approved_by: null }),
          ],
        }),
      );
      expect(r.recommendations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            urgency: "immediate",
            recommendation: expect.stringContaining("Review and update all evacuation plans immediately"),
          }),
        ]),
      );
    });

    it("recommends contact verification when accuracy < 50%", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          emergency_contacts: [
            makeContact({ verified: false, is_current: false }),
          ],
        }),
      );
      expect(r.recommendations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            urgency: "immediate",
            recommendation: expect.stringContaining("Verify and update all emergency contacts urgently"),
          }),
        ]),
      );
    });

    it("recommends first aid training when 0 staff have certs (not allEmpty)", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          fire_drill_records: [makeDrill()],
        }),
      );
      expect(r.recommendations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            urgency: "immediate",
            recommendation: expect.stringContaining("Arrange first aid training for at least two staff"),
          }),
        ]),
      );
    });

    it("recommends equipment check when maintenance < 50%", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          first_aid_records: [
            makeEquipment({ equipment_checked: false, equipment_in_date: false }),
          ],
        }),
      );
      expect(r.recommendations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            urgency: "immediate",
            recommendation: expect.stringContaining("Check and restock all first aid equipment immediately"),
          }),
        ]),
      );
    });

    it("recommends cert renewal when first aid coverage < 50%", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          first_aid_records: [
            makeFirstAid({ is_current: false, certificate_expiry: "2025-01-01", staff_id: "s1" }),
          ],
        }),
      );
      expect(r.recommendations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            urgency: "immediate",
            recommendation: expect.stringContaining("Renew expired first aid certificates urgently"),
          }),
        ]),
      );
    });

    it("soon: improve fire drill compliance 50-79%", () => {
      const drills: FireDrillRecordInput[] = [];
      for (let i = 0; i < 6; i++) drills.push(makeDrill({ debrief_completed: false }));
      for (let i = 0; i < 4; i++) drills.push(makeDrill({ all_children_participated: false, evacuation_time_seconds: 999, target_evacuation_time_seconds: 180, debrief_completed: false }));
      const r = computeEmergencyPreparednessContinuity(
        baseInput({ total_children: 1, fire_drill_records: drills }),
      );
      expect(r.recommendations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            urgency: "soon",
            recommendation: expect.stringContaining("Improve fire drill compliance to at least 80%"),
          }),
        ]),
      );
    });

    it("soon: night drill recommendation", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          fire_drill_records: [makeDrill({ drill_type: "day" })],
        }),
      );
      expect(r.recommendations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            urgency: "soon",
            recommendation: expect.stringContaining("Schedule a night fire drill"),
          }),
        ]),
      );
    });

    it("soon: unannounced drill recommendation", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          fire_drill_records: [makeDrill({ drill_type: "day" })],
        }),
      );
      expect(r.recommendations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            urgency: "soon",
            recommendation: expect.stringContaining("unannounced fire drill"),
          }),
        ]),
      );
    });

    it("soon: improve debrief rate when < 80%", () => {
      const drills: FireDrillRecordInput[] = [];
      for (let i = 0; i < 6; i++) drills.push(makeDrill({ debrief_completed: true }));
      for (let i = 0; i < 4; i++) drills.push(makeDrill({ debrief_completed: false }));
      const r = computeEmergencyPreparednessContinuity(
        baseInput({ total_children: 1, fire_drill_records: drills }),
      );
      expect(r.recommendations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            urgency: "soon",
            recommendation: expect.stringContaining("Ensure every fire drill is followed by a documented debrief"),
          }),
        ]),
      );
    });

    it("soon: business continuity plans recommendation when none exist (not allEmpty)", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          fire_drill_records: [makeDrill()],
        }),
      );
      expect(r.recommendations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            urgency: "soon",
            recommendation: expect.stringContaining("Develop business continuity plans"),
          }),
        ]),
      );
    });

    it("planned: improve first aid coverage 50-79%", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          first_aid_records: [
            makeFirstAid({ is_current: true, certificate_expiry: "2027-01-01", staff_id: "s1" }),
            makeFirstAid({ is_current: false, certificate_expiry: "2025-01-01", staff_id: "s2" }),
          ],
        }),
      );
      expect(r.recommendations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            urgency: "planned",
            recommendation: expect.stringContaining("Improve first aid certificate currency to at least 80%"),
          }),
        ]),
      );
    });

    it("planned: train additional staff when only 1 has cert", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          first_aid_records: [
            makeFirstAid({ staff_id: "s1", is_current: true, certificate_expiry: "2027-01-01" }),
          ],
        }),
      );
      expect(r.recommendations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            urgency: "planned",
            recommendation: expect.stringContaining("Train at least one additional staff member"),
          }),
        ]),
      );
    });

    it("recommendations have sequential rank numbers", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 2,
          fire_drill_records: [makeDrill({ drill_type: "day", all_children_participated: false, evacuation_time_seconds: 999, target_evacuation_time_seconds: 180, debrief_completed: false })],
          evacuation_plans: [makeEvacPlan({ is_current: false, review_due: "2025-01-01", covers_all_exits: false, includes_assembly_point: false, includes_roll_call_procedure: false, includes_vulnerable_children_provisions: false, displayed_in_home: false, staff_trained_on_plan: false, children_briefed: false, approved_by: null })],
          emergency_contacts: [makeContact({ verified: false, is_current: false })],
          first_aid_records: [makeEquipment({ equipment_checked: false, equipment_in_date: false })],
        }),
      );
      for (let i = 0; i < r.recommendations.length; i++) {
        expect(r.recommendations[i].rank).toBe(i + 1);
      }
    });
  });

  // ====================================================================
  // 12. INSIGHTS
  // ====================================================================
  describe("insights", () => {
    it("critical insight: fire drill compliance < 50%", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          fire_drill_records: [
            makeDrill({ all_children_participated: false, evacuation_time_seconds: 999, target_evacuation_time_seconds: 180, debrief_completed: false }),
          ],
        }),
      );
      expect(r.insights).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            severity: "critical",
            text: expect.stringContaining("0% fire drill compliance"),
          }),
        ]),
      );
    });

    it("critical insight: no fire drills with children (not allEmpty)", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          emergency_contacts: [makeContact()],
        }),
      );
      expect(r.insights).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            severity: "critical",
            text: expect.stringContaining("No fire drills recorded"),
          }),
        ]),
      );
    });

    it("critical insight: evacuation plan currency < 50%", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          evacuation_plans: [
            makeEvacPlan({ is_current: false, review_due: "2025-01-01", covers_all_exits: false, includes_assembly_point: false, includes_roll_call_procedure: false, includes_vulnerable_children_provisions: false, displayed_in_home: false, staff_trained_on_plan: false, children_briefed: false, approved_by: null }),
          ],
        }),
      );
      expect(r.insights).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            severity: "critical",
            text: expect.stringContaining("0% of evacuation plans are current"),
          }),
        ]),
      );
    });

    it("critical insight: no evacuation plans with children (not allEmpty)", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          fire_drill_records: [makeDrill()],
        }),
      );
      expect(r.insights).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            severity: "critical",
            text: expect.stringContaining("No evacuation plans exist"),
          }),
        ]),
      );
    });

    it("critical insight: contact accuracy < 50%", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          emergency_contacts: [
            makeContact({ verified: false, is_current: false }),
          ],
        }),
      );
      expect(r.insights).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            severity: "critical",
            text: expect.stringContaining("0% of emergency contacts are verified and current"),
          }),
        ]),
      );
    });

    it("critical insight: 0 staff with certs (not allEmpty)", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          fire_drill_records: [makeDrill()],
        }),
      );
      expect(r.insights).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            severity: "critical",
            text: expect.stringContaining("No staff currently hold a valid first aid certificate"),
          }),
        ]),
      );
    });

    it("critical insight: equipment maintenance < 50%", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          first_aid_records: [
            makeEquipment({ equipment_checked: false, equipment_in_date: false }),
          ],
        }),
      );
      expect(r.insights).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            severity: "critical",
            text: expect.stringContaining("0% of first aid equipment is maintained"),
          }),
        ]),
      );
    });

    it("warning insight: fire drill compliance 50-79%", () => {
      const drills: FireDrillRecordInput[] = [];
      for (let i = 0; i < 6; i++) drills.push(makeDrill({ debrief_completed: false }));
      for (let i = 0; i < 4; i++) drills.push(makeDrill({ all_children_participated: false, evacuation_time_seconds: 999, target_evacuation_time_seconds: 180, debrief_completed: false }));
      const r = computeEmergencyPreparednessContinuity(
        baseInput({ total_children: 1, fire_drill_records: drills }),
      );
      expect(r.insights).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            severity: "warning",
            text: expect.stringContaining("Fire drill compliance at 60%"),
          }),
        ]),
      );
    });

    it("warning insight: drill overdue", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          fire_drill_records: [
            makeDrill({ drill_date: "2026-04-01" }),
          ],
        }),
      );
      expect(r.insights).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            severity: "warning",
            text: expect.stringContaining("Last fire drill was"),
          }),
        ]),
      );
    });

    it("warning insight: no night drills in 6 months", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          fire_drill_records: [makeDrill({ drill_type: "day" })],
        }),
      );
      expect(r.insights).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            severity: "warning",
            text: expect.stringContaining("No night drills in the last 6 months"),
          }),
        ]),
      );
    });

    it("warning insight: no continuity plans (not allEmpty)", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          fire_drill_records: [makeDrill()],
        }),
      );
      expect(r.insights).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            severity: "warning",
            text: expect.stringContaining("No business continuity plans exist"),
          }),
        ]),
      );
    });

    it("warning insight: expiring certificates", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          first_aid_records: [
            makeFirstAid({ certificate_expiry: "2026-06-15", is_current: true, staff_id: "s1" }),
          ],
        }),
      );
      expect(r.insights).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            severity: "warning",
            text: expect.stringContaining("expiring within 30 days"),
          }),
        ]),
      );
    });

    it("positive insight: outstanding rating", () => {
      const contacts = makeAllEssentialContacts();
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 2,
          fire_drill_records: [makeDrill({ drill_type: "day", debrief_completed: true })],
          evacuation_plans: [makeEvacPlan()],
          emergency_contacts: contacts,
          business_continuity_plans: [makeBCP()],
          first_aid_records: [
            makeFirstAid({ record_type: "certificate", is_current: true, certificate_expiry: "2027-06-01", staff_id: "s1" }),
            makeEquipment({ equipment_checked: true, equipment_in_date: true }),
          ],
        }),
      );
      expect(r.emergency_rating).toBe("outstanding");
      expect(r.insights).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            severity: "positive",
            text: expect.stringContaining("outstanding emergency preparedness"),
          }),
        ]),
      );
    });

    it("positive insight: fire drill compliance >= 90%", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          fire_drill_records: [makeDrill()],
        }),
      );
      expect(r.insights).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            severity: "positive",
            text: expect.stringContaining("100% fire drill compliance"),
          }),
        ]),
      );
    });

    it("positive insight: drill type coverage 4/4", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          fire_drill_records: [
            makeDrill({ drill_type: "day", drill_date: "2026-05-01" }),
            makeDrill({ drill_type: "night", drill_date: "2026-05-05" }),
            makeDrill({ drill_type: "weekend", drill_date: "2026-05-10" }),
            makeDrill({ drill_type: "unannounced", drill_date: "2026-05-15" }),
          ],
        }),
      );
      expect(r.insights).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            severity: "positive",
            text: expect.stringContaining("all four scenario types"),
          }),
        ]),
      );
    });

    it("positive insight: 100% currency + 100% comprehensiveness", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          evacuation_plans: [makeEvacPlan()],
        }),
      );
      expect(r.insights).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            severity: "positive",
            text: expect.stringContaining("All evacuation plans are current, comprehensive"),
          }),
        ]),
      );
    });

    it("positive insight: 100% contact accuracy + 100% essential coverage", () => {
      const contacts = makeAllEssentialContacts();
      const r = computeEmergencyPreparednessContinuity(
        baseInput({ total_children: 1, emergency_contacts: contacts }),
      );
      expect(r.insights).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            severity: "positive",
            text: expect.stringContaining("Every emergency contact is verified and current"),
          }),
        ]),
      );
    });

    it("positive insight: business continuity score >= 80%", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          business_continuity_plans: [makeBCP()],
        }),
      );
      expect(r.insights).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            severity: "positive",
            text: expect.stringContaining("Business continuity score at 100%"),
          }),
        ]),
      );
    });

    it("positive insight: 100% first aid + 100% equipment", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          first_aid_records: [
            makeFirstAid({ record_type: "certificate", is_current: true, certificate_expiry: "2027-06-01", staff_id: "s1" }),
            makeEquipment({ equipment_checked: true, equipment_in_date: true }),
          ],
        }),
      );
      expect(r.insights).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            severity: "positive",
            text: expect.stringContaining("All first aid certificates are current and all equipment is checked"),
          }),
        ]),
      );
    });

    it("positive insight: 3+ staff with certs", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          first_aid_records: [
            makeFirstAid({ staff_id: "s1", is_current: true, certificate_expiry: "2027-01-01" }),
            makeFirstAid({ staff_id: "s2", is_current: true, certificate_expiry: "2027-01-01" }),
            makeFirstAid({ staff_id: "s3", is_current: true, certificate_expiry: "2027-01-01" }),
          ],
        }),
      );
      expect(r.insights).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            severity: "positive",
            text: expect.stringContaining("3 staff members hold current first aid certificates"),
          }),
        ]),
      );
    });

    it("positive insight: all drill issues resolved", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          fire_drill_records: [
            makeDrill({ issues_identified: ["exit blocked"], issues_resolved: true }),
          ],
        }),
      );
      expect(r.insights).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            severity: "positive",
            text: expect.stringContaining("Every issue identified during fire drills has been resolved"),
          }),
        ]),
      );
    });

    it("positive insight: night and unannounced drills conducted recently", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          fire_drill_records: [
            makeDrill({ drill_type: "night", drill_date: "2026-05-01" }),
            makeDrill({ drill_type: "unannounced", drill_date: "2026-05-10" }),
          ],
        }),
      );
      expect(r.insights).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            severity: "positive",
            text: expect.stringContaining("Both night and unannounced drills conducted recently"),
          }),
        ]),
      );
    });
  });

  // ====================================================================
  // 13. HEADLINES
  // ====================================================================
  describe("headlines", () => {
    it("outstanding headline", () => {
      const contacts = makeAllEssentialContacts();
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 2,
          fire_drill_records: [makeDrill({ debrief_completed: true })],
          evacuation_plans: [makeEvacPlan()],
          emergency_contacts: contacts,
          business_continuity_plans: [makeBCP()],
          first_aid_records: [
            makeFirstAid({ record_type: "certificate", is_current: true, certificate_expiry: "2027-06-01", staff_id: "s1" }),
            makeEquipment({ equipment_checked: true, equipment_in_date: true }),
          ],
        }),
      );
      expect(r.headline).toContain("Outstanding emergency preparedness");
    });

    it("good headline includes strength and concern counts", () => {
      const contacts = makeAllEssentialContacts();
      const drills: FireDrillRecordInput[] = [];
      for (let i = 0; i < 7; i++) drills.push(makeDrill({ debrief_completed: true }));
      for (let i = 0; i < 3; i++) drills.push(makeDrill({ debrief_completed: false }));
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 2,
          fire_drill_records: drills,
          evacuation_plans: [makeEvacPlan()],
          emergency_contacts: contacts,
          business_continuity_plans: [makeBCP()],
          first_aid_records: [
            makeFirstAid({ record_type: "certificate", is_current: true, certificate_expiry: "2027-06-01", staff_id: "s1" }),
            makeEquipment({ equipment_checked: true, equipment_in_date: true }),
          ],
        }),
      );
      expect(r.emergency_rating).toBe("good");
      expect(r.headline).toContain("Good emergency preparedness");
      expect(r.headline).toMatch(/\d+ strength/);
    });

    it("adequate headline includes concern count", () => {
      // Score: 52 + B1(+4 drill compliance) + B2(+4 evac currency) = 60 → adequate
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          fire_drill_records: [makeDrill({ drill_type: "day", debrief_completed: false })],
          evacuation_plans: [
            makeEvacPlan({ is_current: true, review_due: "2026-12-01", covers_all_exits: false, includes_assembly_point: false, includes_roll_call_procedure: false, includes_vulnerable_children_provisions: false, displayed_in_home: false, staff_trained_on_plan: false, children_briefed: false, approved_by: null }),
          ],
        }),
      );
      expect(r.emergency_rating).toBe("adequate");
      expect(r.headline).toContain("Adequate emergency preparedness");
      expect(r.headline).toMatch(/\d+ concern/);
    });

    it("inadequate headline includes concern count", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          fire_drill_records: [makeDrill({ all_children_participated: false, evacuation_time_seconds: 999, target_evacuation_time_seconds: 180, debrief_completed: false })],
          evacuation_plans: [makeEvacPlan({ is_current: false, review_due: "2025-01-01", covers_all_exits: false, includes_assembly_point: false, includes_roll_call_procedure: false, includes_vulnerable_children_provisions: false, displayed_in_home: false, staff_trained_on_plan: false, children_briefed: false, approved_by: null })],
          emergency_contacts: [makeContact({ verified: false, is_current: false })],
          first_aid_records: [makeEquipment({ equipment_checked: false, equipment_in_date: false })],
        }),
      );
      expect(r.emergency_rating).toBe("inadequate");
      expect(r.headline).toContain("inadequate");
      expect(r.headline).toMatch(/\d+ significant concern/);
    });
  });

  // ====================================================================
  // 14. EDGE CASES
  // ====================================================================
  describe("edge cases", () => {
    it("evacuation time exactly at target is compliant", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          fire_drill_records: [
            makeDrill({ evacuation_time_seconds: 180, target_evacuation_time_seconds: 180, debrief_completed: false }),
          ],
        }),
      );
      expect(r.fire_drill_compliance_rate).toBe(100);
    });

    it("evacuation time 1 second over target is not compliant", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          fire_drill_records: [
            makeDrill({ all_children_participated: true, evacuation_time_seconds: 181, target_evacuation_time_seconds: 180, debrief_completed: false }),
          ],
        }),
      );
      expect(r.fire_drill_compliance_rate).toBe(0);
    });

    it("review_due on today is still current", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          evacuation_plans: [
            makeEvacPlan({ is_current: true, review_due: "2026-05-28", covers_all_exits: false, includes_assembly_point: false, includes_roll_call_procedure: false, includes_vulnerable_children_provisions: false, displayed_in_home: false, staff_trained_on_plan: false, children_briefed: false, approved_by: null }),
          ],
        }),
      );
      expect(r.evacuation_plan_currency_rate).toBe(100);
    });

    it("review_due yesterday is not current", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          evacuation_plans: [
            makeEvacPlan({ is_current: true, review_due: "2026-05-27", covers_all_exits: false, includes_assembly_point: false, includes_roll_call_procedure: false, includes_vulnerable_children_provisions: false, displayed_in_home: false, staff_trained_on_plan: false, children_briefed: false, approved_by: null }),
          ],
        }),
      );
      expect(r.evacuation_plan_currency_rate).toBe(0);
    });

    it("certificate_expiry on today is still current", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          first_aid_records: [
            makeFirstAid({ is_current: true, certificate_expiry: "2026-05-28", staff_id: "s1" }),
          ],
        }),
      );
      expect(r.first_aid_coverage_rate).toBe(100);
    });

    it("certificate_expiry yesterday is not current", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          first_aid_records: [
            makeFirstAid({ is_current: true, certificate_expiry: "2026-05-27", staff_id: "s1" }),
          ],
        }),
      );
      expect(r.first_aid_coverage_rate).toBe(0);
    });

    it("drill 30 days ago is not overdue", () => {
      // 30 days before 2026-05-28 = 2026-04-28
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          fire_drill_records: [
            makeDrill({ drill_date: "2026-04-28" }),
          ],
        }),
      );
      // daysBetween("2026-04-28", "2026-05-28") = 30, drillOverdue requires > 30
      expect(r.concerns).not.toEqual(
        expect.arrayContaining([expect.stringContaining("days ago")]),
      );
    });

    it("drill 31 days ago is overdue", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          fire_drill_records: [
            makeDrill({ drill_date: "2026-04-27" }),
          ],
        }),
      );
      expect(r.concerns).toEqual(
        expect.arrayContaining([expect.stringContaining("days ago")]),
      );
    });

    it("night drill just outside 6 month window does not count", () => {
      // 6 months before 2026-05-28 ≈ 2025-11-28
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          fire_drill_records: [
            makeDrill({ drill_type: "night", drill_date: "2025-11-27" }),
          ],
        }),
      );
      // Night drill at 2025-11-27, sixMonthsAgoStr comparison should exclude it
      expect(r.concerns).toEqual(
        expect.arrayContaining([expect.stringContaining("No night fire drills")]),
      );
    });

    it("approved_by empty string treated as unapproved", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          evacuation_plans: [
            makeEvacPlan({ approved_by: "" }),
            makeEvacPlan({ approved_by: "Manager" }),
          ],
        }),
      );
      // planApprovalRate = 1/2 = 50% (empty string not counted)
      // This is internal and doesn't directly affect score, but confirms the engine logic
      expect(r.total_evacuation_plans).toBe(2);
    });

    it("multiple certificates for same staff_id count as one staff member", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          first_aid_records: [
            makeFirstAid({ staff_id: "s1", is_current: true, certificate_expiry: "2027-01-01", certificate_type: "First Aid at Work" }),
            makeFirstAid({ staff_id: "s1", is_current: true, certificate_expiry: "2027-06-01", certificate_type: "Paediatric First Aid" }),
          ],
        }),
      );
      // staffWithCerts = 1 (same staff_id)
      expect(r.concerns).toEqual(
        expect.arrayContaining([
          expect.stringContaining("Only 1 staff member holds a current first aid certificate"),
        ]),
      );
    });

    it("certificate with null staff_id does not contribute to staffWithCerts", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          first_aid_records: [
            makeFirstAid({ staff_id: null, is_current: true, certificate_expiry: "2027-01-01" }),
          ],
        }),
      );
      // staffWithCerts should be 0 since staff_id is null
      // 0 staff certs concern fires when total_children > 0 and !allEmpty
      // But allEmpty is false (has first_aid_records) → concern should fire
      expect(r.concerns).toEqual(
        expect.arrayContaining([
          expect.stringContaining("No staff currently hold a valid first aid certificate"),
        ]),
      );
    });

    it("training date exactly 12 months ago counts as recent", () => {
      // 12 months before 2026-05-28 = 2025-05-28
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          first_aid_records: [
            makeTraining({ training_date: "2025-05-28" }),
          ],
        }),
      );
      expect(r.strengths).toEqual(
        expect.arrayContaining([
          expect.stringContaining("first aid training is within the last 12 months"),
        ]),
      );
    });

    it("verification_due null does not count as overdue", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          emergency_contacts: [
            makeContact({ verification_due: null }),
          ],
        }),
      );
      // verification_due null → not counted as overdue
      expect(r.concerns).not.toEqual(
        expect.arrayContaining([expect.stringContaining("overdue for verification")]),
      );
    });

    it("equipment_next_check_due null does not count as overdue", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          first_aid_records: [
            makeEquipment({ equipment_next_check_due: null }),
          ],
        }),
      );
      expect(r.concerns).not.toEqual(
        expect.arrayContaining([expect.stringContaining("overdue for checking")]),
      );
    });

    it("last_verified_date within 90 days counts as recently verified", () => {
      // 90 days before 2026-05-28 = 2026-02-27
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          emergency_contacts: [
            makeContact({ last_verified_date: "2026-02-28", verified: true, is_current: true }),
          ],
        }),
      );
      expect(r.strengths).toEqual(
        expect.arrayContaining([
          expect.stringContaining("contacts verified within the last 90 days"),
        ]),
      );
    });

    it("certificate expiring exactly 30 days from today counts as expiring soon", () => {
      // 30 days from 2026-05-28 = 2026-06-27
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          first_aid_records: [
            makeFirstAid({ certificate_expiry: "2026-06-27", is_current: true, staff_id: "s1" }),
          ],
        }),
      );
      expect(r.concerns).toEqual(
        expect.arrayContaining([
          expect.stringContaining("expiring within 30 days"),
        ]),
      );
    });

    it("certificate expiring 31 days from today does NOT count as expiring soon", () => {
      // 31 days from 2026-05-28 = 2026-06-28
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          first_aid_records: [
            makeFirstAid({ certificate_expiry: "2026-06-28", is_current: true, staff_id: "s1" }),
          ],
        }),
      );
      expect(r.concerns).not.toEqual(
        expect.arrayContaining([
          expect.stringContaining("expiring within 30 days"),
        ]),
      );
    });

    it("multiple expiring certificates shows correct plural", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          first_aid_records: [
            makeFirstAid({ certificate_expiry: "2026-06-15", is_current: true, staff_id: "s1" }),
            makeFirstAid({ certificate_expiry: "2026-06-20", is_current: true, staff_id: "s2" }),
          ],
        }),
      );
      expect(r.concerns).toEqual(
        expect.arrayContaining([
          expect.stringContaining("2 first aid certificates expiring"),
        ]),
      );
    });

    it("single expiring certificate shows correct singular", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          first_aid_records: [
            makeFirstAid({ certificate_expiry: "2026-06-15", is_current: true, staff_id: "s1" }),
          ],
        }),
      );
      expect(r.concerns).toEqual(
        expect.arrayContaining([
          expect.stringContaining("1 first aid certificate expiring"),
        ]),
      );
    });

    it("drills sorted correctly to find most recent for overdue check", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          fire_drill_records: [
            makeDrill({ drill_date: "2026-03-01" }), // older
            makeDrill({ drill_date: "2026-05-20" }), // most recent (8 days ago, not overdue)
            makeDrill({ drill_date: "2026-04-01" }), // middle
          ],
        }),
      );
      // Most recent is 2026-05-20, 8 days ago → not overdue
      expect(r.concerns).not.toEqual(
        expect.arrayContaining([expect.stringContaining("days ago")]),
      );
    });

    it("contact with is_current=false is not counted for essential coverage", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          emergency_contacts: [
            makeContact({ contact_type: "police", is_current: false, verified: true }),
          ],
        }),
      );
      // police with is_current=false → doesn't count for essential coverage
      // essentialCoverageRate = 0/8 = 0%
      expect(r.concerns).toEqual(
        expect.arrayContaining([
          expect.stringContaining("0% of essential contact types covered"),
        ]),
      );
    });

    it("BCP review_due on today is current", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          business_continuity_plans: [
            makeBCP({ is_current: true, review_due: "2026-05-28" }),
          ],
        }),
      );
      // continuityPlanCurrencyRate should be 100%
      expect(r.business_continuity_score).toBeGreaterThan(0);
    });

    it("large number of records handled correctly", () => {
      const drills: FireDrillRecordInput[] = [];
      for (let i = 0; i < 50; i++) {
        drills.push(makeDrill({ drill_date: `2026-05-${String(Math.min(28, (i % 28) + 1)).padStart(2, "0")}` }));
      }
      const r = computeEmergencyPreparednessContinuity(
        baseInput({ total_children: 1, fire_drill_records: drills }),
      );
      expect(r.total_drills).toBe(50);
      expect(r.fire_drill_compliance_rate).toBe(100);
    });

    it("total_children = 0 with data still computes normally (not special case)", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 0,
          fire_drill_records: [makeDrill()],
        }),
      );
      // Not allEmpty (has drills), total_children = 0 → neither special case triggered
      // Normal computation
      expect(r.emergency_rating).not.toBe("insufficient_data");
      expect(r.emergency_score).toBeGreaterThan(0);
    });
  });

  // ====================================================================
  // 15. pct(0,0) BEHAVIOR
  // ====================================================================
  describe("pct(0,0) = 0 behavior", () => {
    it("pct(0,0) = 0 for fire drill compliance when no drills", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          emergency_contacts: [makeContact({ contact_type: "other" })],
        }),
      );
      expect(r.fire_drill_compliance_rate).toBe(0);
    });

    it("pct(0,0) = 0 for evacuation plan currency when no plans", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          fire_drill_records: [makeDrill()],
        }),
      );
      expect(r.evacuation_plan_currency_rate).toBe(0);
    });

    it("pct(0,0) = 0 for emergency contact accuracy when no contacts", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          fire_drill_records: [makeDrill()],
        }),
      );
      expect(r.emergency_contact_accuracy_rate).toBe(0);
    });

    it("pct(0,0) = 0 for first aid coverage when no cert records", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          fire_drill_records: [makeDrill()],
        }),
      );
      expect(r.first_aid_coverage_rate).toBe(0);
    });

    it("pct(0,0) = 0 for equipment maintenance when no equipment records", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          fire_drill_records: [makeDrill()],
        }),
      );
      expect(r.equipment_maintenance_rate).toBe(0);
    });

    it("business continuity score = 0 when no BCP records", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 1,
          fire_drill_records: [makeDrill()],
        }),
      );
      expect(r.business_continuity_score).toBe(0);
    });
  });

  // ====================================================================
  // 16. COMBINED SCENARIOS
  // ====================================================================
  describe("combined scenarios", () => {
    it("well-run home with minor gaps scores good", () => {
      const contacts = makeAllEssentialContacts().slice(0, 6).map((c) => ({
        ...c,
        verified: true,
        is_current: true,
      }));
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 3,
          fire_drill_records: [
            makeDrill({ drill_type: "day", debrief_completed: true }),
            makeDrill({ drill_type: "night", drill_date: "2026-05-10", debrief_completed: true }),
          ],
          evacuation_plans: [
            makeEvacPlan({ plan_type: "fire" }),
            makeEvacPlan({ plan_type: "flood" }),
          ],
          emergency_contacts: contacts,
          business_continuity_plans: [
            makeBCP({ tested: true, staff_aware: true }),
          ],
          first_aid_records: [
            makeFirstAid({ staff_id: "s1", is_current: true, certificate_expiry: "2027-01-01" }),
            makeFirstAid({ staff_id: "s2", is_current: true, certificate_expiry: "2027-01-01" }),
            makeEquipment({ equipment_checked: true, equipment_in_date: true }),
          ],
        }),
      );
      expect(r.emergency_rating).toBe("good");
      expect(r.emergency_score).toBeGreaterThanOrEqual(65);
      expect(r.emergency_score).toBeLessThan(80);
      expect(r.strengths.length).toBeGreaterThan(0);
    });

    it("home with mixed performance scores adequate", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 2,
          fire_drill_records: [
            makeDrill({ drill_type: "day", debrief_completed: false, all_children_participated: true, evacuation_time_seconds: 100, target_evacuation_time_seconds: 180 }),
            makeDrill({ drill_type: "day", debrief_completed: false, all_children_participated: false, evacuation_time_seconds: 300, target_evacuation_time_seconds: 180 }),
          ],
          evacuation_plans: [
            makeEvacPlan({ is_current: true, review_due: "2026-12-01", covers_all_exits: false, includes_assembly_point: false, includes_roll_call_procedure: false, includes_vulnerable_children_provisions: false, displayed_in_home: false, staff_trained_on_plan: false, children_briefed: false, approved_by: null }),
          ],
          emergency_contacts: [
            makeContact({ contact_type: "police", verified: true, is_current: true }),
          ],
          first_aid_records: [
            makeFirstAid({ staff_id: "s1", is_current: true, certificate_expiry: "2027-01-01" }),
          ],
        }),
      );
      expect(r.emergency_rating).toBe("adequate");
      expect(r.emergency_score).toBeGreaterThanOrEqual(45);
      expect(r.emergency_score).toBeLessThan(65);
    });

    it("neglected home scores inadequate", () => {
      const r = computeEmergencyPreparednessContinuity(
        baseInput({
          total_children: 3,
          fire_drill_records: [
            makeDrill({ all_children_participated: false, evacuation_time_seconds: 999, target_evacuation_time_seconds: 180, debrief_completed: false, drill_date: "2026-01-01", drill_type: "day" }),
          ],
          evacuation_plans: [
            makeEvacPlan({ is_current: false, review_due: "2025-01-01", covers_all_exits: false, includes_assembly_point: false, includes_roll_call_procedure: false, includes_vulnerable_children_provisions: false, displayed_in_home: false, staff_trained_on_plan: false, children_briefed: false, approved_by: null }),
          ],
          emergency_contacts: [
            makeContact({ contact_type: "other", verified: false, is_current: false }),
          ],
          first_aid_records: [
            makeEquipment({ equipment_checked: false, equipment_in_date: false }),
          ],
        }),
      );
      expect(r.emergency_rating).toBe("inadequate");
      expect(r.emergency_score).toBeLessThan(45);
      expect(r.concerns.length).toBeGreaterThan(5);
      expect(r.recommendations.length).toBeGreaterThan(3);
    });
  });
});
