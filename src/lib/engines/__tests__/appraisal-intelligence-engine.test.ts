// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — APPRAISAL INTELLIGENCE ENGINE — TEST SUITE
// 50+ deterministic tests covering helpers, overview, rating breakdown,
// competency analysis, staff profiles, risk flags, alerts, ARIA insights,
// and an Chamberlain House integration scenario.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeAppraisalIntelligence,
  average,
  daysBetween,
  type AppraisalInput,
  type StaffRef,
  type AppraisalIntelligenceInput,
  type AppraisalRating,
  type AppraisalStatus,
  type AppraisalType,
  type CompetencyDomain,
  type CompetencyLevel,
} from "../appraisal-intelligence-engine";

// ── Constants ───────────────────────────────────────────────────────────────

const TODAY = "2026-05-25";

const STAFF: StaffRef[] = [
  { id: "staff_darren",    name: "Darren Laville",    is_active: true },
  { id: "staff_ryan",      name: "Ryan Mitchell",     is_active: true },
  { id: "staff_edward",    name: "Edward Clarke",     is_active: true },
  { id: "staff_anna",      name: "Anna Nowak",        is_active: true },
  { id: "staff_chervelle", name: "Chervelle Brown",   is_active: true },
  { id: "staff_lackson",   name: "Lackson Phiri",     is_active: true },
  { id: "staff_diane",     name: "Diane Williams",    is_active: true },
  { id: "staff_mirela",    name: "Mirela Popescu",    is_active: true },
  { id: "staff_retired",   name: "Retired Staff",     is_active: false },
];

// ── Factory ─────────────────────────────────────────────────────────────────

function makeAppraisal(overrides: Partial<AppraisalInput> = {}): AppraisalInput {
  return {
    id: "appr_test",
    staff_id: "staff_ryan",
    appraisal_type: "annual_appraisal",
    appraisal_date: "2026-03-15",
    appraiser_id: "staff_darren",
    status: "completed",
    overall_rating: "good",
    competency_scores: {
      safeguarding_and_child_protection: 4,
      therapeutic_relationships: 4,
      risk_management: 3,
      statutory_compliance: 4,
      communication_and_recording: 4,
    },
    signed_by_staff: true,
    next_review_date: "2027-03-15",
    objectives_next_period: "Complete Level 5 Diploma",
    created_at: "2026-03-15T10:00:00Z",
    ...overrides,
  };
}

function run(
  appraisals: AppraisalInput[] = [],
  staffOverride?: StaffRef[],
): ReturnType<typeof computeAppraisalIntelligence> {
  return computeAppraisalIntelligence({
    appraisals,
    staff: staffOverride ?? STAFF,
    today: TODAY,
  });
}

// ── Helper Tests ────────────────────────────────────────────────────────────

describe("helpers", () => {
  it("average of empty array returns 0", () => {
    expect(average([])).toBe(0);
  });

  it("average computes correctly", () => {
    expect(average([3, 4, 5])).toBe(4);
  });

  it("daysBetween positive = future", () => {
    expect(daysBetween("2026-05-25", "2026-06-01")).toBe(7);
  });

  it("daysBetween negative = past", () => {
    expect(daysBetween("2026-05-25", "2026-05-20")).toBe(-5);
  });
});

// ── Empty State ─────────────────────────────────────────────────────────────

describe("empty state", () => {
  it("returns sensible defaults with no appraisals", () => {
    const r = run([]);
    expect(r.overview.total_appraisals).toBe(0);
    expect(r.overview.completion_rate).toBe(100);
    expect(r.overview.compliance_rate).toBe(0); // 0 of 8 active staff
    expect(r.overview.staff_without_appraisal).toBe(8);
    expect(r.alerts.length).toBeGreaterThan(0);
  });
});

// ── Overview ────────────────────────────────────────────────────────────────

