import { describe, it, expect } from "vitest";
import {
  computeStatementMetrics,
  identifyStatementAlerts,
} from "./statement-of-purpose-service";
import type {
  StatementOfPurpose,
  StatementReview,
  StatementAmendment,
} from "./statement-of-purpose-service";

// -- Factories ----------------------------------------------------------------

/** Date string n days ahead — UTC end to end, floating with the clock. */
function daysFromNow(n: number): string {
  const [y, m, d] = new Date().toISOString().slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

function makeStatement(overrides: Partial<StatementOfPurpose> = {}): StatementOfPurpose {
  return {
    id: "sop-1",
    home_id: "home-1",
    version: "2.0",
    title: "Statement of Purpose",
    effective_date: "2025-01-01",
    review_date: daysFromNow(120),
    last_reviewed_date: "2025-06-01",
    reviewed_by: "Manager",
    approved_by: "Director",
    approval_date: "2025-06-02",
    status: "active",
    range_of_needs: "EBD, ASD",
    ethos_and_philosophy: "Child-centred approach",
    accommodation_details: "4 bedrooms",
    location_details: "Suburban setting",
    staffing_structure: "1:2 ratio",
    fire_safety_arrangements: "Alarm system, evacuation plan",
    behaviour_management_approach: "Restorative practice",
    education_provision: "Onsite tutor",
    health_arrangements: "Registered GP, CAMHS link",
    contact_arrangements: "As per care plan",
    complaints_procedure: "Reg 45 compliant",
    religious_cultural_needs: "Individual assessments",
    emergency_placement_procedure: null,
    registered_manager: "Manager A",
    responsible_individual: "RI B",
    ofsted_notification_date: null,
    notes: null,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-06-02T00:00:00Z",
    ...overrides,
  };
}

function makeReview(overrides: Partial<StatementReview> = {}): StatementReview {
  return {
    id: "rev-1",
    home_id: "home-1",
    statement_id: "sop-1",
    review_date: "2025-06-01",
    reviewer_name: "Manager",
    reviewer_role: "RM",
    outcome: "approved_no_changes",
    sections_reviewed: ["range_of_needs", "staffing"],
    changes_required: null,
    changes_made: null,
    next_review_date: null,
    notes: null,
    created_at: "2025-06-01T00:00:00Z",
    ...overrides,
  };
}

function makeAmendment(overrides: Partial<StatementAmendment> = {}): StatementAmendment {
  return {
    id: "amd-1",
    home_id: "home-1",
    statement_id: "sop-1",
    amendment_date: "2026-03-01",
    amendment_type: "minor_update",
    amended_by: "Manager",
    section_amended: "staffing",
    previous_content: "1:2 ratio",
    new_content: "1:3 ratio",
    reason_for_change: "Capacity increase",
    approved_by: "Director",
    ofsted_notified: false,
    notes: null,
    created_at: "2026-03-01T00:00:00Z",
    ...overrides,
  };
}

const NOW = new Date("2026-05-21T12:00:00Z");

// -- computeStatementMetrics --------------------------------------------------

describe("computeStatementMetrics", () => {
  it("returns zeroes/defaults for empty data", () => {
    const r = computeStatementMetrics([], [], []);
    expect(r.active_statements).toBe(0);
    expect(r.overdue_reviews).toBe(0);
    expect(r.amendments_this_year).toBe(0);
    expect(r.reviews_this_year).toBe(0);
    expect(r.avg_days_between_reviews).toBe(0);
    expect(r.latest_version).toBe("0.0");
  });

  it("counts active statements and overdue reviews", () => {
    const statements = [
      makeStatement({ id: "s1", status: "active", review_date: "2026-01-01" }), // overdue
      makeStatement({ id: "s2", status: "active", review_date: daysFromNow(120) }), // not overdue
      makeStatement({ id: "s3", status: "archived" }),
    ];
    const r = computeStatementMetrics(statements, [], []);
    expect(r.active_statements).toBe(2);
    expect(r.overdue_reviews).toBe(1);
  });

  it("finds latest version across all statements", () => {
    const statements = [
      makeStatement({ id: "s1", version: "1.0" }),
      makeStatement({ id: "s2", version: "3.0" }),
      makeStatement({ id: "s3", version: "2.5" }),
    ];
    expect(computeStatementMetrics(statements, [], []).latest_version).toBe("3.0");
  });

  it("populates sections_coverage from latest active statement", () => {
    const statements = [
      makeStatement({
        id: "s1",
        status: "active",
        version: "2.0",
        range_of_needs: "EBD",
        ethos_and_philosophy: "",  // empty
      }),
    ];
    const r = computeStatementMetrics(statements, [], []);
    expect(r.sections_coverage.range_of_needs).toBe(true);
    expect(r.sections_coverage.ethos_philosophy).toBe(false);
  });

  it("counts reviews and amendments this year", () => {
    const thisYear = new Date().toISOString().slice(0, 4);
    const lastYear = String(Number(thisYear) - 1);
    const reviews = [
      // Calendar-year fixtures derive from the running clock's year — a fixed
      // year rots, and a fixed day-offset crosses the boundary every January.
      makeReview({ id: "r1", review_date: `${thisYear}-03-01` }),
      makeReview({ id: "r2", review_date: `${lastYear}-03-01` }),
    ];
    const amendments = [
      makeAmendment({ id: "a1", amendment_date: `${thisYear}-02-01` }),
      makeAmendment({ id: "a2", amendment_date: `${lastYear}-12-01` }),
    ];
    const r = computeStatementMetrics([makeStatement()], reviews, amendments);
    expect(r.reviews_this_year).toBe(1);
    expect(r.amendments_this_year).toBe(1);
  });

  it("calculates average days between reviews", () => {
    const reviews = [
      makeReview({ id: "r1", review_date: "2026-01-01" }),
      makeReview({ id: "r2", review_date: "2026-01-31" }),
    ];
    const r = computeStatementMetrics([makeStatement()], reviews, []);
    expect(r.avg_days_between_reviews).toBe(30);
  });

  it("populates by_review_outcome and by_amendment_type", () => {
    const reviews = [
      makeReview({ id: "r1", outcome: "approved_no_changes" }),
      makeReview({ id: "r2", outcome: "major_revision_required" }),
    ];
    const amendments = [
      makeAmendment({ id: "a1", amendment_type: "minor_update" }),
      makeAmendment({ id: "a2", amendment_type: "major_revision" }),
    ];
    const r = computeStatementMetrics([makeStatement()], reviews, amendments);
    expect(r.by_review_outcome).toEqual({ approved_no_changes: 1, major_revision_required: 1 });
    expect(r.by_amendment_type).toEqual({ minor_update: 1, major_revision: 1 });
  });
});

// -- identifyStatementAlerts --------------------------------------------------

describe("identifyStatementAlerts", () => {
  it("returns empty for empty data", () => {
    expect(identifyStatementAlerts([], [], [], NOW)).toEqual([]);
  });

  it("fires review_overdue for active statement with past review_date", () => {
    const statements = [makeStatement({ status: "active", review_date: "2026-01-01" })];
    const alerts = identifyStatementAlerts(statements, [], [], NOW);
    const a = alerts.filter((x) => x.category === "review_overdue");
    expect(a).toHaveLength(1);
    expect(a[0].severity).toBe("critical");
  });

  it("fires no_approval for active statement without approved_by", () => {
    const statements = [makeStatement({ status: "active", approved_by: null })];
    const alerts = identifyStatementAlerts(statements, [], [], NOW);
    expect(alerts.filter((x) => x.category === "no_approval")).toHaveLength(1);
  });

  it("fires sections_incomplete for active statement with empty required sections", () => {
    const statements = [makeStatement({ status: "active", range_of_needs: "" })];
    const alerts = identifyStatementAlerts(statements, [], [], NOW);
    expect(alerts.filter((x) => x.category === "sections_incomplete")).toHaveLength(1);
  });

  it("fires ofsted_not_notified for major amendment without notification", () => {
    const amendments = [
      makeAmendment({ amendment_type: "major_revision", ofsted_notified: false }),
    ];
    const alerts = identifyStatementAlerts([], [], amendments, NOW);
    const a = alerts.filter((x) => x.category === "ofsted_not_notified");
    expect(a).toHaveLength(1);
    expect(a[0].severity).toBe("critical");
  });

  it("does NOT fire ofsted_not_notified for minor_update", () => {
    const amendments = [
      makeAmendment({ amendment_type: "minor_update", ofsted_notified: false }),
    ];
    const alerts = identifyStatementAlerts([], [], amendments, NOW);
    expect(alerts.filter((x) => x.category === "ofsted_not_notified")).toHaveLength(0);
  });

  it("fires amendment_not_approved when no approved_by on amendment", () => {
    const amendments = [makeAmendment({ approved_by: null })];
    const alerts = identifyStatementAlerts([], [], amendments, NOW);
    expect(alerts.filter((x) => x.category === "amendment_not_approved")).toHaveLength(1);
  });

  it("fires draft_stale for draft statement older than 30 days", () => {
    const statements = [
      makeStatement({ status: "draft", created_at: "2026-03-01T00:00:00Z" }),
    ];
    const alerts = identifyStatementAlerts(statements, [], [], NOW);
    expect(alerts.filter((x) => x.category === "draft_stale")).toHaveLength(1);
  });

  it("fires no_review_in_12_months for active statement with no reviews in over a year", () => {
    const statements = [
      makeStatement({ id: "s1", status: "active", effective_date: "2024-01-01" }),
    ];
    // No reviews at all for this statement
    const alerts = identifyStatementAlerts(statements, [], [], NOW);
    expect(alerts.filter((x) => x.category === "no_review_in_12_months")).toHaveLength(1);
  });

  it("alerts are sorted by severity (critical first)", () => {
    const statements = [
      makeStatement({ status: "active", review_date: "2026-01-01", approved_by: null }),
    ];
    const amendments = [
      makeAmendment({ amendment_type: "major_revision", ofsted_notified: false, approved_by: null }),
    ];
    const alerts = identifyStatementAlerts(statements, [], amendments, NOW);
    const severities = alerts.map((a) => a.severity);
    const criticalIdx = severities.indexOf("critical");
    const mediumIdx = severities.indexOf("medium");
    if (criticalIdx !== -1 && mediumIdx !== -1) {
      expect(criticalIdx).toBeLessThan(mediumIdx);
    }
  });
});
