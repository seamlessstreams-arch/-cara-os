// ══════════════════════════════════════════════════════════════════════════════
// CARA — CHILD WELLBEING CHECK-IN SERVICE
// Tracks regular wellbeing check-ins with children including mood,
// emotional state, physical health, and overall wellness indicators.
// CHR 2015 Reg 12 (health and wellbeing — holistic wellbeing),
// Reg 7 (individual child — understanding each child's needs).
//
// Covers: mood rating, emotional state, wellbeing domain, check-in
// frequency, child engagement, and follow-up actions.
//
// SCCIF: Experiences — "Children feel cared for and listened to."
// "Staff understand and respond to children's emotional needs."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type MoodRating =
  | "very_happy"
  | "happy"
  | "okay"
  | "unhappy"
  | "very_unhappy";

export type EmotionalState =
  | "calm"
  | "content"
  | "anxious"
  | "sad"
  | "angry"
  | "withdrawn"
  | "excited"
  | "confused"
  | "overwhelmed"
  | "other";

export type WellbeingDomain =
  | "emotional"
  | "physical"
  | "social"
  | "educational"
  | "spiritual";

export type CheckInType =
  | "morning_routine"
  | "after_school"
  | "evening"
  | "bedtime"
  | "ad_hoc";

export interface ChildWellbeingCheckinRecord {
  id: string;
  home_id: string;
  mood_rating: MoodRating;
  emotional_state: EmotionalState;
  wellbeing_domain: WellbeingDomain;
  check_in_type: CheckInType;
  check_in_date: string;
  child_name: string;
  child_id: string | null;
  staff_name: string;
  child_engaged: boolean;
  child_voice_captured: boolean;
  concerns_identified: boolean;
  follow_up_needed: boolean;
  care_plan_reviewed: boolean;
  parent_informed: boolean;
  social_worker_informed: boolean;
  private_time_offered: boolean;
  physical_health_checked: boolean;
  eating_well: boolean;
  sleeping_well: boolean;
  recorded_promptly: boolean;
  issues_found: string[];
  actions_taken: string[];
  wellbeing_score: number | null;
  next_review_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const MOOD_RATINGS: { rating: MoodRating; label: string }[] = [
  { rating: "very_happy", label: "Very Happy" },
  { rating: "happy", label: "Happy" },
  { rating: "okay", label: "Okay" },
  { rating: "unhappy", label: "Unhappy" },
  { rating: "very_unhappy", label: "Very Unhappy" },
];

export const EMOTIONAL_STATES: { state: EmotionalState; label: string }[] = [
  { state: "calm", label: "Calm" },
  { state: "content", label: "Content" },
  { state: "anxious", label: "Anxious" },
  { state: "sad", label: "Sad" },
  { state: "angry", label: "Angry" },
  { state: "withdrawn", label: "Withdrawn" },
  { state: "excited", label: "Excited" },
  { state: "confused", label: "Confused" },
  { state: "overwhelmed", label: "Overwhelmed" },
  { state: "other", label: "Other" },
];

export const WELLBEING_DOMAINS: { domain: WellbeingDomain; label: string }[] = [
  { domain: "emotional", label: "Emotional" },
  { domain: "physical", label: "Physical" },
  { domain: "social", label: "Social" },
  { domain: "educational", label: "Educational" },
  { domain: "spiritual", label: "Spiritual" },
];

export const CHECK_IN_TYPES: { type: CheckInType; label: string }[] = [
  { type: "morning_routine", label: "Morning Routine" },
  { type: "after_school", label: "After School" },
  { type: "evening", label: "Evening" },
  { type: "bedtime", label: "Bedtime" },
  { type: "ad_hoc", label: "Ad Hoc" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeWellbeingCheckinMetrics(
  records: ChildWellbeingCheckinRecord[],
): {
  total_checkins: number;
  unhappy_count: number;
  very_unhappy_count: number;
  concerns_identified_count: number;
  follow_up_needed_count: number;
  child_engaged_rate: number | null;
  child_voice_rate: number | null;
  care_plan_reviewed_rate: number | null;
  parent_informed_rate: number | null;
  social_worker_informed_rate: number | null;
  private_time_rate: number | null;
  physical_health_rate: number | null;
  eating_well_rate: number | null;
  sleeping_well_rate: number | null;
  recorded_promptly_rate: number | null;
  average_wellbeing_score: number | null;
  unique_children: number;
  by_mood_rating: Record<string, number>;
  by_emotional_state: Record<string, number>;
  by_wellbeing_domain: Record<string, number>;
  by_check_in_type: Record<string, number>;
} {
  const unhappy = records.filter((r) => r.mood_rating === "unhappy").length;
  const veryUnhappy = records.filter((r) => r.mood_rating === "very_unhappy").length;
  const concernsCount = records.filter((r) => r.concerns_identified).length;
  const followUpCount = records.filter((r) => r.follow_up_needed).length;

  const boolRate = (field: keyof ChildWellbeingCheckinRecord) => {
    const count = records.filter((r) => r[field] === true).length;
    return records.length > 0
      ? Math.round((count / records.length) * 1000) / 10
      : null;
  };

  const avgScore =
    records.length > 0
      ? Math.round(
          (records.reduce((sum, r) => sum + (r.wellbeing_score ?? 0), 0) / records.length) * 10,
        ) / 10
      : null;

  const uniqueChildren = new Set(records.map((r) => r.child_name)).size;

  const byMood: Record<string, number> = {};
  for (const r of records) byMood[r.mood_rating] = (byMood[r.mood_rating] ?? 0) + 1;

  const byState: Record<string, number> = {};
  for (const r of records) byState[r.emotional_state] = (byState[r.emotional_state] ?? 0) + 1;

  const byDomain: Record<string, number> = {};
  for (const r of records) byDomain[r.wellbeing_domain] = (byDomain[r.wellbeing_domain] ?? 0) + 1;

  const byType: Record<string, number> = {};
  for (const r of records) byType[r.check_in_type] = (byType[r.check_in_type] ?? 0) + 1;

  return {
    total_checkins: records.length,
    unhappy_count: unhappy,
    very_unhappy_count: veryUnhappy,
    concerns_identified_count: concernsCount,
    follow_up_needed_count: followUpCount,
    child_engaged_rate: boolRate("child_engaged"),
    child_voice_rate: boolRate("child_voice_captured"),
    care_plan_reviewed_rate: boolRate("care_plan_reviewed"),
    parent_informed_rate: boolRate("parent_informed"),
    social_worker_informed_rate: boolRate("social_worker_informed"),
    private_time_rate: boolRate("private_time_offered"),
    physical_health_rate: boolRate("physical_health_checked"),
    eating_well_rate: boolRate("eating_well"),
    sleeping_well_rate: boolRate("sleeping_well"),
    recorded_promptly_rate: boolRate("recorded_promptly"),
    average_wellbeing_score: avgScore,
    unique_children: uniqueChildren,
    by_mood_rating: byMood,
    by_emotional_state: byState,
    by_wellbeing_domain: byDomain,
    by_check_in_type: byType,
  };
}

export function identifyWellbeingCheckinAlerts(
  records: ChildWellbeingCheckinRecord[],
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

  // Very unhappy without follow-up
  for (const r of records) {
    if (r.mood_rating === "very_unhappy" && !r.follow_up_needed) {
      alerts.push({
        type: "very_unhappy_no_followup",
        severity: "critical",
        message: `${r.child_name} reported very unhappy during ${r.check_in_type.replace(/_/g, " ")} check-in without follow-up planned — immediate review needed`,
        id: r.id,
      });
    }
  }

  // Concerns without social worker informed
  const concernsNoSW = records.filter((r) => r.concerns_identified && !r.social_worker_informed).length;
  if (concernsNoSW >= 1) {
    alerts.push({
      type: "concerns_sw_not_informed",
      severity: "high",
      message: `${concernsNoSW} check-${concernsNoSW === 1 ? "in has" : "ins have"} concerns identified without social worker informed — ensure appropriate escalation`,
      id: "concerns_sw_not_informed",
    });
  }

  // Child voice not captured
  const noVoice = records.filter((r) => !r.child_voice_captured).length;
  if (noVoice >= 1) {
    alerts.push({
      type: "voice_not_captured",
      severity: "high",
      message: `${noVoice} check-${noVoice === 1 ? "in has" : "ins have"} child voice not captured — ensure child participation`,
      id: "voice_not_captured",
    });
  }

  // Not eating well
  const notEating = records.filter((r) => !r.eating_well).length;
  if (notEating >= 2) {
    alerts.push({
      type: "not_eating_well",
      severity: "medium",
      message: `${notEating} check-ins show children not eating well — review nutrition and mealtime support`,
      id: "not_eating_well",
    });
  }

  // Not sleeping well
  const notSleeping = records.filter((r) => !r.sleeping_well).length;
  if (notSleeping >= 2) {
    alerts.push({
      type: "not_sleeping_well",
      severity: "medium",
      message: `${notSleeping} check-ins show children not sleeping well — review sleep support`,
      id: "not_sleeping_well",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    moodRating?: MoodRating;
    emotionalState?: EmotionalState;
    wellbeingDomain?: WellbeingDomain;
    checkInType?: CheckInType;
    limit?: number;
  },
): Promise<ServiceResult<ChildWellbeingCheckinRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_child_wellbeing_checkin") as SB).select("*").eq("home_id", homeId);
  if (filters?.moodRating) q = q.eq("mood_rating", filters.moodRating);
  if (filters?.emotionalState) q = q.eq("emotional_state", filters.emotionalState);
  if (filters?.wellbeingDomain) q = q.eq("wellbeing_domain", filters.wellbeingDomain);
  if (filters?.checkInType) q = q.eq("check_in_type", filters.checkInType);
  q = q.order("check_in_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  payload: {
    homeId: string;
    moodRating: MoodRating;
    emotionalState: EmotionalState;
    wellbeingDomain: WellbeingDomain;
    checkInType: CheckInType;
    checkInDate: string;
    childName: string;
    childId?: string | null;
    staffName: string;
    childEngaged?: boolean;
    childVoiceCaptured?: boolean;
    concernsIdentified?: boolean;
    followUpNeeded?: boolean;
    carePlanReviewed?: boolean;
    parentInformed?: boolean;
    socialWorkerInformed?: boolean;
    privateTimeOffered?: boolean;
    physicalHealthChecked?: boolean;
    eatingWell?: boolean;
    sleepingWell?: boolean;
    recordedPromptly?: boolean;
    issuesFound?: string[];
    actionsTaken?: string[];
    wellbeingScore: number;
    nextReviewDate?: string | null;
    notes?: string | null;
  },
): Promise<ServiceResult<ChildWellbeingCheckinRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_child_wellbeing_checkin") as SB)
    .insert({
      home_id: payload.homeId,
      mood_rating: payload.moodRating,
      emotional_state: payload.emotionalState,
      wellbeing_domain: payload.wellbeingDomain,
      check_in_type: payload.checkInType,
      check_in_date: payload.checkInDate,
      child_name: payload.childName,
      child_id: payload.childId ?? null,
      staff_name: payload.staffName,
      child_engaged: payload.childEngaged ?? true,
      child_voice_captured: payload.childVoiceCaptured ?? true,
      concerns_identified: payload.concernsIdentified ?? false,
      follow_up_needed: payload.followUpNeeded ?? false,
      care_plan_reviewed: payload.carePlanReviewed ?? true,
      parent_informed: payload.parentInformed ?? false,
      social_worker_informed: payload.socialWorkerInformed ?? false,
      private_time_offered: payload.privateTimeOffered ?? true,
      physical_health_checked: payload.physicalHealthChecked ?? true,
      eating_well: payload.eatingWell ?? true,
      sleeping_well: payload.sleepingWell ?? true,
      recorded_promptly: payload.recordedPromptly ?? true,
      issues_found: payload.issuesFound ?? [],
      actions_taken: payload.actionsTaken ?? [],
      wellbeing_score: payload.wellbeingScore,
      next_review_date: payload.nextReviewDate ?? null,
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
    moodRating: MoodRating;
    emotionalState: EmotionalState;
    wellbeingDomain: WellbeingDomain;
    checkInType: CheckInType;
    checkInDate: string;
    childName: string;
    childId: string | null;
    staffName: string;
    childEngaged: boolean;
    childVoiceCaptured: boolean;
    concernsIdentified: boolean;
    followUpNeeded: boolean;
    carePlanReviewed: boolean;
    parentInformed: boolean;
    socialWorkerInformed: boolean;
    privateTimeOffered: boolean;
    physicalHealthChecked: boolean;
    eatingWell: boolean;
    sleepingWell: boolean;
    recordedPromptly: boolean;
    issuesFound: string[];
    actionsTaken: string[];
    wellbeingScore: number;
    nextReviewDate: string | null;
    notes: string | null;
  }>,
): Promise<ServiceResult<ChildWellbeingCheckinRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.moodRating !== undefined) mapped.mood_rating = updates.moodRating;
  if (updates.emotionalState !== undefined) mapped.emotional_state = updates.emotionalState;
  if (updates.wellbeingDomain !== undefined) mapped.wellbeing_domain = updates.wellbeingDomain;
  if (updates.checkInType !== undefined) mapped.check_in_type = updates.checkInType;
  if (updates.checkInDate !== undefined) mapped.check_in_date = updates.checkInDate;
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.childId !== undefined) mapped.child_id = updates.childId;
  if (updates.staffName !== undefined) mapped.staff_name = updates.staffName;
  if (updates.childEngaged !== undefined) mapped.child_engaged = updates.childEngaged;
  if (updates.childVoiceCaptured !== undefined) mapped.child_voice_captured = updates.childVoiceCaptured;
  if (updates.concernsIdentified !== undefined) mapped.concerns_identified = updates.concernsIdentified;
  if (updates.followUpNeeded !== undefined) mapped.follow_up_needed = updates.followUpNeeded;
  if (updates.carePlanReviewed !== undefined) mapped.care_plan_reviewed = updates.carePlanReviewed;
  if (updates.parentInformed !== undefined) mapped.parent_informed = updates.parentInformed;
  if (updates.socialWorkerInformed !== undefined) mapped.social_worker_informed = updates.socialWorkerInformed;
  if (updates.privateTimeOffered !== undefined) mapped.private_time_offered = updates.privateTimeOffered;
  if (updates.physicalHealthChecked !== undefined) mapped.physical_health_checked = updates.physicalHealthChecked;
  if (updates.eatingWell !== undefined) mapped.eating_well = updates.eatingWell;
  if (updates.sleepingWell !== undefined) mapped.sleeping_well = updates.sleepingWell;
  if (updates.recordedPromptly !== undefined) mapped.recorded_promptly = updates.recordedPromptly;
  if (updates.issuesFound !== undefined) mapped.issues_found = updates.issuesFound;
  if (updates.actionsTaken !== undefined) mapped.actions_taken = updates.actionsTaken;
  if (updates.wellbeingScore !== undefined) mapped.wellbeing_score = updates.wellbeingScore;
  if (updates.nextReviewDate !== undefined) mapped.next_review_date = updates.nextReviewDate;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  const { data, error } = await (s.from("cs_child_wellbeing_checkin") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeWellbeingCheckinMetrics,
  identifyWellbeingCheckinAlerts,
};
