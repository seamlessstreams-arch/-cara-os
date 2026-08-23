// ══════════════════════════════════════════════════════════════════════════════
// CARA — THERAPEUTIC INTERVENTIONS SERVICE
// Manages therapy sessions, therapeutic care plans, therapeutic parenting
// approaches, and outcomes tracking.
// CHR 2015 Reg 6 (quality and purpose of care — meeting emotional needs),
// Reg 10 (health — access to therapeutic services),
// Reg 14 (care planning — therapeutic elements).
//
// Tracks all therapeutic input for children, monitors engagement,
// progress, and outcomes, and ensures therapeutic needs identified
// in care plans are actively being met.
//
// SCCIF: Experiences and Progress — "Children make good progress in
// their emotional and social development." "Children have timely
// access to the therapeutic support they need."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type TherapyType =
  | "cbt"
  | "dbt"
  | "emdr"
  | "play_therapy"
  | "art_therapy"
  | "music_therapy"
  | "family_therapy"
  | "psychotherapy"
  | "occupational_therapy"
  | "speech_language"
  | "sensory_integration"
  | "life_story_work"
  | "therapeutic_parenting"
  | "equine_therapy"
  | "group_therapy"
  | "other";

export type SessionStatus =
  | "scheduled"
  | "attended"
  | "cancelled_child"
  | "cancelled_therapist"
  | "dna"
  | "rescheduled";

export type EngagementLevel =
  | "fully_engaged"
  | "partially_engaged"
  | "reluctant"
  | "refused"
  | "not_applicable";

export type ProgressRating =
  | "significant_progress"
  | "some_progress"
  | "stable"
  | "some_regression"
  | "significant_regression";

export type ReferralStatus =
  | "identified"
  | "referred"
  | "waitlisted"
  | "active"
  | "completed"
  | "discontinued"
  | "declined";

export interface TherapyReferral {
  id: string;
  home_id: string;
  child_id: string;
  child_name: string;
  therapy_type: TherapyType;
  provider_name: string;
  therapist_name: string | null;
  referral_date: string;
  referral_reason: string;
  status: ReferralStatus;
  date_started: string | null;
  date_ended: string | null;
  frequency: string;
  session_count: number;
  goals: string[];
  outcomes: string[];
  waiting_time_days: number | null;
  created_at: string;
  updated_at: string;
}