describe("overview", () => {
  it("counts statuses correctly", () => {
    const r = run([
      makeAppraisal({ id: "a1", status: "completed" }),
      makeAppraisal({ id: "a2", status: "overdue", overall_rating: null, competency_scores: {}, signed_by_staff: false }),
      makeAppraisal({ id: "a3", status: "scheduled", overall_rating: null, competency_scores: {}, signed_by_staff: false }),
      makeAppraisal({ id: "a4", status: "in_progress", overall_rating: null, competency_scores: {}, signed_by_staff: false }),
    ]);
    expect(r.overview.completed).toBe(1);
    expect(r.overview.overdue).toBe(1);
    expect(r.overview.scheduled).toBe(1);
    expect(r.overview.in_progress).toBe(1);
    expect(r.overview.total_appraisals).toBe(4);
  });

  it("completion_rate excludes scheduled from denominator", () => {
    const r = run([
      makeAppraisal({ id: "a1", status: "completed" }),
      makeAppraisal({ id: "a2", status: "overdue", overall_rating: null, competency_scores: {}, signed_by_staff: false }),
      makeAppraisal({ id: "a3", status: "scheduled", overall_rating: null, competency_scores: {}, signed_by_staff: false }),
    ]);
    // actionable = completed(1) + overdue(1) = 2, completed = 1 → 50%
    expect(r.overview.completion_rate).toBe(50);
  });

  it("compliance_rate tracks active staff with ≥1 completed appraisal", () => {
    const r = run([
      makeAppraisal({ id: "a1", staff_id: "staff_ryan", status: "completed" }),
      makeAppraisal({ id: "a2", staff_id: "staff_anna", status: "completed" }),
    ]);
    // 2 of 8 active staff have completed = 25%
    expect(r.overview.compliance_rate).toBe(25);
    expect(r.overview.staff_with_appraisal).toBe(2);
    expect(r.overview.staff_without_appraisal).toBe(6);
  });

  it("avg_competency_score only includes scores > 0 from completed appraisals", () => {
    const r = run([
      makeAppraisal({
        id: "a1", status: "completed",
        competency_scores: {
          safeguarding_and_child_protection: 4,
          therapeutic_relationships: 3,
        },
      }),
      makeAppraisal({
        id: "a2", status: "overdue", overall_rating: null,
        competency_scores: { safeguarding_and_child_protection: 5 },
        signed_by_staff: false,
      }),
    ]);
    // Only completed appraisal's scores: avg of [4, 3] = 3.5
    expect(r.overview.avg_competency_score).toBe(3.5);
  });

  it("fitness_confirmed_rate tracks signed completed appraisals", () => {
    const r = run([
      makeAppraisal({ id: "a1", signed_by_staff: true }),
      makeAppraisal({ id: "a2", signed_by_staff: false }),
    ]);
    // 1 of 2 completed signed = 50%
    expect(r.overview.fitness_confirmed_rate).toBe(50);
  });

  it("overdue_count equals overdue.length", () => {
    const r = run([
      makeAppraisal({ id: "a1", status: "overdue", overall_rating: null, competency_scores: {}, signed_by_staff: false }),
      makeAppraisal({ id: "a2", status: "overdue", overall_rating: null, competency_scores: {}, signed_by_staff: false, staff_id: "staff_anna" }),
    ]);
    expect(r.overview.overdue_count).toBe(2);
  });
});

// ── Rating Breakdown ────────────────────────────────────────────────────────

describe("rating breakdown", () => {
  it("counts each rating from completed appraisals", () => {
    const r = run([
      makeAppraisal({ id: "a1", overall_rating: "outstanding" }),
      makeAppraisal({ id: "a2", overall_rating: "good" }),
      makeAppraisal({ id: "a3", overall_rating: "good", staff_id: "staff_anna" }),
      makeAppraisal({ id: "a4", overall_rating: "requires_improvement", staff_id: "staff_edward" }),
    ]);
    const outstanding = r.rating_breakdown.find((b) => b.rating === "outstanding");
    const good = r.rating_breakdown.find((b) => b.rating === "good");
    const ri = r.rating_breakdown.find((b) => b.rating === "requires_improvement");
    const inadequate = r.rating_breakdown.find((b) => b.rating === "inadequate");

    expect(outstanding?.count).toBe(1);
    expect(good?.count).toBe(2);
    expect(ri?.count).toBe(1);
    expect(inadequate?.count).toBe(0);
  });

  it("calculates percentages correctly", () => {
    const r = run([
      makeAppraisal({ id: "a1", overall_rating: "outstanding" }),
      makeAppraisal({ id: "a2", overall_rating: "good" }),
    ]);
    const outstanding = r.rating_breakdown.find((b) => b.rating === "outstanding");
    expect(outstanding?.percentage).toBe(50);
  });

  it("ignores overdue/scheduled appraisals (no rating)", () => {
    const r = run([
      makeAppraisal({ id: "a1", overall_rating: "good" }),
      makeAppraisal({ id: "a2", status: "overdue", overall_rating: null, competency_scores: {}, signed_by_staff: false }),
    ]);
    const total = r.rating_breakdown.reduce((s, b) => s + b.count, 0);
    expect(total).toBe(1); // only the completed one
  });
});

