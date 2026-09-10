import { describe, it, expect } from "vitest";
import { _testing, type KeyworkerSessionRecord } from "../keyworker-sessions-service";
import { todayStr } from "@/lib/utils";

const { computeKeyworkerSessionMetrics, identifyKeyworkerSessionAlerts } = _testing;

const now = new Date(todayStr());

function makeRecord(overrides?: Partial<KeyworkerSessionRecord>): KeyworkerSessionRecord {
  return {
    id: "a-1", home_id: "home-1",
    session_focus: "emotional_check_in",
    session_quality: "good",
    child_mood: "positive",
    session_location: "in_home",
    session_date: todayStr(),
    child_name: "Child A",
    child_id: "child_id" in (overrides ?? {}) ? (overrides!.child_id ?? null) : "child-1",
    keyworker_name: "Staff A",
    child_led: true,
    targets_reviewed: true,
    wishes_feelings_recorded: true,
    advocacy_provided: true,
    care_plan_discussed: true,
    safety_discussed: true,
    achievements_celebrated: true,
    worries_explored: true,
    next_steps_agreed: true,
    session_recorded: true,
    child_signed: true,
    social_worker_updated: true,
    issues_found: [], actions_taken: [],
    session_duration_minutes: 30,
    next_session_date: "next_session_date" in (overrides ?? {}) ? (overrides!.next_session_date ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: now.toISOString(), updated_at: now.toISOString(),
      // Overrides win last: an explicit null stays null — the old
    // `overrides?.x ?? default` fabricated answers inside the factory.
    ...overrides,
  };
}

describe("keyworker-sessions-service", () => {
  describe("computeKeyworkerSessionMetrics", () => {
    it("returns zeros for empty", () => { 
      const m = computeKeyworkerSessionMetrics([]);
      expect(m.total_sessions).toBe(0);;
      expect(m.excellent_count).toBe(0);
      expect(m.good_count).toBe(0);
      expect(m.poor_count).toBe(0);
      expect(m.distressed_count).toBe(0);
      expect(m.child_led_rate).toBeNull();;
      expect(m.average_duration).toBeNull();;
      expect(m.unique_children).toBe(0);
    });
    it("returns empty breakdowns", () => { 
      const m = computeKeyworkerSessionMetrics([]);
      expect(m.by_session_focus).toEqual({});
      expect(m.by_session_quality).toEqual({});
      expect(m.by_child_mood).toEqual({});
      expect(m.by_session_location).toEqual({});
    });
    it("counts excellent", () => { expect(computeKeyworkerSessionMetrics([makeRecord({ session_quality: "excellent" })]).excellent_count).toBe(1); });
    it("counts good", () => { expect(computeKeyworkerSessionMetrics([makeRecord()]).good_count).toBe(1); });
    it("counts poor", () => { expect(computeKeyworkerSessionMetrics([makeRecord({ session_quality: "poor" })]).poor_count).toBe(1); });
    it("counts distressed", () => { expect(computeKeyworkerSessionMetrics([makeRecord({ child_mood: "distressed" })]).distressed_count).toBe(1); });
    it("returns 100% boolean rates with defaults", () => { 
      const m = computeKeyworkerSessionMetrics([makeRecord()]);
      expect(m.child_led_rate).toBe(100);
      expect(m.targets_reviewed_rate).toBe(100);
      expect(m.wishes_feelings_rate).toBe(100);
      expect(m.advocacy_rate).toBe(100);
      expect(m.care_plan_discussed_rate).toBe(100);
      expect(m.safety_discussed_rate).toBe(100);
      expect(m.achievements_celebrated_rate).toBe(100);
      expect(m.worries_explored_rate).toBe(100);
      expect(m.next_steps_agreed_rate).toBe(100);
      expect(m.session_recorded_rate).toBe(100);
      expect(m.child_signed_rate).toBe(100);
      expect(m.social_worker_updated_rate).toBe(100);
    });
    it("child_led_rate 0 when false", () => { expect(computeKeyworkerSessionMetrics([makeRecord({ child_led: false })]).child_led_rate).toBe(0); });
    it("mixed boolean rate", () => { const m = computeKeyworkerSessionMetrics([makeRecord({ child_led: true }), makeRecord({ child_led: false }), makeRecord({ child_led: true })]); expect(m.child_led_rate).toBe(66.7); });
    it("average_duration single", () => { expect(computeKeyworkerSessionMetrics([makeRecord({ session_duration_minutes: 45 })]).average_duration).toBe(45); });
    it("average_duration multi", () => { expect(computeKeyworkerSessionMetrics([makeRecord({ session_duration_minutes: 30 }), makeRecord({ session_duration_minutes: 60 })]).average_duration).toBe(45); });
    it("unique_children distinct", () => { const m = computeKeyworkerSessionMetrics([makeRecord({ child_name: "A" }), makeRecord({ child_name: "B" }), makeRecord({ child_name: "A" })]); expect(m.unique_children).toBe(2); });
    it("counts all 10 focuses", () => { const focuses = ["emotional_check_in","care_plan_review","target_setting","life_skills","education_support","health_wellbeing","relationships","advocacy","transition_planning","other"] as const; const records = focuses.map(f => makeRecord({ session_focus: f })); const m = computeKeyworkerSessionMetrics(records); for (const f of focuses) expect(m.by_session_focus[f]).toBe(1); });
    it("counts all 5 qualities", () => { const qualities = ["excellent","good","adequate","poor","not_assessed"] as const; const records = qualities.map(q => makeRecord({ session_quality: q })); const m = computeKeyworkerSessionMetrics(records); for (const q of qualities) expect(m.by_session_quality[q]).toBe(1); });
    it("counts all 5 moods", () => { const moods = ["very_positive","positive","neutral","low","distressed"] as const; const records = moods.map(mood => makeRecord({ child_mood: mood })); const m = computeKeyworkerSessionMetrics(records); for (const mood of moods) expect(m.by_child_mood[mood]).toBe(1); });
    it("counts all 10 locations", () => { const locations = ["in_home","bedroom","community","school","activity_based","car_journey","walking","online","restaurant_cafe","other"] as const; const records = locations.map(l => makeRecord({ session_location: l })); const m = computeKeyworkerSessionMetrics(records); for (const l of locations) expect(m.by_session_location[l]).toBe(1); });
  });

  describe("identifyKeyworkerSessionAlerts", () => {
    it("returns empty for clean", () => { expect(identifyKeyworkerSessionAlerts([makeRecord()])).toEqual([]); });
    it("returns empty for empty", () => { expect(identifyKeyworkerSessionAlerts([])).toEqual([]); });
    it("fires distressed_poor_session", () => { 
      const a = identifyKeyworkerSessionAlerts([makeRecord({ child_mood: "distressed", session_quality: "poor", child_name: "Jo", session_date: "2026-05-14" })]);
      expect(a[0].type).toBe("distressed_poor_session");
      expect(a[0].severity).toBe("critical");
      expect(a[0].message).toContain("Jo");
    });
    it("distressed_poor_session per-record", () => { const a = identifyKeyworkerSessionAlerts([makeRecord({ id: "a-1", child_mood: "distressed", session_quality: "poor" }), makeRecord({ id: "a-2", child_mood: "distressed", session_quality: "poor" })]); expect(a.filter(x => x.type === "distressed_poor_session")).toHaveLength(2); });
    it("no alert if distressed but good quality", () => { expect(identifyKeyworkerSessionAlerts([makeRecord({ child_mood: "distressed", session_quality: "good" })]).filter(x => x.type === "distressed_poor_session")).toHaveLength(0); });
    it("fires not_recorded singular", () => { 
      const a = identifyKeyworkerSessionAlerts([makeRecord({ session_recorded: false })]);
      const f = a.find(x => x.type === "not_recorded");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 session has");
    });
    it("not_recorded plural", () => { const a = identifyKeyworkerSessionAlerts([makeRecord({ session_recorded: false }), makeRecord({ session_recorded: false })]); const f = a.find(x => x.type === "not_recorded"); expect(f!.message).toContain("2 sessions have"); });
    it("wishes_not_recorded not for 1", () => { expect(identifyKeyworkerSessionAlerts([makeRecord({ wishes_feelings_recorded: false })]).find(x => x.type === "wishes_not_recorded")).toBeUndefined(); });
    it("wishes_not_recorded fires for 2", () => { const a = identifyKeyworkerSessionAlerts([makeRecord({ wishes_feelings_recorded: false }), makeRecord({ wishes_feelings_recorded: false })]); expect(a.find(x => x.type === "wishes_not_recorded")).toBeDefined(); });
    it("not_child_led not for 2", () => { expect(identifyKeyworkerSessionAlerts([makeRecord({ child_led: false }), makeRecord({ child_led: false })]).find(x => x.type === "not_child_led")).toBeUndefined(); });
    it("not_child_led fires for 3", () => { const a = identifyKeyworkerSessionAlerts([makeRecord({ child_led: false }), makeRecord({ child_led: false }), makeRecord({ child_led: false })]); expect(a.find(x => x.type === "not_child_led")).toBeDefined(); });
    it("no_next_steps not for 2", () => { expect(identifyKeyworkerSessionAlerts([makeRecord({ next_steps_agreed: false }), makeRecord({ next_steps_agreed: false })]).find(x => x.type === "no_next_steps")).toBeUndefined(); });
    it("no_next_steps fires for 3", () => { const a = identifyKeyworkerSessionAlerts([makeRecord({ next_steps_agreed: false }), makeRecord({ next_steps_agreed: false }), makeRecord({ next_steps_agreed: false })]); expect(a.find(x => x.type === "no_next_steps")).toBeDefined(); });
    it("fires all applicable", () => { 
      const a = identifyKeyworkerSessionAlerts([makeRecord({ child_mood: "distressed", session_quality: "poor", session_recorded: false, wishes_feelings_recorded: false, child_led: false, next_steps_agreed: false }), makeRecord({ wishes_feelings_recorded: false, child_led: false, next_steps_agreed: false }), makeRecord({ child_led: false, next_steps_agreed: false })]);
      const types = a.map(x => x.type);
      expect(types).toContain("distressed_poor_session");
      expect(types).toContain("not_recorded");
      expect(types).toContain("wishes_not_recorded");
      expect(types).toContain("not_child_led");
      expect(types).toContain("no_next_steps");
    });
  });
});

// ── Tri-state: an unanswered recording question is not a missed recording ──
describe("tri-state judgements", () => {
  it("does not count an unrecorded session_recorded as a failure", () => {
    const alerts = _testing.identifyKeyworkerSessionAlerts([
      makeRecord({ session_recorded: null }),
    ]);
    expect(alerts.some((a) => /not been recorded/i.test(a.message))).toBe(false);
  });
  it("still counts a recorded no", () => {
    const alerts = _testing.identifyKeyworkerSessionAlerts([
      makeRecord({ session_recorded: false }),
    ]);
    expect(alerts.some((a) => /not been recorded/i.test(a.message))).toBe(true);
  });
});
