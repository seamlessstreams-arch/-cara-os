import { describe, it, expect } from "vitest";
import {
  computeMetrics,
  computeAlerts,
  validateRoomPersonalisation,
  RECORD_TYPES,
} from "./room-personalisation-service";
import type { RoomPersonalisationRow } from "./room-personalisation-service";

// -- Factory ------------------------------------------------------------------

function makeRow(overrides: Partial<RoomPersonalisationRow> = {}): RoomPersonalisationRow {
  return {
    id: "rp-1",
    home_id: "home-1",
    child_name: "Alex",
    record_date: "2026-05-10",
    recorded_by: "Staff A",
    record_type: "Decoration Choice",
    item_description: "Star Wars poster",
    child_chose: true,
    budget: 50,
    amount_spent: 40,
    within_budget: true,
    age_appropriate: true,
    safety_checked: true,
    health_safety_compliant: true,
    cultural_needs_considered: true,
    sensory_needs_considered: true,
    child_satisfied: true,
    photos_taken: true,
    privacy_maintained: true,
    notes: null,
    created_at: "2026-05-10T00:00:00Z",
    updated_at: "2026-05-10T00:00:00Z",
    ...overrides,
  };
}

// -- computeMetrics -----------------------------------------------------------

describe("computeMetrics", () => {
  it("returns zeroes for empty array", () => {
    const m = computeMetrics([]);
    expect(m.total_records).toBe(0);
    expect(m.unique_children).toBe(0);
    expect(m.decoration_count).toBe(0);
    expect(m.child_choice_rate).toBeNull();; expect(m.total_budget).toBe(0);
    expect(m.total_spent).toBe(0);
    expect(m.average_spend_per_child).toBeNull();; });

  it("counts total and unique children (case insensitive)", () => {
    const rows = [
      makeRow({ id: "1", child_name: "Alex" }),
      makeRow({ id: "2", child_name: "Beth" }),
      makeRow({ id: "3", child_name: "alex" }),
    ];
    const m = computeMetrics(rows);
    expect(m.total_records).toBe(3);
    expect(m.unique_children).toBe(2);
  });

  it("counts decoration, functional, assessment categories", () => {
    const rows = [
      makeRow({ id: "1", record_type: "Decoration Choice" }),
      makeRow({ id: "2", record_type: "Furniture Request" }),
      makeRow({ id: "3", record_type: "Room Audit" }),
      makeRow({ id: "4", record_type: "Seasonal Update" }),
    ];
    const m = computeMetrics(rows);
    expect(m.decoration_count).toBe(1);
    expect(m.functional_count).toBe(1);
    expect(m.assessment_count).toBe(1);
    expect(m.seasonal_update_count).toBe(1);
  });

  it("computes financial metrics correctly", () => {
    const rows = [
      makeRow({ id: "1", budget: 50, amount_spent: 40, within_budget: true }),
      makeRow({ id: "2", budget: 30, amount_spent: 35, within_budget: false }),
    ];
    const m = computeMetrics(rows);
    expect(m.total_budget).toBe(80);
    expect(m.total_spent).toBe(75);
    expect(m.within_budget_rate).toBe(50);
  });

  it("computes boolean rates as percentages", () => {
    const rows = [
      makeRow({ id: "1", child_chose: true }),
      makeRow({ id: "2", child_chose: false }),
    ];
    const m = computeMetrics(rows);
    expect(m.child_choice_rate).toBe(50);
  });

  it("counts children with no decoration records", () => {
    const rows = [
      makeRow({ id: "1", child_name: "Alex", record_type: "Decoration Choice" }),
      makeRow({ id: "2", child_name: "Beth", record_type: "Room Audit" }),
    ];
    const m = computeMetrics(rows);
    expect(m.children_with_no_decoration).toBe(1);
  });
});

// -- computeAlerts ------------------------------------------------------------

