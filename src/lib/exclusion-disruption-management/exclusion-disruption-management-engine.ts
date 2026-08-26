import { below, rate } from "@/lib/metrics/rate";
// ==============================================================================
// EXCLUSION & DISRUPTION MANAGEMENT INTELLIGENCE ENGINE
//
// Pure deterministic engine for assessing how the home manages school
// exclusions and placement disruptions — prevention strategies, education
// continuity, reintegration support, and multi-agency coordination.
//
// Regulatory basis:
//   - Education Act 2002 — Duty to safeguard and promote welfare in education
//   - CHR 2015, Reg 8 — The education standard
//   - SCCIF — Experiences and progress: education, employment and training
//   - Virtual School Head Guidance — Oversight of looked-after children's education
//   - SEN Code of Practice 2015 — Special educational needs support
//   - UNCRC Article 28 — Right to education
//   - UNCRC Article 29 — Goals of education: fullest development of the child
//
// No AI. No external calls. Pure input -> output.
// ==============================================================================

// -- Types --------------------------------------------------------------------

export type ExclusionType =
  | "fixed_term"
  | "permanent"
  | "internal"
  | "informal"
  | "managed_move";

export type DisruptionType =
  | "school_exclusion"
  | "placement_at_risk"
  | "unplanned_move"
  | "emergency_placement"
  | "placement_breakdown";

export type PreventionStrategy =
  | "early_warning_meeting"
  | "pep_review"
  | "behaviour_support_plan"
  | "therapeutic_intervention"
  | "mediation"
  | "restorative_practice"
  | "alternative_provision";

export type ReintegrationStatus =
  | "successful"
  | "in_progress"
  | "failed"
  | "not_applicable";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// -- Input Interfaces ---------------------------------------------------------

export interface ExclusionRecord {
  id: string;
  childId: string;
  childName: string;
  date: string;
  exclusionType: ExclusionType;
  durationDays: number;
  reason: string;
  schoolName: string;
  alternativeProvisionArranged: boolean;
  educationContinuityMaintained: boolean;
  reintegrationStatus: ReintegrationStatus;
  parentNotified: boolean;
  socialWorkerNotified: boolean;
  pepReviewed: boolean;
}

export interface DisruptionEpisode {
  id: string;
  childId: string;
  childName: string;
  date: string;
  disruptionType: DisruptionType;
  preventionStrategiesUsed: PreventionStrategy[];
  multiAgencyInvolved: boolean;
  outcomeResolved: boolean;
  lessonsIdentified: boolean;
  planUpdated: boolean;
}

export interface PreventionPlan {
  id: string;
  childId: string;
  childName: string;
  planDate: string;
  earlyWarningSignsDocumented: boolean;
  triggersIdentified: boolean;
  strategiesAgreed: PreventionStrategy[];
  schoolEngaged: boolean;
  reviewDate: string;
  reviewCurrent: boolean;
}

export interface StaffExclusionTraining {
  id: string;
  staffId: string;
  staffName: string;
  exclusionGuidanceTrained: boolean;
  educationAdvocacy: boolean;
  alternativeProvision: boolean;
  reintegrationSupport: boolean;
  multiAgencyWorking: boolean;
  traumaInformedBehaviour: boolean;
}

// -- Result Interfaces --------------------------------------------------------

export interface PreventionEffectivenessResult {
  overallScore: number;
  totalDisruptions: number;
  totalExclusions: number;
  /** null when the population is empty — nothing measured, not 0%. */
  preventionStrategiesUsedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  multiAgencyInvolvedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  outcomesResolvedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  lessonsIdentifiedRate: number | null;
}

export interface EducationContinuityResult {
  overallScore: number;
  totalExclusions: number;
  /** null when the population is empty — nothing measured, not 0%. */
  alternativeProvisionRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  educationContinuityRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  pepReviewedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  reintegrationSuccessRate: number | null;
}

export interface PreventionPlanningResult {
  overallScore: number;
  totalPlans: number;
  /** null when no plans exist to measure. */
  plansExistRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  triggersIdentifiedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  schoolEngagedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  reviewCurrentRate: number | null;
}

