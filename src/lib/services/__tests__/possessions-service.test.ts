// ══════════════════════════════════════════════════════════════════════════════
// CARA — CHILDREN'S POSSESSIONS & PROPERTY SERVICE TESTS
// Pure-function unit tests for possession summary computation, alert
// identification, and constant validation (CHR 2015 Reg 21 — privacy &
// access, Reg 36 — case records, SCCIF Experiences).
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { _testing } from "../possessions-service";
import {
  POSSESSION_CATEGORIES,
  POSSESSION_STATUS,
  CONDITION_OPTIONS,
} from "../possessions-service";

import type {
  PossessionRecord,
  MoneyRecord,
} from "../possessions-service";

const {
  computePossessionSummary,
  identifyPossessionAlerts,
} = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

/** Build a minimal PossessionRecord with sensible defaults. */
function makePossession(
  overrides: Partial<PossessionRecord> = {},
): PossessionRecord {
  return {
    id: "id" in overrides ? overrides.id! : "poss-1",
    home_id: "home_id" in overrides ? overrides.home_id! : "home-1",
    child_id: "child_id" in overrides ? overrides.child_id! : "child-1",
    child_name: "child_name" in overrides ? overrides.child_name! : "Alice",
    item_description: "item_description" in overrides ? overrides.item_description! : "Test item",
    category: "category" in overrides ? overrides.category! : "electronics",
    estimated_value: "estimated_value" in overrides ? overrides.estimated_value! : null,
    condition_on_arrival: "condition_on_arrival" in overrides ? overrides.condition_on_arrival! : "good",
    condition_on_departure: "condition_on_departure" in overrides ? overrides.condition_on_departure! : null,
    stored_location: "stored_location" in overrides ? overrides.stored_location! : null,
    photo_reference: "photo_reference" in overrides ? overrides.photo_reference! : null,
    recorded_date: "recorded_date" in overrides ? overrides.recorded_date! : "2026-01-15",
    recorded_by: "recorded_by" in overrides ? overrides.recorded_by! : "staff-1",
    child_signed: "child_signed" in overrides ? overrides.child_signed! : true,
    staff_signed: "staff_signed" in overrides ? overrides.staff_signed! : true,
    status: "status" in overrides ? overrides.status! : "with_child",
    notes: "notes" in overrides ? overrides.notes! : null,
    created_at: "created_at" in overrides ? overrides.created_at! : "2026-01-01T00:00:00Z",
    updated_at: "updated_at" in overrides ? overrides.updated_at! : "2026-01-01T00:00:00Z",
  };
}

/** Build a minimal MoneyRecord with sensible defaults. */
function makeMoneyRecord(
  overrides: Partial<MoneyRecord> = {},
): MoneyRecord {
  return {
    id: "id" in overrides ? overrides.id! : "money-1",
    home_id: "home_id" in overrides ? overrides.home_id! : "home-1",
    child_id: "child_id" in overrides ? overrides.child_id! : "child-1",
    child_name: "child_name" in overrides ? overrides.child_name! : "Alice",
    transaction_type: "transaction_type" in overrides ? overrides.transaction_type! : "deposit",
    amount: "amount" in overrides ? overrides.amount! : 10,
    description: "description" in overrides ? overrides.description! : "Test deposit",
    balance_after: "balance_after" in overrides ? overrides.balance_after! : 10,
    recorded_date: "recorded_date" in overrides ? overrides.recorded_date! : "2026-01-15",
    recorded_by: "recorded_by" in overrides ? overrides.recorded_by! : "staff-1",
    child_signed: "child_signed" in overrides ? overrides.child_signed! : true,
    receipt_reference: "receipt_reference" in overrides ? overrides.receipt_reference! : null,
    created_at: "created_at" in overrides ? overrides.created_at! : "2026-01-01T00:00:00Z",
  };
}

// ── computePossessionSummary ──────────────────────────────────────────────

