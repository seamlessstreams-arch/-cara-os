import { describe, it, expect } from "vitest";
import {
  computeMetrics,
  computeAlerts,
  validateMusicPerformingArts,
  type MusicPerformingArtsRow,
} from "./music-performing-arts-service";

function makeRow(overrides: Partial<MusicPerformingArtsRow> = {}): MusicPerformingArtsRow {
  return {
    id: "row-1",
    home_id: "home-1",
    child_name: "Jordan Lee",
    session_date: "2026-05-10",
    facilitator_name: "Ms Brown",
    activity_type: "Guitar",
    therapeutic_intent: false,
    therapist_qualified: null,
    instrument_provided: true,
    child_choice: true,
    engagement_level: "Engaged",
    emotional_expression: true,
    confidence_building: true,
    social_interaction: true,
    performance_opportunity: false,
    achievement_noted: null,
    group_or_individual: "Individual",
    mood_before: "Neutral",
    mood_after: "Positive",
    linked_to_care_plan: true,
    notes: null,
    created_at: "2026-05-10T00:00:00Z",
    updated_at: "2026-05-10T00:00:00Z",
    ...overrides,
  };
}

// ── computeMetrics ─────────────────────────────────────────────────────

describe("computeMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeMetrics([]);
    expect(m.total_sessions).toBe(0);
    expect(m.unique_children).toBe(0);
    expect(m.engagement_rate).toBeNull();;
    expect(m.mood_improvement_rate).toBeNull();;
    expect(m.average_sessions_per_child).toBeNull();;
  });

  it("counts sessions, unique children, and activity breakdown", () => {
    const rows = [
      makeRow({ id: "r-1", child_name: "Jordan Lee", activity_type: "Guitar" }),
      makeRow({ id: "r-2", child_name: "Jordan Lee", activity_type: "Piano/Keyboard" }),
      makeRow({ id: "r-3", child_name: "Sam Rivers", activity_type: "Guitar" }),
    ];
    const m = computeMetrics(rows);
    expect(m.total_sessions).toBe(3);
    expect(m.unique_children).toBe(2);
    expect(m.by_activity_type["Guitar"]).toBe(2);
    expect(m.by_activity_type["Piano/Keyboard"]).toBe(1);
    expect(m.average_sessions_per_child).toBe(1.5);
  });

  it("computes mood improvement rate correctly", () => {
    const rows = [
      makeRow({ id: "r-1", mood_before: "Low", mood_after: "Positive" }),    // improved
      makeRow({ id: "r-2", mood_before: "Neutral", mood_after: "Neutral" }), // same
    ];
    const m = computeMetrics(rows);
    expect(m.mood_improvement_rate).toBe(50);
  });

  it("computes engagement rate using positive engagement levels", () => {
    const rows = [
      makeRow({ id: "r-1", engagement_level: "Enthusiastic" }),
      makeRow({ id: "r-2", engagement_level: "Engaged" }),
      makeRow({ id: "r-3", engagement_level: "Refused" }),
      makeRow({ id: "r-4", engagement_level: "Participated" }),
    ];
    const m = computeMetrics(rows);
    // 3 of 4 are positive => 75%
    expect(m.engagement_rate).toBe(75);
  });
});

// ── computeAlerts ──────────────────────────────────────────────────────

