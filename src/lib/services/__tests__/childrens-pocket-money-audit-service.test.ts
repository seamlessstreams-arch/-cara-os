// ══════════════════════════════════════════════════════════════════════════════
// CARA — CHILDREN'S POCKET MONEY AUDIT SERVICE TESTS
// Pure-function tests for pocket money audit metrics, alert identification,
// Cara insight generation, and edge cases.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";

import {
  TRANSACTION_TYPES,
  AUDIT_OUTCOMES,
  RECONCILIATION_STATUSES,
  SPENDING_CATEGORIES,
  _testing,
} from "../childrens-pocket-money-audit-service";

import type {
  ChildrensPocketMoneyAuditRow,
  TransactionType,
  AuditOutcome,
  ReconciliationStatus,
  SpendingCategory,
} from "../childrens-pocket-money-audit-service";

const {
  computePocketMoneyAuditMetrics,
  computePocketMoneyAuditAlerts,
  generatePocketMoneyAuditCaraInsights,
} = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

const now = new Date(new Date().toISOString().split("T")[0]);

function makeRow(
  overrides?: Partial<ChildrensPocketMoneyAuditRow>,
): ChildrensPocketMoneyAuditRow {
  return {
    id: "id" in (overrides ?? {}) ? overrides!.id! : crypto.randomUUID(),
    home_id: "home_id" in (overrides ?? {}) ? overrides!.home_id! : "home-1",
    child_name: "child_name" in (overrides ?? {}) ? overrides!.child_name! : "Child A",
    child_id: "child_id" in (overrides ?? {}) ? (overrides!.child_id ?? null) : null,
    audit_date: "audit_date" in (overrides ?? {}) ? overrides!.audit_date! : now.toISOString().split("T")[0],
    transaction_type: "transaction_type" in (overrides ?? {}) ? overrides!.transaction_type! : "weekly_allowance",
    audit_outcome: "audit_outcome" in (overrides ?? {}) ? overrides!.audit_outcome! : "compliant",
    reconciliation_status: "reconciliation_status" in (overrides ?? {}) ? overrides!.reconciliation_status! : "reconciled",
    spending_category: "spending_category" in (overrides ?? {}) ? overrides!.spending_category! : "food_treats",
    amount: "amount" in (overrides ?? {}) ? overrides!.amount! : 5.0,
    running_balance: "running_balance" in (overrides ?? {}) ? overrides!.running_balance! : 20.0,
    receipt_obtained: "receipt_obtained" in (overrides ?? {}) ? overrides!.receipt_obtained! : true,
    child_signed: "child_signed" in (overrides ?? {}) ? overrides!.child_signed! : true,
    staff_witnessed: "staff_witnessed" in (overrides ?? {}) ? overrides!.staff_witnessed! : true,
    two_signatures_present: "two_signatures_present" in (overrides ?? {}) ? overrides!.two_signatures_present! : true,
    balance_matches_record: "balance_matches_record" in (overrides ?? {}) ? overrides!.balance_matches_record! : true,
    child_consulted_on_spending: "child_consulted_on_spending" in (overrides ?? {}) ? overrides!.child_consulted_on_spending! : true,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: "created_at" in (overrides ?? {}) ? overrides!.created_at! : now.toISOString(),
    updated_at: "updated_at" in (overrides ?? {}) ? overrides!.updated_at! : now.toISOString(),
  };
}

// ── computePocketMoneyAuditMetrics ────────────────────────────────────────

