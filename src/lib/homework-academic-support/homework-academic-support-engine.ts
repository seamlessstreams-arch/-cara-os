// ==============================================================================
// HOMEWORK & ACADEMIC SUPPORT INTELLIGENCE ENGINE
//
// Pure deterministic engine for evaluating homework completion support,
// academic intervention quality, educational resource provision, and staff
// support for looked-after children's education.
//
// Regulatory basis:
//   - CHR 2015, Reg 8  -- Promotion of educational achievement
//   - CHR 2015, Reg 10 -- Health & education record keeping
//   - SCCIF            -- Impact of leaders on education outcomes
//   - SEN Code of Practice 2015 -- Support for special educational needs
//   - UNCRC Article 28 -- Right to education
//   - UNCRC Article 29 -- Education developing the child's fullest potential
//   - Children Act 1989 -- Duty to promote educational achievement of LAC
//
// No AI. No external calls. Pure input -> output.
// ==============================================================================

import { withinPeriod } from "@/lib/date-period";

// -- Types --------------------------------------------------------------------

export type SubjectArea =
  | "english"
  | "maths"
  | "science"
  | "humanities"
  | "languages"
  | "creative_arts"
  | "technology"
  | "pe"
  | "other";

export type CompletionStatus =
  | "completed"
  | "partially_completed"
  | "not_completed"
  | "not_set"
  | "excused";

export type SupportType =
  | "staff_help"
  | "tutor"
  | "peer_support"
  | "online_resource"
  | "quiet_space"
  | "additional_time"
  | "none";

export type AcademicProgress =
  | "above_expected"
  | "at_expected"
  | "below_expected"
  | "significantly_below"
  | "not_assessed";

export type Rating = "outstanding" | "good" | "requires_improvement" | "inadequate";

// -- Core Interfaces ----------------------------------------------------------

export interface HomeworkRecord {
  id: string;
  childId: string;
  childName: string;
  date: string; // ISO date
  subject: SubjectArea;
  completionStatus: CompletionStatus;
  supportProvided: SupportType[];
  timeSpentMinutes: number;
  staffSupporter?: string;
  difficultyEncountered: boolean;
  schoolFeedbackPositive?: boolean;
}

export interface AcademicIntervention {
  id: string;
  childId: string;
  childName: string;
  interventionType:
    | "tutoring"
    | "mentoring"
    | "sen_support"
    | "reading_programme"
    | "catchup_programme"
    | "exam_preparation";
  startDate: string; // ISO date
  provider: string;
  sessionsPlanned: number;
  sessionsAttended: number;
  progressMade: AcademicProgress;
  pepLinked: boolean;
}

export interface EducationalResource {
  id: string;
  resourceType:
    | "quiet_study_area"
    | "computer_access"
    | "books_library"
    | "stationery"
    | "internet_access"
    | "specialist_software"
    | "tutor_access";
  available: boolean;
  lastChecked: string; // ISO date
  adequateForNeeds: boolean;
}

export interface StaffEducationTraining {
  id: string;
  staffId: string;
  staffName: string;
  homeworkSupportTrained: boolean;
  pepAwareness: boolean;
  senAwareness: boolean;
  educationAdvocacy: boolean;
  examSupportTrained: boolean;
  attachmentAwareEducation: boolean;
}

// -- Result Interfaces --------------------------------------------------------

export interface HomeworkCompletionResult {
  totalRecords: number;
  completedCount: number;
  completionRate: number;
  supportProvidedCount: number;
  supportProvidedRate: number;
  schoolFeedbackPositiveCount: number;
  schoolFeedbackRate: number;
  subjectsCovered: number;
  totalSubjects: number;
  subjectCoverageRate: number;
  completionBreakdown: Record<CompletionStatus, number>;
  subjectBreakdown: Record<SubjectArea, number>;
  averageTimeMinutes: number;
  difficultyEncounteredCount: number;
  difficultyRate: number;
  score: number; // 0-25
  strengths: string[];
  concerns: string[];
}

export interface AcademicInterventionResult {
  totalInterventions: number;
  averageAttendanceRate: number;
  progressiveCount: number;
  progressRate: number;
  pepLinkedCount: number;
  pepLinkedRate: number;
  interventionTypesUsed: number;
  totalInterventionTypes: number;
  interventionVarietyRate: number;
  attendanceBreakdown: { planned: number; attended: number };
  progressBreakdown: Record<AcademicProgress, number>;
  typeBreakdown: Record<string, number>;
  score: number; // 0-25
  strengths: string[];
  concerns: string[];
}

export interface ResourceProvisionResult {
  totalResources: number;
  availableCount: number;
  availabilityRate: number;
  adequateCount: number;
  adequacyRate: number;
  resourceTypesPresent: number;
  totalResourceTypes: number;
  resourceVarietyRate: number;
  resourceBreakdown: Record<string, { available: boolean; adequate: boolean }>;
  score: number; // 0-25
  strengths: string[];
  concerns: string[];
}