export interface TherapySession {
  id: string;
  home_id: string;
  child_id: string;
  child_name: string;
  referral_id: string;
  therapy_type: TherapyType;
  session_date: string;
  session_number: number;
  status: SessionStatus;
  engagement_level: EngagementLevel;
  progress_rating: ProgressRating;
  session_notes: string | null;
  goals_addressed: string[];
  home_actions: string[];
  therapist_recommendations: string | null;
  staff_attended: string | null;
  created_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const THERAPY_TYPES: { type: TherapyType; label: string }[] = [
  { type: "cbt", label: "CBT" },
  { type: "dbt", label: "DBT" },
  { type: "emdr", label: "EMDR" },
  { type: "play_therapy", label: "Play Therapy" },
  { type: "art_therapy", label: "Art Therapy" },
  { type: "music_therapy", label: "Music Therapy" },
  { type: "family_therapy", label: "Family Therapy" },
  { type: "psychotherapy", label: "Psychotherapy" },
  { type: "occupational_therapy", label: "Occupational Therapy" },
  { type: "speech_language", label: "Speech & Language" },
  { type: "sensory_integration", label: "Sensory Integration" },
  { type: "life_story_work", label: "Life Story Work" },
  { type: "therapeutic_parenting", label: "Therapeutic Parenting" },
  { type: "equine_therapy", label: "Equine Therapy" },
  { type: "group_therapy", label: "Group Therapy" },
  { type: "other", label: "Other" },
];

export const SESSION_STATUSES: { status: SessionStatus; label: string }[] = [
  { status: "scheduled", label: "Scheduled" },
  { status: "attended", label: "Attended" },
  { status: "cancelled_child", label: "Cancelled (Child)" },
  { status: "cancelled_therapist", label: "Cancelled (Therapist)" },
  { status: "dna", label: "Did Not Attend" },
  { status: "rescheduled", label: "Rescheduled" },
];

export const ENGAGEMENT_LEVELS: { level: EngagementLevel; label: string }[] = [
  { level: "fully_engaged", label: "Fully Engaged" },
  { level: "partially_engaged", label: "Partially Engaged" },
  { level: "reluctant", label: "Reluctant" },
  { level: "refused", label: "Refused" },
  { level: "not_applicable", label: "Not Applicable" },
];

export const PROGRESS_RATINGS: { rating: ProgressRating; label: string }[] = [
  { rating: "significant_progress", label: "Significant Progress" },
  { rating: "some_progress", label: "Some Progress" },
  { rating: "stable", label: "Stable" },
  { rating: "some_regression", label: "Some Regression" },
  { rating: "significant_regression", label: "Significant Regression" },
];

export const REFERRAL_STATUSES: { status: ReferralStatus; label: string }[] = [
  { status: "identified", label: "Identified" },
  { status: "referred", label: "Referred" },
  { status: "waitlisted", label: "Waitlisted" },
  { status: "active", label: "Active" },
  { status: "completed", label: "Completed" },
  { status: "discontinued", label: "Discontinued" },
  { status: "declined", label: "Declined" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

/**
 * Compute therapeutic intervention metrics.
 */
export function computeTherapyMetrics(
  referrals: TherapyReferral[],
  sessions: TherapySession[],
  _totalChildren: number,
): {
  active_referrals: number;
  children_in_therapy: number;
  children_waiting: number;
  total_sessions: number;
  sessions_attended: number;
  attendance_rate: number | null;
  avg_engagement: number;
  children_progressing: number;
  children_regressing: number;
  avg_waiting_days: number;
  by_therapy_type: Record<string, number>;
  by_status: Record<string, number>;
  by_engagement: Record<string, number>;
} {
  // Referral counts
  const activeReferrals = referrals.filter((r) => r.status === "active").length;
  const childrenInTherapy = new Set(
    referrals.filter((r) => r.status === "active").map((r) => r.child_id),
  ).size;
  const childrenWaiting = new Set(
    referrals
      .filter((r) => r.status === "waitlisted" || r.status === "referred")
      .map((r) => r.child_id),
  ).size;

  // Session stats
  const attended = sessions.filter((s) => s.status === "attended").length;
  const completedSessions = sessions.filter(
    (s) => s.status === "attended" || s.status === "dna" || s.status === "cancelled_child",
  ).length;
  const attendanceRate =
    completedSessions > 0
      ? Math.round((attended / completedSessions) * 1000) / 10
      : null;

  // Engagement (for attended sessions)
  const engagementMap: Record<string, number> = {
    fully_engaged: 5,
    partially_engaged: 4,
    reluctant: 3,
    refused: 2,
    not_applicable: 0,
  };
  const attendedSessions = sessions.filter((s) => s.status === "attended");
  const engagementScored = attendedSessions.filter(
    (s) => s.engagement_level !== "not_applicable",
  );
  const avgEngagement =
    engagementScored.length > 0
      ? Math.round(
          (engagementScored.reduce(
            (sum, s) => sum + (engagementMap[s.engagement_level] ?? 0),
            0,
          ) /
            engagementScored.length) *
            10,
        ) / 10
      : 0;

  // Progress — use latest session per child
  const latestByChild = new Map<string, TherapySession>();
  for (const s of attendedSessions) {
    const existing = latestByChild.get(s.child_id);
    if (!existing || new Date(s.session_date) > new Date(existing.session_date)) {
      latestByChild.set(s.child_id, s);
    }
  }
  let progressing = 0;
  let regressing = 0;
  for (const s of latestByChild.values()) {
    if (s.progress_rating === "significant_progress" || s.progress_rating === "some_progress") {
      progressing++;
    }
    if (s.progress_rating === "some_regression" || s.progress_rating === "significant_regression") {
      regressing++;
    }
  }

  // Avg waiting days
  const waitingReferrals = referrals.filter(
    (r) => r.waiting_time_days !== null && r.waiting_time_days > 0,
  );
  const avgWaiting =
    waitingReferrals.length > 0
      ? Math.round(
          waitingReferrals.reduce((sum, r) => sum + (r.waiting_time_days ?? 0), 0) /
            waitingReferrals.length,
        )
      : 0;

  // By type
  const byType: Record<string, number> = {};
  for (const r of referrals) {
    byType[r.therapy_type] = (byType[r.therapy_type] ?? 0) + 1;
  }

  // By status
  const byStatus: Record<string, number> = {};
  for (const r of referrals) {
    byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
  }

  // By engagement
  const byEngagement: Record<string, number> = {};
  for (const s of attendedSessions) {
    byEngagement[s.engagement_level] = (byEngagement[s.engagement_level] ?? 0) + 1;
  }

  return {
    active_referrals: activeReferrals,
    children_in_therapy: childrenInTherapy,
    children_waiting: childrenWaiting,
    total_sessions: sessions.length,
    sessions_attended: attended,
    attendance_rate: attendanceRate,
    avg_engagement: avgEngagement,
    children_progressing: progressing,
    children_regressing: regressing,
    avg_waiting_days: avgWaiting,
    by_therapy_type: byType,
    by_status: byStatus,
    by_engagement: byEngagement,
  };
}

/**
 * Identify therapeutic intervention alerts.
 */
export function identifyTherapyAlerts(
  referrals: TherapyReferral[],
  sessions: TherapySession[],
  _totalChildren: number,
  _now: Date = new Date(),
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

  // Long wait times (>28 days)
  for (const r of referrals) {
    if (
      (r.status === "waitlisted" || r.status === "referred") &&
      r.waiting_time_days !== null &&
      r.waiting_time_days > 28
    ) {
      const severity = r.waiting_time_days > 56 ? "critical" as const : "high" as const;
      alerts.push({
        type: "long_wait",
        severity,
        message: `${r.child_name} has been waiting ${r.waiting_time_days} days for ${THERAPY_TYPES.find((t) => t.type === r.therapy_type)?.label ?? r.therapy_type} — escalate with commissioner`,
        id: r.id,
      });
    }
  }

  // Regression detected
  const latestByChild = new Map<string, TherapySession>();
  for (const s of sessions.filter((s) => s.status === "attended")) {
    const existing = latestByChild.get(s.child_id);
    if (!existing || new Date(s.session_date) > new Date(existing.session_date)) {
      latestByChild.set(s.child_id, s);
    }
  }
  for (const s of latestByChild.values()) {
    if (s.progress_rating === "significant_regression") {
      alerts.push({
        type: "significant_regression",
        severity: "high",
        message: `${s.child_name} showing significant regression in therapy — review therapeutic plan urgently`,
        id: s.id,
      });
    }
    if (s.progress_rating === "some_regression") {
      alerts.push({
        type: "some_regression",
        severity: "medium",
        message: `${s.child_name} showing some regression in therapy — discuss with therapist at next review`,
        id: s.id,
      });
    }
  }

  // Poor engagement
  for (const s of latestByChild.values()) {
    if (s.engagement_level === "refused") {
      alerts.push({
        type: "engagement_refused",
        severity: "high",
        message: `${s.child_name} refused to engage in therapy session on ${s.session_date} — explore barriers with key worker`,
        id: s.id,
      });
    }
    if (s.engagement_level === "reluctant") {
      alerts.push({
        type: "engagement_reluctant",
        severity: "medium",
        message: `${s.child_name} was reluctant in therapy session on ${s.session_date} — consider adapting approach`,
        id: s.id,
      });
    }
  }

  // Missed sessions (DNA)
  const dnaSessions = sessions.filter((s) => s.status === "dna");
  const dnaByChild = new Map<string, number>();
  for (const s of dnaSessions) {
    dnaByChild.set(s.child_id, (dnaByChild.get(s.child_id) ?? 0) + 1);
  }
  for (const [childId, count] of dnaByChild) {
    if (count >= 2) {
      const childSession = dnaSessions.find((s) => s.child_id === childId);
      alerts.push({
        type: "repeated_dna",
        severity: "high",
        message: `${childSession?.child_name ?? "Unknown"} has ${count} missed therapy sessions — review engagement and barriers`,
        id: childId,
      });
    }
  }

  return alerts;
}

// ── CRUD — Referrals ──────────────────────────────────────────────────────

export async function listReferrals(
  homeId: string,
  filters?: {
    childId?: string;
    status?: ReferralStatus;
    therapyType?: TherapyType;
    limit?: number;
  },
): Promise<ServiceResult<TherapyReferral[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_therapy_referrals") as SB).select("*").eq("home_id", homeId);
  if (filters?.childId) q = q.eq("child_id", filters.childId);
  if (filters?.status) q = q.eq("status", filters.status);
  if (filters?.therapyType) q = q.eq("therapy_type", filters.therapyType);
  q = q.order("referral_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createReferral(
  input: {
    homeId: string;
    childId: string;
    childName: string;
    therapyType: TherapyType;
    providerName: string;
    therapistName?: string;
    referralDate: string;
    referralReason: string;
    frequency: string;
    goals: string[];
  },
): Promise<ServiceResult<TherapyReferral>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_therapy_referrals") as SB)
    .insert({
      home_id: input.homeId,
      child_id: input.childId,
      child_name: input.childName,
      therapy_type: input.therapyType,
      provider_name: input.providerName,
      therapist_name: input.therapistName ?? null,
      referral_date: input.referralDate,
      referral_reason: input.referralReason,
      status: "referred",
      frequency: input.frequency,
      session_count: 0,
      goals: input.goals,
      outcomes: [],
      waiting_time_days: null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateReferral(
  id: string,
  updates: Partial<Record<string, unknown>>,
): Promise<ServiceResult<TherapyReferral>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_therapy_referrals") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── CRUD — Sessions ──────────────────────────────────────────────────────

export async function listSessions(
  homeId: string,
  filters?: {
    childId?: string;
    referralId?: string;
    status?: SessionStatus;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
  },
): Promise<ServiceResult<TherapySession[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_therapy_sessions") as SB).select("*").eq("home_id", homeId);
  if (filters?.childId) q = q.eq("child_id", filters.childId);
  if (filters?.referralId) q = q.eq("referral_id", filters.referralId);
  if (filters?.status) q = q.eq("status", filters.status);
  if (filters?.dateFrom) q = q.gte("session_date", filters.dateFrom);
  if (filters?.dateTo) q = q.lte("session_date", filters.dateTo);
  q = q.order("session_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createSession(
  input: {
    homeId: string;
    childId: string;
    childName: string;
    referralId: string;
    therapyType: TherapyType;
    sessionDate: string;
    sessionNumber: number;
    status: SessionStatus;
    engagementLevel: EngagementLevel;
    progressRating: ProgressRating;
    sessionNotes?: string;
    goalsAddressed: string[];
    homeActions: string[];
    therapistRecommendations?: string;
    staffAttended?: string;
  },
): Promise<ServiceResult<TherapySession>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_therapy_sessions") as SB)
    .insert({
      home_id: input.homeId,
      child_id: input.childId,
      child_name: input.childName,
      referral_id: input.referralId,
      therapy_type: input.therapyType,
      session_date: input.sessionDate,
      session_number: input.sessionNumber,
      status: input.status,
      engagement_level: input.engagementLevel,
      progress_rating: input.progressRating,
      session_notes: input.sessionNotes ?? null,
      goals_addressed: input.goalsAddressed,
      home_actions: input.homeActions,
      therapist_recommendations: input.therapistRecommendations ?? null,
      staff_attended: input.staffAttended ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeTherapyMetrics,
  identifyTherapyAlerts,
};
