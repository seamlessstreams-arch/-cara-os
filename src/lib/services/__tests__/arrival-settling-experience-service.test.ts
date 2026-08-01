import { describe, it, expect } from "vitest";
import { _testing, type ArrivalSettlingExperienceRecord } from "../arrival-settling-experience-service";

const { computeArrivalSettlingMetrics, identifyArrivalSettlingAlerts } = _testing;

const now = new Date(new Date().toISOString().split("T")[0]);

function makeRecord(overrides?: Partial<ArrivalSettlingExperienceRecord>): ArrivalSettlingExperienceRecord {
  return {
    id: overrides?.id ?? "a-1", home_id: overrides?.home_id ?? "home-1",
    arrival_stage: overrides?.arrival_stage ?? "first_day_welcome",
    settling_quality: overrides?.settling_quality ?? "settled_well",
    welcome_assessment: overrides?.welcome_assessment ?? "good",
    comfort_level: overrides?.comfort_level ?? "comfortable",
    session_date: overrides?.session_date ?? now.toISOString().split("T")[0],
    child_name: overrides?.child_name ?? "Child A",
    child_id: "child_id" in (overrides ?? {}) ? (overrides!.child_id ?? null) : null,
    supported_by: overrides?.supported_by ?? "Staff A",
    room_prepared: overrides?.room_prepared ?? true,
    personal_items_respected: overrides?.personal_items_respected ?? true,
    child_preferences_asked: overrides?.child_preferences_asked ?? true,
    tour_provided: overrides?.tour_provided ?? true,
    peer_introductions_made: overrides?.peer_introductions_made ?? true,
    key_worker_assigned: overrides?.key_worker_assigned ?? true,
    care_plan_reflects: overrides?.care_plan_reflects ?? true,
    social_worker_informed: overrides?.social_worker_informed ?? true,
    parent_informed: overrides?.parent_informed ?? true,
    emergency_contacts_confirmed: overrides?.emergency_contacts_confirmed ?? true,
    dietary_needs_checked: overrides?.dietary_needs_checked ?? true,
    recorded_promptly: overrides?.recorded_promptly ?? true,
    issues_found: overrides?.issues_found ?? [], actions_taken: overrides?.actions_taken ?? [],
    next_review_date: "next_review_date" in (overrides ?? {}) ? (overrides!.next_review_date ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: overrides?.created_at ?? now.toISOString(), updated_at: overrides?.updated_at ?? now.toISOString(),
  };
}

describe("arrival-settling-experience-service", () => {
  describe("computeArrivalSettlingMetrics", () => {
    it("returns zeros for empty", () => { 
      const m = computeArrivalSettlingMetrics([]);
      expect(m.total_reviews).toBe(0);;
      expect(m.distressed_count).toBe(0);
      expect(m.poor_welcome_count).toBe(0);
      expect(m.uncomfortable_count).toBe(0);
      expect(m.unsettled_count).toBe(0);
      expect(m.room_prepared_rate).toBeNull();;
      expect(m.unique_children).toBe(0);
    });
    it("returns empty breakdowns", () => { 
      const m = computeArrivalSettlingMetrics([]);
      expect(m.by_arrival_stage).toEqual({});
      expect(m.by_settling_quality).toEqual({});
      expect(m.by_welcome_assessment).toEqual({});
      expect(m.by_comfort_level).toEqual({});
    });
    it("total_reviews counts records", () => { expect(computeArrivalSettlingMetrics([makeRecord(), makeRecord()]).total_reviews).toBe(2); });
    it("counts very_distressed", () => { expect(computeArrivalSettlingMetrics([makeRecord({ settling_quality: "very_distressed" })]).distressed_count).toBe(1); });
    it("does not count unsettled as distressed", () => { expect(computeArrivalSettlingMetrics([makeRecord({ settling_quality: "unsettled" })]).distressed_count).toBe(0); });
    it("counts poor as poor_welcome", () => { expect(computeArrivalSettlingMetrics([makeRecord({ welcome_assessment: "poor" })]).poor_welcome_count).toBe(1); });
    it("counts not_provided as poor_welcome", () => { expect(computeArrivalSettlingMetrics([makeRecord({ welcome_assessment: "not_provided" })]).poor_welcome_count).toBe(1); });
    it("does not count adequate as poor_welcome", () => { expect(computeArrivalSettlingMetrics([makeRecord({ welcome_assessment: "adequate" })]).poor_welcome_count).toBe(0); });
    it("counts uncomfortable", () => { expect(computeArrivalSettlingMetrics([makeRecord({ comfort_level: "uncomfortable" })]).uncomfortable_count).toBe(1); });
    it("counts very_uncomfortable", () => { expect(computeArrivalSettlingMetrics([makeRecord({ comfort_level: "very_uncomfortable" })]).uncomfortable_count).toBe(1); });
    it("does not count neutral as uncomfortable", () => { expect(computeArrivalSettlingMetrics([makeRecord({ comfort_level: "neutral" })]).uncomfortable_count).toBe(0); });
    it("counts unsettled as unsettled", () => { expect(computeArrivalSettlingMetrics([makeRecord({ settling_quality: "unsettled" })]).unsettled_count).toBe(1); });
    it("counts very_distressed as unsettled", () => { expect(computeArrivalSettlingMetrics([makeRecord({ settling_quality: "very_distressed" })]).unsettled_count).toBe(1); });
    it("returns 100% boolean rates with defaults", () => { 
      const m = computeArrivalSettlingMetrics([makeRecord()]);
      expect(m.room_prepared_rate).toBe(100);
      expect(m.personal_items_rate).toBe(100);
      expect(m.preferences_asked_rate).toBe(100);
      expect(m.tour_rate).toBe(100);
      expect(m.peer_introductions_rate).toBe(100);
      expect(m.key_worker_rate).toBe(100);
      expect(m.care_plan_rate).toBe(100);
      expect(m.social_worker_rate).toBe(100);
      expect(m.parent_informed_rate).toBe(100);
      expect(m.emergency_contacts_rate).toBe(100);
      expect(m.dietary_needs_rate).toBe(100);
      expect(m.recorded_promptly_rate).toBe(100);
    });
    it("room_prepared_rate 0 when false", () => { expect(computeArrivalSettlingMetrics([makeRecord({ room_prepared: false })]).room_prepared_rate).toBe(0); });
    it("mixed boolean rate", () => { const m = computeArrivalSettlingMetrics([makeRecord({ tour_provided: true }), makeRecord({ tour_provided: false }), makeRecord({ tour_provided: true })]); expect(m.tour_rate).toBe(66.7); });
    it("unique_children distinct", () => { const m = computeArrivalSettlingMetrics([makeRecord({ child_name: "A" }), makeRecord({ child_name: "B" }), makeRecord({ child_name: "A" })]); expect(m.unique_children).toBe(2); });
    it("counts all 10 arrival stages", () => { const stages = ["pre_arrival_planning","first_day_welcome","first_week_review","two_week_check","one_month_review","three_month_review","ongoing_monitoring","peer_introduction","family_visit_arranged","other"] as const; const records = stages.map(s => makeRecord({ arrival_stage: s })); const m = computeArrivalSettlingMetrics(records); for (const s of stages) expect(m.by_arrival_stage[s]).toBe(1); });
    it("counts all 5 settling qualities", () => { const qualities = ["settled_well","mostly_settled","adjusting","unsettled","very_distressed"] as const; const records = qualities.map(q => makeRecord({ settling_quality: q })); const m = computeArrivalSettlingMetrics(records); for (const q of qualities) expect(m.by_settling_quality[q]).toBe(1); });
    it("counts all 5 welcome assessments", () => { const assessments = ["excellent","good","adequate","poor","not_provided"] as const; const records = assessments.map(a => makeRecord({ welcome_assessment: a })); const m = computeArrivalSettlingMetrics(records); for (const a of assessments) expect(m.by_welcome_assessment[a]).toBe(1); });
    it("counts all 5 comfort levels", () => { const levels = ["very_comfortable","comfortable","neutral","uncomfortable","very_uncomfortable"] as const; const records = levels.map(l => makeRecord({ comfort_level: l })); const m = computeArrivalSettlingMetrics(records); for (const l of levels) expect(m.by_comfort_level[l]).toBe(1); });
  });

  describe("identifyArrivalSettlingAlerts", () => {
    it("returns empty for clean", () => { expect(identifyArrivalSettlingAlerts([makeRecord()])).toEqual([]); });
    it("returns empty for empty", () => { expect(identifyArrivalSettlingAlerts([])).toEqual([]); });
    it("fires distressed_poor_welcome", () => { 
      const a = identifyArrivalSettlingAlerts([makeRecord({ settling_quality: "very_distressed", welcome_assessment: "poor", child_name: "Jo" })]);
      expect(a[0].type).toBe("distressed_poor_welcome");
      expect(a[0].severity).toBe("critical");
      expect(a[0].message).toContain("Jo");
    });
    it("distressed with not_provided also critical", () => { const a = identifyArrivalSettlingAlerts([makeRecord({ settling_quality: "very_distressed", welcome_assessment: "not_provided" })]); expect(a[0].type).toBe("distressed_poor_welcome"); expect(a[0].severity).toBe("critical"); });
    it("distressed_poor_welcome per-record", () => { const a = identifyArrivalSettlingAlerts([makeRecord({ id: "a-1", settling_quality: "very_distressed", welcome_assessment: "poor" }), makeRecord({ id: "a-2", settling_quality: "very_distressed", welcome_assessment: "not_provided" })]); expect(a.filter(x => x.type === "distressed_poor_welcome")).toHaveLength(2); });
    it("distressed without poor no critical", () => { expect(identifyArrivalSettlingAlerts([makeRecord({ settling_quality: "very_distressed", welcome_assessment: "good" })]).find(x => x.type === "distressed_poor_welcome")).toBeUndefined(); });
    it("poor without distressed no critical", () => { expect(identifyArrivalSettlingAlerts([makeRecord({ welcome_assessment: "poor", settling_quality: "settled_well" })]).find(x => x.type === "distressed_poor_welcome")).toBeUndefined(); });
    it("fires no_room_prepared singular", () => { 
      const a = identifyArrivalSettlingAlerts([makeRecord({ room_prepared: false })]);
      const f = a.find(x => x.type === "no_room_prepared");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 review has");
    });
    it("no_room_prepared plural", () => { const a = identifyArrivalSettlingAlerts([makeRecord({ room_prepared: false }), makeRecord({ room_prepared: false })]); const f = a.find(x => x.type === "no_room_prepared"); expect(f!.message).toContain("2 reviews have"); });
    it("fires no_key_worker singular", () => { 
      const a = identifyArrivalSettlingAlerts([makeRecord({ key_worker_assigned: false })]);
      const f = a.find(x => x.type === "no_key_worker");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 review has");
    });
    it("no_preferences_asked not for 1", () => { expect(identifyArrivalSettlingAlerts([makeRecord({ child_preferences_asked: false })]).find(x => x.type === "no_preferences_asked")).toBeUndefined(); });
    it("no_preferences_asked fires for 2", () => { const a = identifyArrivalSettlingAlerts([makeRecord({ child_preferences_asked: false }), makeRecord({ child_preferences_asked: false })]); expect(a.find(x => x.type === "no_preferences_asked")).toBeDefined(); expect(a.find(x => x.type === "no_preferences_asked")!.severity).toBe("medium"); });
    it("no_peer_introductions not for 1", () => { expect(identifyArrivalSettlingAlerts([makeRecord({ peer_introductions_made: false })]).find(x => x.type === "no_peer_introductions")).toBeUndefined(); });
    it("no_peer_introductions fires for 2", () => { const a = identifyArrivalSettlingAlerts([makeRecord({ peer_introductions_made: false }), makeRecord({ peer_introductions_made: false })]); expect(a.find(x => x.type === "no_peer_introductions")).toBeDefined(); expect(a.find(x => x.type === "no_peer_introductions")!.severity).toBe("medium"); });
    it("fires all applicable", () => { 
      const a = identifyArrivalSettlingAlerts([makeRecord({ settling_quality: "very_distressed", welcome_assessment: "poor", room_prepared: false, key_worker_assigned: false, child_preferences_asked: false, peer_introductions_made: false }), makeRecord({ room_prepared: false, key_worker_assigned: false, child_preferences_asked: false, peer_introductions_made: false })]);
      const types = a.map(x => x.type);
      expect(types).toContain("distressed_poor_welcome");
      expect(types).toContain("no_room_prepared");
      expect(types).toContain("no_key_worker");
      expect(types).toContain("no_preferences_asked");
      expect(types).toContain("no_peer_introductions");
    });
  });
});