describe("computePocketMoneyAuditMetrics", () => {
  describe("empty array", () => {
    it("returns zero total_audits", () => {
      const m = computePocketMoneyAuditMetrics([]);
      expect(m.total_audits).toBe(0);
    });

    it("returns zero significant_discrepancy_count", () => {
      const m = computePocketMoneyAuditMetrics([]);
      expect(m.significant_discrepancy_count).toBe(0);
    });

    it("returns zero fraud_suspected_count", () => {
      const m = computePocketMoneyAuditMetrics([]);
      expect(m.fraud_suspected_count).toBe(0);
    });

    it("returns zero discrepancy_found_count", () => {
      const m = computePocketMoneyAuditMetrics([]);
      expect(m.discrepancy_found_count).toBe(0);
    });

    it("returns zero not_audited_count", () => {
      const m = computePocketMoneyAuditMetrics([]);
      expect(m.not_audited_count).toBe(0);
    });

    it("returns zero receipt_rate", () => {
      const m = computePocketMoneyAuditMetrics([]);
      expect(m.receipt_rate).toBe(0);
    });

    it("returns zero child_signed_rate", () => {
      const m = computePocketMoneyAuditMetrics([]);
      expect(m.child_signed_rate).toBe(0);
    });

    it("returns zero staff_witnessed_rate", () => {
      const m = computePocketMoneyAuditMetrics([]);
      expect(m.staff_witnessed_rate).toBe(0);
    });

    it("returns zero two_signatures_rate", () => {
      const m = computePocketMoneyAuditMetrics([]);
      expect(m.two_signatures_rate).toBe(0);
    });

    it("returns zero balance_matches_rate", () => {
      const m = computePocketMoneyAuditMetrics([]);
      expect(m.balance_matches_rate).toBe(0);
    });

    it("returns empty transaction_type_breakdown", () => {
      const m = computePocketMoneyAuditMetrics([]);
      expect(m.transaction_type_breakdown).toEqual({});
    });

    it("returns empty outcome_breakdown", () => {
      const m = computePocketMoneyAuditMetrics([]);
      expect(m.outcome_breakdown).toEqual({});
    });

    it("returns zero unique_children", () => {
      const m = computePocketMoneyAuditMetrics([]);
      expect(m.unique_children).toBe(0);
    });
  });

  describe("single row", () => {
    const row = makeRow({
      audit_outcome: "compliant",
      reconciliation_status: "reconciled",
      receipt_obtained: true,
      child_signed: true,
      staff_witnessed: true,
      two_signatures_present: true,
      balance_matches_record: true,
      child_consulted_on_spending: true,
      transaction_type: "weekly_allowance",
      child_name: "Child A",
    });

    it("returns total_audits = 1", () => {
      const m = computePocketMoneyAuditMetrics([row]);
      expect(m.total_audits).toBe(1);
    });

    it("returns receipt_rate = 100", () => {
      const m = computePocketMoneyAuditMetrics([row]);
      expect(m.receipt_rate).toBe(100);
    });

    it("returns child_signed_rate = 100", () => {
      const m = computePocketMoneyAuditMetrics([row]);
      expect(m.child_signed_rate).toBe(100);
    });

    it("returns staff_witnessed_rate = 100", () => {
      const m = computePocketMoneyAuditMetrics([row]);
      expect(m.staff_witnessed_rate).toBe(100);
    });

    it("returns two_signatures_rate = 100", () => {
      const m = computePocketMoneyAuditMetrics([row]);
      expect(m.two_signatures_rate).toBe(100);
    });

    it("returns balance_matches_rate = 100", () => {
      const m = computePocketMoneyAuditMetrics([row]);
      expect(m.balance_matches_rate).toBe(100);
    });

    it("returns fraud_suspected_count = 0", () => {
      const m = computePocketMoneyAuditMetrics([row]);
      expect(m.fraud_suspected_count).toBe(0);
    });

    it("returns transaction_type_breakdown with single entry", () => {
      const m = computePocketMoneyAuditMetrics([row]);
      expect(m.transaction_type_breakdown).toEqual({ weekly_allowance: 1 });
    });

    it("returns outcome_breakdown with single entry", () => {
      const m = computePocketMoneyAuditMetrics([row]);
      expect(m.outcome_breakdown).toEqual({ compliant: 1 });
    });

    it("returns unique_children = 1", () => {
      const m = computePocketMoneyAuditMetrics([row]);
      expect(m.unique_children).toBe(1);
    });
  });

  describe("multiple rows", () => {
    const rows = [
      makeRow({ audit_outcome: "compliant", reconciliation_status: "reconciled", child_name: "Child A", receipt_obtained: true, child_signed: true, staff_witnessed: true, two_signatures_present: true, balance_matches_record: true, transaction_type: "weekly_allowance" }),
      makeRow({ audit_outcome: "significant_discrepancy", reconciliation_status: "discrepancy_found", child_name: "Child B", receipt_obtained: false, child_signed: false, staff_witnessed: true, two_signatures_present: false, balance_matches_record: false, transaction_type: "birthday_gift" }),
      makeRow({ audit_outcome: "fraud_suspected", reconciliation_status: "escalated", child_name: "Child C", receipt_obtained: true, child_signed: true, staff_witnessed: false, two_signatures_present: true, balance_matches_record: true, transaction_type: "savings_deposit" }),
    ];

    it("returns total_audits = 3", () => {
      const m = computePocketMoneyAuditMetrics(rows);
      expect(m.total_audits).toBe(3);
    });

    it("returns significant_discrepancy_count = 1", () => {
      const m = computePocketMoneyAuditMetrics(rows);
      expect(m.significant_discrepancy_count).toBe(1);
    });

    it("returns fraud_suspected_count = 1", () => {
      const m = computePocketMoneyAuditMetrics(rows);
      expect(m.fraud_suspected_count).toBe(1);
    });

    it("returns discrepancy_found_count = 1", () => {
      const m = computePocketMoneyAuditMetrics(rows);
      expect(m.discrepancy_found_count).toBe(1);
    });

    it("calculates receipt_rate correctly (2/3 = 66.7%)", () => {
      const m = computePocketMoneyAuditMetrics(rows);
      expect(m.receipt_rate).toBe(66.7);
    });

    it("calculates child_signed_rate correctly (2/3 = 66.7%)", () => {
      const m = computePocketMoneyAuditMetrics(rows);
      expect(m.child_signed_rate).toBe(66.7);
    });

    it("calculates staff_witnessed_rate correctly (2/3 = 66.7%)", () => {
      const m = computePocketMoneyAuditMetrics(rows);
      expect(m.staff_witnessed_rate).toBe(66.7);
    });

    it("calculates two_signatures_rate correctly (2/3 = 66.7%)", () => {
      const m = computePocketMoneyAuditMetrics(rows);
      expect(m.two_signatures_rate).toBe(66.7);
    });

    it("calculates balance_matches_rate correctly (2/3 = 66.7%)", () => {
      const m = computePocketMoneyAuditMetrics(rows);
      expect(m.balance_matches_rate).toBe(66.7);
    });

    it("groups transaction_type_breakdown correctly", () => {
      const m = computePocketMoneyAuditMetrics(rows);
      expect(m.transaction_type_breakdown).toEqual({
        weekly_allowance: 1,
        birthday_gift: 1,
        savings_deposit: 1,
      });
    });

    it("groups outcome_breakdown correctly", () => {
      const m = computePocketMoneyAuditMetrics(rows);
      expect(m.outcome_breakdown).toEqual({
        compliant: 1,
        significant_discrepancy: 1,
        fraud_suspected: 1,
      });
    });

    it("returns unique_children = 3", () => {
      const m = computePocketMoneyAuditMetrics(rows);
      expect(m.unique_children).toBe(3);
    });
  });

  describe("transaction_type_breakdown", () => {
    it("counts duplicate transaction types", () => {
      const rows = [
        makeRow({ transaction_type: "weekly_allowance" }),
        makeRow({ transaction_type: "weekly_allowance" }),
        makeRow({ transaction_type: "birthday_gift" }),
      ];
      const m = computePocketMoneyAuditMetrics(rows);
      expect(m.transaction_type_breakdown).toEqual({ weekly_allowance: 2, birthday_gift: 1 });
    });

    it("handles all 10 transaction types", () => {
      const rows = TRANSACTION_TYPES.map((t) => makeRow({ transaction_type: t }));
      const m = computePocketMoneyAuditMetrics(rows);
      for (const t of TRANSACTION_TYPES) {
        expect(m.transaction_type_breakdown[t]).toBe(1);
      }
    });
  });

  describe("outcome_breakdown", () => {
    it("counts duplicate outcomes", () => {
      const rows = [
        makeRow({ audit_outcome: "compliant" }),
        makeRow({ audit_outcome: "compliant" }),
        makeRow({ audit_outcome: "fraud_suspected" }),
      ];
      const m = computePocketMoneyAuditMetrics(rows);
      expect(m.outcome_breakdown).toEqual({ compliant: 2, fraud_suspected: 1 });
    });

    it("handles all 5 audit outcomes", () => {
      const rows = AUDIT_OUTCOMES.map((o) => makeRow({ audit_outcome: o }));
      const m = computePocketMoneyAuditMetrics(rows);
      for (const o of AUDIT_OUTCOMES) {
        expect(m.outcome_breakdown[o]).toBe(1);
      }
    });
  });

  describe("unique_children", () => {
    it("counts distinct children", () => {
      const rows = [
        makeRow({ child_name: "Child A" }),
        makeRow({ child_name: "Child A" }),
        makeRow({ child_name: "Child B" }),
      ];
      const m = computePocketMoneyAuditMetrics(rows);
      expect(m.unique_children).toBe(2);
    });

    it("returns 1 when all rows have the same child", () => {
      const rows = [
        makeRow({ child_name: "Child A" }),
        makeRow({ child_name: "Child A" }),
        makeRow({ child_name: "Child A" }),
      ];
      const m = computePocketMoneyAuditMetrics(rows);
      expect(m.unique_children).toBe(1);
    });

    it("counts each unique child name", () => {
      const rows = [
        makeRow({ child_name: "Alice" }),
        makeRow({ child_name: "Bob" }),
        makeRow({ child_name: "Charlie" }),
        makeRow({ child_name: "Alice" }),
      ];
      const m = computePocketMoneyAuditMetrics(rows);
      expect(m.unique_children).toBe(3);
    });
  });

  describe("percentage calculations with known values", () => {
    it("receipt_rate 0 when all false", () => {
      expect(computePocketMoneyAuditMetrics([makeRow({ receipt_obtained: false })]).receipt_rate).toBe(0);
    });

    it("mixed boolean rate (1/3 = 33.3%)", () => {
      const rows = [
        makeRow({ receipt_obtained: true }),
        makeRow({ receipt_obtained: false }),
        makeRow({ receipt_obtained: false }),
      ];
      const m = computePocketMoneyAuditMetrics(rows);
      expect(m.receipt_rate).toBe(33.3);
    });

    it("returns 100 for all rates when single row has all flags true", () => {
      const rows = [
        makeRow({ receipt_obtained: true, child_signed: true, staff_witnessed: true, two_signatures_present: true, balance_matches_record: true }),
      ];
      const m = computePocketMoneyAuditMetrics(rows);
      expect(m.receipt_rate).toBe(100);
      expect(m.child_signed_rate).toBe(100);
      expect(m.staff_witnessed_rate).toBe(100);
      expect(m.two_signatures_rate).toBe(100);
      expect(m.balance_matches_rate).toBe(100);
    });
  });

  describe("counts", () => {
    it("counts significant_discrepancy_count", () => {
      expect(computePocketMoneyAuditMetrics([makeRow({ audit_outcome: "significant_discrepancy" })]).significant_discrepancy_count).toBe(1);
    });

    it("does not count minor_discrepancy as significant", () => {
      expect(computePocketMoneyAuditMetrics([makeRow({ audit_outcome: "minor_discrepancy" })]).significant_discrepancy_count).toBe(0);
    });

    it("counts fraud_suspected_count", () => {
      expect(computePocketMoneyAuditMetrics([makeRow({ audit_outcome: "fraud_suspected" })]).fraud_suspected_count).toBe(1);
    });

    it("counts discrepancy_found_count from reconciliation_status", () => {
      expect(computePocketMoneyAuditMetrics([makeRow({ reconciliation_status: "discrepancy_found" })]).discrepancy_found_count).toBe(1);
    });

    it("does not count pending as discrepancy_found", () => {
      expect(computePocketMoneyAuditMetrics([makeRow({ reconciliation_status: "pending" })]).discrepancy_found_count).toBe(0);
    });

    it("counts not_audited_count", () => {
      expect(computePocketMoneyAuditMetrics([makeRow({ audit_outcome: "not_audited" })]).not_audited_count).toBe(1);
    });

    it("does not count compliant as not_audited", () => {
      expect(computePocketMoneyAuditMetrics([makeRow({ audit_outcome: "compliant" })]).not_audited_count).toBe(0);
    });
  });
});

