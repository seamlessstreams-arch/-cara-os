import { describe, it, expect } from "vitest";
import {
  computeMetrics,
  computeAlerts,
  validateKnifeWeaponSafety,
  generateCaraInsights,
  type KnifeWeaponSafetyRow,
} from "./knife-weapon-safety-service";

function makeRow(overrides: Partial<KnifeWeaponSafetyRow> = {}): KnifeWeaponSafetyRow {
  return {
    id: "kw-1",
    home_id: "home-1",
    record_date: "2026-05-01",
    recorded_by: "Staff A",
    record_type: "Kitchen Knife Audit",
    child_name: null,
    weapon_type: null,
    location_found: null,
    risk_level: "Low",
    kitchen_knives_accounted_for: true,
    kitchen_knife_count: 6,
    sharp_objects_secured: true,
    tool_storage_locked: true,
    search_consent_obtained: null,
    police_notified: false,
    social_worker_informed: false,
    reg_40_notification: false,
    parent_carer_informed: false,
    child_safety_plan_updated: false,
    environmental_changes_made: null,
    educational_content_delivered: false,
    next_audit_date: null,
    compliance_status: "Compliant",
    notes: null,
    created_at: "2026-05-01T10:00:00Z",
    updated_at: "2026-05-01T10:00:00Z",
    ...overrides,
  };
}

describe("computeMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeMetrics([]);
    expect(m.total_records).toBe(0);
    expect(m.incidents_count).toBe(0);
    expect(m.kitchen_compliance_rate).toBe(0);
    expect(m.compliance_rate).toBe(0);
    expect(m.educational_session_count).toBe(0);
    expect(m.unique_children_involved).toBe(0);
  });

  it("computes correct counts and breakdowns for populated data", () => {
    const rows = [
      makeRow({ id: "1", record_type: "Kitchen Knife Audit", kitchen_knives_accounted_for: true, compliance_status: "Compliant" }),
      makeRow({ id: "2", record_type: "Incident — Weapon Found", child_name: "Alice", weapon_type: "knife", risk_level: "High", compliance_status: "Non-Compliant", police_notified: true, social_worker_informed: true }),
      makeRow({ id: "3", record_type: "Incident — Threat with Weapon", child_name: "Bob", weapon_type: "bladed article", risk_level: "Critical", police_notified: false, social_worker_informed: false, reg_40_notification: false }),
      makeRow({ id: "4", record_type: "Educational Session", compliance_status: "Compliant", educational_content_delivered: true }),
      makeRow({ id: "5", record_type: "Sharp Object Check", sharp_objects_secured: false, tool_storage_locked: false, compliance_status: "Compliant" }),
    ];
    const m = computeMetrics(rows);
    expect(m.total_records).toBe(5);
    expect(m.incidents_count).toBe(2);
    expect(m.weapons_found_count).toBe(1);
    expect(m.weapons_threat_count).toBe(1);
    expect(m.weapons_brought_in_count).toBe(0);
    expect(m.kitchen_compliance_rate).toBe(100);
    expect(m.educational_session_count).toBe(1);
    expect(m.unique_children_involved).toBe(2);
    // 4 out of 5 compliant = 80% (rows 1,3,4,5 default to Compliant; row 2 is Non-Compliant)
    expect(m.compliance_rate).toBe(80);
  });
});

