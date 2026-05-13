// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — WHISTLEBLOWING SERVICE TESTS
// Pure-function unit tests for whistleblowing metrics computation,
// alert identification, constant validation, and CRUD fallback behaviour
// (Supabase disabled). CHR 2015 Reg 41 (whistleblowing),
// Public Interest Disclosure Act 1998.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  _testing,
  DISCLOSURE_CATEGORIES,
  DISCLOSURE_RISK_LEVELS,
  DISCLOSURE_STATUS,
  DISCLOSURE_OUTCOMES,
  REFERRAL_BODIES,
  listReports,
  createReport,
  updateReport,
  listPolicyReviews,
  createPolicyReview,
  updatePolicyReview,
} from "../whistleblowing-service";

import type {
  WhistleblowingReport,
  WhistleblowingPolicyReview,
} from "../whistleblowing-service";

const {
  computeWhistleblowingMetrics,
  identifyWhistleblowingAlerts,
} = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

/** Date string N days ago from now. */
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

/** Date string N days in the future from now. */
function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

/** ISO datetime string N days ago. */
function daysAgoISO(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

/** Build a minimal WhistleblowingReport with sensible defaults. */
function makeReport(
  overrides: Partial<WhistleblowingReport> = {},
): WhistleblowingReport {
  return {
    id: "rpt-1",
    home_id: "home-1",
    reporter_id: "staff-1",
    reporter_name: "Jane Doe",
    reporter_role: "care_worker",
    is_anonymous: false,
    disclosure_date: daysAgo(5),
    received_by: "manager-1",
    category: "safeguarding_concern",
    description: "Concern about inadequate supervision",
    persons_involved: [],
    evidence_provided: null,
    location: null,
    risk_level: "medium",
    status: "received",
    acknowledged_date: null,
    acknowledged_by: null,
    investigating_officer: null,
    investigation_start_date: null,
    investigation_end_date: null,
    outcome: null,
    outcome_details: null,
    actions_taken: [],
    referred_to: null,
    referral_date: null,
    referral_reference: null,
    whistleblower_protected: true,
    detriment_reported: false,
    detriment_details: null,
    follow_up_date: null,
    follow_up_completed: false,
    created_at: daysAgoISO(5),
    updated_at: daysAgoISO(5),
    ...overrides,
  };
}

/** Build a minimal WhistleblowingPolicyReview with sensible defaults. */
function makePolicyReview(
  overrides: Partial<WhistleblowingPolicyReview> = {},
): WhistleblowingPolicyReview {
  return {
    id: "pr-1",
    home_id: "home-1",
    review_date: daysAgo(30),
    reviewed_by: "manager-1",
    policy_accessible: true,
    policy_displayed: true,
    staff_trained_count: 10,
    total_staff_count: 10,
    external_contacts_displayed: true,
    children_informed: true,
    review_notes: null,
    next_review_date: null,
    created_at: daysAgoISO(30),
    updated_at: daysAgoISO(30),
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

describe("DISCLOSURE_CATEGORIES", () => {
  it("has exactly 8 categories", () => {
    expect(DISCLOSURE_CATEGORIES).toHaveLength(8);
  });

  it("contains unique category values", () => {
    const categories = DISCLOSURE_CATEGORIES.map((c) => c.category);
    expect(new Set(categories).size).toBe(categories.length);
  });

  it("contains unique label values", () => {
    const labels = DISCLOSURE_CATEGORIES.map((c) => c.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes safeguarding_concern", () => {
    expect(DISCLOSURE_CATEGORIES.find((c) => c.category === "safeguarding_concern")).toBeDefined();
  });

  it("includes staff_misconduct", () => {
    expect(DISCLOSURE_CATEGORIES.find((c) => c.category === "staff_misconduct")).toBeDefined();
  });

  it("includes regulatory_breach", () => {
    expect(DISCLOSURE_CATEGORIES.find((c) => c.category === "regulatory_breach")).toBeDefined();
  });

  it("includes health_safety", () => {
    expect(DISCLOSURE_CATEGORIES.find((c) => c.category === "health_safety")).toBeDefined();
  });

  it("includes financial_irregularity", () => {
    expect(DISCLOSURE_CATEGORIES.find((c) => c.category === "financial_irregularity")).toBeDefined();
  });

  it("includes neglect_abuse", () => {
    expect(DISCLOSURE_CATEGORIES.find((c) => c.category === "neglect_abuse")).toBeDefined();
  });

  it("includes policy_violation", () => {
    expect(DISCLOSURE_CATEGORIES.find((c) => c.category === "policy_violation")).toBeDefined();
  });

  it("includes other", () => {
    expect(DISCLOSURE_CATEGORIES.find((c) => c.category === "other")).toBeDefined();
  });

  it("every entry has both category and label", () => {
    for (const entry of DISCLOSURE_CATEGORIES) {
      expect(entry.category).toBeTruthy();
      expect(entry.label).toBeTruthy();
    }
  });
});

describe("DISCLOSURE_RISK_LEVELS", () => {
  it("has exactly 4 risk levels", () => {
    expect(DISCLOSURE_RISK_LEVELS).toHaveLength(4);
  });

  it("contains unique level values", () => {
    const levels = DISCLOSURE_RISK_LEVELS.map((r) => r.level);
    expect(new Set(levels).size).toBe(levels.length);
  });

  it("contains unique label values", () => {
    const labels = DISCLOSURE_RISK_LEVELS.map((r) => r.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes critical", () => {
    expect(DISCLOSURE_RISK_LEVELS.find((r) => r.level === "critical")).toBeDefined();
  });

  it("includes high", () => {
    expect(DISCLOSURE_RISK_LEVELS.find((r) => r.level === "high")).toBeDefined();
  });

  it("includes medium", () => {
    expect(DISCLOSURE_RISK_LEVELS.find((r) => r.level === "medium")).toBeDefined();
  });

  it("includes low", () => {
    expect(DISCLOSURE_RISK_LEVELS.find((r) => r.level === "low")).toBeDefined();
  });

  it("every entry has both level and label", () => {
    for (const entry of DISCLOSURE_RISK_LEVELS) {
      expect(entry.level).toBeTruthy();
      expect(entry.label).toBeTruthy();
    }
  });
});

describe("DISCLOSURE_STATUS", () => {
  it("has exactly 7 statuses", () => {
    expect(DISCLOSURE_STATUS).toHaveLength(7);
  });

  it("contains unique status values", () => {
    const statuses = DISCLOSURE_STATUS.map((s) => s.status);
    expect(new Set(statuses).size).toBe(statuses.length);
  });

  it("contains unique label values", () => {
    const labels = DISCLOSURE_STATUS.map((s) => s.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes received", () => {
    expect(DISCLOSURE_STATUS.find((s) => s.status === "received")).toBeDefined();
  });

  it("includes acknowledged", () => {
    expect(DISCLOSURE_STATUS.find((s) => s.status === "acknowledged")).toBeDefined();
  });

  it("includes under_investigation", () => {
    expect(DISCLOSURE_STATUS.find((s) => s.status === "under_investigation")).toBeDefined();
  });

  it("includes referred_externally", () => {
    expect(DISCLOSURE_STATUS.find((s) => s.status === "referred_externally")).toBeDefined();
  });

  it("includes resolved", () => {
    expect(DISCLOSURE_STATUS.find((s) => s.status === "resolved")).toBeDefined();
  });

  it("includes closed", () => {
    expect(DISCLOSURE_STATUS.find((s) => s.status === "closed")).toBeDefined();
  });

  it("includes withdrawn", () => {
    expect(DISCLOSURE_STATUS.find((s) => s.status === "withdrawn")).toBeDefined();
  });

  it("every entry has both status and label", () => {
    for (const entry of DISCLOSURE_STATUS) {
      expect(entry.status).toBeTruthy();
      expect(entry.label).toBeTruthy();
    }
  });
});

describe("DISCLOSURE_OUTCOMES", () => {
  it("has exactly 5 outcomes", () => {
    expect(DISCLOSURE_OUTCOMES).toHaveLength(5);
  });

  it("contains unique outcome values", () => {
    const outcomes = DISCLOSURE_OUTCOMES.map((o) => o.outcome);
    expect(new Set(outcomes).size).toBe(outcomes.length);
  });

  it("contains unique label values", () => {
    const labels = DISCLOSURE_OUTCOMES.map((o) => o.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes substantiated", () => {
    expect(DISCLOSURE_OUTCOMES.find((o) => o.outcome === "substantiated")).toBeDefined();
  });

  it("includes partially_substantiated", () => {
    expect(DISCLOSURE_OUTCOMES.find((o) => o.outcome === "partially_substantiated")).toBeDefined();
  });

  it("includes unsubstantiated", () => {
    expect(DISCLOSURE_OUTCOMES.find((o) => o.outcome === "unsubstantiated")).toBeDefined();
  });

  it("includes inconclusive", () => {
    expect(DISCLOSURE_OUTCOMES.find((o) => o.outcome === "inconclusive")).toBeDefined();
  });

  it("includes referred", () => {
    expect(DISCLOSURE_OUTCOMES.find((o) => o.outcome === "referred")).toBeDefined();
  });

  it("every entry has both outcome and label", () => {
    for (const entry of DISCLOSURE_OUTCOMES) {
      expect(entry.outcome).toBeTruthy();
      expect(entry.label).toBeTruthy();
    }
  });
});

describe("REFERRAL_BODIES", () => {
  it("has exactly 6 referral bodies", () => {
    expect(REFERRAL_BODIES).toHaveLength(6);
  });

  it("contains unique body values", () => {
    const bodies = REFERRAL_BODIES.map((b) => b.body);
    expect(new Set(bodies).size).toBe(bodies.length);
  });

  it("contains unique label values", () => {
    const labels = REFERRAL_BODIES.map((b) => b.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes ofsted", () => {
    expect(REFERRAL_BODIES.find((b) => b.body === "ofsted")).toBeDefined();
  });

  it("includes lado", () => {
    expect(REFERRAL_BODIES.find((b) => b.body === "lado")).toBeDefined();
  });

  it("includes police", () => {
    expect(REFERRAL_BODIES.find((b) => b.body === "police")).toBeDefined();
  });

  it("includes local_authority", () => {
    expect(REFERRAL_BODIES.find((b) => b.body === "local_authority")).toBeDefined();
  });

  it("includes dbs", () => {
    expect(REFERRAL_BODIES.find((b) => b.body === "dbs")).toBeDefined();
  });

  it("includes none", () => {
    expect(REFERRAL_BODIES.find((b) => b.body === "none")).toBeDefined();
  });

  it("every entry has both body and label", () => {
    for (const entry of REFERRAL_BODIES) {
      expect(entry.body).toBeTruthy();
      expect(entry.label).toBeTruthy();
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// computeWhistleblowingMetrics
// ═══════════════════════════════════════════════════════════════════════════

describe("computeWhistleblowingMetrics", () => {
  it("returns zeroed metrics for empty inputs", () => {
    const result = computeWhistleblowingMetrics([], []);
    expect(result.total_reports).toBe(0);
    expect(result.open_reports).toBe(0);
    expect(result.avg_resolution_days).toBe(0);
    expect(result.by_category).toEqual({});
    expect(result.by_risk_level).toEqual({});
    expect(result.by_outcome).toEqual({});
    expect(result.external_referrals_count).toBe(0);
    expect(result.detriment_reported_count).toBe(0);
    expect(result.policy_compliance_rate).toBe(0);
    expect(result.staff_training_rate).toBe(0);
  });

  it("counts total reports correctly", () => {
    const reports = [
      makeReport({ id: "r1" }),
      makeReport({ id: "r2" }),
      makeReport({ id: "r3" }),
    ];
    const result = computeWhistleblowingMetrics(reports, []);
    expect(result.total_reports).toBe(3);
  });

  it("counts single report correctly", () => {
    const reports = [makeReport({ id: "r1" })];
    const result = computeWhistleblowingMetrics(reports, []);
    expect(result.total_reports).toBe(1);
  });

  // ── Open reports ──────────────────────────────────────────────────────

  it("counts received status as open", () => {
    const reports = [makeReport({ id: "r1", status: "received" })];
    const result = computeWhistleblowingMetrics(reports, []);
    expect(result.open_reports).toBe(1);
  });

  it("counts acknowledged status as open", () => {
    const reports = [makeReport({ id: "r1", status: "acknowledged" })];
    const result = computeWhistleblowingMetrics(reports, []);
    expect(result.open_reports).toBe(1);
  });

  it("counts under_investigation status as open", () => {
    const reports = [makeReport({ id: "r1", status: "under_investigation" })];
    const result = computeWhistleblowingMetrics(reports, []);
    expect(result.open_reports).toBe(1);
  });

  it("counts referred_externally status as open", () => {
    const reports = [makeReport({ id: "r1", status: "referred_externally" })];
    const result = computeWhistleblowingMetrics(reports, []);
    expect(result.open_reports).toBe(1);
  });

  it("does not count resolved status as open", () => {
    const reports = [makeReport({ id: "r1", status: "resolved" })];
    const result = computeWhistleblowingMetrics(reports, []);
    expect(result.open_reports).toBe(0);
  });

  it("does not count closed status as open", () => {
    const reports = [makeReport({ id: "r1", status: "closed" })];
    const result = computeWhistleblowingMetrics(reports, []);
    expect(result.open_reports).toBe(0);
  });

  it("does not count withdrawn status as open", () => {
    const reports = [makeReport({ id: "r1", status: "withdrawn" })];
    const result = computeWhistleblowingMetrics(reports, []);
    expect(result.open_reports).toBe(0);
  });

  it("counts multiple open reports across different open statuses", () => {
    const reports = [
      makeReport({ id: "r1", status: "received" }),
      makeReport({ id: "r2", status: "acknowledged" }),
      makeReport({ id: "r3", status: "under_investigation" }),
      makeReport({ id: "r4", status: "referred_externally" }),
      makeReport({ id: "r5", status: "resolved" }),
      makeReport({ id: "r6", status: "closed" }),
      makeReport({ id: "r7", status: "withdrawn" }),
    ];
    const result = computeWhistleblowingMetrics(reports, []);
    expect(result.open_reports).toBe(4);
  });

  // ── By category ───────────────────────────────────────────────────────

  it("groups reports by category", () => {
    const reports = [
      makeReport({ id: "r1", category: "safeguarding_concern" }),
      makeReport({ id: "r2", category: "safeguarding_concern" }),
      makeReport({ id: "r3", category: "staff_misconduct" }),
      makeReport({ id: "r4", category: "health_safety" }),
    ];
    const result = computeWhistleblowingMetrics(reports, []);
    expect(result.by_category).toEqual({
      safeguarding_concern: 2,
      staff_misconduct: 1,
      health_safety: 1,
    });
  });

  it("returns empty by_category for no reports", () => {
    const result = computeWhistleblowingMetrics([], []);
    expect(result.by_category).toEqual({});
  });

  it("handles single category across all reports", () => {
    const reports = [
      makeReport({ id: "r1", category: "neglect_abuse" }),
      makeReport({ id: "r2", category: "neglect_abuse" }),
    ];
    const result = computeWhistleblowingMetrics(reports, []);
    expect(result.by_category).toEqual({ neglect_abuse: 2 });
  });

  // ── By risk level ─────────────────────────────────────────────────────

  it("groups reports by risk level", () => {
    const reports = [
      makeReport({ id: "r1", risk_level: "critical" }),
      makeReport({ id: "r2", risk_level: "critical" }),
      makeReport({ id: "r3", risk_level: "high" }),
      makeReport({ id: "r4", risk_level: "medium" }),
      makeReport({ id: "r5", risk_level: "low" }),
    ];
    const result = computeWhistleblowingMetrics(reports, []);
    expect(result.by_risk_level).toEqual({
      critical: 2,
      high: 1,
      medium: 1,
      low: 1,
    });
  });

  it("returns empty by_risk_level for no reports", () => {
    const result = computeWhistleblowingMetrics([], []);
    expect(result.by_risk_level).toEqual({});
  });

  // ── By outcome ────────────────────────────────────────────────────────

  it("groups reports by outcome", () => {
    const reports = [
      makeReport({ id: "r1", outcome: "substantiated" }),
      makeReport({ id: "r2", outcome: "substantiated" }),
      makeReport({ id: "r3", outcome: "unsubstantiated" }),
      makeReport({ id: "r4", outcome: "referred" }),
    ];
    const result = computeWhistleblowingMetrics(reports, []);
    expect(result.by_outcome).toEqual({
      substantiated: 2,
      unsubstantiated: 1,
      referred: 1,
    });
  });

  it("excludes reports with null outcome from by_outcome", () => {
    const reports = [
      makeReport({ id: "r1", outcome: null }),
      makeReport({ id: "r2", outcome: "substantiated" }),
    ];
    const result = computeWhistleblowingMetrics(reports, []);
    expect(result.by_outcome).toEqual({ substantiated: 1 });
  });

  it("returns empty by_outcome when all outcomes are null", () => {
    const reports = [
      makeReport({ id: "r1", outcome: null }),
      makeReport({ id: "r2", outcome: null }),
    ];
    const result = computeWhistleblowingMetrics(reports, []);
    expect(result.by_outcome).toEqual({});
  });

  // ── Average resolution days ───────────────────────────────────────────

  it("computes avg_resolution_days for resolved reports with investigation dates", () => {
    const reports = [
      makeReport({
        id: "r1",
        status: "resolved",
        investigation_start_date: "2026-01-01",
        investigation_end_date: "2026-01-11",
      }),
    ];
    const result = computeWhistleblowingMetrics(reports, []);
    expect(result.avg_resolution_days).toBe(10);
  });

  it("computes avg_resolution_days for closed reports with investigation dates", () => {
    const reports = [
      makeReport({
        id: "r1",
        status: "closed",
        investigation_start_date: "2026-02-01",
        investigation_end_date: "2026-02-08",
      }),
    ];
    const result = computeWhistleblowingMetrics(reports, []);
    expect(result.avg_resolution_days).toBe(7);
  });

  it("averages resolution days across multiple resolved reports", () => {
    const reports = [
      makeReport({
        id: "r1",
        status: "resolved",
        investigation_start_date: "2026-01-01",
        investigation_end_date: "2026-01-11",
      }),
      makeReport({
        id: "r2",
        status: "closed",
        investigation_start_date: "2026-02-01",
        investigation_end_date: "2026-02-21",
      }),
    ];
    const result = computeWhistleblowingMetrics(reports, []);
    // (10 + 20) / 2 = 15
    expect(result.avg_resolution_days).toBe(15);
  });

  it("returns 0 avg_resolution_days when no resolved reports have investigation dates", () => {
    const reports = [
      makeReport({ id: "r1", status: "resolved", investigation_start_date: null, investigation_end_date: null }),
    ];
    const result = computeWhistleblowingMetrics(reports, []);
    expect(result.avg_resolution_days).toBe(0);
  });

  it("ignores non-resolved/closed reports for avg_resolution_days", () => {
    const reports = [
      makeReport({
        id: "r1",
        status: "under_investigation",
        investigation_start_date: "2026-01-01",
        investigation_end_date: "2026-01-31",
      }),
    ];
    const result = computeWhistleblowingMetrics(reports, []);
    expect(result.avg_resolution_days).toBe(0);
  });

  it("rounds avg_resolution_days to one decimal place", () => {
    const reports = [
      makeReport({
        id: "r1",
        status: "resolved",
        investigation_start_date: "2026-01-01",
        investigation_end_date: "2026-01-04",
      }),
      makeReport({
        id: "r2",
        status: "resolved",
        investigation_start_date: "2026-02-01",
        investigation_end_date: "2026-02-05",
      }),
    ];
    const result = computeWhistleblowingMetrics(reports, []);
    // (3 + 4) / 2 = 3.5
    expect(result.avg_resolution_days).toBe(3.5);
  });

  // ── External referrals ────────────────────────────────────────────────

  it("counts external referrals excluding none", () => {
    const reports = [
      makeReport({ id: "r1", referred_to: "ofsted" }),
      makeReport({ id: "r2", referred_to: "police" }),
      makeReport({ id: "r3", referred_to: "none" }),
      makeReport({ id: "r4", referred_to: null }),
    ];
    const result = computeWhistleblowingMetrics(reports, []);
    expect(result.external_referrals_count).toBe(2);
  });

  it("returns 0 external referrals when all are none or null", () => {
    const reports = [
      makeReport({ id: "r1", referred_to: "none" }),
      makeReport({ id: "r2", referred_to: null }),
    ];
    const result = computeWhistleblowingMetrics(reports, []);
    expect(result.external_referrals_count).toBe(0);
  });

  it("counts all referral body types as external referrals", () => {
    const reports = [
      makeReport({ id: "r1", referred_to: "ofsted" }),
      makeReport({ id: "r2", referred_to: "lado" }),
      makeReport({ id: "r3", referred_to: "police" }),
      makeReport({ id: "r4", referred_to: "local_authority" }),
      makeReport({ id: "r5", referred_to: "dbs" }),
    ];
    const result = computeWhistleblowingMetrics(reports, []);
    expect(result.external_referrals_count).toBe(5);
  });

  // ── Detriment reported ────────────────────────────────────────────────

  it("counts reports where detriment was reported", () => {
    const reports = [
      makeReport({ id: "r1", detriment_reported: true }),
      makeReport({ id: "r2", detriment_reported: true }),
      makeReport({ id: "r3", detriment_reported: false }),
    ];
    const result = computeWhistleblowingMetrics(reports, []);
    expect(result.detriment_reported_count).toBe(2);
  });

  it("returns 0 detriment count when no detriment reported", () => {
    const reports = [
      makeReport({ id: "r1", detriment_reported: false }),
    ];
    const result = computeWhistleblowingMetrics(reports, []);
    expect(result.detriment_reported_count).toBe(0);
  });

  // ── Policy compliance rate ────────────────────────────────────────────

  it("computes 100% policy compliance when all reviews are compliant", () => {
    const reviews = [
      makePolicyReview({ id: "pr-1", policy_accessible: true, policy_displayed: true }),
      makePolicyReview({ id: "pr-2", policy_accessible: true, policy_displayed: true }),
    ];
    const result = computeWhistleblowingMetrics([], reviews);
    expect(result.policy_compliance_rate).toBe(100);
  });

  it("computes 0% policy compliance when no reviews are compliant", () => {
    const reviews = [
      makePolicyReview({ id: "pr-1", policy_accessible: false, policy_displayed: false }),
      makePolicyReview({ id: "pr-2", policy_accessible: true, policy_displayed: false }),
    ];
    const result = computeWhistleblowingMetrics([], reviews);
    expect(result.policy_compliance_rate).toBe(0);
  });

  it("computes 50% policy compliance for mixed reviews", () => {
    const reviews = [
      makePolicyReview({ id: "pr-1", policy_accessible: true, policy_displayed: true }),
      makePolicyReview({ id: "pr-2", policy_accessible: false, policy_displayed: true }),
    ];
    const result = computeWhistleblowingMetrics([], reviews);
    expect(result.policy_compliance_rate).toBe(50);
  });

  it("requires both accessible and displayed for compliance", () => {
    const reviews = [
      makePolicyReview({ id: "pr-1", policy_accessible: true, policy_displayed: false }),
    ];
    const result = computeWhistleblowingMetrics([], reviews);
    expect(result.policy_compliance_rate).toBe(0);
  });

  it("returns 0 policy compliance rate with no reviews", () => {
    const result = computeWhistleblowingMetrics([], []);
    expect(result.policy_compliance_rate).toBe(0);
  });

  // ── Staff training rate ───────────────────────────────────────────────

  it("computes 100% staff training rate when all staff trained", () => {
    const reviews = [
      makePolicyReview({ id: "pr-1", review_date: daysAgo(5), staff_trained_count: 10, total_staff_count: 10 }),
    ];
    const result = computeWhistleblowingMetrics([], reviews);
    expect(result.staff_training_rate).toBe(100);
  });

  it("computes correct staff training rate for partial training", () => {
    const reviews = [
      makePolicyReview({ id: "pr-1", review_date: daysAgo(5), staff_trained_count: 7, total_staff_count: 10 }),
    ];
    const result = computeWhistleblowingMetrics([], reviews);
    expect(result.staff_training_rate).toBe(70);
  });

  it("uses the most recent policy review for staff training rate", () => {
    const reviews = [
      makePolicyReview({ id: "pr-1", review_date: daysAgo(30), staff_trained_count: 5, total_staff_count: 10 }),
      makePolicyReview({ id: "pr-2", review_date: daysAgo(5), staff_trained_count: 9, total_staff_count: 10 }),
    ];
    const result = computeWhistleblowingMetrics([], reviews);
    expect(result.staff_training_rate).toBe(90);
  });

  it("returns 0 staff training rate when total_staff_count is 0", () => {
    const reviews = [
      makePolicyReview({ id: "pr-1", review_date: daysAgo(5), staff_trained_count: 0, total_staff_count: 0 }),
    ];
    const result = computeWhistleblowingMetrics([], reviews);
    expect(result.staff_training_rate).toBe(0);
  });

  it("returns 0 staff training rate with no reviews", () => {
    const result = computeWhistleblowingMetrics([], []);
    expect(result.staff_training_rate).toBe(0);
  });

  // ── Combined scenarios ────────────────────────────────────────────────

  it("handles mixed reports and reviews together", () => {
    const reports = [
      makeReport({ id: "r1", status: "received", category: "staff_misconduct", risk_level: "high", referred_to: "ofsted", detriment_reported: true }),
      makeReport({ id: "r2", status: "resolved", category: "safeguarding_concern", risk_level: "medium", outcome: "substantiated", investigation_start_date: "2026-01-01", investigation_end_date: "2026-01-11" }),
      makeReport({ id: "r3", status: "closed", category: "staff_misconduct", risk_level: "low", outcome: "unsubstantiated", investigation_start_date: "2026-02-01", investigation_end_date: "2026-02-06" }),
    ];
    const reviews = [
      makePolicyReview({ id: "pr-1", review_date: daysAgo(10), policy_accessible: true, policy_displayed: true, staff_trained_count: 8, total_staff_count: 10 }),
    ];
    const result = computeWhistleblowingMetrics(reports, reviews);
    expect(result.total_reports).toBe(3);
    expect(result.open_reports).toBe(1);
    expect(result.by_category).toEqual({ staff_misconduct: 2, safeguarding_concern: 1 });
    expect(result.by_risk_level).toEqual({ high: 1, medium: 1, low: 1 });
    expect(result.by_outcome).toEqual({ substantiated: 1, unsubstantiated: 1 });
    expect(result.external_referrals_count).toBe(1);
    expect(result.detriment_reported_count).toBe(1);
    expect(result.avg_resolution_days).toBe(7.5);
    expect(result.policy_compliance_rate).toBe(100);
    expect(result.staff_training_rate).toBe(80);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// identifyWhistleblowingAlerts
// ═══════════════════════════════════════════════════════════════════════════

describe("identifyWhistleblowingAlerts", () => {
  const now = new Date(new Date().toISOString().split("T")[0]);

  it("returns empty array for empty inputs except no_policy_review alert", () => {
    const alerts = identifyWhistleblowingAlerts([], []);
    // With no policy reviews, there should be a no_policy_review alert
    expect(alerts).toHaveLength(1);
    expect(alerts[0].type).toBe("no_policy_review");
  });

  // ── No policy review alert ────────────────────────────────────────────

  describe("no policy review alerts", () => {
    it("generates high alert when there are no policy reviews", () => {
      const alerts = identifyWhistleblowingAlerts([], []);
      const noPolicyReview = alerts.filter((a) => a.type === "no_policy_review");
      expect(noPolicyReview).toHaveLength(1);
      expect(noPolicyReview[0].severity).toBe("high");
      expect(noPolicyReview[0].id).toBe("none");
    });

    it("does not generate no_policy_review alert when reviews exist", () => {
      const reviews = [makePolicyReview({ id: "pr-1", review_date: daysAgo(5) })];
      const alerts = identifyWhistleblowingAlerts([], reviews);
      const noPolicyReview = alerts.filter((a) => a.type === "no_policy_review");
      expect(noPolicyReview).toHaveLength(0);
    });
  });

  // ── Unacknowledged disclosure alerts ──────────────────────────────────

  describe("unacknowledged disclosure alerts", () => {
    it("generates critical alert for disclosure received > 48h ago without acknowledgement", () => {
      const reports = [
        makeReport({ id: "r1", status: "received", acknowledged_date: null, disclosure_date: daysAgo(3) }),
      ];
      const reviews = [makePolicyReview()];
      const alerts = identifyWhistleblowingAlerts(reports, reviews);
      const unack = alerts.filter((a) => a.type === "unacknowledged_disclosure");
      expect(unack).toHaveLength(1);
      expect(unack[0].severity).toBe("critical");
      expect(unack[0].id).toBe("r1");
    });

    it("does not flag disclosure received < 48h ago", () => {
      const reports = [
        makeReport({ id: "r1", status: "received", acknowledged_date: null, disclosure_date: daysAgo(1) }),
      ];
      const reviews = [makePolicyReview()];
      const alerts = identifyWhistleblowingAlerts(reports, reviews);
      const unack = alerts.filter((a) => a.type === "unacknowledged_disclosure");
      expect(unack).toHaveLength(0);
    });

    it("does not flag acknowledged disclosure", () => {
      const reports = [
        makeReport({ id: "r1", status: "received", acknowledged_date: daysAgo(2), disclosure_date: daysAgo(5) }),
      ];
      const reviews = [makePolicyReview()];
      const alerts = identifyWhistleblowingAlerts(reports, reviews);
      const unack = alerts.filter((a) => a.type === "unacknowledged_disclosure");
      expect(unack).toHaveLength(0);
    });

    it("does not flag non-received status even if unacknowledged", () => {
      const reports = [
        makeReport({ id: "r1", status: "acknowledged", acknowledged_date: null, disclosure_date: daysAgo(5) }),
      ];
      const reviews = [makePolicyReview()];
      const alerts = identifyWhistleblowingAlerts(reports, reviews);
      const unack = alerts.filter((a) => a.type === "unacknowledged_disclosure");
      expect(unack).toHaveLength(0);
    });

    it("includes hours elapsed in message", () => {
      const reports = [
        makeReport({ id: "r1", status: "received", acknowledged_date: null, disclosure_date: daysAgo(4) }),
      ];
      const reviews = [makePolicyReview()];
      const alerts = identifyWhistleblowingAlerts(reports, reviews);
      const unack = alerts.find((a) => a.type === "unacknowledged_disclosure");
      expect(unack?.message).toContain("h ago");
    });

    it("flags multiple unacknowledged disclosures", () => {
      const reports = [
        makeReport({ id: "r1", status: "received", acknowledged_date: null, disclosure_date: daysAgo(3) }),
        makeReport({ id: "r2", status: "received", acknowledged_date: null, disclosure_date: daysAgo(5) }),
      ];
      const reviews = [makePolicyReview()];
      const alerts = identifyWhistleblowingAlerts(reports, reviews);
      const unack = alerts.filter((a) => a.type === "unacknowledged_disclosure");
      expect(unack).toHaveLength(2);
    });
  });

  // ── High/critical risk open alerts ────────────────────────────────────

  describe("high risk open alerts", () => {
    it("generates high alert for high-risk disclosure open > 7 days", () => {
      const reports = [
        makeReport({ id: "r1", risk_level: "high", status: "under_investigation", disclosure_date: daysAgo(10) }),
      ];
      const reviews = [makePolicyReview()];
      const alerts = identifyWhistleblowingAlerts(reports, reviews);
      const highRisk = alerts.filter((a) => a.type === "high_risk_open");
      expect(highRisk).toHaveLength(1);
      expect(highRisk[0].severity).toBe("high");
      expect(highRisk[0].id).toBe("r1");
    });

    it("generates high alert for critical-risk disclosure open > 7 days", () => {
      const reports = [
        makeReport({ id: "r1", risk_level: "critical", status: "received", disclosure_date: daysAgo(8) }),
      ];
      const reviews = [makePolicyReview()];
      const alerts = identifyWhistleblowingAlerts(reports, reviews);
      const highRisk = alerts.filter((a) => a.type === "high_risk_open");
      expect(highRisk).toHaveLength(1);
      expect(highRisk[0].severity).toBe("high");
    });

    it("does not flag high-risk disclosure open < 7 days", () => {
      const reports = [
        makeReport({ id: "r1", risk_level: "high", status: "received", disclosure_date: daysAgo(5) }),
      ];
      const reviews = [makePolicyReview()];
      const alerts = identifyWhistleblowingAlerts(reports, reviews);
      const highRisk = alerts.filter((a) => a.type === "high_risk_open");
      expect(highRisk).toHaveLength(0);
    });

    it("does not flag medium-risk disclosure open > 7 days", () => {
      const reports = [
        makeReport({ id: "r1", risk_level: "medium", status: "received", disclosure_date: daysAgo(10) }),
      ];
      const reviews = [makePolicyReview()];
      const alerts = identifyWhistleblowingAlerts(reports, reviews);
      const highRisk = alerts.filter((a) => a.type === "high_risk_open");
      expect(highRisk).toHaveLength(0);
    });

    it("does not flag low-risk disclosure open > 7 days", () => {
      const reports = [
        makeReport({ id: "r1", risk_level: "low", status: "received", disclosure_date: daysAgo(10) }),
      ];
      const reviews = [makePolicyReview()];
      const alerts = identifyWhistleblowingAlerts(reports, reviews);
      const highRisk = alerts.filter((a) => a.type === "high_risk_open");
      expect(highRisk).toHaveLength(0);
    });

    it("does not flag resolved high-risk disclosure", () => {
      const reports = [
        makeReport({ id: "r1", risk_level: "high", status: "resolved", disclosure_date: daysAgo(10) }),
      ];
      const reviews = [makePolicyReview()];
      const alerts = identifyWhistleblowingAlerts(reports, reviews);
      const highRisk = alerts.filter((a) => a.type === "high_risk_open");
      expect(highRisk).toHaveLength(0);
    });

    it("does not flag closed high-risk disclosure", () => {
      const reports = [
        makeReport({ id: "r1", risk_level: "high", status: "closed", disclosure_date: daysAgo(10) }),
      ];
      const reviews = [makePolicyReview()];
      const alerts = identifyWhistleblowingAlerts(reports, reviews);
      const highRisk = alerts.filter((a) => a.type === "high_risk_open");
      expect(highRisk).toHaveLength(0);
    });

    it("does not flag withdrawn high-risk disclosure", () => {
      const reports = [
        makeReport({ id: "r1", risk_level: "high", status: "withdrawn", disclosure_date: daysAgo(10) }),
      ];
      const reviews = [makePolicyReview()];
      const alerts = identifyWhistleblowingAlerts(reports, reviews);
      const highRisk = alerts.filter((a) => a.type === "high_risk_open");
      expect(highRisk).toHaveLength(0);
    });

    it("includes capitalised risk level in message", () => {
      const reports = [
        makeReport({ id: "r1", risk_level: "critical", status: "received", disclosure_date: daysAgo(10) }),
      ];
      const reviews = [makePolicyReview()];
      const alerts = identifyWhistleblowingAlerts(reports, reviews);
      const highRisk = alerts.find((a) => a.type === "high_risk_open");
      expect(highRisk?.message).toContain("Critical");
    });

    it("includes days elapsed in high risk open message", () => {
      const reports = [
        makeReport({ id: "r1", risk_level: "high", status: "received", disclosure_date: daysAgo(15) }),
      ];
      const reviews = [makePolicyReview()];
      const alerts = identifyWhistleblowingAlerts(reports, reviews, now);
      const highRisk = alerts.find((a) => a.type === "high_risk_open");
      expect(highRisk?.message).toContain("15 days");
    });
  });

  // ── Investigation prolonged alerts ────────────────────────────────────

  describe("investigation prolonged alerts", () => {
    it("generates medium alert for investigation running > 30 days", () => {
      const reports = [
        makeReport({
          id: "r1",
          status: "under_investigation",
          investigation_start_date: daysAgo(35),
          investigation_end_date: null,
        }),
      ];
      const reviews = [makePolicyReview()];
      const alerts = identifyWhistleblowingAlerts(reports, reviews);
      const prolonged = alerts.filter((a) => a.type === "investigation_prolonged");
      expect(prolonged).toHaveLength(1);
      expect(prolonged[0].severity).toBe("medium");
      expect(prolonged[0].id).toBe("r1");
    });

    it("does not flag investigation running < 30 days", () => {
      const reports = [
        makeReport({
          id: "r1",
          status: "under_investigation",
          investigation_start_date: daysAgo(20),
          investigation_end_date: null,
        }),
      ];
      const reviews = [makePolicyReview()];
      const alerts = identifyWhistleblowingAlerts(reports, reviews);
      const prolonged = alerts.filter((a) => a.type === "investigation_prolonged");
      expect(prolonged).toHaveLength(0);
    });

    it("does not flag investigation that has ended", () => {
      const reports = [
        makeReport({
          id: "r1",
          status: "under_investigation",
          investigation_start_date: daysAgo(40),
          investigation_end_date: daysAgo(5),
        }),
      ];
      const reviews = [makePolicyReview()];
      const alerts = identifyWhistleblowingAlerts(reports, reviews);
      const prolonged = alerts.filter((a) => a.type === "investigation_prolonged");
      expect(prolonged).toHaveLength(0);
    });

    it("does not flag non-under_investigation status", () => {
      const reports = [
        makeReport({
          id: "r1",
          status: "resolved",
          investigation_start_date: daysAgo(40),
          investigation_end_date: null,
        }),
      ];
      const reviews = [makePolicyReview()];
      const alerts = identifyWhistleblowingAlerts(reports, reviews);
      const prolonged = alerts.filter((a) => a.type === "investigation_prolonged");
      expect(prolonged).toHaveLength(0);
    });

    it("does not flag when no investigation_start_date", () => {
      const reports = [
        makeReport({
          id: "r1",
          status: "under_investigation",
          investigation_start_date: null,
          investigation_end_date: null,
        }),
      ];
      const reviews = [makePolicyReview()];
      const alerts = identifyWhistleblowingAlerts(reports, reviews);
      const prolonged = alerts.filter((a) => a.type === "investigation_prolonged");
      expect(prolonged).toHaveLength(0);
    });

    it("includes days elapsed in prolonged investigation message", () => {
      const reports = [
        makeReport({
          id: "r1",
          status: "under_investigation",
          investigation_start_date: daysAgo(45),
          investigation_end_date: null,
        }),
      ];
      const reviews = [makePolicyReview()];
      const alerts = identifyWhistleblowingAlerts(reports, reviews, now);
      const prolonged = alerts.find((a) => a.type === "investigation_prolonged");
      expect(prolonged?.message).toContain("45 days");
    });
  });

  // ── Follow-up overdue alerts ──────────────────────────────────────────

  describe("follow-up overdue alerts", () => {
    it("generates high alert for overdue follow-up", () => {
      const reports = [
        makeReport({ id: "r1", follow_up_date: daysAgo(5), follow_up_completed: false }),
      ];
      const reviews = [makePolicyReview()];
      const alerts = identifyWhistleblowingAlerts(reports, reviews);
      const overdue = alerts.filter((a) => a.type === "follow_up_overdue");
      expect(overdue).toHaveLength(1);
      expect(overdue[0].severity).toBe("high");
      expect(overdue[0].id).toBe("r1");
    });

    it("does not flag completed follow-up", () => {
      const reports = [
        makeReport({ id: "r1", follow_up_date: daysAgo(5), follow_up_completed: true }),
      ];
      const reviews = [makePolicyReview()];
      const alerts = identifyWhistleblowingAlerts(reports, reviews);
      const overdue = alerts.filter((a) => a.type === "follow_up_overdue");
      expect(overdue).toHaveLength(0);
    });

    it("does not flag future follow-up date", () => {
      const reports = [
        makeReport({ id: "r1", follow_up_date: daysFromNow(5), follow_up_completed: false }),
      ];
      const reviews = [makePolicyReview()];
      const alerts = identifyWhistleblowingAlerts(reports, reviews);
      const overdue = alerts.filter((a) => a.type === "follow_up_overdue");
      expect(overdue).toHaveLength(0);
    });

    it("does not flag when no follow_up_date set", () => {
      const reports = [
        makeReport({ id: "r1", follow_up_date: null, follow_up_completed: false }),
      ];
      const reviews = [makePolicyReview()];
      const alerts = identifyWhistleblowingAlerts(reports, reviews);
      const overdue = alerts.filter((a) => a.type === "follow_up_overdue");
      expect(overdue).toHaveLength(0);
    });

    it("includes days overdue in message", () => {
      const reports = [
        makeReport({ id: "r1", follow_up_date: daysAgo(10), follow_up_completed: false }),
      ];
      const reviews = [makePolicyReview()];
      const alerts = identifyWhistleblowingAlerts(reports, reviews, now);
      const overdue = alerts.find((a) => a.type === "follow_up_overdue");
      expect(overdue?.message).toContain("10 days overdue");
    });
  });

  // ── Detriment reported alerts ─────────────────────────────────────────

  describe("detriment reported alerts", () => {
    it("generates critical alert when detriment reported and not closed", () => {
      const reports = [
        makeReport({ id: "r1", detriment_reported: true, status: "under_investigation" }),
      ];
      const reviews = [makePolicyReview()];
      const alerts = identifyWhistleblowingAlerts(reports, reviews);
      const detriment = alerts.filter((a) => a.type === "detriment_reported");
      expect(detriment).toHaveLength(1);
      expect(detriment[0].severity).toBe("critical");
      expect(detriment[0].id).toBe("r1");
    });

    it("does not flag detriment when report is closed", () => {
      const reports = [
        makeReport({ id: "r1", detriment_reported: true, status: "closed" }),
      ];
      const reviews = [makePolicyReview()];
      const alerts = identifyWhistleblowingAlerts(reports, reviews);
      const detriment = alerts.filter((a) => a.type === "detriment_reported");
      expect(detriment).toHaveLength(0);
    });

    it("does not flag when detriment not reported", () => {
      const reports = [
        makeReport({ id: "r1", detriment_reported: false, status: "under_investigation" }),
      ];
      const reviews = [makePolicyReview()];
      const alerts = identifyWhistleblowingAlerts(reports, reviews);
      const detriment = alerts.filter((a) => a.type === "detriment_reported");
      expect(detriment).toHaveLength(0);
    });

    it("flags detriment across multiple open statuses", () => {
      const reports = [
        makeReport({ id: "r1", detriment_reported: true, status: "received" }),
        makeReport({ id: "r2", detriment_reported: true, status: "acknowledged" }),
        makeReport({ id: "r3", detriment_reported: true, status: "resolved" }),
      ];
      const reviews = [makePolicyReview()];
      const alerts = identifyWhistleblowingAlerts(reports, reviews);
      const detriment = alerts.filter((a) => a.type === "detriment_reported");
      // received, acknowledged, resolved are not "closed", so all 3 should flag
      expect(detriment).toHaveLength(3);
    });

    it("mentions PIDA 1998 in detriment message", () => {
      const reports = [
        makeReport({ id: "r1", detriment_reported: true, status: "received" }),
      ];
      const reviews = [makePolicyReview()];
      const alerts = identifyWhistleblowingAlerts(reports, reviews);
      const detriment = alerts.find((a) => a.type === "detriment_reported");
      expect(detriment?.message).toContain("PIDA 1998");
    });
  });

  // ── Policy review overdue alerts ──────────────────────────────────────

  describe("policy review overdue alerts", () => {
    it("generates high alert when policy not reviewed in 6+ months", () => {
      const reviews = [
        makePolicyReview({ id: "pr-1", review_date: daysAgo(200) }),
      ];
      const alerts = identifyWhistleblowingAlerts([], reviews);
      const overdue = alerts.filter((a) => a.type === "policy_review_overdue");
      expect(overdue).toHaveLength(1);
      expect(overdue[0].severity).toBe("high");
      expect(overdue[0].id).toBe("pr-1");
    });

    it("does not flag policy reviewed within 6 months", () => {
      const reviews = [
        makePolicyReview({ id: "pr-1", review_date: daysAgo(30) }),
      ];
      const alerts = identifyWhistleblowingAlerts([], reviews);
      const overdue = alerts.filter((a) => a.type === "policy_review_overdue");
      expect(overdue).toHaveLength(0);
    });

    it("uses the most recent review date to determine overdue", () => {
      const reviews = [
        makePolicyReview({ id: "pr-1", review_date: daysAgo(200) }),
        makePolicyReview({ id: "pr-2", review_date: daysAgo(10) }),
      ];
      const alerts = identifyWhistleblowingAlerts([], reviews);
      const overdue = alerts.filter((a) => a.type === "policy_review_overdue");
      expect(overdue).toHaveLength(0);
    });

    it("includes months elapsed in overdue message", () => {
      const reviews = [
        makePolicyReview({ id: "pr-1", review_date: daysAgo(210) }),
      ];
      const alerts = identifyWhistleblowingAlerts([], reviews);
      const overdue = alerts.find((a) => a.type === "policy_review_overdue");
      expect(overdue?.message).toContain("months");
    });

    it("mentions Reg 41 in policy review overdue message", () => {
      const reviews = [
        makePolicyReview({ id: "pr-1", review_date: daysAgo(200) }),
      ];
      const alerts = identifyWhistleblowingAlerts([], reviews);
      const overdue = alerts.find((a) => a.type === "policy_review_overdue");
      expect(overdue?.message).toContain("Reg 41");
    });
  });

  // ── Staff training low alerts ─────────────────────────────────────────

  describe("staff training low alerts", () => {
    it("generates medium alert when staff training below 90%", () => {
      const reviews = [
        makePolicyReview({ id: "pr-1", review_date: daysAgo(5), staff_trained_count: 8, total_staff_count: 10 }),
      ];
      const alerts = identifyWhistleblowingAlerts([], reviews);
      const lowTraining = alerts.filter((a) => a.type === "staff_training_low");
      expect(lowTraining).toHaveLength(1);
      expect(lowTraining[0].severity).toBe("medium");
      expect(lowTraining[0].id).toBe("pr-1");
    });

    it("does not flag when staff training at exactly 90%", () => {
      const reviews = [
        makePolicyReview({ id: "pr-1", review_date: daysAgo(5), staff_trained_count: 9, total_staff_count: 10 }),
      ];
      const alerts = identifyWhistleblowingAlerts([], reviews);
      const lowTraining = alerts.filter((a) => a.type === "staff_training_low");
      expect(lowTraining).toHaveLength(0);
    });

    it("does not flag when staff training above 90%", () => {
      const reviews = [
        makePolicyReview({ id: "pr-1", review_date: daysAgo(5), staff_trained_count: 10, total_staff_count: 10 }),
      ];
      const alerts = identifyWhistleblowingAlerts([], reviews);
      const lowTraining = alerts.filter((a) => a.type === "staff_training_low");
      expect(lowTraining).toHaveLength(0);
    });

    it("does not flag when total_staff_count is 0", () => {
      const reviews = [
        makePolicyReview({ id: "pr-1", review_date: daysAgo(5), staff_trained_count: 0, total_staff_count: 0 }),
      ];
      const alerts = identifyWhistleblowingAlerts([], reviews);
      const lowTraining = alerts.filter((a) => a.type === "staff_training_low");
      expect(lowTraining).toHaveLength(0);
    });

    it("uses the most recent review for training rate check", () => {
      const reviews = [
        makePolicyReview({ id: "pr-1", review_date: daysAgo(30), staff_trained_count: 5, total_staff_count: 10 }),
        makePolicyReview({ id: "pr-2", review_date: daysAgo(5), staff_trained_count: 10, total_staff_count: 10 }),
      ];
      const alerts = identifyWhistleblowingAlerts([], reviews);
      const lowTraining = alerts.filter((a) => a.type === "staff_training_low");
      expect(lowTraining).toHaveLength(0);
    });

    it("includes training percentage in message", () => {
      const reviews = [
        makePolicyReview({ id: "pr-1", review_date: daysAgo(5), staff_trained_count: 7, total_staff_count: 10 }),
      ];
      const alerts = identifyWhistleblowingAlerts([], reviews);
      const lowTraining = alerts.find((a) => a.type === "staff_training_low");
      expect(lowTraining?.message).toContain("70%");
    });

    it("mentions Reg 41 in staff training low message", () => {
      const reviews = [
        makePolicyReview({ id: "pr-1", review_date: daysAgo(5), staff_trained_count: 5, total_staff_count: 10 }),
      ];
      const alerts = identifyWhistleblowingAlerts([], reviews);
      const lowTraining = alerts.find((a) => a.type === "staff_training_low");
      expect(lowTraining?.message).toContain("Reg 41");
    });
  });

  // ── External contacts not displayed alerts ────────────────────────────

  describe("external contacts not displayed alerts", () => {
    it("generates high alert when external contacts not displayed", () => {
      const reviews = [
        makePolicyReview({ id: "pr-1", review_date: daysAgo(5), external_contacts_displayed: false }),
      ];
      const alerts = identifyWhistleblowingAlerts([], reviews);
      const noContacts = alerts.filter((a) => a.type === "external_contacts_not_displayed");
      expect(noContacts).toHaveLength(1);
      expect(noContacts[0].severity).toBe("high");
      expect(noContacts[0].id).toBe("pr-1");
    });

    it("does not flag when external contacts are displayed", () => {
      const reviews = [
        makePolicyReview({ id: "pr-1", review_date: daysAgo(5), external_contacts_displayed: true }),
      ];
      const alerts = identifyWhistleblowingAlerts([], reviews);
      const noContacts = alerts.filter((a) => a.type === "external_contacts_not_displayed");
      expect(noContacts).toHaveLength(0);
    });

    it("uses the most recent review for external contacts check", () => {
      const reviews = [
        makePolicyReview({ id: "pr-1", review_date: daysAgo(30), external_contacts_displayed: false }),
        makePolicyReview({ id: "pr-2", review_date: daysAgo(5), external_contacts_displayed: true }),
      ];
      const alerts = identifyWhistleblowingAlerts([], reviews);
      const noContacts = alerts.filter((a) => a.type === "external_contacts_not_displayed");
      expect(noContacts).toHaveLength(0);
    });

    it("mentions Ofsted in external contacts message", () => {
      const reviews = [
        makePolicyReview({ id: "pr-1", review_date: daysAgo(5), external_contacts_displayed: false }),
      ];
      const alerts = identifyWhistleblowingAlerts([], reviews);
      const noContacts = alerts.find((a) => a.type === "external_contacts_not_displayed");
      expect(noContacts?.message).toContain("Ofsted");
    });

    it("mentions LADO in external contacts message", () => {
      const reviews = [
        makePolicyReview({ id: "pr-1", review_date: daysAgo(5), external_contacts_displayed: false }),
      ];
      const alerts = identifyWhistleblowingAlerts([], reviews);
      const noContacts = alerts.find((a) => a.type === "external_contacts_not_displayed");
      expect(noContacts?.message).toContain("LADO");
    });
  });

  // ── Combined / complex scenarios ──────────────────────────────────────

  describe("combined alert scenarios", () => {
    it("generates multiple alert types for a single problematic report", () => {
      const reports = [
        makeReport({
          id: "r1",
          status: "received",
          acknowledged_date: null,
          disclosure_date: daysAgo(10),
          risk_level: "critical",
          detriment_reported: true,
          follow_up_date: daysAgo(3),
          follow_up_completed: false,
        }),
      ];
      const reviews = [makePolicyReview()];
      const alerts = identifyWhistleblowingAlerts(reports, reviews);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("unacknowledged_disclosure");
      expect(types).toContain("high_risk_open");
      expect(types).toContain("detriment_reported");
      expect(types).toContain("follow_up_overdue");
    });

    it("generates both report and policy alerts simultaneously", () => {
      const reports = [
        makeReport({
          id: "r1",
          status: "received",
          acknowledged_date: null,
          disclosure_date: daysAgo(5),
          risk_level: "high",
          detriment_reported: true,
        }),
      ];
      const reviews = [
        makePolicyReview({
          id: "pr-1",
          review_date: daysAgo(200),
          staff_trained_count: 5,
          total_staff_count: 10,
          external_contacts_displayed: false,
        }),
      ];
      const alerts = identifyWhistleblowingAlerts(reports, reviews);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("unacknowledged_disclosure");
      expect(types).toContain("detriment_reported");
      expect(types).toContain("policy_review_overdue");
      expect(types).toContain("staff_training_low");
      expect(types).toContain("external_contacts_not_displayed");
    });

    it("returns only no_policy_review for no reports and no reviews", () => {
      const alerts = identifyWhistleblowingAlerts([], []);
      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe("no_policy_review");
    });

    it("returns no alerts for healthy state with recent reviews", () => {
      const reports = [
        makeReport({ id: "r1", status: "closed", risk_level: "low", detriment_reported: false }),
      ];
      const reviews = [
        makePolicyReview({
          id: "pr-1",
          review_date: daysAgo(10),
          staff_trained_count: 10,
          total_staff_count: 10,
          external_contacts_displayed: true,
        }),
      ];
      const alerts = identifyWhistleblowingAlerts(reports, reviews);
      expect(alerts).toHaveLength(0);
    });

    it("handles large mixed dataset correctly", () => {
      const reports = [
        makeReport({ id: "r1", status: "received", acknowledged_date: null, disclosure_date: daysAgo(5), risk_level: "critical", detriment_reported: true }),
        makeReport({ id: "r2", status: "under_investigation", investigation_start_date: daysAgo(40), investigation_end_date: null, risk_level: "high", disclosure_date: daysAgo(40) }),
        makeReport({ id: "r3", status: "resolved", risk_level: "medium", follow_up_date: daysAgo(7), follow_up_completed: false }),
        makeReport({ id: "r4", status: "closed", risk_level: "low", detriment_reported: false }),
      ];
      const reviews = [
        makePolicyReview({
          id: "pr-1",
          review_date: daysAgo(10),
          staff_trained_count: 8,
          total_staff_count: 10,
          external_contacts_displayed: true,
        }),
      ];
      const alerts = identifyWhistleblowingAlerts(reports, reviews);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("unacknowledged_disclosure"); // r1 > 48h
      expect(types).toContain("high_risk_open"); // r1 critical > 7 days, r2 high > 7 days
      expect(types).toContain("detriment_reported"); // r1
      expect(types).toContain("investigation_prolonged"); // r2 > 30 days
      expect(types).toContain("follow_up_overdue"); // r3
      expect(types).toContain("staff_training_low"); // 80% < 90%
    });

    it("all alerts have required fields: type, severity, message, id", () => {
      const reports = [
        makeReport({ id: "r1", status: "received", acknowledged_date: null, disclosure_date: daysAgo(5), risk_level: "critical", detriment_reported: true }),
      ];
      const reviews = [
        makePolicyReview({ id: "pr-1", review_date: daysAgo(200), external_contacts_displayed: false, staff_trained_count: 3, total_staff_count: 10 }),
      ];
      const alerts = identifyWhistleblowingAlerts(reports, reviews);
      for (const alert of alerts) {
        expect(alert.type).toBeTruthy();
        expect(alert.severity).toBeTruthy();
        expect(alert.message).toBeTruthy();
        expect(alert.id).toBeTruthy();
      }
    });

    it("all alert severities are valid values", () => {
      const reports = [
        makeReport({ id: "r1", status: "received", acknowledged_date: null, disclosure_date: daysAgo(5), risk_level: "high", detriment_reported: true }),
      ];
      const reviews = [
        makePolicyReview({ id: "pr-1", review_date: daysAgo(200), staff_trained_count: 5, total_staff_count: 10, external_contacts_displayed: false }),
      ];
      const alerts = identifyWhistleblowingAlerts(reports, reviews);
      const validSeverities = ["critical", "high", "medium", "low"];
      for (const alert of alerts) {
        expect(validSeverities).toContain(alert.severity);
      }
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// CRUD — Whistleblowing Reports (Supabase disabled)
// ═══════════════════════════════════════════════════════════════════════════

describe("listReports", () => {
  it("returns ok: true with empty data array when Supabase is disabled", async () => {
    const result = await listReports("home-1");
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("returns ok: true with empty data array regardless of filters", async () => {
    const result = await listReports("home-1", {
      category: "safeguarding_concern",
      status: "received",
      riskLevel: "high",
      limit: 50,
    });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });
});

describe("createReport", () => {
  it("returns ok: false with Supabase not configured error", async () => {
    const result = await createReport({
      homeId: "home-1",
      reporterRole: "care_worker",
      disclosureDate: "2026-05-01",
      receivedBy: "manager-1",
      category: "safeguarding_concern",
      description: "Test disclosure",
      riskLevel: "medium",
    });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Supabase not configured");
  });
});

describe("updateReport", () => {
  it("returns ok: false with Supabase not configured error", async () => {
    const result = await updateReport("rpt-1", { status: "acknowledged" });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Supabase not configured");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// CRUD — Policy Reviews (Supabase disabled)
// ═══════════════════════════════════════════════════════════════════════════

describe("listPolicyReviews", () => {
  it("returns ok: true with empty data array when Supabase is disabled", async () => {
    const result = await listPolicyReviews("home-1");
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("returns ok: true with empty data array regardless of filters", async () => {
    const result = await listPolicyReviews("home-1", { limit: 25 });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });
});

describe("createPolicyReview", () => {
  it("returns ok: false with Supabase not configured error", async () => {
    const result = await createPolicyReview({
      homeId: "home-1",
      reviewDate: "2026-05-01",
      reviewedBy: "manager-1",
    });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Supabase not configured");
  });
});

describe("updatePolicyReview", () => {
  it("returns ok: false with Supabase not configured error", async () => {
    const result = await updatePolicyReview("pr-1", { policy_accessible: true });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Supabase not configured");
  });
});
