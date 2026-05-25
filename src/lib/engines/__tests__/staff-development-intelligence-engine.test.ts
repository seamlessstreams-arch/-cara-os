// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — STAFF DEVELOPMENT INTELLIGENCE ENGINE · TEST SUITE
//
// 50+ tests covering overview calculations, staff profiles, competency domain
// analysis, alert generation, ARIA insights, and Oak House integration.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeStaffDevelopmentIntelligence,
  daysBetween,
  daysUntil,
  average,
  type StaffInput,
  type AppraisalInput,
  type CompetencyProfileInput,
  type QualificationInput,
  type InductionInput,
  type DevelopmentPlanInput,
  type StaffDevelopmentIntelligenceInput,
  type AppraisalType,
  type AppraisalStatus,
  type OverallRating,
  type QualificationStatus,
  type InductionStatus,
  type DevelopmentPlanStatus,
} from "../staff-development-intelligence-engine";

const TODAY = "2026-05-25";

// ── Factory Functions ─────────────────────────────────────────────────────

let _id = 0;
function uid(): string {
  return `test_${++_id}`;
}

function makeStaff(overrides: Partial<StaffInput> = {}): StaffInput {
  const id = uid();
  return {
    id,
    name: `Staff ${id}`,
    role: "Residential Support Worker",
    is_active: true,
    start_date: "2025-06-01",
    ...overrides,
  };
}

function makeAppraisal(
  staff_id: string,
  overrides: Partial<Omit<AppraisalInput, "staff_id">> = {},
): AppraisalInput {
  return {
    id: uid(),
    staff_id,
    appraisal_type: "annual_appraisal",
    appraisal_date: "2026-03-15",
    status: "completed",
    overall_rating: "good",
    competency_scores: {
      safeguarding: 4,
      therapeutic_care: 3,
      professional_development: 4,
      record_keeping: 3,
      teamwork: 4,
    },
    signed_by_staff: true,
    next_review_date: "2027-03-15",
    ...overrides,
  };
}

function makeCompetencyProfile(
  staff_id: string,
  overrides: Partial<Omit<CompetencyProfileInput, "staff_id">> = {},
): CompetencyProfileInput {
  return {
    id: uid(),
    staff_id,
    current_stage: "Residential Support Worker",
    target_stage: "Senior RSW",
    overall_readiness_score: 65,
    strengths: ["Empathy", "Resilience"],
    development_areas: ["Report writing"],
    next_review_date: "2026-09-01",
    ...overrides,
  };
}

function makeQualification(
  staff_id: string,
  overrides: Partial<Omit<QualificationInput, "staff_id">> = {},
): QualificationInput {
  return {
    id: uid(),
    staff_id,
    qualification_name: "Level 3 Diploma in Residential Childcare",
    level: "3",
    mandatory: true,
    status: "completed",
    started_at: "2024-09-01",
    completed_at: "2025-08-01",
    expiry_date: undefined,
    ...overrides,
  };
}

function makeInduction(
  staff_id: string,
  overrides: Partial<Omit<InductionInput, "staff_id">> = {},
): InductionInput {
  return {
    id: uid(),
    staff_id,
    start_date: "2026-01-05",
    target_completion_date: "2026-04-05",
    overall_status: "in_progress",
    total_items: 7,
    completed_items: 5,
    overdue_items: 0,
    probation_passed: false,
    ...overrides,
  };
}

function makeDevelopmentPlan(
  staff_id: string,
  overrides: Partial<Omit<DevelopmentPlanInput, "staff_id">> = {},
): DevelopmentPlanInput {
  return {
    id: uid(),
    staff_id,
    title: "RSW to Senior RSW",
    from_stage: "RSW",
    to_stage: "Senior RSW",
    status: "active",
    total_actions: 5,
    completed_actions: 2,
    ...overrides,
  };
}

function run(
  overrides: Partial<StaffDevelopmentIntelligenceInput> = {},
): ReturnType<typeof computeStaffDevelopmentIntelligence> {
  return computeStaffDevelopmentIntelligence({
    staff: [],
    appraisals: [],
    competency_profiles: [],
    qualifications: [],
    inductions: [],
    development_plans: [],
    today: TODAY,
    ...overrides,
  });
}

// ── Helper Tests ──────────────────────────────────────────────────────────

describe("helpers", () => {
  it("daysBetween returns absolute days", () => {
    expect(daysBetween("2026-01-01", "2026-01-31")).toBe(30);
    expect(daysBetween("2026-01-31", "2026-01-01")).toBe(30);
  });

  it("daysUntil returns signed delta", () => {
    expect(daysUntil("2026-05-01", "2026-05-25")).toBe(24);
    expect(daysUntil("2026-05-25", "2026-05-01")).toBe(-24);
  });

  it("average of empty returns 0", () => {
    expect(average([])).toBe(0);
  });

  it("average computes correctly", () => {
    expect(average([2, 4, 6])).toBe(4);
  });
});

// ── Empty State ───────────────────────────────────────────────────────────

