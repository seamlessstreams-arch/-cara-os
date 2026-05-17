// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Sanctions & Rewards Engine
//
// Deterministic engine for evaluating behaviour management compliance,
// proportionality of sanctions, prohibited punishments detection, rewards
// balance, and recording quality.
//
// Aligned to:
//   - CHR 2015 Reg 19 — Behaviour management
//   - CHR 2015 Reg 20 — Restraint (cross-ref: restraint engine)
//   - CHR 2015 Reg 45 — Records and notifications
//   - SCCIF — Behaviour management approaches
//   - Children Act 1989 s.31A — Care plan (behaviour strategies)
//   - Positive behaviour support principles
//
// Key requirements:
//   - No prohibited punishments (corporal, deprivation of food, medication,
//     clothing, sleep, contact, ridicule)
//   - Sanctions must be proportionate and related to behaviour
//   - Sanctions must be recorded with reason, child's view, duration
//   - Children must understand behaviour expectations
//   - Rewards must be used as primary approach (positive reinforcement)
//   - Patterns monitored — escalation, over-reliance, targeting
//   - De-escalation always attempted before sanctions
//   - Child's voice recorded for every sanction
//   - Review of sanctions if repeated for same child
//
// No AI. No external calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ──────────────────────────────────────────────────────────────────

export type SanctionType =
  | "loss_of_privilege"
  | "early_bedtime"
  | "reparation"
  | "additional_chore"
  | "reduced_screen_time"
  | "grounding"
  | "restorative_conversation"
  | "written_apology"
  | "time_out"
  | "other";

export type RewardType =
  | "verbal_praise"
  | "activity_reward"
  | "extra_privilege"
  | "pocket_money_bonus"
  | "special_outing"
  | "certificate"
  | "points_token"
  | "other";

export type ProhibitedPunishmentType =
  | "corporal"
  | "deprivation_of_food"
  | "restriction_of_contact"
  | "deprivation_of_sleep"
  | "deprivation_of_clothing"
  | "use_of_medication"
  | "fining_from_pocket_money"
  | "ridicule_or_humiliation"
  | "collective_punishment"
  | "threat_of_above";

export type Proportionality = "proportionate" | "disproportionate" | "unclear";

export type SanctionStatus = "active" | "completed" | "rescinded" | "under_review";

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface SanctionRecord {
  id: string;
  homeId: string;
  childId: string;
  childName: string;
  date: string;
  type: SanctionType;
  description: string;
  reason: string;
  behaviour: string;
  duration?: string;                      // e.g. "2 hours", "remainder of evening"
  status: SanctionStatus;
  // Compliance fields
  childInformed: boolean;
  childView?: string;
  childAgreed?: boolean;
  deEscalationAttempted: boolean;
  deEscalationMethods?: string[];
  proportionality: Proportionality;
  linkedToBehaviour: boolean;
  recordedBy: string;
  reviewedByManager: boolean;
  managerNotes?: string;
  // Prohibited check
  isProhibited: boolean;
  prohibitedType?: ProhibitedPunishmentType;
  // Context
  timeOfDay: string;                      // e.g. "morning", "afternoon", "evening"
  witnesses?: string[];
  parentCarerInformed?: boolean;
  socialWorkerInformed?: boolean;
}

export interface RewardRecord {
  id: string;
  homeId: string;
  childId: string;
  childName: string;
  date: string;
  type: RewardType;
  description: string;
  reason: string;
  awardedBy: string;
}

