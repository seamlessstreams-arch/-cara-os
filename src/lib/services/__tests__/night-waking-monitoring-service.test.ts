import { describe, it, expect } from "vitest";
import { _testing, type NightWakingMonitoringRecord } from "../night-waking-monitoring-service";
import { todayStr } from "@/lib/utils";

const { computeNightWakingMetrics, identifyNightWakingAlerts } = _testing;

const now = new Date(todayStr());

function makeRecord(overrides?: Partial<NightWakingMonitoringRecord>): NightWakingMonitoringRecord {
  return {
    id: "a-1", home_id: "home-1",
    waking_reason: "nightmare",
    child_emotional_state: "calm",
    staff_response: "verbal_reassurance",
    sleep_return_time: "within_15_minutes",
    waking_date: todayStr(),
    waking_time: "02:00",
    child_name: "Child A",
    child_id: "child_id" in (overrides ?? {}) ? (overrides!.child_id ?? null) : null,
    staff_on_duty: "Staff A",
    child_comforted: true,
    environment_checked: true,
    temperature_appropriate: true,
    drink_offered: true,
    night_light_available: true,
    door_preference_respected: true,
    gp_referral_considered: true,
    sleep_plan_followed: true,
    pattern_identified: true,
    parent_informed: true,
    social_worker_informed: true,
    recorded_promptly: true,
    issues_found: [], actions_taken: [],
    waking_duration_minutes: 20,
    next_review_date: "next_review_date" in (overrides ?? {}) ? (overrides!.next_review_date ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: now.toISOString(), updated_at: now.toISOString(),
      // Overrides win last: an explicit null stays null — the old
    // `overrides?.x ?? default` fabricated answers inside the factory.
    ...overrides,
  };
}

describe("night-waking-monitoring-service", () => {
  describe("computeNightWakingMetrics", () => {
    it("returns zeros for empty", () => { 
      const m = computeNightWakingMetrics([]);
      expect(m.total_wakings).toBe(0);;
      expect(m.distressed_count).toBe(0);
      expect(m.angry_count).toBe(0);
      expect(m.nightmare_count).toBe(0);
      expect(m.did_not_return_count).toBe(0);
      expect(m.child_comforted_rate).toBeNull();;
      expect(m.average_duration).toBeNull();;
      expect(m.unique_children).toBe(0);
    });
    it("returns empty breakdowns", () => { 
      const m = computeNightWakingMetrics([]);
      expect(m.by_waking_reason).toEqual({});
      expect(m.by_emotional_state).toEqual({});
      expect(m.by_staff_response).toEqual({});
      expect(m.by_sleep_return_time).toEqual({});
    });
    it("counts distressed", () => { expect(computeNightWakingMetrics([makeRecord({ child_emotional_state: "distressed" })]).distressed_count).toBe(1); });
    it("counts angry", () => { expect(computeNightWakingMetrics([makeRecord({ child_emotional_state: "angry" })]).angry_count).toBe(1); });
    it("counts nightmare", () => { expect(computeNightWakingMetrics([makeRecord({ waking_reason: "nightmare" })]).nightmare_count).toBe(1); });
    it("counts did_not_return", () => { expect(computeNightWakingMetrics([makeRecord({ sleep_return_time: "did_not_return_to_sleep" })]).did_not_return_count).toBe(1); });
    it("returns 100% boolean rates with defaults", () => { 
      const m = computeNightWakingMetrics([makeRecord()]);
      expect(m.child_comforted_rate).toBe(100);
      expect(m.environment_checked_rate).toBe(100);
      expect(m.temperature_appropriate_rate).toBe(100);
      expect(m.drink_offered_rate).toBe(100);
      expect(m.night_light_rate).toBe(100);
      expect(m.door_preference_rate).toBe(100);
      expect(m.gp_referral_rate).toBe(100);
      expect(m.sleep_plan_rate).toBe(100);
      expect(m.pattern_identified_rate).toBe(100);
      expect(m.parent_informed_rate).toBe(100);
      expect(m.social_worker_informed_rate).toBe(100);
      expect(m.recorded_promptly_rate).toBe(100);
    });
    it("child_comforted_rate 0 when false", () => { expect(computeNightWakingMetrics([makeRecord({ child_comforted: false })]).child_comforted_rate).toBe(0); });
    it("mixed boolean rate", () => { const m = computeNightWakingMetrics([makeRecord({ child_comforted: true }), makeRecord({ child_comforted: false }), makeRecord({ child_comforted: true })]); expect(m.child_comforted_rate).toBe(66.7); });
    it("average_duration single", () => { expect(computeNightWakingMetrics([makeRecord({ waking_duration_minutes: 30 })]).average_duration).toBe(30); });
    it("average_duration multi", () => { expect(computeNightWakingMetrics([makeRecord({ waking_duration_minutes: 20 }), makeRecord({ waking_duration_minutes: 40 })]).average_duration).toBe(30); });
    it("unique_children distinct", () => { const m = computeNightWakingMetrics([makeRecord({ child_name: "A" }), makeRecord({ child_name: "B" }), makeRecord({ child_name: "A" })]); expect(m.unique_children).toBe(2); });
    it("counts all 10 waking reasons", () => { const reasons = ["nightmare","anxiety","physical_discomfort","toileting","noise_disturbance","hunger_thirst","medication_side_effect","habitual_waking","unknown","other"] as const; const records = reasons.map(r => makeRecord({ waking_reason: r })); const m = computeNightWakingMetrics(records); for (const r of reasons) expect(m.by_waking_reason[r]).toBe(1); });
    it("counts all 5 emotional states", () => { const states = ["calm","mildly_unsettled","upset","distressed","angry"] as const; const records = states.map(s => makeRecord({ child_emotional_state: s })); const m = computeNightWakingMetrics(records); for (const s of states) expect(m.by_emotional_state[s]).toBe(1); });
    it("counts all 10 staff responses", () => { const responses = ["verbal_reassurance","physical_comfort","drink_snack","medication_administered","stayed_with_child","environmental_adjustment","distraction_activity","contacted_on_call","no_intervention_needed","other"] as const; const records = responses.map(r => makeRecord({ staff_response: r })); const m = computeNightWakingMetrics(records); for (const r of responses) expect(m.by_staff_response[r]).toBe(1); });
    it("counts all 5 sleep return times", () => { const times = ["within_15_minutes","within_30_minutes","within_1_hour","over_1_hour","did_not_return_to_sleep"] as const; const records = times.map(t => makeRecord({ sleep_return_time: t })); const m = computeNightWakingMetrics(records); for (const t of times) expect(m.by_sleep_return_time[t]).toBe(1); });
    it("total_wakings counts all", () => { expect(computeNightWakingMetrics([makeRecord(), makeRecord(), makeRecord()]).total_wakings).toBe(3); });
  });

  describe("identifyNightWakingAlerts", () => {
    it("returns empty for clean", () => { expect(identifyNightWakingAlerts([makeRecord()])).toEqual([]); });
    it("returns empty for empty", () => { expect(identifyNightWakingAlerts([])).toEqual([]); });
    it("fires distressed_not_comforted for distressed", () => { 
      const a = identifyNightWakingAlerts([makeRecord({ child_emotional_state: "distressed", child_comforted: false, child_name: "Jo" })]);
      expect(a[0].type).toBe("distressed_not_comforted");
      expect(a[0].severity).toBe("critical");
      expect(a[0].message).toContain("Jo");
      expect(a[0].message).toContain("distressed");
    });
    it("fires distressed_not_comforted for angry", () => { const a = identifyNightWakingAlerts([makeRecord({ child_emotional_state: "angry", child_comforted: false })]); expect(a[0].type).toBe("distressed_not_comforted"); });
    it("distressed_not_comforted per-record", () => { const a = identifyNightWakingAlerts([makeRecord({ id: "a-1", child_emotional_state: "distressed", child_comforted: false }), makeRecord({ id: "a-2", child_emotional_state: "angry", child_comforted: false })]); expect(a.filter(x => x.type === "distressed_not_comforted")).toHaveLength(2); });
    it("no alert if distressed but comforted", () => { expect(identifyNightWakingAlerts([makeRecord({ child_emotional_state: "distressed", child_comforted: true })]).filter(x => x.type === "distressed_not_comforted")).toHaveLength(0); });
    it("fires sleep_plan_not_followed singular", () => { 
      const a = identifyNightWakingAlerts([makeRecord({ sleep_plan_followed: false })]);
      const f = a.find(x => x.type === "sleep_plan_not_followed");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 night waking has");
    });
    it("sleep_plan_not_followed plural", () => { const a = identifyNightWakingAlerts([makeRecord({ sleep_plan_followed: false }), makeRecord({ sleep_plan_followed: false })]); const f = a.find(x => x.type === "sleep_plan_not_followed"); expect(f!.message).toContain("2 night wakings have"); });
    it("fires not_recorded_promptly singular", () => { 
      const a = identifyNightWakingAlerts([makeRecord({ recorded_promptly: false })]);
      const f = a.find(x => x.type === "not_recorded_promptly");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 night waking was");
    });
    it("not_recorded_promptly plural", () => { const a = identifyNightWakingAlerts([makeRecord({ recorded_promptly: false }), makeRecord({ recorded_promptly: false })]); const f = a.find(x => x.type === "not_recorded_promptly"); expect(f!.message).toContain("2 night wakings were"); });
    it("environment_not_checked not for 1", () => { expect(identifyNightWakingAlerts([makeRecord({ environment_checked: false })]).find(x => x.type === "environment_not_checked")).toBeUndefined(); });
    it("environment_not_checked fires for 2", () => { const a = identifyNightWakingAlerts([makeRecord({ environment_checked: false }), makeRecord({ environment_checked: false })]); expect(a.find(x => x.type === "environment_not_checked")).toBeDefined(); });
    it("pattern_not_identified not for 2", () => { expect(identifyNightWakingAlerts([makeRecord({ pattern_identified: false }), makeRecord({ pattern_identified: false })]).find(x => x.type === "pattern_not_identified")).toBeUndefined(); });
    it("pattern_not_identified fires for 3", () => { const a = identifyNightWakingAlerts([makeRecord({ pattern_identified: false }), makeRecord({ pattern_identified: false }), makeRecord({ pattern_identified: false })]); expect(a.find(x => x.type === "pattern_not_identified")).toBeDefined(); });
    it("fires all applicable", () => { 
      const a = identifyNightWakingAlerts([makeRecord({ child_emotional_state: "distressed", child_comforted: false, sleep_plan_followed: false, recorded_promptly: false, environment_checked: false, pattern_identified: false }), makeRecord({ environment_checked: false, pattern_identified: false }), makeRecord({ pattern_identified: false })]);
      const types = a.map(x => x.type);
      expect(types).toContain("distressed_not_comforted");
      expect(types).toContain("sleep_plan_not_followed");
      expect(types).toContain("not_recorded_promptly");
      expect(types).toContain("environment_not_checked");
      expect(types).toContain("pattern_not_identified");
    });
  });
});
