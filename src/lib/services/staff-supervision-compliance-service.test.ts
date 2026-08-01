import { describe, it, expect } from "vitest";
import {
  computeStaffSupervisionComplianceMetrics,
  identifyStaffSupervisionComplianceAlerts,
} from "./staff-supervision-compliance-service";
import type { StaffSupervisionComplianceRecord } from "./staff-supervision-compliance-service";

// -- Factory ------------------------------------------------------------------

function makeRecord(overrides: Partial<StaffSupervisionComplianceRecord> = {}): StaffSupervisionComplianceRecord {
  return {
    id: "sc-1",
    home_id: "home-1",
    supervision_type: "formal_one_to_one",
    frequency_compliance: "on_schedule",
    quality_rating: "good",
    action_completion: "all_complete",
    supervision_date: "2026-04-15",
    staff_name: "Laura James",
    supervisor_name: "Senior A",
    agenda_prepared: true,
    safeguarding_discussed: true,
    wellbeing_discussed: true,
    training_needs_reviewed: true,
    actions_agreed: true,
    previous_actions_reviewed: true,
    professional_development_planned: true,
    concerns_raised: false,
    confidentiality_maintained: true,
    notes_shared: true,
    manager_oversight: true,
    recorded_promptly: true,
    supervision_duration_minutes: 60,
    issues_found: [],
    actions_taken: [],
    next_review_date: null,
    notes: null,
    created_at: "2026-04-01T00:00:00Z",
    updated_at: "2026-04-01T00:00:00Z",
    ...overrides,
  };
}

// -- computeStaffSupervisionComplianceMetrics ---------------------------------

describe("computeStaffSupervisionComplianceMetrics", () => {
  it("returns zeroes for empty records", () => {
    const m = computeStaffSupervisionComplianceMetrics([]);
    expect(m.total_supervisions).toBe(0);
    expect(m.overdue_count).toBe(0);
    expect(m.missed_count).toBe(0);
    expect(m.poor_quality_count).toBe(0);
    expect(m.not_started_count).toBe(0);
    expect(m.agenda_prepared_rate).toBeNull();;
    expect(m.average_duration).toBeNull();;
    expect(m.unique_staff).toBe(0);
  });

  it("counts overdue, missed, poor quality, not started", () => {
    const records = [
      makeRecord({ id: "1", frequency_compliance: "significantly_overdue" }),
      makeRecord({ id: "2", frequency_compliance: "missed" }),
      makeRecord({ id: "3", quality_rating: "poor" }),
      makeRecord({ id: "4", action_completion: "not_started" }),
    ];
    const m = computeStaffSupervisionComplianceMetrics(records);
    expect(m.overdue_count).toBe(1);
    expect(m.missed_count).toBe(1);
    expect(m.poor_quality_count).toBe(1);
    expect(m.not_started_count).toBe(1);
  });

  it("computes boolean rates correctly", () => {
    const records = [
      makeRecord({ id: "1", agenda_prepared: true, safeguarding_discussed: false }),
      makeRecord({ id: "2", agenda_prepared: false, safeguarding_discussed: false }),
    ];
    const m = computeStaffSupervisionComplianceMetrics(records);
    expect(m.agenda_prepared_rate).toBe(50);
    expect(m.safeguarding_discussed_rate).toBe(0);
  });

  it("computes average duration", () => {
    const records = [
      makeRecord({ id: "1", supervision_duration_minutes: 45 }),
      makeRecord({ id: "2", supervision_duration_minutes: 75 }),
    ];
    const m = computeStaffSupervisionComplianceMetrics(records);
    expect(m.average_duration).toBe(60);
  });

  it("builds breakdown records", () => {
    const records = [
      makeRecord({ id: "1", supervision_type: "formal_one_to_one", frequency_compliance: "on_schedule", quality_rating: "good", action_completion: "all_complete" }),
      makeRecord({ id: "2", supervision_type: "group_supervision", frequency_compliance: "missed", quality_rating: "poor", action_completion: "not_started" }),
    ];
    const m = computeStaffSupervisionComplianceMetrics(records);
    expect(m.by_supervision_type).toEqual({ formal_one_to_one: 1, group_supervision: 1 });
    expect(m.by_frequency_compliance).toEqual({ on_schedule: 1, missed: 1 });
    expect(m.by_quality_rating).toEqual({ good: 1, poor: 1 });
    expect(m.by_action_completion).toEqual({ all_complete: 1, not_started: 1 });
  });
});

// -- identifyStaffSupervisionComplianceAlerts ---------------------------------

describe("identifyStaffSupervisionComplianceAlerts", () => {
  it("returns empty array for empty records", () => {
    expect(identifyStaffSupervisionComplianceAlerts([])).toEqual([]);
  });

  it("fires critical alert for missed supervision with concerns raised", () => {
    const records = [makeRecord({ frequency_compliance: "missed", concerns_raised: true })];
    const alerts = identifyStaffSupervisionComplianceAlerts(records);
    const critical = alerts.filter((a) => a.type === "missed_with_concerns");
    expect(critical).toHaveLength(1);
    expect(critical[0].severity).toBe("critical");
  });

  it("does NOT fire critical alert for missed without concerns", () => {
    const records = [makeRecord({ frequency_compliance: "missed", concerns_raised: false })];
    const alerts = identifyStaffSupervisionComplianceAlerts(records);
    expect(alerts.filter((a) => a.type === "missed_with_concerns")).toHaveLength(0);
  });

  it("fires high alert for significantly overdue or missed (>= 1)", () => {
    const records = [makeRecord({ frequency_compliance: "significantly_overdue" })];
    const alerts = identifyStaffSupervisionComplianceAlerts(records);
    expect(alerts.some((a) => a.type === "supervision_overdue" && a.severity === "high")).toBe(true);
  });

  it("fires high alert for safeguarding not discussed (>= 1)", () => {
    const records = [makeRecord({ safeguarding_discussed: false })];
    const alerts = identifyStaffSupervisionComplianceAlerts(records);
    expect(alerts.some((a) => a.type === "safeguarding_not_discussed" && a.severity === "high")).toBe(true);
  });

  it("fires medium alert for previous actions not reviewed (>= 2)", () => {
    const records = [
      makeRecord({ id: "1", previous_actions_reviewed: false }),
      makeRecord({ id: "2", previous_actions_reviewed: false }),
    ];
    const alerts = identifyStaffSupervisionComplianceAlerts(records);
    expect(alerts.some((a) => a.type === "actions_not_reviewed" && a.severity === "medium")).toBe(true);
  });

  it("does NOT fire actions_not_reviewed at 1 record", () => {
    const records = [makeRecord({ previous_actions_reviewed: false })];
    const alerts = identifyStaffSupervisionComplianceAlerts(records);
    expect(alerts.some((a) => a.type === "actions_not_reviewed")).toBe(false);
  });

  it("fires medium alert for training not reviewed (>= 2)", () => {
    const records = [
      makeRecord({ id: "1", training_needs_reviewed: false }),
      makeRecord({ id: "2", training_needs_reviewed: false }),
    ];
    const alerts = identifyStaffSupervisionComplianceAlerts(records);
    expect(alerts.some((a) => a.type === "training_not_reviewed" && a.severity === "medium")).toBe(true);
  });
});