// ── Competency Analysis ─────────────────────────────────────────────────────

describe("competency analysis", () => {
  it("calculates per-domain averages from completed appraisals only", () => {
    const r = run([
      makeAppraisal({
        id: "a1", status: "completed",
        competency_scores: { safeguarding_and_child_protection: 4, risk_management: 2 },
      }),
      makeAppraisal({
        id: "a2", status: "completed", staff_id: "staff_anna",
        competency_scores: { safeguarding_and_child_protection: 5, risk_management: 4 },
      }),
    ]);
    const safeguarding = r.competency_analysis.find((c) => c.domain === "safeguarding_and_child_protection");
    expect(safeguarding?.avg_score).toBe(4.5);
    expect(safeguarding?.staff_assessed).toBe(2);
    expect(safeguarding?.lowest_score).toBe(4);
    expect(safeguarding?.highest_score).toBe(5);
  });

  it("sorts by lowest average first", () => {
    const r = run([
      makeAppraisal({
        id: "a1", status: "completed",
        competency_scores: { safeguarding_and_child_protection: 5, risk_management: 2 },
      }),
    ]);
    expect(r.competency_analysis[0].domain).toBe("risk_management");
  });

  it("excludes domains with no scores", () => {
    const r = run([
      makeAppraisal({
        id: "a1", status: "completed",
        competency_scores: { safeguarding_and_child_protection: 4 },
      }),
    ]);
    // Only 1 domain should appear
    expect(r.competency_analysis.length).toBe(1);
    expect(r.competency_analysis[0].domain).toBe("safeguarding_and_child_protection");
  });

  it("ignores overdue appraisals' scores", () => {
    const r = run([
      makeAppraisal({
        id: "a1", status: "overdue", overall_rating: null,
        competency_scores: { safeguarding_and_child_protection: 1 },
        signed_by_staff: false,
      }),
    ]);
    expect(r.competency_analysis.length).toBe(0);
  });
});

// ── Staff Profiles ──────────────────────────────────────────────────────────

describe("staff profiles", () => {
  it("creates profile for every active staff member", () => {
    const r = run([]);
    expect(r.staff_profiles.length).toBe(8); // 8 active staff
    expect(r.staff_profiles.find((p) => p.staff_id === "staff_retired")).toBeUndefined();
  });

  it("picks latest appraisal by date", () => {
    const r = run([
      makeAppraisal({ id: "a_old", staff_id: "staff_ryan", appraisal_date: "2025-01-01", overall_rating: "requires_improvement" }),
      makeAppraisal({ id: "a_new", staff_id: "staff_ryan", appraisal_date: "2026-04-01", overall_rating: "good" }),
    ]);
    const ryan = r.staff_profiles.find((p) => p.staff_id === "staff_ryan");
    expect(ryan?.latest_appraisal_id).toBe("a_new");
    expect(ryan?.latest_rating).toBe("good");
  });

  it("calculates next_review_in_days correctly", () => {
    const r = run([
      makeAppraisal({ id: "a1", staff_id: "staff_ryan", next_review_date: "2026-06-01" }),
    ]);
    const ryan = r.staff_profiles.find((p) => p.staff_id === "staff_ryan");
    // 2026-05-25 → 2026-06-01 = 7 days
    expect(ryan?.next_review_in_days).toBe(7);
  });

  it("marks negative next_review_in_days for overdue reviews", () => {
    const r = run([
      makeAppraisal({ id: "a1", staff_id: "staff_ryan", next_review_date: "2026-05-20" }),
    ]);
    const ryan = r.staff_profiles.find((p) => p.staff_id === "staff_ryan");
    expect(ryan?.next_review_in_days).toBe(-5);
  });

  it("has_objectives is true when objectives present", () => {
    const r = run([
      makeAppraisal({ id: "a1", objectives_next_period: "Do something" }),
    ]);
    const ryan = r.staff_profiles.find((p) => p.staff_id === "staff_ryan");
    expect(ryan?.has_objectives).toBe(true);
  });

  it("has_objectives is false when objectives null", () => {
    const r = run([
      makeAppraisal({ id: "a1", objectives_next_period: null }),
    ]);
    const ryan = r.staff_profiles.find((p) => p.staff_id === "staff_ryan");
    expect(ryan?.has_objectives).toBe(false);
  });

  it("tracks appraisal count per staff", () => {
    const r = run([
      makeAppraisal({ id: "a1", staff_id: "staff_ryan" }),
      makeAppraisal({ id: "a2", staff_id: "staff_ryan", appraisal_date: "2026-01-01" }),
    ]);
    const ryan = r.staff_profiles.find((p) => p.staff_id === "staff_ryan");
    expect(ryan?.appraisal_count).toBe(2);
  });
});

