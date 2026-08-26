import { below, meanOf, meets, rate } from "@/lib/metrics/rate";
// ══════════════════════════════════════════════════════════════════════════════
// MISSING & ABSENT EPISODES INTELLIGENCE ENGINE
//
// Pure deterministic engine for evaluating how effectively a children's
// residential home manages episodes where children go missing or are absent
// without authorisation, including return home interviews, risk assessment,
// and prevention strategies.
//
// Scoring model:
//   episode_management        25  — return interviews, notification compliance
//   prevention_effectiveness  25  — triggers, plans, resolution rates
//   missing_policy            25  — governance framework completeness
//   staff_missing_readiness   25  — training across 6 competency areas
//   TOTAL                    100
//
// Rating thresholds:
//   >= 80  outstanding
//   >= 60  good
//   >= 40  requires_improvement
//   <  40  inadequate
//
// Regulatory basis:
//   - CHR 2015, Reg 12 — Protection of children
//   - CHR 2015, Reg 34 — Notification of significant events
//   - SCCIF — Social Care Common Inspection Framework
//   - Children Act 1989
//   - Statutory guidance on children who run away or go missing from home or care
//   - NMS 5 — Enjoying and achieving
//   - DfE Missing Children protocol
//
// No AI. No external calls. Pure input -> output.
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ──────────────────────────────────────────────────────────────────

export type EpisodeType =
  | "missing"
  | "absent_without_permission"
  | "absent_no_contact"
  | "failure_to_return"
  | "absconded";

export type EpisodeOutcome =
  | "returned_self"
  | "found_by_staff"
  | "found_by_police"
  | "returned_by_carer"
  | "returned_by_third_party"
  | "still_missing";

export type RiskLevel = "low" | "medium" | "high" | "very_high";

export type Rating = "outstanding" | "good" | "requires_improvement" | "inadequate";

// ── Label Maps ─────────────────────────────────────────────────────────────

const episodeTypeLabels: Record<EpisodeType, string> = {
  missing: "Missing",
  absent_without_permission: "Absent Without Permission",
  absent_no_contact: "Absent — No Contact",
  failure_to_return: "Failure to Return",
  absconded: "Absconded",
};

const episodeOutcomeLabels: Record<EpisodeOutcome, string> = {
  returned_self: "Returned Self",
  found_by_staff: "Found by Staff",
  found_by_police: "Found by Police",
  returned_by_carer: "Returned by Carer",
  returned_by_third_party: "Returned by Third Party",
  still_missing: "Still Missing",
};

const riskLevelLabels: Record<RiskLevel, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  very_high: "Very High",
};

const ratingLabels: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

// ── Label Getters ──────────────────────────────────────────────────────────

export function getEpisodeTypeLabel(type: EpisodeType): string {
  return episodeTypeLabels[type];
}

export function getEpisodeOutcomeLabel(outcome: EpisodeOutcome): string {
  return episodeOutcomeLabels[outcome];
}

export function getRiskLevelLabel(level: RiskLevel): string {
  return riskLevelLabels[level];
}

export function getRatingLabel(rating: Rating): string {
  return ratingLabels[rating];
}

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface MissingEpisode {
  id: string;
  childId: string;
  childName: string;
  episodeType: EpisodeType;
  reportedDate: string; // ISO date
  resolvedDate: string | null; // null when still_missing
  durationMinutes: number | null; // null when still_missing
  riskLevel: RiskLevel;
  outcome: EpisodeOutcome;
  returnInterviewCompleted: boolean;
  returnInterviewTimely: boolean; // within 72 hours
  triggerIdentified: boolean;
  preventionPlanUpdated: boolean;
  policeNotified: boolean;
  localAuthorityNotified: boolean;
}

export interface MissingPolicy {
  id: string;
  missingProtocolInPlace: boolean;
  riskAssessmentFramework: boolean;
  returnInterviewProcess: boolean;
  preventionStrategy: boolean;
  multiAgencyProtocol: boolean;
  regularReview: boolean;
  staffGuidanceClear: boolean;
}

