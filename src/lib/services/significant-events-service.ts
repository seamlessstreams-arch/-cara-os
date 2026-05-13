// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — SIGNIFICANT EVENTS SERVICE
// Records and tracks significant events in children's lives — positive
// achievements, milestones, life changes, and important moments.
// CHR 2015 Reg 36 (daily log — significant events),
// Reg 6 (quality and purpose of care — celebrating achievements),
// Reg 7 (children's views — recording wishes and feelings).
//
// Distinct from incident recording — this captures the full picture
// of a child's journey including positive events, achievements,
// birthdays, family milestones, and life transitions.
//
// SCCIF: Overall Experiences — "Children's achievements are
// celebrated." "Significant events are recorded and responded to."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type EventCategory =
  | "achievement"
  | "birthday"
  | "education_milestone"
  | "health_milestone"
  | "family_contact"
  | "placement_change"
  | "court_hearing"
  | "review_meeting"
  | "therapy_breakthrough"
  | "behavioural_progress"
  | "life_skill_gained"
  | "community_involvement"
  | "religious_cultural"
  | "transition"
  | "bereavement"
  | "other";

export type EventSentiment =
  | "very_positive"
  | "positive"
  | "neutral"
  | "negative"
  | "very_negative";

export type EventImpact =
  | "high"
  | "medium"
  | "low";

