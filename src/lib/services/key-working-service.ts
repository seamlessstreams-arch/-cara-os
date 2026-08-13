// ══════════════════════════════════════════════════════════════════════════════
// CARA — KEY WORKING SESSION SERVICE
// Manages structured key work sessions between staff and young people,
// therapeutic framework integration, and Cara-powered session planning.
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";

import { londonWeekStart } from "@/lib/utils";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type SessionType =
  | "one_to_one" | "group" | "informal" | "therapeutic" | "life_skills" | "care_plan_review";

export type TherapeuticFramework =
  | "pace" | "arc" | "dbt_skills" | "cbt" | "motivational_interviewing"
  | "solution_focused" | "trauma_narrative" | "relational" | "none";

export type SessionStatus =
  | "planned" | "completed" | "cancelled" | "rescheduled" | "child_declined";

export interface KeyWorkSession {
  id: string;
  home_id: string;
  child_id: string;
  key_worker_id: string;
  session_type: SessionType;
  therapeutic_framework: TherapeuticFramework;
  status: SessionStatus;
  planned_date: string;
  completed_date: string | null;
  duration_minutes: number | null;
  location: string;
  topics_covered: string[];
  child_voice: string;
  child_mood: number;           // 1-5
  child_engagement: number;     // 1-5
  outcomes: string[];
  actions: string[];
  next_session_topics: string[];
  safeguarding_concerns: string | null;
  positive_observations: string[];
  attachments_count: number;
  signed_off_by: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ─────────────────────────────────────────────────────────────

/** Required minimum key work sessions per week by child placement type. */
export const SESSION_FREQUENCY: Record<string, number> = {
  standard: 1,
  high_needs: 2,
  crisis: 3,     // daily during crisis
  solo: 2,
};

/** Therapeutic frameworks available for key work sessions. */
export const THERAPEUTIC_FRAMEWORKS: {
  framework: TherapeuticFramework;
  label: string;
  description: string;
  suitableFor: string[];
}[] = [
  {
    framework: "pace",
    label: "PACE Model",
    description: "Playfulness, Acceptance, Curiosity, Empathy — for attachment-disrupted children",
    suitableFor: ["attachment_difficulties", "trauma"],
  },
  {
    framework: "arc",
    label: "ARC Framework",
    description: "Attachment, Regulation, Competency — structured trauma-informed approach",
    suitableFor: ["complex_trauma", "emotional_regulation"],
  },
  {
    framework: "dbt_skills",
    label: "DBT Skills",
    description: "Distress tolerance, emotional regulation, interpersonal effectiveness",
    suitableFor: ["self_harm", "emotional_regulation", "interpersonal"],
  },
  {
    framework: "cbt",
    label: "CBT",
    description: "Identifying and challenging negative thought patterns",
    suitableFor: ["anxiety", "depression", "anger"],
  },
  {
    framework: "motivational_interviewing",
    label: "Motivational Interviewing",
    description: "Exploring ambivalence and building motivation for change",
    suitableFor: ["substance_misuse", "behaviour_change"],
  },
  {
    framework: "solution_focused",
    label: "Solution-Focused",
    description: "Building on strengths and exploring preferred futures",
    suitableFor: ["goal_setting", "resilience"],
  },
  {
    framework: "trauma_narrative",
    label: "Trauma Narrative",
    description: "Safe processing of traumatic experiences through structured storytelling",
    suitableFor: ["ptsd", "complex_trauma"],
  },
  {
    framework: "relational",
    label: "Relational Practice",
    description: "Using the therapeutic relationship as the agent of change",
    suitableFor: ["attachment_difficulties", "trust_building"],
  },
  {
    framework: "none",
    label: "Unstructured",
    description: "Informal session without a specific therapeutic framework",
    suitableFor: ["general"],
  },
];

/** Standard key work session topics. */
export const KEY_WORK_TOPICS: string[] = [
  "Education progress",
  "Friendships and relationships",
  "Family contact",
  "Health and wellbeing",
  "Emotional regulation",
  "Future goals and aspirations",
  "Placement satisfaction",
  "Daily routine",
  "Rights and participation",
  "Safety planning",
  "Independence skills",
  "Cultural identity",
  "Hobbies and interests",
  "Positive achievements",
  "Worries and concerns",
];

// ── Pure functions (no DB) ────────────────────────────────────────────────

export interface KeyWorkComplianceResult {
  total_children: number;
  children_on_track: number;
  children_behind: number;
  compliance_percentage: number | null;
  by_child: {
    child_id: string;
    required_per_week: number;
    actual_this_week: number;
    on_track: boolean;
  }[];
}

/**
 * Compute key work compliance across all children.
 *
 * For each child placement, checks SESSION_FREQUENCY for their placement_type
 * and counts completed sessions within the current week window.
 */
export function computeKeyWorkCompliance(
  sessions: { child_id: string; status: string; completed_date: string | null }[],
  childPlacements: { child_id: string; placement_type: string; start_date: string }[],
  now: Date,
): KeyWorkComplianceResult {
  // Start of the current LONDON week (Monday) — the runtime-zone weekday put
  // the first hour of a London Monday in last week on Vercel.
  const weekStart = new Date(londonWeekStart(0, now) + "T00:00:00Z");

  const byChild: KeyWorkComplianceResult["by_child"] = [];
  let onTrack = 0;
  let behind = 0;

  for (const placement of childPlacements) {
    const requiredPerWeek = SESSION_FREQUENCY[placement.placement_type] ?? 1;

    // Count completed sessions for this child in the current week
    const actualThisWeek = sessions.filter(
      (s) =>
        s.child_id === placement.child_id &&
        s.status === "completed" &&
        s.completed_date &&
        new Date(s.completed_date) >= weekStart &&
        new Date(s.completed_date) <= now,
    ).length;

    const isOnTrack = actualThisWeek >= requiredPerWeek;
    if (isOnTrack) onTrack++;
    else behind++;

    byChild.push({
      child_id: placement.child_id,
      required_per_week: requiredPerWeek,
      actual_this_week: actualThisWeek,
      on_track: isOnTrack,
    });
  }

  const totalChildren = childPlacements.length;

  return {
    total_children: totalChildren,
    children_on_track: onTrack,
    children_behind: behind,
    compliance_percentage: totalChildren > 0 ? Math.round((onTrack / totalChildren) * 100) : null,
    by_child: byChild,
  };
}

export type SessionQualityRating = "excellent" | "good" | "adequate" | "poor";

export interface SessionQualityResult {
  total_sessions: number;
  avg_mood: number;
  avg_engagement: number;
  avg_topics_per_session: number;
  voice_capture_rate: number | null;
  positive_observation_rate: number | null;
  quality_rating: SessionQualityRating;
}

/**
 * Compute quality metrics across completed key work sessions.
 *
 * Quality rating based on combined average of mood + engagement / 2:
 *   >= 4 = excellent, >= 3 = good, >= 2 = adequate, else poor
 */
export function computeSessionQuality(
  sessions: {
    child_mood: number;
    child_engagement: number;
    topics_covered: string[];
    positive_observations: string[];
    child_voice: string;
  }[],
): SessionQualityResult {
  if (sessions.length === 0) {
    return {
      total_sessions: 0,
      avg_mood: 0,
      avg_engagement: 0,
      avg_topics_per_session: 0,
      voice_capture_rate: 0,
      positive_observation_rate: 0,
      quality_rating: "poor",
    };
  }

  let moodSum = 0;
  let engagementSum = 0;
  let topicsSum = 0;
  let voiceCount = 0;
  let positiveCount = 0;

  for (const s of sessions) {
    moodSum += s.child_mood;
    engagementSum += s.child_engagement;
    topicsSum += s.topics_covered.length;
    if (s.child_voice && s.child_voice.trim().length > 0) voiceCount++;
    if (s.positive_observations.length > 0) positiveCount++;
  }

  const total = sessions.length;
  const avgMood = Math.round((moodSum / total) * 10) / 10;
  const avgEngagement = Math.round((engagementSum / total) * 10) / 10;
  const avgTopics = Math.round((topicsSum / total) * 10) / 10;
  const voiceCaptureRate = Math.round((voiceCount / total) * 100);
  const positiveObservationRate = Math.round((positiveCount / total) * 100);

  const combinedAvg = (avgMood + avgEngagement) / 2;
  let qualityRating: SessionQualityRating;
  if (combinedAvg >= 4) qualityRating = "excellent";
  else if (combinedAvg >= 3) qualityRating = "good";
  else if (combinedAvg >= 2) qualityRating = "adequate";
  else qualityRating = "poor";

  return {
    total_sessions: total,
    avg_mood: avgMood,
    avg_engagement: avgEngagement,
    avg_topics_per_session: avgTopics,
    voice_capture_rate: voiceCaptureRate,
    positive_observation_rate: positiveObservationRate,
    quality_rating: qualityRating,
  };
}

export type TrendDirection = "improving" | "stable" | "declining";

export interface ChildProgressResult {
  total_sessions: number;
  mood_trend: TrendDirection;
  engagement_trend: TrendDirection;
  favourite_topics: string[];
  therapeutic_frameworks_used: string[];
  cancellation_rate: number | null;
}

/**
 * Compute progress over time for a single child's key work sessions.
 *
 * Mood/engagement trends compare the average of the last 5 sessions
 * against the previous 5 sessions.
 */
export function computeChildProgress(
  sessions: {
    status: string;
    child_mood: number;
    child_engagement: number;
    topics_covered: string[];
    therapeutic_framework: string;
    completed_date: string | null;
  }[],
): ChildProgressResult {
  if (sessions.length === 0) {
    return {
      total_sessions: 0,
      mood_trend: "stable",
      engagement_trend: "stable",
      favourite_topics: [],
      therapeutic_frameworks_used: [],
      cancellation_rate: 0,
    };
  }

  // Cancellation rate
  const cancelledOrDeclined = sessions.filter(
    (s) => s.status === "cancelled" || s.status === "child_declined",
  ).length;
  const cancellationRate = Math.round((cancelledOrDeclined / sessions.length) * 100);

  // Only completed sessions for trends
  const completed = sessions
    .filter((s) => s.status === "completed" && s.completed_date)
    .sort((a, b) => new Date(a.completed_date!).getTime() - new Date(b.completed_date!).getTime());

  // Topic frequency
  const topicCounts: Record<string, number> = {};
  for (const s of completed) {
    for (const t of s.topics_covered) {
      topicCounts[t] = (topicCounts[t] ?? 0) + 1;
    }
  }
  const favouriteTopics = Object.entries(topicCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([topic]) => topic);

  // Frameworks used (unique)
  const frameworkSet = new Set<string>();
  for (const s of completed) {
    if (s.therapeutic_framework && s.therapeutic_framework !== "none") {
      frameworkSet.add(s.therapeutic_framework);
    }
  }

  // Mood and engagement trends: last 5 vs previous 5
  function computeTrend(values: number[]): TrendDirection {
    if (values.length < 2) return "stable";

    const recentCount = Math.min(5, values.length);
    const recent = values.slice(-recentCount);
    const previous = values.slice(
      Math.max(0, values.length - recentCount * 2),
      values.length - recentCount,
    );

    if (previous.length === 0) return "stable";

    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const previousAvg = previous.reduce((a, b) => a + b, 0) / previous.length;
    const diff = recentAvg - previousAvg;

    if (diff > 0.3) return "improving";
    if (diff < -0.3) return "declining";
    return "stable";
  }

  const moods = completed.map((s) => s.child_mood);
  const engagements = completed.map((s) => s.child_engagement);

  return {
    total_sessions: sessions.length,
    mood_trend: computeTrend(moods),
    engagement_trend: computeTrend(engagements),
    favourite_topics: favouriteTopics,
    therapeutic_frameworks_used: Array.from(frameworkSet),
    cancellation_rate: cancellationRate,
  };
}

/**
 * Suggest topics for the next key work session based on what hasn't been
 * covered recently and the child's known needs.
 */
export function suggestSessionTopics(
  recentSessions: { topics_covered: string[] }[],
  childNeeds: string[],
): string[] {
  // Collect topics covered in the last 5 sessions
  const lastFive = recentSessions.slice(-5);
  const recentTopics = new Set<string>();
  for (const s of lastFive) {
    for (const t of s.topics_covered) {
      recentTopics.add(t);
    }
  }

  // Standard topics not covered recently
  const uncoveredStandard = KEY_WORK_TOPICS.filter((t) => !recentTopics.has(t));

  // Child needs not recently addressed
  const uncoveredNeeds = childNeeds.filter((n) => !recentTopics.has(n));

  // Combine: standard uncovered topics plus unaddressed needs (deduplicated)
  const suggestions = [...uncoveredStandard];
  for (const need of uncoveredNeeds) {
    if (!suggestions.includes(need)) {
      suggestions.push(need);
    }
  }

  return suggestions;
}

// ── CRUD ──────────────────────────────────────────────────────────────────

export async function listKeyWorkSessions(
  homeId: string,
  opts?: {
    childId?: string;
    keyWorkerId?: string;
    sessionType?: SessionType;
    status?: SessionStatus;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
  },
): Promise<ServiceResult<KeyWorkSession[]>> {
  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_key_work_sessions") as SB).select("*").eq("home_id", homeId);
  if (opts?.childId) q = q.eq("child_id", opts.childId);
  if (opts?.keyWorkerId) q = q.eq("key_worker_id", opts.keyWorkerId);
  if (opts?.sessionType) q = q.eq("session_type", opts.sessionType);
  if (opts?.status) q = q.eq("status", opts.status);
  if (opts?.dateFrom) q = q.gte("planned_date", opts.dateFrom);
  if (opts?.dateTo) q = q.lte("planned_date", opts.dateTo);
  q = q.order("planned_date", { ascending: false }).limit(opts?.limit ?? 50);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function getKeyWorkSession(
  id: string,
): Promise<ServiceResult<KeyWorkSession>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_key_work_sessions") as SB)
    .select("*")
    .eq("id", id)
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function createKeyWorkSession(
  input: {
    homeId: string;
    childId: string;
    keyWorkerId: string;
    sessionType: SessionType;
    therapeuticFramework?: TherapeuticFramework;
    plannedDate: string;
    location?: string;
    topics?: string[];
    nextSessionTopics?: string[];
  },
): Promise<ServiceResult<KeyWorkSession>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_key_work_sessions") as SB)
    .insert({
      home_id: input.homeId,
      child_id: input.childId,
      key_worker_id: input.keyWorkerId,
      session_type: input.sessionType,
      therapeutic_framework: input.therapeuticFramework ?? "none",
      status: "planned",
      planned_date: input.plannedDate,
      completed_date: null,
      duration_minutes: null,
      location: input.location ?? "",
      topics_covered: input.topics ?? [],
      child_voice: "",
      child_mood: 3,
      child_engagement: 3,
      outcomes: [],
      actions: [],
      next_session_topics: input.nextSessionTopics ?? [],
      safeguarding_concerns: null,
      positive_observations: [],
      attachments_count: 0,
      signed_off_by: null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateKeyWorkSession(
  id: string,
  updates: Partial<Record<string, unknown>>,
): Promise<ServiceResult<KeyWorkSession>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_key_work_sessions") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function completeSession(
  id: string,
  completionData: {
    durationMinutes: number;
    topicsCovered: string[];
    childVoice: string;
    childMood: number;
    childEngagement: number;
    outcomes: string[];
    actions: string[];
    nextSessionTopics?: string[];
    safeguardingConcerns?: string;
    positiveObservations?: string[];
    signedOffBy?: string;
  },
): Promise<ServiceResult<KeyWorkSession>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_key_work_sessions") as SB)
    .update({
      status: "completed",
      completed_date: new Date().toISOString(),
      duration_minutes: completionData.durationMinutes,
      topics_covered: completionData.topicsCovered,
      child_voice: completionData.childVoice,
      child_mood: completionData.childMood,
      child_engagement: completionData.childEngagement,
      outcomes: completionData.outcomes,
      actions: completionData.actions,
      next_session_topics: completionData.nextSessionTopics ?? [],
      safeguarding_concerns: completionData.safeguardingConcerns ?? null,
      positive_observations: completionData.positiveObservations ?? [],
      signed_off_by: completionData.signedOffBy ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ───────────────────────────────────────────────────────

export const _testing = {
  computeKeyWorkCompliance,
  computeSessionQuality,
  computeChildProgress,
  suggestSessionTopics,
  SESSION_FREQUENCY,
  THERAPEUTIC_FRAMEWORKS,
  KEY_WORK_TOPICS,
};
