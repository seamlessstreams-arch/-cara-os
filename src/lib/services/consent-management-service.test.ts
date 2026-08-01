import { describe, it, expect } from "vitest";
import {
  computeConsentMetrics,
  identifyConsentAlerts,
  type ConsentRecord,
} from "./consent-management-service";

const NOW = new Date("2026-05-21T12:00:00Z");

function makeRecord(overrides: Partial<ConsentRecord> = {}): ConsentRecord {
  return {
    id: "rec-1",
    home_id: "home-1",
    child_name: "Alex Smith",
    child_id: "child-1",
    category: "medical_treatment",
    status: "granted",
    given_by: "parent_mother",
    given_by_name: "Mrs Smith",
    consent_date: "2026-04-01",
    expiry_date: "2027-04-01",
    conditions: null,
    evidence_on_file: true,
    reviewed_date: null,
    notes: null,
    created_at: "2026-04-01T08:00:00Z",
    updated_at: "2026-04-01T08:00:00Z",
    ...overrides,
  };
}

describe("computeConsentMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeConsentMetrics([], 4, NOW);
    expect(m.total_records).toBe(0);
    expect(m.granted_count).toBe(0);
    expect(m.consent_coverage).toBe(0);
    expect(m.evidence_on_file_rate).toBeNull();;
    expect(m.medical_consent_rate).toBe(0);
  });

  it("counts statuses correctly", () => {
    const records = [
      makeRecord({ id: "r1", status: "granted" }),
      makeRecord({ id: "r2", status: "refused" }),
      makeRecord({ id: "r3", status: "pending" }),
      makeRecord({ id: "r4", status: "expired" }),
      makeRecord({ id: "r5", status: "withdrawn" }),
    ];
    const m = computeConsentMetrics(records, 4, NOW);
    expect(m.total_records).toBe(5);
    expect(m.granted_count).toBe(1);
    expect(m.refused_count).toBe(1);
    expect(m.pending_count).toBe(1);
    expect(m.withdrawn_count).toBe(1);
    expect(m.by_status.granted).toBe(1);
    expect(m.by_status.refused).toBe(1);
  });

  it("calculates consent coverage and medical/emergency rates", () => {
    const records = [
      makeRecord({ id: "r1", child_id: "c1", category: "medical_treatment", status: "granted" }),
      makeRecord({ id: "r2", child_id: "c2", category: "emergency_medical", status: "granted" }),
      makeRecord({ id: "r3", child_id: "c1", category: "emergency_medical", status: "granted" }),
    ];
    const m = computeConsentMetrics(records, 4, NOW);
    // coverage: 2 unique children with granted consent / 4 total = 50%
    expect(m.children_with_consent).toBe(2);
    expect(m.consent_coverage).toBe(50);
    // medical: 1 unique child with medical_treatment granted / 4 = 25%
    expect(m.medical_consent_rate).toBe(25);
    // emergency: 2 unique children with emergency_medical / 4 = 50%
    expect(m.emergency_consent_rate).toBe(50);
  });

  it("counts photo consent granted", () => {
    const records = [
      makeRecord({ id: "r1", category: "photographs", status: "granted" }),
      makeRecord({ id: "r2", category: "photographs", status: "refused" }),
    ];
    const m = computeConsentMetrics(records, 4, NOW);
    expect(m.photo_consent_granted).toBe(1);
  });

  it("counts evidence on file rate", () => {
    const records = [
      makeRecord({ id: "r1", evidence_on_file: true }),
      makeRecord({ id: "r2", evidence_on_file: false }),
    ];
    const m = computeConsentMetrics(records, 4, NOW);
    expect(m.evidence_on_file_rate).toBe(50);
  });

  it("counts expiring soon (within 30 days)", () => {
    const records = [
      makeRecord({ id: "r1", status: "granted", expiry_date: "2026-06-10" }), // within 30 days of NOW
      makeRecord({ id: "r2", status: "granted", expiry_date: "2027-01-01" }), // not within 30 days
    ];
    const m = computeConsentMetrics(records, 4, NOW);
    expect(m.expiring_soon).toBe(1);
  });

  it("counts actually expired (granted but expiry_date < now)", () => {
    const records = [
      makeRecord({ id: "r1", status: "granted", expiry_date: "2026-01-01" }),
    ];
    const m = computeConsentMetrics(records, 4, NOW);
    // expired_count includes status=expired + actually expired by date
    expect(m.expired_count).toBe(1);
  });

  it("groups by category and given_by", () => {
    const records = [
      makeRecord({ id: "r1", category: "medical_treatment", given_by: "parent_mother" }),
      makeRecord({ id: "r2", category: "photographs", given_by: "local_authority" }),
    ];
    const m = computeConsentMetrics(records, 4, NOW);
    expect(m.by_category.medical_treatment).toBe(1);
    expect(m.by_category.photographs).toBe(1);
    expect(m.by_given_by.parent_mother).toBe(1);
    expect(m.by_given_by.local_authority).toBe(1);
  });
});

