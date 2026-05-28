// ==============================================================================
// CORNERSTONE -- HOME HOMEWORK & ACADEMIC SUPPORT INTELLIGENCE ENGINE
// Tracks the quality of educational support provided at home -- homework
// completion support, quiet study environments, tutoring provision, educational
// resource availability, and school liaison for academic progress.
// Pure deterministic engine -- no imports, no LLM, no external deps.
// CHR 2015 Reg 5 (Quality of care standard), Reg 8 (Education),
// SCCIF "Experiences and progress of children".
// Store keys: homeworkSupportRecords, studyEnvironmentRecords,
//             tutoringRecords, educationalResourceRecords,
//             schoolLiaisonRecords
// ==============================================================================

// -- Input Types --------------------------------------------------------------

export interface HomeworkSupportRecordInput {
  id: string;
  child_id: string;
  date: string;
  subject: string;
  homework_set: boolean;
  homework_completed: boolean;
  staff_supported: boolean;
  support_quality: "excellent" | "good" | "adequate" | "poor" | "none";
  time_allocated_minutes: number;
  quiet_space_available: boolean;
  child_engaged: boolean;
  child_asked_for_help: boolean;
  barriers_encountered: string[];
  outcome: "completed" | "partially_completed" | "not_completed" | "not_applicable";
  notes: string;
  created_at: string;
}

export interface StudyEnvironmentRecordInput {
  id: string;
  child_id: string;
  date: string;
  assessment_type: "scheduled" | "spot_check" | "child_feedback" | "staff_observation";
  quiet_space_available: boolean;
  desk_provided: boolean;
  lighting_adequate: boolean;
  free_from_distractions: boolean;
  study_materials_available: boolean;
  internet_access_available: boolean;
  time_protected: boolean;
  child_satisfaction: number; // 1-5
  improvements_needed: string[];
  overall_quality: "excellent" | "good" | "adequate" | "poor";
  created_at: string;
}

export interface TutoringRecordInput {
  id: string;
  child_id: string;
  subject: string;
  tutor_type: "professional" | "staff" | "volunteer" | "peer" | "online";
  date: string;
  session_planned: boolean;
  session_attended: boolean;
  session_duration_minutes: number;
  child_engaged: boolean;
  progress_noted: boolean;
  child_satisfaction: number; // 1-5
  tutor_feedback_provided: boolean;
  linked_to_school_curriculum: boolean;
  outcome_documented: boolean;
  created_at: string;
}

export interface EducationalResourceRecordInput {
  id: string;
  child_id: string;
  resource_type: "books" | "stationery" | "technology" | "software" | "reference_materials" | "specialist_equipment" | "other";
  date: string;
  requested: boolean;
  provided: boolean;
  age_appropriate: boolean;
  curriculum_aligned: boolean;
  condition: "new" | "good" | "adequate" | "poor";
  child_using_resource: boolean;
  budget_allocated: boolean;
  notes: string;
  created_at: string;
}

export interface SchoolLiaisonRecordInput {
  id: string;
  child_id: string;
  date: string;
  liaison_type: "parents_evening" | "pep_meeting" | "phone_call" | "email" | "school_visit" | "report_review" | "teacher_meeting" | "senco_meeting" | "other";
  staff_attended: boolean;
  school_engaged: boolean;
  actions_agreed: number;
  actions_completed: number;
  academic_progress_discussed: boolean;
  attendance_discussed: boolean;
  behaviour_discussed: boolean;
  additional_support_identified: boolean;
  follow_up_date: string | null;
  follow_up_completed: boolean;
  child_voice_included: boolean;
  pep_up_to_date: boolean;
  notes: string;
  created_at: string;
}

export interface HomeworkAcademicSupportInput {
  today: string;
  total_children: number;
  homework_support_records: HomeworkSupportRecordInput[];
  study_environment_records: StudyEnvironmentRecordInput[];
  tutoring_records: TutoringRecordInput[];
  educational_resource_records: EducationalResourceRecordInput[];
  school_liaison_records: SchoolLiaisonRecordInput[];
}

// -- Output Types -------------------------------------------------------------

export type AcademicSupportRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface AcademicSupportInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface AcademicSupportRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface HomeworkAcademicSupportResult {
  academic_rating: AcademicSupportRating;
  academic_score: number;
  headline: string;
  homework_completion_rate: number;
  study_environment_quality_rate: number;
  tutoring_coverage_rate: number;
  resource_availability_rate: number;
  school_liaison_rate: number;
  child_engagement_rate: number;
  strengths: string[];
  concerns: string[];
  recommendations: AcademicSupportRecommendation[];
  insights: AcademicSupportInsight[];
}

// -- Helpers ------------------------------------------------------------------

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): AcademicSupportRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// -- Empty Result Factory -----------------------------------------------------

