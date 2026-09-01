import { describe, it, expect } from "vitest";
import {
  computeCctvMetrics,
  identifyCctvAlerts,
  type CctvRecord,
} from "./cctv-surveillance-service";


/** Date string n days in the future — UTC throughout, so it never lands a day
 *  off across a DST boundary, and it floats with the clock so "still in the
 *  future" stays true whenever the suite runs. */
function daysFromNow(n: number): string {
  const [y, m, d] = new Date().toISOString().slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}
function makeRecord(overrides: Partial<CctvRecord> = {}): CctvRecord {
  return {
    id: "cctv-1",
    home_id: "home-1",
    event_type: "system_check",
    event_date: "2026-05-01",
    camera_location: "entrance",
    compliance_status: "compliant",
    retention_status: "within_schedule",
    gdpr_compliant: true,
    signage_visible: true,
    children_informed: true,
    staff_informed: true,
    footage_accessed: false,
    accessed_by: null,
    access_reason: null,
    privacy_impact_completed: true,
    data_protection_officer_consulted: false,
    issues_found: [],
    actions_taken: [],
    reviewed_by: "Manager Smith",
    next_review_date: daysFromNow(330),
    notes: null,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

describe("computeCctvMetrics", () => {
  it("returns zeroes for empty records", () => {
    const m = computeCctvMetrics([]);
    expect(m.total_records).toBe(0);
    expect(m.system_check_count).toBe(0);
    expect(m.data_breach_count).toBe(0);
    expect(m.compliant_rate).toBeNull();;
    expect(m.gdpr_compliant_rate).toBeNull();;
    expect(m.overdue_deletion_count).toBe(0);
  });

  it("counts event types correctly", () => {
    const records = [
      makeRecord({ id: "1", event_type: "system_check" }),
      makeRecord({ id: "2", event_type: "footage_review" }),
      makeRecord({ id: "3", event_type: "access_request" }),
      makeRecord({ id: "4", event_type: "data_breach" }),
    ];
    const m = computeCctvMetrics(records);
    expect(m.system_check_count).toBe(1);
    expect(m.footage_review_count).toBe(1);
    expect(m.access_request_count).toBe(1);
    expect(m.data_breach_count).toBe(1);
    expect(m.total_records).toBe(4);
  });

  it("calculates compliance and boolean rates", () => {
    const records = [
      makeRecord({ id: "1", compliance_status: "compliant", gdpr_compliant: true, signage_visible: true }),
      makeRecord({ id: "2", compliance_status: "non_compliant", gdpr_compliant: false, signage_visible: false }),
    ];
    const m = computeCctvMetrics(records);
    expect(m.compliant_rate).toBe(50);
    expect(m.non_compliant_count).toBe(1);
    expect(m.gdpr_compliant_rate).toBe(50);
    expect(m.signage_visible_rate).toBe(50);
  });

  it("counts overdue deletions and review overdue", () => {
    const records = [
      makeRecord({ id: "1", retention_status: "overdue_deletion" }),
      makeRecord({ id: "2", retention_status: "overdue_deletion" }),
      makeRecord({ id: "3", next_review_date: "2025-01-01" }), // overdue
    ];
    const m = computeCctvMetrics(records);
    expect(m.overdue_deletion_count).toBe(2);
    expect(m.review_overdue_count).toBe(1);
  });

  it("builds breakdown records correctly", () => {
    const records = [
      makeRecord({ id: "1", camera_location: "entrance" }),
      makeRecord({ id: "2", camera_location: "entrance" }),
      makeRecord({ id: "3", camera_location: "garden" }),
    ];
    const m = computeCctvMetrics(records);
    expect(m.by_camera_location["entrance"]).toBe(2);
    expect(m.by_camera_location["garden"]).toBe(1);
  });
});

describe("identifyCctvAlerts", () => {
  it("returns no alerts for empty records", () => {
    expect(identifyCctvAlerts([])).toEqual([]);
  });

  it("fires critical alert for data breaches", () => {
    const records = [makeRecord({ event_type: "data_breach" })];
    const alerts = identifyCctvAlerts(records);
    const breach = alerts.filter((a) => a.type === "data_breach");
    expect(breach.length).toBe(1);
    expect(breach[0].severity).toBe("critical");
  });

  it("fires high alert for non-compliant records", () => {
    const records = [makeRecord({ compliance_status: "non_compliant" })];
    const alerts = identifyCctvAlerts(records);
    const nc = alerts.filter((a) => a.type === "non_compliant");
    expect(nc.length).toBe(1);
    expect(nc[0].severity).toBe("high");
  });

  it("fires high alert for overdue deletion >= 1", () => {
    const records = [makeRecord({ retention_status: "overdue_deletion" })];
    const alerts = identifyCctvAlerts(records);
    const od = alerts.filter((a) => a.type === "overdue_deletion");
    expect(od.length).toBe(1);
    expect(od[0].severity).toBe("high");
  });

  it("fires medium alert for children not informed >= 2", () => {
    const records = [
      makeRecord({ id: "1", children_informed: false }),
      makeRecord({ id: "2", children_informed: false }),
    ];
    const alerts = identifyCctvAlerts(records);
    const ni = alerts.filter((a) => a.type === "children_not_informed");
    expect(ni.length).toBe(1);
    expect(ni[0].severity).toBe("medium");
  });

  it("does NOT fire children_not_informed for only 1 uninformed", () => {
    const records = [makeRecord({ children_informed: false })];
    const alerts = identifyCctvAlerts(records);
    const ni = alerts.filter((a) => a.type === "children_not_informed");
    expect(ni.length).toBe(0);
  });

  it("fires medium alert for review overdue >= 1", () => {
    const records = [makeRecord({ next_review_date: "2025-01-01" })];
    const alerts = identifyCctvAlerts(records);
    const ro = alerts.filter((a) => a.type === "review_overdue");
    expect(ro.length).toBe(1);
    expect(ro[0].severity).toBe("medium");
  });
});
