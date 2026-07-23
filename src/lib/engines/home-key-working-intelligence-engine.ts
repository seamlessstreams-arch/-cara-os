// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME KEY WORKING INTELLIGENCE ENGINE
// Home-level: synthesises key working sessions across all children to
// produce an overall key working quality and coverage intelligence score.
// CHR 2015 Reg 14, 44. SCCIF: "Experiences and progress of children."
// ══════════════════════════════════════════════════════════════════════════════

import { below, formatRate, meets, rateOf } from "@/lib/metrics/rate";

// ── Input Types ─────────────────────────────────────────────────────────────

export interface KeyWorkingSessionInput {
  id: string;
  child_id: string;
  staff_id: string;
  date: string;                          // YYYY-MM-DD
  type: string;                          // "one_to_one" | "therapeutic" | "wellbeing_check" | "goal_setting" | "review" | "life_skills" | "informal"
  duration_minutes: number;
  has_child_voice: boolean;              // child's own words recorded
  actions_agreed_count: number;
  mood_before: number | null;            // 1-5 scale
  mood_after: number | null;             // 1-5 scale
  has_follow_up: boolean;
  follow_up_completed: boolean;
  linked_goals_count: number;
}

export interface HomeKeyWorkingInput {
  today: string;
  total_children: number;
  child_ids: string[];                   // all active child IDs
  sessions: KeyWorkingSessionInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type KeyWorkingRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface SessionsProfile {
  total_90d: number;
  total_30d: number;
  avg_per_child_30d: number;
  avg_duration_minutes: number;
  types_distribution: { type: string; count: number }[];
  child_voice_rate: number | null;      // % with child voice recorded, null = no sessions in 90d
  actions_per_session: number;          // avg actions agreed
  follow_up_rate: number | null;       // % of follow-ups completed, null = no session set a follow-up
  goal_linked_rate: number | null;     // % linked to goals, null = no sessions in 90d
}

export interface MoodProfile {
  sessions_with_mood: number;
  avg_mood_before: number;
  avg_mood_after: number;
  avg_improvement: number;
  positive_shift_rate: number;         // % where mood_after > mood_before
}

export interface CoverageProfile {
  children_with_sessions_30d: number;
  children_without_sessions_30d: string[];
  avg_gap_days: number | null;         // avg days between sessions per child
  most_sessions_child: string | null;
  least_sessions_child: string | null;
}

export interface KeyWorkingInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface KeyWorkingRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface HomeKeyWorkingResult {
  key_working_rating: KeyWorkingRating;
  key_working_score: number;
  headline: string;
  sessions: SessionsProfile;
  mood: MoodProfile;
  coverage: CoverageProfile;
  strengths: string[];
  concerns: string[];
  recommendations: KeyWorkingRecommendation[];
  insights: KeyWorkingInsight[];
  trend: "improving" | "stable" | "declining" | "insufficient_data";
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): KeyWorkingRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeHomeKeyWorking(
  input: HomeKeyWorkingInput,
): HomeKeyWorkingResult {
  const { today, total_children, child_ids, sessions } = input;

  if (sessions.length < 2) {
    return {
      key_working_rating: "insufficient_data",
      key_working_score: 0,
      headline: "Insufficient data to assess key working quality.",
      sessions: emptySessions(),
      mood: emptyMood(),
      coverage: emptyCoverage(),
      strengths: [],
      concerns: [],
      recommendations: [{ rank: 1, recommendation: "Begin recording key working sessions to enable quality analysis.", urgency: "immediate", regulatory_ref: "Reg 14" }],
      insights: [{ text: "Not enough key working data to assess quality. Ensure all sessions are recorded.", severity: "warning" }],
      trend: "insufficient_data",
    };
  }

  // ── Sessions Profile ──────────────────────────────────────────────────
  const sessions90d = sessions.filter(s => {
    const d = daysBetween(s.date, today);
    return d >= 0 && d <= 90;
  });
  const sessions30d = sessions.filter(s => {
    const d = daysBetween(s.date, today);
    return d >= 0 && d <= 30;
  });

  const avgPerChild30d = total_children > 0
    ? Math.round((sessions30d.length / total_children) * 10) / 10
    : 0;

  const totalDuration = sessions90d.reduce((s, se) => s + se.duration_minutes, 0);
  const avgDuration = sessions90d.length > 0 ? Math.round(totalDuration / sessions90d.length) : 0;

  // Types distribution
  const typeMap: Record<string, number> = {};
  for (const s of sessions90d) {
    typeMap[s.type] = (typeMap[s.type] || 0) + 1;
  }
  const typesDistribution = Object.entries(typeMap)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);

