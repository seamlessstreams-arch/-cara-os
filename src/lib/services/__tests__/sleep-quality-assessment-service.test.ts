import { describe, it, expect } from "vitest";
import { _testing, type SleepQualityAssessmentRecord } from "../sleep-quality-assessment-service";
import { todayStr } from "@/lib/utils";

const { computeSleepQualityMetrics, identifySleepQualityAlerts } = _testing;

const now = new Date(todayStr());

function makeRecord(overrides?: Partial<SleepQualityAssessmentRecord>): SleepQualityAssessmentRecord {
  return {
    id: overrides?.id ?? "a-1", home_id: overrides?.home_id ?? "home-1",
    sleep_quality: overrides?.sleep_quality ?? "good",
    bedtime_routine: overrides?.bedtime_routine ?? "fully_followed",
    sleep_environment: overrides?.sleep_environment ?? "good",
    waking_frequency: overrides?.waking_frequency ?? "none",
    sleep_concern: overrides?.sleep_concern ?? "none_identified",
    assessment_date: overrides?.assessment_date ?? todayStr(),
    child_name: overrides?.child_name ?? "Child A",
    child_id: "child_id" in (overrides ?? {}) ? (overrides!.child_id ?? null) : null,
    assessed_by: overrides?.assessed_by ?? "Staff A",
    bedtime_consistent: overrides?.bedtime_consistent ?? true,
    wake_time_consistent: overrides?.wake_time_consistent ?? true,
    room_comfortable: overrides?.room_comfortable ?? true,
    temperature_appropriate: overrides?.temperature_appropriate ?? true,
    noise_minimised: overrides?.noise_minimised ?? true,
    screen_free_before_bed: overrides?.screen_free_before_bed ?? true,
    relaxation_supported: overrides?.relaxation_supported ?? true,
    child_preferences_met: overrides?.child_preferences_met ?? true,
    gp_referral_considered: overrides?.gp_referral_considered ?? true,
    sleep_plan_in_place: overrides?.sleep_plan_in_place ?? true,
    care_plan_linked: overrides?.care_plan_linked ?? true,
    recorded_promptly: overrides?.recorded_promptly ?? true,
    issues_found: overrides?.issues_found ?? [], actions_taken: overrides?.actions_taken ?? [],
    sleep_hours: overrides?.sleep_hours ?? 8.0,
    next_review_date: "next_review_date" in (overrides ?? {}) ? (overrides!.next_review_date ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: overrides?.created_at ?? now.toISOString(), updated_at: overrides?.updated_at ?? now.toISOString(),
  };
}

describe("sleep-quality-assessment-service", () => {
  describe("computeSleepQualityMetrics", () => {
    it("returns zeros for empty", () => { 
      const m = computeSleepQualityMetrics([]);
      expect(m.total_assessments).toBe(0);;
      expect(m.poor_sleep_count).toBe(0);
      expect(m.very_poor_sleep_count).toBe(0);
      expect(m.no_routine_count).toBe(0);
      expect(m.unsuitable_environment_count).toBe(0);
      expect(m.continuous_disturbance_count).toBe(0);
      expect(m.bedtime_consistent_rate).toBeNull();;
      expect(m.average_sleep_hours).toBeNull();;
      expect(m.unique_children).toBe(0);
    });
    it("returns empty breakdowns", () => { 
      const m = computeSleepQualityMetrics([]);
      expect(m.by_sleep_quality).toEqual({});
      expect(m.by_bedtime_routine).toEqual({});
      expect(m.by_sleep_environment).toEqual({});
      expect(m.by_waking_frequency).toEqual({});
      expect(m.by_sleep_concern).toEqual({});
    });
    it("counts poor_sleep", () => { expect(computeSleepQualityMetrics([makeRecord({ sleep_quality: "poor" })]).poor_sleep_count).toBe(1); });
    it("counts very_poor_sleep", () => { expect(computeSleepQualityMetrics([makeRecord({ sleep_quality: "very_poor" })]).very_poor_sleep_count).toBe(1); });
    it("counts no_routine", () => { expect(computeSleepQualityMetrics([makeRecord({ bedtime_routine: "no_routine_set" })]).no_routine_count).toBe(1); });
    it("counts unsuitable_environment", () => { expect(computeSleepQualityMetrics([makeRecord({ sleep_environment: "unsuitable" })]).unsuitable_environment_count).toBe(1); });
    it("counts continuous_disturbance", () => { expect(computeSleepQualityMetrics([makeRecord({ waking_frequency: "continuous_disturbance" })]).continuous_disturbance_count).toBe(1); });
    it("returns 100% boolean rates with defaults", () => { 
      const m = computeSleepQualityMetrics([makeRecord()]);
      expect(m.bedtime_consistent_rate).toBe(100);
      expect(m.wake_time_consistent_rate).toBe(100);
      expect(m.room_comfortable_rate).toBe(100);
      expect(m.temperature_appropriate_rate).toBe(100);
      expect(m.noise_minimised_rate).toBe(100);
      expect(m.screen_free_rate).toBe(100);
      expect(m.relaxation_supported_rate).toBe(100);
      expect(m.child_preferences_rate).toBe(100);
      expect(m.gp_referral_rate).toBe(100);
      expect(m.sleep_plan_rate).toBe(100);
      expect(m.care_plan_linked_rate).toBe(100);
      expect(m.recorded_promptly_rate).toBe(100);
    });
    it("bedtime_consistent_rate 0 when false", () => { expect(computeSleepQualityMetrics([makeRecord({ bedtime_consistent: false })]).bedtime_consistent_rate).toBe(0); });
    it("mixed boolean rate", () => { const m = computeSleepQualityMetrics([makeRecord({ bedtime_consistent: true }), makeRecord({ bedtime_consistent: false }), makeRecord({ bedtime_consistent: true })]); expect(m.bedtime_consistent_rate).toBe(66.7); });
    it("average_sleep_hours single", () => { expect(computeSleepQualityMetrics([makeRecord({ sleep_hours: 9.5 })]).average_sleep_hours).toBe(9.5); });
    it("average_sleep_hours multi", () => { expect(computeSleepQualityMetrics([makeRecord({ sleep_hours: 7.0 }), makeRecord({ sleep_hours: 9.0 })]).average_sleep_hours).toBe(8); });
    it("unique_children distinct", () => { const m = computeSleepQualityMetrics([makeRecord({ child_name: "A" }), makeRecord({ child_name: "B" }), makeRecord({ child_name: "A" })]); expect(m.unique_children).toBe(2); });
    it("counts all 5 sleep qualities", () => { const qualities = ["excellent","good","fair","poor","very_poor"] as const; const records = qualities.map(q => makeRecord({ sleep_quality: q })); const m = computeSleepQualityMetrics(records); for (const q of qualities) expect(m.by_sleep_quality[q]).toBe(1); });
    it("counts all 5 bedtime routines", () => { const routines = ["fully_followed","mostly_followed","partially_followed","not_followed","no_routine_set"] as const; const records = routines.map(r => makeRecord({ bedtime_routine: r })); const m = computeSleepQualityMetrics(records); for (const r of routines) expect(m.by_bedtime_routine[r]).toBe(1); });
    it("counts all 5 sleep environments", () => { const envs = ["excellent","good","adequate","needs_improvement","unsuitable"] as const; const records = envs.map(e => makeRecord({ sleep_environment: e })); const m = computeSleepQualityMetrics(records); for (const e of envs) expect(m.by_sleep_environment[e]).toBe(1); });
    it("counts all 5 waking frequencies", () => { const freqs = ["none","once","twice","three_plus","continuous_disturbance"] as const; const records = freqs.map(f => makeRecord({ waking_frequency: f })); const m = computeSleepQualityMetrics(records); for (const f of freqs) expect(m.by_waking_frequency[f]).toBe(1); });
    it("counts all 10 sleep concerns", () => { const concerns = ["nightmares","insomnia","sleep_apnoea","restless_legs","night_terrors","sleepwalking","medication_related","anxiety_related","none_identified","other"] as const; const records = concerns.map(c => makeRecord({ sleep_concern: c })); const m = computeSleepQualityMetrics(records); for (const c of concerns) expect(m.by_sleep_concern[c]).toBe(1); });
  });

  describe("identifySleepQualityAlerts", () => {
    it("returns empty for clean", () => { expect(identifySleepQualityAlerts([makeRecord()])).toEqual([]); });
    it("returns empty for empty", () => { expect(identifySleepQualityAlerts([])).toEqual([]); });
    it("fires very_poor_no_gp_referral", () => { 
      const a = identifySleepQualityAlerts([makeRecord({ sleep_quality: "very_poor", gp_referral_considered: false, child_name: "Jo" })]);
      expect(a[0].type).toBe("very_poor_no_gp_referral");
      expect(a[0].severity).toBe("critical");
      expect(a[0].message).toContain("Jo");
    });
    it("very_poor_no_gp_referral per-record", () => { const a = identifySleepQualityAlerts([makeRecord({ id: "a-1", sleep_quality: "very_poor", gp_referral_considered: false }), makeRecord({ id: "a-2", sleep_quality: "very_poor", gp_referral_considered: false })]); expect(a.filter(x => x.type === "very_poor_no_gp_referral")).toHaveLength(2); });
    it("no alert if very_poor with gp_referral", () => { expect(identifySleepQualityAlerts([makeRecord({ sleep_quality: "very_poor", gp_referral_considered: true })]).filter(x => x.type === "very_poor_no_gp_referral")).toHaveLength(0); });
    it("fires no_sleep_plan singular", () => { 
      const a = identifySleepQualityAlerts([makeRecord({ sleep_plan_in_place: false })]);
      const f = a.find(x => x.type === "no_sleep_plan");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 child has");
    });
    it("no_sleep_plan plural", () => { const a = identifySleepQualityAlerts([makeRecord({ sleep_plan_in_place: false }), makeRecord({ sleep_plan_in_place: false })]); const f = a.find(x => x.type === "no_sleep_plan"); expect(f!.message).toContain("2 children have"); });
    it("fires no_bedtime_routine singular", () => { 
      const a = identifySleepQualityAlerts([makeRecord({ bedtime_routine: "no_routine_set" })]);
      const f = a.find(x => x.type === "no_bedtime_routine");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 assessment shows");
    });
    it("no_bedtime_routine plural", () => { const a = identifySleepQualityAlerts([makeRecord({ bedtime_routine: "no_routine_set" }), makeRecord({ bedtime_routine: "no_routine_set" })]); const f = a.find(x => x.type === "no_bedtime_routine"); expect(f!.message).toContain("2 assessments show"); });
    it("screens_before_bed not for 1", () => { expect(identifySleepQualityAlerts([makeRecord({ screen_free_before_bed: false })]).find(x => x.type === "screens_before_bed")).toBeUndefined(); });
    it("screens_before_bed fires for 2", () => { const a = identifySleepQualityAlerts([makeRecord({ screen_free_before_bed: false }), makeRecord({ screen_free_before_bed: false })]); expect(a.find(x => x.type === "screens_before_bed")).toBeDefined(); });
    it("room_not_comfortable not for 1", () => { expect(identifySleepQualityAlerts([makeRecord({ room_comfortable: false })]).find(x => x.type === "room_not_comfortable")).toBeUndefined(); });
    it("room_not_comfortable fires for 2", () => { const a = identifySleepQualityAlerts([makeRecord({ room_comfortable: false }), makeRecord({ room_comfortable: false })]); expect(a.find(x => x.type === "room_not_comfortable")).toBeDefined(); });
    it("fires all applicable", () => { 
      const a = identifySleepQualityAlerts([makeRecord({ sleep_quality: "very_poor", gp_referral_considered: false, sleep_plan_in_place: false, bedtime_routine: "no_routine_set", screen_free_before_bed: false, room_comfortable: false }), makeRecord({ screen_free_before_bed: false, room_comfortable: false })]);
      const types = a.map(x => x.type);
      expect(types).toContain("very_poor_no_gp_referral");
      expect(types).toContain("no_sleep_plan");
      expect(types).toContain("no_bedtime_routine");
      expect(types).toContain("screens_before_bed");
      expect(types).toContain("room_not_comfortable");
    });
  });
});
