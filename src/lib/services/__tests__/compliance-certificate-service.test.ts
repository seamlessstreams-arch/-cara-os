// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — COMPLIANCE CERTIFICATE TRACKING SERVICE TESTS
// Pure-function tests for compliance certificate metrics, alert identification,
// ARIA insight generation, and edge cases.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";

import {
  CERTIFICATE_TYPES,
  COMPLIANCE_STATUSES,
  ISSUING_BODIES,
  RENEWAL_URGENCIES,
  _testing,
} from "../compliance-certificate-service";

import type {
  ComplianceCertificateRow,
  CertificateType,
  ComplianceStatus,
  IssuingBody,
  RenewalUrgency,
} from "../compliance-certificate-service";

const {
  computeComplianceCertificateMetrics,
  computeComplianceCertificateAlerts,
  generateComplianceCertificateAriaInsights,
} = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

const now = new Date(new Date().toISOString().split("T")[0]);

function makeRow(
  overrides?: Partial<ComplianceCertificateRow>,
): ComplianceCertificateRow {
  return {
    id: "id" in (overrides ?? {}) ? overrides!.id! : crypto.randomUUID(),
    home_id: "home_id" in (overrides ?? {}) ? overrides!.home_id! : "home-1",
    certificate_type: "certificate_type" in (overrides ?? {}) ? overrides!.certificate_type! : "gas_safety",
    certificate_reference: "certificate_reference" in (overrides ?? {}) ? overrides!.certificate_reference! : "CERT-001",
    issuing_body: "issuing_body" in (overrides ?? {}) ? overrides!.issuing_body! : "gas_safe_register",
    compliance_status: "compliance_status" in (overrides ?? {}) ? overrides!.compliance_status! : "valid",
    renewal_urgency: "renewal_urgency" in (overrides ?? {}) ? overrides!.renewal_urgency! : "routine",
    issue_date: "issue_date" in (overrides ?? {}) ? overrides!.issue_date! : "2026-01-15",
    expiry_date: "expiry_date" in (overrides ?? {}) ? overrides!.expiry_date! : "2027-01-15",
    last_inspection_date: "last_inspection_date" in (overrides ?? {}) ? (overrides!.last_inspection_date ?? null) : null,
    next_inspection_due: "next_inspection_due" in (overrides ?? {}) ? (overrides!.next_inspection_due ?? null) : null,
    inspector_name: "inspector_name" in (overrides ?? {}) ? (overrides!.inspector_name ?? null) : null,
    remedial_actions_required: "remedial_actions_required" in (overrides ?? {}) ? overrides!.remedial_actions_required! : false,
    remedial_actions_completed: "remedial_actions_completed" in (overrides ?? {}) ? overrides!.remedial_actions_completed! : false,
    digital_copy_stored: "digital_copy_stored" in (overrides ?? {}) ? overrides!.digital_copy_stored! : true,
    ofsted_notified: "ofsted_notified" in (overrides ?? {}) ? overrides!.ofsted_notified! : true,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: "created_at" in (overrides ?? {}) ? overrides!.created_at! : "2026-01-15T08:00:00Z",
    updated_at: "updated_at" in (overrides ?? {}) ? overrides!.updated_at! : "2026-01-15T08:00:00Z",
  };
}

// ── computeComplianceCertificateMetrics ──────────────────────────────────