export interface SignificantEvent {
  id: string;
  home_id: string;
  child_name: string;
  child_id: string;
  event_date: string;
  category: EventCategory;
  title: string;
  description: string;
  sentiment: EventSentiment;
  impact: EventImpact;
  recorded_by: string;
  child_views: string | null;
  follow_up_actions: string[];
  shared_with_family: boolean;
  shared_with_social_worker: boolean;
  added_to_life_story: boolean;
  photos_attached: boolean;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const EVENT_CATEGORIES: { category: EventCategory; label: string }[] = [
  { category: "achievement", label: "Achievement" },
  { category: "birthday", label: "Birthday" },
  { category: "education_milestone", label: "Education Milestone" },
  { category: "health_milestone", label: "Health Milestone" },
  { category: "family_contact", label: "Family Contact" },
  { category: "placement_change", label: "Placement Change" },
  { category: "court_hearing", label: "Court Hearing" },
  { category: "review_meeting", label: "Review Meeting" },
  { category: "therapy_breakthrough", label: "Therapy Breakthrough" },
  { category: "behavioural_progress", label: "Behavioural Progress" },
  { category: "life_skill_gained", label: "Life Skill Gained" },
  { category: "community_involvement", label: "Community Involvement" },
  { category: "religious_cultural", label: "Religious/Cultural" },
  { category: "transition", label: "Transition" },
  { category: "bereavement", label: "Bereavement" },
  { category: "other", label: "Other" },
];

export const EVENT_SENTIMENTS: { sentiment: EventSentiment; label: string }[] = [
  { sentiment: "very_positive", label: "Very Positive" },
  { sentiment: "positive", label: "Positive" },
  { sentiment: "neutral", label: "Neutral" },
  { sentiment: "negative", label: "Negative" },
  { sentiment: "very_negative", label: "Very Negative" },
];

export const EVENT_IMPACTS: { impact: EventImpact; label: string }[] = [
  { impact: "high", label: "High" },
  { impact: "medium", label: "Medium" },
  { impact: "low", label: "Low" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

/**
 * Compute significant events metrics.
 */
export function computeEventMetrics(
  events: SignificantEvent[],
  totalChildren: number,
  now: Date = new Date(),
): {
  total_events: number;
  events_this_month: number;
  positive_events: number;
  negative_events: number;
  positive_ratio: number;
  achievements: number;
  children_with_events: number;
  event_coverage: number;
  child_views_recorded_rate: number;
  shared_with_family_rate: number;
  added_to_life_story_rate: number;
  follow_ups_pending: number;
  high_impact_count: number;
  by_category: Record<string, number>;
  by_sentiment: Record<string, number>;
  by_impact: Record<string, number>;
  by_child: Record<string, number>;
} {
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const thisMonth = events.filter(
    (e) => new Date(e.event_date) >= thirtyDaysAgo && new Date(e.event_date) <= now,
  ).length;

  const positiveEvents = events.filter(
    (e) => e.sentiment === "very_positive" || e.sentiment === "positive",
  ).length;
  const negativeEvents = events.filter(
    (e) => e.sentiment === "negative" || e.sentiment === "very_negative",
  ).length;
  const positiveRatio =
    events.length > 0
      ? Math.round((positiveEvents / events.length) * 1000) / 10
      : 0;

  const achievements = events.filter((e) => e.category === "achievement").length;

  const uniqueChildren = new Set(events.map((e) => e.child_id)).size;
  const coverage =
    totalChildren > 0
      ? Math.round((uniqueChildren / totalChildren) * 1000) / 10
      : 0;

  const viewsRecorded = events.filter((e) => e.child_views !== null).length;
  const viewsRate =
    events.length > 0
      ? Math.round((viewsRecorded / events.length) * 1000) / 10
      : 0;

  const sharedWithFamily = events.filter((e) => e.shared_with_family).length;
  const sharedRate =
    events.length > 0
      ? Math.round((sharedWithFamily / events.length) * 1000) / 10
      : 0;

  const addedToLifeStory = events.filter((e) => e.added_to_life_story).length;
  const lifeStoryRate =
    events.length > 0
      ? Math.round((addedToLifeStory / events.length) * 1000) / 10
      : 0;

  const followUpsPending = events.filter(
    (e) => e.follow_up_actions.length > 0,
  ).length;

  const highImpact = events.filter((e) => e.impact === "high").length;

  // By category
  const byCategory: Record<string, number> = {};
  for (const e of events) {
    byCategory[e.category] = (byCategory[e.category] ?? 0) + 1;
  }

  // By sentiment
  const bySentiment: Record<string, number> = {};
  for (const e of events) {
    bySentiment[e.sentiment] = (bySentiment[e.sentiment] ?? 0) + 1;
  }

  // By impact
  const byImpact: Record<string, number> = {};
  for (const e of events) {
    byImpact[e.impact] = (byImpact[e.impact] ?? 0) + 1;
  }

  // By child
  const byChild: Record<string, number> = {};
  for (const e of events) {
    byChild[e.child_name] = (byChild[e.child_name] ?? 0) + 1;
  }

  return {
    total_events: events.length,
    events_this_month: thisMonth,
    positive_events: positiveEvents,
    negative_events: negativeEvents,
    positive_ratio: positiveRatio,
    achievements: achievements,
    children_with_events: uniqueChildren,
    event_coverage: coverage,
    child_views_recorded_rate: viewsRate,
    shared_with_family_rate: sharedRate,
    added_to_life_story_rate: lifeStoryRate,
    follow_ups_pending: followUpsPending,
    high_impact_count: highImpact,
    by_category: byCategory,
    by_sentiment: bySentiment,
    by_impact: byImpact,
    by_child: byChild,
  };
}

/**
 * Identify significant events alerts.
 */
export function identifyEventAlerts(
  events: SignificantEvent[],
  totalChildren: number,
  now: Date = new Date(),
): {
  type: string;
  severity: "critical" | "high" | "medium";
  message: string;
  id: string;
}[] {
  const alerts: {
    type: string;
    severity: "critical" | "high" | "medium";
    message: string;
    id: string;
  }[] = [];

  // High-impact negative events not shared with social worker
  for (const e of events) {
    if (
      e.impact === "high" &&
      (e.sentiment === "negative" || e.sentiment === "very_negative") &&
      !e.shared_with_social_worker
    ) {
      alerts.push({
        type: "not_shared_sw",
        severity: "high",
        message: `High-impact negative event "${e.title}" for ${e.child_name} (${e.event_date}) not shared with social worker`,
        id: e.id,
      });
    }
  }

  // Children with no recorded events
  const childrenWithEvents = new Set(events.map((e) => e.child_id));
  if (totalChildren > 0 && childrenWithEvents.size < totalChildren) {
    const gap = totalChildren - childrenWithEvents.size;
    alerts.push({
      type: "no_events_recorded",
      severity: "medium",
      message: `${gap} ${gap === 1 ? "child has" : "children have"} no significant events recorded — ensure all children's journeys are documented`,
      id: "events_gap",
    });
  }

  // Bereavement events needing follow-up
  for (const e of events) {
    if (e.category === "bereavement" && e.follow_up_actions.length === 0) {
      alerts.push({
        type: "bereavement_no_followup",
        severity: "high",
        message: `Bereavement event for ${e.child_name} (${e.event_date}) has no follow-up actions recorded — ensure support is in place`,
        id: e.id,
      });
    }
  }

  // Predominantly negative sentiment for a child
  const childSentiment: Record<string, { name: string; positive: number; negative: number }> = {};
  for (const e of events) {
    if (!childSentiment[e.child_id]) {
      childSentiment[e.child_id] = { name: e.child_name, positive: 0, negative: 0 };
    }
    if (e.sentiment === "very_positive" || e.sentiment === "positive") {
      childSentiment[e.child_id].positive += 1;
    } else if (e.sentiment === "negative" || e.sentiment === "very_negative") {
      childSentiment[e.child_id].negative += 1;
    }
  }
  for (const [id, s] of Object.entries(childSentiment)) {
    const total = s.positive + s.negative;
    if (total >= 3 && s.negative > s.positive) {
      alerts.push({
        type: "negative_pattern",
        severity: "medium",
        message: `${s.name} has more negative (${s.negative}) than positive (${s.positive}) significant events — review wellbeing and care plan`,
        id: `pattern_${id}`,
      });
    }
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listEvents(
  homeId: string,
  filters?: {
    childId?: string;
    category?: EventCategory;
    sentiment?: EventSentiment;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
  },
): Promise<ServiceResult<SignificantEvent[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_significant_events") as SB).select("*").eq("home_id", homeId);
  if (filters?.childId) q = q.eq("child_id", filters.childId);
  if (filters?.category) q = q.eq("category", filters.category);
  if (filters?.sentiment) q = q.eq("sentiment", filters.sentiment);
  if (filters?.dateFrom) q = q.gte("event_date", filters.dateFrom);
  if (filters?.dateTo) q = q.lte("event_date", filters.dateTo);
  q = q.order("event_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createEvent(
  input: {
    homeId: string;
    childName: string;
    childId: string;
    eventDate: string;
    category: EventCategory;
    title: string;
    description: string;
    sentiment: EventSentiment;
    impact: EventImpact;
    recordedBy: string;
    childViews?: string;
    followUpActions: string[];
    sharedWithFamily: boolean;
    sharedWithSocialWorker: boolean;
    addedToLifeStory: boolean;
    photosAttached: boolean;
  },
): Promise<ServiceResult<SignificantEvent>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_significant_events") as SB)
    .insert({
      home_id: input.homeId,
      child_name: input.childName,
      child_id: input.childId,
      event_date: input.eventDate,
      category: input.category,
      title: input.title,
      description: input.description,
      sentiment: input.sentiment,
      impact: input.impact,
      recorded_by: input.recordedBy,
      child_views: input.childViews ?? null,
      follow_up_actions: input.followUpActions,
      shared_with_family: input.sharedWithFamily,
      shared_with_social_worker: input.sharedWithSocialWorker,
      added_to_life_story: input.addedToLifeStory,
      photos_attached: input.photosAttached,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateEvent(
  id: string,
  updates: Partial<Record<string, unknown>>,
): Promise<ServiceResult<SignificantEvent>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_significant_events") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeEventMetrics,
  identifyEventAlerts,
};
