// ══════════════════════════════════════════════════════════════════════════════
// CARA — KEYWORKER SESSIONS SERVICE
// Tracks 1:1 keyworker sessions between allocated keyworkers and
// children, covering emotional support, care planning, life skills,
// advocacy, and relationship building.
// CHR 2015 Reg 22 (arrangements for supervision — keyworker role),
// Reg 6 (quality of care — trusting relationships),
// Reg 7 (individual child — personalised support).
//
// Covers: keyworker session planning, delivery, recording, child
// participation, advocacy, emotional check-ins, target reviews,
// and session quality monitoring.
//
// SCCIF: Overall Experiences — "Children have trusted key relationships."
// "Keywork sessions are purposeful and child-led."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type SessionFocus =
  | "emotional_check_in"
  | "care_plan_review"
  | "target_setting"
  | "life_skills"
  | "education_support"
  | "health_wellbeing"
  | "relationships"
  | "advocacy"
  | "transition_planning"
  | "other";

export type SessionQuality =
  | "excellent"
  | "good"
  | "adequate"
  | "poor"
  | "not_assessed";

export type ChildMood =
  | "very_positive"
  | "positive"
  | "neutral"
  | "low"
  | "distressed";

export type SessionLocation =
  | "in_home"
  | "bedroom"
  | "community"
  | "school"
  | "activity_based"
  | "car_journey"
  | "walking"
  | "online"
  | "restaurant_cafe"
  | "other";

