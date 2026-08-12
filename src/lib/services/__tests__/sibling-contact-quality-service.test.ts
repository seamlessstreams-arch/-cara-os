import { describe, it, expect } from "vitest";
import { _testing, type SiblingContactQualityRecord } from "../sibling-contact-quality-service";
import { todayStr } from "@/lib/utils";

const { computeSiblingContactMetrics, identifySiblingContactAlerts } = _testing;

const now = new Date(todayStr());

function makeRecord(overrides?: Partial<SiblingContactQualityRecord>): SiblingContactQualityRecord {
  return {
    id: overrides?.id ?? "a-1", home_id: overrides?.home_id ?? "home-1",
    contact_type: overrides?.contact_type ?? "face_to_face",
    contact_quality: overrides?.contact_quality ?? "good",
    sibling_relationship: overrides?.sibling_relationship ?? "close",
    barrier_type: overrides?.barrier_type ?? "none",
    contact_date: overrides?.contact_date ?? todayStr(),
    child_name: overrides?.child_name ?? "Child A",
    child_id: "child_id" in (overrides ?? {}) ? (overrides!.child_id ?? null) : null,
    sibling_name: overrides?.sibling_name ?? "Sibling A",
    facilitated_by: overrides?.facilitated_by ?? "Staff A",
    child_views_sought: overrides?.child_views_sought ?? true,
    sibling_views_sought: overrides?.sibling_views_sought ?? true,
    preparation_completed: overrides?.preparation_completed ?? true,
    debrief_completed: overrides?.debrief_completed ?? true,
    emotional_support_given: overrides?.emotional_support_given ?? true,
    social_worker_informed: overrides?.social_worker_informed ?? true,
    care_plan_reflects: overrides?.care_plan_reflects ?? true,
    frequency_appropriate: overrides?.frequency_appropriate ?? true,
    venue_suitable: overrides?.venue_suitable ?? true,
    safeguarding_considered: overrides?.safeguarding_considered ?? true,
    life_story_linked: overrides?.life_story_linked ?? true,
    recorded_promptly: overrides?.recorded_promptly ?? true,
    issues_found: overrides?.issues_found ?? [], actions_taken: overrides?.actions_taken ?? [],
    next_review_date: "next_review_date" in (overrides ?? {}) ? (overrides!.next_review_date ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: overrides?.created_at ?? now.toISOString(), updated_at: overrides?.updated_at ?? now.toISOString(),
  };
}

describe("sibling-contact-quality-service", () => {
  describe("computeSiblingContactMetrics", () => {
    it("returns zeros for empty", () => { 
      const m = computeSiblingContactMetrics([]);
      expect(m.total_contacts).toBe(0);;
      expect(m.poor_quality_count).toBe(0);
      expect(m.harmful_count).toBe(0);
      expect(m.estranged_count).toBe(0);
      expect(m.barrier_count).toBe(0);
      expect(m.child_views_rate).toBeNull();;
      expect(m.unique_children).toBe(0);
    });
    it("returns empty breakdowns", () => { 
      const m = computeSiblingContactMetrics([]);
      expect(m.by_contact_type).toEqual({});
      expect(m.by_contact_quality).toEqual({});
      expect(m.by_sibling_relationship).toEqual({});
      expect(m.by_barrier_type).toEqual({});
    });
    it("total_contacts counts records", () => { expect(computeSiblingContactMetrics([makeRecord(), makeRecord()]).total_contacts).toBe(2); });
    it("counts poor_quality", () => { expect(computeSiblingContactMetrics([makeRecord({ contact_quality: "poor" })]).poor_quality_count).toBe(1); });
    it("counts harmful", () => { expect(computeSiblingContactMetrics([makeRecord({ contact_quality: "harmful" })]).harmful_count).toBe(1); });
    it("does not count adequate as poor", () => { expect(computeSiblingContactMetrics([makeRecord({ contact_quality: "adequate" })]).poor_quality_count).toBe(0); });
    it("counts estranged", () => { expect(computeSiblingContactMetrics([makeRecord({ sibling_relationship: "estranged" })]).estranged_count).toBe(1); });
    it("counts barriers (not none)", () => { expect(computeSiblingContactMetrics([makeRecord({ barrier_type: "geographical_distance" })]).barrier_count).toBe(1); });
    it("no barrier when none", () => { expect(computeSiblingContactMetrics([makeRecord({ barrier_type: "none" })]).barrier_count).toBe(0); });
    it("returns 100% boolean rates with defaults", () => { 
      const m = computeSiblingContactMetrics([makeRecord()]);
      expect(m.child_views_rate).toBe(100);
      expect(m.sibling_views_rate).toBe(100);
      expect(m.preparation_rate).toBe(100);
      expect(m.debrief_rate).toBe(100);
      expect(m.emotional_support_rate).toBe(100);
      expect(m.social_worker_rate).toBe(100);
      expect(m.care_plan_rate).toBe(100);
      expect(m.frequency_rate).toBe(100);
      expect(m.venue_rate).toBe(100);
      expect(m.safeguarding_rate).toBe(100);
      expect(m.life_story_rate).toBe(100);
      expect(m.recorded_promptly_rate).toBe(100);
    });
    it("child_views_rate 0 when false", () => { expect(computeSiblingContactMetrics([makeRecord({ child_views_sought: false })]).child_views_rate).toBe(0); });
    it("mixed boolean rate", () => { const m = computeSiblingContactMetrics([makeRecord({ debrief_completed: true }), makeRecord({ debrief_completed: false }), makeRecord({ debrief_completed: true })]); expect(m.debrief_rate).toBe(66.7); });
    it("unique_children distinct", () => { const m = computeSiblingContactMetrics([makeRecord({ child_name: "A" }), makeRecord({ child_name: "B" }), makeRecord({ child_name: "A" })]); expect(m.unique_children).toBe(2); });
    it("counts all 10 contact types", () => { const types = ["face_to_face","video_call","phone_call","letter_card","shared_activity","overnight_stay","holiday_together","school_event","supervised_contact","other"] as const; const records = types.map(t => makeRecord({ contact_type: t })); const m = computeSiblingContactMetrics(records); for (const t of types) expect(m.by_contact_type[t]).toBe(1); });
    it("counts all 5 contact qualities", () => { const qualities = ["excellent","good","adequate","poor","harmful"] as const; const records = qualities.map(q => makeRecord({ contact_quality: q })); const m = computeSiblingContactMetrics(records); for (const q of qualities) expect(m.by_contact_quality[q]).toBe(1); });
    it("counts all 5 sibling relationships", () => { const relationships = ["very_close","close","developing","distant","estranged"] as const; const records = relationships.map(r => makeRecord({ sibling_relationship: r })); const m = computeSiblingContactMetrics(records); for (const r of relationships) expect(m.by_sibling_relationship[r]).toBe(1); });
    it("counts all 10 barrier types", () => { const barriers = ["none","geographical_distance","safeguarding_concern","court_restriction","placement_instability","sibling_refusal","child_refusal","resource_limitation","scheduling_conflict","other"] as const; const records = barriers.map(b => makeRecord({ barrier_type: b })); const m = computeSiblingContactMetrics(records); for (const b of barriers) expect(m.by_barrier_type[b]).toBe(1); });
  });

  describe("identifySiblingContactAlerts", () => {
    it("returns empty for clean", () => { expect(identifySiblingContactAlerts([makeRecord()])).toEqual([]); });
    it("returns empty for empty", () => { expect(identifySiblingContactAlerts([])).toEqual([]); });
    it("fires harmful_estranged", () => { 
      const a = identifySiblingContactAlerts([makeRecord({ contact_quality: "harmful", sibling_relationship: "estranged", child_name: "Jo", sibling_name: "Sam" })]);
      expect(a[0].type).toBe("harmful_estranged");
      expect(a[0].severity).toBe("critical");
      expect(a[0].message).toContain("Jo");
      expect(a[0].message).toContain("Sam");
    });
    it("harmful_estranged per-record", () => { const a = identifySiblingContactAlerts([makeRecord({ id: "a-1", contact_quality: "harmful", sibling_relationship: "estranged" }), makeRecord({ id: "a-2", contact_quality: "harmful", sibling_relationship: "estranged" })]); expect(a.filter(x => x.type === "harmful_estranged")).toHaveLength(2); });
    it("harmful with close no critical", () => { expect(identifySiblingContactAlerts([makeRecord({ contact_quality: "harmful", sibling_relationship: "close" })]).find(x => x.type === "harmful_estranged")).toBeUndefined(); });
    it("good with estranged no critical", () => { expect(identifySiblingContactAlerts([makeRecord({ contact_quality: "good", sibling_relationship: "estranged" })]).find(x => x.type === "harmful_estranged")).toBeUndefined(); });
    it("fires debrief_not_completed singular", () => { 
      const a = identifySiblingContactAlerts([makeRecord({ debrief_completed: false })]);
      const f = a.find(x => x.type === "debrief_not_completed");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 contact has");
    });
    it("debrief_not_completed plural", () => { const a = identifySiblingContactAlerts([makeRecord({ debrief_completed: false }), makeRecord({ debrief_completed: false })]); const f = a.find(x => x.type === "debrief_not_completed"); expect(f!.message).toContain("2 contacts have"); });
    it("fires preparation_not_completed singular", () => { 
      const a = identifySiblingContactAlerts([makeRecord({ preparation_completed: false })]);
      const f = a.find(x => x.type === "preparation_not_completed");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 contact has");
    });
    it("no_emotional_support not for 1", () => { expect(identifySiblingContactAlerts([makeRecord({ emotional_support_given: false })]).find(x => x.type === "no_emotional_support")).toBeUndefined(); });
    it("no_emotional_support fires for 2", () => { const a = identifySiblingContactAlerts([makeRecord({ emotional_support_given: false }), makeRecord({ emotional_support_given: false })]); expect(a.find(x => x.type === "no_emotional_support")).toBeDefined(); expect(a.find(x => x.type === "no_emotional_support")!.severity).toBe("medium"); });
    it("life_story_not_linked not for 1", () => { expect(identifySiblingContactAlerts([makeRecord({ life_story_linked: false })]).find(x => x.type === "life_story_not_linked")).toBeUndefined(); });
    it("life_story_not_linked fires for 2", () => { const a = identifySiblingContactAlerts([makeRecord({ life_story_linked: false }), makeRecord({ life_story_linked: false })]); expect(a.find(x => x.type === "life_story_not_linked")).toBeDefined(); expect(a.find(x => x.type === "life_story_not_linked")!.severity).toBe("medium"); });
    it("fires all applicable", () => { 
      const a = identifySiblingContactAlerts([makeRecord({ contact_quality: "harmful", sibling_relationship: "estranged", debrief_completed: false, preparation_completed: false, emotional_support_given: false, life_story_linked: false }), makeRecord({ debrief_completed: false, preparation_completed: false, emotional_support_given: false, life_story_linked: false })]);
      const types = a.map(x => x.type);
      expect(types).toContain("harmful_estranged");
      expect(types).toContain("debrief_not_completed");
      expect(types).toContain("preparation_not_completed");
      expect(types).toContain("no_emotional_support");
      expect(types).toContain("life_story_not_linked");
    });
  });
});
