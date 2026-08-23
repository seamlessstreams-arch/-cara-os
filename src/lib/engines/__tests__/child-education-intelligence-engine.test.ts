import { describe, it, expect } from "vitest";
import {
  computeChildEducationIntelligence,
  type ChildEducationIntelligenceInput,
  type EducationRecordInput,
  type EduAttendanceInput,
  type HomeworkSessionInput,
  type TutoringInput,
  type SchoolEngagementInput,
  type PepRecordInput,
} from "../child-education-intelligence-engine";

// ── Helpers ────────────────────────────────────────────────────────────────

function makeEduRecord(overrides: Partial<EducationRecordInput> = {}): EducationRecordInput {
  return {
    id: "edu_1",
    date: "2026-05-20",
    record_type: "attendance",
    school: "Oak Academy",
    attendance_status: "present",
    linked_pep: false,
    status: "open",
    details: "Full day attendance.",
    ...overrides,
  };
}

function makeAttendance(overrides: Partial<EduAttendanceInput> = {}): EduAttendanceInput {
  return {
    id: "att_1",
    date: "2026-05-20",
    attendance_code: "/",
    session: "full_day",
    ...overrides,
  };
}

function makeHomework(overrides: Partial<HomeworkSessionInput> = {}): HomeworkSessionInput {
  return {
    id: "hw_1",
    date: "2026-05-20",
    subject: "English",
    duration_minutes: 30,
    completion_level: "completed",
    support_needed: "minimal",
    engagement: "willing",
    ...overrides,
  };
}

function makeTutoring(overrides: Partial<TutoringInput> = {}): TutoringInput {
  return {
    id: "tut_1",
    date: "2026-05-15",
    subject: "Maths",
    duration_minutes: 60,
    tutor_feedback: "Good progress",
    progress_rating: 4,
    ...overrides,
  };
}

function makePep(overrides: Partial<PepRecordInput> = {}): PepRecordInput {
  return {
    id: "pep_1",
    date: "2026-04-15",
    attendees: ["Key Worker", "VSH", "Teacher"],
    targets_set: 4,
    targets_achieved: 3,
    next_review_date: "2026-07-15",
    virtual_school_involved: true,
    child_participated: true,
    pupil_premium_discussed: true,
    ...overrides,
  };
}

function makeEngagement(overrides: Partial<SchoolEngagementInput> = {}): SchoolEngagementInput {
  return {
    id: "se_1",
    date: "2026-05-10",
    event_type: "parents_evening",
    attended: true,
    staff_attended: true,
    child_feedback: "Good meeting",
    ...overrides,
  };
}

