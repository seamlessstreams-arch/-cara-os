// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Staff Resilience Intelligence Engine
//
// Deterministic engine for resilience metrics, burnout indicators, secondary
// trauma awareness, supervision quality, and team health monitoring.
//
// Complementary to the Staff Wellbeing engine — this module focuses on:
//   - Absence pattern analysis and early warning
//   - Support access tracking and effectiveness
//   - Supervision quality (not just compliance)
//   - Team health pulse monitoring
//   - Secondary trauma screening and follow-up
//
// Aligned to:
//   - CHR 2015 Reg 32 — Fitness of workers
//   - CHR 2015 Reg 33 — Employment of staff
//   - ACAS Guidance — Managing attendance and wellbeing
//   - Health & Safety at Work Act 1974 — Employer duty of care
//   - SCCIF — Leadership and Management
//   - Working Together 2023 — Staff supported to reflect on practice
//
// No AI. No external calls. Pure input -> output.
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ──────────────────────────────────────────────────────────────────

export type BurnoutIndicator =
  | "increased_sickness"
  | "reduced_engagement"
  | "increased_incidents"
  | "withdrawal_from_team"
  | "emotional_exhaustion"
  | "cynicism"
  | "reduced_effectiveness";

export type SupportType =
  | "clinical_supervision"
  | "peer_support"
  | "EAP"
  | "debriefing"
  | "reflective_group"
  | "one_to_one_supervision"
  | "team_day"
  | "wellness_check";

export type AbsenceReason =
  | "sickness"
  | "stress"
  | "personal"
  | "compassionate"
  | "annual_leave"
  | "training";

export type OverallRating = "outstanding" | "good" | "requires_improvement" | "inadequate";

// ── Record Interfaces ──────────────────────────────────────────────────────

export interface StaffAbsenceRecord {
  id: string;
  staffId: string;
  staffName: string;
  startDate: string;
  endDate?: string;
  reason: AbsenceReason;
  returnToWorkCompleted: boolean;
  adjustmentsMade?: string;
}

export interface SupportAccessRecord {
  id: string;
  staffId: string;
  staffName: string;
  date: string;
  supportType: SupportType;
  accessedVoluntarily: boolean;
  followUpPlanned: boolean;
  satisfactionRating?: number; // 1-5
}

export interface SupervisionRecord {
  id: string;
  staffId: string;
  staffName: string;
  date: string;
  supervisorName: string;
  wellbeingDiscussed: boolean;
  workloadDiscussed: boolean;
  developmentDiscussed: boolean;
  actionPoints: number;
  actionPointsCompleted: number;
  nextDueDate: string;
}

export interface TeamHealthCheck {
  id: string;
  date: string;
  conductedBy: string;
  teamMorale: "high" | "good" | "mixed" | "low";
  workloadManageable: boolean;
  supportAdequate: boolean;
  communicationEffective: boolean;
  issuesRaised: string[];
  actionsAgreed: string[];
  actionsCompleted: boolean;
}

