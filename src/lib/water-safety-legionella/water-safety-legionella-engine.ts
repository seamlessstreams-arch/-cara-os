// ==============================================================================
// WATER SAFETY & LEGIONELLA INTELLIGENCE ENGINE
//
// Pure deterministic engine for evaluating water safety management in
// children's residential care homes, covering legionella risk assessments,
// water temperature monitoring, bath supervision protocols, scalding
// prevention measures, and staff awareness.
//
// Regulatory basis:
//   - Health and Safety at Work Act 1974
//   - CHR 2015, Reg 25 — Premises safety
//   - L8 Approved Code of Practice (Legionella)
//   - HSG274 (Legionella Technical Guidance)
//   - SCCIF — Social Care Common Inspection Framework (Ofsted)
//   - NMS 10 — National Minimum Standards
//   - COSHH Regulations 2002
//
// No AI. No external calls. Pure input -> output.
// ==============================================================================

// -- Type Unions ---------------------------------------------------------------

export type WaterSourceType =
  | "hot_tap"
  | "cold_tap"
  | "bath"
  | "shower"
  | "storage_tank"
  | "calorifier"
  | "dead_leg"
  | "other";

export type CheckOutcome = "pass" | "minor_issue" | "major_issue" | "fail";

export type RiskLevel = "low" | "medium" | "high" | "very_high";

export type ComplianceStatus =
  | "compliant"
  | "partially_compliant"
  | "non_compliant";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// -- Label Maps & Getters ------------------------------------------------------

const waterSourceTypeLabels: Record<WaterSourceType, string> = {
  hot_tap: "Hot Tap",
  cold_tap: "Cold Tap",
  bath: "Bath",
  shower: "Shower",
  storage_tank: "Storage Tank",
  calorifier: "Calorifier",
  dead_leg: "Dead Leg",
  other: "Other",
};

const checkOutcomeLabels: Record<CheckOutcome, string> = {
  pass: "Pass",
  minor_issue: "Minor Issue",
  major_issue: "Major Issue",
  fail: "Fail",
};

const riskLevelLabels: Record<RiskLevel, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  very_high: "Very High",
};

const complianceStatusLabels: Record<ComplianceStatus, string> = {
  compliant: "Compliant",
  partially_compliant: "Partially Compliant",
  non_compliant: "Non-Compliant",
};

const ratingLabels: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getWaterSourceTypeLabel(type: WaterSourceType): string {
  return waterSourceTypeLabels[type] ?? type;
}

export function getCheckOutcomeLabel(outcome: CheckOutcome): string {
  return checkOutcomeLabels[outcome] ?? outcome;
}

export function getRiskLevelLabel(level: RiskLevel): string {
  return riskLevelLabels[level] ?? level;
}

export function getComplianceStatusLabel(status: ComplianceStatus): string {
  return complianceStatusLabels[status] ?? status;
}

export function getRatingLabel(rating: Rating): string {
  return ratingLabels[rating] ?? rating;
}

// -- Input Interfaces ----------------------------------------------------------

export interface TemperatureCheck {
  id: string;
  sourceType: WaterSourceType;
  location: string;
  checkDate: string;
  checkedBy: string;
  temperatureCelsius: number;
  withinSafeRange: boolean;
  outcome: CheckOutcome;
  correctiveAction: boolean;
}

export interface LegionellaAssessment {
  id: string;
  assessmentDate: string;
  assessedBy: string;
  riskLevel: RiskLevel;
  flushingScheduleInPlace: boolean;
  waterTreatmentActive: boolean;
  deadLegsIdentified: boolean;
  deadLegsRemoved: boolean;
  nextAssessmentDue: string;
}

export interface WaterSafetyPolicy {
  id: string;
  policyReviewDate: string;
  policyCurrent: boolean;
  temperatureMonitoringSchedule: boolean;
  legionellaManagementPlan: boolean;
  scaldingPreventionMeasures: boolean;
  bathSupervisionProtocol: boolean;
  emergencyProcedures: boolean;
  recordKeepingSystem: boolean;
}