function baseInput(overrides: Partial<ChildEducationIntelligenceInput> = {}): ChildEducationIntelligenceInput {
  return {
    today: "2026-05-26",
    child_id: "yp_alex",
    child_name: "Alex",
    school_name: "Oak Academy",
    education_records: [
      makeEduRecord({ id: "e1", date: "2026-05-20", record_type: "attendance", attendance_status: "present" }),
      makeEduRecord({ id: "e2", date: "2026-05-19", record_type: "attendance", attendance_status: "present" }),
      makeEduRecord({ id: "e3", date: "2026-05-18", record_type: "attendance", attendance_status: "present" }),
      makeEduRecord({ id: "e4", date: "2026-05-17", record_type: "attendance", attendance_status: "late" }),
      makeEduRecord({ id: "e5", date: "2026-05-16", record_type: "attendance", attendance_status: "present" }),
      makeEduRecord({ id: "e6", date: "2026-04-20", record_type: "attendance", attendance_status: "present" }),
      makeEduRecord({ id: "e7", date: "2026-04-19", record_type: "attendance", attendance_status: "present" }),
      makeEduRecord({ id: "e8", date: "2026-04-18", record_type: "attendance", attendance_status: "present" }),
      makeEduRecord({ id: "e9", date: "2026-04-17", record_type: "attendance", attendance_status: "present" }),
      makeEduRecord({ id: "e10", date: "2026-04-16", record_type: "attendance", attendance_status: "present" }),
      makeEduRecord({ id: "e11", date: "2026-04-15", record_type: "achievement", attendance_status: null, details: "Selected for school debate team" }),
      makeEduRecord({ id: "e12", date: "2026-04-10", record_type: "attainment", attendance_status: null, details: "English mock — Grade 5" }),
    ],
    attendance_records: [],
    ehcp: null,
    homework_sessions: [
      makeHomework({ id: "hw1", date: "2026-05-20" }),
      makeHomework({ id: "hw2", date: "2026-05-19" }),
      makeHomework({ id: "hw3", date: "2026-05-18" }),
      makeHomework({ id: "hw4", date: "2026-05-17", completion_level: "partial" }),
      makeHomework({ id: "hw5", date: "2026-05-16" }),
    ],
    tutoring_sessions: [
      makeTutoring({ id: "t1", date: "2026-05-15" }),
      makeTutoring({ id: "t2", date: "2026-05-01" }),
      makeTutoring({ id: "t3", date: "2026-04-15" }),
    ],
    school_engagement_events: [
      makeEngagement({ id: "se1", date: "2026-05-10" }),
      makeEngagement({ id: "se2", date: "2026-04-20", event_type: "sports_day" }),
    ],
    pep_records: [
      makePep({ id: "pep1", date: "2026-04-15" }),
      makePep({ id: "pep2", date: "2025-10-15" }),
    ],
    ...overrides,
  };
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("Child Education Intelligence Engine", () => {
  it("produces result with all required fields", () => {
    const result = computeChildEducationIntelligence(baseInput());
    expect(result.generated_at).toBe("2026-05-26");
    expect(result.child_id).toBe("yp_alex");
    expect(result.child_name).toBe("Alex");
    expect(result.school_name).toBe("Oak Academy");
    expect(result.education_health).toBeDefined();
    expect(result.education_score).toBeGreaterThanOrEqual(0);
    expect(result.education_score).toBeLessThanOrEqual(100);
    expect(result.headline).toContain("Alex");
    expect(result.attendance).toBeDefined();
    expect(result.exclusions).toBeDefined();
    expect(result.pep_compliance).toBeDefined();
    expect(result.ehcp_status).toBeDefined();
    expect(result.homework).toBeDefined();
    expect(result.tutoring).toBeDefined();
    expect(result.engagement).toBeDefined();
  });

  it("rates good/outstanding for child with strong attendance", () => {
    const result = computeChildEducationIntelligence(baseInput());
    expect(["outstanding", "good"]).toContain(result.education_health);
    expect(result.education_score).toBeGreaterThanOrEqual(55);
  });

  it("computes attendance from education records when no formal attendance records", () => {
    const result = computeChildEducationIntelligence(baseInput());
    expect(result.attendance.total_sessions).toBe(10);
    expect(result.attendance.present_count).toBe(10); // 9 present + 1 late counts as present
    expect(result.attendance.late_count).toBe(1);
    expect(result.attendance.overall_pct).toBe(100);
    expect(result.attendance.band).toBe("excellent");
  });

  it("reports insufficient_data (not 100% 'excellent') for a child with NO attendance records", () => {
    // A child with education records but zero attendance sessions previously read
    // 100% / "excellent" (pct(0,0)=100) + earned the score boost and strength.
    //
    // This used to assert `overall_pct` was 0, which was the guard's own answer
    // — `hasAttendanceData ? pct(...) : 0`. That is the same fabrication in the
    // other direction: a child with nothing recorded had not attended 0% of
    // their sessions. `rate()` returns null for an empty population and the
    // band's insufficient_data state carries the meaning.
    const result = computeChildEducationIntelligence(baseInput({
      attendance_records: [],
      education_records: [
        makeEduRecord({ id: "c1", record_type: "concern", attendance_status: undefined, details: "Behaviour concern" }),
      ],
    }));
    expect(result.attendance.total_sessions).toBe(0);
    expect(result.attendance.band).toBe("insufficient_data");
    expect(result.attendance.overall_pct).toBeNull();
    expect(result.attendance.overall_pct).not.toBe(100); // the bug this test was written for
    expect(result.strengths.some((s) => s.includes("Excellent attendance"))).toBe(false);
  });

  it("uses formal attendance records when available", () => {
    const result = computeChildEducationIntelligence(baseInput({
      attendance_records: [
        makeAttendance({ id: "a1", date: "2026-05-20", attendance_code: "/" }),
        makeAttendance({ id: "a2", date: "2026-05-19", attendance_code: "/" }),
        makeAttendance({ id: "a3", date: "2026-05-18", attendance_code: "U" }),
        makeAttendance({ id: "a4", date: "2026-05-17", attendance_code: "L" }),
        makeAttendance({ id: "a5", date: "2026-05-16", attendance_code: "/" }),
      ],
      education_records: [],
    }));
    expect(result.attendance.total_sessions).toBe(5);
    expect(result.attendance.present_count).toBe(4); // 3 present + 1 late
    expect(result.attendance.late_count).toBe(1);
    expect(result.attendance.unauthorised_count).toBe(1);
    expect(result.attendance.overall_pct).toBe(80);
  });

  it("classifies attendance bands correctly", () => {
    // Persistent absence (< 90%)
    const result = computeChildEducationIntelligence(baseInput({
      education_records: [
        ...Array.from({ length: 7 }, (_, i) => makeEduRecord({ id: `p${i}`, date: `2026-05-${20 - i}`, attendance_status: "present" })),
        ...Array.from({ length: 3 }, (_, i) => makeEduRecord({ id: `a${i}`, date: `2026-04-${20 - i}`, attendance_status: "absent_unauthorised" })),
        ...Array.from({ length: 5 }, (_, i) => makeEduRecord({ id: `q${i}`, date: `2026-04-${15 - i}`, attendance_status: "present" })),
      ],
    }));
    // 12/15 = 80%
    expect(result.attendance.band).toBe("persistent_absence");
    expect(result.concerns.some((c) => c.toLowerCase().includes("persistent"))).toBe(true);
  });

  it("detects exclusions and patterns", () => {
    const result = computeChildEducationIntelligence(baseInput({
      education_records: [
        makeEduRecord({ id: "ex1", date: "2026-05-15", record_type: "exclusion", attendance_status: "excluded", status: "monitoring" }),
        makeEduRecord({ id: "ex2", date: "2026-04-20", record_type: "exclusion", attendance_status: "excluded", status: "resolved" }),
        makeEduRecord({ id: "a1", date: "2026-05-20", record_type: "attendance", attendance_status: "present" }),
      ],
    }));
    expect(result.exclusions.total_90d).toBe(2);
    expect(result.exclusions.pattern_detected).toBe(true);
    expect(result.exclusions.reintegration_in_progress).toBe(true);
    expect(result.concerns.some((c) => c.toLowerCase().includes("exclusion"))).toBe(true);
    expect(result.recommendations.some((r) => r.domain === "exclusion")).toBe(true);
  });

  it("computes PEP compliance from pep_records", () => {
    const result = computeChildEducationIntelligence(baseInput());
    expect(result.pep_compliance.total_peps).toBe(2);
    expect(result.pep_compliance.peps_last_12m).toBe(2);
    expect(result.pep_compliance.pep_current).toBe(true);
    expect(result.pep_compliance.targets_set).toBe(8);
    expect(result.pep_compliance.targets_achieved).toBe(6);
    expect(result.pep_compliance.target_achievement_rate).toBe(75);
    expect(result.pep_compliance.virtual_school_involved_rate).toBe(100);
    expect(result.pep_compliance.child_participation_rate).toBe(100);
  });

  it("flags missing PEP as concern", () => {
    const result = computeChildEducationIntelligence(baseInput({
      pep_records: [],
      education_records: [
        makeEduRecord({ id: "e1", date: "2026-05-20" }),
      ],
    }));
    expect(result.pep_compliance.pep_current).toBe(false);
    expect(result.concerns.some((c) => c.toLowerCase().includes("pep"))).toBe(true);
    expect(result.recommendations.some((r) => r.domain === "pep")).toBe(true);
  });

  it("handles EHCP status", () => {
    const result = computeChildEducationIntelligence(baseInput({
      ehcp: {
        id: "ehcp_1",
        status: "active",
        plan_type: "ehcp",
        review_date: "2026-06-01",
        annual_review_due: "2026-05-01",
        needs_areas: ["communication", "social_emotional"],
        provision_in_place: true,
      },
    }));
    expect(result.ehcp_status.has_ehcp).toBe(true);
    expect(result.ehcp_status.review_overdue).toBe(true);
    expect(result.ehcp_status.needs_areas).toEqual(["communication", "social_emotional"]);
    expect(result.ehcp_status.provision_in_place).toBe(true);
    expect(result.concerns.some((c) => c.toLowerCase().includes("ehcp"))).toBe(true);
  });

  it("computes homework analysis", () => {
    const result = computeChildEducationIntelligence(baseInput());
    expect(result.homework.total_sessions_30d).toBe(5);
    expect(result.homework.completion_rate).toBe(100); // all completed or partial
    expect(result.homework.avg_duration_minutes).toBe(30);
    expect(result.homework.subjects).toContain("English");
  });

  it("flags low homework completion", () => {
    const result = computeChildEducationIntelligence(baseInput({
      homework_sessions: [
        makeHomework({ id: "h1", date: "2026-05-20", completion_level: "not_started" }),
        makeHomework({ id: "h2", date: "2026-05-19", completion_level: "refused" }),
        makeHomework({ id: "h3", date: "2026-05-18", completion_level: "not_started" }),
        makeHomework({ id: "h4", date: "2026-05-17", completion_level: "refused" }),
        makeHomework({ id: "h5", date: "2026-05-16", completion_level: "completed" }),
      ],
    }));
    expect(result.homework.completion_rate).toBe(20);
    expect(result.concerns.some((c) => c.toLowerCase().includes("homework"))).toBe(true);
  });

  it("computes tutoring analysis", () => {
    const result = computeChildEducationIntelligence(baseInput());
    expect(result.tutoring.total_sessions_90d).toBe(3);
    expect(result.tutoring.avg_progress_rating).toBe(4);
    expect(result.tutoring.subjects).toContain("Maths");
    expect(result.tutoring.total_hours).toBe(3);
  });

  it("computes engagement analysis", () => {
    const result = computeChildEducationIntelligence(baseInput());
    expect(result.engagement.total_events_90d).toBe(2);
    expect(result.engagement.attendance_rate).toBe(100);
    expect(result.engagement.staff_attendance_rate).toBe(100);
    expect(result.engagement.event_types).toContain("parents_evening");
  });

  it("collects achievements", () => {
    const result = computeChildEducationIntelligence(baseInput());
    expect(result.achievements.length).toBe(2);
    expect(result.achievements[0].description).toBeTruthy();
  });

  it("generates strengths for good education outcomes", () => {
    const result = computeChildEducationIntelligence(baseInput());
    expect(result.strengths.length).toBeGreaterThan(0);
    // Should have attendance, PEP participation, achievements, engagement strengths
    expect(result.strengths.some((s) => s.toLowerCase().includes("attendance"))).toBe(true);
    expect(result.strengths.some((s) => s.toLowerCase().includes("achievement"))).toBe(true);
  });

  it("generates critical insight for inadequate education", () => {
    const result = computeChildEducationIntelligence(baseInput({
      education_records: [
        makeEduRecord({ id: "e1", date: "2026-05-20", attendance_status: "absent_unauthorised" }),
        makeEduRecord({ id: "e2", date: "2026-05-19", attendance_status: "absent_unauthorised" }),
        makeEduRecord({ id: "e3", date: "2026-05-18", attendance_status: "absent_unauthorised" }),
        makeEduRecord({ id: "e4", date: "2026-05-17", attendance_status: "present" }),
        makeEduRecord({ id: "e5", date: "2026-05-16", attendance_status: "absent_unauthorised" }),
        makeEduRecord({ id: "e6", date: "2026-04-20", attendance_status: "present" }),
        makeEduRecord({ id: "e7", date: "2026-04-19", attendance_status: "absent_unauthorised" }),
        makeEduRecord({ id: "ex1", date: "2026-05-10", record_type: "exclusion", attendance_status: "excluded" }),
        makeEduRecord({ id: "ex2", date: "2026-04-15", record_type: "exclusion", attendance_status: "excluded" }),
        makeEduRecord({ id: "c1", date: "2026-05-05", record_type: "concern", attendance_status: null, status: "monitoring", details: "Persistent absence pattern" }),
      ],
      pep_records: [],
      homework_sessions: [],
      tutoring_sessions: [],
      school_engagement_events: [],
    }));
    expect(result.education_health).toBe("inadequate");
    expect(result.insights.some((i) => i.severity === "critical")).toBe(true);
  });

  it("handles empty input gracefully", () => {
    const result = computeChildEducationIntelligence({
      today: "2026-05-26",
      child_id: "yp_new",
      child_name: "New Child",
      school_name: null,
      education_records: [],
      attendance_records: [],
      ehcp: null,
      homework_sessions: [],
      tutoring_sessions: [],
      school_engagement_events: [],
      pep_records: [],
    });
    expect(result.education_health).toBe("insufficient_data");
    expect(result.attendance.total_sessions).toBe(0);
    expect(result.pep_compliance.pep_current).toBe(false);
    expect(result.headline).toContain("New Child");
  });

  it("detects attendance trend from education records", () => {
    const result = computeChildEducationIntelligence(baseInput());
    // 5 present in 30d, 5 present in 30-60d => stable
    expect(["improving", "stable"]).toContain(result.attendance.trend);
  });

  it("detects declining attendance trend", () => {
    const result = computeChildEducationIntelligence(baseInput({
      education_records: [
        // 30d: 2 present, 3 absent = 40%
        makeEduRecord({ id: "r1", date: "2026-05-20", attendance_status: "present" }),
        makeEduRecord({ id: "r2", date: "2026-05-19", attendance_status: "absent_unauthorised" }),
        makeEduRecord({ id: "r3", date: "2026-05-18", attendance_status: "absent_authorised" }),
        makeEduRecord({ id: "r4", date: "2026-05-17", attendance_status: "absent_unauthorised" }),
        makeEduRecord({ id: "r5", date: "2026-05-16", attendance_status: "present" }),
        // 30-60d: 5 present = 100%
        makeEduRecord({ id: "r6", date: "2026-04-20", attendance_status: "present" }),
        makeEduRecord({ id: "r7", date: "2026-04-19", attendance_status: "present" }),
        makeEduRecord({ id: "r8", date: "2026-04-18", attendance_status: "present" }),
        makeEduRecord({ id: "r9", date: "2026-04-17", attendance_status: "present" }),
        makeEduRecord({ id: "r10", date: "2026-04-16", attendance_status: "present" }),
      ],
    }));
    expect(result.attendance.trend).toBe("declining");
    expect(result.concerns.some((c) => c.toLowerCase().includes("declining"))).toBe(true);
  });

  it("detects no exclusions as strength", () => {
    const result = computeChildEducationIntelligence(baseInput());
    expect(result.exclusions.total_all_time).toBe(0);
    expect(result.strengths.some((s) => s.toLowerCase().includes("no exclusion"))).toBe(true);
  });

  it("recommends virtual school head involvement", () => {
    const result = computeChildEducationIntelligence(baseInput({
      pep_records: [
        makePep({ id: "p1", virtual_school_involved: false }),
        makePep({ id: "p2", virtual_school_involved: true }),
      ],
    }));
    expect(result.pep_compliance.virtual_school_involved_rate).toBe(50);
    expect(result.recommendations.some((r) => r.domain === "pep" && r.recommendation.toLowerCase().includes("virtual school"))).toBe(true);
  });

  it("recommends child participation in PEP", () => {
    const result = computeChildEducationIntelligence(baseInput({
      pep_records: [
        makePep({ id: "p1", child_participated: false }),
        makePep({ id: "p2", child_participated: false }),
      ],
    }));
    expect(result.pep_compliance.child_participation_rate).toBe(0);
    expect(result.recommendations.some((r) => r.domain === "voice")).toBe(true);
  });

  it("generates positive insight for strong tutoring progress", () => {
    const result = computeChildEducationIntelligence(baseInput({
      tutoring_sessions: [
        makeTutoring({ id: "t1", date: "2026-05-20", progress_rating: 5 }),
        makeTutoring({ id: "t2", date: "2026-05-10", progress_rating: 4 }),
        makeTutoring({ id: "t3", date: "2026-04-20", progress_rating: 4 }),
      ],
    }));
    expect(result.insights.some(
      (i) => i.severity === "positive" && i.text.toLowerCase().includes("tutoring"),
    )).toBe(true);
  });

  it("detects PEP from education records as fallback", () => {
    const result = computeChildEducationIntelligence(baseInput({
      pep_records: [],
      education_records: [
        makeEduRecord({ id: "e1", date: "2026-05-20", attendance_status: "present" }),
        makeEduRecord({ id: "pep1", date: "2026-04-15", record_type: "pep_meeting", attendance_status: null, linked_pep: true }),
      ],
    }));
    expect(result.pep_compliance.total_peps).toBe(1);
    expect(result.pep_compliance.pep_current).toBe(true);
  });

  it("generates positive PEP insight for strong performance", () => {
    const result = computeChildEducationIntelligence(baseInput());
    expect(result.insights.some(
      (i) => i.severity === "positive" && i.text.toLowerCase().includes("pep"),
    )).toBe(true);
  });
});