// ── Risk Flags ──────────────────────────────────────────────────────────────

describe("risk flags", () => {
  it("flags staff with no appraisal", () => {
    const r = run([]);
    const anna = r.staff_profiles.find((p) => p.staff_id === "staff_anna");
    expect(anna?.risk_flags).toContain("no_appraisal");
  });

  it("flags overdue appraisal", () => {
    const r = run([
      makeAppraisal({ id: "a1", staff_id: "staff_anna", status: "overdue", overall_rating: null, competency_scores: {}, signed_by_staff: false }),
    ]);
    const anna = r.staff_profiles.find((p) => p.staff_id === "staff_anna");
    expect(anna?.risk_flags).toContain("overdue");
  });

  it("flags unsigned completed appraisal", () => {
    const r = run([
      makeAppraisal({ id: "a1", staff_id: "staff_anna", signed_by_staff: false }),
    ]);
    const anna = r.staff_profiles.find((p) => p.staff_id === "staff_anna");
    expect(anna?.risk_flags).toContain("not_signed");
  });

  it("flags requires_improvement rating", () => {
    const r = run([
      makeAppraisal({ id: "a1", staff_id: "staff_anna", overall_rating: "requires_improvement" }),
    ]);
    const anna = r.staff_profiles.find((p) => p.staff_id === "staff_anna");
    expect(anna?.risk_flags).toContain("requires_improvement");
  });

  it("flags inadequate rating", () => {
    const r = run([
      makeAppraisal({ id: "a1", staff_id: "staff_anna", overall_rating: "inadequate" }),
    ]);
    const anna = r.staff_profiles.find((p) => p.staff_id === "staff_anna");
    expect(anna?.risk_flags).toContain("inadequate");
  });

  it("flags review_overdue when next_review_date is past and status is not overdue", () => {
    const r = run([
      makeAppraisal({ id: "a1", staff_id: "staff_anna", status: "completed", next_review_date: "2026-05-01" }),
    ]);
    const anna = r.staff_profiles.find((p) => p.staff_id === "staff_anna");
    expect(anna?.risk_flags).toContain("review_overdue");
  });

  it("does NOT flag review_overdue when status is already overdue", () => {
    const r = run([
      makeAppraisal({ id: "a1", staff_id: "staff_anna", status: "overdue", next_review_date: "2026-05-01", overall_rating: null, competency_scores: {}, signed_by_staff: false }),
    ]);
    const anna = r.staff_profiles.find((p) => p.staff_id === "staff_anna");
    expect(anna?.risk_flags).not.toContain("review_overdue");
  });

  it("sorts profiles with at-risk staff first", () => {
    const r = run([
      makeAppraisal({ id: "a1", staff_id: "staff_ryan", status: "completed", overall_rating: "outstanding" }),
      // anna has no appraisal → no_appraisal flag
    ]);
    // Anna (no_appraisal) should come before Ryan (no flags)
    const annaIdx = r.staff_profiles.findIndex((p) => p.staff_id === "staff_anna");
    const ryanIdx = r.staff_profiles.findIndex((p) => p.staff_id === "staff_ryan");
    expect(annaIdx).toBeLessThan(ryanIdx);
  });
});

