import { describe, it, expect } from "vitest";
import { _testing, type RoomSharingAssessmentRecord } from "../room-sharing-assessment-service";
import { todayStr } from "@/lib/utils";

const { computeRoomSharingMetrics, identifyRoomSharingAlerts } = _testing;

const now = new Date(todayStr());

function makeRecord(overrides?: Partial<RoomSharingAssessmentRecord>): RoomSharingAssessmentRecord {
  return {
    id: "a-1", home_id: "home-1",
    sharing_arrangement: "single_room",
    compatibility_rating: "highly_compatible",
    room_risk_level: "no_risk",
    review_frequency: "monthly",
    assessment_date: todayStr(),
    child_name: "Child A",
    child_id: "child_id" in (overrides ?? {}) ? (overrides!.child_id ?? null) : null,
    assessed_by: "Staff A",
    child_consent_obtained: true,
    child_views_sought: true,
    safeguarding_check_done: true,
    risk_assessment_current: true,
    age_appropriate: true,
    gender_appropriate: true,
    behaviour_history_considered: true,
    social_worker_consulted: true,
    parent_informed: true,
    care_plan_reflects: true,
    privacy_maintained: true,
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

describe("room-sharing-assessment-service", () => {
  describe("computeRoomSharingMetrics", () => {
    it("returns zeros for empty", () => { 
      const m = computeRoomSharingMetrics([]);
      expect(m.total_assessments).toBe(0);;
      expect(m.incompatible_count).toBe(0);
      expect(m.high_risk_count).toBe(0);
      expect(m.unacceptable_risk_count).toBe(0);
      expect(m.emergency_sharing_count).toBe(0);
      expect(m.child_consent_rate).toBeNull();;
      expect(m.unique_children).toBe(0);
    });
    it("returns empty breakdowns", () => { 
      const m = computeRoomSharingMetrics([]);
      expect(m.by_sharing_arrangement).toEqual({});
      expect(m.by_compatibility_rating).toEqual({});
      expect(m.by_room_risk_level).toEqual({});
      expect(m.by_review_frequency).toEqual({});
    });
    it("total_assessments counts records", () => { expect(computeRoomSharingMetrics([makeRecord(), makeRecord()]).total_assessments).toBe(2); });
    it("counts incompatible", () => { expect(computeRoomSharingMetrics([makeRecord({ compatibility_rating: "incompatible" })]).incompatible_count).toBe(1); });
    it("does not count manageable as incompatible", () => { expect(computeRoomSharingMetrics([makeRecord({ compatibility_rating: "manageable" })]).incompatible_count).toBe(0); });
    it("counts high_risk", () => { expect(computeRoomSharingMetrics([makeRecord({ room_risk_level: "high" })]).high_risk_count).toBe(1); });
    it("counts unacceptable_risk", () => { expect(computeRoomSharingMetrics([makeRecord({ room_risk_level: "unacceptable" })]).unacceptable_risk_count).toBe(1); });
    it("does not count high as unacceptable", () => { expect(computeRoomSharingMetrics([makeRecord({ room_risk_level: "high" })]).unacceptable_risk_count).toBe(0); });
    it("counts emergency_sharing", () => { expect(computeRoomSharingMetrics([makeRecord({ sharing_arrangement: "emergency_sharing" })]).emergency_sharing_count).toBe(1); });
    it("returns 100% boolean rates with defaults", () => { 
      const m = computeRoomSharingMetrics([makeRecord()]);
      expect(m.child_consent_rate).toBe(100);
      expect(m.child_views_rate).toBe(100);
      expect(m.safeguarding_check_rate).toBe(100);
      expect(m.risk_assessment_rate).toBe(100);
      expect(m.age_appropriate_rate).toBe(100);
      expect(m.gender_appropriate_rate).toBe(100);
      expect(m.behaviour_history_rate).toBe(100);
      expect(m.social_worker_rate).toBe(100);
      expect(m.parent_informed_rate).toBe(100);
      expect(m.care_plan_reflects_rate).toBe(100);
      expect(m.privacy_maintained_rate).toBe(100);
      expect(m.recorded_promptly_rate).toBe(100);
    });
    it("child_consent_rate 0 when false", () => { expect(computeRoomSharingMetrics([makeRecord({ child_consent_obtained: false })]).child_consent_rate).toBe(0); });
    it("mixed boolean rate", () => { const m = computeRoomSharingMetrics([makeRecord({ privacy_maintained: true }), makeRecord({ privacy_maintained: false }), makeRecord({ privacy_maintained: true })]); expect(m.privacy_maintained_rate).toBe(66.7); });
    it("unique_children distinct", () => { const m = computeRoomSharingMetrics([makeRecord({ child_name: "A" }), makeRecord({ child_name: "B" }), makeRecord({ child_name: "A" })]); expect(m.unique_children).toBe(2); });
    it("counts all 5 sharing arrangements", () => { const arrangements = ["single_room","shared_by_choice","shared_by_necessity","temporary_sharing","emergency_sharing"] as const; const records = arrangements.map(a => makeRecord({ sharing_arrangement: a })); const m = computeRoomSharingMetrics(records); for (const a of arrangements) expect(m.by_sharing_arrangement[a]).toBe(1); });
    it("counts all 5 compatibility ratings", () => { const ratings = ["highly_compatible","compatible","manageable","incompatible","not_assessed"] as const; const records = ratings.map(r => makeRecord({ compatibility_rating: r })); const m = computeRoomSharingMetrics(records); for (const r of ratings) expect(m.by_compatibility_rating[r]).toBe(1); });
    it("counts all 5 room risk levels", () => { const levels = ["no_risk","low","medium","high","unacceptable"] as const; const records = levels.map(l => makeRecord({ room_risk_level: l })); const m = computeRoomSharingMetrics(records); for (const l of levels) expect(m.by_room_risk_level[l]).toBe(1); });
    it("counts all 5 review frequencies", () => { const frequencies = ["weekly","fortnightly","monthly","quarterly","as_needed"] as const; const records = frequencies.map(f => makeRecord({ review_frequency: f })); const m = computeRoomSharingMetrics(records); for (const f of frequencies) expect(m.by_review_frequency[f]).toBe(1); });
  });

  describe("identifyRoomSharingAlerts", () => {
    it("returns empty for clean", () => { expect(identifyRoomSharingAlerts([makeRecord()])).toEqual([]); });
    it("returns empty for empty", () => { expect(identifyRoomSharingAlerts([])).toEqual([]); });
    it("fires unacceptable_no_safeguarding", () => { 
      const a = identifyRoomSharingAlerts([makeRecord({ room_risk_level: "unacceptable", safeguarding_check_done: false, child_name: "Jo" })]);
      expect(a[0].type).toBe("unacceptable_no_safeguarding");
      expect(a[0].severity).toBe("critical");
      expect(a[0].message).toContain("Jo");
    });
    it("unacceptable_no_safeguarding per-record", () => { const a = identifyRoomSharingAlerts([makeRecord({ id: "a-1", room_risk_level: "unacceptable", safeguarding_check_done: false }), makeRecord({ id: "a-2", room_risk_level: "unacceptable", safeguarding_check_done: false })]); expect(a.filter(x => x.type === "unacceptable_no_safeguarding")).toHaveLength(2); });
    it("unacceptable with safeguarding done no critical alert", () => { expect(identifyRoomSharingAlerts([makeRecord({ room_risk_level: "unacceptable", safeguarding_check_done: true })]).find(x => x.type === "unacceptable_no_safeguarding")).toBeUndefined(); });
    it("high risk without safeguarding no critical alert", () => { expect(identifyRoomSharingAlerts([makeRecord({ room_risk_level: "high", safeguarding_check_done: false })]).find(x => x.type === "unacceptable_no_safeguarding")).toBeUndefined(); });
    it("fires no_child_consent excluding single_room", () => { 
      const a = identifyRoomSharingAlerts([makeRecord({ sharing_arrangement: "shared_by_choice", child_consent_obtained: false })]);
      const f = a.find(x => x.type === "no_child_consent");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 room sharing arrangement has");
    });
    it("no_child_consent plural", () => { const a = identifyRoomSharingAlerts([makeRecord({ sharing_arrangement: "shared_by_choice", child_consent_obtained: false }), makeRecord({ sharing_arrangement: "temporary_sharing", child_consent_obtained: false })]); const f = a.find(x => x.type === "no_child_consent"); expect(f!.message).toContain("2 room sharing arrangements have"); });
    it("no_child_consent ignores single_room", () => { expect(identifyRoomSharingAlerts([makeRecord({ sharing_arrangement: "single_room", child_consent_obtained: false })]).find(x => x.type === "no_child_consent")).toBeUndefined(); });
    it("fires risk_assessment_outdated singular", () => { 
      const a = identifyRoomSharingAlerts([makeRecord({ risk_assessment_current: false })]);
      const f = a.find(x => x.type === "risk_assessment_outdated");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 assessment has");
    });
    it("risk_assessment_outdated plural", () => { const a = identifyRoomSharingAlerts([makeRecord({ risk_assessment_current: false }), makeRecord({ risk_assessment_current: false })]); const f = a.find(x => x.type === "risk_assessment_outdated"); expect(f!.message).toContain("2 assessments have"); });
    it("privacy_not_maintained not for 1", () => { expect(identifyRoomSharingAlerts([makeRecord({ privacy_maintained: false })]).find(x => x.type === "privacy_not_maintained")).toBeUndefined(); });
    it("privacy_not_maintained fires for 2", () => { const a = identifyRoomSharingAlerts([makeRecord({ privacy_maintained: false }), makeRecord({ privacy_maintained: false })]); expect(a.find(x => x.type === "privacy_not_maintained")).toBeDefined(); expect(a.find(x => x.type === "privacy_not_maintained")!.severity).toBe("medium"); });
    it("behaviour_not_considered not for 1", () => { expect(identifyRoomSharingAlerts([makeRecord({ behaviour_history_considered: false })]).find(x => x.type === "behaviour_not_considered")).toBeUndefined(); });
    it("behaviour_not_considered fires for 2", () => { const a = identifyRoomSharingAlerts([makeRecord({ behaviour_history_considered: false }), makeRecord({ behaviour_history_considered: false })]); expect(a.find(x => x.type === "behaviour_not_considered")).toBeDefined(); expect(a.find(x => x.type === "behaviour_not_considered")!.severity).toBe("medium"); });
    it("fires all applicable", () => { 
      const a = identifyRoomSharingAlerts([makeRecord({ sharing_arrangement: "shared_by_choice", room_risk_level: "unacceptable", safeguarding_check_done: false, child_consent_obtained: false, risk_assessment_current: false, privacy_maintained: false, behaviour_history_considered: false }), makeRecord({ sharing_arrangement: "temporary_sharing", child_consent_obtained: false, privacy_maintained: false, behaviour_history_considered: false })]);
      const types = a.map(x => x.type);
      expect(types).toContain("unacceptable_no_safeguarding");
      expect(types).toContain("no_child_consent");
      expect(types).toContain("risk_assessment_outdated");
      expect(types).toContain("privacy_not_maintained");
      expect(types).toContain("behaviour_not_considered");
    });
  });
});
