import { describe, it, expect } from "vitest";
import {
  computeStaffHandoverNotesMetrics,
  identifyStaffHandoverNotesAlerts,
} from "./staff-handover-notes-service";
import type { StaffHandoverNotesRecord } from "./staff-handover-notes-service";

// -- Factory -------------------------------------------------------------------

function makeRecord(overrides: Partial<StaffHandoverNotesRecord> = {}): StaffHandoverNotesRecord {
  return {
    id: "hn-1",
    home_id: "home-1",
    note_category: "child_update",
    note_priority: "medium",
    note_status: "actioned",
    shift_type: "day_to_night",
    handover_date: "2026-05-20",
    outgoing_staff: "Staff A",
    incoming_staff: "Staff B",
    child_specific: true,
    medication_related: false,
    safeguarding_related: false,
    task_completed: true,
    follow_up_required: false,
    follow_up_completed: false,
    acknowledged_by_incoming: true,
    manager_informed: true,
    time_sensitive: false,
    verbal_handover_given: true,
    written_record_complete: true,
    risk_related: false,
    social_worker_update: false,
    issues_found: [],
    actions_taken: [],
    child_name: "Alex",
    notes: null,
    created_at: "2026-05-20T00:00:00Z",
    updated_at: "2026-05-20T00:00:00Z",
    ...overrides,
  };
}

// -- computeStaffHandoverNotesMetrics -----------------------------------------

describe("computeStaffHandoverNotesMetrics", () => {
  it("returns zeroes for empty array", () => {
    const m = computeStaffHandoverNotesMetrics([]);
    expect(m.total_notes).toBe(0);
    expect(m.critical_count).toBe(0);
    expect(m.high_count).toBe(0);
    expect(m.escalated_count).toBe(0);
    expect(m.pending_count).toBe(0);
    expect(m.child_specific_rate).toBeNull();;
    expect(m.follow_up_required_count).toBe(0);
    expect(m.follow_up_completed_rate).toBeNull();;
  });

  it("counts priority and status correctly", () => {
    const records = [
      makeRecord({ id: "1", note_priority: "critical", note_status: "pending" }),
      makeRecord({ id: "2", note_priority: "high", note_status: "escalated" }),
      makeRecord({ id: "3", note_priority: "medium", note_status: "pending" }),
    ];
    const m = computeStaffHandoverNotesMetrics(records);
    expect(m.critical_count).toBe(1);
    expect(m.high_count).toBe(1);
    expect(m.escalated_count).toBe(1);
    expect(m.pending_count).toBe(2);
  });

  it("computes boolean rates correctly", () => {
    const records = [
      makeRecord({ id: "1", child_specific: true, medication_related: true }),
      makeRecord({ id: "2", child_specific: false, medication_related: false }),
    ];
    const m = computeStaffHandoverNotesMetrics(records);
    expect(m.child_specific_rate).toBe(50);
    expect(m.medication_related_rate).toBe(50);
  });

  it("computes follow-up completed rate only among follow-up-required records", () => {
    const records = [
      makeRecord({ id: "1", follow_up_required: true, follow_up_completed: true }),
      makeRecord({ id: "2", follow_up_required: true, follow_up_completed: false }),
      makeRecord({ id: "3", follow_up_required: false, follow_up_completed: false }),
    ];
    const m = computeStaffHandoverNotesMetrics(records);
    expect(m.follow_up_required_count).toBe(2);
    expect(m.follow_up_completed_rate).toBe(50);
  });

  it("returns 0 follow_up_completed_rate when no follow-ups required", () => {
    const records = [makeRecord({ id: "1", follow_up_required: false })];
    const m = computeStaffHandoverNotesMetrics(records);
    expect(m.follow_up_completed_rate).toBeNull();;
  });

  it("builds breakdown maps", () => {
    const records = [
      makeRecord({ id: "1", note_category: "child_update", shift_type: "day_to_night" }),
      makeRecord({ id: "2", note_category: "medication_reminder", shift_type: "day_to_night" }),
      makeRecord({ id: "3", note_category: "child_update", shift_type: "night_to_day" }),
    ];
    const m = computeStaffHandoverNotesMetrics(records);
    expect(m.by_note_category).toEqual({ child_update: 2, medication_reminder: 1 });
    expect(m.by_shift_type).toEqual({ day_to_night: 2, night_to_day: 1 });
  });
});

// -- identifyStaffHandoverNotesAlerts -----------------------------------------

describe("identifyStaffHandoverNotesAlerts", () => {
  it("returns empty alerts for empty array", () => {
    expect(identifyStaffHandoverNotesAlerts([])).toEqual([]);
  });

  it("returns empty alerts when all records compliant", () => {
    expect(identifyStaffHandoverNotesAlerts([makeRecord()])).toEqual([]);
  });

  it("fires critical alert for critical safeguarding note still pending", () => {
    const records = [
      makeRecord({ id: "hn-x", note_priority: "critical", safeguarding_related: true, note_status: "pending" }),
    ];
    const alerts = identifyStaffHandoverNotesAlerts(records);
    const found = alerts.filter((a) => a.type === "critical_safeguarding_pending");
    expect(found).toHaveLength(1);
    expect(found[0].severity).toBe("critical");
  });

  it("fires high alert when >= 1 note not acknowledged by incoming", () => {
    const records = [makeRecord({ id: "1", acknowledged_by_incoming: false })];
    const alerts = identifyStaffHandoverNotesAlerts(records);
    expect(alerts.filter((a) => a.type === "not_acknowledged")).toHaveLength(1);
  });

  it("fires high alert when >= 1 follow-up required but not completed", () => {
    const records = [makeRecord({ id: "1", follow_up_required: true, follow_up_completed: false })];
    const alerts = identifyStaffHandoverNotesAlerts(records);
    expect(alerts.filter((a) => a.type === "follow_up_overdue")).toHaveLength(1);
  });

  it("fires medium alert when >= 2 notes without written record", () => {
    const one = [makeRecord({ id: "1", written_record_complete: false })];
    expect(identifyStaffHandoverNotesAlerts(one).filter((a) => a.type === "no_written_record")).toHaveLength(0);

    const two = [
      makeRecord({ id: "1", written_record_complete: false }),
      makeRecord({ id: "2", written_record_complete: false }),
    ];
    expect(identifyStaffHandoverNotesAlerts(two).filter((a) => a.type === "no_written_record")).toHaveLength(1);
  });

  it("fires medium alert when >= 3 notes without verbal handover", () => {
    const two = [
      makeRecord({ id: "1", verbal_handover_given: false }),
      makeRecord({ id: "2", verbal_handover_given: false }),
    ];
    expect(identifyStaffHandoverNotesAlerts(two).filter((a) => a.type === "no_verbal_handover")).toHaveLength(0);

    const three = [
      makeRecord({ id: "1", verbal_handover_given: false }),
      makeRecord({ id: "2", verbal_handover_given: false }),
      makeRecord({ id: "3", verbal_handover_given: false }),
    ];
    expect(identifyStaffHandoverNotesAlerts(three).filter((a) => a.type === "no_verbal_handover")).toHaveLength(1);
  });
});
