// ══════════════════════════════════════════════════════════════════════════════
// CARA — FINANCIAL MANAGEMENT SERVICE TESTS
// Pure-function unit tests for child financial summary computation, home
// financial overview aggregation, financial alert identification, and constant
// validation (CHR 2015 Reg 39 — financial arrangements).
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { _testing } from "../finance-service";
import {
  ALLOWANCE_TYPES,
  TRANSACTION_CATEGORIES,
  TRANSACTION_TYPES,
} from "../finance-service";

import type {
  ChildAllowance,
  FinancialTransaction,
  SavingsAccount,
} from "../finance-service";

const {
  computeChildFinancialSummary,
  computeHomeFinancialOverview,
  identifyFinancialAlerts,
} = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

/** Return an ISO date string for a day in the current month. */
function thisMonth(day: number): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Return an ISO date string for a day in the previous month. */
function lastMonth(day: number): string {
  const now = new Date();
  const date = new Date(now.getFullYear(), now.getMonth() - 1, day);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Build a minimal FinancialTransaction with sensible defaults. */
function makeTransaction(
  overrides: Partial<FinancialTransaction> = {},
): FinancialTransaction {
  return {
    id: "id" in overrides ? overrides.id! : "tx-1",
    home_id: "home_id" in overrides ? overrides.home_id! : "home-1",
    child_id: "child_id" in overrides ? overrides.child_id! : "child-1",
    child_name: "child_name" in overrides ? overrides.child_name! : "Alice",
    transaction_type: "transaction_type" in overrides ? overrides.transaction_type! : "debit",
    category: "category" in overrides ? overrides.category! : "pocket_money",
    amount: "amount" in overrides ? overrides.amount! : 10,
    description: "description" in overrides ? overrides.description! : "Test transaction",
    date: "date" in overrides ? overrides.date! : thisMonth(1),
    recorded_by: "recorded_by" in overrides ? overrides.recorded_by! : "staff-1",
    receipt_reference: "receipt_reference" in overrides ? overrides.receipt_reference! : null,
    child_consulted: "child_consulted" in overrides ? overrides.child_consulted! : true,
    created_at: "created_at" in overrides ? overrides.created_at! : "2026-01-01T00:00:00Z",
  };
}

/** Build a minimal ChildAllowance with sensible defaults. */
function makeAllowance(
  overrides: Partial<ChildAllowance> = {},
): ChildAllowance {
  return {
    id: "id" in overrides ? overrides.id! : "allow-1",
    home_id: "home_id" in overrides ? overrides.home_id! : "home-1",
    child_id: "child_id" in overrides ? overrides.child_id! : "child-1",
    child_name: "child_name" in overrides ? overrides.child_name! : "Alice",
    allowance_type: "allowance_type" in overrides ? overrides.allowance_type! : "pocket_money",
    amount: "amount" in overrides ? overrides.amount! : 5,
    frequency: "frequency" in overrides ? overrides.frequency! : "weekly",
    start_date: "start_date" in overrides ? overrides.start_date! : "2026-01-01",
    end_date: "end_date" in overrides ? overrides.end_date! : null,
    active: "active" in overrides ? overrides.active! : true,
    approved_by: "approved_by" in overrides ? overrides.approved_by! : "manager-1",
    created_at: "created_at" in overrides ? overrides.created_at! : "2026-01-01T00:00:00Z",
  };
}

/** Build a minimal SavingsAccount with sensible defaults. */
function makeSavingsAccount(
  overrides: Partial<SavingsAccount> = {},
): SavingsAccount {
  return {
    id: "id" in overrides ? overrides.id! : "sav-1",
    home_id: "home_id" in overrides ? overrides.home_id! : "home-1",
    child_id: "child_id" in overrides ? overrides.child_id! : "child-1",
    child_name: "child_name" in overrides ? overrides.child_name! : "Alice",
    account_reference: "account_reference" in overrides ? overrides.account_reference! : null,
    balance: "balance" in overrides ? overrides.balance! : 100,
    last_updated: "last_updated" in overrides ? overrides.last_updated! : "2026-01-01T00:00:00Z",
    created_at: "created_at" in overrides ? overrides.created_at! : "2026-01-01T00:00:00Z",
  };
}

// ── computeChildFinancialSummary ───────────────────────────────────────────

describe("computeChildFinancialSummary", () => {
  it("returns zeroed stats for empty transactions", () => {
    const result = computeChildFinancialSummary([], [], null, "child-1");
    expect(result.total_credits).toBe(0);
    expect(result.total_debits).toBe(0);
    expect(result.balance).toBe(0);
    expect(result.savings_balance).toBe(0);
    expect(result.by_category).toEqual({});
    expect(result.active_allowances).toEqual([]);
    expect(result.child_consultation_rate).toBeNull();;
    expect(result.monthly_spending).toBe(0);
  });

  it("sums credits correctly", () => {
    const txs = [
      makeTransaction({ id: "t1", transaction_type: "credit", amount: 50 }),
      makeTransaction({ id: "t2", transaction_type: "credit", amount: 25 }),
    ];
    const result = computeChildFinancialSummary(txs, [], null, "child-1");
    expect(result.total_credits).toBe(75);
    expect(result.total_debits).toBe(0);
    expect(result.balance).toBe(75);
  });

  it("sums debits and computes balance correctly", () => {
    const txs = [
      makeTransaction({ id: "t1", transaction_type: "credit", amount: 100 }),
      makeTransaction({ id: "t2", transaction_type: "debit", amount: 30, category: "clothing" }),
      makeTransaction({ id: "t3", transaction_type: "debit", amount: 20, category: "food_treats" }),
    ];
    const result = computeChildFinancialSummary(txs, [], null, "child-1");
    expect(result.total_credits).toBe(100);
    expect(result.total_debits).toBe(50);
    expect(result.balance).toBe(50);
  });

  it("produces correct by_category breakdown for debits only", () => {
    const txs = [
      makeTransaction({ id: "t1", transaction_type: "debit", amount: 10, category: "clothing" }),
      makeTransaction({ id: "t2", transaction_type: "debit", amount: 15, category: "clothing" }),
      makeTransaction({ id: "t3", transaction_type: "debit", amount: 8, category: "transport" }),
      makeTransaction({ id: "t4", transaction_type: "credit", amount: 50, category: "pocket_money" }),
    ];
    const result = computeChildFinancialSummary(txs, [], null, "child-1");
    expect(result.by_category).toEqual({ clothing: 25, transport: 8 });
  });

  it("filters transactions by child_id", () => {
    const txs = [
      makeTransaction({ id: "t1", child_id: "child-1", transaction_type: "credit", amount: 100 }),
      makeTransaction({ id: "t2", child_id: "child-2", transaction_type: "credit", amount: 200 }),
      makeTransaction({ id: "t3", child_id: "child-1", transaction_type: "debit", amount: 30 }),
    ];
    const result = computeChildFinancialSummary(txs, [], null, "child-1");
    expect(result.total_credits).toBe(100);
    expect(result.total_debits).toBe(30);
    expect(result.balance).toBe(70);
  });

  it("returns savings_balance from savings account", () => {
    const savings = makeSavingsAccount({ balance: 250 });
    const result = computeChildFinancialSummary([], [], savings, "child-1");
    expect(result.savings_balance).toBe(250);
  });

  it("returns savings_balance of 0 when savings is null", () => {
    const result = computeChildFinancialSummary([], [], null, "child-1");
    expect(result.savings_balance).toBe(0);
  });

  it("filters active allowances for the target child only", () => {
    const allowances = [
      makeAllowance({ id: "a1", child_id: "child-1", active: true }),
      makeAllowance({ id: "a2", child_id: "child-1", active: false }),
      makeAllowance({ id: "a3", child_id: "child-2", active: true }),
    ];
    const result = computeChildFinancialSummary([], allowances, null, "child-1");
    expect(result.active_allowances).toHaveLength(1);
    expect(result.active_allowances[0].id).toBe("a1");
  });

  it("computes child_consultation_rate correctly", () => {
    const txs = [
      makeTransaction({ id: "t1", transaction_type: "debit", child_consulted: true }),
      makeTransaction({ id: "t2", transaction_type: "debit", child_consulted: true }),
      makeTransaction({ id: "t3", transaction_type: "debit", child_consulted: false }),
    ];
    const result = computeChildFinancialSummary(txs, [], null, "child-1");
    // 2/3 = 66.66... → rounded to 1 decimal = 66.7
    expect(result.child_consultation_rate).toBe(66.7);
  });

  it("returns 0 consultation rate when no debits exist", () => {
    const txs = [
      makeTransaction({ id: "t1", transaction_type: "credit", amount: 50 }),
    ];
    const result = computeChildFinancialSummary(txs, [], null, "child-1");
    expect(result.child_consultation_rate).toBeNull();;
  });

  it("computes monthly_spending only for current month debits", () => {
    const txs = [
      makeTransaction({ id: "t1", transaction_type: "debit", amount: 15, date: thisMonth(1) }),
      makeTransaction({ id: "t2", transaction_type: "debit", amount: 25, date: thisMonth(5) }),
      makeTransaction({ id: "t3", transaction_type: "debit", amount: 50, date: lastMonth(10) }),
      makeTransaction({ id: "t4", transaction_type: "credit", amount: 100, date: thisMonth(1) }),
    ];
    const result = computeChildFinancialSummary(txs, [], null, "child-1");
    expect(result.monthly_spending).toBe(40);
  });

  it("returns 100 consultation rate when all debits consulted", () => {
    const txs = [
      makeTransaction({ id: "t1", transaction_type: "debit", child_consulted: true }),
      makeTransaction({ id: "t2", transaction_type: "debit", child_consulted: true }),
    ];
    const result = computeChildFinancialSummary(txs, [], null, "child-1");
    expect(result.child_consultation_rate).toBe(100);
  });

  it("handles negative balance correctly", () => {
    const txs = [
      makeTransaction({ id: "t1", transaction_type: "credit", amount: 10 }),
      makeTransaction({ id: "t2", transaction_type: "debit", amount: 30 }),
    ];
    const result = computeChildFinancialSummary(txs, [], null, "child-1");
    expect(result.balance).toBe(-20);
  });
});

// ── computeHomeFinancialOverview ───────────────────────────────────────────

describe("computeHomeFinancialOverview", () => {
  it("returns zeroed stats for empty data", () => {
    const result = computeHomeFinancialOverview([], [], []);
    expect(result.total_children).toBe(0);
    expect(result.total_allowances_monthly).toBe(0);
    expect(result.total_savings).toBe(0);
    expect(result.total_spending_this_month).toBe(0);
    expect(result.by_child).toEqual({});
    expect(result.consultation_rate).toBeNull();;
    expect(result.receipt_compliance_rate).toBeNull();;
  });

  it("counts unique children from transactions", () => {
    const txs = [
      makeTransaction({ id: "t1", child_id: "child-1" }),
      makeTransaction({ id: "t2", child_id: "child-1" }),
      makeTransaction({ id: "t3", child_id: "child-2", child_name: "Bob" }),
    ];
    const result = computeHomeFinancialOverview(txs, [], []);
    expect(result.total_children).toBe(2);
  });

  it("converts weekly allowances to monthly cost (×4.33)", () => {
    const allowances = [
      makeAllowance({ amount: 10, frequency: "weekly", active: true }),
    ];
    const result = computeHomeFinancialOverview([], allowances, []);
    expect(result.total_allowances_monthly).toBe(43.3);
  });

  it("keeps monthly allowances at their amount", () => {
    const allowances = [
      makeAllowance({ amount: 50, frequency: "monthly", active: true }),
    ];
    const result = computeHomeFinancialOverview([], allowances, []);
    expect(result.total_allowances_monthly).toBe(50);
  });

  it("converts annual allowances to monthly cost (/12)", () => {
    const allowances = [
      makeAllowance({ amount: 120, frequency: "annual", active: true }),
    ];
    const result = computeHomeFinancialOverview([], allowances, []);
    expect(result.total_allowances_monthly).toBe(10);
  });

  it("excludes as_needed allowances from monthly cost", () => {
    const allowances = [
      makeAllowance({ amount: 100, frequency: "as_needed", active: true }),
    ];
    const result = computeHomeFinancialOverview([], allowances, []);
    expect(result.total_allowances_monthly).toBe(0);
  });

  it("skips inactive allowances in monthly cost", () => {
    const allowances = [
      makeAllowance({ id: "a1", amount: 10, frequency: "weekly", active: true }),
      makeAllowance({ id: "a2", amount: 50, frequency: "monthly", active: false }),
    ];
    const result = computeHomeFinancialOverview([], allowances, []);
    expect(result.total_allowances_monthly).toBe(43.3);
  });

  it("sums total savings across all accounts", () => {
    const savings = [
      makeSavingsAccount({ id: "s1", child_id: "child-1", balance: 100 }),
      makeSavingsAccount({ id: "s2", child_id: "child-2", child_name: "Bob", balance: 200 }),
    ];
    const result = computeHomeFinancialOverview([], [], savings);
    expect(result.total_savings).toBe(300);
  });

  it("computes total_spending_this_month from current month debits only", () => {
    const txs = [
      makeTransaction({ id: "t1", transaction_type: "debit", amount: 20, date: thisMonth(1) }),
      makeTransaction({ id: "t2", transaction_type: "debit", amount: 30, date: thisMonth(5) }),
      makeTransaction({ id: "t3", transaction_type: "debit", amount: 100, date: lastMonth(10) }),
      makeTransaction({ id: "t4", transaction_type: "credit", amount: 50, date: thisMonth(1) }),
    ];
    const result = computeHomeFinancialOverview(txs, [], []);
    expect(result.total_spending_this_month).toBe(50);
  });

  it("builds by_child spending aggregation", () => {
    const txs = [
      makeTransaction({ id: "t1", child_id: "child-1", child_name: "Alice", transaction_type: "debit", amount: 10 }),
      makeTransaction({ id: "t2", child_id: "child-1", child_name: "Alice", transaction_type: "debit", amount: 20 }),
      makeTransaction({ id: "t3", child_id: "child-2", child_name: "Bob", transaction_type: "debit", amount: 15 }),
    ];
    const result = computeHomeFinancialOverview(txs, [], []);
    expect(result.by_child["child-1"].name).toBe("Alice");
    expect(result.by_child["child-1"].spending).toBe(30);
    expect(result.by_child["child-2"].name).toBe("Bob");
    expect(result.by_child["child-2"].spending).toBe(15);
  });

  it("adds savings to by_child even without transactions", () => {
    const savings = [
      makeSavingsAccount({ child_id: "child-3", child_name: "Charlie", balance: 75 }),
    ];
    const result = computeHomeFinancialOverview([], [], savings);
    expect(result.by_child["child-3"]).toEqual({ name: "Charlie", spending: 0, savings: 75 });
  });

  it("computes consultation_rate across all children", () => {
    const txs = [
      makeTransaction({ id: "t1", transaction_type: "debit", child_consulted: true }),
      makeTransaction({ id: "t2", transaction_type: "debit", child_consulted: true }),
      makeTransaction({ id: "t3", transaction_type: "debit", child_consulted: false }),
      makeTransaction({ id: "t4", transaction_type: "debit", child_consulted: false }),
    ];
    const result = computeHomeFinancialOverview(txs, [], []);
    expect(result.consultation_rate).toBe(50);
  });

  it("computes receipt_compliance_rate based on non-empty receipt_reference", () => {
    const txs = [
      makeTransaction({ id: "t1", transaction_type: "debit", receipt_reference: "REC-001" }),
      makeTransaction({ id: "t2", transaction_type: "debit", receipt_reference: "REC-002" }),
      makeTransaction({ id: "t3", transaction_type: "debit", receipt_reference: null }),
      makeTransaction({ id: "t4", transaction_type: "debit", receipt_reference: "  " }),
    ];
    const result = computeHomeFinancialOverview(txs, [], []);
    // 2 out of 4 have non-empty receipt = 50%
    expect(result.receipt_compliance_rate).toBe(50);
  });

  it("returns 0 rates when no debit transactions exist", () => {
    const txs = [
      makeTransaction({ id: "t1", transaction_type: "credit", amount: 100 }),
    ];
    const result = computeHomeFinancialOverview(txs, [], []);
    expect(result.consultation_rate).toBeNull();;
    expect(result.receipt_compliance_rate).toBeNull();;
  });
});

// ── identifyFinancialAlerts ────────────────────────────────────────────────

describe("identifyFinancialAlerts", () => {
  it("returns empty alerts for empty data", () => {
    const result = identifyFinancialAlerts([], [], []);
    expect(result).toEqual([]);
  });

  it("flags no_savings_account when child has transactions but no savings", () => {
    const txs = [makeTransaction({ child_id: "child-1", child_name: "Alice" })];
    const result = identifyFinancialAlerts(txs, [], []);
    const alert = result.find((a) => a.type === "no_savings_account");
    expect(alert).toBeDefined();
    expect(alert!.severity).toBe("high");
    expect(alert!.child_name).toBe("Alice");
  });

  it("does not flag no_savings_account when savings exists", () => {
    const txs = [makeTransaction({ child_id: "child-1" })];
    const savings = [makeSavingsAccount({ child_id: "child-1" })];
    const result = identifyFinancialAlerts(txs, [], savings);
    const alert = result.find((a) => a.type === "no_savings_account");
    expect(alert).toBeUndefined();
  });

  it("flags low_consultation_rate when below 70%", () => {
    const txs = [
      makeTransaction({ id: "t1", transaction_type: "debit", child_consulted: true }),
      makeTransaction({ id: "t2", transaction_type: "debit", child_consulted: false }),
      makeTransaction({ id: "t3", transaction_type: "debit", child_consulted: false }),
      makeTransaction({ id: "t4", transaction_type: "debit", child_consulted: false }),
    ];
    const savings = [makeSavingsAccount({ child_id: "child-1" })];
    const result = identifyFinancialAlerts(txs, [], savings);
    const alert = result.find((a) => a.type === "low_consultation_rate");
    expect(alert).toBeDefined();
    expect(alert!.severity).toBe("medium");
    expect(alert!.message).toContain("25%");
  });

  it("does not flag low_consultation_rate at exactly 70%", () => {
    // 7 consulted out of 10 = 70%
    const txs = Array.from({ length: 10 }, (_, i) =>
      makeTransaction({
        id: `t${i}`,
        transaction_type: "debit",
        child_consulted: i < 7,
      }),
    );
    const savings = [makeSavingsAccount({ child_id: "child-1" })];
    const result = identifyFinancialAlerts(txs, [], savings);
    const alert = result.find((a) => a.type === "low_consultation_rate");
    expect(alert).toBeUndefined();
  });

  it("flags no_pocket_money_allowance when child has no active pocket money", () => {
    const txs = [makeTransaction({ child_id: "child-1" })];
    const allowances = [
      makeAllowance({ child_id: "child-1", allowance_type: "clothing", active: true }),
    ];
    const savings = [makeSavingsAccount({ child_id: "child-1" })];
    const result = identifyFinancialAlerts(txs, allowances, savings);
    const alert = result.find((a) => a.type === "no_pocket_money_allowance");
    expect(alert).toBeDefined();
    expect(alert!.severity).toBe("medium");
  });

  it("does not flag no_pocket_money_allowance when active pocket money exists", () => {
    const txs = [makeTransaction({ child_id: "child-1" })];
    const allowances = [
      makeAllowance({ child_id: "child-1", allowance_type: "pocket_money", active: true }),
    ];
    const savings = [makeSavingsAccount({ child_id: "child-1" })];
    const result = identifyFinancialAlerts(txs, allowances, savings);
    const alert = result.find((a) => a.type === "no_pocket_money_allowance");
    expect(alert).toBeUndefined();
  });

  it("does not flag pocket money when allowance exists but is inactive", () => {
    const txs = [makeTransaction({ child_id: "child-1" })];
    const allowances = [
      makeAllowance({ child_id: "child-1", allowance_type: "pocket_money", active: false }),
    ];
    const savings = [makeSavingsAccount({ child_id: "child-1" })];
    const result = identifyFinancialAlerts(txs, allowances, savings);
    const alert = result.find((a) => a.type === "no_pocket_money_allowance");
    expect(alert).toBeDefined();
  });

  it("flags high_spending when a child spends more than 2x the average this month", () => {
    // child-1 spends 100, child-2 spends 20 → average 60, 2x = 120 → child-1 (100) is NOT flagged
    // Adjust: child-1 spends 200, child-2 spends 20 → average 110, 2x = 220 → still no
    // child-1 spends 300, child-2 spends 10 → average 155, 2x = 310 → no
    // child-1 = 50, child-2 = 10 → average = 30, 2x = 60 → 50 < 60 → no
    // child-1 = 100, child-2 = 10 → average = 55, 2x = 110 → 100 < 110 → no
    // child-1 = 150, child-2 = 10 → average = 80, 2x = 160 → 150 < 160 → no
    // Need child monthly > 2 * (sum / count)
    // child-1 = 200, child-2 = 10 → average = 105, 2x = 210 → 200 < 210 → no
    // child-1 = 300, child-2 = 10 → average = 155, 2x = 310 → 300 < 310 → no
    // With 3 children: child-1 = 100, child-2 = 10, child-3 = 10 → avg = 40, 2x = 80 → 100 > 80 → yes
    const txs = [
      makeTransaction({ id: "t1", child_id: "child-1", child_name: "Alice", transaction_type: "debit", amount: 100, date: thisMonth(1) }),
      makeTransaction({ id: "t2", child_id: "child-2", child_name: "Bob", transaction_type: "debit", amount: 10, date: thisMonth(2) }),
      makeTransaction({ id: "t3", child_id: "child-3", child_name: "Charlie", transaction_type: "debit", amount: 10, date: thisMonth(3) }),
    ];
    const savings = [
      makeSavingsAccount({ id: "s1", child_id: "child-1" }),
      makeSavingsAccount({ id: "s2", child_id: "child-2", child_name: "Bob" }),
      makeSavingsAccount({ id: "s3", child_id: "child-3", child_name: "Charlie" }),
    ];
    const allowances = [
      makeAllowance({ id: "a1", child_id: "child-1" }),
      makeAllowance({ id: "a2", child_id: "child-2", child_name: "Bob" }),
      makeAllowance({ id: "a3", child_id: "child-3", child_name: "Charlie" }),
    ];
    const result = identifyFinancialAlerts(txs, allowances, savings);
    const alert = result.find((a) => a.type === "high_spending");
    expect(alert).toBeDefined();
    expect(alert!.severity).toBe("medium");
    expect(alert!.child_name).toBe("Alice");
  });

  it("does not flag high_spending when spending is within 2x average", () => {
    const txs = [
      makeTransaction({ id: "t1", child_id: "child-1", child_name: "Alice", transaction_type: "debit", amount: 20, date: thisMonth(1) }),
      makeTransaction({ id: "t2", child_id: "child-2", child_name: "Bob", transaction_type: "debit", amount: 20, date: thisMonth(2) }),
    ];
    const savings = [
      makeSavingsAccount({ id: "s1", child_id: "child-1" }),
      makeSavingsAccount({ id: "s2", child_id: "child-2", child_name: "Bob" }),
    ];
    const allowances = [
      makeAllowance({ id: "a1", child_id: "child-1" }),
      makeAllowance({ id: "a2", child_id: "child-2", child_name: "Bob" }),
    ];
    const result = identifyFinancialAlerts(txs, allowances, savings);
    const alert = result.find((a) => a.type === "high_spending");
    expect(alert).toBeUndefined();
  });

  it("flags low_receipt_compliance when below 80%", () => {
    // 1 out of 5 = 20%
    const txs = [
      makeTransaction({ id: "t1", transaction_type: "debit", receipt_reference: "REC-001" }),
      makeTransaction({ id: "t2", transaction_type: "debit", receipt_reference: null }),
      makeTransaction({ id: "t3", transaction_type: "debit", receipt_reference: null }),
      makeTransaction({ id: "t4", transaction_type: "debit", receipt_reference: null }),
      makeTransaction({ id: "t5", transaction_type: "debit", receipt_reference: null }),
    ];
    const savings = [makeSavingsAccount({ child_id: "child-1" })];
    const result = identifyFinancialAlerts(txs, [], savings);
    const alert = result.find((a) => a.type === "low_receipt_compliance");
    expect(alert).toBeDefined();
    expect(alert!.severity).toBe("medium");
    expect(alert!.message).toContain("20%");
  });

  it("does not flag low_receipt_compliance at 80% or above", () => {
    // 4 out of 5 = 80%
    const txs = [
      makeTransaction({ id: "t1", transaction_type: "debit", receipt_reference: "R1" }),
      makeTransaction({ id: "t2", transaction_type: "debit", receipt_reference: "R2" }),
      makeTransaction({ id: "t3", transaction_type: "debit", receipt_reference: "R3" }),
      makeTransaction({ id: "t4", transaction_type: "debit", receipt_reference: "R4" }),
      makeTransaction({ id: "t5", transaction_type: "debit", receipt_reference: null }),
    ];
    const savings = [makeSavingsAccount({ child_id: "child-1" })];
    const result = identifyFinancialAlerts(txs, [], savings);
    const alert = result.find((a) => a.type === "low_receipt_compliance");
    expect(alert).toBeUndefined();
  });

  it("flags inactive_allowance when end_date is past but still active", () => {
    const allowances = [
      makeAllowance({
        child_id: "child-1",
        child_name: "Alice",
        allowance_type: "clothing",
        active: true,
        end_date: "2024-01-01",
      }),
    ];
    const result = identifyFinancialAlerts([], allowances, []);
    const alert = result.find((a) => a.type === "inactive_allowance");
    expect(alert).toBeDefined();
    expect(alert!.severity).toBe("low");
    expect(alert!.message).toContain("Alice");
    expect(alert!.message).toContain("clothing");
  });

  it("does not flag inactive_allowance when end_date is in the future", () => {
    const allowances = [
      makeAllowance({
        child_id: "child-1",
        active: true,
        end_date: "2099-12-31",
      }),
    ];
    const result = identifyFinancialAlerts([], allowances, []);
    const alert = result.find((a) => a.type === "inactive_allowance");
    expect(alert).toBeUndefined();
  });

  it("does not flag inactive_allowance when end_date is null", () => {
    const allowances = [
      makeAllowance({ child_id: "child-1", active: true, end_date: null }),
    ];
    const result = identifyFinancialAlerts([], allowances, []);
    const alert = result.find((a) => a.type === "inactive_allowance");
    expect(alert).toBeUndefined();
  });
});

// ── Constants ───────────────────────────────────────────────────────────

describe("ALLOWANCE_TYPES", () => {
  it("has exactly 8 entries", () => {
    expect(ALLOWANCE_TYPES).toHaveLength(8);
  });

  it("each entry has type, label, and frequency strings", () => {
    for (const entry of ALLOWANCE_TYPES) {
      expect(typeof entry.type).toBe("string");
      expect(typeof entry.label).toBe("string");
      expect(typeof entry.frequency).toBe("string");
    }
  });

  it("includes pocket_money and clothing types", () => {
    const types = ALLOWANCE_TYPES.map((a) => a.type);
    expect(types).toContain("pocket_money");
    expect(types).toContain("clothing");
  });

  it("includes birthday and christmas types", () => {
    const types = ALLOWANCE_TYPES.map((a) => a.type);
    expect(types).toContain("birthday");
    expect(types).toContain("christmas");
  });

  it("has correct frequency for pocket_money (weekly) and savings (monthly)", () => {
    const pocketMoney = ALLOWANCE_TYPES.find((a) => a.type === "pocket_money");
    const savings = ALLOWANCE_TYPES.find((a) => a.type === "savings");
    expect(pocketMoney!.frequency).toBe("weekly");
    expect(savings!.frequency).toBe("monthly");
  });

  it("has correct label for holiday type", () => {
    const holiday = ALLOWANCE_TYPES.find((a) => a.type === "holiday");
    expect(holiday!.label).toBe("Holiday Spending");
    expect(holiday!.frequency).toBe("as_needed");
  });
});

describe("TRANSACTION_CATEGORIES", () => {
  it("has exactly 14 entries", () => {
    expect(TRANSACTION_CATEGORIES).toHaveLength(14);
  });

  it("each entry is a string", () => {
    for (const cat of TRANSACTION_CATEGORIES) {
      expect(typeof cat).toBe("string");
    }
  });

  it("includes pocket_money and clothing categories", () => {
    expect(TRANSACTION_CATEGORIES).toContain("pocket_money");
    expect(TRANSACTION_CATEGORIES).toContain("clothing");
  });

  it("includes savings_deposit and savings_withdrawal categories", () => {
    expect(TRANSACTION_CATEGORIES).toContain("savings_deposit");
    expect(TRANSACTION_CATEGORIES).toContain("savings_withdrawal");
  });
});

describe("TRANSACTION_TYPES", () => {
  it("has exactly 2 entries", () => {
    expect(TRANSACTION_TYPES).toHaveLength(2);
  });

  it("each entry is a string", () => {
    for (const t of TRANSACTION_TYPES) {
      expect(typeof t).toBe("string");
    }
  });

  it("includes credit and debit", () => {
    expect(TRANSACTION_TYPES).toContain("credit");
    expect(TRANSACTION_TYPES).toContain("debit");
  });
});
