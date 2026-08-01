import { describe, it, expect } from "vitest";
import {
  computeStaffRetentionMetrics,
  computeStaffRetentionAlerts,
} from "./staff-retention-exit-analysis-service";
import type { StaffRetentionExitAnalysisRow } from "./staff-retention-exit-analysis-service";

// -- Factory ------------------------------------------------------------------

function makeRow(overrides: Partial<StaffRetentionExitAnalysisRow> = {}): StaffRetentionExitAnalysisRow {
  return {
    id: "r-1",
    home_id: "home-1",
    staff_name: "Alice Smith",
    staff_id: "s-1",
    exit_date: "2026-04-01",
    exit_reason: "career_progression",
    retention_risk_level: "low",
    analysis_status: "closed",
    length_of_service_band: "2_to_5_years",
    exit_interview_completed: true,
    stay_interview_completed: true,
    counter_offer_made: false,
    counter_offer_accepted: false,
    notice_period_served: true,
    knowledge_transfer_completed: true,
    replacement_recruited: true,
    team_impact_assessed: true,
    exit_interview_findings: null,
    retention_strategy_notes: null,
    notes: null,
    created_at: "2026-03-01T00:00:00Z",
    updated_at: "2026-03-01T00:00:00Z",
    ...overrides,
  };
}

// -- computeStaffRetentionMetrics ---------------------------------------------

describe("computeStaffRetentionMetrics", () => {
  it("returns zeroes for empty rows", () => {
    const m = computeStaffRetentionMetrics([]);
    expect(m.total_exits).toBe(0);
    expect(m.career_progression_count).toBe(0);
    expect(m.burnout_count).toBe(0);
    expect(m.pay_dissatisfaction_count).toBe(0);
    expect(m.critical_risk_count).toBe(0);
    expect(m.exit_interview_rate).toBeNull();;
    expect(m.notice_served_rate).toBeNull();;
    expect(m.knowledge_transfer_rate).toBeNull();;
    expect(m.counter_offer_rate).toBeNull();;
    expect(m.replacement_rate).toBeNull();;
    expect(m.stay_interview_rate).toBeNull();;
    expect(m.unique_staff).toBe(0);
  });

  it("counts exit reasons correctly", () => {
    const rows = [
      makeRow({ id: "1", exit_reason: "career_progression" }),
      makeRow({ id: "2", exit_reason: "burnout" }),
      makeRow({ id: "3", exit_reason: "pay_dissatisfaction" }),
      makeRow({ id: "4", exit_reason: "burnout" }),
    ];
    const m = computeStaffRetentionMetrics(rows);
    expect(m.total_exits).toBe(4);
    expect(m.career_progression_count).toBe(1);
    expect(m.burnout_count).toBe(2);
    expect(m.pay_dissatisfaction_count).toBe(1);
  });

  it("counts critical risk level", () => {
    const rows = [
      makeRow({ id: "1", retention_risk_level: "critical" }),
      makeRow({ id: "2", retention_risk_level: "high" }),
      makeRow({ id: "3", retention_risk_level: "critical" }),
    ];
    const m = computeStaffRetentionMetrics(rows);
    expect(m.critical_risk_count).toBe(2);
  });

  it("computes boolean rates correctly", () => {
    const rows = [
      makeRow({ id: "1", exit_interview_completed: true, notice_period_served: true, knowledge_transfer_completed: false }),
      makeRow({ id: "2", exit_interview_completed: false, notice_period_served: true, knowledge_transfer_completed: false }),
    ];
    const m = computeStaffRetentionMetrics(rows);
    expect(m.exit_interview_rate).toBe(50);
    expect(m.notice_served_rate).toBe(100);
    expect(m.knowledge_transfer_rate).toBe(0);
  });

  it("builds exit_reason_breakdown and service_band_breakdown", () => {
    const rows = [
      makeRow({ id: "1", exit_reason: "burnout", length_of_service_band: "under_6_months" }),
      makeRow({ id: "2", exit_reason: "burnout", length_of_service_band: "over_5_years" }),
      makeRow({ id: "3", exit_reason: "relocation", length_of_service_band: "under_6_months" }),
    ];
    const m = computeStaffRetentionMetrics(rows);
    expect(m.exit_reason_breakdown).toEqual({ burnout: 2, relocation: 1 });
    expect(m.service_band_breakdown).toEqual({ under_6_months: 2, over_5_years: 1 });
  });

  it("counts unique staff by name", () => {
    const rows = [
      makeRow({ id: "1", staff_name: "Alice" }),
      makeRow({ id: "2", staff_name: "Bob" }),
      makeRow({ id: "3", staff_name: "Alice" }),
    ];
    const m = computeStaffRetentionMetrics(rows);
    expect(m.unique_staff).toBe(2);
  });
});

// -- computeStaffRetentionAlerts ----------------------------------------------

describe("computeStaffRetentionAlerts", () => {
  it("returns empty array for empty rows", () => {
    expect(computeStaffRetentionAlerts([])).toEqual([]);
  });

  it("fires critical alert for critical risk without retention action planned", () => {
    const rows = [makeRow({ retention_risk_level: "critical", analysis_status: "closed" })];
    const alerts = computeStaffRetentionAlerts(rows);
    const critical = alerts.filter((a) => a.type === "critical_risk_no_retention_action");
    expect(critical).toHaveLength(1);
    expect(critical[0].severity).toBe("critical");
  });

  it("does NOT fire critical alert when status is retention_action_planned", () => {
    const rows = [makeRow({ retention_risk_level: "critical", analysis_status: "retention_action_planned" })];
    const alerts = computeStaffRetentionAlerts(rows);
    expect(alerts.filter((a) => a.type === "critical_risk_no_retention_action")).toHaveLength(0);
  });

  it("fires high alert for burnout without stay interview", () => {
    const rows = [makeRow({ exit_reason: "burnout", stay_interview_completed: false })];
    const alerts = computeStaffRetentionAlerts(rows);
    const high = alerts.filter((a) => a.type === "burnout_no_stay_interview");
    expect(high).toHaveLength(1);
    expect(high[0].severity).toBe("high");
  });

  it("fires high alert for no exit interview completed", () => {
    const rows = [makeRow({ exit_interview_completed: false })];
    const alerts = computeStaffRetentionAlerts(rows);
    expect(alerts.some((a) => a.type === "no_exit_interview")).toBe(true);
  });

  it("fires medium alert for short service without knowledge transfer", () => {
    const rows = [makeRow({ length_of_service_band: "under_6_months", knowledge_transfer_completed: false })];
    const alerts = computeStaffRetentionAlerts(rows);
    const medium = alerts.filter((a) => a.type === "short_service_no_knowledge_transfer");
    expect(medium).toHaveLength(1);
    expect(medium[0].severity).toBe("medium");
  });

  it("fires medium alert when 3+ exits share the same reason", () => {
    const rows = [
      makeRow({ id: "1", exit_reason: "burnout" }),
      makeRow({ id: "2", exit_reason: "burnout" }),
      makeRow({ id: "3", exit_reason: "burnout" }),
    ];
    const alerts = computeStaffRetentionAlerts(rows);
    expect(alerts.some((a) => a.type === "repeated_exit_reason")).toBe(true);
  });

  it("does NOT fire repeated exit reason alert at 2 exits", () => {
    const rows = [
      makeRow({ id: "1", exit_reason: "burnout" }),
      makeRow({ id: "2", exit_reason: "burnout" }),
    ];
    const alerts = computeStaffRetentionAlerts(rows);
    expect(alerts.some((a) => a.type === "repeated_exit_reason")).toBe(false);
  });
});
