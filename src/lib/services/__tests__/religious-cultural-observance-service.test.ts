import { describe, it, expect } from "vitest";
import { _testing, type ReligiousCulturalObservanceRecord } from "../religious-cultural-observance-service";

const { computeReligiousCulturalMetrics, identifyReligiousCulturalAlerts } = _testing;

const now = new Date(new Date().toISOString().split("T")[0]);

function makeRecord(overrides?: Partial<ReligiousCulturalObservanceRecord>): ReligiousCulturalObservanceRecord {
  return {
    id: overrides?.id ?? "a-1", home_id: overrides?.home_id ?? "home-1",
    observance_type: overrides?.observance_type ?? "daily_prayer",
    accommodation_level: overrides?.accommodation_level ?? "fully_accommodated",
    cultural_sensitivity: overrides?.cultural_sensitivity ?? "good",
    staff_competence: overrides?.staff_competence ?? "competent",
    observance_date: overrides?.observance_date ?? now.toISOString().split("T")[0],
    child_name: overrides?.child_name ?? "Child A",
    child_id: "child_id" in (overrides ?? {}) ? (overrides!.child_id ?? null) : null,
    supported_by: overrides?.supported_by ?? "Staff A",
    child_views_sought: overrides?.child_views_sought ?? true,
    family_consulted: overrides?.family_consulted ?? true,
    dietary_needs_met: overrides?.dietary_needs_met ?? true,
    resources_provided: overrides?.resources_provided ?? true,
    community_links_used: overrides?.community_links_used ?? true,
    staff_trained: overrides?.staff_trained ?? true,
    care_plan_reflects: overrides?.care_plan_reflects ?? true,
    social_worker_informed: overrides?.social_worker_informed ?? true,
    respectful_approach: overrides?.respectful_approach ?? true,
    celebration_supported: overrides?.celebration_supported ?? true,
    discrimination_addressed: overrides?.discrimination_addressed ?? true,
    recorded_promptly: overrides?.recorded_promptly ?? true,
    issues_found: overrides?.issues_found ?? [], actions_taken: overrides?.actions_taken ?? [],
    next_review_date: "next_review_date" in (overrides ?? {}) ? (overrides!.next_review_date ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: overrides?.created_at ?? now.toISOString(), updated_at: overrides?.updated_at ?? now.toISOString(),
  };
}

describe("religious-cultural-observance-service", () => {
  describe("computeReligiousCulturalMetrics", () => {
    it("returns zeros for empty", () => { 
      const m = computeReligiousCulturalMetrics([]);
      expect(m.total_observances).toBe(0);;
      expect(m.not_accommodated_count).toBe(0);
      expect(m.poorly_accommodated_count).toBe(0);
      expect(m.poor_sensitivity_count).toBe(0);
      expect(m.unaware_count).toBe(0);
      expect(m.child_views_rate).toBeNull();;
      expect(m.unique_children).toBe(0);
    });
    it("returns empty breakdowns", () => { 
      const m = computeReligiousCulturalMetrics([]);
      expect(m.by_observance_type).toEqual({});
      expect(m.by_accommodation_level).toEqual({});
      expect(m.by_cultural_sensitivity).toEqual({});
      expect(m.by_staff_competence).toEqual({});
    });
    it("total_observances counts records", () => { expect(computeReligiousCulturalMetrics([makeRecord(), makeRecord()]).total_observances).toBe(2); });
    it("counts not_accommodated", () => { expect(computeReligiousCulturalMetrics([makeRecord({ accommodation_level: "not_accommodated" })]).not_accommodated_count).toBe(1); });
    it("counts poorly_accommodated", () => { expect(computeReligiousCulturalMetrics([makeRecord({ accommodation_level: "poorly_accommodated" })]).poorly_accommodated_count).toBe(1); });
    it("does not count partially as not_accommodated", () => { expect(computeReligiousCulturalMetrics([makeRecord({ accommodation_level: "partially_accommodated" })]).not_accommodated_count).toBe(0); });
    it("counts poor_sensitivity", () => { expect(computeReligiousCulturalMetrics([makeRecord({ cultural_sensitivity: "poor" })]).poor_sensitivity_count).toBe(1); });
    it("counts unaware", () => { expect(computeReligiousCulturalMetrics([makeRecord({ cultural_sensitivity: "unaware" })]).unaware_count).toBe(1); });
    it("returns 100% boolean rates with defaults", () => { 
      const m = computeReligiousCulturalMetrics([makeRecord()]);
      expect(m.child_views_rate).toBe(100);
      expect(m.family_consulted_rate).toBe(100);
      expect(m.dietary_needs_rate).toBe(100);
      expect(m.resources_rate).toBe(100);
      expect(m.community_links_rate).toBe(100);
      expect(m.staff_trained_rate).toBe(100);
      expect(m.care_plan_rate).toBe(100);
      expect(m.social_worker_rate).toBe(100);
      expect(m.respectful_rate).toBe(100);
      expect(m.celebration_rate).toBe(100);
      expect(m.discrimination_rate).toBe(100);
      expect(m.recorded_promptly_rate).toBe(100);
    });
    it("child_views_rate 0 when false", () => { expect(computeReligiousCulturalMetrics([makeRecord({ child_views_sought: false })]).child_views_rate).toBe(0); });
    it("mixed boolean rate", () => { const m = computeReligiousCulturalMetrics([makeRecord({ family_consulted: true }), makeRecord({ family_consulted: false }), makeRecord({ family_consulted: true })]); expect(m.family_consulted_rate).toBe(66.7); });
    it("unique_children distinct", () => { const m = computeReligiousCulturalMetrics([makeRecord({ child_name: "A" }), makeRecord({ child_name: "B" }), makeRecord({ child_name: "A" })]); expect(m.unique_children).toBe(2); });
    it("counts all 10 observance types", () => { const types = ["daily_prayer","weekly_worship","religious_festival","cultural_celebration","dietary_requirement","dress_code","language_support","heritage_activity","community_connection","other"] as const; const records = types.map(t => makeRecord({ observance_type: t })); const m = computeReligiousCulturalMetrics(records); for (const t of types) expect(m.by_observance_type[t]).toBe(1); });
    it("counts all 5 accommodation levels", () => { const levels = ["fully_accommodated","mostly_accommodated","partially_accommodated","poorly_accommodated","not_accommodated"] as const; const records = levels.map(l => makeRecord({ accommodation_level: l })); const m = computeReligiousCulturalMetrics(records); for (const l of levels) expect(m.by_accommodation_level[l]).toBe(1); });
    it("counts all 5 cultural sensitivities", () => { const sensitivities = ["excellent","good","adequate","poor","unaware"] as const; const records = sensitivities.map(s => makeRecord({ cultural_sensitivity: s })); const m = computeReligiousCulturalMetrics(records); for (const s of sensitivities) expect(m.by_cultural_sensitivity[s]).toBe(1); });
    it("counts all 5 staff competences", () => { const competences = ["highly_competent","competent","developing","limited","not_assessed"] as const; const records = competences.map(c => makeRecord({ staff_competence: c })); const m = computeReligiousCulturalMetrics(records); for (const c of competences) expect(m.by_staff_competence[c]).toBe(1); });
  });

  describe("identifyReligiousCulturalAlerts", () => {
    it("returns empty for clean", () => { expect(identifyReligiousCulturalAlerts([makeRecord()])).toEqual([]); });
    it("returns empty for empty", () => { expect(identifyReligiousCulturalAlerts([])).toEqual([]); });
    it("fires not_accommodated_unaware", () => { 
      const a = identifyReligiousCulturalAlerts([makeRecord({ accommodation_level: "not_accommodated", cultural_sensitivity: "unaware", child_name: "Jo" })]);
      expect(a[0].type).toBe("not_accommodated_unaware");
      expect(a[0].severity).toBe("critical");
      expect(a[0].message).toContain("Jo");
    });
    it("not_accommodated_unaware per-record", () => { const a = identifyReligiousCulturalAlerts([makeRecord({ id: "a-1", accommodation_level: "not_accommodated", cultural_sensitivity: "unaware" }), makeRecord({ id: "a-2", accommodation_level: "not_accommodated", cultural_sensitivity: "unaware" })]); expect(a.filter(x => x.type === "not_accommodated_unaware")).toHaveLength(2); });
    it("not_accommodated with good sensitivity no critical", () => { expect(identifyReligiousCulturalAlerts([makeRecord({ accommodation_level: "not_accommodated", cultural_sensitivity: "good" })]).find(x => x.type === "not_accommodated_unaware")).toBeUndefined(); });
    it("fully_accommodated with unaware no critical", () => { expect(identifyReligiousCulturalAlerts([makeRecord({ accommodation_level: "fully_accommodated", cultural_sensitivity: "unaware" })]).find(x => x.type === "not_accommodated_unaware")).toBeUndefined(); });
    it("fires dietary_needs_not_met singular", () => { 
      const a = identifyReligiousCulturalAlerts([makeRecord({ dietary_needs_met: false })]);
      const f = a.find(x => x.type === "dietary_needs_not_met");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 observance has");
    });
    it("dietary_needs_not_met plural", () => { const a = identifyReligiousCulturalAlerts([makeRecord({ dietary_needs_met: false }), makeRecord({ dietary_needs_met: false })]); const f = a.find(x => x.type === "dietary_needs_not_met"); expect(f!.message).toContain("2 observances have"); });
    it("fires family_not_consulted singular", () => { 
      const a = identifyReligiousCulturalAlerts([makeRecord({ family_consulted: false })]);
      const f = a.find(x => x.type === "family_not_consulted");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 observance has");
    });
    it("staff_not_trained not for 1", () => { expect(identifyReligiousCulturalAlerts([makeRecord({ staff_trained: false })]).find(x => x.type === "staff_not_trained")).toBeUndefined(); });
    it("staff_not_trained fires for 2", () => { const a = identifyReligiousCulturalAlerts([makeRecord({ staff_trained: false }), makeRecord({ staff_trained: false })]); expect(a.find(x => x.type === "staff_not_trained")).toBeDefined(); expect(a.find(x => x.type === "staff_not_trained")!.severity).toBe("medium"); });
    it("community_links_not_used not for 1", () => { expect(identifyReligiousCulturalAlerts([makeRecord({ community_links_used: false })]).find(x => x.type === "community_links_not_used")).toBeUndefined(); });
    it("community_links_not_used fires for 2", () => { const a = identifyReligiousCulturalAlerts([makeRecord({ community_links_used: false }), makeRecord({ community_links_used: false })]); expect(a.find(x => x.type === "community_links_not_used")).toBeDefined(); expect(a.find(x => x.type === "community_links_not_used")!.severity).toBe("medium"); });
    it("fires all applicable", () => { 
      const a = identifyReligiousCulturalAlerts([makeRecord({ accommodation_level: "not_accommodated", cultural_sensitivity: "unaware", dietary_needs_met: false, family_consulted: false, staff_trained: false, community_links_used: false }), makeRecord({ dietary_needs_met: false, family_consulted: false, staff_trained: false, community_links_used: false })]);
      const types = a.map(x => x.type);
      expect(types).toContain("not_accommodated_unaware");
      expect(types).toContain("dietary_needs_not_met");
      expect(types).toContain("family_not_consulted");
      expect(types).toContain("staff_not_trained");
      expect(types).toContain("community_links_not_used");
    });
  });
});