export interface KeyworkerSessionRecord {
  id: string;
  home_id: string;
  session_focus: SessionFocus;
  session_quality: SessionQuality;
  child_mood: ChildMood;
  session_location: SessionLocation;
  session_date: string;
  child_name: string;
  child_id: string | null;
  keyworker_name: string;
  /** Tri-state judgements/observations: null = not recorded. Absence is never
   *  an answer. */
  child_led: boolean | null;
  targets_reviewed: boolean | null;
  wishes_feelings_recorded: boolean | null;
  advocacy_provided: boolean;
  care_plan_discussed: boolean;
  safety_discussed: boolean;
  achievements_celebrated: boolean | null;
  worries_explored: boolean | null;
  next_steps_agreed: boolean | null;
  session_recorded: boolean | null;
  child_signed: boolean;
  social_worker_updated: boolean;
  issues_found: string[];
  actions_taken: string[];
  session_duration_minutes: number;
  next_session_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const SESSION_FOCUSES: { focus: SessionFocus; label: string }[] = [
  { focus: "emotional_check_in", label: "Emotional Check-In" },
  { focus: "care_plan_review", label: "Care Plan Review" },
  { focus: "target_setting", label: "Target Setting" },
  { focus: "life_skills", label: "Life Skills" },
  { focus: "education_support", label: "Education Support" },
  { focus: "health_wellbeing", label: "Health & Wellbeing" },
  { focus: "relationships", label: "Relationships" },
  { focus: "advocacy", label: "Advocacy" },
  { focus: "transition_planning", label: "Transition Planning" },
  { focus: "other", label: "Other" },
];

export const SESSION_QUALITIES: { quality: SessionQuality; label: string }[] = [
  { quality: "excellent", label: "Excellent" },
  { quality: "good", label: "Good" },
  { quality: "adequate", label: "Adequate" },
  { quality: "poor", label: "Poor" },
  { quality: "not_assessed", label: "Not Assessed" },
];

export const CHILD_MOODS: { mood: ChildMood; label: string }[] = [
  { mood: "very_positive", label: "Very Positive" },
  { mood: "positive", label: "Positive" },
  { mood: "neutral", label: "Neutral" },
  { mood: "low", label: "Low" },
  { mood: "distressed", label: "Distressed" },
];

export const SESSION_LOCATIONS: { location: SessionLocation; label: string }[] = [
  { location: "in_home", label: "In Home" },
  { location: "bedroom", label: "Bedroom" },
  { location: "community", label: "Community" },
  { location: "school", label: "School" },
  { location: "activity_based", label: "Activity Based" },
  { location: "car_journey", label: "Car Journey" },
  { location: "walking", label: "Walking" },
  { location: "online", label: "Online" },
  { location: "restaurant_cafe", label: "Restaurant/Café" },
  { location: "other", label: "Other" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeKeyworkerSessionMetrics(
  records: KeyworkerSessionRecord[],
): {
  total_sessions: number;
  excellent_count: number;
  good_count: number;
  poor_count: number;
  distressed_count: number;
  child_led_rate: number | null;
  targets_reviewed_rate: number | null;
  wishes_feelings_rate: number | null;
  advocacy_rate: number | null;
  care_plan_discussed_rate: number | null;
  safety_discussed_rate: number | null;
  achievements_celebrated_rate: number | null;
  worries_explored_rate: number | null;
  next_steps_agreed_rate: number | null;
  session_recorded_rate: number | null;
  child_signed_rate: number | null;
  social_worker_updated_rate: number | null;
  average_duration: number | null;
  unique_children: number;
  by_session_focus: Record<string, number>;
  by_session_quality: Record<string, number>;
  by_child_mood: Record<string, number>;
  by_session_location: Record<string, number>;
} {
  const excellent = records.filter((r) => r.session_quality === "excellent").length;
  const good = records.filter((r) => r.session_quality === "good").length;
  const poor = records.filter((r) => r.session_quality === "poor").length;
  const distressed = records.filter((r) => r.child_mood === "distressed").length;

  const boolRate = (field: keyof KeyworkerSessionRecord) => {
    const count = records.filter((r) => r[field] === true).length;
    return records.length > 0
      ? Math.round((count / records.length) * 1000) / 10
      : null;
  };

  const avgDuration = records.length > 0
    ? Math.round((records.reduce((sum, r) => sum + r.session_duration_minutes, 0) / records.length) * 10) / 10
    : null;

  const uniqueChildren = new Set(records.map((r) => r.child_name)).size;

  const byFocus: Record<string, number> = {};
  for (const r of records) byFocus[r.session_focus] = (byFocus[r.session_focus] ?? 0) + 1;

  const byQuality: Record<string, number> = {};
  for (const r of records) byQuality[r.session_quality] = (byQuality[r.session_quality] ?? 0) + 1;

  const byMood: Record<string, number> = {};
  for (const r of records) byMood[r.child_mood] = (byMood[r.child_mood] ?? 0) + 1;

  const byLocation: Record<string, number> = {};
  for (const r of records) byLocation[r.session_location] = (byLocation[r.session_location] ?? 0) + 1;

  return {
    total_sessions: records.length,
    excellent_count: excellent,
    good_count: good,
    poor_count: poor,
    distressed_count: distressed,
    child_led_rate: boolRate("child_led"),
    targets_reviewed_rate: boolRate("targets_reviewed"),
    wishes_feelings_rate: boolRate("wishes_feelings_recorded"),
    advocacy_rate: boolRate("advocacy_provided"),
    care_plan_discussed_rate: boolRate("care_plan_discussed"),
    safety_discussed_rate: boolRate("safety_discussed"),
    achievements_celebrated_rate: boolRate("achievements_celebrated"),
    worries_explored_rate: boolRate("worries_explored"),
    next_steps_agreed_rate: boolRate("next_steps_agreed"),
    session_recorded_rate: boolRate("session_recorded"),
    child_signed_rate: boolRate("child_signed"),
    social_worker_updated_rate: boolRate("social_worker_updated"),
    average_duration: avgDuration,
    unique_children: uniqueChildren,
    by_session_focus: byFocus,
    by_session_quality: byQuality,
    by_child_mood: byMood,
    by_session_location: byLocation,
  };
}

export function identifyKeyworkerSessionAlerts(
  records: KeyworkerSessionRecord[],
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

  // Child distressed in poor session
  for (const r of records) {
    if (r.child_mood === "distressed" && r.session_quality === "poor") {
      alerts.push({
        type: "distressed_poor_session",
        severity: "critical",
        message: `${r.child_name} distressed during poor quality session on ${r.session_date} — review keyworker support`,
        id: r.id,
      });
    }
  }

  // Sessions not recorded
  const notRecorded = records.filter((r) => r.session_recorded === false).length;
  if (notRecorded >= 1) {
    alerts.push({
      type: "not_recorded",
      severity: "high",
      message: `${notRecorded} ${notRecorded === 1 ? "session has" : "sessions have"} not been recorded — maintain session records`,
      id: "not_recorded",
    });
  }

  // Wishes and feelings not recorded
  const noWishes = records.filter((r) => r.wishes_feelings_recorded === false).length;
  if (noWishes >= 2) {
    alerts.push({
      type: "wishes_not_recorded",
      severity: "high",
      message: `${noWishes} sessions without wishes and feelings recorded — ensure child voice captured`,
      id: "wishes_not_recorded",
    });
  }

  // Not child-led
  const notChildLed = records.filter((r) => r.child_led === false).length;
  if (notChildLed >= 3) {
    alerts.push({
      type: "not_child_led",
      severity: "medium",
      message: `${notChildLed} sessions not child-led — improve child participation`,
      id: "not_child_led",
    });
  }

  // Next steps not agreed
  const noNextSteps = records.filter((r) => r.next_steps_agreed === false).length;
  if (noNextSteps >= 3) {
    alerts.push({
      type: "no_next_steps",
      severity: "medium",
      message: `${noNextSteps} sessions without next steps agreed — improve session outcomes`,
      id: "no_next_steps",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    sessionFocus?: SessionFocus;
    sessionQuality?: SessionQuality;
    childMood?: ChildMood;
    sessionLocation?: SessionLocation;
    limit?: number;
  },
): Promise<ServiceResult<KeyworkerSessionRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_keyworker_sessions") as SB).select("*").eq("home_id", homeId);
  if (filters?.sessionFocus) q = q.eq("session_focus", filters.sessionFocus);
  if (filters?.sessionQuality) q = q.eq("session_quality", filters.sessionQuality);
  if (filters?.childMood) q = q.eq("child_mood", filters.childMood);
  if (filters?.sessionLocation) q = q.eq("session_location", filters.sessionLocation);
  q = q.order("session_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  payload: {
    homeId: string;
    sessionFocus: SessionFocus;
    sessionQuality: SessionQuality;
    childMood: ChildMood;
    sessionLocation: SessionLocation;
    sessionDate: string;
    childName: string;
    childId?: string | null;
    keyworkerName: string;
    childLed?: boolean;
    targetsReviewed?: boolean;
    wishesFeelingsRecorded?: boolean;
    advocacyProvided?: boolean;
    carePlanDiscussed?: boolean;
    safetyDiscussed?: boolean;
    achievementsCelebrated?: boolean;
    worriesExplored?: boolean;
    nextStepsAgreed?: boolean;
    sessionRecorded?: boolean;
    childSigned?: boolean;
    socialWorkerUpdated?: boolean;
    issuesFound?: string[];
    actionsTaken?: string[];
    sessionDurationMinutes: number;
    nextSessionDate?: string | null;
    notes?: string | null;
  },
): Promise<ServiceResult<KeyworkerSessionRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_keyworker_sessions") as SB)
    .insert({
      home_id: payload.homeId,
      session_focus: payload.sessionFocus,
      session_quality: payload.sessionQuality,
      child_mood: payload.childMood,
      session_location: payload.sessionLocation,
      session_date: payload.sessionDate,
      child_name: payload.childName,
      child_id: payload.childId ?? null,
      keyworker_name: payload.keyworkerName,
      child_led: payload.childLed ?? null,
      targets_reviewed: payload.targetsReviewed ?? null,
      wishes_feelings_recorded: payload.wishesFeelingsRecorded ?? null,
      advocacy_provided: payload.advocacyProvided ?? false,
      care_plan_discussed: payload.carePlanDiscussed ?? false,
      safety_discussed: payload.safetyDiscussed ?? false,
      achievements_celebrated: payload.achievementsCelebrated ?? null,
      worries_explored: payload.worriesExplored ?? null,
      next_steps_agreed: payload.nextStepsAgreed ?? null,
      session_recorded: payload.sessionRecorded ?? null,
      child_signed: payload.childSigned ?? false,
      social_worker_updated: payload.socialWorkerUpdated ?? false,
      issues_found: payload.issuesFound ?? [],
      actions_taken: payload.actionsTaken ?? [],
      session_duration_minutes: payload.sessionDurationMinutes,
      next_session_date: payload.nextSessionDate ?? null,
      notes: payload.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateRecord(
  id: string,
  updates: Partial<{
    sessionFocus: SessionFocus;
    sessionQuality: SessionQuality;
    childMood: ChildMood;
    sessionLocation: SessionLocation;
    sessionDate: string;
    childName: string;
    childId: string | null;
    keyworkerName: string;
    childLed: boolean;
    targetsReviewed: boolean;
    wishesFeelingsRecorded: boolean;
    advocacyProvided: boolean;
    carePlanDiscussed: boolean;
    safetyDiscussed: boolean;
    achievementsCelebrated: boolean;
    worriesExplored: boolean;
    nextStepsAgreed: boolean;
    sessionRecorded: boolean;
    childSigned: boolean;
    socialWorkerUpdated: boolean;
    issuesFound: string[];
    actionsTaken: string[];
    sessionDurationMinutes: number;
    nextSessionDate: string | null;
    notes: string | null;
  }>,
): Promise<ServiceResult<KeyworkerSessionRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.sessionFocus !== undefined) mapped.session_focus = updates.sessionFocus;
  if (updates.sessionQuality !== undefined) mapped.session_quality = updates.sessionQuality;
  if (updates.childMood !== undefined) mapped.child_mood = updates.childMood;
  if (updates.sessionLocation !== undefined) mapped.session_location = updates.sessionLocation;
  if (updates.sessionDate !== undefined) mapped.session_date = updates.sessionDate;
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.childId !== undefined) mapped.child_id = updates.childId;
  if (updates.keyworkerName !== undefined) mapped.keyworker_name = updates.keyworkerName;
  if (updates.childLed !== undefined) mapped.child_led = updates.childLed;
  if (updates.targetsReviewed !== undefined) mapped.targets_reviewed = updates.targetsReviewed;
  if (updates.wishesFeelingsRecorded !== undefined) mapped.wishes_feelings_recorded = updates.wishesFeelingsRecorded;
  if (updates.advocacyProvided !== undefined) mapped.advocacy_provided = updates.advocacyProvided;
  if (updates.carePlanDiscussed !== undefined) mapped.care_plan_discussed = updates.carePlanDiscussed;
  if (updates.safetyDiscussed !== undefined) mapped.safety_discussed = updates.safetyDiscussed;
  if (updates.achievementsCelebrated !== undefined) mapped.achievements_celebrated = updates.achievementsCelebrated;
  if (updates.worriesExplored !== undefined) mapped.worries_explored = updates.worriesExplored;
  if (updates.nextStepsAgreed !== undefined) mapped.next_steps_agreed = updates.nextStepsAgreed;
  if (updates.sessionRecorded !== undefined) mapped.session_recorded = updates.sessionRecorded;
  if (updates.childSigned !== undefined) mapped.child_signed = updates.childSigned;
  if (updates.socialWorkerUpdated !== undefined) mapped.social_worker_updated = updates.socialWorkerUpdated;
  if (updates.issuesFound !== undefined) mapped.issues_found = updates.issuesFound;
  if (updates.actionsTaken !== undefined) mapped.actions_taken = updates.actionsTaken;
  if (updates.sessionDurationMinutes !== undefined) mapped.session_duration_minutes = updates.sessionDurationMinutes;
  if (updates.nextSessionDate !== undefined) mapped.next_session_date = updates.nextSessionDate;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  const { data, error } = await (s.from("cs_keyworker_sessions") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeKeyworkerSessionMetrics,
  identifyKeyworkerSessionAlerts,
};
