// ══════════════════════════════════════════════════════════════════════════════
// Cara Intelligence Engine — Sanctions & Rewards Analysis
//
// Pure deterministic analysis of behaviour management for LAC.
// Tracks:
//   - Reward-to-sanction ratio (positive reinforcement emphasis)
//   - Sanction proportionality and appropriateness
//   - Effectiveness (behaviour change over time)
//   - Consistency across staff
//   - Prohibited sanctions detection
//   - Child understanding and participation
//
// Regulatory alignment:
//   - CHR 2015 Reg 19 — Behaviour management
//   - CHR 2015 Reg 19(2) — Positive relationships
//   - CHR 2015 Reg 19(3) — Prohibited sanctions
//   - SCCIF — Behaviour management judgement
//
// No AI calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ───────────────────────────────────────────────────────────────────

export type SanctionType =
  | "loss_of_privilege"
  | "earlier_bedtime"
  | "reduced_screen_time"
  | "additional_chore"
  | "grounding"
  | "removal_of_item"
  | "reparation"
  | "verbal_warning"
  | "written_warning"
  | "restorative_conversation"
  | "other";

export type RewardType =
  | "verbal_praise"
  | "activity_reward"
  | "extra_privilege"
  | "points_token"
  | "treat_outing"
  | "later_bedtime"
  | "extra_screen_time"
  | "certificate"
  | "pocket_money_bonus"
  | "other";

export type ProhibitedSanctionType =
  | "corporal_punishment"
  | "deprivation_of_food"
  | "restriction_of_contact"
  | "requiring_child_wear_distinctive_clothing"
  | "use_of_accommodation_to_restrict_liberty"
  | "fine"
  | "intimate_search";

export interface SanctionRecord {
  id: string;
  date: string;
  type: SanctionType;
  reason: string;
  duration?: string; // e.g. "1 day", "evening"
  proportionate: boolean;
  childInformed: boolean;
  childUnderstood: boolean;
  linkedToBehaviour: boolean;
  staffMember: string;
  behaviourCategory?: string;
  appealed?: boolean;
  appealOutcome?: "upheld" | "overturned" | "modified";
  followedUp: boolean;
  effectivenessRating?: number; // 1-5 from staff
  isProhibited?: boolean;
  prohibitedType?: ProhibitedSanctionType;
}

export interface RewardRecord {
  id: string;
  date: string;
  type: RewardType;
  reason: string;
  staffMember: string;
  childResponse?: "positive" | "neutral" | "dismissive";
  behaviourCategory?: string;
}

export interface SanctionsRewardsInput {
  childId: string;
  childName: string;
  age: number;
  sanctions: SanctionRecord[];
  rewards: RewardRecord[];
  hasBehaviourSupportPlan: boolean;
  bspUpToDate: boolean;
  bspReviewDate?: string;
  childParticipatedInBSP: boolean;
  sanctionPolicyExplainedToChild: boolean;
  appealsProcessExplained: boolean;
}

export interface SanctionsRewardsAssessment {
  childName: string;
  overallScore: number;
  overallRating: "excellent" | "good" | "adequate" | "requires_improvement" | "inadequate";
  positivityScore: number;
  proportionalityScore: number;
  effectivenessScore: number;
  complianceScore: number;
  totalSanctions: number;
  totalRewards: number;
  rewardToSanctionRatio: number;
  sanctionsLast30Days: number;
  rewardsLast30Days: number;
  trend: "improving" | "stable" | "worsening";
  prohibitedSanctions: number;
  staffConsistency: StaffConsistency;
  concerns: SRConcern[];
  strengths: SRStrength[];
  regulatoryFlags: RegulatoryFlag[];
  recommendations: string[];
  summary: string;
}

export interface StaffConsistency {
  totalStaff: number;
  sanctionVariation: "consistent" | "moderate_variation" | "inconsistent";
  rewardVariation: "consistent" | "moderate_variation" | "inconsistent";
  topSanctioner?: string;
  topRewarder?: string;
}

export interface SRConcern {
  severity: "critical" | "significant" | "moderate" | "low";
  category: string;
  description: string;
}

