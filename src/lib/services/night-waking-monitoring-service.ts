// ══════════════════════════════════════════════════════════════════════════════
// CARA — NIGHT WAKING MONITORING SERVICE
// Tracks overnight waking episodes for children to understand sleep
// patterns, emotional states, triggers, and staff responses during
// night-time disturbances.
// CHR 2015 Reg 12 (health and wellbeing — sleep and overnight care),
// Reg 7 (individual child — routines and comfort),
// Reg 6 (quality of care — meeting individual needs).
//
// Covers: waking reason, child emotional state, staff response,
// duration, intervention type, return-to-sleep support, and
// follow-up actions.
//
// SCCIF: Health — "Sleep routines support wellbeing."
// "Night-time disturbances are sensitively managed."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type WakingReason =
  | "nightmare"
  | "anxiety"
  | "physical_discomfort"
  | "toileting"
  | "noise_disturbance"
  | "hunger_thirst"
  | "medication_side_effect"
  | "habitual_waking"
  | "unknown"
  | "other";

export type ChildEmotionalState =
  | "calm"
  | "mildly_unsettled"
  | "upset"
  | "distressed"
  | "angry";

export type StaffResponse =
  | "verbal_reassurance"
  | "physical_comfort"
  | "drink_snack"
  | "medication_administered"
  | "stayed_with_child"
  | "environmental_adjustment"
  | "distraction_activity"
  | "contacted_on_call"
  | "no_intervention_needed"
  | "other";

export type SleepReturnTime =
  | "within_15_minutes"
  | "within_30_minutes"
  | "within_1_hour"
  | "over_1_hour"
  | "did_not_return_to_sleep";

