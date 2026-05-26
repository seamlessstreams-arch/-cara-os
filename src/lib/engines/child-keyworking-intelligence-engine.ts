// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CHILD KEYWORKING INTELLIGENCE ENGINE
// Per-child engine analysing keyworking session frequency, quality,
// mood impact, thematic coverage, follow-up completion, and whether
// keywork is driving meaningful engagement and progress.
//
// Pure deterministic engine — no DB calls, no side effects, no LLM calls.
// Injectable `today` parameter for deterministic testing.
//
// Regulatory: CHR 2015 Reg 5 (placement plan), Reg 6 (quality of care),
// Reg 7 (children's views), Reg 10 (daily life). SCCIF: "Quality of care."
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export type KeyworkSessionType =
  | "one_to_one"
  | "group"
  | "informal"
  | "review"
  | "wellbeing_check"
  | "goal_setting"
  | "life_skills"
  | "therapeutic";

export interface KeyworkSessionInput {
  id: string;
  date: string;
  type: KeyworkSessionType;
  duration_minutes: number;
  topics: string[];
  has_child_voice: boolean;
  mood_before: number;            // 1-5
  mood_after: number;             // 1-5
  actions_count: number;
  follow_up_completed: boolean;
  has_follow_up: boolean;         // whether a follow-up was set
  staff_id: string;
}

export interface ChildKeyworkingInput {
  today: string;
  child_id: string;
  child_name: string;
  sessions: KeyworkSessionInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type KeyworkingQualityRating = "outstanding" | "good" | "adequate" | "inadequate" | "no_sessions";

export interface FrequencyProfile {
  total_sessions: number;
  sessions_30d: number;
  sessions_90d: number;
  avg_per_week_30d: number;       // rounded to 1dp
  avg_per_week_90d: number;
  trend: "increasing" | "stable" | "decreasing" | "insufficient_data";
}

export interface MoodImpact {
  avg_mood_before: number;
  avg_mood_after: number;
  avg_improvement: number;        // avg (after - before)
  positive_impact_rate: number;   // % sessions where mood improved
  no_change_rate: number;
  negative_impact_rate: number;
}

export interface SessionTypeBreakdown {
  type: KeyworkSessionType;
  count: number;
  percentage: number;
}

export interface QualityMetrics {
  child_voice_rate: number;       // % with child voice
  follow_up_set_rate: number;     // % with follow-up set
  follow_up_completion_rate: number; // % of set follow-ups completed
  avg_duration_minutes: number;
  avg_actions_per_session: number;
  topic_variety: number;          // unique topics count
}

export interface KeyworkRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  domain: string;
  regulatory_ref: string;
}

export interface KeyworkInsight {
  severity: "critical" | "warning" | "positive";
  text: string;
}