export interface StaffEducationReadinessResult {
  totalStaff: number;
  homeworkSupportCount: number;
  homeworkSupportRate: number;
  pepAwarenessCount: number;
  pepAwarenessRate: number;
  senAwarenessCount: number;
  senAwarenessRate: number;
  educationAdvocacyCount: number;
  educationAdvocacyRate: number;
  examSupportCount: number;
  examSupportRate: number;
  attachmentAwareCount: number;
  attachmentAwareRate: number;
  fullyTrainedCount: number;
  fullyTrainedRate: number;
  score: number; // 0-25
  strengths: string[];
  concerns: string[];
}

export interface ChildAcademicProfile {
  childId: string;
  childName: string;
  homeworkRecords: number;
  completionRate: number;
  supportReceived: boolean;
  difficultyRate: number;
  interventionCount: number;
  bestProgress: AcademicProgress | null;
  educationScore: number; // 0-10
}

export interface HomeworkAcademicSupportIntelligence {
  homeId: string;
  assessedAt: string;
  periodStart: string;
  periodEnd: string;

  overallScore: number; // 0-100
  rating: Rating;

  homeworkCompletion: HomeworkCompletionResult;
  academicInterventions: AcademicInterventionResult;
  resourceProvision: ResourceProvisionResult;
  staffEducationReadiness: StaffEducationReadinessResult;

