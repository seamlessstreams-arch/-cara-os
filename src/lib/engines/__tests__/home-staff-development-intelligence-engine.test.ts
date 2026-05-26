// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME STAFF DEVELOPMENT INTELLIGENCE ENGINE TESTS
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeHomeStaffDevelopment,
  type HomeStaffDevelopmentInput,
  type SupervisionInput,
  type TrainingRecordInput,
  type QualificationInput,
  type InductionInput,
  type StaffMemberInput,
} from "../home-staff-development-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeStaff(overrides: Partial<StaffMemberInput> = {}): StaffMemberInput {
  return { id: "staff_1", name: "Edward Fitzpatrick", role: "residential_care_worker", ...overrides };
}

function makeSupervision(overrides: Partial<SupervisionInput> = {}): SupervisionInput {
  return {
    id: "sup_1",
    staff_id: "staff_1",
    supervisor_id: "sup_1",
    type: "formal",
    scheduled_date: "2026-05-10",
    actual_date: "2026-05-10",
    status: "completed",
    duration_minutes: 60,
    wellbeing_score: 7,
    staff_signature: true,
    supervisor_signature: true,
    actions_count: 2,
    next_date: "2026-06-07",
    ...overrides,
  };
}

function makeTraining(overrides: Partial<TrainingRecordInput> = {}): TrainingRecordInput {
  return {
    id: "tr_1",
    staff_id: "staff_1",
    course_name: "Safeguarding Level 3",
    category: "safeguarding",
    completed_date: "2026-04-26",
    expiry_date: "2027-04-26",
    status: "compliant",
    is_mandatory: true,
    ...overrides,
  };
}

function makeQualification(overrides: Partial<QualificationInput> = {}): QualificationInput {
  return {
    id: "qual_1",
    staff_id: "staff_1",
    qualification_name: "Level 3 Diploma",
    status: "in_progress",
    is_mandatory: true,
    expiry_date: null,
    completed_at: null,
    ...overrides,
  };
}

function makeInduction(overrides: Partial<InductionInput> = {}): InductionInput {
  return {
    id: "induct_1",
    staff_id: "staff_1",
    overall_status: "completed",
    target_completion_date: "2026-03-01",
    total_items: 7,
    completed_items: 7,
    probation_passed: true,
    ...overrides,
  };
}

