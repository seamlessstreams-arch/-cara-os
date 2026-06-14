// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME INSURANCE COMPLIANCE SERVICE TESTS
// Pure-function tests for insurance metrics, alert identification,
// Cara insight generation, and edge cases.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";

import {
  INSURANCE_TYPES,
  COMPLIANCE_STATUSES,
  COVERAGE_LEVELS,
  REVIEW_OUTCOMES,
  _testing,
} from "../home-insurance-compliance-service";

import type {
  HomeInsuranceComplianceRow,
  InsuranceType,
  ComplianceStatus,
  CoverageLevel,
  ReviewOutcome,
} from "../home-insurance-compliance-service";

const {
  computeInsuranceMetrics,
  computeInsuranceAlerts,
  generateInsuranceCaraInsights,
} = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

const now = new Date(new Date().toISOString().split("T")[0]);

function daysFromNow(days: number): string {
  const d = new Date(now);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function makeRow(
  overrides?: Partial<HomeInsuranceComplianceRow>,
): HomeInsuranceComplianceRow {
  return {
    id: "id" in (overrides ?? {}) ? overrides!.id! : crypto.randomUUID(),
    home_id: "home_id" in (overrides ?? {}) ? overrides!.home_id! : "home-1",
    policy_name: "policy_name" in (overrides ?? {}) ? overrides!.policy_name! : "General Policy",
    policy_number: "policy_number" in (overrides ?? {}) ? (overrides!.policy_number ?? null) : null,
    insurance_type: "insurance_type" in (overrides ?? {}) ? overrides!.insurance_type! : "employers_liability",
    compliance_status: "compliance_status" in (overrides ?? {}) ? overrides!.compliance_status! : "compliant",
    coverage_level: "coverage_level" in (overrides ?? {}) ? overrides!.coverage_level! : "full",
    review_outcome: "review_outcome" in (overrides ?? {}) ? overrides!.review_outcome! : "satisfactory",
    renewal_date: "renewal_date" in (overrides ?? {}) ? overrides!.renewal_date! : daysFromNow(90),
    last_review_date: "last_review_date" in (overrides ?? {}) ? overrides!.last_review_date! : now.toISOString().split("T")[0],
    premium_amount: "premium_amount" in (overrides ?? {}) ? (overrides!.premium_amount ?? null) : 1200,
    policy_document_held: "policy_document_held" in (overrides ?? {}) ? overrides!.policy_document_held! : true,
    certificate_displayed: "certificate_displayed" in (overrides ?? {}) ? overrides!.certificate_displayed! : true,
    cover_adequate: "cover_adequate" in (overrides ?? {}) ? overrides!.cover_adequate! : true,
    excess_acceptable: "excess_acceptable" in (overrides ?? {}) ? overrides!.excess_acceptable! : true,
    broker_reviewed: "broker_reviewed" in (overrides ?? {}) ? overrides!.broker_reviewed! : true,
    claims_history_clear: "claims_history_clear" in (overrides ?? {}) ? overrides!.claims_history_clear! : true,
    regulatory_requirement_met: "regulatory_requirement_met" in (overrides ?? {}) ? overrides!.regulatory_requirement_met! : true,
    management_reviewed: "management_reviewed" in (overrides ?? {}) ? overrides!.management_reviewed! : true,
    reviewer_name: "reviewer_name" in (overrides ?? {}) ? (overrides!.reviewer_name ?? null) : null,
    insurer_name: "insurer_name" in (overrides ?? {}) ? (overrides!.insurer_name ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: "created_at" in (overrides ?? {}) ? overrides!.created_at! : now.toISOString(),
    updated_at: "updated_at" in (overrides ?? {}) ? overrides!.updated_at! : now.toISOString(),
  };
}

// ── Enum validation ──────────────────────────────────────────────────────

describe("enum arrays", () => {
  it("INSURANCE_TYPES has 8 entries", () => {
    expect(INSURANCE_TYPES).toHaveLength(8);
  });

  it("INSURANCE_TYPES contains employers_liability", () => {
    expect(INSURANCE_TYPES).toContain("employers_liability");
  });

  it("INSURANCE_TYPES contains public_liability", () => {
    expect(INSURANCE_TYPES).toContain("public_liability");
  });

  it("INSURANCE_TYPES contains cyber", () => {
    expect(INSURANCE_TYPES).toContain("cyber");
  });

  it("COMPLIANCE_STATUSES has 6 entries", () => {
    expect(COMPLIANCE_STATUSES).toHaveLength(6);
  });

  it("COMPLIANCE_STATUSES contains expired", () => {
    expect(COMPLIANCE_STATUSES).toContain("expired");
  });

  it("COMPLIANCE_STATUSES contains gap_identified", () => {
    expect(COMPLIANCE_STATUSES).toContain("gap_identified");
  });

  it("COVERAGE_LEVELS has 5 entries", () => {
    expect(COVERAGE_LEVELS).toHaveLength(5);
  });

  it("COVERAGE_LEVELS contains inadequate", () => {
    expect(COVERAGE_LEVELS).toContain("inadequate");
  });

  it("REVIEW_OUTCOMES has 5 entries", () => {
    expect(REVIEW_OUTCOMES).toHaveLength(5);
  });

  it("REVIEW_OUTCOMES contains non_compliant", () => {
    expect(REVIEW_OUTCOMES).toContain("non_compliant");
  });
});

// ── computeInsuranceMetrics ──────────────────────────────────────────────

describe("computeInsuranceMetrics", () => {
  describe("empty array", () => {
    it("returns zero total_policies", () => {
      const m = computeInsuranceMetrics([]);
      expect(m.total_policies).toBe(0);
    });

    it("returns zero expired_count", () => {
      const m = computeInsuranceMetrics([]);
      expect(m.expired_count).toBe(0);
    });

    it("returns zero renewal_due_count", () => {
      const m = computeInsuranceMetrics([]);
      expect(m.renewal_due_count).toBe(0);
    });

    it("returns zero gap_count", () => {
      const m = computeInsuranceMetrics([]);
      expect(m.gap_count).toBe(0);
    });

    it("returns zero claim_pending_count", () => {
      const m = computeInsuranceMetrics([]);
      expect(m.claim_pending_count).toBe(0);
    });

    it("returns zero document_held_rate", () => {
      const m = computeInsuranceMetrics([]);
      expect(m.document_held_rate).toBe(0);
    });

    it("returns zero certificate_displayed_rate", () => {
      const m = computeInsuranceMetrics([]);
      expect(m.certificate_displayed_rate).toBe(0);
    });

    it("returns zero cover_adequate_rate", () => {
      const m = computeInsuranceMetrics([]);
      expect(m.cover_adequate_rate).toBe(0);
    });

    it("returns zero excess_acceptable_rate", () => {
      const m = computeInsuranceMetrics([]);
      expect(m.excess_acceptable_rate).toBe(0);
    });

    it("returns zero broker_reviewed_rate", () => {
      const m = computeInsuranceMetrics([]);
      expect(m.broker_reviewed_rate).toBe(0);
    });

    it("returns zero claims_clear_rate", () => {
      const m = computeInsuranceMetrics([]);
      expect(m.claims_clear_rate).toBe(0);
    });

    it("returns zero regulatory_met_rate", () => {
      const m = computeInsuranceMetrics([]);
      expect(m.regulatory_met_rate).toBe(0);
    });

    it("returns zero management_reviewed_rate", () => {
      const m = computeInsuranceMetrics([]);
      expect(m.management_reviewed_rate).toBe(0);
    });

    it("returns zero total_premium", () => {
      const m = computeInsuranceMetrics([]);
      expect(m.total_premium).toBe(0);
    });

    it("returns empty insurance_type_breakdown", () => {
      const m = computeInsuranceMetrics([]);
      expect(m.insurance_type_breakdown).toEqual({});
    });

    it("returns empty status_breakdown", () => {
      const m = computeInsuranceMetrics([]);
      expect(m.status_breakdown).toEqual({});
    });

    it("returns zero unique_policies", () => {
      const m = computeInsuranceMetrics([]);
      expect(m.unique_policies).toBe(0);
    });
  });

  describe("single row — all flags true", () => {
    const row = makeRow({
      compliance_status: "compliant",
      policy_document_held: true,
      certificate_displayed: true,
      cover_adequate: true,
      excess_acceptable: true,
      broker_reviewed: true,
      claims_history_clear: true,
      regulatory_requirement_met: true,
      management_reviewed: true,
      premium_amount: 500,
      insurance_type: "employers_liability",
      policy_name: "EL Policy",
    });

    it("returns total_policies = 1", () => {
      const m = computeInsuranceMetrics([row]);
      expect(m.total_policies).toBe(1);
    });

    it("returns document_held_rate = 100", () => {
      const m = computeInsuranceMetrics([row]);
      expect(m.document_held_rate).toBe(100);
    });

    it("returns certificate_displayed_rate = 100", () => {
      const m = computeInsuranceMetrics([row]);
      expect(m.certificate_displayed_rate).toBe(100);
    });

    it("returns cover_adequate_rate = 100", () => {
      const m = computeInsuranceMetrics([row]);
      expect(m.cover_adequate_rate).toBe(100);
    });

    it("returns excess_acceptable_rate = 100", () => {
      const m = computeInsuranceMetrics([row]);
      expect(m.excess_acceptable_rate).toBe(100);
    });

    it("returns broker_reviewed_rate = 100", () => {
      const m = computeInsuranceMetrics([row]);
      expect(m.broker_reviewed_rate).toBe(100);
    });

    it("returns claims_clear_rate = 100", () => {
      const m = computeInsuranceMetrics([row]);
      expect(m.claims_clear_rate).toBe(100);
    });

    it("returns regulatory_met_rate = 100", () => {
      const m = computeInsuranceMetrics([row]);
      expect(m.regulatory_met_rate).toBe(100);
    });

    it("returns management_reviewed_rate = 100", () => {
      const m = computeInsuranceMetrics([row]);
      expect(m.management_reviewed_rate).toBe(100);
    });

    it("returns total_premium = 500", () => {
      const m = computeInsuranceMetrics([row]);
      expect(m.total_premium).toBe(500);
    });

    it("returns insurance_type_breakdown with single entry", () => {
      const m = computeInsuranceMetrics([row]);
      expect(m.insurance_type_breakdown).toEqual({ employers_liability: 1 });
    });

    it("returns status_breakdown with single entry", () => {
      const m = computeInsuranceMetrics([row]);
      expect(m.status_breakdown).toEqual({ compliant: 1 });
    });

    it("returns unique_policies = 1", () => {
      const m = computeInsuranceMetrics([row]);
      expect(m.unique_policies).toBe(1);
    });
  });

  describe("multiple rows", () => {
    const rows = [
      makeRow({ compliance_status: "compliant", insurance_type: "employers_liability", policy_name: "EL", policy_document_held: true, certificate_displayed: true, cover_adequate: true, excess_acceptable: true, broker_reviewed: true, claims_history_clear: true, regulatory_requirement_met: true, management_reviewed: true, premium_amount: 1000 }),
      makeRow({ compliance_status: "expired", insurance_type: "public_liability", policy_name: "PL", policy_document_held: false, certificate_displayed: false, cover_adequate: false, excess_acceptable: false, broker_reviewed: false, claims_history_clear: false, regulatory_requirement_met: false, management_reviewed: false, premium_amount: 2000 }),
      makeRow({ compliance_status: "gap_identified", insurance_type: "building", policy_name: "Building", policy_document_held: true, certificate_displayed: true, cover_adequate: true, excess_acceptable: true, broker_reviewed: true, claims_history_clear: true, regulatory_requirement_met: true, management_reviewed: true, premium_amount: null }),
    ];

    it("returns total_policies = 3", () => {
      const m = computeInsuranceMetrics(rows);
      expect(m.total_policies).toBe(3);
    });

    it("returns expired_count = 1", () => {
      const m = computeInsuranceMetrics(rows);
      expect(m.expired_count).toBe(1);
    });

    it("returns gap_count = 1", () => {
      const m = computeInsuranceMetrics(rows);
      expect(m.gap_count).toBe(1);
    });

    it("calculates document_held_rate correctly (2/3 = 66.7%)", () => {
      const m = computeInsuranceMetrics(rows);
      expect(m.document_held_rate).toBe(66.7);
    });

    it("calculates certificate_displayed_rate correctly (2/3 = 66.7%)", () => {
      const m = computeInsuranceMetrics(rows);
      expect(m.certificate_displayed_rate).toBe(66.7);
    });

    it("calculates cover_adequate_rate correctly (2/3 = 66.7%)", () => {
      const m = computeInsuranceMetrics(rows);
      expect(m.cover_adequate_rate).toBe(66.7);
    });

    it("calculates broker_reviewed_rate correctly (2/3 = 66.7%)", () => {
      const m = computeInsuranceMetrics(rows);
      expect(m.broker_reviewed_rate).toBe(66.7);
    });

    it("calculates regulatory_met_rate correctly (2/3 = 66.7%)", () => {
      const m = computeInsuranceMetrics(rows);
      expect(m.regulatory_met_rate).toBe(66.7);
    });

    it("sums total_premium ignoring nulls", () => {
      const m = computeInsuranceMetrics(rows);
      expect(m.total_premium).toBe(3000);
    });

    it("groups insurance_type_breakdown correctly", () => {
      const m = computeInsuranceMetrics(rows);
      expect(m.insurance_type_breakdown).toEqual({
        employers_liability: 1,
        public_liability: 1,
        building: 1,
      });
    });

    it("groups status_breakdown correctly", () => {
      const m = computeInsuranceMetrics(rows);
      expect(m.status_breakdown).toEqual({
        compliant: 1,
        expired: 1,
        gap_identified: 1,
      });
    });

    it("returns unique_policies = 3", () => {
      const m = computeInsuranceMetrics(rows);
      expect(m.unique_policies).toBe(3);
    });
  });

  describe("insurance_type_breakdown", () => {
    it("counts duplicate insurance types", () => {
      const rows = [
        makeRow({ insurance_type: "employers_liability" }),
        makeRow({ insurance_type: "employers_liability" }),
        makeRow({ insurance_type: "cyber" }),
      ];
      const m = computeInsuranceMetrics(rows);
      expect(m.insurance_type_breakdown).toEqual({ employers_liability: 2, cyber: 1 });
    });

    it("handles all 8 insurance types", () => {
      const rows = INSURANCE_TYPES.map((t) => makeRow({ insurance_type: t }));
      const m = computeInsuranceMetrics(rows);
      for (const t of INSURANCE_TYPES) {
        expect(m.insurance_type_breakdown[t]).toBe(1);
      }
    });
  });

  describe("status_breakdown", () => {
    it("counts duplicate statuses", () => {
      const rows = [
        makeRow({ compliance_status: "compliant" }),
        makeRow({ compliance_status: "compliant" }),
        makeRow({ compliance_status: "expired" }),
      ];
      const m = computeInsuranceMetrics(rows);
      expect(m.status_breakdown).toEqual({ compliant: 2, expired: 1 });
    });

    it("handles all 6 compliance statuses", () => {
      const rows = COMPLIANCE_STATUSES.map((s) => makeRow({ compliance_status: s }));
      const m = computeInsuranceMetrics(rows);
      for (const s of COMPLIANCE_STATUSES) {
        expect(m.status_breakdown[s]).toBe(1);
      }
    });
  });

  describe("unique_policies", () => {
    it("counts distinct policy names", () => {
      const rows = [
        makeRow({ policy_name: "EL Policy" }),
        makeRow({ policy_name: "EL Policy" }),
        makeRow({ policy_name: "PL Policy" }),
      ];
      const m = computeInsuranceMetrics(rows);
      expect(m.unique_policies).toBe(2);
    });

    it("returns 1 when all rows have the same policy name", () => {
      const rows = [
        makeRow({ policy_name: "General" }),
        makeRow({ policy_name: "General" }),
        makeRow({ policy_name: "General" }),
      ];
      const m = computeInsuranceMetrics(rows);
      expect(m.unique_policies).toBe(1);
    });

    it("counts each unique policy name", () => {
      const rows = [
        makeRow({ policy_name: "Alpha" }),
        makeRow({ policy_name: "Beta" }),
        makeRow({ policy_name: "Gamma" }),
        makeRow({ policy_name: "Alpha" }),
      ];
      const m = computeInsuranceMetrics(rows);
      expect(m.unique_policies).toBe(3);
    });
  });

  describe("percentage calculations with known values", () => {
    it("document_held_rate 0 when all false", () => {
      expect(computeInsuranceMetrics([makeRow({ policy_document_held: false })]).document_held_rate).toBe(0);
    });

    it("mixed boolean rate (1/3 = 33.3%)", () => {
      const rows = [
        makeRow({ policy_document_held: true }),
        makeRow({ policy_document_held: false }),
        makeRow({ policy_document_held: false }),
      ];
      const m = computeInsuranceMetrics(rows);
      expect(m.document_held_rate).toBe(33.3);
    });

    it("returns 100 for all rates when single row has all flags true", () => {
      const rows = [
        makeRow({ policy_document_held: true, certificate_displayed: true, cover_adequate: true, excess_acceptable: true, broker_reviewed: true, claims_history_clear: true, regulatory_requirement_met: true, management_reviewed: true }),
      ];
      const m = computeInsuranceMetrics(rows);
      expect(m.document_held_rate).toBe(100);
      expect(m.certificate_displayed_rate).toBe(100);
      expect(m.cover_adequate_rate).toBe(100);
      expect(m.excess_acceptable_rate).toBe(100);
      expect(m.broker_reviewed_rate).toBe(100);
      expect(m.claims_clear_rate).toBe(100);
      expect(m.regulatory_met_rate).toBe(100);
      expect(m.management_reviewed_rate).toBe(100);
    });

    it("returns 50 for 1/2 rate", () => {
      const rows = [
        makeRow({ cover_adequate: true }),
        makeRow({ cover_adequate: false }),
      ];
      const m = computeInsuranceMetrics(rows);
      expect(m.cover_adequate_rate).toBe(50);
    });

    it("returns 25 for 1/4 rate", () => {
      const rows = [
        makeRow({ broker_reviewed: true }),
        makeRow({ broker_reviewed: false }),
        makeRow({ broker_reviewed: false }),
        makeRow({ broker_reviewed: false }),
      ];
      const m = computeInsuranceMetrics(rows);
      expect(m.broker_reviewed_rate).toBe(25);
    });
  });

  describe("total_premium", () => {
    it("sums all non-null premiums", () => {
      const rows = [
        makeRow({ premium_amount: 100 }),
        makeRow({ premium_amount: 200 }),
        makeRow({ premium_amount: 300 }),
      ];
      const m = computeInsuranceMetrics(rows);
      expect(m.total_premium).toBe(600);
    });

    it("returns 0 when all premiums are null", () => {
      const rows = [
        makeRow({ premium_amount: null }),
        makeRow({ premium_amount: null }),
      ];
      const m = computeInsuranceMetrics(rows);
      expect(m.total_premium).toBe(0);
    });

    it("ignores null premiums in sum", () => {
      const rows = [
        makeRow({ premium_amount: 500 }),
        makeRow({ premium_amount: null }),
        makeRow({ premium_amount: 300 }),
      ];
      const m = computeInsuranceMetrics(rows);
      expect(m.total_premium).toBe(800);
    });

    it("handles decimal premiums", () => {
      const rows = [
        makeRow({ premium_amount: 100.50 }),
        makeRow({ premium_amount: 200.75 }),
      ];
      const m = computeInsuranceMetrics(rows);
      expect(m.total_premium).toBe(301.25);
    });
  });

  describe("status counts", () => {
    it("counts expired_count", () => {
      expect(computeInsuranceMetrics([makeRow({ compliance_status: "expired" })]).expired_count).toBe(1);
    });

    it("does not count compliant as expired", () => {
      expect(computeInsuranceMetrics([makeRow({ compliance_status: "compliant" })]).expired_count).toBe(0);
    });

    it("counts renewal_due_count", () => {
      expect(computeInsuranceMetrics([makeRow({ compliance_status: "renewal_due" })]).renewal_due_count).toBe(1);
    });

    it("does not count under_review as renewal_due", () => {
      expect(computeInsuranceMetrics([makeRow({ compliance_status: "under_review" })]).renewal_due_count).toBe(0);
    });

    it("counts gap_count", () => {
      expect(computeInsuranceMetrics([makeRow({ compliance_status: "gap_identified" })]).gap_count).toBe(1);
    });

    it("does not count claim_pending as gap_identified", () => {
      expect(computeInsuranceMetrics([makeRow({ compliance_status: "claim_pending" })]).gap_count).toBe(0);
    });

    it("counts claim_pending_count", () => {
      expect(computeInsuranceMetrics([makeRow({ compliance_status: "claim_pending" })]).claim_pending_count).toBe(1);
    });

    it("does not count compliant as claim_pending", () => {
      expect(computeInsuranceMetrics([makeRow({ compliance_status: "compliant" })]).claim_pending_count).toBe(0);
    });
  });
});

// ── computeInsuranceAlerts ───────────────────────────────────────────────

describe("computeInsuranceAlerts", () => {
  describe("no alerts", () => {
    it("returns empty array when no rows", () => {
      const alerts = computeInsuranceAlerts([]);
      expect(alerts).toHaveLength(0);
    });

    it("returns empty array when all rows are clean", () => {
      const rows = [
        makeRow({ insurance_type: "building", compliance_status: "compliant", regulatory_requirement_met: true, cover_adequate: true, certificate_displayed: true, renewal_date: daysFromNow(90) }),
      ];
      const alerts = computeInsuranceAlerts(rows);
      expect(alerts).toEqual([]);
    });
  });

  describe("employers_liability_expired alert", () => {
    it("fires when employers_liability is expired", () => {
      const rows = [makeRow({ insurance_type: "employers_liability", compliance_status: "expired" })];
      const alerts = computeInsuranceAlerts(rows);
      const alert = alerts.find((a) => a.type === "employers_liability_expired");
      expect(alert).toBeDefined();
    });

    it("has severity critical", () => {
      const rows = [makeRow({ insurance_type: "employers_liability", compliance_status: "expired" })];
      const alerts = computeInsuranceAlerts(rows);
      const alert = alerts.find((a) => a.type === "employers_liability_expired")!;
      expect(alert.severity).toBe("critical");
    });

    it("includes record_id", () => {
      const rows = [makeRow({ id: "ins-1", insurance_type: "employers_liability", compliance_status: "expired" })];
      const alerts = computeInsuranceAlerts(rows);
      const alert = alerts.find((a) => a.type === "employers_liability_expired")!;
      expect(alert.record_id).toBe("ins-1");
    });

    it("includes policy name in message", () => {
      const rows = [makeRow({ insurance_type: "employers_liability", compliance_status: "expired", policy_name: "EL Cover 2024" })];
      const alerts = computeInsuranceAlerts(rows);
      const alert = alerts.find((a) => a.type === "employers_liability_expired")!;
      expect(alert.message).toContain("EL Cover 2024");
    });

    it("does not fire for non-employers_liability expired", () => {
      const rows = [makeRow({ insurance_type: "building", compliance_status: "expired" })];
      const alerts = computeInsuranceAlerts(rows);
      const alert = alerts.find((a) => a.type === "employers_liability_expired");
      expect(alert).toBeUndefined();
    });

    it("does not fire for employers_liability that is compliant", () => {
      const rows = [makeRow({ insurance_type: "employers_liability", compliance_status: "compliant" })];
      const alerts = computeInsuranceAlerts(rows);
      const alert = alerts.find((a) => a.type === "employers_liability_expired");
      expect(alert).toBeUndefined();
    });

    it("fires per record for multiple expired employers_liability", () => {
      const rows = [
        makeRow({ insurance_type: "employers_liability", compliance_status: "expired" }),
        makeRow({ insurance_type: "employers_liability", compliance_status: "expired" }),
      ];
      const alerts = computeInsuranceAlerts(rows);
      const matches = alerts.filter((a) => a.type === "employers_liability_expired");
      expect(matches).toHaveLength(2);
    });
  });

  describe("employers_liability_gap alert", () => {
    it("fires when employers_liability has gap_identified", () => {
      const rows = [makeRow({ insurance_type: "employers_liability", compliance_status: "gap_identified" })];
      const alerts = computeInsuranceAlerts(rows);
      const alert = alerts.find((a) => a.type === "employers_liability_gap");
      expect(alert).toBeDefined();
    });

    it("has severity critical", () => {
      const rows = [makeRow({ insurance_type: "employers_liability", compliance_status: "gap_identified" })];
      const alerts = computeInsuranceAlerts(rows);
      const alert = alerts.find((a) => a.type === "employers_liability_gap")!;
      expect(alert.severity).toBe("critical");
    });

    it("includes record_id", () => {
      const rows = [makeRow({ id: "ins-2", insurance_type: "employers_liability", compliance_status: "gap_identified" })];
      const alerts = computeInsuranceAlerts(rows);
      const alert = alerts.find((a) => a.type === "employers_liability_gap")!;
      expect(alert.record_id).toBe("ins-2");
    });

    it("does not fire for non-employers_liability gap_identified", () => {
      const rows = [makeRow({ insurance_type: "contents", compliance_status: "gap_identified" })];
      const alerts = computeInsuranceAlerts(rows);
      const alert = alerts.find((a) => a.type === "employers_liability_gap");
      expect(alert).toBeUndefined();
    });

    it("does not fire for employers_liability that is compliant", () => {
      const rows = [makeRow({ insurance_type: "employers_liability", compliance_status: "compliant" })];
      const alerts = computeInsuranceAlerts(rows);
      const alert = alerts.find((a) => a.type === "employers_liability_gap");
      expect(alert).toBeUndefined();
    });
  });

  describe("regulatory_requirement_not_met alert", () => {
    it("fires when regulatory_requirement_met is false", () => {
      const rows = [makeRow({ regulatory_requirement_met: false })];
      const alerts = computeInsuranceAlerts(rows);
      const alert = alerts.find((a) => a.type === "regulatory_requirement_not_met");
      expect(alert).toBeDefined();
    });

    it("has severity critical", () => {
      const rows = [makeRow({ regulatory_requirement_met: false })];
      const alerts = computeInsuranceAlerts(rows);
      const alert = alerts.find((a) => a.type === "regulatory_requirement_not_met")!;
      expect(alert.severity).toBe("critical");
    });

    it("includes record_id", () => {
      const rows = [makeRow({ id: "ins-3", regulatory_requirement_met: false })];
      const alerts = computeInsuranceAlerts(rows);
      const alert = alerts.find((a) => a.type === "regulatory_requirement_not_met")!;
      expect(alert.record_id).toBe("ins-3");
    });

    it("includes policy name in message", () => {
      const rows = [makeRow({ regulatory_requirement_met: false, policy_name: "Motor Fleet" })];
      const alerts = computeInsuranceAlerts(rows);
      const alert = alerts.find((a) => a.type === "regulatory_requirement_not_met")!;
      expect(alert.message).toContain("Motor Fleet");
    });

    it("does not fire when regulatory_requirement_met is true", () => {
      const rows = [makeRow({ regulatory_requirement_met: true })];
      const alerts = computeInsuranceAlerts(rows);
      const alert = alerts.find((a) => a.type === "regulatory_requirement_not_met");
      expect(alert).toBeUndefined();
    });

    it("fires per record for multiple non-compliant rows", () => {
      const rows = [
        makeRow({ regulatory_requirement_met: false }),
        makeRow({ regulatory_requirement_met: false }),
      ];
      const alerts = computeInsuranceAlerts(rows);
      const matches = alerts.filter((a) => a.type === "regulatory_requirement_not_met");
      expect(matches).toHaveLength(2);
    });
  });

  describe("renewal_due_soon alert", () => {
    it("fires when renewal is within 30 days", () => {
      const rows = [makeRow({ renewal_date: daysFromNow(15) })];
      const alerts = computeInsuranceAlerts(rows);
      const alert = alerts.find((a) => a.type === "renewal_due_soon");
      expect(alert).toBeDefined();
    });

    it("has severity high", () => {
      const rows = [makeRow({ renewal_date: daysFromNow(15) })];
      const alerts = computeInsuranceAlerts(rows);
      const alert = alerts.find((a) => a.type === "renewal_due_soon")!;
      expect(alert.severity).toBe("high");
    });

    it("includes record_id", () => {
      const rows = [makeRow({ id: "ins-4", renewal_date: daysFromNow(10) })];
      const alerts = computeInsuranceAlerts(rows);
      const alert = alerts.find((a) => a.type === "renewal_due_soon")!;
      expect(alert.record_id).toBe("ins-4");
    });

    it("fires when renewal is today (0 days from now)", () => {
      const rows = [makeRow({ renewal_date: daysFromNow(0) })];
      const alerts = computeInsuranceAlerts(rows);
      const alert = alerts.find((a) => a.type === "renewal_due_soon");
      expect(alert).toBeDefined();
    });

    it("fires when renewal is exactly 30 days from now", () => {
      const rows = [makeRow({ renewal_date: daysFromNow(30) })];
      const alerts = computeInsuranceAlerts(rows);
      const alert = alerts.find((a) => a.type === "renewal_due_soon");
      expect(alert).toBeDefined();
    });

    it("does not fire when renewal is 31+ days away", () => {
      const rows = [makeRow({ renewal_date: daysFromNow(31) })];
      const alerts = computeInsuranceAlerts(rows);
      const alert = alerts.find((a) => a.type === "renewal_due_soon");
      expect(alert).toBeUndefined();
    });

    it("does not fire when renewal is in the past", () => {
      const rows = [makeRow({ renewal_date: daysFromNow(-1) })];
      const alerts = computeInsuranceAlerts(rows);
      const alert = alerts.find((a) => a.type === "renewal_due_soon");
      expect(alert).toBeUndefined();
    });

    it("includes policy name in message", () => {
      const rows = [makeRow({ renewal_date: daysFromNow(5), policy_name: "Cyber Cover" })];
      const alerts = computeInsuranceAlerts(rows);
      const alert = alerts.find((a) => a.type === "renewal_due_soon")!;
      expect(alert.message).toContain("Cyber Cover");
    });
  });

  describe("public_liability_expired alert", () => {
    it("fires when public_liability is expired", () => {
      const rows = [makeRow({ insurance_type: "public_liability", compliance_status: "expired" })];
      const alerts = computeInsuranceAlerts(rows);
      const alert = alerts.find((a) => a.type === "public_liability_expired");
      expect(alert).toBeDefined();
    });

    it("has severity high", () => {
      const rows = [makeRow({ insurance_type: "public_liability", compliance_status: "expired" })];
      const alerts = computeInsuranceAlerts(rows);
      const alert = alerts.find((a) => a.type === "public_liability_expired")!;
      expect(alert.severity).toBe("high");
    });

    it("includes record_id", () => {
      const rows = [makeRow({ id: "ins-5", insurance_type: "public_liability", compliance_status: "expired" })];
      const alerts = computeInsuranceAlerts(rows);
      const alert = alerts.find((a) => a.type === "public_liability_expired")!;
      expect(alert.record_id).toBe("ins-5");
    });

    it("does not fire for non-public_liability expired", () => {
      const rows = [makeRow({ insurance_type: "contents", compliance_status: "expired" })];
      const alerts = computeInsuranceAlerts(rows);
      const alert = alerts.find((a) => a.type === "public_liability_expired");
      expect(alert).toBeUndefined();
    });

    it("does not fire for public_liability that is compliant", () => {
      const rows = [makeRow({ insurance_type: "public_liability", compliance_status: "compliant" })];
      const alerts = computeInsuranceAlerts(rows);
      const alert = alerts.find((a) => a.type === "public_liability_expired");
      expect(alert).toBeUndefined();
    });
  });

  describe("cover_not_adequate alert", () => {
    it("fires when cover_adequate is false", () => {
      const rows = [makeRow({ cover_adequate: false })];
      const alerts = computeInsuranceAlerts(rows);
      const alert = alerts.find((a) => a.type === "cover_not_adequate");
      expect(alert).toBeDefined();
    });

    it("has severity medium", () => {
      const rows = [makeRow({ cover_adequate: false })];
      const alerts = computeInsuranceAlerts(rows);
      const alert = alerts.find((a) => a.type === "cover_not_adequate")!;
      expect(alert.severity).toBe("medium");
    });

    it("includes record_id", () => {
      const rows = [makeRow({ id: "ins-6", cover_adequate: false })];
      const alerts = computeInsuranceAlerts(rows);
      const alert = alerts.find((a) => a.type === "cover_not_adequate")!;
      expect(alert.record_id).toBe("ins-6");
    });

    it("does not fire when cover_adequate is true", () => {
      const rows = [makeRow({ cover_adequate: true })];
      const alerts = computeInsuranceAlerts(rows);
      const alert = alerts.find((a) => a.type === "cover_not_adequate");
      expect(alert).toBeUndefined();
    });

    it("fires per record for multiple inadequate covers", () => {
      const rows = [
        makeRow({ cover_adequate: false }),
        makeRow({ cover_adequate: false }),
      ];
      const alerts = computeInsuranceAlerts(rows);
      const matches = alerts.filter((a) => a.type === "cover_not_adequate");
      expect(matches).toHaveLength(2);
    });
  });

  describe("certificate_not_displayed alert", () => {
    it("fires when employers_liability certificate is not displayed", () => {
      const rows = [makeRow({ insurance_type: "employers_liability", certificate_displayed: false })];
      const alerts = computeInsuranceAlerts(rows);
      const alert = alerts.find((a) => a.type === "certificate_not_displayed");
      expect(alert).toBeDefined();
    });

    it("has severity medium", () => {
      const rows = [makeRow({ insurance_type: "employers_liability", certificate_displayed: false })];
      const alerts = computeInsuranceAlerts(rows);
      const alert = alerts.find((a) => a.type === "certificate_not_displayed")!;
      expect(alert.severity).toBe("medium");
    });

    it("includes record_id", () => {
      const rows = [makeRow({ id: "ins-7", insurance_type: "employers_liability", certificate_displayed: false })];
      const alerts = computeInsuranceAlerts(rows);
      const alert = alerts.find((a) => a.type === "certificate_not_displayed")!;
      expect(alert.record_id).toBe("ins-7");
    });

    it("does not fire for non-employers_liability with certificate not displayed", () => {
      const rows = [makeRow({ insurance_type: "public_liability", certificate_displayed: false })];
      const alerts = computeInsuranceAlerts(rows);
      const alert = alerts.find((a) => a.type === "certificate_not_displayed");
      expect(alert).toBeUndefined();
    });

    it("does not fire when certificate is displayed", () => {
      const rows = [makeRow({ insurance_type: "employers_liability", certificate_displayed: true })];
      const alerts = computeInsuranceAlerts(rows);
      const alert = alerts.find((a) => a.type === "certificate_not_displayed");
      expect(alert).toBeUndefined();
    });
  });

  describe("combined alerts", () => {
    it("can fire all alert types simultaneously", () => {
      const rows = [
        makeRow({ insurance_type: "employers_liability", compliance_status: "expired", regulatory_requirement_met: false, cover_adequate: false, certificate_displayed: false, renewal_date: daysFromNow(5) }),
        makeRow({ insurance_type: "public_liability", compliance_status: "expired", regulatory_requirement_met: false, cover_adequate: false, renewal_date: daysFromNow(10) }),
      ];
      const alerts = computeInsuranceAlerts(rows);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("employers_liability_expired");
      expect(types).toContain("regulatory_requirement_not_met");
      expect(types).toContain("renewal_due_soon");
      expect(types).toContain("public_liability_expired");
      expect(types).toContain("cover_not_adequate");
      expect(types).toContain("certificate_not_displayed");
    });

    it("employers_liability expired also triggers regulatory_requirement_not_met when both conditions met", () => {
      const rows = [makeRow({ insurance_type: "employers_liability", compliance_status: "expired", regulatory_requirement_met: false })];
      const alerts = computeInsuranceAlerts(rows);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("employers_liability_expired");
      expect(types).toContain("regulatory_requirement_not_met");
    });
  });

  describe("alert structure", () => {
    it("every alert has type, severity, and message fields", () => {
      const rows = [
        makeRow({ insurance_type: "employers_liability", compliance_status: "expired", regulatory_requirement_met: false, cover_adequate: false, certificate_displayed: false }),
      ];
      const alerts = computeInsuranceAlerts(rows);
      for (const alert of alerts) {
        expect(alert).toHaveProperty("type");
        expect(alert).toHaveProperty("severity");
        expect(alert).toHaveProperty("message");
      }
    });

    it("severity is always one of critical, high, or medium", () => {
      const rows = [
        makeRow({ insurance_type: "employers_liability", compliance_status: "expired", regulatory_requirement_met: false, cover_adequate: false, certificate_displayed: false, renewal_date: daysFromNow(5) }),
      ];
      const alerts = computeInsuranceAlerts(rows);
      for (const alert of alerts) {
        expect(["critical", "high", "medium"]).toContain(alert.severity);
      }
    });

    it("message is always a non-empty string", () => {
      const rows = [makeRow({ insurance_type: "employers_liability", compliance_status: "expired" })];
      const alerts = computeInsuranceAlerts(rows);
      for (const alert of alerts) {
        expect(typeof alert.message).toBe("string");
        expect(alert.message.length).toBeGreaterThan(0);
      }
    });

    it("record_id is present on per-record alerts", () => {
      const rows = [makeRow({ id: "rec-99", insurance_type: "employers_liability", compliance_status: "expired" })];
      const alerts = computeInsuranceAlerts(rows);
      const alert = alerts.find((a) => a.type === "employers_liability_expired")!;
      expect(alert.record_id).toBe("rec-99");
    });
  });
});

// ── generateInsuranceCaraInsights ────────────────────────────────────────

describe("generateInsuranceCaraInsights", () => {
  it("returns exactly 3 insights", () => {
    const insights = generateInsuranceCaraInsights([]);
    expect(insights).toHaveLength(3);
  });

  it("first insight starts with [zinc]", () => {
    const insights = generateInsuranceCaraInsights([makeRow()]);
    expect(insights[0]).toMatch(/^\[zinc\]/);
  });

  it("first insight includes total_policies count", () => {
    const rows = [makeRow(), makeRow(), makeRow()];
    const insights = generateInsuranceCaraInsights(rows);
    expect(insights[0]).toContain("3");
  });

  it("first insight includes document_held_rate", () => {
    const rows = [makeRow({ policy_document_held: true }), makeRow({ policy_document_held: false })];
    const insights = generateInsuranceCaraInsights(rows);
    expect(insights[0]).toContain("50%");
  });

  it("first insight includes regulatory_met_rate", () => {
    const rows = [makeRow({ regulatory_requirement_met: true }), makeRow({ regulatory_requirement_met: false })];
    const insights = generateInsuranceCaraInsights(rows);
    expect(insights[0]).toContain("50%");
  });

  it("second insight starts with [amber]", () => {
    const insights = generateInsuranceCaraInsights([makeRow()]);
    expect(insights[1]).toMatch(/^\[amber\]/);
  });

  it("second insight mentions critical and high alerts when present", () => {
    const rows = [
      makeRow({ insurance_type: "employers_liability", compliance_status: "expired", regulatory_requirement_met: false }),
    ];
    const insights = generateInsuranceCaraInsights(rows);
    expect(insights[1]).toContain("critical");
    expect(insights[1]).toContain("high");
  });

  it("second insight mentions no alerts when none present", () => {
    const rows = [makeRow({ insurance_type: "building", compliance_status: "compliant", regulatory_requirement_met: true, cover_adequate: true, certificate_displayed: true, renewal_date: daysFromNow(90) })];
    const insights = generateInsuranceCaraInsights(rows);
    expect(insights[1]).toContain("No critical or high-priority");
  });

  it("third insight starts with [reflect]", () => {
    const insights = generateInsuranceCaraInsights([makeRow()]);
    expect(insights[2]).toMatch(/^\[reflect\]/);
  });

  it("third insight mentions expired when expired_count > 0", () => {
    const rows = [makeRow({ compliance_status: "expired" })];
    const insights = generateInsuranceCaraInsights(rows);
    expect(insights[2]).toContain("expired");
  });

  it("third insight asks about cover when no expired but cover_adequate_rate < 100", () => {
    const rows = [
      makeRow({ compliance_status: "compliant", cover_adequate: false }),
      makeRow({ compliance_status: "compliant", cover_adequate: true }),
    ];
    const insights = generateInsuranceCaraInsights(rows);
    expect(insights[2]).toContain("adequate");
  });

  it("third insight celebrates when all policies current and adequate", () => {
    const rows = [
      makeRow({ compliance_status: "compliant", cover_adequate: true }),
      makeRow({ compliance_status: "compliant", cover_adequate: true }),
    ];
    const insights = generateInsuranceCaraInsights(rows);
    expect(insights[2]).toContain("All policies are current");
  });

  it("uses singular policy wording when total_policies is 1", () => {
    const rows = [makeRow({ policy_name: "Single Policy" })];
    const insights = generateInsuranceCaraInsights(rows);
    expect(insights[0]).toContain("1 insurance policy");
  });

  it("uses plural policies wording when total_policies > 1", () => {
    const rows = [
      makeRow({ policy_name: "Policy A" }),
      makeRow({ policy_name: "Policy B" }),
    ];
    const insights = generateInsuranceCaraInsights(rows);
    expect(insights[0]).toContain("2 insurance policies");
  });

  it("uses singular policy name wording when unique_policies is 1", () => {
    const rows = [makeRow({ policy_name: "Same" }), makeRow({ policy_name: "Same" })];
    const insights = generateInsuranceCaraInsights(rows);
    expect(insights[0]).toContain("1 unique policy name");
  });

  it("uses plural policy names wording when unique_policies > 1", () => {
    const rows = [makeRow({ policy_name: "A" }), makeRow({ policy_name: "B" })];
    const insights = generateInsuranceCaraInsights(rows);
    expect(insights[0]).toContain("2 unique policy names");
  });

  it("all insights are non-empty strings", () => {
    const insights = generateInsuranceCaraInsights([makeRow()]);
    for (const insight of insights) {
      expect(typeof insight).toBe("string");
      expect(insight.length).toBeGreaterThan(0);
    }
  });

  it("uses singular policy has wording when 1 expired", () => {
    const rows = [makeRow({ compliance_status: "expired" })];
    const insights = generateInsuranceCaraInsights(rows);
    expect(insights[2]).toContain("policy has");
  });

  it("uses plural policies have wording when multiple expired", () => {
    const rows = [
      makeRow({ compliance_status: "expired" }),
      makeRow({ compliance_status: "expired" }),
    ];
    const insights = generateInsuranceCaraInsights(rows);
    expect(insights[2]).toContain("policies have");
  });

  it("second insight includes premium when no alerts", () => {
    const rows = [makeRow({ insurance_type: "building", compliance_status: "compliant", regulatory_requirement_met: true, cover_adequate: true, certificate_displayed: true, renewal_date: daysFromNow(90), premium_amount: 5000 })];
    const insights = generateInsuranceCaraInsights(rows);
    expect(insights[1]).toContain("5000.00");
  });

  it("second insight includes expired count when alerts present", () => {
    const rows = [makeRow({ insurance_type: "employers_liability", compliance_status: "expired", regulatory_requirement_met: false })];
    const insights = generateInsuranceCaraInsights(rows);
    expect(insights[1]).toContain("1 expired");
  });
});
