import { describe, it, expect } from "vitest";
import {
  computeStaffDebriefMetrics,
  identifyStaffDebriefAlerts,
} from "./staff-debrief-support-service";
import type { StaffDebriefSupportRecord } from "./staff-debrief-support-service";

// -- Factory -------------------------------------------------------------------

function makeRecord(overrides: Partial<StaffDebriefSupportRecord> = {}): StaffDebriefSupportRecord {
  return {
    id: "rec-1",
    home_id: "home-1",
    debrief_type: "post_incident",
    incident_severity: "medium",
    staff_impact: "mildly_affected",
    support_outcome: "fully_supported",
    debrief_date: "2026-05-18",
    staff_name: "David Clarke",
    facilitated_by: "Senior Worker",
    timely_debrief: true,
    safe_space_provided: true,
    confidentiality_assured: true,
    emotional_support_offered: true,
    learning_captured: true,
    action_plan_agreed: true,
    follow_up_scheduled: true,
    supervision_linked: true,
    occupational_health_considered: false,
    eap_signposted: false,
    peer_support_offered: true,
    recorded_promptly: true,
    issues_found: [],
    actions_taken: [],
    debrief_duration_minutes: 30,
    next_review_date: null,
    notes: null,
    created_at: "2026-05-18T00:00:00Z",
    updated_at: "2026-05-18T00:00:00Z",
    ...overrides,
  };
}

// -- computeStaffDebriefMetrics ------------------------------------------------

describe("computeStaffDebriefMetrics", () => {
  it("returns zeroes for empty records", () => {
    const m = computeStaffDebriefMetrics([]);
    expect(m.total_debriefs).toBe(0);
    expect(m.critical_severity_count).toBe(0);
    expect(m.significantly_affected_count).toBe(0);
    expect(m.further_support_count).toBe(0);
    expect(m.declined_support_count).toBe(0);
    expect(m.timely_debrief_rate).toBeNull();;
    expect(m.safe_space_rate).toBeNull();;
    expect(m.emotional_support_rate).toBeNull();;
    expect(m.learning_captured_rate).toBeNull();;
    expect(m.average_duration).toBeNull();;
    expect(m.unique_staff).toBe(0);
  });

  it("counts severity and impact categories correctly", () => {
    const records = [
      makeRecord({ id: "1", incident_severity: "critical" }),
      makeRecord({ id: "2", staff_impact: "significantly_affected" }),
      makeRecord({ id: "3", support_outcome: "further_support_needed" }),
      makeRecord({ id: "4", support_outcome: "declined_support" }),
    ];
    const m = computeStaffDebriefMetrics(records);
    expect(m.critical_severity_count).toBe(1);
    expect(m.significantly_affected_count).toBe(1);
    expect(m.further_support_count).toBe(1);
    expect(m.declined_support_count).toBe(1);
  });

  it("calculates boolean rates correctly", () => {
    const records = [
      makeRecord({ id: "1", timely_debrief: true, safe_space_provided: true }),
      makeRecord({ id: "2", timely_debrief: false, safe_space_provided: false }),
    ];
    const m = computeStaffDebriefMetrics(records);
    expect(m.timely_debrief_rate).toBe(50);
    expect(m.safe_space_rate).toBe(50);
  });

  it("calculates average_duration correctly", () => {
    const records = [
      makeRecord({ id: "1", debrief_duration_minutes: 20 }),
      makeRecord({ id: "2", debrief_duration_minutes: 40 }),
    ];
    const m = computeStaffDebriefMetrics(records);
    expect(m.average_duration).toBe(30);
  });

  it("builds breakdown records", () => {
    const records = [
      makeRecord({ id: "1", debrief_type: "post_incident", incident_severity: "high" }),
      makeRecord({ id: "2", debrief_type: "post_incident", incident_severity: "low" }),
      makeRecord({ id: "3", debrief_type: "post_restraint", incident_severity: "high" }),
    ];
    const m = computeStaffDebriefMetrics(records);
    expect(m.by_debrief_type).toEqual({ post_incident: 2, post_restraint: 1 });
    expect(m.by_incident_severity).toEqual({ high: 2, low: 1 });
  });

  it("counts unique staff", () => {
    const records = [
      makeRecord({ id: "1", staff_name: "Alice" }),
      makeRecord({ id: "2", staff_name: "Alice" }),
      makeRecord({ id: "3", staff_name: "Bob" }),
    ];
    const m = computeStaffDebriefMetrics(records);
    expect(m.unique_staff).toBe(2);
  });
});

// -- identifyStaffDebriefAlerts ------------------------------------------------

describe("identifyStaffDebriefAlerts", () => {
  it("returns empty array for empty records", () => {
    expect(identifyStaffDebriefAlerts([])).toEqual([]);
  });

  it("returns empty array for safe records", () => {
    expect(identifyStaffDebriefAlerts([makeRecord()])).toEqual([]);
  });

  it("fires critical alert for significantly_affected without follow-up", () => {
    const records = [makeRecord({ staff_impact: "significantly_affected", follow_up_scheduled: false })];
    const alerts = identifyStaffDebriefAlerts(records);
    const match = alerts.find((a) => a.type === "significantly_affected_no_followup");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("critical");
  });

  it("does NOT fire significantly_affected_no_followup when follow_up is true", () => {
    const records = [makeRecord({ staff_impact: "significantly_affected", follow_up_scheduled: true })];
    const alerts = identifyStaffDebriefAlerts(records);
    const match = alerts.find((a) => a.type === "significantly_affected_no_followup");
    expect(match).toBeUndefined();
  });

  it("fires high alert for not_timely (threshold >= 1)", () => {
    const records = [makeRecord({ timely_debrief: false })];
    const alerts = identifyStaffDebriefAlerts(records);
    const match = alerts.find((a) => a.type === "not_timely");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("high");
  });

  it("fires high alert for learning_not_captured (threshold >= 1)", () => {
    const records = [makeRecord({ learning_captured: false })];
    const alerts = identifyStaffDebriefAlerts(records);
    const match = alerts.find((a) => a.type === "learning_not_captured");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("high");
  });

  it("fires medium alert for no_emotional_support (threshold >= 2)", () => {
    const records = [
      makeRecord({ id: "1", emotional_support_offered: false }),
      makeRecord({ id: "2", emotional_support_offered: false }),
    ];
    const alerts = identifyStaffDebriefAlerts(records);
    const match = alerts.find((a) => a.type === "no_emotional_support");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("medium");
  });

  it("does NOT fire no_emotional_support with only 1 record", () => {
    const records = [makeRecord({ emotional_support_offered: false })];
    const alerts = identifyStaffDebriefAlerts(records);
    const match = alerts.find((a) => a.type === "no_emotional_support");
    expect(match).toBeUndefined();
  });

  it("fires medium alert for no_safe_space (threshold >= 2)", () => {
    const records = [
      makeRecord({ id: "1", safe_space_provided: false }),
      makeRecord({ id: "2", safe_space_provided: false }),
    ];
    const alerts = identifyStaffDebriefAlerts(records);
    const match = alerts.find((a) => a.type === "no_safe_space");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("medium");
  });
});