export interface StaffMissingTraining {
  id: string;
  staffId: string;
  staffName: string;
  missingProtocol: boolean;
  riskAssessment: boolean;
  returnInterviews: boolean;
  preventionStrategies: boolean;
  multiAgencyWorking: boolean;
  recordKeeping: boolean;
}

// ── Child Profile ──────────────────────────────────────────────────────────

export interface ChildMissingProfile {
  childId: string;
  childName: string;
  totalEpisodes: number;
  highRiskEpisodes: number;
  returnInterviewRate: number; // percentage
  triggerIdentifiedRate: number; // percentage
  overallScore: number; // 0-10
}

// ── Result Interface ───────────────────────────────────────────────────────

export interface EpisodeManagementResult {
  /** null when the population is empty — nothing measured, not 0%. */
  returnInterviewCompletionRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  returnInterviewTimelyRate: number | null;
  riskBreakdown: Record<RiskLevel, number>;
  /** null when the population is empty — nothing measured, not 0%. */
  policeNotificationRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  localAuthorityNotificationRate: number | null;
  score: number; // 0-25
}

export interface PreventionEffectivenessResult {
  /** null when the population is empty — nothing measured, not 0%. */
  triggerIdentificationRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  preventionPlanUpdateRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  resolutionRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  selfReturnRate: number | null;
  score: number; // 0-25
}

export interface MissingPolicyResult {
  fieldsCompliant: number;
  totalFields: number;
  /** null when the population is empty — nothing measured, not 0%. */
  complianceRate: number | null;
  score: number; // 0-25
}

export interface StaffMissingReadinessResult {
  totalStaff: number;
  averageCompetencyRate: number | null;
  /** per-area competency rates; null where a training area is unmeasured. */
  competencyBreakdown: Record<string, number | null>;
  score: number; // 0-25
}

export interface MissingAbsentEpisodesIntelligence {
  homeId: string;
  assessedAt: string;
  periodStart: string;
  periodEnd: string;

  overallScore: number; // 0-100
  rating: Rating;

  episodeManagement: EpisodeManagementResult;
  preventionEffectiveness: PreventionEffectivenessResult;
  missingPolicy: MissingPolicyResult;
  staffReadiness: StaffMissingReadinessResult;