export interface ChildKeyworkingResult {
  generated_at: string;
  child_id: string;
  child_name: string;
  quality_rating: KeyworkingQualityRating;
  quality_score: number;           // 0-100
  headline: string;
  frequency: FrequencyProfile;
  mood_impact: MoodImpact;
  session_types: SessionTypeBreakdown[];
  quality_metrics: QualityMetrics;
  key_worker_consistency: boolean;
  key_worker_ids: string[];
  strengths: string[];
  concerns: string[];
  recommendations: KeyworkRecommendation[];
  insights: KeyworkInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function daysAgo(today: string, date: string): number {
  return Math.round(
    (new Date(today).getTime() - new Date(date).getTime()) / 86_400_000,
  );
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function pct(n: number, d: number): number {
  return d > 0 ? Math.round((n / d) * 100) : 0;
}

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
}

// ── Main Computation ────────────────────────────────────────────────────────

export function computeChildKeyworking(
  input: ChildKeyworkingInput,
): ChildKeyworkingResult {
  const { today, child_id, child_name, sessions } = input;

  // Sort by date descending (most recent first)
  const sorted = [...sessions].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  // ── Frequency ─────────────────────────────────────────────────────────
  const sessions30d = sorted.filter((s) => daysAgo(today, s.date) <= 30 && daysAgo(today, s.date) >= 0);
  const sessions90d = sorted.filter((s) => daysAgo(today, s.date) <= 90 && daysAgo(today, s.date) >= 0);

  const avgPerWeek30d = sessions30d.length > 0 ? Math.round((sessions30d.length / 4.3) * 10) / 10 : 0;
  const avgPerWeek90d = sessions90d.length > 0 ? Math.round((sessions90d.length / 12.9) * 10) / 10 : 0;

  // Trend: compare first half vs second half of 90d window
  let trend: "increasing" | "stable" | "decreasing" | "insufficient_data" = "insufficient_data";
  if (sessions90d.length >= 4) {
    const first45d = sessions90d.filter((s) => daysAgo(today, s.date) <= 45);
    const last45d = sessions90d.filter((s) => daysAgo(today, s.date) > 45 && daysAgo(today, s.date) <= 90);
    if (first45d.length > last45d.length + 1) trend = "increasing";
    else if (last45d.length > first45d.length + 1) trend = "decreasing";
    else trend = "stable";
  }

  const frequency: FrequencyProfile = {
    total_sessions: sessions.length,
    sessions_30d: sessions30d.length,
    sessions_90d: sessions90d.length,
    avg_per_week_30d: avgPerWeek30d,
    avg_per_week_90d: avgPerWeek90d,
    trend,
  };

  // ── Mood Impact ───────────────────────────────────────────────────────
  const moodBefores = sessions.map((s) => s.mood_before);
  const moodAfters = sessions.map((s) => s.mood_after);
  const moodChanges = sessions.map((s) => s.mood_after - s.mood_before);
  const positiveImpact = sessions.filter((s) => s.mood_after > s.mood_before);
  const noChange = sessions.filter((s) => s.mood_after === s.mood_before);
  const negativeImpact = sessions.filter((s) => s.mood_after < s.mood_before);

  const mood_impact: MoodImpact = {
    avg_mood_before: avg(moodBefores),
    avg_mood_after: avg(moodAfters),
    avg_improvement: avg(moodChanges),
    positive_impact_rate: pct(positiveImpact.length, sessions.length),
    no_change_rate: pct(noChange.length, sessions.length),
    negative_impact_rate: pct(negativeImpact.length, sessions.length),
  };

  // ── Session Type Breakdown ────────────────────────────────────────────
  const typeCounts = new Map<KeyworkSessionType, number>();
  for (const s of sessions) {
    typeCounts.set(s.type, (typeCounts.get(s.type) ?? 0) + 1);
  }
  const session_types: SessionTypeBreakdown[] = [...typeCounts.entries()]
    .map(([type, count]) => ({
      type,
      count,
      percentage: pct(count, sessions.length),
    }))
    .sort((a, b) => b.count - a.count);

  // ── Quality Metrics ───────────────────────────────────────────────────
  const withVoice = sessions.filter((s) => s.has_child_voice);
  const withFollowUp = sessions.filter((s) => s.has_follow_up);
  const followUpCompleted = withFollowUp.filter((s) => s.follow_up_completed);
  const allTopics = sessions.flatMap((s) => s.topics);
  const uniqueTopics = new Set(allTopics.map((t) => t.toLowerCase().trim()));

  const quality_metrics: QualityMetrics = {
    child_voice_rate: pct(withVoice.length, sessions.length),
    follow_up_set_rate: pct(withFollowUp.length, sessions.length),
    follow_up_completion_rate: pct(followUpCompleted.length, withFollowUp.length),
    avg_duration_minutes: Math.round(avg(sessions.map((s) => s.duration_minutes))),
    avg_actions_per_session: avg(sessions.map((s) => s.actions_count)),
    topic_variety: uniqueTopics.size,
  };

  // ── Key Worker Consistency ────────────────────────────────────────────
  const staffIds = [...new Set(sessions.map((s) => s.staff_id))];
  // Consistent if majority of sessions by one staff member
  const staffCounts = new Map<string, number>();
  for (const s of sessions) {
    staffCounts.set(s.staff_id, (staffCounts.get(s.staff_id) ?? 0) + 1);
  }
  const maxStaffCount = Math.max(...[...staffCounts.values()], 0);
  const key_worker_consistency = sessions.length >= 2 ? maxStaffCount >= sessions.length * 0.6 : true;

  // ── Score ─────────────────────────────────────────────────────────────
  let score = 50;

  if (sessions.length === 0) {
    score = 0;
  } else {
    // Frequency
    if (frequency.sessions_30d >= 4) score += 10;
    else if (frequency.sessions_30d >= 2) score += 5;
    else if (frequency.sessions_30d === 0) score -= 15;
    else score -= 5;

    // Mood impact
    if (mood_impact.positive_impact_rate >= 80) score += 10;
    else if (mood_impact.positive_impact_rate >= 50) score += 5;
    if (mood_impact.negative_impact_rate > 20) score -= 5;

    // Child voice
    if (quality_metrics.child_voice_rate === 100) score += 10;
    else if (quality_metrics.child_voice_rate >= 80) score += 5;
    else if (quality_metrics.child_voice_rate < 50) score -= 10;

    // Follow-up completion
    if (quality_metrics.follow_up_completion_rate >= 80 && withFollowUp.length >= 2) score += 5;
    else if (quality_metrics.follow_up_completion_rate < 50 && withFollowUp.length >= 2) score -= 5;

    // Session variety
    if (session_types.length >= 4) score += 5;
    else if (session_types.length >= 2) score += 2;

    // Duration
    if (quality_metrics.avg_duration_minutes >= 30) score += 3;
    else if (quality_metrics.avg_duration_minutes < 15) score -= 3;

    // Key worker consistency
    if (key_worker_consistency && sessions.length >= 3) score += 3;
    if (!key_worker_consistency && sessions.length >= 3) score -= 3;

    // Trend
    if (trend === "increasing") score += 3;
    if (trend === "decreasing") score -= 5;
  }

  score = clamp(score, 0, 100);

  const quality_rating: KeyworkingQualityRating =
    sessions.length === 0 ? "no_sessions" :
    score >= 80 ? "outstanding" :
    score >= 65 ? "good" :
    score >= 45 ? "adequate" :
    "inadequate";

  // ── Headline ──────────────────────────────────────────────────────────
  const parts: string[] = [];
  parts.push(`Keyworking quality: ${quality_rating}`);
  if (sessions.length > 0) {
    parts.push(`${sessions.length} session${sessions.length !== 1 ? "s" : ""}`);
    parts.push(`${frequency.sessions_30d} in last 30d`);
  }
  if (mood_impact.avg_improvement > 0) parts.push(`avg mood +${mood_impact.avg_improvement}`);
  if (frequency.sessions_30d === 0 && sessions.length > 0) parts.push("no recent sessions");
  const headline = parts.join(". ") + ".";

  // ── Strengths ─────────────────────────────────────────────────────────
  const strengths: string[] = [];

  if (quality_rating === "outstanding" || quality_rating === "good") {
    strengths.push(`Keyworking quality rated ${quality_rating} (${score}%). Sessions are regular, the child's voice is captured, and there's clear evidence of positive impact on ${child_name}'s mood and engagement.`);
  }

  if (mood_impact.positive_impact_rate >= 70 && sessions.length >= 3) {
    strengths.push(`${mood_impact.positive_impact_rate}% of sessions result in improved mood (avg +${mood_impact.avg_improvement}). This demonstrates that keywork sessions are a positive, therapeutic experience for ${child_name} — not just procedural check-ins.`);
  }

  if (quality_metrics.child_voice_rate === 100 && sessions.length >= 2) {
    strengths.push(`${child_name}'s voice is captured in 100% of sessions. The child's perspective, feelings, and wishes are consistently recorded — evidencing genuine child-centred practice.`);
  }

  if (quality_metrics.follow_up_completion_rate >= 80 && withFollowUp.length >= 2) {
    strengths.push(`${quality_metrics.follow_up_completion_rate}% of agreed follow-ups completed. This shows that keywork sessions drive action — they're not just conversations, they lead to real change.`);
  }

  if (session_types.length >= 4) {
    strengths.push(`${session_types.length} different session types used (${session_types.slice(0, 3).map((t) => t.type.replace(/_/g, " ")).join(", ")}). Varied approaches demonstrate that keywork is tailored to ${child_name}'s changing needs.`);
  }

  if (frequency.avg_per_week_30d >= 1.5) {
    strengths.push(`${frequency.avg_per_week_30d} sessions per week over the last 30 days. High-frequency contact builds trust and enables early intervention when issues arise.`);
  }

  // ── Concerns ──────────────────────────────────────────────────────────
  const concerns: string[] = [];

  if (sessions.length === 0) {
    concerns.push(`No keyworking sessions recorded for ${child_name}. Regular, meaningful keywork is fundamental to quality care — it's how the home builds relationships, captures the child's voice, and tracks their wellbeing. This is a serious gap.`);
  }

  if (frequency.sessions_30d === 0 && sessions.length > 0) {
    concerns.push(`No keyworking sessions in the last 30 days. This means ${child_name} has not had structured 1:1 time with their key worker for over a month — this is below the minimum expected standard.`);
  }

  if (quality_metrics.child_voice_rate < 80 && sessions.length >= 2) {
    concerns.push(`${child_name}'s voice captured in only ${quality_metrics.child_voice_rate}% of sessions. Every keywork session should record the child's own words, feelings, and views — this is what makes keywork meaningful and what inspectors look for.`);
  }

  if (quality_metrics.follow_up_completion_rate < 50 && withFollowUp.length >= 2) {
    concerns.push(`Only ${quality_metrics.follow_up_completion_rate}% of follow-ups completed. When agreed actions aren't followed through, it undermines the child's trust and reduces the effectiveness of keywork.`);
  }

  if (mood_impact.negative_impact_rate > 20 && sessions.length >= 3) {
    concerns.push(`${mood_impact.negative_impact_rate}% of sessions resulted in worse mood. While some difficult conversations are necessary, a pattern of negative mood impact may indicate that sessions need adapting or that ${child_name} needs additional support.`);
  }

  if (!key_worker_consistency && sessions.length >= 3) {
    concerns.push(`Keywork sessions delivered by multiple staff without clear consistency. Children benefit from a primary key worker relationship — inconsistency can undermine trust and continuity.`);
  }

  if (trend === "decreasing") {
    concerns.push("Keyworking frequency is decreasing. Fewer sessions mean fewer opportunities to connect with the child, identify emerging issues, and evidence the child's voice.");
  }

  // ── Recommendations ───────────────────────────────────────────────────
  const recommendations: KeyworkRecommendation[] = [];
  let rank = 0;

  if (sessions.length === 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: `Schedule keywork sessions for ${child_name} immediately. Aim for at least weekly 1:1 sessions with a consistent key worker, using a mix of structured and informal approaches.`,
      urgency: "immediate",
      domain: "frequency",
      regulatory_ref: "Reg 6",
    });
  }

  if (frequency.sessions_30d === 0 && sessions.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: `Resume regular keywork sessions with ${child_name}. A gap of over 30 days is too long — schedule a session this week to re-establish the routine.`,
      urgency: "immediate",
      domain: "frequency",
      regulatory_ref: "Reg 6",
    });
  }

  if (quality_metrics.child_voice_rate < 80 && sessions.length >= 2) {
    recommendations.push({
      rank: ++rank,
      recommendation: `Ensure ${child_name}'s voice is recorded in every session. Use open questions, sentence starters, or creative tools (drawing, writing) to capture the child's perspective in their own words.`,
      urgency: "soon",
      domain: "quality",
      regulatory_ref: "Reg 7",
    });
  }

  if (quality_metrics.follow_up_completion_rate < 50 && withFollowUp.length >= 2) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Improve follow-up completion. Track agreed actions in a visible system and review at the start of each session. Unfulfilled promises damage the child's trust in key workers.",
      urgency: "soon",
      domain: "follow_up",
      regulatory_ref: "Reg 6",
    });
  }

  if (session_types.length < 3 && sessions.length >= 3) {
    recommendations.push({
      rank: ++rank,
      recommendation: `Diversify keywork session types. Beyond 1:1s, try life skills sessions, wellbeing checks, goal-setting, or informal conversations to build a richer relationship with ${child_name}.`,
      urgency: "planned",
      domain: "variety",
      regulatory_ref: "Reg 10",
    });
  }

  // ── ARIA Insights ─────────────────────────────────────────────────────
  const insights: KeyworkInsight[] = [];

  if (quality_rating === "inadequate") {
    insights.push({
      severity: "critical",
      text: `Keyworking quality is inadequate (${score}%). Ofsted expects to see regular, meaningful keywork sessions that capture the child's voice and lead to action. The current position falls significantly below expectations and would be highlighted at inspection.`,
    });
  }

  if (sessions.length === 0) {
    insights.push({
      severity: "critical",
      text: `No keywork sessions recorded. Keyworking is the primary mechanism through which children's homes build relationships, capture the child's voice, and evidence quality of care. This gap must be addressed immediately.`,
    });
  }

  if (quality_rating === "outstanding") {
    insights.push({
      severity: "positive",
      text: `Keyworking quality is outstanding (${score}%). Sessions are frequent, varied, and have measurable positive impact on ${child_name}'s mood. The child's voice is central, and follow-ups are completed. This is exemplary practice.`,
    });
  }

  if (mood_impact.positive_impact_rate >= 80 && quality_metrics.child_voice_rate >= 90 && sessions.length >= 4) {
    insights.push({
      severity: "positive",
      text: `${mood_impact.positive_impact_rate}% positive mood impact combined with ${quality_metrics.child_voice_rate}% voice capture demonstrates therapeutic-quality keywork. Sessions are clearly meeting ${child_name}'s emotional needs and providing a safe space for expression.`,
    });
  }

  if (mood_impact.avg_improvement >= 1.5 && sessions.length >= 3) {
    insights.push({
      severity: "positive",
      text: `Average mood improvement of +${mood_impact.avg_improvement} per session. This quantifiable impact shows that keywork is genuinely therapeutic — each session leaves ${child_name} feeling better than before.`,
    });
  }

  return {
    generated_at: today,
    child_id,
    child_name,
    quality_rating,
    quality_score: score,
    headline,
    frequency,
    mood_impact,
    session_types,
    quality_metrics,
    key_worker_consistency,
    key_worker_ids: staffIds,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
