// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Property Damage Assessment Intelligence Engine
//
// Pure deterministic engine — no AI, no external calls.
// Analyses how the home manages, repairs, and prevents property damage,
// understanding behaviour as communication and maintaining a safe environment:
//   • Incident management & therapeutic response
//   • Property condition & maintenance
//   • Repair effectiveness & timeliness
//   • Prevention strategy & environmental adaptation
//
// Regulatory framework:
//   CHR 2015 Reg 19 (fitness of premises), Reg 16 (behaviour management)
//   CHR 2015 Reg 13 (financial viability), SCCIF (impact of leaders)
//   NMS 7 (accommodation), Working Together 2023 (behaviour as communication)
//   UNCRC Article 27 (right to adequate standard of living)
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ───────────────────────────────────────────────────────────────────

export type DamageType =
  | "structural"
  | "furniture"
  | "electronics"
  | "fixtures"
  | "communal_area"
  | "bedroom"
  | "vehicle"
  | "garden_outdoor"
  | "safety_equipment"
  | "other";

export type DamageSeverity = "minor" | "moderate" | "significant" | "severe";

export type DamageContext =
  | "frustration_expression"
  | "accidental"
  | "targeted_vandalism"
  | "during_restraint"
  | "peer_conflict"
  | "unknown"
  | "weather_wear";

export type RepairStatus =
  | "completed"
  | "in_progress"
  | "awaiting_parts"
  | "scheduled"
  | "not_started"
  | "written_off";

export type CostBand =
  | "under_50"
  | "50_to_200"
  | "200_to_500"
  | "500_to_1000"
  | "over_1000";

export type Rating = "outstanding" | "good" | "requires_improvement" | "inadequate";

// ── Interfaces ──────────────────────────────────────────────────────────────

export interface DamageIncident {
  id: string;
  date: string;
  damageType: DamageType;
  severity: DamageSeverity;
  context: DamageContext;
  location: string;
  childInvolved: boolean;
  childId: string | null;
  childName: string | null;
  description: string;
  estimatedCost: number;
  costBand: CostBand;
  repairStatus: RepairStatus;
  repairCompletedDate: string | null;
  insuranceClaimed: boolean;
  therapeuticResponseProvided: boolean;
}

export interface PropertyInspection {
  id: string;
  inspectionDate: string;
  inspector: string;
  areasChecked: number;
  issuesFound: number;
  issuesResolved: number;
  maintenanceScheduleFollowed: boolean;
  overallCondition: "excellent" | "good" | "fair" | "poor";
}

export interface RepairRecord {
  id: string;
  damageIncidentId: string;
  repairDate: string;
  repairedBy: string;
  costActual: number;
  timeliness: "within_24h" | "within_week" | "within_month" | "over_month";
  qualityRating: "excellent" | "good" | "adequate" | "poor";
  safetyRestored: boolean;
}

export interface DamagePreventionMeasure {
  id: string;
  measureType:
    | "environmental_adaptation"
    | "therapeutic_support"
    | "risk_assessment"
    | "de_escalation_training"
    | "sensory_provision"
    | "structural_reinforcement";
  implementedDate: string;
  targetChildId: string | null;
  effectiveness: "highly_effective" | "effective" | "partially_effective" | "ineffective";
  reviewDate: string;
  active: boolean;
}

// ── Result Types ────────────────────────────────────────────────────────────

export interface IncidentManagementResult {
  totalIncidents: number;
  therapeuticResponseRate: number;
  timelyRepairRate: number;
  insuranceClaimedForSignificant: number;
  severeCount: number;
  contextDocumentedRate: number;
  overallScore: number; // 0–25
}

export interface PropertyConditionResult {
  totalInspections: number;
  excellentOrGoodRate: number;
  issuesResolvedRate: number;
  maintenanceFollowedRate: number;
  regularInspections: boolean;
  overallScore: number; // 0–25
}

export interface RepairEffectivenessResult {
  totalRepairs: number;
  timelinessScore: number;
  qualityScore: number;
  safetyRestoredRate: number;
  completionRate: number;
  overallScore: number; // 0–25
}

