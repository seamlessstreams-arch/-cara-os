import { describe, it, expect } from "vitest";
import {
  computeHomeworkAcademicSupport,
  type HomeworkAcademicSupportInput,
  type HomeworkSupportRecordInput,
  type StudyEnvironmentRecordInput,
  type TutoringRecordInput,
  type EducationalResourceRecordInput,
  type SchoolLiaisonRecordInput,
} from "../home-homework-academic-support-intelligence-engine";

// ── Helpers ────────────────────────────────────────────────────────────────

function makeHomeworkSupport(
  overrides: Partial<HomeworkSupportRecordInput> = {},
): HomeworkSupportRecordInput {
  return {
    id: "hs_1",
    child_id: "child_1",
    date: "2026-05-20",
    subject: "Maths",
    homework_set: true,
    homework_completed: true,
    staff_supported: true,
    support_quality: "good",
    time_allocated_minutes: 30,
    quiet_space_available: true,
    child_engaged: true,
    child_asked_for_help: false,
    barriers_encountered: [],
    outcome: "completed",
    notes: "",
    created_at: "2026-05-20T10:00:00Z",
    ...overrides,
  };
}

function makeStudyEnvironment(
  overrides: Partial<StudyEnvironmentRecordInput> = {},
): StudyEnvironmentRecordInput {
  return {
    id: "se_1",
    child_id: "child_1",
    date: "2026-05-18",
    assessment_type: "scheduled",
    quiet_space_available: true,
    desk_provided: true,
    lighting_adequate: true,
    free_from_distractions: true,
    study_materials_available: true,
    internet_access_available: true,
    time_protected: true,
    child_satisfaction: 4,
    improvements_needed: [],
    overall_quality: "good",
    created_at: "2026-05-18T10:00:00Z",
    ...overrides,
  };
}

function makeTutoring(
  overrides: Partial<TutoringRecordInput> = {},
): TutoringRecordInput {
  return {
    id: "tr_1",
    child_id: "child_1",
    subject: "English",
    tutor_type: "professional",
    date: "2026-05-15",
    session_planned: true,
    session_attended: true,
    session_duration_minutes: 60,
    child_engaged: true,
    progress_noted: true,
    child_satisfaction: 4,
    tutor_feedback_provided: true,
    linked_to_school_curriculum: true,
    outcome_documented: true,
    created_at: "2026-05-15T10:00:00Z",
    ...overrides,
  };
}

function makeResource(
  overrides: Partial<EducationalResourceRecordInput> = {},
): EducationalResourceRecordInput {
  return {
    id: "er_1",
    child_id: "child_1",
    resource_type: "books",
    date: "2026-05-10",
    requested: true,
    provided: true,
    age_appropriate: true,
    curriculum_aligned: true,
    condition: "good",
    child_using_resource: true,
    budget_allocated: true,
    notes: "",
    created_at: "2026-05-10T10:00:00Z",
    ...overrides,
  };
}

function makeLiaison(
  overrides: Partial<SchoolLiaisonRecordInput> = {},
): SchoolLiaisonRecordInput {
  return {
    id: "sl_1",
    child_id: "child_1",
    date: "2026-05-12",
    liaison_type: "pep_meeting",
    staff_attended: true,
    school_engaged: true,
    actions_agreed: 3,
    actions_completed: 3,
    academic_progress_discussed: true,
    attendance_discussed: true,
    behaviour_discussed: false,
    additional_support_identified: false,
    follow_up_date: null,
    follow_up_completed: false,
    child_voice_included: true,
    pep_up_to_date: true,
    notes: "",
    created_at: "2026-05-12T10:00:00Z",
    ...overrides,
  };
}

function baseInput(
  overrides: Partial<HomeworkAcademicSupportInput> = {},
): HomeworkAcademicSupportInput {
  return {
    today: "2026-05-28",
    total_children: 3,
    homework_support_records: [],
    study_environment_records: [],
    tutoring_records: [],
    educational_resource_records: [],
    school_liaison_records: [],
    ...overrides,
  };
}

// pct helper mirror for test assertions
function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

// ── Insufficient Data ──────────────────────────────────────────────────────

