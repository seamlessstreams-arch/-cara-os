// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — PRACTICE LEARNING SERVICE TESTS
// Pure-function tests for learning metrics computation, alert identification,
// constant validation, and CRUD fallback behaviour.
// CHR 2015 Reg 45 (review of quality of care — learning from events),
// Reg 13 (leadership — learning culture),
// Reg 40 (notifications — learning from notifiable events).
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeAll } from "vitest";
import {
  _testing,
  LEARNING_SOURCES,
  LEARNING_PRIORITIES,
  ACTION_STATUSES,
  IMPACT_LEVELS,
} from "../practice-learning-service";
import type {
  LearningEvent,
  LearningAction,
  LearningSource,
  LearningPriority,
  ActionStatus,
  ImpactLevel,
} from "../practice-learning-service";

const { computeLearningMetrics, identifyLearningAlerts } = _testing;

// ── Fixed reference date ──────────────────────────────────────────────────
const NOW = new Date("2026-05-13");

// ── Factory helpers ───────────────────────────────────────────────────────

function makeLearningEvent(
  overrides: Partial<LearningEvent> = {},
): LearningEvent {
  return {
    id: crypto.randomUUID(),
    home_id: "home-1",
    title: "Test Learning Event",
    source: "incident",
    event_date: "2026-05-01",
    identified_by: "staff-1",
    description: "A test event description",
    root_cause: null,
    learning_points: ["Point A", "Point B"],
    priority: "medium",
    linked_event_id: null,
    children_affected: 1,
    staff_involved: ["staff-1"],
    shared_with_team: false,
    date_shared: null,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

function makeLearningAction(
  overrides: Partial<LearningAction> = {},
): LearningAction {
  return {
    id: crypto.randomUUID(),
    home_id: "home-1",
    learning_event_id: "event-1",
    action: "Test Action",
    responsible_person: "Staff Member",
    target_date: "2026-06-01",
    status: "not_started",
    evidence_of_completion: null,
    impact_assessment: "not_yet_assessed",
    impact_notes: null,
    date_completed: null,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// 1. CONSTANTS
// ══════════════════════════════════════════════════════════════════════════════

describe("Constants", () => {
  // ── LEARNING_SOURCES ──────────────────────────────────────────────────
  describe("LEARNING_SOURCES", () => {
    it("contains exactly 14 items", () => {
      expect(LEARNING_SOURCES).toHaveLength(14);
    });

    it("has unique source values", () => {
      const sources = LEARNING_SOURCES.map((s) => s.source);
      expect(new Set(sources).size).toBe(sources.length);
    });

    it("includes all expected source values", () => {
      const expectedSources: string[] = [
        "incident", "complaint", "safeguarding_concern", "near_miss",
        "serious_case_review", "reg44_visit", "reg45_review", "ofsted_inspection",
        "staff_feedback", "child_feedback", "audit", "training",
        "external_review", "other",
      ];
      const actual = LEARNING_SOURCES.map((s) => s.source);
      for (const src of expectedSources) {
        expect(actual).toContain(src);
      }
    });

    it("has non-empty labels for all sources", () => {
      for (const entry of LEARNING_SOURCES) {
        expect(entry.label.length).toBeGreaterThan(0);
      }
    });

    it("maps 'incident' to label 'Incident'", () => {
      expect(LEARNING_SOURCES.find((s) => s.source === "incident")!.label).toBe("Incident");
    });

    it("maps 'safeguarding_concern' to label 'Safeguarding Concern'", () => {
      expect(LEARNING_SOURCES.find((s) => s.source === "safeguarding_concern")!.label).toBe("Safeguarding Concern");
    });

    it("maps 'serious_case_review' to label 'Serious Case Review'", () => {
      expect(LEARNING_SOURCES.find((s) => s.source === "serious_case_review")!.label).toBe("Serious Case Review");
    });

    it("maps 'reg44_visit' to label 'Reg 44 Visit'", () => {
      expect(LEARNING_SOURCES.find((s) => s.source === "reg44_visit")!.label).toBe("Reg 44 Visit");
    });

    it("maps 'ofsted_inspection' to label 'Ofsted Inspection'", () => {
      expect(LEARNING_SOURCES.find((s) => s.source === "ofsted_inspection")!.label).toBe("Ofsted Inspection");
    });
  });

  // ── LEARNING_PRIORITIES ──────────────────────────────────────────────
  describe("LEARNING_PRIORITIES", () => {
    it("contains exactly 4 items", () => {
      expect(LEARNING_PRIORITIES).toHaveLength(4);
    });

    it("has unique priority values", () => {
      const priorities = LEARNING_PRIORITIES.map((p) => p.priority);
      expect(new Set(priorities).size).toBe(priorities.length);
    });

    it("includes 'critical'", () => {
      expect(LEARNING_PRIORITIES.find((p) => p.priority === "critical")).toBeDefined();
    });

    it("includes 'high'", () => {
      expect(LEARNING_PRIORITIES.find((p) => p.priority === "high")).toBeDefined();
    });

    it("includes 'medium'", () => {
      expect(LEARNING_PRIORITIES.find((p) => p.priority === "medium")).toBeDefined();
    });

    it("includes 'low'", () => {
      expect(LEARNING_PRIORITIES.find((p) => p.priority === "low")).toBeDefined();
    });

    it("has non-empty labels for all priorities", () => {
      for (const entry of LEARNING_PRIORITIES) {
        expect(entry.label.length).toBeGreaterThan(0);
      }
    });

    it("maps 'critical' to label 'Critical'", () => {
      expect(LEARNING_PRIORITIES.find((p) => p.priority === "critical")!.label).toBe("Critical");
    });

    it("maps 'low' to label 'Low'", () => {
      expect(LEARNING_PRIORITIES.find((p) => p.priority === "low")!.label).toBe("Low");
    });
  });

  // ── ACTION_STATUSES ──────────────────────────────────────────────────
  describe("ACTION_STATUSES", () => {
    it("contains exactly 5 items", () => {
      expect(ACTION_STATUSES).toHaveLength(5);
    });

    it("has unique status values", () => {
      const statuses = ACTION_STATUSES.map((s) => s.status);
      expect(new Set(statuses).size).toBe(statuses.length);
    });

    it("includes 'not_started'", () => {
      expect(ACTION_STATUSES.find((s) => s.status === "not_started")).toBeDefined();
    });

    it("includes 'in_progress'", () => {
      expect(ACTION_STATUSES.find((s) => s.status === "in_progress")).toBeDefined();
    });

    it("includes 'completed'", () => {
      expect(ACTION_STATUSES.find((s) => s.status === "completed")).toBeDefined();
    });

    it("includes 'overdue'", () => {
      expect(ACTION_STATUSES.find((s) => s.status === "overdue")).toBeDefined();
    });

    it("includes 'cancelled'", () => {
      expect(ACTION_STATUSES.find((s) => s.status === "cancelled")).toBeDefined();
    });

    it("has non-empty labels for all statuses", () => {
      for (const entry of ACTION_STATUSES) {
        expect(entry.label.length).toBeGreaterThan(0);
      }
    });

    it("maps 'not_started' to label 'Not Started'", () => {
      expect(ACTION_STATUSES.find((s) => s.status === "not_started")!.label).toBe("Not Started");
    });

    it("maps 'in_progress' to label 'In Progress'", () => {
      expect(ACTION_STATUSES.find((s) => s.status === "in_progress")!.label).toBe("In Progress");
    });

    it("maps 'cancelled' to label 'Cancelled'", () => {
      expect(ACTION_STATUSES.find((s) => s.status === "cancelled")!.label).toBe("Cancelled");
    });
  });

  // ── IMPACT_LEVELS ────────────────────────────────────────────────────
  describe("IMPACT_LEVELS", () => {
    it("contains exactly 5 items", () => {
      expect(IMPACT_LEVELS).toHaveLength(5);
    });

    it("has unique level values", () => {
      const levels = IMPACT_LEVELS.map((l) => l.level);
      expect(new Set(levels).size).toBe(levels.length);
    });

    it("includes 'transformational'", () => {
      expect(IMPACT_LEVELS.find((l) => l.level === "transformational")).toBeDefined();
    });

    it("includes 'significant'", () => {
      expect(IMPACT_LEVELS.find((l) => l.level === "significant")).toBeDefined();
    });

    it("includes 'moderate'", () => {
      expect(IMPACT_LEVELS.find((l) => l.level === "moderate")).toBeDefined();
    });

    it("includes 'minor'", () => {
      expect(IMPACT_LEVELS.find((l) => l.level === "minor")).toBeDefined();
    });

    it("includes 'not_yet_assessed'", () => {
      expect(IMPACT_LEVELS.find((l) => l.level === "not_yet_assessed")).toBeDefined();
    });

    it("has non-empty labels for all levels", () => {
      for (const entry of IMPACT_LEVELS) {
        expect(entry.label.length).toBeGreaterThan(0);
      }
    });

    it("maps 'transformational' to label 'Transformational'", () => {
      expect(IMPACT_LEVELS.find((l) => l.level === "transformational")!.label).toBe("Transformational");
    });

    it("maps 'not_yet_assessed' to label 'Not Yet Assessed'", () => {
      expect(IMPACT_LEVELS.find((l) => l.level === "not_yet_assessed")!.label).toBe("Not Yet Assessed");
    });

    it("maps 'minor' to label 'Minor'", () => {
      expect(IMPACT_LEVELS.find((l) => l.level === "minor")!.label).toBe("Minor");
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. computeLearningMetrics
// ══════════════════════════════════════════════════════════════════════════════

describe("computeLearningMetrics", () => {
  // ── Empty inputs ──────────────────────────────────────────────────────
  describe("empty inputs", () => {
    it("returns zeroes for all numeric fields with empty arrays", () => {
      const m = computeLearningMetrics([], [], NOW);
      expect(m.total_events).toBe(0);
      expect(m.events_this_quarter).toBe(0);
      expect(m.critical_events).toBe(0);
      expect(m.total_actions).toBe(0);
      expect(m.actions_completed).toBe(0);
      expect(m.actions_overdue).toBe(0);
      expect(m.actions_in_progress).toBe(0);
      expect(m.completion_rate).toBe(0);
      expect(m.shared_with_team_rate).toBe(0);
      expect(m.avg_learning_points).toBe(0);
      expect(m.impact_positive).toBe(0);
      expect(m.impact_not_assessed).toBe(0);
    });

    it("returns empty objects for grouping fields with empty arrays", () => {
      const m = computeLearningMetrics([], [], NOW);
      expect(m.by_source).toEqual({});
      expect(m.by_priority).toEqual({});
      expect(m.by_action_status).toEqual({});
      expect(m.by_impact).toEqual({});
    });
  });

  // ── total_events ──────────────────────────────────────────────────────
  describe("total_events", () => {
    it("counts a single event", () => {
      const m = computeLearningMetrics([makeLearningEvent()], [], NOW);
      expect(m.total_events).toBe(1);
    });

    it("counts multiple events", () => {
      const events = [makeLearningEvent(), makeLearningEvent(), makeLearningEvent()];
      const m = computeLearningMetrics(events, [], NOW);
      expect(m.total_events).toBe(3);
    });
  });

  // ── events_this_quarter (90-day window) ──────────────────────────────
  describe("events_this_quarter", () => {
    it("includes event within the 90-day window", () => {
      const e = makeLearningEvent({ event_date: "2026-04-01" });
      const m = computeLearningMetrics([e], [], NOW);
      expect(m.events_this_quarter).toBe(1);
    });

    it("excludes event older than 90 days", () => {
      const e = makeLearningEvent({ event_date: "2026-01-01" });
      const m = computeLearningMetrics([e], [], NOW);
      expect(m.events_this_quarter).toBe(0);
    });

    it("includes event one day inside the 90-day boundary", () => {
      // 90 days before 2026-05-13 midnight UTC is 2026-02-12 midnight UTC
      // 2026-02-13 is safely within the window
      const e = makeLearningEvent({ event_date: "2026-02-13" });
      const m = computeLearningMetrics([e], [], NOW);
      expect(m.events_this_quarter).toBe(1);
    });

    it("excludes event clearly before the 90-day boundary", () => {
      const e = makeLearningEvent({ event_date: "2026-02-10" });
      const m = computeLearningMetrics([e], [], NOW);
      expect(m.events_this_quarter).toBe(0);
    });

    it("includes event on the current date (today)", () => {
      const e = makeLearningEvent({ event_date: "2026-05-13" });
      const m = computeLearningMetrics([e], [], NOW);
      expect(m.events_this_quarter).toBe(1);
    });

    it("excludes future events beyond now", () => {
      const e = makeLearningEvent({ event_date: "2026-05-14" });
      const m = computeLearningMetrics([e], [], NOW);
      expect(m.events_this_quarter).toBe(0);
    });

    it("counts mixed events correctly", () => {
      const events = [
        makeLearningEvent({ event_date: "2026-05-01" }), // within
        makeLearningEvent({ event_date: "2026-03-15" }), // within
        makeLearningEvent({ event_date: "2026-01-01" }), // outside
      ];
      const m = computeLearningMetrics(events, [], NOW);
      expect(m.events_this_quarter).toBe(2);
    });
  });

  // ── critical_events ──────────────────────────────────────────────────
  describe("critical_events", () => {
    it("counts critical priority events", () => {
      const events = [
        makeLearningEvent({ priority: "critical" }),
        makeLearningEvent({ priority: "high" }),
        makeLearningEvent({ priority: "critical" }),
      ];
      const m = computeLearningMetrics(events, [], NOW);
      expect(m.critical_events).toBe(2);
    });

    it("returns 0 when no critical events exist", () => {
      const events = [makeLearningEvent({ priority: "low" })];
      const m = computeLearningMetrics(events, [], NOW);
      expect(m.critical_events).toBe(0);
    });
  });

  // ── total_actions ────────────────────────────────────────────────────
  describe("total_actions", () => {
    it("counts all actions", () => {
      const actions = [makeLearningAction(), makeLearningAction()];
      const m = computeLearningMetrics([], actions, NOW);
      expect(m.total_actions).toBe(2);
    });

    it("returns 0 with no actions", () => {
      const m = computeLearningMetrics([], [], NOW);
      expect(m.total_actions).toBe(0);
    });
  });

  // ── actions_completed ────────────────────────────────────────────────
  describe("actions_completed", () => {
    it("counts completed actions", () => {
      const actions = [
        makeLearningAction({ status: "completed" }),
        makeLearningAction({ status: "completed" }),
        makeLearningAction({ status: "in_progress" }),
      ];
      const m = computeLearningMetrics([], actions, NOW);
      expect(m.actions_completed).toBe(2);
    });

    it("returns 0 when none completed", () => {
      const actions = [makeLearningAction({ status: "not_started" })];
      const m = computeLearningMetrics([], actions, NOW);
      expect(m.actions_completed).toBe(0);
    });
  });

  // ── actions_overdue ──────────────────────────────────────────────────
  describe("actions_overdue", () => {
    it("counts overdue actions", () => {
      const actions = [
        makeLearningAction({ status: "overdue" }),
        makeLearningAction({ status: "overdue" }),
        makeLearningAction({ status: "completed" }),
      ];
      const m = computeLearningMetrics([], actions, NOW);
      expect(m.actions_overdue).toBe(2);
    });

    it("returns 0 when none overdue", () => {
      const actions = [makeLearningAction({ status: "completed" })];
      const m = computeLearningMetrics([], actions, NOW);
      expect(m.actions_overdue).toBe(0);
    });
  });

  // ── actions_in_progress ──────────────────────────────────────────────
  describe("actions_in_progress", () => {
    it("counts in-progress actions", () => {
      const actions = [
        makeLearningAction({ status: "in_progress" }),
        makeLearningAction({ status: "completed" }),
        makeLearningAction({ status: "in_progress" }),
      ];
      const m = computeLearningMetrics([], actions, NOW);
      expect(m.actions_in_progress).toBe(2);
    });

    it("returns 0 when none in progress", () => {
      const actions = [makeLearningAction({ status: "not_started" })];
      const m = computeLearningMetrics([], actions, NOW);
      expect(m.actions_in_progress).toBe(0);
    });
  });

  // ── completion_rate ──────────────────────────────────────────────────
  describe("completion_rate", () => {
    it("calculates correct rate with all completed", () => {
      const actions = [
        makeLearningAction({ status: "completed" }),
        makeLearningAction({ status: "completed" }),
      ];
      const m = computeLearningMetrics([], actions, NOW);
      expect(m.completion_rate).toBe(100);
    });

    it("calculates correct rate with mixed statuses", () => {
      // 1 completed out of 4 active (not cancelled) = 25%
      const actions = [
        makeLearningAction({ status: "completed" }),
        makeLearningAction({ status: "not_started" }),
        makeLearningAction({ status: "in_progress" }),
        makeLearningAction({ status: "overdue" }),
      ];
      const m = computeLearningMetrics([], actions, NOW);
      expect(m.completion_rate).toBe(25);
    });

    it("excludes cancelled actions from calculation", () => {
      // 1 completed, 1 not_started, 1 cancelled => active=2, rate=50%
      const actions = [
        makeLearningAction({ status: "completed" }),
        makeLearningAction({ status: "not_started" }),
        makeLearningAction({ status: "cancelled" }),
      ];
      const m = computeLearningMetrics([], actions, NOW);
      expect(m.completion_rate).toBe(50);
    });

    it("returns 0 when no active actions", () => {
      const actions = [makeLearningAction({ status: "cancelled" })];
      const m = computeLearningMetrics([], actions, NOW);
      // active = 0, so completion_rate = 0
      expect(m.completion_rate).toBe(0);
    });

    it("rounds to one decimal place", () => {
      // 1 completed out of 3 active = 33.333...% => 33.3
      const actions = [
        makeLearningAction({ status: "completed" }),
        makeLearningAction({ status: "not_started" }),
        makeLearningAction({ status: "in_progress" }),
      ];
      const m = computeLearningMetrics([], actions, NOW);
      expect(m.completion_rate).toBe(33.3);
    });

    it("handles 2 out of 3 active (66.7%)", () => {
      const actions = [
        makeLearningAction({ status: "completed" }),
        makeLearningAction({ status: "completed" }),
        makeLearningAction({ status: "in_progress" }),
      ];
      const m = computeLearningMetrics([], actions, NOW);
      expect(m.completion_rate).toBe(66.7);
    });
  });

  // ── shared_with_team_rate ────────────────────────────────────────────
  describe("shared_with_team_rate", () => {
    it("calculates 100% when all shared", () => {
      const events = [
        makeLearningEvent({ shared_with_team: true }),
        makeLearningEvent({ shared_with_team: true }),
      ];
      const m = computeLearningMetrics(events, [], NOW);
      expect(m.shared_with_team_rate).toBe(100);
    });

    it("calculates 0% when none shared", () => {
      const events = [
        makeLearningEvent({ shared_with_team: false }),
        makeLearningEvent({ shared_with_team: false }),
      ];
      const m = computeLearningMetrics(events, [], NOW);
      expect(m.shared_with_team_rate).toBe(0);
    });

    it("calculates mixed rate correctly", () => {
      const events = [
        makeLearningEvent({ shared_with_team: true }),
        makeLearningEvent({ shared_with_team: false }),
        makeLearningEvent({ shared_with_team: false }),
      ];
      const m = computeLearningMetrics(events, [], NOW);
      expect(m.shared_with_team_rate).toBe(33.3);
    });

    it("returns 0 with no events", () => {
      const m = computeLearningMetrics([], [], NOW);
      expect(m.shared_with_team_rate).toBe(0);
    });
  });

  // ── avg_learning_points ──────────────────────────────────────────────
  describe("avg_learning_points", () => {
    it("calculates average correctly", () => {
      const events = [
        makeLearningEvent({ learning_points: ["A", "B", "C"] }),
        makeLearningEvent({ learning_points: ["X"] }),
      ];
      // (3 + 1) / 2 = 2.0
      const m = computeLearningMetrics(events, [], NOW);
      expect(m.avg_learning_points).toBe(2);
    });

    it("handles empty learning_points arrays", () => {
      const events = [
        makeLearningEvent({ learning_points: [] }),
        makeLearningEvent({ learning_points: [] }),
      ];
      const m = computeLearningMetrics(events, [], NOW);
      expect(m.avg_learning_points).toBe(0);
    });

    it("rounds to one decimal place", () => {
      const events = [
        makeLearningEvent({ learning_points: ["A", "B", "C"] }),
        makeLearningEvent({ learning_points: ["X", "Y"] }),
        makeLearningEvent({ learning_points: ["Z"] }),
      ];
      // (3 + 2 + 1) / 3 = 2.0
      const m = computeLearningMetrics(events, [], NOW);
      expect(m.avg_learning_points).toBe(2);
    });

    it("handles single event", () => {
      const events = [makeLearningEvent({ learning_points: ["A", "B", "C", "D", "E"] })];
      const m = computeLearningMetrics(events, [], NOW);
      expect(m.avg_learning_points).toBe(5);
    });

    it("returns 0 with no events", () => {
      const m = computeLearningMetrics([], [], NOW);
      expect(m.avg_learning_points).toBe(0);
    });
  });

  // ── impact_positive ──────────────────────────────────────────────────
  describe("impact_positive", () => {
    it("counts transformational as positive", () => {
      const actions = [makeLearningAction({ impact_assessment: "transformational" })];
      const m = computeLearningMetrics([], actions, NOW);
      expect(m.impact_positive).toBe(1);
    });

    it("counts significant as positive", () => {
      const actions = [makeLearningAction({ impact_assessment: "significant" })];
      const m = computeLearningMetrics([], actions, NOW);
      expect(m.impact_positive).toBe(1);
    });

    it("counts moderate as positive", () => {
      const actions = [makeLearningAction({ impact_assessment: "moderate" })];
      const m = computeLearningMetrics([], actions, NOW);
      expect(m.impact_positive).toBe(1);
    });

    it("does not count minor as positive", () => {
      const actions = [makeLearningAction({ impact_assessment: "minor" })];
      const m = computeLearningMetrics([], actions, NOW);
      expect(m.impact_positive).toBe(0);
    });

    it("does not count not_yet_assessed as positive", () => {
      const actions = [makeLearningAction({ impact_assessment: "not_yet_assessed" })];
      const m = computeLearningMetrics([], actions, NOW);
      expect(m.impact_positive).toBe(0);
    });

    it("counts combined positive impacts correctly", () => {
      const actions = [
        makeLearningAction({ impact_assessment: "transformational" }),
        makeLearningAction({ impact_assessment: "significant" }),
        makeLearningAction({ impact_assessment: "moderate" }),
        makeLearningAction({ impact_assessment: "minor" }),
        makeLearningAction({ impact_assessment: "not_yet_assessed" }),
      ];
      const m = computeLearningMetrics([], actions, NOW);
      expect(m.impact_positive).toBe(3);
    });
  });

  // ── impact_not_assessed ──────────────────────────────────────────────
  describe("impact_not_assessed", () => {
    it("counts not_yet_assessed actions", () => {
      const actions = [
        makeLearningAction({ impact_assessment: "not_yet_assessed" }),
        makeLearningAction({ impact_assessment: "not_yet_assessed" }),
        makeLearningAction({ impact_assessment: "significant" }),
      ];
      const m = computeLearningMetrics([], actions, NOW);
      expect(m.impact_not_assessed).toBe(2);
    });

    it("returns 0 when all assessed", () => {
      const actions = [
        makeLearningAction({ impact_assessment: "moderate" }),
        makeLearningAction({ impact_assessment: "minor" }),
      ];
      const m = computeLearningMetrics([], actions, NOW);
      expect(m.impact_not_assessed).toBe(0);
    });
  });

  // ── by_source grouping ──────────────────────────────────────────────
  describe("by_source", () => {
    it("groups events by source", () => {
      const events = [
        makeLearningEvent({ source: "incident" }),
        makeLearningEvent({ source: "incident" }),
        makeLearningEvent({ source: "complaint" }),
      ];
      const m = computeLearningMetrics(events, [], NOW);
      expect(m.by_source).toEqual({ incident: 2, complaint: 1 });
    });

    it("returns empty object with no events", () => {
      const m = computeLearningMetrics([], [], NOW);
      expect(m.by_source).toEqual({});
    });

    it("handles single source", () => {
      const events = [makeLearningEvent({ source: "audit" })];
      const m = computeLearningMetrics(events, [], NOW);
      expect(m.by_source).toEqual({ audit: 1 });
    });

    it("groups all 14 sources correctly when present", () => {
      const sources: LearningSource[] = [
        "incident", "complaint", "safeguarding_concern", "near_miss",
        "serious_case_review", "reg44_visit", "reg45_review", "ofsted_inspection",
        "staff_feedback", "child_feedback", "audit", "training",
        "external_review", "other",
      ];
      const events = sources.map((source) => makeLearningEvent({ source }));
      const m = computeLearningMetrics(events, [], NOW);
      expect(Object.keys(m.by_source)).toHaveLength(14);
      for (const src of sources) {
        expect(m.by_source[src]).toBe(1);
      }
    });
  });

  // ── by_priority grouping ────────────────────────────────────────────
  describe("by_priority", () => {
    it("groups events by priority", () => {
      const events = [
        makeLearningEvent({ priority: "critical" }),
        makeLearningEvent({ priority: "critical" }),
        makeLearningEvent({ priority: "high" }),
        makeLearningEvent({ priority: "low" }),
      ];
      const m = computeLearningMetrics(events, [], NOW);
      expect(m.by_priority).toEqual({ critical: 2, high: 1, low: 1 });
    });

    it("returns empty object with no events", () => {
      const m = computeLearningMetrics([], [], NOW);
      expect(m.by_priority).toEqual({});
    });

    it("handles all same priority", () => {
      const events = [
        makeLearningEvent({ priority: "medium" }),
        makeLearningEvent({ priority: "medium" }),
      ];
      const m = computeLearningMetrics(events, [], NOW);
      expect(m.by_priority).toEqual({ medium: 2 });
    });
  });

  // ── by_action_status grouping ────────────────────────────────────────
  describe("by_action_status", () => {
    it("groups actions by status", () => {
      const actions = [
        makeLearningAction({ status: "completed" }),
        makeLearningAction({ status: "completed" }),
        makeLearningAction({ status: "overdue" }),
        makeLearningAction({ status: "not_started" }),
      ];
      const m = computeLearningMetrics([], actions, NOW);
      expect(m.by_action_status).toEqual({
        completed: 2,
        overdue: 1,
        not_started: 1,
      });
    });

    it("returns empty object with no actions", () => {
      const m = computeLearningMetrics([], [], NOW);
      expect(m.by_action_status).toEqual({});
    });

    it("includes cancelled in grouping", () => {
      const actions = [
        makeLearningAction({ status: "cancelled" }),
        makeLearningAction({ status: "cancelled" }),
      ];
      const m = computeLearningMetrics([], actions, NOW);
      expect(m.by_action_status).toEqual({ cancelled: 2 });
    });
  });

  // ── by_impact grouping ──────────────────────────────────────────────
  describe("by_impact", () => {
    it("groups actions by impact assessment", () => {
      const actions = [
        makeLearningAction({ impact_assessment: "transformational" }),
        makeLearningAction({ impact_assessment: "significant" }),
        makeLearningAction({ impact_assessment: "significant" }),
        makeLearningAction({ impact_assessment: "not_yet_assessed" }),
      ];
      const m = computeLearningMetrics([], actions, NOW);
      expect(m.by_impact).toEqual({
        transformational: 1,
        significant: 2,
        not_yet_assessed: 1,
      });
    });

    it("returns empty object with no actions", () => {
      const m = computeLearningMetrics([], [], NOW);
      expect(m.by_impact).toEqual({});
    });
  });

  // ── Return type validation ──────────────────────────────────────────
  describe("return type validation", () => {
    it("returns all 16 keys", () => {
      const m = computeLearningMetrics([], [], NOW);
      const expectedKeys = [
        "total_events",
        "events_this_quarter",
        "critical_events",
        "total_actions",
        "actions_completed",
        "actions_overdue",
        "actions_in_progress",
        "completion_rate",
        "shared_with_team_rate",
        "avg_learning_points",
        "impact_positive",
        "impact_not_assessed",
        "by_source",
        "by_priority",
        "by_action_status",
        "by_impact",
      ];
      for (const key of expectedKeys) {
        expect(m).toHaveProperty(key);
      }
      expect(Object.keys(m)).toHaveLength(16);
    });

    it("returns numbers for numeric fields", () => {
      const m = computeLearningMetrics([makeLearningEvent()], [makeLearningAction()], NOW);
      expect(typeof m.total_events).toBe("number");
      expect(typeof m.events_this_quarter).toBe("number");
      expect(typeof m.critical_events).toBe("number");
      expect(typeof m.total_actions).toBe("number");
      expect(typeof m.actions_completed).toBe("number");
      expect(typeof m.actions_overdue).toBe("number");
      expect(typeof m.actions_in_progress).toBe("number");
      expect(typeof m.completion_rate).toBe("number");
      expect(typeof m.shared_with_team_rate).toBe("number");
      expect(typeof m.avg_learning_points).toBe("number");
      expect(typeof m.impact_positive).toBe("number");
      expect(typeof m.impact_not_assessed).toBe("number");
    });

    it("returns objects for grouping fields", () => {
      const m = computeLearningMetrics([makeLearningEvent()], [makeLearningAction()], NOW);
      expect(typeof m.by_source).toBe("object");
      expect(typeof m.by_priority).toBe("object");
      expect(typeof m.by_action_status).toBe("object");
      expect(typeof m.by_impact).toBe("object");
    });
  });

  // ── Edge cases ──────────────────────────────────────────────────────
  describe("edge cases", () => {
    it("handles all same values for events", () => {
      const events = Array.from({ length: 5 }, () =>
        makeLearningEvent({
          source: "incident",
          priority: "high",
          shared_with_team: true,
          learning_points: ["A"],
          event_date: "2026-05-01",
        }),
      );
      const m = computeLearningMetrics(events, [], NOW);
      expect(m.total_events).toBe(5);
      expect(m.by_source).toEqual({ incident: 5 });
      expect(m.by_priority).toEqual({ high: 5 });
      expect(m.shared_with_team_rate).toBe(100);
      expect(m.avg_learning_points).toBe(1);
    });

    it("handles all same values for actions", () => {
      const actions = Array.from({ length: 5 }, () =>
        makeLearningAction({
          status: "completed",
          impact_assessment: "significant",
        }),
      );
      const m = computeLearningMetrics([], actions, NOW);
      expect(m.total_actions).toBe(5);
      expect(m.actions_completed).toBe(5);
      expect(m.completion_rate).toBe(100);
      expect(m.by_action_status).toEqual({ completed: 5 });
      expect(m.by_impact).toEqual({ significant: 5 });
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. identifyLearningAlerts
// ══════════════════════════════════════════════════════════════════════════════

describe("identifyLearningAlerts", () => {
  // ── Empty inputs ──────────────────────────────────────────────────────
  describe("empty inputs", () => {
    it("returns empty array with no events and no actions", () => {
      const alerts = identifyLearningAlerts([], [], NOW);
      expect(alerts).toEqual([]);
    });
  });

  // ── action_overdue ──────────────────────────────────────────────────
  describe("action_overdue", () => {
    it("creates alert for overdue action", () => {
      const action = makeLearningAction({
        status: "overdue",
        action: "Update policy",
        target_date: "2026-04-01",
        responsible_person: "Jane Doe",
      });
      const alerts = identifyLearningAlerts([], [action], NOW);
      const overdueAlerts = alerts.filter((a) => a.type === "action_overdue");
      expect(overdueAlerts).toHaveLength(1);
    });

    it("has severity 'high'", () => {
      const action = makeLearningAction({ status: "overdue" });
      const alerts = identifyLearningAlerts([], [action], NOW);
      const overdueAlert = alerts.find((a) => a.type === "action_overdue");
      expect(overdueAlert!.severity).toBe("high");
    });

    it("includes action name in message", () => {
      const action = makeLearningAction({
        status: "overdue",
        action: "Revise training programme",
      });
      const alerts = identifyLearningAlerts([], [action], NOW);
      const overdueAlert = alerts.find((a) => a.type === "action_overdue");
      expect(overdueAlert!.message).toContain("Revise training programme");
    });

    it("includes target date in message", () => {
      const action = makeLearningAction({
        status: "overdue",
        target_date: "2026-03-15",
      });
      const alerts = identifyLearningAlerts([], [action], NOW);
      const overdueAlert = alerts.find((a) => a.type === "action_overdue");
      expect(overdueAlert!.message).toContain("2026-03-15");
    });

    it("includes responsible person in message", () => {
      const action = makeLearningAction({
        status: "overdue",
        responsible_person: "John Smith",
      });
      const alerts = identifyLearningAlerts([], [action], NOW);
      const overdueAlert = alerts.find((a) => a.type === "action_overdue");
      expect(overdueAlert!.message).toContain("John Smith");
    });

    it("uses the action id", () => {
      const action = makeLearningAction({ id: "action-123", status: "overdue" });
      const alerts = identifyLearningAlerts([], [action], NOW);
      const overdueAlert = alerts.find((a) => a.type === "action_overdue");
      expect(overdueAlert!.id).toBe("action-123");
    });

    it("does not alert for non-overdue actions", () => {
      const action = makeLearningAction({ status: "completed" });
      const alerts = identifyLearningAlerts([], [action], NOW);
      const overdueAlerts = alerts.filter((a) => a.type === "action_overdue");
      expect(overdueAlerts).toHaveLength(0);
    });

    it("creates multiple alerts for multiple overdue actions", () => {
      const actions = [
        makeLearningAction({ status: "overdue" }),
        makeLearningAction({ status: "overdue" }),
      ];
      const alerts = identifyLearningAlerts([], actions, NOW);
      const overdueAlerts = alerts.filter((a) => a.type === "action_overdue");
      expect(overdueAlerts).toHaveLength(2);
    });
  });

  // ── action_past_target ──────────────────────────────────────────────
  describe("action_past_target", () => {
    it("creates alert for not_started action past target date", () => {
      const action = makeLearningAction({
        status: "not_started",
        target_date: "2026-05-01",
        action: "Review procedures",
      });
      const alerts = identifyLearningAlerts([], [action], NOW);
      const pastTargetAlerts = alerts.filter((a) => a.type === "action_past_target");
      expect(pastTargetAlerts).toHaveLength(1);
    });

    it("creates alert for in_progress action past target date", () => {
      const action = makeLearningAction({
        status: "in_progress",
        target_date: "2026-04-15",
        action: "Implement changes",
      });
      const alerts = identifyLearningAlerts([], [action], NOW);
      const pastTargetAlerts = alerts.filter((a) => a.type === "action_past_target");
      expect(pastTargetAlerts).toHaveLength(1);
    });

    it("has severity 'medium'", () => {
      const action = makeLearningAction({
        status: "not_started",
        target_date: "2026-04-01",
      });
      const alerts = identifyLearningAlerts([], [action], NOW);
      const pastTargetAlert = alerts.find((a) => a.type === "action_past_target");
      expect(pastTargetAlert!.severity).toBe("medium");
    });

    it("includes action name in message", () => {
      const action = makeLearningAction({
        status: "in_progress",
        target_date: "2026-04-01",
        action: "Staff retraining",
      });
      const alerts = identifyLearningAlerts([], [action], NOW);
      const pastTargetAlert = alerts.find((a) => a.type === "action_past_target");
      expect(pastTargetAlert!.message).toContain("Staff retraining");
    });

    it("includes target date in message", () => {
      const action = makeLearningAction({
        status: "not_started",
        target_date: "2026-03-20",
      });
      const alerts = identifyLearningAlerts([], [action], NOW);
      const pastTargetAlert = alerts.find((a) => a.type === "action_past_target");
      expect(pastTargetAlert!.message).toContain("2026-03-20");
    });

    it("includes status in message", () => {
      const action = makeLearningAction({
        status: "not_started",
        target_date: "2026-04-01",
      });
      const alerts = identifyLearningAlerts([], [action], NOW);
      const pastTargetAlert = alerts.find((a) => a.type === "action_past_target");
      expect(pastTargetAlert!.message).toContain("not_started");
    });

    it("does not alert for completed actions past target date", () => {
      const action = makeLearningAction({
        status: "completed",
        target_date: "2026-04-01",
      });
      const alerts = identifyLearningAlerts([], [action], NOW);
      const pastTargetAlerts = alerts.filter((a) => a.type === "action_past_target");
      expect(pastTargetAlerts).toHaveLength(0);
    });

    it("does not alert for cancelled actions past target date", () => {
      const action = makeLearningAction({
        status: "cancelled",
        target_date: "2026-04-01",
      });
      const alerts = identifyLearningAlerts([], [action], NOW);
      const pastTargetAlerts = alerts.filter((a) => a.type === "action_past_target");
      expect(pastTargetAlerts).toHaveLength(0);
    });

    it("does not alert for future target dates", () => {
      const action = makeLearningAction({
        status: "not_started",
        target_date: "2026-06-01",
      });
      const alerts = identifyLearningAlerts([], [action], NOW);
      const pastTargetAlerts = alerts.filter((a) => a.type === "action_past_target");
      expect(pastTargetAlerts).toHaveLength(0);
    });

    it("uses the action id", () => {
      const action = makeLearningAction({
        id: "action-456",
        status: "not_started",
        target_date: "2026-04-01",
      });
      const alerts = identifyLearningAlerts([], [action], NOW);
      const pastTargetAlert = alerts.find((a) => a.type === "action_past_target");
      expect(pastTargetAlert!.id).toBe("action-456");
    });
  });

  // ── learning_not_shared ──────────────────────────────────────────────
  describe("learning_not_shared", () => {
    it("creates alert for critical event not shared", () => {
      const event = makeLearningEvent({
        priority: "critical",
        shared_with_team: false,
        title: "Critical Incident Learning",
      });
      const alerts = identifyLearningAlerts([event], [], NOW);
      const notSharedAlerts = alerts.filter((a) => a.type === "learning_not_shared");
      expect(notSharedAlerts).toHaveLength(1);
    });

    it("has severity 'critical' for critical events", () => {
      const event = makeLearningEvent({
        priority: "critical",
        shared_with_team: false,
      });
      const alerts = identifyLearningAlerts([event], [], NOW);
      const notSharedAlert = alerts.find((a) => a.type === "learning_not_shared");
      expect(notSharedAlert!.severity).toBe("critical");
    });

    it("creates alert for high priority event not shared", () => {
      const event = makeLearningEvent({
        priority: "high",
        shared_with_team: false,
        title: "High Priority Learning",
      });
      const alerts = identifyLearningAlerts([event], [], NOW);
      const notSharedAlerts = alerts.filter((a) => a.type === "learning_not_shared");
      expect(notSharedAlerts).toHaveLength(1);
    });

    it("has severity 'high' for high priority events", () => {
      const event = makeLearningEvent({
        priority: "high",
        shared_with_team: false,
      });
      const alerts = identifyLearningAlerts([event], [], NOW);
      const notSharedAlert = alerts.find((a) => a.type === "learning_not_shared");
      expect(notSharedAlert!.severity).toBe("high");
    });

    it("does not create alert for medium priority not shared", () => {
      const event = makeLearningEvent({
        priority: "medium",
        shared_with_team: false,
      });
      const alerts = identifyLearningAlerts([event], [], NOW);
      const notSharedAlerts = alerts.filter((a) => a.type === "learning_not_shared");
      expect(notSharedAlerts).toHaveLength(0);
    });

    it("does not create alert for low priority not shared", () => {
      const event = makeLearningEvent({
        priority: "low",
        shared_with_team: false,
      });
      const alerts = identifyLearningAlerts([event], [], NOW);
      const notSharedAlerts = alerts.filter((a) => a.type === "learning_not_shared");
      expect(notSharedAlerts).toHaveLength(0);
    });

    it("does not alert when critical event is already shared", () => {
      const event = makeLearningEvent({
        priority: "critical",
        shared_with_team: true,
      });
      const alerts = identifyLearningAlerts([event], [], NOW);
      const notSharedAlerts = alerts.filter((a) => a.type === "learning_not_shared");
      expect(notSharedAlerts).toHaveLength(0);
    });

    it("does not alert when high priority event is already shared", () => {
      const event = makeLearningEvent({
        priority: "high",
        shared_with_team: true,
      });
      const alerts = identifyLearningAlerts([event], [], NOW);
      const notSharedAlerts = alerts.filter((a) => a.type === "learning_not_shared");
      expect(notSharedAlerts).toHaveLength(0);
    });

    it("includes event title in message", () => {
      const event = makeLearningEvent({
        priority: "critical",
        shared_with_team: false,
        title: "Safeguarding Review Findings",
      });
      const alerts = identifyLearningAlerts([event], [], NOW);
      const notSharedAlert = alerts.find((a) => a.type === "learning_not_shared");
      expect(notSharedAlert!.message).toContain("Safeguarding Review Findings");
    });

    it("message mentions 'Critical' for critical events", () => {
      const event = makeLearningEvent({
        priority: "critical",
        shared_with_team: false,
      });
      const alerts = identifyLearningAlerts([event], [], NOW);
      const notSharedAlert = alerts.find((a) => a.type === "learning_not_shared");
      expect(notSharedAlert!.message).toContain("Critical");
    });

    it("message mentions 'High priority' for high events", () => {
      const event = makeLearningEvent({
        priority: "high",
        shared_with_team: false,
      });
      const alerts = identifyLearningAlerts([event], [], NOW);
      const notSharedAlert = alerts.find((a) => a.type === "learning_not_shared");
      expect(notSharedAlert!.message).toContain("High priority");
    });

    it("uses the event id", () => {
      const event = makeLearningEvent({
        id: "event-789",
        priority: "critical",
        shared_with_team: false,
      });
      const alerts = identifyLearningAlerts([event], [], NOW);
      const notSharedAlert = alerts.find((a) => a.type === "learning_not_shared");
      expect(notSharedAlert!.id).toBe("event-789");
    });
  });

  // ── no_impact_assessment ────────────────────────────────────────────
  describe("no_impact_assessment", () => {
    it("creates alert for completed action with not_yet_assessed impact", () => {
      const action = makeLearningAction({
        status: "completed",
        impact_assessment: "not_yet_assessed",
        action: "Policy update",
      });
      const alerts = identifyLearningAlerts([], [action], NOW);
      const noImpactAlerts = alerts.filter((a) => a.type === "no_impact_assessment");
      expect(noImpactAlerts).toHaveLength(1);
    });

    it("has severity 'medium'", () => {
      const action = makeLearningAction({
        status: "completed",
        impact_assessment: "not_yet_assessed",
      });
      const alerts = identifyLearningAlerts([], [action], NOW);
      const noImpactAlert = alerts.find((a) => a.type === "no_impact_assessment");
      expect(noImpactAlert!.severity).toBe("medium");
    });

    it("includes action name in message", () => {
      const action = makeLearningAction({
        status: "completed",
        impact_assessment: "not_yet_assessed",
        action: "Implement safety checks",
      });
      const alerts = identifyLearningAlerts([], [action], NOW);
      const noImpactAlert = alerts.find((a) => a.type === "no_impact_assessment");
      expect(noImpactAlert!.message).toContain("Implement safety checks");
    });

    it("does not alert for completed action with assessed impact", () => {
      const action = makeLearningAction({
        status: "completed",
        impact_assessment: "significant",
      });
      const alerts = identifyLearningAlerts([], [action], NOW);
      const noImpactAlerts = alerts.filter((a) => a.type === "no_impact_assessment");
      expect(noImpactAlerts).toHaveLength(0);
    });

    it("does not alert for non-completed action with not_yet_assessed impact", () => {
      const action = makeLearningAction({
        status: "in_progress",
        impact_assessment: "not_yet_assessed",
      });
      const alerts = identifyLearningAlerts([], [action], NOW);
      const noImpactAlerts = alerts.filter((a) => a.type === "no_impact_assessment");
      expect(noImpactAlerts).toHaveLength(0);
    });

    it("does not alert for not_started action with not_yet_assessed impact", () => {
      const action = makeLearningAction({
        status: "not_started",
        impact_assessment: "not_yet_assessed",
      });
      const alerts = identifyLearningAlerts([], [action], NOW);
      const noImpactAlerts = alerts.filter((a) => a.type === "no_impact_assessment");
      expect(noImpactAlerts).toHaveLength(0);
    });

    it("uses the action id", () => {
      const action = makeLearningAction({
        id: "action-impact-1",
        status: "completed",
        impact_assessment: "not_yet_assessed",
      });
      const alerts = identifyLearningAlerts([], [action], NOW);
      const noImpactAlert = alerts.find((a) => a.type === "no_impact_assessment");
      expect(noImpactAlert!.id).toBe("action-impact-1");
    });
  });

  // ── Combined scenarios ──────────────────────────────────────────────
  describe("combined scenarios", () => {
    it("generates alerts from multiple categories simultaneously", () => {
      const events = [
        makeLearningEvent({
          priority: "critical",
          shared_with_team: false,
        }),
      ];
      const actions = [
        makeLearningAction({ status: "overdue" }),
        makeLearningAction({
          status: "not_started",
          target_date: "2026-04-01",
        }),
        makeLearningAction({
          status: "completed",
          impact_assessment: "not_yet_assessed",
        }),
      ];
      const alerts = identifyLearningAlerts(events, actions, NOW);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("action_overdue");
      expect(types).toContain("action_past_target");
      expect(types).toContain("learning_not_shared");
      expect(types).toContain("no_impact_assessment");
    });

    it("returns correct total alert count for combined scenario", () => {
      const events = [
        makeLearningEvent({ priority: "critical", shared_with_team: false }),
        makeLearningEvent({ priority: "high", shared_with_team: false }),
      ];
      const actions = [
        makeLearningAction({ status: "overdue" }),
        makeLearningAction({ status: "overdue" }),
        makeLearningAction({
          status: "completed",
          impact_assessment: "not_yet_assessed",
        }),
      ];
      const alerts = identifyLearningAlerts(events, actions, NOW);
      // 2 overdue + 2 not_shared + 1 no_impact = 5
      expect(alerts).toHaveLength(5);
    });

    it("no alerts when everything is fine", () => {
      const events = [
        makeLearningEvent({ priority: "critical", shared_with_team: true }),
        makeLearningEvent({ priority: "high", shared_with_team: true }),
        makeLearningEvent({ priority: "medium", shared_with_team: false }),
      ];
      const actions = [
        makeLearningAction({ status: "completed", impact_assessment: "significant" }),
        makeLearningAction({ status: "in_progress", target_date: "2026-06-01" }),
        makeLearningAction({ status: "not_started", target_date: "2026-07-01" }),
      ];
      const alerts = identifyLearningAlerts(events, actions, NOW);
      expect(alerts).toHaveLength(0);
    });
  });

  // ── Alert structure ─────────────────────────────────────────────────
  describe("alert structure", () => {
    it("each alert has type, severity, message, and id fields", () => {
      const action = makeLearningAction({ status: "overdue" });
      const alerts = identifyLearningAlerts([], [action], NOW);
      for (const alert of alerts) {
        expect(alert).toHaveProperty("type");
        expect(alert).toHaveProperty("severity");
        expect(alert).toHaveProperty("message");
        expect(alert).toHaveProperty("id");
      }
    });

    it("severity is one of critical, high, medium", () => {
      const events = [
        makeLearningEvent({ priority: "critical", shared_with_team: false }),
      ];
      const actions = [
        makeLearningAction({ status: "overdue" }),
        makeLearningAction({ status: "not_started", target_date: "2026-04-01" }),
        makeLearningAction({ status: "completed", impact_assessment: "not_yet_assessed" }),
      ];
      const alerts = identifyLearningAlerts(events, actions, NOW);
      const validSeverities = ["critical", "high", "medium"];
      for (const alert of alerts) {
        expect(validSeverities).toContain(alert.severity);
      }
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. CRUD fallback (Supabase disabled)
// ══════════════════════════════════════════════════════════════════════════════

vi.mock("@/lib/supabase/server", () => ({
  isSupabaseEnabled: () => false,
  createServerClient: () => null,
}));

describe("CRUD fallback (Supabase disabled)", () => {
  // Re-import after mock to get the mocked versions
  let listEvents: typeof import("../practice-learning-service").listEvents;
  let createEvent: typeof import("../practice-learning-service").createEvent;
  let updateEvent: typeof import("../practice-learning-service").updateEvent;
  let listActions: typeof import("../practice-learning-service").listActions;
  let createAction: typeof import("../practice-learning-service").createAction;
  let updateAction: typeof import("../practice-learning-service").updateAction;

  beforeAll(async () => {
    const mod = await import("../practice-learning-service");
    listEvents = mod.listEvents;
    createEvent = mod.createEvent;
    updateEvent = mod.updateEvent;
    listActions = mod.listActions;
    createAction = mod.createAction;
    updateAction = mod.updateAction;
  });

  describe("listEvents", () => {
    it("returns ok true with empty data array", async () => {
      const result = await listEvents("home-1");
      expect(result).toEqual({ ok: true, data: [] });
    });

    it("returns ok true regardless of filters", async () => {
      const result = await listEvents("home-1", {
        source: "incident",
        priority: "critical",
        dateFrom: "2026-01-01",
        dateTo: "2026-12-31",
        limit: 50,
      });
      expect(result).toEqual({ ok: true, data: [] });
    });
  });

  describe("createEvent", () => {
    it("returns ok false with error message", async () => {
      const result = await createEvent({
        homeId: "home-1",
        title: "Test",
        source: "incident",
        eventDate: "2026-05-01",
        identifiedBy: "staff-1",
        description: "Test description",
        learningPoints: ["Point A"],
        priority: "medium",
        childrenAffected: 1,
        staffInvolved: ["staff-1"],
      });
      expect(result).toEqual({ ok: false, error: "Supabase not configured" });
    });
  });

  describe("updateEvent", () => {
    it("returns ok false with error message", async () => {
      const result = await updateEvent("event-1", { title: "Updated" });
      expect(result).toEqual({ ok: false, error: "Supabase not configured" });
    });
  });

  describe("listActions", () => {
    it("returns ok true with empty data array", async () => {
      const result = await listActions("home-1");
      expect(result).toEqual({ ok: true, data: [] });
    });

    it("returns ok true regardless of filters", async () => {
      const result = await listActions("home-1", {
        learningEventId: "event-1",
        status: "completed",
        limit: 10,
      });
      expect(result).toEqual({ ok: true, data: [] });
    });
  });

  describe("createAction", () => {
    it("returns ok false with error message", async () => {
      const result = await createAction({
        homeId: "home-1",
        learningEventId: "event-1",
        action: "Test action",
        responsiblePerson: "Staff Member",
        targetDate: "2026-06-01",
      });
      expect(result).toEqual({ ok: false, error: "Supabase not configured" });
    });
  });

  describe("updateAction", () => {
    it("returns ok false with error message", async () => {
      const result = await updateAction("action-1", { status: "completed" });
      expect(result).toEqual({ ok: false, error: "Supabase not configured" });
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. Edge cases
// ══════════════════════════════════════════════════════════════════════════════

describe("Edge cases", () => {
  describe("single item inputs", () => {
    it("computes metrics for a single event", () => {
      const m = computeLearningMetrics(
        [makeLearningEvent({ event_date: "2026-05-01", priority: "high", shared_with_team: true })],
        [],
        NOW,
      );
      expect(m.total_events).toBe(1);
      expect(m.events_this_quarter).toBe(1);
      expect(m.critical_events).toBe(0);
      expect(m.shared_with_team_rate).toBe(100);
    });

    it("computes metrics for a single action", () => {
      const m = computeLearningMetrics(
        [],
        [makeLearningAction({ status: "completed", impact_assessment: "transformational" })],
        NOW,
      );
      expect(m.total_actions).toBe(1);
      expect(m.actions_completed).toBe(1);
      expect(m.completion_rate).toBe(100);
      expect(m.impact_positive).toBe(1);
    });

    it("identifies alert for a single overdue action", () => {
      const alerts = identifyLearningAlerts(
        [],
        [makeLearningAction({ status: "overdue" })],
        NOW,
      );
      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe("action_overdue");
    });
  });

  describe("large datasets", () => {
    it("handles 100 events", () => {
      const events = Array.from({ length: 100 }, (_, i) =>
        makeLearningEvent({
          source: i % 2 === 0 ? "incident" : "complaint",
          priority: i % 3 === 0 ? "critical" : "medium",
          event_date: "2026-05-01",
          shared_with_team: i % 4 === 0,
          learning_points: Array.from({ length: (i % 5) + 1 }, (_, j) => `Point ${j}`),
        }),
      );
      const m = computeLearningMetrics(events, [], NOW);
      expect(m.total_events).toBe(100);
      expect(m.events_this_quarter).toBe(100);
      expect(m.by_source.incident).toBe(50);
      expect(m.by_source.complaint).toBe(50);
    });

    it("handles 50 actions", () => {
      const actions = Array.from({ length: 50 }, (_, i) =>
        makeLearningAction({
          status: i % 5 === 0 ? "completed" : i % 5 === 1 ? "in_progress" : i % 5 === 2 ? "overdue" : i % 5 === 3 ? "not_started" : "cancelled",
          impact_assessment: i % 3 === 0 ? "significant" : i % 3 === 1 ? "moderate" : "not_yet_assessed",
        }),
      );
      const m = computeLearningMetrics([], actions, NOW);
      expect(m.total_actions).toBe(50);
      expect(m.actions_completed).toBe(10);
      expect(m.actions_overdue).toBe(10);
      expect(m.actions_in_progress).toBe(10);
    });

    it("identifies alerts in large dataset", () => {
      const events = Array.from({ length: 20 }, () =>
        makeLearningEvent({ priority: "critical", shared_with_team: false }),
      );
      const actions = Array.from({ length: 20 }, () =>
        makeLearningAction({ status: "overdue" }),
      );
      const alerts = identifyLearningAlerts(events, actions, NOW);
      // 20 overdue + 20 not_shared = 40
      expect(alerts).toHaveLength(40);
    });
  });

  describe("date boundary precision", () => {
    it("event well within the 90-day window is included in quarter", () => {
      // Event on 2026-04-01 is well within 90 days of 2026-05-13
      const e = makeLearningEvent({ event_date: "2026-04-01T00:00:00Z" });
      const m = computeLearningMetrics([e], [], NOW);
      expect(m.events_this_quarter).toBe(1);
    });

    it("action target_date exactly at now boundary triggers past_target for not_started", () => {
      // target_date < now, so a date string that resolves before now
      const action = makeLearningAction({
        status: "not_started",
        target_date: "2026-05-12",
      });
      const alerts = identifyLearningAlerts([], [action], NOW);
      const pastTargetAlerts = alerts.filter((a) => a.type === "action_past_target");
      expect(pastTargetAlerts).toHaveLength(1);
    });

    it("action target_date at now does not trigger past_target", () => {
      // new Date("2026-06-01") is NOT < new Date("2026-05-13"), so no alert
      const action = makeLearningAction({
        status: "not_started",
        target_date: "2026-05-13",
      });
      const alerts = identifyLearningAlerts([], [action], NOW);
      const pastTargetAlerts = alerts.filter((a) => a.type === "action_past_target");
      expect(pastTargetAlerts).toHaveLength(0);
    });
  });

  describe("empty learning_points arrays", () => {
    it("counts zero learning points per event", () => {
      const events = [
        makeLearningEvent({ learning_points: [] }),
        makeLearningEvent({ learning_points: [] }),
        makeLearningEvent({ learning_points: [] }),
      ];
      const m = computeLearningMetrics(events, [], NOW);
      expect(m.avg_learning_points).toBe(0);
    });

    it("mixes empty and non-empty learning_points", () => {
      const events = [
        makeLearningEvent({ learning_points: [] }),
        makeLearningEvent({ learning_points: ["A", "B", "C"] }),
      ];
      const m = computeLearningMetrics(events, [], NOW);
      // (0 + 3) / 2 = 1.5
      expect(m.avg_learning_points).toBe(1.5);
    });
  });

  describe("empty staff_involved arrays", () => {
    it("handles events with no staff involved", () => {
      const events = [makeLearningEvent({ staff_involved: [] })];
      const m = computeLearningMetrics(events, [], NOW);
      expect(m.total_events).toBe(1);
    });
  });

  describe("default now parameter", () => {
    it("computeLearningMetrics uses current date when now is not provided", () => {
      const e = makeLearningEvent({ event_date: new Date().toISOString().split("T")[0] });
      const m = computeLearningMetrics([e], []);
      // Event should be within the 90-day window of current date
      expect(m.events_this_quarter).toBe(1);
    });

    it("identifyLearningAlerts uses current date when now is not provided", () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 10);
      const action = makeLearningAction({
        status: "not_started",
        target_date: pastDate.toISOString().split("T")[0],
      });
      const alerts = identifyLearningAlerts([], [action]);
      const pastTargetAlerts = alerts.filter((a) => a.type === "action_past_target");
      expect(pastTargetAlerts).toHaveLength(1);
    });
  });

  describe("type safety", () => {
    it("factory makeLearningEvent returns correct shape", () => {
      const event = makeLearningEvent();
      expect(typeof event.id).toBe("string");
      expect(typeof event.home_id).toBe("string");
      expect(typeof event.title).toBe("string");
      expect(typeof event.source).toBe("string");
      expect(typeof event.event_date).toBe("string");
      expect(typeof event.identified_by).toBe("string");
      expect(typeof event.description).toBe("string");
      expect(Array.isArray(event.learning_points)).toBe(true);
      expect(typeof event.priority).toBe("string");
      expect(typeof event.children_affected).toBe("number");
      expect(Array.isArray(event.staff_involved)).toBe(true);
      expect(typeof event.shared_with_team).toBe("boolean");
      expect(typeof event.created_at).toBe("string");
      expect(typeof event.updated_at).toBe("string");
    });

    it("factory makeLearningAction returns correct shape", () => {
      const action = makeLearningAction();
      expect(typeof action.id).toBe("string");
      expect(typeof action.home_id).toBe("string");
      expect(typeof action.learning_event_id).toBe("string");
      expect(typeof action.action).toBe("string");
      expect(typeof action.responsible_person).toBe("string");
      expect(typeof action.target_date).toBe("string");
      expect(typeof action.status).toBe("string");
      expect(typeof action.impact_assessment).toBe("string");
      expect(typeof action.created_at).toBe("string");
      expect(typeof action.updated_at).toBe("string");
    });

    it("makeLearningEvent overrides work correctly", () => {
      const event = makeLearningEvent({ title: "Custom Title", priority: "critical" });
      expect(event.title).toBe("Custom Title");
      expect(event.priority).toBe("critical");
    });

    it("makeLearningAction overrides work correctly", () => {
      const action = makeLearningAction({ status: "completed", action: "Custom Action" });
      expect(action.status).toBe("completed");
      expect(action.action).toBe("Custom Action");
    });

    it("makeLearningEvent generates unique ids", () => {
      const e1 = makeLearningEvent();
      const e2 = makeLearningEvent();
      expect(e1.id).not.toBe(e2.id);
    });

    it("makeLearningAction generates unique ids", () => {
      const a1 = makeLearningAction();
      const a2 = makeLearningAction();
      expect(a1.id).not.toBe(a2.id);
    });
  });
});