// ── computePocketMoneyAuditAlerts ────────────────────────────────────────

describe("computePocketMoneyAuditAlerts", () => {
  describe("no alerts", () => {
    it("returns empty array when no rows", () => {
      const alerts = computePocketMoneyAuditAlerts([]);
      expect(alerts).toHaveLength(0);
    });

    it("returns empty array when all rows are clean", () => {
      const rows = [
        makeRow({ audit_outcome: "compliant", balance_matches_record: true, two_signatures_present: true, child_consulted_on_spending: true }),
      ];
      const alerts = computePocketMoneyAuditAlerts(rows);
      expect(alerts).toEqual([]);
    });
  });

  describe("fraud_suspected alert", () => {
    it("fires when audit_outcome is fraud_suspected", () => {
      const rows = [makeRow({ audit_outcome: "fraud_suspected" })];
      const alerts = computePocketMoneyAuditAlerts(rows);
      const alert = alerts.find((a) => a.type === "fraud_suspected");
      expect(alert).toBeDefined();
    });

    it("has severity critical", () => {
      const rows = [makeRow({ audit_outcome: "fraud_suspected" })];
      const alerts = computePocketMoneyAuditAlerts(rows);
      const alert = alerts.find((a) => a.type === "fraud_suspected")!;
      expect(alert.severity).toBe("critical");
    });

    it("includes record_id", () => {
      const rows = [makeRow({ id: "aud-1", audit_outcome: "fraud_suspected" })];
      const alerts = computePocketMoneyAuditAlerts(rows);
      const alert = alerts.find((a) => a.type === "fraud_suspected")!;
      expect(alert.record_id).toBe("aud-1");
    });

    it("includes child name in message", () => {
      const rows = [makeRow({ audit_outcome: "fraud_suspected", child_name: "Alice" })];
      const alerts = computePocketMoneyAuditAlerts(rows);
      const alert = alerts.find((a) => a.type === "fraud_suspected")!;
      expect(alert.message).toContain("Alice");
    });

    it("replaces underscores in spending category in message", () => {
      const rows = [makeRow({ audit_outcome: "fraud_suspected", spending_category: "food_treats" })];
      const alerts = computePocketMoneyAuditAlerts(rows);
      const alert = alerts.find((a) => a.type === "fraud_suspected")!;
      expect(alert.message).toContain("food treats");
    });

    it("does not fire for compliant outcome", () => {
      const rows = [makeRow({ audit_outcome: "compliant" })];
      const alerts = computePocketMoneyAuditAlerts(rows);
      const alert = alerts.find((a) => a.type === "fraud_suspected");
      expect(alert).toBeUndefined();
    });

    it("does not fire for significant_discrepancy outcome", () => {
      const rows = [makeRow({ audit_outcome: "significant_discrepancy" })];
      const alerts = computePocketMoneyAuditAlerts(rows);
      const alert = alerts.find((a) => a.type === "fraud_suspected");
      expect(alert).toBeUndefined();
    });

    it("fires per record for multiple fraud_suspected", () => {
      const rows = [
        makeRow({ audit_outcome: "fraud_suspected" }),
        makeRow({ audit_outcome: "fraud_suspected" }),
      ];
      const alerts = computePocketMoneyAuditAlerts(rows);
      const critical = alerts.filter((a) => a.type === "fraud_suspected");
      expect(critical).toHaveLength(2);
    });
  });

  describe("significant_discrepancy_balance_mismatch alert", () => {
    it("fires when significant_discrepancy and balance does not match", () => {
      const rows = [makeRow({ audit_outcome: "significant_discrepancy", balance_matches_record: false })];
      const alerts = computePocketMoneyAuditAlerts(rows);
      const alert = alerts.find((a) => a.type === "significant_discrepancy_balance_mismatch");
      expect(alert).toBeDefined();
    });

    it("has severity high", () => {
      const rows = [makeRow({ audit_outcome: "significant_discrepancy", balance_matches_record: false })];
      const alerts = computePocketMoneyAuditAlerts(rows);
      const alert = alerts.find((a) => a.type === "significant_discrepancy_balance_mismatch")!;
      expect(alert.severity).toBe("high");
    });

    it("includes record_id", () => {
      const rows = [makeRow({ id: "aud-2", audit_outcome: "significant_discrepancy", balance_matches_record: false })];
      const alerts = computePocketMoneyAuditAlerts(rows);
      const alert = alerts.find((a) => a.type === "significant_discrepancy_balance_mismatch")!;
      expect(alert.record_id).toBe("aud-2");
    });

    it("does not fire when balance matches", () => {
      const rows = [makeRow({ audit_outcome: "significant_discrepancy", balance_matches_record: true })];
      const alerts = computePocketMoneyAuditAlerts(rows);
      const alert = alerts.find((a) => a.type === "significant_discrepancy_balance_mismatch");
      expect(alert).toBeUndefined();
    });

    it("does not fire for minor_discrepancy with balance not matching", () => {
      const rows = [makeRow({ audit_outcome: "minor_discrepancy", balance_matches_record: false })];
      const alerts = computePocketMoneyAuditAlerts(rows);
      const alert = alerts.find((a) => a.type === "significant_discrepancy_balance_mismatch");
      expect(alert).toBeUndefined();
    });

    it("fires per record for multiple significant discrepancy + balance mismatch", () => {
      const rows = [
        makeRow({ audit_outcome: "significant_discrepancy", balance_matches_record: false }),
        makeRow({ audit_outcome: "significant_discrepancy", balance_matches_record: false }),
      ];
      const alerts = computePocketMoneyAuditAlerts(rows);
      const high = alerts.filter((a) => a.type === "significant_discrepancy_balance_mismatch");
      expect(high).toHaveLength(2);
    });
  });

  describe("two_signatures_missing alert", () => {
    it("fires when 2 or more transactions lack two signatures", () => {
      const rows = [
        makeRow({ two_signatures_present: false }),
        makeRow({ two_signatures_present: false }),
      ];
      const alerts = computePocketMoneyAuditAlerts(rows);
      const alert = alerts.find((a) => a.type === "two_signatures_missing");
      expect(alert).toBeDefined();
    });

    it("has severity high", () => {
      const rows = [
        makeRow({ two_signatures_present: false }),
        makeRow({ two_signatures_present: false }),
      ];
      const alerts = computePocketMoneyAuditAlerts(rows);
      const alert = alerts.find((a) => a.type === "two_signatures_missing")!;
      expect(alert.severity).toBe("high");
    });

    it("includes count in message", () => {
      const rows = [
        makeRow({ two_signatures_present: false }),
        makeRow({ two_signatures_present: false }),
        makeRow({ two_signatures_present: false }),
      ];
      const alerts = computePocketMoneyAuditAlerts(rows);
      const alert = alerts.find((a) => a.type === "two_signatures_missing")!;
      expect(alert.message).toContain("3");
    });

    it("does not fire when only 1 transaction lacks two signatures", () => {
      const rows = [makeRow({ two_signatures_present: false })];
      const alerts = computePocketMoneyAuditAlerts(rows);
      const alert = alerts.find((a) => a.type === "two_signatures_missing");
      expect(alert).toBeUndefined();
    });

    it("does not fire when all have two signatures", () => {
      const rows = [makeRow({ two_signatures_present: true }), makeRow({ two_signatures_present: true })];
      const alerts = computePocketMoneyAuditAlerts(rows);
      const alert = alerts.find((a) => a.type === "two_signatures_missing");
      expect(alert).toBeUndefined();
    });

    it("fires only once as aggregate alert", () => {
      const rows = [
        makeRow({ two_signatures_present: false }),
        makeRow({ two_signatures_present: false }),
        makeRow({ two_signatures_present: false }),
      ];
      const alerts = computePocketMoneyAuditAlerts(rows);
      const missing = alerts.filter((a) => a.type === "two_signatures_missing");
      expect(missing).toHaveLength(1);
    });
  });

  describe("child_not_consulted alert", () => {
    it("fires when 2 or more transactions have child not consulted", () => {
      const rows = [
        makeRow({ child_consulted_on_spending: false }),
        makeRow({ child_consulted_on_spending: false }),
      ];
      const alerts = computePocketMoneyAuditAlerts(rows);
      const alert = alerts.find((a) => a.type === "child_not_consulted");
      expect(alert).toBeDefined();
    });

    it("has severity medium", () => {
      const rows = [
        makeRow({ child_consulted_on_spending: false }),
        makeRow({ child_consulted_on_spending: false }),
      ];
      const alerts = computePocketMoneyAuditAlerts(rows);
      const alert = alerts.find((a) => a.type === "child_not_consulted")!;
      expect(alert.severity).toBe("medium");
    });

    it("includes count in message", () => {
      const rows = [
        makeRow({ child_consulted_on_spending: false }),
        makeRow({ child_consulted_on_spending: false }),
        makeRow({ child_consulted_on_spending: false }),
      ];
      const alerts = computePocketMoneyAuditAlerts(rows);
      const alert = alerts.find((a) => a.type === "child_not_consulted")!;
      expect(alert.message).toContain("3");
    });

    it("does not fire when only 1 transaction has child not consulted", () => {
      const rows = [makeRow({ child_consulted_on_spending: false })];
      const alerts = computePocketMoneyAuditAlerts(rows);
      const alert = alerts.find((a) => a.type === "child_not_consulted");
      expect(alert).toBeUndefined();
    });

    it("does not fire when all children are consulted", () => {
      const rows = [
        makeRow({ child_consulted_on_spending: true }),
        makeRow({ child_consulted_on_spending: true }),
      ];
      const alerts = computePocketMoneyAuditAlerts(rows);
      const alert = alerts.find((a) => a.type === "child_not_consulted");
      expect(alert).toBeUndefined();
    });

    it("fires only once as aggregate alert", () => {
      const rows = [
        makeRow({ child_consulted_on_spending: false }),
        makeRow({ child_consulted_on_spending: false }),
        makeRow({ child_consulted_on_spending: false }),
      ];
      const alerts = computePocketMoneyAuditAlerts(rows);
      const notConsulted = alerts.filter((a) => a.type === "child_not_consulted");
      expect(notConsulted).toHaveLength(1);
    });
  });

  describe("combined alerts", () => {
    it("can fire all four alert types simultaneously", () => {
      const rows = [
        makeRow({ audit_outcome: "fraud_suspected", two_signatures_present: false, child_consulted_on_spending: false }),
        makeRow({ audit_outcome: "significant_discrepancy", balance_matches_record: false, two_signatures_present: false, child_consulted_on_spending: false }),
      ];
      const alerts = computePocketMoneyAuditAlerts(rows);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("fraud_suspected");
      expect(types).toContain("significant_discrepancy_balance_mismatch");
      expect(types).toContain("two_signatures_missing");
      expect(types).toContain("child_not_consulted");
    });
  });

  describe("alert structure", () => {
    it("every alert has type, severity, and message fields", () => {
      const rows = [
        makeRow({ audit_outcome: "fraud_suspected", two_signatures_present: false, child_consulted_on_spending: false }),
        makeRow({ audit_outcome: "significant_discrepancy", balance_matches_record: false, two_signatures_present: false, child_consulted_on_spending: false }),
      ];
      const alerts = computePocketMoneyAuditAlerts(rows);
      for (const alert of alerts) {
        expect(alert).toHaveProperty("type");
        expect(alert).toHaveProperty("severity");
        expect(alert).toHaveProperty("message");
      }
    });

    it("severity is always one of critical, high, or medium", () => {
      const rows = [
        makeRow({ audit_outcome: "fraud_suspected", two_signatures_present: false, child_consulted_on_spending: false }),
        makeRow({ audit_outcome: "significant_discrepancy", balance_matches_record: false, two_signatures_present: false, child_consulted_on_spending: false }),
      ];
      const alerts = computePocketMoneyAuditAlerts(rows);
      for (const alert of alerts) {
        expect(["critical", "high", "medium"]).toContain(alert.severity);
      }
    });

    it("message is always a non-empty string", () => {
      const rows = [makeRow({ audit_outcome: "fraud_suspected" })];
      const alerts = computePocketMoneyAuditAlerts(rows);
      for (const alert of alerts) {
        expect(typeof alert.message).toBe("string");
        expect(alert.message.length).toBeGreaterThan(0);
      }
    });
  });
});

