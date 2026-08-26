// ==============================================================================
// Substance Misuse Awareness Intelligence Engine
//
// Pure deterministic engine — no AI, no external calls, no randomness.
// Evaluates how well the home addresses substance misuse prevention and support:
//   1. Risk Assessment & Screening (identification, documentation, review)
//   2. Education & Prevention (awareness sessions, resources, peer education)
//   3. Intervention & Support (referrals, professional support, recovery plans)
//   4. Staff Competence & Readiness (training, confidence, protocols)
//
// Regulatory: CHR 2015 Reg 10, CHR 2015 Reg 12, SCCIF, NMS 3,
//             KCSIE 2024, UNCRC Article 33, Drug Strategy 2021
// ==============================================================================

import { above, below, meets, rate, rateOf } from "@/lib/metrics/rate";

// -- Type unions ---------------------------------------------------------------

export type SubstanceType =
  | "alcohol"
  | "cannabis"
  | "tobacco"
  | "vaping"
  | "solvents"
  | "prescription_misuse"
  | "nps"
  | "class_a"
  | "unknown"
  | "none";

export type RiskLevel =
  | "no_concerns"
  | "low"
  | "medium"
  | "high"
  | "active_use";

export type ScreeningOutcome =
  | "no_concerns"
  | "monitoring"
  | "referral_made"
  | "intervention_active"
  | "recovery";

export type SessionType =
  | "group_education"
  | "individual_awareness"
  | "peer_education"
  | "external_speaker"
  | "resource_sharing"
  | "harm_reduction";

export type InterventionOutcome =
  | "engaged"
  | "partially_engaged"
  | "declined"
  | "completed"
  | "ongoing";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// -- Label maps ----------------------------------------------------------------

const substanceTypeLabels: Record<SubstanceType, string> = {
  alcohol: "Alcohol",
  cannabis: "Cannabis",
  tobacco: "Tobacco",
  vaping: "Vaping",
  solvents: "Solvents",
  prescription_misuse: "Prescription Misuse",
  nps: "New Psychoactive Substances",
  class_a: "Class A Drugs",
  unknown: "Unknown",
  none: "None",
};

const riskLevelLabels: Record<RiskLevel, string> = {
  no_concerns: "No Concerns",
  low: "Low",
  medium: "Medium",
  high: "High",
  active_use: "Active Use",
};

const screeningOutcomeLabels: Record<ScreeningOutcome, string> = {
  no_concerns: "No Concerns",
  monitoring: "Monitoring",
  referral_made: "Referral Made",
  intervention_active: "Intervention Active",
  recovery: "Recovery",
};

const sessionTypeLabels: Record<SessionType, string> = {
  group_education: "Group Education",
  individual_awareness: "Individual Awareness",
  peer_education: "Peer Education",
  external_speaker: "External Speaker",
  resource_sharing: "Resource Sharing",
  harm_reduction: "Harm Reduction",
};

const interventionOutcomeLabels: Record<InterventionOutcome, string> = {
  engaged: "Engaged",
  partially_engaged: "Partially Engaged",
  declined: "Declined",
  completed: "Completed",
  ongoing: "Ongoing",
};

const ratingLabels: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

// -- Label getters -------------------------------------------------------------

export function getSubstanceTypeLabel(t: SubstanceType): string {
  return substanceTypeLabels[t] ?? t;
}
export function getRiskLevelLabel(l: RiskLevel): string {
  return riskLevelLabels[l] ?? l;
}
export function getScreeningOutcomeLabel(o: ScreeningOutcome): string {
  return screeningOutcomeLabels[o] ?? o;
}
export function getSessionTypeLabel(t: SessionType): string {
  return sessionTypeLabels[t] ?? t;
}
export function getInterventionOutcomeLabel(o: InterventionOutcome): string {
  return interventionOutcomeLabels[o] ?? o;
}
export function getRatingLabel(r: Rating): string {
  return ratingLabels[r] ?? r;
}

// -- Input interfaces ----------------------------------------------------------

export interface ChildSubstanceProfile {
  id: string;
  childId: string;
  childName: string;
  riskLevel: RiskLevel;
  screeningDate: string;
  screenedBy: string;
  screeningOutcome: ScreeningOutcome;
  substancesOfConcern: SubstanceType[];
  reviewDate: string;
  reviewCurrent: boolean;
  harmReductionPlanInPlace: boolean;
  professionalReferralMade: boolean;
}