export interface SecondaryTraumaScreen {
  id: string;
  staffId: string;
  staffName: string;
  screeningDate: string;
  screenedBy: string;
  indicatorsPresent: BurnoutIndicator[];
  supportOffered: boolean;
  supportAccepted: boolean;
  actionPlan: boolean;
  reviewDate: string;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface AbsencePatternResult {
  overallAbsenceRate: number;           // days per staff member in period
  stressRelatedAbsenceRate: number;     // % of absences that are stress-related
  returnToWorkCompletionRate: number;   // % of absences with RTW completed
  adjustmentRate: number;               // % of absences with adjustments made
  staffPatterns: StaffAbsencePattern[];
  totalAbsenceDays: number;
  totalStressAbsenceDays: number;
}

export interface StaffAbsencePattern {
  staffId: string;
  staffName: string;
  totalDays: number;
  stressDays: number;
  absenceCount: number;
  returnToWorkRate: number;
  hasAdjustments: boolean;
}

export interface SupportAccessResult {
  accessRatePerStaff: number;           // average support accesses per staff
  supportTypeVariety: number;           // number of distinct support types used
  voluntaryAccessRate: number;          // % of accesses that were voluntary
  satisfactionRate: number;             // average satisfaction (0-100 scaled)
  followUpRate: number;                 // % with follow-up planned
  totalAccesses: number;
  typeBreakdown: Record<string, number>;
}

export interface SupervisionQualityResult {
  frequencyRate: number;                // % of staff with monthly supervision
  wellbeingDiscussedRate: number;       // % of supervisions discussing wellbeing
  workloadDiscussedRate: number;        // % of supervisions discussing workload
  actionCompletionRate: number;         // % of action points completed
  averageActionPoints: number;
  overdueCount: number;                 // staff with overdue supervision
  staffSupervisionDetails: StaffSupervisionDetail[];
}

export interface StaffSupervisionDetail {
  staffId: string;
  staffName: string;
  supervisionCount: number;
  lastSupervisionDate: string | null;
  isOverdue: boolean;
  wellbeingDiscussedRate: number;
  actionCompletionRate: number;
}

export interface TeamHealthResult {
  latestMorale: "high" | "good" | "mixed" | "low" | "no_data";
  moraleTrend: "improving" | "stable" | "declining" | "insufficient_data";
  workloadManageableRate: number;       // % of checks where workload manageable
  supportAdequacyRate: number;          // % where support adequate
  communicationEffectiveRate: number;   // % where communication effective
  actionCompletionRate: number;         // % of checks with actions completed
  totalIssuesRaised: number;
  totalActionsAgreed: number;
}

export interface SecondaryTraumaResult {
  screeningCoverage: number;            // % of staff screened
  indicatorPrevalence: number;          // average indicators per screened staff
  supportOfferedRate: number;           // % offered support
  supportAcceptedRate: number;          // % who accepted support (of those offered)
  actionPlanRate: number;               // % with action plans
  mostCommonIndicators: { indicator: BurnoutIndicator; count: number }[];
  staffWithIndicators: number;          // count of staff with any indicators
}

export interface RegulatoryLink {
  regulation: string;
  requirement: string;
  status: "met" | "partially_met" | "not_met";
  evidence: string;
}

export interface StaffResilienceIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  generatedAt: string;
  overallScore: number;                 // 0-100
  overallRating: OverallRating;
  componentScores: {
    absenceManagement: number;          // 0-20
    supportAccess: number;              // 0-20
    supervisionQuality: number;         // 0-25
    teamHealth: number;                 // 0-15
    secondaryTrauma: number;            // 0-20
  };
  absencePatterns: AbsencePatternResult;
  supportAccess: SupportAccessResult;
  supervisionQuality: SupervisionQualityResult;
  teamHealth: TeamHealthResult;
  secondaryTrauma: SecondaryTraumaResult;
  strengths: string[];
  areasForImprovement: string[];
  recommendedActions: string[];
  regulatoryLinks: RegulatoryLink[];
  staffProfiles: StaffResilienceProfile[];
}

