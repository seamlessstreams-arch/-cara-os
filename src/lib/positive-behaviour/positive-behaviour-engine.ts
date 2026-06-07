// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Positive Behaviour Support (PBS) Intelligence Engine
//
// Pure deterministic engine. No AI, no external calls, no side-effects.
//
// "Children's behaviour is managed through positive relationships and
//  skilled, evidence-based approaches. Physical intervention is only used
//  as a last resort, and children are supported to understand and manage
//  their own behaviour."
// — SCCIF Quality of Care 2023
//
// Regulatory framework:
//   CHR 2015 Reg 35         — Behaviour management policy
//   CHR 2015 Reg 19         — Positive relationships
//   SCCIF                   — Experiences and progress of children
//   NICE CG158              — Antisocial behaviour in young people
//   UNCRC Article 3         — Best interests of the child
//
// Key quality indicators for Ofsted:
//   1. Every child has an up-to-date, person-centred BSP
//   2. Children are involved in creating their own BSPs
//   3. De-escalation is attempted before any reactive strategy
//   4. Physical intervention is genuinely last resort and reducing
//   5. Rewards significantly outweigh sanctions (>=3:1 ratio)
//   6. Sanctions are proportionate with child's view recorded
//   7. Incidents are analysed for patterns and learning
//   8. Staff debrief after every significant incident
//
// Scoring breakdown (0-100):
//   Behaviour support plans:   25  — Coverage, currency, involvement
//   De-escalation:             25  — Success rate, PI avoidance, strategies
//   Reward:sanction balance:   25  — Ratio, variety, child voice, restoration
//   Incident management:       25  — Trends, debrief, de-escalation attempts
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ─────────────────────────────────────────────────────────────────────

export type BehaviourSupportPlanStatus =
  | "draft"
  | "active"
  | "under_review"
  | "expired"
  | "archived";

export type StrategyType = "proactive" | "active" | "reactive";

export type DeEscalationOutcome =
  | "successful"
  | "partially_successful"
  | "unsuccessful"
  | "not_attempted";

export type RecognitionType =
  | "verbal_praise"
  | "written_recognition"
  | "activity_reward"
  | "privilege"
  | "achievement_certificate"
  | "special_outing";

export type SanctionType =
  | "verbal_warning"
  | "loss_of_privilege"
  | "restorative_task"
  | "time_out"
  | "other";

// ── Data Models ───────────────────────────────────────────────────────────────

export interface BehaviourSupportPlan {
  id: string;
  childId: string;
  childName: string;
  createdDate: string;           // ISO date
  lastReviewDate: string;        // ISO date
  nextReviewDate: string;        // ISO date
  status: BehaviourSupportPlanStatus;
  primaryNeeds: string[];
  triggers: string[];
  proactiveStrategies: string[];
  activeStrategies: string[];
  reactiveStrategies: string[];
  childInvolvedInCreation: boolean;
  familyInvolvedInCreation: boolean;
  attachedRiskAssessment: boolean;
}

export interface DeEscalationRecord {
  id: string;
  childId: string;
  childName: string;
  date: string;                  // ISO date
  staffMember: string;
  triggerDescription: string;
  strategiesUsed: string[];
  outcome: DeEscalationOutcome;
  durationMinutes: number;
  followUpAction?: string;
  physicalInterventionAvoided: boolean;
}

export interface RecognitionRecord {
  id: string;
  childId: string;
  childName: string;
  date: string;                  // ISO date
  givenBy: string;
  type: RecognitionType;
  reason: string;
  childResponse?: string;
}

export interface SanctionRecord {
  id: string;
  childId: string;
  childName: string;
  date: string;                  // ISO date
  issuedBy: string;
  type: SanctionType;
  reason: string;
  proportionate: boolean;
  childInformed: boolean;
  childViewRecorded: boolean;
  parentNotified: boolean;
  restorationPlanned: boolean;
}

export interface BehaviourIncident {
  id: string;
  childId: string;
  childName: string;
  date: string;                  // ISO date
  time: string;                  // HH:MM
  description: string;
  antecedent?: string;
  behaviour: string;
  consequence: string;
  severityLevel: "low" | "medium" | "high" | "critical";
  physicalInterventionUsed: boolean;
  deEscalationAttempted: boolean;
  staffInvolved: string[];
  debriefCompleted: boolean;
}

// ── Result Types ──────────────────────────────────────────────────────────────

export interface BSPEvaluationResult {
  totalPlans: number;
  activePlans: number;
  uniqueChildrenWithActivePlans: number;
  planCoverageRate: number;       // pct of children with active plan
  plansReviewedOnTime: number;
  planCurrencyRate: number;       // pct reviewed within schedule
  childInvolvementRate: number;
  familyInvolvementRate: number;
  strategyComprehensivenessRate: number; // pct with all 3 strategy types
  riskAssessmentAttachmentRate: number;
  childrenWithoutPlans: string[]; // childIds
}

export interface DeEscalationResult {
  totalRecords: number;
  successRate: number;
  partialSuccessRate: number;
  unsuccessRate: number;
  physicalInterventionAvoidanceRate: number;
  averageDurationMinutes: number;
  strategyVariety: number;       // count of unique strategies used
  perChildPatterns: {
    childId: string;
    childName: string;
    totalAttempts: number;
    successRate: number;
    avgDuration: number;
    piAvoidanceRate: number;
  }[];
}

