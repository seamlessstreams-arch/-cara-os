// ══════════════════════════════════════════════════════════════════════════════
// EMERGENCY PREPAREDNESS & BUSINESS CONTINUITY INTELLIGENCE ENGINE
//
// Pure deterministic engine for evaluating emergency preparedness, drill
// readiness, business continuity planning, lone working safety, and
// incident response quality in children's residential care.
//
// Regulatory basis:
//   - CHR 2015, Reg 25 — Premises (fire safety, maintenance, suitability)
//   - CHR 2015, Reg 40 — Notification of events (serious incidents)
//   - Health and Safety at Work Act 1974
//   - Regulatory Reform (Fire Safety) Order 2005
//   - Civil Contingencies Act 2004
//
// No AI. No external calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ──────────────────────────────────────────────────────────────────

export type EmergencyType =
  | "fire"
  | "flood"
  | "gas_leak"
  | "power_failure"
  | "water_failure"
  | "pandemic"
  | "staffing_crisis"
  | "security_breach"
  | "severe_weather"
  | "missing_child"
  | "intruder"
  | "medical_emergency";

export type PlanStatus = "current" | "under_review" | "expired" | "draft";

export type DrillType =
  | "fire_evacuation"
  | "lockdown"
  | "missing_child"
  | "medical_emergency"
  | "power_failure"
  | "flood";

export type DrillOutcome = "successful" | "partial_success" | "failed";

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface EmergencyContact {
  role: string;
  name: string;
  phone: string;
  available24hr: boolean;
}

export interface EmergencyPlan {
  id: string;
  homeId: string;
  emergencyType: EmergencyType;
  planName: string;
  version: string;
  createdDate: string;
  lastReviewDate: string;
  nextReviewDate: string;
  status: PlanStatus;
  approvedBy: string;
  keyActions: string[];
  contactList: EmergencyContact[];
  staffTrained: boolean;
  childrenBriefed: boolean;
}

export interface EmergencyDrill {
  id: string;
  homeId: string;
  drillType: DrillType;
  date: string;
  timeOfDay: "day" | "evening" | "night" | "weekend";
  conductedBy: string;
  participantsCount: number;
  childrenPresent: number;
  staffPresent: number;
  evacuationTimeMinutes?: number;
  outcome: DrillOutcome;
  issuesIdentified: string[];
  lessonsLearned: string[];
  actionsRequired: string[];
  actionsCompleted: boolean;
}

export interface BusinessContinuityPlan {
  id: string;
  homeId: string;
  scenarioType: string;
  lastReviewDate: string;
  nextReviewDate: string;
  status: PlanStatus;
  minimumStaffingLevel: number;
  alternativeAccommodation: boolean;
  itBackupPlan: boolean;
  communicationPlan: boolean;
  supplierAlternatives: boolean;
  keyDecisionMaker: string;
}

export interface LoneWorkingAssessment {
  id: string;
  homeId: string;
  assessmentDate: string;
  assessedBy: string;
  loneWorkingOccurs: boolean;
  riskLevel: "low" | "medium" | "high";
  mitigations: string[];
  checkInProtocol: boolean;
  emergencyProcedure: boolean;
  reviewDate: string;
}

