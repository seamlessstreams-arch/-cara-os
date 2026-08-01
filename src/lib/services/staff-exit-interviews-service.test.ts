import { describe, it, expect } from "vitest";
import {
  computeExitInterviewMetrics,
  identifyExitInterviewAlerts,
} from "./staff-exit-interviews-service";
import type { StaffExitRecord } from "./staff-exit-interviews-service";

// -- Factory -------------------------------------------------------------------

function makeRecord(overrides: Partial<StaffExitRecord> = {}): StaffExitRecord {
  return {
    id: "ex-1",
    home_id: "home-1",
    staff_name: "Alice Brown",
    role: "Residential Worker",
    leaving_date: "2026-05-15",
    interview_date: "2026-05-10",
    leaving_reason: "career_progression",
    satisfaction_rating: "satisfied",
    handover_status: "completed",
    rehire_recommendation: "yes",
    length_of_service_months: 24,
    would_recommend_employer: true,
    felt_supported: true,
    adequate_training: true,
    safeguarding_debrief_completed: true,
    keys_returned: true,
    access_revoked: true,
    dbs_notification_sent: true,
    children_informed: true,
    children_supported_through_transition: true,
    feedback_themes: ["supportive team"],
    improvements_suggested: [],
    interviewed_by: "Senior Manager",
    notes: null,
    created_at: "2026-05-10T00:00:00Z",
    updated_at: "2026-05-10T00:00:00Z",
    ...overrides,
  };
}

// -- computeExitInterviewMetrics ----------------------------------------------

describe("computeExitInterviewMetrics", () => {
  it("returns zeroes for empty array", () => {
    const m = computeExitInterviewMetrics([]);
    expect(m.total_exits).toBe(0);
    expect(m.career_progression_count).toBe(0);
    expect(m.burnout_count).toBe(0);
    expect(m.very_satisfied_rate).toBeNull();;
    expect(m.handover_completed_rate).toBeNull();;
    expect(m.average_service_months).toBeNull();;
    expect(m.rehire_yes_rate).toBeNull();;
  });

  it("counts leaving reasons correctly", () => {
    const records = [
      makeRecord({ id: "1", leaving_reason: "career_progression" }),
      makeRecord({ id: "2", leaving_reason: "burnout" }),
      makeRecord({ id: "3", leaving_reason: "management_issues" }),
      makeRecord({ id: "4", leaving_reason: "dismissal" }),
    ];
    const m = computeExitInterviewMetrics(records);
    expect(m.career_progression_count).toBe(1);
    expect(m.burnout_count).toBe(1);
    expect(m.management_issues_count).toBe(1);
    expect(m.dismissal_count).toBe(1);
  });

  it("computes satisfaction counts and rates", () => {
    const records = [
      makeRecord({ id: "1", satisfaction_rating: "very_satisfied" }),
      makeRecord({ id: "2", satisfaction_rating: "dissatisfied" }),
      makeRecord({ id: "3", satisfaction_rating: "very_dissatisfied" }),
    ];
    const m = computeExitInterviewMetrics(records);
    expect(m.very_satisfied_rate).toBe(33.3);
    expect(m.dissatisfied_count).toBe(1);
    expect(m.very_dissatisfied_count).toBe(1);
  });

  it("computes handover rates and counts", () => {
    const records = [
      makeRecord({ id: "1", handover_status: "completed" }),
      makeRecord({ id: "2", handover_status: "not_started" }),
      makeRecord({ id: "3", handover_status: "partial" }),
    ];
    const m = computeExitInterviewMetrics(records);
    expect(m.handover_completed_rate).toBe(33.3);
    expect(m.handover_not_started_count).toBe(1);
  });

  it("computes average service months", () => {
    const records = [
      makeRecord({ id: "1", length_of_service_months: 12 }),
      makeRecord({ id: "2", length_of_service_months: 36 }),
    ];
    const m = computeExitInterviewMetrics(records);
    expect(m.average_service_months).toBe(24);
  });

  it("computes boolean rates correctly", () => {
    const records = [
      makeRecord({ id: "1", would_recommend_employer: true, felt_supported: true }),
      makeRecord({ id: "2", would_recommend_employer: false, felt_supported: false }),
    ];
    const m = computeExitInterviewMetrics(records);
    expect(m.would_recommend_rate).toBe(50);
    expect(m.felt_supported_rate).toBe(50);
  });

  it("builds breakdown maps", () => {
    const records = [
      makeRecord({ id: "1", leaving_reason: "burnout", satisfaction_rating: "dissatisfied" }),
      makeRecord({ id: "2", leaving_reason: "burnout", satisfaction_rating: "satisfied" }),
    ];
    const m = computeExitInterviewMetrics(records);
    expect(m.by_leaving_reason).toEqual({ burnout: 2 });
    expect(m.by_satisfaction_rating).toEqual({ dissatisfied: 1, satisfied: 1 });
  });
});

// -- identifyExitInterviewAlerts -----------------------------------------------

describe("identifyExitInterviewAlerts", () => {
  it("returns empty alerts for empty array", () => {
    expect(identifyExitInterviewAlerts([])).toEqual([]);
  });

  it("returns empty alerts when all records fully compliant", () => {
    expect(identifyExitInterviewAlerts([makeRecord()])).toEqual([]);
  });

  it("fires critical alert for each record without safeguarding debrief", () => {
    const records = [
      makeRecord({ id: "ex-1", safeguarding_debrief_completed: false, staff_name: "Tom" }),
    ];
    const alerts = identifyExitInterviewAlerts(records);
    const found = alerts.filter((a) => a.type === "no_safeguarding_debrief");
    expect(found).toHaveLength(1);
    expect(found[0].severity).toBe("critical");
  });

  it("fires high alert when >= 1 staff have access not revoked", () => {
    const records = [makeRecord({ id: "1", access_revoked: false })];
    const alerts = identifyExitInterviewAlerts(records);
    const found = alerts.filter((a) => a.type === "access_not_revoked");
    expect(found).toHaveLength(1);
    expect(found[0].severity).toBe("high");
  });

  it("fires high alert when >= 1 staff have keys not returned", () => {
    const records = [makeRecord({ id: "1", keys_returned: false })];
    const alerts = identifyExitInterviewAlerts(records);
    const found = alerts.filter((a) => a.type === "keys_not_returned");
    expect(found).toHaveLength(1);
    expect(found[0].severity).toBe("high");
  });

  it("fires high alert when >= 1 handover not started", () => {
    const records = [makeRecord({ id: "1", handover_status: "not_started" })];
    const alerts = identifyExitInterviewAlerts(records);
    const found = alerts.filter((a) => a.type === "handover_not_started");
    expect(found).toHaveLength(1);
    expect(found[0].severity).toBe("high");
  });

  it("fires medium alert when >= 1 children not informed", () => {
    const records = [makeRecord({ id: "1", children_informed: false })];
    const alerts = identifyExitInterviewAlerts(records);
    const found = alerts.filter((a) => a.type === "children_not_informed");
    expect(found).toHaveLength(1);
    expect(found[0].severity).toBe("medium");
  });
});
