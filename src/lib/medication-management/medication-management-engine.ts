// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Medication Management Intelligence Engine
//
// Deterministic engine for evaluating medication administration accuracy,
// error management, stock control, self-administration programmes, and
// controlled drug compliance in children's residential care homes.
//
// Aligned to:
//   - CHR 2015 Reg 23 — Health (medication management)
//   - CHR 2015 Reg 12 — Protection of children (safe medication handling)
//   - NICE Guidelines — Medicines adherence & management
//   - Medicines Act 1968 — Lawful administration & storage
//   - Misuse of Drugs Act 1971 — Controlled drug governance
//   - SCCIF — Health and Wellbeing judgement (medication administration)
//   - Children Act 1989 s.22 — Duty to safeguard & promote welfare
//
// Key requirements:
//   - All medication administered by trained staff, recorded on MAR charts
//   - PRN protocols in place for all as-needed medication
//   - Controlled drugs: dual-witnessed, counted each shift
//   - Medication errors reported, investigated, root cause identified
//   - Stock checks at regular intervals, discrepancies actioned
//   - Self-administration risk-assessed and promoted where safe
//   - Timeliness of administration monitored
//
// No AI. No external calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ──────────────────────────────────────────────────────────────────

export type MedicationType =
  | "regular"
  | "prn"
  | "controlled"
  | "over_the_counter"
  | "topical"
  | "emergency";

export type AdministrationStatus =
  | "given"
  | "refused"
  | "omitted"
  | "late"
  | "self_administered"
  | "error";

export type ErrorType =
  | "wrong_dose"
  | "wrong_time"
  | "wrong_medication"
  | "wrong_child"
  | "missed"
  | "documentation_error"
  | "storage_error";

export type ErrorSeverity =
  | "minor"
  | "moderate"
  | "significant"
  | "critical";

export type SelfAdminLevel =
  | "level_1_full_staff"
  | "level_2_supervised"
  | "level_3_independent_checked"
  | "level_4_fully_independent";

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface MedicationRecord {
  id: string;
  childId: string;
  childName: string;
  medicationName: string;
  medicationType: MedicationType;
  prescribedDose: string;
  administeredDate: string;
  administeredTime: string;
  administeredBy: string;
  witnessedBy?: string;
  status: AdministrationStatus;
  notes?: string;
}

export interface MedicationError {
  id: string;
  childId: string;
  childName: string;
  errorDate: string;
  errorType: ErrorType;
  severity: ErrorSeverity;
  description: string;
  reportedBy: string;
  actionTaken: string;
  notifiedParties: string[];
  rootCauseIdentified?: string;
}

export interface StockCheck {
  id: string;
  medicationName: string;
  childId: string;
  childName: string;
  checkDate: string;
  checkedBy: string;
  expectedCount: number;
  actualCount: number;
  discrepancy: boolean;
  actionTaken?: string;
}

export interface SelfAdminAssessment {
  id: string;
  childId: string;
  childName: string;
  assessmentDate: string;
  currentLevel: SelfAdminLevel;
  targetLevel: SelfAdminLevel;
  assessedBy: string;
  competencies: string[];
  areasForDevelopment: string[];
  reviewDate: string;
}