  childProfiles: ChildAcademicProfile[];

  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// -- Helpers ------------------------------------------------------------------

function pct(num: number, den: number): number {
  if (den === 0) return 0;
  return Math.round((num / den) * 100);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function getRating(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// -- Label Maps & Getters -----------------------------------------------------

const SUBJECT_LABELS: Record<SubjectArea, string> = {
  english: "English",
  maths: "Maths",
  science: "Science",
  humanities: "Humanities",
  languages: "Languages",
  creative_arts: "Creative Arts",
  technology: "Technology",
  pe: "PE",
  other: "Other",
};

const COMPLETION_LABELS: Record<CompletionStatus, string> = {
  completed: "Completed",
  partially_completed: "Partially Completed",
  not_completed: "Not Completed",
  not_set: "Not Set",
  excused: "Excused",
};

const SUPPORT_LABELS: Record<SupportType, string> = {
  staff_help: "Staff Help",
  tutor: "Tutor",
  peer_support: "Peer Support",
  online_resource: "Online Resource",
  quiet_space: "Quiet Space",
  additional_time: "Additional Time",
  none: "None",
};

const PROGRESS_LABELS: Record<AcademicProgress, string> = {
  above_expected: "Above Expected",
  at_expected: "At Expected",
  below_expected: "Below Expected",
  significantly_below: "Significantly Below",
  not_assessed: "Not Assessed",
};

const RATING_LABELS: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

const RESOURCE_LABELS: Record<string, string> = {
  quiet_study_area: "Quiet Study Area",
  computer_access: "Computer Access",
  books_library: "Books / Library",
  stationery: "Stationery",
  internet_access: "Internet Access",
  specialist_software: "Specialist Software",
  tutor_access: "Tutor Access",
};

const INTERVENTION_TYPE_LABELS: Record<string, string> = {
  tutoring: "Tutoring",
  mentoring: "Mentoring",
  sen_support: "SEN Support",
  reading_programme: "Reading Programme",
  catchup_programme: "Catch-up Programme",
  exam_preparation: "Exam Preparation",
};

export function getSubjectLabel(subject: SubjectArea): string {
  return SUBJECT_LABELS[subject];
}

export function getCompletionLabel(status: CompletionStatus): string {
  return COMPLETION_LABELS[status];
}

export function getSupportLabel(support: SupportType): string {
  return SUPPORT_LABELS[support];
}

export function getProgressLabel(progress: AcademicProgress): string {
  return PROGRESS_LABELS[progress];
}

export function getRatingLabel(rating: Rating): string {
  return RATING_LABELS[rating];
}

export function getResourceLabel(type: string): string {
  return RESOURCE_LABELS[type] ?? type;
}

export function getInterventionTypeLabel(type: string): string {
  return INTERVENTION_TYPE_LABELS[type] ?? type;
}

// -- Constants ----------------------------------------------------------------

const ALL_SUBJECTS: SubjectArea[] = [
  "english", "maths", "science", "humanities", "languages",
  "creative_arts", "technology", "pe", "other",
];

const ALL_RESOURCE_TYPES = [
  "quiet_study_area", "computer_access", "books_library", "stationery",
  "internet_access", "specialist_software", "tutor_access",
];

const ALL_INTERVENTION_TYPES = [
  "tutoring", "mentoring", "sen_support", "reading_programme",
  "catchup_programme", "exam_preparation",
];

// ==============================================================================
// EVALUATOR 1: Homework Completion (0-25)
// ==============================================================================

export function evaluateHomeworkCompletion(
  records: HomeworkRecord[],
): HomeworkCompletionResult {
  const totalRecords = records.length;

  if (totalRecords === 0) {
    return {
      totalRecords: 0,
      completedCount: 0,
      completionRate: 0,
      supportProvidedCount: 0,
      supportProvidedRate: 0,
      schoolFeedbackPositiveCount: 0,
      schoolFeedbackRate: 0,
      subjectsCovered: 0,
      totalSubjects: ALL_SUBJECTS.length,
      subjectCoverageRate: 0,
      completionBreakdown: {
        completed: 0, partially_completed: 0, not_completed: 0,
        not_set: 0, excused: 0,
      },
      subjectBreakdown: {
        english: 0, maths: 0, science: 0, humanities: 0, languages: 0,
        creative_arts: 0, technology: 0, pe: 0, other: 0,
      },
      averageTimeMinutes: 0,
      difficultyEncounteredCount: 0,
      difficultyRate: 0,
      score: 0,
      strengths: [],
      concerns: ["No homework records available — unable to assess homework completion support"],
    };
  }

  // Completion
  const completedCount = records.filter(
    (r) => r.completionStatus === "completed",
  ).length;
  const completionRate = pct(completedCount, totalRecords);

  // Support provided (records where at least one non-"none" support was given)
  const supportProvidedCount = records.filter(
    (r) => r.supportProvided.length > 0 && r.supportProvided.some((s) => s !== "none"),
  ).length;
  const supportProvidedRate = pct(supportProvidedCount, totalRecords);

  // School feedback
  const recordsWithFeedback = records.filter((r) => r.schoolFeedbackPositive !== undefined);
  const schoolFeedbackPositiveCount = recordsWithFeedback.filter(
    (r) => r.schoolFeedbackPositive === true,
  ).length;
  const schoolFeedbackRate = pct(schoolFeedbackPositiveCount, recordsWithFeedback.length);

  // Subject coverage
  const subjectBreakdown: Record<SubjectArea, number> = {
    english: 0, maths: 0, science: 0, humanities: 0, languages: 0,
    creative_arts: 0, technology: 0, pe: 0, other: 0,
  };
  for (const r of records) {
    subjectBreakdown[r.subject]++;
  }
  const subjectsCovered = Object.values(subjectBreakdown).filter((v) => v > 0).length;
  const subjectCoverageRate = pct(subjectsCovered, ALL_SUBJECTS.length);

  // Completion breakdown
  const completionBreakdown: Record<CompletionStatus, number> = {
    completed: 0, partially_completed: 0, not_completed: 0,
    not_set: 0, excused: 0,
  };
  for (const r of records) {
    completionBreakdown[r.completionStatus]++;
  }

  // Average time
  const totalTime = records.reduce((sum, r) => sum + r.timeSpentMinutes, 0);
  const averageTimeMinutes = Math.round((totalTime / totalRecords) * 10) / 10;

  // Difficulty
  const difficultyEncounteredCount = records.filter((r) => r.difficultyEncountered).length;
  const difficultyRate = pct(difficultyEncounteredCount, totalRecords);

  // Score (out of 25)
  let score = 0;
  // Completion rate: max 8
  score += (completionRate / 100) * 8;
  // Support provided rate: max 7
  score += (supportProvidedRate / 100) * 7;
  // School feedback rate: max 5
  score += (schoolFeedbackRate / 100) * 5;
  // Subject coverage: max 5
  score += (subjectCoverageRate / 100) * 5;

  score = clamp(Math.round(score * 10) / 10, 0, 25);

  // Insights
  const strengths: string[] = [];
  const concerns: string[] = [];

  if (completionRate >= 90) {
    strengths.push("Excellent homework completion rate: " + completionRate + "% of homework tasks completed");
  } else if (completionRate < 60) {
    concerns.push("Homework completion rate at " + completionRate + "% — below 60% threshold, children may need additional support");
  }

  if (supportProvidedRate >= 80) {
    strengths.push("Strong support provision: " + supportProvidedRate + "% of homework sessions had active support");
  } else if (supportProvidedRate < 50) {
    concerns.push("Support provision at " + supportProvidedRate + "% — over half of homework sessions lacked active support");
  }

  if (schoolFeedbackRate >= 80 && recordsWithFeedback.length > 0) {
    strengths.push("Positive school feedback received for " + schoolFeedbackRate + "% of homework submissions");
  } else if (schoolFeedbackRate < 50 && recordsWithFeedback.length > 0) {
    concerns.push("Positive school feedback at only " + schoolFeedbackRate + "% — quality of homework support may need review");
  }

  if (subjectsCovered >= 6) {
    strengths.push("Good subject coverage: " + subjectsCovered + " of " + ALL_SUBJECTS.length + " subjects covered across homework records");
  } else if (subjectsCovered <= 2) {
    concerns.push("Only " + subjectsCovered + " subject(s) covered in homework records — broader academic support needed");
  }

  if (difficultyRate > 50) {
    concerns.push("Difficulty encountered in " + difficultyRate + "% of homework sessions — additional learning support may be needed");
  }

  return {
    totalRecords,
    completedCount,
    completionRate,
    supportProvidedCount,
    supportProvidedRate,
    schoolFeedbackPositiveCount,
    schoolFeedbackRate,
    subjectsCovered,
    totalSubjects: ALL_SUBJECTS.length,
    subjectCoverageRate,
    completionBreakdown,
    subjectBreakdown,
    averageTimeMinutes,
    difficultyEncounteredCount,
    difficultyRate,
    score,
    strengths,
    concerns,
  };
}

// ==============================================================================
// EVALUATOR 2: Academic Interventions (0-25)
// ==============================================================================

export function evaluateAcademicInterventions(
  interventions: AcademicIntervention[],
): AcademicInterventionResult {
  const totalInterventions = interventions.length;

  if (totalInterventions === 0) {
    return {
      totalInterventions: 0,
      averageAttendanceRate: 0,
      progressiveCount: 0,
      progressRate: 0,
      pepLinkedCount: 0,
      pepLinkedRate: 0,
      interventionTypesUsed: 0,
      totalInterventionTypes: ALL_INTERVENTION_TYPES.length,
      interventionVarietyRate: 0,
      attendanceBreakdown: { planned: 0, attended: 0 },
      progressBreakdown: {
        above_expected: 0, at_expected: 0, below_expected: 0,
        significantly_below: 0, not_assessed: 0,
      },
      typeBreakdown: {},
      score: 0,
      strengths: [],
      concerns: ["No academic interventions recorded — children may not be receiving targeted educational support"],
    };
  }

  // Attendance
  const totalPlanned = interventions.reduce((sum, i) => sum + i.sessionsPlanned, 0);
  const totalAttended = interventions.reduce((sum, i) => sum + i.sessionsAttended, 0);
  const averageAttendanceRate = pct(totalAttended, totalPlanned);

  // Progress (above_expected or at_expected = progressive)
  const progressBreakdown: Record<AcademicProgress, number> = {
    above_expected: 0, at_expected: 0, below_expected: 0,
    significantly_below: 0, not_assessed: 0,
  };
  for (const i of interventions) {
    progressBreakdown[i.progressMade]++;
  }
  const progressiveCount =
    progressBreakdown.above_expected + progressBreakdown.at_expected;
  const progressRate = pct(progressiveCount, totalInterventions);

  // PEP linked
  const pepLinkedCount = interventions.filter((i) => i.pepLinked).length;
  const pepLinkedRate = pct(pepLinkedCount, totalInterventions);

  // Intervention variety
  const typeBreakdown: Record<string, number> = {};
  for (const i of interventions) {
    typeBreakdown[i.interventionType] = (typeBreakdown[i.interventionType] || 0) + 1;
  }
  const interventionTypesUsed = Object.keys(typeBreakdown).length;
  const interventionVarietyRate = pct(interventionTypesUsed, ALL_INTERVENTION_TYPES.length);

  // Score (out of 25)
  let score = 0;
  // Attendance rate: max 7
  score += (averageAttendanceRate / 100) * 7;
  // Progress rate: max 7
  score += (progressRate / 100) * 7;
  // PEP linked rate: max 6
  score += (pepLinkedRate / 100) * 6;
  // Intervention variety: max 5
  score += (interventionVarietyRate / 100) * 5;

  score = clamp(Math.round(score * 10) / 10, 0, 25);

  // Insights
  const strengths: string[] = [];
  const concerns: string[] = [];

  if (averageAttendanceRate >= 90) {
    strengths.push("Excellent intervention attendance: " + averageAttendanceRate + "% of planned sessions attended");
  } else if (averageAttendanceRate < 70) {
    concerns.push("Intervention attendance at " + averageAttendanceRate + "% — below 70% threshold, engagement may be an issue");
  }

  if (progressRate >= 80) {
    strengths.push("Strong academic progress: " + progressRate + "% of interventions showing expected or above progress");
  } else if (progressRate < 50) {
    concerns.push("Academic progress rate at " + progressRate + "% — majority of interventions not meeting expected progress");
  }

  if (pepLinkedRate >= 90) {
    strengths.push("Excellent PEP alignment: " + pepLinkedRate + "% of interventions linked to Personal Education Plans");
  } else if (pepLinkedRate < 70) {
    concerns.push("PEP linkage at " + pepLinkedRate + "% — interventions should be coordinated through Personal Education Plans (CHR 2015 Reg 8)");
  }

  if (interventionTypesUsed >= 4) {
    strengths.push("Diverse intervention approaches: " + interventionTypesUsed + " types used — tailored to individual needs");
  } else if (interventionTypesUsed <= 1) {
    concerns.push("Only " + interventionTypesUsed + " intervention type(s) used — limited range may not address diverse learning needs");
  }

  if (progressBreakdown.significantly_below > 0) {
    concerns.push(progressBreakdown.significantly_below + " intervention(s) showing significantly below expected progress — urgent review needed");
  }

  return {
    totalInterventions,
    averageAttendanceRate,
    progressiveCount,
    progressRate,
    pepLinkedCount,
    pepLinkedRate,
    interventionTypesUsed,
    totalInterventionTypes: ALL_INTERVENTION_TYPES.length,
    interventionVarietyRate,
    attendanceBreakdown: { planned: totalPlanned, attended: totalAttended },
    progressBreakdown,
    typeBreakdown,
    score,
    strengths,
    concerns,
  };
}

// ==============================================================================
// EVALUATOR 3: Resource Provision (0-25)
// ==============================================================================

export function evaluateResourceProvision(
  resources: EducationalResource[],
): ResourceProvisionResult {
  const totalResources = resources.length;

  if (totalResources === 0) {
    return {
      totalResources: 0,
      availableCount: 0,
      availabilityRate: 0,
      adequateCount: 0,
      adequacyRate: 0,
      resourceTypesPresent: 0,
      totalResourceTypes: ALL_RESOURCE_TYPES.length,
      resourceVarietyRate: 0,
      resourceBreakdown: {},
      score: 0,
      strengths: [],
      concerns: ["No educational resources recorded — unable to assess resource provision for children's education"],
    };
  }

  // Availability
  const availableCount = resources.filter((r) => r.available).length;
  const availabilityRate = pct(availableCount, totalResources);

  // Adequacy
  const adequateCount = resources.filter((r) => r.adequateForNeeds).length;
  const adequacyRate = pct(adequateCount, totalResources);

  // Resource variety
  const resourceTypesSet = new Set(resources.map((r) => r.resourceType));
  const resourceTypesPresent = resourceTypesSet.size;
  const resourceVarietyRate = pct(resourceTypesPresent, ALL_RESOURCE_TYPES.length);

  // Breakdown
  const resourceBreakdown: Record<string, { available: boolean; adequate: boolean }> = {};
  for (const r of resources) {
    resourceBreakdown[r.resourceType] = {
      available: r.available,
      adequate: r.adequateForNeeds,
    };
  }

  // Score (out of 25)
  let score = 0;
  // Availability rate: max 8
  score += (availabilityRate / 100) * 8;
  // Adequacy rate: max 8
  score += (adequacyRate / 100) * 8;
  // Resource variety: max 9
  score += (resourceVarietyRate / 100) * 9;

  score = clamp(Math.round(score * 10) / 10, 0, 25);

  // Insights
  const strengths: string[] = [];
  const concerns: string[] = [];

  if (availabilityRate >= 90) {
    strengths.push("Excellent resource availability: " + availabilityRate + "% of educational resources available");
  } else if (availabilityRate < 70) {
    concerns.push("Resource availability at " + availabilityRate + "% — children may lack essential learning materials");
  }

  if (adequacyRate >= 90) {
    strengths.push("Resources well-matched to needs: " + adequacyRate + "% rated adequate for children's needs");
  } else if (adequacyRate < 70) {
    concerns.push("Resource adequacy at " + adequacyRate + "% — existing resources may not meet children's educational needs");
  }

  if (resourceTypesPresent >= 6) {
    strengths.push("Comprehensive resource provision: " + resourceTypesPresent + " of " + ALL_RESOURCE_TYPES.length + " resource types available");
  } else if (resourceTypesPresent <= 3) {
    concerns.push("Only " + resourceTypesPresent + " resource type(s) available — children need access to diverse learning resources");
  }

  // Check for critical missing resources
  const criticalResources = ["computer_access", "internet_access", "quiet_study_area"];
  for (const critical of criticalResources) {
    const found = resources.find((r) => r.resourceType === critical);
    if (!found || !found.available) {
      concerns.push("Critical resource missing or unavailable: " + getResourceLabel(critical) + " — essential for homework completion");
    }
  }

  return {
    totalResources,
    availableCount,
    availabilityRate,
    adequateCount,
    adequacyRate,
    resourceTypesPresent,
    totalResourceTypes: ALL_RESOURCE_TYPES.length,
    resourceVarietyRate,
    resourceBreakdown,
    score,
    strengths,
    concerns,
  };
}

// ==============================================================================
// EVALUATOR 4: Staff Education Readiness (0-25)
// ==============================================================================

export function evaluateStaffEducationReadiness(
  training: StaffEducationTraining[],
): StaffEducationReadinessResult {
  const totalStaff = training.length;

  if (totalStaff === 0) {
    return {
      totalStaff: 0,
      homeworkSupportCount: 0,
      homeworkSupportRate: 0,
      pepAwarenessCount: 0,
      pepAwarenessRate: 0,
      senAwarenessCount: 0,
      senAwarenessRate: 0,
      educationAdvocacyCount: 0,
      educationAdvocacyRate: 0,
      examSupportCount: 0,
      examSupportRate: 0,
      attachmentAwareCount: 0,
      attachmentAwareRate: 0,
      fullyTrainedCount: 0,
      fullyTrainedRate: 0,
      score: 0,
      strengths: [],
      concerns: ["No staff education training records — staff readiness for educational support cannot be assessed"],
    };
  }

  // Individual competencies
  const homeworkSupportCount = training.filter((t) => t.homeworkSupportTrained).length;
  const homeworkSupportRate = pct(homeworkSupportCount, totalStaff);

  const pepAwarenessCount = training.filter((t) => t.pepAwareness).length;
  const pepAwarenessRate = pct(pepAwarenessCount, totalStaff);

  const senAwarenessCount = training.filter((t) => t.senAwareness).length;
  const senAwarenessRate = pct(senAwarenessCount, totalStaff);

  const educationAdvocacyCount = training.filter((t) => t.educationAdvocacy).length;
  const educationAdvocacyRate = pct(educationAdvocacyCount, totalStaff);

  const examSupportCount = training.filter((t) => t.examSupportTrained).length;
  const examSupportRate = pct(examSupportCount, totalStaff);

  const attachmentAwareCount = training.filter((t) => t.attachmentAwareEducation).length;
  const attachmentAwareRate = pct(attachmentAwareCount, totalStaff);

  // Fully trained (all 6 competencies)
  const fullyTrainedCount = training.filter(
    (t) =>
      t.homeworkSupportTrained &&
      t.pepAwareness &&
      t.senAwareness &&
      t.educationAdvocacy &&
      t.examSupportTrained &&
      t.attachmentAwareEducation,
  ).length;
  const fullyTrainedRate = pct(fullyTrainedCount, totalStaff);

  // Score (out of 25)
  let score = 0;
  // Homework support: max 5
  score += (homeworkSupportRate / 100) * 5;
  // PEP awareness: max 5
  score += (pepAwarenessRate / 100) * 5;
  // SEN awareness: max 4
  score += (senAwarenessRate / 100) * 4;
  // Education advocacy: max 4
  score += (educationAdvocacyRate / 100) * 4;
  // Exam support: max 4
  score += (examSupportRate / 100) * 4;
  // Attachment-aware education: max 3
  score += (attachmentAwareRate / 100) * 3;

  score = clamp(Math.round(score * 10) / 10, 0, 25);

  // Insights
  const strengths: string[] = [];
  const concerns: string[] = [];

  if (homeworkSupportRate >= 90) {
    strengths.push("Excellent homework support readiness: " + homeworkSupportRate + "% of staff trained");
  } else if (homeworkSupportRate < 70) {
    concerns.push("Homework support training at " + homeworkSupportRate + "% — staff may struggle to support children's homework effectively");
  }

  if (pepAwarenessRate >= 90) {
    strengths.push("Strong PEP awareness: " + pepAwarenessRate + "% of staff understand Personal Education Plans");
  } else if (pepAwarenessRate < 70) {
    concerns.push("PEP awareness at " + pepAwarenessRate + "% — staff need training on Personal Education Plans (CHR 2015 Reg 8)");
  }

  if (senAwarenessRate >= 90) {
    strengths.push("Excellent SEN awareness: " + senAwarenessRate + "% of staff trained in special educational needs");
  } else if (senAwarenessRate < 70) {
    concerns.push("SEN awareness at " + senAwarenessRate + "% — gaps in understanding special educational needs (SEN Code of Practice 2015)");
  }

  if (educationAdvocacyRate >= 90) {
    strengths.push("Strong education advocacy: " + educationAdvocacyRate + "% of staff trained to advocate for children's education");
  } else if (educationAdvocacyRate < 70) {
    concerns.push("Education advocacy training at " + educationAdvocacyRate + "% — children need staff who can advocate for their educational rights");
  }

  if (examSupportRate >= 90) {
    strengths.push("Exam support readiness at " + examSupportRate + "% — staff well-prepared to support during exam periods");
  } else if (examSupportRate < 70) {
    concerns.push("Exam support training at " + examSupportRate + "% — children may lack adequate support during exam periods");
  }

  if (attachmentAwareRate >= 80) {
    strengths.push("Good attachment-aware education training: " + attachmentAwareRate + "% of staff trained");
  } else if (attachmentAwareRate < 50) {
    concerns.push("Attachment-aware education training at " + attachmentAwareRate + "% — understanding trauma's impact on learning is critical for LAC");
  }

  if (fullyTrainedRate === 100) {
    strengths.push("100% of staff fully trained across all education support competencies");
  } else if (fullyTrainedRate < 50) {
    concerns.push("Only " + fullyTrainedRate + "% of staff fully trained in all education competencies — significant training gap");
  }

  return {
    totalStaff,
    homeworkSupportCount,
    homeworkSupportRate,
    pepAwarenessCount,
    pepAwarenessRate,
    senAwarenessCount,
    senAwarenessRate,
    educationAdvocacyCount,
    educationAdvocacyRate,
    examSupportCount,
    examSupportRate,
    attachmentAwareCount,
    attachmentAwareRate,
    fullyTrainedCount,
    fullyTrainedRate,
    score,
    strengths,
    concerns,
  };
}

// ==============================================================================
// Build Child Academic Profiles
// ==============================================================================

export function buildChildAcademicProfiles(
  records: HomeworkRecord[],
  interventions: AcademicIntervention[],
): ChildAcademicProfile[] {
  const childMap = new Map<string, { childId: string; childName: string }>();

  for (const r of records) {
    if (!childMap.has(r.childId)) {
      childMap.set(r.childId, { childId: r.childId, childName: r.childName });
    }
  }
  for (const i of interventions) {
    if (!childMap.has(i.childId)) {
      childMap.set(i.childId, { childId: i.childId, childName: i.childName });
    }
  }

  return Array.from(childMap.values()).map((child) => {
    const childRecords = records.filter((r) => r.childId === child.childId);
    const childInterventions = interventions.filter((i) => i.childId === child.childId);

    const homeworkRecords = childRecords.length;
    const completedCount = childRecords.filter(
      (r) => r.completionStatus === "completed",
    ).length;
    const completionRate = pct(completedCount, homeworkRecords);

    const supportReceived = childRecords.some(
      (r) => r.supportProvided.length > 0 && r.supportProvided.some((s) => s !== "none"),
    );

    const difficultyCount = childRecords.filter((r) => r.difficultyEncountered).length;
    const difficultyRate = pct(difficultyCount, homeworkRecords);

    const interventionCount = childInterventions.length;

    // Best progress across interventions
    const progressOrder: AcademicProgress[] = [
      "above_expected", "at_expected", "below_expected",
      "significantly_below", "not_assessed",
    ];
    let bestProgress: AcademicProgress | null = null;
    for (const prog of progressOrder) {
      if (childInterventions.some((i) => i.progressMade === prog)) {
        bestProgress = prog;
        break;
      }
    }

    // Education score (0-10)
    let educationScore = 5; // baseline
    // Boost for high completion
    if (completionRate >= 90) educationScore += 2;
    else if (completionRate >= 70) educationScore += 1;
    else if (completionRate < 50 && homeworkRecords > 0) educationScore -= 2;

    // Boost for good progress
    if (bestProgress === "above_expected") educationScore += 2;
    else if (bestProgress === "at_expected") educationScore += 1;
    else if (bestProgress === "significantly_below") educationScore -= 2;
    else if (bestProgress === "below_expected") educationScore -= 1;

    // Boost for having support
    if (supportReceived) educationScore += 1;

    // Deduct for high difficulty
    if (difficultyRate > 60 && homeworkRecords > 0) educationScore -= 1;

    educationScore = clamp(educationScore, 0, 10);

    return {
      childId: child.childId,
      childName: child.childName,
      homeworkRecords,
      completionRate,
      supportReceived,
      difficultyRate,
      interventionCount,
      bestProgress,
      educationScore,
    };
  });
}

// ==============================================================================
// Generate Full Intelligence
// ==============================================================================

export function generateHomeworkAcademicSupportIntelligence(
  records: HomeworkRecord[],
  interventions: AcademicIntervention[],
  resources: EducationalResource[],
  training: StaffEducationTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): HomeworkAcademicSupportIntelligence {
  const assessedAt = new Date().toISOString();

  // Filter records to period
  const periodRecords = records.filter(
    (r) => withinPeriod(r.date, periodStart, periodEnd),
  );

  // Filter interventions to period (by startDate)
  const periodInterventions = interventions.filter(
    (i) => withinPeriod(i.startDate, periodStart, periodEnd),
  );

  // Evaluate each layer
  const homeworkCompletion = evaluateHomeworkCompletion(periodRecords);
  const academicInterventions = evaluateAcademicInterventions(periodInterventions);
  const resourceProvision = evaluateResourceProvision(resources);
  const staffEducationReadiness = evaluateStaffEducationReadiness(training);

  // Build child profiles
  const childProfiles = buildChildAcademicProfiles(periodRecords, periodInterventions);

  // Overall score (100 points)
  const overallScore = clamp(
    Math.round(
      homeworkCompletion.score +
      academicInterventions.score +
      resourceProvision.score +
      staffEducationReadiness.score,
    ),
    0,
    100,
  );

  const rating = getRating(overallScore);

  // Aggregate insights
  const strengths = aggregateStrengths(
    homeworkCompletion, academicInterventions, resourceProvision, staffEducationReadiness, overallScore,
  );
  const areasForImprovement = aggregateAreasForImprovement(
    homeworkCompletion, academicInterventions, resourceProvision, staffEducationReadiness, overallScore,
  );
  const actions = generateActions(
    homeworkCompletion, academicInterventions, resourceProvision, staffEducationReadiness, childProfiles,
  );
  const regulatoryLinks = generateRegulatoryLinks();

  return {
    homeId,
    assessedAt,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    homeworkCompletion,
    academicInterventions,
    resourceProvision,
    staffEducationReadiness,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}

// -- Aggregate Strengths ------------------------------------------------------

function aggregateStrengths(
  homework: HomeworkCompletionResult,
  interventions: AcademicInterventionResult,
  resources: ResourceProvisionResult,
  staff: StaffEducationReadinessResult,
  overallScore: number,
): string[] {
  const strengths: string[] = [];

  if (overallScore >= 80) {
    strengths.push("Overall homework and academic support rated Outstanding (" + overallScore + "/100)");
  } else if (overallScore >= 60) {
    strengths.push("Overall homework and academic support rated Good (" + overallScore + "/100)");
  }

  strengths.push(...homework.strengths.slice(0, 2));
  strengths.push(...interventions.strengths.slice(0, 2));
  strengths.push(...resources.strengths.slice(0, 2));
  strengths.push(...staff.strengths.slice(0, 2));

  return strengths;
}

// -- Aggregate Areas for Improvement ------------------------------------------

function aggregateAreasForImprovement(
  homework: HomeworkCompletionResult,
  interventions: AcademicInterventionResult,
  resources: ResourceProvisionResult,
  staff: StaffEducationReadinessResult,
  overallScore: number,
): string[] {
  const areas: string[] = [];

  if (overallScore < 40) {
    areas.push("Overall homework and academic support rated Inadequate (" + overallScore + "/100) — urgent systemic review required");
  } else if (overallScore < 60) {
    areas.push("Overall homework and academic support Requires Improvement (" + overallScore + "/100)");
  }

  areas.push(...homework.concerns);
  areas.push(...interventions.concerns);
  areas.push(...resources.concerns);
  areas.push(...staff.concerns);

  return areas;
}

// -- Generate Actions ---------------------------------------------------------

function generateActions(
  homework: HomeworkCompletionResult,
  interventions: AcademicInterventionResult,
  resources: ResourceProvisionResult,
  staff: StaffEducationReadinessResult,
  childProfiles: ChildAcademicProfile[],
): string[] {
  const actions: string[] = [];

  // Children with low education scores
  const atRiskChildren = childProfiles.filter((p) => p.educationScore <= 3);
  if (atRiskChildren.length > 0) {
    actions.push(
      "URGENT: " + atRiskChildren.length +
      " child(ren) with low education scores — review individual education support plans and PEP targets",
    );
  }

  // Significantly below progress
  if (interventions.progressBreakdown.significantly_below > 0) {
    actions.push(
      "URGENT: " + interventions.progressBreakdown.significantly_below +
      " intervention(s) with significantly below expected progress — arrange multi-agency education review",
    );
  }

  // Low homework completion
  if (homework.completionRate < 60 && homework.totalRecords > 0) {
    actions.push(
      "HIGH: Homework completion rate at " + homework.completionRate +
      "% — implement structured homework support programme and review barriers to completion",
    );
  }

  // Low PEP linkage
  if (interventions.pepLinkedRate < 70 && interventions.totalInterventions > 0) {
    actions.push(
      "HIGH: PEP linkage at " + interventions.pepLinkedRate +
      "% — ensure all interventions are aligned with Personal Education Plans",
    );
  }

  // Resource gaps
  if (resources.availabilityRate < 70 && resources.totalResources > 0) {
    actions.push(
      "HIGH: Resource availability at " + resources.availabilityRate +
      "% — procure or restore missing educational resources",
    );
  }

  // Staff training gaps
  if (staff.fullyTrainedRate < 50 && staff.totalStaff > 0) {
    actions.push(
      "HIGH: Only " + staff.fullyTrainedRate +
      "% of staff fully trained in education support — schedule comprehensive training programme",
    );
  }

  // Low support rate
  if (homework.supportProvidedRate < 50 && homework.totalRecords > 0) {
    actions.push(
      "MEDIUM: Support provided in only " + homework.supportProvidedRate +
      "% of homework sessions — ensure staff availability during homework time",
    );
  }

  // Low intervention attendance
  if (interventions.averageAttendanceRate < 70 && interventions.totalInterventions > 0) {
    actions.push(
      "MEDIUM: Intervention attendance at " + interventions.averageAttendanceRate +
      "% — investigate barriers to attendance and engage children in planning",
    );
  }

  // Low SEN awareness
  if (staff.senAwarenessRate < 70 && staff.totalStaff > 0) {
    actions.push(
      "MEDIUM: SEN awareness at " + staff.senAwarenessRate +
      "% — arrange SEN training for staff (SEN Code of Practice 2015)",
    );
  }

  if (actions.length === 0) {
    actions.push("No immediate actions required. Homework and academic support systems operating within expected standards.");
  }

  return actions;
}

// -- Regulatory Links ---------------------------------------------------------

function generateRegulatoryLinks(): string[] {
  return [
    "CHR 2015, Reg 8 — Promotion of educational achievement for looked-after children",
    "CHR 2015, Reg 10 — Health and education record keeping",
    "SCCIF — Impact of leaders on education and learning outcomes",
    "SEN Code of Practice 2015 — Support for children with special educational needs",
    "UNCRC Article 28 — Right to education",
    "UNCRC Article 29 — Education developing the child to their fullest potential",
    "Children Act 1989 — Duty to promote educational achievement of looked-after children",
  ];
}