export interface RewardSanctionResult {
  totalRecognitions: number;
  totalSanctions: number;
  rewardSanctionRatio: number;   // recognitions / sanctions
  ratioMeetsTarget: boolean;     // >=3:1
  recognitionTypeVariety: number; // count of distinct types used
  sanctionProportionalityRate: number;
  childVoiceInSanctionsRate: number;
  parentNotificationRate: number;
  restorationPlanningRate: number;
}

export interface IncidentPatternResult {
  totalIncidents: number;
  severityBreakdown: Record<string, number>;
  timeOfDayPatterns: Record<string, number>; // morning/afternoon/evening/night
  antecedentAnalysis: { antecedent: string; count: number }[];
  debriefCompletionRate: number;
  physicalInterventionRate: number;
  deEscalationAttemptedRate: number;
  frequencyTrend: "increasing" | "stable" | "decreasing";
  monthlyBreakdown: { month: string; count: number }[];
}

export interface ChildBehaviourProfile {
  childId: string;
  childName: string;
  planStatus: BehaviourSupportPlanStatus | "no_plan";
  planCurrent: boolean;
  deEscalationSuccessRate: number;
  rewardSanctionRatio: number;
  incidentCount: number;
  incidentSeverityBreakdown: Record<string, number>;
  improvementTrend: "improving" | "stable" | "declining" | "insufficient_data";
  strengths: string[];
  concerns: string[];
}

