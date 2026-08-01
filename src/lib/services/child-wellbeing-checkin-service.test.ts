import { describe, it, expect } from "vitest";
import {
  computeWellbeingCheckinMetrics,
  identifyWellbeingCheckinAlerts,
} from "./child-wellbeing-checkin-service";
import type { ChildWellbeingCheckinRecord } from "./child-wellbeing-checkin-service";

// -- Factory -------------------------------------------------------------------

function makeRecord(overrides: Partial<ChildWellbeingCheckinRecord> = {}): ChildWellbeingCheckinRecord {
  return {
    id: "wb-1",
    home_id: "home-1",
    mood_rating: "happy",
    emotional_state: "content",
    wellbeing_domain: "emotional",
    check_in_type: "morning_routine",
    check_in_date: "2026-05-20",
    child_name: "Alex",
    child_id: "child-1",
    staff_name: "Staff A",
    child_engaged: true,
    child_voice_captured: true,
    concerns_identified: false,
    follow_up_needed: false,
    care_plan_reviewed: true,
    parent_informed: false,
    social_worker_informed: false,
    private_time_offered: true,
    physical_health_checked: true,
    eating_well: true,
    sleeping_well: true,
    recorded_promptly: true,
    issues_found: [],
    actions_taken: [],
    wellbeing_score: 8,
    next_review_date: null,
    notes: null,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

// -- computeWellbeingCheckinMetrics --------------------------------------------

describe("computeWellbeingCheckinMetrics", () => {
  it("returns zeroed metrics for empty data", () => {
    const m = computeWellbeingCheckinMetrics([]);
    expect(m.total_checkins).toBe(0);
    expect(m.unhappy_count).toBe(0);
    expect(m.very_unhappy_count).toBe(0);
    expect(m.concerns_identified_count).toBe(0);
    expect(m.follow_up_needed_count).toBe(0);
    expect(m.average_wellbeing_score).toBeNull();;
    expect(m.unique_children).toBe(0);
  });

  it("counts mood ratings and concerns", () => {
    const rows = [
      makeRecord({ id: "1", mood_rating: "unhappy" }),
      makeRecord({ id: "2", mood_rating: "very_unhappy" }),
      makeRecord({ id: "3", concerns_identified: true }),
      makeRecord({ id: "4", follow_up_needed: true }),
    ];
    const m = computeWellbeingCheckinMetrics(rows);
    expect(m.unhappy_count).toBe(1);
    expect(m.very_unhappy_count).toBe(1);
    expect(m.concerns_identified_count).toBe(1);
    expect(m.follow_up_needed_count).toBe(1);
  });

  it("calculates average wellbeing score", () => {
    const rows = [
      makeRecord({ id: "1", wellbeing_score: 6 }),
      makeRecord({ id: "2", wellbeing_score: 10 }),
    ];
    const m = computeWellbeingCheckinMetrics(rows);
    expect(m.average_wellbeing_score).toBe(8);
  });

  it("builds mood, state, domain, and type breakdowns", () => {
    const rows = [
      makeRecord({ id: "1", mood_rating: "happy", emotional_state: "calm", wellbeing_domain: "emotional", check_in_type: "morning_routine" }),
      makeRecord({ id: "2", mood_rating: "happy", emotional_state: "anxious", wellbeing_domain: "physical", check_in_type: "bedtime" }),
    ];
    const m = computeWellbeingCheckinMetrics(rows);
    expect(m.by_mood_rating).toEqual({ happy: 2 });
    expect(m.by_emotional_state).toEqual({ calm: 1, anxious: 1 });
    expect(m.by_wellbeing_domain).toEqual({ emotional: 1, physical: 1 });
    expect(m.by_check_in_type).toEqual({ morning_routine: 1, bedtime: 1 });
  });

  it("calculates boolean rates", () => {
    const rows = [
      makeRecord({ id: "1", child_engaged: true, eating_well: true }),
      makeRecord({ id: "2", child_engaged: false, eating_well: false }),
    ];
    const m = computeWellbeingCheckinMetrics(rows);
    expect(m.child_engaged_rate).toBe(50);
    expect(m.eating_well_rate).toBe(50);
  });
});

// -- identifyWellbeingCheckinAlerts --------------------------------------------

describe("identifyWellbeingCheckinAlerts", () => {
  it("returns no alerts for empty data", () => {
    expect(identifyWellbeingCheckinAlerts([])).toEqual([]);
  });

  it("critical: very unhappy without follow-up", () => {
    const row = makeRecord({
      id: "vu1",
      mood_rating: "very_unhappy",
      follow_up_needed: false,
    });
    const alerts = identifyWellbeingCheckinAlerts([row]);
    const matched = alerts.filter((a) => a.type === "very_unhappy_no_followup");
    expect(matched).toHaveLength(1);
    expect(matched[0].severity).toBe("critical");
    expect(matched[0].id).toBe("vu1");
  });

  it("high: concerns identified without social worker informed", () => {
    const row = makeRecord({
      id: "ci1",
      concerns_identified: true,
      social_worker_informed: false,
    });
    const alerts = identifyWellbeingCheckinAlerts([row]);
    const matched = alerts.filter((a) => a.type === "concerns_sw_not_informed");
    expect(matched).toHaveLength(1);
    expect(matched[0].severity).toBe("high");
  });

  it("high: child voice not captured", () => {
    const row = makeRecord({ id: "cv1", child_voice_captured: false });
    const alerts = identifyWellbeingCheckinAlerts([row]);
    const matched = alerts.filter((a) => a.type === "voice_not_captured");
    expect(matched).toHaveLength(1);
    expect(matched[0].severity).toBe("high");
  });

  it("medium: not eating well (threshold >= 2)", () => {
    // Only 1 — should NOT trigger
    const alerts1 = identifyWellbeingCheckinAlerts([makeRecord({ id: "e1", eating_well: false })]);
    expect(alerts1.filter((a) => a.type === "not_eating_well")).toHaveLength(0);

    // 2 — should trigger
    const alerts2 = identifyWellbeingCheckinAlerts([
      makeRecord({ id: "e1", eating_well: false }),
      makeRecord({ id: "e2", eating_well: false }),
    ]);
    expect(alerts2.filter((a) => a.type === "not_eating_well")).toHaveLength(1);
    expect(alerts2.filter((a) => a.type === "not_eating_well")[0].severity).toBe("medium");
  });

  it("medium: not sleeping well (threshold >= 2)", () => {
    const alerts = identifyWellbeingCheckinAlerts([
      makeRecord({ id: "s1", sleeping_well: false }),
      makeRecord({ id: "s2", sleeping_well: false }),
    ]);
    expect(alerts.filter((a) => a.type === "not_sleeping_well")).toHaveLength(1);
    expect(alerts.filter((a) => a.type === "not_sleeping_well")[0].severity).toBe("medium");
  });
});
