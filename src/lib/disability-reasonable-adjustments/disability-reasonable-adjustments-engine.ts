// ==============================================================================
// Cornerstone -- Disability & Reasonable Adjustments Intelligence Engine
//
// Pure deterministic engine -- no AI, no external calls, no randomness.
// Evaluates how well a children's home identifies and implements reasonable
// adjustments for children with disabilities or additional needs -- covering
// accessibility, equipment, plans, and staff competence.
//
// Maps to: CHR 2015 Reg 10, CHR 2015 Reg 12, SCCIF, Equality Act 2010,
// SEN Code of Practice 2015, UNCRC Article 23, Children Act 1989
// ==============================================================================

// -- Types --------------------------------------------------------------------

export type DisabilityType =
  | "physical"
  | "sensory_visual"
  | "sensory_hearing"
  | "cognitive"
  | "learning"
  | "autism_spectrum"
  | "mental_health"
  | "speech_language"
  | "multiple"
  | "other";

export type AdjustmentStatus =
  | "in_place"
  | "pending"
  | "under_review"
  | "not_needed"
  | "refused";

export type EquipmentCondition =
  | "good"
  | "fair"
  | "poor"
  | "needs_replacement";

export type ReviewOutcome =
  | "effective"
  | "partially_effective"
  | "not_effective"
  | "needs_update";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// -- Input Interfaces ---------------------------------------------------------

export interface AdjustmentRecord {
  id: string;
  childId: string;
  childName: string;
  disabilityType: DisabilityType;
  adjustmentDescription: string;
  adjustmentStatus: AdjustmentStatus;
  dateImplemented?: string;
  reviewDate?: string;
  reviewCurrent: boolean;
  ehcpInPlace: boolean;
  professionalInvolved: boolean;
}

export interface AccessibilityAudit {
  id: string;
  auditDate: string;
  auditor: string;
  physicalAccessCompliant: boolean;
  sensoryEnvironmentAdapted: boolean;
  communicationAidsAvailable: boolean;
  signageAccessible: boolean;
  overallCompliant: boolean;
}

export interface EquipmentRecord {
  id: string;
  childId: string;
  childName: string;
  equipmentType: string;
  condition: EquipmentCondition;
  lastChecked?: string;
  maintenanceCurrent: boolean;
  replacementNeeded: boolean;
}

export interface StaffDisabilityTraining {
  id: string;
  staffId: string;
  staffName: string;
  disabilityAwareness: boolean;
  reasonableAdjustmentsTrained: boolean;
  ehcpUnderstanding: boolean;
  communicationStrategies: boolean;
  personalCareTrained: boolean;
  emergencyEvacuationTrained: boolean;
}

// -- Result Interfaces --------------------------------------------------------

export interface AdjustmentImplementationResult {
  overallScore: number;
  totalAdjustments: number;
  inPlaceCount: number;
  inPlaceRate: number;
  reviewCurrentCount: number;
  reviewCurrentRate: number;
  ehcpCount: number;
  ehcpRate: number;
  professionalInvolvedCount: number;
  professionalInvolvedRate: number;
  statusBreakdown: Record<string, number>;
  disabilityTypeBreakdown: Record<string, number>;
}

export interface AccessibilityComplianceResult {
  overallScore: number;
  totalAudits: number;
  physicalAccessRate: number;
  sensoryAdaptationRate: number;
  communicationAidsRate: number;
  signageAccessibleRate: number;
  overallComplianceRate: number;
}

export interface EquipmentProvisionResult {
  overallScore: number;
  totalEquipment: number;
  goodConditionCount: number;
  goodConditionRate: number;
  maintenanceCurrentCount: number;
  maintenanceCurrentRate: number;
  replacementBacklog: number;
  replacementBacklogRate: number;
  conditionBreakdown: Record<string, number>;
}

export interface StaffDisabilityReadinessResult {
  overallScore: number;
  totalStaff: number;
  awarenessRate: number;
  adjustmentsTrainingRate: number;
  ehcpUnderstandingRate: number;
  communicationStrategiesRate: number;
  personalCareRate: number;
  emergencyEvacuationRate: number;
}