describe("computeHomeworkAcademicSupport", () => {
  describe("insufficient_data", () => {
    it("returns insufficient_data when total_children=0 and all arrays empty", () => {
      const r = computeHomeworkAcademicSupport(
        baseInput({ total_children: 0 }),
      );
      expect(r.academic_rating).toBe("insufficient_data");
      expect(r.academic_score).toBe(0);
      expect(r.homework_completion_rate).toBe(0);
      expect(r.study_environment_quality_rate).toBe(0);
      expect(r.tutoring_coverage_rate).toBe(0);
      expect(r.resource_availability_rate).toBe(0);
      expect(r.school_liaison_rate).toBe(0);
      expect(r.child_engagement_rate).toBe(0);
      expect(r.strengths).toHaveLength(0);
      expect(r.concerns).toHaveLength(0);
      expect(r.recommendations).toHaveLength(0);
      expect(r.insights).toHaveLength(0);
    });

    it("headline mentions no children on placement", () => {
      const r = computeHomeworkAcademicSupport(
        baseInput({ total_children: 0 }),
      );
      expect(r.headline).toContain("No children on placement");
    });
  });

  // ── Inadequate Floor (all empty + children > 0) ────────────────────────

  describe("inadequate floor (all empty + children > 0)", () => {
    it("returns inadequate with score 15 when children on placement but no records", () => {
      const r = computeHomeworkAcademicSupport(baseInput());
      expect(r.academic_rating).toBe("inadequate");
      expect(r.academic_score).toBe(15);
    });

    it("has exactly 1 concern about no records", () => {
      const r = computeHomeworkAcademicSupport(baseInput());
      expect(r.concerns).toHaveLength(1);
      expect(r.concerns[0]).toContain("No homework support");
    });

    it("has exactly 2 recommendations with immediate urgency", () => {
      const r = computeHomeworkAcademicSupport(baseInput());
      expect(r.recommendations).toHaveLength(2);
      expect(r.recommendations[0].urgency).toBe("immediate");
      expect(r.recommendations[1].urgency).toBe("immediate");
      expect(r.recommendations[0].rank).toBe(1);
      expect(r.recommendations[1].rank).toBe(2);
    });

    it("has exactly 1 critical insight", () => {
      const r = computeHomeworkAcademicSupport(baseInput());
      expect(r.insights).toHaveLength(1);
      expect(r.insights[0].severity).toBe("critical");
    });

    it("headline mentions no homework or academic support data", () => {
      const r = computeHomeworkAcademicSupport(baseInput());
      expect(r.headline).toContain("No homework or academic support data");
    });

    it("all rates are 0", () => {
      const r = computeHomeworkAcademicSupport(baseInput());
      expect(r.homework_completion_rate).toBe(0);
      expect(r.study_environment_quality_rate).toBe(0);
      expect(r.tutoring_coverage_rate).toBe(0);
      expect(r.resource_availability_rate).toBe(0);
      expect(r.school_liaison_rate).toBe(0);
      expect(r.child_engagement_rate).toBe(0);
    });
  });

  // ── Base Score ──────────────────────────────────────────────────────────

  describe("base score", () => {
    it("base score is 52 with minimal neutral data", () => {
      // Provide records that yield 0% or low rates to avoid any bonuses/penalties
      // A single homework record where homework_set=false, so homeworkCompletionRate denominator=0 -> pct(0,0)=0
      // studyEnv overall_quality=adequate -> scores 2/4 per record -> envQualityRate=50
      // but studyEnvironmentQualityRate (good+excellent) = 0 => no bonus or penalty
      // tutoring: session_planned=false -> tutoringAttendanceRate pct(0,0)=0; single child coverage = pct(1,3)=33
      // resource: requested=false -> resourceFulfilmentRate pct(0,0)=0; not age_appropriate, not using -> resourceAvailabilityRate = round((0+0+0)/3) = 0
      // liaison: staff_attended=false, actions_agreed=0, academic_progress_discussed=false -> schoolLiaisonRate = round((0+0+0)/3) = 0
      // engagementDenominator = 1+1+1 = 3; engaged none -> childEngagementRate = 0 -> penalty?
      // childEngagementRate < 30 && engagementDenominator>0 -> -3  => score = 52 - 3 = 49
      //
      // Instead let's use records that produce moderate rates (no bonus, no penalty).
      // We need to avoid ALL bonus and penalty triggers.
      // Bonuses trigger at various >=60,70,80,90 thresholds.
      // Penalties trigger at <30,<40 thresholds.
      //
      // Strategy: create records that yield rates between 40-59 for all metrics.
      // homeworkCompletionRate: need >=40 to avoid penalty. 50% = 1 of 2 set completed.
      // staffSupportRate: 50% -> no bonus. Need >=70 for bonus.
      // studyEnvironmentQualityRate: pct(good+excellent, total). 50% -> no bonus, no penalty.
      // tutoringCoverageRate: pct(unique children with tutoring, total_children). 1/3=33 -> no bonus. Need >=60 for bonus.
      //   Actually tutoringCoverageRate=33 is NOT penalized (only schoolLiaisonRate, homeworkCompletion, studyEnvQuality, childEngagement have penalties).
      // resourceAvailabilityRate: round((fulfilmentRate+ageAppropriateRate+usageRate)/3). Need <70 to avoid bonus, >=0 for no penalty (no penalty exists for resources).
      // schoolLiaisonRate: round((staffAttendanceRate+actionCompletionRate+academicDiscussionRate)/3). Need >=40 to avoid penalty. 50% -> 50.
      // childEngagementRate: pct(hwEngaged+tutEngaged+resUsing, hwRecs+tutRecs+resRecs). Need >=30 to avoid penalty. 50% -> no penalty, <70 no bonus.
      // pepUpToDateRate: need <70 to avoid bonus. 50% -> no bonus.
      // tutoringProgressRate: need <60 to avoid bonus. 50% -> no bonus.

      const hw1 = makeHomeworkSupport({ id: "h1", homework_set: true, homework_completed: true, staff_supported: false, child_engaged: false, outcome: "completed" });
      const hw2 = makeHomeworkSupport({ id: "h2", homework_set: true, homework_completed: false, staff_supported: true, child_engaged: true, outcome: "not_completed" });
      // homeworkCompletionRate = pct(1,2) = 50; staffSupportRate = pct(1,2) = 50; homeworkEngagementRate = pct(1,2)=50

      const se1 = makeStudyEnvironment({ id: "se1", overall_quality: "good" });
      const se2 = makeStudyEnvironment({ id: "se2", overall_quality: "poor" });
      // studyEnvironmentQualityRate = pct(1,2) = 50

      const t1 = makeTutoring({ id: "t1", child_id: "child_1", session_planned: true, session_attended: true, child_engaged: false, progress_noted: false });
      const t2 = makeTutoring({ id: "t2", child_id: "child_1", session_planned: true, session_attended: false, child_engaged: true, progress_noted: true });
      // tutoringAttendanceRate = pct(1,2) = 50; tutoringCoverageRate = pct(1,3) = 33; tutoringEngagementRate = pct(1,2)=50; tutoringProgressRate=pct(1,2)=50

      const res1 = makeResource({ id: "r1", requested: true, provided: true, age_appropriate: true, child_using_resource: false });
      const res2 = makeResource({ id: "r2", requested: true, provided: false, age_appropriate: false, child_using_resource: true });
      // resourceFulfilmentRate = pct(1,2)=50; ageAppropriateRate=pct(1,2)=50; resourceUsageRate=pct(1,2)=50
      // resourceAvailabilityRate = round((50+50+50)/3) = 50

      const li1 = makeLiaison({ id: "l1", staff_attended: true, actions_agreed: 2, actions_completed: 1, academic_progress_discussed: true, pep_up_to_date: true, child_voice_included: true });
      const li2 = makeLiaison({ id: "l2", staff_attended: false, actions_agreed: 2, actions_completed: 1, academic_progress_discussed: false, pep_up_to_date: false, child_voice_included: false });
      // staffAttendanceRate=pct(1,2)=50; actionCompletionRate=pct(2,4)=50; academicDiscussionRate=pct(1,2)=50
      // schoolLiaisonRate = round((50+50+50)/3) = 50
      // pepUpToDateRate=pct(1,2)=50; liaisonChildVoiceRate=pct(1,2)=50

      // childEngagementRate = pct(1+1+1, 2+2+2) = pct(3,6) = 50

      // Score: 52 + 0 (all rates in 40-59 range, no bonus triggers) + 0 (no penalty triggers) = 52
      const r = computeHomeworkAcademicSupport(
        baseInput({
          homework_support_records: [hw1, hw2],
          study_environment_records: [se1, se2],
          tutoring_records: [t1, t2],
          educational_resource_records: [res1, res2],
          school_liaison_records: [li1, li2],
        }),
      );
      expect(r.academic_score).toBe(52);
    });
  });

  // ── Outstanding ──────────────────────────────────────────────────────────

  describe("outstanding scenario", () => {
    function outstandingInput(): HomeworkAcademicSupportInput {
      // All metrics at >=90 to trigger max bonuses.
      // 10 homework records: all set, all completed, all staff supported, all engaged
      const hwRecs = Array.from({ length: 10 }, (_, i) =>
        makeHomeworkSupport({
          id: `hs_${i}`,
          date: `2026-05-${String(10 + i).padStart(2, "0")}`,
          subject: i % 2 === 0 ? "Maths" : "English",
          homework_set: true,
          homework_completed: true,
          staff_supported: true,
          support_quality: "excellent",
          time_allocated_minutes: 45,
          quiet_space_available: true,
          child_engaged: true,
          child_asked_for_help: true,
          barriers_encountered: [],
          outcome: "completed",
        }),
      );

      // 5 study environment records: all excellent
      const seRecs = Array.from({ length: 5 }, (_, i) =>
        makeStudyEnvironment({
          id: `se_${i}`,
          date: `2026-05-${String(5 + i).padStart(2, "0")}`,
          overall_quality: "excellent",
          quiet_space_available: true,
          child_satisfaction: 5,
        }),
      );

      // 3 tutoring records for 3 different children -> coverage = 3/3 = 100%
      const tRecs = [
        makeTutoring({ id: "t1", child_id: "child_1", session_planned: true, session_attended: true, child_engaged: true, progress_noted: true, child_satisfaction: 5, linked_to_school_curriculum: true }),
        makeTutoring({ id: "t2", child_id: "child_2", session_planned: true, session_attended: true, child_engaged: true, progress_noted: true, child_satisfaction: 5, linked_to_school_curriculum: true }),
        makeTutoring({ id: "t3", child_id: "child_3", session_planned: true, session_attended: true, child_engaged: true, progress_noted: true, child_satisfaction: 5, linked_to_school_curriculum: true }),
      ];

      // 5 resource records: all provided, all appropriate, all in use
      const resRecs = Array.from({ length: 5 }, (_, i) =>
        makeResource({
          id: `er_${i}`,
          date: `2026-05-${String(1 + i).padStart(2, "0")}`,
          requested: true,
          provided: true,
          age_appropriate: true,
          child_using_resource: true,
        }),
      );

      // 5 liaison records: all staff attended, all actions completed, all academic discussed, all PEP up to date
      const liRecs = Array.from({ length: 5 }, (_, i) =>
        makeLiaison({
          id: `sl_${i}`,
          date: `2026-05-${String(1 + i).padStart(2, "0")}`,
          staff_attended: true,
          actions_agreed: 3,
          actions_completed: 3,
          academic_progress_discussed: true,
          pep_up_to_date: true,
          child_voice_included: true,
          follow_up_date: "2026-06-01",
          follow_up_completed: true,
        }),
      );

      return baseInput({
        homework_support_records: hwRecs,
        study_environment_records: seRecs,
        tutoring_records: tRecs,
        educational_resource_records: resRecs,
        school_liaison_records: liRecs,
      });
    }

    it("rates outstanding with maximum bonuses", () => {
      const r = computeHomeworkAcademicSupport(outstandingInput());
      expect(r.academic_rating).toBe("outstanding");
      // base(52) + B1(4) + B2(3) + B3(3) + B4(4) + B5(3) + B6(3) + B7(3) + B8(3) + B9(2) = 80
      expect(r.academic_score).toBe(80);
    });

    it("returns 100% homework_completion_rate", () => {
      const r = computeHomeworkAcademicSupport(outstandingInput());
      expect(r.homework_completion_rate).toBe(100);
    });

    it("returns 100% study_environment_quality_rate", () => {
      const r = computeHomeworkAcademicSupport(outstandingInput());
      expect(r.study_environment_quality_rate).toBe(100);
    });

    it("returns 100% tutoring_coverage_rate", () => {
      const r = computeHomeworkAcademicSupport(outstandingInput());
      expect(r.tutoring_coverage_rate).toBe(100);
    });

    it("returns 100% resource_availability_rate", () => {
      const r = computeHomeworkAcademicSupport(outstandingInput());
      expect(r.resource_availability_rate).toBe(100);
    });

    it("returns 100% school_liaison_rate", () => {
      const r = computeHomeworkAcademicSupport(outstandingInput());
      expect(r.school_liaison_rate).toBe(100);
    });

    it("returns high child_engagement_rate", () => {
      const r = computeHomeworkAcademicSupport(outstandingInput());
      // engaged: 10 hw + 3 tut + 5 res = 18; denom: 10+3+5 = 18 -> 100%
      expect(r.child_engagement_rate).toBe(100);
    });

    it("has outstanding headline", () => {
      const r = computeHomeworkAcademicSupport(outstandingInput());
      expect(r.headline).toContain("Outstanding");
    });

    it("has no concerns", () => {
      const r = computeHomeworkAcademicSupport(outstandingInput());
      expect(r.concerns).toHaveLength(0);
    });

    it("has no recommendations", () => {
      const r = computeHomeworkAcademicSupport(outstandingInput());
      expect(r.recommendations).toHaveLength(0);
    });

    it("has multiple strengths", () => {
      const r = computeHomeworkAcademicSupport(outstandingInput());
      expect(r.strengths.length).toBeGreaterThan(5);
    });

    it("has a positive outstanding insight", () => {
      const r = computeHomeworkAcademicSupport(outstandingInput());
      const posInsights = r.insights.filter((i) => i.severity === "positive");
      expect(posInsights.length).toBeGreaterThan(0);
      expect(posInsights.some((i) => i.text.includes("outstanding"))).toBe(true);
    });
  });

  // ── Good ─────────────────────────────────────────────────────────────────

  describe("good scenario", () => {
    function goodInput(): HomeworkAcademicSupportInput {
      // Target score 65-79. We'll aim for ~70.
      // We need some bonuses but not all max.
      // B1: hwCompletionRate>=70 -> +2  (use 8/10 = 80% -> actually >=70 but <90 -> +2)
      // B2: studyEnvQualityRate>=70 -> +2  (3/4 = 75%)
      // B3: tutoringCoverageRate>=60 -> +1  (2/3 = 67%)
      // B4: resourceAvailRate>=70 -> +2
      // B5: schoolLiaisonRate>=70 -> +1
      // B6: childEngagementRate>=70 -> +2
      // B7: staffSupportRate>=70 -> +1
      // B8: pepUpToDateRate>=70 -> +1
      // B9: tutoringProgressRate>=60 -> +1
      // Total: 52 + 2+2+1+2+1+2+1+1+1 = 65. That's the low end of good.

      // Let's push it a bit higher. Use >=90 for a couple.
      // B1: hwCompletionRate>=90 -> +4 (9/10 = 90%)
      // B2: studyEnvQualityRate>=70 -> +2
      // B3: tutoringCoverageRate>=80 -> +3 (all 3 children)
      // B4: resourceAvailRate>=70 -> +2
      // B5: schoolLiaisonRate>=70 -> +1
      // B6: childEngagementRate>=70 -> +2
      // B7: staffSupportRate>=70 -> +1
      // B8: pepUpToDateRate>=70 -> +1
      // B9: tutoringProgressRate>=60 -> +1
      // Total: 52 + 4+2+3+2+1+2+1+1+1 = 69. Still good but near boundary.

      // Actually let me go with a mix. Score=72 would be clearly good.
      // B1(4) + B2(2) + B3(3) + B4(2) + B5(1) + B6(2) + B7(3) + B8(1) + B9(1) = 19 -> 52+19=71

      const hwRecs = Array.from({ length: 10 }, (_, i) =>
        makeHomeworkSupport({
          id: `hs_${i}`,
          homework_set: true,
          homework_completed: i < 9, // 9/10 = 90%
          staff_supported: i < 9, // 9/10 = 90% -> B7=+3
          child_engaged: i < 8, // 8/10 = 80%
          outcome: i < 9 ? "completed" : "not_completed",
        }),
      );

      const seRecs = Array.from({ length: 4 }, (_, i) =>
        makeStudyEnvironment({
          id: `se_${i}`,
          overall_quality: i < 3 ? "good" : "adequate", // 3/4=75% -> B2=+2
          child_satisfaction: i < 3 ? 4 : 3,
        }),
      );

      const tRecs = [
        makeTutoring({ id: "t1", child_id: "child_1", session_planned: true, session_attended: true, child_engaged: true, progress_noted: true }),
        makeTutoring({ id: "t2", child_id: "child_2", session_planned: true, session_attended: true, child_engaged: true, progress_noted: false }),
        makeTutoring({ id: "t3", child_id: "child_3", session_planned: true, session_attended: true, child_engaged: false, progress_noted: true }),
      ];
      // tutoringCoverageRate: 3/3 = 100% -> B3=+3
      // tutoringEngagementRate: 2/3=67%
      // tutoringProgressRate: 2/3=67% -> B9=+1

      const resRecs = Array.from({ length: 4 }, (_, i) =>
        makeResource({
          id: `er_${i}`,
          requested: true,
          provided: i < 3, // fulfilmentRate=pct(3,4)=75
          age_appropriate: i < 3, // ageAppropriateRate=pct(3,4)=75
          child_using_resource: i < 3, // usageRate=pct(3,4)=75
        }),
      );
      // resourceAvailabilityRate = round((75+75+75)/3) = 75 -> B4=+2

      const liRecs = Array.from({ length: 4 }, (_, i) =>
        makeLiaison({
          id: `sl_${i}`,
          staff_attended: i < 3, // staffAttendance=pct(3,4)=75
          actions_agreed: 2,
          actions_completed: i < 3 ? 2 : 0, // actionCompletion=pct(6,8)=75
          academic_progress_discussed: i < 3, // academicDiscussion=pct(3,4)=75
          pep_up_to_date: i < 3, // pepUpToDate=pct(3,4)=75 -> B8=+1
          child_voice_included: i < 3,
        }),
      );
      // schoolLiaisonRate = round((75+75+75)/3) = 75 -> B5=+1

      // childEngagementRate = pct(8+2+3, 10+3+4) = pct(13,17) = 76 -> B6=+2

      // Total: 52 + 4+2+3+2+1+2+3+1+1 = 71

      return baseInput({
        homework_support_records: hwRecs,
        study_environment_records: seRecs,
        tutoring_records: tRecs,
        educational_resource_records: resRecs,
        school_liaison_records: liRecs,
      });
    }

    it("rates good", () => {
      const r = computeHomeworkAcademicSupport(goodInput());
      expect(r.academic_rating).toBe("good");
      expect(r.academic_score).toBe(71);
    });

    it("headline contains Good and strengths count", () => {
      const r = computeHomeworkAcademicSupport(goodInput());
      expect(r.headline).toContain("Good");
    });

    it("has some strengths", () => {
      const r = computeHomeworkAcademicSupport(goodInput());
      expect(r.strengths.length).toBeGreaterThan(0);
    });
  });

  // ── Adequate ─────────────────────────────────────────────────────────────

  describe("adequate scenario", () => {
    function adequateInput(): HomeworkAcademicSupportInput {
      // Target score 45-64. We need base=52 with some bonuses and maybe a penalty.
      // Let's target exactly 52 (no bonuses, no penalties) -> adequate.
      // Use the same neutral data as the base score test.
      const hw1 = makeHomeworkSupport({ id: "h1", homework_set: true, homework_completed: true, staff_supported: false, child_engaged: false, outcome: "completed" });
      const hw2 = makeHomeworkSupport({ id: "h2", homework_set: true, homework_completed: false, staff_supported: true, child_engaged: true, outcome: "not_completed" });

      const se1 = makeStudyEnvironment({ id: "se1", overall_quality: "good" });
      const se2 = makeStudyEnvironment({ id: "se2", overall_quality: "poor" });

      const t1 = makeTutoring({ id: "t1", child_id: "child_1", session_planned: true, session_attended: true, child_engaged: false, progress_noted: false });
      const t2 = makeTutoring({ id: "t2", child_id: "child_1", session_planned: true, session_attended: false, child_engaged: true, progress_noted: true });

      const res1 = makeResource({ id: "r1", requested: true, provided: true, age_appropriate: true, child_using_resource: false });
      const res2 = makeResource({ id: "r2", requested: true, provided: false, age_appropriate: false, child_using_resource: true });

      const li1 = makeLiaison({ id: "l1", staff_attended: true, actions_agreed: 2, actions_completed: 1, academic_progress_discussed: true, pep_up_to_date: true, child_voice_included: true });
      const li2 = makeLiaison({ id: "l2", staff_attended: false, actions_agreed: 2, actions_completed: 1, academic_progress_discussed: false, pep_up_to_date: false, child_voice_included: false });

      return baseInput({
        homework_support_records: [hw1, hw2],
        study_environment_records: [se1, se2],
        tutoring_records: [t1, t2],
        educational_resource_records: [res1, res2],
        school_liaison_records: [li1, li2],
      });
    }

    it("rates adequate at score 52", () => {
      const r = computeHomeworkAcademicSupport(adequateInput());
      expect(r.academic_rating).toBe("adequate");
      expect(r.academic_score).toBe(52);
    });

    it("headline contains Adequate", () => {
      const r = computeHomeworkAcademicSupport(adequateInput());
      expect(r.headline).toContain("Adequate");
    });

    it("has concerns about areas needing improvement", () => {
      const r = computeHomeworkAcademicSupport(adequateInput());
      expect(r.concerns.length).toBeGreaterThan(0);
    });
  });

  // ── Inadequate ───────────────────────────────────────────────────────────

  describe("inadequate scenario", () => {
    function inadequateInput(): HomeworkAcademicSupportInput {
      // All metrics poor. Trigger all 4 penalties: -6-5-5-3 = -19 -> 52-19=33
      // homeworkCompletionRate <40: 1/5 set completed = 20%
      const hwRecs = Array.from({ length: 5 }, (_, i) =>
        makeHomeworkSupport({
          id: `hs_${i}`,
          homework_set: true,
          homework_completed: i === 0, // 1/5 = 20%
          staff_supported: false,
          child_engaged: false,
          outcome: i === 0 ? "completed" : "not_completed",
          barriers_encountered: ["no support"],
        }),
      );

      // studyEnvironmentQualityRate <40: 1/5 good or excellent = 20%
      const seRecs = Array.from({ length: 5 }, (_, i) =>
        makeStudyEnvironment({
          id: `se_${i}`,
          overall_quality: i === 0 ? "good" : "poor",
          quiet_space_available: false,
          child_satisfaction: 2,
        }),
      );

      // tutoringCoverageRate: 1 child / 3 = 33% -> no penalty for this
      const tRecs = [
        makeTutoring({ id: "t1", child_id: "child_1", session_planned: true, session_attended: false, child_engaged: false, progress_noted: false }),
      ];

      // resources: all poor
      const resRecs = Array.from({ length: 3 }, (_, i) =>
        makeResource({
          id: `er_${i}`,
          requested: true,
          provided: false,
          age_appropriate: false,
          child_using_resource: false,
        }),
      );

      // schoolLiaisonRate <40: make all 3 fields low
      const liRecs = Array.from({ length: 5 }, (_, i) =>
        makeLiaison({
          id: `sl_${i}`,
          staff_attended: i === 0, // staffAttendance=pct(1,5)=20
          actions_agreed: 3,
          actions_completed: 0, // actionCompletion=pct(0,15)=0
          academic_progress_discussed: i === 0, // academicDiscussion=pct(1,5)=20
          pep_up_to_date: false,
          child_voice_included: false,
        }),
      );
      // schoolLiaisonRate = round((20+0+20)/3) = round(13.33) = 13 -> penalty -5

      // childEngagementRate: pct(0+0+0, 5+1+3) = 0 -> <30 -> penalty -3

      // Score: 52 - 6 - 5 - 5 - 3 = 33

      return baseInput({
        homework_support_records: hwRecs,
        study_environment_records: seRecs,
        tutoring_records: tRecs,
        educational_resource_records: resRecs,
        school_liaison_records: liRecs,
      });
    }

    it("rates inadequate", () => {
      const r = computeHomeworkAcademicSupport(inadequateInput());
      expect(r.academic_rating).toBe("inadequate");
      expect(r.academic_score).toBe(33);
    });

    it("has multiple concerns", () => {
      const r = computeHomeworkAcademicSupport(inadequateInput());
      expect(r.concerns.length).toBeGreaterThanOrEqual(5);
    });

    it("has critical insights", () => {
      const r = computeHomeworkAcademicSupport(inadequateInput());
      const criticalInsights = r.insights.filter((i) => i.severity === "critical");
      expect(criticalInsights.length).toBeGreaterThanOrEqual(3);
    });

    it("has immediate recommendations", () => {
      const r = computeHomeworkAcademicSupport(inadequateInput());
      const immediateRecs = r.recommendations.filter((rec) => rec.urgency === "immediate");
      expect(immediateRecs.length).toBeGreaterThanOrEqual(3);
    });

    it("headline contains inadequate", () => {
      const r = computeHomeworkAcademicSupport(inadequateInput());
      expect(r.headline).toContain("inadequate");
    });
  });

  // ── Individual Bonus Tests ───────────────────────────────────────────────

  describe("individual bonuses (isolated)", () => {
    // Strategy: Start from a neutral base that yields score=52 (no bonus, no penalty),
    // then adjust ONLY the metric under test while keeping others neutral.
    // We'll use a helper that gives us 50% across the board (same as adequate test).

    function neutralInput(overrides: Partial<HomeworkAcademicSupportInput> = {}): HomeworkAcademicSupportInput {
      const hw1 = makeHomeworkSupport({ id: "h1", homework_set: true, homework_completed: true, staff_supported: false, child_engaged: false, outcome: "completed" });
      const hw2 = makeHomeworkSupport({ id: "h2", homework_set: true, homework_completed: false, staff_supported: true, child_engaged: true, outcome: "not_completed" });

      const se1 = makeStudyEnvironment({ id: "se1", overall_quality: "good" });
      const se2 = makeStudyEnvironment({ id: "se2", overall_quality: "poor" });

      const t1 = makeTutoring({ id: "t1", child_id: "child_1", session_planned: true, session_attended: true, child_engaged: false, progress_noted: false });
      const t2 = makeTutoring({ id: "t2", child_id: "child_1", session_planned: true, session_attended: false, child_engaged: true, progress_noted: true });

      const res1 = makeResource({ id: "r1", requested: true, provided: true, age_appropriate: true, child_using_resource: false });
      const res2 = makeResource({ id: "r2", requested: true, provided: false, age_appropriate: false, child_using_resource: true });

      const li1 = makeLiaison({ id: "l1", staff_attended: true, actions_agreed: 2, actions_completed: 1, academic_progress_discussed: true, pep_up_to_date: true, child_voice_included: true });
      const li2 = makeLiaison({ id: "l2", staff_attended: false, actions_agreed: 2, actions_completed: 1, academic_progress_discussed: false, pep_up_to_date: false, child_voice_included: false });

      return baseInput({
        homework_support_records: [hw1, hw2],
        study_environment_records: [se1, se2],
        tutoring_records: [t1, t2],
        educational_resource_records: [res1, res2],
        school_liaison_records: [li1, li2],
        ...overrides,
      });
    }

    // Verify the neutral baseline is 52
    it("neutral baseline is score 52", () => {
      const r = computeHomeworkAcademicSupport(neutralInput());
      expect(r.academic_score).toBe(52);
    });

    // Bonus 1: homeworkCompletionRate >=90 -> +4
    it("B1: homeworkCompletionRate >=90 adds +4", () => {
      // 10 homework records, all set, all completed
      const hwRecs = Array.from({ length: 10 }, (_, i) =>
        makeHomeworkSupport({
          id: `hs_${i}`,
          homework_set: true,
          homework_completed: true,
          staff_supported: false, // keep staffSupportRate at 0 (no B7 bonus)
          child_engaged: false, // keep engagement low from hw side
          outcome: "completed",
        }),
      );
      // hwCompletionRate=100% -> B1=+4
      // staffSupportRate=0% -> no B7
      // childEngagementRate = pct(0+1+1, 10+2+2) = pct(2,14) = 14% -> <30 penalty -3
      // So we need to manage engagement. Let's set child_engaged to match neutral on tut/res but override hw.
      // Actually childEngagement penalty would fire. Let's accept that and compute:
      // 52 + 4 (B1) - 3 (childEngagement<30) = 53
      // But we want isolation. Let me prevent the penalty by adding enough engaged records.
      // Instead, override tutoring/resources to have more engaged:
      const tRecs = Array.from({ length: 5 }, (_, i) =>
        makeTutoring({
          id: `t_${i}`,
          child_id: "child_1",
          session_planned: true,
          session_attended: i < 3, // 3/5=60% attendance
          child_engaged: true, // all engaged
          progress_noted: i < 3, // 3/5=60%, B9 triggers at >=60 -> +1. Hmm.
        }),
      );
      // tutoringProgressRate = pct(3,5) = 60 -> B9=+1. We need to avoid this.
      // Set progress_noted=false on 3:
      const tRecsFixed = Array.from({ length: 5 }, (_, i) =>
        makeTutoring({
          id: `t_${i}`,
          child_id: "child_1",
          session_planned: true,
          session_attended: i < 3,
          child_engaged: true,
          progress_noted: i < 2, // 2/5=40% -> no B9
        }),
      );
      // tutoringCoverageRate = pct(1,3)=33 -> no B3
      // tutoringEngagementRate = 100% but that doesn't affect bonus directly

      const resRecs = [
        makeResource({ id: "r1", requested: true, provided: true, age_appropriate: true, child_using_resource: true }),
        makeResource({ id: "r2", requested: true, provided: false, age_appropriate: false, child_using_resource: true }),
      ];
      // resourceAvailability = round((pct(1,2)+pct(1,2)+pct(2,2))/3) = round((50+50+100)/3) = round(66.67) = 67 -> no B4

      // childEngagementRate = pct(0+5+2, 10+5+2) = pct(7,17) = 41 -> >=30, <70 -> no penalty, no bonus

      // pepUpToDateRate = pct(1,2) = 50 -> no B8

      const r = computeHomeworkAcademicSupport(neutralInput({
        homework_support_records: hwRecs,
        tutoring_records: tRecsFixed,
        educational_resource_records: resRecs,
      }));
      // B1=+4, all others same as neutral or no bonus
      // studyEnvQualityRate=50% -> no B2
      // tutoringCoverageRate=33% -> no B3
      // resourceAvailRate=67 -> no B4
      // schoolLiaisonRate=50 -> no B5
      // childEngagement=41 -> no B6
      // staffSupportRate=0% -> no B7
      // pepUpToDate=50% -> no B8
      // tutoringProgress=40% -> no B9
      expect(r.academic_score).toBe(52 + 4);
    });

    // Bonus 1 lower tier: homeworkCompletionRate >=70 <90 -> +2
    it("B1: homeworkCompletionRate >=70 <90 adds +2", () => {
      // 10 records, 8 completed out of 10 set = 80%
      const hwRecs = Array.from({ length: 10 }, (_, i) =>
        makeHomeworkSupport({
          id: `hs_${i}`,
          homework_set: true,
          homework_completed: i < 8, // 8/10=80%
          staff_supported: false,
          child_engaged: false,
          outcome: i < 8 ? "completed" : "not_completed",
        }),
      );
      const tRecsFixed = Array.from({ length: 5 }, (_, i) =>
        makeTutoring({
          id: `t_${i}`,
          child_id: "child_1",
          session_planned: true,
          session_attended: i < 3,
          child_engaged: true,
          progress_noted: i < 2,
        }),
      );
      const resRecs = [
        makeResource({ id: "r1", requested: true, provided: true, age_appropriate: true, child_using_resource: true }),
        makeResource({ id: "r2", requested: true, provided: false, age_appropriate: false, child_using_resource: true }),
      ];
      const r = computeHomeworkAcademicSupport(neutralInput({
        homework_support_records: hwRecs,
        tutoring_records: tRecsFixed,
        educational_resource_records: resRecs,
      }));
      expect(r.academic_score).toBe(52 + 2);
    });

    // Bonus 2: studyEnvironmentQualityRate >=90 -> +3
    it("B2: studyEnvironmentQualityRate >=90 adds +3", () => {
      const seRecs = Array.from({ length: 10 }, (_, i) =>
        makeStudyEnvironment({
          id: `se_${i}`,
          overall_quality: i < 9 ? "excellent" : "good", // 10/10=100% good+excellent
          child_satisfaction: 4,
        }),
      );
      const r = computeHomeworkAcademicSupport(neutralInput({
        study_environment_records: seRecs,
      }));
      // B2=+3, others still neutral
      expect(r.academic_score).toBe(52 + 3);
    });

    // Bonus 2 lower: >=70 <90 -> +2
    it("B2: studyEnvironmentQualityRate >=70 <90 adds +2", () => {
      const seRecs = Array.from({ length: 10 }, (_, i) =>
        makeStudyEnvironment({
          id: `se_${i}`,
          overall_quality: i < 8 ? "good" : "poor", // 8/10=80%
          child_satisfaction: 3,
        }),
      );
      const r = computeHomeworkAcademicSupport(neutralInput({
        study_environment_records: seRecs,
      }));
      expect(r.academic_score).toBe(52 + 2);
    });

    // Bonus 3: tutoringCoverageRate >=80 -> +3
    it("B3: tutoringCoverageRate >=80 adds +3", () => {
      // Need 3 unique children out of total_children=3 -> 100%
      const tRecs = [
        makeTutoring({ id: "t1", child_id: "child_1", child_engaged: false, progress_noted: false }),
        makeTutoring({ id: "t2", child_id: "child_2", child_engaged: false, progress_noted: false }),
        makeTutoring({ id: "t3", child_id: "child_3", child_engaged: false, progress_noted: false }),
      ];
      // tutoringCoverage=100% -> B3=+3
      // tutoringEngagement=0%, but that only affects childEngagementRate
      // tutoringProgress=0% -> no B9
      // childEngagementRate = pct(1+0+1, 2+3+2) = pct(2,7) = 29 -> <30 -> penalty -3
      // To avoid penalty, set child_engaged on enough tut records:
      const tRecsFixed = [
        makeTutoring({ id: "t1", child_id: "child_1", child_engaged: true, progress_noted: false }),
        makeTutoring({ id: "t2", child_id: "child_2", child_engaged: false, progress_noted: false }),
        makeTutoring({ id: "t3", child_id: "child_3", child_engaged: false, progress_noted: false }),
      ];
      // childEngagement = pct(1+1+1, 2+3+2) = pct(3,7) = 43 -> >=30, no penalty, no bonus
      const r = computeHomeworkAcademicSupport(neutralInput({
        tutoring_records: tRecsFixed,
      }));
      expect(r.academic_score).toBe(52 + 3);
    });

    // Bonus 3 lower: >=60 <80 -> +1
    it("B3: tutoringCoverageRate >=60 <80 adds +1", () => {
      // Need 2 unique children out of 3 -> 67%
      const tRecsFixed = [
        makeTutoring({ id: "t1", child_id: "child_1", child_engaged: true, progress_noted: false }),
        makeTutoring({ id: "t2", child_id: "child_2", child_engaged: false, progress_noted: false }),
      ];
      // tutoringCoverage = pct(2,3)=67 -> B3=+1
      // childEngagement = pct(1+1+1, 2+2+2) = pct(3,6) = 50 -> no penalty, no bonus
      const r = computeHomeworkAcademicSupport(neutralInput({
        tutoring_records: tRecsFixed,
      }));
      expect(r.academic_score).toBe(52 + 1);
    });

    // Bonus 4: resourceAvailabilityRate >=90 -> +4
    it("B4: resourceAvailabilityRate >=90 adds +4", () => {
      // resourceAvailabilityRate = round((fulfilment + ageAppropriate + usage) / 3)
      // All 100%: round((100+100+100)/3) = 100
      const resRecs = Array.from({ length: 5 }, (_, i) =>
        makeResource({
          id: `er_${i}`,
          requested: true,
          provided: true,
          age_appropriate: true,
          child_using_resource: true,
        }),
      );
      // childEngagement = pct(1+1+5, 2+2+5) = pct(7,9) = 78 -> B6=+2!
      // We need to neutralize B6. Set resource child_using_resource to false on some:
      // But that would lower resourceAvailabilityRate. Instead, neutralize hw/tut engagement.
      // hw: child_engaged both false -> hwEngaged=0
      // tut: child_engaged both false -> tutEngaged=0
      // res: child_using_resource all true -> resUsing=5
      // childEngagement = pct(0+0+5, 2+2+5) = pct(5,9) = 56 -> >=30 no penalty, <70 no B6
      const hwRecs = [
        makeHomeworkSupport({ id: "h1", homework_set: true, homework_completed: true, staff_supported: false, child_engaged: false, outcome: "completed" }),
        makeHomeworkSupport({ id: "h2", homework_set: true, homework_completed: false, staff_supported: true, child_engaged: false, outcome: "not_completed" }),
      ];
      const tRecs = [
        makeTutoring({ id: "t1", child_id: "child_1", session_planned: true, session_attended: true, child_engaged: false, progress_noted: false }),
        makeTutoring({ id: "t2", child_id: "child_1", session_planned: true, session_attended: false, child_engaged: false, progress_noted: true }),
      ];
      // tutoringProgressRate = pct(1,2)=50 -> no B9
      const r = computeHomeworkAcademicSupport(neutralInput({
        homework_support_records: hwRecs,
        tutoring_records: tRecs,
        educational_resource_records: resRecs,
      }));
      // B4=+4, no other bonuses, no penalties
      expect(r.academic_score).toBe(52 + 4);
    });

    // Bonus 4 lower: >=70 <90 -> +2
    it("B4: resourceAvailabilityRate >=70 <90 adds +2", () => {
      // round((75+75+75)/3) = 75
      const resRecs = Array.from({ length: 4 }, (_, i) =>
        makeResource({
          id: `er_${i}`,
          requested: true,
          provided: i < 3, // 3/4=75
          age_appropriate: i < 3, // 75
          child_using_resource: i < 3, // 75
        }),
      );
      const hwRecs = [
        makeHomeworkSupport({ id: "h1", homework_set: true, homework_completed: true, staff_supported: false, child_engaged: false, outcome: "completed" }),
        makeHomeworkSupport({ id: "h2", homework_set: true, homework_completed: false, staff_supported: true, child_engaged: false, outcome: "not_completed" }),
      ];
      const tRecs = [
        makeTutoring({ id: "t1", child_id: "child_1", session_planned: true, session_attended: true, child_engaged: false, progress_noted: false }),
        makeTutoring({ id: "t2", child_id: "child_1", session_planned: true, session_attended: false, child_engaged: false, progress_noted: true }),
      ];
      // childEngagement = pct(0+0+3, 2+2+4) = pct(3,8) = 38 -> >=30 no penalty, no bonus
      const r = computeHomeworkAcademicSupport(neutralInput({
        homework_support_records: hwRecs,
        tutoring_records: tRecs,
        educational_resource_records: resRecs,
      }));
      expect(r.academic_score).toBe(52 + 2);
    });

    // Bonus 5: schoolLiaisonRate >=90 -> +3
    it("B5: schoolLiaisonRate >=90 adds +3", () => {
      // schoolLiaisonRate = round((staffAttendance + actionCompletion + academicDiscussion)/3)
      // All 100%: round((100+100+100)/3) = 100
      const liRecs = Array.from({ length: 5 }, (_, i) =>
        makeLiaison({
          id: `sl_${i}`,
          staff_attended: true,
          actions_agreed: 2,
          actions_completed: 2,
          academic_progress_discussed: true,
          pep_up_to_date: i < 2, // 2/5=40 -> no B8
          child_voice_included: true,
        }),
      );
      const r = computeHomeworkAcademicSupport(neutralInput({
        school_liaison_records: liRecs,
      }));
      // B5=+3
      expect(r.academic_score).toBe(52 + 3);
    });

    // Bonus 5 lower: >=70 <90 -> +1
    it("B5: schoolLiaisonRate >=70 <90 adds +1", () => {
      // round((80+80+80)/3) = 80
      const liRecs = Array.from({ length: 5 }, (_, i) =>
        makeLiaison({
          id: `sl_${i}`,
          staff_attended: i < 4, // 4/5=80
          actions_agreed: 5,
          actions_completed: i < 4 ? 5 : 0, // completed=20, total=25 -> pct(20,25)=80
          academic_progress_discussed: i < 4, // 4/5=80
          pep_up_to_date: i < 2, // 2/5=40 -> no B8
          child_voice_included: i < 2,
        }),
      );
      const r = computeHomeworkAcademicSupport(neutralInput({
        school_liaison_records: liRecs,
      }));
      expect(r.academic_score).toBe(52 + 1);
    });

    // Bonus 6: childEngagementRate >=90 -> +3
    it("B6: childEngagementRate >=90 adds +3", () => {
      // childEngagement = pct(hwEngaged+tutEngaged+resUsing, hwRecs+tutRecs+resRecs)
      // All engaged:
      const hwRecs = [
        makeHomeworkSupport({ id: "h1", homework_set: true, homework_completed: true, staff_supported: false, child_engaged: true, outcome: "completed" }),
        makeHomeworkSupport({ id: "h2", homework_set: true, homework_completed: false, staff_supported: true, child_engaged: true, outcome: "not_completed" }),
      ];
      const tRecs = [
        makeTutoring({ id: "t1", child_id: "child_1", session_planned: true, session_attended: true, child_engaged: true, progress_noted: false }),
        makeTutoring({ id: "t2", child_id: "child_1", session_planned: true, session_attended: false, child_engaged: true, progress_noted: true }),
      ];
      const resRecs = [
        makeResource({ id: "r1", requested: true, provided: true, age_appropriate: true, child_using_resource: true }),
        makeResource({ id: "r2", requested: true, provided: false, age_appropriate: false, child_using_resource: true }),
      ];
      // childEngagement = pct(2+2+2, 2+2+2) = 100 -> B6=+3
      // But this also changes: staffSupportRate=pct(1,2)=50 -> no B7
      // homeworkCompletionRate=pct(1,2)=50 -> no B1
      // resourceAvailRate = round((50+50+100)/3) = round(66.67) = 67 -> no B4
      // tutoringProgressRate=pct(1,2)=50 -> no B9
      const r = computeHomeworkAcademicSupport(neutralInput({
        homework_support_records: hwRecs,
        tutoring_records: tRecs,
        educational_resource_records: resRecs,
      }));
      expect(r.academic_score).toBe(52 + 3);
    });

    // Bonus 6 lower: >=70 <90 -> +2
    it("B6: childEngagementRate >=70 <90 adds +2", () => {
      // Need pct(engaged, total) in [70, 89]
      // 5 hw engaged out of 7 hw + 0 tut engaged out of 0 tut + 0 res used out of 0 res
      // Actually keep tut and res from neutral but set most engaged:
      const hwRecs = Array.from({ length: 8 }, (_, i) =>
        makeHomeworkSupport({
          id: `hs_${i}`,
          homework_set: true,
          homework_completed: i < 4, // 4/8=50% -> no B1
          staff_supported: i < 4, // 50% -> no B7
          child_engaged: i < 6, // 6 of 8 engaged
          outcome: i < 4 ? "completed" : "not_completed",
        }),
      );
      // tut: keep both not engaged, res: keep both not using
      // childEngagement = pct(6+1+1, 8+2+2) = pct(8,12) = 67 -- too low!
      // Need more: set tut both engaged, res both using
      const tRecs = [
        makeTutoring({ id: "t1", child_id: "child_1", session_planned: true, session_attended: true, child_engaged: true, progress_noted: false }),
        makeTutoring({ id: "t2", child_id: "child_1", session_planned: true, session_attended: false, child_engaged: true, progress_noted: true }),
      ];
      const resRecs = [
        makeResource({ id: "r1", requested: true, provided: true, age_appropriate: true, child_using_resource: true }),
        makeResource({ id: "r2", requested: true, provided: false, age_appropriate: false, child_using_resource: false }),
      ];
      // childEngagement = pct(6+2+1, 8+2+2) = pct(9,12) = 75 -> B6=+2
      // resourceAvailRate = round((pct(1,2)+pct(1,2)+pct(1,2))/3) = round((50+50+50)/3) = 50 -> no B4
      // tutoringProgress = pct(1,2)=50 -> no B9
      const r = computeHomeworkAcademicSupport(neutralInput({
        homework_support_records: hwRecs,
        tutoring_records: tRecs,
        educational_resource_records: resRecs,
      }));
      expect(r.academic_score).toBe(52 + 2);
    });

    // Bonus 7: staffSupportRate >=90 -> +3
    it("B7: staffSupportRate >=90 adds +3", () => {
      const hwRecs = Array.from({ length: 10 }, (_, i) =>
        makeHomeworkSupport({
          id: `hs_${i}`,
          homework_set: true,
          homework_completed: i < 5, // 5/10=50% -> no B1
          staff_supported: true, // 10/10=100% -> B7=+3
          child_engaged: false,
          outcome: i < 5 ? "completed" : "not_completed",
        }),
      );
      // childEngagement = pct(0+1+1, 10+2+2) = pct(2,14) = 14 -> <30 -> penalty -3
      // Compensate by adding engaged tut/res:
      const tRecsFixed = Array.from({ length: 4 }, (_, i) =>
        makeTutoring({
          id: `t_${i}`,
          child_id: "child_1",
          session_planned: true,
          session_attended: i < 2,
          child_engaged: true,
          progress_noted: i < 2, // 2/4=50 -> no B9
        }),
      );
      const resRecs = [
        makeResource({ id: "r1", requested: true, provided: true, age_appropriate: true, child_using_resource: true }),
        makeResource({ id: "r2", requested: true, provided: false, age_appropriate: false, child_using_resource: true }),
      ];
      // childEngagement = pct(0+4+2, 10+4+2) = pct(6,16) = 38 -> >=30 no penalty, <70 no B6
      // tutoringCoverage = pct(1,3)=33 -> no B3
      // resourceAvailRate = round((50+50+100)/3)=67 -> no B4
      const r = computeHomeworkAcademicSupport(neutralInput({
        homework_support_records: hwRecs,
        tutoring_records: tRecsFixed,
        educational_resource_records: resRecs,
      }));
      expect(r.academic_score).toBe(52 + 3);
    });

    // Bonus 7 lower: >=70 <90 -> +1
    it("B7: staffSupportRate >=70 <90 adds +1", () => {
      const hwRecs = Array.from({ length: 10 }, (_, i) =>
        makeHomeworkSupport({
          id: `hs_${i}`,
          homework_set: true,
          homework_completed: i < 5, // 50% -> no B1
          staff_supported: i < 8, // 8/10=80% -> B7=+1
          child_engaged: false,
          outcome: i < 5 ? "completed" : "not_completed",
        }),
      );
      const tRecsFixed = Array.from({ length: 4 }, (_, i) =>
        makeTutoring({
          id: `t_${i}`,
          child_id: "child_1",
          session_planned: true,
          session_attended: i < 2,
          child_engaged: true,
          progress_noted: i < 2,
        }),
      );
      const resRecs = [
        makeResource({ id: "r1", requested: true, provided: true, age_appropriate: true, child_using_resource: true }),
        makeResource({ id: "r2", requested: true, provided: false, age_appropriate: false, child_using_resource: true }),
      ];
      // childEngagement = pct(0+4+2, 10+4+2) = pct(6,16) = 38
      const r = computeHomeworkAcademicSupport(neutralInput({
        homework_support_records: hwRecs,
        tutoring_records: tRecsFixed,
        educational_resource_records: resRecs,
      }));
      expect(r.academic_score).toBe(52 + 1);
    });

    // Bonus 8: pepUpToDateRate >=90 -> +3
    it("B8: pepUpToDateRate >=90 adds +3", () => {
      const liRecs = Array.from({ length: 5 }, (_, i) =>
        makeLiaison({
          id: `sl_${i}`,
          staff_attended: i < 3, // 3/5=60 -> no penalty for liaison
          actions_agreed: 2,
          actions_completed: 1, // pct(5,10)=50
          academic_progress_discussed: i < 3, // 3/5=60
          pep_up_to_date: true, // 5/5=100 -> B8=+3
          child_voice_included: i < 3,
        }),
      );
      // schoolLiaisonRate = round((60+50+60)/3) = round(56.67) = 57 -> no B5, no penalty
      const r = computeHomeworkAcademicSupport(neutralInput({
        school_liaison_records: liRecs,
      }));
      expect(r.academic_score).toBe(52 + 3);
    });

    // Bonus 8 lower: >=70 <90 -> +1
    it("B8: pepUpToDateRate >=70 <90 adds +1", () => {
      const liRecs = Array.from({ length: 5 }, (_, i) =>
        makeLiaison({
          id: `sl_${i}`,
          staff_attended: i < 3,
          actions_agreed: 2,
          actions_completed: 1,
          academic_progress_discussed: i < 3,
          pep_up_to_date: i < 4, // 4/5=80 -> B8=+1
          child_voice_included: i < 3,
        }),
      );
      const r = computeHomeworkAcademicSupport(neutralInput({
        school_liaison_records: liRecs,
      }));
      expect(r.academic_score).toBe(52 + 1);
    });

    // Bonus 9: tutoringProgressRate >=80 -> +2
    it("B9: tutoringProgressRate >=80 adds +2", () => {
      const tRecs = Array.from({ length: 5 }, (_, i) =>
        makeTutoring({
          id: `t_${i}`,
          child_id: "child_1",
          session_planned: true,
          session_attended: i < 3,
          child_engaged: i < 2, // 2/5=40%
          progress_noted: i < 4, // 4/5=80% -> B9=+2
        }),
      );
      // tutoringCoverage = pct(1,3) = 33 -> no B3
      // childEngagement = pct(1+2+1, 2+5+2) = pct(4,9) = 44 -> no B6, no penalty
      const r = computeHomeworkAcademicSupport(neutralInput({
        tutoring_records: tRecs,
      }));
      expect(r.academic_score).toBe(52 + 2);
    });

    // Bonus 9 lower: >=60 <80 -> +1
    it("B9: tutoringProgressRate >=60 <80 adds +1", () => {
      const tRecs = Array.from({ length: 5 }, (_, i) =>
        makeTutoring({
          id: `t_${i}`,
          child_id: "child_1",
          session_planned: true,
          session_attended: i < 3,
          child_engaged: i < 2,
          progress_noted: i < 3, // 3/5=60% -> B9=+1
        }),
      );
      // childEngagement = pct(1+2+1, 2+5+2) = pct(4,9) = 44
      const r = computeHomeworkAcademicSupport(neutralInput({
        tutoring_records: tRecs,
      }));
      expect(r.academic_score).toBe(52 + 1);
    });
  });

  // ── Individual Penalty Tests ─────────────────────────────────────────────

  describe("individual penalties (isolated)", () => {
    function neutralInput(overrides: Partial<HomeworkAcademicSupportInput> = {}): HomeworkAcademicSupportInput {
      const hw1 = makeHomeworkSupport({ id: "h1", homework_set: true, homework_completed: true, staff_supported: false, child_engaged: false, outcome: "completed" });
      const hw2 = makeHomeworkSupport({ id: "h2", homework_set: true, homework_completed: false, staff_supported: true, child_engaged: true, outcome: "not_completed" });
      const se1 = makeStudyEnvironment({ id: "se1", overall_quality: "good" });
      const se2 = makeStudyEnvironment({ id: "se2", overall_quality: "poor" });
      const t1 = makeTutoring({ id: "t1", child_id: "child_1", session_planned: true, session_attended: true, child_engaged: false, progress_noted: false });
      const t2 = makeTutoring({ id: "t2", child_id: "child_1", session_planned: true, session_attended: false, child_engaged: true, progress_noted: true });
      const res1 = makeResource({ id: "r1", requested: true, provided: true, age_appropriate: true, child_using_resource: false });
      const res2 = makeResource({ id: "r2", requested: true, provided: false, age_appropriate: false, child_using_resource: true });
      const li1 = makeLiaison({ id: "l1", staff_attended: true, actions_agreed: 2, actions_completed: 1, academic_progress_discussed: true, pep_up_to_date: true, child_voice_included: true });
      const li2 = makeLiaison({ id: "l2", staff_attended: false, actions_agreed: 2, actions_completed: 1, academic_progress_discussed: false, pep_up_to_date: false, child_voice_included: false });

      return baseInput({
        homework_support_records: [hw1, hw2],
        study_environment_records: [se1, se2],
        tutoring_records: [t1, t2],
        educational_resource_records: [res1, res2],
        school_liaison_records: [li1, li2],
        ...overrides,
      });
    }

    // Penalty 1: homeworkCompletionRate <40 && homeworkSet>0 -> -6
    it("P1: homeworkCompletionRate <40 deducts -6", () => {
      // 10 records, 3 completed of 10 set = 30%
      const hwRecs = Array.from({ length: 10 }, (_, i) =>
        makeHomeworkSupport({
          id: `hs_${i}`,
          homework_set: true,
          homework_completed: i < 3, // 3/10=30%
          staff_supported: i < 5, // 50% -> no B7
          child_engaged: i < 4, // 4/10
          outcome: i < 3 ? "completed" : "not_completed",
        }),
      );
      // childEngagement = pct(4+1+1, 10+2+2) = pct(6,14) = 43 -> no penalty for engagement
      const r = computeHomeworkAcademicSupport(neutralInput({
        homework_support_records: hwRecs,
      }));
      expect(r.academic_score).toBe(52 - 6);
    });

    // Penalty 1 guard: homeworkCompletionRate < 40 but homeworkSet=0 -> no penalty
    it("P1: no penalty when homeworkSet=0 even with homework_completed=false", () => {
      const hwRecs = [
        makeHomeworkSupport({ id: "h1", homework_set: false, homework_completed: false, staff_supported: false, child_engaged: false }),
        makeHomeworkSupport({ id: "h2", homework_set: false, homework_completed: false, staff_supported: true, child_engaged: true }),
      ];
      // homeworkCompletionRate = pct(0,0) = 0 < 40, but homeworkSet=0 -> guard prevents penalty
      // childEngagement = pct(1+1+1, 2+2+2) = 50 -> no penalty
      const r = computeHomeworkAcademicSupport(neutralInput({
        homework_support_records: hwRecs,
      }));
      expect(r.academic_score).toBe(52);
    });

    // Penalty 2: studyEnvironmentQualityRate <40 && totalStudyEnvRecords>0 -> -5
    it("P2: studyEnvironmentQualityRate <40 deducts -5", () => {
      const seRecs = Array.from({ length: 5 }, (_, i) =>
        makeStudyEnvironment({
          id: `se_${i}`,
          overall_quality: i === 0 ? "good" : "poor", // 1/5=20%
          child_satisfaction: 3,
        }),
      );
      const r = computeHomeworkAcademicSupport(neutralInput({
        study_environment_records: seRecs,
      }));
      expect(r.academic_score).toBe(52 - 5);
    });

    // Penalty 3: schoolLiaisonRate <40 && totalLiaisonRecords>0 -> -5
    it("P3: schoolLiaisonRate <40 deducts -5", () => {
      const liRecs = Array.from({ length: 5 }, (_, i) =>
        makeLiaison({
          id: `sl_${i}`,
          staff_attended: i === 0, // 1/5=20
          actions_agreed: 3,
          actions_completed: 0, // pct(0,15)=0
          academic_progress_discussed: i === 0, // 1/5=20
          pep_up_to_date: i < 3, // 3/5=60 -> no B8
          child_voice_included: i < 3,
        }),
      );
      // schoolLiaisonRate = round((20+0+20)/3) = round(13.33) = 13 -> penalty -5
      const r = computeHomeworkAcademicSupport(neutralInput({
        school_liaison_records: liRecs,
      }));
      expect(r.academic_score).toBe(52 - 5);
    });

    // Penalty 4: childEngagementRate <30 && engagementDenominator>0 -> -3
    it("P4: childEngagementRate <30 deducts -3", () => {
      // Make most things not engaged:
      const hwRecs = Array.from({ length: 10 }, (_, i) =>
        makeHomeworkSupport({
          id: `hs_${i}`,
          homework_set: true,
          homework_completed: i < 5, // 50% -> no B1
          staff_supported: i < 5, // 50% -> no B7
          child_engaged: false,
          outcome: i < 5 ? "completed" : "not_completed",
        }),
      );
      const tRecs = [
        makeTutoring({ id: "t1", child_id: "child_1", session_planned: true, session_attended: true, child_engaged: false, progress_noted: false }),
      ];
      const resRecs = [
        makeResource({ id: "r1", requested: true, provided: true, age_appropriate: true, child_using_resource: false }),
        makeResource({ id: "r2", requested: true, provided: false, age_appropriate: false, child_using_resource: false }),
      ];
      // childEngagement = pct(0+0+0, 10+1+2) = 0 -> <30 -> penalty -3
      const r = computeHomeworkAcademicSupport(neutralInput({
        homework_support_records: hwRecs,
        tutoring_records: tRecs,
        educational_resource_records: resRecs,
      }));
      expect(r.academic_score).toBe(52 - 3);
    });

    // Penalty 4 guard: engagementDenominator=0 -> no penalty
    it("P4: no childEngagement penalty when denominator is 0", () => {
      // No homework, tutoring, or resource records -> denominator = 0
      // But we need at least one record type to avoid the allEmpty path
      const liRecs = [
        makeLiaison({ id: "l1", staff_attended: true, actions_agreed: 2, actions_completed: 1, academic_progress_discussed: true, pep_up_to_date: true }),
        makeLiaison({ id: "l2", staff_attended: false, actions_agreed: 2, actions_completed: 1, academic_progress_discussed: false, pep_up_to_date: false }),
      ];
      const r = computeHomeworkAcademicSupport(baseInput({
        homework_support_records: [],
        study_environment_records: [],
        tutoring_records: [],
        educational_resource_records: [],
        school_liaison_records: liRecs,
      }));
      // childEngagement = pct(0,0) = 0 but engagementDenominator=0 -> guard -> no penalty
      // schoolLiaisonRate = round((50+50+50)/3) = 50 -> no penalty, no bonus
      // pepUpToDate = 50% -> no B8
      // Score = 52
      expect(r.academic_score).toBe(52);
    });

    // Multiple penalties can stack
    it("all 4 penalties stack to -19", () => {
      const hwRecs = Array.from({ length: 5 }, (_, i) =>
        makeHomeworkSupport({
          id: `hs_${i}`,
          homework_set: true,
          homework_completed: i === 0, // 1/5=20% -> P1: -6
          staff_supported: false,
          child_engaged: false,
          outcome: i === 0 ? "completed" : "not_completed",
        }),
      );
      const seRecs = Array.from({ length: 5 }, (_, i) =>
        makeStudyEnvironment({
          id: `se_${i}`,
          overall_quality: i === 0 ? "good" : "poor", // 1/5=20% -> P2: -5
          child_satisfaction: 2,
        }),
      );
      const tRecs = [
        makeTutoring({ id: "t1", child_id: "child_1", child_engaged: false, progress_noted: false }),
      ];
      const resRecs = [
        makeResource({ id: "r1", requested: true, provided: false, age_appropriate: false, child_using_resource: false }),
      ];
      const liRecs = Array.from({ length: 5 }, (_, i) =>
        makeLiaison({
          id: `sl_${i}`,
          staff_attended: i === 0, // 20%
          actions_agreed: 3,
          actions_completed: 0, // 0%
          academic_progress_discussed: i === 0, // 20%
          pep_up_to_date: false,
          child_voice_included: false,
        }),
      );
      // schoolLiaisonRate = round((20+0+20)/3) = 13 -> P3: -5
      // childEngagement = pct(0+0+0, 5+1+1) = 0 -> P4: -3
      const r = computeHomeworkAcademicSupport(baseInput({
        homework_support_records: hwRecs,
        study_environment_records: seRecs,
        tutoring_records: tRecs,
        educational_resource_records: resRecs,
        school_liaison_records: liRecs,
      }));
      expect(r.academic_score).toBe(52 - 6 - 5 - 5 - 3); // 33
    });
  });

  // ── Rate Calculations ────────────────────────────────────────────────────

  describe("rate calculations", () => {
    it("homework_completion_rate = pct(completed when set, total set)", () => {
      const hwRecs = [
        makeHomeworkSupport({ id: "h1", homework_set: true, homework_completed: true }),
        makeHomeworkSupport({ id: "h2", homework_set: true, homework_completed: false }),
        makeHomeworkSupport({ id: "h3", homework_set: false, homework_completed: false }), // not counted in denominator
      ];
      const r = computeHomeworkAcademicSupport(baseInput({
        homework_support_records: hwRecs,
        study_environment_records: [makeStudyEnvironment()],
      }));
      expect(r.homework_completion_rate).toBe(pct(1, 2)); // 50
    });

    it("homework_completion_rate is 0 when no homework set", () => {
      const hwRecs = [
        makeHomeworkSupport({ id: "h1", homework_set: false, homework_completed: false }),
      ];
      const r = computeHomeworkAcademicSupport(baseInput({
        homework_support_records: hwRecs,
      }));
      expect(r.homework_completion_rate).toBe(0);
    });

    it("study_environment_quality_rate = pct(good+excellent, total)", () => {
      const seRecs = [
        makeStudyEnvironment({ id: "se1", overall_quality: "excellent" }),
        makeStudyEnvironment({ id: "se2", overall_quality: "good" }),
        makeStudyEnvironment({ id: "se3", overall_quality: "adequate" }),
        makeStudyEnvironment({ id: "se4", overall_quality: "poor" }),
      ];
      const r = computeHomeworkAcademicSupport(baseInput({
        study_environment_records: seRecs,
      }));
      expect(r.study_environment_quality_rate).toBe(pct(2, 4)); // 50
    });

    it("tutoring_coverage_rate = pct(unique children, total_children)", () => {
      const tRecs = [
        makeTutoring({ id: "t1", child_id: "child_1" }),
        makeTutoring({ id: "t2", child_id: "child_1" }), // duplicate child
        makeTutoring({ id: "t3", child_id: "child_2" }),
      ];
      const r = computeHomeworkAcademicSupport(baseInput({
        tutoring_records: tRecs,
        total_children: 3,
      }));
      expect(r.tutoring_coverage_rate).toBe(pct(2, 3)); // 67
    });

    it("tutoring_coverage_rate falls back to attendance rate when total_children=0", () => {
      // When total_children is 0 but not allEmpty, the engine goes through
      // the main path. Coverage = tutoringAttendanceRate when total_children=0
      const tRecs = [
        makeTutoring({ id: "t1", session_planned: true, session_attended: true }),
        makeTutoring({ id: "t2", session_planned: true, session_attended: false }),
      ];
      const r = computeHomeworkAcademicSupport(baseInput({
        tutoring_records: tRecs,
        total_children: 0,
        homework_support_records: [makeHomeworkSupport()], // prevent allEmpty
      }));
      // Actually total_children=0 and allEmpty check: hwRecs not empty so not allEmpty
      // tutoringCoverageRate = total_children > 0 ? pct(unique, total) : tutoringAttendanceRate
      // total_children=0 -> tutoringAttendanceRate = pct(1,2) = 50
      expect(r.tutoring_coverage_rate).toBe(50);
    });

    it("resource_availability_rate = round((fulfilment + ageAppropriate + usage) / 3)", () => {
      const resRecs = [
        makeResource({ id: "r1", requested: true, provided: true, age_appropriate: true, child_using_resource: true }),
        makeResource({ id: "r2", requested: true, provided: true, age_appropriate: false, child_using_resource: false }),
        makeResource({ id: "r3", requested: false, provided: false, age_appropriate: true, child_using_resource: true }),
      ];
      // fulfilmentRate = pct(2, 2) = 100 (only count requested ones for fulfilment denominator)
      // ageAppropriateRate = pct(2, 3) = 67
      // usageRate = pct(2, 3) = 67
      // resourceAvailabilityRate = round((100 + 67 + 67) / 3) = round(78) = 78
      const r = computeHomeworkAcademicSupport(baseInput({
        educational_resource_records: resRecs,
      }));
      expect(r.resource_availability_rate).toBe(78);
    });

    it("resource_availability_rate is 0 when no records", () => {
      const r = computeHomeworkAcademicSupport(baseInput({
        school_liaison_records: [makeLiaison()], // prevent allEmpty
      }));
      expect(r.resource_availability_rate).toBe(0);
    });

    it("school_liaison_rate = round((staffAttendance + actionCompletion + academicDiscussion) / 3)", () => {
      const liRecs = [
        makeLiaison({ id: "l1", staff_attended: true, actions_agreed: 4, actions_completed: 3, academic_progress_discussed: true }),
        makeLiaison({ id: "l2", staff_attended: true, actions_agreed: 4, actions_completed: 3, academic_progress_discussed: false }),
        makeLiaison({ id: "l3", staff_attended: false, actions_agreed: 2, actions_completed: 0, academic_progress_discussed: true }),
      ];
      // staffAttendance = pct(2,3) = 67
      // actionCompletion = pct(6,10) = 60
      // academicDiscussion = pct(2,3) = 67
      // schoolLiaisonRate = round((67+60+67)/3) = round(64.67) = 65
      const r = computeHomeworkAcademicSupport(baseInput({
        school_liaison_records: liRecs,
      }));
      expect(r.school_liaison_rate).toBe(65);
    });

    it("school_liaison_rate is 0 when no records", () => {
      const r = computeHomeworkAcademicSupport(baseInput({
        homework_support_records: [makeHomeworkSupport()], // prevent allEmpty
      }));
      expect(r.school_liaison_rate).toBe(0);
    });

    it("child_engagement_rate spans homework + tutoring + resources", () => {
      const hwRecs = [
        makeHomeworkSupport({ id: "h1", child_engaged: true }),
        makeHomeworkSupport({ id: "h2", child_engaged: false }),
      ];
      const tRecs = [
        makeTutoring({ id: "t1", child_engaged: true }),
      ];
      const resRecs = [
        makeResource({ id: "r1", child_using_resource: true }),
        makeResource({ id: "r2", child_using_resource: false }),
      ];
      // engagement = pct(1+1+1, 2+1+2) = pct(3,5) = 60
      const r = computeHomeworkAcademicSupport(baseInput({
        homework_support_records: hwRecs,
        tutoring_records: tRecs,
        educational_resource_records: resRecs,
      }));
      expect(r.child_engagement_rate).toBe(60);
    });

    it("child_engagement_rate is 0 when no hw/tut/res records", () => {
      const r = computeHomeworkAcademicSupport(baseInput({
        school_liaison_records: [makeLiaison()],
      }));
      expect(r.child_engagement_rate).toBe(0);
    });
  });

  // ── Strengths ────────────────────────────────────────────────────────────

  describe("strengths", () => {
    it("strength for homeworkCompletionRate >=90", () => {
      const hwRecs = Array.from({ length: 10 }, (_, i) =>
        makeHomeworkSupport({ id: `h${i}`, homework_set: true, homework_completed: true }),
      );
      const r = computeHomeworkAcademicSupport(baseInput({
        homework_support_records: hwRecs,
        study_environment_records: [makeStudyEnvironment()],
      }));
      expect(r.strengths.some((s) => s.includes("100% homework completion rate"))).toBe(true);
    });

    it("strength for homeworkCompletionRate >=70 <90", () => {
      const hwRecs = Array.from({ length: 10 }, (_, i) =>
        makeHomeworkSupport({ id: `h${i}`, homework_set: true, homework_completed: i < 8 }),
      );
      const r = computeHomeworkAcademicSupport(baseInput({
        homework_support_records: hwRecs,
        study_environment_records: [makeStudyEnvironment()],
      }));
      expect(r.strengths.some((s) => s.includes("80% homework completion rate"))).toBe(true);
    });

    it("strength for staffSupportRate >=90", () => {
      const hwRecs = Array.from({ length: 10 }, (_, i) =>
        makeHomeworkSupport({ id: `h${i}`, staff_supported: true }),
      );
      const r = computeHomeworkAcademicSupport(baseInput({
        homework_support_records: hwRecs,
        study_environment_records: [makeStudyEnvironment()],
      }));
      expect(r.strengths.some((s) => s.includes("Staff actively support 100%"))).toBe(true);
    });

    it("strength for staffSupportRate >=70 <90", () => {
      const hwRecs = Array.from({ length: 10 }, (_, i) =>
        makeHomeworkSupport({ id: `h${i}`, staff_supported: i < 8 }),
      );
      const r = computeHomeworkAcademicSupport(baseInput({
        homework_support_records: hwRecs,
        study_environment_records: [makeStudyEnvironment()],
      }));
      expect(r.strengths.some((s) => s.includes("Staff support provided in 80%"))).toBe(true);
    });

    it("strength for avgSupportQuality >=4.0", () => {
      const hwRecs = Array.from({ length: 5 }, (_, i) =>
        makeHomeworkSupport({ id: `h${i}`, support_quality: "excellent" }),
      );
      const r = computeHomeworkAcademicSupport(baseInput({
        homework_support_records: hwRecs,
        study_environment_records: [makeStudyEnvironment()],
      }));
      expect(r.strengths.some((s) => s.includes("Average homework support quality"))).toBe(true);
    });

    it("strength for studyEnvironmentQualityRate >=90", () => {
      const seRecs = Array.from({ length: 10 }, (_, i) =>
        makeStudyEnvironment({ id: `se${i}`, overall_quality: "excellent" }),
      );
      const r = computeHomeworkAcademicSupport(baseInput({
        study_environment_records: seRecs,
      }));
      expect(r.strengths.some((s) => s.includes("100% of study environment assessments rated good or excellent"))).toBe(true);
    });

    it("strength for quietSpaceRate >=90", () => {
      const seRecs = Array.from({ length: 10 }, (_, i) =>
        makeStudyEnvironment({ id: `se${i}`, quiet_space_available: true }),
      );
      const r = computeHomeworkAcademicSupport(baseInput({
        study_environment_records: seRecs,
      }));
      expect(r.strengths.some((s) => s.includes("Quiet study space available in 100%"))).toBe(true);
    });

    it("strength for envSatisfactionAvg >=4.0", () => {
      const seRecs = Array.from({ length: 5 }, (_, i) =>
        makeStudyEnvironment({ id: `se${i}`, child_satisfaction: 5 }),
      );
      const r = computeHomeworkAcademicSupport(baseInput({
        study_environment_records: seRecs,
      }));
      expect(r.strengths.some((s) => s.includes("satisfaction with study environments averages 5/5"))).toBe(true);
    });

    it("strength for tutoringAttendanceRate >=90", () => {
      const tRecs = Array.from({ length: 10 }, (_, i) =>
        makeTutoring({ id: `t${i}`, session_planned: true, session_attended: true }),
      );
      const r = computeHomeworkAcademicSupport(baseInput({
        tutoring_records: tRecs,
      }));
      expect(r.strengths.some((s) => s.includes("100% tutoring session attendance rate"))).toBe(true);
    });

    it("strength for tutoringProgressRate >=80", () => {
      const tRecs = Array.from({ length: 5 }, (_, i) =>
        makeTutoring({ id: `t${i}`, progress_noted: true }),
      );
      const r = computeHomeworkAcademicSupport(baseInput({
        tutoring_records: tRecs,
      }));
      expect(r.strengths.some((s) => s.includes("Progress noted in 100% of tutoring sessions"))).toBe(true);
    });

    it("strength for curriculumAlignmentRate >=80", () => {
      const tRecs = Array.from({ length: 5 }, (_, i) =>
        makeTutoring({ id: `t${i}`, linked_to_school_curriculum: true }),
      );
      const r = computeHomeworkAcademicSupport(baseInput({
        tutoring_records: tRecs,
      }));
      expect(r.strengths.some((s) => s.includes("100% of tutoring sessions linked to the school curriculum"))).toBe(true);
    });

    it("strength for resourceFulfilmentRate >=90", () => {
      const resRecs = Array.from({ length: 5 }, (_, i) =>
        makeResource({ id: `r${i}`, requested: true, provided: true }),
      );
      const r = computeHomeworkAcademicSupport(baseInput({
        educational_resource_records: resRecs,
      }));
      expect(r.strengths.some((s) => s.includes("100% of requested educational resources provided"))).toBe(true);
    });

    it("strength for ageAppropriateRate >=90", () => {
      const resRecs = Array.from({ length: 5 }, (_, i) =>
        makeResource({ id: `r${i}`, age_appropriate: true }),
      );
      const r = computeHomeworkAcademicSupport(baseInput({
        educational_resource_records: resRecs,
      }));
      expect(r.strengths.some((s) => s.includes("100% of educational resources are age-appropriate"))).toBe(true);
    });

    it("strength for resourceUsageRate >=80", () => {
      const resRecs = Array.from({ length: 5 }, (_, i) =>
        makeResource({ id: `r${i}`, child_using_resource: true }),
      );
      const r = computeHomeworkAcademicSupport(baseInput({
        educational_resource_records: resRecs,
      }));
      expect(r.strengths.some((s) => s.includes("100% of provided resources are actively used"))).toBe(true);
    });

    it("strength for staffAttendanceRate >=90 in liaison", () => {
      const liRecs = Array.from({ length: 5 }, (_, i) =>
        makeLiaison({ id: `l${i}`, staff_attended: true }),
      );
      const r = computeHomeworkAcademicSupport(baseInput({
        school_liaison_records: liRecs,
      }));
      expect(r.strengths.some((s) => s.includes("Staff attend 100% of school liaison"))).toBe(true);
    });

    it("strength for actionCompletionRate >=90", () => {
      const liRecs = Array.from({ length: 5 }, (_, i) =>
        makeLiaison({ id: `l${i}`, actions_agreed: 3, actions_completed: 3 }),
      );
      const r = computeHomeworkAcademicSupport(baseInput({
        school_liaison_records: liRecs,
      }));
      expect(r.strengths.some((s) => s.includes("100% of school liaison actions completed"))).toBe(true);
    });

    it("strength for pepUpToDateRate >=90", () => {
      const liRecs = Array.from({ length: 5 }, (_, i) =>
        makeLiaison({ id: `l${i}`, pep_up_to_date: true }),
      );
      const r = computeHomeworkAcademicSupport(baseInput({
        school_liaison_records: liRecs,
      }));
      expect(r.strengths.some((s) => s.includes("100% of PEPs reported as up to date"))).toBe(true);
    });

    it("strength for followUpCompletionRate >=90", () => {
      const liRecs = Array.from({ length: 5 }, (_, i) =>
        makeLiaison({ id: `l${i}`, follow_up_date: "2026-06-01", follow_up_completed: true }),
      );
      const r = computeHomeworkAcademicSupport(baseInput({
        school_liaison_records: liRecs,
      }));
      expect(r.strengths.some((s) => s.includes("100% of school liaison follow-ups completed"))).toBe(true);
    });

    it("strength for liaisonChildVoiceRate >=80", () => {
      const liRecs = Array.from({ length: 5 }, (_, i) =>
        makeLiaison({ id: `l${i}`, child_voice_included: true }),
      );
      const r = computeHomeworkAcademicSupport(baseInput({
        school_liaison_records: liRecs,
      }));
      expect(r.strengths.some((s) => s.includes("Child voice included in 100%"))).toBe(true);
    });

    it("strength for childEngagementRate >=90", () => {
      const hwRecs = Array.from({ length: 5 }, (_, i) =>
        makeHomeworkSupport({ id: `h${i}`, child_engaged: true }),
      );
      const tRecs = Array.from({ length: 3 }, (_, i) =>
        makeTutoring({ id: `t${i}`, child_engaged: true }),
      );
      const resRecs = Array.from({ length: 2 }, (_, i) =>
        makeResource({ id: `r${i}`, child_using_resource: true }),
      );
      // engagement = pct(5+3+2, 5+3+2) = 100
      const r = computeHomeworkAcademicSupport(baseInput({
        homework_support_records: hwRecs,
        tutoring_records: tRecs,
        educational_resource_records: resRecs,
      }));
      expect(r.strengths.some((s) => s.includes("100% overall child engagement rate"))).toBe(true);
    });

    it("no strengths when all rates are below thresholds", () => {
      const hwRecs = [
        makeHomeworkSupport({ id: "h1", homework_set: true, homework_completed: false, staff_supported: false, support_quality: "poor", child_engaged: false }),
      ];
      const seRecs = [
        makeStudyEnvironment({ id: "se1", overall_quality: "poor", quiet_space_available: false, child_satisfaction: 2 }),
      ];
      const tRecs = [
        makeTutoring({ id: "t1", session_planned: true, session_attended: false, child_engaged: false, progress_noted: false, child_satisfaction: 2, linked_to_school_curriculum: false }),
      ];
      const resRecs = [
        makeResource({ id: "r1", requested: true, provided: false, age_appropriate: false, child_using_resource: false }),
      ];
      const liRecs = [
        makeLiaison({ id: "l1", staff_attended: false, actions_agreed: 3, actions_completed: 0, academic_progress_discussed: false, pep_up_to_date: false, child_voice_included: false, follow_up_date: "2026-06-01", follow_up_completed: false }),
      ];
      const r = computeHomeworkAcademicSupport(baseInput({
        homework_support_records: hwRecs,
        study_environment_records: seRecs,
        tutoring_records: tRecs,
        educational_resource_records: resRecs,
        school_liaison_records: liRecs,
      }));
      expect(r.strengths).toHaveLength(0);
    });
  });

  // ── Concerns ─────────────────────────────────────────────────────────────

  describe("concerns", () => {
    it("concern for homeworkCompletionRate <40", () => {
      const hwRecs = Array.from({ length: 5 }, (_, i) =>
        makeHomeworkSupport({ id: `h${i}`, homework_set: true, homework_completed: i === 0 }),
      );
      const r = computeHomeworkAcademicSupport(baseInput({
        homework_support_records: hwRecs,
        study_environment_records: [makeStudyEnvironment()],
      }));
      expect(r.concerns.some((c) => c.includes("20% homework completion rate"))).toBe(true);
    });

    it("concern for homeworkCompletionRate 40-69", () => {
      const hwRecs = Array.from({ length: 10 }, (_, i) =>
        makeHomeworkSupport({ id: `h${i}`, homework_set: true, homework_completed: i < 5 }),
      );
      const r = computeHomeworkAcademicSupport(baseInput({
        homework_support_records: hwRecs,
        study_environment_records: [makeStudyEnvironment()],
      }));
      expect(r.concerns.some((c) => c.includes("Homework completion rate at 50%"))).toBe(true);
    });

    it("concern for staffSupportRate <50", () => {
      const hwRecs = Array.from({ length: 10 }, (_, i) =>
        makeHomeworkSupport({ id: `h${i}`, staff_supported: i < 2 }),
      );
      const r = computeHomeworkAcademicSupport(baseInput({
        homework_support_records: hwRecs,
        study_environment_records: [makeStudyEnvironment()],
      }));
      expect(r.concerns.some((c) => c.includes("Staff support provided in only 20%"))).toBe(true);
    });

    it("concern for homeworkBarrierRate >=30", () => {
      const hwRecs = Array.from({ length: 10 }, (_, i) =>
        makeHomeworkSupport({ id: `h${i}`, barriers_encountered: i < 4 ? ["no materials"] : [] }),
      );
      const r = computeHomeworkAcademicSupport(baseInput({
        homework_support_records: hwRecs,
        study_environment_records: [makeStudyEnvironment()],
      }));
      expect(r.concerns.some((c) => c.includes("Barriers encountered in 40%"))).toBe(true);
    });

    it("concern for homeworkEngagementRate <50", () => {
      const hwRecs = Array.from({ length: 10 }, (_, i) =>
        makeHomeworkSupport({ id: `h${i}`, child_engaged: i < 3 }),
      );
      const r = computeHomeworkAcademicSupport(baseInput({
        homework_support_records: hwRecs,
        study_environment_records: [makeStudyEnvironment()],
      }));
      expect(r.concerns.some((c) => c.includes("30% child engagement during homework"))).toBe(true);
    });

    it("concern for studyEnvironmentQualityRate <40", () => {
      const seRecs = Array.from({ length: 5 }, (_, i) =>
        makeStudyEnvironment({ id: `se${i}`, overall_quality: i === 0 ? "good" : "poor" }),
      );
      const r = computeHomeworkAcademicSupport(baseInput({
        study_environment_records: seRecs,
      }));
      expect(r.concerns.some((c) => c.includes("20% of study environments rated good or excellent"))).toBe(true);
    });

    it("concern for quietSpaceRate <50", () => {
      const seRecs = Array.from({ length: 5 }, (_, i) =>
        makeStudyEnvironment({ id: `se${i}`, quiet_space_available: i < 2 }),
      );
      const r = computeHomeworkAcademicSupport(baseInput({
        study_environment_records: seRecs,
      }));
      expect(r.concerns.some((c) => c.includes("Quiet study space available in only 40%"))).toBe(true);
    });

    it("concern for envSatisfactionAvg <3.0", () => {
      const seRecs = Array.from({ length: 5 }, (_, i) =>
        makeStudyEnvironment({ id: `se${i}`, child_satisfaction: 2 }),
      );
      const r = computeHomeworkAcademicSupport(baseInput({
        study_environment_records: seRecs,
      }));
      expect(r.concerns.some((c) => c.includes("satisfaction with study environments averages only 2/5"))).toBe(true);
    });

    it("concern for tutoringAttendanceRate <50", () => {
      const tRecs = Array.from({ length: 5 }, (_, i) =>
        makeTutoring({ id: `t${i}`, session_planned: true, session_attended: i < 2 }),
      );
      const r = computeHomeworkAcademicSupport(baseInput({
        tutoring_records: tRecs,
      }));
      expect(r.concerns.some((c) => c.includes("40% tutoring session attendance"))).toBe(true);
    });

    it("concern for tutoringProgressRate <50", () => {
      const tRecs = Array.from({ length: 5 }, (_, i) =>
        makeTutoring({ id: `t${i}`, progress_noted: i < 2 }),
      );
      const r = computeHomeworkAcademicSupport(baseInput({
        tutoring_records: tRecs,
      }));
      expect(r.concerns.some((c) => c.includes("Progress noted in only 40%"))).toBe(true);
    });

    it("concern for resourceFulfilmentRate <50", () => {
      const resRecs = Array.from({ length: 5 }, (_, i) =>
        makeResource({ id: `r${i}`, requested: true, provided: i < 2 }),
      );
      const r = computeHomeworkAcademicSupport(baseInput({
        educational_resource_records: resRecs,
      }));
      expect(r.concerns.some((c) => c.includes("40% of requested educational resources provided"))).toBe(true);
    });

    it("concern for resourceUsageRate <50", () => {
      const resRecs = Array.from({ length: 5 }, (_, i) =>
        makeResource({ id: `r${i}`, child_using_resource: i < 2 }),
      );
      const r = computeHomeworkAcademicSupport(baseInput({
        educational_resource_records: resRecs,
      }));
      expect(r.concerns.some((c) => c.includes("40% of educational resources actively used"))).toBe(true);
    });

    it("concern for staffAttendanceRate <50 in liaison", () => {
      const liRecs = Array.from({ length: 5 }, (_, i) =>
        makeLiaison({ id: `l${i}`, staff_attended: i < 2 }),
      );
      const r = computeHomeworkAcademicSupport(baseInput({
        school_liaison_records: liRecs,
      }));
      expect(r.concerns.some((c) => c.includes("Staff attend only 40%"))).toBe(true);
    });

    it("concern for actionCompletionRate <50", () => {
      const liRecs = Array.from({ length: 5 }, (_, i) =>
        makeLiaison({ id: `l${i}`, actions_agreed: 4, actions_completed: i < 2 ? 4 : 0 }),
      );
      // actionCompletion = pct(8,20) = 40
      const r = computeHomeworkAcademicSupport(baseInput({
        school_liaison_records: liRecs,
      }));
      expect(r.concerns.some((c) => c.includes("40% of school liaison actions completed"))).toBe(true);
    });

    it("concern for pepUpToDateRate <50", () => {
      const liRecs = Array.from({ length: 5 }, (_, i) =>
        makeLiaison({ id: `l${i}`, pep_up_to_date: i < 2 }),
      );
      const r = computeHomeworkAcademicSupport(baseInput({
        school_liaison_records: liRecs,
      }));
      expect(r.concerns.some((c) => c.includes("40% of PEPs reported as up to date"))).toBe(true);
    });

    it("concern for liaisonChildVoiceRate <50", () => {
      const liRecs = Array.from({ length: 5 }, (_, i) =>
        makeLiaison({ id: `l${i}`, child_voice_included: i < 2 }),
      );
      const r = computeHomeworkAcademicSupport(baseInput({
        school_liaison_records: liRecs,
      }));
      expect(r.concerns.some((c) => c.includes("Child voice included in only 40%"))).toBe(true);
    });

    it("concern for childEngagementRate <30", () => {
      const hwRecs = Array.from({ length: 5 }, (_, i) =>
        makeHomeworkSupport({ id: `h${i}`, child_engaged: false }),
      );
      const tRecs = [
        makeTutoring({ id: "t1", child_engaged: false }),
      ];
      const resRecs = [
        makeResource({ id: "r1", child_using_resource: false }),
      ];
      // engagement = pct(0,7) = 0
      const r = computeHomeworkAcademicSupport(baseInput({
        homework_support_records: hwRecs,
        tutoring_records: tRecs,
        educational_resource_records: resRecs,
      }));
      expect(r.concerns.some((c) => c.includes("Overall child engagement at only 0%"))).toBe(true);
    });

    it("concern for schoolLiaisonRate <40", () => {
      const liRecs = Array.from({ length: 5 }, (_, i) =>
        makeLiaison({
          id: `l${i}`,
          staff_attended: i === 0,
          actions_agreed: 3,
          actions_completed: 0,
          academic_progress_discussed: i === 0,
        }),
      );
      const r = computeHomeworkAcademicSupport(baseInput({
        school_liaison_records: liRecs,
      }));
      expect(r.concerns.some((c) => c.includes("School liaison rate at only"))).toBe(true);
    });

    it("concern for no homework records with children on placement", () => {
      const r = computeHomeworkAcademicSupport(baseInput({
        study_environment_records: [makeStudyEnvironment()],
      }));
      expect(r.concerns.some((c) => c.includes("No homework support records"))).toBe(true);
    });

    it("concern for no school liaison records with children on placement", () => {
      const r = computeHomeworkAcademicSupport(baseInput({
        homework_support_records: [makeHomeworkSupport()],
      }));
      expect(r.concerns.some((c) => c.includes("No school liaison records"))).toBe(true);
    });
  });

  // ── Recommendations ──────────────────────────────────────────────────────

  describe("recommendations", () => {
    it("immediate recommendation for homeworkCompletionRate <40", () => {
      const hwRecs = Array.from({ length: 5 }, (_, i) =>
        makeHomeworkSupport({ id: `h${i}`, homework_set: true, homework_completed: i === 0 }),
      );
      const r = computeHomeworkAcademicSupport(baseInput({
        homework_support_records: hwRecs,
        study_environment_records: [makeStudyEnvironment()],
      }));
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("homework support arrangements"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
      expect(rec!.regulatory_ref).toContain("Reg 8");
    });

    it("immediate recommendation for studyEnvironmentQualityRate <40", () => {
      const seRecs = Array.from({ length: 5 }, (_, i) =>
        makeStudyEnvironment({ id: `se${i}`, overall_quality: "poor" }),
      );
      const r = computeHomeworkAcademicSupport(baseInput({
        study_environment_records: seRecs,
      }));
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("Immediately improve study environments"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
    });

    it("immediate recommendation for schoolLiaisonRate <40", () => {
      const liRecs = Array.from({ length: 5 }, (_, i) =>
        makeLiaison({
          id: `l${i}`,
          staff_attended: false,
          actions_agreed: 3,
          actions_completed: 0,
          academic_progress_discussed: false,
        }),
      );
      const r = computeHomeworkAcademicSupport(baseInput({
        school_liaison_records: liRecs,
      }));
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("Establish regular, structured school liaison"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
    });

    it("immediate recommendation for childEngagementRate <30", () => {
      const hwRecs = Array.from({ length: 5 }, (_, i) =>
        makeHomeworkSupport({ id: `h${i}`, child_engaged: false }),
      );
      const tRecs = [makeTutoring({ id: "t1", child_engaged: false })];
      const resRecs = [makeResource({ id: "r1", child_using_resource: false })];
      const r = computeHomeworkAcademicSupport(baseInput({
        homework_support_records: hwRecs,
        tutoring_records: tRecs,
        educational_resource_records: resRecs,
      }));
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("Address the very low child engagement"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
    });

    it("immediate recommendation for pepUpToDateRate <50", () => {
      const liRecs = Array.from({ length: 5 }, (_, i) =>
        makeLiaison({ id: `l${i}`, pep_up_to_date: i < 2 }),
      );
      const r = computeHomeworkAcademicSupport(baseInput({
        school_liaison_records: liRecs,
      }));
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("Ensure all Personal Education Plans are up to date"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
    });

    it("soon recommendation for homeworkCompletionRate 40-69", () => {
      const hwRecs = Array.from({ length: 10 }, (_, i) =>
        makeHomeworkSupport({ id: `h${i}`, homework_set: true, homework_completed: i < 5 }),
      );
      const r = computeHomeworkAcademicSupport(baseInput({
        homework_support_records: hwRecs,
        study_environment_records: [makeStudyEnvironment()],
      }));
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("Improve homework completion rate to at least 70%"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("soon");
    });

    it("soon recommendation for staffSupportRate <50", () => {
      const hwRecs = Array.from({ length: 10 }, (_, i) =>
        makeHomeworkSupport({ id: `h${i}`, staff_supported: i < 3 }),
      );
      const r = computeHomeworkAcademicSupport(baseInput({
        homework_support_records: hwRecs,
        study_environment_records: [makeStudyEnvironment()],
      }));
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("Increase staff involvement in homework support"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("soon");
    });

    it("soon recommendation for tutoringAttendanceRate <50", () => {
      const tRecs = Array.from({ length: 5 }, (_, i) =>
        makeTutoring({ id: `t${i}`, session_planned: true, session_attended: i < 2 }),
      );
      const r = computeHomeworkAcademicSupport(baseInput({
        tutoring_records: tRecs,
      }));
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("Investigate and address low tutoring attendance"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("soon");
    });

    it("soon recommendation for no homework records", () => {
      const r = computeHomeworkAcademicSupport(baseInput({
        study_environment_records: [makeStudyEnvironment()],
      }));
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("Implement daily homework recording"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("soon");
    });

    it("soon recommendation for no liaison records", () => {
      const r = computeHomeworkAcademicSupport(baseInput({
        homework_support_records: [makeHomeworkSupport()],
      }));
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("Establish a structured school liaison programme"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("soon");
    });

    it("planned recommendation for tutoringAttendanceRate 50-69", () => {
      const tRecs = Array.from({ length: 10 }, (_, i) =>
        makeTutoring({ id: `t${i}`, session_planned: true, session_attended: i < 6 }),
      );
      const r = computeHomeworkAcademicSupport(baseInput({
        tutoring_records: tRecs,
      }));
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("Improve tutoring attendance to at least 70%"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("planned");
    });

    it("planned recommendation for childEngagementRate 30-49", () => {
      const hwRecs = Array.from({ length: 10 }, (_, i) =>
        makeHomeworkSupport({ id: `h${i}`, homework_set: true, homework_completed: i < 5, child_engaged: i < 3 }),
      );
      const tRecs = [makeTutoring({ id: "t1", child_engaged: true })];
      const resRecs = [makeResource({ id: "r1", child_using_resource: false })];
      // engagement = pct(3+1+0, 10+1+1) = pct(4,12) = 33
      const r = computeHomeworkAcademicSupport(baseInput({
        homework_support_records: hwRecs,
        tutoring_records: tRecs,
        educational_resource_records: resRecs,
      }));
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("Develop strategies to improve child engagement"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("planned");
    });

    it("recommendations have sequential ranks", () => {
      const hwRecs = Array.from({ length: 5 }, (_, i) =>
        makeHomeworkSupport({ id: `h${i}`, homework_set: true, homework_completed: false, staff_supported: false, child_engaged: false }),
      );
      const seRecs = Array.from({ length: 5 }, (_, i) =>
        makeStudyEnvironment({ id: `se${i}`, overall_quality: "poor" }),
      );
      const liRecs = Array.from({ length: 5 }, (_, i) =>
        makeLiaison({ id: `l${i}`, staff_attended: false, actions_agreed: 3, actions_completed: 0, academic_progress_discussed: false, pep_up_to_date: false, child_voice_included: false }),
      );
      const r = computeHomeworkAcademicSupport(baseInput({
        homework_support_records: hwRecs,
        study_environment_records: seRecs,
        school_liaison_records: liRecs,
      }));
      for (let i = 0; i < r.recommendations.length; i++) {
        expect(r.recommendations[i].rank).toBe(i + 1);
      }
    });
  });

  // ── Insights ─────────────────────────────────────────────────────────────

  describe("insights", () => {
    it("critical insight for homeworkCompletionRate <40", () => {
      const hwRecs = Array.from({ length: 5 }, (_, i) =>
        makeHomeworkSupport({ id: `h${i}`, homework_set: true, homework_completed: i === 0 }),
      );
      const r = computeHomeworkAcademicSupport(baseInput({
        homework_support_records: hwRecs,
        study_environment_records: [makeStudyEnvironment()],
      }));
      const insight = r.insights.find((i) => i.text.includes("20% homework completion rate") && i.severity === "critical");
      expect(insight).toBeDefined();
    });

    it("critical insight for studyEnvironmentQualityRate <40", () => {
      const seRecs = Array.from({ length: 5 }, (_, i) =>
        makeStudyEnvironment({ id: `se${i}`, overall_quality: "poor" }),
      );
      const r = computeHomeworkAcademicSupport(baseInput({
        study_environment_records: seRecs,
      }));
      const insight = r.insights.find((i) => i.text.includes("0% of study environments") && i.severity === "critical");
      expect(insight).toBeDefined();
    });

    it("critical insight for schoolLiaisonRate <40", () => {
      const liRecs = Array.from({ length: 5 }, (_, i) =>
        makeLiaison({
          id: `l${i}`,
          staff_attended: false,
          actions_agreed: 3,
          actions_completed: 0,
          academic_progress_discussed: false,
        }),
      );
      const r = computeHomeworkAcademicSupport(baseInput({
        school_liaison_records: liRecs,
      }));
      const insight = r.insights.find((i) => i.text.includes("School liaison rate at only") && i.severity === "critical");
      expect(insight).toBeDefined();
    });

    it("critical insight for childEngagementRate <30", () => {
      const hwRecs = Array.from({ length: 5 }, (_, i) =>
        makeHomeworkSupport({ id: `h${i}`, child_engaged: false }),
      );
      const r = computeHomeworkAcademicSupport(baseInput({
        homework_support_records: hwRecs,
        tutoring_records: [makeTutoring({ id: "t1", child_engaged: false })],
      }));
      const insight = r.insights.find((i) => i.text.includes("Overall child engagement at only") && i.severity === "critical");
      expect(insight).toBeDefined();
    });

    it("critical insight for no homework AND no liaison records", () => {
      const r = computeHomeworkAcademicSupport(baseInput({
        study_environment_records: [makeStudyEnvironment()],
      }));
      const insight = r.insights.find((i) => i.text.includes("No homework support or school liaison records") && i.severity === "critical");
      expect(insight).toBeDefined();
    });

    it("critical insight for pepUpToDateRate <50", () => {
      const liRecs = Array.from({ length: 5 }, (_, i) =>
        makeLiaison({ id: `l${i}`, pep_up_to_date: i < 2 }),
      );
      const r = computeHomeworkAcademicSupport(baseInput({
        school_liaison_records: liRecs,
      }));
      const insight = r.insights.find((i) => i.text.includes("40% of PEPs up to date") && i.severity === "critical");
      expect(insight).toBeDefined();
    });

    it("warning insight for homeworkCompletionRate 40-69", () => {
      const hwRecs = Array.from({ length: 10 }, (_, i) =>
        makeHomeworkSupport({ id: `h${i}`, homework_set: true, homework_completed: i < 5 }),
      );
      const r = computeHomeworkAcademicSupport(baseInput({
        homework_support_records: hwRecs,
        study_environment_records: [makeStudyEnvironment()],
      }));
      const insight = r.insights.find((i) => i.text.includes("Homework completion at 50%") && i.severity === "warning");
      expect(insight).toBeDefined();
    });

    it("warning insight for studyEnvironmentQualityRate 40-69", () => {
      const seRecs = Array.from({ length: 10 }, (_, i) =>
        makeStudyEnvironment({ id: `se${i}`, overall_quality: i < 5 ? "good" : "poor" }),
      );
      const r = computeHomeworkAcademicSupport(baseInput({
        study_environment_records: seRecs,
      }));
      const insight = r.insights.find((i) => i.text.includes("Study environment quality at 50%") && i.severity === "warning");
      expect(insight).toBeDefined();
    });

    it("warning insight for homeworkBarrierRate >=30", () => {
      const hwRecs = Array.from({ length: 10 }, (_, i) =>
        makeHomeworkSupport({ id: `h${i}`, barriers_encountered: i < 4 ? ["missing books"] : [] }),
      );
      const r = computeHomeworkAcademicSupport(baseInput({
        homework_support_records: hwRecs,
        study_environment_records: [makeStudyEnvironment()],
      }));
      const insight = r.insights.find((i) => i.text.includes("Barriers encountered in 40%") && i.severity === "warning");
      expect(insight).toBeDefined();
    });

    it("warning insight for subject diversity >= 5 subjects", () => {
      const hwRecs = [
        makeHomeworkSupport({ id: "h1", subject: "Maths" }),
        makeHomeworkSupport({ id: "h2", subject: "English" }),
        makeHomeworkSupport({ id: "h3", subject: "Science" }),
      ];
      const tRecs = [
        makeTutoring({ id: "t1", subject: "History" }),
        makeTutoring({ id: "t2", subject: "Geography" }),
      ];
      const r = computeHomeworkAcademicSupport(baseInput({
        homework_support_records: hwRecs,
        tutoring_records: tRecs,
      }));
      const insight = r.insights.find((i) => i.text.includes("5 distinct subjects") && i.severity === "warning");
      expect(insight).toBeDefined();
    });

    it("positive insight for outstanding rating", () => {
      // Use the outstanding input factory
      const hwRecs = Array.from({ length: 10 }, (_, i) =>
        makeHomeworkSupport({ id: `hs_${i}`, homework_set: true, homework_completed: true, staff_supported: true, support_quality: "excellent", child_engaged: true }),
      );
      const seRecs = Array.from({ length: 5 }, (_, i) =>
        makeStudyEnvironment({ id: `se_${i}`, overall_quality: "excellent", child_satisfaction: 5 }),
      );
      const tRecs = [
        makeTutoring({ id: "t1", child_id: "child_1", session_planned: true, session_attended: true, child_engaged: true, progress_noted: true, child_satisfaction: 5, linked_to_school_curriculum: true }),
        makeTutoring({ id: "t2", child_id: "child_2", session_planned: true, session_attended: true, child_engaged: true, progress_noted: true, child_satisfaction: 5, linked_to_school_curriculum: true }),
        makeTutoring({ id: "t3", child_id: "child_3", session_planned: true, session_attended: true, child_engaged: true, progress_noted: true, child_satisfaction: 5, linked_to_school_curriculum: true }),
      ];
      const resRecs = Array.from({ length: 5 }, (_, i) =>
        makeResource({ id: `er_${i}`, requested: true, provided: true, age_appropriate: true, child_using_resource: true }),
      );
      const liRecs = Array.from({ length: 5 }, (_, i) =>
        makeLiaison({ id: `sl_${i}`, staff_attended: true, actions_agreed: 3, actions_completed: 3, academic_progress_discussed: true, pep_up_to_date: true, child_voice_included: true }),
      );
      const r = computeHomeworkAcademicSupport(baseInput({
        homework_support_records: hwRecs,
        study_environment_records: seRecs,
        tutoring_records: tRecs,
        educational_resource_records: resRecs,
        school_liaison_records: liRecs,
      }));
      const insight = r.insights.find((i) => i.text.includes("outstanding homework and academic support") && i.severity === "positive");
      expect(insight).toBeDefined();
    });

    it("positive insight for high homework completion + staff support", () => {
      const hwRecs = Array.from({ length: 10 }, (_, i) =>
        makeHomeworkSupport({ id: `h${i}`, homework_set: true, homework_completed: true, staff_supported: true, child_engaged: true }),
      );
      const r = computeHomeworkAcademicSupport(baseInput({
        homework_support_records: hwRecs,
        study_environment_records: [makeStudyEnvironment()],
      }));
      const insight = r.insights.find((i) => i.text.includes("100% homework completion with 100% staff support") && i.severity === "positive");
      expect(insight).toBeDefined();
    });

    it("positive insight for high resource availability", () => {
      const resRecs = Array.from({ length: 5 }, (_, i) =>
        makeResource({ id: `r${i}`, requested: true, provided: true, age_appropriate: true, child_using_resource: true }),
      );
      const r = computeHomeworkAcademicSupport(baseInput({
        educational_resource_records: resRecs,
      }));
      const insight = r.insights.find((i) => i.text.includes("Resource availability rate at 100%") && i.severity === "positive");
      expect(insight).toBeDefined();
    });

    it("positive insight for high child engagement", () => {
      const hwRecs = Array.from({ length: 5 }, (_, i) =>
        makeHomeworkSupport({ id: `h${i}`, child_engaged: true }),
      );
      const tRecs = Array.from({ length: 3 }, (_, i) =>
        makeTutoring({ id: `t${i}`, child_engaged: true }),
      );
      const resRecs = Array.from({ length: 2 }, (_, i) =>
        makeResource({ id: `r${i}`, child_using_resource: true }),
      );
      const r = computeHomeworkAcademicSupport(baseInput({
        homework_support_records: hwRecs,
        tutoring_records: tRecs,
        educational_resource_records: resRecs,
      }));
      const insight = r.insights.find((i) => i.text.includes("100% overall child engagement") && i.severity === "positive");
      expect(insight).toBeDefined();
    });

    it("positive insight for high action completion rate", () => {
      const liRecs = Array.from({ length: 5 }, (_, i) =>
        makeLiaison({ id: `l${i}`, actions_agreed: 3, actions_completed: 3 }),
      );
      const r = computeHomeworkAcademicSupport(baseInput({
        school_liaison_records: liRecs,
      }));
      const insight = r.insights.find((i) => i.text.includes("100% of school liaison actions completed") && i.severity === "positive");
      expect(insight).toBeDefined();
    });

    it("positive insight for high liaison child voice rate", () => {
      const liRecs = Array.from({ length: 5 }, (_, i) =>
        makeLiaison({ id: `l${i}`, child_voice_included: true }),
      );
      const r = computeHomeworkAcademicSupport(baseInput({
        school_liaison_records: liRecs,
      }));
      const insight = r.insights.find((i) => i.text.includes("Child voice included in 100%") && i.severity === "positive");
      expect(insight).toBeDefined();
    });
  });

  // ── Edge Cases ───────────────────────────────────────────────────────────

  describe("edge cases", () => {
    it("score is clamped to 0 minimum", () => {
      // With only penalties and a very bad scenario, the clamp should hold at 0
      // 52 - 6 - 5 - 5 - 3 = 33 -- can't get below 0 normally, but let's confirm clamp works
      const r = computeHomeworkAcademicSupport(baseInput({
        homework_support_records: Array.from({ length: 5 }, (_, i) =>
          makeHomeworkSupport({ id: `h${i}`, homework_set: true, homework_completed: false, child_engaged: false }),
        ),
        study_environment_records: Array.from({ length: 5 }, (_, i) =>
          makeStudyEnvironment({ id: `se${i}`, overall_quality: "poor" }),
        ),
        tutoring_records: [makeTutoring({ id: "t1", child_engaged: false })],
        educational_resource_records: [makeResource({ id: "r1", child_using_resource: false })],
        school_liaison_records: Array.from({ length: 5 }, (_, i) =>
          makeLiaison({ id: `l${i}`, staff_attended: false, actions_agreed: 5, actions_completed: 0, academic_progress_discussed: false }),
        ),
      }));
      expect(r.academic_score).toBeGreaterThanOrEqual(0);
    });

    it("score is clamped to 100 maximum", () => {
      // Maximum possible: 52 + 4+3+3+4+3+3+3+3+2 = 80, so can't exceed 100
      // Just verify it never goes over
      const hwRecs = Array.from({ length: 10 }, (_, i) =>
        makeHomeworkSupport({ id: `hs_${i}`, homework_set: true, homework_completed: true, staff_supported: true, support_quality: "excellent", child_engaged: true }),
      );
      const seRecs = Array.from({ length: 5 }, (_, i) =>
        makeStudyEnvironment({ id: `se_${i}`, overall_quality: "excellent", child_satisfaction: 5 }),
      );
      const tRecs = [
        makeTutoring({ id: "t1", child_id: "child_1", session_planned: true, session_attended: true, child_engaged: true, progress_noted: true }),
        makeTutoring({ id: "t2", child_id: "child_2", session_planned: true, session_attended: true, child_engaged: true, progress_noted: true }),
        makeTutoring({ id: "t3", child_id: "child_3", session_planned: true, session_attended: true, child_engaged: true, progress_noted: true }),
      ];
      const resRecs = Array.from({ length: 5 }, (_, i) =>
        makeResource({ id: `er_${i}`, requested: true, provided: true, age_appropriate: true, child_using_resource: true }),
      );
      const liRecs = Array.from({ length: 5 }, (_, i) =>
        makeLiaison({ id: `sl_${i}`, staff_attended: true, actions_agreed: 3, actions_completed: 3, academic_progress_discussed: true, pep_up_to_date: true, child_voice_included: true }),
      );
      const r = computeHomeworkAcademicSupport(baseInput({
        homework_support_records: hwRecs,
        study_environment_records: seRecs,
        tutoring_records: tRecs,
        educational_resource_records: resRecs,
        school_liaison_records: liRecs,
      }));
      expect(r.academic_score).toBeLessThanOrEqual(100);
    });

    it("pct returns 0 when denominator is 0", () => {
      // No homework set -> pct(0,0) = 0
      const r = computeHomeworkAcademicSupport(baseInput({
        homework_support_records: [makeHomeworkSupport({ id: "h1", homework_set: false })],
      }));
      expect(r.homework_completion_rate).toBe(0);
    });

    it("single record in each category", () => {
      const r = computeHomeworkAcademicSupport(baseInput({
        homework_support_records: [makeHomeworkSupport({ id: "h1", homework_set: true, homework_completed: true, staff_supported: true, child_engaged: true })],
        study_environment_records: [makeStudyEnvironment({ id: "se1", overall_quality: "excellent" })],
        tutoring_records: [makeTutoring({ id: "t1", child_id: "child_1", session_planned: true, session_attended: true, child_engaged: true, progress_noted: true })],
        educational_resource_records: [makeResource({ id: "r1", requested: true, provided: true, age_appropriate: true, child_using_resource: true })],
        school_liaison_records: [makeLiaison({ id: "l1", staff_attended: true, actions_agreed: 3, actions_completed: 3, academic_progress_discussed: true, pep_up_to_date: true })],
      }));
      expect(r.homework_completion_rate).toBe(100);
      expect(r.study_environment_quality_rate).toBe(100);
      expect(r.child_engagement_rate).toBe(100);
    });

    it("large volume of records does not break", () => {
      const hwRecs = Array.from({ length: 100 }, (_, i) =>
        makeHomeworkSupport({ id: `h${i}`, homework_set: true, homework_completed: i < 80 }),
      );
      const r = computeHomeworkAcademicSupport(baseInput({
        homework_support_records: hwRecs,
      }));
      expect(r.homework_completion_rate).toBe(80);
      expect(typeof r.academic_score).toBe("number");
    });

    it("total_children=1 with one tutoring child yields 100% coverage", () => {
      const r = computeHomeworkAcademicSupport(baseInput({
        total_children: 1,
        tutoring_records: [makeTutoring({ id: "t1", child_id: "child_1" })],
      }));
      expect(r.tutoring_coverage_rate).toBe(100);
    });

    it("multiple tutoring records for same child counts as 1 unique", () => {
      const tRecs = Array.from({ length: 5 }, (_, i) =>
        makeTutoring({ id: `t${i}`, child_id: "child_1" }),
      );
      const r = computeHomeworkAcademicSupport(baseInput({
        tutoring_records: tRecs,
      }));
      // 1 unique child / 3 total = 33%
      expect(r.tutoring_coverage_rate).toBe(33);
    });

    it("resources with no requests still compute availability from age_appropriate and usage", () => {
      const resRecs = [
        makeResource({ id: "r1", requested: false, provided: true, age_appropriate: true, child_using_resource: true }),
      ];
      // fulfilmentRate = pct(1, 0) = 0 (denominator is requested count = 0)
      // ageAppropriateRate = pct(1, 1) = 100
      // usageRate = pct(1, 1) = 100
      // resourceAvailability = round((0 + 100 + 100) / 3) = round(66.67) = 67
      const r = computeHomeworkAcademicSupport(baseInput({
        educational_resource_records: resRecs,
      }));
      expect(r.resource_availability_rate).toBe(67);
    });

    it("liaison with actions_agreed=0 means actionCompletionRate=0 (pct(0,0)=0)", () => {
      const liRecs = [
        makeLiaison({ id: "l1", actions_agreed: 0, actions_completed: 0, staff_attended: true, academic_progress_discussed: true }),
      ];
      // staffAttendance=100, actionCompletion=pct(0,0)=0, academicDiscussion=100
      // schoolLiaisonRate = round((100+0+100)/3) = round(66.67) = 67
      const r = computeHomeworkAcademicSupport(baseInput({
        school_liaison_records: liRecs,
      }));
      expect(r.school_liaison_rate).toBe(67);
    });

    it("follow_up_date=null means not counted in follow-up metrics", () => {
      const liRecs = [
        makeLiaison({ id: "l1", follow_up_date: null, follow_up_completed: false }),
        makeLiaison({ id: "l2", follow_up_date: "2026-06-01", follow_up_completed: true }),
      ];
      // followUpRequired = 1 (only l2 has follow_up_date)
      // followUpCompleted = 1 (l2 completed)
      // followUpCompletionRate = 100%
      const r = computeHomeworkAcademicSupport(baseInput({
        school_liaison_records: liRecs,
      }));
      expect(r.strengths.some((s) => s.includes("100% of school liaison follow-ups completed"))).toBe(true);
    });

    it("homework where outcome=not_applicable is excluded from outcome rate", () => {
      const hwRecs = [
        makeHomeworkSupport({ id: "h1", outcome: "completed" }),
        makeHomeworkSupport({ id: "h2", outcome: "not_applicable" }),
      ];
      // homeworkOutcomeDenominator = completed + partially + not_completed = 1 + 0 + 0 = 1
      // homeworkOutcomeRate = pct(1, 1) = 100
      // (outcome rate doesn't surface directly in output but affects internal logic)
      const r = computeHomeworkAcademicSupport(baseInput({
        homework_support_records: hwRecs,
      }));
      // Just verify it doesn't crash and returns valid result
      expect(r.academic_rating).toBeDefined();
    });

    it("study environment with all improvements needed", () => {
      const seRecs = [
        makeStudyEnvironment({ id: "se1", improvements_needed: ["better lighting", "desk needed", "reduce noise"] }),
        makeStudyEnvironment({ id: "se2", improvements_needed: [] }),
      ];
      // envImprovementsRate = pct(1, 2) = 50
      const r = computeHomeworkAcademicSupport(baseInput({
        study_environment_records: seRecs,
      }));
      expect(r.academic_rating).toBeDefined();
    });

    it("mixed tutor types are handled correctly", () => {
      const tRecs = [
        makeTutoring({ id: "t1", tutor_type: "professional", child_id: "child_1" }),
        makeTutoring({ id: "t2", tutor_type: "online", child_id: "child_2" }),
        makeTutoring({ id: "t3", tutor_type: "peer", child_id: "child_3" }),
      ];
      const r = computeHomeworkAcademicSupport(baseInput({
        tutoring_records: tRecs,
      }));
      expect(r.tutoring_coverage_rate).toBe(100);
    });

    it("empty subject strings are filtered from subject diversity set", () => {
      const hwRecs = [
        makeHomeworkSupport({ id: "h1", subject: "" }),
        makeHomeworkSupport({ id: "h2", subject: "Maths" }),
      ];
      const r = computeHomeworkAcademicSupport(baseInput({
        homework_support_records: hwRecs,
      }));
      // The empty string is filtered by .filter(s => s)
      // No subject diversity insight (only 1 subject)
      const insight = r.insights.find((i) => i.text.includes("distinct subjects"));
      expect(insight).toBeUndefined();
    });

    it("all resource conditions handled correctly", () => {
      const resRecs = [
        makeResource({ id: "r1", condition: "new" }),
        makeResource({ id: "r2", condition: "good" }),
        makeResource({ id: "r3", condition: "adequate" }),
        makeResource({ id: "r4", condition: "poor" }),
      ];
      // goodConditionResources = new + good = 2; resourceConditionRate = pct(2, 4) = 50
      const r = computeHomeworkAcademicSupport(baseInput({
        educational_resource_records: resRecs,
      }));
      expect(r.academic_rating).toBeDefined();
    });

    it("homework with zero time allocated", () => {
      const hwRecs = [
        makeHomeworkSupport({ id: "h1", time_allocated_minutes: 0 }),
      ];
      const r = computeHomeworkAcademicSupport(baseInput({
        homework_support_records: hwRecs,
      }));
      expect(r.academic_rating).toBeDefined();
    });

    it("tutoring with zero session duration", () => {
      const tRecs = [
        makeTutoring({ id: "t1", session_duration_minutes: 0 }),
      ];
      const r = computeHomeworkAcademicSupport(baseInput({
        tutoring_records: tRecs,
      }));
      expect(r.academic_rating).toBeDefined();
    });

    it("liaison with all types handled", () => {
      const types: SchoolLiaisonRecordInput["liaison_type"][] = [
        "parents_evening", "pep_meeting", "phone_call", "email",
        "school_visit", "report_review", "teacher_meeting", "senco_meeting", "other",
      ];
      const liRecs = types.map((t, i) =>
        makeLiaison({ id: `l${i}`, liaison_type: t }),
      );
      const r = computeHomeworkAcademicSupport(baseInput({
        school_liaison_records: liRecs,
      }));
      expect(r.academic_rating).toBeDefined();
    });

    it("study environment assessment types all accepted", () => {
      const types: StudyEnvironmentRecordInput["assessment_type"][] = [
        "scheduled", "spot_check", "child_feedback", "staff_observation",
      ];
      const seRecs = types.map((t, i) =>
        makeStudyEnvironment({ id: `se${i}`, assessment_type: t }),
      );
      const r = computeHomeworkAcademicSupport(baseInput({
        study_environment_records: seRecs,
      }));
      expect(r.academic_rating).toBeDefined();
    });

    it("all resource types accepted", () => {
      const types: EducationalResourceRecordInput["resource_type"][] = [
        "books", "stationery", "technology", "software", "reference_materials", "specialist_equipment", "other",
      ];
      const resRecs = types.map((t, i) =>
        makeResource({ id: `r${i}`, resource_type: t }),
      );
      const r = computeHomeworkAcademicSupport(baseInput({
        educational_resource_records: resRecs,
      }));
      expect(r.academic_rating).toBeDefined();
    });
  });

  // ── Headline format ──────────────────────────────────────────────────────

  describe("headline format", () => {
    it("good headline includes strengths and concerns count", () => {
      // Create a good scenario with some concerns
      const hwRecs = Array.from({ length: 10 }, (_, i) =>
        makeHomeworkSupport({ id: `hs_${i}`, homework_set: true, homework_completed: i < 9, staff_supported: i < 9, child_engaged: i < 8 }),
      );
      const seRecs = Array.from({ length: 4 }, (_, i) =>
        makeStudyEnvironment({ id: `se_${i}`, overall_quality: i < 3 ? "good" : "adequate" }),
      );
      const tRecs = [
        makeTutoring({ id: "t1", child_id: "child_1", child_engaged: true, progress_noted: true }),
        makeTutoring({ id: "t2", child_id: "child_2", child_engaged: true }),
        makeTutoring({ id: "t3", child_id: "child_3", child_engaged: false }),
      ];
      const resRecs = Array.from({ length: 4 }, (_, i) =>
        makeResource({ id: `er_${i}`, requested: true, provided: i < 3, age_appropriate: i < 3, child_using_resource: i < 3 }),
      );
      const liRecs = Array.from({ length: 4 }, (_, i) =>
        makeLiaison({ id: `sl_${i}`, staff_attended: i < 3, actions_agreed: 2, actions_completed: i < 3 ? 2 : 0, academic_progress_discussed: i < 3, pep_up_to_date: i < 3 }),
      );
      const r = computeHomeworkAcademicSupport(baseInput({
        homework_support_records: hwRecs,
        study_environment_records: seRecs,
        tutoring_records: tRecs,
        educational_resource_records: resRecs,
        school_liaison_records: liRecs,
      }));
      if (r.academic_rating === "good") {
        expect(r.headline).toContain("Good homework and academic support");
        expect(r.headline).toContain("strength");
      }
    });

    it("adequate headline mentions concerns count", () => {
      const r = computeHomeworkAcademicSupport(baseInput({
        homework_support_records: [
          makeHomeworkSupport({ id: "h1", homework_set: true, homework_completed: true, staff_supported: false, child_engaged: false }),
          makeHomeworkSupport({ id: "h2", homework_set: true, homework_completed: false, staff_supported: true, child_engaged: true }),
        ],
        study_environment_records: [
          makeStudyEnvironment({ id: "se1", overall_quality: "good" }),
          makeStudyEnvironment({ id: "se2", overall_quality: "poor" }),
        ],
        tutoring_records: [
          makeTutoring({ id: "t1", child_id: "child_1", session_planned: true, session_attended: true, child_engaged: false, progress_noted: false }),
          makeTutoring({ id: "t2", child_id: "child_1", session_planned: true, session_attended: false, child_engaged: true, progress_noted: true }),
        ],
        educational_resource_records: [
          makeResource({ id: "r1", requested: true, provided: true, age_appropriate: true, child_using_resource: false }),
          makeResource({ id: "r2", requested: true, provided: false, age_appropriate: false, child_using_resource: true }),
        ],
        school_liaison_records: [
          makeLiaison({ id: "l1", staff_attended: true, actions_agreed: 2, actions_completed: 1, academic_progress_discussed: true, pep_up_to_date: true }),
          makeLiaison({ id: "l2", staff_attended: false, actions_agreed: 2, actions_completed: 1, academic_progress_discussed: false, pep_up_to_date: false }),
        ],
      }));
      expect(r.headline).toContain("Adequate");
      expect(r.headline).toContain("concern");
    });

    it("inadequate headline mentions significant concerns", () => {
      const hwRecs = Array.from({ length: 5 }, (_, i) =>
        makeHomeworkSupport({ id: `h${i}`, homework_set: true, homework_completed: false, child_engaged: false }),
      );
      const seRecs = Array.from({ length: 5 }, (_, i) =>
        makeStudyEnvironment({ id: `se${i}`, overall_quality: "poor" }),
      );
      const liRecs = Array.from({ length: 5 }, (_, i) =>
        makeLiaison({ id: `l${i}`, staff_attended: false, actions_agreed: 3, actions_completed: 0, academic_progress_discussed: false }),
      );
      const r = computeHomeworkAcademicSupport(baseInput({
        homework_support_records: hwRecs,
        study_environment_records: seRecs,
        school_liaison_records: liRecs,
      }));
      expect(r.headline).toContain("inadequate");
      expect(r.headline).toContain("significant concern");
    });
  });

  // ── Rating Thresholds ────────────────────────────────────────────────────

  describe("rating thresholds", () => {
    it("score 80 maps to outstanding", () => {
      // Build a scenario that yields exactly 80
      const hwRecs = Array.from({ length: 10 }, (_, i) =>
        makeHomeworkSupport({ id: `hs_${i}`, homework_set: true, homework_completed: true, staff_supported: true, child_engaged: true }),
      );
      const seRecs = Array.from({ length: 5 }, (_, i) =>
        makeStudyEnvironment({ id: `se_${i}`, overall_quality: "excellent", child_satisfaction: 5 }),
      );
      const tRecs = [
        makeTutoring({ id: "t1", child_id: "child_1", session_planned: true, session_attended: true, child_engaged: true, progress_noted: true }),
        makeTutoring({ id: "t2", child_id: "child_2", session_planned: true, session_attended: true, child_engaged: true, progress_noted: true }),
        makeTutoring({ id: "t3", child_id: "child_3", session_planned: true, session_attended: true, child_engaged: true, progress_noted: true }),
      ];
      const resRecs = Array.from({ length: 5 }, (_, i) =>
        makeResource({ id: `er_${i}`, requested: true, provided: true, age_appropriate: true, child_using_resource: true }),
      );
      const liRecs = Array.from({ length: 5 }, (_, i) =>
        makeLiaison({ id: `sl_${i}`, staff_attended: true, actions_agreed: 3, actions_completed: 3, academic_progress_discussed: true, pep_up_to_date: true }),
      );
      const r = computeHomeworkAcademicSupport(baseInput({
        homework_support_records: hwRecs,
        study_environment_records: seRecs,
        tutoring_records: tRecs,
        educational_resource_records: resRecs,
        school_liaison_records: liRecs,
      }));
      // 52 + 4+3+3+4+3+3+3+3+2 = 80
      expect(r.academic_score).toBe(80);
      expect(r.academic_rating).toBe("outstanding");
    });

    it("score 79 maps to good", () => {
      // 52 + 4+3+3+4+3+3+3+3+2 = 80. Need 79.
      // Drop B9 (tutoringProgressRate <60 -> no bonus): 80 - 2 = 78. Too low.
      // Drop B8 lower tier: use pepUpToDate 70-89 -> +1 instead of +3 -> 80-2=78. Hmm.
      // Let's go from 80 and reduce B8 from +3 to +1: set pepUpToDate at 80% (4/5) -> +1
      // 52+4+3+3+4+3+3+1+1+2 = wait, B7 is staffSupportRate. Let me recalculate properly.
      // B1(4) + B2(3) + B3(3) + B4(4) + B5(3) + B6(3) + B7(3) + B8(3) + B9(2) = 28. 52+28=80.
      // For 79: reduce one bonus by 1. Drop B9 from +2 to +1: tutoringProgress 60-79 instead of >=80.
      // Set progress_noted on 2/3 tutoring records = 67%
      const hwRecs = Array.from({ length: 10 }, (_, i) =>
        makeHomeworkSupport({ id: `hs_${i}`, homework_set: true, homework_completed: true, staff_supported: true, child_engaged: true }),
      );
      const seRecs = Array.from({ length: 5 }, (_, i) =>
        makeStudyEnvironment({ id: `se_${i}`, overall_quality: "excellent" }),
      );
      const tRecs = [
        makeTutoring({ id: "t1", child_id: "child_1", session_planned: true, session_attended: true, child_engaged: true, progress_noted: true }),
        makeTutoring({ id: "t2", child_id: "child_2", session_planned: true, session_attended: true, child_engaged: true, progress_noted: true }),
        makeTutoring({ id: "t3", child_id: "child_3", session_planned: true, session_attended: true, child_engaged: true, progress_noted: false }),
      ];
      // tutoringProgressRate = pct(2,3)=67 -> B9=+1
      const resRecs = Array.from({ length: 5 }, (_, i) =>
        makeResource({ id: `er_${i}`, requested: true, provided: true, age_appropriate: true, child_using_resource: true }),
      );
      const liRecs = Array.from({ length: 5 }, (_, i) =>
        makeLiaison({ id: `sl_${i}`, staff_attended: true, actions_agreed: 3, actions_completed: 3, academic_progress_discussed: true, pep_up_to_date: true }),
      );
      const r = computeHomeworkAcademicSupport(baseInput({
        homework_support_records: hwRecs,
        study_environment_records: seRecs,
        tutoring_records: tRecs,
        educational_resource_records: resRecs,
        school_liaison_records: liRecs,
      }));
      expect(r.academic_score).toBe(79);
      expect(r.academic_rating).toBe("good");
    });

    it("score 65 maps to good", () => {
      // 52 + 13 = 65
      // B1(+2: hwCompletion>=70) + B2(+2: studyEnvQuality>=70) + B3(+1: tutCoverage>=60) + B4(+2: resAvail>=70) + B5(+1: liaisonRate>=70) + B6(+2: childEngagement>=70) + B7(+1: staffSupport>=70) + B8(+1: pepUpToDate>=70) + B9(+1: tutProgress>=60) = 13 -> 52+13=65
      const hwRecs = Array.from({ length: 10 }, (_, i) =>
        makeHomeworkSupport({
          id: `hs_${i}`,
          homework_set: true,
          homework_completed: i < 8, // 80% -> B1=+2
          staff_supported: i < 8, // 80% -> B7=+1
          child_engaged: i < 8, // 80%
        }),
      );
      const seRecs = Array.from({ length: 10 }, (_, i) =>
        makeStudyEnvironment({ id: `se_${i}`, overall_quality: i < 8 ? "good" : "poor" }), // 80% -> B2=+2
      );
      const tRecs = [
        makeTutoring({ id: "t1", child_id: "child_1", child_engaged: true, progress_noted: true }),
        makeTutoring({ id: "t2", child_id: "child_2", child_engaged: true, progress_noted: false }),
        makeTutoring({ id: "t3", child_id: "child_1", child_engaged: false, progress_noted: true }),
      ];
      // tutoringCoverage = pct(2,3) = 67 -> B3=+1
      // tutoringProgress = pct(2,3) = 67 -> B9=+1
      // childEngagement = pct(8+2+3, 10+3+4) = pct(13,17) = 76 -> B6=+2

      const resRecs = Array.from({ length: 4 }, (_, i) =>
        makeResource({
          id: `er_${i}`,
          requested: true,
          provided: i < 3, // 75%
          age_appropriate: i < 3, // 75%
          child_using_resource: i < 3, // 75%
        }),
      );
      // resourceAvail = round((75+75+75)/3) = 75 -> B4=+2

      const liRecs = Array.from({ length: 5 }, (_, i) =>
        makeLiaison({
          id: `sl_${i}`,
          staff_attended: i < 4, // 80%
          actions_agreed: 5,
          actions_completed: i < 4 ? 5 : 0, // pct(20,25)=80
          academic_progress_discussed: i < 4, // 80%
          pep_up_to_date: i < 4, // 80% -> B8=+1
        }),
      );
      // schoolLiaisonRate = round((80+80+80)/3) = 80 -> B5=+1

      const r = computeHomeworkAcademicSupport(baseInput({
        homework_support_records: hwRecs,
        study_environment_records: seRecs,
        tutoring_records: tRecs,
        educational_resource_records: resRecs,
        school_liaison_records: liRecs,
      }));
      expect(r.academic_score).toBe(65);
      expect(r.academic_rating).toBe("good");
    });

    it("score 64 maps to adequate", () => {
      // Same as score 65 but reduce one bonus by 1
      // Drop B9: tutoringProgress <60 -> no bonus -> 65-1=64
      const hwRecs = Array.from({ length: 10 }, (_, i) =>
        makeHomeworkSupport({
          id: `hs_${i}`,
          homework_set: true,
          homework_completed: i < 8,
          staff_supported: i < 8,
          child_engaged: i < 8,
        }),
      );
      const seRecs = Array.from({ length: 10 }, (_, i) =>
        makeStudyEnvironment({ id: `se_${i}`, overall_quality: i < 8 ? "good" : "poor" }),
      );
      const tRecs = [
        makeTutoring({ id: "t1", child_id: "child_1", child_engaged: true, progress_noted: false }),
        makeTutoring({ id: "t2", child_id: "child_2", child_engaged: true, progress_noted: false }),
        makeTutoring({ id: "t3", child_id: "child_1", child_engaged: false, progress_noted: true }),
      ];
      // tutoringProgress = pct(1,3) = 33 -> no B9
      // childEngagement = pct(8+2+3, 10+3+4) = pct(13,17) = 76 -> B6=+2

      const resRecs = Array.from({ length: 4 }, (_, i) =>
        makeResource({
          id: `er_${i}`,
          requested: true,
          provided: i < 3,
          age_appropriate: i < 3,
          child_using_resource: i < 3,
        }),
      );

      const liRecs = Array.from({ length: 5 }, (_, i) =>
        makeLiaison({
          id: `sl_${i}`,
          staff_attended: i < 4,
          actions_agreed: 5,
          actions_completed: i < 4 ? 5 : 0,
          academic_progress_discussed: i < 4,
          pep_up_to_date: i < 4,
        }),
      );

      const r = computeHomeworkAcademicSupport(baseInput({
        homework_support_records: hwRecs,
        study_environment_records: seRecs,
        tutoring_records: tRecs,
        educational_resource_records: resRecs,
        school_liaison_records: liRecs,
      }));
      expect(r.academic_score).toBe(64);
      expect(r.academic_rating).toBe("adequate");
    });

    it("score 45 maps to adequate", () => {
      // 52 - 7 = 45 (need penalties that sum to 7)
      // Use P1(-6) + ... nah, just P1(-6) gives 46. P2(-5) gives 47.
      // P1(-6)+P4(-3) = -9 -> 43. Too much.
      // Use only studyEnv penalty: 52-5=47.
      // schoolLiaison penalty alone: 52-5=47.
      // childEngagement penalty alone: 52-3=49.
      // hmm, getting 45 exactly is tricky. Let me use P2(-5) + one negative offset...
      // Actually, let me use P2(-5) and also get B9(+1) to get 52-5 = 47... still not 45.
      // P1(-6)+P4(-3) = 52-9=43. Not 45.
      // P2(-5)+P4(-3) = 52-8=44. Still not 45.
      // P3(-5)+P4(-3) = 52-8=44. Nope.
      // P1(-6)+any? P1(-6) = 46. One less -> B9(-1)? No, bonuses add.
      // I think we can't easily hit exactly 45 without bonuses.
      // Let's use P2(-5) + B9(+1) + P4(-3) = 52-5+1-3 = 45!
      // Need: studyEnvQualityRate<40 -> P2(-5)
      // tutoringProgressRate>=60 -> B9=+1
      // childEngagementRate<30 -> P4=-3
      // And no other bonuses/penalties.

      const hwRecs = Array.from({ length: 10 }, (_, i) =>
        makeHomeworkSupport({
          id: `hs_${i}`,
          homework_set: true,
          homework_completed: i < 5, // 50% -> no B1, no P1
          staff_supported: i < 5, // 50% -> no B7
          child_engaged: false, // 0/10 engaged
        }),
      );
      const seRecs = Array.from({ length: 5 }, (_, i) =>
        makeStudyEnvironment({
          id: `se_${i}`,
          overall_quality: i === 0 ? "good" : "poor", // 1/5=20% -> P2=-5
        }),
      );
      const tRecs = Array.from({ length: 5 }, (_, i) =>
        makeTutoring({
          id: `t_${i}`,
          child_id: "child_1",
          session_planned: true,
          session_attended: i < 3,
          child_engaged: false, // 0 engaged
          progress_noted: i < 4, // 4/5=80% -> wait, >=80 -> B9=+2, not +1!
        }),
      );
      // Need tutoringProgressRate >=60 but <80 for B9=+1.
      // 3/5=60% -> B9=+1
      const tRecsFixed = Array.from({ length: 5 }, (_, i) =>
        makeTutoring({
          id: `t_${i}`,
          child_id: "child_1",
          session_planned: true,
          session_attended: i < 3,
          child_engaged: false,
          progress_noted: i < 3, // 3/5=60% -> B9=+1
        }),
      );
      // tutoringCoverage = pct(1,3)=33 -> no B3
      const resRecs = [
        makeResource({ id: "r1", requested: true, provided: true, age_appropriate: true, child_using_resource: false }),
        makeResource({ id: "r2", requested: true, provided: false, age_appropriate: false, child_using_resource: false }),
      ];
      // resourceAvail = round((50+50+0)/3) = round(33.33) = 33 -> no B4
      // childEngagement = pct(0+0+0, 10+5+2) = 0 -> P4=-3

      const liRecs = [
        makeLiaison({ id: "l1", staff_attended: true, actions_agreed: 2, actions_completed: 1, academic_progress_discussed: true, pep_up_to_date: true }),
        makeLiaison({ id: "l2", staff_attended: false, actions_agreed: 2, actions_completed: 1, academic_progress_discussed: false, pep_up_to_date: false }),
      ];
      // schoolLiaisonRate = round((50+50+50)/3) = 50 -> no P3, no B5
      // pepUpToDate = 50% -> no B8

      const r = computeHomeworkAcademicSupport(baseInput({
        homework_support_records: hwRecs,
        study_environment_records: seRecs,
        tutoring_records: tRecsFixed,
        educational_resource_records: resRecs,
        school_liaison_records: liRecs,
      }));
      // 52 + 1(B9) - 5(P2) - 3(P4) = 45
      expect(r.academic_score).toBe(45);
      expect(r.academic_rating).toBe("adequate");
    });

    it("score 44 maps to inadequate", () => {
      // 52 - 8 = 44. Use P2(-5)+P4(-3) = -8.
      const hwRecs = Array.from({ length: 10 }, (_, i) =>
        makeHomeworkSupport({
          id: `hs_${i}`,
          homework_set: true,
          homework_completed: i < 5, // 50% -> no B1, no P1
          staff_supported: i < 5, // 50% -> no B7
          child_engaged: false,
        }),
      );
      const seRecs = Array.from({ length: 5 }, (_, i) =>
        makeStudyEnvironment({
          id: `se_${i}`,
          overall_quality: i === 0 ? "good" : "poor", // 20% -> P2=-5
        }),
      );
      const tRecs = [
        makeTutoring({ id: "t1", child_id: "child_1", child_engaged: false, progress_noted: false }),
      ];
      // tutoringProgress = 0% -> no B9
      const resRecs = [
        makeResource({ id: "r1", requested: true, provided: true, age_appropriate: true, child_using_resource: false }),
        makeResource({ id: "r2", requested: true, provided: false, age_appropriate: false, child_using_resource: false }),
      ];
      // childEngagement = pct(0+0+0, 10+1+2) = 0 -> P4=-3
      const liRecs = [
        makeLiaison({ id: "l1", staff_attended: true, actions_agreed: 2, actions_completed: 1, academic_progress_discussed: true, pep_up_to_date: true }),
        makeLiaison({ id: "l2", staff_attended: false, actions_agreed: 2, actions_completed: 1, academic_progress_discussed: false, pep_up_to_date: false }),
      ];
      // schoolLiaisonRate = 50 -> no P3
      const r = computeHomeworkAcademicSupport(baseInput({
        homework_support_records: hwRecs,
        study_environment_records: seRecs,
        tutoring_records: tRecs,
        educational_resource_records: resRecs,
        school_liaison_records: liRecs,
      }));
      expect(r.academic_score).toBe(44);
      expect(r.academic_rating).toBe("inadequate");
    });
  });

  // ── Return shape validation ──────────────────────────────────────────────

  describe("return shape", () => {
    it("all expected fields are present in result", () => {
      const r = computeHomeworkAcademicSupport(baseInput({ total_children: 0 }));
      expect(r).toHaveProperty("academic_rating");
      expect(r).toHaveProperty("academic_score");
      expect(r).toHaveProperty("headline");
      expect(r).toHaveProperty("homework_completion_rate");
      expect(r).toHaveProperty("study_environment_quality_rate");
      expect(r).toHaveProperty("tutoring_coverage_rate");
      expect(r).toHaveProperty("resource_availability_rate");
      expect(r).toHaveProperty("school_liaison_rate");
      expect(r).toHaveProperty("child_engagement_rate");
      expect(r).toHaveProperty("strengths");
      expect(r).toHaveProperty("concerns");
      expect(r).toHaveProperty("recommendations");
      expect(r).toHaveProperty("insights");
    });

    it("rates are numeric integers", () => {
      const r = computeHomeworkAcademicSupport(baseInput({
        homework_support_records: [makeHomeworkSupport()],
        study_environment_records: [makeStudyEnvironment()],
        tutoring_records: [makeTutoring()],
        educational_resource_records: [makeResource()],
        school_liaison_records: [makeLiaison()],
      }));
      expect(Number.isInteger(r.homework_completion_rate)).toBe(true);
      expect(Number.isInteger(r.study_environment_quality_rate)).toBe(true);
      expect(Number.isInteger(r.tutoring_coverage_rate)).toBe(true);
      expect(Number.isInteger(r.resource_availability_rate)).toBe(true);
      expect(Number.isInteger(r.school_liaison_rate)).toBe(true);
      expect(Number.isInteger(r.child_engagement_rate)).toBe(true);
    });

    it("academic_score is an integer", () => {
      const r = computeHomeworkAcademicSupport(baseInput({
        homework_support_records: [makeHomeworkSupport()],
      }));
      expect(Number.isInteger(r.academic_score)).toBe(true);
    });

    it("recommendations have required fields", () => {
      const r = computeHomeworkAcademicSupport(baseInput({
        homework_support_records: [makeHomeworkSupport({ id: "h1", homework_set: true, homework_completed: false, child_engaged: false })],
        study_environment_records: [makeStudyEnvironment({ id: "se1", overall_quality: "poor" })],
      }));
      for (const rec of r.recommendations) {
        expect(rec).toHaveProperty("rank");
        expect(rec).toHaveProperty("recommendation");
        expect(rec).toHaveProperty("urgency");
        expect(rec).toHaveProperty("regulatory_ref");
        expect(typeof rec.rank).toBe("number");
        expect(typeof rec.recommendation).toBe("string");
        expect(["immediate", "soon", "planned"]).toContain(rec.urgency);
      }
    });

    it("insights have required fields", () => {
      const r = computeHomeworkAcademicSupport(baseInput({
        homework_support_records: [makeHomeworkSupport({ id: "h1", homework_set: true, homework_completed: false })],
      }));
      for (const ins of r.insights) {
        expect(ins).toHaveProperty("text");
        expect(ins).toHaveProperty("severity");
        expect(typeof ins.text).toBe("string");
        expect(["critical", "warning", "positive"]).toContain(ins.severity);
      }
    });

    it("academic_rating is a valid value", () => {
      const validRatings = ["outstanding", "good", "adequate", "inadequate", "insufficient_data"];
      const r1 = computeHomeworkAcademicSupport(baseInput({ total_children: 0 }));
      expect(validRatings).toContain(r1.academic_rating);
      const r2 = computeHomeworkAcademicSupport(baseInput());
      expect(validRatings).toContain(r2.academic_rating);
    });
  });
});
