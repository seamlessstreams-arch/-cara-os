// ══════════════════════════════════════════════════════════════════════════════
// CARA — QUALITY OF CARE REVIEW SERVICE TESTS
// Pure-function tests for quality of care review metrics computation,
// alert identification, Cara insight generation, and edge cases.
// Regulation 45 requires the registered person to review the quality of care
// provided at least every 6 months.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";

import {
  REVIEW_DOMAINS,
  DOMAIN_RATINGS,
  REVIEW_FREQUENCIES,
  ACTION_PRIORITIES,
  _testing,
} from "../quality-of-care-review-service";

import type {
  QualityOfCareReviewRow,
} from "../quality-of-care-review-service";

const {
  computeQualityOfCareMetrics,
  computeQualityOfCareAlerts,
  generateQualityOfCareCaraInsights,
} = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

function makeRow(
  overrides?: Partial<QualityOfCareReviewRow>,
): QualityOfCareReviewRow {
  return {
    id: "id" in (overrides ?? {}) ? overrides!.id! : crypto.randomUUID(),
    home_id: "home_id" in (overrides ?? {}) ? overrides!.home_id! : "home-1",
    review_date: "review_date" in (overrides ?? {}) ? overrides!.review_date! : "2026-03-15",
    review_period_start: "review_period_start" in (overrides ?? {}) ? overrides!.review_period_start! : "2025-10-01",
    review_period_end: "review_period_end" in (overrides ?? {}) ? overrides!.review_period_end! : "2026-03-31",
    review_domain: "review_domain" in (overrides ?? {}) ? overrides!.review_domain! : "overall_experiences",
    domain_rating: "domain_rating" in (overrides ?? {}) ? overrides!.domain_rating! : "good",
    review_frequency: "review_frequency" in (overrides ?? {}) ? overrides!.review_frequency! : "six_monthly",
    action_priority: "action_priority" in (overrides ?? {}) ? overrides!.action_priority! : "medium",
    reviewer_name: "reviewer_name" in (overrides ?? {}) ? overrides!.reviewer_name! : "Jane Smith",
    children_consulted: "children_consulted" in (overrides ?? {}) ? overrides!.children_consulted! : true,
    staff_consulted: "staff_consulted" in (overrides ?? {}) ? overrides!.staff_consulted! : true,
    external_feedback_included: "external_feedback_included" in (overrides ?? {}) ? overrides!.external_feedback_included! : true,
    reg44_reports_reviewed: "reg44_reports_reviewed" in (overrides ?? {}) ? overrides!.reg44_reports_reviewed! : true,
    improvement_actions_identified: "improvement_actions_identified" in (overrides ?? {}) ? overrides!.improvement_actions_identified! : false,
    actions_assigned: "actions_assigned" in (overrides ?? {}) ? overrides!.actions_assigned! : false,
    shared_with_ofsted: "shared_with_ofsted" in (overrides ?? {}) ? overrides!.shared_with_ofsted! : true,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: "created_at" in (overrides ?? {}) ? overrides!.created_at! : "2026-03-15T08:00:00Z",
    updated_at: "updated_at" in (overrides ?? {}) ? overrides!.updated_at! : "2026-03-15T08:00:00Z",
  };
}

// ── computeQualityOfCareMetrics ──────────────────────────────────────────

