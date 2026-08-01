import { describe, it, expect } from "vitest";
import {
  computeLearningMetrics,
  identifyLearningAlerts,
} from "./practice-learning-service";
import type { LearningEvent, LearningAction } from "./practice-learning-service";

// -- Factories ----------------------------------------------------------------

const NOW = new Date("2026-05-21T12:00:00Z");

function makeEvent(overrides: Partial<LearningEvent> = {}): LearningEvent {
  return {
    id: "evt-1",
    home_id: "home-1",
    title: "Incident review",
    source: "incident",
    event_date: "2026-05-01",
    identified_by: "Staff A",
    description: "Review of incident",
    root_cause: null,
    learning_points: ["Point 1"],
    priority: "medium",
    linked_event_id: null,
    children_affected: 1,
    staff_involved: ["Staff A"],
    shared_with_team: true,
    date_shared: "2026-05-02",
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

function makeAction(overrides: Partial<LearningAction> = {}): LearningAction {
  return {
    id: "act-1",
    home_id: "home-1",
    learning_event_id: "evt-1",
    action: "Update policy",
    responsible_person: "Manager A",
    target_date: "2026-06-01",
    status: "completed",
    evidence_of_completion: "Policy updated",
    impact_assessment: "significant",
    impact_notes: null,
    date_completed: "2026-05-15",
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-15T00:00:00Z",
    ...overrides,
  };
}

// -- computeLearningMetrics ---------------------------------------------------

describe("computeLearningMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeLearningMetrics([], [], NOW);
    expect(m.total_events).toBe(0);
    expect(m.events_this_quarter).toBe(0);
    expect(m.critical_events).toBe(0);
    expect(m.total_actions).toBe(0);
    expect(m.actions_completed).toBe(0);
    expect(m.actions_overdue).toBe(0);
    expect(m.completion_rate).toBeNull();;
    expect(m.shared_with_team_rate).toBeNull();;
    expect(m.avg_learning_points).toBeNull();;
    expect(m.impact_positive).toBe(0);
    expect(m.impact_not_assessed).toBe(0);
  });

  it("counts events this quarter (within 90 days)", () => {
    const events = [
      makeEvent({ id: "1", event_date: "2026-05-01" }), // within 90 days
      makeEvent({ id: "2", event_date: "2026-01-01" }), // outside 90 days
    ];
    const m = computeLearningMetrics(events, [], NOW);
    expect(m.total_events).toBe(2);
    expect(m.events_this_quarter).toBe(1);
  });

  it("counts critical events", () => {
    const events = [
      makeEvent({ id: "1", priority: "critical" }),
      makeEvent({ id: "2", priority: "medium" }),
    ];
    const m = computeLearningMetrics(events, [], NOW);
    expect(m.critical_events).toBe(1);
  });

  it("computes action completion rate excluding cancelled", () => {
    const actions = [
      makeAction({ id: "1", status: "completed" }),
      makeAction({ id: "2", status: "completed" }),
      makeAction({ id: "3", status: "in_progress" }),
      makeAction({ id: "4", status: "cancelled" }),
    ];
    // 2 completed / 3 active = 66.7%
    const m = computeLearningMetrics([], actions, NOW);
    expect(m.actions_completed).toBe(2);
    expect(m.completion_rate).toBe(66.7);
  });

  it("computes shared_with_team_rate correctly", () => {
    const events = [
      makeEvent({ id: "1", shared_with_team: true }),
      makeEvent({ id: "2", shared_with_team: false }),
    ];
    const m = computeLearningMetrics(events, [], NOW);
    expect(m.shared_with_team_rate).toBe(50);
  });

  it("computes average learning points", () => {
    const events = [
      makeEvent({ id: "1", learning_points: ["a", "b"] }),
      makeEvent({ id: "2", learning_points: ["c"] }),
    ];
    const m = computeLearningMetrics(events, [], NOW);
    expect(m.avg_learning_points).toBe(1.5);
  });

  it("counts positive impacts (transformational, significant, moderate)", () => {
    const actions = [
      makeAction({ id: "1", impact_assessment: "transformational" }),
      makeAction({ id: "2", impact_assessment: "significant" }),
      makeAction({ id: "3", impact_assessment: "moderate" }),
      makeAction({ id: "4", impact_assessment: "minor" }),
      makeAction({ id: "5", impact_assessment: "not_yet_assessed" }),
    ];
    const m = computeLearningMetrics([], actions, NOW);
    expect(m.impact_positive).toBe(3);
    expect(m.impact_not_assessed).toBe(1);
  });

  it("populates by_source and by_priority breakdowns", () => {
    const events = [
      makeEvent({ id: "1", source: "incident", priority: "high" }),
      makeEvent({ id: "2", source: "complaint", priority: "high" }),
      makeEvent({ id: "3", source: "incident", priority: "low" }),
    ];
    const m = computeLearningMetrics(events, [], NOW);
    expect(m.by_source).toEqual({ incident: 2, complaint: 1 });
    expect(m.by_priority).toEqual({ high: 2, low: 1 });
  });
});

// -- identifyLearningAlerts ---------------------------------------------------

describe("identifyLearningAlerts", () => {
  it("returns empty alerts for empty data", () => {
    expect(identifyLearningAlerts([], [], NOW)).toHaveLength(0);
  });

  it("fires high alert for overdue actions", () => {
    const actions = [makeAction({ status: "overdue" })];
    const alerts = identifyLearningAlerts([], actions, NOW);
    expect(alerts.filter((a) => a.type === "action_overdue")).toHaveLength(1);
    expect(alerts[0].severity).toBe("high");
  });

  it("fires medium alert for actions past target date but not marked overdue", () => {
    const actions = [makeAction({ status: "in_progress", target_date: "2026-04-01" })];
    const alerts = identifyLearningAlerts([], actions, NOW);
    expect(alerts.filter((a) => a.type === "action_past_target")).toHaveLength(1);
    expect(alerts[0].severity).toBe("medium");
  });

  it("fires critical alert for critical event not shared with team", () => {
    const events = [makeEvent({ priority: "critical", shared_with_team: false })];
    const alerts = identifyLearningAlerts(events, [], NOW);
    const notShared = alerts.filter((a) => a.type === "learning_not_shared");
    expect(notShared).toHaveLength(1);
    expect(notShared[0].severity).toBe("critical");
  });

  it("fires high alert for high-priority event not shared with team", () => {
    const events = [makeEvent({ priority: "high", shared_with_team: false })];
    const alerts = identifyLearningAlerts(events, [], NOW);
    const notShared = alerts.filter((a) => a.type === "learning_not_shared");
    expect(notShared).toHaveLength(1);
    expect(notShared[0].severity).toBe("high");
  });

  it("fires medium alert for completed action with no impact assessment", () => {
    const actions = [makeAction({ status: "completed", impact_assessment: "not_yet_assessed" })];
    const alerts = identifyLearningAlerts([], actions, NOW);
    expect(alerts.filter((a) => a.type === "no_impact_assessment")).toHaveLength(1);
  });

  it("does NOT fire alert for medium-priority event not shared with team", () => {
    const events = [makeEvent({ priority: "medium", shared_with_team: false })];
    const alerts = identifyLearningAlerts(events, [], NOW);
    expect(alerts.filter((a) => a.type === "learning_not_shared")).toHaveLength(0);
  });
});