  // Child voice rate
  const withVoice = sessions90d.filter(s => s.has_child_voice);
  const childVoiceRate = rateOf(withVoice, sessions90d);

  // Actions per session
  const totalActions = sessions90d.reduce((s, se) => s + se.actions_agreed_count, 0);
  const actionsPerSession = sessions90d.length > 0
    ? Math.round((totalActions / sessions90d.length) * 10) / 10
    : 0;

  // Follow-up rate (only for sessions that have follow-ups set)
  const withFollowUp = sessions90d.filter(s => s.has_follow_up);
  const followUpCompleted = withFollowUp.filter(s => s.follow_up_completed);
  const followUpRate = rateOf(followUpCompleted, withFollowUp);

  // Goal-linked rate
  const withGoals = sessions90d.filter(s => s.linked_goals_count > 0);
  const goalLinkedRate = rateOf(withGoals, sessions90d);

  const sessionsProfile: SessionsProfile = {
    total_90d: sessions90d.length,
    total_30d: sessions30d.length,
    avg_per_child_30d: avgPerChild30d,
    avg_duration_minutes: avgDuration,
    types_distribution: typesDistribution,
    child_voice_rate: childVoiceRate,
    actions_per_session: actionsPerSession,
    follow_up_rate: followUpRate,
    goal_linked_rate: goalLinkedRate,
  };

  // ── Mood Profile ──────────────────────────────────────────────────────
  const withMood = sessions90d.filter(s => s.mood_before !== null && s.mood_after !== null);
  const avgMoodBefore = withMood.length > 0
    ? Math.round((withMood.reduce((s, se) => s + (se.mood_before ?? 0), 0) / withMood.length) * 10) / 10
    : 0;
  const avgMoodAfter = withMood.length > 0
    ? Math.round((withMood.reduce((s, se) => s + (se.mood_after ?? 0), 0) / withMood.length) * 10) / 10
    : 0;
  const avgImprovement = withMood.length > 0
    ? Math.round(((withMood.reduce((s, se) => s + ((se.mood_after ?? 0) - (se.mood_before ?? 0)), 0)) / withMood.length) * 10) / 10
    : 0;
  const positiveShifts = withMood.filter(s => (s.mood_after ?? 0) > (s.mood_before ?? 0));
  const positiveShiftRate = withMood.length > 0
    ? Math.round((positiveShifts.length / withMood.length) * 100)
    : 0;

  const moodProfile: MoodProfile = {
    sessions_with_mood: withMood.length,
    avg_mood_before: avgMoodBefore,
    avg_mood_after: avgMoodAfter,
    avg_improvement: avgImprovement,
    positive_shift_rate: positiveShiftRate,
  };

  // ── Coverage Profile ──────────────────────────────────────────────────
  const childSessionMap30d: Record<string, number> = {};
  for (const cid of child_ids) childSessionMap30d[cid] = 0;
  for (const s of sessions30d) {
    childSessionMap30d[s.child_id] = (childSessionMap30d[s.child_id] || 0) + 1;
  }

  const childrenWith = Object.entries(childSessionMap30d).filter(([, c]) => c > 0);
  const childrenWithout = Object.entries(childSessionMap30d).filter(([, c]) => c === 0).map(([id]) => id);

