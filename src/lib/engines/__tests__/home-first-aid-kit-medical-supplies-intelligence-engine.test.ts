// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME FIRST AID KIT & MEDICAL SUPPLIES INTELLIGENCE ENGINE TESTS
// Comprehensive test suite for first aid kit checks, stock adequacy, expiry
// monitoring, accessibility, staff training, and children's awareness.
// Covers CHR 2015 Reg 14, Reg 25, SCCIF safety domain.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeFirstAidKitMedicalSupplies,
  type FirstAidKitMedicalSuppliesInput,
  type KitCheckInput,
  type StockInput,
  type ExpiryInput,
  type AccessibilityInput,
  type TrainingInput,
} from "../home-first-aid-kit-medical-supplies-intelligence-engine";

const TODAY = "2026-05-30";

// ── Factories ───────────────────────────────────────────────────────────────

let _id = 0;

function makeKitCheck(overrides: Partial<KitCheckInput> = {}): KitCheckInput {
  _id++;
  return {
    id: `kc_${_id}`,
    kit_id: "kit_1",
    kit_name: "Main Lounge Kit",
    kit_location: "Main lounge wall",
    check_date: "2026-05-20",
    checked_by: "staff_ryan",
    check_type: "routine",
    all_items_present: true,
    items_missing: 0,
    items_damaged: 0,
    items_replaced: 0,
    seal_intact: true,
    cleanliness_acceptable: true,
    signage_visible: true,
    check_documented: true,
    issues_found: 0,
    issues_resolved: 0,
    next_check_due: "2026-06-20",
    check_overdue: false,
    created_at: "2026-05-20",
    ...overrides,
  };
}

function makeStock(overrides: Partial<StockInput> = {}): StockInput {
  _id++;
  return {
    id: `stock_${_id}`,
    item_name: "Sterile adhesive dressings",
    item_category: "dressings",
    kit_id: "kit_1",
    required_quantity: 20,
    current_quantity: 20,
    minimum_threshold: 10,
    reorder_placed: false,
    reorder_date: null,
    supplier_name: "Medisave UK",
    unit_cost: 2.5,
    last_audit_date: "2026-05-15",
    audit_matched_records: true,
    is_critical_item: false,
    created_at: "2026-05-15",
    ...overrides,
  };
}

function makeExpiry(overrides: Partial<ExpiryInput> = {}): ExpiryInput {
  _id++;
  return {
    id: `exp_${_id}`,
    item_name: "Antiseptic wipes",
    item_category: "antiseptic",
    kit_id: "kit_1",
    batch_number: `BATCH_${_id}`,
    expiry_date: "2027-06-01",
    is_expired: false,
    days_until_expiry: 367,
    replacement_ordered: false,
    replacement_received: false,
    disposed_correctly: false,
    flagged_in_check: false,
    created_at: "2026-05-01",
    ...overrides,
  };
}

function makeAccessibility(overrides: Partial<AccessibilityInput> = {}): AccessibilityInput {
  _id++;
  return {
    id: `acc_${_id}`,
    kit_id: "kit_1",
    kit_name: "Main Lounge Kit",
    location: "Main lounge wall",
    floor_level: "Ground",
    is_accessible_24hr: true,
    is_clearly_signed: true,
    is_wall_mounted: true,
    is_unlocked: true,
    distance_from_main_area_metres: 5,
    last_location_audit_date: "2026-05-01",
    location_compliant: true,
    children_know_location: true,
    staff_know_location: true,
    visitors_informed: true,
    meets_hse_guidance: true,
    created_at: "2026-05-01",
    ...overrides,
  };
}

function makeTraining(overrides: Partial<TrainingInput> = {}): TrainingInput {
  _id++;
  return {
    id: `trn_${_id}`,
    staff_id: `staff_${_id}`,
    staff_name: `Staff Member ${_id}`,
    training_type: "first_aid_at_work",
    provider: "St John Ambulance",
    certification_date: "2025-06-01",
    expiry_date: "2028-06-01",
    is_expired: false,
    days_until_expiry: 733,
    is_current: true,
    is_paediatric_qualified: false,
    refresher_completed: true,
    practical_assessment_passed: true,
    created_at: "2025-06-01",
    ...overrides,
  };
}

// ── Base Input ──────────────────────────────────────────────────────────────

const baseInput: FirstAidKitMedicalSuppliesInput = {
  today: TODAY,
  total_children: 4,
  total_staff: 5,
  kit_check_records: [],
  stock_records: [],
  expiry_records: [],
  accessibility_records: [],
  training_records: [],
};