export interface SRStrength {
  category: string;
  description: string;
}

export interface RegulatoryFlag {
  regulation: string;
  area: string;
  status: "met" | "partially_met" | "not_met";
  detail: string;
}

// ── Main Engine ─────────────────────────────────────────────────────────────

export function analyseSanctionsRewards(input: SanctionsRewardsInput): SanctionsRewardsAssessment {
  const { childName, sanctions, rewards } = input;
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString().slice(0, 10);

  // ── Counts ────────────────────────────────────────────────────────────
  const totalSanctions = sanctions.length;
  const totalRewards = rewards.length;
  const sanctionsLast30 = sanctions.filter(s => s.date >= thirtyDaysAgo && s.date.slice(0, 10) <= today).length;
  const rewardsLast30 = rewards.filter(r => r.date >= thirtyDaysAgo && r.date.slice(0, 10) <= today).length;
  const ratio = totalSanctions > 0 ? totalRewards / totalSanctions : totalRewards > 0 ? 10 : 0;

  // ── Prohibited sanctions ──────────────────────────────────────────────
  const prohibitedCount = sanctions.filter(s => s.isProhibited).length;

  // ── Scores ────────────────────────────────────────────────────────────
  const positivityScore = scorePositivity(ratio, rewardsLast30, sanctionsLast30);
  const proportionalityScore = scoreProportionality(sanctions);
  const effectivenessScore = scoreEffectiveness(sanctions, rewards);
  const complianceScore = scoreCompliance(input, sanctions, prohibitedCount);

  // ── Trend ─────────────────────────────────────────────────────────────
  const trend = analyseTrend(sanctions, rewards);

  // ── Staff consistency ─────────────────────────────────────────────────
  const staffConsistency = analyseStaffConsistency(sanctions, rewards);

  // ── Overall ───────────────────────────────────────────────────────────
  const overallScore = Math.round(
    positivityScore * 0.30 +
    proportionalityScore * 0.25 +
    effectivenessScore * 0.20 +
    complianceScore * 0.25
  );
  const overallRating = scoreToRating(overallScore);

  // ── Concerns ──────────────────────────────────────────────────────────
  const concerns = identifyConcerns(input, sanctions, rewards, ratio, prohibitedCount, staffConsistency, sanctionsLast30);

  // ── Strengths ─────────────────────────────────────────────────────────
  const strengths = identifyStrengths(input, ratio, prohibitedCount, sanctions, rewards, staffConsistency);

  // ── Regulatory flags ──────────────────────────────────────────────────
  const regulatoryFlags = assessRegulatory(input, prohibitedCount, sanctions, ratio);

  // ── Recommendations ───────────────────────────────────────────────────
  const recommendations = buildRecommendations(input, ratio, prohibitedCount, sanctions, staffConsistency, trend);

  // ── Summary ───────────────────────────────────────────────────────────
  const summary = buildSummary(childName, overallRating, ratio, totalSanctions, totalRewards, trend);

  return {
    childName,
    overallScore,
    overallRating,
    positivityScore,
    proportionalityScore,
    effectivenessScore,
    complianceScore,
    totalSanctions,
    totalRewards,
    rewardToSanctionRatio: Math.round(ratio * 10) / 10,
    sanctionsLast30Days: sanctionsLast30,
    rewardsLast30Days: rewardsLast30,
    trend,
    prohibitedSanctions: prohibitedCount,
    staffConsistency,
    concerns,
    strengths,
    regulatoryFlags,
    recommendations,
    summary,
  };
}

// ── Scoring ─────────────────────────────────────────────────────────────────

function scorePositivity(ratio: number, rewardsLast30: number, sanctionsLast30: number): number {
  // Target: at least 4:1 reward-to-sanction ratio (evidence-based best practice)
  if (ratio >= 5) return 100;
  if (ratio >= 4) return 90;
  if (ratio >= 3) return 75;
  if (ratio >= 2) return 60;
  if (ratio >= 1) return 45;
  if (ratio > 0) return 30;
  // No rewards at all but sanctions exist
  if (sanctionsLast30 > 0 && rewardsLast30 === 0) return 10;
  return 50; // no data
}