  // Average gap between sessions per child (90d)
  let avgGapDays: number | null = null;
  const childSessionDates: Record<string, string[]> = {};
  for (const s of sessions90d) {
    if (!childSessionDates[s.child_id]) childSessionDates[s.child_id] = [];
    childSessionDates[s.child_id].push(s.date);
  }
  const allGaps: number[] = [];
  for (const dates of Object.values(childSessionDates)) {
    const sorted = [...dates].sort();
    for (let i = 1; i < sorted.length; i++) {
      allGaps.push(daysBetween(sorted[i - 1], sorted[i]));
    }
  }
  if (allGaps.length > 0) {
    avgGapDays = Math.round(allGaps.reduce((s, v) => s + v, 0) / allGaps.length);
  }

  // Most/least sessions
  let mostChild: string | null = null;
  let leastChild: string | null = null;
  if (child_ids.length > 0) {
    const counts = child_ids.map(id => ({
      id,
      count: sessions90d.filter(s => s.child_id === id).length,
    }));
    counts.sort((a, b) => b.count - a.count);
    mostChild = counts[0].id;
    leastChild = counts[counts.length - 1].id;
  }

  const coverageProfile: CoverageProfile = {
    children_with_sessions_30d: childrenWith.length,
    children_without_sessions_30d: childrenWithout,
    avg_gap_days: avgGapDays,
    most_sessions_child: mostChild,
    least_sessions_child: leastChild,
  };

  // ── Trend ─────────────────────────────────────────────────────────────
  let trend: "improving" | "stable" | "declining" | "insufficient_data" = "insufficient_data";
  if (sessions90d.length >= 4) {
    const sorted = [...sessions90d].sort((a, b) => a.date.localeCompare(b.date));
    const mid = Math.floor(sorted.length / 2);
    const firstHalf = sorted.slice(0, mid);
    const secondHalf = sorted.slice(mid);

    const moodFirst = firstHalf.filter(s => s.mood_before !== null && s.mood_after !== null);
    const moodSecond = secondHalf.filter(s => s.mood_before !== null && s.mood_after !== null);

    const improvFirst = moodFirst.length > 0
      ? moodFirst.reduce((s, se) => s + ((se.mood_after ?? 0) - (se.mood_before ?? 0)), 0) / moodFirst.length
      : 0;
    const improvSecond = moodSecond.length > 0
      ? moodSecond.reduce((s, se) => s + ((se.mood_after ?? 0) - (se.mood_before ?? 0)), 0) / moodSecond.length
      : 0;

    if (improvSecond > improvFirst + 0.3) trend = "improving";
    else if (improvSecond < improvFirst - 0.3) trend = "declining";
    else trend = "stable";
  }

  // ── Scoring ───────────────────────────────────────────────────────────
  let score = 50;

  // Frequency (±12)
  if (avgPerChild30d >= 3) score += 8;
  else if (avgPerChild30d >= 2) score += 5;
  else if (avgPerChild30d >= 1) score += 2;
  else if (sessions30d.length === 0) score -= 8;
  else score -= 3;

  // Coverage (±10)
  if (childrenWithout.length === 0 && total_children > 0) score += 6;
  else if (childrenWithout.length === 1) score += 2;
  else if (childrenWithout.length > 1) score -= 5;

  // Child voice (±8)
  if (meets(childVoiceRate, 90)) score += 6;
  else if (meets(childVoiceRate, 70)) score += 3;
  else if (below(childVoiceRate, 50)) score -= 4;

  // Actions (±5)
  if (actionsPerSession >= 2) score += 4;
  else if (actionsPerSession >= 1) score += 2;
  else score -= 2;

  // Follow-up (±6)
  if (meets(followUpRate, 90)) score += 5;
  else if (meets(followUpRate, 70)) score += 2;
  else if (below(followUpRate, 50)) score -= 4;

  // Mood improvement (±6)
  if (positiveShiftRate >= 80) score += 5;
  else if (positiveShiftRate >= 60) score += 3;
  else if (positiveShiftRate < 30 && withMood.length > 0) score -= 3;

  // Goal linkage (±4)
  if (meets(goalLinkedRate, 70)) score += 3;
  else if (meets(goalLinkedRate, 40)) score += 1;
  else if (below(goalLinkedRate, 20)) score -= 2;

