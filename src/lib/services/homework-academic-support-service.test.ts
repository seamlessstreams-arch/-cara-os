import { describe, it, expect } from "vitest";
import {
  computeHomeworkAcademicMetrics,
  identifyHomeworkAcademicAlerts,
  type HomeworkAcademicSupportRecord,
} from "./homework-academic-support-service";

function makeRecord(overrides: Partial<HomeworkAcademicSupportRecord> = {}): HomeworkAcademicSupportRecord {
  return {
    id: "rec-1",
    home_id: "home-1",
    subject_area: "english",
    support_type: "homework_help",
    engagement_level: "engaged",
    progress_outcome: "met_expectations",
    session_date: "2026-05-01",
    child_name: "Child A",
    child_id: "child-1",
    supported_by: "Staff A",
    homework_completed: true,
    quiet_space_provided: true,
    resources_available: true,
    school_liaison_made: true,
    learning_needs_met: true,
    positive_encouragement: true,
    care_plan_reflects: true,
    social_worker_informed: true,
    parent_informed: true,
    pep_updated: true,
    attendance_checked: true,
    recorded_promptly: true,
    issues_found: [],
    actions_taken: [],
    next_review_date: null,
    notes: null,
    created_at: "2026-05-01T10:00:00Z",
    updated_at: "2026-05-01T10:00:00Z",
    ...overrides,
  };
}

describe("computeHomeworkAcademicMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeHomeworkAcademicMetrics([]);
    expect(m.total_sessions).toBe(0);
    expect(m.disengaged_count).toBe(0);
    expect(m.refused_count).toBe(0);
    expect(m.no_progress_count).toBe(0);
    expect(m.regression_count).toBe(0);
    expect(m.homework_completed_rate).toBeNull();;
    expect(m.unique_children).toBe(0);
  });

  it("counts and rates correctly for populated data", () => {
    const records = [
      makeRecord({ id: "r1", engagement_level: "disengaged", homework_completed: false, school_liaison_made: false, pep_updated: false }),
      makeRecord({ id: "r2", engagement_level: "refused", progress_outcome: "regression", quiet_space_provided: false, resources_available: false }),
      makeRecord({ id: "r3", progress_outcome: "no_progress", child_name: "Child B" }),
      makeRecord({ id: "r4" }),
    ];
    const m = computeHomeworkAcademicMetrics(records);
    expect(m.total_sessions).toBe(4);
    expect(m.disengaged_count).toBe(1);
    expect(m.refused_count).toBe(1);
    expect(m.no_progress_count).toBe(1);
    expect(m.regression_count).toBe(1);
    // homework completed: 3/4 = 75%
    expect(m.homework_completed_rate).toBe(75);
    // quiet_space: 3/4 = 75%
    expect(m.quiet_space_rate).toBe(75);
    // resources: 3/4 = 75%
    expect(m.resources_rate).toBe(75);
    // school_liaison: 3/4 = 75%
    expect(m.school_liaison_rate).toBe(75);
    // pep_updated: 3/4 = 75%
    expect(m.pep_updated_rate).toBe(75);
    expect(m.unique_children).toBe(2);
    expect(m.by_engagement_level["disengaged"]).toBe(1);
    expect(m.by_progress_outcome["regression"]).toBe(1);
    expect(m.by_subject_area["english"]).toBe(4);
  });
});

describe("identifyHomeworkAcademicAlerts", () => {
  it("returns empty for empty data", () => {
    expect(identifyHomeworkAcademicAlerts([])).toEqual([]);
  });

  it("fires critical refused_regressing when engagement=refused AND outcome=regression", () => {
    const records = [makeRecord({ engagement_level: "refused", progress_outcome: "regression" })];
    const alerts = identifyHomeworkAcademicAlerts(records);
    const found = alerts.find((a) => a.type === "refused_regressing");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("critical");
    expect(found!.id).toBe("rec-1");
  });

  it("does NOT fire refused_regressing when only refused but not regressing", () => {
    const records = [makeRecord({ engagement_level: "refused", progress_outcome: "no_progress" })];
    const alerts = identifyHomeworkAcademicAlerts(records);
    expect(alerts.find((a) => a.type === "refused_regressing")).toBeUndefined();
  });

  it("fires high no_school_liaison when >= 1 session has no liaison", () => {
    const records = [makeRecord({ school_liaison_made: false })];
    const alerts = identifyHomeworkAcademicAlerts(records);
    const found = alerts.find((a) => a.type === "no_school_liaison");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("high");
  });

  it("fires high pep_not_updated when >= 1 session has PEP not updated", () => {
    const records = [makeRecord({ pep_updated: false })];
    const alerts = identifyHomeworkAcademicAlerts(records);
    const found = alerts.find((a) => a.type === "pep_not_updated");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("high");
  });

  it("fires medium no_quiet_space when >= 2 sessions lack quiet space", () => {
    const records = [
      makeRecord({ id: "r1", quiet_space_provided: false }),
      makeRecord({ id: "r2", quiet_space_provided: false }),
    ];
    const alerts = identifyHomeworkAcademicAlerts(records);
    expect(alerts.find((a) => a.type === "no_quiet_space")).toBeDefined();
  });

  it("does NOT fire no_quiet_space when only 1 session lacks quiet space", () => {
    const records = [makeRecord({ quiet_space_provided: false })];
    const alerts = identifyHomeworkAcademicAlerts(records);
    expect(alerts.find((a) => a.type === "no_quiet_space")).toBeUndefined();
  });

  it("fires medium no_resources when >= 2 sessions lack resources", () => {
    const records = [
      makeRecord({ id: "r1", resources_available: false }),
      makeRecord({ id: "r2", resources_available: false }),
    ];
    const alerts = identifyHomeworkAcademicAlerts(records);
    expect(alerts.find((a) => a.type === "no_resources")).toBeDefined();
  });
});
