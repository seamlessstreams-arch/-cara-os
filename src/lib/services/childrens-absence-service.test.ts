import { describe, it, expect } from "vitest";
import {
  computeAbsenceMetrics,
  identifyAbsenceAlerts,
} from "./childrens-absence-service";
import type { ChildrensAbsenceRecord } from "./childrens-absence-service";

// -- Factory -------------------------------------------------------------------

function makeRecord(overrides: Partial<ChildrensAbsenceRecord> = {}): ChildrensAbsenceRecord {
  return {
    id: "abs-1",
    home_id: "home-1",
    absence_type: "illness",
    absence_duration: "full_day",
    intervention_status: "none_needed",
    attendance_risk: "on_track",
    absence_date: "2026-05-20",
    return_date: null,
    child_name: "Alex",
    child_id: "child-1",
    school_name: "Oakfield Academy",
    authorised: true,
    school_notified: true,
    social_worker_informed: true,
    parents_informed: true,
    medical_evidence_provided: false,
    pep_reviewed: true,
    catch_up_plan_in_place: true,
    pattern_identified: false,
    days_missed: 1,
    cumulative_days_missed: 3,
    attendance_percentage: 95,
    reason_details: "Stomach bug",
    issues_found: [],
    actions_taken: [],
    recorded_by: "Staff A",
    notes: null,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

// -- computeAbsenceMetrics -----------------------------------------------------

describe("computeAbsenceMetrics", () => {
  it("returns zeroed metrics for empty data", () => {
    const m = computeAbsenceMetrics([]);
    expect(m.total_absences).toBe(0);
    expect(m.authorised_count).toBe(0);
    expect(m.unauthorised_count).toBe(0);
    expect(m.authorised_rate).toBeNull();;
    expect(m.total_days_missed).toBe(0);
    expect(m.average_days_missed).toBeNull();;
    expect(m.average_attendance_percentage).toBeNull();;
    expect(m.unique_children).toBe(0);
  });

  it("counts authorised/unauthorised and calculates rate", () => {
    const rows = [
      makeRecord({ id: "1", authorised: true }),
      makeRecord({ id: "2", authorised: true }),
      makeRecord({ id: "3", authorised: false }),
    ];
    const m = computeAbsenceMetrics(rows);
    expect(m.authorised_count).toBe(2);
    expect(m.unauthorised_count).toBe(1);
    // 2/3 * 100 = 66.66... rounded to 66.7
    expect(m.authorised_rate).toBe(66.7);
  });

  it("counts exclusions and illness", () => {
    const rows = [
      makeRecord({ id: "1", absence_type: "exclusion" }),
      makeRecord({ id: "2", absence_type: "exclusion" }),
      makeRecord({ id: "3", absence_type: "illness" }),
    ];
    const m = computeAbsenceMetrics(rows);
    expect(m.exclusion_count).toBe(2);
    expect(m.illness_count).toBe(1);
  });

  it("calculates total and average days missed", () => {
    const rows = [
      makeRecord({ id: "1", days_missed: 2 }),
      makeRecord({ id: "2", days_missed: 4 }),
    ];
    const m = computeAbsenceMetrics(rows);
    expect(m.total_days_missed).toBe(6);
    expect(m.average_days_missed).toBe(3);
  });

  it("calculates average attendance percentage", () => {
    const rows = [
      makeRecord({ id: "1", attendance_percentage: 90 }),
      makeRecord({ id: "2", attendance_percentage: 80 }),
    ];
    const m = computeAbsenceMetrics(rows);
    expect(m.average_attendance_percentage).toBe(85);
  });

  it("counts persistent_absence (persistent + severe)", () => {
    const rows = [
      makeRecord({ id: "1", attendance_risk: "persistent_absence" }),
      makeRecord({ id: "2", attendance_risk: "severe_absence" }),
      makeRecord({ id: "3", attendance_risk: "on_track" }),
    ];
    const m = computeAbsenceMetrics(rows);
    expect(m.persistent_absence_count).toBe(2);
  });

  it("builds breakdowns by type, duration, intervention, and risk", () => {
    const rows = [
      makeRecord({ id: "1", absence_type: "illness", absence_duration: "full_day", intervention_status: "none_needed", attendance_risk: "on_track" }),
      makeRecord({ id: "2", absence_type: "unauthorised", absence_duration: "half_day_am", intervention_status: "planned", attendance_risk: "at_risk" }),
    ];
    const m = computeAbsenceMetrics(rows);
    expect(m.by_absence_type).toEqual({ illness: 1, unauthorised: 1 });
    expect(m.by_absence_duration).toEqual({ full_day: 1, half_day_am: 1 });
    expect(m.by_intervention_status).toEqual({ none_needed: 1, planned: 1 });
    expect(m.by_attendance_risk).toEqual({ on_track: 1, at_risk: 1 });
  });
});

// -- identifyAbsenceAlerts -----------------------------------------------------

describe("identifyAbsenceAlerts", () => {
  it("returns no alerts for empty data", () => {
    expect(identifyAbsenceAlerts([])).toEqual([]);
  });

  it("critical: exclusion triggers alert per record", () => {
    const row = makeRecord({ id: "ex1", absence_type: "exclusion" });
    const alerts = identifyAbsenceAlerts([row]);
    const matched = alerts.filter((a) => a.type === "exclusion");
    expect(matched).toHaveLength(1);
    expect(matched[0].severity).toBe("critical");
    expect(matched[0].id).toBe("ex1");
  });

  it("high: persistent absence (threshold >= 1)", () => {
    const row = makeRecord({ id: "pa1", attendance_risk: "persistent_absence" });
    const alerts = identifyAbsenceAlerts([row]);
    const matched = alerts.filter((a) => a.type === "persistent_absence");
    expect(matched).toHaveLength(1);
    expect(matched[0].severity).toBe("high");
  });

  it("high: unauthorised absences (threshold >= 3)", () => {
    // 2 unauthorised — should NOT trigger
    const alerts2 = identifyAbsenceAlerts([
      makeRecord({ id: "1", authorised: false }),
      makeRecord({ id: "2", authorised: false }),
    ]);
    expect(alerts2.filter((a) => a.type === "unauthorised_absences")).toHaveLength(0);

    // 3 unauthorised — should trigger
    const alerts3 = identifyAbsenceAlerts([
      makeRecord({ id: "1", authorised: false }),
      makeRecord({ id: "2", authorised: false }),
      makeRecord({ id: "3", authorised: false }),
    ]);
    const matched = alerts3.filter((a) => a.type === "unauthorised_absences");
    expect(matched).toHaveLength(1);
    expect(matched[0].severity).toBe("high");
  });

  it("medium: school not notified (threshold >= 2)", () => {
    const alerts = identifyAbsenceAlerts([
      makeRecord({ id: "1", school_notified: false }),
      makeRecord({ id: "2", school_notified: false }),
    ]);
    const matched = alerts.filter((a) => a.type === "school_not_notified");
    expect(matched).toHaveLength(1);
    expect(matched[0].severity).toBe("medium");
  });

  it("medium: absence pattern identified (threshold >= 2)", () => {
    const alerts = identifyAbsenceAlerts([
      makeRecord({ id: "1", pattern_identified: true }),
      makeRecord({ id: "2", pattern_identified: true }),
    ]);
    const matched = alerts.filter((a) => a.type === "absence_pattern");
    expect(matched).toHaveLength(1);
    expect(matched[0].severity).toBe("medium");
  });
});