describe("computeComplianceCertificateMetrics", () => {
  describe("empty array", () => {
    it("returns zero total_certificates", () => {
      const m = computeComplianceCertificateMetrics([]);
      expect(m.total_certificates).toBe(0);
    });

    it("returns zero expired_count", () => {
      const m = computeComplianceCertificateMetrics([]);
      expect(m.expired_count).toBe(0);
    });

    it("returns zero expiring_soon_count", () => {
      const m = computeComplianceCertificateMetrics([]);
      expect(m.expiring_soon_count).toBe(0);
    });

    it("returns zero remedial_required_count", () => {
      const m = computeComplianceCertificateMetrics([]);
      expect(m.remedial_required_count).toBe(0);
    });

    it("returns zero overdue_renewal_count", () => {
      const m = computeComplianceCertificateMetrics([]);
      expect(m.overdue_renewal_count).toBe(0);
    });

    it("returns zero valid_rate", () => {
      const m = computeComplianceCertificateMetrics([]);
      expect(m.valid_rate).toBe(0);
    });

    it("returns zero digital_copy_rate", () => {
      const m = computeComplianceCertificateMetrics([]);
      expect(m.digital_copy_rate).toBe(0);
    });

    it("returns zero ofsted_notified_rate", () => {
      const m = computeComplianceCertificateMetrics([]);
      expect(m.ofsted_notified_rate).toBe(0);
    });

    it("returns zero remedial_completed_rate", () => {
      const m = computeComplianceCertificateMetrics([]);
      expect(m.remedial_completed_rate).toBe(0);
    });

    it("returns empty certificate_type_breakdown", () => {
      const m = computeComplianceCertificateMetrics([]);
      expect(m.certificate_type_breakdown).toEqual({});
    });

    it("returns empty status_breakdown", () => {
      const m = computeComplianceCertificateMetrics([]);
      expect(m.status_breakdown).toEqual({});
    });

    it("returns zero unique_issuing_bodies", () => {
      const m = computeComplianceCertificateMetrics([]);
      expect(m.unique_issuing_bodies).toBe(0);
    });
  });

  describe("single valid row", () => {
    const row = makeRow({
      compliance_status: "valid",
      digital_copy_stored: true,
      ofsted_notified: true,
      remedial_actions_required: false,
      remedial_actions_completed: false,
      renewal_urgency: "routine",
      certificate_type: "gas_safety",
      issuing_body: "gas_safe_register",
    });

    it("returns total_certificates = 1", () => {
      const m = computeComplianceCertificateMetrics([row]);
      expect(m.total_certificates).toBe(1);
    });

    it("returns valid_rate = 100", () => {
      const m = computeComplianceCertificateMetrics([row]);
      expect(m.valid_rate).toBe(100);
    });

    it("returns digital_copy_rate = 100", () => {
      const m = computeComplianceCertificateMetrics([row]);
      expect(m.digital_copy_rate).toBe(100);
    });

    it("returns ofsted_notified_rate = 100", () => {
      const m = computeComplianceCertificateMetrics([row]);
      expect(m.ofsted_notified_rate).toBe(100);
    });

    it("returns expired_count = 0", () => {
      const m = computeComplianceCertificateMetrics([row]);
      expect(m.expired_count).toBe(0);
    });

    it("returns certificate_type_breakdown with single entry", () => {
      const m = computeComplianceCertificateMetrics([row]);
      expect(m.certificate_type_breakdown).toEqual({ gas_safety: 1 });
    });

    it("returns status_breakdown with single entry", () => {
      const m = computeComplianceCertificateMetrics([row]);
      expect(m.status_breakdown).toEqual({ valid: 1 });
    });

    it("returns unique_issuing_bodies = 1", () => {
      const m = computeComplianceCertificateMetrics([row]);
      expect(m.unique_issuing_bodies).toBe(1);
    });
  });

  describe("multiple rows", () => {
    const rows = [
      makeRow({ compliance_status: "valid", certificate_type: "gas_safety", issuing_body: "gas_safe_register", digital_copy_stored: true, ofsted_notified: true, remedial_actions_required: false, renewal_urgency: "routine" }),
      makeRow({ compliance_status: "expired", certificate_type: "electrical_installation", issuing_body: "niceic", digital_copy_stored: false, ofsted_notified: false, remedial_actions_required: true, remedial_actions_completed: false, renewal_urgency: "overdue" }),
      makeRow({ compliance_status: "expiring_soon", certificate_type: "fire_alarm_service", issuing_body: "fire_service_provider", digital_copy_stored: true, ofsted_notified: true, remedial_actions_required: true, remedial_actions_completed: true, renewal_urgency: "upcoming" }),
      makeRow({ compliance_status: "valid", certificate_type: "pat_testing", issuing_body: "pat_testing_company", digital_copy_stored: false, ofsted_notified: false, remedial_actions_required: false, renewal_urgency: "routine" }),
      makeRow({ compliance_status: "renewal_in_progress", certificate_type: "legionella_risk", issuing_body: "water_hygiene_specialist", digital_copy_stored: true, ofsted_notified: true, remedial_actions_required: false, renewal_urgency: "critical" }),
    ];

    it("returns total_certificates = 5", () => {
      const m = computeComplianceCertificateMetrics(rows);
      expect(m.total_certificates).toBe(5);
    });

    it("returns expired_count = 1", () => {
      const m = computeComplianceCertificateMetrics(rows);
      expect(m.expired_count).toBe(1);
    });

    it("returns expiring_soon_count = 1", () => {
      const m = computeComplianceCertificateMetrics(rows);
      expect(m.expiring_soon_count).toBe(1);
    });

    it("returns remedial_required_count = 2", () => {
      const m = computeComplianceCertificateMetrics(rows);
      expect(m.remedial_required_count).toBe(2);
    });

    it("returns overdue_renewal_count = 2 (overdue + critical)", () => {
      const m = computeComplianceCertificateMetrics(rows);
      expect(m.overdue_renewal_count).toBe(2);
    });

    it("calculates valid_rate correctly (2/5 = 40%)", () => {
      const m = computeComplianceCertificateMetrics(rows);
      expect(m.valid_rate).toBe(40);
    });

    it("calculates digital_copy_rate correctly (3/5 = 60%)", () => {
      const m = computeComplianceCertificateMetrics(rows);
      expect(m.digital_copy_rate).toBe(60);
    });

    it("calculates ofsted_notified_rate correctly (3/5 = 60%)", () => {
      const m = computeComplianceCertificateMetrics(rows);
      expect(m.ofsted_notified_rate).toBe(60);
    });

    it("calculates remedial_completed_rate correctly (1/2 = 50%)", () => {
      const m = computeComplianceCertificateMetrics(rows);
      expect(m.remedial_completed_rate).toBe(50);
    });

    it("groups certificate_type_breakdown correctly", () => {
      const m = computeComplianceCertificateMetrics(rows);
      expect(m.certificate_type_breakdown).toEqual({
        gas_safety: 1,
        electrical_installation: 1,
        fire_alarm_service: 1,
        pat_testing: 1,
        legionella_risk: 1,
      });
    });

    it("groups status_breakdown correctly", () => {
      const m = computeComplianceCertificateMetrics(rows);
      expect(m.status_breakdown).toEqual({
        valid: 2,
        expired: 1,
        expiring_soon: 1,
        renewal_in_progress: 1,
      });
    });

    it("returns unique_issuing_bodies = 5", () => {
      const m = computeComplianceCertificateMetrics(rows);
      expect(m.unique_issuing_bodies).toBe(5);
    });
  });

  describe("certificate_type_breakdown", () => {
    it("counts duplicate certificate types", () => {
      const rows = [
        makeRow({ certificate_type: "gas_safety" }),
        makeRow({ certificate_type: "gas_safety" }),
        makeRow({ certificate_type: "pat_testing" }),
      ];
      const m = computeComplianceCertificateMetrics(rows);
      expect(m.certificate_type_breakdown).toEqual({ gas_safety: 2, pat_testing: 1 });
    });

    it("handles all 10 certificate types", () => {
      const rows = CERTIFICATE_TYPES.map((t) => makeRow({ certificate_type: t }));
      const m = computeComplianceCertificateMetrics(rows);
      for (const t of CERTIFICATE_TYPES) {
        expect(m.certificate_type_breakdown[t]).toBe(1);
      }
    });
  });

  describe("status_breakdown", () => {
    it("counts duplicate statuses", () => {
      const rows = [
        makeRow({ compliance_status: "valid" }),
        makeRow({ compliance_status: "valid" }),
        makeRow({ compliance_status: "expired" }),
      ];
      const m = computeComplianceCertificateMetrics(rows);
      expect(m.status_breakdown).toEqual({ valid: 2, expired: 1 });
    });

    it("handles all 5 compliance statuses", () => {
      const rows = COMPLIANCE_STATUSES.map((s) => makeRow({ compliance_status: s }));
      const m = computeComplianceCertificateMetrics(rows);
      for (const s of COMPLIANCE_STATUSES) {
        expect(m.status_breakdown[s]).toBe(1);
      }
    });
  });

  describe("unique_issuing_bodies", () => {
    it("counts distinct issuing bodies", () => {
      const rows = [
        makeRow({ issuing_body: "gas_safe_register" }),
        makeRow({ issuing_body: "gas_safe_register" }),
        makeRow({ issuing_body: "niceic" }),
      ];
      const m = computeComplianceCertificateMetrics(rows);
      expect(m.unique_issuing_bodies).toBe(2);
    });

    it("returns 1 when all rows have the same issuing body", () => {
      const rows = [
        makeRow({ issuing_body: "insurance_provider" }),
        makeRow({ issuing_body: "insurance_provider" }),
        makeRow({ issuing_body: "insurance_provider" }),
      ];
      const m = computeComplianceCertificateMetrics(rows);
      expect(m.unique_issuing_bodies).toBe(1);
    });

    it("counts all 10 issuing bodies", () => {
      const rows = ISSUING_BODIES.map((b) => makeRow({ issuing_body: b }));
      const m = computeComplianceCertificateMetrics(rows);
      expect(m.unique_issuing_bodies).toBe(10);
    });
  });

  describe("remedial_completed_rate", () => {
    it("only counts rows where remedial_actions_required is true", () => {
      const rows = [
        makeRow({ remedial_actions_required: true, remedial_actions_completed: true }),
        makeRow({ remedial_actions_required: false, remedial_actions_completed: false }),
        makeRow({ remedial_actions_required: false, remedial_actions_completed: true }),
      ];
      // Only 1 row is remedial_required, and it is completed => 100%
      const m = computeComplianceCertificateMetrics(rows);
      expect(m.remedial_completed_rate).toBe(100);
    });

    it("returns 0 when no remedial actions are required", () => {
      const rows = [
        makeRow({ remedial_actions_required: false }),
        makeRow({ remedial_actions_required: false }),
      ];
      const m = computeComplianceCertificateMetrics(rows);
      expect(m.remedial_completed_rate).toBe(0);
    });

    it("calculates correctly with mixed completion (1/3 = 33.3%)", () => {
      const rows = [
        makeRow({ remedial_actions_required: true, remedial_actions_completed: true }),
        makeRow({ remedial_actions_required: true, remedial_actions_completed: false }),
        makeRow({ remedial_actions_required: true, remedial_actions_completed: false }),
      ];
      const m = computeComplianceCertificateMetrics(rows);
      expect(m.remedial_completed_rate).toBe(33.3);
    });

    it("calculates correctly (2/3 = 66.7%)", () => {
      const rows = [
        makeRow({ remedial_actions_required: true, remedial_actions_completed: true }),
        makeRow({ remedial_actions_required: true, remedial_actions_completed: true }),
        makeRow({ remedial_actions_required: true, remedial_actions_completed: false }),
      ];
      const m = computeComplianceCertificateMetrics(rows);
      expect(m.remedial_completed_rate).toBe(66.7);
    });
  });

  describe("percentage calculations with known values", () => {
    it("calculates valid_rate (1/3 = 33.3%)", () => {
      const rows = [
        makeRow({ compliance_status: "valid" }),
        makeRow({ compliance_status: "expired" }),
        makeRow({ compliance_status: "expiring_soon" }),
      ];
      const m = computeComplianceCertificateMetrics(rows);
      expect(m.valid_rate).toBe(33.3);
    });

    it("calculates digital_copy_rate (2/3 = 66.7%)", () => {
      const rows = [
        makeRow({ digital_copy_stored: true }),
        makeRow({ digital_copy_stored: true }),
        makeRow({ digital_copy_stored: false }),
      ];
      const m = computeComplianceCertificateMetrics(rows);
      expect(m.digital_copy_rate).toBe(66.7);
    });

    it("calculates ofsted_notified_rate (1/3 = 33.3%)", () => {
      const rows = [
        makeRow({ ofsted_notified: true }),
        makeRow({ ofsted_notified: false }),
        makeRow({ ofsted_notified: false }),
      ];
      const m = computeComplianceCertificateMetrics(rows);
      expect(m.ofsted_notified_rate).toBe(33.3);
    });

    it("returns 100 for all rates when single row has all flags true and valid", () => {
      const rows = [
        makeRow({ compliance_status: "valid", digital_copy_stored: true, ofsted_notified: true }),
      ];
      const m = computeComplianceCertificateMetrics(rows);
      expect(m.valid_rate).toBe(100);
      expect(m.digital_copy_rate).toBe(100);
      expect(m.ofsted_notified_rate).toBe(100);
    });

    it("returns 0 for valid_rate when no rows are valid", () => {
      const rows = [
        makeRow({ compliance_status: "expired" }),
        makeRow({ compliance_status: "expiring_soon" }),
      ];
      const m = computeComplianceCertificateMetrics(rows);
      expect(m.valid_rate).toBe(0);
    });
  });

  describe("overdue_renewal_count", () => {
    it("counts overdue urgency", () => {
      const rows = [makeRow({ renewal_urgency: "overdue" })];
      const m = computeComplianceCertificateMetrics(rows);
      expect(m.overdue_renewal_count).toBe(1);
    });

    it("counts critical urgency", () => {
      const rows = [makeRow({ renewal_urgency: "critical" })];
      const m = computeComplianceCertificateMetrics(rows);
      expect(m.overdue_renewal_count).toBe(1);
    });

    it("does not count routine urgency", () => {
      const rows = [makeRow({ renewal_urgency: "routine" })];
      const m = computeComplianceCertificateMetrics(rows);
      expect(m.overdue_renewal_count).toBe(0);
    });

    it("does not count upcoming urgency", () => {
      const rows = [makeRow({ renewal_urgency: "upcoming" })];
      const m = computeComplianceCertificateMetrics(rows);
      expect(m.overdue_renewal_count).toBe(0);
    });

    it("does not count urgent urgency", () => {
      const rows = [makeRow({ renewal_urgency: "urgent" })];
      const m = computeComplianceCertificateMetrics(rows);
      expect(m.overdue_renewal_count).toBe(0);
    });
  });
});

