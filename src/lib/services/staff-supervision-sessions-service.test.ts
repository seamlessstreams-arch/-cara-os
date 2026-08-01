import { describe, it, expect } from "vitest";
import {
  computeSupervisionSessionMetrics,
  identifySupervisionSessionAlerts,
} from "./staff-supervision-sessions-service";
import type { SupervisionSession } from "./staff-supervision-sessions-service";

// -- Factory ------------------------------------------------------------------

function makeSession(overrides: Partial<SupervisionSession> = {}): SupervisionSession {
  return {
    id: "ss-1",
    home_id: "home-1",
    staff_name: "Mike Roberts",
    staff_id: "staff-1",
    supervisor_name: "Senior B",
    supervision_type: "formal_scheduled",
    session_status: "completed",
    session_date: "2026-04-20",
    next_session_date: "2026-05-20",
    duration_minutes: 60,
    children_discussed: ["Child A"],
    cases_discussed_count: 2,
    safeguarding_discussed: true,
    wellbeing_rating: "good",
    wellbeing_concerns_raised: false,
    actions_set: 3,
    actions_completed_from_last: 2,
    actions_outstanding_from_last: 1,
    training_needs_identified: true,
    reflective_practice_included: true,
    signed_by_supervisee: true,
    notes: null,
    created_at: "2026-04-01T00:00:00Z",
    updated_at: "2026-04-01T00:00:00Z",
    ...overrides,
  };
}

// -- computeSupervisionSessionMetrics -----------------------------------------

describe("computeSupervisionSessionMetrics", () => {
  it("returns zeroes for empty sessions", () => {
    const m = computeSupervisionSessionMetrics([], 5);
    expect(m.total_sessions).toBe(0);
    expect(m.staff_supervised).toBe(0);
    expect(m.supervision_coverage).toBe(0);
    expect(m.completed_count).toBe(0);
    expect(m.cancelled_count).toBe(0);
    expect(m.overdue_count).toBe(0);
    expect(m.completion_rate).toBeNull();
    expect(m.average_duration).toBeNull();
    expect(m.safeguarding_discussed_rate).toBeNull();; expect(m.total_actions_set).toBe(0);
    expect(m.action_completion_rate).toBeNull();; expect(m.wellbeing_concerns_count).toBe(0);
    expect(m.struggling_or_crisis_count).toBe(0);
  });

  it("computes supervision coverage from totalStaff", () => {
    const sessions = [
      makeSession({ staff_id: "s1" }),
      makeSession({ id: "ss-2", staff_id: "s2" }),
    ];
    const m = computeSupervisionSessionMetrics(sessions, 4);
    expect(m.staff_supervised).toBe(2);
    expect(m.supervision_coverage).toBe(50);
  });

  it("counts completed, cancelled, overdue correctly", () => {
    const sessions = [
      makeSession({ id: "1", session_status: "completed" }),
      makeSession({ id: "2", session_status: "cancelled_by_supervisor" }),
      makeSession({ id: "3", session_status: "cancelled_by_supervisee" }),
      makeSession({ id: "4", session_status: "overdue" }),
    ];
    const m = computeSupervisionSessionMetrics(sessions, 4);
    expect(m.completed_count).toBe(1);
    expect(m.cancelled_count).toBe(2);
    expect(m.overdue_count).toBe(1);
  });

  it("computes completion rate", () => {
    const sessions = [
      makeSession({ id: "1", session_status: "completed" }),
      makeSession({ id: "2", session_status: "scheduled" }),
    ];
    const m = computeSupervisionSessionMetrics(sessions, 2);
    expect(m.completion_rate).toBe(50);
  });

  it("computes average duration from completed sessions only", () => {
    const sessions = [
      makeSession({ id: "1", session_status: "completed", duration_minutes: 45 }),
      makeSession({ id: "2", session_status: "completed", duration_minutes: 75 }),
      makeSession({ id: "3", session_status: "overdue", duration_minutes: 0 }),
    ];
    const m = computeSupervisionSessionMetrics(sessions, 3);
    expect(m.average_duration).toBe(60);
  });

  it("computes action completion rate", () => {
    const sessions = [
      makeSession({ id: "1", actions_set: 4, actions_completed_from_last: 2 }),
      makeSession({ id: "2", actions_set: 6, actions_completed_from_last: 3 }),
    ];
    const m = computeSupervisionSessionMetrics(sessions, 2);
    expect(m.total_actions_set).toBe(10);
    expect(m.total_actions_completed).toBe(5);
    expect(m.action_completion_rate).toBe(50);
  });

  it("counts wellbeing concerns and struggling/crisis", () => {
    const sessions = [
      makeSession({ id: "1", wellbeing_concerns_raised: true, wellbeing_rating: "struggling" }),
      makeSession({ id: "2", wellbeing_concerns_raised: false, wellbeing_rating: "crisis" }),
      makeSession({ id: "3", wellbeing_concerns_raised: true, wellbeing_rating: "good" }),
    ];
    const m = computeSupervisionSessionMetrics(sessions, 3);
    expect(m.wellbeing_concerns_count).toBe(2);
    expect(m.struggling_or_crisis_count).toBe(2);
  });
});

