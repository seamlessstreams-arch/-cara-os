import { describe, it, expect } from "vitest";
import { _testing, type ChildDigitalWellbeingRecord } from "../child-digital-wellbeing-service";
import { todayStr } from "@/lib/utils";

const { computeChildDigitalWellbeingMetrics, identifyChildDigitalWellbeingAlerts } = _testing;

const now = new Date(todayStr());

function makeRecord(overrides?: Partial<ChildDigitalWellbeingRecord>): ChildDigitalWellbeingRecord {
  return {
    id: "a-1", home_id: "home-1",
    device_type: "smartphone",
    online_safety_rating: "good",
    screen_time_compliance: "within_guidelines",
    digital_literacy_level: "competent",
    assessment_date: todayStr(),
    child_name: "Child A",
    child_id: "child_id" in (overrides ?? {}) ? (overrides!.child_id ?? null) : null,
    assessed_by: "Staff A",
    parental_controls_active: true,
    age_appropriate_content: true,
    online_safety_educated: true,
    cyberbullying_screened: true,
    social_media_monitored: true,
    gaming_monitored: true,
    privacy_settings_reviewed: true,
    digital_agreement_signed: true,
    care_plan_reflects: true,
    screen_time_discussed: true,
    sleep_impact_assessed: true,
    recorded_promptly: true,
    issues_found: [], actions_taken: [],
    next_review_date: "next_review_date" in (overrides ?? {}) ? (overrides!.next_review_date ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: now.toISOString(), updated_at: now.toISOString(),
      // Overrides win last: an explicit null stays null — the old
    // `overrides?.x ?? default` fabricated answers inside the factory.
    ...overrides,
  };
}

describe("child-digital-wellbeing-service", () => {
  describe("computeChildDigitalWellbeingMetrics", () => {
    it("returns zeros for empty", () => { 
      const m = computeChildDigitalWellbeingMetrics([]);
      expect(m.total_assessments).toBe(0);;
      expect(m.poor_safety_count).toBe(0);
      expect(m.unsafe_safety_count).toBe(0);
      expect(m.excessive_screen_count).toBe(0);
      expect(m.not_monitored_count).toBe(0);
      expect(m.parental_controls_rate).toBeNull();;
      expect(m.unique_children).toBe(0);
    });
    it("returns empty breakdowns", () => { 
      const m = computeChildDigitalWellbeingMetrics([]);
      expect(m.by_device_type).toEqual({});
      expect(m.by_online_safety_rating).toEqual({});
      expect(m.by_screen_time_compliance).toEqual({});
      expect(m.by_digital_literacy_level).toEqual({});
    });
    it("total_assessments counts records", () => { expect(computeChildDigitalWellbeingMetrics([makeRecord(), makeRecord()]).total_assessments).toBe(2); });
    it("counts poor_safety", () => { expect(computeChildDigitalWellbeingMetrics([makeRecord({ online_safety_rating: "poor" })]).poor_safety_count).toBe(1); });
    it("counts unsafe_safety", () => { expect(computeChildDigitalWellbeingMetrics([makeRecord({ online_safety_rating: "unsafe" })]).unsafe_safety_count).toBe(1); });
    it("does not count adequate as poor", () => { expect(computeChildDigitalWellbeingMetrics([makeRecord({ online_safety_rating: "adequate" })]).poor_safety_count).toBe(0); });
    it("counts excessive_screen", () => { expect(computeChildDigitalWellbeingMetrics([makeRecord({ screen_time_compliance: "excessive" })]).excessive_screen_count).toBe(1); });
    it("counts not_monitored", () => { expect(computeChildDigitalWellbeingMetrics([makeRecord({ screen_time_compliance: "not_monitored" })]).not_monitored_count).toBe(1); });
    it("returns 100% boolean rates with defaults", () => { 
      const m = computeChildDigitalWellbeingMetrics([makeRecord()]);
      expect(m.parental_controls_rate).toBe(100);
      expect(m.age_appropriate_rate).toBe(100);
      expect(m.online_safety_educated_rate).toBe(100);
      expect(m.cyberbullying_screened_rate).toBe(100);
      expect(m.social_media_rate).toBe(100);
      expect(m.gaming_monitored_rate).toBe(100);
      expect(m.privacy_settings_rate).toBe(100);
      expect(m.digital_agreement_rate).toBe(100);
      expect(m.care_plan_rate).toBe(100);
      expect(m.screen_time_discussed_rate).toBe(100);
      expect(m.sleep_impact_rate).toBe(100);
      expect(m.recorded_promptly_rate).toBe(100);
    });
    it("parental_controls_rate 0 when false", () => { expect(computeChildDigitalWellbeingMetrics([makeRecord({ parental_controls_active: false })]).parental_controls_rate).toBe(0); });
    it("mixed boolean rate", () => { const m = computeChildDigitalWellbeingMetrics([makeRecord({ cyberbullying_screened: true }), makeRecord({ cyberbullying_screened: false }), makeRecord({ cyberbullying_screened: true })]); expect(m.cyberbullying_screened_rate).toBe(66.7); });
    it("unique_children distinct", () => { const m = computeChildDigitalWellbeingMetrics([makeRecord({ child_name: "A" }), makeRecord({ child_name: "B" }), makeRecord({ child_name: "A" })]); expect(m.unique_children).toBe(2); });
    it("counts all 10 device types", () => { const types = ["smartphone","tablet","laptop","desktop","gaming_console","smart_tv","smart_speaker","wearable","shared_device","other"] as const; const records = types.map(t => makeRecord({ device_type: t })); const m = computeChildDigitalWellbeingMetrics(records); for (const t of types) expect(m.by_device_type[t]).toBe(1); });
    it("counts all 5 online safety ratings", () => { const ratings = ["excellent","good","adequate","poor","unsafe"] as const; const records = ratings.map(r => makeRecord({ online_safety_rating: r })); const m = computeChildDigitalWellbeingMetrics(records); for (const r of ratings) expect(m.by_online_safety_rating[r]).toBe(1); });
    it("counts all 5 screen time compliances", () => { const compliances = ["within_guidelines","slightly_over","significantly_over","excessive","not_monitored"] as const; const records = compliances.map(c => makeRecord({ screen_time_compliance: c })); const m = computeChildDigitalWellbeingMetrics(records); for (const c of compliances) expect(m.by_screen_time_compliance[c]).toBe(1); });
    it("counts all 5 digital literacy levels", () => { const levels = ["advanced","competent","developing","basic","not_assessed"] as const; const records = levels.map(l => makeRecord({ digital_literacy_level: l })); const m = computeChildDigitalWellbeingMetrics(records); for (const l of levels) expect(m.by_digital_literacy_level[l]).toBe(1); });
  });

  describe("identifyChildDigitalWellbeingAlerts", () => {
    it("returns empty for clean", () => { expect(identifyChildDigitalWellbeingAlerts([makeRecord()])).toEqual([]); });
    it("returns empty for empty", () => { expect(identifyChildDigitalWellbeingAlerts([])).toEqual([]); });
    it("fires unsafe_no_controls", () => { 
      const a = identifyChildDigitalWellbeingAlerts([makeRecord({ online_safety_rating: "unsafe", parental_controls_active: false, child_name: "Jo", device_type: "tablet" })]);
      expect(a[0].type).toBe("unsafe_no_controls");
      expect(a[0].severity).toBe("critical");
      expect(a[0].message).toContain("Jo");
      expect(a[0].message).toContain("tablet");
    });
    it("unsafe_no_controls per-record", () => { const a = identifyChildDigitalWellbeingAlerts([makeRecord({ id: "a-1", online_safety_rating: "unsafe", parental_controls_active: false }), makeRecord({ id: "a-2", online_safety_rating: "unsafe", parental_controls_active: false })]); expect(a.filter(x => x.type === "unsafe_no_controls")).toHaveLength(2); });
    it("unsafe with controls no critical alert", () => { expect(identifyChildDigitalWellbeingAlerts([makeRecord({ online_safety_rating: "unsafe", parental_controls_active: true })]).find(x => x.type === "unsafe_no_controls")).toBeUndefined(); });
    it("poor without controls no critical alert", () => { expect(identifyChildDigitalWellbeingAlerts([makeRecord({ online_safety_rating: "poor", parental_controls_active: false })]).find(x => x.type === "unsafe_no_controls")).toBeUndefined(); });
    it("fires cyberbullying_not_screened singular", () => { 
      const a = identifyChildDigitalWellbeingAlerts([makeRecord({ cyberbullying_screened: false })]);
      const f = a.find(x => x.type === "cyberbullying_not_screened");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 assessment has");
    });
    it("cyberbullying_not_screened plural", () => { const a = identifyChildDigitalWellbeingAlerts([makeRecord({ cyberbullying_screened: false }), makeRecord({ cyberbullying_screened: false })]); const f = a.find(x => x.type === "cyberbullying_not_screened"); expect(f!.message).toContain("2 assessments have"); });
    it("fires online_safety_not_educated singular", () => { 
      const a = identifyChildDigitalWellbeingAlerts([makeRecord({ online_safety_educated: false })]);
      const f = a.find(x => x.type === "online_safety_not_educated");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 assessment shows");
    });
    it("online_safety_not_educated plural", () => { const a = identifyChildDigitalWellbeingAlerts([makeRecord({ online_safety_educated: false }), makeRecord({ online_safety_educated: false })]); const f = a.find(x => x.type === "online_safety_not_educated"); expect(f!.message).toContain("2 assessments show"); });
    it("social_media_not_monitored not for 1", () => { expect(identifyChildDigitalWellbeingAlerts([makeRecord({ social_media_monitored: false })]).find(x => x.type === "social_media_not_monitored")).toBeUndefined(); });
    it("social_media_not_monitored fires for 2", () => { const a = identifyChildDigitalWellbeingAlerts([makeRecord({ social_media_monitored: false }), makeRecord({ social_media_monitored: false })]); expect(a.find(x => x.type === "social_media_not_monitored")).toBeDefined(); expect(a.find(x => x.type === "social_media_not_monitored")!.severity).toBe("medium"); });
    it("sleep_impact_not_assessed not for 1", () => { expect(identifyChildDigitalWellbeingAlerts([makeRecord({ sleep_impact_assessed: false })]).find(x => x.type === "sleep_impact_not_assessed")).toBeUndefined(); });
    it("sleep_impact_not_assessed fires for 2", () => { const a = identifyChildDigitalWellbeingAlerts([makeRecord({ sleep_impact_assessed: false }), makeRecord({ sleep_impact_assessed: false })]); expect(a.find(x => x.type === "sleep_impact_not_assessed")).toBeDefined(); expect(a.find(x => x.type === "sleep_impact_not_assessed")!.severity).toBe("medium"); });
    it("fires all applicable", () => { 
      const a = identifyChildDigitalWellbeingAlerts([makeRecord({ online_safety_rating: "unsafe", parental_controls_active: false, cyberbullying_screened: false, online_safety_educated: false, social_media_monitored: false, sleep_impact_assessed: false }), makeRecord({ cyberbullying_screened: false, online_safety_educated: false, social_media_monitored: false, sleep_impact_assessed: false })]);
      const types = a.map(x => x.type);
      expect(types).toContain("unsafe_no_controls");
      expect(types).toContain("cyberbullying_not_screened");
      expect(types).toContain("online_safety_not_educated");
      expect(types).toContain("social_media_not_monitored");
      expect(types).toContain("sleep_impact_not_assessed");
    });
  });
});

// ── Tri-state (promotion kit): an unanswered question is neither yes nor breach ──
describe("tri-state judgements", () => {
  it("does not count an unrecorded cyberbullying_screened as a failure", () => {
    const alerts = _testing.identifyChildDigitalWellbeingAlerts([makeRecord({ cyberbullying_screened: null })]);
    expect(alerts.some((a) => /cyberbullying/i.test(a.message))).toBe(false);
  });
  it("still counts a recorded failure", () => {
    const alerts = _testing.identifyChildDigitalWellbeingAlerts([makeRecord({ cyberbullying_screened: false })]);
    expect(alerts.some((a) => /cyberbullying/i.test(a.message))).toBe(true);
  });
});