// ── computeComplianceCertificateAlerts ───────────────────────────────────

describe("computeComplianceCertificateAlerts", () => {
  describe("no alerts", () => {
    it("returns empty array when no rows", () => {
      const alerts = computeComplianceCertificateAlerts([]);
      expect(alerts).toHaveLength(0);
    });

    it("returns empty array when all rows are valid and compliant", () => {
      const rows = [
        makeRow({ compliance_status: "valid", remedial_actions_required: false, digital_copy_stored: true }),
      ];
      const alerts = computeComplianceCertificateAlerts(rows);
      expect(alerts).toEqual([]);
    });
  });

  describe("safety_critical_expired alert", () => {
    it("fires for expired gas_safety certificate", () => {
      const rows = [makeRow({ compliance_status: "expired", certificate_type: "gas_safety" })];
      const alerts = computeComplianceCertificateAlerts(rows);
      const alert = alerts.find((a) => a.type === "safety_critical_expired");
      expect(alert).toBeDefined();
    });

    it("fires for expired electrical_installation certificate", () => {
      const rows = [makeRow({ compliance_status: "expired", certificate_type: "electrical_installation" })];
      const alerts = computeComplianceCertificateAlerts(rows);
      const alert = alerts.find((a) => a.type === "safety_critical_expired");
      expect(alert).toBeDefined();
    });

    it("fires for expired fire_alarm_service certificate", () => {
      const rows = [makeRow({ compliance_status: "expired", certificate_type: "fire_alarm_service" })];
      const alerts = computeComplianceCertificateAlerts(rows);
      const alert = alerts.find((a) => a.type === "safety_critical_expired");
      expect(alert).toBeDefined();
    });

    it("has severity critical", () => {
      const rows = [makeRow({ compliance_status: "expired", certificate_type: "gas_safety" })];
      const alerts = computeComplianceCertificateAlerts(rows);
      const alert = alerts.find((a) => a.type === "safety_critical_expired")!;
      expect(alert.severity).toBe("critical");
    });

    it("includes record_id", () => {
      const rows = [makeRow({ id: "cert-gas-1", compliance_status: "expired", certificate_type: "gas_safety" })];
      const alerts = computeComplianceCertificateAlerts(rows);
      const alert = alerts.find((a) => a.type === "safety_critical_expired")!;
      expect(alert.record_id).toBe("cert-gas-1");
    });

    it("replaces underscores in certificate_type in message", () => {
      const rows = [makeRow({ compliance_status: "expired", certificate_type: "gas_safety" })];
      const alerts = computeComplianceCertificateAlerts(rows);
      const alert = alerts.find((a) => a.type === "safety_critical_expired")!;
      expect(alert.message).toContain("gas safety");
    });

    it("includes certificate_reference in message", () => {
      const rows = [makeRow({ compliance_status: "expired", certificate_type: "gas_safety", certificate_reference: "GAS-2026-001" })];
      const alerts = computeComplianceCertificateAlerts(rows);
      const alert = alerts.find((a) => a.type === "safety_critical_expired")!;
      expect(alert.message).toContain("GAS-2026-001");
    });

    it("does not fire for expired pat_testing certificate", () => {
      const rows = [makeRow({ compliance_status: "expired", certificate_type: "pat_testing" })];
      const alerts = computeComplianceCertificateAlerts(rows);
      const alert = alerts.find((a) => a.type === "safety_critical_expired");
      expect(alert).toBeUndefined();
    });

    it("does not fire for expired legionella_risk certificate", () => {
      const rows = [makeRow({ compliance_status: "expired", certificate_type: "legionella_risk" })];
      const alerts = computeComplianceCertificateAlerts(rows);
      const alert = alerts.find((a) => a.type === "safety_critical_expired");
      expect(alert).toBeUndefined();
    });

    it("does not fire for valid gas_safety certificate", () => {
      const rows = [makeRow({ compliance_status: "valid", certificate_type: "gas_safety" })];
      const alerts = computeComplianceCertificateAlerts(rows);
      const alert = alerts.find((a) => a.type === "safety_critical_expired");
      expect(alert).toBeUndefined();
    });

    it("fires per record for multiple expired safety-critical certificates", () => {
      const rows = [
        makeRow({ compliance_status: "expired", certificate_type: "gas_safety" }),
        makeRow({ compliance_status: "expired", certificate_type: "electrical_installation" }),
        makeRow({ compliance_status: "expired", certificate_type: "fire_alarm_service" }),
      ];
      const alerts = computeComplianceCertificateAlerts(rows);
      const critical = alerts.filter((a) => a.type === "safety_critical_expired");
      expect(critical).toHaveLength(3);
    });
  });

  describe("remedial_actions_outstanding alert", () => {
    it("fires when remedial actions required but not completed", () => {
      const rows = [makeRow({ remedial_actions_required: true, remedial_actions_completed: false })];
      const alerts = computeComplianceCertificateAlerts(rows);
      const alert = alerts.find((a) => a.type === "remedial_actions_outstanding");
      expect(alert).toBeDefined();
    });

    it("has severity high", () => {
      const rows = [makeRow({ remedial_actions_required: true, remedial_actions_completed: false })];
      const alerts = computeComplianceCertificateAlerts(rows);
      const alert = alerts.find((a) => a.type === "remedial_actions_outstanding")!;
      expect(alert.severity).toBe("high");
    });

    it("includes record_id", () => {
      const rows = [makeRow({ id: "cert-rem-1", remedial_actions_required: true, remedial_actions_completed: false })];
      const alerts = computeComplianceCertificateAlerts(rows);
      const alert = alerts.find((a) => a.type === "remedial_actions_outstanding")!;
      expect(alert.record_id).toBe("cert-rem-1");
    });

    it("does not fire when remedial actions required and completed", () => {
      const rows = [makeRow({ remedial_actions_required: true, remedial_actions_completed: true })];
      const alerts = computeComplianceCertificateAlerts(rows);
      const alert = alerts.find((a) => a.type === "remedial_actions_outstanding");
      expect(alert).toBeUndefined();
    });

    it("does not fire when remedial actions not required", () => {
      const rows = [makeRow({ remedial_actions_required: false, remedial_actions_completed: false })];
      const alerts = computeComplianceCertificateAlerts(rows);
      const alert = alerts.find((a) => a.type === "remedial_actions_outstanding");
      expect(alert).toBeUndefined();
    });

    it("fires per record for multiple outstanding remedial actions", () => {
      const rows = [
        makeRow({ remedial_actions_required: true, remedial_actions_completed: false }),
        makeRow({ remedial_actions_required: true, remedial_actions_completed: false }),
      ];
      const alerts = computeComplianceCertificateAlerts(rows);
      const outstanding = alerts.filter((a) => a.type === "remedial_actions_outstanding");
      expect(outstanding).toHaveLength(2);
    });
  });

  describe("multiple_expiring_soon alert", () => {
    it("fires when 2 or more certificates are expiring soon", () => {
      const rows = [
        makeRow({ compliance_status: "expiring_soon" }),
        makeRow({ compliance_status: "expiring_soon" }),
      ];
      const alerts = computeComplianceCertificateAlerts(rows);
      const alert = alerts.find((a) => a.type === "multiple_expiring_soon");
      expect(alert).toBeDefined();
    });

    it("has severity high", () => {
      const rows = [
        makeRow({ compliance_status: "expiring_soon" }),
        makeRow({ compliance_status: "expiring_soon" }),
      ];
      const alerts = computeComplianceCertificateAlerts(rows);
      const alert = alerts.find((a) => a.type === "multiple_expiring_soon")!;
      expect(alert.severity).toBe("high");
    });

    it("includes count in message", () => {
      const rows = [
        makeRow({ compliance_status: "expiring_soon" }),
        makeRow({ compliance_status: "expiring_soon" }),
        makeRow({ compliance_status: "expiring_soon" }),
      ];
      const alerts = computeComplianceCertificateAlerts(rows);
      const alert = alerts.find((a) => a.type === "multiple_expiring_soon")!;
      expect(alert.message).toContain("3");
    });

    it("does not fire when only 1 certificate is expiring soon", () => {
      const rows = [makeRow({ compliance_status: "expiring_soon" })];
      const alerts = computeComplianceCertificateAlerts(rows);
      const alert = alerts.find((a) => a.type === "multiple_expiring_soon");
      expect(alert).toBeUndefined();
    });

    it("does not fire when no certificates are expiring soon", () => {
      const rows = [makeRow({ compliance_status: "valid" }), makeRow({ compliance_status: "expired" })];
      const alerts = computeComplianceCertificateAlerts(rows);
      const alert = alerts.find((a) => a.type === "multiple_expiring_soon");
      expect(alert).toBeUndefined();
    });

    it("fires only once as aggregate alert", () => {
      const rows = [
        makeRow({ compliance_status: "expiring_soon" }),
        makeRow({ compliance_status: "expiring_soon" }),
        makeRow({ compliance_status: "expiring_soon" }),
      ];
      const alerts = computeComplianceCertificateAlerts(rows);
      const expiring = alerts.filter((a) => a.type === "multiple_expiring_soon");
      expect(expiring).toHaveLength(1);
    });
  });

  describe("digital_copies_missing alert", () => {
    it("fires when 2 or more certificates lack digital copies", () => {
      const rows = [
        makeRow({ digital_copy_stored: false }),
        makeRow({ digital_copy_stored: false }),
      ];
      const alerts = computeComplianceCertificateAlerts(rows);
      const alert = alerts.find((a) => a.type === "digital_copies_missing");
      expect(alert).toBeDefined();
    });

    it("has severity medium", () => {
      const rows = [
        makeRow({ digital_copy_stored: false }),
        makeRow({ digital_copy_stored: false }),
      ];
      const alerts = computeComplianceCertificateAlerts(rows);
      const alert = alerts.find((a) => a.type === "digital_copies_missing")!;
      expect(alert.severity).toBe("medium");
    });

    it("includes count in message", () => {
      const rows = [
        makeRow({ digital_copy_stored: false }),
        makeRow({ digital_copy_stored: false }),
        makeRow({ digital_copy_stored: false }),
      ];
      const alerts = computeComplianceCertificateAlerts(rows);
      const alert = alerts.find((a) => a.type === "digital_copies_missing")!;
      expect(alert.message).toContain("3");
    });

    it("does not fire when only 1 certificate lacks digital copy", () => {
      const rows = [makeRow({ digital_copy_stored: false })];
      const alerts = computeComplianceCertificateAlerts(rows);
      const alert = alerts.find((a) => a.type === "digital_copies_missing");
      expect(alert).toBeUndefined();
    });

    it("does not fire when all have digital copies", () => {
      const rows = [makeRow({ digital_copy_stored: true }), makeRow({ digital_copy_stored: true })];
      const alerts = computeComplianceCertificateAlerts(rows);
      const alert = alerts.find((a) => a.type === "digital_copies_missing");
      expect(alert).toBeUndefined();
    });

    it("fires only once as aggregate alert", () => {
      const rows = [
        makeRow({ digital_copy_stored: false }),
        makeRow({ digital_copy_stored: false }),
        makeRow({ digital_copy_stored: false }),
      ];
      const alerts = computeComplianceCertificateAlerts(rows);
      const missing = alerts.filter((a) => a.type === "digital_copies_missing");
      expect(missing).toHaveLength(1);
    });
  });

  describe("combined alerts", () => {
    it("can fire all four alert types simultaneously", () => {
      const rows = [
        makeRow({ compliance_status: "expired", certificate_type: "gas_safety", remedial_actions_required: true, remedial_actions_completed: false, digital_copy_stored: false }),
        makeRow({ compliance_status: "expiring_soon", remedial_actions_required: true, remedial_actions_completed: false, digital_copy_stored: false }),
        makeRow({ compliance_status: "expiring_soon", digital_copy_stored: false }),
      ];
      const alerts = computeComplianceCertificateAlerts(rows);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("safety_critical_expired");
      expect(types).toContain("remedial_actions_outstanding");
      expect(types).toContain("multiple_expiring_soon");
      expect(types).toContain("digital_copies_missing");
    });
  });

  describe("alert structure", () => {
    it("every alert has type, severity, and message fields", () => {
      const rows = [
        makeRow({ compliance_status: "expired", certificate_type: "gas_safety", remedial_actions_required: true, remedial_actions_completed: false }),
      ];
      const alerts = computeComplianceCertificateAlerts(rows);
      for (const alert of alerts) {
        expect(alert).toHaveProperty("type");
        expect(alert).toHaveProperty("severity");
        expect(alert).toHaveProperty("message");
      }
    });

    it("severity is always one of critical, high, or medium", () => {
      const rows = [
        makeRow({ compliance_status: "expired", certificate_type: "gas_safety", remedial_actions_required: true, remedial_actions_completed: false, digital_copy_stored: false }),
        makeRow({ compliance_status: "expiring_soon", digital_copy_stored: false }),
        makeRow({ compliance_status: "expiring_soon", digital_copy_stored: false }),
      ];
      const alerts = computeComplianceCertificateAlerts(rows);
      for (const alert of alerts) {
        expect(["critical", "high", "medium"]).toContain(alert.severity);
      }
    });

    it("message is always a non-empty string", () => {
      const rows = [makeRow({ compliance_status: "expired", certificate_type: "electrical_installation" })];
      const alerts = computeComplianceCertificateAlerts(rows);
      for (const alert of alerts) {
        expect(typeof alert.message).toBe("string");
        expect(alert.message.length).toBeGreaterThan(0);
      }
    });
  });
});