export interface StaffWaterSafetyTraining {
  id: string;
  staffId: string;
  staffName: string;
  legionellaAwareness: boolean;
  temperatureMonitoring: boolean;
  scaldingPrevention: boolean;
  bathSupervision: boolean;
  emergencyResponse: boolean;
  recordKeeping: boolean;
}

// -- Result Interfaces ---------------------------------------------------------

export interface TemperatureComplianceResult {
  totalChecks: number;
  passCount: number;
  passRate: number;
  withinSafeRangeCount: number;
  withinSafeRangeRate: number;
  issueCount: number;
  correctiveActionCount: number;
  correctiveActionRate: number;
  sourceTypeCoverage: number;
  bySourceType: Record<string, number>;
  byOutcome: Record<string, number>;
  score: number;
}

export interface LegionellaManagementResult {
  totalAssessments: number;
  lowRiskCount: number;
  lowRiskRate: number;
  flushingScheduleCount: number;
  flushingScheduleRate: number;
  waterTreatmentCount: number;
  waterTreatmentRate: number;
  deadLegsIdentifiedCount: number;
  deadLegsRemovedCount: number;
  deadLegsManagementRate: number;
  byRiskLevel: Record<string, number>;
  score: number;
}

export interface WaterSafetyPolicyResult {
  totalPolicies: number;
  policyCurrentCount: number;
  temperatureScheduleCount: number;
  legionellaPlanCount: number;
  scaldingPreventionCount: number;
  bathSupervisionCount: number;
  emergencyProceduresCount: number;
  recordKeepingCount: number;
  score: number;
}

export interface StaffWaterReadinessResult {
  totalStaff: number;
  legionellaAwarenessCount: number;
  legionellaAwarenessRate: number;
  temperatureMonitoringCount: number;
  temperatureMonitoringRate: number;
  scaldingPreventionCount: number;
  scaldingPreventionRate: number;
  bathSupervisionCount: number;
  bathSupervisionRate: number;
  emergencyResponseCount: number;
  emergencyResponseRate: number;
  recordKeepingCount: number;
  recordKeepingRate: number;
  score: number;
}

export interface WaterSafetyLocationProfile {
  location: string;
  checkCount: number;
  passRate: number;
  withinSafeRangeRate: number;
  averageTemperature: number | null;
  assessmentCount: number;
  latestRiskLevel: RiskLevel | null;
  score: number;
}

