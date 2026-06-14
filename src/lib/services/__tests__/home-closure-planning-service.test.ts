import { describe, it, expect } from "vitest";
import { _testing, type HomeClosurePlanningRow } from "../home-closure-planning-service";

const { computeHomeClosurePlanningMetrics, computeHomeClosurePlanningAlerts, generateHomeClosurePlanningCaraInsights } = _testing;

const now = new Date(new Date().toISOString().split("T")[0]);

function makeRow(overrides?: Partial<HomeClosurePlanningRow>): HomeClosurePlanningRow {
  return {
    id: overrides?.id ?? "r-1", home_id: overrides?.home_id ?? "home-1",
    closure_reason: overrides?.closure_reason ?? "provider_decision",
    closure_phase: overrides?.closure_phase ?? "pre_planning",
    planned_closure_date: overrides?.planned_closure_date ?? "2026-09-01",
    actual_closure_date: "actual_closure_date" in (overrides ?? {}) ? (overrides!.actual_closure_date ?? null) : null,
    child_name: overrides?.child_name ?? "Child A",
    child_id: "child_id" in (overrides ?? {}) ? (overrides!.child_id ?? null) : null,
    child_transfer_status: overrides?.child_transfer_status ?? "not_started",
    receiving_home: "receiving_home" in (overrides ?? {}) ? (overrides!.receiving_home ?? null) : null,
    stakeholder_notified: overrides?.stakeholder_notified ?? "ofsted",
    notification_date: "notification_date" in (overrides ?? {}) ? (overrides!.notification_date ?? null) : null,
    child_views_sought: overrides?.child_views_sought ?? true,
    child_wishes_documented: overrides?.child_wishes_documented ?? true,
    staff_consultation_completed: overrides?.staff_consultation_completed ?? true,
    regulatory_notification_sent: overrides?.regulatory_notification_sent ?? true,
    transition_plan_in_place: overrides?.transition_plan_in_place ?? true,
    risk_assessment_completed: overrides?.risk_assessment_completed ?? true,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: overrides?.created_at ?? now.toISOString(), updated_at: overrides?.updated_at ?? now.toISOString(),
  };
}