describe("empty state", () => {
  it("returns sensible defaults when no data provided", () => {
    const r = run();
    expect(r.overview.total_staff).toBe(0);
    expect(r.overview.active_staff).toBe(0);
    expect(r.overview.appraisals_completed).toBe(0);
    expect(r.overview.appraisal_completion_rate).toBe(100);
    expect(r.overview.avg_competency_readiness).toBe(0);
    expect(r.overview.mandatory_qual_compliance_rate).toBe(100);
    expect(r.overview.development_plan_progress_rate).toBe(0);
    expect(r.staff_profiles).toHaveLength(0);
    expect(r.competency_analysis).toHaveLength(0);
    expect(r.alerts).toHaveLength(0);
    expect(r.insights).toHaveLength(0);
  });
});

// ── Overview ──────────────────────────────────────────────────────────────

describe("overview", () => {
  it("counts total and active staff correctly", () => {
    const s1 = makeStaff();
    const s2 = makeStaff({ is_active: false });
    const s3 = makeStaff();
    const r = run({ staff: [s1, s2, s3] });
    expect(r.overview.total_staff).toBe(3);
    expect(r.overview.active_staff).toBe(2);
  });

  it("counts appraisals by status", () => {
    const s1 = makeStaff();
    const a1 = makeAppraisal(s1.id, { status: "completed" });
    const a2 = makeAppraisal(s1.id, { status: "overdue" });
    const a3 = makeAppraisal(s1.id, { status: "scheduled" });
    const a4 = makeAppraisal(s1.id, { status: "cancelled" });
    const r = run({ staff: [s1], appraisals: [a1, a2, a3, a4] });
    expect(r.overview.appraisals_completed).toBe(1);
    expect(r.overview.appraisals_overdue).toBe(1);
    expect(r.overview.appraisals_scheduled).toBe(1);
  });

  it("calculates appraisal completion rate as pct of active staff with completed", () => {
    const s1 = makeStaff();
    const s2 = makeStaff();
    const s3 = makeStaff();
    const a1 = makeAppraisal(s1.id);
    // s2 has no appraisal, s3 has one
    const a3 = makeAppraisal(s3.id);
    const r = run({ staff: [s1, s2, s3], appraisals: [a1, a3] });
    // 2 out of 3 = 67%
    expect(r.overview.appraisal_completion_rate).toBe(67);
  });

  it("calculates average competency readiness", () => {
    const s1 = makeStaff();
    const s2 = makeStaff();
    const p1 = makeCompetencyProfile(s1.id, { overall_readiness_score: 80 });
    const p2 = makeCompetencyProfile(s2.id, { overall_readiness_score: 60 });
    const r = run({ staff: [s1, s2], competency_profiles: [p1, p2] });
    expect(r.overview.avg_competency_readiness).toBe(70);
  });

  it("calculates mandatory qualification compliance", () => {
    const s1 = makeStaff();
    const q1 = makeQualification(s1.id, { mandatory: true, status: "completed" });
    const q2 = makeQualification(s1.id, { mandatory: true, status: "in_progress" });
    const q3 = makeQualification(s1.id, { mandatory: false, status: "not_started" });
    const r = run({ staff: [s1], qualifications: [q1, q2, q3] });
    // 1 completed out of 2 mandatory = 50%
    expect(r.overview.mandatory_qual_compliance_rate).toBe(50);
  });

  it("counts qualifications in progress and mandatory not started", () => {
    const s1 = makeStaff();
    const q1 = makeQualification(s1.id, { mandatory: true, status: "not_started" });
    const q2 = makeQualification(s1.id, { mandatory: false, status: "in_progress" });
    const q3 = makeQualification(s1.id, { mandatory: true, status: "in_progress" });
    const r = run({ staff: [s1], qualifications: [q1, q2, q3] });
    expect(r.overview.qualifications_in_progress).toBe(2);
    expect(r.overview.qualifications_not_started).toBe(1);
  });

  it("counts qualifications expiring within 90 days", () => {
    const s1 = makeStaff();
    const q1 = makeQualification(s1.id, {
      status: "completed",
      expiry_date: "2026-07-01", // 37 days from TODAY — within 90
    });
    const q2 = makeQualification(s1.id, {
      status: "completed",
      expiry_date: "2026-12-01", // well past 90 days
    });
    const q3 = makeQualification(s1.id, {
      status: "in_progress",
      expiry_date: "2026-06-01", // within 90 days but not completed
    });
    const r = run({ staff: [s1], qualifications: [q1, q2, q3] });
    expect(r.overview.qualifications_expiring_soon).toBe(1);
  });

  it("counts inductions by status", () => {
    const s1 = makeStaff();
    const s2 = makeStaff();
    const i1 = makeInduction(s1.id, { overall_status: "in_progress" });
    const i2 = makeInduction(s2.id, { overall_status: "completed" });
    const r = run({ staff: [s1, s2], inductions: [i1, i2] });
    expect(r.overview.inductions_in_progress).toBe(1);
    expect(r.overview.inductions_complete).toBe(1);
  });

  it("calculates development plan progress rate as avg of active plans", () => {
    const s1 = makeStaff();
    const s2 = makeStaff();
    const dp1 = makeDevelopmentPlan(s1.id, { total_actions: 10, completed_actions: 5, status: "active" });
    const dp2 = makeDevelopmentPlan(s2.id, { total_actions: 4, completed_actions: 0, status: "active" });
    const dp3 = makeDevelopmentPlan(s2.id, { total_actions: 8, completed_actions: 8, status: "completed" });
    const r = run({ staff: [s1, s2], development_plans: [dp1, dp2, dp3] });
    expect(r.overview.development_plans_active).toBe(2);
    // dp1 = 50%, dp2 = 0% → avg = 25%
    expect(r.overview.development_plan_progress_rate).toBe(25);
  });
});

