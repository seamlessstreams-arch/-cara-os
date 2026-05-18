// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Outcomes Measurement — Intelligence Engine
//
// Pure deterministic engine. No AI, no external calls, no side-effects.
//
// "Is Oak House making a measurable positive difference for children?"
//
// Regulatory framework:
//   SCCIF                — Overall effectiveness: "children are making
//                           progress from their starting points"
//   CHR 2015 Reg 6       — Quality of care standard
//   CHR 2015 Reg 9       — Individualised care: "the care provided to
//                           children is informed by an assessment of their
//                           needs, wishes and feelings"
//   CHR 2015 Reg 14      — Care planning standard
//   DfE Guide to CHR     — "The home should be able to demonstrate that
//                           children are benefiting from their time there"
//
// Domains measured:
//   1. Education
//   2. Health
//   3. Emotional wellbeing
//   4. Behaviour
//   5. Relationships
//   6. Independence
//   7. Identity
//   8. Safety
//
// Scoring breakdown (0-100):
//   Progress from baseline:   30 — Are children improving from their starting points?
//   Target achievement:       25 — Are targets being met on time?
//   Outcome planning:         20 — Are plans comprehensive, current, child-involved?
//   Measurement quality:      25 — Coverage, diversity, regularity, child voice?
//
// Rating thresholds:
//   >= 80 outstanding
//   >= 60 good
//   >= 40 requires_improvement
//   <  40 inadequate
//
// No AI. No external calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ──────────────────────────────────────────────────────────────────

export type OutcomeDomain =
  | "education"
  | "health"
  | "emotional_wellbeing"
  | "behaviour"
  | "relationships"
  | "independence"
  | "identity"
  | "safety";

export type MeasurementMethod =
  | "standardised_tool"
  | "professional_assessment"
  | "self_report"
  | "observation"
  | "milestone_tracking";

export type ProgressStatus =
  | "significant_progress"
  | "good_progress"
  | "some_progress"
  | "no_change"
  | "regression";

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface OutcomeBaseline {
  id: string;
  homeId: string;
  childId: string;
  childName: string;
  domain: OutcomeDomain;
  baselineDate: string;       // ISO date
  baselineScore: number;      // 1-10
  method: MeasurementMethod;
  assessedBy: string;
  context: string;
}

export interface OutcomeMeasurement {
  id: string;
  homeId: string;
  childId: string;
  childName: string;
  domain: OutcomeDomain;
  measurementDate: string;    // ISO date
  score: number;              // 1-10
  method: MeasurementMethod;
  assessedBy: string;
  previousScore?: number;
  targetScore?: number;
  childView?: string;
  evidenceBase: string[];
}

export interface OutcomeTarget {
  id: string;
  homeId: string;
  childId: string;
  childName: string;
  domain: OutcomeDomain;
  targetDescription: string;
  targetScore: number;
  targetDate: string;         // ISO date
  currentScore: number;
  createdDate: string;
  status: "on_track" | "at_risk" | "achieved" | "not_achieved" | "reviewed";
  reviewDate: string;
}