// ── Alerts ──────────────────────────────────────────────────────────────────

describe("alerts", () => {
  it("critical alert for overdue appraisals", () => {
    const r = run([
      makeAppraisal({ id: "a1", staff_id: "staff_anna", status: "overdue", overall_rating: null, competency_scores: {}, signed_by_staff: false }),
    ]);
    const crit = r.alerts.filter((a) => a.severity === "critical");
    expect(crit.length).toBeGreaterThan(0);
    expect(crit[0].message).toContain("overdue");
    expect(crit[0].message).toContain("Anna Nowak");
  });

  it("high alert for staff without appraisal", () => {
    const r = run([], [
      { id: "s1", name: "Solo Staff", is_active: true },
    ]);
    const high = r.alerts.filter((a) => a.severity === "high" && a.message.includes("without a completed appraisal"));
    expect(high.length).toBe(1);
    expect(high[0].message).toContain("Solo Staff");
  });

  it("high alert for unsigned completed appraisals", () => {
    const r = run([
      makeAppraisal({ id: "a1", signed_by_staff: false }),
    ]);
    const high = r.alerts.filter((a) => a.severity === "high" && a.message.includes("not signed"));
    expect(high.length).toBe(1);
  });

  it("high alert for inadequate rating", () => {
    const r = run([
      makeAppraisal({ id: "a1", overall_rating: "inadequate" }),
    ]);
    const high = r.alerts.filter((a) => a.severity === "high" && a.message.includes("inadequate"));
    expect(high.length).toBe(1);
  });

  it("medium alert for requires_improvement rating", () => {
    const r = run([
      makeAppraisal({ id: "a1", overall_rating: "requires_improvement" }),
    ]);
    const med = r.alerts.filter((a) => a.severity === "medium" && a.message.includes("requires improvement"));
    expect(med.length).toBe(1);
  });

  it("medium alert for low competency domains", () => {
    const r = run([
      makeAppraisal({
        id: "a1", status: "completed",
        competency_scores: { risk_management: 2 },
      }),
    ]);
    const med = r.alerts.filter((a) => a.severity === "medium" && a.message.includes("competency domain"));
    expect(med.length).toBe(1);
    expect(med[0].message).toContain("Risk Management");
  });

  it("low alert for scheduled appraisals", () => {
    const r = run([
      makeAppraisal({ id: "a1", status: "scheduled", overall_rating: null, competency_scores: {}, signed_by_staff: false }),
    ]);
    const low = r.alerts.filter((a) => a.severity === "low");
    expect(low.length).toBeGreaterThan(0);
    expect(low.some((a) => a.message.includes("scheduled"))).toBe(true);
  });

  it("no overdue alert when all completed", () => {
    const r = run([
      makeAppraisal({ id: "a1", status: "completed" }),
    ]);
    const overdueAlerts = r.alerts.filter((a) => a.message.includes("overdue"));
    // The "overdue" alert should NOT appear (though "review_overdue" for next_review might)
    const critOverdue = r.alerts.filter((a) => a.severity === "critical" && a.message.includes("appraisal(s) overdue"));
    expect(critOverdue.length).toBe(0);
  });
});

// ── ARIA Insights ───────────────────────────────────────────────────────────