export interface StaffResilienceProfile {
  staffId: string;
  staffName: string;
  absenceDays: number;
  supportAccesses: number;
  supervisionCount: number;
  supervisionOverdue: boolean;
  hasTraumaIndicators: boolean;
  indicatorCount: number;
  riskFlags: string[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

function daysBetween(start: string, end: string): number {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  return Math.max(1, Math.ceil((e - s) / (24 * 60 * 60 * 1000)));
}

function isInPeriod(dateStr: string, periodStart: string, periodEnd: string): boolean {
  const d = new Date(dateStr).getTime();
  return d >= new Date(periodStart).getTime() && d <= new Date(periodEnd).getTime();
}

const MORALE_VALUES: Record<string, number> = { high: 4, good: 3, mixed: 2, low: 1 };

// ── Core Function 1: Evaluate Absence Patterns ────────────────────────────

export function evaluateAbsencePatterns(
  absences: StaffAbsenceRecord[],
  staffIds: string[],
  periodStart: string,
  periodEnd: string,
): AbsencePatternResult {
  const periodAbsences = absences.filter(a => isInPeriod(a.startDate, periodStart, periodEnd));

  // Calculate days for each absence
  const absencesWithDays = periodAbsences.map(a => ({
    ...a,
    days: a.endDate ? daysBetween(a.startDate, a.endDate) : 1,
  }));

  const totalAbsenceDays = absencesWithDays.reduce((sum, a) => sum + a.days, 0);
  const stressAbsences = absencesWithDays.filter(a => a.reason === "stress");
  const totalStressAbsenceDays = stressAbsences.reduce((sum, a) => sum + a.days, 0);

  // Rates
  const staffCount = staffIds.length || 1;
  const overallAbsenceRate = Math.round((totalAbsenceDays / staffCount) * 10) / 10;
  const stressRelatedAbsenceRate = periodAbsences.length > 0
    ? Math.round((stressAbsences.length / periodAbsences.length) * 100)
    : 0;

  // Exclude annual_leave and training from RTW expectations
  const rtwApplicable = periodAbsences.filter(
    a => a.reason !== "annual_leave" && a.reason !== "training"
  );
  const rtwCompleted = rtwApplicable.filter(a => a.returnToWorkCompleted);
  const returnToWorkCompletionRate = rtwApplicable.length > 0
    ? Math.round((rtwCompleted.length / rtwApplicable.length) * 100)
    : 100;

  const withAdjustments = rtwApplicable.filter(a => a.adjustmentsMade != null && a.adjustmentsMade.length > 0);
  const adjustmentRate = rtwApplicable.length > 0
    ? Math.round((withAdjustments.length / rtwApplicable.length) * 100)
    : 100;

  // Per-staff patterns
  const staffPatterns: StaffAbsencePattern[] = staffIds.map(staffId => {
    const staffAbsences = absencesWithDays.filter(a => a.staffId === staffId);
    const staffStress = staffAbsences.filter(a => a.reason === "stress");
    const staffRtwApplicable = staffAbsences.filter(
      a => a.reason !== "annual_leave" && a.reason !== "training"
    );
    const staffRtwDone = staffRtwApplicable.filter(a => a.returnToWorkCompleted);

    return {
      staffId,
      staffName: staffAbsences[0]?.staffName ?? staffId,
      totalDays: staffAbsences.reduce((sum, a) => sum + a.days, 0),
      stressDays: staffStress.reduce((sum, a) => sum + a.days, 0),
      absenceCount: staffAbsences.length,
      returnToWorkRate: staffRtwApplicable.length > 0
        ? Math.round((staffRtwDone.length / staffRtwApplicable.length) * 100)
        : 100,
      hasAdjustments: staffAbsences.some(a => a.adjustmentsMade != null && a.adjustmentsMade.length > 0),
    };
  });

  return {
    overallAbsenceRate,
    stressRelatedAbsenceRate,
    returnToWorkCompletionRate,
    adjustmentRate,
    staffPatterns,
    totalAbsenceDays,
    totalStressAbsenceDays,
  };
}

// ── Core Function 2: Evaluate Support Access ──────────────────────────────

export function evaluateSupportAccess(
  supports: SupportAccessRecord[],
): SupportAccessResult {
  if (supports.length === 0) {
    return {
      accessRatePerStaff: 0,
      supportTypeVariety: 0,
      voluntaryAccessRate: 0,
      satisfactionRate: 0,
      followUpRate: 0,
      totalAccesses: 0,
      typeBreakdown: {},
    };
  }

  const uniqueStaff = new Set(supports.map(s => s.staffId));
  const accessRatePerStaff = Math.round((supports.length / uniqueStaff.size) * 10) / 10;

  const types = new Set(supports.map(s => s.supportType));
  const supportTypeVariety = types.size;

  const voluntary = supports.filter(s => s.accessedVoluntarily);
  const voluntaryAccessRate = Math.round((voluntary.length / supports.length) * 100);

  const rated = supports.filter(s => s.satisfactionRating != null);
  const satisfactionRate = rated.length > 0
    ? Math.round((rated.reduce((sum, s) => sum + s.satisfactionRating!, 0) / rated.length / 5) * 100)
    : 0;

  const followUps = supports.filter(s => s.followUpPlanned);
  const followUpRate = Math.round((followUps.length / supports.length) * 100);

  // Type breakdown
  const typeBreakdown: Record<string, number> = {};
  for (const s of supports) {
    typeBreakdown[s.supportType] = (typeBreakdown[s.supportType] ?? 0) + 1;
  }

  return {
    accessRatePerStaff,
    supportTypeVariety,
    voluntaryAccessRate,
    satisfactionRate,
    followUpRate,
    totalAccesses: supports.length,
    typeBreakdown,
  };
}

// ── Core Function 3: Evaluate Supervision Quality ─────────────────────────

export function evaluateSupervisionQuality(
  supervisions: SupervisionRecord[],
  staffIds: string[],
  periodStart: string,
  periodEnd: string,
): SupervisionQualityResult {
  const periodSupervisions = supervisions.filter(s => isInPeriod(s.date, periodStart, periodEnd));
  const periodMonths = Math.max(1, Math.round(daysBetween(periodStart, periodEnd) / 30));

  // Frequency: each staff should have at least 1 supervision per month
  const staffWithMonthly: Set<string> = new Set();
  for (const staffId of staffIds) {
    const staffSups = periodSupervisions.filter(s => s.staffId === staffId);
    if (staffSups.length >= periodMonths) {
      staffWithMonthly.add(staffId);
    }
  }
  const frequencyRate = staffIds.length > 0
    ? Math.round((staffWithMonthly.size / staffIds.length) * 100)
    : 0;

  // Quality rates
  const wellbeingDiscussed = periodSupervisions.filter(s => s.wellbeingDiscussed);
  const wellbeingDiscussedRate = periodSupervisions.length > 0
    ? Math.round((wellbeingDiscussed.length / periodSupervisions.length) * 100)
    : 0;

  const workloadDiscussed = periodSupervisions.filter(s => s.workloadDiscussed);
  const workloadDiscussedRate = periodSupervisions.length > 0
    ? Math.round((workloadDiscussed.length / periodSupervisions.length) * 100)
    : 0;

  // Action completion
  const totalActions = periodSupervisions.reduce((sum, s) => sum + s.actionPoints, 0);
  const completedActions = periodSupervisions.reduce((sum, s) => sum + s.actionPointsCompleted, 0);
  const actionCompletionRate = totalActions > 0
    ? Math.round((completedActions / totalActions) * 100)
    : 100;

  const averageActionPoints = periodSupervisions.length > 0
    ? Math.round((totalActions / periodSupervisions.length) * 10) / 10
    : 0;

  // Overdue: last supervision more than 35 days before end of period
  const referenceDate = new Date(periodEnd).getTime();
  const overdueThreshold = 35 * 24 * 60 * 60 * 1000;
  let overdueCount = 0;

  const staffSupervisionDetails: StaffSupervisionDetail[] = staffIds.map(staffId => {
    const staffSups = periodSupervisions.filter(s => s.staffId === staffId);
    const sorted = [...staffSups].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const lastDate = sorted[0]?.date ?? null;
    const isOverdue = lastDate
      ? (referenceDate - new Date(lastDate).getTime()) > overdueThreshold
      : true;
    if (isOverdue) overdueCount++;

    const staffWellbeing = staffSups.filter(s => s.wellbeingDiscussed);
    const staffActions = staffSups.reduce((sum, s) => sum + s.actionPoints, 0);
    const staffCompleted = staffSups.reduce((sum, s) => sum + s.actionPointsCompleted, 0);

    return {
      staffId,
      staffName: staffSups[0]?.staffName ?? staffId,
      supervisionCount: staffSups.length,
      lastSupervisionDate: lastDate,
      isOverdue,
      wellbeingDiscussedRate: staffSups.length > 0
        ? Math.round((staffWellbeing.length / staffSups.length) * 100)
        : 0,
      actionCompletionRate: staffActions > 0
        ? Math.round((staffCompleted / staffActions) * 100)
        : 100,
    };
  });

  return {
    frequencyRate,
    wellbeingDiscussedRate,
    workloadDiscussedRate,
    actionCompletionRate,
    averageActionPoints,
    overdueCount,
    staffSupervisionDetails,
  };
}

// ── Core Function 4: Evaluate Team Health ─────────────────────────────────

export function evaluateTeamHealth(
  checks: TeamHealthCheck[],
): TeamHealthResult {
  if (checks.length === 0) {
    return {
      latestMorale: "no_data",
      moraleTrend: "insufficient_data",
      workloadManageableRate: 0,
      supportAdequacyRate: 0,
      communicationEffectiveRate: 0,
      actionCompletionRate: 0,
      totalIssuesRaised: 0,
      totalActionsAgreed: 0,
    };
  }

  const sorted = [...checks].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const latestMorale = sorted[sorted.length - 1].teamMorale;

  // Morale trend
  let moraleTrend: "improving" | "stable" | "declining" | "insufficient_data" = "insufficient_data";
  if (sorted.length >= 2) {
    const first = MORALE_VALUES[sorted[0].teamMorale] ?? 2;
    const last = MORALE_VALUES[sorted[sorted.length - 1].teamMorale] ?? 2;
    if (last > first) moraleTrend = "improving";
    else if (last < first) moraleTrend = "declining";
    else moraleTrend = "stable";
  }

  const workloadManageable = checks.filter(c => c.workloadManageable);
  const workloadManageableRate = Math.round((workloadManageable.length / checks.length) * 100);

  const supportAdequate = checks.filter(c => c.supportAdequate);
  const supportAdequacyRate = Math.round((supportAdequate.length / checks.length) * 100);

  const communicationEffective = checks.filter(c => c.communicationEffective);
  const communicationEffectiveRate = Math.round((communicationEffective.length / checks.length) * 100);

  const completed = checks.filter(c => c.actionsCompleted);
  const actionCompletionRate = Math.round((completed.length / checks.length) * 100);

  const totalIssuesRaised = checks.reduce((sum, c) => sum + c.issuesRaised.length, 0);
  const totalActionsAgreed = checks.reduce((sum, c) => sum + c.actionsAgreed.length, 0);

  return {
    latestMorale,
    moraleTrend,
    workloadManageableRate,
    supportAdequacyRate,
    communicationEffectiveRate,
    actionCompletionRate,
    totalIssuesRaised,
    totalActionsAgreed,
  };
}

// ── Core Function 5: Evaluate Secondary Trauma ────────────────────────────

export function evaluateSecondaryTrauma(
  screens: SecondaryTraumaScreen[],
  staffIds: string[],
): SecondaryTraumaResult {
  if (screens.length === 0 || staffIds.length === 0) {
    return {
      screeningCoverage: 0,
      indicatorPrevalence: 0,
      supportOfferedRate: 0,
      supportAcceptedRate: 0,
      actionPlanRate: 0,
      mostCommonIndicators: [],
      staffWithIndicators: 0,
    };
  }

  // Coverage: unique staff screened / total staff
  const screenedStaff = new Set(screens.map(s => s.staffId));
  const screeningCoverage = Math.round((screenedStaff.size / staffIds.length) * 100);

  // Indicator prevalence: average indicators per screened staff
  const totalIndicators = screens.reduce((sum, s) => sum + s.indicatorsPresent.length, 0);
  const indicatorPrevalence = Math.round((totalIndicators / screens.length) * 10) / 10;

  // Staff with any indicators
  const staffWithIndicators = screens.filter(s => s.indicatorsPresent.length > 0).length;

  // Support offered rate
  const withIndicatorsScreens = screens.filter(s => s.indicatorsPresent.length > 0);
  const supportOfferedRate = withIndicatorsScreens.length > 0
    ? Math.round((withIndicatorsScreens.filter(s => s.supportOffered).length / withIndicatorsScreens.length) * 100)
    : 100;

  // Support accepted rate (of those offered)
  const offered = screens.filter(s => s.supportOffered);
  const supportAcceptedRate = offered.length > 0
    ? Math.round((offered.filter(s => s.supportAccepted).length / offered.length) * 100)
    : 0;

  // Action plan rate
  const actionPlanRate = withIndicatorsScreens.length > 0
    ? Math.round((withIndicatorsScreens.filter(s => s.actionPlan).length / withIndicatorsScreens.length) * 100)
    : 100;

  // Most common indicators
  const indicatorCounts: Record<string, number> = {};
  for (const screen of screens) {
    for (const indicator of screen.indicatorsPresent) {
      indicatorCounts[indicator] = (indicatorCounts[indicator] ?? 0) + 1;
    }
  }
  const mostCommonIndicators = Object.entries(indicatorCounts)
    .map(([indicator, count]) => ({ indicator: indicator as BurnoutIndicator, count }))
    .sort((a, b) => b.count - a.count);

  return {
    screeningCoverage,
    indicatorPrevalence,
    supportOfferedRate,
    supportAcceptedRate,
    actionPlanRate,
    mostCommonIndicators,
    staffWithIndicators,
  };
}

// ── Core Function 6: Generate Staff Resilience Intelligence ───────────────

export function generateStaffResilienceIntelligence(
  absences: StaffAbsenceRecord[],
  supports: SupportAccessRecord[],
  supervisions: SupervisionRecord[],
  teamHealthChecks: TeamHealthCheck[],
  screens: SecondaryTraumaScreen[],
  staffIds: string[],
  staffNames: Record<string, string>,
  homeId: string,
  periodStart: string,
  periodEnd: string,
  referenceDate: string,
): StaffResilienceIntelligence {
  // Evaluate each component
  const absencePatterns = evaluateAbsencePatterns(absences, staffIds, periodStart, periodEnd);
  const supportAccess = evaluateSupportAccess(supports);
  const supervisionQuality = evaluateSupervisionQuality(supervisions, staffIds, periodStart, periodEnd);
  const teamHealth = evaluateTeamHealth(teamHealthChecks);
  const secondaryTrauma = evaluateSecondaryTrauma(screens, staffIds);

  // ── Score: Absence Management (0-20) ────────────────────────────────────
  let absenceScore = 0;
  // Low absence rate (up to 8 points)
  if (absencePatterns.overallAbsenceRate <= 2) absenceScore += 8;
  else if (absencePatterns.overallAbsenceRate <= 5) absenceScore += 6;
  else if (absencePatterns.overallAbsenceRate <= 10) absenceScore += 4;
  else if (absencePatterns.overallAbsenceRate <= 15) absenceScore += 2;

  // Return to work completion (up to 6 points)
  if (absencePatterns.returnToWorkCompletionRate >= 90) absenceScore += 6;
  else if (absencePatterns.returnToWorkCompletionRate >= 75) absenceScore += 4;
  else if (absencePatterns.returnToWorkCompletionRate >= 50) absenceScore += 2;

  // Adjustments made (up to 6 points)
  if (absencePatterns.adjustmentRate >= 80) absenceScore += 6;
  else if (absencePatterns.adjustmentRate >= 60) absenceScore += 4;
  else if (absencePatterns.adjustmentRate >= 40) absenceScore += 2;

  // ── Score: Support Access (0-20) ────────────────────────────────────────
  let supportScore = 0;
  // Coverage — at least 1 access per staff (up to 7 points)
  if (supportAccess.accessRatePerStaff >= 2) supportScore += 7;
  else if (supportAccess.accessRatePerStaff >= 1) supportScore += 5;
  else if (supportAccess.accessRatePerStaff >= 0.5) supportScore += 3;
  else if (supportAccess.totalAccesses > 0) supportScore += 1;

  // Type variety (up to 6 points)
  if (supportAccess.supportTypeVariety >= 5) supportScore += 6;
  else if (supportAccess.supportTypeVariety >= 3) supportScore += 4;
  else if (supportAccess.supportTypeVariety >= 1) supportScore += 2;

  // Satisfaction (up to 7 points)
  if (supportAccess.satisfactionRate >= 80) supportScore += 7;
  else if (supportAccess.satisfactionRate >= 60) supportScore += 5;
  else if (supportAccess.satisfactionRate >= 40) supportScore += 3;
  else if (supportAccess.satisfactionRate > 0) supportScore += 1;

  // ── Score: Supervision Quality (0-25) ───────────────────────────────────
  let supervisionScore = 0;
  // Frequency (up to 10 points)
  if (supervisionQuality.frequencyRate >= 90) supervisionScore += 10;
  else if (supervisionQuality.frequencyRate >= 75) supervisionScore += 7;
  else if (supervisionQuality.frequencyRate >= 50) supervisionScore += 4;
  else if (supervisionQuality.frequencyRate > 0) supervisionScore += 2;

  // Wellbeing discussed (up to 8 points)
  if (supervisionQuality.wellbeingDiscussedRate >= 90) supervisionScore += 8;
  else if (supervisionQuality.wellbeingDiscussedRate >= 75) supervisionScore += 6;
  else if (supervisionQuality.wellbeingDiscussedRate >= 50) supervisionScore += 3;
  else if (supervisionQuality.wellbeingDiscussedRate > 0) supervisionScore += 1;

  // Action completion (up to 7 points)
  if (supervisionQuality.actionCompletionRate >= 90) supervisionScore += 7;
  else if (supervisionQuality.actionCompletionRate >= 75) supervisionScore += 5;
  else if (supervisionQuality.actionCompletionRate >= 50) supervisionScore += 3;
  else if (supervisionQuality.actionCompletionRate > 0) supervisionScore += 1;

  // ── Score: Team Health (0-15) ───────────────────────────────────────────
  let teamHealthScore = 0;
  // Morale (up to 5 points)
  const moraleVal = MORALE_VALUES[teamHealth.latestMorale] ?? 0;
  if (moraleVal >= 4) teamHealthScore += 5;
  else if (moraleVal >= 3) teamHealthScore += 4;
  else if (moraleVal >= 2) teamHealthScore += 2;
  else if (moraleVal >= 1) teamHealthScore += 1;

  // Workload manageable (up to 5 points)
  if (teamHealth.workloadManageableRate >= 80) teamHealthScore += 5;
  else if (teamHealth.workloadManageableRate >= 60) teamHealthScore += 3;
  else if (teamHealth.workloadManageableRate > 0) teamHealthScore += 1;

  // Communication effective (up to 5 points)
  if (teamHealth.communicationEffectiveRate >= 80) teamHealthScore += 5;
  else if (teamHealth.communicationEffectiveRate >= 60) teamHealthScore += 3;
  else if (teamHealth.communicationEffectiveRate > 0) teamHealthScore += 1;

  // ── Score: Secondary Trauma (0-20) ──────────────────────────────────────
  let traumaScore = 0;
  // Screening coverage (up to 8 points)
  if (secondaryTrauma.screeningCoverage >= 90) traumaScore += 8;
  else if (secondaryTrauma.screeningCoverage >= 75) traumaScore += 6;
  else if (secondaryTrauma.screeningCoverage >= 50) traumaScore += 4;
  else if (secondaryTrauma.screeningCoverage > 0) traumaScore += 2;

  // Support offered (up to 6 points)
  if (secondaryTrauma.supportOfferedRate >= 90) traumaScore += 6;
  else if (secondaryTrauma.supportOfferedRate >= 75) traumaScore += 4;
  else if (secondaryTrauma.supportOfferedRate >= 50) traumaScore += 2;

  // Action plans (up to 6 points)
  if (secondaryTrauma.actionPlanRate >= 90) traumaScore += 6;
  else if (secondaryTrauma.actionPlanRate >= 75) traumaScore += 4;
  else if (secondaryTrauma.actionPlanRate >= 50) traumaScore += 2;

  const overallScore = absenceScore + supportScore + supervisionScore + teamHealthScore + traumaScore;

  // Rating
  let overallRating: OverallRating;
  if (overallScore >= 80) overallRating = "outstanding";
  else if (overallScore >= 60) overallRating = "good";
  else if (overallScore >= 40) overallRating = "requires_improvement";
  else overallRating = "inadequate";

  // ── Strengths ───────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (absencePatterns.returnToWorkCompletionRate >= 90)
    strengths.push("Excellent return-to-work process completion");
  if (supportAccess.voluntaryAccessRate >= 70)
    strengths.push("High voluntary access to support services");
  if (supervisionQuality.wellbeingDiscussedRate >= 80)
    strengths.push("Wellbeing consistently addressed in supervision");
  if (supervisionQuality.frequencyRate >= 90)
    strengths.push("Monthly supervision target met for all staff");
  if (teamHealth.latestMorale === "high" || teamHealth.latestMorale === "good")
    strengths.push("Positive team morale");
  if (secondaryTrauma.screeningCoverage >= 90)
    strengths.push("Comprehensive secondary trauma screening coverage");
  if (absencePatterns.stressRelatedAbsenceRate <= 10)
    strengths.push("Low stress-related absence rate");
  if (supportAccess.satisfactionRate >= 80)
    strengths.push("High satisfaction with support services");

  // ── Areas for Improvement ───────────────────────────────────────────────
  const areasForImprovement: string[] = [];
  if (absencePatterns.returnToWorkCompletionRate < 75)
    areasForImprovement.push("Return-to-work completion rate below expected standard");
  if (supervisionQuality.frequencyRate < 75)
    areasForImprovement.push("Supervision frequency below monthly target");
  if (supervisionQuality.wellbeingDiscussedRate < 50)
    areasForImprovement.push("Wellbeing not consistently discussed in supervision");
  if (teamHealth.latestMorale === "low" || teamHealth.latestMorale === "mixed")
    areasForImprovement.push("Team morale requires attention");
  if (secondaryTrauma.screeningCoverage < 75)
    areasForImprovement.push("Secondary trauma screening coverage below target");
  if (supportAccess.supportTypeVariety < 3)
    areasForImprovement.push("Limited variety of support types accessed");
  if (absencePatterns.stressRelatedAbsenceRate > 25)
    areasForImprovement.push("Stress-related absence rate is elevated");
  if (teamHealth.workloadManageableRate < 50)
    areasForImprovement.push("Team reporting unmanageable workload");

  // ── Recommended Actions ─────────────────────────────────────────────────
  const recommendedActions: string[] = [];
  if (supervisionQuality.overdueCount > 0)
    recommendedActions.push(`Schedule overdue supervision for ${supervisionQuality.overdueCount} staff member(s)`);
  if (absencePatterns.stressRelatedAbsenceRate > 15)
    recommendedActions.push("Review stress risk assessments and consider additional support measures");
  if (secondaryTrauma.screeningCoverage < 100)
    recommendedActions.push("Complete secondary trauma screening for all staff");
  if (teamHealth.latestMorale === "low")
    recommendedActions.push("Arrange team wellbeing day or away day");
  if (supportAccess.followUpRate < 50)
    recommendedActions.push("Improve follow-up planning for support access");
  if (absencePatterns.returnToWorkCompletionRate < 75)
    recommendedActions.push("Ensure return-to-work meetings completed for all absences");
  if (supervisionQuality.actionCompletionRate < 75)
    recommendedActions.push("Review supervision action points and support completion");
  if (secondaryTrauma.staffWithIndicators > 0 && secondaryTrauma.actionPlanRate < 75)
    recommendedActions.push("Develop action plans for staff showing trauma indicators");

  // ── Regulatory Links ────────────────────────────────────────────────────
  const regulatoryLinks: RegulatoryLink[] = [
    {
      regulation: "CHR 2015 Reg 32",
      requirement: "Fitness of workers — staff must be physically and mentally fit",
      status: absencePatterns.stressRelatedAbsenceRate <= 15 && secondaryTrauma.supportOfferedRate >= 75 ? "met" : absencePatterns.stressRelatedAbsenceRate <= 25 ? "partially_met" : "not_met",
      evidence: `Stress absence rate: ${absencePatterns.stressRelatedAbsenceRate}%. Secondary trauma support offered: ${secondaryTrauma.supportOfferedRate}%.`,
    },
    {
      regulation: "CHR 2015 Reg 33",
      requirement: "Employment of staff — sufficient, competent, supervised staff",
      status: supervisionQuality.frequencyRate >= 90 && supervisionQuality.overdueCount === 0 ? "met" : supervisionQuality.frequencyRate >= 50 ? "partially_met" : "not_met",
      evidence: `Supervision frequency: ${supervisionQuality.frequencyRate}%. Overdue: ${supervisionQuality.overdueCount}.`,
    },
    {
      regulation: "ACAS Guidance",
      requirement: "Managing attendance — fair and supportive absence management",
      status: absencePatterns.returnToWorkCompletionRate >= 90 && absencePatterns.adjustmentRate >= 60 ? "met" : absencePatterns.returnToWorkCompletionRate >= 50 ? "partially_met" : "not_met",
      evidence: `RTW completion: ${absencePatterns.returnToWorkCompletionRate}%. Adjustments: ${absencePatterns.adjustmentRate}%.`,
    },
    {
      regulation: "Health & Safety at Work Act 1974",
      requirement: "Employer duty of care — health, safety and welfare of employees",
      status: teamHealth.workloadManageableRate >= 80 && supportAccess.accessRatePerStaff >= 1 ? "met" : teamHealth.workloadManageableRate >= 50 ? "partially_met" : "not_met",
      evidence: `Workload manageable: ${teamHealth.workloadManageableRate}%. Support access rate: ${supportAccess.accessRatePerStaff} per staff.`,
    },
    {
      regulation: "SCCIF Leadership & Management",
      requirement: "Leaders promote staff wellbeing, resilience and development",
      status: overallScore >= 70 ? "met" : overallScore >= 50 ? "partially_met" : "not_met",
      evidence: `Overall resilience score: ${overallScore}/100 (${overallRating}).`,
    },
  ];

  // ── Staff Profiles ──────────────────────────────────────────────────────
  const staffProfiles: StaffResilienceProfile[] = staffIds.map(staffId => {
    const staffAbsences = absences.filter(a => a.staffId === staffId && isInPeriod(a.startDate, periodStart, periodEnd));
    const staffSupports = supports.filter(s => s.staffId === staffId);
    const staffSups = supervisions.filter(s => s.staffId === staffId && isInPeriod(s.date, periodStart, periodEnd));
    const staffScreens = screens.filter(s => s.staffId === staffId);

    const absenceDays = staffAbsences.reduce((sum, a) => {
      return sum + (a.endDate ? daysBetween(a.startDate, a.endDate) : 1);
    }, 0);

    const sorted = [...staffSups].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const lastSupDate = sorted[0]?.date ?? null;
    const overdueThreshold = 35 * 24 * 60 * 60 * 1000;
    const supervisionOverdue = lastSupDate
      ? (new Date(referenceDate).getTime() - new Date(lastSupDate).getTime()) > overdueThreshold
      : true;

    const latestScreen = staffScreens[staffScreens.length - 1];
    const hasTraumaIndicators = latestScreen ? latestScreen.indicatorsPresent.length > 0 : false;
    const indicatorCount = latestScreen ? latestScreen.indicatorsPresent.length : 0;

    const riskFlags: string[] = [];
    const stressAbsences = staffAbsences.filter(a => a.reason === "stress");
    if (stressAbsences.length > 0) riskFlags.push("Stress-related absence");
    if (supervisionOverdue) riskFlags.push("Supervision overdue");
    if (hasTraumaIndicators) riskFlags.push("Trauma indicators present");
    if (absenceDays > 10) riskFlags.push("High absence days");

    return {
      staffId,
      staffName: staffNames[staffId] ?? staffId,
      absenceDays,
      supportAccesses: staffSupports.length,
      supervisionCount: staffSups.length,
      supervisionOverdue,
      hasTraumaIndicators,
      indicatorCount,
      riskFlags,
    };
  });

  return {
    homeId,
    periodStart,
    periodEnd,
    generatedAt: referenceDate,
    overallScore,
    overallRating,
    componentScores: {
      absenceManagement: absenceScore,
      supportAccess: supportScore,
      supervisionQuality: supervisionScore,
      teamHealth: teamHealthScore,
      secondaryTrauma: traumaScore,
    },
    absencePatterns,
    supportAccess,
    supervisionQuality,
    teamHealth,
    secondaryTrauma,
    strengths,
    areasForImprovement,
    recommendedActions,
    regulatoryLinks,
    staffProfiles,
  };
}