describe("computeAlerts", () => {
  it("returns empty for empty array", () => {
    expect(computeAlerts([])).toEqual([]);
  });

  it("fires critical alert for safety not checked", () => {
    const rows = [makeRow({ safety_checked: false })];
    const alerts = computeAlerts(rows);
    const hit = alerts.find((a) => a.type === "safety_not_checked");
    expect(hit).toBeDefined();
    expect(hit!.severity).toBe("critical");
  });

  it("fires critical alert for H&S non-compliant", () => {
    const rows = [makeRow({ health_safety_compliant: false })];
    const alerts = computeAlerts(rows);
    const hit = alerts.find((a) => a.type === "hs_non_compliant");
    expect(hit).toBeDefined();
    expect(hit!.severity).toBe("critical");
  });

  it("fires critical alert for privacy breach", () => {
    const rows = [makeRow({ privacy_maintained: false })];
    const alerts = computeAlerts(rows);
    const hit = alerts.find((a) => a.type === "privacy_breach");
    expect(hit).toBeDefined();
    expect(hit!.severity).toBe("critical");
  });

  it("fires high alert when child never chooses (>= 3 decoration records, 0 chosen)", () => {
    const rows = [
      makeRow({ id: "1", child_name: "Alex", record_type: "Decoration Choice", child_chose: false }),
      makeRow({ id: "2", child_name: "Alex", record_type: "Bedding Choice", child_chose: false }),
      makeRow({ id: "3", child_name: "Alex", record_type: "Poster/Art Display", child_chose: false }),
    ];
    const alerts = computeAlerts(rows);
    const hit = alerts.find((a) => a.type === "child_never_chooses");
    expect(hit).toBeDefined();
    expect(hit!.severity).toBe("high");
  });

  it("fires high alert when child not satisfied with decoration", () => {
    const rows = [makeRow({ child_satisfied: false, record_type: "Decoration Choice" })];
    const alerts = computeAlerts(rows);
    const hit = alerts.find((a) => a.type === "child_not_satisfied");
    expect(hit).toBeDefined();
    expect(hit!.severity).toBe("high");
  });

  it("fires medium alert for low cultural needs consideration (< 30%, >= 5 rows)", () => {
    const rows = Array.from({ length: 5 }, (_, i) =>
      makeRow({ id: `r-${i}`, cultural_needs_considered: i === 0 }), // 1/5 = 20%
    );
    const alerts = computeAlerts(rows);
    const hit = alerts.find((a) => a.type === "low_cultural_consideration");
    expect(hit).toBeDefined();
    expect(hit!.severity).toBe("medium");
  });

  it("fires medium alert for no room audits (>= 8 records, 0 audits)", () => {
    const rows = Array.from({ length: 8 }, (_, i) =>
      makeRow({ id: `r-${i}`, record_type: "Decoration Choice" }),
    );
    const alerts = computeAlerts(rows);
    const hit = alerts.find((a) => a.type === "no_room_audits");
    expect(hit).toBeDefined();
    expect(hit!.severity).toBe("medium");
  });

  it("fires medium alert for spending inequality", () => {
    const rows = [
      makeRow({ id: "1", child_name: "Alex", amount_spent: 200 }),
      makeRow({ id: "2", child_name: "Beth", amount_spent: 10 }),
    ];
    const alerts = computeAlerts(rows);
    const hit = alerts.find((a) => a.type === "spending_inequality");
    expect(hit).toBeDefined();
    expect(hit!.severity).toBe("medium");
  });
});

// -- validateRoomPersonalisation ----------------------------------------------

describe("validateRoomPersonalisation", () => {
  it("passes for valid input", () => {
    const result = validateRoomPersonalisation({
      childName: "Alex",
      recordDate: "2026-05-10",
      recordedBy: "Staff A",
      recordType: "Decoration Choice",
      itemDescription: "Poster",
      childChose: true,
      safetyChecked: true,
      healthSafetyCompliant: true,
      privacyMaintained: true,
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("rejects empty child name", () => {
    const result = validateRoomPersonalisation({
      childName: "",
      recordDate: "2026-05-10",
      recordedBy: "Staff",
      recordType: "Decoration Choice",
      itemDescription: "Poster",
      safetyChecked: true,
      healthSafetyCompliant: true,
      privacyMaintained: true,
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Child name is required");
  });

  it("rejects child not choosing decoration item", () => {
    const result = validateRoomPersonalisation({
      childName: "Alex",
      recordDate: "2026-05-10",
      recordedBy: "Staff",
      recordType: "Bedding Choice",
      itemDescription: "Duvet",
      childChose: false,
      safetyChecked: true,
      healthSafetyCompliant: true,
      privacyMaintained: true,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Child did not choose"))).toBe(true);
  });

  it("rejects safety not checked", () => {
    const result = validateRoomPersonalisation({
      childName: "Alex",
      recordDate: "2026-05-10",
      recordedBy: "Staff",
      recordType: "Furniture Request",
      itemDescription: "Shelf",
      safetyChecked: false,
      healthSafetyCompliant: true,
      privacyMaintained: true,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Safety not checked"))).toBe(true);
  });

  it("rejects amount significantly over budget (> 20%)", () => {
    const result = validateRoomPersonalisation({
      childName: "Alex",
      recordDate: "2026-05-10",
      recordedBy: "Staff",
      recordType: "Furniture Request",
      itemDescription: "Desk",
      safetyChecked: true,
      healthSafetyCompliant: true,
      privacyMaintained: true,
      budget: 100,
      amountSpent: 121,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("exceeds budget"))).toBe(true);
  });
});