export interface ChildOutcomePlan {
  id: string;
  homeId: string;
  childId: string;
  childName: string;
  planDate: string;           // ISO date
  reviewDate: string;
  nextReviewDate: string;
  primaryGoals: string[];
  secondaryGoals: string[];
  childInvolved: boolean;
  familyInvolved: boolean;
  professionalInvolved: boolean;
  measurableIndicators: string[];
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface DomainProgress {
  domain: OutcomeDomain;
  domainLabel: string;
  childCount: number;
  averageBaselineScore: number;
  averageCurrentScore: number;
  averageChange: number;
  progressStatus: ProgressStatus;
  childrenProgressing: number;
  childrenRegressing: number;
  childrenNoChange: number;
}

export interface ProgressFromBaselineResult {
  totalChildren: number;
  domainsAssessed: number;
  domainProgress: DomainProgress[];
  overallAverageChange: number;
  overallImprovementRate: number;      // % of children improving in at least 1 domain
  regressionAlerts: {
    childId: string;
    childName: string;
    domain: OutcomeDomain;
    domainLabel: string;
    baselineScore: number;
    currentScore: number;
    change: number;
  }[];
  progressDistribution: Record<ProgressStatus, number>;
}

export interface TargetAchievementResult {
  totalTargets: number;
  achievedCount: number;
  onTrackCount: number;
  atRiskCount: number;
  notAchievedCount: number;
  reviewedCount: number;
  achievedRate: number;
  onTrackRate: number;
  atRiskRate: number;
  domainAchievement: {
    domain: OutcomeDomain;
    domainLabel: string;
    total: number;
    achieved: number;
    onTrack: number;
    atRisk: number;
    achievementRate: number;
  }[];
  atRiskDetails: {
    childId: string;
    childName: string;
    domain: OutcomeDomain;
    domainLabel: string;
    targetDescription: string;
    targetScore: number;
    currentScore: number;
    targetDate: string;
    daysRemaining: number;
  }[];
}

export interface OutcomePlanningResult {
  totalChildren: number;
  childrenWithPlans: number;
  planCoverageRate: number;
  currentPlans: number;           // plans where nextReviewDate >= referenceDate
  overduePlans: number;           // plans where nextReviewDate < referenceDate
  planCurrencyRate: number;
  childInvolvementRate: number;
  familyInvolvementRate: number;
  professionalInvolvementRate: number;
  averageMeasurableIndicators: number;
  plansWithMeasurableIndicators: number;
  measurabilityRate: number;
  planDetails: {
    childId: string;
    childName: string;
    hasPlan: boolean;
    isCurrent: boolean;
    childInvolved: boolean;
    indicatorCount: number;
    nextReviewDate: string;
  }[];
}

export interface MeasurementQualityResult {
  totalChildren: number;
  domainsWithBaselines: number;
  totalPossibleDomains: number;
  baselineCoverageRate: number;
  methodsUsed: MeasurementMethod[];
  methodDiversityScore: number;    // 0-100
  measurementRegularity: number;   // average measurements per child per domain
  childVoiceInclusion: number;     // % of measurements with childView
  qualityDetails: {
    childId: string;
    childName: string;
    domainsBaselined: number;
    domainsMeasured: number;
    methodsUsed: MeasurementMethod[];
    measurementCount: number;
    childVoiceCount: number;
  }[];
}

export interface ChildOutcomeProfile {
  childId: string;
  childName: string;
  domainTrajectories: {
    domain: OutcomeDomain;
    domainLabel: string;
    baselineScore: number | null;
    currentScore: number | null;
    targetScore: number | null;
    change: number | null;
    progressStatus: ProgressStatus | null;
    measurementCount: number;
    latestMeasurementDate: string | null;
  }[];
  overallProgressSummary: string;
  domainsImproving: number;
  domainsRegressing: number;
  domainsStable: number;
  hasPlan: boolean;
  planCurrent: boolean;
  activeTargets: number;
  targetsAchieved: number;
  targetsAtRisk: number;
}

export interface OutcomesMeasurementResult {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  referenceDate: string;
  overallScore: number;
  rating: "outstanding" | "good" | "requires_improvement" | "inadequate";
  progressFromBaseline: ProgressFromBaselineResult;
  targetAchievement: TargetAchievementResult;
  outcomePlanning: OutcomePlanningResult;
  measurementQuality: MeasurementQualityResult;
  childProfiles: ChildOutcomeProfile[];
  strengths: string[];
  areasForDevelopment: string[];
  immediateActions: string[];
  regulatoryLinks: string[];
}

// ── Constants ──────────────────────────────────────────────────────────────

const ALL_DOMAINS: OutcomeDomain[] = [
  "education",
  "health",
  "emotional_wellbeing",
  "behaviour",
  "relationships",
  "independence",
  "identity",
  "safety",
];

const ALL_METHODS: MeasurementMethod[] = [
  "standardised_tool",
  "professional_assessment",
  "self_report",
  "observation",
  "milestone_tracking",
];

const DOMAIN_LABELS: Record<OutcomeDomain, string> = {
  education: "Education",
  health: "Health",
  emotional_wellbeing: "Emotional Wellbeing",
  behaviour: "Behaviour",
  relationships: "Relationships",
  independence: "Independence",
  identity: "Identity",
  safety: "Safety",
};

// ── Helpers ────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function daysBetween(earlier: string, later: string): number {
  return Math.round(
    (new Date(later).getTime() - new Date(earlier).getTime()) / (1000 * 60 * 60 * 24),
  );
}

function classifyProgress(change: number): ProgressStatus {
  if (change >= 3) return "significant_progress";
  if (change >= 2) return "good_progress";
  if (change >= 1) return "some_progress";
  if (change <= -1) return "regression";
  return "no_change";
}

export function getDomainLabel(d: OutcomeDomain): string {
  return DOMAIN_LABELS[d];
}

export function getAllDomains(): OutcomeDomain[] {
  return [...ALL_DOMAINS];
}

// ── Core: 1. Evaluate Progress From Baseline ──────────────────────────────