describe("computeQualityOfCareMetrics", () => {
  describe("empty array", () => {
    it("returns zero total_reviews", () => {
      const m = computeQualityOfCareMetrics([]);
      expect(m.total_reviews).toBe(0);
    });

    it("returns zero inadequate_count", () => {
      const m = computeQualityOfCareMetrics([]);
      expect(m.inadequate_count).toBe(0);
    });

    it("returns zero requires_improvement_count", () => {
      const m = computeQualityOfCareMetrics([]);
      expect(m.requires_improvement_count).toBe(0);
    });

    it("returns zero immediate_priority_count", () => {
      const m = computeQualityOfCareMetrics([]);
      expect(m.immediate_priority_count).toBe(0);
    });

    it("returns zero actions_not_assigned_count", () => {
      const m = computeQualityOfCareMetrics([]);
      expect(m.actions_not_assigned_count).toBe(0);
    });

    it("returns zero children_consulted_rate", () => {
      const m = computeQualityOfCareMetrics([]);
      expect(m.children_consulted_rate).toBe(0);
    });

    it("returns zero staff_consulted_rate", () => {
      const m = computeQualityOfCareMetrics([]);
      expect(m.staff_consulted_rate).toBe(0);
    });

    it("returns zero external_feedback_rate", () => {
      const m = computeQualityOfCareMetrics([]);
      expect(m.external_feedback_rate).toBe(0);
    });

    it("returns zero reg44_reviewed_rate", () => {
      const m = computeQualityOfCareMetrics([]);
      expect(m.reg44_reviewed_rate).toBe(0);
    });

    it("returns zero shared_with_ofsted_rate", () => {
      const m = computeQualityOfCareMetrics([]);
      expect(m.shared_with_ofsted_rate).toBe(0);
    });

    it("returns empty domain_breakdown", () => {
      const m = computeQualityOfCareMetrics([]);
      expect(m.domain_breakdown).toEqual({});
    });

    it("returns empty rating_breakdown", () => {
      const m = computeQualityOfCareMetrics([]);
      expect(m.rating_breakdown).toEqual({});
    });

    it("returns zero unique_reviewers", () => {
      const m = computeQualityOfCareMetrics([]);
      expect(m.unique_reviewers).toBe(0);
    });
  });

  describe("single row", () => {
    const row = makeRow({
      domain_rating: "good",
      action_priority: "medium",
      children_consulted: true,
      staff_consulted: true,
      external_feedback_included: true,
      reg44_reports_reviewed: true,
      shared_with_ofsted: true,
      review_domain: "overall_experiences",
      reviewer_name: "Jane Smith",
      improvement_actions_identified: false,
      actions_assigned: false,
    });

    it("returns total_reviews = 1", () => {
      const m = computeQualityOfCareMetrics([row]);
      expect(m.total_reviews).toBe(1);
    });

    it("returns children_consulted_rate = 100", () => {
      const m = computeQualityOfCareMetrics([row]);
      expect(m.children_consulted_rate).toBe(100);
    });

    it("returns staff_consulted_rate = 100", () => {
      const m = computeQualityOfCareMetrics([row]);
      expect(m.staff_consulted_rate).toBe(100);
    });

    it("returns external_feedback_rate = 100", () => {
      const m = computeQualityOfCareMetrics([row]);
      expect(m.external_feedback_rate).toBe(100);
    });

    it("returns reg44_reviewed_rate = 100", () => {
      const m = computeQualityOfCareMetrics([row]);
      expect(m.reg44_reviewed_rate).toBe(100);
    });

    it("returns shared_with_ofsted_rate = 100", () => {
      const m = computeQualityOfCareMetrics([row]);
      expect(m.shared_with_ofsted_rate).toBe(100);
    });

    it("returns inadequate_count = 0", () => {
      const m = computeQualityOfCareMetrics([row]);
      expect(m.inadequate_count).toBe(0);
    });

    it("returns domain_breakdown with single entry", () => {
      const m = computeQualityOfCareMetrics([row]);
      expect(m.domain_breakdown).toEqual({ overall_experiences: 1 });
    });

    it("returns rating_breakdown with single entry", () => {
      const m = computeQualityOfCareMetrics([row]);
      expect(m.rating_breakdown).toEqual({ good: 1 });
    });

    it("returns unique_reviewers = 1", () => {
      const m = computeQualityOfCareMetrics([row]);
      expect(m.unique_reviewers).toBe(1);
    });
  });

  describe("multiple rows", () => {
    const rows = [
      makeRow({ domain_rating: "good", action_priority: "medium", review_domain: "overall_experiences", reviewer_name: "Jane Smith", children_consulted: true, staff_consulted: true, external_feedback_included: true, reg44_reports_reviewed: true, shared_with_ofsted: true, improvement_actions_identified: false, actions_assigned: false }),
      makeRow({ domain_rating: "inadequate", action_priority: "immediate", review_domain: "education_achievement", reviewer_name: "John Doe", children_consulted: false, staff_consulted: false, external_feedback_included: false, reg44_reports_reviewed: false, shared_with_ofsted: false, improvement_actions_identified: true, actions_assigned: false }),
      makeRow({ domain_rating: "requires_improvement", action_priority: "high", review_domain: "health_wellbeing", reviewer_name: "Jane Smith", children_consulted: true, staff_consulted: true, external_feedback_included: true, reg44_reports_reviewed: true, shared_with_ofsted: true, improvement_actions_identified: true, actions_assigned: true }),
    ];

    it("returns total_reviews = 3", () => {
      const m = computeQualityOfCareMetrics(rows);
      expect(m.total_reviews).toBe(3);
    });

    it("returns inadequate_count = 1", () => {
      const m = computeQualityOfCareMetrics(rows);
      expect(m.inadequate_count).toBe(1);
    });

    it("returns requires_improvement_count = 1", () => {
      const m = computeQualityOfCareMetrics(rows);
      expect(m.requires_improvement_count).toBe(1);
    });

    it("returns immediate_priority_count = 1", () => {
      const m = computeQualityOfCareMetrics(rows);
      expect(m.immediate_priority_count).toBe(1);
    });

    it("returns actions_not_assigned_count = 1", () => {
      const m = computeQualityOfCareMetrics(rows);
      expect(m.actions_not_assigned_count).toBe(1);
    });

    it("calculates children_consulted_rate correctly (2/3 = 66.7%)", () => {
      const m = computeQualityOfCareMetrics(rows);
      expect(m.children_consulted_rate).toBe(66.7);
    });

    it("calculates staff_consulted_rate correctly (2/3 = 66.7%)", () => {
      const m = computeQualityOfCareMetrics(rows);
      expect(m.staff_consulted_rate).toBe(66.7);
    });

    it("calculates external_feedback_rate correctly (2/3 = 66.7%)", () => {
      const m = computeQualityOfCareMetrics(rows);
      expect(m.external_feedback_rate).toBe(66.7);
    });

    it("calculates reg44_reviewed_rate correctly (2/3 = 66.7%)", () => {
      const m = computeQualityOfCareMetrics(rows);
      expect(m.reg44_reviewed_rate).toBe(66.7);
    });

    it("calculates shared_with_ofsted_rate correctly (2/3 = 66.7%)", () => {
      const m = computeQualityOfCareMetrics(rows);
      expect(m.shared_with_ofsted_rate).toBe(66.7);
    });

    it("groups domain_breakdown correctly", () => {
      const m = computeQualityOfCareMetrics(rows);
      expect(m.domain_breakdown).toEqual({
        overall_experiences: 1,
        education_achievement: 1,
        health_wellbeing: 1,
      });
    });

    it("groups rating_breakdown correctly", () => {
      const m = computeQualityOfCareMetrics(rows);
      expect(m.rating_breakdown).toEqual({
        good: 1,
        inadequate: 1,
        requires_improvement: 1,
      });
    });

    it("returns unique_reviewers = 2", () => {
      const m = computeQualityOfCareMetrics(rows);
      expect(m.unique_reviewers).toBe(2);
    });
  });

  describe("domain_breakdown", () => {
    it("counts duplicate domains", () => {
      const rows = [
        makeRow({ review_domain: "overall_experiences" }),
        makeRow({ review_domain: "overall_experiences" }),
        makeRow({ review_domain: "health_wellbeing" }),
      ];
      const m = computeQualityOfCareMetrics(rows);
      expect(m.domain_breakdown).toEqual({ overall_experiences: 2, health_wellbeing: 1 });
    });

    it("handles all 10 review domains", () => {
      const rows = REVIEW_DOMAINS.map((d) => makeRow({ review_domain: d }));
      const m = computeQualityOfCareMetrics(rows);
      for (const d of REVIEW_DOMAINS) {
        expect(m.domain_breakdown[d]).toBe(1);
      }
    });
  });

  describe("rating_breakdown", () => {
    it("counts duplicate ratings", () => {
      const rows = [
        makeRow({ domain_rating: "good" }),
        makeRow({ domain_rating: "good" }),
        makeRow({ domain_rating: "inadequate" }),
      ];
      const m = computeQualityOfCareMetrics(rows);
      expect(m.rating_breakdown).toEqual({ good: 2, inadequate: 1 });
    });

    it("handles all 5 domain ratings", () => {
      const rows = DOMAIN_RATINGS.map((r) => makeRow({ domain_rating: r }));
      const m = computeQualityOfCareMetrics(rows);
      for (const r of DOMAIN_RATINGS) {
        expect(m.rating_breakdown[r]).toBe(1);
      }
    });
  });

  describe("unique_reviewers", () => {
    it("counts distinct reviewer names", () => {
      const rows = [
        makeRow({ reviewer_name: "Jane Smith" }),
        makeRow({ reviewer_name: "Jane Smith" }),
        makeRow({ reviewer_name: "John Doe" }),
      ];
      const m = computeQualityOfCareMetrics(rows);
      expect(m.unique_reviewers).toBe(2);
    });

    it("returns 1 when all rows have the same reviewer", () => {
      const rows = [
        makeRow({ reviewer_name: "Jane Smith" }),
        makeRow({ reviewer_name: "Jane Smith" }),
        makeRow({ reviewer_name: "Jane Smith" }),
      ];
      const m = computeQualityOfCareMetrics(rows);
      expect(m.unique_reviewers).toBe(1);
    });

    it("counts all distinct reviewers", () => {
      const rows = [
        makeRow({ reviewer_name: "Alice" }),
        makeRow({ reviewer_name: "Bob" }),
        makeRow({ reviewer_name: "Charlie" }),
        makeRow({ reviewer_name: "Diana" }),
      ];
      const m = computeQualityOfCareMetrics(rows);
      expect(m.unique_reviewers).toBe(4);
    });
  });

  describe("actions_not_assigned_count", () => {
    it("counts rows with improvement_actions_identified but not assigned", () => {
      const rows = [
        makeRow({ improvement_actions_identified: true, actions_assigned: false }),
        makeRow({ improvement_actions_identified: true, actions_assigned: true }),
        makeRow({ improvement_actions_identified: false, actions_assigned: false }),
      ];
      const m = computeQualityOfCareMetrics(rows);
      expect(m.actions_not_assigned_count).toBe(1);
    });

    it("returns 0 when all actions are assigned", () => {
      const rows = [
        makeRow({ improvement_actions_identified: true, actions_assigned: true }),
        makeRow({ improvement_actions_identified: true, actions_assigned: true }),
      ];
      const m = computeQualityOfCareMetrics(rows);
      expect(m.actions_not_assigned_count).toBe(0);
    });

    it("returns 0 when no improvement actions are identified", () => {
      const rows = [
        makeRow({ improvement_actions_identified: false, actions_assigned: false }),
        makeRow({ improvement_actions_identified: false, actions_assigned: false }),
      ];
      const m = computeQualityOfCareMetrics(rows);
      expect(m.actions_not_assigned_count).toBe(0);
    });
  });

  describe("percentage calculations with known values", () => {
    it("calculates children_consulted_rate (1/3 = 33.3%)", () => {
      const rows = [
        makeRow({ children_consulted: true }),
        makeRow({ children_consulted: false }),
        makeRow({ children_consulted: false }),
      ];
      const m = computeQualityOfCareMetrics(rows);
      expect(m.children_consulted_rate).toBe(33.3);
    });

    it("calculates staff_consulted_rate (1/3 = 33.3%)", () => {
      const rows = [
        makeRow({ staff_consulted: true }),
        makeRow({ staff_consulted: false }),
        makeRow({ staff_consulted: false }),
      ];
      const m = computeQualityOfCareMetrics(rows);
      expect(m.staff_consulted_rate).toBe(33.3);
    });

    it("calculates shared_with_ofsted_rate (1/4 = 25%)", () => {
      const rows = [
        makeRow({ shared_with_ofsted: true }),
        makeRow({ shared_with_ofsted: false }),
        makeRow({ shared_with_ofsted: false }),
        makeRow({ shared_with_ofsted: false }),
      ];
      const m = computeQualityOfCareMetrics(rows);
      expect(m.shared_with_ofsted_rate).toBe(25);
    });

    it("returns 100 for all rates when single row has all flags true", () => {
      const rows = [
        makeRow({ children_consulted: true, staff_consulted: true, external_feedback_included: true, reg44_reports_reviewed: true, shared_with_ofsted: true }),
      ];
      const m = computeQualityOfCareMetrics(rows);
      expect(m.children_consulted_rate).toBe(100);
      expect(m.staff_consulted_rate).toBe(100);
      expect(m.external_feedback_rate).toBe(100);
      expect(m.reg44_reviewed_rate).toBe(100);
      expect(m.shared_with_ofsted_rate).toBe(100);
    });

    it("returns 0 for children_consulted_rate when none consulted", () => {
      const rows = [
        makeRow({ children_consulted: false }),
        makeRow({ children_consulted: false }),
      ];
      const m = computeQualityOfCareMetrics(rows);
      expect(m.children_consulted_rate).toBe(0);
    });
  });
});

