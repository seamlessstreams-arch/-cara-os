// ══════════════════════════════════════════════════════════════════════════════
// CARA — YOUNG PERSON EMPLOYMENT SUPPORT SERVICE TESTS
// Pure-function tests for employment support metrics, alert identification,
// Cara insight generation, and edge cases.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";

import {
  SUPPORT_TYPES,
  EMPLOYMENT_STATUSES,
  READINESS_LEVELS,
  PROGRESS_STATUSES,
  _testing,
} from "../young-person-employment-support-service";

import type {
  YoungPersonEmploymentSupportRow,
  SupportType,
  EmploymentStatus,
  ReadinessLevel,
  ProgressStatus,
} from "../young-person-employment-support-service";

const {
  computeEmploymentSupportMetrics,
  computeEmploymentSupportAlerts,
  generateEmploymentSupportCaraInsights,
} = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

const now = new Date(new Date().toISOString().split("T")[0]);

function makeRow(
  overrides?: Partial<YoungPersonEmploymentSupportRow>,
): YoungPersonEmploymentSupportRow {
  return {
    id: "id" in (overrides ?? {}) ? overrides!.id! : crypto.randomUUID(),
    home_id: "home_id" in (overrides ?? {}) ? overrides!.home_id! : "home-1",
    child_name: "child_name" in (overrides ?? {}) ? overrides!.child_name! : "Child A",
    child_id: "child_id" in (overrides ?? {}) ? (overrides!.child_id ?? null) : null,
    support_date: "support_date" in (overrides ?? {}) ? overrides!.support_date! : now.toISOString().split("T")[0],
    support_type: "support_type" in (overrides ?? {}) ? overrides!.support_type! : "cv_preparation",
    employment_status: "employment_status" in (overrides ?? {}) ? overrides!.employment_status! : "not_in_employment",
    readiness_level: "readiness_level" in (overrides ?? {}) ? overrides!.readiness_level! : "developing",
    progress_status: "progress_status" in (overrides ?? {}) ? overrides!.progress_status! : "in_progress",
    cv_completed: "cv_completed" in (overrides ?? {}) ? overrides!.cv_completed! : true,
    interview_practice_done: "interview_practice_done" in (overrides ?? {}) ? overrides!.interview_practice_done! : true,
    work_experience_arranged: "work_experience_arranged" in (overrides ?? {}) ? overrides!.work_experience_arranged! : true,
    employer_engaged: "employer_engaged" in (overrides ?? {}) ? overrides!.employer_engaged! : true,
    child_motivated: "child_motivated" in (overrides ?? {}) ? overrides!.child_motivated! : true,
    financial_literacy_covered: "financial_literacy_covered" in (overrides ?? {}) ? overrides!.financial_literacy_covered! : true,
    travel_training_completed: "travel_training_completed" in (overrides ?? {}) ? overrides!.travel_training_completed! : true,
    workplace_rights_covered: "workplace_rights_covered" in (overrides ?? {}) ? overrides!.workplace_rights_covered! : true,
    support_worker: "support_worker" in (overrides ?? {}) ? (overrides!.support_worker ?? null) : null,
    employer_name: "employer_name" in (overrides ?? {}) ? (overrides!.employer_name ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: "created_at" in (overrides ?? {}) ? overrides!.created_at! : now.toISOString(),
    updated_at: "updated_at" in (overrides ?? {}) ? overrides!.updated_at! : now.toISOString(),
  };
}

// ── computeEmploymentSupportMetrics ────────────────────────────────────

describe("computeEmploymentSupportMetrics", () => {
  describe("empty array", () => {
    it("returns zero total_records", () => {
      const m = computeEmploymentSupportMetrics([]);
      expect(m.total_records).toBe(0);
    });

    it("returns zero not_in_employment_count", () => {
      const m = computeEmploymentSupportMetrics([]);
      expect(m.not_in_employment_count).toBe(0);
    });

    it("returns zero employed_count", () => {
      const m = computeEmploymentSupportMetrics([]);
      expect(m.employed_count).toBe(0);
    });

    it("returns zero apprenticeship_count", () => {
      const m = computeEmploymentSupportMetrics([]);
      expect(m.apprenticeship_count).toBe(0);
    });

    it("returns zero not_ready_count", () => {
      const m = computeEmploymentSupportMetrics([]);
      expect(m.not_ready_count).toBe(0);
    });

    it("returns zero cv_completed_rate", () => {
      const m = computeEmploymentSupportMetrics([]);
      expect(m.cv_completed_rate).toBe(0);
    });

    it("returns zero interview_practice_rate", () => {
      const m = computeEmploymentSupportMetrics([]);
      expect(m.interview_practice_rate).toBe(0);
    });

    it("returns zero work_experience_rate", () => {
      const m = computeEmploymentSupportMetrics([]);
      expect(m.work_experience_rate).toBe(0);
    });

    it("returns zero employer_engaged_rate", () => {
      const m = computeEmploymentSupportMetrics([]);
      expect(m.employer_engaged_rate).toBe(0);
    });

    it("returns zero child_motivated_rate", () => {
      const m = computeEmploymentSupportMetrics([]);
      expect(m.child_motivated_rate).toBe(0);
    });

    it("returns zero financial_literacy_rate", () => {
      const m = computeEmploymentSupportMetrics([]);
      expect(m.financial_literacy_rate).toBe(0);
    });

    it("returns zero travel_training_rate", () => {
      const m = computeEmploymentSupportMetrics([]);
      expect(m.travel_training_rate).toBe(0);
    });

    it("returns zero workplace_rights_rate", () => {
      const m = computeEmploymentSupportMetrics([]);
      expect(m.workplace_rights_rate).toBe(0);
    });

    it("returns empty support_type_breakdown", () => {
      const m = computeEmploymentSupportMetrics([]);
      expect(m.support_type_breakdown).toEqual({});
    });

    it("returns empty employment_status_breakdown", () => {
      const m = computeEmploymentSupportMetrics([]);
      expect(m.employment_status_breakdown).toEqual({});
    });

    it("returns zero unique_children", () => {
      const m = computeEmploymentSupportMetrics([]);
      expect(m.unique_children).toBe(0);
    });
  });

  describe("single row", () => {
    const row = makeRow({
      employment_status: "not_in_employment",
      readiness_level: "developing",
      support_type: "cv_preparation",
      cv_completed: true,
      interview_practice_done: true,
      work_experience_arranged: true,
      employer_engaged: true,
      child_motivated: true,
      financial_literacy_covered: true,
      travel_training_completed: true,
      workplace_rights_covered: true,
      child_name: "Child A",
    });

    it("returns total_records = 1", () => {
      const m = computeEmploymentSupportMetrics([row]);
      expect(m.total_records).toBe(1);
    });

    it("returns cv_completed_rate = 100", () => {
      const m = computeEmploymentSupportMetrics([row]);
      expect(m.cv_completed_rate).toBe(100);
    });

    it("returns interview_practice_rate = 100", () => {
      const m = computeEmploymentSupportMetrics([row]);
      expect(m.interview_practice_rate).toBe(100);
    });

    it("returns work_experience_rate = 100", () => {
      const m = computeEmploymentSupportMetrics([row]);
      expect(m.work_experience_rate).toBe(100);
    });

    it("returns employer_engaged_rate = 100", () => {
      const m = computeEmploymentSupportMetrics([row]);
      expect(m.employer_engaged_rate).toBe(100);
    });

    it("returns child_motivated_rate = 100", () => {
      const m = computeEmploymentSupportMetrics([row]);
      expect(m.child_motivated_rate).toBe(100);
    });

    it("returns financial_literacy_rate = 100", () => {
      const m = computeEmploymentSupportMetrics([row]);
      expect(m.financial_literacy_rate).toBe(100);
    });

    it("returns travel_training_rate = 100", () => {
      const m = computeEmploymentSupportMetrics([row]);
      expect(m.travel_training_rate).toBe(100);
    });

    it("returns workplace_rights_rate = 100", () => {
      const m = computeEmploymentSupportMetrics([row]);
      expect(m.workplace_rights_rate).toBe(100);
    });

    it("returns not_in_employment_count = 1", () => {
      const m = computeEmploymentSupportMetrics([row]);
      expect(m.not_in_employment_count).toBe(1);
    });

    it("returns support_type_breakdown with single entry", () => {
      const m = computeEmploymentSupportMetrics([row]);
      expect(m.support_type_breakdown).toEqual({ cv_preparation: 1 });
    });

    it("returns employment_status_breakdown with single entry", () => {
      const m = computeEmploymentSupportMetrics([row]);
      expect(m.employment_status_breakdown).toEqual({ not_in_employment: 1 });
    });

    it("returns unique_children = 1", () => {
      const m = computeEmploymentSupportMetrics([row]);
      expect(m.unique_children).toBe(1);
    });
  });

  describe("multiple rows", () => {
    const rows = [
      makeRow({ employment_status: "not_in_employment", readiness_level: "not_ready", support_type: "cv_preparation", child_name: "Child A", cv_completed: true, interview_practice_done: false, work_experience_arranged: false, employer_engaged: false, child_motivated: true, financial_literacy_covered: false, travel_training_completed: false, workplace_rights_covered: false }),
      makeRow({ employment_status: "employed_full_time", readiness_level: "employed", support_type: "supported_employment", child_name: "Child B", cv_completed: true, interview_practice_done: true, work_experience_arranged: true, employer_engaged: true, child_motivated: true, financial_literacy_covered: true, travel_training_completed: true, workplace_rights_covered: true }),
      makeRow({ employment_status: "apprenticeship_active", readiness_level: "work_ready", support_type: "apprenticeship", child_name: "Child C", cv_completed: true, interview_practice_done: true, work_experience_arranged: true, employer_engaged: true, child_motivated: false, financial_literacy_covered: true, travel_training_completed: false, workplace_rights_covered: true }),
    ];

    it("returns total_records = 3", () => {
      const m = computeEmploymentSupportMetrics(rows);
      expect(m.total_records).toBe(3);
    });

    it("returns not_in_employment_count = 1", () => {
      const m = computeEmploymentSupportMetrics(rows);
      expect(m.not_in_employment_count).toBe(1);
    });

    it("returns employed_count = 1 (only full_time/part_time)", () => {
      const m = computeEmploymentSupportMetrics(rows);
      expect(m.employed_count).toBe(1);
    });

    it("returns apprenticeship_count = 1", () => {
      const m = computeEmploymentSupportMetrics(rows);
      expect(m.apprenticeship_count).toBe(1);
    });

    it("returns not_ready_count = 1", () => {
      const m = computeEmploymentSupportMetrics(rows);
      expect(m.not_ready_count).toBe(1);
    });

    it("calculates cv_completed_rate correctly (3/3 = 100%)", () => {
      const m = computeEmploymentSupportMetrics(rows);
      expect(m.cv_completed_rate).toBe(100);
    });

    it("calculates interview_practice_rate correctly (2/3 = 66.7%)", () => {
      const m = computeEmploymentSupportMetrics(rows);
      expect(m.interview_practice_rate).toBe(66.7);
    });

    it("calculates work_experience_rate correctly (2/3 = 66.7%)", () => {
      const m = computeEmploymentSupportMetrics(rows);
      expect(m.work_experience_rate).toBe(66.7);
    });

    it("calculates employer_engaged_rate correctly (2/3 = 66.7%)", () => {
      const m = computeEmploymentSupportMetrics(rows);
      expect(m.employer_engaged_rate).toBe(66.7);
    });

    it("calculates child_motivated_rate correctly (2/3 = 66.7%)", () => {
      const m = computeEmploymentSupportMetrics(rows);
      expect(m.child_motivated_rate).toBe(66.7);
    });

    it("calculates financial_literacy_rate correctly (2/3 = 66.7%)", () => {
      const m = computeEmploymentSupportMetrics(rows);
      expect(m.financial_literacy_rate).toBe(66.7);
    });

    it("calculates travel_training_rate correctly (1/3 = 33.3%)", () => {
      const m = computeEmploymentSupportMetrics(rows);
      expect(m.travel_training_rate).toBe(33.3);
    });

    it("calculates workplace_rights_rate correctly (2/3 = 66.7%)", () => {
      const m = computeEmploymentSupportMetrics(rows);
      expect(m.workplace_rights_rate).toBe(66.7);
    });

    it("groups support_type_breakdown correctly", () => {
      const m = computeEmploymentSupportMetrics(rows);
      expect(m.support_type_breakdown).toEqual({
        cv_preparation: 1,
        supported_employment: 1,
        apprenticeship: 1,
      });
    });

    it("groups employment_status_breakdown correctly", () => {
      const m = computeEmploymentSupportMetrics(rows);
      expect(m.employment_status_breakdown).toEqual({
        not_in_employment: 1,
        employed_full_time: 1,
        apprenticeship_active: 1,
      });
    });

    it("returns unique_children = 3", () => {
      const m = computeEmploymentSupportMetrics(rows);
      expect(m.unique_children).toBe(3);
    });
  });

  describe("support_type_breakdown", () => {
    it("counts duplicate support types", () => {
      const rows = [
        makeRow({ support_type: "cv_preparation" }),
        makeRow({ support_type: "cv_preparation" }),
        makeRow({ support_type: "job_search" }),
      ];
      const m = computeEmploymentSupportMetrics(rows);
      expect(m.support_type_breakdown).toEqual({ cv_preparation: 2, job_search: 1 });
    });

    it("handles all 10 support types", () => {
      const rows = SUPPORT_TYPES.map((t) => makeRow({ support_type: t }));
      const m = computeEmploymentSupportMetrics(rows);
      for (const t of SUPPORT_TYPES) {
        expect(m.support_type_breakdown[t]).toBe(1);
      }
    });
  });

  describe("employment_status_breakdown", () => {
    it("counts duplicate employment statuses", () => {
      const rows = [
        makeRow({ employment_status: "not_in_employment" }),
        makeRow({ employment_status: "not_in_employment" }),
        makeRow({ employment_status: "employed_full_time" }),
      ];
      const m = computeEmploymentSupportMetrics(rows);
      expect(m.employment_status_breakdown).toEqual({ not_in_employment: 2, employed_full_time: 1 });
    });

    it("handles all 9 employment statuses", () => {
      const rows = EMPLOYMENT_STATUSES.map((s) => makeRow({ employment_status: s }));
      const m = computeEmploymentSupportMetrics(rows);
      for (const s of EMPLOYMENT_STATUSES) {
        expect(m.employment_status_breakdown[s]).toBe(1);
      }
    });
  });

  describe("unique_children", () => {
    it("counts distinct child names", () => {
      const rows = [
        makeRow({ child_name: "Child A" }),
        makeRow({ child_name: "Child A" }),
        makeRow({ child_name: "Child B" }),
      ];
      const m = computeEmploymentSupportMetrics(rows);
      expect(m.unique_children).toBe(2);
    });

    it("returns 1 when all rows have the same child", () => {
      const rows = [
        makeRow({ child_name: "Child A" }),
        makeRow({ child_name: "Child A" }),
        makeRow({ child_name: "Child A" }),
      ];
      const m = computeEmploymentSupportMetrics(rows);
      expect(m.unique_children).toBe(1);
    });

    it("counts each unique child name", () => {
      const rows = [
        makeRow({ child_name: "Alice" }),
        makeRow({ child_name: "Bob" }),
        makeRow({ child_name: "Charlie" }),
        makeRow({ child_name: "Alice" }),
      ];
      const m = computeEmploymentSupportMetrics(rows);
      expect(m.unique_children).toBe(3);
    });
  });

  describe("percentage calculations with known values", () => {
    it("cv_completed_rate 0 when all false", () => {
      expect(computeEmploymentSupportMetrics([makeRow({ cv_completed: false })]).cv_completed_rate).toBe(0);
    });

    it("mixed boolean rate (1/3 = 33.3%)", () => {
      const rows = [
        makeRow({ cv_completed: true }),
        makeRow({ cv_completed: false }),
        makeRow({ cv_completed: false }),
      ];
      const m = computeEmploymentSupportMetrics(rows);
      expect(m.cv_completed_rate).toBe(33.3);
    });

    it("returns 100 for all rates when single row has all flags true", () => {
      const rows = [
        makeRow({ cv_completed: true, interview_practice_done: true, work_experience_arranged: true, employer_engaged: true, child_motivated: true, financial_literacy_covered: true, travel_training_completed: true, workplace_rights_covered: true }),
      ];
      const m = computeEmploymentSupportMetrics(rows);
      expect(m.cv_completed_rate).toBe(100);
      expect(m.interview_practice_rate).toBe(100);
      expect(m.work_experience_rate).toBe(100);
      expect(m.employer_engaged_rate).toBe(100);
      expect(m.child_motivated_rate).toBe(100);
      expect(m.financial_literacy_rate).toBe(100);
      expect(m.travel_training_rate).toBe(100);
      expect(m.workplace_rights_rate).toBe(100);
    });

    it("returns 0 for all rates when single row has all flags false", () => {
      const rows = [
        makeRow({ cv_completed: false, interview_practice_done: false, work_experience_arranged: false, employer_engaged: false, child_motivated: false, financial_literacy_covered: false, travel_training_completed: false, workplace_rights_covered: false }),
      ];
      const m = computeEmploymentSupportMetrics(rows);
      expect(m.cv_completed_rate).toBe(0);
      expect(m.interview_practice_rate).toBe(0);
      expect(m.work_experience_rate).toBe(0);
      expect(m.employer_engaged_rate).toBe(0);
      expect(m.child_motivated_rate).toBe(0);
      expect(m.financial_literacy_rate).toBe(0);
      expect(m.travel_training_rate).toBe(0);
      expect(m.workplace_rights_rate).toBe(0);
    });
  });

  describe("counts", () => {
    it("counts not_in_employment_count", () => {
      expect(computeEmploymentSupportMetrics([makeRow({ employment_status: "not_in_employment" })]).not_in_employment_count).toBe(1);
    });

    it("does not count job_searching as not_in_employment", () => {
      expect(computeEmploymentSupportMetrics([makeRow({ employment_status: "job_searching" })]).not_in_employment_count).toBe(0);
    });

    it("counts employed_full_time in employed_count", () => {
      expect(computeEmploymentSupportMetrics([makeRow({ employment_status: "employed_full_time" })]).employed_count).toBe(1);
    });

    it("counts employed_part_time in employed_count", () => {
      expect(computeEmploymentSupportMetrics([makeRow({ employment_status: "employed_part_time" })]).employed_count).toBe(1);
    });

    it("does not count apprenticeship_active in employed_count", () => {
      expect(computeEmploymentSupportMetrics([makeRow({ employment_status: "apprenticeship_active" })]).employed_count).toBe(0);
    });

    it("counts apprenticeship_active in apprenticeship_count", () => {
      expect(computeEmploymentSupportMetrics([makeRow({ employment_status: "apprenticeship_active" })]).apprenticeship_count).toBe(1);
    });

    it("does not count employed_full_time in apprenticeship_count", () => {
      expect(computeEmploymentSupportMetrics([makeRow({ employment_status: "employed_full_time" })]).apprenticeship_count).toBe(0);
    });

    it("counts not_ready in not_ready_count", () => {
      expect(computeEmploymentSupportMetrics([makeRow({ readiness_level: "not_ready" })]).not_ready_count).toBe(1);
    });

    it("does not count developing as not_ready", () => {
      expect(computeEmploymentSupportMetrics([makeRow({ readiness_level: "developing" })]).not_ready_count).toBe(0);
    });
  });
});

// ── computeEmploymentSupportAlerts ────────────────────────────────────

describe("computeEmploymentSupportAlerts", () => {
  describe("no alerts", () => {
    it("returns empty array when no rows", () => {
      const alerts = computeEmploymentSupportAlerts([]);
      expect(alerts).toHaveLength(0);
    });

    it("returns empty array when all rows are clean", () => {
      const rows = [
        makeRow({ employment_status: "employed_full_time", readiness_level: "employed", progress_status: "completed", cv_completed: true, financial_literacy_covered: true, workplace_rights_covered: true }),
      ];
      const alerts = computeEmploymentSupportAlerts(rows);
      expect(alerts).toEqual([]);
    });
  });

  describe("not_employed_not_ready_no_support alert", () => {
    it("fires when not in employment, not ready, and no support in progress", () => {
      const rows = [makeRow({ employment_status: "not_in_employment", readiness_level: "not_ready", progress_status: "not_started" })];
      const alerts = computeEmploymentSupportAlerts(rows);
      const alert = alerts.find((a) => a.type === "not_employed_not_ready_no_support");
      expect(alert).toBeDefined();
    });

    it("has severity critical", () => {
      const rows = [makeRow({ employment_status: "not_in_employment", readiness_level: "not_ready", progress_status: "not_started" })];
      const alerts = computeEmploymentSupportAlerts(rows);
      const alert = alerts.find((a) => a.type === "not_employed_not_ready_no_support")!;
      expect(alert.severity).toBe("critical");
    });

    it("includes record_id", () => {
      const rows = [makeRow({ id: "rec-1", employment_status: "not_in_employment", readiness_level: "not_ready", progress_status: "not_started" })];
      const alerts = computeEmploymentSupportAlerts(rows);
      const alert = alerts.find((a) => a.type === "not_employed_not_ready_no_support")!;
      expect(alert.record_id).toBe("rec-1");
    });

    it("includes child name in message", () => {
      const rows = [makeRow({ child_name: "Jordan", employment_status: "not_in_employment", readiness_level: "not_ready", progress_status: "not_started" })];
      const alerts = computeEmploymentSupportAlerts(rows);
      const alert = alerts.find((a) => a.type === "not_employed_not_ready_no_support")!;
      expect(alert.message).toContain("Jordan");
    });

    it("does not fire when progress_status is in_progress", () => {
      const rows = [makeRow({ employment_status: "not_in_employment", readiness_level: "not_ready", progress_status: "in_progress" })];
      const alerts = computeEmploymentSupportAlerts(rows);
      const alert = alerts.find((a) => a.type === "not_employed_not_ready_no_support");
      expect(alert).toBeUndefined();
    });

    it("does not fire when readiness is developing", () => {
      const rows = [makeRow({ employment_status: "not_in_employment", readiness_level: "developing", progress_status: "not_started" })];
      const alerts = computeEmploymentSupportAlerts(rows);
      const alert = alerts.find((a) => a.type === "not_employed_not_ready_no_support");
      expect(alert).toBeUndefined();
    });

    it("does not fire when employed", () => {
      const rows = [makeRow({ employment_status: "employed_full_time", readiness_level: "not_ready", progress_status: "not_started" })];
      const alerts = computeEmploymentSupportAlerts(rows);
      const alert = alerts.find((a) => a.type === "not_employed_not_ready_no_support");
      expect(alert).toBeUndefined();
    });

    it("fires for withdrawn progress_status", () => {
      const rows = [makeRow({ employment_status: "not_in_employment", readiness_level: "not_ready", progress_status: "withdrawn" })];
      const alerts = computeEmploymentSupportAlerts(rows);
      const alert = alerts.find((a) => a.type === "not_employed_not_ready_no_support");
      expect(alert).toBeDefined();
    });

    it("fires per record for multiple matching rows", () => {
      const rows = [
        makeRow({ employment_status: "not_in_employment", readiness_level: "not_ready", progress_status: "not_started" }),
        makeRow({ employment_status: "not_in_employment", readiness_level: "not_ready", progress_status: "completed" }),
      ];
      const alerts = computeEmploymentSupportAlerts(rows);
      const critical = alerts.filter((a) => a.type === "not_employed_not_ready_no_support");
      expect(critical).toHaveLength(2);
    });
  });

  describe("work_ready_not_employed alert", () => {
    it("fires when work ready but not in employment", () => {
      const rows = [makeRow({ readiness_level: "work_ready", employment_status: "not_in_employment" })];
      const alerts = computeEmploymentSupportAlerts(rows);
      const alert = alerts.find((a) => a.type === "work_ready_not_employed");
      expect(alert).toBeDefined();
    });

    it("has severity high", () => {
      const rows = [makeRow({ readiness_level: "work_ready", employment_status: "not_in_employment" })];
      const alerts = computeEmploymentSupportAlerts(rows);
      const alert = alerts.find((a) => a.type === "work_ready_not_employed")!;
      expect(alert.severity).toBe("high");
    });

    it("includes record_id", () => {
      const rows = [makeRow({ id: "rec-2", readiness_level: "work_ready", employment_status: "not_in_employment" })];
      const alerts = computeEmploymentSupportAlerts(rows);
      const alert = alerts.find((a) => a.type === "work_ready_not_employed")!;
      expect(alert.record_id).toBe("rec-2");
    });

    it("fires when work ready and job_searching", () => {
      const rows = [makeRow({ readiness_level: "work_ready", employment_status: "job_searching" })];
      const alerts = computeEmploymentSupportAlerts(rows);
      const alert = alerts.find((a) => a.type === "work_ready_not_employed");
      expect(alert).toBeDefined();
    });

    it("fires when work ready and offered (not yet employed)", () => {
      const rows = [makeRow({ readiness_level: "work_ready", employment_status: "offered" })];
      const alerts = computeEmploymentSupportAlerts(rows);
      const alert = alerts.find((a) => a.type === "work_ready_not_employed");
      expect(alert).toBeDefined();
    });

    it("does not fire when employed_full_time", () => {
      const rows = [makeRow({ readiness_level: "work_ready", employment_status: "employed_full_time" })];
      const alerts = computeEmploymentSupportAlerts(rows);
      const alert = alerts.find((a) => a.type === "work_ready_not_employed");
      expect(alert).toBeUndefined();
    });

    it("does not fire when employed_part_time", () => {
      const rows = [makeRow({ readiness_level: "work_ready", employment_status: "employed_part_time" })];
      const alerts = computeEmploymentSupportAlerts(rows);
      const alert = alerts.find((a) => a.type === "work_ready_not_employed");
      expect(alert).toBeUndefined();
    });

    it("does not fire when interview_stage", () => {
      const rows = [makeRow({ readiness_level: "work_ready", employment_status: "interview_stage" })];
      const alerts = computeEmploymentSupportAlerts(rows);
      const alert = alerts.find((a) => a.type === "work_ready_not_employed");
      expect(alert).toBeUndefined();
    });

    it("does not fire when apprenticeship_active", () => {
      const rows = [makeRow({ readiness_level: "work_ready", employment_status: "apprenticeship_active" })];
      const alerts = computeEmploymentSupportAlerts(rows);
      const alert = alerts.find((a) => a.type === "work_ready_not_employed");
      expect(alert).toBeUndefined();
    });

    it("does not fire when self_employed", () => {
      const rows = [makeRow({ readiness_level: "work_ready", employment_status: "self_employed" })];
      const alerts = computeEmploymentSupportAlerts(rows);
      const alert = alerts.find((a) => a.type === "work_ready_not_employed");
      expect(alert).toBeUndefined();
    });

    it("does not fire when volunteering", () => {
      const rows = [makeRow({ readiness_level: "work_ready", employment_status: "volunteering" })];
      const alerts = computeEmploymentSupportAlerts(rows);
      const alert = alerts.find((a) => a.type === "work_ready_not_employed");
      expect(alert).toBeUndefined();
    });

    it("does not fire when readiness is not_ready", () => {
      const rows = [makeRow({ readiness_level: "not_ready", employment_status: "not_in_employment" })];
      const alerts = computeEmploymentSupportAlerts(rows);
      const alert = alerts.find((a) => a.type === "work_ready_not_employed");
      expect(alert).toBeUndefined();
    });

    it("fires per record for multiple matching rows", () => {
      const rows = [
        makeRow({ readiness_level: "work_ready", employment_status: "not_in_employment" }),
        makeRow({ readiness_level: "work_ready", employment_status: "job_searching" }),
      ];
      const alerts = computeEmploymentSupportAlerts(rows);
      const high = alerts.filter((a) => a.type === "work_ready_not_employed");
      expect(high).toHaveLength(2);
    });
  });

  describe("job_searching_no_cv alert", () => {
    it("fires when job searching but no CV completed", () => {
      const rows = [makeRow({ employment_status: "job_searching", cv_completed: false })];
      const alerts = computeEmploymentSupportAlerts(rows);
      const alert = alerts.find((a) => a.type === "job_searching_no_cv");
      expect(alert).toBeDefined();
    });

    it("has severity high", () => {
      const rows = [makeRow({ employment_status: "job_searching", cv_completed: false })];
      const alerts = computeEmploymentSupportAlerts(rows);
      const alert = alerts.find((a) => a.type === "job_searching_no_cv")!;
      expect(alert.severity).toBe("high");
    });

    it("includes record_id", () => {
      const rows = [makeRow({ id: "rec-3", employment_status: "job_searching", cv_completed: false })];
      const alerts = computeEmploymentSupportAlerts(rows);
      const alert = alerts.find((a) => a.type === "job_searching_no_cv")!;
      expect(alert.record_id).toBe("rec-3");
    });

    it("includes child name in message", () => {
      const rows = [makeRow({ child_name: "Taylor", employment_status: "job_searching", cv_completed: false })];
      const alerts = computeEmploymentSupportAlerts(rows);
      const alert = alerts.find((a) => a.type === "job_searching_no_cv")!;
      expect(alert.message).toContain("Taylor");
    });

    it("does not fire when CV is completed", () => {
      const rows = [makeRow({ employment_status: "job_searching", cv_completed: true })];
      const alerts = computeEmploymentSupportAlerts(rows);
      const alert = alerts.find((a) => a.type === "job_searching_no_cv");
      expect(alert).toBeUndefined();
    });

    it("does not fire when not job_searching", () => {
      const rows = [makeRow({ employment_status: "not_in_employment", cv_completed: false })];
      const alerts = computeEmploymentSupportAlerts(rows);
      const alert = alerts.find((a) => a.type === "job_searching_no_cv");
      expect(alert).toBeUndefined();
    });

    it("fires per record for multiple job searchers without CV", () => {
      const rows = [
        makeRow({ employment_status: "job_searching", cv_completed: false }),
        makeRow({ employment_status: "job_searching", cv_completed: false }),
      ];
      const alerts = computeEmploymentSupportAlerts(rows);
      const high = alerts.filter((a) => a.type === "job_searching_no_cv");
      expect(high).toHaveLength(2);
    });
  });

  describe("employed_no_financial_literacy alert", () => {
    it("fires when employed_full_time without financial literacy", () => {
      const rows = [makeRow({ employment_status: "employed_full_time", financial_literacy_covered: false })];
      const alerts = computeEmploymentSupportAlerts(rows);
      const alert = alerts.find((a) => a.type === "employed_no_financial_literacy");
      expect(alert).toBeDefined();
    });

    it("fires when employed_part_time without financial literacy", () => {
      const rows = [makeRow({ employment_status: "employed_part_time", financial_literacy_covered: false })];
      const alerts = computeEmploymentSupportAlerts(rows);
      const alert = alerts.find((a) => a.type === "employed_no_financial_literacy");
      expect(alert).toBeDefined();
    });

    it("fires when apprenticeship_active without financial literacy", () => {
      const rows = [makeRow({ employment_status: "apprenticeship_active", financial_literacy_covered: false })];
      const alerts = computeEmploymentSupportAlerts(rows);
      const alert = alerts.find((a) => a.type === "employed_no_financial_literacy");
      expect(alert).toBeDefined();
    });

    it("fires when self_employed without financial literacy", () => {
      const rows = [makeRow({ employment_status: "self_employed", financial_literacy_covered: false })];
      const alerts = computeEmploymentSupportAlerts(rows);
      const alert = alerts.find((a) => a.type === "employed_no_financial_literacy");
      expect(alert).toBeDefined();
    });

    it("has severity medium", () => {
      const rows = [makeRow({ employment_status: "employed_full_time", financial_literacy_covered: false })];
      const alerts = computeEmploymentSupportAlerts(rows);
      const alert = alerts.find((a) => a.type === "employed_no_financial_literacy")!;
      expect(alert.severity).toBe("medium");
    });

    it("includes record_id", () => {
      const rows = [makeRow({ id: "rec-4", employment_status: "employed_full_time", financial_literacy_covered: false })];
      const alerts = computeEmploymentSupportAlerts(rows);
      const alert = alerts.find((a) => a.type === "employed_no_financial_literacy")!;
      expect(alert.record_id).toBe("rec-4");
    });

    it("does not fire when financial literacy is covered", () => {
      const rows = [makeRow({ employment_status: "employed_full_time", financial_literacy_covered: true })];
      const alerts = computeEmploymentSupportAlerts(rows);
      const alert = alerts.find((a) => a.type === "employed_no_financial_literacy");
      expect(alert).toBeUndefined();
    });

    it("does not fire when not employed (not_in_employment)", () => {
      const rows = [makeRow({ employment_status: "not_in_employment", financial_literacy_covered: false })];
      const alerts = computeEmploymentSupportAlerts(rows);
      const alert = alerts.find((a) => a.type === "employed_no_financial_literacy");
      expect(alert).toBeUndefined();
    });

    it("does not fire when volunteering without financial literacy", () => {
      const rows = [makeRow({ employment_status: "volunteering", financial_literacy_covered: false })];
      const alerts = computeEmploymentSupportAlerts(rows);
      const alert = alerts.find((a) => a.type === "employed_no_financial_literacy");
      expect(alert).toBeUndefined();
    });
  });

  describe("employed_no_workplace_rights alert", () => {
    it("fires when employed_full_time without workplace rights", () => {
      const rows = [makeRow({ employment_status: "employed_full_time", workplace_rights_covered: false })];
      const alerts = computeEmploymentSupportAlerts(rows);
      const alert = alerts.find((a) => a.type === "employed_no_workplace_rights");
      expect(alert).toBeDefined();
    });

    it("fires when employed_part_time without workplace rights", () => {
      const rows = [makeRow({ employment_status: "employed_part_time", workplace_rights_covered: false })];
      const alerts = computeEmploymentSupportAlerts(rows);
      const alert = alerts.find((a) => a.type === "employed_no_workplace_rights");
      expect(alert).toBeDefined();
    });

    it("fires when apprenticeship_active without workplace rights", () => {
      const rows = [makeRow({ employment_status: "apprenticeship_active", workplace_rights_covered: false })];
      const alerts = computeEmploymentSupportAlerts(rows);
      const alert = alerts.find((a) => a.type === "employed_no_workplace_rights");
      expect(alert).toBeDefined();
    });

    it("fires when self_employed without workplace rights", () => {
      const rows = [makeRow({ employment_status: "self_employed", workplace_rights_covered: false })];
      const alerts = computeEmploymentSupportAlerts(rows);
      const alert = alerts.find((a) => a.type === "employed_no_workplace_rights");
      expect(alert).toBeDefined();
    });

    it("has severity medium", () => {
      const rows = [makeRow({ employment_status: "employed_full_time", workplace_rights_covered: false })];
      const alerts = computeEmploymentSupportAlerts(rows);
      const alert = alerts.find((a) => a.type === "employed_no_workplace_rights")!;
      expect(alert.severity).toBe("medium");
    });

    it("includes record_id", () => {
      const rows = [makeRow({ id: "rec-5", employment_status: "employed_full_time", workplace_rights_covered: false })];
      const alerts = computeEmploymentSupportAlerts(rows);
      const alert = alerts.find((a) => a.type === "employed_no_workplace_rights")!;
      expect(alert.record_id).toBe("rec-5");
    });

    it("does not fire when workplace rights covered", () => {
      const rows = [makeRow({ employment_status: "employed_full_time", workplace_rights_covered: true })];
      const alerts = computeEmploymentSupportAlerts(rows);
      const alert = alerts.find((a) => a.type === "employed_no_workplace_rights");
      expect(alert).toBeUndefined();
    });

    it("does not fire when not employed (job_searching)", () => {
      const rows = [makeRow({ employment_status: "job_searching", workplace_rights_covered: false })];
      const alerts = computeEmploymentSupportAlerts(rows);
      const alert = alerts.find((a) => a.type === "employed_no_workplace_rights");
      expect(alert).toBeUndefined();
    });

    it("does not fire when volunteering without workplace rights", () => {
      const rows = [makeRow({ employment_status: "volunteering", workplace_rights_covered: false })];
      const alerts = computeEmploymentSupportAlerts(rows);
      const alert = alerts.find((a) => a.type === "employed_no_workplace_rights");
      expect(alert).toBeUndefined();
    });
  });

  describe("combined alerts", () => {
    it("can fire all five alert types simultaneously", () => {
      const rows = [
        makeRow({ employment_status: "not_in_employment", readiness_level: "not_ready", progress_status: "not_started", cv_completed: false }),
        makeRow({ readiness_level: "work_ready", employment_status: "job_searching", cv_completed: false }),
        makeRow({ employment_status: "employed_full_time", financial_literacy_covered: false, workplace_rights_covered: false }),
      ];
      const alerts = computeEmploymentSupportAlerts(rows);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("not_employed_not_ready_no_support");
      expect(types).toContain("work_ready_not_employed");
      expect(types).toContain("job_searching_no_cv");
      expect(types).toContain("employed_no_financial_literacy");
      expect(types).toContain("employed_no_workplace_rights");
    });

    it("generates correct number of alerts for overlapping conditions", () => {
      const rows = [
        makeRow({ employment_status: "employed_full_time", financial_literacy_covered: false, workplace_rights_covered: false }),
      ];
      const alerts = computeEmploymentSupportAlerts(rows);
      expect(alerts).toHaveLength(2);
    });
  });

  describe("alert structure", () => {
    it("every alert has type, severity, and message fields", () => {
      const rows = [
        makeRow({ employment_status: "not_in_employment", readiness_level: "not_ready", progress_status: "not_started" }),
      ];
      const alerts = computeEmploymentSupportAlerts(rows);
      for (const alert of alerts) {
        expect(alert).toHaveProperty("type");
        expect(alert).toHaveProperty("severity");
        expect(alert).toHaveProperty("message");
      }
    });

    it("severity is always one of critical, high, or medium", () => {
      const rows = [
        makeRow({ employment_status: "not_in_employment", readiness_level: "not_ready", progress_status: "not_started", cv_completed: false }),
        makeRow({ readiness_level: "work_ready", employment_status: "job_searching", cv_completed: false }),
        makeRow({ employment_status: "employed_full_time", financial_literacy_covered: false, workplace_rights_covered: false }),
      ];
      const alerts = computeEmploymentSupportAlerts(rows);
      for (const alert of alerts) {
        expect(["critical", "high", "medium"]).toContain(alert.severity);
      }
    });

    it("message is always a non-empty string", () => {
      const rows = [makeRow({ employment_status: "not_in_employment", readiness_level: "not_ready", progress_status: "not_started" })];
      const alerts = computeEmploymentSupportAlerts(rows);
      for (const alert of alerts) {
        expect(typeof alert.message).toBe("string");
        expect(alert.message.length).toBeGreaterThan(0);
      }
    });
  });
});

// ── generateEmploymentSupportCaraInsights ──────────────────────────────

describe("generateEmploymentSupportCaraInsights", () => {
  it("returns exactly 3 insights", () => {
    const insights = generateEmploymentSupportCaraInsights([]);
    expect(insights).toHaveLength(3);
  });

  it("first insight starts with [lime]", () => {
    const insights = generateEmploymentSupportCaraInsights([makeRow()]);
    expect(insights[0]).toMatch(/^\[lime\]/);
  });

  it("first insight includes total_records count", () => {
    const rows = [makeRow(), makeRow(), makeRow()];
    const insights = generateEmploymentSupportCaraInsights(rows);
    expect(insights[0]).toContain("3");
  });

  it("first insight includes unique young people count", () => {
    const rows = [makeRow({ child_name: "Alice" }), makeRow({ child_name: "Bob" })];
    const insights = generateEmploymentSupportCaraInsights(rows);
    expect(insights[0]).toContain("2");
  });

  it("first insight includes cv_completed_rate", () => {
    const rows = [makeRow({ cv_completed: true }), makeRow({ cv_completed: false })];
    const insights = generateEmploymentSupportCaraInsights(rows);
    expect(insights[0]).toContain("50%");
  });

  it("uses singular young person wording when unique_children is 1", () => {
    const rows = [makeRow({ child_name: "Alice" })];
    const insights = generateEmploymentSupportCaraInsights(rows);
    expect(insights[0]).toContain("1 young person");
  });

  it("uses plural young people wording when unique_children > 1", () => {
    const rows = [makeRow({ child_name: "Alice" }), makeRow({ child_name: "Bob" })];
    const insights = generateEmploymentSupportCaraInsights(rows);
    expect(insights[0]).toContain("2 young people");
  });

  it("second insight starts with [amber]", () => {
    const insights = generateEmploymentSupportCaraInsights([makeRow()]);
    expect(insights[1]).toMatch(/^\[amber\]/);
  });

  it("second insight mentions critical and high alerts when present", () => {
    const rows = [
      makeRow({ employment_status: "not_in_employment", readiness_level: "not_ready", progress_status: "not_started" }),
      makeRow({ readiness_level: "work_ready", employment_status: "not_in_employment" }),
    ];
    const insights = generateEmploymentSupportCaraInsights(rows);
    expect(insights[1]).toContain("critical");
    expect(insights[1]).toContain("high");
  });

  it("second insight mentions no alerts when none present", () => {
    const rows = [makeRow({ employment_status: "employed_full_time", readiness_level: "employed", progress_status: "completed", cv_completed: true, financial_literacy_covered: true, workplace_rights_covered: true })];
    const insights = generateEmploymentSupportCaraInsights(rows);
    expect(insights[1]).toContain("No critical or high-priority");
  });

  it("third insight starts with [reflect]", () => {
    const insights = generateEmploymentSupportCaraInsights([makeRow()]);
    expect(insights[2]).toMatch(/^\[reflect\]/);
  });

  it("third insight mentions not work ready when some are not_ready", () => {
    const rows = [makeRow({ readiness_level: "not_ready" })];
    const insights = generateEmploymentSupportCaraInsights(rows);
    expect(insights[2]).toContain("not work ready");
  });

  it("third insight asks about motivation when no not_ready but not all motivated", () => {
    const rows = [
      makeRow({ readiness_level: "developing", child_motivated: false }),
      makeRow({ readiness_level: "work_ready", child_motivated: true }),
    ];
    const insights = generateEmploymentSupportCaraInsights(rows);
    expect(insights[2]).toContain("motivation");
  });

  it("third insight celebrates when all motivated and none not_ready", () => {
    const rows = [
      makeRow({ readiness_level: "work_ready", child_motivated: true }),
      makeRow({ readiness_level: "employed", child_motivated: true }),
    ];
    const insights = generateEmploymentSupportCaraInsights(rows);
    expect(insights[2]).toContain("motivated and none are assessed as not work ready");
  });

  it("uses singular wording when 1 not_ready", () => {
    const rows = [makeRow({ readiness_level: "not_ready" })];
    const insights = generateEmploymentSupportCaraInsights(rows);
    expect(insights[2]).toContain("young person is");
  });

  it("uses plural wording when multiple not_ready", () => {
    const rows = [
      makeRow({ readiness_level: "not_ready" }),
      makeRow({ readiness_level: "not_ready" }),
    ];
    const insights = generateEmploymentSupportCaraInsights(rows);
    expect(insights[2]).toContain("young people are");
  });

  it("all insights are non-empty strings", () => {
    const insights = generateEmploymentSupportCaraInsights([makeRow()]);
    for (const insight of insights) {
      expect(typeof insight).toBe("string");
      expect(insight.length).toBeGreaterThan(0);
    }
  });
});

// ── Enum validation ──────────────────────────────────────────────────────

describe("enum arrays", () => {
  it("SUPPORT_TYPES has 10 entries", () => {
    expect(SUPPORT_TYPES).toHaveLength(10);
  });

  it("SUPPORT_TYPES contains cv_preparation", () => {
    expect(SUPPORT_TYPES).toContain("cv_preparation");
  });

  it("SUPPORT_TYPES contains interview_skills", () => {
    expect(SUPPORT_TYPES).toContain("interview_skills");
  });

  it("SUPPORT_TYPES contains apprenticeship", () => {
    expect(SUPPORT_TYPES).toContain("apprenticeship");
  });

  it("SUPPORT_TYPES contains work_experience", () => {
    expect(SUPPORT_TYPES).toContain("work_experience");
  });

  it("SUPPORT_TYPES contains supported_employment", () => {
    expect(SUPPORT_TYPES).toContain("supported_employment");
  });

  it("SUPPORT_TYPES contains job_search", () => {
    expect(SUPPORT_TYPES).toContain("job_search");
  });

  it("SUPPORT_TYPES contains volunteering", () => {
    expect(SUPPORT_TYPES).toContain("volunteering");
  });

  it("SUPPORT_TYPES contains self_employment", () => {
    expect(SUPPORT_TYPES).toContain("self_employment");
  });

  it("SUPPORT_TYPES contains career_guidance", () => {
    expect(SUPPORT_TYPES).toContain("career_guidance");
  });

  it("SUPPORT_TYPES contains workplace_mentoring", () => {
    expect(SUPPORT_TYPES).toContain("workplace_mentoring");
  });

  it("EMPLOYMENT_STATUSES has 9 entries", () => {
    expect(EMPLOYMENT_STATUSES).toHaveLength(9);
  });

  it("EMPLOYMENT_STATUSES contains not_in_employment", () => {
    expect(EMPLOYMENT_STATUSES).toContain("not_in_employment");
  });

  it("EMPLOYMENT_STATUSES contains job_searching", () => {
    expect(EMPLOYMENT_STATUSES).toContain("job_searching");
  });

  it("EMPLOYMENT_STATUSES contains interview_stage", () => {
    expect(EMPLOYMENT_STATUSES).toContain("interview_stage");
  });

  it("EMPLOYMENT_STATUSES contains offered", () => {
    expect(EMPLOYMENT_STATUSES).toContain("offered");
  });

  it("EMPLOYMENT_STATUSES contains employed_part_time", () => {
    expect(EMPLOYMENT_STATUSES).toContain("employed_part_time");
  });

  it("EMPLOYMENT_STATUSES contains employed_full_time", () => {
    expect(EMPLOYMENT_STATUSES).toContain("employed_full_time");
  });

  it("EMPLOYMENT_STATUSES contains apprenticeship_active", () => {
    expect(EMPLOYMENT_STATUSES).toContain("apprenticeship_active");
  });

  it("EMPLOYMENT_STATUSES contains self_employed", () => {
    expect(EMPLOYMENT_STATUSES).toContain("self_employed");
  });

  it("EMPLOYMENT_STATUSES contains volunteering", () => {
    expect(EMPLOYMENT_STATUSES).toContain("volunteering");
  });

  it("READINESS_LEVELS has 5 entries", () => {
    expect(READINESS_LEVELS).toHaveLength(5);
  });

  it("READINESS_LEVELS contains not_ready", () => {
    expect(READINESS_LEVELS).toContain("not_ready");
  });

  it("READINESS_LEVELS contains developing", () => {
    expect(READINESS_LEVELS).toContain("developing");
  });

  it("READINESS_LEVELS contains work_ready", () => {
    expect(READINESS_LEVELS).toContain("work_ready");
  });

  it("READINESS_LEVELS contains employed", () => {
    expect(READINESS_LEVELS).toContain("employed");
  });

  it("READINESS_LEVELS contains sustained_employment", () => {
    expect(READINESS_LEVELS).toContain("sustained_employment");
  });

  it("PROGRESS_STATUSES has 5 entries", () => {
    expect(PROGRESS_STATUSES).toHaveLength(5);
  });

  it("PROGRESS_STATUSES contains not_started", () => {
    expect(PROGRESS_STATUSES).toContain("not_started");
  });

  it("PROGRESS_STATUSES contains in_progress", () => {
    expect(PROGRESS_STATUSES).toContain("in_progress");
  });

  it("PROGRESS_STATUSES contains completed", () => {
    expect(PROGRESS_STATUSES).toContain("completed");
  });

  it("PROGRESS_STATUSES contains ongoing", () => {
    expect(PROGRESS_STATUSES).toContain("ongoing");
  });

  it("PROGRESS_STATUSES contains withdrawn", () => {
    expect(PROGRESS_STATUSES).toContain("withdrawn");
  });

  it("SUPPORT_TYPES has no duplicates", () => {
    expect(new Set(SUPPORT_TYPES).size).toBe(SUPPORT_TYPES.length);
  });

  it("EMPLOYMENT_STATUSES has no duplicates", () => {
    expect(new Set(EMPLOYMENT_STATUSES).size).toBe(EMPLOYMENT_STATUSES.length);
  });

  it("READINESS_LEVELS has no duplicates", () => {
    expect(new Set(READINESS_LEVELS).size).toBe(READINESS_LEVELS.length);
  });

  it("PROGRESS_STATUSES has no duplicates", () => {
    expect(new Set(PROGRESS_STATUSES).size).toBe(PROGRESS_STATUSES.length);
  });
});