export function evaluateProgressFromBaseline(
  baselines: OutcomeBaseline[],
  measurements: OutcomeMeasurement[],
  childIds: string[],
): ProgressFromBaselineResult {
  const relevantBaselines = baselines.filter((b) => childIds.includes(b.childId));
  const relevantMeasurements = measurements.filter((m) => childIds.includes(m.childId));

  // Build per-domain progress
  const domainProgress: DomainProgress[] = [];
  const allProgressStatuses: ProgressStatus[] = [];
  const regressionAlerts: ProgressFromBaselineResult["regressionAlerts"] = [];

  // Track per-child improvement (any domain improved)
  const childImprovementMap = new Map<string, boolean>();
  for (const cid of childIds) {
    childImprovementMap.set(cid, false);
  }

  for (const domain of ALL_DOMAINS) {
    const domainBaselines = relevantBaselines.filter((b) => b.domain === domain);
    if (domainBaselines.length === 0) continue;

    let totalChange = 0;
    let progressing = 0;
    let regressing = 0;
    let noChange = 0;
    let count = 0;
    let totalBaseline = 0;
    let totalCurrent = 0;

    for (const baseline of domainBaselines) {
      // Get the latest measurement for this child+domain
      const childMeasurements = relevantMeasurements
        .filter((m) => m.childId === baseline.childId && m.domain === domain)
        .sort((a, b) => b.measurementDate.localeCompare(a.measurementDate));

      if (childMeasurements.length === 0) continue;

      const latest = childMeasurements[0];
      const change = latest.score - baseline.baselineScore;
      totalChange += change;
      totalBaseline += baseline.baselineScore;
      totalCurrent += latest.score;
      count++;

      const status = classifyProgress(change);
      allProgressStatuses.push(status);

      if (change >= 1) {
        progressing++;
        childImprovementMap.set(baseline.childId, true);
      } else if (change <= -1) {
        regressing++;
        regressionAlerts.push({
          childId: baseline.childId,
          childName: baseline.childName,
          domain,
          domainLabel: DOMAIN_LABELS[domain],
          baselineScore: baseline.baselineScore,
          currentScore: latest.score,
          change,
        });
      } else {
        noChange++;
      }
    }

    if (count > 0) {
      const avgChange = totalChange / count;
      domainProgress.push({
        domain,
        domainLabel: DOMAIN_LABELS[domain],
        childCount: count,
        averageBaselineScore: Math.round((totalBaseline / count) * 10) / 10,
        averageCurrentScore: Math.round((totalCurrent / count) * 10) / 10,
        averageChange: Math.round(avgChange * 10) / 10,
        progressStatus: classifyProgress(avgChange),
        childrenProgressing: progressing,
        childrenRegressing: regressing,
        childrenNoChange: noChange,
      });
    }
  }

  // Overall improvement rate: % of children improving in at least 1 domain
  const childrenImproving = Array.from(childImprovementMap.values()).filter(Boolean).length;
  const overallImprovementRate = pct(childrenImproving, childIds.length);

  // Overall average change across all domain progress entries
  const overallAverageChange =
    domainProgress.length > 0
      ? Math.round(
          (domainProgress.reduce((s, dp) => s + dp.averageChange, 0) / domainProgress.length) * 10,
        ) / 10
      : 0;

  // Progress distribution
  const progressDistribution: Record<ProgressStatus, number> = {
    significant_progress: 0,
    good_progress: 0,
    some_progress: 0,
    no_change: 0,
    regression: 0,
  };
  for (const s of allProgressStatuses) {
    progressDistribution[s]++;
  }

  return {
    totalChildren: childIds.length,
    domainsAssessed: domainProgress.length,
    domainProgress,
    overallAverageChange,
    overallImprovementRate,
    regressionAlerts,
    progressDistribution,
  };
}

// ── Core: 2. Evaluate Target Achievement ──────────────────────────────────

export function evaluateTargetAchievement(
  targets: OutcomeTarget[],
  childIds: string[],
  referenceDate: string,
): TargetAchievementResult {
  const relevantTargets = targets.filter((t) => childIds.includes(t.childId));

  const achievedCount = relevantTargets.filter((t) => t.status === "achieved").length;
  const onTrackCount = relevantTargets.filter((t) => t.status === "on_track").length;
  const atRiskCount = relevantTargets.filter((t) => t.status === "at_risk").length;
  const notAchievedCount = relevantTargets.filter((t) => t.status === "not_achieved").length;
  const reviewedCount = relevantTargets.filter((t) => t.status === "reviewed").length;

  const totalTargets = relevantTargets.length;
  const achievedRate = pct(achievedCount, totalTargets);
  const onTrackRate = pct(onTrackCount, totalTargets);
  const atRiskRate = pct(atRiskCount, totalTargets);

  // Domain-level achievement
  const domainAchievement: TargetAchievementResult["domainAchievement"] = [];
  for (const domain of ALL_DOMAINS) {
    const domainTargets = relevantTargets.filter((t) => t.domain === domain);
    if (domainTargets.length === 0) continue;

    const achieved = domainTargets.filter((t) => t.status === "achieved").length;
    const onTrack = domainTargets.filter((t) => t.status === "on_track").length;
    const atRisk = domainTargets.filter((t) => t.status === "at_risk").length;

    domainAchievement.push({
      domain,
      domainLabel: DOMAIN_LABELS[domain],
      total: domainTargets.length,
      achieved,
      onTrack,
      atRisk,
      achievementRate: pct(achieved, domainTargets.length),
    });
  }

  // At-risk details
  const atRiskDetails: TargetAchievementResult["atRiskDetails"] = relevantTargets
    .filter((t) => t.status === "at_risk")
    .map((t) => ({
      childId: t.childId,
      childName: t.childName,
      domain: t.domain,
      domainLabel: DOMAIN_LABELS[t.domain],
      targetDescription: t.targetDescription,
      targetScore: t.targetScore,
      currentScore: t.currentScore,
      targetDate: t.targetDate,
      daysRemaining: daysBetween(referenceDate, t.targetDate),
    }));

  return {
    totalTargets,
    achievedCount,
    onTrackCount,
    atRiskCount,
    notAchievedCount,
    reviewedCount,
    achievedRate,
    onTrackRate,
    atRiskRate,
    domainAchievement,
    atRiskDetails,
  };
}

