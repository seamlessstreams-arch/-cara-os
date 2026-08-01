import { describe, it, expect } from "vitest";
import {
  computeGiftMetrics,
  identifyGiftAlerts,
  type GiftRecord,
} from "./gifts-hospitality-service";

function makeRecord(overrides: Partial<GiftRecord> = {}): GiftRecord {
  return {
    id: "gift-1",
    home_id: "home-1",
    gift_date: "2026-05-21",
    direction: "received",
    source: "parent_carer",
    description: "Box of chocolates",
    estimated_value: 15,
    approval_status: "approved",
    declaration_status: "declared",
    staff_name: "Staff A",
    approved_by: "Manager",
    conflict_of_interest: false,
    child_involved: false,
    receipt_kept: true,
    policy_compliant: true,
    notes: null,
    created_at: "2026-05-21T10:00:00Z",
    updated_at: "2026-05-21T10:00:00Z",
    ...overrides,
  };
}

// ── computeGiftMetrics ──────────────────────────────────────────────────

describe("computeGiftMetrics", () => {
  it("returns zeroes for empty data", () => {
    const result = computeGiftMetrics([]);
    expect(result.total_records).toBe(0);
    expect(result.received_count).toBe(0);
    expect(result.given_count).toBe(0);
    expect(result.total_value).toBe(0);
    expect(result.average_value).toBeNull();;
    expect(result.approved_rate).toBeNull();;
    expect(result.declared_rate).toBeNull();;
    expect(result.receipt_kept_rate).toBeNull();;
    expect(result.policy_compliant_rate).toBeNull();;
  });

  it("computes counts and rates correctly", () => {
    const records = [
      makeRecord({ id: "g1", direction: "received", estimated_value: 20, declaration_status: "declared", approval_status: "approved", conflict_of_interest: true, child_involved: true, receipt_kept: true, policy_compliant: true }),
      makeRecord({ id: "g2", direction: "given", estimated_value: 30, declaration_status: "not_declared", approval_status: "pending", conflict_of_interest: false, child_involved: false, receipt_kept: false, policy_compliant: false }),
      makeRecord({ id: "g3", direction: "offered_declined", estimated_value: 10, declaration_status: "declared", approval_status: "approved", receipt_kept: true, policy_compliant: true }),
      makeRecord({ id: "g4", direction: "hospitality_received", estimated_value: 40, declaration_status: "late_declaration", approval_status: "declined", receipt_kept: false, policy_compliant: true }),
    ];
    const result = computeGiftMetrics(records);

    expect(result.total_records).toBe(4);
    expect(result.received_count).toBe(1);
    expect(result.given_count).toBe(1);
    expect(result.declined_count).toBe(1);
    expect(result.hospitality_count).toBe(1);
    expect(result.total_value).toBe(100);
    expect(result.average_value).toBe(25);
    // 2/4 approved = 50%
    expect(result.approved_rate).toBe(50);
    expect(result.pending_count).toBe(1);
    // 2/4 declared = 50%
    expect(result.declared_rate).toBe(50);
    expect(result.not_declared_count).toBe(1);
    expect(result.late_declaration_count).toBe(1);
    expect(result.conflict_of_interest_count).toBe(1);
    expect(result.child_involved_count).toBe(1);
    // 2/4 receipt = 50%
    expect(result.receipt_kept_rate).toBe(50);
    // 3/4 compliant = 75%
    expect(result.policy_compliant_rate).toBe(75);
  });
});

// ── identifyGiftAlerts ──────────────────────────────────────────────────

describe("identifyGiftAlerts", () => {
  it("returns empty alerts for empty data", () => {
    expect(identifyGiftAlerts([])).toEqual([]);
  });

  it("triggers conflict_of_interest critical alert", () => {
    const records = [makeRecord({ conflict_of_interest: true })];
    const alerts = identifyGiftAlerts(records);
    const conflict = alerts.find((a) => a.type === "conflict_of_interest");
    expect(conflict).toBeDefined();
    expect(conflict!.severity).toBe("critical");
  });

  it("triggers not_declared high alert when >= 1", () => {
    const records = [makeRecord({ declaration_status: "not_declared" })];
    const alerts = identifyGiftAlerts(records);
    const notDec = alerts.find((a) => a.type === "not_declared");
    expect(notDec).toBeDefined();
    expect(notDec!.severity).toBe("high");
  });

  it("triggers policy_non_compliant high alert when >= 1", () => {
    const records = [makeRecord({ policy_compliant: false })];
    const alerts = identifyGiftAlerts(records);
    const nonComp = alerts.find((a) => a.type === "policy_non_compliant");
    expect(nonComp).toBeDefined();
    expect(nonComp!.severity).toBe("high");
  });

  it("triggers pending_approval medium alert when >= 2", () => {
    const records = [
      makeRecord({ id: "g1", approval_status: "pending" }),
      makeRecord({ id: "g2", approval_status: "pending" }),
    ];
    const alerts = identifyGiftAlerts(records);
    const pending = alerts.find((a) => a.type === "pending_approval");
    expect(pending).toBeDefined();
    expect(pending!.severity).toBe("medium");
  });

  it("triggers high_value medium alert when estimated_value > 50", () => {
    const records = [makeRecord({ estimated_value: 51 })];
    const alerts = identifyGiftAlerts(records);
    const hv = alerts.find((a) => a.type === "high_value");
    expect(hv).toBeDefined();
    expect(hv!.severity).toBe("medium");
  });

  it("does NOT trigger high_value when value is exactly 50", () => {
    const records = [makeRecord({ estimated_value: 50 })];
    const alerts = identifyGiftAlerts(records);
    expect(alerts.find((a) => a.type === "high_value")).toBeUndefined();
  });

  it("does NOT trigger pending_approval when only 1 pending", () => {
    const records = [makeRecord({ approval_status: "pending" })];
    const alerts = identifyGiftAlerts(records);
    expect(alerts.find((a) => a.type === "pending_approval")).toBeUndefined();
  });
});