describe("computePossessionSummary", () => {
  it("returns zeroed stats for empty arrays", () => {
    const result = computePossessionSummary([], []);
    expect(result.total_items).toBe(0);
    expect(result.by_status).toEqual({});
    expect(result.by_category).toEqual({});
    expect(result.items_with_child).toBe(0);
    expect(result.items_in_safe).toBe(0);
    expect(result.items_lost_damaged).toBe(0);
    expect(result.signing_compliance).toBeNull();;
    expect(result.total_estimated_value).toBe(0);
    expect(result.children_with_records).toBe(0);
    expect(result.money_children_count).toBe(0);
    expect(result.total_money_held).toBe(0);
  });

  it("counts total items correctly", () => {
    const possessions = [
      makePossession({ id: "p1" }),
      makePossession({ id: "p2" }),
      makePossession({ id: "p3" }),
    ];
    const result = computePossessionSummary(possessions, []);
    expect(result.total_items).toBe(3);
  });

  it("groups items by status correctly", () => {
    const possessions = [
      makePossession({ id: "p1", status: "with_child" }),
      makePossession({ id: "p2", status: "with_child" }),
      makePossession({ id: "p3", status: "in_safe" }),
      makePossession({ id: "p4", status: "lost" }),
      makePossession({ id: "p5", status: "returned" }),
    ];
    const result = computePossessionSummary(possessions, []);
    expect(result.by_status).toEqual({
      with_child: 2,
      in_safe: 1,
      lost: 1,
      returned: 1,
    });
  });

  it("groups items by category correctly", () => {
    const possessions = [
      makePossession({ id: "p1", category: "electronics" }),
      makePossession({ id: "p2", category: "electronics" }),
      makePossession({ id: "p3", category: "clothing" }),
      makePossession({ id: "p4", category: "jewellery" }),
    ];
    const result = computePossessionSummary(possessions, []);
    expect(result.by_category).toEqual({
      electronics: 2,
      clothing: 1,
      jewellery: 1,
    });
  });

  it("counts items_with_child correctly", () => {
    const possessions = [
      makePossession({ id: "p1", status: "with_child" }),
      makePossession({ id: "p2", status: "with_child" }),
      makePossession({ id: "p3", status: "in_safe" }),
    ];
    const result = computePossessionSummary(possessions, []);
    expect(result.items_with_child).toBe(2);
  });

  it("counts items_in_safe correctly", () => {
    const possessions = [
      makePossession({ id: "p1", status: "in_safe" }),
      makePossession({ id: "p2", status: "in_safe" }),
      makePossession({ id: "p3", status: "with_child" }),
    ];
    const result = computePossessionSummary(possessions, []);
    expect(result.items_in_safe).toBe(2);
  });

  it("counts items_lost_damaged including both lost and damaged", () => {
    const possessions = [
      makePossession({ id: "p1", status: "lost" }),
      makePossession({ id: "p2", status: "damaged" }),
      makePossession({ id: "p3", status: "with_child" }),
      makePossession({ id: "p4", status: "damaged" }),
    ];
    const result = computePossessionSummary(possessions, []);
    expect(result.items_lost_damaged).toBe(3);
  });

  it("computes signing_compliance when all records are signed", () => {
    const possessions = [
      makePossession({ id: "p1", child_signed: true, staff_signed: true }),
      makePossession({ id: "p2", child_signed: true, staff_signed: true }),
    ];
    const result = computePossessionSummary(possessions, []);
    expect(result.signing_compliance).toBe(100);
  });

  it("computes signing_compliance when no records are fully signed", () => {
    const possessions = [
      makePossession({ id: "p1", child_signed: true, staff_signed: false }),
      makePossession({ id: "p2", child_signed: false, staff_signed: true }),
    ];
    const result = computePossessionSummary(possessions, []);
    expect(result.signing_compliance).toBe(0);
  });

  it("computes signing_compliance for partial signing", () => {
    const possessions = [
      makePossession({ id: "p1", child_signed: true, staff_signed: true }),
      makePossession({ id: "p2", child_signed: true, staff_signed: false }),
      makePossession({ id: "p3", child_signed: false, staff_signed: true }),
      makePossession({ id: "p4", child_signed: true, staff_signed: true }),
    ];
    // 2 out of 4 = 50%
    const result = computePossessionSummary(possessions, []);
    expect(result.signing_compliance).toBe(50);
  });

  it("computes signing_compliance as 0 for empty possessions (no division by zero)", () => {
    const result = computePossessionSummary([], []);
    expect(result.signing_compliance).toBeNull();;
  });

  it("sums total_estimated_value correctly, ignoring null and zero", () => {
    const possessions = [
      makePossession({ id: "p1", estimated_value: 150.50 }),
      makePossession({ id: "p2", estimated_value: 75.25 }),
      makePossession({ id: "p3", estimated_value: null }),
      makePossession({ id: "p4", estimated_value: 0 }),
    ];
    const result = computePossessionSummary(possessions, []);
    expect(result.total_estimated_value).toBe(225.75);
  });

  it("rounds total_estimated_value to 2 decimal places", () => {
    const possessions = [
      makePossession({ id: "p1", estimated_value: 10.111 }),
      makePossession({ id: "p2", estimated_value: 20.222 }),
    ];
    const result = computePossessionSummary(possessions, []);
    expect(result.total_estimated_value).toBe(30.33);
  });

  it("counts unique children_with_records", () => {
    const possessions = [
      makePossession({ id: "p1", child_id: "child-1" }),
      makePossession({ id: "p2", child_id: "child-1" }),
      makePossession({ id: "p3", child_id: "child-2" }),
      makePossession({ id: "p4", child_id: "child-3" }),
    ];
    const result = computePossessionSummary(possessions, []);
    expect(result.children_with_records).toBe(3);
  });

  it("uses last money record balance_after per child for total_money_held", () => {
    // The implementation iterates records in order and keeps overwriting
    // childBalances[child_id] = balance_after, so last record per child wins
    const moneyRecords = [
      makeMoneyRecord({ id: "m1", child_id: "child-1", balance_after: 50 }),
      makeMoneyRecord({ id: "m2", child_id: "child-1", balance_after: 80 }),
      makeMoneyRecord({ id: "m3", child_id: "child-2", balance_after: 30 }),
    ];
    const result = computePossessionSummary([], moneyRecords);
    expect(result.money_children_count).toBe(2);
    // child-1 last balance = 80, child-2 last balance = 30
    expect(result.total_money_held).toBe(110);
  });

  it("counts money_children_count from unique children in money records", () => {
    const moneyRecords = [
      makeMoneyRecord({ id: "m1", child_id: "child-1", balance_after: 10 }),
      makeMoneyRecord({ id: "m2", child_id: "child-2", balance_after: 20 }),
      makeMoneyRecord({ id: "m3", child_id: "child-3", balance_after: 30 }),
    ];
    const result = computePossessionSummary([], moneyRecords);
    expect(result.money_children_count).toBe(3);
  });

  it("rounds total_money_held to 2 decimal places", () => {
    const moneyRecords = [
      makeMoneyRecord({ id: "m1", child_id: "child-1", balance_after: 10.555 }),
      makeMoneyRecord({ id: "m2", child_id: "child-2", balance_after: 20.449 }),
    ];
    const result = computePossessionSummary([], moneyRecords);
    expect(result.total_money_held).toBe(31);
  });

  it("handles possessions and money records together", () => {
    const possessions = [
      makePossession({ id: "p1", child_id: "child-1", status: "with_child", estimated_value: 100 }),
      makePossession({ id: "p2", child_id: "child-2", status: "in_safe", estimated_value: 50 }),
    ];
    const moneyRecords = [
      makeMoneyRecord({ id: "m1", child_id: "child-1", balance_after: 25 }),
      makeMoneyRecord({ id: "m2", child_id: "child-3", balance_after: 75 }),
    ];
    const result = computePossessionSummary(possessions, moneyRecords);
    expect(result.total_items).toBe(2);
    expect(result.children_with_records).toBe(2);
    expect(result.money_children_count).toBe(2);
    expect(result.total_money_held).toBe(100);
    expect(result.total_estimated_value).toBe(150);
  });
});

