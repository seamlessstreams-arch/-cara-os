import { describe, it, expect } from "vitest";
import { _testing, type FaithSpiritualObservanceRecord } from "../faith-spiritual-observance-service";
import { todayStr } from "@/lib/utils";

const { computeFaithSpiritualMetrics, identifyFaithSpiritualAlerts } = _testing;

const now = new Date(todayStr());

function makeRecord(overrides?: Partial<FaithSpiritualObservanceRecord>): FaithSpiritualObservanceRecord {
  return {
    id: "a-1", home_id: "home-1",
    observance_type: "place_of_worship",
    support_level: "well_supported",
    child_engagement: "engaged",
    cultural_sensitivity: "good",
    session_date: todayStr(),
    child_name: "Child A",
    child_id: "child_id" in (overrides ?? {}) ? (overrides!.child_id ?? null) : null,
    supported_by: "Staff A",
    child_wishes_respected: true,
    dietary_needs_met: true,
    attendance_facilitated: true,
    resources_provided: true,
    care_plan_reflects: true,
    social_worker_informed: true,
    parent_informed: true,
    cultural_awareness_shown: true,
    privacy_respected: true,
    peer_understanding_promoted: true,
    festivals_acknowledged: true,
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

describe("faith-spiritual-observance-service", () => {
  describe("computeFaithSpiritualMetrics", () => {
    it("returns zeros for empty", () => { 
      const m = computeFaithSpiritualMetrics([]);
      expect(m.total_sessions).toBe(0);;
      expect(m.not_supported_count).toBe(0);
      expect(m.disengaged_count).toBe(0);
      expect(m.poor_sensitivity_count).toBe(0);
      expect(m.insensitive_count).toBe(0);
      expect(m.child_wishes_rate).toBeNull();;
      expect(m.unique_children).toBe(0);
    });
    it("returns empty breakdowns", () => { 
      const m = computeFaithSpiritualMetrics([]);
      expect(m.by_observance_type).toEqual({});
      expect(m.by_support_level).toEqual({});
      expect(m.by_child_engagement).toEqual({});
      expect(m.by_cultural_sensitivity).toEqual({});
    });
    it("total_sessions counts records", () => { expect(computeFaithSpiritualMetrics([makeRecord(), makeRecord()]).total_sessions).toBe(2); });
    it("counts not_supported", () => { expect(computeFaithSpiritualMetrics([makeRecord({ support_level: "not_supported" })]).not_supported_count).toBe(1); });
    it("does not count poorly as not_supported", () => { expect(computeFaithSpiritualMetrics([makeRecord({ support_level: "poorly_supported" })]).not_supported_count).toBe(0); });
    it("counts disengaged", () => { expect(computeFaithSpiritualMetrics([makeRecord({ child_engagement: "disengaged" })]).disengaged_count).toBe(1); });
    it("counts refused as disengaged", () => { expect(computeFaithSpiritualMetrics([makeRecord({ child_engagement: "refused" })]).disengaged_count).toBe(1); });
    it("does not count partially as disengaged", () => { expect(computeFaithSpiritualMetrics([makeRecord({ child_engagement: "partially_engaged" })]).disengaged_count).toBe(0); });
    it("counts poor as poor_sensitivity", () => { expect(computeFaithSpiritualMetrics([makeRecord({ cultural_sensitivity: "poor" })]).poor_sensitivity_count).toBe(1); });
    it("counts insensitive as poor_sensitivity", () => { expect(computeFaithSpiritualMetrics([makeRecord({ cultural_sensitivity: "insensitive" })]).poor_sensitivity_count).toBe(1); });
    it("does not count adequate as poor_sensitivity", () => { expect(computeFaithSpiritualMetrics([makeRecord({ cultural_sensitivity: "adequate" })]).poor_sensitivity_count).toBe(0); });
    it("counts insensitive", () => { expect(computeFaithSpiritualMetrics([makeRecord({ cultural_sensitivity: "insensitive" })]).insensitive_count).toBe(1); });
    it("does not count poor as insensitive", () => { expect(computeFaithSpiritualMetrics([makeRecord({ cultural_sensitivity: "poor" })]).insensitive_count).toBe(0); });
    it("returns 100% boolean rates with defaults", () => { 
      const m = computeFaithSpiritualMetrics([makeRecord()]);
      expect(m.child_wishes_rate).toBe(100);
      expect(m.dietary_needs_rate).toBe(100);
      expect(m.attendance_rate).toBe(100);
      expect(m.resources_rate).toBe(100);
      expect(m.care_plan_rate).toBe(100);
      expect(m.social_worker_rate).toBe(100);
      expect(m.parent_informed_rate).toBe(100);
      expect(m.cultural_awareness_rate).toBe(100);
      expect(m.privacy_rate).toBe(100);
      expect(m.peer_understanding_rate).toBe(100);
      expect(m.festivals_rate).toBe(100);
      expect(m.recorded_promptly_rate).toBe(100);
    });
    it("child_wishes_rate 0 when false", () => { expect(computeFaithSpiritualMetrics([makeRecord({ child_wishes_respected: false })]).child_wishes_rate).toBe(0); });
    it("mixed boolean rate", () => { const m = computeFaithSpiritualMetrics([makeRecord({ attendance_facilitated: true }), makeRecord({ attendance_facilitated: false }), makeRecord({ attendance_facilitated: true })]); expect(m.attendance_rate).toBe(66.7); });
    it("unique_children distinct", () => { const m = computeFaithSpiritualMetrics([makeRecord({ child_name: "A" }), makeRecord({ child_name: "B" }), makeRecord({ child_name: "A" })]); expect(m.unique_children).toBe(2); });
    it("counts all 10 observance types", () => { const types = ["place_of_worship","prayer_meditation","festival_celebration","dietary_observance","religious_education","spiritual_counselling","faith_community_link","sacred_text_study","ritual_ceremony","other"] as const; const records = types.map(t => makeRecord({ observance_type: t })); const m = computeFaithSpiritualMetrics(records); for (const t of types) expect(m.by_observance_type[t]).toBe(1); });
    it("counts all 5 support levels", () => { const levels = ["fully_supported","well_supported","partially_supported","poorly_supported","not_supported"] as const; const records = levels.map(l => makeRecord({ support_level: l })); const m = computeFaithSpiritualMetrics(records); for (const l of levels) expect(m.by_support_level[l]).toBe(1); });
    it("counts all 5 child engagements", () => { const levels = ["highly_engaged","engaged","partially_engaged","disengaged","refused"] as const; const records = levels.map(l => makeRecord({ child_engagement: l })); const m = computeFaithSpiritualMetrics(records); for (const l of levels) expect(m.by_child_engagement[l]).toBe(1); });
    it("counts all 5 cultural sensitivities", () => { const levels = ["excellent","good","adequate","poor","insensitive"] as const; const records = levels.map(l => makeRecord({ cultural_sensitivity: l })); const m = computeFaithSpiritualMetrics(records); for (const l of levels) expect(m.by_cultural_sensitivity[l]).toBe(1); });
  });

  describe("identifyFaithSpiritualAlerts", () => {
    it("returns empty for clean", () => { expect(identifyFaithSpiritualAlerts([makeRecord()])).toEqual([]); });
    it("returns empty for empty", () => { expect(identifyFaithSpiritualAlerts([])).toEqual([]); });
    it("fires insensitive_not_supported", () => { 
      const a = identifyFaithSpiritualAlerts([makeRecord({ cultural_sensitivity: "insensitive", support_level: "not_supported", child_name: "Jo" })]);
      expect(a[0].type).toBe("insensitive_not_supported");
      expect(a[0].severity).toBe("critical");
      expect(a[0].message).toContain("Jo");
    });
    it("insensitive_not_supported per-record", () => { const a = identifyFaithSpiritualAlerts([makeRecord({ id: "a-1", cultural_sensitivity: "insensitive", support_level: "not_supported" }), makeRecord({ id: "a-2", cultural_sensitivity: "insensitive", support_level: "not_supported" })]); expect(a.filter(x => x.type === "insensitive_not_supported")).toHaveLength(2); });
    it("insensitive without not_supported no critical", () => { expect(identifyFaithSpiritualAlerts([makeRecord({ cultural_sensitivity: "insensitive", support_level: "well_supported" })]).find(x => x.type === "insensitive_not_supported")).toBeUndefined(); });
    it("not_supported without insensitive no critical", () => { expect(identifyFaithSpiritualAlerts([makeRecord({ support_level: "not_supported", cultural_sensitivity: "good" })]).find(x => x.type === "insensitive_not_supported")).toBeUndefined(); });
    it("fires wishes_not_respected singular", () => { 
      const a = identifyFaithSpiritualAlerts([makeRecord({ child_wishes_respected: false })]);
      const f = a.find(x => x.type === "wishes_not_respected");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 session has");
    });
    it("wishes_not_respected plural", () => { const a = identifyFaithSpiritualAlerts([makeRecord({ child_wishes_respected: false }), makeRecord({ child_wishes_respected: false })]); const f = a.find(x => x.type === "wishes_not_respected"); expect(f!.message).toContain("2 sessions have"); });
    it("fires attendance_not_facilitated singular", () => { 
      const a = identifyFaithSpiritualAlerts([makeRecord({ attendance_facilitated: false })]);
      const f = a.find(x => x.type === "attendance_not_facilitated");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 session has");
    });
    it("no_cultural_awareness not for 1", () => { expect(identifyFaithSpiritualAlerts([makeRecord({ cultural_awareness_shown: false })]).find(x => x.type === "no_cultural_awareness")).toBeUndefined(); });
    it("no_cultural_awareness fires for 2", () => { const a = identifyFaithSpiritualAlerts([makeRecord({ cultural_awareness_shown: false }), makeRecord({ cultural_awareness_shown: false })]); expect(a.find(x => x.type === "no_cultural_awareness")).toBeDefined(); expect(a.find(x => x.type === "no_cultural_awareness")!.severity).toBe("medium"); });
    it("festivals_not_acknowledged not for 1", () => { expect(identifyFaithSpiritualAlerts([makeRecord({ festivals_acknowledged: false })]).find(x => x.type === "festivals_not_acknowledged")).toBeUndefined(); });
    it("festivals_not_acknowledged fires for 2", () => { const a = identifyFaithSpiritualAlerts([makeRecord({ festivals_acknowledged: false }), makeRecord({ festivals_acknowledged: false })]); expect(a.find(x => x.type === "festivals_not_acknowledged")).toBeDefined(); expect(a.find(x => x.type === "festivals_not_acknowledged")!.severity).toBe("medium"); });
    it("fires all applicable", () => { 
      const a = identifyFaithSpiritualAlerts([makeRecord({ cultural_sensitivity: "insensitive", support_level: "not_supported", child_wishes_respected: false, attendance_facilitated: false, cultural_awareness_shown: false, festivals_acknowledged: false }), makeRecord({ child_wishes_respected: false, attendance_facilitated: false, cultural_awareness_shown: false, festivals_acknowledged: false })]);
      const types = a.map(x => x.type);
      expect(types).toContain("insensitive_not_supported");
      expect(types).toContain("wishes_not_respected");
      expect(types).toContain("attendance_not_facilitated");
      expect(types).toContain("no_cultural_awareness");
      expect(types).toContain("festivals_not_acknowledged");
    });
  });
});