// ── Staff Profiles ────────────────────────────────────────────────────────

describe("staff profiles", () => {
  it("only includes active staff in profiles", () => {
    const s1 = makeStaff();
    const s2 = makeStaff({ is_active: false });
    const r = run({ staff: [s1, s2] });
    expect(r.staff_profiles).toHaveLength(1);
    expect(r.staff_profiles[0].staff_id).toBe(s1.id);
  });

  it("calculates tenure days from start_date to today", () => {
    const s1 = makeStaff({ start_date: "2025-11-25" }); // 181 days before 2026-05-25
    const r = run({ staff: [s1] });
    expect(r.staff_profiles[0].tenure_days).toBe(181);
  });

  it("picks the latest completed appraisal rating", () => {
    const s1 = makeStaff();
    const a1 = makeAppraisal(s1.id, { appraisal_date: "2025-12-01", overall_rating: "requires_improvement" });
    const a2 = makeAppraisal(s1.id, { appraisal_date: "2026-04-01", overall_rating: "outstanding" });
    const a3 = makeAppraisal(s1.id, { status: "scheduled", appraisal_date: "2026-09-01", overall_rating: undefined });
    const r = run({ staff: [s1], appraisals: [a1, a2, a3] });
    expect(r.staff_profiles[0].latest_appraisal_rating).toBe("outstanding");
    expect(r.staff_profiles[0].latest_appraisal_date).toBe("2026-04-01");
  });

  it("marks appraisal_overdue when any appraisal for staff is overdue", () => {
    const s1 = makeStaff();
    const a1 = makeAppraisal(s1.id);
    const a2 = makeAppraisal(s1.id, { status: "overdue" });
    const r = run({ staff: [s1], appraisals: [a1, a2] });
    expect(r.staff_profiles[0].appraisal_overdue).toBe(true);
  });

  it("calculates avg competency score from latest completed appraisal", () => {
    const s1 = makeStaff();
    const a1 = makeAppraisal(s1.id, {
      competency_scores: { a: 2, b: 4, c: 3 },
    });
    const r = run({ staff: [s1], appraisals: [a1] });
    // (2+4+3)/3 = 3.0
    expect(r.staff_profiles[0].avg_competency_score).toBe(3);
  });

  it("returns 0 avg competency when no completed appraisals", () => {
    const s1 = makeStaff();
    const a1 = makeAppraisal(s1.id, { status: "scheduled" });
    const r = run({ staff: [s1], appraisals: [a1] });
    expect(r.staff_profiles[0].avg_competency_score).toBe(0);
  });

  it("picks readiness score from competency profile", () => {
    const s1 = makeStaff();
    const p = makeCompetencyProfile(s1.id, { overall_readiness_score: 88 });
    const r = run({ staff: [s1], competency_profiles: [p] });
    expect(r.staff_profiles[0].readiness_score).toBe(88);
  });

  it("returns 0 readiness when no competency profile exists", () => {
    const s1 = makeStaff();
    const r = run({ staff: [s1] });
    expect(r.staff_profiles[0].readiness_score).toBe(0);
  });

  it("calculates mandatory qualification compliance per staff", () => {
    const s1 = makeStaff();
    const q1 = makeQualification(s1.id, { mandatory: true, status: "completed" });
    const q2 = makeQualification(s1.id, { mandatory: true, status: "in_progress" });
    const q3 = makeQualification(s1.id, { mandatory: false, status: "not_started" });
    const r = run({ staff: [s1], qualifications: [q1, q2, q3] });
    const p = r.staff_profiles[0];
    expect(p.mandatory_quals_total).toBe(2);
    expect(p.mandatory_quals_completed).toBe(1);
    expect(p.mandatory_qual_compliant).toBe(false);
  });

  it("marks mandatory_qual_compliant true when all mandatory completed", () => {
    const s1 = makeStaff();
    const q1 = makeQualification(s1.id, { mandatory: true, status: "completed" });
    const r = run({ staff: [s1], qualifications: [q1] });
    expect(r.staff_profiles[0].mandatory_qual_compliant).toBe(true);
  });

  it("marks mandatory_qual_compliant true when no mandatory quals", () => {
    const s1 = makeStaff();
    const q1 = makeQualification(s1.id, { mandatory: false });
    const r = run({ staff: [s1], qualifications: [q1] });
    expect(r.staff_profiles[0].mandatory_qual_compliant).toBe(true);
  });

  it("tracks active development plan and progress", () => {
    const s1 = makeStaff();
    const dp = makeDevelopmentPlan(s1.id, { total_actions: 8, completed_actions: 6, status: "active" });
    const r = run({ staff: [s1], development_plans: [dp] });
    const p = r.staff_profiles[0];
    expect(p.has_active_development_plan).toBe(true);
    expect(p.development_plan_progress).toBe(75);
  });

  it("returns 0 progress when no active plan", () => {
    const s1 = makeStaff();
    const dp = makeDevelopmentPlan(s1.id, { status: "completed" });
    const r = run({ staff: [s1], development_plans: [dp] });
    const p = r.staff_profiles[0];
    expect(p.has_active_development_plan).toBe(false);
    expect(p.development_plan_progress).toBe(0);
  });

  it("maps induction status correctly", () => {
    const s1 = makeStaff();
    const ind = makeInduction(s1.id, { overall_status: "completed" });
    const r = run({ staff: [s1], inductions: [ind] });
    expect(r.staff_profiles[0].induction_status).toBe("completed");
  });

  it("returns not_applicable when no induction record", () => {
    const s1 = makeStaff();
    const r = run({ staff: [s1] });
    expect(r.staff_profiles[0].induction_status).toBe("not_applicable");
  });

  it("uses role as current_stage when no competency profile exists", () => {
    const s1 = makeStaff({ role: "Deputy Manager" });
    const r = run({ staff: [s1] });
    expect(r.staff_profiles[0].current_stage).toBe("Deputy Manager");
    expect(r.staff_profiles[0].target_stage).toBeUndefined();
  });

  it("uses competency profile stages when available", () => {
    const s1 = makeStaff({ role: "RSW" });
    const p = makeCompetencyProfile(s1.id, { current_stage: "RSW", target_stage: "Team Leader" });
    const r = run({ staff: [s1], competency_profiles: [p] });
    expect(r.staff_profiles[0].current_stage).toBe("RSW");
    expect(r.staff_profiles[0].target_stage).toBe("Team Leader");
  });
});

