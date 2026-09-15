import { describe, it, expect } from "vitest";
import {
  computeVolunteerMetrics,
  identifyVolunteerAlerts,
  type VolunteerRecord,
} from "./volunteer-management-service";

// ── Factory ────────────────────────────────────────────────────────────

function makeRecord(overrides: Partial<VolunteerRecord> = {}): VolunteerRecord {
  return {
    id: "rec-1",
    home_id: "home-1",
    volunteer_name: "Vol A",
    volunteer_role: "mentor",
    volunteer_status: "active",
    dbs_status: "clear",
    training_status: "up_to_date",
    supervision_frequency: "monthly",
    start_date: "2025-01-01",
    dbs_check_date: overrides.dbs_check_date ?? null,
    dbs_expiry_date: overrides.dbs_expiry_date ?? null,
    safeguarding_trained: true,
    first_aid_trained: true,
    health_safety_trained: true,
    data_protection_trained: true,
    lone_working_allowed: false,
    references_obtained: true,
    interview_completed: true,
    induction_completed: true,
    last_supervision_date: overrides.last_supervision_date ?? null,
    next_supervision_date: overrides.next_supervision_date ?? null,
    hours_this_month: 10,
    children_worked_with: ["Child A"],
    skills_offered: [],
    issues_found: [],
    actions_taken: [],
    managed_by: "Manager A",
    notes: overrides.notes ?? null,
    created_at: "2025-01-15T00:00:00Z",
    updated_at: "2025-01-15T00:00:00Z",
      ...overrides,
  };
}

// ── computeVolunteerMetrics ────────────────────────────────────────────

describe("computeVolunteerMetrics", () => {
  it("returns zeroes for empty array", () => {
    const m = computeVolunteerMetrics([]);
    expect(m.total_volunteers).toBe(0);
    expect(m.active_count).toBe(0);
    expect(m.pending_count).toBe(0);
    expect(m.suspended_count).toBe(0);
    expect(m.dbs_clear_rate).toBeNull();;
    expect(m.training_up_to_date_rate).toBeNull();;
    expect(m.total_hours).toBe(0);
    expect(m.average_hours).toBeNull();;
    expect(m.unique_children).toBe(0);
  });

  it("counts status categories", () => {
    const records = [
      makeRecord({ volunteer_status: "active" }),
      makeRecord({ volunteer_status: "active" }),
      makeRecord({ volunteer_status: "pending_checks" }),
      makeRecord({ volunteer_status: "suspended" }),
    ];
    const m = computeVolunteerMetrics(records);
    expect(m.active_count).toBe(2);
    expect(m.pending_count).toBe(1);
    expect(m.suspended_count).toBe(1);
  });

  it("computes DBS clear rate", () => {
    const records = [
      makeRecord({ dbs_status: "clear" }),
      makeRecord({ dbs_status: "expired" }),
    ];
    const m = computeVolunteerMetrics(records);
    expect(m.dbs_clear_rate).toBe(50);
    expect(m.dbs_expired_count).toBe(1);
  });

  it("computes training rates and overdue count", () => {
    const records = [
      makeRecord({ training_status: "up_to_date" }),
      makeRecord({ training_status: "overdue" }),
    ];
    const m = computeVolunteerMetrics(records);
    expect(m.training_up_to_date_rate).toBe(50);
    expect(m.training_overdue_count).toBe(1);
  });

  it("computes boolean rates for training types", () => {
    const records = [
      makeRecord({ safeguarding_trained: true, first_aid_trained: true }),
      makeRecord({ safeguarding_trained: false, first_aid_trained: false }),
    ];
    const m = computeVolunteerMetrics(records);
    expect(m.safeguarding_trained_rate).toBe(50);
    expect(m.first_aid_trained_rate).toBe(50);
  });

  it("sums hours and computes average", () => {
    const records = [
      makeRecord({ hours_this_month: 20 }),
      makeRecord({ hours_this_month: 10 }),
    ];
    const m = computeVolunteerMetrics(records);
    expect(m.total_hours).toBe(30);
    expect(m.average_hours).toBe(15);
  });

  it("counts unique children across all records", () => {
    const records = [
      makeRecord({ children_worked_with: ["Alice", "Bob"] }),
      makeRecord({ children_worked_with: ["Bob", "Charlie"] }),
    ];
    const m = computeVolunteerMetrics(records);
    expect(m.unique_children).toBe(3);
  });
});

// ── identifyVolunteerAlerts ────────────────────────────────────────────

describe("identifyVolunteerAlerts", () => {
  it("returns empty array for empty input", () => {
    expect(identifyVolunteerAlerts([])).toEqual([]);
  });

  it("fires critical alert for DBS barred", () => {
    const records = [makeRecord({ dbs_status: "barred" })];
    const alerts = identifyVolunteerAlerts(records);
    const match = alerts.find((a) => a.type === "dbs_barred");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("critical");
  });

  it("fires high alert for DBS expired (>= 1)", () => {
    const records = [makeRecord({ dbs_status: "expired" })];
    const alerts = identifyVolunteerAlerts(records);
    const match = alerts.find((a) => a.type === "dbs_expired");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("high");
  });

  it("fires high alert for training overdue (>= 1)", () => {
    const records = [makeRecord({ training_status: "overdue" })];
    const alerts = identifyVolunteerAlerts(records);
    const match = alerts.find((a) => a.type === "training_overdue");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("high");
  });

  it("fires high alert for active volunteer without safeguarding training (>= 1)", () => {
    const records = [makeRecord({ safeguarding_trained: false, volunteer_status: "active" })];
    const alerts = identifyVolunteerAlerts(records);
    const match = alerts.find((a) => a.type === "no_safeguarding");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("high");
  });

  it("fires medium alert for no references (>= 2, not departed)", () => {
    const records = [
      makeRecord({ references_obtained: false, volunteer_status: "active" }),
      makeRecord({ references_obtained: false, volunteer_status: "pending_checks" }),
    ];
    const alerts = identifyVolunteerAlerts(records);
    const match = alerts.find((a) => a.type === "no_references");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("medium");
  });

  it("does NOT fire no_references for departed volunteers", () => {
    const records = [
      makeRecord({ references_obtained: false, volunteer_status: "departed" }),
      makeRecord({ references_obtained: false, volunteer_status: "departed" }),
    ];
    const alerts = identifyVolunteerAlerts(records);
    expect(alerts.find((a) => a.type === "no_references")).toBeUndefined();
  });
});
