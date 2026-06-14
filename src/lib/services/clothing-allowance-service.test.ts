import { describe, it, expect } from "vitest";
import {
  computeMetrics,
  computeAlerts,
  validateClothingAllowance,
  generateCaraInsights,
} from "./clothing-allowance-service";
import type { ClothingAllowanceRow } from "./clothing-allowance-service";

// -- Factory Function ---------------------------------------------------------

function makeRow(overrides: Partial<ClothingAllowanceRow> = {}): ClothingAllowanceRow {
  return {
    id: "ca-1",
    home_id: "home-1",
    child_name: "Alex",
    record_date: "2026-05-15",
    recorded_by: "staff-1",
    record_type: "Seasonal Allowance",
    amount: 50,
    budget_period: "Quarterly",
    child_chose: true,
    age_appropriate: true,
    good_condition: true,
    sufficient_quantity: true,
    brand_preference_respected: true,
    cultural_needs_met: true,
    receipt_kept: true,
    season_appropriate: true,
    school_requirements_met: null,
    notes: null,
    created_at: "2026-05-15T00:00:00Z",
    updated_at: "2026-05-15T00:00:00Z",
    ...overrides,
  };
}

// -- computeMetrics -----------------------------------------------------------

describe("computeMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeMetrics([]);
    expect(m.total_records).toBe(0);
    expect(m.unique_children).toBe(0);
    expect(m.total_spend).toBe(0);
    expect(m.average_spend_per_record).toBe(0);
    expect(m.average_spend_per_child).toBe(0);
    expect(m.child_choice_rate).toBe(0);
    expect(m.highest_single_spend).toBe(0);
  });

  it("computes populated metrics correctly", () => {
    const rows = [
      makeRow({ child_name: "Alex", amount: 50, record_type: "Seasonal Allowance", child_chose: true }),
      makeRow({ id: "ca-2", child_name: "Beth", amount: 30, record_type: "School Uniform", child_chose: false, school_requirements_met: true }),
      makeRow({ id: "ca-3", child_name: "Chris", amount: 20, record_type: "Emergency Purchase", child_chose: true, receipt_kept: false }),
    ];
    const m = computeMetrics(rows);

    expect(m.total_records).toBe(3);
    expect(m.unique_children).toBe(3);
    expect(m.total_spend).toBe(100);
    expect(m.average_spend_per_record).toBe(33.33);
    expect(m.highest_single_spend).toBe(50);
    // 2/3 child chose
    expect(m.child_choice_rate).toBe(66.7);
    // 2/3 receipt kept
    expect(m.receipt_kept_rate).toBe(66.7);
    expect(m.emergency_purchase_count).toBe(1);
    expect(m.school_related_count).toBe(1);
    // school requirements: 1 true out of 1 non-null
    expect(m.school_requirements_rate).toBe(100);
    expect(m.by_record_type["Seasonal Allowance"]).toBe(1);
    expect(m.by_record_type["School Uniform"]).toBe(1);
    expect(m.by_record_type["Emergency Purchase"]).toBe(1);
  });

  it("computes essential and discretionary counts", () => {
    const rows = [
      makeRow({ record_type: "School Uniform" }),
      makeRow({ id: "ca-2", record_type: "Footwear" }),
      makeRow({ id: "ca-3", record_type: "Special Occasion Outfit" }),
      makeRow({ id: "ca-4", record_type: "Wardrobe Audit", amount: 0 }),
    ];
    const m = computeMetrics(rows);
    expect(m.essential_purchase_count).toBe(2);
    expect(m.discretionary_purchase_count).toBe(1);
    expect(m.planning_activity_count).toBe(1);
  });
});

// -- computeAlerts ------------------------------------------------------------