// ── computeQualityOfCareAlerts ──────────────────────────────────────────

describe("computeQualityOfCareAlerts", () => {
  describe("no alerts", () => {
    it("returns empty array when no rows", () => {
      const alerts = computeQualityOfCareAlerts([]);
      expect(alerts).toHaveLength(0);
    });

    it("returns empty array when all rows are good and compliant", () => {
      const rows = [
        makeRow({ domain_rating: "good", action_priority: "medium", children_consulted: true, reg44_reports_reviewed: true, actions_assigned: true }),
      ];
      const alerts = computeQualityOfCareAlerts(rows);
      expect(alerts).toEqual([]);
    });
  });

  describe("inadequate_immediate alert", () => {
    it("fires for inadequate rating with immediate priority", () => {
      const rows = [makeRow({ domain_rating: "inadequate", action_priority: "immediate" })];
      const alerts = computeQualityOfCareAlerts(rows);
      const alert = alerts.find((a) => a.type === "inadequate_immediate");
      expect(alert).toBeDefined();
    });

    it("has severity critical", () => {
      const rows = [makeRow({ domain_rating: "inadequate", action_priority: "immediate" })];
      const alerts = computeQualityOfCareAlerts(rows);
      const alert = alerts.find((a) => a.type === "inadequate_immediate")!;
      expect(alert.severity).toBe("critical");
    });

    it("includes record_id", () => {
      const rows = [makeRow({ id: "rev-1", domain_rating: "inadequate", action_priority: "immediate" })];
      const alerts = computeQualityOfCareAlerts(rows);
      const alert = alerts.find((a) => a.type === "inadequate_immediate")!;
      expect(alert.record_id).toBe("rev-1");
    });

    it("includes domain name in message with underscores replaced", () => {
      const rows = [makeRow({ domain_rating: "inadequate", action_priority: "immediate", review_domain: "education_achievement" })];
      const alerts = computeQualityOfCareAlerts(rows);
      const alert = alerts.find((a) => a.type === "inadequate_immediate")!;
      expect(alert.message).toContain("education achievement");
    });

    it("does not fire for inadequate rating without immediate priority", () => {
      const rows = [makeRow({ domain_rating: "inadequate", action_priority: "high" })];
      const alerts = computeQualityOfCareAlerts(rows);
      const alert = alerts.find((a) => a.type === "inadequate_immediate");
      expect(alert).toBeUndefined();
    });

    it("does not fire for good rating with immediate priority", () => {
      const rows = [makeRow({ domain_rating: "good", action_priority: "immediate" })];
      const alerts = computeQualityOfCareAlerts(rows);
      const alert = alerts.find((a) => a.type === "inadequate_immediate");
      expect(alert).toBeUndefined();
    });

    it("fires per record for multiple inadequate+immediate reviews", () => {
      const rows = [
        makeRow({ domain_rating: "inadequate", action_priority: "immediate" }),
        makeRow({ domain_rating: "inadequate", action_priority: "immediate" }),
      ];
      const alerts = computeQualityOfCareAlerts(rows);
      const critical = alerts.filter((a) => a.type === "inadequate_immediate");
      expect(critical).toHaveLength(2);
    });
  });

  describe("improvement_actions_not_assigned alert", () => {
    it("fires when requires_improvement and actions not assigned", () => {
      const rows = [makeRow({ domain_rating: "requires_improvement", actions_assigned: false })];
      const alerts = computeQualityOfCareAlerts(rows);
      const alert = alerts.find((a) => a.type === "improvement_actions_not_assigned");
      expect(alert).toBeDefined();
    });

    it("has severity high", () => {
      const rows = [makeRow({ domain_rating: "requires_improvement", actions_assigned: false })];
      const alerts = computeQualityOfCareAlerts(rows);
      const alert = alerts.find((a) => a.type === "improvement_actions_not_assigned")!;
      expect(alert.severity).toBe("high");
    });

    it("includes record_id", () => {
      const rows = [makeRow({ id: "rev-2", domain_rating: "requires_improvement", actions_assigned: false })];
      const alerts = computeQualityOfCareAlerts(rows);
      const alert = alerts.find((a) => a.type === "improvement_actions_not_assigned")!;
      expect(alert.record_id).toBe("rev-2");
    });

    it("does not fire when requires_improvement and actions assigned", () => {
      const rows = [makeRow({ domain_rating: "requires_improvement", actions_assigned: true })];
      const alerts = computeQualityOfCareAlerts(rows);
      const alert = alerts.find((a) => a.type === "improvement_actions_not_assigned");
      expect(alert).toBeUndefined();
    });

    it("does not fire for good rating with actions not assigned", () => {
      const rows = [makeRow({ domain_rating: "good", actions_assigned: false })];
      const alerts = computeQualityOfCareAlerts(rows);
      const alert = alerts.find((a) => a.type === "improvement_actions_not_assigned");
      expect(alert).toBeUndefined();
    });

    it("fires per record for multiple requires_improvement reviews without actions", () => {
      const rows = [
        makeRow({ domain_rating: "requires_improvement", actions_assigned: false }),
        makeRow({ domain_rating: "requires_improvement", actions_assigned: false }),
      ];
      const alerts = computeQualityOfCareAlerts(rows);
      const high = alerts.filter((a) => a.type === "improvement_actions_not_assigned");
      expect(high).toHaveLength(2);
    });
  });

  describe("children_not_consulted alert", () => {
    it("fires when 2 or more reviews did not consult children", () => {
      const rows = [
        makeRow({ children_consulted: false }),
        makeRow({ children_consulted: false }),
      ];
      const alerts = computeQualityOfCareAlerts(rows);
      const alert = alerts.find((a) => a.type === "children_not_consulted");
      expect(alert).toBeDefined();
    });

    it("has severity high", () => {
      const rows = [
        makeRow({ children_consulted: false }),
        makeRow({ children_consulted: false }),
      ];
      const alerts = computeQualityOfCareAlerts(rows);
      const alert = alerts.find((a) => a.type === "children_not_consulted")!;
      expect(alert.severity).toBe("high");
    });

    it("includes count in message", () => {
      const rows = [
        makeRow({ children_consulted: false }),
        makeRow({ children_consulted: false }),
        makeRow({ children_consulted: false }),
      ];
      const alerts = computeQualityOfCareAlerts(rows);
      const alert = alerts.find((a) => a.type === "children_not_consulted")!;
      expect(alert.message).toContain("3");
    });

    it("does not fire when only 1 review did not consult children", () => {
      const rows = [makeRow({ children_consulted: false })];
      const alerts = computeQualityOfCareAlerts(rows);
      const alert = alerts.find((a) => a.type === "children_not_consulted");
      expect(alert).toBeUndefined();
    });

    it("does not fire when all reviews consulted children", () => {
      const rows = [makeRow({ children_consulted: true }), makeRow({ children_consulted: true })];
      const alerts = computeQualityOfCareAlerts(rows);
      const alert = alerts.find((a) => a.type === "children_not_consulted");
      expect(alert).toBeUndefined();
    });

    it("fires only once as aggregate alert", () => {
      const rows = [
        makeRow({ children_consulted: false }),
        makeRow({ children_consulted: false }),
        makeRow({ children_consulted: false }),
      ];
      const alerts = computeQualityOfCareAlerts(rows);
      const notConsulted = alerts.filter((a) => a.type === "children_not_consulted");
      expect(notConsulted).toHaveLength(1);
    });
  });

  describe("reg44_not_reviewed alert", () => {
    it("fires when at least 1 review did not review Reg 44 reports", () => {
      const rows = [makeRow({ reg44_reports_reviewed: false })];
      const alerts = computeQualityOfCareAlerts(rows);
      const alert = alerts.find((a) => a.type === "reg44_not_reviewed");
      expect(alert).toBeDefined();
    });

    it("has severity medium", () => {
      const rows = [makeRow({ reg44_reports_reviewed: false })];
      const alerts = computeQualityOfCareAlerts(rows);
      const alert = alerts.find((a) => a.type === "reg44_not_reviewed")!;
      expect(alert.severity).toBe("medium");
    });

    it("uses singular wording for 1 review", () => {
      const rows = [makeRow({ reg44_reports_reviewed: false })];
      const alerts = computeQualityOfCareAlerts(rows);
      const alert = alerts.find((a) => a.type === "reg44_not_reviewed")!;
      expect(alert.message).toContain("review has");
    });

    it("uses plural wording for multiple reviews", () => {
      const rows = [
        makeRow({ reg44_reports_reviewed: false }),
        makeRow({ reg44_reports_reviewed: false }),
      ];
      const alerts = computeQualityOfCareAlerts(rows);
      const alert = alerts.find((a) => a.type === "reg44_not_reviewed")!;
      expect(alert.message).toContain("reviews have");
    });

    it("includes count in message", () => {
      const rows = [
        makeRow({ reg44_reports_reviewed: false }),
        makeRow({ reg44_reports_reviewed: false }),
        makeRow({ reg44_reports_reviewed: false }),
      ];
      const alerts = computeQualityOfCareAlerts(rows);
      const alert = alerts.find((a) => a.type === "reg44_not_reviewed")!;
      expect(alert.message).toContain("3");
    });

    it("does not fire when all reviews reviewed Reg 44 reports", () => {
      const rows = [makeRow({ reg44_reports_reviewed: true }), makeRow({ reg44_reports_reviewed: true })];
      const alerts = computeQualityOfCareAlerts(rows);
      const alert = alerts.find((a) => a.type === "reg44_not_reviewed");
      expect(alert).toBeUndefined();
    });

    it("fires only once as aggregate alert", () => {
      const rows = [
        makeRow({ reg44_reports_reviewed: false }),
        makeRow({ reg44_reports_reviewed: false }),
      ];
      const alerts = computeQualityOfCareAlerts(rows);
      const reg44 = alerts.filter((a) => a.type === "reg44_not_reviewed");
      expect(reg44).toHaveLength(1);
    });
  });

  describe("combined alerts", () => {
    it("can fire all four alert types simultaneously", () => {
      const rows = [
        makeRow({ domain_rating: "inadequate", action_priority: "immediate", children_consulted: false, reg44_reports_reviewed: false }),
        makeRow({ domain_rating: "requires_improvement", actions_assigned: false, children_consulted: false, reg44_reports_reviewed: false }),
      ];
      const alerts = computeQualityOfCareAlerts(rows);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("inadequate_immediate");
      expect(types).toContain("improvement_actions_not_assigned");
      expect(types).toContain("children_not_consulted");
      expect(types).toContain("reg44_not_reviewed");
    });
  });

  describe("alert structure", () => {
    it("every alert has type, severity, and message fields", () => {
      const rows = [
        makeRow({ domain_rating: "inadequate", action_priority: "immediate", reg44_reports_reviewed: false }),
      ];
      const alerts = computeQualityOfCareAlerts(rows);
      for (const alert of alerts) {
        expect(alert).toHaveProperty("type");
        expect(alert).toHaveProperty("severity");
        expect(alert).toHaveProperty("message");
      }
    });

    it("severity is always one of critical, high, or medium", () => {
      const rows = [
        makeRow({ domain_rating: "inadequate", action_priority: "immediate", children_consulted: false, reg44_reports_reviewed: false }),
        makeRow({ domain_rating: "requires_improvement", actions_assigned: false, children_consulted: false, reg44_reports_reviewed: false }),
      ];
      const alerts = computeQualityOfCareAlerts(rows);
      for (const alert of alerts) {
        expect(["critical", "high", "medium"]).toContain(alert.severity);
      }
    });

    it("message is always a non-empty string", () => {
      const rows = [makeRow({ domain_rating: "inadequate", action_priority: "immediate" })];
      const alerts = computeQualityOfCareAlerts(rows);
      for (const alert of alerts) {
        expect(typeof alert.message).toBe("string");
        expect(alert.message.length).toBeGreaterThan(0);
      }
    });
  });
});

