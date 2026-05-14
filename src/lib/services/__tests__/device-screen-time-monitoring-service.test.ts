import { describe, it, expect } from "vitest";
import { _testing, type DeviceScreenTimeMonitoringRecord } from "../device-screen-time-monitoring-service";

const { computeDeviceScreenTimeMetrics, identifyDeviceScreenTimeAlerts } = _testing;

const now = new Date(new Date().toISOString().split("T")[0]);

function makeRecord(overrides?: Partial<DeviceScreenTimeMonitoringRecord>): DeviceScreenTimeMonitoringRecord {
  return {
    id: overrides?.id ?? "a-1", home_id: overrides?.home_id ?? "home-1",
    device_type: overrides?.device_type ?? "smartphone",
    usage_category: overrides?.usage_category ?? "educational",
    compliance_level: overrides?.compliance_level ?? "fully_compliant",
    wellbeing_impact: overrides?.wellbeing_impact ?? "neutral",
    monitoring_date: overrides?.monitoring_date ?? now.toISOString().split("T")[0],
    child_name: overrides?.child_name ?? "Child A",
    child_id: "child_id" in (overrides ?? {}) ? (overrides!.child_id ?? null) : null,
    monitored_by: overrides?.monitored_by ?? "Staff A",
    limits_agreed: overrides?.limits_agreed ?? true,
    age_appropriate_content: overrides?.age_appropriate_content ?? true,
    parental_controls_active: overrides?.parental_controls_active ?? true,
    night_time_limits: overrides?.night_time_limits ?? true,
    social_media_supervised: overrides?.social_media_supervised ?? true,
    privacy_settings_checked: overrides?.privacy_settings_checked ?? true,
    care_plan_reflects: overrides?.care_plan_reflects ?? true,
    social_worker_informed: overrides?.social_worker_informed ?? true,
    parent_informed: overrides?.parent_informed ?? true,
    online_safety_discussed: overrides?.online_safety_discussed ?? true,
    healthy_alternatives_offered: overrides?.healthy_alternatives_offered ?? true,
    recorded_promptly: overrides?.recorded_promptly ?? true,
    issues_found: overrides?.issues_found ?? [], actions_taken: overrides?.actions_taken ?? [],
    next_review_date: "next_review_date" in (overrides ?? {}) ? (overrides!.next_review_date ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: overrides?.created_at ?? now.toISOString(), updated_at: overrides?.updated_at ?? now.toISOString(),
  };
}

describe("device-screen-time-monitoring-service", () => {
  describe("computeDeviceScreenTimeMetrics", () => {
    it("returns zeros for empty", () => { const m = computeDeviceScreenTimeMetrics([]); expect(m.total_checks).toBe(0); expect(m.non_compliant_count).toBe(0); expect(m.refused_count).toBe(0); expect(m.inappropriate_count).toBe(0); expect(m.significant_concern_count).toBe(0); expect(m.limits_agreed_rate).toBe(0); expect(m.unique_children).toBe(0); });
    it("returns empty breakdowns", () => { const m = computeDeviceScreenTimeMetrics([]); expect(m.by_device_type).toEqual({}); expect(m.by_usage_category).toEqual({}); expect(m.by_compliance_level).toEqual({}); expect(m.by_wellbeing_impact).toEqual({}); });
    it("total_checks counts records", () => { expect(computeDeviceScreenTimeMetrics([makeRecord(), makeRecord()]).total_checks).toBe(2); });
    it("counts non_compliant", () => { expect(computeDeviceScreenTimeMetrics([makeRecord({ compliance_level: "non_compliant" })]).non_compliant_count).toBe(1); });
    it("counts refused", () => { expect(computeDeviceScreenTimeMetrics([makeRecord({ compliance_level: "refused_limits" })]).refused_count).toBe(1); });
    it("does not count partially as non_compliant", () => { expect(computeDeviceScreenTimeMetrics([makeRecord({ compliance_level: "partially_compliant" })]).non_compliant_count).toBe(0); });
    it("counts inappropriate", () => { expect(computeDeviceScreenTimeMetrics([makeRecord({ usage_category: "inappropriate" })]).inappropriate_count).toBe(1); });
    it("counts significant_concern", () => { expect(computeDeviceScreenTimeMetrics([makeRecord({ wellbeing_impact: "significant_concern" })]).significant_concern_count).toBe(1); });
    it("does not count moderate as significant", () => { expect(computeDeviceScreenTimeMetrics([makeRecord({ wellbeing_impact: "moderate_concern" })]).significant_concern_count).toBe(0); });
    it("returns 100% boolean rates with defaults", () => { const m = computeDeviceScreenTimeMetrics([makeRecord()]); expect(m.limits_agreed_rate).toBe(100); expect(m.age_appropriate_rate).toBe(100); expect(m.parental_controls_rate).toBe(100); expect(m.night_time_limits_rate).toBe(100); expect(m.social_media_supervised_rate).toBe(100); expect(m.privacy_settings_rate).toBe(100); expect(m.care_plan_rate).toBe(100); expect(m.social_worker_rate).toBe(100); expect(m.parent_informed_rate).toBe(100); expect(m.online_safety_rate).toBe(100); expect(m.healthy_alternatives_rate).toBe(100); expect(m.recorded_promptly_rate).toBe(100); });
    it("limits_agreed_rate 0 when false", () => { expect(computeDeviceScreenTimeMetrics([makeRecord({ limits_agreed: false })]).limits_agreed_rate).toBe(0); });
    it("mixed boolean rate", () => { const m = computeDeviceScreenTimeMetrics([makeRecord({ parental_controls_active: true }), makeRecord({ parental_controls_active: false }), makeRecord({ parental_controls_active: true })]); expect(m.parental_controls_rate).toBe(66.7); });
    it("unique_children distinct", () => { const m = computeDeviceScreenTimeMetrics([makeRecord({ child_name: "A" }), makeRecord({ child_name: "B" }), makeRecord({ child_name: "A" })]); expect(m.unique_children).toBe(2); });
    it("counts all 10 device types", () => { const types = ["smartphone","tablet","laptop","desktop","games_console","smart_tv","smart_speaker","wearable","shared_device","other"] as const; const records = types.map(t => makeRecord({ device_type: t })); const m = computeDeviceScreenTimeMetrics(records); for (const t of types) expect(m.by_device_type[t]).toBe(1); });
    it("counts all 10 usage categories", () => { const cats = ["educational","social_media","gaming","streaming","communication","creative","browsing","mixed","inappropriate","other"] as const; const records = cats.map(c => makeRecord({ usage_category: c })); const m = computeDeviceScreenTimeMetrics(records); for (const c of cats) expect(m.by_usage_category[c]).toBe(1); });
    it("counts all 5 compliance levels", () => { const levels = ["fully_compliant","mostly_compliant","partially_compliant","non_compliant","refused_limits"] as const; const records = levels.map(l => makeRecord({ compliance_level: l })); const m = computeDeviceScreenTimeMetrics(records); for (const l of levels) expect(m.by_compliance_level[l]).toBe(1); });
    it("counts all 5 wellbeing impacts", () => { const impacts = ["positive","neutral","mild_concern","moderate_concern","significant_concern"] as const; const records = impacts.map(i => makeRecord({ wellbeing_impact: i })); const m = computeDeviceScreenTimeMetrics(records); for (const i of impacts) expect(m.by_wellbeing_impact[i]).toBe(1); });
  });

  describe("identifyDeviceScreenTimeAlerts", () => {
    it("returns empty for clean", () => { expect(identifyDeviceScreenTimeAlerts([makeRecord()])).toEqual([]); });
    it("returns empty for empty", () => { expect(identifyDeviceScreenTimeAlerts([])).toEqual([]); });
    it("fires inappropriate_significant_concern", () => { const a = identifyDeviceScreenTimeAlerts([makeRecord({ usage_category: "inappropriate", wellbeing_impact: "significant_concern", child_name: "Jo" })]); expect(a[0].type).toBe("inappropriate_significant_concern"); expect(a[0].severity).toBe("critical"); expect(a[0].message).toContain("Jo"); });
    it("inappropriate_significant_concern per-record", () => { const a = identifyDeviceScreenTimeAlerts([makeRecord({ id: "a-1", usage_category: "inappropriate", wellbeing_impact: "significant_concern" }), makeRecord({ id: "a-2", usage_category: "inappropriate", wellbeing_impact: "significant_concern" })]); expect(a.filter(x => x.type === "inappropriate_significant_concern")).toHaveLength(2); });
    it("inappropriate with neutral no critical", () => { expect(identifyDeviceScreenTimeAlerts([makeRecord({ usage_category: "inappropriate", wellbeing_impact: "neutral" })]).find(x => x.type === "inappropriate_significant_concern")).toBeUndefined(); });
    it("educational with concern no critical", () => { expect(identifyDeviceScreenTimeAlerts([makeRecord({ usage_category: "educational", wellbeing_impact: "significant_concern" })]).find(x => x.type === "inappropriate_significant_concern")).toBeUndefined(); });
    it("fires no_parental_controls singular", () => { const a = identifyDeviceScreenTimeAlerts([makeRecord({ parental_controls_active: false })]); const f = a.find(x => x.type === "no_parental_controls"); expect(f).toBeDefined(); expect(f!.severity).toBe("high"); expect(f!.message).toContain("1 device has"); });
    it("no_parental_controls plural", () => { const a = identifyDeviceScreenTimeAlerts([makeRecord({ parental_controls_active: false }), makeRecord({ parental_controls_active: false })]); const f = a.find(x => x.type === "no_parental_controls"); expect(f!.message).toContain("2 devices have"); });
    it("fires no_night_limits singular", () => { const a = identifyDeviceScreenTimeAlerts([makeRecord({ night_time_limits: false })]); const f = a.find(x => x.type === "no_night_limits"); expect(f).toBeDefined(); expect(f!.severity).toBe("high"); expect(f!.message).toContain("1 check has"); });
    it("no_online_safety_discussion not for 1", () => { expect(identifyDeviceScreenTimeAlerts([makeRecord({ online_safety_discussed: false })]).find(x => x.type === "no_online_safety_discussion")).toBeUndefined(); });
    it("no_online_safety_discussion fires for 2", () => { const a = identifyDeviceScreenTimeAlerts([makeRecord({ online_safety_discussed: false }), makeRecord({ online_safety_discussed: false })]); expect(a.find(x => x.type === "no_online_safety_discussion")).toBeDefined(); expect(a.find(x => x.type === "no_online_safety_discussion")!.severity).toBe("medium"); });
    it("no_privacy_settings not for 1", () => { expect(identifyDeviceScreenTimeAlerts([makeRecord({ privacy_settings_checked: false })]).find(x => x.type === "no_privacy_settings")).toBeUndefined(); });
    it("no_privacy_settings fires for 2", () => { const a = identifyDeviceScreenTimeAlerts([makeRecord({ privacy_settings_checked: false }), makeRecord({ privacy_settings_checked: false })]); expect(a.find(x => x.type === "no_privacy_settings")).toBeDefined(); expect(a.find(x => x.type === "no_privacy_settings")!.severity).toBe("medium"); });
    it("fires all applicable", () => { const a = identifyDeviceScreenTimeAlerts([makeRecord({ usage_category: "inappropriate", wellbeing_impact: "significant_concern", parental_controls_active: false, night_time_limits: false, online_safety_discussed: false, privacy_settings_checked: false }), makeRecord({ parental_controls_active: false, night_time_limits: false, online_safety_discussed: false, privacy_settings_checked: false })]); const types = a.map(x => x.type); expect(types).toContain("inappropriate_significant_concern"); expect(types).toContain("no_parental_controls"); expect(types).toContain("no_night_limits"); expect(types).toContain("no_online_safety_discussion"); expect(types).toContain("no_privacy_settings"); });
  });
});
