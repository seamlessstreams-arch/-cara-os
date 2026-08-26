import { below, meets, rate } from "@/lib/metrics/rate";
// ==============================================================================
// YOUNG PERSON EMPLOYMENT SUPPORT INTELLIGENCE ENGINE
//
// Pure deterministic engine for assessing employment readiness support for
// older children (14+) in residential care. Covers careers planning, skill
// development sessions, external partnership access, and staff readiness to
// deliver employment-related guidance.
//
// Regulatory basis:
//   - CHR 2015, Reg 8 — The education standard: preparing children for employment
//   - CHR 2015, Reg 9 — The enjoyment and achievement standard
//   - SCCIF — Overall experiences and progress of children
//   - NMS 8 — Promoting educational achievement
//   - Careers Strategy 2017 — Statutory careers guidance obligations
//   - UNCRC Article 28 — Right to education and vocational training
//   - UNCRC Article 32 — Right to protection from economic exploitation
//
// No AI. No external calls. Pure input -> output.
// ==============================================================================

// -- Types --------------------------------------------------------------------

export type SupportType =
  | "work_experience"
  | "cv_writing"
  | "interview_skills"
  | "careers_guidance"
  | "financial_literacy"
  | "apprenticeship_search"
  | "college_application"
  | "volunteering";

export type EngagementLevel =
  | "highly_engaged"
  | "engaged"
  | "partially_engaged"
  | "disengaged";

export type OutcomeStatus =
  | "achieved"
  | "in_progress"
  | "not_started"
  | "not_applicable";

export type CareersPlanStatus =
  | "current"
  | "overdue"
  | "not_in_place";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// -- Input Interfaces ---------------------------------------------------------

export interface ChildEmploymentProfile {
  id: string;
  childId: string;
  childName: string;
  age: number;
  careersPlanExists: boolean;
  careersPlanStatus: CareersPlanStatus;
  careerAspirations: string[];
  workExperienceCompleted: boolean;
  cvPrepared: boolean;
  interviewPracticed: boolean;
  financialLiteracyAssessed: boolean;
  personalAdviserEngaged: boolean;
}

export interface EmploymentSupportSession {
  id: string;
  childId: string;
  childName: string;
  date: string;
  supportType: SupportType;
  facilitatedBy: string;
  duration: number;
  childEngaged: EngagementLevel;
  outcomeStatus: OutcomeStatus;
  skillsDeveloped: string[];
  nextSteps: string;
}

export interface PartnershipRecord {
  id: string;
  partnerId: string;
  partnerName: string;
  partnerType: "employer" | "college" | "training_provider" | "careers_service" | "volunteer_org";
  activeEngagement: boolean;
  opportunitiesProvided: number;
  childrenSupported: string[];
}

export interface StaffEmploymentTraining {
  id: string;
  staffId: string;
  staffName: string;
  careersGuidanceTrained: boolean;
  cvInterviewSupport: boolean;
  financialLiteracyTrained: boolean;
  apprenticeshipAwareness: boolean;
  localLabourMarket: boolean;
  motivationalInterviewing: boolean;
}

// -- Result Interfaces --------------------------------------------------------

export interface CareersPlanQualityResult {
  overallScore: number;
  totalProfiles: number;
  /** null when the population is empty — nothing measured, not 0%. */
  planExistsRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  planCurrentRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  aspirationsRecordedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  adviserEngagedRate: number | null;
}

export interface SkillDevelopmentResult {
  overallScore: number;
  totalSessions: number;
  /** null when the population is empty — nothing measured, not 0%. */
  engagedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  achievedRate: number | null;
  supportTypeVariety: number;
  averageSessionsPerChild: number | null;
}

export interface PartnershipAccessResult {
  overallScore: number;
  totalPartnerships: number;
  /** null when the population is empty — nothing measured, not 0%. */
  activeRate: number | null;
  totalOpportunities: number;
  employerEngagementCount: number;
  /** null when the population is empty — nothing measured, not 0%. */
  childrenAccessingRate: number | null;
}

