import { describe, it, expect } from "vitest";
import {
  computeLaundryClothingMetrics,
  identifyLaundryClothingAlerts,
  type LaundryClothingRecord,
} from "./laundry-clothing-service";

function makeRecord(overrides: Partial<LaundryClothingRecord> = {}): LaundryClothingRecord {
  return {
    id: "lc-1",
    home_id: "home-1",
    event_type: "clothing_inventory",
    event_date: "2026-05-01",
    child_name: "Alice",
    clothing_condition: "good",
    laundry_standard: "good",
    choice_level: "full_choice",
    child_chose_own_clothes: true,
    adequate_wardrobe: true,
    school_uniform_adequate: true,
    seasonal_clothing_adequate: true,
    laundry_done_regularly: true,
    clothes_returned_promptly: true,
    personal_items_labelled: true,
    budget_amount: 100,
    amount_spent: 80,
    dignity_maintained: true,
    cultural_needs_met: true,
    issues_found: [],
    actions_taken: [],
    assessed_by: "Staff A",
    next_review_date: null,
    notes: null,
    created_at: "2026-05-01T10:00:00Z",
    updated_at: "2026-05-01T10:00:00Z",
    ...overrides,
  };
}

describe("computeLaundryClothingMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeLaundryClothingMetrics([]);
    expect(m.total_records).toBe(0);
    expect(m.clothing_purchase_count).toBe(0);
    expect(m.child_chose_own_rate).toBeNull();;
    expect(m.total_budget).toBe(0);
    expect(m.total_spent).toBe(0);
  });

  it("computes correct counts and rates for populated data", () => {
    const records = [
      makeRecord({ id: "1", event_type: "clothing_purchase", clothing_condition: "new", choice_level: "full_choice", budget_amount: 50, amount_spent: 45 }),
      makeRecord({ id: "2", event_type: "laundry_check", laundry_standard: "poor", clothing_condition: "needs_replacing", choice_level: "no_choice", child_chose_own_clothes: false, dignity_maintained: false, budget_amount: null, amount_spent: null }),
      makeRecord({ id: "3", event_type: "clothing_inventory", choice_level: "some_choice", budget_amount: 100, amount_spent: 80 }),
    ];
    const m = computeLaundryClothingMetrics(records);
    expect(m.total_records).toBe(3);
    expect(m.clothing_purchase_count).toBe(1);
    expect(m.laundry_check_count).toBe(1);
    expect(m.clothing_inventory_count).toBe(1);
    expect(m.poor_laundry_count).toBe(1);
    expect(m.needs_replacing_count).toBe(1);
    expect(m.no_choice_count).toBe(1);
    // full_choice: 1 out of 3 = 33.3%
    expect(m.full_choice_rate).toBe(33.3);
    // child_chose_own: 2 out of 3 = 66.7%
    expect(m.child_chose_own_rate).toBe(66.7);
    // dignity_maintained: 2 out of 3 = 66.7%
    expect(m.dignity_maintained_rate).toBe(66.7);
    expect(m.total_budget).toBe(150);
    expect(m.total_spent).toBe(125);
  });
});

describe("identifyLaundryClothingAlerts", () => {
  it("returns empty alerts for empty data", () => {
    expect(identifyLaundryClothingAlerts([])).toEqual([]);
  });

  it("triggers dignity_not_maintained alert (critical)", () => {
    const records = [
      makeRecord({ id: "a1", dignity_maintained: false, child_name: "Alice", event_date: "2026-05-01" }),
    ];
    const alerts = identifyLaundryClothingAlerts(records);
    const found = alerts.find((a) => a.type === "dignity_not_maintained");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("critical");
  });

  it("triggers inadequate_wardrobe alert when >= 1 inadequate (high)", () => {
    const records = [
      makeRecord({ id: "a2", adequate_wardrobe: false }),
    ];
    const alerts = identifyLaundryClothingAlerts(records);
    const found = alerts.find((a) => a.type === "inadequate_wardrobe");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("high");
  });

  it("triggers no_clothing_choice when >= 1 with no choice (high)", () => {
    const records = [
      makeRecord({ id: "a3", choice_level: "no_choice" }),
    ];
    const alerts = identifyLaundryClothingAlerts(records);
    const found = alerts.find((a) => a.type === "no_clothing_choice");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("high");
  });

  it("triggers poor_laundry alert when >= 2 poor laundry (medium)", () => {
    const records = [
      makeRecord({ id: "1", laundry_standard: "poor" }),
      makeRecord({ id: "2", laundry_standard: "poor" }),
    ];
    const alerts = identifyLaundryClothingAlerts(records);
    const found = alerts.find((a) => a.type === "poor_laundry");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("medium");
  });

  it("does not trigger poor_laundry when only 1 poor", () => {
    const records = [
      makeRecord({ id: "1", laundry_standard: "poor" }),
    ];
    const alerts = identifyLaundryClothingAlerts(records);
    const found = alerts.find((a) => a.type === "poor_laundry");
    expect(found).toBeUndefined();
  });

  it("triggers review_overdue alert when >= 1 overdue (medium)", () => {
    const records = [
      makeRecord({ id: "a4", next_review_date: "2026-01-01" }),
    ];
    const alerts = identifyLaundryClothingAlerts(records);
    const found = alerts.find((a) => a.type === "review_overdue");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("medium");
  });

  it("does not trigger review_overdue when review date is in the future", () => {
    const records = [
      makeRecord({ id: "a5", next_review_date: "2027-12-01" }),
    ];
    const alerts = identifyLaundryClothingAlerts(records);
    const found = alerts.find((a) => a.type === "review_overdue");
    expect(found).toBeUndefined();
  });
});
