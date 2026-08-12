import { describe, it, expect } from "vitest";
import { _testing, type SelfHarmRiskMonitoringRecord } from "../self-harm-risk-monitoring-service";
import { todayStr } from "@/lib/utils";

const { computeSelfHarmRiskMetrics, identifySelfHarmRiskAlerts } = _testing;

const now = new Date(todayStr());

function makeRecord(overrides?: Partial<SelfHarmRiskMonitoringRecord>): SelfHarmRiskMonitoringRecord {
  return {
    id: overrides?.id ?? "a-1", home_id: overrides?.home_id ?? "home-1",
    risk_level: overrides?.risk_level ?? "medium",
    intervention_type: overrides?.intervention_type ?? "therapeutic_conversation",
    safety_plan_status: overrides?.safety_plan_status ?? "active_reviewed",
    trigger_type: overrides?.trigger_type ?? "peer_conflict",
    monitoring_date: overrides?.monitoring_date ?? todayStr(),
    child_name: overrides?.child_name ?? "Child A",
    child_id: "child_id" in (overrides ?? {}) ? (overrides!.child_id ?? null) : null,
    monitored_by: overrides?.monitored_by ?? "Staff A",
    child_engaged: overrides?.child_engaged ?? true,
    safety_plan_shared: overrides?.safety_plan_shared ?? true,
    camhs_involved: overrides?.camhs_involved ?? true,
    gp_informed: overrides?.gp_informed ?? true,
    social_worker_informed: overrides?.social_worker_informed ?? true,
    parent_informed: overrides?.parent_informed ?? true,
    environment_checked: overrides?.environment_checked ?? true,
    means_restriction_applied: overrides?.means_restriction_applied ?? true,
    observation_level_set: overrides?.observation_level_set ?? true,
    staff_trained: overrides?.staff_trained ?? true,
    care_plan_updated: overrides?.care_plan_updated ?? true,
    recorded_promptly: overrides?.recorded_promptly ?? true,
    issues_found: overrides?.issues_found ?? [], actions_taken: overrides?.actions_taken ?? [],
    next_review_date: "next_review_date" in (overrides ?? {}) ? (overrides!.next_review_date ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: overrides?.created_at ?? now.toISOString(), updated_at: overrides?.updated_at ?? now.toISOString(),
  };
}

describe("self-harm-risk-monitoring-service", () => {
  describe("computeSelfHarmRiskMetrics", () => {
    it("returns zeros for empty", () => { 
      const m = computeSelfHarmRiskMetrics([]);
      expect(m.total_records).toBe(0);;
      expect(m.critical_count).toBe(0);
      expect(m.high_count).toBe(0);
      expect(m.no_safety_plan_count).toBe(0);
      expect(m.needs_review_count).toBe(0);
      expect(m.child_engaged_rate).toBeNull();;
      expect(m.unique_children).toBe(0);
    });
    it("returns empty breakdowns", () => { 
      const m = computeSelfHarmRiskMetrics([]);
      expect(m.by_risk_level).toEqual({});
      expect(m.by_intervention_type).toEqual({});
      expect(m.by_safety_plan_status).toEqual({});
      expect(m.by_trigger_type).toEqual({});
    });
    it("total_records counts records", () => { expect(computeSelfHarmRiskMetrics([makeRecord(), makeRecord()]).total_records).toBe(2); });
    it("counts critical", () => { expect(computeSelfHarmRiskMetrics([makeRecord({ risk_level: "critical" })]).critical_count).toBe(1); });
    it("counts high", () => { expect(computeSelfHarmRiskMetrics([makeRecord({ risk_level: "high" })]).high_count).toBe(1); });
    it("does not count medium as high", () => { expect(computeSelfHarmRiskMetrics([makeRecord({ risk_level: "medium" })]).high_count).toBe(0); });
    it("counts no_safety_plan", () => { expect(computeSelfHarmRiskMetrics([makeRecord({ safety_plan_status: "not_in_place" })]).no_safety_plan_count).toBe(1); });
    it("counts needs_review", () => { expect(computeSelfHarmRiskMetrics([makeRecord({ safety_plan_status: "active_needs_review" })]).needs_review_count).toBe(1); });
    it("returns 100% boolean rates with defaults", () => { 
      const m = computeSelfHarmRiskMetrics([makeRecord()]);
      expect(m.child_engaged_rate).toBe(100);
      expect(m.safety_plan_shared_rate).toBe(100);
      expect(m.camhs_involved_rate).toBe(100);
      expect(m.gp_informed_rate).toBe(100);
      expect(m.social_worker_informed_rate).toBe(100);
      expect(m.parent_informed_rate).toBe(100);
      expect(m.environment_checked_rate).toBe(100);
      expect(m.means_restriction_rate).toBe(100);
      expect(m.observation_level_rate).toBe(100);
      expect(m.staff_trained_rate).toBe(100);
      expect(m.care_plan_updated_rate).toBe(100);
      expect(m.recorded_promptly_rate).toBe(100);
    });
    it("child_engaged_rate 0 when false", () => { expect(computeSelfHarmRiskMetrics([makeRecord({ child_engaged: false })]).child_engaged_rate).toBe(0); });
    it("mixed boolean rate", () => { const m = computeSelfHarmRiskMetrics([makeRecord({ camhs_involved: true }), makeRecord({ camhs_involved: false }), makeRecord({ camhs_involved: true })]); expect(m.camhs_involved_rate).toBe(66.7); });
    it("unique_children distinct", () => { const m = computeSelfHarmRiskMetrics([makeRecord({ child_name: "A" }), makeRecord({ child_name: "B" }), makeRecord({ child_name: "A" })]); expect(m.unique_children).toBe(2); });
    it("counts all 5 risk levels", () => { const levels = ["critical","high","medium","low","resolved"] as const; const records = levels.map(l => makeRecord({ risk_level: l })); const m = computeSelfHarmRiskMetrics(records); for (const l of levels) expect(m.by_risk_level[l]).toBe(1); });
    it("counts all 10 intervention types", () => { const types = ["therapeutic_conversation","safety_plan_review","camhs_referral","crisis_team_contact","one_to_one_support","environmental_safety","medication_review","distraction_technique","peer_support","other"] as const; const records = types.map(t => makeRecord({ intervention_type: t })); const m = computeSelfHarmRiskMetrics(records); for (const t of types) expect(m.by_intervention_type[t]).toBe(1); });
    it("counts all 5 safety plan statuses", () => { const statuses = ["active_reviewed","active_needs_review","being_developed","not_in_place","not_required"] as const; const records = statuses.map(s => makeRecord({ safety_plan_status: s })); const m = computeSelfHarmRiskMetrics(records); for (const s of statuses) expect(m.by_safety_plan_status[s]).toBe(1); });
    it("counts all 10 trigger types", () => { const triggers = ["family_contact","peer_conflict","school_pressure","anniversary_date","placement_change","trauma_reminder","social_media","unknown","multiple_triggers","other"] as const; const records = triggers.map(t => makeRecord({ trigger_type: t })); const m = computeSelfHarmRiskMetrics(records); for (const t of triggers) expect(m.by_trigger_type[t]).toBe(1); });
  });

  describe("identifySelfHarmRiskAlerts", () => {
    it("returns empty for clean", () => { expect(identifySelfHarmRiskAlerts([makeRecord()])).toEqual([]); });
    it("returns empty for empty", () => { expect(identifySelfHarmRiskAlerts([])).toEqual([]); });
    it("fires critical_no_safety_plan", () => { 
      const a = identifySelfHarmRiskAlerts([makeRecord({ risk_level: "critical", safety_plan_status: "not_in_place", child_name: "Jo" })]);
      expect(a[0].type).toBe("critical_no_safety_plan");
      expect(a[0].severity).toBe("critical");
      expect(a[0].message).toContain("Jo");
    });
    it("critical_no_safety_plan per-record", () => { const a = identifySelfHarmRiskAlerts([makeRecord({ id: "a-1", risk_level: "critical", safety_plan_status: "not_in_place" }), makeRecord({ id: "a-2", risk_level: "critical", safety_plan_status: "not_in_place" })]); expect(a.filter(x => x.type === "critical_no_safety_plan")).toHaveLength(2); });
    it("critical with active plan no alert", () => { expect(identifySelfHarmRiskAlerts([makeRecord({ risk_level: "critical", safety_plan_status: "active_reviewed" })]).find(x => x.type === "critical_no_safety_plan")).toBeUndefined(); });
    it("high with not_in_place no critical alert", () => { expect(identifySelfHarmRiskAlerts([makeRecord({ risk_level: "high", safety_plan_status: "not_in_place" })]).find(x => x.type === "critical_no_safety_plan")).toBeUndefined(); });
    it("fires camhs_not_involved for critical", () => { 
      const a = identifySelfHarmRiskAlerts([makeRecord({ risk_level: "critical", camhs_involved: false })]);
      const f = a.find(x => x.type === "camhs_not_involved");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 high/critical risk record has");
    });
    it("fires camhs_not_involved for high", () => { const a = identifySelfHarmRiskAlerts([makeRecord({ risk_level: "high", camhs_involved: false })]); expect(a.find(x => x.type === "camhs_not_involved")).toBeDefined(); });
    it("camhs_not_involved plural", () => { const a = identifySelfHarmRiskAlerts([makeRecord({ risk_level: "critical", camhs_involved: false }), makeRecord({ risk_level: "high", camhs_involved: false })]); const f = a.find(x => x.type === "camhs_not_involved"); expect(f!.message).toContain("2 high/critical risk records have"); });
    it("camhs not involved for medium no alert", () => { expect(identifySelfHarmRiskAlerts([makeRecord({ risk_level: "medium", camhs_involved: false })]).find(x => x.type === "camhs_not_involved")).toBeUndefined(); });
    it("fires staff_not_trained singular", () => { 
      const a = identifySelfHarmRiskAlerts([makeRecord({ staff_trained: false })]);
      const f = a.find(x => x.type === "staff_not_trained");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 monitoring record shows");
    });
    it("staff_not_trained plural", () => { const a = identifySelfHarmRiskAlerts([makeRecord({ staff_trained: false }), makeRecord({ staff_trained: false })]); const f = a.find(x => x.type === "staff_not_trained"); expect(f!.message).toContain("2 monitoring records show"); });
    it("environment_not_checked not for 1", () => { expect(identifySelfHarmRiskAlerts([makeRecord({ environment_checked: false })]).find(x => x.type === "environment_not_checked")).toBeUndefined(); });
    it("environment_not_checked fires for 2", () => { const a = identifySelfHarmRiskAlerts([makeRecord({ environment_checked: false }), makeRecord({ environment_checked: false })]); expect(a.find(x => x.type === "environment_not_checked")).toBeDefined(); expect(a.find(x => x.type === "environment_not_checked")!.severity).toBe("medium"); });
    it("no_means_restriction not for 1", () => { expect(identifySelfHarmRiskAlerts([makeRecord({ means_restriction_applied: false })]).find(x => x.type === "no_means_restriction")).toBeUndefined(); });
    it("no_means_restriction fires for 2", () => { const a = identifySelfHarmRiskAlerts([makeRecord({ means_restriction_applied: false }), makeRecord({ means_restriction_applied: false })]); expect(a.find(x => x.type === "no_means_restriction")).toBeDefined(); expect(a.find(x => x.type === "no_means_restriction")!.severity).toBe("medium"); });
    it("fires all applicable", () => { 
      const a = identifySelfHarmRiskAlerts([makeRecord({ risk_level: "critical", safety_plan_status: "not_in_place", camhs_involved: false, staff_trained: false, environment_checked: false, means_restriction_applied: false }), makeRecord({ risk_level: "high", camhs_involved: false, staff_trained: false, environment_checked: false, means_restriction_applied: false })]);
      const types = a.map(x => x.type);
      expect(types).toContain("critical_no_safety_plan");
      expect(types).toContain("camhs_not_involved");
      expect(types).toContain("staff_not_trained");
      expect(types).toContain("environment_not_checked");
      expect(types).toContain("no_means_restriction");
    });
  });
});