// ── generateComplianceCertificateAriaInsights ────────────────────────────

describe("generateComplianceCertificateAriaInsights", () => {
  it("returns exactly 3 insights", () => {
    const metrics = computeComplianceCertificateMetrics([]);
    const alerts = computeComplianceCertificateAlerts([]);
    const insights = generateComplianceCertificateAriaInsights(metrics, alerts);
    expect(insights).toHaveLength(3);
  });

  it("first insight starts with [cyan]", () => {
    const metrics = computeComplianceCertificateMetrics([makeRow()]);
    const alerts = computeComplianceCertificateAlerts([makeRow()]);
    const insights = generateComplianceCertificateAriaInsights(metrics, alerts);
    expect(insights[0]).toMatch(/^\[cyan\]/);
  });

  it("first insight includes total_certificates count", () => {
    const rows = [makeRow(), makeRow(), makeRow()];
    const metrics = computeComplianceCertificateMetrics(rows);
    const alerts = computeComplianceCertificateAlerts(rows);
    const insights = generateComplianceCertificateAriaInsights(metrics, alerts);
    expect(insights[0]).toContain("3");
  });

  it("first insight includes valid_rate", () => {
    const rows = [makeRow({ compliance_status: "valid" }), makeRow({ compliance_status: "expired" })];
    const metrics = computeComplianceCertificateMetrics(rows);
    const alerts = computeComplianceCertificateAlerts(rows);
    const insights = generateComplianceCertificateAriaInsights(metrics, alerts);
    expect(insights[0]).toContain("50%");
  });

  it("second insight starts with [amber]", () => {
    const metrics = computeComplianceCertificateMetrics([makeRow()]);
    const alerts = computeComplianceCertificateAlerts([makeRow()]);
    const insights = generateComplianceCertificateAriaInsights(metrics, alerts);
    expect(insights[1]).toMatch(/^\[amber\]/);
  });

  it("second insight mentions critical and high alerts when present", () => {
    const rows = [
      makeRow({ compliance_status: "expired", certificate_type: "gas_safety", remedial_actions_required: true, remedial_actions_completed: false }),
    ];
    const metrics = computeComplianceCertificateMetrics(rows);
    const alerts = computeComplianceCertificateAlerts(rows);
    const insights = generateComplianceCertificateAriaInsights(metrics, alerts);
    expect(insights[1]).toContain("critical");
    expect(insights[1]).toContain("high");
  });

  it("second insight mentions no alerts when none present", () => {
    const rows = [makeRow({ compliance_status: "valid", remedial_actions_required: false, digital_copy_stored: true })];
    const metrics = computeComplianceCertificateMetrics(rows);
    const alerts = computeComplianceCertificateAlerts(rows);
    const insights = generateComplianceCertificateAriaInsights(metrics, alerts);
    expect(insights[1]).toContain("No critical or high-priority alerts");
  });

  it("third insight starts with [reflect]", () => {
    const metrics = computeComplianceCertificateMetrics([makeRow()]);
    const alerts = computeComplianceCertificateAlerts([makeRow()]);
    const insights = generateComplianceCertificateAriaInsights(metrics, alerts);
    expect(insights[2]).toMatch(/^\[reflect\]/);
  });

  it("third insight mentions expired certificates when some are expired", () => {
    const rows = [makeRow({ compliance_status: "expired" })];
    const metrics = computeComplianceCertificateMetrics(rows);
    const alerts = computeComplianceCertificateAlerts(rows);
    const insights = generateComplianceCertificateAriaInsights(metrics, alerts);
    expect(insights[2]).toContain("expired");
  });

  it("third insight asks about digital copies when no expired but not all digitised", () => {
    const rows = [
      makeRow({ compliance_status: "valid", digital_copy_stored: false }),
      makeRow({ compliance_status: "valid", digital_copy_stored: true }),
    ];
    const metrics = computeComplianceCertificateMetrics(rows);
    const alerts = computeComplianceCertificateAlerts(rows);
    const insights = generateComplianceCertificateAriaInsights(metrics, alerts);
    expect(insights[2]).toContain("digital copies");
  });

  it("third insight celebrates strong compliance when all valid and digitised", () => {
    const rows = [
      makeRow({ compliance_status: "valid", digital_copy_stored: true }),
      makeRow({ compliance_status: "valid", digital_copy_stored: true }),
    ];
    const metrics = computeComplianceCertificateMetrics(rows);
    const alerts = computeComplianceCertificateAlerts(rows);
    const insights = generateComplianceCertificateAriaInsights(metrics, alerts);
    expect(insights[2]).toContain("current and digitally stored");
  });

  it("uses singular body wording when unique_issuing_bodies is 1", () => {
    const rows = [makeRow({ issuing_body: "gas_safe_register" })];
    const metrics = computeComplianceCertificateMetrics(rows);
    const alerts = computeComplianceCertificateAlerts(rows);
    const insights = generateComplianceCertificateAriaInsights(metrics, alerts);
    expect(insights[0]).toContain("1 issuing body");
  });

  it("uses plural bodies wording when unique_issuing_bodies > 1", () => {
    const rows = [
      makeRow({ issuing_body: "gas_safe_register" }),
      makeRow({ issuing_body: "niceic" }),
    ];
    const metrics = computeComplianceCertificateMetrics(rows);
    const alerts = computeComplianceCertificateAlerts(rows);
    const insights = generateComplianceCertificateAriaInsights(metrics, alerts);
    expect(insights[0]).toContain("2 issuing bodies");
  });

  it("all insights are non-empty strings", () => {
    const metrics = computeComplianceCertificateMetrics([makeRow()]);
    const alerts = computeComplianceCertificateAlerts([makeRow()]);
    const insights = generateComplianceCertificateAriaInsights(metrics, alerts);
    for (const insight of insights) {
      expect(typeof insight).toBe("string");
      expect(insight.length).toBeGreaterThan(0);
    }
  });

  it("uses singular certificate wording when 1 expired", () => {
    const rows = [makeRow({ compliance_status: "expired" })];
    const metrics = computeComplianceCertificateMetrics(rows);
    const alerts = computeComplianceCertificateAlerts(rows);
    const insights = generateComplianceCertificateAriaInsights(metrics, alerts);
    expect(insights[2]).toContain("certificate has");
  });

  it("uses plural certificates wording when multiple expired", () => {
    const rows = [
      makeRow({ compliance_status: "expired" }),
      makeRow({ compliance_status: "expired" }),
    ];
    const metrics = computeComplianceCertificateMetrics(rows);
    const alerts = computeComplianceCertificateAlerts(rows);
    const insights = generateComplianceCertificateAriaInsights(metrics, alerts);
    expect(insights[2]).toContain("certificates have");
  });
});