export interface WaterSafetyLegionellaIntelligence {
  homeId: string;
  assessedAt: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  temperatureCompliance: TemperatureComplianceResult;
  legionellaManagement: LegionellaManagementResult;
  waterSafetyPolicy: WaterSafetyPolicyResult;
  staffWaterReadiness: StaffWaterReadinessResult;
  locationProfiles: WaterSafetyLocationProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// -- Helpers -------------------------------------------------------------------

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

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// -- All known water source types for coverage calculation ---------------------

const ALL_SOURCE_TYPES: WaterSourceType[] = [
  "hot_tap",
  "cold_tap",
  "bath",
  "shower",
  "storage_tank",
  "calorifier",
  "dead_leg",
  "other",
];

// -- 1. Evaluate Temperature Compliance (0-25) ---------------------------------

export function evaluateTemperatureCompliance(
  checks: TemperatureCheck[]
): TemperatureComplianceResult {
  if (checks.length === 0) {
    return {
      totalChecks: 0,
      passCount: 0,
      passRate: 0,
      withinSafeRangeCount: 0,
      withinSafeRangeRate: 0,
      issueCount: 0,
      correctiveActionCount: 0,
      correctiveActionRate: 0,
      sourceTypeCoverage: 0,
      bySourceType: {},
      byOutcome: {},
      score: 0,
    };
  }

  const total = checks.length;

  // Pass rate
  const passCount = checks.filter((c) => c.outcome === "pass").length;
  const passRate = pct(passCount, total);

  // Within safe range rate
  const withinSafeRangeCount = checks.filter(
    (c) => c.withinSafeRange
  ).length;
  const withinSafeRangeRate = pct(withinSafeRangeCount, total);

  // Issues and corrective actions
  const issueChecks = checks.filter(
    (c) =>
      c.outcome === "minor_issue" ||
      c.outcome === "major_issue" ||
      c.outcome === "fail"
  );
  const issueCount = issueChecks.length;
  const correctiveActionCount = issueChecks.filter(
    (c) => c.correctiveAction
  ).length;
  const correctiveActionRate = pct(correctiveActionCount, issueCount);

  // Source type coverage
  const coveredTypes = new Set(checks.map((c) => c.sourceType));
  const sourceTypeCoverage = coveredTypes.size;

  // Group by source type
  const bySourceType: Record<string, number> = {};
  for (const c of checks) {
    bySourceType[c.sourceType] = (bySourceType[c.sourceType] ?? 0) + 1;
  }

  // Group by outcome
  const byOutcome: Record<string, number> = {};
  for (const c of checks) {
    byOutcome[c.outcome] = (byOutcome[c.outcome] ?? 0) + 1;
  }

  // Scoring: 0-25
  // Pass rate: 0-7
  const passScore = Math.round((passRate / 100) * 7);

  // Within safe range rate: 0-6
  const safeRangeScore = Math.round((withinSafeRangeRate / 100) * 6);

  // Corrective action rate when issues found: 0-6
  const correctiveScore = Math.round((correctiveActionRate / 100) * 6);

  // Source type coverage: 0-6 (based on proportion of all types covered)
  const coverageScore = Math.round(
    (sourceTypeCoverage / ALL_SOURCE_TYPES.length) * 6
  );

  const score = clamp(
    passScore + safeRangeScore + correctiveScore + coverageScore,
    0,
    25
  );

  return {
    totalChecks: total,
    passCount,
    passRate,
    withinSafeRangeCount,
    withinSafeRangeRate,
    issueCount,
    correctiveActionCount,
    correctiveActionRate,
    sourceTypeCoverage,
    bySourceType,
    byOutcome,
    score,
  };
}

// -- 2. Evaluate Legionella Management (0-25) ----------------------------------

export function evaluateLegionellaManagement(
  assessments: LegionellaAssessment[]
): LegionellaManagementResult {
  if (assessments.length === 0) {
    return {
      totalAssessments: 0,
      lowRiskCount: 0,
      lowRiskRate: 0,
      flushingScheduleCount: 0,
      flushingScheduleRate: 0,
      waterTreatmentCount: 0,
      waterTreatmentRate: 0,
      deadLegsIdentifiedCount: 0,
      deadLegsRemovedCount: 0,
      deadLegsManagementRate: 0,
      byRiskLevel: {},
      score: 0,
    };
  }

  const total = assessments.length;

  // Low risk rate
  const lowRiskCount = assessments.filter(
    (a) => a.riskLevel === "low"
  ).length;
  const lowRiskRate = pct(lowRiskCount, total);

  // Flushing schedule rate
  const flushingScheduleCount = assessments.filter(
    (a) => a.flushingScheduleInPlace
  ).length;
  const flushingScheduleRate = pct(flushingScheduleCount, total);

  // Water treatment rate
  const waterTreatmentCount = assessments.filter(
    (a) => a.waterTreatmentActive
  ).length;
  const waterTreatmentRate = pct(waterTreatmentCount, total);

  // Dead legs management
  const deadLegsIdentifiedCount = assessments.filter(
    (a) => a.deadLegsIdentified
  ).length;
  const deadLegsRemovedCount = assessments.filter(
    (a) => a.deadLegsRemoved
  ).length;
  const deadLegsManagementRate = pct(
    deadLegsRemovedCount,
    deadLegsIdentifiedCount
  );

  // Group by risk level
  const byRiskLevel: Record<string, number> = {};
  for (const a of assessments) {
    byRiskLevel[a.riskLevel] = (byRiskLevel[a.riskLevel] ?? 0) + 1;
  }

  // Scoring: 0-25
  // Low risk rate: 0-7
  const lowRiskScore = Math.round((lowRiskRate / 100) * 7);

  // Flushing schedule rate: 0-6
  const flushingScore = Math.round((flushingScheduleRate / 100) * 6);

  // Water treatment rate: 0-6
  const treatmentScore = Math.round((waterTreatmentRate / 100) * 6);

  // Dead legs management rate: 0-6
  const deadLegsScore = Math.round((deadLegsManagementRate / 100) * 6);

  const score = clamp(
    lowRiskScore + flushingScore + treatmentScore + deadLegsScore,
    0,
    25
  );

  return {
    totalAssessments: total,
    lowRiskCount,
    lowRiskRate,
    flushingScheduleCount,
    flushingScheduleRate,
    waterTreatmentCount,
    waterTreatmentRate,
    deadLegsIdentifiedCount,
    deadLegsRemovedCount,
    deadLegsManagementRate,
    byRiskLevel,
    score,
  };
}

// -- 3. Evaluate Water Safety Policy (0-25) ------------------------------------

export function evaluateWaterSafetyPolicy(
  policies: WaterSafetyPolicy[]
): WaterSafetyPolicyResult {
  if (policies.length === 0) {
    return {
      totalPolicies: 0,
      policyCurrentCount: 0,
      temperatureScheduleCount: 0,
      legionellaPlanCount: 0,
      scaldingPreventionCount: 0,
      bathSupervisionCount: 0,
      emergencyProceduresCount: 0,
      recordKeepingCount: 0,
      score: 0,
    };
  }

  const total = policies.length;

  const policyCurrentCount = policies.filter(
    (p) => p.policyCurrent
  ).length;
  const temperatureScheduleCount = policies.filter(
    (p) => p.temperatureMonitoringSchedule
  ).length;
  const legionellaPlanCount = policies.filter(
    (p) => p.legionellaManagementPlan
  ).length;
  const scaldingPreventionCount = policies.filter(
    (p) => p.scaldingPreventionMeasures
  ).length;
  const bathSupervisionCount = policies.filter(
    (p) => p.bathSupervisionProtocol
  ).length;
  const emergencyProceduresCount = policies.filter(
    (p) => p.emergencyProcedures
  ).length;
  const recordKeepingCount = policies.filter(
    (p) => p.recordKeepingSystem
  ).length;

  // Boolean scoring weighted per field (summed across all policies, then rate-based)
  // policyCurrent=5, temperatureSchedule=4, legionellaPlan=4,
  // scaldingPrevention=4, bathSupervision=3, emergencyProcedures=3, recordKeeping=2
  // Total weights = 25

  const policyCurrentRate = pct(policyCurrentCount, total);
  const tempScheduleRate = pct(temperatureScheduleCount, total);
  const legionellaPlanRate = pct(legionellaPlanCount, total);
  const scaldingRate = pct(scaldingPreventionCount, total);
  const bathRate = pct(bathSupervisionCount, total);
  const emergencyRate = pct(emergencyProceduresCount, total);
  const recordRate = pct(recordKeepingCount, total);

  const score = clamp(
    Math.round((policyCurrentRate / 100) * 5) +
      Math.round((tempScheduleRate / 100) * 4) +
      Math.round((legionellaPlanRate / 100) * 4) +
      Math.round((scaldingRate / 100) * 4) +
      Math.round((bathRate / 100) * 3) +
      Math.round((emergencyRate / 100) * 3) +
      Math.round((recordRate / 100) * 2),
    0,
    25
  );

  return {
    totalPolicies: total,
    policyCurrentCount,
    temperatureScheduleCount,
    legionellaPlanCount,
    scaldingPreventionCount,
    bathSupervisionCount,
    emergencyProceduresCount,
    recordKeepingCount,
    score,
  };
}

// -- 4. Evaluate Staff Water Readiness (0-25) ----------------------------------

export function evaluateStaffWaterReadiness(
  training: StaffWaterSafetyTraining[]
): StaffWaterReadinessResult {
  if (training.length === 0) {
    return {
      totalStaff: 0,
      legionellaAwarenessCount: 0,
      legionellaAwarenessRate: 0,
      temperatureMonitoringCount: 0,
      temperatureMonitoringRate: 0,
      scaldingPreventionCount: 0,
      scaldingPreventionRate: 0,
      bathSupervisionCount: 0,
      bathSupervisionRate: 0,
      emergencyResponseCount: 0,
      emergencyResponseRate: 0,
      recordKeepingCount: 0,
      recordKeepingRate: 0,
      score: 0,
    };
  }

  const total = training.length;

  const legionellaAwarenessCount = training.filter(
    (t) => t.legionellaAwareness
  ).length;
  const legionellaAwarenessRate = pct(legionellaAwarenessCount, total);

  const temperatureMonitoringCount = training.filter(
    (t) => t.temperatureMonitoring
  ).length;
  const temperatureMonitoringRate = pct(temperatureMonitoringCount, total);

  const scaldingPreventionCount = training.filter(
    (t) => t.scaldingPrevention
  ).length;
  const scaldingPreventionRate = pct(scaldingPreventionCount, total);

  const bathSupervisionCount = training.filter(
    (t) => t.bathSupervision
  ).length;
  const bathSupervisionRate = pct(bathSupervisionCount, total);

  const emergencyResponseCount = training.filter(
    (t) => t.emergencyResponse
  ).length;
  const emergencyResponseRate = pct(emergencyResponseCount, total);

  const recordKeepingCount = training.filter(
    (t) => t.recordKeeping
  ).length;
  const recordKeepingRate = pct(recordKeepingCount, total);

  // Rate-based scoring per field:
  // legionellaAwareness=6, temperatureMonitoring=5, scaldingPrevention=5,
  // bathSupervision=4, emergencyResponse=3, recordKeeping=2
  // Total weights = 25

  const score = clamp(
    Math.round((legionellaAwarenessRate / 100) * 6) +
      Math.round((temperatureMonitoringRate / 100) * 5) +
      Math.round((scaldingPreventionRate / 100) * 5) +
      Math.round((bathSupervisionRate / 100) * 4) +
      Math.round((emergencyResponseRate / 100) * 3) +
      Math.round((recordKeepingRate / 100) * 2),
    0,
    25
  );

  return {
    totalStaff: total,
    legionellaAwarenessCount,
    legionellaAwarenessRate,
    temperatureMonitoringCount,
    temperatureMonitoringRate,
    scaldingPreventionCount,
    scaldingPreventionRate,
    bathSupervisionCount,
    bathSupervisionRate,
    emergencyResponseCount,
    emergencyResponseRate,
    recordKeepingCount,
    recordKeepingRate,
    score,
  };
}

// -- Build Location Profiles ---------------------------------------------------

export function buildWaterSafetyLocationProfiles(
  checks: TemperatureCheck[],
  assessments: LegionellaAssessment[]
): WaterSafetyLocationProfile[] {
  if (checks.length === 0 && assessments.length === 0) {
    return [];
  }

  // Group checks by location
  const locationMap = new Map<
    string,
    {
      checks: TemperatureCheck[];
      assessments: LegionellaAssessment[];
    }
  >();

  for (const c of checks) {
    if (!locationMap.has(c.location)) {
      locationMap.set(c.location, { checks: [], assessments: [] });
    }
    locationMap.get(c.location)!.checks.push(c);
  }

  // Assessments don't have a location field directly, so we distribute
  // them to all locations or handle them separately.
  // Since assessments are home-wide, we'll attach them to all locations.
  for (const entry of locationMap.values()) {
    entry.assessments = assessments;
  }

  // If there are assessments but no checks, create a generic entry
  if (checks.length === 0 && assessments.length > 0) {
    locationMap.set("Home-wide", { checks: [], assessments });
  }

  const profiles: WaterSafetyLocationProfile[] = [];

  for (const [location, data] of locationMap.entries()) {
    const checkCount = data.checks.length;
    const passCount = data.checks.filter(
      (c) => c.outcome === "pass"
    ).length;
    const passRate = pct(passCount, checkCount);

    const safeRangeCount = data.checks.filter(
      (c) => c.withinSafeRange
    ).length;
    const withinSafeRangeRate = pct(safeRangeCount, checkCount);

    const avgTemp =
      checkCount > 0
        ? Math.round(
            (data.checks.reduce(
              (sum, c) => sum + c.temperatureCelsius,
              0
            ) /
              checkCount) *
              10
          ) / 10
        : null;

    const assessmentCount = data.assessments.length;

    // Latest risk level from assessments (sorted by date descending)
    let latestRiskLevel: RiskLevel | null = null;
    if (data.assessments.length > 0) {
      const sorted = [...data.assessments].sort(
        (a, b) =>
          new Date(b.assessmentDate).getTime() -
          new Date(a.assessmentDate).getTime()
      );
      latestRiskLevel = sorted[0].riskLevel;
    }

    // Location score 0-10: passRate contributes 4, safeRangeRate contributes 3,
    // low risk level contributes 3
    const passScore = Math.round((passRate / 100) * 4);
    const safeScore = Math.round((withinSafeRangeRate / 100) * 3);
    const riskScore =
      latestRiskLevel === "low"
        ? 3
        : latestRiskLevel === "medium"
          ? 2
          : latestRiskLevel === "high"
            ? 1
            : latestRiskLevel === "very_high"
              ? 0
              : 0;

    const score = clamp(passScore + safeScore + riskScore, 0, 10);

    profiles.push({
      location,
      checkCount,
      passRate,
      withinSafeRangeRate,
      averageTemperature: avgTemp,
      assessmentCount,
      latestRiskLevel,
      score,
    });
  }

  return profiles;
}

// -- Orchestrator: Generate Full Intelligence ----------------------------------

export function generateWaterSafetyLegionellaIntelligence(
  checks: TemperatureCheck[],
  assessments: LegionellaAssessment[],
  policies: WaterSafetyPolicy[],
  training: StaffWaterSafetyTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
  referenceDate: string
): WaterSafetyLegionellaIntelligence {
  const tempEval = evaluateTemperatureCompliance(checks);
  const legionellaEval = evaluateLegionellaManagement(assessments);
  const policyEval = evaluateWaterSafetyPolicy(policies);
  const staffEval = evaluateStaffWaterReadiness(training);
  const locationProfiles = buildWaterSafetyLocationProfiles(
    checks,
    assessments
  );

  // Overall score: sum of 4 evaluators, capped at 100
  const overallScore = clamp(
    tempEval.score +
      legionellaEval.score +
      policyEval.score +
      staffEval.score,
    0,
    100
  );

  const rating = getRating(overallScore);

  // -- Strengths ---------------------------------------------------------------
  const strengths: string[] = [];

  if (tempEval.passRate >= 90 && tempEval.totalChecks > 0)
    strengths.push(
      "Water temperature checks show an excellent pass rate, demonstrating effective monitoring"
    );
  if (tempEval.withinSafeRangeRate >= 90 && tempEval.totalChecks > 0)
    strengths.push(
      "Water temperatures are consistently within safe ranges across the home"
    );
  if (
    tempEval.correctiveActionRate === 100 &&
    tempEval.issueCount > 0
  )
    strengths.push(
      "All temperature issues have had corrective actions taken promptly"
    );
  if (tempEval.sourceTypeCoverage >= 5)
    strengths.push(
      "Comprehensive coverage of water source types in temperature monitoring"
    );
  if (legionellaEval.lowRiskRate === 100 && legionellaEval.totalAssessments > 0)
    strengths.push(
      "All legionella risk assessments indicate low risk levels"
    );
  if (
    legionellaEval.flushingScheduleRate === 100 &&
    legionellaEval.totalAssessments > 0
  )
    strengths.push(
      "Flushing schedules are consistently in place across all assessments"
    );
  if (
    legionellaEval.waterTreatmentRate === 100 &&
    legionellaEval.totalAssessments > 0
  )
    strengths.push(
      "Active water treatment is maintained across all assessments"
    );
  if (
    legionellaEval.deadLegsManagementRate === 100 &&
    legionellaEval.deadLegsIdentifiedCount > 0
  )
    strengths.push(
      "All identified dead legs have been removed or managed effectively"
    );
  if (policyEval.score >= 20)
    strengths.push(
      "Water safety policies are comprehensive and well-documented"
    );
  if (staffEval.legionellaAwarenessRate === 100 && staffEval.totalStaff > 0)
    strengths.push(
      "All staff have completed legionella awareness training"
    );
  if (staffEval.scaldingPreventionRate === 100 && staffEval.totalStaff > 0)
    strengths.push(
      "All staff are trained in scalding prevention measures"
    );
  if (staffEval.bathSupervisionRate === 100 && staffEval.totalStaff > 0)
    strengths.push(
      "All staff are trained in bath supervision protocols"
    );

  // -- Areas for Improvement ---------------------------------------------------
  const areasForImprovement: string[] = [];

  if (tempEval.totalChecks === 0)
    areasForImprovement.push(
      "No water temperature checks recorded — this is a critical monitoring gap"
    );
  if (tempEval.passRate < 80 && tempEval.totalChecks > 0)
    areasForImprovement.push(
      "Water temperature check pass rate is below acceptable levels"
    );
  if (tempEval.withinSafeRangeRate < 80 && tempEval.totalChecks > 0)
    areasForImprovement.push(
      "Too many water sources are outside safe temperature ranges"
    );
  if (tempEval.correctiveActionRate < 100 && tempEval.issueCount > 0)
    areasForImprovement.push(
      "Not all temperature issues have had corrective actions documented"
    );
  if (tempEval.sourceTypeCoverage < 3 && tempEval.totalChecks > 0)
    areasForImprovement.push(
      "Temperature monitoring covers too few water source types"
    );
  if (legionellaEval.totalAssessments === 0)
    areasForImprovement.push(
      "No legionella risk assessment on record — this is a serious compliance gap"
    );
  if (
    legionellaEval.lowRiskRate < 50 &&
    legionellaEval.totalAssessments > 0
  )
    areasForImprovement.push(
      "Legionella risk levels are elevated across assessments"
    );
  if (
    legionellaEval.flushingScheduleRate < 100 &&
    legionellaEval.totalAssessments > 0
  )
    areasForImprovement.push(
      "Not all assessments have flushing schedules in place"
    );
  if (
    legionellaEval.waterTreatmentRate < 100 &&
    legionellaEval.totalAssessments > 0
  )
    areasForImprovement.push(
      "Water treatment is not active across all assessments"
    );
  if (
    legionellaEval.deadLegsManagementRate < 100 &&
    legionellaEval.deadLegsIdentifiedCount > 0
  )
    areasForImprovement.push(
      "Identified dead legs have not all been removed or managed"
    );
  if (policyEval.totalPolicies === 0)
    areasForImprovement.push(
      "No water safety policy on record — policies must be developed"
    );
  if (policyEval.score < 15 && policyEval.totalPolicies > 0)
    areasForImprovement.push(
      "Water safety policies are incomplete — key areas are not covered"
    );
  if (staffEval.totalStaff === 0)
    areasForImprovement.push(
      "No staff water safety training records found"
    );
  if (staffEval.legionellaAwarenessRate < 80 && staffEval.totalStaff > 0)
    areasForImprovement.push(
      "Legionella awareness training is not reaching all staff"
    );
  if (staffEval.scaldingPreventionRate < 80 && staffEval.totalStaff > 0)
    areasForImprovement.push(
      "Scalding prevention training needs to reach more staff"
    );
  if (staffEval.bathSupervisionRate < 80 && staffEval.totalStaff > 0)
    areasForImprovement.push(
      "Bath supervision training coverage is insufficient"
    );

  // -- Actions -----------------------------------------------------------------
  const actions: string[] = [];

  if (tempEval.totalChecks === 0)
    actions.push(
      "Implement a water temperature monitoring programme immediately"
    );
  if (tempEval.passRate < 80 && tempEval.totalChecks > 0)
    actions.push(
      "Investigate and rectify water sources failing temperature checks"
    );
  if (tempEval.correctiveActionRate < 100 && tempEval.issueCount > 0)
    actions.push(
      "Ensure all temperature issues have documented corrective actions"
    );
  if (tempEval.sourceTypeCoverage < 3 && tempEval.totalChecks > 0)
    actions.push(
      "Extend temperature monitoring to cover more water source types"
    );
  if (legionellaEval.totalAssessments === 0)
    actions.push(
      "Commission a legionella risk assessment without delay"
    );
  if (
    legionellaEval.flushingScheduleRate < 100 &&
    legionellaEval.totalAssessments > 0
  )
    actions.push(
      "Establish flushing schedules for all water systems"
    );
  if (
    legionellaEval.waterTreatmentRate < 100 &&
    legionellaEval.totalAssessments > 0
  )
    actions.push(
      "Ensure active water treatment is maintained across all systems"
    );
  if (
    legionellaEval.deadLegsManagementRate < 100 &&
    legionellaEval.deadLegsIdentifiedCount > 0
  )
    actions.push(
      "Remove or manage all identified dead legs in the water system"
    );
  if (policyEval.totalPolicies === 0)
    actions.push(
      "Develop a comprehensive water safety policy covering all required areas"
    );
  if (policyEval.score < 15 && policyEval.totalPolicies > 0)
    actions.push(
      "Review and strengthen water safety policies to cover all required areas"
    );
  if (staffEval.totalStaff === 0)
    actions.push(
      "Arrange water safety training for all staff as a priority"
    );
  if (staffEval.legionellaAwarenessRate < 100 && staffEval.totalStaff > 0)
    actions.push(
      "Provide legionella awareness training to all untrained staff"
    );
  if (staffEval.scaldingPreventionRate < 100 && staffEval.totalStaff > 0)
    actions.push(
      "Ensure all staff complete scalding prevention training"
    );
  if (staffEval.bathSupervisionRate < 100 && staffEval.totalStaff > 0)
    actions.push(
      "Ensure all staff complete bath supervision training"
    );

  // -- Regulatory Links --------------------------------------------------------
  const regulatoryLinks: string[] = [
    "Health and Safety at Work Act 1974 — General duty of care for water safety in the premises",
    "CHR 2015, Reg 25 — Premises safety: ensuring water systems are safe for children and staff",
    "L8 Approved Code of Practice (Legionella) — Legal requirements for legionella control in water systems",
    "HSG274 (Legionella Technical Guidance) — Practical guidance on managing legionella risks",
    "SCCIF — Social Care Common Inspection Framework: Ofsted evaluates water safety as part of premises and safety judgements",
    "NMS 10 — National Minimum Standards: safe premises including water safety requirements",
    "COSHH Regulations 2002 — Control of substances hazardous to health including legionella bacteria",
  ];

  return {
    homeId,
    assessedAt: referenceDate,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    temperatureCompliance: tempEval,
    legionellaManagement: legionellaEval,
    waterSafetyPolicy: policyEval,
    staffWaterReadiness: staffEval,
    locationProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