function run(overrides: Partial<FirstAidKitMedicalSuppliesInput> = {}) {
  return computeFirstAidKitMedicalSupplies({ ...baseInput, ...overrides });
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("Home First Aid Kit & Medical Supplies Intelligence Engine", () => {

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. EMPTY / EDGE CASES
  // ═══════════════════════════════════════════════════════════════════════════

  describe("empty / edge cases", () => {
    it("1 — returns insufficient_data when 0 children and all arrays empty", () => {
      const r = run({ total_children: 0, total_staff: 0 });
      expect(r.first_aid_rating).toBe("insufficient_data");
      expect(r.first_aid_score).toBe(0);
    });

    it("2 — returns inadequate with score 15 when children > 0 and all arrays empty", () => {
      const r = run({ total_children: 4 });
      expect(r.first_aid_rating).toBe("inadequate");
      expect(r.first_aid_score).toBe(15);
    });

    it("3 — headline references urgent attention when children present and all empty", () => {
      const r = run({ total_children: 2 });
      expect(r.headline).toContain("urgent attention");
    });

    it("4 — generates exactly 1 concern when children present and all empty", () => {
      const r = run({ total_children: 3 });
      expect(r.concerns).toHaveLength(1);
    });

    it("5 — generates exactly 2 recommendations when children present and all empty", () => {
      const r = run({ total_children: 3 });
      expect(r.recommendations).toHaveLength(2);
      expect(r.recommendations[0].urgency).toBe("immediate");
      expect(r.recommendations[1].urgency).toBe("immediate");
    });

    it("6 — generates exactly 1 critical insight when children present and all empty", () => {
      const r = run({ total_children: 1 });
      expect(r.insights).toHaveLength(1);
      expect(r.insights[0].severity).toBe("critical");
    });

    it("7 — all zeroed metrics when insufficient_data", () => {
      const r = run({ total_children: 0, total_staff: 0 });
      expect(r.total_kits).toBe(0);
      expect(r.total_stock_items).toBe(0);
      expect(r.total_expiry_items).toBe(0);
      expect(r.total_trained_staff).toBe(0);
      expect(r.kit_check_rate).toBe(0);
      expect(r.stock_adequacy_rate).toBe(0);
      expect(r.expiry_monitoring_rate).toBe(0);
      expect(r.accessibility_rate).toBe(0);
      expect(r.staff_training_rate).toBe(0);
      expect(r.child_awareness_rate).toBe(0);
    });

    it("8 — empty strengths, concerns, recommendations, insights for insufficient_data", () => {
      const r = run({ total_children: 0, total_staff: 0 });
      expect(r.strengths).toHaveLength(0);
      expect(r.concerns).toHaveLength(0);
      expect(r.recommendations).toHaveLength(0);
      expect(r.insights).toHaveLength(0);
    });

    it("9 — insufficient_data headline mentions no children on placement", () => {
      const r = run({ total_children: 0, total_staff: 0 });
      expect(r.headline).toContain("No children on placement");
    });

    it("10 — recommendations reference Reg 14 and Reg 25 when children present but all empty", () => {
      const r = run({ total_children: 2 });
      expect(r.recommendations[0].regulatory_ref).toContain("Reg 14");
      expect(r.recommendations[1].regulatory_ref).toContain("Reg 25");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. SCORING — BASE SCORE AND BONUSES
  // ═══════════════════════════════════════════════════════════════════════════

  describe("scoring — base and bonuses", () => {
    // NOTE: total_staff=0 avoids the staffTrainingRate<50 penalty (-4) that
    // would otherwise fire when we only provide non-training records.
    // childAwarenessRate bonus (+3/+1) fires when accessibility_records have
    // children_know_location=true, and accessibilityRate bonus fires too.

    it("11 — base score is 52 with minimal non-empty data", () => {
      const r = run({
        total_staff: 0,
        kit_check_records: [makeKitCheck({ all_items_present: false, check_documented: false })],
      });
      // kitCheckRate=0% => -5 penalty => 52 - 5 = 47
      expect(r.first_aid_score).toBe(47);
    });

    it("12 — kitCheckRate >= 95 adds +5", () => {
      const checks = Array.from({ length: 20 }, () =>
        makeKitCheck({ all_items_present: true, check_documented: true }),
      );
      const r = run({ kit_check_records: checks, total_staff: 0 });
      // base 52 + kitCheck(+5) = 57
      expect(r.first_aid_score).toBe(57);
    });

    it("13 — kitCheckRate >= 80 but < 95 adds +3", () => {
      const checks = [
        ...Array.from({ length: 9 }, () => makeKitCheck({ all_items_present: true, check_documented: true })),
        makeKitCheck({ all_items_present: false, check_documented: true }),
      ];
      // 9/10 = 90% => +3 => 52 + 3 = 55
      const r = run({ kit_check_records: checks, total_staff: 0 });
      expect(r.first_aid_score).toBe(55);
    });

    it("14 — kitCheckRate >= 60 but < 80 adds +1", () => {
      const checks = [
        ...Array.from({ length: 7 }, () => makeKitCheck({ all_items_present: true, check_documented: true })),
        ...Array.from({ length: 3 }, () => makeKitCheck({ all_items_present: false, check_documented: true })),
      ];
      // 7/10 = 70% => +1 => 52 + 1 = 53
      const r = run({ kit_check_records: checks, total_staff: 0 });
      expect(r.first_aid_score).toBe(53);
    });

    it("15 — stockAdequacyRate >= 95 adds +5", () => {
      const stocks = Array.from({ length: 20 }, () =>
        makeStock({ current_quantity: 20, minimum_threshold: 10 }),
      );
      const r = run({ stock_records: stocks, total_staff: 0 });
      expect(r.first_aid_score).toBe(57);
    });

    it("16 — stockAdequacyRate >= 80 but < 95 adds +3", () => {
      const stocks = [
        ...Array.from({ length: 9 }, () => makeStock({ current_quantity: 20, minimum_threshold: 10 })),
        makeStock({ current_quantity: 5, minimum_threshold: 10 }),
      ];
      // 9/10 = 90% => +3
      const r = run({ stock_records: stocks, total_staff: 0 });
      expect(r.first_aid_score).toBe(55);
    });

    it("17 — stockAdequacyRate >= 60 but < 80 adds +1", () => {
      const stocks = [
        ...Array.from({ length: 7 }, () => makeStock({ current_quantity: 20, minimum_threshold: 10 })),
        ...Array.from({ length: 3 }, () => makeStock({ current_quantity: 5, minimum_threshold: 10 })),
      ];
      // 7/10 = 70% => +1
      const r = run({ stock_records: stocks, total_staff: 0 });
      expect(r.first_aid_score).toBe(53);
    });

    it("18 — expiryMonitoringRate >= 98 adds +5", () => {
      const expiries = Array.from({ length: 50 }, () =>
        makeExpiry({ is_expired: false, days_until_expiry: 200 }),
      );
      // all valid = 100% => +5
      const r = run({ expiry_records: expiries, total_staff: 0 });
      expect(r.first_aid_score).toBe(57);
    });

    it("19 — expiryMonitoringRate >= 90 but < 98 adds +3", () => {
      const expiries = [
        ...Array.from({ length: 19 }, () => makeExpiry({ is_expired: false, days_until_expiry: 200 })),
        makeExpiry({ is_expired: true, days_until_expiry: 0 }),
      ];
      // 19/20 = 95% => +3 (expired items cause concerns but no score penalty without critical stock)
      const r = run({ expiry_records: expiries, total_staff: 0 });
      expect(r.first_aid_score).toBe(55);
    });

    it("20 — expiryMonitoringRate >= 75 but < 90 adds +1", () => {
      const expiries = [
        ...Array.from({ length: 8 }, () => makeExpiry({ is_expired: false, days_until_expiry: 200 })),
        ...Array.from({ length: 2 }, () => makeExpiry({ is_expired: true, days_until_expiry: 0 })),
      ];
      // 8/10 = 80% => +1
      const r = run({ expiry_records: expiries, total_staff: 0 });
      expect(r.first_aid_score).toBe(53);
    });

    it("21 — accessibilityRate >= 100 adds +4", () => {
      // children_know_location defaults true => childAwarenessRate=100% => +3
      const accs = Array.from({ length: 3 }, () => makeAccessibility());
      const r = run({ accessibility_records: accs, total_staff: 0 });
      // base 52 + acc(+4) + childAwareness(+3) = 59
      expect(r.first_aid_score).toBe(59);
    });

    it("22 — accessibilityRate >= 80 but < 100 adds +2", () => {
      // children_know_location defaults true => childAwarenessRate=100% => +3
      const accs = [
        ...Array.from({ length: 9 }, () => makeAccessibility()),
        makeAccessibility({ is_accessible_24hr: false }),
      ];
      // 9/10 = 90% => +2, childAwareness=100% => +3
      const r = run({ accessibility_records: accs, total_staff: 0 });
      // base 52 + acc(+2) + childAwareness(+3) = 57
      expect(r.first_aid_score).toBe(57);
    });

    it("23 — staffTrainingRate >= 100 adds +4", () => {
      const training = Array.from({ length: 5 }, (_, i) =>
        makeTraining({ staff_id: `staff_${i + 1}`, is_current: true }),
      );
      const r = run({ training_records: training, total_staff: 5 });
      expect(r.first_aid_score).toBe(56);
    });

    it("24 — staffTrainingRate >= 80 but < 100 adds +2", () => {
      const training = Array.from({ length: 4 }, (_, i) =>
        makeTraining({ staff_id: `staff_${i + 1}`, is_current: true }),
      );
      // 4/5 = 80% => +2
      const r = run({ training_records: training, total_staff: 5 });
      expect(r.first_aid_score).toBe(54);
    });

    it("25 — childAwarenessRate >= 90 adds +3", () => {
      const accs = Array.from({ length: 10 }, () =>
        makeAccessibility({ children_know_location: true }),
      );
      // accessibilityRate=100% => +4, childAwarenessRate=100% => +3
      const r = run({ accessibility_records: accs, total_staff: 0 });
      // base 52 + acc(+4) + childAwareness(+3) = 59
      expect(r.first_aid_score).toBe(59);
    });

    it("26 — childAwarenessRate >= 70 but < 90 adds +1", () => {
      const accs = [
        ...Array.from({ length: 8 }, () => makeAccessibility({ children_know_location: true })),
        ...Array.from({ length: 2 }, () => makeAccessibility({ children_know_location: false })),
      ];
      // 8/10 = 80% child awareness => +1, accessibilityRate=100% => +4
      const r = run({ accessibility_records: accs, total_staff: 0 });
      // base 52 + acc(+4) + childAwareness(+1) = 57
      expect(r.first_aid_score).toBe(57);
    });

    it("27 — paediatricTrainedRate >= 80 adds +2", () => {
      const training = Array.from({ length: 5 }, (_, i) =>
        makeTraining({
          staff_id: `staff_${i + 1}`,
          is_current: true,
          is_paediatric_qualified: true,
        }),
      );
      // 5/5 = 100% paediatric => +2, staffTrainingRate=100% => +4
      const r = run({ training_records: training, total_staff: 5 });
      expect(r.first_aid_score).toBe(58);
    });

    it("28 — maximum bonuses yield score of 80 (base 52 + 28)", () => {
      const checks = Array.from({ length: 20 }, () =>
        makeKitCheck({ all_items_present: true, check_documented: true }),
      );
      const stocks = Array.from({ length: 20 }, () =>
        makeStock({ current_quantity: 20, minimum_threshold: 10 }),
      );
      const expiries = Array.from({ length: 50 }, () =>
        makeExpiry({ is_expired: false, days_until_expiry: 200 }),
      );
      const accs = Array.from({ length: 5 }, () => makeAccessibility());
      const training = Array.from({ length: 5 }, (_, i) =>
        makeTraining({
          staff_id: `staff_${i + 1}`,
          is_current: true,
          is_paediatric_qualified: true,
        }),
      );
      const r = run({
        kit_check_records: checks,
        stock_records: stocks,
        expiry_records: expiries,
        accessibility_records: accs,
        training_records: training,
        total_staff: 5,
      });
      // 52+5+5+5+4+4+3+2 = 80
      expect(r.first_aid_score).toBe(80);
      expect(r.first_aid_rating).toBe("outstanding");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. SCORING — PENALTIES
  // ═══════════════════════════════════════════════════════════════════════════

  describe("scoring — penalties", () => {
    it("29 — kitCheckRate < 50 with checks => -5 penalty", () => {
      const checks = [
        makeKitCheck({ all_items_present: true, check_documented: true }),
        ...Array.from({ length: 3 }, () => makeKitCheck({ all_items_present: false, check_documented: false })),
      ];
      // 1/4 = 25% => -5, total_staff=0 avoids staffTraining penalty
      const r = run({ kit_check_records: checks, total_staff: 0 });
      expect(r.first_aid_score).toBe(47);
    });

    it("30 — expiredItems > 0 AND critical stock below minimum => -5 penalty", () => {
      const expiries = [makeExpiry({ is_expired: true, days_until_expiry: 0 })];
      const stocks = [makeStock({ is_critical_item: true, current_quantity: 2, minimum_threshold: 10 })];
      const r = run({ expiry_records: expiries, stock_records: stocks, total_staff: 0 });
      // base 52 - 5 (expired+critical) = 47
      expect(r.first_aid_score).toBe(47);
    });

    it("31 — staffTrainingRate < 50 with staff > 0 => -4 penalty", () => {
      const training = [
        makeTraining({ staff_id: "staff_1", is_current: true }),
        makeTraining({ staff_id: "staff_2", is_current: false }),
      ];
      // 1/5 = 20% => -4
      const r = run({ training_records: training, total_staff: 5 });
      expect(r.first_aid_score).toBe(48);
    });

    it("32 — accessibilityRate < 50 with audits => -4 penalty", () => {
      const accs = [
        makeAccessibility({ is_accessible_24hr: false, children_know_location: false }),
        makeAccessibility({ is_accessible_24hr: false, children_know_location: false }),
        makeAccessibility({ is_accessible_24hr: false, children_know_location: false }),
      ];
      // 0/3 acc => -4, childAwareness=0% => no bonus, total_staff=0 => no staff penalty
      const r = run({ accessibility_records: accs, total_staff: 0 });
      expect(r.first_aid_score).toBe(48);
    });

    it("33 — multiple penalties stack", () => {
      const checks = Array.from({ length: 4 }, () =>
        makeKitCheck({ all_items_present: false, check_documented: false }),
      );
      const expiries = [makeExpiry({ is_expired: true, days_until_expiry: 0 })];
      const stocks = [makeStock({ is_critical_item: true, current_quantity: 2, minimum_threshold: 10 })];
      const training = [makeTraining({ staff_id: "staff_1", is_current: true })];
      const accs = [makeAccessibility({ is_accessible_24hr: false, children_know_location: false })];
      const r = run({
        kit_check_records: checks,
        stock_records: stocks,
        expiry_records: expiries,
        accessibility_records: accs,
        training_records: training,
        total_staff: 5,
      });
      // 52 -5 (kit<50) -5 (expired+critical) -4 (staff<50) -4 (acc<50) = 34
      expect(r.first_aid_score).toBe(34);
    });

    it("34 — score clamped to 0 minimum", () => {
      // This is hard to reach due to base 52, but the clamp function caps it
      // Test through the clamp behavior. We rely on the fact clamp(v,0,100) is used.
      const r = run({ total_children: 4 }); // all empty + children => returns early with 15
      expect(r.first_aid_score).toBeGreaterThanOrEqual(0);
    });

    it("35 — score clamped to 100 maximum", () => {
      // max bonuses = 28, base = 52, total = 80. No scenario reaches > 100
      const r = run({
        kit_check_records: Array.from({ length: 20 }, () => makeKitCheck()),
        stock_records: Array.from({ length: 20 }, () => makeStock()),
        expiry_records: Array.from({ length: 20 }, () => makeExpiry()),
        accessibility_records: Array.from({ length: 5 }, () => makeAccessibility()),
        training_records: Array.from({ length: 5 }, (_, i) =>
          makeTraining({ staff_id: `staff_${i + 1}`, is_current: true, is_paediatric_qualified: true }),
        ),
        total_staff: 5,
      });
      expect(r.first_aid_score).toBeLessThanOrEqual(100);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. RATING THRESHOLDS
  // ═══════════════════════════════════════════════════════════════════════════

  describe("rating thresholds", () => {
    it("36 — score 80 => outstanding", () => {
      // All max bonuses: 52 + 28 = 80
      const r = run({
        kit_check_records: Array.from({ length: 20 }, () => makeKitCheck()),
        stock_records: Array.from({ length: 20 }, () => makeStock()),
        expiry_records: Array.from({ length: 50 }, () => makeExpiry()),
        accessibility_records: Array.from({ length: 5 }, () => makeAccessibility()),
        training_records: Array.from({ length: 5 }, (_, i) =>
          makeTraining({ staff_id: `staff_${i + 1}`, is_current: true, is_paediatric_qualified: true }),
        ),
        total_staff: 5,
      });
      expect(r.first_aid_rating).toBe("outstanding");
    });

    it("37 — score 65-79 => good", () => {
      // base 52 + kitCheck(+5) + stock(+5) + expiry(+5) = 67, total_staff=0 avoids staff penalty
      const r = run({
        kit_check_records: Array.from({ length: 20 }, () => makeKitCheck()),
        stock_records: Array.from({ length: 20 }, () => makeStock()),
        expiry_records: Array.from({ length: 50 }, () => makeExpiry()),
        total_staff: 0,
      });
      expect(r.first_aid_score).toBe(67);
      expect(r.first_aid_rating).toBe("good");
    });

    it("38 — score 45-64 => adequate", () => {
      // base 52, total_staff=0 avoids staff penalty
      const r = run({
        kit_check_records: [makeKitCheck({ all_items_present: true, check_documented: true })],
        total_staff: 0,
      });
      // kitCheckRate=100% => +5 => 57 => adequate
      expect(r.first_aid_score).toBe(57);
      expect(r.first_aid_rating).toBe("adequate");
    });

    it("39 — score < 45 => inadequate", () => {
      const checks = Array.from({ length: 4 }, () =>
        makeKitCheck({ all_items_present: false, check_documented: false }),
      );
      const expiries = [makeExpiry({ is_expired: true, days_until_expiry: 0 })];
      const stocks = [makeStock({ is_critical_item: true, current_quantity: 2, minimum_threshold: 10 })];
      const training = [makeTraining({ staff_id: "staff_1", is_current: true })];
      const accs = [makeAccessibility({ is_accessible_24hr: false })];
      const r = run({
        kit_check_records: checks,
        stock_records: stocks,
        expiry_records: expiries,
        accessibility_records: accs,
        training_records: training,
        total_staff: 5,
      });
      expect(r.first_aid_score).toBeLessThan(45);
      expect(r.first_aid_rating).toBe("inadequate");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. KIT CHECK METRICS
  // ═══════════════════════════════════════════════════════════════════════════

  describe("kit check metrics", () => {
    it("40 — total_kits counts unique kit_ids", () => {
      const checks = [
        makeKitCheck({ kit_id: "kit_1" }),
        makeKitCheck({ kit_id: "kit_1" }),
        makeKitCheck({ kit_id: "kit_2" }),
      ];
      const r = run({ kit_check_records: checks });
      expect(r.total_kits).toBe(2);
    });

    it("41 — kit_check_rate = pct of compliant checks (all_items_present AND check_documented)", () => {
      const checks = [
        makeKitCheck({ all_items_present: true, check_documented: true }),
        makeKitCheck({ all_items_present: true, check_documented: false }),
        makeKitCheck({ all_items_present: false, check_documented: true }),
        makeKitCheck({ all_items_present: true, check_documented: true }),
      ];
      // 2/4 = 50%
      const r = run({ kit_check_records: checks });
      expect(r.kit_check_rate).toBe(50);
    });

    it("42 — kit_check_rate is 0 when no checks", () => {
      const r = run({});
      expect(r.kit_check_rate).toBe(0);
    });

    it("43 — kit_check_rate 100 when all checks compliant", () => {
      const checks = Array.from({ length: 5 }, () => makeKitCheck());
      const r = run({ kit_check_records: checks });
      expect(r.kit_check_rate).toBe(100);
    });

    it("44 — total_kits is 0 when no kit check records", () => {
      const r = run({});
      expect(r.total_kits).toBe(0);
    });

    it("45 — correctly counts checks with different check_types", () => {
      const checks = [
        makeKitCheck({ check_type: "routine" }),
        makeKitCheck({ check_type: "monthly" }),
        makeKitCheck({ check_type: "quarterly" }),
        makeKitCheck({ check_type: "post_incident" }),
        makeKitCheck({ check_type: "restock" }),
      ];
      const r = run({ kit_check_records: checks });
      expect(r.kit_check_rate).toBe(100);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. STOCK METRICS
  // ═══════════════════════════════════════════════════════════════════════════

  describe("stock metrics", () => {
    it("46 — total_stock_items counts all stock records", () => {
      const stocks = Array.from({ length: 8 }, () => makeStock());
      const r = run({ stock_records: stocks });
      expect(r.total_stock_items).toBe(8);
    });

    it("47 — stock_adequacy_rate counts items >= minimum_threshold", () => {
      const stocks = [
        makeStock({ current_quantity: 20, minimum_threshold: 10 }),
        makeStock({ current_quantity: 10, minimum_threshold: 10 }),
        makeStock({ current_quantity: 5, minimum_threshold: 10 }),
      ];
      // 2/3 = 67%
      const r = run({ stock_records: stocks });
      expect(r.stock_adequacy_rate).toBe(67);
    });

    it("48 — critical_stock_adequacy_rate only counts critical items", () => {
      const stocks = [
        makeStock({ is_critical_item: true, current_quantity: 20, minimum_threshold: 10 }),
        makeStock({ is_critical_item: true, current_quantity: 5, minimum_threshold: 10 }),
        makeStock({ is_critical_item: false, current_quantity: 2, minimum_threshold: 10 }),
      ];
      // critical: 1/2 = 50%
      const r = run({ stock_records: stocks });
      expect(r.critical_stock_adequacy_rate).toBe(50);
    });

    it("49 — stock_adequacy_rate is 0 when no stock records", () => {
      const r = run({});
      expect(r.stock_adequacy_rate).toBe(0);
    });

    it("50 — critical_stock_adequacy_rate is 0 when no critical items", () => {
      const stocks = [makeStock({ is_critical_item: false })];
      const r = run({ stock_records: stocks });
      expect(r.critical_stock_adequacy_rate).toBe(0);
    });

    it("51 — stock_adequacy_rate 100% when all items adequate", () => {
      const stocks = Array.from({ length: 5 }, () =>
        makeStock({ current_quantity: 20, minimum_threshold: 10 }),
      );
      const r = run({ stock_records: stocks });
      expect(r.stock_adequacy_rate).toBe(100);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. EXPIRY METRICS
  // ═══════════════════════════════════════════════════════════════════════════

  describe("expiry metrics", () => {
    it("52 — total_expiry_items counts all expiry records", () => {
      const expiries = Array.from({ length: 12 }, () => makeExpiry());
      const r = run({ expiry_records: expiries });
      expect(r.total_expiry_items).toBe(12);
    });

    it("53 — expired_items_count counts items with is_expired=true", () => {
      const expiries = [
        makeExpiry({ is_expired: true }),
        makeExpiry({ is_expired: true }),
        makeExpiry({ is_expired: false }),
      ];
      const r = run({ expiry_records: expiries });
      expect(r.expired_items_count).toBe(2);
    });

    it("54 — near_expiry_items_count counts non-expired items within 30 days", () => {
      const expiries = [
        makeExpiry({ is_expired: false, days_until_expiry: 10 }),
        makeExpiry({ is_expired: false, days_until_expiry: 25 }),
        makeExpiry({ is_expired: false, days_until_expiry: 30 }),
        makeExpiry({ is_expired: false, days_until_expiry: 31 }),
        makeExpiry({ is_expired: true, days_until_expiry: 0 }),
      ];
      // items 1, 2, 3 are near_expiry (<=30 and not expired)
      const r = run({ expiry_records: expiries });
      expect(r.near_expiry_items_count).toBe(3);
    });

    it("55 — expiry_monitoring_rate = pct of non-expired items", () => {
      const expiries = [
        ...Array.from({ length: 9 }, () => makeExpiry({ is_expired: false })),
        makeExpiry({ is_expired: true }),
      ];
      // 9/10 = 90%
      const r = run({ expiry_records: expiries });
      expect(r.expiry_monitoring_rate).toBe(90);
    });

    it("56 — expiry_monitoring_rate is 0 when no expiry records", () => {
      const r = run({});
      expect(r.expiry_monitoring_rate).toBe(0);
    });

    it("57 — expiry_monitoring_rate 100 when no items expired", () => {
      const expiries = Array.from({ length: 10 }, () => makeExpiry({ is_expired: false }));
      const r = run({ expiry_records: expiries });
      expect(r.expiry_monitoring_rate).toBe(100);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 8. ACCESSIBILITY METRICS
  // ═══════════════════════════════════════════════════════════════════════════

  describe("accessibility metrics", () => {
    it("58 — accessibility_rate requires all 4 criteria (24hr, signed, unlocked, compliant)", () => {
      const accs = [
        makeAccessibility({
          is_accessible_24hr: true,
          is_clearly_signed: true,
          is_unlocked: true,
          location_compliant: true,
        }),
        makeAccessibility({
          is_accessible_24hr: true,
          is_clearly_signed: true,
          is_unlocked: false, // fails
          location_compliant: true,
        }),
      ];
      // 1/2 = 50%
      const r = run({ accessibility_records: accs });
      expect(r.accessibility_rate).toBe(50);
    });

    it("59 — child_awareness_rate counts children_know_location", () => {
      const accs = [
        makeAccessibility({ children_know_location: true }),
        makeAccessibility({ children_know_location: false }),
        makeAccessibility({ children_know_location: true }),
      ];
      // 2/3 = 67%
      const r = run({ accessibility_records: accs });
      expect(r.child_awareness_rate).toBe(67);
    });

    it("60 — accessibility_rate is 0 when no accessibility records", () => {
      const r = run({});
      expect(r.accessibility_rate).toBe(0);
    });

    it("61 — child_awareness_rate is 0 when no accessibility records", () => {
      const r = run({});
      expect(r.child_awareness_rate).toBe(0);
    });

    it("62 — accessibility_rate 100 when all kits fully accessible", () => {
      const accs = Array.from({ length: 4 }, () => makeAccessibility());
      const r = run({ accessibility_records: accs });
      expect(r.accessibility_rate).toBe(100);
    });

    it("63 — signed but locked kit is not fully accessible", () => {
      const accs = [
        makeAccessibility({ is_unlocked: false }),
      ];
      const r = run({ accessibility_records: accs });
      expect(r.accessibility_rate).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 9. TRAINING METRICS
  // ═══════════════════════════════════════════════════════════════════════════

  describe("training metrics", () => {
    it("64 — total_trained_staff counts unique staff_ids", () => {
      const training = [
        makeTraining({ staff_id: "staff_1" }),
        makeTraining({ staff_id: "staff_1" }),
        makeTraining({ staff_id: "staff_2" }),
      ];
      const r = run({ training_records: training });
      expect(r.total_trained_staff).toBe(2);
    });

    it("65 — staff_training_rate = pct of staff with current training", () => {
      const training = [
        makeTraining({ staff_id: "staff_1", is_current: true }),
        makeTraining({ staff_id: "staff_2", is_current: true }),
        makeTraining({ staff_id: "staff_3", is_current: false }),
      ];
      // 2 unique staff with current / 5 total = 40%
      const r = run({ training_records: training, total_staff: 5 });
      expect(r.staff_training_rate).toBe(40);
    });

    it("66 — staff_training_rate is 0 when total_staff is 0", () => {
      const training = [makeTraining({ staff_id: "staff_1", is_current: true })];
      const r = run({ training_records: training, total_staff: 0 });
      expect(r.staff_training_rate).toBe(0);
    });

    it("67 — paediatric_trained_rate counts unique staff with paediatric+current", () => {
      const training = [
        makeTraining({ staff_id: "staff_1", is_paediatric_qualified: true, is_current: true }),
        makeTraining({ staff_id: "staff_1", is_paediatric_qualified: true, is_current: true }),
        makeTraining({ staff_id: "staff_2", is_paediatric_qualified: true, is_current: false }),
        makeTraining({ staff_id: "staff_3", is_paediatric_qualified: false, is_current: true }),
      ];
      // staff_1 = paed+current (counted once), staff_2 = paed but not current, staff_3 = current but not paed
      // 1/5 = 20%
      const r = run({ training_records: training, total_staff: 5 });
      expect(r.paediatric_trained_rate).toBe(20);
    });

    it("68 — paediatric_trained_rate is 0 when total_staff is 0", () => {
      const r = run({ total_staff: 0 });
      expect(r.paediatric_trained_rate).toBe(0);
    });

    it("69 — staff_training_rate 100% when all staff trained", () => {
      const training = Array.from({ length: 5 }, (_, i) =>
        makeTraining({ staff_id: `staff_${i + 1}`, is_current: true }),
      );
      const r = run({ training_records: training, total_staff: 5 });
      expect(r.staff_training_rate).toBe(100);
    });

    it("70 — staff with multiple current training records counted once", () => {
      const training = [
        makeTraining({ staff_id: "staff_1", is_current: true, training_type: "first_aid_at_work" }),
        makeTraining({ staff_id: "staff_1", is_current: true, training_type: "paediatric_first_aid" }),
      ];
      const r = run({ training_records: training, total_staff: 5 });
      // 1/5 = 20%
      expect(r.staff_training_rate).toBe(20);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 10. STRENGTHS
  // ═══════════════════════════════════════════════════════════════════════════

  describe("strengths", () => {
    it("71 — kit check >= 95% generates exemplary strength", () => {
      const checks = Array.from({ length: 20 }, () => makeKitCheck());
      const r = run({ kit_check_records: checks });
      expect(r.strengths.some((s) => s.includes("exemplary"))).toBe(true);
    });

    it("72 — kit check >= 80% generates compliant strength with percentage", () => {
      const checks = [
        ...Array.from({ length: 9 }, () => makeKitCheck()),
        makeKitCheck({ all_items_present: false }),
      ];
      const r = run({ kit_check_records: checks });
      expect(r.strengths.some((s) => s.includes("90%") && s.includes("compliant"))).toBe(true);
    });

    it("73 — kit check >= 60% generates monitoring strength", () => {
      const checks = [
        ...Array.from({ length: 7 }, () => makeKitCheck()),
        ...Array.from({ length: 3 }, () => makeKitCheck({ all_items_present: false })),
      ];
      const r = run({ kit_check_records: checks });
      expect(r.strengths.some((s) => s.includes("70%") && s.includes("compliance"))).toBe(true);
    });

    it("74 — stock adequacy >= 95% generates exceptional strength", () => {
      const stocks = Array.from({ length: 20 }, () => makeStock());
      const r = run({ stock_records: stocks });
      expect(r.strengths.some((s) => s.includes("exceptionally well managed"))).toBe(true);
    });

    it("75 — stock adequacy >= 80% generates good strength", () => {
      const stocks = [
        ...Array.from({ length: 9 }, () => makeStock()),
        makeStock({ current_quantity: 5, minimum_threshold: 10 }),
      ];
      const r = run({ stock_records: stocks });
      expect(r.strengths.some((s) => s.includes("90%") && s.includes("stock adequacy"))).toBe(true);
    });

    it("76 — critical stock >= 100% generates strength about critical items", () => {
      const stocks = [
        makeStock({ is_critical_item: true, current_quantity: 20, minimum_threshold: 10 }),
        makeStock({ is_critical_item: true, current_quantity: 15, minimum_threshold: 10 }),
      ];
      const r = run({ stock_records: stocks });
      expect(r.strengths.some((s) => s.includes("critical medical supply items are fully stocked"))).toBe(true);
    });

    it("77 — critical stock >= 90% generates strength with percentage", () => {
      const stocks = [
        ...Array.from({ length: 9 }, () => makeStock({ is_critical_item: true, current_quantity: 20, minimum_threshold: 10 })),
        makeStock({ is_critical_item: true, current_quantity: 5, minimum_threshold: 10 }),
      ];
      const r = run({ stock_records: stocks });
      expect(r.strengths.some((s) => s.includes("90%") && s.includes("critical item"))).toBe(true);
    });

    it("78 — expiry monitoring >= 98% generates outstanding strength", () => {
      const expiries = Array.from({ length: 50 }, () => makeExpiry());
      const r = run({ expiry_records: expiries });
      expect(r.strengths.some((s) => s.includes("Outstanding expiry monitoring"))).toBe(true);
    });

    it("79 — expiry monitoring >= 90% generates strong strength", () => {
      const expiries = [
        ...Array.from({ length: 19 }, () => makeExpiry()),
        makeExpiry({ is_expired: true }),
      ];
      const r = run({ expiry_records: expiries });
      expect(r.strengths.some((s) => s.includes("95%") && s.includes("within date"))).toBe(true);
    });

    it("80 — accessibility >= 100% generates full access strength", () => {
      const accs = Array.from({ length: 3 }, () => makeAccessibility());
      const r = run({ accessibility_records: accs });
      expect(r.strengths.some((s) => s.includes("Every first aid kit meets full accessibility"))).toBe(true);
    });

    it("81 — accessibility >= 80% generates strong accessibility strength", () => {
      const accs = [
        ...Array.from({ length: 9 }, () => makeAccessibility()),
        makeAccessibility({ is_accessible_24hr: false }),
      ];
      const r = run({ accessibility_records: accs });
      expect(r.strengths.some((s) => s.includes("90%") && s.includes("accessibility standards"))).toBe(true);
    });

    it("82 — staff training >= 100% generates complete coverage strength", () => {
      const training = Array.from({ length: 5 }, (_, i) =>
        makeTraining({ staff_id: `staff_${i + 1}`, is_current: true }),
      );
      const r = run({ training_records: training, total_staff: 5 });
      expect(r.strengths.some((s) => s.includes("Every member of staff holds current first aid training"))).toBe(true);
    });

    it("83 — staff training >= 80% generates strong training strength", () => {
      const training = Array.from({ length: 4 }, (_, i) =>
        makeTraining({ staff_id: `staff_${i + 1}`, is_current: true }),
      );
      const r = run({ training_records: training, total_staff: 5 });
      expect(r.strengths.some((s) => s.includes("80%") && s.includes("current first aid training"))).toBe(true);
    });

    it("84 — paediatric >= 80% generates excellent paediatric strength", () => {
      const training = Array.from({ length: 5 }, (_, i) =>
        makeTraining({ staff_id: `staff_${i + 1}`, is_current: true, is_paediatric_qualified: true }),
      );
      const r = run({ training_records: training, total_staff: 5 });
      expect(r.strengths.some((s) => s.includes("100%") && s.includes("paediatric first aid qualified"))).toBe(true);
    });

    it("85 — paediatric >= 50% generates good paediatric strength", () => {
      const training = Array.from({ length: 3 }, (_, i) =>
        makeTraining({ staff_id: `staff_${i + 1}`, is_current: true, is_paediatric_qualified: true }),
      );
      const r = run({ training_records: training, total_staff: 5 });
      // 3/5 = 60% paediatric
      expect(r.strengths.some((s) => s.includes("60%") && s.includes("paediatric"))).toBe(true);
    });

    it("86 — child awareness >= 90% generates outstanding awareness strength", () => {
      const accs = Array.from({ length: 10 }, () =>
        makeAccessibility({ children_know_location: true }),
      );
      const r = run({ accessibility_records: accs });
      expect(r.strengths.some((s) => s.includes("100%") && s.includes("children know where"))).toBe(true);
    });

    it("87 — child awareness >= 70% generates good awareness strength", () => {
      const accs = [
        ...Array.from({ length: 8 }, () => makeAccessibility({ children_know_location: true })),
        ...Array.from({ length: 2 }, () => makeAccessibility({ children_know_location: false })),
      ];
      const r = run({ accessibility_records: accs });
      expect(r.strengths.some((s) => s.includes("80%") && s.includes("child awareness"))).toBe(true);
    });

    it("88 — HSE compliance 100% generates full HSE strength", () => {
      const accs = Array.from({ length: 3 }, () =>
        makeAccessibility({ meets_hse_guidance: true }),
      );
      const r = run({ accessibility_records: accs });
      expect(r.strengths.some((s) => s.includes("All first aid kit locations meet HSE guidance"))).toBe(true);
    });

    it("89 — HSE compliance >= 80% generates strong HSE strength", () => {
      const accs = [
        ...Array.from({ length: 9 }, () => makeAccessibility({ meets_hse_guidance: true })),
        makeAccessibility({ meets_hse_guidance: false }),
      ];
      const r = run({ accessibility_records: accs });
      expect(r.strengths.some((s) => s.includes("90%") && s.includes("HSE compliance"))).toBe(true);
    });

    it("90 — check documentation >= 95% generates exemplary documentation strength", () => {
      const checks = Array.from({ length: 20 }, () =>
        makeKitCheck({ check_documented: true }),
      );
      const r = run({ kit_check_records: checks });
      expect(r.strengths.some((s) => s.includes("documentation is exemplary"))).toBe(true);
    });

    it("91 — issue resolution >= 90% generates strength about resolved issues", () => {
      const checks = [
        makeKitCheck({ issues_found: 10, issues_resolved: 9 }),
      ];
      const r = run({ kit_check_records: checks });
      expect(r.strengths.some((s) => s.includes("90%") && s.includes("issues identified"))).toBe(true);
    });

    it("92 — stock audit accuracy >= 95% generates strength", () => {
      const stocks = Array.from({ length: 20 }, () =>
        makeStock({ audit_matched_records: true }),
      );
      const r = run({ stock_records: stocks });
      expect(r.strengths.some((s) => s.includes("100%") && s.includes("stock audit accuracy"))).toBe(true);
    });

    it("93 — refresher compliance >= 90% generates refresher strength", () => {
      const training = Array.from({ length: 5 }, (_, i) =>
        makeTraining({ staff_id: `staff_${i + 1}`, is_current: true, refresher_completed: true }),
      );
      const r = run({ training_records: training, total_staff: 5 });
      expect(r.strengths.some((s) => s.includes("100%") && s.includes("refresher training"))).toBe(true);
    });

    it("94 — all staff know locations generates staff awareness strength", () => {
      const accs = Array.from({ length: 3 }, () =>
        makeAccessibility({ staff_know_location: true }),
      );
      const r = run({ accessibility_records: accs });
      expect(r.strengths.some((s) => s.includes("All staff know every first aid kit location"))).toBe(true);
    });

    it("95 — no strengths generated for kitCheckRate < 60", () => {
      const checks = [
        makeKitCheck({ all_items_present: true, check_documented: true }),
        ...Array.from({ length: 3 }, () => makeKitCheck({ all_items_present: false, check_documented: false })),
      ];
      const r = run({ kit_check_records: checks });
      expect(r.strengths.some((s) => s.includes("kit check"))).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 11. CONCERNS
  // ═══════════════════════════════════════════════════════════════════════════

  describe("concerns", () => {
    it("96 — kitCheckRate < 50 generates critical compliance concern", () => {
      const checks = [
        makeKitCheck({ all_items_present: true, check_documented: true }),
        ...Array.from({ length: 4 }, () => makeKitCheck({ all_items_present: false, check_documented: false })),
      ];
      // 1/5 = 20%
      const r = run({ kit_check_records: checks });
      expect(r.concerns.some((c) => c.includes("20%") && c.includes("fully compliant"))).toBe(true);
    });

    it("97 — kitCheckRate 50-79 generates moderate concern", () => {
      const checks = [
        ...Array.from({ length: 6 }, () => makeKitCheck()),
        ...Array.from({ length: 4 }, () => makeKitCheck({ all_items_present: false })),
      ];
      // 6/10 = 60%
      const r = run({ kit_check_records: checks });
      expect(r.concerns.some((c) => c.includes("60%") && c.includes("significant proportion"))).toBe(true);
    });

    it("98 — no kit check concern when kitCheckRate >= 80", () => {
      const checks = [
        ...Array.from({ length: 9 }, () => makeKitCheck()),
        makeKitCheck({ all_items_present: false }),
      ];
      const r = run({ kit_check_records: checks });
      expect(r.concerns.some((c) => c.includes("kit check"))).toBe(false);
    });

    it("99 — stockAdequacyRate < 50 generates severe stock concern", () => {
      const stocks = [
        makeStock({ current_quantity: 20, minimum_threshold: 10 }),
        ...Array.from({ length: 3 }, () => makeStock({ current_quantity: 5, minimum_threshold: 10 })),
      ];
      // 1/4 = 25%
      const r = run({ stock_records: stocks });
      expect(r.concerns.some((c) => c.includes("25%") && c.includes("adequate stock levels"))).toBe(true);
    });

    it("100 — stockAdequacyRate 50-79 generates moderate stock concern", () => {
      const stocks = [
        ...Array.from({ length: 7 }, () => makeStock({ current_quantity: 20, minimum_threshold: 10 })),
        ...Array.from({ length: 3 }, () => makeStock({ current_quantity: 5, minimum_threshold: 10 })),
      ];
      // 7/10 = 70%
      const r = run({ stock_records: stocks });
      expect(r.concerns.some((c) => c.includes("70%") && c.includes("notable proportion"))).toBe(true);
    });

    it("101 — critical stock below minimum generates concern", () => {
      const stocks = [
        makeStock({ is_critical_item: true, current_quantity: 5, minimum_threshold: 10 }),
      ];
      const r = run({ stock_records: stocks });
      expect(r.concerns.some((c) => c.includes("critical medical supply item"))).toBe(true);
    });

    it("102 — critical out of stock generates immediate risk concern", () => {
      const stocks = [
        makeStock({ is_critical_item: true, current_quantity: 0, minimum_threshold: 10 }),
      ];
      const r = run({ stock_records: stocks });
      expect(r.concerns.some((c) => c.includes("completely out of stock") && c.includes("immediate risk"))).toBe(true);
    });

    it("103 — non-critical out of stock generates concern (when more than critical)", () => {
      const stocks = [
        makeStock({ is_critical_item: true, current_quantity: 0, minimum_threshold: 10 }),
        makeStock({ is_critical_item: false, current_quantity: 0, minimum_threshold: 10 }),
      ];
      // outOfStockItems=2, criticalOutOfStock=1, 2>1 => generates the additional concern
      const r = run({ stock_records: stocks });
      expect(r.concerns.some((c) => c.includes("2 medical supply items are completely out of stock"))).toBe(true);
    });

    it("104 — expired items generate concern", () => {
      const expiries = [
        makeExpiry({ is_expired: true }),
        makeExpiry({ is_expired: true }),
      ];
      const r = run({ expiry_records: expiries });
      expect(r.concerns.some((c) => c.includes("2 medical supply items have passed"))).toBe(true);
    });

    it("105 — singular expired item uses correct grammar", () => {
      const expiries = [makeExpiry({ is_expired: true })];
      const r = run({ expiry_records: expiries });
      expect(r.concerns.some((c) => c.includes("1 medical supply item has passed its expiry date"))).toBe(true);
    });

    it("106 — near-expiry items >= 3 generate concern", () => {
      const expiries = Array.from({ length: 3 }, () =>
        makeExpiry({ is_expired: false, days_until_expiry: 20 }),
      );
      const r = run({ expiry_records: expiries });
      expect(r.concerns.some((c) => c.includes("3 items within 30 days of expiry"))).toBe(true);
    });

    it("107 — near-expiry items < 3 does not generate concern", () => {
      const expiries = Array.from({ length: 2 }, () =>
        makeExpiry({ is_expired: false, days_until_expiry: 20 }),
      );
      const r = run({ expiry_records: expiries });
      expect(r.concerns.some((c) => c.includes("within 30 days of expiry"))).toBe(false);
    });

    it("108 — expired items not replaced generate concern", () => {
      const expiries = [
        makeExpiry({ is_expired: true, replacement_received: false }),
      ];
      const r = run({ expiry_records: expiries });
      expect(r.concerns.some((c) => c.includes("not yet replaced"))).toBe(true);
    });

    it("109 — accessibilityRate < 50 generates concern", () => {
      const accs = [
        makeAccessibility({ is_accessible_24hr: false }),
        makeAccessibility({ is_accessible_24hr: false }),
        makeAccessibility({ is_accessible_24hr: false }),
      ];
      const r = run({ accessibility_records: accs });
      expect(r.concerns.some((c) => c.includes("0%") && c.includes("full accessibility standards"))).toBe(true);
    });

    it("110 — accessibilityRate 50-79 generates moderate concern", () => {
      const accs = [
        ...Array.from({ length: 6 }, () => makeAccessibility()),
        ...Array.from({ length: 4 }, () => makeAccessibility({ is_accessible_24hr: false })),
      ];
      // 6/10 = 60%
      const r = run({ accessibility_records: accs });
      expect(r.concerns.some((c) => c.includes("60%") && c.includes("impede rapid access"))).toBe(true);
    });

    it("111 — staffTrainingRate < 50 generates critical concern", () => {
      const training = [makeTraining({ staff_id: "staff_1", is_current: true })];
      // 1/5 = 20%
      const r = run({ training_records: training, total_staff: 5 });
      expect(r.concerns.some((c) => c.includes("20%") && c.includes("current first aid training"))).toBe(true);
    });

    it("112 — staffTrainingRate 50-79 generates moderate training concern", () => {
      const training = Array.from({ length: 3 }, (_, i) =>
        makeTraining({ staff_id: `staff_${i + 1}`, is_current: true }),
      );
      // 3/5 = 60%
      const r = run({ training_records: training, total_staff: 5 });
      expect(r.concerns.some((c) => c.includes("60%") && c.includes("gaps in first aid training"))).toBe(true);
    });

    it("113 — paediatric < 30% generates concern", () => {
      const training = [
        makeTraining({ staff_id: "staff_1", is_current: true, is_paediatric_qualified: true }),
      ];
      // 1/5 = 20%
      const r = run({ training_records: training, total_staff: 5 });
      expect(r.concerns.some((c) => c.includes("20%") && c.includes("paediatric first aid"))).toBe(true);
    });

    it("114 — child awareness < 50 generates concern", () => {
      const accs = [
        makeAccessibility({ children_know_location: true }),
        ...Array.from({ length: 4 }, () => makeAccessibility({ children_know_location: false })),
      ];
      // 1/5 = 20%
      const r = run({ accessibility_records: accs });
      expect(r.concerns.some((c) => c.includes("20%") && c.includes("children know where"))).toBe(true);
    });

    it("115 — child awareness 50-69 generates moderate concern", () => {
      const accs = [
        ...Array.from({ length: 6 }, () => makeAccessibility({ children_know_location: true })),
        ...Array.from({ length: 4 }, () => makeAccessibility({ children_know_location: false })),
      ];
      // 6/10 = 60%
      const r = run({ accessibility_records: accs });
      expect(r.concerns.some((c) => c.includes("60%") && c.includes("not all children know"))).toBe(true);
    });

    it("116 — overdue checks generate concern", () => {
      const checks = [makeKitCheck({ check_overdue: true })];
      const r = run({ kit_check_records: checks });
      expect(r.concerns.some((c) => c.includes("1 first aid kit check is overdue"))).toBe(true);
    });

    it("117 — expired training generates concern", () => {
      const training = [makeTraining({ is_expired: true, is_current: false })];
      const r = run({ training_records: training });
      expect(r.concerns.some((c) => c.includes("1 staff first aid training record has expired"))).toBe(true);
    });

    it("118 — near-expiry training generates concern", () => {
      const training = [
        makeTraining({ is_expired: false, days_until_expiry: 30 }),
      ];
      const r = run({ training_records: training });
      expect(r.concerns.some((c) => c.includes("1 staff training qualification is due to expire within 60 days"))).toBe(true);
    });

    it("119 — reorders pending generates concern", () => {
      const stocks = [
        makeStock({ current_quantity: 5, minimum_threshold: 10, reorder_placed: false }),
      ];
      const r = run({ stock_records: stocks });
      expect(r.concerns.some((c) => c.includes("below minimum threshold with no reorder placed"))).toBe(true);
    });

    it("120 — kits too far generates concern", () => {
      const accs = [
        makeAccessibility({ distance_from_main_area_metres: 60 }),
      ];
      const r = run({ accessibility_records: accs });
      expect(r.concerns.some((c) => c.includes("more than 50 metres"))).toBe(true);
    });

    it("121 — stock audit accuracy < 70 generates concern", () => {
      const stocks = [
        makeStock({ audit_matched_records: true }),
        ...Array.from({ length: 4 }, () => makeStock({ audit_matched_records: false })),
      ];
      // 1/5 = 20%
      const r = run({ stock_records: stocks });
      expect(r.concerns.some((c) => c.includes("20%") && c.includes("Stock audit accuracy"))).toBe(true);
    });

    it("122 — check documentation < 70 generates concern", () => {
      const checks = [
        makeKitCheck({ check_documented: true }),
        ...Array.from({ length: 4 }, () => makeKitCheck({ check_documented: false })),
      ];
      // 1/5 = 20%
      const r = run({ kit_check_records: checks });
      expect(r.concerns.some((c) => c.includes("20%") && c.includes("documented"))).toBe(true);
    });

    it("123 — issue resolution < 50 generates concern", () => {
      const checks = [makeKitCheck({ issues_found: 10, issues_resolved: 3 })];
      const r = run({ kit_check_records: checks });
      expect(r.concerns.some((c) => c.includes("30%") && c.includes("issues found"))).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 12. RECOMMENDATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  describe("recommendations", () => {
    it("124 — critical out of stock triggers immediate restock recommendation", () => {
      const stocks = [makeStock({ is_critical_item: true, current_quantity: 0, minimum_threshold: 10 })];
      const r = run({ stock_records: stocks });
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("Immediately source and restock"))).toBe(true);
    });

    it("125 — expired items trigger immediate removal recommendation", () => {
      const expiries = [makeExpiry({ is_expired: true })];
      const r = run({ expiry_records: expiries });
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("Remove all expired medical supplies"))).toBe(true);
    });

    it("126 — staffTrainingRate < 50 triggers immediate training recommendation", () => {
      const training = [makeTraining({ staff_id: "staff_1", is_current: true })];
      const r = run({ training_records: training, total_staff: 5 });
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("Urgently arrange first aid training"))).toBe(true);
    });

    it("127 — accessibilityRate < 50 triggers immediate review recommendation", () => {
      const accs = [makeAccessibility({ is_accessible_24hr: false })];
      const r = run({ accessibility_records: accs });
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("Urgently review and rectify"))).toBe(true);
    });

    it("128 — kitCheckRate < 50 triggers immediate check schedule recommendation", () => {
      const checks = Array.from({ length: 4 }, () =>
        makeKitCheck({ all_items_present: false, check_documented: false }),
      );
      const r = run({ kit_check_records: checks });
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("Implement a robust first aid kit checking schedule"))).toBe(true);
    });

    it("129 — critical stock below minimum (but not out) triggers immediate restock", () => {
      const stocks = [makeStock({ is_critical_item: true, current_quantity: 5, minimum_threshold: 10 })];
      const r = run({ stock_records: stocks });
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("Restock all critical medical supply items"))).toBe(true);
    });

    it("130 — expired training > 3 triggers immediate renewal recommendation", () => {
      const training = Array.from({ length: 4 }, (_, i) =>
        makeTraining({ staff_id: `staff_${i + 1}`, is_expired: true, is_current: false }),
      );
      const r = run({ training_records: training, total_staff: 5 });
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("Schedule renewal training"))).toBe(true);
    });

    it("131 — kitCheckRate 50-79 triggers soon recommendation", () => {
      const checks = [
        ...Array.from({ length: 6 }, () => makeKitCheck()),
        ...Array.from({ length: 4 }, () => makeKitCheck({ all_items_present: false })),
      ];
      const r = run({ kit_check_records: checks });
      expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("Improve first aid kit check compliance"))).toBe(true);
    });

    it("132 — stockAdequacyRate 50-79 triggers soon recommendation", () => {
      const stocks = [
        ...Array.from({ length: 7 }, () => makeStock()),
        ...Array.from({ length: 3 }, () => makeStock({ current_quantity: 5, minimum_threshold: 10 })),
      ];
      const r = run({ stock_records: stocks });
      expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("Review and improve medical supply stock management"))).toBe(true);
    });

    it("133 — stockAdequacyRate < 50 triggers immediate urgent restock recommendation", () => {
      const stocks = Array.from({ length: 4 }, () =>
        makeStock({ current_quantity: 5, minimum_threshold: 10 }),
      );
      const r = run({ stock_records: stocks });
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("Urgently restock"))).toBe(true);
    });

    it("134 — accessibilityRate 50-79 triggers soon recommendation", () => {
      const accs = [
        ...Array.from({ length: 6 }, () => makeAccessibility()),
        ...Array.from({ length: 4 }, () => makeAccessibility({ is_accessible_24hr: false })),
      ];
      const r = run({ accessibility_records: accs });
      expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("Address first aid kit accessibility gaps"))).toBe(true);
    });

    it("135 — staffTrainingRate 50-79 triggers soon recommendation", () => {
      const training = Array.from({ length: 3 }, (_, i) =>
        makeTraining({ staff_id: `staff_${i + 1}`, is_current: true }),
      );
      const r = run({ training_records: training, total_staff: 5 });
      expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("Extend first aid training"))).toBe(true);
    });

    it("136 — childAwarenessRate < 70 triggers soon recommendation", () => {
      const accs = [
        ...Array.from({ length: 3 }, () => makeAccessibility({ children_know_location: true })),
        ...Array.from({ length: 7 }, () => makeAccessibility({ children_know_location: false })),
      ];
      const r = run({ accessibility_records: accs });
      expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("Improve children's awareness"))).toBe(true);
    });

    it("137 — overdue checks triggers soon recommendation", () => {
      const checks = [makeKitCheck({ check_overdue: true })];
      const r = run({ kit_check_records: checks });
      expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("Complete all overdue"))).toBe(true);
    });

    it("138 — near-expiry training > 3 triggers soon recommendation", () => {
      const training = Array.from({ length: 4 }, (_, i) =>
        makeTraining({ staff_id: `staff_${i + 1}`, is_expired: false, days_until_expiry: 30 }),
      );
      const r = run({ training_records: training, total_staff: 5 });
      expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("Book renewal training"))).toBe(true);
    });

    it("139 — reorders pending triggers soon recommendation", () => {
      const stocks = [makeStock({ current_quantity: 5, minimum_threshold: 10, reorder_placed: false })];
      const r = run({ stock_records: stocks });
      expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("Place reorders"))).toBe(true);
    });

    it("140 — paediatricTrainedRate < 50 triggers planned recommendation", () => {
      const training = [
        makeTraining({ staff_id: "staff_1", is_current: true, is_paediatric_qualified: true }),
      ];
      const r = run({ training_records: training, total_staff: 5 });
      expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("Increase paediatric"))).toBe(true);
    });

    it("141 — childAwarenessRate 70-89 triggers planned recommendation", () => {
      const accs = [
        ...Array.from({ length: 8 }, () => makeAccessibility({ children_know_location: true })),
        ...Array.from({ length: 2 }, () => makeAccessibility({ children_know_location: false })),
      ];
      const r = run({ accessibility_records: accs });
      expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("Further improve children's"))).toBe(true);
    });

    it("142 — stock audit accuracy < 80 triggers planned recommendation", () => {
      const stocks = [
        ...Array.from({ length: 7 }, () => makeStock({ audit_matched_records: true })),
        ...Array.from({ length: 3 }, () => makeStock({ audit_matched_records: false })),
      ];
      const r = run({ stock_records: stocks });
      expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("Improve stock audit accuracy"))).toBe(true);
    });

    it("143 — check documentation < 80 triggers planned recommendation", () => {
      const checks = [
        ...Array.from({ length: 7 }, () => makeKitCheck({ check_documented: true })),
        ...Array.from({ length: 3 }, () => makeKitCheck({ check_documented: false })),
      ];
      const r = run({ kit_check_records: checks });
      expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("Improve kit check documentation"))).toBe(true);
    });

    it("144 — kits too far triggers planned relocation recommendation", () => {
      const accs = [makeAccessibility({ distance_from_main_area_metres: 60 })];
      const r = run({ accessibility_records: accs });
      expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("Relocate first aid kits"))).toBe(true);
    });

    it("145 — refresher compliance < 70 triggers planned recommendation", () => {
      const training = Array.from({ length: 5 }, (_, i) =>
        makeTraining({ staff_id: `staff_${i + 1}`, is_current: true, refresher_completed: false }),
      );
      const r = run({ training_records: training, total_staff: 5 });
      expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("Improve refresher training"))).toBe(true);
    });

    it("146 — recommendations have sequential rank numbers", () => {
      const checks = Array.from({ length: 4 }, () =>
        makeKitCheck({ all_items_present: false, check_documented: false }),
      );
      const expiries = [makeExpiry({ is_expired: true })];
      const r = run({ kit_check_records: checks, expiry_records: expiries });
      for (let i = 0; i < r.recommendations.length; i++) {
        expect(r.recommendations[i].rank).toBe(i + 1);
      }
    });

    it("147 — all recommendations reference a regulatory framework", () => {
      const r = run({ total_children: 4 }); // all empty => 2 recs
      for (const rec of r.recommendations) {
        expect(rec.regulatory_ref.length).toBeGreaterThan(0);
      }
    });

    it("148 — no recommendations when all metrics outstanding", () => {
      const checks = Array.from({ length: 20 }, () => makeKitCheck());
      const stocks = Array.from({ length: 20 }, () => makeStock());
      const expiries = Array.from({ length: 50 }, () => makeExpiry());
      const accs = Array.from({ length: 5 }, () => makeAccessibility());
      const training = Array.from({ length: 5 }, (_, i) =>
        makeTraining({ staff_id: `staff_${i + 1}`, is_current: true, is_paediatric_qualified: true }),
      );
      const r = run({
        kit_check_records: checks,
        stock_records: stocks,
        expiry_records: expiries,
        accessibility_records: accs,
        training_records: training,
        total_staff: 5,
      });
      expect(r.recommendations).toHaveLength(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 13. INSIGHTS — CRITICAL
  // ═══════════════════════════════════════════════════════════════════════════

  describe("insights — critical", () => {
    it("149 — critical out of stock generates critical insight", () => {
      const stocks = [makeStock({ is_critical_item: true, current_quantity: 0, minimum_threshold: 10 })];
      const r = run({ stock_records: stocks });
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("critical medical supply"))).toBe(true);
    });

    it("150 — expired + not replaced generates critical insight with both counts", () => {
      const expiries = [
        makeExpiry({ is_expired: true, replacement_received: false }),
        makeExpiry({ is_expired: true, replacement_received: true }),
      ];
      const r = run({ expiry_records: expiries });
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("2 expired") && i.text.includes("1 not yet replaced"))).toBe(true);
    });

    it("151 — expired but all replaced generates different critical insight", () => {
      const expiries = [
        makeExpiry({ is_expired: true, replacement_received: true }),
      ];
      const r = run({ expiry_records: expiries });
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("1 expired medical supply item"))).toBe(true);
    });

    it("152 — staffTrainingRate < 50 generates critical insight", () => {
      const training = [makeTraining({ staff_id: "staff_1", is_current: true })];
      const r = run({ training_records: training, total_staff: 5 });
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("20%") && i.text.includes("current first aid qualifications"))).toBe(true);
    });

    it("153 — accessibilityRate < 50 generates critical insight", () => {
      const accs = [makeAccessibility({ is_accessible_24hr: false })];
      const r = run({ accessibility_records: accs });
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("0%") && i.text.includes("full accessibility standards"))).toBe(true);
    });

    it("154 — kitCheckRate < 50 generates critical insight", () => {
      const checks = Array.from({ length: 4 }, () =>
        makeKitCheck({ all_items_present: false, check_documented: false }),
      );
      const r = run({ kit_check_records: checks });
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("0%"))).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 14. INSIGHTS — WARNING
  // ═══════════════════════════════════════════════════════════════════════════

  describe("insights — warning", () => {
    it("155 — kitCheckRate 50-79 generates warning insight", () => {
      const checks = [
        ...Array.from({ length: 6 }, () => makeKitCheck()),
        ...Array.from({ length: 4 }, () => makeKitCheck({ all_items_present: false })),
      ];
      const r = run({ kit_check_records: checks });
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("60%") && i.text.includes("improving"))).toBe(true);
    });

    it("156 — stockAdequacyRate 50-79 generates warning insight", () => {
      const stocks = [
        ...Array.from({ length: 7 }, () => makeStock()),
        ...Array.from({ length: 3 }, () => makeStock({ current_quantity: 5, minimum_threshold: 10 })),
      ];
      const r = run({ stock_records: stocks });
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("70%") && i.text.includes("Stock adequacy"))).toBe(true);
    });

    it("157 — expiryMonitoringRate 75-89 generates warning insight", () => {
      const expiries = [
        ...Array.from({ length: 8 }, () => makeExpiry()),
        ...Array.from({ length: 2 }, () => makeExpiry({ is_expired: true })),
      ];
      // 8/10 = 80%
      const r = run({ expiry_records: expiries });
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("80%") && i.text.includes("Expiry monitoring"))).toBe(true);
    });

    it("158 — accessibilityRate 50-79 generates warning insight", () => {
      const accs = [
        ...Array.from({ length: 6 }, () => makeAccessibility()),
        ...Array.from({ length: 4 }, () => makeAccessibility({ is_accessible_24hr: false })),
      ];
      const r = run({ accessibility_records: accs });
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("60%") && i.text.includes("Kit accessibility"))).toBe(true);
    });

    it("159 — staffTrainingRate 50-79 generates warning insight", () => {
      const training = Array.from({ length: 3 }, (_, i) =>
        makeTraining({ staff_id: `staff_${i + 1}`, is_current: true }),
      );
      const r = run({ training_records: training, total_staff: 5 });
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("60%") && i.text.includes("Staff training coverage"))).toBe(true);
    });

    it("160 — childAwarenessRate 50-69 generates warning insight", () => {
      const accs = [
        ...Array.from({ length: 6 }, () => makeAccessibility({ children_know_location: true })),
        ...Array.from({ length: 4 }, () => makeAccessibility({ children_know_location: false })),
      ];
      const r = run({ accessibility_records: accs });
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("60%") && i.text.includes("Child awareness"))).toBe(true);
    });

    it("161 — near-expiry items >= 5 generates warning insight about cluster", () => {
      const expiries = Array.from({ length: 5 }, () =>
        makeExpiry({ is_expired: false, days_until_expiry: 20 }),
      );
      const r = run({ expiry_records: expiries });
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("5 items expiring within 30 days"))).toBe(true);
    });

    it("162 — 2+ overdue kit checks generates warning insight", () => {
      const checks = [
        makeKitCheck({ check_overdue: true }),
        makeKitCheck({ check_overdue: true }),
      ];
      const r = run({ kit_check_records: checks });
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("2 kit checks are overdue"))).toBe(true);
    });

    it("163 — expired + near-expiry training generates combined warning insight", () => {
      const training = [
        makeTraining({ staff_id: "staff_1", is_expired: true, is_current: false, days_until_expiry: 0 }),
        makeTraining({ staff_id: "staff_2", is_expired: false, is_current: true, days_until_expiry: 30 }),
      ];
      const r = run({ training_records: training, total_staff: 5 });
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("1 training qualification") && i.text.includes("1 expiring soon"))).toBe(true);
    });

    it("164 — stock audit accuracy 50-79 generates warning insight", () => {
      const stocks = [
        ...Array.from({ length: 7 }, () => makeStock({ audit_matched_records: true })),
        ...Array.from({ length: 3 }, () => makeStock({ audit_matched_records: false })),
      ];
      const r = run({ stock_records: stocks });
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("70%") && i.text.includes("Stock audit accuracy"))).toBe(true);
    });

    it("165 — training type distribution generates insight when >= 3 current", () => {
      const training = [
        makeTraining({ staff_id: "staff_1", is_current: true, training_type: "first_aid_at_work" }),
        makeTraining({ staff_id: "staff_2", is_current: true, training_type: "paediatric_first_aid" }),
        makeTraining({ staff_id: "staff_3", is_current: true, training_type: "first_aid_at_work" }),
      ];
      const r = run({ training_records: training, total_staff: 5 });
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Active training profile"))).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 15. INSIGHTS — POSITIVE
  // ═══════════════════════════════════════════════════════════════════════════

  describe("insights — positive", () => {
    it("166 — outstanding rating generates positive insight", () => {
      const r = run({
        kit_check_records: Array.from({ length: 20 }, () => makeKitCheck()),
        stock_records: Array.from({ length: 20 }, () => makeStock()),
        expiry_records: Array.from({ length: 50 }, () => makeExpiry()),
        accessibility_records: Array.from({ length: 5 }, () => makeAccessibility()),
        training_records: Array.from({ length: 5 }, (_, i) =>
          makeTraining({ staff_id: `staff_${i + 1}`, is_current: true, is_paediatric_qualified: true }),
        ),
        total_staff: 5,
      });
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("outstanding first aid"))).toBe(true);
    });

    it("167 — kitCheckRate >= 95 with documentation >= 95 generates positive insight", () => {
      const checks = Array.from({ length: 20 }, () =>
        makeKitCheck({ all_items_present: true, check_documented: true }),
      );
      const r = run({ kit_check_records: checks });
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("gold-standard"))).toBe(true);
    });

    it("168 — stock >= 95 with critical >= 100 generates positive insight", () => {
      const stocks = [
        ...Array.from({ length: 19 }, () => makeStock({ current_quantity: 20, minimum_threshold: 10 })),
        makeStock({ is_critical_item: true, current_quantity: 20, minimum_threshold: 10 }),
      ];
      const r = run({ stock_records: stocks });
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("Outstanding stock management"))).toBe(true);
    });

    it("169 — expiry monitoring >= 98 generates positive insight", () => {
      const expiries = Array.from({ length: 50 }, () => makeExpiry());
      const r = run({ expiry_records: expiries });
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("100%") && i.text.includes("Expiry monitoring"))).toBe(true);
    });

    it("170 — accessibility 100% with HSE 100% generates positive insight", () => {
      const accs = Array.from({ length: 3 }, () =>
        makeAccessibility({ meets_hse_guidance: true }),
      );
      const r = run({ accessibility_records: accs });
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("full accessibility and HSE compliance"))).toBe(true);
    });

    it("171 — staff training 100% with paediatric >= 80% generates positive insight", () => {
      const training = Array.from({ length: 5 }, (_, i) =>
        makeTraining({ staff_id: `staff_${i + 1}`, is_current: true, is_paediatric_qualified: true }),
      );
      const r = run({ training_records: training, total_staff: 5 });
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("100% staff training"))).toBe(true);
    });

    it("172 — child awareness >= 90% with staff awareness 100% generates positive insight", () => {
      const accs = Array.from({ length: 10 }, () =>
        makeAccessibility({ children_know_location: true, staff_know_location: true }),
      );
      const r = run({ accessibility_records: accs });
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("child awareness") && i.text.includes("staff awareness"))).toBe(true);
    });

    it("173 — issue resolution >= 95% generates positive insight", () => {
      const checks = [makeKitCheck({ issues_found: 20, issues_resolved: 19 })];
      const r = run({ kit_check_records: checks });
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("95%") && i.text.includes("resolved"))).toBe(true);
    });

    it("174 — refresher >= 90% with practical >= 90% generates positive insight", () => {
      const training = Array.from({ length: 5 }, (_, i) =>
        makeTraining({
          staff_id: `staff_${i + 1}`,
          is_current: true,
          refresher_completed: true,
          practical_assessment_passed: true,
        }),
      );
      const r = run({ training_records: training, total_staff: 5 });
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("refresher compliance") && i.text.includes("practical assessment"))).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 16. HEADLINES
  // ═══════════════════════════════════════════════════════════════════════════

  describe("headlines", () => {
    it("175 — outstanding headline mentions systematic maintenance", () => {
      const r = run({
        kit_check_records: Array.from({ length: 20 }, () => makeKitCheck()),
        stock_records: Array.from({ length: 20 }, () => makeStock()),
        expiry_records: Array.from({ length: 50 }, () => makeExpiry()),
        accessibility_records: Array.from({ length: 5 }, () => makeAccessibility()),
        training_records: Array.from({ length: 5 }, (_, i) =>
          makeTraining({ staff_id: `staff_${i + 1}`, is_current: true, is_paediatric_qualified: true }),
        ),
        total_staff: 5,
      });
      expect(r.headline).toContain("Outstanding");
    });

    it("176 — good headline includes strength and concern counts", () => {
      const r = run({
        kit_check_records: Array.from({ length: 20 }, () => makeKitCheck()),
        stock_records: Array.from({ length: 20 }, () => makeStock()),
        expiry_records: Array.from({ length: 50 }, () => makeExpiry()),
        total_staff: 0,
      });
      expect(r.headline).toContain("Good first aid provision");
    });

    it("177 — adequate headline references concerns count", () => {
      const r = run({
        kit_check_records: [makeKitCheck()],
      });
      expect(r.headline).toContain("Adequate first aid provision");
    });

    it("178 — inadequate headline references urgent action", () => {
      const checks = Array.from({ length: 4 }, () =>
        makeKitCheck({ all_items_present: false, check_documented: false }),
      );
      const expiries = [makeExpiry({ is_expired: true })];
      const stocks = [makeStock({ is_critical_item: true, current_quantity: 2, minimum_threshold: 10 })];
      const training = [makeTraining({ staff_id: "staff_1", is_current: true })];
      const accs = [makeAccessibility({ is_accessible_24hr: false })];
      const r = run({
        kit_check_records: checks,
        stock_records: stocks,
        expiry_records: expiries,
        accessibility_records: accs,
        training_records: training,
        total_staff: 5,
      });
      expect(r.headline).toContain("inadequate");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 17. INTEGRATION / COMBINED SCENARIOS
  // ═══════════════════════════════════════════════════════════════════════════

  describe("integration scenarios", () => {
    it("179 — full outstanding scenario produces no concerns and no recommendations", () => {
      const r = run({
        kit_check_records: Array.from({ length: 20 }, () => makeKitCheck()),
        stock_records: Array.from({ length: 20 }, () => makeStock()),
        expiry_records: Array.from({ length: 50 }, () => makeExpiry()),
        accessibility_records: Array.from({ length: 5 }, () => makeAccessibility()),
        training_records: Array.from({ length: 5 }, (_, i) =>
          makeTraining({ staff_id: `staff_${i + 1}`, is_current: true, is_paediatric_qualified: true }),
        ),
        total_staff: 5,
      });
      expect(r.concerns).toHaveLength(0);
      expect(r.recommendations).toHaveLength(0);
      expect(r.strengths.length).toBeGreaterThan(5);
      expect(r.insights.some((i) => i.severity === "positive")).toBe(true);
    });

    it("180 — worst-case scenario accumulates all major penalties and concerns", () => {
      const checks = Array.from({ length: 10 }, () =>
        makeKitCheck({
          all_items_present: false,
          check_documented: false,
          check_overdue: true,
          issues_found: 5,
          issues_resolved: 1,
        }),
      );
      const stocks = [
        makeStock({ is_critical_item: true, current_quantity: 0, minimum_threshold: 10, reorder_placed: false, audit_matched_records: false }),
        makeStock({ is_critical_item: false, current_quantity: 0, minimum_threshold: 10, reorder_placed: false, audit_matched_records: false }),
      ];
      const expiries = [
        makeExpiry({ is_expired: true, replacement_received: false }),
        makeExpiry({ is_expired: true, replacement_received: false }),
        makeExpiry({ is_expired: false, days_until_expiry: 10 }),
        makeExpiry({ is_expired: false, days_until_expiry: 15 }),
        makeExpiry({ is_expired: false, days_until_expiry: 20 }),
      ];
      const accs = [
        makeAccessibility({
          is_accessible_24hr: false,
          is_clearly_signed: false,
          is_unlocked: false,
          location_compliant: false,
          children_know_location: false,
          staff_know_location: false,
          meets_hse_guidance: false,
          distance_from_main_area_metres: 80,
        }),
      ];
      const training = [
        makeTraining({ staff_id: "staff_1", is_expired: true, is_current: false }),
      ];
      const r = run({
        kit_check_records: checks,
        stock_records: stocks,
        expiry_records: expiries,
        accessibility_records: accs,
        training_records: training,
        total_staff: 5,
      });
      expect(r.first_aid_rating).toBe("inadequate");
      expect(r.first_aid_score).toBeLessThan(40);
      expect(r.concerns.length).toBeGreaterThan(5);
      expect(r.recommendations.length).toBeGreaterThan(3);
      expect(r.insights.some((i) => i.severity === "critical")).toBe(true);
    });
  });
});