// ── Enum constants ───────────────────────────────────────────────────────

describe("Enum constants", () => {
  it("CERTIFICATE_TYPES has exactly 10 items", () => {
    expect(CERTIFICATE_TYPES).toHaveLength(10);
  });

  it("COMPLIANCE_STATUSES has exactly 5 items", () => {
    expect(COMPLIANCE_STATUSES).toHaveLength(5);
  });

  it("ISSUING_BODIES has exactly 10 items", () => {
    expect(ISSUING_BODIES).toHaveLength(10);
  });

  it("RENEWAL_URGENCIES has exactly 5 items", () => {
    expect(RENEWAL_URGENCIES).toHaveLength(5);
  });

  it("CERTIFICATE_TYPES values are unique", () => {
    expect(new Set(CERTIFICATE_TYPES).size).toBe(CERTIFICATE_TYPES.length);
  });

  it("COMPLIANCE_STATUSES values are unique", () => {
    expect(new Set(COMPLIANCE_STATUSES).size).toBe(COMPLIANCE_STATUSES.length);
  });

  it("ISSUING_BODIES values are unique", () => {
    expect(new Set(ISSUING_BODIES).size).toBe(ISSUING_BODIES.length);
  });

  it("RENEWAL_URGENCIES values are unique", () => {
    expect(new Set(RENEWAL_URGENCIES).size).toBe(RENEWAL_URGENCIES.length);
  });
});