describe("ARIA insights", () => {
  it("critical insight for overdue appraisals", () => {
    const r = run([
      makeAppraisal({ id: "a1", status: "overdue", overall_rating: null, competency_scores: {}, signed_by_staff: false }),
    ]);
    const crit = r.insights.filter((i) => i.severity === "critical");
    expect(crit.length).toBeGreaterThan(0);
    expect(crit[0].text).toContain("overdue");
  });

  it("warning insight for staff without appraisal", () => {
    const r = run([]);
    const warn = r.insights.filter((i) => i.severity === "warning" && i.text.includes("no completed appraisal"));
    expect(warn.length).toBe(1);
  });

  it("warning insight for low competency domains", () => {
    const r = run([
      makeAppraisal({ id: "a1", status: "completed", competency_scores: { risk_management: 2 } }),
    ]);
    const warn = r.insights.filter((i) => i.severity === "warning" && i.text.includes("competency domain"));
    expect(warn.length).toBe(1);
  });

  it("warning insight for unsigned appraisals", () => {
    const r = run([
      makeAppraisal({ id: "a1", signed_by_staff: false }),
    ]);
    const warn = r.insights.filter((i) => i.severity === "warning" && i.text.includes("sign-off"));
    expect(warn.length).toBe(1);
  });

  it("positive insight when all actionable completed", () => {
    const twoStaff: StaffRef[] = [
      { id: "s1", name: "Staff One", is_active: true },
    ];
    const r = run([
      makeAppraisal({ id: "a1", staff_id: "s1", status: "completed" }),
    ], twoStaff);
    const pos = r.insights.filter((i) => i.severity === "positive" && i.text.includes("All actionable appraisals"));
    expect(pos.length).toBe(1);
  });

  it("positive insight for 100% compliance rate", () => {
    const twoStaff: StaffRef[] = [
      { id: "s1", name: "Staff One", is_active: true },
      { id: "s2", name: "Staff Two", is_active: true },
    ];
    const r = run([
      makeAppraisal({ id: "a1", staff_id: "s1", status: "completed" }),
      makeAppraisal({ id: "a2", staff_id: "s2", status: "completed" }),
    ], twoStaff);
    const pos = r.insights.filter((i) => i.severity === "positive" && i.text.includes("All 2 active staff"));
    expect(pos.length).toBe(1);
  });

  it("positive insight for high average competency (≥4)", () => {
    const r = run([
      makeAppraisal({
        id: "a1", status: "completed",
        competency_scores: {
          safeguarding_and_child_protection: 5,
          therapeutic_relationships: 4,
          risk_management: 4,
          statutory_compliance: 5,
        },
      }),
    ]);
    const pos = r.insights.filter((i) => i.severity === "positive" && i.text.includes("proficient"));
    expect(pos.length).toBe(1);
  });

  it("positive insight for 100% fitness confirmed", () => {
    const oneStaff: StaffRef[] = [{ id: "s1", name: "Staff One", is_active: true }];
    const r = run([
      makeAppraisal({ id: "a1", staff_id: "s1", signed_by_staff: true }),
    ], oneStaff);
    const pos = r.insights.filter((i) => i.severity === "positive" && i.text.includes("100% sign-off rate"));
    expect(pos.length).toBe(1);
  });

  it("positive insight for outstanding ratings", () => {
    const r = run([
      makeAppraisal({ id: "a1", overall_rating: "outstanding" }),
    ]);
    const pos = r.insights.filter((i) => i.severity === "positive" && i.text.includes("outstanding"));
    expect(pos.length).toBe(1);
  });

  it("positive insight for diverse appraisal types (≥3)", () => {
    const r = run([
      makeAppraisal({ id: "a1", appraisal_type: "annual_appraisal" }),
      makeAppraisal({ id: "a2", appraisal_type: "probation_review", staff_id: "staff_anna" }),
      makeAppraisal({ id: "a3", appraisal_type: "mid_year", staff_id: "staff_edward" }),
    ]);
    const pos = r.insights.filter((i) => i.severity === "positive" && i.text.includes("3 different appraisal types"));
    expect(pos.length).toBe(1);
  });
});

// ── Chamberlain House Integration ───────────────────────────────────────────────────

