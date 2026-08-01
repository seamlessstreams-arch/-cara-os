import { describe, it, expect } from "vitest";
import {
  computeChildFinancialSummary,
  computeHomeFinancialOverview,
  identifyFinancialAlerts,
  type FinancialTransaction,
  type ChildAllowance,
  type SavingsAccount,
} from "./finance-service";

// ── Factories ───────────────────────────────────────────────────────────

function makeTransaction(overrides: Partial<FinancialTransaction> = {}): FinancialTransaction {
  return {
    id: "tx-1",
    home_id: "home-1",
    child_id: "child-1",
    child_name: "Alex",
    transaction_type: "debit",
    category: "pocket_money",
    amount: 10,
    description: "Weekly pocket money",
    date: "2026-05-21",
    recorded_by: "Staff A",
    receipt_reference: "REC-001",
    child_consulted: true,
    created_at: "2026-05-21T10:00:00Z",
    ...overrides,
  };
}

function makeAllowance(overrides: Partial<ChildAllowance> = {}): ChildAllowance {
  return {
    id: "allow-1",
    home_id: "home-1",
    child_id: "child-1",
    child_name: "Alex",
    allowance_type: "pocket_money",
    amount: 10,
    frequency: "weekly",
    start_date: "2026-01-01",
    end_date: null,
    active: true,
    approved_by: "Manager",
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function makeSavings(overrides: Partial<SavingsAccount> = {}): SavingsAccount {
  return {
    id: "sav-1",
    home_id: "home-1",
    child_id: "child-1",
    child_name: "Alex",
    account_reference: "ACC-001",
    balance: 100,
    last_updated: "2026-05-01T00:00:00Z",
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

// ── computeChildFinancialSummary ────────────────────────────────────────

describe("computeChildFinancialSummary", () => {
  it("returns zeroes for empty data", () => {
    const result = computeChildFinancialSummary([], [], null, "child-1");
    expect(result.total_credits).toBe(0);
    expect(result.total_debits).toBe(0);
    expect(result.balance).toBe(0);
    expect(result.savings_balance).toBe(0);
    expect(result.active_allowances).toEqual([]);
    expect(result.child_consultation_rate).toBeNull();;
    expect(result.monthly_spending).toBe(0);
    expect(Object.keys(result.by_category)).toHaveLength(0);
  });

  it("computes credits, debits, balance, and category breakdown", () => {
    const txs: FinancialTransaction[] = [
      makeTransaction({ id: "tx-1", transaction_type: "credit", amount: 50, category: "pocket_money" }),
      makeTransaction({ id: "tx-2", transaction_type: "debit", amount: 15, category: "clothing", child_consulted: true }),
      makeTransaction({ id: "tx-3", transaction_type: "debit", amount: 5, category: "food_treats", child_consulted: false }),
    ];
    const savings = makeSavings({ balance: 200 });
    const allowances = [makeAllowance()];
    const result = computeChildFinancialSummary(txs, allowances, savings, "child-1");

    expect(result.total_credits).toBe(50);
    expect(result.total_debits).toBe(20);
    expect(result.balance).toBe(30);
    expect(result.savings_balance).toBe(200);
    expect(result.by_category).toEqual({ clothing: 15, food_treats: 5 });
    expect(result.active_allowances).toHaveLength(1);
    // 1 consulted out of 2 debits = 50%
    expect(result.child_consultation_rate).toBe(50);
  });

  it("filters transactions by child_id", () => {
    const txs: FinancialTransaction[] = [
      makeTransaction({ id: "tx-1", child_id: "child-1", transaction_type: "credit", amount: 100 }),
      makeTransaction({ id: "tx-2", child_id: "child-2", transaction_type: "credit", amount: 999 }),
    ];
    const result = computeChildFinancialSummary(txs, [], null, "child-1");
    expect(result.total_credits).toBe(100);
  });
});

// ── computeHomeFinancialOverview ────────────────────────────────────────

describe("computeHomeFinancialOverview", () => {
  it("returns zeroes for empty data", () => {
    const result = computeHomeFinancialOverview([], [], []);
    expect(result.total_children).toBe(0);
    expect(result.total_allowances_monthly).toBe(0);
    expect(result.total_savings).toBe(0);
    expect(result.total_spending_this_month).toBe(0);
    expect(result.consultation_rate).toBeNull();;
    expect(result.receipt_compliance_rate).toBeNull();;
  });

  it("calculates monthly allowance cost across frequencies", () => {
    const allowances: ChildAllowance[] = [
      makeAllowance({ id: "a1", frequency: "weekly", amount: 10, active: true }),   // 10 * 4.33 = 43.30
      makeAllowance({ id: "a2", frequency: "monthly", amount: 50, active: true }),  // 50
      makeAllowance({ id: "a3", frequency: "annual", amount: 120, active: true }),  // 120 / 12 = 10
      makeAllowance({ id: "a4", frequency: "as_needed", amount: 30, active: true }), // 0 (excluded)
      makeAllowance({ id: "a5", frequency: "weekly", amount: 10, active: false }),  // inactive
    ];
    const result = computeHomeFinancialOverview([], allowances, []);
    // 43.30 + 50 + 10 = 103.30
    expect(result.total_allowances_monthly).toBe(103.3);
  });

  it("calculates consultation and receipt rates", () => {
    const txs: FinancialTransaction[] = [
      makeTransaction({ id: "tx-1", child_consulted: true, receipt_reference: "R1" }),
      makeTransaction({ id: "tx-2", child_consulted: false, receipt_reference: null }),
      makeTransaction({ id: "tx-3", child_consulted: true, receipt_reference: "R2" }),
      makeTransaction({ id: "tx-4", child_consulted: false, receipt_reference: "" }),
    ];
    const result = computeHomeFinancialOverview(txs, [], []);
    // 2/4 consulted = 50%
    expect(result.consultation_rate).toBe(50);
    // 2/4 have non-empty receipt = 50%
    expect(result.receipt_compliance_rate).toBe(50);
  });
});

// ── identifyFinancialAlerts ─────────────────────────────────────────────

describe("identifyFinancialAlerts", () => {
  it("returns empty alerts for empty data", () => {
    const alerts = identifyFinancialAlerts([], [], []);
    expect(alerts).toEqual([]);
  });

  it("triggers no_savings_account alert when child has transactions but no savings", () => {
    const txs = [makeTransaction({ child_id: "child-1", child_name: "Alex" })];
    const alerts = identifyFinancialAlerts(txs, [], []);
    const noSavings = alerts.find((a) => a.type === "no_savings_account");
    expect(noSavings).toBeDefined();
    expect(noSavings!.severity).toBe("high");
    expect(noSavings!.child_name).toBe("Alex");
  });

  it("triggers low_consultation_rate alert below 70%", () => {
    // 1 consulted out of 4 = 25% < 70%
    const txs: FinancialTransaction[] = [
      makeTransaction({ id: "tx-1", child_consulted: true }),
      makeTransaction({ id: "tx-2", child_consulted: false }),
      makeTransaction({ id: "tx-3", child_consulted: false }),
      makeTransaction({ id: "tx-4", child_consulted: false }),
    ];
    const savings = [makeSavings()];
    const allowances = [makeAllowance()];
    const alerts = identifyFinancialAlerts(txs, allowances, savings);
    const lowConsult = alerts.find((a) => a.type === "low_consultation_rate");
    expect(lowConsult).toBeDefined();
    expect(lowConsult!.severity).toBe("medium");
  });

  it("triggers no_pocket_money_allowance when child has no active pocket money", () => {
    const txs = [makeTransaction()];
    const savings = [makeSavings()];
    const allowances = [makeAllowance({ allowance_type: "clothing" })]; // not pocket_money
    const alerts = identifyFinancialAlerts(txs, allowances, savings);
    const noPocket = alerts.find((a) => a.type === "no_pocket_money_allowance");
    expect(noPocket).toBeDefined();
    expect(noPocket!.severity).toBe("medium");
  });

  it("triggers low_receipt_compliance alert below 80%", () => {
    // 1 receipt out of 4 debits = 25% < 80%
    const txs: FinancialTransaction[] = [
      makeTransaction({ id: "tx-1", receipt_reference: "R1" }),
      makeTransaction({ id: "tx-2", receipt_reference: null }),
      makeTransaction({ id: "tx-3", receipt_reference: null }),
      makeTransaction({ id: "tx-4", receipt_reference: "" }),
    ];
    const savings = [makeSavings()];
    const allowances = [makeAllowance()];
    const alerts = identifyFinancialAlerts(txs, allowances, savings);
    const lowReceipt = alerts.find((a) => a.type === "low_receipt_compliance");
    expect(lowReceipt).toBeDefined();
    expect(lowReceipt!.severity).toBe("medium");
  });

  it("triggers inactive_allowance when end_date is past but still active", () => {
    const allowances = [
      makeAllowance({ end_date: "2020-01-01", active: true }),
    ];
    const alerts = identifyFinancialAlerts([], allowances, []);
    const inactive = alerts.find((a) => a.type === "inactive_allowance");
    expect(inactive).toBeDefined();
    expect(inactive!.severity).toBe("low");
  });
});