// ── Risk Flags ────────────────────────────────────────────────────────────

describe("risk flags", () => {
  it("flags appraisal overdue", () => {
    const s1 = makeStaff();
    const a = makeAppraisal(s1.id, { status: "overdue" });
    const r = run({ staff: [s1], appraisals: [a] });
    expect(r.staff_profiles[0].risk_flags).toContain("Appraisal overdue");
  });

  it("flags mandatory qualification gap", () => {
    const s1 = makeStaff();
    const q = makeQualification(s1.id, { mandatory: true, status: "not_started" });
    const r = run({ staff: [s1], qualifications: [q] });
    expect(r.staff_profiles[0].risk_flags).toContain("Mandatory qualification gap");
  });

  it("flags expired qualification", () => {
    const s1 = makeStaff();
    const q = makeQualification(s1.id, {
      status: "completed",
      expiry_date: "2026-04-01", // expired before TODAY
    });
    const r = run({ staff: [s1], qualifications: [q] });
    expect(r.staff_profiles[0].risk_flags).toContain("Expired qualification");
  });

  it("does NOT flag expired if expiry is in the future", () => {
    const s1 = makeStaff();
    const q = makeQualification(s1.id, {
      status: "completed",
      expiry_date: "2027-01-01",
    });
    const r = run({ staff: [s1], qualifications: [q] });
    expect(r.staff_profiles[0].risk_flags).not.toContain("Expired qualification");
  });

  it("flags overdue induction items", () => {
    const s1 = makeStaff();
    const ind = makeInduction(s1.id, { overall_status: "in_progress", overdue_items: 2 });
    const r = run({ staff: [s1], inductions: [ind] });
    expect(r.staff_profiles[0].risk_flags).toContain("Overdue induction items");
  });

  it("does NOT flag induction items if not in_progress", () => {
    const s1 = makeStaff();
    const ind = makeInduction(s1.id, { overall_status: "completed", overdue_items: 0 });
    const r = run({ staff: [s1], inductions: [ind] });
    expect(r.staff_profiles[0].risk_flags).not.toContain("Overdue induction items");
  });

  it("flags requires_improvement rating", () => {
    const s1 = makeStaff();
    const a = makeAppraisal(s1.id, { overall_rating: "requires_improvement" });
    const r = run({ staff: [s1], appraisals: [a] });
    expect(r.staff_profiles[0].risk_flags).toContain("Requires improvement rating");
  });

  it("flags inadequate rating", () => {
    const s1 = makeStaff();
    const a = makeAppraisal(s1.id, { overall_rating: "inadequate" });
    const r = run({ staff: [s1], appraisals: [a] });
    expect(r.staff_profiles[0].risk_flags).toContain("Inadequate rating");
  });

  it("flags no completed appraisal for 6+ months tenure", () => {
    const s1 = makeStaff({ start_date: "2025-06-01" }); // ~359 days
    const r = run({ staff: [s1] });
    expect(r.staff_profiles[0].risk_flags).toContain("No completed appraisal (6+ months employed)");
  });

  it("does NOT flag no appraisal for recently started staff", () => {
    const s1 = makeStaff({ start_date: "2026-03-01" }); // ~85 days, under 180
    const r = run({ staff: [s1] });
    expect(r.staff_profiles[0].risk_flags).not.toContain("No completed appraisal (6+ months employed)");
  });
});

// ── Competency Domain Analysis ────────────────────────────────────────────