export interface StaffReadinessResult {
  overallScore: number;
  totalStaff: number;
  /** null when the population is empty — nothing measured, not 0%. */
  careersGuidanceRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  cvInterviewRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  financialLiteracyRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  apprenticeshipRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  labourMarketRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  motivationalInterviewingRate: number | null;
}

export interface ChildEmploymentProfileResult {
  childId: string;
  childName: string;
  age: number;
  hasPlan: boolean;
  planCurrent: boolean;
  sessionsInPeriod: number;
  skillsAchieved: number;
  engagementScore: number;
  overallScore: number;
}

export interface YoungPersonEmploymentSupportIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  careersPlanQuality: CareersPlanQualityResult;
  skillDevelopment: SkillDevelopmentResult;
  partnershipAccess: PartnershipAccessResult;
  staffReadiness: StaffReadinessResult;
  childProfiles: ChildEmploymentProfileResult[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// -- Helpers ------------------------------------------------------------------

export function getRating(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// -- Label Maps & Getters -----------------------------------------------------

const SUPPORT_TYPE_LABELS: Record<SupportType, string> = {
  work_experience: "Work Experience",
  cv_writing: "CV Writing",
  interview_skills: "Interview Skills",
  careers_guidance: "Careers Guidance",
  financial_literacy: "Financial Literacy",
  apprenticeship_search: "Apprenticeship Search",
  college_application: "College Application",
  volunteering: "Volunteering",
};

const ENGAGEMENT_LEVEL_LABELS: Record<EngagementLevel, string> = {
  highly_engaged: "Highly Engaged",
  engaged: "Engaged",
  partially_engaged: "Partially Engaged",
  disengaged: "Disengaged",
};

const OUTCOME_STATUS_LABELS: Record<OutcomeStatus, string> = {
  achieved: "Achieved",
  in_progress: "In Progress",
  not_started: "Not Started",
  not_applicable: "Not Applicable",
};

const CAREERS_PLAN_STATUS_LABELS: Record<CareersPlanStatus, string> = {
  current: "Current",
  overdue: "Overdue",
  not_in_place: "Not in Place",
};

const RATING_LABELS: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getSupportTypeLabel(v: SupportType): string { return SUPPORT_TYPE_LABELS[v]; }
export function getEngagementLevelLabel(v: EngagementLevel): string { return ENGAGEMENT_LEVEL_LABELS[v]; }
export function getOutcomeStatusLabel(v: OutcomeStatus): string { return OUTCOME_STATUS_LABELS[v]; }
export function getCareersPlanStatusLabel(v: CareersPlanStatus): string { return CAREERS_PLAN_STATUS_LABELS[v]; }
export function getRatingLabel(v: Rating): string { return RATING_LABELS[v]; }

// -- Evaluators ---------------------------------------------------------------

/**
 * Evaluates the quality and coverage of careers plans for children.
 * Empty = 0 (no profiles documented = non-compliant).
 */
export function evaluateCareersPlanQuality(
  profiles: ChildEmploymentProfile[],
): CareersPlanQualityResult {
  if (profiles.length === 0) {
    return {
      overallScore: 0,
      totalProfiles: 0,
      planExistsRate: null,
      planCurrentRate: null,
      aspirationsRecordedRate: null,
      adviserEngagedRate: null,
    };
  }

  let planExists = 0;
  let planCurrent = 0;
  let aspirationsRecorded = 0;
  let adviserEngaged = 0;

  for (const p of profiles) {
    if (p.careersPlanExists) planExists++;
    if (p.careersPlanStatus === "current") planCurrent++;
    if (p.careerAspirations.length > 0) aspirationsRecorded++;
    if (p.personalAdviserEngaged) adviserEngaged++;
  }

  const planExistsRate = rate(planExists, profiles.length);
  const planCurrentRate = rate(planCurrent, profiles.length);
  const aspirationsRecordedRate = rate(aspirationsRecorded, profiles.length);
  const adviserEngagedRate = rate(adviserEngaged, profiles.length);

  // Scoring: plans exist (0-7), plan current (0-6), aspirations recorded (0-6), adviser engaged (0-6)
  let score = 0;
  score += Math.round((planExistsRate! / 100) * 7);
  score += Math.round((planCurrentRate! / 100) * 6);
  score += Math.round((aspirationsRecordedRate! / 100) * 6);
  score += Math.round((adviserEngagedRate! / 100) * 6);

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    totalProfiles: profiles.length,
    planExistsRate,
    planCurrentRate,
    aspirationsRecordedRate,
    adviserEngagedRate,
  };
}

/**
 * Evaluates quality and breadth of skill development sessions.
 * Empty = 0 (no sessions documented = non-compliant).
 */
export function evaluateSkillDevelopment(
  sessions: EmploymentSupportSession[],
  profileCount: number,
): SkillDevelopmentResult {
  if (sessions.length === 0) {
    return {
      overallScore: 0,
      totalSessions: 0,
      engagedRate: null,
      achievedRate: null,
      supportTypeVariety: 0,
      averageSessionsPerChild: 0,
    };
  }

  let engaged = 0;
  let achieved = 0;

  for (const s of sessions) {
    if (s.childEngaged === "highly_engaged" || s.childEngaged === "engaged") engaged++;
    if (s.outcomeStatus === "achieved") achieved++;
  }

  const supportTypes = new Set(sessions.map((s) => s.supportType));
  const childIds = new Set(sessions.map((s) => s.childId));
  const averageSessionsPerChild = childIds.size > 0 ? Math.round(sessions.length / childIds.size) : null;

  const engagedRate = rate(engaged, sessions.length);
  const achievedRate = rate(achieved, sessions.length);
  const supportTypeVariety = supportTypes.size;

  // Scoring: sessions quality engaged (0-7), skills achieved (0-6), variety of support types (0-6), regular sessions (0-6)
  let score = 0;
  score += Math.round((engagedRate! / 100) * 7);
  score += Math.round((achievedRate! / 100) * 6);

  // Variety: 8 possible types, scale 0-6
  const varietyPct = rate(supportTypeVariety, 8);
  score += Math.round((varietyPct! / 100) * 6);

  // Regular sessions: at least 2 per child per period is good
  const sessionDen = profileCount > 0 ? profileCount : childIds.size;
  const avgPerChild = sessionDen > 0 ? sessions.length / sessionDen : 0;
  if (avgPerChild >= 3) score += 6;
  else if (avgPerChild >= 2) score += 4;
  else if (avgPerChild >= 1) score += 2;

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    totalSessions: sessions.length,
    engagedRate,
    achievedRate,
    supportTypeVariety,
    averageSessionsPerChild,
  };
}

