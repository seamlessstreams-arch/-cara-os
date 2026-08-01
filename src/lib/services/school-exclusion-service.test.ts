import { describe, it, expect } from "vitest";
import {
  computeMetrics,
  computeAlerts,
  validateSchoolExclusion,
} from "./school-exclusion-service";
import type { SchoolExclusionRow } from "./school-exclusion-service";

// -- Factory Function ---------------------------------------------------------

function makeRow(overrides: Partial<SchoolExclusionRow> = {}): SchoolExclusionRow {
  return {
    id: "exc-1",
    home_id: "home-1",
    child_name: "Alex",
    exclusion_date: "2026-05-01",
    recorded_by: "staff-1",
    exclusion_type: "Fixed-Term Exclusion",
    duration_days: 3,
    reason_given: "Disruptive behaviour",
    school_name: "Oakwood Academy",
    virtual_school_head_notified: true,
    social_worker_informed: true,
    independent_review_requested: null,
    governor_meeting_attended: null,
    alternative_provision_arranged: false,
    provision_name: null,
    education_hours_per_week: null,
    reintegration_plan: true,
    child_views_obtained: true,
    parent_carer_views: true,
    advocacy_provided: true,
    appeal_outcome: null,
    return_date: null,
    status: "Active",
    notes: null,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

// -- computeMetrics -----------------------------------------------------------

describe("computeMetrics", () => {
  it("returns zeroes for empty rows", () => {
    const m = computeMetrics([]);
    expect(m.total_records).toBe(0);
    expect(m.unique_children).toBe(0);
    expect(m.formal_exclusion_count).toBe(0);
    expect(m.unlawful_exclusion_count).toBe(0);
    expect(m.average_duration_days).toBeNull();
    expect(m.total_lost_days).toBe(0);
    expect(m.virtual_school_head_notification_rate).toBeNull();
    expect(m.active_exclusion_count).toBe(0);
    expect(m.repeat_exclusion_rate).toBeNull(); // fab-0.;
  });

  it("counts formal, unlawful, and alternative exclusion types", () => {
    const rows = [
      makeRow({ id: "e1", exclusion_type: "Fixed-Term Exclusion" }),
      makeRow({ id: "e2", exclusion_type: "Permanent Exclusion" }),
      makeRow({ id: "e3", exclusion_type: "Off-Rolling Suspected" }),
      makeRow({ id: "e4", exclusion_type: "Managed Move" }),
    ];
    const m = computeMetrics(rows);
    expect(m.formal_exclusion_count).toBe(2);
    expect(m.unlawful_exclusion_count).toBe(1);
    expect(m.alternative_provision_count).toBe(1);
  });

  it("computes average duration and total lost days", () => {
    const rows = [
      makeRow({ id: "e1", duration_days: 3 }),
      makeRow({ id: "e2", duration_days: 5 }),
      makeRow({ id: "e3", duration_days: null }),
    ];
    const m = computeMetrics(rows);
    expect(m.total_lost_days).toBe(8);
    expect(m.average_duration_days).toBe(4); // 8/2
  });

  it("computes boolean rates correctly", () => {
    const rows = [
      makeRow({ id: "e1", virtual_school_head_notified: true, child_views_obtained: true }),
      makeRow({ id: "e2", virtual_school_head_notified: false, child_views_obtained: false }),
    ];
    const m = computeMetrics(rows);
    expect(m.virtual_school_head_notification_rate).toBe(50);
    expect(m.child_views_obtained_rate).toBe(50);
  });

  it("counts active and resolved exclusions", () => {
    const rows = [
      makeRow({ id: "e1", status: "Active" }),
      makeRow({ id: "e2", status: "Ongoing" }),
      makeRow({ id: "e3", status: "Returned" }),
    ];
    const m = computeMetrics(rows);
    expect(m.active_exclusion_count).toBe(2);
    expect(m.resolved_count).toBe(1);
  });

  it("detects children with multiple exclusions", () => {
    const rows = [
      makeRow({ id: "e1", child_name: "Alex" }),
      makeRow({ id: "e2", child_name: "Alex" }),
      makeRow({ id: "e3", child_name: "Ben" }),
    ];
    const m = computeMetrics(rows);
    expect(m.children_with_multiple_exclusions).toBe(1);
    expect(m.unique_children).toBe(2);
  });
});

// -- computeAlerts ------------------------------------------------------------

describe("computeAlerts", () => {
  it("returns empty array for empty rows", () => {
    expect(computeAlerts([])).toEqual([]);
  });

  it("flags unlawful exclusion as critical", () => {
    const rows = [makeRow({ exclusion_type: "Informal/Illegal Exclusion" })];
    const alerts = computeAlerts(rows);
    const unlawful = alerts.filter((a) => a.type === "unlawful_exclusion");
    expect(unlawful).toHaveLength(1);
    expect(unlawful[0].severity).toBe("critical");
  });

  it("flags permanent exclusion without review as critical", () => {
    const rows = [makeRow({ exclusion_type: "Permanent Exclusion", independent_review_requested: null })];
    const alerts = computeAlerts(rows);
    const noReview = alerts.filter((a) => a.type === "permanent_no_review_decision");
    expect(noReview).toHaveLength(1);
    expect(noReview[0].severity).toBe("critical");
  });

  it("flags active exclusion >5 days without provision as critical", () => {
    const rows = [makeRow({ status: "Active", alternative_provision_arranged: false, duration_days: 7 })];
    const alerts = computeAlerts(rows);
    const noProvision = alerts.filter((a) => a.type === "no_provision_beyond_5_days");
    expect(noProvision).toHaveLength(1);
    expect(noProvision[0].severity).toBe("critical");
  });

  it("flags VSH not notified as critical", () => {
    const rows = [makeRow({ virtual_school_head_notified: false })];
    const alerts = computeAlerts(rows);
    const vsh = alerts.filter((a) => a.type === "vsh_not_notified");
    expect(vsh).toHaveLength(1);
    expect(vsh[0].severity).toBe("critical");
  });

  it("flags 3+ exclusions for same child as high", () => {
    const rows = [
      makeRow({ id: "e1", child_name: "Alex" }),
      makeRow({ id: "e2", child_name: "Alex" }),
      makeRow({ id: "e3", child_name: "Alex" }),
    ];
    const alerts = computeAlerts(rows);
    const repeat = alerts.filter((a) => a.type === "repeat_exclusions");
    expect(repeat).toHaveLength(1);
    expect(repeat[0].severity).toBe("high");
  });

  it("flags child views not obtained as high", () => {
    const rows = [makeRow({ child_views_obtained: false })];
    const alerts = computeAlerts(rows);
    const missing = alerts.filter((a) => a.type === "child_views_missing");
    expect(missing).toHaveLength(1);
    expect(missing[0].severity).toBe("high");
  });

  it("flags low education hours in alt provision as high", () => {
    const rows = [makeRow({ alternative_provision_arranged: true, education_hours_per_week: 10 })];
    const alerts = computeAlerts(rows);
    const lowHrs = alerts.filter((a) => a.type === "low_education_hours");
    expect(lowHrs).toHaveLength(1);
    expect(lowHrs[0].severity).toBe("high");
  });
});

// -- validateSchoolExclusion --------------------------------------------------

describe("validateSchoolExclusion", () => {
  it("passes with valid complete input", () => {
    const r = validateSchoolExclusion({
      childName: "Alex",
      exclusionDate: "2026-05-01",
      recordedBy: "staff-1",
      exclusionType: "Fixed-Term Exclusion",
      reasonGiven: "Disruptive behaviour",
      schoolName: "Oakwood Academy",
      virtualSchoolHeadNotified: true,
      socialWorkerInformed: true,
      childViewsObtained: true,
      status: "Active",
    });
    expect(r.valid).toBe(true);
    expect(r.errors).toHaveLength(0);
  });

  it("fails when required fields are missing", () => {
    const r = validateSchoolExclusion({});
    expect(r.valid).toBe(false);
    expect(r.errors.length).toBeGreaterThan(0);
    expect(r.errors.some((e) => e.includes("Child name"))).toBe(true);
    expect(r.errors.some((e) => e.includes("Exclusion date"))).toBe(true);
  });

  it("flags VSH not notified with detailed warning", () => {
    const r = validateSchoolExclusion({
      childName: "Alex",
      exclusionDate: "2026-05-01",
      recordedBy: "staff-1",
      exclusionType: "Fixed-Term Exclusion",
      reasonGiven: "Disruptive behaviour",
      schoolName: "Oakwood",
      virtualSchoolHeadNotified: false,
      socialWorkerInformed: true,
      childViewsObtained: true,
    });
    expect(r.errors.some((e) => e.includes("Virtual School Head"))).toBe(true);
  });

  it("flags informal/illegal exclusion type", () => {
    const r = validateSchoolExclusion({
      childName: "Alex",
      exclusionDate: "2026-05-01",
      recordedBy: "staff-1",
      exclusionType: "Informal/Illegal Exclusion",
      reasonGiven: "Sent home",
      schoolName: "Oakwood",
      virtualSchoolHeadNotified: true,
      socialWorkerInformed: true,
      childViewsObtained: true,
    });
    expect(r.errors.some((e) => e.toLowerCase().includes("informal"))).toBe(true);
  });

  it("rejects negative duration days", () => {
    const r = validateSchoolExclusion({
      childName: "Alex",
      exclusionDate: "2026-05-01",
      recordedBy: "staff-1",
      exclusionType: "Fixed-Term Exclusion",
      reasonGiven: "Disruption",
      schoolName: "Oakwood",
      virtualSchoolHeadNotified: true,
      socialWorkerInformed: true,
      childViewsObtained: true,
      durationDays: -1,
    });
    expect(r.errors.some((e) => e.includes("Duration days cannot be negative"))).toBe(true);
  });
});
