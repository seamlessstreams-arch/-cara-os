// ══════════════════════════════════════════════════════════════════════════════
// CARA — CHILD EMOTIONAL WELLBEING INTELLIGENCE ENGINE
// Per-child: synthesises mood data, behaviour patterns, keywork engagement,
// therapeutic progress, and sanctions/rewards to assess emotional trajectory.
// CHR 2015 Reg 7 (Protection of welfare), Reg 10 (Health & wellbeing).
// SCCIF: "Experiences and progress of children."
// Pure deterministic — no DB, no LLM, no side effects.
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

import { below, meets, rate } from "@/lib/metrics/rate";

export type BehaviourDirection = "positive" | "concerning";
export type BehaviourIntensity = "low" | "medium" | "high" | "severe";
export type SanctionRewardDirection = "reward" | "sanction";

export interface MoodEntryInput {
  id: string;
  date: string;
  mood_score: number | null;       // 1-10
  time: string;                     // HH:mm
}

export interface BehaviourEntryInput {
  id: string;
  date: string;
  direction: BehaviourDirection;
  intensity: BehaviourIntensity;
  trigger: string;
  has_strategy_used: boolean;
}

export interface KeyworkSessionInput {
  id: string;
  date: string;
  has_child_voice: boolean;
  mood_before: number | null;
  mood_after: number | null;
}

export interface TherapySessionInput {
  id: string;
  date: string;
  attended: boolean;
  engagement_level: string;        // "excellent" | "good" | "partial" | "poor" | "refused"
}

export interface SanctionRewardInput {
  id: string;
  date: string;
  direction: SanctionRewardDirection;
  child_response: string;
}