export interface ChildBehaviourProfile {
  childId: string;
  childName: string;
  homeId: string;
  sanctions: SanctionRecord[];
  rewards: RewardRecord[];
  behaviourPlanInPlace: boolean;
  behaviourPlanReviewDate?: string;
  positiveHandlingPlanExists: boolean;
  keyBehaviourTargets: string[];
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface SanctionComplianceResult {
  childId: string;
  childName: string;
  isCompliant: boolean;
  issues: string[];
  warnings: string[];
  // Stats
  totalSanctions30Days: number;
  totalRewards30Days: number;
  rewardToSanctionRatio: number;           // >2:1 target
  // Prohibited
  prohibitedPunishmentsDetected: number;
  // Quality
  childViewRecordedRate: number;           // %
  deEscalationAttemptRate: number;         // %
  proportionalityRate: number;             // %
  managerReviewRate: number;               // %
  linkedToBehaviourRate: number;           // %
  // Patterns
  escalatingPattern: boolean;
  mostCommonSanctionType: string;
  mostCommonBehaviour: string;
  sanctionsByTimeOfDay: Record<string, number>;
  // Plan
  behaviourPlanCurrent: boolean;
  behaviourPlanOverdue: boolean;
}

export interface HomeSanctionsMetrics {
  homeId: string;
  // Volume
  totalSanctions30Days: number;
  totalSanctions90Days: number;
  totalRewards30Days: number;
  totalRewards90Days: number;
  rewardToSanctionRatio: number;
  // Quality
  overallComplianceRate: number;
  prohibitedPunishmentCount: number;
  childViewRecordedRate: number;
  deEscalationAttemptRate: number;
  proportionalityRate: number;
  managerReviewRate: number;
  // Patterns
  sanctionsByChild: { childName: string; count: number }[];
  sanctionsByType: { type: string; count: number }[];
  rewardsByType: { type: string; count: number }[];
  topBehaviours: { behaviour: string; count: number }[];
  // Trend
  averageSanctionsPerMonth: number;
  trendDirection: "increasing" | "decreasing" | "stable";
  // Plans
  childrenWithBehaviourPlan: number;
  childrenWithoutBehaviourPlan: number;
  overduePlanReviews: number;
  // Issues
  complianceIssues: string[];
}

// ── Configuration ──────────────────────────────────────────────────────────

const REWARD_TO_SANCTION_TARGET = 2;       // Minimum 2:1 rewards-to-sanctions
const PLAN_REVIEW_INTERVAL_DAYS = 90;
const ESCALATION_THRESHOLD = 3;            // Sanctions in 7 days = escalating

// ── Core: Evaluate Child Sanction Compliance ──────────────────────────────

export function evaluateChildSanctionCompliance(
  profile: ChildBehaviourProfile,
  now?: string,
): SanctionComplianceResult {
  const currentTime = now ? new Date(now).getTime() : Date.now();
  const thirtyDaysAgo = currentTime - 30 * 24 * 60 * 60 * 1000;
  const sevenDaysAgo = currentTime - 7 * 24 * 60 * 60 * 1000;

  const issues: string[] = [];
  const warnings: string[] = [];

  // Recent sanctions and rewards
  const sanctions30 = profile.sanctions.filter(
    s => new Date(s.date).getTime() > thirtyDaysAgo
  );
  const rewards30 = profile.rewards.filter(
    r => new Date(r.date).getTime() > thirtyDaysAgo
  );
  const sanctions7 = profile.sanctions.filter(
    s => new Date(s.date).getTime() > sevenDaysAgo
  );

  const totalSanctions30Days = sanctions30.length;
  const totalRewards30Days = rewards30.length;
  const rewardToSanctionRatio = totalSanctions30Days > 0
    ? Math.round((totalRewards30Days / totalSanctions30Days) * 10) / 10
    : totalRewards30Days > 0 ? 99 : 0;

  if (totalSanctions30Days > 0 && rewardToSanctionRatio < REWARD_TO_SANCTION_TARGET) {
    warnings.push(
      `Reward-to-sanction ratio is ${rewardToSanctionRatio}:1 (target: ${REWARD_TO_SANCTION_TARGET}:1)`
    );
  }

  // Prohibited punishments
  const prohibitedPunishments = profile.sanctions.filter(s => s.isProhibited);
  const prohibitedPunishmentsDetected = prohibitedPunishments.length;
  if (prohibitedPunishmentsDetected > 0) {
    issues.push(
      `${prohibitedPunishmentsDetected} prohibited punishment(s) recorded — immediate action required`
    );
  }

  // Child view recorded
  const withChildView = sanctions30.filter(s => s.childView && s.childView.trim().length > 0);
  const childViewRecordedRate = sanctions30.length > 0
    ? Math.round((withChildView.length / sanctions30.length) * 100)
    : 100;
  if (sanctions30.length > 0 && childViewRecordedRate < 100) {
    issues.push(`Child's view not recorded for ${sanctions30.length - withChildView.length} sanction(s)`);
  }

  // De-escalation attempted
  const withDeEscalation = sanctions30.filter(s => s.deEscalationAttempted);
  const deEscalationAttemptRate = sanctions30.length > 0
    ? Math.round((withDeEscalation.length / sanctions30.length) * 100)
    : 100;
  if (sanctions30.length > 0 && deEscalationAttemptRate < 100) {
    warnings.push(`De-escalation not attempted before ${sanctions30.length - withDeEscalation.length} sanction(s)`);
  }

  // Proportionality
  const proportionate = sanctions30.filter(s => s.proportionality === "proportionate");
  const proportionalityRate = sanctions30.length > 0
    ? Math.round((proportionate.length / sanctions30.length) * 100)
    : 100;
  if (sanctions30.length > 0 && proportionalityRate < 100) {
    const disproportionate = sanctions30.filter(s => s.proportionality === "disproportionate");
    if (disproportionate.length > 0) {
      issues.push(`${disproportionate.length} sanction(s) assessed as disproportionate`);
    }
  }

  // Manager review
  const reviewed = sanctions30.filter(s => s.reviewedByManager);
  const managerReviewRate = sanctions30.length > 0
    ? Math.round((reviewed.length / sanctions30.length) * 100)
    : 100;
  if (sanctions30.length > 0 && managerReviewRate < 100) {
    warnings.push(`${sanctions30.length - reviewed.length} sanction(s) not yet reviewed by manager`);
  }

  // Linked to behaviour
  const linked = sanctions30.filter(s => s.linkedToBehaviour);
  const linkedToBehaviourRate = sanctions30.length > 0
    ? Math.round((linked.length / sanctions30.length) * 100)
    : 100;
  if (sanctions30.length > 0 && linkedToBehaviourRate < 100) {
    warnings.push(`${sanctions30.length - linked.length} sanction(s) not clearly linked to specific behaviour`);
  }

  // Escalation pattern
  const escalatingPattern = sanctions7.length >= ESCALATION_THRESHOLD;
  if (escalatingPattern) {
    warnings.push(
      `Escalating pattern: ${sanctions7.length} sanctions in last 7 days — review behaviour strategy`
    );
  }

  // Most common sanction type
  const typeCounts: Record<string, number> = {};
  sanctions30.forEach(s => { typeCounts[s.type] = (typeCounts[s.type] || 0) + 1; });
  const mostCommonSanctionType = Object.entries(typeCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0] ?? "none";

  // Most common behaviour
  const behaviourCounts: Record<string, number> = {};
  sanctions30.forEach(s => { behaviourCounts[s.behaviour] = (behaviourCounts[s.behaviour] || 0) + 1; });
  const mostCommonBehaviour = Object.entries(behaviourCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0] ?? "none";

  // Sanctions by time of day
  const sanctionsByTimeOfDay: Record<string, number> = {};
  sanctions30.forEach(s => {
    sanctionsByTimeOfDay[s.timeOfDay] = (sanctionsByTimeOfDay[s.timeOfDay] || 0) + 1;
  });

  // Behaviour plan
  let behaviourPlanCurrent = false;
  let behaviourPlanOverdue = false;
  if (profile.behaviourPlanInPlace) {
    if (profile.behaviourPlanReviewDate) {
      const reviewDue = new Date(profile.behaviourPlanReviewDate).getTime();
      behaviourPlanCurrent = reviewDue > currentTime;
      behaviourPlanOverdue = reviewDue <= currentTime;
    } else {
      behaviourPlanCurrent = true;
    }
  }

  if (!profile.behaviourPlanInPlace && totalSanctions30Days >= 3) {
    issues.push("No behaviour plan in place despite 3+ sanctions in 30 days");
  }
  if (behaviourPlanOverdue) {
    warnings.push("Behaviour plan review is overdue");
  }

  return {
    childId: profile.childId,
    childName: profile.childName,
    isCompliant: issues.length === 0,
    issues,
    warnings,
    totalSanctions30Days,
    totalRewards30Days,
    rewardToSanctionRatio,
    prohibitedPunishmentsDetected,
    childViewRecordedRate,
    deEscalationAttemptRate,
    proportionalityRate,
    managerReviewRate,
    linkedToBehaviourRate,
    escalatingPattern,
    mostCommonSanctionType,
    mostCommonBehaviour,
    sanctionsByTimeOfDay,
    behaviourPlanCurrent,
    behaviourPlanOverdue,
  };
}

// ── Core: Calculate Home Sanctions Metrics ──────────────────────────────

export function calculateHomeSanctionsMetrics(
  profiles: ChildBehaviourProfile[],
  homeId: string,
  now?: string,
): HomeSanctionsMetrics {
  const currentTime = now ? new Date(now).getTime() : Date.now();
  const thirtyDaysAgo = currentTime - 30 * 24 * 60 * 60 * 1000;
  const ninetyDaysAgo = currentTime - 90 * 24 * 60 * 60 * 1000;

  const homeProfiles = profiles.filter(p => p.homeId === homeId);
  const allSanctions = homeProfiles.flatMap(p => p.sanctions);
  const allRewards = homeProfiles.flatMap(p => p.rewards);

  const sanctions30 = allSanctions.filter(s => new Date(s.date).getTime() > thirtyDaysAgo);
  const sanctions90 = allSanctions.filter(s => new Date(s.date).getTime() > ninetyDaysAgo);
  const rewards30 = allRewards.filter(r => new Date(r.date).getTime() > thirtyDaysAgo);
  const rewards90 = allRewards.filter(r => new Date(r.date).getTime() > ninetyDaysAgo);

  const totalSanctions30Days = sanctions30.length;
  const totalSanctions90Days = sanctions90.length;
  const totalRewards30Days = rewards30.length;
  const totalRewards90Days = rewards90.length;

  const rewardToSanctionRatio = totalSanctions30Days > 0
    ? Math.round((totalRewards30Days / totalSanctions30Days) * 10) / 10
    : totalRewards30Days > 0 ? 99 : 0;

  // Quality metrics on 30-day sanctions
  const prohibitedPunishmentCount = sanctions30.filter(s => s.isProhibited).length;
  const childViewRecordedRate = sanctions30.length > 0
    ? Math.round((sanctions30.filter(s => s.childView && s.childView.trim().length > 0).length / sanctions30.length) * 100)
    : 100;
  const deEscalationAttemptRate = sanctions30.length > 0
    ? Math.round((sanctions30.filter(s => s.deEscalationAttempted).length / sanctions30.length) * 100)
    : 100;
  const proportionalityRate = sanctions30.length > 0
    ? Math.round((sanctions30.filter(s => s.proportionality === "proportionate").length / sanctions30.length) * 100)
    : 100;
  const managerReviewRate = sanctions30.length > 0
    ? Math.round((sanctions30.filter(s => s.reviewedByManager).length / sanctions30.length) * 100)
    : 100;

  // Overall compliance (individual evaluations)
  const results = homeProfiles.map(p => evaluateChildSanctionCompliance(p, now));
  const compliantCount = results.filter(r => r.isCompliant).length;
  const overallComplianceRate = homeProfiles.length > 0
    ? Math.round((compliantCount / homeProfiles.length) * 100)
    : 100;

  // Sanctions by child
  const sanctionsByChild: { childName: string; count: number }[] = [];
  homeProfiles.forEach(p => {
    const count = p.sanctions.filter(s => new Date(s.date).getTime() > thirtyDaysAgo).length;
    if (count > 0) sanctionsByChild.push({ childName: p.childName, count });
  });
  sanctionsByChild.sort((a, b) => b.count - a.count);

  // Sanctions by type
  const typeMap: Record<string, number> = {};
  sanctions30.forEach(s => { typeMap[s.type] = (typeMap[s.type] || 0) + 1; });
  const sanctionsByType = Object.entries(typeMap)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);

