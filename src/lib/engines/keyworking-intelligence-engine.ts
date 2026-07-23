// ══════════════════════════════════════════════════════════════════════════════
// CARA — KEYWORKING INTELLIGENCE ENGINE
//
// Pure deterministic engine — no DB calls, no side effects, no LLM calls.
// Analyses key working session frequency, quality, mood impact, therapeutic
// engagement, topic coverage, follow-up compliance, and child voice.
//
// Regulatory: Reg 9 (Registered person: statement of purpose and quality of care),
// Reg 14 (Care plans), Reg 22 (Young person's views/wishes).
// SCCIF: How well children are helped and protected.
// ══════════════════════════════════════════════════════════════════════════════

import { below, formatRate, meets, rate, rateOf } from "@/lib/metrics/rate";

// ── Input Types ─────────────────────────────────────────────────────────────

export interface ChildInput {
  id: string;
  name: string;
}

export type SessionType =
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
  child_id: string;
  staff_id: string;
  date: string;         // ISO date
  type: SessionType;
  duration_minutes: number;
  topics: string[];
  has_child_voice: boolean;    // whether child_voice was recorded
  mood_before: number;         // 1-5
  mood_after: number;          // 1-5
  follow_up_date: string;      // ISO date — when follow-up is due
  follow_up_completed: boolean;
  actions_agreed_count: number;
  linked_goals_count: number;
}

export interface KeyworkingIntelligenceInput {
  children: ChildInput[];
  sessions: KeyworkSessionInput[];
  today?: string; // ISO date — injectable for deterministic tests
}

// ── Output Types ────────────────────────────────────────────────────────────

export interface KeyworkingOverview {
  total_sessions_30d: number;
  total_sessions_90d: number;
  avg_sessions_per_child_30d: number;
  avg_duration_minutes: number;
  child_voice_rate: number | null;     // 0-100 — % sessions with child voice; null = no sessions recorded
  follow_up_completion_rate: number | null; // 0-100; null = no follow-up was due
  mood_improvement_rate: number | null;     // 0-100 — % sessions where mood improved
  therapeutic_sessions_30d: number;
}

export interface ChildKeyworkProfile {
  child_id: string;
  child_name: string;
  sessions_30d: number;
  sessions_90d: number;
  avg_duration: number;
  primary_worker: string | null;  // staff_id with most sessions
  session_types: SessionType[];   // unique types used
  avg_mood_improvement: number;   // avg(after - before)
  follow_up_completion_rate: number | null;
  voice_captured_rate: number | null;
  last_session_days_ago: number;  // NO_SESSION_RECORDED when the child has never had one
  compliance: "on_track" | "below_target" | "overdue";
}

export interface TopicAnalysis {
  topic: string;
  session_count: number;
  children_count: number;
}

export interface SessionTypeBreakdown {
  type: SessionType;
  label: string;
  count_30d: number;
  avg_mood_change: number;
}

export interface FollowUpCompliance {
  total_due: number;
  completed: number;
  overdue: number;
  completion_rate: number | null;
}

export interface KeyworkingAlert {
  severity: "critical" | "high" | "medium" | "low";
  message: string;
}

export interface CaraKeyworkingInsight {
  severity: "critical" | "warning" | "positive";
  text: string;
}

export interface KeyworkingIntelligenceResult {
  overview: KeyworkingOverview;
  child_profiles: ChildKeyworkProfile[];
  topic_analysis: TopicAnalysis[];
  session_type_breakdown: SessionTypeBreakdown[];
  follow_up_compliance: FollowUpCompliance;
  alerts: KeyworkingAlert[];
  insights: CaraKeyworkingInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  one_to_one: "1:1 Session",
  group: "Group Session",
  informal: "Informal Check-in",
  review: "Review Meeting",
  wellbeing_check: "Wellbeing Check",
  goal_setting: "Goal Setting",
  life_skills: "Life Skills",
  therapeutic: "Therapeutic",
};

export function daysBetween(a: string, b: string): number {
  const msA = new Date(a).getTime();
  const msB = new Date(b).getTime();
  return Math.round(Math.abs(msB - msA) / 86_400_000);
}