// ── generateQualityOfCareCaraInsights ───────────────────────────────────

describe("generateQualityOfCareCaraInsights", () => {
  it("returns exactly 3 insights", () => {
    const metrics = computeQualityOfCareMetrics([]);
    const alerts = computeQualityOfCareAlerts([]);
    const insights = generateQualityOfCareCaraInsights(metrics, alerts);
    expect(insights).toHaveLength(3);
  });

  it("first insight starts with [cyan]", () => {
    const metrics = computeQualityOfCareMetrics([makeRow()]);
    const alerts = computeQualityOfCareAlerts([makeRow()]);
    const insights = generateQualityOfCareCaraInsights(metrics, alerts);
    expect(insights[0]).toMatch(/^\[cyan\]/);
  });

  it("first insight includes total_reviews count", () => {
    const rows = [makeRow(), makeRow(), makeRow()];
    const metrics = computeQualityOfCareMetrics(rows);
    const alerts = computeQualityOfCareAlerts(rows);
    const insights = generateQualityOfCareCaraInsights(metrics, alerts);
    expect(insights[0]).toContain("3");
  });

  it("first insight includes children_consulted_rate", () => {
    const rows = [makeRow({ children_consulted: true }), makeRow({ children_consulted: false })];
    const metrics = computeQualityOfCareMetrics(rows);
    const alerts = computeQualityOfCareAlerts(rows);
    const insights = generateQualityOfCareCaraInsights(metrics, alerts);
    expect(insights[0]).toContain("50%");
  });

  it("second insight starts with [amber]", () => {
    const metrics = computeQualityOfCareMetrics([makeRow()]);
    const alerts = computeQualityOfCareAlerts([makeRow()]);
    const insights = generateQualityOfCareCaraInsights(metrics, alerts);
    expect(insights[1]).toMatch(/^\[amber\]/);
  });

  it("second insight mentions critical and high alerts when present", () => {
    const rows = [
      makeRow({ domain_rating: "inadequate", action_priority: "immediate", children_consulted: false, reg44_reports_reviewed: false }),
      makeRow({ domain_rating: "requires_improvement", actions_assigned: false, children_consulted: false }),
    ];
    const metrics = computeQualityOfCareMetrics(rows);
    const alerts = computeQualityOfCareAlerts(rows);
    const insights = generateQualityOfCareCaraInsights(metrics, alerts);
    expect(insights[1]).toContain("critical");
    expect(insights[1]).toContain("high");
  });

  it("second insight mentions no alerts when none present", () => {
    const rows = [makeRow({ domain_rating: "good", action_priority: "medium", children_consulted: true, reg44_reports_reviewed: true, actions_assigned: true })];
    const metrics = computeQualityOfCareMetrics(rows);
    const alerts = computeQualityOfCareAlerts(rows);
    const insights = generateQualityOfCareCaraInsights(metrics, alerts);
    expect(insights[1]).toContain("No critical or high-priority alerts");
  });

  it("third insight starts with [reflect]", () => {
    const metrics = computeQualityOfCareMetrics([makeRow()]);
    const alerts = computeQualityOfCareAlerts([makeRow()]);
    const insights = generateQualityOfCareCaraInsights(metrics, alerts);
    expect(insights[2]).toMatch(/^\[reflect\]/);
  });

  it("third insight mentions inadequate when some domains are inadequate", () => {
    const rows = [makeRow({ domain_rating: "inadequate" })];
    const metrics = computeQualityOfCareMetrics(rows);
    const alerts = computeQualityOfCareAlerts(rows);
    const insights = generateQualityOfCareCaraInsights(metrics, alerts);
    expect(insights[2]).toContain("inadequate");
  });

  it("third insight asks about children's participation when no inadequate but not all consulted", () => {
    const rows = [
      makeRow({ domain_rating: "good", children_consulted: false }),
      makeRow({ domain_rating: "good", children_consulted: true }),
    ];
    const metrics = computeQualityOfCareMetrics(rows);
    const alerts = computeQualityOfCareAlerts(rows);
    const insights = generateQualityOfCareCaraInsights(metrics, alerts);
    expect(insights[2]).toContain("Children were consulted");
  });

  it("third insight celebrates strong compliance when all consulted and no inadequate", () => {
    const rows = [
      makeRow({ domain_rating: "good", children_consulted: true }),
      makeRow({ domain_rating: "good", children_consulted: true }),
    ];
    const metrics = computeQualityOfCareMetrics(rows);
    const alerts = computeQualityOfCareAlerts(rows);
    const insights = generateQualityOfCareCaraInsights(metrics, alerts);
    expect(insights[2]).toContain("All reviews have consulted children");
  });

  it("uses singular reviewer wording when unique_reviewers is 1", () => {
    const rows = [makeRow({ reviewer_name: "Jane Smith" })];
    const metrics = computeQualityOfCareMetrics(rows);
    const alerts = computeQualityOfCareAlerts(rows);
    const insights = generateQualityOfCareCaraInsights(metrics, alerts);
    expect(insights[0]).toContain("1 reviewer");
  });

  it("uses plural reviewers wording when unique_reviewers > 1", () => {
    const rows = [
      makeRow({ reviewer_name: "Jane Smith" }),
      makeRow({ reviewer_name: "John Doe" }),
    ];
    const metrics = computeQualityOfCareMetrics(rows);
    const alerts = computeQualityOfCareAlerts(rows);
    const insights = generateQualityOfCareCaraInsights(metrics, alerts);
    expect(insights[0]).toContain("2 reviewers");
  });

  it("all insights are non-empty strings", () => {
    const metrics = computeQualityOfCareMetrics([makeRow()]);
    const alerts = computeQualityOfCareAlerts([makeRow()]);
    const insights = generateQualityOfCareCaraInsights(metrics, alerts);
    for (const insight of insights) {
      expect(typeof insight).toBe("string");
      expect(insight.length).toBeGreaterThan(0);
    }
  });

  it("uses singular domain wording when 1 inadequate", () => {
    const rows = [makeRow({ domain_rating: "inadequate" })];
    const metrics = computeQualityOfCareMetrics(rows);
    const alerts = computeQualityOfCareAlerts(rows);
    const insights = generateQualityOfCareCaraInsights(metrics, alerts);
    expect(insights[2]).toContain("domain has");
  });

  it("uses plural domains wording when multiple inadequate", () => {
    const rows = [
      makeRow({ domain_rating: "inadequate" }),
      makeRow({ domain_rating: "inadequate" }),
    ];
    const metrics = computeQualityOfCareMetrics(rows);
    const alerts = computeQualityOfCareAlerts(rows);
    const insights = generateQualityOfCareCaraInsights(metrics, alerts);
    expect(insights[2]).toContain("domains have");
  });
});

