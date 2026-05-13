// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — ACTIVITY PLANNING SERVICE
// Manages recreational, leisure, cultural, and educational activities
// for children and young people.
// CHR 2015 Reg 9 (enjoyment and achievement),
// Reg 6 (quality and purpose of care — hobbies, interests, leisure),
// Reg 7 (children's views — activity preferences).
//
// Tracks activity scheduling, participation, outcomes, and ensures
// all children have meaningful engagement opportunities.
//
// SCCIF: Overall Experiences — "Children enjoy a wide range of
// activities that promote their development, health, and well-being."
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

export type ActivityCategory =
  | "sport_fitness"
  | "creative_arts"
  | "music"
  | "outdoor_adventure"
  | "cooking_baking"
  | "educational"
  | "cultural"
  | "religious_spiritual"
  | "community_volunteering"
  | "social_outing"
  | "therapeutic"
  | "life_skills"
  | "technology_digital"
  | "reading_literacy"
  | "other";

export type ActivityStatus =
  | "planned"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "postponed";

export type ParticipationLevel =
  | "full"
  | "partial"
  | "observed_only"
  | "declined"
  | "absent";

export type EnjoymentRating =
  | "loved_it"
  | "enjoyed"
  | "neutral"
  | "disliked"
  | "refused";

export interface Activity {
  id: string;
  home_id: string;
  title: string;
  description: string;
  category: ActivityCategory;
  activity_date: string;
  start_time: string;
  end_time: string;
  location: string;
  led_by: string;
  status: ActivityStatus;
  max_participants: number;
  risk_assessed: boolean;
  cost: number;
  external_provider: boolean;
  provider_name: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActivityParticipation {
  id: string;
  home_id: string;
  activity_id: string;
  child_name: string;
  child_id: string;
  participation_level: ParticipationLevel;
  enjoyment_rating: EnjoymentRating | null;
  staff_observations: string | null;
  skills_developed: string[];
  follow_up_needed: boolean;
  follow_up_notes: string | null;
  created_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const ACTIVITY_CATEGORIES: { category: ActivityCategory; label: string }[] = [
  { category: "sport_fitness", label: "Sport & Fitness" },
  { category: "creative_arts", label: "Creative Arts" },
  { category: "music", label: "Music" },
  { category: "outdoor_adventure", label: "Outdoor Adventure" },
  { category: "cooking_baking", label: "Cooking & Baking" },
  { category: "educational", label: "Educational" },
  { category: "cultural", label: "Cultural" },
  { category: "religious_spiritual", label: "Religious/Spiritual" },
  { category: "community_volunteering", label: "Community & Volunteering" },
  { category: "social_outing", label: "Social Outing" },
  { category: "therapeutic", label: "Therapeutic" },
  { category: "life_skills", label: "Life Skills" },
  { category: "technology_digital", label: "Technology & Digital" },
  { category: "reading_literacy", label: "Reading & Literacy" },
  { category: "other", label: "Other" },
];

export const ACTIVITY_STATUSES: { status: ActivityStatus; label: string }[] = [
  { status: "planned", label: "Planned" },
  { status: "confirmed", label: "Confirmed" },
  { status: "in_progress", label: "In Progress" },
  { status: "completed", label: "Completed" },
  { status: "cancelled", label: "Cancelled" },
  { status: "postponed", label: "Postponed" },
];

export const PARTICIPATION_LEVELS: { level: ParticipationLevel; label: string }[] = [
  { level: "full", label: "Full Participation" },
  { level: "partial", label: "Partial Participation" },
  { level: "observed_only", label: "Observed Only" },
  { level: "declined", label: "Declined" },
  { level: "absent", label: "Absent" },
];

export const ENJOYMENT_RATINGS: { rating: EnjoymentRating; label: string }[] = [
  { rating: "loved_it", label: "Loved It" },
  { rating: "enjoyed", label: "Enjoyed" },
  { rating: "neutral", label: "Neutral" },
  { rating: "disliked", label: "Disliked" },
  { rating: "refused", label: "Refused" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

/**
 * Compute activity planning metrics.
 */
export function computeActivityMetrics(
  activities: Activity[],
  participations: ActivityParticipation[],
  totalChildren: number,
  now: Date = new Date(),
): {
  total_activities: number;
  completed_activities: number;
  upcoming_activities: number;
  cancelled_rate: number;
  total_participations: number;
  full_participation_rate: number;
  enjoyment_positive_rate: number;
  children_participating: number;
  participation_coverage: number;
  follow_up_needed: number;
  risk_assessed_rate: number;
  total_cost: number;
  external_provider_count: number;
  avg_skills_developed: number;
  by_category: Record<string, number>;
  by_status: Record<string, number>;
  by_participation: Record<string, number>;
  by_enjoyment: Record<string, number>;
} {
  const completed = activities.filter((a) => a.status === "completed").length;
  const upcoming = activities.filter(
    (a) => (a.status === "planned" || a.status === "confirmed") && new Date(a.activity_date) >= now,
  ).length;
  const cancelled = activities.filter((a) => a.status === "cancelled").length;
  const cancelledRate =
    activities.length > 0
      ? Math.round((cancelled / activities.length) * 1000) / 10
      : 0;

  // Participation metrics
  const fullParticipation = participations.filter((p) => p.participation_level === "full").length;
  const activeParticipations = participations.filter(
    (p) => p.participation_level !== "absent" && p.participation_level !== "declined",
  ).length;
  const fullRate =
    participations.length > 0
      ? Math.round((fullParticipation / participations.length) * 1000) / 10
      : 0;

  // Enjoyment
  const enjoyedOrLoved = participations.filter(
    (p) => p.enjoyment_rating === "loved_it" || p.enjoyment_rating === "enjoyed",
  ).length;
  const ratedParticipations = participations.filter((p) => p.enjoyment_rating !== null).length;
  const enjoymentRate =
    ratedParticipations > 0
      ? Math.round((enjoyedOrLoved / ratedParticipations) * 1000) / 10
      : 0;

  // Unique children participating
  const uniqueChildren = new Set(participations.filter(
    (p) => p.participation_level === "full" || p.participation_level === "partial",
  ).map((p) => p.child_id)).size;
  const coverage =
    totalChildren > 0
      ? Math.round((uniqueChildren / totalChildren) * 1000) / 10
      : 0;

  // Follow up
  const followUpNeeded = participations.filter((p) => p.follow_up_needed).length;

  // Risk assessed
  const riskAssessed = activities.filter((a) => a.risk_assessed).length;
  const riskRate =
    activities.length > 0
      ? Math.round((riskAssessed / activities.length) * 1000) / 10
      : 0;

  // Cost
  const totalCost = activities.reduce((sum, a) => sum + a.cost, 0);

  // External providers
  const externalCount = activities.filter((a) => a.external_provider).length;

  // Avg skills developed
  const avgSkills =
    activeParticipations > 0
      ? Math.round(
          (participations.reduce((sum, p) => sum + p.skills_developed.length, 0) /
            activeParticipations) *
            10,
        ) / 10
      : 0;

  // By category
  const byCategory: Record<string, number> = {};
  for (const a of activities) {
    byCategory[a.category] = (byCategory[a.category] ?? 0) + 1;
  }

  // By status
  const byStatus: Record<string, number> = {};
  for (const a of activities) {
    byStatus[a.status] = (byStatus[a.status] ?? 0) + 1;
  }

  // By participation level
  const byParticipation: Record<string, number> = {};
  for (const p of participations) {
    byParticipation[p.participation_level] = (byParticipation[p.participation_level] ?? 0) + 1;
  }

  // By enjoyment
  const byEnjoyment: Record<string, number> = {};
  for (const p of participations) {
    if (p.enjoyment_rating) {
      byEnjoyment[p.enjoyment_rating] = (byEnjoyment[p.enjoyment_rating] ?? 0) + 1;
    }
  }

  return {
    total_activities: activities.length,
    completed_activities: completed,
    upcoming_activities: upcoming,
    cancelled_rate: cancelledRate,
    total_participations: participations.length,
    full_participation_rate: fullRate,
    enjoyment_positive_rate: enjoymentRate,
    children_participating: uniqueChildren,
    participation_coverage: coverage,
    follow_up_needed: followUpNeeded,
    risk_assessed_rate: riskRate,
    total_cost: totalCost,
    external_provider_count: externalCount,
    avg_skills_developed: avgSkills,
    by_category: byCategory,
    by_status: byStatus,
    by_participation: byParticipation,
    by_enjoyment: byEnjoyment,
  };
}

/**
 * Identify activity planning alerts.
 */
export function identifyActivityAlerts(
  activities: Activity[],
  participations: ActivityParticipation[],
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

  // Activities not risk assessed
  for (const a of activities) {
    if (
      !a.risk_assessed &&
      (a.status === "planned" || a.status === "confirmed") &&
      new Date(a.activity_date) >= now
    ) {
      alerts.push({
        type: "not_risk_assessed",
        severity: "high",
        message: `Activity "${a.title}" on ${a.activity_date} has not been risk assessed — complete before activity takes place`,
        id: a.id,
      });
    }
  }

  // Children not participating in any activities
  const activeChildIds = new Set(
    participations
      .filter((p) => p.participation_level === "full" || p.participation_level === "partial")
      .map((p) => p.child_id),
  );
  if (totalChildren > 0 && activeChildIds.size < totalChildren) {
    const gap = totalChildren - activeChildIds.size;
    alerts.push({
      type: "low_participation",
      severity: "medium",
      message: `${gap} ${gap === 1 ? "child has" : "children have"} not participated in any activities — review activity preferences and barriers`,
      id: "participation_gap",
    });
  }

  // Children consistently declining
  const childDeclines: Record<string, number> = {};
  for (const p of participations) {
    if (p.participation_level === "declined" || p.participation_level === "absent") {
      childDeclines[p.child_name] = (childDeclines[p.child_name] ?? 0) + 1;
    }
  }
  for (const [name, count] of Object.entries(childDeclines)) {
    if (count >= 3) {
      alerts.push({
        type: "repeated_decline",
        severity: "medium",
        message: `${name} has declined or been absent from ${count} activities — explore reasons and preferences`,
        id: `decline_${name}`,
      });
    }
  }

  // High cancellation rate
  const cancelled = activities.filter((a) => a.status === "cancelled").length;
  if (activities.length >= 5 && cancelled / activities.length > 0.3) {
    alerts.push({
      type: "high_cancellation",
      severity: "medium",
      message: `${Math.round((cancelled / activities.length) * 100)}% of activities have been cancelled — review planning and resource allocation`,
      id: "cancellation_rate",
    });
  }

  // Follow-ups pending
  const pendingFollowUps = participations.filter((p) => p.follow_up_needed).length;
  if (pendingFollowUps > 0) {
    alerts.push({
      type: "follow_up_pending",
      severity: "medium",
      message: `${pendingFollowUps} activity ${pendingFollowUps === 1 ? "participation requires" : "participations require"} follow-up action`,
      id: "follow_ups",
    });
  }

  return alerts;
}

// ── CRUD — Activities ──────────────────────────────────────────────────

export async function listActivities(
  homeId: string,
  filters?: {
    category?: ActivityCategory;
    status?: ActivityStatus;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
  },
): Promise<ServiceResult<Activity[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_activities") as SB).select("*").eq("home_id", homeId);
  if (filters?.category) q = q.eq("category", filters.category);
  if (filters?.status) q = q.eq("status", filters.status);
  if (filters?.dateFrom) q = q.gte("activity_date", filters.dateFrom);
  if (filters?.dateTo) q = q.lte("activity_date", filters.dateTo);
  q = q.order("activity_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createActivity(
  input: {
    homeId: string;
    title: string;
    description: string;
    category: ActivityCategory;
    activityDate: string;
    startTime: string;
    endTime: string;
    location: string;
    ledBy: string;
    maxParticipants: number;
    riskAssessed: boolean;
    cost: number;
    externalProvider: boolean;
    providerName?: string;
    notes?: string;
  },
): Promise<ServiceResult<Activity>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_activities") as SB)
    .insert({
      home_id: input.homeId,
      title: input.title,
      description: input.description,
      category: input.category,
      activity_date: input.activityDate,
      start_time: input.startTime,
      end_time: input.endTime,
      location: input.location,
      led_by: input.ledBy,
      status: "planned",
      max_participants: input.maxParticipants,
      risk_assessed: input.riskAssessed,
      cost: input.cost,
      external_provider: input.externalProvider,
      provider_name: input.providerName ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateActivity(
  id: string,
  updates: Partial<Record<string, unknown>>,
): Promise<ServiceResult<Activity>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_activities") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── CRUD — Participations ───────────────────────────────────────────────

export async function listParticipations(
  homeId: string,
  filters?: {
    activityId?: string;
    childId?: string;
    limit?: number;
  },
): Promise<ServiceResult<ActivityParticipation[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_activity_participations") as SB).select("*").eq("home_id", homeId);
  if (filters?.activityId) q = q.eq("activity_id", filters.activityId);
  if (filters?.childId) q = q.eq("child_id", filters.childId);
  q = q.order("created_at", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createParticipation(
  input: {
    homeId: string;
    activityId: string;
    childName: string;
    childId: string;
    participationLevel: ParticipationLevel;
    enjoymentRating?: EnjoymentRating;
    staffObservations?: string;
    skillsDeveloped: string[];
    followUpNeeded: boolean;
    followUpNotes?: string;
  },
): Promise<ServiceResult<ActivityParticipation>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_activity_participations") as SB)
    .insert({
      home_id: input.homeId,
      activity_id: input.activityId,
      child_name: input.childName,
      child_id: input.childId,
      participation_level: input.participationLevel,
      enjoyment_rating: input.enjoymentRating ?? null,
      staff_observations: input.staffObservations ?? null,
      skills_developed: input.skillsDeveloped,
      follow_up_needed: input.followUpNeeded,
      follow_up_notes: input.followUpNotes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeActivityMetrics,
  identifyActivityAlerts,
};
