// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — PROVIDER VISITS SERVICE TESTS
// Pure-function tests for visit metrics computation, alert identification,
// constant validation, and CRUD fallback behaviour.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeAll } from "vitest";

import {
  VISIT_TYPES,
  VISIT_OUTCOMES,
  VISIT_STATUSES,
  _testing,
} from "../provider-visits-service";

import type {
  ProviderVisit,
  VisitType,
  VisitOutcome,
  VisitStatus,
} from "../provider-visits-service";

const { computeVisitMetrics, identifyVisitAlerts } = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

const now = new Date(new Date().toISOString().split("T")[0]);

function makeVisit(
  overrides: Partial<{
    id: string;
    home_id: string;
    visit_type: VisitType;
    visitor_name: string;
    visitor_organisation: string;
    visit_date: string;
    visit_status: VisitStatus;
    outcome: VisitOutcome | null;
    children_seen: string[];
    children_spoken_privately: string[];
    staff_spoken_to: string[];
    premises_inspected: boolean;
    records_reviewed: boolean;
    actions_raised: string[];
    actions_completed: number;
    report_received: boolean;
    report_date: string | null;
    next_visit_due: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
  }> = {},
): ProviderVisit {
  return {
    id: "id" in overrides ? overrides.id! : "pv-1",
    home_id: "home_id" in overrides ? overrides.home_id! : "home-1",
    visit_type: "visit_type" in overrides ? overrides.visit_type! : "social_worker",
    visitor_name: "visitor_name" in overrides ? overrides.visitor_name! : "Jane Smith",
    visitor_organisation: "visitor_organisation" in overrides ? overrides.visitor_organisation! : "Local Authority",
    visit_date: "visit_date" in overrides ? overrides.visit_date! : "2026-05-01",
    visit_status: "visit_status" in overrides ? overrides.visit_status! : "completed",
    outcome: "outcome" in overrides ? overrides.outcome! : "satisfactory",
    children_seen: "children_seen" in overrides ? overrides.children_seen! : ["child-1"],
    children_spoken_privately: "children_spoken_privately" in overrides ? overrides.children_spoken_privately! : ["child-1"],
    staff_spoken_to: "staff_spoken_to" in overrides ? overrides.staff_spoken_to! : ["staff-1"],
    premises_inspected: "premises_inspected" in overrides ? overrides.premises_inspected! : true,
    records_reviewed: "records_reviewed" in overrides ? overrides.records_reviewed! : true,
    actions_raised: "actions_raised" in overrides ? overrides.actions_raised! : [],
    actions_completed: "actions_completed" in overrides ? overrides.actions_completed! : 0,
    report_received: "report_received" in overrides ? overrides.report_received! : true,
    report_date: "report_date" in overrides ? overrides.report_date! : "2026-05-02",
    next_visit_due: "next_visit_due" in overrides ? overrides.next_visit_due! : "2026-06-01",
    notes: "notes" in overrides ? overrides.notes! : null,
    created_at: "created_at" in overrides ? overrides.created_at! : "2026-05-01T10:00:00Z",
    updated_at: "updated_at" in overrides ? overrides.updated_at! : "2026-05-01T10:00:00Z",
  };
}

