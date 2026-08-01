import { describe, it, expect } from "vitest";
import {
  computeConsentCapacityMetrics,
  identifyConsentCapacityAlerts,
  type ConsentCapacityMonitoringRecord,
} from "./consent-capacity-monitoring-service";

function makeRecord(overrides: Partial<ConsentCapacityMonitoringRecord> = {}): ConsentCapacityMonitoringRecord {
  return {
    id: "rec-1",
    home_id: "home-1",
    consent_area: "medical_treatment",
    capacity_level: "full_capacity",
    decision_type: "consent_given",
    competence_assessment: "gillick_competent",
    assessment_date: "2026-05-10",
    child_name: "Alex Smith",
    child_id: "child-1",
    assessed_by: "staff-1",
    child_views_sought: true,
    information_provided: true,
    age_appropriate_explanation: true,
    advocacy_offered: true,
    parent_consulted: true,
    social_worker_informed: true,
    best_interest_documented: true,
    decision_respected: true,
    review_date_set: true,
    care_plan_updated: true,
    legal_framework_followed: true,
    recorded_promptly: true,
    issues_found: [],
    actions_taken: [],
    next_review_date: "2026-08-10",
    notes: null,
    created_at: "2026-05-10T08:00:00Z",
    updated_at: "2026-05-10T08:00:00Z",
    ...overrides,
  };
}

describe("computeConsentCapacityMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeConsentCapacityMetrics([]);
    expect(m.total_assessments).toBe(0);
    expect(m.lacks_capacity_count).toBe(0);
    expect(m.child_views_rate).toBeNull();;
    expect(m.unique_children).toBe(0);
  });

  it("counts capacity levels and decision types", () => {
    const records = [
      makeRecord({ id: "r1", capacity_level: "lacks_capacity", decision_type: "best_interest_decision" }),
      makeRecord({ id: "r2", capacity_level: "not_assessed", decision_type: "consent_refused" }),
      makeRecord({ id: "r3", capacity_level: "full_capacity", decision_type: "consent_given", child_name: "Beth Jones" }),
    ];
    const m = computeConsentCapacityMetrics(records);
    expect(m.total_assessments).toBe(3);
    expect(m.lacks_capacity_count).toBe(1);
    expect(m.not_assessed_count).toBe(1);
    expect(m.refused_count).toBe(1);
    expect(m.best_interest_count).toBe(1);
    expect(m.unique_children).toBe(2);
    expect(m.by_capacity_level.lacks_capacity).toBe(1);
    expect(m.by_decision_type.best_interest_decision).toBe(1);
  });

  it("computes boolean rates correctly", () => {
    const records = [
      makeRecord({ id: "r1", child_views_sought: true, advocacy_offered: true }),
      makeRecord({ id: "r2", child_views_sought: false, advocacy_offered: false }),
    ];
    const m = computeConsentCapacityMetrics(records);
    expect(m.child_views_rate).toBe(50);
    expect(m.advocacy_rate).toBe(50);
  });

  it("groups by consent area and competence assessment", () => {
    const records = [
      makeRecord({ id: "r1", consent_area: "medical_treatment", competence_assessment: "gillick_competent" }),
      makeRecord({ id: "r2", consent_area: "data_sharing", competence_assessment: "not_yet_competent" }),
    ];
    const m = computeConsentCapacityMetrics(records);
    expect(m.by_consent_area.medical_treatment).toBe(1);
    expect(m.by_consent_area.data_sharing).toBe(1);
    expect(m.by_competence_assessment.gillick_competent).toBe(1);
    expect(m.by_competence_assessment.not_yet_competent).toBe(1);
  });
});

describe("identifyConsentCapacityAlerts", () => {
  it("returns empty alerts for empty data", () => {
    const alerts = identifyConsentCapacityAlerts([]);
    expect(alerts).toEqual([]);
  });

  it("flags best interest decision without documentation", () => {
    const records = [
      makeRecord({ decision_type: "best_interest_decision", best_interest_documented: false }),
    ];
    const alerts = identifyConsentCapacityAlerts(records);
    const biAlerts = alerts.filter((a) => a.type === "best_interest_not_documented");
    expect(biAlerts).toHaveLength(1);
    expect(biAlerts[0].severity).toBe("critical");
  });

  it("does not flag documented best interest decision", () => {
    const records = [
      makeRecord({ decision_type: "best_interest_decision", best_interest_documented: true }),
    ];
    const alerts = identifyConsentCapacityAlerts(records);
    const biAlerts = alerts.filter((a) => a.type === "best_interest_not_documented");
    expect(biAlerts).toHaveLength(0);
  });

  it("flags decision not respected (>=1)", () => {
    const records = [makeRecord({ decision_respected: false })];
    const alerts = identifyConsentCapacityAlerts(records);
    const drAlerts = alerts.filter((a) => a.type === "decision_not_respected");
    expect(drAlerts).toHaveLength(1);
    expect(drAlerts[0].severity).toBe("high");
  });

  it("flags advocacy not offered (>=1)", () => {
    const records = [makeRecord({ advocacy_offered: false })];
    const alerts = identifyConsentCapacityAlerts(records);
    const advAlerts = alerts.filter((a) => a.type === "advocacy_not_offered");
    expect(advAlerts).toHaveLength(1);
    expect(advAlerts[0].severity).toBe("high");
  });

  it("flags information not provided (>=2)", () => {
    const records = [
      makeRecord({ id: "r1", information_provided: false }),
      makeRecord({ id: "r2", information_provided: false }),
    ];
    const alerts = identifyConsentCapacityAlerts(records);
    const infoAlerts = alerts.filter((a) => a.type === "information_not_provided");
    expect(infoAlerts).toHaveLength(1);
    expect(infoAlerts[0].severity).toBe("medium");
  });

  it("flags review date not set (>=2)", () => {
    const records = [
      makeRecord({ id: "r1", review_date_set: false }),
      makeRecord({ id: "r2", review_date_set: false }),
    ];
    const alerts = identifyConsentCapacityAlerts(records);
    const reviewAlerts = alerts.filter((a) => a.type === "review_date_not_set");
    expect(reviewAlerts).toHaveLength(1);
    expect(reviewAlerts[0].severity).toBe("medium");
  });

  it("does not flag information not provided with only 1 record", () => {
    const records = [makeRecord({ information_provided: false })];
    const alerts = identifyConsentCapacityAlerts(records);
    const infoAlerts = alerts.filter((a) => a.type === "information_not_provided");
    expect(infoAlerts).toHaveLength(0);
  });
});