describe("computeAlerts", () => {
  it("returns no alerts for empty data", () => {
    expect(computeAlerts([])).toHaveLength(0);
  });

  it("flags therapeutic_no_qualified_therapist (critical)", () => {
    const rows = [makeRow({ therapeutic_intent: true, therapist_qualified: false })];
    const alerts = computeAlerts(rows);
    const found = alerts.filter((a) => a.type === "therapeutic_no_qualified_therapist");
    expect(found.length).toBe(1);
    expect(found[0].severity).toBe("critical");
  });

  it("flags performance_without_consent (high)", () => {
    const rows = [makeRow({ performance_opportunity: true, child_choice: false })];
    const alerts = computeAlerts(rows);
    const found = alerts.filter((a) => a.type === "performance_without_consent");
    expect(found.length).toBe(1);
    expect(found[0].severity).toBe("high");
  });

  it("flags repeated_refusal (high) when >= 3 refusals for same child", () => {
    const rows = [
      makeRow({ id: "r-1", child_name: "Jordan Lee", engagement_level: "Refused" }),
      makeRow({ id: "r-2", child_name: "Jordan Lee", engagement_level: "Refused" }),
      makeRow({ id: "r-3", child_name: "Jordan Lee", engagement_level: "Refused" }),
    ];
    const alerts = computeAlerts(rows);
    const found = alerts.filter((a) => a.type === "repeated_refusal");
    expect(found.length).toBe(1);
    expect(found[0].severity).toBe("high");
  });

  it("flags repeated_mood_decline (high) when >= 3 mood declines for same child", () => {
    const rows = [
      makeRow({ id: "r-1", child_name: "Jordan Lee", mood_before: "Positive", mood_after: "Low" }),
      makeRow({ id: "r-2", child_name: "Jordan Lee", mood_before: "Neutral", mood_after: "Low" }),
      makeRow({ id: "r-3", child_name: "Jordan Lee", mood_before: "Positive", mood_after: "Neutral" }),
    ];
    const alerts = computeAlerts(rows);
    const found = alerts.filter((a) => a.type === "repeated_mood_decline");
    expect(found.length).toBe(1);
    expect(found[0].severity).toBe("high");
  });

  it("flags low_care_plan_linkage_therapeutic (high) when < 50% of 3+ therapeutic sessions linked", () => {
    const rows = [
      makeRow({ id: "r-1", therapeutic_intent: true, therapist_qualified: true, linked_to_care_plan: false }),
      makeRow({ id: "r-2", therapeutic_intent: true, therapist_qualified: true, linked_to_care_plan: false }),
      makeRow({ id: "r-3", therapeutic_intent: true, therapist_qualified: true, linked_to_care_plan: false }),
    ];
    const alerts = computeAlerts(rows);
    const found = alerts.filter((a) => a.type === "low_care_plan_linkage_therapeutic");
    expect(found.length).toBe(1);
    expect(found[0].severity).toBe("high");
  });

  it("flags low_child_choice_rate (medium) when < 50% of 5+ sessions", () => {
    const rows = Array.from({ length: 5 }, (_, i) =>
      makeRow({ id: `r-${i}`, child_choice: i < 2 }), // 2 of 5 = 40%
    );
    const alerts = computeAlerts(rows);
    const found = alerts.filter((a) => a.type === "low_child_choice_rate");
    expect(found.length).toBe(1);
    expect(found[0].severity).toBe("medium");
  });
});

// ── validateMusicPerformingArts ─────────────────────────────────────────

describe("validateMusicPerformingArts", () => {
  it("returns valid for correct input", () => {
    const result = validateMusicPerformingArts({
      childName: "Jordan",
      sessionDate: "2026-05-10",
      facilitatorName: "Ms Brown",
      activityType: "Guitar",
      engagementLevel: "Engaged",
      moodBefore: "Neutral",
      moodAfter: "Positive",
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("returns error for therapeutic intent without qualified therapist", () => {
    const result = validateMusicPerformingArts({
      childName: "Jordan",
      sessionDate: "2026-05-10",
      facilitatorName: "Ms Brown",
      activityType: "Music Therapy",
      therapeuticIntent: true,
      therapistQualified: false,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("qualified therapist"))).toBe(true);
  });

  it("returns warning for performance without child choice", () => {
    const result = validateMusicPerformingArts({
      childName: "Jordan",
      sessionDate: "2026-05-10",
      facilitatorName: "Ms Brown",
      activityType: "Drama/Acting",
      performanceOpportunity: true,
      childChoice: false,
    });
    expect(result.valid).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});
