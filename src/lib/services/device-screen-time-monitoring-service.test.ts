import { describe, it, expect } from "vitest";
import {
  computeDeviceScreenTimeMetrics,
  identifyDeviceScreenTimeAlerts,
  DeviceScreenTimeMonitoringRecord,
} from "./device-screen-time-monitoring-service";

function makeRecord(overrides: Partial<DeviceScreenTimeMonitoringRecord> = {}): DeviceScreenTimeMonitoringRecord {
  return {
    id: "dst-1",
    home_id: "home-1",
    device_type: "smartphone",
    usage_category: "educational",
    compliance_level: "fully_compliant",
    wellbeing_impact: "positive",
    monitoring_date: "2026-05-21",
    child_name: "Alice",
    child_id: "child-1",
    monitored_by: "Staff A",
    limits_agreed: true,
    age_appropriate_content: true,
    parental_controls_active: true,
    night_time_limits: true,
    social_media_supervised: true,
    privacy_settings_checked: true,
    care_plan_reflects: true,
    social_worker_informed: true,
    parent_informed: true,
    online_safety_discussed: true,
    healthy_alternatives_offered: true,
    recorded_promptly: true,
    issues_found: [],
    actions_taken: [],
    next_review_date: null,
    notes: null,
    created_at: "2026-05-21T10:00:00Z",
    updated_at: "2026-05-21T10:00:00Z",
    ...overrides,
  };
}

// ── computeDeviceScreenTimeMetrics ─────────────────────────────────────

describe("computeDeviceScreenTimeMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeDeviceScreenTimeMetrics([]);
    expect(m.total_checks).toBe(0);
    expect(m.non_compliant_count).toBe(0);
    expect(m.refused_count).toBe(0);
    expect(m.limits_agreed_rate).toBeNull();;
    expect(m.unique_children).toBe(0);
  });

  it("calculates correct counts and rates for populated data", () => {
    const records = [
      makeRecord({ compliance_level: "non_compliant", parental_controls_active: false }),
      makeRecord({ id: "dst-2", compliance_level: "refused_limits", usage_category: "inappropriate", wellbeing_impact: "significant_concern" }),
      makeRecord({ id: "dst-3", child_name: "Bob" }),
    ];
    const m = computeDeviceScreenTimeMetrics(records);
    expect(m.total_checks).toBe(3);
    expect(m.non_compliant_count).toBe(1);
    expect(m.refused_count).toBe(1);
    expect(m.inappropriate_count).toBe(1);
    expect(m.significant_concern_count).toBe(1);
    expect(m.unique_children).toBe(2);
    expect(m.parental_controls_rate).toBe(66.7);
  });

  it("produces correct breakdown maps", () => {
    const records = [
      makeRecord({ device_type: "smartphone" }),
      makeRecord({ id: "dst-2", device_type: "tablet" }),
    ];
    const m = computeDeviceScreenTimeMetrics(records);
    expect(m.by_device_type["smartphone"]).toBe(1);
    expect(m.by_device_type["tablet"]).toBe(1);
  });
});

// ── identifyDeviceScreenTimeAlerts ─────────────────────────────────────

describe("identifyDeviceScreenTimeAlerts", () => {
  it("returns no alerts for empty data", () => {
    expect(identifyDeviceScreenTimeAlerts([])).toEqual([]);
  });

  it("alerts critical for inappropriate content with significant concern", () => {
    const records = [
      makeRecord({ usage_category: "inappropriate", wellbeing_impact: "significant_concern", child_name: "Alice" }),
    ];
    const alerts = identifyDeviceScreenTimeAlerts(records);
    const critical = alerts.find((a) => a.type === "inappropriate_significant_concern");
    expect(critical).toBeDefined();
    expect(critical!.severity).toBe("critical");
  });

  it("alerts high when >=1 device has no parental controls", () => {
    const records = [makeRecord({ parental_controls_active: false })];
    const alerts = identifyDeviceScreenTimeAlerts(records);
    expect(alerts.find((a) => a.type === "no_parental_controls")).toBeDefined();
  });

  it("alerts high when >=1 check has no night-time limits", () => {
    const records = [makeRecord({ night_time_limits: false })];
    const alerts = identifyDeviceScreenTimeAlerts(records);
    expect(alerts.find((a) => a.type === "no_night_limits")).toBeDefined();
  });

  it("alerts medium when >=2 checks without online safety discussion", () => {
    const records = [
      makeRecord({ online_safety_discussed: false }),
      makeRecord({ id: "dst-2", online_safety_discussed: false }),
    ];
    const alerts = identifyDeviceScreenTimeAlerts(records);
    expect(alerts.find((a) => a.type === "no_online_safety_discussion")).toBeDefined();
  });

  it("alerts medium when >=2 checks without privacy settings reviewed", () => {
    const records = [
      makeRecord({ privacy_settings_checked: false }),
      makeRecord({ id: "dst-2", privacy_settings_checked: false }),
    ];
    const alerts = identifyDeviceScreenTimeAlerts(records);
    expect(alerts.find((a) => a.type === "no_privacy_settings")).toBeDefined();
  });

  it("does not alert critical if inappropriate but no significant concern", () => {
    const records = [
      makeRecord({ usage_category: "inappropriate", wellbeing_impact: "mild_concern" }),
    ];
    const alerts = identifyDeviceScreenTimeAlerts(records);
    expect(alerts.find((a) => a.type === "inappropriate_significant_concern")).toBeUndefined();
  });
});