/**
 * Evaluates access to external partnerships and opportunities.
 * Empty = 0 (no partnerships = non-compliant).
 */
export function evaluatePartnershipAccess(
  partnerships: PartnershipRecord[],
  profileCount: number,
): PartnershipAccessResult {
  if (partnerships.length === 0) {
    return {
      overallScore: 0,
      totalPartnerships: 0,
      activeRate: null,
      totalOpportunities: 0,
      employerEngagementCount: 0,
      childrenAccessingRate: null,
    };
  }

  let active = 0;
  let totalOpportunities = 0;
  let employerCount = 0;
  const childrenAccessing = new Set<string>();

  for (const p of partnerships) {
    if (p.activeEngagement) active++;
    totalOpportunities += p.opportunitiesProvided;
    if (p.partnerType === "employer") employerCount++;
    for (const childId of p.childrenSupported) {
      childrenAccessing.add(childId);
    }
  }

  const activeRate = rate(active, partnerships.length);
  const childrenAccessingRate = profileCount > 0 ? rate(childrenAccessing.size, profileCount) : 0;

  // Scoring: active partnerships (0-7), opportunities provided (0-6), employer engagement (0-6), children accessing (0-6)
  let score = 0;

  // Active partnerships: more active = better, scale by ratio
  score += Math.round((activeRate! / 100) * 7);

  // Opportunities: at least 5 is great
  if (totalOpportunities >= 5) score += 6;
  else if (totalOpportunities >= 3) score += 4;
  else if (totalOpportunities >= 1) score += 2;

  // Employer engagement
  if (employerCount >= 3) score += 6;
  else if (employerCount >= 2) score += 4;
  else if (employerCount >= 1) score += 3;

  // Children accessing partnerships
  score += Math.round(((childrenAccessingRate ?? 0) / 100) * 6);

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    totalPartnerships: partnerships.length,
    activeRate,
    totalOpportunities,
    employerEngagementCount: employerCount,
    childrenAccessingRate,
  };
}

