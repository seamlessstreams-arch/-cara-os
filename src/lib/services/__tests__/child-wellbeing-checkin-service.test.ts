import { describe, it, expect } from "vitest";
import { _testing, type ChildWellbeingCheckinRecord } from "../child-wellbeing-checkin-service";
import { todayStr } from "@/lib/utils";

const { computeWellbeingCheckinMetrics, identifyWellbeingCheckinAlerts } = _testing;

const now = new Date(todayStr());

function makeRecord(overrides?: Partial<ChildWellbeingCheckinRecord>): ChildWellbeingCheckinRecord {
  return {
    id: "a-1", home_id: "home-1",
    mood_rating: "happy",
    emotional_state: "calm",
    wellbeing_domain: "emotional",
    check_in_type: "morning_routine",
    check_in_date: todayStr(),
    child_name: "Child A",
    child_id: "child_id" in (overrides ?? {}) ? (overrides!.child_id ?? null) : null,
    staff_name: "Staff A",
    child_engaged: true,
    child_voice_captured: true,
    concerns_identified: false,
    follow_up_needed: false,
    care_plan_reviewed: true,
    parent_informed: true,
    social_worker_informed: true,
    private_time_offered: true,
    physical_health_checked: true,
    eating_well: true,
    sleeping_well: true,
    recorded_promptly: true,
    issues_found: [], actions_taken: [],
    wellbeing_score: 7,
    next_review_date: "next_review_date" in (overrides ?? {}) ? (overrides!.next_review_date ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: now.toISOString(), updated_at: now.toISOString(),
      // Overrides win last: an explicit null stays null — the old
    // `overrides?.x ?? default` fabricated answers inside the factory.
    ...overrides,
  };
}

describe("child-wellbeing-checkin-service", () => {
  describe("computeWellbeingCheckinMetrics", () => {
    it("returns zeros for empty", () => { 
      const m = computeWellbeingCheckinMetrics([]);
      expect(m.total_checkins).toBe(0);;
      expect(m.unhappy_count).toBe(0);
      expect(m.very_unhappy_count).toBe(0);
      expect(m.concerns_identified_count).toBe(0);
      expect(m.follow_up_needed_count).toBe(0);
      expect(m.child_engaged_rate).toBeNull();;
      expect(m.average_wellbeing_score).toBeNull();;
      expect(m.unique_children).toBe(0);
    });
    it("returns empty breakdowns", () => { 
      const m = computeWellbeingCheckinMetrics([]);
      expect(m.by_mood_rating).toEqual({});
      expect(m.by_emotional_state).toEqual({});
      expect(m.by_wellbeing_domain).toEqual({});
      expect(m.by_check_in_type).toEqual({});
    });
    it("counts unhappy", () => { expect(computeWellbeingCheckinMetrics([makeRecord({ mood_rating: "unhappy" })]).unhappy_count).toBe(1); });
    it("counts very_unhappy", () => { expect(computeWellbeingCheckinMetrics([makeRecord({ mood_rating: "very_unhappy" })]).very_unhappy_count).toBe(1); });
    it("counts concerns_identified", () => { expect(computeWellbeingCheckinMetrics([makeRecord({ concerns_identified: true })]).concerns_identified_count).toBe(1); });
    it("counts follow_up_needed", () => { expect(computeWellbeingCheckinMetrics([makeRecord({ follow_up_needed: true })]).follow_up_needed_count).toBe(1); });
    it("returns 100% boolean rates with defaults", () => { 
      const m = computeWellbeingCheckinMetrics([makeRecord()]);
      expect(m.child_engaged_rate).toBe(100);
      expect(m.child_voice_rate).toBe(100);
      expect(m.care_plan_reviewed_rate).toBe(100);
      expect(m.parent_informed_rate).toBe(100);
      expect(m.social_worker_informed_rate).toBe(100);
      expect(m.private_time_rate).toBe(100);
      expect(m.physical_health_rate).toBe(100);
      expect(m.eating_well_rate).toBe(100);
      expect(m.sleeping_well_rate).toBe(100);
      expect(m.recorded_promptly_rate).toBe(100);
    });
    it("child_engaged_rate 0 when false", () => { expect(computeWellbeingCheckinMetrics([makeRecord({ child_engaged: false })]).child_engaged_rate).toBe(0); });
    it("mixed boolean rate", () => { const m = computeWellbeingCheckinMetrics([makeRecord({ child_engaged: true }), makeRecord({ child_engaged: false }), makeRecord({ child_engaged: true })]); expect(m.child_engaged_rate).toBe(66.7); });
    it("average_wellbeing_score single", () => { expect(computeWellbeingCheckinMetrics([makeRecord({ wellbeing_score: 8 })]).average_wellbeing_score).toBe(8); });
    it("average_wellbeing_score multi", () => { expect(computeWellbeingCheckinMetrics([makeRecord({ wellbeing_score: 6 }), makeRecord({ wellbeing_score: 8 })]).average_wellbeing_score).toBe(7); });
    it("unique_children distinct", () => { const m = computeWellbeingCheckinMetrics([makeRecord({ child_name: "A" }), makeRecord({ child_name: "B" }), makeRecord({ child_name: "A" })]); expect(m.unique_children).toBe(2); });
    it("counts all 5 mood ratings", () => { const ratings = ["very_happy","happy","okay","unhappy","very_unhappy"] as const; const records = ratings.map(r => makeRecord({ mood_rating: r })); const m = computeWellbeingCheckinMetrics(records); for (const r of ratings) expect(m.by_mood_rating[r]).toBe(1); });
    it("counts all 10 emotional states", () => { const states = ["calm","content","anxious","sad","angry","withdrawn","excited","confused","overwhelmed","other"] as const; const records = states.map(s => makeRecord({ emotional_state: s })); const m = computeWellbeingCheckinMetrics(records); for (const s of states) expect(m.by_emotional_state[s]).toBe(1); });
    it("counts all 5 wellbeing domains", () => { const domains = ["emotional","physical","social","educational","spiritual"] as const; const records = domains.map(d => makeRecord({ wellbeing_domain: d })); const m = computeWellbeingCheckinMetrics(records); for (const d of domains) expect(m.by_wellbeing_domain[d]).toBe(1); });
    it("counts all 5 check-in types", () => { const types = ["morning_routine","after_school","evening","bedtime","ad_hoc"] as const; const records = types.map(t => makeRecord({ check_in_type: t })); const m = computeWellbeingCheckinMetrics(records); for (const t of types) expect(m.by_check_in_type[t]).toBe(1); });
  });

  describe("identifyWellbeingCheckinAlerts", () => {
    it("returns empty for clean", () => { expect(identifyWellbeingCheckinAlerts([makeRecord()])).toEqual([]); });
    it("returns empty for empty", () => { expect(identifyWellbeingCheckinAlerts([])).toEqual([]); });
    it("fires very_unhappy_no_followup", () => { 
      const a = identifyWellbeingCheckinAlerts([makeRecord({ mood_rating: "very_unhappy", follow_up_needed: false, child_name: "Jo", check_in_type: "evening" })]);
      expect(a[0].type).toBe("very_unhappy_no_followup");
      expect(a[0].severity).toBe("critical");
      expect(a[0].message).toContain("Jo");
      expect(a[0].message).toContain("evening");
    });
    it("very_unhappy_no_followup per-record", () => { const a = identifyWellbeingCheckinAlerts([makeRecord({ id: "a-1", mood_rating: "very_unhappy", follow_up_needed: false }), makeRecord({ id: "a-2", mood_rating: "very_unhappy", follow_up_needed: false })]); expect(a.filter(x => x.type === "very_unhappy_no_followup")).toHaveLength(2); });
    it("no alert if very_unhappy with follow-up", () => { expect(identifyWellbeingCheckinAlerts([makeRecord({ mood_rating: "very_unhappy", follow_up_needed: true })]).filter(x => x.type === "very_unhappy_no_followup")).toHaveLength(0); });
    it("fires concerns_sw_not_informed singular", () => { 
      const a = identifyWellbeingCheckinAlerts([makeRecord({ concerns_identified: true, social_worker_informed: false })]);
      const f = a.find(x => x.type === "concerns_sw_not_informed");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 check-in has");
    });
    it("concerns_sw_not_informed plural", () => { const a = identifyWellbeingCheckinAlerts([makeRecord({ concerns_identified: true, social_worker_informed: false }), makeRecord({ concerns_identified: true, social_worker_informed: false })]); const f = a.find(x => x.type === "concerns_sw_not_informed"); expect(f!.message).toContain("2 check-ins have"); });
    it("fires voice_not_captured singular", () => { const a = identifyWellbeingCheckinAlerts([makeRecord({ child_voice_captured: false })]); const f = a.find(x => x.type === "voice_not_captured"); expect(f).toBeDefined(); expect(f!.severity).toBe("high"); });
    it("not_eating_well not for 1", () => { expect(identifyWellbeingCheckinAlerts([makeRecord({ eating_well: false })]).find(x => x.type === "not_eating_well")).toBeUndefined(); });
    it("not_eating_well fires for 2", () => { const a = identifyWellbeingCheckinAlerts([makeRecord({ eating_well: false }), makeRecord({ eating_well: false })]); expect(a.find(x => x.type === "not_eating_well")).toBeDefined(); });
    it("not_sleeping_well not for 1", () => { expect(identifyWellbeingCheckinAlerts([makeRecord({ sleeping_well: false })]).find(x => x.type === "not_sleeping_well")).toBeUndefined(); });
    it("not_sleeping_well fires for 2", () => { const a = identifyWellbeingCheckinAlerts([makeRecord({ sleeping_well: false }), makeRecord({ sleeping_well: false })]); expect(a.find(x => x.type === "not_sleeping_well")).toBeDefined(); });
    it("fires all applicable", () => { 
      const a = identifyWellbeingCheckinAlerts([makeRecord({ mood_rating: "very_unhappy", follow_up_needed: false, concerns_identified: true, social_worker_informed: false, child_voice_captured: false, eating_well: false, sleeping_well: false }), makeRecord({ eating_well: false, sleeping_well: false })]);
      const types = a.map(x => x.type);
      expect(types).toContain("very_unhappy_no_followup");
      expect(types).toContain("concerns_sw_not_informed");
      expect(types).toContain("voice_not_captured");
      expect(types).toContain("not_eating_well");
      expect(types).toContain("not_sleeping_well");
    });
  });
});

describe("tri-state judgements", () => {
  it("counts unrecorded child voice in the gap alert, worded as unevidenced", () => {
    const alerts = identifyWellbeingCheckinAlerts([makeRecord({ child_voice_captured: null })]);
    const alert = alerts.find((a) => a.type === "voice_not_captured");
    expect(alert).toBeTruthy();
    expect(alert!.message).toContain("evidenced");
  });
  it("does not assert concerns nobody recorded", () => {
    const alerts = identifyWellbeingCheckinAlerts([
      makeRecord({ concerns_identified: null, social_worker_informed: false }),
    ]);
    expect(alerts.some((a) => a.type === "concerns_no_sw")).toBe(false);
  });
  it("does not dilute the child-voice rate with unrecorded rows", () => {
    const rows = [true, null, null, null].map((v, i) => makeRecord({ id: `r-${i}`, child_voice_captured: v }));
    expect(computeWellbeingCheckinMetrics(rows).child_voice_rate).toBe(100);
  });
});