function scoreProportionality(sanctions: SanctionRecord[]): number {
  if (sanctions.length === 0) return 100;
  let score = 0;
  for (const s of sanctions) {
    let sScore = 100;
    if (!s.proportionate) sScore -= 40;
    if (!s.linkedToBehaviour) sScore -= 20;
    if (!s.childInformed) sScore -= 20;
    if (!s.childUnderstood) sScore -= 15;
    if (s.isProhibited) sScore = 0;
    score += Math.max(0, sScore);
  }
  return Math.round(score / sanctions.length);
}

function scoreEffectiveness(sanctions: SanctionRecord[], rewards: RewardRecord[]): number {
  // Effectiveness based on: ratings, follow-up, child response to rewards
  if (sanctions.length === 0 && rewards.length === 0) return 50;

  let totalPoints = 0;
  let maxPoints = 0;

  // Sanctions with effectiveness ratings
  const rated = sanctions.filter(s => s.effectivenessRating !== undefined);
  if (rated.length > 0) {
    const avgRating = rated.reduce((a, s) => a + (s.effectivenessRating ?? 0), 0) / rated.length;
    totalPoints += avgRating * 20; // 0-100
    maxPoints += 100;
  }

  // Follow-up rate
  if (sanctions.length > 0) {
    const followedUp = sanctions.filter(s => s.followedUp).length;
    totalPoints += (followedUp / sanctions.length) * 100;
    maxPoints += 100;
  }

  // Reward response
  const responded = rewards.filter(r => r.childResponse !== undefined);
  if (responded.length > 0) {
    const positiveResponses = responded.filter(r => r.childResponse === "positive").length;
    totalPoints += (positiveResponses / responded.length) * 100;
    maxPoints += 100;
  }

  return maxPoints > 0 ? Math.round(totalPoints / maxPoints * 100) : 50;
}

function scoreCompliance(input: SanctionsRewardsInput, sanctions: SanctionRecord[], prohibited: number): number {
  let score = 0;

  // No prohibited sanctions (35 points)
  if (prohibited === 0) score += 35;

  // BSP in place and up to date (20 points)
  if (input.hasBehaviourSupportPlan && input.bspUpToDate) score += 20;
  else if (input.hasBehaviourSupportPlan) score += 10;

  // Child participated in BSP (15 points)
  if (input.childParticipatedInBSP) score += 15;

  // Policy explained (10 points)
  if (input.sanctionPolicyExplainedToChild) score += 10;

  // Appeals process explained (10 points)
  if (input.appealsProcessExplained) score += 10;

  // All sanctions linked to behaviour (10 points)
  if (sanctions.length > 0) {
    const linked = sanctions.filter(s => s.linkedToBehaviour).length;
    score += Math.round((linked / sanctions.length) * 10);
  } else {
    score += 10;
  }

  return Math.min(100, score);
}

// ── Trend Analysis ──────────────────────────────────────────────────────────

function analyseTrend(sanctions: SanctionRecord[], rewards: RewardRecord[]): "improving" | "stable" | "worsening" {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString().slice(0, 10);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 86400000).toISOString().slice(0, 10);

  const recentSanctions = sanctions.filter(s => s.date >= thirtyDaysAgo && s.date.slice(0, 10) <= today).length;
  const prevSanctions = sanctions.filter(s => s.date >= sixtyDaysAgo && s.date < thirtyDaysAgo).length;
  const recentRewards = rewards.filter(r => r.date >= thirtyDaysAgo && r.date.slice(0, 10) <= today).length;
  const prevRewards = rewards.filter(r => r.date >= sixtyDaysAgo && r.date < thirtyDaysAgo).length;

  // Improving: fewer sanctions OR better ratio recently
  const recentRatio = recentSanctions > 0 ? recentRewards / recentSanctions : recentRewards > 0 ? 10 : 0;
  const prevRatio = prevSanctions > 0 ? prevRewards / prevSanctions : prevRewards > 0 ? 10 : 0;

  if (recentSanctions < prevSanctions - 1 || recentRatio > prevRatio + 1) return "improving";
  if (recentSanctions > prevSanctions + 1 || recentRatio < prevRatio - 1) return "worsening";
  return "stable";
}

