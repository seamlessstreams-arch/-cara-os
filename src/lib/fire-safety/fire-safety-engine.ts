// ══════════════════════════════════════════════════════════════════════════════
// FIRE SAFETY INTELLIGENCE ENGINE
//
// Pure deterministic engine for evaluating fire safety compliance in
// children's residential care homes, covering fire drills, equipment
// maintenance, risk assessments, evacuation planning, and staff training.
//
// Regulatory basis:
//   - CHR 2015, Reg 25 — Fire precautions (premises safety, fire drills)
//   - Regulatory Reform (Fire Safety) Order 2005 — Fire risk assessment,
//     equipment maintenance, evacuation procedures, staff training
//   - SCCIF — Social Care Common Inspection Framework (Ofsted)
//   - Health and Safety at Work Act 1974 — General duty of care
//
// No AI. No external calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ──────────────────────────────────────────────────────────────────

export type DrillType =
  | "full_evacuation"
  | "partial_evacuation"
  | "night_drill"
  | "tabletop_exercise";

export type EquipmentType =
  | "fire_extinguisher"
  | "smoke_detector"
  | "fire_blanket"
  | "emergency_lighting"
  | "fire_door"
  | "sprinkler_system"
  | "alarm_panel"
  | "call_point";

export type EquipmentStatus =
  | "operational"
  | "needs_repair"
  | "out_of_service"
  | "due_inspection"
  | "replaced";

export type RiskLevel = "low" | "medium" | "high" | "critical";

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface FireDrill {
  id: string;
  homeId: string;
  date: string;
  drillType: DrillType;
  timeOfDay: "day" | "evening" | "night";
  childrenPresent: number;
  childrenEvacuated: number;
  evacuationTimeSeconds: number;
  targetTimeSeconds: number;
  allAccountedFor: boolean;
  issuesIdentified: string[];
  staffLed: string;
  debriefCompleted: boolean;
}

export interface FireEquipment {
  id: string;
  homeId: string;
  equipmentType: EquipmentType;
  location: string;
  lastInspectionDate: string;
  nextInspectionDate: string;
  status: EquipmentStatus;
  notes: string;
}

export interface FireRiskAssessment {
  id: string;
  homeId: string;
  assessmentDate: string;
  assessedBy: string;
  nextDueDate: string;
  riskLevel: RiskLevel;
  findingsCount: number;
  actionsRequired: number;
  actionsCompleted: number;
  sharedWithStaff: boolean;
}

export interface EvacuationPlan {
  id: string;
  homeId: string;
  lastReviewed: string;
  assemblyPoint: string;
  specialConsiderations: string[];
  peepPlans: number;
  childrenRequiringPeep: number;
}