  totalEpisodes: number;
  childProfiles: ChildMissingProfile[];

  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

export function getRating(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// ── Evaluator 1: Episode Management (0-25) ─────────────────────────────────

export function evaluateEpisodeManagement(
  episodes: MissingEpisode[],
): EpisodeManagementResult {
  // Empty = 25 (no episodes = ideal — measuring ABSENCE of bad things)
  if (episodes.length === 0) {
    return {
      returnInterviewCompletionRate: null,
      returnInterviewTimelyRate: null,
      riskBreakdown: { low: 0, medium: 0, high: 0, very_high: 0 },
      policeNotificationRate: null,
      localAuthorityNotificationRate: null,
      score: 25,
    };
  }

  const total = episodes.length;

  // Return interview completion rate -> 0-7 (high = good)
  const riCompleted = episodes.filter((e) => e.returnInterviewCompleted).length;
  const riCompletionRate = rate(riCompleted, total);
  const riScore = Math.round(((riCompletionRate ?? 0) / 100) * 7);

  // Risk levels managed (lower average risk is better) -> 0-6
  const riskBreakdown: Record<RiskLevel, number> = { low: 0, medium: 0, high: 0, very_high: 0 };
  for (const e of episodes) {
    riskBreakdown[e.riskLevel]++;
  }
  const riskNumeric: Record<RiskLevel, number> = { low: 1, medium: 2, high: 3, very_high: 4 };
  const avgRisk = episodes.reduce((sum, e) => sum + riskNumeric[e.riskLevel], 0) / total;
  // avgRisk 1 = best (6 points), avgRisk 4 = worst (0 points)
  const riskScore = Math.round(Math.max(0, ((4 - avgRisk) / 3) * 6));

  // Police/LA notification compliance -> 0-6
  const policeNotified = episodes.filter((e) => e.policeNotified).length;
  const laNotified = episodes.filter((e) => e.localAuthorityNotified).length;
  const policeRate = rate(policeNotified, total);
  const laRate = rate(laNotified, total);
  const notificationScore = Math.round((((meanOf([policeRate, laRate]) ?? 0)) / 100) * 6);

  // Return interview timeliness -> 0-6
  const riTimely = episodes.filter((e) => e.returnInterviewTimely).length;
  const riTimelyRate = rate(riTimely, total);
  const timelyScore = Math.round(((riTimelyRate ?? 0) / 100) * 6);

  const score = Math.max(0, Math.min(25, riScore + riskScore + notificationScore + timelyScore));

  return {
    returnInterviewCompletionRate: riCompletionRate,
    returnInterviewTimelyRate: riTimelyRate,
    riskBreakdown,
    policeNotificationRate: policeRate,
    localAuthorityNotificationRate: laRate,
    score,
  };
}

// ── Evaluator 2: Prevention Effectiveness (0-25) ───────────────────────────

export function evaluatePreventionEffectiveness(
  episodes: MissingEpisode[],
): PreventionEffectivenessResult {
  // Empty = 25 (no episodes to prevent)
  if (episodes.length === 0) {
    return {
      triggerIdentificationRate: null,
      preventionPlanUpdateRate: null,
      resolutionRate: null,
      selfReturnRate: null,
      score: 25,
    };
  }

  const total = episodes.length;

  // Trigger identification rate -> 0-7
  const triggersIdentified = episodes.filter((e) => e.triggerIdentified).length;
  const triggerRate = rate(triggersIdentified, total);
  const triggerScore = Math.round(((triggerRate ?? 0) / 100) * 7);

  // Prevention plan update rate -> 0-6
  const plansUpdated = episodes.filter((e) => e.preventionPlanUpdated).length;
  const planRate = rate(plansUpdated, total);
  const planScore = Math.round(((planRate ?? 0) / 100) * 6);

  // Resolution rate (not still_missing) -> 0-6
  const resolved = episodes.filter((e) => e.outcome !== "still_missing").length;
  const resolutionRate = rate(resolved, total);
  const resolutionScore = Math.round(((resolutionRate ?? 0) / 100) * 6);

  // Self-return rate (returned_self = positive) -> 0-6
  const selfReturned = episodes.filter((e) => e.outcome === "returned_self").length;
  const selfReturnRate = rate(selfReturned, total);
  const selfReturnScore = Math.round(((selfReturnRate ?? 0) / 100) * 6);

  const score = Math.max(0, Math.min(25, triggerScore + planScore + resolutionScore + selfReturnScore));

  return {
    triggerIdentificationRate: triggerRate,
    preventionPlanUpdateRate: planRate,
    resolutionRate,
    selfReturnRate,
    score,
  };
}

// ── Evaluator 3: Missing Policy (0-25) ─────────────────────────────────────

export function evaluateMissingPolicy(
  policy: MissingPolicy | null,
): MissingPolicyResult {
  // Null = 0 (no policy = no governance)
  if (!policy) {
    return {
      fieldsCompliant: 0,
      totalFields: 7,
      complianceRate: null,
      score: 0,
    };
  }

  // 7 boolean fields scored at different weights totalling 25
  let score = 0;
  let fieldsCompliant = 0;

  // missingProtocolInPlace: 5 (critical)
  if (policy.missingProtocolInPlace) { score += 5; fieldsCompliant++; }
  // riskAssessmentFramework: 4
  if (policy.riskAssessmentFramework) { score += 4; fieldsCompliant++; }
  // returnInterviewProcess: 4
  if (policy.returnInterviewProcess) { score += 4; fieldsCompliant++; }
  // preventionStrategy: 4
  if (policy.preventionStrategy) { score += 4; fieldsCompliant++; }
  // multiAgencyProtocol: 3
  if (policy.multiAgencyProtocol) { score += 3; fieldsCompliant++; }
  // regularReview: 3
  if (policy.regularReview) { score += 3; fieldsCompliant++; }
  // staffGuidanceClear: 2
  if (policy.staffGuidanceClear) { score += 2; fieldsCompliant++; }

  const complianceRate = rate(fieldsCompliant, 7);

  return {
    fieldsCompliant,
    totalFields: 7,
    complianceRate,
    score: Math.max(0, Math.min(25, score)),
  };
}

// ── Evaluator 4: Staff Missing Readiness (0-25) ───────────────────────────

export function evaluateStaffMissingReadiness(
  training: StaffMissingTraining[],
): StaffMissingReadinessResult {
  // Empty = 0 (no trained staff)
  if (training.length === 0) {
    return {
      totalStaff: 0,
      averageCompetencyRate: null,
      competencyBreakdown: {
        missingProtocol: 0,
        riskAssessment: 0,
        returnInterviews: 0,
        preventionStrategies: 0,
        multiAgencyWorking: 0,
        recordKeeping: 0,
      },
      score: 0,
    };
  }

  const total = training.length;

  // 6 boolean training fields scored at different weights totalling 25
  const missingProtocolCount = training.filter((t) => t.missingProtocol).length;
  const riskAssessmentCount = training.filter((t) => t.riskAssessment).length;
  const returnInterviewsCount = training.filter((t) => t.returnInterviews).length;
  const preventionStrategiesCount = training.filter((t) => t.preventionStrategies).length;
  const multiAgencyWorkingCount = training.filter((t) => t.multiAgencyWorking).length;
  const recordKeepingCount = training.filter((t) => t.recordKeeping).length;

  const missingProtocolRate = rate(missingProtocolCount, total);
  const riskAssessmentRate = rate(riskAssessmentCount, total);
  const returnInterviewsRate = rate(returnInterviewsCount, total);
  const preventionStrategiesRate = rate(preventionStrategiesCount, total);
  const multiAgencyWorkingRate = rate(multiAgencyWorkingCount, total);
  const recordKeepingRate = rate(recordKeepingCount, total);

  // Weighted scoring: missingProtocol(5) + riskAssessment(5) + returnInterviews(5)
  //                   + preventionStrategies(4) + multiAgencyWorking(3) + recordKeeping(3) = 25
  let score = 0;
  score += ((missingProtocolRate ?? 0) / 100) * 5;
  score += ((riskAssessmentRate ?? 0) / 100) * 5;
  score += ((returnInterviewsRate ?? 0) / 100) * 5;
  score += ((preventionStrategiesRate ?? 0) / 100) * 4;
  score += ((multiAgencyWorkingRate ?? 0) / 100) * 3;
  score += ((recordKeepingRate ?? 0) / 100) * 3;

  score = Math.max(0, Math.min(25, Math.round(score)));

  const allRates = [
    missingProtocolRate,
    riskAssessmentRate,
    returnInterviewsRate,
    preventionStrategiesRate,
    multiAgencyWorkingRate,
    recordKeepingRate,
  ];
  const averageCompetencyRate = meanOf(allRates) ?? 0; // unmeasured areas drop from the mean; none measured = 0

  return {
    totalStaff: total,
    averageCompetencyRate,
    competencyBreakdown: {
      missingProtocol: missingProtocolRate,
      riskAssessment: riskAssessmentRate,
      returnInterviews: returnInterviewsRate,
      preventionStrategies: preventionStrategiesRate,
      multiAgencyWorking: multiAgencyWorkingRate,
      recordKeeping: recordKeepingRate,
    },
    score,
  };
}

// ── Build Child Missing Profiles ───────────────────────────────────────────

export function buildChildMissingProfiles(
  episodes: MissingEpisode[],
): ChildMissingProfile[] {
  if (episodes.length === 0) return [];

  const childMap = new Map<string, { childId: string; childName: string; episodes: MissingEpisode[] }>();

  for (const ep of episodes) {
    if (!childMap.has(ep.childId)) {
      childMap.set(ep.childId, { childId: ep.childId, childName: ep.childName, episodes: [] });
    }
    childMap.get(ep.childId)!.episodes.push(ep);
  }

  return Array.from(childMap.values()).map((child) => {
    const eps = child.episodes;
    const totalEpisodes = eps.length;
    const highRiskEpisodes = eps.filter(
      (e) => e.riskLevel === "high" || e.riskLevel === "very_high",
    ).length;

    const riCompleted = eps.filter((e) => e.returnInterviewCompleted).length;
    const returnInterviewRate = rate(riCompleted, totalEpisodes)!;

    const triggersIdentified = eps.filter((e) => e.triggerIdentified).length;
    const triggerIdentifiedRate = rate(triggersIdentified, totalEpisodes)!;

    // Overall score 0-10 based on:
    // - fewer episodes = better (deduct per episode, cap at -4)
    // - high risk episodes penalised further
    // - return interview completion helps
    // - trigger identification helps
    let overallScore = 10;
    overallScore -= Math.min(4, totalEpisodes);
    overallScore -= Math.min(3, highRiskEpisodes * 1.5);
    // Credit back for good practice
    overallScore += ((returnInterviewRate ?? 0) / 100) * 2;
    overallScore += ((triggerIdentifiedRate ?? 0) / 100) * 1;
    overallScore = Math.max(0, Math.min(10, Math.round(overallScore * 10) / 10));

    return {
      childId: child.childId,
      childName: child.childName,
      totalEpisodes,
      highRiskEpisodes,
      returnInterviewRate,
      triggerIdentifiedRate,
      overallScore,
    };
  });
}

// ── Insight Generation ─────────────────────────────────────────────────────

function generateStrengths(
  episodeMgmt: EpisodeManagementResult,
  prevention: PreventionEffectivenessResult,
  policyResult: MissingPolicyResult,
  staffResult: StaffMissingReadinessResult,
  totalEpisodes: number,
  overallScore: number,
): string[] {
  const strengths: string[] = [];

  if (overallScore >= 80) {
    strengths.push("Overall missing/absent episodes management rated Outstanding (" + overallScore + "/100)");
  } else if (overallScore >= 60) {
    strengths.push("Overall missing/absent episodes management rated Good (" + overallScore + "/100)");
  }

  if (totalEpisodes === 0) {
    strengths.push("No missing or absent episodes recorded in period — excellent prevention and stability");
  }

  if (totalEpisodes > 0 && meets(episodeMgmt.returnInterviewCompletionRate, 90)) {
    strengths.push("Excellent return interview completion rate: " + episodeMgmt.returnInterviewCompletionRate + "% of episodes followed up with return home interviews");
  }

  if (totalEpisodes > 0 && meets(episodeMgmt.returnInterviewTimelyRate, 90)) {
    strengths.push("Return interviews conducted within 72 hours in " + episodeMgmt.returnInterviewTimelyRate + "% of episodes — exceeding statutory guidance");
  }

  if (totalEpisodes > 0 && meets(episodeMgmt.policeNotificationRate, 90) && meets(episodeMgmt.localAuthorityNotificationRate, 90)) {
    strengths.push("Strong notification compliance: police and local authority informed in the vast majority of episodes");
  }

  if (totalEpisodes > 0 && meets(prevention.triggerIdentificationRate, 80)) {
    strengths.push("Trigger identification rate at " + prevention.triggerIdentificationRate + "% — staff understand the reasons behind missing episodes");
  }

  if (totalEpisodes > 0 && meets(prevention.preventionPlanUpdateRate, 80)) {
    strengths.push("Prevention plans updated in " + prevention.preventionPlanUpdateRate + "% of episodes — proactive approach to reducing recurrence");
  }

  if (totalEpisodes > 0 && meets(prevention.selfReturnRate, 50)) {
    strengths.push("Self-return rate of " + prevention.selfReturnRate + "% suggests children feel safe returning to the home");
  }

  if (policyResult.score >= 20) {
    strengths.push("Comprehensive missing persons policy framework in place (" + policyResult.fieldsCompliant + "/" + policyResult.totalFields + " areas covered)");
  }

  if (meets(staffResult.averageCompetencyRate, 90)) {
    strengths.push("Staff training in missing episodes management is excellent — " + staffResult.averageCompetencyRate + "% average competency rate");
  }

  return strengths;
}

function generateAreasForImprovement(
  episodeMgmt: EpisodeManagementResult,
  prevention: PreventionEffectivenessResult,
  policyResult: MissingPolicyResult,
  staffResult: StaffMissingReadinessResult,
  totalEpisodes: number,
  overallScore: number,
): string[] {
  const areas: string[] = [];

  if (overallScore < 40) {
    areas.push("Overall missing/absent episodes management rated Inadequate (" + overallScore + "/100) — urgent systemic review required");
  } else if (overallScore < 60) {
    areas.push("Overall missing/absent episodes management Requires Improvement (" + overallScore + "/100)");
  }

  if (totalEpisodes > 0 && below(episodeMgmt.returnInterviewCompletionRate, 70)) {
    areas.push("Return interview completion at " + episodeMgmt.returnInterviewCompletionRate + "% — statutory guidance requires interviews for all returned children");
  }

  if (totalEpisodes > 0 && below(episodeMgmt.returnInterviewTimelyRate, 70)) {
    areas.push("Return interview timeliness at " + episodeMgmt.returnInterviewTimelyRate + "% — interviews must be conducted within 72 hours of return");
  }

  if (totalEpisodes > 0 && below(episodeMgmt.policeNotificationRate, 80)) {
    areas.push("Police notification rate at " + episodeMgmt.policeNotificationRate + "% — all missing episodes should be reported to police");
  }

  if (totalEpisodes > 0 && below(episodeMgmt.localAuthorityNotificationRate, 80)) {
    areas.push("Local authority notification rate at " + episodeMgmt.localAuthorityNotificationRate + "% — CHR 2015 Reg 34 requires prompt notification");
  }

  if (totalEpisodes > 0 && below(prevention.triggerIdentificationRate, 60)) {
    areas.push("Trigger identification rate at " + prevention.triggerIdentificationRate + "% — understanding triggers is essential for prevention");
  }

  if (totalEpisodes > 0 && below(prevention.preventionPlanUpdateRate, 60)) {
    areas.push("Prevention plan update rate at " + prevention.preventionPlanUpdateRate + "% — plans must be reviewed after every episode");
  }

  if (totalEpisodes > 0 && below(prevention.resolutionRate, 90)) {
    areas.push("Episode resolution rate at " + prevention.resolutionRate + "% — unresolved episodes require immediate escalation");
  }

  if (policyResult.score < 15) {
    areas.push("Missing persons policy only covers " + policyResult.fieldsCompliant + " of " + policyResult.totalFields + " required areas — significant governance gaps");
  }

  if (staffResult.score === 0) {
    areas.push("No staff training records for missing episodes management — staff readiness cannot be evidenced");
  } else if (below(staffResult.averageCompetencyRate, 60)) {
    areas.push("Staff average competency rate at " + staffResult.averageCompetencyRate + "% — training programme needs strengthening");
  }

  return areas;
}

function generateActions(
  episodeMgmt: EpisodeManagementResult,
  prevention: PreventionEffectivenessResult,
  policyResult: MissingPolicyResult,
  staffResult: StaffMissingReadinessResult,
  childProfiles: ChildMissingProfile[],
  totalEpisodes: number,
): string[] {
  const actions: string[] = [];

  // Children with high-risk profiles
  const highRiskChildren = childProfiles.filter((p) => p.highRiskEpisodes > 0);
  for (const child of highRiskChildren) {
    actions.push(
      "URGENT: " + child.childName + " has " + child.highRiskEpisodes + " high-risk missing episode(s) — convene multi-agency strategy meeting and review risk assessment.",
    );
  }

  // Still-missing episodes (check risk breakdown for very_high)
  if (episodeMgmt.riskBreakdown.very_high > 0) {
    actions.push(
      "URGENT: " + episodeMgmt.riskBreakdown.very_high + " episode(s) at very high risk level — ensure active police liaison and escalation to senior management.",
    );
  }

  // Poor return interview completion
  if (totalEpisodes > 0 && below(episodeMgmt.returnInterviewCompletionRate, 70)) {
    actions.push(
      "HIGH: Return interview completion at " + episodeMgmt.returnInterviewCompletionRate + "% — implement tracking system to ensure all returned children receive independent interviews.",
    );
  }

  // Poor notification compliance
  if (totalEpisodes > 0 && (below(episodeMgmt.policeNotificationRate, 80) || below(episodeMgmt.localAuthorityNotificationRate, 80))) {
    actions.push(
      "HIGH: Notification compliance below threshold — review and reinforce reporting procedures for police and local authority notifications.",
    );
  }

  // Policy gaps
  if (policyResult.score === 0) {
    actions.push(
      "URGENT: No missing persons policy in place — develop comprehensive protocol covering all 7 required areas immediately.",
    );
  } else if (policyResult.score < 15) {
    actions.push(
      "HIGH: Missing persons policy has gaps — review and update to cover all " + policyResult.totalFields + " required areas.",
    );
  }

  // Staff training
  if (staffResult.score === 0) {
    actions.push(
      "URGENT: No staff training in missing episodes management — implement mandatory training programme for all staff.",
    );
  } else if (below(staffResult.averageCompetencyRate, 60)) {
    actions.push(
      "HIGH: Staff competency at " + staffResult.averageCompetencyRate + "% — schedule refresher training across all 6 competency areas.",
    );
  }

  // Trigger identification
  if (totalEpisodes > 0 && below(prevention.triggerIdentificationRate, 60)) {
    actions.push(
      "MEDIUM: Trigger identification rate at " + prevention.triggerIdentificationRate + "% — train staff in root cause analysis and improve debrief processes.",
    );
  }

  // Prevention plans
  if (totalEpisodes > 0 && below(prevention.preventionPlanUpdateRate, 60)) {
    actions.push(
      "MEDIUM: Prevention plans updated in only " + prevention.preventionPlanUpdateRate + "% of episodes — integrate plan reviews into post-episode procedures.",
    );
  }

  if (actions.length === 0) {
    actions.push(
      "No immediate actions required. Missing/absent episodes management is operating within expected standards.",
    );
  }

  return actions;
}

function generateRegulatoryLinksForResult(): string[] {
  return [
    "CHR 2015, Reg 12 — Protection of children",
    "CHR 2015, Reg 34 — Notification of significant events",
    "SCCIF — Social Care Common Inspection Framework",
    "Children Act 1989 — Duty of care for looked-after children",
    "Statutory guidance on children who run away or go missing from home or care (2014)",
    "NMS 5 — Enjoying and achieving",
    "DfE Missing Children protocol",
  ];
}

// ── Main Orchestrator ──────────────────────────────────────────────────────

export function generateMissingAbsentEpisodesIntelligence(
  episodes: MissingEpisode[],
  policy: MissingPolicy | null,
  training: StaffMissingTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): MissingAbsentEpisodesIntelligence {
  const assessedAt = new Date().toISOString();

  // Call all 4 evaluators
  const episodeManagement = evaluateEpisodeManagement(episodes);
  const preventionEffectiveness = evaluatePreventionEffectiveness(episodes);
  const missingPolicy = evaluateMissingPolicy(policy);
  const staffReadiness = evaluateStaffMissingReadiness(training);

  // Sum scores (max 100)
  const overallScore = Math.max(
    0,
    Math.min(
      100,
      episodeManagement.score +
        preventionEffectiveness.score +
        missingPolicy.score +
        staffReadiness.score,
    ),
  );

  const rating = getRating(overallScore);

  // Build child profiles
  const childProfiles = buildChildMissingProfiles(episodes);

  // Generate insights
  const strengths = generateStrengths(
    episodeManagement,
    preventionEffectiveness,
    missingPolicy,
    staffReadiness,
    episodes.length,
    overallScore,
  );
  const areasForImprovement = generateAreasForImprovement(
    episodeManagement,
    preventionEffectiveness,
    missingPolicy,
    staffReadiness,
    episodes.length,
    overallScore,
  );
  const actions = generateActions(
    episodeManagement,
    preventionEffectiveness,
    missingPolicy,
    staffReadiness,
    childProfiles,
    episodes.length,
  );
  const regulatoryLinks = generateRegulatoryLinksForResult();

  return {
    homeId,
    assessedAt,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    episodeManagement,
    preventionEffectiveness,
    missingPolicy,
    staffReadiness,
    totalEpisodes: episodes.length,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
