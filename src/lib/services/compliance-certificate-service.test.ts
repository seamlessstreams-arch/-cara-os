import { describe, it, expect } from "vitest";
import {
  computeComplianceCertificateMetrics,
  computeComplianceCertificateAlerts,
  generateComplianceCertificateCaraInsights,
  type ComplianceCertificateRow,
} from "./compliance-certificate-service";

function makeRow(overrides: Partial<ComplianceCertificateRow> = {}): ComplianceCertificateRow {
  return {
    id: "cert-1",
    home_id: "home-1",
    certificate_type: "gas_safety",
    certificate_reference: "GAS-001",
    issuing_body: "gas_safe_register",
    compliance_status: "valid",
    renewal_urgency: "routine",
    issue_date: "2026-01-01",
    expiry_date: "2027-01-01",
    last_inspection_date: "2026-01-01",
    next_inspection_due: "2027-01-01",
    inspector_name: "Inspector A",
    remedial_actions_required: false,
    remedial_actions_completed: false,
    digital_copy_stored: true,
    ofsted_notified: true,
    notes: null,
    created_at: "2026-01-01T08:00:00Z",
    updated_at: "2026-01-01T08:00:00Z",
    ...overrides,
  };
}

describe("computeComplianceCertificateMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeComplianceCertificateMetrics([]);
    expect(m.total_certificates).toBe(0);
    expect(m.expired_count).toBe(0);
    expect(m.valid_rate).toBe(0);
    expect(m.digital_copy_rate).toBe(0);
    expect(m.remedial_completed_rate).toBe(0);
  });

  it("counts expired, expiring soon, and overdue renewal", () => {
    const rows = [
      makeRow({ id: "c1", compliance_status: "valid" }),
      makeRow({ id: "c2", compliance_status: "expired" }),
      makeRow({ id: "c3", compliance_status: "expiring_soon" }),
      makeRow({ id: "c4", compliance_status: "valid", renewal_urgency: "overdue" }),
      makeRow({ id: "c5", compliance_status: "valid", renewal_urgency: "critical" }),
    ];
    const m = computeComplianceCertificateMetrics(rows);
    expect(m.total_certificates).toBe(5);
    expect(m.expired_count).toBe(1);
    expect(m.expiring_soon_count).toBe(1);
    expect(m.overdue_renewal_count).toBe(2); // overdue + critical
    expect(m.valid_rate).toBe(60); // 3/5
  });

  it("computes remedial completion rate correctly", () => {
    const rows = [
      makeRow({ id: "c1", remedial_actions_required: true, remedial_actions_completed: true }),
      makeRow({ id: "c2", remedial_actions_required: true, remedial_actions_completed: false }),
      makeRow({ id: "c3", remedial_actions_required: false, remedial_actions_completed: false }),
    ];
    const m = computeComplianceCertificateMetrics(rows);
    expect(m.remedial_required_count).toBe(2);
    // 1 of 2 requiring remedial = 50%
    expect(m.remedial_completed_rate).toBe(50);
  });

  it("computes digital copy and ofsted notified rates", () => {
    const rows = [
      makeRow({ id: "c1", digital_copy_stored: true, ofsted_notified: true }),
      makeRow({ id: "c2", digital_copy_stored: false, ofsted_notified: false }),
    ];
    const m = computeComplianceCertificateMetrics(rows);
    expect(m.digital_copy_rate).toBe(50);
    expect(m.ofsted_notified_rate).toBe(50);
  });

  it("counts by certificate type and unique issuing bodies", () => {
    const rows = [
      makeRow({ id: "c1", certificate_type: "gas_safety", issuing_body: "gas_safe_register" }),
      makeRow({ id: "c2", certificate_type: "gas_safety", issuing_body: "gas_safe_register" }),
      makeRow({ id: "c3", certificate_type: "electrical_installation", issuing_body: "niceic" }),
    ];
    const m = computeComplianceCertificateMetrics(rows);
    expect(m.certificate_type_breakdown.gas_safety).toBe(2);
    expect(m.certificate_type_breakdown.electrical_installation).toBe(1);
    expect(m.unique_issuing_bodies).toBe(2);
  });
});

describe("computeComplianceCertificateAlerts", () => {
  it("returns empty alerts for empty data", () => {
    const alerts = computeComplianceCertificateAlerts([]);
    expect(alerts).toEqual([]);
  });

  it("flags expired safety-critical certificates", () => {
    const rows = [
      makeRow({ certificate_type: "gas_safety", compliance_status: "expired" }),
    ];
    const alerts = computeComplianceCertificateAlerts(rows);
    const critAlerts = alerts.filter((a) => a.type === "safety_critical_expired");
    expect(critAlerts).toHaveLength(1);
    expect(critAlerts[0].severity).toBe("critical");
  });

  it("does not flag expired non-safety-critical certificates as critical", () => {
    const rows = [
      makeRow({ certificate_type: "pat_testing", compliance_status: "expired" }),
    ];
    const alerts = computeComplianceCertificateAlerts(rows);
    const critAlerts = alerts.filter((a) => a.type === "safety_critical_expired");
    expect(critAlerts).toHaveLength(0);
  });

  it("flags remedial actions outstanding", () => {
    const rows = [
      makeRow({ remedial_actions_required: true, remedial_actions_completed: false }),
    ];
    const alerts = computeComplianceCertificateAlerts(rows);
    const remAlerts = alerts.filter((a) => a.type === "remedial_actions_outstanding");
    expect(remAlerts).toHaveLength(1);
    expect(remAlerts[0].severity).toBe("high");
  });

  it("flags multiple expiring soon (>=2)", () => {
    const rows = [
      makeRow({ id: "c1", compliance_status: "expiring_soon" }),
      makeRow({ id: "c2", compliance_status: "expiring_soon" }),
    ];
    const alerts = computeComplianceCertificateAlerts(rows);
    const expAlerts = alerts.filter((a) => a.type === "multiple_expiring_soon");
    expect(expAlerts).toHaveLength(1);
    expect(expAlerts[0].severity).toBe("high");
  });

  it("flags digital copies missing (>=2)", () => {
    const rows = [
      makeRow({ id: "c1", digital_copy_stored: false }),
      makeRow({ id: "c2", digital_copy_stored: false }),
    ];
    const alerts = computeComplianceCertificateAlerts(rows);
    const digAlerts = alerts.filter((a) => a.type === "digital_copies_missing");
    expect(digAlerts).toHaveLength(1);
    expect(digAlerts[0].severity).toBe("medium");
  });
});

describe("generateComplianceCertificateCaraInsights", () => {
  it("returns 3 insights", () => {
    const metrics = computeComplianceCertificateMetrics([makeRow()]);
    const alerts = computeComplianceCertificateAlerts([makeRow()]);
    const insights = generateComplianceCertificateCaraInsights(metrics, alerts);
    expect(insights).toHaveLength(3);
    expect(insights[0]).toContain("[cyan]");
    expect(insights[1]).toContain("[amber]");
    expect(insights[2]).toContain("[reflect]");
  });

  it("returns reflect insight about expired certificates when expired > 0", () => {
    const rows = [
      makeRow({ compliance_status: "expired", certificate_type: "gas_safety" }),
    ];
    const metrics = computeComplianceCertificateMetrics(rows);
    const alerts = computeComplianceCertificateAlerts(rows);
    const insights = generateComplianceCertificateCaraInsights(metrics, alerts);
    expect(insights[2]).toContain("expired");
  });
});
