// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME BEHAVIOUR MANAGEMENT INTELLIGENCE ENGINE
// Home-level: synthesises behaviour logs, sanctions/rewards, and consequence
// records to assess therapeutic behaviour management quality, positive
// reinforcement, restorative approaches, and proportionality.
// CHR 2015 Reg 19, 20. SCCIF: "Effective", "Safe."
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface BehaviourLogInput {
  id: string;
  date: string;                              // YYYY-MM-DD
  child_id: string;
  direction: string;                         // positive | concern
  intensity: string;                         // low | moderate | high | critical
  has_antecedent: boolean;
  has_strategy: boolean;
  has_outcome: boolean;
}

export interface SanctionRewardInput {
  id: string;
  date: string;
  child_id: string;
  direction: string;                         // reward | sanction
  proportionate: boolean;
  has_child_response: boolean;
  has_outcome: boolean;
}

export interface ConsequenceInput {
  id: string;
  date: string;
  child_id: string;
  approach: string;                          // restorative_conversation | natural_consequence | etc.
  has_child_voice: boolean;
  relationship_repaired: boolean;
  linked_behaviour_plan: boolean;
  has_restorative_questions: boolean;
}

export interface HomeBehaviourInput {
  today: string;
  total_children: number;
  child_ids: string[];
  behaviour_logs: BehaviourLogInput[];
  sanctions_rewards: SanctionRewardInput[];
  consequences: ConsequenceInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type BehaviourRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface BehaviourProfile {
  total_logs_90d: number;
  positive_count: number;
  concern_count: number;
  positive_ratio: number;
  high_critical_count: number;
  abc_documentation_rate: number;
  strategy_use_rate: number;
  children_with_concerns: string[];
  repeat_concern_children: string[];
}

export interface ReinforcementProfile {
  total_entries_90d: number;
  reward_count: number;
  sanction_count: number;
  reward_ratio: number;
  proportionality_rate: number;
  child_response_rate: number;
  outcome_rate: number;
}

export interface RestorativeProfile {
  total_consequences_90d: number;
  child_voice_rate: number;
  relationship_repair_rate: number;
  bsp_linked_rate: number;
  restorative_question_rate: number;
}

export interface BehaviourInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface BehaviourRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface HomeBehaviourResult {
  behaviour_rating: BehaviourRating;
  behaviour_score: number;
  headline: string;
  behaviour_profile: BehaviourProfile;
  reinforcement_profile: ReinforcementProfile;
  restorative_profile: RestorativeProfile;
  strengths: string[];
  concerns: string[];
  recommendations: BehaviourRecommendation[];
  insights: BehaviourInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): BehaviourRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

function daysBetween(a: string, b: string): number {
  return Math.abs(
    (new Date(a).getTime() - new Date(b).getTime()) / 86_400_000,
  );
}

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeHomeBehaviour(
  input: HomeBehaviourInput,
): HomeBehaviourResult {
  const { today, child_ids, behaviour_logs, sanctions_rewards, consequences } = input;

  const logs90d = behaviour_logs.filter(l => daysBetween(l.date, today) <= 90);
  const sr90d = sanctions_rewards.filter(s => daysBetween(s.date, today) <= 90);
  const cons90d = consequences.filter(c => daysBetween(c.date, today) <= 90);

  // Insufficient data
  if (logs90d.length === 0 && sr90d.length === 0 && cons90d.length === 0) {
    return {
      behaviour_rating: "insufficient_data",
      behaviour_score: 0,
      headline: "No behaviour management data available for the past 90 days.",
      behaviour_profile: emptyBehavProfile(),
      reinforcement_profile: emptyReinfProfile(),
      restorative_profile: emptyRestProfile(),
      strengths: [],
      concerns: ["No behaviour logs, sanctions/rewards, or consequence records found — the home may not be recording behaviour management activity."],
      recommendations: [{ rank: 1, recommendation: "Ensure all behaviour management activity is recorded — Reg 19 requires evidence of therapeutic care approaches.", urgency: "immediate", regulatory_ref: "Reg 19" }],
      insights: [{ text: "No behaviour management data exists. Ofsted expects comprehensive recording of behaviour strategies, consequences, and positive reinforcement.", severity: "critical" }],
    };
  }

  // ── Behaviour Profile ───────────────────────────────────────────────
  const positiveLogs = logs90d.filter(l => l.direction === "positive").length;
  const concernLogs = logs90d.filter(l => l.direction === "concern").length;
  const positiveRatio = pct(positiveLogs, logs90d.length);

  const highCritical = logs90d.filter(l => l.intensity === "high" || l.intensity === "critical").length;

  const abcDocs = logs90d.filter(l => l.has_antecedent && l.has_strategy && l.has_outcome).length;
  const abcRate = pct(abcDocs, logs90d.length);

  const withStrategy = logs90d.filter(l => l.has_strategy).length;
  const strategyRate = pct(withStrategy, logs90d.length);

  const concernChildren = [...new Set(logs90d.filter(l => l.direction === "concern").map(l => l.child_id))];
  const childConcernCounts: Record<string, number> = {};
  for (const l of logs90d.filter(l => l.direction === "concern")) {
    childConcernCounts[l.child_id] = (childConcernCounts[l.child_id] || 0) + 1;
  }
  const repeatConcernChildren = Object.entries(childConcernCounts).filter(([, c]) => c >= 3).map(([id]) => id);

  const behaviourProfile: BehaviourProfile = {
    total_logs_90d: logs90d.length,
    positive_count: positiveLogs,
    concern_count: concernLogs,
    positive_ratio: positiveRatio,
    high_critical_count: highCritical,
    abc_documentation_rate: abcRate,
    strategy_use_rate: strategyRate,
    children_with_concerns: concernChildren,
    repeat_concern_children: repeatConcernChildren,
  };

  // ── Reinforcement Profile ───────────────────────────────────────────
  const rewards = sr90d.filter(s => s.direction === "reward").length;
  const sanctions = sr90d.filter(s => s.direction === "sanction").length;
  const rewardRatio = pct(rewards, sr90d.length);

  const sanctionEntries = sr90d.filter(s => s.direction === "sanction");
  const proportionate = sanctionEntries.filter(s => s.proportionate).length;
  const proportionalityRate = pct(proportionate, sanctionEntries.length);

  const withChildResponse = sr90d.filter(s => s.has_child_response).length;
  const childResponseRate = pct(withChildResponse, sr90d.length);

  const withOutcome = sr90d.filter(s => s.has_outcome).length;
  const outcomeRate = pct(withOutcome, sr90d.length);

  const reinforcementProfile: ReinforcementProfile = {
    total_entries_90d: sr90d.length,
    reward_count: rewards,
    sanction_count: sanctions,
    reward_ratio: rewardRatio,
    proportionality_rate: proportionalityRate,
    child_response_rate: childResponseRate,
    outcome_rate: outcomeRate,
  };

  // ── Restorative Profile ─────────────────────────────────────────────
  const withChildVoice = cons90d.filter(c => c.has_child_voice).length;
  const childVoiceRate = pct(withChildVoice, cons90d.length);

  const withRepair = cons90d.filter(c => c.relationship_repaired).length;
  const repairRate = pct(withRepair, cons90d.length);

  const bspLinked = cons90d.filter(c => c.linked_behaviour_plan).length;
  const bspLinkedRate = pct(bspLinked, cons90d.length);

  const withRestQuestions = cons90d.filter(c => c.has_restorative_questions).length;
  const restQuestionRate = pct(withRestQuestions, cons90d.length);

  const restorativeProfile: RestorativeProfile = {
    total_consequences_90d: cons90d.length,
    child_voice_rate: childVoiceRate,
    relationship_repair_rate: repairRate,
    bsp_linked_rate: bspLinkedRate,
    restorative_question_rate: restQuestionRate,
  };

  // ── Scoring ───────────────────────────────────────────────────────────
  let score = 50;

  // Positive ratio (±5)
  if (logs90d.length > 0) {
    if (positiveRatio >= 60) score += 5;
    else if (positiveRatio >= 40) score += 2;
    else score -= 4;
  }

  // High/critical incidents (±3)
  if (highCritical === 0) score += 3;
  else if (highCritical <= 3) score += 0;
  else score -= 3;

  // ABC documentation (±3)
  if (logs90d.length > 0) {
    if (abcRate >= 80) score += 3;
    else if (abcRate >= 60) score += 1;
    else score -= 3;
  }

  // Reward ratio (±5)
  if (sr90d.length > 0) {
    if (rewardRatio >= 60) score += 5;
    else if (rewardRatio >= 40) score += 2;
    else score -= 4;
  }

  // Proportionality (±3)
  if (sanctionEntries.length > 0) {
    if (proportionalityRate === 100) score += 3;
    else if (proportionalityRate >= 80) score += 1;
    else score -= 3;
  }

  // Child response (±2)
  if (sr90d.length > 0) {
    if (childResponseRate >= 80) score += 2;
    else score -= 1;
  }

  // Child voice in consequences (±3)
  if (cons90d.length > 0) {
    if (childVoiceRate >= 80) score += 3;
    else if (childVoiceRate >= 60) score += 1;
    else score -= 2;
  }

  // Relationship repair (±3)
  if (cons90d.length > 0) {
    if (repairRate >= 80) score += 3;
    else if (repairRate >= 60) score += 1;
    else score -= 2;
  }

  // BSP linkage (±2)
  if (cons90d.length > 0) {
    if (bspLinkedRate >= 60) score += 2;
    else score -= 1;
  }

  // Repeat concern children (±2)
  if (repeatConcernChildren.length === 0) score += 2;
  else score -= 2;

  // Strategy use (±2)
  if (logs90d.length > 0) {
    if (strategyRate >= 80) score += 2;
    else score -= 2;
  }

  score = clamp(score, 0, 100);
  const rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (positiveRatio >= 60 && logs90d.length > 0) strengths.push(`${positiveRatio}% of behaviour records are positive — the home is recognising and reinforcing good behaviour.`);
  if (rewardRatio >= 60 && sr90d.length > 0) strengths.push(`Reward-to-sanction ratio is ${rewards}:${sanctions} — positive reinforcement is the dominant approach.`);
  if (proportionalityRate === 100 && sanctionEntries.length > 0) strengths.push("All sanctions rated as proportionate — consequences are fair and appropriate.");
  if (abcRate >= 80 && logs90d.length > 0) strengths.push(`ABC documentation rate is ${abcRate}% — staff are recording antecedents, behaviours, and consequences thoroughly.`);
  if (repairRate >= 80 && cons90d.length > 0) strengths.push(`${repairRate}% of consequences resulted in relationship repair — restorative approaches are effective.`);
  if (childVoiceRate >= 80 && cons90d.length > 0) strengths.push(`Child voice captured in ${childVoiceRate}% of consequences — children's perspectives are valued.`);
  if (highCritical === 0 && logs90d.length > 0) strengths.push("No high or critical intensity behaviour incidents — the home environment is stable.");
  if (strategyRate >= 80 && logs90d.length > 0) strengths.push(`De-escalation strategies documented in ${strategyRate}% of behaviour logs — proactive management is embedded.`);

  // ── Concerns ──────────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (positiveRatio < 40 && logs90d.length > 0) concerns.push(`Only ${positiveRatio}% of behaviour records are positive — the home may be over-focused on negative behaviour.`);
  if (rewardRatio < 40 && sr90d.length > 0) concerns.push(`Only ${rewardRatio}% of entries are rewards — sanctions outweigh positive reinforcement.`);
  if (proportionalityRate < 80 && sanctionEntries.length > 0) concerns.push(`Only ${proportionalityRate}% of sanctions rated proportionate — disproportionate consequences undermine trust.`);
  if (repeatConcernChildren.length > 0) concerns.push(`${repeatConcernChildren.length} child${repeatConcernChildren.length > 1 ? "ren" : ""} with 3+ behaviour concerns — BSP effectiveness needs review.`);
  if (highCritical > 3) concerns.push(`${highCritical} high/critical behaviour incidents in 90 days — escalation patterns need analysis.`);
  if (abcRate < 60 && logs90d.length > 0) concerns.push(`ABC documentation rate is only ${abcRate}% — incomplete recording hinders pattern analysis.`);
  if (repairRate < 60 && cons90d.length > 0) concerns.push(`Relationship repair rate is only ${repairRate}% — restorative approaches may not be effective.`);
  if (strategyRate < 60 && logs90d.length > 0) concerns.push(`De-escalation strategies documented in only ${strategyRate}% of logs — staff may not be using proactive approaches.`);

  // ── Recommendations ───────────────────────────────────────────────────
  const recs: BehaviourRecommendation[] = [];
  let rank = 1;

  if (positiveRatio < 40 && logs90d.length > 0) {
    recs.push({ rank: rank++, recommendation: "Increase recording of positive behaviour — aim for at least 3 positive entries per concern to evidence therapeutic culture.", urgency: "immediate", regulatory_ref: "Reg 19" });
  }
  if (repeatConcernChildren.length > 0) {
    recs.push({ rank: rank++, recommendation: `Review BSPs for ${repeatConcernChildren.length} child${repeatConcernChildren.length > 1 ? "ren" : ""} with repeat concerns — strategies may need updating.`, urgency: "immediate", regulatory_ref: "Reg 19" });
  }
  if (proportionalityRate < 80 && sanctionEntries.length > 0) {
    recs.push({ rank: rank++, recommendation: "Review sanctions for proportionality — all consequences must be fair, explained, and linked to the behaviour.", urgency: "soon", regulatory_ref: "Reg 19" });
  }
  if (abcRate < 80 && logs90d.length > 0) {
    recs.push({ rank: rank++, recommendation: "Improve ABC documentation — recording antecedents, behaviours, and consequences enables effective pattern analysis.", urgency: "soon", regulatory_ref: "Reg 19" });
  }
  if (repairRate < 60 && cons90d.length > 0) {
    recs.push({ rank: rank++, recommendation: "Strengthen restorative practice — focus on relationship repair after every consequence.", urgency: "planned", regulatory_ref: "Reg 19" });
  }

  // ── Insights ──────────────────────────────────────────────────────────
  const insights: BehaviourInsight[] = [];

  if (highCritical > 3) {
    insights.push({ text: `${highCritical} high/critical behaviour incidents in 90 days. Ofsted will examine whether behaviour management strategies are effective and whether staff are appropriately trained.`, severity: "critical" });
  }
  if (proportionalityRate < 60 && sanctionEntries.length > 0) {
    insights.push({ text: `Only ${proportionalityRate}% of sanctions rated proportionate. Ofsted expects all consequences to be fair, explained to the child, and proportionate to the behaviour.`, severity: "critical" });
  }
  if (repeatConcernChildren.length > 0) {
    insights.push({ text: `${repeatConcernChildren.length} child${repeatConcernChildren.length > 1 ? "ren" : ""} with repeat behaviour concerns. Ofsted will assess whether the home is adapting care plans and learning from patterns.`, severity: "warning" });
  }
  if (positiveRatio >= 60 && logs90d.length > 0) {
    insights.push({ text: `${positiveRatio}% positive behaviour ratio demonstrates a strengths-based approach. Ofsted values homes that recognise and celebrate positive behaviour.`, severity: "positive" });
  }
  if (rewardRatio >= 60 && sr90d.length > 0) {
    insights.push({ text: `Reward-led reinforcement (${rewardRatio}%) evidences a therapeutic approach to behaviour management — a key SCCIF expectation.`, severity: "positive" });
  }
  if (repairRate >= 80 && cons90d.length > 0) {
    insights.push({ text: `${repairRate}% relationship repair rate demonstrates effective restorative practice — Ofsted expects consequences to strengthen, not damage, relationships.`, severity: "positive" });
  }

  // ── Headline ──────────────────────────────────────────────────────────
  let headline: string;
  if (rating === "outstanding") {
    headline = `Outstanding behaviour management — ${positiveRatio}% positive behaviour ratio with effective restorative practice and proportionate consequences.`;
  } else if (rating === "good") {
    headline = `Good behaviour management — therapeutic approaches evident with ${rewardRatio}% reward-led reinforcement.`;
  } else if (rating === "adequate") {
    headline = "Adequate behaviour management — improvements needed in positive reinforcement, documentation, or restorative practice.";
  } else {
    headline = "Behaviour management is inadequate — significant gaps in therapeutic approach, documentation, or proportionality.";
  }

  return {
    behaviour_rating: rating,
    behaviour_score: score,
    headline,
    behaviour_profile: behaviourProfile,
    reinforcement_profile: reinforcementProfile,
    restorative_profile: restorativeProfile,
    strengths,
    concerns,
    recommendations: recs,
    insights,
  };
}

// ── Empty Profiles ─────────────────────────────────────────────────────────

function emptyBehavProfile(): BehaviourProfile {
  return {
    total_logs_90d: 0, positive_count: 0, concern_count: 0,
    positive_ratio: 0, high_critical_count: 0,
    abc_documentation_rate: 0, strategy_use_rate: 0,
    children_with_concerns: [], repeat_concern_children: [],
  };
}

function emptyReinfProfile(): ReinforcementProfile {
  return {
    total_entries_90d: 0, reward_count: 0, sanction_count: 0,
    reward_ratio: 0, proportionality_rate: 0,
    child_response_rate: 0, outcome_rate: 0,
  };
}

function emptyRestProfile(): RestorativeProfile {
  return {
    total_consequences_90d: 0, child_voice_rate: 0,
    relationship_repair_rate: 0, bsp_linked_rate: 0,
    restorative_question_rate: 0,
  };
}
