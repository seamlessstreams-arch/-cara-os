import { describe, it, expect } from "vitest";
import { _testing, type StaffShiftPatternMonitoringRecord } from "../staff-shift-pattern-monitoring-service";
import { todayStr } from "@/lib/utils";

const { computeStaffShiftPatternMetrics, identifyStaffShiftPatternAlerts } = _testing;

const now = new Date(todayStr());

function makeRecord(overrides?: Partial<StaffShiftPatternMonitoringRecord>): StaffShiftPatternMonitoringRecord {
  return {
    id: overrides?.id ?? "a-1", home_id: overrides?.home_id ?? "home-1",
    shift_type: overrides?.shift_type ?? "morning",
    fatigue_risk: overrides?.fatigue_risk ?? "low",
    staffing_level: overrides?.staffing_level ?? "fully_staffed",
    shift_compliance: overrides?.shift_compliance ?? "fully_compliant",
    shift_date: overrides?.shift_date ?? todayStr(),
    staff_name: overrides?.staff_name ?? "Staff A",
    shift_supervisor: overrides?.shift_supervisor ?? "Manager A",
    rest_period_compliant: overrides?.rest_period_compliant ?? true,
    working_time_directive_met: overrides?.working_time_directive_met ?? true,
    lone_working_risk_assessed: overrides?.lone_working_risk_assessed ?? true,
    handover_completed: overrides?.handover_completed ?? true,
    break_taken: overrides?.break_taken ?? true,
    training_current: overrides?.training_current ?? true,
    dbs_current: overrides?.dbs_current ?? true,
    first_aid_current: overrides?.first_aid_current ?? true,
    medication_trained: overrides?.medication_trained ?? true,
    supervision_up_to_date: overrides?.supervision_up_to_date ?? true,
    wellbeing_checked: overrides?.wellbeing_checked ?? true,
    recorded_promptly: overrides?.recorded_promptly ?? true,
    shift_duration_hours: overrides?.shift_duration_hours ?? 8,
    issues_found: overrides?.issues_found ?? [], actions_taken: overrides?.actions_taken ?? [],
    next_review_date: "next_review_date" in (overrides ?? {}) ? (overrides!.next_review_date ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: overrides?.created_at ?? now.toISOString(), updated_at: overrides?.updated_at ?? now.toISOString(),
  };
}

describe("staff-shift-pattern-monitoring-service", () => {
  describe("computeStaffShiftPatternMetrics", () => {
    it("returns zeros for empty", () => { 
      const m = computeStaffShiftPatternMetrics([]);
      expect(m.total_shifts).toBe(0);;
      expect(m.high_fatigue_count).toBe(0);
      expect(m.critical_fatigue_count).toBe(0);
      expect(m.understaffed_count).toBe(0);
      expect(m.critically_understaffed_count).toBe(0);
      expect(m.rest_period_rate).toBeNull();;
      expect(m.average_shift_duration).toBeNull();;
      expect(m.unique_staff).toBe(0);
    });
    it("returns empty breakdowns", () => { 
      const m = computeStaffShiftPatternMetrics([]);
      expect(m.by_shift_type).toEqual({});
      expect(m.by_fatigue_risk).toEqual({});
      expect(m.by_staffing_level).toEqual({});
      expect(m.by_shift_compliance).toEqual({});
    });
    it("total_shifts counts records", () => { expect(computeStaffShiftPatternMetrics([makeRecord(), makeRecord()]).total_shifts).toBe(2); });
    it("counts high_fatigue", () => { expect(computeStaffShiftPatternMetrics([makeRecord({ fatigue_risk: "high" })]).high_fatigue_count).toBe(1); });
    it("counts critical_fatigue", () => { expect(computeStaffShiftPatternMetrics([makeRecord({ fatigue_risk: "critical" })]).critical_fatigue_count).toBe(1); });
    it("does not count moderate as high_fatigue", () => { expect(computeStaffShiftPatternMetrics([makeRecord({ fatigue_risk: "moderate" })]).high_fatigue_count).toBe(0); });
    it("counts understaffed", () => { expect(computeStaffShiftPatternMetrics([makeRecord({ staffing_level: "understaffed" })]).understaffed_count).toBe(1); });
    it("counts critically_understaffed", () => { expect(computeStaffShiftPatternMetrics([makeRecord({ staffing_level: "critically_understaffed" })]).critically_understaffed_count).toBe(1); });
    it("returns 100% boolean rates with defaults", () => { 
      const m = computeStaffShiftPatternMetrics([makeRecord()]);
      expect(m.rest_period_rate).toBe(100);
      expect(m.working_time_rate).toBe(100);
      expect(m.lone_working_rate).toBe(100);
      expect(m.handover_rate).toBe(100);
      expect(m.break_taken_rate).toBe(100);
      expect(m.training_current_rate).toBe(100);
      expect(m.dbs_current_rate).toBe(100);
      expect(m.first_aid_rate).toBe(100);
      expect(m.medication_trained_rate).toBe(100);
      expect(m.supervision_rate).toBe(100);
      expect(m.wellbeing_rate).toBe(100);
      expect(m.recorded_promptly_rate).toBe(100);
    });
    it("rest_period_rate 0 when false", () => { expect(computeStaffShiftPatternMetrics([makeRecord({ rest_period_compliant: false })]).rest_period_rate).toBe(0); });
    it("mixed boolean rate", () => { const m = computeStaffShiftPatternMetrics([makeRecord({ handover_completed: true }), makeRecord({ handover_completed: false }), makeRecord({ handover_completed: true })]); expect(m.handover_rate).toBe(66.7); });
    it("average_shift_duration correct", () => { const m = computeStaffShiftPatternMetrics([makeRecord({ shift_duration_hours: 6 }), makeRecord({ shift_duration_hours: 12 })]); expect(m.average_shift_duration).toBe(9); });
    it("unique_staff distinct", () => { const m = computeStaffShiftPatternMetrics([makeRecord({ staff_name: "A" }), makeRecord({ staff_name: "B" }), makeRecord({ staff_name: "A" })]); expect(m.unique_staff).toBe(2); });
    it("counts all 10 shift types", () => { const types = ["early_morning","morning","afternoon","evening","night","sleep_in","waking_night","split_shift","double_shift","other"] as const; const records = types.map(t => makeRecord({ shift_type: t })); const m = computeStaffShiftPatternMetrics(records); for (const t of types) expect(m.by_shift_type[t]).toBe(1); });
    it("counts all 5 fatigue risks", () => { const risks = ["very_low","low","moderate","high","critical"] as const; const records = risks.map(r => makeRecord({ fatigue_risk: r })); const m = computeStaffShiftPatternMetrics(records); for (const r of risks) expect(m.by_fatigue_risk[r]).toBe(1); });
    it("counts all 5 staffing levels", () => { const levels = ["over_staffed","fully_staffed","adequate","understaffed","critically_understaffed"] as const; const records = levels.map(l => makeRecord({ staffing_level: l })); const m = computeStaffShiftPatternMetrics(records); for (const l of levels) expect(m.by_staffing_level[l]).toBe(1); });
    it("counts all 5 shift compliances", () => { const compliances = ["fully_compliant","minor_issues","significant_issues","non_compliant","not_assessed"] as const; const records = compliances.map(c => makeRecord({ shift_compliance: c })); const m = computeStaffShiftPatternMetrics(records); for (const c of compliances) expect(m.by_shift_compliance[c]).toBe(1); });
  });

  describe("identifyStaffShiftPatternAlerts", () => {
    it("returns empty for clean", () => { expect(identifyStaffShiftPatternAlerts([makeRecord()])).toEqual([]); });
    it("returns empty for empty", () => { expect(identifyStaffShiftPatternAlerts([])).toEqual([]); });
    it("fires critical_fatigue_no_rest", () => { 
      const a = identifyStaffShiftPatternAlerts([makeRecord({ fatigue_risk: "critical", rest_period_compliant: false, staff_name: "Jo", shift_date: "2026-05-14" })]);
      expect(a[0].type).toBe("critical_fatigue_no_rest");
      expect(a[0].severity).toBe("critical");
      expect(a[0].message).toContain("Jo");
    });
    it("critical_fatigue_no_rest per-record", () => { const a = identifyStaffShiftPatternAlerts([makeRecord({ id: "a-1", fatigue_risk: "critical", rest_period_compliant: false }), makeRecord({ id: "a-2", fatigue_risk: "critical", rest_period_compliant: false })]); expect(a.filter(x => x.type === "critical_fatigue_no_rest")).toHaveLength(2); });
    it("critical fatigue with rest no critical alert", () => { expect(identifyStaffShiftPatternAlerts([makeRecord({ fatigue_risk: "critical", rest_period_compliant: true })]).find(x => x.type === "critical_fatigue_no_rest")).toBeUndefined(); });
    it("high fatigue without rest no critical alert", () => { expect(identifyStaffShiftPatternAlerts([makeRecord({ fatigue_risk: "high", rest_period_compliant: false })]).find(x => x.type === "critical_fatigue_no_rest")).toBeUndefined(); });
    it("fires critically_understaffed singular", () => { 
      const a = identifyStaffShiftPatternAlerts([makeRecord({ staffing_level: "critically_understaffed" })]);
      const f = a.find(x => x.type === "critically_understaffed");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 shift is");
    });
    it("critically_understaffed plural", () => { const a = identifyStaffShiftPatternAlerts([makeRecord({ staffing_level: "critically_understaffed" }), makeRecord({ staffing_level: "critically_understaffed" })]); const f = a.find(x => x.type === "critically_understaffed"); expect(f!.message).toContain("2 shifts are"); });
    it("fires working_time_breached singular", () => { 
      const a = identifyStaffShiftPatternAlerts([makeRecord({ working_time_directive_met: false })]);
      const f = a.find(x => x.type === "working_time_breached");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 shift has");
    });
    it("working_time_breached plural", () => { const a = identifyStaffShiftPatternAlerts([makeRecord({ working_time_directive_met: false }), makeRecord({ working_time_directive_met: false })]); const f = a.find(x => x.type === "working_time_breached"); expect(f!.message).toContain("2 shifts have"); });
    it("lone_working_not_assessed not for 1", () => { expect(identifyStaffShiftPatternAlerts([makeRecord({ lone_working_risk_assessed: false })]).find(x => x.type === "lone_working_not_assessed")).toBeUndefined(); });
    it("lone_working_not_assessed fires for 2", () => { const a = identifyStaffShiftPatternAlerts([makeRecord({ lone_working_risk_assessed: false }), makeRecord({ lone_working_risk_assessed: false })]); expect(a.find(x => x.type === "lone_working_not_assessed")).toBeDefined(); expect(a.find(x => x.type === "lone_working_not_assessed")!.severity).toBe("medium"); });
    it("handover_not_completed not for 1", () => { expect(identifyStaffShiftPatternAlerts([makeRecord({ handover_completed: false })]).find(x => x.type === "handover_not_completed")).toBeUndefined(); });
    it("handover_not_completed fires for 2", () => { const a = identifyStaffShiftPatternAlerts([makeRecord({ handover_completed: false }), makeRecord({ handover_completed: false })]); expect(a.find(x => x.type === "handover_not_completed")).toBeDefined(); expect(a.find(x => x.type === "handover_not_completed")!.severity).toBe("medium"); });
    it("fires all applicable", () => { 
      const a = identifyStaffShiftPatternAlerts([makeRecord({ fatigue_risk: "critical", rest_period_compliant: false, staffing_level: "critically_understaffed", working_time_directive_met: false, lone_working_risk_assessed: false, handover_completed: false }), makeRecord({ working_time_directive_met: false, lone_working_risk_assessed: false, handover_completed: false })]);
      const types = a.map(x => x.type);
      expect(types).toContain("critical_fatigue_no_rest");
      expect(types).toContain("critically_understaffed");
      expect(types).toContain("working_time_breached");
      expect(types).toContain("lone_working_not_assessed");
      expect(types).toContain("handover_not_completed");
    });
  });
});