// ── Core: 3. Evaluate Outcome Planning ────────────────────────────────────

export function evaluateOutcomePlanning(
  plans: ChildOutcomePlan[],
  childIds: string[],
  referenceDate: string,
): OutcomePlanningResult {
  const relevantPlans = plans.filter((p) => childIds.includes(p.childId));

  // One plan per child (latest)
  const latestPlanByChild = new Map<string, ChildOutcomePlan>();
  for (const plan of relevantPlans) {
    const existing = latestPlanByChild.get(plan.childId);
    if (!existing || plan.planDate > existing.planDate) {
      latestPlanByChild.set(plan.childId, plan);
    }
  }

  const childrenWithPlans = latestPlanByChild.size;
  const planCoverageRate = pct(childrenWithPlans, childIds.length);

  // Currency: nextReviewDate >= referenceDate means current
  const latestPlans = Array.from(latestPlanByChild.values());
  const currentPlans = latestPlans.filter((p) => p.nextReviewDate >= referenceDate).length;
  const overduePlans = latestPlans.length - currentPlans;
  const planCurrencyRate = pct(currentPlans, latestPlans.length);

  // Involvement
  const childInvolved = latestPlans.filter((p) => p.childInvolved).length;
  const familyInvolved = latestPlans.filter((p) => p.familyInvolved).length;
  const professionalInvolved = latestPlans.filter((p) => p.professionalInvolved).length;
  const childInvolvementRate = pct(childInvolved, latestPlans.length);
  const familyInvolvementRate = pct(familyInvolved, latestPlans.length);
  const professionalInvolvementRate = pct(professionalInvolved, latestPlans.length);

  // Measurability
  const totalIndicators = latestPlans.reduce((s, p) => s + p.measurableIndicators.length, 0);
  const averageMeasurableIndicators =
    latestPlans.length > 0
      ? Math.round((totalIndicators / latestPlans.length) * 10) / 10
      : 0;
  const plansWithMeasurableIndicators = latestPlans.filter(
    (p) => p.measurableIndicators.length > 0,
  ).length;
  const measurabilityRate = pct(plansWithMeasurableIndicators, latestPlans.length);

  // Per-child details
  const planDetails: OutcomePlanningResult["planDetails"] = childIds.map((cid) => {
    const plan = latestPlanByChild.get(cid);
    return {
      childId: cid,
      childName: plan?.childName ?? cid,
      hasPlan: !!plan,
      isCurrent: plan ? plan.nextReviewDate >= referenceDate : false,
      childInvolved: plan?.childInvolved ?? false,
      indicatorCount: plan?.measurableIndicators.length ?? 0,
      nextReviewDate: plan?.nextReviewDate ?? "",
    };
  });

  return {
    totalChildren: childIds.length,
    childrenWithPlans,
    planCoverageRate,
    currentPlans,
    overduePlans,
    planCurrencyRate,
    childInvolvementRate,
    familyInvolvementRate,
    professionalInvolvementRate,
    averageMeasurableIndicators,
    plansWithMeasurableIndicators,
    measurabilityRate,
    planDetails,
  };
}

// ── Core: 4. Evaluate Measurement Quality ─────────────────────────────────