export interface FireSafetyTraining {
  staffId: string;
  staffName: string;
  trainingDate: string;
  expiryDate: string;
  trainingType: "basic" | "advanced" | "fire_marshal";
  passed: boolean;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface DrillComplianceEvaluation {
  totalDrills: number;
  drillsByType: Record<string, number>;
  monthlyFrequency: number;
  nightDrillsPerQuarter: number;
  meetsMonthlyTarget: boolean;
  meetsNightDrillTarget: boolean;
  averageEvacuationTimeSeconds: number | null;
  averageTargetTimeSeconds: number | null;
  evacuationOnTarget: number;
  evacuationOverTarget: number;
  evacuationTargetRate: number;
  allAccountedForRate: number;
  debriefRate: number;
  totalIssues: number;
  drillScore: number;
}

export interface EquipmentMaintenanceEvaluation {
  totalEquipment: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  operationalCount: number;
  operationalRate: number;
  needsRepairCount: number;
  outOfServiceCount: number;
  dueInspectionCount: number;
  overdueInspections: number;
  inspectionComplianceRate: number;
  criticalIssues: { equipmentId: string; equipmentType: EquipmentType; location: string; status: EquipmentStatus; note: string }[];
  equipmentScore: number;
}

export interface RiskAssessmentEvaluation {
  totalAssessments: number;
  currentAssessments: number;
  overdueAssessments: number;
  currentRate: number;
  averageRiskLevel: string;
  riskLevelCounts: Record<string, number>;
  totalFindings: number;
  totalActionsRequired: number;
  totalActionsCompleted: number;
  actionCompletionRate: number;
  sharedWithStaffRate: number;
  assessmentScore: number;
}

export interface TrainingAndPlanningEvaluation {
  totalStaffTrained: number;
  currentTraining: number;
  expiredTraining: number;
  trainingCurrencyRate: number;
  byTrainingType: Record<string, number>;
  passRate: number;
  hasFireMarshal: boolean;
  evacuationPlanReviewed: boolean;
  evacuationPlanAge: number | null;
  peepCoverage: number;
  peepCoverageRate: number;
  specialConsiderationsDocumented: number;
  trainingScore: number;
}

export interface FireSafetyIntelligence {
  homeId: string;
  assessedAt: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: "outstanding" | "good" | "requires_improvement" | "inadequate";
  drillCompliance: DrillComplianceEvaluation;
  equipmentMaintenance: EquipmentMaintenanceEvaluation;
  riskAssessment: RiskAssessmentEvaluation;
  trainingAndPlanning: TrainingAndPlanningEvaluation;
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

function daysBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA);
  const b = new Date(dateB);
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function safePercent(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 100);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ── 1. Evaluate Drill Compliance (25 points) ──────────────────────────────

export function evaluateDrillCompliance(
  drills: FireDrill[],
  periodStart: string,
  periodEnd: string,
): DrillComplianceEvaluation {
  if (drills.length === 0) {
    return {
      totalDrills: 0,
      drillsByType: {},
      monthlyFrequency: 0,
      nightDrillsPerQuarter: 0,
      meetsMonthlyTarget: false,
      meetsNightDrillTarget: false,
      averageEvacuationTimeSeconds: null,
      averageTargetTimeSeconds: null,
      evacuationOnTarget: 0,
      evacuationOverTarget: 0,
      evacuationTargetRate: 0,
      allAccountedForRate: 0,
      debriefRate: 0,
      totalIssues: 0,
      drillScore: 0,
    };
  }

  // Filter to period
  const periodDrills = drills.filter((d) => d.date >= periodStart && d.date <= periodEnd);
  const totalDrills = periodDrills.length;

  if (totalDrills === 0) {
    return {
      totalDrills: 0,
      drillsByType: {},
      monthlyFrequency: 0,
      nightDrillsPerQuarter: 0,
      meetsMonthlyTarget: false,
      meetsNightDrillTarget: false,
      averageEvacuationTimeSeconds: null,
      averageTargetTimeSeconds: null,
      evacuationOnTarget: 0,
      evacuationOverTarget: 0,
      evacuationTargetRate: 0,
      allAccountedForRate: 0,
      debriefRate: 0,
      totalIssues: 0,
      drillScore: 0,
    };
  }

  // Drills by type
  const drillsByType: Record<string, number> = {};
  for (const d of periodDrills) {
    drillsByType[d.drillType] = (drillsByType[d.drillType] ?? 0) + 1;
  }

  // Monthly frequency
  const months = Math.max(1, daysBetween(periodStart, periodEnd) / 30);
  const monthlyFrequency = Math.round((totalDrills / months) * 10) / 10;

  // Night drills per quarter
  const nightDrills = periodDrills.filter(
    (d) => d.drillType === "night_drill" || d.timeOfDay === "night",
  ).length;
  const quarters = Math.max(1, months / 3);
  const nightDrillsPerQuarter = Math.round((nightDrills / quarters) * 10) / 10;

  const meetsMonthlyTarget = monthlyFrequency >= 1;
  const meetsNightDrillTarget = nightDrillsPerQuarter >= 1;

  // Evacuation times
  const evacuationDrills = periodDrills.filter(
    (d) => d.evacuationTimeSeconds > 0 && d.targetTimeSeconds > 0,
  );
  const avgEvacTime = evacuationDrills.length > 0
    ? Math.round(
        evacuationDrills.reduce((sum, d) => sum + d.evacuationTimeSeconds, 0) /
          evacuationDrills.length,
      )
    : null;
  const avgTargetTime = evacuationDrills.length > 0
    ? Math.round(
        evacuationDrills.reduce((sum, d) => sum + d.targetTimeSeconds, 0) /
          evacuationDrills.length,
      )
    : null;

  const onTarget = evacuationDrills.filter(
    (d) => d.evacuationTimeSeconds <= d.targetTimeSeconds,
  ).length;
  const overTarget = evacuationDrills.filter(
    (d) => d.evacuationTimeSeconds > d.targetTimeSeconds,
  ).length;

  // All accounted for
  const allAccountedFor = periodDrills.filter((d) => d.allAccountedFor).length;

  // Debrief rate
  const debriefed = periodDrills.filter((d) => d.debriefCompleted).length;

  // Total issues
  const totalIssues = periodDrills.reduce(
    (sum, d) => sum + d.issuesIdentified.length,
    0,
  );

  // Scoring: 25 points
  // Frequency: 8 points (monthly compliance)
  const freqScore = meetsMonthlyTarget ? 6 : clamp(Math.round(monthlyFrequency * 6), 0, 6);
  const nightScore = meetsNightDrillTarget ? 2 : nightDrills > 0 ? 1 : 0;

  // Evacuation performance: 7 points
  const evacTargetRate = evacuationDrills.length > 0
    ? safePercent(onTarget, evacuationDrills.length)
    : 0;
  const evacScore = evacuationDrills.length > 0
    ? Math.round((evacTargetRate / 100) * 7)
    : 0;

  // Accountability: 5 points
  const accountedRate = safePercent(allAccountedFor, totalDrills);
  const accountScore = Math.round((accountedRate / 100) * 5);

  // Debrief: 5 points
  const debriefRate = safePercent(debriefed, totalDrills);
  const debriefScore = Math.round((debriefRate / 100) * 5);

  const drillScore = clamp(freqScore + nightScore + evacScore + accountScore + debriefScore, 0, 25);

  return {
    totalDrills,
    drillsByType,
    monthlyFrequency,
    nightDrillsPerQuarter,
    meetsMonthlyTarget,
    meetsNightDrillTarget,
    averageEvacuationTimeSeconds: avgEvacTime,
    averageTargetTimeSeconds: avgTargetTime,
    evacuationOnTarget: onTarget,
    evacuationOverTarget: overTarget,
    evacuationTargetRate: evacTargetRate,
    allAccountedForRate: accountedRate,
    debriefRate,
    totalIssues,
    drillScore,
  };
}

// ── 2. Evaluate Equipment Maintenance (25 points) ─────────────────────────

export function evaluateEquipmentMaintenance(
  equipment: FireEquipment[],
  referenceDate: string,
): EquipmentMaintenanceEvaluation {
  if (equipment.length === 0) {
    return {
      totalEquipment: 0,
      byType: {},
      byStatus: {},
      operationalCount: 0,
      operationalRate: 0,
      needsRepairCount: 0,
      outOfServiceCount: 0,
      dueInspectionCount: 0,
      overdueInspections: 0,
      inspectionComplianceRate: 0,
      criticalIssues: [],
      equipmentScore: 0,
    };
  }

  const total = equipment.length;

  // By type
  const byType: Record<string, number> = {};
  for (const e of equipment) {
    byType[e.equipmentType] = (byType[e.equipmentType] ?? 0) + 1;
  }

  // By status
  const byStatus: Record<string, number> = {};
  for (const e of equipment) {
    byStatus[e.status] = (byStatus[e.status] ?? 0) + 1;
  }

  const operationalCount = equipment.filter((e) => e.status === "operational").length;
  const needsRepairCount = equipment.filter((e) => e.status === "needs_repair").length;
  const outOfServiceCount = equipment.filter((e) => e.status === "out_of_service").length;
  const dueInspectionCount = equipment.filter((e) => e.status === "due_inspection").length;

  // Overdue inspections: nextInspectionDate is before referenceDate
  const overdueInspections = equipment.filter(
    (e) => e.nextInspectionDate < referenceDate,
  ).length;

  // Inspection compliance: equipment NOT overdue
  const compliant = total - overdueInspections;
  const inspectionComplianceRate = safePercent(compliant, total);

  // Critical issues: out of service or needs repair
  const criticalIssues = equipment
    .filter((e) => e.status === "out_of_service" || e.status === "needs_repair")
    .map((e) => ({
      equipmentId: e.id,
      equipmentType: e.equipmentType,
      location: e.location,
      status: e.status,
      note: e.notes,
    }));

  // Scoring: 25 points
  // Operational rate: 10 points
  const operationalRate = safePercent(operationalCount, total);
  const opScore = Math.round((operationalRate / 100) * 10);

  // Inspection compliance: 8 points
  const inspScore = Math.round((inspectionComplianceRate / 100) * 8);

  // Out of service penalty: up to -5 points
  const oosPenalty = outOfServiceCount > 0 ? Math.min(5, outOfServiceCount * 2) : 0;

  // Needs repair penalty: up to -3 points
  const repairPenalty = needsRepairCount > 0 ? Math.min(3, needsRepairCount) : 0;

  // Base of 7 points for having equipment documented, minus penalties
  const baseDocScore = total > 0 ? 7 : 0;
  const penalizedScore = Math.max(0, baseDocScore - oosPenalty - repairPenalty);

  const equipmentScore = clamp(opScore + inspScore + penalizedScore, 0, 25);

  return {
    totalEquipment: total,
    byType,
    byStatus,
    operationalCount,
    operationalRate,
    needsRepairCount,
    outOfServiceCount,
    dueInspectionCount,
    overdueInspections,
    inspectionComplianceRate,
    criticalIssues,
    equipmentScore,
  };
}

// ── 3. Evaluate Risk Assessments (25 points) ──────────────────────────────

export function evaluateRiskAssessments(
  assessments: FireRiskAssessment[],
  referenceDate: string,
): RiskAssessmentEvaluation {
  if (assessments.length === 0) {
    return {
      totalAssessments: 0,
      currentAssessments: 0,
      overdueAssessments: 0,
      currentRate: 0,
      averageRiskLevel: "unknown",
      riskLevelCounts: {},
      totalFindings: 0,
      totalActionsRequired: 0,
      totalActionsCompleted: 0,
      actionCompletionRate: 0,
      sharedWithStaffRate: 0,
      assessmentScore: 0,
    };
  }

  const total = assessments.length;

  // Current: nextDueDate is on or after referenceDate
  const currentAssessments = assessments.filter(
    (a) => a.nextDueDate >= referenceDate,
  ).length;
  const overdueAssessments = total - currentAssessments;

  // Risk level counts
  const riskLevelCounts: Record<string, number> = {};
  for (const a of assessments) {
    riskLevelCounts[a.riskLevel] = (riskLevelCounts[a.riskLevel] ?? 0) + 1;
  }

  // Average risk level (numerical mapping: low=1, medium=2, high=3, critical=4)
  const riskMap: Record<string, number> = { low: 1, medium: 2, high: 3, critical: 4 };
  const riskSum = assessments.reduce((sum, a) => sum + (riskMap[a.riskLevel] ?? 2), 0);
  const avgRiskNum = riskSum / total;
  const averageRiskLevel =
    avgRiskNum <= 1.5 ? "low" : avgRiskNum <= 2.5 ? "medium" : avgRiskNum <= 3.5 ? "high" : "critical";

  // Findings and actions
  const totalFindings = assessments.reduce((sum, a) => sum + a.findingsCount, 0);
  const totalActionsRequired = assessments.reduce((sum, a) => sum + a.actionsRequired, 0);
  const totalActionsCompleted = assessments.reduce((sum, a) => sum + a.actionsCompleted, 0);
  const actionCompletionRate = safePercent(totalActionsCompleted, totalActionsRequired);

  // Shared with staff
  const sharedWithStaff = assessments.filter((a) => a.sharedWithStaff).length;
  const sharedWithStaffRate = safePercent(sharedWithStaff, total);

  // Scoring: 25 points
  // Currency: 8 points
  const currentRate = safePercent(currentAssessments, total);
  const currencyScore = Math.round((currentRate / 100) * 8);

  // Action completion: 7 points
  const actionScore = Math.round((actionCompletionRate / 100) * 7);

  // Risk level bonus: lower average risk = better (5 points)
  const riskScore =
    averageRiskLevel === "low" ? 5
      : averageRiskLevel === "medium" ? 3
        : averageRiskLevel === "high" ? 1
          : 0;

  // Shared with staff: 5 points
  const sharedScore = Math.round((sharedWithStaffRate / 100) * 5);

  const assessmentScore = clamp(currencyScore + actionScore + riskScore + sharedScore, 0, 25);

  return {
    totalAssessments: total,
    currentAssessments,
    overdueAssessments,
    currentRate,
    averageRiskLevel,
    riskLevelCounts,
    totalFindings,
    totalActionsRequired,
    totalActionsCompleted,
    actionCompletionRate,
    sharedWithStaffRate,
    assessmentScore,
  };
}

// ── 4. Evaluate Training & Planning (25 points) ──────────────────────────

export function evaluateTrainingAndPlanning(
  training: FireSafetyTraining[],
  evacuationPlan: EvacuationPlan | null,
  referenceDate: string,
): TrainingAndPlanningEvaluation {
  // Training evaluation
  const totalStaffTrained = training.length;
  const currentTraining = training.filter((t) => t.expiryDate >= referenceDate && t.passed).length;
  const expiredTraining = training.filter((t) => t.expiryDate < referenceDate).length;
  const trainingCurrencyRate = safePercent(currentTraining, totalStaffTrained);

  const byTrainingType: Record<string, number> = {};
  for (const t of training) {
    byTrainingType[t.trainingType] = (byTrainingType[t.trainingType] ?? 0) + 1;
  }

  const passed = training.filter((t) => t.passed).length;
  const passRate = safePercent(passed, totalStaffTrained);
  const hasFireMarshal = training.some(
    (t) => t.trainingType === "fire_marshal" && t.expiryDate >= referenceDate && t.passed,
  );

  // Evacuation plan evaluation
  const evacuationPlanReviewed = evacuationPlan !== null;
  let evacuationPlanAge: number | null = null;
  let peepCoverage = 0;
  let peepCoverageRate = 0;
  let specialConsiderationsDocumented = 0;

  if (evacuationPlan) {
    evacuationPlanAge = daysBetween(evacuationPlan.lastReviewed, referenceDate);
    peepCoverage = evacuationPlan.peepPlans;
    peepCoverageRate = evacuationPlan.childrenRequiringPeep > 0
      ? safePercent(evacuationPlan.peepPlans, evacuationPlan.childrenRequiringPeep)
      : 100;
    specialConsiderationsDocumented = evacuationPlan.specialConsiderations.length;
  }

  // Scoring: 25 points
  // Training currency: 8 points
  const currencyScore = Math.round((trainingCurrencyRate / 100) * 8);

  // Pass rate: 4 points
  const passScore = Math.round((passRate / 100) * 4);

  // Fire marshal: 3 points
  const marshalScore = hasFireMarshal ? 3 : 0;

  // Evacuation plan: 5 points
  let evacPlanScore = 0;
  if (evacuationPlan) {
    evacPlanScore += 2; // Has plan
    if (evacuationPlanAge !== null && evacuationPlanAge <= 365) evacPlanScore += 2; // Reviewed within year
    if (peepCoverageRate >= 100) evacPlanScore += 1; // All PEEPs in place
  }

  // PEEP and special considerations: 5 points
  const peepScore = evacuationPlan
    ? Math.round((peepCoverageRate / 100) * 3)
    : 0;
  const specConsScore = specialConsiderationsDocumented > 0 ? 2 : 0;

  const trainingScore = clamp(currencyScore + passScore + marshalScore + evacPlanScore + peepScore + specConsScore, 0, 25);

  return {
    totalStaffTrained,
    currentTraining,
    expiredTraining,
    trainingCurrencyRate,
    byTrainingType,
    passRate,
    hasFireMarshal,
    evacuationPlanReviewed,
    evacuationPlanAge,
    peepCoverage,
    peepCoverageRate,
    specialConsiderationsDocumented,
    trainingScore,
  };
}

// ── 5. Generate Full Intelligence ─────────────────────────────────────────

export function generateFireSafetyIntelligence(
  drills: FireDrill[],
  equipment: FireEquipment[],
  assessments: FireRiskAssessment[],
  training: FireSafetyTraining[],
  evacuationPlan: EvacuationPlan | null,
  homeId: string,
  periodStart: string,
  periodEnd: string,
  referenceDate: string,
): FireSafetyIntelligence {
  const drillEval = evaluateDrillCompliance(drills, periodStart, periodEnd);
  const equipEval = evaluateEquipmentMaintenance(equipment, referenceDate);
  const riskEval = evaluateRiskAssessments(assessments, referenceDate);
  const trainEval = evaluateTrainingAndPlanning(training, evacuationPlan, referenceDate);

  // ── Scoring (100 points) ──────────────────────────────────────────────
  const overallScore = clamp(
    drillEval.drillScore + equipEval.equipmentScore + riskEval.assessmentScore + trainEval.trainingScore,
    0,
    100,
  );

  const rating: FireSafetyIntelligence["rating"] =
    overallScore >= 80
      ? "outstanding"
      : overallScore >= 60
        ? "good"
        : overallScore >= 40
          ? "requires_improvement"
          : "inadequate";

  // ── Strengths ─────────────────────────────────────────────────────────
  const strengths: string[] = [];

  if (drillEval.meetsMonthlyTarget)
    strengths.push("Fire drills are conducted at least monthly, meeting regulatory expectations");
  if (drillEval.meetsNightDrillTarget)
    strengths.push("Night drills are conducted at least quarterly, testing readiness at all hours");
  if (drillEval.evacuationTargetRate >= 80 && drillEval.totalDrills > 0)
    strengths.push("Evacuation times consistently within target, demonstrating effective practice");
  if (drillEval.allAccountedForRate === 100 && drillEval.totalDrills > 0)
    strengths.push("All children accounted for in every drill — robust accountability procedures");
  if (drillEval.debriefRate === 100 && drillEval.totalDrills > 0)
    strengths.push("Debriefs completed after every drill, supporting continuous improvement");
  if (equipEval.operationalRate >= 90 && equipEval.totalEquipment > 0)
    strengths.push("Fire safety equipment is well maintained with high operational rate");
  if (equipEval.outOfServiceCount === 0 && equipEval.totalEquipment > 0)
    strengths.push("No fire safety equipment is out of service");
  if (equipEval.inspectionComplianceRate === 100 && equipEval.totalEquipment > 0)
    strengths.push("All equipment inspections are up to date");
  if (riskEval.currentRate === 100 && riskEval.totalAssessments > 0)
    strengths.push("Fire risk assessments are current and within review period");
  if (riskEval.actionCompletionRate >= 90 && riskEval.totalActionsRequired > 0)
    strengths.push("Excellent completion rate for actions identified in risk assessments");
  if (riskEval.sharedWithStaffRate === 100 && riskEval.totalAssessments > 0)
    strengths.push("All fire risk assessments have been shared with staff");
  if (trainEval.trainingCurrencyRate >= 90 && trainEval.totalStaffTrained > 0)
    strengths.push("Staff fire safety training is current and comprehensive");
  if (trainEval.hasFireMarshal)
    strengths.push("Designated fire marshal with current training is in place");
  if (trainEval.peepCoverageRate === 100 && evacuationPlan && evacuationPlan.childrenRequiringPeep > 0)
    strengths.push("Personal Emergency Evacuation Plans (PEEPs) in place for all children requiring them");
  if (trainEval.evacuationPlanReviewed && trainEval.evacuationPlanAge !== null && trainEval.evacuationPlanAge <= 180)
    strengths.push("Evacuation plan has been recently reviewed");

  // ── Areas for Improvement ─────────────────────────────────────────────
  const areasForImprovement: string[] = [];

  if (drillEval.totalDrills === 0)
    areasForImprovement.push("No fire drills conducted during the review period — this is a serious compliance gap");
  if (!drillEval.meetsMonthlyTarget && drillEval.totalDrills > 0)
    areasForImprovement.push("Fire drills are not conducted monthly — frequency must increase to meet requirements");
  if (!drillEval.meetsNightDrillTarget && drillEval.totalDrills > 0)
    areasForImprovement.push("Night drills not conducted at required quarterly frequency");
  if (drillEval.evacuationTargetRate < 80 && drillEval.evacuationOnTarget + drillEval.evacuationOverTarget > 0)
    areasForImprovement.push("Evacuation times exceed targets in too many drills — practice and route review needed");
  if (drillEval.allAccountedForRate < 100 && drillEval.totalDrills > 0)
    areasForImprovement.push("Not all children accounted for in every drill — accountability procedures need strengthening");
  if (drillEval.debriefRate < 100 && drillEval.totalDrills > 0)
    areasForImprovement.push("Debriefs not completed after all drills — missed opportunities for learning");
  if (equipEval.outOfServiceCount > 0)
    areasForImprovement.push(`${equipEval.outOfServiceCount} fire safety equipment item(s) out of service — immediate action required`);
  if (equipEval.needsRepairCount > 0)
    areasForImprovement.push(`${equipEval.needsRepairCount} fire safety equipment item(s) need repair`);
  if (equipEval.overdueInspections > 0)
    areasForImprovement.push(`${equipEval.overdueInspections} equipment inspection(s) are overdue`);
  if (equipEval.operationalRate < 80 && equipEval.totalEquipment > 0)
    areasForImprovement.push("Equipment operational rate is below acceptable threshold");
  if (riskEval.overdueAssessments > 0)
    areasForImprovement.push(`${riskEval.overdueAssessments} fire risk assessment(s) are overdue for review`);
  if (riskEval.actionCompletionRate < 80 && riskEval.totalActionsRequired > 0)
    areasForImprovement.push("Actions from fire risk assessments are not being completed promptly");
  if (riskEval.sharedWithStaffRate < 100 && riskEval.totalAssessments > 0)
    areasForImprovement.push("Not all fire risk assessments have been shared with staff");
  if (riskEval.totalAssessments === 0)
    areasForImprovement.push("No fire risk assessment on record — this is a critical compliance gap");
  if (trainEval.expiredTraining > 0)
    areasForImprovement.push(`${trainEval.expiredTraining} staff member(s) have expired fire safety training`);
  if (trainEval.trainingCurrencyRate < 80 && trainEval.totalStaffTrained > 0)
    areasForImprovement.push("Staff fire safety training currency is below acceptable levels");
  if (!trainEval.hasFireMarshal)
    areasForImprovement.push("No designated fire marshal with current training — required under fire safety legislation");
  if (!trainEval.evacuationPlanReviewed)
    areasForImprovement.push("No evacuation plan on record — this must be developed and communicated immediately");
  if (trainEval.evacuationPlanAge !== null && trainEval.evacuationPlanAge > 365)
    areasForImprovement.push("Evacuation plan has not been reviewed in the past 12 months");
  if (trainEval.peepCoverageRate < 100 && evacuationPlan && evacuationPlan.childrenRequiringPeep > 0)
    areasForImprovement.push("Not all children requiring a Personal Emergency Evacuation Plan (PEEP) have one");

  // ── Actions ───────────────────────────────────────────────────────────
  const actions: string[] = [];

  if (drillEval.totalDrills === 0)
    actions.push("Conduct a fire drill immediately and establish a monthly schedule");
  if (!drillEval.meetsMonthlyTarget && drillEval.totalDrills > 0)
    actions.push("Increase fire drill frequency to at least monthly");
  if (!drillEval.meetsNightDrillTarget)
    actions.push("Schedule night drills at least once per quarter");
  if (drillEval.evacuationTargetRate < 100 && drillEval.totalDrills > 0)
    actions.push("Review evacuation routes and conduct additional practice for drills exceeding target times");
  if (drillEval.allAccountedForRate < 100 && drillEval.totalDrills > 0)
    actions.push("Strengthen roll-call and accountability procedures during evacuations");
  if (drillEval.debriefRate < 100 && drillEval.totalDrills > 0)
    actions.push("Ensure debriefs are completed after every fire drill");
  if (equipEval.outOfServiceCount > 0)
    actions.push("Arrange urgent repair or replacement of out-of-service fire safety equipment");
  if (equipEval.needsRepairCount > 0)
    actions.push("Schedule repairs for fire safety equipment flagged as needing attention");
  if (equipEval.overdueInspections > 0)
    actions.push("Complete overdue equipment inspections immediately");
  if (riskEval.totalAssessments === 0)
    actions.push("Commission a fire risk assessment for the premises without delay");
  if (riskEval.overdueAssessments > 0)
    actions.push("Complete overdue fire risk assessment reviews");
  if (riskEval.actionCompletionRate < 100 && riskEval.totalActionsRequired > 0)
    actions.push("Complete outstanding actions from fire risk assessments");
  if (riskEval.sharedWithStaffRate < 100 && riskEval.totalAssessments > 0)
    actions.push("Share fire risk assessment findings with all staff");
  if (trainEval.expiredTraining > 0)
    actions.push("Arrange refresher fire safety training for staff with expired certifications");
  if (!trainEval.hasFireMarshal)
    actions.push("Nominate and train a designated fire marshal");
  if (!trainEval.evacuationPlanReviewed)
    actions.push("Develop a written evacuation plan including assembly point and PEEP arrangements");
  if (trainEval.evacuationPlanAge !== null && trainEval.evacuationPlanAge > 365)
    actions.push("Review and update the evacuation plan — last review was over 12 months ago");
  if (trainEval.peepCoverageRate < 100 && evacuationPlan && evacuationPlan.childrenRequiringPeep > 0)
    actions.push("Develop PEEPs for all children identified as requiring one");

  // ── Regulatory Links ──────────────────────────────────────────────────
  const regulatoryLinks: string[] = [
    "CHR 2015, Reg 25 — Fire precautions: premises must have appropriate fire safety measures",
    "Regulatory Reform (Fire Safety) Order 2005 — Fire risk assessment, maintenance of equipment, evacuation procedures, drill requirements, staff training",
    "SCCIF — Social Care Common Inspection Framework: Ofsted evaluates fire safety as part of leadership and management judgement",
    "Health and Safety at Work Act 1974 — General duty of care for the safety of staff and children in the home",
  ];

  return {
    homeId,
    assessedAt: referenceDate,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    drillCompliance: drillEval,
    equipmentMaintenance: equipEval,
    riskAssessment: riskEval,
    trainingAndPlanning: trainEval,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
