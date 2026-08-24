// ==============================================================================
// CARA -- HOME SANCTION & REWARD BALANCE INTELLIGENCE ENGINE
// Analyses the balance, proportionality, documentation quality, child voice,
// equity, and outcome tracking of sanctions and rewards across the home.
// Pure deterministic engine -- no imports, no LLM, no external deps.
// CHR 2015 Reg 12 (duty of care), Reg 19 (behaviour management).
// SCCIF: "Experiences and progress of children", "Helped and protected".
// Children's Homes Quality Standards Reg 9 (positive relationships).
// ==============================================================================

import { below, formatRate, meets, rate } from "@/lib/metrics/rate";

// -- Input Types --------------------------------------------------------------

export interface SanctionRewardRecordInput {
  id: string;
  child_id: string;
  date: string;
  direction: string;              // "reward" | "sanction"
  reward_type: string | null;     // "privilege" | "praise" | "activity" | "token"
  sanction_type: string | null;   // "loss_of_privilege" | "verbal_warning" | "written_warning" | "grounding" | "physical" | "isolation" | "food_restriction"
  has_context: boolean;           // context non-empty
  has_child_response: boolean;    // child_response non-empty
  has_outcome: boolean;           // outcome non-empty
  proportionate: boolean;
  has_description: boolean;       // description non-empty
}

export interface SanctionRewardBalanceInput {
  today: string;
  total_children: number;
  records: SanctionRewardRecordInput[];
}

// -- Output Types -------------------------------------------------------------

export type SanctionRewardBalanceRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface SanctionRewardInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface SanctionRewardRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface SanctionRewardBalanceResult {
  reward_rating: SanctionRewardBalanceRating;
  reward_score: number;
  headline: string;
  total_records: number;
  records_last_90_days: number;
  reward_count: number;
  sanction_count: number;
  /** null when the population is empty — nothing measured, not 0%. */
  reward_ratio: number | null;           // pct rewards of total
  /** null when the population is empty — nothing measured, not 0%. */
  proportionality_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  child_voice_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  context_documentation_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  outcome_tracking_rate: number | null;
  unique_children: number;
  reward_type_variety: number;    // distinct reward types used
  strengths: string[];
  concerns: string[];
  recommendations: SanctionRewardRecommendation[];
  insights: SanctionRewardInsight[];
}

// -- Helpers ------------------------------------------------------------------

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function daysBetween(a: string, b: string): number {
  return Math.round(
    Math.abs(new Date(b).getTime() - new Date(a).getTime()) / 86_400_000,
  );
}

function toRating(score: number): SanctionRewardBalanceRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// -- Main Compute -------------------------------------------------------------

