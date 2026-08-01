// ══════════════════════════════════════════════════════════════════════════════
// CARA — REG 45 REPORTS SERVICE TESTS
// Pure-function unit tests for Reg 45 quality of care report metrics,
// compliance alert identification, constant validation, and CRUD fallbacks.
// Covers report statuses, visit types, quality ratings, action priorities,
// evaluation areas, and all edge cases for responsible individual reviews.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  _testing,
  REPORT_STATUSES,
  VISIT_TYPES,
  QUALITY_RATINGS,
  ACTION_PRIORITIES,
  ACTION_STATUSES,
  EVALUATION_AREAS,
  listReports,
  createReport,
  updateReport,
  listActions,
  createAction,
  updateAction,
} from "../reg45-reports-service";
import type { Reg45Report, Reg45Action } from "../reg45-reports-service";

const { computeReg45Metrics, identifyReg45Alerts } = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function daysFromNow(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

function daysAgoISO(n: number): string {
  return daysAgo(n).toISOString().split("T")[0];
}

// ── Builders ───────────────────────────────────────────────────────────────

function makeReport(overrides: Record<string, unknown> = {}): Reg45Report {
  return {
    id: "id" in overrides ? (overrides.id as string) : "report-1",
    home_id: "home_id" in overrides ? (overrides.home_id as string) : "home-1",
    report_period_start: "report_period_start" in overrides
      ? (overrides.report_period_start as string)
      : daysAgoISO(180),
    report_period_end: "report_period_end" in overrides
      ? (overrides.report_period_end as string)
      : daysAgoISO(1),
    responsible_individual: "responsible_individual" in overrides
      ? (overrides.responsible_individual as string)
      : "Jane Doe",
    visit_dates: "visit_dates" in overrides
      ? (overrides.visit_dates as string[])
      : [daysAgoISO(30), daysAgoISO(60)],
    visit_types: "visit_types" in overrides
      ? (overrides.visit_types as Reg45Report["visit_types"])
      : ["announced", "unannounced"],
    children_interviewed: "children_interviewed" in overrides
      ? (overrides.children_interviewed as string[])
      : ["Child A", "Child B"],
    staff_interviewed: "staff_interviewed" in overrides
      ? (overrides.staff_interviewed as string[])
      : ["Staff A"],
    overall_quality_rating: "overall_quality_rating" in overrides
      ? (overrides.overall_quality_rating as Reg45Report["overall_quality_rating"])
      : "good",
    evaluations: "evaluations" in overrides
      ? (overrides.evaluations as Reg45Report["evaluations"])
      : [
          {
            area: "quality_of_care" as const,
            rating: "good" as const,
            findings: "Satisfactory care quality",
            recommendations: "None",
          },
        ],
    reg44_reports_reviewed: "reg44_reports_reviewed" in overrides
      ? (overrides.reg44_reports_reviewed as number)
      : 6,
    reg44_actions_outstanding: "reg44_actions_outstanding" in overrides
      ? (overrides.reg44_actions_outstanding as number)
      : 0,
    statement_of_purpose_compliant: "statement_of_purpose_compliant" in overrides
      ? (overrides.statement_of_purpose_compliant as boolean)
      : true,
    key_strengths: "key_strengths" in overrides
      ? (overrides.key_strengths as string[])
      : ["Strong safeguarding"],
    areas_for_improvement: "areas_for_improvement" in overrides
      ? (overrides.areas_for_improvement as string[])
      : ["Record keeping"],
    status: "status" in overrides
      ? (overrides.status as Reg45Report["status"])
      : "approved",
    approved_by: "approved_by" in overrides
      ? (overrides.approved_by as string | null)
      : "Approver A",
    approval_date: "approval_date" in overrides
      ? (overrides.approval_date as string | null)
      : daysAgoISO(5),
    distribution_date: "distribution_date" in overrides
      ? (overrides.distribution_date as string | null)
      : null,
    ofsted_sent: "ofsted_sent" in overrides
      ? (overrides.ofsted_sent as boolean)
      : false,
    placing_authority_sent: "placing_authority_sent" in overrides
      ? (overrides.placing_authority_sent as boolean)
      : false,
    notes: "notes" in overrides ? (overrides.notes as string | null) : null,
    created_at: "created_at" in overrides
      ? (overrides.created_at as string)
      : daysAgo(10).toISOString(),
    updated_at: "updated_at" in overrides
      ? (overrides.updated_at as string)
      : daysAgo(1).toISOString(),
  };
}

function makeAction(overrides: Record<string, unknown> = {}): Reg45Action {
  return {
    id: "id" in overrides ? (overrides.id as string) : "action-1",
    home_id: "home_id" in overrides ? (overrides.home_id as string) : "home-1",
    report_id: "report_id" in overrides
      ? (overrides.report_id as string)
      : "report-1",
    action_description: "action_description" in overrides
      ? (overrides.action_description as string)
      : "Improve recording quality",
    evaluation_area: "evaluation_area" in overrides
      ? (overrides.evaluation_area as Reg45Action["evaluation_area"])
      : "quality_of_care",
    priority: "priority" in overrides
      ? (overrides.priority as Reg45Action["priority"])
      : "medium",
    assigned_to: "assigned_to" in overrides
      ? (overrides.assigned_to as string)
      : "Staff A",
    due_date: "due_date" in overrides
      ? (overrides.due_date as string)
      : daysFromNow(30).toISOString().split("T")[0],
    status: "status" in overrides
      ? (overrides.status as Reg45Action["status"])
      : "open",
    completion_date: "completion_date" in overrides
      ? (overrides.completion_date as string | null)
      : null,
    completion_notes: "completion_notes" in overrides
      ? (overrides.completion_notes as string | null)
      : null,
    evidence_reference: "evidence_reference" in overrides
      ? (overrides.evidence_reference as string | null)
      : null,
    created_at: "created_at" in overrides
      ? (overrides.created_at as string)
      : new Date().toISOString(),
    updated_at: "updated_at" in overrides
      ? (overrides.updated_at as string)
      : new Date().toISOString(),
  };
}

// ════════════════════════════════════════════════════════════════════════════
// 1. CONSTANTS
// ════════════════════════════════════════════════════════════════════════════

describe("Constants", () => {
  // ── REPORT_STATUSES ────────────────────────────────────────────────────

  describe("REPORT_STATUSES", () => {
    it("has exactly 6 entries", () => {
      expect(REPORT_STATUSES).toHaveLength(6);
    });

    it("contains all expected statuses", () => {
      const statuses = REPORT_STATUSES.map((s) => s.status);
      expect(statuses).toContain("draft");
      expect(statuses).toContain("in_progress");
      expect(statuses).toContain("awaiting_approval");
      expect(statuses).toContain("approved");
      expect(statuses).toContain("distributed");
      expect(statuses).toContain("archived");
    });

    it("has unique status values", () => {
      const statuses = REPORT_STATUSES.map((s) => s.status);
      expect(new Set(statuses).size).toBe(statuses.length);
    });

    it("has non-empty labels for every status", () => {
      for (const entry of REPORT_STATUSES) {
        expect(entry.label.length).toBeGreaterThan(0);
      }
    });

    it("has unique labels", () => {
      const labels = REPORT_STATUSES.map((s) => s.label);
      expect(new Set(labels).size).toBe(labels.length);
    });

    it("each entry has exactly status and label keys", () => {
      for (const entry of REPORT_STATUSES) {
        expect(Object.keys(entry).sort()).toEqual(["label", "status"]);
      }
    });

    it("statuses are all lowercase with underscores", () => {
      for (const entry of REPORT_STATUSES) {
        expect(entry.status).toMatch(/^[a-z_]+$/);
      }
    });
  });

  // ── VISIT_TYPES ────────────────────────────────────────────────────────

  describe("VISIT_TYPES", () => {
    it("has exactly 2 entries", () => {
      expect(VISIT_TYPES).toHaveLength(2);
    });

    it("contains announced and unannounced", () => {
      const types = VISIT_TYPES.map((v) => v.type);
      expect(types).toContain("announced");
      expect(types).toContain("unannounced");
    });

    it("has unique type values", () => {
      const types = VISIT_TYPES.map((v) => v.type);
      expect(new Set(types).size).toBe(types.length);
    });

    it("has non-empty labels for every type", () => {
      for (const entry of VISIT_TYPES) {
        expect(entry.label.length).toBeGreaterThan(0);
      }
    });

    it("has unique labels", () => {
      const labels = VISIT_TYPES.map((v) => v.label);
      expect(new Set(labels).size).toBe(labels.length);
    });

    it("each entry has exactly type and label keys", () => {
      for (const entry of VISIT_TYPES) {
        expect(Object.keys(entry).sort()).toEqual(["label", "type"]);
      }
    });
  });

  // ── QUALITY_RATINGS ────────────────────────────────────────────────────

  describe("QUALITY_RATINGS", () => {
    it("has exactly 4 entries", () => {
      expect(QUALITY_RATINGS).toHaveLength(4);
    });

    it("contains all expected ratings", () => {
      const ratings = QUALITY_RATINGS.map((q) => q.rating);
      expect(ratings).toContain("outstanding");
      expect(ratings).toContain("good");
      expect(ratings).toContain("requires_improvement");
      expect(ratings).toContain("inadequate");
    });

    it("has unique rating values", () => {
      const ratings = QUALITY_RATINGS.map((q) => q.rating);
      expect(new Set(ratings).size).toBe(ratings.length);
    });

    it("has non-empty labels for every rating", () => {
      for (const entry of QUALITY_RATINGS) {
        expect(entry.label.length).toBeGreaterThan(0);
      }
    });

    it("has unique labels", () => {
      const labels = QUALITY_RATINGS.map((q) => q.label);
      expect(new Set(labels).size).toBe(labels.length);
    });
  });

  // ── ACTION_PRIORITIES ──────────────────────────────────────────────────

  describe("ACTION_PRIORITIES", () => {
    it("has exactly 4 entries", () => {
      expect(ACTION_PRIORITIES).toHaveLength(4);
    });

    it("contains all expected priorities", () => {
      const priorities = ACTION_PRIORITIES.map((p) => p.priority);
      expect(priorities).toContain("critical");
      expect(priorities).toContain("high");
      expect(priorities).toContain("medium");
      expect(priorities).toContain("low");
    });

    it("has unique priority values", () => {
      const priorities = ACTION_PRIORITIES.map((p) => p.priority);
      expect(new Set(priorities).size).toBe(priorities.length);
    });

    it("has non-empty labels for every priority", () => {
      for (const entry of ACTION_PRIORITIES) {
        expect(entry.label.length).toBeGreaterThan(0);
      }
    });

    it("has unique labels", () => {
      const labels = ACTION_PRIORITIES.map((p) => p.label);
      expect(new Set(labels).size).toBe(labels.length);
    });
  });

  // ── ACTION_STATUSES ────────────────────────────────────────────────────

  describe("ACTION_STATUSES", () => {
    it("has exactly 4 entries", () => {
      expect(ACTION_STATUSES).toHaveLength(4);
    });

    it("contains all expected statuses", () => {
      const statuses = ACTION_STATUSES.map((s) => s.status);
      expect(statuses).toContain("open");
      expect(statuses).toContain("in_progress");
      expect(statuses).toContain("completed");
      expect(statuses).toContain("overdue");
    });

    it("has unique status values", () => {
      const statuses = ACTION_STATUSES.map((s) => s.status);
      expect(new Set(statuses).size).toBe(statuses.length);
    });

    it("has non-empty labels for every status", () => {
      for (const entry of ACTION_STATUSES) {
        expect(entry.label.length).toBeGreaterThan(0);
      }
    });

    it("has unique labels", () => {
      const labels = ACTION_STATUSES.map((s) => s.label);
      expect(new Set(labels).size).toBe(labels.length);
    });
  });

  // ── EVALUATION_AREAS ───────────────────────────────────────────────────

  describe("EVALUATION_AREAS", () => {
    it("has exactly 14 entries", () => {
      expect(EVALUATION_AREAS).toHaveLength(14);
    });

    it("contains all expected areas", () => {
      const areas = EVALUATION_AREAS.map((e) => e.area);
      expect(areas).toContain("quality_of_care");
      expect(areas).toContain("children_views");
      expect(areas).toContain("statement_of_purpose");
      expect(areas).toContain("education");
      expect(areas).toContain("health");
      expect(areas).toContain("safeguarding");
      expect(areas).toContain("positive_relationships");
      expect(areas).toContain("protection_of_children");
      expect(areas).toContain("leadership_management");
      expect(areas).toContain("reg44_actions");
      expect(areas).toContain("complaints");
      expect(areas).toContain("staffing");
      expect(areas).toContain("premises");
      expect(areas).toContain("record_keeping");
    });

    it("has unique area values", () => {
      const areas = EVALUATION_AREAS.map((e) => e.area);
      expect(new Set(areas).size).toBe(areas.length);
    });

    it("has non-empty labels for every area", () => {
      for (const entry of EVALUATION_AREAS) {
        expect(entry.label.length).toBeGreaterThan(0);
      }
    });

    it("has unique labels", () => {
      const labels = EVALUATION_AREAS.map((e) => e.label);
      expect(new Set(labels).size).toBe(labels.length);
    });

    it("each entry has exactly area and label keys", () => {
      for (const entry of EVALUATION_AREAS) {
        expect(Object.keys(entry).sort()).toEqual(["area", "label"]);
      }
    });

    it("areas are all lowercase with underscores", () => {
      for (const entry of EVALUATION_AREAS) {
        expect(entry.area).toMatch(/^[a-z0-9_]+$/);
      }
    });

    it("labels include regulatory references", () => {
      const labelsWithReg = EVALUATION_AREAS.filter((e) =>
        /Reg \d+/.test(e.label),
      );
      expect(labelsWithReg.length).toBeGreaterThan(0);
    });
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 2. computeReg45Metrics
// ════════════════════════════════════════════════════════════════════════════

describe("computeReg45Metrics", () => {
  it("returns zeroed metrics for empty inputs", () => {
    const m = computeReg45Metrics([], []);
    expect(m.total_reports).toBe(0);
    expect(m.reports_this_year).toBe(0);
    expect(m.latest_overall_rating).toBeNull();
    expect(m.open_actions).toBe(0);
    expect(m.overdue_actions).toBe(0);
    expect(m.completed_actions).toBe(0);
    expect(m.by_quality_rating).toEqual({});
    expect(m.by_evaluation_area).toEqual({});
    expect(m.avg_days_to_distribute).toBeNull();;
    expect(m.next_report_due).toBeNull();
  });

  // ── total_reports ──────────────────────────────────────────────────────

  describe("total_reports", () => {
    it("counts a single report", () => {
      const m = computeReg45Metrics([makeReport()], []);
      expect(m.total_reports).toBe(1);
    });

    it("counts multiple reports", () => {
      const reports = [
        makeReport({ id: "r1" }),
        makeReport({ id: "r2" }),
        makeReport({ id: "r3" }),
      ];
      const m = computeReg45Metrics(reports, []);
      expect(m.total_reports).toBe(3);
    });
  });

  // ── reports_this_year ──────────────────────────────────────────────────

  describe("reports_this_year", () => {
    it("counts reports whose period end is in the current year", () => {
      const thisYear = new Date().getFullYear();
      const reports = [
        makeReport({
          id: "r1",
          report_period_end: `${thisYear}-03-15`,
        }),
        makeReport({
          id: "r2",
          report_period_end: `${thisYear}-06-30`,
        }),
      ];
      const m = computeReg45Metrics(reports, []);
      expect(m.reports_this_year).toBe(2);
    });

    it("excludes reports from previous years", () => {
      const lastYear = new Date().getFullYear() - 1;
      const reports = [
        makeReport({
          id: "r1",
          report_period_end: `${lastYear}-06-30`,
        }),
      ];
      const m = computeReg45Metrics(reports, []);
      expect(m.reports_this_year).toBe(0);
    });

    it("mixes current and past year reports correctly", () => {
      const thisYear = new Date().getFullYear();
      const lastYear = thisYear - 1;
      const reports = [
        makeReport({ id: "r1", report_period_end: `${thisYear}-02-15` }),
        makeReport({ id: "r2", report_period_end: `${lastYear}-11-01` }),
        makeReport({ id: "r3", report_period_end: `${thisYear}-05-10` }),
      ];
      const m = computeReg45Metrics(reports, []);
      expect(m.reports_this_year).toBe(2);
    });
  });

  // ── latest_overall_rating ──────────────────────────────────────────────

  describe("latest_overall_rating", () => {
    it("returns null when no reports", () => {
      const m = computeReg45Metrics([], []);
      expect(m.latest_overall_rating).toBeNull();
    });

    it("returns rating from the most recent report by period end", () => {
      const reports = [
        makeReport({
          id: "r1",
          report_period_end: "2026-01-01",
          overall_quality_rating: "good",
        }),
        makeReport({
          id: "r2",
          report_period_end: "2026-04-01",
          overall_quality_rating: "outstanding",
        }),
      ];
      const m = computeReg45Metrics(reports, []);
      expect(m.latest_overall_rating).toBe("outstanding");
    });

    it("handles single report", () => {
      const m = computeReg45Metrics(
        [makeReport({ overall_quality_rating: "inadequate" })],
        [],
      );
      expect(m.latest_overall_rating).toBe("inadequate");
    });

    it("sorts correctly when reports are in reverse order", () => {
      const reports = [
        makeReport({
          id: "r1",
          report_period_end: "2026-06-01",
          overall_quality_rating: "requires_improvement",
        }),
        makeReport({
          id: "r2",
          report_period_end: "2026-01-01",
          overall_quality_rating: "outstanding",
        }),
      ];
      const m = computeReg45Metrics(reports, []);
      expect(m.latest_overall_rating).toBe("requires_improvement");
    });
  });

  // ── open / overdue / completed actions ────────────────────────────────

  describe("action counts", () => {
    it("counts open actions (open + in_progress)", () => {
      const actions = [
        makeAction({ id: "a1", status: "open" }),
        makeAction({ id: "a2", status: "in_progress" }),
        makeAction({ id: "a3", status: "completed" }),
      ];
      const m = computeReg45Metrics([], actions);
      expect(m.open_actions).toBe(2);
    });

    it("counts overdue actions", () => {
      const actions = [
        makeAction({ id: "a1", status: "overdue" }),
        makeAction({ id: "a2", status: "overdue" }),
        makeAction({ id: "a3", status: "open" }),
      ];
      const m = computeReg45Metrics([], actions);
      expect(m.overdue_actions).toBe(2);
    });

    it("counts completed actions", () => {
      const actions = [
        makeAction({ id: "a1", status: "completed" }),
        makeAction({ id: "a2", status: "completed" }),
        makeAction({ id: "a3", status: "completed" }),
      ];
      const m = computeReg45Metrics([], actions);
      expect(m.completed_actions).toBe(3);
    });

    it("returns zero for all counts when no actions", () => {
      const m = computeReg45Metrics([], []);
      expect(m.open_actions).toBe(0);
      expect(m.overdue_actions).toBe(0);
      expect(m.completed_actions).toBe(0);
    });

    it("handles mixed action statuses", () => {
      const actions = [
        makeAction({ id: "a1", status: "open" }),
        makeAction({ id: "a2", status: "in_progress" }),
        makeAction({ id: "a3", status: "overdue" }),
        makeAction({ id: "a4", status: "completed" }),
      ];
      const m = computeReg45Metrics([], actions);
      expect(m.open_actions).toBe(2);
      expect(m.overdue_actions).toBe(1);
      expect(m.completed_actions).toBe(1);
    });
  });

  // ── by_quality_rating ─────────────────────────────────────────────────

  describe("by_quality_rating", () => {
    it("counts evaluations by rating across all reports", () => {
      const reports = [
        makeReport({
          id: "r1",
          evaluations: [
            { area: "quality_of_care", rating: "good", findings: "f", recommendations: "r" },
            { area: "education", rating: "outstanding", findings: "f", recommendations: "r" },
          ],
        }),
        makeReport({
          id: "r2",
          evaluations: [
            { area: "health", rating: "good", findings: "f", recommendations: "r" },
            { area: "safeguarding", rating: "inadequate", findings: "f", recommendations: "r" },
          ],
        }),
      ];
      const m = computeReg45Metrics(reports, []);
      expect(m.by_quality_rating).toEqual({
        good: 2,
        outstanding: 1,
        inadequate: 1,
      });
    });

    it("returns empty object when reports have no evaluations", () => {
      const reports = [makeReport({ evaluations: [] })];
      const m = computeReg45Metrics(reports, []);
      expect(m.by_quality_rating).toEqual({});
    });

    it("handles single evaluation", () => {
      const reports = [
        makeReport({
          evaluations: [
            { area: "quality_of_care", rating: "outstanding", findings: "f", recommendations: "r" },
          ],
        }),
      ];
      const m = computeReg45Metrics(reports, []);
      expect(m.by_quality_rating).toEqual({ outstanding: 1 });
    });
  });

  // ── by_evaluation_area ────────────────────────────────────────────────

  describe("by_evaluation_area", () => {
    it("counts actions by evaluation area", () => {
      const actions = [
        makeAction({ id: "a1", evaluation_area: "quality_of_care" }),
        makeAction({ id: "a2", evaluation_area: "quality_of_care" }),
        makeAction({ id: "a3", evaluation_area: "safeguarding" }),
      ];
      const m = computeReg45Metrics([], actions);
      expect(m.by_evaluation_area).toEqual({
        quality_of_care: 2,
        safeguarding: 1,
      });
    });

    it("returns empty object for no actions", () => {
      const m = computeReg45Metrics([], []);
      expect(m.by_evaluation_area).toEqual({});
    });

    it("handles single action", () => {
      const actions = [makeAction({ evaluation_area: "education" })];
      const m = computeReg45Metrics([], actions);
      expect(m.by_evaluation_area).toEqual({ education: 1 });
    });

    it("counts across many evaluation areas", () => {
      const actions = [
        makeAction({ id: "a1", evaluation_area: "health" }),
        makeAction({ id: "a2", evaluation_area: "staffing" }),
        makeAction({ id: "a3", evaluation_area: "premises" }),
        makeAction({ id: "a4", evaluation_area: "health" }),
      ];
      const m = computeReg45Metrics([], actions);
      expect(m.by_evaluation_area.health).toBe(2);
      expect(m.by_evaluation_area.staffing).toBe(1);
      expect(m.by_evaluation_area.premises).toBe(1);
    });
  });

  // ── avg_days_to_distribute ────────────────────────────────────────────

  describe("avg_days_to_distribute", () => {
    it("returns 0 when no reports have both dates", () => {
      const reports = [makeReport({ approval_date: null, distribution_date: null })];
      const m = computeReg45Metrics(reports, []);
      expect(m.avg_days_to_distribute).toBeNull();;
    });

    it("computes average for a single distributed report", () => {
      const reports = [
        makeReport({
          approval_date: "2026-01-01",
          distribution_date: "2026-01-15",
        }),
      ];
      const m = computeReg45Metrics(reports, []);
      expect(m.avg_days_to_distribute).toBe(14);
    });

    it("computes average across multiple distributed reports", () => {
      const reports = [
        makeReport({
          id: "r1",
          approval_date: "2026-01-01",
          distribution_date: "2026-01-11",
        }),
        makeReport({
          id: "r2",
          approval_date: "2026-02-01",
          distribution_date: "2026-02-21",
        }),
      ];
      const m = computeReg45Metrics(reports, []);
      // (10 + 20) / 2 = 15
      expect(m.avg_days_to_distribute).toBe(15);
    });

    it("ignores reports without distribution_date", () => {
      const reports = [
        makeReport({
          id: "r1",
          approval_date: "2026-01-01",
          distribution_date: "2026-01-11",
        }),
        makeReport({
          id: "r2",
          approval_date: "2026-02-01",
          distribution_date: null,
        }),
      ];
      const m = computeReg45Metrics(reports, []);
      expect(m.avg_days_to_distribute).toBe(10);
    });

    it("ignores reports without approval_date", () => {
      const reports = [
        makeReport({
          approval_date: null,
          distribution_date: "2026-01-15",
        }),
      ];
      const m = computeReg45Metrics(reports, []);
      expect(m.avg_days_to_distribute).toBeNull();;
    });

    it("rounds to one decimal place", () => {
      const reports = [
        makeReport({
          id: "r1",
          approval_date: "2026-01-01",
          distribution_date: "2026-01-08",
        }),
        makeReport({
          id: "r2",
          approval_date: "2026-02-01",
          distribution_date: "2026-02-11",
        }),
      ];
      const m = computeReg45Metrics(reports, []);
      // (7 + 10) / 2 = 8.5
      expect(m.avg_days_to_distribute).toBe(8.5);
    });
  });

  // ── next_report_due ───────────────────────────────────────────────────

  describe("next_report_due", () => {
    it("returns null when no reports", () => {
      const m = computeReg45Metrics([], []);
      expect(m.next_report_due).toBeNull();
    });

    it("returns 6 months after the latest report period end", () => {
      const reports = [
        makeReport({ report_period_end: "2026-01-01" }),
      ];
      const m = computeReg45Metrics(reports, []);
      // Replicate the service logic: new Date("2026-01-01").setMonth(+6)
      const expected = new Date("2026-01-01");
      expected.setMonth(expected.getMonth() + 6);
      expect(m.next_report_due).toBe(expected.toISOString().split("T")[0]);
    });

    it("picks the most recent report when multiple exist", () => {
      const reports = [
        makeReport({ id: "r1", report_period_end: "2025-06-01" }),
        makeReport({ id: "r2", report_period_end: "2026-02-01" }),
      ];
      const m = computeReg45Metrics(reports, []);
      const expected = new Date("2026-02-01");
      expected.setMonth(expected.getMonth() + 6);
      expect(m.next_report_due).toBe(expected.toISOString().split("T")[0]);
    });

    it("handles year boundary correctly", () => {
      const reports = [
        makeReport({ report_period_end: "2026-10-01" }),
      ];
      const m = computeReg45Metrics(reports, []);
      const expected = new Date("2026-10-01");
      expected.setMonth(expected.getMonth() + 6);
      expect(m.next_report_due).toBe(expected.toISOString().split("T")[0]);
    });

    it("returns a valid date string format", () => {
      const reports = [makeReport({ report_period_end: "2026-05-01" })];
      const m = computeReg45Metrics(reports, []);
      expect(m.next_report_due).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("ignores older reports when computing next due date", () => {
      const reports = [
        makeReport({ id: "r1", report_period_end: "2024-01-01" }),
        makeReport({ id: "r2", report_period_end: "2026-04-01" }),
        makeReport({ id: "r3", report_period_end: "2025-07-01" }),
      ];
      const m = computeReg45Metrics(reports, []);
      const expected = new Date("2026-04-01");
      expected.setMonth(expected.getMonth() + 6);
      expect(m.next_report_due).toBe(expected.toISOString().split("T")[0]);
    });
  });

  // ── combined metrics ──────────────────────────────────────────────────

  describe("combined metrics", () => {
    it("computes all fields together for a realistic dataset", () => {
      const thisYear = new Date().getFullYear();
      const reports = [
        makeReport({
          id: "r1",
          report_period_end: `${thisYear}-03-01`,
          overall_quality_rating: "good",
          approval_date: `${thisYear}-03-10`,
          distribution_date: `${thisYear}-03-20`,
          evaluations: [
            { area: "quality_of_care", rating: "good", findings: "f", recommendations: "r" },
            { area: "education", rating: "outstanding", findings: "f", recommendations: "r" },
          ],
        }),
        makeReport({
          id: "r2",
          report_period_end: `${thisYear}-01-01`,
          overall_quality_rating: "requires_improvement",
          approval_date: `${thisYear}-01-05`,
          distribution_date: `${thisYear}-01-25`,
          evaluations: [
            { area: "safeguarding", rating: "requires_improvement", findings: "f", recommendations: "r" },
          ],
        }),
      ];
      const actions = [
        makeAction({ id: "a1", status: "open", evaluation_area: "quality_of_care" }),
        makeAction({ id: "a2", status: "completed", evaluation_area: "safeguarding" }),
        makeAction({ id: "a3", status: "overdue", evaluation_area: "quality_of_care" }),
      ];
      const m = computeReg45Metrics(reports, actions);
      expect(m.total_reports).toBe(2);
      expect(m.reports_this_year).toBe(2);
      expect(m.latest_overall_rating).toBe("good");
      expect(m.open_actions).toBe(1);
      expect(m.overdue_actions).toBe(1);
      expect(m.completed_actions).toBe(1);
      expect(m.by_quality_rating.good).toBe(1);
      expect(m.by_quality_rating.outstanding).toBe(1);
      expect(m.by_quality_rating.requires_improvement).toBe(1);
      expect(m.by_evaluation_area.quality_of_care).toBe(2);
      expect(m.by_evaluation_area.safeguarding).toBe(1);
      expect(m.avg_days_to_distribute).toBeGreaterThan(0);
      expect(m.next_report_due).not.toBeNull();
    });

    it("returns metric keys even with empty evaluations and actions", () => {
      const m = computeReg45Metrics([makeReport({ evaluations: [] })], []);
      expect(m).toHaveProperty("total_reports");
      expect(m).toHaveProperty("reports_this_year");
      expect(m).toHaveProperty("latest_overall_rating");
      expect(m).toHaveProperty("open_actions");
      expect(m).toHaveProperty("overdue_actions");
      expect(m).toHaveProperty("completed_actions");
      expect(m).toHaveProperty("by_quality_rating");
      expect(m).toHaveProperty("by_evaluation_area");
      expect(m).toHaveProperty("avg_days_to_distribute");
      expect(m).toHaveProperty("next_report_due");
    });

    it("all action counts sum correctly across statuses", () => {
      const actions = [
        makeAction({ id: "a1", status: "open" }),
        makeAction({ id: "a2", status: "in_progress" }),
        makeAction({ id: "a3", status: "overdue" }),
        makeAction({ id: "a4", status: "completed" }),
        makeAction({ id: "a5", status: "open" }),
      ];
      const m = computeReg45Metrics([], actions);
      expect(m.open_actions + m.overdue_actions + m.completed_actions).toBe(5);
    });

    it("by_quality_rating totals match total evaluations", () => {
      const reports = [
        makeReport({
          evaluations: [
            { area: "quality_of_care", rating: "good", findings: "f", recommendations: "r" },
            { area: "education", rating: "good", findings: "f", recommendations: "r" },
            { area: "health", rating: "outstanding", findings: "f", recommendations: "r" },
          ],
        }),
      ];
      const m = computeReg45Metrics(reports, []);
      const totalEvaluations = Object.values(m.by_quality_rating).reduce((a, b) => a + b, 0);
      expect(totalEvaluations).toBe(3);
    });

    it("by_evaluation_area totals match total actions", () => {
      const actions = [
        makeAction({ id: "a1", evaluation_area: "quality_of_care" }),
        makeAction({ id: "a2", evaluation_area: "education" }),
        makeAction({ id: "a3", evaluation_area: "quality_of_care" }),
        makeAction({ id: "a4", evaluation_area: "health" }),
      ];
      const m = computeReg45Metrics([], actions);
      const totalAreas = Object.values(m.by_evaluation_area).reduce((a, b) => a + b, 0);
      expect(totalAreas).toBe(4);
    });
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 3. identifyReg45Alerts
// ════════════════════════════════════════════════════════════════════════════

describe("identifyReg45Alerts", () => {
  const now = new Date("2026-06-15T12:00:00Z");

  it("returns no alerts for empty inputs", () => {
    const alerts = identifyReg45Alerts([], [], now);
    expect(alerts).toEqual([]);
  });

  it("returns no alerts for a fully compliant report with no issues", () => {
    const report = makeReport({
      report_period_end: "2026-06-01",
      status: "distributed",
      visit_types: ["announced", "unannounced"],
      children_interviewed: ["Child A"],
      overall_quality_rating: "good",
      statement_of_purpose_compliant: true,
      ofsted_sent: true,
      placing_authority_sent: true,
      created_at: "2026-05-01T00:00:00Z",
    });
    const alerts = identifyReg45Alerts([report], [], now);
    expect(alerts).toEqual([]);
  });

  // ── report_overdue ────────────────────────────────────────────────────

  describe("report overdue (>6 months)", () => {
    it("fires when latest report period end is more than 6 months ago", () => {
      const report = makeReport({
        report_period_end: "2025-11-01",
        status: "distributed",
        visit_types: ["announced", "unannounced"],
        children_interviewed: ["Child A"],
        overall_quality_rating: "good",
        statement_of_purpose_compliant: true,
        ofsted_sent: true,
        placing_authority_sent: true,
      });
      const alerts = identifyReg45Alerts([report], [], now);
      const overdueAlerts = alerts.filter((a) => a.type === "report_overdue");
      expect(overdueAlerts).toHaveLength(1);
      expect(overdueAlerts[0].severity).toBe("critical");
      expect(overdueAlerts[0].message).toContain("months overdue");
    });

    it("does not fire when latest report is within 6 months", () => {
      const report = makeReport({
        report_period_end: "2026-03-01",
        status: "distributed",
        visit_types: ["announced", "unannounced"],
        children_interviewed: ["Child A"],
        overall_quality_rating: "good",
        statement_of_purpose_compliant: true,
        ofsted_sent: true,
        placing_authority_sent: true,
      });
      const alerts = identifyReg45Alerts([report], [], now);
      const overdueAlerts = alerts.filter((a) => a.type === "report_overdue");
      expect(overdueAlerts).toHaveLength(0);
    });

    it("only checks the latest report, not older ones", () => {
      const old = makeReport({
        id: "r-old",
        report_period_end: "2025-01-01",
        status: "distributed",
        visit_types: ["announced", "unannounced"],
        children_interviewed: ["Child A"],
        overall_quality_rating: "good",
        statement_of_purpose_compliant: true,
        ofsted_sent: true,
        placing_authority_sent: true,
      });
      const recent = makeReport({
        id: "r-recent",
        report_period_end: "2026-04-01",
        status: "distributed",
        visit_types: ["announced", "unannounced"],
        children_interviewed: ["Child A"],
        overall_quality_rating: "good",
        statement_of_purpose_compliant: true,
        ofsted_sent: true,
        placing_authority_sent: true,
      });
      const alerts = identifyReg45Alerts([old, recent], [], now);
      const overdueAlerts = alerts.filter((a) => a.type === "report_overdue");
      expect(overdueAlerts).toHaveLength(0);
    });
  });

  // ── distribution_overdue ──────────────────────────────────────────────

  describe("distribution overdue (>28 days)", () => {
    it("fires when approved report not distributed after 28 days", () => {
      const report = makeReport({
        status: "approved",
        approval_date: "2026-05-01",
        distribution_date: null,
        report_period_end: "2026-06-01",
        visit_types: ["announced", "unannounced"],
        children_interviewed: ["Child A"],
        overall_quality_rating: "good",
        statement_of_purpose_compliant: true,
      });
      const alerts = identifyReg45Alerts([report], [], now);
      const distAlerts = alerts.filter((a) => a.type === "distribution_overdue");
      expect(distAlerts).toHaveLength(1);
      expect(distAlerts[0].severity).toBe("high");
      expect(distAlerts[0].message).toContain("28 days");
    });

    it("does not fire when approved less than 28 days ago", () => {
      const report = makeReport({
        status: "approved",
        approval_date: "2026-06-01",
        distribution_date: null,
        report_period_end: "2026-06-10",
        visit_types: ["announced", "unannounced"],
        children_interviewed: ["Child A"],
        overall_quality_rating: "good",
        statement_of_purpose_compliant: true,
      });
      const alerts = identifyReg45Alerts([report], [], now);
      const distAlerts = alerts.filter((a) => a.type === "distribution_overdue");
      expect(distAlerts).toHaveLength(0);
    });

    it("does not fire for non-approved status", () => {
      const report = makeReport({
        status: "draft",
        approval_date: "2026-01-01",
        distribution_date: null,
        report_period_end: "2026-06-01",
        overall_quality_rating: "good",
        created_at: "2026-06-14T00:00:00Z",
      });
      const alerts = identifyReg45Alerts([report], [], now);
      const distAlerts = alerts.filter((a) => a.type === "distribution_overdue");
      expect(distAlerts).toHaveLength(0);
    });

    it("does not fire when already distributed", () => {
      const report = makeReport({
        status: "approved",
        approval_date: "2026-01-01",
        distribution_date: "2026-01-20",
        report_period_end: "2026-06-01",
        visit_types: ["announced", "unannounced"],
        children_interviewed: ["Child A"],
        overall_quality_rating: "good",
        statement_of_purpose_compliant: true,
      });
      const alerts = identifyReg45Alerts([report], [], now);
      const distAlerts = alerts.filter((a) => a.type === "distribution_overdue");
      expect(distAlerts).toHaveLength(0);
    });
  });

  // ── ofsted_not_sent ───────────────────────────────────────────────────

  describe("Ofsted not sent", () => {
    it("fires when distributed but Ofsted not sent", () => {
      const report = makeReport({
        status: "distributed",
        ofsted_sent: false,
        placing_authority_sent: true,
        visit_types: ["announced", "unannounced"],
        children_interviewed: ["Child A"],
        overall_quality_rating: "good",
        statement_of_purpose_compliant: true,
        report_period_end: "2026-06-01",
      });
      const alerts = identifyReg45Alerts([report], [], now);
      const ofstedAlerts = alerts.filter((a) => a.type === "ofsted_not_sent");
      expect(ofstedAlerts).toHaveLength(1);
      expect(ofstedAlerts[0].severity).toBe("critical");
    });

    it("does not fire when Ofsted already sent", () => {
      const report = makeReport({
        status: "distributed",
        ofsted_sent: true,
        placing_authority_sent: true,
        visit_types: ["announced", "unannounced"],
        children_interviewed: ["Child A"],
        overall_quality_rating: "good",
        statement_of_purpose_compliant: true,
        report_period_end: "2026-06-01",
      });
      const alerts = identifyReg45Alerts([report], [], now);
      const ofstedAlerts = alerts.filter((a) => a.type === "ofsted_not_sent");
      expect(ofstedAlerts).toHaveLength(0);
    });

    it("does not fire for non-distributed report", () => {
      const report = makeReport({
        status: "approved",
        ofsted_sent: false,
        report_period_end: "2026-06-01",
        visit_types: ["announced", "unannounced"],
        children_interviewed: ["Child A"],
        overall_quality_rating: "good",
        statement_of_purpose_compliant: true,
        approval_date: "2026-06-10",
      });
      const alerts = identifyReg45Alerts([report], [], now);
      const ofstedAlerts = alerts.filter((a) => a.type === "ofsted_not_sent");
      expect(ofstedAlerts).toHaveLength(0);
    });
  });

  // ── placing_authority_not_sent ────────────────────────────────────────

  describe("placing authority not sent", () => {
    it("fires when distributed but placing authority not sent", () => {
      const report = makeReport({
        status: "distributed",
        placing_authority_sent: false,
        ofsted_sent: true,
        visit_types: ["announced", "unannounced"],
        children_interviewed: ["Child A"],
        overall_quality_rating: "good",
        statement_of_purpose_compliant: true,
        report_period_end: "2026-06-01",
      });
      const alerts = identifyReg45Alerts([report], [], now);
      const paAlerts = alerts.filter((a) => a.type === "placing_authority_not_sent");
      expect(paAlerts).toHaveLength(1);
      expect(paAlerts[0].severity).toBe("high");
    });

    it("does not fire when placing authority already sent", () => {
      const report = makeReport({
        status: "distributed",
        placing_authority_sent: true,
        ofsted_sent: true,
        visit_types: ["announced", "unannounced"],
        children_interviewed: ["Child A"],
        overall_quality_rating: "good",
        statement_of_purpose_compliant: true,
        report_period_end: "2026-06-01",
      });
      const alerts = identifyReg45Alerts([report], [], now);
      const paAlerts = alerts.filter((a) => a.type === "placing_authority_not_sent");
      expect(paAlerts).toHaveLength(0);
    });

    it("does not fire for non-distributed report", () => {
      const report = makeReport({
        status: "draft",
        placing_authority_sent: false,
        report_period_end: "2026-06-01",
        overall_quality_rating: "good",
        created_at: "2026-06-14T00:00:00Z",
      });
      const alerts = identifyReg45Alerts([report], [], now);
      const paAlerts = alerts.filter((a) => a.type === "placing_authority_not_sent");
      expect(paAlerts).toHaveLength(0);
    });
  });

  // ── no_unannounced_visit ──────────────────────────────────────────────

  describe("no unannounced visit", () => {
    it("fires when approved report has no unannounced visit", () => {
      const report = makeReport({
        status: "approved",
        visit_types: ["announced"],
        children_interviewed: ["Child A"],
        overall_quality_rating: "good",
        statement_of_purpose_compliant: true,
        report_period_end: "2026-06-01",
        approval_date: "2026-06-10",
      });
      const alerts = identifyReg45Alerts([report], [], now);
      const visitAlerts = alerts.filter((a) => a.type === "no_unannounced_visit");
      expect(visitAlerts).toHaveLength(1);
      expect(visitAlerts[0].severity).toBe("high");
    });

    it("fires when distributed report has no unannounced visit", () => {
      const report = makeReport({
        status: "distributed",
        visit_types: ["announced"],
        children_interviewed: ["Child A"],
        overall_quality_rating: "good",
        statement_of_purpose_compliant: true,
        ofsted_sent: true,
        placing_authority_sent: true,
        report_period_end: "2026-06-01",
      });
      const alerts = identifyReg45Alerts([report], [], now);
      const visitAlerts = alerts.filter((a) => a.type === "no_unannounced_visit");
      expect(visitAlerts).toHaveLength(1);
    });

    it("does not fire when unannounced visit is recorded", () => {
      const report = makeReport({
        status: "approved",
        visit_types: ["announced", "unannounced"],
        children_interviewed: ["Child A"],
        overall_quality_rating: "good",
        statement_of_purpose_compliant: true,
        report_period_end: "2026-06-01",
        approval_date: "2026-06-10",
      });
      const alerts = identifyReg45Alerts([report], [], now);
      const visitAlerts = alerts.filter((a) => a.type === "no_unannounced_visit");
      expect(visitAlerts).toHaveLength(0);
    });

    it("does not fire for draft report", () => {
      const report = makeReport({
        status: "draft",
        visit_types: ["announced"],
        overall_quality_rating: "good",
        report_period_end: "2026-06-01",
        created_at: "2026-06-14T00:00:00Z",
      });
      const alerts = identifyReg45Alerts([report], [], now);
      const visitAlerts = alerts.filter((a) => a.type === "no_unannounced_visit");
      expect(visitAlerts).toHaveLength(0);
    });

    it("does not fire for in_progress report", () => {
      const report = makeReport({
        status: "in_progress",
        visit_types: ["announced"],
        overall_quality_rating: "good",
        report_period_end: "2026-06-01",
      });
      const alerts = identifyReg45Alerts([report], [], now);
      const visitAlerts = alerts.filter((a) => a.type === "no_unannounced_visit");
      expect(visitAlerts).toHaveLength(0);
    });
  });

  // ── no_children_interviewed ───────────────────────────────────────────

  describe("no children interviewed", () => {
    it("fires when approved report has no children interviewed", () => {
      const report = makeReport({
        status: "approved",
        children_interviewed: [],
        visit_types: ["announced", "unannounced"],
        overall_quality_rating: "good",
        statement_of_purpose_compliant: true,
        report_period_end: "2026-06-01",
        approval_date: "2026-06-10",
      });
      const alerts = identifyReg45Alerts([report], [], now);
      const childAlerts = alerts.filter((a) => a.type === "no_children_interviewed");
      expect(childAlerts).toHaveLength(1);
      expect(childAlerts[0].severity).toBe("high");
    });

    it("fires when distributed report has no children interviewed", () => {
      const report = makeReport({
        status: "distributed",
        children_interviewed: [],
        visit_types: ["announced", "unannounced"],
        overall_quality_rating: "good",
        statement_of_purpose_compliant: true,
        ofsted_sent: true,
        placing_authority_sent: true,
        report_period_end: "2026-06-01",
      });
      const alerts = identifyReg45Alerts([report], [], now);
      const childAlerts = alerts.filter((a) => a.type === "no_children_interviewed");
      expect(childAlerts).toHaveLength(1);
    });

    it("does not fire when children are interviewed", () => {
      const report = makeReport({
        status: "approved",
        children_interviewed: ["Child A"],
        visit_types: ["announced", "unannounced"],
        overall_quality_rating: "good",
        statement_of_purpose_compliant: true,
        report_period_end: "2026-06-01",
        approval_date: "2026-06-10",
      });
      const alerts = identifyReg45Alerts([report], [], now);
      const childAlerts = alerts.filter((a) => a.type === "no_children_interviewed");
      expect(childAlerts).toHaveLength(0);
    });

    it("does not fire for draft report", () => {
      const report = makeReport({
        status: "draft",
        children_interviewed: [],
        overall_quality_rating: "good",
        report_period_end: "2026-06-01",
        created_at: "2026-06-14T00:00:00Z",
      });
      const alerts = identifyReg45Alerts([report], [], now);
      const childAlerts = alerts.filter((a) => a.type === "no_children_interviewed");
      expect(childAlerts).toHaveLength(0);
    });
  });

  // ── inadequate_rating ─────────────────────────────────────────────────

  describe("inadequate rating", () => {
    it("fires when overall quality rating is inadequate", () => {
      const report = makeReport({
        overall_quality_rating: "inadequate",
        status: "distributed",
        visit_types: ["announced", "unannounced"],
        children_interviewed: ["Child A"],
        statement_of_purpose_compliant: true,
        ofsted_sent: true,
        placing_authority_sent: true,
        report_period_end: "2026-06-01",
      });
      const alerts = identifyReg45Alerts([report], [], now);
      const ratingAlerts = alerts.filter((a) => a.type === "inadequate_rating");
      expect(ratingAlerts).toHaveLength(1);
      expect(ratingAlerts[0].severity).toBe("critical");
    });

    it("does not fire for good rating", () => {
      const report = makeReport({
        overall_quality_rating: "good",
        status: "distributed",
        visit_types: ["announced", "unannounced"],
        children_interviewed: ["Child A"],
        statement_of_purpose_compliant: true,
        ofsted_sent: true,
        placing_authority_sent: true,
        report_period_end: "2026-06-01",
      });
      const alerts = identifyReg45Alerts([report], [], now);
      const ratingAlerts = alerts.filter((a) => a.type === "inadequate_rating");
      expect(ratingAlerts).toHaveLength(0);
    });

    it("does not fire for outstanding rating", () => {
      const report = makeReport({
        overall_quality_rating: "outstanding",
        status: "distributed",
        visit_types: ["announced", "unannounced"],
        children_interviewed: ["Child A"],
        statement_of_purpose_compliant: true,
        ofsted_sent: true,
        placing_authority_sent: true,
        report_period_end: "2026-06-01",
      });
      const alerts = identifyReg45Alerts([report], [], now);
      const ratingAlerts = alerts.filter((a) => a.type === "inadequate_rating");
      expect(ratingAlerts).toHaveLength(0);
    });

    it("fires regardless of report status", () => {
      const report = makeReport({
        overall_quality_rating: "inadequate",
        status: "draft",
        report_period_end: "2026-06-01",
        created_at: "2026-06-14T00:00:00Z",
      });
      const alerts = identifyReg45Alerts([report], [], now);
      const ratingAlerts = alerts.filter((a) => a.type === "inadequate_rating");
      expect(ratingAlerts).toHaveLength(1);
    });
  });

  // ── requires_improvement_rating ───────────────────────────────────────

  describe("requires improvement rating", () => {
    it("fires when overall quality rating is requires_improvement", () => {
      const report = makeReport({
        overall_quality_rating: "requires_improvement",
        status: "distributed",
        visit_types: ["announced", "unannounced"],
        children_interviewed: ["Child A"],
        statement_of_purpose_compliant: true,
        ofsted_sent: true,
        placing_authority_sent: true,
        report_period_end: "2026-06-01",
      });
      const alerts = identifyReg45Alerts([report], [], now);
      const riAlerts = alerts.filter((a) => a.type === "requires_improvement_rating");
      expect(riAlerts).toHaveLength(1);
      expect(riAlerts[0].severity).toBe("high");
    });

    it("does not fire for good rating", () => {
      const report = makeReport({
        overall_quality_rating: "good",
        status: "distributed",
        visit_types: ["announced", "unannounced"],
        children_interviewed: ["Child A"],
        statement_of_purpose_compliant: true,
        ofsted_sent: true,
        placing_authority_sent: true,
        report_period_end: "2026-06-01",
      });
      const alerts = identifyReg45Alerts([report], [], now);
      const riAlerts = alerts.filter((a) => a.type === "requires_improvement_rating");
      expect(riAlerts).toHaveLength(0);
    });

    it("does not fire for outstanding rating", () => {
      const report = makeReport({
        overall_quality_rating: "outstanding",
        status: "distributed",
        visit_types: ["announced", "unannounced"],
        children_interviewed: ["Child A"],
        statement_of_purpose_compliant: true,
        ofsted_sent: true,
        placing_authority_sent: true,
        report_period_end: "2026-06-01",
      });
      const alerts = identifyReg45Alerts([report], [], now);
      const riAlerts = alerts.filter((a) => a.type === "requires_improvement_rating");
      expect(riAlerts).toHaveLength(0);
    });

    it("fires regardless of report status", () => {
      const report = makeReport({
        overall_quality_rating: "requires_improvement",
        status: "in_progress",
        report_period_end: "2026-06-01",
      });
      const alerts = identifyReg45Alerts([report], [], now);
      const riAlerts = alerts.filter((a) => a.type === "requires_improvement_rating");
      expect(riAlerts).toHaveLength(1);
    });
  });

  // ── sop_non_compliant ─────────────────────────────────────────────────

  describe("SoP non-compliant", () => {
    it("fires when approved report is SoP non-compliant", () => {
      const report = makeReport({
        status: "approved",
        statement_of_purpose_compliant: false,
        visit_types: ["announced", "unannounced"],
        children_interviewed: ["Child A"],
        overall_quality_rating: "good",
        report_period_end: "2026-06-01",
        approval_date: "2026-06-10",
      });
      const alerts = identifyReg45Alerts([report], [], now);
      const sopAlerts = alerts.filter((a) => a.type === "sop_non_compliant");
      expect(sopAlerts).toHaveLength(1);
      expect(sopAlerts[0].severity).toBe("high");
    });

    it("fires when distributed report is SoP non-compliant", () => {
      const report = makeReport({
        status: "distributed",
        statement_of_purpose_compliant: false,
        visit_types: ["announced", "unannounced"],
        children_interviewed: ["Child A"],
        overall_quality_rating: "good",
        ofsted_sent: true,
        placing_authority_sent: true,
        report_period_end: "2026-06-01",
      });
      const alerts = identifyReg45Alerts([report], [], now);
      const sopAlerts = alerts.filter((a) => a.type === "sop_non_compliant");
      expect(sopAlerts).toHaveLength(1);
    });

    it("does not fire when SoP is compliant", () => {
      const report = makeReport({
        status: "approved",
        statement_of_purpose_compliant: true,
        visit_types: ["announced", "unannounced"],
        children_interviewed: ["Child A"],
        overall_quality_rating: "good",
        report_period_end: "2026-06-01",
        approval_date: "2026-06-10",
      });
      const alerts = identifyReg45Alerts([report], [], now);
      const sopAlerts = alerts.filter((a) => a.type === "sop_non_compliant");
      expect(sopAlerts).toHaveLength(0);
    });

    it("does not fire for draft report", () => {
      const report = makeReport({
        status: "draft",
        statement_of_purpose_compliant: false,
        overall_quality_rating: "good",
        report_period_end: "2026-06-01",
        created_at: "2026-06-14T00:00:00Z",
      });
      const alerts = identifyReg45Alerts([report], [], now);
      const sopAlerts = alerts.filter((a) => a.type === "sop_non_compliant");
      expect(sopAlerts).toHaveLength(0);
    });

    it("does not fire for in_progress report", () => {
      const report = makeReport({
        status: "in_progress",
        statement_of_purpose_compliant: false,
        overall_quality_rating: "good",
        report_period_end: "2026-06-01",
      });
      const alerts = identifyReg45Alerts([report], [], now);
      const sopAlerts = alerts.filter((a) => a.type === "sop_non_compliant");
      expect(sopAlerts).toHaveLength(0);
    });
  });

  // ── draft_stale ───────────────────────────────────────────────────────

  describe("draft stale (>30 days)", () => {
    it("fires when draft report is older than 30 days", () => {
      const report = makeReport({
        status: "draft",
        created_at: "2026-05-01T00:00:00Z",
        overall_quality_rating: "good",
        report_period_end: "2026-06-01",
      });
      const alerts = identifyReg45Alerts([report], [], now);
      const draftAlerts = alerts.filter((a) => a.type === "draft_stale");
      expect(draftAlerts).toHaveLength(1);
      expect(draftAlerts[0].severity).toBe("medium");
    });

    it("does not fire when draft is less than 30 days old", () => {
      const report = makeReport({
        status: "draft",
        created_at: "2026-06-01T00:00:00Z",
        overall_quality_rating: "good",
        report_period_end: "2026-06-10",
      });
      const alerts = identifyReg45Alerts([report], [], now);
      const draftAlerts = alerts.filter((a) => a.type === "draft_stale");
      expect(draftAlerts).toHaveLength(0);
    });

    it("does not fire for non-draft report even if old", () => {
      const report = makeReport({
        status: "approved",
        created_at: "2025-01-01T00:00:00Z",
        visit_types: ["announced", "unannounced"],
        children_interviewed: ["Child A"],
        overall_quality_rating: "good",
        statement_of_purpose_compliant: true,
        report_period_end: "2026-06-01",
        approval_date: "2026-06-10",
      });
      const alerts = identifyReg45Alerts([report], [], now);
      const draftAlerts = alerts.filter((a) => a.type === "draft_stale");
      expect(draftAlerts).toHaveLength(0);
    });

    it("fires at exactly 31 days", () => {
      const report = makeReport({
        status: "draft",
        created_at: "2026-05-14T00:00:00Z",
        overall_quality_rating: "good",
        report_period_end: "2026-06-01",
      });
      const alerts = identifyReg45Alerts([report], [], now);
      const draftAlerts = alerts.filter((a) => a.type === "draft_stale");
      expect(draftAlerts).toHaveLength(1);
    });
  });

  // ── action_overdue ────────────────────────────────────────────────────

  describe("action overdue", () => {
    it("fires when open action is past due date", () => {
      const action = makeAction({
        status: "open",
        due_date: "2026-06-01",
        action_description: "Fix recording",
        assigned_to: "Staff B",
      });
      const alerts = identifyReg45Alerts([], [action], now);
      const overdueAlerts = alerts.filter((a) => a.type === "action_overdue");
      expect(overdueAlerts).toHaveLength(1);
      expect(overdueAlerts[0].severity).toBe("high");
      expect(overdueAlerts[0].message).toContain("Fix recording");
      expect(overdueAlerts[0].message).toContain("Staff B");
    });

    it("fires when in_progress action is past due date", () => {
      const action = makeAction({
        status: "in_progress",
        due_date: "2026-06-01",
      });
      const alerts = identifyReg45Alerts([], [action], now);
      const overdueAlerts = alerts.filter((a) => a.type === "action_overdue");
      expect(overdueAlerts).toHaveLength(1);
    });

    it("does not fire when due date is in the future", () => {
      const action = makeAction({
        status: "open",
        due_date: "2026-07-01",
      });
      const alerts = identifyReg45Alerts([], [action], now);
      const overdueAlerts = alerts.filter((a) => a.type === "action_overdue");
      expect(overdueAlerts).toHaveLength(0);
    });

    it("does not fire for completed actions", () => {
      const action = makeAction({
        status: "completed",
        due_date: "2026-01-01",
      });
      const alerts = identifyReg45Alerts([], [action], now);
      const overdueAlerts = alerts.filter((a) => a.type === "action_overdue");
      expect(overdueAlerts).toHaveLength(0);
    });

    it("does not fire for overdue-status actions (already marked)", () => {
      const action = makeAction({
        status: "overdue",
        due_date: "2026-01-01",
      });
      const alerts = identifyReg45Alerts([], [action], now);
      const overdueAlerts = alerts.filter((a) => a.type === "action_overdue");
      expect(overdueAlerts).toHaveLength(0);
    });

    it("critical priority action overdue gets critical severity", () => {
      const action = makeAction({
        status: "open",
        due_date: "2026-06-01",
        priority: "critical",
      });
      const alerts = identifyReg45Alerts([], [action], now);
      const overdueAlerts = alerts.filter((a) => a.type === "action_overdue");
      expect(overdueAlerts).toHaveLength(1);
      expect(overdueAlerts[0].severity).toBe("critical");
    });

    it("non-critical priority action overdue gets high severity", () => {
      const action = makeAction({
        status: "open",
        due_date: "2026-06-01",
        priority: "high",
      });
      const alerts = identifyReg45Alerts([], [action], now);
      const overdueAlerts = alerts.filter((a) => a.type === "action_overdue");
      expect(overdueAlerts[0].severity).toBe("high");
    });

    it("includes days overdue in the message", () => {
      const action = makeAction({
        status: "open",
        due_date: "2026-06-05",
      });
      const alerts = identifyReg45Alerts([], [action], now);
      const overdueAlerts = alerts.filter((a) => a.type === "action_overdue");
      // Math.round((June 15 noon - June 5 midnight) / 86400000) can be 10 or 11
      expect(overdueAlerts[0].message).toMatch(/\d+ days overdue/);
    });
  });

  // ── critical_action_not_started ───────────────────────────────────────

  describe("critical action not started", () => {
    it("fires when critical priority action is open", () => {
      const action = makeAction({
        priority: "critical",
        status: "open",
        action_description: "Urgent safeguarding fix",
      });
      const alerts = identifyReg45Alerts([], [action], now);
      const critAlerts = alerts.filter((a) => a.type === "critical_action_not_started");
      expect(critAlerts).toHaveLength(1);
      expect(critAlerts[0].severity).toBe("critical");
      expect(critAlerts[0].message).toContain("Urgent safeguarding fix");
    });

    it("does not fire when critical action is in_progress", () => {
      const action = makeAction({
        priority: "critical",
        status: "in_progress",
      });
      const alerts = identifyReg45Alerts([], [action], now);
      const critAlerts = alerts.filter((a) => a.type === "critical_action_not_started");
      expect(critAlerts).toHaveLength(0);
    });

    it("does not fire when critical action is completed", () => {
      const action = makeAction({
        priority: "critical",
        status: "completed",
      });
      const alerts = identifyReg45Alerts([], [action], now);
      const critAlerts = alerts.filter((a) => a.type === "critical_action_not_started");
      expect(critAlerts).toHaveLength(0);
    });

    it("does not fire for non-critical open action", () => {
      const action = makeAction({
        priority: "high",
        status: "open",
      });
      const alerts = identifyReg45Alerts([], [action], now);
      const critAlerts = alerts.filter((a) => a.type === "critical_action_not_started");
      expect(critAlerts).toHaveLength(0);
    });

    it("does not fire for medium priority open action", () => {
      const action = makeAction({
        priority: "medium",
        status: "open",
      });
      const alerts = identifyReg45Alerts([], [action], now);
      const critAlerts = alerts.filter((a) => a.type === "critical_action_not_started");
      expect(critAlerts).toHaveLength(0);
    });

    it("does not fire for low priority open action", () => {
      const action = makeAction({
        priority: "low",
        status: "open",
      });
      const alerts = identifyReg45Alerts([], [action], now);
      const critAlerts = alerts.filter((a) => a.type === "critical_action_not_started");
      expect(critAlerts).toHaveLength(0);
    });
  });

  // ── combined alerts ───────────────────────────────────────────────────

  describe("combined alerts", () => {
    it("generates multiple alerts from a single problematic report", () => {
      const report = makeReport({
        status: "distributed",
        ofsted_sent: false,
        placing_authority_sent: false,
        visit_types: ["announced"],
        children_interviewed: [],
        overall_quality_rating: "inadequate",
        statement_of_purpose_compliant: false,
        report_period_end: "2026-06-01",
      });
      const alerts = identifyReg45Alerts([report], [], now);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("ofsted_not_sent");
      expect(types).toContain("placing_authority_not_sent");
      expect(types).toContain("no_unannounced_visit");
      expect(types).toContain("no_children_interviewed");
      expect(types).toContain("inadequate_rating");
      expect(types).toContain("sop_non_compliant");
    });

    it("generates alerts from both reports and actions", () => {
      const report = makeReport({
        status: "distributed",
        ofsted_sent: false,
        placing_authority_sent: true,
        visit_types: ["announced", "unannounced"],
        children_interviewed: ["Child A"],
        overall_quality_rating: "good",
        statement_of_purpose_compliant: true,
        report_period_end: "2026-06-01",
      });
      const action = makeAction({
        priority: "critical",
        status: "open",
        due_date: "2026-06-01",
      });
      const alerts = identifyReg45Alerts([report], [action], now);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("ofsted_not_sent");
      expect(types).toContain("action_overdue");
      expect(types).toContain("critical_action_not_started");
    });

    it("generates alerts across multiple reports", () => {
      const reportA = makeReport({
        id: "r-a",
        status: "distributed",
        ofsted_sent: false,
        placing_authority_sent: true,
        visit_types: ["announced", "unannounced"],
        children_interviewed: ["Child A"],
        overall_quality_rating: "good",
        statement_of_purpose_compliant: true,
        report_period_end: "2026-06-01",
      });
      const reportB = makeReport({
        id: "r-b",
        status: "distributed",
        ofsted_sent: true,
        placing_authority_sent: false,
        visit_types: ["announced", "unannounced"],
        children_interviewed: ["Child B"],
        overall_quality_rating: "requires_improvement",
        statement_of_purpose_compliant: true,
        report_period_end: "2026-05-01",
      });
      const alerts = identifyReg45Alerts([reportA, reportB], [], now);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("ofsted_not_sent");
      expect(types).toContain("placing_authority_not_sent");
      expect(types).toContain("requires_improvement_rating");
    });

    it("generates alerts across multiple actions", () => {
      const actions = [
        makeAction({
          id: "a1",
          priority: "critical",
          status: "open",
          due_date: "2026-06-01",
        }),
        makeAction({
          id: "a2",
          priority: "high",
          status: "open",
          due_date: "2026-06-10",
        }),
      ];
      const alerts = identifyReg45Alerts([], actions, now);
      const overdueAlerts = alerts.filter((a) => a.type === "action_overdue");
      expect(overdueAlerts).toHaveLength(2);
      const critAlerts = alerts.filter((a) => a.type === "critical_action_not_started");
      expect(critAlerts).toHaveLength(1);
    });

    it("each alert has all required fields", () => {
      const report = makeReport({
        status: "distributed",
        ofsted_sent: false,
        placing_authority_sent: true,
        visit_types: ["announced", "unannounced"],
        children_interviewed: ["Child A"],
        overall_quality_rating: "good",
        statement_of_purpose_compliant: true,
        report_period_end: "2026-06-01",
      });
      const alerts = identifyReg45Alerts([report], [], now);
      for (const alert of alerts) {
        expect(alert).toHaveProperty("type");
        expect(alert).toHaveProperty("severity");
        expect(alert).toHaveProperty("message");
        expect(alert).toHaveProperty("id");
        expect(typeof alert.type).toBe("string");
        expect(["critical", "high", "medium"]).toContain(alert.severity);
        expect(typeof alert.message).toBe("string");
        expect(alert.message.length).toBeGreaterThan(0);
        expect(typeof alert.id).toBe("string");
      }
    });

    it("report_overdue with a stale draft and overdue actions", () => {
      const report = makeReport({
        id: "r-stale",
        status: "draft",
        report_period_end: "2025-10-01",
        created_at: "2025-10-01T00:00:00Z",
        overall_quality_rating: "good",
      });
      const action = makeAction({
        id: "a-overdue",
        status: "open",
        due_date: "2026-05-01",
        priority: "high",
      });
      const alerts = identifyReg45Alerts([report], [action], now);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("report_overdue");
      expect(types).toContain("draft_stale");
      expect(types).toContain("action_overdue");
    });

    it("alert IDs match the source report or action ID", () => {
      const report = makeReport({
        id: "specific-report-id",
        status: "distributed",
        ofsted_sent: false,
        placing_authority_sent: true,
        visit_types: ["announced", "unannounced"],
        children_interviewed: ["Child A"],
        overall_quality_rating: "good",
        statement_of_purpose_compliant: true,
        report_period_end: "2026-06-01",
      });
      const action = makeAction({
        id: "specific-action-id",
        priority: "critical",
        status: "open",
        due_date: "2026-06-01",
      });
      const alerts = identifyReg45Alerts([report], [action], now);
      const reportAlert = alerts.find((a) => a.type === "ofsted_not_sent");
      expect(reportAlert?.id).toBe("specific-report-id");
      const actionAlert = alerts.find((a) => a.type === "critical_action_not_started");
      expect(actionAlert?.id).toBe("specific-action-id");
    });

    it("no alerts for awaiting_approval report that is recent", () => {
      const report = makeReport({
        status: "awaiting_approval",
        overall_quality_rating: "good",
        report_period_end: "2026-06-01",
        created_at: "2026-06-10T00:00:00Z",
      });
      const alerts = identifyReg45Alerts([report], [], now);
      expect(alerts).toEqual([]);
    });

    it("archived report only checks rating alerts", () => {
      const report = makeReport({
        status: "archived",
        overall_quality_rating: "good",
        statement_of_purpose_compliant: false,
        visit_types: ["announced"],
        children_interviewed: [],
        ofsted_sent: false,
        placing_authority_sent: false,
        report_period_end: "2026-06-01",
      });
      const alerts = identifyReg45Alerts([report], [], now);
      const types = alerts.map((a) => a.type);
      // Archived is not "approved" or "distributed", so no visit/children/SoP/ofsted/PA alerts
      expect(types).not.toContain("no_unannounced_visit");
      expect(types).not.toContain("no_children_interviewed");
      expect(types).not.toContain("sop_non_compliant");
      expect(types).not.toContain("ofsted_not_sent");
      expect(types).not.toContain("placing_authority_not_sent");
    });

    it("empty visit_types array triggers no_unannounced_visit for approved report", () => {
      const report = makeReport({
        status: "approved",
        visit_types: [],
        children_interviewed: ["Child A"],
        overall_quality_rating: "good",
        statement_of_purpose_compliant: true,
        report_period_end: "2026-06-01",
        approval_date: "2026-06-10",
      });
      const alerts = identifyReg45Alerts([report], [], now);
      const visitAlerts = alerts.filter((a) => a.type === "no_unannounced_visit");
      expect(visitAlerts).toHaveLength(1);
    });

    it("severity is always one of critical, high, or medium", () => {
      const report = makeReport({
        status: "distributed",
        ofsted_sent: false,
        placing_authority_sent: false,
        visit_types: ["announced"],
        children_interviewed: [],
        overall_quality_rating: "inadequate",
        statement_of_purpose_compliant: false,
        report_period_end: "2026-06-01",
      });
      const action = makeAction({
        priority: "critical",
        status: "open",
        due_date: "2026-06-01",
      });
      const alerts = identifyReg45Alerts([report], [action], now);
      const validSeverities = new Set(["critical", "high", "medium"]);
      for (const alert of alerts) {
        expect(validSeverities.has(alert.severity)).toBe(true);
      }
    });

    it("critical priority overdue action generates both action_overdue and critical_action_not_started", () => {
      const action = makeAction({
        priority: "critical",
        status: "open",
        due_date: "2026-06-01",
        action_description: "Urgent fix",
      });
      const alerts = identifyReg45Alerts([], [action], now);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("action_overdue");
      expect(types).toContain("critical_action_not_started");
      expect(alerts.filter((a) => a.type === "action_overdue")[0].severity).toBe("critical");
    });
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 4. CRUD FALLBACK (Supabase disabled)
// ════════════════════════════════════════════════════════════════════════════

describe("CRUD fallback (Supabase disabled)", () => {
  // ── listReports ────────────────────────────────────────────────────────

  describe("listReports", () => {
    it("returns ok with empty array", async () => {
      const result = await listReports("home-1");
      expect(result).toEqual({ ok: true, data: [] });
    });

    it("returns ok with empty array when filters provided", async () => {
      const result = await listReports("home-1", {
        status: "draft",
        qualityRating: "good",
        dateFrom: "2026-01-01",
        dateTo: "2026-06-30",
        limit: 10,
      });
      expect(result).toEqual({ ok: true, data: [] });
    });

    it("result has ok property set to true", async () => {
      const result = await listReports("home-1");
      expect(result.ok).toBe(true);
    });

    it("result data is an array", async () => {
      const result = await listReports("home-1");
      expect(Array.isArray(result.ok ? result.data : null)).toBe(true);
    });
  });

  // ── createReport ───────────────────────────────────────────────────────

  describe("createReport", () => {
    it("returns error when Supabase not configured", async () => {
      const result = await createReport({
        homeId: "home-1",
        reportPeriodStart: "2026-01-01",
        reportPeriodEnd: "2026-06-30",
        responsibleIndividual: "Jane Doe",
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe("Supabase not configured");
      }
    });

    it("returns error with minimal input", async () => {
      const result = await createReport({
        homeId: "home-1",
        reportPeriodStart: "2026-01-01",
        reportPeriodEnd: "2026-06-30",
        responsibleIndividual: "Jane Doe",
      });
      expect(result.ok).toBe(false);
    });

    it("returns error with full input", async () => {
      const result = await createReport({
        homeId: "home-1",
        reportPeriodStart: "2026-01-01",
        reportPeriodEnd: "2026-06-30",
        responsibleIndividual: "Jane Doe",
        visitDates: ["2026-03-01"],
        visitTypes: ["announced"],
        childrenInterviewed: ["Child A"],
        staffInterviewed: ["Staff A"],
        overallQualityRating: "good",
        evaluations: [
          { area: "quality_of_care", rating: "good", findings: "Good", recommendations: "None" },
        ],
        reg44ReportsReviewed: 3,
        reg44ActionsOutstanding: 1,
        statementOfPurposeCompliant: true,
        keyStrengths: ["Strong care"],
        areasForImprovement: ["Record keeping"],
        notes: "Test note",
      });
      expect(result.ok).toBe(false);
    });
  });

  // ── updateReport ───────────────────────────────────────────────────────

  describe("updateReport", () => {
    it("returns error when Supabase not configured", async () => {
      const result = await updateReport("report-1", { status: "approved" });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe("Supabase not configured");
      }
    });

    it("returns error with partial updates", async () => {
      const result = await updateReport("report-1", {
        overall_quality_rating: "outstanding",
        notes: "Updated notes",
      });
      expect(result.ok).toBe(false);
    });

    it("returns error with empty updates", async () => {
      const result = await updateReport("report-1", {});
      expect(result.ok).toBe(false);
    });
  });

  // ── listActions ────────────────────────────────────────────────────────

  describe("listActions", () => {
    it("returns ok with empty array", async () => {
      const result = await listActions("home-1");
      expect(result).toEqual({ ok: true, data: [] });
    });

    it("returns ok with empty array when filters provided", async () => {
      const result = await listActions("home-1", {
        reportId: "report-1",
        status: "open",
        priority: "high",
        evaluationArea: "safeguarding",
        limit: 25,
      });
      expect(result).toEqual({ ok: true, data: [] });
    });

    it("result has ok property set to true", async () => {
      const result = await listActions("home-1");
      expect(result.ok).toBe(true);
    });

    it("result data is an array", async () => {
      const result = await listActions("home-1");
      expect(Array.isArray(result.ok ? result.data : null)).toBe(true);
    });
  });

  // ── createAction ───────────────────────────────────────────────────────

  describe("createAction", () => {
    it("returns error when Supabase not configured", async () => {
      const result = await createAction({
        homeId: "home-1",
        reportId: "report-1",
        actionDescription: "Improve recording",
        evaluationArea: "quality_of_care",
        assignedTo: "Staff A",
        dueDate: "2026-07-01",
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe("Supabase not configured");
      }
    });

    it("returns error with minimal input", async () => {
      const result = await createAction({
        homeId: "home-1",
        reportId: "report-1",
        actionDescription: "Fix issue",
        evaluationArea: "safeguarding",
        assignedTo: "Staff B",
        dueDate: "2026-08-01",
      });
      expect(result.ok).toBe(false);
    });

    it("returns error with full input including priority", async () => {
      const result = await createAction({
        homeId: "home-1",
        reportId: "report-1",
        actionDescription: "Critical fix",
        evaluationArea: "safeguarding",
        priority: "critical",
        assignedTo: "Staff C",
        dueDate: "2026-07-15",
      });
      expect(result.ok).toBe(false);
    });
  });

  // ── updateAction ───────────────────────────────────────────────────────

  describe("updateAction", () => {
    it("returns error when Supabase not configured", async () => {
      const result = await updateAction("action-1", { status: "completed" });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe("Supabase not configured");
      }
    });

    it("returns error with partial updates", async () => {
      const result = await updateAction("action-1", {
        status: "in_progress",
        completion_notes: "In progress",
      });
      expect(result.ok).toBe(false);
    });

    it("returns error with empty updates", async () => {
      const result = await updateAction("action-1", {});
      expect(result.ok).toBe(false);
    });
  });

  // ── Cross-function consistency ─────────────────────────────────────────

  describe("cross-function consistency", () => {
    it("list functions return ServiceResult with ok:true shape", async () => {
      const reports = await listReports("home-1");
      const actions = await listActions("home-1");
      expect(reports).toHaveProperty("ok", true);
      expect(reports).toHaveProperty("data");
      expect(actions).toHaveProperty("ok", true);
      expect(actions).toHaveProperty("data");
    });

    it("create functions return ServiceResult with ok:false shape", async () => {
      const report = await createReport({
        homeId: "h",
        reportPeriodStart: "2026-01-01",
        reportPeriodEnd: "2026-06-30",
        responsibleIndividual: "RI",
      });
      const action = await createAction({
        homeId: "h",
        reportId: "r",
        actionDescription: "d",
        evaluationArea: "quality_of_care",
        assignedTo: "a",
        dueDate: "2026-07-01",
      });
      expect(report).toHaveProperty("ok", false);
      expect(report).toHaveProperty("error");
      expect(action).toHaveProperty("ok", false);
      expect(action).toHaveProperty("error");
    });

    it("update functions return ServiceResult with ok:false shape", async () => {
      const report = await updateReport("id", {});
      const action = await updateAction("id", {});
      expect(report).toHaveProperty("ok", false);
      expect(report).toHaveProperty("error");
      expect(action).toHaveProperty("ok", false);
      expect(action).toHaveProperty("error");
    });

    it("list functions return empty arrays not undefined", async () => {
      const reports = await listReports("any-home");
      const actions = await listActions("any-home");
      if (reports.ok) expect(reports.data).toEqual([]);
      if (actions.ok) expect(actions.data).toEqual([]);
    });

    it("create error messages match exactly", async () => {
      const reportRes = await createReport({
        homeId: "h",
        reportPeriodStart: "2026-01-01",
        reportPeriodEnd: "2026-06-30",
        responsibleIndividual: "RI",
      });
      const actionRes = await createAction({
        homeId: "h",
        reportId: "r",
        actionDescription: "d",
        evaluationArea: "quality_of_care",
        assignedTo: "a",
        dueDate: "2026-07-01",
      });
      if (!reportRes.ok) expect(reportRes.error).toBe("Supabase not configured");
      if (!actionRes.ok) expect(actionRes.error).toBe("Supabase not configured");
    });

    it("update error messages match exactly", async () => {
      const reportRes = await updateReport("id", { status: "draft" });
      const actionRes = await updateAction("id", { status: "open" });
      if (!reportRes.ok) expect(reportRes.error).toBe("Supabase not configured");
      if (!actionRes.ok) expect(actionRes.error).toBe("Supabase not configured");
    });

    it("listReports with only status filter returns empty", async () => {
      const result = await listReports("home-1", { status: "approved" });
      expect(result).toEqual({ ok: true, data: [] });
    });

    it("listReports with only date range filter returns empty", async () => {
      const result = await listReports("home-1", { dateFrom: "2026-01-01", dateTo: "2026-12-31" });
      expect(result).toEqual({ ok: true, data: [] });
    });

    it("listActions with only reportId filter returns empty", async () => {
      const result = await listActions("home-1", { reportId: "report-1" });
      expect(result).toEqual({ ok: true, data: [] });
    });

    it("listActions with only priority filter returns empty", async () => {
      const result = await listActions("home-1", { priority: "critical" });
      expect(result).toEqual({ ok: true, data: [] });
    });

    it("listActions with only evaluationArea filter returns empty", async () => {
      const result = await listActions("home-1", { evaluationArea: "safeguarding" });
      expect(result).toEqual({ ok: true, data: [] });
    });
  });
});
