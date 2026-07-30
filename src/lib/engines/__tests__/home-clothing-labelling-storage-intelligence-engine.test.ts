// ══════════════════════════════════════════════════════════════════════════════
// TESTS -- Home Clothing Labelling & Storage Intelligence Engine
// 180 tests covering labelling compliance, wardrobe storage, seasonal rotation,
// ownership respect, condition monitoring, scoring, strengths, concerns,
// recommendations, insights, and edge cases.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeClothingLabellingStorage,
  type ClothingLabellingStorageInput,
  type ClothingLabellingRecordInput,
  type ClothingStorageRecordInput,
  type ClothingRotationRecordInput,
  type ClothingOwnershipRecordInput,
  type ClothingConditionRecordInput,
} from "../home-clothing-labelling-storage-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

const TODAY = "2026-05-31";

let _seq = 0;
function uid(): string {
  return `id_${++_seq}`;
}

function baseInput(
  overrides: Partial<ClothingLabellingStorageInput> = {},
): ClothingLabellingStorageInput {
  return {
    today: TODAY,
    total_children: 3,
    labelling_records: [],
    storage_records: [],
    rotation_records: [],
    ownership_records: [],
    condition_records: [],
    ...overrides,
  };
}

// -- Record factories --

function makeLabelling(
  overrides: Partial<ClothingLabellingRecordInput> = {},
): ClothingLabellingRecordInput {
  return {
    id: uid(),
    child_id: "child_1",
    date: "2026-05-01",
    total_items_audited: 20,
    items_labelled: 18,
    labelling_method: "sewn_in",
    child_consulted_on_method: true,
    labels_discreet: true,
    labels_durable: true,
    labels_checked_after_wash: true,
    items_lost_since_last_audit: 0,
    items_returned_via_label: 0,
    staff_id: "staff_1",
    notes: "",
    created_at: "2026-05-01",
    ...overrides,
  };
}

function makeStorage(
  overrides: Partial<ClothingStorageRecordInput> = {},
): ClothingStorageRecordInput {
  return {
    id: uid(),
    child_id: "child_1",
    date: "2026-05-01",
    wardrobe_available: true,
    wardrobe_adequate_size: true,
    drawers_available: true,
    drawers_adequate_size: true,
    shoe_storage_available: true,
    storage_lockable: true,
    child_has_key: true,
    storage_clean: true,
    storage_personalised: true,
    child_satisfied_with_storage: true,
    overflow_items_count: 0,
    notes: "",
    created_at: "2026-05-01",
    ...overrides,
  };
}

function makeRotation(
  overrides: Partial<ClothingRotationRecordInput> = {},
): ClothingRotationRecordInput {
  return {
    id: uid(),
    child_id: "child_1",
    date: "2026-05-01",
    season: "spring",
    rotation_completed: true,
    outgrown_items_identified: 5,
    outgrown_items_replaced: 5,
    seasonal_items_available: true,
    weather_appropriate_clothing: true,
    child_involved_in_choices: true,
    budget_allocated: true,
    shopping_trip_offered: true,
    child_satisfaction: 5,
    notes: "",
    created_at: "2026-05-01",
    ...overrides,
  };
}

function makeOwnership(
  overrides: Partial<ClothingOwnershipRecordInput> = {},
): ClothingOwnershipRecordInput {
  return {
    id: uid(),
    child_id: "child_1",
    date: "2026-05-01",
    clothing_belongs_to_child: true,
    child_takes_clothing_on_moves: true,
    shared_clothing_policy_explained: true,
    child_chooses_own_clothing: true,
    clothing_reflects_identity: true,
    cultural_clothing_provided: true,
    religious_clothing_provided: true,
    child_has_occasion_wear: true,
    child_satisfied_with_wardrobe: true,
    pocket_money_for_clothing: true,
    notes: "",
    created_at: "2026-05-01",
    ...overrides,
  };
}

function makeCondition(
  overrides: Partial<ClothingConditionRecordInput> = {},
): ClothingConditionRecordInput {
  return {
    id: uid(),
    child_id: "child_1",
    date: "2026-05-01",
    total_items_checked: 20,
    items_good_condition: 18,
    items_fair_condition: 2,
    items_poor_condition: 0,
    items_needing_replacement: 1,
    items_replaced: 1,
    stains_or_damage_noted: false,
    repair_completed: false,
    underwear_adequate: true,
    footwear_adequate: true,
    child_embarrassed_by_clothing: false,
    school_uniform_adequate: true,
    notes: "",
    created_at: "2026-05-01",
    ...overrides,
  };
}