/** Return a date string N days before `now`. */
function daysAgo(n: number): string {
  const d = new Date(now);
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

/** Return a date string N days after `now`. */
function daysAhead(n: number): string {
  const d = new Date(now);
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

// ══════════════════════════════════════════════════════════════════════════════
// 1. computeVisitMetrics
// ══════════════════════════════════════════════════════════════════════════════

describe("computeVisitMetrics", () => {
  // ── Empty input ──────────────────────────────────────────────────────────

  describe("empty visits", () => {
    it("returns zero total_visits for empty array", () => {
      const m = computeVisitMetrics([], now);
      expect(m.total_visits).toBe(0);
    });

    it("returns zero completed_visits for empty array", () => {
      const m = computeVisitMetrics([], now);
      expect(m.completed_visits).toBe(0);
    });

    it("returns zero scheduled_visits for empty array", () => {
      const m = computeVisitMetrics([], now);
      expect(m.scheduled_visits).toBe(0);
    });

    it("returns zero overdue_visits for empty array", () => {
      const m = computeVisitMetrics([], now);
      expect(m.overdue_visits).toBe(0);
    });

    it("returns zero cancelled_visits for empty array", () => {
      const m = computeVisitMetrics([], now);
      expect(m.cancelled_visits).toBe(0);
    });

    it("returns zero satisfactory_rate for empty array", () => {
      const m = computeVisitMetrics([], now);
      expect(m.satisfactory_rate).toBe(0);
    });

    it("returns zero concerns_raised_count for empty array", () => {
      const m = computeVisitMetrics([], now);
      expect(m.concerns_raised_count).toBe(0);
    });

    it("returns zero actions_outstanding for empty array", () => {
      const m = computeVisitMetrics([], now);
      expect(m.actions_outstanding).toBe(0);
    });

    it("returns zero reports_pending for empty array", () => {
      const m = computeVisitMetrics([], now);
      expect(m.reports_pending).toBe(0);
    });

    it("returns zero children_seen_rate for empty array", () => {
      const m = computeVisitMetrics([], now);
      expect(m.children_seen_rate).toBe(0);
    });

    it("returns zero premises_inspected_rate for empty array", () => {
      const m = computeVisitMetrics([], now);
      expect(m.premises_inspected_rate).toBe(0);
    });

    it("returns zero records_reviewed_rate for empty array", () => {
      const m = computeVisitMetrics([], now);
      expect(m.records_reviewed_rate).toBe(0);
    });

    it("returns zero reg_44_completed for empty array", () => {
      const m = computeVisitMetrics([], now);
      expect(m.reg_44_completed).toBe(0);
    });

    it("returns zero reg_44_overdue for empty array", () => {
      const m = computeVisitMetrics([], now);
      expect(m.reg_44_overdue).toBe(0);
    });

    it("returns zero sw_visits_completed for empty array", () => {
      const m = computeVisitMetrics([], now);
      expect(m.sw_visits_completed).toBe(0);
    });

    it("returns empty by_visit_type for empty array", () => {
      const m = computeVisitMetrics([], now);
      expect(m.by_visit_type).toEqual({});
    });

    it("returns empty by_outcome for empty array", () => {
      const m = computeVisitMetrics([], now);
      expect(m.by_outcome).toEqual({});
    });

    it("returns empty by_status for empty array", () => {
      const m = computeVisitMetrics([], now);
      expect(m.by_status).toEqual({});
    });
  });

  // ── Single visit ─────────────────────────────────────────────────────────

  describe("single completed visit", () => {
    const single = [makeVisit()];

    it("counts total_visits as 1", () => {
      expect(computeVisitMetrics(single, now).total_visits).toBe(1);
    });

    it("counts completed_visits as 1", () => {
      expect(computeVisitMetrics(single, now).completed_visits).toBe(1);
    });

    it("counts scheduled_visits as 0", () => {
      expect(computeVisitMetrics(single, now).scheduled_visits).toBe(0);
    });

    it("returns 100% satisfactory_rate when outcome is satisfactory", () => {
      expect(computeVisitMetrics(single, now).satisfactory_rate).toBe(100);
    });

    it("returns 100% children_seen_rate when private discussion recorded", () => {
      expect(computeVisitMetrics(single, now).children_seen_rate).toBe(100);
    });

    it("returns 100% premises_inspected_rate when premises inspected", () => {
      expect(computeVisitMetrics(single, now).premises_inspected_rate).toBe(100);
    });

    it("returns 100% records_reviewed_rate when records reviewed", () => {
      expect(computeVisitMetrics(single, now).records_reviewed_rate).toBe(100);
    });

    it("populates by_visit_type with social_worker=1", () => {
      expect(computeVisitMetrics(single, now).by_visit_type).toEqual({ social_worker: 1 });
    });

    it("populates by_outcome with satisfactory=1", () => {
      expect(computeVisitMetrics(single, now).by_outcome).toEqual({ satisfactory: 1 });
    });

    it("populates by_status with completed=1", () => {
      expect(computeVisitMetrics(single, now).by_status).toEqual({ completed: 1 });
    });
  });

  // ── Status counting ──────────────────────────────────────────────────────

  describe("all statuses", () => {
    const visits = [
      makeVisit({ id: "v1", visit_status: "completed", outcome: "satisfactory" }),
      makeVisit({ id: "v2", visit_status: "scheduled", visit_date: daysAhead(10) }),
      makeVisit({ id: "v3", visit_status: "overdue" }),
      makeVisit({ id: "v4", visit_status: "cancelled" }),
      makeVisit({ id: "v5", visit_status: "rescheduled" }),
      makeVisit({ id: "v6", visit_status: "no_show" }),
    ];

    it("counts total_visits correctly", () => {
      expect(computeVisitMetrics(visits, now).total_visits).toBe(6);
    });

    it("counts completed_visits correctly", () => {
      expect(computeVisitMetrics(visits, now).completed_visits).toBe(1);
    });

    it("counts scheduled_visits correctly", () => {
      expect(computeVisitMetrics(visits, now).scheduled_visits).toBe(1);
    });

    it("counts overdue_visits correctly (status=overdue only, scheduled in future)", () => {
      expect(computeVisitMetrics(visits, now).overdue_visits).toBe(1);
    });

    it("counts cancelled_visits correctly", () => {
      expect(computeVisitMetrics(visits, now).cancelled_visits).toBe(1);
    });

    it("populates by_status with all statuses", () => {
      const m = computeVisitMetrics(visits, now);
      expect(m.by_status.completed).toBe(1);
      expect(m.by_status.scheduled).toBe(1);
      expect(m.by_status.overdue).toBe(1);
      expect(m.by_status.cancelled).toBe(1);
      expect(m.by_status.rescheduled).toBe(1);
      expect(m.by_status.no_show).toBe(1);
    });
  });

  // ── satisfactory_rate ────────────────────────────────────────────────────

  describe("satisfactory_rate", () => {
    it("returns 0 when no completed visits", () => {
      const visits = [makeVisit({ visit_status: "scheduled", visit_date: daysAhead(5) })];
      expect(computeVisitMetrics(visits, now).satisfactory_rate).toBe(0);
    });

    it("returns 50% when half of completed visits are satisfactory", () => {
      const visits = [
        makeVisit({ id: "v1", visit_status: "completed", outcome: "satisfactory" }),
        makeVisit({ id: "v2", visit_status: "completed", outcome: "concerns_raised" }),
      ];
      expect(computeVisitMetrics(visits, now).satisfactory_rate).toBe(50);
    });

    it("returns 100% when all completed visits are satisfactory", () => {
      const visits = [
        makeVisit({ id: "v1", visit_status: "completed", outcome: "satisfactory" }),
        makeVisit({ id: "v2", visit_status: "completed", outcome: "satisfactory" }),
      ];
      expect(computeVisitMetrics(visits, now).satisfactory_rate).toBe(100);
    });

    it("returns 33.3% when 1 of 3 completed visits are satisfactory", () => {
      const visits = [
        makeVisit({ id: "v1", visit_status: "completed", outcome: "satisfactory" }),
        makeVisit({ id: "v2", visit_status: "completed", outcome: "concerns_raised" }),
        makeVisit({ id: "v3", visit_status: "completed", outcome: "actions_required" }),
      ];
      expect(computeVisitMetrics(visits, now).satisfactory_rate).toBe(33.3);
    });

    it("rounds to one decimal place", () => {
      const visits = [
        makeVisit({ id: "v1", visit_status: "completed", outcome: "satisfactory" }),
        makeVisit({ id: "v2", visit_status: "completed", outcome: "satisfactory" }),
        makeVisit({ id: "v3", visit_status: "completed", outcome: "concerns_raised" }),
      ];
      expect(computeVisitMetrics(visits, now).satisfactory_rate).toBe(66.7);
    });

    it("ignores non-completed visits for rate calculation", () => {
      const visits = [
        makeVisit({ id: "v1", visit_status: "completed", outcome: "satisfactory" }),
        makeVisit({ id: "v2", visit_status: "cancelled", outcome: null }),
        makeVisit({ id: "v3", visit_status: "scheduled", visit_date: daysAhead(5) }),
      ];
      expect(computeVisitMetrics(visits, now).satisfactory_rate).toBe(100);
    });
  });

  // ── concerns_raised_count ────────────────────────────────────────────────

  describe("concerns_raised_count", () => {
    it("returns 0 when no concerns", () => {
      const visits = [makeVisit({ outcome: "satisfactory" })];
      expect(computeVisitMetrics(visits, now).concerns_raised_count).toBe(0);
    });

    it("counts visits with concerns_raised outcome across all statuses", () => {
      const visits = [
        makeVisit({ id: "v1", visit_status: "completed", outcome: "concerns_raised" }),
        makeVisit({ id: "v2", visit_status: "completed", outcome: "concerns_raised" }),
        makeVisit({ id: "v3", visit_status: "completed", outcome: "satisfactory" }),
      ];
      expect(computeVisitMetrics(visits, now).concerns_raised_count).toBe(2);
    });

    it("counts concerns from non-completed visits too", () => {
      const visits = [
        makeVisit({ id: "v1", visit_status: "overdue", outcome: "concerns_raised" }),
      ];
      expect(computeVisitMetrics(visits, now).concerns_raised_count).toBe(1);
    });
  });

  // ── actions_outstanding ──────────────────────────────────────────────────

  describe("actions_outstanding", () => {
    it("returns 0 when no actions raised", () => {
      const visits = [makeVisit({ actions_raised: [], actions_completed: 0 })];
      expect(computeVisitMetrics(visits, now).actions_outstanding).toBe(0);
    });

    it("calculates outstanding as actions_raised minus actions_completed", () => {
      const visits = [makeVisit({ actions_raised: ["a1", "a2", "a3"], actions_completed: 1 })];
      expect(computeVisitMetrics(visits, now).actions_outstanding).toBe(2);
    });

    it("sums outstanding across multiple visits", () => {
      const visits = [
        makeVisit({ id: "v1", actions_raised: ["a1", "a2"], actions_completed: 0 }),
        makeVisit({ id: "v2", actions_raised: ["a3"], actions_completed: 0 }),
      ];
      expect(computeVisitMetrics(visits, now).actions_outstanding).toBe(3);
    });

    it("returns 0 when all actions completed", () => {
      const visits = [makeVisit({ actions_raised: ["a1", "a2"], actions_completed: 2 })];
      expect(computeVisitMetrics(visits, now).actions_outstanding).toBe(0);
    });

    it("never goes negative even if actions_completed exceeds actions_raised", () => {
      const visits = [makeVisit({ actions_raised: ["a1"], actions_completed: 5 })];
      expect(computeVisitMetrics(visits, now).actions_outstanding).toBe(0);
    });
  });

  // ── reports_pending ──────────────────────────────────────────────────────

  describe("reports_pending", () => {
    it("returns 0 when all completed visits have reports", () => {
      const visits = [makeVisit({ visit_status: "completed", report_received: true })];
      expect(computeVisitMetrics(visits, now).reports_pending).toBe(0);
    });

    it("counts completed visits without reports", () => {
      const visits = [
        makeVisit({ id: "v1", visit_status: "completed", report_received: false }),
        makeVisit({ id: "v2", visit_status: "completed", report_received: false }),
        makeVisit({ id: "v3", visit_status: "completed", report_received: true }),
      ];
      expect(computeVisitMetrics(visits, now).reports_pending).toBe(2);
    });

    it("ignores non-completed visits for report pending count", () => {
      const visits = [
        makeVisit({ id: "v1", visit_status: "scheduled", report_received: false, visit_date: daysAhead(5) }),
        makeVisit({ id: "v2", visit_status: "cancelled", report_received: false }),
      ];
      expect(computeVisitMetrics(visits, now).reports_pending).toBe(0);
    });
  });

  // ── children_seen_rate ───────────────────────────────────────────────────

  describe("children_seen_rate", () => {
    it("returns 0 when no completed visits", () => {
      const visits = [makeVisit({ visit_status: "scheduled", visit_date: daysAhead(5) })];
      expect(computeVisitMetrics(visits, now).children_seen_rate).toBe(0);
    });

    it("returns 100% when all completed visits have private discussions", () => {
      const visits = [
        makeVisit({ id: "v1", visit_status: "completed", children_spoken_privately: ["c1"] }),
        makeVisit({ id: "v2", visit_status: "completed", children_spoken_privately: ["c2", "c3"] }),
      ];
      expect(computeVisitMetrics(visits, now).children_seen_rate).toBe(100);
    });

    it("returns 50% when half have private discussions", () => {
      const visits = [
        makeVisit({ id: "v1", visit_status: "completed", children_spoken_privately: ["c1"] }),
        makeVisit({ id: "v2", visit_status: "completed", children_spoken_privately: [] }),
      ];
      expect(computeVisitMetrics(visits, now).children_seen_rate).toBe(50);
    });

    it("returns 0% when no completed visits have private discussions", () => {
      const visits = [
        makeVisit({ id: "v1", visit_status: "completed", children_spoken_privately: [] }),
      ];
      expect(computeVisitMetrics(visits, now).children_seen_rate).toBe(0);
    });
  });

  // ── premises_inspected_rate ──────────────────────────────────────────────

  describe("premises_inspected_rate", () => {
    it("returns 0 when no completed visits", () => {
      const visits = [makeVisit({ visit_status: "scheduled", visit_date: daysAhead(5) })];
      expect(computeVisitMetrics(visits, now).premises_inspected_rate).toBe(0);
    });

    it("returns 100% when all completed visits inspected premises", () => {
      const visits = [
        makeVisit({ id: "v1", visit_status: "completed", premises_inspected: true }),
        makeVisit({ id: "v2", visit_status: "completed", premises_inspected: true }),
      ];
      expect(computeVisitMetrics(visits, now).premises_inspected_rate).toBe(100);
    });

    it("returns 0% when no completed visits inspected premises", () => {
      const visits = [
        makeVisit({ id: "v1", visit_status: "completed", premises_inspected: false }),
      ];
      expect(computeVisitMetrics(visits, now).premises_inspected_rate).toBe(0);
    });

    it("returns 50% when half inspected", () => {
      const visits = [
        makeVisit({ id: "v1", visit_status: "completed", premises_inspected: true }),
        makeVisit({ id: "v2", visit_status: "completed", premises_inspected: false }),
      ];
      expect(computeVisitMetrics(visits, now).premises_inspected_rate).toBe(50);
    });
  });

  // ── records_reviewed_rate ────────────────────────────────────────────────

  describe("records_reviewed_rate", () => {
    it("returns 0 when no completed visits", () => {
      const visits = [makeVisit({ visit_status: "scheduled", visit_date: daysAhead(5) })];
      expect(computeVisitMetrics(visits, now).records_reviewed_rate).toBe(0);
    });

    it("returns 100% when all completed visits reviewed records", () => {
      const visits = [
        makeVisit({ id: "v1", visit_status: "completed", records_reviewed: true }),
        makeVisit({ id: "v2", visit_status: "completed", records_reviewed: true }),
      ];
      expect(computeVisitMetrics(visits, now).records_reviewed_rate).toBe(100);
    });

    it("returns 0% when no records reviewed", () => {
      const visits = [
        makeVisit({ id: "v1", visit_status: "completed", records_reviewed: false }),
      ];
      expect(computeVisitMetrics(visits, now).records_reviewed_rate).toBe(0);
    });

    it("rounds correctly for thirds", () => {
      const visits = [
        makeVisit({ id: "v1", visit_status: "completed", records_reviewed: true }),
        makeVisit({ id: "v2", visit_status: "completed", records_reviewed: false }),
        makeVisit({ id: "v3", visit_status: "completed", records_reviewed: false }),
      ];
      expect(computeVisitMetrics(visits, now).records_reviewed_rate).toBe(33.3);
    });
  });

  // ── reg_44_completed / reg_44_overdue ────────────────────────────────────

  describe("reg_44_completed and reg_44_overdue", () => {
    it("counts reg_44 completed visits", () => {
      const visits = [
        makeVisit({ id: "v1", visit_type: "reg_44", visit_status: "completed" }),
        makeVisit({ id: "v2", visit_type: "reg_44", visit_status: "completed" }),
        makeVisit({ id: "v3", visit_type: "social_worker", visit_status: "completed" }),
      ];
      expect(computeVisitMetrics(visits, now).reg_44_completed).toBe(2);
    });

    it("counts reg_44 overdue by status", () => {
      const visits = [
        makeVisit({ id: "v1", visit_type: "reg_44", visit_status: "overdue" }),
      ];
      expect(computeVisitMetrics(visits, now).reg_44_overdue).toBe(1);
    });

    it("counts reg_44 overdue by scheduled past date", () => {
      const visits = [
        makeVisit({ id: "v1", visit_type: "reg_44", visit_status: "scheduled", visit_date: daysAgo(3) }),
      ];
      expect(computeVisitMetrics(visits, now).reg_44_overdue).toBe(1);
    });

    it("does not count reg_44 scheduled in the future as overdue", () => {
      const visits = [
        makeVisit({ id: "v1", visit_type: "reg_44", visit_status: "scheduled", visit_date: daysAhead(5) }),
      ];
      expect(computeVisitMetrics(visits, now).reg_44_overdue).toBe(0);
    });

    it("returns 0 when no reg_44 visits exist", () => {
      const visits = [
        makeVisit({ visit_type: "social_worker", visit_status: "completed" }),
      ];
      const m = computeVisitMetrics(visits, now);
      expect(m.reg_44_completed).toBe(0);
      expect(m.reg_44_overdue).toBe(0);
    });
  });

  // ── sw_visits_completed ──────────────────────────────────────────────────

  describe("sw_visits_completed", () => {
    it("counts social_worker completed visits", () => {
      const visits = [
        makeVisit({ id: "v1", visit_type: "social_worker", visit_status: "completed" }),
        makeVisit({ id: "v2", visit_type: "social_worker", visit_status: "completed" }),
      ];
      expect(computeVisitMetrics(visits, now).sw_visits_completed).toBe(2);
    });

    it("does not count non-social_worker completed visits", () => {
      const visits = [
        makeVisit({ id: "v1", visit_type: "iro", visit_status: "completed" }),
        makeVisit({ id: "v2", visit_type: "reg_44", visit_status: "completed" }),
      ];
      expect(computeVisitMetrics(visits, now).sw_visits_completed).toBe(0);
    });

    it("does not count social_worker non-completed visits", () => {
      const visits = [
        makeVisit({ id: "v1", visit_type: "social_worker", visit_status: "scheduled", visit_date: daysAhead(5) }),
        makeVisit({ id: "v2", visit_type: "social_worker", visit_status: "cancelled" }),
      ];
      expect(computeVisitMetrics(visits, now).sw_visits_completed).toBe(0);
    });
  });

  // ── overdueByDate detection ──────────────────────────────────────────────

  describe("overdueByDate detection", () => {
    it("counts scheduled visits with past date as overdue", () => {
      const visits = [
        makeVisit({ id: "v1", visit_status: "scheduled", visit_date: daysAgo(2) }),
      ];
      expect(computeVisitMetrics(visits, now).overdue_visits).toBe(1);
    });

    it("does not count scheduled visits with future date as overdue", () => {
      const visits = [
        makeVisit({ id: "v1", visit_status: "scheduled", visit_date: daysAhead(2) }),
      ];
      expect(computeVisitMetrics(visits, now).overdue_visits).toBe(0);
    });

    it("adds overdueByDate to status-based overdue count", () => {
      const visits = [
        makeVisit({ id: "v1", visit_status: "overdue" }),
        makeVisit({ id: "v2", visit_status: "scheduled", visit_date: daysAgo(1) }),
      ];
      expect(computeVisitMetrics(visits, now).overdue_visits).toBe(2);
    });

    it("does not double count visits already marked overdue by status", () => {
      const visits = [
        makeVisit({ id: "v1", visit_status: "overdue", visit_date: daysAgo(5) }),
      ];
      // Status-based overdue, not scheduled so no overdueByDate
      expect(computeVisitMetrics(visits, now).overdue_visits).toBe(1);
    });
  });

  // ── by_visit_type ────────────────────────────────────────────────────────

  describe("by_visit_type", () => {
    it("groups visits by type", () => {
      const visits = [
        makeVisit({ id: "v1", visit_type: "social_worker" }),
        makeVisit({ id: "v2", visit_type: "social_worker" }),
        makeVisit({ id: "v3", visit_type: "reg_44" }),
        makeVisit({ id: "v4", visit_type: "ofsted" }),
      ];
      const m = computeVisitMetrics(visits, now);
      expect(m.by_visit_type.social_worker).toBe(2);
      expect(m.by_visit_type.reg_44).toBe(1);
      expect(m.by_visit_type.ofsted).toBe(1);
    });

    it("includes all visit types present in data", () => {
      const visits = [
        makeVisit({ id: "v1", visit_type: "therapist" }),
        makeVisit({ id: "v2", visit_type: "advocate" }),
      ];
      const m = computeVisitMetrics(visits, now);
      expect(Object.keys(m.by_visit_type)).toHaveLength(2);
      expect(m.by_visit_type.therapist).toBe(1);
      expect(m.by_visit_type.advocate).toBe(1);
    });
  });

  // ── by_outcome ───────────────────────────────────────────────────────────

  describe("by_outcome", () => {
    it("groups visits by outcome", () => {
      const visits = [
        makeVisit({ id: "v1", outcome: "satisfactory" }),
        makeVisit({ id: "v2", outcome: "concerns_raised" }),
        makeVisit({ id: "v3", outcome: "satisfactory" }),
      ];
      const m = computeVisitMetrics(visits, now);
      expect(m.by_outcome.satisfactory).toBe(2);
      expect(m.by_outcome.concerns_raised).toBe(1);
    });

    it("skips null outcomes", () => {
      const visits = [
        makeVisit({ id: "v1", outcome: null }),
        makeVisit({ id: "v2", outcome: "satisfactory" }),
      ];
      const m = computeVisitMetrics(visits, now);
      expect(m.by_outcome.satisfactory).toBe(1);
      expect(Object.keys(m.by_outcome)).toHaveLength(1);
    });

    it("handles all outcome types", () => {
      const outcomes: VisitOutcome[] = [
        "satisfactory", "concerns_raised", "actions_required",
        "follow_up_needed", "escalated", "not_completed",
      ];
      const visits = outcomes.map((o, i) =>
        makeVisit({ id: `v${i}`, visit_status: "completed", outcome: o })
      );
      const m = computeVisitMetrics(visits, now);
      for (const o of outcomes) {
        expect(m.by_outcome[o]).toBe(1);
      }
    });
  });

  // ── by_status ────────────────────────────────────────────────────────────

  describe("by_status", () => {
    it("groups visits by status", () => {
      const visits = [
        makeVisit({ id: "v1", visit_status: "completed" }),
        makeVisit({ id: "v2", visit_status: "completed" }),
        makeVisit({ id: "v3", visit_status: "overdue" }),
      ];
      const m = computeVisitMetrics(visits, now);
      expect(m.by_status.completed).toBe(2);
      expect(m.by_status.overdue).toBe(1);
    });
  });

  // ── Multiple visits / mixed scenarios ────────────────────────────────────

  describe("multiple visits", () => {
    it("computes all metrics for a realistic set", () => {
      const visits = [
        makeVisit({
          id: "v1", visit_type: "reg_44", visit_status: "completed",
          outcome: "satisfactory", premises_inspected: true,
          records_reviewed: true, children_spoken_privately: ["c1"],
          report_received: true, actions_raised: [], actions_completed: 0,
        }),
        makeVisit({
          id: "v2", visit_type: "social_worker", visit_status: "completed",
          outcome: "concerns_raised", premises_inspected: false,
          records_reviewed: false, children_spoken_privately: [],
          report_received: false, actions_raised: ["a1", "a2"], actions_completed: 1,
        }),
        makeVisit({
          id: "v3", visit_type: "reg_44", visit_status: "overdue",
          outcome: null,
        }),
        makeVisit({
          id: "v4", visit_type: "iro", visit_status: "scheduled",
          visit_date: daysAhead(7), outcome: null,
        }),
        makeVisit({
          id: "v5", visit_type: "ofsted", visit_status: "cancelled",
          outcome: null,
        }),
      ];
      const m = computeVisitMetrics(visits, now);
      expect(m.total_visits).toBe(5);
      expect(m.completed_visits).toBe(2);
      expect(m.scheduled_visits).toBe(1);
      expect(m.overdue_visits).toBe(1);
      expect(m.cancelled_visits).toBe(1);
      expect(m.satisfactory_rate).toBe(50);
      expect(m.concerns_raised_count).toBe(1);
      expect(m.actions_outstanding).toBe(1);
      expect(m.reports_pending).toBe(1);
      expect(m.children_seen_rate).toBe(50);
      expect(m.premises_inspected_rate).toBe(50);
      expect(m.records_reviewed_rate).toBe(50);
      expect(m.reg_44_completed).toBe(1);
      expect(m.reg_44_overdue).toBe(1);
      expect(m.sw_visits_completed).toBe(1);
    });

    it("handles visits with all actions completed", () => {
      const visits = [
        makeVisit({ id: "v1", actions_raised: ["a1", "a2"], actions_completed: 2 }),
        makeVisit({ id: "v2", actions_raised: ["a3"], actions_completed: 1 }),
      ];
      expect(computeVisitMetrics(visits, now).actions_outstanding).toBe(0);
    });

    it("handles large batch of 50 visits", () => {
      const visits: ProviderVisit[] = [];
      for (let i = 0; i < 30; i++) {
        visits.push(makeVisit({
          id: `v${i}`, visit_status: "completed",
          outcome: i % 3 === 0 ? "satisfactory" : "concerns_raised",
        }));
      }
      for (let i = 30; i < 40; i++) {
        visits.push(makeVisit({ id: `v${i}`, visit_status: "scheduled", visit_date: daysAhead(5) }));
      }
      for (let i = 40; i < 50; i++) {
        visits.push(makeVisit({ id: `v${i}`, visit_status: "overdue" }));
      }
      const m = computeVisitMetrics(visits, now);
      expect(m.total_visits).toBe(50);
      expect(m.completed_visits).toBe(30);
      expect(m.scheduled_visits).toBe(10);
      expect(m.overdue_visits).toBe(10);
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. identifyVisitAlerts
// ══════════════════════════════════════════════════════════════════════════════

describe("identifyVisitAlerts", () => {
  // ── reg_44_overdue ───────────────────────────────────────────────────────

  describe("reg_44_overdue", () => {
    it("flags reg_44 visit with status overdue as critical", () => {
      const visits = [
        makeVisit({ id: "v1", visit_type: "reg_44", visit_status: "overdue", visit_date: daysAgo(5) }),
      ];
      const alerts = identifyVisitAlerts(visits, now);
      const reg44 = alerts.filter((a) => a.type === "reg_44_overdue");
      expect(reg44).toHaveLength(1);
      expect(reg44[0].severity).toBe("critical");
      expect(reg44[0].id).toBe("v1");
    });

    it("includes visit_date in the message", () => {
      const date = daysAgo(5);
      const visits = [
        makeVisit({ id: "v1", visit_type: "reg_44", visit_status: "overdue", visit_date: date }),
      ];
      const alerts = identifyVisitAlerts(visits, now);
      const reg44 = alerts.find((a) => a.type === "reg_44_overdue");
      expect(reg44!.message).toContain(date);
    });

    it("does not flag reg_44 with completed status", () => {
      const visits = [
        makeVisit({ visit_type: "reg_44", visit_status: "completed" }),
      ];
      const alerts = identifyVisitAlerts(visits, now);
      expect(alerts.filter((a) => a.type === "reg_44_overdue")).toHaveLength(0);
    });

    it("does not flag non-reg_44 overdue visits as reg_44_overdue", () => {
      const visits = [
        makeVisit({ visit_type: "social_worker", visit_status: "overdue" }),
      ];
      const alerts = identifyVisitAlerts(visits, now);
      expect(alerts.filter((a) => a.type === "reg_44_overdue")).toHaveLength(0);
    });

    it("flags multiple reg_44 overdue visits", () => {
      const visits = [
        makeVisit({ id: "v1", visit_type: "reg_44", visit_status: "overdue" }),
        makeVisit({ id: "v2", visit_type: "reg_44", visit_status: "overdue" }),
      ];
      const alerts = identifyVisitAlerts(visits, now);
      expect(alerts.filter((a) => a.type === "reg_44_overdue")).toHaveLength(2);
    });

    it("message mentions statutory requirement", () => {
      const visits = [
        makeVisit({ visit_type: "reg_44", visit_status: "overdue" }),
      ];
      const alerts = identifyVisitAlerts(visits, now);
      expect(alerts[0].message).toContain("statutory requirement");
    });
  });

  // ── actions_outstanding ──────────────────────────────────────────────────

  describe("actions_outstanding", () => {
    it("flags visit with concerns and outstanding actions as high", () => {
      const visits = [
        makeVisit({
          id: "v1", outcome: "concerns_raised",
          actions_raised: ["a1", "a2"], actions_completed: 0,
          visitor_name: "Ms Jones",
        }),
      ];
      const alerts = identifyVisitAlerts(visits, now);
      const outstanding = alerts.filter((a) => a.type === "actions_outstanding");
      expect(outstanding).toHaveLength(1);
      expect(outstanding[0].severity).toBe("high");
    });

    it("includes correct outstanding count in message (singular)", () => {
      const visits = [
        makeVisit({
          id: "v1", outcome: "concerns_raised",
          actions_raised: ["a1"], actions_completed: 0,
          visitor_name: "Ms Jones",
        }),
      ];
      const alerts = identifyVisitAlerts(visits, now);
      const outstanding = alerts.find((a) => a.type === "actions_outstanding");
      expect(outstanding!.message).toContain("1 outstanding action");
    });

    it("includes correct outstanding count in message (plural)", () => {
      const visits = [
        makeVisit({
          id: "v1", outcome: "concerns_raised",
          actions_raised: ["a1", "a2", "a3"], actions_completed: 1,
          visitor_name: "Ms Jones",
        }),
      ];
      const alerts = identifyVisitAlerts(visits, now);
      const outstanding = alerts.find((a) => a.type === "actions_outstanding");
      expect(outstanding!.message).toContain("2 outstanding actions");
    });

    it("includes visitor name in message", () => {
      const visits = [
        makeVisit({
          id: "v1", outcome: "concerns_raised",
          actions_raised: ["a1"], actions_completed: 0,
          visitor_name: "Dr Patel",
        }),
      ];
      const alerts = identifyVisitAlerts(visits, now);
      expect(alerts.find((a) => a.type === "actions_outstanding")!.message).toContain("Dr Patel");
    });

    it("does not flag when all actions completed", () => {
      const visits = [
        makeVisit({
          outcome: "concerns_raised",
          actions_raised: ["a1", "a2"], actions_completed: 2,
        }),
      ];
      const alerts = identifyVisitAlerts(visits, now);
      expect(alerts.filter((a) => a.type === "actions_outstanding")).toHaveLength(0);
    });

    it("does not flag when outcome is not concerns_raised", () => {
      const visits = [
        makeVisit({
          outcome: "satisfactory",
          actions_raised: ["a1"], actions_completed: 0,
        }),
      ];
      const alerts = identifyVisitAlerts(visits, now);
      expect(alerts.filter((a) => a.type === "actions_outstanding")).toHaveLength(0);
    });

    it("does not flag when no actions raised despite concerns", () => {
      const visits = [
        makeVisit({
          outcome: "concerns_raised",
          actions_raised: [], actions_completed: 0,
        }),
      ];
      const alerts = identifyVisitAlerts(visits, now);
      expect(alerts.filter((a) => a.type === "actions_outstanding")).toHaveLength(0);
    });

    it("includes visit_date in message", () => {
      const date = daysAgo(10);
      const visits = [
        makeVisit({
          id: "v1", outcome: "concerns_raised",
          actions_raised: ["a1"], actions_completed: 0,
          visit_date: date,
        }),
      ];
      const alerts = identifyVisitAlerts(visits, now);
      expect(alerts.find((a) => a.type === "actions_outstanding")!.message).toContain(date);
    });
  });

  // ── report_overdue ───────────────────────────────────────────────────────

  describe("report_overdue", () => {
    it("flags completed visit without report after 14+ days as medium", () => {
      const visits = [
        makeVisit({
          id: "v1", visit_status: "completed", report_received: false,
          visit_date: daysAgo(15), visitor_name: "Mr Thompson",
          visitor_organisation: "County Council",
        }),
      ];
      const alerts = identifyVisitAlerts(visits, now);
      const overdue = alerts.filter((a) => a.type === "report_overdue");
      expect(overdue).toHaveLength(1);
      expect(overdue[0].severity).toBe("medium");
    });

    it("does not flag completed visit without report under 14 days", () => {
      const visits = [
        makeVisit({
          visit_status: "completed", report_received: false,
          visit_date: daysAgo(10),
        }),
      ];
      const alerts = identifyVisitAlerts(visits, now);
      expect(alerts.filter((a) => a.type === "report_overdue")).toHaveLength(0);
    });

    it("does not flag when report has been received", () => {
      const visits = [
        makeVisit({
          visit_status: "completed", report_received: true,
          visit_date: daysAgo(30),
        }),
      ];
      const alerts = identifyVisitAlerts(visits, now);
      expect(alerts.filter((a) => a.type === "report_overdue")).toHaveLength(0);
    });

    it("does not flag non-completed visits", () => {
      const visits = [
        makeVisit({
          visit_status: "scheduled", report_received: false,
          visit_date: daysAgo(20),
        }),
      ];
      const alerts = identifyVisitAlerts(visits, now);
      expect(alerts.filter((a) => a.type === "report_overdue")).toHaveLength(0);
    });

    it("includes visitor_name in message", () => {
      const visits = [
        makeVisit({
          id: "v1", visit_status: "completed", report_received: false,
          visit_date: daysAgo(20), visitor_name: "Mrs Green",
        }),
      ];
      const alerts = identifyVisitAlerts(visits, now);
      expect(alerts.find((a) => a.type === "report_overdue")!.message).toContain("Mrs Green");
    });

    it("includes visitor_organisation in message", () => {
      const visits = [
        makeVisit({
          id: "v1", visit_status: "completed", report_received: false,
          visit_date: daysAgo(20), visitor_organisation: "County Council",
        }),
      ];
      const alerts = identifyVisitAlerts(visits, now);
      expect(alerts.find((a) => a.type === "report_overdue")!.message).toContain("County Council");
    });

    it("flags at exactly 15 days (one day past threshold)", () => {
      const visits = [
        makeVisit({
          id: "v1", visit_status: "completed", report_received: false,
          visit_date: daysAgo(15),
        }),
      ];
      const alerts = identifyVisitAlerts(visits, now);
      expect(alerts.filter((a) => a.type === "report_overdue")).toHaveLength(1);
    });

    it("does not flag at exactly 13 days (under threshold)", () => {
      const visits = [
        makeVisit({
          id: "v1", visit_status: "completed", report_received: false,
          visit_date: daysAgo(13),
        }),
      ];
      const alerts = identifyVisitAlerts(visits, now);
      expect(alerts.filter((a) => a.type === "report_overdue")).toHaveLength(0);
    });
  });

  // ── visit_overdue_by_date ────────────────────────────────────────────────

  describe("visit_overdue_by_date", () => {
    it("flags scheduled visit with past date as visit_overdue_by_date", () => {
      const visits = [
        makeVisit({ id: "v1", visit_status: "scheduled", visit_date: daysAgo(1) }),
      ];
      const alerts = identifyVisitAlerts(visits, now);
      const overdue = alerts.filter((a) => a.type === "visit_overdue_by_date");
      expect(overdue).toHaveLength(1);
    });

    it("flags reg_44 scheduled past date as critical", () => {
      const visits = [
        makeVisit({ id: "v1", visit_type: "reg_44", visit_status: "scheduled", visit_date: daysAgo(1) }),
      ];
      const alerts = identifyVisitAlerts(visits, now);
      const overdue = alerts.find((a) => a.type === "visit_overdue_by_date");
      expect(overdue!.severity).toBe("critical");
    });

    it("flags non-reg_44 scheduled past date as high", () => {
      const visits = [
        makeVisit({ id: "v1", visit_type: "social_worker", visit_status: "scheduled", visit_date: daysAgo(1) }),
      ];
      const alerts = identifyVisitAlerts(visits, now);
      const overdue = alerts.find((a) => a.type === "visit_overdue_by_date");
      expect(overdue!.severity).toBe("high");
    });

    it("does not flag scheduled visits with future date", () => {
      const visits = [
        makeVisit({ visit_status: "scheduled", visit_date: daysAhead(5) }),
      ];
      const alerts = identifyVisitAlerts(visits, now);
      expect(alerts.filter((a) => a.type === "visit_overdue_by_date")).toHaveLength(0);
    });

    it("does not flag completed visits with past date", () => {
      const visits = [
        makeVisit({ visit_status: "completed", visit_date: daysAgo(10) }),
      ];
      const alerts = identifyVisitAlerts(visits, now);
      expect(alerts.filter((a) => a.type === "visit_overdue_by_date")).toHaveLength(0);
    });

    it("includes visitor_name in message", () => {
      const visits = [
        makeVisit({
          id: "v1", visit_status: "scheduled", visit_date: daysAgo(3),
          visitor_name: "Ms Williams",
        }),
      ];
      const alerts = identifyVisitAlerts(visits, now);
      const overdue = alerts.find((a) => a.type === "visit_overdue_by_date");
      expect(overdue!.message).toContain("Ms Williams");
    });

    it("includes visit_date in message", () => {
      const date = daysAgo(3);
      const visits = [
        makeVisit({ id: "v1", visit_status: "scheduled", visit_date: date }),
      ];
      const alerts = identifyVisitAlerts(visits, now);
      const overdue = alerts.find((a) => a.type === "visit_overdue_by_date");
      expect(overdue!.message).toContain(date);
    });

    it("uses visit_type in message (underscores replaced with spaces)", () => {
      const visits = [
        makeVisit({
          id: "v1", visit_type: "la_monitoring",
          visit_status: "scheduled", visit_date: daysAgo(2),
        }),
      ];
      const alerts = identifyVisitAlerts(visits, now);
      const overdue = alerts.find((a) => a.type === "visit_overdue_by_date");
      expect(overdue!.message).toContain("la monitoring");
    });

    it("flags ofsted visit past date as high", () => {
      const visits = [
        makeVisit({ id: "v1", visit_type: "ofsted", visit_status: "scheduled", visit_date: daysAgo(1) }),
      ];
      const alerts = identifyVisitAlerts(visits, now);
      const overdue = alerts.find((a) => a.type === "visit_overdue_by_date");
      expect(overdue!.severity).toBe("high");
    });

    it("flags iro visit past date as high", () => {
      const visits = [
        makeVisit({ id: "v1", visit_type: "iro", visit_status: "scheduled", visit_date: daysAgo(1) }),
      ];
      const alerts = identifyVisitAlerts(visits, now);
      const overdue = alerts.find((a) => a.type === "visit_overdue_by_date");
      expect(overdue!.severity).toBe("high");
    });
  });

  // ── no_private_discussion ────────────────────────────────────────────────

  describe("no_private_discussion", () => {
    it("flags completed visit with children seen but no private discussion as medium", () => {
      const visits = [
        makeVisit({
          id: "v1", visit_status: "completed",
          children_seen: ["c1", "c2"], children_spoken_privately: [],
          visitor_name: "Mr Brown",
        }),
      ];
      const alerts = identifyVisitAlerts(visits, now);
      const np = alerts.filter((a) => a.type === "no_private_discussion");
      expect(np).toHaveLength(1);
      expect(np[0].severity).toBe("medium");
    });

    it("does not flag when children spoken to privately", () => {
      const visits = [
        makeVisit({
          visit_status: "completed",
          children_seen: ["c1"], children_spoken_privately: ["c1"],
        }),
      ];
      const alerts = identifyVisitAlerts(visits, now);
      expect(alerts.filter((a) => a.type === "no_private_discussion")).toHaveLength(0);
    });

    it("does not flag when no children seen", () => {
      const visits = [
        makeVisit({
          visit_status: "completed",
          children_seen: [], children_spoken_privately: [],
        }),
      ];
      const alerts = identifyVisitAlerts(visits, now);
      expect(alerts.filter((a) => a.type === "no_private_discussion")).toHaveLength(0);
    });

    it("does not flag non-completed visits", () => {
      const visits = [
        makeVisit({
          visit_status: "scheduled", visit_date: daysAhead(5),
          children_seen: ["c1"], children_spoken_privately: [],
        }),
      ];
      const alerts = identifyVisitAlerts(visits, now);
      expect(alerts.filter((a) => a.type === "no_private_discussion")).toHaveLength(0);
    });

    it("includes visitor_name in message", () => {
      const visits = [
        makeVisit({
          id: "v1", visit_status: "completed",
          children_seen: ["c1"], children_spoken_privately: [],
          visitor_name: "Mrs Taylor",
        }),
      ];
      const alerts = identifyVisitAlerts(visits, now);
      const np = alerts.find((a) => a.type === "no_private_discussion");
      expect(np!.message).toContain("Mrs Taylor");
    });

    it("includes visit_date in message", () => {
      const date = daysAgo(2);
      const visits = [
        makeVisit({
          id: "v1", visit_status: "completed",
          children_seen: ["c1"], children_spoken_privately: [],
          visit_date: date,
        }),
      ];
      const alerts = identifyVisitAlerts(visits, now);
      const np = alerts.find((a) => a.type === "no_private_discussion");
      expect(np!.message).toContain(date);
    });

    it("message mentions private discussions", () => {
      const visits = [
        makeVisit({
          id: "v1", visit_status: "completed",
          children_seen: ["c1"], children_spoken_privately: [],
        }),
      ];
      const alerts = identifyVisitAlerts(visits, now);
      expect(alerts[0].message).toContain("private");
    });
  });

  // ── No alerts when clean ─────────────────────────────────────────────────

  describe("no alerts when clean", () => {
    it("returns empty array for a single clean completed visit", () => {
      const visits = [
        makeVisit({
          visit_status: "completed", outcome: "satisfactory",
          children_seen: ["c1"], children_spoken_privately: ["c1"],
          report_received: true, actions_raised: [], actions_completed: 0,
          visit_date: daysAgo(5),
        }),
      ];
      expect(identifyVisitAlerts(visits, now)).toHaveLength(0);
    });

    it("returns empty array for empty visits", () => {
      expect(identifyVisitAlerts([], now)).toHaveLength(0);
    });

    it("returns empty array for future scheduled visits", () => {
      const visits = [
        makeVisit({
          id: "v1", visit_status: "scheduled", visit_date: daysAhead(10),
          children_seen: [], children_spoken_privately: [],
          report_received: false, outcome: null,
        }),
      ];
      expect(identifyVisitAlerts(visits, now)).toHaveLength(0);
    });

    it("returns empty for cancelled visit", () => {
      const visits = [
        makeVisit({ visit_status: "cancelled", outcome: null }),
      ];
      expect(identifyVisitAlerts(visits, now)).toHaveLength(0);
    });

    it("returns empty for completed visit with report received within 14 days", () => {
      const visits = [
        makeVisit({
          visit_status: "completed", report_received: true,
          visit_date: daysAgo(20), children_seen: ["c1"],
          children_spoken_privately: ["c1"],
        }),
      ];
      expect(identifyVisitAlerts(visits, now)).toHaveLength(0);
    });

    it("returns empty when concerns raised but all actions completed", () => {
      const visits = [
        makeVisit({
          visit_status: "completed", outcome: "concerns_raised",
          actions_raised: ["a1", "a2"], actions_completed: 2,
          report_received: true, visit_date: daysAgo(5),
          children_seen: ["c1"], children_spoken_privately: ["c1"],
        }),
      ];
      expect(identifyVisitAlerts(visits, now)).toHaveLength(0);
    });
  });

  // ── Multiple alert types from one set ────────────────────────────────────

  describe("multiple alert types", () => {
    it("can produce multiple alert types from one visit set", () => {
      const visits = [
        makeVisit({
          id: "v1", visit_type: "reg_44", visit_status: "overdue",
          visit_date: daysAgo(5),
        }),
        makeVisit({
          id: "v2", visit_status: "completed", outcome: "concerns_raised",
          actions_raised: ["a1"], actions_completed: 0,
          report_received: false, visit_date: daysAgo(20),
          children_seen: ["c1"], children_spoken_privately: [],
        }),
        makeVisit({
          id: "v3", visit_status: "scheduled", visit_date: daysAgo(2),
        }),
      ];
      const alerts = identifyVisitAlerts(visits, now);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("reg_44_overdue");
      expect(types).toContain("actions_outstanding");
      expect(types).toContain("report_overdue");
      expect(types).toContain("no_private_discussion");
      expect(types).toContain("visit_overdue_by_date");
    });

    it("returns correct count of total alerts from mixed set", () => {
      const visits = [
        makeVisit({
          id: "v1", visit_type: "reg_44", visit_status: "overdue",
        }),
        makeVisit({
          id: "v2", visit_type: "reg_44", visit_status: "overdue",
        }),
      ];
      const alerts = identifyVisitAlerts(visits, now);
      expect(alerts.filter((a) => a.type === "reg_44_overdue")).toHaveLength(2);
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. Constants
// ══════════════════════════════════════════════════════════════════════════════

describe("Constants", () => {
  // ── VISIT_TYPES ──────────────────────────────────────────────────────────

  describe("VISIT_TYPES", () => {
    it("has exactly 11 entries", () => {
      expect(VISIT_TYPES).toHaveLength(11);
    });

    it("each entry has type and label properties", () => {
      for (const vt of VISIT_TYPES) {
        expect(typeof vt.type).toBe("string");
        expect(typeof vt.label).toBe("string");
      }
    });

    it("has unique type values", () => {
      const types = VISIT_TYPES.map((vt) => vt.type);
      expect(new Set(types).size).toBe(types.length);
    });

    it("has unique label values", () => {
      const labels = VISIT_TYPES.map((vt) => vt.label);
      expect(new Set(labels).size).toBe(labels.length);
    });

    it("contains all expected visit types", () => {
      const types = VISIT_TYPES.map((vt) => vt.type);
      expect(types).toContain("social_worker");
      expect(types).toContain("iro");
      expect(types).toContain("reg_44");
      expect(types).toContain("ofsted");
      expect(types).toContain("la_monitoring");
      expect(types).toContain("placing_authority");
      expect(types).toContain("health_professional");
      expect(types).toContain("education_professional");
      expect(types).toContain("therapist");
      expect(types).toContain("advocate");
      expect(types).toContain("other");
    });

    it("no entry has empty type", () => {
      for (const vt of VISIT_TYPES) {
        expect(vt.type.length).toBeGreaterThan(0);
      }
    });

    it("no entry has empty label", () => {
      for (const vt of VISIT_TYPES) {
        expect(vt.label.length).toBeGreaterThan(0);
      }
    });
  });

  // ── VISIT_OUTCOMES ───────────────────────────────────────────────────────

  describe("VISIT_OUTCOMES", () => {
    it("has exactly 6 entries", () => {
      expect(VISIT_OUTCOMES).toHaveLength(6);
    });

    it("each entry has outcome and label properties", () => {
      for (const vo of VISIT_OUTCOMES) {
        expect(typeof vo.outcome).toBe("string");
        expect(typeof vo.label).toBe("string");
      }
    });

    it("has unique outcome values", () => {
      const outcomes = VISIT_OUTCOMES.map((vo) => vo.outcome);
      expect(new Set(outcomes).size).toBe(outcomes.length);
    });

    it("has unique label values", () => {
      const labels = VISIT_OUTCOMES.map((vo) => vo.label);
      expect(new Set(labels).size).toBe(labels.length);
    });

    it("contains all expected outcome values", () => {
      const outcomes = VISIT_OUTCOMES.map((vo) => vo.outcome);
      expect(outcomes).toContain("satisfactory");
      expect(outcomes).toContain("concerns_raised");
      expect(outcomes).toContain("actions_required");
      expect(outcomes).toContain("follow_up_needed");
      expect(outcomes).toContain("escalated");
      expect(outcomes).toContain("not_completed");
    });

    it("no entry has empty outcome", () => {
      for (const vo of VISIT_OUTCOMES) {
        expect(vo.outcome.length).toBeGreaterThan(0);
      }
    });

    it("no entry has empty label", () => {
      for (const vo of VISIT_OUTCOMES) {
        expect(vo.label.length).toBeGreaterThan(0);
      }
    });
  });

  // ── VISIT_STATUSES ───────────────────────────────────────────────────────

  describe("VISIT_STATUSES", () => {
    it("has exactly 6 entries", () => {
      expect(VISIT_STATUSES).toHaveLength(6);
    });

    it("each entry has status and label properties", () => {
      for (const vs of VISIT_STATUSES) {
        expect(typeof vs.status).toBe("string");
        expect(typeof vs.label).toBe("string");
      }
    });

    it("has unique status values", () => {
      const statuses = VISIT_STATUSES.map((vs) => vs.status);
      expect(new Set(statuses).size).toBe(statuses.length);
    });

    it("has unique label values", () => {
      const labels = VISIT_STATUSES.map((vs) => vs.label);
      expect(new Set(labels).size).toBe(labels.length);
    });

    it("contains all expected status values", () => {
      const statuses = VISIT_STATUSES.map((vs) => vs.status);
      expect(statuses).toContain("scheduled");
      expect(statuses).toContain("completed");
      expect(statuses).toContain("cancelled");
      expect(statuses).toContain("rescheduled");
      expect(statuses).toContain("overdue");
      expect(statuses).toContain("no_show");
    });

    it("no entry has empty status", () => {
      for (const vs of VISIT_STATUSES) {
        expect(vs.status.length).toBeGreaterThan(0);
      }
    });

    it("no entry has empty label", () => {
      for (const vs of VISIT_STATUSES) {
        expect(vs.label.length).toBeGreaterThan(0);
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
  it("listVisits returns ok with empty data", async () => {
    const { listVisits } = await import("../provider-visits-service");
    const result = await listVisits("home-1");
    expect(result).toEqual({ ok: true, data: [] });
  });

  it("listVisits returns ok with visitType filter", async () => {
    const { listVisits } = await import("../provider-visits-service");
    const result = await listVisits("home-1", { visitType: "reg_44" });
    expect(result).toEqual({ ok: true, data: [] });
  });

  it("listVisits returns ok with visitStatus filter", async () => {
    const { listVisits } = await import("../provider-visits-service");
    const result = await listVisits("home-1", { visitStatus: "completed" });
    expect(result).toEqual({ ok: true, data: [] });
  });

  it("listVisits returns ok with dateFrom filter", async () => {
    const { listVisits } = await import("../provider-visits-service");
    const result = await listVisits("home-1", { dateFrom: "2026-01-01" });
    expect(result).toEqual({ ok: true, data: [] });
  });

  it("listVisits returns ok with dateTo filter", async () => {
    const { listVisits } = await import("../provider-visits-service");
    const result = await listVisits("home-1", { dateTo: "2026-12-31" });
    expect(result).toEqual({ ok: true, data: [] });
  });

  it("listVisits returns ok with limit filter", async () => {
    const { listVisits } = await import("../provider-visits-service");
    const result = await listVisits("home-1", { limit: 10 });
    expect(result).toEqual({ ok: true, data: [] });
  });

  it("listVisits returns ok with all filters combined", async () => {
    const { listVisits } = await import("../provider-visits-service");
    const result = await listVisits("home-1", {
      visitType: "social_worker",
      visitStatus: "completed",
      dateFrom: "2026-01-01",
      dateTo: "2026-12-31",
      limit: 50,
    });
    expect(result).toEqual({ ok: true, data: [] });
  });

  it("createVisit returns error when Supabase disabled", async () => {
    const { createVisit } = await import("../provider-visits-service");
    const result = await createVisit({
      homeId: "home-1",
      visitType: "social_worker",
      visitorName: "Jane Smith",
      visitorOrganisation: "Local Authority",
      visitDate: "2026-05-01",
      visitStatus: "scheduled",
      childrenSeen: [],
      childrenSpokenPrivately: [],
      staffSpokenTo: [],
      premisesInspected: false,
      recordsReviewed: false,
      actionsRaised: [],
      reportReceived: false,
    });
    expect(result).toEqual({ ok: false, error: "Supabase not configured" });
  });

  it("updateVisit returns error when Supabase disabled", async () => {
    const { updateVisit } = await import("../provider-visits-service");
    const result = await updateVisit("pv-1", { visit_status: "completed" });
    expect(result).toEqual({ ok: false, error: "Supabase not configured" });
  });
});
