import { describe, it, expect } from "vitest";
import {
  computePocketMoneyAuditMetrics,
  computePocketMoneyAuditAlerts,
  generatePocketMoneyAuditCaraInsights,
} from "./childrens-pocket-money-audit-service";
import type { ChildrensPocketMoneyAuditRow } from "./childrens-pocket-money-audit-service";

// -- Factory Function ---------------------------------------------------------

function makeRow(overrides: Partial<ChildrensPocketMoneyAuditRow> = {}): ChildrensPocketMoneyAuditRow {
  return {
    id: "audit-1",
    home_id: "home-1",
    child_name: "Alex",
    child_id: "c1",
    audit_date: "2026-05-15",
    transaction_type: "weekly_allowance",
    audit_outcome: "compliant",
    reconciliation_status: "reconciled",
    spending_category: "food_treats",
    amount: 5.0,
    running_balance: 20.0,
    receipt_obtained: true,
    child_signed: true,
    staff_witnessed: true,
    two_signatures_present: true,
    balance_matches_record: true,
    child_consulted_on_spending: true,
    notes: null,
    created_at: "2026-05-15T00:00:00Z",
    updated_at: "2026-05-15T00:00:00Z",
    ...overrides,
  };
}

// -- computePocketMoneyAuditMetrics -------------------------------------------

describe("computePocketMoneyAuditMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computePocketMoneyAuditMetrics([]);
    expect(m.total_audits).toBe(0);
    expect(m.significant_discrepancy_count).toBe(0);
    expect(m.fraud_suspected_count).toBe(0);
    expect(m.receipt_rate).toBe(0);
    expect(m.unique_children).toBe(0);
  });

  it("computes populated metrics correctly", () => {
    const rows = [
      makeRow({ child_name: "Alex", receipt_obtained: true, child_signed: true, two_signatures_present: true }),
      makeRow({
        id: "audit-2",
        child_name: "Beth",
        audit_outcome: "significant_discrepancy",
        reconciliation_status: "discrepancy_found",
        receipt_obtained: false,
        child_signed: false,
        two_signatures_present: false,
        balance_matches_record: false,
      }),
      makeRow({
        id: "audit-3",
        child_name: "Chris",
        audit_outcome: "fraud_suspected",
        receipt_obtained: true,
        child_signed: true,
        two_signatures_present: true,
      }),
    ];
    const m = computePocketMoneyAuditMetrics(rows);

    expect(m.total_audits).toBe(3);
    expect(m.significant_discrepancy_count).toBe(1);
    expect(m.fraud_suspected_count).toBe(1);
    expect(m.discrepancy_found_count).toBe(1);
    expect(m.unique_children).toBe(3);
    // 2/3 receipt = 66.7%
    expect(m.receipt_rate).toBe(66.7);
    // 2/3 child signed
    expect(m.child_signed_rate).toBe(66.7);
    // 2/3 two sigs
    expect(m.two_signatures_rate).toBe(66.7);
    // 2/3 balance matches
    expect(m.balance_matches_rate).toBe(66.7);
    expect(m.outcome_breakdown).toEqual({
      compliant: 1,
      significant_discrepancy: 1,
      fraud_suspected: 1,
    });
  });
});

// -- computePocketMoneyAuditAlerts --------------------------------------------

describe("computePocketMoneyAuditAlerts", () => {
  it("returns no alerts for empty data", () => {
    const alerts = computePocketMoneyAuditAlerts([]);
    expect(alerts).toHaveLength(0);
  });

  it("fires fraud_suspected for fraud_suspected outcome", () => {
    const rows = [makeRow({ audit_outcome: "fraud_suspected", spending_category: "entertainment", amount: 50 })];
    const alerts = computePocketMoneyAuditAlerts(rows);
    expect(alerts.some((a) => a.type === "fraud_suspected" && a.severity === "critical")).toBe(true);
  });

  it("fires significant_discrepancy_balance_mismatch for significant discrepancy + balance mismatch", () => {
    const rows = [
      makeRow({ audit_outcome: "significant_discrepancy", balance_matches_record: false }),
    ];
    const alerts = computePocketMoneyAuditAlerts(rows);
    expect(alerts.some((a) => a.type === "significant_discrepancy_balance_mismatch" && a.severity === "high")).toBe(true);
  });

  it("fires two_signatures_missing when >= 2 transactions without two signatures", () => {
    const rows = [
      makeRow({ id: "a1", two_signatures_present: false }),
      makeRow({ id: "a2", two_signatures_present: false }),
    ];
    const alerts = computePocketMoneyAuditAlerts(rows);
    expect(alerts.some((a) => a.type === "two_signatures_missing" && a.severity === "high")).toBe(true);
  });

  it("does NOT fire two_signatures_missing when only 1 transaction missing", () => {
    const rows = [
      makeRow({ two_signatures_present: false }),
    ];
    const alerts = computePocketMoneyAuditAlerts(rows);
    expect(alerts.some((a) => a.type === "two_signatures_missing")).toBe(false);
  });

  it("fires child_not_consulted when >= 2 transactions without consultation", () => {
    const rows = [
      makeRow({ id: "a1", child_consulted_on_spending: false }),
      makeRow({ id: "a2", child_consulted_on_spending: false }),
    ];
    const alerts = computePocketMoneyAuditAlerts(rows);
    expect(alerts.some((a) => a.type === "child_not_consulted" && a.severity === "medium")).toBe(true);
  });
});

// -- generatePocketMoneyAuditCaraInsights -------------------------------------

describe("generatePocketMoneyAuditCaraInsights", () => {
  it("returns 3 insights for populated data", () => {
    const rows = [makeRow(), makeRow({ id: "a2", child_name: "Beth" })];
    const metrics = computePocketMoneyAuditMetrics(rows);
    const alerts = computePocketMoneyAuditAlerts(rows);
    const insights = generatePocketMoneyAuditCaraInsights(metrics, alerts);

    expect(insights).toHaveLength(3);
    expect(insights[0]).toContain("[cyan]");
    expect(insights[1]).toContain("[amber]");
    expect(insights[2]).toContain("[reflect]");
  });

  it("returns 3 insights even for empty data", () => {
    const metrics = computePocketMoneyAuditMetrics([]);
    const alerts = computePocketMoneyAuditAlerts([]);
    const insights = generatePocketMoneyAuditCaraInsights(metrics, alerts);
    expect(insights).toHaveLength(3);
  });
});
