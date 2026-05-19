// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Sensory Processing Support Intelligence Engine
//
// Pure deterministic engine — no AI, no external calls, no randomness.
// Evaluates how effectively a children's home identifies, assesses, and
// supports children with sensory processing differences through assessment
// quality, intervention effectiveness, policy frameworks, and staff readiness.
//
// Aligned to:
//   - CHR 2015 Reg 10 — Health and wellbeing (meeting individual health needs)
//   - CHR 2015 Reg 12 — Health care and therapy (access to therapeutic services)
//   - SCCIF           — Quality of care standard (health and wellbeing)
//   - SEND Code of Practice 2015 — Identifying and supporting SEN needs
//   - NMS 3           — Health and wellbeing (National Minimum Standards)
//   - Children Act 1989 — Welfare of the child paramount
//   - NICE CG170      — Autism in under 19s: recognition, referral and diagnosis
//
// No AI. No external calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ──────────────────────────────────────────────────────────────────

export type SensoryNeed =
  | "hyper_auditory"
  | "hypo_auditory"
  | "hyper_visual"
  | "hypo_visual"
  | "hyper_tactile"
  | "hypo_tactile"
  | "hyper_vestibular"
  | "hypo_vestibular"
  | "hyper_proprioceptive"
  | "hypo_proprioceptive"
  | "mixed";

export type InterventionType =
  | "sensory_diet"
  | "environmental_modification"
  | "therapeutic_activity"
  | "calming_strategy"
  | "alerting_strategy"
  | "equipment_provision"
  | "other";

export type Effectiveness =
  | "highly_effective"
  | "effective"
  | "partially_effective"
  | "not_effective"
  | "not_assessed";

export type ChildResponse =
  | "positive"
  | "neutral"
  | "negative"
  | "distressed";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// ── Label Maps ─────────────────────────────────────────────────────────────

const SENSORY_NEED_LABELS: Record<SensoryNeed, string> = {
  hyper_auditory: "Hyper-Auditory",
  hypo_auditory: "Hypo-Auditory",
  hyper_visual: "Hyper-Visual",
  hypo_visual: "Hypo-Visual",
  hyper_tactile: "Hyper-Tactile",
  hypo_tactile: "Hypo-Tactile",
  hyper_vestibular: "Hyper-Vestibular",
  hypo_vestibular: "Hypo-Vestibular",
  hyper_proprioceptive: "Hyper-Proprioceptive",
  hypo_proprioceptive: "Hypo-Proprioceptive",
  mixed: "Mixed",
};

const INTERVENTION_TYPE_LABELS: Record<InterventionType, string> = {
  sensory_diet: "Sensory Diet",
  environmental_modification: "Environmental Modification",
  therapeutic_activity: "Therapeutic Activity",
  calming_strategy: "Calming Strategy",
  alerting_strategy: "Alerting Strategy",
  equipment_provision: "Equipment Provision",
  other: "Other",
};

const EFFECTIVENESS_LABELS: Record<Effectiveness, string> = {
  highly_effective: "Highly Effective",
  effective: "Effective",
  partially_effective: "Partially Effective",
  not_effective: "Not Effective",
  not_assessed: "Not Assessed",
};

const CHILD_RESPONSE_LABELS: Record<ChildResponse, string> = {
  positive: "Positive",
  neutral: "Neutral",
  negative: "Negative",
  distressed: "Distressed",
};

const RATING_LABELS: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

// ── Label Getter Functions ─────────────────────────────────────────────────

export function getSensoryNeedLabel(need: SensoryNeed): string {
  return SENSORY_NEED_LABELS[need] ?? need.replace(/_/g, " ");
}

export function getInterventionTypeLabel(type: InterventionType): string {
  return INTERVENTION_TYPE_LABELS[type] ?? type.replace(/_/g, " ");
}

export function getEffectivenessLabel(eff: Effectiveness): string {
  return EFFECTIVENESS_LABELS[eff] ?? eff.replace(/_/g, " ");
}

