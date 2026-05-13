// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — POCKET MONEY & SAVINGS SERVICE TESTS
// Pure-function unit tests for financial metrics computation,
// alert identification, constant validation, and CRUD fallback behaviour
// (Supabase disabled). CHR 2015 Reg 37 (children's money — pocket money,
// savings, and personal allowances), Reg 7 (children's views — financial
// choices), Reg 14 (care planning — financial provisions).
// SCCIF: Children's Experiences — "Children receive their pocket money
// and are supported to manage their finances."
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  isSupabaseEnabled: () => false,
  createServerClient: () => null,
}));

import {
  _testing,
  TRANSACTION_TYPES,
  SPENDING_CATEGORIES,
  ACCOUNT_TYPES,
  FINANCIAL_LITERACY_LEVELS,
  AUDIT_STATUSES,
  listProfiles,
  createProfile,
  updateProfile,
  listTransactions,
  createTransaction,
  listAudits,
  createAudit,
} from "../pocket-money-service";

import type {
  ChildFinancialProfile,
  FinancialTransaction,
  FinancialAudit,
} from "../pocket-money-service";

const { computeFinancialMetrics, identifyFinancialAlerts } = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

/** Date string N days ago from now. */
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

/** Date string N days in the future from now. */
function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

/** ISO datetime string N days ago. */
function daysAgoISO(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

/** Build a minimal ChildFinancialProfile with sensible defaults. */
function makeProfile(
  overrides: Partial<ChildFinancialProfile> = {},
): ChildFinancialProfile {
  return {
    id: "profile-1",
    home_id: "home-1",
    child_id: "child-1",
    child_name: "Alice Smith",
    weekly_pocket_money: 10,
    clothing_allowance_monthly: 50,
    savings_balance: 100,
    pocket_money_balance: 25,
    financial_literacy_level: "developing",
    has_bank_account: false,
    bank_account_type: null,
    savings_goal: null,
    savings_target: null,
    financial_skills_notes: null,
    last_audit_date: null,
    next_audit_date: daysFromNow(30),
    created_at: daysAgoISO(60),
    updated_at: daysAgoISO(1),
    ...overrides,
  };
}

/** Build a minimal FinancialTransaction with sensible defaults. */
function makeTransaction(
  overrides: Partial<FinancialTransaction> = {},
): FinancialTransaction {
  return {
    id: "txn-1",
    home_id: "home-1",
    child_id: "child-1",
    child_name: "Alice Smith",
    transaction_date: daysAgo(2),
    transaction_type: "pocket_money",
    account_type: "pocket_money",
    amount: 10,
    description: "Weekly pocket money",
    spending_category: null,
    receipt_reference: null,
    authorised_by: "staff-1",
    witnessed_by: "staff-2",
    child_present: true,
    balance_after: 35,
    notes: null,
    created_at: daysAgoISO(2),
    ...overrides,
  };
}

/** Build a minimal FinancialAudit with sensible defaults. */
function makeAudit(
  overrides: Partial<FinancialAudit> = {},
): FinancialAudit {
  return {
    id: "audit-1",
    home_id: "home-1",
    audit_date: daysAgo(7),
    audited_by: "manager-1",
    status: "completed",
    children_audited: ["child-1", "child-2"],
    expected_total: 200,
    actual_total: 200,
    discrepancy_amount: 0,
    discrepancy_explanation: null,
    corrective_action: null,
    notes: null,
    created_at: daysAgoISO(7),
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

describe("TRANSACTION_TYPES", () => {
  it("has exactly 11 entries", () => {
    expect(TRANSACTION_TYPES).toHaveLength(11);
  });

  it("contains unique type values", () => {
    const values = TRANSACTION_TYPES.map((t) => t.type);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = TRANSACTION_TYPES.map((t) => t.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes pocket_money", () => {
    expect(TRANSACTION_TYPES.find((t) => t.type === "pocket_money")).toBeTruthy();
  });

  it("includes savings_deposit", () => {
    expect(TRANSACTION_TYPES.find((t) => t.type === "savings_deposit")).toBeTruthy();
  });

  it("includes savings_withdrawal", () => {
    expect(TRANSACTION_TYPES.find((t) => t.type === "savings_withdrawal")).toBeTruthy();
  });

  it("includes birthday_money", () => {
    expect(TRANSACTION_TYPES.find((t) => t.type === "birthday_money")).toBeTruthy();
  });

  it("includes gift_money", () => {
    expect(TRANSACTION_TYPES.find((t) => t.type === "gift_money")).toBeTruthy();
  });

  it("includes earnings", () => {
    expect(TRANSACTION_TYPES.find((t) => t.type === "earnings")).toBeTruthy();
  });

  it("includes expense", () => {
    expect(TRANSACTION_TYPES.find((t) => t.type === "expense")).toBeTruthy();
  });

  it("includes clothing_allowance", () => {
    expect(TRANSACTION_TYPES.find((t) => t.type === "clothing_allowance")).toBeTruthy();
  });

  it("includes travel_allowance", () => {
    expect(TRANSACTION_TYPES.find((t) => t.type === "travel_allowance")).toBeTruthy();
  });

  it("includes other_income", () => {
    expect(TRANSACTION_TYPES.find((t) => t.type === "other_income")).toBeTruthy();
  });

  it("includes other_expense", () => {
    expect(TRANSACTION_TYPES.find((t) => t.type === "other_expense")).toBeTruthy();
  });

  it("each entry has a non-empty label", () => {
    for (const t of TRANSACTION_TYPES) {
      expect(t.label.length).toBeGreaterThan(0);
    }
  });
});

describe("SPENDING_CATEGORIES", () => {
  it("has exactly 11 entries", () => {
    expect(SPENDING_CATEGORIES).toHaveLength(11);
  });

  it("contains unique category values", () => {
    const values = SPENDING_CATEGORIES.map((c) => c.category);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = SPENDING_CATEGORIES.map((c) => c.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes food_drink", () => {
    expect(SPENDING_CATEGORIES.find((c) => c.category === "food_drink")).toBeTruthy();
  });

  it("includes clothing", () => {
    expect(SPENDING_CATEGORIES.find((c) => c.category === "clothing")).toBeTruthy();
  });

  it("includes entertainment", () => {
    expect(SPENDING_CATEGORIES.find((c) => c.category === "entertainment")).toBeTruthy();
  });

  it("includes personal_care", () => {
    expect(SPENDING_CATEGORIES.find((c) => c.category === "personal_care")).toBeTruthy();
  });

  it("includes technology", () => {
    expect(SPENDING_CATEGORIES.find((c) => c.category === "technology")).toBeTruthy();
  });

  it("includes hobbies", () => {
    expect(SPENDING_CATEGORIES.find((c) => c.category === "hobbies")).toBeTruthy();
  });

  it("includes travel", () => {
    expect(SPENDING_CATEGORIES.find((c) => c.category === "travel")).toBeTruthy();
  });

  it("includes savings", () => {
    expect(SPENDING_CATEGORIES.find((c) => c.category === "savings")).toBeTruthy();
  });

  it("includes gifts", () => {
    expect(SPENDING_CATEGORIES.find((c) => c.category === "gifts")).toBeTruthy();
  });

  it("includes education", () => {
    expect(SPENDING_CATEGORIES.find((c) => c.category === "education")).toBeTruthy();
  });

  it("includes other", () => {
    expect(SPENDING_CATEGORIES.find((c) => c.category === "other")).toBeTruthy();
  });

  it("each entry has a non-empty label", () => {
    for (const c of SPENDING_CATEGORIES) {
      expect(c.label.length).toBeGreaterThan(0);
    }
  });
});

describe("ACCOUNT_TYPES", () => {
  it("has exactly 4 entries", () => {
    expect(ACCOUNT_TYPES).toHaveLength(4);
  });

  it("contains unique type values", () => {
    const values = ACCOUNT_TYPES.map((a) => a.type);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = ACCOUNT_TYPES.map((a) => a.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes pocket_money", () => {
    expect(ACCOUNT_TYPES.find((a) => a.type === "pocket_money")).toBeTruthy();
  });

  it("includes savings", () => {
    expect(ACCOUNT_TYPES.find((a) => a.type === "savings")).toBeTruthy();
  });

  it("includes clothing_allowance", () => {
    expect(ACCOUNT_TYPES.find((a) => a.type === "clothing_allowance")).toBeTruthy();
  });

  it("includes birthday_fund", () => {
    expect(ACCOUNT_TYPES.find((a) => a.type === "birthday_fund")).toBeTruthy();
  });

  it("each entry has a non-empty label", () => {
    for (const a of ACCOUNT_TYPES) {
      expect(a.label.length).toBeGreaterThan(0);
    }
  });
});

describe("FINANCIAL_LITERACY_LEVELS", () => {
  it("has exactly 5 entries", () => {
    expect(FINANCIAL_LITERACY_LEVELS).toHaveLength(5);
  });

  it("contains unique level values", () => {
    const values = FINANCIAL_LITERACY_LEVELS.map((l) => l.level);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = FINANCIAL_LITERACY_LEVELS.map((l) => l.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes not_assessed", () => {
    expect(FINANCIAL_LITERACY_LEVELS.find((l) => l.level === "not_assessed")).toBeTruthy();
  });

  it("includes emerging", () => {
    expect(FINANCIAL_LITERACY_LEVELS.find((l) => l.level === "emerging")).toBeTruthy();
  });

  it("includes developing", () => {
    expect(FINANCIAL_LITERACY_LEVELS.find((l) => l.level === "developing")).toBeTruthy();
  });

  it("includes competent", () => {
    expect(FINANCIAL_LITERACY_LEVELS.find((l) => l.level === "competent")).toBeTruthy();
  });

  it("includes independent", () => {
    expect(FINANCIAL_LITERACY_LEVELS.find((l) => l.level === "independent")).toBeTruthy();
  });

  it("each entry has a non-empty label", () => {
    for (const l of FINANCIAL_LITERACY_LEVELS) {
      expect(l.label.length).toBeGreaterThan(0);
    }
  });
});

describe("AUDIT_STATUSES", () => {
  it("has exactly 4 entries", () => {
    expect(AUDIT_STATUSES).toHaveLength(4);
  });

  it("contains unique status values", () => {
    const values = AUDIT_STATUSES.map((s) => s.status);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = AUDIT_STATUSES.map((s) => s.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes pending", () => {
    expect(AUDIT_STATUSES.find((s) => s.status === "pending")).toBeTruthy();
  });

  it("includes in_progress", () => {
    expect(AUDIT_STATUSES.find((s) => s.status === "in_progress")).toBeTruthy();
  });

  it("includes completed", () => {
    expect(AUDIT_STATUSES.find((s) => s.status === "completed")).toBeTruthy();
  });

  it("includes discrepancy_found", () => {
    expect(AUDIT_STATUSES.find((s) => s.status === "discrepancy_found")).toBeTruthy();
  });

  it("each entry has a non-empty label", () => {
    for (const s of AUDIT_STATUSES) {
      expect(s.label.length).toBeGreaterThan(0);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. computeFinancialMetrics
// ═══════════════════════════════════════════════════════════════════════════

describe("computeFinancialMetrics", () => {
  it("returns zeroed metrics for empty arrays", () => {
    const m = computeFinancialMetrics([], [], [], 0);
    expect(m.children_with_profiles).toBe(0);
    expect(m.total_pocket_money_balance).toBe(0);
    expect(m.total_savings_balance).toBe(0);
    expect(m.avg_weekly_pocket_money).toBe(0);
    expect(m.transactions_this_month).toBe(0);
    expect(Object.keys(m.by_transaction_type)).toHaveLength(0);
    expect(Object.keys(m.by_spending_category)).toHaveLength(0);
    expect(m.savings_goal_progress).toBe(0);
    expect(m.audit_compliance_rate).toBe(0);
    expect(m.overdue_audits).toBe(0);
    expect(m.children_with_bank_accounts).toBe(0);
    expect(Object.keys(m.financial_literacy_distribution)).toHaveLength(0);
  });

  // ── children_with_profiles ──────────────────────────────────────────

  it("counts children_with_profiles from profiles array length", () => {
    const profiles = [
      makeProfile({ id: "p1", child_id: "c1" }),
      makeProfile({ id: "p2", child_id: "c2" }),
      makeProfile({ id: "p3", child_id: "c3" }),
    ];
    const m = computeFinancialMetrics(profiles, [], [], 5);
    expect(m.children_with_profiles).toBe(3);
  });

  it("returns 0 children_with_profiles for empty profiles", () => {
    const m = computeFinancialMetrics([], [], [], 3);
    expect(m.children_with_profiles).toBe(0);
  });

  // ── total_pocket_money_balance ──────────────────────────────────────

  it("sums pocket_money_balance across profiles", () => {
    const profiles = [
      makeProfile({ id: "p1", pocket_money_balance: 25.50 }),
      makeProfile({ id: "p2", pocket_money_balance: 14.75 }),
    ];
    const m = computeFinancialMetrics(profiles, [], [], 2);
    expect(m.total_pocket_money_balance).toBe(40.25);
  });

  it("handles zero pocket_money_balance", () => {
    const profiles = [
      makeProfile({ id: "p1", pocket_money_balance: 0 }),
    ];
    const m = computeFinancialMetrics(profiles, [], [], 1);
    expect(m.total_pocket_money_balance).toBe(0);
  });

  it("handles negative pocket_money_balance in sum", () => {
    const profiles = [
      makeProfile({ id: "p1", pocket_money_balance: -5 }),
      makeProfile({ id: "p2", pocket_money_balance: 20 }),
    ];
    const m = computeFinancialMetrics(profiles, [], [], 2);
    expect(m.total_pocket_money_balance).toBe(15);
  });

  // ── total_savings_balance ───────────────────────────────────────────

  it("sums savings_balance across profiles", () => {
    const profiles = [
      makeProfile({ id: "p1", savings_balance: 150 }),
      makeProfile({ id: "p2", savings_balance: 250.50 }),
    ];
    const m = computeFinancialMetrics(profiles, [], [], 2);
    expect(m.total_savings_balance).toBe(400.50);
  });

  it("returns 0 total_savings_balance for empty profiles", () => {
    const m = computeFinancialMetrics([], [], [], 0);
    expect(m.total_savings_balance).toBe(0);
  });

  // ── avg_weekly_pocket_money ─────────────────────────────────────────

  it("calculates average weekly pocket money", () => {
    const profiles = [
      makeProfile({ id: "p1", weekly_pocket_money: 10 }),
      makeProfile({ id: "p2", weekly_pocket_money: 20 }),
    ];
    const m = computeFinancialMetrics(profiles, [], [], 2);
    expect(m.avg_weekly_pocket_money).toBe(15);
  });

  it("returns 0 avg_weekly_pocket_money for empty profiles", () => {
    const m = computeFinancialMetrics([], [], [], 0);
    expect(m.avg_weekly_pocket_money).toBe(0);
  });

  it("rounds avg_weekly_pocket_money to 2 decimal places", () => {
    const profiles = [
      makeProfile({ id: "p1", weekly_pocket_money: 10 }),
      makeProfile({ id: "p2", weekly_pocket_money: 7 }),
      makeProfile({ id: "p3", weekly_pocket_money: 12 }),
    ];
    const m = computeFinancialMetrics(profiles, [], [], 3);
    // (10+7+12)/3 = 9.666... => 9.67
    expect(m.avg_weekly_pocket_money).toBe(9.67);
  });

  it("handles a single profile for avg_weekly_pocket_money", () => {
    const profiles = [makeProfile({ id: "p1", weekly_pocket_money: 15 })];
    const m = computeFinancialMetrics(profiles, [], [], 1);
    expect(m.avg_weekly_pocket_money).toBe(15);
  });

  // ── transactions_this_month ─────────────────────────────────────────

  it("counts transactions within last 30 days", () => {
    const txns = [
      makeTransaction({ id: "t1", transaction_date: daysAgo(5) }),
      makeTransaction({ id: "t2", transaction_date: daysAgo(15) }),
      makeTransaction({ id: "t3", transaction_date: daysAgo(25) }),
    ];
    const m = computeFinancialMetrics([], txns, [], 0);
    expect(m.transactions_this_month).toBe(3);
  });

  it("excludes transactions older than 30 days", () => {
    const txns = [
      makeTransaction({ id: "t1", transaction_date: daysAgo(5) }),
      makeTransaction({ id: "t2", transaction_date: daysAgo(35) }),
      makeTransaction({ id: "t3", transaction_date: daysAgo(60) }),
    ];
    const m = computeFinancialMetrics([], txns, [], 0);
    expect(m.transactions_this_month).toBe(1);
  });

  it("returns 0 transactions_this_month for no transactions", () => {
    const m = computeFinancialMetrics([], [], [], 0);
    expect(m.transactions_this_month).toBe(0);
  });

  it("returns 0 transactions_this_month when all are old", () => {
    const txns = [
      makeTransaction({ id: "t1", transaction_date: daysAgo(45) }),
      makeTransaction({ id: "t2", transaction_date: daysAgo(90) }),
    ];
    const m = computeFinancialMetrics([], txns, [], 0);
    expect(m.transactions_this_month).toBe(0);
  });

  // ── by_transaction_type ─────────────────────────────────────────────

  it("tallies transactions by type", () => {
    const txns = [
      makeTransaction({ id: "t1", transaction_type: "pocket_money" }),
      makeTransaction({ id: "t2", transaction_type: "pocket_money" }),
      makeTransaction({ id: "t3", transaction_type: "expense" }),
      makeTransaction({ id: "t4", transaction_type: "savings_deposit" }),
    ];
    const m = computeFinancialMetrics([], txns, [], 0);
    expect(m.by_transaction_type["pocket_money"]).toBe(2);
    expect(m.by_transaction_type["expense"]).toBe(1);
    expect(m.by_transaction_type["savings_deposit"]).toBe(1);
  });

  it("returns empty by_transaction_type for no transactions", () => {
    const m = computeFinancialMetrics([], [], [], 0);
    expect(Object.keys(m.by_transaction_type)).toHaveLength(0);
  });

  it("counts all 11 transaction types when present", () => {
    const types = TRANSACTION_TYPES.map((t) => t.type);
    const txns = types.map((type, i) =>
      makeTransaction({ id: `t${i}`, transaction_type: type }),
    );
    const m = computeFinancialMetrics([], txns, [], 0);
    expect(Object.keys(m.by_transaction_type)).toHaveLength(11);
    for (const type of types) {
      expect(m.by_transaction_type[type]).toBe(1);
    }
  });

  // ── by_spending_category ────────────────────────────────────────────

  it("tallies transactions by spending category", () => {
    const txns = [
      makeTransaction({ id: "t1", spending_category: "food_drink" }),
      makeTransaction({ id: "t2", spending_category: "food_drink" }),
      makeTransaction({ id: "t3", spending_category: "clothing" }),
    ];
    const m = computeFinancialMetrics([], txns, [], 0);
    expect(m.by_spending_category["food_drink"]).toBe(2);
    expect(m.by_spending_category["clothing"]).toBe(1);
  });

  it("ignores transactions with null spending_category", () => {
    const txns = [
      makeTransaction({ id: "t1", spending_category: null }),
      makeTransaction({ id: "t2", spending_category: "entertainment" }),
    ];
    const m = computeFinancialMetrics([], txns, [], 0);
    expect(Object.keys(m.by_spending_category)).toHaveLength(1);
    expect(m.by_spending_category["entertainment"]).toBe(1);
  });

  it("returns empty by_spending_category when all categories are null", () => {
    const txns = [
      makeTransaction({ id: "t1", spending_category: null }),
      makeTransaction({ id: "t2", spending_category: null }),
    ];
    const m = computeFinancialMetrics([], txns, [], 0);
    expect(Object.keys(m.by_spending_category)).toHaveLength(0);
  });

  // ── savings_goal_progress ───────────────────────────────────────────

  it("calculates savings goal progress percentage", () => {
    const profiles = [
      makeProfile({ id: "p1", savings_target: 200, savings_balance: 200 }),
      makeProfile({ id: "p2", savings_target: 100, savings_balance: 50 }),
    ];
    const m = computeFinancialMetrics(profiles, [], [], 2);
    // 1/2 = 50%
    expect(m.savings_goal_progress).toBe(50);
  });

  it("returns 0 savings_goal_progress when no targets set", () => {
    const profiles = [
      makeProfile({ id: "p1", savings_target: null }),
      makeProfile({ id: "p2", savings_target: 0 }),
    ];
    const m = computeFinancialMetrics(profiles, [], [], 2);
    expect(m.savings_goal_progress).toBe(0);
  });

  it("returns 100 savings_goal_progress when all targets reached", () => {
    const profiles = [
      makeProfile({ id: "p1", savings_target: 100, savings_balance: 150 }),
      makeProfile({ id: "p2", savings_target: 50, savings_balance: 50 }),
    ];
    const m = computeFinancialMetrics(profiles, [], [], 2);
    expect(m.savings_goal_progress).toBe(100);
  });

  it("returns 0 savings_goal_progress when no target is reached", () => {
    const profiles = [
      makeProfile({ id: "p1", savings_target: 500, savings_balance: 100 }),
      makeProfile({ id: "p2", savings_target: 200, savings_balance: 50 }),
    ];
    const m = computeFinancialMetrics(profiles, [], [], 2);
    expect(m.savings_goal_progress).toBe(0);
  });

  it("savings_goal_progress rounds to one decimal place", () => {
    const profiles = [
      makeProfile({ id: "p1", savings_target: 100, savings_balance: 100 }),
      makeProfile({ id: "p2", savings_target: 100, savings_balance: 50 }),
      makeProfile({ id: "p3", savings_target: 100, savings_balance: 50 }),
    ];
    const m = computeFinancialMetrics(profiles, [], [], 3);
    // 1/3 = 33.3%
    expect(m.savings_goal_progress).toBe(33.3);
  });

  it("ignores profiles with savings_target of 0", () => {
    const profiles = [
      makeProfile({ id: "p1", savings_target: 0, savings_balance: 999 }),
      makeProfile({ id: "p2", savings_target: 100, savings_balance: 100 }),
    ];
    const m = computeFinancialMetrics(profiles, [], [], 2);
    // Only p2 has a target, and it's reached
    expect(m.savings_goal_progress).toBe(100);
  });

  // ── audit_compliance_rate ───────────────────────────────────────────

  it("calculates audit compliance rate", () => {
    const audits = [
      makeAudit({ id: "a1", status: "completed" }),
      makeAudit({ id: "a2", status: "pending" }),
      makeAudit({ id: "a3", status: "completed" }),
      makeAudit({ id: "a4", status: "in_progress" }),
    ];
    const m = computeFinancialMetrics([], [], audits, 0);
    // 2/4 = 50%
    expect(m.audit_compliance_rate).toBe(50);
  });

  it("returns 0 audit_compliance_rate for no audits", () => {
    const m = computeFinancialMetrics([], [], [], 0);
    expect(m.audit_compliance_rate).toBe(0);
  });

  it("returns 100 audit_compliance_rate when all completed", () => {
    const audits = [
      makeAudit({ id: "a1", status: "completed" }),
      makeAudit({ id: "a2", status: "completed" }),
    ];
    const m = computeFinancialMetrics([], [], audits, 0);
    expect(m.audit_compliance_rate).toBe(100);
  });

  it("returns 0 audit_compliance_rate when none completed", () => {
    const audits = [
      makeAudit({ id: "a1", status: "pending" }),
      makeAudit({ id: "a2", status: "in_progress" }),
      makeAudit({ id: "a3", status: "discrepancy_found" }),
    ];
    const m = computeFinancialMetrics([], [], audits, 0);
    expect(m.audit_compliance_rate).toBe(0);
  });

  it("audit_compliance_rate rounds to one decimal place", () => {
    const audits = [
      makeAudit({ id: "a1", status: "completed" }),
      makeAudit({ id: "a2", status: "pending" }),
      makeAudit({ id: "a3", status: "pending" }),
    ];
    const m = computeFinancialMetrics([], [], audits, 0);
    // 1/3 = 33.3%
    expect(m.audit_compliance_rate).toBe(33.3);
  });

  // ── overdue_audits ──────────────────────────────────────────────────

  it("counts profiles with overdue next_audit_date", () => {
    const profiles = [
      makeProfile({ id: "p1", next_audit_date: daysAgo(10) }),
      makeProfile({ id: "p2", next_audit_date: daysFromNow(30) }),
      makeProfile({ id: "p3", next_audit_date: daysAgo(5) }),
    ];
    const m = computeFinancialMetrics(profiles, [], [], 3);
    expect(m.overdue_audits).toBe(2);
  });

  it("returns 0 overdue_audits when none are past due", () => {
    const profiles = [
      makeProfile({ id: "p1", next_audit_date: daysFromNow(30) }),
    ];
    const m = computeFinancialMetrics(profiles, [], [], 1);
    expect(m.overdue_audits).toBe(0);
  });

  it("returns 0 overdue_audits when next_audit_date is null", () => {
    const profiles = [
      makeProfile({ id: "p1", next_audit_date: null }),
    ];
    const m = computeFinancialMetrics(profiles, [], [], 1);
    expect(m.overdue_audits).toBe(0);
  });

  // ── children_with_bank_accounts ─────────────────────────────────────

  it("counts profiles with has_bank_account true", () => {
    const profiles = [
      makeProfile({ id: "p1", has_bank_account: true }),
      makeProfile({ id: "p2", has_bank_account: false }),
      makeProfile({ id: "p3", has_bank_account: true }),
    ];
    const m = computeFinancialMetrics(profiles, [], [], 3);
    expect(m.children_with_bank_accounts).toBe(2);
  });

  it("returns 0 children_with_bank_accounts when none have accounts", () => {
    const profiles = [
      makeProfile({ id: "p1", has_bank_account: false }),
    ];
    const m = computeFinancialMetrics(profiles, [], [], 1);
    expect(m.children_with_bank_accounts).toBe(0);
  });

  // ── financial_literacy_distribution ─────────────────────────────────

  it("tallies financial literacy levels", () => {
    const profiles = [
      makeProfile({ id: "p1", financial_literacy_level: "emerging" }),
      makeProfile({ id: "p2", financial_literacy_level: "emerging" }),
      makeProfile({ id: "p3", financial_literacy_level: "competent" }),
      makeProfile({ id: "p4", financial_literacy_level: "independent" }),
    ];
    const m = computeFinancialMetrics(profiles, [], [], 4);
    expect(m.financial_literacy_distribution["emerging"]).toBe(2);
    expect(m.financial_literacy_distribution["competent"]).toBe(1);
    expect(m.financial_literacy_distribution["independent"]).toBe(1);
  });

  it("returns empty financial_literacy_distribution for no profiles", () => {
    const m = computeFinancialMetrics([], [], [], 0);
    expect(Object.keys(m.financial_literacy_distribution)).toHaveLength(0);
  });

  it("only includes literacy levels that are present", () => {
    const profiles = [
      makeProfile({ id: "p1", financial_literacy_level: "not_assessed" }),
    ];
    const m = computeFinancialMetrics(profiles, [], [], 1);
    expect(m.financial_literacy_distribution["not_assessed"]).toBe(1);
    expect(m.financial_literacy_distribution["emerging"]).toBeUndefined();
    expect(m.financial_literacy_distribution["competent"]).toBeUndefined();
  });

  it("counts all 5 literacy levels when all present", () => {
    const levels: ChildFinancialProfile["financial_literacy_level"][] = [
      "not_assessed",
      "emerging",
      "developing",
      "competent",
      "independent",
    ];
    const profiles = levels.map((level, i) =>
      makeProfile({ id: `p${i}`, financial_literacy_level: level }),
    );
    const m = computeFinancialMetrics(profiles, [], [], 5);
    expect(Object.keys(m.financial_literacy_distribution)).toHaveLength(5);
    for (const level of levels) {
      expect(m.financial_literacy_distribution[level]).toBe(1);
    }
  });

  // ── Combined / realistic scenario ───────────────────────────────────

  it("handles a realistic scenario with all data populated", () => {
    const profiles = [
      makeProfile({
        id: "p1",
        child_id: "c1",
        weekly_pocket_money: 10,
        pocket_money_balance: 25,
        savings_balance: 150,
        has_bank_account: true,
        financial_literacy_level: "developing",
        savings_target: 200,
        next_audit_date: daysFromNow(20),
      }),
      makeProfile({
        id: "p2",
        child_id: "c2",
        weekly_pocket_money: 8,
        pocket_money_balance: 12,
        savings_balance: 80,
        has_bank_account: false,
        financial_literacy_level: "emerging",
        savings_target: 100,
        next_audit_date: daysAgo(3),
      }),
    ];
    const txns = [
      makeTransaction({ id: "t1", transaction_type: "pocket_money", spending_category: null, transaction_date: daysAgo(3) }),
      makeTransaction({ id: "t2", transaction_type: "expense", spending_category: "food_drink", transaction_date: daysAgo(5) }),
      makeTransaction({ id: "t3", transaction_type: "savings_deposit", spending_category: "savings", transaction_date: daysAgo(10) }),
    ];
    const audits = [
      makeAudit({ id: "a1", status: "completed" }),
      makeAudit({ id: "a2", status: "pending" }),
    ];

    const m = computeFinancialMetrics(profiles, txns, audits, 3);

    expect(m.children_with_profiles).toBe(2);
    expect(m.total_pocket_money_balance).toBe(37);
    expect(m.total_savings_balance).toBe(230);
    expect(m.avg_weekly_pocket_money).toBe(9);
    expect(m.transactions_this_month).toBe(3);
    expect(m.by_transaction_type["pocket_money"]).toBe(1);
    expect(m.by_transaction_type["expense"]).toBe(1);
    expect(m.by_transaction_type["savings_deposit"]).toBe(1);
    expect(m.by_spending_category["food_drink"]).toBe(1);
    expect(m.by_spending_category["savings"]).toBe(1);
    expect(m.savings_goal_progress).toBe(0);
    expect(m.audit_compliance_rate).toBe(50);
    expect(m.overdue_audits).toBe(1);
    expect(m.children_with_bank_accounts).toBe(1);
    expect(m.financial_literacy_distribution["developing"]).toBe(1);
    expect(m.financial_literacy_distribution["emerging"]).toBe(1);
  });

  it("rounds total_pocket_money_balance to 2 decimal places", () => {
    const profiles = [
      makeProfile({ id: "p1", pocket_money_balance: 10.111 }),
      makeProfile({ id: "p2", pocket_money_balance: 5.222 }),
    ];
    const m = computeFinancialMetrics(profiles, [], [], 2);
    expect(m.total_pocket_money_balance).toBe(15.33);
  });

  it("rounds total_savings_balance to 2 decimal places", () => {
    const profiles = [
      makeProfile({ id: "p1", savings_balance: 33.336 }),
      makeProfile({ id: "p2", savings_balance: 66.669 }),
    ];
    const m = computeFinancialMetrics(profiles, [], [], 2);
    expect(m.total_savings_balance).toBe(100.01);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. identifyFinancialAlerts
// ═══════════════════════════════════════════════════════════════════════════

describe("identifyFinancialAlerts", () => {
  const now = new Date();

  it("returns no alerts for a fully compliant setup", () => {
    const profiles = [
      makeProfile({
        id: "p1",
        child_id: "c1",
        pocket_money_balance: 10,
        weekly_pocket_money: 10,
        next_audit_date: daysFromNow(30),
      }),
    ];
    const txns = [
      makeTransaction({
        id: "t1",
        child_id: "c1",
        transaction_type: "pocket_money",
        transaction_date: daysAgo(3),
        amount: 10,
        witnessed_by: "staff-2",
      }),
    ];
    const audits = [makeAudit({ status: "completed" })];
    const alerts = identifyFinancialAlerts(profiles, txns, audits, 1, now);
    expect(alerts).toHaveLength(0);
  });

  // ── missing_financial_profile ───────────────────────────────────────

  it("raises high alert when totalChildren > profiles.length", () => {
    const profiles = [makeProfile({ id: "p1" })];
    const alerts = identifyFinancialAlerts(profiles, [], [], 3, now);
    const missing = alerts.find((a) => a.type === "missing_financial_profile");
    expect(missing).toBeTruthy();
    expect(missing!.severity).toBe("high");
  });

  it("missing_financial_profile message includes count of missing children", () => {
    const profiles = [makeProfile({ id: "p1" })];
    const alerts = identifyFinancialAlerts(profiles, [], [], 4, now);
    const missing = alerts.find((a) => a.type === "missing_financial_profile");
    expect(missing!.message).toContain("3");
  });

  it("missing_financial_profile message references Reg 37", () => {
    const alerts = identifyFinancialAlerts([], [], [], 2, now);
    const missing = alerts.find((a) => a.type === "missing_financial_profile");
    expect(missing!.message).toContain("Reg 37");
  });

  it("missing_financial_profile uses first profile id when profiles exist", () => {
    const profiles = [makeProfile({ id: "first-profile" })];
    const alerts = identifyFinancialAlerts(profiles, [], [], 3, now);
    const missing = alerts.find((a) => a.type === "missing_financial_profile");
    expect(missing!.id).toBe("first-profile");
  });

  it("missing_financial_profile uses 'system' id when no profiles", () => {
    const alerts = identifyFinancialAlerts([], [], [], 2, now);
    const missing = alerts.find((a) => a.type === "missing_financial_profile");
    expect(missing!.id).toBe("system");
  });

  it("does not raise missing_financial_profile when all have profiles", () => {
    const profiles = [
      makeProfile({ id: "p1" }),
      makeProfile({ id: "p2" }),
    ];
    const alerts = identifyFinancialAlerts(profiles, [], [], 2, now);
    const missing = alerts.find((a) => a.type === "missing_financial_profile");
    expect(missing).toBeUndefined();
  });

  it("does not raise missing_financial_profile when totalChildren is 0", () => {
    const alerts = identifyFinancialAlerts([], [], [], 0, now);
    const missing = alerts.find((a) => a.type === "missing_financial_profile");
    expect(missing).toBeUndefined();
  });

  it("does not raise missing_financial_profile when profiles exceed totalChildren", () => {
    const profiles = [
      makeProfile({ id: "p1" }),
      makeProfile({ id: "p2" }),
    ];
    const alerts = identifyFinancialAlerts(profiles, [], [], 1, now);
    const missing = alerts.find((a) => a.type === "missing_financial_profile");
    expect(missing).toBeUndefined();
  });

  // ── audit_overdue ───────────────────────────────────────────────────

  it("raises medium alert when next_audit_date is in the past", () => {
    const profiles = [
      makeProfile({ id: "p1", child_name: "Alice", next_audit_date: daysAgo(10) }),
    ];
    const alerts = identifyFinancialAlerts(profiles, [], [], 1, now);
    const overdue = alerts.find((a) => a.type === "audit_overdue");
    expect(overdue).toBeTruthy();
    expect(overdue!.severity).toBe("medium");
  });

  it("audit_overdue includes days overdue in message", () => {
    const profiles = [
      makeProfile({ id: "p1", child_name: "Alice", next_audit_date: daysAgo(15) }),
    ];
    const alerts = identifyFinancialAlerts(profiles, [], [], 1, now);
    const overdue = alerts.find((a) => a.type === "audit_overdue");
    expect(overdue!.message).toContain("15");
  });

  it("audit_overdue includes child name in message", () => {
    const profiles = [
      makeProfile({ id: "p1", child_name: "Bob Jones", next_audit_date: daysAgo(5) }),
    ];
    const alerts = identifyFinancialAlerts(profiles, [], [], 1, now);
    const overdue = alerts.find((a) => a.type === "audit_overdue");
    expect(overdue!.message).toContain("Bob Jones");
  });

  it("audit_overdue uses profile id", () => {
    const profiles = [
      makeProfile({ id: "profile-abc", next_audit_date: daysAgo(5) }),
    ];
    const alerts = identifyFinancialAlerts(profiles, [], [], 1, now);
    const overdue = alerts.find((a) => a.type === "audit_overdue");
    expect(overdue!.id).toBe("profile-abc");
  });

  it("does not raise audit_overdue for future next_audit_date", () => {
    const profiles = [
      makeProfile({ id: "p1", next_audit_date: daysFromNow(30) }),
    ];
    const alerts = identifyFinancialAlerts(profiles, [], [], 1, now);
    const overdue = alerts.find((a) => a.type === "audit_overdue");
    expect(overdue).toBeUndefined();
  });

  it("does not raise audit_overdue when next_audit_date is null", () => {
    const profiles = [
      makeProfile({ id: "p1", next_audit_date: null }),
    ];
    const alerts = identifyFinancialAlerts(profiles, [], [], 1, now);
    const overdue = alerts.find((a) => a.type === "audit_overdue");
    expect(overdue).toBeUndefined();
  });

  it("raises multiple audit_overdue alerts for multiple overdue profiles", () => {
    const profiles = [
      makeProfile({ id: "p1", child_name: "Alice", next_audit_date: daysAgo(10) }),
      makeProfile({ id: "p2", child_name: "Bob", next_audit_date: daysAgo(20) }),
      makeProfile({ id: "p3", child_name: "Charlie", next_audit_date: daysFromNow(30) }),
    ];
    const alerts = identifyFinancialAlerts(profiles, [], [], 3, now);
    const overdue = alerts.filter((a) => a.type === "audit_overdue");
    expect(overdue).toHaveLength(2);
  });

  // ── negative_balance ────────────────────────────────────────────────

  it("raises high alert for negative pocket_money_balance", () => {
    const profiles = [
      makeProfile({ id: "p1", child_name: "Alice", pocket_money_balance: -5.50 }),
    ];
    const alerts = identifyFinancialAlerts(profiles, [], [], 1, now);
    const neg = alerts.find((a) => a.type === "negative_balance");
    expect(neg).toBeTruthy();
    expect(neg!.severity).toBe("high");
  });

  it("negative_balance includes child name in message", () => {
    const profiles = [
      makeProfile({ id: "p1", child_name: "Zoe Brown", pocket_money_balance: -3 }),
    ];
    const alerts = identifyFinancialAlerts(profiles, [], [], 1, now);
    const neg = alerts.find((a) => a.type === "negative_balance");
    expect(neg!.message).toContain("Zoe Brown");
  });

  it("negative_balance includes absolute amount in message", () => {
    const profiles = [
      makeProfile({ id: "p1", pocket_money_balance: -12.50 }),
    ];
    const alerts = identifyFinancialAlerts(profiles, [], [], 1, now);
    const neg = alerts.find((a) => a.type === "negative_balance");
    expect(neg!.message).toContain("12.50");
  });

  it("does not raise negative_balance for zero balance", () => {
    const profiles = [
      makeProfile({ id: "p1", pocket_money_balance: 0 }),
    ];
    const alerts = identifyFinancialAlerts(profiles, [], [], 1, now);
    const neg = alerts.find((a) => a.type === "negative_balance");
    expect(neg).toBeUndefined();
  });

  it("does not raise negative_balance for positive balance", () => {
    const profiles = [
      makeProfile({ id: "p1", pocket_money_balance: 25 }),
    ];
    const alerts = identifyFinancialAlerts(profiles, [], [], 1, now);
    const neg = alerts.find((a) => a.type === "negative_balance");
    expect(neg).toBeUndefined();
  });

  it("raises multiple negative_balance alerts for multiple negative profiles", () => {
    const profiles = [
      makeProfile({ id: "p1", pocket_money_balance: -5 }),
      makeProfile({ id: "p2", pocket_money_balance: -10 }),
    ];
    const alerts = identifyFinancialAlerts(profiles, [], [], 2, now);
    const neg = alerts.filter((a) => a.type === "negative_balance");
    expect(neg).toHaveLength(2);
  });

  // ── pocket_money_not_paid ───────────────────────────────────────────

  it("raises medium alert when no pocket_money transaction in 14 days", () => {
    const profiles = [
      makeProfile({ id: "p1", child_id: "c1", child_name: "Alice", weekly_pocket_money: 10 }),
    ];
    // No pocket_money transactions at all
    const alerts = identifyFinancialAlerts(profiles, [], [], 1, now);
    const notPaid = alerts.find((a) => a.type === "pocket_money_not_paid");
    expect(notPaid).toBeTruthy();
    expect(notPaid!.severity).toBe("medium");
  });

  it("pocket_money_not_paid includes child name in message", () => {
    const profiles = [
      makeProfile({ id: "p1", child_id: "c1", child_name: "Dave Lee", weekly_pocket_money: 8 }),
    ];
    const alerts = identifyFinancialAlerts(profiles, [], [], 1, now);
    const notPaid = alerts.find((a) => a.type === "pocket_money_not_paid");
    expect(notPaid!.message).toContain("Dave Lee");
  });

  it("pocket_money_not_paid includes weekly amount in message", () => {
    const profiles = [
      makeProfile({ id: "p1", child_id: "c1", weekly_pocket_money: 12.50 }),
    ];
    const alerts = identifyFinancialAlerts(profiles, [], [], 1, now);
    const notPaid = alerts.find((a) => a.type === "pocket_money_not_paid");
    expect(notPaid!.message).toContain("12.50");
  });

  it("does not raise pocket_money_not_paid when recent payment exists", () => {
    const profiles = [
      makeProfile({ id: "p1", child_id: "c1", weekly_pocket_money: 10 }),
    ];
    const txns = [
      makeTransaction({
        id: "t1",
        child_id: "c1",
        transaction_type: "pocket_money",
        transaction_date: daysAgo(7),
      }),
    ];
    const alerts = identifyFinancialAlerts(profiles, txns, [], 1, now);
    const notPaid = alerts.find((a) => a.type === "pocket_money_not_paid");
    expect(notPaid).toBeUndefined();
  });

  it("does not raise pocket_money_not_paid when weekly_pocket_money is 0", () => {
    const profiles = [
      makeProfile({ id: "p1", child_id: "c1", weekly_pocket_money: 0 }),
    ];
    const alerts = identifyFinancialAlerts(profiles, [], [], 1, now);
    const notPaid = alerts.find((a) => a.type === "pocket_money_not_paid");
    expect(notPaid).toBeUndefined();
  });

  it("raises pocket_money_not_paid when only non-pocket_money transactions exist", () => {
    const profiles = [
      makeProfile({ id: "p1", child_id: "c1", weekly_pocket_money: 10 }),
    ];
    const txns = [
      makeTransaction({
        id: "t1",
        child_id: "c1",
        transaction_type: "expense",
        transaction_date: daysAgo(3),
      }),
    ];
    const alerts = identifyFinancialAlerts(profiles, txns, [], 1, now);
    const notPaid = alerts.find((a) => a.type === "pocket_money_not_paid");
    expect(notPaid).toBeTruthy();
  });

  it("raises pocket_money_not_paid when payment is older than 14 days", () => {
    const profiles = [
      makeProfile({ id: "p1", child_id: "c1", weekly_pocket_money: 10 }),
    ];
    const txns = [
      makeTransaction({
        id: "t1",
        child_id: "c1",
        transaction_type: "pocket_money",
        transaction_date: daysAgo(20),
      }),
    ];
    const alerts = identifyFinancialAlerts(profiles, txns, [], 1, now);
    const notPaid = alerts.find((a) => a.type === "pocket_money_not_paid");
    expect(notPaid).toBeTruthy();
  });

  it("does not raise pocket_money_not_paid for different child's transaction", () => {
    const profiles = [
      makeProfile({ id: "p1", child_id: "c1", weekly_pocket_money: 10 }),
    ];
    const txns = [
      makeTransaction({
        id: "t1",
        child_id: "c2",
        transaction_type: "pocket_money",
        transaction_date: daysAgo(3),
      }),
    ];
    const alerts = identifyFinancialAlerts(profiles, txns, [], 1, now);
    const notPaid = alerts.find((a) => a.type === "pocket_money_not_paid");
    expect(notPaid).toBeTruthy();
  });

  it("raises pocket_money_not_paid for each child without recent payment", () => {
    const profiles = [
      makeProfile({ id: "p1", child_id: "c1", child_name: "Alice", weekly_pocket_money: 10 }),
      makeProfile({ id: "p2", child_id: "c2", child_name: "Bob", weekly_pocket_money: 8 }),
    ];
    const alerts = identifyFinancialAlerts(profiles, [], [], 2, now);
    const notPaid = alerts.filter((a) => a.type === "pocket_money_not_paid");
    expect(notPaid).toHaveLength(2);
  });

  // ── audit_discrepancy ───────────────────────────────────────────────

  it("raises critical alert for audit with discrepancy_found and non-zero amount", () => {
    const audits = [
      makeAudit({
        id: "a1",
        status: "discrepancy_found",
        discrepancy_amount: 25.50,
        audit_date: daysAgo(3),
      }),
    ];
    const alerts = identifyFinancialAlerts([], [], audits, 0, now);
    const disc = alerts.find((a) => a.type === "audit_discrepancy");
    expect(disc).toBeTruthy();
    expect(disc!.severity).toBe("critical");
  });

  it("audit_discrepancy includes amount in message", () => {
    const audits = [
      makeAudit({
        id: "a1",
        status: "discrepancy_found",
        discrepancy_amount: 15.75,
      }),
    ];
    const alerts = identifyFinancialAlerts([], [], audits, 0, now);
    const disc = alerts.find((a) => a.type === "audit_discrepancy");
    expect(disc!.message).toContain("15.75");
  });

  it("audit_discrepancy includes audit date in message", () => {
    const auditDate = daysAgo(5);
    const audits = [
      makeAudit({
        id: "a1",
        status: "discrepancy_found",
        discrepancy_amount: 10,
        audit_date: auditDate,
      }),
    ];
    const alerts = identifyFinancialAlerts([], [], audits, 0, now);
    const disc = alerts.find((a) => a.type === "audit_discrepancy");
    expect(disc!.message).toContain(auditDate);
  });

  it("audit_discrepancy uses audit id", () => {
    const audits = [
      makeAudit({
        id: "audit-xyz",
        status: "discrepancy_found",
        discrepancy_amount: 10,
      }),
    ];
    const alerts = identifyFinancialAlerts([], [], audits, 0, now);
    const disc = alerts.find((a) => a.type === "audit_discrepancy");
    expect(disc!.id).toBe("audit-xyz");
  });

  it("does not raise audit_discrepancy for completed audits", () => {
    const audits = [
      makeAudit({ id: "a1", status: "completed", discrepancy_amount: 0 }),
    ];
    const alerts = identifyFinancialAlerts([], [], audits, 0, now);
    const disc = alerts.find((a) => a.type === "audit_discrepancy");
    expect(disc).toBeUndefined();
  });

  it("does not raise audit_discrepancy when discrepancy_amount is 0", () => {
    const audits = [
      makeAudit({ id: "a1", status: "discrepancy_found", discrepancy_amount: 0 }),
    ];
    const alerts = identifyFinancialAlerts([], [], audits, 0, now);
    const disc = alerts.find((a) => a.type === "audit_discrepancy");
    expect(disc).toBeUndefined();
  });

  it("raises audit_discrepancy for negative discrepancy_amount", () => {
    const audits = [
      makeAudit({
        id: "a1",
        status: "discrepancy_found",
        discrepancy_amount: -20,
      }),
    ];
    const alerts = identifyFinancialAlerts([], [], audits, 0, now);
    const disc = alerts.find((a) => a.type === "audit_discrepancy");
    expect(disc).toBeTruthy();
    expect(disc!.message).toContain("20.00");
  });

  it("raises multiple audit_discrepancy alerts for multiple discrepancies", () => {
    const audits = [
      makeAudit({ id: "a1", status: "discrepancy_found", discrepancy_amount: 10 }),
      makeAudit({ id: "a2", status: "discrepancy_found", discrepancy_amount: 25 }),
    ];
    const alerts = identifyFinancialAlerts([], [], audits, 0, now);
    const disc = alerts.filter((a) => a.type === "audit_discrepancy");
    expect(disc).toHaveLength(2);
  });

  // ── large_transaction_unwitnessed ───────────────────────────────────

  it("raises medium alert for transaction > 50 without witness", () => {
    const txns = [
      makeTransaction({
        id: "t1",
        amount: 60,
        witnessed_by: null,
        child_name: "Alice",
        transaction_date: daysAgo(2),
      }),
    ];
    const alerts = identifyFinancialAlerts([], txns, [], 0, now);
    const large = alerts.find((a) => a.type === "large_transaction_unwitnessed");
    expect(large).toBeTruthy();
    expect(large!.severity).toBe("medium");
  });

  it("large_transaction_unwitnessed includes amount in message", () => {
    const txns = [
      makeTransaction({ id: "t1", amount: 75.50, witnessed_by: null }),
    ];
    const alerts = identifyFinancialAlerts([], txns, [], 0, now);
    const large = alerts.find((a) => a.type === "large_transaction_unwitnessed");
    expect(large!.message).toContain("75.50");
  });

  it("large_transaction_unwitnessed includes child name in message", () => {
    const txns = [
      makeTransaction({ id: "t1", amount: 100, witnessed_by: null, child_name: "Eve Taylor" }),
    ];
    const alerts = identifyFinancialAlerts([], txns, [], 0, now);
    const large = alerts.find((a) => a.type === "large_transaction_unwitnessed");
    expect(large!.message).toContain("Eve Taylor");
  });

  it("large_transaction_unwitnessed uses transaction id", () => {
    const txns = [
      makeTransaction({ id: "txn-abc", amount: 55, witnessed_by: null }),
    ];
    const alerts = identifyFinancialAlerts([], txns, [], 0, now);
    const large = alerts.find((a) => a.type === "large_transaction_unwitnessed");
    expect(large!.id).toBe("txn-abc");
  });

  it("does not raise large_transaction_unwitnessed for amount <= 50", () => {
    const txns = [
      makeTransaction({ id: "t1", amount: 50, witnessed_by: null }),
    ];
    const alerts = identifyFinancialAlerts([], txns, [], 0, now);
    const large = alerts.find((a) => a.type === "large_transaction_unwitnessed");
    expect(large).toBeUndefined();
  });

  it("does not raise large_transaction_unwitnessed when witnessed", () => {
    const txns = [
      makeTransaction({ id: "t1", amount: 100, witnessed_by: "staff-3" }),
    ];
    const alerts = identifyFinancialAlerts([], txns, [], 0, now);
    const large = alerts.find((a) => a.type === "large_transaction_unwitnessed");
    expect(large).toBeUndefined();
  });

  it("does not raise large_transaction_unwitnessed for small unwitnessed transaction", () => {
    const txns = [
      makeTransaction({ id: "t1", amount: 5, witnessed_by: null }),
    ];
    const alerts = identifyFinancialAlerts([], txns, [], 0, now);
    const large = alerts.find((a) => a.type === "large_transaction_unwitnessed");
    expect(large).toBeUndefined();
  });

  it("raises multiple large_transaction_unwitnessed for multiple large unwitnessed", () => {
    const txns = [
      makeTransaction({ id: "t1", amount: 60, witnessed_by: null }),
      makeTransaction({ id: "t2", amount: 80, witnessed_by: null }),
      makeTransaction({ id: "t3", amount: 100, witnessed_by: "staff-1" }),
    ];
    const alerts = identifyFinancialAlerts([], txns, [], 0, now);
    const large = alerts.filter((a) => a.type === "large_transaction_unwitnessed");
    expect(large).toHaveLength(2);
  });

  // ── now parameter ───────────────────────────────────────────────────

  it("respects the now parameter override for audit_overdue", () => {
    const futureNow = new Date();
    futureNow.setDate(futureNow.getDate() + 60);
    const profiles = [
      makeProfile({ id: "p1", next_audit_date: daysFromNow(30) }),
    ];
    // With default now, not overdue. With futureNow, it is overdue.
    const alertsNow = identifyFinancialAlerts(profiles, [], [], 1, now);
    const alertsFuture = identifyFinancialAlerts(profiles, [], [], 1, futureNow);
    expect(alertsNow.find((a) => a.type === "audit_overdue")).toBeUndefined();
    expect(alertsFuture.find((a) => a.type === "audit_overdue")).toBeTruthy();
  });

  it("respects the now parameter for pocket_money_not_paid window", () => {
    const pastNow = new Date();
    pastNow.setDate(pastNow.getDate() - 30);
    const profiles = [
      makeProfile({ id: "p1", child_id: "c1", weekly_pocket_money: 10 }),
    ];
    const txns = [
      makeTransaction({
        id: "t1",
        child_id: "c1",
        transaction_type: "pocket_money",
        transaction_date: daysAgo(35),
      }),
    ];
    // With pastNow (30 days ago), the transaction 35 days ago is within 14 days window
    const alertsPast = identifyFinancialAlerts(profiles, txns, [], 1, pastNow);
    const notPaid = alertsPast.find((a) => a.type === "pocket_money_not_paid");
    expect(notPaid).toBeUndefined();
  });

  it("now parameter defaults correctly (does not throw without it)", () => {
    const profiles = [
      makeProfile({ id: "p1", next_audit_date: daysAgo(5) }),
    ];
    // Call without the now parameter
    const alerts = identifyFinancialAlerts(profiles, [], [], 1);
    const overdue = alerts.find((a) => a.type === "audit_overdue");
    expect(overdue).toBeTruthy();
  });

  // ── Alert structure ─────────────────────────────────────────────────

  it("each alert has required fields: type, severity, message, id", () => {
    const profiles = [
      makeProfile({
        id: "p1",
        child_id: "c1",
        pocket_money_balance: -5,
        weekly_pocket_money: 10,
        next_audit_date: daysAgo(10),
      }),
    ];
    const txns = [
      makeTransaction({ id: "t1", amount: 60, witnessed_by: null }),
    ];
    const audits = [
      makeAudit({ id: "a1", status: "discrepancy_found", discrepancy_amount: 10 }),
    ];
    const alerts = identifyFinancialAlerts(profiles, txns, audits, 3, now);
    for (const a of alerts) {
      expect(a).toHaveProperty("type");
      expect(a).toHaveProperty("severity");
      expect(a).toHaveProperty("message");
      expect(a).toHaveProperty("id");
      expect(typeof a.type).toBe("string");
      expect(["critical", "high", "medium"]).toContain(a.severity);
      expect(a.message.length).toBeGreaterThan(0);
    }
  });

  it("alert severity levels are correctly assigned across types", () => {
    const profiles = [
      makeProfile({
        id: "p1",
        child_id: "c1",
        pocket_money_balance: -5,
        weekly_pocket_money: 10,
        next_audit_date: daysAgo(10),
      }),
    ];
    const txns = [
      makeTransaction({ id: "t1", amount: 60, witnessed_by: null }),
    ];
    const audits = [
      makeAudit({ id: "a1", status: "discrepancy_found", discrepancy_amount: 10 }),
    ];
    const alerts = identifyFinancialAlerts(profiles, txns, audits, 3, now);

    const discrepancy = alerts.find((a) => a.type === "audit_discrepancy");
    expect(discrepancy!.severity).toBe("critical");

    const missingProfile = alerts.find((a) => a.type === "missing_financial_profile");
    expect(missingProfile!.severity).toBe("high");

    const negBalance = alerts.find((a) => a.type === "negative_balance");
    expect(negBalance!.severity).toBe("high");

    const auditOverdue = alerts.find((a) => a.type === "audit_overdue");
    expect(auditOverdue!.severity).toBe("medium");

    const notPaid = alerts.find((a) => a.type === "pocket_money_not_paid");
    expect(notPaid!.severity).toBe("medium");

    const large = alerts.find((a) => a.type === "large_transaction_unwitnessed");
    expect(large!.severity).toBe("medium");
  });

  // ── Combined scenarios ──────────────────────────────────────────────

  it("raises combined alerts from profiles, transactions, and audits", () => {
    const profiles = [
      makeProfile({
        id: "p1",
        child_id: "c1",
        child_name: "Alice",
        pocket_money_balance: -10,
        weekly_pocket_money: 10,
        next_audit_date: daysAgo(5),
      }),
    ];
    const txns = [
      makeTransaction({ id: "t1", amount: 75, witnessed_by: null }),
    ];
    const audits = [
      makeAudit({ id: "a1", status: "discrepancy_found", discrepancy_amount: 20 }),
    ];
    const alerts = identifyFinancialAlerts(profiles, txns, audits, 3, now);
    const types = alerts.map((a) => a.type);
    expect(types).toContain("missing_financial_profile");
    expect(types).toContain("audit_overdue");
    expect(types).toContain("negative_balance");
    expect(types).toContain("pocket_money_not_paid");
    expect(types).toContain("audit_discrepancy");
    expect(types).toContain("large_transaction_unwitnessed");
  });

  it("raises no alerts when everything is compliant across all categories", () => {
    const profiles = [
      makeProfile({
        id: "p1",
        child_id: "c1",
        pocket_money_balance: 50,
        weekly_pocket_money: 10,
        next_audit_date: daysFromNow(30),
      }),
      makeProfile({
        id: "p2",
        child_id: "c2",
        pocket_money_balance: 25,
        weekly_pocket_money: 8,
        next_audit_date: daysFromNow(45),
      }),
    ];
    const txns = [
      makeTransaction({
        id: "t1",
        child_id: "c1",
        transaction_type: "pocket_money",
        transaction_date: daysAgo(3),
        amount: 10,
        witnessed_by: "staff-2",
      }),
      makeTransaction({
        id: "t2",
        child_id: "c2",
        transaction_type: "pocket_money",
        transaction_date: daysAgo(5),
        amount: 8,
        witnessed_by: "staff-3",
      }),
    ];
    const audits = [
      makeAudit({ id: "a1", status: "completed" }),
    ];
    const alerts = identifyFinancialAlerts(profiles, txns, audits, 2, now);
    expect(alerts).toHaveLength(0);
  });

  it("empty inputs return no alerts when totalChildren is 0", () => {
    const alerts = identifyFinancialAlerts([], [], [], 0, now);
    expect(alerts).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. CRUD FALLBACK (Supabase disabled)
// ═══════════════════════════════════════════════════════════════════════════

describe("CRUD fallback (Supabase disabled)", () => {
  // ── listProfiles ──────────────────────────────────────────────────────

  it("listProfiles returns ok: true with empty array", async () => {
    const result = await listProfiles("home-1");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listProfiles returns ok: true with childId filter", async () => {
    const result = await listProfiles("home-1", { childId: "child-1" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listProfiles result data is an array type", async () => {
    const result = await listProfiles("home-1");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(Array.isArray(result.data)).toBe(true);
    }
  });

  // ── createProfile ─────────────────────────────────────────────────────

  it("createProfile returns ok: false with error message", async () => {
    const result = await createProfile({
      homeId: "home-1",
      childId: "child-1",
      childName: "Alice Smith",
      weeklyPocketMoney: 10,
      savingsBalance: 100,
      pocketMoneyBalance: 25,
      financialLiteracyLevel: "developing",
      hasBankAccount: false,
      bankAccountType: undefined,
      savingsGoal: undefined,
      savingsTarget: undefined,
      financialSkillsNotes: undefined,
      nextAuditDate: undefined,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Supabase not configured");
    }
  });

  it("createProfile error message is a string", async () => {
    const result = await createProfile({
      homeId: "home-1",
      childId: "child-1",
      childName: "Test",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(typeof result.error).toBe("string");
    }
  });

  // ── updateProfile ─────────────────────────────────────────────────────

  it("updateProfile returns ok: false with error message", async () => {
    const result = await updateProfile("profile-1", { weekly_pocket_money: 15 });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Supabase not configured");
    }
  });

  it("updateProfile returns error for any update payload", async () => {
    const result = await updateProfile("profile-1", {
      savings_balance: 200,
      pocket_money_balance: 50,
    });
    expect(result.ok).toBe(false);
  });

  // ── listTransactions ──────────────────────────────────────────────────

  it("listTransactions returns ok: true with empty array", async () => {
    const result = await listTransactions("home-1");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listTransactions returns ok: true with filters", async () => {
    const result = await listTransactions("home-1", {
      childId: "child-1",
      transactionType: "pocket_money",
      accountType: "pocket_money",
      limit: 10,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listTransactions result data is an array type", async () => {
    const result = await listTransactions("home-1");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(Array.isArray(result.data)).toBe(true);
    }
  });

  // ── createTransaction ─────────────────────────────────────────────────

  it("createTransaction returns ok: false with error message", async () => {
    const result = await createTransaction({
      homeId: "home-1",
      childId: "child-1",
      childName: "Alice Smith",
      transactionDate: daysAgo(1),
      transactionType: "pocket_money",
      accountType: "pocket_money",
      amount: 10,
      description: "Weekly pocket money",
      authorisedBy: "staff-1",
      witnessedBy: undefined,
      childPresent: true,
      balanceAfter: undefined,
      notes: undefined,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Supabase not configured");
    }
  });

  // ── listAudits ────────────────────────────────────────────────────────

  it("listAudits returns ok: true with empty array", async () => {
    const result = await listAudits("home-1");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listAudits returns ok: true with status filter", async () => {
    const result = await listAudits("home-1", { status: "completed" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  // ── createAudit ───────────────────────────────────────────────────────

  it("createAudit returns ok: false with error message", async () => {
    const result = await createAudit({
      homeId: "home-1",
      auditDate: daysAgo(1),
      auditedBy: "manager-1",
      status: "pending",
      childrenAudited: ["child-1"],
      expectedTotal: 200,
      actualTotal: 200,
      discrepancyAmount: 0,
      discrepancyExplanation: undefined,
      correctiveAction: undefined,
      notes: undefined,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Supabase not configured");
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. EDGE CASES
// ═══════════════════════════════════════════════════════════════════════════

describe("Edge cases", () => {
  it("handles large number of transactions in metrics", () => {
    const txns: FinancialTransaction[] = [];
    for (let i = 0; i < 200; i++) {
      txns.push(
        makeTransaction({
          id: `t${i}`,
          transaction_type: i % 2 === 0 ? "pocket_money" : "expense",
          spending_category: i % 3 === 0 ? "food_drink" : null,
          transaction_date: daysAgo(i % 40),
        }),
      );
    }
    const m = computeFinancialMetrics([], txns, [], 0);
    expect(m.by_transaction_type["pocket_money"]).toBe(100);
    expect(m.by_transaction_type["expense"]).toBe(100);
    expect(m.transactions_this_month).toBeGreaterThan(0);
  });

  it("handles zero weekly pocket money across all profiles", () => {
    const profiles = [
      makeProfile({ id: "p1", weekly_pocket_money: 0 }),
      makeProfile({ id: "p2", weekly_pocket_money: 0 }),
    ];
    const m = computeFinancialMetrics(profiles, [], [], 2);
    expect(m.avg_weekly_pocket_money).toBe(0);
  });

  it("handles zero balances across all profiles", () => {
    const profiles = [
      makeProfile({ id: "p1", pocket_money_balance: 0, savings_balance: 0 }),
      makeProfile({ id: "p2", pocket_money_balance: 0, savings_balance: 0 }),
    ];
    const m = computeFinancialMetrics(profiles, [], [], 2);
    expect(m.total_pocket_money_balance).toBe(0);
    expect(m.total_savings_balance).toBe(0);
  });

  it("handles all financial literacy levels being not_assessed", () => {
    const profiles = [
      makeProfile({ id: "p1", financial_literacy_level: "not_assessed" }),
      makeProfile({ id: "p2", financial_literacy_level: "not_assessed" }),
    ];
    const m = computeFinancialMetrics(profiles, [], [], 2);
    expect(m.financial_literacy_distribution["not_assessed"]).toBe(2);
    expect(Object.keys(m.financial_literacy_distribution)).toHaveLength(1);
  });

  it("handles multiple discrepancies with varying amounts", () => {
    const audits = [
      makeAudit({ id: "a1", status: "discrepancy_found", discrepancy_amount: 5 }),
      makeAudit({ id: "a2", status: "discrepancy_found", discrepancy_amount: 100 }),
      makeAudit({ id: "a3", status: "discrepancy_found", discrepancy_amount: -15 }),
    ];
    const alerts = identifyFinancialAlerts([], [], audits, 0, new Date());
    const disc = alerts.filter((a) => a.type === "audit_discrepancy");
    expect(disc).toHaveLength(3);
  });

  it("boundary: transaction of exactly 50.01 without witness triggers alert", () => {
    const txns = [
      makeTransaction({ id: "t1", amount: 50.01, witnessed_by: null }),
    ];
    const alerts = identifyFinancialAlerts([], txns, [], 0, new Date());
    const large = alerts.find((a) => a.type === "large_transaction_unwitnessed");
    expect(large).toBeTruthy();
  });

  it("boundary: transaction of exactly 50 without witness does not trigger alert", () => {
    const txns = [
      makeTransaction({ id: "t1", amount: 50, witnessed_by: null }),
    ];
    const alerts = identifyFinancialAlerts([], txns, [], 0, new Date());
    const large = alerts.find((a) => a.type === "large_transaction_unwitnessed");
    expect(large).toBeUndefined();
  });

  it("handles all bank accounts being true", () => {
    const profiles = [
      makeProfile({ id: "p1", has_bank_account: true }),
      makeProfile({ id: "p2", has_bank_account: true }),
      makeProfile({ id: "p3", has_bank_account: true }),
    ];
    const m = computeFinancialMetrics(profiles, [], [], 3);
    expect(m.children_with_bank_accounts).toBe(3);
  });

  it("handles large transaction count in alerts without errors", () => {
    const txns: FinancialTransaction[] = [];
    for (let i = 0; i < 100; i++) {
      txns.push(
        makeTransaction({
          id: `t${i}`,
          amount: i + 1,
          witnessed_by: i % 2 === 0 ? "staff-1" : null,
        }),
      );
    }
    // Should not throw
    const alerts = identifyFinancialAlerts([], txns, [], 0, new Date());
    const large = alerts.filter((a) => a.type === "large_transaction_unwitnessed");
    // Odd-indexed txns with amount > 50 and no witness: i=51,53,55,...,99 -> amounts 52,54,...,100
    // i goes from 0 to 99. Unwitnessed: odd i. Amount = i+1 > 50 means i >= 50.
    // Odd i >= 50: 51,53,55,57,59,61,63,65,67,69,71,73,75,77,79,81,83,85,87,89,91,93,95,97,99 = 25
    expect(large).toHaveLength(25);
  });

  it("handles profile with savings_balance exceeding savings_target", () => {
    const profiles = [
      makeProfile({ id: "p1", savings_target: 100, savings_balance: 500 }),
    ];
    const m = computeFinancialMetrics(profiles, [], [], 1);
    expect(m.savings_goal_progress).toBe(100);
  });
});