export interface NightWakingMonitoringRecord {
  id: string;
  home_id: string;
  waking_reason: WakingReason;
  child_emotional_state: ChildEmotionalState;
  staff_response: StaffResponse;
  sleep_return_time: SleepReturnTime;
  waking_date: string;
  waking_time: string;
  child_name: string;
  child_id: string | null;
  staff_on_duty: string;
  child_comforted: boolean;
  environment_checked: boolean;
  temperature_appropriate: boolean;
  drink_offered: boolean;
  night_light_available: boolean;
  door_preference_respected: boolean;
  gp_referral_considered: boolean;
  sleep_plan_followed: boolean;
  pattern_identified: boolean;
  parent_informed: boolean;
  social_worker_informed: boolean;
  recorded_promptly: boolean;
  issues_found: string[];
  actions_taken: string[];
  waking_duration_minutes: number;
  next_review_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const WAKING_REASONS: { reason: WakingReason; label: string }[] = [
  { reason: "nightmare", label: "Nightmare" },
  { reason: "anxiety", label: "Anxiety" },
  { reason: "physical_discomfort", label: "Physical Discomfort" },
  { reason: "toileting", label: "Toileting" },
  { reason: "noise_disturbance", label: "Noise Disturbance" },
  { reason: "hunger_thirst", label: "Hunger/Thirst" },
  { reason: "medication_side_effect", label: "Medication Side Effect" },
  { reason: "habitual_waking", label: "Habitual Waking" },
  { reason: "unknown", label: "Unknown" },
  { reason: "other", label: "Other" },
];

export const CHILD_EMOTIONAL_STATES: { state: ChildEmotionalState; label: string }[] = [
  { state: "calm", label: "Calm" },
  { state: "mildly_unsettled", label: "Mildly Unsettled" },
  { state: "upset", label: "Upset" },
  { state: "distressed", label: "Distressed" },
  { state: "angry", label: "Angry" },
];

export const STAFF_RESPONSES: { response: StaffResponse; label: string }[] = [
  { response: "verbal_reassurance", label: "Verbal Reassurance" },
  { response: "physical_comfort", label: "Physical Comfort" },
  { response: "drink_snack", label: "Drink/Snack" },
  { response: "medication_administered", label: "Medication Administered" },
  { response: "stayed_with_child", label: "Stayed with Child" },
  { response: "environmental_adjustment", label: "Environmental Adjustment" },
  { response: "distraction_activity", label: "Distraction Activity" },
  { response: "contacted_on_call", label: "Contacted On-Call" },
  { response: "no_intervention_needed", label: "No Intervention Needed" },
  { response: "other", label: "Other" },
];

export const SLEEP_RETURN_TIMES: { time: SleepReturnTime; label: string }[] = [
  { time: "within_15_minutes", label: "Within 15 Minutes" },
  { time: "within_30_minutes", label: "Within 30 Minutes" },
  { time: "within_1_hour", label: "Within 1 Hour" },
  { time: "over_1_hour", label: "Over 1 Hour" },
  { time: "did_not_return_to_sleep", label: "Did Not Return to Sleep" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeNightWakingMetrics(
  records: NightWakingMonitoringRecord[],
): {
  total_wakings: number;
  distressed_count: number;
  angry_count: number;
  nightmare_count: number;
  did_not_return_count: number;
  child_comforted_rate: number | null;
  environment_checked_rate: number | null;
  temperature_appropriate_rate: number | null;
  drink_offered_rate: number | null;
  night_light_rate: number | null;
  door_preference_rate: number | null;
  gp_referral_rate: number | null;
  sleep_plan_rate: number | null;
  pattern_identified_rate: number | null;
  parent_informed_rate: number | null;
  social_worker_informed_rate: number | null;
  recorded_promptly_rate: number | null;
  average_duration: number | null;
  unique_children: number;
  by_waking_reason: Record<string, number>;
  by_emotional_state: Record<string, number>;
  by_staff_response: Record<string, number>;
  by_sleep_return_time: Record<string, number>;
} {
  const distressed = records.filter((r) => r.child_emotional_state === "distressed").length;
  const angry = records.filter((r) => r.child_emotional_state === "angry").length;
  const nightmare = records.filter((r) => r.waking_reason === "nightmare").length;
  const didNotReturn = records.filter((r) => r.sleep_return_time === "did_not_return_to_sleep").length;

  const boolRate = (field: keyof NightWakingMonitoringRecord) => {
    const count = records.filter((r) => r[field] === true).length;
    return records.length > 0
      ? Math.round((count / records.length) * 1000) / 10
      : null;
  };

  const avgDuration = records.length > 0
    ? Math.round((records.reduce((sum, r) => sum + r.waking_duration_minutes, 0) / records.length) * 10) / 10
    : null;

  const uniqueChildren = new Set(records.map((r) => r.child_name)).size;

  const byReason: Record<string, number> = {};
  for (const r of records) byReason[r.waking_reason] = (byReason[r.waking_reason] ?? 0) + 1;

  const byState: Record<string, number> = {};
  for (const r of records) byState[r.child_emotional_state] = (byState[r.child_emotional_state] ?? 0) + 1;

  const byResponse: Record<string, number> = {};
  for (const r of records) byResponse[r.staff_response] = (byResponse[r.staff_response] ?? 0) + 1;

  const byReturn: Record<string, number> = {};
  for (const r of records) byReturn[r.sleep_return_time] = (byReturn[r.sleep_return_time] ?? 0) + 1;

  return {
    total_wakings: records.length,
    distressed_count: distressed,
    angry_count: angry,
    nightmare_count: nightmare,
    did_not_return_count: didNotReturn,
    child_comforted_rate: boolRate("child_comforted"),
    environment_checked_rate: boolRate("environment_checked"),
    temperature_appropriate_rate: boolRate("temperature_appropriate"),
    drink_offered_rate: boolRate("drink_offered"),
    night_light_rate: boolRate("night_light_available"),
    door_preference_rate: boolRate("door_preference_respected"),
    gp_referral_rate: boolRate("gp_referral_considered"),
    sleep_plan_rate: boolRate("sleep_plan_followed"),
    pattern_identified_rate: boolRate("pattern_identified"),
    parent_informed_rate: boolRate("parent_informed"),
    social_worker_informed_rate: boolRate("social_worker_informed"),
    recorded_promptly_rate: boolRate("recorded_promptly"),
    average_duration: avgDuration,
    unique_children: uniqueChildren,
    by_waking_reason: byReason,
    by_emotional_state: byState,
    by_staff_response: byResponse,
    by_sleep_return_time: byReturn,
  };
}

export function identifyNightWakingAlerts(
  records: NightWakingMonitoringRecord[],
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

  // Distressed child not comforted
  for (const r of records) {
    if ((r.child_emotional_state === "distressed" || r.child_emotional_state === "angry") && !r.child_comforted) {
      alerts.push({
        type: "distressed_not_comforted",
        severity: "critical",
        message: `${r.child_name} was ${r.child_emotional_state} during night waking on ${r.waking_date} and was not comforted — review night care practice`,
        id: r.id,
      });
    }
  }

  // Sleep plan not followed
  const noSleepPlan = records.filter((r) => !r.sleep_plan_followed).length;
  if (noSleepPlan >= 1) {
    alerts.push({
      type: "sleep_plan_not_followed",
      severity: "high",
      message: `${noSleepPlan} night ${noSleepPlan === 1 ? "waking has" : "wakings have"} sleep plan not followed — ensure individualised care`,
      id: "sleep_plan_not_followed",
    });
  }

  // Not recorded promptly
  const notRecorded = records.filter((r) => !r.recorded_promptly).length;
  if (notRecorded >= 1) {
    alerts.push({
      type: "not_recorded_promptly",
      severity: "high",
      message: `${notRecorded} night ${notRecorded === 1 ? "waking was" : "wakings were"} not recorded promptly — maintain accurate records`,
      id: "not_recorded_promptly",
    });
  }

  // Environment not checked
  const noEnvCheck = records.filter((r) => !r.environment_checked).length;
  if (noEnvCheck >= 2) {
    alerts.push({
      type: "environment_not_checked",
      severity: "medium",
      message: `${noEnvCheck} wakings without environment check — ensure safe sleeping environment`,
      id: "environment_not_checked",
    });
  }

  // Pattern not identified
  const noPattern = records.filter((r) => !r.pattern_identified).length;
  if (noPattern >= 3) {
    alerts.push({
      type: "pattern_not_identified",
      severity: "medium",
      message: `${noPattern} wakings without pattern analysis — identify recurring triggers`,
      id: "pattern_not_identified",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    wakingReason?: WakingReason;
    childEmotionalState?: ChildEmotionalState;
    staffResponse?: StaffResponse;
    sleepReturnTime?: SleepReturnTime;
    limit?: number;
  },
): Promise<ServiceResult<NightWakingMonitoringRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_night_waking_monitoring") as SB).select("*").eq("home_id", homeId);
  if (filters?.wakingReason) q = q.eq("waking_reason", filters.wakingReason);
  if (filters?.childEmotionalState) q = q.eq("child_emotional_state", filters.childEmotionalState);
  if (filters?.staffResponse) q = q.eq("staff_response", filters.staffResponse);
  if (filters?.sleepReturnTime) q = q.eq("sleep_return_time", filters.sleepReturnTime);
  q = q.order("waking_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  payload: {
    homeId: string;
    wakingReason: WakingReason;
    childEmotionalState: ChildEmotionalState;
    staffResponse: StaffResponse;
    sleepReturnTime: SleepReturnTime;
    wakingDate: string;
    wakingTime: string;
    childName: string;
    childId?: string | null;
    staffOnDuty: string;
    childComforted?: boolean;
    environmentChecked?: boolean;
    temperatureAppropriate?: boolean;
    drinkOffered?: boolean;
    nightLightAvailable?: boolean;
    doorPreferenceRespected?: boolean;
    gpReferralConsidered?: boolean;
    sleepPlanFollowed?: boolean;
    patternIdentified?: boolean;
    parentInformed?: boolean;
    socialWorkerInformed?: boolean;
    recordedPromptly?: boolean;
    issuesFound?: string[];
    actionsTaken?: string[];
    wakingDurationMinutes: number;
    nextReviewDate?: string | null;
    notes?: string | null;
  },
): Promise<ServiceResult<NightWakingMonitoringRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_night_waking_monitoring") as SB)
    .insert({
      home_id: payload.homeId,
      waking_reason: payload.wakingReason,
      child_emotional_state: payload.childEmotionalState,
      staff_response: payload.staffResponse,
      sleep_return_time: payload.sleepReturnTime,
      waking_date: payload.wakingDate,
      waking_time: payload.wakingTime,
      child_name: payload.childName,
      child_id: payload.childId ?? null,
      staff_on_duty: payload.staffOnDuty,
      child_comforted: payload.childComforted ?? true,
      environment_checked: payload.environmentChecked ?? true,
      temperature_appropriate: payload.temperatureAppropriate ?? true,
      drink_offered: payload.drinkOffered ?? true,
      night_light_available: payload.nightLightAvailable ?? true,
      door_preference_respected: payload.doorPreferenceRespected ?? true,
      gp_referral_considered: payload.gpReferralConsidered ?? false,
      sleep_plan_followed: payload.sleepPlanFollowed ?? true,
      pattern_identified: payload.patternIdentified ?? false,
      parent_informed: payload.parentInformed ?? false,
      social_worker_informed: payload.socialWorkerInformed ?? false,
      recorded_promptly: payload.recordedPromptly ?? true,
      issues_found: payload.issuesFound ?? [],
      actions_taken: payload.actionsTaken ?? [],
      waking_duration_minutes: payload.wakingDurationMinutes,
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
    wakingReason: WakingReason;
    childEmotionalState: ChildEmotionalState;
    staffResponse: StaffResponse;
    sleepReturnTime: SleepReturnTime;
    wakingDate: string;
    wakingTime: string;
    childName: string;
    childId: string | null;
    staffOnDuty: string;
    childComforted: boolean;
    environmentChecked: boolean;
    temperatureAppropriate: boolean;
    drinkOffered: boolean;
    nightLightAvailable: boolean;
    doorPreferenceRespected: boolean;
    gpReferralConsidered: boolean;
    sleepPlanFollowed: boolean;
    patternIdentified: boolean;
    parentInformed: boolean;
    socialWorkerInformed: boolean;
    recordedPromptly: boolean;
    issuesFound: string[];
    actionsTaken: string[];
    wakingDurationMinutes: number;
    nextReviewDate: string | null;
    notes: string | null;
  }>,
): Promise<ServiceResult<NightWakingMonitoringRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.wakingReason !== undefined) mapped.waking_reason = updates.wakingReason;
  if (updates.childEmotionalState !== undefined) mapped.child_emotional_state = updates.childEmotionalState;
  if (updates.staffResponse !== undefined) mapped.staff_response = updates.staffResponse;
  if (updates.sleepReturnTime !== undefined) mapped.sleep_return_time = updates.sleepReturnTime;
  if (updates.wakingDate !== undefined) mapped.waking_date = updates.wakingDate;
  if (updates.wakingTime !== undefined) mapped.waking_time = updates.wakingTime;
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.childId !== undefined) mapped.child_id = updates.childId;
  if (updates.staffOnDuty !== undefined) mapped.staff_on_duty = updates.staffOnDuty;
  if (updates.childComforted !== undefined) mapped.child_comforted = updates.childComforted;
  if (updates.environmentChecked !== undefined) mapped.environment_checked = updates.environmentChecked;
  if (updates.temperatureAppropriate !== undefined) mapped.temperature_appropriate = updates.temperatureAppropriate;
  if (updates.drinkOffered !== undefined) mapped.drink_offered = updates.drinkOffered;
  if (updates.nightLightAvailable !== undefined) mapped.night_light_available = updates.nightLightAvailable;
  if (updates.doorPreferenceRespected !== undefined) mapped.door_preference_respected = updates.doorPreferenceRespected;
  if (updates.gpReferralConsidered !== undefined) mapped.gp_referral_considered = updates.gpReferralConsidered;
  if (updates.sleepPlanFollowed !== undefined) mapped.sleep_plan_followed = updates.sleepPlanFollowed;
  if (updates.patternIdentified !== undefined) mapped.pattern_identified = updates.patternIdentified;
  if (updates.parentInformed !== undefined) mapped.parent_informed = updates.parentInformed;
  if (updates.socialWorkerInformed !== undefined) mapped.social_worker_informed = updates.socialWorkerInformed;
  if (updates.recordedPromptly !== undefined) mapped.recorded_promptly = updates.recordedPromptly;
  if (updates.issuesFound !== undefined) mapped.issues_found = updates.issuesFound;
  if (updates.actionsTaken !== undefined) mapped.actions_taken = updates.actionsTaken;
  if (updates.wakingDurationMinutes !== undefined) mapped.waking_duration_minutes = updates.wakingDurationMinutes;
  if (updates.nextReviewDate !== undefined) mapped.next_review_date = updates.nextReviewDate;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  const { data, error } = await (s.from("cs_night_waking_monitoring") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeNightWakingMetrics,
  identifyNightWakingAlerts,
};