export interface EmergencyIncident {
  id: string;
  homeId: string;
  date: string;
  emergencyType: EmergencyType;
  description: string;
  responseTimeMinutes: number;
  planFollowed: boolean;
  deviations?: string;
  notificationsCompleted: string[];
  childrenSafe: boolean;
  debriefCompleted: boolean;
  lessonsLearned: string[];
  actionsTaken: string[];
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface EmergencyPlanEvaluation {
  totalPlans: number;
  emergencyTypesCovered: EmergencyType[];
  emergencyTypesUncovered: EmergencyType[];
  coverageRate: number;
  currentPlans: number;
  expiredPlans: number;
  underReviewPlans: number;
  draftPlans: number;
  currencyRate: number;
  staffTrainingRate: number;
  childrenBriefingRate: number;
  contactListCompleteness: number;
  expiryAlerts: { planId: string; planName: string; nextReviewDate: string; daysUntilExpiry: number }[];
}

export interface DrillReadinessEvaluation {
  totalDrills: number;
  drillsByType: Record<string, number>;
  drillFrequencyPerType: Record<string, number>;
  timeOfDayVariety: { day: number; evening: number; night: number; weekend: number };
  timeOfDayVarietyScore: number;
  successRate: number;
  partialSuccessRate: number;
  failureRate: number;
  averageEvacuationTimeMinutes: number | null;
  actionsCompletionRate: number;
  lessonsLearnedCaptured: number;
  totalIssuesIdentified: number;
}

export interface BusinessContinuityEvaluation {
  totalPlans: number;
  currentPlans: number;
  coverageRate: number;
  currencyRate: number;
  minimumStaffingDocumented: number;
  alternativeAccommodationArranged: number;
  itBackupRate: number;
  communicationPlanRate: number;
  supplierAlternativesRate: number;
}

export interface LoneWorkingEvaluation {
  totalAssessments: number;
  currentAssessments: number;
  currencyRate: number;
  loneWorkingOccurs: boolean;
  riskLevels: { low: number; medium: number; high: number };
  mitigationInPlace: number;
  checkInProtocolRate: number;
  emergencyProcedureRate: number;
}

export interface IncidentResponseEvaluation {
  totalIncidents: number;
  averageResponseTimeMinutes: number | null;
  planAdherenceRate: number;
  notificationCompletenessRate: number;
  childrenSafeRate: number;
  debriefRate: number;
  lessonsLearnedCaptured: number;
  incidentsByType: Record<string, number>;
}

export interface EmergencyPreparednessIntelligence {
  homeId: string;
  assessedAt: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: "outstanding" | "good" | "requires_improvement" | "inadequate";
  emergencyPlans: EmergencyPlanEvaluation;
  drillReadiness: DrillReadinessEvaluation;
  businessContinuity: BusinessContinuityEvaluation;
  loneWorking: LoneWorkingEvaluation;
  incidentResponse: IncidentResponseEvaluation;
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Constants ──────────────────────────────────────────────────────────────

const ALL_EMERGENCY_TYPES: EmergencyType[] = [
  "fire", "flood", "gas_leak", "power_failure", "water_failure",
  "pandemic", "staffing_crisis", "security_breach", "severe_weather",
  "missing_child", "intruder", "medical_emergency",
];

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

// ── 1. Evaluate Emergency Plans ────────────────────────────────────────────

export function evaluateEmergencyPlans(
  plans: EmergencyPlan[],
  referenceDate: string,
): EmergencyPlanEvaluation {
  if (plans.length === 0) {
    return {
      totalPlans: 0,
      emergencyTypesCovered: [],
      emergencyTypesUncovered: [...ALL_EMERGENCY_TYPES],
      coverageRate: 0,
      currentPlans: 0,
      expiredPlans: 0,
      underReviewPlans: 0,
      draftPlans: 0,
      currencyRate: 0,
      staffTrainingRate: 0,
      childrenBriefingRate: 0,
      contactListCompleteness: 0,
      expiryAlerts: [],
    };
  }

  const typesCovered = [...new Set(plans.map((p) => p.emergencyType))];
  const typesUncovered = ALL_EMERGENCY_TYPES.filter((t) => !typesCovered.includes(t));

  const currentPlans = plans.filter((p) => p.status === "current").length;
  const expiredPlans = plans.filter((p) => p.status === "expired").length;
  const underReviewPlans = plans.filter((p) => p.status === "under_review").length;
  const draftPlans = plans.filter((p) => p.status === "draft").length;

  // Currency: plans whose nextReviewDate is on or after referenceDate
  const currentOrReviewed = plans.filter(
    (p) => p.status === "current" || p.status === "under_review",
  ).length;

  const staffTrained = plans.filter((p) => p.staffTrained).length;
  const childrenBriefed = plans.filter((p) => p.childrenBriefed).length;

  // Contact list completeness: plans with at least one 24hr contact
  const plansWithComplete = plans.filter(
    (p) => p.contactList.length > 0 && p.contactList.some((c) => c.available24hr),
  ).length;

  // Expiry alerts: plans expiring within 30 days or already expired
  const expiryAlerts = plans
    .map((p) => {
      const daysUntil = daysBetween(referenceDate, p.nextReviewDate);
      return {
        planId: p.id,
        planName: p.planName,
        nextReviewDate: p.nextReviewDate,
        daysUntilExpiry: daysUntil,
      };
    })
    .filter((a) => a.daysUntilExpiry <= 30)
    .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);