export interface PositiveBehaviourResult {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: "outstanding" | "good" | "requires_improvement" | "inadequate";
  bspEvaluation: BSPEvaluationResult;
  deEscalation: DeEscalationResult;
  rewardSanctionBalance: RewardSanctionResult;
  incidentPatterns: IncidentPatternResult;
  childProfiles: ChildBehaviourProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function timeOfDayBucket(time: string): string {
  const hour = parseInt(time.split(":")[0], 10);
  if (hour >= 6 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

function monthKey(date: string): string {
  return date.substring(0, 7); // "YYYY-MM"
}

// ── Core Function 1: Evaluate Behaviour Support Plans ───────────────────────

export function evaluateBehaviourSupportPlans(
  plans: BehaviourSupportPlan[],
  referenceDate: string,
): BSPEvaluationResult {
  const totalPlans = plans.length;
  const activePlans = plans.filter((p) => p.status === "active").length;

  // Unique children with at least one active plan
  const activeChildIds = new Set(
    plans.filter((p) => p.status === "active").map((p) => p.childId),
  );
  const allChildIds = new Set(plans.map((p) => p.childId));
  const uniqueChildrenWithActivePlans = activeChildIds.size;
  const planCoverageRate = pct(activeChildIds.size, allChildIds.size);

  // Currency: active plans where nextReviewDate >= referenceDate (not overdue)
  const activePlansList = plans.filter((p) => p.status === "active");
  const onTime = activePlansList.filter(
    (p) => p.nextReviewDate >= referenceDate,
  ).length;
  const plansReviewedOnTime = onTime;
  const planCurrencyRate = pct(onTime, activePlansList.length);

  // Child involvement in creation
  const childInvolvementRate = pct(
    plans.filter((p) => p.childInvolvedInCreation).length,
    totalPlans,
  );

  // Family involvement in creation
  const familyInvolvementRate = pct(
    plans.filter((p) => p.familyInvolvedInCreation).length,
    totalPlans,
  );

  // Strategy comprehensiveness — all 3 types present (proactive, active, reactive)
  const comprehensive = plans.filter(
    (p) =>
      p.proactiveStrategies.length > 0 &&
      p.activeStrategies.length > 0 &&
      p.reactiveStrategies.length > 0,
  ).length;
  const strategyComprehensivenessRate = pct(comprehensive, totalPlans);

  // Risk assessment attachment
  const riskAssessmentAttachmentRate = pct(
    plans.filter((p) => p.attachedRiskAssessment).length,
    totalPlans,
  );

  // Children without any active plan
  const childrenWithoutPlans = [...allChildIds].filter(
    (id) => !activeChildIds.has(id),
  );

  return {
    totalPlans,
    activePlans,
    uniqueChildrenWithActivePlans,
    planCoverageRate,
    plansReviewedOnTime,
    planCurrencyRate,
    childInvolvementRate,
    familyInvolvementRate,
    strategyComprehensivenessRate,
    riskAssessmentAttachmentRate,
    childrenWithoutPlans,
  };
}

// ── Core Function 2: Evaluate De-Escalation ─────────────────────────────────

export function evaluateDeEscalation(
  records: DeEscalationRecord[],
): DeEscalationResult {
  const totalRecords = records.length;

  if (totalRecords === 0) {
    return {
      totalRecords: 0,
      successRate: 0,
      partialSuccessRate: 0,
      unsuccessRate: 0,
      physicalInterventionAvoidanceRate: 0,
      averageDurationMinutes: 0,
      strategyVariety: 0,
      perChildPatterns: [],
    };
  }

  const successful = records.filter((r) => r.outcome === "successful").length;
  const partial = records.filter(
    (r) => r.outcome === "partially_successful",
  ).length;
  const unsuccessful = records.filter(
    (r) => r.outcome === "unsuccessful",
  ).length;

  const successRate = pct(successful, totalRecords);
  const partialSuccessRate = pct(partial, totalRecords);
  const unsuccessRate = pct(unsuccessful, totalRecords);

  const physicalInterventionAvoidanceRate = pct(
    records.filter((r) => r.physicalInterventionAvoided).length,
    totalRecords,
  );

  const totalDuration = records.reduce(
    (sum, r) => sum + r.durationMinutes,
    0,
  );
  const averageDurationMinutes = round1(totalDuration / totalRecords);

  // Strategy variety: count of unique strategies across all records
  const allStrategies = new Set<string>();
  for (const r of records) {
    for (const s of r.strategiesUsed) {
      allStrategies.add(s);
    }
  }
  const strategyVariety = allStrategies.size;

  // Per-child patterns
  const childMap = new Map<string, DeEscalationRecord[]>();
  for (const r of records) {
    const existing = childMap.get(r.childId) ?? [];
    existing.push(r);
    childMap.set(r.childId, existing);
  }

  const perChildPatterns = [...childMap.entries()].map(
    ([childId, childRecords]) => {
      const childName = childRecords[0].childName;
      const totalAttempts = childRecords.length;
      const childSuccessful = childRecords.filter(
        (r) => r.outcome === "successful",
      ).length;
      const childSuccessRate = pct(childSuccessful, totalAttempts);
      const childDuration = childRecords.reduce(
        (sum, r) => sum + r.durationMinutes,
        0,
      );
      const avgDuration = round1(childDuration / totalAttempts);
      const piAvoided = childRecords.filter(
        (r) => r.physicalInterventionAvoided,
      ).length;
      const piAvoidanceRate = pct(piAvoided, totalAttempts);

      return {
        childId,
        childName,
        totalAttempts,
        successRate: childSuccessRate,
        avgDuration,
        piAvoidanceRate,
      };
    },
  );

  // Sort by total attempts descending
  perChildPatterns.sort((a, b) => b.totalAttempts - a.totalAttempts);

  return {
    totalRecords,
    successRate,
    partialSuccessRate,
    unsuccessRate,
    physicalInterventionAvoidanceRate,
    averageDurationMinutes,
    strategyVariety,
    perChildPatterns,
  };
}

// ── Core Function 3: Evaluate Reward:Sanction Balance ───────────────────────

export function evaluateRewardSanctionBalance(
  recognitions: RecognitionRecord[],
  sanctions: SanctionRecord[],
): RewardSanctionResult {
  const totalRecognitions = recognitions.length;
  const totalSanctions = sanctions.length;

  // Ratio: recognitions per sanction
  const rewardSanctionRatio =
    totalSanctions === 0
      ? totalRecognitions > 0
        ? totalRecognitions // Infinite is represented as total recognitions
        : 0
      : round1(totalRecognitions / totalSanctions);

  const ratioMeetsTarget = totalSanctions === 0
    ? totalRecognitions > 0
    : rewardSanctionRatio >= 3;

  // Recognition type variety
  const recognitionTypes = new Set(recognitions.map((r) => r.type));
  const recognitionTypeVariety = recognitionTypes.size;

  // Sanction quality indicators
  const sanctionProportionalityRate = pct(
    sanctions.filter((s) => s.proportionate).length,
    totalSanctions,
  );

  const childVoiceInSanctionsRate = pct(
    sanctions.filter((s) => s.childViewRecorded).length,
    totalSanctions,
  );

  const parentNotificationRate = pct(
    sanctions.filter((s) => s.parentNotified).length,
    totalSanctions,
  );

  const restorationPlanningRate = pct(
    sanctions.filter((s) => s.restorationPlanned).length,
    totalSanctions,
  );

  return {
    totalRecognitions,
    totalSanctions,
    rewardSanctionRatio,
    ratioMeetsTarget,
    recognitionTypeVariety,
    sanctionProportionalityRate,
    childVoiceInSanctionsRate,
    parentNotificationRate,
    restorationPlanningRate,
  };
}

// ── Core Function 4: Evaluate Incident Patterns ─────────────────────────────

export function evaluateIncidentPatterns(
  incidents: BehaviourIncident[],
): IncidentPatternResult {
  const totalIncidents = incidents.length;

  if (totalIncidents === 0) {
    return {
      totalIncidents: 0,
      severityBreakdown: { low: 0, medium: 0, high: 0, critical: 0 },
      timeOfDayPatterns: { morning: 0, afternoon: 0, evening: 0, night: 0 },
      antecedentAnalysis: [],
      debriefCompletionRate: 0,
      physicalInterventionRate: 0,
      deEscalationAttemptedRate: 0,
      frequencyTrend: "stable",
      monthlyBreakdown: [],
    };
  }

  // Severity breakdown
  const severityBreakdown: Record<string, number> = {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  };
  for (const inc of incidents) {
    severityBreakdown[inc.severityLevel] =
      (severityBreakdown[inc.severityLevel] ?? 0) + 1;
  }

  // Time of day patterns
  const timeOfDayPatterns: Record<string, number> = {
    morning: 0,
    afternoon: 0,
    evening: 0,
    night: 0,
  };
  for (const inc of incidents) {
    const bucket = timeOfDayBucket(inc.time);
    timeOfDayPatterns[bucket] = (timeOfDayPatterns[bucket] ?? 0) + 1;
  }

  // Antecedent analysis
  const antecedentMap = new Map<string, number>();
  for (const inc of incidents) {
    if (inc.antecedent) {
      const key = inc.antecedent;
      antecedentMap.set(key, (antecedentMap.get(key) ?? 0) + 1);
    }
  }
  const antecedentAnalysis = [...antecedentMap.entries()]
    .map(([antecedent, count]) => ({ antecedent, count }))
    .sort((a, b) => b.count - a.count);

  // Rates
  const debriefCompletionRate = pct(
    incidents.filter((i) => i.debriefCompleted).length,
    totalIncidents,
  );

  const physicalInterventionRate = pct(
    incidents.filter((i) => i.physicalInterventionUsed).length,
    totalIncidents,
  );

  const deEscalationAttemptedRate = pct(
    incidents.filter((i) => i.deEscalationAttempted).length,
    totalIncidents,
  );

  // Monthly breakdown & trend
  const monthMap = new Map<string, number>();
  for (const inc of incidents) {
    const mk = monthKey(inc.date);
    monthMap.set(mk, (monthMap.get(mk) ?? 0) + 1);
  }
  const monthlyBreakdown = [...monthMap.entries()]
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month));

  // Trend: compare first half vs second half of months
  let frequencyTrend: "increasing" | "stable" | "decreasing" = "stable";
  if (monthlyBreakdown.length >= 2) {
    const mid = Math.floor(monthlyBreakdown.length / 2);
    const firstHalf = monthlyBreakdown.slice(0, mid);
    const secondHalf = monthlyBreakdown.slice(mid);

    const firstAvg =
      firstHalf.reduce((sum, m) => sum + m.count, 0) / firstHalf.length;
    const secondAvg =
      secondHalf.reduce((sum, m) => sum + m.count, 0) / secondHalf.length;

    if (secondAvg > firstAvg * 1.2) {
      frequencyTrend = "increasing";
    } else if (secondAvg < firstAvg * 0.8) {
      frequencyTrend = "decreasing";
    }
  }

  return {
    totalIncidents,
    severityBreakdown,
    timeOfDayPatterns,
    antecedentAnalysis,
    debriefCompletionRate,
    physicalInterventionRate,
    deEscalationAttemptedRate,
    frequencyTrend,
    monthlyBreakdown,
  };
}

// ── Core Function 5: Build Child Behaviour Profiles ─────────────────────────

export function buildChildBehaviourProfiles(
  plans: BehaviourSupportPlan[],
  deescalations: DeEscalationRecord[],
  recognitions: RecognitionRecord[],
  sanctions: SanctionRecord[],
  incidents: BehaviourIncident[],
): ChildBehaviourProfile[] {
  // Gather all unique children across all data sources
  const childMap = new Map<string, string>(); // id -> name
  for (const p of plans) childMap.set(p.childId, p.childName);
  for (const d of deescalations) childMap.set(d.childId, d.childName);
  for (const r of recognitions) childMap.set(r.childId, r.childName);
  for (const s of sanctions) childMap.set(s.childId, s.childName);
  for (const i of incidents) childMap.set(i.childId, i.childName);

  const profiles: ChildBehaviourProfile[] = [];

  for (const [childId, childName] of childMap) {
    // Plan status
    const childPlans = plans.filter((p) => p.childId === childId);
    const activePlan = childPlans.find((p) => p.status === "active");
    const planStatus: BehaviourSupportPlanStatus | "no_plan" = activePlan
      ? activePlan.status
      : childPlans.length > 0
        ? childPlans[0].status
        : "no_plan";
    const planCurrent = activePlan
      ? activePlan.nextReviewDate >= new Date().toISOString().slice(0, 10)
      : false;

    // De-escalation success rate
    const childDe = deescalations.filter((d) => d.childId === childId);
    const deSuccessful = childDe.filter(
      (d) => d.outcome === "successful",
    ).length;
    const deEscalationSuccessRate = pct(deSuccessful, childDe.length);

    // Reward:sanction ratio
    const childRecognitions = recognitions.filter(
      (r) => r.childId === childId,
    ).length;
    const childSanctions = sanctions.filter(
      (s) => s.childId === childId,
    ).length;
    const rewardSanctionRatio =
      childSanctions === 0
        ? childRecognitions > 0
          ? childRecognitions
          : 0
        : round1(childRecognitions / childSanctions);

    // Incident analysis
    const childIncidents = incidents.filter((i) => i.childId === childId);
    const incidentCount = childIncidents.length;
    const incidentSeverityBreakdown: Record<string, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };
    for (const inc of childIncidents) {
      incidentSeverityBreakdown[inc.severityLevel] =
        (incidentSeverityBreakdown[inc.severityLevel] ?? 0) + 1;
    }

    // Improvement trend — based on incident months
    let improvementTrend: ChildBehaviourProfile["improvementTrend"] =
      "insufficient_data";
    const incMonths = new Map<string, number>();
    for (const inc of childIncidents) {
      const mk = monthKey(inc.date);
      incMonths.set(mk, (incMonths.get(mk) ?? 0) + 1);
    }
    const sortedMonths = [...incMonths.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]));

    if (sortedMonths.length >= 2) {
      const mid = Math.floor(sortedMonths.length / 2);
      const firstAvg =
        sortedMonths
          .slice(0, mid)
          .reduce((sum, [, c]) => sum + c, 0) / mid;
      const secondAvg =
        sortedMonths
          .slice(mid)
          .reduce((sum, [, c]) => sum + c, 0) /
        (sortedMonths.length - mid);

      if (secondAvg < firstAvg * 0.8) {
        improvementTrend = "improving";
      } else if (secondAvg > firstAvg * 1.2) {
        improvementTrend = "declining";
      } else {
        improvementTrend = "stable";
      }
    }

    // Strengths and concerns
    const strengths: string[] = [];
    const concerns: string[] = [];

    if (deEscalationSuccessRate >= 70 && childDe.length > 0) {
      strengths.push("Responds well to de-escalation strategies");
    }
    if (rewardSanctionRatio >= 3) {
      strengths.push("Positive reward:sanction ratio");
    }
    if (improvementTrend === "improving") {
      strengths.push("Incident frequency is decreasing");
    }
    if (planStatus === "active") {
      strengths.push("Has an active behaviour support plan");
    }

    if (deEscalationSuccessRate < 50 && childDe.length > 0) {
      concerns.push("Low de-escalation success rate");
    }
    if (rewardSanctionRatio < 3 && childSanctions > 0) {
      concerns.push(
        `Reward:sanction ratio below target (${rewardSanctionRatio}:1)`,
      );
    }
    if (improvementTrend === "declining") {
      concerns.push("Incident frequency is increasing");
    }
    if (planStatus === "no_plan") {
      concerns.push("No behaviour support plan in place");
    }
    if (planStatus === "expired") {
      concerns.push("Behaviour support plan has expired");
    }
    if (
      incidentSeverityBreakdown.high + incidentSeverityBreakdown.critical > 0
    ) {
      concerns.push("Has had high or critical severity incidents");
    }

    profiles.push({
      childId,
      childName,
      planStatus,
      planCurrent,
      deEscalationSuccessRate,
      rewardSanctionRatio,
      incidentCount,
      incidentSeverityBreakdown,
      improvementTrend,
      strengths,
      concerns,
    });
  }

  // Sort by incident count descending (highest need first)
  profiles.sort((a, b) => b.incidentCount - a.incidentCount);

  return profiles;
}

