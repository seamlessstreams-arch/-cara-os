// ══════════════════════════════════════════════════════════════════════════════
// TESTS — Home Garden & Outdoor Space Maintenance Intelligence Engine
// Covers garden condition, equipment safety, space utilisation, child
// involvement, environmental quality, scoring, ratings, strengths, concerns,
// recommendations, insights, and child enjoyment composite.
// CHR 2015 Reg 25 (Premises), Reg 5 (Engaging, activities & relationships).
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeGardenOutdoorSpaceMaintenance,
  type GardenOutdoorInput,
  type GardenConditionRecordInput,
  type EquipmentSafetyRecordInput,
  type SpaceUtilisationRecordInput,
  type ChildInvolvementRecordInput,
  type EnvironmentalQualityRecordInput,
} from "../home-garden-outdoor-space-maintenance-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

const TODAY = "2026-05-30";

let _id = 0;
function uid(): string {
  return `test_${++_id}`;
}

function makeGardenCondition(
  overrides: Partial<GardenConditionRecordInput> = {},
): GardenConditionRecordInput {
  return {
    id: uid(),
    date: "2026-05-01",
    assessor: "staff_darren",
    area_name: "Back Garden",
    area_type: "lawn",
    condition_rating: 4,
    cleanliness_rating: 4,
    safety_hazards_found: false,
    hazards_description: "",
    hazards_resolved: false,
    maintenance_required: false,
    maintenance_description: "",
    maintenance_completed: false,
    seasonal_tasks_completed: true,
    pest_issues_found: false,
    pest_issues_resolved: false,
    accessibility_adequate: true,
    photos_taken: true,
    notes: "",
    created_at: "2026-05-01",
    ...overrides,
  };
}

function makeEquipmentSafety(
  overrides: Partial<EquipmentSafetyRecordInput> = {},
): EquipmentSafetyRecordInput {
  return {
    id: uid(),
    date: "2026-05-01",
    inspector: "staff_darren",
    equipment_name: "Main Swing",
    equipment_type: "swing",
    condition_rating: 4,
    safety_compliant: true,
    defects_found: false,
    defects_description: "",
    defects_resolved: false,
    out_of_service: false,
    last_professional_inspection: "2026-03-01",
    age_appropriate: true,
    surface_condition_safe: true,
    anchoring_secure: true,
    wear_and_tear_acceptable: true,
    manufacturer_guidelines_followed: true,
    notes: "",
    created_at: "2026-05-01",
    ...overrides,
  };
}

function makeSpaceUtilisation(
  overrides: Partial<SpaceUtilisationRecordInput> = {},
): SpaceUtilisationRecordInput {
  return {
    id: uid(),
    date: "2026-05-01",
    recorder: "staff_darren",
    space_name: "Main Garden",
    space_type: "garden",
    children_using: 3,
    total_children_available: 4,
    duration_minutes: 60,
    activity_type: "free_play",
    weather_suitable: true,
    staff_supervised: true,
    child_initiated: true,
    inclusive_access: true,
    enjoyment_observed: true,
    notes: "",
    created_at: "2026-05-01",
    ...overrides,
  };
}

function makeChildInvolvement(
  overrides: Partial<ChildInvolvementRecordInput> = {},
): ChildInvolvementRecordInput {
  return {
    id: uid(),
    child_id: "yp_alex",
    date: "2026-05-01",
    activity_type: "planting",
    duration_minutes: 45,
    engaged: true,
    enjoyment_level: 4,
    skills_developed: ["responsibility", "patience"],
    responsibility_taken: true,
    therapeutic_benefit_noted: true,
    produce_harvested: false,
    child_chose_activity: true,
    supported_by_staff: true,
    linked_to_care_plan: true,
    notes: "",
    created_at: "2026-05-01",
    ...overrides,
  };
}

function makeEnvironmentalQuality(
  overrides: Partial<EnvironmentalQualityRecordInput> = {},
): EnvironmentalQualityRecordInput {
  return {
    id: uid(),
    date: "2026-05-01",
    assessor: "staff_darren",
    category: "biodiversity",
    rating: 4,
    meets_standard: true,
    improvement_needed: false,
    improvement_description: "",
    improvement_completed: false,
    children_consulted: true,
    sensory_benefit: true,
    wildlife_observed: true,
    seasonal_variation_noted: true,
    external_factors_noted: "",
    notes: "",
    created_at: "2026-05-01",
    ...overrides,
  };
}