function emptyResult(
  rating: AcademicSupportRating,
  score: number,
  headline: string,
): HomeworkAcademicSupportResult {
  return {
    academic_rating: rating,
    academic_score: score,
    headline,
    homework_completion_rate: 0,
    study_environment_quality_rate: 0,
    tutoring_coverage_rate: 0,
    resource_availability_rate: 0,
    school_liaison_rate: 0,
    child_engagement_rate: 0,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// -- Main Compute -------------------------------------------------------------

export function computeHomeworkAcademicSupport(
  input: HomeworkAcademicSupportInput,
): HomeworkAcademicSupportResult {
  const {
    total_children,
    homework_support_records,
    study_environment_records,
    tutoring_records,
    educational_resource_records,
    school_liaison_records,
  } = input;

  // -- Special case: all empty + 0 children -> insufficient_data ------------
  const allEmpty =
    homework_support_records.length === 0 &&
    study_environment_records.length === 0 &&
    tutoring_records.length === 0 &&
    educational_resource_records.length === 0 &&
    school_liaison_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement -- insufficient data to assess homework and academic support.",
    );
  }

  // -- Special case: all empty + children > 0 -> inadequate -----------------
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No homework or academic support data recorded despite children on placement -- educational support, study environments, and school liaison require urgent attention.",
      ),
      concerns: [
        "No homework support, study environment, tutoring, educational resource, or school liaison records exist despite children being on placement -- the home cannot evidence that it supports children's education.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement structured recording of homework support, study environment assessments, tutoring sessions, educational resource provision, and school liaison activities to evidence the home's commitment to children's education.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 8 -- Education",
        },
        {
          rank: 2,
          recommendation:
            "Ensure every child has a Personal Education Plan (PEP) that is reviewed termly and that the home actively supports homework completion, provides quiet study spaces, and maintains regular contact with schools.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 5 -- Quality of care standard",
        },
      ],
      insights: [
        {
          text: "The complete absence of homework and academic support records means Ofsted cannot verify that children's education is being prioritised or supported at home. This represents a fundamental gap in Reg 8 compliance and the home's duty to promote educational achievement.",
          severity: "critical",
        },
      ],
    };
  }

  // -- Compute core metrics -------------------------------------------------

  // --- Homework completion support ---
  const totalHomeworkRecords = homework_support_records.length;
  const homeworkSet = homework_support_records.filter((r) => r.homework_set).length;
  const homeworkCompleted = homework_support_records.filter(
    (r) => r.homework_set && r.homework_completed,
  ).length;
  const homeworkCompletionRate = pct(homeworkCompleted, homeworkSet);

  const staffSupportedHomework = homework_support_records.filter(
    (r) => r.staff_supported,
  ).length;
  const staffSupportRate = pct(staffSupportedHomework, totalHomeworkRecords);

  const homeworkEngaged = homework_support_records.filter(
    (r) => r.child_engaged,
  ).length;
  const homeworkEngagementRate = pct(homeworkEngaged, totalHomeworkRecords);

  const homeworkBarriersTotal = homework_support_records.filter(
    (r) => r.barriers_encountered.length > 0,
  ).length;
  const homeworkBarrierRate = pct(homeworkBarriersTotal, totalHomeworkRecords);

  const homeworkQuietSpace = homework_support_records.filter(
    (r) => r.quiet_space_available,
  ).length;
  const homeworkQuietSpaceRate = pct(homeworkQuietSpace, totalHomeworkRecords);

  const supportQualityScores: Record<string, number> = {
    excellent: 5,
    good: 4,
    adequate: 3,
    poor: 2,
    none: 1,
  };
  const totalSupportQuality = homework_support_records.reduce(
    (sum, r) => sum + (supportQualityScores[r.support_quality] ?? 3),
    0,
  );
  const avgSupportQuality =
    totalHomeworkRecords > 0
      ? Math.round((totalSupportQuality / totalHomeworkRecords) * 100) / 100
      : 0;

  const totalTimeAllocated = homework_support_records.reduce(
    (sum, r) => sum + r.time_allocated_minutes,
    0,
  );
  const avgTimeAllocated =
    totalHomeworkRecords > 0
      ? Math.round(totalTimeAllocated / totalHomeworkRecords)
      : 0;

  const homeworkFullyCompleted = homework_support_records.filter(
    (r) => r.outcome === "completed",
  ).length;
  const homeworkPartiallyCompleted = homework_support_records.filter(
    (r) => r.outcome === "partially_completed",
  ).length;
  const homeworkNotCompleted = homework_support_records.filter(
    (r) => r.outcome === "not_completed",
  ).length;
  const homeworkOutcomeDenominator = homeworkFullyCompleted + homeworkPartiallyCompleted + homeworkNotCompleted;
  const homeworkOutcomeRate = pct(homeworkFullyCompleted, homeworkOutcomeDenominator);

  const childAskedForHelp = homework_support_records.filter(
    (r) => r.child_asked_for_help,
  ).length;
  const childHelpSeekingRate = pct(childAskedForHelp, totalHomeworkRecords);

  // --- Study environment quality ---
  const totalStudyEnvRecords = study_environment_records.length;
  const qualityScores: Record<string, number> = {
    excellent: 4,
    good: 3,
    adequate: 2,
    poor: 1,
  };
  const totalEnvQuality = study_environment_records.reduce(
    (sum, r) => sum + (qualityScores[r.overall_quality] ?? 2),
    0,
  );
  const envQualityRate =
    totalStudyEnvRecords > 0
      ? Math.round((totalEnvQuality / (totalStudyEnvRecords * 4)) * 100)
      : 0;

  const quietSpaceAvailable = study_environment_records.filter(
    (r) => r.quiet_space_available,
  ).length;
  const quietSpaceRate = pct(quietSpaceAvailable, totalStudyEnvRecords);

  const deskProvided = study_environment_records.filter(
    (r) => r.desk_provided,
  ).length;
  const deskRate = pct(deskProvided, totalStudyEnvRecords);

  const lightingAdequate = study_environment_records.filter(
    (r) => r.lighting_adequate,
  ).length;
  const lightingRate = pct(lightingAdequate, totalStudyEnvRecords);

  const freeFromDistractions = study_environment_records.filter(
    (r) => r.free_from_distractions,
  ).length;
  const distractionFreeRate = pct(freeFromDistractions, totalStudyEnvRecords);

  const studyMaterials = study_environment_records.filter(
    (r) => r.study_materials_available,
  ).length;
  const studyMaterialsRate = pct(studyMaterials, totalStudyEnvRecords);

  const internetAccess = study_environment_records.filter(
    (r) => r.internet_access_available,
  ).length;
  const internetAccessRate = pct(internetAccess, totalStudyEnvRecords);

  const timeProtected = study_environment_records.filter(
    (r) => r.time_protected,
  ).length;
  const timeProtectedRate = pct(timeProtected, totalStudyEnvRecords);

  const envSatisfactionSum = study_environment_records.reduce(
    (sum, r) => sum + r.child_satisfaction,
    0,
  );
  const envSatisfactionAvg =
    totalStudyEnvRecords > 0
      ? Math.round((envSatisfactionSum / totalStudyEnvRecords) * 100) / 100
      : 0;

  const envImprovementsNeeded = study_environment_records.filter(
    (r) => r.improvements_needed.length > 0,
  ).length;
  const envImprovementsRate = pct(envImprovementsNeeded, totalStudyEnvRecords);

  const excellentOrGoodEnv = study_environment_records.filter(
    (r) => r.overall_quality === "excellent" || r.overall_quality === "good",
  ).length;
  const studyEnvironmentQualityRate = pct(excellentOrGoodEnv, totalStudyEnvRecords);

  // --- Tutoring coverage ---
  const totalTutoringRecords = tutoring_records.length;
  const tutoringPlanned = tutoring_records.filter(
    (r) => r.session_planned,
  ).length;
  const tutoringAttended = tutoring_records.filter(
    (r) => r.session_attended,
  ).length;
  const tutoringAttendanceRate = pct(tutoringAttended, tutoringPlanned);

  const tutoringEngaged = tutoring_records.filter(
    (r) => r.child_engaged,
  ).length;
  const tutoringEngagementRate = pct(tutoringEngaged, totalTutoringRecords);

  const tutoringProgressNoted = tutoring_records.filter(
    (r) => r.progress_noted,
  ).length;
  const tutoringProgressRate = pct(tutoringProgressNoted, totalTutoringRecords);

  const tutoringSatisfactionSum = tutoring_records.reduce(
    (sum, r) => sum + r.child_satisfaction,
    0,
  );
  const tutoringSatisfactionAvg =
    totalTutoringRecords > 0
      ? Math.round((tutoringSatisfactionSum / totalTutoringRecords) * 100) / 100
      : 0;

  const tutorFeedbackProvided = tutoring_records.filter(
    (r) => r.tutor_feedback_provided,
  ).length;
  const tutorFeedbackRate = pct(tutorFeedbackProvided, totalTutoringRecords);

  const linkedToCurriculum = tutoring_records.filter(
    (r) => r.linked_to_school_curriculum,
  ).length;
  const curriculumAlignmentRate = pct(linkedToCurriculum, totalTutoringRecords);

  const tutoringOutcomeDocumented = tutoring_records.filter(
    (r) => r.outcome_documented,
  ).length;
  const tutoringDocumentationRate = pct(tutoringOutcomeDocumented, totalTutoringRecords);

  const uniqueChildrenWithTutoring = new Set(
    tutoring_records.map((r) => r.child_id),
  ).size;
  const tutoringCoverageRate =
    total_children > 0 ? pct(uniqueChildrenWithTutoring, total_children) : tutoringAttendanceRate;

  const totalSessionDuration = tutoring_records.reduce(
    (sum, r) => sum + r.session_duration_minutes,
    0,
  );
  const avgSessionDuration =
    totalTutoringRecords > 0
      ? Math.round(totalSessionDuration / totalTutoringRecords)
      : 0;

  // --- Educational resource availability ---
  const totalResourceRecords = educational_resource_records.length;
  const resourcesRequested = educational_resource_records.filter(
    (r) => r.requested,
  ).length;
  const resourcesProvided = educational_resource_records.filter(
    (r) => r.provided,
  ).length;
  const resourceFulfilmentRate = pct(resourcesProvided, resourcesRequested);

  const resourcesAgeAppropriate = educational_resource_records.filter(
    (r) => r.age_appropriate,
  ).length;
  const ageAppropriateRate = pct(resourcesAgeAppropriate, totalResourceRecords);

  const resourcesCurriculumAligned = educational_resource_records.filter(
    (r) => r.curriculum_aligned,
  ).length;
  const resourceCurriculumRate = pct(resourcesCurriculumAligned, totalResourceRecords);

  const resourcesInUse = educational_resource_records.filter(
    (r) => r.child_using_resource,
  ).length;
  const resourceUsageRate = pct(resourcesInUse, totalResourceRecords);

  const budgetAllocated = educational_resource_records.filter(
    (r) => r.budget_allocated,
  ).length;
  const budgetAllocationRate = pct(budgetAllocated, totalResourceRecords);

  const goodConditionResources = educational_resource_records.filter(
    (r) => r.condition === "new" || r.condition === "good",
  ).length;
  const resourceConditionRate = pct(goodConditionResources, totalResourceRecords);

  const resourceAvailabilityRate =
    totalResourceRecords > 0
      ? Math.round((resourceFulfilmentRate + ageAppropriateRate + resourceUsageRate) / 3)
      : 0;

  // --- School liaison ---
  const totalLiaisonRecords = school_liaison_records.length;
  const staffAttendedLiaison = school_liaison_records.filter(
    (r) => r.staff_attended,
  ).length;
  const staffAttendanceRate = pct(staffAttendedLiaison, totalLiaisonRecords);

  const schoolEngaged = school_liaison_records.filter(
    (r) => r.school_engaged,
  ).length;
  const schoolEngagementRate = pct(schoolEngaged, totalLiaisonRecords);

  const totalActionsAgreed = school_liaison_records.reduce(
    (sum, r) => sum + r.actions_agreed,
    0,
  );
  const totalActionsCompleted = school_liaison_records.reduce(
    (sum, r) => sum + r.actions_completed,
    0,
  );
  const actionCompletionRate = pct(totalActionsCompleted, totalActionsAgreed);

  const academicProgressDiscussed = school_liaison_records.filter(
    (r) => r.academic_progress_discussed,
  ).length;
  const academicDiscussionRate = pct(academicProgressDiscussed, totalLiaisonRecords);

  const attendanceDiscussed = school_liaison_records.filter(
    (r) => r.attendance_discussed,
  ).length;
  const attendanceDiscussionRate = pct(attendanceDiscussed, totalLiaisonRecords);

  const additionalSupportIdentified = school_liaison_records.filter(
    (r) => r.additional_support_identified,
  ).length;
  const additionalSupportRate = pct(additionalSupportIdentified, totalLiaisonRecords);

  const followUpRequired = school_liaison_records.filter(
    (r) => r.follow_up_date !== null,
  ).length;
  const followUpCompleted = school_liaison_records.filter(
    (r) => r.follow_up_date !== null && r.follow_up_completed,
  ).length;
  const followUpCompletionRate = pct(followUpCompleted, followUpRequired);

  const childVoiceIncluded = school_liaison_records.filter(
    (r) => r.child_voice_included,
  ).length;
  const liaisonChildVoiceRate = pct(childVoiceIncluded, totalLiaisonRecords);

  const pepUpToDate = school_liaison_records.filter(
    (r) => r.pep_up_to_date,
  ).length;
  const pepUpToDateRate = pct(pepUpToDate, totalLiaisonRecords);

  const schoolLiaisonRate =
    totalLiaisonRecords > 0
      ? Math.round((staffAttendanceRate + actionCompletionRate + academicDiscussionRate) / 3)
      : 0;

  // --- Child engagement composite ---
  const engagementNumerator =
    homeworkEngaged + tutoringEngaged + resourcesInUse;
  const engagementDenominator =
    totalHomeworkRecords + totalTutoringRecords + totalResourceRecords;
  const childEngagementRate = pct(engagementNumerator, engagementDenominator);

  // -- Scoring: base 52 ----------------------------------------------------

  let score = 52;

  // --- Bonus 1: homeworkCompletionRate (>=90: +4, >=70: +2) ---
  if (homeworkCompletionRate >= 90) score += 4;
  else if (homeworkCompletionRate >= 70) score += 2;

  // --- Bonus 2: studyEnvironmentQualityRate (>=90: +3, >=70: +2) ---
  if (studyEnvironmentQualityRate >= 90) score += 3;
  else if (studyEnvironmentQualityRate >= 70) score += 2;

  // --- Bonus 3: tutoringCoverageRate (>=80: +3, >=60: +1) ---
  if (tutoringCoverageRate >= 80) score += 3;
  else if (tutoringCoverageRate >= 60) score += 1;

  // --- Bonus 4: resourceAvailabilityRate (>=90: +4, >=70: +2) ---
  if (resourceAvailabilityRate >= 90) score += 4;
  else if (resourceAvailabilityRate >= 70) score += 2;

  // --- Bonus 5: schoolLiaisonRate (>=90: +3, >=70: +1) ---
  if (schoolLiaisonRate >= 90) score += 3;
  else if (schoolLiaisonRate >= 70) score += 1;

  // --- Bonus 6: childEngagementRate (>=90: +3, >=70: +2) ---
  if (childEngagementRate >= 90) score += 3;
  else if (childEngagementRate >= 70) score += 2;

  // --- Bonus 7: staffSupportRate (>=90: +3, >=70: +1) ---
  if (staffSupportRate >= 90) score += 3;
  else if (staffSupportRate >= 70) score += 1;

  // --- Bonus 8: pepUpToDateRate (>=90: +3, >=70: +1) ---
  if (pepUpToDateRate >= 90) score += 3;
  else if (pepUpToDateRate >= 70) score += 1;

  // --- Bonus 9: tutoringProgressRate (>=80: +2, >=60: +1) ---
  if (tutoringProgressRate >= 80) score += 2;
  else if (tutoringProgressRate >= 60) score += 1;

  // -- Penalties (4 with guards) -------------------------------------------

  // homeworkCompletionRate < 40 -> -6
  if (homeworkCompletionRate < 40 && homeworkSet > 0) score -= 6;

  // studyEnvironmentQualityRate < 40 -> -5
  if (studyEnvironmentQualityRate < 40 && totalStudyEnvRecords > 0) score -= 5;

  // schoolLiaisonRate < 40 -> -5
  if (schoolLiaisonRate < 40 && totalLiaisonRecords > 0) score -= 5;

  // childEngagementRate < 30 -> -3
  if (childEngagementRate < 30 && engagementDenominator > 0) score -= 3;

  score = clamp(score, 0, 100);

  const academic_rating = toRating(score);

  // -- Strengths ------------------------------------------------------------

  const strengths: string[] = [];

  if (homeworkCompletionRate >= 90 && homeworkSet > 0) {
    strengths.push(
      `${homeworkCompletionRate}% homework completion rate -- the home demonstrates exceptional support for children's homework, ensuring tasks are completed to a high standard.`,
    );
  } else if (homeworkCompletionRate >= 70 && homeworkSet > 0) {
    strengths.push(
      `${homeworkCompletionRate}% homework completion rate -- most children are completing their homework with appropriate support from the home.`,
    );
  }

  if (staffSupportRate >= 90 && totalHomeworkRecords > 0) {
    strengths.push(
      `Staff actively support ${staffSupportRate}% of homework activities -- staff engagement with children's educational needs is exemplary.`,
    );
  } else if (staffSupportRate >= 70 && totalHomeworkRecords > 0) {
    strengths.push(
      `Staff support provided in ${staffSupportRate}% of homework sessions -- good staff involvement in children's learning.`,
    );
  }

  if (avgSupportQuality >= 4.0 && totalHomeworkRecords > 0) {
    strengths.push(
      `Average homework support quality rated ${avgSupportQuality}/5 -- the quality of educational support provided is consistently high.`,
    );
  }

  if (homeworkEngagementRate >= 90 && totalHomeworkRecords > 0) {
    strengths.push(
      `${homeworkEngagementRate}% child engagement during homework -- children are motivated and actively participating in their learning at home.`,
    );
  } else if (homeworkEngagementRate >= 70 && totalHomeworkRecords > 0) {
    strengths.push(
      `${homeworkEngagementRate}% child engagement during homework sessions -- most children are engaged with their learning.`,
    );
  }

  if (studyEnvironmentQualityRate >= 90 && totalStudyEnvRecords > 0) {
    strengths.push(
      `${studyEnvironmentQualityRate}% of study environment assessments rated good or excellent -- the home provides outstanding learning spaces for children.`,
    );
  } else if (studyEnvironmentQualityRate >= 70 && totalStudyEnvRecords > 0) {
    strengths.push(
      `${studyEnvironmentQualityRate}% of study environments rated good or excellent -- children generally have suitable spaces to study.`,
    );
  }

  if (quietSpaceRate >= 90 && totalStudyEnvRecords > 0) {
    strengths.push(
      `Quiet study space available in ${quietSpaceRate}% of assessments -- the home prioritises calm, distraction-free learning environments.`,
    );
  }

  if (envSatisfactionAvg >= 4.0 && totalStudyEnvRecords > 0) {
    strengths.push(
      `Children's satisfaction with study environments averages ${envSatisfactionAvg}/5 -- children feel their learning spaces support their education well.`,
    );
  }

  if (tutoringAttendanceRate >= 90 && tutoringPlanned > 0) {
    strengths.push(
      `${tutoringAttendanceRate}% tutoring session attendance rate -- excellent take-up of tutoring opportunities, indicating strong support and motivation.`,
    );
  } else if (tutoringAttendanceRate >= 70 && tutoringPlanned > 0) {
    strengths.push(
      `${tutoringAttendanceRate}% tutoring attendance -- good engagement with additional educational support.`,
    );
  }

  if (tutoringProgressRate >= 80 && totalTutoringRecords > 0) {
    strengths.push(
      `Progress noted in ${tutoringProgressRate}% of tutoring sessions -- tutoring is making a measurable difference to children's academic outcomes.`,
    );
  } else if (tutoringProgressRate >= 60 && totalTutoringRecords > 0) {
    strengths.push(
      `Progress noted in ${tutoringProgressRate}% of tutoring sessions -- tutoring is contributing positively to children's learning.`,
    );
  }

  if (curriculumAlignmentRate >= 80 && totalTutoringRecords > 0) {
    strengths.push(
      `${curriculumAlignmentRate}% of tutoring sessions linked to the school curriculum -- tutoring is targeted and aligned with what children are learning at school.`,
    );
  }

  if (tutoringSatisfactionAvg >= 4.0 && totalTutoringRecords > 0) {
    strengths.push(
      `Children's satisfaction with tutoring averages ${tutoringSatisfactionAvg}/5 -- children value the additional academic support they receive.`,
    );
  }

  if (resourceFulfilmentRate >= 90 && resourcesRequested > 0) {
    strengths.push(
      `${resourceFulfilmentRate}% of requested educational resources provided -- the home responds promptly and fully to children's educational resource needs.`,
    );
  } else if (resourceFulfilmentRate >= 70 && resourcesRequested > 0) {
    strengths.push(
      `${resourceFulfilmentRate}% of requested educational resources provided -- most resource requests are being met.`,
    );
  }

  if (ageAppropriateRate >= 90 && totalResourceRecords > 0) {
    strengths.push(
      `${ageAppropriateRate}% of educational resources are age-appropriate -- the home ensures resources match each child's developmental stage and learning needs.`,
    );
  }

  if (resourceUsageRate >= 80 && totalResourceRecords > 0) {
    strengths.push(
      `${resourceUsageRate}% of provided resources are actively used by children -- resources are well-chosen and genuinely supporting learning.`,
    );
  }

  if (staffAttendanceRate >= 90 && totalLiaisonRecords > 0) {
    strengths.push(
      `Staff attend ${staffAttendanceRate}% of school liaison activities -- the home demonstrates strong commitment to working with schools for children's benefit.`,
    );
  } else if (staffAttendanceRate >= 70 && totalLiaisonRecords > 0) {
    strengths.push(
      `Staff attendance at school liaison activities at ${staffAttendanceRate}% -- good engagement with children's schools.`,
    );
  }

  if (actionCompletionRate >= 90 && totalActionsAgreed > 0) {
    strengths.push(
      `${actionCompletionRate}% of school liaison actions completed -- the home follows through reliably on agreed educational actions.`,
    );
  } else if (actionCompletionRate >= 70 && totalActionsAgreed > 0) {
    strengths.push(
      `${actionCompletionRate}% of school liaison actions completed -- good follow-through on educational commitments.`,
    );
  }

  if (pepUpToDateRate >= 90 && totalLiaisonRecords > 0) {
    strengths.push(
      `${pepUpToDateRate}% of PEPs reported as up to date -- Personal Education Plans are being maintained to support children's educational progress.`,
    );
  }

  if (followUpCompletionRate >= 90 && followUpRequired > 0) {
    strengths.push(
      `${followUpCompletionRate}% of school liaison follow-ups completed on time -- the home is proactive in ensuring continuity of educational support.`,
    );
  }

  if (liaisonChildVoiceRate >= 80 && totalLiaisonRecords > 0) {
    strengths.push(
      `Child voice included in ${liaisonChildVoiceRate}% of school liaison activities -- children's views are shaping educational decisions and planning.`,
    );
  } else if (liaisonChildVoiceRate >= 60 && totalLiaisonRecords > 0) {
    strengths.push(
      `Child voice included in ${liaisonChildVoiceRate}% of school liaison activities -- good practice in consulting children about their education.`,
    );
  }

  if (childEngagementRate >= 90 && engagementDenominator > 0) {
    strengths.push(
      `${childEngagementRate}% overall child engagement rate across homework, tutoring, and resource use -- children are actively invested in their education.`,
    );
  } else if (childEngagementRate >= 70 && engagementDenominator > 0) {
    strengths.push(
      `${childEngagementRate}% overall child engagement rate -- most children are actively participating in educational activities.`,
    );
  }

  // -- Concerns -------------------------------------------------------------

  const concerns: string[] = [];

  if (homeworkCompletionRate < 40 && homeworkSet > 0) {
    concerns.push(
      `Only ${homeworkCompletionRate}% homework completion rate -- the majority of homework set by schools is not being completed, which will directly impact children's academic progress and attainment.`,
    );
  } else if (homeworkCompletionRate < 70 && homeworkCompletionRate >= 40 && homeworkSet > 0) {
    concerns.push(
      `Homework completion rate at ${homeworkCompletionRate}% -- a significant proportion of homework is not being completed, risking children falling behind academically.`,
    );
  }

  if (staffSupportRate < 50 && totalHomeworkRecords > 0) {
    concerns.push(
      `Staff support provided in only ${staffSupportRate}% of homework sessions -- children are not receiving sufficient adult support to complete their schoolwork.`,
    );
  }

  if (homeworkBarrierRate >= 30 && totalHomeworkRecords > 0) {
    concerns.push(
      `Barriers encountered in ${homeworkBarrierRate}% of homework sessions -- persistent obstacles are preventing children from completing their schoolwork.`,
    );
  }

  if (homeworkEngagementRate < 50 && totalHomeworkRecords > 0) {
    concerns.push(
      `Only ${homeworkEngagementRate}% child engagement during homework -- children are disengaged from their learning at home, which may indicate poor study environments, lack of motivation, or insufficient support.`,
    );
  }

  if (studyEnvironmentQualityRate < 40 && totalStudyEnvRecords > 0) {
    concerns.push(
      `Only ${studyEnvironmentQualityRate}% of study environments rated good or excellent -- the home is failing to provide adequate learning spaces for children.`,
    );
  } else if (studyEnvironmentQualityRate < 70 && studyEnvironmentQualityRate >= 40 && totalStudyEnvRecords > 0) {
    concerns.push(
      `Study environment quality at ${studyEnvironmentQualityRate}% -- not all children have access to suitable study spaces.`,
    );
  }

  if (quietSpaceRate < 50 && totalStudyEnvRecords > 0) {
    concerns.push(
      `Quiet study space available in only ${quietSpaceRate}% of assessments -- children lack the calm environments needed to focus on their learning.`,
    );
  }

  if (envSatisfactionAvg < 3.0 && totalStudyEnvRecords > 0) {
    concerns.push(
      `Children's satisfaction with study environments averages only ${envSatisfactionAvg}/5 -- children do not feel their learning spaces are adequate.`,
    );
  }

  if (tutoringAttendanceRate < 50 && tutoringPlanned > 0) {
    concerns.push(
      `Only ${tutoringAttendanceRate}% tutoring session attendance -- the majority of planned tutoring is not being attended, denying children additional academic support.`,
    );
  } else if (tutoringAttendanceRate < 70 && tutoringAttendanceRate >= 50 && tutoringPlanned > 0) {
    concerns.push(
      `Tutoring attendance at ${tutoringAttendanceRate}% -- some planned tutoring sessions are being missed.`,
    );
  }

  if (tutoringProgressRate < 50 && totalTutoringRecords > 0) {
    concerns.push(
      `Progress noted in only ${tutoringProgressRate}% of tutoring sessions -- tutoring is not delivering measurable academic improvement.`,
    );
  }

  if (resourceFulfilmentRate < 50 && resourcesRequested > 0) {
    concerns.push(
      `Only ${resourceFulfilmentRate}% of requested educational resources provided -- children are being denied materials they need for their education.`,
    );
  } else if (resourceFulfilmentRate < 70 && resourceFulfilmentRate >= 50 && resourcesRequested > 0) {
    concerns.push(
      `Resource fulfilment at ${resourceFulfilmentRate}% -- not all educational resource requests are being met.`,
    );
  }

  if (resourceUsageRate < 50 && totalResourceRecords > 0) {
    concerns.push(
      `Only ${resourceUsageRate}% of educational resources actively used by children -- resources may not be well-matched to children's needs or interests.`,
    );
  }

  if (staffAttendanceRate < 50 && totalLiaisonRecords > 0) {
    concerns.push(
      `Staff attend only ${staffAttendanceRate}% of school liaison activities -- the home is not adequately engaging with children's schools to support academic progress.`,
    );
  } else if (staffAttendanceRate < 70 && staffAttendanceRate >= 50 && totalLiaisonRecords > 0) {
    concerns.push(
      `Staff attendance at school liaison activities at ${staffAttendanceRate}% -- attendance at school meetings needs to improve.`,
    );
  }

  if (actionCompletionRate < 50 && totalActionsAgreed > 0) {
    concerns.push(
      `Only ${actionCompletionRate}% of school liaison actions completed -- the home is not following through on agreed educational support actions.`,
    );
  }

  if (pepUpToDateRate < 50 && totalLiaisonRecords > 0) {
    concerns.push(
      `Only ${pepUpToDateRate}% of PEPs reported as up to date -- Personal Education Plans are not being maintained, which means children's educational needs may not be properly planned for.`,
    );
  } else if (pepUpToDateRate < 70 && pepUpToDateRate >= 50 && totalLiaisonRecords > 0) {
    concerns.push(
      `PEP up-to-date rate at ${pepUpToDateRate}% -- some Personal Education Plans need reviewing and updating.`,
    );
  }

  if (liaisonChildVoiceRate < 50 && totalLiaisonRecords > 0) {
    concerns.push(
      `Child voice included in only ${liaisonChildVoiceRate}% of school liaison activities -- children's views are not sufficiently shaping educational decisions.`,
    );
  }

  if (childEngagementRate < 30 && engagementDenominator > 0) {
    concerns.push(
      `Overall child engagement at only ${childEngagementRate}% -- children are largely disengaged from educational activities at home, which represents a serious concern for academic outcomes.`,
    );
  } else if (childEngagementRate < 50 && childEngagementRate >= 30 && engagementDenominator > 0) {
    concerns.push(
      `Overall child engagement at ${childEngagementRate}% -- many children are not actively participating in educational activities.`,
    );
  }

  if (schoolLiaisonRate < 40 && totalLiaisonRecords > 0) {
    concerns.push(
      `School liaison rate at only ${schoolLiaisonRate}% -- the home is not maintaining effective relationships with schools to support children's education.`,
    );
  }

  if (totalHomeworkRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No homework support records despite children being on placement -- the home may not be monitoring or supporting children's homework completion.",
    );
  }

  if (totalLiaisonRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No school liaison records -- the home has not documented any contact with children's schools regarding academic progress, attendance, or additional support needs.",
    );
  }

  // -- Recommendations ------------------------------------------------------

  const recommendations: AcademicSupportRecommendation[] = [];
  let rank = 0;

  if (homeworkCompletionRate < 40 && homeworkSet > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently review homework support arrangements -- assign dedicated staff to support each child with homework, establish protected homework time each day, and identify and remove barriers to completion. Every child must receive the support they need to complete schoolwork.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 8 -- Education",
    });
  }

  if (studyEnvironmentQualityRate < 40 && totalStudyEnvRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Immediately improve study environments -- ensure every child has access to a quiet, well-lit desk space with study materials and internet access. Protect study time from interruptions and distractions.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 8 -- Education",
    });
  }

  if (schoolLiaisonRate < 40 && totalLiaisonRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Establish regular, structured school liaison for every child -- attend all parents' evenings, PEP meetings, and school events. Agree clear actions with schools and follow through. Maintain up-to-date PEPs for every child.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 8 -- Education",
    });
  }

  if (childEngagementRate < 30 && engagementDenominator > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Address the very low child engagement rate by working with each child to understand their barriers to learning, adapting support to their individual needs, and creating a positive learning culture in the home.",
      urgency: "immediate",
      regulatory_ref: "SCCIF -- Experiences and progress of children",
    });
  }

  if (pepUpToDateRate < 50 && totalLiaisonRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all Personal Education Plans are up to date -- PEPs must be reviewed termly with the school, the child, and the designated teacher. Set calendar reminders for all PEP review dates.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 8 -- Education",
    });
  }

  if (liaisonChildVoiceRate < 50 && totalLiaisonRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Include children's voices in all school liaison activities -- consult each child before meetings about what they want discussed, involve them in PEP reviews where appropriate, and feed back outcomes.",
      urgency: "immediate",
      regulatory_ref: "SCCIF -- Experiences and progress of children",
    });
  }

  if (homeworkCompletionRate >= 40 && homeworkCompletionRate < 70 && homeworkSet > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve homework completion rate to at least 70% -- review the homework support structure, ensure staff have the subject knowledge or resources to help, and consider whether additional tutoring is needed for children who are struggling.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 8 -- Education",
    });
  }

  if (staffSupportRate < 50 && totalHomeworkRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase staff involvement in homework support -- allocate named staff members to support specific children with homework and ensure staffing rotas allow adequate time for educational support.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 -- Quality of care standard",
    });
  }

  if (studyEnvironmentQualityRate >= 40 && studyEnvironmentQualityRate < 70 && totalStudyEnvRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Enhance study environments to achieve at least 70% good/excellent ratings -- focus on noise reduction, improved lighting, desk provision, and ensuring study materials are readily available.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 8 -- Education",
    });
  }

  if (tutoringAttendanceRate < 50 && tutoringPlanned > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Investigate and address low tutoring attendance -- speak with children about barriers, review scheduling, and consider whether tutor matching or session format needs adjusting to improve take-up.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 8 -- Education",
    });
  }

  if (curriculumAlignmentRate < 50 && totalTutoringRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure tutoring sessions are linked to the school curriculum -- share school timetables and upcoming topics with tutors so sessions reinforce classroom learning.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 8 -- Education",
    });
  }

  if (resourceFulfilmentRate < 50 && resourcesRequested > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review educational resource provision -- allocate dedicated budget for each child's educational resources and establish a process for prompt fulfilment of resource requests.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 8 -- Education",
    });
  }

  if (actionCompletionRate < 50 && totalActionsAgreed > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement a tracking system for school liaison actions -- assign named staff to each action, set deadlines, and review progress weekly to ensure follow-through.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 8 -- Education",
    });
  }

  if (followUpCompletionRate < 50 && followUpRequired > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all school liaison follow-ups are completed by their scheduled dates -- use a diary system and designate a staff member responsible for tracking and completing follow-up actions.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 8 -- Education",
    });
  }

  if (tutoringProgressRate < 50 && totalTutoringRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review tutoring effectiveness -- if progress is not being noted, consider changing tutors, adjusting session content, or seeking specialist assessment to identify learning barriers.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 8 -- Education",
    });
  }

  if (homeworkBarrierRate >= 30 && totalHomeworkRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Conduct a homework barriers analysis -- identify recurring obstacles (e.g. missing materials, lack of understanding, competing activities) and develop targeted strategies to remove them.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 8 -- Education",
    });
  }

  if (tutoringAttendanceRate >= 50 && tutoringAttendanceRate < 70 && tutoringPlanned > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve tutoring attendance to at least 70% -- consider flexible scheduling, child-choice in tutor selection, and celebrating tutoring achievements to boost motivation.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 8 -- Education",
    });
  }

  if (staffAttendanceRate >= 50 && staffAttendanceRate < 70 && totalLiaisonRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure staff attendance at school liaison activities reaches at least 70% -- build school liaison into staffing rotas as a protected activity.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 8 -- Education",
    });
  }

  if (childEngagementRate >= 30 && childEngagementRate < 50 && engagementDenominator > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Develop strategies to improve child engagement with educational activities -- use reward systems, child-choice in learning approaches, and celebrate academic achievements to build a positive learning culture.",
      urgency: "planned",
      regulatory_ref: "SCCIF -- Experiences and progress of children",
    });
  }

  if (pepUpToDateRate >= 50 && pepUpToDateRate < 70 && totalLiaisonRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Bring all PEPs up to date and establish a termly review cycle with schools, children, and the Virtual School Head where appropriate.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 8 -- Education",
    });
  }

  if (totalHomeworkRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement daily homework recording for all children -- staff should log homework set, support provided, barriers encountered, and completion outcomes.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 8 -- Education",
    });
  }

  if (totalLiaisonRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Establish a structured school liaison programme -- maintain regular contact with each child's school, attend all meetings, and document academic progress discussions and agreed actions.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 8 -- Education",
    });
  }

  // -- Insights -------------------------------------------------------------

  const insights: AcademicSupportInsight[] = [];

  // --- Critical insights ---

  if (homeworkCompletionRate < 40 && homeworkSet > 0) {
    insights.push({
      text: `Only ${homeworkCompletionRate}% homework completion rate. Ofsted will view the failure to support homework completion as evidence that the home does not prioritise children's education -- a direct failure under Reg 8. Looked-after children already face educational disadvantage; poor homework support compounds this.`,
      severity: "critical",
    });
  }

  if (studyEnvironmentQualityRate < 40 && totalStudyEnvRecords > 0) {
    insights.push({
      text: `Only ${studyEnvironmentQualityRate}% of study environments rated good or excellent. Without suitable learning spaces, children cannot study effectively. Ofsted expects homes to provide environments that actively promote educational achievement.`,
      severity: "critical",
    });
  }

  if (schoolLiaisonRate < 40 && totalLiaisonRecords > 0) {
    insights.push({
      text: `School liaison rate at only ${schoolLiaisonRate}%. Effective home-school communication is essential for looked-after children. Without regular liaison, the home cannot respond to emerging academic needs, attendance concerns, or additional support requirements. This is a significant Reg 8 gap.`,
      severity: "critical",
    });
  }

  if (childEngagementRate < 30 && engagementDenominator > 0) {
    insights.push({
      text: `Overall child engagement at only ${childEngagementRate}%. When children are not engaged with educational activities at home, learning outcomes suffer. Ofsted expects homes to create a culture where education is valued and children are motivated to learn.`,
      severity: "critical",
    });
  }

  if (totalHomeworkRecords === 0 && totalLiaisonRecords === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No homework support or school liaison records despite children being on placement. Ofsted may interpret the absence of records as evidence that children's education is not a priority -- this is a significant omission under Reg 8.",
      severity: "critical",
    });
  }

  if (pepUpToDateRate < 50 && totalLiaisonRecords > 0) {
    insights.push({
      text: `Only ${pepUpToDateRate}% of PEPs up to date. The Personal Education Plan is the primary mechanism for tracking and planning looked-after children's educational progress. Out-of-date PEPs mean educational needs may not be identified or resourced.`,
      severity: "critical",
    });
  }

  // --- Warning insights ---

  if (homeworkCompletionRate >= 40 && homeworkCompletionRate < 70 && homeworkSet > 0) {
    insights.push({
      text: `Homework completion at ${homeworkCompletionRate}% -- improving but not yet at the level needed to ensure children keep pace academically. Each missed homework represents a gap in learning that accumulates over time.`,
      severity: "warning",
    });
  }

  if (studyEnvironmentQualityRate >= 40 && studyEnvironmentQualityRate < 70 && totalStudyEnvRecords > 0) {
    insights.push({
      text: `Study environment quality at ${studyEnvironmentQualityRate}% -- some children's learning spaces need improvement. Environmental factors such as noise, poor lighting, and lack of materials directly impact concentration and learning outcomes.`,
      severity: "warning",
    });
  }

  if (tutoringAttendanceRate >= 50 && tutoringAttendanceRate < 70 && tutoringPlanned > 0) {
    insights.push({
      text: `Tutoring attendance at ${tutoringAttendanceRate}% -- some sessions are being missed. Consider whether timing, tutor matching, or session format needs adjusting to improve engagement.`,
      severity: "warning",
    });
  }

  if (tutoringProgressRate >= 50 && tutoringProgressRate < 80 && totalTutoringRecords > 0) {
    insights.push({
      text: `Progress noted in ${tutoringProgressRate}% of tutoring sessions -- tutoring is contributing but not yet consistently delivering measurable improvement. Review whether sessions are sufficiently targeted to each child's learning gaps.`,
      severity: "warning",
    });
  }

  if (resourceFulfilmentRate >= 50 && resourceFulfilmentRate < 70 && resourcesRequested > 0) {
    insights.push({
      text: `Resource fulfilment at ${resourceFulfilmentRate}% -- some children's educational resource needs are unmet. Each unfulfilled request may represent a barrier to learning that could have been easily resolved.`,
      severity: "warning",
    });
  }

  if (staffAttendanceRate >= 50 && staffAttendanceRate < 70 && totalLiaisonRecords > 0) {
    insights.push({
      text: `Staff attendance at school liaison at ${staffAttendanceRate}% -- missed meetings mean missed opportunities to advocate for children's educational needs and stay informed about academic progress.`,
      severity: "warning",
    });
  }

  if (actionCompletionRate >= 50 && actionCompletionRate < 70 && totalActionsAgreed > 0) {
    insights.push({
      text: `School liaison action completion at ${actionCompletionRate}% -- incomplete actions undermine the home-school relationship and may leave gaps in children's educational support.`,
      severity: "warning",
    });
  }

  if (childEngagementRate >= 30 && childEngagementRate < 70 && engagementDenominator > 0) {
    insights.push({
      text: `Child engagement at ${childEngagementRate}% -- not all children are fully invested in educational activities at home. Building a positive learning culture requires consistent encouragement, appropriate challenge, and celebrating achievements.`,
      severity: "warning",
    });
  }

  if (homeworkBarrierRate >= 30 && totalHomeworkRecords > 0) {
    insights.push({
      text: `Barriers encountered in ${homeworkBarrierRate}% of homework sessions -- recurring obstacles need systematic identification and resolution. Common barriers for looked-after children include prior educational disruption, undiagnosed learning needs, and emotional dysregulation.`,
      severity: "warning",
    });
  }

  // --- Subject diversity insight ---
  const homeworkSubjects = new Set(
    homework_support_records.map((r) => r.subject).filter((s) => s),
  );
  const tutoringSubjects = new Set(
    tutoring_records.map((r) => r.subject).filter((s) => s),
  );
  const allSubjects = new Set([...homeworkSubjects, ...tutoringSubjects]);
  if (allSubjects.size >= 5) {
    insights.push({
      text: `Academic support spans ${allSubjects.size} distinct subjects -- the home provides broad educational support across the curriculum. This breadth requires staff with diverse subject knowledge or access to specialist tutors.`,
      severity: "warning",
    });
  }

  // --- Positive insights ---

  if (academic_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding homework and academic support -- children's education is prioritised, study environments are excellent, tutoring is effective, resources are available, and school liaison is proactive. This is strong evidence for Reg 8 compliance and a genuine commitment to educational outcomes.",
      severity: "positive",
    });
  }

  if (homeworkCompletionRate >= 90 && staffSupportRate >= 90 && homeworkSet > 0 && totalHomeworkRecords > 0) {
    insights.push({
      text: `${homeworkCompletionRate}% homework completion with ${staffSupportRate}% staff support -- the home provides exceptional homework support. Staff are consistently available and effective in helping children complete their schoolwork.`,
      severity: "positive",
    });
  }

  if (studyEnvironmentQualityRate >= 90 && envSatisfactionAvg >= 4.0 && totalStudyEnvRecords > 0) {
    insights.push({
      text: `${studyEnvironmentQualityRate}% study environment quality with child satisfaction averaging ${envSatisfactionAvg}/5 -- children have access to excellent learning spaces and feel these support their education well. This creates optimal conditions for academic achievement.`,
      severity: "positive",
    });
  }

  if (tutoringAttendanceRate >= 90 && tutoringProgressRate >= 80 && tutoringPlanned > 0 && totalTutoringRecords > 0) {
    insights.push({
      text: `${tutoringAttendanceRate}% tutoring attendance with progress noted in ${tutoringProgressRate}% of sessions -- tutoring is well-attended and delivering measurable academic improvement. This represents excellent value and genuine educational impact.`,
      severity: "positive",
    });
  }

  if (resourceAvailabilityRate >= 90 && totalResourceRecords > 0) {
    insights.push({
      text: `Resource availability rate at ${resourceAvailabilityRate}% -- children have access to the educational materials they need. Resources are provided, age-appropriate, and actively used for learning.`,
      severity: "positive",
    });
  }

  if (schoolLiaisonRate >= 90 && pepUpToDateRate >= 90 && totalLiaisonRecords > 0) {
    insights.push({
      text: `School liaison rate at ${schoolLiaisonRate}% with ${pepUpToDateRate}% PEPs up to date -- the home maintains exemplary relationships with schools and ensures educational planning is current and effective. This proactive approach ensures children's academic needs are identified and met.`,
      severity: "positive",
    });
  }

  if (childEngagementRate >= 90 && engagementDenominator > 0) {
    insights.push({
      text: `${childEngagementRate}% overall child engagement -- children are actively invested in their education at home. This reflects a positive learning culture where education is valued and children feel motivated to succeed.`,
      severity: "positive",
    });
  }

  if (actionCompletionRate >= 90 && totalActionsAgreed > 0) {
    insights.push({
      text: `${actionCompletionRate}% of school liaison actions completed -- the home demonstrates exceptional follow-through on educational commitments. Schools can rely on the home to deliver agreed support, strengthening the partnership.`,
      severity: "positive",
    });
  }

  if (liaisonChildVoiceRate >= 80 && totalLiaisonRecords > 0) {
    insights.push({
      text: `Child voice included in ${liaisonChildVoiceRate}% of school liaison activities -- children's educational preferences and concerns genuinely shape the home's approach to supporting their learning. This is exemplary practice in empowering children.`,
      severity: "positive",
    });
  }

  // -- Headline -------------------------------------------------------------

  let headline: string;

  if (academic_rating === "outstanding") {
    headline =
      "Outstanding homework and academic support -- children's education is actively prioritised with excellent study environments, effective tutoring, and strong school liaison.";
  } else if (academic_rating === "good") {
    headline = `Good homework and academic support -- ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (academic_rating === "adequate") {
    headline = `Adequate homework and academic support -- ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure children's educational needs are fully met.`;
  } else {
    headline = `Homework and academic support is inadequate -- ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to ensure children's education is properly supported.`;
  }

  // -- Return ---------------------------------------------------------------

  return {
    academic_rating,
    academic_score: score,
    headline,
    homework_completion_rate: homeworkCompletionRate,
    study_environment_quality_rate: studyEnvironmentQualityRate,
    tutoring_coverage_rate: tutoringCoverageRate,
    resource_availability_rate: resourceAvailabilityRate,
    school_liaison_rate: schoolLiaisonRate,
    child_engagement_rate: childEngagementRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
