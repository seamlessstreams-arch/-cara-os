// ══════════════════════════════════════════════════════════════════════════════
// SAFEGUARDING EFFECTIVENESS INTELLIGENCE ENGINE
//
// Pure deterministic engine for evaluating how effectively a home's
// safeguarding systems protect children — referral quality, staff training,
// audit findings, and supervision practice.
//
// Regulatory basis:
//   - CHR 2015, Reg 12 — Protection of children
//   - CHR 2015, Reg 13 — Leadership and management
//   - CHR 2015, Reg 33 — Employment of staff (training)
//   - CHR 2015, Reg 34 — Review of quality of care
//   - SCCIF — Help & protection judgement area
//   - Working Together to Safeguard Children 2023
//   - Keeping Children Safe in Education (KCSIE) 2024
//
// No AI. No external calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

import { rate, weightedMeanOf, meets, below } from "@/lib/metrics/rate";

// ── Types ──────────────────────────────────────────────────────────────────

export type ReferralType =
  | "child_protection"
  | "child_in_need"
  | "LADO"
  | "police"
  | "prevent"
  | "CSE"
  | "CCE"
  | "modern_slavery"
  | "FGM"
  | "county_lines";

export type ReferralOutcome =
  | "progressed"
  | "no_further_action"
  | "stepped_up"
  | "stepped_down"
  | "ongoing";

export type TrainingLevel =
  | "basic_awareness"
  | "level_1"
  | "level_2"
  | "level_3_dsl"
  | "specialist";

export type SafeguardingAuditArea =
  | "policy"
  | "procedures"
  | "training"
  | "recording"
  | "information_sharing"
  | "supervision"
  | "culture"
  | "multi_agency";

export type OfstedRating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface SafeguardingReferral {
  id: string;
  homeId: string;
  childId: string;
  childName: string;
  referralDate: string; // ISO date
  referralType: ReferralType;
  referredBy: string;
  referredTo: string;
  timelinessHours: number;
  appropriateThreshold: boolean;
  multiAgencyEngaged: boolean;
  outcome: ReferralOutcome;
  outcomeDate?: string; // ISO date
  childInformed: boolean;
  lessonsLearned?: string;
}

export interface SafeguardingTraining {
  id: string;
  staffId: string;
  staffName: string;
  trainingDate: string; // ISO date
  trainingLevel: TrainingLevel;
  provider: string;
  expiryDate: string; // ISO date
  completedOnTime: boolean;
  scenarioBasedElement: boolean;
  assessmentPassed: boolean;
}

export interface SafeguardingAudit {
  id: string;
  homeId: string;
  auditDate: string; // ISO date
  auditor: string;
  area: SafeguardingAuditArea;
  rating: OfstedRating;
  findingsCount: number;
  criticalFindings: number;
  actionsRequired: string[];
  actionsCompleted: number;
  previousRating?: OfstedRating;
}

export interface SafeguardingSupervision {
  id: string;
  staffId: string;
  staffName: string;
  date: string; // ISO date
  supervisor: string;
  safeguardingDiscussed: boolean;
  casesReviewed: number;
  decisionsRecorded: boolean;
  reflectivePractice: boolean;
  actionPoints: number;
  actionPointsCompleted: number;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface ReferralQualityResult {
  totalReferrals: number;
  timelyReferrals: number;
  timelinessRate: number | null;
  averageTimelinessHours: number;
  appropriateThresholdCount: number;
  appropriateThresholdRate: number | null;
  multiAgencyEngagedCount: number;
  multiAgencyEngagementRate: number | null;
  childInformedCount: number;
  childInformedRate: number | null;
  outcomeBreakdown: Record<ReferralOutcome, number>;
  referralTypeBreakdown: Record<ReferralType, number>;
  progressedRate: number | null;
  nfaRate: number | null;
  lessonsLearnedCount: number;
  lessonsLearnedRate: number | null;
  score: number; // 0-25
  strengths: string[];
  concerns: string[];
}

export interface TrainingComplianceResult {
  totalStaff: number;
  staffWithCurrentTraining: number;
  coverageRate: number | null;
  totalTrainingRecords: number;
  currentTrainingRecords: number;
  currencyRate: number | null;
  dslCount: number;
  dslRequired: number;
  dslCoverageRate: number | null;
  scenarioBasedCount: number;
  scenarioBasedRate: number | null;
  assessmentPassCount: number;
  assessmentPassRate: number | null;
  completedOnTimeCount: number;
  completedOnTimeRate: number | null;
  levelBreakdown: Record<TrainingLevel, number>;
  score: number; // 0-25
  strengths: string[];
  concerns: string[];
}

export interface AuditFindingsResult {
  totalAudits: number;
  ratingDistribution: Record<OfstedRating, number>;
  averageRating: number; // 1=inadequate, 4=outstanding
  improvementTrajectory: "improving" | "stable" | "declining" | "insufficient_data";
  totalFindings: number;
  criticalFindingsCount: number;
  totalActionsRequired: number;
  totalActionsCompleted: number;
  actionCompletionRate: number | null;
  areaBreakdown: Record<SafeguardingAuditArea, { count: number; avgRating: number }>;
  score: number; // 0-25
  strengths: string[];
  concerns: string[];
}

export interface SupervisionResult {
  totalStaff: number;
  staffWithSupervision: number;
  coverageRate: number | null;
  totalSessions: number;
  safeguardingDiscussedCount: number;
  safeguardingDiscussionRate: number | null;
  totalCasesReviewed: number;
  averageCasesPerSession: number;
  decisionsRecordedCount: number;
  decisionsRecordedRate: number | null;
  reflectivePracticeCount: number;
  reflectivePracticeRate: number | null;
  totalActionPoints: number;
  totalActionPointsCompleted: number;
  actionCompletionRate: number | null;
  score: number; // 0-25
  strengths: string[];
  concerns: string[];
}

export interface StaffSafeguardingProfile {
  staffId: string;
  staffName: string;
  trainingRecords: SafeguardingTraining[];
  highestTrainingLevel: TrainingLevel | null;
  trainingCurrent: boolean;
  trainingExpiryDate: string | null;
  supervisionRecords: SafeguardingSupervision[];
  supervisionCount: number;
  lastSupervisionDate: string | null;
  safeguardingDiscussionRate: number | null;
  actionCompletionRate: number | null;
  overallCompliance: "compliant" | "partially_compliant" | "non_compliant";
}

export interface SafeguardingEffectivenessIntelligence {
  homeId: string;
  assessedAt: string;
  periodStart: string;
  periodEnd: string;

