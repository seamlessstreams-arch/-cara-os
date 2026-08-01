// ══════════════════════════════════════════════════════════════════════════════
// CARA — CHILDREN'S FUND MANAGEMENT SERVICE TESTS
// Pure-function unit tests for fund metrics computation, alert
// identification, and constant validation.
// CHR 2015 Reg 34 (money — financial management),
// Reg 9 (children's plans — financial provisions),
// Reg 45 (review — financial accountability).
//
// Covers: fund deposits, withdrawals, pocket money, savings accounts,
// financial audits, and money management education.
//
// SCCIF: Overall Experiences — "Children's money is managed safely
// and transparently." "Children learn financial skills."
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, vi } from "vitest";
import crypto from "crypto";

vi.mock("@/lib/supabase/server", () => ({
  isSupabaseEnabled: () => false,
  createServerClient: () => null,
}));

import {
  _testing,
  TRANSACTION_TYPES,
  FUND_CATEGORIES,
  AUTHORISATION_STATUSES,
  AUDIT_RESULTS,
} from "../childrens-fund-management-service";

import type { FundTransaction } from "../childrens-fund-management-service";

const { computeFundMetrics, identifyFundAlerts } = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

/** Build a minimal FundTransaction with sensible defaults. */
function makeTransaction(
  overrides: Partial<FundTransaction> = {},
): FundTransaction {
  return {
    id: crypto.randomUUID(),
    home_id: "home-1",
    child_name: "Alice Smith",
    child_id: "child-1",
    transaction_date: "2024-06-01",
    transaction_type: "pocket_money",
    fund_category: "pocket_money",
    amount: 10,
    is_credit: true,
    running_balance: 100,
    authorisation_status: "authorised",
    authorised_by: "Manager Jones",
    receipt_attached: true,
    child_signed: true,
    staff_signed: true,
    second_signatory: false,
    purpose: "Weekly pocket money",
    audit_result: "balanced",
    audit_date: "2024-06-15",
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: "2024-06-01T10:00:00.000Z",
    updated_at: "2024-06-01T10:00:00.000Z",
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

describe("TRANSACTION_TYPES", () => {
  it("has exactly 13 entries", () => {
    expect(TRANSACTION_TYPES).toHaveLength(13);
  });

  it("contains unique type values", () => {
    const values = TRANSACTION_TYPES.map((t) => t.type);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = TRANSACTION_TYPES.map((t) => t.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("each entry has a non-empty label", () => {
    for (const t of TRANSACTION_TYPES) {
      expect(t.label.length).toBeGreaterThan(0);
    }
  });

  it("includes pocket_money", () => {
    expect(TRANSACTION_TYPES.find((t) => t.type === "pocket_money")).toBeTruthy();
  });

  it("includes birthday_allowance", () => {
    expect(TRANSACTION_TYPES.find((t) => t.type === "birthday_allowance")).toBeTruthy();
  });

  it("includes festival_allowance", () => {
    expect(TRANSACTION_TYPES.find((t) => t.type === "festival_allowance")).toBeTruthy();
  });

  it("includes savings_deposit", () => {
    expect(TRANSACTION_TYPES.find((t) => t.type === "savings_deposit")).toBeTruthy();
  });

  it("includes savings_withdrawal", () => {
    expect(TRANSACTION_TYPES.find((t) => t.type === "savings_withdrawal")).toBeTruthy();
  });

  it("includes clothing_allowance", () => {
    expect(TRANSACTION_TYPES.find((t) => t.type === "clothing_allowance")).toBeTruthy();
  });

  it("includes gift_received", () => {
    expect(TRANSACTION_TYPES.find((t) => t.type === "gift_received")).toBeTruthy();
  });

  it("includes earnings", () => {
    expect(TRANSACTION_TYPES.find((t) => t.type === "earnings")).toBeTruthy();
  });

  it("includes refund", () => {
    expect(TRANSACTION_TYPES.find((t) => t.type === "refund")).toBeTruthy();
  });

  it("includes other_credit", () => {
    expect(TRANSACTION_TYPES.find((t) => t.type === "other_credit")).toBeTruthy();
  });

  it("includes purchase", () => {
    expect(TRANSACTION_TYPES.find((t) => t.type === "purchase")).toBeTruthy();
  });

  it("includes activity_expense", () => {
    expect(TRANSACTION_TYPES.find((t) => t.type === "activity_expense")).toBeTruthy();
  });

  it("includes other_debit", () => {
    expect(TRANSACTION_TYPES.find((t) => t.type === "other_debit")).toBeTruthy();
  });
});

describe("FUND_CATEGORIES", () => {
  it("has exactly 7 entries", () => {
    expect(FUND_CATEGORIES).toHaveLength(7);
  });

  it("contains unique category values", () => {
    const values = FUND_CATEGORIES.map((c) => c.category);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = FUND_CATEGORIES.map((c) => c.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("each entry has a non-empty label", () => {
    for (const c of FUND_CATEGORIES) {
      expect(c.label.length).toBeGreaterThan(0);
    }
  });

  it("includes pocket_money", () => {
    expect(FUND_CATEGORIES.find((c) => c.category === "pocket_money")).toBeTruthy();
  });

  it("includes savings", () => {
    expect(FUND_CATEGORIES.find((c) => c.category === "savings")).toBeTruthy();
  });

  it("includes clothing", () => {
    expect(FUND_CATEGORIES.find((c) => c.category === "clothing")).toBeTruthy();
  });

  it("includes birthday_festival", () => {
    expect(FUND_CATEGORIES.find((c) => c.category === "birthday_festival")).toBeTruthy();
  });

  it("includes personal_expenses", () => {
    expect(FUND_CATEGORIES.find((c) => c.category === "personal_expenses")).toBeTruthy();
  });

  it("includes educational", () => {
    expect(FUND_CATEGORIES.find((c) => c.category === "educational")).toBeTruthy();
  });

  it("includes other", () => {
    expect(FUND_CATEGORIES.find((c) => c.category === "other")).toBeTruthy();
  });
});

describe("AUTHORISATION_STATUSES", () => {
  it("has exactly 5 entries", () => {
    expect(AUTHORISATION_STATUSES).toHaveLength(5);
  });

  it("contains unique status values", () => {
    const values = AUTHORISATION_STATUSES.map((s) => s.status);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = AUTHORISATION_STATUSES.map((s) => s.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("each entry has a non-empty label", () => {
    for (const s of AUTHORISATION_STATUSES) {
      expect(s.label.length).toBeGreaterThan(0);
    }
  });

  it("includes authorised", () => {
    expect(AUTHORISATION_STATUSES.find((s) => s.status === "authorised")).toBeTruthy();
  });

  it("includes pending_authorisation", () => {
    expect(AUTHORISATION_STATUSES.find((s) => s.status === "pending_authorisation")).toBeTruthy();
  });

  it("includes declined", () => {
    expect(AUTHORISATION_STATUSES.find((s) => s.status === "declined")).toBeTruthy();
  });

  it("includes auto_approved", () => {
    expect(AUTHORISATION_STATUSES.find((s) => s.status === "auto_approved")).toBeTruthy();
  });

  it("includes retrospective", () => {
    expect(AUTHORISATION_STATUSES.find((s) => s.status === "retrospective")).toBeTruthy();
  });
});

describe("AUDIT_RESULTS", () => {
  it("has exactly 4 entries", () => {
    expect(AUDIT_RESULTS).toHaveLength(4);
  });

  it("contains unique result values", () => {
    const values = AUDIT_RESULTS.map((r) => r.result);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = AUDIT_RESULTS.map((r) => r.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("each entry has a non-empty label", () => {
    for (const r of AUDIT_RESULTS) {
      expect(r.label.length).toBeGreaterThan(0);
    }
  });

  it("includes balanced", () => {
    expect(AUDIT_RESULTS.find((r) => r.result === "balanced")).toBeTruthy();
  });

  it("includes discrepancy_found", () => {
    expect(AUDIT_RESULTS.find((r) => r.result === "discrepancy_found")).toBeTruthy();
  });

  it("includes not_audited", () => {
    expect(AUDIT_RESULTS.find((r) => r.result === "not_audited")).toBeTruthy();
  });

  it("includes under_investigation", () => {
    expect(AUDIT_RESULTS.find((r) => r.result === "under_investigation")).toBeTruthy();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. computeFundMetrics
// ═══════════════════════════════════════════════════════════════════════════

describe("computeFundMetrics", () => {
  // ── Empty array ──────────────────────────────────────────────────────
  describe("empty transactions", () => {
    it("returns zero total_transactions", () => {
      expect(computeFundMetrics([]).total_transactions).toBe(0);
    });

    it("returns zero total_credits", () => {
      expect(computeFundMetrics([]).total_credits).toBe(0);
    });

    it("returns zero total_debits", () => {
      expect(computeFundMetrics([]).total_debits).toBe(0);
    });

    it("returns zero total_credit_amount", () => {
      expect(computeFundMetrics([]).total_credit_amount).toBe(0);
    });

    it("returns zero total_debit_amount", () => {
      expect(computeFundMetrics([]).total_debit_amount).toBe(0);
    });

    it("returns zero net_balance", () => {
      expect(computeFundMetrics([]).net_balance).toBe(0);
    });

    it("returns zero unique_children", () => {
      expect(computeFundMetrics([]).unique_children).toBe(0);
    });

    it("returns zero receipt_attached_rate", () => {
      expect(computeFundMetrics([]).receipt_attached_rate).toBeNull();;
    });

    it("returns zero child_signed_rate", () => {
      expect(computeFundMetrics([]).child_signed_rate).toBeNull();;
    });

    it("returns zero staff_signed_rate", () => {
      expect(computeFundMetrics([]).staff_signed_rate).toBeNull();;
    });

    it("returns zero second_signatory_rate", () => {
      expect(computeFundMetrics([]).second_signatory_rate).toBeNull();;
    });

    it("returns zero authorised_rate", () => {
      expect(computeFundMetrics([]).authorised_rate).toBeNull();;
    });

    it("returns zero pending_authorisation_count", () => {
      expect(computeFundMetrics([]).pending_authorisation_count).toBe(0);
    });

    it("returns zero discrepancy_count", () => {
      expect(computeFundMetrics([]).discrepancy_count).toBe(0);
    });

    it("returns zero not_audited_count", () => {
      expect(computeFundMetrics([]).not_audited_count).toBe(0);
    });

    it("returns empty by_transaction_type", () => {
      expect(computeFundMetrics([]).by_transaction_type).toEqual({});
    });

    it("returns empty by_fund_category", () => {
      expect(computeFundMetrics([]).by_fund_category).toEqual({});
    });

    it("returns empty by_authorisation_status", () => {
      expect(computeFundMetrics([]).by_authorisation_status).toEqual({});
    });

    it("returns empty by_audit_result", () => {
      expect(computeFundMetrics([]).by_audit_result).toEqual({});
    });
  });

  // ── Single record ──────────────────────────────────────────────────
  describe("single credit transaction", () => {
    const single = [makeTransaction()];

    it("total_transactions is 1", () => {
      expect(computeFundMetrics(single).total_transactions).toBe(1);
    });

    it("total_credits is 1 for credit transaction", () => {
      expect(computeFundMetrics(single).total_credits).toBe(1);
    });

    it("total_debits is 0 for credit transaction", () => {
      expect(computeFundMetrics(single).total_debits).toBe(0);
    });

    it("total_credit_amount equals amount", () => {
      expect(computeFundMetrics(single).total_credit_amount).toBe(10);
    });

    it("total_debit_amount is 0 for credit transaction", () => {
      expect(computeFundMetrics(single).total_debit_amount).toBe(0);
    });

    it("net_balance equals credit amount", () => {
      expect(computeFundMetrics(single).net_balance).toBe(10);
    });

    it("unique_children is 1", () => {
      expect(computeFundMetrics(single).unique_children).toBe(1);
    });

    it("receipt_attached_rate is 100 when receipt attached", () => {
      expect(computeFundMetrics(single).receipt_attached_rate).toBe(100);
    });

    it("child_signed_rate is 100 when child signed", () => {
      expect(computeFundMetrics(single).child_signed_rate).toBe(100);
    });

    it("staff_signed_rate is 100 when staff signed", () => {
      expect(computeFundMetrics(single).staff_signed_rate).toBe(100);
    });

    it("second_signatory_rate is 0 when second signatory is false", () => {
      expect(computeFundMetrics(single).second_signatory_rate).toBe(0);
    });

    it("authorised_rate is 100 when authorised", () => {
      expect(computeFundMetrics(single).authorised_rate).toBe(100);
    });

    it("pending_authorisation_count is 0 for authorised transaction", () => {
      expect(computeFundMetrics(single).pending_authorisation_count).toBe(0);
    });

    it("discrepancy_count is 0 for balanced audit", () => {
      expect(computeFundMetrics(single).discrepancy_count).toBe(0);
    });

    it("not_audited_count is 0 for balanced audit", () => {
      expect(computeFundMetrics(single).not_audited_count).toBe(0);
    });

    it("by_transaction_type groups single record correctly", () => {
      expect(computeFundMetrics(single).by_transaction_type).toEqual({ pocket_money: 1 });
    });

    it("by_fund_category groups single record correctly", () => {
      expect(computeFundMetrics(single).by_fund_category).toEqual({ pocket_money: 1 });
    });

    it("by_authorisation_status groups single record correctly", () => {
      expect(computeFundMetrics(single).by_authorisation_status).toEqual({ authorised: 1 });
    });

    it("by_audit_result groups single record correctly", () => {
      expect(computeFundMetrics(single).by_audit_result).toEqual({ balanced: 1 });
    });
  });

  // ── Single debit ─────────────────────────────────────────────────────
  describe("single debit transaction", () => {
    const debit = [makeTransaction({ is_credit: false, amount: 25, transaction_type: "purchase", fund_category: "personal_expenses" })];

    it("total_credits is 0 for debit transaction", () => {
      expect(computeFundMetrics(debit).total_credits).toBe(0);
    });

    it("total_debits is 1 for debit transaction", () => {
      expect(computeFundMetrics(debit).total_debits).toBe(1);
    });

    it("total_credit_amount is 0 for debit transaction", () => {
      expect(computeFundMetrics(debit).total_credit_amount).toBe(0);
    });

    it("total_debit_amount equals amount", () => {
      expect(computeFundMetrics(debit).total_debit_amount).toBe(25);
    });

    it("net_balance is negative for debit-only", () => {
      expect(computeFundMetrics(debit).net_balance).toBe(-25);
    });
  });

  // ── Multiple records ─────────────────────────────────────────────────
  describe("multiple transactions", () => {
    const records = [
      makeTransaction({
        id: "t-1",
        child_id: "child-1",
        child_name: "Alice",
        is_credit: true,
        amount: 50,
        transaction_type: "pocket_money",
        fund_category: "pocket_money",
        authorisation_status: "authorised",
        receipt_attached: true,
        child_signed: true,
        staff_signed: true,
        second_signatory: true,
        audit_result: "balanced",
      }),
      makeTransaction({
        id: "t-2",
        child_id: "child-2",
        child_name: "Bob",
        is_credit: false,
        amount: 20,
        transaction_type: "purchase",
        fund_category: "personal_expenses",
        authorisation_status: "pending_authorisation",
        receipt_attached: false,
        child_signed: false,
        staff_signed: true,
        second_signatory: false,
        audit_result: "not_audited",
      }),
      makeTransaction({
        id: "t-3",
        child_id: "child-1",
        child_name: "Alice",
        is_credit: true,
        amount: 30,
        transaction_type: "birthday_allowance",
        fund_category: "birthday_festival",
        authorisation_status: "auto_approved",
        receipt_attached: true,
        child_signed: true,
        staff_signed: false,
        second_signatory: false,
        audit_result: "discrepancy_found",
      }),
      makeTransaction({
        id: "t-4",
        child_id: "child-3",
        child_name: "Charlie",
        is_credit: false,
        amount: 15,
        transaction_type: "activity_expense",
        fund_category: "other",
        authorisation_status: "declined",
        receipt_attached: false,
        child_signed: false,
        staff_signed: false,
        second_signatory: false,
        audit_result: "under_investigation",
      }),
      makeTransaction({
        id: "t-5",
        child_id: "child-2",
        child_name: "Bob",
        is_credit: true,
        amount: 100,
        transaction_type: "savings_deposit",
        fund_category: "savings",
        authorisation_status: "retrospective",
        receipt_attached: true,
        child_signed: true,
        staff_signed: true,
        second_signatory: true,
        audit_result: "balanced",
      }),
    ];

    it("total_transactions is 5", () => {
      expect(computeFundMetrics(records).total_transactions).toBe(5);
    });

    it("total_credits is 3", () => {
      expect(computeFundMetrics(records).total_credits).toBe(3);
    });

    it("total_debits is 2", () => {
      expect(computeFundMetrics(records).total_debits).toBe(2);
    });

    it("total_credit_amount is 180 (50+30+100)", () => {
      expect(computeFundMetrics(records).total_credit_amount).toBe(180);
    });

    it("total_debit_amount is 35 (20+15)", () => {
      expect(computeFundMetrics(records).total_debit_amount).toBe(35);
    });

    it("net_balance is 145 (180-35)", () => {
      expect(computeFundMetrics(records).net_balance).toBe(145);
    });

    it("unique_children is 3", () => {
      expect(computeFundMetrics(records).unique_children).toBe(3);
    });

    it("receipt_attached_rate is 60 (3 of 5)", () => {
      expect(computeFundMetrics(records).receipt_attached_rate).toBe(60);
    });

    it("child_signed_rate is 60 (3 of 5)", () => {
      expect(computeFundMetrics(records).child_signed_rate).toBe(60);
    });

    it("staff_signed_rate is 60 (3 of 5)", () => {
      expect(computeFundMetrics(records).staff_signed_rate).toBe(60);
    });

    it("second_signatory_rate is 40 (2 of 5)", () => {
      expect(computeFundMetrics(records).second_signatory_rate).toBe(40);
    });

    it("authorised_rate is 40 (authorised + auto_approved = 2 of 5)", () => {
      expect(computeFundMetrics(records).authorised_rate).toBe(40);
    });

    it("pending_authorisation_count is 1", () => {
      expect(computeFundMetrics(records).pending_authorisation_count).toBe(1);
    });

    it("discrepancy_count is 1", () => {
      expect(computeFundMetrics(records).discrepancy_count).toBe(1);
    });

    it("not_audited_count is 1", () => {
      expect(computeFundMetrics(records).not_audited_count).toBe(1);
    });

    it("by_transaction_type groups correctly", () => {
      expect(computeFundMetrics(records).by_transaction_type).toEqual({
        pocket_money: 1,
        purchase: 1,
        birthday_allowance: 1,
        activity_expense: 1,
        savings_deposit: 1,
      });
    });

    it("by_fund_category groups correctly", () => {
      expect(computeFundMetrics(records).by_fund_category).toEqual({
        pocket_money: 1,
        personal_expenses: 1,
        birthday_festival: 1,
        other: 1,
        savings: 1,
      });
    });

    it("by_authorisation_status groups correctly", () => {
      expect(computeFundMetrics(records).by_authorisation_status).toEqual({
        authorised: 1,
        pending_authorisation: 1,
        auto_approved: 1,
        declined: 1,
        retrospective: 1,
      });
    });

    it("by_audit_result groups correctly", () => {
      expect(computeFundMetrics(records).by_audit_result).toEqual({
        balanced: 2,
        not_audited: 1,
        discrepancy_found: 1,
        under_investigation: 1,
      });
    });
  });

  // ── unique_children logic ────────────────────────────────────────────
  describe("unique_children logic", () => {
    it("counts 1 child when all transactions belong to same child", () => {
      const txs = [
        makeTransaction({ id: "t-1", child_id: "child-A" }),
        makeTransaction({ id: "t-2", child_id: "child-A" }),
        makeTransaction({ id: "t-3", child_id: "child-A" }),
      ];
      expect(computeFundMetrics(txs).unique_children).toBe(1);
    });

    it("counts each distinct child_id", () => {
      const txs = [
        makeTransaction({ id: "t-1", child_id: "child-A" }),
        makeTransaction({ id: "t-2", child_id: "child-B" }),
        makeTransaction({ id: "t-3", child_id: "child-C" }),
        makeTransaction({ id: "t-4", child_id: "child-A" }),
      ];
      expect(computeFundMetrics(txs).unique_children).toBe(3);
    });

    it("counts 2 for exactly 2 different children", () => {
      const txs = [
        makeTransaction({ id: "t-1", child_id: "child-X" }),
        makeTransaction({ id: "t-2", child_id: "child-Y" }),
      ];
      expect(computeFundMetrics(txs).unique_children).toBe(2);
    });
  });

  // ── Credit/debit amount rounding ─────────────────────────────────────
  describe("amount rounding", () => {
    it("rounds total_credit_amount to 2 decimal places", () => {
      const txs = [
        makeTransaction({ id: "t-1", is_credit: true, amount: 10.1 }),
        makeTransaction({ id: "t-2", is_credit: true, amount: 10.2 }),
        makeTransaction({ id: "t-3", is_credit: true, amount: 10.3 }),
      ];
      // 10.1 + 10.2 + 10.3 = 30.6 (floating point could cause issues)
      expect(computeFundMetrics(txs).total_credit_amount).toBe(30.6);
    });

    it("rounds total_debit_amount to 2 decimal places", () => {
      const txs = [
        makeTransaction({ id: "t-1", is_credit: false, amount: 0.1 }),
        makeTransaction({ id: "t-2", is_credit: false, amount: 0.2 }),
      ];
      expect(computeFundMetrics(txs).total_debit_amount).toBe(0.3);
    });

    it("rounds net_balance to 2 decimal places", () => {
      const txs = [
        makeTransaction({ id: "t-1", is_credit: true, amount: 10.1 }),
        makeTransaction({ id: "t-2", is_credit: false, amount: 3.3 }),
      ];
      // 10.1 - 3.3 = 6.8
      expect(computeFundMetrics(txs).net_balance).toBe(6.8);
    });

    it("handles floating point edge case for net_balance", () => {
      const txs = [
        makeTransaction({ id: "t-1", is_credit: true, amount: 0.1 }),
        makeTransaction({ id: "t-2", is_credit: true, amount: 0.2 }),
        makeTransaction({ id: "t-3", is_credit: false, amount: 0.3 }),
      ];
      // (0.1 + 0.2) - 0.3 should be 0, not floating point noise
      expect(computeFundMetrics(txs).net_balance).toBe(0);
    });
  });

  // ── authorised_rate logic ────────────────────────────────────────────
  describe("authorised_rate logic", () => {
    it("counts authorised as authorised", () => {
      const txs = [makeTransaction({ authorisation_status: "authorised" })];
      expect(computeFundMetrics(txs).authorised_rate).toBe(100);
    });

    it("counts auto_approved as authorised", () => {
      const txs = [makeTransaction({ authorisation_status: "auto_approved" })];
      expect(computeFundMetrics(txs).authorised_rate).toBe(100);
    });

    it("does NOT count pending_authorisation as authorised", () => {
      const txs = [makeTransaction({ authorisation_status: "pending_authorisation" })];
      expect(computeFundMetrics(txs).authorised_rate).toBe(0);
    });

    it("does NOT count declined as authorised", () => {
      const txs = [makeTransaction({ authorisation_status: "declined" })];
      expect(computeFundMetrics(txs).authorised_rate).toBe(0);
    });

    it("does NOT count retrospective as authorised", () => {
      const txs = [makeTransaction({ authorisation_status: "retrospective" })];
      expect(computeFundMetrics(txs).authorised_rate).toBe(0);
    });

    it("calculates correctly for mix of authorised and auto_approved", () => {
      const txs = [
        makeTransaction({ id: "t-1", authorisation_status: "authorised" }),
        makeTransaction({ id: "t-2", authorisation_status: "auto_approved" }),
        makeTransaction({ id: "t-3", authorisation_status: "pending_authorisation" }),
      ];
      // 2 of 3 = 66.7
      expect(computeFundMetrics(txs).authorised_rate).toBe(66.7);
    });
  });

  // ── Rate rounding consistency ──────────────────────────────────────────
  describe("rate rounding consistency", () => {
    it("receipt_attached_rate rounds 1/3 to 33.3", () => {
      const txs = [
        makeTransaction({ id: "t-1", receipt_attached: true }),
        makeTransaction({ id: "t-2", receipt_attached: false }),
        makeTransaction({ id: "t-3", receipt_attached: false }),
      ];
      expect(computeFundMetrics(txs).receipt_attached_rate).toBe(33.3);
    });

    it("receipt_attached_rate rounds 2/3 to 66.7", () => {
      const txs = [
        makeTransaction({ id: "t-1", receipt_attached: true }),
        makeTransaction({ id: "t-2", receipt_attached: true }),
        makeTransaction({ id: "t-3", receipt_attached: false }),
      ];
      expect(computeFundMetrics(txs).receipt_attached_rate).toBe(66.7);
    });

    it("child_signed_rate rounds 1/3 to 33.3", () => {
      const txs = [
        makeTransaction({ id: "t-1", child_signed: true }),
        makeTransaction({ id: "t-2", child_signed: false }),
        makeTransaction({ id: "t-3", child_signed: false }),
      ];
      expect(computeFundMetrics(txs).child_signed_rate).toBe(33.3);
    });

    it("child_signed_rate rounds 2/3 to 66.7", () => {
      const txs = [
        makeTransaction({ id: "t-1", child_signed: true }),
        makeTransaction({ id: "t-2", child_signed: true }),
        makeTransaction({ id: "t-3", child_signed: false }),
      ];
      expect(computeFundMetrics(txs).child_signed_rate).toBe(66.7);
    });

    it("staff_signed_rate rounds 1/3 to 33.3", () => {
      const txs = [
        makeTransaction({ id: "t-1", staff_signed: true }),
        makeTransaction({ id: "t-2", staff_signed: false }),
        makeTransaction({ id: "t-3", staff_signed: false }),
      ];
      expect(computeFundMetrics(txs).staff_signed_rate).toBe(33.3);
    });

    it("second_signatory_rate rounds 1/3 to 33.3", () => {
      const txs = [
        makeTransaction({ id: "t-1", second_signatory: true }),
        makeTransaction({ id: "t-2", second_signatory: false }),
        makeTransaction({ id: "t-3", second_signatory: false }),
      ];
      expect(computeFundMetrics(txs).second_signatory_rate).toBe(33.3);
    });

    it("all rates are 100 when all booleans are true for 1 record", () => {
      const txs = [
        makeTransaction({
          receipt_attached: true,
          child_signed: true,
          staff_signed: true,
          second_signatory: true,
          authorisation_status: "authorised",
        }),
      ];
      const m = computeFundMetrics(txs);
      expect(m.receipt_attached_rate).toBe(100);
      expect(m.child_signed_rate).toBe(100);
      expect(m.staff_signed_rate).toBe(100);
      expect(m.second_signatory_rate).toBe(100);
      expect(m.authorised_rate).toBe(100);
    });

    it("all rates are 0 when all booleans are false for 1 record", () => {
      const txs = [
        makeTransaction({
          receipt_attached: false,
          child_signed: false,
          staff_signed: false,
          second_signatory: false,
          authorisation_status: "declined",
        }),
      ];
      const m = computeFundMetrics(txs);
      expect(m.receipt_attached_rate).toBe(0);
      expect(m.child_signed_rate).toBe(0);
      expect(m.staff_signed_rate).toBe(0);
      expect(m.second_signatory_rate).toBe(0);
      expect(m.authorised_rate).toBe(0);
    });

    it("all rates use Math.round(value * 1000) / 10 formula consistently", () => {
      const txs = [
        makeTransaction({
          id: "t-1",
          receipt_attached: true,
          child_signed: true,
          staff_signed: true,
          second_signatory: true,
          authorisation_status: "authorised",
        }),
        makeTransaction({
          id: "t-2",
          receipt_attached: true,
          child_signed: true,
          staff_signed: true,
          second_signatory: true,
          authorisation_status: "auto_approved",
        }),
        makeTransaction({
          id: "t-3",
          receipt_attached: false,
          child_signed: false,
          staff_signed: false,
          second_signatory: false,
          authorisation_status: "declined",
        }),
      ];
      const m = computeFundMetrics(txs);
      // 2/3 = 66.7
      expect(m.receipt_attached_rate).toBe(66.7);
      expect(m.child_signed_rate).toBe(66.7);
      expect(m.staff_signed_rate).toBe(66.7);
      expect(m.second_signatory_rate).toBe(66.7);
      expect(m.authorised_rate).toBe(66.7);
    });
  });

  // ── pending_authorisation_count ──────────────────────────────────────
  describe("pending_authorisation_count", () => {
    it("counts only pending_authorisation status", () => {
      const txs = [
        makeTransaction({ id: "t-1", authorisation_status: "pending_authorisation" }),
        makeTransaction({ id: "t-2", authorisation_status: "pending_authorisation" }),
        makeTransaction({ id: "t-3", authorisation_status: "authorised" }),
        makeTransaction({ id: "t-4", authorisation_status: "declined" }),
      ];
      expect(computeFundMetrics(txs).pending_authorisation_count).toBe(2);
    });

    it("is 0 when no pending authorisations", () => {
      const txs = [
        makeTransaction({ id: "t-1", authorisation_status: "authorised" }),
        makeTransaction({ id: "t-2", authorisation_status: "auto_approved" }),
      ];
      expect(computeFundMetrics(txs).pending_authorisation_count).toBe(0);
    });
  });

  // ── discrepancy_count ────────────────────────────────────────────────
  describe("discrepancy_count", () => {
    it("counts only discrepancy_found audit results", () => {
      const txs = [
        makeTransaction({ id: "t-1", audit_result: "discrepancy_found" }),
        makeTransaction({ id: "t-2", audit_result: "discrepancy_found" }),
        makeTransaction({ id: "t-3", audit_result: "balanced" }),
      ];
      expect(computeFundMetrics(txs).discrepancy_count).toBe(2);
    });

    it("is 0 when no discrepancies", () => {
      const txs = [
        makeTransaction({ id: "t-1", audit_result: "balanced" }),
        makeTransaction({ id: "t-2", audit_result: "not_audited" }),
      ];
      expect(computeFundMetrics(txs).discrepancy_count).toBe(0);
    });
  });

  // ── not_audited_count ────────────────────────────────────────────────
  describe("not_audited_count", () => {
    it("counts only not_audited audit results", () => {
      const txs = [
        makeTransaction({ id: "t-1", audit_result: "not_audited" }),
        makeTransaction({ id: "t-2", audit_result: "not_audited" }),
        makeTransaction({ id: "t-3", audit_result: "balanced" }),
      ];
      expect(computeFundMetrics(txs).not_audited_count).toBe(2);
    });

    it("is 0 when all audited", () => {
      const txs = [
        makeTransaction({ id: "t-1", audit_result: "balanced" }),
        makeTransaction({ id: "t-2", audit_result: "discrepancy_found" }),
      ];
      expect(computeFundMetrics(txs).not_audited_count).toBe(0);
    });
  });

  // ── by_ breakdown maps ────────────────────────────────────────────────
  describe("by_ breakdown maps", () => {
    it("by_transaction_type handles duplicates", () => {
      const txs = [
        makeTransaction({ id: "t-1", transaction_type: "pocket_money" }),
        makeTransaction({ id: "t-2", transaction_type: "pocket_money" }),
        makeTransaction({ id: "t-3", transaction_type: "purchase" }),
      ];
      expect(computeFundMetrics(txs).by_transaction_type).toEqual({
        pocket_money: 2,
        purchase: 1,
      });
    });

    it("by_fund_category handles duplicates", () => {
      const txs = [
        makeTransaction({ id: "t-1", fund_category: "savings" }),
        makeTransaction({ id: "t-2", fund_category: "savings" }),
        makeTransaction({ id: "t-3", fund_category: "clothing" }),
      ];
      expect(computeFundMetrics(txs).by_fund_category).toEqual({
        savings: 2,
        clothing: 1,
      });
    });

    it("by_authorisation_status handles all statuses present", () => {
      const txs = [
        makeTransaction({ id: "t-1", authorisation_status: "authorised" }),
        makeTransaction({ id: "t-2", authorisation_status: "pending_authorisation" }),
        makeTransaction({ id: "t-3", authorisation_status: "declined" }),
        makeTransaction({ id: "t-4", authorisation_status: "auto_approved" }),
        makeTransaction({ id: "t-5", authorisation_status: "retrospective" }),
      ];
      expect(computeFundMetrics(txs).by_authorisation_status).toEqual({
        authorised: 1,
        pending_authorisation: 1,
        declined: 1,
        auto_approved: 1,
        retrospective: 1,
      });
    });

    it("by_audit_result handles all results present", () => {
      const txs = [
        makeTransaction({ id: "t-1", audit_result: "balanced" }),
        makeTransaction({ id: "t-2", audit_result: "discrepancy_found" }),
        makeTransaction({ id: "t-3", audit_result: "not_audited" }),
        makeTransaction({ id: "t-4", audit_result: "under_investigation" }),
      ];
      expect(computeFundMetrics(txs).by_audit_result).toEqual({
        balanced: 1,
        discrepancy_found: 1,
        not_audited: 1,
        under_investigation: 1,
      });
    });
  });

  // ── 50% rate scenarios ────────────────────────────────────────────────
  describe("50% rate scenarios", () => {
    it("receipt_attached_rate is 50 for 1 of 2", () => {
      const txs = [
        makeTransaction({ id: "t-1", receipt_attached: true }),
        makeTransaction({ id: "t-2", receipt_attached: false }),
      ];
      expect(computeFundMetrics(txs).receipt_attached_rate).toBe(50);
    });

    it("child_signed_rate is 50 for 1 of 2", () => {
      const txs = [
        makeTransaction({ id: "t-1", child_signed: true }),
        makeTransaction({ id: "t-2", child_signed: false }),
      ];
      expect(computeFundMetrics(txs).child_signed_rate).toBe(50);
    });

    it("staff_signed_rate is 50 for 1 of 2", () => {
      const txs = [
        makeTransaction({ id: "t-1", staff_signed: true }),
        makeTransaction({ id: "t-2", staff_signed: false }),
      ];
      expect(computeFundMetrics(txs).staff_signed_rate).toBe(50);
    });

    it("second_signatory_rate is 50 for 1 of 2", () => {
      const txs = [
        makeTransaction({ id: "t-1", second_signatory: true }),
        makeTransaction({ id: "t-2", second_signatory: false }),
      ];
      expect(computeFundMetrics(txs).second_signatory_rate).toBe(50);
    });

    it("authorised_rate is 50 for 1 authorised of 2", () => {
      const txs = [
        makeTransaction({ id: "t-1", authorisation_status: "authorised" }),
        makeTransaction({ id: "t-2", authorisation_status: "declined" }),
      ];
      expect(computeFundMetrics(txs).authorised_rate).toBe(50);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. identifyFundAlerts
// ═══════════════════════════════════════════════════════════════════════════

describe("identifyFundAlerts", () => {
  // ── No alerts ──────────────────────────────────────────────────────
  describe("no alerts scenario", () => {
    it("returns empty array for empty transactions", () => {
      expect(identifyFundAlerts([])).toEqual([]);
    });

    it("returns empty array when everything is well-managed", () => {
      const txs = [
        makeTransaction({
          id: "t-1",
          is_credit: true,
          receipt_attached: true,
          audit_result: "balanced",
          authorisation_status: "authorised",
        }),
      ];
      expect(identifyFundAlerts(txs)).toEqual([]);
    });

    it("returns empty for debit with receipt attached and balanced audit", () => {
      const txs = [
        makeTransaction({
          id: "t-1",
          is_credit: false,
          receipt_attached: true,
          audit_result: "balanced",
          authorisation_status: "authorised",
        }),
      ];
      expect(identifyFundAlerts(txs)).toEqual([]);
    });
  });

  // ── discrepancy_found alert (critical) ────────────────────────────
  describe("discrepancy_found alert", () => {
    it("fires for audit_result=discrepancy_found", () => {
      const txs = [
        makeTransaction({
          id: "t-1",
          audit_result: "discrepancy_found",
          child_name: "Alice",
          transaction_date: "2024-06-01",
        }),
      ];
      const alerts = identifyFundAlerts(txs);
      const disc = alerts.find((a) => a.type === "discrepancy_found");
      expect(disc).toBeTruthy();
    });

    it("has critical severity", () => {
      const txs = [
        makeTransaction({
          id: "t-1",
          audit_result: "discrepancy_found",
        }),
      ];
      const alerts = identifyFundAlerts(txs);
      const disc = alerts.find((a) => a.type === "discrepancy_found")!;
      expect(disc.severity).toBe("critical");
    });

    it("uses the record id as alert id", () => {
      const txs = [
        makeTransaction({
          id: "t-42",
          audit_result: "discrepancy_found",
        }),
      ];
      const alerts = identifyFundAlerts(txs);
      const disc = alerts.find((a) => a.type === "discrepancy_found")!;
      expect(disc.id).toBe("t-42");
    });

    it("message contains child_name", () => {
      const txs = [
        makeTransaction({
          id: "t-1",
          audit_result: "discrepancy_found",
          child_name: "Alice Smith",
        }),
      ];
      const alerts = identifyFundAlerts(txs);
      const disc = alerts.find((a) => a.type === "discrepancy_found")!;
      expect(disc.message).toContain("Alice Smith");
    });

    it("message contains transaction_date", () => {
      const txs = [
        makeTransaction({
          id: "t-1",
          audit_result: "discrepancy_found",
          transaction_date: "2024-07-15",
        }),
      ];
      const alerts = identifyFundAlerts(txs);
      const disc = alerts.find((a) => a.type === "discrepancy_found")!;
      expect(disc.message).toContain("2024-07-15");
    });

    it("fires per record for multiple discrepancies", () => {
      const txs = [
        makeTransaction({
          id: "t-1",
          audit_result: "discrepancy_found",
          child_name: "Alice",
        }),
        makeTransaction({
          id: "t-2",
          audit_result: "discrepancy_found",
          child_name: "Bob",
        }),
      ];
      const alerts = identifyFundAlerts(txs);
      const discs = alerts.filter((a) => a.type === "discrepancy_found");
      expect(discs).toHaveLength(2);
    });

    it("does NOT fire for balanced audit", () => {
      const txs = [makeTransaction({ id: "t-1", audit_result: "balanced" })];
      const alerts = identifyFundAlerts(txs);
      expect(alerts.find((a) => a.type === "discrepancy_found")).toBeUndefined();
    });

    it("does NOT fire for not_audited", () => {
      const txs = [makeTransaction({ id: "t-1", audit_result: "not_audited" })];
      const alerts = identifyFundAlerts(txs);
      expect(alerts.find((a) => a.type === "discrepancy_found")).toBeUndefined();
    });

    it("does NOT fire for under_investigation", () => {
      const txs = [makeTransaction({ id: "t-1", audit_result: "under_investigation" })];
      const alerts = identifyFundAlerts(txs);
      expect(alerts.find((a) => a.type === "discrepancy_found")).toBeUndefined();
    });

    it("fires only for qualifying records among mixed set", () => {
      const txs = [
        makeTransaction({ id: "t-1", audit_result: "discrepancy_found" }),
        makeTransaction({ id: "t-2", audit_result: "balanced" }),
        makeTransaction({ id: "t-3", audit_result: "not_audited" }),
      ];
      const alerts = identifyFundAlerts(txs);
      const discs = alerts.filter((a) => a.type === "discrepancy_found");
      expect(discs).toHaveLength(1);
      expect(discs[0].id).toBe("t-1");
    });
  });

  // ── under_investigation alert (high) ─────────────────────────────
  describe("under_investigation alert", () => {
    it("fires for audit_result=under_investigation", () => {
      const txs = [
        makeTransaction({
          id: "t-1",
          audit_result: "under_investigation",
          child_name: "Bob",
          transaction_date: "2024-06-10",
          amount: 25.5,
        }),
      ];
      const alerts = identifyFundAlerts(txs);
      const ui = alerts.find((a) => a.type === "under_investigation");
      expect(ui).toBeTruthy();
    });

    it("has high severity", () => {
      const txs = [
        makeTransaction({
          id: "t-1",
          audit_result: "under_investigation",
        }),
      ];
      const alerts = identifyFundAlerts(txs);
      const ui = alerts.find((a) => a.type === "under_investigation")!;
      expect(ui.severity).toBe("high");
    });

    it("uses the record id as alert id", () => {
      const txs = [
        makeTransaction({
          id: "t-99",
          audit_result: "under_investigation",
        }),
      ];
      const alerts = identifyFundAlerts(txs);
      const ui = alerts.find((a) => a.type === "under_investigation")!;
      expect(ui.id).toBe("t-99");
    });

    it("message contains child_name", () => {
      const txs = [
        makeTransaction({
          id: "t-1",
          audit_result: "under_investigation",
          child_name: "Charlie Brown",
        }),
      ];
      const alerts = identifyFundAlerts(txs);
      const ui = alerts.find((a) => a.type === "under_investigation")!;
      expect(ui.message).toContain("Charlie Brown");
    });

    it("message contains transaction_date", () => {
      const txs = [
        makeTransaction({
          id: "t-1",
          audit_result: "under_investigation",
          transaction_date: "2024-08-20",
        }),
      ];
      const alerts = identifyFundAlerts(txs);
      const ui = alerts.find((a) => a.type === "under_investigation")!;
      expect(ui.message).toContain("2024-08-20");
    });

    it("message contains amount formatted with toFixed(2)", () => {
      const txs = [
        makeTransaction({
          id: "t-1",
          audit_result: "under_investigation",
          amount: 25.5,
        }),
      ];
      const alerts = identifyFundAlerts(txs);
      const ui = alerts.find((a) => a.type === "under_investigation")!;
      expect(ui.message).toContain("25.50");
    });

    it("message formats whole number amount with toFixed(2)", () => {
      const txs = [
        makeTransaction({
          id: "t-1",
          audit_result: "under_investigation",
          amount: 100,
        }),
      ];
      const alerts = identifyFundAlerts(txs);
      const ui = alerts.find((a) => a.type === "under_investigation")!;
      expect(ui.message).toContain("100.00");
    });

    it("fires per record for multiple under_investigation", () => {
      const txs = [
        makeTransaction({ id: "t-1", audit_result: "under_investigation", child_name: "Alice" }),
        makeTransaction({ id: "t-2", audit_result: "under_investigation", child_name: "Bob" }),
        makeTransaction({ id: "t-3", audit_result: "under_investigation", child_name: "Charlie" }),
      ];
      const alerts = identifyFundAlerts(txs);
      const uis = alerts.filter((a) => a.type === "under_investigation");
      expect(uis).toHaveLength(3);
    });

    it("does NOT fire for balanced audit", () => {
      const txs = [makeTransaction({ id: "t-1", audit_result: "balanced" })];
      const alerts = identifyFundAlerts(txs);
      expect(alerts.find((a) => a.type === "under_investigation")).toBeUndefined();
    });

    it("does NOT fire for discrepancy_found", () => {
      const txs = [makeTransaction({ id: "t-1", audit_result: "discrepancy_found" })];
      const alerts = identifyFundAlerts(txs);
      expect(alerts.find((a) => a.type === "under_investigation")).toBeUndefined();
    });
  });

  // ── pending_authorisation alert (high) ────────────────────────────
  describe("pending_authorisation alert", () => {
    it("fires when 1 transaction is pending authorisation", () => {
      const txs = [
        makeTransaction({
          id: "t-1",
          authorisation_status: "pending_authorisation",
        }),
      ];
      const alerts = identifyFundAlerts(txs);
      const pa = alerts.find((a) => a.type === "pending_authorisation");
      expect(pa).toBeTruthy();
    });

    it("has high severity", () => {
      const txs = [
        makeTransaction({
          id: "t-1",
          authorisation_status: "pending_authorisation",
        }),
      ];
      const alerts = identifyFundAlerts(txs);
      const pa = alerts.find((a) => a.type === "pending_authorisation")!;
      expect(pa.severity).toBe("high");
    });

    it("has id pending_authorisation", () => {
      const txs = [
        makeTransaction({
          id: "t-1",
          authorisation_status: "pending_authorisation",
        }),
      ];
      const alerts = identifyFundAlerts(txs);
      const pa = alerts.find((a) => a.type === "pending_authorisation")!;
      expect(pa.id).toBe("pending_authorisation");
    });

    it("message uses singular for exactly 1", () => {
      const txs = [
        makeTransaction({
          id: "t-1",
          authorisation_status: "pending_authorisation",
        }),
      ];
      const alerts = identifyFundAlerts(txs);
      const pa = alerts.find((a) => a.type === "pending_authorisation")!;
      expect(pa.message).toContain("1 transaction pending");
    });

    it("message uses plural for 2", () => {
      const txs = [
        makeTransaction({ id: "t-1", authorisation_status: "pending_authorisation" }),
        makeTransaction({ id: "t-2", authorisation_status: "pending_authorisation" }),
      ];
      const alerts = identifyFundAlerts(txs);
      const pa = alerts.find((a) => a.type === "pending_authorisation")!;
      expect(pa.message).toContain("2 transactions pending");
    });

    it("message uses plural for 5", () => {
      const txs = Array.from({ length: 5 }, (_, i) =>
        makeTransaction({ id: `t-${i}`, authorisation_status: "pending_authorisation" }),
      );
      const alerts = identifyFundAlerts(txs);
      const pa = alerts.find((a) => a.type === "pending_authorisation")!;
      expect(pa.message).toContain("5 transactions pending");
    });

    it("does NOT fire when no pending authorisations", () => {
      const txs = [
        makeTransaction({ id: "t-1", authorisation_status: "authorised" }),
        makeTransaction({ id: "t-2", authorisation_status: "auto_approved" }),
        makeTransaction({ id: "t-3", authorisation_status: "declined" }),
      ];
      const alerts = identifyFundAlerts(txs);
      expect(alerts.find((a) => a.type === "pending_authorisation")).toBeUndefined();
    });

    it("counts only pending_authorisation status in mixed set", () => {
      const txs = [
        makeTransaction({ id: "t-1", authorisation_status: "pending_authorisation" }),
        makeTransaction({ id: "t-2", authorisation_status: "authorised" }),
        makeTransaction({ id: "t-3", authorisation_status: "pending_authorisation" }),
        makeTransaction({ id: "t-4", authorisation_status: "declined" }),
        makeTransaction({ id: "t-5", authorisation_status: "pending_authorisation" }),
      ];
      const alerts = identifyFundAlerts(txs);
      const pa = alerts.find((a) => a.type === "pending_authorisation")!;
      expect(pa.message).toContain("3 transactions pending");
    });
  });

  // ── no_receipt alert (medium) ────────────────────────────────────
  describe("no_receipt alert", () => {
    it("fires when 3 debit transactions have no receipt", () => {
      const txs = [
        makeTransaction({ id: "t-1", is_credit: false, receipt_attached: false }),
        makeTransaction({ id: "t-2", is_credit: false, receipt_attached: false }),
        makeTransaction({ id: "t-3", is_credit: false, receipt_attached: false }),
      ];
      const alerts = identifyFundAlerts(txs);
      const nr = alerts.find((a) => a.type === "no_receipt");
      expect(nr).toBeTruthy();
    });

    it("has medium severity", () => {
      const txs = [
        makeTransaction({ id: "t-1", is_credit: false, receipt_attached: false }),
        makeTransaction({ id: "t-2", is_credit: false, receipt_attached: false }),
        makeTransaction({ id: "t-3", is_credit: false, receipt_attached: false }),
      ];
      const alerts = identifyFundAlerts(txs);
      const nr = alerts.find((a) => a.type === "no_receipt")!;
      expect(nr.severity).toBe("medium");
    });

    it("has id no_receipt", () => {
      const txs = [
        makeTransaction({ id: "t-1", is_credit: false, receipt_attached: false }),
        makeTransaction({ id: "t-2", is_credit: false, receipt_attached: false }),
        makeTransaction({ id: "t-3", is_credit: false, receipt_attached: false }),
      ];
      const alerts = identifyFundAlerts(txs);
      const nr = alerts.find((a) => a.type === "no_receipt")!;
      expect(nr.id).toBe("no_receipt");
    });

    it("message contains count of 3", () => {
      const txs = [
        makeTransaction({ id: "t-1", is_credit: false, receipt_attached: false }),
        makeTransaction({ id: "t-2", is_credit: false, receipt_attached: false }),
        makeTransaction({ id: "t-3", is_credit: false, receipt_attached: false }),
      ];
      const alerts = identifyFundAlerts(txs);
      const nr = alerts.find((a) => a.type === "no_receipt")!;
      expect(nr.message).toContain("3");
    });

    it("fires when more than 3 debit transactions have no receipt", () => {
      const txs = Array.from({ length: 6 }, (_, i) =>
        makeTransaction({ id: `t-${i}`, is_credit: false, receipt_attached: false }),
      );
      const alerts = identifyFundAlerts(txs);
      const nr = alerts.find((a) => a.type === "no_receipt")!;
      expect(nr).toBeTruthy();
      expect(nr.message).toContain("6");
    });

    it("does NOT fire when only 2 debit transactions have no receipt", () => {
      const txs = [
        makeTransaction({ id: "t-1", is_credit: false, receipt_attached: false }),
        makeTransaction({ id: "t-2", is_credit: false, receipt_attached: false }),
      ];
      const alerts = identifyFundAlerts(txs);
      expect(alerts.find((a) => a.type === "no_receipt")).toBeUndefined();
    });

    it("does NOT fire when only 1 debit transaction has no receipt", () => {
      const txs = [
        makeTransaction({ id: "t-1", is_credit: false, receipt_attached: false }),
      ];
      const alerts = identifyFundAlerts(txs);
      expect(alerts.find((a) => a.type === "no_receipt")).toBeUndefined();
    });

    it("does NOT fire for credit transactions without receipt", () => {
      const txs = [
        makeTransaction({ id: "t-1", is_credit: true, receipt_attached: false }),
        makeTransaction({ id: "t-2", is_credit: true, receipt_attached: false }),
        makeTransaction({ id: "t-3", is_credit: true, receipt_attached: false }),
      ];
      const alerts = identifyFundAlerts(txs);
      expect(alerts.find((a) => a.type === "no_receipt")).toBeUndefined();
    });

    it("does NOT fire for debit transactions with receipt attached", () => {
      const txs = [
        makeTransaction({ id: "t-1", is_credit: false, receipt_attached: true }),
        makeTransaction({ id: "t-2", is_credit: false, receipt_attached: true }),
        makeTransaction({ id: "t-3", is_credit: false, receipt_attached: true }),
      ];
      const alerts = identifyFundAlerts(txs);
      expect(alerts.find((a) => a.type === "no_receipt")).toBeUndefined();
    });

    it("only counts debit+no-receipt in mixed set", () => {
      const txs = [
        makeTransaction({ id: "t-1", is_credit: false, receipt_attached: false }),
        makeTransaction({ id: "t-2", is_credit: false, receipt_attached: true }),
        makeTransaction({ id: "t-3", is_credit: true, receipt_attached: false }),
        makeTransaction({ id: "t-4", is_credit: false, receipt_attached: false }),
        makeTransaction({ id: "t-5", is_credit: false, receipt_attached: false }),
      ];
      const alerts = identifyFundAlerts(txs);
      const nr = alerts.find((a) => a.type === "no_receipt")!;
      expect(nr).toBeTruthy();
      expect(nr.message).toContain("3");
    });

    it("does NOT fire when exactly at threshold minus one in mixed set", () => {
      const txs = [
        makeTransaction({ id: "t-1", is_credit: false, receipt_attached: false }),
        makeTransaction({ id: "t-2", is_credit: false, receipt_attached: false }),
        makeTransaction({ id: "t-3", is_credit: true, receipt_attached: false }),
        makeTransaction({ id: "t-4", is_credit: false, receipt_attached: true }),
      ];
      const alerts = identifyFundAlerts(txs);
      expect(alerts.find((a) => a.type === "no_receipt")).toBeUndefined();
    });
  });

  // ── not_audited alert (medium) ────────────────────────────────────
  describe("not_audited alert", () => {
    it("fires when 5 transactions have audit_result=not_audited", () => {
      const txs = Array.from({ length: 5 }, (_, i) =>
        makeTransaction({ id: `t-${i}`, audit_result: "not_audited" }),
      );
      const alerts = identifyFundAlerts(txs);
      const na = alerts.find((a) => a.type === "not_audited");
      expect(na).toBeTruthy();
    });

    it("has medium severity", () => {
      const txs = Array.from({ length: 5 }, (_, i) =>
        makeTransaction({ id: `t-${i}`, audit_result: "not_audited" }),
      );
      const alerts = identifyFundAlerts(txs);
      const na = alerts.find((a) => a.type === "not_audited")!;
      expect(na.severity).toBe("medium");
    });

    it("has id not_audited", () => {
      const txs = Array.from({ length: 5 }, (_, i) =>
        makeTransaction({ id: `t-${i}`, audit_result: "not_audited" }),
      );
      const alerts = identifyFundAlerts(txs);
      const na = alerts.find((a) => a.type === "not_audited")!;
      expect(na.id).toBe("not_audited");
    });

    it("message contains count of 5", () => {
      const txs = Array.from({ length: 5 }, (_, i) =>
        makeTransaction({ id: `t-${i}`, audit_result: "not_audited" }),
      );
      const alerts = identifyFundAlerts(txs);
      const na = alerts.find((a) => a.type === "not_audited")!;
      expect(na.message).toContain("5");
    });

    it("fires for more than 5", () => {
      const txs = Array.from({ length: 8 }, (_, i) =>
        makeTransaction({ id: `t-${i}`, audit_result: "not_audited" }),
      );
      const alerts = identifyFundAlerts(txs);
      const na = alerts.find((a) => a.type === "not_audited")!;
      expect(na).toBeTruthy();
      expect(na.message).toContain("8");
    });

    it("does NOT fire when only 4 transactions are not_audited", () => {
      const txs = Array.from({ length: 4 }, (_, i) =>
        makeTransaction({ id: `t-${i}`, audit_result: "not_audited" }),
      );
      const alerts = identifyFundAlerts(txs);
      expect(alerts.find((a) => a.type === "not_audited")).toBeUndefined();
    });

    it("does NOT fire when only 1 transaction is not_audited", () => {
      const txs = [makeTransaction({ id: "t-1", audit_result: "not_audited" })];
      const alerts = identifyFundAlerts(txs);
      expect(alerts.find((a) => a.type === "not_audited")).toBeUndefined();
    });

    it("does NOT fire when no transactions are not_audited", () => {
      const txs = [
        makeTransaction({ id: "t-1", audit_result: "balanced" }),
        makeTransaction({ id: "t-2", audit_result: "balanced" }),
      ];
      const alerts = identifyFundAlerts(txs);
      expect(alerts.find((a) => a.type === "not_audited")).toBeUndefined();
    });

    it("counts only not_audited in mixed audit results", () => {
      const txs = [
        makeTransaction({ id: "t-1", audit_result: "not_audited" }),
        makeTransaction({ id: "t-2", audit_result: "balanced" }),
        makeTransaction({ id: "t-3", audit_result: "not_audited" }),
        makeTransaction({ id: "t-4", audit_result: "discrepancy_found" }),
        makeTransaction({ id: "t-5", audit_result: "not_audited" }),
        makeTransaction({ id: "t-6", audit_result: "not_audited" }),
        makeTransaction({ id: "t-7", audit_result: "not_audited" }),
      ];
      const alerts = identifyFundAlerts(txs);
      const na = alerts.find((a) => a.type === "not_audited")!;
      expect(na).toBeTruthy();
      expect(na.message).toContain("5");
    });
  });

  // ── Combined alert scenarios ───────────────────────────────────────
  describe("combined alert scenarios", () => {
    it("can fire all five alert types simultaneously", () => {
      const txs = [
        // discrepancy_found alert
        makeTransaction({
          id: "t-1",
          audit_result: "discrepancy_found",
          child_name: "Alice",
          transaction_date: "2024-06-01",
        }),
        // under_investigation alert
        makeTransaction({
          id: "t-2",
          audit_result: "under_investigation",
          child_name: "Bob",
          transaction_date: "2024-06-02",
          amount: 50,
        }),
        // pending_authorisation alert
        makeTransaction({
          id: "t-3",
          authorisation_status: "pending_authorisation",
        }),
        // no_receipt alert (need 3 debits without receipt)
        makeTransaction({ id: "t-4", is_credit: false, receipt_attached: false }),
        makeTransaction({ id: "t-5", is_credit: false, receipt_attached: false }),
        makeTransaction({ id: "t-6", is_credit: false, receipt_attached: false }),
        // not_audited alert (need 5 not_audited)
        makeTransaction({ id: "t-7", audit_result: "not_audited" }),
        makeTransaction({ id: "t-8", audit_result: "not_audited" }),
        makeTransaction({ id: "t-9", audit_result: "not_audited" }),
        makeTransaction({ id: "t-10", audit_result: "not_audited" }),
        makeTransaction({ id: "t-11", audit_result: "not_audited" }),
      ];
      const alerts = identifyFundAlerts(txs);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("discrepancy_found");
      expect(types).toContain("under_investigation");
      expect(types).toContain("pending_authorisation");
      expect(types).toContain("no_receipt");
      expect(types).toContain("not_audited");
    });

    it("returns no alerts for a clean set of transactions", () => {
      const txs = [
        makeTransaction({
          id: "t-1",
          is_credit: true,
          receipt_attached: true,
          audit_result: "balanced",
          authorisation_status: "authorised",
        }),
        makeTransaction({
          id: "t-2",
          is_credit: false,
          receipt_attached: true,
          audit_result: "balanced",
          authorisation_status: "auto_approved",
        }),
      ];
      const alerts = identifyFundAlerts(txs);
      expect(alerts).toEqual([]);
    });

    it("alert order: discrepancy_found before under_investigation before pending_authorisation before no_receipt before not_audited", () => {
      const txs = [
        makeTransaction({ id: "t-1", audit_result: "discrepancy_found" }),
        makeTransaction({ id: "t-2", audit_result: "under_investigation", amount: 10 }),
        makeTransaction({ id: "t-3", authorisation_status: "pending_authorisation" }),
        makeTransaction({ id: "t-4", is_credit: false, receipt_attached: false }),
        makeTransaction({ id: "t-5", is_credit: false, receipt_attached: false }),
        makeTransaction({ id: "t-6", is_credit: false, receipt_attached: false }),
        makeTransaction({ id: "t-7", audit_result: "not_audited" }),
        makeTransaction({ id: "t-8", audit_result: "not_audited" }),
        makeTransaction({ id: "t-9", audit_result: "not_audited" }),
        makeTransaction({ id: "t-10", audit_result: "not_audited" }),
        makeTransaction({ id: "t-11", audit_result: "not_audited" }),
      ];
      const alerts = identifyFundAlerts(txs);
      const types = alerts.map((a) => a.type);

      const discIdx = types.indexOf("discrepancy_found");
      const uiIdx = types.indexOf("under_investigation");
      const paIdx = types.indexOf("pending_authorisation");
      const nrIdx = types.indexOf("no_receipt");
      const naIdx = types.indexOf("not_audited");

      expect(discIdx).toBeLessThan(uiIdx);
      expect(uiIdx).toBeLessThan(paIdx);
      expect(paIdx).toBeLessThan(nrIdx);
      expect(nrIdx).toBeLessThan(naIdx);
    });

    it("generates multiple per-record alerts for different discrepancy records", () => {
      const txs = [
        makeTransaction({
          id: "t-1",
          audit_result: "discrepancy_found",
          child_name: "Alice",
          transaction_date: "2024-06-01",
        }),
        makeTransaction({
          id: "t-2",
          audit_result: "discrepancy_found",
          child_name: "Bob",
          transaction_date: "2024-06-02",
        }),
      ];
      const alerts = identifyFundAlerts(txs);
      const discs = alerts.filter((a) => a.type === "discrepancy_found");
      expect(discs).toHaveLength(2);
      expect(discs[0].message).toContain("Alice");
      expect(discs[1].message).toContain("Bob");
    });

    it("generates multiple per-record alerts for different under_investigation records", () => {
      const txs = [
        makeTransaction({
          id: "t-1",
          audit_result: "under_investigation",
          child_name: "Alice",
          amount: 10,
        }),
        makeTransaction({
          id: "t-2",
          audit_result: "under_investigation",
          child_name: "Bob",
          amount: 20,
        }),
      ];
      const alerts = identifyFundAlerts(txs);
      const uis = alerts.filter((a) => a.type === "under_investigation");
      expect(uis).toHaveLength(2);
      expect(uis[0].message).toContain("Alice");
      expect(uis[1].message).toContain("Bob");
    });

    it("threshold alerts appear only once even with many qualifying records", () => {
      const txs = [
        makeTransaction({ id: "t-1", authorisation_status: "pending_authorisation" }),
        makeTransaction({ id: "t-2", authorisation_status: "pending_authorisation" }),
        makeTransaction({ id: "t-3", authorisation_status: "pending_authorisation" }),
      ];
      const alerts = identifyFundAlerts(txs);
      const pas = alerts.filter((a) => a.type === "pending_authorisation");
      expect(pas).toHaveLength(1);
    });
  });
});