describe("competency domain analysis", () => {
  it("aggregates scores across completed appraisals by domain", () => {
    const s1 = makeStaff();
    const s2 = makeStaff();
    const a1 = makeAppraisal(s1.id, { competency_scores: { safeguarding: 5, teamwork: 3 } });
    const a2 = makeAppraisal(s2.id, { competency_scores: { safeguarding: 3, teamwork: 5 } });
    const r = run({ staff: [s1, s2], appraisals: [a1, a2] });
    expect(r.competency_analysis).toHaveLength(2);
    const sg = r.competency_analysis.find((d) => d.domain === "safeguarding")!;
    expect(sg.avg_score).toBe(4);
    expect(sg.min_score).toBe(3);
    expect(sg.max_score).toBe(5);
    expect(sg.staff_count).toBe(2);
  });

  it("sorts domains weakest first", () => {
    const s1 = makeStaff();
    const a1 = makeAppraisal(s1.id, {
      competency_scores: { alpha: 5, beta: 2, gamma: 3 },
    });
    const r = run({ staff: [s1], appraisals: [a1] });
    expect(r.competency_analysis[0].domain).toBe("beta");
    expect(r.competency_analysis[2].domain).toBe("alpha");
  });

  it("excludes non-completed appraisals from domain analysis", () => {
    const s1 = makeStaff();
    const a1 = makeAppraisal(s1.id, { status: "scheduled", competency_scores: { x: 5 } });
    const r = run({ staff: [s1], appraisals: [a1] });
    expect(r.competency_analysis).toHaveLength(0);
  });
});

// ── Alerts ────────────────────────────────────────────────────────────────

describe("alerts", () => {
  it("critical: overdue appraisals", () => {
    const s1 = makeStaff({ name: "Ryan Thompson" });
    const a1 = makeAppraisal(s1.id, { status: "overdue" });
    const r = run({ staff: [s1], appraisals: [a1] });
    const alert = r.alerts.find((a) => a.severity === "critical" && a.message.includes("overdue appraisal"));
    expect(alert).toBeDefined();
    expect(alert!.message).toContain("Ryan Thompson");
    expect(alert!.message).toContain("Reg 33");
  });

  it("critical: mandatory qual gaps after 6+ months", () => {
    const s1 = makeStaff({ name: "Edward Brown", start_date: "2025-06-01" }); // >180d
    const q = makeQualification(s1.id, { mandatory: true, status: "not_started" });
    const r = run({ staff: [s1], qualifications: [q] });
    const alert = r.alerts.find((a) => a.severity === "critical" && a.message.includes("mandatory qualification gaps"));
    expect(alert).toBeDefined();
    expect(alert!.message).toContain("Edward Brown");
    expect(alert!.message).toContain("Reg 32");
  });

  it("no critical qual alert for short-tenured staff", () => {
    const s1 = makeStaff({ start_date: "2026-04-01" }); // <180d
    const q = makeQualification(s1.id, { mandatory: true, status: "not_started" });
    const r = run({ staff: [s1], qualifications: [q] });
    const alert = r.alerts.find((a) => a.severity === "critical" && a.message.includes("mandatory qualification gaps"));
    expect(alert).toBeUndefined();
  });

  it("high: expired qualifications", () => {
    const s1 = makeStaff();
    const q = makeQualification(s1.id, {
      status: "completed",
      expiry_date: "2026-03-01", // expired
    });
    const r = run({ staff: [s1], qualifications: [q] });
    const alert = r.alerts.find((a) => a.severity === "high" && a.message.includes("expired"));
    expect(alert).toBeDefined();
    expect(alert!.message).toContain("SCR");
  });

  it("high: staff with 6+ months but no completed appraisal", () => {
    const s1 = makeStaff({ name: "Anna Test", start_date: "2025-06-01" });
    const r = run({ staff: [s1] });
    const alert = r.alerts.find((a) => a.severity === "high" && a.message.includes("without a completed appraisal"));
    expect(alert).toBeDefined();
    expect(alert!.message).toContain("Anna Test");
  });

  it("medium: qualifications expiring within 90 days", () => {
    const s1 = makeStaff();
    const q = makeQualification(s1.id, {
      status: "completed",
      expiry_date: "2026-07-15", // 51 days from TODAY
    });
    const r = run({ staff: [s1], qualifications: [q] });
    const alert = r.alerts.find((a) => a.severity === "medium" && a.message.includes("expiring within 90 days"));
    expect(alert).toBeDefined();
  });

  it("medium: inductions with overdue items", () => {
    const s1 = makeStaff();
    const ind = makeInduction(s1.id, { overall_status: "in_progress", overdue_items: 3 });
    const r = run({ staff: [s1], inductions: [ind] });
    const alert = r.alerts.find((a) => a.severity === "medium" && a.message.includes("overdue items"));
    expect(alert).toBeDefined();
    expect(alert!.message).toContain("Reg 33");
  });

  it("low: active development plans with <25% progress", () => {
    const s1 = makeStaff();
    const dp = makeDevelopmentPlan(s1.id, { total_actions: 10, completed_actions: 1, status: "active" });
    const r = run({ staff: [s1], development_plans: [dp] });
    const alert = r.alerts.find((a) => a.severity === "low" && a.message.includes("less than 25%"));
    expect(alert).toBeDefined();
  });

  it("no low alert when plans have >25% progress", () => {
    const s1 = makeStaff();
    const dp = makeDevelopmentPlan(s1.id, { total_actions: 4, completed_actions: 2, status: "active" });
    const r = run({ staff: [s1], development_plans: [dp] });
    const alert = r.alerts.find((a) => a.severity === "low" && a.message.includes("less than 25%"));
    expect(alert).toBeUndefined();
  });
});

// ── ARIA Insights ─────────────────────────────────────────────────────────

