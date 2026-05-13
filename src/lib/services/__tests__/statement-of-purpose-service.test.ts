// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — STATEMENT OF PURPOSE SERVICE TESTS
// Pure-function unit tests for statement metrics computation,
// alert identification, constant validation, and CRUD fallback behaviour
// (Supabase disabled). CHR 2015 Reg 16 (statement of purpose),
// Reg 28 (review and revision), Reg 31 (notification to HMCI),
// Schedule 1 (content requirements).
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  _testing,
  DOCUMENT_STATUSES,
  REVIEW_OUTCOMES,
  AMENDMENT_TYPES,
  DISTRIBUTION_METHODS,
  SCHEDULE_SECTIONS,
  listStatements,
  createStatement,
  updateStatement,
  listReviews,
  createReview,
  listAmendments,
  createAmendment,
} from "../statement-of-purpose-service";

import type {
  StatementOfPurpose,
  StatementReview,
  StatementAmendment,
} from "../statement-of-purpose-service";

const { computeStatementMetrics, identifyStatementAlerts } = _testing;

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

/** Build a minimal StatementOfPurpose with sensible defaults. */
function makeStatement(
  overrides: Partial<StatementOfPurpose> = {},
): StatementOfPurpose {
  return {
    id: "stmt-1",
    home_id: "home-1",
    version: "1.0",
    title: "Statement of Purpose — Oak House",
    effective_date: daysAgo(90),
    review_date: daysFromNow(90),
    last_reviewed_date: daysAgo(30),
    reviewed_by: "staff-1",
    approved_by: "manager-1",
    approval_date: daysAgo(30),
    status: "active",
    range_of_needs: "Children aged 8-17 with EBD",
    ethos_and_philosophy: "Trauma-informed care approach",
    accommodation_details: "5-bed detached property",
    location_details: "Suburban residential area",
    staffing_structure: "1 RM, 2 DRMs, 6 RSWs",
    fire_safety_arrangements: "Annual inspection, monthly drills",
    behaviour_management_approach: "Restorative practice model",
    education_provision: "On-site tutoring and local schools",
    health_arrangements: "GP registered, CAMHS referral pathway",
    contact_arrangements: "Family contact facilitated weekly",
    complaints_procedure: "Written procedure, independent person available",
    religious_cultural_needs: "All faiths respected and accommodated",
    emergency_placement_procedure: null,
    registered_manager: "Darren Laville",
    responsible_individual: "Jane Smith",
    ofsted_notification_date: null,
    notes: null,
    created_at: daysAgoISO(90),
    updated_at: daysAgoISO(5),
    ...overrides,
  };
}

/** Build a minimal StatementReview with sensible defaults. */
function makeReview(
  overrides: Partial<StatementReview> = {},
): StatementReview {
  return {
    id: "rev-1",
    home_id: "home-1",
    statement_id: "stmt-1",
    review_date: daysAgo(30),
    reviewer_name: "Darren Laville",
    reviewer_role: "Registered Manager",
    outcome: "approved_no_changes",
    sections_reviewed: ["range_of_needs", "staffing", "health"],
    changes_required: null,
    changes_made: null,
    next_review_date: daysFromNow(335),
    notes: null,
    created_at: daysAgoISO(30),
    ...overrides,
  };
}