export function evaluateMeasurementQuality(
  baselines: OutcomeBaseline[],
  measurements: OutcomeMeasurement[],
  childIds: string[],
): MeasurementQualityResult {
  const relevantBaselines = baselines.filter((b) => childIds.includes(b.childId));
  const relevantMeasurements = measurements.filter((m) => childIds.includes(m.childId));

  // Domain baseline coverage
  const baselinedDomainPairs = new Set<string>();
  for (const b of relevantBaselines) {
    baselinedDomainPairs.add(`${b.childId}|${b.domain}`);
  }
  const totalPossibleDomains = childIds.length * ALL_DOMAINS.length;
  const domainsWithBaselines = baselinedDomainPairs.size;
  const baselineCoverageRate = pct(domainsWithBaselines, totalPossibleDomains);

  // Method diversity
  const allMethodsUsed = new Set<MeasurementMethod>();
  for (const b of relevantBaselines) allMethodsUsed.add(b.method);
  for (const m of relevantMeasurements) allMethodsUsed.add(m.method);
  const methodsUsed = Array.from(allMethodsUsed);
  const methodDiversityScore = pct(methodsUsed.length, ALL_METHODS.length);

  // Measurement regularity: average measurements per child per domain that has a baseline
  const domainMeasurementCounts = new Map<string, number>();
  for (const m of relevantMeasurements) {
    const key = `${m.childId}|${m.domain}`;
    domainMeasurementCounts.set(key, (domainMeasurementCounts.get(key) ?? 0) + 1);
  }
  const baselinedPairCount = baselinedDomainPairs.size;
  let totalMeasurementCount = 0;
  for (const pair of baselinedDomainPairs) {
    totalMeasurementCount += domainMeasurementCounts.get(pair) ?? 0;
  }
  const measurementRegularity =
    baselinedPairCount > 0
      ? Math.round((totalMeasurementCount / baselinedPairCount) * 10) / 10
      : 0;

  // Child voice inclusion
  const measurementsWithVoice = relevantMeasurements.filter(
    (m) => m.childView && m.childView.trim().length > 0,
  ).length;
  const childVoiceInclusion = pct(measurementsWithVoice, relevantMeasurements.length);

  // Per-child quality details
  const qualityDetails: MeasurementQualityResult["qualityDetails"] = childIds.map((cid) => {
    const childBaselines = relevantBaselines.filter((b) => b.childId === cid);
    const childMeasurements = relevantMeasurements.filter((m) => m.childId === cid);

    const domainsBaselined = new Set(childBaselines.map((b) => b.domain)).size;
    const domainsMeasured = new Set(childMeasurements.map((m) => m.domain)).size;
    const methods = new Set<MeasurementMethod>();
    for (const b of childBaselines) methods.add(b.method);
    for (const m of childMeasurements) methods.add(m.method);
    const childVoiceCount = childMeasurements.filter(
      (m) => m.childView && m.childView.trim().length > 0,
    ).length;

    return {
      childId: cid,
      childName: childBaselines[0]?.childName ?? childMeasurements[0]?.childName ?? cid,
      domainsBaselined,
      domainsMeasured,
      methodsUsed: Array.from(methods),
      measurementCount: childMeasurements.length,
      childVoiceCount,
    };
  });

  return {
    totalChildren: childIds.length,
    domainsWithBaselines,
    totalPossibleDomains,
    baselineCoverageRate,
    methodsUsed,
    methodDiversityScore,
    measurementRegularity,
    childVoiceInclusion,
    qualityDetails,
  };
}

// ── Core: 5. Build Child Outcome Profiles ─────────────────────────────────

