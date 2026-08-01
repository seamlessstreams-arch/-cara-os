import { describe, it, expect } from "vitest";
import {
  computeChildrensTherapyMetrics,
  identifyChildrensTherapyAlerts,
} from "./childrens-therapy-sessions-service";
import type { ChildrensTherapySessionRecord } from "./childrens-therapy-sessions-service";

// -- Factory Function ---------------------------------------------------------

function makeRecord(overrides: Partial<ChildrensTherapySessionRecord> = {}): ChildrensTherapySessionRecord {
  return {
    id: "ts-1",
    home_id: "home-1",
    therapy_type: "cbt",
    session_outcome: "positive_progress",
    child_engagement: "fully_engaged",
    therapy_frequency: "weekly",
    session_date: "2026-05-15",
    child_name: "Alex",
    child_id: "c1",
    therapist_name: "Dr. Smith",
    child_prepared: true,
    transport_arranged: true,
    consent_current: true,
    feedback_obtained: true,
    care_plan_updated: true,
    social_worker_informed: true,
    progress_documented: true,
    goals_reviewed: true,
    staff_briefed: true,
    follow_up_actions: true,
    child_debriefed: true,
    multi_agency_liaison: false,
    issues_found: [],
    actions_taken: [],
    session_duration_minutes: 50,
    next_session_date: "2026-05-22",
    notes: null,
    created_at: "2026-05-15T00:00:00Z",
    updated_at: "2026-05-15T00:00:00Z",
    ...overrides,
  };
}

// -- computeChildrensTherapyMetrics -------------------------------------------

describe("computeChildrensTherapyMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeChildrensTherapyMetrics([]);
    expect(m.total_sessions).toBe(0);
    expect(m.positive_progress_count).toBe(0);
    expect(m.declined_count).toBe(0);
    expect(m.refused_count).toBe(0);
    expect(m.child_prepared_rate).toBeNull();;
    expect(m.average_duration).toBeNull();;
    expect(m.unique_children).toBe(0);
  });

  it("computes populated metrics correctly", () => {
    const records = [
      makeRecord({ session_outcome: "positive_progress", child_engagement: "fully_engaged", session_duration_minutes: 50 }),
      makeRecord({
        id: "ts-2",
        child_name: "Beth",
        session_outcome: "session_declined",
        child_engagement: "refused",
        session_duration_minutes: 0,
        child_prepared: false,
        progress_documented: false,
        child_debriefed: false,
        care_plan_updated: false,
        goals_reviewed: false,
      }),
      makeRecord({
        id: "ts-3",
        child_name: "Chris",
        session_outcome: "session_cancelled",
        child_engagement: "not_assessed",
        session_duration_minutes: 0,
      }),
    ];
    const m = computeChildrensTherapyMetrics(records);

    expect(m.total_sessions).toBe(3);
    expect(m.positive_progress_count).toBe(1);
    expect(m.declined_count).toBe(1);
    expect(m.cancelled_count).toBe(1);
    expect(m.refused_count).toBe(1);
    expect(m.unique_children).toBe(3);
    // avg duration: (50+0+0)/3 = 16.7
    expect(m.average_duration).toBe(16.7);
    // 2/3 child prepared
    expect(m.child_prepared_rate).toBe(66.7);
    // 2/3 progress documented
    expect(m.progress_documented_rate).toBe(66.7);
    expect(m.by_therapy_type).toEqual({ cbt: 3 });
    expect(m.by_session_outcome).toEqual({
      positive_progress: 1,
      session_declined: 1,
      session_cancelled: 1,
    });
  });

  it("computes breakdowns by therapy frequency", () => {
    const records = [
      makeRecord({ therapy_frequency: "weekly" }),
      makeRecord({ id: "ts-2", therapy_frequency: "fortnightly" }),
    ];
    const m = computeChildrensTherapyMetrics(records);
    expect(m.by_therapy_frequency).toEqual({ weekly: 1, fortnightly: 1 });
  });
});

// -- identifyChildrensTherapyAlerts -------------------------------------------

describe("identifyChildrensTherapyAlerts", () => {
  it("returns no alerts for empty data", () => {
    const alerts = identifyChildrensTherapyAlerts([]);
    expect(alerts).toHaveLength(0);
  });

  it("fires refused_no_consent for refused engagement + no consent", () => {
    const records = [makeRecord({ child_engagement: "refused", consent_current: false })];
    const alerts = identifyChildrensTherapyAlerts(records);
    expect(alerts.some((a) => a.type === "refused_no_consent" && a.severity === "critical")).toBe(true);
  });

  it("fires progress_not_documented when >= 1 session has no progress documented", () => {
    const records = [makeRecord({ progress_documented: false })];
    const alerts = identifyChildrensTherapyAlerts(records);
    expect(alerts.some((a) => a.type === "progress_not_documented" && a.severity === "high")).toBe(true);
  });

  it("fires child_not_debriefed when >= 1 session has no debrief", () => {
    const records = [makeRecord({ child_debriefed: false })];
    const alerts = identifyChildrensTherapyAlerts(records);
    expect(alerts.some((a) => a.type === "child_not_debriefed" && a.severity === "high")).toBe(true);
  });

  it("fires care_plan_not_updated when >= 2 sessions without plan update", () => {
    const records = [
      makeRecord({ id: "ts-1", care_plan_updated: false }),
      makeRecord({ id: "ts-2", care_plan_updated: false }),
    ];
    const alerts = identifyChildrensTherapyAlerts(records);
    expect(alerts.some((a) => a.type === "care_plan_not_updated" && a.severity === "medium")).toBe(true);
  });

  it("does NOT fire care_plan_not_updated when only 1 session without plan update", () => {
    const records = [makeRecord({ care_plan_updated: false })];
    const alerts = identifyChildrensTherapyAlerts(records);
    expect(alerts.some((a) => a.type === "care_plan_not_updated")).toBe(false);
  });

  it("fires goals_not_reviewed when >= 3 sessions without goals review", () => {
    const records = [
      makeRecord({ id: "ts-1", goals_reviewed: false }),
      makeRecord({ id: "ts-2", goals_reviewed: false }),
      makeRecord({ id: "ts-3", goals_reviewed: false }),
    ];
    const alerts = identifyChildrensTherapyAlerts(records);
    expect(alerts.some((a) => a.type === "goals_not_reviewed" && a.severity === "medium")).toBe(true);
  });

  it("does NOT fire goals_not_reviewed when only 2 sessions without goals review", () => {
    const records = [
      makeRecord({ id: "ts-1", goals_reviewed: false }),
      makeRecord({ id: "ts-2", goals_reviewed: false }),
    ];
    const alerts = identifyChildrensTherapyAlerts(records);
    expect(alerts.some((a) => a.type === "goals_not_reviewed")).toBe(false);
  });

  it("does NOT fire refused_no_consent when refused but consent IS current", () => {
    const records = [makeRecord({ child_engagement: "refused", consent_current: true })];
    const alerts = identifyChildrensTherapyAlerts(records);
    expect(alerts.some((a) => a.type === "refused_no_consent")).toBe(false);
  });
});