// ── generatePocketMoneyAuditCaraInsights ──────────────────────────────────

describe("generatePocketMoneyAuditCaraInsights", () => {
  it("returns exactly 3 insights", () => {
    const metrics = computePocketMoneyAuditMetrics([]);
    const alerts = computePocketMoneyAuditAlerts([]);
    const insights = generatePocketMoneyAuditCaraInsights(metrics, alerts);
    expect(insights).toHaveLength(3);
  });

  it("first insight starts with [cyan]", () => {
    const metrics = computePocketMoneyAuditMetrics([makeRow()]);
    const alerts = computePocketMoneyAuditAlerts([makeRow()]);
    const insights = generatePocketMoneyAuditCaraInsights(metrics, alerts);
    expect(insights[0]).toMatch(/^\[cyan\]/);
  });

  it("first insight includes total_audits count", () => {
    const rows = [makeRow(), makeRow(), makeRow()];
    const metrics = computePocketMoneyAuditMetrics(rows);
    const alerts = computePocketMoneyAuditAlerts(rows);
    const insights = generatePocketMoneyAuditCaraInsights(metrics, alerts);
    expect(insights[0]).toContain("3");
  });

  it("first insight includes receipt_rate", () => {
    const rows = [makeRow({ receipt_obtained: true }), makeRow({ receipt_obtained: false })];
    const metrics = computePocketMoneyAuditMetrics(rows);
    const alerts = computePocketMoneyAuditAlerts(rows);
    const insights = generatePocketMoneyAuditCaraInsights(metrics, alerts);
    expect(insights[0]).toContain("50%");
  });

  it("second insight starts with [amber]", () => {
    const metrics = computePocketMoneyAuditMetrics([makeRow()]);
    const alerts = computePocketMoneyAuditAlerts([makeRow()]);
    const insights = generatePocketMoneyAuditCaraInsights(metrics, alerts);
    expect(insights[1]).toMatch(/^\[amber\]/);
  });

  it("second insight mentions critical and high alerts when present", () => {
    const rows = [
      makeRow({ audit_outcome: "fraud_suspected", two_signatures_present: false }),
      makeRow({ two_signatures_present: false }),
    ];
    const metrics = computePocketMoneyAuditMetrics(rows);
    const alerts = computePocketMoneyAuditAlerts(rows);
    const insights = generatePocketMoneyAuditCaraInsights(metrics, alerts);
    expect(insights[1]).toContain("critical");
    expect(insights[1]).toContain("high");
  });

  it("second insight mentions no alerts when none present", () => {
    const rows = [makeRow({ audit_outcome: "compliant", balance_matches_record: true, two_signatures_present: true, child_consulted_on_spending: true })];
    const metrics = computePocketMoneyAuditMetrics(rows);
    const alerts = computePocketMoneyAuditAlerts(rows);
    const insights = generatePocketMoneyAuditCaraInsights(metrics, alerts);
    expect(insights[1]).toContain("No critical or high-priority alerts");
  });

  it("third insight starts with [reflect]", () => {
    const metrics = computePocketMoneyAuditMetrics([makeRow()]);
    const alerts = computePocketMoneyAuditAlerts([makeRow()]);
    const insights = generatePocketMoneyAuditCaraInsights(metrics, alerts);
    expect(insights[2]).toMatch(/^\[reflect\]/);
  });

  it("third insight mentions fraud when fraud_suspected_count > 0", () => {
    const rows = [makeRow({ audit_outcome: "fraud_suspected" })];
    const metrics = computePocketMoneyAuditMetrics(rows);
    const alerts = computePocketMoneyAuditAlerts(rows);
    const insights = generatePocketMoneyAuditCaraInsights(metrics, alerts);
    expect(insights[2]).toContain("fraud");
  });

  it("third insight asks about balance when no fraud but balance_matches_rate < 100", () => {
    const rows = [
      makeRow({ audit_outcome: "compliant", balance_matches_record: false }),
      makeRow({ audit_outcome: "compliant", balance_matches_record: true }),
    ];
    const metrics = computePocketMoneyAuditMetrics(rows);
    const alerts = computePocketMoneyAuditAlerts(rows);
    const insights = generatePocketMoneyAuditCaraInsights(metrics, alerts);
    expect(insights[2]).toContain("Balance matches record");
  });

  it("third insight celebrates when all balances match and no fraud", () => {
    const rows = [
      makeRow({ audit_outcome: "compliant", balance_matches_record: true }),
      makeRow({ audit_outcome: "compliant", balance_matches_record: true }),
    ];
    const metrics = computePocketMoneyAuditMetrics(rows);
    const alerts = computePocketMoneyAuditAlerts(rows);
    const insights = generatePocketMoneyAuditCaraInsights(metrics, alerts);
    expect(insights[2]).toContain("balances matching records and no fraud");
  });

  it("uses singular child wording when unique_children is 1", () => {
    const rows = [makeRow({ child_name: "Child A" })];
    const metrics = computePocketMoneyAuditMetrics(rows);
    const alerts = computePocketMoneyAuditAlerts(rows);
    const insights = generatePocketMoneyAuditCaraInsights(metrics, alerts);
    expect(insights[0]).toContain("1 child");
  });

  it("uses plural children wording when unique_children > 1", () => {
    const rows = [
      makeRow({ child_name: "Child A" }),
      makeRow({ child_name: "Child B" }),
    ];
    const metrics = computePocketMoneyAuditMetrics(rows);
    const alerts = computePocketMoneyAuditAlerts(rows);
    const insights = generatePocketMoneyAuditCaraInsights(metrics, alerts);
    expect(insights[0]).toContain("2 children");
  });

  it("all insights are non-empty strings", () => {
    const metrics = computePocketMoneyAuditMetrics([makeRow()]);
    const alerts = computePocketMoneyAuditAlerts([makeRow()]);
    const insights = generatePocketMoneyAuditCaraInsights(metrics, alerts);
    for (const insight of insights) {
      expect(typeof insight).toBe("string");
      expect(insight.length).toBeGreaterThan(0);
    }
  });

  it("uses singular audit wording when 1 fraud suspected", () => {
    const rows = [makeRow({ audit_outcome: "fraud_suspected" })];
    const metrics = computePocketMoneyAuditMetrics(rows);
    const alerts = computePocketMoneyAuditAlerts(rows);
    const insights = generatePocketMoneyAuditCaraInsights(metrics, alerts);
    expect(insights[2]).toContain("audit has");
  });

  it("uses plural audits wording when multiple fraud suspected", () => {
    const rows = [
      makeRow({ audit_outcome: "fraud_suspected" }),
      makeRow({ audit_outcome: "fraud_suspected" }),
    ];
    const metrics = computePocketMoneyAuditMetrics(rows);
    const alerts = computePocketMoneyAuditAlerts(rows);
    const insights = generatePocketMoneyAuditCaraInsights(metrics, alerts);
    expect(insights[2]).toContain("audits have");
  });
});
