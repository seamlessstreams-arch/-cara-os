import { describe, it, expect } from "vitest";
import { _testing, type StaffPerformanceDipRecord } from "../staff-performance-dip-service";
import { todayStr } from "@/lib/utils";

const { computePerformanceDipMetrics, identifyPerformanceDipAlerts } = _testing;

const now = new Date(todayStr());

function makeRecord(overrides?: Partial<StaffPerformanceDipRecord>): StaffPerformanceDipRecord {
  return {
    id: "a-1", home_id: "home-1",
    dip_category: "recording_quality",
    dip_severity: "possible_dip",
    dip_status: "resolved",
    frequency_pattern: "one_off",
    session_date: todayStr(),
    staff_name: "Staff A",
    staff_id: "staff_id" in (overrides ?? {}) ? (overrides!.staff_id ?? null) : null,
    identified_by: "Manager A",
    description: "Test",
    evidence_summary: "Test",
    possible_triggers: "possible_triggers" in (overrides ?? {}) ? (overrides!.possible_triggers ?? null) : null,
    support_offered_detail: "support_offered_detail" in (overrides ?? {}) ? (overrides!.support_offered_detail ?? null) : null,
    manager_response: "manager_response" in (overrides ?? {}) ? (overrides!.manager_response ?? null) : null,
    staff_response: "staff_response" in (overrides ?? {}) ? (overrides!.staff_response ?? null) : null,
    evidence_documented: true,
    manager_aware: true,
    staff_informed: true,
    support_offered: true,
    triggers_explored: true,
    supervision_discussed: true,
    training_considered: true,
    wellbeing_assessed: true,
    action_plan_created: true,
    staff_responded: true,
    follow_up_scheduled: true,
    recorded_promptly: true,
    issues_found: [], actions_taken: [],
    next_review_date: "next_review_date" in (overrides ?? {}) ? (overrides!.next_review_date ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: now.toISOString(), updated_at: now.toISOString(),
      // Overrides win last: an explicit null stays null — the old
    // `overrides?.x ?? default` fabricated answers inside the factory.
    ...overrides,
  };
}

describe("staff-performance-dip-service", () => {
  describe("computePerformanceDipMetrics", () => {
    it("returns zeros for empty", () => { 
      const m = computePerformanceDipMetrics([]);
      expect(m.total_dips).toBe(0);;
      expect(m.manager_review_count).toBe(0);
      expect(m.support_recommended_count).toBe(0);
      expect(m.unresolved_count).toBe(0);
      expect(m.escalated_count).toBe(0);
      expect(m.evidence_documented_rate).toBeNull();;
      expect(m.unique_staff).toBe(0);
    });
    it("returns empty breakdowns", () => { 
      const m = computePerformanceDipMetrics([]);
      expect(m.by_dip_category).toEqual({});
      expect(m.by_dip_severity).toEqual({});
      expect(m.by_dip_status).toEqual({});
      expect(m.by_frequency_pattern).toEqual({});
    });
    it("total_dips counts records", () => { expect(computePerformanceDipMetrics([makeRecord(), makeRecord()]).total_dips).toBe(2); });
    it("counts manager_review_required", () => { expect(computePerformanceDipMetrics([makeRecord({ dip_severity: "manager_review_required" })]).manager_review_count).toBe(1); });
    it("counts support_recommended", () => { expect(computePerformanceDipMetrics([makeRecord({ dip_severity: "support_recommended" })]).support_recommended_count).toBe(1); });
    it("counts identified as unresolved", () => { expect(computePerformanceDipMetrics([makeRecord({ dip_status: "identified" })]).unresolved_count).toBe(1); });
    it("counts exploring as unresolved", () => { expect(computePerformanceDipMetrics([makeRecord({ dip_status: "exploring" })]).unresolved_count).toBe(1); });
    it("counts supporting as unresolved", () => { expect(computePerformanceDipMetrics([makeRecord({ dip_status: "supporting" })]).unresolved_count).toBe(1); });
    it("does not count resolved as unresolved", () => { expect(computePerformanceDipMetrics([makeRecord({ dip_status: "resolved" })]).unresolved_count).toBe(0); });
    it("counts escalated", () => { expect(computePerformanceDipMetrics([makeRecord({ dip_status: "escalated" })]).escalated_count).toBe(1); });
    it("returns 100% boolean rates with defaults", () => { 
      const m = computePerformanceDipMetrics([makeRecord()]);
      expect(m.evidence_documented_rate).toBe(100);
      expect(m.manager_aware_rate).toBe(100);
      expect(m.staff_informed_rate).toBe(100);
      expect(m.support_offered_rate).toBe(100);
      expect(m.triggers_explored_rate).toBe(100);
      expect(m.supervision_discussed_rate).toBe(100);
      expect(m.training_considered_rate).toBe(100);
      expect(m.wellbeing_assessed_rate).toBe(100);
      expect(m.action_plan_rate).toBe(100);
      expect(m.staff_responded_rate).toBe(100);
      expect(m.follow_up_scheduled_rate).toBe(100);
      expect(m.recorded_promptly_rate).toBe(100);
    });
    it("staff_informed_rate 0 when false", () => { expect(computePerformanceDipMetrics([makeRecord({ staff_informed: false })]).staff_informed_rate).toBe(0); });
    it("mixed boolean rate", () => { const m = computePerformanceDipMetrics([makeRecord({ support_offered: true }), makeRecord({ support_offered: false }), makeRecord({ support_offered: true })]); expect(m.support_offered_rate).toBe(66.7); });
    it("unique_staff distinct", () => { const m = computePerformanceDipMetrics([makeRecord({ staff_name: "A" }), makeRecord({ staff_name: "B" }), makeRecord({ staff_name: "A" })]); expect(m.unique_staff).toBe(2); });
    it("counts all 10 dip categories", () => { const cats = ["recording_quality","engagement_quality","timeliness","incident_response","care_plan_compliance","medication_accuracy","safeguarding_practice","communication","team_collaboration","child_relationship"] as const; const records = cats.map(c => makeRecord({ dip_category: c })); const m = computePerformanceDipMetrics(records); for (const c of cats) expect(m.by_dip_category[c]).toBe(1); });
    it("counts all 5 severities", () => { const sevs = ["possible_dip","pattern_emerging","needs_exploration","support_recommended","manager_review_required"] as const; const records = sevs.map(s => makeRecord({ dip_severity: s })); const m = computePerformanceDipMetrics(records); for (const s of sevs) expect(m.by_dip_severity[s]).toBe(1); });
    it("counts all 5 statuses", () => { const stats = ["identified","exploring","supporting","resolved","escalated"] as const; const records = stats.map(s => makeRecord({ dip_status: s })); const m = computePerformanceDipMetrics(records); for (const s of stats) expect(m.by_dip_status[s]).toBe(1); });
    it("counts all 5 frequency patterns", () => { const pats = ["one_off","occasional","recurring","persistent","unknown"] as const; const records = pats.map(p => makeRecord({ frequency_pattern: p })); const m = computePerformanceDipMetrics(records); for (const p of pats) expect(m.by_frequency_pattern[p]).toBe(1); });
  });

  describe("identifyPerformanceDipAlerts", () => {
    it("returns empty for clean", () => { expect(identifyPerformanceDipAlerts([makeRecord()])).toEqual([]); });
    it("returns empty for empty", () => { expect(identifyPerformanceDipAlerts([])).toEqual([]); });
    it("fires unreviewed_serious", () => { 
      const a = identifyPerformanceDipAlerts([makeRecord({ dip_severity: "manager_review_required", dip_status: "identified", staff_name: "Jo" })]);
      expect(a[0].type).toBe("unreviewed_serious");
      expect(a[0].severity).toBe("critical");
      expect(a[0].message).toContain("Jo");
    });
    it("unreviewed_serious for support_recommended + exploring", () => { const a = identifyPerformanceDipAlerts([makeRecord({ dip_severity: "support_recommended", dip_status: "exploring" })]); expect(a[0].type).toBe("unreviewed_serious"); });
    it("unreviewed_serious per-record", () => { const a = identifyPerformanceDipAlerts([makeRecord({ id: "a-1", dip_severity: "manager_review_required", dip_status: "identified" }), makeRecord({ id: "a-2", dip_severity: "support_recommended", dip_status: "exploring" })]); expect(a.filter(x => x.type === "unreviewed_serious")).toHaveLength(2); });
    it("no critical when resolved", () => { expect(identifyPerformanceDipAlerts([makeRecord({ dip_severity: "manager_review_required", dip_status: "resolved" })]).find(x => x.type === "unreviewed_serious")).toBeUndefined(); });
    it("fires staff_not_informed singular", () => { 
      const a = identifyPerformanceDipAlerts([makeRecord({ staff_informed: false })]);
      const f = a.find(x => x.type === "staff_not_informed");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 dip has");
    });
    it("staff_not_informed plural", () => { const a = identifyPerformanceDipAlerts([makeRecord({ staff_informed: false }), makeRecord({ staff_informed: false })]); const f = a.find(x => x.type === "staff_not_informed"); expect(f!.message).toContain("2 dips have"); });
    it("fires no_support_offered singular", () => { 
      const a = identifyPerformanceDipAlerts([makeRecord({ support_offered: false })]);
      const f = a.find(x => x.type === "no_support_offered");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 dip has");
    });
    it("triggers_not_explored not for 1", () => { expect(identifyPerformanceDipAlerts([makeRecord({ triggers_explored: false })]).find(x => x.type === "triggers_not_explored")).toBeUndefined(); });
    it("triggers_not_explored fires for 2", () => { const a = identifyPerformanceDipAlerts([makeRecord({ triggers_explored: false }), makeRecord({ triggers_explored: false })]); expect(a.find(x => x.type === "triggers_not_explored")).toBeDefined(); expect(a.find(x => x.type === "triggers_not_explored")!.severity).toBe("medium"); });
    it("no_wellbeing_check not for 1", () => { expect(identifyPerformanceDipAlerts([makeRecord({ wellbeing_assessed: false })]).find(x => x.type === "no_wellbeing_check")).toBeUndefined(); });
    it("no_wellbeing_check fires for 2", () => { const a = identifyPerformanceDipAlerts([makeRecord({ wellbeing_assessed: false }), makeRecord({ wellbeing_assessed: false })]); expect(a.find(x => x.type === "no_wellbeing_check")).toBeDefined(); expect(a.find(x => x.type === "no_wellbeing_check")!.severity).toBe("medium"); });
    it("fires all applicable", () => { 
      const a = identifyPerformanceDipAlerts([makeRecord({ dip_severity: "manager_review_required", dip_status: "identified", staff_informed: false, support_offered: false, triggers_explored: false, wellbeing_assessed: false }), makeRecord({ staff_informed: false, support_offered: false, triggers_explored: false, wellbeing_assessed: false })]);
      const types = a.map(x => x.type);
      expect(types).toContain("unreviewed_serious");
      expect(types).toContain("staff_not_informed");
      expect(types).toContain("no_support_offered");
      expect(types).toContain("triggers_not_explored");
      expect(types).toContain("no_wellbeing_check");
    });
  });
});
