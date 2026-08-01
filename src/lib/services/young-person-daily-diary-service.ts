// ══════════════════════════════════════════════════════════════════════════════
// CARA — YOUNG PERSON DAILY DIARY SERVICE
// Structured daily diary entries from young people themselves — capturing
// their voice, feelings, experiences, and reflections. The child's own
// account of their day.
// CHR 2015 Reg 7 (protection), Reg 14 (care planning),
// Reg 16 (statement of purpose).
//
// SCCIF: "Children's views are heard and influence how the home is run."
// "Children feel listened to and their wishes are respected."
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

export type MoodRating =
  | "very_happy"
  | "happy"
  | "okay"
  | "sad"
  | "very_sad"
  | "angry"
  | "anxious"
  | "mixed"
  | "numb"
  | "other";

export type DayRating =
  | "amazing"
  | "good"
  | "okay"
  | "difficult"
  | "terrible";

export type EntryType =
  | "daily_reflection"
  | "morning_check_in"
  | "evening_check_in"
  | "weekly_reflection"
  | "special_event"
  | "concern_raised"
  | "achievement"
  | "wish_feeling"
  | "complaint"
  | "other";

export type PrivacyLevel =
  | "private_to_me"
  | "share_with_keyworker"
  | "share_with_staff"
  | "share_with_social_worker"
  | "share_with_everyone";