export interface ChildEmotionalWellbeingInput {
  today: string;
  child_id: string;
  child_name: string;
  mood_entries: MoodEntryInput[];
  behaviour_entries: BehaviourEntryInput[];
  keywork_sessions: KeyworkSessionInput[];
  therapy_sessions: TherapySessionInput[];
  sanction_rewards: SanctionRewardInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type EmotionalWellbeingRating = "outstanding" | "good" | "adequate" | "inadequate" | "insufficient_data";

export interface MoodTrajectory {
  avg_mood_7d: number | null;
  avg_mood_14d: number | null;
  avg_mood_30d: number | null;
  mood_trend: "improving" | "stable" | "declining" | "insufficient_data";
  lowest_mood_30d: number | null;
  highest_mood_30d: number | null;
  low_mood_days: number;           // days with avg mood < 5
  mood_variability: "low" | "moderate" | "high" | "insufficient_data";
}

export interface BehaviourEmotionalProfile {
  /** null when the population is empty — nothing measured, not 0%. */
  positive_rate_30d: number | null;       // 0-100
  /** null when the population is empty — nothing measured, not 0%. */
  positive_rate_7d: number | null;
  behaviour_trend: "improving" | "stable" | "declining" | "insufficient_data";
  severe_incidents_30d: number;
  trigger_themes: { trigger: string; count: number }[];
  /** null when the population is empty — nothing measured, not 0%. */
  strategy_use_rate: number | null;       // % of concerning entries where strategy was used
}

export interface EngagementProfile {
  keywork_sessions_30d: number;
  /** null when the population is empty — nothing measured, not 0%. */
  keywork_voice_rate: number | null;      // % where child voice recorded
  /** null when the population is empty — nothing measured, not 0%. */
  keywork_mood_improvement_rate: number | null; // % where mood improved after
  /** null when the population is empty — nothing measured, not 0%. */
  therapy_attendance_rate: number | null;
  therapy_engagement_quality: number; // 0-100 based on levels
}

export interface RewardBalanceProfile {
  rewards_30d: number;
  sanctions_30d: number;
  /** null when the population is empty — nothing measured, not 0%. */
  reward_ratio: number | null;            // rewards / (rewards + sanctions) * 100
  balance_rating: "positive" | "balanced" | "sanctions_heavy" | "no_data";
}

export interface ChildEmotionalWellbeingResult {
  generated_at: string;
  child_id: string;
  child_name: string;
  emotional_wellbeing_rating: EmotionalWellbeingRating;
  emotional_wellbeing_score: number;
  headline: string;
  mood: MoodTrajectory;
  behaviour: BehaviourEmotionalProfile;
  engagement: EngagementProfile;
  reward_balance: RewardBalanceProfile;
  strengths: string[];
  concerns: string[];
  recommendations: { rank: number; recommendation: string; urgency: "immediate" | "soon" | "planned"; regulatory_ref: string | null }[];
  insights: { severity: "critical" | "warning" | "positive"; text: string }[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

// Was `den === 0 ? 0 : …`: nothing recorded read as 0%.
function pct(num: number, den: number): number | null {
  return rate(num, den);
}

function avg(nums: number[]): number | null {
  if (nums.length === 0) return null;
  return Math.round(nums.reduce((s, n) => s + n, 0) / nums.length);
}

const ENGAGEMENT_SCORES: Record<string, number> = {
  excellent: 100, good: 75, partial: 50, poor: 25, refused: 0,
};

// ── Main Compute Function ───────────────────────────────────────────────────

export function computeChildEmotionalWellbeing(input: ChildEmotionalWellbeingInput): ChildEmotionalWellbeingResult {
  const { today, child_id, child_name, mood_entries, behaviour_entries, keywork_sessions, therapy_sessions, sanction_rewards } = input;

  const totalDataPoints = mood_entries.length + behaviour_entries.length + keywork_sessions.length + therapy_sessions.length + sanction_rewards.length;

  // ── Insufficient data path ──────────────────────────────────────────────
  if (totalDataPoints === 0) {
    return {
      generated_at: today,
      child_id,
      child_name,
      emotional_wellbeing_rating: "insufficient_data",
      emotional_wellbeing_score: 0,
      headline: `${child_name} — insufficient_data: No wellbeing data available for analysis.`,
      mood: {
        avg_mood_7d: null, avg_mood_14d: null, avg_mood_30d: null,
        mood_trend: "insufficient_data", lowest_mood_30d: null, highest_mood_30d: null,
        low_mood_days: 0, mood_variability: "insufficient_data",
      },
      behaviour: {
        positive_rate_30d: 0, positive_rate_7d: 0,
        behaviour_trend: "insufficient_data", severe_incidents_30d: 0,
        trigger_themes: [], strategy_use_rate: 0,
      },
      engagement: {
        keywork_sessions_30d: 0, keywork_voice_rate: 0,
        keywork_mood_improvement_rate: 0, therapy_attendance_rate: 0,
        therapy_engagement_quality: 0,
      },
      reward_balance: { rewards_30d: 0, sanctions_30d: 0, reward_ratio: 0, balance_rating: "no_data" },
      strengths: [],
      concerns: ["No emotional wellbeing data available — daily logs, behaviour records, and keywork sessions may not be recording mood data."],
      recommendations: [{ rank: 1, recommendation: "Ensure daily log entries include mood scores to enable emotional wellbeing monitoring.", urgency: "soon", regulatory_ref: "Reg 10" }],
      insights: [{ severity: "warning", text: `Insufficient data to assess ${child_name}'s emotional wellbeing. Ofsted expects homes to actively monitor and respond to children's emotional needs — ensure mood data is being captured.` }],
    };
  }

  // ── Mood Trajectory ─────────────────────────────────────────────────────
  const moodScored = mood_entries.filter((m) => m.mood_score !== null);
  const mood7d = moodScored.filter((m) => daysBetween(m.date, today) >= 0 && daysBetween(m.date, today) <= 7);
  const mood14d = moodScored.filter((m) => daysBetween(m.date, today) >= 0 && daysBetween(m.date, today) <= 14);
  const mood30d = moodScored.filter((m) => daysBetween(m.date, today) >= 0 && daysBetween(m.date, today) <= 30);

  const avgMood7d = avg(mood7d.map((m) => m.mood_score!));
  const avgMood14d = avg(mood14d.map((m) => m.mood_score!));
  const avgMood30d = avg(mood30d.map((m) => m.mood_score!));

  const lowestMood30d = mood30d.length > 0 ? Math.min(...mood30d.map((m) => m.mood_score!)) : null;
  const highestMood30d = mood30d.length > 0 ? Math.max(...mood30d.map((m) => m.mood_score!)) : null;

  // Low mood days: days where average mood < 5
  const moodByDay = new Map<string, number[]>();
  for (const m of mood30d) {
    const day = m.date.slice(0, 10);
    if (!moodByDay.has(day)) moodByDay.set(day, []);
    moodByDay.get(day)!.push(m.mood_score!);
  }
  let lowMoodDays = 0;
  for (const [, scores] of moodByDay) {
    const dayAvg = scores.reduce((s, n) => s + n, 0) / scores.length;
    if (dayAvg < 5) lowMoodDays++;
  }

  // Mood trend: compare first half vs second half of 30d
  let moodTrend: "improving" | "stable" | "declining" | "insufficient_data" = "insufficient_data";
  if (mood30d.length >= 6) {
    const firstHalf = mood30d.filter((m) => daysBetween(m.date, today) > 15);
    const secondHalf = mood30d.filter((m) => daysBetween(m.date, today) <= 15);
    const avgFirst = avg(firstHalf.map((m) => m.mood_score!));
    const avgSecond = avg(secondHalf.map((m) => m.mood_score!));
    if (avgFirst !== null && avgSecond !== null) {
      const diff = avgSecond - avgFirst;
      if (diff >= 1) moodTrend = "improving";
      else if (diff <= -1) moodTrend = "declining";
      else moodTrend = "stable";
    }
  }

  // Mood variability: std dev > 2 = high, > 1 = moderate, else low
  let moodVariability: "low" | "moderate" | "high" | "insufficient_data" = "insufficient_data";
  if (mood30d.length >= 4) {
    const scores = mood30d.map((m) => m.mood_score!);
    const mean = scores.reduce((s, n) => s + n, 0) / scores.length;
    const variance = scores.reduce((s, n) => s + (n - mean) ** 2, 0) / scores.length;
    const stdDev = Math.sqrt(variance);
    if (stdDev > 2) moodVariability = "high";
    else if (stdDev > 1) moodVariability = "moderate";
    else moodVariability = "low";
  }

  const moodProfile: MoodTrajectory = {
    avg_mood_7d: avgMood7d,
    avg_mood_14d: avgMood14d,
    avg_mood_30d: avgMood30d,
    mood_trend: moodTrend,
    lowest_mood_30d: lowestMood30d,
    highest_mood_30d: highestMood30d,
    low_mood_days: lowMoodDays,
    mood_variability: moodVariability,
  };

  // ── Behaviour Emotional Profile ─────────────────────────────────────────
  const beh30d = behaviour_entries.filter((b) => daysBetween(b.date, today) >= 0 && daysBetween(b.date, today) <= 30);
  const beh7d = behaviour_entries.filter((b) => daysBetween(b.date, today) >= 0 && daysBetween(b.date, today) <= 7);
  const behPrior30d = behaviour_entries.filter((b) => {
    const gap = daysBetween(b.date, today);
    return gap > 30 && gap <= 60;
  });

  const positive30d = beh30d.filter((b) => b.direction === "positive").length;
  const positive7d = beh7d.filter((b) => b.direction === "positive").length;
  const severe30d = beh30d.filter((b) => b.intensity === "severe" || b.intensity === "high").length;

  const positivePrior = behPrior30d.filter((b) => b.direction === "positive").length;

  let behaviourTrend: "improving" | "stable" | "declining" | "insufficient_data" = "insufficient_data";
  if (beh30d.length >= 3 && behPrior30d.length >= 3) {
    const currentRate = pct(positive30d, beh30d.length);
    const priorRate = pct(positivePrior, behPrior30d.length);
    // A trend needs both windows measured. The length guards above make that
    // true today, but the difference is only meaningful when it is.
    if (currentRate === null || priorRate === null) behaviourTrend = "insufficient_data";
    else if (currentRate - priorRate >= 10) behaviourTrend = "improving";
    else if (priorRate - currentRate >= 10) behaviourTrend = "declining";
    else behaviourTrend = "stable";
  }

  // Trigger themes
  const triggerMap = new Map<string, number>();
  const concerning30d = beh30d.filter((b) => b.direction === "concerning");
  for (const b of concerning30d) {
    if (b.trigger) {
      triggerMap.set(b.trigger, (triggerMap.get(b.trigger) ?? 0) + 1);
    }
  }
  const triggerThemes = Array.from(triggerMap.entries())
    .map(([trigger, count]) => ({ trigger, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const strategyUsed = concerning30d.filter((b) => b.has_strategy_used).length;

  const behaviourProfile: BehaviourEmotionalProfile = {
    positive_rate_30d: pct(positive30d, beh30d.length),
    positive_rate_7d: pct(positive7d, beh7d.length),
    behaviour_trend: behaviourTrend,
    severe_incidents_30d: severe30d,
    trigger_themes: triggerThemes,
    strategy_use_rate: pct(strategyUsed, concerning30d.length),
  };

  // ── Engagement Profile ──────────────────────────────────────────────────
  const kw30d = keywork_sessions.filter((k) => daysBetween(k.date, today) >= 0 && daysBetween(k.date, today) <= 30);
  const kwWithVoice = kw30d.filter((k) => k.has_child_voice).length;
  const kwWithMoodImprovement = kw30d.filter((k) => k.mood_before !== null && k.mood_after !== null && k.mood_after! > k.mood_before!).length;

  const therapy30d = therapy_sessions.filter((t) => daysBetween(t.date, today) >= 0 && daysBetween(t.date, today) <= 30);
  const therapyAttended = therapy30d.filter((t) => t.attended).length;
  const therapyEngagementScores = therapy30d.filter((t) => t.attended).map((t) => ENGAGEMENT_SCORES[t.engagement_level] ?? 50);

  const engagementProfile: EngagementProfile = {
    keywork_sessions_30d: kw30d.length,
    keywork_voice_rate: pct(kwWithVoice, kw30d.length),
    keywork_mood_improvement_rate: pct(kwWithMoodImprovement, kw30d.filter((k) => k.mood_before !== null && k.mood_after !== null).length),
    therapy_attendance_rate: pct(therapyAttended, therapy30d.length),
    therapy_engagement_quality: avg(therapyEngagementScores) ?? 0,
  };

  // ── Reward Balance ──────────────────────────────────────────────────────
  const sr30d = sanction_rewards.filter((sr) => daysBetween(sr.date, today) >= 0 && daysBetween(sr.date, today) <= 30);
  const rewards30d = sr30d.filter((sr) => sr.direction === "reward").length;
  const sanctions30d = sr30d.filter((sr) => sr.direction === "sanction").length;

  let balanceRating: "positive" | "balanced" | "sanctions_heavy" | "no_data" = "no_data";
  if (sr30d.length > 0) {
    const ratio = pct(rewards30d, rewards30d + sanctions30d);
    if (meets(ratio, 70)) balanceRating = "positive";
    else if (meets(ratio, 40)) balanceRating = "balanced";
    else balanceRating = "sanctions_heavy";
  }

  const rewardBalance: RewardBalanceProfile = {
    rewards_30d: rewards30d,
    sanctions_30d: sanctions30d,
    reward_ratio: pct(rewards30d, rewards30d + sanctions30d),
    balance_rating: balanceRating,
  };

  // ── Scoring ─────────────────────────────────────────────────────────────
  let score = 50;

  // Mood (+/- 15)
  if (avgMood30d !== null) {
    if (avgMood30d >= 7) score += 15;
    else if (avgMood30d >= 5) score += 5;
    else if (avgMood30d < 4) score -= 10;
    else score -= 3;
  }

  // Mood trend
  if (moodTrend === "improving") score += 5;
  if (moodTrend === "declining") score -= 8;

  // Low mood days
  if (lowMoodDays >= 5) score -= 8;
  else if (lowMoodDays >= 3) score -= 3;

  // Mood variability (high = emotionally unstable)
  if (moodVariability === "high") score -= 5;

  // Behaviour positive rate (+/- 10)
  if (beh30d.length >= 3) {
    const posRate = pct(positive30d, beh30d.length);
    if (meets(posRate, 70)) score += 10;
    else if (meets(posRate, 50)) score += 3;
    else if (below(posRate, 30)) score -= 8;
  }

  // Behaviour trend
  if (behaviourTrend === "improving") score += 3;
  if (behaviourTrend === "declining") score -= 5;

  // Severe incidents
  if (severe30d >= 3) score -= 8;
  else if (severe30d >= 1) score -= 3;

  // Keywork engagement (+/- 5)
  if (kw30d.length >= 3) score += 3;
  if (meets(engagementProfile.keywork_voice_rate, 80)) score += 3;

  // Therapy engagement
  if (therapy30d.length > 0) {
    if (meets(engagementProfile.therapy_attendance_rate, 90)) score += 5;
    else if (below(engagementProfile.therapy_attendance_rate, 50)) score -= 5;
  }

  // Reward balance
  if (balanceRating === "positive") score += 3;
  if (balanceRating === "sanctions_heavy") score -= 5;

  score = clamp(Math.round(score), 0, 100);

  // ── Rating ──────────────────────────────────────────────────────────────
  let rating: EmotionalWellbeingRating;
  if (score >= 80) rating = "outstanding";
  else if (score >= 65) rating = "good";
  else if (score >= 45) rating = "adequate";
  else rating = "inadequate";

  // ── Strengths ─────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (avgMood30d !== null && avgMood30d >= 7) strengths.push(`Good average mood of ${avgMood30d}/10 over 30 days — ${child_name} appears emotionally settled.`);
  if (moodTrend === "improving") strengths.push("Mood trajectory is improving — emotional wellbeing trending positively.");
  if (meets(behaviourProfile.positive_rate_30d, 70) && beh30d.length >= 3) strengths.push(`${behaviourProfile.positive_rate_30d}% positive behaviour entries — strong emotional regulation.`);
  if (behaviourTrend === "improving") strengths.push("Behaviour pattern is improving — fewer concerning episodes and more positive interactions.");
  if (meets(engagementProfile.keywork_voice_rate, 80) && kw30d.length >= 2) strengths.push(`${child_name}'s voice captured in ${engagementProfile.keywork_voice_rate}% of keywork sessions — excellent participation.`);
  if (meets(engagementProfile.therapy_attendance_rate, 90) && therapy30d.length >= 2) strengths.push(`${engagementProfile.therapy_attendance_rate}% therapy attendance — strong therapeutic engagement.`);
  if (balanceRating === "positive" && sr30d.length >= 3) strengths.push("Positive reward-to-sanction ratio — strengths-based approach in evidence.");
  if (lowMoodDays === 0 && mood30d.length >= 5) strengths.push("No low mood days recorded in 30 days — consistent emotional stability.");

  // ── Concerns ──────────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (avgMood30d !== null && avgMood30d < 5) concerns.push(`Average mood of ${avgMood30d}/10 over 30 days — ${child_name} may be struggling emotionally (Reg 10).`);
  if (moodTrend === "declining") concerns.push("Mood trajectory is declining — emotional wellbeing deteriorating.");
  if (lowMoodDays >= 5) concerns.push(`${lowMoodDays} low mood days in 30 days — persistent emotional distress.`);
  if (moodVariability === "high") concerns.push("High mood variability detected — emotional regulation may be a concern.");
  if (severe30d >= 2) concerns.push(`${severe30d} high/severe behaviour incidents in 30 days — emotional distress manifesting in behaviour.`);
  if (behaviourTrend === "declining") concerns.push("Behaviour pattern declining — more concerning entries than previously.");
  if (balanceRating === "sanctions_heavy") concerns.push(`Sanctions outweigh rewards (${sanctions30d} vs ${rewards30d}) — consider whether approach is strengths-based (Reg 19).`);
  if (below(engagementProfile.therapy_attendance_rate, 50) && therapy30d.length >= 2) concerns.push(`Therapy attendance only ${engagementProfile.therapy_attendance_rate}% — therapeutic support not being accessed.`);
  if (kw30d.length === 0 && totalDataPoints > 0) concerns.push("No keywork sessions recorded in 30 days — direct emotional support may be lacking.");

  // ── Recommendations ───────────────────────────────────────────────────
  const recs: ChildEmotionalWellbeingResult["recommendations"] = [];
  let rank = 0;

  if (avgMood30d !== null && avgMood30d < 4) recs.push({ rank: ++rank, recommendation: `Urgent wellbeing review for ${child_name} — persistently low mood requires clinical assessment.`, urgency: "immediate", regulatory_ref: "Reg 10" });
  if (moodTrend === "declining" && lowMoodDays >= 3) recs.push({ rank: ++rank, recommendation: "Declining mood trend with multiple low mood days — consider CAMHS referral or increased therapeutic input.", urgency: "immediate", regulatory_ref: "Reg 10" });
  if (severe30d >= 2) recs.push({ rank: ++rank, recommendation: "Review behaviour support plan — frequent high-intensity episodes suggest current strategies may not be meeting emotional needs.", urgency: "soon", regulatory_ref: "Reg 20" });
  if (balanceRating === "sanctions_heavy") recs.push({ rank: ++rank, recommendation: "Rebalance approach towards positive reinforcement — sanctions-heavy practice risks disengagement.", urgency: "soon", regulatory_ref: "Reg 19" });
  if (below(engagementProfile.therapy_attendance_rate, 50) && therapy30d.length >= 2) recs.push({ rank: ++rank, recommendation: "Explore barriers to therapy attendance — consider timing, transport, or therapeutic relationship.", urgency: "soon", regulatory_ref: "Reg 10" });
  if (kw30d.length === 0) recs.push({ rank: ++rank, recommendation: "Schedule regular keywork sessions — essential for emotional monitoring and relationship building.", urgency: "soon", regulatory_ref: "Reg 10" });
  if (moodVariability === "high") recs.push({ rank: ++rank, recommendation: "High mood variability — consider emotional regulation focused work with CAMHS or therapeutic team.", urgency: "planned", regulatory_ref: "Reg 10" });

  // ── Insights ──────────────────────────────────────────────────────────
  const insights: ChildEmotionalWellbeingResult["insights"] = [];

  if (avgMood30d !== null && avgMood30d < 4) {
    insights.push({ severity: "critical", text: `Cara detects persistently low mood for ${child_name} (avg ${avgMood30d}/10). Under Reg 10, the home must promote children's emotional wellbeing. Inspectors will ask what action has been taken to support this child.` });
  }
  if (moodTrend === "declining" && severe30d >= 2) {
    insights.push({ severity: "critical", text: `Declining mood combined with ${severe30d} severe behaviour incidents suggests ${child_name} may be in emotional crisis. Multi-agency response may be needed.` });
  }
  if (lowMoodDays >= 5) {
    insights.push({ severity: "warning", text: `${lowMoodDays} low mood days in 30 days. While some variation is normal, persistent low mood warrants proactive intervention — CAMHS, key worker support, or environmental review.` });
  }
  if (moodTrend === "improving" && behaviourTrend === "improving") {
    insights.push({ severity: "positive", text: `Both mood and behaviour trends are improving for ${child_name}. Current care approach appears effective — maintain consistency and document progress for Ofsted evidence.` });
  }
  if (rating === "outstanding") {
    insights.push({ severity: "positive", text: `Outstanding emotional wellbeing indicators for ${child_name}. Stable mood, positive behaviour, strong engagement, and balanced approach. Excellent evidence of Reg 7 and 10 compliance.` });
  }
  if (balanceRating === "positive" && meets(behaviourProfile.positive_rate_30d, 60)) {
    insights.push({ severity: "positive", text: `Positive reward balance and high positive behaviour rate suggest ${child_name} is responding well to the care approach. This is exactly what Ofsted looks for under SCCIF "Experiences and progress."` });
  }

  // ── Headline ──────────────────────────────────────────────────────────
  const parts: string[] = [`${child_name} — ${rating}`];
  if (avgMood30d !== null) parts.push(`mood ${avgMood30d}/10`);
  if (beh30d.length >= 3) parts.push(`${behaviourProfile.positive_rate_30d}% positive behaviour`);
  if (moodTrend !== "insufficient_data") parts.push(`trend ${moodTrend}`);
  const headline = parts.join(": ").replace(/: /, ": ") + ".";

  return {
    generated_at: today,
    child_id,
    child_name,
    emotional_wellbeing_rating: rating,
    emotional_wellbeing_score: score,
    headline,
    mood: moodProfile,
    behaviour: behaviourProfile,
    engagement: engagementProfile,
    reward_balance: rewardBalance,
    strengths,
    concerns,
    recommendations: recs,
    insights,
  };
}
