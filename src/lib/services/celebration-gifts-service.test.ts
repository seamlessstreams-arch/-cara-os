import { describe, it, expect } from "vitest";
import {
  computeMetrics,
  computeAlerts,
  validateCelebrationGift,
  type CelebrationGiftRow,
} from "./celebration-gifts-service";

function makeRow(overrides: Partial<CelebrationGiftRow> = {}): CelebrationGiftRow {
  return {
    id: "gift-1",
    home_id: "home-1",
    child_name: "Emma Brown",
    occasion_date: "2026-04-15",
    recorded_by: "Staff A",
    occasion_type: "Birthday",
    gift_type: "Books",
    gift_value: 30,
    budget_limit: 50,
    within_budget: true,
    child_chose: true,
    age_appropriate: true,
    receipt_kept: true,
    social_worker_aware: true,
    cultural_preference_considered: true,
    celebration_activity_planned: true,
    peers_included: true,
    child_feedback: "Loved it!",
    notes: null,
    created_at: "2026-04-15T00:00:00Z",
    updated_at: "2026-04-15T00:00:00Z",
    ...overrides,
  };
}

describe("computeMetrics", () => {
  it("returns zeroes for empty rows", () => {
    const m = computeMetrics([]);
    expect(m.total_records).toBe(0);
    expect(m.unique_children).toBe(0);
    expect(m.total_gift_value).toBe(0);
    expect(m.average_gift_value).toBeNull(); // fab-0.;
    expect(m.highest_gift_value).toBeNull(); // fab-0.;
    expect(m.over_budget_count).toBe(0);
  });

  it("calculates financial metrics correctly", () => {
    const rows = [
      makeRow({ id: "1", gift_value: 30, budget_limit: 50 }),
      makeRow({ id: "2", gift_value: 70, budget_limit: 50, child_name: "Sam" }),
    ];
    const m = computeMetrics(rows);
    expect(m.total_records).toBe(2);
    expect(m.unique_children).toBe(2);
    expect(m.total_gift_value).toBe(100);
    expect(m.average_gift_value).toBe(50);
    expect(m.highest_gift_value).toBe(70);
    expect(m.over_budget_count).toBe(1);
  });

  it("calculates boolean rates", () => {
    const rows = [
      makeRow({ id: "1", child_chose: true, receipt_kept: true }),
      makeRow({ id: "2", child_chose: false, receipt_kept: false }),
    ];
    const m = computeMetrics(rows);
    expect(m.child_choice_rate).toBe(50);
    expect(m.receipt_kept_rate).toBe(50);
  });

  it("counts cultural, religious, and milestone occasions", () => {
    const rows = [
      makeRow({ id: "1", occasion_type: "Eid" }),
      makeRow({ id: "2", occasion_type: "Christmas" }),
      makeRow({ id: "3", occasion_type: "Birthday" }),
    ];
    const m = computeMetrics(rows);
    expect(m.cultural_occasion_count).toBe(1); // Eid
    expect(m.religious_occasion_count).toBe(2); // Christmas + Eid
    expect(m.milestone_occasion_count).toBe(1); // Birthday
  });

  it("computes average_per_child correctly", () => {
    const rows = [
      makeRow({ id: "1", child_name: "Emma" }),
      makeRow({ id: "2", child_name: "Emma" }),
      makeRow({ id: "3", child_name: "Sam" }),
    ];
    const m = computeMetrics(rows);
    expect(m.average_per_child).toBe(1.5);
  });
});

describe("computeAlerts", () => {
  it("returns no alerts for empty rows", () => {
    expect(computeAlerts([])).toEqual([]);
  });

  it("fires critical alert for age-inappropriate gift", () => {
    const rows = [makeRow({ age_appropriate: false })];
    const alerts = computeAlerts(rows);
    const ai = alerts.filter((a) => a.type === "age_inappropriate_gift");
    expect(ai.length).toBe(1);
    expect(ai[0].severity).toBe("critical");
  });

  it("fires critical alert for high-value no receipt (> 100)", () => {
    const rows = [makeRow({ gift_value: 150, receipt_kept: false })];
    const alerts = computeAlerts(rows);
    const hv = alerts.filter((a) => a.type === "high_value_no_receipt");
    expect(hv.length).toBe(1);
    expect(hv[0].severity).toBe("critical");
  });

  it("fires critical alert for significantly over budget (> 1.5x)", () => {
    const rows = [makeRow({ gift_value: 80, budget_limit: 50 })]; // 80 > 50 * 1.5 = 75
    const alerts = computeAlerts(rows);
    const ob = alerts.filter((a) => a.type === "significantly_over_budget");
    expect(ob.length).toBe(1);
    expect(ob[0].severity).toBe("critical");
  });

  it("fires high alert for cultural occasion without cultural consideration", () => {
    const rows = [makeRow({ occasion_type: "Eid", cultural_preference_considered: false })];
    const alerts = computeAlerts(rows);
    const cc = alerts.filter((a) => a.type === "cultural_occasion_no_consideration");
    expect(cc.length).toBe(1);
    expect(cc[0].severity).toBe("high");
  });

  it("fires high alert for child never choosing with >= 3 records", () => {
    const rows = Array.from({ length: 3 }, (_, i) =>
      makeRow({ id: `g-${i}`, child_chose: false }),
    );
    const alerts = computeAlerts(rows);
    const nc = alerts.filter((a) => a.type === "child_never_chooses");
    expect(nc.length).toBe(1);
    expect(nc[0].severity).toBe("high");
  });

  it("fires medium alert for repeated over budget >= 3", () => {
    const rows = Array.from({ length: 3 }, (_, i) =>
      makeRow({ id: `g-${i}`, gift_value: 60, budget_limit: 50 }),
    );
    const alerts = computeAlerts(rows);
    const rob = alerts.filter((a) => a.type === "repeated_over_budget");
    expect(rob.length).toBe(1);
    expect(rob[0].severity).toBe("medium");
  });
});

describe("validateCelebrationGift", () => {
  it("passes with valid input", () => {
    const result = validateCelebrationGift({
      childName: "Emma",
      occasionDate: "2026-04-15",
      recordedBy: "Staff A",
      occasionType: "Birthday",
      giftType: "Books",
      giftValue: 30,
      ageAppropriate: true,
      receiptKept: true,
      culturalPreferenceConsidered: true,
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("rejects missing required fields", () => {
    const result = validateCelebrationGift({});
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(3);
  });

  it("rejects over-budget marked as within-budget", () => {
    const result = validateCelebrationGift({
      childName: "Emma",
      occasionDate: "2026-04-15",
      recordedBy: "Staff A",
      occasionType: "Birthday",
      giftValue: 60,
      budgetLimit: 50,
      withinBudget: true,
      ageAppropriate: true,
      receiptKept: true,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("exceeds budget"))).toBe(true);
  });

  it("rejects receipt not kept for gift > 50", () => {
    const result = validateCelebrationGift({
      childName: "Emma",
      occasionDate: "2026-04-15",
      recordedBy: "Staff A",
      occasionType: "Birthday",
      giftValue: 55,
      receiptKept: false,
      ageAppropriate: true,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Receipt not kept"))).toBe(true);
  });
});