// ── Staff Consistency ───────────────────────────────────────────────────────

function analyseStaffConsistency(sanctions: SanctionRecord[], rewards: RewardRecord[]): StaffConsistency {
  const sanctionStaff: Record<string, number> = {};
  sanctions.forEach(s => { sanctionStaff[s.staffMember] = (sanctionStaff[s.staffMember] || 0) + 1; });

  const rewardStaff: Record<string, number> = {};
  rewards.forEach(r => { rewardStaff[r.staffMember] = (rewardStaff[r.staffMember] || 0) + 1; });

  const allStaff = new Set([...Object.keys(sanctionStaff), ...Object.keys(rewardStaff)]);
  const totalStaff = allStaff.size;

  // Variation analysis
  const sanctionCounts = Object.values(sanctionStaff);
  const sanctionVariation = analyseVariation(sanctionCounts);

  const rewardCounts = Object.values(rewardStaff);
  const rewardVariation = analyseVariation(rewardCounts);

  const topSanctioner = Object.entries(sanctionStaff).sort((a, b) => b[1] - a[1])[0]?.[0];
  const topRewarder = Object.entries(rewardStaff).sort((a, b) => b[1] - a[1])[0]?.[0];

  return {
    totalStaff,
    sanctionVariation,
    rewardVariation,
    topSanctioner,
    topRewarder,
  };
}

function analyseVariation(counts: number[]): "consistent" | "moderate_variation" | "inconsistent" {
  if (counts.length < 2) return "consistent";
  const max = Math.max(...counts);
  const min = Math.min(...counts);
  const ratio = max / (min || 1);
  if (ratio <= 2) return "consistent";
  if (ratio <= 4) return "moderate_variation";
  return "inconsistent";
}

// ── Concerns ────────────────────────────────────────────────────────────────

function identifyConcerns(
  input: SanctionsRewardsInput,
  sanctions: SanctionRecord[],
  rewards: RewardRecord[],
  ratio: number,
  prohibited: number,
  staffConsistency: StaffConsistency,
  sanctionsLast30: number,
): SRConcern[] {
  const concerns: SRConcern[] = [];

  // CRITICAL: Prohibited sanctions used
  if (prohibited > 0) {
    concerns.push({
      severity: "critical",
      category: "prohibited_sanctions",
      description: `${prohibited} prohibited sanction(s) recorded — immediate investigation required`,
    });
  }

  // Poor ratio
  if (ratio < 1 && sanctions.length >= 3) {
    concerns.push({
      severity: "significant",
      category: "balance",
      description: `More sanctions than rewards (ratio ${Math.round(ratio * 10) / 10}:1) — does not reflect positive approach`,
    });
  } else if (ratio < 2 && sanctions.length >= 3) {
    concerns.push({
      severity: "moderate",
      category: "balance",
      description: `Low reward-to-sanction ratio (${Math.round(ratio * 10) / 10}:1) — aim for at least 4:1`,
    });
  }

  // High sanction frequency
  if (sanctionsLast30 >= 10) {
    concerns.push({
      severity: "significant",
      category: "frequency",
      description: `${sanctionsLast30} sanctions in last 30 days — may indicate ineffective behaviour strategy`,
    });
  } else if (sanctionsLast30 >= 6) {
    concerns.push({
      severity: "moderate",
      category: "frequency",
      description: `${sanctionsLast30} sanctions in last 30 days — review effectiveness`,
    });
  }

  // Not proportionate
  const disproportionate = sanctions.filter(s => !s.proportionate).length;
  if (disproportionate > 0 && sanctions.length > 0) {
    const rate = disproportionate / sanctions.length;
    if (rate > 0.2) {
      concerns.push({
        severity: "significant",
        category: "proportionality",
        description: `${Math.round(rate * 100)}% of sanctions recorded as disproportionate`,
      });
    }
  }

  // Child not understanding
  const notUnderstood = sanctions.filter(s => !s.childUnderstood).length;
  if (notUnderstood > 0 && sanctions.length > 0 && notUnderstood / sanctions.length > 0.3) {
    concerns.push({
      severity: "moderate",
      category: "understanding",
      description: "Child frequently not understanding sanctions — review communication approach",
    });
  }

  // No BSP
  if (!input.hasBehaviourSupportPlan && sanctions.length >= 3) {
    concerns.push({
      severity: "significant",
      category: "care_planning",
      description: "Repeated sanctions without a Behaviour Support Plan in place",
    });
  }

  // Staff inconsistency
  if (staffConsistency.sanctionVariation === "inconsistent") {
    concerns.push({
      severity: "moderate",
      category: "consistency",
      description: "Significant variation in sanction application between staff",
    });
  }

  // Child not participated in BSP
  if (input.hasBehaviourSupportPlan && !input.childParticipatedInBSP) {
    concerns.push({
      severity: "moderate",
      category: "participation",
      description: "Child has not participated in developing their Behaviour Support Plan",
    });
  }

  return concerns;
}