/**
 * Evaluates staff readiness to deliver employment support.
 * Empty = 0.
 */
export function evaluateStaffReadiness(
  training: StaffEmploymentTraining[],
): StaffReadinessResult {
  if (training.length === 0) {
    return {
      overallScore: 0,
      totalStaff: 0,
      careersGuidanceRate: null,
      cvInterviewRate: null,
      financialLiteracyRate: null,
      apprenticeshipRate: null,
      labourMarketRate: null,
      motivationalInterviewingRate: null,
    };
  }

  let careersGuidance = 0;
  let cvInterview = 0;
  let financialLiteracy = 0;
  let apprenticeship = 0;
  let labourMarket = 0;
  let motivationalInterviewing = 0;

  for (const t of training) {
    if (t.careersGuidanceTrained) careersGuidance++;
    if (t.cvInterviewSupport) cvInterview++;
    if (t.financialLiteracyTrained) financialLiteracy++;
    if (t.apprenticeshipAwareness) apprenticeship++;
    if (t.localLabourMarket) labourMarket++;
    if (t.motivationalInterviewing) motivationalInterviewing++;
  }

  const careersGuidanceRate = rate(careersGuidance, training.length);
  const cvInterviewRate = rate(cvInterview, training.length);
  const financialLiteracyRate = rate(financialLiteracy, training.length);
  const apprenticeshipRate = rate(apprenticeship, training.length);
  const labourMarketRate = rate(labourMarket, training.length);
  const motivationalInterviewingRate = rate(motivationalInterviewing, training.length);

  // Scoring: careers guidance (0-6), CV/interview (0-5), financial literacy (0-5),
  // apprenticeship (0-4), labour market (0-3), motivational interviewing (0-2)
  let score = 0;
  score += Math.round((careersGuidanceRate! / 100) * 6);
  score += Math.round(((cvInterviewRate ?? 0) / 100) * 5);
  score += Math.round(((financialLiteracyRate ?? 0) / 100) * 5);
  score += Math.round(((apprenticeshipRate ?? 0) / 100) * 4);
  score += Math.round(((labourMarketRate ?? 0) / 100) * 3);
  score += Math.round(((motivationalInterviewingRate ?? 0) / 100) * 2);

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    totalStaff: training.length,
    careersGuidanceRate,
    cvInterviewRate,
    financialLiteracyRate,
    apprenticeshipRate,
    labourMarketRate,
    motivationalInterviewingRate,
  };
}

// -- Child Profiles -----------------------------------------------------------

export function buildChildEmploymentProfiles(
  profiles: ChildEmploymentProfile[],
  sessions: EmploymentSupportSession[],
): ChildEmploymentProfileResult[] {
  if (profiles.length === 0) return [];

  return profiles.map((p) => {
    const childSessions = sessions.filter((s) => s.childId === p.childId);
    const achieved = childSessions.filter((s) => s.outcomeStatus === "achieved").length;

    // Engagement score based on sessions
    let engagementScore = 0;
    if (childSessions.length > 0) {
      const engagedCount = childSessions.filter(
        (s) => s.childEngaged === "highly_engaged" || s.childEngaged === "engaged",
      ).length;
      engagementScore = Math.round((engagedCount / childSessions.length) * 10);
    }

    // Overall 0-10
    let score = 0;
    if (p.careersPlanExists) score += 2;
    if (p.careersPlanStatus === "current") score += 1;
    if (p.careerAspirations.length > 0) score += 1;
    if (p.workExperienceCompleted) score += 1;
    if (p.cvPrepared) score += 1;
    if (p.interviewPracticed) score += 1;
    if (p.financialLiteracyAssessed) score += 1;
    if (p.personalAdviserEngaged) score += 1;
    if (childSessions.length >= 2) score += 1;

    return {
      childId: p.childId,
      childName: p.childName,
      age: p.age,
      hasPlan: p.careersPlanExists,
      planCurrent: p.careersPlanStatus === "current",
      sessionsInPeriod: childSessions.length,
      skillsAchieved: achieved,
      engagementScore: Math.min(10, engagementScore),
      overallScore: Math.min(10, score),
    };
  });
}