export interface ChildAdjustmentSummary {
  childId: string;
  childName: string;
  disabilityTypes: DisabilityType[];
  totalAdjustments: number;
  inPlaceCount: number;
  reviewCurrentCount: number;
  ehcpInPlace: boolean;
  equipmentCount: number;
  equipmentGoodCount: number;
  overallScore: number;
}

export interface DisabilityReasonableAdjustmentsIntelligenceResult {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  referenceDate: string;
  overallScore: number;
  rating: Rating;
  adjustmentImplementation: AdjustmentImplementationResult;
  accessibilityCompliance: AccessibilityComplianceResult;
  equipmentProvision: EquipmentProvisionResult;
  staffDisabilityReadiness: StaffDisabilityReadinessResult;
  childSummaries: ChildAdjustmentSummary[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// -- Helpers ------------------------------------------------------------------

export function pct(num: number, den: number): number {
  if (den === 0) return 0;
  return Math.round((num / den) * 100);
}

export function getRating(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// -- Label Maps & Getters -----------------------------------------------------

const disabilityTypeLabels: Record<DisabilityType, string> = {
  physical: "Physical",
  sensory_visual: "Sensory (Visual)",
  sensory_hearing: "Sensory (Hearing)",
  cognitive: "Cognitive",
  learning: "Learning",
  autism_spectrum: "Autism Spectrum",
  mental_health: "Mental Health",
  speech_language: "Speech & Language",
  multiple: "Multiple",
  other: "Other",
};

const adjustmentStatusLabels: Record<AdjustmentStatus, string> = {
  in_place: "In Place",
  pending: "Pending",
  under_review: "Under Review",
  not_needed: "Not Needed",
  refused: "Refused",
};

const equipmentConditionLabels: Record<EquipmentCondition, string> = {
  good: "Good",
  fair: "Fair",
  poor: "Poor",
  needs_replacement: "Needs Replacement",
};

const reviewOutcomeLabels: Record<ReviewOutcome, string> = {
  effective: "Effective",
  partially_effective: "Partially Effective",
  not_effective: "Not Effective",
  needs_update: "Needs Update",
};

const ratingLabels: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getDisabilityTypeLabel(type: DisabilityType): string {
  return disabilityTypeLabels[type] || type;
}

export function getAdjustmentStatusLabel(status: AdjustmentStatus): string {
  return adjustmentStatusLabels[status] || status;
}

export function getEquipmentConditionLabel(condition: EquipmentCondition): string {
  return equipmentConditionLabels[condition] || condition;
}

export function getReviewOutcomeLabel(outcome: ReviewOutcome): string {
  return reviewOutcomeLabels[outcome] || outcome;
}

export function getRatingLabel(rating: Rating): string {
  return ratingLabels[rating] || rating;
}

export {
  disabilityTypeLabels,
  adjustmentStatusLabels,
  equipmentConditionLabels,
  reviewOutcomeLabels,
  ratingLabels,
};

// -- Evaluators ---------------------------------------------------------------

/**
 * Evaluator 1: Adjustment Implementation (0-25)
 * Measures: in-place rate, review current rate, EHCP rate, professional involvement rate
 */
export function evaluateAdjustmentImplementation(
  adjustments: AdjustmentRecord[],
): AdjustmentImplementationResult {
  if (adjustments.length === 0) {
    return {
      overallScore: 0,
      totalAdjustments: 0,
      inPlaceCount: 0,
      inPlaceRate: 0,
      reviewCurrentCount: 0,
      reviewCurrentRate: 0,
      ehcpCount: 0,
      ehcpRate: 0,
      professionalInvolvedCount: 0,
      professionalInvolvedRate: 0,
      statusBreakdown: {},
      disabilityTypeBreakdown: {},
    };
  }

  const total = adjustments.length;

  const inPlaceCount = adjustments.filter(
    (a) => a.adjustmentStatus === "in_place",
  ).length;
  const inPlaceRate = pct(inPlaceCount, total);

  const reviewCurrentCount = adjustments.filter(
    (a) => a.reviewCurrent,
  ).length;
  const reviewCurrentRate = pct(reviewCurrentCount, total);

  const ehcpCount = adjustments.filter((a) => a.ehcpInPlace).length;
  const ehcpRate = pct(ehcpCount, total);

  const professionalInvolvedCount = adjustments.filter(
    (a) => a.professionalInvolved,
  ).length;
  const professionalInvolvedRate = pct(professionalInvolvedCount, total);

  // Status breakdown
  const statusBreakdown: Record<string, number> = {};
  for (const a of adjustments) {
    statusBreakdown[a.adjustmentStatus] =
      (statusBreakdown[a.adjustmentStatus] || 0) + 1;
  }

  // Disability type breakdown
  const disabilityTypeBreakdown: Record<string, number> = {};
  for (const a of adjustments) {
    disabilityTypeBreakdown[a.disabilityType] =
      (disabilityTypeBreakdown[a.disabilityType] || 0) + 1;
  }

  // Score: in-place rate (30%) + review current (25%) + EHCP (25%) + professional (20%)
  const rawScore =
    (inPlaceRate / 100) * 0.3 +
    (reviewCurrentRate / 100) * 0.25 +
    (ehcpRate / 100) * 0.25 +
    (professionalInvolvedRate / 100) * 0.2;
  const overallScore = Math.round(rawScore * 25);

  return {
    overallScore,
    totalAdjustments: total,
    inPlaceCount,
    inPlaceRate,
    reviewCurrentCount,
    reviewCurrentRate,
    ehcpCount,
    ehcpRate,
    professionalInvolvedCount,
    professionalInvolvedRate,
    statusBreakdown,
    disabilityTypeBreakdown,
  };
}

/**
 * Evaluator 2: Accessibility Compliance (0-25)
 * Measures: physical access, sensory adaptation, communication aids, overall compliance
 */
export function evaluateAccessibilityCompliance(
  audits: AccessibilityAudit[],
): AccessibilityComplianceResult {
  if (audits.length === 0) {
    return {
      overallScore: 0,
      totalAudits: 0,
      physicalAccessRate: 0,
      sensoryAdaptationRate: 0,
      communicationAidsRate: 0,
      signageAccessibleRate: 0,
      overallComplianceRate: 0,
    };
  }

  const total = audits.length;

  const physicalAccessRate = pct(
    audits.filter((a) => a.physicalAccessCompliant).length,
    total,
  );
  const sensoryAdaptationRate = pct(
    audits.filter((a) => a.sensoryEnvironmentAdapted).length,
    total,
  );
  const communicationAidsRate = pct(
    audits.filter((a) => a.communicationAidsAvailable).length,
    total,
  );
  const signageAccessibleRate = pct(
    audits.filter((a) => a.signageAccessible).length,
    total,
  );
  const overallComplianceRate = pct(
    audits.filter((a) => a.overallCompliant).length,
    total,
  );

  // Score: physical (25%) + sensory (25%) + communication (25%) + overall compliance (25%)
  const rawScore =
    (physicalAccessRate / 100) * 0.25 +
    (sensoryAdaptationRate / 100) * 0.25 +
    (communicationAidsRate / 100) * 0.25 +
    (overallComplianceRate / 100) * 0.25;
  const overallScore = Math.round(rawScore * 25);

  return {
    overallScore,
    totalAudits: total,
    physicalAccessRate,
    sensoryAdaptationRate,
    communicationAidsRate,
    signageAccessibleRate,
    overallComplianceRate,
  };
}

/**
 * Evaluator 3: Equipment Provision (0-25)
 * Measures: good condition rate, maintenance current rate, replacement backlog
 */
export function evaluateEquipmentProvision(
  equipment: EquipmentRecord[],
): EquipmentProvisionResult {
  if (equipment.length === 0) {
    return {
      overallScore: 0,
      totalEquipment: 0,
      goodConditionCount: 0,
      goodConditionRate: 0,
      maintenanceCurrentCount: 0,
      maintenanceCurrentRate: 0,
      replacementBacklog: 0,
      replacementBacklogRate: 0,
      conditionBreakdown: {},
    };
  }

  const total = equipment.length;

  const goodConditionCount = equipment.filter(
    (e) => e.condition === "good",
  ).length;
  const goodConditionRate = pct(goodConditionCount, total);

  const maintenanceCurrentCount = equipment.filter(
    (e) => e.maintenanceCurrent,
  ).length;
  const maintenanceCurrentRate = pct(maintenanceCurrentCount, total);

  const replacementBacklog = equipment.filter(
    (e) => e.replacementNeeded,
  ).length;
  const replacementBacklogRate = pct(replacementBacklog, total);

  // Condition breakdown
  const conditionBreakdown: Record<string, number> = {};
  for (const e of equipment) {
    conditionBreakdown[e.condition] =
      (conditionBreakdown[e.condition] || 0) + 1;
  }

  // Score: good condition (35%) + maintenance current (40%) + low replacement backlog (25%)
  const backlogPenalty = replacementBacklogRate / 100;
  const rawScore =
    (goodConditionRate / 100) * 0.35 +
    (maintenanceCurrentRate / 100) * 0.4 +
    (1 - backlogPenalty) * 0.25;
  const overallScore = Math.round(rawScore * 25);

  return {
    overallScore,
    totalEquipment: total,
    goodConditionCount,
    goodConditionRate,
    maintenanceCurrentCount,
    maintenanceCurrentRate,
    replacementBacklog,
    replacementBacklogRate,
    conditionBreakdown,
  };
}

/**
 * Evaluator 4: Staff Disability Readiness (0-25)
 * Measures: awareness, adjustments training, EHCP understanding,
 *           communication, personal care, emergency evacuation
 */
export function evaluateStaffDisabilityReadiness(
  training: StaffDisabilityTraining[],
): StaffDisabilityReadinessResult {
  if (training.length === 0) {
    return {
      overallScore: 0,
      totalStaff: 0,
      awarenessRate: 0,
      adjustmentsTrainingRate: 0,
      ehcpUnderstandingRate: 0,
      communicationStrategiesRate: 0,
      personalCareRate: 0,
      emergencyEvacuationRate: 0,
    };
  }

  const total = training.length;

  const awarenessRate = pct(
    training.filter((t) => t.disabilityAwareness).length,
    total,
  );
  const adjustmentsTrainingRate = pct(
    training.filter((t) => t.reasonableAdjustmentsTrained).length,
    total,
  );
  const ehcpUnderstandingRate = pct(
    training.filter((t) => t.ehcpUnderstanding).length,
    total,
  );
  const communicationStrategiesRate = pct(
    training.filter((t) => t.communicationStrategies).length,
    total,
  );
  const personalCareRate = pct(
    training.filter((t) => t.personalCareTrained).length,
    total,
  );
  const emergencyEvacuationRate = pct(
    training.filter((t) => t.emergencyEvacuationTrained).length,
    total,
  );

  // Score: each of the 6 areas weighted roughly equally (16.67% each)
  // Using simple average of 6 rates
  const avgRate =
    (awarenessRate +
      adjustmentsTrainingRate +
      ehcpUnderstandingRate +
      communicationStrategiesRate +
      personalCareRate +
      emergencyEvacuationRate) /
    6;
  const overallScore = Math.round((avgRate / 100) * 25);

  return {
    overallScore,
    totalStaff: total,
    awarenessRate,
    adjustmentsTrainingRate,
    ehcpUnderstandingRate,
    communicationStrategiesRate,
    personalCareRate,
    emergencyEvacuationRate,
  };
}

// -- Child Adjustment Summaries -----------------------------------------------

/**
 * Builds per-child summaries with a 0-10 score.
 */
export function buildChildAdjustmentSummaries(
  adjustments: AdjustmentRecord[],
  equipment: EquipmentRecord[],
): ChildAdjustmentSummary[] {
  // Group adjustments by child
  const childMap = new Map<
    string,
    { childName: string; adjustments: AdjustmentRecord[]; equipment: EquipmentRecord[] }
  >();

  for (const a of adjustments) {
    if (!childMap.has(a.childId)) {
      childMap.set(a.childId, { childName: a.childName, adjustments: [], equipment: [] });
    }
    childMap.get(a.childId)!.adjustments.push(a);
  }

  // Add equipment to existing children or create new entries
  for (const e of equipment) {
    if (!childMap.has(e.childId)) {
      childMap.set(e.childId, { childName: e.childName, adjustments: [], equipment: [] });
    }
    childMap.get(e.childId)!.equipment.push(e);
  }

  const summaries: ChildAdjustmentSummary[] = [];

  for (const [childId, data] of Array.from(childMap.entries())) {
    const childAdj = data.adjustments;
    const childEquip = data.equipment;

    // Collect unique disability types
    const disabilityTypes = Array.from(
      new Set(childAdj.map((a) => a.disabilityType)),
    );

    const totalAdjustments = childAdj.length;
    const inPlaceCount = childAdj.filter(
      (a) => a.adjustmentStatus === "in_place",
    ).length;
    const reviewCurrentCount = childAdj.filter(
      (a) => a.reviewCurrent,
    ).length;
    const ehcpInPlace = childAdj.some((a) => a.ehcpInPlace);
    const equipmentCount = childEquip.length;
    const equipmentGoodCount = childEquip.filter(
      (e) => e.condition === "good",
    ).length;

    // Score 0-10:
    // - Adjustments in place (3 pts max)
    // - Reviews current (2 pts max)
    // - EHCP in place (2 pts)
    // - Equipment condition (3 pts max)
    let score = 0;

    if (totalAdjustments > 0) {
      score += Math.round((inPlaceCount / totalAdjustments) * 3);
      score += Math.round((reviewCurrentCount / totalAdjustments) * 2);
    } else {
      // No adjustments recorded = no data to score these on
      score += 0;
    }

    score += ehcpInPlace ? 2 : 0;

    if (equipmentCount > 0) {
      score += Math.round((equipmentGoodCount / equipmentCount) * 3);
    } else {
      // No equipment = not applicable, give neutral score
      score += 0;
    }

    score = Math.min(score, 10);

    summaries.push({
      childId,
      childName: data.childName,
      disabilityTypes,
      totalAdjustments,
      inPlaceCount,
      reviewCurrentCount,
      ehcpInPlace,
      equipmentCount,
      equipmentGoodCount,
      overallScore: score,
    });
  }

  return summaries;
}

// -- Main Intelligence Generator ----------------------------------------------

export function generateDisabilityReasonableAdjustmentsIntelligence(
  adjustments: AdjustmentRecord[],
  audits: AccessibilityAudit[],
  equipment: EquipmentRecord[],
  training: StaffDisabilityTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
  referenceDate: string,
): DisabilityReasonableAdjustmentsIntelligenceResult {
  // Run the 4 evaluators
  const adjustmentResult = evaluateAdjustmentImplementation(adjustments);
  const accessibilityResult = evaluateAccessibilityCompliance(audits);
  const equipmentResult = evaluateEquipmentProvision(equipment);
  const staffResult = evaluateStaffDisabilityReadiness(training);

  // Build child summaries
  const childSummaries = buildChildAdjustmentSummaries(adjustments, equipment);

  // Overall score: sum of 4 evaluators, capped at 100
  const overallScore = Math.min(
    100,
    adjustmentResult.overallScore +
      accessibilityResult.overallScore +
      equipmentResult.overallScore +
      staffResult.overallScore,
  );

  const rating = getRating(overallScore);

  // -- Strengths (conditional) ------------------------------------------------
  const strengths: string[] = [];

  if (adjustmentResult.inPlaceRate >= 80) {
    strengths.push(
      "High proportion of reasonable adjustments are in place, demonstrating strong implementation of individual support plans",
    );
  }
  if (accessibilityResult.overallComplianceRate >= 80) {
    strengths.push(
      "Good accessibility compliance across audits, with the home environment well-adapted for children with disabilities",
    );
  }
  if (equipmentResult.goodConditionRate >= 80 && equipmentResult.totalEquipment > 0) {
    strengths.push(
      "Specialist equipment is well-maintained and in good condition, ensuring children can access the support they need",
    );
  }
  if (staffResult.overallScore >= 20) {
    strengths.push(
      "Strong staff disability training coverage, with the team well-prepared to support children with additional needs",
    );
  }
  if (adjustmentResult.ehcpRate >= 80) {
    strengths.push(
      "EHCPs are in place for the majority of children, ensuring statutory duties are met",
    );
  }
  if (adjustmentResult.professionalInvolvedRate >= 80) {
    strengths.push(
      "Professionals are actively involved in the majority of reasonable adjustments, supporting evidence-based planning",
    );
  }
  if (adjustmentResult.reviewCurrentRate >= 80) {
    strengths.push(
      "Reviews of reasonable adjustments are current, indicating proactive oversight of support plans",
    );
  }
  if (
    equipmentResult.maintenanceCurrentRate >= 90 &&
    equipmentResult.totalEquipment > 0
  ) {
    strengths.push(
      "Equipment maintenance is up to date, minimising risk of disruption to children's support",
    );
  }

  // -- Areas for improvement (conditional) ------------------------------------
  const areasForImprovement: string[] = [];

  if (adjustmentResult.reviewCurrentRate < 60 && adjustmentResult.totalAdjustments > 0) {
    areasForImprovement.push(
      `Only ${adjustmentResult.reviewCurrentRate}% of adjustment reviews are current -- regular reviews are needed to ensure plans remain effective`,
    );
  }
  if (accessibilityResult.overallComplianceRate < 60 && accessibilityResult.totalAudits > 0) {
    areasForImprovement.push(
      `Accessibility compliance is at ${accessibilityResult.overallComplianceRate}% -- the home environment needs improvement to meet the needs of children with disabilities`,
    );
  }
  if (equipmentResult.replacementBacklog > 0) {
    areasForImprovement.push(
      `${equipmentResult.replacementBacklog} item(s) of equipment need replacement -- delays may affect children's access to necessary support`,
    );
  }
  if (staffResult.awarenessRate < 80 && staffResult.totalStaff > 0) {
    areasForImprovement.push(
      `Only ${staffResult.awarenessRate}% of staff have completed disability awareness training`,
    );
  }
  if (staffResult.emergencyEvacuationRate < 80 && staffResult.totalStaff > 0) {
    areasForImprovement.push(
      `Only ${staffResult.emergencyEvacuationRate}% of staff are trained in emergency evacuation procedures for children with disabilities`,
    );
  }
  if (adjustmentResult.ehcpRate < 60 && adjustmentResult.totalAdjustments > 0) {
    areasForImprovement.push(
      `EHCPs are only in place for ${adjustmentResult.ehcpRate}% of adjustments -- ensure statutory duties under the SEN Code of Practice are met`,
    );
  }
  if (adjustmentResult.inPlaceRate < 60 && adjustmentResult.totalAdjustments > 0) {
    areasForImprovement.push(
      `Only ${adjustmentResult.inPlaceRate}% of adjustments are currently in place -- several remain pending or under review`,
    );
  }
  if (equipmentResult.maintenanceCurrentRate < 80 && equipmentResult.totalEquipment > 0) {
    areasForImprovement.push(
      `Only ${equipmentResult.maintenanceCurrentRate}% of equipment has current maintenance -- ensure all specialist equipment is regularly checked`,
    );
  }

  // -- Actions (conditional) --------------------------------------------------
  const actions: string[] = [];

  // URGENT actions for empty data
  if (adjustments.length === 0) {
    actions.push(
      "URGENT: No reasonable adjustment records found -- identify and record all adjustments for children with disabilities or additional needs immediately",
    );
  }
  if (audits.length === 0) {
    actions.push(
      "URGENT: No accessibility audits on record -- commission a full accessibility audit of the home without delay",
    );
  }
  if (equipment.length === 0) {
    actions.push(
      "URGENT: No specialist equipment records found -- audit and record all equipment provided for children with disabilities",
    );
  }
  if (training.length === 0) {
    actions.push(
      "URGENT: No staff disability training records found -- arrange disability awareness and reasonable adjustments training for all staff immediately",
    );
  }

  // URGENT for low in-place rate
  if (adjustmentResult.inPlaceRate < 40 && adjustments.length > 0) {
    actions.push(
      "URGENT: Fewer than 40% of reasonable adjustments are in place -- expedite implementation of all outstanding adjustments",
    );
  }

  // URGENT for critical equipment needs
  if (equipmentResult.replacementBacklogRate >= 50 && equipment.length > 0) {
    actions.push(
      "URGENT: Over half of specialist equipment needs replacement -- prioritise procurement to avoid impact on children's welfare",
    );
  }

  // Non-urgent actions
  if (
    adjustmentResult.reviewCurrentRate < 80 &&
    adjustmentResult.totalAdjustments > 0 &&
    adjustmentResult.reviewCurrentRate >= 0
  ) {
    actions.push(
      "Schedule reviews for all reasonable adjustments that are not current to ensure plans remain effective",
    );
  }
  if (adjustmentResult.ehcpRate < 80 && adjustments.length > 0) {
    actions.push(
      "Ensure EHCPs are pursued and in place for all eligible children in line with the SEN Code of Practice 2015",
    );
  }
  if (
    accessibilityResult.overallComplianceRate < 80 &&
    audits.length > 0
  ) {
    actions.push(
      "Address accessibility gaps identified in recent audits, prioritising physical access and sensory environment adaptations",
    );
  }
  if (
    equipmentResult.replacementBacklog > 0 &&
    equipmentResult.replacementBacklogRate < 50
  ) {
    actions.push(
      "Replace specialist equipment flagged for replacement to maintain children's access to necessary support",
    );
  }
  if (staffResult.awarenessRate < 80 && staffResult.totalStaff > 0) {
    actions.push(
      "Enrol remaining staff on disability awareness training to meet best practice standards",
    );
  }
  if (staffResult.ehcpUnderstandingRate < 80 && staffResult.totalStaff > 0) {
    actions.push(
      "Provide EHCP understanding training to ensure all staff can contribute to statutory planning processes",
    );
  }
  if (staffResult.emergencyEvacuationRate < 80 && staffResult.totalStaff > 0) {
    actions.push(
      "Arrange emergency evacuation training for staff not yet trained, including PEEP development for each child",
    );
  }

  // -- Regulatory Links -------------------------------------------------------
  const regulatoryLinks: string[] = [
    "CHR 2015 Reg 10 -- The health and well-being standard, including duty to ensure children's health needs are met and reasonable adjustments are in place",
    "CHR 2015 Reg 12 -- The standard on promoting contact, ensuring environments and practices are accessible",
    "SCCIF (Social Care Common Inspection Framework) -- Ofsted framework assessing outcomes for children including those with disabilities",
    "Equality Act 2010 -- Duty to make reasonable adjustments so that disabled persons are not placed at a substantial disadvantage",
    "SEN Code of Practice 2015 -- Statutory guidance on duties to children with special educational needs and disabilities including EHCPs",
    "UNCRC Article 23 -- The right of disabled children to enjoy a full and decent life in conditions ensuring dignity and active participation",
    "Children Act 1989 -- Framework for safeguarding and promoting the welfare of children, including those with disabilities",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    referenceDate,
    overallScore,
    rating,
    adjustmentImplementation: adjustmentResult,
    accessibilityCompliance: accessibilityResult,
    equipmentProvision: equipmentResult,
    staffDisabilityReadiness: staffResult,
    childSummaries,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