export interface StaffReadinessResult {
  overallScore: number;
  totalStaff: number;
  /** null when the population is empty — nothing measured, not 0%. */
  exclusionGuidanceRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  educationAdvocacyRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  alternativeProvisionRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  reintegrationRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  multiAgencyRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  traumaInformedRate: number | null;
}

export interface ChildExclusionProfile {
  childId: string;
  childName: string;
  exclusionCount: number;
  totalExclusionDays: number;
  hasPreventionPlan: boolean;
  preventionPlanCurrent: boolean;
  reintegrationStatus: ReintegrationStatus | null;
  overallScore: number;
}

export interface ExclusionDisruptionManagementIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  preventionEffectiveness: PreventionEffectivenessResult;
  educationContinuity: EducationContinuityResult;
  preventionPlanning: PreventionPlanningResult;
  staffReadiness: StaffReadinessResult;
  childProfiles: ChildExclusionProfile[];
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

const EXCLUSION_TYPE_LABELS: Record<ExclusionType, string> = {
  fixed_term: "Fixed Term",
  permanent: "Permanent",
  internal: "Internal",
  informal: "Informal",
  managed_move: "Managed Move",
};

const DISRUPTION_TYPE_LABELS: Record<DisruptionType, string> = {
  school_exclusion: "School Exclusion",
  placement_at_risk: "Placement at Risk",
  unplanned_move: "Unplanned Move",
  emergency_placement: "Emergency Placement",
  placement_breakdown: "Placement Breakdown",
};

const PREVENTION_STRATEGY_LABELS: Record<PreventionStrategy, string> = {
  early_warning_meeting: "Early Warning Meeting",
  pep_review: "PEP Review",
  behaviour_support_plan: "Behaviour Support Plan",
  therapeutic_intervention: "Therapeutic Intervention",
  mediation: "Mediation",
  restorative_practice: "Restorative Practice",
  alternative_provision: "Alternative Provision",
};

const REINTEGRATION_STATUS_LABELS: Record<ReintegrationStatus, string> = {
  successful: "Successful",
  in_progress: "In Progress",
  failed: "Failed",
  not_applicable: "Not Applicable",
};

const RATING_LABELS: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getExclusionTypeLabel(v: ExclusionType): string { return EXCLUSION_TYPE_LABELS[v]; }
export function getDisruptionTypeLabel(v: DisruptionType): string { return DISRUPTION_TYPE_LABELS[v]; }
export function getPreventionStrategyLabel(v: PreventionStrategy): string { return PREVENTION_STRATEGY_LABELS[v]; }
export function getReintegrationStatusLabel(v: ReintegrationStatus): string { return REINTEGRATION_STATUS_LABELS[v]; }
export function getRatingLabel(v: Rating): string { return RATING_LABELS[v]; }

// -- Evaluators ---------------------------------------------------------------

/**
 * Evaluates prevention effectiveness across disruption episodes.
 * Empty (no exclusions AND no disruptions) = 25 (no disruptions = excellent).
 * Otherwise measures strategies used, multi-agency, outcomes, lessons.
 */
export function evaluatePreventionEffectiveness(
  exclusions: ExclusionRecord[],
  disruptions: DisruptionEpisode[],
): PreventionEffectivenessResult {
  if (exclusions.length === 0 && disruptions.length === 0) {
    return {
      overallScore: 25,
      totalDisruptions: 0,
      totalExclusions: 0,
      preventionStrategiesUsedRate: null,
      multiAgencyInvolvedRate: null,
      outcomesResolvedRate: null,
      lessonsIdentifiedRate: null,
    };
  }

  const totalDisruptions = disruptions.length;
  const totalExclusions = exclusions.length;

  const strategiesUsed = disruptions.filter((d) => d.preventionStrategiesUsed.length > 0).length;
  const multiAgency = disruptions.filter((d) => d.multiAgencyInvolved).length;
  const resolved = disruptions.filter((d) => d.outcomeResolved).length;
  const lessons = disruptions.filter((d) => d.lessonsIdentified).length;

  const preventionStrategiesUsedRate = rate(strategiesUsed, totalDisruptions);
  const multiAgencyInvolvedRate = rate(multiAgency, totalDisruptions);
  const outcomesResolvedRate = rate(resolved, totalDisruptions);
  const lessonsIdentifiedRate = rate(lessons, totalDisruptions);

  // Scoring: strategies used (0-7), multi-agency (0-6), outcomes resolved (0-6), lessons (0-6)
  let score = 0;
  score += Math.round(((preventionStrategiesUsedRate ?? 0) / 100) * 7);
  score += Math.round(((multiAgencyInvolvedRate ?? 0) / 100) * 6);
  score += Math.round(((outcomesResolvedRate ?? 0) / 100) * 6);
  score += Math.round(((lessonsIdentifiedRate ?? 0) / 100) * 6);

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    totalDisruptions,
    totalExclusions,
    preventionStrategiesUsedRate,
    multiAgencyInvolvedRate,
    outcomesResolvedRate,
    lessonsIdentifiedRate,
  };
}

