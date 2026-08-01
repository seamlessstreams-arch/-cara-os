import { describe, it, expect } from "vitest";
import { _testing, type StaffBurnoutIndicatorRecord } from "../staff-burnout-indicator-service";

const { computeBurnoutMetrics, identifyBurnoutAlerts } = _testing;

const now = new Date(new Date().toISOString().split("T")[0]);

function makeRecord(overrides?: Partial<StaffBurnoutIndicatorRecord>): StaffBurnoutIndicatorRecord {
  return {
    id: overrides?.id ?? "a-1", home_id: overrides?.home_id ?? "home-1",
    indicator_type: overrides?.indicator_type ?? "emotional_exhaustion",
    burnout_severity: overrides?.burnout_severity ?? "early_sign",
    support_status: overrides?.support_status ?? "resolved",
    impact_level: overrides?.impact_level ?? "low",
    session_date: overrides?.session_date ?? now.toISOString().split("T")[0],
    staff_name: overrides?.staff_name ?? "Staff A",
    staff_id: "staff_id" in (overrides ?? {}) ? (overrides!.staff_id ?? null) : null,
    observed_by: overrides?.observed_by ?? "Manager A",
    description: overrides?.description ?? "Test",
    evidence_summary: overrides?.evidence_summary ?? "Test",
    possible_causes: "possible_causes" in (overrides ?? {}) ? (overrides!.possible_causes ?? null) : null,
    support_offered_detail: "support_offered_detail" in (overrides ?? {}) ? (overrides!.support_offered_detail ?? null) : null,
    staff_response: "staff_response" in (overrides ?? {}) ? (overrides!.staff_response ?? null) : null,
    staff_aware: overrides?.staff_aware ?? true,
    manager_aware: overrides?.manager_aware ?? true,
    support_offered: overrides?.support_offered ?? true,
    wellbeing_check_done: overrides?.wellbeing_check_done ?? true,
    supervision_adjusted: overrides?.supervision_adjusted ?? true,
    workload_reviewed: overrides?.workload_reviewed ?? true,
    leave_offered: overrides?.leave_offered ?? true,
    occupational_health_referred: overrides?.occupational_health_referred ?? true,
    peer_support_arranged: overrides?.peer_support_arranged ?? true,
    care_plan_reflects: overrides?.care_plan_reflects ?? true,
    team_informed: overrides?.team_informed ?? true,
    recorded_promptly: overrides?.recorded_promptly ?? true,
    issues_found: overrides?.issues_found ?? [], actions_taken: overrides?.actions_taken ?? [],
    next_review_date: "next_review_date" in (overrides ?? {}) ? (overrides!.next_review_date ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: overrides?.created_at ?? now.toISOString(), updated_at: overrides?.updated_at ?? now.toISOString(),
  };
}

describe("staff-burnout-indicator-service", () => {
  describe("computeBurnoutMetrics", () => {
    it("returns zeros for empty", () => { 
      const m = computeBurnoutMetrics([]);
      expect(m.total_indicators).toBe(0);;
      expect(m.critical_count).toBe(0);
      expect(m.concerning_count).toBe(0);
      expect(m.unresolved_count).toBe(0);
      expect(m.escalated_count).toBe(0);
      expect(m.staff_aware_rate).toBeNull();;
      expect(m.unique_staff).toBe(0);
    });
    it("returns empty breakdowns", () => { 
      const m = computeBurnoutMetrics([]);
      expect(m.by_indicator_type).toEqual({});
      expect(m.by_burnout_severity).toEqual({});
      expect(m.by_support_status).toEqual({});
      expect(m.by_impact_level).toEqual({});
    });
    it("total_indicators counts records", () => { expect(computeBurnoutMetrics([makeRecord(), makeRecord()]).total_indicators).toBe(2); });
    it("counts critical", () => { expect(computeBurnoutMetrics([makeRecord({ burnout_severity: "critical" })]).critical_count).toBe(1); });
    it("does not count concerning as critical", () => { expect(computeBurnoutMetrics([makeRecord({ burnout_severity: "concerning" })]).critical_count).toBe(0); });
    it("counts concerning as concerning", () => { expect(computeBurnoutMetrics([makeRecord({ burnout_severity: "concerning" })]).concerning_count).toBe(1); });
    it("counts critical as concerning", () => { expect(computeBurnoutMetrics([makeRecord({ burnout_severity: "critical" })]).concerning_count).toBe(1); });
    it("does not count developing as concerning", () => { expect(computeBurnoutMetrics([makeRecord({ burnout_severity: "developing" })]).concerning_count).toBe(0); });
    it("counts monitoring as unresolved", () => { expect(computeBurnoutMetrics([makeRecord({ support_status: "monitoring" })]).unresolved_count).toBe(1); });
    it("counts supporting as unresolved", () => { expect(computeBurnoutMetrics([makeRecord({ support_status: "supporting" })]).unresolved_count).toBe(1); });
    it("counts escalated as unresolved", () => { expect(computeBurnoutMetrics([makeRecord({ support_status: "escalated" })]).unresolved_count).toBe(1); });
    it("does not count resolved as unresolved", () => { expect(computeBurnoutMetrics([makeRecord({ support_status: "resolved" })]).unresolved_count).toBe(0); });
    it("counts escalated", () => { expect(computeBurnoutMetrics([makeRecord({ support_status: "escalated" })]).escalated_count).toBe(1); });
    it("returns 100% boolean rates with defaults", () => { 
      const m = computeBurnoutMetrics([makeRecord()]);
      expect(m.staff_aware_rate).toBe(100);
      expect(m.manager_aware_rate).toBe(100);
      expect(m.support_offered_rate).toBe(100);
      expect(m.wellbeing_check_rate).toBe(100);
      expect(m.supervision_adjusted_rate).toBe(100);
      expect(m.workload_reviewed_rate).toBe(100);
      expect(m.leave_offered_rate).toBe(100);
      expect(m.occupational_health_rate).toBe(100);
      expect(m.peer_support_rate).toBe(100);
      expect(m.care_plan_rate).toBe(100);
      expect(m.team_informed_rate).toBe(100);
      expect(m.recorded_promptly_rate).toBe(100);
    });
    it("staff_aware_rate 0 when false", () => { expect(computeBurnoutMetrics([makeRecord({ staff_aware: false })]).staff_aware_rate).toBe(0); });
    it("mixed boolean rate", () => { const m = computeBurnoutMetrics([makeRecord({ wellbeing_check_done: true }), makeRecord({ wellbeing_check_done: false }), makeRecord({ wellbeing_check_done: true })]); expect(m.wellbeing_check_rate).toBe(66.7); });
    it("unique_staff distinct", () => { const m = computeBurnoutMetrics([makeRecord({ staff_name: "A" }), makeRecord({ staff_name: "B" }), makeRecord({ staff_name: "A" })]); expect(m.unique_staff).toBe(2); });
    it("counts all 10 indicator types", () => { const types = ["emotional_exhaustion","depersonalisation","reduced_accomplishment","increased_absence","quality_decline","withdrawal","cynicism","physical_symptoms","workload_overwhelm","compassion_fatigue"] as const; const records = types.map(t => makeRecord({ indicator_type: t })); const m = computeBurnoutMetrics(records); for (const t of types) expect(m.by_indicator_type[t]).toBe(1); });
    it("counts all 5 severities", () => { const sevs = ["early_sign","developing","concerning","critical","resolved"] as const; const records = sevs.map(s => makeRecord({ burnout_severity: s })); const m = computeBurnoutMetrics(records); for (const s of sevs) expect(m.by_burnout_severity[s]).toBe(1); });
    it("counts all 5 support statuses", () => { const stats = ["monitoring","supporting","improving","escalated","resolved"] as const; const records = stats.map(s => makeRecord({ support_status: s })); const m = computeBurnoutMetrics(records); for (const s of stats) expect(m.by_support_status[s]).toBe(1); });
    it("counts all 5 impact levels", () => { const levels = ["minimal","low","moderate","high","severe"] as const; const records = levels.map(l => makeRecord({ impact_level: l })); const m = computeBurnoutMetrics(records); for (const l of levels) expect(m.by_impact_level[l]).toBe(1); });
  });

  describe("identifyBurnoutAlerts", () => {
    it("returns empty for clean", () => { expect(identifyBurnoutAlerts([makeRecord()])).toEqual([]); });
    it("returns empty for empty", () => { expect(identifyBurnoutAlerts([])).toEqual([]); });
    it("fires critical_unsupported", () => { 
      const a = identifyBurnoutAlerts([makeRecord({ burnout_severity: "critical", support_status: "monitoring", staff_name: "Jo" })]);
      expect(a[0].type).toBe("critical_unsupported");
      expect(a[0].severity).toBe("critical");
      expect(a[0].message).toContain("Jo");
    });
    it("critical_unsupported per-record", () => { const a = identifyBurnoutAlerts([makeRecord({ id: "a-1", burnout_severity: "critical", support_status: "monitoring" }), makeRecord({ id: "a-2", burnout_severity: "critical", support_status: "monitoring" })]); expect(a.filter(x => x.type === "critical_unsupported")).toHaveLength(2); });
    it("no critical when supporting", () => { expect(identifyBurnoutAlerts([makeRecord({ burnout_severity: "critical", support_status: "supporting" })]).find(x => x.type === "critical_unsupported")).toBeUndefined(); });
    it("no critical for early_sign", () => { expect(identifyBurnoutAlerts([makeRecord({ burnout_severity: "early_sign", support_status: "monitoring" })]).find(x => x.type === "critical_unsupported")).toBeUndefined(); });
    it("fires staff_not_aware singular", () => { 
      const a = identifyBurnoutAlerts([makeRecord({ staff_aware: false })]);
      const f = a.find(x => x.type === "staff_not_aware");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 indicator has");
    });
    it("staff_not_aware plural", () => { const a = identifyBurnoutAlerts([makeRecord({ staff_aware: false }), makeRecord({ staff_aware: false })]); const f = a.find(x => x.type === "staff_not_aware"); expect(f!.message).toContain("2 indicators have"); });
    it("fires no_wellbeing_check singular", () => { 
      const a = identifyBurnoutAlerts([makeRecord({ wellbeing_check_done: false })]);
      const f = a.find(x => x.type === "no_wellbeing_check");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 indicator has");
    });
    it("no_workload_review not for 1", () => { expect(identifyBurnoutAlerts([makeRecord({ workload_reviewed: false })]).find(x => x.type === "no_workload_review")).toBeUndefined(); });
    it("no_workload_review fires for 2", () => { const a = identifyBurnoutAlerts([makeRecord({ workload_reviewed: false }), makeRecord({ workload_reviewed: false })]); expect(a.find(x => x.type === "no_workload_review")).toBeDefined(); expect(a.find(x => x.type === "no_workload_review")!.severity).toBe("medium"); });
    it("no_peer_support not for 1", () => { expect(identifyBurnoutAlerts([makeRecord({ peer_support_arranged: false })]).find(x => x.type === "no_peer_support")).toBeUndefined(); });
    it("no_peer_support fires for 2", () => { const a = identifyBurnoutAlerts([makeRecord({ peer_support_arranged: false }), makeRecord({ peer_support_arranged: false })]); expect(a.find(x => x.type === "no_peer_support")).toBeDefined(); expect(a.find(x => x.type === "no_peer_support")!.severity).toBe("medium"); });
    it("fires all applicable", () => { 
      const a = identifyBurnoutAlerts([makeRecord({ burnout_severity: "critical", support_status: "monitoring", staff_aware: false, wellbeing_check_done: false, workload_reviewed: false, peer_support_arranged: false }), makeRecord({ staff_aware: false, wellbeing_check_done: false, workload_reviewed: false, peer_support_arranged: false })]);
      const types = a.map(x => x.type);
      expect(types).toContain("critical_unsupported");
      expect(types).toContain("staff_not_aware");
      expect(types).toContain("no_wellbeing_check");
      expect(types).toContain("no_workload_review");
      expect(types).toContain("no_peer_support");
    });
  });
});