  overallScore: number; // 0-100
  rating: OfstedRating;

  referralQuality: ReferralQualityResult;
  trainingCompliance: TrainingComplianceResult;
  auditFindings: AuditFindingsResult;
  supervision: SupervisionResult;

  staffProfiles: StaffSafeguardingProfile[];

  strengths: string[];
  concerns: string[];
  immediateActions: string[];
  regulatoryLinks: string[];
}

// ── Constants ──────────────────────────────────────────────────────────────

const TIMELY_REFERRAL_THRESHOLD_HOURS = 24;

const TRAINING_LEVEL_RANK: Record<TrainingLevel, number> = {
  basic_awareness: 1,
  level_1: 2,
  level_2: 3,
  level_3_dsl: 4,
  specialist: 5,
};

const RATING_VALUE: Record<OfstedRating, number> = {
  inadequate: 1,
  requires_improvement: 2,
  good: 3,
  outstanding: 4,
};

// ── Helpers ────────────────────────────────────────────────────────────────

function daysBetween(d1: string, d2: string): number {
  const date1 = new Date(d1);
  const date2 = new Date(d2);
  return Math.abs(date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24);
}

function isDateInRange(date: string, start: string, end: string): boolean {
  return date.slice(0, 10) >= start.slice(0, 10) && date.slice(0, 10) <= end.slice(0, 10);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// Weighted score (0–`budget`) over the rate components that are actually measured.
// weightedMeanOf drops the unmeasured (null) rates and renormalises the remaining
// weights, so an unmeasured dimension neither adds nor removes marks: silence is
// scored as neither a pass (the old safePercent === 100 bug) nor a failure. Reached
// only once a layer's empty-population guard has passed — i.e. with its coverage /
// timeliness anchor measured — so the null fallback below is defensive.
function weightedScore(
  components: { rate: number | null; weight: number }[],
  budget: number,
): number {
  const mean = weightedMeanOf(components.map((c) => ({ score: c.rate, weight: c.weight })));
  return mean === null ? 0 : (mean / 100) * budget;
}

// ── Core Function 1: Evaluate Referral Quality ────────────────────────────

export function evaluateReferralQuality(
  referrals: SafeguardingReferral[],
): ReferralQualityResult {
  const totalReferrals = referrals.length;

  if (totalReferrals === 0) {
    // Nothing referred means nothing to rate: every rate is unmeasured (null), not a
    // fabricated 100%. The score stays 25 as a deliberate domain call — an absence of
    // referrals is baseline-maintained, not a failing — while the rates stay honest.
    return {
      totalReferrals: 0,
      timelyReferrals: 0,
      timelinessRate: null,
      averageTimelinessHours: 0,
      appropriateThresholdCount: 0,
      appropriateThresholdRate: null,
      multiAgencyEngagedCount: 0,
      multiAgencyEngagementRate: null,
      childInformedCount: 0,
      childInformedRate: null,
      outcomeBreakdown: {
        progressed: 0, no_further_action: 0, stepped_up: 0,
        stepped_down: 0, ongoing: 0,
      },
      referralTypeBreakdown: {
        child_protection: 0, child_in_need: 0, LADO: 0, police: 0,
        prevent: 0, CSE: 0, CCE: 0, modern_slavery: 0, FGM: 0, county_lines: 0,
      },
      progressedRate: null,
      nfaRate: null,
      lessonsLearnedCount: 0,
      lessonsLearnedRate: null,
      score: 25,
      strengths: ["No safeguarding referrals in period — baseline maintained"],
      concerns: [],
    };
  }

  // Timeliness
  const timelyReferrals = referrals.filter(
    (r) => r.timelinessHours <= TIMELY_REFERRAL_THRESHOLD_HOURS,
  ).length;
  const timelinessRate = rate(timelyReferrals, totalReferrals);
  const averageTimelinessHours =
    Math.round(
      (referrals.reduce((sum, r) => sum + r.timelinessHours, 0) / totalReferrals) * 10,
    ) / 10;

  // Threshold appropriateness
  const appropriateThresholdCount = referrals.filter((r) => r.appropriateThreshold).length;
  const appropriateThresholdRate = rate(appropriateThresholdCount, totalReferrals);

  // Multi-agency engagement
  const multiAgencyEngagedCount = referrals.filter((r) => r.multiAgencyEngaged).length;
  const multiAgencyEngagementRate = rate(multiAgencyEngagedCount, totalReferrals);

  // Child informed
  const childInformedCount = referrals.filter((r) => r.childInformed).length;
  const childInformedRate = rate(childInformedCount, totalReferrals);

  // Outcome breakdown
  const outcomeBreakdown: Record<ReferralOutcome, number> = {
    progressed: 0, no_further_action: 0, stepped_up: 0,
    stepped_down: 0, ongoing: 0,
  };
  for (const r of referrals) {
    outcomeBreakdown[r.outcome]++;
  }
  const completedReferrals = referrals.filter((r) => r.outcome !== "ongoing").length;
  // Null when every referral is still ongoing — there is no completed cohort to rate.
  const progressedRate = rate(outcomeBreakdown.progressed + outcomeBreakdown.stepped_up, completedReferrals);
  const nfaRate = rate(outcomeBreakdown.no_further_action, completedReferrals);

  // Referral type breakdown
  const referralTypeBreakdown: Record<ReferralType, number> = {
    child_protection: 0, child_in_need: 0, LADO: 0, police: 0,
    prevent: 0, CSE: 0, CCE: 0, modern_slavery: 0, FGM: 0, county_lines: 0,
  };
  for (const r of referrals) {
    referralTypeBreakdown[r.referralType]++;
  }

  // Lessons learned
  const lessonsLearnedCount = referrals.filter(
    (r) => r.lessonsLearned !== undefined && r.lessonsLearned.trim().length > 0,
  ).length;
  const lessonsLearnedRate = rate(lessonsLearnedCount, totalReferrals);

  // Score (out of 25) — timeliness 7, threshold 7, multi-agency 5, child informed 3,
  // outcome quality 3. Outcome quality (low NFA = good) is unmeasured when no referral
  // has yet completed; weightedScore then rates only the measured dimensions.
  const outcomeQuality =
    nfaRate === null ? null
      : nfaRate <= 20 ? 1.0 : nfaRate <= 40 ? 0.7 : nfaRate <= 60 ? 0.4 : 0.1;
  let score = weightedScore(
    [
      { rate: timelinessRate, weight: 7 },
      { rate: appropriateThresholdRate, weight: 7 },
      { rate: multiAgencyEngagementRate, weight: 5 },
      { rate: childInformedRate, weight: 3 },
      { rate: outcomeQuality === null ? null : outcomeQuality * 100, weight: 3 },
    ],
    25,
  );
  score = clamp(Math.round(score * 10) / 10, 0, 25);

  // Insights
  const strengths: string[] = [];
  const concerns: string[] = [];

  if (meets(timelinessRate, 90)) {
    strengths.push("Excellent referral timeliness: " + timelinessRate + "% made within 24 hours");
  } else if (below(timelinessRate, 70)) {
    concerns.push("Referral timeliness at " + timelinessRate + "% — below 70% threshold. Working Together 2023 requires timely referrals");
  }

  if (meets(appropriateThresholdRate, 90)) {
    strengths.push("Strong threshold decision-making: " + appropriateThresholdRate + "% of referrals at appropriate threshold");
  } else if (below(appropriateThresholdRate, 75)) {
    concerns.push("Threshold appropriateness at " + appropriateThresholdRate + "% indicates potential training gap in threshold understanding");
  }

  if (meets(multiAgencyEngagementRate, 90)) {
    strengths.push("High multi-agency engagement rate of " + multiAgencyEngagementRate + "% demonstrates effective partnership working");
  } else if (below(multiAgencyEngagementRate, 70)) {
    concerns.push("Multi-agency engagement at " + multiAgencyEngagementRate + "% — below expectations for effective safeguarding");
  }

  if (meets(childInformedRate, 90)) {
    strengths.push("Children's voice prioritised: " + childInformedRate + "% of children informed about referrals");
  } else if (below(childInformedRate, 70)) {
    concerns.push("Child informed rate at " + childInformedRate + "% — children's participation in safeguarding processes needs improvement");
  }

  if (nfaRate !== null && nfaRate > 50) {
    concerns.push("High NFA rate (" + nfaRate + "%) may indicate over-referral or poor threshold calibration");
  }

  if (meets(lessonsLearnedRate, 80)) {
    strengths.push("Good reflective practice: lessons learned documented for " + lessonsLearnedRate + "% of referrals");
  } else if (below(lessonsLearnedRate, 50)) {
    concerns.push("Lessons learned documented for only " + lessonsLearnedRate + "% of referrals — reflective practice needs strengthening");
  }

  return {
    totalReferrals,
    timelyReferrals,
    timelinessRate,
    averageTimelinessHours,
    appropriateThresholdCount,
    appropriateThresholdRate,
    multiAgencyEngagedCount,
    multiAgencyEngagementRate,
    childInformedCount,
    childInformedRate,
    outcomeBreakdown,
    referralTypeBreakdown,
    progressedRate,
    nfaRate,
    lessonsLearnedCount,
    lessonsLearnedRate,
    score,
    strengths,
    concerns,
  };
}

// ── Core Function 2: Evaluate Training Compliance ─────────────────────────

export function evaluateTrainingCompliance(
  training: SafeguardingTraining[],
  staffIds: string[],
  referenceDate: string,
): TrainingComplianceResult {
  const totalStaff = staffIds.length;

  if (totalStaff === 0) {
    // No staff to assess: coverage/currency/etc. are unmeasured (null), not 100%.
    // Score stays 0 — a home with no identified staff cannot evidence compliance.
    return {
      totalStaff: 0,
      staffWithCurrentTraining: 0,
      coverageRate: null,
      totalTrainingRecords: training.length,
      currentTrainingRecords: 0,
      currencyRate: null,
      dslCount: 0,
      dslRequired: 1,
      dslCoverageRate: null,
      scenarioBasedCount: 0,
      scenarioBasedRate: null,
      assessmentPassCount: 0,
      assessmentPassRate: null,
      completedOnTimeCount: 0,
      completedOnTimeRate: null,
      levelBreakdown: {
        basic_awareness: 0, level_1: 0, level_2: 0,
        level_3_dsl: 0, specialist: 0,
      },
      score: 0,
      strengths: [],
      concerns: ["No staff members identified for training compliance assessment"],
    };
  }

  // Current training: not expired as of referenceDate
  const currentTrainingRecords = training.filter(
    (t) => t.expiryDate >= referenceDate,
  );
  const totalTrainingRecords = training.length;
  // Null when there are no training records to rate for currency.
  const currencyRate = rate(currentTrainingRecords.length, totalTrainingRecords);

  // Staff coverage: each staff member has at least one current training
  const staffWithTrainingSet = new Set<string>();
  for (const t of currentTrainingRecords) {
    if (staffIds.includes(t.staffId)) {
      staffWithTrainingSet.add(t.staffId);
    }
  }
  const staffWithCurrentTraining = staffWithTrainingSet.size;
  const coverageRate = rate(staffWithCurrentTraining, totalStaff);

  // DSL coverage: at least one staff member with level_3_dsl current
  const currentDslRecords = currentTrainingRecords.filter(
    (t) => t.trainingLevel === "level_3_dsl" && staffIds.includes(t.staffId),
  );
  const dslStaffSet = new Set<string>();
  for (const t of currentDslRecords) {
    dslStaffSet.add(t.staffId);
  }
  const dslCount = dslStaffSet.size;
  const dslRequired = Math.max(1, Math.ceil(totalStaff / 4));
  const dslCoverageRate = rate(dslCount, dslRequired);

  // Scenario-based training (null when there are no records to rate)
  const scenarioBasedCount = training.filter((t) => t.scenarioBasedElement).length;
  const scenarioBasedRate = rate(scenarioBasedCount, totalTrainingRecords);

  // Assessment pass rate
  const assessmentPassCount = training.filter((t) => t.assessmentPassed).length;
  const assessmentPassRate = rate(assessmentPassCount, totalTrainingRecords);

  // Completed on time
  const completedOnTimeCount = training.filter((t) => t.completedOnTime).length;
  const completedOnTimeRate = rate(completedOnTimeCount, totalTrainingRecords);

  // Level breakdown
  const levelBreakdown: Record<TrainingLevel, number> = {
    basic_awareness: 0, level_1: 0, level_2: 0,
    level_3_dsl: 0, specialist: 0,
  };
  for (const t of training) {
    levelBreakdown[t.trainingLevel]++;
  }

  // Score (out of 25) — coverage 8, currency 5, DSL 4, scenario 4, assessment 4.
  // Rates with no records to measure (currency/scenario/assessment when the register
  // is empty) are excluded by weightedScore rather than counted as pass or fail.
  let score = weightedScore(
    [
      { rate: coverageRate, weight: 8 },
      { rate: currencyRate, weight: 5 },
      { rate: dslCoverageRate === null ? null : Math.min(dslCoverageRate, 100), weight: 4 },
      { rate: scenarioBasedRate, weight: 4 },
      { rate: assessmentPassRate, weight: 4 },
    ],
    25,
  );
  score = clamp(Math.round(score * 10) / 10, 0, 25);

  // Insights
  const strengths: string[] = [];
  const concerns: string[] = [];

  if (coverageRate === 100) {
    strengths.push("100% staff safeguarding training coverage — all staff have current training");
  } else if (below(coverageRate, 80)) {
    concerns.push("Training coverage at " + coverageRate + "% — " + (totalStaff - staffWithCurrentTraining) + " staff member(s) lack current safeguarding training");
  }

  if (meets(currencyRate, 95)) {
    strengths.push("Excellent training currency: " + currencyRate + "% of all training records current");
  } else if (below(currencyRate, 80)) {
    concerns.push("Training currency at " + currencyRate + "% — expired training records need renewal");
  }

  if (meets(dslCoverageRate, 100)) {
    strengths.push("Designated Safeguarding Lead coverage meets requirements (" + dslCount + " DSL-trained staff)");
  } else if (below(dslCoverageRate, 100)) {
    concerns.push("DSL coverage below requirement: " + dslCount + " of " + dslRequired + " required DSL-trained staff");
  }

  if (meets(scenarioBasedRate, 80)) {
    strengths.push("Strong use of scenario-based training (" + scenarioBasedRate + "%) supports practical application of safeguarding knowledge");
  } else if (below(scenarioBasedRate, 50)) {
    concerns.push("Only " + scenarioBasedRate + "% of training includes scenario-based elements — KCSIE 2024 emphasises practical training");
  }

  if (meets(assessmentPassRate, 95)) {
    strengths.push("High assessment pass rate (" + assessmentPassRate + "%) confirms staff understanding of safeguarding procedures");
  } else if (below(assessmentPassRate, 80)) {
    concerns.push("Assessment pass rate at " + assessmentPassRate + "% — some staff may not fully understand safeguarding procedures");
  }

  return {
    totalStaff,
    staffWithCurrentTraining,
    coverageRate,
    totalTrainingRecords,
    currentTrainingRecords: currentTrainingRecords.length,
    currencyRate,
    dslCount,
    dslRequired,
    dslCoverageRate,
    scenarioBasedCount,
    scenarioBasedRate,
    assessmentPassCount,
    assessmentPassRate,
    completedOnTimeCount,
    completedOnTimeRate,
    levelBreakdown,
    score,
    strengths,
    concerns,
  };
}

// ── Core Function 3: Evaluate Audit Findings ──────────────────────────────

export function evaluateAuditFindings(
  audits: SafeguardingAudit[],
): AuditFindingsResult {
  const totalAudits = audits.length;

  if (totalAudits === 0) {
    return {
      totalAudits: 0,
      ratingDistribution: { outstanding: 0, good: 0, requires_improvement: 0, inadequate: 0 },
      averageRating: 0,
      improvementTrajectory: "insufficient_data",
      totalFindings: 0,
      criticalFindingsCount: 0,
      totalActionsRequired: 0,
      totalActionsCompleted: 0,
      actionCompletionRate: null,
      areaBreakdown: {
        policy: { count: 0, avgRating: 0 },
        procedures: { count: 0, avgRating: 0 },
        training: { count: 0, avgRating: 0 },
        recording: { count: 0, avgRating: 0 },
        information_sharing: { count: 0, avgRating: 0 },
        supervision: { count: 0, avgRating: 0 },
        culture: { count: 0, avgRating: 0 },
        multi_agency: { count: 0, avgRating: 0 },
      },
      score: 0,
      strengths: [],
      concerns: ["No safeguarding audits completed — Reg 34 requires regular quality review"],
    };
  }

  // Rating distribution
  const ratingDistribution: Record<OfstedRating, number> = {
    outstanding: 0, good: 0, requires_improvement: 0, inadequate: 0,
  };
  for (const a of audits) {
    ratingDistribution[a.rating]++;
  }

  // Average rating
  const ratingSum = audits.reduce((sum, a) => sum + RATING_VALUE[a.rating], 0);
  const averageRating = Math.round((ratingSum / totalAudits) * 10) / 10;

  // Improvement trajectory
  const sortedAudits = [...audits].sort(
    (a, b) => a.auditDate.localeCompare(b.auditDate),
  );
  let improvementTrajectory: AuditFindingsResult["improvementTrajectory"] = "insufficient_data";
  const auditsWithPrevious = sortedAudits.filter((a) => a.previousRating !== undefined);
  if (auditsWithPrevious.length >= 2) {
    let improvements = 0;
    let declines = 0;
    for (const a of auditsWithPrevious) {
      const currentVal = RATING_VALUE[a.rating];
      const previousVal = RATING_VALUE[a.previousRating!];
      if (currentVal > previousVal) improvements++;
      else if (currentVal < previousVal) declines++;
    }
    if (improvements > declines) improvementTrajectory = "improving";
    else if (declines > improvements) improvementTrajectory = "declining";
    else improvementTrajectory = "stable";
  } else if (auditsWithPrevious.length === 1) {
    const a = auditsWithPrevious[0];
    const currentVal = RATING_VALUE[a.rating];
    const previousVal = RATING_VALUE[a.previousRating!];
    if (currentVal > previousVal) improvementTrajectory = "improving";
    else if (currentVal < previousVal) improvementTrajectory = "declining";
    else improvementTrajectory = "stable";
  }

  // Findings
  const totalFindings = audits.reduce((sum, a) => sum + a.findingsCount, 0);
  const criticalFindingsCount = audits.reduce((sum, a) => sum + a.criticalFindings, 0);

  // Action completion
  const totalActionsRequired = audits.reduce((sum, a) => sum + a.actionsRequired.length, 0);
  const totalActionsCompleted = audits.reduce((sum, a) => sum + a.actionsCompleted, 0);
  // Null when the audits raised no actions — there is nothing to complete to rate.
  const actionCompletionRate = rate(totalActionsCompleted, totalActionsRequired);

  // Area breakdown
  const areas: SafeguardingAuditArea[] = [
    "policy", "procedures", "training", "recording",
    "information_sharing", "supervision", "culture", "multi_agency",
  ];
  const areaBreakdown: Record<SafeguardingAuditArea, { count: number; avgRating: number }> = {} as any;
  for (const area of areas) {
    const areaAudits = audits.filter((a) => a.area === area);
    const count = areaAudits.length;
    const avgRating = count > 0
      ? Math.round((areaAudits.reduce((sum, a) => sum + RATING_VALUE[a.rating], 0) / count) * 10) / 10
      : 0;
    areaBreakdown[area] = { count, avgRating };
  }

  // Score (out of 25)
  let score = 0;
  // Average rating: max 10 (4.0 = 10, 3.0 = 7.5, 2.0 = 5, 1.0 = 2.5)
  score += (averageRating / 4) * 10;
  // Action completion: max 6. Not scored when the audits raised no actions —
  // silence is left unmeasured rather than counted as full (old bug) or zero marks.
  if (actionCompletionRate !== null) {
    score += (actionCompletionRate / 100) * 6;
  }
  // Improvement trajectory: max 5
  if (improvementTrajectory === "improving") score += 5;
  else if (improvementTrajectory === "stable") score += 3;
  else if (improvementTrajectory === "declining") score += 1;
  else score += 2; // insufficient_data gets moderate
  // Critical findings penalty: max -4
  if (criticalFindingsCount > 0) {
    score -= Math.min(4, criticalFindingsCount * 1.5);
  }
  // Low rating penalty
  if (ratingDistribution.inadequate > 0) {
    score -= ratingDistribution.inadequate * 2;
  }
  // Coverage breadth bonus: max 4
  const areasAudited = areas.filter((area) => areaBreakdown[area].count > 0).length;
  score += (areasAudited / areas.length) * 4;

  score = clamp(Math.round(score * 10) / 10, 0, 25);

  // Insights
  const strengths: string[] = [];
  const concerns: string[] = [];

  if (averageRating >= 3.5) {
    strengths.push("Audit programme average rating of " + averageRating + "/4.0 indicates strong safeguarding practice");
  } else if (averageRating < 2.5) {
    concerns.push("Average audit rating of " + averageRating + "/4.0 indicates systemic safeguarding weaknesses");
  }

  if (improvementTrajectory === "improving") {
    strengths.push("Positive improvement trajectory across safeguarding audits");
  } else if (improvementTrajectory === "declining") {
    concerns.push("Declining audit ratings indicate deteriorating safeguarding practice");
  }

  if (meets(actionCompletionRate, 90)) {
    strengths.push("Strong audit action completion rate of " + actionCompletionRate + "%");
  } else if (below(actionCompletionRate, 70)) {
    concerns.push("Audit action completion at " + actionCompletionRate + "% — outstanding actions create safeguarding risk");
  }

  if (criticalFindingsCount > 0) {
    concerns.push(criticalFindingsCount + " critical finding(s) identified across audits requiring urgent attention");
  }

  if (ratingDistribution.inadequate > 0) {
    concerns.push(ratingDistribution.inadequate + " audit area(s) rated inadequate — immediate improvement plan required");
  }

  if (areasAudited >= 6) {
    strengths.push("Comprehensive audit coverage across " + areasAudited + " of 8 safeguarding areas");
  } else if (areasAudited < 4) {
    concerns.push("Only " + areasAudited + " of 8 safeguarding areas audited — broader audit programme needed");
  }

  return {
    totalAudits,
    ratingDistribution,
    averageRating,
    improvementTrajectory,
    totalFindings,
    criticalFindingsCount,
    totalActionsRequired,
    totalActionsCompleted,
    actionCompletionRate,
    areaBreakdown,
    score,
    strengths,
    concerns,
  };
}

// ── Core Function 4: Evaluate Safeguarding Supervision ────────────────────

export function evaluateSafeguardingSupervision(
  supervision: SafeguardingSupervision[],
  staffIds: string[],
  periodStart: string,
  periodEnd: string,
): SupervisionResult {
  const totalStaff = staffIds.length;

  // Filter supervision records to the period
  const periodSupervision = supervision.filter(
    (s) => isDateInRange(s.date, periodStart, periodEnd) && staffIds.includes(s.staffId),
  );

  if (totalStaff === 0) {
    // No staff to assess: every supervision rate is unmeasured (null), not 100%.
    return {
      totalStaff: 0,
      staffWithSupervision: 0,
      coverageRate: null,
      totalSessions: 0,
      safeguardingDiscussedCount: 0,
      safeguardingDiscussionRate: null,
      totalCasesReviewed: 0,
      averageCasesPerSession: 0,
      decisionsRecordedCount: 0,
      decisionsRecordedRate: null,
      reflectivePracticeCount: 0,
      reflectivePracticeRate: null,
      totalActionPoints: 0,
      totalActionPointsCompleted: 0,
      actionCompletionRate: null,
      score: 0,
      strengths: [],
      concerns: ["No staff members identified for supervision assessment"],
    };
  }

  const totalSessions = periodSupervision.length;

  // Coverage
  const staffWithSupervisionSet = new Set<string>();
  for (const s of periodSupervision) {
    staffWithSupervisionSet.add(s.staffId);
  }
  const staffWithSupervision = staffWithSupervisionSet.size;
  const coverageRate = rate(staffWithSupervision, totalStaff);

  // Safeguarding discussion rate (null when no sessions were held in the period)
  const safeguardingDiscussedCount = periodSupervision.filter(
    (s) => s.safeguardingDiscussed,
  ).length;
  const safeguardingDiscussionRate = rate(safeguardingDiscussedCount, totalSessions);

  // Cases reviewed
  const totalCasesReviewed = periodSupervision.reduce(
    (sum, s) => sum + s.casesReviewed, 0,
  );
  const averageCasesPerSession = totalSessions > 0
    ? Math.round((totalCasesReviewed / totalSessions) * 10) / 10
    : 0;

  // Decisions recorded
  const decisionsRecordedCount = periodSupervision.filter(
    (s) => s.decisionsRecorded,
  ).length;
  const decisionsRecordedRate = rate(decisionsRecordedCount, totalSessions);

  // Reflective practice
  const reflectivePracticeCount = periodSupervision.filter(
    (s) => s.reflectivePractice,
  ).length;
  const reflectivePracticeRate = rate(reflectivePracticeCount, totalSessions);

  // Action completion
  const totalActionPoints = periodSupervision.reduce(
    (sum, s) => sum + s.actionPoints, 0,
  );
  const totalActionPointsCompleted = periodSupervision.reduce(
    (sum, s) => sum + s.actionPointsCompleted, 0,
  );
  const actionCompletionRate = rate(totalActionPointsCompleted, totalActionPoints);

  // Score (out of 25) — coverage 8, safeguarding discussion 6, reflective 4,
  // decisions 4, action completion 3. Rates with no sessions / no action points to
  // measure are excluded by weightedScore rather than treated as pass or fail.
  let score = weightedScore(
    [
      { rate: coverageRate, weight: 8 },
      { rate: safeguardingDiscussionRate, weight: 6 },
      { rate: reflectivePracticeRate, weight: 4 },
      { rate: decisionsRecordedRate, weight: 4 },
      { rate: actionCompletionRate, weight: 3 },
    ],
    25,
  );
  score = clamp(Math.round(score * 10) / 10, 0, 25);

  // Insights
  const strengths: string[] = [];
  const concerns: string[] = [];

  if (coverageRate === 100) {
    strengths.push("100% supervision coverage — all staff received safeguarding supervision in period");
  } else if (below(coverageRate, 80)) {
    concerns.push("Supervision coverage at " + coverageRate + "% — " + (totalStaff - staffWithSupervision) + " staff member(s) without supervision");
  }

  if (meets(safeguardingDiscussionRate, 90)) {
    strengths.push("Safeguarding discussed in " + safeguardingDiscussionRate + "% of supervision sessions");
  } else if (below(safeguardingDiscussionRate, 70)) {
    concerns.push("Safeguarding discussed in only " + safeguardingDiscussionRate + "% of sessions — must be a standing agenda item");
  }

  if (meets(reflectivePracticeRate, 80)) {
    strengths.push("Strong reflective practice: " + reflectivePracticeRate + "% of sessions include reflective elements");
  } else if (below(reflectivePracticeRate, 50)) {
    concerns.push("Reflective practice in only " + reflectivePracticeRate + "% of sessions — important for continuous learning");
  }

  if (meets(decisionsRecordedRate, 90)) {
    strengths.push("Decisions consistently recorded (" + decisionsRecordedRate + "%) providing clear audit trail");
  } else if (below(decisionsRecordedRate, 70)) {
    concerns.push("Decision recording at " + decisionsRecordedRate + "% — gaps in recording undermine accountability");
  }

  if (meets(actionCompletionRate, 90)) {
    strengths.push("Excellent supervision action completion rate of " + actionCompletionRate + "%");
  } else if (below(actionCompletionRate, 70)) {
    concerns.push("Supervision action completion at " + actionCompletionRate + "% — outstanding actions may compromise safeguarding");
  }

  return {
    totalStaff,
    staffWithSupervision,
    coverageRate,
    totalSessions,
    safeguardingDiscussedCount,
    safeguardingDiscussionRate,
    totalCasesReviewed,
    averageCasesPerSession,
    decisionsRecordedCount,
    decisionsRecordedRate,
    reflectivePracticeCount,
    reflectivePracticeRate,
    totalActionPoints,
    totalActionPointsCompleted,
    actionCompletionRate,
    score,
    strengths,
    concerns,
  };
}

// ── Core Function 5: Build Staff Safeguarding Profiles ────────────────────

export function buildStaffSafeguardingProfiles(
  training: SafeguardingTraining[],
  supervision: SafeguardingSupervision[],
  staffIds: string[],
): StaffSafeguardingProfile[] {
  return staffIds.map((staffId) => {
    const staffTraining = training.filter((t) => t.staffId === staffId);
    const staffSupervision = supervision.filter((s) => s.staffId === staffId);

    // Determine staff name from records
    const staffName =
      staffTraining[0]?.staffName ??
      staffSupervision[0]?.staffName ??
      staffId;

    // Highest training level
    let highestTrainingLevel: TrainingLevel | null = null;
    let highestRank = 0;
    for (const t of staffTraining) {
      const rank = TRAINING_LEVEL_RANK[t.trainingLevel];
      if (rank > highestRank) {
        highestRank = rank;
        highestTrainingLevel = t.trainingLevel;
      }
    }

    // Training currency: is latest training record not expired?
    const sortedTraining = [...staffTraining].sort(
      (a, b) => b.expiryDate.localeCompare(a.expiryDate),
    );
    const latestExpiry = sortedTraining[0]?.expiryDate ?? null;
    const trainingCurrent = latestExpiry !== null && latestExpiry >= new Date().toISOString().slice(0, 10);

    // Supervision stats
    const supervisionCount = staffSupervision.length;
    const sortedSupervision = [...staffSupervision].sort(
      (a, b) => b.date.localeCompare(a.date),
    );
    const lastSupervisionDate = sortedSupervision[0]?.date ?? null;

    const sgDiscussed = staffSupervision.filter((s) => s.safeguardingDiscussed).length;
    // Null when the staff member has no supervision / no action points on record.
    const safeguardingDiscussionRate = rate(sgDiscussed, supervisionCount);

    const totalAp = staffSupervision.reduce((sum, s) => sum + s.actionPoints, 0);
    const completedAp = staffSupervision.reduce((sum, s) => sum + s.actionPointsCompleted, 0);
    const actionCompletionRate = rate(completedAp, totalAp);

    // Overall compliance — an unmeasured rate is never treated as meeting the bar.
    let overallCompliance: StaffSafeguardingProfile["overallCompliance"];
    const hasCurrentTraining = trainingCurrent;
    const hasRecentSupervision = supervisionCount > 0;
    const goodDiscussionRate = meets(safeguardingDiscussionRate, 80);
    const goodActionRate = meets(actionCompletionRate, 70);

    if (hasCurrentTraining && hasRecentSupervision && goodDiscussionRate && goodActionRate) {
      overallCompliance = "compliant";
    } else if (hasCurrentTraining || hasRecentSupervision) {
      overallCompliance = "partially_compliant";
    } else {
      overallCompliance = "non_compliant";
    }

    return {
      staffId,
      staffName,
      trainingRecords: staffTraining,
      highestTrainingLevel,
      trainingCurrent,
      trainingExpiryDate: latestExpiry,
      supervisionRecords: staffSupervision,
      supervisionCount,
      lastSupervisionDate,
      safeguardingDiscussionRate,
      actionCompletionRate,
      overallCompliance,
    };
  });
}

// ── Core Function 6: Generate Safeguarding Effectiveness Intelligence ─────

export function generateSafeguardingEffectivenessIntelligence(
  referrals: SafeguardingReferral[],
  training: SafeguardingTraining[],
  audits: SafeguardingAudit[],
  supervision: SafeguardingSupervision[],
  staffIds: string[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
  referenceDate: string,
): SafeguardingEffectivenessIntelligence {
  const assessedAt = new Date().toISOString();

  // Filter referrals and audits to period
  const periodReferrals = referrals.filter(
    (r) => isDateInRange(r.referralDate, periodStart, periodEnd),
  );
  const periodAudits = audits.filter(
    (a) => isDateInRange(a.auditDate, periodStart, periodEnd),
  );

  // Evaluate each layer
  const referralQuality = evaluateReferralQuality(periodReferrals);
  const trainingCompliance = evaluateTrainingCompliance(training, staffIds, referenceDate);
  const auditFindingsResult = evaluateAuditFindings(periodAudits);
  const supervisionResult = evaluateSafeguardingSupervision(supervision, staffIds, periodStart, periodEnd);

  // Build staff profiles
  const staffProfiles = buildStaffSafeguardingProfiles(training, supervision, staffIds);

  // Overall score (100 points)
  const overallScore = clamp(
    Math.round(
      referralQuality.score +
      trainingCompliance.score +
      auditFindingsResult.score +
      supervisionResult.score,
    ),
    0,
    100,
  );

  const rating = getOverallRating(overallScore);

  // Aggregate insights
  const strengths = aggregateStrengths(
    referralQuality, trainingCompliance, auditFindingsResult, supervisionResult, overallScore,
  );
  const concerns = aggregateConcerns(
    referralQuality, trainingCompliance, auditFindingsResult, supervisionResult, overallScore,
  );
  const immediateActions = generateImmediateActions(
    referralQuality, trainingCompliance, auditFindingsResult, supervisionResult, staffProfiles,
  );
  const regulatoryLinks = generateRegulatoryLinks(
    referralQuality, trainingCompliance, auditFindingsResult, supervisionResult,
  );

  return {
    homeId,
    assessedAt,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    referralQuality,
    trainingCompliance,
    auditFindings: auditFindingsResult,
    supervision: supervisionResult,
    staffProfiles,
    strengths,
    concerns,
    immediateActions,
    regulatoryLinks,
  };
}

// ── Rating ─────────────────────────────────────────────────────────────────

function getOverallRating(score: number): OfstedRating {
  if (score >= 85) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "requires_improvement";
  return "inadequate";
}

// ── Aggregate Strengths ───────────────────────────────────────────────────

function aggregateStrengths(
  referral: ReferralQualityResult,
  training: TrainingComplianceResult,
  audit: AuditFindingsResult,
  supervision: SupervisionResult,
  overallScore: number,
): string[] {
  const strengths: string[] = [];

  if (overallScore >= 85) {
    strengths.push("Overall safeguarding effectiveness rated Outstanding (" + overallScore + "/100)");
  } else if (overallScore >= 65) {
    strengths.push("Overall safeguarding effectiveness rated Good (" + overallScore + "/100)");
  }

  // Pick top strengths from each area (max 2 per area)
  strengths.push(...referral.strengths.slice(0, 2));
  strengths.push(...training.strengths.slice(0, 2));
  strengths.push(...audit.strengths.slice(0, 2));
  strengths.push(...supervision.strengths.slice(0, 2));

  return strengths;
}

// ── Aggregate Concerns ────────────────────────────────────────────────────

function aggregateConcerns(
  referral: ReferralQualityResult,
  training: TrainingComplianceResult,
  audit: AuditFindingsResult,
  supervision: SupervisionResult,
  overallScore: number,
): string[] {
  const concerns: string[] = [];

  if (overallScore < 45) {
    concerns.push("Overall safeguarding effectiveness rated Inadequate (" + overallScore + "/100) — urgent systemic review required");
  } else if (overallScore < 65) {
    concerns.push("Overall safeguarding effectiveness Requires Improvement (" + overallScore + "/100)");
  }

  concerns.push(...referral.concerns);
  concerns.push(...training.concerns);
  concerns.push(...audit.concerns);
  concerns.push(...supervision.concerns);

  return concerns;
}

// ── Immediate Actions ─────────────────────────────────────────────────────

function generateImmediateActions(
  referral: ReferralQualityResult,
  training: TrainingComplianceResult,
  audit: AuditFindingsResult,
  supervision: SupervisionResult,
  staffProfiles: StaffSafeguardingProfile[],
): string[] {
  const actions: string[] = [];

  // Non-compliant staff
  const nonCompliant = staffProfiles.filter((p) => p.overallCompliance === "non_compliant");
  if (nonCompliant.length > 0) {
    actions.push(
      "IMMEDIATE: " + nonCompliant.length + " staff member(s) non-compliant with safeguarding requirements — arrange training and supervision within 5 working days",
    );
  }

  // Critical audit findings
  if (audit.criticalFindingsCount > 0) {
    actions.push(
      "URGENT: " + audit.criticalFindingsCount + " critical audit finding(s) outstanding — develop remediation plan within 48 hours",
    );
  }

  // Low training coverage
  if (below(training.coverageRate, 80)) {
    actions.push(
      "HIGH: Training coverage at " + training.coverageRate + "% — schedule safeguarding training for all untrained staff immediately",
    );
  }

  // DSL gap
  if (below(training.dslCoverageRate, 100)) {
    actions.push(
      "HIGH: Insufficient DSL-trained staff (" + training.dslCount + " of " + training.dslRequired + " required) — arrange Level 3 DSL training",
    );
  }

  // Low supervision coverage
  if (below(supervision.coverageRate, 80)) {
    actions.push(
      "HIGH: Supervision coverage at " + supervision.coverageRate + "% — schedule safeguarding supervision for uncovered staff",
    );
  }

  // Referral timeliness
  if (below(referral.timelinessRate, 70)) {
    actions.push(
      "MEDIUM: Referral timeliness at " + referral.timelinessRate + "% — review referral procedures and ensure staff understand urgency",
    );
  }

  // Audit action completion
  if (below(audit.actionCompletionRate, 70)) {
    actions.push(
      "MEDIUM: Audit action completion at " + audit.actionCompletionRate + "% — allocate resource to address outstanding actions",
    );
  }

  // Inadequate audit ratings
  if (audit.ratingDistribution.inadequate > 0) {
    actions.push(
      "URGENT: " + audit.ratingDistribution.inadequate + " audit area(s) rated inadequate — prepare immediate improvement plan per Reg 13",
    );
  }

  if (actions.length === 0) {
    actions.push("No immediate actions required. Safeguarding systems operating within expected standards.");
  }

  return actions;
}

// ── Regulatory Links ──────────────────────────────────────────────────────

function generateRegulatoryLinks(
  referral: ReferralQualityResult,
  training: TrainingComplianceResult,
  audit: AuditFindingsResult,
  supervision: SupervisionResult,
): string[] {
  const links = new Set<string>();

  // Always present
  links.add("CHR 2015, Reg 12 — Protection of children: effective safeguarding arrangements");
  links.add("SCCIF: How well children are helped and protected");

  // Referral quality links
  if (referral.totalReferrals > 0) {
    links.add("Working Together 2023 — Multi-agency safeguarding arrangements and referral pathways");
  }
  if (below(referral.multiAgencyEngagementRate, 90)) {
    links.add("Working Together 2023 — Duty to cooperate with multi-agency partners");
  }

  // Training links
  if (below(training.coverageRate, 100) || below(training.currencyRate, 100)) {
    links.add("CHR 2015, Reg 33 — Fitness of workers: ongoing training requirement");
    links.add("KCSIE 2024 — All staff should receive regular safeguarding training");
  }
  if (below(training.dslCoverageRate, 100)) {
    links.add("KCSIE 2024 — Designated Safeguarding Lead: role, training and responsibilities");
  }

  // Audit links
  if (audit.totalAudits > 0) {
    links.add("CHR 2015, Reg 34 — Review of quality of care provision");
  }
  if (audit.criticalFindingsCount > 0) {
    links.add("CHR 2015, Reg 13 — Leadership and management: acting on identified shortfalls");
  }

  // Supervision links
  if (below(supervision.coverageRate, 100) || below(supervision.safeguardingDiscussionRate, 90)) {
    links.add("CHR 2015, Reg 33(4)(b) — Supervision of staff: safeguarding as standing item");
  }

  // Child voice
  if (below(referral.childInformedRate, 80)) {
    links.add("CHR 2015, Reg 7 — Children's views, wishes and feelings");
  }

  return [...links];
}

// ── Utility: Labels ────────────────────────────────────────────────────────

export function getReferralTypeLabel(type: ReferralType): string {
  const labels: Record<ReferralType, string> = {
    child_protection: "Child Protection (S47)",
    child_in_need: "Child in Need (S17)",
    LADO: "LADO Referral",
    police: "Police Referral",
    prevent: "Prevent Referral",
    CSE: "Child Sexual Exploitation",
    CCE: "Child Criminal Exploitation",
    modern_slavery: "Modern Slavery / Trafficking",
    FGM: "FGM",
    county_lines: "County Lines",
  };
  return labels[type];
}

export function getReferralOutcomeLabel(outcome: ReferralOutcome): string {
  const labels: Record<ReferralOutcome, string> = {
    progressed: "Progressed",
    no_further_action: "No Further Action",
    stepped_up: "Stepped Up",
    stepped_down: "Stepped Down",
    ongoing: "Ongoing",
  };
  return labels[outcome];
}

export function getTrainingLevelLabel(level: TrainingLevel): string {
  const labels: Record<TrainingLevel, string> = {
    basic_awareness: "Basic Awareness",
    level_1: "Level 1",
    level_2: "Level 2",
    level_3_dsl: "Level 3 — DSL",
    specialist: "Specialist",
  };
  return labels[level];
}

export function getAuditAreaLabel(area: SafeguardingAuditArea): string {
  const labels: Record<SafeguardingAuditArea, string> = {
    policy: "Policy",
    procedures: "Procedures",
    training: "Training",
    recording: "Recording",
    information_sharing: "Information Sharing",
    supervision: "Supervision",
    culture: "Culture",
    multi_agency: "Multi-Agency Working",
  };
  return labels[area];
}

export function getOfstedRatingLabel(rating: OfstedRating): string {
  const labels: Record<OfstedRating, string> = {
    outstanding: "Outstanding",
    good: "Good",
    requires_improvement: "Requires Improvement",
    inadequate: "Inadequate",
  };
  return labels[rating];
}