/** Build a minimal StatementAmendment with sensible defaults. */
function makeAmendment(
  overrides: Partial<StatementAmendment> = {},
): StatementAmendment {
  return {
    id: "amend-1",
    home_id: "home-1",
    statement_id: "stmt-1",
    amendment_date: daysAgo(15),
    amendment_type: "minor_update",
    amended_by: "Darren Laville",
    section_amended: "staffing",
    previous_content: "1 RM, 1 DRM, 5 RSWs",
    new_content: "1 RM, 2 DRMs, 6 RSWs",
    reason_for_change: "New DRM appointed, additional RSW recruited",
    approved_by: "manager-1",
    ofsted_notified: false,
    notes: null,
    created_at: daysAgoISO(15),
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

describe("DOCUMENT_STATUSES", () => {
  it("has exactly 5 statuses", () => {
    expect(DOCUMENT_STATUSES).toHaveLength(5);
  });

  it("contains only unique status values", () => {
    const values = DOCUMENT_STATUSES.map((d) => d.status);
    expect(new Set(values).size).toBe(values.length);
  });

  it("every entry has a non-empty label", () => {
    for (const d of DOCUMENT_STATUSES) {
      expect(d.label.trim().length).toBeGreaterThan(0);
    }
  });

  it("includes draft, active, under_review, archived, superseded", () => {
    const values = DOCUMENT_STATUSES.map((d) => d.status);
    expect(values).toContain("draft");
    expect(values).toContain("active");
    expect(values).toContain("under_review");
    expect(values).toContain("archived");
    expect(values).toContain("superseded");
  });
});

describe("REVIEW_OUTCOMES", () => {
  it("has exactly 4 outcomes", () => {
    expect(REVIEW_OUTCOMES).toHaveLength(4);
  });

  it("contains only unique outcome values", () => {
    const values = REVIEW_OUTCOMES.map((r) => r.outcome);
    expect(new Set(values).size).toBe(values.length);
  });

  it("every entry has a non-empty label", () => {
    for (const r of REVIEW_OUTCOMES) {
      expect(r.label.trim().length).toBeGreaterThan(0);
    }
  });

  it("includes approved_no_changes and deferred", () => {
    const values = REVIEW_OUTCOMES.map((r) => r.outcome);
    expect(values).toContain("approved_no_changes");
    expect(values).toContain("approved_with_amendments");
    expect(values).toContain("major_revision_required");
    expect(values).toContain("deferred");
  });
});

describe("AMENDMENT_TYPES", () => {
  it("has exactly 7 types", () => {
    expect(AMENDMENT_TYPES).toHaveLength(7);
  });

  it("contains only unique type values", () => {
    const values = AMENDMENT_TYPES.map((a) => a.type);
    expect(new Set(values).size).toBe(values.length);
  });

  it("every entry has a non-empty label", () => {
    for (const a of AMENDMENT_TYPES) {
      expect(a.label.trim().length).toBeGreaterThan(0);
    }
  });

  it("includes all seven amendment types", () => {
    const values = AMENDMENT_TYPES.map((a) => a.type);
    expect(values).toContain("minor_update");
    expect(values).toContain("major_revision");
    expect(values).toContain("annual_review");
    expect(values).toContain("regulatory_change");
    expect(values).toContain("ofsted_recommendation");
    expect(values).toContain("staff_change");
    expect(values).toContain("capacity_change");
  });
});

describe("DISTRIBUTION_METHODS", () => {
  it("has exactly 5 methods", () => {
    expect(DISTRIBUTION_METHODS).toHaveLength(5);
  });

  it("contains only unique method values", () => {
    const values = DISTRIBUTION_METHODS.map((d) => d.method);
    expect(new Set(values).size).toBe(values.length);
  });

  it("every entry has a non-empty label", () => {
    for (const d of DISTRIBUTION_METHODS) {
      expect(d.label.trim().length).toBeGreaterThan(0);
    }
  });

  it("includes email, post, website, printed_copy, portal_access", () => {
    const values = DISTRIBUTION_METHODS.map((d) => d.method);
    expect(values).toContain("email");
    expect(values).toContain("post");
    expect(values).toContain("website");
    expect(values).toContain("printed_copy");
    expect(values).toContain("portal_access");
  });
});

describe("SCHEDULE_SECTIONS", () => {
  it("has exactly 13 sections", () => {
    expect(SCHEDULE_SECTIONS).toHaveLength(13);
  });

  it("contains only unique section values", () => {
    const values = SCHEDULE_SECTIONS.map((s) => s.section);
    expect(new Set(values).size).toBe(values.length);
  });

  it("every entry has a non-empty label", () => {
    for (const s of SCHEDULE_SECTIONS) {
      expect(s.label.trim().length).toBeGreaterThan(0);
    }
  });

  it("includes all 13 Schedule 1 sections", () => {
    const values = SCHEDULE_SECTIONS.map((s) => s.section);
    expect(values).toContain("range_of_needs");
    expect(values).toContain("ethos_philosophy");
    expect(values).toContain("accommodation");
    expect(values).toContain("location");
    expect(values).toContain("staffing");
    expect(values).toContain("fire_safety");
    expect(values).toContain("behaviour_management");
    expect(values).toContain("education");
    expect(values).toContain("health");
    expect(values).toContain("contact");
    expect(values).toContain("complaints");
    expect(values).toContain("religious_cultural");
    expect(values).toContain("emergency_placement");
  });

  it("labels are human-readable titles", () => {
    for (const s of SCHEDULE_SECTIONS) {
      // Labels should start with an uppercase letter
      expect(s.label[0]).toBe(s.label[0].toUpperCase());
    }
  });

  it("section values use snake_case format", () => {
    for (const s of SCHEDULE_SECTIONS) {
      expect(s.section).toMatch(/^[a-z]+(_[a-z]+)*$/);
    }
  });
});

// ── Cross-constant consistency ──────────────────────────────────────────

describe("Cross-constant consistency", () => {
  it("DOCUMENT_STATUSES status values are lowercase with underscores", () => {
    for (const d of DOCUMENT_STATUSES) {
      expect(d.status).toMatch(/^[a-z]+(_[a-z]+)*$/);
    }
  });

  it("REVIEW_OUTCOMES outcome values are lowercase with underscores", () => {
    for (const r of REVIEW_OUTCOMES) {
      expect(r.outcome).toMatch(/^[a-z]+(_[a-z]+)*$/);
    }
  });

  it("AMENDMENT_TYPES type values are lowercase with underscores", () => {
    for (const a of AMENDMENT_TYPES) {
      expect(a.type).toMatch(/^[a-z]+(_[a-z]+)*$/);
    }
  });

  it("DISTRIBUTION_METHODS method values are lowercase with underscores", () => {
    for (const d of DISTRIBUTION_METHODS) {
      expect(d.method).toMatch(/^[a-z]+(_[a-z]+)*$/);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// computeStatementMetrics
// ═══════════════════════════════════════════════════════════════════════════

describe("computeStatementMetrics", () => {
  it("returns zeroed metrics for empty inputs", () => {
    const m = computeStatementMetrics([], [], []);
    expect(m.active_statements).toBe(0);
    expect(m.overdue_reviews).toBe(0);
    expect(m.amendments_this_year).toBe(0);
    expect(m.reviews_this_year).toBe(0);
    expect(m.avg_days_between_reviews).toBe(0);
    expect(m.latest_version).toBe("0.0");
    expect(Object.keys(m.by_amendment_type)).toHaveLength(0);
    expect(Object.keys(m.by_review_outcome)).toHaveLength(0);
  });

  it("all sections_coverage defaults to false when empty", () => {
    const m = computeStatementMetrics([], [], []);
    for (const sec of SCHEDULE_SECTIONS) {
      expect(m.sections_coverage[sec.section]).toBe(false);
    }
  });

  // ── Active statements ─────────────────────────────────────────────────

  it("counts active statements correctly", () => {
    const stmts = [
      makeStatement({ id: "s1", status: "active" }),
      makeStatement({ id: "s2", status: "draft" }),
      makeStatement({ id: "s3", status: "active" }),
      makeStatement({ id: "s4", status: "archived" }),
    ];
    const m = computeStatementMetrics(stmts, [], []);
    expect(m.active_statements).toBe(2);
  });

  it("counts zero active when all are draft", () => {
    const stmts = [
      makeStatement({ id: "s1", status: "draft" }),
      makeStatement({ id: "s2", status: "draft" }),
    ];
    const m = computeStatementMetrics(stmts, [], []);
    expect(m.active_statements).toBe(0);
  });

  it("counts a single active statement", () => {
    const stmts = [makeStatement({ status: "active" })];
    const m = computeStatementMetrics(stmts, [], []);
    expect(m.active_statements).toBe(1);
  });

  // ── Overdue reviews ───────────────────────────────────────────────────

  it("counts overdue reviews for active statements with past review_date", () => {
    const stmts = [
      makeStatement({ id: "s1", status: "active", review_date: daysAgo(10) }),
      makeStatement({ id: "s2", status: "active", review_date: daysFromNow(30) }),
    ];
    const m = computeStatementMetrics(stmts, [], []);
    expect(m.overdue_reviews).toBe(1);
  });

  it("does not count overdue for non-active statements", () => {
    const stmts = [
      makeStatement({ id: "s1", status: "draft", review_date: daysAgo(10) }),
      makeStatement({ id: "s2", status: "archived", review_date: daysAgo(5) }),
    ];
    const m = computeStatementMetrics(stmts, [], []);
    expect(m.overdue_reviews).toBe(0);
  });

  it("counts multiple overdue reviews", () => {
    const stmts = [
      makeStatement({ id: "s1", status: "active", review_date: daysAgo(10) }),
      makeStatement({ id: "s2", status: "active", review_date: daysAgo(20) }),
      makeStatement({ id: "s3", status: "active", review_date: daysAgo(1) }),
    ];
    const m = computeStatementMetrics(stmts, [], []);
    expect(m.overdue_reviews).toBe(3);
  });

  it("does not count future review_date as overdue", () => {
    const stmts = [
      makeStatement({ id: "s1", status: "active", review_date: daysFromNow(1) }),
    ];
    const m = computeStatementMetrics(stmts, [], []);
    expect(m.overdue_reviews).toBe(0);
  });

  // ── Amendments this year ──────────────────────────────────────────────

  it("counts amendments this year", () => {
    const amendments = [
      makeAmendment({ id: "a1", amendment_date: daysAgo(5) }),
      makeAmendment({ id: "a2", amendment_date: daysAgo(10) }),
    ];
    const m = computeStatementMetrics([], [], amendments);
    expect(m.amendments_this_year).toBe(2);
  });

  it("excludes amendments from last year", () => {
    const lastYear = new Date();
    lastYear.setFullYear(lastYear.getFullYear() - 1);
    lastYear.setMonth(0, 1);
    const amendments = [
      makeAmendment({ id: "a1", amendment_date: lastYear.toISOString().split("T")[0] }),
    ];
    const m = computeStatementMetrics([], [], amendments);
    expect(m.amendments_this_year).toBe(0);
  });

  // ── Reviews this year ─────────────────────────────────────────────────

  it("counts reviews this year", () => {
    const reviews = [
      makeReview({ id: "r1", review_date: daysAgo(5) }),
      makeReview({ id: "r2", review_date: daysAgo(10) }),
    ];
    const m = computeStatementMetrics([], reviews, []);
    expect(m.reviews_this_year).toBe(2);
  });

  it("excludes reviews from previous year", () => {
    const lastYear = new Date();
    lastYear.setFullYear(lastYear.getFullYear() - 1);
    lastYear.setMonth(5, 15);
    const reviews = [
      makeReview({ id: "r1", review_date: lastYear.toISOString().split("T")[0] }),
    ];
    const m = computeStatementMetrics([], reviews, []);
    expect(m.reviews_this_year).toBe(0);
  });

  it("correctly separates current and previous year reviews", () => {
    const lastYear = new Date();
    lastYear.setFullYear(lastYear.getFullYear() - 1);
    lastYear.setMonth(5, 15);
    const reviews = [
      makeReview({ id: "r1", review_date: daysAgo(10) }),
      makeReview({ id: "r2", review_date: lastYear.toISOString().split("T")[0] }),
    ];
    const m = computeStatementMetrics([], reviews, []);
    expect(m.reviews_this_year).toBe(1);
  });

  // ── By amendment type ─────────────────────────────────────────────────

  it("groups amendments by type", () => {
    const amendments = [
      makeAmendment({ id: "a1", amendment_type: "minor_update" }),
      makeAmendment({ id: "a2", amendment_type: "minor_update" }),
      makeAmendment({ id: "a3", amendment_type: "staff_change" }),
    ];
    const m = computeStatementMetrics([], [], amendments);
    expect(m.by_amendment_type["minor_update"]).toBe(2);
    expect(m.by_amendment_type["staff_change"]).toBe(1);
  });

  it("handles single amendment type", () => {
    const amendments = [
      makeAmendment({ id: "a1", amendment_type: "regulatory_change" }),
    ];
    const m = computeStatementMetrics([], [], amendments);
    expect(m.by_amendment_type["regulatory_change"]).toBe(1);
    expect(Object.keys(m.by_amendment_type)).toHaveLength(1);
  });

  it("groups all seven amendment types correctly", () => {
    const types = [
      "minor_update", "major_revision", "annual_review",
      "regulatory_change", "ofsted_recommendation", "staff_change",
      "capacity_change",
    ] as const;
    const amendments = types.map((t, i) =>
      makeAmendment({ id: `a${i}`, amendment_type: t }),
    );
    const m = computeStatementMetrics([], [], amendments);
    for (const t of types) {
      expect(m.by_amendment_type[t]).toBe(1);
    }
  });

  // ── By review outcome ─────────────────────────────────────────────────

  it("groups reviews by outcome", () => {
    const reviews = [
      makeReview({ id: "r1", outcome: "approved_no_changes" }),
      makeReview({ id: "r2", outcome: "approved_no_changes" }),
      makeReview({ id: "r3", outcome: "deferred" }),
    ];
    const m = computeStatementMetrics([], reviews, []);
    expect(m.by_review_outcome["approved_no_changes"]).toBe(2);
    expect(m.by_review_outcome["deferred"]).toBe(1);
  });

  it("handles all four review outcomes", () => {
    const outcomes = [
      "approved_no_changes", "approved_with_amendments",
      "major_revision_required", "deferred",
    ] as const;
    const reviews = outcomes.map((o, i) =>
      makeReview({ id: `r${i}`, outcome: o }),
    );
    const m = computeStatementMetrics([], reviews, []);
    for (const o of outcomes) {
      expect(m.by_review_outcome[o]).toBe(1);
    }
  });

  // ── Sections coverage ─────────────────────────────────────────────────

  it("reports all sections covered for a fully populated active statement", () => {
    const stmts = [makeStatement({ status: "active" })];
    const m = computeStatementMetrics(stmts, [], []);
    // emergency_placement_procedure is null in default, so that should be false
    expect(m.sections_coverage["range_of_needs"]).toBe(true);
    expect(m.sections_coverage["ethos_philosophy"]).toBe(true);
    expect(m.sections_coverage["accommodation"]).toBe(true);
    expect(m.sections_coverage["location"]).toBe(true);
    expect(m.sections_coverage["staffing"]).toBe(true);
    expect(m.sections_coverage["fire_safety"]).toBe(true);
    expect(m.sections_coverage["behaviour_management"]).toBe(true);
    expect(m.sections_coverage["education"]).toBe(true);
    expect(m.sections_coverage["health"]).toBe(true);
    expect(m.sections_coverage["contact"]).toBe(true);
    expect(m.sections_coverage["complaints"]).toBe(true);
    expect(m.sections_coverage["religious_cultural"]).toBe(true);
    expect(m.sections_coverage["emergency_placement"]).toBe(false);
  });

  it("marks sections as false when content is empty string", () => {
    const stmts = [
      makeStatement({
        status: "active",
        range_of_needs: "",
        staffing_structure: "   ",
      }),
    ];
    const m = computeStatementMetrics(stmts, [], []);
    expect(m.sections_coverage["range_of_needs"]).toBe(false);
    expect(m.sections_coverage["staffing"]).toBe(false);
  });

  it("marks emergency_placement true when populated", () => {
    const stmts = [
      makeStatement({
        status: "active",
        emergency_placement_procedure: "Emergency protocol in place",
      }),
    ];
    const m = computeStatementMetrics(stmts, [], []);
    expect(m.sections_coverage["emergency_placement"]).toBe(true);
  });

  it("uses most recent active statement by version for coverage", () => {
    const stmts = [
      makeStatement({
        id: "s1",
        version: "1.0",
        status: "active",
        range_of_needs: "",
      }),
      makeStatement({
        id: "s2",
        version: "2.0",
        status: "active",
        range_of_needs: "Populated in v2",
      }),
    ];
    const m = computeStatementMetrics(stmts, [], []);
    expect(m.sections_coverage["range_of_needs"]).toBe(true);
  });

  it("does not consider draft statements for sections coverage", () => {
    const stmts = [
      makeStatement({
        id: "s1",
        status: "draft",
        range_of_needs: "Populated in draft",
      }),
    ];
    const m = computeStatementMetrics(stmts, [], []);
    expect(m.sections_coverage["range_of_needs"]).toBe(false);
  });

  // ── Average days between reviews ──────────────────────────────────────

  it("returns 0 avg days with fewer than 2 reviews", () => {
    const reviews = [makeReview({ id: "r1" })];
    const m = computeStatementMetrics([], reviews, []);
    expect(m.avg_days_between_reviews).toBe(0);
  });

  it("returns 0 avg days with zero reviews", () => {
    const m = computeStatementMetrics([], [], []);
    expect(m.avg_days_between_reviews).toBe(0);
  });

  it("calculates avg days between two reviews", () => {
    const reviews = [
      makeReview({ id: "r1", review_date: daysAgo(60) }),
      makeReview({ id: "r2", review_date: daysAgo(30) }),
    ];
    const m = computeStatementMetrics([], reviews, []);
    expect(m.avg_days_between_reviews).toBe(30);
  });

  it("calculates avg days between three reviews", () => {
    const reviews = [
      makeReview({ id: "r1", review_date: daysAgo(100) }),
      makeReview({ id: "r2", review_date: daysAgo(50) }),
      makeReview({ id: "r3", review_date: daysAgo(0) }),
    ];
    const m = computeStatementMetrics([], reviews, []);
    expect(m.avg_days_between_reviews).toBe(50);
  });

  it("handles unordered reviews for avg days calculation", () => {
    const reviews = [
      makeReview({ id: "r1", review_date: daysAgo(0) }),
      makeReview({ id: "r2", review_date: daysAgo(90) }),
      makeReview({ id: "r3", review_date: daysAgo(45) }),
    ];
    const m = computeStatementMetrics([], reviews, []);
    // sorted: -90, -45, -0 => gaps 45 and 45 => avg 45
    expect(m.avg_days_between_reviews).toBe(45);
  });

  // ── Latest version ────────────────────────────────────────────────────

  it("returns default 0.0 when no statements", () => {
    const m = computeStatementMetrics([], [], []);
    expect(m.latest_version).toBe("0.0");
  });

  it("finds the highest version string", () => {
    const stmts = [
      makeStatement({ id: "s1", version: "1.0" }),
      makeStatement({ id: "s2", version: "2.0" }),
      makeStatement({ id: "s3", version: "1.5" }),
    ];
    const m = computeStatementMetrics(stmts, [], []);
    expect(m.latest_version).toBe("2.0");
  });

  it("picks latest version from mixed statuses", () => {
    const stmts = [
      makeStatement({ id: "s1", version: "1.0", status: "active" }),
      makeStatement({ id: "s2", version: "3.0", status: "draft" }),
      makeStatement({ id: "s3", version: "2.0", status: "archived" }),
    ];
    const m = computeStatementMetrics(stmts, [], []);
    expect(m.latest_version).toBe("3.0");
  });

  it("handles single statement version", () => {
    const stmts = [makeStatement({ version: "5.2" })];
    const m = computeStatementMetrics(stmts, [], []);
    expect(m.latest_version).toBe("5.2");
  });

  it("handles version comparison as string comparison", () => {
    const stmts = [
      makeStatement({ id: "s1", version: "10.0" }),
      makeStatement({ id: "s2", version: "9.0" }),
    ];
    const m = computeStatementMetrics(stmts, [], []);
    // String comparison: "9.0" > "10.0", so "9.0" wins
    expect(m.latest_version).toBe("9.0");
  });

  it("counts whitespace-only section content as empty", () => {
    const stmts = [
      makeStatement({
        status: "active",
        complaints_procedure: "   \t  ",
      }),
    ];
    const m = computeStatementMetrics(stmts, [], []);
    expect(m.sections_coverage["complaints"]).toBe(false);
  });

  it("counts multiple amendments of same type", () => {
    const amendments = [
      makeAmendment({ id: "a1", amendment_type: "staff_change" }),
      makeAmendment({ id: "a2", amendment_type: "staff_change" }),
      makeAmendment({ id: "a3", amendment_type: "staff_change" }),
    ];
    const m = computeStatementMetrics([], [], amendments);
    expect(m.by_amendment_type["staff_change"]).toBe(3);
  });

  it("handles four equally-spaced reviews for avg days", () => {
    const reviews = [
      makeReview({ id: "r1", review_date: daysAgo(90) }),
      makeReview({ id: "r2", review_date: daysAgo(60) }),
      makeReview({ id: "r3", review_date: daysAgo(30) }),
      makeReview({ id: "r4", review_date: daysAgo(0) }),
    ];
    const m = computeStatementMetrics([], reviews, []);
    expect(m.avg_days_between_reviews).toBe(30);
  });

  it("under_review status does not count as active", () => {
    const stmts = [
      makeStatement({ status: "under_review" }),
    ];
    const m = computeStatementMetrics(stmts, [], []);
    expect(m.active_statements).toBe(0);
  });

  it("superseded status does not count as active", () => {
    const stmts = [
      makeStatement({ status: "superseded" }),
    ];
    const m = computeStatementMetrics(stmts, [], []);
    expect(m.active_statements).toBe(0);
  });

  it("empty by_review_outcome when no reviews", () => {
    const m = computeStatementMetrics([], [], []);
    expect(m.by_review_outcome).toEqual({});
  });

  it("empty by_amendment_type when no amendments", () => {
    const m = computeStatementMetrics([], [], []);
    expect(m.by_amendment_type).toEqual({});
  });

  it("sections_coverage false for all when only draft statements", () => {
    const stmts = [
      makeStatement({ id: "s1", status: "draft" }),
      makeStatement({ id: "s2", status: "archived" }),
    ];
    const m = computeStatementMetrics(stmts, [], []);
    for (const sec of SCHEDULE_SECTIONS) {
      expect(m.sections_coverage[sec.section]).toBe(false);
    }
  });

  it("reviews_this_year counts only current calendar year", () => {
    const janFirst = new Date(new Date().getFullYear(), 0, 2).toISOString().split("T")[0];
    const reviews = [
      makeReview({ id: "r1", review_date: janFirst }),
      makeReview({ id: "r2", review_date: daysAgo(5) }),
    ];
    const m = computeStatementMetrics([], reviews, []);
    expect(m.reviews_this_year).toBe(2);
  });

  it("amendments_this_year counts only current calendar year", () => {
    const janFirst = new Date(new Date().getFullYear(), 0, 2).toISOString().split("T")[0];
    const amendments = [
      makeAmendment({ id: "a1", amendment_date: janFirst }),
      makeAmendment({ id: "a2", amendment_date: daysAgo(3) }),
    ];
    const m = computeStatementMetrics([], [], amendments);
    expect(m.amendments_this_year).toBe(2);
  });

  it("return type has exactly 9 keys", () => {
    const m = computeStatementMetrics([], [], []);
    expect(Object.keys(m)).toHaveLength(9);
  });

  it("sections_coverage has exactly 13 keys", () => {
    const m = computeStatementMetrics([], [], []);
    expect(Object.keys(m.sections_coverage)).toHaveLength(13);
  });

  // ── Combined metrics ──────────────────────────────────────────────────

  it("computes combined metrics across all inputs", () => {
    const stmts = [
      makeStatement({ id: "s1", status: "active", version: "2.0", review_date: daysAgo(5) }),
      makeStatement({ id: "s2", status: "draft", version: "3.0" }),
    ];
    const reviews = [
      makeReview({ id: "r1", outcome: "approved_no_changes", review_date: daysAgo(10) }),
    ];
    const amendments = [
      makeAmendment({ id: "a1", amendment_type: "staff_change", amendment_date: daysAgo(5) }),
    ];
    const m = computeStatementMetrics(stmts, reviews, amendments);
    expect(m.active_statements).toBe(1);
    expect(m.overdue_reviews).toBe(1);
    expect(m.amendments_this_year).toBe(1);
    expect(m.reviews_this_year).toBe(1);
    expect(m.latest_version).toBe("3.0");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// identifyStatementAlerts
// ═══════════════════════════════════════════════════════════════════════════

describe("identifyStatementAlerts", () => {
  const now = new Date(new Date().toISOString().split("T")[0]);

  it("returns empty array when no data", () => {
    const alerts = identifyStatementAlerts([], [], [], now);
    expect(alerts).toHaveLength(0);
  });

  it("returns empty array for a healthy active statement with recent review", () => {
    const stmts = [
      makeStatement({
        status: "active",
        review_date: daysFromNow(30),
        approved_by: "manager-1",
      }),
    ];
    const reviews = [
      makeReview({ statement_id: "stmt-1", review_date: daysAgo(30) }),
    ];
    const alerts = identifyStatementAlerts(stmts, reviews, [], now);
    expect(alerts).toHaveLength(0);
  });

  // ── Review overdue (critical) ─────────────────────────────────────────

  it("raises critical alert when review_date is past for active statement", () => {
    const stmts = [
      makeStatement({
        status: "active",
        review_date: daysAgo(15),
        approved_by: "manager-1",
      }),
    ];
    const reviews = [
      makeReview({ statement_id: "stmt-1", review_date: daysAgo(5) }),
    ];
    const alerts = identifyStatementAlerts(stmts, reviews, [], now);
    const overdue = alerts.filter((a) => a.category === "review_overdue");
    expect(overdue).toHaveLength(1);
    expect(overdue[0].severity).toBe("critical");
    expect(overdue[0].related_type).toBe("statement");
    expect(overdue[0].message).toContain("overdue");
    expect(overdue[0].message).toContain("Reg 28");
  });

  it("does not raise review overdue for draft statements", () => {
    const stmts = [
      makeStatement({ status: "draft", review_date: daysAgo(30) }),
    ];
    const alerts = identifyStatementAlerts(stmts, [], [], now);
    const overdue = alerts.filter((a) => a.category === "review_overdue");
    expect(overdue).toHaveLength(0);
  });

  it("includes days overdue in the review overdue message", () => {
    const stmts = [
      makeStatement({
        status: "active",
        review_date: daysAgo(45),
        approved_by: "manager-1",
      }),
    ];
    const reviews = [
      makeReview({ statement_id: "stmt-1", review_date: daysAgo(5) }),
    ];
    const alerts = identifyStatementAlerts(stmts, reviews, [], now);
    const overdue = alerts.find((a) => a.category === "review_overdue");
    expect(overdue).toBeDefined();
    expect(overdue!.message).toContain("45");
  });

  it("does not raise review overdue when review_date is in the future", () => {
    const stmts = [
      makeStatement({
        status: "active",
        review_date: daysFromNow(60),
        approved_by: "manager-1",
      }),
    ];
    const reviews = [
      makeReview({ statement_id: "stmt-1", review_date: daysAgo(5) }),
    ];
    const alerts = identifyStatementAlerts(stmts, reviews, [], now);
    const overdue = alerts.filter((a) => a.category === "review_overdue");
    expect(overdue).toHaveLength(0);
  });

  // ── No approval (high) ────────────────────────────────────────────────

  it("raises high alert when active statement has no approved_by", () => {
    const stmts = [
      makeStatement({
        status: "active",
        approved_by: null,
        review_date: daysFromNow(30),
      }),
    ];
    const reviews = [
      makeReview({ statement_id: "stmt-1", review_date: daysAgo(5) }),
    ];
    const alerts = identifyStatementAlerts(stmts, reviews, [], now);
    const noApproval = alerts.filter((a) => a.category === "no_approval");
    expect(noApproval).toHaveLength(1);
    expect(noApproval[0].severity).toBe("high");
    expect(noApproval[0].message).toContain("no recorded approval");
  });

  it("does not raise no_approval for draft statements", () => {
    const stmts = [
      makeStatement({ status: "draft", approved_by: null }),
    ];
    const alerts = identifyStatementAlerts(stmts, [], [], now);
    const noApproval = alerts.filter((a) => a.category === "no_approval");
    expect(noApproval).toHaveLength(0);
  });

  it("does not raise no_approval when approved_by is present", () => {
    const stmts = [
      makeStatement({
        status: "active",
        approved_by: "manager-1",
        review_date: daysFromNow(30),
      }),
    ];
    const reviews = [
      makeReview({ statement_id: "stmt-1", review_date: daysAgo(5) }),
    ];
    const alerts = identifyStatementAlerts(stmts, reviews, [], now);
    const noApproval = alerts.filter((a) => a.category === "no_approval");
    expect(noApproval).toHaveLength(0);
  });

  // ── Ofsted not notified (critical) ────────────────────────────────────

  it("raises critical alert when major amendment not notified to Ofsted", () => {
    const amendments = [
      makeAmendment({
        amendment_type: "major_revision",
        ofsted_notified: false,
        approved_by: "manager-1",
      }),
    ];
    const alerts = identifyStatementAlerts([], [], amendments, now);
    const ofsted = alerts.filter((a) => a.category === "ofsted_not_notified");
    expect(ofsted).toHaveLength(1);
    expect(ofsted[0].severity).toBe("critical");
    expect(ofsted[0].message).toContain("Reg 31");
    expect(ofsted[0].related_type).toBe("amendment");
  });

  it("raises alert for regulatory_change not notified", () => {
    const amendments = [
      makeAmendment({
        id: "a1",
        amendment_type: "regulatory_change",
        ofsted_notified: false,
        approved_by: "manager-1",
      }),
    ];
    const alerts = identifyStatementAlerts([], [], amendments, now);
    const ofsted = alerts.filter((a) => a.category === "ofsted_not_notified");
    expect(ofsted).toHaveLength(1);
    expect(ofsted[0].message).toContain("Regulatory Change");
  });

  it("raises alert for ofsted_recommendation not notified", () => {
    const amendments = [
      makeAmendment({
        id: "a1",
        amendment_type: "ofsted_recommendation",
        ofsted_notified: false,
        approved_by: "manager-1",
      }),
    ];
    const alerts = identifyStatementAlerts([], [], amendments, now);
    const ofsted = alerts.filter((a) => a.category === "ofsted_not_notified");
    expect(ofsted).toHaveLength(1);
    expect(ofsted[0].message).toContain("Ofsted Recommendation");
  });

  it("raises alert for capacity_change not notified", () => {
    const amendments = [
      makeAmendment({
        id: "a1",
        amendment_type: "capacity_change",
        ofsted_notified: false,
        approved_by: "manager-1",
      }),
    ];
    const alerts = identifyStatementAlerts([], [], amendments, now);
    const ofsted = alerts.filter((a) => a.category === "ofsted_not_notified");
    expect(ofsted).toHaveLength(1);
    expect(ofsted[0].message).toContain("Capacity Change");
  });

  it("does not raise ofsted alert for minor_update", () => {
    const amendments = [
      makeAmendment({
        amendment_type: "minor_update",
        ofsted_notified: false,
        approved_by: "manager-1",
      }),
    ];
    const alerts = identifyStatementAlerts([], [], amendments, now);
    const ofsted = alerts.filter((a) => a.category === "ofsted_not_notified");
    expect(ofsted).toHaveLength(0);
  });

  it("does not raise ofsted alert for staff_change", () => {
    const amendments = [
      makeAmendment({
        amendment_type: "staff_change",
        ofsted_notified: false,
        approved_by: "manager-1",
      }),
    ];
    const alerts = identifyStatementAlerts([], [], amendments, now);
    const ofsted = alerts.filter((a) => a.category === "ofsted_not_notified");
    expect(ofsted).toHaveLength(0);
  });

  it("does not raise ofsted alert for annual_review", () => {
    const amendments = [
      makeAmendment({
        amendment_type: "annual_review",
        ofsted_notified: false,
        approved_by: "manager-1",
      }),
    ];
    const alerts = identifyStatementAlerts([], [], amendments, now);
    const ofsted = alerts.filter((a) => a.category === "ofsted_not_notified");
    expect(ofsted).toHaveLength(0);
  });

  it("does not raise ofsted alert when already notified", () => {
    const amendments = [
      makeAmendment({
        amendment_type: "major_revision",
        ofsted_notified: true,
        approved_by: "manager-1",
      }),
    ];
    const alerts = identifyStatementAlerts([], [], amendments, now);
    const ofsted = alerts.filter((a) => a.category === "ofsted_not_notified");
    expect(ofsted).toHaveLength(0);
  });

  // ── Sections incomplete (high) ────────────────────────────────────────

  it("raises high alert when active statement has empty required sections", () => {
    const stmts = [
      makeStatement({
        status: "active",
        range_of_needs: "",
        staffing_structure: "",
        approved_by: "manager-1",
        review_date: daysFromNow(30),
      }),
    ];
    const reviews = [
      makeReview({ statement_id: "stmt-1", review_date: daysAgo(5) }),
    ];
    const alerts = identifyStatementAlerts(stmts, reviews, [], now);
    const incomplete = alerts.filter((a) => a.category === "sections_incomplete");
    expect(incomplete).toHaveLength(1);
    expect(incomplete[0].severity).toBe("high");
    expect(incomplete[0].message).toContain("2 incomplete");
    expect(incomplete[0].message).toContain("Schedule 1");
  });

  it("does not raise sections_incomplete for draft statements", () => {
    const stmts = [
      makeStatement({
        status: "draft",
        range_of_needs: "",
        staffing_structure: "",
      }),
    ];
    const alerts = identifyStatementAlerts(stmts, [], [], now);
    const incomplete = alerts.filter((a) => a.category === "sections_incomplete");
    expect(incomplete).toHaveLength(0);
  });

  it("skips emergency_placement from required sections check", () => {
    // emergency_placement_procedure is null in default but should not trigger incomplete
    const stmts = [
      makeStatement({
        status: "active",
        emergency_placement_procedure: null,
        approved_by: "manager-1",
        review_date: daysFromNow(30),
      }),
    ];
    const reviews = [
      makeReview({ statement_id: "stmt-1", review_date: daysAgo(5) }),
    ];
    const alerts = identifyStatementAlerts(stmts, reviews, [], now);
    const incomplete = alerts.filter((a) => a.category === "sections_incomplete");
    expect(incomplete).toHaveLength(0);
  });

  it("lists section labels in the incomplete alert message", () => {
    const stmts = [
      makeStatement({
        status: "active",
        health_arrangements: "",
        contact_arrangements: "   ",
        approved_by: "manager-1",
        review_date: daysFromNow(30),
      }),
    ];
    const reviews = [
      makeReview({ statement_id: "stmt-1", review_date: daysAgo(5) }),
    ];
    const alerts = identifyStatementAlerts(stmts, reviews, [], now);
    const incomplete = alerts.find((a) => a.category === "sections_incomplete");
    expect(incomplete).toBeDefined();
    expect(incomplete!.message).toContain("Health Arrangements");
    expect(incomplete!.message).toContain("Contact Arrangements");
  });

  it("no sections_incomplete when all required sections populated", () => {
    const stmts = [
      makeStatement({
        status: "active",
        approved_by: "manager-1",
        review_date: daysFromNow(30),
      }),
    ];
    const reviews = [
      makeReview({ statement_id: "stmt-1", review_date: daysAgo(5) }),
    ];
    const alerts = identifyStatementAlerts(stmts, reviews, [], now);
    const incomplete = alerts.filter((a) => a.category === "sections_incomplete");
    expect(incomplete).toHaveLength(0);
  });

  // ── No review in 12 months (high) ─────────────────────────────────────

  it("raises alert when active statement effective >12 months ago with no reviews", () => {
    const stmts = [
      makeStatement({
        status: "active",
        effective_date: daysAgo(400),
        approved_by: "manager-1",
        review_date: daysFromNow(30),
      }),
    ];
    const alerts = identifyStatementAlerts(stmts, [], [], now);
    const noReview = alerts.filter((a) => a.category === "no_review_in_12_months");
    expect(noReview).toHaveLength(1);
    expect(noReview[0].severity).toBe("high");
    expect(noReview[0].message).toContain("no review records");
    expect(noReview[0].message).toContain("Reg 28");
  });

  it("does not raise no_review_in_12_months when effective date is recent", () => {
    const stmts = [
      makeStatement({
        status: "active",
        effective_date: daysAgo(60),
        approved_by: "manager-1",
        review_date: daysFromNow(30),
      }),
    ];
    const alerts = identifyStatementAlerts(stmts, [], [], now);
    const noReview = alerts.filter((a) => a.category === "no_review_in_12_months");
    expect(noReview).toHaveLength(0);
  });

  it("raises alert when last review was over 12 months ago", () => {
    const stmts = [
      makeStatement({
        id: "stmt-1",
        status: "active",
        effective_date: daysAgo(500),
        approved_by: "manager-1",
        review_date: daysFromNow(30),
      }),
    ];
    const reviews = [
      makeReview({
        statement_id: "stmt-1",
        review_date: daysAgo(400),
      }),
    ];
    const alerts = identifyStatementAlerts(stmts, reviews, [], now);
    const noReview = alerts.filter((a) => a.category === "no_review_in_12_months");
    expect(noReview).toHaveLength(1);
    expect(noReview[0].message).toContain("months");
  });

  it("does not raise no_review alert when review within 12 months", () => {
    const stmts = [
      makeStatement({
        id: "stmt-1",
        status: "active",
        effective_date: daysAgo(500),
        approved_by: "manager-1",
        review_date: daysFromNow(30),
      }),
    ];
    const reviews = [
      makeReview({
        statement_id: "stmt-1",
        review_date: daysAgo(100),
      }),
    ];
    const alerts = identifyStatementAlerts(stmts, reviews, [], now);
    const noReview = alerts.filter((a) => a.category === "no_review_in_12_months");
    expect(noReview).toHaveLength(0);
  });

  it("uses most recent review date for 12-month check", () => {
    const stmts = [
      makeStatement({
        id: "stmt-1",
        status: "active",
        effective_date: daysAgo(800),
        approved_by: "manager-1",
        review_date: daysFromNow(30),
      }),
    ];
    const reviews = [
      makeReview({
        id: "r1",
        statement_id: "stmt-1",
        review_date: daysAgo(500),
      }),
      makeReview({
        id: "r2",
        statement_id: "stmt-1",
        review_date: daysAgo(60),
      }),
    ];
    const alerts = identifyStatementAlerts(stmts, reviews, [], now);
    const noReview = alerts.filter((a) => a.category === "no_review_in_12_months");
    expect(noReview).toHaveLength(0);
  });

  it("does not raise no_review_in_12_months for non-active statements", () => {
    const stmts = [
      makeStatement({
        status: "archived",
        effective_date: daysAgo(500),
      }),
    ];
    const alerts = identifyStatementAlerts(stmts, [], [], now);
    const noReview = alerts.filter((a) => a.category === "no_review_in_12_months");
    expect(noReview).toHaveLength(0);
  });

  // ── Draft stale (medium) ──────────────────────────────────────────────

  it("raises medium alert when draft is older than 30 days", () => {
    const stmts = [
      makeStatement({
        status: "draft",
        created_at: daysAgo(45),
      }),
    ];
    const alerts = identifyStatementAlerts(stmts, [], [], now);
    const stale = alerts.filter((a) => a.category === "draft_stale");
    expect(stale).toHaveLength(1);
    expect(stale[0].severity).toBe("medium");
    expect(stale[0].message).toContain("draft");
    expect(stale[0].message).toContain("45");
  });

  it("does not raise draft_stale for recently created drafts", () => {
    const stmts = [
      makeStatement({
        status: "draft",
        created_at: daysAgoISO(10),
      }),
    ];
    const alerts = identifyStatementAlerts(stmts, [], [], now);
    const stale = alerts.filter((a) => a.category === "draft_stale");
    expect(stale).toHaveLength(0);
  });

  it("does not raise draft_stale for active statements", () => {
    const stmts = [
      makeStatement({
        status: "active",
        created_at: daysAgoISO(90),
        approved_by: "manager-1",
        review_date: daysFromNow(30),
      }),
    ];
    const reviews = [
      makeReview({ statement_id: "stmt-1", review_date: daysAgo(5) }),
    ];
    const alerts = identifyStatementAlerts(stmts, reviews, [], now);
    const stale = alerts.filter((a) => a.category === "draft_stale");
    expect(stale).toHaveLength(0);
  });

  it("includes days in draft in the message", () => {
    const stmts = [
      makeStatement({
        status: "draft",
        created_at: daysAgo(60),
      }),
    ];
    const alerts = identifyStatementAlerts(stmts, [], [], now);
    const stale = alerts.find((a) => a.category === "draft_stale");
    expect(stale).toBeDefined();
    expect(stale!.message).toContain("60");
  });

  // ── Amendment not approved (medium) ───────────────────────────────────

  it("raises medium alert when amendment has no approved_by", () => {
    const amendments = [
      makeAmendment({
        approved_by: null,
        amendment_type: "minor_update",
      }),
    ];
    const alerts = identifyStatementAlerts([], [], amendments, now);
    const notApproved = alerts.filter((a) => a.category === "amendment_not_approved");
    expect(notApproved).toHaveLength(1);
    expect(notApproved[0].severity).toBe("medium");
    expect(notApproved[0].related_type).toBe("amendment");
  });

  it("does not raise amendment_not_approved when approved_by is set", () => {
    const amendments = [
      makeAmendment({ approved_by: "manager-1" }),
    ];
    const alerts = identifyStatementAlerts([], [], amendments, now);
    const notApproved = alerts.filter((a) => a.category === "amendment_not_approved");
    expect(notApproved).toHaveLength(0);
  });

  it("includes section label in amendment_not_approved message", () => {
    const amendments = [
      makeAmendment({
        approved_by: null,
        section_amended: "health",
        amendment_type: "minor_update",
      }),
    ];
    const alerts = identifyStatementAlerts([], [], amendments, now);
    const notApproved = alerts.find((a) => a.category === "amendment_not_approved");
    expect(notApproved).toBeDefined();
    expect(notApproved!.message).toContain("Health Arrangements");
  });

  it("raises multiple amendment_not_approved alerts", () => {
    const amendments = [
      makeAmendment({ id: "a1", approved_by: null, section_amended: "health" }),
      makeAmendment({ id: "a2", approved_by: null, section_amended: "staffing" }),
      makeAmendment({ id: "a3", approved_by: "manager-1" }),
    ];
    const alerts = identifyStatementAlerts([], [], amendments, now);
    const notApproved = alerts.filter((a) => a.category === "amendment_not_approved");
    expect(notApproved).toHaveLength(2);
  });

  // ── Sorting ───────────────────────────────────────────────────────────

  it("sorts alerts by severity: critical first, then high, then medium", () => {
    const stmts = [
      makeStatement({
        id: "stmt-1",
        status: "active",
        review_date: daysAgo(10),
        approved_by: null,
        range_of_needs: "",
      }),
    ];
    const amendments = [
      makeAmendment({
        amendment_type: "major_revision",
        ofsted_notified: false,
        approved_by: null,
      }),
    ];
    const alerts = identifyStatementAlerts(stmts, [], amendments, now);
    expect(alerts.length).toBeGreaterThan(0);

    const severities = alerts.map((a) => a.severity);
    const criticalIdx = severities.indexOf("critical");
    const highIdx = severities.indexOf("high");
    const mediumIdx = severities.indexOf("medium");

    if (criticalIdx !== -1 && highIdx !== -1) {
      expect(criticalIdx).toBeLessThan(highIdx);
    }
    if (highIdx !== -1 && mediumIdx !== -1) {
      expect(highIdx).toBeLessThan(mediumIdx);
    }
  });

  // ── Combined alerts ───────────────────────────────────────────────────

  it("raises multiple alert types for a problematic statement", () => {
    const stmts = [
      makeStatement({
        id: "stmt-1",
        status: "active",
        version: "1.0",
        review_date: daysAgo(20),
        approved_by: null,
        range_of_needs: "",
        effective_date: daysAgo(400),
      }),
    ];
    const alerts = identifyStatementAlerts(stmts, [], [], now);
    const categories = alerts.map((a) => a.category);
    expect(categories).toContain("review_overdue");
    expect(categories).toContain("no_approval");
    expect(categories).toContain("sections_incomplete");
    expect(categories).toContain("no_review_in_12_months");
  });

  it("raises both statement and amendment alerts together", () => {
    const stmts = [
      makeStatement({
        id: "stmt-1",
        status: "active",
        review_date: daysAgo(5),
        approved_by: "manager-1",
      }),
    ];
    const reviews = [
      makeReview({ statement_id: "stmt-1", review_date: daysAgo(10) }),
    ];
    const amendments = [
      makeAmendment({
        id: "a1",
        amendment_type: "major_revision",
        ofsted_notified: false,
        approved_by: null,
      }),
    ];
    const alerts = identifyStatementAlerts(stmts, reviews, amendments, now);
    const categories = alerts.map((a) => a.category);
    expect(categories).toContain("review_overdue");
    expect(categories).toContain("ofsted_not_notified");
    expect(categories).toContain("amendment_not_approved");
  });

  it("all alerts include a related_id", () => {
    const stmts = [
      makeStatement({
        id: "stmt-1",
        status: "active",
        review_date: daysAgo(5),
        approved_by: null,
        effective_date: daysAgo(400),
        range_of_needs: "",
      }),
    ];
    const amendments = [
      makeAmendment({
        id: "a1",
        amendment_type: "major_revision",
        ofsted_notified: false,
        approved_by: null,
      }),
    ];
    const alerts = identifyStatementAlerts(stmts, [], amendments, now);
    for (const alert of alerts) {
      expect(alert.related_id).toBeTruthy();
    }
  });

  it("all alerts include valid related_type", () => {
    const stmts = [
      makeStatement({
        id: "stmt-1",
        status: "active",
        review_date: daysAgo(5),
        approved_by: null,
      }),
    ];
    const amendments = [
      makeAmendment({
        id: "a1",
        amendment_type: "capacity_change",
        ofsted_notified: false,
        approved_by: null,
      }),
    ];
    const alerts = identifyStatementAlerts(stmts, [], amendments, now);
    for (const alert of alerts) {
      expect(["statement", "review", "amendment"]).toContain(alert.related_type);
    }
  });

  it("version number appears in statement-related alert messages", () => {
    const stmts = [
      makeStatement({
        id: "stmt-1",
        version: "4.2",
        status: "active",
        review_date: daysAgo(10),
        approved_by: "manager-1",
      }),
    ];
    const reviews = [
      makeReview({ statement_id: "stmt-1", review_date: daysAgo(5) }),
    ];
    const alerts = identifyStatementAlerts(stmts, reviews, [], now);
    const overdue = alerts.find((a) => a.category === "review_overdue");
    expect(overdue).toBeDefined();
    expect(overdue!.message).toContain("v4.2");
  });

  it("handles multiple statements with different alert combinations", () => {
    const stmts = [
      makeStatement({
        id: "stmt-1",
        version: "1.0",
        status: "active",
        review_date: daysAgo(10),
        approved_by: "manager-1",
        effective_date: daysAgo(400),
      }),
      makeStatement({
        id: "stmt-2",
        version: "2.0",
        status: "draft",
        created_at: daysAgoISO(60),
      }),
    ];
    const alerts = identifyStatementAlerts(stmts, [], [], now);
    const categories = alerts.map((a) => a.category);
    expect(categories).toContain("review_overdue");
    expect(categories).toContain("no_review_in_12_months");
    expect(categories).toContain("draft_stale");
  });

  it("no false alerts for superseded statements", () => {
    const stmts = [
      makeStatement({
        status: "superseded",
        review_date: daysAgo(100),
        approved_by: null,
        range_of_needs: "",
      }),
    ];
    const alerts = identifyStatementAlerts(stmts, [], [], now);
    expect(alerts).toHaveLength(0);
  });

  it("no false alerts for archived statements", () => {
    const stmts = [
      makeStatement({
        status: "archived",
        review_date: daysAgo(200),
        approved_by: null,
        range_of_needs: "",
      }),
    ];
    const alerts = identifyStatementAlerts(stmts, [], [], now);
    expect(alerts).toHaveLength(0);
  });

  it("no false alerts for under_review statements", () => {
    const stmts = [
      makeStatement({
        status: "under_review",
        review_date: daysAgo(100),
        approved_by: null,
        range_of_needs: "",
      }),
    ];
    const alerts = identifyStatementAlerts(stmts, [], [], now);
    expect(alerts).toHaveLength(0);
  });

  it("multiple major amendments all raise ofsted_not_notified alerts", () => {
    const amendments = [
      makeAmendment({
        id: "a1",
        amendment_type: "major_revision",
        ofsted_notified: false,
        approved_by: "mgr-1",
      }),
      makeAmendment({
        id: "a2",
        amendment_type: "capacity_change",
        ofsted_notified: false,
        approved_by: "mgr-1",
      }),
    ];
    const alerts = identifyStatementAlerts([], [], amendments, now);
    const ofsted = alerts.filter((a) => a.category === "ofsted_not_notified");
    expect(ofsted).toHaveLength(2);
  });

  it("amendment with both ofsted_not_notified and not_approved raises two alerts", () => {
    const amendments = [
      makeAmendment({
        id: "a1",
        amendment_type: "major_revision",
        ofsted_notified: false,
        approved_by: null,
      }),
    ];
    const alerts = identifyStatementAlerts([], [], amendments, now);
    const categories = alerts.map((a) => a.category);
    expect(categories).toContain("ofsted_not_notified");
    expect(categories).toContain("amendment_not_approved");
  });

  it("draft created exactly 30 days ago does not raise stale alert", () => {
    // 30 days is the boundary; the code checks > thirtyDaysMs
    // Since daysAgoISO(30) may be right at the boundary, use 29 to be safe
    const stmts = [
      makeStatement({
        status: "draft",
        created_at: daysAgoISO(29),
      }),
    ];
    const alerts = identifyStatementAlerts(stmts, [], [], now);
    const stale = alerts.filter((a) => a.category === "draft_stale");
    expect(stale).toHaveLength(0);
  });

  it("draft created 31 days ago raises stale alert", () => {
    const stmts = [
      makeStatement({
        status: "draft",
        created_at: daysAgoISO(31),
      }),
    ];
    const alerts = identifyStatementAlerts(stmts, [], [], now);
    const stale = alerts.filter((a) => a.category === "draft_stale");
    expect(stale).toHaveLength(1);
  });

  it("uses the provided now parameter for all date comparisons", () => {
    const customNow = new Date("2025-06-01T00:00:00.000Z");
    const stmts = [
      makeStatement({
        id: "stmt-1",
        status: "active",
        review_date: "2025-05-01",
        approved_by: "manager-1",
        effective_date: "2024-01-01",
      }),
    ];
    const reviews = [
      makeReview({
        statement_id: "stmt-1",
        review_date: "2024-05-01",
      }),
    ];
    const alerts = identifyStatementAlerts(stmts, reviews, [], customNow);
    const overdue = alerts.filter((a) => a.category === "review_overdue");
    expect(overdue).toHaveLength(1);
    const noReview = alerts.filter((a) => a.category === "no_review_in_12_months");
    expect(noReview).toHaveLength(1);
  });

  it("amendment_not_approved includes the amendment date in message", () => {
    const amendments = [
      makeAmendment({
        approved_by: null,
        amendment_date: "2025-03-15",
        section_amended: "education",
        amendment_type: "minor_update",
      }),
    ];
    const alerts = identifyStatementAlerts([], [], amendments, now);
    const notApproved = alerts.find((a) => a.category === "amendment_not_approved");
    expect(notApproved).toBeDefined();
    expect(notApproved!.message).toContain("2025-03-15");
  });

  it("ofsted_not_notified message mentions 28 days", () => {
    const amendments = [
      makeAmendment({
        amendment_type: "regulatory_change",
        ofsted_notified: false,
        approved_by: "mgr-1",
      }),
    ];
    const alerts = identifyStatementAlerts([], [], amendments, now);
    const ofsted = alerts.find((a) => a.category === "ofsted_not_notified");
    expect(ofsted).toBeDefined();
    expect(ofsted!.message).toContain("28 days");
  });

  it("sections_incomplete counts whitespace-only as incomplete", () => {
    const stmts = [
      makeStatement({
        status: "active",
        education_provision: "   \t  \n  ",
        approved_by: "mgr",
        review_date: daysFromNow(30),
      }),
    ];
    const reviews = [
      makeReview({ statement_id: "stmt-1", review_date: daysAgo(5) }),
    ];
    const alerts = identifyStatementAlerts(stmts, reviews, [], now);
    const incomplete = alerts.find((a) => a.category === "sections_incomplete");
    expect(incomplete).toBeDefined();
    expect(incomplete!.message).toContain("Education Provision");
  });

  it("reviews for different statements do not cross-contaminate 12-month check", () => {
    const stmts = [
      makeStatement({
        id: "stmt-1",
        status: "active",
        effective_date: daysAgo(400),
        approved_by: "mgr",
        review_date: daysFromNow(30),
      }),
      makeStatement({
        id: "stmt-2",
        status: "active",
        effective_date: daysAgo(400),
        approved_by: "mgr",
        review_date: daysFromNow(30),
      }),
    ];
    // Only stmt-2 has a recent review; stmt-1 should still get the alert
    const reviews = [
      makeReview({
        id: "r1",
        statement_id: "stmt-2",
        review_date: daysAgo(30),
      }),
    ];
    const alerts = identifyStatementAlerts(stmts, reviews, [], now);
    const noReview = alerts.filter((a) => a.category === "no_review_in_12_months");
    expect(noReview).toHaveLength(1);
    expect(noReview[0].related_id).toBe("stmt-1");
  });

  it("no_review_in_12_months message for no-reviews case includes effective_date", () => {
    const stmts = [
      makeStatement({
        id: "stmt-1",
        status: "active",
        effective_date: "2024-01-15",
        approved_by: "mgr",
        review_date: daysFromNow(30),
      }),
    ];
    const alerts = identifyStatementAlerts(stmts, [], [], now);
    const noReview = alerts.find((a) => a.category === "no_review_in_12_months");
    expect(noReview).toBeDefined();
    expect(noReview!.message).toContain("2024-01-15");
  });

  it("all critical alerts precede all high alerts", () => {
    const stmts = [
      makeStatement({
        id: "stmt-1",
        status: "active",
        review_date: daysAgo(10),
        approved_by: null,
        effective_date: daysAgo(400),
      }),
    ];
    const amendments = [
      makeAmendment({
        id: "a1",
        amendment_type: "major_revision",
        ofsted_notified: false,
        approved_by: null,
      }),
    ];
    const alerts = identifyStatementAlerts(stmts, [], amendments, now);
    let seenHigh = false;
    for (const a of alerts) {
      if (a.severity === "high") seenHigh = true;
      if (a.severity === "critical" && seenHigh) {
        throw new Error("Critical alert found after high alert — sort is wrong");
      }
    }
  });

  it("all high alerts precede all medium alerts", () => {
    const stmts = [
      makeStatement({
        id: "stmt-1",
        status: "active",
        approved_by: null,
        review_date: daysFromNow(30),
      }),
    ];
    const reviews = [
      makeReview({ statement_id: "stmt-1", review_date: daysAgo(5) }),
    ];
    const amendments = [
      makeAmendment({ id: "a1", approved_by: null }),
    ];
    const alerts = identifyStatementAlerts(stmts, reviews, amendments, now);
    let seenMedium = false;
    for (const a of alerts) {
      if (a.severity === "medium") seenMedium = true;
      if (a.severity === "high" && seenMedium) {
        throw new Error("High alert found after medium alert — sort is wrong");
      }
    }
  });

  it("empty statements with amendments still processes amendment alerts", () => {
    const amendments = [
      makeAmendment({
        id: "a1",
        amendment_type: "capacity_change",
        ofsted_notified: false,
        approved_by: null,
      }),
    ];
    const alerts = identifyStatementAlerts([], [], amendments, now);
    expect(alerts.length).toBeGreaterThanOrEqual(2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// CRUD FALLBACK (Supabase disabled)
// ═══════════════════════════════════════════════════════════════════════════

describe("CRUD fallback — Supabase disabled", () => {
  // ── listStatements ────────────────────────────────────────────────────

  it("listStatements returns ok with empty array", async () => {
    const result = await listStatements("home-1");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toEqual([]);
  });

  it("listStatements with status filter returns ok with empty array", async () => {
    const result = await listStatements("home-1", { status: "active" });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toEqual([]);
  });

  it("listStatements with limit filter returns ok with empty array", async () => {
    const result = await listStatements("home-1", { limit: 10 });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toEqual([]);
  });

  it("listStatements with all filters returns ok with empty array", async () => {
    const result = await listStatements("home-1", { status: "draft", limit: 5 });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toEqual([]);
  });

  // ── createStatement ───────────────────────────────────────────────────

  it("createStatement returns error when Supabase disabled", async () => {
    const result = await createStatement({
      homeId: "home-1",
      version: "1.0",
      title: "Test SoP",
      reviewDate: daysFromNow(365),
      registeredManager: "Test Manager",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("Supabase not configured");
  });

  it("createStatement with all fields returns error", async () => {
    const result = await createStatement({
      homeId: "home-1",
      version: "2.0",
      title: "Full SoP",
      effectiveDate: daysAgo(0),
      reviewDate: daysFromNow(365),
      rangeOfNeeds: "Children aged 8-17",
      ethosAndPhilosophy: "Trauma-informed",
      accommodationDetails: "5-bed house",
      locationDetails: "Town centre",
      staffingStructure: "Full team",
      fireSafetyArrangements: "Annual checks",
      behaviourManagementApproach: "Restorative",
      educationProvision: "On-site and school",
      healthArrangements: "GP registered",
      contactArrangements: "Weekly family contact",
      complaintsProcedure: "Written procedure",
      religiousCulturalNeeds: "All faiths",
      emergencyPlacementProcedure: "Emergency protocol",
      registeredManager: "Test Manager",
      responsibleIndividual: "RI Name",
      notes: "Test notes",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("Supabase not configured");
  });

  // ── updateStatement ───────────────────────────────────────────────────

  it("updateStatement returns error when Supabase disabled", async () => {
    const result = await updateStatement("stmt-1", { status: "active" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("Supabase not configured");
  });

  it("updateStatement with multiple fields returns error", async () => {
    const result = await updateStatement("stmt-1", {
      status: "active",
      approved_by: "manager-1",
      review_date: daysFromNow(365),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("Supabase not configured");
  });

  // ── listReviews ───────────────────────────────────────────────────────

  it("listReviews returns ok with empty array", async () => {
    const result = await listReviews("home-1");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toEqual([]);
  });

  it("listReviews with statementId filter returns ok with empty array", async () => {
    const result = await listReviews("home-1", { statementId: "stmt-1" });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toEqual([]);
  });

  it("listReviews with outcome filter returns ok with empty array", async () => {
    const result = await listReviews("home-1", { outcome: "approved_no_changes" });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toEqual([]);
  });

  it("listReviews with all filters returns ok with empty array", async () => {
    const result = await listReviews("home-1", {
      statementId: "stmt-1",
      outcome: "deferred",
      limit: 20,
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toEqual([]);
  });

  // ── createReview ──────────────────────────────────────────────────────

  it("createReview returns error when Supabase disabled", async () => {
    const result = await createReview({
      homeId: "home-1",
      statementId: "stmt-1",
      reviewerName: "Test Reviewer",
      reviewerRole: "Registered Manager",
      outcome: "approved_no_changes",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("Supabase not configured");
  });

  it("createReview with all fields returns error", async () => {
    const result = await createReview({
      homeId: "home-1",
      statementId: "stmt-1",
      reviewDate: daysAgo(0),
      reviewerName: "Test Reviewer",
      reviewerRole: "Registered Manager",
      outcome: "approved_with_amendments",
      sectionsReviewed: ["range_of_needs", "staffing"],
      changesRequired: "Update staffing section",
      changesMade: "Staffing updated",
      nextReviewDate: daysFromNow(365),
      notes: "Annual review completed",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("Supabase not configured");
  });

  // ── listAmendments ────────────────────────────────────────────────────

  it("listAmendments returns ok with empty array", async () => {
    const result = await listAmendments("home-1");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toEqual([]);
  });

  it("listAmendments with statementId filter returns ok with empty array", async () => {
    const result = await listAmendments("home-1", { statementId: "stmt-1" });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toEqual([]);
  });

  it("listAmendments with amendmentType filter returns ok with empty array", async () => {
    const result = await listAmendments("home-1", { amendmentType: "staff_change" });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toEqual([]);
  });

  it("listAmendments with sectionAmended filter returns ok with empty array", async () => {
    const result = await listAmendments("home-1", { sectionAmended: "staffing" });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toEqual([]);
  });

  it("listAmendments with all filters returns ok with empty array", async () => {
    const result = await listAmendments("home-1", {
      statementId: "stmt-1",
      amendmentType: "minor_update",
      sectionAmended: "health",
      limit: 50,
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toEqual([]);
  });

  // ── createAmendment ───────────────────────────────────────────────────

  it("createAmendment returns error when Supabase disabled", async () => {
    const result = await createAmendment({
      homeId: "home-1",
      statementId: "stmt-1",
      amendmentType: "minor_update",
      amendedBy: "Test Staff",
      sectionAmended: "staffing",
      previousContent: "Old content",
      newContent: "New content",
      reasonForChange: "Staff change",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("Supabase not configured");
  });

  it("createAmendment with minimal fields returns error", async () => {
    const result = await createAmendment({
      homeId: "home-1",
      statementId: "stmt-1",
      amendmentType: "annual_review",
      amendedBy: "Staff",
      sectionAmended: "education",
      previousContent: "Old",
      newContent: "New",
      reasonForChange: "Annual update",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("Supabase not configured");
  });

  it("listStatements with different home IDs still returns empty", async () => {
    const r1 = await listStatements("home-999");
    const r2 = await listStatements("home-abc");
    expect(r1.ok).toBe(true);
    expect(r2.ok).toBe(true);
    if (r1.ok) expect(r1.data).toEqual([]);
    if (r2.ok) expect(r2.data).toEqual([]);
  });

  it("listReviews with limit filter returns ok", async () => {
    const result = await listReviews("home-1", { limit: 5 });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toEqual([]);
  });

  it("listAmendments with limit only returns ok", async () => {
    const result = await listAmendments("home-1", { limit: 25 });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toEqual([]);
  });

  it("updateStatement with empty updates returns error", async () => {
    const result = await updateStatement("stmt-1", {});
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("Supabase not configured");
  });

  it("createStatement with minimal required fields returns error", async () => {
    const result = await createStatement({
      homeId: "h",
      version: "0.1",
      title: "T",
      reviewDate: daysFromNow(30),
      registeredManager: "M",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("Supabase not configured");
  });

  it("createReview with minimal required fields returns error", async () => {
    const result = await createReview({
      homeId: "h",
      statementId: "s",
      reviewerName: "R",
      reviewerRole: "Role",
      outcome: "deferred",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("Supabase not configured");
  });

  it("createAmendment with all fields returns error", async () => {
    const result = await createAmendment({
      homeId: "home-1",
      statementId: "stmt-1",
      amendmentDate: daysAgo(0),
      amendmentType: "major_revision",
      amendedBy: "Test Staff",
      sectionAmended: "range_of_needs",
      previousContent: "Children aged 8-17",
      newContent: "Children aged 8-18",
      reasonForChange: "Age range expanded",
      approvedBy: "manager-1",
      ofstedNotified: true,
      notes: "Approved by RI",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("Supabase not configured");
  });
});