export interface ControlledDrugRecord {
  id: string;
  medicationName: string;
  childId: string;
  childName: string;
  date: string;
  administeredBy: string;
  witnessedBy: string;
  balanceBefore: number;
  balanceAfter: number;
  balanceCorrect: boolean;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface ChildAdministrationBreakdown {
  childId: string;
  childName: string;
  total: number;
  given: number;
  refused: number;
  omitted: number;
  late: number;
  selfAdministered: number;
  errors: number;
  accuracyRate: number;
}

export interface TimePatternEntry {
  hour: string;
  count: number;
  lateCount: number;
}

export interface AdministrationAccuracyResult {
  totalRecords: number;
  accuracyRate: number;
  refusalRate: number;
  lateRate: number;
  omissionRate: number;
  errorRate: number;
  selfAdminRate: number;
  perChildBreakdown: ChildAdministrationBreakdown[];
  timePatterns: TimePatternEntry[];
}

export interface ErrorTrendResult {
  direction: "improving" | "stable" | "worsening";
  firstHalfCount: number;
  secondHalfCount: number;
}

export interface RepeatError {
  errorType: ErrorType;
  count: number;
  childIds: string[];
}

export interface MedicationErrorResult {
  totalErrors: number;
  severityBreakdown: Record<ErrorSeverity, number>;
  errorTypeBreakdown: Record<ErrorType, number>;
  trend: ErrorTrendResult;
  repeatErrors: RepeatError[];
  errorsWithRootCause: number;
  errorsWithoutRootCause: number;
}

export interface StockManagementResult {
  totalChecks: number;
  checkFrequencyPerWeek: number;
  discrepancyRate: number;
  discrepancyCount: number;
  checksWithDiscrepancy: number;
  reconciliationActions: string[];
}

export interface LevelDistribution {
  level: SelfAdminLevel;
  count: number;
}

export interface CompetencyAnalysisEntry {
  competency: string;
  count: number;
}

export interface SelfAdministrationResult {
  totalAssessments: number;
  childrenProgressing: number;
  childrenAtTarget: number;
  currentLevelDistribution: LevelDistribution[];
  competencyAnalysis: CompetencyAnalysisEntry[];
  areasForDevelopmentSummary: CompetencyAnalysisEntry[];
}

export interface ControlledDrugsResult {
  totalRecords: number;
  witnessRate: number;
  balanceAccuracyRate: number;
  discrepancyCount: number;
}

export interface ScoringBreakdown {
  administrationAccuracy: number;
  errorManagement: number;
  stockManagement: number;
  selfAdministration: number;
  controlledDrugsCompliance: number;
}

export interface MedicationManagementIntelligenceResult {
  homeId: string;
  assessedAt: string;
  periodStart: string;
  periodEnd: string;

  overallScore: number;
  rating: "outstanding" | "good" | "requires_improvement" | "inadequate";
  scoringBreakdown: ScoringBreakdown;

  administrationAccuracy: AdministrationAccuracyResult;
  errorAnalysis: MedicationErrorResult;
  stockManagement: StockManagementResult;
  selfAdministration: SelfAdministrationResult;
  controlledDrugs: ControlledDrugsResult;

