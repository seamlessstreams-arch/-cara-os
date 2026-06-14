// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF RETENTION & EXIT ANALYSIS SERVICE TESTS
// Pure-function tests for staff retention metrics, alert identification,
// Cara insight generation, enum validation, and edge cases.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";

import {
  EXIT_REASONS,
  RETENTION_RISK_LEVELS,
  ANALYSIS_STATUSES,
  LENGTH_OF_SERVICE_BANDS,
  _testing,
} from "../staff-retention-exit-analysis-service";

import type {
  StaffRetentionExitAnalysisRow,
} from "../staff-retention-exit-analysis-service";

const {
  computeStaffRetentionMetrics,
  computeStaffRetentionAlerts,
  generateStaffRetentionCaraInsights,
} = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

const now = new Date(new Date().toISOString().split("T")[0]);

function makeRow(
  overrides?: Partial<StaffRetentionExitAnalysisRow>,
): StaffRetentionExitAnalysisRow {
  return {
    id: "id" in (overrides ?? {}) ? overrides!.id! : crypto.randomUUID(),
    home_id: "home_id" in (overrides ?? {}) ? overrides!.home_id! : "home-1",
    staff_name: "staff_name" in (overrides ?? {}) ? overrides!.staff_name! : "Staff A",
    staff_id: "staff_id" in (overrides ?? {}) ? (overrides!.staff_id ?? null) : null,
    exit_date: "exit_date" in (overrides ?? {}) ? overrides!.exit_date! : now.toISOString().split("T")[0],
    exit_reason: "exit_reason" in (overrides ?? {}) ? overrides!.exit_reason! : "career_progression",
    retention_risk_level: "retention_risk_level" in (overrides ?? {}) ? overrides!.retention_risk_level! : "low",
    analysis_status: "analysis_status" in (overrides ?? {}) ? overrides!.analysis_status! : "closed",
    length_of_service_band: "length_of_service_band" in (overrides ?? {}) ? overrides!.length_of_service_band! : "2_to_5_years",
    exit_interview_completed: "exit_interview_completed" in (overrides ?? {}) ? overrides!.exit_interview_completed! : true,
    stay_interview_completed: "stay_interview_completed" in (overrides ?? {}) ? overrides!.stay_interview_completed! : true,
    counter_offer_made: "counter_offer_made" in (overrides ?? {}) ? overrides!.counter_offer_made! : false,
    counter_offer_accepted: "counter_offer_accepted" in (overrides ?? {}) ? overrides!.counter_offer_accepted! : false,
    notice_period_served: "notice_period_served" in (overrides ?? {}) ? overrides!.notice_period_served! : true,
    knowledge_transfer_completed: "knowledge_transfer_completed" in (overrides ?? {}) ? overrides!.knowledge_transfer_completed! : true,
    replacement_recruited: "replacement_recruited" in (overrides ?? {}) ? overrides!.replacement_recruited! : true,
    team_impact_assessed: "team_impact_assessed" in (overrides ?? {}) ? overrides!.team_impact_assessed! : true,
    exit_interview_findings: "exit_interview_findings" in (overrides ?? {}) ? (overrides!.exit_interview_findings ?? null) : null,
    retention_strategy_notes: "retention_strategy_notes" in (overrides ?? {}) ? (overrides!.retention_strategy_notes ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: "created_at" in (overrides ?? {}) ? overrides!.created_at! : now.toISOString(),
    updated_at: "updated_at" in (overrides ?? {}) ? overrides!.updated_at! : now.toISOString(),
  };
}

// ── computeStaffRetentionMetrics ────────────────────────────────────────

describe("computeStaffRetentionMetrics", () => {
  describe("empty array", () => {
    it("returns zero total_exits", () => {
      const m = computeStaffRetentionMetrics([]);
      expect(m.total_exits).toBe(0);
    });

    it("returns zero career_progression_count", () => {
      const m = computeStaffRetentionMetrics([]);
      expect(m.career_progression_count).toBe(0);
    });

    it("returns zero burnout_count", () => {
      const m = computeStaffRetentionMetrics([]);
      expect(m.burnout_count).toBe(0);
    });

    it("returns zero pay_dissatisfaction_count", () => {
      const m = computeStaffRetentionMetrics([]);
      expect(m.pay_dissatisfaction_count).toBe(0);
    });

    it("returns zero critical_risk_count", () => {
      const m = computeStaffRetentionMetrics([]);
      expect(m.critical_risk_count).toBe(0);
    });

    it("returns zero exit_interview_rate", () => {
      const m = computeStaffRetentionMetrics([]);
      expect(m.exit_interview_rate).toBe(0);
    });

    it("returns zero notice_served_rate", () => {
      const m = computeStaffRetentionMetrics([]);
      expect(m.notice_served_rate).toBe(0);
    });

    it("returns zero knowledge_transfer_rate", () => {
      const m = computeStaffRetentionMetrics([]);
      expect(m.knowledge_transfer_rate).toBe(0);
    });

    it("returns zero counter_offer_rate", () => {
      const m = computeStaffRetentionMetrics([]);
      expect(m.counter_offer_rate).toBe(0);
    });

    it("returns zero replacement_rate", () => {
      const m = computeStaffRetentionMetrics([]);
      expect(m.replacement_rate).toBe(0);
    });

    it("returns zero stay_interview_rate", () => {
      const m = computeStaffRetentionMetrics([]);
      expect(m.stay_interview_rate).toBe(0);
    });

    it("returns empty exit_reason_breakdown", () => {
      const m = computeStaffRetentionMetrics([]);
      expect(m.exit_reason_breakdown).toEqual({});
    });

    it("returns empty service_band_breakdown", () => {
      const m = computeStaffRetentionMetrics([]);
      expect(m.service_band_breakdown).toEqual({});
    });

    it("returns zero unique_staff", () => {
      const m = computeStaffRetentionMetrics([]);
      expect(m.unique_staff).toBe(0);
    });
  });

  describe("single row", () => {
    it("returns total_exits = 1", () => {
      const m = computeStaffRetentionMetrics([makeRow()]);
      expect(m.total_exits).toBe(1);
    });

    it("returns career_progression_count = 1 for default row", () => {
      const m = computeStaffRetentionMetrics([makeRow()]);
      expect(m.career_progression_count).toBe(1);
    });

    it("returns 100% exit_interview_rate with defaults", () => {
      const m = computeStaffRetentionMetrics([makeRow()]);
      expect(m.exit_interview_rate).toBe(100);
    });

    it("returns 100% notice_served_rate with defaults", () => {
      const m = computeStaffRetentionMetrics([makeRow()]);
      expect(m.notice_served_rate).toBe(100);
    });

    it("returns 100% knowledge_transfer_rate with defaults", () => {
      const m = computeStaffRetentionMetrics([makeRow()]);
      expect(m.knowledge_transfer_rate).toBe(100);
    });

    it("returns 0% counter_offer_rate with defaults", () => {
      const m = computeStaffRetentionMetrics([makeRow()]);
      expect(m.counter_offer_rate).toBe(0);
    });

    it("returns 100% replacement_rate with defaults", () => {
      const m = computeStaffRetentionMetrics([makeRow()]);
      expect(m.replacement_rate).toBe(100);
    });

    it("returns 100% stay_interview_rate with defaults", () => {
      const m = computeStaffRetentionMetrics([makeRow()]);
      expect(m.stay_interview_rate).toBe(100);
    });

    it("returns unique_staff = 1", () => {
      const m = computeStaffRetentionMetrics([makeRow()]);
      expect(m.unique_staff).toBe(1);
    });
  });

  describe("multiple rows", () => {
    it("counts total_exits correctly", () => {
      const m = computeStaffRetentionMetrics([makeRow(), makeRow(), makeRow()]);
      expect(m.total_exits).toBe(3);
    });

    it("counts career_progression_count correctly", () => {
      const rows = [
        makeRow({ exit_reason: "career_progression" }),
        makeRow({ exit_reason: "burnout" }),
        makeRow({ exit_reason: "career_progression" }),
      ];
      const m = computeStaffRetentionMetrics(rows);
      expect(m.career_progression_count).toBe(2);
    });

    it("counts burnout_count correctly", () => {
      const rows = [
        makeRow({ exit_reason: "burnout" }),
        makeRow({ exit_reason: "burnout" }),
        makeRow({ exit_reason: "relocation" }),
      ];
      const m = computeStaffRetentionMetrics(rows);
      expect(m.burnout_count).toBe(2);
    });

    it("counts pay_dissatisfaction_count correctly", () => {
      const rows = [
        makeRow({ exit_reason: "pay_dissatisfaction" }),
        makeRow({ exit_reason: "career_progression" }),
      ];
      const m = computeStaffRetentionMetrics(rows);
      expect(m.pay_dissatisfaction_count).toBe(1);
    });

    it("counts critical_risk_count correctly", () => {
      const rows = [
        makeRow({ retention_risk_level: "critical" }),
        makeRow({ retention_risk_level: "high" }),
        makeRow({ retention_risk_level: "critical" }),
      ];
      const m = computeStaffRetentionMetrics(rows);
      expect(m.critical_risk_count).toBe(2);
    });

    it("does not count high as critical risk", () => {
      const rows = [makeRow({ retention_risk_level: "high" })];
      const m = computeStaffRetentionMetrics(rows);
      expect(m.critical_risk_count).toBe(0);
    });
  });

  describe("rate calculations", () => {
    it("calculates exit_interview_rate 0 when false", () => {
      const m = computeStaffRetentionMetrics([makeRow({ exit_interview_completed: false })]);
      expect(m.exit_interview_rate).toBe(0);
    });

    it("calculates mixed exit_interview_rate (2/3 = 66.7%)", () => {
      const rows = [
        makeRow({ exit_interview_completed: true }),
        makeRow({ exit_interview_completed: true }),
        makeRow({ exit_interview_completed: false }),
      ];
      const m = computeStaffRetentionMetrics(rows);
      expect(m.exit_interview_rate).toBe(66.7);
    });

    it("calculates mixed notice_served_rate (1/3 = 33.3%)", () => {
      const rows = [
        makeRow({ notice_period_served: true }),
        makeRow({ notice_period_served: false }),
        makeRow({ notice_period_served: false }),
      ];
      const m = computeStaffRetentionMetrics(rows);
      expect(m.notice_served_rate).toBe(33.3);
    });

    it("calculates mixed knowledge_transfer_rate (1/2 = 50%)", () => {
      const rows = [
        makeRow({ knowledge_transfer_completed: true }),
        makeRow({ knowledge_transfer_completed: false }),
      ];
      const m = computeStaffRetentionMetrics(rows);
      expect(m.knowledge_transfer_rate).toBe(50);
    });

    it("calculates counter_offer_rate 100 when all true", () => {
      const rows = [
        makeRow({ counter_offer_made: true }),
        makeRow({ counter_offer_made: true }),
      ];
      const m = computeStaffRetentionMetrics(rows);
      expect(m.counter_offer_rate).toBe(100);
    });

    it("calculates replacement_rate 0 when all false", () => {
      const rows = [
        makeRow({ replacement_recruited: false }),
        makeRow({ replacement_recruited: false }),
      ];
      const m = computeStaffRetentionMetrics(rows);
      expect(m.replacement_rate).toBe(0);
    });

    it("calculates stay_interview_rate correctly (1/4 = 25%)", () => {
      const rows = [
        makeRow({ stay_interview_completed: true }),
        makeRow({ stay_interview_completed: false }),
        makeRow({ stay_interview_completed: false }),
        makeRow({ stay_interview_completed: false }),
      ];
      const m = computeStaffRetentionMetrics(rows);
      expect(m.stay_interview_rate).toBe(25);
    });
  });

  describe("exit_reason_breakdown", () => {
    it("counts duplicate exit reasons", () => {
      const rows = [
        makeRow({ exit_reason: "burnout" }),
        makeRow({ exit_reason: "burnout" }),
        makeRow({ exit_reason: "relocation" }),
      ];
      const m = computeStaffRetentionMetrics(rows);
      expect(m.exit_reason_breakdown).toEqual({ burnout: 2, relocation: 1 });
    });

    it("handles all 12 exit reasons", () => {
      const rows = EXIT_REASONS.map((r) => makeRow({ exit_reason: r }));
      const m = computeStaffRetentionMetrics(rows);
      for (const r of EXIT_REASONS) {
        expect(m.exit_reason_breakdown[r]).toBe(1);
      }
    });
  });

  describe("service_band_breakdown", () => {
    it("counts duplicate service bands", () => {
      const rows = [
        makeRow({ length_of_service_band: "under_6_months" }),
        makeRow({ length_of_service_band: "under_6_months" }),
        makeRow({ length_of_service_band: "over_5_years" }),
      ];
      const m = computeStaffRetentionMetrics(rows);
      expect(m.service_band_breakdown).toEqual({ under_6_months: 2, over_5_years: 1 });
    });

    it("handles all 5 service bands", () => {
      const rows = LENGTH_OF_SERVICE_BANDS.map((b) => makeRow({ length_of_service_band: b }));
      const m = computeStaffRetentionMetrics(rows);
      for (const b of LENGTH_OF_SERVICE_BANDS) {
        expect(m.service_band_breakdown[b]).toBe(1);
      }
    });
  });

  describe("unique_staff", () => {
    it("counts distinct staff names", () => {
      const rows = [
        makeRow({ staff_name: "Alice" }),
        makeRow({ staff_name: "Bob" }),
        makeRow({ staff_name: "Alice" }),
      ];
      const m = computeStaffRetentionMetrics(rows);
      expect(m.unique_staff).toBe(2);
    });

    it("returns 1 when all rows have the same staff name", () => {
      const rows = [
        makeRow({ staff_name: "Same Person" }),
        makeRow({ staff_name: "Same Person" }),
        makeRow({ staff_name: "Same Person" }),
      ];
      const m = computeStaffRetentionMetrics(rows);
      expect(m.unique_staff).toBe(1);
    });

    it("counts all unique when all different", () => {
      const rows = [
        makeRow({ staff_name: "A" }),
        makeRow({ staff_name: "B" }),
        makeRow({ staff_name: "C" }),
      ];
      const m = computeStaffRetentionMetrics(rows);
      expect(m.unique_staff).toBe(3);
    });
  });
});

// ── computeStaffRetentionAlerts ─────────────────────────────────────────

describe("computeStaffRetentionAlerts", () => {
  describe("no alerts", () => {
    it("returns empty array when no rows", () => {
      const alerts = computeStaffRetentionAlerts([]);
      expect(alerts).toHaveLength(0);
    });

    it("returns empty array when all rows are clean", () => {
      const rows = [makeRow()];
      const alerts = computeStaffRetentionAlerts(rows);
      expect(alerts).toEqual([]);
    });
  });

  describe("critical_risk_no_retention_action alert", () => {
    it("fires for critical risk without retention action planned", () => {
      const rows = [makeRow({ retention_risk_level: "critical", analysis_status: "closed", staff_name: "Jo" })];
      const alerts = computeStaffRetentionAlerts(rows);
      const alert = alerts.find((a) => a.type === "critical_risk_no_retention_action");
      expect(alert).toBeDefined();
    });

    it("has severity critical", () => {
      const rows = [makeRow({ retention_risk_level: "critical", analysis_status: "closed" })];
      const alerts = computeStaffRetentionAlerts(rows);
      const alert = alerts.find((a) => a.type === "critical_risk_no_retention_action")!;
      expect(alert.severity).toBe("critical");
    });

    it("includes staff name in message", () => {
      const rows = [makeRow({ retention_risk_level: "critical", analysis_status: "analysed", staff_name: "Sarah" })];
      const alerts = computeStaffRetentionAlerts(rows);
      const alert = alerts.find((a) => a.type === "critical_risk_no_retention_action")!;
      expect(alert.message).toContain("Sarah");
    });

    it("includes record_id", () => {
      const rows = [makeRow({ id: "rec-1", retention_risk_level: "critical", analysis_status: "closed" })];
      const alerts = computeStaffRetentionAlerts(rows);
      const alert = alerts.find((a) => a.type === "critical_risk_no_retention_action")!;
      expect(alert.record_id).toBe("rec-1");
    });

    it("does not fire when retention action is planned", () => {
      const rows = [makeRow({ retention_risk_level: "critical", analysis_status: "retention_action_planned" })];
      const alerts = computeStaffRetentionAlerts(rows);
      const alert = alerts.find((a) => a.type === "critical_risk_no_retention_action");
      expect(alert).toBeUndefined();
    });

    it("does not fire for non-critical risk levels", () => {
      const rows = [makeRow({ retention_risk_level: "high", analysis_status: "closed" })];
      const alerts = computeStaffRetentionAlerts(rows);
      const alert = alerts.find((a) => a.type === "critical_risk_no_retention_action");
      expect(alert).toBeUndefined();
    });

    it("does not fire for low risk level", () => {
      const rows = [makeRow({ retention_risk_level: "low", analysis_status: "exit_interview_scheduled" })];
      const alerts = computeStaffRetentionAlerts(rows);
      const alert = alerts.find((a) => a.type === "critical_risk_no_retention_action");
      expect(alert).toBeUndefined();
    });

    it("does not fire for medium risk level", () => {
      const rows = [makeRow({ retention_risk_level: "medium", analysis_status: "analysed" })];
      const alerts = computeStaffRetentionAlerts(rows);
      const alert = alerts.find((a) => a.type === "critical_risk_no_retention_action");
      expect(alert).toBeUndefined();
    });

    it("fires per record for multiple critical risk staff", () => {
      const rows = [
        makeRow({ id: "a-1", retention_risk_level: "critical", analysis_status: "closed" }),
        makeRow({ id: "a-2", retention_risk_level: "critical", analysis_status: "analysed" }),
      ];
      const alerts = computeStaffRetentionAlerts(rows);
      const critical = alerts.filter((a) => a.type === "critical_risk_no_retention_action");
      expect(critical).toHaveLength(2);
    });

    it("fires for exit_interview_scheduled status", () => {
      const rows = [makeRow({ retention_risk_level: "critical", analysis_status: "exit_interview_scheduled" })];
      const alerts = computeStaffRetentionAlerts(rows);
      const alert = alerts.find((a) => a.type === "critical_risk_no_retention_action");
      expect(alert).toBeDefined();
    });

    it("fires for exit_interview_completed status", () => {
      const rows = [makeRow({ retention_risk_level: "critical", analysis_status: "exit_interview_completed" })];
      const alerts = computeStaffRetentionAlerts(rows);
      const alert = alerts.find((a) => a.type === "critical_risk_no_retention_action");
      expect(alert).toBeDefined();
    });
  });

  describe("burnout_no_stay_interview alert", () => {
    it("fires for burnout with no stay interview", () => {
      const rows = [makeRow({ exit_reason: "burnout", stay_interview_completed: false, staff_name: "Jo" })];
      const alerts = computeStaffRetentionAlerts(rows);
      const alert = alerts.find((a) => a.type === "burnout_no_stay_interview");
      expect(alert).toBeDefined();
    });

    it("has severity high", () => {
      const rows = [makeRow({ exit_reason: "burnout", stay_interview_completed: false })];
      const alerts = computeStaffRetentionAlerts(rows);
      const alert = alerts.find((a) => a.type === "burnout_no_stay_interview")!;
      expect(alert.severity).toBe("high");
    });

    it("includes staff name in message", () => {
      const rows = [makeRow({ exit_reason: "burnout", stay_interview_completed: false, staff_name: "Mark" })];
      const alerts = computeStaffRetentionAlerts(rows);
      const alert = alerts.find((a) => a.type === "burnout_no_stay_interview")!;
      expect(alert.message).toContain("Mark");
    });

    it("includes record_id", () => {
      const rows = [makeRow({ id: "rec-b-1", exit_reason: "burnout", stay_interview_completed: false })];
      const alerts = computeStaffRetentionAlerts(rows);
      const alert = alerts.find((a) => a.type === "burnout_no_stay_interview")!;
      expect(alert.record_id).toBe("rec-b-1");
    });

    it("does not fire when stay interview is completed", () => {
      const rows = [makeRow({ exit_reason: "burnout", stay_interview_completed: true })];
      const alerts = computeStaffRetentionAlerts(rows);
      const alert = alerts.find((a) => a.type === "burnout_no_stay_interview");
      expect(alert).toBeUndefined();
    });

    it("does not fire for non-burnout exit reason", () => {
      const rows = [makeRow({ exit_reason: "relocation", stay_interview_completed: false })];
      const alerts = computeStaffRetentionAlerts(rows);
      const alert = alerts.find((a) => a.type === "burnout_no_stay_interview");
      expect(alert).toBeUndefined();
    });

    it("fires per record for multiple burnout leavers without stay interview", () => {
      const rows = [
        makeRow({ exit_reason: "burnout", stay_interview_completed: false }),
        makeRow({ exit_reason: "burnout", stay_interview_completed: false }),
      ];
      const alerts = computeStaffRetentionAlerts(rows);
      const burnoutAlerts = alerts.filter((a) => a.type === "burnout_no_stay_interview");
      expect(burnoutAlerts).toHaveLength(2);
    });
  });

  describe("no_exit_interview alert", () => {
    it("fires for leavers without exit interview", () => {
      const rows = [makeRow({ exit_interview_completed: false, staff_name: "Alex" })];
      const alerts = computeStaffRetentionAlerts(rows);
      const alert = alerts.find((a) => a.type === "no_exit_interview");
      expect(alert).toBeDefined();
    });

    it("has severity high", () => {
      const rows = [makeRow({ exit_interview_completed: false })];
      const alerts = computeStaffRetentionAlerts(rows);
      const alert = alerts.find((a) => a.type === "no_exit_interview")!;
      expect(alert.severity).toBe("high");
    });

    it("includes staff name in message", () => {
      const rows = [makeRow({ exit_interview_completed: false, staff_name: "Kim" })];
      const alerts = computeStaffRetentionAlerts(rows);
      const alert = alerts.find((a) => a.type === "no_exit_interview")!;
      expect(alert.message).toContain("Kim");
    });

    it("includes record_id", () => {
      const rows = [makeRow({ id: "rec-ei-1", exit_interview_completed: false })];
      const alerts = computeStaffRetentionAlerts(rows);
      const alert = alerts.find((a) => a.type === "no_exit_interview")!;
      expect(alert.record_id).toBe("rec-ei-1");
    });

    it("does not fire when exit interview is completed", () => {
      const rows = [makeRow({ exit_interview_completed: true })];
      const alerts = computeStaffRetentionAlerts(rows);
      const alert = alerts.find((a) => a.type === "no_exit_interview");
      expect(alert).toBeUndefined();
    });

    it("fires per record for multiple leavers without exit interview", () => {
      const rows = [
        makeRow({ exit_interview_completed: false }),
        makeRow({ exit_interview_completed: false }),
        makeRow({ exit_interview_completed: false }),
      ];
      const alerts = computeStaffRetentionAlerts(rows);
      const noExit = alerts.filter((a) => a.type === "no_exit_interview");
      expect(noExit).toHaveLength(3);
    });
  });

  describe("short_service_no_knowledge_transfer alert", () => {
    it("fires for under 6 months without knowledge transfer", () => {
      const rows = [makeRow({ length_of_service_band: "under_6_months", knowledge_transfer_completed: false, staff_name: "Sam" })];
      const alerts = computeStaffRetentionAlerts(rows);
      const alert = alerts.find((a) => a.type === "short_service_no_knowledge_transfer");
      expect(alert).toBeDefined();
    });

    it("has severity medium", () => {
      const rows = [makeRow({ length_of_service_band: "under_6_months", knowledge_transfer_completed: false })];
      const alerts = computeStaffRetentionAlerts(rows);
      const alert = alerts.find((a) => a.type === "short_service_no_knowledge_transfer")!;
      expect(alert.severity).toBe("medium");
    });

    it("includes staff name in message", () => {
      const rows = [makeRow({ length_of_service_band: "under_6_months", knowledge_transfer_completed: false, staff_name: "Lee" })];
      const alerts = computeStaffRetentionAlerts(rows);
      const alert = alerts.find((a) => a.type === "short_service_no_knowledge_transfer")!;
      expect(alert.message).toContain("Lee");
    });

    it("includes record_id", () => {
      const rows = [makeRow({ id: "rec-kt-1", length_of_service_band: "under_6_months", knowledge_transfer_completed: false })];
      const alerts = computeStaffRetentionAlerts(rows);
      const alert = alerts.find((a) => a.type === "short_service_no_knowledge_transfer")!;
      expect(alert.record_id).toBe("rec-kt-1");
    });

    it("does not fire when knowledge transfer is completed", () => {
      const rows = [makeRow({ length_of_service_band: "under_6_months", knowledge_transfer_completed: true })];
      const alerts = computeStaffRetentionAlerts(rows);
      const alert = alerts.find((a) => a.type === "short_service_no_knowledge_transfer");
      expect(alert).toBeUndefined();
    });

    it("does not fire for longer service bands without knowledge transfer", () => {
      const rows = [makeRow({ length_of_service_band: "2_to_5_years", knowledge_transfer_completed: false })];
      const alerts = computeStaffRetentionAlerts(rows);
      const alert = alerts.find((a) => a.type === "short_service_no_knowledge_transfer");
      expect(alert).toBeUndefined();
    });

    it("does not fire for 6_to_12_months band", () => {
      const rows = [makeRow({ length_of_service_band: "6_to_12_months", knowledge_transfer_completed: false })];
      const alerts = computeStaffRetentionAlerts(rows);
      const alert = alerts.find((a) => a.type === "short_service_no_knowledge_transfer");
      expect(alert).toBeUndefined();
    });

    it("does not fire for over_5_years band", () => {
      const rows = [makeRow({ length_of_service_band: "over_5_years", knowledge_transfer_completed: false })];
      const alerts = computeStaffRetentionAlerts(rows);
      const alert = alerts.find((a) => a.type === "short_service_no_knowledge_transfer");
      expect(alert).toBeUndefined();
    });

    it("fires per record for multiple short-service leavers", () => {
      const rows = [
        makeRow({ length_of_service_band: "under_6_months", knowledge_transfer_completed: false }),
        makeRow({ length_of_service_band: "under_6_months", knowledge_transfer_completed: false }),
      ];
      const alerts = computeStaffRetentionAlerts(rows);
      const shortService = alerts.filter((a) => a.type === "short_service_no_knowledge_transfer");
      expect(shortService).toHaveLength(2);
    });
  });

  describe("repeated_exit_reason alert", () => {
    it("fires when 3 or more exits share same reason", () => {
      const rows = [
        makeRow({ exit_reason: "burnout" }),
        makeRow({ exit_reason: "burnout" }),
        makeRow({ exit_reason: "burnout" }),
      ];
      const alerts = computeStaffRetentionAlerts(rows);
      const alert = alerts.find((a) => a.type === "repeated_exit_reason");
      expect(alert).toBeDefined();
    });

    it("has severity medium", () => {
      const rows = [
        makeRow({ exit_reason: "pay_dissatisfaction" }),
        makeRow({ exit_reason: "pay_dissatisfaction" }),
        makeRow({ exit_reason: "pay_dissatisfaction" }),
      ];
      const alerts = computeStaffRetentionAlerts(rows);
      const alert = alerts.find((a) => a.type === "repeated_exit_reason")!;
      expect(alert.severity).toBe("medium");
    });

    it("includes count in message", () => {
      const rows = [
        makeRow({ exit_reason: "relocation" }),
        makeRow({ exit_reason: "relocation" }),
        makeRow({ exit_reason: "relocation" }),
        makeRow({ exit_reason: "relocation" }),
      ];
      const alerts = computeStaffRetentionAlerts(rows);
      const alert = alerts.find((a) => a.type === "repeated_exit_reason")!;
      expect(alert.message).toContain("4");
    });

    it("replaces underscores with spaces in reason name", () => {
      const rows = [
        makeRow({ exit_reason: "work_life_balance" }),
        makeRow({ exit_reason: "work_life_balance" }),
        makeRow({ exit_reason: "work_life_balance" }),
      ];
      const alerts = computeStaffRetentionAlerts(rows);
      const alert = alerts.find((a) => a.type === "repeated_exit_reason")!;
      expect(alert.message).toContain("work life balance");
    });

    it("does not have record_id (aggregate alert)", () => {
      const rows = [
        makeRow({ exit_reason: "burnout" }),
        makeRow({ exit_reason: "burnout" }),
        makeRow({ exit_reason: "burnout" }),
      ];
      const alerts = computeStaffRetentionAlerts(rows);
      const alert = alerts.find((a) => a.type === "repeated_exit_reason")!;
      expect(alert.record_id).toBeUndefined();
    });

    it("does not fire for 2 exits with same reason", () => {
      const rows = [
        makeRow({ exit_reason: "burnout" }),
        makeRow({ exit_reason: "burnout" }),
      ];
      const alerts = computeStaffRetentionAlerts(rows);
      const alert = alerts.find((a) => a.type === "repeated_exit_reason");
      expect(alert).toBeUndefined();
    });

    it("does not fire for 1 exit per reason", () => {
      const rows = [
        makeRow({ exit_reason: "burnout" }),
        makeRow({ exit_reason: "relocation" }),
        makeRow({ exit_reason: "retirement" }),
      ];
      const alerts = computeStaffRetentionAlerts(rows);
      const alert = alerts.find((a) => a.type === "repeated_exit_reason");
      expect(alert).toBeUndefined();
    });

    it("fires separately for multiple reasons with 3+ exits", () => {
      const rows = [
        makeRow({ exit_reason: "burnout" }),
        makeRow({ exit_reason: "burnout" }),
        makeRow({ exit_reason: "burnout" }),
        makeRow({ exit_reason: "pay_dissatisfaction" }),
        makeRow({ exit_reason: "pay_dissatisfaction" }),
        makeRow({ exit_reason: "pay_dissatisfaction" }),
      ];
      const alerts = computeStaffRetentionAlerts(rows);
      const repeated = alerts.filter((a) => a.type === "repeated_exit_reason");
      expect(repeated).toHaveLength(2);
    });
  });

  describe("combined alerts", () => {
    it("can fire all alert types simultaneously", () => {
      const rows = [
        makeRow({ retention_risk_level: "critical", analysis_status: "closed", exit_reason: "burnout", stay_interview_completed: false, exit_interview_completed: false, length_of_service_band: "under_6_months", knowledge_transfer_completed: false }),
        makeRow({ exit_reason: "burnout", stay_interview_completed: false, exit_interview_completed: false, length_of_service_band: "under_6_months", knowledge_transfer_completed: false }),
        makeRow({ exit_reason: "burnout", exit_interview_completed: false }),
      ];
      const alerts = computeStaffRetentionAlerts(rows);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("critical_risk_no_retention_action");
      expect(types).toContain("burnout_no_stay_interview");
      expect(types).toContain("no_exit_interview");
      expect(types).toContain("short_service_no_knowledge_transfer");
      expect(types).toContain("repeated_exit_reason");
    });
  });

  describe("alert structure", () => {
    it("every alert has type, severity, and message fields", () => {
      const rows = [
        makeRow({ retention_risk_level: "critical", analysis_status: "closed", exit_interview_completed: false }),
      ];
      const alerts = computeStaffRetentionAlerts(rows);
      for (const alert of alerts) {
        expect(alert).toHaveProperty("type");
        expect(alert).toHaveProperty("severity");
        expect(alert).toHaveProperty("message");
      }
    });

    it("severity is always one of critical, high, or medium", () => {
      const rows = [
        makeRow({ retention_risk_level: "critical", analysis_status: "closed", exit_reason: "burnout", stay_interview_completed: false, exit_interview_completed: false, length_of_service_band: "under_6_months", knowledge_transfer_completed: false }),
        makeRow({ exit_reason: "burnout", stay_interview_completed: false, exit_interview_completed: false, length_of_service_band: "under_6_months", knowledge_transfer_completed: false }),
        makeRow({ exit_reason: "burnout", exit_interview_completed: false }),
      ];
      const alerts = computeStaffRetentionAlerts(rows);
      for (const alert of alerts) {
        expect(["critical", "high", "medium"]).toContain(alert.severity);
      }
    });

    it("message is always a non-empty string", () => {
      const rows = [makeRow({ exit_interview_completed: false })];
      const alerts = computeStaffRetentionAlerts(rows);
      for (const alert of alerts) {
        expect(typeof alert.message).toBe("string");
        expect(alert.message.length).toBeGreaterThan(0);
      }
    });
  });
});

// ── generateStaffRetentionCaraInsights ──────────────────────────────────

describe("generateStaffRetentionCaraInsights", () => {
  it("returns exactly 3 insights", () => {
    const insights = generateStaffRetentionCaraInsights([]);
    expect(insights).toHaveLength(3);
  });

  it("returns exactly 3 insights with data", () => {
    const insights = generateStaffRetentionCaraInsights([makeRow()]);
    expect(insights).toHaveLength(3);
  });

  it("first insight starts with [amber]", () => {
    const insights = generateStaffRetentionCaraInsights([makeRow()]);
    expect(insights[0]).toMatch(/^\[amber\]/);
  });

  it("first insight includes total exits count", () => {
    const rows = [makeRow(), makeRow(), makeRow()];
    const insights = generateStaffRetentionCaraInsights(rows);
    expect(insights[0]).toContain("3");
  });

  it("first insight includes unique staff count", () => {
    const rows = [
      makeRow({ staff_name: "A" }),
      makeRow({ staff_name: "B" }),
    ];
    const insights = generateStaffRetentionCaraInsights(rows);
    expect(insights[0]).toContain("2");
  });

  it("first insight uses singular exit wording for 1 exit", () => {
    const rows = [makeRow()];
    const insights = generateStaffRetentionCaraInsights(rows);
    expect(insights[0]).toContain("1 staff exit");
  });

  it("first insight uses plural exits wording for multiple exits", () => {
    const rows = [makeRow(), makeRow()];
    const insights = generateStaffRetentionCaraInsights(rows);
    expect(insights[0]).toContain("exits");
  });

  it("first insight uses singular staff member wording for 1 unique staff", () => {
    const rows = [makeRow({ staff_name: "Only One" })];
    const insights = generateStaffRetentionCaraInsights(rows);
    expect(insights[0]).toContain("1 unique staff member");
  });

  it("first insight uses plural staff members wording for multiple unique staff", () => {
    const rows = [makeRow({ staff_name: "A" }), makeRow({ staff_name: "B" })];
    const insights = generateStaffRetentionCaraInsights(rows);
    expect(insights[0]).toContain("staff members");
  });

  it("second insight starts with [amber]", () => {
    const insights = generateStaffRetentionCaraInsights([makeRow()]);
    expect(insights[1]).toMatch(/^\[amber\]/);
  });

  it("second insight mentions critical and high alerts when present", () => {
    const rows = [
      makeRow({ retention_risk_level: "critical", analysis_status: "closed", exit_interview_completed: false }),
    ];
    const insights = generateStaffRetentionCaraInsights(rows);
    expect(insights[1]).toContain("critical");
    expect(insights[1]).toContain("high");
  });

  it("second insight mentions no alerts when none present", () => {
    const rows = [makeRow()];
    const insights = generateStaffRetentionCaraInsights(rows);
    expect(insights[1]).toContain("No critical or high-priority alerts");
  });

  it("third insight starts with [reflect]", () => {
    const insights = generateStaffRetentionCaraInsights([makeRow()]);
    expect(insights[2]).toMatch(/^\[reflect\]/);
  });

  it("third insight mentions burnout when burnout exits exist", () => {
    const rows = [makeRow({ exit_reason: "burnout" })];
    const insights = generateStaffRetentionCaraInsights(rows);
    expect(insights[2]).toContain("burnout");
  });

  it("third insight uses singular member wording for 1 burnout", () => {
    const rows = [makeRow({ exit_reason: "burnout" })];
    const insights = generateStaffRetentionCaraInsights(rows);
    expect(insights[2]).toContain("member has");
  });

  it("third insight uses plural members wording for multiple burnout", () => {
    const rows = [
      makeRow({ exit_reason: "burnout" }),
      makeRow({ exit_reason: "burnout" }),
    ];
    const insights = generateStaffRetentionCaraInsights(rows);
    expect(insights[2]).toContain("members have");
  });

  it("third insight mentions critical risk when no burnout but critical risk exists", () => {
    const rows = [makeRow({ exit_reason: "relocation", retention_risk_level: "critical" })];
    const insights = generateStaffRetentionCaraInsights(rows);
    expect(insights[2]).toContain("critical-risk");
  });

  it("third insight uses singular departure wording for 1 critical risk", () => {
    const rows = [makeRow({ exit_reason: "relocation", retention_risk_level: "critical" })];
    const insights = generateStaffRetentionCaraInsights(rows);
    expect(insights[2]).toContain("departure was");
  });

  it("third insight uses plural departures wording for multiple critical risk", () => {
    const rows = [
      makeRow({ exit_reason: "relocation", retention_risk_level: "critical" }),
      makeRow({ exit_reason: "career_progression", retention_risk_level: "critical" }),
    ];
    const insights = generateStaffRetentionCaraInsights(rows);
    expect(insights[2]).toContain("departures were");
  });

  it("third insight celebrates stability when no burnout or critical risk", () => {
    const rows = [makeRow({ exit_reason: "career_progression", retention_risk_level: "low" })];
    const insights = generateStaffRetentionCaraInsights(rows);
    expect(insights[2]).toContain("No burnout or critical-risk departures");
  });

  it("all insights are non-empty strings", () => {
    const insights = generateStaffRetentionCaraInsights([makeRow()]);
    for (const insight of insights) {
      expect(typeof insight).toBe("string");
      expect(insight.length).toBeGreaterThan(0);
    }
  });

  it("handles empty array gracefully", () => {
    const insights = generateStaffRetentionCaraInsights([]);
    expect(insights).toHaveLength(3);
    for (const insight of insights) {
      expect(typeof insight).toBe("string");
      expect(insight.length).toBeGreaterThan(0);
    }
  });
});

// ── Enum constants ───────────────────────────────────────────────────────

describe("Enum constants", () => {
  it("EXIT_REASONS has exactly 12 items", () => {
    expect(EXIT_REASONS).toHaveLength(12);
  });

  it("RETENTION_RISK_LEVELS has exactly 4 items", () => {
    expect(RETENTION_RISK_LEVELS).toHaveLength(4);
  });

  it("ANALYSIS_STATUSES has exactly 5 items", () => {
    expect(ANALYSIS_STATUSES).toHaveLength(5);
  });

  it("LENGTH_OF_SERVICE_BANDS has exactly 5 items", () => {
    expect(LENGTH_OF_SERVICE_BANDS).toHaveLength(5);
  });

  it("EXIT_REASONS values are unique", () => {
    expect(new Set(EXIT_REASONS).size).toBe(EXIT_REASONS.length);
  });

  it("RETENTION_RISK_LEVELS values are unique", () => {
    expect(new Set(RETENTION_RISK_LEVELS).size).toBe(RETENTION_RISK_LEVELS.length);
  });

  it("ANALYSIS_STATUSES values are unique", () => {
    expect(new Set(ANALYSIS_STATUSES).size).toBe(ANALYSIS_STATUSES.length);
  });

  it("LENGTH_OF_SERVICE_BANDS values are unique", () => {
    expect(new Set(LENGTH_OF_SERVICE_BANDS).size).toBe(LENGTH_OF_SERVICE_BANDS.length);
  });

  it("EXIT_REASONS contains career_progression", () => {
    expect(EXIT_REASONS).toContain("career_progression");
  });

  it("EXIT_REASONS contains burnout", () => {
    expect(EXIT_REASONS).toContain("burnout");
  });

  it("EXIT_REASONS contains pay_dissatisfaction", () => {
    expect(EXIT_REASONS).toContain("pay_dissatisfaction");
  });

  it("EXIT_REASONS contains performance_managed", () => {
    expect(EXIT_REASONS).toContain("performance_managed");
  });

  it("RETENTION_RISK_LEVELS contains critical", () => {
    expect(RETENTION_RISK_LEVELS).toContain("critical");
  });

  it("RETENTION_RISK_LEVELS contains low", () => {
    expect(RETENTION_RISK_LEVELS).toContain("low");
  });

  it("ANALYSIS_STATUSES contains exit_interview_scheduled", () => {
    expect(ANALYSIS_STATUSES).toContain("exit_interview_scheduled");
  });

  it("ANALYSIS_STATUSES contains retention_action_planned", () => {
    expect(ANALYSIS_STATUSES).toContain("retention_action_planned");
  });

  it("LENGTH_OF_SERVICE_BANDS contains under_6_months", () => {
    expect(LENGTH_OF_SERVICE_BANDS).toContain("under_6_months");
  });

  it("LENGTH_OF_SERVICE_BANDS contains over_5_years", () => {
    expect(LENGTH_OF_SERVICE_BANDS).toContain("over_5_years");
  });
});

// ── Factory helper validation ────────────────────────────────────────────

describe("makeRow factory helper", () => {
  it("creates a row with sensible defaults", () => {
    const r = makeRow();
    expect(r.home_id).toBe("home-1");
    expect(r.staff_name).toBe("Staff A");
    expect(r.staff_id).toBeNull();
    expect(r.exit_reason).toBe("career_progression");
    expect(r.retention_risk_level).toBe("low");
    expect(r.analysis_status).toBe("closed");
    expect(r.length_of_service_band).toBe("2_to_5_years");
    expect(r.exit_interview_completed).toBe(true);
    expect(r.stay_interview_completed).toBe(true);
    expect(r.counter_offer_made).toBe(false);
    expect(r.counter_offer_accepted).toBe(false);
    expect(r.notice_period_served).toBe(true);
    expect(r.knowledge_transfer_completed).toBe(true);
    expect(r.replacement_recruited).toBe(true);
    expect(r.team_impact_assessed).toBe(true);
    expect(r.exit_interview_findings).toBeNull();
    expect(r.retention_strategy_notes).toBeNull();
    expect(r.notes).toBeNull();
  });

  it("allows overriding individual fields", () => {
    const r = makeRow({ exit_reason: "burnout", retention_risk_level: "critical" });
    expect(r.exit_reason).toBe("burnout");
    expect(r.retention_risk_level).toBe("critical");
    // defaults still apply
    expect(r.analysis_status).toBe("closed");
  });

  it("generates unique ids by default", () => {
    const r1 = makeRow();
    const r2 = makeRow();
    expect(r1.id).not.toBe(r2.id);
  });

  it("allows overriding id", () => {
    const r = makeRow({ id: "custom-id" });
    expect(r.id).toBe("custom-id");
  });

  it("allows setting nullable fields to null", () => {
    const r = makeRow({ staff_id: null, exit_interview_findings: null, retention_strategy_notes: null, notes: null });
    expect(r.staff_id).toBeNull();
    expect(r.exit_interview_findings).toBeNull();
    expect(r.retention_strategy_notes).toBeNull();
    expect(r.notes).toBeNull();
  });

  it("allows setting nullable fields to values", () => {
    const r = makeRow({ staff_id: "s-123", exit_interview_findings: "Good feedback", retention_strategy_notes: "Offered flexible hours", notes: "Resigned amicably" });
    expect(r.staff_id).toBe("s-123");
    expect(r.exit_interview_findings).toBe("Good feedback");
    expect(r.retention_strategy_notes).toBe("Offered flexible hours");
    expect(r.notes).toBe("Resigned amicably");
  });
});
