import { describe, it, expect } from "vitest";
import { _testing, type OfstedActionPlanRecord } from "../ofsted-action-plan-service";
import { todayStr } from "@/lib/utils";

const { computeOfstedActionPlanMetrics, identifyOfstedActionPlanAlerts } = _testing;

const now = new Date(todayStr());

function makeRecord(overrides?: Partial<OfstedActionPlanRecord>): OfstedActionPlanRecord {
  return {
    id: overrides?.id ?? "a-1", home_id: overrides?.home_id ?? "home-1",
    finding_type: overrides?.finding_type ?? "recommendation",
    action_status: overrides?.action_status ?? "completed",
    finding_priority: overrides?.finding_priority ?? "medium",
    inspection_type: overrides?.inspection_type ?? "full_inspection",
    inspection_date: overrides?.inspection_date ?? todayStr(),
    finding_description: overrides?.finding_description ?? "Improve recording",
    action_plan: overrides?.action_plan ?? "Train staff on recording",
    responsible_person: overrides?.responsible_person ?? "Manager A",
    target_date: overrides?.target_date ?? todayStr(),
    evidence_gathered: overrides?.evidence_gathered ?? true,
    progress_documented: overrides?.progress_documented ?? true,
    staff_briefed: overrides?.staff_briefed ?? true,
    training_provided: overrides?.training_provided ?? true,
    policy_updated: overrides?.policy_updated ?? true,
    practice_changed: overrides?.practice_changed ?? true,
    monitored_by_ri: overrides?.monitored_by_ri ?? true,
    children_informed: overrides?.children_informed ?? true,
    social_worker_notified: overrides?.social_worker_notified ?? true,
    board_informed: overrides?.board_informed ?? true,
    follow_up_inspection_ready: overrides?.follow_up_inspection_ready ?? true,
    regulation_referenced: overrides?.regulation_referenced ?? true,
    issues_found: overrides?.issues_found ?? [], actions_taken: overrides?.actions_taken ?? [],
    completed_by: "completed_by" in (overrides ?? {}) ? (overrides!.completed_by ?? null) : null,
    completion_date: "completion_date" in (overrides ?? {}) ? (overrides!.completion_date ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: overrides?.created_at ?? now.toISOString(), updated_at: overrides?.updated_at ?? now.toISOString(),
  };
}

describe("ofsted-action-plan-service", () => {
  describe("computeOfstedActionPlanMetrics", () => {
    it("returns zeros for empty", () => { 
      const m = computeOfstedActionPlanMetrics([]);
      expect(m.total_findings).toBe(0);;
      expect(m.not_started_count).toBe(0);
      expect(m.in_progress_count).toBe(0);
      expect(m.completed_count).toBe(0);
      expect(m.evidenced_count).toBe(0);
      expect(m.overdue_count).toBe(0);
      expect(m.completion_rate).toBeNull();;
      expect(m.evidence_gathered_rate).toBeNull();;
    });
    it("returns empty breakdowns", () => { 
      const m = computeOfstedActionPlanMetrics([]);
      expect(m.by_finding_type).toEqual({});
      expect(m.by_action_status).toEqual({});
      expect(m.by_finding_priority).toEqual({});
      expect(m.by_inspection_type).toEqual({});
    });
    it("counts not_started", () => { expect(computeOfstedActionPlanMetrics([makeRecord({ action_status: "not_started" })]).not_started_count).toBe(1); });
    it("counts in_progress", () => { expect(computeOfstedActionPlanMetrics([makeRecord({ action_status: "in_progress" })]).in_progress_count).toBe(1); });
    it("counts completed", () => { expect(computeOfstedActionPlanMetrics([makeRecord()]).completed_count).toBe(1); });
    it("counts evidenced", () => { expect(computeOfstedActionPlanMetrics([makeRecord({ action_status: "evidenced" })]).evidenced_count).toBe(1); });
    it("counts overdue", () => { expect(computeOfstedActionPlanMetrics([makeRecord({ action_status: "overdue" })]).overdue_count).toBe(1); });
    it("returns 100% boolean rates with defaults", () => { 
      const m = computeOfstedActionPlanMetrics([makeRecord()]);
      expect(m.evidence_gathered_rate).toBe(100);
      expect(m.progress_documented_rate).toBe(100);
      expect(m.staff_briefed_rate).toBe(100);
      expect(m.training_provided_rate).toBe(100);
      expect(m.policy_updated_rate).toBe(100);
      expect(m.practice_changed_rate).toBe(100);
      expect(m.monitored_by_ri_rate).toBe(100);
      expect(m.children_informed_rate).toBe(100);
      expect(m.social_worker_notified_rate).toBe(100);
      expect(m.board_informed_rate).toBe(100);
      expect(m.follow_up_ready_rate).toBe(100);
      expect(m.regulation_referenced_rate).toBe(100);
    });
    it("evidence_gathered_rate 0 when false", () => { expect(computeOfstedActionPlanMetrics([makeRecord({ evidence_gathered: false })]).evidence_gathered_rate).toBe(0); });
    it("mixed boolean rate", () => { const m = computeOfstedActionPlanMetrics([makeRecord({ evidence_gathered: true }), makeRecord({ evidence_gathered: false }), makeRecord({ evidence_gathered: true })]); expect(m.evidence_gathered_rate).toBe(66.7); });
    it("completion_rate includes completed and evidenced", () => { const m = computeOfstedActionPlanMetrics([makeRecord({ action_status: "completed" }), makeRecord({ action_status: "evidenced" }), makeRecord({ action_status: "in_progress" }), makeRecord({ action_status: "not_started" })]); expect(m.completion_rate).toBe(50); });
    it("counts all 10 finding types", () => { const types = ["requirement","recommendation","area_for_improvement","strength_identified","national_minimum_standard","regulation_breach","safeguarding_concern","quality_of_care","leadership_management","other"] as const; const records = types.map(t => makeRecord({ finding_type: t })); const m = computeOfstedActionPlanMetrics(records); for (const t of types) expect(m.by_finding_type[t]).toBe(1); });
    it("counts all 5 statuses", () => { const statuses = ["not_started","in_progress","completed","evidenced","overdue"] as const; const records = statuses.map(s => makeRecord({ action_status: s })); const m = computeOfstedActionPlanMetrics(records); for (const s of statuses) expect(m.by_action_status[s]).toBe(1); });
    it("counts all 5 priorities", () => { const priorities = ["immediate","high","medium","low","informational"] as const; const records = priorities.map(p => makeRecord({ finding_priority: p })); const m = computeOfstedActionPlanMetrics(records); for (const p of priorities) expect(m.by_finding_priority[p]).toBe(1); });
    it("counts all 10 inspection types", () => { const types = ["full_inspection","interim_inspection","monitoring_visit","unannounced_visit","complaint_investigation","regulatory_visit","assurance_visit","thematic_inspection","emergency_inspection","other"] as const; const records = types.map(t => makeRecord({ inspection_type: t })); const m = computeOfstedActionPlanMetrics(records); for (const t of types) expect(m.by_inspection_type[t]).toBe(1); });
  });

  describe("identifyOfstedActionPlanAlerts", () => {
    it("returns empty for clean", () => { expect(identifyOfstedActionPlanAlerts([makeRecord()])).toEqual([]); });
    it("returns empty for empty", () => { expect(identifyOfstedActionPlanAlerts([])).toEqual([]); });
    it("fires overdue_requirement", () => { 
      const a = identifyOfstedActionPlanAlerts([makeRecord({ action_status: "overdue", finding_type: "requirement", inspection_date: "2026-01-15", target_date: "2026-04-15" })]);
      expect(a[0].type).toBe("overdue_requirement");
      expect(a[0].severity).toBe("critical");
      expect(a[0].message).toContain("requirement");
      expect(a[0].message).toContain("2026-04-15");
    });
    it("overdue_requirement fires for regulation_breach too", () => { const a = identifyOfstedActionPlanAlerts([makeRecord({ action_status: "overdue", finding_type: "regulation_breach" })]); expect(a.filter(x => x.type === "overdue_requirement")).toHaveLength(1); });
    it("overdue_requirement per-record", () => { const a = identifyOfstedActionPlanAlerts([makeRecord({ id: "a-1", action_status: "overdue", finding_type: "requirement" }), makeRecord({ id: "a-2", action_status: "overdue", finding_type: "requirement" })]); expect(a.filter(x => x.type === "overdue_requirement")).toHaveLength(2); });
    it("no overdue alert for recommendation", () => { const a = identifyOfstedActionPlanAlerts([makeRecord({ action_status: "overdue", finding_type: "recommendation" })]); expect(a.filter(x => x.type === "overdue_requirement")).toHaveLength(0); });
    it("fires not_started singular", () => { 
      const a = identifyOfstedActionPlanAlerts([makeRecord({ action_status: "not_started" })]);
      const f = a.find(x => x.type === "not_started");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 finding has");
    });
    it("not_started plural", () => { const a = identifyOfstedActionPlanAlerts([makeRecord({ action_status: "not_started" }), makeRecord({ action_status: "not_started" })]); const f = a.find(x => x.type === "not_started"); expect(f!.message).toContain("2 findings have"); });
    it("evidence_not_gathered not for 1", () => { expect(identifyOfstedActionPlanAlerts([makeRecord({ evidence_gathered: false, action_status: "in_progress" })]).find(x => x.type === "evidence_not_gathered")).toBeUndefined(); });
    it("evidence_not_gathered fires for 2", () => { const a = identifyOfstedActionPlanAlerts([makeRecord({ evidence_gathered: false, action_status: "in_progress" }), makeRecord({ evidence_gathered: false, action_status: "in_progress" })]); expect(a.find(x => x.type === "evidence_not_gathered")).toBeDefined(); });
    it("evidence_not_gathered excludes not_started", () => { expect(identifyOfstedActionPlanAlerts([makeRecord({ evidence_gathered: false, action_status: "not_started" }), makeRecord({ evidence_gathered: false, action_status: "not_started" })]).find(x => x.type === "evidence_not_gathered")).toBeUndefined(); });
    it("staff_not_briefed not for 1", () => { expect(identifyOfstedActionPlanAlerts([makeRecord({ staff_briefed: false })]).find(x => x.type === "staff_not_briefed")).toBeUndefined(); });
    it("staff_not_briefed fires for 2", () => { const a = identifyOfstedActionPlanAlerts([makeRecord({ staff_briefed: false }), makeRecord({ staff_briefed: false })]); expect(a.find(x => x.type === "staff_not_briefed")).toBeDefined(); });
    it("practice_not_changed not for 2", () => { expect(identifyOfstedActionPlanAlerts([makeRecord({ practice_changed: false }), makeRecord({ practice_changed: false })]).find(x => x.type === "practice_not_changed")).toBeUndefined(); });
    it("practice_not_changed fires for 3", () => { const a = identifyOfstedActionPlanAlerts([makeRecord({ practice_changed: false }), makeRecord({ practice_changed: false }), makeRecord({ practice_changed: false })]); expect(a.find(x => x.type === "practice_not_changed")).toBeDefined(); });
    it("fires all applicable", () => { 
      const a = identifyOfstedActionPlanAlerts([makeRecord({ action_status: "overdue", finding_type: "requirement", evidence_gathered: false, staff_briefed: false, practice_changed: false }), makeRecord({ action_status: "not_started", evidence_gathered: false, staff_briefed: false, practice_changed: false }), makeRecord({ practice_changed: false })]);
      const types = a.map(x => x.type);
      expect(types).toContain("overdue_requirement");
      expect(types).toContain("not_started");
      expect(types).toContain("staff_not_briefed");
      expect(types).toContain("practice_not_changed");
    });
  });
});
