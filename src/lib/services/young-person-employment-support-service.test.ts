import { describe, it, expect } from "vitest";
import {
  computeEmploymentSupportMetrics,
  computeEmploymentSupportAlerts,
  type YoungPersonEmploymentSupportRow,
} from "./young-person-employment-support-service";

// ── Factory ────────────────────────────────────────────────────────────────

function makeRow(overrides: Partial<YoungPersonEmploymentSupportRow> = {}): YoungPersonEmploymentSupportRow {
  return {
    id: "es-1",
    home_id: "home-1",
    child_name: "Sam Brown",
    child_id: "child-1",
    support_date: "2025-05-10",
    support_type: "career_guidance",
    employment_status: "employed_full_time",
    readiness_level: "employed",
    progress_status: "completed",
    cv_completed: true,
    interview_practice_done: true,
    work_experience_arranged: true,
    employer_engaged: true,
    child_motivated: true,
    financial_literacy_covered: true,
    travel_training_completed: true,
    workplace_rights_covered: true,
    support_worker: "worker-1",
    employer_name: "Acme Co",
    notes: null,
    created_at: "2025-05-10T00:00:00Z",
    updated_at: "2025-05-10T00:00:00Z",
    ...overrides,
  };
}

// ── computeEmploymentSupportMetrics ────────────────────────────────────────

describe("computeEmploymentSupportMetrics", () => {
  it("returns zeroes for empty rows", () => {
    const m = computeEmploymentSupportMetrics([]);
    expect(m.total_records).toBe(0);
    expect(m.not_in_employment_count).toBe(0);
    expect(m.employed_count).toBe(0);
    expect(m.apprenticeship_count).toBe(0);
    expect(m.not_ready_count).toBe(0);
    expect(m.cv_completed_rate).toBeNull();;
    expect(m.unique_children).toBe(0);
  });

  it("counts employment statuses correctly", () => {
    const rows = [
      makeRow({ employment_status: "not_in_employment" }),
      makeRow({ id: "e2", employment_status: "employed_part_time" }),
      makeRow({ id: "e3", employment_status: "employed_full_time" }),
      makeRow({ id: "e4", employment_status: "apprenticeship_active" }),
    ];
    const m = computeEmploymentSupportMetrics(rows);
    expect(m.not_in_employment_count).toBe(1);
    expect(m.employed_count).toBe(2);
    expect(m.apprenticeship_count).toBe(1);
  });

  it("computes boolean rates correctly", () => {
    const rows = [
      makeRow({ cv_completed: true }),
      makeRow({ id: "e2", cv_completed: false }),
    ];
    const m = computeEmploymentSupportMetrics(rows);
    expect(m.cv_completed_rate).toBe(50);
  });

  it("counts unique children by name", () => {
    const rows = [
      makeRow({ child_name: "Sam" }),
      makeRow({ id: "e2", child_name: "Sam" }),
      makeRow({ id: "e3", child_name: "Alex" }),
    ];
    const m = computeEmploymentSupportMetrics(rows);
    expect(m.unique_children).toBe(2);
  });

  it("builds support type and employment status breakdowns", () => {
    const rows = [
      makeRow({ support_type: "cv_preparation", employment_status: "job_searching" }),
      makeRow({ id: "e2", support_type: "cv_preparation", employment_status: "employed_full_time" }),
    ];
    const m = computeEmploymentSupportMetrics(rows);
    expect(m.support_type_breakdown).toEqual({ cv_preparation: 2 });
    expect(m.employment_status_breakdown).toEqual({ job_searching: 1, employed_full_time: 1 });
  });
});

// ── computeEmploymentSupportAlerts ─────────────────────────────────────────

describe("computeEmploymentSupportAlerts", () => {
  it("returns no alerts for empty rows", () => {
    expect(computeEmploymentSupportAlerts([])).toEqual([]);
  });

  it("flags critical when not employed, not ready, and no support in progress", () => {
    const rows = [makeRow({
      employment_status: "not_in_employment",
      readiness_level: "not_ready",
      progress_status: "not_started",
    })];
    const alerts = computeEmploymentSupportAlerts(rows);
    const crit = alerts.filter((a) => a.type === "not_employed_not_ready_no_support");
    expect(crit.length).toBe(1);
    expect(crit[0].severity).toBe("critical");
  });

  it("does NOT flag critical when support is in progress", () => {
    const rows = [makeRow({
      employment_status: "not_in_employment",
      readiness_level: "not_ready",
      progress_status: "in_progress",
    })];
    const alerts = computeEmploymentSupportAlerts(rows);
    const crit = alerts.filter((a) => a.type === "not_employed_not_ready_no_support");
    expect(crit.length).toBe(0);
  });

  it("flags high when work_ready but not employed/interviewing", () => {
    const rows = [makeRow({
      readiness_level: "work_ready",
      employment_status: "not_in_employment",
    })];
    const alerts = computeEmploymentSupportAlerts(rows);
    const high = alerts.filter((a) => a.type === "work_ready_not_employed");
    expect(high.length).toBe(1);
    expect(high[0].severity).toBe("high");
  });

  it("does NOT flag work_ready when at interview stage", () => {
    const rows = [makeRow({
      readiness_level: "work_ready",
      employment_status: "interview_stage",
    })];
    const alerts = computeEmploymentSupportAlerts(rows);
    const high = alerts.filter((a) => a.type === "work_ready_not_employed");
    expect(high.length).toBe(0);
  });

  it("flags high when job searching with no CV", () => {
    const rows = [makeRow({
      employment_status: "job_searching",
      cv_completed: false,
    })];
    const alerts = computeEmploymentSupportAlerts(rows);
    const noCV = alerts.filter((a) => a.type === "job_searching_no_cv");
    expect(noCV.length).toBe(1);
    expect(noCV[0].severity).toBe("high");
  });

  it("flags medium for employed without financial literacy", () => {
    const rows = [makeRow({
      employment_status: "employed_full_time",
      financial_literacy_covered: false,
    })];
    const alerts = computeEmploymentSupportAlerts(rows);
    const fl = alerts.filter((a) => a.type === "employed_no_financial_literacy");
    expect(fl.length).toBe(1);
    expect(fl[0].severity).toBe("medium");
  });

  it("flags medium for employed without workplace rights", () => {
    const rows = [makeRow({
      employment_status: "apprenticeship_active",
      workplace_rights_covered: false,
    })];
    const alerts = computeEmploymentSupportAlerts(rows);
    const wr = alerts.filter((a) => a.type === "employed_no_workplace_rights");
    expect(wr.length).toBe(1);
    expect(wr[0].severity).toBe("medium");
  });

  it("returns no alerts for a well-supported employed young person", () => {
    const rows = [makeRow()]; // all defaults are good
    const alerts = computeEmploymentSupportAlerts(rows);
    expect(alerts).toEqual([]);
  });
});
