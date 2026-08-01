import { describe, it, expect } from "vitest";
import {
  computeInternetUsageMetrics,
  identifyInternetUsageAlerts,
  type InternetUsageMonitoringRecord,
} from "./internet-usage-monitoring-service";

function makeRecord(overrides: Partial<InternetUsageMonitoringRecord> = {}): InternetUsageMonitoringRecord {
  return {
    id: "iu-1",
    home_id: "home-1",
    device_type: "personal_phone",
    usage_purpose: "education",
    concern_level: "no_concerns",
    monitoring_level: "full_monitoring",
    monitoring_date: "2026-05-10",
    child_name: "Alex Smith",
    child_id: "child-1",
    monitored_by: "Jane Doe",
    parental_controls_active: true,
    age_appropriate_content: true,
    screen_time_within_limits: true,
    privacy_settings_checked: true,
    social_media_reviewed: true,
    contact_list_checked: true,
    online_safety_discussed: true,
    digital_literacy_supported: true,
    consent_current: true,
    care_plan_linked: true,
    social_worker_informed: true,
    recorded_promptly: true,
    issues_found: [],
    actions_taken: [],
    screen_time_minutes: 120,
    next_review_date: "2026-06-10",
    notes: null,
    created_at: "2026-05-10T00:00:00Z",
    updated_at: "2026-05-10T00:00:00Z",
    ...overrides,
  };
}

describe("internet-usage-monitoring-service", () => {
  // -- computeInternetUsageMetrics -----------------------------------------------

  describe("computeInternetUsageMetrics", () => {
    it("returns zeroes for empty data", () => {
      const m = computeInternetUsageMetrics([]);
      expect(m.total_records).toBe(0);
      expect(m.high_concern_count).toBe(0);
      expect(m.safeguarding_referral_count).toBe(0);
      expect(m.average_screen_time).toBeNull();;
      expect(m.unique_children).toBe(0);
      expect(m.parental_controls_rate).toBeNull();;
    });

    it("counts concern levels and monitoring", () => {
      const records = [
        makeRecord({ concern_level: "high", monitoring_level: "none" }),
        makeRecord({ id: "r2", concern_level: "safeguarding_referral", usage_purpose: "social_media" }),
        makeRecord({ id: "r3", concern_level: "no_concerns" }),
      ];
      const m = computeInternetUsageMetrics(records);
      expect(m.high_concern_count).toBe(1);
      expect(m.safeguarding_referral_count).toBe(1);
      expect(m.no_monitoring_count).toBe(1);
      expect(m.social_media_count).toBe(1);
    });

    it("computes boolean rates correctly", () => {
      const records = [
        makeRecord({
          parental_controls_active: true,
          age_appropriate_content: true,
          online_safety_discussed: false,
          privacy_settings_checked: false,
        }),
        makeRecord({
          id: "r2",
          parental_controls_active: false,
          age_appropriate_content: false,
          online_safety_discussed: true,
          privacy_settings_checked: true,
        }),
      ];
      const m = computeInternetUsageMetrics(records);
      expect(m.parental_controls_rate).toBe(50);
      expect(m.age_appropriate_rate).toBe(50);
      expect(m.online_safety_discussed_rate).toBe(50);
      expect(m.privacy_settings_rate).toBe(50);
    });

    it("computes average screen time and unique children", () => {
      const records = [
        makeRecord({ screen_time_minutes: 60, child_name: "Alex" }),
        makeRecord({ id: "r2", screen_time_minutes: 180, child_name: "Beth" }),
      ];
      const m = computeInternetUsageMetrics(records);
      expect(m.average_screen_time).toBe(120);
      expect(m.unique_children).toBe(2);
    });

    it("builds breakdown records", () => {
      const records = [
        makeRecord({ device_type: "tablet", usage_purpose: "gaming" }),
      ];
      const m = computeInternetUsageMetrics(records);
      expect(m.by_device_type["tablet"]).toBe(1);
      expect(m.by_usage_purpose["gaming"]).toBe(1);
    });
  });

  // -- identifyInternetUsageAlerts -----------------------------------------------

  describe("identifyInternetUsageAlerts", () => {
    it("returns no alerts for empty data", () => {
      expect(identifyInternetUsageAlerts([])).toHaveLength(0);
    });

    it("fires critical safeguarding_referral", () => {
      const records = [makeRecord({ concern_level: "safeguarding_referral" })];
      const alerts = identifyInternetUsageAlerts(records);
      const sg = alerts.find((a) => a.type === "safeguarding_referral");
      expect(sg).toBeDefined();
      expect(sg!.severity).toBe("critical");
    });

    it("fires high no_parental_controls when >= 1 without controls", () => {
      const records = [makeRecord({ parental_controls_active: false })];
      const alerts = identifyInternetUsageAlerts(records);
      const npc = alerts.find((a) => a.type === "no_parental_controls");
      expect(npc).toBeDefined();
      expect(npc!.severity).toBe("high");
    });

    it("fires high safety_not_discussed when >= 1 without safety discussion", () => {
      const records = [makeRecord({ online_safety_discussed: false })];
      const alerts = identifyInternetUsageAlerts(records);
      expect(alerts.find((a) => a.type === "safety_not_discussed")).toBeDefined();
    });

    it("fires medium privacy_not_checked when >= 2 without privacy check", () => {
      const records = [
        makeRecord({ privacy_settings_checked: false }),
        makeRecord({ id: "r2", privacy_settings_checked: false }),
      ];
      const alerts = identifyInternetUsageAlerts(records);
      expect(alerts.find((a) => a.type === "privacy_not_checked")).toBeDefined();
    });

    it("fires medium screen_time_exceeded when >= 2 not within limits", () => {
      const records = [
        makeRecord({ screen_time_within_limits: false }),
        makeRecord({ id: "r2", screen_time_within_limits: false }),
      ];
      const alerts = identifyInternetUsageAlerts(records);
      expect(alerts.find((a) => a.type === "screen_time_exceeded")).toBeDefined();
    });

    it("does NOT fire screen_time_exceeded when only 1 not within limits", () => {
      const records = [makeRecord({ screen_time_within_limits: false })];
      const alerts = identifyInternetUsageAlerts(records);
      expect(alerts.find((a) => a.type === "screen_time_exceeded")).toBeUndefined();
    });
  });
});