export interface YoungPersonDailyDiaryRecord {
  id: string;
  home_id: string;
  child_name: string;
  child_id: string | null;
  mood_rating: MoodRating;
  day_rating: DayRating;
  entry_type: EntryType;
  privacy_level: PrivacyLevel;
  session_date: string;
  recorded_by: string;
  diary_entry: string;
  best_part_of_day: string;
  worst_part_of_day: string | null;
  what_i_wish: string | null;
  what_helped_me: string | null;
  what_i_need: string | null;
  who_i_spoke_to: string | null;
  staff_response: string | null;
  keyworker_notes: string | null;
  approved_by: string | null;
  approved_at: string | null;
  next_review_date: string | null;
  notes: string | null;
  child_wrote_themselves: boolean;
  child_chose_to_share: boolean;
  staff_supported_writing: boolean;
  feelings_explored: boolean;
  wishes_recorded: boolean;
  concerns_addressed: boolean;
  keyworker_read: boolean;
  responded_to: boolean;
  linked_to_care_plan: boolean;
  safeguarding_checked: boolean;
  privacy_respected: boolean;
  recorded_promptly: boolean;
  issues_found: string[];
  actions_taken: string[];
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const MOOD_RATINGS: { mood: MoodRating; label: string }[] = [
  { mood: "very_happy", label: "Very Happy" },
  { mood: "happy", label: "Happy" },
  { mood: "okay", label: "Okay" },
  { mood: "sad", label: "Sad" },
  { mood: "very_sad", label: "Very Sad" },
  { mood: "angry", label: "Angry" },
  { mood: "anxious", label: "Anxious" },
  { mood: "mixed", label: "Mixed" },
  { mood: "numb", label: "Numb" },
  { mood: "other", label: "Other" },
];

export const DAY_RATINGS: { rating: DayRating; label: string }[] = [
  { rating: "amazing", label: "Amazing" },
  { rating: "good", label: "Good" },
  { rating: "okay", label: "Okay" },
  { rating: "difficult", label: "Difficult" },
  { rating: "terrible", label: "Terrible" },
];

export const ENTRY_TYPES: { type: EntryType; label: string }[] = [
  { type: "daily_reflection", label: "Daily Reflection" },
  { type: "morning_check_in", label: "Morning Check-In" },
  { type: "evening_check_in", label: "Evening Check-In" },
  { type: "weekly_reflection", label: "Weekly Reflection" },
  { type: "special_event", label: "Special Event" },
  { type: "concern_raised", label: "Concern Raised" },
  { type: "achievement", label: "Achievement" },
  { type: "wish_feeling", label: "Wish / Feeling" },
  { type: "complaint", label: "Complaint" },
  { type: "other", label: "Other" },
];

export const PRIVACY_LEVELS: { level: PrivacyLevel; label: string }[] = [
  { level: "private_to_me", label: "Private to Me" },
  { level: "share_with_keyworker", label: "Share with Keyworker" },
  { level: "share_with_staff", label: "Share with Staff" },
  { level: "share_with_social_worker", label: "Share with Social Worker" },
  { level: "share_with_everyone", label: "Share with Everyone" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeDailyDiaryMetrics(
  records: YoungPersonDailyDiaryRecord[],
): {
  total_entries: number;
  sad_entries_count: number;
  difficult_day_count: number;
  self_written_count: number;
  concern_count: number;
  child_wrote_rate: number | null;
  child_chose_share_rate: number | null;
  staff_supported_rate: number | null;
  feelings_explored_rate: number | null;
  wishes_recorded_rate: number | null;
  concerns_addressed_rate: number | null;
  keyworker_read_rate: number | null;
  responded_to_rate: number | null;
  care_plan_linked_rate: number | null;
  safeguarding_checked_rate: number | null;
  privacy_respected_rate: number | null;
  recorded_promptly_rate: number | null;
  unique_children: number;
  by_mood_rating: Record<string, number>;
  by_day_rating: Record<string, number>;
  by_entry_type: Record<string, number>;
  by_privacy_level: Record<string, number>;
} {
  const sadEntries = records.filter(
    (r) =>
      r.mood_rating === "sad" ||
      r.mood_rating === "very_sad" ||
      r.mood_rating === "angry" ||
      r.mood_rating === "anxious",
  ).length;

  const difficultDays = records.filter(
    (r) => r.day_rating === "difficult" || r.day_rating === "terrible",
  ).length;

  const selfWritten = records.filter((r) => r.child_wrote_themselves).length;

  const concernCount = records.filter((r) => r.entry_type === "concern_raised").length;

  const boolRate = (field: keyof YoungPersonDailyDiaryRecord) => {
    const count = records.filter((r) => r[field] === true).length;
    return records.length > 0
      ? Math.round((count / records.length) * 1000) / 10
      : null;
  };

  const uniqueChildren = new Set(records.map((r) => r.child_name)).size;

  const byMood: Record<string, number> = {};
  for (const r of records) byMood[r.mood_rating] = (byMood[r.mood_rating] ?? 0) + 1;

  const byDay: Record<string, number> = {};
  for (const r of records) byDay[r.day_rating] = (byDay[r.day_rating] ?? 0) + 1;

  const byType: Record<string, number> = {};
  for (const r of records) byType[r.entry_type] = (byType[r.entry_type] ?? 0) + 1;

  const byPrivacy: Record<string, number> = {};
  for (const r of records) byPrivacy[r.privacy_level] = (byPrivacy[r.privacy_level] ?? 0) + 1;

  return {
    total_entries: records.length,
    sad_entries_count: sadEntries,
    difficult_day_count: difficultDays,
    self_written_count: selfWritten,
    concern_count: concernCount,
    child_wrote_rate: boolRate("child_wrote_themselves"),
    child_chose_share_rate: boolRate("child_chose_to_share"),
    staff_supported_rate: boolRate("staff_supported_writing"),
    feelings_explored_rate: boolRate("feelings_explored"),
    wishes_recorded_rate: boolRate("wishes_recorded"),
    concerns_addressed_rate: boolRate("concerns_addressed"),
    keyworker_read_rate: boolRate("keyworker_read"),
    responded_to_rate: boolRate("responded_to"),
    care_plan_linked_rate: boolRate("linked_to_care_plan"),
    safeguarding_checked_rate: boolRate("safeguarding_checked"),
    privacy_respected_rate: boolRate("privacy_respected"),
    recorded_promptly_rate: boolRate("recorded_promptly"),
    unique_children: uniqueChildren,
    by_mood_rating: byMood,
    by_day_rating: byDay,
    by_entry_type: byType,
    by_privacy_level: byPrivacy,
  };
}

export function identifyDailyDiaryAlerts(
  records: YoungPersonDailyDiaryRecord[],
): {
  type: string;
  severity: "critical" | "high" | "medium";
  message: string;
  record_id?: string;
}[] {
  const alerts: {
    type: string;
    severity: "critical" | "high" | "medium";
    message: string;
    record_id?: string;
  }[] = [];

  // Critical per-record: concern raised but not addressed
  for (const r of records) {
    if (r.entry_type === "concern_raised" && !r.concerns_addressed) {
      alerts.push({
        type: "concern_not_addressed",
        severity: "critical",
        message: `${r.child_name} raised a concern that has not been addressed — keyworker action needed.`,
        record_id: r.id,
      });
    }
  }

  // High: diary entries not responded to
  const notRespondedCount = records.filter((r) => !r.responded_to).length;
  if (notRespondedCount >= 1) {
    alerts.push({
      type: "not_responded_to",
      severity: "high",
      message: `${notRespondedCount} diary ${notRespondedCount === 1 ? "entry has" : "entries have"} not been responded to.`,
    });
  }

  // High: privacy not respected
  const privacyNotRespectedCount = records.filter((r) => !r.privacy_respected).length;
  if (privacyNotRespectedCount >= 1) {
    alerts.push({
      type: "privacy_not_respected",
      severity: "high",
      message: `${privacyNotRespectedCount} diary ${privacyNotRespectedCount === 1 ? "entry has" : "entries have"} privacy not respected.`,
    });
  }

  // Medium: feelings not explored
  const noFeelingsCount = records.filter((r) => !r.feelings_explored).length;
  if (noFeelingsCount >= 2) {
    alerts.push({
      type: "no_feelings_explored",
      severity: "medium",
      message: `${noFeelingsCount} diary ${noFeelingsCount === 1 ? "entry has" : "entries have"} feelings not explored.`,
    });
  }

  // Medium: keyworker has not read
  const keyworkerNotReadCount = records.filter((r) => !r.keyworker_read).length;
  if (keyworkerNotReadCount >= 2) {
    alerts.push({
      type: "keyworker_not_read",
      severity: "medium",
      message: `${keyworkerNotReadCount} diary ${keyworkerNotReadCount === 1 ? "entry has" : "entries have"} not been read by the keyworker.`,
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listDailyDiaries(
  homeId: string,
): Promise<ServiceResult<YoungPersonDailyDiaryRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  const { data, error } = await (s.from("cs_young_person_daily_diaries") as SB)
    .select("*")
    .eq("home_id", homeId)
    .order("session_date", { ascending: false });

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createDailyDiary(
  input: {
    homeId: string;
    childName: string;
    childId?: string;
    moodRating: MoodRating;
    dayRating: DayRating;
    entryType: EntryType;
    privacyLevel: PrivacyLevel;
    sessionDate: string;
    recordedBy: string;
    diaryEntry: string;
    bestPartOfDay: string;
    worstPartOfDay?: string;
    whatIWish?: string;
    whatHelpedMe?: string;
    whatINeed?: string;
    whoISpokedTo?: string;
    staffResponse?: string;
    keyworkerNotes?: string;
    approvedBy?: string;
    approvedAt?: string;
    nextReviewDate?: string;
    notes?: string;
    childWroteThemselves: boolean;
    childChoseToShare: boolean;
    staffSupportedWriting: boolean;
    feelingsExplored: boolean;
    wishesRecorded: boolean;
    concernsAddressed: boolean;
    keyworkerRead: boolean;
    respondedTo: boolean;
    linkedToCarePlan: boolean;
    safeguardingChecked: boolean;
    privacyRespected: boolean;
    recordedPromptly: boolean;
    issuesFound: string[];
    actionsTaken: string[];
  },
): Promise<ServiceResult<YoungPersonDailyDiaryRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_young_person_daily_diaries") as SB)
    .insert({
      home_id: input.homeId,
      child_name: input.childName,
      child_id: input.childId ?? null,
      mood_rating: input.moodRating,
      day_rating: input.dayRating,
      entry_type: input.entryType,
      privacy_level: input.privacyLevel,
      session_date: input.sessionDate,
      recorded_by: input.recordedBy,
      diary_entry: input.diaryEntry,
      best_part_of_day: input.bestPartOfDay,
      worst_part_of_day: input.worstPartOfDay ?? null,
      what_i_wish: input.whatIWish ?? null,
      what_helped_me: input.whatHelpedMe ?? null,
      what_i_need: input.whatINeed ?? null,
      who_i_spoke_to: input.whoISpokedTo ?? null,
      staff_response: input.staffResponse ?? null,
      keyworker_notes: input.keyworkerNotes ?? null,
      approved_by: input.approvedBy ?? null,
      approved_at: input.approvedAt ?? null,
      next_review_date: input.nextReviewDate ?? null,
      notes: input.notes ?? null,
      child_wrote_themselves: input.childWroteThemselves,
      child_chose_to_share: input.childChoseToShare,
      staff_supported_writing: input.staffSupportedWriting,
      feelings_explored: input.feelingsExplored,
      wishes_recorded: input.wishesRecorded,
      concerns_addressed: input.concernsAddressed,
      keyworker_read: input.keyworkerRead,
      responded_to: input.respondedTo,
      linked_to_care_plan: input.linkedToCarePlan,
      safeguarding_checked: input.safeguardingChecked,
      privacy_respected: input.privacyRespected,
      recorded_promptly: input.recordedPromptly,
      issues_found: input.issuesFound,
      actions_taken: input.actionsTaken,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateDailyDiary(
  id: string,
  updates: Partial<Omit<YoungPersonDailyDiaryRecord, "id" | "home_id" | "created_at">>,
): Promise<ServiceResult<YoungPersonDailyDiaryRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_young_person_daily_diaries") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeDailyDiaryMetrics,
  identifyDailyDiaryAlerts,
};