function baseInput(overrides: Partial<HomeStaffDevelopmentInput> = {}): HomeStaffDevelopmentInput {
  return {
    today: "2026-05-26",
    staff: [
      makeStaff({ id: "staff_1", name: "Edward" }),
      makeStaff({ id: "staff_2", name: "Anna" }),
      makeStaff({ id: "staff_3", name: "Lackson" }),
    ],
    supervisions: [
      makeSupervision({ id: "s1", staff_id: "staff_1", scheduled_date: "2026-05-10", actual_date: "2026-05-10" }),
      makeSupervision({ id: "s2", staff_id: "staff_2", scheduled_date: "2026-05-03", actual_date: "2026-05-03" }),
      makeSupervision({ id: "s3", staff_id: "staff_3", scheduled_date: "2026-04-28", actual_date: "2026-04-28" }),
    ],
    training_records: [
      makeTraining({ id: "t1", staff_id: "staff_1" }),
      makeTraining({ id: "t2", staff_id: "staff_2" }),
      makeTraining({ id: "t3", staff_id: "staff_3" }),
    ],
    qualifications: [
      makeQualification({ id: "q1", staff_id: "staff_1" }),
      makeQualification({ id: "q2", staff_id: "staff_2" }),
    ],
    inductions: [
      makeInduction({ id: "i1", staff_id: "staff_1" }),
    ],
    ...overrides,
  };
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("Home Staff Development Intelligence Engine", () => {

  // ── Structure ─────────────────────────────────────────────────────────────

  it("returns a well-shaped result", () => {
    const r = computeHomeStaffDevelopment(baseInput());
    expect(r).toHaveProperty("staff_development_rating");
    expect(r).toHaveProperty("staff_development_score");
    expect(r).toHaveProperty("headline");
    expect(r).toHaveProperty("supervision");
    expect(r).toHaveProperty("training");
    expect(r).toHaveProperty("qualifications");
    expect(r).toHaveProperty("inductions");
    expect(r).toHaveProperty("strengths");
    expect(r).toHaveProperty("concerns");
    expect(r).toHaveProperty("recommendations");
    expect(r).toHaveProperty("insights");
  });

  it("assigns a valid rating", () => {
    const r = computeHomeStaffDevelopment(baseInput());
    expect(["outstanding", "good", "adequate", "inadequate", "insufficient_data"]).toContain(r.staff_development_rating);
  });

  it("scores between 0 and 100", () => {
    const r = computeHomeStaffDevelopment(baseInput());
    expect(r.staff_development_score).toBeGreaterThanOrEqual(0);
    expect(r.staff_development_score).toBeLessThanOrEqual(100);
  });

  // ── Insufficient Data ─────────────────────────────────────────────────────

  it("returns insufficient_data when fewer than 3 records", () => {
    const r = computeHomeStaffDevelopment(baseInput({
      supervisions: [makeSupervision()],
      training_records: [],
      qualifications: [],
      inductions: [],
    }));
    expect(r.staff_development_rating).toBe("insufficient_data");
    expect(r.staff_development_score).toBe(0);
  });

  // ── Supervision Profile ───────────────────────────────────────────────────

  it("counts completed supervisions in 6 months", () => {
    const r = computeHomeStaffDevelopment(baseInput());
    expect(r.supervision.total_completed_6m).toBe(3);
  });

  it("calculates supervision completion rate", () => {
    const r = computeHomeStaffDevelopment(baseInput({
      supervisions: [
        makeSupervision({ id: "s1", scheduled_date: "2026-05-10", status: "completed", actual_date: "2026-05-10" }),
        makeSupervision({ id: "s2", scheduled_date: "2026-04-10", status: "scheduled", actual_date: null }),
      ],
    }));
    expect(r.supervision.completion_rate_6m).toBe(50);
  });

  it("detects overdue supervisions by status", () => {
    const r = computeHomeStaffDevelopment(baseInput({
      supervisions: [
        makeSupervision({ id: "s1", status: "overdue", scheduled_date: "2026-04-01" }),
        makeSupervision({ id: "s2", status: "completed" }),
      ],
    }));
    expect(r.supervision.overdue_count).toBe(1);
  });

  it("detects scheduled supervisions past due date as overdue", () => {
    const r = computeHomeStaffDevelopment(baseInput({
      supervisions: [
        makeSupervision({ id: "s1", status: "scheduled", scheduled_date: "2026-05-01", actual_date: null }),
      ],
    }));
    expect(r.supervision.overdue_count).toBe(1);
  });

  it("calculates average wellbeing score", () => {
    const r = computeHomeStaffDevelopment(baseInput({
      supervisions: [
        makeSupervision({ id: "s1", wellbeing_score: 8 }),
        makeSupervision({ id: "s2", wellbeing_score: 6 }),
      ],
    }));
    expect(r.supervision.avg_wellbeing_score).toBe(7);
  });

  it("identifies staff with low wellbeing scores", () => {
    const r = computeHomeStaffDevelopment(baseInput({
      supervisions: [
        makeSupervision({ id: "s1", staff_id: "staff_1", wellbeing_score: 3 }),
        makeSupervision({ id: "s2", staff_id: "staff_2", wellbeing_score: 8 }),
      ],
    }));
    expect(r.supervision.low_wellbeing_staff).toContain("Edward");
    expect(r.supervision.low_wellbeing_staff).not.toContain("Anna");
  });

  it("calculates dual signature rate", () => {
    const r = computeHomeStaffDevelopment(baseInput({
      supervisions: [
        makeSupervision({ id: "s1", staff_signature: true, supervisor_signature: true }),
        makeSupervision({ id: "s2", staff_signature: true, supervisor_signature: false }),
      ],
    }));
    expect(r.supervision.dual_signature_rate).toBe(50);
  });

  it("calculates average duration", () => {
    const r = computeHomeStaffDevelopment(baseInput({
      supervisions: [
        makeSupervision({ id: "s1", duration_minutes: 60 }),
        makeSupervision({ id: "s2", duration_minutes: 40 }),
      ],
    }));
    expect(r.supervision.avg_duration_minutes).toBe(50);
  });

  it("identifies staff without recent supervision (8 weeks)", () => {
    const r = computeHomeStaffDevelopment(baseInput({
      staff: [
        makeStaff({ id: "staff_1", name: "Edward" }),
        makeStaff({ id: "staff_2", name: "Anna" }),
      ],
      supervisions: [
        makeSupervision({ id: "s1", staff_id: "staff_1", actual_date: "2026-05-10" }),
        makeSupervision({ id: "s2", staff_id: "staff_2", actual_date: "2026-03-01" }),  // >8 weeks ago
      ],
    }));
    expect(r.supervision.staff_without_recent_supervision).toContain("Anna");
    expect(r.supervision.staff_without_recent_supervision).not.toContain("Edward");
  });

  it("detects supervision trend improving", () => {
    const r = computeHomeStaffDevelopment(baseInput({
      supervisions: [
        makeSupervision({ id: "s1", scheduled_date: "2026-02-01", status: "scheduled", actual_date: null }),
        makeSupervision({ id: "s2", scheduled_date: "2026-03-01", status: "scheduled", actual_date: null }),
        makeSupervision({ id: "s3", scheduled_date: "2026-04-01", status: "completed", actual_date: "2026-04-01" }),
        makeSupervision({ id: "s4", scheduled_date: "2026-05-01", status: "completed", actual_date: "2026-05-01" }),
      ],
    }));
    expect(r.supervision.trend).toBe("improving");
  });

  // ── Training Profile ──────────────────────────────────────────────────────

  it("calculates mandatory training compliance rate", () => {
    const r = computeHomeStaffDevelopment(baseInput({
      training_records: [
        makeTraining({ id: "t1", is_mandatory: true, status: "compliant" }),
        makeTraining({ id: "t2", is_mandatory: true, status: "expired" }),
        makeTraining({ id: "t3", is_mandatory: false, status: "expired" }),
      ],
    }));
    expect(r.training.mandatory_compliance_rate).toBe(50);
    expect(r.training.mandatory_total).toBe(2);
    expect(r.training.mandatory_compliant).toBe(1);
  });

  it("counts expired and expiring-soon training", () => {
    const r = computeHomeStaffDevelopment(baseInput({
      training_records: [
        makeTraining({ id: "t1", status: "expired", course_name: "GDPR" }),
        makeTraining({ id: "t2", status: "expiring_soon", course_name: "First Aid" }),
        makeTraining({ id: "t3", status: "compliant" }),
      ],
    }));
    expect(r.training.expired_count).toBe(1);
    expect(r.training.expiring_soon_count).toBe(1);
    expect(r.training.expired_courses).toContain("GDPR");
    expect(r.training.expiring_courses).toContain("First Aid");
  });

  it("counts not-started training", () => {
    const r = computeHomeStaffDevelopment(baseInput({
      training_records: [
        makeTraining({ id: "t1", status: "not_started" }),
        makeTraining({ id: "t2", status: "not_started" }),
        makeTraining({ id: "t3", status: "compliant" }),
      ],
    }));
    expect(r.training.not_started_count).toBe(2);
  });

  it("calculates category coverage", () => {
    const r = computeHomeStaffDevelopment(baseInput({
      training_records: [
        makeTraining({ id: "t1", category: "safeguarding", status: "compliant" }),
        makeTraining({ id: "t2", category: "safeguarding", status: "expired" }),
        makeTraining({ id: "t3", category: "first_aid", status: "compliant" }),
      ],
    }));
    expect(r.training.category_coverage.length).toBe(2);
    const sg = r.training.category_coverage.find(c => c.category === "safeguarding");
    expect(sg?.compliant).toBe(1);
    expect(sg?.total).toBe(2);
  });

  // ── Qualification Profile ─────────────────────────────────────────────────

  it("counts qualifications by status", () => {
    const r = computeHomeStaffDevelopment(baseInput({
      qualifications: [
        makeQualification({ id: "q1", status: "completed" }),
        makeQualification({ id: "q2", status: "in_progress" }),
        makeQualification({ id: "q3", status: "not_started" }),
      ],
    }));
    expect(r.qualifications.completed_count).toBe(1);
    expect(r.qualifications.in_progress_count).toBe(1);
    expect(r.qualifications.not_started_count).toBe(1);
  });

  it("calculates mandatory qualification completion rate", () => {
    const r = computeHomeStaffDevelopment(baseInput({
      qualifications: [
        makeQualification({ id: "q1", is_mandatory: true, status: "completed" }),
        makeQualification({ id: "q2", is_mandatory: true, status: "not_started" }),
        makeQualification({ id: "q3", is_mandatory: false, status: "in_progress" }),
      ],
    }));
    expect(r.qualifications.mandatory_completion_rate).toBe(50);
  });

  it("identifies staff without mandatory qualifications started", () => {
    const r = computeHomeStaffDevelopment(baseInput({
      staff: [
        makeStaff({ id: "staff_1", name: "Edward" }),
        makeStaff({ id: "staff_2", name: "Anna" }),
      ],
      qualifications: [
        makeQualification({ id: "q1", staff_id: "staff_1", is_mandatory: true, status: "in_progress" }),
        makeQualification({ id: "q2", staff_id: "staff_2", is_mandatory: true, status: "not_started" }),
      ],
    }));
    expect(r.qualifications.staff_without_mandatory).toContain("Anna");
    expect(r.qualifications.staff_without_mandatory).not.toContain("Edward");
  });

  it("detects expiring qualifications (within 90 days)", () => {
    const r = computeHomeStaffDevelopment(baseInput({
      qualifications: [
        makeQualification({ id: "q1", status: "completed", expiry_date: "2026-07-01", qualification_name: "DBS Check" }),
        makeQualification({ id: "q2", status: "completed", expiry_date: "2027-01-01" }),
      ],
    }));
    expect(r.qualifications.expiring_qualifications).toContain("DBS Check");
  });

  // ── Induction Profile ─────────────────────────────────────────────────────

  it("counts inductions by status", () => {
    const r = computeHomeStaffDevelopment(baseInput({
      inductions: [
        makeInduction({ id: "i1", overall_status: "completed" }),
        makeInduction({ id: "i2", overall_status: "in_progress", completed_items: 5, total_items: 7 }),
      ],
    }));
    expect(r.inductions.completed_count).toBe(1);
    expect(r.inductions.in_progress_count).toBe(1);
  });

  it("detects overdue inductions by status", () => {
    const r = computeHomeStaffDevelopment(baseInput({
      inductions: [
        makeInduction({ id: "i1", overall_status: "overdue" }),
      ],
    }));
    expect(r.inductions.overdue_count).toBe(1);
  });

  it("detects in-progress inductions past target date as overdue", () => {
    const r = computeHomeStaffDevelopment(baseInput({
      inductions: [
        makeInduction({ id: "i1", overall_status: "in_progress", target_completion_date: "2026-03-01", completed_items: 4, total_items: 7 }),
      ],
    }));
    expect(r.inductions.overdue_count).toBe(1);
  });

  it("calculates average completion rate for in-progress inductions", () => {
    const r = computeHomeStaffDevelopment(baseInput({
      inductions: [
        makeInduction({ id: "i1", overall_status: "in_progress", completed_items: 5, total_items: 10, target_completion_date: "2026-08-01" }),
        makeInduction({ id: "i2", overall_status: "in_progress", completed_items: 7, total_items: 10, target_completion_date: "2026-08-01" }),
      ],
    }));
    expect(r.inductions.avg_completion_rate).toBe(60);
  });

  it("calculates probation pass rate", () => {
    const r = computeHomeStaffDevelopment(baseInput({
      inductions: [
        makeInduction({ id: "i1", overall_status: "completed", probation_passed: true }),
        makeInduction({ id: "i2", overall_status: "completed", probation_passed: false }),
      ],
    }));
    expect(r.inductions.probation_pass_rate).toBe(50);
  });

  // ── Scoring ───────────────────────────────────────────────────────────────

  it("scores high with excellent data", () => {
    const r = computeHomeStaffDevelopment(baseInput({
      supervisions: [
        makeSupervision({ id: "s1", staff_id: "staff_1", wellbeing_score: 8 }),
        makeSupervision({ id: "s2", staff_id: "staff_2", wellbeing_score: 9 }),
        makeSupervision({ id: "s3", staff_id: "staff_3", wellbeing_score: 7 }),
      ],
      training_records: [
        makeTraining({ id: "t1", is_mandatory: true, status: "compliant" }),
        makeTraining({ id: "t2", is_mandatory: true, status: "compliant" }),
        makeTraining({ id: "t3", is_mandatory: true, status: "compliant" }),
      ],
      qualifications: [
        makeQualification({ id: "q1", is_mandatory: true, status: "completed" }),
        makeQualification({ id: "q2", is_mandatory: true, status: "completed" }),
        makeQualification({ id: "q3", is_mandatory: false, status: "in_progress" }),
      ],
      inductions: [
        makeInduction({ id: "i1", probation_passed: true }),
      ],
    }));
    expect(r.staff_development_score).toBeGreaterThanOrEqual(80);
    expect(r.staff_development_rating).toBe("outstanding");
  });

  it("scores low with poor data", () => {
    const r = computeHomeStaffDevelopment(baseInput({
      staff: [
        makeStaff({ id: "staff_1", name: "Edward" }),
        makeStaff({ id: "staff_2", name: "Anna" }),
        makeStaff({ id: "staff_3", name: "Lackson" }),
      ],
      supervisions: [
        makeSupervision({ id: "s1", status: "overdue", scheduled_date: "2026-03-01", actual_date: null, staff_signature: false, supervisor_signature: false, wellbeing_score: null, duration_minutes: null }),
        makeSupervision({ id: "s2", status: "overdue", scheduled_date: "2026-03-15", actual_date: null, staff_signature: false, supervisor_signature: false, wellbeing_score: null, duration_minutes: null }),
        makeSupervision({ id: "s3", status: "overdue", scheduled_date: "2026-04-01", actual_date: null, staff_signature: false, supervisor_signature: false, wellbeing_score: null, duration_minutes: null }),
      ],
      training_records: [
        makeTraining({ id: "t1", is_mandatory: true, status: "expired", course_name: "SG" }),
        makeTraining({ id: "t2", is_mandatory: true, status: "expired", course_name: "FA" }),
        makeTraining({ id: "t3", is_mandatory: true, status: "expired", course_name: "GDPR" }),
      ],
      qualifications: [
        makeQualification({ id: "q1", is_mandatory: true, status: "not_started", staff_id: "staff_1" }),
        makeQualification({ id: "q2", is_mandatory: true, status: "not_started", staff_id: "staff_2" }),
      ],
      inductions: [
        makeInduction({ id: "i1", overall_status: "overdue" }),
      ],
    }));
    expect(r.staff_development_score).toBeLessThan(45);
    expect(r.staff_development_rating).toBe("inadequate");
  });

  // ── Penalties ─────────────────────────────────────────────────────────────

  it("penalises expired training more than expiring-soon", () => {
    const withExpired = baseInput({
      training_records: [
        makeTraining({ id: "t1", status: "expired", is_mandatory: true }),
        makeTraining({ id: "t2", status: "compliant", is_mandatory: true }),
      ],
    });
    const withExpiring = baseInput({
      training_records: [
        makeTraining({ id: "t1", status: "expiring_soon", is_mandatory: true }),
        makeTraining({ id: "t2", status: "compliant", is_mandatory: true }),
      ],
    });
    const rExpired = computeHomeStaffDevelopment(withExpired);
    const rExpiring = computeHomeStaffDevelopment(withExpiring);
    expect(rExpiring.staff_development_score).toBeGreaterThan(rExpired.staff_development_score);
  });

  // ── Strengths ─────────────────────────────────────────────────────────────

  it("generates strength for 100% mandatory compliance", () => {
    const r = computeHomeStaffDevelopment(baseInput({
      training_records: [
        makeTraining({ id: "t1", is_mandatory: true, status: "compliant" }),
        makeTraining({ id: "t2", is_mandatory: true, status: "compliant" }),
      ],
    }));
    expect(r.strengths.some(s => s.includes("mandatory training") && s.includes("compliant"))).toBe(true);
  });

  it("generates strength for high wellbeing scores", () => {
    const r = computeHomeStaffDevelopment(baseInput({
      supervisions: [
        makeSupervision({ id: "s1", wellbeing_score: 8 }),
        makeSupervision({ id: "s2", wellbeing_score: 9 }),
      ],
    }));
    expect(r.strengths.some(s => s.includes("wellbeing") && s.includes("morale"))).toBe(true);
  });

  it("generates strength for active qualifications in progress", () => {
    const r = computeHomeStaffDevelopment(baseInput({
      qualifications: [
        makeQualification({ id: "q1", status: "in_progress" }),
        makeQualification({ id: "q2", status: "in_progress" }),
      ],
    }));
    expect(r.strengths.some(s => s.includes("in progress") && s.includes("professional development"))).toBe(true);
  });

  // ── Concerns ──────────────────────────────────────────────────────────────

  it("flags overdue supervisions as concern", () => {
    const r = computeHomeStaffDevelopment(baseInput({
      supervisions: [
        makeSupervision({ id: "s1", status: "overdue", scheduled_date: "2026-04-01" }),
      ],
    }));
    expect(r.concerns.some(c => c.includes("overdue") && c.includes("Reg 33"))).toBe(true);
  });

  it("flags expired training as concern", () => {
    const r = computeHomeStaffDevelopment(baseInput({
      training_records: [
        makeTraining({ id: "t1", status: "expired", course_name: "GDPR Refresher" }),
      ],
    }));
    expect(r.concerns.some(c => c.includes("expired") && c.includes("GDPR Refresher"))).toBe(true);
  });

  it("flags low wellbeing staff as concern", () => {
    const r = computeHomeStaffDevelopment(baseInput({
      supervisions: [
        makeSupervision({ id: "s1", staff_id: "staff_1", wellbeing_score: 3 }),
      ],
    }));
    expect(r.concerns.some(c => c.includes("wellbeing") && c.includes("Edward"))).toBe(true);
  });

  it("flags staff without recent supervision as concern", () => {
    const r = computeHomeStaffDevelopment(baseInput({
      staff: [
        makeStaff({ id: "staff_1", name: "Edward" }),
        makeStaff({ id: "staff_2", name: "Anna" }),
      ],
      supervisions: [
        makeSupervision({ id: "s1", staff_id: "staff_1", actual_date: "2026-05-10" }),
        // Anna has no supervisions
      ],
    }));
    expect(r.concerns.some(c => c.includes("Anna") && c.includes("8+ weeks"))).toBe(true);
  });

  // ── Recommendations ───────────────────────────────────────────────────────

  it("recommends completing overdue supervisions", () => {
    const r = computeHomeStaffDevelopment(baseInput({
      supervisions: [
        makeSupervision({ id: "s1", status: "overdue", scheduled_date: "2026-04-01" }),
      ],
    }));
    const rec = r.recommendations.find(r => r.recommendation.includes("overdue supervision"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("immediate");
    expect(rec!.regulatory_ref).toBe("Reg 33");
  });

  it("recommends renewing expired training", () => {
    const r = computeHomeStaffDevelopment(baseInput({
      training_records: [
        makeTraining({ id: "t1", status: "expired", course_name: "GDPR" }),
      ],
    }));
    const rec = r.recommendations.find(r => r.recommendation.includes("expired training"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("immediate");
  });

  it("recommends enrolling staff on mandatory qualifications", () => {
    const r = computeHomeStaffDevelopment(baseInput({
      staff: [makeStaff({ id: "staff_2", name: "Anna" })],
      qualifications: [
        makeQualification({ id: "q1", staff_id: "staff_2", is_mandatory: true, status: "not_started" }),
      ],
    }));
    const rec = r.recommendations.find(r => r.recommendation.includes("Anna") && r.recommendation.includes("mandatory"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("soon");
  });

  // ── Insights ──────────────────────────────────────────────────────────────

  it("generates critical insight for multiple expired training", () => {
    const r = computeHomeStaffDevelopment(baseInput({
      training_records: [
        makeTraining({ id: "t1", status: "expired" }),
        makeTraining({ id: "t2", status: "expired" }),
        makeTraining({ id: "t3", status: "expired" }),
      ],
    }));
    const ins = r.insights.find(i => i.severity === "critical" && i.text.includes("expired"));
    expect(ins).toBeDefined();
  });

  it("generates positive insight when compliance is strong", () => {
    const r = computeHomeStaffDevelopment(baseInput({
      supervisions: [
        makeSupervision({ id: "s1", wellbeing_score: 8 }),
        makeSupervision({ id: "s2", wellbeing_score: 7 }),
      ],
      training_records: [
        makeTraining({ id: "t1", is_mandatory: true, status: "compliant" }),
        makeTraining({ id: "t2", is_mandatory: true, status: "compliant" }),
      ],
    }));
    const ins = r.insights.find(i => i.severity === "positive" && i.text.includes("Strong staff development"));
    expect(ins).toBeDefined();
  });

  it("generates insight for improving supervision trend", () => {
    const r = computeHomeStaffDevelopment(baseInput({
      supervisions: [
        makeSupervision({ id: "s1", scheduled_date: "2026-02-01", status: "scheduled", actual_date: null }),
        makeSupervision({ id: "s2", scheduled_date: "2026-03-01", status: "scheduled", actual_date: null }),
        makeSupervision({ id: "s3", scheduled_date: "2026-04-01", status: "completed", actual_date: "2026-04-01" }),
        makeSupervision({ id: "s4", scheduled_date: "2026-05-01", status: "completed", actual_date: "2026-05-01" }),
      ],
    }));
    const ins = r.insights.find(i => i.text.includes("improving"));
    expect(ins).toBeDefined();
  });

  // ── Headlines ─────────────────────────────────────────────────────────────

  it("produces a non-empty headline", () => {
    const r = computeHomeStaffDevelopment(baseInput());
    expect(r.headline.length).toBeGreaterThan(0);
  });

  // ── Edge Cases ────────────────────────────────────────────────────────────

  it("handles supervisions with null wellbeing scores", () => {
    const r = computeHomeStaffDevelopment(baseInput({
      supervisions: [
        makeSupervision({ id: "s1", wellbeing_score: null }),
      ],
    }));
    expect(r.supervision.avg_wellbeing_score).toBeNull();
    expect(r.supervision.low_wellbeing_staff).toHaveLength(0);
  });

  it("handles empty staff list for without-recent check", () => {
    const r = computeHomeStaffDevelopment(baseInput({
      staff: [],
      supervisions: [makeSupervision()],
    }));
    expect(r.supervision.staff_without_recent_supervision).toHaveLength(0);
  });

  it("handles all mandatory training compliant", () => {
    const r = computeHomeStaffDevelopment(baseInput({
      training_records: [
        makeTraining({ id: "t1", is_mandatory: true, status: "compliant" }),
      ],
    }));
    expect(r.training.mandatory_compliance_rate).toBe(100);
    expect(r.training.expired_count).toBe(0);
  });

  it("handles zero mandatory training gracefully", () => {
    const r = computeHomeStaffDevelopment(baseInput({
      training_records: [
        makeTraining({ id: "t1", is_mandatory: false, status: "compliant" }),
      ],
    }));
    expect(r.training.mandatory_compliance_rate).toBe(100);
  });

  it("handles no qualifications gracefully", () => {
    const r = computeHomeStaffDevelopment(baseInput({
      qualifications: [],
    }));
    expect(r.qualifications.mandatory_completion_rate).toBe(100);
    expect(r.qualifications.staff_without_mandatory).toHaveLength(0);
  });

  it("handles no inductions gracefully", () => {
    const r = computeHomeStaffDevelopment(baseInput({
      inductions: [],
    }));
    expect(r.inductions.probation_pass_rate).toBe(0);
  });
});