// ── identifyPossessionAlerts ──────────────────────────────────────────────

describe("identifyPossessionAlerts", () => {
  it("returns empty alerts for empty data with zero children", () => {
    const result = identifyPossessionAlerts([], [], 0);
    expect(result).toEqual([]);
  });

  it("flags lost items with medium severity", () => {
    const possessions = [
      makePossession({ id: "p1", status: "lost" }),
    ];
    const result = identifyPossessionAlerts(possessions, [], 0);
    const alert = result.find((a) => a.type === "lost_items");
    expect(alert).toBeDefined();
    expect(alert!.severity).toBe("medium");
    expect(alert!.message).toContain("1 item recorded as lost");
  });

  it("pluralises lost items message when more than one", () => {
    const possessions = [
      makePossession({ id: "p1", status: "lost" }),
      makePossession({ id: "p2", status: "lost" }),
      makePossession({ id: "p3", status: "lost" }),
    ];
    const result = identifyPossessionAlerts(possessions, [], 0);
    const alert = result.find((a) => a.type === "lost_items");
    expect(alert).toBeDefined();
    expect(alert!.message).toContain("3 items recorded as lost");
  });

  it("does not flag lost items when none are lost", () => {
    const possessions = [
      makePossession({ id: "p1", status: "with_child" }),
      makePossession({ id: "p2", status: "in_safe" }),
    ];
    const result = identifyPossessionAlerts(possessions, [], 0);
    const alert = result.find((a) => a.type === "lost_items");
    expect(alert).toBeUndefined();
  });

  it("flags damaged items with low severity", () => {
    const possessions = [
      makePossession({ id: "p1", status: "damaged" }),
    ];
    const result = identifyPossessionAlerts(possessions, [], 0);
    const alert = result.find((a) => a.type === "damaged_items");
    expect(alert).toBeDefined();
    expect(alert!.severity).toBe("low");
    expect(alert!.message).toContain("1 item recorded as damaged");
  });

  it("pluralises damaged items message when more than one", () => {
    const possessions = [
      makePossession({ id: "p1", status: "damaged" }),
      makePossession({ id: "p2", status: "damaged" }),
    ];
    const result = identifyPossessionAlerts(possessions, [], 0);
    const alert = result.find((a) => a.type === "damaged_items");
    expect(alert).toBeDefined();
    expect(alert!.message).toContain("2 items recorded as damaged");
  });

  it("does not flag damaged items when none are damaged", () => {
    const possessions = [
      makePossession({ id: "p1", status: "with_child" }),
    ];
    const result = identifyPossessionAlerts(possessions, [], 0);
    const alert = result.find((a) => a.type === "damaged_items");
    expect(alert).toBeUndefined();
  });

  it("flags unsigned records with medium severity", () => {
    const possessions = [
      makePossession({ id: "p1", child_signed: false, staff_signed: true }),
    ];
    const result = identifyPossessionAlerts(possessions, [], 0);
    const alert = result.find((a) => a.type === "unsigned_records");
    expect(alert).toBeDefined();
    expect(alert!.severity).toBe("medium");
    expect(alert!.message).toContain("1 possession record missing signatures");
    expect(alert!.message).toContain("Reg 21");
  });

  it("counts records where either child or staff signature is missing", () => {
    const possessions = [
      makePossession({ id: "p1", child_signed: false, staff_signed: true }),
      makePossession({ id: "p2", child_signed: true, staff_signed: false }),
      makePossession({ id: "p3", child_signed: false, staff_signed: false }),
      makePossession({ id: "p4", child_signed: true, staff_signed: true }),
    ];
    const result = identifyPossessionAlerts(possessions, [], 0);
    const alert = result.find((a) => a.type === "unsigned_records");
    expect(alert).toBeDefined();
    expect(alert!.message).toContain("3 possession records missing signatures");
  });

  it("does not flag unsigned records when all are fully signed", () => {
    const possessions = [
      makePossession({ id: "p1", child_signed: true, staff_signed: true }),
      makePossession({ id: "p2", child_signed: true, staff_signed: true }),
    ];
    const result = identifyPossessionAlerts(possessions, [], 0);
    const alert = result.find((a) => a.type === "unsigned_records");
    expect(alert).toBeUndefined();
  });

  it("flags children without possession records with high severity", () => {
    const possessions = [
      makePossession({ id: "p1", child_id: "child-1" }),
    ];
    const result = identifyPossessionAlerts(possessions, [], 3);
    const alert = result.find((a) => a.type === "no_possession_record");
    expect(alert).toBeDefined();
    expect(alert!.severity).toBe("high");
    expect(alert!.message).toContain("2 of 3 children have no possession records");
    expect(alert!.message).toContain("Reg 21");
  });

  it("does not flag no_possession_record when all children have records", () => {
    const possessions = [
      makePossession({ id: "p1", child_id: "child-1" }),
      makePossession({ id: "p2", child_id: "child-2" }),
    ];
    const result = identifyPossessionAlerts(possessions, [], 2);
    const alert = result.find((a) => a.type === "no_possession_record");
    expect(alert).toBeUndefined();
  });

  it("does not flag no_possession_record when totalChildren is 0", () => {
    const result = identifyPossessionAlerts([], [], 0);
    const alert = result.find((a) => a.type === "no_possession_record");
    expect(alert).toBeUndefined();
  });

  it("flags high-value items without storage location", () => {
    const possessions = [
      makePossession({ id: "p1", estimated_value: 200, status: "with_child", stored_location: null }),
    ];
    const result = identifyPossessionAlerts(possessions, [], 0);
    const alert = result.find((a) => a.type === "high_value_unsecured");
    expect(alert).toBeDefined();
    expect(alert!.severity).toBe("medium");
    expect(alert!.message).toContain("1 high-value item");
    expect(alert!.message).toContain(">£100");
  });

  it("pluralises high-value unsecured message when more than one", () => {
    const possessions = [
      makePossession({ id: "p1", estimated_value: 200, status: "with_child", stored_location: null }),
      makePossession({ id: "p2", estimated_value: 500, status: "with_child", stored_location: null }),
    ];
    const result = identifyPossessionAlerts(possessions, [], 0);
    const alert = result.find((a) => a.type === "high_value_unsecured");
    expect(alert).toBeDefined();
    expect(alert!.message).toContain("2 high-value items");
  });

  it("does not flag high-value items that have a stored_location", () => {
    const possessions = [
      makePossession({ id: "p1", estimated_value: 200, status: "with_child", stored_location: "Bedroom drawer" }),
    ];
    const result = identifyPossessionAlerts(possessions, [], 0);
    const alert = result.find((a) => a.type === "high_value_unsecured");
    expect(alert).toBeUndefined();
  });

  it("does not flag high-value items in_safe status", () => {
    const possessions = [
      makePossession({ id: "p1", estimated_value: 200, status: "in_safe", stored_location: null }),
    ];
    const result = identifyPossessionAlerts(possessions, [], 0);
    const alert = result.find((a) => a.type === "high_value_unsecured");
    expect(alert).toBeUndefined();
  });

  it("does not flag items valued at exactly 100 (threshold is >100)", () => {
    const possessions = [
      makePossession({ id: "p1", estimated_value: 100, status: "with_child", stored_location: null }),
    ];
    const result = identifyPossessionAlerts(possessions, [], 0);
    const alert = result.find((a) => a.type === "high_value_unsecured");
    expect(alert).toBeUndefined();
  });

  it("does not flag items valued at 101 with a storage location", () => {
    const possessions = [
      makePossession({ id: "p1", estimated_value: 101, status: "with_child", stored_location: "Bedside table" }),
    ];
    const result = identifyPossessionAlerts(possessions, [], 0);
    const alert = result.find((a) => a.type === "high_value_unsecured");
    expect(alert).toBeUndefined();
  });

  it("can return multiple alert types simultaneously", () => {
    const possessions = [
      makePossession({ id: "p1", status: "lost", child_signed: false, staff_signed: false }),
      makePossession({ id: "p2", status: "damaged", child_signed: true, staff_signed: true }),
      makePossession({ id: "p3", estimated_value: 500, status: "with_child", stored_location: null, child_signed: true, staff_signed: true }),
    ];
    const result = identifyPossessionAlerts(possessions, [], 5);
    const types = result.map((a) => a.type);
    expect(types).toContain("lost_items");
    expect(types).toContain("damaged_items");
    expect(types).toContain("unsigned_records");
    expect(types).toContain("no_possession_record");
    expect(types).toContain("high_value_unsecured");
  });

  it("returns no alerts when everything is in order", () => {
    const possessions = [
      makePossession({ id: "p1", child_id: "child-1", status: "with_child", child_signed: true, staff_signed: true, estimated_value: 50 }),
      makePossession({ id: "p2", child_id: "child-2", status: "in_safe", child_signed: true, staff_signed: true, estimated_value: 200, stored_location: "Safe" }),
    ];
    const result = identifyPossessionAlerts(possessions, [], 2);
    expect(result).toEqual([]);
  });
});

