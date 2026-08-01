import { describe, it, expect } from "vitest";
import {
  computeConfidenceIndicatorMetrics,
  identifyConfidenceIndicatorAlerts,
} from "./staff-confidence-indicator-service";
import type { StaffConfidenceIndicatorRecord } from "./staff-confidence-indicator-service";

// -- Factory -------------------------------------------------------------------

function makeRecord(overrides: Partial<StaffConfidenceIndicatorRecord> = {}): StaffConfidenceIndicatorRecord {
  return {
    id: "rec-1",
    home_id: "home-1",
    staff_name: "Lisa Brown",
    staff_id: "staff-1",
    practice_area: "de_escalation",
    confidence_level: "confident",
    trend_direction: "stable",
    assessment_source: "self_assessment",
    session_date: "2026-05-12",
    assessed_by: "Manager",
    confidence_description: "Good confidence",
    evidence_basis: "Observation",
    strengths_observed: null,
    development_needs: null,
    support_provided: null,
    training_linked: null,
    staff_self_reflection: null,
    manager_observation: null,
    previous_confidence_level: null,
    barriers_to_confidence: null,
    approved_by: null,
    approved_at: null,
    next_review_date: null,
    notes: null,
    evidence_based: true,
    staff_self_assessed: true,
    manager_validated: true,
    strengths_discussed: true,
    development_plan_linked: true,
    training_identified: true,
    mentoring_offered: true,
    supervision_discussed: true,
    wellbeing_considered: true,
    progress_tracked: true,
    staff_agreed: true,
    recorded_promptly: true,
    issues_found: [],
    actions_taken: [],
    created_at: "2026-05-12T00:00:00Z",
    updated_at: "2026-05-12T00:00:00Z",
    ...overrides,
  };
}

// -- computeConfidenceIndicatorMetrics -----------------------------------------

describe("computeConfidenceIndicatorMetrics", () => {
  it("returns zeroes for empty records", () => {
    const m = computeConfidenceIndicatorMetrics([]);
    expect(m.total_indicators).toBe(0);
    expect(m.low_confidence_count).toBe(0);
    expect(m.declining_count).toBe(0);
    expect(m.no_confidence_count).toBe(0);
    expect(m.improving_count).toBe(0);
    expect(m.evidence_based_rate).toBeNull();;
    expect(m.self_assessed_rate).toBeNull();;
    expect(m.unique_staff).toBe(0);
  });

  it("counts low_confidence_count (includes low_confidence AND no_confidence)", () => {
    const records = [
      makeRecord({ id: "1", confidence_level: "low_confidence" }),
      makeRecord({ id: "2", confidence_level: "no_confidence" }),
      makeRecord({ id: "3", confidence_level: "confident" }),
    ];
    const m = computeConfidenceIndicatorMetrics(records);
    expect(m.low_confidence_count).toBe(2);
    expect(m.no_confidence_count).toBe(1);
  });

  it("counts declining and improving correctly", () => {
    const records = [
      makeRecord({ id: "1", trend_direction: "declining" }),
      makeRecord({ id: "2", trend_direction: "declining" }),
      makeRecord({ id: "3", trend_direction: "improving" }),
    ];
    const m = computeConfidenceIndicatorMetrics(records);
    expect(m.declining_count).toBe(2);
    expect(m.improving_count).toBe(1);
  });

  it("calculates boolean rates correctly", () => {
    const records = [
      makeRecord({ id: "1", evidence_based: true, mentoring_offered: true }),
      makeRecord({ id: "2", evidence_based: false, mentoring_offered: false }),
    ];
    const m = computeConfidenceIndicatorMetrics(records);
    expect(m.evidence_based_rate).toBe(50);
    expect(m.mentoring_offered_rate).toBe(50);
  });

  it("builds breakdown records", () => {
    const records = [
      makeRecord({ id: "1", practice_area: "safeguarding", confidence_level: "confident" }),
      makeRecord({ id: "2", practice_area: "safeguarding", confidence_level: "low_confidence" }),
      makeRecord({ id: "3", practice_area: "medication", confidence_level: "confident" }),
    ];
    const m = computeConfidenceIndicatorMetrics(records);
    expect(m.by_practice_area).toEqual({ safeguarding: 2, medication: 1 });
    expect(m.by_confidence_level).toEqual({ confident: 2, low_confidence: 1 });
  });
});

// -- identifyConfidenceIndicatorAlerts -----------------------------------------

describe("identifyConfidenceIndicatorAlerts", () => {
  it("returns empty array for empty records", () => {
    expect(identifyConfidenceIndicatorAlerts([])).toEqual([]);
  });

  it("returns empty array for safe records", () => {
    expect(identifyConfidenceIndicatorAlerts([makeRecord()])).toEqual([]);
  });

  it("fires critical alert for no_confidence AND declining trend", () => {
    const records = [makeRecord({ confidence_level: "no_confidence", trend_direction: "declining" })];
    const alerts = identifyConfidenceIndicatorAlerts(records);
    const match = alerts.find((a) => a.type === "no_confidence_declining");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("critical");
  });

  it("does NOT fire no_confidence_declining for no_confidence with stable trend", () => {
    const records = [makeRecord({ confidence_level: "no_confidence", trend_direction: "stable" })];
    const alerts = identifyConfidenceIndicatorAlerts(records);
    const match = alerts.find((a) => a.type === "no_confidence_declining");
    expect(match).toBeUndefined();
  });

  it("fires high alert for low_confidence_no_support (threshold >= 1)", () => {
    const records = [makeRecord({ confidence_level: "low_confidence", development_plan_linked: false })];
    const alerts = identifyConfidenceIndicatorAlerts(records);
    const match = alerts.find((a) => a.type === "low_confidence_no_support");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("high");
  });

  it("fires high alert for no_strengths_discussed (threshold >= 1)", () => {
    const records = [makeRecord({ strengths_discussed: false })];
    const alerts = identifyConfidenceIndicatorAlerts(records);
    const match = alerts.find((a) => a.type === "no_strengths_discussed");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("high");
  });

  it("fires medium alert for no_mentoring_offered (threshold >= 2)", () => {
    const records = [
      makeRecord({ id: "1", mentoring_offered: false }),
      makeRecord({ id: "2", mentoring_offered: false }),
    ];
    const alerts = identifyConfidenceIndicatorAlerts(records);
    const match = alerts.find((a) => a.type === "no_mentoring_offered");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("medium");
  });

  it("does NOT fire no_mentoring_offered with only 1 record", () => {
    const records = [makeRecord({ mentoring_offered: false })];
    const alerts = identifyConfidenceIndicatorAlerts(records);
    const match = alerts.find((a) => a.type === "no_mentoring_offered");
    expect(match).toBeUndefined();
  });

  it("fires medium alert for no_wellbeing_considered (threshold >= 2)", () => {
    const records = [
      makeRecord({ id: "1", wellbeing_considered: false }),
      makeRecord({ id: "2", wellbeing_considered: false }),
    ];
    const alerts = identifyConfidenceIndicatorAlerts(records);
    const match = alerts.find((a) => a.type === "no_wellbeing_considered");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("medium");
  });
});