export function getChildResponseLabel(resp: ChildResponse): string {
  return CHILD_RESPONSE_LABELS[resp] ?? resp.replace(/_/g, " ");
}

export function getRatingLabel(rating: Rating): string {
  return RATING_LABELS[rating] ?? rating.replace(/_/g, " ");
}

// ── Input Interfaces ───────────────────────────────────────────────────────

export interface SensoryAssessment {
  id: string;
  childId: string;
  childName: string;
  assessmentDate: string;
  assessedBy: string;
  sensoryNeeds: SensoryNeed[];
  sensoryPlanInPlace: boolean;
  occupationalTherapyReferred: boolean;
  environmentAdapted: boolean;
  parentCarerInformed: boolean;
}

export interface SensoryIntervention {
  id: string;
  childId: string;
  childName: string;
  interventionDate: string;
  interventionType: InterventionType;
  facilitatedBy: string;
  effectiveness: Effectiveness;
  childResponse: ChildResponse;
  sensoryPlanFollowed: boolean;
}

export interface SensoryPolicy {
  id: string;
  sensoryScreeningRoutine: boolean;
  occupationalTherapyAccess: boolean;
  environmentalAuditCompleted: boolean;
  sensoryToolsAvailable: boolean;
  staffTrainingProvided: boolean;
  individualSensoryPlans: boolean;
  parentCarerInvolvement: boolean;
}