export function average(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

export function mostFrequent(arr: string[]): string | null {
  if (arr.length === 0) return null;
  const counts = new Map<string, number>();
  for (const v of arr) counts.set(v, (counts.get(v) ?? 0) + 1);
  let best = arr[0];
  let bestCount = 0;
  for (const [k, c] of counts) {
    if (c > bestCount) { best = k; bestCount = c; }
  }
  return best;
}

/** Sentinel for "this child has no keywork session on record at all". */
export const NO_SESSION_RECORDED = 999;

/** Keywork compliance: expects 1 session per child per 7 days minimum */
export function computeCompliance(
  sessions30d: number,
  daysSinceLastSession: number,
): "on_track" | "below_target" | "overdue" {
  if (daysSinceLastSession > 14) return "overdue";
  if (sessions30d < 3) return "below_target"; // expect ~4 per 30 days
  return "on_track";
}

// ── Main Computation ────────────────────────────────────────────────────────

export function computeKeyworkingIntelligence(input: KeyworkingIntelligenceInput): KeyworkingIntelligenceResult {
  const today = input.today ?? new Date().toISOString().slice(0, 10);
  const { children, sessions } = input;

  // ── Filter by time period ──────────────────────────────────────────────
  const sessions30d = sessions.filter((s) => daysBetween(s.date, today) <= 30);
  const sessions90d = sessions.filter((s) => daysBetween(s.date, today) <= 90);

  // ── Overview ──────────────────────────────────────────────────────────
  const childCount = children.length || 1;
  const sessionsWithVoice = sessions30d.filter((s) => s.has_child_voice);
  const sessionsWithMoodImprovement = sessions30d.filter((s) => s.mood_after > s.mood_before);
  const therapeuticSessions = sessions30d.filter((s) => s.type === "therapeutic");

  // Follow-up completion (from all sessions with a valid follow-up date that has passed)
  const followUpsDue = sessions.filter((s) => s.follow_up_date && s.follow_up_date <= today && s.follow_up_date !== "");
  const followUpsCompleted = followUpsDue.filter((s) => s.follow_up_completed);

  const overview: KeyworkingOverview = {
    total_sessions_30d: sessions30d.length,
    total_sessions_90d: sessions90d.length,
    avg_sessions_per_child_30d: Math.round((sessions30d.length / childCount) * 10) / 10,
    avg_duration_minutes: Math.round(average(sessions30d.map((s) => s.duration_minutes))),
    child_voice_rate: rateOf(sessionsWithVoice, sessions30d),
    follow_up_completion_rate: rateOf(followUpsCompleted, followUpsDue),
    mood_improvement_rate: rateOf(sessionsWithMoodImprovement, sessions30d),
    therapeutic_sessions_30d: therapeuticSessions.length,
  };

  // ── Child Profiles ─────────────────────────────────────────────────────
  const child_profiles: ChildKeyworkProfile[] = children.map((child) => {
    const child30d = sessions30d.filter((s) => s.child_id === child.id);
    const child90d = sessions90d.filter((s) => s.child_id === child.id);
    const childAll = sessions.filter((s) => s.child_id === child.id);

    const durations = child30d.map((s) => s.duration_minutes);
    const moodChanges = child30d.map((s) => s.mood_after - s.mood_before);
    const staffIds = childAll.map((s) => s.staff_id);
    const types = [...new Set(child90d.map((s) => s.type))];

    // Follow-up for this child
    const childFollowUps = childAll.filter((s) => s.follow_up_date && s.follow_up_date <= today && s.follow_up_date !== "");
    const childCompleted = childFollowUps.filter((s) => s.follow_up_completed);

    // Voice captured
    const voiceSessions = child30d.filter((s) => s.has_child_voice);

    // Last session
    const sorted = [...childAll].sort((a, b) => b.date.localeCompare(a.date));
    const lastDate = sorted[0]?.date;
    const daysSinceLast = lastDate ? daysBetween(lastDate, today) : NO_SESSION_RECORDED;

    return {
      child_id: child.id,
      child_name: child.name,
      sessions_30d: child30d.length,
      sessions_90d: child90d.length,
      avg_duration: Math.round(average(durations)),
      primary_worker: mostFrequent(staffIds),
      session_types: types,
      avg_mood_improvement: Math.round(average(moodChanges) * 10) / 10,
      follow_up_completion_rate: rateOf(childCompleted, childFollowUps),
      voice_captured_rate: rateOf(voiceSessions, child30d),
      last_session_days_ago: daysSinceLast,
      compliance: computeCompliance(child30d.length, daysSinceLast),
    };
  });

  // ── Topic Analysis ─────────────────────────────────────────────────────
  const topicMap = new Map<string, { count: number; children: Set<string> }>();
  for (const s of sessions90d) {
    for (const topic of s.topics) {
      const lower = topic.toLowerCase();
      if (!topicMap.has(lower)) topicMap.set(lower, { count: 0, children: new Set() });
      const entry = topicMap.get(lower)!;
      entry.count++;
      entry.children.add(s.child_id);
    }
  }
  const topic_analysis: TopicAnalysis[] = [...topicMap.entries()]
    .map(([topic, data]) => ({
      topic,
      session_count: data.count,
      children_count: data.children.size,
    }))
    .sort((a, b) => b.session_count - a.session_count)
    .slice(0, 10);

  // ── Session Type Breakdown ─────────────────────────────────────────────
  const typeMap = new Map<SessionType, KeyworkSessionInput[]>();
  for (const s of sessions30d) {
    if (!typeMap.has(s.type)) typeMap.set(s.type, []);
    typeMap.get(s.type)!.push(s);
  }
  const session_type_breakdown: SessionTypeBreakdown[] = [...typeMap.entries()]
    .map(([type, typeSessions]) => ({
      type,
      label: SESSION_TYPE_LABELS[type],
      count_30d: typeSessions.length,
      avg_mood_change: Math.round(average(typeSessions.map((s) => s.mood_after - s.mood_before)) * 10) / 10,
    }))
    .sort((a, b) => b.count_30d - a.count_30d);

  // ── Follow-Up Compliance ───────────────────────────────────────────────
  const overdueFU = followUpsDue.filter((s) => !s.follow_up_completed);
  const follow_up_compliance: FollowUpCompliance = {
    total_due: followUpsDue.length,
    completed: followUpsCompleted.length,
    overdue: overdueFU.length,
    completion_rate: rate(followUpsCompleted.length, followUpsDue.length),
  };

  // ── Alerts ─────────────────────────────────────────────────────────────
  const alerts: KeyworkingAlert[] = [];

  // Critical: child with no session in 14+ days
  const overdueChildren = child_profiles.filter((c) => c.compliance === "overdue");
  if (overdueChildren.length > 0) {
    for (const c of overdueChildren) {
      alerts.push({
        severity: "critical",
        message: c.last_session_days_ago === NO_SESSION_RECORDED
          ? `${c.child_name} has no keywork session on record — schedule immediately`
          : `${c.child_name} has not had a keywork session in ${c.last_session_days_ago} days — schedule immediately`,
      });
    }
  }

  // High: low follow-up completion
  if (followUpsDue.length >= 3 && below(follow_up_compliance.completion_rate, 60)) {
    alerts.push({
      severity: "high",
      message: `Follow-up completion rate is ${formatRate(follow_up_compliance.completion_rate)} — ${overdueFU.length} action${overdueFU.length > 1 ? "s" : ""} overdue`,
    });
  }

  // Medium: child below target
  const belowTarget = child_profiles.filter((c) => c.compliance === "below_target");
  if (belowTarget.length > 0) {
    alerts.push({
      severity: "medium",
      message: `${belowTarget.length} child${belowTarget.length > 1 ? "ren" : ""} below target for keywork frequency (fewer than 3 sessions in 30 days)`,
    });
  }

  // Medium: low child voice capture
  if (sessions30d.length >= 3 && below(overview.child_voice_rate, 70)) {
    alerts.push({
      severity: "medium",
      message: `Child voice captured in only ${formatRate(overview.child_voice_rate)} of sessions — Reg 22 requires consistent recording of wishes and feelings`,
    });
  }

  // Low: sessions without linked goals
  const noGoals = sessions30d.filter((s) => s.linked_goals_count === 0);
  if (sessions30d.length >= 3 && noGoals.length > sessions30d.length * 0.5) {
    alerts.push({
      severity: "low",
      message: `${noGoals.length} of ${sessions30d.length} sessions have no linked outcome targets — connect keywork to care plan goals`,
    });
  }

  // ── Cara Insights ─────────────────────────────────────────────────────
  const insights: CaraKeyworkingInsight[] = [];

  // Critical: overdue children
  if (overdueChildren.length > 0) {
    const names = overdueChildren.map((c) => c.child_name).join(", ");
    insights.push({
      severity: "critical",
      text: `${names} ${overdueChildren.length > 1 ? "have" : "has"} not had keywork sessions for 14+ days. This may indicate relationship disruption or staffing issues. Prioritise re-engagement and review key worker allocation.`,
    });
  }

  // Warning: sessions not improving mood
  if (sessions30d.length >= 4 && below(overview.mood_improvement_rate, 40)) {
    insights.push({
      severity: "warning",
      text: `Only ${formatRate(overview.mood_improvement_rate)} of sessions show mood improvement. Consider reviewing session approaches — therapeutic techniques, environment, timing, and whether children feel safe to engage.`,
    });
  }

  // Warning: follow-up incomplete
  if (follow_up_compliance.overdue > 2) {
    insights.push({
      severity: "warning",
      text: `${follow_up_compliance.overdue} keywork follow-up actions are overdue. Incomplete follow-through may erode children's trust and undermine the therapeutic relationship.`,
    });
  }

  // Positive: good engagement
  if (sessions30d.length >= 4 && meets(overview.mood_improvement_rate, 70)) {
    insights.push({
      severity: "positive",
      text: `${formatRate(overview.mood_improvement_rate)} of keywork sessions resulted in mood improvement. Strong evidence of positive therapeutic relationships and effective practice.`,
    });
  }

  // Positive: high voice capture
  if (sessions30d.length >= 4 && meets(overview.child_voice_rate, 90)) {
    insights.push({
      severity: "positive",
      text: `Child voice captured in ${formatRate(overview.child_voice_rate)} of sessions. Excellent Reg 22 compliance — children's wishes and feelings are being consistently heard and recorded.`,
    });
  }

  // Positive: good frequency across all children
  if (children.length > 0 && child_profiles.every((c) => c.compliance === "on_track")) {
    insights.push({
      severity: "positive",
      text: `All ${children.length} children are on track for keywork frequency. Consistent engagement supports attachment, trust-building, and care plan progress.`,
    });
  }

  return {
    overview,
    child_profiles,
    topic_analysis,
    session_type_breakdown,
    follow_up_compliance,
    alerts,
    insights,
  };
}