describe("ARIA insights", () => {
  it("critical: overdue appraisals", () => {
    const s1 = makeStaff();
    const a = makeAppraisal(s1.id, { status: "overdue" });
    const r = run({ staff: [s1], appraisals: [a] });
    const insight = r.insights.find((i) => i.severity === "critical" && i.text.includes("overdue"));
    expect(insight).toBeDefined();
    expect(insight!.text).toContain("SCCIF");
  });

  it("warning: low appraisal completion rate", () => {
    const s1 = makeStaff();
    const s2 = makeStaff();
    const s3 = makeStaff();
    // Only s1 has a completed appraisal → 33%
    const a = makeAppraisal(s1.id);
    const r = run({ staff: [s1, s2, s3], appraisals: [a] });
    const insight = r.insights.find((i) => i.severity === "warning" && i.text.includes("33%"));
    expect(insight).toBeDefined();
  });

  it("warning: low mandatory qualification compliance", () => {
    const s1 = makeStaff();
    const q1 = makeQualification(s1.id, { mandatory: true, status: "not_started" });
    const q2 = makeQualification(s1.id, { mandatory: true, status: "completed" });
    const q3 = makeQualification(s1.id, { mandatory: true, status: "in_progress" });
    // 1/3 = 33%
    const r = run({ staff: [s1], qualifications: [q1, q2, q3] });
    const insight = r.insights.find((i) => i.severity === "warning" && i.text.includes("qualification compliance"));
    expect(insight).toBeDefined();
    expect(insight!.text).toContain("33%");
  });

  it("warning: weak competency domains below 3/5", () => {
    const s1 = makeStaff();
    const a = makeAppraisal(s1.id, {
      competency_scores: { safeguarding: 2, record_keeping: 2.5, teamwork: 4 },
    });
    const r = run({ staff: [s1], appraisals: [a] });
    const insight = r.insights.find((i) => i.severity === "warning" && i.text.includes("weakness"));
    expect(insight).toBeDefined();
    expect(insight!.text).toContain("safeguarding");
    expect(insight!.text).toContain("record keeping");
  });

  it("positive: 100% appraisal completion", () => {
    const s1 = makeStaff();
    const s2 = makeStaff();
    const a1 = makeAppraisal(s1.id);
    const a2 = makeAppraisal(s2.id);
    const r = run({ staff: [s1, s2], appraisals: [a1, a2] });
    const insight = r.insights.find((i) => i.severity === "positive" && i.text.includes("All 2 active staff"));
    expect(insight).toBeDefined();
    expect(insight!.text).toContain("SCCIF");
  });

  it("positive: high average readiness (>=70%)", () => {
    const s1 = makeStaff();
    const s2 = makeStaff();
    const p1 = makeCompetencyProfile(s1.id, { overall_readiness_score: 80 });
    const p2 = makeCompetencyProfile(s2.id, { overall_readiness_score: 75 });
    const r = run({ staff: [s1, s2], competency_profiles: [p1, p2] });
    const insight = r.insights.find((i) => i.severity === "positive" && i.text.includes("readiness"));
    expect(insight).toBeDefined();
    expect(insight!.text).toContain("78%");
  });

  it("positive: 2+ active development plans", () => {
    const s1 = makeStaff();
    const s2 = makeStaff();
    const dp1 = makeDevelopmentPlan(s1.id, { status: "active" });
    const dp2 = makeDevelopmentPlan(s2.id, { status: "active" });
    const r = run({ staff: [s1, s2], development_plans: [dp1, dp2] });
    const insight = r.insights.find((i) => i.severity === "positive" && i.text.includes("development plans"));
    expect(insight).toBeDefined();
    expect(insight!.text).toContain("2 active");
  });

  it("positive: 100% mandatory qualification compliance", () => {
    const s1 = makeStaff();
    const q1 = makeQualification(s1.id, { mandatory: true, status: "completed" });
    const q2 = makeQualification(s1.id, { mandatory: true, status: "completed" });
    const r = run({ staff: [s1], qualifications: [q1, q2] });
    const insight = r.insights.find((i) => i.severity === "positive" && i.text.includes("100% mandatory qualification"));
    expect(insight).toBeDefined();
  });

  it("positive: succession pipeline with 2+ targets", () => {
    const s1 = makeStaff();
    const s2 = makeStaff();
    const p1 = makeCompetencyProfile(s1.id, { target_stage: "Senior RSW" });
    const p2 = makeCompetencyProfile(s2.id, { target_stage: "Team Leader" });
    const r = run({ staff: [s1, s2], competency_profiles: [p1, p2] });
    const insight = r.insights.find((i) => i.severity === "positive" && i.text.includes("succession"));
    expect(insight).toBeDefined();
  });

  it("no positive appraisal insight when rate is not 100%", () => {
    const s1 = makeStaff();
    const s2 = makeStaff();
    // Only s1 has a completed appraisal
    const a = makeAppraisal(s1.id);
    const r = run({ staff: [s1, s2], appraisals: [a] });
    const insight = r.insights.find((i) => i.severity === "positive" && i.text.includes("All"));
    expect(insight).toBeUndefined();
  });
});

// ── Oak House Integration ────────────────────────────────────────────────

