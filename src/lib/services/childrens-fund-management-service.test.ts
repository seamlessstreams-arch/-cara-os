import { describe, it, expect } from "vitest";
import {
  computeFundMetrics,
  identifyFundAlerts,
} from "./childrens-fund-management-service";
import type { FundTransaction } from "./childrens-fund-management-service";

// -- Factory -------------------------------------------------------------------

function makeTransaction(overrides: Partial<FundTransaction> = {}): FundTransaction {
  return {
    id: "txn-1",
    home_id: "home-1",
    child_name: "Alex",
    child_id: "child-1",
    transaction_date: "2026-05-20",
    transaction_type: "pocket_money",
    fund_category: "pocket_money",
    amount: 10,
    is_credit: true,
    running_balance: 50,
    authorisation_status: "authorised",
    authorised_by: "Staff A",
    receipt_attached: true,
    child_signed: true,
    staff_signed: true,
    second_signatory: false,
    purpose: "Weekly pocket money",
    audit_result: "balanced",
    audit_date: null,
    notes: null,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

// -- computeFundMetrics --------------------------------------------------------

describe("computeFundMetrics", () => {
  it("returns zeroed metrics for empty data", () => {
    const m = computeFundMetrics([]);
    expect(m.total_transactions).toBe(0);
    expect(m.total_credits).toBe(0);
    expect(m.total_debits).toBe(0);
    expect(m.total_credit_amount).toBe(0);
    expect(m.total_debit_amount).toBe(0);
    expect(m.net_balance).toBe(0);
    expect(m.unique_children).toBe(0);
    expect(m.receipt_attached_rate).toBeNull();;
  });

  it("counts credits and debits and calculates amounts", () => {
    const rows = [
      makeTransaction({ id: "1", is_credit: true, amount: 20 }),
      makeTransaction({ id: "2", is_credit: true, amount: 30 }),
      makeTransaction({ id: "3", is_credit: false, amount: 15 }),
    ];
    const m = computeFundMetrics(rows);
    expect(m.total_credits).toBe(2);
    expect(m.total_debits).toBe(1);
    expect(m.total_credit_amount).toBe(50);
    expect(m.total_debit_amount).toBe(15);
    expect(m.net_balance).toBe(35);
  });

  it("handles floating point with rounding", () => {
    const rows = [
      makeTransaction({ id: "1", is_credit: true, amount: 10.15 }),
      makeTransaction({ id: "2", is_credit: false, amount: 3.33 }),
    ];
    const m = computeFundMetrics(rows);
    expect(m.total_credit_amount).toBe(10.15);
    expect(m.total_debit_amount).toBe(3.33);
    expect(m.net_balance).toBe(6.82);
  });

  it("counts unique children by child_id", () => {
    const rows = [
      makeTransaction({ id: "1", child_id: "c1" }),
      makeTransaction({ id: "2", child_id: "c1" }),
      makeTransaction({ id: "3", child_id: "c2" }),
    ];
    const m = computeFundMetrics(rows);
    expect(m.unique_children).toBe(2);
  });

  it("calculates boolean rates", () => {
    const rows = [
      makeTransaction({ id: "1", receipt_attached: true, child_signed: true, staff_signed: true }),
      makeTransaction({ id: "2", receipt_attached: false, child_signed: false, staff_signed: false }),
    ];
    const m = computeFundMetrics(rows);
    expect(m.receipt_attached_rate).toBe(50);
    expect(m.child_signed_rate).toBe(50);
    expect(m.staff_signed_rate).toBe(50);
  });

  it("calculates authorised rate (authorised + auto_approved)", () => {
    const rows = [
      makeTransaction({ id: "1", authorisation_status: "authorised" }),
      makeTransaction({ id: "2", authorisation_status: "auto_approved" }),
      makeTransaction({ id: "3", authorisation_status: "pending_authorisation" }),
      makeTransaction({ id: "4", authorisation_status: "declined" }),
    ];
    const m = computeFundMetrics(rows);
    expect(m.authorised_rate).toBe(50);
    expect(m.pending_authorisation_count).toBe(1);
  });

  it("counts discrepancy and not_audited", () => {
    const rows = [
      makeTransaction({ id: "1", audit_result: "discrepancy_found" }),
      makeTransaction({ id: "2", audit_result: "not_audited" }),
      makeTransaction({ id: "3", audit_result: "balanced" }),
    ];
    const m = computeFundMetrics(rows);
    expect(m.discrepancy_count).toBe(1);
    expect(m.not_audited_count).toBe(1);
  });

  it("builds breakdowns", () => {
    const rows = [
      makeTransaction({ id: "1", transaction_type: "pocket_money", fund_category: "pocket_money", authorisation_status: "authorised", audit_result: "balanced" }),
      makeTransaction({ id: "2", transaction_type: "purchase", fund_category: "personal_expenses", authorisation_status: "pending_authorisation", audit_result: "not_audited" }),
    ];
    const m = computeFundMetrics(rows);
    expect(m.by_transaction_type).toEqual({ pocket_money: 1, purchase: 1 });
    expect(m.by_fund_category).toEqual({ pocket_money: 1, personal_expenses: 1 });
    expect(m.by_authorisation_status).toEqual({ authorised: 1, pending_authorisation: 1 });
    expect(m.by_audit_result).toEqual({ balanced: 1, not_audited: 1 });
  });
});

// -- identifyFundAlerts --------------------------------------------------------

describe("identifyFundAlerts", () => {
  it("returns no alerts for empty data", () => {
    expect(identifyFundAlerts([])).toEqual([]);
  });

  it("critical: discrepancy found (per-record)", () => {
    const txn = makeTransaction({ id: "d1", audit_result: "discrepancy_found" });
    const alerts = identifyFundAlerts([txn]);
    const matched = alerts.filter((a) => a.type === "discrepancy_found");
    expect(matched).toHaveLength(1);
    expect(matched[0].severity).toBe("critical");
    expect(matched[0].id).toBe("d1");
  });

  it("high: under investigation (per-record)", () => {
    const txn = makeTransaction({ id: "ui1", audit_result: "under_investigation", amount: 25.50 });
    const alerts = identifyFundAlerts([txn]);
    const matched = alerts.filter((a) => a.type === "under_investigation");
    expect(matched).toHaveLength(1);
    expect(matched[0].severity).toBe("high");
    expect(matched[0].message).toContain("25.50");
  });

  it("high: pending authorisation (threshold >= 1)", () => {
    const txn = makeTransaction({ id: "pa1", authorisation_status: "pending_authorisation" });
    const alerts = identifyFundAlerts([txn]);
    const matched = alerts.filter((a) => a.type === "pending_authorisation");
    expect(matched).toHaveLength(1);
    expect(matched[0].severity).toBe("high");
  });

  it("medium: no receipt for debits (threshold >= 3)", () => {
    // 2 — should NOT trigger
    const alerts2 = identifyFundAlerts([
      makeTransaction({ id: "1", is_credit: false, receipt_attached: false }),
      makeTransaction({ id: "2", is_credit: false, receipt_attached: false }),
    ]);
    expect(alerts2.filter((a) => a.type === "no_receipt")).toHaveLength(0);

    // 3 — should trigger
    const alerts3 = identifyFundAlerts([
      makeTransaction({ id: "1", is_credit: false, receipt_attached: false }),
      makeTransaction({ id: "2", is_credit: false, receipt_attached: false }),
      makeTransaction({ id: "3", is_credit: false, receipt_attached: false }),
    ]);
    const matched = alerts3.filter((a) => a.type === "no_receipt");
    expect(matched).toHaveLength(1);
    expect(matched[0].severity).toBe("medium");
  });

  it("no_receipt alert ignores credit transactions", () => {
    const alerts = identifyFundAlerts([
      makeTransaction({ id: "1", is_credit: true, receipt_attached: false }),
      makeTransaction({ id: "2", is_credit: true, receipt_attached: false }),
      makeTransaction({ id: "3", is_credit: true, receipt_attached: false }),
    ]);
    expect(alerts.filter((a) => a.type === "no_receipt")).toHaveLength(0);
  });

  it("medium: not audited (threshold >= 5)", () => {
    // 4 — should NOT trigger
    const rows4 = Array.from({ length: 4 }, (_, i) =>
      makeTransaction({ id: `na${i}`, audit_result: "not_audited" }),
    );
    expect(identifyFundAlerts(rows4).filter((a) => a.type === "not_audited")).toHaveLength(0);

    // 5 — should trigger
    const rows5 = Array.from({ length: 5 }, (_, i) =>
      makeTransaction({ id: `na${i}`, audit_result: "not_audited" }),
    );
    const alerts = identifyFundAlerts(rows5);
    const matched = alerts.filter((a) => a.type === "not_audited");
    expect(matched).toHaveLength(1);
    expect(matched[0].severity).toBe("medium");
  });
});