describe("Chamberlain House integration", () => {
  // Mirrors the actual store data from store.ts
  const OAK_HOUSE_APPRAISALS: AppraisalInput[] = [
    {
      id: "appr_ryan_2026", staff_id: "staff_ryan",
      appraisal_type: "annual_appraisal", appraisal_date: "2026-03-15",
      appraiser_id: "staff_darren", status: "completed",
      overall_rating: "good",
      competency_scores: {
        safeguarding_and_child_protection: 4,
        therapeutic_relationships: 4,
        trauma_informed_practice: 3,
        risk_management: 4,
        statutory_compliance: 4,
        communication_and_recording: 4,
        leadership_and_supervision: 3,
        self_care_and_resilience: 3,
        learning_and_professional_development: 3,
        equality_diversity_inclusion: 4,
      },
      signed_by_staff: true, next_review_date: "2027-03-15",
      objectives_next_period: "Complete Level 5 Diploma",
      created_at: "2026-03-15T10:00:00Z",
    },
    {
      id: "appr_edward_prob", staff_id: "staff_edward",
      appraisal_type: "probation_review", appraisal_date: "2026-03-01",
      appraiser_id: "staff_ryan", status: "completed",
      overall_rating: "good",
      competency_scores: {
        safeguarding_and_child_protection: 3,
        therapeutic_relationships: 4,
        trauma_informed_practice: 4,
        risk_management: 2,
        statutory_compliance: 3,
        communication_and_recording: 4,
        self_care_and_resilience: 4,
        learning_and_professional_development: 3,
        equality_diversity_inclusion: 3,
      },
      signed_by_staff: true, next_review_date: "2026-09-01",
      objectives_next_period: "Complete 3 supervised risk assessments",
      created_at: "2026-03-01T10:00:00Z",
    },
    {
      id: "appr_anna_overdue", staff_id: "staff_anna",
      appraisal_type: "annual_appraisal", appraisal_date: "2026-04-01",
      appraiser_id: "staff_darren", status: "overdue",
      overall_rating: null, competency_scores: {},
      signed_by_staff: false, next_review_date: null,
      objectives_next_period: null,
      created_at: "2026-04-01T10:00:00Z",
    },
    {
      id: "appr_lackson_annual", staff_id: "staff_lackson",
      appraisal_type: "annual_appraisal", appraisal_date: "2026-02-20",
      appraiser_id: "staff_darren", status: "completed",
      overall_rating: "good",
      competency_scores: {
        safeguarding_and_child_protection: 4,
        therapeutic_relationships: 5,
        trauma_informed_practice: 4,
        risk_management: 3,
        statutory_compliance: 3,
        communication_and_recording: 3,
        leadership_and_supervision: 3,
        self_care_and_resilience: 4,
        learning_and_professional_development: 3,
        equality_diversity_inclusion: 5,
      },
      signed_by_staff: true, next_review_date: "2027-02-20",
      objectives_next_period: "Complete 4 shift lead shadowing sessions",
      created_at: "2026-02-20T10:00:00Z",
    },
    {
      id: "appr_chervelle_mid", staff_id: "staff_chervelle",
      appraisal_type: "mid_year", appraisal_date: "2026-01-15",
      appraiser_id: "staff_darren", status: "completed",
      overall_rating: "outstanding",
      competency_scores: {
        safeguarding_and_child_protection: 5,
        therapeutic_relationships: 4,
        trauma_informed_practice: 4,
        risk_management: 5,
        statutory_compliance: 5,
        communication_and_recording: 5,
        leadership_and_supervision: 4,
        self_care_and_resilience: 4,
        learning_and_professional_development: 4,
        equality_diversity_inclusion: 4,
      },
      signed_by_staff: true, next_review_date: "2026-07-15",
      objectives_next_period: "Lead Reg 45 Q1 2026 submission",
      created_at: "2026-01-15T10:00:00Z",
    },
    {
      id: "appr_diane_prob", staff_id: "staff_diane",
      appraisal_type: "probation_review", appraisal_date: "2026-03-15",
      appraiser_id: "staff_ryan", status: "completed",
      overall_rating: "good",
      competency_scores: {
        safeguarding_and_child_protection: 3,
        therapeutic_relationships: 3,
        trauma_informed_practice: 3,
        risk_management: 2,
        statutory_compliance: 3,
        communication_and_recording: 3,
        self_care_and_resilience: 3,
        learning_and_professional_development: 3,
        equality_diversity_inclusion: 3,
      },
      signed_by_staff: true, next_review_date: "2026-09-15",
      objectives_next_period: "Complete 5 dynamic risk assessments",
      created_at: "2026-03-15T10:00:00Z",
    },
    {
      id: "appr_mirela_sched", staff_id: "staff_mirela",
      appraisal_type: "annual_appraisal", appraisal_date: "2026-05-10",
      appraiser_id: "staff_darren", status: "scheduled",
      overall_rating: null, competency_scores: {},
      signed_by_staff: false, next_review_date: null,
      objectives_next_period: null,
      created_at: "2026-05-10T10:00:00Z",
    },
    {
      id: "appr_lackson_mid_sched", staff_id: "staff_lackson",
      appraisal_type: "mid_year", appraisal_date: "2026-05-20",
      appraiser_id: "staff_darren", status: "scheduled",
      overall_rating: null, competency_scores: {},
      signed_by_staff: false, next_review_date: null,
      objectives_next_period: null,
      created_at: "2026-05-20T10:00:00Z",
    },
  ];

  it("counts 8 total appraisals: 5 completed, 1 overdue, 2 scheduled", () => {
    const r = run(OAK_HOUSE_APPRAISALS);
    expect(r.overview.total_appraisals).toBe(8);
    expect(r.overview.completed).toBe(5);
    expect(r.overview.overdue).toBe(1);
    expect(r.overview.scheduled).toBe(2);
  });

  it("completion rate is 83% (5 completed out of 6 actionable)", () => {
    const r = run(OAK_HOUSE_APPRAISALS);
    expect(r.overview.completion_rate).toBe(83);
  });

  it("compliance rate is 63% (5 staff with completed out of 8 active)", () => {
    const r = run(OAK_HOUSE_APPRAISALS);
    // Ryan, Edward, Lackson, Chervelle, Diane = 5, Darren/Anna/Mirela = 0
    expect(r.overview.compliance_rate).toBe(63);
    expect(r.overview.staff_with_appraisal).toBe(5);
    expect(r.overview.staff_without_appraisal).toBe(3);
  });

  it("rating breakdown shows 1 outstanding, 4 good", () => {
    const r = run(OAK_HOUSE_APPRAISALS);
    const outstanding = r.rating_breakdown.find((b) => b.rating === "outstanding");
    const good = r.rating_breakdown.find((b) => b.rating === "good");
    expect(outstanding?.count).toBe(1);
    expect(good?.count).toBe(4);
  });

  it("generates critical alert for Anna's overdue appraisal", () => {
    const r = run(OAK_HOUSE_APPRAISALS);
    const crit = r.alerts.filter((a) => a.severity === "critical");
    expect(crit.length).toBe(1);
    expect(crit[0].message).toContain("Anna Nowak");
  });

  it("generates high alert for staff without appraisals (Darren, Mirela)", () => {
    const r = run(OAK_HOUSE_APPRAISALS);
    const high = r.alerts.filter((a) => a.severity === "high" && a.message.includes("without a completed appraisal"));
    expect(high.length).toBe(1);
    // Darren and Mirela have no completed appraisal. Anna has overdue but not completed.
    expect(high[0].message).toContain("3 active staff");
  });

  it("risk_management is the lowest-scoring competency domain", () => {
    const r = run(OAK_HOUSE_APPRAISALS);
    // Edward: 2, Diane: 2, Ryan: 4, Lackson: 3, Chervelle: 5 → avg = 3.2
    expect(r.competency_analysis[0].domain).toBe("risk_management");
  });

  it("Anna's profile shows overdue risk flag", () => {
    const r = run(OAK_HOUSE_APPRAISALS);
    const anna = r.staff_profiles.find((p) => p.staff_id === "staff_anna");
    expect(anna?.risk_flags).toContain("overdue");
    expect(anna?.latest_status).toBe("overdue");
  });

  it("Chervelle's profile shows outstanding rating", () => {
    const r = run(OAK_HOUSE_APPRAISALS);
    const chervelle = r.staff_profiles.find((p) => p.staff_id === "staff_chervelle");
    expect(chervelle?.latest_rating).toBe("outstanding");
    expect(chervelle?.risk_flags.length).toBe(0);
  });

  it("generates diverse appraisal types insight (3 types)", () => {
    const r = run(OAK_HOUSE_APPRAISALS);
    // annual_appraisal, probation_review, mid_year = 3 types
    const pos = r.insights.filter((i) => i.severity === "positive" && i.text.includes("3 different appraisal types"));
    expect(pos.length).toBe(1);
  });
});
