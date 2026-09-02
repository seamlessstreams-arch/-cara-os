import { describe, it, expect } from "vitest";
import { _testing, type InternetUsageMonitoringRecord } from "../internet-usage-monitoring-service";
import { todayStr } from "@/lib/utils";

const { computeInternetUsageMetrics, identifyInternetUsageAlerts } = _testing;

const now = new Date(todayStr());

function makeRecord(overrides?: Partial<InternetUsageMonitoringRecord>): InternetUsageMonitoringRecord {
  return {
    id: "a-1", home_id: "home-1",
    device_type: "personal_phone",
    usage_purpose: "education",
    concern_level: "no_concerns",
    monitoring_level: "periodic_checks",
    monitoring_date: todayStr(),
    child_name: "Child A",
    child_id: "child_id" in (overrides ?? {}) ? (overrides!.child_id ?? null) : null,
    monitored_by: "Staff A",
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
    issues_found: [], actions_taken: [],
    screen_time_minutes: 60,
    next_review_date: "next_review_date" in (overrides ?? {}) ? (overrides!.next_review_date ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: now.toISOString(), updated_at: now.toISOString(),
      // Overrides win last: an explicit null stays null — the old
    // `overrides?.x ?? default` fabricated answers inside the factory.
    ...overrides,
  };
}

describe("internet-usage-monitoring-service", () => {
  describe("computeInternetUsageMetrics", () => {
    it("returns zeros for empty", () => { 
      const m = computeInternetUsageMetrics([]);
      expect(m.total_records).toBe(0);;
      expect(m.high_concern_count).toBe(0);
      expect(m.safeguarding_referral_count).toBe(0);
      expect(m.no_monitoring_count).toBe(0);
      expect(m.social_media_count).toBe(0);
      expect(m.parental_controls_rate).toBeNull();;
      expect(m.average_screen_time).toBeNull();;
      expect(m.unique_children).toBe(0);
    });
    it("returns empty breakdowns", () => { 
      const m = computeInternetUsageMetrics([]);
      expect(m.by_device_type).toEqual({});
      expect(m.by_usage_purpose).toEqual({});
      expect(m.by_concern_level).toEqual({});
      expect(m.by_monitoring_level).toEqual({});
    });
    it("counts high_concern", () => { expect(computeInternetUsageMetrics([makeRecord({ concern_level: "high" })]).high_concern_count).toBe(1); });
    it("counts safeguarding_referral", () => { expect(computeInternetUsageMetrics([makeRecord({ concern_level: "safeguarding_referral" })]).safeguarding_referral_count).toBe(1); });
    it("counts no_monitoring", () => { expect(computeInternetUsageMetrics([makeRecord({ monitoring_level: "none" })]).no_monitoring_count).toBe(1); });
    it("counts social_media", () => { expect(computeInternetUsageMetrics([makeRecord({ usage_purpose: "social_media" })]).social_media_count).toBe(1); });
    it("returns 100% boolean rates with defaults", () => { 
      const m = computeInternetUsageMetrics([makeRecord()]);
      expect(m.parental_controls_rate).toBe(100);
      expect(m.age_appropriate_rate).toBe(100);
      expect(m.screen_time_within_limits_rate).toBe(100);
      expect(m.privacy_settings_rate).toBe(100);
      expect(m.social_media_reviewed_rate).toBe(100);
      expect(m.contact_list_rate).toBe(100);
      expect(m.online_safety_discussed_rate).toBe(100);
      expect(m.digital_literacy_rate).toBe(100);
      expect(m.consent_current_rate).toBe(100);
      expect(m.care_plan_linked_rate).toBe(100);
      expect(m.social_worker_informed_rate).toBe(100);
      expect(m.recorded_promptly_rate).toBe(100);
    });
    it("parental_controls_rate 0 when false", () => { expect(computeInternetUsageMetrics([makeRecord({ parental_controls_active: false })]).parental_controls_rate).toBe(0); });
    it("mixed boolean rate", () => { const m = computeInternetUsageMetrics([makeRecord({ parental_controls_active: true }), makeRecord({ parental_controls_active: false }), makeRecord({ parental_controls_active: true })]); expect(m.parental_controls_rate).toBe(66.7); });
    it("average_screen_time single", () => { expect(computeInternetUsageMetrics([makeRecord({ screen_time_minutes: 90 })]).average_screen_time).toBe(90); });
    it("average_screen_time multi", () => { expect(computeInternetUsageMetrics([makeRecord({ screen_time_minutes: 60 }), makeRecord({ screen_time_minutes: 120 })]).average_screen_time).toBe(90); });
    it("unique_children distinct", () => { const m = computeInternetUsageMetrics([makeRecord({ child_name: "A" }), makeRecord({ child_name: "B" }), makeRecord({ child_name: "A" })]); expect(m.unique_children).toBe(2); });
    it("counts all 10 device types", () => { const types = ["personal_phone","provided_phone","tablet","laptop","desktop","gaming_console","smart_tv","shared_device","smart_watch","other"] as const; const records = types.map(t => makeRecord({ device_type: t })); const m = computeInternetUsageMetrics(records); for (const t of types) expect(m.by_device_type[t]).toBe(1); });
    it("counts all 10 usage purposes", () => { const purposes = ["education","social_media","gaming","streaming","communication","creative","research","shopping","news","other"] as const; const records = purposes.map(p => makeRecord({ usage_purpose: p })); const m = computeInternetUsageMetrics(records); for (const p of purposes) expect(m.by_usage_purpose[p]).toBe(1); });
    it("counts all 5 concern levels", () => { const levels = ["no_concerns","low","medium","high","safeguarding_referral"] as const; const records = levels.map(l => makeRecord({ concern_level: l })); const m = computeInternetUsageMetrics(records); for (const l of levels) expect(m.by_concern_level[l]).toBe(1); });
    it("counts all 5 monitoring levels", () => { const levels = ["full_monitoring","periodic_checks","self_reported","minimal","none"] as const; const records = levels.map(l => makeRecord({ monitoring_level: l })); const m = computeInternetUsageMetrics(records); for (const l of levels) expect(m.by_monitoring_level[l]).toBe(1); });
  });

  describe("identifyInternetUsageAlerts", () => {
    it("returns empty for clean", () => { expect(identifyInternetUsageAlerts([makeRecord()])).toEqual([]); });
    it("returns empty for empty", () => { expect(identifyInternetUsageAlerts([])).toEqual([]); });
    it("fires safeguarding_referral", () => { 
      const a = identifyInternetUsageAlerts([makeRecord({ concern_level: "safeguarding_referral", child_name: "Jo" })]);
      expect(a[0].type).toBe("safeguarding_referral");
      expect(a[0].severity).toBe("critical");
      expect(a[0].message).toContain("Jo");
    });
    it("safeguarding_referral per-record", () => { const a = identifyInternetUsageAlerts([makeRecord({ id: "a-1", concern_level: "safeguarding_referral" }), makeRecord({ id: "a-2", concern_level: "safeguarding_referral" })]); expect(a.filter(x => x.type === "safeguarding_referral")).toHaveLength(2); });
    it("fires no_parental_controls singular", () => { 
      const a = identifyInternetUsageAlerts([makeRecord({ parental_controls_active: false })]);
      const f = a.find(x => x.type === "no_parental_controls");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 device has");
    });
    it("no_parental_controls plural", () => { const a = identifyInternetUsageAlerts([makeRecord({ parental_controls_active: false }), makeRecord({ parental_controls_active: false })]); const f = a.find(x => x.type === "no_parental_controls"); expect(f!.message).toContain("2 devices have"); });
    it("fires safety_not_discussed singular", () => { 
      const a = identifyInternetUsageAlerts([makeRecord({ online_safety_discussed: false })]);
      const f = a.find(x => x.type === "safety_not_discussed");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 monitoring check has");
    });
    it("safety_not_discussed plural", () => { const a = identifyInternetUsageAlerts([makeRecord({ online_safety_discussed: false }), makeRecord({ online_safety_discussed: false })]); const f = a.find(x => x.type === "safety_not_discussed"); expect(f!.message).toContain("2 monitoring checks have"); });
    it("privacy_not_checked not for 1", () => { expect(identifyInternetUsageAlerts([makeRecord({ privacy_settings_checked: false })]).find(x => x.type === "privacy_not_checked")).toBeUndefined(); });
    it("privacy_not_checked fires for 2", () => { const a = identifyInternetUsageAlerts([makeRecord({ privacy_settings_checked: false }), makeRecord({ privacy_settings_checked: false })]); expect(a.find(x => x.type === "privacy_not_checked")).toBeDefined(); });
    it("screen_time_exceeded not for 1", () => { expect(identifyInternetUsageAlerts([makeRecord({ screen_time_within_limits: false })]).find(x => x.type === "screen_time_exceeded")).toBeUndefined(); });
    it("screen_time_exceeded fires for 2", () => { const a = identifyInternetUsageAlerts([makeRecord({ screen_time_within_limits: false }), makeRecord({ screen_time_within_limits: false })]); expect(a.find(x => x.type === "screen_time_exceeded")).toBeDefined(); });
    it("fires all applicable", () => { 
      const a = identifyInternetUsageAlerts([makeRecord({ concern_level: "safeguarding_referral", parental_controls_active: false, online_safety_discussed: false, privacy_settings_checked: false, screen_time_within_limits: false }), makeRecord({ privacy_settings_checked: false, screen_time_within_limits: false })]);
      const types = a.map(x => x.type);
      expect(types).toContain("safeguarding_referral");
      expect(types).toContain("no_parental_controls");
      expect(types).toContain("safety_not_discussed");
      expect(types).toContain("privacy_not_checked");
      expect(types).toContain("screen_time_exceeded");
    });
  });
});