/**
 * Evaluates education continuity during exclusion episodes.
 * Empty (no exclusions) = 25 (no exclusions = excellent).
 */
export function evaluateEducationContinuity(
  exclusions: ExclusionRecord[],
): EducationContinuityResult {
  if (exclusions.length === 0) {
    return {
      overallScore: 25,
      totalExclusions: 0,
      alternativeProvisionRate: null,
      educationContinuityRate: null,
      pepReviewedRate: null,
      reintegrationSuccessRate: null,
    };
  }

  const altProvision = exclusions.filter((e) => e.alternativeProvisionArranged).length;
  const continuity = exclusions.filter((e) => e.educationContinuityMaintained).length;
  const pepReviewed = exclusions.filter((e) => e.pepReviewed).length;
  const reintegrationApplicable = exclusions.filter((e) => e.reintegrationStatus !== "not_applicable");
  const reintegrationSuccess = reintegrationApplicable.filter((e) => e.reintegrationStatus === "successful").length;

  const alternativeProvisionRate = rate(altProvision, exclusions.length);
  const educationContinuityRate = rate(continuity, exclusions.length);
  const pepReviewedRate = rate(pepReviewed, exclusions.length);
  const reintegrationSuccessRate = rate(reintegrationSuccess, reintegrationApplicable.length);

  // Scoring: alternative provision (0-7), education continuity (0-7), PEP reviewed (0-6), reintegration (0-5)
  let score = 0;
  score += Math.round((alternativeProvisionRate! / 100) * 7);
  score += Math.round((educationContinuityRate! / 100) * 7);
  score += Math.round((pepReviewedRate! / 100) * 6);
  score += Math.round(((reintegrationSuccessRate ?? 0) / 100) * 5);

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    totalExclusions: exclusions.length,
    alternativeProvisionRate,
    educationContinuityRate,
    pepReviewedRate,
    reintegrationSuccessRate,
  };
}

/**
 * Evaluates prevention planning quality.
 * Empty = 0 (no plans = non-compliant).
 */
export function evaluatePreventionPlanning(
  plans: PreventionPlan[],
): PreventionPlanningResult {
  if (plans.length === 0) {
    return {
      overallScore: 0,
      totalPlans: 0,
      plansExistRate: null,
      triggersIdentifiedRate: null,
      schoolEngagedRate: null,
      reviewCurrentRate: null,
    };
  }

  const triggers = plans.filter((p) => p.triggersIdentified).length;
  const schoolEngaged = plans.filter((p) => p.schoolEngaged).length;
  const reviewCurrent = plans.filter((p) => p.reviewCurrent).length;

  const plansExistRate = 100; // plans exist if we have them
  const triggersIdentifiedRate = rate(triggers, plans.length);
  const schoolEngagedRate = rate(schoolEngaged, plans.length);
  const reviewCurrentRate = rate(reviewCurrent, plans.length);

  // Scoring: plans exist (0-7), triggers identified (0-6), school engaged (0-6), review current (0-6)
  let score = 0;
  score += Math.round((plansExistRate / 100) * 7);
  score += Math.round((triggersIdentifiedRate! / 100) * 6);
  score += Math.round((schoolEngagedRate! / 100) * 6);
  score += Math.round((reviewCurrentRate! / 100) * 6);

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    totalPlans: plans.length,
    plansExistRate,
    triggersIdentifiedRate,
    schoolEngagedRate,
    reviewCurrentRate,
  };
}