  strengths: string[];
  areasForImprovement: string[];
  recommendedActions: string[];
  regulatoryLinks: string[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

function daysBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA).getTime();
  const b = new Date(dateB).getTime();
  return Math.abs(b - a) / (1000 * 60 * 60 * 24);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

// ── Core Function 1: Evaluate Administration Accuracy ─────────────────────

export function evaluateAdministrationAccuracy(
  records: MedicationRecord[],
): AdministrationAccuracyResult {
  const total = records.length;

  if (total === 0) {
    return {
      totalRecords: 0,
      accuracyRate: 100,
      refusalRate: 0,
      lateRate: 0,
      omissionRate: 0,
      errorRate: 0,
      selfAdminRate: 0,
      perChildBreakdown: [],
      timePatterns: [],
    };
  }

  const givenCount = records.filter(r => r.status === "given").length;
  const selfAdminCount = records.filter(r => r.status === "self_administered").length;
  const refusedCount = records.filter(r => r.status === "refused").length;
  const lateCount = records.filter(r => r.status === "late").length;
  const omittedCount = records.filter(r => r.status === "omitted").length;
  const errorCount = records.filter(r => r.status === "error").length;

  const accuracyRate = roundTo(((givenCount + selfAdminCount) / total) * 100, 1);
  const refusalRate = roundTo((refusedCount / total) * 100, 1);
  const lateRate = roundTo((lateCount / total) * 100, 1);
  const omissionRate = roundTo((omittedCount / total) * 100, 1);
  const errRate = roundTo((errorCount / total) * 100, 1);
  const selfAdminRate = roundTo((selfAdminCount / total) * 100, 1);

  // Per-child breakdown
  const childIds = [...new Set(records.map(r => r.childId))];
  const perChildBreakdown: ChildAdministrationBreakdown[] = childIds.map(childId => {
    const childRecords = records.filter(r => r.childId === childId);
    const childName = childRecords[0].childName;
    const cGiven = childRecords.filter(r => r.status === "given").length;
    const cSelfAdmin = childRecords.filter(r => r.status === "self_administered").length;
    const cRefused = childRecords.filter(r => r.status === "refused").length;
    const cOmitted = childRecords.filter(r => r.status === "omitted").length;
    const cLate = childRecords.filter(r => r.status === "late").length;
    const cError = childRecords.filter(r => r.status === "error").length;
    const cTotal = childRecords.length;

    return {
      childId,
      childName,
      total: cTotal,
      given: cGiven,
      refused: cRefused,
      omitted: cOmitted,
      late: cLate,
      selfAdministered: cSelfAdmin,
      errors: cError,
      accuracyRate: roundTo(((cGiven + cSelfAdmin) / cTotal) * 100, 1),
    };
  });

  // Time pattern analysis
  const hourBuckets: Record<string, { count: number; lateCount: number }> = {};
  for (const r of records) {
    const timeParts = r.administeredTime.split(":");
    const hour = timeParts[0]?.padStart(2, "0") + ":00";
    if (!hourBuckets[hour]) {
      hourBuckets[hour] = { count: 0, lateCount: 0 };
    }
    hourBuckets[hour].count++;
    if (r.status === "late") {
      hourBuckets[hour].lateCount++;
    }
  }

  const timePatterns: TimePatternEntry[] = Object.entries(hourBuckets)
    .map(([hour, data]) => ({ hour, count: data.count, lateCount: data.lateCount }))
    .sort((a, b) => a.hour.localeCompare(b.hour));

  return {
    totalRecords: total,
    accuracyRate,
    refusalRate,
    lateRate,
    omissionRate,
    errorRate: errRate,
    selfAdminRate,
    perChildBreakdown,
    timePatterns,
  };
}

// ── Core Function 2: Evaluate Medication Errors ───────────────────────────

export function evaluateMedicationErrors(
  errors: MedicationError[],
  periodStart: string,
  periodEnd: string,
): MedicationErrorResult {
  const periodErrors = errors.filter(
    e => e.errorDate >= periodStart && e.errorDate <= periodEnd,
  );

  if (periodErrors.length === 0) {
    return {
      totalErrors: 0,
      severityBreakdown: { minor: 0, moderate: 0, significant: 0, critical: 0 },
      errorTypeBreakdown: {
        wrong_dose: 0, wrong_time: 0, wrong_medication: 0,
        wrong_child: 0, missed: 0, documentation_error: 0, storage_error: 0,
      },
      trend: { direction: "stable", firstHalfCount: 0, secondHalfCount: 0 },
      repeatErrors: [],
      errorsWithRootCause: 0,
      errorsWithoutRootCause: 0,
    };
  }

  // Severity breakdown
  const severityBreakdown: Record<ErrorSeverity, number> = {
    minor: 0, moderate: 0, significant: 0, critical: 0,
  };
  for (const e of periodErrors) {
    severityBreakdown[e.severity]++;
  }

  // Error type breakdown
  const errorTypeBreakdown: Record<ErrorType, number> = {
    wrong_dose: 0, wrong_time: 0, wrong_medication: 0,
    wrong_child: 0, missed: 0, documentation_error: 0, storage_error: 0,
  };
  for (const e of periodErrors) {
    errorTypeBreakdown[e.errorType]++;
  }

  // Trend: compare first half vs second half
  const startMs = new Date(periodStart).getTime();
  const endMs = new Date(periodEnd).getTime();
  const midMs = startMs + (endMs - startMs) / 2;

  const firstHalf = periodErrors.filter(e => new Date(e.errorDate).getTime() < midMs);
  const secondHalf = periodErrors.filter(e => new Date(e.errorDate).getTime() >= midMs);

  let trendDirection: "improving" | "stable" | "worsening";
  if (secondHalf.length < firstHalf.length) {
    trendDirection = "improving";
  } else if (secondHalf.length > firstHalf.length) {
    trendDirection = "worsening";
  } else {
    trendDirection = "stable";
  }

  // Repeat errors (same error type appearing multiple times)
  const typeChildMap: Record<string, Set<string>> = {};
  const typeCounts: Record<string, number> = {};
  for (const e of periodErrors) {
    if (!typeCounts[e.errorType]) {
      typeCounts[e.errorType] = 0;
      typeChildMap[e.errorType] = new Set();
    }
    typeCounts[e.errorType]++;
    typeChildMap[e.errorType].add(e.childId);
  }

  const repeatErrors: RepeatError[] = Object.entries(typeCounts)
    .filter(([, count]) => count >= 2)
    .map(([errorType, count]) => ({
      errorType: errorType as ErrorType,
      count,
      childIds: [...typeChildMap[errorType]],
    }));

  // Root cause analysis
  const errorsWithRootCause = periodErrors.filter(e => e.rootCauseIdentified).length;
  const errorsWithoutRootCause = periodErrors.length - errorsWithRootCause;

  return {
    totalErrors: periodErrors.length,
    severityBreakdown,
    errorTypeBreakdown,
    trend: {
      direction: trendDirection,
      firstHalfCount: firstHalf.length,
      secondHalfCount: secondHalf.length,
    },
    repeatErrors,
    errorsWithRootCause,
    errorsWithoutRootCause,
  };
}

// ── Core Function 3: Evaluate Stock Management ───────────────────────────

export function evaluateStockManagement(
  stockChecks: StockCheck[],
): StockManagementResult {
  const total = stockChecks.length;

  if (total === 0) {
    return {
      totalChecks: 0,
      checkFrequencyPerWeek: 0,
      discrepancyRate: 0,
      discrepancyCount: 0,
      checksWithDiscrepancy: 0,
      reconciliationActions: [],
    };
  }

  // Calculate frequency per week
  const dates = stockChecks.map(sc => new Date(sc.checkDate).getTime());
  const minDate = Math.min(...dates);
  const maxDate = Math.max(...dates);
  const spanDays = (maxDate - minDate) / (1000 * 60 * 60 * 24);
  const spanWeeks = spanDays > 0 ? spanDays / 7 : 1;
  const checkFrequencyPerWeek = roundTo(total / spanWeeks, 1);

  // Discrepancy analysis
  const withDiscrepancy = stockChecks.filter(sc => sc.discrepancy);
  const discrepancyRate = roundTo((withDiscrepancy.length / total) * 100, 1);

  // Reconciliation actions taken
  const reconciliationActions: string[] = withDiscrepancy
    .filter(sc => sc.actionTaken)
    .map(sc => sc.actionTaken as string);

  return {
    totalChecks: total,
    checkFrequencyPerWeek,
    discrepancyRate,
    discrepancyCount: withDiscrepancy.length,
    checksWithDiscrepancy: withDiscrepancy.length,
    reconciliationActions,
  };
}

// ── Core Function 4: Evaluate Self-Administration ────────────────────────

export function evaluateSelfAdministration(
  assessments: SelfAdminAssessment[],
): SelfAdministrationResult {
  if (assessments.length === 0) {
    return {
      totalAssessments: 0,
      childrenProgressing: 0,
      childrenAtTarget: 0,
      currentLevelDistribution: [],
      competencyAnalysis: [],
      areasForDevelopmentSummary: [],
    };
  }

  // Get latest assessment per child
  const latestByChild: Record<string, SelfAdminAssessment> = {};
  for (const a of assessments) {
    const existing = latestByChild[a.childId];
    if (!existing || a.assessmentDate > existing.assessmentDate) {
      latestByChild[a.childId] = a;
    }
  }

  const latestAssessments = Object.values(latestByChild);

  // Children progressing (current level < target level, meaning they still have room to grow)
  const levelOrder: Record<SelfAdminLevel, number> = {
    level_1_full_staff: 1,
    level_2_supervised: 2,
    level_3_independent_checked: 3,
    level_4_fully_independent: 4,
  };

  const childrenProgressing = latestAssessments.filter(
    a => levelOrder[a.currentLevel] < levelOrder[a.targetLevel],
  ).length;

  const childrenAtTarget = latestAssessments.filter(
    a => levelOrder[a.currentLevel] >= levelOrder[a.targetLevel],
  ).length;

  // Current level distribution
  const levelCounts: Record<SelfAdminLevel, number> = {
    level_1_full_staff: 0,
    level_2_supervised: 0,
    level_3_independent_checked: 0,
    level_4_fully_independent: 0,
  };
  for (const a of latestAssessments) {
    levelCounts[a.currentLevel]++;
  }
  const currentLevelDistribution: LevelDistribution[] = Object.entries(levelCounts)
    .filter(([, count]) => count > 0)
    .map(([level, count]) => ({ level: level as SelfAdminLevel, count }));

  // Competency analysis (across all assessments, not just latest)
  const competencyCounts: Record<string, number> = {};
  for (const a of assessments) {
    for (const c of a.competencies) {
      competencyCounts[c] = (competencyCounts[c] ?? 0) + 1;
    }
  }
  const competencyAnalysis: CompetencyAnalysisEntry[] = Object.entries(competencyCounts)
    .map(([competency, count]) => ({ competency, count }))
    .sort((a, b) => b.count - a.count);

  // Areas for development summary
  const devCounts: Record<string, number> = {};
  for (const a of assessments) {
    for (const d of a.areasForDevelopment) {
      devCounts[d] = (devCounts[d] ?? 0) + 1;
    }
  }
  const areasForDevelopmentSummary: CompetencyAnalysisEntry[] = Object.entries(devCounts)
    .map(([competency, count]) => ({ competency, count }))
    .sort((a, b) => b.count - a.count);

  return {
    totalAssessments: assessments.length,
    childrenProgressing,
    childrenAtTarget,
    currentLevelDistribution,
    competencyAnalysis,
    areasForDevelopmentSummary,
  };
}

// ── Core Function 5: Evaluate Controlled Drugs ──────────────────────────

export function evaluateControlledDrugs(
  cdRecords: ControlledDrugRecord[],
): ControlledDrugsResult {
  if (cdRecords.length === 0) {
    return {
      totalRecords: 0,
      witnessRate: 100,
      balanceAccuracyRate: 100,
      discrepancyCount: 0,
    };
  }

  const withWitness = cdRecords.filter(r => r.witnessedBy && r.witnessedBy.trim().length > 0);
  const witnessRate = roundTo((withWitness.length / cdRecords.length) * 100, 1);

  const balanceCorrectCount = cdRecords.filter(r => r.balanceCorrect).length;
  const balanceAccuracyRate = roundTo((balanceCorrectCount / cdRecords.length) * 100, 1);

  const discrepancyCount = cdRecords.filter(r => !r.balanceCorrect).length;

  return {
    totalRecords: cdRecords.length,
    witnessRate,
    balanceAccuracyRate,
    discrepancyCount,
  };
}

// ── Scoring ────────────────────────────────────────────────────────────────

function scoreAdministrationAccuracy(result: AdministrationAccuracyResult): number {
  // Max 35 points
  // Accuracy rate: up to 25 points
  const accuracyPoints = (result.accuracyRate / 100) * 25;
  // Timeliness (inverse of late rate): up to 10 points
  const timelinessPoints = ((100 - result.lateRate) / 100) * 10;
  return clamp(roundTo(accuracyPoints + timelinessPoints, 1), 0, 35);
}

function scoreErrorManagement(result: MedicationErrorResult, totalRecords: number): number {
  // Max 20 points
  // Error rate: up to 10 points (0 errors = full marks)
  let errorRatePoints = 10;
  if (totalRecords > 0) {
    const errorRate = result.totalErrors / totalRecords;
    errorRatePoints = clamp((1 - errorRate * 10) * 10, 0, 10);
  }

  // Severity: up to 5 points (no significant/critical = full marks)
  const severePenalty = (result.severityBreakdown.significant * 1.5) + (result.severityBreakdown.critical * 3);
  const severityPoints = clamp(5 - severePenalty, 0, 5);

  // Trend improvement: up to 5 points
  let trendPoints = 2.5;
  if (result.trend.direction === "improving") trendPoints = 5;
  else if (result.trend.direction === "worsening") trendPoints = 0;

  return clamp(roundTo(errorRatePoints + severityPoints + trendPoints, 1), 0, 20);
}

function scoreStockManagement(result: StockManagementResult): number {
  // Max 15 points
  // Check frequency: up to 8 points (weekly checks = full marks)
  const freqPoints = clamp(result.checkFrequencyPerWeek >= 1 ? 8 : (result.checkFrequencyPerWeek * 8), 0, 8);

  // Discrepancy handling: up to 7 points (low discrepancy rate + actions taken)
  let discrepancyPoints = 7;
  if (result.totalChecks > 0) {
    const discRate = result.discrepancyRate / 100;
    discrepancyPoints = clamp(7 * (1 - discRate), 0, 7);
    // Bonus: if discrepancies have actions taken
    if (result.discrepancyCount > 0 && result.reconciliationActions.length >= result.discrepancyCount) {
      discrepancyPoints = clamp(discrepancyPoints + 1, 0, 7);
    }
  }

  return clamp(roundTo(freqPoints + discrepancyPoints, 1), 0, 15);
}

function scoreSelfAdministration(result: SelfAdministrationResult): number {
  // Max 15 points
  if (result.totalAssessments === 0) {
    // No self-admin programme — baseline score (children may not be suitable)
    return 7.5;
  }

  // Progression: up to 10 points
  const totalChildren = result.childrenProgressing + result.childrenAtTarget;
  const progressionRate = totalChildren > 0
    ? (result.childrenProgressing + result.childrenAtTarget * 1.5) / (totalChildren * 1.5)
    : 0;
  const progressionPoints = clamp(progressionRate * 10, 0, 10);

  // Competency development: up to 5 points (based on breadth of competencies assessed)
  const competencyPoints = clamp(result.competencyAnalysis.length * 1, 0, 5);

  return clamp(roundTo(progressionPoints + competencyPoints, 1), 0, 15);
}

function scoreControlledDrugs(result: ControlledDrugsResult): number {
  // Max 15 points
  if (result.totalRecords === 0) {
    // No controlled drugs — full compliance by default
    return 15;
  }

  // Witness rate: up to 10 points
  const witnessPoints = (result.witnessRate / 100) * 10;

  // Balance accuracy: up to 5 points
  const balancePoints = (result.balanceAccuracyRate / 100) * 5;

  return clamp(roundTo(witnessPoints + balancePoints, 1), 0, 15);
}

function getRating(score: number): "outstanding" | "good" | "requires_improvement" | "inadequate" {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// ── Strengths Generator ───────────────────────────────────────────────────

function generateStrengths(
  admin: AdministrationAccuracyResult,
  errors: MedicationErrorResult,
  stock: StockManagementResult,
  selfAdmin: SelfAdministrationResult,
  controlled: ControlledDrugsResult,
): string[] {
  const strengths: string[] = [];

  if (admin.accuracyRate >= 95) {
    strengths.push(`Administration accuracy is excellent at ${admin.accuracyRate}% — all medication given reliably`);
  } else if (admin.accuracyRate >= 90) {
    strengths.push(`Administration accuracy is good at ${admin.accuracyRate}%`);
  }

  if (admin.lateRate === 0 && admin.totalRecords > 0) {
    strengths.push("All medication administered on time — zero late administrations recorded");
  }

  if (errors.totalErrors === 0) {
    strengths.push("No medication errors recorded during the assessment period");
  } else if (errors.trend.direction === "improving") {
    strengths.push("Medication error trend is improving — errors reducing over time");
  }

  if (errors.errorsWithRootCause > 0 && errors.errorsWithoutRootCause === 0) {
    strengths.push("All medication errors have root cause analysis completed — strong learning culture");
  }

  if (stock.totalChecks > 0 && stock.discrepancyRate === 0) {
    strengths.push("Stock management is excellent — no discrepancies found across all checks");
  }

  if (stock.checkFrequencyPerWeek >= 1) {
    strengths.push("Stock checks conducted at least weekly — meets best practice frequency");
  }

  if (selfAdmin.childrenProgressing > 0) {
    strengths.push(`${selfAdmin.childrenProgressing} child${selfAdmin.childrenProgressing > 1 ? "ren" : ""} actively progressing in self-administration programme`);
  }

  if (selfAdmin.childrenAtTarget > 0) {
    strengths.push(`${selfAdmin.childrenAtTarget} child${selfAdmin.childrenAtTarget > 1 ? "ren" : ""} achieved target self-administration level`);
  }

  if (controlled.totalRecords > 0 && controlled.witnessRate === 100) {
    strengths.push("All controlled drug administrations are dual-witnessed — full compliance");
  }

  if (controlled.totalRecords > 0 && controlled.balanceAccuracyRate === 100) {
    strengths.push("Controlled drug balances are accurate across all checks — no discrepancies");
  }

  if (admin.refusalRate === 0 && admin.totalRecords > 0) {
    strengths.push("No medication refusals recorded — children engaging well with medication plans");
  }

  return strengths;
}

// ── Areas for Improvement Generator ──────────────────────────────────────

function generateAreasForImprovement(
  admin: AdministrationAccuracyResult,
  errors: MedicationErrorResult,
  stock: StockManagementResult,
  selfAdmin: SelfAdministrationResult,
  controlled: ControlledDrugsResult,
): string[] {
  const areas: string[] = [];

  if (admin.accuracyRate < 90) {
    areas.push(`Administration accuracy at ${admin.accuracyRate}% is below the 90% target`);
  }

  if (admin.lateRate > 10) {
    areas.push(`Late administration rate of ${admin.lateRate}% needs addressing — review scheduling and staffing`);
  }

  if (admin.refusalRate > 15) {
    areas.push(`Medication refusal rate of ${admin.refusalRate}% is high — review approach with each child`);
  }

  if (admin.omissionRate > 5) {
    areas.push(`Omission rate of ${admin.omissionRate}% requires investigation and improvement`);
  }

  if (errors.totalErrors > 0 && errors.trend.direction === "worsening") {
    areas.push("Medication errors are increasing over the period — urgent review of processes needed");
  }

  if (errors.severityBreakdown.significant > 0 || errors.severityBreakdown.critical > 0) {
    const severe = errors.severityBreakdown.significant + errors.severityBreakdown.critical;
    areas.push(`${severe} significant/critical medication error(s) recorded — requires senior management review`);
  }

  if (errors.errorsWithoutRootCause > 0) {
    areas.push(`${errors.errorsWithoutRootCause} medication error(s) without root cause analysis — all errors must be fully investigated`);
  }

  if (errors.repeatErrors.length > 0) {
    areas.push(`Repeat errors identified in: ${errors.repeatErrors.map(r => r.errorType.replace(/_/g, " ")).join(", ")}`);
  }

  if (stock.totalChecks > 0 && stock.discrepancyRate > 10) {
    areas.push(`Stock discrepancy rate of ${stock.discrepancyRate}% is concerning — tighten stock management`);
  }

  if (stock.checkFrequencyPerWeek < 1 && stock.totalChecks > 0) {
    areas.push("Stock checks less frequent than weekly — increase to at least weekly checks");
  }

  if (stock.totalChecks === 0) {
    areas.push("No stock checks recorded — stock must be checked at least weekly");
  }

  if (selfAdmin.totalAssessments > 0 && selfAdmin.areasForDevelopmentSummary.length > 0) {
    const topArea = selfAdmin.areasForDevelopmentSummary[0].competency;
    areas.push(`Self-administration development area: ${topArea}`);
  }

  if (controlled.totalRecords > 0 && controlled.witnessRate < 100) {
    areas.push(`Controlled drug witness rate at ${controlled.witnessRate}% — must be 100% (dual-witnessed)`);
  }

  if (controlled.discrepancyCount > 0) {
    areas.push(`${controlled.discrepancyCount} controlled drug balance discrepancy(ies) — requires immediate investigation`);
  }

  return areas;
}

// ── Recommended Actions Generator ────────────────────────────────────────

function generateRecommendedActions(
  admin: AdministrationAccuracyResult,
  errors: MedicationErrorResult,
  stock: StockManagementResult,
  selfAdmin: SelfAdministrationResult,
  controlled: ControlledDrugsResult,
): string[] {
  const actions: string[] = [];

  if (admin.accuracyRate < 90) {
    actions.push("Review medication administration procedures with all staff — retrain where necessary");
  }

  if (admin.lateRate > 10) {
    actions.push("Audit medication round timings and adjust shift patterns to ensure timely administration");
  }

  if (admin.refusalRate > 15) {
    actions.push("Arrange GP review for children with high refusal rates — consider alternative formulations");
  }

  if (errors.totalErrors > 2) {
    actions.push("Convene medication incident review meeting — analyse patterns and implement corrective actions");
  }

  if (errors.severityBreakdown.critical > 0) {
    actions.push("URGENT: Critical medication error requires Ofsted notification and immediate safeguarding review");
  }

  if (errors.severityBreakdown.significant > 0) {
    actions.push("Significant medication error must be reported to Ofsted within required timeframe");
  }

  if (errors.errorsWithoutRootCause > 0) {
    actions.push("Complete root cause analysis for all uninvestigated medication errors within 72 hours");
  }

  if (stock.totalChecks === 0) {
    actions.push("Implement weekly stock check regime immediately — document in medication management SOP");
  }

  if (stock.discrepancyRate > 10) {
    actions.push("Investigate stock discrepancies — review administration recording, storage security, and chain of custody");
  }

  if (selfAdmin.childrenProgressing > 0) {
    actions.push("Continue self-administration progression reviews on schedule — update care plans accordingly");
  }

  if (selfAdmin.totalAssessments === 0) {
    actions.push("Assess all children for suitability for self-administration programme — promote independence where safe");
  }

  if (controlled.totalRecords > 0 && controlled.witnessRate < 100) {
    actions.push("Ensure all controlled drug administrations are dual-witnessed without exception — retrain staff on CD procedures");
  }

  if (controlled.discrepancyCount > 0) {
    actions.push("Conduct full controlled drug register audit — report discrepancies to pharmacy and senior management");
  }

  if (actions.length === 0) {
    actions.push("Maintain current medication management standards — continue regular auditing and staff supervision");
  }

  return actions;
}

// ── Regulatory Links Generator ───────────────────────────────────────────

function generateRegulatoryLinks(
  admin: AdministrationAccuracyResult,
  errors: MedicationErrorResult,
  stock: StockManagementResult,
  controlled: ControlledDrugsResult,
): string[] {
  const links: string[] = [];

  // Always include core regulation
  links.push("CHR 2015 Reg 23 — Health: medication must be managed safely and effectively");

  if (admin.accuracyRate < 95 || admin.omissionRate > 0 || admin.errorRate > 0) {
    links.push("CHR 2015 Reg 12 — Protection of children: safe medication handling is a safeguarding requirement");
  }

  if (errors.totalErrors > 0) {
    links.push("NICE Guidelines — Medicines adherence: errors must be reported, investigated, and learned from");
  }

  if (errors.severityBreakdown.significant > 0 || errors.severityBreakdown.critical > 0) {
    links.push("CHR 2015 Reg 40 — Notification of significant events to Ofsted including serious medication errors");
  }

  if (controlled.totalRecords > 0) {
    links.push("Misuse of Drugs Act 1971 / Medicines Act 1968 — Controlled drugs must be dual-witnessed and balance-checked");
  }

  if (stock.totalChecks > 0 || stock.totalChecks === 0) {
    links.push("Medicines Act 1968 — Safe storage, stock management, and disposal of medication");
  }

  links.push("SCCIF Health and Wellbeing — Medication management is a key area of Ofsted inspection judgement");

  if (admin.refusalRate > 0) {
    links.push("Children Act 1989 s.22 — Duty to safeguard: medication refusal must be addressed through engagement and GP review");
  }

  return links;
}

// ── Core Function 6: Generate Full Intelligence ──────────────────────────

export function generateMedicationManagementIntelligence(
  records: MedicationRecord[],
  errors: MedicationError[],
  stockChecks: StockCheck[],
  selfAdminAssessments: SelfAdminAssessment[],
  cdRecords: ControlledDrugRecord[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
  referenceDate: string,
): MedicationManagementIntelligenceResult {
  const assessedAt = referenceDate;

  // Run all evaluations
  const administrationAccuracy = evaluateAdministrationAccuracy(records);
  const errorAnalysis = evaluateMedicationErrors(errors, periodStart, periodEnd);
  const stockManagement = evaluateStockManagement(stockChecks);
  const selfAdministration = evaluateSelfAdministration(selfAdminAssessments);
  const controlledDrugs = evaluateControlledDrugs(cdRecords);

  // Calculate scores
  const adminScore = scoreAdministrationAccuracy(administrationAccuracy);
  const errorScore = scoreErrorManagement(errorAnalysis, administrationAccuracy.totalRecords);
  const stockScore = scoreStockManagement(stockManagement);
  const selfAdminScore = scoreSelfAdministration(selfAdministration);
  const controlledScore = scoreControlledDrugs(controlledDrugs);

  const overallScore = clamp(
    Math.round(adminScore + errorScore + stockScore + selfAdminScore + controlledScore),
    0,
    100,
  );

  const rating = getRating(overallScore);

  // Generate insights
  const strengths = generateStrengths(administrationAccuracy, errorAnalysis, stockManagement, selfAdministration, controlledDrugs);
  const areasForImprovement = generateAreasForImprovement(administrationAccuracy, errorAnalysis, stockManagement, selfAdministration, controlledDrugs);
  const recommendedActions = generateRecommendedActions(administrationAccuracy, errorAnalysis, stockManagement, selfAdministration, controlledDrugs);
  const regulatoryLinks = generateRegulatoryLinks(administrationAccuracy, errorAnalysis, stockManagement, controlledDrugs);

  return {
    homeId,
    assessedAt,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    scoringBreakdown: {
      administrationAccuracy: adminScore,
      errorManagement: errorScore,
      stockManagement: stockScore,
      selfAdministration: selfAdminScore,
      controlledDrugsCompliance: controlledScore,
    },
    administrationAccuracy,
    errorAnalysis,
    stockManagement,
    selfAdministration,
    controlledDrugs,
    strengths,
    areasForImprovement,
    recommendedActions,
    regulatoryLinks,
  };
}