describe("home-closure-planning-service", () => {
  // ═══════════════════════════════════════════════════════════════════════
  // computeHomeClosurePlanningMetrics
  // ═══════════════════════════════════════════════════════════════════════

  describe("computeHomeClosurePlanningMetrics", () => {
    it("returns zeros for empty", () => {
      const m = computeHomeClosurePlanningMetrics([]);
      expect(m.total_records).toBe(0);
      expect(m.disrupted_count).toBe(0);
      expect(m.not_started_count).toBe(0);
      expect(m.children_without_plan_count).toBe(0);
      expect(m.regulatory_not_sent_count).toBe(0);
      expect(m.child_views_rate).toBe(0);
      expect(m.transition_plan_rate).toBe(0);
      expect(m.risk_assessment_rate).toBe(0);
      expect(m.staff_consultation_rate).toBe(0);
      expect(m.child_wishes_rate).toBe(0);
      expect(m.unique_children).toBe(0);
    });

    it("returns empty breakdowns for empty", () => {
      const m = computeHomeClosurePlanningMetrics([]);
      expect(m.phase_breakdown).toEqual({});
      expect(m.transfer_status_breakdown).toEqual({});
    });

    it("total_records counts rows", () => {
      expect(computeHomeClosurePlanningMetrics([makeRow(), makeRow(), makeRow()]).total_records).toBe(3);
    });

    it("counts disrupted transfers", () => {
      expect(computeHomeClosurePlanningMetrics([makeRow({ child_transfer_status: "disrupted" })]).disrupted_count).toBe(1);
    });

    it("does not count transferred as disrupted", () => {
      expect(computeHomeClosurePlanningMetrics([makeRow({ child_transfer_status: "transferred" })]).disrupted_count).toBe(0);
    });

    it("counts not_started transfers", () => {
      expect(computeHomeClosurePlanningMetrics([makeRow({ child_transfer_status: "not_started" })]).not_started_count).toBe(1);
    });

    it("does not count matching_in_progress as not_started", () => {
      expect(computeHomeClosurePlanningMetrics([makeRow({ child_transfer_status: "matching_in_progress" })]).not_started_count).toBe(0);
    });

    it("counts children_without_plan when transition_plan_in_place is false", () => {
      expect(computeHomeClosurePlanningMetrics([makeRow({ transition_plan_in_place: false })]).children_without_plan_count).toBe(1);
    });

    it("children_without_plan_count is 0 when all have plans", () => {
      expect(computeHomeClosurePlanningMetrics([makeRow({ transition_plan_in_place: true })]).children_without_plan_count).toBe(0);
    });

    it("counts regulatory_not_sent_count when regulatory_notification_sent is false", () => {
      expect(computeHomeClosurePlanningMetrics([makeRow({ regulatory_notification_sent: false })]).regulatory_not_sent_count).toBe(1);
    });

    it("regulatory_not_sent_count is 0 when all sent", () => {
      expect(computeHomeClosurePlanningMetrics([makeRow({ regulatory_notification_sent: true })]).regulatory_not_sent_count).toBe(0);
    });

    it("child_views_rate 100 when all true", () => {
      expect(computeHomeClosurePlanningMetrics([makeRow({ child_views_sought: true })]).child_views_rate).toBe(100);
    });

    it("child_views_rate 0 when all false", () => {
      expect(computeHomeClosurePlanningMetrics([makeRow({ child_views_sought: false })]).child_views_rate).toBe(0);
    });

    it("child_views_rate 50 when half", () => {
      const m = computeHomeClosurePlanningMetrics([makeRow({ child_views_sought: true }), makeRow({ child_views_sought: false })]);
      expect(m.child_views_rate).toBe(50);
    });

    it("child_views_rate rounds to one decimal (66.7)", () => {
      const m = computeHomeClosurePlanningMetrics([makeRow({ child_views_sought: true }), makeRow({ child_views_sought: true }), makeRow({ child_views_sought: false })]);
      expect(m.child_views_rate).toBe(66.7);
    });

    it("child_views_rate rounds to one decimal (33.3)", () => {
      const m = computeHomeClosurePlanningMetrics([makeRow({ child_views_sought: true }), makeRow({ child_views_sought: false }), makeRow({ child_views_sought: false })]);
      expect(m.child_views_rate).toBe(33.3);
    });

    it("transition_plan_rate 100 when all true", () => {
      expect(computeHomeClosurePlanningMetrics([makeRow({ transition_plan_in_place: true })]).transition_plan_rate).toBe(100);
    });

    it("transition_plan_rate 0 when all false", () => {
      expect(computeHomeClosurePlanningMetrics([makeRow({ transition_plan_in_place: false })]).transition_plan_rate).toBe(0);
    });

    it("risk_assessment_rate 100 when all true", () => {
      expect(computeHomeClosurePlanningMetrics([makeRow({ risk_assessment_completed: true })]).risk_assessment_rate).toBe(100);
    });

    it("risk_assessment_rate 0 when all false", () => {
      expect(computeHomeClosurePlanningMetrics([makeRow({ risk_assessment_completed: false })]).risk_assessment_rate).toBe(0);
    });

    it("staff_consultation_rate 100 when all true", () => {
      expect(computeHomeClosurePlanningMetrics([makeRow({ staff_consultation_completed: true })]).staff_consultation_rate).toBe(100);
    });

    it("staff_consultation_rate 0 when all false", () => {
      expect(computeHomeClosurePlanningMetrics([makeRow({ staff_consultation_completed: false })]).staff_consultation_rate).toBe(0);
    });

    it("child_wishes_rate 100 when all true", () => {
      expect(computeHomeClosurePlanningMetrics([makeRow({ child_wishes_documented: true })]).child_wishes_rate).toBe(100);
    });

    it("child_wishes_rate 0 when all false", () => {
      expect(computeHomeClosurePlanningMetrics([makeRow({ child_wishes_documented: false })]).child_wishes_rate).toBe(0);
    });

    it("mixed boolean rate for child_wishes_rate", () => {
      const m = computeHomeClosurePlanningMetrics([makeRow({ child_wishes_documented: true }), makeRow({ child_wishes_documented: false }), makeRow({ child_wishes_documented: true })]);
      expect(m.child_wishes_rate).toBe(66.7);
    });

    it("unique_children distinct", () => {
      const m = computeHomeClosurePlanningMetrics([makeRow({ child_name: "A" }), makeRow({ child_name: "B" }), makeRow({ child_name: "A" })]);
      expect(m.unique_children).toBe(2);
    });

    it("unique_children single", () => {
      expect(computeHomeClosurePlanningMetrics([makeRow()]).unique_children).toBe(1);
    });

    it("phase_breakdown counts all 5 phases", () => {
      const phases = ["pre_planning", "consultation", "active_transition", "final_closure", "post_closure"] as const;
      const rows = phases.map((p) => makeRow({ closure_phase: p }));
      const m = computeHomeClosurePlanningMetrics(rows);
      for (const p of phases) expect(m.phase_breakdown[p]).toBe(1);
    });

    it("phase_breakdown accumulates duplicates", () => {
      const m = computeHomeClosurePlanningMetrics([makeRow({ closure_phase: "pre_planning" }), makeRow({ closure_phase: "pre_planning" })]);
      expect(m.phase_breakdown["pre_planning"]).toBe(2);
    });

    it("transfer_status_breakdown counts all 5 statuses", () => {
      const statuses = ["not_started", "matching_in_progress", "placement_identified", "transferred", "disrupted"] as const;
      const rows = statuses.map((s) => makeRow({ child_transfer_status: s }));
      const m = computeHomeClosurePlanningMetrics(rows);
      for (const s of statuses) expect(m.transfer_status_breakdown[s]).toBe(1);
    });

    it("transfer_status_breakdown accumulates duplicates", () => {
      const m = computeHomeClosurePlanningMetrics([makeRow({ child_transfer_status: "disrupted" }), makeRow({ child_transfer_status: "disrupted" })]);
      expect(m.transfer_status_breakdown["disrupted"]).toBe(2);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // computeHomeClosurePlanningAlerts
  // ═══════════════════════════════════════════════════════════════════════

  describe("computeHomeClosurePlanningAlerts", () => {
    it("returns empty for empty", () => {
      expect(computeHomeClosurePlanningAlerts([])).toEqual([]);
    });

    it("returns empty for clean rows", () => {
      expect(computeHomeClosurePlanningAlerts([makeRow()])).toEqual([]);
    });

    // -- disrupted_no_plan --
    it("fires disrupted_no_plan when disrupted + no transition plan", () => {
      const a = computeHomeClosurePlanningAlerts([makeRow({ child_transfer_status: "disrupted", transition_plan_in_place: false, child_name: "Jo" })]);
      const f = a.find((x) => x.type === "disrupted_no_plan");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("critical");
      expect(f!.message).toContain("Jo");
      expect(f!.record_id).toBe("r-1");
    });

    it("disrupted_no_plan per-record", () => {
      const a = computeHomeClosurePlanningAlerts([
        makeRow({ id: "r-1", child_transfer_status: "disrupted", transition_plan_in_place: false }),
        makeRow({ id: "r-2", child_transfer_status: "disrupted", transition_plan_in_place: false }),
      ]);
      expect(a.filter((x) => x.type === "disrupted_no_plan")).toHaveLength(2);
    });

    it("no disrupted_no_plan if transition plan in place", () => {
      expect(computeHomeClosurePlanningAlerts([makeRow({ child_transfer_status: "disrupted", transition_plan_in_place: true })]).filter((x) => x.type === "disrupted_no_plan")).toHaveLength(0);
    });

    it("no disrupted_no_plan if not disrupted", () => {
      expect(computeHomeClosurePlanningAlerts([makeRow({ child_transfer_status: "not_started", transition_plan_in_place: false })]).filter((x) => x.type === "disrupted_no_plan")).toHaveLength(0);
    });

    // -- regulatory_not_sent_active --
    it("fires regulatory_not_sent_active singular", () => {
      const a = computeHomeClosurePlanningAlerts([makeRow({ regulatory_notification_sent: false, closure_phase: "active_transition" })]);
      const f = a.find((x) => x.type === "regulatory_not_sent_active");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 record is");
    });

    it("fires regulatory_not_sent_active plural", () => {
      const a = computeHomeClosurePlanningAlerts([
        makeRow({ regulatory_notification_sent: false, closure_phase: "active_transition" }),
        makeRow({ regulatory_notification_sent: false, closure_phase: "active_transition" }),
      ]);
      const f = a.find((x) => x.type === "regulatory_not_sent_active");
      expect(f!.message).toContain("2 records are");
    });

    it("no regulatory_not_sent_active if notification sent", () => {
      expect(computeHomeClosurePlanningAlerts([makeRow({ regulatory_notification_sent: true, closure_phase: "active_transition" })]).find((x) => x.type === "regulatory_not_sent_active")).toBeUndefined();
    });

    it("no regulatory_not_sent_active if not active_transition phase", () => {
      expect(computeHomeClosurePlanningAlerts([makeRow({ regulatory_notification_sent: false, closure_phase: "pre_planning" })]).find((x) => x.type === "regulatory_not_sent_active")).toBeUndefined();
    });

    // -- child_views_not_sought --
    it("child_views_not_sought not for 1", () => {
      expect(computeHomeClosurePlanningAlerts([makeRow({ child_views_sought: false })]).find((x) => x.type === "child_views_not_sought")).toBeUndefined();
    });

    it("child_views_not_sought fires for 2", () => {
      const a = computeHomeClosurePlanningAlerts([makeRow({ child_views_sought: false }), makeRow({ child_views_sought: false })]);
      const f = a.find((x) => x.type === "child_views_not_sought");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("2 children");
    });

    it("child_views_not_sought fires for 3", () => {
      const a = computeHomeClosurePlanningAlerts([makeRow({ child_views_sought: false }), makeRow({ child_views_sought: false }), makeRow({ child_views_sought: false })]);
      const f = a.find((x) => x.type === "child_views_not_sought");
      expect(f!.message).toContain("3 children");
    });

    // -- staff_consultation_incomplete --
    it("fires staff_consultation_incomplete singular", () => {
      const a = computeHomeClosurePlanningAlerts([makeRow({ staff_consultation_completed: false })]);
      const f = a.find((x) => x.type === "staff_consultation_incomplete");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("medium");
      expect(f!.message).toContain("1 record has");
    });

    it("fires staff_consultation_incomplete plural", () => {
      const a = computeHomeClosurePlanningAlerts([makeRow({ staff_consultation_completed: false }), makeRow({ staff_consultation_completed: false })]);
      const f = a.find((x) => x.type === "staff_consultation_incomplete");
      expect(f!.message).toContain("2 records have");
    });

    it("no staff_consultation_incomplete when all completed", () => {
      expect(computeHomeClosurePlanningAlerts([makeRow({ staff_consultation_completed: true })]).find((x) => x.type === "staff_consultation_incomplete")).toBeUndefined();
    });

    // -- combined alerts --
    it("fires all applicable alerts", () => {
      const a = computeHomeClosurePlanningAlerts([
        makeRow({ child_transfer_status: "disrupted", transition_plan_in_place: false, regulatory_notification_sent: false, closure_phase: "active_transition", child_views_sought: false, staff_consultation_completed: false }),
        makeRow({ child_views_sought: false, staff_consultation_completed: false }),
      ]);
      const types = a.map((x) => x.type);
      expect(types).toContain("disrupted_no_plan");
      expect(types).toContain("regulatory_not_sent_active");
      expect(types).toContain("child_views_not_sought");
      expect(types).toContain("staff_consultation_incomplete");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // generateHomeClosurePlanningCaraInsights
  // ═══════════════════════════════════════════════════════════════════════

  describe("generateHomeClosurePlanningCaraInsights", () => {
    it("returns 3 insights for empty data", () => {
      const m = computeHomeClosurePlanningMetrics([]);
      const a = computeHomeClosurePlanningAlerts([]);
      const insights = generateHomeClosurePlanningCaraInsights(m, a);
      expect(insights).toHaveLength(3);
    });

    it("insight 1 starts with [pink]", () => {
      const m = computeHomeClosurePlanningMetrics([]);
      const a = computeHomeClosurePlanningAlerts([]);
      expect(generateHomeClosurePlanningCaraInsights(m, a)[0]).toMatch(/^\[pink\]/);
    });

    it("insight 2 starts with [amber]", () => {
      const m = computeHomeClosurePlanningMetrics([]);
      const a = computeHomeClosurePlanningAlerts([]);
      expect(generateHomeClosurePlanningCaraInsights(m, a)[1]).toMatch(/^\[amber\]/);
    });

    it("insight 3 starts with [reflect]", () => {
      const m = computeHomeClosurePlanningMetrics([]);
      const a = computeHomeClosurePlanningAlerts([]);
      expect(generateHomeClosurePlanningCaraInsights(m, a)[2]).toMatch(/^\[reflect\]/);
    });

    it("insight 1 contains total records count", () => {
      const m = computeHomeClosurePlanningMetrics([makeRow(), makeRow()]);
      const a = computeHomeClosurePlanningAlerts([makeRow(), makeRow()]);
      expect(generateHomeClosurePlanningCaraInsights(m, a)[0]).toContain("2 home closure planning records");
    });

    it("insight 1 contains unique children count", () => {
      const m = computeHomeClosurePlanningMetrics([makeRow({ child_name: "A" }), makeRow({ child_name: "B" })]);
      const a = computeHomeClosurePlanningAlerts([]);
      expect(generateHomeClosurePlanningCaraInsights(m, a)[0]).toContain("2 children");
    });

    it("insight 1 uses singular child for 1", () => {
      const m = computeHomeClosurePlanningMetrics([makeRow()]);
      const a = computeHomeClosurePlanningAlerts([]);
      expect(generateHomeClosurePlanningCaraInsights(m, a)[0]).toContain("1 child");
    });

    it("insight 1 contains disrupted count and percentage", () => {
      const m = computeHomeClosurePlanningMetrics([makeRow({ child_transfer_status: "disrupted" })]);
      const a = computeHomeClosurePlanningAlerts([]);
      expect(generateHomeClosurePlanningCaraInsights(m, a)[0]).toContain("1 (100%)");
    });

    it("insight 1 contains transition plan rate", () => {
      const m = computeHomeClosurePlanningMetrics([makeRow({ transition_plan_in_place: true })]);
      const a = computeHomeClosurePlanningAlerts([]);
      expect(generateHomeClosurePlanningCaraInsights(m, a)[0]).toContain("Transition plan rate: 100%");
    });

    it("insight 1 contains child views sought rate", () => {
      const m = computeHomeClosurePlanningMetrics([makeRow({ child_views_sought: true })]);
      const a = computeHomeClosurePlanningAlerts([]);
      expect(generateHomeClosurePlanningCaraInsights(m, a)[0]).toContain("Child views sought rate: 100%");
    });

    it("insight 2 mentions critical and high alert counts when present", () => {
      const rows = [makeRow({ child_transfer_status: "disrupted", transition_plan_in_place: false, regulatory_notification_sent: false, closure_phase: "active_transition", child_views_sought: false }), makeRow({ child_views_sought: false })];
      const m = computeHomeClosurePlanningMetrics(rows);
      const a = computeHomeClosurePlanningAlerts(rows);
      const i = generateHomeClosurePlanningCaraInsights(m, a)[1];
      expect(i).toContain("1 critical");
      expect(i).toContain("2 high-priority");
    });

    it("insight 2 shows no concerns when none", () => {
      const m = computeHomeClosurePlanningMetrics([makeRow()]);
      const a = computeHomeClosurePlanningAlerts([makeRow()]);
      expect(generateHomeClosurePlanningCaraInsights(m, a)[1]).toContain("No critical or high-priority concerns");
    });

    it("insight 2 contains risk assessment rate", () => {
      const m = computeHomeClosurePlanningMetrics([makeRow()]);
      const a = computeHomeClosurePlanningAlerts([]);
      expect(generateHomeClosurePlanningCaraInsights(m, a)[1]).toContain("Risk assessment rate");
    });

    it("insight 2 contains staff consultation rate", () => {
      const m = computeHomeClosurePlanningMetrics([makeRow()]);
      const a = computeHomeClosurePlanningAlerts([]);
      expect(generateHomeClosurePlanningCaraInsights(m, a)[1]).toContain("Staff consultation rate");
    });

    it("insight 2 contains regulatory not sent count", () => {
      const m = computeHomeClosurePlanningMetrics([makeRow()]);
      const a = computeHomeClosurePlanningAlerts([]);
      expect(generateHomeClosurePlanningCaraInsights(m, a)[1]).toContain("Regulatory not sent");
    });

    it("insight 3 contains reflective question about children", () => {
      const m = computeHomeClosurePlanningMetrics([]);
      const a = computeHomeClosurePlanningAlerts([]);
      const i = generateHomeClosurePlanningCaraInsights(m, a)[2];
      expect(i).toContain("closure process");
      expect(i).toContain("child");
    });
  });
});