describe("computeAlerts", () => {
  it("returns empty alerts for empty data", () => {
    expect(computeAlerts([])).toEqual([]);
  });

  it("triggers weapon_incident_no_police for threat without police notification (critical)", () => {
    const rows = [
      makeRow({ id: "a1", record_type: "Incident — Threat with Weapon", child_name: "Alice", police_notified: false }),
    ];
    const alerts = computeAlerts(rows);
    const found = alerts.find((a) => a.type === "weapon_incident_no_police");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("critical");
  });

  it("triggers serious_incident_no_reg40 for High/Critical threat without reg40 (critical)", () => {
    const rows = [
      makeRow({ id: "a2", record_type: "Incident — Weapon Brought In", risk_level: "High", reg_40_notification: false, police_notified: true }),
    ];
    const alerts = computeAlerts(rows);
    const found = alerts.find((a) => a.type === "serious_incident_no_reg40");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("critical");
  });

  it("triggers knives_not_accounted for kitchen audit with knives not accounted (critical)", () => {
    const rows = [
      makeRow({ id: "a3", record_type: "Kitchen Knife Audit", kitchen_knives_accounted_for: false }),
    ];
    const alerts = computeAlerts(rows);
    const found = alerts.find((a) => a.type === "knives_not_accounted");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("critical");
  });

  it("triggers non_compliant alert (high)", () => {
    const rows = [
      makeRow({ id: "a4", compliance_status: "Non-Compliant" }),
    ];
    const alerts = computeAlerts(rows);
    const found = alerts.find((a) => a.type === "non_compliant");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("high");
  });

  it("triggers sharp_objects_not_secured alert (high)", () => {
    const rows = [
      makeRow({ id: "a5", record_type: "Sharp Object Check", sharp_objects_secured: false }),
    ];
    const alerts = computeAlerts(rows);
    const found = alerts.find((a) => a.type === "sharp_objects_not_secured");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("high");
  });

  it("triggers tool_storage_unlocked alert (high)", () => {
    const rows = [
      makeRow({ id: "a6", record_type: "Kitchen Knife Audit", tool_storage_locked: false }),
    ];
    const alerts = computeAlerts(rows);
    const found = alerts.find((a) => a.type === "tool_storage_unlocked");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("high");
  });

  it("triggers search_no_consent for bedroom search without consent (medium)", () => {
    const rows = [
      makeRow({ id: "a7", record_type: "Bedroom Search — with consent", search_consent_obtained: false, child_name: "Charlie" }),
    ];
    const alerts = computeAlerts(rows);
    const found = alerts.find((a) => a.type === "search_no_consent");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("medium");
  });

  it("triggers action_required alert (medium)", () => {
    const rows = [
      makeRow({ id: "a8", compliance_status: "Action Required" }),
    ];
    const alerts = computeAlerts(rows);
    const found = alerts.find((a) => a.type === "action_required");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("medium");
  });
});

describe("validateKnifeWeaponSafety", () => {
  it("passes for a valid kitchen knife audit", () => {
    const result = validateKnifeWeaponSafety({
      recordDate: "2026-05-01",
      recordedBy: "Staff A",
      recordType: "Kitchen Knife Audit",
      riskLevel: "Low",
      complianceStatus: "Compliant",
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("fails when required fields are missing", () => {
    const result = validateKnifeWeaponSafety({});
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(3);
  });

  it("requires weapon type for incident types", () => {
    const result = validateKnifeWeaponSafety({
      recordDate: "2026-05-01",
      recordedBy: "Staff A",
      recordType: "Incident — Weapon Found",
      riskLevel: "High",
      childName: "Alice",
    });
    expect(result.errors).toContain("Weapon type must be specified for all weapon-related incidents");
  });

  it("requires child name for incident types", () => {
    const result = validateKnifeWeaponSafety({
      recordDate: "2026-05-01",
      recordedBy: "Staff A",
      recordType: "Incident — Weapon Found",
      riskLevel: "High",
      weaponType: "knife",
    });
    expect(result.errors).toContain("Child name must be specified for all weapon-related incidents");
  });

  it("requires consent field for bedroom searches", () => {
    const result = validateKnifeWeaponSafety({
      recordDate: "2026-05-01",
      recordedBy: "Staff A",
      recordType: "Bedroom Search — with consent",
      riskLevel: "Low",
      childName: "Alice",
      searchConsentObtained: null,
    });
    expect(result.errors).toContain("Search consent status must be recorded for bedroom searches — consent is required under CHR 2015");
  });

  it("warns about police notification for high-risk weapon threat", () => {
    const result = validateKnifeWeaponSafety({
      recordDate: "2026-05-01",
      recordedBy: "Staff A",
      recordType: "Incident — Threat with Weapon",
      riskLevel: "High",
      childName: "Bob",
      weaponType: "knife",
      policeNotified: false,
      reg40Notification: true,
    });
    expect(result.errors).toContain("Police notification is strongly recommended for High/Critical weapon threat or weapon brought in incidents per Offensive Weapons Act 2019");
  });
});

describe("generateCaraInsights", () => {
  it("returns 3 insights for populated data", () => {
    const rows = [
      makeRow({ id: "1", record_type: "Kitchen Knife Audit" }),
      makeRow({ id: "2", record_type: "Educational Session", educational_content_delivered: true }),
    ];
    const insights = generateCaraInsights(rows);
    expect(insights.length).toBe(3);
    expect(insights[0]).toContain("[sky]");
    expect(insights[1]).toContain("[amber]");
    expect(insights[2]).toContain("[reflect]");
  });
});
