import { describe, it, expect } from "vitest";
import {
  computeFinancialMetrics,
  identifyFinancialAlerts,
} from "./pocket-money-service";
import type {
  ChildFinancialProfile,
  FinancialTransaction,
  FinancialAudit,
} from "./pocket-money-service";

// -- Factories ----------------------------------------------------------------

function makeProfile(overrides: Partial<ChildFinancialProfile> = {}): ChildFinancialProfile {
  return {
    id: "fp-1",
    home_id: "home-1",
    child_id: "child-1",
    child_name: "Alex",
    weekly_pocket_money: 5,
    clothing_allowance_monthly: 30,
    savings_balance: 100,
    pocket_money_balance: 20,
    financial_literacy_level: "developing",
    has_bank_account: true,
    bank_account_type: "junior_saver",
    savings_goal: "New bike",
    savings_target: 200,
    financial_skills_notes: null,
    last_audit_date: "2026-04-01",
    next_audit_date: "2026-07-01",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

function makeTransaction(overrides: Partial<FinancialTransaction> = {}): FinancialTransaction {
  return {
    id: "ft-1",
    home_id: "home-1",
    child_id: "child-1",
    child_name: "Alex",
    transaction_date: "2026-05-15",
    transaction_type: "pocket_money",
    account_type: "pocket_money",
    amount: 5,
    description: "Weekly pocket money",
    spending_category: null,
    receipt_reference: null,
    authorised_by: "staff-1",
    witnessed_by: "staff-2",
    child_present: true,
    balance_after: 25,
    notes: null,
    created_at: "2026-05-15T00:00:00Z",
    ...overrides,
  };
}

function makeAudit(overrides: Partial<FinancialAudit> = {}): FinancialAudit {
  return {
    id: "fa-1",
    home_id: "home-1",
    audit_date: "2026-05-01",
    audited_by: "manager-1",
    status: "completed",
    children_audited: ["child-1"],
    expected_total: 120,
    actual_total: 120,
    discrepancy_amount: 0,
    discrepancy_explanation: null,
    corrective_action: null,
    notes: null,
    created_at: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

const NOW = new Date("2026-05-21T12:00:00Z");

// -- computeFinancialMetrics --------------------------------------------------

describe("computeFinancialMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeFinancialMetrics([], [], [], 4);
    expect(m.children_with_profiles).toBe(0);
    expect(m.total_pocket_money_balance).toBe(0);
    expect(m.total_savings_balance).toBe(0);
    expect(m.avg_weekly_pocket_money).toBeNull();; expect(m.transactions_this_month).toBe(0);
    expect(m.savings_goal_progress).toBeNull();; expect(m.audit_compliance_rate).toBeNull();; expect(m.overdue_audits).toBe(0);
    expect(m.children_with_bank_accounts).toBe(0);
  });

  it("computes profile-based metrics correctly", () => {
    const profiles = [
      makeProfile({ id: "1", child_id: "c1", weekly_pocket_money: 5, savings_balance: 100, pocket_money_balance: 20, has_bank_account: true }),
      makeProfile({ id: "2", child_id: "c2", weekly_pocket_money: 10, savings_balance: 50, pocket_money_balance: 15, has_bank_account: false }),
    ];
    const m = computeFinancialMetrics(profiles, [], [], 4);
    expect(m.children_with_profiles).toBe(2);
    expect(m.total_pocket_money_balance).toBe(35);
    expect(m.total_savings_balance).toBe(150);
    expect(m.avg_weekly_pocket_money).toBe(7.5);
    expect(m.children_with_bank_accounts).toBe(1);
  });

  it("computes savings goal progress", () => {
    const profiles = [
      makeProfile({ id: "1", savings_balance: 200, savings_target: 200 }), // reached
      makeProfile({ id: "2", savings_balance: 50, savings_target: 200 }), // not reached
    ];
    const m = computeFinancialMetrics(profiles, [], [], 2);
    expect(m.savings_goal_progress).toBe(50); // 1/2 reached target
  });

  it("computes audit compliance rate", () => {
    const audits = [
      makeAudit({ id: "1", status: "completed" }),
      makeAudit({ id: "2", status: "pending" }),
    ];
    const m = computeFinancialMetrics([], [], audits, 4);
    expect(m.audit_compliance_rate).toBe(50);
  });

  it("counts overdue audits from profiles", () => {
    const profiles = [
      makeProfile({ id: "1", next_audit_date: "2025-01-01" }),
      makeProfile({ id: "2", next_audit_date: "2099-01-01" }),
    ];
    const m = computeFinancialMetrics(profiles, [], [], 2);
    expect(m.overdue_audits).toBe(1);
  });

  it("builds transaction type and spending category breakdowns", () => {
    const txns = [
      makeTransaction({ id: "1", transaction_type: "pocket_money", spending_category: null }),
      makeTransaction({ id: "2", transaction_type: "expense", spending_category: "food_drink" }),
    ];
    const m = computeFinancialMetrics([], txns, [], 4);
    expect(m.by_transaction_type).toEqual({ pocket_money: 1, expense: 1 });
    expect(m.by_spending_category).toEqual({ food_drink: 1 });
  });
});

// -- identifyFinancialAlerts --------------------------------------------------

describe("identifyFinancialAlerts", () => {
  it("returns no alerts for empty data", () => {
    expect(identifyFinancialAlerts([], [], [], 0, NOW)).toEqual([]);
  });

  it("fires missing_financial_profile when fewer profiles than children", () => {
    const profiles = [makeProfile()];
    const alerts = identifyFinancialAlerts(profiles, [], [], 3, NOW);
    expect(alerts.some((a) => a.type === "missing_financial_profile" && a.severity === "high")).toBe(true);
  });

  it("fires negative_balance high alert for negative pocket money balance", () => {
    const profiles = [makeProfile({ pocket_money_balance: -5 })];
    const alerts = identifyFinancialAlerts(profiles, [], [], 1, NOW);
    expect(alerts.some((a) => a.type === "negative_balance" && a.severity === "high")).toBe(true);
  });

  it("fires audit_discrepancy critical alert for audit with discrepancy", () => {
    const audits = [makeAudit({ status: "discrepancy_found", discrepancy_amount: 15 })];
    const alerts = identifyFinancialAlerts([], [], audits, 1, NOW);
    expect(alerts.some((a) => a.type === "audit_discrepancy" && a.severity === "critical")).toBe(true);
  });

  it("fires large_transaction_unwitnessed medium when > 50 and no witness", () => {
    const txns = [makeTransaction({ amount: 55, witnessed_by: null })];
    const alerts = identifyFinancialAlerts([], txns, [], 1, NOW);
    expect(alerts.some((a) => a.type === "large_transaction_unwitnessed" && a.severity === "medium")).toBe(true);
  });

  it("does not fire large_transaction_unwitnessed when amount <= 50", () => {
    const txns = [makeTransaction({ amount: 50, witnessed_by: null })];
    const alerts = identifyFinancialAlerts([], txns, [], 1, NOW);
    expect(alerts.some((a) => a.type === "large_transaction_unwitnessed")).toBe(false);
  });

  it("fires audit_overdue medium when next_audit_date is past", () => {
    const profiles = [makeProfile({ next_audit_date: "2025-01-01" })];
    const alerts = identifyFinancialAlerts(profiles, [], [], 1, NOW);
    expect(alerts.some((a) => a.type === "audit_overdue" && a.severity === "medium")).toBe(true);
  });

  it("fires pocket_money_not_paid when no recent pocket money transaction", () => {
    const profiles = [makeProfile({ child_id: "c1", weekly_pocket_money: 5 })];
    // No transactions at all
    const alerts = identifyFinancialAlerts(profiles, [], [], 1, NOW);
    expect(alerts.some((a) => a.type === "pocket_money_not_paid" && a.severity === "medium")).toBe(true);
  });

  it("does not fire pocket_money_not_paid when recent pocket money exists", () => {
    const profiles = [makeProfile({ child_id: "c1", weekly_pocket_money: 5 })];
    const txns = [makeTransaction({ child_id: "c1", transaction_type: "pocket_money", transaction_date: "2026-05-20" })];
    const alerts = identifyFinancialAlerts(profiles, txns, [], 1, NOW);
    expect(alerts.some((a) => a.type === "pocket_money_not_paid")).toBe(false);
  });
});