// -- Main Function ------------------------------------------------------------

export function generateYoungPersonEmploymentSupportIntelligence(
  profiles: ChildEmploymentProfile[],
  sessions: EmploymentSupportSession[],
  partnerships: PartnershipRecord[],
  training: StaffEmploymentTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): YoungPersonEmploymentSupportIntelligence {
  const careersPlanQuality = evaluateCareersPlanQuality(profiles);
  const skillDevelopment = evaluateSkillDevelopment(sessions, profiles.length);
  const partnershipAccess = evaluatePartnershipAccess(partnerships, profiles.length);
  const staffReadiness = evaluateStaffReadiness(training);

  const rawScore =
    careersPlanQuality.overallScore +
    skillDevelopment.overallScore +
    partnershipAccess.overallScore +
    staffReadiness.overallScore;

  const overallScore = Math.min(100, Math.max(0, rawScore));
  const rating = getRating(overallScore);

  const childProfiles = buildChildEmploymentProfiles(profiles, sessions);

  // -- Strengths --
  const strengths: string[] = [];
  if (profiles.length > 0 && careersPlanQuality.planExistsRate === 100)
    strengths.push("Careers plans in place for all young people");
  if (profiles.length > 0 && careersPlanQuality.planCurrentRate === 100)
    strengths.push("All careers plans are up to date and current");
  if (profiles.length > 0 && careersPlanQuality.aspirationsRecordedRate === 100)
    strengths.push("Career aspirations recorded for every young person");
  if (sessions.length > 0 && meets(skillDevelopment.engagedRate, 85))
    strengths.push("High engagement in employment support sessions — " + skillDevelopment.engagedRate + "% engaged or highly engaged");
  if (sessions.length > 0 && meets(skillDevelopment.achievedRate, 80))
    strengths.push("Strong outcome achievement — " + skillDevelopment.achievedRate + "% of sessions resulted in achieved outcomes");
  if (sessions.length > 0 && skillDevelopment.supportTypeVariety >= 5)
    strengths.push("Good variety of support types offered — " + skillDevelopment.supportTypeVariety + " different types");
  if (partnerships.length > 0 && partnershipAccess.activeRate === 100)
    strengths.push("All external partnerships actively engaged");
  if (partnerships.length > 0 && partnershipAccess.employerEngagementCount >= 2)
    strengths.push("Strong employer engagement with " + partnershipAccess.employerEngagementCount + " employer partnerships");
  if (training.length > 0 && staffReadiness.careersGuidanceRate === 100)
    strengths.push("All staff trained in careers guidance");
  if (profiles.length > 0 && meets(careersPlanQuality.adviserEngagedRate, 80))
    strengths.push("Personal advisers engaged for " + careersPlanQuality.adviserEngagedRate + "% of young people");

  // -- Areas for Improvement --
  const areasForImprovement: string[] = [];
  if (profiles.length === 0)
    areasForImprovement.push("No employment profiles documented — all eligible young people (14+) should have employment readiness assessments");
  if (profiles.length > 0 && below(careersPlanQuality.planExistsRate, 100))
    areasForImprovement.push("Careers plans missing for " + (100 - careersPlanQuality.planExistsRate!) + "% of young people");
  if (profiles.length > 0 && below(careersPlanQuality.planCurrentRate, 80)) {
    const overdueCount = profiles.filter((p) => p.careersPlanStatus === "overdue").length;
    if (overdueCount > 0)
      areasForImprovement.push(overdueCount + " careers plan(s) overdue for review");
  }
  if (sessions.length > 0 && below(skillDevelopment.engagedRate, 60))
    areasForImprovement.push("Low engagement in employment support sessions — only " + skillDevelopment.engagedRate + "% engaged");
  if (sessions.length === 0 && profiles.length > 0)
    areasForImprovement.push("No employment support sessions recorded — schedule regular sessions for all young people");
  if (partnerships.length === 0)
    areasForImprovement.push("No external partnerships for employment support — develop links with local employers, colleges, and training providers");
  if (partnerships.length > 0 && partnershipAccess.employerEngagementCount === 0)
    areasForImprovement.push("No employer partnerships — work experience placements require employer links");
  if (training.length === 0)
    areasForImprovement.push("No staff training records for employment support delivery");
  if (training.length > 0 && below(staffReadiness.careersGuidanceRate, 75))
    areasForImprovement.push("Only " + staffReadiness.careersGuidanceRate + "% of staff trained in careers guidance — target 100%");
  if (training.length > 0 && below(staffReadiness.financialLiteracyRate, 50))
    areasForImprovement.push("Financial literacy training low at " + staffReadiness.financialLiteracyRate + "% — young people need support managing money");

  // -- Actions --
  const actions: string[] = [];
  const noPlan = profiles.filter((p) => !p.careersPlanExists && p.age >= 14);
  if (noPlan.length > 0)
    actions.push("URGENT: " + noPlan.length + " young person(s) aged 14+ without a careers plan — statutory requirement");
  const overduePlans = profiles.filter((p) => p.careersPlanStatus === "overdue");
  if (overduePlans.length > 0)
    actions.push("URGENT: " + overduePlans.length + " careers plan(s) overdue — review and update immediately");
  const noAdviser = profiles.filter((p) => !p.personalAdviserEngaged && p.age >= 16);
  if (noAdviser.length > 0)
    actions.push("URGENT: " + noAdviser.length + " young person(s) aged 16+ without a personal adviser — arrange engagement");
  if (profiles.length > 0 && sessions.length === 0)
    actions.push("Schedule employment support sessions for all eligible young people");
  if (partnerships.length === 0 && profiles.length > 0)
    actions.push("Develop external partnerships with local employers and training providers");
  if (partnerships.length > 0 && partnershipAccess.employerEngagementCount === 0)
    actions.push("Establish at least one employer partnership to facilitate work experience placements");
  if (training.length > 0 && below(staffReadiness.careersGuidanceRate, 75))
    actions.push("Arrange careers guidance training — only " + staffReadiness.careersGuidanceRate + "% of staff currently trained");
  if (training.length > 0 && below(staffReadiness.financialLiteracyRate, 50))
    actions.push("Arrange financial literacy training for staff — essential for supporting young people's independence");
  const noWorkExp = profiles.filter((p) => !p.workExperienceCompleted && p.age >= 15);
  if (noWorkExp.length > 0)
    actions.push("Arrange work experience placements for " + noWorkExp.length + " young person(s) aged 15+");
  const noCv = profiles.filter((p) => !p.cvPrepared && p.age >= 15);
  if (noCv.length > 0)
    actions.push("Support " + noCv.length + " young person(s) to prepare a CV");

  const regulatoryLinks: string[] = [
    "CHR 2015, Reg 8 — The education standard: preparing children for employment and independence",
    "CHR 2015, Reg 9 — The enjoyment and achievement standard: access to activities and achievement",
    "SCCIF — Overall experiences and progress of children: preparation for adulthood and employment",
    "NMS 8 — Promoting educational achievement: careers guidance and employment readiness",
    "Careers Strategy 2017 — Statutory duty to provide independent careers guidance from Year 8",
    "UNCRC Article 28 — Right to education including vocational training and guidance",
    "UNCRC Article 32 — Right to protection from economic exploitation and appropriate working conditions",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    careersPlanQuality,
    skillDevelopment,
    partnershipAccess,
    staffReadiness,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