// ── Strengths ───────────────────────────────────────────────────────────────

function identifyStrengths(
  input: SanctionsRewardsInput,
  ratio: number,
  prohibited: number,
  sanctions: SanctionRecord[],
  rewards: RewardRecord[],
  staffConsistency: StaffConsistency,
): SRStrength[] {
  const strengths: SRStrength[] = [];

  if (ratio >= 4 && rewards.length >= 5) {
    strengths.push({
      category: "positivity",
      description: "Excellent reward-to-sanction ratio (4:1 or better)",
    });
  } else if (ratio >= 3 && rewards.length >= 3) {
    strengths.push({
      category: "positivity",
      description: "Good positive reinforcement approach",
    });
  }

  if (prohibited === 0 && sanctions.length > 0) {
    strengths.push({
      category: "compliance",
      description: "No prohibited sanctions — appropriate behaviour management",
    });
  }

  if (sanctions.length > 0 && sanctions.every(s => s.proportionate)) {
    strengths.push({
      category: "proportionality",
      description: "All sanctions recorded as proportionate",
    });
  }

  if (input.hasBehaviourSupportPlan && input.bspUpToDate && input.childParticipatedInBSP) {
    strengths.push({
      category: "care_planning",
      description: "BSP up to date with child participation",
    });
  }

  if (staffConsistency.sanctionVariation === "consistent" && staffConsistency.totalStaff >= 3) {
    strengths.push({
      category: "consistency",
      description: "Consistent approach across staff team",
    });
  }

  if (input.sanctionPolicyExplainedToChild && input.appealsProcessExplained) {
    strengths.push({
      category: "transparency",
      description: "Child informed of policy and appeals process",
    });
  }

  return strengths;
}

// ── Regulatory Flags ────────────────────────────────────────────────────────

function assessRegulatory(
  input: SanctionsRewardsInput,
  prohibited: number,
  sanctions: SanctionRecord[],
  ratio: number,
): RegulatoryFlag[] {
  const flags: RegulatoryFlag[] = [];

  // Reg 19(3) — Prohibited sanctions
  flags.push({
    regulation: "CHR 2015 Reg 19(3)",
    area: "Prohibited Sanctions",
    status: prohibited > 0 ? "not_met" : "met",
    detail: prohibited > 0
      ? `${prohibited} prohibited sanction(s) used — serious regulatory breach`
      : "No prohibited sanctions used",
  });

  // Reg 19(2) — Positive relationships
  const positiveApproach = ratio >= 2 || (sanctions.length === 0 && input.rewards.length > 0);
  flags.push({
    regulation: "CHR 2015 Reg 19(2)",
    area: "Positive Relationships",
    status: positiveApproach ? "met" : ratio >= 1 ? "partially_met" : "not_met",
    detail: positiveApproach
      ? "Behaviour management based on positive relationships"
      : "Insufficient emphasis on positive reinforcement",
  });

  // Reg 19 — Behaviour management general
  const allProportionate = sanctions.length === 0 || sanctions.every(s => s.proportionate);
  const hasStrategy = input.hasBehaviourSupportPlan || sanctions.length < 3;
  flags.push({
    regulation: "CHR 2015 Reg 19",
    area: "Behaviour Management",
    status: (allProportionate && hasStrategy && prohibited === 0) ? "met" :
      prohibited > 0 ? "not_met" : "partially_met",
    detail: (allProportionate && hasStrategy && prohibited === 0)
      ? "Behaviour management meets regulatory standard"
      : "Behaviour management requires improvement",
  });

  // SCCIF
  const sccifMet = prohibited === 0 && ratio >= 2 && allProportionate;
  flags.push({
    regulation: "SCCIF",
    area: "Behaviour Management",
    status: sccifMet ? "met" : prohibited > 0 ? "not_met" : "partially_met",
    detail: sccifMet
      ? "Behaviour management supports children's development"
      : "Behaviour management approach requires improvement for positive outcomes",
  });

  return flags;
}

