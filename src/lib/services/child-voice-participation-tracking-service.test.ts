import { describe, it, expect } from "vitest";
import {
  computeVoiceParticipationMetrics,
  computeVoiceParticipationAlerts,
  generateVoiceParticipationCaraInsights,
} from "./child-voice-participation-tracking-service";
import type { ChildVoiceParticipationTrackingRow } from "./child-voice-participation-tracking-service";

// -- Factory -------------------------------------------------------------------

function makeRow(overrides: Partial<ChildVoiceParticipationTrackingRow> = {}): ChildVoiceParticipationTrackingRow {
  return {
    id: "vp-1",
    home_id: "home-1",
    child_name: "Alex",
    child_id: "child-1",
    participation_date: "2026-05-20",
    participation_type: "house_meeting",
    voice_outcome: "views_fully_incorporated",
    participation_level: "active",
    feedback_method: "verbal",
    child_prepared_beforehand: true,
    child_understood_process: true,
    child_felt_heard: true,
    outcome_fed_back: true,
    advocate_present: false,
    age_appropriate_methods: true,
    decision_changed_by_voice: false,
    child_satisfied_with_outcome: true,
    facilitator_name: "Staff A",
    child_feedback_verbatim: null,
    notes: null,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

// -- computeVoiceParticipationMetrics ------------------------------------------

describe("computeVoiceParticipationMetrics", () => {
  it("returns zeroed metrics for empty data", () => {
    const m = computeVoiceParticipationMetrics([]);
    expect(m.total_records).toBe(0);
    expect(m.views_not_sought_count).toBe(0);
    expect(m.not_involved_count).toBe(0);
    expect(m.declined_count).toBe(0);
    expect(m.decision_changed_count).toBe(0);
    expect(m.child_felt_heard_rate).toBe(0);
    expect(m.unique_children).toBe(0);
  });

  it("counts outcome categories", () => {
    const rows = [
      makeRow({ id: "1", voice_outcome: "views_not_sought" }),
      makeRow({ id: "2", voice_outcome: "child_declined" }),
      makeRow({ id: "3", participation_level: "not_involved" }),
      makeRow({ id: "4", decision_changed_by_voice: true }),
    ];
    const m = computeVoiceParticipationMetrics(rows);
    expect(m.views_not_sought_count).toBe(1);
    expect(m.declined_count).toBe(1);
    expect(m.not_involved_count).toBe(1);
    expect(m.decision_changed_count).toBe(1);
  });

  it("builds participation type and outcome breakdowns", () => {
    const rows = [
      makeRow({ id: "1", participation_type: "care_plan_review", voice_outcome: "views_fully_incorporated" }),
      makeRow({ id: "2", participation_type: "care_plan_review", voice_outcome: "views_acknowledged" }),
      makeRow({ id: "3", participation_type: "house_meeting", voice_outcome: "views_fully_incorporated" }),
    ];
    const m = computeVoiceParticipationMetrics(rows);
    expect(m.participation_type_breakdown).toEqual({ care_plan_review: 2, house_meeting: 1 });
    expect(m.outcome_breakdown).toEqual({ views_fully_incorporated: 2, views_acknowledged: 1 });
  });

  it("calculates boolean rates", () => {
    const rows = [
      makeRow({ id: "1", child_felt_heard: true, outcome_fed_back: true }),
      makeRow({ id: "2", child_felt_heard: false, outcome_fed_back: false }),
    ];
    const m = computeVoiceParticipationMetrics(rows);
    expect(m.child_felt_heard_rate).toBe(50);
    expect(m.outcome_fed_back_rate).toBe(50);
  });
});

// -- computeVoiceParticipationAlerts -------------------------------------------

describe("computeVoiceParticipationAlerts", () => {
  it("returns no alerts for empty data", () => {
    expect(computeVoiceParticipationAlerts([])).toEqual([]);
  });

  it("critical: views not sought in care_plan_review", () => {
    const row = makeRow({
      id: "c1",
      voice_outcome: "views_not_sought",
      participation_type: "care_plan_review",
    });
    const alerts = computeVoiceParticipationAlerts([row]);
    const matched = alerts.filter((a) => a.type === "views_not_sought_formal");
    expect(matched).toHaveLength(1);
    expect(matched[0].severity).toBe("critical");
  });

  it("critical: views not sought in reg44_visit and reg45_review", () => {
    const rows = [
      makeRow({ id: "1", voice_outcome: "views_not_sought", participation_type: "reg44_visit" }),
      makeRow({ id: "2", voice_outcome: "views_not_sought", participation_type: "reg45_review" }),
    ];
    const alerts = computeVoiceParticipationAlerts(rows);
    const matched = alerts.filter((a) => a.type === "views_not_sought_formal");
    expect(matched).toHaveLength(2);
  });

  it("high: child not felt heard and outcome not fed back", () => {
    const row = makeRow({
      id: "h1",
      child_felt_heard: false,
      outcome_fed_back: false,
    });
    const alerts = computeVoiceParticipationAlerts([row]);
    const matched = alerts.filter((a) => a.type === "not_heard_no_feedback");
    expect(matched).toHaveLength(1);
    expect(matched[0].severity).toBe("high");
  });

  it("high: not_involved in formal review types", () => {
    const row = makeRow({
      id: "ni1",
      participation_level: "not_involved",
      participation_type: "placement_plan",
    });
    const alerts = computeVoiceParticipationAlerts([row]);
    const matched = alerts.filter((a) => a.type === "not_involved_formal_review");
    expect(matched).toHaveLength(1);
    expect(matched[0].severity).toBe("high");
  });

  it("medium: no advocate when unable to participate", () => {
    const row = makeRow({
      id: "na1",
      voice_outcome: "unable_to_participate",
      advocate_present: false,
    });
    const alerts = computeVoiceParticipationAlerts([row]);
    const matched = alerts.filter((a) => a.type === "no_advocate_unable");
    expect(matched).toHaveLength(1);
    expect(matched[0].severity).toBe("medium");
  });

  it("medium: outcome not fed back (excludes views_not_sought, child_declined, unable_to_participate)", () => {
    const row = makeRow({
      id: "of1",
      outcome_fed_back: false,
      voice_outcome: "views_fully_incorporated",
    });
    const alerts = computeVoiceParticipationAlerts([row]);
    const matched = alerts.filter((a) => a.type === "outcome_not_fed_back");
    expect(matched).toHaveLength(1);
    expect(matched[0].severity).toBe("medium");

    // Should NOT trigger for excluded outcomes
    const row2 = makeRow({ id: "of2", outcome_fed_back: false, voice_outcome: "child_declined" });
    const alerts2 = computeVoiceParticipationAlerts([row2]);
    expect(alerts2.filter((a) => a.type === "outcome_not_fed_back")).toHaveLength(0);
  });
});

// -- generateVoiceParticipationCaraInsights ------------------------------------

describe("generateVoiceParticipationCaraInsights", () => {
  it("returns 3 insights for empty data", () => {
    const insights = generateVoiceParticipationCaraInsights([]);
    expect(insights).toHaveLength(3);
    expect(insights[0]).toContain("[violet]");
    expect(insights[2]).toContain("[reflect]");
  });

  it("reports no critical/high when all data is clean", () => {
    const rows = [makeRow()];
    const insights = generateVoiceParticipationCaraInsights(rows);
    expect(insights[1]).toContain("No critical or high-priority concerns");
  });
});