export interface AwarenessSession {
  id: string;
  date: string;
  sessionType: SessionType;
  facilitatedBy: string;
  childrenAttended: string[];
  topicsCovered: string[];
  childEngagement: "high" | "medium" | "low";
  resourcesProvided: boolean;
}

export interface SubstanceIntervention {
  id: string;
  childId: string;
  childName: string;
  date: string;
  substanceType: SubstanceType;
  referralService: string;
  interventionOutcome: InterventionOutcome;
  recoveryPlanInPlace: boolean;
  parentNotified: boolean;
  socialWorkerNotified: boolean;
  followUpScheduled: boolean;
}

export interface StaffSubstanceTraining {
  id: string;
  staffId: string;
  staffName: string;
  substanceAwareness: boolean;
  riskScreeningTrained: boolean;
  harmReductionTrained: boolean;
  motivationalInterviewing: boolean;
  referralPathwayKnowledge: boolean;
  emergencyResponseTrained: boolean;
}

// -- Result interfaces ---------------------------------------------------------

export interface RiskScreeningResult {
  overallScore: number;
  totalProfiles: number;
  screenedRate: number | null;
  reviewCurrentRate: number | null;
  noConcernsRate: number | null;
  // Null when no child is at that risk level — nothing to plan or refer for
  referralMadeRate: number | null;
  harmReductionRate: number | null;
}

export interface EducationPreventionResult {
  overallScore: number;
  totalSessions: number;
  /** null when the population is empty — nothing measured, not 0%. */
  highEngagementRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  resourcesProvidedRate: number | null;
  sessionTypeVariety: number;
  /** null when the population is empty — nothing measured, not 0%. */
  childrenReachedRate: number | null;
}

export interface InterventionSupportResult {
  overallScore: number;
  totalInterventions: number;
  /** null when the population is empty — nothing measured, not 0%. */
  engagedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  recoveryPlanRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  followUpRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  parentNotifiedRate: number | null;
}

export interface StaffSubstanceReadinessResult {
  overallScore: number;
  totalStaff: number;
  /** null when the population is empty — nothing measured, not 0%. */
  substanceAwarenessRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  riskScreeningRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  harmReductionRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  motivationalRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  referralPathwayRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  emergencyResponseRate: number | null;
}

export interface ChildSubstanceSummary {
  childId: string;
  childName: string;
  riskLevel: string;
  screeningOutcome: string;
  substancesConcern: number;
  hasHarmReductionPlan: boolean;
  sessionsAttended: number;
  overallScore: number;
}

export interface SubstanceMisuseAwarenessIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  riskScreening: RiskScreeningResult;
  educationPrevention: EducationPreventionResult;
  interventionSupport: InterventionSupportResult;
  staffSubstanceReadiness: StaffSubstanceReadinessResult;
  childProfiles: ChildSubstanceSummary[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// -- Helpers -------------------------------------------------------------------

export function getRating(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// -- Evaluators ----------------------------------------------------------------

/**
 * Evaluates risk assessment and screening quality.
 * Empty = 0 (no screening = no evidence of assessment).
 *
 *   Screened (all have profile)    → 0-7
 *   Review current rate            → 0-6
 *   Harm reduction plan rate       → 0-6
 *   Professional referral where needed → 0-6
 */
export function evaluateRiskScreening(
  profiles: ChildSubstanceProfile[],
): RiskScreeningResult {
  if (profiles.length === 0) {
    return {
      overallScore: 0,
      totalProfiles: 0,
      screenedRate: null,
      reviewCurrentRate: null,
      noConcernsRate: null,
      referralMadeRate: null,
      harmReductionRate: null,
    };
  }

  let score = 0;
  // Dimensions that do not apply are dropped from the denominator too, so a
  // home with nothing to refer is neither rewarded nor punished for it.
  let maxScore = 0;

  // All children screened — having profiles = screened 100%
  const screenedRate = 100;
  score += 7; // All have profiles = 100% screened
  maxScore += 7;

  const reviewCurrent = profiles.filter((p) => p.reviewCurrent).length;
  const reviewCurrentRate = rate(reviewCurrent, profiles.length);
  maxScore += 6;
  if (meets(reviewCurrentRate, 90)) score += 6;
  else if (meets(reviewCurrentRate, 70)) score += 4;
  else if (meets(reviewCurrentRate, 50)) score += 3;
  else if (above(reviewCurrentRate, 0)) score += 1;

  const noConcerns = profiles.filter(
    (p) => p.screeningOutcome === "no_concerns",
  ).length;
  const noConcernsRate = rate(noConcerns, profiles.length);

  // Harm reduction for those with concerns
  const withConcerns = profiles.filter(
    (p) => p.riskLevel !== "no_concerns",
  );
  const harmReductionRate = rateOf(
    withConcerns.filter((p) => p.harmReductionPlanInPlace),
    withConcerns,
  );
  if (harmReductionRate !== null) {
    maxScore += 6;
    if (harmReductionRate >= 90) score += 6;
    else if (harmReductionRate >= 70) score += 4;
    else if (harmReductionRate >= 50) score += 3;
    else if (harmReductionRate > 0) score += 1;
  }

  // Referral made for medium+ risk
  const mediumPlus = profiles.filter(
    (p) =>
      p.riskLevel === "medium" ||
      p.riskLevel === "high" ||
      p.riskLevel === "active_use",
  );
  const referralMadeRate = rateOf(
    mediumPlus.filter((p) => p.professionalReferralMade),
    mediumPlus,
  );
  if (referralMadeRate !== null) {
    maxScore += 6;
    if (referralMadeRate >= 90) score += 6;
    else if (referralMadeRate >= 70) score += 4;
    else if (referralMadeRate >= 50) score += 3;
    else if (referralMadeRate > 0) score += 1;
  }

  return {
    overallScore: Math.round((Math.min(score, maxScore) / maxScore) * 25),
    totalProfiles: profiles.length,
    screenedRate,
    reviewCurrentRate,
    noConcernsRate,
    referralMadeRate,
    harmReductionRate,
  };
}

/**
 * Evaluates education and prevention activities.
 * Empty = 0 (no sessions = no prevention work).
 *
 *   High engagement rate          → 0-7
 *   Resources provided rate       → 0-6
 *   Session type variety          → 0-6
 *   Children reached              → 0-6
 */
export function evaluateEducationPrevention(
  sessions: AwarenessSession[],
  totalChildren: number,
): EducationPreventionResult {
  if (sessions.length === 0) {
    return {
      overallScore: 0,
      totalSessions: 0,
      highEngagementRate: null,
      resourcesProvidedRate: null,
      sessionTypeVariety: 0,
      childrenReachedRate: null,
    };
  }

  let score = 0;

  const highEngagement = sessions.filter(
    (s) => s.childEngagement === "high",
  ).length;
  const highEngagementRate = rate(highEngagement, sessions.length);
  if (meets(highEngagementRate, 80)) score += 7;
  else if (meets(highEngagementRate, 60)) score += 5;
  else if (meets(highEngagementRate, 40)) score += 3;
  else if (above(highEngagementRate, 0)) score += 1;

  const resourcesProvided = sessions.filter(
    (s) => s.resourcesProvided,
  ).length;
  const resourcesProvidedRate = rate(resourcesProvided, sessions.length);
  if (meets(resourcesProvidedRate, 90)) score += 6;
  else if (meets(resourcesProvidedRate, 70)) score += 4;
  else if (meets(resourcesProvidedRate, 50)) score += 3;
  else if (above(resourcesProvidedRate, 0)) score += 1;

  // Session type variety
  const uniqueTypes = new Set(sessions.map((s) => s.sessionType));
  const sessionTypeVariety = uniqueTypes.size;
  if (sessionTypeVariety >= 4) score += 6;
  else if (sessionTypeVariety >= 3) score += 4;
  else if (sessionTypeVariety >= 2) score += 3;
  else score += 1;

  // Children reached
  const uniqueChildren = new Set(sessions.flatMap((s) => s.childrenAttended));
  const childrenReachedRate =
    totalChildren > 0 ? rate(uniqueChildren.size, totalChildren) : 0;
  if (meets(childrenReachedRate, 90)) score += 6;
  else if (meets(childrenReachedRate, 70)) score += 4;
  else if (meets(childrenReachedRate, 50)) score += 3;
  else if (above(childrenReachedRate, 0)) score += 1;

  return {
    overallScore: Math.min(score, 25),
    totalSessions: sessions.length,
    highEngagementRate,
    resourcesProvidedRate,
    sessionTypeVariety,
    childrenReachedRate,
  };
}

/**
 * Evaluates intervention and support response.
 * Empty (no interventions needed) = 25 (no substance issues = excellent).
 *
 *   Engaged rate (engaged + completed) → 0-7
 *   Recovery plan rate                 → 0-7
 *   Follow-up scheduled                → 0-6
 *   Parent/SW notified                 → 0-5
 */
export function evaluateInterventionSupport(
  interventions: SubstanceIntervention[],
): InterventionSupportResult {
  if (interventions.length === 0) {
    return {
      overallScore: 25,
      totalInterventions: 0,
      engagedRate: null,
      recoveryPlanRate: null,
      followUpRate: null,
      parentNotifiedRate: null,
    };
  }

  let score = 0;

  const engaged = interventions.filter(
    (i) =>
      i.interventionOutcome === "engaged" ||
      i.interventionOutcome === "completed" ||
      i.interventionOutcome === "ongoing",
  ).length;
  const engagedRate = rate(engaged, interventions.length);
  if (meets(engagedRate, 90)) score += 7;
  else if (meets(engagedRate, 70)) score += 5;
  else if (meets(engagedRate, 50)) score += 3;
  else if (above(engagedRate, 0)) score += 1;

  const recoveryPlan = interventions.filter(
    (i) => i.recoveryPlanInPlace,
  ).length;
  const recoveryPlanRate = rate(recoveryPlan, interventions.length);
  if (meets(recoveryPlanRate, 90)) score += 7;
  else if (meets(recoveryPlanRate, 70)) score += 5;
  else if (meets(recoveryPlanRate, 50)) score += 3;
  else if (above(recoveryPlanRate, 0)) score += 1;

  const followUp = interventions.filter(
    (i) => i.followUpScheduled,
  ).length;
  const followUpRate = rate(followUp, interventions.length);
  if (meets(followUpRate, 90)) score += 6;
  else if (meets(followUpRate, 70)) score += 4;
  else if (meets(followUpRate, 50)) score += 3;
  else if (above(followUpRate, 0)) score += 1;

  const parentNotified = interventions.filter(
    (i) => i.parentNotified,
  ).length;
  const parentNotifiedRate = rate(parentNotified, interventions.length);
  if (meets(parentNotifiedRate, 90)) score += 5;
  else if (meets(parentNotifiedRate, 70)) score += 3;
  else if (meets(parentNotifiedRate, 50)) score += 2;
  else if (above(parentNotifiedRate, 0)) score += 1;

  return {
    overallScore: Math.min(score, 25),
    totalInterventions: interventions.length,
    engagedRate,
    recoveryPlanRate,
    followUpRate,
    parentNotifiedRate,
  };
}

/**
 * Evaluates staff training and competence.
 * Empty = 0 (no trained staff = no readiness).
 *
 *   Substance awareness           → 0-6
 *   Risk screening                → 0-5
 *   Harm reduction                → 0-5
 *   Motivational interviewing     → 0-4
 *   Referral pathway              → 0-3
 *   Emergency response            → 0-2
 */
export function evaluateStaffSubstanceReadiness(
  training: StaffSubstanceTraining[],
): StaffSubstanceReadinessResult {
  if (training.length === 0) {
    return {
      overallScore: 0,
      totalStaff: 0,
      substanceAwarenessRate: null,
      riskScreeningRate: null,
      harmReductionRate: null,
      motivationalRate: null,
      referralPathwayRate: null,
      emergencyResponseRate: null,
    };
  }

  let score = 0;

  const awareness = training.filter((t) => t.substanceAwareness).length;
  const substanceAwarenessRate = rate(awareness, training.length);
  if (meets(substanceAwarenessRate, 90)) score += 6;
  else if (meets(substanceAwarenessRate, 70)) score += 4;
  else if (meets(substanceAwarenessRate, 50)) score += 3;
  else if (above(substanceAwarenessRate, 0)) score += 1;

  const screening = training.filter((t) => t.riskScreeningTrained).length;
  const riskScreeningRate = rate(screening, training.length);
  if (meets(riskScreeningRate, 90)) score += 5;
  else if (meets(riskScreeningRate, 70)) score += 3;
  else if (meets(riskScreeningRate, 50)) score += 2;
  else if (above(riskScreeningRate, 0)) score += 1;

  const harmReduction = training.filter(
    (t) => t.harmReductionTrained,
  ).length;
  const harmReductionRate = rate(harmReduction, training.length);
  if (meets(harmReductionRate, 90)) score += 5;
  else if (meets(harmReductionRate, 70)) score += 3;
  else if (meets(harmReductionRate, 50)) score += 2;
  else if (above(harmReductionRate, 0)) score += 1;

  const motivational = training.filter(
    (t) => t.motivationalInterviewing,
  ).length;
  const motivationalRate = rate(motivational, training.length);
  if (meets(motivationalRate, 90)) score += 4;
  else if (meets(motivationalRate, 70)) score += 3;
  else if (meets(motivationalRate, 50)) score += 2;
  else if (above(motivationalRate, 0)) score += 1;

  const referral = training.filter(
    (t) => t.referralPathwayKnowledge,
  ).length;
  const referralPathwayRate = rate(referral, training.length);
  if (meets(referralPathwayRate, 90)) score += 3;
  else if (meets(referralPathwayRate, 70)) score += 2;
  else if (meets(referralPathwayRate, 50)) score += 1;

  const emergency = training.filter(
    (t) => t.emergencyResponseTrained,
  ).length;
  const emergencyResponseRate = rate(emergency, training.length);
  if (meets(emergencyResponseRate, 90)) score += 2;
  else if (meets(emergencyResponseRate, 70)) score += 1;

  return {
    overallScore: Math.min(score, 25),
    totalStaff: training.length,
    substanceAwarenessRate,
    riskScreeningRate,
    harmReductionRate,
    motivationalRate,
    referralPathwayRate,
    emergencyResponseRate,
  };
}

// -- Child Profiles ------------------------------------------------------------

export function buildChildSubstanceSummaries(
  profiles: ChildSubstanceProfile[],
  sessions: AwarenessSession[],
): ChildSubstanceSummary[] {
  return profiles.map((profile) => {
    const sessionsAttended = sessions.filter((s) =>
      s.childrenAttended.includes(profile.childId),
    ).length;

    const substancesConcern = profile.substancesOfConcern.filter(
      (s) => s !== "none",
    ).length;

    // Score 0-10
    let score = 0;

    // Screening done (0-2)
    score += 2;

    // Review current (0-2)
    if (profile.reviewCurrent) score += 2;

    // Risk level bonus (0-3, lower risk = better)
    if (profile.riskLevel === "no_concerns") score += 3;
    else if (profile.riskLevel === "low") score += 2;
    else if (profile.riskLevel === "medium") score += 1;

    // Harm reduction plan if needed (0-2)
    if (profile.riskLevel === "no_concerns") {
      score += 2;
    } else if (profile.harmReductionPlanInPlace) {
      score += 2;
    }

    // Sessions attended (0-1)
    if (sessionsAttended > 0) score += 1;

    return {
      childId: profile.childId,
      childName: profile.childName,
      riskLevel: profile.riskLevel,
      screeningOutcome: profile.screeningOutcome,
      substancesConcern,
      hasHarmReductionPlan: profile.harmReductionPlanInPlace,
      sessionsAttended,
      overallScore: Math.min(Math.max(score, 0), 10),
    };
  });
}

// -- Main generator ------------------------------------------------------------

export function generateSubstanceMisuseAwarenessIntelligence(
  profiles: ChildSubstanceProfile[],
  sessions: AwarenessSession[],
  interventions: SubstanceIntervention[],
  training: StaffSubstanceTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): SubstanceMisuseAwarenessIntelligence {
  const riskScreening = evaluateRiskScreening(profiles);
  const educationPrevention = evaluateEducationPrevention(
    sessions,
    profiles.length,
  );
  const interventionSupport = evaluateInterventionSupport(interventions);
  const staffSubstanceReadiness =
    evaluateStaffSubstanceReadiness(training);

  const rawScore =
    riskScreening.overallScore +
    educationPrevention.overallScore +
    interventionSupport.overallScore +
    staffSubstanceReadiness.overallScore;
  const overallScore = Math.min(rawScore, 100);
  const rating = getRating(overallScore);

  const childProfiles = buildChildSubstanceSummaries(profiles, sessions);

  // -- Strengths ---------------------------------------------------------------
  const strengths: string[] = [];

  if (riskScreening.screenedRate === 100 && profiles.length > 0) {
    strengths.push(
      "All children screened for substance misuse risk — comprehensive assessment coverage",
    );
  }
  if (meets(riskScreening.reviewCurrentRate, 90) && profiles.length > 0) {
    strengths.push(
      "Substance risk assessments consistently reviewed and kept current",
    );
  }
  if (meets(educationPrevention.highEngagementRate, 80) && sessions.length > 0) {
    strengths.push(
      "High levels of child engagement in substance awareness sessions",
    );
  }
  if (interventionSupport.totalInterventions === 0) {
    strengths.push(
      "No substance misuse interventions required during the assessment period",
    );
  }
  if (
    meets(interventionSupport.engagedRate, 80) &&
    interventions.length > 0
  ) {
    strengths.push(
      "Strong engagement rate with substance misuse interventions",
    );
  }
  if (
    meets(staffSubstanceReadiness.substanceAwarenessRate, 90) &&
    training.length > 0
  ) {
    strengths.push(
      "Staff team demonstrates high levels of substance awareness training",
    );
  }
  if (meets(riskScreening.noConcernsRate, 80) && profiles.length > 0) {
    strengths.push(
      "Majority of children have no substance misuse concerns identified",
    );
  }

  // -- Areas for improvement ---------------------------------------------------
  const areasForImprovement: string[] = [];

  if (below(riskScreening.reviewCurrentRate, 70) && profiles.length > 0) {
    areasForImprovement.push(
      "Substance risk assessment reviews not consistently up to date",
    );
  }
  if (
    educationPrevention.sessionTypeVariety < 3 &&
    sessions.length > 0
  ) {
    areasForImprovement.push(
      "Limited variety of substance awareness session types — diversify approach",
    );
  }
  if (
    below(educationPrevention.childrenReachedRate, 70) &&
    sessions.length > 0
  ) {
    areasForImprovement.push(
      "Not all children attending substance awareness sessions",
    );
  }
  if (
    below(interventionSupport.recoveryPlanRate, 70) &&
    interventions.length > 0
  ) {
    areasForImprovement.push(
      "Recovery plans not consistently in place for children receiving interventions",
    );
  }
  if (
    below(staffSubstanceReadiness.harmReductionRate, 70) &&
    training.length > 0
  ) {
    areasForImprovement.push(
      "Harm reduction training coverage insufficient across staff team",
    );
  }
  if (
    below(staffSubstanceReadiness.motivationalRate, 60) &&
    training.length > 0
  ) {
    areasForImprovement.push(
      "Motivational interviewing skills need development within staff team",
    );
  }

  // -- Actions -----------------------------------------------------------------
  const actions: string[] = [];

  if (profiles.length === 0) {
    actions.push(
      "URGENT: No substance misuse screening records — implement universal screening for all children",
    );
  }
  if (sessions.length === 0) {
    actions.push(
      "URGENT: No substance awareness sessions conducted — establish regular prevention programme",
    );
  }
  if (training.length === 0) {
    actions.push(
      "URGENT: No staff substance misuse training records — deliver comprehensive training",
    );
  }
  if (
    below(interventionSupport.engagedRate, 50) &&
    interventions.length > 0
  ) {
    actions.push(
      "URGENT: Low engagement with substance interventions — review approach and consider alternatives",
    );
  }
  const activeUse = profiles.filter(
    (p) => p.riskLevel === "active_use",
  );
  if (activeUse.length > 0) {
    actions.push(
      "URGENT: Children identified with active substance use — ensure immediate professional referral and support",
    );
  }
  if (below(riskScreening.harmReductionRate, 50) && profiles.length > 0) {
    actions.push(
      "Develop harm reduction plans for all children with identified substance concerns",
    );
  }
  if (
    below(educationPrevention.resourcesProvidedRate, 50) &&
    sessions.length > 0
  ) {
    actions.push(
      "Ensure substance awareness resources are provided in all education sessions",
    );
  }

  // -- Regulatory links --------------------------------------------------------
  const regulatoryLinks: string[] = [
    "CHR 2015 Reg 10 — The health and well-being standard (substance misuse support)",
    "CHR 2015 Reg 12 — The protection of children standard",
    "SCCIF — Social Care Common Inspection Framework (health outcomes)",
    "NMS 3 — National Minimum Standards (health and wellbeing)",
    "KCSIE 2024 — Keeping Children Safe in Education (substance misuse risks)",
    "UNCRC Article 33 — Protection from narcotic drugs and psychotropic substances",
    "Drug Strategy 2021 — From Harm to Hope (prevention and recovery)",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    riskScreening,
    educationPrevention,
    interventionSupport,
    staffSubstanceReadiness,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