// ── Constants ─────────────────────────────────────────────────────────────

describe("POSSESSION_CATEGORIES", () => {
  it("has exactly 12 entries", () => {
    expect(POSSESSION_CATEGORIES).toHaveLength(12);
  });

  it("each entry has category and label strings", () => {
    for (const entry of POSSESSION_CATEGORIES) {
      expect(typeof entry.category).toBe("string");
      expect(typeof entry.label).toBe("string");
    }
  });

  it("includes clothing and electronics categories", () => {
    const categories = POSSESSION_CATEGORIES.map((c) => c.category);
    expect(categories).toContain("clothing");
    expect(categories).toContain("electronics");
  });

  it("includes jewellery and documents categories", () => {
    const categories = POSSESSION_CATEGORIES.map((c) => c.category);
    expect(categories).toContain("jewellery");
    expect(categories).toContain("documents");
  });

  it("includes sentimental and money categories", () => {
    const categories = POSSESSION_CATEGORIES.map((c) => c.category);
    expect(categories).toContain("sentimental");
    expect(categories).toContain("money");
  });

  it("has correct label for electronics", () => {
    const electronics = POSSESSION_CATEGORIES.find((c) => c.category === "electronics");
    expect(electronics!.label).toBe("Electronics & Devices");
  });

  it("has correct label for other", () => {
    const other = POSSESSION_CATEGORIES.find((c) => c.category === "other");
    expect(other!.label).toBe("Other Items");
  });
});

