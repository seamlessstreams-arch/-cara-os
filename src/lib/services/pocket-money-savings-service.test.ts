import { describe, it, expect } from "vitest";
import {
  computeMetrics,
  computeAlerts,
  validatePocketMoneySavings,
} from "./pocket-money-savings-service";
import type { PocketMoneySavingsRow } from "./pocket-money-savings-service";

// -- Factory ------------------------------------------------------------------

function makeRow(overrides: Partial<PocketMoneySavingsRow> = {}): PocketMoneySavingsRow {
  return {
    id: "pms-1",
    home_id: "home-1",
    child_name: "Alex",
    transaction_date: "2026-05-01",
    recorded_by: "staff-1",
    transaction_type: "Pocket Money — Weekly",
    amount: 10,
    currency: "GBP",
    balance_after: 50,
    savings_balance: 100,
    junior_isa_balance: 200,
    receipt_kept: true,
    child_choice: true,
    budgeting_discussion: true,
    age_appropriate: true,
    parental_consent: null,
    social_worker_aware: null,
    notes: null,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

// -- computeMetrics -----------------------------------------------------------

describe("computeMetrics", () => {
  it("returns zeroes for empty rows", () => {
    const m = computeMetrics([]);
    expect(m.total_transactions).toBe(0);
    expect(m.total_income).toBe(0);
    expect(m.total_spending).toBe(0);
    expect(m.total_savings_deposits).toBe(0);
    expect(m.total_savings_withdrawals).toBe(0);
    expect(m.net_savings).toBe(0);
    expect(m.average_pocket_money).toBeNull(); // fab-0.
    expect(m.savings_rate).toBeNull(); // fab-0.
    expect(m.child_choice_rate).toBeNull(); // fab-0.
    expect(m.receipt_rate).toBeNull(); // fab-0.
    expect(m.unique_children).toBe(0);
  });

  it("computes income and spending totals", () => {
    const rows = [
      makeRow({ id: "1", transaction_type: "Pocket Money — Weekly", amount: 10 }),
      makeRow({ id: "2", transaction_type: "Birthday Money", amount: 25 }),
      makeRow({ id: "3", transaction_type: "Holiday Spending", amount: 15 }),
      makeRow({ id: "4", transaction_type: "Other", amount: 5 }),
    ];
    const m = computeMetrics(rows);
    expect(m.total_income).toBe(35); // 10 + 25 (income types)
    expect(m.total_spending).toBe(20); // 15 + 5 (Holiday Spending + Other)
  });

  it("computes savings deposits, withdrawals, and net savings", () => {
    const rows = [
      makeRow({ id: "1", transaction_type: "Savings Deposit", amount: 50 }),
      makeRow({ id: "2", transaction_type: "Junior ISA Contribution", amount: 30 }),
      makeRow({ id: "3", transaction_type: "Savings Withdrawal", amount: 20 }),
    ];
    const m = computeMetrics(rows);
    expect(m.total_savings_deposits).toBe(80); // 50 + 30
    expect(m.total_savings_withdrawals).toBe(20);
    expect(m.net_savings).toBe(60); // 80 - 20
    expect(m.junior_isa_total).toBe(30);
  });

  it("computes average pocket money", () => {
    const rows = [
      makeRow({ id: "1", transaction_type: "Pocket Money — Weekly", amount: 10 }),
      makeRow({ id: "2", transaction_type: "Pocket Money — Monthly", amount: 30 }),
    ];
    const m = computeMetrics(rows);
    expect(m.average_pocket_money).toBe(20); // (10 + 30) / 2
  });

  it("computes savings rate as percentage of income", () => {
    const rows = [
      makeRow({ id: "1", transaction_type: "Pocket Money — Weekly", amount: 100 }),
      makeRow({ id: "2", transaction_type: "Savings Deposit", amount: 25 }),
    ];
    const m = computeMetrics(rows);
    expect(m.savings_rate).toBe(25); // 25/100 * 100
  });

  it("computes boolean rates", () => {
    const rows = [
      makeRow({ id: "1", child_choice: true, receipt_kept: true, budgeting_discussion: true }),
      makeRow({ id: "2", child_choice: false, receipt_kept: false, budgeting_discussion: false }),
    ];
    const m = computeMetrics(rows);
    expect(m.child_choice_rate).toBe(50);
    expect(m.receipt_rate).toBe(50);
    expect(m.budgeting_discussion_rate).toBe(50);
  });

  it("counts unique children (case-insensitive)", () => {
    const rows = [
      makeRow({ id: "1", child_name: "Alex" }),
      makeRow({ id: "2", child_name: "alex" }),
      makeRow({ id: "3", child_name: "Beth" }),
    ];
    const m = computeMetrics(rows);
    expect(m.unique_children).toBe(2);
  });

  it("builds transaction type breakdown with all types initialized", () => {
    const rows = [makeRow({ transaction_type: "Pocket Money — Weekly" })];
    const m = computeMetrics(rows);
    expect(m.by_transaction_type["Pocket Money — Weekly"]).toBe(1);
    expect(m.by_transaction_type["Birthday Money"]).toBe(0);
  });
});

// -- computeAlerts ------------------------------------------------------------

describe("computeAlerts", () => {
  it("returns no alerts for empty rows", () => {
    expect(computeAlerts([])).toEqual([]);
  });

  it("fires isa_no_consent critical for Junior ISA without consent", () => {
    const rows = [
      makeRow({ transaction_type: "Junior ISA Contribution", parental_consent: false }),
    ];
    const alerts = computeAlerts(rows);
    expect(alerts.some((a) => a.type === "isa_no_consent" && a.severity === "critical")).toBe(true);
  });

  it("fires withdrawal_no_consent critical for Savings Withdrawal without consent", () => {
    const rows = [
      makeRow({ transaction_type: "Savings Withdrawal", parental_consent: false }),
    ];
    const alerts = computeAlerts(rows);
    expect(alerts.some((a) => a.type === "withdrawal_no_consent" && a.severity === "critical")).toBe(true);
  });

  it("fires large_amount_sw_unaware critical when amount > 200 and SW not aware", () => {
    const rows = [makeRow({ amount: 250, social_worker_aware: false })];
    const alerts = computeAlerts(rows);
    expect(alerts.some((a) => a.type === "large_amount_sw_unaware" && a.severity === "critical")).toBe(true);
  });

  it("fires not_age_appropriate critical per-record", () => {
    const rows = [makeRow({ age_appropriate: false })];
    const alerts = computeAlerts(rows);
    expect(alerts.some((a) => a.type === "not_age_appropriate" && a.severity === "critical")).toBe(true);
  });

  it("fires repeated_withdrawals high when child has >= 3 savings withdrawals", () => {
    const rows = [
      makeRow({ id: "1", child_name: "Alex", transaction_type: "Savings Withdrawal", amount: 10 }),
      makeRow({ id: "2", child_name: "Alex", transaction_type: "Savings Withdrawal", amount: 20 }),
      makeRow({ id: "3", child_name: "Alex", transaction_type: "Savings Withdrawal", amount: 30 }),
    ];
    const alerts = computeAlerts(rows);
    expect(alerts.some((a) => a.type === "repeated_withdrawals" && a.severity === "high")).toBe(true);
  });

  it("does not fire large_amount_sw_unaware when amount <= 200", () => {
    const rows = [makeRow({ amount: 200, social_worker_aware: false })];
    const alerts = computeAlerts(rows);
    expect(alerts.some((a) => a.type === "large_amount_sw_unaware")).toBe(false);
  });
});

// -- validatePocketMoneySavings -----------------------------------------------

describe("validatePocketMoneySavings", () => {
  it("returns valid for complete correct input", () => {
    const result = validatePocketMoneySavings({
      childName: "Alex",
      transactionDate: "2026-05-01",
      recordedBy: "Staff",
      transactionType: "Pocket Money — Weekly",
      amount: 10,
      currency: "GBP",
      ageAppropriate: true,
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("requires child name", () => {
    const result = validatePocketMoneySavings({ childName: "" });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Child name"))).toBe(true);
  });

  it("requires transaction date", () => {
    const result = validatePocketMoneySavings({ transactionDate: undefined });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Transaction date is required"))).toBe(true);
  });

  it("rejects future date", () => {
    const result = validatePocketMoneySavings({ transactionDate: "2099-01-01" });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("future"))).toBe(true);
  });

  it("rejects negative amount", () => {
    const result = validatePocketMoneySavings({ amount: -5 });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("negative"))).toBe(true);
  });

  it("warns for amount over 10000", () => {
    const result = validatePocketMoneySavings({ amount: 10001 });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("10,000"))).toBe(true);
  });

  it("requires parental consent status for Junior ISA Contribution", () => {
    const result = validatePocketMoneySavings({
      transactionType: "Junior ISA Contribution",
      parentalConsent: null,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("consent status"))).toBe(true);
  });

  it("rejects Junior ISA without consent", () => {
    const result = validatePocketMoneySavings({
      transactionType: "Junior ISA Contribution",
      parentalConsent: false,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Junior ISA contributions require consent"))).toBe(true);
  });
});