// -- identifySupervisionSessionAlerts -----------------------------------------

describe("identifySupervisionSessionAlerts", () => {
  it("returns empty array for empty sessions", () => {
    expect(identifySupervisionSessionAlerts([], 0)).toEqual([]);
  });

  it("fires critical alert for staff in crisis with completed session", () => {
    const sessions = [makeSession({ wellbeing_rating: "crisis", session_status: "completed" })];
    const alerts = identifySupervisionSessionAlerts(sessions, 1);
    const critical = alerts.filter((a) => a.type === "staff_crisis");
    expect(critical).toHaveLength(1);
    expect(critical[0].severity).toBe("critical");
  });

  it("does NOT fire crisis alert for non-completed session", () => {
    const sessions = [makeSession({ wellbeing_rating: "crisis", session_status: "scheduled" })];
    const alerts = identifySupervisionSessionAlerts(sessions, 1);
    expect(alerts.filter((a) => a.type === "staff_crisis")).toHaveLength(0);
  });

  it("fires high alert for overdue sessions (>= 1)", () => {
    const sessions = [makeSession({ session_status: "overdue" })];
    const alerts = identifySupervisionSessionAlerts(sessions, 1);
    expect(alerts.some((a) => a.type === "overdue_sessions" && a.severity === "high")).toBe(true);
  });

  it("fires high alert when staff not supervised (gap > 0)", () => {
    const sessions = [makeSession({ staff_id: "s1" })];
    const alerts = identifySupervisionSessionAlerts(sessions, 3);
    expect(alerts.some((a) => a.type === "not_supervised" && a.severity === "high")).toBe(true);
  });

  it("fires medium alert for high cancellation rate (>30% with >=4 sessions)", () => {
    const sessions = [
      makeSession({ id: "1", session_status: "cancelled_by_supervisor" }),
      makeSession({ id: "2", session_status: "cancelled_by_supervisee" }),
      makeSession({ id: "3", session_status: "completed" }),
      makeSession({ id: "4", session_status: "completed" }),
    ];
    // 2 cancelled out of 4 = 50%, which is > 30%
    const alerts = identifySupervisionSessionAlerts(sessions, 4);
    expect(alerts.some((a) => a.type === "high_cancellation" && a.severity === "medium")).toBe(true);
  });

  it("does NOT fire cancellation alert with < 4 sessions", () => {
    const sessions = [
      makeSession({ id: "1", session_status: "cancelled_by_supervisor" }),
      makeSession({ id: "2", session_status: "cancelled_by_supervisee" }),
      makeSession({ id: "3", session_status: "completed" }),
    ];
    const alerts = identifySupervisionSessionAlerts(sessions, 3);
    expect(alerts.some((a) => a.type === "high_cancellation")).toBe(false);
  });

  it("fires medium alert for safeguarding not discussed in >= 3 completed sessions", () => {
    const sessions = [
      makeSession({ id: "1", session_status: "completed", safeguarding_discussed: false }),
      makeSession({ id: "2", session_status: "completed", safeguarding_discussed: false }),
      makeSession({ id: "3", session_status: "completed", safeguarding_discussed: false }),
    ];
    const alerts = identifySupervisionSessionAlerts(sessions, 3);
    expect(alerts.some((a) => a.type === "safeguarding_not_discussed" && a.severity === "medium")).toBe(true);
  });
});