describe("identifyConsentAlerts", () => {
  it("returns empty alerts for empty data and no children", () => {
    const alerts = identifyConsentAlerts([], 0, NOW);
    expect(alerts).toEqual([]);
  });

  it("flags missing emergency medical consent", () => {
    const records = [
      makeRecord({ id: "r1", child_id: "c1", category: "emergency_medical", status: "granted" }),
    ];
    // 4 children total, only 1 has emergency consent -> gap = 3
    const alerts = identifyConsentAlerts(records, 4, NOW);
    const emerAlerts = alerts.filter((a) => a.type === "no_emergency_consent");
    expect(emerAlerts).toHaveLength(1);
    expect(emerAlerts[0].severity).toBe("critical");
  });

  it("does not flag when all children have emergency consent", () => {
    const records = [
      makeRecord({ id: "r1", child_id: "c1", category: "emergency_medical", status: "granted" }),
      makeRecord({ id: "r2", child_id: "c2", category: "emergency_medical", status: "granted" }),
    ];
    const alerts = identifyConsentAlerts(records, 2, NOW);
    const emerAlerts = alerts.filter((a) => a.type === "no_emergency_consent");
    expect(emerAlerts).toHaveLength(0);
  });

  it("flags consent expiring within 14 days", () => {
    const records = [
      makeRecord({ id: "r1", status: "granted", expiry_date: "2026-05-30" }), // 9 days from NOW
    ];
    const alerts = identifyConsentAlerts(records, 4, NOW);
    const expAlerts = alerts.filter((a) => a.type === "consent_expiring");
    expect(expAlerts).toHaveLength(1);
    expect(expAlerts[0].severity).toBe("medium");
  });

  it("flags already expired consent still marked granted", () => {
    const records = [
      makeRecord({ id: "r1", status: "granted", expiry_date: "2026-03-01" }),
    ];
    const alerts = identifyConsentAlerts(records, 4, NOW);
    const expAlerts = alerts.filter((a) => a.type === "consent_expired");
    expect(expAlerts).toHaveLength(1);
    expect(expAlerts[0].severity).toBe("high");
  });

  it("flags pending consents", () => {
    const records = [
      makeRecord({ id: "r1", status: "pending", category: "medical_treatment" }),
    ];
    const alerts = identifyConsentAlerts(records, 4, NOW);
    const pendAlerts = alerts.filter((a) => a.type === "consent_pending");
    expect(pendAlerts).toHaveLength(1);
    // medical_treatment pending => high severity
    expect(pendAlerts[0].severity).toBe("high");
  });

  it("flags pending non-medical consent as medium", () => {
    const records = [
      makeRecord({ id: "r1", status: "pending", category: "photographs" }),
    ];
    const alerts = identifyConsentAlerts(records, 4, NOW);
    const pendAlerts = alerts.filter((a) => a.type === "consent_pending");
    expect(pendAlerts).toHaveLength(1);
    expect(pendAlerts[0].severity).toBe("medium");
  });

  it("flags no evidence on file for granted consent", () => {
    const records = [
      makeRecord({ id: "r1", status: "granted", evidence_on_file: false }),
    ];
    const alerts = identifyConsentAlerts(records, 4, NOW);
    const evAlerts = alerts.filter((a) => a.type === "no_evidence");
    expect(evAlerts).toHaveLength(1);
    expect(evAlerts[0].severity).toBe("medium");
  });
});