// ── Enum constants ───────────────────────────────────────────────────────

describe("Enum constants", () => {
  it("REVIEW_DOMAINS has exactly 10 items", () => {
    expect(REVIEW_DOMAINS).toHaveLength(10);
  });

  it("DOMAIN_RATINGS has exactly 5 items", () => {
    expect(DOMAIN_RATINGS).toHaveLength(5);
  });

  it("REVIEW_FREQUENCIES has exactly 5 items", () => {
    expect(REVIEW_FREQUENCIES).toHaveLength(5);
  });

  it("ACTION_PRIORITIES has exactly 5 items", () => {
    expect(ACTION_PRIORITIES).toHaveLength(5);
  });

  it("REVIEW_DOMAINS values are unique", () => {
    expect(new Set(REVIEW_DOMAINS).size).toBe(REVIEW_DOMAINS.length);
  });

  it("DOMAIN_RATINGS values are unique", () => {
    expect(new Set(DOMAIN_RATINGS).size).toBe(DOMAIN_RATINGS.length);
  });

  it("REVIEW_FREQUENCIES values are unique", () => {
    expect(new Set(REVIEW_FREQUENCIES).size).toBe(REVIEW_FREQUENCIES.length);
  });

  it("ACTION_PRIORITIES values are unique", () => {
    expect(new Set(ACTION_PRIORITIES).size).toBe(ACTION_PRIORITIES.length);
  });
});