export function buildChildOutcomeProfiles(
  baselines: OutcomeBaseline[],
  measurements: OutcomeMeasurement[],
  targets: OutcomeTarget[],
  plans: ChildOutcomePlan[],
  childIds: string[],
  referenceDate: string,
): ChildOutcomeProfile[] {
  return childIds.map((cid) => {
    const childBaselines = baselines.filter((b) => b.childId === cid);
    const childMeasurements = measurements.filter((m) => m.childId === cid);
    const childTargets = targets.filter((t) => t.childId === cid);
    const childPlans = plans.filter((p) => p.childId === cid);

    // Resolve child name
    const childName =
      childBaselines[0]?.childName ??
      childMeasurements[0]?.childName ??
      childTargets[0]?.childName ??
      childPlans[0]?.childName ??
      cid;

    // Domain trajectories
    let domainsImproving = 0;
    let domainsRegressing = 0;
    let domainsStable = 0;

    const domainTrajectories = ALL_DOMAINS.map((domain) => {
      const baseline = childBaselines.find((b) => b.domain === domain);
      const domainMeasurements = childMeasurements
        .filter((m) => m.domain === domain)
        .sort((a, b) => b.measurementDate.localeCompare(a.measurementDate));
      const domainTarget = childTargets.find(
        (t) => t.domain === domain && (t.status === "on_track" || t.status === "at_risk"),
      );

      const baselineScore = baseline?.baselineScore ?? null;
      const currentScore = domainMeasurements.length > 0 ? domainMeasurements[0].score : null;
      const targetScore = domainTarget?.targetScore ?? null;

      let change: number | null = null;
      let progressStatus: ProgressStatus | null = null;

      if (baselineScore !== null && currentScore !== null) {
        change = Math.round((currentScore - baselineScore) * 10) / 10;
        progressStatus = classifyProgress(change);

        if (change >= 1) domainsImproving++;
        else if (change <= -1) domainsRegressing++;
        else domainsStable++;
      }

      return {
        domain,
        domainLabel: DOMAIN_LABELS[domain],
        baselineScore,
        currentScore,
        targetScore,
        change,
        progressStatus,
        measurementCount: domainMeasurements.length,
        latestMeasurementDate:
          domainMeasurements.length > 0 ? domainMeasurements[0].measurementDate : null,
      };
    });

    // Plan status
    const latestPlan = childPlans
      .sort((a, b) => b.planDate.localeCompare(a.planDate))[0] ?? null;
    const hasPlan = !!latestPlan;
    const planCurrent = latestPlan ? latestPlan.nextReviewDate >= referenceDate : false;

    // Target counts
    const activeTargets = childTargets.filter(
      (t) => t.status === "on_track" || t.status === "at_risk",
    ).length;
    const targetsAchieved = childTargets.filter((t) => t.status === "achieved").length;
    const targetsAtRisk = childTargets.filter((t) => t.status === "at_risk").length;

    // Progress summary
    let overallProgressSummary: string;
    if (domainsImproving > 0 && domainsRegressing === 0) {
      overallProgressSummary =
        `Positive trajectory — improving in ${domainsImproving} domain${domainsImproving !== 1 ? "s" : ""}.`;
    } else if (domainsImproving > domainsRegressing) {
      overallProgressSummary =
        `Mixed progress — improving in ${domainsImproving} domain${domainsImproving !== 1 ? "s" : ""} but regressing in ${domainsRegressing}.`;
    } else if (domainsRegressing > 0 && domainsImproving === 0) {
      overallProgressSummary =
        `Concerning — regressing in ${domainsRegressing} domain${domainsRegressing !== 1 ? "s" : ""} with no improvement.`;
    } else if (domainsImproving === 0 && domainsRegressing === 0 && domainsStable > 0) {
      overallProgressSummary = "Stable — no significant change from baseline.";
    } else if (domainsImproving > 0 && domainsRegressing > 0 && domainsImproving === domainsRegressing) {
      overallProgressSummary =
        `Mixed progress — improving in ${domainsImproving} domain${domainsImproving !== 1 ? "s" : ""} but regressing in ${domainsRegressing}.`;
    } else {
      overallProgressSummary = "Insufficient measurement data to determine trajectory.";
    }

    return {
      childId: cid,
      childName,
      domainTrajectories,
      overallProgressSummary,
      domainsImproving,
      domainsRegressing,
      domainsStable,
      hasPlan,
      planCurrent,
      activeTargets,
      targetsAchieved,
      targetsAtRisk,
    };
  });
}

// ── Core: 6. Generate Outcomes Measurement Intelligence ───────────────────