// ── Recommendations ─────────────────────────────────────────────────────────

function buildRecommendations(
  input: SanctionsRewardsInput,
  ratio: number,
  prohibited: number,
  sanctions: SanctionRecord[],
  staffConsistency: StaffConsistency,
  trend: string,
): string[] {
  const recs: string[] = [];

  if (prohibited > 0) {
    recs.push("URGENT: Investigate prohibited sanctions — notify Ofsted if not already done");
  }

  if (ratio < 3 && sanctions.length >= 3) {
    recs.push("Increase positive reinforcement — aim for at least 4:1 reward-to-sanction ratio");
  }

  if (!input.hasBehaviourSupportPlan && sanctions.length >= 3) {
    recs.push("Develop Behaviour Support Plan with child participation");
  }

  if (input.hasBehaviourSupportPlan && !input.bspUpToDate) {
    recs.push("Review and update Behaviour Support Plan");
  }

  if (!input.childParticipatedInBSP && input.hasBehaviourSupportPlan) {
    recs.push("Involve child in BSP review — ensure they understand and agree with strategies");
  }

  if (!input.sanctionPolicyExplainedToChild) {
    recs.push("Explain sanctions policy to child in age-appropriate way");
  }

  if (!input.appealsProcessExplained) {
    recs.push("Ensure child knows how to appeal a sanction they disagree with");
  }

  if (staffConsistency.sanctionVariation === "inconsistent") {
    recs.push("Review staff consistency in behaviour management — consider team training");
  }

  if (trend === "worsening") {
    recs.push("Behaviour sanctions increasing — review effectiveness of current approach");
  }

  const notLinked = sanctions.filter(s => !s.linkedToBehaviour).length;
  if (notLinked > 0 && sanctions.length > 0 && notLinked / sanctions.length > 0.2) {
    recs.push("Ensure all sanctions are clearly linked to specific behaviours");
  }

  return recs;
}

// ── Summary ─────────────────────────────────────────────────────────────────

function buildSummary(
  childName: string,
  rating: string,
  ratio: number,
  totalSanctions: number,
  totalRewards: number,
  trend: string,
): string {
  const ratioDesc = ratio >= 4 ? "excellent positive reinforcement ratio" :
    ratio >= 2 ? "adequate reward-to-sanction balance" :
    totalSanctions === 0 ? "no sanctions recorded" :
    "low reward-to-sanction ratio needs attention";

  const trendDesc = trend === "improving" ? "Trend improving." :
    trend === "worsening" ? "Trend worsening." : "";

  return `${childName}: ${totalRewards} rewards, ${totalSanctions} sanctions (${ratioDesc}). Rating: ${rating.replace(/_/g, " ")}. ${trendDesc}`.trim();
}

// ── Utility ─────────────────────────────────────────────────────────────────

function scoreToRating(score: number): "excellent" | "good" | "adequate" | "requires_improvement" | "inadequate" {
  if (score >= 85) return "excellent";
  if (score >= 70) return "good";
  if (score >= 55) return "adequate";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}