describe("POSSESSION_STATUS", () => {
  it("has exactly 6 entries", () => {
    expect(POSSESSION_STATUS).toHaveLength(6);
  });

  it("each entry has status and label strings", () => {
    for (const entry of POSSESSION_STATUS) {
      expect(typeof entry.status).toBe("string");
      expect(typeof entry.label).toBe("string");
    }
  });

  it("includes with_child and in_safe statuses", () => {
    const statuses = POSSESSION_STATUS.map((s) => s.status);
    expect(statuses).toContain("with_child");
    expect(statuses).toContain("in_safe");
  });

  it("includes returned, lost, damaged, and disposed statuses", () => {
    const statuses = POSSESSION_STATUS.map((s) => s.status);
    expect(statuses).toContain("returned");
    expect(statuses).toContain("lost");
    expect(statuses).toContain("damaged");
    expect(statuses).toContain("disposed");
  });

  it("has correct label for with_child", () => {
    const withChild = POSSESSION_STATUS.find((s) => s.status === "with_child");
    expect(withChild!.label).toBe("With Child");
  });

  it("has correct label for in_safe", () => {
    const inSafe = POSSESSION_STATUS.find((s) => s.status === "in_safe");
    expect(inSafe!.label).toBe("Stored in Safe");
  });
});

describe("CONDITION_OPTIONS", () => {
  it("has exactly 6 entries", () => {
    expect(CONDITION_OPTIONS).toHaveLength(6);
  });

  it("each entry is a string", () => {
    for (const option of CONDITION_OPTIONS) {
      expect(typeof option).toBe("string");
    }
  });

  it("includes new and excellent conditions", () => {
    expect(CONDITION_OPTIONS).toContain("new");
    expect(CONDITION_OPTIONS).toContain("excellent");
  });

  it("includes good, fair, poor, and damaged conditions", () => {
    expect(CONDITION_OPTIONS).toContain("good");
    expect(CONDITION_OPTIONS).toContain("fair");
    expect(CONDITION_OPTIONS).toContain("poor");
    expect(CONDITION_OPTIONS).toContain("damaged");
  });

  it("starts with new and ends with damaged", () => {
    expect(CONDITION_OPTIONS[0]).toBe("new");
    expect(CONDITION_OPTIONS[CONDITION_OPTIONS.length - 1]).toBe("damaged");
  });
});