// ── Factory helper validation ────────────────────────────────────────────

describe("makeRow factory helper", () => {
  it("creates a row with sensible defaults", () => {
    const r = makeRow();
    expect(r.home_id).toBe("home-1");
    expect(r.review_date).toBe("2026-03-15");
    expect(r.review_period_start).toBe("2025-10-01");
    expect(r.review_period_end).toBe("2026-03-31");
    expect(r.review_domain).toBe("overall_experiences");
    expect(r.domain_rating).toBe("good");
    expect(r.review_frequency).toBe("six_monthly");
    expect(r.action_priority).toBe("medium");
    expect(r.reviewer_name).toBe("Jane Smith");
    expect(r.children_consulted).toBe(true);
    expect(r.staff_consulted).toBe(true);
    expect(r.external_feedback_included).toBe(true);
    expect(r.reg44_reports_reviewed).toBe(true);
    expect(r.improvement_actions_identified).toBe(false);
    expect(r.actions_assigned).toBe(false);
    expect(r.shared_with_ofsted).toBe(true);
    expect(r.notes).toBeNull();
  });

  it("allows overriding individual fields", () => {
    const r = makeRow({ domain_rating: "inadequate", review_domain: "health_wellbeing" });
    expect(r.domain_rating).toBe("inadequate");
    expect(r.review_domain).toBe("health_wellbeing");
    // defaults still apply
    expect(r.reviewer_name).toBe("Jane Smith");
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
    const r = makeRow({ notes: null });
    expect(r.notes).toBeNull();
  });

  it("allows setting nullable fields to values", () => {
    const r = makeRow({ notes: "Important review notes" });
    expect(r.notes).toBe("Important review notes");
  });
});
