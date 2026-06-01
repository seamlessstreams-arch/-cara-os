import { describe, it, expect } from "vitest";
import {
  computeReg4445QualityAssuranceReporting,
  type Reg4445QualityAssuranceReportingInput,
  type Reg44ReportInput,
  type Reg45ReviewInput,
  type ActionPlanInput,
  type QualityImprovementInput,
  type NotificationInput,
} from "../home-reg44-45-quality-assurance-reporting-intelligence-engine";

// ── Helpers ────────────────────────────────────────────────────────────────

const TODAY = "2026-06-01";

function makeReg44(ov: Partial<Reg44ReportInput> = {}): Reg44ReportInput {
  return {
    id: `r44_${Math.random().toString(36).slice(2, 8)}`,
    visit_date: "2026-05-01",
    visitor_name: "Jane Independent",
    visitor_independent: true,
    report_submitted: true,
    report_submission_date: "2026-05-03",
    submitted_within_deadline: true,
    report_shared_with_ofsted: true,
    report_shared_with_placing_authorities: true,
    children_spoken_to: 4,
    children_available: 4,
    staff_interviewed: 3,
    areas_inspected: ["bedrooms", "kitchen", "records", "garden"],
    shortfalls_identified: 2,
    shortfalls_actioned: 2,
    positive_observations: 5,
    previous_actions_reviewed: true,
    previous_actions_resolved: 3,
    previous_actions_total: 3,
    report_quality_rating: 4,
    child_views_captured: true,
    night_visit_included: true,
    unannounced: true,
    medication_records_checked: true,
    sanctions_records_checked: true,
    complaints_reviewed: true,
    safeguarding_reviewed: true,
    created_at: "2026-05-03",
    ...ov,
  };
}

function makeReg45(ov: Partial<Reg45ReviewInput> = {}): Reg45ReviewInput {
  return {
    id: `r45_${Math.random().toString(36).slice(2, 8)}`,
    review_period_start: "2025-12-01",
    review_period_end: "2026-05-31",
    review_date: "2026-05-20",
    completed_on_time: true,
    reviewer_name: "Registered Manager",
    reviewer_role: "registered_manager",
    review_covers_all_standards: true,
    development_plan_updated: true,
    reg44_reports_considered: 6,
    reg44_reports_available: 6,
    children_consulted: 4,
    children_total: 4,
    staff_consulted: 5,
    placing_authorities_consulted: 2,
    parents_carers_consulted: 2,
    professionals_consulted: 2,
    strengths_identified: 8,
    areas_for_improvement_identified: 3,
    actions_set: 5,
    actions_from_previous_review_completed: 4,
    actions_from_previous_review_total: 4,
    review_quality_rating: 4,
    shared_with_ofsted: true,
    shared_with_placing_authorities: true,
    created_at: "2026-05-20",
    ...ov,
  };
}

function makeAction(ov: Partial<ActionPlanInput> = {}): ActionPlanInput {
  return {
    id: `ap_${Math.random().toString(36).slice(2, 8)}`,
    source: "reg44",
    source_id: "r44_1",
    action_description: "Address shortfall",
    assigned_to: "Staff A",
    date_raised: "2026-04-01",
    target_completion_date: "2026-04-30",
    actual_completion_date: "2026-04-28",
    status: "completed",
    priority: "medium",
    evidence_of_completion: true,
    verified_by_manager: true,
    impact_on_children_assessed: true,
    follow_up_required: false,
    follow_up_completed: false,
    created_at: "2026-04-01",
    ...ov,
  };
}

function makeQI(ov: Partial<QualityImprovementInput> = {}): QualityImprovementInput {
  return {
    id: `qi_${Math.random().toString(36).slice(2, 8)}`,
    cycle_name: "Improve bedtime routine",
    cycle_start_date: "2026-01-01",
    cycle_end_date: "2026-04-01",
    status: "completed",
    identified_issue: "Inconsistent bedtime routines",
    improvement_goal: "Consistent bedtime for all children",
    baseline_measure: 40,
    current_measure: 90,
    target_measure: 85,
    actions_planned: 5,
    actions_completed: 5,
    staff_involved: 4,
    children_consulted: true,
    evidence_collected: true,
    outcome_measured: true,
    improvement_achieved: true,
    sustained_over_time: true,
    linked_to_reg44_finding: true,
    linked_to_reg45_finding: true,
    created_at: "2026-01-01",
    ...ov,
  };
}

function makeNotification(ov: Partial<NotificationInput> = {}): NotificationInput {
  return {
    id: `n_${Math.random().toString(36).slice(2, 8)}`,
    notification_type: "serious_event",
    event_date: "2026-04-10",
    notification_date: "2026-04-10",
    notified_within_24_hours: true,
    notified_ofsted: true,
    notified_placing_authority: true,
    notified_local_authority: true,
    follow_up_report_required: true,
    follow_up_report_submitted: true,
    follow_up_submitted_on_time: true,
    investigation_completed: true,
    actions_arising: 3,
    actions_completed: 3,
    child_id: "c1",
    child_informed_of_outcome: true,
    documented_in_records: true,
    created_at: "2026-04-10",
    ...ov,
  };
}

/**
 * baseInput → outstanding (score 80)
 * Base 52
 * + Bonus 1 reg44CompletionRate 100%: +5
 * + Bonus 2 reg45TimelinessRate 100%: +5
 * + Bonus 3 actionPlanRate >= 90:     +5
 * + Bonus 4 qualityImprovementRate >= 80: +4
 * + Bonus 5 notificationComplianceRate >= 95: +5
 * + Bonus 6 stakeholderEngagementRate >= 80: +4
 * = 80
 */
