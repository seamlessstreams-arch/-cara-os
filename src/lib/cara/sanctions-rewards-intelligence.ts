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
  proportionate: boolean | null;
  childInformed: boolean | null;
  childUnderstood: boolean | null;
  linkedToBehaviour: boolean | null;
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
  sanctionPolicyExplainedToChild: boolean | null;
  appealsProcessExplained: boolean | null;
}

export interface SanctionsRewardsAssessment {
  childName: string;
  overallScore: number;
  overallRating: "excellent" | "good" | "adequate" | "requires_improvement" | "inadequate";
  positivityScore: number;
  proportionalityScore: number | null;
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
  status: "met" | "partially_met" | "not_met" | "not_evidenced";
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
  const components: Array<[number | null, number]> = [
    [positivityScore, 0.30],
    [proportionalityScore, 0.25],
    [effectivenessScore, 0.20],
    [complianceScore, 0.25],
  ];
  const computable = components.filter((c): c is [number, number] => c[0] !== null);
  const weightTotal = computable.reduce((t, [, w]) => t + w, 0);
  const overallScore = Math.round(
    computable.reduce((t, [v, w]) => t + v * w, 0) / weightTotal
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

/** Each sanction is judged only on the questions someone actually answered.
 *  A sanction with none of them answered is not scored — it cannot be shown to
 *  be proportionate, and it cannot be shown not to be. Returns null when no
 *  sanction is scorable. */
function scoreProportionality(sanctions: SanctionRecord[]): number | null {
  if (sanctions.length === 0) return 100;
  const scored: number[] = [];
  for (const s of sanctions) {
    if (s.isProhibited) { scored.push(0); continue; }
    const judgements: Array<[boolean | null, number]> = [
      [s.proportionate, 40],
      [s.linkedToBehaviour, 20],
      [s.childInformed, 20],
      [s.childUnderstood, 15],
    ];
    const recorded = judgements.filter(([v]) => v !== null);
    if (recorded.length === 0) continue;
    const available = recorded.reduce((t, [, w]) => t + w, 0);
    const forfeited = recorded.reduce((t, [v, w]) => t + (v === false ? w : 0), 0);
    scored.push(Math.round(((available - forfeited) / available) * 100));
  }
  if (scored.length === 0) return null;
  return Math.round(scored.reduce((a, b) => a + b, 0) / scored.length);
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
  if (input.sanctionPolicyExplainedToChild === true) score += 10;

  // Appeals process explained (10 points)
  if (input.appealsProcessExplained === true) score += 10;

  // Sanctions linked to behaviour (10 points), over those where the link was
  // actually recorded — an unrecorded link earns nothing and forfeits nothing.
  const linkRecorded = sanctions.filter(s => s.linkedToBehaviour !== null);
  if (linkRecorded.length > 0) {
    const linked = linkRecorded.filter(s => s.linkedToBehaviour === true).length;
    score += Math.round((linked / linkRecorded.length) * 10);
  } else if (sanctions.length === 0) {
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
  _rewards: RewardRecord[],
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
  const disproportionate = sanctions.filter(s => s.proportionate === false).length;
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
  const notUnderstood = sanctions.filter(s => s.childUnderstood === false).length;
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

  // "Recorded as proportionate" has to mean recorded. Under the old default an
  // unanswered proportionality question read as a yes, so this strength was
  // claimed for sanctions nobody had reviewed.
  if (sanctions.length > 0 && sanctions.every(s => s.proportionate === true)) {
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

  if (input.sanctionPolicyExplainedToChild === true && input.appealsProcessExplained === true) {
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
  const allProportionate = sanctions.length === 0 || sanctions.every(s => s.proportionate === true);
  const proportionalityUnrecorded = sanctions.some(s => s.proportionate === null);
  const hasStrategy = input.hasBehaviourSupportPlan || sanctions.length < 3;
  const reg19Met = allProportionate && hasStrategy && prohibited === 0;
  flags.push({
    regulation: "CHR 2015 Reg 19",
    area: "Behaviour Management",
    status: reg19Met ? "met"
      : prohibited > 0 ? "not_met"
      : proportionalityUnrecorded ? "not_evidenced"
      : "partially_met",
    detail: reg19Met
      ? "Behaviour management meets regulatory standard"
      : proportionalityUnrecorded && prohibited === 0
      ? "Cannot be evidenced — whether every sanction was proportionate is not recorded"
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

  if (input.sanctionPolicyExplainedToChild === false) {
    recs.push("Explain sanctions policy to child in age-appropriate way");
  }

  if (input.appealsProcessExplained === false) {
    recs.push("Ensure child knows how to appeal a sanction they disagree with");
  }

  if (staffConsistency.sanctionVariation === "inconsistent") {
    recs.push("Review staff consistency in behaviour management — consider team training");
  }

  if (trend === "worsening") {
    recs.push("Behaviour sanctions increasing — review effectiveness of current approach");
  }

  const notLinked = sanctions.filter(s => s.linkedToBehaviour === false).length;
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