describe("Oak House integration scenario", () => {
  it("processes a realistic Oak House workforce dataset correctly", () => {
    // Staff members at Oak House
    const darren = makeStaff({ id: "darren", name: "Darren Laville", role: "Registered Manager", start_date: "2024-01-15" });
    const ryan = makeStaff({ id: "ryan", name: "Ryan Thompson", role: "Deputy Manager", start_date: "2024-06-01" });
    const edward = makeStaff({ id: "edward", name: "Edward Brown", role: "Residential Support Worker", start_date: "2025-01-10" });
    const anna = makeStaff({ id: "anna", name: "Anna Kowalska", role: "Residential Support Worker", start_date: "2024-09-01" });
    const lackson = makeStaff({ id: "lackson", name: "Lackson Banda", role: "Residential Support Worker", start_date: "2024-11-01" });
    const chervelle = makeStaff({ id: "chervelle", name: "Chervelle Harris", role: "Residential Support Worker", start_date: "2024-08-01" });
    const diane = makeStaff({ id: "diane", name: "Diane McCarthy", role: "Residential Support Worker", start_date: "2026-01-05" });
    const alex = makeStaff({ id: "alex", name: "Alex Bennett", role: "Residential Support Worker", start_date: "2026-02-01" });

    const allStaff = [darren, ryan, edward, anna, lackson, chervelle, diane, alex];

    // Appraisals
    const appraisals = [
      makeAppraisal("ryan", {
        appraisal_type: "annual_appraisal",
        appraisal_date: "2026-02-15",
        overall_rating: "good",
        competency_scores: {
          safeguarding: 4, therapeutic_care: 4, professional_development: 4,
          record_keeping: 3, teamwork: 5, leadership: 4, behaviour_management: 4,
          risk_assessment: 4, communication: 5, emotional_resilience: 4,
        },
      }),
      makeAppraisal("edward", {
        appraisal_type: "probation_review",
        appraisal_date: "2026-01-15",
        overall_rating: "good",
        competency_scores: {
          safeguarding: 3, therapeutic_care: 3, professional_development: 3,
          record_keeping: 3, teamwork: 4, behaviour_management: 3,
          risk_assessment: 3, communication: 4, emotional_resilience: 3,
        },
      }),
      makeAppraisal("anna", { status: "overdue", overall_rating: undefined, competency_scores: {} }),
      makeAppraisal("lackson", {
        appraisal_date: "2026-03-01",
        overall_rating: "good",
        competency_scores: {
          safeguarding: 4, therapeutic_care: 3, professional_development: 4,
          record_keeping: 3, teamwork: 4, leadership: 3, behaviour_management: 4,
          risk_assessment: 4, communication: 4, emotional_resilience: 4,
        },
      }),
      makeAppraisal("chervelle", {
        appraisal_type: "mid_year",
        appraisal_date: "2026-04-01",
        overall_rating: "outstanding",
        competency_scores: {
          safeguarding: 5, therapeutic_care: 5, professional_development: 4,
          record_keeping: 4, teamwork: 5, behaviour_management: 5,
          risk_assessment: 4, communication: 5, emotional_resilience: 5,
        },
      }),
      makeAppraisal("diane", {
        appraisal_type: "probation_review",
        appraisal_date: "2026-04-05",
        overall_rating: "good",
        competency_scores: {
          safeguarding: 3, therapeutic_care: 3, professional_development: 3,
          record_keeping: 3, teamwork: 4, behaviour_management: 3,
          risk_assessment: 3, communication: 3, emotional_resilience: 3,
        },
      }),
    ];

    // Competency profiles
    const competencyProfiles = [
      makeCompetencyProfile("darren", {
        current_stage: "Registered Manager",
        target_stage: undefined,
        overall_readiness_score: 91,
        strengths: ["Strategic leadership", "Regulatory compliance"],
        development_areas: ["Advanced therapeutic modalities"],
      }),
      makeCompetencyProfile("ryan", {
        current_stage: "Deputy Manager",
        target_stage: "Registered Manager",
        overall_readiness_score: 74,
        strengths: ["Team management", "Safeguarding"],
        development_areas: ["Level 5 completion", "Budget management"],
      }),
      makeCompetencyProfile("edward", {
        current_stage: "RSW",
        target_stage: "Senior RSW",
        overall_readiness_score: 62,
        strengths: ["Engagement with young people"],
        development_areas: ["Report writing", "Risk assessment"],
      }),
      makeCompetencyProfile("lackson", {
        current_stage: "RSW",
        target_stage: "Team Leader",
        overall_readiness_score: 68,
        strengths: ["Behaviour management", "Reliability"],
        development_areas: ["Leadership skills", "Mentoring"],
      }),
      makeCompetencyProfile("anna", {
        current_stage: "RSW",
        target_stage: "Senior RSW",
        overall_readiness_score: 58,
        strengths: ["Empathy"],
        development_areas: ["Time management", "Record keeping"],
      }),
    ];

    // Qualifications
    const qualifications = [
      makeQualification("darren", { qualification_name: "Level 5 Diploma", level: "5", mandatory: true, status: "in_progress" }),
      makeQualification("darren", { qualification_name: "DBS Enhanced", mandatory: true, status: "completed", expiry_date: "2027-01-15" }),
      makeQualification("ryan", { qualification_name: "Level 5 Diploma", level: "5", mandatory: true, status: "in_progress" }),
      makeQualification("ryan", { qualification_name: "Level 3 Diploma", level: "3", mandatory: true, status: "completed" }),
      makeQualification("ryan", { qualification_name: "DBS Enhanced", mandatory: true, status: "completed", expiry_date: "2027-06-01" }),
      makeQualification("edward", { qualification_name: "Level 3 Diploma", level: "3", mandatory: true, status: "in_progress" }),
      makeQualification("edward", { qualification_name: "DBS Enhanced", mandatory: true, status: "completed", expiry_date: "2027-01-10" }),
      makeQualification("anna", { qualification_name: "Level 3 Diploma", level: "3", mandatory: true, status: "not_started" }),
      makeQualification("anna", { qualification_name: "DBS Enhanced", mandatory: true, status: "completed", expiry_date: "2026-09-01" }),
      makeQualification("lackson", { qualification_name: "Level 3 Diploma", level: "3", mandatory: true, status: "in_progress" }),
      makeQualification("chervelle", { qualification_name: "Level 3 Diploma", level: "3", mandatory: true, status: "completed" }),
      makeQualification("diane", { qualification_name: "Level 3 Diploma", level: "3", mandatory: true, status: "not_started" }),
    ];

    // Inductions
    const inductionDiane = makeInduction("diane", {
      overall_status: "completed",
      total_items: 7,
      completed_items: 7,
      overdue_items: 0,
      probation_passed: true,
    });
    const inductionAlex = makeInduction("alex", {
      overall_status: "in_progress",
      total_items: 7,
      completed_items: 6,
      overdue_items: 1,
    });

    // Development plans
    const dpRyan = makeDevelopmentPlan("ryan", {
      title: "RM Readiness Programme",
      from_stage: "Deputy Manager",
      to_stage: "Registered Manager",
      status: "active",
      total_actions: 5,
      completed_actions: 1,
    });
    const dpEdward = makeDevelopmentPlan("edward", {
      title: "Senior RSW Development",
      from_stage: "RSW",
      to_stage: "Senior RSW",
      status: "active",
      total_actions: 4,
      completed_actions: 1,
    });

    const r = run({
      staff: allStaff,
      appraisals,
      competency_profiles: competencyProfiles,
      qualifications,
      inductions: [inductionDiane, inductionAlex],
      development_plans: [dpRyan, dpEdward],
    });

    // ── Overview assertions ──────────────────────────────────────────────
    expect(r.overview.total_staff).toBe(8);
    expect(r.overview.active_staff).toBe(8);
    expect(r.overview.appraisals_completed).toBe(5); // ryan, edward, lackson, chervelle, diane
    expect(r.overview.appraisals_overdue).toBe(1); // anna
    expect(r.overview.development_plans_active).toBe(2);

    // Appraisal completion: 5 staff (ryan, edward, lackson, chervelle, diane) out of 8 = 63%
    expect(r.overview.appraisal_completion_rate).toBe(63);

    // Avg readiness: (91+74+62+68+58)/5 = 70.6 → 71
    expect(r.overview.avg_competency_readiness).toBe(71);

    // Inductions
    expect(r.overview.inductions_complete).toBe(1);
    expect(r.overview.inductions_in_progress).toBe(1);

    // ── Staff profiles ──────────────────────────────────────────────────
    expect(r.staff_profiles).toHaveLength(8);

    const annaProfile = r.staff_profiles.find((p) => p.staff_id === "anna")!;
    expect(annaProfile.appraisal_overdue).toBe(true);
    expect(annaProfile.risk_flags).toContain("Appraisal overdue");
    expect(annaProfile.risk_flags).toContain("Mandatory qualification gap");

    const chervProfile = r.staff_profiles.find((p) => p.staff_id === "chervelle")!;
    expect(chervProfile.latest_appraisal_rating).toBe("outstanding");
    expect(chervProfile.mandatory_qual_compliant).toBe(true);

    const ryanProfile = r.staff_profiles.find((p) => p.staff_id === "ryan")!;
    expect(ryanProfile.has_active_development_plan).toBe(true);
    expect(ryanProfile.development_plan_progress).toBe(20); // 1/5

    const alexProfile = r.staff_profiles.find((p) => p.staff_id === "alex")!;
    expect(alexProfile.induction_status).toBe("in_progress");
    expect(alexProfile.risk_flags).toContain("Overdue induction items");

    // ── Competency analysis ─────────────────────────────────────────────
    // Domains come from completed appraisals only (5 people)
    expect(r.competency_analysis.length).toBeGreaterThan(0);
    // record_keeping appears in multiple appraisals with score 3 a lot → weakest
    const recordKeeping = r.competency_analysis.find((d) => d.domain === "record_keeping");
    expect(recordKeeping).toBeDefined();

    // ── Alerts ─────────────────────────────────────────────────────────
    // Critical: Anna overdue appraisal
    expect(r.alerts.some((a) => a.severity === "critical" && a.message.includes("Anna Kowalska"))).toBe(true);

    // Medium: induction with overdue items (Alex)
    expect(r.alerts.some((a) => a.severity === "medium" && a.message.includes("overdue items"))).toBe(true);

    // Low: development plans <25% (Ryan 20%, Edward 25%)
    expect(r.alerts.some((a) => a.severity === "low" && a.message.includes("less than 25%"))).toBe(true);

    // ── ARIA Insights ──────────────────────────────────────────────────
    // 2 active dev plans → positive succession/development insight
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("development plans"))).toBe(true);

    // 4 staff with targets → succession pipeline insight
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("succession"))).toBe(true);

    // Avg readiness 71% → positive readiness insight
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("readiness"))).toBe(true);
  });
});