  return {
    totalPlans: plans.length,
    emergencyTypesCovered: typesCovered,
    emergencyTypesUncovered: typesUncovered,
    coverageRate: safePercent(typesCovered.length, ALL_EMERGENCY_TYPES.length),
    currentPlans,
    expiredPlans,
    underReviewPlans,
    draftPlans,
    currencyRate: safePercent(currentOrReviewed, plans.length),
    staffTrainingRate: safePercent(staffTrained, plans.length),
    childrenBriefingRate: safePercent(childrenBriefed, plans.length),
    contactListCompleteness: safePercent(plansWithComplete, plans.length),
    expiryAlerts,
  };
}

// ── 2. Evaluate Drill Readiness ────────────────────────────────────────────

export function evaluateDrillReadiness(
  drills: EmergencyDrill[],
  periodStart: string,
  periodEnd: string,
): DrillReadinessEvaluation {
  if (drills.length === 0) {
    return {
      totalDrills: 0,
      drillsByType: {},
      drillFrequencyPerType: {},
      timeOfDayVariety: { day: 0, evening: 0, night: 0, weekend: 0 },
      timeOfDayVarietyScore: 0,
      successRate: 0,
      partialSuccessRate: 0,
      failureRate: 0,
      averageEvacuationTimeMinutes: null,
      actionsCompletionRate: 0,
      lessonsLearnedCaptured: 0,
      totalIssuesIdentified: 0,
    };
  }

  // Filter drills to period
  const periodDrills = drills.filter((d) => d.date >= periodStart && d.date <= periodEnd);
  const totalDrills = periodDrills.length;

  if (totalDrills === 0) {
    return {
      totalDrills: 0,
      drillsByType: {},
      drillFrequencyPerType: {},
      timeOfDayVariety: { day: 0, evening: 0, night: 0, weekend: 0 },
      timeOfDayVarietyScore: 0,
      successRate: 0,
      partialSuccessRate: 0,
      failureRate: 0,
      averageEvacuationTimeMinutes: null,
      actionsCompletionRate: 0,
      lessonsLearnedCaptured: 0,
      totalIssuesIdentified: 0,
    };
  }

  // Drills by type
  const drillsByType: Record<string, number> = {};
  for (const d of periodDrills) {
    drillsByType[d.drillType] = (drillsByType[d.drillType] ?? 0) + 1;
  }

  // Frequency per type (per period)
  const months = Math.max(1, daysBetween(periodStart, periodEnd) / 30);
  const drillFrequencyPerType: Record<string, number> = {};
  for (const [type, count] of Object.entries(drillsByType)) {
    drillFrequencyPerType[type] = Math.round((count / months) * 10) / 10;
  }

  // Time of day variety
  const timeOfDayVariety = { day: 0, evening: 0, night: 0, weekend: 0 };
  for (const d of periodDrills) {
    timeOfDayVariety[d.timeOfDay]++;
  }
  const uniqueTimes = Object.values(timeOfDayVariety).filter((v) => v > 0).length;
  const timeOfDayVarietyScore = safePercent(uniqueTimes, 4);

  // Outcomes
  const successful = periodDrills.filter((d) => d.outcome === "successful").length;
  const partialSuccess = periodDrills.filter((d) => d.outcome === "partial_success").length;
  const failed = periodDrills.filter((d) => d.outcome === "failed").length;

  // Evacuation time
  const evacuationDrills = periodDrills.filter((d) => d.evacuationTimeMinutes != null);
  const avgEvac = evacuationDrills.length > 0
    ? Math.round(
        (evacuationDrills.reduce((sum, d) => sum + d.evacuationTimeMinutes!, 0) /
          evacuationDrills.length) *
          10,
      ) / 10
    : null;

  // Actions completion
  const drillsWithActions = periodDrills.filter((d) => d.actionsRequired.length > 0);
  const actionsCompleted = drillsWithActions.filter((d) => d.actionsCompleted).length;

  // Lessons learned
  const lessonsLearnedCaptured = periodDrills.filter(
    (d) => d.lessonsLearned.length > 0,
  ).length;

  // Issues identified
  const totalIssuesIdentified = periodDrills.reduce(
    (sum, d) => sum + d.issuesIdentified.length,
    0,
  );

  return {
    totalDrills,
    drillsByType,
    drillFrequencyPerType,
    timeOfDayVariety,
    timeOfDayVarietyScore,
    successRate: safePercent(successful, totalDrills),
    partialSuccessRate: safePercent(partialSuccess, totalDrills),
    failureRate: safePercent(failed, totalDrills),
    averageEvacuationTimeMinutes: avgEvac,
    actionsCompletionRate:
      drillsWithActions.length > 0
        ? safePercent(actionsCompleted, drillsWithActions.length)
        : 100,
    lessonsLearnedCaptured,
    totalIssuesIdentified,
  };
}

// ── 3. Evaluate Business Continuity ────────────────────────────────────────

export function evaluateBusinessContinuity(
  bcPlans: BusinessContinuityPlan[],
  referenceDate: string,
): BusinessContinuityEvaluation {
  if (bcPlans.length === 0) {
    return {
      totalPlans: 0,
      currentPlans: 0,
      coverageRate: 0,
      currencyRate: 0,
      minimumStaffingDocumented: 0,
      alternativeAccommodationArranged: 0,
      itBackupRate: 0,
      communicationPlanRate: 0,
      supplierAlternativesRate: 0,
    };
  }

  const currentPlans = bcPlans.filter(
    (p) => p.status === "current" || p.status === "under_review",
  ).length;

  const withStaffing = bcPlans.filter((p) => p.minimumStaffingLevel > 0).length;
  const withAltAccom = bcPlans.filter((p) => p.alternativeAccommodation).length;
  const withItBackup = bcPlans.filter((p) => p.itBackupPlan).length;
  const withComms = bcPlans.filter((p) => p.communicationPlan).length;
  const withSuppliers = bcPlans.filter((p) => p.supplierAlternatives).length;

  return {
    totalPlans: bcPlans.length,
    currentPlans,
    coverageRate: safePercent(currentPlans, bcPlans.length),
    currencyRate: safePercent(currentPlans, bcPlans.length),
    minimumStaffingDocumented: withStaffing,
    alternativeAccommodationArranged: withAltAccom,
    itBackupRate: safePercent(withItBackup, bcPlans.length),
    communicationPlanRate: safePercent(withComms, bcPlans.length),
    supplierAlternativesRate: safePercent(withSuppliers, bcPlans.length),
  };
}

// ── 4. Evaluate Lone Working ───────────────────────────────────────────────

export function evaluateLoneWorking(
  assessments: LoneWorkingAssessment[],
  referenceDate: string,
): LoneWorkingEvaluation {
  if (assessments.length === 0) {
    return {
      totalAssessments: 0,
      currentAssessments: 0,
      currencyRate: 0,
      loneWorkingOccurs: false,
      riskLevels: { low: 0, medium: 0, high: 0 },
      mitigationInPlace: 0,
      checkInProtocolRate: 0,
      emergencyProcedureRate: 0,
    };
  }

  // Current: reviewDate is on or after referenceDate
  const currentAssessments = assessments.filter(
    (a) => a.reviewDate >= referenceDate,
  ).length;

  const loneWorkingOccurs = assessments.some((a) => a.loneWorkingOccurs);

  const riskLevels = { low: 0, medium: 0, high: 0 };
  for (const a of assessments) {
    riskLevels[a.riskLevel]++;
  }

  const withMitigations = assessments.filter((a) => a.mitigations.length > 0).length;
  const withCheckIn = assessments.filter((a) => a.checkInProtocol).length;
  const withEmergencyProc = assessments.filter((a) => a.emergencyProcedure).length;

  return {
    totalAssessments: assessments.length,
    currentAssessments,
    currencyRate: safePercent(currentAssessments, assessments.length),
    loneWorkingOccurs,
    riskLevels,
    mitigationInPlace: withMitigations,
    checkInProtocolRate: safePercent(withCheckIn, assessments.length),
    emergencyProcedureRate: safePercent(withEmergencyProc, assessments.length),
  };
}

// ── 5. Evaluate Incident Response ──────────────────────────────────────────

export function evaluateIncidentResponse(
  incidents: EmergencyIncident[],
): IncidentResponseEvaluation {
  if (incidents.length === 0) {
    return {
      totalIncidents: 0,
      averageResponseTimeMinutes: null,
      planAdherenceRate: 0,
      notificationCompletenessRate: 0,
      childrenSafeRate: 0,
      debriefRate: 0,
      lessonsLearnedCaptured: 0,
      incidentsByType: {},
    };
  }

  const total = incidents.length;

  const avgResponse =
    Math.round(
      (incidents.reduce((sum, i) => sum + i.responseTimeMinutes, 0) / total) * 10,
    ) / 10;

  const planFollowed = incidents.filter((i) => i.planFollowed).length;
  const withNotifications = incidents.filter(
    (i) => i.notificationsCompleted.length > 0,
  ).length;
  const childrenSafe = incidents.filter((i) => i.childrenSafe).length;
  const debriefed = incidents.filter((i) => i.debriefCompleted).length;
  const lessonsCapture = incidents.filter((i) => i.lessonsLearned.length > 0).length;

  const incidentsByType: Record<string, number> = {};
  for (const i of incidents) {
    incidentsByType[i.emergencyType] = (incidentsByType[i.emergencyType] ?? 0) + 1;
  }

  return {
    totalIncidents: total,
    averageResponseTimeMinutes: avgResponse,
    planAdherenceRate: safePercent(planFollowed, total),
    notificationCompletenessRate: safePercent(withNotifications, total),
    childrenSafeRate: safePercent(childrenSafe, total),
    debriefRate: safePercent(debriefed, total),
    lessonsLearnedCaptured: lessonsCapture,
    incidentsByType,
  };
}

// ── 6. Generate Full Intelligence ──────────────────────────────────────────

export function generateEmergencyPreparednessIntelligence(
  plans: EmergencyPlan[],
  drills: EmergencyDrill[],
  bcPlans: BusinessContinuityPlan[],
  loneWorking: LoneWorkingAssessment[],
  incidents: EmergencyIncident[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
  referenceDate: string,
): EmergencyPreparednessIntelligence {
  const planEval = evaluateEmergencyPlans(plans, referenceDate);
  const drillEval = evaluateDrillReadiness(drills, periodStart, periodEnd);
  const bcEval = evaluateBusinessContinuity(bcPlans, referenceDate);
  const lwEval = evaluateLoneWorking(loneWorking, referenceDate);
  const irEval = evaluateIncidentResponse(incidents);

  // ── Scoring (100 points) ────────────────────────────────────────────────

  // Emergency plans: 25 points
  const planCoverageScore = (planEval.coverageRate / 100) * 7;
  const planCurrencyScore = (planEval.currencyRate / 100) * 7;
  const planTrainingScore = (planEval.staffTrainingRate / 100) * 5;
  const planBriefingScore = (planEval.childrenBriefingRate / 100) * 3;
  const planContactScore = (planEval.contactListCompleteness / 100) * 3;
  const planScore = clamp(
    Math.round(
      planCoverageScore + planCurrencyScore + planTrainingScore + planBriefingScore + planContactScore,
    ),
    0,
    25,
  );

  // Drill readiness: 25 points
  const drillFreqScore = drillEval.totalDrills > 0 ? Math.min(8, drillEval.totalDrills * 1.5) : 0;
  const drillVarietyScore = (drillEval.timeOfDayVarietyScore / 100) * 5;
  const drillSuccessScore = (drillEval.successRate / 100) * 7;
  const drillActionsScore = (drillEval.actionsCompletionRate / 100) * 5;
  const drillScore = clamp(
    Math.round(drillFreqScore + drillVarietyScore + drillSuccessScore + drillActionsScore),
    0,
    25,
  );

  // Business continuity: 20 points
  const bcCoverageScore = bcEval.totalPlans > 0 ? (bcEval.coverageRate / 100) * 5 : 0;
  const bcCurrencyScore = (bcEval.currencyRate / 100) * 4;
  const bcStaffingScore =
    bcEval.totalPlans > 0
      ? (safePercent(bcEval.minimumStaffingDocumented, bcEval.totalPlans) / 100) * 3
      : 0;
  const bcAccomScore =
    bcEval.totalPlans > 0
      ? (safePercent(bcEval.alternativeAccommodationArranged, bcEval.totalPlans) / 100) * 3
      : 0;
  const bcItScore = (bcEval.itBackupRate / 100) * 2;
  const bcCommsScore = (bcEval.communicationPlanRate / 100) * 3;
  const bcScore = clamp(
    Math.round(
      bcCoverageScore + bcCurrencyScore + bcStaffingScore + bcAccomScore + bcItScore + bcCommsScore,
    ),
    0,
    20,
  );

  // Lone working & incident response: 30 points
  const lwCurrencyScore = (lwEval.currencyRate / 100) * 5;
  const lwCheckInScore = (lwEval.checkInProtocolRate / 100) * 4;
  const lwEmergencyScore = (lwEval.emergencyProcedureRate / 100) * 3;
  const lwSubScore = clamp(Math.round(lwCurrencyScore + lwCheckInScore + lwEmergencyScore), 0, 12);

  let irSubScore: number;
  if (irEval.totalIncidents === 0) {
    // No incidents — neutral, award midpoint
    irSubScore = 9;
  } else {
    const irPlanScore = (irEval.planAdherenceRate / 100) * 5;
    const irNotifScore = (irEval.notificationCompletenessRate / 100) * 3;
    const irSafeScore = (irEval.childrenSafeRate / 100) * 5;
    const irDebriefScore = (irEval.debriefRate / 100) * 3;
    const irResponseBonus = irEval.averageResponseTimeMinutes !== null
      ? irEval.averageResponseTimeMinutes <= 5 ? 2 : irEval.averageResponseTimeMinutes <= 10 ? 1 : 0
      : 0;
    irSubScore = clamp(
      Math.round(irPlanScore + irNotifScore + irSafeScore + irDebriefScore + irResponseBonus),
      0,
      18,
    );
  }

  const lwIrScore = clamp(lwSubScore + irSubScore, 0, 30);

  const overallScore = clamp(planScore + drillScore + bcScore + lwIrScore, 0, 100);

  const rating: EmergencyPreparednessIntelligence["rating"] =
    overallScore >= 80
      ? "outstanding"
      : overallScore >= 60
        ? "good"
        : overallScore >= 40
          ? "requires_improvement"
          : "inadequate";

  // ── Strengths ───────────────────────────────────────────────────────────

  const strengths: string[] = [];
  if (planEval.coverageRate >= 75)
    strengths.push("Good emergency plan coverage across multiple scenario types");
  if (planEval.currencyRate >= 80)
    strengths.push("Emergency plans are well maintained and up to date");
  if (planEval.staffTrainingRate >= 80)
    strengths.push("Staff training on emergency procedures is comprehensive");
  if (planEval.childrenBriefingRate >= 80)
    strengths.push("Children are well briefed on emergency procedures");
  if (drillEval.successRate >= 80)
    strengths.push("Drill success rate demonstrates effective emergency response capability");
  if (drillEval.timeOfDayVarietyScore >= 75)
    strengths.push("Drills conducted at varied times including evenings, nights, and weekends");
  if (bcEval.coverageRate >= 80)
    strengths.push("Business continuity plans are current and comprehensive");
  if (lwEval.checkInProtocolRate >= 80)
    strengths.push("Lone working check-in protocols are well established");
  if (irEval.totalIncidents > 0 && irEval.planAdherenceRate >= 80)
    strengths.push("Emergency plans were followed effectively during actual incidents");
  if (irEval.totalIncidents > 0 && irEval.childrenSafeRate === 100)
    strengths.push("All children were kept safe during emergency incidents");
  if (irEval.totalIncidents > 0 && irEval.debriefRate === 100)
    strengths.push("Debriefs completed after all emergency incidents, supporting organisational learning");

  // ── Areas for Improvement ───────────────────────────────────────────────

  const areasForImprovement: string[] = [];
  if (planEval.coverageRate < 50)
    areasForImprovement.push("Significant gaps in emergency plan coverage — several emergency types have no documented plan");
  if (planEval.expiredPlans > 0)
    areasForImprovement.push(`${planEval.expiredPlans} emergency plan(s) have expired and require immediate review`);
  if (planEval.staffTrainingRate < 75)
    areasForImprovement.push("Staff training on emergency procedures needs to be more consistent");
  if (planEval.childrenBriefingRate < 75)
    areasForImprovement.push("Not all children have been briefed on emergency procedures relevant to them");
  if (drillEval.totalDrills === 0)
    areasForImprovement.push("No emergency drills conducted during the review period");
  if (drillEval.failureRate > 10)
    areasForImprovement.push("Drill failure rate is above acceptable threshold — review training and procedures");
  if (drillEval.actionsCompletionRate < 80 && drillEval.totalDrills > 0)
    areasForImprovement.push("Actions identified from drills are not being completed in a timely manner");
  if (drillEval.timeOfDayVarietyScore < 50 && drillEval.totalDrills > 0)
    areasForImprovement.push("Drills are not being conducted across varied times of day — limited night/weekend practice");
  if (bcEval.totalPlans === 0)
    areasForImprovement.push("No business continuity plans documented");
  if (bcEval.communicationPlanRate < 100 && bcEval.totalPlans > 0)
    areasForImprovement.push("Not all business continuity plans include a communication strategy");
  if (lwEval.totalAssessments === 0)
    areasForImprovement.push("No lone working assessments completed");
  if (lwEval.currencyRate < 80 && lwEval.totalAssessments > 0)
    areasForImprovement.push("Lone working assessments require review to ensure they remain current");
  if (irEval.totalIncidents > 0 && irEval.planAdherenceRate < 80)
    areasForImprovement.push("Emergency plans were not consistently followed during incidents — review adherence barriers");
  if (irEval.totalIncidents > 0 && irEval.debriefRate < 100)
    areasForImprovement.push("Debriefs not completed after all incidents — missed opportunities for organisational learning");

  // ── Actions ─────────────────────────────────────────────────────────────

  const actions: string[] = [];
  if (planEval.emergencyTypesUncovered.length > 0)
    actions.push(`Develop emergency plans for uncovered scenarios: ${planEval.emergencyTypesUncovered.join(", ")}`);
  if (planEval.expiryAlerts.length > 0)
    actions.push(`Review ${planEval.expiryAlerts.length} emergency plan(s) approaching or past review date`);
  if (planEval.staffTrainingRate < 100)
    actions.push("Ensure all staff complete training on current emergency procedures");
  if (planEval.childrenBriefingRate < 100)
    actions.push("Brief all children on emergency procedures appropriate to their understanding");
  if (drillEval.totalDrills < 3)
    actions.push("Increase emergency drill frequency — minimum quarterly per drill type recommended");
  if (drillEval.failureRate > 0)
    actions.push("Address issues identified in failed drills and conduct repeat drills");
  if (drillEval.actionsCompletionRate < 100 && drillEval.totalDrills > 0)
    actions.push("Complete outstanding actions from previous emergency drills");
  if (bcEval.totalPlans === 0)
    actions.push("Develop business continuity plans covering key risk scenarios");
  if (lwEval.totalAssessments === 0)
    actions.push("Complete lone working risk assessment for the home");
  if (lwEval.checkInProtocolRate < 100 && lwEval.totalAssessments > 0)
    actions.push("Establish check-in protocols for all lone working situations");
  if (irEval.totalIncidents > 0 && irEval.debriefRate < 100)
    actions.push("Complete debriefs for all emergency incidents");

  // ── Regulatory Links ────────────────────────────────────────────────────

  const regulatoryLinks: string[] = [
    "CHR 2015, Reg 25 — Premises: fire safety, maintenance, environmental safety",
    "CHR 2015, Reg 40 — Notification of events to Ofsted within required timeframes",
    "Health and Safety at Work Act 1974 — General duty of care for staff and children",
    "Regulatory Reform (Fire Safety) Order 2005 — Fire risk assessment, evacuation procedures, drill requirements",
    "Civil Contingencies Act 2004 — Business continuity and emergency planning obligations",
  ];

  return {
    homeId,
    assessedAt: referenceDate,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    emergencyPlans: planEval,
    drillReadiness: drillEval,
    businessContinuity: bcEval,
    loneWorking: lwEval,
    incidentResponse: irEval,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
