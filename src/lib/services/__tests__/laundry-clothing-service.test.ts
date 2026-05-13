// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — LAUNDRY & CLOTHING SERVICE TESTS
// Pure-function tests for laundry/clothing metrics, alert identification,
// constant validation, and edge cases.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";

import {
  CLOTHING_EVENT_TYPES,
  CLOTHING_CONDITIONS,
  LAUNDRY_STANDARDS,
  CHOICE_LEVELS,
  _testing,
} from "../laundry-clothing-service";

import type {
  LaundryClothingRecord,
  ClothingEventType,
  ClothingCondition,
  LaundryStandard,
  ChoiceLevel,
} from "../laundry-clothing-service";

const { computeLaundryClothingMetrics, identifyLaundryClothingAlerts } = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

function makeRecord(
  overrides?: Partial<LaundryClothingRecord>,
): LaundryClothingRecord {
  return {
    id: "id" in (overrides ?? {}) ? overrides!.id! : crypto.randomUUID(),
    home_id: "home_id" in (overrides ?? {}) ? overrides!.home_id! : "home-1",
    event_type: "event_type" in (overrides ?? {}) ? overrides!.event_type! : "clothing_purchase",
    event_date: "event_date" in (overrides ?? {}) ? overrides!.event_date! : "2026-05-01",
    child_name: "child_name" in (overrides ?? {}) ? overrides!.child_name! : "Test Child",
    clothing_condition: "clothing_condition" in (overrides ?? {}) ? overrides!.clothing_condition! : "good",
    laundry_standard: "laundry_standard" in (overrides ?? {}) ? overrides!.laundry_standard! : "good",
    choice_level: "choice_level" in (overrides ?? {}) ? overrides!.choice_level! : "full_choice",
    child_chose_own_clothes: "child_chose_own_clothes" in (overrides ?? {}) ? overrides!.child_chose_own_clothes! : true,
    adequate_wardrobe: "adequate_wardrobe" in (overrides ?? {}) ? overrides!.adequate_wardrobe! : true,
    school_uniform_adequate: "school_uniform_adequate" in (overrides ?? {}) ? overrides!.school_uniform_adequate! : true,
    seasonal_clothing_adequate: "seasonal_clothing_adequate" in (overrides ?? {}) ? overrides!.seasonal_clothing_adequate! : true,
    laundry_done_regularly: "laundry_done_regularly" in (overrides ?? {}) ? overrides!.laundry_done_regularly! : true,
    clothes_returned_promptly: "clothes_returned_promptly" in (overrides ?? {}) ? overrides!.clothes_returned_promptly! : true,
    personal_items_labelled: "personal_items_labelled" in (overrides ?? {}) ? overrides!.personal_items_labelled! : true,
    budget_amount: "budget_amount" in (overrides ?? {}) ? (overrides!.budget_amount ?? null) : null,
    amount_spent: "amount_spent" in (overrides ?? {}) ? (overrides!.amount_spent ?? null) : null,
    dignity_maintained: "dignity_maintained" in (overrides ?? {}) ? overrides!.dignity_maintained! : true,
    cultural_needs_met: "cultural_needs_met" in (overrides ?? {}) ? overrides!.cultural_needs_met! : true,
    issues_found: "issues_found" in (overrides ?? {}) ? overrides!.issues_found! : [],
    actions_taken: "actions_taken" in (overrides ?? {}) ? overrides!.actions_taken! : [],
    assessed_by: "assessed_by" in (overrides ?? {}) ? overrides!.assessed_by! : "Staff Member",
    next_review_date: "next_review_date" in (overrides ?? {}) ? (overrides!.next_review_date ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: "created_at" in (overrides ?? {}) ? overrides!.created_at! : "2026-05-01T08:00:00Z",
    updated_at: "updated_at" in (overrides ?? {}) ? overrides!.updated_at! : "2026-05-01T08:00:00Z",
  };
}

/** Return an ISO date string for N days ago from now */
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

/** Return an ISO date string for N days from now (future) */
function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

// ── Constants ──────────────────────────────────────────────────────────────

describe("Constants", () => {
  describe("CLOTHING_EVENT_TYPES", () => {
    it("has exactly 9 items", () => {
      expect(CLOTHING_EVENT_TYPES).toHaveLength(9);
    });

    it("contains clothing_purchase", () => {
      expect(CLOTHING_EVENT_TYPES).toContainEqual({ type: "clothing_purchase", label: "Clothing Purchase" });
    });

    it("contains clothing_inventory", () => {
      expect(CLOTHING_EVENT_TYPES).toContainEqual({ type: "clothing_inventory", label: "Clothing Inventory" });
    });

    it("contains laundry_check", () => {
      expect(CLOTHING_EVENT_TYPES).toContainEqual({ type: "laundry_check", label: "Laundry Check" });
    });

    it("contains uniform_provision", () => {
      expect(CLOTHING_EVENT_TYPES).toContainEqual({ type: "uniform_provision", label: "Uniform Provision" });
    });

    it("contains seasonal_update", () => {
      expect(CLOTHING_EVENT_TYPES).toContainEqual({ type: "seasonal_update", label: "Seasonal Update" });
    });

    it("contains clothing_repair", () => {
      expect(CLOTHING_EVENT_TYPES).toContainEqual({ type: "clothing_repair", label: "Clothing Repair" });
    });

    it("contains personal_care_items", () => {
      expect(CLOTHING_EVENT_TYPES).toContainEqual({ type: "personal_care_items", label: "Personal Care Items" });
    });

    it("contains budget_review", () => {
      expect(CLOTHING_EVENT_TYPES).toContainEqual({ type: "budget_review", label: "Budget Review" });
    });

    it("contains other", () => {
      expect(CLOTHING_EVENT_TYPES).toContainEqual({ type: "other", label: "Other" });
    });

    it("has unique type values", () => {
      const types = CLOTHING_EVENT_TYPES.map((t) => t.type);
      expect(new Set(types).size).toBe(types.length);
    });

    it("has unique labels", () => {
      const labels = CLOTHING_EVENT_TYPES.map((t) => t.label);
      expect(new Set(labels).size).toBe(labels.length);
    });

    it("every entry has a non-empty label", () => {
      for (const entry of CLOTHING_EVENT_TYPES) {
        expect(entry.label.length).toBeGreaterThan(0);
      }
    });
  });

  describe("CLOTHING_CONDITIONS", () => {
    it("has exactly 5 items", () => {
      expect(CLOTHING_CONDITIONS).toHaveLength(5);
    });

    it("contains new", () => {
      expect(CLOTHING_CONDITIONS).toContainEqual({ condition: "new", label: "New" });
    });

    it("contains good", () => {
      expect(CLOTHING_CONDITIONS).toContainEqual({ condition: "good", label: "Good" });
    });

    it("contains fair", () => {
      expect(CLOTHING_CONDITIONS).toContainEqual({ condition: "fair", label: "Fair" });
    });

    it("contains worn", () => {
      expect(CLOTHING_CONDITIONS).toContainEqual({ condition: "worn", label: "Worn" });
    });

    it("contains needs_replacing", () => {
      expect(CLOTHING_CONDITIONS).toContainEqual({ condition: "needs_replacing", label: "Needs Replacing" });
    });

    it("has unique condition values", () => {
      const conditions = CLOTHING_CONDITIONS.map((c) => c.condition);
      expect(new Set(conditions).size).toBe(conditions.length);
    });

    it("has unique labels", () => {
      const labels = CLOTHING_CONDITIONS.map((c) => c.label);
      expect(new Set(labels).size).toBe(labels.length);
    });

    it("every entry has a non-empty label", () => {
      for (const entry of CLOTHING_CONDITIONS) {
        expect(entry.label.length).toBeGreaterThan(0);
      }
    });
  });

  describe("LAUNDRY_STANDARDS", () => {
    it("has exactly 5 items", () => {
      expect(LAUNDRY_STANDARDS).toHaveLength(5);
    });

    it("contains excellent", () => {
      expect(LAUNDRY_STANDARDS).toContainEqual({ standard: "excellent", label: "Excellent" });
    });

    it("contains good", () => {
      expect(LAUNDRY_STANDARDS).toContainEqual({ standard: "good", label: "Good" });
    });

    it("contains acceptable", () => {
      expect(LAUNDRY_STANDARDS).toContainEqual({ standard: "acceptable", label: "Acceptable" });
    });

    it("contains poor", () => {
      expect(LAUNDRY_STANDARDS).toContainEqual({ standard: "poor", label: "Poor" });
    });

    it("contains not_assessed", () => {
      expect(LAUNDRY_STANDARDS).toContainEqual({ standard: "not_assessed", label: "Not Assessed" });
    });

    it("has unique standard values", () => {
      const standards = LAUNDRY_STANDARDS.map((s) => s.standard);
      expect(new Set(standards).size).toBe(standards.length);
    });

    it("has unique labels", () => {
      const labels = LAUNDRY_STANDARDS.map((s) => s.label);
      expect(new Set(labels).size).toBe(labels.length);
    });

    it("every entry has a non-empty label", () => {
      for (const entry of LAUNDRY_STANDARDS) {
        expect(entry.label.length).toBeGreaterThan(0);
      }
    });
  });

  describe("CHOICE_LEVELS", () => {
    it("has exactly 5 items", () => {
      expect(CHOICE_LEVELS).toHaveLength(5);
    });

    it("contains full_choice", () => {
      expect(CHOICE_LEVELS).toContainEqual({ level: "full_choice", label: "Full Choice" });
    });

    it("contains some_choice", () => {
      expect(CHOICE_LEVELS).toContainEqual({ level: "some_choice", label: "Some Choice" });
    });

    it("contains limited_choice", () => {
      expect(CHOICE_LEVELS).toContainEqual({ level: "limited_choice", label: "Limited Choice" });
    });

    it("contains no_choice", () => {
      expect(CHOICE_LEVELS).toContainEqual({ level: "no_choice", label: "No Choice" });
    });

    it("contains not_assessed", () => {
      expect(CHOICE_LEVELS).toContainEqual({ level: "not_assessed", label: "Not Assessed" });
    });

    it("has unique level values", () => {
      const levels = CHOICE_LEVELS.map((l) => l.level);
      expect(new Set(levels).size).toBe(levels.length);
    });

    it("has unique labels", () => {
      const labels = CHOICE_LEVELS.map((l) => l.label);
      expect(new Set(labels).size).toBe(labels.length);
    });

    it("every entry has a non-empty label", () => {
      for (const entry of CHOICE_LEVELS) {
        expect(entry.label.length).toBeGreaterThan(0);
      }
    });
  });
});

// ── computeLaundryClothingMetrics ──────────────────────────────────────────

describe("computeLaundryClothingMetrics", () => {
  describe("empty array", () => {
    it("returns zero total_records", () => {
      const m = computeLaundryClothingMetrics([]);
      expect(m.total_records).toBe(0);
    });

    it("returns zero clothing_purchase_count", () => {
      const m = computeLaundryClothingMetrics([]);
      expect(m.clothing_purchase_count).toBe(0);
    });

    it("returns zero clothing_inventory_count", () => {
      const m = computeLaundryClothingMetrics([]);
      expect(m.clothing_inventory_count).toBe(0);
    });

    it("returns zero laundry_check_count", () => {
      const m = computeLaundryClothingMetrics([]);
      expect(m.laundry_check_count).toBe(0);
    });

    it("returns zero child_chose_own_rate", () => {
      const m = computeLaundryClothingMetrics([]);
      expect(m.child_chose_own_rate).toBe(0);
    });

    it("returns zero adequate_wardrobe_rate", () => {
      const m = computeLaundryClothingMetrics([]);
      expect(m.adequate_wardrobe_rate).toBe(0);
    });

    it("returns zero school_uniform_adequate_rate", () => {
      const m = computeLaundryClothingMetrics([]);
      expect(m.school_uniform_adequate_rate).toBe(0);
    });

    it("returns zero seasonal_clothing_rate", () => {
      const m = computeLaundryClothingMetrics([]);
      expect(m.seasonal_clothing_rate).toBe(0);
    });

    it("returns zero laundry_done_regularly_rate", () => {
      const m = computeLaundryClothingMetrics([]);
      expect(m.laundry_done_regularly_rate).toBe(0);
    });

    it("returns zero clothes_returned_promptly_rate", () => {
      const m = computeLaundryClothingMetrics([]);
      expect(m.clothes_returned_promptly_rate).toBe(0);
    });

    it("returns zero dignity_maintained_rate", () => {
      const m = computeLaundryClothingMetrics([]);
      expect(m.dignity_maintained_rate).toBe(0);
    });

    it("returns zero cultural_needs_met_rate", () => {
      const m = computeLaundryClothingMetrics([]);
      expect(m.cultural_needs_met_rate).toBe(0);
    });

    it("returns zero poor_laundry_count", () => {
      const m = computeLaundryClothingMetrics([]);
      expect(m.poor_laundry_count).toBe(0);
    });

    it("returns zero needs_replacing_count", () => {
      const m = computeLaundryClothingMetrics([]);
      expect(m.needs_replacing_count).toBe(0);
    });

    it("returns zero no_choice_count", () => {
      const m = computeLaundryClothingMetrics([]);
      expect(m.no_choice_count).toBe(0);
    });

    it("returns zero full_choice_rate", () => {
      const m = computeLaundryClothingMetrics([]);
      expect(m.full_choice_rate).toBe(0);
    });

    it("returns zero total_budget", () => {
      const m = computeLaundryClothingMetrics([]);
      expect(m.total_budget).toBe(0);
    });

    it("returns zero total_spent", () => {
      const m = computeLaundryClothingMetrics([]);
      expect(m.total_spent).toBe(0);
    });

    it("returns zero review_overdue_count", () => {
      const m = computeLaundryClothingMetrics([]);
      expect(m.review_overdue_count).toBe(0);
    });

    it("returns empty by_event_type", () => {
      const m = computeLaundryClothingMetrics([]);
      expect(m.by_event_type).toEqual({});
    });

    it("returns empty by_clothing_condition", () => {
      const m = computeLaundryClothingMetrics([]);
      expect(m.by_clothing_condition).toEqual({});
    });

    it("returns empty by_laundry_standard", () => {
      const m = computeLaundryClothingMetrics([]);
      expect(m.by_laundry_standard).toEqual({});
    });

    it("returns empty by_choice_level", () => {
      const m = computeLaundryClothingMetrics([]);
      expect(m.by_choice_level).toEqual({});
    });
  });

  describe("single record", () => {
    const record = makeRecord({
      event_type: "clothing_purchase",
      clothing_condition: "good",
      laundry_standard: "excellent",
      choice_level: "full_choice",
      child_chose_own_clothes: true,
      adequate_wardrobe: true,
      school_uniform_adequate: true,
      seasonal_clothing_adequate: true,
      laundry_done_regularly: true,
      clothes_returned_promptly: true,
      dignity_maintained: true,
      cultural_needs_met: true,
      budget_amount: 150.0,
      amount_spent: 120.50,
    });

    it("returns total_records = 1", () => {
      const m = computeLaundryClothingMetrics([record]);
      expect(m.total_records).toBe(1);
    });

    it("returns clothing_purchase_count = 1", () => {
      const m = computeLaundryClothingMetrics([record]);
      expect(m.clothing_purchase_count).toBe(1);
    });

    it("returns clothing_inventory_count = 0", () => {
      const m = computeLaundryClothingMetrics([record]);
      expect(m.clothing_inventory_count).toBe(0);
    });

    it("returns laundry_check_count = 0", () => {
      const m = computeLaundryClothingMetrics([record]);
      expect(m.laundry_check_count).toBe(0);
    });

    it("returns child_chose_own_rate = 100", () => {
      const m = computeLaundryClothingMetrics([record]);
      expect(m.child_chose_own_rate).toBe(100);
    });

    it("returns adequate_wardrobe_rate = 100", () => {
      const m = computeLaundryClothingMetrics([record]);
      expect(m.adequate_wardrobe_rate).toBe(100);
    });

    it("returns school_uniform_adequate_rate = 100", () => {
      const m = computeLaundryClothingMetrics([record]);
      expect(m.school_uniform_adequate_rate).toBe(100);
    });

    it("returns seasonal_clothing_rate = 100", () => {
      const m = computeLaundryClothingMetrics([record]);
      expect(m.seasonal_clothing_rate).toBe(100);
    });

    it("returns laundry_done_regularly_rate = 100", () => {
      const m = computeLaundryClothingMetrics([record]);
      expect(m.laundry_done_regularly_rate).toBe(100);
    });

    it("returns clothes_returned_promptly_rate = 100", () => {
      const m = computeLaundryClothingMetrics([record]);
      expect(m.clothes_returned_promptly_rate).toBe(100);
    });

    it("returns dignity_maintained_rate = 100", () => {
      const m = computeLaundryClothingMetrics([record]);
      expect(m.dignity_maintained_rate).toBe(100);
    });

    it("returns cultural_needs_met_rate = 100", () => {
      const m = computeLaundryClothingMetrics([record]);
      expect(m.cultural_needs_met_rate).toBe(100);
    });

    it("returns full_choice_rate = 100", () => {
      const m = computeLaundryClothingMetrics([record]);
      expect(m.full_choice_rate).toBe(100);
    });

    it("returns total_budget = 150", () => {
      const m = computeLaundryClothingMetrics([record]);
      expect(m.total_budget).toBe(150);
    });

    it("returns total_spent = 120.5", () => {
      const m = computeLaundryClothingMetrics([record]);
      expect(m.total_spent).toBe(120.5);
    });

    it("returns by_event_type with single entry", () => {
      const m = computeLaundryClothingMetrics([record]);
      expect(m.by_event_type).toEqual({ clothing_purchase: 1 });
    });

    it("returns by_clothing_condition with single entry", () => {
      const m = computeLaundryClothingMetrics([record]);
      expect(m.by_clothing_condition).toEqual({ good: 1 });
    });

    it("returns by_laundry_standard with single entry", () => {
      const m = computeLaundryClothingMetrics([record]);
      expect(m.by_laundry_standard).toEqual({ excellent: 1 });
    });

    it("returns by_choice_level with single entry", () => {
      const m = computeLaundryClothingMetrics([record]);
      expect(m.by_choice_level).toEqual({ full_choice: 1 });
    });
  });

  describe("multiple records", () => {
    const records = [
      makeRecord({ event_type: "clothing_purchase", clothing_condition: "new", laundry_standard: "excellent", choice_level: "full_choice", child_chose_own_clothes: true, adequate_wardrobe: true, school_uniform_adequate: true, seasonal_clothing_adequate: true, laundry_done_regularly: true, clothes_returned_promptly: true, dignity_maintained: true, cultural_needs_met: true, budget_amount: 100, amount_spent: 80 }),
      makeRecord({ event_type: "clothing_inventory", clothing_condition: "good", laundry_standard: "good", choice_level: "some_choice", child_chose_own_clothes: false, adequate_wardrobe: false, school_uniform_adequate: false, seasonal_clothing_adequate: false, laundry_done_regularly: false, clothes_returned_promptly: false, dignity_maintained: false, cultural_needs_met: false, budget_amount: 200, amount_spent: 150 }),
      makeRecord({ event_type: "laundry_check", clothing_condition: "fair", laundry_standard: "poor", choice_level: "no_choice", child_chose_own_clothes: true, adequate_wardrobe: true, school_uniform_adequate: true, seasonal_clothing_adequate: true, laundry_done_regularly: true, clothes_returned_promptly: true, dignity_maintained: true, cultural_needs_met: true, budget_amount: null, amount_spent: null }),
      makeRecord({ event_type: "clothing_purchase", clothing_condition: "needs_replacing", laundry_standard: "acceptable", choice_level: "limited_choice", child_chose_own_clothes: false, adequate_wardrobe: false, school_uniform_adequate: false, seasonal_clothing_adequate: false, laundry_done_regularly: false, clothes_returned_promptly: false, dignity_maintained: false, cultural_needs_met: false, budget_amount: 50, amount_spent: 45.99 }),
      makeRecord({ event_type: "seasonal_update", clothing_condition: "worn", laundry_standard: "not_assessed", choice_level: "not_assessed", child_chose_own_clothes: true, adequate_wardrobe: true, school_uniform_adequate: true, seasonal_clothing_adequate: true, laundry_done_regularly: true, clothes_returned_promptly: true, dignity_maintained: true, cultural_needs_met: true, budget_amount: null, amount_spent: null }),
    ];

    it("returns total_records = 5", () => {
      const m = computeLaundryClothingMetrics(records);
      expect(m.total_records).toBe(5);
    });

    it("returns clothing_purchase_count = 2", () => {
      const m = computeLaundryClothingMetrics(records);
      expect(m.clothing_purchase_count).toBe(2);
    });

    it("returns clothing_inventory_count = 1", () => {
      const m = computeLaundryClothingMetrics(records);
      expect(m.clothing_inventory_count).toBe(1);
    });

    it("returns laundry_check_count = 1", () => {
      const m = computeLaundryClothingMetrics(records);
      expect(m.laundry_check_count).toBe(1);
    });

    it("calculates child_chose_own_rate correctly (3/5 = 60%)", () => {
      const m = computeLaundryClothingMetrics(records);
      expect(m.child_chose_own_rate).toBe(60);
    });

    it("calculates adequate_wardrobe_rate correctly (3/5 = 60%)", () => {
      const m = computeLaundryClothingMetrics(records);
      expect(m.adequate_wardrobe_rate).toBe(60);
    });

    it("calculates school_uniform_adequate_rate correctly (3/5 = 60%)", () => {
      const m = computeLaundryClothingMetrics(records);
      expect(m.school_uniform_adequate_rate).toBe(60);
    });

    it("calculates seasonal_clothing_rate correctly (3/5 = 60%)", () => {
      const m = computeLaundryClothingMetrics(records);
      expect(m.seasonal_clothing_rate).toBe(60);
    });

    it("calculates laundry_done_regularly_rate correctly (3/5 = 60%)", () => {
      const m = computeLaundryClothingMetrics(records);
      expect(m.laundry_done_regularly_rate).toBe(60);
    });

    it("calculates clothes_returned_promptly_rate correctly (3/5 = 60%)", () => {
      const m = computeLaundryClothingMetrics(records);
      expect(m.clothes_returned_promptly_rate).toBe(60);
    });

    it("calculates dignity_maintained_rate correctly (3/5 = 60%)", () => {
      const m = computeLaundryClothingMetrics(records);
      expect(m.dignity_maintained_rate).toBe(60);
    });

    it("calculates cultural_needs_met_rate correctly (3/5 = 60%)", () => {
      const m = computeLaundryClothingMetrics(records);
      expect(m.cultural_needs_met_rate).toBe(60);
    });

    it("returns poor_laundry_count = 1", () => {
      const m = computeLaundryClothingMetrics(records);
      expect(m.poor_laundry_count).toBe(1);
    });

    it("returns needs_replacing_count = 1", () => {
      const m = computeLaundryClothingMetrics(records);
      expect(m.needs_replacing_count).toBe(1);
    });

    it("returns no_choice_count = 1", () => {
      const m = computeLaundryClothingMetrics(records);
      expect(m.no_choice_count).toBe(1);
    });

    it("calculates full_choice_rate correctly (1/5 = 20%)", () => {
      const m = computeLaundryClothingMetrics(records);
      expect(m.full_choice_rate).toBe(20);
    });

    it("calculates total_budget correctly (100 + 200 + 50 = 350)", () => {
      const m = computeLaundryClothingMetrics(records);
      expect(m.total_budget).toBe(350);
    });

    it("calculates total_spent correctly (80 + 150 + 45.99 = 275.99)", () => {
      const m = computeLaundryClothingMetrics(records);
      expect(m.total_spent).toBe(275.99);
    });

    it("groups by_event_type correctly", () => {
      const m = computeLaundryClothingMetrics(records);
      expect(m.by_event_type).toEqual({ clothing_purchase: 2, clothing_inventory: 1, laundry_check: 1, seasonal_update: 1 });
    });

    it("groups by_clothing_condition correctly", () => {
      const m = computeLaundryClothingMetrics(records);
      expect(m.by_clothing_condition).toEqual({ new: 1, good: 1, fair: 1, needs_replacing: 1, worn: 1 });
    });

    it("groups by_laundry_standard correctly", () => {
      const m = computeLaundryClothingMetrics(records);
      expect(m.by_laundry_standard).toEqual({ excellent: 1, good: 1, poor: 1, acceptable: 1, not_assessed: 1 });
    });

    it("groups by_choice_level correctly", () => {
      const m = computeLaundryClothingMetrics(records);
      expect(m.by_choice_level).toEqual({ full_choice: 1, some_choice: 1, no_choice: 1, limited_choice: 1, not_assessed: 1 });
    });
  });

  describe("event type counts", () => {
    it("counts clothing_purchase events", () => {
      const records = [
        makeRecord({ event_type: "clothing_purchase" }),
        makeRecord({ event_type: "clothing_purchase" }),
      ];
      const m = computeLaundryClothingMetrics(records);
      expect(m.clothing_purchase_count).toBe(2);
    });

    it("counts clothing_inventory events", () => {
      const records = [
        makeRecord({ event_type: "clothing_inventory" }),
        makeRecord({ event_type: "clothing_inventory" }),
        makeRecord({ event_type: "clothing_inventory" }),
      ];
      const m = computeLaundryClothingMetrics(records);
      expect(m.clothing_inventory_count).toBe(3);
    });

    it("counts laundry_check events", () => {
      const records = [
        makeRecord({ event_type: "laundry_check" }),
        makeRecord({ event_type: "laundry_check" }),
      ];
      const m = computeLaundryClothingMetrics(records);
      expect(m.laundry_check_count).toBe(2);
    });

    it("does not count seasonal_update as clothing_purchase", () => {
      const records = [makeRecord({ event_type: "seasonal_update" })];
      const m = computeLaundryClothingMetrics(records);
      expect(m.clothing_purchase_count).toBe(0);
    });

    it("does not count uniform_provision as clothing_inventory", () => {
      const records = [makeRecord({ event_type: "uniform_provision" })];
      const m = computeLaundryClothingMetrics(records);
      expect(m.clothing_inventory_count).toBe(0);
    });

    it("does not count budget_review as laundry_check", () => {
      const records = [makeRecord({ event_type: "budget_review" })];
      const m = computeLaundryClothingMetrics(records);
      expect(m.laundry_check_count).toBe(0);
    });

    it("does not count other as any specific type", () => {
      const records = [makeRecord({ event_type: "other" })];
      const m = computeLaundryClothingMetrics(records);
      expect(m.clothing_purchase_count).toBe(0);
      expect(m.clothing_inventory_count).toBe(0);
      expect(m.laundry_check_count).toBe(0);
    });
  });

  describe("child_chose_own_rate", () => {
    it("returns 100 when all chose own clothes", () => {
      const records = [
        makeRecord({ child_chose_own_clothes: true }),
        makeRecord({ child_chose_own_clothes: true }),
      ];
      const m = computeLaundryClothingMetrics(records);
      expect(m.child_chose_own_rate).toBe(100);
    });

    it("returns 0 when none chose own clothes", () => {
      const records = [
        makeRecord({ child_chose_own_clothes: false }),
        makeRecord({ child_chose_own_clothes: false }),
      ];
      const m = computeLaundryClothingMetrics(records);
      expect(m.child_chose_own_rate).toBe(0);
    });

    it("calculates with rounding (1/3 = 33.3%)", () => {
      const records = [
        makeRecord({ child_chose_own_clothes: true }),
        makeRecord({ child_chose_own_clothes: false }),
        makeRecord({ child_chose_own_clothes: false }),
      ];
      const m = computeLaundryClothingMetrics(records);
      expect(m.child_chose_own_rate).toBe(33.3);
    });

    it("calculates (2/3 = 66.7%)", () => {
      const records = [
        makeRecord({ child_chose_own_clothes: true }),
        makeRecord({ child_chose_own_clothes: true }),
        makeRecord({ child_chose_own_clothes: false }),
      ];
      const m = computeLaundryClothingMetrics(records);
      expect(m.child_chose_own_rate).toBe(66.7);
    });
  });

  describe("adequate_wardrobe_rate", () => {
    it("returns 100 when all adequate", () => {
      const records = [
        makeRecord({ adequate_wardrobe: true }),
        makeRecord({ adequate_wardrobe: true }),
      ];
      const m = computeLaundryClothingMetrics(records);
      expect(m.adequate_wardrobe_rate).toBe(100);
    });

    it("returns 0 when none adequate", () => {
      const records = [
        makeRecord({ adequate_wardrobe: false }),
        makeRecord({ adequate_wardrobe: false }),
      ];
      const m = computeLaundryClothingMetrics(records);
      expect(m.adequate_wardrobe_rate).toBe(0);
    });

    it("calculates 50% correctly", () => {
      const records = [
        makeRecord({ adequate_wardrobe: true }),
        makeRecord({ adequate_wardrobe: false }),
      ];
      const m = computeLaundryClothingMetrics(records);
      expect(m.adequate_wardrobe_rate).toBe(50);
    });
  });

  describe("school_uniform_adequate_rate", () => {
    it("returns 100 when all adequate", () => {
      const records = [
        makeRecord({ school_uniform_adequate: true }),
        makeRecord({ school_uniform_adequate: true }),
      ];
      const m = computeLaundryClothingMetrics(records);
      expect(m.school_uniform_adequate_rate).toBe(100);
    });

    it("returns 0 when none adequate", () => {
      const records = [
        makeRecord({ school_uniform_adequate: false }),
        makeRecord({ school_uniform_adequate: false }),
      ];
      const m = computeLaundryClothingMetrics(records);
      expect(m.school_uniform_adequate_rate).toBe(0);
    });

    it("calculates with rounding (1/3 = 33.3%)", () => {
      const records = [
        makeRecord({ school_uniform_adequate: true }),
        makeRecord({ school_uniform_adequate: false }),
        makeRecord({ school_uniform_adequate: false }),
      ];
      const m = computeLaundryClothingMetrics(records);
      expect(m.school_uniform_adequate_rate).toBe(33.3);
    });
  });

  describe("seasonal_clothing_rate", () => {
    it("returns 100 when all adequate", () => {
      const records = [
        makeRecord({ seasonal_clothing_adequate: true }),
        makeRecord({ seasonal_clothing_adequate: true }),
      ];
      const m = computeLaundryClothingMetrics(records);
      expect(m.seasonal_clothing_rate).toBe(100);
    });

    it("returns 0 when none adequate", () => {
      const records = [
        makeRecord({ seasonal_clothing_adequate: false }),
        makeRecord({ seasonal_clothing_adequate: false }),
      ];
      const m = computeLaundryClothingMetrics(records);
      expect(m.seasonal_clothing_rate).toBe(0);
    });

    it("calculates (2/3 = 66.7%)", () => {
      const records = [
        makeRecord({ seasonal_clothing_adequate: true }),
        makeRecord({ seasonal_clothing_adequate: true }),
        makeRecord({ seasonal_clothing_adequate: false }),
      ];
      const m = computeLaundryClothingMetrics(records);
      expect(m.seasonal_clothing_rate).toBe(66.7);
    });
  });

  describe("laundry_done_regularly_rate", () => {
    it("returns 100 when all regular", () => {
      const records = [
        makeRecord({ laundry_done_regularly: true }),
        makeRecord({ laundry_done_regularly: true }),
      ];
      const m = computeLaundryClothingMetrics(records);
      expect(m.laundry_done_regularly_rate).toBe(100);
    });

    it("returns 0 when none regular", () => {
      const records = [
        makeRecord({ laundry_done_regularly: false }),
        makeRecord({ laundry_done_regularly: false }),
      ];
      const m = computeLaundryClothingMetrics(records);
      expect(m.laundry_done_regularly_rate).toBe(0);
    });

    it("calculates 50% correctly", () => {
      const records = [
        makeRecord({ laundry_done_regularly: true }),
        makeRecord({ laundry_done_regularly: false }),
      ];
      const m = computeLaundryClothingMetrics(records);
      expect(m.laundry_done_regularly_rate).toBe(50);
    });
  });

  describe("clothes_returned_promptly_rate", () => {
    it("returns 100 when all returned promptly", () => {
      const records = [
        makeRecord({ clothes_returned_promptly: true }),
        makeRecord({ clothes_returned_promptly: true }),
      ];
      const m = computeLaundryClothingMetrics(records);
      expect(m.clothes_returned_promptly_rate).toBe(100);
    });

    it("returns 0 when none returned promptly", () => {
      const records = [
        makeRecord({ clothes_returned_promptly: false }),
        makeRecord({ clothes_returned_promptly: false }),
      ];
      const m = computeLaundryClothingMetrics(records);
      expect(m.clothes_returned_promptly_rate).toBe(0);
    });

    it("calculates with rounding (1/3 = 33.3%)", () => {
      const records = [
        makeRecord({ clothes_returned_promptly: true }),
        makeRecord({ clothes_returned_promptly: false }),
        makeRecord({ clothes_returned_promptly: false }),
      ];
      const m = computeLaundryClothingMetrics(records);
      expect(m.clothes_returned_promptly_rate).toBe(33.3);
    });
  });

  describe("dignity_maintained_rate", () => {
    it("returns 100 when all maintained", () => {
      const records = [
        makeRecord({ dignity_maintained: true }),
        makeRecord({ dignity_maintained: true }),
      ];
      const m = computeLaundryClothingMetrics(records);
      expect(m.dignity_maintained_rate).toBe(100);
    });

    it("returns 0 when none maintained", () => {
      const records = [
        makeRecord({ dignity_maintained: false }),
        makeRecord({ dignity_maintained: false }),
      ];
      const m = computeLaundryClothingMetrics(records);
      expect(m.dignity_maintained_rate).toBe(0);
    });

    it("calculates (2/3 = 66.7%)", () => {
      const records = [
        makeRecord({ dignity_maintained: true }),
        makeRecord({ dignity_maintained: true }),
        makeRecord({ dignity_maintained: false }),
      ];
      const m = computeLaundryClothingMetrics(records);
      expect(m.dignity_maintained_rate).toBe(66.7);
    });
  });

  describe("cultural_needs_met_rate", () => {
    it("returns 100 when all met", () => {
      const records = [
        makeRecord({ cultural_needs_met: true }),
        makeRecord({ cultural_needs_met: true }),
      ];
      const m = computeLaundryClothingMetrics(records);
      expect(m.cultural_needs_met_rate).toBe(100);
    });

    it("returns 0 when none met", () => {
      const records = [
        makeRecord({ cultural_needs_met: false }),
        makeRecord({ cultural_needs_met: false }),
      ];
      const m = computeLaundryClothingMetrics(records);
      expect(m.cultural_needs_met_rate).toBe(0);
    });

    it("calculates 50% correctly", () => {
      const records = [
        makeRecord({ cultural_needs_met: true }),
        makeRecord({ cultural_needs_met: false }),
      ];
      const m = computeLaundryClothingMetrics(records);
      expect(m.cultural_needs_met_rate).toBe(50);
    });
  });

  describe("poor_laundry_count", () => {
    it("counts poor laundry standard records", () => {
      const records = [
        makeRecord({ laundry_standard: "poor" }),
        makeRecord({ laundry_standard: "poor" }),
        makeRecord({ laundry_standard: "good" }),
      ];
      const m = computeLaundryClothingMetrics(records);
      expect(m.poor_laundry_count).toBe(2);
    });

    it("does not count acceptable as poor", () => {
      const records = [makeRecord({ laundry_standard: "acceptable" })];
      const m = computeLaundryClothingMetrics(records);
      expect(m.poor_laundry_count).toBe(0);
    });

    it("does not count not_assessed as poor", () => {
      const records = [makeRecord({ laundry_standard: "not_assessed" })];
      const m = computeLaundryClothingMetrics(records);
      expect(m.poor_laundry_count).toBe(0);
    });

    it("does not count excellent as poor", () => {
      const records = [makeRecord({ laundry_standard: "excellent" })];
      const m = computeLaundryClothingMetrics(records);
      expect(m.poor_laundry_count).toBe(0);
    });
  });

  describe("needs_replacing_count", () => {
    it("counts needs_replacing condition records", () => {
      const records = [
        makeRecord({ clothing_condition: "needs_replacing" }),
        makeRecord({ clothing_condition: "needs_replacing" }),
        makeRecord({ clothing_condition: "good" }),
      ];
      const m = computeLaundryClothingMetrics(records);
      expect(m.needs_replacing_count).toBe(2);
    });

    it("does not count worn as needs_replacing", () => {
      const records = [makeRecord({ clothing_condition: "worn" })];
      const m = computeLaundryClothingMetrics(records);
      expect(m.needs_replacing_count).toBe(0);
    });

    it("does not count fair as needs_replacing", () => {
      const records = [makeRecord({ clothing_condition: "fair" })];
      const m = computeLaundryClothingMetrics(records);
      expect(m.needs_replacing_count).toBe(0);
    });

    it("does not count new as needs_replacing", () => {
      const records = [makeRecord({ clothing_condition: "new" })];
      const m = computeLaundryClothingMetrics(records);
      expect(m.needs_replacing_count).toBe(0);
    });
  });

  describe("no_choice_count", () => {
    it("counts no_choice records", () => {
      const records = [
        makeRecord({ choice_level: "no_choice" }),
        makeRecord({ choice_level: "no_choice" }),
        makeRecord({ choice_level: "full_choice" }),
      ];
      const m = computeLaundryClothingMetrics(records);
      expect(m.no_choice_count).toBe(2);
    });

    it("does not count limited_choice as no_choice", () => {
      const records = [makeRecord({ choice_level: "limited_choice" })];
      const m = computeLaundryClothingMetrics(records);
      expect(m.no_choice_count).toBe(0);
    });

    it("does not count some_choice as no_choice", () => {
      const records = [makeRecord({ choice_level: "some_choice" })];
      const m = computeLaundryClothingMetrics(records);
      expect(m.no_choice_count).toBe(0);
    });

    it("does not count not_assessed as no_choice", () => {
      const records = [makeRecord({ choice_level: "not_assessed" })];
      const m = computeLaundryClothingMetrics(records);
      expect(m.no_choice_count).toBe(0);
    });
  });

  describe("full_choice_rate", () => {
    it("returns 100 when all full_choice", () => {
      const records = [
        makeRecord({ choice_level: "full_choice" }),
        makeRecord({ choice_level: "full_choice" }),
      ];
      const m = computeLaundryClothingMetrics(records);
      expect(m.full_choice_rate).toBe(100);
    });

    it("returns 0 when none full_choice", () => {
      const records = [
        makeRecord({ choice_level: "some_choice" }),
        makeRecord({ choice_level: "no_choice" }),
      ];
      const m = computeLaundryClothingMetrics(records);
      expect(m.full_choice_rate).toBe(0);
    });

    it("calculates with rounding (1/3 = 33.3%)", () => {
      const records = [
        makeRecord({ choice_level: "full_choice" }),
        makeRecord({ choice_level: "some_choice" }),
        makeRecord({ choice_level: "no_choice" }),
      ];
      const m = computeLaundryClothingMetrics(records);
      expect(m.full_choice_rate).toBe(33.3);
    });

    it("calculates (2/3 = 66.7%)", () => {
      const records = [
        makeRecord({ choice_level: "full_choice" }),
        makeRecord({ choice_level: "full_choice" }),
        makeRecord({ choice_level: "no_choice" }),
      ];
      const m = computeLaundryClothingMetrics(records);
      expect(m.full_choice_rate).toBe(66.7);
    });

    it("uses all records as denominator including not_assessed", () => {
      const records = [
        makeRecord({ choice_level: "full_choice" }),
        makeRecord({ choice_level: "not_assessed" }),
      ];
      const m = computeLaundryClothingMetrics(records);
      expect(m.full_choice_rate).toBe(50);
    });
  });

  describe("total_budget", () => {
    it("sums non-null budget_amount values", () => {
      const records = [
        makeRecord({ budget_amount: 100.50 }),
        makeRecord({ budget_amount: 200.25 }),
      ];
      const m = computeLaundryClothingMetrics(records);
      expect(m.total_budget).toBe(300.75);
    });

    it("skips null budget_amount values", () => {
      const records = [
        makeRecord({ budget_amount: 100 }),
        makeRecord({ budget_amount: null }),
        makeRecord({ budget_amount: 50 }),
      ];
      const m = computeLaundryClothingMetrics(records);
      expect(m.total_budget).toBe(150);
    });

    it("returns 0 when all budget_amount values are null", () => {
      const records = [
        makeRecord({ budget_amount: null }),
        makeRecord({ budget_amount: null }),
      ];
      const m = computeLaundryClothingMetrics(records);
      expect(m.total_budget).toBe(0);
    });

    it("rounds to two decimal places", () => {
      const records = [
        makeRecord({ budget_amount: 33.33 }),
        makeRecord({ budget_amount: 33.33 }),
        makeRecord({ budget_amount: 33.34 }),
      ];
      const m = computeLaundryClothingMetrics(records);
      expect(m.total_budget).toBe(100);
    });

    it("handles small fractional amounts", () => {
      const records = [
        makeRecord({ budget_amount: 0.01 }),
        makeRecord({ budget_amount: 0.02 }),
      ];
      const m = computeLaundryClothingMetrics(records);
      expect(m.total_budget).toBe(0.03);
    });
  });

  describe("total_spent", () => {
    it("sums non-null amount_spent values", () => {
      const records = [
        makeRecord({ amount_spent: 75.50 }),
        makeRecord({ amount_spent: 120.25 }),
      ];
      const m = computeLaundryClothingMetrics(records);
      expect(m.total_spent).toBe(195.75);
    });

    it("skips null amount_spent values", () => {
      const records = [
        makeRecord({ amount_spent: 100 }),
        makeRecord({ amount_spent: null }),
        makeRecord({ amount_spent: 50 }),
      ];
      const m = computeLaundryClothingMetrics(records);
      expect(m.total_spent).toBe(150);
    });

    it("returns 0 when all amount_spent values are null", () => {
      const records = [
        makeRecord({ amount_spent: null }),
        makeRecord({ amount_spent: null }),
      ];
      const m = computeLaundryClothingMetrics(records);
      expect(m.total_spent).toBe(0);
    });

    it("rounds to two decimal places", () => {
      const records = [
        makeRecord({ amount_spent: 10.10 }),
        makeRecord({ amount_spent: 20.20 }),
        makeRecord({ amount_spent: 30.30 }),
      ];
      const m = computeLaundryClothingMetrics(records);
      expect(m.total_spent).toBe(60.6);
    });
  });

  describe("review_overdue_count", () => {
    it("counts records with past next_review_date", () => {
      const records = [
        makeRecord({ next_review_date: daysAgo(10) }),
        makeRecord({ next_review_date: daysAgo(5) }),
      ];
      const m = computeLaundryClothingMetrics(records);
      expect(m.review_overdue_count).toBe(2);
    });

    it("does not count records with future next_review_date", () => {
      const records = [
        makeRecord({ next_review_date: daysFromNow(10) }),
        makeRecord({ next_review_date: daysFromNow(30) }),
      ];
      const m = computeLaundryClothingMetrics(records);
      expect(m.review_overdue_count).toBe(0);
    });

    it("excludes null next_review_date", () => {
      const records = [
        makeRecord({ next_review_date: null }),
        makeRecord({ next_review_date: null }),
      ];
      const m = computeLaundryClothingMetrics(records);
      expect(m.review_overdue_count).toBe(0);
    });

    it("mixes past, future, and null dates correctly", () => {
      const records = [
        makeRecord({ next_review_date: daysAgo(10) }),
        makeRecord({ next_review_date: daysFromNow(10) }),
        makeRecord({ next_review_date: null }),
      ];
      const m = computeLaundryClothingMetrics(records);
      expect(m.review_overdue_count).toBe(1);
    });
  });

  describe("by_event_type grouping", () => {
    it("groups multiple event types", () => {
      const records = [
        makeRecord({ event_type: "clothing_purchase" }),
        makeRecord({ event_type: "clothing_purchase" }),
        makeRecord({ event_type: "laundry_check" }),
        makeRecord({ event_type: "seasonal_update" }),
      ];
      const m = computeLaundryClothingMetrics(records);
      expect(m.by_event_type).toEqual({ clothing_purchase: 2, laundry_check: 1, seasonal_update: 1 });
    });

    it("handles single event type", () => {
      const records = [
        makeRecord({ event_type: "other" }),
        makeRecord({ event_type: "other" }),
      ];
      const m = computeLaundryClothingMetrics(records);
      expect(m.by_event_type).toEqual({ other: 2 });
    });
  });

  describe("by_clothing_condition grouping", () => {
    it("groups multiple conditions", () => {
      const records = [
        makeRecord({ clothing_condition: "new" }),
        makeRecord({ clothing_condition: "new" }),
        makeRecord({ clothing_condition: "worn" }),
      ];
      const m = computeLaundryClothingMetrics(records);
      expect(m.by_clothing_condition).toEqual({ new: 2, worn: 1 });
    });

    it("handles all conditions in one set", () => {
      const records = [
        makeRecord({ clothing_condition: "new" }),
        makeRecord({ clothing_condition: "good" }),
        makeRecord({ clothing_condition: "fair" }),
        makeRecord({ clothing_condition: "worn" }),
        makeRecord({ clothing_condition: "needs_replacing" }),
      ];
      const m = computeLaundryClothingMetrics(records);
      expect(m.by_clothing_condition).toEqual({ new: 1, good: 1, fair: 1, worn: 1, needs_replacing: 1 });
    });
  });

  describe("by_laundry_standard grouping", () => {
    it("groups multiple standards", () => {
      const records = [
        makeRecord({ laundry_standard: "excellent" }),
        makeRecord({ laundry_standard: "excellent" }),
        makeRecord({ laundry_standard: "poor" }),
      ];
      const m = computeLaundryClothingMetrics(records);
      expect(m.by_laundry_standard).toEqual({ excellent: 2, poor: 1 });
    });

    it("handles all standards in one set", () => {
      const records = [
        makeRecord({ laundry_standard: "excellent" }),
        makeRecord({ laundry_standard: "good" }),
        makeRecord({ laundry_standard: "acceptable" }),
        makeRecord({ laundry_standard: "poor" }),
        makeRecord({ laundry_standard: "not_assessed" }),
      ];
      const m = computeLaundryClothingMetrics(records);
      expect(m.by_laundry_standard).toEqual({ excellent: 1, good: 1, acceptable: 1, poor: 1, not_assessed: 1 });
    });
  });

  describe("by_choice_level grouping", () => {
    it("groups multiple levels", () => {
      const records = [
        makeRecord({ choice_level: "full_choice" }),
        makeRecord({ choice_level: "full_choice" }),
        makeRecord({ choice_level: "no_choice" }),
      ];
      const m = computeLaundryClothingMetrics(records);
      expect(m.by_choice_level).toEqual({ full_choice: 2, no_choice: 1 });
    });

    it("handles all levels in one set", () => {
      const records = [
        makeRecord({ choice_level: "full_choice" }),
        makeRecord({ choice_level: "some_choice" }),
        makeRecord({ choice_level: "limited_choice" }),
        makeRecord({ choice_level: "no_choice" }),
        makeRecord({ choice_level: "not_assessed" }),
      ];
      const m = computeLaundryClothingMetrics(records);
      expect(m.by_choice_level).toEqual({ full_choice: 1, some_choice: 1, limited_choice: 1, no_choice: 1, not_assessed: 1 });
    });
  });

  describe("rate rounding edge cases", () => {
    it("handles 1/6 = 16.7%", () => {
      const records = Array.from({ length: 6 }, (_, i) =>
        makeRecord({ child_chose_own_clothes: i === 0 }),
      );
      const m = computeLaundryClothingMetrics(records);
      expect(m.child_chose_own_rate).toBe(16.7);
    });

    it("handles 5/6 = 83.3%", () => {
      const records = Array.from({ length: 6 }, (_, i) =>
        makeRecord({ child_chose_own_clothes: i !== 0 }),
      );
      const m = computeLaundryClothingMetrics(records);
      expect(m.child_chose_own_rate).toBe(83.3);
    });

    it("handles 1/7 = 14.3%", () => {
      const records = Array.from({ length: 7 }, (_, i) =>
        makeRecord({ dignity_maintained: i === 0 }),
      );
      const m = computeLaundryClothingMetrics(records);
      expect(m.dignity_maintained_rate).toBe(14.3);
    });

    it("handles 3/7 = 42.9%", () => {
      const records = Array.from({ length: 7 }, (_, i) =>
        makeRecord({ dignity_maintained: i < 3 }),
      );
      const m = computeLaundryClothingMetrics(records);
      expect(m.dignity_maintained_rate).toBe(42.9);
    });

    it("handles full_choice_rate 2/7 = 28.6%", () => {
      const records = Array.from({ length: 7 }, (_, i) =>
        makeRecord({ choice_level: i < 2 ? "full_choice" : "some_choice" }),
      );
      const m = computeLaundryClothingMetrics(records);
      expect(m.full_choice_rate).toBe(28.6);
    });
  });
});

// ── identifyLaundryClothingAlerts ──────────────────────────────────────────

describe("identifyLaundryClothingAlerts", () => {
  describe("no alerts", () => {
    it("returns empty array when no records", () => {
      const alerts = identifyLaundryClothingAlerts([]);
      expect(alerts).toHaveLength(0);
    });

    it("returns empty array when all records are clean", () => {
      const records = [
        makeRecord({
          dignity_maintained: true,
          adequate_wardrobe: true,
          choice_level: "full_choice",
          laundry_standard: "excellent",
          next_review_date: daysFromNow(30),
        }),
      ];
      const alerts = identifyLaundryClothingAlerts(records);
      expect(alerts).toEqual([]);
    });

    it("returns empty for single well-formed record with future review", () => {
      const records = [
        makeRecord({
          dignity_maintained: true,
          adequate_wardrobe: true,
          choice_level: "full_choice",
          laundry_standard: "good",
          next_review_date: daysFromNow(10),
        }),
      ];
      const alerts = identifyLaundryClothingAlerts(records);
      expect(alerts).toEqual([]);
    });

    it("returns empty when laundry_standard is acceptable (not poor)", () => {
      const records = [
        makeRecord({
          dignity_maintained: true,
          adequate_wardrobe: true,
          choice_level: "full_choice",
          laundry_standard: "acceptable",
        }),
      ];
      const alerts = identifyLaundryClothingAlerts(records);
      expect(alerts).toEqual([]);
    });

    it("returns empty when choice_level is limited_choice (not no_choice)", () => {
      const records = [
        makeRecord({
          dignity_maintained: true,
          adequate_wardrobe: true,
          choice_level: "limited_choice",
          laundry_standard: "good",
        }),
      ];
      const alerts = identifyLaundryClothingAlerts(records);
      expect(alerts).toEqual([]);
    });
  });

  describe("dignity_not_maintained alert", () => {
    it("fires for dignity_maintained = false", () => {
      const records = [makeRecord({ dignity_maintained: false, child_name: "Alice", event_date: "2026-05-01" })];
      const alerts = identifyLaundryClothingAlerts(records);
      const alert = alerts.find((a) => a.type === "dignity_not_maintained");
      expect(alert).toBeDefined();
    });

    it("has severity critical", () => {
      const records = [makeRecord({ dignity_maintained: false, child_name: "Alice", event_date: "2026-05-01" })];
      const alerts = identifyLaundryClothingAlerts(records);
      const alert = alerts.find((a) => a.type === "dignity_not_maintained")!;
      expect(alert.severity).toBe("critical");
    });

    it("uses the record id as alert id", () => {
      const records = [makeRecord({ id: "dignity-1", dignity_maintained: false, child_name: "Alice", event_date: "2026-05-01" })];
      const alerts = identifyLaundryClothingAlerts(records);
      const alert = alerts.find((a) => a.type === "dignity_not_maintained")!;
      expect(alert.id).toBe("dignity-1");
    });

    it("includes child_name in message", () => {
      const records = [makeRecord({ dignity_maintained: false, child_name: "Charlie", event_date: "2026-05-01" })];
      const alerts = identifyLaundryClothingAlerts(records);
      const alert = alerts.find((a) => a.type === "dignity_not_maintained")!;
      expect(alert.message).toContain("Charlie");
    });

    it("includes event_date in message", () => {
      const records = [makeRecord({ dignity_maintained: false, child_name: "Alice", event_date: "2026-04-15" })];
      const alerts = identifyLaundryClothingAlerts(records);
      const alert = alerts.find((a) => a.type === "dignity_not_maintained")!;
      expect(alert.message).toContain("2026-04-15");
    });

    it("fires per record for multiple dignity violations", () => {
      const records = [
        makeRecord({ dignity_maintained: false, child_name: "Alice", event_date: "2026-05-01" }),
        makeRecord({ dignity_maintained: false, child_name: "Bob", event_date: "2026-04-01" }),
        makeRecord({ dignity_maintained: false, child_name: "Charlie", event_date: "2026-03-01" }),
      ];
      const alerts = identifyLaundryClothingAlerts(records);
      const dignityAlerts = alerts.filter((a) => a.type === "dignity_not_maintained");
      expect(dignityAlerts).toHaveLength(3);
    });

    it("does not fire when dignity_maintained is true", () => {
      const records = [makeRecord({ dignity_maintained: true })];
      const alerts = identifyLaundryClothingAlerts(records);
      const alert = alerts.find((a) => a.type === "dignity_not_maintained");
      expect(alert).toBeUndefined();
    });

    it("message contains address immediately wording", () => {
      const records = [makeRecord({ dignity_maintained: false, child_name: "Alice", event_date: "2026-05-01" })];
      const alerts = identifyLaundryClothingAlerts(records);
      const alert = alerts.find((a) => a.type === "dignity_not_maintained")!;
      expect(alert.message).toContain("address immediately");
    });

    it("fires only for records with dignity_maintained false in mixed set", () => {
      const records = [
        makeRecord({ dignity_maintained: true }),
        makeRecord({ dignity_maintained: false, child_name: "Alice", event_date: "2026-05-01" }),
        makeRecord({ dignity_maintained: true }),
      ];
      const alerts = identifyLaundryClothingAlerts(records);
      const dignityAlerts = alerts.filter((a) => a.type === "dignity_not_maintained");
      expect(dignityAlerts).toHaveLength(1);
    });
  });

  describe("inadequate_wardrobe alert", () => {
    it("fires when 1 child has inadequate wardrobe", () => {
      const records = [makeRecord({ adequate_wardrobe: false })];
      const alerts = identifyLaundryClothingAlerts(records);
      const alert = alerts.find((a) => a.type === "inadequate_wardrobe");
      expect(alert).toBeDefined();
    });

    it("has severity high", () => {
      const records = [makeRecord({ adequate_wardrobe: false })];
      const alerts = identifyLaundryClothingAlerts(records);
      const alert = alerts.find((a) => a.type === "inadequate_wardrobe")!;
      expect(alert.severity).toBe("high");
    });

    it("uses inadequate_wardrobe as alert id", () => {
      const records = [makeRecord({ adequate_wardrobe: false })];
      const alerts = identifyLaundryClothingAlerts(records);
      const alert = alerts.find((a) => a.type === "inadequate_wardrobe")!;
      expect(alert.id).toBe("inadequate_wardrobe");
    });

    it("uses singular phrasing for 1 child", () => {
      const records = [makeRecord({ adequate_wardrobe: false })];
      const alerts = identifyLaundryClothingAlerts(records);
      const alert = alerts.find((a) => a.type === "inadequate_wardrobe")!;
      expect(alert.message).toContain("child has");
    });

    it("uses plural phrasing for multiple children", () => {
      const records = [
        makeRecord({ adequate_wardrobe: false }),
        makeRecord({ adequate_wardrobe: false }),
      ];
      const alerts = identifyLaundryClothingAlerts(records);
      const alert = alerts.find((a) => a.type === "inadequate_wardrobe")!;
      expect(alert.message).toContain("children have");
    });

    it("includes count in message", () => {
      const records = [
        makeRecord({ adequate_wardrobe: false }),
        makeRecord({ adequate_wardrobe: false }),
        makeRecord({ adequate_wardrobe: false }),
      ];
      const alerts = identifyLaundryClothingAlerts(records);
      const alert = alerts.find((a) => a.type === "inadequate_wardrobe")!;
      expect(alert.message).toContain("3");
    });

    it("does not fire when all wardrobes adequate", () => {
      const records = [
        makeRecord({ adequate_wardrobe: true }),
        makeRecord({ adequate_wardrobe: true }),
      ];
      const alerts = identifyLaundryClothingAlerts(records);
      const alert = alerts.find((a) => a.type === "inadequate_wardrobe");
      expect(alert).toBeUndefined();
    });

    it("produces exactly one alert even with multiple inadequate records", () => {
      const records = [
        makeRecord({ adequate_wardrobe: false }),
        makeRecord({ adequate_wardrobe: false }),
        makeRecord({ adequate_wardrobe: false }),
      ];
      const alerts = identifyLaundryClothingAlerts(records);
      const wardrobeAlerts = alerts.filter((a) => a.type === "inadequate_wardrobe");
      expect(wardrobeAlerts).toHaveLength(1);
    });

    it("message contains clothing provision wording", () => {
      const records = [makeRecord({ adequate_wardrobe: false })];
      const alerts = identifyLaundryClothingAlerts(records);
      const alert = alerts.find((a) => a.type === "inadequate_wardrobe")!;
      expect(alert.message).toContain("clothing provision");
    });
  });

  describe("no_clothing_choice alert", () => {
    it("fires when 1 record has no_choice", () => {
      const records = [makeRecord({ choice_level: "no_choice" })];
      const alerts = identifyLaundryClothingAlerts(records);
      const alert = alerts.find((a) => a.type === "no_clothing_choice");
      expect(alert).toBeDefined();
    });

    it("has severity high", () => {
      const records = [makeRecord({ choice_level: "no_choice" })];
      const alerts = identifyLaundryClothingAlerts(records);
      const alert = alerts.find((a) => a.type === "no_clothing_choice")!;
      expect(alert.severity).toBe("high");
    });

    it("uses no_clothing_choice as alert id", () => {
      const records = [makeRecord({ choice_level: "no_choice" })];
      const alerts = identifyLaundryClothingAlerts(records);
      const alert = alerts.find((a) => a.type === "no_clothing_choice")!;
      expect(alert.id).toBe("no_clothing_choice");
    });

    it("uses singular phrasing for 1 record", () => {
      const records = [makeRecord({ choice_level: "no_choice" })];
      const alerts = identifyLaundryClothingAlerts(records);
      const alert = alerts.find((a) => a.type === "no_clothing_choice")!;
      expect(alert.message).toContain("record shows");
    });

    it("uses plural phrasing for multiple records", () => {
      const records = [
        makeRecord({ choice_level: "no_choice" }),
        makeRecord({ choice_level: "no_choice" }),
      ];
      const alerts = identifyLaundryClothingAlerts(records);
      const alert = alerts.find((a) => a.type === "no_clothing_choice")!;
      expect(alert.message).toContain("records show");
    });

    it("includes count in message", () => {
      const records = [
        makeRecord({ choice_level: "no_choice" }),
        makeRecord({ choice_level: "no_choice" }),
        makeRecord({ choice_level: "no_choice" }),
      ];
      const alerts = identifyLaundryClothingAlerts(records);
      const alert = alerts.find((a) => a.type === "no_clothing_choice")!;
      expect(alert.message).toContain("3");
    });

    it("does not fire for limited_choice", () => {
      const records = [makeRecord({ choice_level: "limited_choice" })];
      const alerts = identifyLaundryClothingAlerts(records);
      const alert = alerts.find((a) => a.type === "no_clothing_choice");
      expect(alert).toBeUndefined();
    });

    it("does not fire for some_choice", () => {
      const records = [makeRecord({ choice_level: "some_choice" })];
      const alerts = identifyLaundryClothingAlerts(records);
      const alert = alerts.find((a) => a.type === "no_clothing_choice");
      expect(alert).toBeUndefined();
    });

    it("does not fire for full_choice", () => {
      const records = [makeRecord({ choice_level: "full_choice" })];
      const alerts = identifyLaundryClothingAlerts(records);
      const alert = alerts.find((a) => a.type === "no_clothing_choice");
      expect(alert).toBeUndefined();
    });

    it("does not fire for not_assessed", () => {
      const records = [makeRecord({ choice_level: "not_assessed" })];
      const alerts = identifyLaundryClothingAlerts(records);
      const alert = alerts.find((a) => a.type === "no_clothing_choice");
      expect(alert).toBeUndefined();
    });

    it("produces exactly one alert even with multiple no_choice records", () => {
      const records = [
        makeRecord({ choice_level: "no_choice" }),
        makeRecord({ choice_level: "no_choice" }),
      ];
      const alerts = identifyLaundryClothingAlerts(records);
      const choiceAlerts = alerts.filter((a) => a.type === "no_clothing_choice");
      expect(choiceAlerts).toHaveLength(1);
    });

    it("message contains must choose wording", () => {
      const records = [makeRecord({ choice_level: "no_choice" })];
      const alerts = identifyLaundryClothingAlerts(records);
      const alert = alerts.find((a) => a.type === "no_clothing_choice")!;
      expect(alert.message).toContain("must choose");
    });
  });

  describe("poor_laundry alert", () => {
    it("does not fire for 1 poor laundry record (threshold is 2)", () => {
      const records = [makeRecord({ laundry_standard: "poor" })];
      const alerts = identifyLaundryClothingAlerts(records);
      const alert = alerts.find((a) => a.type === "poor_laundry");
      expect(alert).toBeUndefined();
    });

    it("fires when 2 poor laundry records", () => {
      const records = [
        makeRecord({ laundry_standard: "poor" }),
        makeRecord({ laundry_standard: "poor" }),
      ];
      const alerts = identifyLaundryClothingAlerts(records);
      const alert = alerts.find((a) => a.type === "poor_laundry");
      expect(alert).toBeDefined();
    });

    it("has severity medium", () => {
      const records = [
        makeRecord({ laundry_standard: "poor" }),
        makeRecord({ laundry_standard: "poor" }),
      ];
      const alerts = identifyLaundryClothingAlerts(records);
      const alert = alerts.find((a) => a.type === "poor_laundry")!;
      expect(alert.severity).toBe("medium");
    });

    it("uses poor_laundry as alert id", () => {
      const records = [
        makeRecord({ laundry_standard: "poor" }),
        makeRecord({ laundry_standard: "poor" }),
      ];
      const alerts = identifyLaundryClothingAlerts(records);
      const alert = alerts.find((a) => a.type === "poor_laundry")!;
      expect(alert.id).toBe("poor_laundry");
    });

    it("includes count in message", () => {
      const records = [
        makeRecord({ laundry_standard: "poor" }),
        makeRecord({ laundry_standard: "poor" }),
        makeRecord({ laundry_standard: "poor" }),
      ];
      const alerts = identifyLaundryClothingAlerts(records);
      const alert = alerts.find((a) => a.type === "poor_laundry")!;
      expect(alert.message).toContain("3");
    });

    it("fires for exactly 2 poor records at threshold", () => {
      const records = [
        makeRecord({ laundry_standard: "poor" }),
        makeRecord({ laundry_standard: "poor" }),
      ];
      const alerts = identifyLaundryClothingAlerts(records);
      const alert = alerts.find((a) => a.type === "poor_laundry")!;
      expect(alert.message).toContain("2");
    });

    it("does not fire for acceptable laundry", () => {
      const records = [
        makeRecord({ laundry_standard: "acceptable" }),
        makeRecord({ laundry_standard: "acceptable" }),
      ];
      const alerts = identifyLaundryClothingAlerts(records);
      const alert = alerts.find((a) => a.type === "poor_laundry");
      expect(alert).toBeUndefined();
    });

    it("does not fire for not_assessed laundry", () => {
      const records = [
        makeRecord({ laundry_standard: "not_assessed" }),
        makeRecord({ laundry_standard: "not_assessed" }),
      ];
      const alerts = identifyLaundryClothingAlerts(records);
      const alert = alerts.find((a) => a.type === "poor_laundry");
      expect(alert).toBeUndefined();
    });

    it("produces exactly one alert even with many poor records", () => {
      const records = [
        makeRecord({ laundry_standard: "poor" }),
        makeRecord({ laundry_standard: "poor" }),
        makeRecord({ laundry_standard: "poor" }),
        makeRecord({ laundry_standard: "poor" }),
      ];
      const alerts = identifyLaundryClothingAlerts(records);
      const laundryAlerts = alerts.filter((a) => a.type === "poor_laundry");
      expect(laundryAlerts).toHaveLength(1);
    });

    it("message contains review laundry procedures wording", () => {
      const records = [
        makeRecord({ laundry_standard: "poor" }),
        makeRecord({ laundry_standard: "poor" }),
      ];
      const alerts = identifyLaundryClothingAlerts(records);
      const alert = alerts.find((a) => a.type === "poor_laundry")!;
      expect(alert.message).toContain("review laundry procedures");
    });
  });

  describe("review_overdue alert", () => {
    it("fires when 1 review is overdue", () => {
      const records = [makeRecord({ next_review_date: daysAgo(5) })];
      const alerts = identifyLaundryClothingAlerts(records);
      const alert = alerts.find((a) => a.type === "review_overdue");
      expect(alert).toBeDefined();
    });

    it("has severity medium", () => {
      const records = [makeRecord({ next_review_date: daysAgo(5) })];
      const alerts = identifyLaundryClothingAlerts(records);
      const alert = alerts.find((a) => a.type === "review_overdue")!;
      expect(alert.severity).toBe("medium");
    });

    it("uses review_overdue as alert id", () => {
      const records = [makeRecord({ next_review_date: daysAgo(5) })];
      const alerts = identifyLaundryClothingAlerts(records);
      const alert = alerts.find((a) => a.type === "review_overdue")!;
      expect(alert.id).toBe("review_overdue");
    });

    it("uses singular phrasing for 1 overdue review", () => {
      const records = [makeRecord({ next_review_date: daysAgo(5) })];
      const alerts = identifyLaundryClothingAlerts(records);
      const alert = alerts.find((a) => a.type === "review_overdue")!;
      expect(alert.message).toContain("review is");
    });

    it("uses plural phrasing for multiple overdue reviews", () => {
      const records = [
        makeRecord({ next_review_date: daysAgo(5) }),
        makeRecord({ next_review_date: daysAgo(10) }),
      ];
      const alerts = identifyLaundryClothingAlerts(records);
      const alert = alerts.find((a) => a.type === "review_overdue")!;
      expect(alert.message).toContain("reviews are");
    });

    it("includes count in message", () => {
      const records = [
        makeRecord({ next_review_date: daysAgo(5) }),
        makeRecord({ next_review_date: daysAgo(10) }),
        makeRecord({ next_review_date: daysAgo(15) }),
      ];
      const alerts = identifyLaundryClothingAlerts(records);
      const alert = alerts.find((a) => a.type === "review_overdue")!;
      expect(alert.message).toContain("3");
    });

    it("does not fire when review is in the future", () => {
      const records = [makeRecord({ next_review_date: daysFromNow(30) })];
      const alerts = identifyLaundryClothingAlerts(records);
      const alert = alerts.find((a) => a.type === "review_overdue");
      expect(alert).toBeUndefined();
    });

    it("does not fire when next_review_date is null", () => {
      const records = [makeRecord({ next_review_date: null })];
      const alerts = identifyLaundryClothingAlerts(records);
      const alert = alerts.find((a) => a.type === "review_overdue");
      expect(alert).toBeUndefined();
    });

    it("produces exactly one alert even with many overdue reviews", () => {
      const records = [
        makeRecord({ next_review_date: daysAgo(5) }),
        makeRecord({ next_review_date: daysAgo(10) }),
        makeRecord({ next_review_date: daysAgo(15) }),
      ];
      const alerts = identifyLaundryClothingAlerts(records);
      const reviewAlerts = alerts.filter((a) => a.type === "review_overdue");
      expect(reviewAlerts).toHaveLength(1);
    });

    it("message contains schedule promptly wording", () => {
      const records = [makeRecord({ next_review_date: daysAgo(5) })];
      const alerts = identifyLaundryClothingAlerts(records);
      const alert = alerts.find((a) => a.type === "review_overdue")!;
      expect(alert.message).toContain("schedule promptly");
    });

    it("only counts past dates, not future or null", () => {
      const records = [
        makeRecord({ next_review_date: daysAgo(5) }),
        makeRecord({ next_review_date: daysFromNow(10) }),
        makeRecord({ next_review_date: null }),
      ];
      const alerts = identifyLaundryClothingAlerts(records);
      const alert = alerts.find((a) => a.type === "review_overdue")!;
      expect(alert.message).toContain("1");
    });
  });

  describe("multiple alert types simultaneously", () => {
    it("fires all alert types when all conditions are met", () => {
      const records = [
        makeRecord({ dignity_maintained: false, child_name: "Alice", event_date: "2026-05-01", adequate_wardrobe: false, choice_level: "no_choice", laundry_standard: "poor", next_review_date: daysAgo(5) }),
        makeRecord({ dignity_maintained: false, child_name: "Bob", event_date: "2026-04-01", adequate_wardrobe: false, choice_level: "no_choice", laundry_standard: "poor", next_review_date: daysAgo(10) }),
      ];
      const alerts = identifyLaundryClothingAlerts(records);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("dignity_not_maintained");
      expect(types).toContain("inadequate_wardrobe");
      expect(types).toContain("no_clothing_choice");
      expect(types).toContain("poor_laundry");
      expect(types).toContain("review_overdue");
    });

    it("dignity alerts are per-record while others are aggregated", () => {
      const records = [
        makeRecord({ dignity_maintained: false, child_name: "Alice", event_date: "2026-05-01", adequate_wardrobe: false, choice_level: "no_choice", laundry_standard: "poor", next_review_date: daysAgo(5) }),
        makeRecord({ dignity_maintained: false, child_name: "Bob", event_date: "2026-04-01", adequate_wardrobe: false, choice_level: "no_choice", laundry_standard: "poor", next_review_date: daysAgo(10) }),
      ];
      const alerts = identifyLaundryClothingAlerts(records);
      const dignityAlerts = alerts.filter((a) => a.type === "dignity_not_maintained");
      const wardrobeAlerts = alerts.filter((a) => a.type === "inadequate_wardrobe");
      const choiceAlerts = alerts.filter((a) => a.type === "no_clothing_choice");
      const laundryAlerts = alerts.filter((a) => a.type === "poor_laundry");
      const reviewAlerts = alerts.filter((a) => a.type === "review_overdue");
      expect(dignityAlerts).toHaveLength(2);
      expect(wardrobeAlerts).toHaveLength(1);
      expect(choiceAlerts).toHaveLength(1);
      expect(laundryAlerts).toHaveLength(1);
      expect(reviewAlerts).toHaveLength(1);
    });

    it("critical alerts come before high and medium alerts", () => {
      const records = [
        makeRecord({ dignity_maintained: false, child_name: "Alice", event_date: "2026-05-01", adequate_wardrobe: false, choice_level: "no_choice", laundry_standard: "poor", next_review_date: daysAgo(5) }),
        makeRecord({ laundry_standard: "poor" }),
      ];
      const alerts = identifyLaundryClothingAlerts(records);
      const firstAlert = alerts[0];
      expect(firstAlert.severity).toBe("critical");
    });

    it("can have dignity alert without other alerts", () => {
      const records = [
        makeRecord({ dignity_maintained: false, child_name: "Alice", event_date: "2026-05-01", adequate_wardrobe: true, choice_level: "full_choice", laundry_standard: "good" }),
      ];
      const alerts = identifyLaundryClothingAlerts(records);
      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe("dignity_not_maintained");
    });

    it("can have inadequate_wardrobe without dignity alert", () => {
      const records = [
        makeRecord({ dignity_maintained: true, adequate_wardrobe: false, choice_level: "full_choice", laundry_standard: "good" }),
      ];
      const alerts = identifyLaundryClothingAlerts(records);
      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe("inadequate_wardrobe");
    });
  });
});