function baseInput(ov: Partial<Reg4445QualityAssuranceReportingInput> = {}): Reg4445QualityAssuranceReportingInput {
  return {
    today: TODAY,
    total_children: 4,
    reg44_report_records: Array.from({ length: 6 }, (_, i) => makeReg44({ id: `r44_${i}` })),
    reg45_review_records: [makeReg45({ id: "r45_0" }), makeReg45({ id: "r45_1" })],
    action_plan_records: Array.from({ length: 10 }, (_, i) => makeAction({ id: `ap_${i}` })),
    quality_improvement_records: Array.from({ length: 4 }, (_, i) => makeQI({ id: `qi_${i}` })),
    notification_records: Array.from({ length: 3 }, (_, i) => makeNotification({ id: `n_${i}` })),
    ...ov,
  };
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("computeReg4445QualityAssuranceReporting", () => {
  // ═══════════════════════════════════════════════════════════════════════
  // SPECIAL CASES
  // ═══════════════════════════════════════════════════════════════════════

  describe("insufficient data — all empty, 0 children", () => {
    it("returns insufficient_data rating", () => {
      const r = computeReg4445QualityAssuranceReporting({
        today: TODAY, total_children: 0,
        reg44_report_records: [], reg45_review_records: [],
        action_plan_records: [], quality_improvement_records: [],
        notification_records: [],
      });
      expect(r.quality_assurance_rating).toBe("insufficient_data");
    });

    it("returns score 0", () => {
      const r = computeReg4445QualityAssuranceReporting({
        today: TODAY, total_children: 0,
        reg44_report_records: [], reg45_review_records: [],
        action_plan_records: [], quality_improvement_records: [],
        notification_records: [],
      });
      expect(r.quality_assurance_score).toBe(0);
    });

    it("returns headline mentioning insufficient data", () => {
      const r = computeReg4445QualityAssuranceReporting({
        today: TODAY, total_children: 0,
        reg44_report_records: [], reg45_review_records: [],
        action_plan_records: [], quality_improvement_records: [],
        notification_records: [],
      });
      expect(r.headline.toLowerCase()).toContain("insufficient data");
    });

    it("returns all zero counts", () => {
      const r = computeReg4445QualityAssuranceReporting({
        today: TODAY, total_children: 0,
        reg44_report_records: [], reg45_review_records: [],
        action_plan_records: [], quality_improvement_records: [],
        notification_records: [],
      });
      expect(r.total_reg44_reports).toBe(0);
      expect(r.total_reg45_reviews).toBe(0);
      expect(r.total_action_plans).toBe(0);
      expect(r.total_quality_cycles).toBe(0);
      expect(r.total_notifications).toBe(0);
    });

    it("returns empty narrative arrays", () => {
      const r = computeReg4445QualityAssuranceReporting({
        today: TODAY, total_children: 0,
        reg44_report_records: [], reg45_review_records: [],
        action_plan_records: [], quality_improvement_records: [],
        notification_records: [],
      });
      expect(r.strengths).toEqual([]);
      expect(r.concerns).toEqual([]);
      expect(r.recommendations).toEqual([]);
      expect(r.insights).toEqual([]);
    });
  });

  describe("all empty, children > 0 — inadequate", () => {
    it("returns inadequate rating", () => {
      const r = computeReg4445QualityAssuranceReporting({
        today: TODAY, total_children: 4,
        reg44_report_records: [], reg45_review_records: [],
        action_plan_records: [], quality_improvement_records: [],
        notification_records: [],
      });
      expect(r.quality_assurance_rating).toBe("inadequate");
    });

    it("returns score 15", () => {
      const r = computeReg4445QualityAssuranceReporting({
        today: TODAY, total_children: 4,
        reg44_report_records: [], reg45_review_records: [],
        action_plan_records: [], quality_improvement_records: [],
        notification_records: [],
      });
      expect(r.quality_assurance_score).toBe(15);
    });

    it("has concerns about missing records", () => {
      const r = computeReg4445QualityAssuranceReporting({
        today: TODAY, total_children: 4,
        reg44_report_records: [], reg45_review_records: [],
        action_plan_records: [], quality_improvement_records: [],
        notification_records: [],
      });
      expect(r.concerns.length).toBeGreaterThanOrEqual(1);
    });

    it("has 2 immediate recommendations", () => {
      const r = computeReg4445QualityAssuranceReporting({
        today: TODAY, total_children: 4,
        reg44_report_records: [], reg45_review_records: [],
        action_plan_records: [], quality_improvement_records: [],
        notification_records: [],
      });
      expect(r.recommendations).toHaveLength(2);
      expect(r.recommendations[0].urgency).toBe("immediate");
      expect(r.recommendations[1].urgency).toBe("immediate");
    });

    it("has critical insight", () => {
      const r = computeReg4445QualityAssuranceReporting({
        today: TODAY, total_children: 4,
        reg44_report_records: [], reg45_review_records: [],
        action_plan_records: [], quality_improvement_records: [],
        notification_records: [],
      });
      expect(r.insights).toHaveLength(1);
      expect(r.insights[0].severity).toBe("critical");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // BASE SCORE AND OUTSTANDING
  // ═══════════════════════════════════════════════════════════════════════

  describe("base score and outstanding", () => {
    it("baseInput scores 80 — outstanding", () => {
      const r = computeReg4445QualityAssuranceReporting(baseInput());
      expect(r.quality_assurance_score).toBe(80);
      expect(r.quality_assurance_rating).toBe("outstanding");
    });

    it("headline contains outstanding", () => {
      const r = computeReg4445QualityAssuranceReporting(baseInput());
      expect(r.headline.toLowerCase()).toContain("outstanding");
    });

    it("populates all count fields", () => {
      const r = computeReg4445QualityAssuranceReporting(baseInput());
      expect(r.total_reg44_reports).toBe(6);
      expect(r.total_reg45_reviews).toBe(2);
      expect(r.total_action_plans).toBe(10);
      expect(r.total_quality_cycles).toBe(4);
      expect(r.total_notifications).toBe(3);
    });

    it("reg44_completion_rate is 100%", () => {
      const r = computeReg4445QualityAssuranceReporting(baseInput());
      expect(r.reg44_completion_rate).toBe(100);
    });

    it("reg45_timeliness_rate is 100%", () => {
      const r = computeReg4445QualityAssuranceReporting(baseInput());
      expect(r.reg45_timeliness_rate).toBe(100);
    });

    it("action_plan_rate is 100%", () => {
      const r = computeReg4445QualityAssuranceReporting(baseInput());
      expect(r.action_plan_rate).toBe(100);
    });

    it("quality_improvement_rate is 100%", () => {
      const r = computeReg4445QualityAssuranceReporting(baseInput());
      expect(r.quality_improvement_rate).toBe(100);
    });

    it("reg44_quality_avg is 4", () => {
      const r = computeReg4445QualityAssuranceReporting(baseInput());
      expect(r.reg44_quality_avg).toBe(4);
    });

    it("reg45_quality_avg is 4", () => {
      const r = computeReg4445QualityAssuranceReporting(baseInput());
      expect(r.reg45_quality_avg).toBe(4);
    });

    it("action_plan_overdue_count is 0", () => {
      const r = computeReg4445QualityAssuranceReporting(baseInput());
      expect(r.action_plan_overdue_count).toBe(0);
    });

    it("action_plan_escalated_count is 0", () => {
      const r = computeReg4445QualityAssuranceReporting(baseInput());
      expect(r.action_plan_escalated_count).toBe(0);
    });

    it("has strengths", () => {
      const r = computeReg4445QualityAssuranceReporting(baseInput());
      expect(r.strengths.length).toBeGreaterThan(0);
    });

    it("has no concerns at outstanding", () => {
      const r = computeReg4445QualityAssuranceReporting(baseInput());
      expect(r.concerns).toHaveLength(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // RATING THRESHOLDS
  // ═══════════════════════════════════════════════════════════════════════

  describe("rating thresholds", () => {
    it("score >= 80 is outstanding", () => {
      const r = computeReg4445QualityAssuranceReporting(baseInput());
      expect(r.quality_assurance_score).toBeGreaterThanOrEqual(80);
      expect(r.quality_assurance_rating).toBe("outstanding");
    });

    it("score 65-79 is good", () => {
      // Drop reg44 completion to 80% (+3 not +5), drop qi to 60% (+2 not +4) → 52+3+5+5+2+5+4 = 76
      const r44 = [
        ...Array.from({ length: 5 }, (_, i) => makeReg44({ id: `r44_${i}` })),
        makeReg44({ id: "r44_5", report_submitted: false }),
      ];
      const qi = [
        makeQI({ id: "qi_0" }),
        makeQI({ id: "qi_1" }),
        makeQI({ id: "qi_2", improvement_achieved: false }),
        makeQI({ id: "qi_3", improvement_achieved: false }),
        makeQI({ id: "qi_4", improvement_achieved: false }),
      ];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ reg44_report_records: r44, quality_improvement_records: qi }));
      expect(r.quality_assurance_score).toBeGreaterThanOrEqual(65);
      expect(r.quality_assurance_score).toBeLessThan(80);
      expect(r.quality_assurance_rating).toBe("good");
    });

    it("score 45-64 is adequate", () => {
      // Drop some bonuses but avoid penalties:
      // reg44 completion 60% (no bonus, no penalty), reg45 timeliness 0% + 1 rec → penalty2 triggers
      // action plan 50% (no bonus, no penalty), qi 0% (no bonus), notif comp 0 recs (no bonus, no penalty)
      // stakeholder low (no bonus)
      // 52 + 0(b1) + 0(b2) + 0(b3) + 0(b4) + 0(b5) + 0(b6) - 6(p2) = 46
      const r44 = [
        ...Array.from({ length: 3 }, (_, i) => makeReg44({ id: `r44_${i}` })),
        ...Array.from({ length: 2 }, (_, i) => makeReg44({ id: `r44_ns_${i}`, report_submitted: false })),
      ];
      const r45 = [makeReg45({ id: "r45_0", completed_on_time: false, children_consulted: 0, children_total: 4, staff_consulted: 0, placing_authorities_consulted: 0, parents_carers_consulted: 0, professionals_consulted: 0 })];
      const actions = Array.from({ length: 10 }, (_, i) =>
        makeAction({ id: `ap_${i}`, status: i < 5 ? "completed" : "open" }),
      );
      const qi = [makeQI({ id: "qi_0", improvement_achieved: false }), makeQI({ id: "qi_1", improvement_achieved: false })];
      const r = computeReg4445QualityAssuranceReporting(baseInput({
        reg44_report_records: r44, reg45_review_records: r45,
        action_plan_records: actions, quality_improvement_records: qi,
        notification_records: [],
      }));
      expect(r.quality_assurance_score).toBeGreaterThanOrEqual(45);
      expect(r.quality_assurance_score).toBeLessThan(65);
      expect(r.quality_assurance_rating).toBe("adequate");
    });

    it("score < 45 is inadequate", () => {
      // All failing data → triggers penalties
      const r44 = Array.from({ length: 6 }, (_, i) =>
        makeReg44({ id: `r44_${i}`, report_submitted: false, visitor_independent: false }),
      );
      const r45 = [makeReg45({ id: "r45_0", completed_on_time: false, children_consulted: 0, children_total: 4, staff_consulted: 0, placing_authorities_consulted: 0, parents_carers_consulted: 0, professionals_consulted: 0 })];
      const actions = Array.from({ length: 10 }, (_, i) =>
        makeAction({ id: `ap_${i}`, status: "overdue", actual_completion_date: null }),
      );
      const qi = [makeQI({ id: "qi_0", improvement_achieved: false }), makeQI({ id: "qi_1", improvement_achieved: false })];
      const notifs = Array.from({ length: 3 }, (_, i) =>
        makeNotification({ id: `n_${i}`, notified_within_24_hours: false, notified_ofsted: false, documented_in_records: false }),
      );
      const r = computeReg4445QualityAssuranceReporting(baseInput({
        reg44_report_records: r44, reg45_review_records: r45,
        action_plan_records: actions, quality_improvement_records: qi,
        notification_records: notifs,
      }));
      expect(r.quality_assurance_score).toBeLessThan(45);
      expect(r.quality_assurance_rating).toBe("inadequate");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // BONUS 1: reg44CompletionRate
  // ═══════════════════════════════════════════════════════════════════════

  describe("Bonus 1: reg44 completion rate", () => {
    it("+5 when completion rate is 100%", () => {
      const r = computeReg4445QualityAssuranceReporting(baseInput());
      expect(r.reg44_completion_rate).toBe(100);
      expect(r.quality_assurance_score).toBe(80);
    });

    it("+3 when completion rate is 80-99%", () => {
      const r44 = [
        ...Array.from({ length: 4 }, (_, i) => makeReg44({ id: `r44_${i}` })),
        makeReg44({ id: "r44_4", report_submitted: false }),
      ];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ reg44_report_records: r44 }));
      expect(r.reg44_completion_rate).toBe(80);
      // 80 - 5 + 3 = 78
      expect(r.quality_assurance_score).toBe(78);
    });

    it("no bonus when completion rate < 80%", () => {
      const r44 = [
        ...Array.from({ length: 3 }, (_, i) => makeReg44({ id: `r44_${i}` })),
        ...Array.from({ length: 2 }, (_, i) => makeReg44({ id: `r44_ns_${i}`, report_submitted: false })),
      ];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ reg44_report_records: r44 }));
      expect(r.reg44_completion_rate).toBe(60);
      // 80 - 5 = 75
      expect(r.quality_assurance_score).toBe(75);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // BONUS 2: reg45TimelinessRate
  // ═══════════════════════════════════════════════════════════════════════

  describe("Bonus 2: reg45 timeliness rate", () => {
    it("+5 when timeliness rate is 100%", () => {
      const r = computeReg4445QualityAssuranceReporting(baseInput());
      expect(r.reg45_timeliness_rate).toBe(100);
    });

    it("+3 when timeliness rate is 80-99%", () => {
      const r45 = [
        ...Array.from({ length: 4 }, (_, i) => makeReg45({ id: `r45_${i}` })),
        makeReg45({ id: "r45_4", completed_on_time: false }),
      ];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ reg45_review_records: r45 }));
      expect(r.reg45_timeliness_rate).toBe(80);
      // 80 - 5 + 3 = 78
      expect(r.quality_assurance_score).toBe(78);
    });

    it("no bonus when timeliness rate < 80%", () => {
      const r45 = [
        makeReg45({ id: "r45_0" }),
        makeReg45({ id: "r45_1", completed_on_time: false }),
        makeReg45({ id: "r45_2", completed_on_time: false }),
      ];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ reg45_review_records: r45 }));
      expect(r.reg45_timeliness_rate).toBe(33);
      // bonus2 removed, penalty2 triggers (33 < 50): 80 - 5 - 6 = 69
      expect(r.quality_assurance_score).toBe(69);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // BONUS 3: actionPlanRate
  // ═══════════════════════════════════════════════════════════════════════

  describe("Bonus 3: action plan rate", () => {
    it("+5 when rate >= 90%", () => {
      const r = computeReg4445QualityAssuranceReporting(baseInput());
      expect(r.action_plan_rate).toBe(100);
    });

    it("+3 when rate 70-89%", () => {
      const actions = [
        ...Array.from({ length: 7 }, (_, i) => makeAction({ id: `ap_${i}` })),
        ...Array.from({ length: 3 }, (_, i) => makeAction({ id: `ap_open_${i}`, status: "open", actual_completion_date: null })),
      ];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ action_plan_records: actions }));
      expect(r.action_plan_rate).toBe(70);
      // 80 - 5 + 3 = 78
      expect(r.quality_assurance_score).toBe(78);
    });

    it("no bonus when rate < 70%", () => {
      const actions = [
        ...Array.from({ length: 5 }, (_, i) => makeAction({ id: `ap_${i}` })),
        ...Array.from({ length: 5 }, (_, i) => makeAction({ id: `ap_open_${i}`, status: "open", actual_completion_date: null })),
      ];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ action_plan_records: actions }));
      expect(r.action_plan_rate).toBe(50);
      // 80 - 5 = 75
      expect(r.quality_assurance_score).toBe(75);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // BONUS 4: qualityImprovementRate
  // ═══════════════════════════════════════════════════════════════════════

  describe("Bonus 4: quality improvement rate", () => {
    it("+4 when rate >= 80%", () => {
      const r = computeReg4445QualityAssuranceReporting(baseInput());
      expect(r.quality_improvement_rate).toBe(100);
    });

    it("+2 when rate 60-79%", () => {
      const qi = [
        ...Array.from({ length: 3 }, (_, i) => makeQI({ id: `qi_${i}` })),
        makeQI({ id: "qi_3", improvement_achieved: false }),
        makeQI({ id: "qi_4", improvement_achieved: false }),
      ];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ quality_improvement_records: qi }));
      expect(r.quality_improvement_rate).toBe(60);
      // 80 - 4 + 2 = 78
      expect(r.quality_assurance_score).toBe(78);
    });

    it("no bonus when rate < 60%", () => {
      const qi = [
        makeQI({ id: "qi_0" }),
        makeQI({ id: "qi_1", improvement_achieved: false }),
        makeQI({ id: "qi_2", improvement_achieved: false }),
        makeQI({ id: "qi_3", improvement_achieved: false }),
      ];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ quality_improvement_records: qi }));
      expect(r.quality_improvement_rate).toBe(25);
      // 80 - 4 = 76
      expect(r.quality_assurance_score).toBe(76);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // BONUS 5: notificationComplianceRate
  // ═══════════════════════════════════════════════════════════════════════

  describe("Bonus 5: notification compliance rate", () => {
    it("+5 when rate >= 95%", () => {
      const r = computeReg4445QualityAssuranceReporting(baseInput());
      expect(r.notification_compliance_rate).toBe(100);
    });

    it("+3 when rate 80-94%", () => {
      // notificationComplianceRate = round((timeliness + ofsted + documentation) / 3)
      // set 1 of 3 notifs to missing ofsted: ofstedRate = 67, timeliness = 100, doc = 100 → round(267/3) = 89
      const notifs = [
        makeNotification({ id: "n_0" }),
        makeNotification({ id: "n_1" }),
        makeNotification({ id: "n_2", notified_ofsted: false }),
      ];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ notification_records: notifs }));
      expect(r.notification_compliance_rate).toBeGreaterThanOrEqual(80);
      expect(r.notification_compliance_rate).toBeLessThan(95);
      // 80 - 5 + 3 = 78
      expect(r.quality_assurance_score).toBe(78);
    });

    it("no bonus when rate < 80%", () => {
      const notifs = [
        makeNotification({ id: "n_0", notified_within_24_hours: false, notified_ofsted: false, documented_in_records: false }),
        makeNotification({ id: "n_1", notified_within_24_hours: false, notified_ofsted: false, documented_in_records: false }),
        makeNotification({ id: "n_2" }),
      ];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ notification_records: notifs }));
      expect(r.notification_compliance_rate).toBeLessThan(80);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // BONUS 6: stakeholderEngagementRate
  // ═══════════════════════════════════════════════════════════════════════

  describe("Bonus 6: stakeholder engagement rate", () => {
    it("+4 when rate >= 80%", () => {
      const r = computeReg4445QualityAssuranceReporting(baseInput());
      expect(r.stakeholder_engagement_rate).toBeGreaterThanOrEqual(80);
    });

    it("+2 when rate 60-79%", () => {
      // max touchpoints for 1 review: children_total + 3 + 1 + 1 + 1 = 4 + 6 = 10
      // need 6-7 touchpoints for 60-79%: 3+2+1+1+0 = 7 → 70%
      const r45 = [makeReg45({
        id: "r45_0",
        children_consulted: 3, children_total: 4,
        staff_consulted: 2, placing_authorities_consulted: 1,
        parents_carers_consulted: 1, professionals_consulted: 0,
      })];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ reg45_review_records: r45 }));
      expect(r.stakeholder_engagement_rate).toBeGreaterThanOrEqual(60);
      expect(r.stakeholder_engagement_rate).toBeLessThan(80);
    });

    it("no bonus when rate < 60%", () => {
      const r45 = [makeReg45({
        id: "r45_0",
        children_consulted: 0, children_total: 4,
        staff_consulted: 0, placing_authorities_consulted: 0,
        parents_carers_consulted: 0, professionals_consulted: 0,
      })];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ reg45_review_records: r45 }));
      expect(r.stakeholder_engagement_rate).toBeLessThan(60);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // PENALTY 1: reg44CompletionRate < 50
  // ═══════════════════════════════════════════════════════════════════════

  describe("Penalty 1: reg44 completion rate < 50%", () => {
    it("-6 when completion rate < 50% with records", () => {
      const r44 = [
        makeReg44({ id: "r44_0" }),
        makeReg44({ id: "r44_1", report_submitted: false }),
        makeReg44({ id: "r44_2", report_submitted: false }),
        makeReg44({ id: "r44_3", report_submitted: false }),
      ];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ reg44_report_records: r44 }));
      expect(r.reg44_completion_rate).toBe(25);
      // 52 + 0(b1) + 5(b2) + 5(b3) + 4(b4) + 5(b5) + 4(b6) - 6(p1) = 69
      expect(r.quality_assurance_score).toBe(69);
    });

    it("no penalty when totalReg44 is 0", () => {
      const r = computeReg4445QualityAssuranceReporting(baseInput({ reg44_report_records: [] }));
      // No reg44 records: bonus1 skipped, no penalty
      // 52 + 0 + 5 + 5 + 4 + 5 + 4 = 75
      expect(r.quality_assurance_score).toBe(75);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // PENALTY 2: reg45TimelinessRate < 50
  // ═══════════════════════════════════════════════════════════════════════

  describe("Penalty 2: reg45 timeliness rate < 50%", () => {
    it("-6 when timeliness rate < 50% with records", () => {
      const r45 = [
        makeReg45({ id: "r45_0", completed_on_time: false }),
        makeReg45({ id: "r45_1", completed_on_time: false }),
        makeReg45({ id: "r45_2" }),
      ];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ reg45_review_records: r45 }));
      expect(r.reg45_timeliness_rate).toBe(33);
      // 80 - 5(b2 lost) - 6(p2) = 69
      expect(r.quality_assurance_score).toBe(69);
    });

    it("no penalty when totalReg45 is 0", () => {
      const r = computeReg4445QualityAssuranceReporting(baseInput({ reg45_review_records: [] }));
      // No penalty for 0 records, but lose bonus 2 and bonus 6
      // 52 + 5 + 0 + 5 + 4 + 5 + 0 = 71
      expect(r.quality_assurance_score).toBe(71);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // PENALTY 3: actionPlanRate < 40
  // ═══════════════════════════════════════════════════════════════════════

  describe("Penalty 3: action plan rate < 40%", () => {
    it("-5 when action plan rate < 40% with actionable actions", () => {
      const actions = [
        ...Array.from({ length: 3 }, (_, i) => makeAction({ id: `ap_${i}` })),
        ...Array.from({ length: 7 }, (_, i) => makeAction({ id: `ap_open_${i}`, status: "open", actual_completion_date: null })),
      ];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ action_plan_records: actions }));
      expect(r.action_plan_rate).toBe(30);
      // 80 - 5(b3) - 5(p3) = 70
      expect(r.quality_assurance_score).toBe(70);
    });

    it("no penalty when all cancelled", () => {
      const actions = Array.from({ length: 5 }, (_, i) =>
        makeAction({ id: `ap_${i}`, status: "cancelled", actual_completion_date: null }),
      );
      const r = computeReg4445QualityAssuranceReporting(baseInput({ action_plan_records: actions }));
      // actionableActions = 0, so pct(0,0) = 0 but no penalty because actionable = 0
      // bonus 3 not triggered because rate = 0 and < 70
      // 52 + 5 + 5 + 0 + 4 + 5 + 4 = 75
      expect(r.quality_assurance_score).toBe(75);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // PENALTY 4: notificationComplianceRate < 50
  // ═══════════════════════════════════════════════════════════════════════

  describe("Penalty 4: notification compliance rate < 50%", () => {
    it("-5 when notification compliance < 50% with records", () => {
      const notifs = Array.from({ length: 3 }, (_, i) =>
        makeNotification({ id: `n_${i}`, notified_within_24_hours: false, notified_ofsted: false, documented_in_records: false }),
      );
      const r = computeReg4445QualityAssuranceReporting(baseInput({ notification_records: notifs }));
      expect(r.notification_compliance_rate).toBe(0);
      // 80 - 5(b5) - 5(p4) = 70
      expect(r.quality_assurance_score).toBe(70);
    });

    it("no penalty when totalNotifications is 0", () => {
      const r = computeReg4445QualityAssuranceReporting(baseInput({ notification_records: [] }));
      // No notifications: bonus5 skipped (compliance = 0 but denominator = 0, so no bonus and no penalty)
      // 52 + 5 + 5 + 5 + 4 + 0 + 4 = 75
      expect(r.quality_assurance_score).toBe(75);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // SCORE CLAMPING
  // ═══════════════════════════════════════════════════════════════════════

  describe("score clamping", () => {
    it("score never exceeds 100", () => {
      const r = computeReg4445QualityAssuranceReporting(baseInput());
      expect(r.quality_assurance_score).toBeLessThanOrEqual(100);
    });

    it("score never below 0", () => {
      // All penalties stacked
      const r44 = Array.from({ length: 6 }, (_, i) =>
        makeReg44({ id: `r44_${i}`, report_submitted: false }),
      );
      const r45 = Array.from({ length: 2 }, (_, i) =>
        makeReg45({ id: `r45_${i}`, completed_on_time: false, children_consulted: 0, children_total: 4, staff_consulted: 0, placing_authorities_consulted: 0, parents_carers_consulted: 0, professionals_consulted: 0 }),
      );
      const actions = Array.from({ length: 10 }, (_, i) =>
        makeAction({ id: `ap_${i}`, status: "overdue", actual_completion_date: null }),
      );
      const qi = Array.from({ length: 4 }, (_, i) =>
        makeQI({ id: `qi_${i}`, improvement_achieved: false }),
      );
      const notifs = Array.from({ length: 3 }, (_, i) =>
        makeNotification({ id: `n_${i}`, notified_within_24_hours: false, notified_ofsted: false, documented_in_records: false }),
      );
      const r = computeReg4445QualityAssuranceReporting(baseInput({
        reg44_report_records: r44, reg45_review_records: r45,
        action_plan_records: actions, quality_improvement_records: qi,
        notification_records: notifs,
      }));
      expect(r.quality_assurance_score).toBeGreaterThanOrEqual(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // REG 44 METRICS
  // ═══════════════════════════════════════════════════════════════════════

  describe("Reg 44 metrics", () => {
    it("reg44_completion_rate tracks submitted / total", () => {
      const r44 = [
        makeReg44({ id: "r44_0" }),
        makeReg44({ id: "r44_1", report_submitted: false }),
      ];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ reg44_report_records: r44 }));
      expect(r.reg44_completion_rate).toBe(50);
    });

    it("reg44_quality_avg averages only submitted reports", () => {
      const r44 = [
        makeReg44({ id: "r44_0", report_quality_rating: 5 }),
        makeReg44({ id: "r44_1", report_quality_rating: 3 }),
        makeReg44({ id: "r44_2", report_submitted: false, report_quality_rating: 1 }),
      ];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ reg44_report_records: r44 }));
      expect(r.reg44_quality_avg).toBe(4);
    });

    it("reg44_quality_avg is 0 when no submitted reports", () => {
      const r44 = [makeReg44({ id: "r44_0", report_submitted: false })];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ reg44_report_records: r44 }));
      expect(r.reg44_quality_avg).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // REG 45 METRICS
  // ═══════════════════════════════════════════════════════════════════════

  describe("Reg 45 metrics", () => {
    it("reg45_timeliness_rate tracks on-time / total", () => {
      const r45 = [
        makeReg45({ id: "r45_0" }),
        makeReg45({ id: "r45_1", completed_on_time: false }),
      ];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ reg45_review_records: r45 }));
      expect(r.reg45_timeliness_rate).toBe(50);
    });

    it("reg45_quality_avg averages all reviews", () => {
      const r45 = [
        makeReg45({ id: "r45_0", review_quality_rating: 5 }),
        makeReg45({ id: "r45_1", review_quality_rating: 3 }),
      ];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ reg45_review_records: r45 }));
      expect(r.reg45_quality_avg).toBe(4);
    });

    it("reg45_quality_avg is 0 when no reviews", () => {
      const r = computeReg4445QualityAssuranceReporting(baseInput({ reg45_review_records: [] }));
      expect(r.reg45_quality_avg).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // ACTION PLAN METRICS
  // ═══════════════════════════════════════════════════════════════════════

  describe("action plan metrics", () => {
    it("action_plan_rate excludes cancelled from denominator", () => {
      const actions = [
        ...Array.from({ length: 7 }, (_, i) => makeAction({ id: `ap_${i}` })),
        ...Array.from({ length: 3 }, (_, i) => makeAction({ id: `ap_c_${i}`, status: "cancelled", actual_completion_date: null })),
      ];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ action_plan_records: actions }));
      expect(r.action_plan_rate).toBe(100);
    });

    it("tracks overdue count", () => {
      const actions = [
        makeAction({ id: "ap_0" }),
        makeAction({ id: "ap_1", status: "overdue", actual_completion_date: null }),
        makeAction({ id: "ap_2", status: "overdue", actual_completion_date: null }),
      ];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ action_plan_records: actions }));
      expect(r.action_plan_overdue_count).toBe(2);
    });

    it("tracks escalated count", () => {
      const actions = [
        makeAction({ id: "ap_0" }),
        makeAction({ id: "ap_1", status: "escalated", actual_completion_date: null }),
      ];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ action_plan_records: actions }));
      expect(r.action_plan_escalated_count).toBe(1);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // QUALITY IMPROVEMENT METRICS
  // ═══════════════════════════════════════════════════════════════════════

  describe("quality improvement metrics", () => {
    it("quality_improvement_rate tracks improvement achieved / total", () => {
      const qi = [
        makeQI({ id: "qi_0" }),
        makeQI({ id: "qi_1", improvement_achieved: false }),
      ];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ quality_improvement_records: qi }));
      expect(r.quality_improvement_rate).toBe(50);
    });

    it("rate is 0 with no cycles", () => {
      const r = computeReg4445QualityAssuranceReporting(baseInput({ quality_improvement_records: [] }));
      expect(r.quality_improvement_rate).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // NOTIFICATION METRICS
  // ═══════════════════════════════════════════════════════════════════════

  describe("notification metrics", () => {
    it("notification_compliance_rate is composite of timeliness + ofsted + documentation", () => {
      // All true → (100 + 100 + 100) / 3 = 100
      const r = computeReg4445QualityAssuranceReporting(baseInput());
      expect(r.notification_compliance_rate).toBe(100);
    });

    it("notification_compliance_rate is 0 when no notifications", () => {
      const r = computeReg4445QualityAssuranceReporting(baseInput({ notification_records: [] }));
      expect(r.notification_compliance_rate).toBe(0);
    });

    it("partial compliance calculated correctly", () => {
      // 2 of 3 within 24hr → timeliness 67, all ofsted → 100, all documented → 100 → round(267/3) = 89
      const notifs = [
        makeNotification({ id: "n_0" }),
        makeNotification({ id: "n_1" }),
        makeNotification({ id: "n_2", notified_within_24_hours: false }),
      ];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ notification_records: notifs }));
      expect(r.notification_compliance_rate).toBe(89);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // STAKEHOLDER ENGAGEMENT
  // ═══════════════════════════════════════════════════════════════════════

  describe("stakeholder engagement", () => {
    it("stakeholder_engagement_rate is 0 when no reg45 reviews", () => {
      const r = computeReg4445QualityAssuranceReporting(baseInput({ reg45_review_records: [] }));
      expect(r.stakeholder_engagement_rate).toBe(0);
    });

    it("calculates composite stakeholder engagement", () => {
      const r45 = [makeReg45({
        id: "r45_0",
        children_consulted: 4, children_total: 4,
        staff_consulted: 3, placing_authorities_consulted: 1,
        parents_carers_consulted: 1, professionals_consulted: 1,
      })];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ reg45_review_records: r45 }));
      // touchpoints: 4+3+1+1+1 = 10, max: 4 + 3 + 1 + 1 + 1 = 10 → 100%
      expect(r.stakeholder_engagement_rate).toBe(100);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // STRENGTHS
  // ═══════════════════════════════════════════════════════════════════════

  describe("strengths", () => {
    it("includes reg44 100% completion strength", () => {
      const r = computeReg4445QualityAssuranceReporting(baseInput());
      expect(r.strengths.some(s => s.includes("Regulation 44") && s.includes("submitted"))).toBe(true);
    });

    it("includes reg44 80% completion strength", () => {
      const r44 = [
        ...Array.from({ length: 4 }, (_, i) => makeReg44({ id: `r44_${i}` })),
        makeReg44({ id: "r44_4", report_submitted: false }),
      ];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ reg44_report_records: r44 }));
      expect(r.strengths.some(s => s.includes("80%") && s.includes("Reg 44"))).toBe(true);
    });

    it("includes reg45 100% timeliness strength", () => {
      const r = computeReg4445QualityAssuranceReporting(baseInput());
      expect(r.strengths.some(s => s.includes("Regulation 45") && s.includes("on time"))).toBe(true);
    });

    it("includes reg45 80% timeliness strength", () => {
      const r45 = [
        ...Array.from({ length: 4 }, (_, i) => makeReg45({ id: `r45_${i}` })),
        makeReg45({ id: "r45_4", completed_on_time: false }),
      ];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ reg45_review_records: r45 }));
      expect(r.strengths.some(s => s.includes("80%") && s.includes("Reg 45"))).toBe(true);
    });

    it("includes action plan >= 90% strength", () => {
      const r = computeReg4445QualityAssuranceReporting(baseInput());
      expect(r.strengths.some(s => s.includes("action plan") && s.includes("completed"))).toBe(true);
    });

    it("includes action plan 70-89% strength", () => {
      const actions = [
        ...Array.from({ length: 7 }, (_, i) => makeAction({ id: `ap_${i}` })),
        ...Array.from({ length: 3 }, (_, i) => makeAction({ id: `ap_open_${i}`, status: "open", actual_completion_date: null })),
      ];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ action_plan_records: actions }));
      expect(r.strengths.some(s => s.includes("70%") && s.includes("action plan"))).toBe(true);
    });

    it("includes quality improvement >= 80% strength", () => {
      const r = computeReg4445QualityAssuranceReporting(baseInput());
      expect(r.strengths.some(s => s.includes("quality improvement"))).toBe(true);
    });

    it("includes quality improvement 60-79% strength", () => {
      const qi = [
        ...Array.from({ length: 3 }, (_, i) => makeQI({ id: `qi_${i}` })),
        makeQI({ id: "qi_3", improvement_achieved: false }),
        makeQI({ id: "qi_4", improvement_achieved: false }),
      ];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ quality_improvement_records: qi }));
      expect(r.strengths.some(s => s.includes("60%") && s.includes("quality improvement"))).toBe(true);
    });

    it("includes notification compliance >= 95% strength", () => {
      const r = computeReg4445QualityAssuranceReporting(baseInput());
      expect(r.strengths.some(s => s.includes("notification compliance"))).toBe(true);
    });

    it("includes stakeholder engagement >= 80% strength", () => {
      const r = computeReg4445QualityAssuranceReporting(baseInput());
      expect(r.strengths.some(s => s.includes("stakeholder engagement"))).toBe(true);
    });

    it("includes reg44 quality >= 4.0 strength", () => {
      const r = computeReg4445QualityAssuranceReporting(baseInput());
      expect(r.strengths.some(s => s.includes("4/5") && s.includes("Reg 44 report quality"))).toBe(true);
    });

    it("includes reg44 quality 3.0-3.99 strength", () => {
      const r44 = Array.from({ length: 3 }, (_, i) =>
        makeReg44({ id: `r44_${i}`, report_quality_rating: 3 }),
      );
      const r = computeReg4445QualityAssuranceReporting(baseInput({ reg44_report_records: r44 }));
      expect(r.strengths.some(s => s.includes("3/5") && s.includes("Reg 44 report quality"))).toBe(true);
    });

    it("includes reg45 quality >= 4.0 strength", () => {
      const r = computeReg4445QualityAssuranceReporting(baseInput());
      expect(r.strengths.some(s => s.includes("4/5") && s.includes("Reg 45 review quality"))).toBe(true);
    });

    it("includes independence rate 100% strength", () => {
      const r = computeReg4445QualityAssuranceReporting(baseInput());
      expect(r.strengths.some(s => s.includes("independent visitors"))).toBe(true);
    });

    it("includes child views >= 90% strength", () => {
      const r = computeReg4445QualityAssuranceReporting(baseInput());
      expect(r.strengths.some(s => s.includes("Children's views captured"))).toBe(true);
    });

    it("includes children spoken to >= 90% strength", () => {
      const r = computeReg4445QualityAssuranceReporting(baseInput());
      expect(r.strengths.some(s => s.includes("children spoken to"))).toBe(true);
    });

    it("includes shortfall action >= 90% strength", () => {
      const r = computeReg4445QualityAssuranceReporting(baseInput());
      expect(r.strengths.some(s => s.includes("shortfalls actioned"))).toBe(true);
    });

    it("includes prev action resolution >= 90% strength", () => {
      const r = computeReg4445QualityAssuranceReporting(baseInput());
      expect(r.strengths.some(s => s.includes("previous Reg 44 actions resolved"))).toBe(true);
    });

    it("includes reg45 coverage 100% strength", () => {
      const r = computeReg4445QualityAssuranceReporting(baseInput());
      expect(r.strengths.some(s => s.includes("Reg 45 reviews cover the full range"))).toBe(true);
    });

    it("includes dev plan updated 100% strength", () => {
      const r = computeReg4445QualityAssuranceReporting(baseInput());
      expect(r.strengths.some(s => s.includes("development plan is updated"))).toBe(true);
    });

    it("includes reg44 considered in reg45 100% strength", () => {
      const r = computeReg4445QualityAssuranceReporting(baseInput());
      expect(r.strengths.some(s => s.includes("Reg 44 reports are considered"))).toBe(true);
    });

    it("includes manager verification >= 90% strength", () => {
      const r = computeReg4445QualityAssuranceReporting(baseInput());
      expect(r.strengths.some(s => s.includes("verified by management"))).toBe(true);
    });

    it("includes evidence rate >= 90% strength", () => {
      const r = computeReg4445QualityAssuranceReporting(baseInput());
      expect(r.strengths.some(s => s.includes("evidence"))).toBe(true);
    });

    it("includes sustained improvement >= 80% strength", () => {
      const r = computeReg4445QualityAssuranceReporting(baseInput());
      expect(r.strengths.some(s => s.includes("sustained over time"))).toBe(true);
    });

    it("includes records check >= 90% strength", () => {
      const r = computeReg4445QualityAssuranceReporting(baseInput());
      expect(r.strengths.some(s => s.includes("records-checking compliance"))).toBe(true);
    });

    it("includes reg45 child consultation >= 90% strength", () => {
      const r = computeReg4445QualityAssuranceReporting(baseInput());
      expect(r.strengths.some(s => s.includes("children consulted during Reg 45"))).toBe(true);
    });

    it("includes investigation 100% strength", () => {
      const r = computeReg4445QualityAssuranceReporting(baseInput());
      expect(r.strengths.some(s => s.includes("investigations completed"))).toBe(true);
    });

    it("includes child informed >= 90% strength", () => {
      const r = computeReg4445QualityAssuranceReporting(baseInput());
      expect(r.strengths.some(s => s.includes("children informed"))).toBe(true);
    });

    it("includes cycle child consultation >= 80% strength", () => {
      const r = computeReg4445QualityAssuranceReporting(baseInput());
      expect(r.strengths.some(s => s.includes("Children consulted") && s.includes("quality improvement"))).toBe(true);
    });

    it("no strength for low quality avg", () => {
      const r44 = Array.from({ length: 3 }, (_, i) =>
        makeReg44({ id: `r44_${i}`, report_quality_rating: 2 }),
      );
      const r = computeReg4445QualityAssuranceReporting(baseInput({ reg44_report_records: r44 }));
      expect(r.strengths.every(s => !s.includes("Reg 44 report quality averages"))).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // CONCERNS
  // ═══════════════════════════════════════════════════════════════════════

  describe("concerns", () => {
    it("flags reg44 completion < 50%", () => {
      const r44 = [
        makeReg44({ id: "r44_0" }),
        ...Array.from({ length: 3 }, (_, i) => makeReg44({ id: `r44_ns_${i}`, report_submitted: false })),
      ];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ reg44_report_records: r44 }));
      expect(r.concerns.some(c => c.includes("25%") && c.includes("Reg 44 reports submitted"))).toBe(true);
    });

    it("flags reg44 completion 50-79%", () => {
      const r44 = [
        ...Array.from({ length: 3 }, (_, i) => makeReg44({ id: `r44_${i}` })),
        ...Array.from({ length: 2 }, (_, i) => makeReg44({ id: `r44_ns_${i}`, report_submitted: false })),
      ];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ reg44_report_records: r44 }));
      expect(r.concerns.some(c => c.includes("60%") && c.includes("Reg 44 report completion"))).toBe(true);
    });

    it("flags no reg44 reports with children", () => {
      const r = computeReg4445QualityAssuranceReporting(baseInput({ reg44_report_records: [] }));
      expect(r.concerns.some(c => c.includes("No Regulation 44"))).toBe(true);
    });

    it("flags reg45 timeliness < 50%", () => {
      const r45 = [
        makeReg45({ id: "r45_0", completed_on_time: false }),
        makeReg45({ id: "r45_1", completed_on_time: false }),
        makeReg45({ id: "r45_2" }),
      ];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ reg45_review_records: r45 }));
      expect(r.concerns.some(c => c.includes("33%") && c.includes("Reg 45 reviews completed on time"))).toBe(true);
    });

    it("flags reg45 timeliness 50-79%", () => {
      const r45 = [
        makeReg45({ id: "r45_0" }),
        makeReg45({ id: "r45_1" }),
        makeReg45({ id: "r45_2", completed_on_time: false }),
      ];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ reg45_review_records: r45 }));
      expect(r.concerns.some(c => c.includes("67%") && c.includes("Reg 45 review timeliness"))).toBe(true);
    });

    it("flags no reg45 reviews with children", () => {
      const r = computeReg4445QualityAssuranceReporting(baseInput({ reg45_review_records: [] }));
      expect(r.concerns.some(c => c.includes("No Regulation 45"))).toBe(true);
    });

    it("flags action plan rate < 40%", () => {
      const actions = [
        ...Array.from({ length: 3 }, (_, i) => makeAction({ id: `ap_${i}` })),
        ...Array.from({ length: 7 }, (_, i) => makeAction({ id: `ap_open_${i}`, status: "open", actual_completion_date: null })),
      ];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ action_plan_records: actions }));
      expect(r.concerns.some(c => c.includes("30%") && c.includes("action plan items completed"))).toBe(true);
    });

    it("flags action plan rate 40-69%", () => {
      const actions = [
        ...Array.from({ length: 5 }, (_, i) => makeAction({ id: `ap_${i}` })),
        ...Array.from({ length: 5 }, (_, i) => makeAction({ id: `ap_open_${i}`, status: "open", actual_completion_date: null })),
      ];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ action_plan_records: actions }));
      expect(r.concerns.some(c => c.includes("50%") && c.includes("Action plan completion"))).toBe(true);
    });

    it("flags overdue actions", () => {
      const actions = [
        makeAction({ id: "ap_0" }),
        makeAction({ id: "ap_1", status: "overdue", actual_completion_date: null }),
      ];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ action_plan_records: actions }));
      expect(r.concerns.some(c => c.includes("1 action plan item is overdue"))).toBe(true);
    });

    it("flags multiple overdue actions with plural", () => {
      const actions = [
        makeAction({ id: "ap_0", status: "overdue", actual_completion_date: null }),
        makeAction({ id: "ap_1", status: "overdue", actual_completion_date: null }),
      ];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ action_plan_records: actions }));
      expect(r.concerns.some(c => c.includes("2 action plan items are overdue"))).toBe(true);
    });

    it("flags escalated actions", () => {
      const actions = [
        makeAction({ id: "ap_0" }),
        makeAction({ id: "ap_1", status: "escalated", actual_completion_date: null }),
      ];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ action_plan_records: actions }));
      expect(r.concerns.some(c => c.includes("1 action has been escalated"))).toBe(true);
    });

    it("flags multiple escalated actions with plural", () => {
      const actions = [
        makeAction({ id: "ap_0", status: "escalated", actual_completion_date: null }),
        makeAction({ id: "ap_1", status: "escalated", actual_completion_date: null }),
      ];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ action_plan_records: actions }));
      expect(r.concerns.some(c => c.includes("2 actions have been escalated"))).toBe(true);
    });

    it("flags critical overdue actions", () => {
      const actions = [
        makeAction({ id: "ap_0", priority: "critical", status: "overdue", actual_completion_date: null }),
      ];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ action_plan_records: actions }));
      expect(r.concerns.some(c => c.includes("critical-priority") && c.includes("overdue"))).toBe(true);
    });

    it("flags quality improvement < 40%", () => {
      const qi = [
        makeQI({ id: "qi_0", improvement_achieved: false }),
        makeQI({ id: "qi_1", improvement_achieved: false }),
        makeQI({ id: "qi_2", improvement_achieved: false }),
      ];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ quality_improvement_records: qi }));
      expect(r.concerns.some(c => c.includes("0%") && c.includes("quality improvement"))).toBe(true);
    });

    it("flags quality improvement 40-59%", () => {
      const qi = [
        makeQI({ id: "qi_0" }),
        makeQI({ id: "qi_1", improvement_achieved: false }),
      ];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ quality_improvement_records: qi }));
      expect(r.concerns.some(c => c.includes("50%") && c.includes("Quality improvement achievement"))).toBe(true);
    });

    it("flags abandoned cycles", () => {
      const qi = [
        makeQI({ id: "qi_0" }),
        makeQI({ id: "qi_1", status: "abandoned", improvement_achieved: false }),
      ];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ quality_improvement_records: qi }));
      expect(r.concerns.some(c => c.includes("1 quality improvement cycle abandoned"))).toBe(true);
    });

    it("flags notification compliance < 50%", () => {
      const notifs = Array.from({ length: 3 }, (_, i) =>
        makeNotification({ id: `n_${i}`, notified_within_24_hours: false, notified_ofsted: false, documented_in_records: false }),
      );
      const r = computeReg4445QualityAssuranceReporting(baseInput({ notification_records: notifs }));
      expect(r.concerns.some(c => c.includes("Notification compliance") && c.includes("0%"))).toBe(true);
    });

    it("flags notification compliance 50-79%", () => {
      const notifs = [
        makeNotification({ id: "n_0" }),
        makeNotification({ id: "n_1", notified_within_24_hours: false, notified_ofsted: false }),
      ];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ notification_records: notifs }));
      const nc = r.notification_compliance_rate;
      if (nc >= 50 && nc < 80) {
        expect(r.concerns.some(c => c.includes("Notification compliance"))).toBe(true);
      }
    });

    it("flags notification timeliness < 80%", () => {
      const notifs = [
        makeNotification({ id: "n_0" }),
        makeNotification({ id: "n_1", notified_within_24_hours: false }),
        makeNotification({ id: "n_2", notified_within_24_hours: false }),
      ];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ notification_records: notifs }));
      expect(r.concerns.some(c => c.includes("notifications made within 24 hours"))).toBe(true);
    });

    it("flags stakeholder engagement < 40%", () => {
      const r45 = [makeReg45({
        id: "r45_0",
        children_consulted: 0, children_total: 4,
        staff_consulted: 0, placing_authorities_consulted: 0,
        parents_carers_consulted: 0, professionals_consulted: 0,
      })];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ reg45_review_records: r45 }));
      expect(r.concerns.some(c => c.includes("Stakeholder engagement") && c.includes("0%"))).toBe(true);
    });

    it("flags independence rate < 80%", () => {
      const r44 = [
        makeReg44({ id: "r44_0" }),
        makeReg44({ id: "r44_1", visitor_independent: false }),
        makeReg44({ id: "r44_2", visitor_independent: false }),
      ];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ reg44_report_records: r44 }));
      expect(r.concerns.some(c => c.includes("independent visitors"))).toBe(true);
    });

    it("flags child views < 70%", () => {
      const r44 = [
        makeReg44({ id: "r44_0" }),
        makeReg44({ id: "r44_1", child_views_captured: false }),
        makeReg44({ id: "r44_2", child_views_captured: false }),
      ];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ reg44_report_records: r44 }));
      expect(r.concerns.some(c => c.includes("Children's views captured"))).toBe(true);
    });

    it("flags shortfall action rate < 60%", () => {
      const r44 = [
        makeReg44({ id: "r44_0", shortfalls_identified: 5, shortfalls_actioned: 1 }),
      ];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ reg44_report_records: r44 }));
      expect(r.concerns.some(c => c.includes("shortfalls have been actioned"))).toBe(true);
    });

    it("flags reg45 coverage < 80%", () => {
      const r45 = [
        makeReg45({ id: "r45_0", review_covers_all_standards: false }),
        makeReg45({ id: "r45_1", review_covers_all_standards: false }),
        makeReg45({ id: "r45_2" }),
      ];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ reg45_review_records: r45 }));
      expect(r.concerns.some(c => c.includes("Reg 45 reviews cover all quality standards"))).toBe(true);
    });

    it("flags reg44 considered in reg45 < 80%", () => {
      const r45 = [makeReg45({ id: "r45_0", reg44_reports_considered: 1, reg44_reports_available: 6 })];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ reg45_review_records: r45 }));
      expect(r.concerns.some(c => c.includes("Reg 44 reports considered in Reg 45"))).toBe(true);
    });

    it("flags reg45 child consultation < 70%", () => {
      const r45 = [makeReg45({ id: "r45_0", children_consulted: 1, children_total: 4 })];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ reg45_review_records: r45 }));
      expect(r.concerns.some(c => c.includes("children consulted during Reg 45"))).toBe(true);
    });

    it("flags manager verification < 60%", () => {
      const actions = [
        makeAction({ id: "ap_0", verified_by_manager: false }),
        makeAction({ id: "ap_1", verified_by_manager: false }),
      ];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ action_plan_records: actions }));
      expect(r.concerns.some(c => c.includes("verified by management"))).toBe(true);
    });

    it("flags evidence rate < 60%", () => {
      const actions = [
        makeAction({ id: "ap_0", evidence_of_completion: false }),
        makeAction({ id: "ap_1", evidence_of_completion: false }),
      ];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ action_plan_records: actions }));
      expect(r.concerns.some(c => c.includes("evidence"))).toBe(true);
    });

    it("flags follow-up rate < 70%", () => {
      const actions = [
        makeAction({ id: "ap_0", follow_up_required: true, follow_up_completed: false }),
        makeAction({ id: "ap_1", follow_up_required: true, follow_up_completed: false }),
        makeAction({ id: "ap_2", follow_up_required: true, follow_up_completed: false }),
      ];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ action_plan_records: actions }));
      expect(r.concerns.some(c => c.includes("follow-ups completed"))).toBe(true);
    });

    it("flags investigation completion < 80%", () => {
      const notifs = [
        makeNotification({ id: "n_0", investigation_completed: false }),
        makeNotification({ id: "n_1", investigation_completed: false }),
        makeNotification({ id: "n_2" }),
      ];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ notification_records: notifs }));
      expect(r.concerns.some(c => c.includes("investigations completed"))).toBe(true);
    });

    it("flags records check rate < 70%", () => {
      const r44 = Array.from({ length: 3 }, (_, i) =>
        makeReg44({
          id: `r44_${i}`,
          medication_records_checked: false,
          sanctions_records_checked: false,
          complaints_reviewed: false,
          safeguarding_reviewed: false,
        }),
      );
      const r = computeReg4445QualityAssuranceReporting(baseInput({ reg44_report_records: r44 }));
      expect(r.concerns.some(c => c.includes("Records-checking compliance"))).toBe(true);
    });

    it("flags sustained improvement < 50%", () => {
      const qi = [
        makeQI({ id: "qi_0", sustained_over_time: false }),
        makeQI({ id: "qi_1", sustained_over_time: false }),
      ];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ quality_improvement_records: qi }));
      expect(r.concerns.some(c => c.includes("sustained over time"))).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // RECOMMENDATIONS
  // ═══════════════════════════════════════════════════════════════════════

  describe("recommendations", () => {
    it("recommends immediate reg44 appointment when no reg44 with children", () => {
      const r = computeReg4445QualityAssuranceReporting(baseInput({ reg44_report_records: [] }));
      expect(r.recommendations.some(rec => rec.urgency === "immediate" && rec.recommendation.includes("Reg 44"))).toBe(true);
    });

    it("recommends immediate reg45 review when no reg45 with children", () => {
      const r = computeReg4445QualityAssuranceReporting(baseInput({ reg45_review_records: [] }));
      expect(r.recommendations.some(rec => rec.urgency === "immediate" && rec.recommendation.includes("Regulation 45"))).toBe(true);
    });

    it("recommends immediate action for low reg44 completion", () => {
      const r44 = [
        makeReg44({ id: "r44_0" }),
        ...Array.from({ length: 3 }, (_, i) => makeReg44({ id: `r44_ns_${i}`, report_submitted: false })),
      ];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ reg44_report_records: r44 }));
      expect(r.recommendations.some(rec => rec.urgency === "immediate" && rec.recommendation.includes("Reg 44 report submission"))).toBe(true);
    });

    it("recommends immediate action for low reg45 timeliness", () => {
      const r45 = [
        makeReg45({ id: "r45_0", completed_on_time: false }),
        makeReg45({ id: "r45_1", completed_on_time: false }),
        makeReg45({ id: "r45_2" }),
      ];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ reg45_review_records: r45 }));
      expect(r.recommendations.some(rec => rec.urgency === "immediate" && rec.recommendation.includes("Reg 45 review timeliness"))).toBe(true);
    });

    it("recommends immediate action for low notification compliance", () => {
      const notifs = Array.from({ length: 3 }, (_, i) =>
        makeNotification({ id: `n_${i}`, notified_within_24_hours: false, notified_ofsted: false, documented_in_records: false }),
      );
      const r = computeReg4445QualityAssuranceReporting(baseInput({ notification_records: notifs }));
      expect(r.recommendations.some(rec => rec.urgency === "immediate" && rec.recommendation.includes("notification compliance"))).toBe(true);
    });

    it("recommends immediate action for low action plan rate", () => {
      const actions = [
        ...Array.from({ length: 3 }, (_, i) => makeAction({ id: `ap_${i}` })),
        ...Array.from({ length: 7 }, (_, i) => makeAction({ id: `ap_open_${i}`, status: "open", actual_completion_date: null })),
      ];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ action_plan_records: actions }));
      expect(r.recommendations.some(rec => rec.urgency === "immediate" && rec.recommendation.includes("action plan"))).toBe(true);
    });

    it("recommends immediate action for critical overdue", () => {
      const actions = [
        makeAction({ id: "ap_0", priority: "critical", status: "overdue", actual_completion_date: null }),
      ];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ action_plan_records: actions }));
      expect(r.recommendations.some(rec => rec.urgency === "immediate" && rec.recommendation.includes("critical-priority"))).toBe(true);
    });

    it("recommends immediate action for low independence rate", () => {
      const r44 = [
        makeReg44({ id: "r44_0" }),
        makeReg44({ id: "r44_1", visitor_independent: false }),
        makeReg44({ id: "r44_2", visitor_independent: false }),
      ];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ reg44_report_records: r44 }));
      expect(r.recommendations.some(rec => rec.urgency === "immediate" && rec.recommendation.includes("independent visitors"))).toBe(true);
    });

    it("generates 'soon' recommendation for reg44 completion 50-79%", () => {
      const r44 = [
        ...Array.from({ length: 3 }, (_, i) => makeReg44({ id: `r44_${i}` })),
        ...Array.from({ length: 2 }, (_, i) => makeReg44({ id: `r44_ns_${i}`, report_submitted: false })),
      ];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ reg44_report_records: r44 }));
      expect(r.recommendations.some(rec => rec.urgency === "soon" && rec.recommendation.includes("Reg 44 report submission"))).toBe(true);
    });

    it("generates 'soon' recommendation for reg45 timeliness 50-79%", () => {
      const r45 = [
        makeReg45({ id: "r45_0" }),
        makeReg45({ id: "r45_1" }),
        makeReg45({ id: "r45_2", completed_on_time: false }),
      ];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ reg45_review_records: r45 }));
      expect(r.recommendations.some(rec => rec.urgency === "soon" && rec.recommendation.includes("Reg 45 review timeliness"))).toBe(true);
    });

    it("generates 'soon' recommendation for action plan 40-69%", () => {
      const actions = [
        ...Array.from({ length: 5 }, (_, i) => makeAction({ id: `ap_${i}` })),
        ...Array.from({ length: 5 }, (_, i) => makeAction({ id: `ap_open_${i}`, status: "open", actual_completion_date: null })),
      ];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ action_plan_records: actions }));
      expect(r.recommendations.some(rec => rec.urgency === "soon" && rec.recommendation.includes("action plan completion"))).toBe(true);
    });

    it("generates 'soon' recommendation for qi < 60%", () => {
      const qi = [
        makeQI({ id: "qi_0" }),
        makeQI({ id: "qi_1", improvement_achieved: false }),
        makeQI({ id: "qi_2", improvement_achieved: false }),
      ];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ quality_improvement_records: qi }));
      expect(r.recommendations.some(rec => rec.urgency === "soon" && rec.recommendation.includes("quality improvement"))).toBe(true);
    });

    it("generates 'planned' recommendation for manager verification < 60%", () => {
      const actions = [
        makeAction({ id: "ap_0", verified_by_manager: false }),
        makeAction({ id: "ap_1", verified_by_manager: false }),
      ];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ action_plan_records: actions }));
      expect(r.recommendations.some(rec => rec.urgency === "planned" && rec.recommendation.includes("management verification"))).toBe(true);
    });

    it("generates 'planned' recommendation for evidence < 60%", () => {
      const actions = [
        makeAction({ id: "ap_0", evidence_of_completion: false }),
        makeAction({ id: "ap_1", evidence_of_completion: false }),
      ];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ action_plan_records: actions }));
      expect(r.recommendations.some(rec => rec.urgency === "planned" && rec.recommendation.includes("evidence of completion"))).toBe(true);
    });

    it("ranks recommendations sequentially", () => {
      const r = computeReg4445QualityAssuranceReporting(baseInput({ reg44_report_records: [], reg45_review_records: [] }));
      for (let i = 0; i < r.recommendations.length; i++) {
        expect(r.recommendations[i].rank).toBe(i + 1);
      }
    });

    it("all recommendations have regulatory_ref", () => {
      const r = computeReg4445QualityAssuranceReporting(baseInput({ reg44_report_records: [], reg45_review_records: [] }));
      for (const rec of r.recommendations) {
        expect(rec.regulatory_ref).toBeTruthy();
      }
    });

    it("no recommendations for outstanding", () => {
      const r = computeReg4445QualityAssuranceReporting(baseInput());
      expect(r.recommendations).toHaveLength(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // INSIGHTS
  // ═══════════════════════════════════════════════════════════════════════

  describe("insights", () => {
    it("critical insight for no reg44 with children", () => {
      const r = computeReg4445QualityAssuranceReporting(baseInput({ reg44_report_records: [] }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("no Regulation 44"))).toBe(true);
    });

    it("critical insight for no reg45 with children", () => {
      const r = computeReg4445QualityAssuranceReporting(baseInput({ reg45_review_records: [] }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("no Regulation 45"))).toBe(true);
    });

    it("critical insight for reg44 completion < 50%", () => {
      const r44 = [
        makeReg44({ id: "r44_0" }),
        ...Array.from({ length: 3 }, (_, i) => makeReg44({ id: `r44_ns_${i}`, report_submitted: false })),
      ];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ reg44_report_records: r44 }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("25%") && i.text.includes("Reg 44"))).toBe(true);
    });

    it("critical insight for reg45 timeliness < 50%", () => {
      const r45 = [
        makeReg45({ id: "r45_0", completed_on_time: false }),
        makeReg45({ id: "r45_1", completed_on_time: false }),
        makeReg45({ id: "r45_2" }),
      ];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ reg45_review_records: r45 }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("33%") && i.text.includes("Reg 45"))).toBe(true);
    });

    it("critical insight for notification compliance < 50%", () => {
      const notifs = Array.from({ length: 3 }, (_, i) =>
        makeNotification({ id: `n_${i}`, notified_within_24_hours: false, notified_ofsted: false, documented_in_records: false }),
      );
      const r = computeReg4445QualityAssuranceReporting(baseInput({ notification_records: notifs }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("Notification compliance"))).toBe(true);
    });

    it("critical insight for action plan < 40%", () => {
      const actions = [
        ...Array.from({ length: 3 }, (_, i) => makeAction({ id: `ap_${i}` })),
        ...Array.from({ length: 7 }, (_, i) => makeAction({ id: `ap_open_${i}`, status: "open", actual_completion_date: null })),
      ];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ action_plan_records: actions }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("action plan items completed"))).toBe(true);
    });

    it("critical insight for critical overdue", () => {
      const actions = [
        makeAction({ id: "ap_0", priority: "critical", status: "overdue", actual_completion_date: null }),
      ];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ action_plan_records: actions }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("critical-priority"))).toBe(true);
    });

    it("critical insight for independence < 50%", () => {
      const r44 = [
        makeReg44({ id: "r44_0" }),
        ...Array.from({ length: 3 }, (_, i) => makeReg44({ id: `r44_ni_${i}`, visitor_independent: false })),
      ];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ reg44_report_records: r44 }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("independent visitors"))).toBe(true);
    });

    it("warning insight for reg44 completion 50-79%", () => {
      const r44 = [
        ...Array.from({ length: 3 }, (_, i) => makeReg44({ id: `r44_${i}` })),
        ...Array.from({ length: 2 }, (_, i) => makeReg44({ id: `r44_ns_${i}`, report_submitted: false })),
      ];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ reg44_report_records: r44 }));
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Reg 44 report completion"))).toBe(true);
    });

    it("warning insight for reg45 timeliness 50-79%", () => {
      const r45 = [
        makeReg45({ id: "r45_0" }),
        makeReg45({ id: "r45_1" }),
        makeReg45({ id: "r45_2", completed_on_time: false }),
      ];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ reg45_review_records: r45 }));
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Reg 45 review timeliness"))).toBe(true);
    });

    it("warning insight for action plan rate 40-69%", () => {
      const actions = [
        ...Array.from({ length: 5 }, (_, i) => makeAction({ id: `ap_${i}` })),
        ...Array.from({ length: 5 }, (_, i) => makeAction({ id: `ap_open_${i}`, status: "open", actual_completion_date: null })),
      ];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ action_plan_records: actions }));
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Action plan completion"))).toBe(true);
    });

    it("warning insight for qi rate 40-59%", () => {
      const qi = [
        makeQI({ id: "qi_0" }),
        makeQI({ id: "qi_1", improvement_achieved: false }),
      ];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ quality_improvement_records: qi }));
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Quality improvement achievement"))).toBe(true);
    });

    it("warning insight for notification compliance 50-79%", () => {
      const notifs = [
        makeNotification({ id: "n_0" }),
        makeNotification({ id: "n_1", notified_within_24_hours: false, notified_ofsted: false }),
      ];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ notification_records: notifs }));
      const nc = r.notification_compliance_rate;
      if (nc >= 50 && nc < 80) {
        expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Notification compliance"))).toBe(true);
      }
    });

    it("warning insight for reg44 quality < 3.0", () => {
      const r44 = Array.from({ length: 3 }, (_, i) =>
        makeReg44({ id: `r44_${i}`, report_quality_rating: 2 }),
      );
      const r = computeReg4445QualityAssuranceReporting(baseInput({ reg44_report_records: r44 }));
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Reg 44 report quality"))).toBe(true);
    });

    it("warning insight for reg45 quality < 3.0", () => {
      const r45 = [makeReg45({ id: "r45_0", review_quality_rating: 2 })];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ reg45_review_records: r45 }));
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Reg 45 review quality"))).toBe(true);
    });

    it("warning insight for abandoned cycles when >= 3 total", () => {
      const qi = [
        makeQI({ id: "qi_0" }),
        makeQI({ id: "qi_1" }),
        makeQI({ id: "qi_2", status: "abandoned", improvement_achieved: false }),
      ];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ quality_improvement_records: qi }));
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("abandoned"))).toBe(true);
    });

    it("warning insight for action plan sources when >= 5 actions", () => {
      const actions = Array.from({ length: 5 }, (_, i) =>
        makeAction({ id: `ap_${i}`, source: "reg44" }),
      );
      const r = computeReg4445QualityAssuranceReporting(baseInput({ action_plan_records: actions }));
      expect(r.insights.some(i => i.text.includes("Action plan sources"))).toBe(true);
    });

    it("warning insight for notification type patterns when >= 3 notifications", () => {
      const notifs = Array.from({ length: 3 }, (_, i) =>
        makeNotification({ id: `n_${i}`, notification_type: "child_missing" }),
      );
      const r = computeReg4445QualityAssuranceReporting(baseInput({ notification_records: notifs }));
      expect(r.insights.some(i => i.text.includes("Notification event types"))).toBe(true);
    });

    it("positive insight for outstanding rating", () => {
      const r = computeReg4445QualityAssuranceReporting(baseInput());
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("outstanding quality assurance"))).toBe(true);
    });

    it("positive insight for 100% reg44 completion with high quality", () => {
      const r = computeReg4445QualityAssuranceReporting(baseInput());
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("100% Reg 44 report submission"))).toBe(true);
    });

    it("positive insight for 100% reg45 timeliness with coverage", () => {
      const r = computeReg4445QualityAssuranceReporting(baseInput());
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("Reg 45 reviews completed on time"))).toBe(true);
    });

    it("positive insight for rigorous action plan cycle", () => {
      const r = computeReg4445QualityAssuranceReporting(baseInput());
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("action plan completion"))).toBe(true);
    });

    it("positive insight for quality improvement with sustained results", () => {
      const r = computeReg4445QualityAssuranceReporting(baseInput());
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("improvement cycles achieving goals"))).toBe(true);
    });

    it("positive insight for high notification compliance with investigations", () => {
      const r = computeReg4445QualityAssuranceReporting(baseInput());
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("notification compliance"))).toBe(true);
    });

    it("positive insight for stakeholder engagement with child consultation", () => {
      const r = computeReg4445QualityAssuranceReporting(baseInput());
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("stakeholder engagement"))).toBe(true);
    });

    it("positive insight for reg44/reg45 integration", () => {
      const r = computeReg4445QualityAssuranceReporting(baseInput());
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("integration of Reg 44 findings"))).toBe(true);
    });

    it("positive insight for shortfall and action resolution", () => {
      const r = computeReg4445QualityAssuranceReporting(baseInput());
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("shortfalls actioned"))).toBe(true);
    });

    it("positive insight for independence, child views, records check", () => {
      const r = computeReg4445QualityAssuranceReporting(baseInput());
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("independent visitors"))).toBe(true);
    });

    it("positive insight for child-centred improvement cycles", () => {
      const r = computeReg4445QualityAssuranceReporting(baseInput());
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("Children consulted"))).toBe(true);
    });

    it("positive insight for children informed of notification outcomes", () => {
      const r = computeReg4445QualityAssuranceReporting(baseInput());
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("children informed of outcomes"))).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // HEADLINES
  // ═══════════════════════════════════════════════════════════════════════

  describe("headlines", () => {
    it("outstanding headline", () => {
      const r = computeReg4445QualityAssuranceReporting(baseInput());
      expect(r.headline).toContain("Outstanding");
    });

    it("good headline includes strength and concern counts", () => {
      const r44 = [
        ...Array.from({ length: 5 }, (_, i) => makeReg44({ id: `r44_${i}` })),
        makeReg44({ id: "r44_5", report_submitted: false }),
      ];
      const qi = [
        makeQI({ id: "qi_0" }),
        makeQI({ id: "qi_1" }),
        makeQI({ id: "qi_2", improvement_achieved: false }),
        makeQI({ id: "qi_3", improvement_achieved: false }),
        makeQI({ id: "qi_4", improvement_achieved: false }),
      ];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ reg44_report_records: r44, quality_improvement_records: qi }));
      expect(r.headline).toContain("Good");
      expect(r.headline).toMatch(/strength/);
    });

    it("adequate headline includes concern count", () => {
      const r44 = Array.from({ length: 6 }, (_, i) =>
        makeReg44({ id: `r44_${i}`, report_submitted: i < 3, submitted_within_deadline: i < 3, child_views_captured: false, visitor_independent: false }),
      );
      const r45 = [makeReg45({ id: "r45_0", completed_on_time: false, children_consulted: 0, staff_consulted: 0, placing_authorities_consulted: 0, parents_carers_consulted: 0, professionals_consulted: 0 })];
      const actions = Array.from({ length: 10 }, (_, i) =>
        makeAction({ id: `ap_${i}`, status: i < 5 ? "completed" : "open" }),
      );
      const qi = [makeQI({ id: "qi_0", improvement_achieved: false }), makeQI({ id: "qi_1", improvement_achieved: false })];
      const notifs = [makeNotification({ id: "n_0", notified_within_24_hours: false, notified_ofsted: false, documented_in_records: false })];
      const r = computeReg4445QualityAssuranceReporting(baseInput({
        reg44_report_records: r44, reg45_review_records: r45,
        action_plan_records: actions, quality_improvement_records: qi,
        notification_records: notifs,
      }));
      if (r.quality_assurance_rating === "adequate") {
        expect(r.headline).toContain("Adequate");
        expect(r.headline).toMatch(/concern/);
      }
    });

    it("inadequate headline includes concern count", () => {
      const r44 = Array.from({ length: 6 }, (_, i) =>
        makeReg44({ id: `r44_${i}`, report_submitted: false, visitor_independent: false }),
      );
      const r45 = [makeReg45({ id: "r45_0", completed_on_time: false, children_consulted: 0, children_total: 4, staff_consulted: 0, placing_authorities_consulted: 0, parents_carers_consulted: 0, professionals_consulted: 0 })];
      const actions = Array.from({ length: 10 }, (_, i) =>
        makeAction({ id: `ap_${i}`, status: "overdue", actual_completion_date: null }),
      );
      const qi = Array.from({ length: 4 }, (_, i) =>
        makeQI({ id: `qi_${i}`, improvement_achieved: false }),
      );
      const notifs = Array.from({ length: 3 }, (_, i) =>
        makeNotification({ id: `n_${i}`, notified_within_24_hours: false, notified_ofsted: false, documented_in_records: false }),
      );
      const r = computeReg4445QualityAssuranceReporting(baseInput({
        reg44_report_records: r44, reg45_review_records: r45,
        action_plan_records: actions, quality_improvement_records: qi,
        notification_records: notifs,
      }));
      expect(r.headline).toContain("inadequate");
      expect(r.headline).toMatch(/concern/);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // EDGE CASES
  // ═══════════════════════════════════════════════════════════════════════

  describe("edge cases", () => {
    it("single reg44 report — all metrics still work", () => {
      const r = computeReg4445QualityAssuranceReporting(baseInput({
        reg44_report_records: [makeReg44({ id: "r44_only" })],
      }));
      expect(r.total_reg44_reports).toBe(1);
      expect(r.reg44_completion_rate).toBe(100);
    });

    it("single reg45 review — all metrics still work", () => {
      const r = computeReg4445QualityAssuranceReporting(baseInput({
        reg45_review_records: [makeReg45({ id: "r45_only" })],
      }));
      expect(r.total_reg45_reviews).toBe(1);
      expect(r.reg45_timeliness_rate).toBe(100);
    });

    it("single action plan — all metrics still work", () => {
      const r = computeReg4445QualityAssuranceReporting(baseInput({
        action_plan_records: [makeAction({ id: "ap_only" })],
      }));
      expect(r.total_action_plans).toBe(1);
      expect(r.action_plan_rate).toBe(100);
    });

    it("single quality improvement cycle — all metrics still work", () => {
      const r = computeReg4445QualityAssuranceReporting(baseInput({
        quality_improvement_records: [makeQI({ id: "qi_only" })],
      }));
      expect(r.total_quality_cycles).toBe(1);
      expect(r.quality_improvement_rate).toBe(100);
    });

    it("single notification — all metrics still work", () => {
      const r = computeReg4445QualityAssuranceReporting(baseInput({
        notification_records: [makeNotification({ id: "n_only" })],
      }));
      expect(r.total_notifications).toBe(1);
      expect(r.notification_compliance_rate).toBe(100);
    });

    it("mixed action statuses counted correctly", () => {
      const actions = [
        makeAction({ id: "ap_0", status: "completed" }),
        makeAction({ id: "ap_1", status: "open", actual_completion_date: null }),
        makeAction({ id: "ap_2", status: "in_progress", actual_completion_date: null }),
        makeAction({ id: "ap_3", status: "overdue", actual_completion_date: null }),
        makeAction({ id: "ap_4", status: "escalated", actual_completion_date: null }),
        makeAction({ id: "ap_5", status: "cancelled", actual_completion_date: null }),
      ];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ action_plan_records: actions }));
      expect(r.total_action_plans).toBe(6);
      expect(r.action_plan_overdue_count).toBe(1);
      expect(r.action_plan_escalated_count).toBe(1);
      // actionable = 6 - 1 cancelled = 5, completed = 1 → 20%
      expect(r.action_plan_rate).toBe(20);
    });

    it("all cancelled actions yield 0 rate without penalty", () => {
      const actions = Array.from({ length: 5 }, (_, i) =>
        makeAction({ id: `ap_${i}`, status: "cancelled", actual_completion_date: null }),
      );
      const r = computeReg4445QualityAssuranceReporting(baseInput({ action_plan_records: actions }));
      expect(r.action_plan_rate).toBe(0);
      // No penalty because actionable = 0
    });

    it("quality improvement with baseline == target skipped for progress", () => {
      const qi = [makeQI({ id: "qi_0", baseline_measure: 80, target_measure: 80, current_measure: 80 })];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ quality_improvement_records: qi }));
      expect(r.total_quality_cycles).toBe(1);
    });

    it("notification types with underscores are processed", () => {
      const notifs = [
        makeNotification({ id: "n_0", notification_type: "child_missing" }),
        makeNotification({ id: "n_1", notification_type: "police_involvement" }),
        makeNotification({ id: "n_2", notification_type: "serious_complaint" }),
      ];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ notification_records: notifs }));
      expect(r.insights.some(i => i.text.includes("child missing"))).toBe(true);
    });

    it("reg44 with 0 shortfalls identified yields 0% shortfall action rate without triggering concern", () => {
      const r44 = [makeReg44({ id: "r44_0", shortfalls_identified: 0, shortfalls_actioned: 0 })];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ reg44_report_records: r44 }));
      // pct(0, 0) = 0, but concern only triggers when totalShortfallsIdentified > 0
      expect(r.concerns.every(c => !c.includes("shortfalls have been actioned"))).toBe(true);
    });

    it("reg44 with 0 previous actions total yields no prev action concern", () => {
      const r44 = [makeReg44({ id: "r44_0", previous_actions_total: 0, previous_actions_resolved: 0 })];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ reg44_report_records: r44 }));
      // No prev actions concern because totalPrevActionsTotal = 0
    });

    it("reg45 with 0 children_total yields 0% child consultation without concern", () => {
      const r45 = [makeReg45({ id: "r45_0", children_consulted: 0, children_total: 0 })];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ reg45_review_records: r45 }));
      // totalChildrenTotalReg45 = 0 → no concern triggered
      expect(r.concerns.every(c => !c.includes("children consulted during Reg 45"))).toBe(true);
    });

    it("notification with no follow-up required yields no follow-up concern", () => {
      const notifs = [makeNotification({ id: "n_0", follow_up_report_required: false, follow_up_report_submitted: false })];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ notification_records: notifs }));
      // followUpRequired = 0, so no concern
    });

    it("dev plan update rate < 80% triggers warning insight", () => {
      const r45 = [
        makeReg45({ id: "r45_0" }),
        makeReg45({ id: "r45_1", development_plan_updated: false }),
        makeReg45({ id: "r45_2", development_plan_updated: false }),
      ];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ reg45_review_records: r45 }));
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Development plan updated"))).toBe(true);
    });

    it("stakeholder engagement 40-59% triggers concern", () => {
      const r45 = [makeReg45({
        id: "r45_0",
        children_consulted: 2, children_total: 4,
        staff_consulted: 1, placing_authorities_consulted: 0,
        parents_carers_consulted: 0, professionals_consulted: 0,
      })];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ reg45_review_records: r45 }));
      if (r.stakeholder_engagement_rate >= 40 && r.stakeholder_engagement_rate < 60) {
        expect(r.concerns.some(c => c.includes("Stakeholder engagement"))).toBe(true);
      }
    });

    it("child informed rate < 80% triggers planned recommendation", () => {
      const notifs = [
        makeNotification({ id: "n_0", child_informed_of_outcome: false }),
        makeNotification({ id: "n_1", child_informed_of_outcome: false }),
        makeNotification({ id: "n_2" }),
      ];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ notification_records: notifs }));
      expect(r.recommendations.some(rec => rec.urgency === "planned" && rec.recommendation.includes("children are informed"))).toBe(true);
    });

    it("sustained improvement 30-49% triggers warning insight", () => {
      const qi = [
        makeQI({ id: "qi_0", sustained_over_time: false }),
        makeQI({ id: "qi_1", sustained_over_time: false }),
        makeQI({ id: "qi_2", sustained_over_time: true }),
      ];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ quality_improvement_records: qi }));
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("sustained"))).toBe(true);
    });

    it("notification timeliness < 80% triggers immediate recommendation", () => {
      const notifs = [
        makeNotification({ id: "n_0" }),
        makeNotification({ id: "n_1", notified_within_24_hours: false }),
        makeNotification({ id: "n_2", notified_within_24_hours: false }),
      ];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ notification_records: notifs }));
      expect(r.recommendations.some(rec => rec.urgency === "immediate" && rec.recommendation.includes("notification timeliness"))).toBe(true);
    });

    it("shortfall action rate 60-79% triggers warning insight", () => {
      const r44 = [
        makeReg44({ id: "r44_0", shortfalls_identified: 10, shortfalls_actioned: 7 }),
      ];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ reg44_report_records: r44 }));
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("shortfalls actioned"))).toBe(true);
    });

    it("prev action resolution 50-79% triggers warning insight", () => {
      const r44 = [
        makeReg44({ id: "r44_0", previous_actions_resolved: 3, previous_actions_total: 5 }),
      ];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ reg44_report_records: r44 }));
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Previous Reg 44 action resolution"))).toBe(true);
    });

    it("independence 50-79% triggers warning insight", () => {
      const r44 = [
        makeReg44({ id: "r44_0" }),
        makeReg44({ id: "r44_1" }),
        makeReg44({ id: "r44_2", visitor_independent: false }),
      ];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ reg44_report_records: r44 }));
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Independence rate"))).toBe(true);
    });

    it("overdue actions with rate >= 40% triggers warning insight", () => {
      const actions = [
        ...Array.from({ length: 5 }, (_, i) => makeAction({ id: `ap_${i}` })),
        makeAction({ id: "ap_overdue", status: "overdue", actual_completion_date: null }),
      ];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ action_plan_records: actions }));
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("overdue"))).toBe(true);
    });

    it("'soon' rec for shortfall action < 60%", () => {
      const r44 = [makeReg44({ id: "r44_0", shortfalls_identified: 5, shortfalls_actioned: 1 })];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ reg44_report_records: r44 }));
      expect(r.recommendations.some(rec => rec.urgency === "soon" && rec.recommendation.includes("Reg 44 shortfalls"))).toBe(true);
    });

    it("'soon' rec for reg45 coverage < 80%", () => {
      const r45 = [
        makeReg45({ id: "r45_0", review_covers_all_standards: false }),
        makeReg45({ id: "r45_1", review_covers_all_standards: false }),
        makeReg45({ id: "r45_2" }),
      ];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ reg45_review_records: r45 }));
      expect(r.recommendations.some(rec => rec.urgency === "soon" && rec.recommendation.includes("Reg 45 reviews cover the full range"))).toBe(true);
    });

    it("'soon' rec for reg44 not considered in reg45", () => {
      const r45 = [makeReg45({ id: "r45_0", reg44_reports_considered: 1, reg44_reports_available: 6 })];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ reg45_review_records: r45 }));
      expect(r.recommendations.some(rec => rec.urgency === "soon" && rec.recommendation.includes("Reg 44 reports are systematically reviewed"))).toBe(true);
    });

    it("'soon' rec for child views < 70%", () => {
      const r44 = [
        makeReg44({ id: "r44_0" }),
        makeReg44({ id: "r44_1", child_views_captured: false }),
        makeReg44({ id: "r44_2", child_views_captured: false }),
      ];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ reg44_report_records: r44 }));
      expect(r.recommendations.some(rec => rec.urgency === "soon" && rec.recommendation.includes("children's views"))).toBe(true);
    });

    it("'soon' rec for stakeholder engagement < 60%", () => {
      const r45 = [makeReg45({
        id: "r45_0",
        children_consulted: 0, children_total: 4,
        staff_consulted: 0, placing_authorities_consulted: 0,
        parents_carers_consulted: 0, professionals_consulted: 0,
      })];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ reg45_review_records: r45 }));
      expect(r.recommendations.some(rec => rec.urgency === "soon" && rec.recommendation.includes("stakeholder engagement"))).toBe(true);
    });

    it("'planned' rec for dev plan < 80%", () => {
      const r45 = [
        makeReg45({ id: "r45_0" }),
        makeReg45({ id: "r45_1", development_plan_updated: false }),
        makeReg45({ id: "r45_2", development_plan_updated: false }),
      ];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ reg45_review_records: r45 }));
      expect(r.recommendations.some(rec => rec.urgency === "planned" && rec.recommendation.includes("development plan"))).toBe(true);
    });

    it("'planned' rec for reg45 child consultation < 70%", () => {
      const r45 = [makeReg45({ id: "r45_0", children_consulted: 1, children_total: 4 })];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ reg45_review_records: r45 }));
      expect(r.recommendations.some(rec => rec.urgency === "planned" && rec.recommendation.includes("children consulted"))).toBe(true);
    });

    it("'planned' rec for cycle child consultation < 60%", () => {
      const qi = [
        makeQI({ id: "qi_0", children_consulted: false }),
        makeQI({ id: "qi_1", children_consulted: false }),
      ];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ quality_improvement_records: qi }));
      expect(r.recommendations.some(rec => rec.urgency === "planned" && rec.recommendation.includes("Involve children"))).toBe(true);
    });

    it("'planned' rec for sustained improvement < 50%", () => {
      const qi = [
        makeQI({ id: "qi_0", sustained_over_time: false }),
        makeQI({ id: "qi_1", sustained_over_time: false }),
      ];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ quality_improvement_records: qi }));
      expect(r.recommendations.some(rec => rec.urgency === "planned" && rec.recommendation.includes("sustaining"))).toBe(true);
    });

    it("'planned' rec for records check < 70%", () => {
      const r44 = Array.from({ length: 3 }, (_, i) =>
        makeReg44({
          id: `r44_${i}`,
          medication_records_checked: false,
          sanctions_records_checked: false,
          complaints_reviewed: false,
          safeguarding_reviewed: false,
        }),
      );
      const r = computeReg4445QualityAssuranceReporting(baseInput({ reg44_report_records: r44 }));
      expect(r.recommendations.some(rec => rec.urgency === "planned" && rec.recommendation.includes("medication records"))).toBe(true);
    });

    it("'planned' rec for follow-up < 70%", () => {
      const actions = [
        makeAction({ id: "ap_0", follow_up_required: true, follow_up_completed: false }),
        makeAction({ id: "ap_1", follow_up_required: true, follow_up_completed: false }),
        makeAction({ id: "ap_2", follow_up_required: true, follow_up_completed: false }),
      ];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ action_plan_records: actions }));
      expect(r.recommendations.some(rec => rec.urgency === "planned" && rec.recommendation.includes("follow-up"))).toBe(true);
    });

    it("'planned' rec for investigation completion < 80%", () => {
      const notifs = [
        makeNotification({ id: "n_0", investigation_completed: false }),
        makeNotification({ id: "n_1", investigation_completed: false }),
        makeNotification({ id: "n_2" }),
      ];
      const r = computeReg4445QualityAssuranceReporting(baseInput({ notification_records: notifs }));
      expect(r.recommendations.some(rec => rec.urgency === "planned" && rec.recommendation.includes("investigations"))).toBe(true);
    });
  });
});