export interface PreventionStrategyResult {
  totalMeasures: number;
  activeMeasures: number;
  effectivenessRate: number;
  repeatChildrenCovered: number;
  environmentalAdaptations: number;
  reviewCurrent: number;
  overallScore: number; // 0–25
}

export interface ChildDamageProfile {
  childId: string;
  childName: string;
  incidentCount: number;
  totalEstimatedCost: number;
  primaryContext: DamageContext | null;
  therapeuticResponseRate: number;
  preventionMeasuresActive: number;
  score: number; // 0–10
}

export interface PropertyDamageAssessmentIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  referenceDate: string;
  overallScore: number;
  rating: Rating;
  incidentManagement: IncidentManagementResult;
  propertyCondition: PropertyConditionResult;
  repairEffectiveness: RepairEffectivenessResult;
  preventionStrategy: PreventionStrategyResult;
  childDamageProfiles: ChildDamageProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(num: number, den: number): number {
  return den === 0 ? 0 : Math.round((num / den) * 100);
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function ratingFromScore(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

function isInPeriod(date: string | undefined | null, start: string, end: string): boolean {
  if (!date) return false;
  return date.slice(0, 10) >= start.slice(0, 10) && date.slice(0, 10) <= end.slice(0, 10);
}

// ── Label Functions ─────────────────────────────────────────────────────────

export function getDamageTypeLabel(t: DamageType): string {
  const labels: Record<DamageType, string> = {
    structural: "Structural",
    furniture: "Furniture",
    electronics: "Electronics",
    fixtures: "Fixtures",
    communal_area: "Communal Area",
    bedroom: "Bedroom",
    vehicle: "Vehicle",
    garden_outdoor: "Garden/Outdoor",
    safety_equipment: "Safety Equipment",
    other: "Other",
  };
  return labels[t] || t;
}

export function getDamageSeverityLabel(s: DamageSeverity): string {
  const labels: Record<DamageSeverity, string> = {
    minor: "Minor",
    moderate: "Moderate",
    significant: "Significant",
    severe: "Severe",
  };
  return labels[s] || s;
}

export function getDamageContextLabel(c: DamageContext): string {
  const labels: Record<DamageContext, string> = {
    frustration_expression: "Frustration Expression",
    accidental: "Accidental",
    targeted_vandalism: "Targeted Vandalism",
    during_restraint: "During Restraint",
    peer_conflict: "Peer Conflict",
    unknown: "Unknown",
    weather_wear: "Weather/Wear",
  };
  return labels[c] || c;
}

export function getRepairStatusLabel(s: RepairStatus): string {
  const labels: Record<RepairStatus, string> = {
    completed: "Completed",
    in_progress: "In Progress",
    awaiting_parts: "Awaiting Parts",
    scheduled: "Scheduled",
    not_started: "Not Started",
    written_off: "Written Off",
  };
  return labels[s] || s;
}

export function getCostBandLabel(b: CostBand): string {
  const labels: Record<CostBand, string> = {
    under_50: "Under £50",
    "50_to_200": "£50–£200",
    "200_to_500": "£200–£500",
    "500_to_1000": "£500–£1,000",
    over_1000: "Over £1,000",
  };
  return labels[b] || b;
}

// ── Core Evaluation Functions ───────────────────────────────────────────────

/**
 * Evaluate incident management quality.
 * Good homes respond therapeutically to property damage, understanding it as
 * communication. Repairs are timely, insurance is claimed for significant damage,
 * and context is always documented.
 * Score: 0–25. Empty incidents = 25 (no damage is excellent).
 */
export function evaluateIncidentManagement(
  incidents: DamageIncident[],
  repairs: RepairRecord[],
  periodStart: string,
  periodEnd: string,
): IncidentManagementResult {
  const periodIncidents = incidents.filter((i) => isInPeriod(i.date, periodStart, periodEnd));

  if (periodIncidents.length === 0) {
    return {
      totalIncidents: 0,
      therapeuticResponseRate: 0,
      timelyRepairRate: 0,
      insuranceClaimedForSignificant: 0,
      severeCount: 0,
      contextDocumentedRate: 0,
      overallScore: 25,
    };
  }

  // Therapeutic response rate (for child-involved incidents)
  const childInvolved = periodIncidents.filter((i) => i.childInvolved);
  const therapeuticProvided = childInvolved.filter((i) => i.therapeuticResponseProvided).length;
  const therapeuticRate = pct(therapeuticProvided, childInvolved.length);

  // Timely repair rate
  const repairMap = new Map<string, RepairRecord>();
  for (const r of repairs) {
    repairMap.set(r.damageIncidentId, r);
  }
  const timelyRepairs = periodIncidents.filter((i) => {
    const repair = repairMap.get(i.id);
    return repair && (repair.timeliness === "within_24h" || repair.timeliness === "within_week");
  }).length;
  const timelyRepairRate = pct(timelyRepairs, periodIncidents.length);

  // Insurance claimed for significant+
  const significantPlus = periodIncidents.filter(
    (i) => i.severity === "significant" || i.severity === "severe",
  );
  const insuranceClaimed = significantPlus.filter((i) => i.insuranceClaimed).length;

  // Severe count
  const severeCount = periodIncidents.filter((i) => i.severity === "severe").length;

  // Context documented (not "unknown")
  const contextDocumented = periodIncidents.filter((i) => i.context !== "unknown").length;
  const contextDocumentedRate = pct(contextDocumented, periodIncidents.length);

  // Scoring — 25 points max
  let score = 0;

  // Therapeutic response provided: 0–7
  score += (therapeuticRate / 100) * 7;

  // Timely repair: 0–6
  score += (timelyRepairRate / 100) * 6;

  // Insurance claimed for significant+: 0–5
  if (significantPlus.length > 0) {
    score += (pct(insuranceClaimed, significantPlus.length) / 100) * 5;
  } else {
    score += 5; // No significant damage is good
  }

  // Low severe count bonus: 0–4
  if (severeCount === 0) {
    score += 4;
  } else if (severeCount === 1) {
    score += 2;
  } else if (severeCount === 2) {
    score += 1;
  }

  // Context documented: 0–3
  score += (contextDocumentedRate / 100) * 3;

  return {
    totalIncidents: periodIncidents.length,
    therapeuticResponseRate: therapeuticRate,
    timelyRepairRate: timelyRepairRate,
    insuranceClaimedForSignificant: insuranceClaimed,
    severeCount,
    contextDocumentedRate: contextDocumentedRate,
    overallScore: Math.round(clamp(score, 0, 25) * 10) / 10,
  };
}

/**
 * Evaluate property condition based on inspections.
 * Regular inspections with good conditions show proactive maintenance.
 * Score: 0–25. Empty inspections = 0 (no inspections is bad).
 */
export function evaluatePropertyCondition(
  inspections: PropertyInspection[],
  periodStart: string,
  periodEnd: string,
): PropertyConditionResult {
  const periodInspections = inspections.filter((i) =>
    isInPeriod(i.inspectionDate, periodStart, periodEnd),
  );

  if (periodInspections.length === 0) {
    return {
      totalInspections: 0,
      excellentOrGoodRate: 0,
      issuesResolvedRate: 0,
      maintenanceFollowedRate: 0,
      regularInspections: false,
      overallScore: 0,
    };
  }

  // Overall condition ratings
  const excellentOrGood = periodInspections.filter(
    (i) => i.overallCondition === "excellent" || i.overallCondition === "good",
  ).length;
  const excellentOrGoodRate = pct(excellentOrGood, periodInspections.length);

  // Issues resolved rate
  const totalFound = periodInspections.reduce((sum, i) => sum + i.issuesFound, 0);
  const totalResolved = periodInspections.reduce((sum, i) => sum + i.issuesResolved, 0);
  const issuesResolvedRate = pct(totalResolved, totalFound);

  // Maintenance schedule followed
  const maintenanceFollowed = periodInspections.filter(
    (i) => i.maintenanceScheduleFollowed,
  ).length;
  const maintenanceFollowedRate = pct(maintenanceFollowed, periodInspections.length);

  // Regular inspections bonus (2+ in period)
  const regularInspections = periodInspections.length >= 2;

  // Scoring — 25 points max
  let score = 0;

  // Overall condition ratings: 0–8
  score += (excellentOrGoodRate / 100) * 8;

  // Issues resolved rate: 0–6
  score += (issuesResolvedRate / 100) * 6;

  // Maintenance schedule followed: 0–6
  score += (maintenanceFollowedRate / 100) * 6;

  // Regular inspections bonus: 0–5
  if (regularInspections) {
    score += Math.min(periodInspections.length, 4) * 1.25;
  }

  return {
    totalInspections: periodInspections.length,
    excellentOrGoodRate,
    issuesResolvedRate,
    maintenanceFollowedRate,
    regularInspections,
    overallScore: Math.round(clamp(score, 0, 25) * 10) / 10,
  };
}

/**
 * Evaluate repair effectiveness.
 * Score: 0–25. Empty incidents with no repairs = 25 (nothing to repair).
 * Incidents but no repairs = 0 (repairs not actioned).
 */
export function evaluateRepairEffectiveness(
  incidents: DamageIncident[],
  repairs: RepairRecord[],
  periodStart: string,
  periodEnd: string,
): RepairEffectivenessResult {
  const periodIncidents = incidents.filter((i) => isInPeriod(i.date, periodStart, periodEnd));

  if (periodIncidents.length === 0) {
    return {
      totalRepairs: 0,
      timelinessScore: 0,
      qualityScore: 0,
      safetyRestoredRate: 0,
      completionRate: 0,
      overallScore: 25,
    };
  }

  // Match repairs to period incidents
  const periodIncidentIds = new Set(periodIncidents.map((i) => i.id));
  const periodRepairs = repairs.filter((r) => periodIncidentIds.has(r.damageIncidentId));

  if (periodRepairs.length === 0) {
    return {
      totalRepairs: 0,
      timelinessScore: 0,
      qualityScore: 0,
      safetyRestoredRate: 0,
      completionRate: 0,
      overallScore: 0,
    };
  }

  // Timeliness score: 0–8
  const timelinessMap: Record<string, number> = {
    within_24h: 100,
    within_week: 75,
    within_month: 40,
    over_month: 10,
  };
  const avgTimeliness =
    periodRepairs.reduce((sum, r) => sum + (timelinessMap[r.timeliness] || 0), 0) /
    periodRepairs.length;
  const timelinessScore = Math.round(((avgTimeliness / 100) * 8) * 10) / 10;

  // Quality score: 0–7
  const qualityMap: Record<string, number> = {
    excellent: 100,
    good: 75,
    adequate: 45,
    poor: 10,
  };
  const avgQuality =
    periodRepairs.reduce((sum, r) => sum + (qualityMap[r.qualityRating] || 0), 0) /
    periodRepairs.length;
  const qualityScore = Math.round(((avgQuality / 100) * 7) * 10) / 10;

  // Safety restored rate: 0–5
  const safetyRestored = periodRepairs.filter((r) => r.safetyRestored).length;
  const safetyRestoredRate = pct(safetyRestored, periodRepairs.length);
  const safetyScore = Math.round(((safetyRestoredRate / 100) * 5) * 10) / 10;

  // Completion rate: 0–5
  const completionRate = pct(periodRepairs.length, periodIncidents.length);
  const completionScore = Math.round(((completionRate / 100) * 5) * 10) / 10;

  const overallScore = Math.round(
    clamp(timelinessScore + qualityScore + safetyScore + completionScore, 0, 25) * 10,
  ) / 10;

  return {
    totalRepairs: periodRepairs.length,
    timelinessScore,
    qualityScore,
    safetyRestoredRate,
    completionRate,
    overallScore,
  };
}

/**
 * Evaluate prevention strategy.
 * Outstanding homes proactively prevent damage through environmental adaptations,
 * therapeutic support, and targeted measures for children who damage property.
 * Score: 0–25. Empty measures = 0 (no prevention is bad).
 */
export function evaluatePreventionStrategy(
  measures: DamagePreventionMeasure[],
  incidents: DamageIncident[],
  periodStart: string,
  periodEnd: string,
  referenceDate: string,
): PreventionStrategyResult {
  const periodMeasures = measures.filter((m) =>
    isInPeriod(m.implementedDate, periodStart, periodEnd) || m.active,
  );

  if (periodMeasures.length === 0) {
    return {
      totalMeasures: 0,
      activeMeasures: 0,
      effectivenessRate: 0,
      repeatChildrenCovered: 0,
      environmentalAdaptations: 0,
      reviewCurrent: 0,
      overallScore: 0,
    };
  }

  // Active measures: 0–7
  const activeMeasures = periodMeasures.filter((m) => m.active).length;

  // Effectiveness rate: 0–6
  const effective = periodMeasures.filter(
    (m) => m.effectiveness === "highly_effective" || m.effectiveness === "effective",
  ).length;
  const effectivenessRate = pct(effective, periodMeasures.length);

  // Coverage for repeat children: 0–5
  const periodIncidents = incidents.filter((i) => isInPeriod(i.date, periodStart, periodEnd));
  const childIncidentCount = new Map<string, number>();
  for (const i of periodIncidents) {
    if (i.childId) {
      childIncidentCount.set(i.childId, (childIncidentCount.get(i.childId) || 0) + 1);
    }
  }
  const repeatChildren = [...childIncidentCount.entries()]
    .filter(([, count]) => count > 1)
    .map(([childId]) => childId);
  const coveredRepeatChildren = repeatChildren.filter((childId) =>
    periodMeasures.some((m) => m.targetChildId === childId && m.active),
  ).length;
  const repeatChildrenCovered = coveredRepeatChildren;

  // Environmental adaptations: 0–4
  const environmentalAdaptations = periodMeasures.filter(
    (m) => m.measureType === "environmental_adaptation" && m.active,
  ).length;

  // Review currency: 0–3
  const reviewCurrent = periodMeasures.filter((m) => {
    if (!m.reviewDate) return false;
    return m.reviewDate >= periodStart;
  }).length;

  // Scoring — 25 points max
  let score = 0;

  // Active measures: 0–7
  score += Math.min(activeMeasures, 5) * 1.4;

  // Effectiveness rate: 0–6
  score += (effectivenessRate / 100) * 6;

  // Coverage for repeat children: 0–5
  if (repeatChildren.length > 0) {
    score += (pct(coveredRepeatChildren, repeatChildren.length) / 100) * 5;
  } else {
    score += 5; // No repeat children is positive
  }

  // Environmental adaptations: 0–4
  score += Math.min(environmentalAdaptations, 3) * (4 / 3);

  // Review currency: 0–3
  if (periodMeasures.length > 0) {
    score += (pct(reviewCurrent, periodMeasures.length) / 100) * 3;
  }

  return {
    totalMeasures: periodMeasures.length,
    activeMeasures,
    effectivenessRate,
    repeatChildrenCovered,
    environmentalAdaptations,
    reviewCurrent,
    overallScore: Math.round(clamp(score, 0, 25) * 10) / 10,
  };
}

// ── Child Damage Profiles ─────────────────────────────────────────────────

/**
 * Build per-child damage profiles with 0–10 score.
 * Lower incident count and higher therapeutic response = higher score.
 */
export function buildChildDamageProfiles(
  incidents: DamageIncident[],
  measures: DamagePreventionMeasure[],
  periodStart: string,
  periodEnd: string,
  childIds: string[],
): ChildDamageProfile[] {
  return childIds.map((childId) => {
    const childIncidents = incidents.filter(
      (i) => i.childId === childId && isInPeriod(i.date, periodStart, periodEnd),
    );

    const childName = childIncidents[0]?.childName ?? childId;

    const incidentCount = childIncidents.length;
    const totalEstimatedCost = childIncidents.reduce((sum, i) => sum + i.estimatedCost, 0);

    // Primary context (most common)
    let primaryContext: DamageContext | null = null;
    if (childIncidents.length > 0) {
      const contextCounts = new Map<DamageContext, number>();
      for (const i of childIncidents) {
        contextCounts.set(i.context, (contextCounts.get(i.context) || 0) + 1);
      }
      let maxCount = 0;
      for (const [ctx, count] of contextCounts) {
        if (count > maxCount) {
          maxCount = count;
          primaryContext = ctx;
        }
      }
    }

    // Therapeutic response rate
    const therapeuticProvided = childIncidents.filter(
      (i) => i.therapeuticResponseProvided,
    ).length;
    const therapeuticResponseRate = pct(therapeuticProvided, childIncidents.length);

    // Active prevention measures
    const preventionMeasuresActive = measures.filter(
      (m) => m.targetChildId === childId && m.active,
    ).length;

    // Score 0–10: Start at 10, deduct for issues
    let score = 10;

    // Deduct for incidents: -1 per incident (max -4)
    score -= Math.min(incidentCount, 4);

    // Deduct if no therapeutic response: -2
    if (incidentCount > 0 && therapeuticResponseRate < 50) {
      score -= 2;
    }

    // Deduct if no prevention measures for child with 2+ incidents: -2
    if (incidentCount >= 2 && preventionMeasuresActive === 0) {
      score -= 2;
    }

    // Bonus for active prevention measures: +1 (max)
    if (preventionMeasuresActive > 0 && incidentCount > 0) {
      score += 1;
    }

    // Bonus for 100% therapeutic response: +1
    if (incidentCount > 0 && therapeuticResponseRate === 100) {
      score += 1;
    }

    return {
      childId,
      childName,
      incidentCount,
      totalEstimatedCost,
      primaryContext,
      therapeuticResponseRate,
      preventionMeasuresActive,
      score: clamp(Math.round(score * 10) / 10, 0, 10),
    };
  });
}

// ── Main Intelligence Function ──────────────────────────────────────────────

export function generatePropertyDamageAssessmentIntelligence(
  incidents: DamageIncident[],
  inspections: PropertyInspection[],
  repairs: RepairRecord[],
  preventionMeasures: DamagePreventionMeasure[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
  referenceDate: string,
): PropertyDamageAssessmentIntelligence {
  const incidentMgmt = evaluateIncidentManagement(incidents, repairs, periodStart, periodEnd);
  const condition = evaluatePropertyCondition(inspections, periodStart, periodEnd);
  const repairEff = evaluateRepairEffectiveness(incidents, repairs, periodStart, periodEnd);
  const prevention = evaluatePreventionStrategy(
    preventionMeasures, incidents, periodStart, periodEnd, referenceDate,
  );

  const overallScore = Math.round(
    (incidentMgmt.overallScore + condition.overallScore + repairEff.overallScore + prevention.overallScore) * 10,
  ) / 10;
  const rating = ratingFromScore(overallScore);

  // Build child profiles for children involved in incidents
  const childIdSet = new Set<string>();
  const periodIncidents = incidents.filter((i) => isInPeriod(i.date, periodStart, periodEnd));
  for (const i of periodIncidents) {
    if (i.childId) childIdSet.add(i.childId);
  }
  const childDamageProfiles = buildChildDamageProfiles(
    incidents, preventionMeasures, periodStart, periodEnd, [...childIdSet],
  );

  // ── Strengths ──
  const strengths: string[] = [];
  if (incidentMgmt.totalIncidents === 0) {
    strengths.push("No property damage incidents in the period — excellent environmental care");
  }
  if (incidentMgmt.therapeuticResponseRate >= 90 && incidentMgmt.totalIncidents > 0) {
    strengths.push(
      "Therapeutic responses are consistently provided when children are involved in damage incidents, understanding behaviour as communication",
    );
  }
  if (incidentMgmt.contextDocumentedRate >= 90 && incidentMgmt.totalIncidents > 0) {
    strengths.push("Context is well-documented for damage incidents, enabling pattern analysis and tailored support");
  }
  if (condition.excellentOrGoodRate >= 80 && condition.totalInspections > 0) {
    strengths.push("Property inspections consistently show excellent or good condition");
  }
  if (condition.issuesResolvedRate >= 90 && condition.totalInspections > 0) {
    strengths.push("Issues identified in inspections are promptly resolved");
  }
  if (condition.regularInspections) {
    strengths.push("Regular property inspections are being conducted, demonstrating proactive maintenance");
  }
  if (repairEff.completionRate >= 90 && repairEff.totalRepairs > 0) {
    strengths.push("High repair completion rate ensures the environment is maintained to a good standard");
  }
  if (repairEff.safetyRestoredRate >= 90 && repairEff.totalRepairs > 0) {
    strengths.push("Safety is consistently restored following damage, prioritising children's wellbeing");
  }
  if (prevention.activeMeasures >= 3) {
    strengths.push("Multiple active prevention measures demonstrate a proactive approach to reducing damage");
  }
  if (prevention.effectivenessRate >= 80 && prevention.totalMeasures > 0) {
    strengths.push("Prevention measures are demonstrably effective in reducing property damage");
  }

  // ── Areas for Improvement ──
  const areasForImprovement: string[] = [];
  if (incidentMgmt.therapeuticResponseRate < 70 && incidentMgmt.totalIncidents > 0) {
    const childInvolved = periodIncidents.filter((i) => i.childInvolved).length;
    if (childInvolved > 0) {
      areasForImprovement.push(
        "Therapeutic responses need to be more consistently provided when children are involved in damage incidents",
      );
    }
  }
  if (incidentMgmt.severeCount > 0) {
    areasForImprovement.push(
      `${incidentMgmt.severeCount} severe damage incident(s) in the period — review environmental safety measures`,
    );
  }
  if (condition.totalInspections === 0) {
    areasForImprovement.push("No property inspections recorded — regular inspections are essential for Reg 19 compliance");
  }
  if (condition.maintenanceFollowedRate < 80 && condition.totalInspections > 0) {
    areasForImprovement.push("Maintenance schedule adherence needs improvement to prevent deterioration");
  }
  if (repairEff.completionRate < 70 && incidentMgmt.totalIncidents > 0) {
    areasForImprovement.push("Repair completion rate is below expected standard — outstanding repairs should be prioritised");
  }
  if (prevention.totalMeasures === 0) {
    areasForImprovement.push("No prevention measures are in place — proactive strategies are needed to reduce damage");
  }
  if (prevention.effectivenessRate < 60 && prevention.totalMeasures > 0) {
    areasForImprovement.push("Prevention measures are not demonstrating sufficient effectiveness — review and adapt strategies");
  }

  // ── Actions ──
  const actions: string[] = [];
  if (incidentMgmt.severeCount > 0) {
    actions.push(
      `URGENT: Review ${incidentMgmt.severeCount} severe damage incident(s) and assess environmental safety`,
    );
  }
  if (condition.totalInspections === 0) {
    actions.push("URGENT: Schedule property inspection — none recorded in the assessment period");
  }
  if (incidentMgmt.totalIncidents > 0 && repairEff.totalRepairs === 0) {
    actions.push("URGENT: Action repairs for outstanding damage incidents");
  }
  if (
    incidentMgmt.therapeuticResponseRate < 70 &&
    periodIncidents.filter((i) => i.childInvolved).length > 0
  ) {
    actions.push(
      "URGENT: Ensure all child-involved damage incidents receive a therapeutic response",
    );
  }
  if (prevention.totalMeasures === 0 && incidentMgmt.totalIncidents > 0) {
    actions.push("URGENT: Develop prevention strategy based on incident patterns and child needs");
  }
  if (condition.maintenanceFollowedRate < 80 && condition.totalInspections > 0) {
    actions.push("HIGH: Review and reinforce maintenance schedule compliance");
  }
  if (repairEff.completionRate < 70 && incidentMgmt.totalIncidents > 0) {
    actions.push("HIGH: Prioritise completion of outstanding repairs");
  }
  if (prevention.effectivenessRate < 60 && prevention.totalMeasures > 0) {
    actions.push("MEDIUM: Review prevention measures and adapt those not demonstrating effectiveness");
  }

  // ── Regulatory Links ──
  const regulatoryLinks: string[] = [
    "CHR 2015, Reg 19 — Fitness of premises: maintaining safe environment",
    "CHR 2015, Reg 16 — Behaviour management: understanding damage in context",
    "SCCIF — Impact of leaders and managers: environmental quality",
    "NMS 7 — Accommodation: safe, well-maintained premises",
    "CHR 2015, Reg 13 — Financial viability: property maintenance costs",
    "Working Together 2023 — Understanding behaviour as communication",
    "UNCRC Article 27 — Right to adequate standard of living",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    referenceDate,
    overallScore,
    rating,
    incidentManagement: incidentMgmt,
    propertyCondition: condition,
    repairEffectiveness: repairEff,
    preventionStrategy: prevention,
    childDamageProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
