import { describe, it, expect } from "vitest";
import {
  computePocketMoneyMetrics,
  identifyPocketMoneyAlerts,
} from "./pocket-money-management-service";
import type { PocketMoneyManagementRecord } from "./pocket-money-management-service";

// -- Factory ------------------------------------------------------------------

function makeRecord(overrides: Partial<PocketMoneyManagementRecord> = {}): PocketMoneyManagementRecord {
  return {
    id: "pmm-1",
    home_id: "home-1",
    transaction_type: "weekly_allowance",
    spending_category: "other",
    approval_status: "approved",
    financial_literacy_level: "supported",
    transaction_date: "2026-05-01",
    child_name: "Alex",
    child_id: "child-1",
    recorded_by: "staff-1",
    receipt_obtained: true,
    child_chose_purchase: true,
    age_appropriate_spend: true,
    budget_discussed: true,
    savings_encouraged: true,
    value_for_money_discussed: true,
    financial_record_updated: true,
    balance_reconciled: true,
    social_worker_informed: true,
    parent_informed: true,
    care_plan_linked: true,
    recorded_promptly: true,
    issues_found: [],
    actions_taken: [],
    amount_pence: 500,
    running_balance_pence: 1500,
    next_review_date: null,
    notes: null,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

// -- computePocketMoneyMetrics ------------------------------------------------

describe("computePocketMoneyMetrics", () => {
  it("returns zeroes for empty records", () => {
    const m = computePocketMoneyMetrics([]);
    expect(m.total_transactions).toBe(0);
    expect(m.purchase_count).toBe(0);
    expect(m.savings_deposit_count).toBe(0);
    expect(m.declined_count).toBe(0);
    expect(m.retrospective_count).toBe(0);
    expect(m.receipt_obtained_rate).toBeNull();;
    expect(m.total_amount_pence).toBe(0);
    expect(m.unique_children).toBe(0);
  });

  it("counts transaction types and approval statuses correctly", () => {
    const records = [
      makeRecord({ id: "1", transaction_type: "purchase", approval_status: "declined" }),
      makeRecord({ id: "2", transaction_type: "savings_deposit", approval_status: "retrospective" }),
      makeRecord({ id: "3", transaction_type: "weekly_allowance", approval_status: "approved" }),
    ];
    const m = computePocketMoneyMetrics(records);
    expect(m.purchase_count).toBe(1);
    expect(m.savings_deposit_count).toBe(1);
    expect(m.declined_count).toBe(1);
    expect(m.retrospective_count).toBe(1);
  });

  it("computes boolean rates correctly", () => {
    const records = [
      makeRecord({ id: "1", receipt_obtained: true, budget_discussed: true }),
      makeRecord({ id: "2", receipt_obtained: false, budget_discussed: false }),
    ];
    const m = computePocketMoneyMetrics(records);
    expect(m.receipt_obtained_rate).toBe(50);
    expect(m.budget_discussed_rate).toBe(50);
  });

  it("computes total amount pence", () => {
    const records = [
      makeRecord({ id: "1", amount_pence: 500 }),
      makeRecord({ id: "2", amount_pence: 750 }),
    ];
    const m = computePocketMoneyMetrics(records);
    expect(m.total_amount_pence).toBe(1250);
  });

  it("counts unique children", () => {
    const records = [
      makeRecord({ id: "1", child_name: "Alex" }),
      makeRecord({ id: "2", child_name: "Alex" }),
      makeRecord({ id: "3", child_name: "Beth" }),
    ];
    const m = computePocketMoneyMetrics(records);
    expect(m.unique_children).toBe(2);
  });

  it("builds breakdown maps", () => {
    const records = [
      makeRecord({ id: "1", transaction_type: "purchase", spending_category: "clothing", approval_status: "approved", financial_literacy_level: "independent" }),
      makeRecord({ id: "2", transaction_type: "weekly_allowance", spending_category: "food_treats", approval_status: "pending", financial_literacy_level: "learning" }),
    ];
    const m = computePocketMoneyMetrics(records);
    expect(m.by_transaction_type).toEqual({ purchase: 1, weekly_allowance: 1 });
    expect(m.by_spending_category).toEqual({ clothing: 1, food_treats: 1 });
    expect(m.by_approval_status).toEqual({ approved: 1, pending: 1 });
    expect(m.by_financial_literacy_level).toEqual({ independent: 1, learning: 1 });
  });
});

// -- identifyPocketMoneyAlerts ------------------------------------------------

describe("identifyPocketMoneyAlerts", () => {
  it("returns no alerts for empty records", () => {
    expect(identifyPocketMoneyAlerts([])).toEqual([]);
  });

  it("returns no alerts for clean records", () => {
    expect(identifyPocketMoneyAlerts([makeRecord()])).toEqual([]);
  });

  it("fires retrospective_no_receipt critical per-record", () => {
    const records = [
      makeRecord({ approval_status: "retrospective", receipt_obtained: false }),
    ];
    const alerts = identifyPocketMoneyAlerts(records);
    expect(alerts.some((a) => a.type === "retrospective_no_receipt" && a.severity === "critical")).toBe(true);
  });

  it("fires balance_not_reconciled high alert when >= 1", () => {
    const records = [makeRecord({ balance_reconciled: false })];
    const alerts = identifyPocketMoneyAlerts(records);
    expect(alerts.some((a) => a.type === "balance_not_reconciled" && a.severity === "high")).toBe(true);
  });

  it("fires financial_record_not_updated high alert when >= 1", () => {
    const records = [makeRecord({ financial_record_updated: false })];
    const alerts = identifyPocketMoneyAlerts(records);
    expect(alerts.some((a) => a.type === "financial_record_not_updated" && a.severity === "high")).toBe(true);
  });

  it("fires budget_not_discussed medium alert only when >= 2", () => {
    const one = [makeRecord({ budget_discussed: false })];
    expect(identifyPocketMoneyAlerts(one).some((a) => a.type === "budget_not_discussed")).toBe(false);

    const two = [
      makeRecord({ id: "1", budget_discussed: false }),
      makeRecord({ id: "2", budget_discussed: false }),
    ];
    expect(identifyPocketMoneyAlerts(two).some((a) => a.type === "budget_not_discussed" && a.severity === "medium")).toBe(true);
  });

  it("fires receipts_missing medium alert only when >= 3", () => {
    const two = [
      makeRecord({ id: "1", receipt_obtained: false }),
      makeRecord({ id: "2", receipt_obtained: false }),
    ];
    expect(identifyPocketMoneyAlerts(two).some((a) => a.type === "receipts_missing")).toBe(false);

    const three = [
      makeRecord({ id: "1", receipt_obtained: false }),
      makeRecord({ id: "2", receipt_obtained: false }),
      makeRecord({ id: "3", receipt_obtained: false }),
    ];
    expect(identifyPocketMoneyAlerts(three).some((a) => a.type === "receipts_missing" && a.severity === "medium")).toBe(true);
  });

  it("does not fire retrospective_no_receipt when receipt is obtained", () => {
    const records = [makeRecord({ approval_status: "retrospective", receipt_obtained: true })];
    const alerts = identifyPocketMoneyAlerts(records);
    expect(alerts.some((a) => a.type === "retrospective_no_receipt")).toBe(false);
  });
});