/**
 * Evaluates staff readiness for exclusion and disruption management.
 * Empty = 0 (no staff training = non-compliant).
 */
export function evaluateStaffReadiness(
  training: StaffExclusionTraining[],
): StaffReadinessResult {
  if (training.length === 0) {
    return {
      overallScore: 0,
      totalStaff: 0,
      exclusionGuidanceRate: null,
      educationAdvocacyRate: null,
      alternativeProvisionRate: null,
      reintegrationRate: null,
      multiAgencyRate: null,
      traumaInformedRate: null,
    };
  }

  let guidance = 0;
  let advocacy = 0;
  let altProvision = 0;
  let reintegration = 0;
  let multiAgency = 0;
  let traumaInformed = 0;

  for (const t of training) {
    if (t.exclusionGuidanceTrained) guidance++;
    if (t.educationAdvocacy) advocacy++;
    if (t.alternativeProvision) altProvision++;
    if (t.reintegrationSupport) reintegration++;
    if (t.multiAgencyWorking) multiAgency++;
    if (t.traumaInformedBehaviour) traumaInformed++;
  }

  const exclusionGuidanceRate = rate(guidance, training.length);
  const educationAdvocacyRate = rate(advocacy, training.length);
  const alternativeProvisionRate = rate(altProvision, training.length);
  const reintegrationRate = rate(reintegration, training.length);
  const multiAgencyRate = rate(multiAgency, training.length);
  const traumaInformedRate = rate(traumaInformed, training.length);

  // Scoring: exclusion guidance (0-6), education advocacy (0-5), alternative provision (0-5),
  // reintegration (0-4), multi-agency (0-3), trauma-informed (0-2)
  let score = 0;
  score += Math.round((exclusionGuidanceRate! / 100) * 6);
  score += Math.round(((educationAdvocacyRate ?? 0) / 100) * 5);
  score += Math.round(((alternativeProvisionRate ?? 0) / 100) * 5);
  score += Math.round(((reintegrationRate ?? 0) / 100) * 4);
  score += Math.round(((multiAgencyRate ?? 0) / 100) * 3);
  score += Math.round(((traumaInformedRate ?? 0) / 100) * 2);

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    totalStaff: training.length,
    exclusionGuidanceRate,
    educationAdvocacyRate,
    alternativeProvisionRate,
    reintegrationRate,
    multiAgencyRate,
    traumaInformedRate,
  };
}

// -- Child Profiles -----------------------------------------------------------

export function buildChildExclusionProfiles(
  exclusions: ExclusionRecord[],
  plans: PreventionPlan[],
): ChildExclusionProfile[] {
  const childIds = new Set<string>();
  const childNames = new Map<string, string>();

  for (const e of exclusions) {
    childIds.add(e.childId);
    childNames.set(e.childId, e.childName);
  }
  for (const p of plans) {
    childIds.add(p.childId);
    childNames.set(p.childId, p.childName);
  }

  return Array.from(childIds).map((childId) => {
    const childExclusions = exclusions.filter((e) => e.childId === childId);
    const childPlans = plans.filter((p) => p.childId === childId);

    const exclusionCount = childExclusions.length;
    const totalExclusionDays = childExclusions.reduce((sum, e) => sum + e.durationDays, 0);
    const hasPreventionPlan = childPlans.length > 0;
    const preventionPlanCurrent = childPlans.some((p) => p.reviewCurrent);

    // Latest reintegration status (or null if no exclusions)
    let reintegrationStatus: ReintegrationStatus | null = null;
    if (childExclusions.length > 0) {
      const sorted = [...childExclusions].sort((a, b) => b.date.localeCompare(a.date));
      reintegrationStatus = sorted[0].reintegrationStatus;
    }

    // Score 0-10
    let score = 0;

    // No exclusions = great baseline
    if (exclusionCount === 0) {
      score += 4;
    } else if (exclusionCount === 1) {
      score += 2;
    }

    // Prevention plan exists and is current
    if (hasPreventionPlan) score += 2;
    if (preventionPlanCurrent) score += 1;

    // Education continuity maintained for all exclusions
    if (childExclusions.length > 0) {
      const continuity = childExclusions.filter((e) => e.educationContinuityMaintained).length;
      score += Math.round((rate(continuity, childExclusions.length)! / 100) * 2);
    } else {
      score += 2; // No exclusions = continuity maintained by default
    }

    // Reintegration success
    if (reintegrationStatus === "successful") score += 1;
    else if (reintegrationStatus === "in_progress") score += 1;
    else if (reintegrationStatus === null || reintegrationStatus === "not_applicable") score += 0;

    return {
      childId,
      childName: childNames.get(childId) || "Unknown",
      exclusionCount,
      totalExclusionDays,
      hasPreventionPlan,
      preventionPlanCurrent,
      reintegrationStatus,
      overallScore: Math.min(10, score),
    };
  });
}