describe("computeAlerts", () => {
  it("returns no alerts for empty data", () => {
    const alerts = computeAlerts([]);
    expect(alerts).toHaveLength(0);
  });

  it("fires insufficient_quantity for each row with insufficient quantity", () => {
    const rows = [makeRow({ sufficient_quantity: false })];
    const alerts = computeAlerts(rows);
    expect(alerts.some((a) => a.type === "insufficient_quantity" && a.severity === "critical")).toBe(true);
  });

  it("fires poor_condition for each row with bad condition", () => {
    const rows = [makeRow({ good_condition: false })];
    const alerts = computeAlerts(rows);
    expect(alerts.some((a) => a.type === "poor_condition" && a.severity === "critical")).toBe(true);
  });

  it("fires not_season_appropriate for each row not season appropriate", () => {
    const rows = [makeRow({ season_appropriate: false })];
    const alerts = computeAlerts(rows);
    expect(alerts.some((a) => a.type === "not_season_appropriate" && a.severity === "critical")).toBe(true);
  });

  it("fires school_requirements_not_met for row with false school_requirements_met", () => {
    const rows = [makeRow({ school_requirements_met: false })];
    const alerts = computeAlerts(rows);
    expect(alerts.some((a) => a.type === "school_requirements_not_met" && a.severity === "critical")).toBe(true);
  });

  it("fires age_inappropriate for row with age_appropriate false", () => {
    const rows = [makeRow({ age_appropriate: false })];
    const alerts = computeAlerts(rows);
    expect(alerts.some((a) => a.type === "age_inappropriate" && a.severity === "high")).toBe(true);
  });

  it("fires child_never_chooses_clothing when child has >= 3 purchases with 0 choices", () => {
    const rows = [
      makeRow({ id: "ca-1", child_name: "Alex", record_type: "Seasonal Allowance", child_chose: false }),
      makeRow({ id: "ca-2", child_name: "Alex", record_type: "School Uniform", child_chose: false }),
      makeRow({ id: "ca-3", child_name: "Alex", record_type: "Footwear", child_chose: false }),
    ];
    const alerts = computeAlerts(rows);
    expect(alerts.some((a) => a.type === "child_never_chooses_clothing" && a.severity === "high")).toBe(true);
  });

  it("fires high_emergency_purchase_ratio when > 40% emergency purchases out of >= 5", () => {
    const rows = [
      makeRow({ id: "ca-1", record_type: "Emergency Purchase" }),
      makeRow({ id: "ca-2", record_type: "Emergency Purchase" }),
      makeRow({ id: "ca-3", record_type: "Emergency Purchase" }),
      makeRow({ id: "ca-4", record_type: "Seasonal Allowance" }),
      makeRow({ id: "ca-5", record_type: "Footwear" }),
    ];
    const alerts = computeAlerts(rows);
    expect(alerts.some((a) => a.type === "high_emergency_purchase_ratio" && a.severity === "high")).toBe(true);
  });

  it("fires low_receipt_rate when < 50% receipts across >= 5 purchase rows with cost", () => {
    const rows = [
      makeRow({ id: "ca-1", amount: 10, receipt_kept: false }),
      makeRow({ id: "ca-2", amount: 10, receipt_kept: false }),
      makeRow({ id: "ca-3", amount: 10, receipt_kept: false }),
      makeRow({ id: "ca-4", amount: 10, receipt_kept: true }),
      makeRow({ id: "ca-5", amount: 10, receipt_kept: true }),
    ];
    const alerts = computeAlerts(rows);
    expect(alerts.some((a) => a.type === "low_receipt_rate" && a.severity === "high")).toBe(true);
  });

  it("fires no_wardrobe_audits when >= 8 records but no Wardrobe Audit type", () => {
    const rows = Array.from({ length: 8 }, (_, i) =>
      makeRow({ id: `ca-${i}`, record_type: "Seasonal Allowance" }),
    );
    const alerts = computeAlerts(rows);
    expect(alerts.some((a) => a.type === "no_wardrobe_audits" && a.severity === "medium")).toBe(true);
  });

  it("fires spending_inequality when large gap between children", () => {
    const rows = [
      makeRow({ id: "ca-1", child_name: "Alex", amount: 200 }),
      makeRow({ id: "ca-2", child_name: "Beth", amount: 10 }),
    ];
    const alerts = computeAlerts(rows);
    expect(alerts.some((a) => a.type === "spending_inequality" && a.severity === "medium")).toBe(true);
  });
});

// -- validateClothingAllowance ------------------------------------------------

describe("validateClothingAllowance", () => {
  it("returns valid for good input", () => {
    const result = validateClothingAllowance({
      childName: "Alex",
      recordDate: "2026-05-15",
      recordedBy: "staff-1",
      recordType: "Seasonal Allowance",
      amount: 50,
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("returns errors for missing required fields", () => {
    const result = validateClothingAllowance({});
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(3);
  });

  it("returns error for negative amount", () => {
    const result = validateClothingAllowance({
      childName: "Alex",
      recordDate: "2026-05-15",
      recordedBy: "staff-1",
      recordType: "Seasonal Allowance",
      amount: -10,
    });
    expect(result.errors.some((e) => e.includes("negative"))).toBe(true);
  });

  it("returns error for invalid record type", () => {
    const result = validateClothingAllowance({
      childName: "Alex",
      recordDate: "2026-05-15",
      recordedBy: "staff-1",
      recordType: "Invalid Type",
    });
    expect(result.errors.some((e) => e.includes("Record type"))).toBe(true);
  });

  it("returns error for age-inappropriate clothing", () => {
    const result = validateClothingAllowance({
      childName: "Alex",
      recordDate: "2026-05-15",
      recordedBy: "staff-1",
      recordType: "Seasonal Allowance",
      ageAppropriate: false,
    });
    expect(result.errors.some((e) => e.includes("age-appropriate"))).toBe(true);
  });

  it("returns error for insufficient quantity", () => {
    const result = validateClothingAllowance({
      childName: "Alex",
      recordDate: "2026-05-15",
      recordedBy: "staff-1",
      recordType: "Seasonal Allowance",
      sufficientQuantity: false,
    });
    expect(result.errors.some((e) => e.includes("insufficient"))).toBe(true);
  });

  it("returns error for receipt not kept on purchase > 30", () => {
    const result = validateClothingAllowance({
      childName: "Alex",
      recordDate: "2026-05-15",
      recordedBy: "staff-1",
      recordType: "Seasonal Allowance",
      amount: 50,
      receiptKept: false,
    });
    expect(result.errors.some((e) => e.includes("Receipt not kept"))).toBe(true);
  });
});

// -- generateCaraInsights -----------------------------------------------------

describe("generateCaraInsights", () => {
  it("returns 3 insights for populated data", () => {
    const rows = [makeRow(), makeRow({ id: "ca-2", child_name: "Beth" })];
    const insights = generateCaraInsights(rows);
    expect(insights).toHaveLength(3);
    expect(insights[0]).toContain("[sky]");
    expect(insights[1]).toContain("[amber]");
    expect(insights[2]).toContain("[reflect]");
  });

  it("returns 3 insights for empty data", () => {
    const insights = generateCaraInsights([]);
    expect(insights).toHaveLength(3);
  });
});