export function computeSanctionRewardBalance(
  input: SanctionRewardBalanceInput,
): SanctionRewardBalanceResult {
  const { today, total_children, records } = input;

  // -- Guard: insufficient data -----------------------------------------------
  if (total_children === 0) {
    return {
      reward_rating: "insufficient_data",
      reward_score: 0,
      headline: "No children in placement — sanction and reward balance cannot be assessed.",
      total_records: 0,
      records_last_90_days: 0,
      reward_count: 0,
      sanction_count: 0,
      reward_ratio: 0,
      proportionality_rate: 0,
      child_voice_rate: 0,
      context_documentation_rate: 0,
      outcome_tracking_rate: 0,
      unique_children: 0,
      reward_type_variety: 0,
      strengths: [],
      concerns: [],
      recommendations: [],
      insights: [],
    };
  }

  // -- Filter to last 90 days -------------------------------------------------
  const r90d = records.filter(r => daysBetween(r.date, today) <= 90);
  const total = r90d.length;

  // -- 0 records with children present ----------------------------------------
  if (total === 0) {
    return {
      reward_rating: "good",
      reward_score: 72,
      headline: "No sanctions or rewards recorded — consider implementing a positive reinforcement framework.",
      total_records: records.length,
      records_last_90_days: 0,
      reward_count: 0,
      sanction_count: 0,
      reward_ratio: 0,
      proportionality_rate: 0,
      child_voice_rate: 0,
      context_documentation_rate: 0,
      outcome_tracking_rate: 0,
      unique_children: 0,
      reward_type_variety: 0,
      strengths: [],
      concerns: [],
      recommendations: [
        {
          rank: 1,
          recommendation: "Implement a structured positive reinforcement framework to recognise and encourage positive behaviour.",
          urgency: "soon",
          regulatory_ref: "CHR 2015 Reg 19",
        },
      ],
      insights: [
        {
          text: "No sanction or reward records found in the last 90 days. While the absence of sanctions is positive, an active reward system supports children's motivation and self-esteem.",
          severity: "warning",
        },
      ],
    };
  }

  // -- Compute metrics --------------------------------------------------------

  const rewards = r90d.filter(r => r.direction === "reward");
  const sanctions = r90d.filter(r => r.direction === "sanction");
  const rewardCount = rewards.length;
  const sanctionCount = sanctions.length;
  const rewardRatio = rate(rewardCount, total);

  // Proportionality rate
  const proportionateCount = r90d.filter(r => r.proportionate).length;
  const proportionalityRate = rate(proportionateCount, total);

  // Child voice rate
  const childVoiceCount = r90d.filter(r => r.has_child_response).length;
  const childVoiceRate = rate(childVoiceCount, total);

  // Context documentation rate (has_context AND has_description)
  const contextDocCount = r90d.filter(r => r.has_context && r.has_description).length;
  const contextDocRate = rate(contextDocCount, total);

  // Outcome tracking rate
  const outcomeCount = r90d.filter(r => r.has_outcome).length;
  const outcomeRate = rate(outcomeCount, total);

  // Unique children
  const uniqueChildIds = new Set(r90d.map(r => r.child_id));
  const uniqueChildren = uniqueChildIds.size;

  // Reward type variety
  const rewardTypes = new Set(rewards.map(r => r.reward_type).filter(Boolean));
  const rewardTypeVariety = rewardTypes.size;

  // Per-child breakdown for equity analysis
  const childSanctions: Record<string, number> = {};
  const childRewards: Record<string, number> = {};
  for (const r of r90d) {
    if (r.direction === "sanction") {
      childSanctions[r.child_id] = (childSanctions[r.child_id] || 0) + 1;
    } else {
      childRewards[r.child_id] = (childRewards[r.child_id] || 0) + 1;
    }
  }

  // -- Inappropriate sanction detection ---------------------------------------
  const inappropriateTypes = ["physical", "isolation", "food_restriction"];
  const hasInappropriateSanction = sanctions.some(
    s => s.sanction_type !== null && inappropriateTypes.includes(s.sanction_type),
  );

  // -- Sanction-heavy child detection -----------------------------------------
  const sanctionHeavyChildren: string[] = [];
  for (const childId of Object.keys(childSanctions)) {
    if (childSanctions[childId] > 5 && (childRewards[childId] || 0) === 0) {
      sanctionHeavyChildren.push(childId);
    }
  }

  // -- Scoring: base 52, 6 modifiers -----------------------------------------
  let score = 52;

  // Modifier 1: Reward-to-sanction ratio
  if (meets(rewardRatio, 70)) score += 6;
  else if (meets(rewardRatio, 55)) score += 3;
  else if (below(rewardRatio, 40)) score -= 5;
  // All sanctions no rewards -> additional -3
  if (rewardCount === 0 && sanctionCount > 0) score -= 3;

  // Modifier 2: Proportionality compliance
  if (meets(proportionalityRate, 98)) score += 5;
  else if (meets(proportionalityRate, 85)) score += 2;
  else if (below(proportionalityRate, 70)) score -= 5;

  // Modifier 3: Child voice
  if (meets(childVoiceRate, 90)) score += 5;
  else if (meets(childVoiceRate, 70)) score += 2;
  else if (below(childVoiceRate, 50)) score -= 4;

  // Modifier 4: Context documentation
  if (meets(contextDocRate, 90)) score += 5;
  else if (meets(contextDocRate, 70)) score += 2;
  else if (below(contextDocRate, 50)) score -= 4;

  // Modifier 5: Equity across children
  const totalSanctions = sanctionCount;
  const maxChildSanctions = Math.max(0, ...Object.values(childSanctions));
  const sanctionConcentration = totalSanctions > 0 ? maxChildSanctions / totalSanctions : 0;
  const everyChildWithRecordsHasReward = Array.from(uniqueChildIds).every(
    cid => (childRewards[cid] || 0) >= 1,
  );

  if (sanctionConcentration <= 0.5 && everyChildWithRecordsHasReward) {
    score += 4; // equitable
  } else if (sanctionConcentration <= 0.5 || everyChildWithRecordsHasReward) {
    score += 2; // mostly equitable
  } else {
    score -= 4; // inequitable
  }

  // Modifier 6: Outcome tracking & quality
  if (meets(outcomeRate, 85) && rewardTypeVariety >= 3) score += 5;
  else if (meets(outcomeRate, 70)) score += 2;
  else if (below(outcomeRate, 50)) score -= 3;

  // -- Additional penalties ---------------------------------------------------

  // Sanction-heavy child penalty
  if (sanctionHeavyChildren.length > 0) score -= 3;

  // Inappropriate sanction penalty
  if (hasInappropriateSanction) score -= 5;

  score = clamp(score, 0, 100);
  const reward_rating = toRating(score);

  // -- Strengths --------------------------------------------------------------
  const strengths: string[] = [];

  if (meets(rewardRatio, 70) && total > 0) {
    strengths.push(
      `${formatRate(rewardRatio)} of records are rewards — the home maintains a strongly positive reinforcement culture.`,
    );
  }

  if (meets(proportionalityRate, 98) && total > 0) {
    strengths.push(
      `${formatRate(proportionalityRate)} proportionality rate — all sanctions and rewards are assessed as proportionate.`,
    );
  }

  if (meets(childVoiceRate, 90) && total > 0) {
    strengths.push(
      `Child's voice captured in ${formatRate(childVoiceRate)} of records — children are actively included in the process.`,
    );
  }

  if (meets(contextDocRate, 90) && total > 0) {
    strengths.push(
      `Context documentation at ${formatRate(contextDocRate)} — excellent recording of circumstances and descriptions.`,
    );
  }

  if (everyChildWithRecordsHasReward && uniqueChildren >= 2 && rewardCount > 0) {
    strengths.push(
      "Every child with records has received at least one reward — equitable positive reinforcement across the home.",
    );
  }

  if (meets(outcomeRate, 85) && total > 0) {
    strengths.push(
      `Outcome tracking at ${formatRate(outcomeRate)} — the impact of sanctions and rewards is consistently recorded.`,
    );
  }

  if (rewardTypeVariety >= 3 && rewardCount > 0) {
    strengths.push(
      `${rewardTypeVariety} different reward types used — diverse reinforcement strategies support individual children's preferences.`,
    );
  }

  if (sanctionCount === 0 && rewardCount > 0) {
    strengths.push(
      "Zero sanctions recorded with active rewards in place — outstanding positive behaviour management.",
    );
  }

  // -- Concerns ---------------------------------------------------------------
  const concerns: string[] = [];

  if (hasInappropriateSanction) {
    const inappropriateRecords = sanctions.filter(
      s => s.sanction_type !== null && inappropriateTypes.includes(s.sanction_type),
    );
    const types = [...new Set(inappropriateRecords.map(s => s.sanction_type))].join(", ");
    concerns.push(
      `CRITICAL: Inappropriate sanction types detected (${types}) — these are prohibited under the Children's Homes Regulations and require immediate investigation.`,
    );
  }

  if (sanctionHeavyChildren.length > 0) {
    concerns.push(
      `${sanctionHeavyChildren.length} child${sanctionHeavyChildren.length > 1 ? "ren" : ""} ha${sanctionHeavyChildren.length > 1 ? "ve" : "s"} received more than 5 sanctions with zero rewards — this punitive pattern requires urgent review.`,
    );
  }

  if (below(rewardRatio, 40) && total > 0) {
    concerns.push(
      `Reward ratio at only ${formatRate(rewardRatio)} — the home's approach is sanction-heavy, undermining positive relationships.`,
    );
  }

  if (rewardCount === 0 && sanctionCount > 0) {
    concerns.push(
      "No rewards recorded alongside active sanctions — the behaviour management approach lacks any positive reinforcement.",
    );
  }

  if (below(proportionalityRate, 70) && total > 0) {
    concerns.push(
      `Proportionality rate at ${formatRate(proportionalityRate)} — a significant number of sanctions or rewards are not assessed as proportionate.`,
    );
  }

  if (below(childVoiceRate, 50) && total > 0) {
    concerns.push(
      `Child voice captured in only ${formatRate(childVoiceRate)} of records — children are not being adequately heard in the sanction and reward process.`,
    );
  }

  if (below(contextDocRate, 50) && total > 0) {
    concerns.push(
      `Context documentation at only ${formatRate(contextDocRate)} — poor recording of the circumstances surrounding sanctions and rewards.`,
    );
  }

  if (below(outcomeRate, 50) && total > 0) {
    concerns.push(
      `Outcome tracking at only ${formatRate(outcomeRate)} — the impact and effectiveness of sanctions and rewards is not being monitored.`,
    );
  }

  if (!everyChildWithRecordsHasReward && uniqueChildren >= 2) {
    const childrenWithoutRewards = Array.from(uniqueChildIds).filter(
      cid => (childRewards[cid] || 0) === 0,
    );
    concerns.push(
      `${childrenWithoutRewards.length} child${childrenWithoutRewards.length > 1 ? "ren" : ""} with records ha${childrenWithoutRewards.length > 1 ? "ve" : "s"} received no rewards — inequitable distribution of positive reinforcement.`,
    );
  }

  if (sanctionConcentration > 0.5 && totalSanctions > 1) {
    concerns.push(
      "Sanctions are disproportionately concentrated on one child — potential discriminatory or targeted practice.",
    );
  }

  // -- Recommendations --------------------------------------------------------
  const recommendations: SanctionRewardRecommendation[] = [];
  let rank = 0;

  if (hasInappropriateSanction) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Immediately cease all inappropriate sanction practices (physical, isolation, food restriction) and conduct a safeguarding investigation.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 19",
    });
  }

  if (sanctionHeavyChildren.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: `Urgently review behaviour support plans for ${sanctionHeavyChildren.length} child${sanctionHeavyChildren.length > 1 ? "ren" : ""} receiving repeated sanctions without any rewards — consider whether current approaches are effective and child-centred.`,
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 19",
    });
  }

  if (rewardCount === 0 && sanctionCount > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Implement a structured positive reinforcement system immediately — Ofsted expects to see a balance of rewards and sanctions, with emphasis on positive behaviour management.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 19",
    });
  }

  if (below(rewardRatio, 40) && rewardCount > 0 && total > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: `Increase the use of rewards relative to sanctions — current reward ratio of ${formatRate(rewardRatio)} indicates an over-reliance on punitive measures.`,
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 19",
    });
  }

  if (below(proportionalityRate, 70) && total > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: `Review proportionality of all sanctions and rewards — ${formatRate(proportionalityRate)} compliance requires staff training on appropriate, child-centred responses.`,
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 12",
    });
  }

  if (below(childVoiceRate, 50) && total > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: `Ensure children's views are captured in every sanction and reward record — current rate of ${formatRate(childVoiceRate)} denies children their right to be heard.`,
      urgency: "soon",
      regulatory_ref: "Quality Standards Reg 9",
    });
  }

  if (below(contextDocRate, 50) && total > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: `Improve context documentation for all sanction and reward records — only ${formatRate(contextDocRate)} currently have adequate context and description.`,
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 12",
    });
  }

  if (below(outcomeRate, 50) && total > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: `Implement outcome tracking for all sanctions and rewards — only ${formatRate(outcomeRate)} of records capture the outcome, making it impossible to assess effectiveness.`,
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 19",
    });
  }

  if (rewardTypeVariety < 3 && rewardCount > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: `Diversify reward types — only ${rewardTypeVariety} type${rewardTypeVariety !== 1 ? "s" : ""} used currently. Consider privileges, praise, activities, and token systems to match individual children's preferences.`,
      urgency: "planned",
      regulatory_ref: "Quality Standards Reg 9",
    });
  }

  if (!everyChildWithRecordsHasReward && uniqueChildren >= 2 && rewardCount > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Ensure every child receives equitable access to rewards — some children are currently excluded from positive reinforcement.",
      urgency: "soon",
      regulatory_ref: "Quality Standards Reg 9",
    });
  }

  if (score < 65 && recommendations.length === 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Develop a comprehensive behaviour management policy that prioritises positive reinforcement and ensures proportionate, documented, and equitable sanctions and rewards.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 19",
    });
  }

  // -- Insights ---------------------------------------------------------------
  const insights: SanctionRewardInsight[] = [];

  // Critical insights
  if (hasInappropriateSanction) {
    insights.push({
      text: "Prohibited sanction types detected. Physical punishment, isolation, and food restriction are explicitly banned under the Children's Homes Regulations. Ofsted will regard this as a serious safeguarding failure.",
      severity: "critical",
    });
  }

  if (rewardCount === 0 && sanctionCount > 0) {
    insights.push({
      text: "The home operates a sanctions-only approach with no recorded rewards. Ofsted expects a positive behaviour management culture — this represents a fundamental gap in practice.",
      severity: "critical",
    });
  }

  if (sanctionHeavyChildren.length > 0) {
    insights.push({
      text: `${sanctionHeavyChildren.length} child${sanctionHeavyChildren.length > 1 ? "ren" : ""} receiving repeated sanctions with no rewards suggests punitive, non-therapeutic practice. Individual behaviour support plans must be reviewed urgently.`,
      severity: "critical",
    });
  }

  if (below(proportionalityRate, 70) && total > 0) {
    insights.push({
      text: `Proportionality compliance at ${formatRate(proportionalityRate)} — a significant proportion of consequences are not proportionate, undermining children's trust and sense of fairness.`,
      severity: "critical",
    });
  }

  // Warning insights
  if (below(rewardRatio, 55) && meets(rewardRatio, 40) && total > 0) {
    insights.push({
      text: `Reward ratio at ${formatRate(rewardRatio)} — while not critically low, the balance should shift further towards positive reinforcement. Best practice targets at least 70% rewards.`,
      severity: "warning",
    });
  }

  if (meets(childVoiceRate, 50) && below(childVoiceRate, 70) && total > 0) {
    insights.push({
      text: `Child voice captured in ${formatRate(childVoiceRate)} of records — improving but not yet meeting the standard where children are consistently heard in decisions affecting them.`,
      severity: "warning",
    });
  }

  if (meets(contextDocRate, 50) && below(contextDocRate, 70) && total > 0) {
    insights.push({
      text: `Context documentation at ${formatRate(contextDocRate)} — some records lack sufficient context, which may compromise the ability to learn from and review decisions.`,
      severity: "warning",
    });
  }

  if (meets(outcomeRate, 50) && below(outcomeRate, 70) && total > 0) {
    insights.push({
      text: `Outcome tracking at ${formatRate(outcomeRate)} — the home tracks some outcomes but inconsistently, making it harder to evaluate which approaches work best for each child.`,
      severity: "warning",
    });
  }

  if (rewardTypeVariety < 3 && rewardTypeVariety >= 1) {
    insights.push({
      text: `Only ${rewardTypeVariety} reward type${rewardTypeVariety > 1 ? "s" : ""} used. A narrow range of rewards may not motivate all children equally — consider diversifying reward strategies.`,
      severity: "warning",
    });
  }

  // Positive insights
  if (reward_rating === "outstanding") {
    insights.push({
      text: "Sanction and reward practice is outstanding — children experience a fair, positive, and well-documented behaviour management approach that supports their development and wellbeing.",
      severity: "positive",
    });
  }

  if (meets(rewardRatio, 70) && total > 0) {
    insights.push({
      text: `${formatRate(rewardRatio)} reward ratio demonstrates a genuinely positive behaviour management culture. Ofsted will view this as strong evidence of child-centred practice under Reg 19.`,
      severity: "positive",
    });
  }

  if (meets(proportionalityRate, 98) && total > 0) {
    insights.push({
      text: `${formatRate(proportionalityRate)} proportionality rate — sanctions and rewards are consistently fair and appropriate, building children's trust and sense of justice.`,
      severity: "positive",
    });
  }

  if (meets(childVoiceRate, 90) && total > 0) {
    insights.push({
      text: `Child voice rate of ${formatRate(childVoiceRate)} — children are meaningfully involved in the sanction and reward process, supporting their participation rights under Reg 9.`,
      severity: "positive",
    });
  }

  if (meets(contextDocRate, 90) && total > 0) {
    insights.push({
      text: `Excellent context documentation at ${formatRate(contextDocRate)} — every decision is well-evidenced, supporting robust governance and learning.`,
      severity: "positive",
    });
  }

  if (meets(outcomeRate, 85) && rewardTypeVariety >= 3 && total > 0) {
    insights.push({
      text: `Strong outcome tracking (${formatRate(outcomeRate)}) combined with ${rewardTypeVariety} reward types — the home can evidence the effectiveness of its behaviour management approach.`,
      severity: "positive",
    });
  }

  // -- Headline ---------------------------------------------------------------
  let headline: string;

  if (reward_rating === "outstanding") {
    headline = `Outstanding sanction and reward balance — ${formatRate(rewardRatio)} reward ratio, ${formatRate(proportionalityRate)} proportionality, ${formatRate(childVoiceRate)} child voice across ${total} records.`;
  } else if (reward_rating === "good") {
    headline = `Good sanction and reward balance — ${rewardCount} reward${rewardCount !== 1 ? "s" : ""} and ${sanctionCount} sanction${sanctionCount !== 1 ? "s" : ""} recorded${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (reward_rating === "adequate") {
    headline = `Adequate sanction and reward balance — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified across ${total} record${total !== 1 ? "s" : ""}, improvement action required.`;
  } else {
    headline = `Sanction and reward practice is inadequate — ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to ensure children experience fair and positive behaviour management.`;
  }

  // -- Return -----------------------------------------------------------------
  return {
    reward_rating,
    reward_score: score,
    headline,
    total_records: records.length,
    records_last_90_days: total,
    reward_count: rewardCount,
    sanction_count: sanctionCount,
    reward_ratio: rewardRatio,
    proportionality_rate: proportionalityRate,
    child_voice_rate: childVoiceRate,
    context_documentation_rate: contextDocRate,
    outcome_tracking_rate: outcomeRate,
    unique_children: uniqueChildren,
    reward_type_variety: rewardTypeVariety,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