  // Duration quality (±4)
  if (avgDuration >= 30) score += 3;
  else if (avgDuration >= 20) score += 1;
  else if (avgDuration < 15 && sessions90d.length > 0) score -= 2;

  // Type diversity (±3)
  if (typesDistribution.length >= 4) score += 3;
  else if (typesDistribution.length >= 2) score += 1;

  // Trend (±3)
  if (trend === "improving") score += 3;
  else if (trend === "declining") score -= 3;

  score = clamp(score, 0, 100);
  const rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (meets(childVoiceRate, 90)) strengths.push(`${formatRate(childVoiceRate)} of sessions include the child's own voice — demonstrating a genuinely child-centred approach.`);
  if (avgPerChild30d >= 2) strengths.push(`${avgPerChild30d} sessions per child in the last 30 days — exceeding minimum expectations for key working frequency.`);
  if (childrenWithout.length === 0 && total_children > 0) strengths.push("All children have received key working sessions in the last 30 days — no child is missing out.");
  if (positiveShiftRate >= 70 && withMood.length > 0) strengths.push(`${positiveShiftRate}% of sessions show improved mood — key working is having a measurable therapeutic impact.`);
  if (meets(followUpRate, 90)) strengths.push(`${formatRate(followUpRate)} of follow-up actions completed — demonstrating excellent continuity of support.`);
  if (actionsPerSession >= 2) strengths.push(`Average ${actionsPerSession} actions per session — sessions are purposeful and outcome-focused.`);
  if (typesDistribution.length >= 4) strengths.push("Sessions cover a diverse range of types (therapeutic, wellbeing, life skills, goals) — holistic approach to key working.");
  if (avgDuration >= 30) strengths.push(`Average session duration of ${avgDuration} minutes — allowing meaningful engagement time.`);

  // ── Concerns ──────────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (sessions30d.length === 0 && sessions90d.length > 0) concerns.push("No key working sessions recorded in the last 30 days — immediate action needed.");
  if (childrenWithout.length > 0) {
    concerns.push(`${childrenWithout.length} child${childrenWithout.length > 1 ? "ren" : ""} had no key working sessions in the last 30 days.`);
  }
  if (below(childVoiceRate, 50)) concerns.push(`Only ${formatRate(childVoiceRate)} of sessions include the child's own voice — sessions may not be child-centred.`);
  if (below(followUpRate, 60)) concerns.push(`Only ${formatRate(followUpRate)} of follow-up actions completed — children may feel their concerns are not being addressed.`);
  if (positiveShiftRate < 30 && withMood.length > 0) concerns.push("Very few sessions show mood improvement — review the quality and approach of key working practice.");
  if (avgDuration < 15 && sessions90d.length > 0) concerns.push(`Average session duration is only ${avgDuration} minutes — insufficient time for meaningful engagement.`);
  if (trend === "declining") concerns.push("Key working quality is declining — mood outcomes are worsening over recent sessions.");

  // ── Recommendations ───────────────────────────────────────────────────
  const recs: KeyWorkingRecommendation[] = [];
  let rank = 1;

  if (sessions30d.length === 0 && sessions90d.length > 0) {
    recs.push({ rank: rank++, recommendation: "Resume key working sessions immediately — there is a 30-day gap in recorded sessions.", urgency: "immediate", regulatory_ref: "Reg 14" });
  }
  if (childrenWithout.length > 0) {
    recs.push({ rank: rank++, recommendation: `Ensure key working sessions are scheduled for all children — ${childrenWithout.length} currently without recent sessions.`, urgency: "immediate", regulatory_ref: "Reg 14" });
  }
  if (below(childVoiceRate, 70)) {
    recs.push({ rank: rank++, recommendation: "Record the child's own words in every session — their voice must be central to key working.", urgency: "soon", regulatory_ref: "Reg 7" });
  }
  if (below(followUpRate, 70)) {
    recs.push({ rank: rank++, recommendation: "Improve follow-through on session actions — children need to see that their sessions lead to change.", urgency: "soon", regulatory_ref: "Reg 14" });
  }
  if (below(goalLinkedRate, 40)) {
    recs.push({ rank: rank++, recommendation: "Link more sessions to care plan goals — this evidences purposeful, outcome-focused key working.", urgency: "planned", regulatory_ref: "Reg 14" });
  }
  if (typesDistribution.length < 3 && sessions90d.length > 0) {
    recs.push({ rank: rank++, recommendation: "Diversify session types — include therapeutic, life skills, and goal-setting alongside standard check-ins.", urgency: "planned", regulatory_ref: "Reg 14" });
  }

