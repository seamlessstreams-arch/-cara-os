import { describe, it, expect } from "vitest";
import {
  computePatternInsightMetrics,
  identifyPatternInsightAlerts,
} from "./staff-pattern-intelligence-service";
import type { StaffPatternInsightRecord } from "./staff-pattern-intelligence-service";

// -- Factory ------------------------------------------------------------------

function makeRecord(overrides: Partial<StaffPatternInsightRecord> = {}): StaffPatternInsightRecord {
  return {
    id: "rec-1",
    home_id: "home-1",
    staff_name: "Alice Smith",
    staff_id: null,
    insight_type: "repeated_strength",
    insight_severity: "informational",
    confidence_level: "high",
    insight_status: "reviewed",
    session_date: "2026-04-01",
    identified_by: "Cara",
    title: "Strong engagement pattern",
    description: "Consistently high quality engagement",
    evidence_summary: "Multiple daily log entries",
    period_start: null,
    period_end: null,
    context: null,
    alternative_explanations: null,
    manager_notes: null,
    staff_comment: null,
    evidence_verified: true,
    context_provided: true,
    alternative_explanations_considered: true,
    manager_reviewed: true,
    staff_notified: true,
    staff_commented: true,
    action_plan_created: true,
    support_offered: true,
    training_identified: true,
    supervision_discussed: true,
    wellbeing_checked: true,
    recorded_promptly: true,
    issues_found: [],
    actions_taken: [],
    next_review_date: null,
    notes: null,
    created_at: "2026-04-01T00:00:00Z",
    updated_at: "2026-04-01T00:00:00Z",
    ...overrides,
  };
}

// -- computePatternInsightMetrics ---------------------------------------------

describe("computePatternInsightMetrics", () => {
  it("returns zeroes for empty array", () => {
    const m = computePatternInsightMetrics([]);
    expect(m.total_insights).toBe(0);
    expect(m.manager_review_count).toBe(0);
    expect(m.support_recommended_count).toBe(0);
    expect(m.low_confidence_count).toBe(0);
    expect(m.unreviewed_count).toBe(0);
    expect(m.concern_count).toBe(0);
    expect(m.strength_count).toBe(0);
    expect(m.evidence_verified_rate).toBeNull();;
    expect(m.unique_staff).toBe(0);
  });

  it("counts severity and status categories correctly", () => {
    const records = [
      makeRecord({ id: "1", insight_type: "training_gap", insight_severity: "manager_review_required", insight_status: "draft", confidence_level: "low" }),
      makeRecord({ id: "2", insight_type: "burnout_risk", insight_severity: "support_recommended", insight_status: "pending_review", confidence_level: "very_low" }),
      makeRecord({ id: "3", insight_type: "repeated_concern", insight_status: "reviewed" }),
      makeRecord({ id: "4", insight_type: "performance_dip", insight_status: "actioned" }),
      makeRecord({ id: "5", insight_type: "repeated_strength", insight_status: "dismissed" }),
    ];
    const m = computePatternInsightMetrics(records);
    expect(m.total_insights).toBe(5);
    expect(m.manager_review_count).toBe(1);
    expect(m.support_recommended_count).toBe(1);
    expect(m.low_confidence_count).toBe(2);
    expect(m.unreviewed_count).toBe(2); // draft + pending_review
    expect(m.concern_count).toBe(2); // repeated_concern + performance_dip
    expect(m.strength_count).toBe(1);
  });

  it("calculates boolean rates correctly", () => {
    const records = [
      makeRecord({ id: "1", evidence_verified: true, staff_notified: true }),
      makeRecord({ id: "2", evidence_verified: false, staff_notified: false }),
    ];
    const m = computePatternInsightMetrics(records);
    expect(m.evidence_verified_rate).toBe(50);
    expect(m.staff_notified_rate).toBe(50);
  });

  it("counts unique staff", () => {
    const records = [
      makeRecord({ id: "1", staff_name: "Alice" }),
      makeRecord({ id: "2", staff_name: "Bob" }),
      makeRecord({ id: "3", staff_name: "Alice" }),
    ];
    const m = computePatternInsightMetrics(records);
    expect(m.unique_staff).toBe(2);
  });

  it("builds breakdown maps", () => {
    const records = [
      makeRecord({ id: "1", insight_type: "burnout_risk", insight_severity: "support_recommended" }),
      makeRecord({ id: "2", insight_type: "burnout_risk", insight_severity: "informational" }),
      makeRecord({ id: "3", insight_type: "training_gap", insight_severity: "support_recommended" }),
    ];
    const m = computePatternInsightMetrics(records);
    expect(m.by_insight_type).toEqual({ burnout_risk: 2, training_gap: 1 });
    expect(m.by_insight_severity).toEqual({ support_recommended: 2, informational: 1 });
  });

  it("returns 100% rates when all booleans true", () => {
    const records = [makeRecord(), makeRecord({ id: "2" })];
    const m = computePatternInsightMetrics(records);
    expect(m.context_provided_rate).toBe(100);
    expect(m.alternatives_considered_rate).toBe(100);
    expect(m.manager_reviewed_rate).toBe(100);
    expect(m.action_plan_rate).toBe(100);
    expect(m.support_offered_rate).toBe(100);
    expect(m.training_identified_rate).toBe(100);
    expect(m.supervision_discussed_rate).toBe(100);
    expect(m.wellbeing_checked_rate).toBe(100);
    expect(m.recorded_promptly_rate).toBe(100);
  });
});