// ── Core Function 6: Generate Full PBS Intelligence ─────────────────────────

export function generatePositiveBehaviourIntelligence(
  plans: BehaviourSupportPlan[],
  deescalations: DeEscalationRecord[],
  recognitions: RecognitionRecord[],
  sanctions: SanctionRecord[],
  incidents: BehaviourIncident[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
  referenceDate: string,
): PositiveBehaviourResult {
  const bspEvaluation = evaluateBehaviourSupportPlans(plans, referenceDate);
  const deEscalation = evaluateDeEscalation(deescalations);
  const rewardSanctionBalance = evaluateRewardSanctionBalance(
    recognitions,
    sanctions,
  );
  const incidentPatterns = evaluateIncidentPatterns(incidents);
  const childProfiles = buildChildBehaviourProfiles(
    plans,
    deescalations,
    recognitions,
    sanctions,
    incidents,
  );

  // ── Scoring ──────────────────────────────────────────────────────────

  // 1. Behaviour support plans (25 pts)
  let bspScore = 0;
  // Coverage (8 pts)
  if (bspEvaluation.planCoverageRate >= 100) bspScore += 8;
  else if (bspEvaluation.planCoverageRate >= 75) bspScore += 6;
  else if (bspEvaluation.planCoverageRate >= 50) bspScore += 4;
  else if (bspEvaluation.planCoverageRate > 0) bspScore += 2;

  // Currency (6 pts)
  if (bspEvaluation.planCurrencyRate >= 100) bspScore += 6;
  else if (bspEvaluation.planCurrencyRate >= 75) bspScore += 4;
  else if (bspEvaluation.planCurrencyRate >= 50) bspScore += 2;
  else if (bspEvaluation.planCurrencyRate > 0) bspScore += 1;

  // Child involvement (5 pts)
  if (bspEvaluation.childInvolvementRate >= 80) bspScore += 5;
  else if (bspEvaluation.childInvolvementRate >= 60) bspScore += 3;
  else if (bspEvaluation.childInvolvementRate >= 40) bspScore += 2;
  else if (bspEvaluation.childInvolvementRate > 0) bspScore += 1;

  // Strategy comprehensiveness (6 pts)
  if (bspEvaluation.strategyComprehensivenessRate >= 80) bspScore += 6;
  else if (bspEvaluation.strategyComprehensivenessRate >= 60) bspScore += 4;
  else if (bspEvaluation.strategyComprehensivenessRate >= 40) bspScore += 2;
  else if (bspEvaluation.strategyComprehensivenessRate > 0) bspScore += 1;

  // 2. De-escalation effectiveness (25 pts)
  let deScore = 0;
  if (deEscalation.totalRecords === 0) {
    deScore = 0;
  } else {
    // Success rate (10 pts)
    if (deEscalation.successRate >= 80) deScore += 10;
    else if (deEscalation.successRate >= 60) deScore += 7;
    else if (deEscalation.successRate >= 40) deScore += 4;
    else if (deEscalation.successRate > 0) deScore += 2;

    // PI avoidance (10 pts)
    if (deEscalation.physicalInterventionAvoidanceRate >= 90) deScore += 10;
    else if (deEscalation.physicalInterventionAvoidanceRate >= 75) deScore += 7;
    else if (deEscalation.physicalInterventionAvoidanceRate >= 50) deScore += 4;
    else deScore += 2;

    // Strategy variety (5 pts)
    if (deEscalation.strategyVariety >= 6) deScore += 5;
    else if (deEscalation.strategyVariety >= 4) deScore += 3;
    else if (deEscalation.strategyVariety >= 2) deScore += 2;
    else deScore += 1;
  }

  // 3. Reward:sanction balance (25 pts)
  let rsScore = 0;
  const hasRecOrSanc =
    rewardSanctionBalance.totalRecognitions > 0 ||
    rewardSanctionBalance.totalSanctions > 0;
  if (!hasRecOrSanc) {
    rsScore = 0;
  } else {
    // Ratio (10 pts)
    if (rewardSanctionBalance.ratioMeetsTarget) rsScore += 10;
    else if (rewardSanctionBalance.rewardSanctionRatio >= 2) rsScore += 7;
    else if (rewardSanctionBalance.rewardSanctionRatio >= 1) rsScore += 4;
    else rsScore += 1;

    // Recognition variety (5 pts)
    if (rewardSanctionBalance.recognitionTypeVariety >= 5) rsScore += 5;
    else if (rewardSanctionBalance.recognitionTypeVariety >= 3) rsScore += 3;
    else if (rewardSanctionBalance.recognitionTypeVariety >= 1) rsScore += 1;

    // Child voice in sanctions (5 pts) — only if sanctions exist
    if (rewardSanctionBalance.totalSanctions > 0) {
      if (rewardSanctionBalance.childVoiceInSanctionsRate >= 80) rsScore += 5;
      else if (rewardSanctionBalance.childVoiceInSanctionsRate >= 60) rsScore += 3;
      else if (rewardSanctionBalance.childVoiceInSanctionsRate >= 40) rsScore += 2;
      else if (rewardSanctionBalance.childVoiceInSanctionsRate > 0) rsScore += 1;
    } else {
      rsScore += 5; // No sanctions is positive
    }

    // Restoration planning (5 pts) — only if sanctions exist
    if (rewardSanctionBalance.totalSanctions > 0) {
      if (rewardSanctionBalance.restorationPlanningRate >= 80) rsScore += 5;
      else if (rewardSanctionBalance.restorationPlanningRate >= 60) rsScore += 3;
      else if (rewardSanctionBalance.restorationPlanningRate >= 40) rsScore += 2;
      else if (rewardSanctionBalance.restorationPlanningRate > 0) rsScore += 1;
    } else {
      rsScore += 5; // No sanctions is positive
    }
  }

  // 4. Incident management (25 pts)
  let incScore = 0;
  if (incidentPatterns.totalIncidents === 0) {
    incScore = 25; // No incidents is outstanding
  } else {
    // Trend (8 pts)
    if (incidentPatterns.frequencyTrend === "decreasing") incScore += 8;
    else if (incidentPatterns.frequencyTrend === "stable") incScore += 5;
    else incScore += 2; // increasing

    // Debrief completion (8 pts)
    if (incidentPatterns.debriefCompletionRate >= 90) incScore += 8;
    else if (incidentPatterns.debriefCompletionRate >= 70) incScore += 6;
    else if (incidentPatterns.debriefCompletionRate >= 50) incScore += 3;
    else if (incidentPatterns.debriefCompletionRate > 0) incScore += 1;

    // De-escalation attempted rate (9 pts)
    if (incidentPatterns.deEscalationAttemptedRate >= 90) incScore += 9;
    else if (incidentPatterns.deEscalationAttemptedRate >= 70) incScore += 6;
    else if (incidentPatterns.deEscalationAttemptedRate >= 50) incScore += 3;
    else if (incidentPatterns.deEscalationAttemptedRate > 0) incScore += 1;
  }

  const overallScore = Math.min(
    100,
    Math.max(0, bspScore + deScore + rsScore + incScore),
  );

  const rating: PositiveBehaviourResult["rating"] =
    overallScore >= 80
      ? "outstanding"
      : overallScore >= 60
        ? "good"
        : overallScore >= 40
          ? "requires_improvement"
          : "inadequate";

  // ── Strengths / Areas / Actions / Regulatory Links ──────────────────

  const strengths: string[] = [];
  const areasForImprovement: string[] = [];
  const actions: string[] = [];
  const regulatoryLinks: string[] = [];

  // --- Strengths ---
  if (bspEvaluation.planCoverageRate === 100 && bspEvaluation.activePlans > 0) {
    strengths.push(
      "All children have active behaviour support plans — person-centred care is evidenced",
    );
  } else if (bspEvaluation.planCoverageRate >= 75) {
    strengths.push(
      "Good coverage of behaviour support plans across the home",
    );
  }

  if (bspEvaluation.childInvolvementRate >= 80 && bspEvaluation.totalPlans > 0) {
    strengths.push(
      "Children are consistently involved in creating their own BSPs — strong child voice",
    );
  }

  if (bspEvaluation.strategyComprehensivenessRate >= 80 && bspEvaluation.totalPlans > 0) {
    strengths.push(
      "BSPs contain proactive, active and reactive strategies — aligned with BILD PBS framework",
    );
  }

  if (deEscalation.successRate >= 70 && deEscalation.totalRecords > 0) {
    strengths.push(
      "De-escalation is effective — staff demonstrate skilled, relational approaches",
    );
  }

  if (
    deEscalation.physicalInterventionAvoidanceRate >= 90 &&
    deEscalation.totalRecords > 0
  ) {
    strengths.push(
      "Physical intervention avoided in the vast majority of de-escalation episodes",
    );
  }

  if (rewardSanctionBalance.ratioMeetsTarget && hasRecOrSanc) {
    strengths.push(
      `Reward:sanction ratio of ${rewardSanctionBalance.rewardSanctionRatio}:1 exceeds the 3:1 target — positive culture`,
    );
  }

  if (
    rewardSanctionBalance.recognitionTypeVariety >= 4 &&
    rewardSanctionBalance.totalRecognitions > 0
  ) {
    strengths.push(
      "Wide variety of recognition types — rewards are personalised and meaningful",
    );
  }

  if (incidentPatterns.frequencyTrend === "decreasing") {
    strengths.push(
      "Incident frequency is decreasing — proactive strategies appear to be working",
    );
  }

  if (
    incidentPatterns.debriefCompletionRate >= 90 &&
    incidentPatterns.totalIncidents > 0
  ) {
    strengths.push(
      "Debriefs completed consistently after incidents — reflective practice embedded",
    );
  }

  if (
    incidentPatterns.deEscalationAttemptedRate >= 90 &&
    incidentPatterns.totalIncidents > 0
  ) {
    strengths.push(
      "De-escalation attempted in almost all incidents before any reactive response",
    );
  }

  if (strengths.length === 0) {
    strengths.push(
      "No significant strengths identified — positive behaviour support requires development",
    );
  }

  // --- Areas for improvement ---
  if (
    bspEvaluation.planCoverageRate < 100 &&
    bspEvaluation.childrenWithoutPlans.length > 0
  ) {
    areasForImprovement.push(
      `${bspEvaluation.childrenWithoutPlans.length} child(ren) without an active BSP — all children should have a current plan`,
    );
  }

  if (bspEvaluation.planCurrencyRate < 100 && bspEvaluation.activePlans > 0) {
    areasForImprovement.push(
      `Plan currency at ${bspEvaluation.planCurrencyRate}% — some plans are overdue for review`,
    );
  }

  if (bspEvaluation.childInvolvementRate < 80 && bspEvaluation.totalPlans > 0) {
    areasForImprovement.push(
      `Child involvement in BSP creation at ${bspEvaluation.childInvolvementRate}% — children should co-produce their plans`,
    );
  }

  if (
    deEscalation.successRate < 60 &&
    deEscalation.totalRecords > 0
  ) {
    areasForImprovement.push(
      `De-escalation success rate at ${deEscalation.successRate}% — review strategies and staff training`,
    );
  }

  if (
    deEscalation.physicalInterventionAvoidanceRate < 80 &&
    deEscalation.totalRecords > 0
  ) {
    areasForImprovement.push(
      `Physical intervention avoidance at ${deEscalation.physicalInterventionAvoidanceRate}% — PI should be genuinely last resort`,
    );
  }

  if (!rewardSanctionBalance.ratioMeetsTarget && hasRecOrSanc) {
    areasForImprovement.push(
      `Reward:sanction ratio is ${rewardSanctionBalance.rewardSanctionRatio}:1 — below the 3:1 target`,
    );
  }

  if (
    rewardSanctionBalance.childVoiceInSanctionsRate < 80 &&
    rewardSanctionBalance.totalSanctions > 0
  ) {
    areasForImprovement.push(
      `Child's view recorded in only ${rewardSanctionBalance.childVoiceInSanctionsRate}% of sanctions — Reg 19 requires children's views`,
    );
  }

  if (incidentPatterns.frequencyTrend === "increasing") {
    areasForImprovement.push(
      "Incident frequency is increasing — review proactive strategies and triggers",
    );
  }

  if (
    incidentPatterns.debriefCompletionRate < 80 &&
    incidentPatterns.totalIncidents > 0
  ) {
    areasForImprovement.push(
      `Debrief completion at ${incidentPatterns.debriefCompletionRate}% — every incident should be followed by a debrief`,
    );
  }

  if (areasForImprovement.length === 0) {
    areasForImprovement.push("No significant areas for improvement identified");
  }

  // --- Actions ---
  // Check both BSP evaluation and child profiles for children without plans
  const childrenNeedingPlans = childProfiles.filter(
    (cp) => cp.planStatus === "no_plan" || cp.planStatus === "expired",
  );
  if (
    bspEvaluation.childrenWithoutPlans.length > 0 ||
    childrenNeedingPlans.length > 0
  ) {
    const count = Math.max(
      bspEvaluation.childrenWithoutPlans.length,
      childrenNeedingPlans.length,
    );
    actions.push(
      `URGENT: Create behaviour support plans for ${count} child(ren) without active plans`,
    );
  }

  if (bspEvaluation.planCurrencyRate < 50 && bspEvaluation.activePlans > 0) {
    actions.push(
      "HIGH: Schedule BSP reviews for overdue plans — plans must be current to be effective",
    );
  }

  if (deEscalation.totalRecords === 0) {
    actions.push(
      "URGENT: No de-escalation records found — ensure de-escalation episodes are being documented",
    );
  }

  if (
    deEscalation.physicalInterventionAvoidanceRate < 75 &&
    deEscalation.totalRecords > 0
  ) {
    actions.push(
      "HIGH: Physical intervention avoidance rate below threshold — commission additional de-escalation training",
    );
  }

  if (!rewardSanctionBalance.ratioMeetsTarget && hasRecOrSanc) {
    actions.push(
      "MONITOR: Increase frequency and variety of positive recognition to improve reward:sanction ratio",
    );
  }

  if (
    rewardSanctionBalance.restorationPlanningRate < 50 &&
    rewardSanctionBalance.totalSanctions > 0
  ) {
    actions.push(
      "HIGH: Restoration planning low — every sanction should include a plan for how the child can move forward positively",
    );
  }

  if (
    incidentPatterns.physicalInterventionRate > 20 &&
    incidentPatterns.totalIncidents > 0
  ) {
    actions.push(
      `REVIEW: Physical intervention used in ${incidentPatterns.physicalInterventionRate}% of incidents — review whether de-escalation strategies are adequate`,
    );
  }

  if (
    incidentPatterns.deEscalationAttemptedRate < 70 &&
    incidentPatterns.totalIncidents > 0
  ) {
    actions.push(
      "HIGH: De-escalation not being attempted in enough incidents — must be standard practice before any reactive response",
    );
  }

  // Critical-severity behaviour incidents (e.g. serious injury, self-harm) must
  // surface as a home-level action — otherwise good aggregate trend/debrief/PI
  // rates let them pass with no prioritised follow-up named to the manager.
  if (incidentPatterns.severityBreakdown.critical > 0) {
    const n = incidentPatterns.severityBreakdown.critical;
    actions.push(
      `URGENT: ${n} critical behaviour incident(s) in the period — confirm each has a post-incident review, the required notifications, and a BSP update`,
    );
  }

  if (actions.length === 0) {
    actions.push(
      "Continue embedding positive behaviour support practice across the home",
    );
  }

  // --- Regulatory links ---
  regulatoryLinks.push(
    "CHR 2015 Reg 35 — Behaviour management policy must promote positive behaviour and de-escalation",
  );
  regulatoryLinks.push(
    "CHR 2015 Reg 19 — Positive relationships underpin behaviour support and management",
  );
  regulatoryLinks.push(
    "SCCIF — Experiences and progress: children are supported through positive behaviour strategies",
  );
  regulatoryLinks.push(
    "NICE CG158 — Antisocial behaviour and conduct disorders in children and young people: recognition and management",
  );
  regulatoryLinks.push(
    "UNCRC Article 3 — Best interests of the child must be a primary consideration in all behaviour management decisions",
  );

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    bspEvaluation,
    deEscalation,
    rewardSanctionBalance,
    incidentPatterns,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}

// ── Label Functions ─────────────────────────────────────────────────────────

export function getRatingLabel(
  rating: PositiveBehaviourResult["rating"],
): string {
  const labels: Record<PositiveBehaviourResult["rating"], string> = {
    outstanding: "Outstanding",
    good: "Good",
    requires_improvement: "Requires Improvement",
    inadequate: "Inadequate",
  };
  return labels[rating];
}

export function getBSPStatusLabel(status: BehaviourSupportPlanStatus | "no_plan"): string {
  const labels: Record<BehaviourSupportPlanStatus | "no_plan", string> = {
    draft: "Draft",
    active: "Active",
    under_review: "Under Review",
    expired: "Expired",
    archived: "Archived",
    no_plan: "No Plan",
  };
  return labels[status];
}

export function getDeEscalationOutcomeLabel(outcome: DeEscalationOutcome): string {
  const labels: Record<DeEscalationOutcome, string> = {
    successful: "Successful",
    partially_successful: "Partially Successful",
    unsuccessful: "Unsuccessful",
    not_attempted: "Not Attempted",
  };
  return labels[outcome];
}

export function getRecognitionTypeLabel(type: RecognitionType): string {
  const labels: Record<RecognitionType, string> = {
    verbal_praise: "Verbal Praise",
    written_recognition: "Written Recognition",
    activity_reward: "Activity Reward",
    privilege: "Privilege",
    achievement_certificate: "Achievement Certificate",
    special_outing: "Special Outing",
  };
  return labels[type];
}

export function getSanctionTypeLabel(type: SanctionType): string {
  const labels: Record<SanctionType, string> = {
    verbal_warning: "Verbal Warning",
    loss_of_privilege: "Loss of Privilege",
    restorative_task: "Restorative Task",
    time_out: "Time Out",
    other: "Other",
  };
  return labels[type];
}

export function getImprovementTrendLabel(
  trend: ChildBehaviourProfile["improvementTrend"],
): string {
  const labels: Record<ChildBehaviourProfile["improvementTrend"], string> = {
    improving: "Improving",
    stable: "Stable",
    declining: "Declining",
    insufficient_data: "Insufficient Data",
  };
  return labels[trend];
}

export function getSeverityLabel(level: BehaviourIncident["severityLevel"]): string {
  const labels: Record<BehaviourIncident["severityLevel"], string> = {
    low: "Low",
    medium: "Medium",
    high: "High",
    critical: "Critical",
  };
  return labels[level];
}

export function getStrategyTypeLabel(type: StrategyType): string {
  const labels: Record<StrategyType, string> = {
    proactive: "Proactive",
    active: "Active",
    reactive: "Reactive",
  };
  return labels[type];
}