  // ── Insights ──────────────────────────────────────────────────────────
  const insights: KeyWorkingInsight[] = [];

  if (childrenWithout.length > 0) {
    insights.push({ text: `${childrenWithout.length} child${childrenWithout.length > 1 ? "ren have" : " has"} not had a key working session in 30 days. Ofsted will expect every child to have regular, documented 1:1 time with their key worker.`, severity: "critical" });
  }
  if (sessions30d.length === 0 && sessions90d.length > 0) {
    insights.push({ text: "No key working sessions in 30 days. This is a significant gap that would be flagged in any inspection — children's individual needs are not being addressed through structured support.", severity: "critical" });
  }
  if (positiveShiftRate >= 70 && avgImprovement >= 1 && withMood.length > 0) {
    insights.push({ text: `Excellent therapeutic impact: ${positiveShiftRate}% of sessions show mood improvement, with an average uplift of ${avgImprovement} points. This is strong evidence of effective key working.`, severity: "positive" });
  }
  if (meets(childVoiceRate, 90) && actionsPerSession >= 2 && meets(followUpRate, 80)) {
    insights.push({ text: "Outstanding key working practice: child voice consistently recorded, actions agreed and followed through. Ofsted will recognise this as evidence of child-centred care.", severity: "positive" });
  }
  if (avgPerChild30d >= 3) {
    insights.push({ text: `${avgPerChild30d} sessions per child per month exceeds typical expectations. This level of engagement demonstrates a commitment to relational practice.`, severity: "positive" });
  }
  if (trend === "improving") {
    insights.push({ text: "Key working quality is improving — mood outcomes are getting better over recent sessions.", severity: "positive" });
  }
  if (avgDuration < 15 && sessions90d.length > 0) {
    insights.push({ text: "Sessions averaging under 15 minutes may be too brief for meaningful therapeutic engagement. Consider whether time pressures are affecting quality.", severity: "warning" });
  }

  // ── Headline ──────────────────────────────────────────────────────────
  let headline: string;
  if (rating === "outstanding") {
    headline = "Outstanding key working — consistent, child-centred sessions with measurable impact on children's wellbeing.";
  } else if (rating === "good") {
    headline = `Good key working practice — ${sessions30d.length} session${sessions30d.length !== 1 ? "s" : ""} in 30 days with ${childVoiceRate}% child voice recording.`;
  } else if (rating === "adequate") {
    headline = "Adequate key working — improvements needed in frequency, quality, or coverage of sessions.";
  } else {
    headline = "Key working is inadequate — children are not receiving regular, meaningful support from their key workers.";
  }

  return {
    key_working_rating: rating,
    key_working_score: score,
    headline,
    sessions: sessionsProfile,
    mood: moodProfile,
    coverage: coverageProfile,
    strengths,
    concerns,
    recommendations: recs,
    insights,
    trend,
  };
}

// ── Empty Defaults ──────────────────────────────────────────────────────────

function emptySessions(): SessionsProfile {
  return { total_90d: 0, total_30d: 0, avg_per_child_30d: 0, avg_duration_minutes: 0, types_distribution: [], child_voice_rate: null, actions_per_session: 0, follow_up_rate: null, goal_linked_rate: null };
}

function emptyMood(): MoodProfile {
  return { sessions_with_mood: 0, avg_mood_before: 0, avg_mood_after: 0, avg_improvement: 0, positive_shift_rate: 0 };
}

function emptyCoverage(): CoverageProfile {
  return { children_with_sessions_30d: 0, children_without_sessions_30d: [], avg_gap_days: null, most_sessions_child: null, least_sessions_child: null };
}