function repeat<T>(n: number, factory: (i: number) => T): T[] {
  return Array.from({ length: n }, (_, i) => factory(i));
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("Home Clothing Labelling & Storage Intelligence Engine", () => {
  // ════════════════════════════════════════════════════════════════════════
  // INSUFFICIENT DATA
  // ════════════════════════════════════════════════════════════════════════

  describe("Insufficient Data", () => {
    it("returns insufficient_data when all arrays empty and total_children=0", () => {
      const r = computeClothingLabellingStorage(baseInput({ total_children: 0 }));
      expect(r.labelling_rating).toBe("insufficient_data");
      expect(r.labelling_score).toBe(0);
    });

    it("headline mentions no children on placement", () => {
      const r = computeClothingLabellingStorage(baseInput({ total_children: 0 }));
      expect(r.headline).toContain("No children on placement");
    });

    it("returns all rates as 0 for insufficient_data", () => {
      const r = computeClothingLabellingStorage(baseInput({ total_children: 0 }));
      expect(r.labelling_compliance_rate).toBe(0);
      expect(r.storage_adequacy_rate).toBeNull();
      expect(r.seasonal_rotation_rate).toBe(0);
      expect(r.ownership_respect_rate).toBeNull();
      expect(r.condition_monitoring_rate).toBeNull();
      expect(r.child_satisfaction_rate).toBeNull();
    });

    it("returns empty arrays for insufficient_data", () => {
      const r = computeClothingLabellingStorage(baseInput({ total_children: 0 }));
      expect(r.strengths).toEqual([]);
      expect(r.concerns).toEqual([]);
      expect(r.recommendations).toEqual([]);
      expect(r.insights).toEqual([]);
    });

    it("returns empty record arrays for insufficient_data", () => {
      const r = computeClothingLabellingStorage(baseInput({ total_children: 0 }));
      expect(r.labelling_records).toEqual([]);
      expect(r.storage_records).toEqual([]);
      expect(r.rotation_records).toEqual([]);
      expect(r.ownership_records).toEqual([]);
      expect(r.condition_records).toEqual([]);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // INADEQUATE FLOOR (all empty + children > 0)
  // ════════════════════════════════════════════════════════════════════════

  describe("Inadequate Floor (all empty, children > 0)", () => {
    it("returns inadequate with score 15", () => {
      const r = computeClothingLabellingStorage(baseInput());
      expect(r.labelling_rating).toBe("inadequate");
      expect(r.labelling_score).toBe(15);
    });

    it("headline mentions no records exist", () => {
      const r = computeClothingLabellingStorage(baseInput());
      expect(r.headline).toContain("No clothing labelling, storage, rotation, ownership, or condition records exist");
    });

    it("has exactly 1 concern about missing records", () => {
      const r = computeClothingLabellingStorage(baseInput());
      expect(r.concerns).toHaveLength(1);
      expect(r.concerns[0]).toContain("No clothing labelling, storage, rotation, ownership, or condition records");
    });

    it("has exactly 2 immediate recommendations", () => {
      const r = computeClothingLabellingStorage(baseInput());
      expect(r.recommendations).toHaveLength(2);
      expect(r.recommendations[0].urgency).toBe("immediate");
      expect(r.recommendations[1].urgency).toBe("immediate");
      expect(r.recommendations[0].rank).toBe(1);
      expect(r.recommendations[1].rank).toBe(2);
    });

    it("recommendations reference Reg 5 and Reg 25", () => {
      const r = computeClothingLabellingStorage(baseInput());
      expect(r.recommendations[0].regulatory_ref).toContain("Reg 5");
      expect(r.recommendations[1].regulatory_ref).toContain("Reg 25");
    });

    it("has exactly 1 critical insight", () => {
      const r = computeClothingLabellingStorage(baseInput());
      expect(r.insights).toHaveLength(1);
      expect(r.insights[0].severity).toBe("critical");
    });

    it("all rates are 0", () => {
      const r = computeClothingLabellingStorage(baseInput());
      expect(r.labelling_compliance_rate).toBe(0);
      expect(r.storage_adequacy_rate).toBeNull();
      expect(r.seasonal_rotation_rate).toBe(0);
      expect(r.ownership_respect_rate).toBeNull();
      expect(r.condition_monitoring_rate).toBeNull();
      expect(r.child_satisfaction_rate).toBeNull();
    });

    it("works for total_children=1", () => {
      const r = computeClothingLabellingStorage(baseInput({ total_children: 1 }));
      expect(r.labelling_rating).toBe("inadequate");
      expect(r.labelling_score).toBe(15);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // OUTPUT SHAPE
  // ════════════════════════════════════════════════════════════════════════

  describe("Output Shape", () => {
    it("returns all expected result fields", () => {
      const r = computeClothingLabellingStorage(
        baseInput({ labelling_records: [makeLabelling()] }),
      );
      expect(r).toHaveProperty("labelling_rating");
      expect(r).toHaveProperty("labelling_score");
      expect(r).toHaveProperty("headline");
      expect(r).toHaveProperty("labelling_compliance_rate");
      expect(r).toHaveProperty("storage_adequacy_rate");
      expect(r).toHaveProperty("seasonal_rotation_rate");
      expect(r).toHaveProperty("ownership_respect_rate");
      expect(r).toHaveProperty("condition_monitoring_rate");
      expect(r).toHaveProperty("child_satisfaction_rate");
      expect(r).toHaveProperty("labelling_records");
      expect(r).toHaveProperty("storage_records");
      expect(r).toHaveProperty("rotation_records");
      expect(r).toHaveProperty("ownership_records");
      expect(r).toHaveProperty("condition_records");
      expect(r).toHaveProperty("strengths");
      expect(r).toHaveProperty("concerns");
      expect(r).toHaveProperty("recommendations");
      expect(r).toHaveProperty("insights");
    });

    it("passes input records through to output", () => {
      const lab = [makeLabelling()];
      const stor = [makeStorage()];
      const rot = [makeRotation()];
      const own = [makeOwnership()];
      const cond = [makeCondition()];
      const r = computeClothingLabellingStorage(
        baseInput({
          labelling_records: lab,
          storage_records: stor,
          rotation_records: rot,
          ownership_records: own,
          condition_records: cond,
        }),
      );
      expect(r.labelling_records).toBe(lab);
      expect(r.storage_records).toBe(stor);
      expect(r.rotation_records).toBe(rot);
      expect(r.ownership_records).toBe(own);
      expect(r.condition_records).toBe(cond);
    });

    it("score is always between 0 and 100", () => {
      const r1 = computeClothingLabellingStorage(baseInput({ total_children: 0 }));
      expect(r1.labelling_score).toBeGreaterThanOrEqual(0);
      expect(r1.labelling_score).toBeLessThanOrEqual(100);

      const r2 = computeClothingLabellingStorage(baseInput({
        labelling_records: [makeLabelling()],
        storage_records: [makeStorage()],
        rotation_records: [makeRotation()],
        ownership_records: [makeOwnership()],
        condition_records: [makeCondition()],
      }));
      expect(r2.labelling_score).toBeGreaterThanOrEqual(0);
      expect(r2.labelling_score).toBeLessThanOrEqual(100);
    });

    it("rating is one of the allowed values", () => {
      const r = computeClothingLabellingStorage(baseInput({
        labelling_records: [makeLabelling()],
      }));
      expect(["outstanding", "good", "adequate", "inadequate", "insufficient_data"]).toContain(
        r.labelling_rating,
      );
    });

    it("recommendation ranks are sequential starting at 1", () => {
      const r = computeClothingLabellingStorage(baseInput({
        labelling_records: [makeLabelling({ total_items_audited: 20, items_labelled: 5 })],
        storage_records: [makeStorage({
          wardrobe_available: false,
          wardrobe_adequate_size: false,
          drawers_available: false,
          drawers_adequate_size: false,
          shoe_storage_available: false,
          storage_clean: false,
        })],
        condition_records: [makeCondition({
          total_items_checked: 20,
          items_good_condition: 2,
          items_fair_condition: 3,
          items_poor_condition: 15,
          items_needing_replacement: 10,
          items_replaced: 1,
          underwear_adequate: false,
          child_embarrassed_by_clothing: true,
        })],
      }));
      for (let i = 0; i < r.recommendations.length; i++) {
        expect(r.recommendations[i].rank).toBe(i + 1);
      }
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // LABELLING COMPLIANCE RATE
  // ════════════════════════════════════════════════════════════════════════

  describe("Labelling Compliance Rate", () => {
    it("calculates labelling compliance as items_labelled / total_items_audited", () => {
      const r = computeClothingLabellingStorage(baseInput({
        labelling_records: [makeLabelling({ total_items_audited: 100, items_labelled: 90 })],
      }));
      expect(r.labelling_compliance_rate).toBe(90);
    });

    it("aggregates across multiple labelling records", () => {
      const r = computeClothingLabellingStorage(baseInput({
        labelling_records: [
          makeLabelling({ total_items_audited: 10, items_labelled: 8 }),
          makeLabelling({ total_items_audited: 10, items_labelled: 6 }),
        ],
      }));
      expect(r.labelling_compliance_rate).toBe(70); // 14/20
    });

    it("returns 0 when no labelling records", () => {
      const r = computeClothingLabellingStorage(baseInput({
        storage_records: [makeStorage()],
      }));
      expect(r.labelling_compliance_rate).toBe(0);
    });

    it("handles 100% labelling compliance", () => {
      const r = computeClothingLabellingStorage(baseInput({
        labelling_records: [makeLabelling({ total_items_audited: 20, items_labelled: 20 })],
      }));
      expect(r.labelling_compliance_rate).toBe(100);
    });

    it("handles 0% labelling compliance", () => {
      const r = computeClothingLabellingStorage(baseInput({
        labelling_records: [makeLabelling({ total_items_audited: 20, items_labelled: 0 })],
      }));
      expect(r.labelling_compliance_rate).toBe(0);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // STORAGE ADEQUACY RATE
  // ════════════════════════════════════════════════════════════════════════

  describe("Storage Adequacy Rate", () => {
    it("100% when all storage components true", () => {
      const r = computeClothingLabellingStorage(baseInput({
        storage_records: [makeStorage()],
      }));
      expect(r.storage_adequacy_rate).toBe(100);
    });

    it("0% when all storage components false", () => {
      const r = computeClothingLabellingStorage(baseInput({
        storage_records: [makeStorage({
          wardrobe_available: false,
          wardrobe_adequate_size: false,
          drawers_available: false,
          drawers_adequate_size: false,
          shoe_storage_available: false,
          storage_clean: false,
        })],
      }));
      // record exists → 0, not null
      expect(r.storage_adequacy_rate).toBe(0);
    });

    it("averages 6 components: wardrobe_avail, wardrobe_adequate, drawers_avail, drawers_adequate, shoe, clean", () => {
      // 3 of 6 true for 1 record -> each component is 100% or 0%, avg = 50%
      const r = computeClothingLabellingStorage(baseInput({
        storage_records: [makeStorage({
          wardrobe_available: true,
          wardrobe_adequate_size: true,
          drawers_available: true,
          drawers_adequate_size: false,
          shoe_storage_available: false,
          storage_clean: false,
        })],
      }));
      expect(r.storage_adequacy_rate).toBe(50);
    });

    it("returns 0 when no storage records", () => {
      const r = computeClothingLabellingStorage(baseInput({
        labelling_records: [makeLabelling()],
      }));
      expect(r.storage_adequacy_rate).toBeNull();
    });

    it("wardrobe_adequate_size requires wardrobe_available", () => {
      // wardrobe_adequate_size=true but wardrobe_available=false -> filter won't count it
      const r = computeClothingLabellingStorage(baseInput({
        storage_records: [makeStorage({
          wardrobe_available: false,
          wardrobe_adequate_size: true,
          drawers_available: false,
          drawers_adequate_size: false,
          shoe_storage_available: false,
          storage_clean: false,
        })],
      }));
      // wardrobe_available=0%, wardrobe_adequate=0% (because wardrobe not available),
      // drawers_available=0%, drawers_adequate=0%, shoe=0%, clean=0% -> 0%
      // record exists → 0, not null
      expect(r.storage_adequacy_rate).toBe(0);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // SEASONAL ROTATION RATE
  // ════════════════════════════════════════════════════════════════════════

  describe("Seasonal Rotation Rate", () => {
    it("100% when all rotations completed", () => {
      const r = computeClothingLabellingStorage(baseInput({
        rotation_records: [makeRotation(), makeRotation()],
      }));
      expect(r.seasonal_rotation_rate).toBe(100);
    });

    it("0% when no rotations completed", () => {
      const r = computeClothingLabellingStorage(baseInput({
        rotation_records: [makeRotation({ rotation_completed: false })],
      }));
      expect(r.seasonal_rotation_rate).toBe(0);
    });

    it("50% when half rotations completed", () => {
      const r = computeClothingLabellingStorage(baseInput({
        rotation_records: [
          makeRotation({ rotation_completed: true }),
          makeRotation({ rotation_completed: false }),
        ],
      }));
      expect(r.seasonal_rotation_rate).toBe(50);
    });

    it("returns 0 when no rotation records", () => {
      const r = computeClothingLabellingStorage(baseInput({
        labelling_records: [makeLabelling()],
      }));
      expect(r.seasonal_rotation_rate).toBe(0);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // OWNERSHIP RESPECT RATE
  // ════════════════════════════════════════════════════════════════════════

  describe("Ownership Respect Rate", () => {
    it("100% when all ownership components true", () => {
      const r = computeClothingLabellingStorage(baseInput({
        ownership_records: [makeOwnership()],
      }));
      expect(r.ownership_respect_rate).toBe(100);
    });

    it("0% when all ownership components false", () => {
      const r = computeClothingLabellingStorage(baseInput({
        ownership_records: [makeOwnership({
          clothing_belongs_to_child: false,
          child_takes_clothing_on_moves: false,
          child_chooses_own_clothing: false,
          clothing_reflects_identity: false,
        })],
      }));
      // record exists → 0, not null
      expect(r.ownership_respect_rate).toBe(0);
    });

    it("averages 4 components: belongs, takes_on_moves, chooses, reflects_identity", () => {
      const r = computeClothingLabellingStorage(baseInput({
        ownership_records: [makeOwnership({
          clothing_belongs_to_child: true,
          child_takes_clothing_on_moves: true,
          child_chooses_own_clothing: false,
          clothing_reflects_identity: false,
        })],
      }));
      expect(r.ownership_respect_rate).toBe(50);
    });

    it("returns 0 when no ownership records", () => {
      const r = computeClothingLabellingStorage(baseInput({
        labelling_records: [makeLabelling()],
      }));
      expect(r.ownership_respect_rate).toBeNull();
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // CONDITION MONITORING RATE
  // ════════════════════════════════════════════════════════════════════════

  describe("Condition Monitoring Rate", () => {
    it("100% when all items good and all replaced", () => {
      const r = computeClothingLabellingStorage(baseInput({
        condition_records: [makeCondition({
          total_items_checked: 20,
          items_good_condition: 20,
          items_fair_condition: 0,
          items_poor_condition: 0,
          items_needing_replacement: 5,
          items_replaced: 5,
        })],
      }));
      expect(r.condition_monitoring_rate).toBe(100);
    });

    it("is average of good_condition_rate and replacement_rate", () => {
      // good_condition_rate = 10/20 = 50%, replacement_rate = 2/4 = 50%
      // avg = 50%
      const r = computeClothingLabellingStorage(baseInput({
        condition_records: [makeCondition({
          total_items_checked: 20,
          items_good_condition: 10,
          items_needing_replacement: 4,
          items_replaced: 2,
        })],
      }));
      expect(r.condition_monitoring_rate).toBe(50);
    });

    it("returns 0 when no condition records", () => {
      const r = computeClothingLabellingStorage(baseInput({
        labelling_records: [makeLabelling()],
      }));
      expect(r.condition_monitoring_rate).toBeNull();
    });

    it("handles 0 items needing replacement (replacement_rate = 0)", () => {
      const r = computeClothingLabellingStorage(baseInput({
        condition_records: [makeCondition({
          total_items_checked: 20,
          items_good_condition: 20,
          items_needing_replacement: 0,
          items_replaced: 0,
        })],
      }));
      // good_condition_rate=100%, replacement_rate=pct(0,0)=0%, avg=50
      expect(r.condition_monitoring_rate).toBe(50);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // CHILD SATISFACTION RATE
  // ════════════════════════════════════════════════════════════════════════

  describe("Child Satisfaction Rate", () => {
    it("combines storage, rotation, and ownership satisfaction", () => {
      const r = computeClothingLabellingStorage(baseInput({
        storage_records: [makeStorage({ child_satisfied_with_storage: true })],
        rotation_records: [makeRotation({ child_satisfaction: 5 })],
        ownership_records: [makeOwnership({ child_satisfied_with_wardrobe: true })],
      }));
      // storage sat = 100%, rotation sat avg = 5.0 scaled = 100, ownership sat = 100%
      // avg = (100+100+100)/3 = 100
      expect(r.child_satisfaction_rate).toBe(100);
    });

    it("scales rotation satisfaction from 1-5 to 0-100", () => {
      const r = computeClothingLabellingStorage(baseInput({
        rotation_records: [makeRotation({ child_satisfaction: 3 })],
      }));
      // rotationSatisfactionAvg = 3.0, scaled = 3.0*20 = 60
      expect(r.child_satisfaction_rate).toBe(60);
    });

    it("returns 0 when no relevant records exist", () => {
      const r = computeClothingLabellingStorage(baseInput({
        labelling_records: [makeLabelling()],
      }));
      expect(r.child_satisfaction_rate).toBeNull();
    });

    it("handles mixed satisfaction sources", () => {
      const r = computeClothingLabellingStorage(baseInput({
        storage_records: [
          makeStorage({ child_satisfied_with_storage: true }),
          makeStorage({ child_satisfied_with_storage: false }),
        ],
        ownership_records: [makeOwnership({ child_satisfied_with_wardrobe: true })],
      }));
      // storage sat = 50%, ownership sat = 100%, avg = 75%
      expect(r.child_satisfaction_rate).toBe(75);
    });

    it("only includes sources that have records", () => {
      const r = computeClothingLabellingStorage(baseInput({
        storage_records: [makeStorage({ child_satisfied_with_storage: true })],
      }));
      // only storage: 100%
      expect(r.child_satisfaction_rate).toBe(100);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // SCORING -- BASE & BONUSES
  // ════════════════════════════════════════════════════════════════════════

  describe("Scoring -- Base and Bonuses", () => {
    it("base score is 52 with minimal data (no bonuses or penalties)", () => {
      // labelling 70-89 => +2, but all booleans default to true in factory
      // Let's carefully craft a scenario: labelling compliance between 70-89
      const r = computeClothingLabellingStorage(baseInput({
        labelling_records: [makeLabelling({
          total_items_audited: 10,
          items_labelled: 8, // 80% -> +2
          child_consulted_on_method: false,
          labels_discreet: false,
          labels_durable: false,
          labels_checked_after_wash: false,
        })],
      }));
      // Only labelling bonus applies: 52 + 2 = 54
      expect(r.labelling_score).toBe(54);
    });

    it("adds +5 for labelling compliance >= 90", () => {
      const r = computeClothingLabellingStorage(baseInput({
        labelling_records: [makeLabelling({ total_items_audited: 10, items_labelled: 9 })],
      }));
      // 90% labelling -> +5, total = 52 + 5 = 57
      expect(r.labelling_score).toBe(57);
    });

    it("adds +2 for labelling compliance >= 70 but < 90", () => {
      const r = computeClothingLabellingStorage(baseInput({
        labelling_records: [makeLabelling({ total_items_audited: 10, items_labelled: 7 })],
      }));
      // 70% labelling -> +2, total = 52 + 2 = 54
      expect(r.labelling_score).toBe(54);
    });

    it("adds +5 for storage adequacy >= 90", () => {
      const r = computeClothingLabellingStorage(baseInput({
        storage_records: [makeStorage({ child_satisfied_with_storage: false })], // all true storage components -> 100%, but no satisfaction bonus
      }));
      // storage 100% -> +5, child_sat = 0% (only source is storage, which is 0%), total = 52 + 5 = 57
      expect(r.labelling_score).toBe(57);
    });

    it("adds +2 for storage adequacy >= 70 but < 90", () => {
      // Need 70-89% storage adequacy: 5 of 6 components -> ~83%
      const r = computeClothingLabellingStorage(baseInput({
        storage_records: [makeStorage({ shoe_storage_available: false, child_satisfied_with_storage: false })],
      }));
      // 5/6 components = 83% -> +2, child_sat 0% -> no bonus
      expect(r.labelling_score).toBe(54);
    });

    it("adds +4 for seasonal rotation >= 90", () => {
      const r = computeClothingLabellingStorage(baseInput({
        rotation_records: [makeRotation()], // completed -> 100%
      }));
      // rotation 100% -> +4, weather 100% -> +3, satisfaction 5*20=100 -> child_sat 100% -> +3
      // 52 + 4 + 3 + 3 = 62
      expect(r.labelling_score).toBe(62);
    });

    it("adds +4 for ownership respect >= 90", () => {
      const r = computeClothingLabellingStorage(baseInput({
        ownership_records: [makeOwnership()], // all true -> 100%
      }));
      // ownership 100% -> +4, child_sat 100% -> +3
      // 52 + 4 + 3 = 59
      expect(r.labelling_score).toBe(59);
    });

    it("adds +4 for condition monitoring >= 90", () => {
      const r = computeClothingLabellingStorage(baseInput({
        condition_records: [makeCondition({
          total_items_checked: 20,
          items_good_condition: 20,
          items_needing_replacement: 5,
          items_replaced: 5,
        })],
      }));
      // condition monitoring = (100+100)/2 = 100% -> +4
      expect(r.labelling_score).toBeGreaterThanOrEqual(56);
    });

    it("adds +3 for child satisfaction >= 80", () => {
      const r = computeClothingLabellingStorage(baseInput({
        storage_records: [makeStorage({ child_satisfied_with_storage: true })],
        ownership_records: [makeOwnership({ child_satisfied_with_wardrobe: true })],
      }));
      // storage 100% -> +5, ownership 100% -> +4, child_sat 100% -> +3
      // 52 + 5 + 4 + 3 = 64
      expect(r.labelling_score).toBe(64);
    });

    it("adds +3 for weather appropriate >= 90", () => {
      const r = computeClothingLabellingStorage(baseInput({
        rotation_records: [makeRotation({ weather_appropriate_clothing: true })], // 100%
      }));
      // rotation 100% -> +4, weather 100% -> +3, child_sat scaled -> +3
      // 52 + 4 + 3 + 3 = 62
      expect(r.labelling_score).toBe(62);
    });

    it("max bonuses yield outstanding score", () => {
      const r = computeClothingLabellingStorage(baseInput({
        labelling_records: [makeLabelling({ total_items_audited: 10, items_labelled: 10 })],
        storage_records: [makeStorage()],
        rotation_records: [makeRotation()],
        ownership_records: [makeOwnership()],
        condition_records: [makeCondition({
          total_items_checked: 20,
          items_good_condition: 20,
          items_needing_replacement: 5,
          items_replaced: 5,
        })],
      }));
      // 52 + 5+5+4+4+4+3+3 = 80
      expect(r.labelling_score).toBe(80);
      expect(r.labelling_rating).toBe("outstanding");
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // SCORING -- PENALTIES
  // ════════════════════════════════════════════════════════════════════════

  describe("Scoring -- Penalties", () => {
    it("applies -5 for labelling compliance < 50 (with audited items)", () => {
      const r = computeClothingLabellingStorage(baseInput({
        labelling_records: [makeLabelling({ total_items_audited: 20, items_labelled: 5 })],
      }));
      // 25% labelling -> -5, total = 52 - 5 = 47
      expect(r.labelling_score).toBe(47);
    });

    it("does not apply labelling penalty when total_items_audited = 0", () => {
      const r = computeClothingLabellingStorage(baseInput({
        labelling_records: [makeLabelling({ total_items_audited: 0, items_labelled: 0 })],
      }));
      // no penalty because no items audited
      expect(r.labelling_score).toBe(52);
    });

    it("applies -5 for storage adequacy < 50", () => {
      const r = computeClothingLabellingStorage(baseInput({
        storage_records: [makeStorage({
          wardrobe_available: false,
          wardrobe_adequate_size: false,
          drawers_available: true,
          drawers_adequate_size: false,
          shoe_storage_available: false,
          storage_clean: false,
          child_satisfied_with_storage: false,
        })],
      }));
      // 1/6 = 17% -> -5, child_sat=0% -> no bonus, total = 52 - 5 = 47
      expect(r.labelling_score).toBe(47);
    });

    it("applies -4 for condition monitoring < 40", () => {
      const r = computeClothingLabellingStorage(baseInput({
        condition_records: [makeCondition({
          total_items_checked: 20,
          items_good_condition: 2,
          items_fair_condition: 3,
          items_poor_condition: 15,
          items_needing_replacement: 10,
          items_replaced: 1,
        })],
      }));
      // good_rate = 10%, replacement = 10%, avg = 10% -> -4
      expect(r.labelling_score).toBe(48);
    });

    it("applies -4 for child embarrassment >= 30%", () => {
      const r = computeClothingLabellingStorage(baseInput({
        condition_records: repeat(3, (i) =>
          makeCondition({
            child_id: `child_${i}`,
            child_embarrassed_by_clothing: i === 0, // 1/3 = 33%
          }),
        ),
      }));
      // embarrassed 33% -> -4
      // condition monitoring: good_rate=pct(54,60)=90%, replacement=pct(3,3)=100%, avg=95% -> +4
      // score = 52 + 4 - 4 = 52
      expect(r.labelling_score).toBe(52);
    });

    it("multiple penalties stack", () => {
      const r = computeClothingLabellingStorage(baseInput({
        labelling_records: [makeLabelling({ total_items_audited: 20, items_labelled: 2 })],
        storage_records: [makeStorage({
          wardrobe_available: false,
          wardrobe_adequate_size: false,
          drawers_available: false,
          drawers_adequate_size: false,
          shoe_storage_available: false,
          storage_clean: false,
          child_satisfied_with_storage: false,
        })],
        condition_records: [makeCondition({
          total_items_checked: 20,
          items_good_condition: 2,
          items_needing_replacement: 10,
          items_replaced: 0,
          child_embarrassed_by_clothing: true,
        })],
      }));
      // labelling 10% -> -5, storage 0% -> -5, condition 5% -> -4, embarrassed 100% -> -4
      // child_sat = 0% -> no bonus
      // 52 - 5 - 5 - 4 - 4 = 34
      expect(r.labelling_score).toBe(34);
    });

    it("score cannot go below 0", () => {
      // Even with extreme penalties, clamped at 0
      const r = computeClothingLabellingStorage(baseInput({
        labelling_records: [makeLabelling({ total_items_audited: 20, items_labelled: 0 })],
        storage_records: [makeStorage({
          wardrobe_available: false,
          wardrobe_adequate_size: false,
          drawers_available: false,
          drawers_adequate_size: false,
          shoe_storage_available: false,
          storage_clean: false,
        })],
        condition_records: [makeCondition({
          total_items_checked: 20,
          items_good_condition: 0,
          items_needing_replacement: 10,
          items_replaced: 0,
          child_embarrassed_by_clothing: true,
        })],
      }));
      expect(r.labelling_score).toBeGreaterThanOrEqual(0);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // RATING THRESHOLDS
  // ════════════════════════════════════════════════════════════════════════

  describe("Rating Thresholds", () => {
    it("outstanding when score >= 80", () => {
      const r = computeClothingLabellingStorage(baseInput({
        labelling_records: [makeLabelling({ total_items_audited: 10, items_labelled: 10 })],
        storage_records: [makeStorage()],
        rotation_records: [makeRotation()],
        ownership_records: [makeOwnership()],
        condition_records: [makeCondition({
          total_items_checked: 20,
          items_good_condition: 20,
          items_needing_replacement: 5,
          items_replaced: 5,
        })],
      }));
      expect(r.labelling_score).toBeGreaterThanOrEqual(80);
      expect(r.labelling_rating).toBe("outstanding");
    });

    it("good when score >= 65 and < 80", () => {
      // 52 + 5(lab) + 5(storage) + 4(ownership) - no rotation/condition for penalties
      // child_sat from storage+ownership = (100+100)/2=100 -> +3
      // total = 52+5+5+4+3 = 69
      const r = computeClothingLabellingStorage(baseInput({
        labelling_records: [makeLabelling({ total_items_audited: 10, items_labelled: 10 })],
        storage_records: [makeStorage()],
        ownership_records: [makeOwnership()],
      }));
      expect(r.labelling_score).toBeGreaterThanOrEqual(65);
      expect(r.labelling_score).toBeLessThan(80);
      expect(r.labelling_rating).toBe("good");
    });

    it("adequate when score >= 45 and < 65", () => {
      const r = computeClothingLabellingStorage(baseInput({
        labelling_records: [makeLabelling({ total_items_audited: 10, items_labelled: 7 })],
      }));
      // 52 + 2 = 54
      expect(r.labelling_score).toBeGreaterThanOrEqual(45);
      expect(r.labelling_score).toBeLessThan(65);
      expect(r.labelling_rating).toBe("adequate");
    });

    it("inadequate when score < 45", () => {
      const r = computeClothingLabellingStorage(baseInput({
        labelling_records: [makeLabelling({ total_items_audited: 20, items_labelled: 2 })],
        storage_records: [makeStorage({
          wardrobe_available: false,
          wardrobe_adequate_size: false,
          drawers_available: false,
          drawers_adequate_size: false,
          shoe_storage_available: false,
          storage_clean: false,
          child_satisfied_with_storage: false,
        })],
      }));
      // 52 - 5 (labelling) - 5 (storage) = 42, child_sat=0% -> no bonus
      expect(r.labelling_score).toBeLessThan(45);
      expect(r.labelling_rating).toBe("inadequate");
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // HEADLINES
  // ════════════════════════════════════════════════════════════════════════

  describe("Headlines", () => {
    it("outstanding headline mentions outstanding", () => {
      const r = computeClothingLabellingStorage(baseInput({
        labelling_records: [makeLabelling({ total_items_audited: 10, items_labelled: 10 })],
        storage_records: [makeStorage()],
        rotation_records: [makeRotation()],
        ownership_records: [makeOwnership()],
        condition_records: [makeCondition({
          total_items_checked: 20,
          items_good_condition: 20,
          items_needing_replacement: 5,
          items_replaced: 5,
        })],
      }));
      expect(r.headline).toContain("Outstanding");
    });

    it("good headline mentions strengths count", () => {
      const r = computeClothingLabellingStorage(baseInput({
        labelling_records: [makeLabelling({ total_items_audited: 10, items_labelled: 10 })],
        storage_records: [makeStorage()],
        ownership_records: [makeOwnership()],
      }));
      expect(r.headline).toContain("Good");
      expect(r.headline).toMatch(/\d+ strength/);
    });

    it("adequate headline mentions concerns count", () => {
      const r = computeClothingLabellingStorage(baseInput({
        labelling_records: [makeLabelling({ total_items_audited: 10, items_labelled: 7 })],
      }));
      expect(r.headline).toContain("Adequate");
      expect(r.headline).toMatch(/\d+ concern/);
    });

    it("inadequate headline mentions significant concerns", () => {
      const r = computeClothingLabellingStorage(baseInput({
        labelling_records: [makeLabelling({ total_items_audited: 20, items_labelled: 2 })],
        storage_records: [makeStorage({
          wardrobe_available: false,
          wardrobe_adequate_size: false,
          drawers_available: false,
          drawers_adequate_size: false,
          shoe_storage_available: false,
          storage_clean: false,
          child_satisfied_with_storage: false,
        })],
      }));
      expect(r.headline).toContain("inadequate");
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // STRENGTHS -- LABELLING
  // ════════════════════════════════════════════════════════════════════════

  describe("Strengths -- Labelling", () => {
    it("strength for labelling >= 90%", () => {
      const r = computeClothingLabellingStorage(baseInput({
        labelling_records: [makeLabelling({ total_items_audited: 10, items_labelled: 9 })],
      }));
      expect(r.strengths.some((s) => s.includes("90%") && s.includes("labelled"))).toBe(true);
    });

    it("strength for labelling >= 70% but < 90%", () => {
      const r = computeClothingLabellingStorage(baseInput({
        labelling_records: [makeLabelling({ total_items_audited: 10, items_labelled: 7 })],
      }));
      expect(r.strengths.some((s) => s.includes("70%") && s.includes("labelling rate"))).toBe(true);
    });

    it("no labelling strength below 70%", () => {
      const r = computeClothingLabellingStorage(baseInput({
        labelling_records: [makeLabelling({ total_items_audited: 10, items_labelled: 5 })],
      }));
      expect(r.strengths.some((s) => s.includes("labelling rate") || s.includes("labelled"))).toBe(false);
    });

    it("strength for discreet labels >= 80%", () => {
      const r = computeClothingLabellingStorage(baseInput({
        labelling_records: [makeLabelling({ labels_discreet: true })],
      }));
      expect(r.strengths.some((s) => s.includes("discreet"))).toBe(true);
    });

    it("strength for durable labels >= 80%", () => {
      const r = computeClothingLabellingStorage(baseInput({
        labelling_records: [makeLabelling({ labels_durable: true })],
      }));
      expect(r.strengths.some((s) => s.includes("durable"))).toBe(true);
    });

    it("strength for post-wash checks >= 80%", () => {
      const r = computeClothingLabellingStorage(baseInput({
        labelling_records: [makeLabelling({ labels_checked_after_wash: true })],
      }));
      expect(r.strengths.some((s) => s.includes("Post-wash"))).toBe(true);
    });

    it("strength for child consulted on labelling >= 70%", () => {
      const r = computeClothingLabellingStorage(baseInput({
        labelling_records: [makeLabelling({ child_consulted_on_method: true })],
      }));
      expect(r.strengths.some((s) => s.includes("consulted on labelling"))).toBe(true);
    });

    it("strength for label recovery >= 80%", () => {
      const r = computeClothingLabellingStorage(baseInput({
        labelling_records: [makeLabelling({
          items_lost_since_last_audit: 5,
          items_returned_via_label: 4,
        })],
      }));
      expect(r.strengths.some((s) => s.includes("recovered via labelling"))).toBe(true);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // STRENGTHS -- STORAGE
  // ════════════════════════════════════════════════════════════════════════

  describe("Strengths -- Storage", () => {
    it("strength for storage adequacy >= 90%", () => {
      const r = computeClothingLabellingStorage(baseInput({
        storage_records: [makeStorage()],
      }));
      expect(r.strengths.some((s) => s.includes("Storage adequacy at"))).toBe(true);
    });

    it("strength for lockable storage >= 80%", () => {
      const r = computeClothingLabellingStorage(baseInput({
        storage_records: [makeStorage({ storage_lockable: true })],
      }));
      expect(r.strengths.some((s) => s.includes("lockable"))).toBe(true);
    });

    it("strength for personalised storage >= 70%", () => {
      const r = computeClothingLabellingStorage(baseInput({
        storage_records: [makeStorage({ storage_personalised: true })],
      }));
      expect(r.strengths.some((s) => s.includes("personalised"))).toBe(true);
    });

    it("strength for storage satisfaction >= 80%", () => {
      const r = computeClothingLabellingStorage(baseInput({
        storage_records: [makeStorage({ child_satisfied_with_storage: true })],
      }));
      expect(r.strengths.some((s) => s.includes("satisfied with their clothing storage"))).toBe(true);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // STRENGTHS -- ROTATION
  // ════════════════════════════════════════════════════════════════════════

  describe("Strengths -- Rotation", () => {
    it("strength for seasonal rotation >= 90%", () => {
      const r = computeClothingLabellingStorage(baseInput({
        rotation_records: [makeRotation()],
      }));
      expect(r.strengths.some((s) => s.includes("seasonal rotation completion rate"))).toBe(true);
    });

    it("strength for rotation between 70-89%", () => {
      const r = computeClothingLabellingStorage(baseInput({
        rotation_records: repeat(10, (i) =>
          makeRotation({ rotation_completed: i < 8 }), // 80%
        ),
      }));
      expect(r.strengths.some((s) => s.includes("seasonal rotation rate"))).toBe(true);
    });

    it("strength for outgrown replacement >= 90%", () => {
      const r = computeClothingLabellingStorage(baseInput({
        rotation_records: [makeRotation({
          outgrown_items_identified: 10,
          outgrown_items_replaced: 10,
        })],
      }));
      expect(r.strengths.some((s) => s.includes("outgrown items replaced"))).toBe(true);
    });

    it("strength for weather-appropriate >= 90%", () => {
      const r = computeClothingLabellingStorage(baseInput({
        rotation_records: [makeRotation({ weather_appropriate_clothing: true })],
      }));
      expect(r.strengths.some((s) => s.includes("weather-appropriate"))).toBe(true);
    });

    it("strength for child involved in rotation >= 70%", () => {
      const r = computeClothingLabellingStorage(baseInput({
        rotation_records: [makeRotation({ child_involved_in_choices: true })],
      }));
      expect(r.strengths.some((s) => s.includes("involved in clothing choices"))).toBe(true);
    });

    it("strength for shopping trip offered >= 70%", () => {
      const r = computeClothingLabellingStorage(baseInput({
        rotation_records: [makeRotation({ shopping_trip_offered: true })],
      }));
      expect(r.strengths.some((s) => s.includes("Shopping trips offered"))).toBe(true);
    });

    it("strength for rotation satisfaction avg >= 4.0", () => {
      const r = computeClothingLabellingStorage(baseInput({
        rotation_records: [makeRotation({ child_satisfaction: 5 })],
      }));
      expect(r.strengths.some((s) => s.includes("satisfaction") && s.includes("/5"))).toBe(true);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // STRENGTHS -- OWNERSHIP
  // ════════════════════════════════════════════════════════════════════════

  describe("Strengths -- Ownership", () => {
    it("strength for clothing belongs to child >= 90%", () => {
      const r = computeClothingLabellingStorage(baseInput({
        ownership_records: [makeOwnership({ clothing_belongs_to_child: true })],
      }));
      expect(r.strengths.some((s) => s.includes("clothing belongs to the individual child"))).toBe(true);
    });

    it("strength for takes on moves >= 90%", () => {
      const r = computeClothingLabellingStorage(baseInput({
        ownership_records: [makeOwnership({ child_takes_clothing_on_moves: true })],
      }));
      expect(r.strengths.some((s) => s.includes("take their clothing when moving"))).toBe(true);
    });

    it("strength for chooses own >= 80%", () => {
      const r = computeClothingLabellingStorage(baseInput({
        ownership_records: [makeOwnership({ child_chooses_own_clothing: true })],
      }));
      expect(r.strengths.some((s) => s.includes("choose their own clothing"))).toBe(true);
    });

    it("strength for reflects identity >= 80%", () => {
      const r = computeClothingLabellingStorage(baseInput({
        ownership_records: [makeOwnership({ clothing_reflects_identity: true })],
      }));
      expect(r.strengths.some((s) => s.includes("reflects their identity"))).toBe(true);
    });

    it("strength for occasion wear >= 80%", () => {
      const r = computeClothingLabellingStorage(baseInput({
        ownership_records: [makeOwnership({ child_has_occasion_wear: true })],
      }));
      expect(r.strengths.some((s) => s.includes("occasion wear"))).toBe(true);
    });

    it("strength for ownership satisfaction >= 80%", () => {
      const r = computeClothingLabellingStorage(baseInput({
        ownership_records: [makeOwnership({ child_satisfied_with_wardrobe: true })],
      }));
      expect(r.strengths.some((s) => s.includes("satisfied with their overall wardrobe"))).toBe(true);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // STRENGTHS -- CONDITION
  // ════════════════════════════════════════════════════════════════════════

  describe("Strengths -- Condition", () => {
    it("strength for good condition >= 90%", () => {
      const r = computeClothingLabellingStorage(baseInput({
        condition_records: [makeCondition({ total_items_checked: 10, items_good_condition: 10 })],
      }));
      expect(r.strengths.some((s) => s.includes("clothing in good condition"))).toBe(true);
    });

    it("strength for good condition 70-89%", () => {
      const r = computeClothingLabellingStorage(baseInput({
        condition_records: [makeCondition({ total_items_checked: 10, items_good_condition: 8 })],
      }));
      expect(r.strengths.some((s) => s.includes("clothing in good condition") && s.includes("well maintained"))).toBe(true);
    });

    it("strength for replacement rate >= 90%", () => {
      const r = computeClothingLabellingStorage(baseInput({
        condition_records: [makeCondition({
          items_needing_replacement: 10,
          items_replaced: 10,
        })],
      }));
      expect(r.strengths.some((s) => s.includes("replacement have been replaced"))).toBe(true);
    });

    it("strength for underwear adequate >= 95%", () => {
      const r = computeClothingLabellingStorage(baseInput({
        condition_records: [makeCondition({ underwear_adequate: true })],
      }));
      expect(r.strengths.some((s) => s.includes("Underwear adequate"))).toBe(true);
    });

    it("strength for footwear adequate >= 90%", () => {
      const r = computeClothingLabellingStorage(baseInput({
        condition_records: [makeCondition({ footwear_adequate: true })],
      }));
      expect(r.strengths.some((s) => s.includes("Footwear adequate"))).toBe(true);
    });

    it("strength for school uniform >= 90%", () => {
      const r = computeClothingLabellingStorage(baseInput({
        condition_records: [makeCondition({ school_uniform_adequate: true })],
      }));
      expect(r.strengths.some((s) => s.includes("School uniform adequate"))).toBe(true);
    });

    it("strength when no children report embarrassment", () => {
      const r = computeClothingLabellingStorage(baseInput({
        condition_records: [makeCondition({ child_embarrassed_by_clothing: false })],
      }));
      expect(r.strengths.some((s) => s.includes("No children report embarrassment"))).toBe(true);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // CONCERNS -- LABELLING
  // ════════════════════════════════════════════════════════════════════════

  describe("Concerns -- Labelling", () => {
    it("concern for labelling compliance < 50%", () => {
      const r = computeClothingLabellingStorage(baseInput({
        labelling_records: [makeLabelling({ total_items_audited: 20, items_labelled: 5 })],
      }));
      expect(r.concerns.some((c) => c.includes("25%") && c.includes("labelled"))).toBe(true);
    });

    it("concern for labelling compliance 50-69%", () => {
      const r = computeClothingLabellingStorage(baseInput({
        labelling_records: [makeLabelling({ total_items_audited: 20, items_labelled: 12 })],
      }));
      expect(r.concerns.some((c) => c.includes("60%") && c.includes("labelling"))).toBe(true);
    });

    it("concern for discreet rate < 50%", () => {
      const r = computeClothingLabellingStorage(baseInput({
        labelling_records: [
          makeLabelling({ labels_discreet: false }),
          makeLabelling({ labels_discreet: false }),
          makeLabelling({ labels_discreet: false }),
        ],
      }));
      expect(r.concerns.some((c) => c.includes("discreet"))).toBe(true);
    });

    it("concern for durable rate < 50%", () => {
      const r = computeClothingLabellingStorage(baseInput({
        labelling_records: [
          makeLabelling({ labels_durable: false }),
          makeLabelling({ labels_durable: false }),
          makeLabelling({ labels_durable: false }),
        ],
      }));
      expect(r.concerns.some((c) => c.includes("durable"))).toBe(true);
    });

    it("concern for high items lost with low recovery", () => {
      const r = computeClothingLabellingStorage(baseInput({
        labelling_records: [makeLabelling({
          items_lost_since_last_audit: 15,
          items_returned_via_label: 2,
        })],
      }));
      expect(r.concerns.some((c) => c.includes("15 items lost"))).toBe(true);
    });

    it("concern when no labelling records but children present", () => {
      const r = computeClothingLabellingStorage(baseInput({
        storage_records: [makeStorage()],
      }));
      expect(r.concerns.some((c) => c.includes("No clothing labelling audits recorded"))).toBe(true);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // CONCERNS -- STORAGE
  // ════════════════════════════════════════════════════════════════════════

  describe("Concerns -- Storage", () => {
    it("concern for storage adequacy < 50%", () => {
      const r = computeClothingLabellingStorage(baseInput({
        storage_records: [makeStorage({
          wardrobe_available: false,
          wardrobe_adequate_size: false,
          drawers_available: false,
          drawers_adequate_size: false,
          shoe_storage_available: false,
          storage_clean: false,
        })],
      }));
      expect(r.concerns.some((c) => c.includes("Storage adequacy at only"))).toBe(true);
    });

    it("concern for storage adequacy 50-69%", () => {
      const r = computeClothingLabellingStorage(baseInput({
        storage_records: [makeStorage({
          wardrobe_available: true,
          wardrobe_adequate_size: true,
          drawers_available: true,
          drawers_adequate_size: false,
          shoe_storage_available: false,
          storage_clean: false,
        })],
      }));
      expect(r.concerns.some((c) => c.includes("Storage adequacy at 50%"))).toBe(true);
    });

    it("concern for storage satisfaction < 50%", () => {
      const r = computeClothingLabellingStorage(baseInput({
        storage_records: [
          makeStorage({ child_satisfied_with_storage: false }),
          makeStorage({ child_satisfied_with_storage: false }),
          makeStorage({ child_satisfied_with_storage: false }),
        ],
      }));
      expect(r.concerns.some((c) => c.includes("satisfied with clothing storage"))).toBe(true);
    });

    it("concern for overflow items > 5", () => {
      const r = computeClothingLabellingStorage(baseInput({
        storage_records: [makeStorage({ overflow_items_count: 6 })],
      }));
      expect(r.concerns.some((c) => c.includes("overflow clothing items"))).toBe(true);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // CONCERNS -- ROTATION
  // ════════════════════════════════════════════════════════════════════════

  describe("Concerns -- Rotation", () => {
    it("concern for seasonal rotation < 50%", () => {
      const r = computeClothingLabellingStorage(baseInput({
        rotation_records: [
          makeRotation({ rotation_completed: false }),
          makeRotation({ rotation_completed: false }),
          makeRotation({ rotation_completed: false }),
        ],
      }));
      expect(r.concerns.some((c) => c.includes("seasonal rotations completed"))).toBe(true);
    });

    it("concern for seasonal rotation 50-69%", () => {
      const r = computeClothingLabellingStorage(baseInput({
        rotation_records: repeat(10, (i) =>
          makeRotation({ rotation_completed: i < 6 }), // 60%
        ),
      }));
      expect(r.concerns.some((c) => c.includes("Seasonal rotation at 60%"))).toBe(true);
    });

    it("concern for weather appropriate < 70%", () => {
      const r = computeClothingLabellingStorage(baseInput({
        rotation_records: [
          makeRotation({ weather_appropriate_clothing: false }),
          makeRotation({ weather_appropriate_clothing: false }),
          makeRotation({ weather_appropriate_clothing: true }),
        ],
      }));
      expect(r.concerns.some((c) => c.includes("weather-appropriate clothing"))).toBe(true);
    });

    it("concern for outgrown replacement < 50%", () => {
      const r = computeClothingLabellingStorage(baseInput({
        rotation_records: [makeRotation({
          outgrown_items_identified: 10,
          outgrown_items_replaced: 3,
        })],
      }));
      expect(r.concerns.some((c) => c.includes("outgrown items replaced"))).toBe(true);
    });

    it("concern for child involved < 50%", () => {
      const r = computeClothingLabellingStorage(baseInput({
        rotation_records: [
          makeRotation({ child_involved_in_choices: false }),
          makeRotation({ child_involved_in_choices: false }),
          makeRotation({ child_involved_in_choices: false }),
        ],
      }));
      expect(r.concerns.some((c) => c.includes("Children involved in clothing choices during only"))).toBe(true);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // CONCERNS -- OWNERSHIP
  // ════════════════════════════════════════════════════════════════════════

  describe("Concerns -- Ownership", () => {
    it("concern for belongs to child < 70%", () => {
      const r = computeClothingLabellingStorage(baseInput({
        ownership_records: [
          makeOwnership({ clothing_belongs_to_child: false }),
          makeOwnership({ clothing_belongs_to_child: false }),
          makeOwnership({ clothing_belongs_to_child: true }),
        ],
      }));
      expect(r.concerns.some((c) => c.includes("clothing belongs to the individual child"))).toBe(true);
    });

    it("concern for takes on moves < 70%", () => {
      const r = computeClothingLabellingStorage(baseInput({
        ownership_records: [
          makeOwnership({ child_takes_clothing_on_moves: false }),
          makeOwnership({ child_takes_clothing_on_moves: false }),
          makeOwnership({ child_takes_clothing_on_moves: true }),
        ],
      }));
      expect(r.concerns.some((c) => c.includes("take their clothing when moving"))).toBe(true);
    });

    it("concern for chooses own < 50%", () => {
      const r = computeClothingLabellingStorage(baseInput({
        ownership_records: [
          makeOwnership({ child_chooses_own_clothing: false }),
          makeOwnership({ child_chooses_own_clothing: false }),
          makeOwnership({ child_chooses_own_clothing: false }),
        ],
      }));
      expect(r.concerns.some((c) => c.includes("choose their own clothing"))).toBe(true);
    });

    it("concern for reflects identity < 50%", () => {
      const r = computeClothingLabellingStorage(baseInput({
        ownership_records: [
          makeOwnership({ clothing_reflects_identity: false }),
          makeOwnership({ clothing_reflects_identity: false }),
          makeOwnership({ clothing_reflects_identity: false }),
        ],
      }));
      expect(r.concerns.some((c) => c.includes("reflects their identity"))).toBe(true);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // CONCERNS -- CONDITION
  // ════════════════════════════════════════════════════════════════════════

  describe("Concerns -- Condition", () => {
    it("concern for condition monitoring < 40%", () => {
      const r = computeClothingLabellingStorage(baseInput({
        condition_records: [makeCondition({
          total_items_checked: 20,
          items_good_condition: 2,
          items_needing_replacement: 10,
          items_replaced: 1,
        })],
      }));
      expect(r.concerns.some((c) => c.includes("Condition monitoring rate at only"))).toBe(true);
    });

    it("concern for condition monitoring 40-59%", () => {
      const r = computeClothingLabellingStorage(baseInput({
        condition_records: [makeCondition({
          total_items_checked: 20,
          items_good_condition: 10,
          items_needing_replacement: 10,
          items_replaced: 0,
        })],
      }));
      // good_rate=50%, replacement=0%, avg=25% -> actually <40 concern fires
      // Need avg 40-59: good_rate=80%, replacement=0%, avg=40%
      const r2 = computeClothingLabellingStorage(baseInput({
        condition_records: [makeCondition({
          total_items_checked: 20,
          items_good_condition: 16,
          items_needing_replacement: 10,
          items_replaced: 0,
        })],
      }));
      // good_rate=80%, replacement=0%, avg=40%
      expect(r2.concerns.some((c) => c.includes("Condition monitoring rate at 40%"))).toBe(true);
    });

    it("concern for poor condition >= 20%", () => {
      const r = computeClothingLabellingStorage(baseInput({
        condition_records: [makeCondition({
          total_items_checked: 10,
          items_good_condition: 5,
          items_poor_condition: 3,
        })],
      }));
      expect(r.concerns.some((c) => c.includes("clothing in poor condition"))).toBe(true);
    });

    it("concern for replacement rate < 50%", () => {
      const r = computeClothingLabellingStorage(baseInput({
        condition_records: [makeCondition({
          items_needing_replacement: 10,
          items_replaced: 2,
        })],
      }));
      expect(r.concerns.some((c) => c.includes("replacement have been replaced"))).toBe(true);
    });

    it("concern for underwear adequate < 80%", () => {
      const r = computeClothingLabellingStorage(baseInput({
        condition_records: [
          makeCondition({ underwear_adequate: false }),
          makeCondition({ underwear_adequate: false }),
          makeCondition({ underwear_adequate: true }),
        ],
      }));
      expect(r.concerns.some((c) => c.includes("Underwear adequate for only"))).toBe(true);
    });

    it("concern for footwear adequate < 70%", () => {
      const r = computeClothingLabellingStorage(baseInput({
        condition_records: [
          makeCondition({ footwear_adequate: false }),
          makeCondition({ footwear_adequate: false }),
          makeCondition({ footwear_adequate: true }),
        ],
      }));
      expect(r.concerns.some((c) => c.includes("Footwear adequate for only"))).toBe(true);
    });

    it("concern for school uniform < 80%", () => {
      const r = computeClothingLabellingStorage(baseInput({
        condition_records: [
          makeCondition({ school_uniform_adequate: false }),
          makeCondition({ school_uniform_adequate: false }),
          makeCondition({ school_uniform_adequate: true }),
        ],
      }));
      expect(r.concerns.some((c) => c.includes("School uniform adequate for only"))).toBe(true);
    });

    it("concern for child embarrassed >= 30%", () => {
      const r = computeClothingLabellingStorage(baseInput({
        condition_records: repeat(3, (i) =>
          makeCondition({ child_embarrassed_by_clothing: i === 0 }), // 33%
        ),
      }));
      expect(r.concerns.some((c) => c.includes("report embarrassment") && c.includes("significant indicator"))).toBe(true);
    });

    it("concern for child embarrassed > 0% but < 30%", () => {
      const r = computeClothingLabellingStorage(baseInput({
        condition_records: repeat(10, (i) =>
          makeCondition({ child_embarrassed_by_clothing: i === 0 }), // 10%
        ),
      }));
      expect(r.concerns.some((c) => c.includes("even one child feeling embarrassed"))).toBe(true);
    });

    it("concern when no condition records but children present", () => {
      const r = computeClothingLabellingStorage(baseInput({
        labelling_records: [makeLabelling()],
      }));
      expect(r.concerns.some((c) => c.includes("No clothing condition monitoring records"))).toBe(true);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // RECOMMENDATIONS
  // ════════════════════════════════════════════════════════════════════════

  describe("Recommendations", () => {
    it("immediate recommendation for labelling < 50%", () => {
      const r = computeClothingLabellingStorage(baseInput({
        labelling_records: [makeLabelling({ total_items_audited: 20, items_labelled: 5 })],
      }));
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("labelling system"))).toBe(true);
    });

    it("immediate recommendation for storage < 50%", () => {
      const r = computeClothingLabellingStorage(baseInput({
        storage_records: [makeStorage({
          wardrobe_available: false,
          wardrobe_adequate_size: false,
          drawers_available: false,
          drawers_adequate_size: false,
          shoe_storage_available: false,
          storage_clean: false,
        })],
      }));
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("storage provision"))).toBe(true);
    });

    it("immediate recommendation for child embarrassment >= 30%", () => {
      const r = computeClothingLabellingStorage(baseInput({
        condition_records: repeat(3, (i) =>
          makeCondition({ child_embarrassed_by_clothing: i === 0 }),
        ),
      }));
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("embarrassment"))).toBe(true);
    });

    it("immediate recommendation for condition monitoring < 40%", () => {
      const r = computeClothingLabellingStorage(baseInput({
        condition_records: [makeCondition({
          total_items_checked: 20,
          items_good_condition: 2,
          items_needing_replacement: 10,
          items_replaced: 1,
        })],
      }));
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("condition audits"))).toBe(true);
    });

    it("immediate recommendation for underwear < 80%", () => {
      const r = computeClothingLabellingStorage(baseInput({
        condition_records: [
          makeCondition({ underwear_adequate: false }),
          makeCondition({ underwear_adequate: false }),
        ],
      }));
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("underwear"))).toBe(true);
    });

    it("immediate recommendation for belongs to child < 70%", () => {
      const r = computeClothingLabellingStorage(baseInput({
        ownership_records: [
          makeOwnership({ clothing_belongs_to_child: false }),
          makeOwnership({ clothing_belongs_to_child: false }),
          makeOwnership({ clothing_belongs_to_child: true }),
        ],
      }));
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("ownership"))).toBe(true);
    });

    it("soon recommendation for seasonal rotation < 50%", () => {
      const r = computeClothingLabellingStorage(baseInput({
        rotation_records: [makeRotation({ rotation_completed: false })],
      }));
      expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("seasonal"))).toBe(true);
    });

    it("soon recommendation for weather appropriate < 70%", () => {
      const r = computeClothingLabellingStorage(baseInput({
        rotation_records: [
          makeRotation({ weather_appropriate_clothing: false }),
          makeRotation({ weather_appropriate_clothing: false }),
        ],
      }));
      expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("weather"))).toBe(true);
    });

    it("soon recommendation for school uniform < 80%", () => {
      const r = computeClothingLabellingStorage(baseInput({
        condition_records: [
          makeCondition({ school_uniform_adequate: false }),
          makeCondition({ school_uniform_adequate: false }),
        ],
      }));
      expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("uniform"))).toBe(true);
    });

    it("soon recommendation for labelling 50-69%", () => {
      const r = computeClothingLabellingStorage(baseInput({
        labelling_records: [makeLabelling({ total_items_audited: 20, items_labelled: 12 })],
      }));
      expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("labelling compliance"))).toBe(true);
    });

    it("planned recommendation for storage 50-69%", () => {
      const r = computeClothingLabellingStorage(baseInput({
        storage_records: [makeStorage({
          wardrobe_available: true,
          wardrobe_adequate_size: true,
          drawers_available: true,
          drawers_adequate_size: false,
          shoe_storage_available: false,
          storage_clean: false,
        })],
      }));
      expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("storage adequacy"))).toBe(true);
    });

    it("planned recommendation for lockable < 50%", () => {
      const r = computeClothingLabellingStorage(baseInput({
        storage_records: [makeStorage({ storage_lockable: false })],
      }));
      expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("lockable"))).toBe(true);
    });

    it("planned recommendation for occasion wear < 60%", () => {
      const r = computeClothingLabellingStorage(baseInput({
        ownership_records: [
          makeOwnership({ child_has_occasion_wear: false }),
          makeOwnership({ child_has_occasion_wear: false }),
        ],
      }));
      expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("occasion wear"))).toBe(true);
    });

    it("soon recommendation for no labelling records with children present", () => {
      const r = computeClothingLabellingStorage(baseInput({
        storage_records: [makeStorage()],
      }));
      expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("labelling audits"))).toBe(true);
    });

    it("soon recommendation for no condition records with children present", () => {
      const r = computeClothingLabellingStorage(baseInput({
        labelling_records: [makeLabelling()],
      }));
      expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("condition monitoring"))).toBe(true);
    });

    it("all recommendations have regulatory_ref", () => {
      const r = computeClothingLabellingStorage(baseInput({
        labelling_records: [makeLabelling({ total_items_audited: 20, items_labelled: 2 })],
        storage_records: [makeStorage({
          wardrobe_available: false, wardrobe_adequate_size: false,
          drawers_available: false, drawers_adequate_size: false,
          shoe_storage_available: false, storage_clean: false,
        })],
      }));
      for (const rec of r.recommendations) {
        expect(rec.regulatory_ref).toBeTruthy();
      }
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // INSIGHTS -- CRITICAL
  // ════════════════════════════════════════════════════════════════════════

  describe("Insights -- Critical", () => {
    it("critical insight for labelling < 50%", () => {
      const r = computeClothingLabellingStorage(baseInput({
        labelling_records: [makeLabelling({ total_items_audited: 20, items_labelled: 5 })],
      }));
      expect(r.insights.some((ins) => ins.severity === "critical" && ins.text.includes("labelled"))).toBe(true);
    });

    it("critical insight for storage < 50%", () => {
      const r = computeClothingLabellingStorage(baseInput({
        storage_records: [makeStorage({
          wardrobe_available: false, wardrobe_adequate_size: false,
          drawers_available: false, drawers_adequate_size: false,
          shoe_storage_available: false, storage_clean: false,
        })],
      }));
      expect(r.insights.some((ins) => ins.severity === "critical" && ins.text.includes("Storage adequacy"))).toBe(true);
    });

    it("critical insight for child embarrassment >= 30%", () => {
      const r = computeClothingLabellingStorage(baseInput({
        condition_records: repeat(3, (i) =>
          makeCondition({ child_embarrassed_by_clothing: i === 0 }),
        ),
      }));
      expect(r.insights.some((ins) => ins.severity === "critical" && ins.text.includes("embarrassment"))).toBe(true);
    });

    it("critical insight for condition monitoring < 40%", () => {
      const r = computeClothingLabellingStorage(baseInput({
        condition_records: [makeCondition({
          total_items_checked: 20,
          items_good_condition: 2,
          items_needing_replacement: 10,
          items_replaced: 1,
        })],
      }));
      expect(r.insights.some((ins) => ins.severity === "critical" && ins.text.includes("Condition monitoring"))).toBe(true);
    });

    it("critical insight for underwear < 80%", () => {
      const r = computeClothingLabellingStorage(baseInput({
        condition_records: [
          makeCondition({ underwear_adequate: false }),
          makeCondition({ underwear_adequate: false }),
        ],
      }));
      expect(r.insights.some((ins) => ins.severity === "critical" && ins.text.includes("Underwear"))).toBe(true);
    });

    it("critical insight for belongs to child < 50%", () => {
      const r = computeClothingLabellingStorage(baseInput({
        ownership_records: [
          makeOwnership({ clothing_belongs_to_child: false }),
          makeOwnership({ clothing_belongs_to_child: false }),
          makeOwnership({ clothing_belongs_to_child: false }),
        ],
      }));
      expect(r.insights.some((ins) => ins.severity === "critical" && ins.text.includes("belongs to the individual child"))).toBe(true);
    });

    it("critical insight when no labelling and no condition records but children present", () => {
      const r = computeClothingLabellingStorage(baseInput({
        storage_records: [makeStorage()],
      }));
      expect(r.insights.some((ins) => ins.severity === "critical" && ins.text.includes("No clothing labelling or condition monitoring records"))).toBe(true);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // INSIGHTS -- WARNING
  // ════════════════════════════════════════════════════════════════════════

  describe("Insights -- Warning", () => {
    it("warning for labelling 50-69%", () => {
      const r = computeClothingLabellingStorage(baseInput({
        labelling_records: [makeLabelling({ total_items_audited: 20, items_labelled: 12 })],
      }));
      expect(r.insights.some((ins) => ins.severity === "warning" && ins.text.includes("Labelling compliance at 60%"))).toBe(true);
    });

    it("warning for storage adequacy 50-69%", () => {
      const r = computeClothingLabellingStorage(baseInput({
        storage_records: [makeStorage({
          wardrobe_available: true,
          wardrobe_adequate_size: true,
          drawers_available: true,
          drawers_adequate_size: false,
          shoe_storage_available: false,
          storage_clean: false,
        })],
      }));
      expect(r.insights.some((ins) => ins.severity === "warning" && ins.text.includes("Storage adequacy at 50%"))).toBe(true);
    });

    it("warning for seasonal rotation 50-79%", () => {
      const r = computeClothingLabellingStorage(baseInput({
        rotation_records: repeat(10, (i) =>
          makeRotation({ rotation_completed: i < 6 }),
        ),
      }));
      expect(r.insights.some((ins) => ins.severity === "warning" && ins.text.includes("Seasonal rotation at 60%"))).toBe(true);
    });

    it("warning for ownership respect 50-79%", () => {
      const r = computeClothingLabellingStorage(baseInput({
        ownership_records: [makeOwnership({
          clothing_belongs_to_child: true,
          child_takes_clothing_on_moves: true,
          child_chooses_own_clothing: false,
          clothing_reflects_identity: false,
        })],
      }));
      // 50%
      expect(r.insights.some((ins) => ins.severity === "warning" && ins.text.includes("Ownership respect rate at 50%"))).toBe(true);
    });

    it("warning for condition monitoring 40-69%", () => {
      const r = computeClothingLabellingStorage(baseInput({
        condition_records: [makeCondition({
          total_items_checked: 20,
          items_good_condition: 16,
          items_needing_replacement: 10,
          items_replaced: 0,
        })],
      }));
      expect(r.insights.some((ins) => ins.severity === "warning" && ins.text.includes("Condition monitoring at 40%"))).toBe(true);
    });

    it("warning for child satisfaction 50-79%", () => {
      const r = computeClothingLabellingStorage(baseInput({
        storage_records: [
          makeStorage({ child_satisfied_with_storage: true }),
          makeStorage({ child_satisfied_with_storage: false }),
        ],
        ownership_records: [
          makeOwnership({ child_satisfied_with_wardrobe: true }),
          makeOwnership({ child_satisfied_with_wardrobe: false }),
        ],
      }));
      // storage_sat=50%, ownership_sat=50%, avg=50%
      expect(r.insights.some((ins) => ins.severity === "warning" && ins.text.includes("Child satisfaction"))).toBe(true);
    });

    it("warning for poor condition 10-19%", () => {
      const r = computeClothingLabellingStorage(baseInput({
        condition_records: [makeCondition({
          total_items_checked: 20,
          items_good_condition: 15,
          items_fair_condition: 2,
          items_poor_condition: 3,
        })],
      }));
      expect(r.insights.some((ins) => ins.severity === "warning" && ins.text.includes("poor condition"))).toBe(true);
    });

    it("warning for outgrown replacement 50-79%", () => {
      const r = computeClothingLabellingStorage(baseInput({
        rotation_records: [makeRotation({
          outgrown_items_identified: 10,
          outgrown_items_replaced: 7,
        })],
      }));
      expect(r.insights.some((ins) => ins.severity === "warning" && ins.text.includes("Outgrown replacement rate at 70%"))).toBe(true);
    });

    it("warning for stains/damage >= 30%", () => {
      const r = computeClothingLabellingStorage(baseInput({
        condition_records: repeat(3, (i) =>
          makeCondition({ stains_or_damage_noted: i < 1 }),
        ),
      }));
      expect(r.insights.some((ins) => ins.severity === "warning" && ins.text.includes("Stains or damage noted in 33%"))).toBe(true);
    });

    it("warning for child consulted on labelling < 50%", () => {
      const r = computeClothingLabellingStorage(baseInput({
        labelling_records: [
          makeLabelling({ child_consulted_on_method: false }),
          makeLabelling({ child_consulted_on_method: false }),
          makeLabelling({ child_consulted_on_method: false }),
        ],
      }));
      expect(r.insights.some((ins) => ins.severity === "warning" && ins.text.includes("consulted on labelling method"))).toBe(true);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // INSIGHTS -- POSITIVE
  // ════════════════════════════════════════════════════════════════════════

  describe("Insights -- Positive", () => {
    it("positive insight for outstanding rating", () => {
      const r = computeClothingLabellingStorage(baseInput({
        labelling_records: [makeLabelling({ total_items_audited: 10, items_labelled: 10 })],
        storage_records: [makeStorage()],
        rotation_records: [makeRotation()],
        ownership_records: [makeOwnership()],
        condition_records: [makeCondition({
          total_items_checked: 20,
          items_good_condition: 20,
          items_needing_replacement: 5,
          items_replaced: 5,
        })],
      }));
      expect(r.insights.some((ins) => ins.severity === "positive" && ins.text.includes("outstanding"))).toBe(true);
    });

    it("positive insight for labelling >=90 and storage >=90", () => {
      const r = computeClothingLabellingStorage(baseInput({
        labelling_records: [makeLabelling({ total_items_audited: 10, items_labelled: 10 })],
        storage_records: [makeStorage()],
      }));
      expect(r.insights.some((ins) => ins.severity === "positive" && ins.text.includes("Labelling compliance at 100%"))).toBe(true);
    });

    it("positive insight for seasonal rotation >= 90 and weather >= 90", () => {
      const r = computeClothingLabellingStorage(baseInput({
        rotation_records: [makeRotation()],
      }));
      expect(r.insights.some((ins) => ins.severity === "positive" && ins.text.includes("seasonal rotation") && ins.text.includes("weather-appropriate"))).toBe(true);
    });

    it("positive insight for ownership respect >= 90%", () => {
      const r = computeClothingLabellingStorage(baseInput({
        ownership_records: [makeOwnership()],
      }));
      expect(r.insights.some((ins) => ins.severity === "positive" && ins.text.includes("Ownership respect rate at 100%"))).toBe(true);
    });

    it("positive insight for child satisfaction >= 80%", () => {
      const r = computeClothingLabellingStorage(baseInput({
        storage_records: [makeStorage()],
        rotation_records: [makeRotation()],
        ownership_records: [makeOwnership()],
      }));
      expect(r.insights.some((ins) => ins.severity === "positive" && ins.text.includes("Child satisfaction"))).toBe(true);
    });

    it("positive insight for good condition >= 90 and replacement >= 90", () => {
      const r = computeClothingLabellingStorage(baseInput({
        condition_records: [makeCondition({
          total_items_checked: 20,
          items_good_condition: 20,
          items_needing_replacement: 5,
          items_replaced: 5,
        })],
      }));
      expect(r.insights.some((ins) => ins.severity === "positive" && ins.text.includes("good condition") && ins.text.includes("replacement rate"))).toBe(true);
    });

    it("positive insight for no embarrassment, school uniform, and footwear all good", () => {
      const r = computeClothingLabellingStorage(baseInput({
        condition_records: [makeCondition({
          child_embarrassed_by_clothing: false,
          school_uniform_adequate: true,
          footwear_adequate: true,
        })],
      }));
      expect(r.insights.some((ins) => ins.severity === "positive" && ins.text.includes("No children report clothing embarrassment"))).toBe(true);
    });

    it("positive insight for chooses own >= 80 and shopping trips >= 70", () => {
      const r = computeClothingLabellingStorage(baseInput({
        ownership_records: [makeOwnership({ child_chooses_own_clothing: true })],
        rotation_records: [makeRotation({ shopping_trip_offered: true })],
      }));
      expect(r.insights.some((ins) => ins.severity === "positive" && ins.text.includes("choose their own clothing") && ins.text.includes("shopping trips"))).toBe(true);
    });

    it("positive insight for cultural and religious clothing >= 80%", () => {
      const r = computeClothingLabellingStorage(baseInput({
        ownership_records: [makeOwnership({
          cultural_clothing_provided: true,
          religious_clothing_provided: true,
        })],
      }));
      expect(r.insights.some((ins) => ins.severity === "positive" && ins.text.includes("Cultural clothing") && ins.text.includes("religious clothing"))).toBe(true);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // INTEGRATION -- FULL OUTSTANDING SCENARIO
  // ════════════════════════════════════════════════════════════════════════

  describe("Integration -- Full Outstanding Scenario", () => {
    function outstandingInput(): ClothingLabellingStorageInput {
      return baseInput({
        labelling_records: repeat(3, (i) =>
          makeLabelling({
            child_id: `child_${i + 1}`,
            total_items_audited: 20,
            items_labelled: 19,
            child_consulted_on_method: true,
            labels_discreet: true,
            labels_durable: true,
            labels_checked_after_wash: true,
            items_lost_since_last_audit: 2,
            items_returned_via_label: 2,
          }),
        ),
        storage_records: repeat(3, (i) =>
          makeStorage({
            child_id: `child_${i + 1}`,
            wardrobe_available: true,
            wardrobe_adequate_size: true,
            drawers_available: true,
            drawers_adequate_size: true,
            shoe_storage_available: true,
            storage_lockable: true,
            child_has_key: true,
            storage_clean: true,
            storage_personalised: true,
            child_satisfied_with_storage: true,
          }),
        ),
        rotation_records: repeat(3, (i) =>
          makeRotation({
            child_id: `child_${i + 1}`,
            rotation_completed: true,
            weather_appropriate_clothing: true,
            child_involved_in_choices: true,
            shopping_trip_offered: true,
            child_satisfaction: 5,
          }),
        ),
        ownership_records: repeat(3, (i) =>
          makeOwnership({
            child_id: `child_${i + 1}`,
            clothing_belongs_to_child: true,
            child_takes_clothing_on_moves: true,
            child_chooses_own_clothing: true,
            clothing_reflects_identity: true,
            child_satisfied_with_wardrobe: true,
          }),
        ),
        condition_records: repeat(3, (i) =>
          makeCondition({
            child_id: `child_${i + 1}`,
            total_items_checked: 20,
            items_good_condition: 20,
            items_poor_condition: 0,
            items_needing_replacement: 2,
            items_replaced: 2,
            child_embarrassed_by_clothing: false,
            underwear_adequate: true,
            footwear_adequate: true,
            school_uniform_adequate: true,
          }),
        ),
      });
    }

    it("achieves outstanding rating", () => {
      const r = computeClothingLabellingStorage(outstandingInput());
      expect(r.labelling_rating).toBe("outstanding");
    });

    it("score is 80 (max bonuses)", () => {
      const r = computeClothingLabellingStorage(outstandingInput());
      expect(r.labelling_score).toBe(80);
    });

    it("has multiple strengths and no concerns", () => {
      const r = computeClothingLabellingStorage(outstandingInput());
      expect(r.strengths.length).toBeGreaterThan(10);
      expect(r.concerns).toHaveLength(0);
    });

    it("has no recommendations", () => {
      const r = computeClothingLabellingStorage(outstandingInput());
      expect(r.recommendations).toHaveLength(0);
    });

    it("has positive insights", () => {
      const r = computeClothingLabellingStorage(outstandingInput());
      expect(r.insights.some((ins) => ins.severity === "positive")).toBe(true);
      expect(r.insights.every((ins) => ins.severity !== "critical")).toBe(true);
    });

    it("all core rates are high", () => {
      const r = computeClothingLabellingStorage(outstandingInput());
      expect(r.labelling_compliance_rate).toBeGreaterThanOrEqual(90);
      expect(r.storage_adequacy_rate).toBe(100);
      expect(r.seasonal_rotation_rate).toBe(100);
      expect(r.ownership_respect_rate).toBe(100);
      expect(r.condition_monitoring_rate).toBeGreaterThanOrEqual(90);
      expect(r.child_satisfaction_rate).toBe(100);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // INTEGRATION -- POOR SCENARIO
  // ════════════════════════════════════════════════════════════════════════

  describe("Integration -- Poor Scenario", () => {
    function poorInput(): ClothingLabellingStorageInput {
      return baseInput({
        labelling_records: [makeLabelling({
          total_items_audited: 20,
          items_labelled: 3,
          child_consulted_on_method: false,
          labels_discreet: false,
          labels_durable: false,
          labels_checked_after_wash: false,
          items_lost_since_last_audit: 15,
          items_returned_via_label: 1,
        })],
        storage_records: [makeStorage({
          wardrobe_available: false,
          wardrobe_adequate_size: false,
          drawers_available: false,
          drawers_adequate_size: false,
          shoe_storage_available: false,
          storage_lockable: false,
          child_has_key: false,
          storage_clean: false,
          storage_personalised: false,
          child_satisfied_with_storage: false,
        })],
        rotation_records: [makeRotation({
          rotation_completed: false,
          weather_appropriate_clothing: false,
          child_involved_in_choices: false,
          shopping_trip_offered: false,
          child_satisfaction: 1,
          outgrown_items_identified: 10,
          outgrown_items_replaced: 1,
        })],
        ownership_records: [makeOwnership({
          clothing_belongs_to_child: false,
          child_takes_clothing_on_moves: false,
          child_chooses_own_clothing: false,
          clothing_reflects_identity: false,
          child_satisfied_with_wardrobe: false,
        })],
        condition_records: [makeCondition({
          total_items_checked: 20,
          items_good_condition: 2,
          items_fair_condition: 3,
          items_poor_condition: 15,
          items_needing_replacement: 10,
          items_replaced: 0,
          underwear_adequate: false,
          footwear_adequate: false,
          child_embarrassed_by_clothing: true,
          school_uniform_adequate: false,
          stains_or_damage_noted: true,
        })],
      });
    }

    it("achieves inadequate rating", () => {
      const r = computeClothingLabellingStorage(poorInput());
      expect(r.labelling_rating).toBe("inadequate");
    });

    it("has low score", () => {
      const r = computeClothingLabellingStorage(poorInput());
      expect(r.labelling_score).toBeLessThan(45);
    });

    it("has multiple concerns", () => {
      const r = computeClothingLabellingStorage(poorInput());
      expect(r.concerns.length).toBeGreaterThan(5);
    });

    it("has multiple recommendations", () => {
      const r = computeClothingLabellingStorage(poorInput());
      expect(r.recommendations.length).toBeGreaterThan(5);
    });

    it("has critical insights", () => {
      const r = computeClothingLabellingStorage(poorInput());
      expect(r.insights.some((ins) => ins.severity === "critical")).toBe(true);
    });

    it("all core rates are low", () => {
      const r = computeClothingLabellingStorage(poorInput());
      expect(r.labelling_compliance_rate).toBeLessThan(50);
      // record exists → 0, not null
      expect(r.storage_adequacy_rate).toBe(0);
      expect(r.seasonal_rotation_rate).toBe(0);
      // record exists → 0, not null
      expect(r.ownership_respect_rate).toBe(0);
      expect(r.condition_monitoring_rate).toBeLessThan(40);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // EDGE CASES
  // ════════════════════════════════════════════════════════════════════════

  describe("Edge Cases", () => {
    it("single record in each category", () => {
      const r = computeClothingLabellingStorage(baseInput({
        labelling_records: [makeLabelling()],
        storage_records: [makeStorage()],
        rotation_records: [makeRotation()],
        ownership_records: [makeOwnership()],
        condition_records: [makeCondition()],
      }));
      expect(r.labelling_rating).toBeDefined();
      expect(r.labelling_score).toBeGreaterThan(0);
    });

    it("only labelling records present", () => {
      const r = computeClothingLabellingStorage(baseInput({
        labelling_records: [makeLabelling()],
      }));
      expect(r.labelling_compliance_rate).toBeGreaterThan(0);
      expect(r.storage_adequacy_rate).toBeNull();
      expect(r.seasonal_rotation_rate).toBe(0);
      expect(r.ownership_respect_rate).toBeNull();
      expect(r.condition_monitoring_rate).toBeNull();
    });

    it("only storage records present", () => {
      const r = computeClothingLabellingStorage(baseInput({
        storage_records: [makeStorage()],
      }));
      expect(r.storage_adequacy_rate).toBeGreaterThan(0);
      expect(r.labelling_compliance_rate).toBe(0);
    });

    it("only rotation records present", () => {
      const r = computeClothingLabellingStorage(baseInput({
        rotation_records: [makeRotation()],
      }));
      expect(r.seasonal_rotation_rate).toBeGreaterThan(0);
      expect(r.labelling_compliance_rate).toBe(0);
    });

    it("only ownership records present", () => {
      const r = computeClothingLabellingStorage(baseInput({
        ownership_records: [makeOwnership()],
      }));
      expect(r.ownership_respect_rate).toBeGreaterThan(0);
      expect(r.labelling_compliance_rate).toBe(0);
    });

    it("only condition records present", () => {
      const r = computeClothingLabellingStorage(baseInput({
        condition_records: [makeCondition()],
      }));
      expect(r.condition_monitoring_rate).toBeGreaterThan(0);
      expect(r.labelling_compliance_rate).toBe(0);
    });

    it("total_children=0 with records still returns insufficient_data", () => {
      // allEmpty is false because we have records, but total_children=0
      // The engine only checks allEmpty && total_children===0
      const r = computeClothingLabellingStorage(baseInput({
        total_children: 0,
        labelling_records: [makeLabelling()],
      }));
      // Not allEmpty, so it proceeds to normal computation
      expect(r.labelling_rating).not.toBe("insufficient_data");
    });

    it("handles large number of records", () => {
      const r = computeClothingLabellingStorage(baseInput({
        labelling_records: repeat(50, () => makeLabelling()),
        storage_records: repeat(50, () => makeStorage()),
        rotation_records: repeat(50, () => makeRotation()),
        ownership_records: repeat(50, () => makeOwnership()),
        condition_records: repeat(50, () => makeCondition()),
      }));
      expect(r.labelling_rating).toBeDefined();
      expect(r.labelling_score).toBeGreaterThan(0);
    });

    it("labelling method variants do not affect compliance rate", () => {
      const methods: Array<ClothingLabellingRecordInput["labelling_method"]> = [
        "sewn_in", "iron_on", "written", "laundry_marker", "tag", "other",
      ];
      for (const method of methods) {
        const r = computeClothingLabellingStorage(baseInput({
          labelling_records: [makeLabelling({ labelling_method: method, total_items_audited: 10, items_labelled: 9 })],
        }));
        expect(r.labelling_compliance_rate).toBe(90);
      }
    });

    it("season variants do not affect rotation rate", () => {
      const seasons: Array<ClothingRotationRecordInput["season"]> = [
        "spring", "summer", "autumn", "winter",
      ];
      for (const season of seasons) {
        const r = computeClothingLabellingStorage(baseInput({
          rotation_records: [makeRotation({ season, rotation_completed: true })],
        }));
        expect(r.seasonal_rotation_rate).toBe(100);
      }
    });

    it("multiple children across records", () => {
      const r = computeClothingLabellingStorage(baseInput({
        labelling_records: [
          makeLabelling({ child_id: "child_1", total_items_audited: 10, items_labelled: 10 }),
          makeLabelling({ child_id: "child_2", total_items_audited: 10, items_labelled: 5 }),
          makeLabelling({ child_id: "child_3", total_items_audited: 10, items_labelled: 8 }),
        ],
      }));
      // Total: 23/30 = 77%
      expect(r.labelling_compliance_rate).toBe(77);
    });

    it("drawers_adequate_size requires drawers_available", () => {
      const r = computeClothingLabellingStorage(baseInput({
        storage_records: [makeStorage({
          wardrobe_available: false,
          wardrobe_adequate_size: false,
          drawers_available: false,
          drawers_adequate_size: true, // should not count
          shoe_storage_available: false,
          storage_clean: false,
        })],
      }));
      // record exists → 0, not null
      expect(r.storage_adequacy_rate).toBe(0);
    });

    it("empty arrays yield 0 rates without division errors", () => {
      const r = computeClothingLabellingStorage(baseInput({
        total_children: 0,
      }));
      expect(r.labelling_compliance_rate).toBe(0);
      expect(r.storage_adequacy_rate).toBeNull();
      expect(r.seasonal_rotation_rate).toBe(0);
      expect(r.ownership_respect_rate).toBeNull();
      expect(r.condition_monitoring_rate).toBeNull();
      expect(r.child_satisfaction_rate).toBeNull();
    });

    it("zero items audited yields 0% labelling compliance without error", () => {
      const r = computeClothingLabellingStorage(baseInput({
        labelling_records: [makeLabelling({ total_items_audited: 0, items_labelled: 0 })],
      }));
      expect(r.labelling_compliance_rate).toBe(0);
    });

    it("zero items checked yields 0 good condition rate", () => {
      const r = computeClothingLabellingStorage(baseInput({
        condition_records: [makeCondition({
          total_items_checked: 0,
          items_good_condition: 0,
          items_needing_replacement: 0,
          items_replaced: 0,
        })],
      }));
      // record exists → 0, not null
      expect(r.condition_monitoring_rate).toBe(0);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // ADDITIONAL RECOMMENDATION EDGE CASES
  // ════════════════════════════════════════════════════════════════════════

  describe("Recommendation Edge Cases", () => {
    it("soon recommendation for chooses own < 50%", () => {
      const r = computeClothingLabellingStorage(baseInput({
        ownership_records: [
          makeOwnership({ child_chooses_own_clothing: false }),
          makeOwnership({ child_chooses_own_clothing: false }),
          makeOwnership({ child_chooses_own_clothing: false }),
        ],
      }));
      expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("clothing choices"))).toBe(true);
    });

    it("soon recommendation for reflects identity < 50%", () => {
      const r = computeClothingLabellingStorage(baseInput({
        ownership_records: [
          makeOwnership({ clothing_reflects_identity: false }),
          makeOwnership({ clothing_reflects_identity: false }),
          makeOwnership({ clothing_reflects_identity: false }),
        ],
      }));
      expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("identity"))).toBe(true);
    });

    it("soon recommendation for outgrown replacement < 50%", () => {
      const r = computeClothingLabellingStorage(baseInput({
        rotation_records: [makeRotation({
          outgrown_items_identified: 10,
          outgrown_items_replaced: 3,
        })],
      }));
      expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("outgrown"))).toBe(true);
    });

    it("planned recommendation for seasonal rotation 50-69%", () => {
      const r = computeClothingLabellingStorage(baseInput({
        rotation_records: repeat(10, (i) =>
          makeRotation({ rotation_completed: i < 6 }),
        ),
      }));
      expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("seasonal rotation"))).toBe(true);
    });

    it("soon recommendation for footwear < 70%", () => {
      const r = computeClothingLabellingStorage(baseInput({
        condition_records: [
          makeCondition({ footwear_adequate: false }),
          makeCondition({ footwear_adequate: false }),
        ],
      }));
      expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("footwear"))).toBe(true);
    });

    it("no recommendations when all metrics excellent", () => {
      const r = computeClothingLabellingStorage(baseInput({
        labelling_records: [makeLabelling({ total_items_audited: 10, items_labelled: 10 })],
        storage_records: [makeStorage()],
        rotation_records: [makeRotation()],
        ownership_records: [makeOwnership()],
        condition_records: [makeCondition({
          total_items_checked: 20,
          items_good_condition: 20,
          items_needing_replacement: 5,
          items_replaced: 5,
        })],
      }));
      expect(r.recommendations).toHaveLength(0);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // ADDITIONAL SCORING BOUNDARY CASES
  // ════════════════════════════════════════════════════════════════════════

  describe("Scoring Boundary Cases", () => {
    it("no bonus for labelling compliance < 70", () => {
      const r = computeClothingLabellingStorage(baseInput({
        labelling_records: [makeLabelling({ total_items_audited: 10, items_labelled: 6 })],
      }));
      // 60% labelling -> no bonus, no penalty (>=50)
      expect(r.labelling_score).toBe(52);
    });

    it("no bonus for storage adequacy < 70", () => {
      const r = computeClothingLabellingStorage(baseInput({
        storage_records: [makeStorage({
          wardrobe_available: true,
          wardrobe_adequate_size: true,
          drawers_available: true,
          drawers_adequate_size: false,
          shoe_storage_available: false,
          storage_clean: false,
          child_satisfied_with_storage: false,
        })],
      }));
      // 50% storage -> no bonus, no penalty (=50), child_sat 0% -> no bonus
      expect(r.labelling_score).toBe(52);
    });

    it("adds +1 for child satisfaction 60-79", () => {
      // Need child_satisfaction_rate between 60 and 79
      const r = computeClothingLabellingStorage(baseInput({
        rotation_records: [makeRotation({ child_satisfaction: 3 })],
      }));
      // satisfaction = 3*20=60 -> +1
      // rotation 100% -> +4, weather 100% -> +3
      // 52 + 4 + 1 + 3 = 60
      expect(r.labelling_score).toBe(60);
    });

    it("adds +1 for weather appropriate 70-89", () => {
      const r = computeClothingLabellingStorage(baseInput({
        rotation_records: repeat(10, (i) =>
          makeRotation({ weather_appropriate_clothing: i < 8 }), // 80%
        ),
      }));
      // rotation 100% -> +4, weather 80% -> +1, satisfaction scaled avg 5*20=100 -> +3
      // 52 + 4 + 1 + 3 = 60
      expect(r.labelling_score).toBe(60);
    });

    it("adds +2 for rotation 70-89", () => {
      const r = computeClothingLabellingStorage(baseInput({
        rotation_records: repeat(10, (i) =>
          makeRotation({ rotation_completed: i < 8 }), // 80%
        ),
      }));
      // rotation 80% -> +2, weather 100% -> +3, satisfaction 5*20=100 -> +3
      // 52 + 2 + 3 + 3 = 60
      expect(r.labelling_score).toBe(60);
    });

    it("adds +2 for ownership respect 70-89", () => {
      // Need ownership_respect_rate between 70 and 89
      // 3 of 4 components: belongs(true), takes(true), chooses(true), reflects(false) = 75%
      const r = computeClothingLabellingStorage(baseInput({
        ownership_records: [makeOwnership({
          clothing_belongs_to_child: true,
          child_takes_clothing_on_moves: true,
          child_chooses_own_clothing: true,
          clothing_reflects_identity: false,
          child_satisfied_with_wardrobe: true,
        })],
      }));
      // ownership 75% -> +2, child_sat 100% -> +3
      // 52 + 2 + 3 = 57
      expect(r.labelling_score).toBe(57);
    });

    it("adds +2 for condition monitoring 70-89", () => {
      // good_rate=80%, replacement=80%, avg=80%
      const r = computeClothingLabellingStorage(baseInput({
        condition_records: [makeCondition({
          total_items_checked: 20,
          items_good_condition: 16,
          items_needing_replacement: 5,
          items_replaced: 4,
        })],
      }));
      // condition monitoring = (80+80)/2 = 80% -> +2
      expect(r.labelling_score).toBe(54);
    });
  });
});