// -- Main Function ------------------------------------------------------------

export function generateExclusionDisruptionManagementIntelligence(
  exclusions: ExclusionRecord[],
  disruptions: DisruptionEpisode[],
  plans: PreventionPlan[],
  training: StaffExclusionTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): ExclusionDisruptionManagementIntelligence {
  const preventionEffectiveness = evaluatePreventionEffectiveness(exclusions, disruptions);
  const educationContinuity = evaluateEducationContinuity(exclusions);
  const preventionPlanning = evaluatePreventionPlanning(plans);
  const staffReadiness = evaluateStaffReadiness(training);

  const rawScore =
    preventionEffectiveness.overallScore +
    educationContinuity.overallScore +
    preventionPlanning.overallScore +
    staffReadiness.overallScore;

  const overallScore = Math.min(100, Math.max(0, rawScore));
  const rating = getRating(overallScore);

  const childProfiles = buildChildExclusionProfiles(exclusions, plans);

  // -- Strengths --
  const strengths: string[] = [];
  if (exclusions.length === 0 && disruptions.length === 0)
    strengths.push("No exclusions or disruption episodes recorded in period");
  if (exclusions.length === 0 && disruptions.length > 0)
    strengths.push("No school exclusions despite disruption episodes — strong prevention");
  if (disruptions.length > 0 && preventionEffectiveness.outcomesResolvedRate === 100)
    strengths.push("All disruption episodes resolved successfully");
  if (disruptions.length > 0 && preventionEffectiveness.multiAgencyInvolvedRate === 100)
    strengths.push("Multi-agency involvement in all disruption episodes");
  if (disruptions.length > 0 && preventionEffectiveness.preventionStrategiesUsedRate === 100)
    strengths.push("Prevention strategies used in all disruption episodes");
  if (exclusions.length > 0 && educationContinuity.alternativeProvisionRate === 100)
    strengths.push("Alternative provision arranged for all exclusions");
  if (exclusions.length > 0 && educationContinuity.educationContinuityRate === 100)
    strengths.push("Education continuity maintained throughout all exclusions");
  if (exclusions.length > 0 && educationContinuity.pepReviewedRate === 100)
    strengths.push("PEP reviewed for all exclusion episodes");
  if (plans.length > 0 && preventionPlanning.reviewCurrentRate === 100)
    strengths.push("All prevention plans are current and reviewed");
  if (plans.length > 0 && preventionPlanning.schoolEngagedRate === 100)
    strengths.push("School engaged in all prevention plans");
  if (training.length > 0 && staffReadiness.exclusionGuidanceRate === 100)
    strengths.push("All staff trained in exclusion guidance");
  if (training.length > 0 && staffReadiness.traumaInformedRate === 100)
    strengths.push("All staff trained in trauma-informed behaviour approaches");

  // -- Areas for Improvement --
  const areasForImprovement: string[] = [];
  if (plans.length === 0)
    areasForImprovement.push("No prevention plans documented — all children should have exclusion prevention plans");
  if (training.length === 0)
    areasForImprovement.push("No staff training records for exclusion and disruption management");
  if (exclusions.length > 0 && below(educationContinuity.alternativeProvisionRate, 100))
    areasForImprovement.push("Alternative provision not arranged for " + (100 - educationContinuity.alternativeProvisionRate!) + "% of exclusions");
  if (exclusions.length > 0 && below(educationContinuity.pepReviewedRate, 100))
    areasForImprovement.push("PEP not reviewed for " + (100 - educationContinuity.pepReviewedRate!) + "% of exclusions");
  if (disruptions.length > 0 && below(preventionEffectiveness.multiAgencyInvolvedRate, 80))
    areasForImprovement.push("Multi-agency involvement in only " + preventionEffectiveness.multiAgencyInvolvedRate + "% of disruption episodes — target 100%");
  if (disruptions.length > 0 && below(preventionEffectiveness.lessonsIdentifiedRate, 80))
    areasForImprovement.push("Lessons identified in only " + preventionEffectiveness.lessonsIdentifiedRate + "% of disruption episodes");
  if (plans.length > 0 && below(preventionPlanning.triggersIdentifiedRate, 100))
    areasForImprovement.push("Triggers not identified in " + (100 - preventionPlanning.triggersIdentifiedRate!) + "% of prevention plans");
  if (plans.length > 0 && below(preventionPlanning.reviewCurrentRate, 100))
    areasForImprovement.push(100 - preventionPlanning.reviewCurrentRate! + "% of prevention plans are overdue for review");
  if (training.length > 0 && below(staffReadiness.traumaInformedRate, 75))
    areasForImprovement.push("Only " + staffReadiness.traumaInformedRate + "% of staff trained in trauma-informed behaviour — target 100%");

  // -- Actions --
  const actions: string[] = [];
  const permanentExclusions = exclusions.filter((e) => e.exclusionType === "permanent");
  if (permanentExclusions.length > 0)
    actions.push("URGENT: " + permanentExclusions.length + " permanent exclusion(s) recorded — immediate senior management review required");
  const unresolvedDisruptions = disruptions.filter((d) => !d.outcomeResolved);
  if (unresolvedDisruptions.length > 0)
    actions.push("URGENT: " + unresolvedDisruptions.length + " unresolved disruption episode(s) — escalate for immediate action");
  const failedReintegrations = exclusions.filter((e) => e.reintegrationStatus === "failed");
  if (failedReintegrations.length > 0)
    actions.push("URGENT: " + failedReintegrations.length + " failed reintegration(s) — arrange emergency education review");
  const unnotifiedSW = exclusions.filter((e) => !e.socialWorkerNotified);
  if (unnotifiedSW.length > 0)
    actions.push("URGENT: Social worker not notified for " + unnotifiedSW.length + " exclusion(s) — statutory requirement");
  if (plans.length === 0)
    actions.push("Develop prevention plans for all children — required for proactive exclusion management");
  if (exclusions.length > 0 && below(educationContinuity.alternativeProvisionRate, 100))
    actions.push("Arrange alternative provision for all future exclusions — education continuity is a statutory duty");
  if (training.length > 0 && below(staffReadiness.exclusionGuidanceRate, 75))
    actions.push("Arrange exclusion guidance training — only " + staffReadiness.exclusionGuidanceRate + "% of staff trained");
  if (disruptions.length > 0 && below(preventionEffectiveness.lessonsIdentifiedRate, 100))
    actions.push("Ensure lessons are identified and recorded for all disruption episodes");

  const regulatoryLinks: string[] = [
    "Education Act 2002 — Duty to safeguard and promote welfare of children in education settings",
    "CHR 2015, Reg 8 — The education standard: promoting educational achievement of looked-after children",
    "SCCIF — Experiences and progress: education, employment and training outcomes",
    "Virtual School Head Guidance — Oversight and advocacy for looked-after children's education",
    "SEN Code of Practice 2015 — Supporting children with special educational needs during exclusions",
    "UNCRC Article 28 — Right to education on the basis of equal opportunity",
    "UNCRC Article 29 — Education directed to the fullest development of the child's potential",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    preventionEffectiveness,
    educationContinuity,
    preventionPlanning,
    staffReadiness,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