  // Rewards by type
  const rewardTypeMap: Record<string, number> = {};
  rewards30.forEach(r => { rewardTypeMap[r.type] = (rewardTypeMap[r.type] || 0) + 1; });
  const rewardsByType = Object.entries(rewardTypeMap)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);

  // Top behaviours
  const behaviourMap: Record<string, number> = {};
  sanctions30.forEach(s => { behaviourMap[s.behaviour] = (behaviourMap[s.behaviour] || 0) + 1; });
  const topBehaviours = Object.entries(behaviourMap)
    .map(([behaviour, count]) => ({ behaviour, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Trend
  const averageSanctionsPerMonth = totalSanctions90Days > 0
    ? Math.round((totalSanctions90Days / 3) * 10) / 10
    : 0;

  // Compare first month to last month of 90-day window
  const sixtyDaysAgo = currentTime - 60 * 24 * 60 * 60 * 1000;
  const firstMonth = allSanctions.filter(
    s => new Date(s.date).getTime() > ninetyDaysAgo && new Date(s.date).getTime() <= sixtyDaysAgo
  ).length;
  const lastMonth = sanctions30.length;
  let trendDirection: "increasing" | "decreasing" | "stable" = "stable";
  if (lastMonth > firstMonth + 1) trendDirection = "increasing";
  else if (lastMonth < firstMonth - 1) trendDirection = "decreasing";

  // Plans
  const childrenWithBehaviourPlan = homeProfiles.filter(p => p.behaviourPlanInPlace).length;
  const childrenWithoutBehaviourPlan = homeProfiles.length - childrenWithBehaviourPlan;
  const overduePlanReviews = homeProfiles.filter(p => {
    if (!p.behaviourPlanInPlace || !p.behaviourPlanReviewDate) return false;
    return new Date(p.behaviourPlanReviewDate).getTime() <= currentTime;
  }).length;

  // Compliance issues
  const complianceIssues = [...new Set(results.flatMap(r => r.issues))];

  return {
    homeId,
    totalSanctions30Days,
    totalSanctions90Days,
    totalRewards30Days,
    totalRewards90Days,
    rewardToSanctionRatio,
    overallComplianceRate,
    prohibitedPunishmentCount,
    childViewRecordedRate,
    deEscalationAttemptRate,
    proportionalityRate,
    managerReviewRate,
    sanctionsByChild,
    sanctionsByType,
    rewardsByType,
    topBehaviours,
    averageSanctionsPerMonth,
    trendDirection,
    childrenWithBehaviourPlan,
    childrenWithoutBehaviourPlan,
    overduePlanReviews,
    complianceIssues,
  };
}

// ── Label Helpers ────────────────────────────────────────────────────────

export function getSanctionTypeLabel(type: SanctionType): string {
  const labels: Record<SanctionType, string> = {
    loss_of_privilege: "Loss of Privilege",
    early_bedtime: "Early Bedtime",
    reparation: "Reparation",
    additional_chore: "Additional Chore",
    reduced_screen_time: "Reduced Screen Time",
    grounding: "Grounding",
    restorative_conversation: "Restorative Conversation",
    written_apology: "Written Apology",
    time_out: "Time Out",
    other: "Other",
  };
  return labels[type] ?? type;
}

export function getRewardTypeLabel(type: RewardType): string {
  const labels: Record<RewardType, string> = {
    verbal_praise: "Verbal Praise",
    activity_reward: "Activity Reward",
    extra_privilege: "Extra Privilege",
    pocket_money_bonus: "Pocket Money Bonus",
    special_outing: "Special Outing",
    certificate: "Certificate",
    points_token: "Points/Token",
    other: "Other",
  };
  return labels[type] ?? type;
}

export function getProhibitedPunishmentLabel(type: ProhibitedPunishmentType): string {
  const labels: Record<ProhibitedPunishmentType, string> = {
    corporal: "Corporal Punishment",
    deprivation_of_food: "Deprivation of Food",
    restriction_of_contact: "Restriction of Contact",
    deprivation_of_sleep: "Deprivation of Sleep",
    deprivation_of_clothing: "Deprivation of Clothing",
    use_of_medication: "Use of Medication as Punishment",
    fining_from_pocket_money: "Fining from Pocket Money",
    ridicule_or_humiliation: "Ridicule or Humiliation",
    collective_punishment: "Collective Punishment",
    threat_of_above: "Threat of Prohibited Punishment",
  };
  return labels[type] ?? type;
}
