// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — MISSING FROM CARE SERVICE
// Manages missing-from-care episodes, return home interviews, push/pull
// factor analysis, and compliance tracking. CHR 2015 Reg 34, DfE statutory
// guidance on children who run away or go missing from home or care.
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

export interface MissingEpisode {
  id: string;
  home_id: string;
  child_id: string;
  episode_type: string;
  reported_missing_at: string;
  reported_by: string;
  police_notified: boolean;
  police_notified_at?: string | null;
  police_reference?: string | null;
  placing_authority_notified: boolean;
  placing_authority_notified_at?: string | null;
  ofsted_notified: boolean;
  risk_level: string;
  trigger_category?: string | null;
  trigger_details?: string | null;
  last_known_location?: string | null;
  found_at?: string | null;
  found_location?: string | null;
  found_by?: string | null;
  duration_minutes?: number | null;
  return_interview_status: string;
  return_interview_date?: string | null;
  return_interview_by?: string | null;
  return_interview_notes?: string | null;
  debrief_completed: boolean;
  actions_taken: string[];
  status: string; // "active", "resolved", "closed"
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const EPISODE_TYPES: {
  type: string;
  label: string;
  risk_level: string;
  requires_police: boolean;
}[] = [
  { type: "missing", label: "Missing", risk_level: "high", requires_police: true },
  { type: "absent", label: "Unauthorised Absence", risk_level: "medium", requires_police: false },
  { type: "awol", label: "AWOL (Left Without Permission)", risk_level: "high", requires_police: true },
  { type: "failed_to_return", label: "Failed to Return on Time", risk_level: "medium", requires_police: false },
];

export const TRIGGER_CATEGORIES: string[] = [
  "peer_influence", "family_contact", "exploitation_concern", "substance_use",
  "emotional_distress", "bullying", "placement_breakdown", "social_media",
  "romantic_relationship", "boredom", "conflict_with_staff", "unknown",
];

export const RETURN_INTERVIEW_STATUS: string[] = [
  "not_required", "pending", "scheduled", "completed", "refused",
];

export const RISK_LEVELS: string[] = ["low", "medium", "high", "very_high"];

// ── Risk-level numeric mapping (used by pure functions) ─────────────────

const RISK_LEVEL_MAP: Record<string, number> = {
  low: 1,
  medium: 2,
  high: 3,
  very_high: 4,
};

// ── Push / pull factor groupings ────────────────────────────────────────

const PUSH_TRIGGERS = new Set(["conflict_with_staff", "bullying", "boredom", "placement_breakdown"]);
const PULL_TRIGGERS = new Set(["peer_influence", "family_contact", "romantic_relationship", "social_media"]);
const RISK_TRIGGERS = new Set(["exploitation_concern", "substance_use"]);
const EMOTIONAL_TRIGGERS = new Set(["emotional_distress"]);

// ── Pure functions (no DB) ──────────────────────────────────────────────

/**
 * Compute an aggregate missing-from-care profile across all episodes.
 */
export function computeMissingProfile(episodes: MissingEpisode[]): {
  total_episodes: number;
  active_episodes: number;
  resolved_this_month: number;
  by_type: Record<string, number>;
  by_trigger: Record<string, number>;
  avg_duration_minutes: number;
  police_notification_rate: number;
  return_interview_completion_rate: number;
  repeat_children: { child_id: string; count: number }[];
} {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const byType: Record<string, number> = {};
  const byTrigger: Record<string, number> = {};
  const childCounts: Record<string, number> = {};

  let activeEpisodes = 0;
  let resolvedThisMonth = 0;
  let totalDuration = 0;
  let durationCount = 0;
  let policeNotified = 0;

  // Return-interview tracking (exclude not_required)
  let riCompleted = 0;
  let riRelevant = 0; // completed + pending + scheduled + refused

  for (const ep of episodes) {
    // By type
    byType[ep.episode_type] = (byType[ep.episode_type] ?? 0) + 1;

    // By trigger
    if (ep.trigger_category) {
      byTrigger[ep.trigger_category] = (byTrigger[ep.trigger_category] ?? 0) + 1;
    }

    // Child counts
    childCounts[ep.child_id] = (childCounts[ep.child_id] ?? 0) + 1;

    // Active
    if (ep.status === "active") activeEpisodes++;

    // Resolved this calendar month
    if (ep.status === "resolved" || ep.status === "closed") {
      const updatedDate = new Date(ep.updated_at);
      if (updatedDate.getMonth() === currentMonth && updatedDate.getFullYear() === currentYear) {
        resolvedThisMonth++;
      }
    }

    // Duration
    if (ep.duration_minutes != null) {
      totalDuration += ep.duration_minutes;
      durationCount++;
    }

    // Police notification
    if (ep.police_notified) policeNotified++;

    // Return interview
    if (ep.return_interview_status !== "not_required") {
      riRelevant++;
      if (ep.return_interview_status === "completed") riCompleted++;
    }
  }

  const avgDuration = durationCount > 0
    ? Math.round(totalDuration / durationCount)
    : 0;

  const policeRate = episodes.length > 0
    ? Math.round((policeNotified / episodes.length) * 100)
    : 0;

  const riRate = riRelevant > 0
    ? Math.round((riCompleted / riRelevant) * 100)
    : 0;

  const repeatChildren = Object.entries(childCounts)
    .filter(([, count]) => count >= 2)
    .map(([child_id, count]) => ({ child_id, count }))
    .sort((a, b) => b.count - a.count);

  return {
    total_episodes: episodes.length,
    active_episodes: activeEpisodes,
    resolved_this_month: resolvedThisMonth,
    by_type: byType,
    by_trigger: byTrigger,
    avg_duration_minutes: avgDuration,
    police_notification_rate: policeRate,
    return_interview_completion_rate: riRate,
    repeat_children: repeatChildren,
  };
}

/**
 * Compute missing-from-care history for a specific child.
 */
export function computeChildMissingHistory(
  childId: string,
  episodes: MissingEpisode[],
): {
  child_id: string;
  total_episodes: number;
  active: boolean;
  last_episode_date: string | null;
  avg_duration_minutes: number;
  common_triggers: string[];
  risk_trend: "escalating" | "stable" | "de-escalating";
  return_interviews_pending: number;
} {
  const childEpisodes = episodes.filter((ep) => ep.child_id === childId);

  const active = childEpisodes.some((ep) => ep.status === "active");

  // Last episode date (most recent reported_missing_at)
  let lastEpisodeDate: string | null = null;
  if (childEpisodes.length > 0) {
    const sorted = [...childEpisodes].sort(
      (a, b) => new Date(b.reported_missing_at).getTime() - new Date(a.reported_missing_at).getTime(),
    );
    lastEpisodeDate = sorted[0].reported_missing_at;
  }

  // Average duration
  let totalDuration = 0;
  let durationCount = 0;
  for (const ep of childEpisodes) {
    if (ep.duration_minutes != null) {
      totalDuration += ep.duration_minutes;
      durationCount++;
    }
  }
  const avgDuration = durationCount > 0
    ? Math.round(totalDuration / durationCount)
    : 0;

  // Common triggers — top 3 by frequency
  const triggerCounts: Record<string, number> = {};
  for (const ep of childEpisodes) {
    if (ep.trigger_category) {
      triggerCounts[ep.trigger_category] = (triggerCounts[ep.trigger_category] ?? 0) + 1;
    }
  }
  const commonTriggers = Object.entries(triggerCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([trigger]) => trigger);

  // Risk trend — compare first half vs second half risk levels
  let riskTrend: "escalating" | "stable" | "de-escalating" = "stable";
  if (childEpisodes.length >= 2) {
    const sorted = [...childEpisodes].sort(
      (a, b) => new Date(a.reported_missing_at).getTime() - new Date(b.reported_missing_at).getTime(),
    );
    const mid = Math.floor(sorted.length / 2);
    const firstHalf = sorted.slice(0, mid);
    const secondHalf = sorted.slice(mid);

    const avgRisk = (eps: MissingEpisode[]): number => {
      if (eps.length === 0) return 0;
      let total = 0;
      for (const ep of eps) {
        total += RISK_LEVEL_MAP[ep.risk_level] ?? 2;
      }
      return total / eps.length;
    };

    const firstAvg = avgRisk(firstHalf);
    const secondAvg = avgRisk(secondHalf);

    if (secondAvg - firstAvg >= 0.5) {
      riskTrend = "escalating";
    } else if (firstAvg - secondAvg >= 0.5) {
      riskTrend = "de-escalating";
    }
  }

  // Return interviews pending
  const returnInterviewsPending = childEpisodes.filter(
    (ep) => ep.return_interview_status === "pending",
  ).length;

  return {
    child_id: childId,
    total_episodes: childEpisodes.length,
    active,
    last_episode_date: lastEpisodeDate,
    avg_duration_minutes: avgDuration,
    common_triggers: commonTriggers,
    risk_trend: riskTrend,
    return_interviews_pending: returnInterviewsPending,
  };
}

/**
 * Generate compliance alerts from missing episodes.
 */
export function computeMissingAlerts(
  episodes: MissingEpisode[],
): {
  type: string;
  severity: "critical" | "high" | "medium" | "low";
  message: string;
  child_id: string;
  episode_id: string;
}[] {
  const alerts: {
    type: string;
    severity: "critical" | "high" | "medium" | "low";
    message: string;
    child_id: string;
    episode_id: string;
  }[] = [];

  const now = new Date();
  const seventyTwoHoursMs = 72 * 60 * 60 * 1000;

  // Track child episode counts for repeat-missing detection
  const childEpisodeCounts: Record<string, { count: number; episodes: MissingEpisode[] }> = {};

  for (const ep of episodes) {
    // Track counts per child
    if (!childEpisodeCounts[ep.child_id]) {
      childEpisodeCounts[ep.child_id] = { count: 0, episodes: [] };
    }
    childEpisodeCounts[ep.child_id].count++;
    childEpisodeCounts[ep.child_id].episodes.push(ep);

    // active_missing: any active episode
    if (ep.status === "active") {
      alerts.push({
        type: "active_missing",
        severity: "critical",
        message: `Child is currently ${ep.episode_type === "missing" ? "missing" : ep.episode_type === "awol" ? "AWOL" : "absent"} — reported ${ep.reported_missing_at}`,
        child_id: ep.child_id,
        episode_id: ep.id,
      });
    }

    // return_interview_overdue: resolved, status "pending", found_at > 72h ago
    if (
      ep.status === "resolved" &&
      ep.return_interview_status === "pending" &&
      ep.found_at
    ) {
      const foundDate = new Date(ep.found_at);
      if (now.getTime() - foundDate.getTime() > seventyTwoHoursMs) {
        alerts.push({
          type: "return_interview_overdue",
          severity: "high",
          message: `Return home interview overdue — child returned ${ep.found_at} (>72 hours ago)`,
          child_id: ep.child_id,
          episode_id: ep.id,
        });
      }
    }

    // police_not_notified: missing/awol episode without police_notified
    if (
      (ep.episode_type === "missing" || ep.episode_type === "awol") &&
      !ep.police_notified
    ) {
      alerts.push({
        type: "police_not_notified",
        severity: "critical",
        message: `Police not yet notified for ${ep.episode_type} episode — notification required`,
        child_id: ep.child_id,
        episode_id: ep.id,
      });
    }

    // debrief_pending: resolved episode where debrief_completed is false
    if (ep.status === "resolved" && !ep.debrief_completed) {
      alerts.push({
        type: "debrief_pending",
        severity: "medium",
        message: `Staff debrief not yet completed for resolved episode`,
        child_id: ep.child_id,
        episode_id: ep.id,
      });
    }
  }

  // repeat_missing: child with 3+ episodes (emit one alert per child using latest episode)
  for (const [childId, data] of Object.entries(childEpisodeCounts)) {
    if (data.count >= 3) {
      const latestEpisode = data.episodes.sort(
        (a, b) => new Date(b.reported_missing_at).getTime() - new Date(a.reported_missing_at).getTime(),
      )[0];
      alerts.push({
        type: "repeat_missing",
        severity: "high",
        message: `Child has ${data.count} missing episodes — pattern analysis recommended`,
        child_id: childId,
        episode_id: latestEpisode.id,
      });
    }
  }

  return alerts;
}

/**
 * Analyse trigger categories to identify push/pull factors driving
 * missing episodes. Supports care planning and pattern analysis.
 */
export function identifyPushPullFactors(episodes: MissingEpisode[]): {
  push_factors: { factor: string; count: number }[];
  pull_factors: { factor: string; count: number }[];
  risk_factors: { factor: string; count: number }[];
  emotional_factors: { factor: string; count: number }[];
  unknown_count: number;
} {
  const pushCounts: Record<string, number> = {};
  const pullCounts: Record<string, number> = {};
  const riskCounts: Record<string, number> = {};
  const emotionalCounts: Record<string, number> = {};
  let unknownCount = 0;

  for (const ep of episodes) {
    const trigger = ep.trigger_category;
    if (!trigger) continue;

    if (trigger === "unknown") {
      unknownCount++;
    } else if (PUSH_TRIGGERS.has(trigger)) {
      pushCounts[trigger] = (pushCounts[trigger] ?? 0) + 1;
    } else if (PULL_TRIGGERS.has(trigger)) {
      pullCounts[trigger] = (pullCounts[trigger] ?? 0) + 1;
    } else if (RISK_TRIGGERS.has(trigger)) {
      riskCounts[trigger] = (riskCounts[trigger] ?? 0) + 1;
    } else if (EMOTIONAL_TRIGGERS.has(trigger)) {
      emotionalCounts[trigger] = (emotionalCounts[trigger] ?? 0) + 1;
    }
  }

  const toSorted = (counts: Record<string, number>) =>
    Object.entries(counts)
      .map(([factor, count]) => ({ factor, count }))
      .sort((a, b) => b.count - a.count);

  return {
    push_factors: toSorted(pushCounts),
    pull_factors: toSorted(pullCounts),
    risk_factors: toSorted(riskCounts),
    emotional_factors: toSorted(emotionalCounts),
    unknown_count: unknownCount,
  };
}

// ── CRUD ──────────────────────────────────────────────────────────────────

export async function listMissingEpisodes(
  homeId: string,
  filters?: {
    childId?: string;
    status?: string;
    episodeType?: string;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
  },
): Promise<ServiceResult<MissingEpisode[]>> {
  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_missing_episodes") as SB).select("*").eq("home_id", homeId);
  if (filters?.childId) q = q.eq("child_id", filters.childId);
  if (filters?.status) q = q.eq("status", filters.status);
  if (filters?.episodeType) q = q.eq("episode_type", filters.episodeType);
  if (filters?.dateFrom) q = q.gte("reported_missing_at", filters.dateFrom);
  if (filters?.dateTo) q = q.lte("reported_missing_at", filters.dateTo);
  q = q.order("reported_missing_at", { ascending: false }).limit(filters?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function getMissingEpisode(
  id: string,
): Promise<ServiceResult<MissingEpisode>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_missing_episodes") as SB)
    .select("*")
    .eq("id", id)
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function reportMissing(
  input: Omit<MissingEpisode, "id" | "status" | "debrief_completed" | "created_at" | "updated_at">,
): Promise<ServiceResult<MissingEpisode>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_missing_episodes") as SB)
    .insert({
      ...input,
      status: "active",
      debrief_completed: false,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function resolveEpisode(
  id: string,
  input: {
    found_at: string;
    found_location?: string;
    found_by?: string;
    duration_minutes?: number;
  },
): Promise<ServiceResult<MissingEpisode>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_missing_episodes") as SB)
    .update({
      status: "resolved",
      found_at: input.found_at,
      found_location: input.found_location ?? null,
      found_by: input.found_by ?? null,
      duration_minutes: input.duration_minutes ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateReturnInterview(
  id: string,
  input: {
    return_interview_status: string;
    return_interview_date?: string;
    return_interview_by?: string;
    return_interview_notes?: string;
  },
): Promise<ServiceResult<MissingEpisode>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_missing_episodes") as SB)
    .update({
      return_interview_status: input.return_interview_status,
      return_interview_date: input.return_interview_date ?? null,
      return_interview_by: input.return_interview_by ?? null,
      return_interview_notes: input.return_interview_notes ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function closeEpisode(
  id: string,
): Promise<ServiceResult<MissingEpisode>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_missing_episodes") as SB)
    .update({
      status: "closed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeMissingProfile,
  computeChildMissingHistory,
  computeMissingAlerts,
  identifyPushPullFactors,
};
