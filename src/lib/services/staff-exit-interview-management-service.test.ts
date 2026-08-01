import { describe, it, expect } from "vitest";
import {
  computeMetrics,
  computeAlerts,
} from "./staff-exit-interview-management-service";
import type { StaffExitInterviewRow } from "./staff-exit-interview-management-service";

// -- Factory -------------------------------------------------------------------

function makeRow(overrides: Partial<StaffExitInterviewRow> = {}): StaffExitInterviewRow {
  return {
    id: "ei-1",
    home_id: "home-1",
    interview_date: "2026-05-01",
    interviewer_name: "Manager A",
    staff_name: "Jane Smith",
    departure_reason: "Resignation",
    departure_date: "2026-05-15",
    notice_period_met: true,
    knowledge_transfer_completed: true,
    handover_document_provided: true,
    equipment_returned: true,
    access_revoked: true,
    final_pay_confirmed: true,
    reference_agreed: true,
    satisfaction_rating: 4,
    would_recommend: true,
    compliance_status: "Complete",
    notes: null,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

// -- computeMetrics -----------------------------------------------------------

describe("computeMetrics", () => {
  it("returns zeroes for empty array", () => {
    const m = computeMetrics([]);
    expect(m.total_interviews).toBe(0);
    expect(m.complete_count).toBe(0);
    expect(m.incomplete_count).toBe(0);
    expect(m.overdue_count).toBe(0);
    expect(m.knowledge_transfer_rate).toBeNull();; expect(m.avg_satisfaction).toBeNull();; expect(m.would_recommend_rate).toBeNull();; expect(m.unique_staff).toBe(0);
    expect(m.unique_interviewers).toBe(0);
  });

  it("counts compliance statuses correctly", () => {
    const rows = [
      makeRow({ id: "1", compliance_status: "Complete" }),
      makeRow({ id: "2", compliance_status: "Incomplete" }),
      makeRow({ id: "3", compliance_status: "Overdue" }),
      makeRow({ id: "4", compliance_status: "Pending" }),
    ];
    const m = computeMetrics(rows);
    expect(m.complete_count).toBe(1);
    expect(m.incomplete_count).toBe(1);
    expect(m.overdue_count).toBe(1);
  });

  it("computes boolean rates correctly", () => {
    const rows = [
      makeRow({ id: "1", knowledge_transfer_completed: true, equipment_returned: true }),
      makeRow({ id: "2", knowledge_transfer_completed: false, equipment_returned: false }),
    ];
    const m = computeMetrics(rows);
    expect(m.knowledge_transfer_rate).toBe(50);
    expect(m.equipment_return_rate).toBe(50);
  });

  it("computes average satisfaction from non-null ratings", () => {
    const rows = [
      makeRow({ id: "1", satisfaction_rating: 3 }),
      makeRow({ id: "2", satisfaction_rating: 5 }),
      makeRow({ id: "3", satisfaction_rating: null }),
    ];
    const m = computeMetrics(rows);
    expect(m.avg_satisfaction).toBe(4);
  });

  it("computes would_recommend_rate from non-null values only", () => {
    const rows = [
      makeRow({ id: "1", would_recommend: true }),
      makeRow({ id: "2", would_recommend: false }),
      makeRow({ id: "3", would_recommend: null }),
    ];
    const m = computeMetrics(rows);
    expect(m.would_recommend_rate).toBe(50);
  });

  it("counts unique staff and interviewers", () => {
    const rows = [
      makeRow({ id: "1", staff_name: "Alice", interviewer_name: "Mgr A" }),
      makeRow({ id: "2", staff_name: "Bob", interviewer_name: "Mgr A" }),
      makeRow({ id: "3", staff_name: "Alice", interviewer_name: "Mgr B" }),
    ];
    const m = computeMetrics(rows);
    expect(m.unique_staff).toBe(2);
    expect(m.unique_interviewers).toBe(2);
  });
});

// -- computeAlerts ------------------------------------------------------------

describe("computeAlerts", () => {
  it("returns empty alerts for empty array", () => {
    expect(computeAlerts([])).toEqual([]);
  });

  it("returns empty alerts when all records fully compliant", () => {
    expect(computeAlerts([makeRow()])).toEqual([]);
  });

  it("fires critical alert when access not revoked", () => {
    const rows = [makeRow({ id: "ei-x", access_revoked: false })];
    const alerts = computeAlerts(rows);
    const found = alerts.filter((a) => a.type === "access_not_revoked");
    expect(found).toHaveLength(1);
    expect(found[0].severity).toBe("critical");
    expect(found[0].record_id).toBe("ei-x");
  });

  it("fires high alert for overdue interview", () => {
    const rows = [makeRow({ id: "ei-o", compliance_status: "Overdue" })];
    const alerts = computeAlerts(rows);
    const found = alerts.filter((a) => a.type === "overdue_interview");
    expect(found).toHaveLength(1);
    expect(found[0].severity).toBe("high");
  });

  it("fires high alert when equipment not returned", () => {
    const rows = [makeRow({ id: "ei-e", equipment_returned: false })];
    const alerts = computeAlerts(rows);
    const found = alerts.filter((a) => a.type === "equipment_not_returned");
    expect(found).toHaveLength(1);
    expect(found[0].severity).toBe("high");
  });

  it("fires medium alert when knowledge transfer not completed", () => {
    const rows = [makeRow({ id: "ei-k", knowledge_transfer_completed: false })];
    const alerts = computeAlerts(rows);
    const found = alerts.filter((a) => a.type === "knowledge_transfer_incomplete");
    expect(found).toHaveLength(1);
    expect(found[0].severity).toBe("medium");
  });
});
