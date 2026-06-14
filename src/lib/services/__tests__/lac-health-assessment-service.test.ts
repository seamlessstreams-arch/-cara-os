import { describe, it, expect } from "vitest";
import { _testing, type LacHealthAssessmentRow } from "../lac-health-assessment-service";

const { computeLacHealthAssessmentMetrics, computeLacHealthAssessmentAlerts, generateLacHealthAssessmentCaraInsights } = _testing;

const now = new Date(new Date().toISOString().split("T")[0]);

function makeRow(overrides?: Partial<LacHealthAssessmentRow>): LacHealthAssessmentRow {
  return {
    id: overrides?.id ?? "a-1", home_id: overrides?.home_id ?? "home-1",
    child_name: overrides?.child_name ?? "Child A",
    child_id: "child_id" in (overrides ?? {}) ? (overrides!.child_id ?? null) : null,
    assessment_date: overrides?.assessment_date ?? now.toISOString().split("T")[0],
    assessment_type: overrides?.assessment_type ?? "initial_health_assessment",
    health_outcome: overrides?.health_outcome ?? "all_actions_met",
    compliance_status: overrides?.compliance_status ?? "within_timescale",
    health_domain: overrides?.health_domain ?? "physical_health",
    clinician_name: "clinician_name" in (overrides ?? {}) ? (overrides!.clinician_name ?? null) : null,
    clinic_location: "clinic_location" in (overrides ?? {}) ? (overrides!.clinic_location ?? null) : null,
    health_action_plan_created: overrides?.health_action_plan_created ?? true,
    actions_completed: overrides?.actions_completed ?? true,
    child_attended: overrides?.child_attended ?? true,
    child_views_captured: overrides?.child_views_captured ?? true,
    carer_attended: overrides?.carer_attended ?? true,
    shared_with_social_worker: overrides?.shared_with_social_worker ?? true,
    next_assessment_due: "next_assessment_due" in (overrides ?? {}) ? (overrides!.next_assessment_due ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: overrides?.created_at ?? now.toISOString(), updated_at: overrides?.updated_at ?? now.toISOString(),
  };
}

describe("lac-health-assessment-service", () => {
  describe("computeLacHealthAssessmentMetrics", () => {
    it("returns zeros for empty", () => {
      const m = computeLacHealthAssessmentMetrics([]);
      expect(m.total_assessments).toBe(0);
      expect(m.overdue_count).toBe(0);
      expect(m.urgent_concern_count).toBe(0);
      expect(m.not_completed_count).toBe(0);
      expect(m.referral_required_count).toBe(0);
      expect(m.child_attended_rate).toBe(0);
      expect(m.child_views_rate).toBe(0);
      expect(m.action_plan_rate).toBe(0);
      expect(m.actions_completed_rate).toBe(0);
      expect(m.shared_with_sw_rate).toBe(0);
      expect(m.unique_children).toBe(0);
    });

    it("returns empty breakdowns for empty", () => {
      const m = computeLacHealthAssessmentMetrics([]);
      expect(m.type_breakdown).toEqual({});
      expect(m.outcome_breakdown).toEqual({});
    });

    it("total_assessments counts rows", () => {
      expect(computeLacHealthAssessmentMetrics([makeRow(), makeRow(), makeRow()]).total_assessments).toBe(3);
    });

    it("counts overdue compliance as overdue_count", () => {
      expect(computeLacHealthAssessmentMetrics([makeRow({ compliance_status: "overdue" })]).overdue_count).toBe(1);
    });

    it("counts significantly_overdue as overdue_count", () => {
      expect(computeLacHealthAssessmentMetrics([makeRow({ compliance_status: "significantly_overdue" })]).overdue_count).toBe(1);
    });

    it("does not count within_timescale as overdue_count", () => {
      expect(computeLacHealthAssessmentMetrics([makeRow({ compliance_status: "within_timescale" })]).overdue_count).toBe(0);
    });

    it("does not count not_due as overdue_count", () => {
      expect(computeLacHealthAssessmentMetrics([makeRow({ compliance_status: "not_due" })]).overdue_count).toBe(0);
    });

    it("does not count exempt as overdue_count", () => {
      expect(computeLacHealthAssessmentMetrics([makeRow({ compliance_status: "exempt" })]).overdue_count).toBe(0);
    });

    it("counts urgent_concern_count", () => {
      expect(computeLacHealthAssessmentMetrics([makeRow({ health_outcome: "urgent_concern" })]).urgent_concern_count).toBe(1);
    });

    it("does not count all_actions_met as urgent_concern_count", () => {
      expect(computeLacHealthAssessmentMetrics([makeRow({ health_outcome: "all_actions_met" })]).urgent_concern_count).toBe(0);
    });

    it("counts not_completed_count", () => {
      expect(computeLacHealthAssessmentMetrics([makeRow({ health_outcome: "not_completed" })]).not_completed_count).toBe(1);
    });

    it("counts referral_required_count", () => {
      expect(computeLacHealthAssessmentMetrics([makeRow({ health_outcome: "referral_required" })]).referral_required_count).toBe(1);
    });

    it("child_attended_rate 100 when true", () => {
      expect(computeLacHealthAssessmentMetrics([makeRow({ child_attended: true })]).child_attended_rate).toBe(100);
    });

    it("child_attended_rate 0 when false", () => {
      expect(computeLacHealthAssessmentMetrics([makeRow({ child_attended: false })]).child_attended_rate).toBe(0);
    });

    it("child_views_rate 100 when true", () => {
      expect(computeLacHealthAssessmentMetrics([makeRow({ child_views_captured: true })]).child_views_rate).toBe(100);
    });

    it("child_views_rate 0 when false", () => {
      expect(computeLacHealthAssessmentMetrics([makeRow({ child_views_captured: false })]).child_views_rate).toBe(0);
    });

    it("action_plan_rate 100 with default", () => {
      expect(computeLacHealthAssessmentMetrics([makeRow()]).action_plan_rate).toBe(100);
    });

    it("action_plan_rate 0 when false", () => {
      expect(computeLacHealthAssessmentMetrics([makeRow({ health_action_plan_created: false })]).action_plan_rate).toBe(0);
    });

    it("actions_completed_rate 100 with default", () => {
      expect(computeLacHealthAssessmentMetrics([makeRow()]).actions_completed_rate).toBe(100);
    });

    it("actions_completed_rate 0 when false", () => {
      expect(computeLacHealthAssessmentMetrics([makeRow({ actions_completed: false })]).actions_completed_rate).toBe(0);
    });

    it("shared_with_sw_rate 100 with default", () => {
      expect(computeLacHealthAssessmentMetrics([makeRow()]).shared_with_sw_rate).toBe(100);
    });

    it("shared_with_sw_rate 0 when false", () => {
      expect(computeLacHealthAssessmentMetrics([makeRow({ shared_with_social_worker: false })]).shared_with_sw_rate).toBe(0);
    });

    it("mixed boolean rate calculates correctly", () => {
      const m = computeLacHealthAssessmentMetrics([
        makeRow({ child_attended: true }),
        makeRow({ child_attended: false }),
        makeRow({ child_attended: true }),
      ]);
      expect(m.child_attended_rate).toBe(66.7);
    });

    it("unique_children distinct", () => {
      const m = computeLacHealthAssessmentMetrics([
        makeRow({ child_name: "A" }),
        makeRow({ child_name: "B" }),
        makeRow({ child_name: "A" }),
      ]);
      expect(m.unique_children).toBe(2);
    });

    it("unique_children single", () => {
      expect(computeLacHealthAssessmentMetrics([makeRow()]).unique_children).toBe(1);
    });

    it("type_breakdown counts all 10 types", () => {
      const types = [
        "initial_health_assessment", "review_health_assessment", "dental_check",
        "optical_check", "developmental_check", "mental_health_screening",
        "sexual_health_review", "substance_misuse_screening",
        "immunisation_review", "specialist_referral",
      ] as const;
      const rows = types.map((t) => makeRow({ assessment_type: t }));
      const m = computeLacHealthAssessmentMetrics(rows);
      for (const t of types) expect(m.type_breakdown[t]).toBe(1);
    });

    it("type_breakdown accumulates duplicates", () => {
      const m = computeLacHealthAssessmentMetrics([
        makeRow({ assessment_type: "dental_check" }),
        makeRow({ assessment_type: "dental_check" }),
      ]);
      expect(m.type_breakdown["dental_check"]).toBe(2);
    });

    it("outcome_breakdown counts all 5 outcomes", () => {
      const outcomes = [
        "all_actions_met", "actions_outstanding", "referral_required",
        "urgent_concern", "not_completed",
      ] as const;
      const rows = outcomes.map((o) => makeRow({ health_outcome: o }));
      const m = computeLacHealthAssessmentMetrics(rows);
      for (const o of outcomes) expect(m.outcome_breakdown[o]).toBe(1);
    });

    it("outcome_breakdown accumulates duplicates", () => {
      const m = computeLacHealthAssessmentMetrics([
        makeRow({ health_outcome: "urgent_concern" }),
        makeRow({ health_outcome: "urgent_concern" }),
      ]);
      expect(m.outcome_breakdown["urgent_concern"]).toBe(2);
    });

    it("percentage rounding: 1/3 = 33.3", () => {
      const m = computeLacHealthAssessmentMetrics([
        makeRow({ child_attended: true }),
        makeRow({ child_attended: false }),
        makeRow({ child_attended: false }),
      ]);
      expect(m.child_attended_rate).toBe(33.3);
    });
  });

  describe("computeLacHealthAssessmentAlerts", () => {
    it("returns empty for empty", () => {
      expect(computeLacHealthAssessmentAlerts([])).toEqual([]);
    });

    it("returns empty for clean rows", () => {
      expect(computeLacHealthAssessmentAlerts([makeRow()])).toEqual([]);
    });

    it("fires urgent_concern_not_shared", () => {
      const a = computeLacHealthAssessmentAlerts([
        makeRow({
          health_outcome: "urgent_concern",
          shared_with_social_worker: false,
          child_name: "Jo",
          assessment_type: "initial_health_assessment",
        }),
      ]);
      expect(a[0].type).toBe("urgent_concern_not_shared");
      expect(a[0].severity).toBe("critical");
      expect(a[0].message).toContain("Jo");
      expect(a[0].message).toContain("initial health assessment");
      expect(a[0].record_id).toBe("a-1");
    });

    it("urgent_concern_not_shared per-record", () => {
      const a = computeLacHealthAssessmentAlerts([
        makeRow({ id: "a-1", health_outcome: "urgent_concern", shared_with_social_worker: false }),
        makeRow({ id: "a-2", health_outcome: "urgent_concern", shared_with_social_worker: false }),
      ]);
      expect(a.filter((x) => x.type === "urgent_concern_not_shared")).toHaveLength(2);
    });

    it("no urgent_concern alert if shared with SW", () => {
      expect(
        computeLacHealthAssessmentAlerts([
          makeRow({ health_outcome: "urgent_concern", shared_with_social_worker: true }),
        ]).filter((x) => x.type === "urgent_concern_not_shared"),
      ).toHaveLength(0);
    });

    it("no urgent_concern alert for non-urgent outcome", () => {
      expect(
        computeLacHealthAssessmentAlerts([
          makeRow({ health_outcome: "all_actions_met", shared_with_social_worker: false }),
        ]).filter((x) => x.type === "urgent_concern_not_shared"),
      ).toHaveLength(0);
    });

    it("fires significantly_overdue", () => {
      const a = computeLacHealthAssessmentAlerts([
        makeRow({ compliance_status: "significantly_overdue", child_name: "Sam", assessment_type: "dental_check" }),
      ]);
      const f = a.find((x) => x.type === "significantly_overdue");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("Sam");
      expect(f!.message).toContain("dental check");
      expect(f!.record_id).toBe("a-1");
    });

    it("significantly_overdue per-record", () => {
      const a = computeLacHealthAssessmentAlerts([
        makeRow({ id: "a-1", compliance_status: "significantly_overdue" }),
        makeRow({ id: "a-2", compliance_status: "significantly_overdue" }),
      ]);
      expect(a.filter((x) => x.type === "significantly_overdue")).toHaveLength(2);
    });

    it("no significantly_overdue for overdue status", () => {
      expect(
        computeLacHealthAssessmentAlerts([
          makeRow({ compliance_status: "overdue" }),
        ]).filter((x) => x.type === "significantly_overdue"),
      ).toHaveLength(0);
    });

    it("child_views_not_captured not for 1", () => {
      expect(
        computeLacHealthAssessmentAlerts([
          makeRow({ child_views_captured: false }),
        ]).find((x) => x.type === "child_views_not_captured"),
      ).toBeUndefined();
    });

    it("child_views_not_captured fires for 2", () => {
      const a = computeLacHealthAssessmentAlerts([
        makeRow({ child_views_captured: false }),
        makeRow({ child_views_captured: false }),
      ]);
      const f = a.find((x) => x.type === "child_views_not_captured");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("2 health assessments");
    });

    it("child_views_not_captured fires for 3", () => {
      const a = computeLacHealthAssessmentAlerts([
        makeRow({ child_views_captured: false }),
        makeRow({ child_views_captured: false }),
        makeRow({ child_views_captured: false }),
      ]);
      const f = a.find((x) => x.type === "child_views_not_captured");
      expect(f!.message).toContain("3 health assessments");
    });

    it("action_plans_not_created not for 1", () => {
      expect(
        computeLacHealthAssessmentAlerts([
          makeRow({ health_action_plan_created: false }),
        ]).find((x) => x.type === "action_plans_not_created"),
      ).toBeUndefined();
    });

    it("action_plans_not_created fires for 2", () => {
      const a = computeLacHealthAssessmentAlerts([
        makeRow({ health_action_plan_created: false }),
        makeRow({ health_action_plan_created: false }),
      ]);
      const f = a.find((x) => x.type === "action_plans_not_created");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("medium");
      expect(f!.message).toContain("2 health assessments");
    });

    it("fires all applicable alerts", () => {
      const a = computeLacHealthAssessmentAlerts([
        makeRow({
          health_outcome: "urgent_concern",
          shared_with_social_worker: false,
          compliance_status: "significantly_overdue",
          child_views_captured: false,
          health_action_plan_created: false,
        }),
        makeRow({
          compliance_status: "significantly_overdue",
          child_views_captured: false,
          health_action_plan_created: false,
        }),
      ]);
      const types = a.map((x) => x.type);
      expect(types).toContain("urgent_concern_not_shared");
      expect(types).toContain("significantly_overdue");
      expect(types).toContain("child_views_not_captured");
      expect(types).toContain("action_plans_not_created");
    });
  });

  describe("generateLacHealthAssessmentCaraInsights", () => {
    it("returns 3 insights for empty data", () => {
      const m = computeLacHealthAssessmentMetrics([]);
      const a = computeLacHealthAssessmentAlerts([]);
      const insights = generateLacHealthAssessmentCaraInsights(m, a);
      expect(insights).toHaveLength(3);
    });

    it("insight 1 starts with [pink]", () => {
      const m = computeLacHealthAssessmentMetrics([]);
      const a = computeLacHealthAssessmentAlerts([]);
      expect(generateLacHealthAssessmentCaraInsights(m, a)[0]).toMatch(/^\[pink\]/);
    });

    it("insight 2 starts with [amber]", () => {
      const m = computeLacHealthAssessmentMetrics([]);
      const a = computeLacHealthAssessmentAlerts([]);
      expect(generateLacHealthAssessmentCaraInsights(m, a)[1]).toMatch(/^\[amber\]/);
    });

    it("insight 3 starts with [reflect]", () => {
      const m = computeLacHealthAssessmentMetrics([]);
      const a = computeLacHealthAssessmentAlerts([]);
      expect(generateLacHealthAssessmentCaraInsights(m, a)[2]).toMatch(/^\[reflect\]/);
    });

    it("insight 1 contains total assessments count", () => {
      const m = computeLacHealthAssessmentMetrics([makeRow(), makeRow()]);
      const a = computeLacHealthAssessmentAlerts([makeRow(), makeRow()]);
      expect(generateLacHealthAssessmentCaraInsights(m, a)[0]).toContain("2 LAC health assessments");
    });

    it("insight 1 contains unique children count", () => {
      const m = computeLacHealthAssessmentMetrics([makeRow({ child_name: "A" }), makeRow({ child_name: "B" })]);
      const a = computeLacHealthAssessmentAlerts([]);
      expect(generateLacHealthAssessmentCaraInsights(m, a)[0]).toContain("2 children");
    });

    it("insight 1 uses singular child for 1", () => {
      const m = computeLacHealthAssessmentMetrics([makeRow()]);
      const a = computeLacHealthAssessmentAlerts([]);
      expect(generateLacHealthAssessmentCaraInsights(m, a)[0]).toContain("1 child");
    });

    it("insight 1 contains overdue count", () => {
      const m = computeLacHealthAssessmentMetrics([makeRow({ compliance_status: "overdue" })]);
      const a = computeLacHealthAssessmentAlerts([]);
      expect(generateLacHealthAssessmentCaraInsights(m, a)[0]).toContain("1 (100%)");
    });

    it("insight 1 contains urgent concerns count", () => {
      const m = computeLacHealthAssessmentMetrics([makeRow({ health_outcome: "urgent_concern" })]);
      const a = computeLacHealthAssessmentAlerts([]);
      expect(generateLacHealthAssessmentCaraInsights(m, a)[0]).toContain("1 urgent concerns");
    });

    it("insight 1 contains referrals required count", () => {
      const m = computeLacHealthAssessmentMetrics([makeRow({ health_outcome: "referral_required" })]);
      const a = computeLacHealthAssessmentAlerts([]);
      expect(generateLacHealthAssessmentCaraInsights(m, a)[0]).toContain("1 referrals required");
    });

    it("insight 1 contains child attendance rate", () => {
      const m = computeLacHealthAssessmentMetrics([makeRow({ child_attended: true })]);
      const a = computeLacHealthAssessmentAlerts([]);
      expect(generateLacHealthAssessmentCaraInsights(m, a)[0]).toContain("Child attendance rate: 100%");
    });

    it("insight 2 mentions critical and high alert counts", () => {
      const rows = [
        makeRow({ health_outcome: "urgent_concern", shared_with_social_worker: false }),
        makeRow({ compliance_status: "significantly_overdue" }),
      ];
      const m = computeLacHealthAssessmentMetrics(rows);
      const a = computeLacHealthAssessmentAlerts(rows);
      const i = generateLacHealthAssessmentCaraInsights(m, a)[1];
      expect(i).toContain("1 critical");
      expect(i).toContain("1 high-priority");
    });

    it("insight 2 shows no concerns when none", () => {
      const m = computeLacHealthAssessmentMetrics([makeRow()]);
      const a = computeLacHealthAssessmentAlerts([makeRow()]);
      expect(generateLacHealthAssessmentCaraInsights(m, a)[1]).toContain("No critical or high-priority concerns");
    });

    it("insight 2 contains child views rate", () => {
      const m = computeLacHealthAssessmentMetrics([makeRow()]);
      const a = computeLacHealthAssessmentAlerts([]);
      expect(generateLacHealthAssessmentCaraInsights(m, a)[1]).toContain("Child views captured rate");
    });

    it("insight 2 contains action plan rate", () => {
      const m = computeLacHealthAssessmentMetrics([makeRow()]);
      const a = computeLacHealthAssessmentAlerts([]);
      expect(generateLacHealthAssessmentCaraInsights(m, a)[1]).toContain("Action plan rate");
    });

    it("insight 2 contains shared with SW rate", () => {
      const m = computeLacHealthAssessmentMetrics([makeRow()]);
      const a = computeLacHealthAssessmentAlerts([]);
      expect(generateLacHealthAssessmentCaraInsights(m, a)[1]).toContain("Shared with social worker rate");
    });

    it("insight 3 contains reflective question", () => {
      const m = computeLacHealthAssessmentMetrics([]);
      const a = computeLacHealthAssessmentAlerts([]);
      const i = generateLacHealthAssessmentCaraInsights(m, a)[2];
      expect(i).toContain("LAC health assessments");
      expect(i).toContain("health action plans");
    });
  });
});