// -- identifyPatternInsightAlerts ---------------------------------------------

describe("identifyPatternInsightAlerts", () => {
  it("returns no alerts for empty array", () => {
    expect(identifyPatternInsightAlerts([])).toEqual([]);
  });

  it("returns no alerts for fully reviewed records", () => {
    const alerts = identifyPatternInsightAlerts([makeRecord()]);
    expect(alerts).toEqual([]);
  });

  it("fires critical for unreviewed support_recommended insight", () => {
    const records = [
      makeRecord({ id: "r1", insight_severity: "support_recommended", insight_status: "draft", staff_name: "Alice" }),
    ];
    const alerts = identifyPatternInsightAlerts(records);
    const critical = alerts.filter((a) => a.severity === "critical");
    expect(critical.length).toBe(1);
    expect(critical[0].type).toBe("unreviewed_serious");
  });

  it("fires critical for unreviewed manager_review_required insight", () => {
    const records = [
      makeRecord({ id: "r1", insight_severity: "manager_review_required", insight_status: "pending_review" }),
    ];
    const alerts = identifyPatternInsightAlerts(records);
    const critical = alerts.filter((a) => a.type === "unreviewed_serious");
    expect(critical.length).toBe(1);
  });

  it("does NOT fire critical for reviewed high-severity", () => {
    const records = [
      makeRecord({ id: "r1", insight_severity: "manager_review_required", insight_status: "reviewed" }),
    ];
    const alerts = identifyPatternInsightAlerts(records);
    expect(alerts.filter((a) => a.type === "unreviewed_serious").length).toBe(0);
  });

  it("fires high for evidence not verified (>= 1)", () => {
    const records = [makeRecord({ id: "r1", evidence_verified: false })];
    const alerts = identifyPatternInsightAlerts(records);
    const match = alerts.filter((a) => a.type === "no_evidence_verified");
    expect(match.length).toBe(1);
    expect(match[0].severity).toBe("high");
  });

  it("fires high for staff not notified (>= 1)", () => {
    const records = [makeRecord({ id: "r1", staff_notified: false })];
    const alerts = identifyPatternInsightAlerts(records);
    const match = alerts.filter((a) => a.type === "staff_not_notified");
    expect(match.length).toBe(1);
    expect(match[0].severity).toBe("high");
  });

  it("fires medium for alternatives not considered only when >= 2", () => {
    const one = [makeRecord({ id: "r1", alternative_explanations_considered: false })];
    expect(identifyPatternInsightAlerts(one).filter((a) => a.type === "no_alternatives_considered").length).toBe(0);

    const two = [
      makeRecord({ id: "r1", alternative_explanations_considered: false }),
      makeRecord({ id: "r2", alternative_explanations_considered: false }),
    ];
    const alerts = identifyPatternInsightAlerts(two);
    const match = alerts.filter((a) => a.type === "no_alternatives_considered");
    expect(match.length).toBe(1);
    expect(match[0].severity).toBe("medium");
  });

  it("fires medium for wellbeing not checked only when >= 2", () => {
    const one = [makeRecord({ id: "r1", wellbeing_checked: false })];
    expect(identifyPatternInsightAlerts(one).filter((a) => a.type === "no_wellbeing_check").length).toBe(0);

    const two = [
      makeRecord({ id: "r1", wellbeing_checked: false }),
      makeRecord({ id: "r2", wellbeing_checked: false }),
    ];
    const alerts = identifyPatternInsightAlerts(two);
    const match = alerts.filter((a) => a.type === "no_wellbeing_check");
    expect(match.length).toBe(1);
    expect(match[0].severity).toBe("medium");
  });
});