// ── Factory helper validation ────────────────────────────────────────────

describe("makeRow factory helper", () => {
  it("creates a row with sensible defaults", () => {
    const r = makeRow();
    expect(r.home_id).toBe("home-1");
    expect(r.certificate_type).toBe("gas_safety");
    expect(r.certificate_reference).toBe("CERT-001");
    expect(r.issuing_body).toBe("gas_safe_register");
    expect(r.compliance_status).toBe("valid");
    expect(r.renewal_urgency).toBe("routine");
    expect(r.issue_date).toBe("2026-01-15");
    expect(r.expiry_date).toBe("2027-01-15");
    expect(r.last_inspection_date).toBeNull();
    expect(r.next_inspection_due).toBeNull();
    expect(r.inspector_name).toBeNull();
    expect(r.remedial_actions_required).toBe(false);
    expect(r.remedial_actions_completed).toBe(false);
    expect(r.digital_copy_stored).toBe(true);
    expect(r.ofsted_notified).toBe(true);
    expect(r.notes).toBeNull();
  });

  it("allows overriding individual fields", () => {
    const r = makeRow({ certificate_type: "pat_testing", compliance_status: "expired" });
    expect(r.certificate_type).toBe("pat_testing");
    expect(r.compliance_status).toBe("expired");
    // defaults still apply
    expect(r.issuing_body).toBe("gas_safe_register");
  });

  it("generates unique ids by default", () => {
    const r1 = makeRow();
    const r2 = makeRow();
    expect(r1.id).not.toBe(r2.id);
  });

  it("allows overriding id", () => {
    const r = makeRow({ id: "custom-id" });
    expect(r.id).toBe("custom-id");
  });

  it("allows setting nullable fields to null", () => {
    const r = makeRow({ last_inspection_date: null, next_inspection_due: null, inspector_name: null, notes: null });
    expect(r.last_inspection_date).toBeNull();
    expect(r.next_inspection_due).toBeNull();
    expect(r.inspector_name).toBeNull();
    expect(r.notes).toBeNull();
  });

  it("allows setting nullable fields to values", () => {
    const r = makeRow({ last_inspection_date: "2026-03-01", next_inspection_due: "2026-09-01", inspector_name: "John Smith", notes: "All clear" });
    expect(r.last_inspection_date).toBe("2026-03-01");
    expect(r.next_inspection_due).toBe("2026-09-01");
    expect(r.inspector_name).toBe("John Smith");
    expect(r.notes).toBe("All clear");
  });
});