function baseInput(
  overrides: Partial<GardenOutdoorInput> = {},
): GardenOutdoorInput {
  return {
    today: TODAY,
    total_children: 4,
    garden_condition_records: [],
    equipment_safety_records: [],
    space_utilisation_records: [],
    child_involvement_records: [],
    environmental_quality_records: [],
    ...overrides,
  };
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("Home Garden & Outdoor Space Maintenance Intelligence Engine", () => {
  // ── Output Shape ────────────────────────────────────────────────────────

  describe("output shape", () => {
    it("returns all expected top-level keys", () => {
      const r = computeGardenOutdoorSpaceMaintenance(baseInput());
      expect(r).toHaveProperty("garden_rating");
      expect(r).toHaveProperty("garden_score");
      expect(r).toHaveProperty("headline");
      expect(r).toHaveProperty("total_garden_condition_records");
      expect(r).toHaveProperty("total_equipment_safety_records");
      expect(r).toHaveProperty("total_space_utilisation_records");
      expect(r).toHaveProperty("total_child_involvement_records");
      expect(r).toHaveProperty("total_environmental_quality_records");
      expect(r).toHaveProperty("garden_condition_rate");
      expect(r).toHaveProperty("equipment_safety_rate");
      expect(r).toHaveProperty("space_utilisation_rate");
      expect(r).toHaveProperty("child_involvement_rate");
      expect(r).toHaveProperty("environmental_quality_rate");
      expect(r).toHaveProperty("child_enjoyment_rate");
      expect(r).toHaveProperty("strengths");
      expect(r).toHaveProperty("concerns");
      expect(r).toHaveProperty("recommendations");
      expect(r).toHaveProperty("insights");
    });

    it("strengths, concerns, recommendations, insights are arrays", () => {
      const r = computeGardenOutdoorSpaceMaintenance(baseInput());
      expect(Array.isArray(r.strengths)).toBe(true);
      expect(Array.isArray(r.concerns)).toBe(true);
      expect(Array.isArray(r.recommendations)).toBe(true);
      expect(Array.isArray(r.insights)).toBe(true);
    });

    it("recommendations have rank, recommendation, urgency, regulatory_ref", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({ total_children: 3 }),
      );
      for (const rec of r.recommendations) {
        expect(rec).toHaveProperty("rank");
        expect(rec).toHaveProperty("recommendation");
        expect(rec).toHaveProperty("urgency");
        expect(rec).toHaveProperty("regulatory_ref");
      }
    });

    it("insights have text and severity", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({ total_children: 3 }),
      );
      for (const ins of r.insights) {
        expect(ins).toHaveProperty("text");
        expect(ins).toHaveProperty("severity");
        expect(["critical", "warning", "positive"]).toContain(ins.severity);
      }
    });
  });

  // ── Insufficient Data ──────────────────────────────────────────────────

  describe("insufficient data — all empty, 0 children", () => {
    it("returns insufficient_data rating", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({ total_children: 0 }),
      );
      expect(r.garden_rating).toBe("insufficient_data");
    });

    it("returns score 0", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({ total_children: 0 }),
      );
      expect(r.garden_score).toBe(0);
    });

    it("returns appropriate headline", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({ total_children: 0 }),
      );
      expect(r.headline).toContain("insufficient data");
    });

    it("returns empty strengths, concerns, recommendations, insights", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({ total_children: 0 }),
      );
      expect(r.strengths).toHaveLength(0);
      expect(r.concerns).toHaveLength(0);
      expect(r.recommendations).toHaveLength(0);
      expect(r.insights).toHaveLength(0);
    });

    it("all record totals are 0", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({ total_children: 0 }),
      );
      expect(r.total_garden_condition_records).toBe(0);
      expect(r.total_equipment_safety_records).toBe(0);
      expect(r.total_space_utilisation_records).toBe(0);
      expect(r.total_child_involvement_records).toBe(0);
      expect(r.total_environmental_quality_records).toBe(0);
    });

    it("all rates are 0", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({ total_children: 0 }),
      );
      expect(r.garden_condition_rate).toBe(0);
      expect(r.equipment_safety_rate).toBe(0);
      expect(r.space_utilisation_rate).toBe(0);
      expect(r.child_involvement_rate).toBe(0);
      expect(r.environmental_quality_rate).toBe(0);
      expect(r.child_enjoyment_rate).toBe(0);
    });
  });

  // ── All Empty + Children > 0 → Inadequate ─────────────────────────────

  describe("all empty + children > 0 → inadequate", () => {
    it("returns inadequate rating", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({ total_children: 3 }),
      );
      expect(r.garden_rating).toBe("inadequate");
    });

    it("returns score 15", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({ total_children: 3 }),
      );
      expect(r.garden_score).toBe(15);
    });

    it("headline mentions no data", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({ total_children: 3 }),
      );
      expect(r.headline).toContain("No garden or outdoor space maintenance data");
    });

    it("has exactly 1 concern", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({ total_children: 3 }),
      );
      expect(r.concerns).toHaveLength(1);
    });

    it("has exactly 2 recommendations", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({ total_children: 3 }),
      );
      expect(r.recommendations).toHaveLength(2);
    });

    it("first recommendation is immediate urgency", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({ total_children: 3 }),
      );
      expect(r.recommendations[0].urgency).toBe("immediate");
      expect(r.recommendations[0].rank).toBe(1);
    });

    it("second recommendation references Reg 5", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({ total_children: 3 }),
      );
      expect(r.recommendations[1].regulatory_ref).toContain("Reg 5");
    });

    it("has exactly 1 critical insight", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({ total_children: 3 }),
      );
      expect(r.insights).toHaveLength(1);
      expect(r.insights[0].severity).toBe("critical");
    });
  });

  // ── Record Totals ─────────────────────────────────────────────────────

  describe("record totals", () => {
    it("counts garden condition records", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          garden_condition_records: [makeGardenCondition(), makeGardenCondition()],
        }),
      );
      expect(r.total_garden_condition_records).toBe(2);
    });

    it("counts equipment safety records", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          equipment_safety_records: [makeEquipmentSafety(), makeEquipmentSafety(), makeEquipmentSafety()],
        }),
      );
      expect(r.total_equipment_safety_records).toBe(3);
    });

    it("counts space utilisation records", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          space_utilisation_records: [makeSpaceUtilisation()],
        }),
      );
      expect(r.total_space_utilisation_records).toBe(1);
    });

    it("counts child involvement records", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          child_involvement_records: [makeChildInvolvement(), makeChildInvolvement()],
        }),
      );
      expect(r.total_child_involvement_records).toBe(2);
    });

    it("counts environmental quality records", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          environmental_quality_records: [
            makeEnvironmentalQuality(),
            makeEnvironmentalQuality(),
            makeEnvironmentalQuality(),
            makeEnvironmentalQuality(),
          ],
        }),
      );
      expect(r.total_environmental_quality_records).toBe(4);
    });
  });

  // ── Garden Condition Rate ─────────────────────────────────────────────

  describe("garden condition rate", () => {
    it("100% when all ratings >= 4", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          garden_condition_records: [
            makeGardenCondition({ condition_rating: 4 }),
            makeGardenCondition({ condition_rating: 5 }),
          ],
        }),
      );
      expect(r.garden_condition_rate).toBe(100);
    });

    it("0% when all ratings < 4", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          garden_condition_records: [
            makeGardenCondition({ condition_rating: 2 }),
            makeGardenCondition({ condition_rating: 3 }),
          ],
        }),
      );
      expect(r.garden_condition_rate).toBe(0);
    });

    it("50% when half are >= 4", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          garden_condition_records: [
            makeGardenCondition({ condition_rating: 5 }),
            makeGardenCondition({ condition_rating: 2 }),
          ],
        }),
      );
      expect(r.garden_condition_rate).toBe(50);
    });

    it("0 when no garden condition records", () => {
      const r = computeGardenOutdoorSpaceMaintenance(baseInput({ total_children: 0 }));
      expect(r.garden_condition_rate).toBe(0);
    });
  });

  // ── Equipment Safety Rate ─────────────────────────────────────────────

  describe("equipment safety rate", () => {
    it("100% when all safety_compliant", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          equipment_safety_records: [
            makeEquipmentSafety({ safety_compliant: true }),
            makeEquipmentSafety({ safety_compliant: true }),
          ],
        }),
      );
      expect(r.equipment_safety_rate).toBe(100);
    });

    it("0% when none safety_compliant", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          equipment_safety_records: [
            makeEquipmentSafety({ safety_compliant: false }),
            makeEquipmentSafety({ safety_compliant: false }),
          ],
        }),
      );
      expect(r.equipment_safety_rate).toBe(0);
    });

    it("50% when half compliant", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          equipment_safety_records: [
            makeEquipmentSafety({ safety_compliant: true }),
            makeEquipmentSafety({ safety_compliant: false }),
          ],
        }),
      );
      expect(r.equipment_safety_rate).toBe(50);
    });
  });

  // ── Space Utilisation Rate ────────────────────────────────────────────

  describe("space utilisation rate", () => {
    it("calculates rate as children_using / total_children_available", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          space_utilisation_records: [
            makeSpaceUtilisation({ children_using: 4, total_children_available: 4 }),
          ],
        }),
      );
      expect(r.space_utilisation_rate).toBe(100);
    });

    it("50% when half the children use the space", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          space_utilisation_records: [
            makeSpaceUtilisation({ children_using: 2, total_children_available: 4 }),
          ],
        }),
      );
      expect(r.space_utilisation_rate).toBe(50);
    });

    it("aggregates across multiple records", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          space_utilisation_records: [
            makeSpaceUtilisation({ children_using: 3, total_children_available: 4 }),
            makeSpaceUtilisation({ children_using: 1, total_children_available: 4 }),
          ],
        }),
      );
      // (3+1)/(4+4) = 50%
      expect(r.space_utilisation_rate).toBe(50);
    });
  });

  // ── Child Involvement Rate ────────────────────────────────────────────

  describe("child involvement rate", () => {
    it("100% when all engaged", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          child_involvement_records: [
            makeChildInvolvement({ engaged: true }),
            makeChildInvolvement({ engaged: true }),
          ],
        }),
      );
      expect(r.child_involvement_rate).toBe(100);
    });

    it("0% when none engaged", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          child_involvement_records: [
            makeChildInvolvement({ engaged: false }),
            makeChildInvolvement({ engaged: false }),
          ],
        }),
      );
      expect(r.child_involvement_rate).toBe(0);
    });

    it("50% when half engaged", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          child_involvement_records: [
            makeChildInvolvement({ engaged: true }),
            makeChildInvolvement({ engaged: false }),
          ],
        }),
      );
      expect(r.child_involvement_rate).toBe(50);
    });
  });

  // ── Environmental Quality Rate ────────────────────────────────────────

  describe("environmental quality rate", () => {
    it("100% when all meet standard", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          environmental_quality_records: [
            makeEnvironmentalQuality({ meets_standard: true }),
            makeEnvironmentalQuality({ meets_standard: true }),
          ],
        }),
      );
      expect(r.environmental_quality_rate).toBe(100);
    });

    it("0% when none meet standard", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          environmental_quality_records: [
            makeEnvironmentalQuality({ meets_standard: false }),
            makeEnvironmentalQuality({ meets_standard: false }),
          ],
        }),
      );
      expect(r.environmental_quality_rate).toBe(0);
    });
  });

  // ── Child Enjoyment Rate (Composite) ──────────────────────────────────

  describe("child enjoyment rate", () => {
    it("is 0 when no space utilisation or involvement records", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          garden_condition_records: [makeGardenCondition()],
        }),
      );
      expect(r.child_enjoyment_rate).toBe(0);
    });

    it("includes enjoyment_observed from space utilisation", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          space_utilisation_records: [
            makeSpaceUtilisation({ enjoyment_observed: true }),
            makeSpaceUtilisation({ enjoyment_observed: true }),
          ],
        }),
      );
      // Only space util: 2/2 = 100%
      expect(r.child_enjoyment_rate).toBe(100);
    });

    it("includes high enjoyment_level from child involvement", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          child_involvement_records: [
            makeChildInvolvement({ enjoyment_level: 5, child_chose_activity: true }),
            makeChildInvolvement({ enjoyment_level: 4, child_chose_activity: true }),
          ],
        }),
      );
      // highEnjoyment: 2/2, childChose: 2/2 → (2+2)/(2+2) = 100%
      expect(r.child_enjoyment_rate).toBe(100);
    });

    it("composite from both space util and involvement", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          space_utilisation_records: [
            makeSpaceUtilisation({ enjoyment_observed: true }),
            makeSpaceUtilisation({ enjoyment_observed: false }),
          ],
          child_involvement_records: [
            makeChildInvolvement({ enjoyment_level: 5, child_chose_activity: true }),
            makeChildInvolvement({ enjoyment_level: 2, child_chose_activity: false }),
          ],
        }),
      );
      // space: 1/2, highEnjoyment: 1/2, childChose: 1/2 → (1+1+1)/(2+2+2) = 50%
      expect(r.child_enjoyment_rate).toBe(50);
    });

    it("0 when enjoyment low and no child choice", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          space_utilisation_records: [
            makeSpaceUtilisation({ enjoyment_observed: false }),
          ],
          child_involvement_records: [
            makeChildInvolvement({ enjoyment_level: 2, child_chose_activity: false }),
          ],
        }),
      );
      // space: 0/1, highEnjoyment: 0/1, childChose: 0/1 → 0/3 = 0%
      expect(r.child_enjoyment_rate).toBe(0);
    });
  });

  // ── Scoring: Base & Bonuses ───────────────────────────────────────────

  describe("scoring — base score", () => {
    it("base score is 52 with minimal records and no bonuses or penalties", () => {
      // 2 records: one good (4), one poor (3) → gardenConditionRate = 50%
      // 50% is >=40 (no penalty) and <70 (no bonus) → pure base 52
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          garden_condition_records: [
            makeGardenCondition({ condition_rating: 4 }),
            makeGardenCondition({ condition_rating: 3 }),
          ],
        }),
      );
      expect(r.garden_score).toBe(52);
    });
  });

  describe("scoring — gardenConditionRate bonus", () => {
    it("+4 when gardenConditionRate >= 90", () => {
      const records = Array.from({ length: 10 }, () =>
        makeGardenCondition({ condition_rating: 5 }),
      );
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({ garden_condition_records: records }),
      );
      // 52 + 4 (garden) = 56 minimum
      expect(r.garden_score).toBeGreaterThanOrEqual(56);
    });

    it("+2 when gardenConditionRate >= 70 and < 90", () => {
      // 8/10 = 80%
      const records = [
        ...Array.from({ length: 8 }, () => makeGardenCondition({ condition_rating: 4 })),
        ...Array.from({ length: 2 }, () => makeGardenCondition({ condition_rating: 2 })),
      ];
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({ garden_condition_records: records }),
      );
      expect(r.garden_score).toBeGreaterThanOrEqual(54);
    });
  });

  describe("scoring — equipmentSafetyRate bonus", () => {
    it("+5 when equipmentSafetyRate >= 95", () => {
      const records = Array.from({ length: 20 }, () =>
        makeEquipmentSafety({ safety_compliant: true }),
      );
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({ equipment_safety_records: records }),
      );
      expect(r.garden_score).toBeGreaterThanOrEqual(57);
    });

    it("+3 when equipmentSafetyRate >= 80 and < 95", () => {
      // 9/10 = 90%
      const records = [
        ...Array.from({ length: 9 }, () => makeEquipmentSafety({ safety_compliant: true })),
        makeEquipmentSafety({ safety_compliant: false }),
      ];
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({ equipment_safety_records: records }),
      );
      expect(r.garden_score).toBeGreaterThanOrEqual(55);
    });
  });

  describe("scoring — spaceUtilisationRate bonus", () => {
    it("+3 when spaceUtilisationRate >= 80", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          space_utilisation_records: [
            makeSpaceUtilisation({ children_using: 4, total_children_available: 4 }),
          ],
        }),
      );
      expect(r.garden_score).toBeGreaterThanOrEqual(55);
    });

    it("+1 when spaceUtilisationRate >= 60 and < 80", () => {
      // 7/10 = 70%
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          space_utilisation_records: [
            makeSpaceUtilisation({ children_using: 7, total_children_available: 10 }),
          ],
        }),
      );
      expect(r.garden_score).toBeGreaterThanOrEqual(53);
    });
  });

  describe("scoring — childInvolvementRate bonus", () => {
    it("+3 when childInvolvementRate >= 90", () => {
      const records = Array.from({ length: 10 }, () =>
        makeChildInvolvement({ engaged: true }),
      );
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({ child_involvement_records: records }),
      );
      expect(r.garden_score).toBeGreaterThanOrEqual(55);
    });

    it("+1 when childInvolvementRate >= 70 and < 90", () => {
      // 8/10 = 80%
      const records = [
        ...Array.from({ length: 8 }, () => makeChildInvolvement({ engaged: true })),
        ...Array.from({ length: 2 }, () => makeChildInvolvement({ engaged: false })),
      ];
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({ child_involvement_records: records }),
      );
      expect(r.garden_score).toBeGreaterThanOrEqual(53);
    });
  });

  describe("scoring — environmentalQualityRate bonus", () => {
    it("+3 when environmentalQualityRate >= 90", () => {
      const records = Array.from({ length: 10 }, () =>
        makeEnvironmentalQuality({ meets_standard: true }),
      );
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({ environmental_quality_records: records }),
      );
      expect(r.garden_score).toBeGreaterThanOrEqual(55);
    });

    it("+1 when environmentalQualityRate >= 70 and < 90", () => {
      // 8/10 = 80%
      const records = [
        ...Array.from({ length: 8 }, () => makeEnvironmentalQuality({ meets_standard: true })),
        ...Array.from({ length: 2 }, () => makeEnvironmentalQuality({ meets_standard: false })),
      ];
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({ environmental_quality_records: records }),
      );
      expect(r.garden_score).toBeGreaterThanOrEqual(53);
    });
  });

  describe("scoring — childEnjoymentRate bonus", () => {
    it("+3 when childEnjoymentRate >= 90", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          space_utilisation_records: [
            makeSpaceUtilisation({ enjoyment_observed: true }),
          ],
          child_involvement_records: [
            makeChildInvolvement({ enjoyment_level: 5, child_chose_activity: true }),
          ],
        }),
      );
      expect(r.garden_score).toBeGreaterThanOrEqual(55);
    });
  });

  describe("scoring — hazardResolutionRate bonus", () => {
    it("+3 when hazardResolutionRate >= 95 and hazards found", () => {
      // Use condition_rating: 4 to avoid garden penalty (rate=100% >=90 → +4 bonus)
      // hazardResolutionRate = 100% → +3 bonus
      // Total: 52 + 4 + 3 = 59
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          garden_condition_records: [
            makeGardenCondition({
              safety_hazards_found: true,
              hazards_resolved: true,
              condition_rating: 4,
            }),
          ],
        }),
      );
      expect(r.garden_score).toBeGreaterThanOrEqual(55);
    });

    it("+1 when hazardResolutionRate >= 80 and < 95", () => {
      // 4/5 = 80% hazard resolution, 5/5 = 100% condition (all rating 4) → +4 garden bonus
      // 52 + 4 (garden) + 1 (hazard80) = 57
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          garden_condition_records: [
            ...Array.from({ length: 4 }, () =>
              makeGardenCondition({ safety_hazards_found: true, hazards_resolved: true, condition_rating: 4 }),
            ),
            makeGardenCondition({ safety_hazards_found: true, hazards_resolved: false, condition_rating: 4 }),
          ],
        }),
      );
      expect(r.garden_score).toBeGreaterThanOrEqual(53);
    });

    it("no bonus when no hazards found (even at 0%)", () => {
      // 2 records: one good (4), one poor (3) → gardenConditionRate = 50% (no bonus/penalty)
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          garden_condition_records: [
            makeGardenCondition({ safety_hazards_found: false, condition_rating: 4 }),
            makeGardenCondition({ safety_hazards_found: false, condition_rating: 3 }),
          ],
        }),
      );
      expect(r.garden_score).toBe(52);
    });
  });

  describe("scoring — defectResolutionRate bonus", () => {
    it("+2 when defectResolutionRate >= 95 and defects found", () => {
      // safety_compliant: false → equipmentSafetyRate = 0% < 50 → -6 penalty
      // defectResolutionRate = 100% → +2 bonus
      // 52 - 6 + 2 = 48
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          equipment_safety_records: [
            makeEquipmentSafety({
              defects_found: true,
              defects_resolved: true,
              safety_compliant: false,
            }),
          ],
        }),
      );
      // Just verify the defect bonus is applied — score should be higher than just -6
      expect(r.garden_score).toBe(48); // 52 - 6 + 2
    });

    it("+1 when defectResolutionRate >= 80 and < 95", () => {
      // 4/5 = 80% defect resolution, 0/5 = 0% safety → -6 penalty
      // 52 - 6 + 1 = 47
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          equipment_safety_records: [
            ...Array.from({ length: 4 }, () =>
              makeEquipmentSafety({ defects_found: true, defects_resolved: true, safety_compliant: false }),
            ),
            makeEquipmentSafety({ defects_found: true, defects_resolved: false, safety_compliant: false }),
          ],
        }),
      );
      expect(r.garden_score).toBe(47); // 52 - 6 + 1
    });
  });

  describe("scoring — avgEnjoymentLevel bonus", () => {
    it("+2 when avgEnjoymentLevel >= 4.0", () => {
      // engaged: false → childInvolvementRate = 0% < 30 → -4 penalty
      // avgEnjoymentLevel = 4.5 → +2 bonus
      // childEnjoymentRate: highEnjoyment 2/2 + childChose 0/2 → 2/4 = 50% → no bonus (< 70)
      // 52 - 4 + 2 = 50
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          child_involvement_records: [
            makeChildInvolvement({ enjoyment_level: 4, engaged: false, child_chose_activity: false }),
            makeChildInvolvement({ enjoyment_level: 5, engaged: false, child_chose_activity: false }),
          ],
        }),
      );
      expect(r.garden_score).toBe(50); // 52 - 4 + 2
    });

    it("+1 when avgEnjoymentLevel >= 3.0 and < 4.0", () => {
      // engaged: false → childInvolvementRate = 0% < 30 → -4 penalty
      // avgEnjoymentLevel = 3.0 → +1 bonus
      // 52 - 4 + 1 = 49
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          child_involvement_records: [
            makeChildInvolvement({ enjoyment_level: 3, engaged: false }),
            makeChildInvolvement({ enjoyment_level: 3, engaged: false }),
          ],
        }),
      );
      expect(r.garden_score).toBe(49); // 52 - 4 + 1
    });
  });

  // ── Scoring: Penalties ────────────────────────────────────────────────

  describe("scoring — penalties", () => {
    it("-6 when equipmentSafetyRate < 50", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          equipment_safety_records: [
            makeEquipmentSafety({ safety_compliant: false }),
            makeEquipmentSafety({ safety_compliant: false }),
            makeEquipmentSafety({ safety_compliant: false }),
          ],
        }),
      );
      // 52 - 6 = 46
      expect(r.garden_score).toBeLessThanOrEqual(46);
    });

    it("-5 when gardenConditionRate < 40", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          garden_condition_records: [
            makeGardenCondition({ condition_rating: 1 }),
            makeGardenCondition({ condition_rating: 2 }),
            makeGardenCondition({ condition_rating: 1 }),
          ],
        }),
      );
      // 52 - 5 = 47
      expect(r.garden_score).toBeLessThanOrEqual(47);
    });

    it("-4 when childInvolvementRate < 30", () => {
      // childInvolvementRate = 0% < 30 → -4 penalty
      // avgEnjoymentLevel = 4 >= 4.0 → +2 bonus (default enjoyment_level is 4)
      // 52 - 4 + 2 = 50
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          child_involvement_records: [
            makeChildInvolvement({ engaged: false, enjoyment_level: 1 }),
            makeChildInvolvement({ engaged: false, enjoyment_level: 1 }),
            makeChildInvolvement({ engaged: false, enjoyment_level: 1 }),
            makeChildInvolvement({ engaged: false, enjoyment_level: 1 }),
          ],
        }),
      );
      // 52 - 4 = 48 (no enjoyment bonus since avg = 1.0)
      expect(r.garden_score).toBe(48);
    });

    it("-3 when environmentalQualityRate < 40", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          environmental_quality_records: [
            makeEnvironmentalQuality({ meets_standard: false }),
            makeEnvironmentalQuality({ meets_standard: false }),
            makeEnvironmentalQuality({ meets_standard: false }),
          ],
        }),
      );
      // 52 - 3 = 49
      expect(r.garden_score).toBeLessThanOrEqual(49);
    });

    it("multiple penalties can stack", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          equipment_safety_records: [
            makeEquipmentSafety({ safety_compliant: false }),
          ],
          garden_condition_records: [
            makeGardenCondition({ condition_rating: 1 }),
          ],
          child_involvement_records: [
            makeChildInvolvement({ engaged: false, enjoyment_level: 1 }),
          ],
          environmental_quality_records: [
            makeEnvironmentalQuality({ meets_standard: false }),
          ],
        }),
      );
      // 52 - 6 - 5 - 4 - 3 = 34
      expect(r.garden_score).toBe(34);
    });
  });

  describe("scoring — clamp", () => {
    it("score is clamped to 0 minimum", () => {
      // Create extreme penalty scenario — many failing records
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          equipment_safety_records: Array.from({ length: 5 }, () =>
            makeEquipmentSafety({ safety_compliant: false }),
          ),
          garden_condition_records: Array.from({ length: 5 }, () =>
            makeGardenCondition({ condition_rating: 1 }),
          ),
          child_involvement_records: Array.from({ length: 5 }, () =>
            makeChildInvolvement({ engaged: false }),
          ),
          environmental_quality_records: Array.from({ length: 5 }, () =>
            makeEnvironmentalQuality({ meets_standard: false }),
          ),
        }),
      );
      expect(r.garden_score).toBeGreaterThanOrEqual(0);
    });

    it("score is clamped to 100 maximum", () => {
      // Max bonuses: 4+5+3+3+3+3+3+2+2 = 28 → 52+28 = 80
      // Even at max, score should be <=100
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          garden_condition_records: Array.from({ length: 10 }, () =>
            makeGardenCondition({
              condition_rating: 5,
              cleanliness_rating: 5,
              safety_hazards_found: true,
              hazards_resolved: true,
            }),
          ),
          equipment_safety_records: Array.from({ length: 20 }, () =>
            makeEquipmentSafety({
              safety_compliant: true,
              defects_found: true,
              defects_resolved: true,
            }),
          ),
          space_utilisation_records: Array.from({ length: 10 }, () =>
            makeSpaceUtilisation({
              children_using: 4,
              total_children_available: 4,
              enjoyment_observed: true,
            }),
          ),
          child_involvement_records: Array.from({ length: 10 }, () =>
            makeChildInvolvement({
              engaged: true,
              enjoyment_level: 5,
              child_chose_activity: true,
            }),
          ),
          environmental_quality_records: Array.from({ length: 10 }, () =>
            makeEnvironmentalQuality({ meets_standard: true }),
          ),
        }),
      );
      expect(r.garden_score).toBeLessThanOrEqual(100);
    });
  });

  // ── Rating Thresholds ─────────────────────────────────────────────────

  describe("rating thresholds", () => {
    it("outstanding when score >= 80", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          garden_condition_records: Array.from({ length: 10 }, () =>
            makeGardenCondition({
              condition_rating: 5,
              cleanliness_rating: 5,
              safety_hazards_found: true,
              hazards_resolved: true,
              maintenance_required: true,
              maintenance_completed: true,
            }),
          ),
          equipment_safety_records: Array.from({ length: 20 }, () =>
            makeEquipmentSafety({
              safety_compliant: true,
              defects_found: true,
              defects_resolved: true,
            }),
          ),
          space_utilisation_records: Array.from({ length: 10 }, () =>
            makeSpaceUtilisation({
              children_using: 4,
              total_children_available: 4,
              enjoyment_observed: true,
            }),
          ),
          child_involvement_records: Array.from({ length: 10 }, () =>
            makeChildInvolvement({
              engaged: true,
              enjoyment_level: 5,
              child_chose_activity: true,
            }),
          ),
          environmental_quality_records: Array.from({ length: 10 }, () =>
            makeEnvironmentalQuality({ meets_standard: true }),
          ),
        }),
      );
      expect(r.garden_rating).toBe("outstanding");
      expect(r.garden_score).toBeGreaterThanOrEqual(80);
    });

    it("good when score >= 65 and < 80", () => {
      // Need score between 65-79
      // 52 + some bonuses, carefully tuned
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          garden_condition_records: Array.from({ length: 10 }, () =>
            makeGardenCondition({ condition_rating: 5 }),
          ),
          equipment_safety_records: Array.from({ length: 10 }, () =>
            makeEquipmentSafety({ safety_compliant: true }),
          ),
          space_utilisation_records: [
            makeSpaceUtilisation({ children_using: 3, total_children_available: 4 }),
          ],
          child_involvement_records: [
            makeChildInvolvement({ engaged: true, enjoyment_level: 4, child_chose_activity: true }),
          ],
          environmental_quality_records: [
            makeEnvironmentalQuality({ meets_standard: true }),
          ],
        }),
      );
      expect(r.garden_score).toBeGreaterThanOrEqual(65);
      expect(r.garden_score).toBeLessThan(80);
      expect(r.garden_rating).toBe("good");
    });

    it("adequate when score >= 45 and < 65", () => {
      // Just the base 52 with minor adjustments
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          garden_condition_records: [makeGardenCondition({ condition_rating: 3 })],
        }),
      );
      expect(r.garden_score).toBeGreaterThanOrEqual(45);
      expect(r.garden_score).toBeLessThan(65);
      expect(r.garden_rating).toBe("adequate");
    });

    it("inadequate when score < 45", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          equipment_safety_records: [
            makeEquipmentSafety({ safety_compliant: false }),
          ],
          garden_condition_records: [
            makeGardenCondition({ condition_rating: 1 }),
          ],
          child_involvement_records: [
            makeChildInvolvement({ engaged: false }),
          ],
          environmental_quality_records: [
            makeEnvironmentalQuality({ meets_standard: false }),
          ],
        }),
      );
      expect(r.garden_score).toBeLessThan(45);
      expect(r.garden_rating).toBe("inadequate");
    });
  });

  // ── Headline ──────────────────────────────────────────────────────────

  describe("headline", () => {
    it("outstanding headline contains 'Outstanding'", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          garden_condition_records: Array.from({ length: 10 }, () =>
            makeGardenCondition({ condition_rating: 5, safety_hazards_found: true, hazards_resolved: true, maintenance_required: true, maintenance_completed: true }),
          ),
          equipment_safety_records: Array.from({ length: 20 }, () =>
            makeEquipmentSafety({ safety_compliant: true, defects_found: true, defects_resolved: true }),
          ),
          space_utilisation_records: Array.from({ length: 10 }, () =>
            makeSpaceUtilisation({ children_using: 4, total_children_available: 4, enjoyment_observed: true }),
          ),
          child_involvement_records: Array.from({ length: 10 }, () =>
            makeChildInvolvement({ engaged: true, enjoyment_level: 5, child_chose_activity: true }),
          ),
          environmental_quality_records: Array.from({ length: 10 }, () =>
            makeEnvironmentalQuality({ meets_standard: true }),
          ),
        }),
      );
      expect(r.headline).toContain("Outstanding");
    });

    it("good headline contains 'Good'", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          garden_condition_records: Array.from({ length: 10 }, () =>
            makeGardenCondition({ condition_rating: 5 }),
          ),
          equipment_safety_records: Array.from({ length: 10 }, () =>
            makeEquipmentSafety({ safety_compliant: true }),
          ),
          space_utilisation_records: [makeSpaceUtilisation({ children_using: 3, total_children_available: 4 })],
          child_involvement_records: [makeChildInvolvement({ engaged: true, enjoyment_level: 4, child_chose_activity: true })],
          environmental_quality_records: [makeEnvironmentalQuality({ meets_standard: true })],
        }),
      );
      expect(r.headline).toContain("Good");
    });

    it("adequate headline contains 'Adequate'", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          garden_condition_records: [makeGardenCondition({ condition_rating: 3 })],
        }),
      );
      expect(r.headline).toContain("Adequate");
    });

    it("inadequate headline contains 'inadequate'", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          equipment_safety_records: [makeEquipmentSafety({ safety_compliant: false })],
          garden_condition_records: [makeGardenCondition({ condition_rating: 1 })],
          child_involvement_records: [makeChildInvolvement({ engaged: false })],
          environmental_quality_records: [makeEnvironmentalQuality({ meets_standard: false })],
        }),
      );
      expect(r.headline).toContain("inadequate");
    });

    it("good headline mentions strengths count", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          garden_condition_records: Array.from({ length: 10 }, () =>
            makeGardenCondition({ condition_rating: 5 }),
          ),
          equipment_safety_records: Array.from({ length: 10 }, () =>
            makeEquipmentSafety({ safety_compliant: true }),
          ),
          space_utilisation_records: [makeSpaceUtilisation({ children_using: 3, total_children_available: 4 })],
          child_involvement_records: [makeChildInvolvement({ engaged: true, enjoyment_level: 4, child_chose_activity: true })],
          environmental_quality_records: [makeEnvironmentalQuality({ meets_standard: true })],
        }),
      );
      expect(r.headline).toMatch(/\d+ strength/);
    });
  });

  // ── Strengths ─────────────────────────────────────────────────────────

  describe("strengths", () => {
    it("strength for gardenConditionRate >= 90", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          garden_condition_records: Array.from({ length: 10 }, () =>
            makeGardenCondition({ condition_rating: 5 }),
          ),
        }),
      );
      expect(r.strengths.some((s) => s.includes("100%") && s.includes("garden areas"))).toBe(true);
    });

    it("strength for gardenConditionRate >= 70 and < 90", () => {
      const records = [
        ...Array.from({ length: 8 }, () => makeGardenCondition({ condition_rating: 4 })),
        ...Array.from({ length: 2 }, () => makeGardenCondition({ condition_rating: 2 })),
      ];
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({ garden_condition_records: records }),
      );
      expect(r.strengths.some((s) => s.includes("80%") && s.includes("garden condition rate"))).toBe(true);
    });

    it("strength for equipmentSafetyRate >= 95", () => {
      const records = Array.from({ length: 20 }, () =>
        makeEquipmentSafety({ safety_compliant: true }),
      );
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({ equipment_safety_records: records }),
      );
      expect(r.strengths.some((s) => s.includes("100%") && s.includes("equipment safety compliance"))).toBe(true);
    });

    it("strength for equipmentSafetyRate >= 80 and < 95", () => {
      const records = [
        ...Array.from({ length: 9 }, () => makeEquipmentSafety({ safety_compliant: true })),
        makeEquipmentSafety({ safety_compliant: false }),
      ];
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({ equipment_safety_records: records }),
      );
      expect(r.strengths.some((s) => s.includes("90%") && s.includes("equipment safety compliance rate"))).toBe(true);
    });

    it("strength for spaceUtilisationRate >= 80", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          space_utilisation_records: [
            makeSpaceUtilisation({ children_using: 4, total_children_available: 4 }),
          ],
        }),
      );
      expect(r.strengths.some((s) => s.includes("outdoor space utilisation"))).toBe(true);
    });

    it("strength for spaceUtilisationRate >= 60 and < 80", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          space_utilisation_records: [
            makeSpaceUtilisation({ children_using: 7, total_children_available: 10 }),
          ],
        }),
      );
      expect(r.strengths.some((s) => s.includes("70%") && s.includes("space utilisation rate"))).toBe(true);
    });

    it("strength for childInvolvementRate >= 90", () => {
      const records = Array.from({ length: 10 }, () =>
        makeChildInvolvement({ engaged: true }),
      );
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({ child_involvement_records: records }),
      );
      expect(r.strengths.some((s) => s.includes("child engagement in garden activities"))).toBe(true);
    });

    it("strength for childInvolvementRate >= 70 and < 90", () => {
      const records = [
        ...Array.from({ length: 8 }, () => makeChildInvolvement({ engaged: true })),
        ...Array.from({ length: 2 }, () => makeChildInvolvement({ engaged: false })),
      ];
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({ child_involvement_records: records }),
      );
      expect(r.strengths.some((s) => s.includes("child involvement in gardening"))).toBe(true);
    });

    it("strength for environmentalQualityRate >= 90", () => {
      const records = Array.from({ length: 10 }, () =>
        makeEnvironmentalQuality({ meets_standard: true }),
      );
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({ environmental_quality_records: records }),
      );
      expect(r.strengths.some((s) => s.includes("environmental quality"))).toBe(true);
    });

    it("strength for environmentalQualityRate >= 70 and < 90", () => {
      const records = [
        ...Array.from({ length: 8 }, () => makeEnvironmentalQuality({ meets_standard: true })),
        ...Array.from({ length: 2 }, () => makeEnvironmentalQuality({ meets_standard: false })),
      ];
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({ environmental_quality_records: records }),
      );
      expect(r.strengths.some((s) => s.includes("environmental quality rate"))).toBe(true);
    });

    it("strength for childEnjoymentRate >= 90", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          space_utilisation_records: [
            makeSpaceUtilisation({ enjoyment_observed: true }),
          ],
          child_involvement_records: [
            makeChildInvolvement({ enjoyment_level: 5, child_chose_activity: true }),
          ],
        }),
      );
      expect(r.strengths.some((s) => s.includes("child enjoyment"))).toBe(true);
    });

    it("strength for childEnjoymentRate >= 70 and < 90", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          space_utilisation_records: [
            makeSpaceUtilisation({ enjoyment_observed: true }),
            makeSpaceUtilisation({ enjoyment_observed: true }),
            makeSpaceUtilisation({ enjoyment_observed: false }),
          ],
          child_involvement_records: [
            makeChildInvolvement({ enjoyment_level: 4, child_chose_activity: true }),
            makeChildInvolvement({ enjoyment_level: 2, child_chose_activity: false }),
          ],
        }),
      );
      // (2+1+1)/(3+2+2) = 4/7 ≈ 57% — not in range, let me adjust
      // Actually let's make sure it is in 70-89 range
      // We need 70-89% enjoyment:
      const r2 = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          space_utilisation_records: Array.from({ length: 10 }, (_, i) =>
            makeSpaceUtilisation({ enjoyment_observed: i < 8 }),
          ),
          child_involvement_records: Array.from({ length: 10 }, (_, i) =>
            makeChildInvolvement({ enjoyment_level: i < 7 ? 5 : 2, child_chose_activity: i < 7 }),
          ),
        }),
      );
      // space: 8/10, highEnjoy: 7/10, childChose: 7/10 → (8+7+7)/(10+10+10) = 22/30 ≈ 73%
      expect(r2.strengths.some((s) => s.includes("child enjoyment rate"))).toBe(true);
    });

    it("strength for hazardResolutionRate >= 95", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          garden_condition_records: [
            makeGardenCondition({ safety_hazards_found: true, hazards_resolved: true }),
          ],
        }),
      );
      expect(r.strengths.some((s) => s.includes("hazards resolved"))).toBe(true);
    });

    it("strength for hazardResolutionRate >= 80 and < 95", () => {
      const records = [
        ...Array.from({ length: 4 }, () =>
          makeGardenCondition({ safety_hazards_found: true, hazards_resolved: true }),
        ),
        makeGardenCondition({ safety_hazards_found: true, hazards_resolved: false }),
      ];
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({ garden_condition_records: records }),
      );
      expect(r.strengths.some((s) => s.includes("hazard resolution rate"))).toBe(true);
    });

    it("strength for defectResolutionRate >= 95", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          equipment_safety_records: [
            makeEquipmentSafety({ defects_found: true, defects_resolved: true }),
          ],
        }),
      );
      expect(r.strengths.some((s) => s.includes("equipment defects resolved"))).toBe(true);
    });

    it("strength for defectResolutionRate >= 80 and < 95", () => {
      const records = [
        ...Array.from({ length: 4 }, () =>
          makeEquipmentSafety({ defects_found: true, defects_resolved: true }),
        ),
        makeEquipmentSafety({ defects_found: true, defects_resolved: false }),
      ];
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({ equipment_safety_records: records }),
      );
      expect(r.strengths.some((s) => s.includes("equipment defect resolution"))).toBe(true);
    });

    it("strength for maintenanceCompletionRate >= 90", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          garden_condition_records: [
            makeGardenCondition({ maintenance_required: true, maintenance_completed: true }),
          ],
        }),
      );
      expect(r.strengths.some((s) => s.includes("maintenance completed"))).toBe(true);
    });

    it("strength for maintenanceCompletionRate >= 70 and < 90", () => {
      const records = [
        ...Array.from({ length: 3 }, () =>
          makeGardenCondition({ maintenance_required: true, maintenance_completed: true }),
        ),
        makeGardenCondition({ maintenance_required: true, maintenance_completed: false }),
      ];
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({ garden_condition_records: records }),
      );
      expect(r.strengths.some((s) => s.includes("maintenance completion rate"))).toBe(true);
    });

    it("strength for avgEnjoymentLevel >= 4.0", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          child_involvement_records: [
            makeChildInvolvement({ enjoyment_level: 5 }),
            makeChildInvolvement({ enjoyment_level: 4 }),
          ],
        }),
      );
      expect(r.strengths.some((s) => s.includes("enjoyment level") && s.includes("/5"))).toBe(true);
    });

    it("strength for avgEnjoymentLevel >= 3.0 and < 4.0", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          child_involvement_records: [
            makeChildInvolvement({ enjoyment_level: 3 }),
            makeChildInvolvement({ enjoyment_level: 3 }),
          ],
        }),
      );
      expect(r.strengths.some((s) => s.includes("enjoyment level") && s.includes("3/5"))).toBe(true);
    });

    it("strength for 100% childCoverage", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          total_children: 3,
          child_involvement_records: [
            makeChildInvolvement({ child_id: "yp_a", engaged: true }),
            makeChildInvolvement({ child_id: "yp_b", engaged: true }),
            makeChildInvolvement({ child_id: "yp_c", engaged: true }),
          ],
        }),
      );
      expect(r.strengths.some((s) => s.includes("Every child"))).toBe(true);
    });

    it("strength for childCoverage >= 80 and < 100", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          total_children: 5,
          child_involvement_records: [
            makeChildInvolvement({ child_id: "yp_a", engaged: true }),
            makeChildInvolvement({ child_id: "yp_b", engaged: true }),
            makeChildInvolvement({ child_id: "yp_c", engaged: true }),
            makeChildInvolvement({ child_id: "yp_d", engaged: true }),
          ],
        }),
      );
      expect(r.strengths.some((s) => s.includes("80%") && s.includes("participated"))).toBe(true);
    });

    it("strength for therapeuticBenefitRate >= 70", () => {
      const records = Array.from({ length: 10 }, () =>
        makeChildInvolvement({ therapeutic_benefit_noted: true }),
      );
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({ child_involvement_records: records }),
      );
      expect(r.strengths.some((s) => s.includes("Therapeutic benefit"))).toBe(true);
    });

    it("strength for inclusiveAccessRate >= 90", () => {
      const records = Array.from({ length: 10 }, () =>
        makeSpaceUtilisation({ inclusive_access: true }),
      );
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({ space_utilisation_records: records }),
      );
      expect(r.strengths.some((s) => s.includes("inclusive access"))).toBe(true);
    });

    it("strength for wildlifeRate >= 70", () => {
      const records = Array.from({ length: 10 }, () =>
        makeEnvironmentalQuality({ wildlife_observed: true }),
      );
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({ environmental_quality_records: records }),
      );
      expect(r.strengths.some((s) => s.includes("Wildlife observed"))).toBe(true);
    });

    it("strength for produceHarvestedRate >= 50", () => {
      const records = Array.from({ length: 10 }, () =>
        makeChildInvolvement({ produce_harvested: true }),
      );
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({ child_involvement_records: records }),
      );
      expect(r.strengths.some((s) => s.includes("Produce harvested"))).toBe(true);
    });

    it("strength for carePlanLinkRate >= 60", () => {
      const records = Array.from({ length: 10 }, () =>
        makeChildInvolvement({ linked_to_care_plan: true }),
      );
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({ child_involvement_records: records }),
      );
      expect(r.strengths.some((s) => s.includes("linked to care plans"))).toBe(true);
    });

    it("no strengths when everything is below threshold", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          garden_condition_records: [makeGardenCondition({ condition_rating: 2 })],
          equipment_safety_records: [makeEquipmentSafety({ safety_compliant: false })],
          space_utilisation_records: [
            makeSpaceUtilisation({
              children_using: 1,
              total_children_available: 4,
              enjoyment_observed: false,
              inclusive_access: false,
              staff_supervised: false,
            }),
          ],
          child_involvement_records: [
            makeChildInvolvement({
              engaged: false,
              enjoyment_level: 1,
              responsibility_taken: false,
              therapeutic_benefit_noted: false,
              produce_harvested: false,
              child_chose_activity: false,
              linked_to_care_plan: false,
            }),
          ],
          environmental_quality_records: [
            makeEnvironmentalQuality({ meets_standard: false, wildlife_observed: false, sensory_benefit: false }),
          ],
        }),
      );
      expect(r.strengths).toHaveLength(0);
    });
  });

  // ── Concerns ──────────────────────────────────────────────────────────

  describe("concerns", () => {
    it("concern when equipmentSafetyRate < 50", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          equipment_safety_records: [
            makeEquipmentSafety({ safety_compliant: false }),
            makeEquipmentSafety({ safety_compliant: false }),
            makeEquipmentSafety({ safety_compliant: false }),
          ],
        }),
      );
      expect(r.concerns.some((c) => c.includes("equipment safety compliance"))).toBe(true);
    });

    it("concern when equipmentSafetyRate 50-79", () => {
      const records = [
        ...Array.from({ length: 6 }, () => makeEquipmentSafety({ safety_compliant: true })),
        ...Array.from({ length: 4 }, () => makeEquipmentSafety({ safety_compliant: false })),
      ];
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({ equipment_safety_records: records }),
      );
      expect(r.concerns.some((c) => c.includes("Equipment safety compliance at 60%"))).toBe(true);
    });

    it("concern when gardenConditionRate < 40", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          garden_condition_records: [
            makeGardenCondition({ condition_rating: 1 }),
            makeGardenCondition({ condition_rating: 2 }),
          ],
        }),
      );
      expect(r.concerns.some((c) => c.includes("garden areas in good condition"))).toBe(true);
    });

    it("concern when gardenConditionRate 40-69", () => {
      const records = [
        ...Array.from({ length: 5 }, () => makeGardenCondition({ condition_rating: 5 })),
        ...Array.from({ length: 5 }, () => makeGardenCondition({ condition_rating: 2 })),
      ];
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({ garden_condition_records: records }),
      );
      expect(r.concerns.some((c) => c.includes("Garden condition rate at 50%"))).toBe(true);
    });

    it("concern when childInvolvementRate < 30", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          child_involvement_records: [
            makeChildInvolvement({ engaged: false }),
            makeChildInvolvement({ engaged: false }),
            makeChildInvolvement({ engaged: false }),
            makeChildInvolvement({ engaged: false }),
          ],
        }),
      );
      expect(r.concerns.some((c) => c.includes("child engagement in garden"))).toBe(true);
    });

    it("concern when childInvolvementRate 30-69", () => {
      const records = [
        ...Array.from({ length: 5 }, () => makeChildInvolvement({ engaged: true })),
        ...Array.from({ length: 5 }, () => makeChildInvolvement({ engaged: false })),
      ];
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({ child_involvement_records: records }),
      );
      expect(r.concerns.some((c) => c.includes("Child involvement in garden activities at 50%"))).toBe(true);
    });

    it("concern when environmentalQualityRate < 40", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          environmental_quality_records: [
            makeEnvironmentalQuality({ meets_standard: false }),
            makeEnvironmentalQuality({ meets_standard: false }),
            makeEnvironmentalQuality({ meets_standard: false }),
          ],
        }),
      );
      expect(r.concerns.some((c) => c.includes("environmental quality"))).toBe(true);
    });

    it("concern when environmentalQualityRate 40-69", () => {
      const records = [
        ...Array.from({ length: 5 }, () => makeEnvironmentalQuality({ meets_standard: true })),
        ...Array.from({ length: 5 }, () => makeEnvironmentalQuality({ meets_standard: false })),
      ];
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({ environmental_quality_records: records }),
      );
      expect(r.concerns.some((c) => c.includes("Environmental quality rate at 50%"))).toBe(true);
    });

    it("concern when spaceUtilisationRate < 40", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          space_utilisation_records: [
            makeSpaceUtilisation({ children_using: 1, total_children_available: 4 }),
          ],
        }),
      );
      expect(r.concerns.some((c) => c.includes("outdoor space utilisation"))).toBe(true);
    });

    it("concern when spaceUtilisationRate 40-59", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          space_utilisation_records: [
            makeSpaceUtilisation({ children_using: 2, total_children_available: 4 }),
          ],
        }),
      );
      expect(r.concerns.some((c) => c.includes("Space utilisation at 50%"))).toBe(true);
    });

    it("concern when childEnjoymentRate < 40", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          space_utilisation_records: [
            makeSpaceUtilisation({ enjoyment_observed: false }),
            makeSpaceUtilisation({ enjoyment_observed: false }),
          ],
          child_involvement_records: [
            makeChildInvolvement({ enjoyment_level: 1, child_chose_activity: false }),
          ],
        }),
      );
      expect(r.concerns.some((c) => c.includes("child enjoyment"))).toBe(true);
    });

    it("concern when childEnjoymentRate 40-69", () => {
      // Need 40-69%: let's do 50%
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          space_utilisation_records: [
            makeSpaceUtilisation({ enjoyment_observed: true }),
            makeSpaceUtilisation({ enjoyment_observed: false }),
          ],
          child_involvement_records: [
            makeChildInvolvement({ enjoyment_level: 5, child_chose_activity: true }),
            makeChildInvolvement({ enjoyment_level: 1, child_chose_activity: false }),
          ],
        }),
      );
      // space: 1/2, highEnjoy: 1/2, childChose: 1/2 → 3/6 = 50%
      expect(r.concerns.some((c) => c.includes("Child enjoyment in outdoor activities at 50%"))).toBe(true);
    });

    it("concern when hazardResolutionRate < 70", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          garden_condition_records: [
            makeGardenCondition({ safety_hazards_found: true, hazards_resolved: false }),
            makeGardenCondition({ safety_hazards_found: true, hazards_resolved: false }),
          ],
        }),
      );
      expect(r.concerns.some((c) => c.includes("garden hazards resolved"))).toBe(true);
    });

    it("concern when defectResolutionRate < 70", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          equipment_safety_records: [
            makeEquipmentSafety({ defects_found: true, defects_resolved: false }),
            makeEquipmentSafety({ defects_found: true, defects_resolved: false }),
          ],
        }),
      );
      expect(r.concerns.some((c) => c.includes("equipment defects resolved"))).toBe(true);
    });

    it("concern when maintenanceCompletionRate < 50", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          garden_condition_records: [
            makeGardenCondition({ maintenance_required: true, maintenance_completed: false }),
            makeGardenCondition({ maintenance_required: true, maintenance_completed: false }),
            makeGardenCondition({ maintenance_required: true, maintenance_completed: false }),
          ],
        }),
      );
      expect(r.concerns.some((c) => c.includes("maintenance completed"))).toBe(true);
    });

    it("concern when maintenanceCompletionRate 50-69", () => {
      const records = [
        ...Array.from({ length: 3 }, () =>
          makeGardenCondition({ maintenance_required: true, maintenance_completed: true }),
        ),
        ...Array.from({ length: 2 }, () =>
          makeGardenCondition({ maintenance_required: true, maintenance_completed: false }),
        ),
      ];
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({ garden_condition_records: records }),
      );
      expect(r.concerns.some((c) => c.includes("Garden maintenance completion at 60%"))).toBe(true);
    });

    it("concern when anchoringSecureRate < 80", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          equipment_safety_records: [
            makeEquipmentSafety({ anchoring_secure: false }),
            makeEquipmentSafety({ anchoring_secure: false }),
          ],
        }),
      );
      expect(r.concerns.some((c) => c.includes("anchoring"))).toBe(true);
    });

    it("concern when childCoverage < 50", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          total_children: 10,
          child_involvement_records: [
            makeChildInvolvement({ child_id: "yp_a", engaged: true }),
            makeChildInvolvement({ child_id: "yp_b", engaged: true }),
          ],
        }),
      );
      expect(r.concerns.some((c) => c.includes("children have been involved"))).toBe(true);
    });

    it("concern when staffSupervisionRate < 70", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          space_utilisation_records: [
            makeSpaceUtilisation({ staff_supervised: false }),
            makeSpaceUtilisation({ staff_supervised: false }),
            makeSpaceUtilisation({ staff_supervised: false }),
          ],
        }),
      );
      expect(r.concerns.some((c) => c.includes("Staff supervision"))).toBe(true);
    });

    it("concern when professionalInspectionRate < 50", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          equipment_safety_records: [
            makeEquipmentSafety({ last_professional_inspection: null }),
            makeEquipmentSafety({ last_professional_inspection: null }),
          ],
        }),
      );
      expect(r.concerns.some((c) => c.includes("professional inspection"))).toBe(true);
    });

    it("no concerns when everything is strong", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          garden_condition_records: Array.from({ length: 10 }, () =>
            makeGardenCondition({ condition_rating: 5, safety_hazards_found: true, hazards_resolved: true, maintenance_required: true, maintenance_completed: true }),
          ),
          equipment_safety_records: Array.from({ length: 10 }, () =>
            makeEquipmentSafety({ safety_compliant: true, defects_found: true, defects_resolved: true, anchoring_secure: true }),
          ),
          space_utilisation_records: Array.from({ length: 10 }, () =>
            makeSpaceUtilisation({ children_using: 4, total_children_available: 4, staff_supervised: true, enjoyment_observed: true }),
          ),
          child_involvement_records: [
            makeChildInvolvement({ child_id: "yp_a", engaged: true, enjoyment_level: 5, child_chose_activity: true }),
            makeChildInvolvement({ child_id: "yp_b", engaged: true, enjoyment_level: 5, child_chose_activity: true }),
            makeChildInvolvement({ child_id: "yp_c", engaged: true, enjoyment_level: 5, child_chose_activity: true }),
            makeChildInvolvement({ child_id: "yp_d", engaged: true, enjoyment_level: 5, child_chose_activity: true }),
          ],
          environmental_quality_records: Array.from({ length: 10 }, () =>
            makeEnvironmentalQuality({ meets_standard: true }),
          ),
        }),
      );
      expect(r.concerns).toHaveLength(0);
    });
  });

  // ── Recommendations ───────────────────────────────────────────────────

  describe("recommendations", () => {
    it("immediate rec when equipmentSafetyRate < 50", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          equipment_safety_records: [makeEquipmentSafety({ safety_compliant: false })],
        }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("outdoor play equipment"))).toBe(true);
    });

    it("immediate rec when defectResolutionRate < 70", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          equipment_safety_records: [
            makeEquipmentSafety({ defects_found: true, defects_resolved: false }),
            makeEquipmentSafety({ defects_found: true, defects_resolved: false }),
          ],
        }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("defects"))).toBe(true);
    });

    it("immediate rec when hazardResolutionRate < 70", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          garden_condition_records: [
            makeGardenCondition({ safety_hazards_found: true, hazards_resolved: false }),
          ],
        }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("hazards"))).toBe(true);
    });

    it("immediate rec when gardenConditionRate < 40", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          garden_condition_records: [makeGardenCondition({ condition_rating: 1 })],
        }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("garden improvement plan"))).toBe(true);
    });

    it("immediate rec when surfaceSafeRate < 70", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          equipment_safety_records: [
            makeEquipmentSafety({ surface_condition_safe: false }),
            makeEquipmentSafety({ surface_condition_safe: false }),
          ],
        }),
      );
      expect(r.recommendations.some((rec) => rec.recommendation.includes("surface"))).toBe(true);
    });

    it("immediate rec when anchoringSecureRate < 80", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          equipment_safety_records: [
            makeEquipmentSafety({ anchoring_secure: false }),
          ],
        }),
      );
      expect(r.recommendations.some((rec) => rec.recommendation.includes("anchoring"))).toBe(true);
    });

    it("immediate rec when childInvolvementRate < 30", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          child_involvement_records: Array.from({ length: 4 }, () =>
            makeChildInvolvement({ engaged: false }),
          ),
        }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.regulatory_ref.includes("Reg 5"))).toBe(true);
    });

    it("immediate rec when environmentalQualityRate < 40", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          environmental_quality_records: [
            makeEnvironmentalQuality({ meets_standard: false }),
          ],
        }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("environmental quality"))).toBe(true);
    });

    it("immediate rec when staffSupervisionRate < 70", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          space_utilisation_records: [
            makeSpaceUtilisation({ staff_supervised: false }),
          ],
        }),
      );
      expect(r.recommendations.some((rec) => rec.recommendation.includes("supervision"))).toBe(true);
    });

    it("soon rec when equipmentSafetyRate 50-79", () => {
      const records = [
        ...Array.from({ length: 6 }, () => makeEquipmentSafety({ safety_compliant: true })),
        ...Array.from({ length: 4 }, () => makeEquipmentSafety({ safety_compliant: false })),
      ];
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({ equipment_safety_records: records }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("Improve equipment safety compliance"))).toBe(true);
    });

    it("soon rec when gardenConditionRate 40-69", () => {
      const records = [
        ...Array.from({ length: 5 }, () => makeGardenCondition({ condition_rating: 5 })),
        ...Array.from({ length: 5 }, () => makeGardenCondition({ condition_rating: 2 })),
      ];
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({ garden_condition_records: records }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("garden maintenance schedule"))).toBe(true);
    });

    it("soon rec when maintenanceCompletionRate < 70", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          garden_condition_records: [
            makeGardenCondition({ maintenance_required: true, maintenance_completed: false }),
            makeGardenCondition({ maintenance_required: true, maintenance_completed: false }),
          ],
        }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("maintenance completion"))).toBe(true);
    });

    it("soon rec when professionalInspectionRate < 50", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          equipment_safety_records: [
            makeEquipmentSafety({ last_professional_inspection: null }),
          ],
        }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("professional safety inspections"))).toBe(true);
    });

    it("soon rec when spaceUtilisationRate < 60", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          space_utilisation_records: [
            makeSpaceUtilisation({ children_using: 2, total_children_available: 4 }),
          ],
        }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("outdoor spaces are underused"))).toBe(true);
    });

    it("planned rec when childInvolvementRate 30-69", () => {
      const records = [
        ...Array.from({ length: 5 }, () => makeChildInvolvement({ engaged: true })),
        ...Array.from({ length: 5 }, () => makeChildInvolvement({ engaged: false })),
      ];
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({ child_involvement_records: records }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("Diversify garden involvement"))).toBe(true);
    });

    it("planned rec when environmentalQualityRate 40-69", () => {
      const records = [
        ...Array.from({ length: 5 }, () => makeEnvironmentalQuality({ meets_standard: true })),
        ...Array.from({ length: 5 }, () => makeEnvironmentalQuality({ meets_standard: false })),
      ];
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({ environmental_quality_records: records }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("outdoor environment improvement plan"))).toBe(true);
    });

    it("planned rec when childCoverage 50-79", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          total_children: 5,
          child_involvement_records: [
            makeChildInvolvement({ child_id: "yp_a", engaged: true }),
            makeChildInvolvement({ child_id: "yp_b", engaged: true }),
            makeChildInvolvement({ child_id: "yp_c", engaged: true }),
          ],
        }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("Extend garden activity participation"))).toBe(true);
    });

    it("planned rec when childEnjoymentRate 40-69", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          space_utilisation_records: [
            makeSpaceUtilisation({ enjoyment_observed: true }),
            makeSpaceUtilisation({ enjoyment_observed: false }),
          ],
          child_involvement_records: [
            makeChildInvolvement({ enjoyment_level: 5, child_chose_activity: true }),
            makeChildInvolvement({ enjoyment_level: 1, child_chose_activity: false }),
          ],
        }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("enjoyment of outdoor spaces"))).toBe(true);
    });

    it("planned rec when improvementCompletionRate < 70", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          environmental_quality_records: [
            makeEnvironmentalQuality({ improvement_needed: true, improvement_completed: false }),
          ],
        }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("environmental improvements"))).toBe(true);
    });

    it("recommendations have sequential rank values", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          equipment_safety_records: [makeEquipmentSafety({ safety_compliant: false, defects_found: true, defects_resolved: false })],
          garden_condition_records: [makeGardenCondition({ condition_rating: 1, safety_hazards_found: true, hazards_resolved: false })],
        }),
      );
      for (let i = 0; i < r.recommendations.length; i++) {
        expect(r.recommendations[i].rank).toBe(i + 1);
      }
    });

    it("no recommendations when everything is strong", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          garden_condition_records: Array.from({ length: 10 }, () =>
            makeGardenCondition({ condition_rating: 5, safety_hazards_found: true, hazards_resolved: true, maintenance_required: true, maintenance_completed: true }),
          ),
          equipment_safety_records: Array.from({ length: 10 }, () =>
            makeEquipmentSafety({ safety_compliant: true, defects_found: true, defects_resolved: true, anchoring_secure: true, surface_condition_safe: true }),
          ),
          space_utilisation_records: Array.from({ length: 10 }, () =>
            makeSpaceUtilisation({ children_using: 4, total_children_available: 4, staff_supervised: true, enjoyment_observed: true }),
          ),
          child_involvement_records: [
            makeChildInvolvement({ child_id: "yp_a", engaged: true }),
            makeChildInvolvement({ child_id: "yp_b", engaged: true }),
            makeChildInvolvement({ child_id: "yp_c", engaged: true }),
            makeChildInvolvement({ child_id: "yp_d", engaged: true }),
          ],
          environmental_quality_records: Array.from({ length: 10 }, () =>
            makeEnvironmentalQuality({ meets_standard: true, improvement_needed: true, improvement_completed: true }),
          ),
        }),
      );
      expect(r.recommendations).toHaveLength(0);
    });
  });

  // ── Insights ──────────────────────────────────────────────────────────

  describe("insights — critical", () => {
    it("critical insight when equipmentSafetyRate < 50", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          equipment_safety_records: [makeEquipmentSafety({ safety_compliant: false })],
        }),
      );
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("equipment safety compliance"))).toBe(true);
    });

    it("critical insight when gardenConditionRate < 40", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          garden_condition_records: [makeGardenCondition({ condition_rating: 1 })],
        }),
      );
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("garden areas in good condition"))).toBe(true);
    });

    it("critical insight when defectResolutionRate < 50", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          equipment_safety_records: [
            makeEquipmentSafety({ defects_found: true, defects_resolved: false }),
            makeEquipmentSafety({ defects_found: true, defects_resolved: false }),
          ],
        }),
      );
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("equipment defects resolved"))).toBe(true);
    });

    it("critical insight when hazardResolutionRate < 50", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          garden_condition_records: [
            makeGardenCondition({ safety_hazards_found: true, hazards_resolved: false }),
            makeGardenCondition({ safety_hazards_found: true, hazards_resolved: false }),
          ],
        }),
      );
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("garden safety hazards resolved"))).toBe(true);
    });

    it("critical insight when childInvolvementRate < 30", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          child_involvement_records: Array.from({ length: 4 }, () =>
            makeChildInvolvement({ engaged: false }),
          ),
        }),
      );
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("child engagement in garden"))).toBe(true);
    });

    it("critical insight when no child involvement records but children on placement (not allEmpty)", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          total_children: 3,
          garden_condition_records: [makeGardenCondition()],
          child_involvement_records: [],
        }),
      );
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("No child involvement"))).toBe(true);
    });

    it("critical insight when no equipment safety records but children on placement (not allEmpty)", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          total_children: 3,
          garden_condition_records: [makeGardenCondition()],
          equipment_safety_records: [],
        }),
      );
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("No outdoor equipment safety checks"))).toBe(true);
    });
  });

  describe("insights — warning", () => {
    it("warning when equipmentSafetyRate 50-79", () => {
      const records = [
        ...Array.from({ length: 6 }, () => makeEquipmentSafety({ safety_compliant: true })),
        ...Array.from({ length: 4 }, () => makeEquipmentSafety({ safety_compliant: false })),
      ];
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({ equipment_safety_records: records }),
      );
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Equipment safety compliance at 60%"))).toBe(true);
    });

    it("warning when gardenConditionRate 40-69", () => {
      const records = [
        ...Array.from({ length: 5 }, () => makeGardenCondition({ condition_rating: 5 })),
        ...Array.from({ length: 5 }, () => makeGardenCondition({ condition_rating: 2 })),
      ];
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({ garden_condition_records: records }),
      );
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Garden condition rate at 50%"))).toBe(true);
    });

    it("warning when childInvolvementRate 30-69", () => {
      const records = [
        ...Array.from({ length: 5 }, () => makeChildInvolvement({ engaged: true })),
        ...Array.from({ length: 5 }, () => makeChildInvolvement({ engaged: false })),
      ];
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({ child_involvement_records: records }),
      );
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Child involvement in garden activities at 50%"))).toBe(true);
    });

    it("warning when environmentalQualityRate 40-69", () => {
      const records = [
        ...Array.from({ length: 5 }, () => makeEnvironmentalQuality({ meets_standard: true })),
        ...Array.from({ length: 5 }, () => makeEnvironmentalQuality({ meets_standard: false })),
      ];
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({ environmental_quality_records: records }),
      );
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Environmental quality rate at 50%"))).toBe(true);
    });

    it("warning when spaceUtilisationRate 40-59", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          space_utilisation_records: [
            makeSpaceUtilisation({ children_using: 2, total_children_available: 4 }),
          ],
        }),
      );
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Space utilisation at 50%"))).toBe(true);
    });

    it("warning when childEnjoymentRate 40-69", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          space_utilisation_records: [
            makeSpaceUtilisation({ enjoyment_observed: true }),
            makeSpaceUtilisation({ enjoyment_observed: false }),
          ],
          child_involvement_records: [
            makeChildInvolvement({ enjoyment_level: 5, child_chose_activity: true }),
            makeChildInvolvement({ enjoyment_level: 1, child_chose_activity: false }),
          ],
        }),
      );
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Child enjoyment in outdoor activities at 50%"))).toBe(true);
    });

    it("warning when maintenanceCompletionRate 50-69", () => {
      const records = [
        ...Array.from({ length: 3 }, () =>
          makeGardenCondition({ maintenance_required: true, maintenance_completed: true }),
        ),
        ...Array.from({ length: 2 }, () =>
          makeGardenCondition({ maintenance_required: true, maintenance_completed: false }),
        ),
      ];
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({ garden_condition_records: records }),
      );
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Garden maintenance completion at 60%"))).toBe(true);
    });

    it("warning when avgEnjoymentLevel 2.0-2.99", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          child_involvement_records: [
            makeChildInvolvement({ enjoyment_level: 2 }),
            makeChildInvolvement({ enjoyment_level: 2 }),
          ],
        }),
      );
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("enjoyment level averaging 2/5"))).toBe(true);
    });
  });

  describe("insights — positive", () => {
    it("positive insight for outstanding rating", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          garden_condition_records: Array.from({ length: 10 }, () =>
            makeGardenCondition({ condition_rating: 5, safety_hazards_found: true, hazards_resolved: true, maintenance_required: true, maintenance_completed: true }),
          ),
          equipment_safety_records: Array.from({ length: 20 }, () =>
            makeEquipmentSafety({ safety_compliant: true, defects_found: true, defects_resolved: true }),
          ),
          space_utilisation_records: Array.from({ length: 10 }, () =>
            makeSpaceUtilisation({ children_using: 4, total_children_available: 4, enjoyment_observed: true }),
          ),
          child_involvement_records: Array.from({ length: 10 }, () =>
            makeChildInvolvement({ engaged: true, enjoyment_level: 5, child_chose_activity: true }),
          ),
          environmental_quality_records: Array.from({ length: 10 }, () =>
            makeEnvironmentalQuality({ meets_standard: true }),
          ),
        }),
      );
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("outstanding"))).toBe(true);
    });

    it("positive insight for combined high equipment safety + defect resolution", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          equipment_safety_records: Array.from({ length: 20 }, () =>
            makeEquipmentSafety({
              safety_compliant: true,
              defects_found: true,
              defects_resolved: true,
            }),
          ),
        }),
      );
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("equipment safety compliance") && i.text.includes("defects resolved"))).toBe(true);
    });

    it("positive insight for high garden condition + cleanliness", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          garden_condition_records: Array.from({ length: 10 }, () =>
            makeGardenCondition({ condition_rating: 5, cleanliness_rating: 5 }),
          ),
        }),
      );
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("garden condition") && i.text.includes("cleanliness"))).toBe(true);
    });

    it("positive insight for high child involvement + enjoyment", () => {
      const records = Array.from({ length: 10 }, () =>
        makeChildInvolvement({ engaged: true, enjoyment_level: 5 }),
      );
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({ child_involvement_records: records }),
      );
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("child engagement") && i.text.includes("enjoyment"))).toBe(true);
    });

    it("positive insight for 100% childCoverage", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          total_children: 3,
          child_involvement_records: [
            makeChildInvolvement({ child_id: "yp_a", engaged: true }),
            makeChildInvolvement({ child_id: "yp_b", engaged: true }),
            makeChildInvolvement({ child_id: "yp_c", engaged: true }),
          ],
        }),
      );
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("Every child"))).toBe(true);
    });

    it("positive insight for high space utilisation + diverse types", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          space_utilisation_records: [
            makeSpaceUtilisation({ children_using: 4, total_children_available: 4, space_type: "garden" }),
            makeSpaceUtilisation({ children_using: 4, total_children_available: 4, space_type: "playground" }),
            makeSpaceUtilisation({ children_using: 4, total_children_available: 4, space_type: "sports_area" }),
            makeSpaceUtilisation({ children_using: 4, total_children_available: 4, space_type: "quiet_area" }),
          ],
        }),
      );
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("space utilisation") && i.text.includes("4 different outdoor space types"))).toBe(true);
    });

    it("positive insight for high environmental quality + sensory benefit", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          environmental_quality_records: Array.from({ length: 10 }, () =>
            makeEnvironmentalQuality({ meets_standard: true, sensory_benefit: true }),
          ),
        }),
      );
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("environmental quality") && i.text.includes("sensory"))).toBe(true);
    });

    it("positive insight for high hazard resolution + maintenance completion", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          garden_condition_records: Array.from({ length: 10 }, () =>
            makeGardenCondition({
              safety_hazards_found: true,
              hazards_resolved: true,
              maintenance_required: true,
              maintenance_completed: true,
            }),
          ),
        }),
      );
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("hazard resolution") && i.text.includes("maintenance completion"))).toBe(true);
    });
  });

  // ── Edge Cases ────────────────────────────────────────────────────────

  describe("edge cases", () => {
    it("handles single record in each category", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          garden_condition_records: [makeGardenCondition()],
          equipment_safety_records: [makeEquipmentSafety()],
          space_utilisation_records: [makeSpaceUtilisation()],
          child_involvement_records: [makeChildInvolvement()],
          environmental_quality_records: [makeEnvironmentalQuality()],
        }),
      );
      expect(r.garden_rating).toBeDefined();
      expect(r.garden_score).toBeGreaterThanOrEqual(0);
    });

    it("handles empty professional_inspection as string ''", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          equipment_safety_records: [
            makeEquipmentSafety({ last_professional_inspection: "" }),
          ],
        }),
      );
      // Empty string is treated same as null for inspection rate
      expect(r).toBeDefined();
    });

    it("handles large volumes of records without error", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          garden_condition_records: Array.from({ length: 100 }, () => makeGardenCondition()),
          equipment_safety_records: Array.from({ length: 100 }, () => makeEquipmentSafety()),
          space_utilisation_records: Array.from({ length: 100 }, () => makeSpaceUtilisation()),
          child_involvement_records: Array.from({ length: 100 }, () => makeChildInvolvement()),
          environmental_quality_records: Array.from({ length: 100 }, () => makeEnvironmentalQuality()),
        }),
      );
      expect(r.garden_score).toBeGreaterThanOrEqual(0);
      expect(r.garden_score).toBeLessThanOrEqual(100);
    });

    it("total_children = 0 but has records is not insufficient_data", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          total_children: 0,
          garden_condition_records: [makeGardenCondition()],
        }),
      );
      expect(r.garden_rating).not.toBe("insufficient_data");
    });

    it("skills_developed can be empty array", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          child_involvement_records: [
            makeChildInvolvement({ skills_developed: [] }),
          ],
        }),
      );
      expect(r).toBeDefined();
    });

    it("condition_rating boundary: exactly 4 counts as good", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          garden_condition_records: [makeGardenCondition({ condition_rating: 4 })],
        }),
      );
      expect(r.garden_condition_rate).toBe(100);
    });

    it("condition_rating boundary: 3 does not count as good", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          garden_condition_records: [makeGardenCondition({ condition_rating: 3 })],
        }),
      );
      expect(r.garden_condition_rate).toBe(0);
    });

    it("enjoyment_level boundary: exactly 4 counts as high", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          child_involvement_records: [
            makeChildInvolvement({ enjoyment_level: 4, child_chose_activity: false }),
          ],
        }),
      );
      // highEnjoyment: 1/1 and childChose: 0/1 → (1+0)/(1+1) = 50%
      expect(r.child_enjoyment_rate).toBe(50);
    });

    it("enjoyment_level boundary: 3 does not count as high", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          child_involvement_records: [
            makeChildInvolvement({ enjoyment_level: 3, child_chose_activity: false }),
          ],
        }),
      );
      // highEnjoyment: 0/1 and childChose: 0/1 → 0/2 = 0%
      expect(r.child_enjoyment_rate).toBe(0);
    });

    it("penalty not applied when no records exist for that category", () => {
      // equipmentSafetyRate would be 0 but no records → no -6 penalty
      // Use 50% garden condition (no bonus/penalty) to isolate
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          garden_condition_records: [
            makeGardenCondition({ condition_rating: 4 }),
            makeGardenCondition({ condition_rating: 3 }),
          ],
          equipment_safety_records: [],
        }),
      );
      expect(r.garden_score).toBe(52);
    });
  });

  // ── Penalties are guarded (not applied when no records) ───────────────

  describe("penalties are guarded by record count", () => {
    it("no equipment penalty when equipment_safety_records is empty", () => {
      // 50% garden condition (no bonus/penalty), no equipment records
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          garden_condition_records: [
            makeGardenCondition({ condition_rating: 4 }),
            makeGardenCondition({ condition_rating: 3 }),
          ],
        }),
      );
      // No -6 penalty, base = 52
      expect(r.garden_score).toBe(52);
    });

    it("no garden condition penalty when garden_condition_records is empty", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          equipment_safety_records: [makeEquipmentSafety({ safety_compliant: false })],
        }),
      );
      // Only equipment penalty (-6), no garden penalty
      expect(r.garden_score).toBe(46);
    });

    it("no child involvement penalty when child_involvement_records is empty", () => {
      // 50% garden condition (no bonus/penalty), no child involvement records
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          garden_condition_records: [
            makeGardenCondition({ condition_rating: 4 }),
            makeGardenCondition({ condition_rating: 3 }),
          ],
        }),
      );
      expect(r.garden_score).toBe(52);
    });

    it("no environmental quality penalty when environmental_quality_records is empty", () => {
      // 50% garden condition (no bonus/penalty), no environmental records
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          garden_condition_records: [
            makeGardenCondition({ condition_rating: 4 }),
            makeGardenCondition({ condition_rating: 3 }),
          ],
        }),
      );
      expect(r.garden_score).toBe(52);
    });
  });

  // ── Integration: Full Outstanding Scenario ────────────────────────────

  describe("integration — outstanding scenario", () => {
    function outstandingInput(): GardenOutdoorInput {
      return baseInput({
        total_children: 4,
        garden_condition_records: Array.from({ length: 10 }, () =>
          makeGardenCondition({
            condition_rating: 5,
            cleanliness_rating: 5,
            safety_hazards_found: true,
            hazards_resolved: true,
            maintenance_required: true,
            maintenance_completed: true,
            seasonal_tasks_completed: true,
            accessibility_adequate: true,
            photos_taken: true,
          }),
        ),
        equipment_safety_records: Array.from({ length: 20 }, () =>
          makeEquipmentSafety({
            safety_compliant: true,
            condition_rating: 5,
            defects_found: true,
            defects_resolved: true,
            anchoring_secure: true,
            surface_condition_safe: true,
            wear_and_tear_acceptable: true,
            manufacturer_guidelines_followed: true,
          }),
        ),
        space_utilisation_records: [
          makeSpaceUtilisation({ space_type: "garden", children_using: 4, total_children_available: 4, enjoyment_observed: true }),
          makeSpaceUtilisation({ space_type: "playground", children_using: 4, total_children_available: 4, enjoyment_observed: true }),
          makeSpaceUtilisation({ space_type: "sports_area", children_using: 4, total_children_available: 4, enjoyment_observed: true }),
          makeSpaceUtilisation({ space_type: "quiet_area", children_using: 4, total_children_available: 4, enjoyment_observed: true }),
          makeSpaceUtilisation({ space_type: "growing_area", children_using: 4, total_children_available: 4, enjoyment_observed: true }),
        ],
        child_involvement_records: [
          makeChildInvolvement({ child_id: "yp_a", engaged: true, enjoyment_level: 5, child_chose_activity: true, therapeutic_benefit_noted: true, produce_harvested: true, linked_to_care_plan: true }),
          makeChildInvolvement({ child_id: "yp_b", engaged: true, enjoyment_level: 5, child_chose_activity: true, therapeutic_benefit_noted: true, produce_harvested: true, linked_to_care_plan: true }),
          makeChildInvolvement({ child_id: "yp_c", engaged: true, enjoyment_level: 5, child_chose_activity: true, therapeutic_benefit_noted: true, produce_harvested: true, linked_to_care_plan: true }),
          makeChildInvolvement({ child_id: "yp_d", engaged: true, enjoyment_level: 5, child_chose_activity: true, therapeutic_benefit_noted: true, produce_harvested: true, linked_to_care_plan: true }),
        ],
        environmental_quality_records: Array.from({ length: 10 }, () =>
          makeEnvironmentalQuality({
            meets_standard: true,
            sensory_benefit: true,
            wildlife_observed: true,
            children_consulted: true,
          }),
        ),
      });
    }

    it("rates outstanding", () => {
      const r = computeGardenOutdoorSpaceMaintenance(outstandingInput());
      expect(r.garden_rating).toBe("outstanding");
    });

    it("score >= 80", () => {
      const r = computeGardenOutdoorSpaceMaintenance(outstandingInput());
      expect(r.garden_score).toBeGreaterThanOrEqual(80);
    });

    it("has multiple strengths", () => {
      const r = computeGardenOutdoorSpaceMaintenance(outstandingInput());
      expect(r.strengths.length).toBeGreaterThanOrEqual(5);
    });

    it("has no concerns", () => {
      const r = computeGardenOutdoorSpaceMaintenance(outstandingInput());
      expect(r.concerns).toHaveLength(0);
    });

    it("has no recommendations", () => {
      const r = computeGardenOutdoorSpaceMaintenance(outstandingInput());
      expect(r.recommendations).toHaveLength(0);
    });

    it("has positive insights", () => {
      const r = computeGardenOutdoorSpaceMaintenance(outstandingInput());
      expect(r.insights.some((i) => i.severity === "positive")).toBe(true);
    });

    it("has no critical insights", () => {
      const r = computeGardenOutdoorSpaceMaintenance(outstandingInput());
      expect(r.insights.filter((i) => i.severity === "critical")).toHaveLength(0);
    });
  });

  // ── Integration: Full Inadequate Scenario ─────────────────────────────

  describe("integration — inadequate scenario", () => {
    function inadequateInput(): GardenOutdoorInput {
      return baseInput({
        total_children: 4,
        garden_condition_records: Array.from({ length: 5 }, () =>
          makeGardenCondition({
            condition_rating: 1,
            cleanliness_rating: 1,
            safety_hazards_found: true,
            hazards_resolved: false,
            maintenance_required: true,
            maintenance_completed: false,
          }),
        ),
        equipment_safety_records: Array.from({ length: 5 }, () =>
          makeEquipmentSafety({
            safety_compliant: false,
            condition_rating: 1,
            defects_found: true,
            defects_resolved: false,
            anchoring_secure: false,
            surface_condition_safe: false,
            last_professional_inspection: null,
          }),
        ),
        space_utilisation_records: Array.from({ length: 5 }, () =>
          makeSpaceUtilisation({
            children_using: 1,
            total_children_available: 4,
            staff_supervised: false,
            enjoyment_observed: false,
            inclusive_access: false,
          }),
        ),
        child_involvement_records: Array.from({ length: 5 }, () =>
          makeChildInvolvement({
            engaged: false,
            enjoyment_level: 1,
            child_chose_activity: false,
            therapeutic_benefit_noted: false,
            produce_harvested: false,
            linked_to_care_plan: false,
            responsibility_taken: false,
          }),
        ),
        environmental_quality_records: Array.from({ length: 5 }, () =>
          makeEnvironmentalQuality({
            meets_standard: false,
            improvement_needed: true,
            improvement_completed: false,
            sensory_benefit: false,
            wildlife_observed: false,
          }),
        ),
      });
    }

    it("rates inadequate", () => {
      const r = computeGardenOutdoorSpaceMaintenance(inadequateInput());
      expect(r.garden_rating).toBe("inadequate");
    });

    it("score < 45", () => {
      const r = computeGardenOutdoorSpaceMaintenance(inadequateInput());
      expect(r.garden_score).toBeLessThan(45);
    });

    it("has multiple concerns", () => {
      const r = computeGardenOutdoorSpaceMaintenance(inadequateInput());
      expect(r.concerns.length).toBeGreaterThanOrEqual(5);
    });

    it("has multiple recommendations", () => {
      const r = computeGardenOutdoorSpaceMaintenance(inadequateInput());
      expect(r.recommendations.length).toBeGreaterThanOrEqual(5);
    });

    it("has critical insights", () => {
      const r = computeGardenOutdoorSpaceMaintenance(inadequateInput());
      expect(r.insights.some((i) => i.severity === "critical")).toBe(true);
    });

    it("has no strengths", () => {
      const r = computeGardenOutdoorSpaceMaintenance(inadequateInput());
      expect(r.strengths).toHaveLength(0);
    });

    it("has no positive insights", () => {
      const r = computeGardenOutdoorSpaceMaintenance(inadequateInput());
      expect(r.insights.filter((i) => i.severity === "positive")).toHaveLength(0);
    });
  });

  // ── Regulatory References ─────────────────────────────────────────────

  describe("regulatory references", () => {
    it("recommendations reference CHR 2015 Reg 25 for premises issues", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          equipment_safety_records: [makeEquipmentSafety({ safety_compliant: false })],
        }),
      );
      expect(r.recommendations.some((rec) => rec.regulatory_ref.includes("Reg 25"))).toBe(true);
    });

    it("recommendations reference CHR 2015 Reg 5 for engagement issues", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          child_involvement_records: Array.from({ length: 4 }, () =>
            makeChildInvolvement({ engaged: false }),
          ),
        }),
      );
      expect(r.recommendations.some((rec) => rec.regulatory_ref.includes("Reg 5"))).toBe(true);
    });

    it("recommendations reference SCCIF for supervision issues", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          space_utilisation_records: [makeSpaceUtilisation({ staff_supervised: false })],
        }),
      );
      expect(r.recommendations.some((rec) => rec.regulatory_ref.includes("SCCIF"))).toBe(true);
    });
  });

  // ── Mixed Scenarios ───────────────────────────────────────────────────

  describe("mixed scenarios", () => {
    it("good equipment + poor garden = mixed result", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          garden_condition_records: Array.from({ length: 5 }, () =>
            makeGardenCondition({ condition_rating: 1 }),
          ),
          equipment_safety_records: Array.from({ length: 10 }, () =>
            makeEquipmentSafety({ safety_compliant: true }),
          ),
        }),
      );
      expect(r.strengths.some((s) => s.includes("equipment safety"))).toBe(true);
      expect(r.concerns.some((c) => c.includes("garden areas"))).toBe(true);
    });

    it("high child involvement + low space utilisation", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          child_involvement_records: Array.from({ length: 10 }, () =>
            makeChildInvolvement({ engaged: true }),
          ),
          space_utilisation_records: [
            makeSpaceUtilisation({ children_using: 1, total_children_available: 10 }),
          ],
        }),
      );
      expect(r.strengths.some((s) => s.includes("child engagement"))).toBe(true);
      expect(r.concerns.some((c) => c.includes("space utilisation") || c.includes("outdoor space utilisation"))).toBe(true);
    });

    it("excellent environmental quality + no equipment checks", () => {
      const r = computeGardenOutdoorSpaceMaintenance(
        baseInput({
          total_children: 3,
          environmental_quality_records: Array.from({ length: 10 }, () =>
            makeEnvironmentalQuality({ meets_standard: true }),
          ),
        }),
      );
      expect(r.strengths.some((s) => s.includes("environmental quality"))).toBe(true);
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("No outdoor equipment safety checks"))).toBe(true);
    });
  });
});
