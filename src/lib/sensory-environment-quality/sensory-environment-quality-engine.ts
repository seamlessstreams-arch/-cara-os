// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Sensory Environment Quality Intelligence Engine
//
// Pure deterministic engine — no AI, no external calls, no randomness, no
// Date.now().
// Evaluates how well a children's residential home provides sensory-friendly
// environments, particularly for children with sensory processing needs or
// autism.
//
// Aligned to:
//   - CHR 2015 Regulation 6  — Health (sensory needs as health needs)
//   - CHR 2015 Regulation 9  — Quality of care
//   - SCCIF                  — Experiences and progress
//   - NMS 10                 — Health: sensory needs
//   - Equality Act 2010      — Reasonable adjustments for disability
//   - NICE sensory processing guidance
//   - Autism Act 2009         — Compliance with autism strategy
//
// No AI. No external calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ──────────────────────────────────────────────────────────────────

export type SensoryArea =
  | "lighting_adaptation"
  | "noise_management"
  | "tactile_provision"
  | "visual_supports"
  | "calm_space"
  | "sensory_diet"
  | "proprioceptive_input"
  | "vestibular_activity";

export type EffectivenessLevel =
  | "highly_effective"
  | "effective"
  | "partially_effective"
  | "ineffective"
  | "not_implemented";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// ── Label Maps ─────────────────────────────────────────────────────────────

const SENSORY_AREA_LABELS: Record<SensoryArea, string> = {
  lighting_adaptation: "Lighting Adaptation",
  noise_management: "Noise Management",
  tactile_provision: "Tactile Provision",
  visual_supports: "Visual Supports",
  calm_space: "Calm Space",
  sensory_diet: "Sensory Diet",
  proprioceptive_input: "Proprioceptive Input",
  vestibular_activity: "Vestibular Activity",
};

const EFFECTIVENESS_LEVEL_LABELS: Record<EffectivenessLevel, string> = {
  highly_effective: "Highly Effective",
  effective: "Effective",
  partially_effective: "Partially Effective",
  ineffective: "Ineffective",
  not_implemented: "Not Implemented",
};

const RATING_LABELS: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

// ── Label Getter Functions ─────────────────────────────────────────────────

export function getSensoryAreaLabel(area: SensoryArea): string {
  return SENSORY_AREA_LABELS[area] ?? area.replace(/_/g, " ");
}

export function getEffectivenessLevelLabel(level: EffectivenessLevel): string {
  return EFFECTIVENESS_LEVEL_LABELS[level] ?? level.replace(/_/g, " ");
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
  sensoryArea: SensoryArea;
  effectivenessLevel: EffectivenessLevel;
  childFeedbackPositive: boolean;
  occupationalTherapistInvolved: boolean;
  documentedInPlan: boolean;
  staffImplemented: boolean;
  environmentAdapted: boolean;
  reviewScheduled: boolean;
}

export interface SensoryPolicy {
  id: string;
  sensoryEnvironmentPolicy: boolean;
  sensoryAssessmentProcess: boolean;
  calmSpaceProvision: boolean;
  sensoryDietGuidance: boolean;
  staffTrainingRequirement: boolean;
  occupationalTherapyLink: boolean;
  regularReview: boolean;
}