export interface StaffSensoryTraining {
  id: string;
  staffId: string;
  staffName: string;
  sensoryAwareness: boolean;
  sensoryAssessment: boolean;
  environmentalAdaptation: boolean;
  interventionDelivery: boolean;
  calmingStrategies: boolean;
  equipmentUse: boolean;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface AssessmentQualityResult {
  totalAssessments: number;
  sensoryPlanRate: number;
  otReferralRate: number;
  environmentAdaptedRate: number;
  parentInformedRate: number;
  score: number;
}

export interface InterventionEffectivenessResult {
  totalInterventions: number;
  effectivenessRate: number;
  positiveResponseRate: number;
  sensoryPlanFollowedRate: number;
  interventionVariety: number;
  score: number;
}

export interface SensoryPolicyResult {
  sensoryScreeningRoutine: boolean;
  occupationalTherapyAccess: boolean;
  environmentalAuditCompleted: boolean;
  sensoryToolsAvailable: boolean;
  staffTrainingProvided: boolean;
  individualSensoryPlans: boolean;
  parentCarerInvolvement: boolean;
  score: number;
}

export interface StaffReadinessResult {
  totalStaff: number;
  averageCompetencyRate: number;
  sensoryAwarenessRate: number;
  sensoryAssessmentRate: number;
  environmentalAdaptationRate: number;
  interventionDeliveryRate: number;
  calmingStrategiesRate: number;
  equipmentUseRate: number;
  score: number;
}

export interface ChildSensoryProfile {
  childId: string;
  childName: string;
  sensoryNeeds: SensoryNeed[];
  hasSensoryPlan: boolean;
  otReferred: boolean;
  environmentAdapted: boolean;
  parentInformed: boolean;
  interventionCount: number;
  positiveResponseRate: number;
  overallScore: number;
}

export interface SensoryProcessingSupportIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  referenceDate: string;
  overallScore: number;
  rating: Rating;
  assessmentQuality: AssessmentQualityResult;
  interventionEffectiveness: InterventionEffectivenessResult;
  sensoryPolicy: SensoryPolicyResult;
  staffReadiness: StaffReadinessResult;
  childProfiles: ChildSensoryProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

export function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

export function getRating(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// ── Evaluator 1: Assessment Quality (0–25) ─────────────────────────────────

export function evaluateAssessmentQuality(
  assessments: SensoryAssessment[],
): AssessmentQualityResult {
  const total = assessments.length;

  if (total === 0) {
    return {
      totalAssessments: 0,
      sensoryPlanRate: 0,
      otReferralRate: 0,
      environmentAdaptedRate: 0,
      parentInformedRate: 0,
      score: 0,
    };
  }

  const withPlan = assessments.filter((a) => a.sensoryPlanInPlace).length;
  const withOT = assessments.filter((a) => a.occupationalTherapyReferred).length;
  const withEnv = assessments.filter((a) => a.environmentAdapted).length;
  const withParent = assessments.filter((a) => a.parentCarerInformed).length;

  const sensoryPlanRate = pct(withPlan, total);
  const otReferralRate = pct(withOT, total);
  const environmentAdaptedRate = pct(withEnv, total);
  const parentInformedRate = pct(withParent, total);

  // sensoryPlanInPlace rate → 0-7
  const planPts = Math.round((sensoryPlanRate / 100) * 7);
  // OT referred rate → 0-6
  const otPts = Math.round((otReferralRate / 100) * 6);
  // environment adapted rate → 0-6
  const envPts = Math.round((environmentAdaptedRate / 100) * 6);
  // parent informed rate → 0-6
  const parentPts = Math.round((parentInformedRate / 100) * 6);

  const score = Math.min(25, planPts + otPts + envPts + parentPts);

  return {
    totalAssessments: total,
    sensoryPlanRate,
    otReferralRate,
    environmentAdaptedRate,
    parentInformedRate,
    score,
  };
}

// ── Evaluator 2: Intervention Effectiveness (0–25) ─────────────────────────

export function evaluateInterventionEffectiveness(
  interventions: SensoryIntervention[],
): InterventionEffectivenessResult {
  const total = interventions.length;

  if (total === 0) {
    return {
      totalInterventions: 0,
      effectivenessRate: 0,
      positiveResponseRate: 0,
      sensoryPlanFollowedRate: 0,
      interventionVariety: 0,
      score: 0,
    };
  }

  const effectiveCount = interventions.filter(
    (i) => i.effectiveness === "highly_effective" || i.effectiveness === "effective",
  ).length;
  const positiveCount = interventions.filter(
    (i) => i.childResponse === "positive",
  ).length;
  const planFollowed = interventions.filter(
    (i) => i.sensoryPlanFollowed,
  ).length;
  const uniqueTypes = new Set(interventions.map((i) => i.interventionType));

  const effectivenessRate = pct(effectiveCount, total);
  const positiveResponseRate = pct(positiveCount, total);
  const sensoryPlanFollowedRate = pct(planFollowed, total);
  const interventionVariety = uniqueTypes.size;

  // effectiveness rate → 0-7
  const effPts = Math.round((effectivenessRate / 100) * 7);
  // positive child response rate → 0-6
  const respPts = Math.round((positiveResponseRate / 100) * 6);
  // sensoryPlanFollowed rate → 0-6
  const planPts = Math.round((sensoryPlanFollowedRate / 100) * 6);
  // intervention variety (unique types) → 0-6 (max at 5+ types)
  const varietyPts = Math.min(6, Math.round((interventionVariety / 5) * 6));

  const score = Math.min(25, effPts + respPts + planPts + varietyPts);

  return {
    totalInterventions: total,
    effectivenessRate,
    positiveResponseRate,
    sensoryPlanFollowedRate,
    interventionVariety,
    score,
  };
}

// ── Evaluator 3: Sensory Policy (0–25) ─────────────────────────────────────

export function evaluateSensoryPolicy(
  policies: SensoryPolicy[],
): SensoryPolicyResult {
  if (policies.length === 0) {
    return {
      sensoryScreeningRoutine: false,
      occupationalTherapyAccess: false,
      environmentalAuditCompleted: false,
      sensoryToolsAvailable: false,
      staffTrainingProvided: false,
      individualSensoryPlans: false,
      parentCarerInvolvement: false,
      score: 0,
    };
  }

  // Use the most recent policy (last in array)
  const policy = policies[policies.length - 1];

  // Each boolean field scores points (total 25 across 7 fields):
  // sensoryScreeningRoutine: 4
  // occupationalTherapyAccess: 4
  // environmentalAuditCompleted: 4
  // sensoryToolsAvailable: 4
  // staffTrainingProvided: 3
  // individualSensoryPlans: 3
  // parentCarerInvolvement: 3
  let score = 0;
  if (policy.sensoryScreeningRoutine) score += 4;
  if (policy.occupationalTherapyAccess) score += 4;
  if (policy.environmentalAuditCompleted) score += 4;
  if (policy.sensoryToolsAvailable) score += 4;
  if (policy.staffTrainingProvided) score += 3;
  if (policy.individualSensoryPlans) score += 3;
  if (policy.parentCarerInvolvement) score += 3;

  return {
    sensoryScreeningRoutine: policy.sensoryScreeningRoutine,
    occupationalTherapyAccess: policy.occupationalTherapyAccess,
    environmentalAuditCompleted: policy.environmentalAuditCompleted,
    sensoryToolsAvailable: policy.sensoryToolsAvailable,
    staffTrainingProvided: policy.staffTrainingProvided,
    individualSensoryPlans: policy.individualSensoryPlans,
    parentCarerInvolvement: policy.parentCarerInvolvement,
    score: Math.min(25, score),
  };
}

// ── Evaluator 4: Staff Sensory Readiness (0–25) ───────────────────────────

export function evaluateStaffSensoryReadiness(
  training: StaffSensoryTraining[],
): StaffReadinessResult {
  const total = training.length;

  if (total === 0) {
    return {
      totalStaff: 0,
      averageCompetencyRate: 0,
      sensoryAwarenessRate: 0,
      sensoryAssessmentRate: 0,
      environmentalAdaptationRate: 0,
      interventionDeliveryRate: 0,
      calmingStrategiesRate: 0,
      equipmentUseRate: 0,
      score: 0,
    };
  }

  const awarenessCount = training.filter((t) => t.sensoryAwareness).length;
  const assessmentCount = training.filter((t) => t.sensoryAssessment).length;
  const adaptationCount = training.filter((t) => t.environmentalAdaptation).length;
  const deliveryCount = training.filter((t) => t.interventionDelivery).length;
  const calmingCount = training.filter((t) => t.calmingStrategies).length;
  const equipmentCount = training.filter((t) => t.equipmentUse).length;

  const sensoryAwarenessRate = pct(awarenessCount, total);
  const sensoryAssessmentRate = pct(assessmentCount, total);
  const environmentalAdaptationRate = pct(adaptationCount, total);
  const interventionDeliveryRate = pct(deliveryCount, total);
  const calmingStrategiesRate = pct(calmingCount, total);
  const equipmentUseRate = pct(equipmentCount, total);

  // Total competencies across all staff
  const totalCompetencies =
    awarenessCount + assessmentCount + adaptationCount +
    deliveryCount + calmingCount + equipmentCount;
  const maxCompetencies = total * 6;
  const averageCompetencyRate = pct(totalCompetencies, maxCompetencies);

  // Weighted scoring: sensoryAwareness=6, sensoryAssessment=5, environmentalAdaptation=5,
  // interventionDelivery=4, calmingStrategies=3, equipmentUse=2 (total weights = 25)
  const score = Math.min(
    25,
    Math.round((sensoryAwarenessRate / 100) * 6) +
      Math.round((sensoryAssessmentRate / 100) * 5) +
      Math.round((environmentalAdaptationRate / 100) * 5) +
      Math.round((interventionDeliveryRate / 100) * 4) +
      Math.round((calmingStrategiesRate / 100) * 3) +
      Math.round((equipmentUseRate / 100) * 2),
  );

  return {
    totalStaff: total,
    averageCompetencyRate,
    sensoryAwarenessRate,
    sensoryAssessmentRate,
    environmentalAdaptationRate,
    interventionDeliveryRate,
    calmingStrategiesRate,
    equipmentUseRate,
    score,
  };
}

// ── Build Child Sensory Profiles ───────────────────────────────────────────

export function buildChildSensoryProfiles(
  assessments: SensoryAssessment[],
  interventions: SensoryIntervention[],
  childIds: string[],
  childNames: string[],
): ChildSensoryProfile[] {
  return childIds.map((childId, index) => {
    const childName = childNames[index] ?? childId;
    const childAssessments = assessments.filter((a) => a.childId === childId);
    const childInterventions = interventions.filter((i) => i.childId === childId);

    // Latest assessment determines needs and plan status
    const latestAssessment = childAssessments.length > 0
      ? childAssessments.sort((a, b) => b.assessmentDate.localeCompare(a.assessmentDate))[0]
      : null;

    const sensoryNeeds = latestAssessment?.sensoryNeeds ?? [];
    const hasSensoryPlan = latestAssessment?.sensoryPlanInPlace ?? false;
    const otReferred = latestAssessment?.occupationalTherapyReferred ?? false;
    const environmentAdapted = latestAssessment?.environmentAdapted ?? false;
    const parentInformed = latestAssessment?.parentCarerInformed ?? false;

    const interventionCount = childInterventions.length;
    const positiveCount = childInterventions.filter(
      (i) => i.childResponse === "positive",
    ).length;
    const positiveResponseRate = pct(positiveCount, interventionCount);

    // Score 0-10:
    // Has assessment (2 pts)
    // Has sensory plan (2 pts)
    // OT referred (1 pt)
    // Environment adapted (1 pt)
    // Parent informed (1 pt)
    // Has interventions (1 pt, if interventionCount > 0)
    // Positive response rate (2 pts, proportional)
    let score = 0;
    if (latestAssessment) score += 2;
    if (hasSensoryPlan) score += 2;
    if (otReferred) score += 1;
    if (environmentAdapted) score += 1;
    if (parentInformed) score += 1;
    if (interventionCount > 0) score += 1;
    score += Math.round((positiveResponseRate / 100) * 2);

    const overallScore = Math.min(10, Math.max(0, score));

    return {
      childId,
      childName,
      sensoryNeeds,
      hasSensoryPlan,
      otReferred,
      environmentAdapted,
      parentInformed,
      interventionCount,
      positiveResponseRate,
      overallScore,
    };
  });
}

// ── Orchestrator ───────────────────────────────────────────────────────────

export function generateSensoryProcessingSupportIntelligence(
  assessments: SensoryAssessment[],
  interventions: SensoryIntervention[],
  policies: SensoryPolicy[],
  training: StaffSensoryTraining[],
  childIds: string[],
  childNames: string[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
  referenceDate: string,
): SensoryProcessingSupportIntelligence {
  // Filter assessments and interventions to period
  const periodAssessments = assessments.filter(
    (a) => a.assessmentDate >= periodStart && a.assessmentDate <= periodEnd,
  );
  const periodInterventions = interventions.filter(
    (i) => i.interventionDate >= periodStart && i.interventionDate <= periodEnd,
  );

  // Run all evaluators
  const assessmentQuality = evaluateAssessmentQuality(periodAssessments);
  const interventionEffectiveness = evaluateInterventionEffectiveness(periodInterventions);
  const sensoryPolicy = evaluateSensoryPolicy(policies);
  const staffReadiness = evaluateStaffSensoryReadiness(training);

  // Build child profiles (using all data, not just period)
  const childProfiles = buildChildSensoryProfiles(
    assessments,
    interventions,
    childIds,
    childNames,
  );

  // Overall score: sum of 4 evaluators (each 0-25, total 0-100)
  const overallScore = Math.min(
    100,
    Math.max(
      0,
      assessmentQuality.score +
        interventionEffectiveness.score +
        sensoryPolicy.score +
        staffReadiness.score,
    ),
  );

  const rating = getRating(overallScore);

  // ── Strengths ────────────────────────────────────────────────────────────
  const strengths: string[] = [];

  if (assessmentQuality.sensoryPlanRate >= 80) {
    strengths.push(
      "Sensory plans are in place for the majority of assessed children, ensuring individual needs are documented and addressed.",
    );
  }
  if (assessmentQuality.otReferralRate >= 80) {
    strengths.push(
      "Occupational therapy referral rates are strong, demonstrating proactive access to specialist support.",
    );
  }
  if (assessmentQuality.parentInformedRate >= 80) {
    strengths.push(
      "Parents and carers are consistently informed about sensory assessments, supporting collaborative care.",
    );
  }
  if (interventionEffectiveness.effectivenessRate >= 80) {
    strengths.push(
      "Sensory interventions are demonstrating high effectiveness rates, indicating well-matched provision.",
    );
  }
  if (interventionEffectiveness.positiveResponseRate >= 80) {
    strengths.push(
      "Children respond positively to sensory interventions, reflecting child-centred approaches to sensory support.",
    );
  }
  if (interventionEffectiveness.sensoryPlanFollowedRate >= 80) {
    strengths.push(
      "Sensory plans are consistently followed during interventions, ensuring continuity of care.",
    );
  }
  if (interventionEffectiveness.interventionVariety >= 4) {
    strengths.push(
      "A wide variety of intervention types are being used, providing diverse sensory support approaches.",
    );
  }
  if (sensoryPolicy.score >= 20) {
    strengths.push(
      "The home has a comprehensive sensory policy framework with most key elements in place.",
    );
  }
  if (staffReadiness.averageCompetencyRate >= 80) {
    strengths.push(
      "Staff demonstrate high levels of sensory processing competency across all training areas.",
    );
  }
  if (staffReadiness.sensoryAwarenessRate === 100) {
    strengths.push(
      "All staff have completed sensory awareness training, providing a strong foundation for sensory support.",
    );
  }

  // ── Areas for Improvement ────────────────────────────────────────────────
  const areasForImprovement: string[] = [];

  if (assessmentQuality.sensoryPlanRate < 80) {
    areasForImprovement.push(
      "Sensory plan coverage is below 80% — all assessed children should have an individual sensory plan in place.",
    );
  }
  if (assessmentQuality.otReferralRate < 60) {
    areasForImprovement.push(
      "Occupational therapy referral rates are low — ensure all children with sensory processing needs are considered for OT referral.",
    );
  }
  if (assessmentQuality.environmentAdaptedRate < 60) {
    areasForImprovement.push(
      "Environmental adaptations are not consistently made following assessments — review how assessment findings inform environmental changes.",
    );
  }
  if (assessmentQuality.parentInformedRate < 80) {
    areasForImprovement.push(
      "Parents and carers are not consistently informed about sensory assessments — strengthen communication pathways.",
    );
  }
  if (interventionEffectiveness.effectivenessRate < 60) {
    areasForImprovement.push(
      "Intervention effectiveness is below 60% — review and adjust sensory strategies that are not meeting children's needs.",
    );
  }
  if (interventionEffectiveness.positiveResponseRate < 60) {
    areasForImprovement.push(
      "Positive response rates to interventions are low — reassess whether interventions are appropriately matched to each child's sensory profile.",
    );
  }
  if (interventionEffectiveness.sensoryPlanFollowedRate < 80) {
    areasForImprovement.push(
      "Sensory plans are not consistently followed during interventions — reinforce the importance of plan adherence with the team.",
    );
  }
  if (!sensoryPolicy.sensoryScreeningRoutine) {
    areasForImprovement.push(
      "No routine sensory screening process is in place — establish a screening protocol for all new admissions.",
    );
  }
  if (!sensoryPolicy.occupationalTherapyAccess) {
    areasForImprovement.push(
      "Access to occupational therapy is not established — arrange OT access to support children with sensory processing needs.",
    );
  }
  if (!sensoryPolicy.environmentalAuditCompleted) {
    areasForImprovement.push(
      "An environmental audit for sensory considerations has not been completed — schedule a comprehensive sensory audit of the home.",
    );
  }
  if (staffReadiness.sensoryAwarenessRate < 80) {
    areasForImprovement.push(
      "Sensory awareness training coverage is below 80% — ensure all staff complete foundational sensory training.",
    );
  }
  if (staffReadiness.averageCompetencyRate < 60) {
    areasForImprovement.push(
      "Overall staff sensory competency is below 60% — develop a targeted training programme to address gaps.",
    );
  }

  // ── Actions ──────────────────────────────────────────────────────────────
  const actions: string[] = [];

  if (assessmentQuality.score < 20) {
    actions.push(
      "Review and improve sensory assessment processes to ensure all children have comprehensive, up-to-date assessments.",
    );
  }
  if (assessmentQuality.sensoryPlanRate < 100) {
    actions.push(
      "Develop individual sensory plans for all assessed children who do not currently have one.",
    );
  }
  if (assessmentQuality.otReferralRate < 80) {
    actions.push(
      "Review OT referral criteria and ensure all children with identified sensory needs are considered for specialist assessment.",
    );
  }
  if (interventionEffectiveness.effectivenessRate < 80) {
    actions.push(
      "Conduct an intervention review to identify and replace strategies that are not achieving positive outcomes.",
    );
  }
  if (interventionEffectiveness.sensoryPlanFollowedRate < 100) {
    actions.push(
      "Reinforce sensory plan adherence through supervision and team briefings.",
    );
  }
  if (sensoryPolicy.score < 20) {
    actions.push(
      "Strengthen the sensory policy framework by addressing gaps in screening, access, and environmental considerations.",
    );
  }
  if (!sensoryPolicy.sensoryToolsAvailable) {
    actions.push(
      "Procure sensory tools and equipment to ensure resources are available for children's identified needs.",
    );
  }
  if (!sensoryPolicy.staffTrainingProvided) {
    actions.push(
      "Arrange staff training in sensory processing awareness and intervention delivery.",
    );
  }
  if (staffReadiness.averageCompetencyRate < 80) {
    actions.push(
      "Implement a structured training programme to improve staff competency across all sensory support areas.",
    );
  }
  if (assessmentQuality.parentInformedRate < 100) {
    actions.push(
      "Establish a routine process for informing parents and carers of sensory assessment outcomes and intervention plans.",
    );
  }

  // ── Regulatory Links ─────────────────────────────────────────────────────
  const regulatoryLinks: string[] = [
    "CHR 2015 Reg 10 — Health and wellbeing: the registered person must ensure children's health needs, including sensory processing needs, are identified and met.",
    "CHR 2015 Reg 12 — Health care and therapy: children must have access to appropriate therapeutic services including occupational therapy for sensory needs.",
    "SCCIF Quality of Care — The home ensures children's individual health and wellbeing needs are assessed, planned for, and met through effective interventions.",
    "SEND Code of Practice 2015 — Duties to identify, assess and make provision for children with special educational needs and disabilities including sensory processing difficulties.",
    "NMS 3 — Health and wellbeing: children's physical, emotional, and sensory health needs are met through appropriate care and access to services.",
    "Children Act 1989 — The welfare of the child is paramount; sensory processing support must be provided as part of holistic welfare provision.",
    "NICE CG170 — Autism in under 19s: guidance on identifying and supporting sensory sensitivities in children on the autism spectrum.",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    referenceDate,
    overallScore,
    rating,
    assessmentQuality,
    interventionEffectiveness,
    sensoryPolicy,
    staffReadiness,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