export function generateOutcomesMeasurementIntelligence(
  baselines: OutcomeBaseline[],
  measurements: OutcomeMeasurement[],
  targets: OutcomeTarget[],
  plans: ChildOutcomePlan[],
  childIds: string[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
  referenceDate: string,
): OutcomesMeasurementResult {
  const progressFromBaseline = evaluateProgressFromBaseline(baselines, measurements, childIds);
  const targetAchievement = evaluateTargetAchievement(targets, childIds, referenceDate);
  const outcomePlanning = evaluateOutcomePlanning(plans, childIds, referenceDate);
  const measurementQuality = evaluateMeasurementQuality(baselines, measurements, childIds);
  const childProfiles = buildChildOutcomeProfiles(
    baselines,
    measurements,
    targets,
    plans,
    childIds,
    referenceDate,
  );

  // ── Scoring ──────────────────────────────────────────────────────────

  // 1. Progress from baseline (30)
  let progressScore = 0;
  if (progressFromBaseline.overallImprovementRate >= 90) progressScore = 30;
  else if (progressFromBaseline.overallImprovementRate >= 75) progressScore = 25;
  else if (progressFromBaseline.overallImprovementRate >= 60) progressScore = 20;
  else if (progressFromBaseline.overallImprovementRate >= 40) progressScore = 12;
  else if (progressFromBaseline.overallImprovementRate >= 20) progressScore = 5;

  // Regression penalty
  if (progressFromBaseline.regressionAlerts.length > 0) {
    progressScore = Math.max(0, progressScore - progressFromBaseline.regressionAlerts.length * 2);
  }

  // 2. Target achievement (25)
  let targetScore = 0;
  if (targetAchievement.totalTargets > 0) {
    const effectiveRate = targetAchievement.achievedRate + targetAchievement.onTrackRate;
    if (effectiveRate >= 90) targetScore = 25;
    else if (effectiveRate >= 75) targetScore = 20;
    else if (effectiveRate >= 60) targetScore = 15;
    else if (effectiveRate >= 40) targetScore = 8;
    else if (effectiveRate >= 20) targetScore = 3;
  }

  // 3. Outcome planning (20)
  let planningScore = 0;
  // Coverage sub-score (8)
  if (outcomePlanning.planCoverageRate >= 100) planningScore += 8;
  else if (outcomePlanning.planCoverageRate >= 80) planningScore += 6;
  else if (outcomePlanning.planCoverageRate >= 60) planningScore += 4;
  else if (outcomePlanning.planCoverageRate >= 40) planningScore += 2;

  // Currency sub-score (4)
  if (outcomePlanning.planCurrencyRate >= 100) planningScore += 4;
  else if (outcomePlanning.planCurrencyRate >= 80) planningScore += 3;
  else if (outcomePlanning.planCurrencyRate >= 60) planningScore += 2;
  else if (outcomePlanning.planCurrencyRate >= 40) planningScore += 1;

  // Child involvement sub-score (4)
  if (outcomePlanning.childInvolvementRate >= 100) planningScore += 4;
  else if (outcomePlanning.childInvolvementRate >= 80) planningScore += 3;
  else if (outcomePlanning.childInvolvementRate >= 60) planningScore += 2;
  else if (outcomePlanning.childInvolvementRate >= 40) planningScore += 1;

  // Measurability sub-score (4)
  if (outcomePlanning.measurabilityRate >= 100) planningScore += 4;
  else if (outcomePlanning.measurabilityRate >= 80) planningScore += 3;
  else if (outcomePlanning.measurabilityRate >= 60) planningScore += 2;
  else if (outcomePlanning.measurabilityRate >= 40) planningScore += 1;

  // 4. Measurement quality (25)
  let qualityScore = 0;
  // Baseline coverage (8)
  if (measurementQuality.baselineCoverageRate >= 90) qualityScore += 8;
  else if (measurementQuality.baselineCoverageRate >= 70) qualityScore += 6;
  else if (measurementQuality.baselineCoverageRate >= 50) qualityScore += 4;
  else if (measurementQuality.baselineCoverageRate >= 30) qualityScore += 2;

  // Method diversity (6)
  if (measurementQuality.methodDiversityScore >= 80) qualityScore += 6;
  else if (measurementQuality.methodDiversityScore >= 60) qualityScore += 4;
  else if (measurementQuality.methodDiversityScore >= 40) qualityScore += 2;
  else if (measurementQuality.methodDiversityScore >= 20) qualityScore += 1;

  // Regularity (5)
  if (measurementQuality.measurementRegularity >= 3) qualityScore += 5;
  else if (measurementQuality.measurementRegularity >= 2) qualityScore += 4;
  else if (measurementQuality.measurementRegularity >= 1.5) qualityScore += 3;
  else if (measurementQuality.measurementRegularity >= 1) qualityScore += 2;
  else if (measurementQuality.measurementRegularity > 0) qualityScore += 1;

  // Child voice (6)
  if (measurementQuality.childVoiceInclusion >= 80) qualityScore += 6;
  else if (measurementQuality.childVoiceInclusion >= 60) qualityScore += 4;
  else if (measurementQuality.childVoiceInclusion >= 40) qualityScore += 3;
  else if (measurementQuality.childVoiceInclusion >= 20) qualityScore += 1;

  const overallScore = Math.min(100, Math.max(0, progressScore + targetScore + planningScore + qualityScore));

  const rating: OutcomesMeasurementResult["rating"] =
    overallScore >= 80
      ? "outstanding"
      : overallScore >= 60
        ? "good"
        : overallScore >= 40
          ? "requires_improvement"
          : "inadequate";

  // ── Strengths / Areas / Actions ──────────────────────────────────────

  const strengths: string[] = [];
  const areasForDevelopment: string[] = [];
  const immediateActions: string[] = [];

  // Strengths
  if (progressFromBaseline.overallImprovementRate >= 90) {
    strengths.push(
      "Excellent progress — 90%+ of children improving from their starting points",
    );
  } else if (progressFromBaseline.overallImprovementRate >= 75) {
    strengths.push(
      "Good progress — 75%+ of children demonstrating improvement from baseline",
    );
  }

  if (targetAchievement.totalTargets > 0 && targetAchievement.achievedRate >= 50) {
    strengths.push(
      `Strong target achievement — ${targetAchievement.achievedRate}% of targets achieved`,
    );
  }

  if (outcomePlanning.planCoverageRate >= 100 && outcomePlanning.planCurrencyRate >= 100) {
    strengths.push(
      "All children have current outcome plans — excellent planning coverage",
    );
  }

  if (outcomePlanning.childInvolvementRate >= 100 && outcomePlanning.totalChildren > 0) {
    strengths.push(
      "Every child involved in their own outcome planning — strong participation",
    );
  }

  if (measurementQuality.childVoiceInclusion >= 80) {
    strengths.push(
      "Child voice consistently captured in outcome measurements",
    );
  }

  if (measurementQuality.baselineCoverageRate >= 90) {
    strengths.push(
      "Comprehensive baseline coverage across outcome domains",
    );
  }

  if (measurementQuality.methodDiversityScore >= 80) {
    strengths.push(
      "Diverse measurement methods used — multiple evidence sources triangulated",
    );
  }

  if (strengths.length === 0) {
    strengths.push(
      "No significant strengths identified — outcomes measurement framework requires development",
    );
  }

  // Areas for development
  if (progressFromBaseline.overallImprovementRate < 60 && progressFromBaseline.totalChildren > 0) {
    areasForDevelopment.push(
      `Only ${progressFromBaseline.overallImprovementRate}% of children showing improvement — review intervention strategies`,
    );
  }

  if (targetAchievement.atRiskRate > 30 && targetAchievement.totalTargets > 0) {
    areasForDevelopment.push(
      `${targetAchievement.atRiskRate}% of targets at risk — review target-setting and support`,
    );
  }

  if (outcomePlanning.planCoverageRate < 100 && outcomePlanning.totalChildren > 0) {
    areasForDevelopment.push(
      `Outcome plan coverage at ${outcomePlanning.planCoverageRate}% — all children need individual outcome plans`,
    );
  }

  if (outcomePlanning.overduePlans > 0) {
    areasForDevelopment.push(
      `${outcomePlanning.overduePlans} outcome plan${outcomePlanning.overduePlans !== 1 ? "s" : ""} overdue for review`,
    );
  }

  if (outcomePlanning.childInvolvementRate < 80 && outcomePlanning.childrenWithPlans > 0) {
    areasForDevelopment.push(
      `Child involvement in planning at ${outcomePlanning.childInvolvementRate}% — ensure all children participate in their own outcome planning`,
    );
  }

  if (measurementQuality.baselineCoverageRate < 60) {
    areasForDevelopment.push(
      `Baseline coverage only ${measurementQuality.baselineCoverageRate}% — complete baseline assessments across all domains`,
    );
  }

  if (measurementQuality.childVoiceInclusion < 50 && measurements.length > 0) {
    areasForDevelopment.push(
      `Child voice captured in only ${measurementQuality.childVoiceInclusion}% of measurements — increase child participation`,
    );
  }

  if (areasForDevelopment.length === 0) {
    areasForDevelopment.push("No significant areas for development identified");
  }

  // Immediate actions
  if (progressFromBaseline.regressionAlerts.length > 0) {
    const regressionChildren = [
      ...new Set(progressFromBaseline.regressionAlerts.map((r) => r.childName)),
    ];
    immediateActions.push(
      `URGENT: Regression detected for ${regressionChildren.join(", ")} — convene review and adjust care plans`,
    );
  }

  if (targetAchievement.atRiskCount > 0) {
    immediateActions.push(
      `HIGH: ${targetAchievement.atRiskCount} target${targetAchievement.atRiskCount !== 1 ? "s" : ""} at risk of not being achieved — review with keyworkers and adjust support`,
    );
  }

  const childrenWithoutPlans = outcomePlanning.planDetails.filter((d) => !d.hasPlan);
  if (childrenWithoutPlans.length > 0) {
    immediateActions.push(
      `HIGH: ${childrenWithoutPlans.length} child${childrenWithoutPlans.length !== 1 ? "ren" : ""} without outcome plans — create individualised plans (Reg 9 requirement)`,
    );
  }

  if (outcomePlanning.overduePlans > 0) {
    immediateActions.push(
      `MEDIUM: ${outcomePlanning.overduePlans} outcome plan${outcomePlanning.overduePlans !== 1 ? "s" : ""} overdue for review — schedule reviews this week`,
    );
  }

  if (immediateActions.length === 0) {
    immediateActions.push(
      "No immediate actions required — outcomes measurement is well maintained",
    );
  }

  const regulatoryLinks: string[] = [
    "SCCIF — Overall effectiveness: children making progress from starting points",
    "CHR 2015 Reg 6 — Quality of care standard",
    "CHR 2015 Reg 9 — Individualised care informed by assessment",
    "CHR 2015 Reg 14 — Care planning standard",
    "DfE Guide — Home should demonstrate children are benefiting",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    referenceDate,
    overallScore,
    rating,
    progressFromBaseline,
    targetAchievement,
    outcomePlanning,
    measurementQuality,
    childProfiles,
    strengths,
    areasForDevelopment,
    immediateActions,
    regulatoryLinks,
  };
}
