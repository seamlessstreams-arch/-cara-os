import { describe, it, expect } from "vitest";
import {
  computeInsuranceMetrics,
  computeInsuranceAlerts,
  generateInsuranceCaraInsights,
  type HomeInsuranceComplianceRow,
} from "./home-insurance-compliance-service";

function makeRow(
  overrides: Partial<HomeInsuranceComplianceRow> = {},
): HomeInsuranceComplianceRow {
  return {
    id: "row-1",
    home_id: "home-1",
    policy_name: "EL Policy",
    policy_number: "POL001",
    insurance_type: "employers_liability",
    compliance_status: "compliant",
    coverage_level: "full",
    review_outcome: "satisfactory",
    renewal_date: "2027-06-01",
    last_review_date: "2026-01-01",
    premium_amount: 1200,
    policy_document_held: true,
    certificate_displayed: true,
    cover_adequate: true,
    excess_acceptable: true,
    broker_reviewed: true,
    claims_history_clear: true,
    regulatory_requirement_met: true,
    management_reviewed: true,
    reviewer_name: "Manager A",
    insurer_name: "Insurer Co",
    notes: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("computeInsuranceMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeInsuranceMetrics([]);
    expect(m.total_policies).toBe(0);
    expect(m.expired_count).toBe(0);
    expect(m.total_premium).toBe(0);
    expect(m.document_held_rate).toBe(0);
    expect(m.unique_policies).toBe(0);
    expect(m.insurance_type_breakdown).toEqual({});
  });

  it("counts populated data correctly", () => {
    const rows = [
      makeRow({ id: "r1", compliance_status: "expired", insurance_type: "employers_liability", premium_amount: 1000, policy_name: "EL" }),
      makeRow({ id: "r2", compliance_status: "renewal_due", insurance_type: "public_liability", premium_amount: 800, policy_name: "PL" }),
      makeRow({ id: "r3", compliance_status: "gap_identified", insurance_type: "building", premium_amount: null, policy_name: "Building" }),
      makeRow({ id: "r4", compliance_status: "claim_pending", insurance_type: "contents", premium_amount: 500, policy_name: "Contents" }),
    ];
    const m = computeInsuranceMetrics(rows);
    expect(m.total_policies).toBe(4);
    expect(m.expired_count).toBe(1);
    expect(m.renewal_due_count).toBe(1);
    expect(m.gap_count).toBe(1);
    expect(m.claim_pending_count).toBe(1);
    expect(m.total_premium).toBe(2300);
    expect(m.unique_policies).toBe(4);
    expect(m.insurance_type_breakdown).toEqual({
      employers_liability: 1,
      public_liability: 1,
      building: 1,
      contents: 1,
    });
  });

  it("computes boolean rates correctly", () => {
    const rows = [
      makeRow({ policy_document_held: true, certificate_displayed: false }),
      makeRow({ id: "r2", policy_document_held: false, certificate_displayed: false }),
    ];
    const m = computeInsuranceMetrics(rows);
    expect(m.document_held_rate).toBe(50);
    expect(m.certificate_displayed_rate).toBe(0);
  });
});

describe("computeInsuranceAlerts", () => {
  it("returns empty array for empty data", () => {
    expect(computeInsuranceAlerts([])).toEqual([]);
  });

  it("critical: employers_liability_expired when employers_liability is expired", () => {
    const rows = [makeRow({ insurance_type: "employers_liability", compliance_status: "expired" })];
    const alerts = computeInsuranceAlerts(rows);
    expect(alerts.some((a) => a.type === "employers_liability_expired" && a.severity === "critical")).toBe(true);
  });

  it("critical: employers_liability_gap when employers_liability has gap_identified", () => {
    const rows = [makeRow({ insurance_type: "employers_liability", compliance_status: "gap_identified" })];
    const alerts = computeInsuranceAlerts(rows);
    expect(alerts.some((a) => a.type === "employers_liability_gap" && a.severity === "critical")).toBe(true);
  });

  it("critical: regulatory_requirement_not_met when regulatory_requirement_met is false", () => {
    const rows = [makeRow({ regulatory_requirement_met: false })];
    const alerts = computeInsuranceAlerts(rows);
    expect(alerts.some((a) => a.type === "regulatory_requirement_not_met" && a.severity === "critical")).toBe(true);
  });

  it("high: renewal_due_soon when renewal within 30 days", () => {
    const soon = new Date();
    soon.setDate(soon.getDate() + 15);
    const rows = [makeRow({ renewal_date: soon.toISOString().split("T")[0] })];
    const alerts = computeInsuranceAlerts(rows);
    expect(alerts.some((a) => a.type === "renewal_due_soon" && a.severity === "high")).toBe(true);
  });

  it("does NOT fire renewal_due_soon when renewal is more than 30 days away", () => {
    const rows = [makeRow({ renewal_date: "2099-01-01" })];
    const alerts = computeInsuranceAlerts(rows);
    expect(alerts.some((a) => a.type === "renewal_due_soon")).toBe(false);
  });

  it("high: public_liability_expired when public_liability is expired", () => {
    const rows = [makeRow({ insurance_type: "public_liability", compliance_status: "expired" })];
    const alerts = computeInsuranceAlerts(rows);
    expect(alerts.some((a) => a.type === "public_liability_expired" && a.severity === "high")).toBe(true);
  });

  it("medium: cover_not_adequate when cover_adequate is false", () => {
    const rows = [makeRow({ cover_adequate: false })];
    const alerts = computeInsuranceAlerts(rows);
    expect(alerts.some((a) => a.type === "cover_not_adequate" && a.severity === "medium")).toBe(true);
  });

  it("medium: certificate_not_displayed for employers_liability", () => {
    const rows = [makeRow({ insurance_type: "employers_liability", certificate_displayed: false })];
    const alerts = computeInsuranceAlerts(rows);
    expect(alerts.some((a) => a.type === "certificate_not_displayed" && a.severity === "medium")).toBe(true);
  });
});

describe("generateInsuranceCaraInsights", () => {
  it("returns 3 insights for populated data", () => {
    const insights = generateInsuranceCaraInsights([makeRow()]);
    expect(insights).toHaveLength(3);
  });

  it("returns 3 insights for empty data", () => {
    expect(generateInsuranceCaraInsights([])).toHaveLength(3);
  });
});