export interface StaffSensoryTraining {
  id: string;
  staffId: string;
  staffName: string;
  sensoryProcessing: boolean;
  autismAwareness: boolean;
  calmSpaceManagement: boolean;
  sensoryDietImplementation: boolean;
  occupationalTherapySupport: boolean;
  documentationSkills: boolean;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface SensoryQualityResult {
  totalAssessments: number;
  effectivenessRate: number;
  childFeedbackRate: number;
  occupationalTherapistRate: number;
  environmentAdaptedRate: number;
  score: number;
}

export interface SensoryComplianceResult {
  totalAssessments: number;
  documentedRate: number;
  staffImplementedRate: number;
  reviewScheduledRate: number;
  areaDiversity: number;
  score: number;
}

export interface SensoryPolicyResult {
  sensoryEnvironmentPolicy: boolean;
  sensoryAssessmentProcess: boolean;
  calmSpaceProvision: boolean;
  sensoryDietGuidance: boolean;
  staffTrainingRequirement: boolean;
  occupationalTherapyLink: boolean;
  regularReview: boolean;
  score: number;
}

export interface StaffSensoryReadinessResult {
  totalStaff: number;
  averageCompetencyRate: number;
  sensoryProcessingRate: number;
  autismAwarenessRate: number;
  calmSpaceManagementRate: number;
  sensoryDietImplementationRate: number;
  occupationalTherapySupportRate: number;
  documentationSkillsRate: number;
  score: number;
}

export interface ChildSensoryProfile {
  childId: string;
  childName: string;
  assessmentCount: number;
  effectivenessRate: number;
  childFeedbackRate: number;
  areaDiversity: number;
  overallScore: number;
}

export interface SensoryEnvironmentQualityIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  sensoryQuality: SensoryQualityResult;
  sensoryCompliance: SensoryComplianceResult;
  sensoryPolicy: SensoryPolicyResult;
  staffReadiness: StaffSensoryReadinessResult;
  childProfiles: ChildSensoryProfile[];
  strengths: string[];
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

// ── Evaluator 1: Sensory Quality (0–25) ────────────────────────────────────

export function evaluateSensoryQuality(
  assessments: SensoryAssessment[],
): SensoryQualityResult {
  const total = assessments.length;

  if (total === 0) {
    return {
      totalAssessments: 0,
      effectivenessRate: 0,
      childFeedbackRate: 0,
      occupationalTherapistRate: 0,
      environmentAdaptedRate: 0,
      score: 0,
    };
  }

  const effectiveCount = assessments.filter(
    (a) =>
      a.effectivenessLevel === "highly_effective" ||
      a.effectivenessLevel === "effective",
  ).length;
  const feedbackCount = assessments.filter(
    (a) => a.childFeedbackPositive,
  ).length;
  const otCount = assessments.filter(
    (a) => a.occupationalTherapistInvolved,
  ).length;
  const envCount = assessments.filter(
    (a) => a.environmentAdapted,
  ).length;

  const effectivenessRate = pct(effectiveCount, total);
  const childFeedbackRate = pct(feedbackCount, total);
  const occupationalTherapistRate = pct(otCount, total);
  const environmentAdaptedRate = pct(envCount, total);

  // Sub-scores: effectivenessRate 0-7, childFeedbackRate 0-6, otRate 0-6, envAdaptedRate 0-6
  const effPts = Math.round((effectivenessRate / 100) * 7);
  const feedbackPts = Math.round((childFeedbackRate / 100) * 6);
  const otPts = Math.round((occupationalTherapistRate / 100) * 6);
  const envPts = Math.round((environmentAdaptedRate / 100) * 6);

  const score = Math.min(25, effPts + feedbackPts + otPts + envPts);

  return {
    totalAssessments: total,
    effectivenessRate,
    childFeedbackRate,
    occupationalTherapistRate,
    environmentAdaptedRate,
    score,
  };
}

// ── Evaluator 2: Sensory Compliance (0–25) ─────────────────────────────────

export function evaluateSensoryCompliance(
  assessments: SensoryAssessment[],
): SensoryComplianceResult {
  const total = assessments.length;

  if (total === 0) {
    return {
      totalAssessments: 0,
      documentedRate: 0,
      staffImplementedRate: 0,
      reviewScheduledRate: 0,
      areaDiversity: 0,
      score: 0,
    };
  }

  const documentedCount = assessments.filter(
    (a) => a.documentedInPlan,
  ).length;
  const staffImplementedCount = assessments.filter(
    (a) => a.staffImplemented,
  ).length;
  const reviewScheduledCount = assessments.filter(
    (a) => a.reviewScheduled,
  ).length;
  const uniqueAreas = new Set(assessments.map((a) => a.sensoryArea));

  const documentedRate = pct(documentedCount, total);
  const staffImplementedRate = pct(staffImplementedCount, total);
  const reviewScheduledRate = pct(reviewScheduledCount, total);
  const areaDiversity = uniqueAreas.size;

  // Sub-scores: documentedRate 0-8, staffImplementedRate 0-7, reviewScheduledRate 0-5,
  // areaDiversity (unique areas / 8) 0-5
  const docPts = Math.round((documentedRate / 100) * 8);
  const staffPts = Math.round((staffImplementedRate / 100) * 7);
  const reviewPts = Math.round((reviewScheduledRate / 100) * 5);
  const diversityPts = Math.round((areaDiversity / 8) * 5);

  const score = Math.min(25, docPts + staffPts + reviewPts + diversityPts);

  return {
    totalAssessments: total,
    documentedRate,
    staffImplementedRate,
    reviewScheduledRate,
    areaDiversity,
    score,
  };
}

// ── Evaluator 3: Sensory Policy (0–25) ─────────────────────────────────────

export function evaluateSensoryPolicy(
  policy: SensoryPolicy | null,
): SensoryPolicyResult {
  if (policy === null) {
    return {
      sensoryEnvironmentPolicy: false,
      sensoryAssessmentProcess: false,
      calmSpaceProvision: false,
      sensoryDietGuidance: false,
      staffTrainingRequirement: false,
      occupationalTherapyLink: false,
      regularReview: false,
      score: 0,
    };
  }

  // 7 booleans weighted: 4+4+4+4+3+3+3 = 25
  let score = 0;
  if (policy.sensoryEnvironmentPolicy) score += 4;
  if (policy.sensoryAssessmentProcess) score += 4;
  if (policy.calmSpaceProvision) score += 4;
  if (policy.sensoryDietGuidance) score += 4;
  if (policy.staffTrainingRequirement) score += 3;
  if (policy.occupationalTherapyLink) score += 3;
  if (policy.regularReview) score += 3;

  return {
    sensoryEnvironmentPolicy: policy.sensoryEnvironmentPolicy,
    sensoryAssessmentProcess: policy.sensoryAssessmentProcess,
    calmSpaceProvision: policy.calmSpaceProvision,
    sensoryDietGuidance: policy.sensoryDietGuidance,
    staffTrainingRequirement: policy.staffTrainingRequirement,
    occupationalTherapyLink: policy.occupationalTherapyLink,
    regularReview: policy.regularReview,
    score: Math.min(25, score),
  };
}

// ── Evaluator 4: Staff Sensory Readiness (0–25) ───────────────────────────

export function evaluateStaffSensoryReadiness(
  training: StaffSensoryTraining[],
): StaffSensoryReadinessResult {
  const total = training.length;

  if (total === 0) {
    return {
      totalStaff: 0,
      averageCompetencyRate: 0,
      sensoryProcessingRate: 0,
      autismAwarenessRate: 0,
      calmSpaceManagementRate: 0,
      sensoryDietImplementationRate: 0,
      occupationalTherapySupportRate: 0,
      documentationSkillsRate: 0,
      score: 0,
    };
  }

  const spCount = training.filter((t) => t.sensoryProcessing).length;
  const aaCount = training.filter((t) => t.autismAwareness).length;
  const csCount = training.filter((t) => t.calmSpaceManagement).length;
  const sdCount = training.filter((t) => t.sensoryDietImplementation).length;
  const otCount = training.filter((t) => t.occupationalTherapySupport).length;
  const dsCount = training.filter((t) => t.documentationSkills).length;

  const sensoryProcessingRate = pct(spCount, total);
  const autismAwarenessRate = pct(aaCount, total);
  const calmSpaceManagementRate = pct(csCount, total);
  const sensoryDietImplementationRate = pct(sdCount, total);
  const occupationalTherapySupportRate = pct(otCount, total);
  const documentationSkillsRate = pct(dsCount, total);

  // Total competencies across all staff
  const totalCompetencies =
    spCount + aaCount + csCount + sdCount + otCount + dsCount;
  const maxCompetencies = total * 6;
  const averageCompetencyRate = pct(totalCompetencies, maxCompetencies);

  // Weighted scoring: sensoryProcessing=6, autismAwareness=5, calmSpaceManagement=5,
  // sensoryDietImplementation=4, occupationalTherapySupport=3, documentationSkills=2 (total = 25)
  const score = Math.min(
    25,
    Math.round((sensoryProcessingRate / 100) * 6) +
      Math.round((autismAwarenessRate / 100) * 5) +
      Math.round((calmSpaceManagementRate / 100) * 5) +
      Math.round((sensoryDietImplementationRate / 100) * 4) +
      Math.round((occupationalTherapySupportRate / 100) * 3) +
      Math.round((documentationSkillsRate / 100) * 2),
  );

  return {
    totalStaff: total,
    averageCompetencyRate,
    sensoryProcessingRate,
    autismAwarenessRate,
    calmSpaceManagementRate,
    sensoryDietImplementationRate,
    occupationalTherapySupportRate,
    documentationSkillsRate,
    score,
  };
}

// ── Build Child Sensory Profiles ───────────────────────────────────────────

export function buildChildSensoryProfiles(
  assessments: SensoryAssessment[],
): ChildSensoryProfile[] {
  // Group by childId
  const grouped = new Map<string, SensoryAssessment[]>();
  for (const a of assessments) {
    const existing = grouped.get(a.childId) ?? [];
    existing.push(a);
    grouped.set(a.childId, existing);
  }

  const profiles: ChildSensoryProfile[] = [];

  for (const [childId, childAssessments] of grouped.entries()) {
    const childName = childAssessments[0].childName;
    const assessmentCount = childAssessments.length;

    // Effectiveness rate
    const effectiveCount = childAssessments.filter(
      (a) =>
        a.effectivenessLevel === "highly_effective" ||
        a.effectivenessLevel === "effective",
    ).length;
    const effectivenessRate = pct(effectiveCount, assessmentCount);

    // Child feedback rate
    const feedbackCount = childAssessments.filter(
      (a) => a.childFeedbackPositive,
    ).length;
    const childFeedbackRate = pct(feedbackCount, assessmentCount);

    // Area diversity
    const uniqueAreas = new Set(childAssessments.map((a) => a.sensoryArea));
    const areaDiversity = uniqueAreas.size;

    // Score 0-10:
    // frequency (0-2): >=10 assessments → 2, >=5 → 1, else 0
    // effectivenessRate (0-3): >=80 → 3, >=60 → 2, >=40 → 1, else 0
    // childFeedbackRate (0-3): >=80 → 3, >=60 → 2, >=40 → 1, else 0
    // diversity (0-2): unique areas >=4 → 2, >=2 → 1, else 0
    let frequencyPts = 0;
    if (assessmentCount >= 10) frequencyPts = 2;
    else if (assessmentCount >= 5) frequencyPts = 1;

    let effectivenessPts = 0;
    if (effectivenessRate >= 80) effectivenessPts = 3;
    else if (effectivenessRate >= 60) effectivenessPts = 2;
    else if (effectivenessRate >= 40) effectivenessPts = 1;

    let feedbackPts = 0;
    if (childFeedbackRate >= 80) feedbackPts = 3;
    else if (childFeedbackRate >= 60) feedbackPts = 2;
    else if (childFeedbackRate >= 40) feedbackPts = 1;

    let diversityPts = 0;
    if (areaDiversity >= 4) diversityPts = 2;
    else if (areaDiversity >= 2) diversityPts = 1;

    const overallScore = Math.min(
      10,
      frequencyPts + effectivenessPts + feedbackPts + diversityPts,
    );

    profiles.push({
      childId,
      childName,
      assessmentCount,
      effectivenessRate,
      childFeedbackRate,
      areaDiversity,
      overallScore,
    });
  }

  return profiles;
}

// ── Orchestrator ───────────────────────────────────────────────────────────

export function generateSensoryEnvironmentQualityIntelligence(
  assessments: SensoryAssessment[],
  policy: SensoryPolicy | null,
  training: StaffSensoryTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): SensoryEnvironmentQualityIntelligence {
  // Run all evaluators
  const sensoryQuality = evaluateSensoryQuality(assessments);
  const sensoryCompliance = evaluateSensoryCompliance(assessments);
  const sensoryPolicyResult = evaluateSensoryPolicy(policy);
  const staffReadiness = evaluateStaffSensoryReadiness(training);

  // Build child profiles
  const childProfiles = buildChildSensoryProfiles(assessments);

  // Overall score: sum of 4 evaluators (each 0-25, total 0-100)
  const overallScore = Math.min(
    100,
    sensoryQuality.score +
      sensoryCompliance.score +
      sensoryPolicyResult.score +
      staffReadiness.score,
  );

  const rating = getRating(overallScore);

  // ── Strengths ──────────────────────────────────────────────────────────
  const strengths: string[] = [];

  if (sensoryQuality.effectivenessRate >= 80) {
    strengths.push(
      "Strong sensory environment effectiveness — adaptations are working well",
    );
  }
  if (sensoryQuality.childFeedbackRate >= 80) {
    strengths.push(
      "Children consistently report positive sensory experiences",
    );
  }
  if (sensoryQuality.occupationalTherapistRate >= 80) {
    strengths.push(
      "Good occupational therapy involvement",
    );
  }
  if (sensoryCompliance.documentedRate >= 80) {
    strengths.push(
      "Excellent sensory documentation in care plans",
    );
  }

  // ── Actions ────────────────────────────────────────────────────────────
  const actions: string[] = [];

  if (assessments.length === 0) {
    actions.push(
      "No sensory assessment records found — begin systematic sensory environment assessments",
    );
  }
  if (policy === null) {
    actions.push(
      "URGENT: Develop and implement a sensory environment policy to ensure consistent sensory-friendly provision across the home",
    );
  }
  if (training.length === 0) {
    actions.push(
      "URGENT: Implement a staff sensory training programme to ensure all staff can support children with sensory processing needs",
    );
  }
  if (assessments.length > 0 && sensoryCompliance.reviewScheduledRate < 80) {
    actions.push(
      "Improve review scheduling for sensory assessments",
    );
  }
  if (assessments.length > 0 && sensoryCompliance.staffImplementedRate < 80) {
    actions.push(
      "Strengthen staff implementation of sensory strategies",
    );
  }

  // ── Regulatory Links ────────────────────────────────────────────────────
  const regulatoryLinks: string[] = [
    "CHR 2015 Regulation 6 — Health: the registered person must ensure children's health needs, including sensory processing needs, are identified and met.",
    "CHR 2015 Regulation 9 — Quality of care: children receive care that is tailored to their individual sensory needs and preferences.",
    "SCCIF — Experiences and progress: children's sensory needs are understood and the environment supports their wellbeing and development.",
    "NMS 10 — Health: sensory needs — children's sensory processing needs are assessed and appropriate support is provided.",
    "Equality Act 2010 — Duty to make reasonable adjustments to the environment for children with sensory processing differences or disabilities.",
    "NICE sensory processing guidance — Evidence-based approaches to identifying and supporting sensory processing difficulties in children.",
    "Autism Act 2009 compliance — Ensuring environments and practices meet the needs of children on the autism spectrum, including sensory considerations.",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    sensoryQuality,
    sensoryCompliance,
    sensoryPolicy: sensoryPolicyResult,
    staffReadiness,
    childProfiles,
    strengths,
    actions,
    regulatoryLinks,
  };
}
