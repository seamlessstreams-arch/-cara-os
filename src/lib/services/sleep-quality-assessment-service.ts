// ══════════════════════════════════════════════════════════════════════════════
// CARA — SLEEP QUALITY ASSESSMENT SERVICE
// Tracks sleep quality, bedtime routines, sleep environment, and
// health concerns relating to children's sleep in residential care.
// CHR 2015 Reg 12 (health and wellbeing — restful sleep),
// Reg 7 (individual child — bedtime routines and preferences).
//
// Covers: sleep quality rating, bedtime routine adherence, waking frequency,
// sleep environment suitability, and health-related sleep concerns.
//
// SCCIF: Experiences — "Children get enough sleep and have good bedtime routines."
// "Sleep environments are safe, comfortable, and personalised."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type SleepQuality =
  | "excellent"
  | "good"
  | "fair"
  | "poor"
  | "very_poor";

export type BedtimeRoutine =
  | "fully_followed"
  | "mostly_followed"
  | "partially_followed"
  | "not_followed"
  | "no_routine_set";

export type SleepEnvironment =
  | "excellent"
  | "good"
  | "adequate"
  | "needs_improvement"
  | "unsuitable";

export type WakingFrequency =
  | "none"
  | "once"
  | "twice"
  | "three_plus"
  | "continuous_disturbance";

export type SleepConcern =
  | "nightmares"
  | "insomnia"
  | "sleep_apnoea"
  | "restless_legs"
  | "night_terrors"
  | "sleepwalking"
  | "medication_related"
  | "anxiety_related"
  | "none_identified"
  | "other";

export interface SleepQualityAssessmentRecord {
  id: string;
  home_id: string;
  sleep_quality: SleepQuality;
  bedtime_routine: BedtimeRoutine;
  sleep_environment: SleepEnvironment;
  waking_frequency: WakingFrequency;
  sleep_concern: SleepConcern;
  assessment_date: string;
  child_name: string;
  child_id: string | null;
  assessed_by: string;
  bedtime_consistent: boolean;
  wake_time_consistent: boolean;
  room_comfortable: boolean;
  temperature_appropriate: boolean;
  noise_minimised: boolean;
  screen_free_before_bed: boolean;
  relaxation_supported: boolean;
  child_preferences_met: boolean;
  gp_referral_considered: boolean;
  sleep_plan_in_place: boolean;
  care_plan_linked: boolean;
  recorded_promptly: boolean;
  issues_found: string[];
  actions_taken: string[];
  sleep_hours: number;
  next_review_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const SLEEP_QUALITIES: { quality: SleepQuality; label: string }[] = [
  { quality: "excellent", label: "Excellent" },
  { quality: "good", label: "Good" },
  { quality: "fair", label: "Fair" },
  { quality: "poor", label: "Poor" },
  { quality: "very_poor", label: "Very Poor" },
];

export const BEDTIME_ROUTINES: { routine: BedtimeRoutine; label: string }[] = [
  { routine: "fully_followed", label: "Fully Followed" },
  { routine: "mostly_followed", label: "Mostly Followed" },
  { routine: "partially_followed", label: "Partially Followed" },
  { routine: "not_followed", label: "Not Followed" },
  { routine: "no_routine_set", label: "No Routine Set" },
];

export const SLEEP_ENVIRONMENTS: { environment: SleepEnvironment; label: string }[] = [
  { environment: "excellent", label: "Excellent" },
  { environment: "good", label: "Good" },
  { environment: "adequate", label: "Adequate" },
  { environment: "needs_improvement", label: "Needs Improvement" },
  { environment: "unsuitable", label: "Unsuitable" },
];

export const WAKING_FREQUENCIES: { frequency: WakingFrequency; label: string }[] = [
  { frequency: "none", label: "None" },
  { frequency: "once", label: "Once" },
  { frequency: "twice", label: "Twice" },
  { frequency: "three_plus", label: "Three+" },
  { frequency: "continuous_disturbance", label: "Continuous Disturbance" },
];

export const SLEEP_CONCERNS: { concern: SleepConcern; label: string }[] = [
  { concern: "nightmares", label: "Nightmares" },
  { concern: "insomnia", label: "Insomnia" },
  { concern: "sleep_apnoea", label: "Sleep Apnoea" },
  { concern: "restless_legs", label: "Restless Legs" },
  { concern: "night_terrors", label: "Night Terrors" },
  { concern: "sleepwalking", label: "Sleepwalking" },
  { concern: "medication_related", label: "Medication Related" },
  { concern: "anxiety_related", label: "Anxiety Related" },
  { concern: "none_identified", label: "None Identified" },
  { concern: "other", label: "Other" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeSleepQualityMetrics(
  records: SleepQualityAssessmentRecord[],
): {
  total_assessments: number;
  poor_sleep_count: number;
  very_poor_sleep_count: number;
  no_routine_count: number;
  unsuitable_environment_count: number;
  continuous_disturbance_count: number;
  bedtime_consistent_rate: number | null;
  wake_time_consistent_rate: number | null;
  room_comfortable_rate: number | null;
  temperature_appropriate_rate: number | null;
  noise_minimised_rate: number | null;
  screen_free_rate: number | null;
  relaxation_supported_rate: number | null;
  child_preferences_rate: number | null;
  gp_referral_rate: number | null;
  sleep_plan_rate: number | null;
  care_plan_linked_rate: number | null;
  recorded_promptly_rate: number | null;
  average_sleep_hours: number | null;
  unique_children: number;
  by_sleep_quality: Record<string, number>;
  by_bedtime_routine: Record<string, number>;
  by_sleep_environment: Record<string, number>;
  by_waking_frequency: Record<string, number>;
  by_sleep_concern: Record<string, number>;
} {
  const poorSleep = records.filter((r) => r.sleep_quality === "poor").length;
  const veryPoorSleep = records.filter((r) => r.sleep_quality === "very_poor").length;
  const noRoutine = records.filter((r) => r.bedtime_routine === "no_routine_set").length;
  const unsuitableEnv = records.filter((r) => r.sleep_environment === "unsuitable").length;
  const continuousDisturbance = records.filter((r) => r.waking_frequency === "continuous_disturbance").length;

  const boolRate = (field: keyof SleepQualityAssessmentRecord) => {
    const count = records.filter((r) => r[field] === true).length;
    return records.length > 0
      ? Math.round((count / records.length) * 1000) / 10
      : null;
  };

  const avgHours =
    records.length > 0
      ? Math.round(
          (records.reduce((sum, r) => sum + r.sleep_hours, 0) / records.length) * 10,
        ) / 10
      : null;

  const uniqueChildren = new Set(records.map((r) => r.child_name)).size;

  const byQuality: Record<string, number> = {};
  for (const r of records) byQuality[r.sleep_quality] = (byQuality[r.sleep_quality] ?? 0) + 1;

  const byRoutine: Record<string, number> = {};
  for (const r of records) byRoutine[r.bedtime_routine] = (byRoutine[r.bedtime_routine] ?? 0) + 1;

  const byEnv: Record<string, number> = {};
  for (const r of records) byEnv[r.sleep_environment] = (byEnv[r.sleep_environment] ?? 0) + 1;

  const byWaking: Record<string, number> = {};
  for (const r of records) byWaking[r.waking_frequency] = (byWaking[r.waking_frequency] ?? 0) + 1;

  const byConcern: Record<string, number> = {};
  for (const r of records) byConcern[r.sleep_concern] = (byConcern[r.sleep_concern] ?? 0) + 1;

  return {
    total_assessments: records.length,
    poor_sleep_count: poorSleep,
    very_poor_sleep_count: veryPoorSleep,
    no_routine_count: noRoutine,
    unsuitable_environment_count: unsuitableEnv,
    continuous_disturbance_count: continuousDisturbance,
    bedtime_consistent_rate: boolRate("bedtime_consistent"),
    wake_time_consistent_rate: boolRate("wake_time_consistent"),
    room_comfortable_rate: boolRate("room_comfortable"),
    temperature_appropriate_rate: boolRate("temperature_appropriate"),
    noise_minimised_rate: boolRate("noise_minimised"),
    screen_free_rate: boolRate("screen_free_before_bed"),
    relaxation_supported_rate: boolRate("relaxation_supported"),
    child_preferences_rate: boolRate("child_preferences_met"),
    gp_referral_rate: boolRate("gp_referral_considered"),
    sleep_plan_rate: boolRate("sleep_plan_in_place"),
    care_plan_linked_rate: boolRate("care_plan_linked"),
    recorded_promptly_rate: boolRate("recorded_promptly"),
    average_sleep_hours: avgHours,
    unique_children: uniqueChildren,
    by_sleep_quality: byQuality,
    by_bedtime_routine: byRoutine,
    by_sleep_environment: byEnv,
    by_waking_frequency: byWaking,
    by_sleep_concern: byConcern,
  };
}

export function identifySleepQualityAlerts(
  records: SleepQualityAssessmentRecord[],
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

  // Very poor sleep without GP referral
  for (const r of records) {
    if (r.sleep_quality === "very_poor" && !r.gp_referral_considered) {
      alerts.push({
        type: "very_poor_no_gp_referral",
        severity: "critical",
        message: `${r.child_name} has very poor sleep quality without GP referral considered — urgent health review needed`,
        id: r.id,
      });
    }
  }

  // No sleep plan in place
  const noSleepPlan = records.filter((r) => !r.sleep_plan_in_place).length;
  if (noSleepPlan >= 1) {
    alerts.push({
      type: "no_sleep_plan",
      severity: "high",
      message: `${noSleepPlan} ${noSleepPlan === 1 ? "child has" : "children have"} no sleep plan in place — develop individualised sleep plans`,
      id: "no_sleep_plan",
    });
  }

  // No bedtime routine
  const noRoutineCount = records.filter((r) => r.bedtime_routine === "no_routine_set").length;
  if (noRoutineCount >= 1) {
    alerts.push({
      type: "no_bedtime_routine",
      severity: "high",
      message: `${noRoutineCount} ${noRoutineCount === 1 ? "assessment shows" : "assessments show"} no bedtime routine set — establish consistent routines`,
      id: "no_bedtime_routine",
    });
  }

  // Screen not free before bed
  const noScreenFree = records.filter((r) => !r.screen_free_before_bed).length;
  if (noScreenFree >= 2) {
    alerts.push({
      type: "screens_before_bed",
      severity: "medium",
      message: `${noScreenFree} assessments show screens not removed before bed — review screen time boundaries`,
      id: "screens_before_bed",
    });
  }

  // Room not comfortable
  const notComfortable = records.filter((r) => !r.room_comfortable).length;
  if (notComfortable >= 2) {
    alerts.push({
      type: "room_not_comfortable",
      severity: "medium",
      message: `${notComfortable} assessments show rooms not comfortable — review bedroom environments`,
      id: "room_not_comfortable",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    sleepQuality?: SleepQuality;
    bedtimeRoutine?: BedtimeRoutine;
    sleepEnvironment?: SleepEnvironment;
    wakingFrequency?: WakingFrequency;
    sleepConcern?: SleepConcern;
    limit?: number;
  },
): Promise<ServiceResult<SleepQualityAssessmentRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_sleep_quality_assessment") as SB).select("*").eq("home_id", homeId);
  if (filters?.sleepQuality) q = q.eq("sleep_quality", filters.sleepQuality);
  if (filters?.bedtimeRoutine) q = q.eq("bedtime_routine", filters.bedtimeRoutine);
  if (filters?.sleepEnvironment) q = q.eq("sleep_environment", filters.sleepEnvironment);
  if (filters?.wakingFrequency) q = q.eq("waking_frequency", filters.wakingFrequency);
  if (filters?.sleepConcern) q = q.eq("sleep_concern", filters.sleepConcern);
  q = q.order("assessment_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  payload: {
    homeId: string;
    sleepQuality: SleepQuality;
    bedtimeRoutine: BedtimeRoutine;
    sleepEnvironment: SleepEnvironment;
    wakingFrequency: WakingFrequency;
    sleepConcern: SleepConcern;
    assessmentDate: string;
    childName: string;
    childId?: string | null;
    assessedBy: string;
    bedtimeConsistent?: boolean;
    wakeTimeConsistent?: boolean;
    roomComfortable?: boolean;
    temperatureAppropriate?: boolean;
    noiseMinimised?: boolean;
    screenFreeBeforeBed?: boolean;
    relaxationSupported?: boolean;
    childPreferencesMet?: boolean;
    gpReferralConsidered?: boolean;
    sleepPlanInPlace?: boolean;
    carePlanLinked?: boolean;
    recordedPromptly?: boolean;
    issuesFound?: string[];
    actionsTaken?: string[];
    sleepHours: number;
    nextReviewDate?: string | null;
    notes?: string | null;
  },
): Promise<ServiceResult<SleepQualityAssessmentRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_sleep_quality_assessment") as SB)
    .insert({
      home_id: payload.homeId,
      sleep_quality: payload.sleepQuality,
      bedtime_routine: payload.bedtimeRoutine,
      sleep_environment: payload.sleepEnvironment,
      waking_frequency: payload.wakingFrequency,
      sleep_concern: payload.sleepConcern,
      assessment_date: payload.assessmentDate,
      child_name: payload.childName,
      child_id: payload.childId ?? null,
      assessed_by: payload.assessedBy,
      bedtime_consistent: payload.bedtimeConsistent ?? true,
      wake_time_consistent: payload.wakeTimeConsistent ?? true,
      room_comfortable: payload.roomComfortable ?? true,
      temperature_appropriate: payload.temperatureAppropriate ?? true,
      noise_minimised: payload.noiseMinimised ?? true,
      screen_free_before_bed: payload.screenFreeBeforeBed ?? true,
      relaxation_supported: payload.relaxationSupported ?? true,
      child_preferences_met: payload.childPreferencesMet ?? true,
      gp_referral_considered: payload.gpReferralConsidered ?? false,
      sleep_plan_in_place: payload.sleepPlanInPlace ?? true,
      care_plan_linked: payload.carePlanLinked ?? true,
      recorded_promptly: payload.recordedPromptly ?? true,
      issues_found: payload.issuesFound ?? [],
      actions_taken: payload.actionsTaken ?? [],
      sleep_hours: payload.sleepHours,
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
    sleepQuality: SleepQuality;
    bedtimeRoutine: BedtimeRoutine;
    sleepEnvironment: SleepEnvironment;
    wakingFrequency: WakingFrequency;
    sleepConcern: SleepConcern;
    assessmentDate: string;
    childName: string;
    childId: string | null;
    assessedBy: string;
    bedtimeConsistent: boolean;
    wakeTimeConsistent: boolean;
    roomComfortable: boolean;
    temperatureAppropriate: boolean;
    noiseMinimised: boolean;
    screenFreeBeforeBed: boolean;
    relaxationSupported: boolean;
    childPreferencesMet: boolean;
    gpReferralConsidered: boolean;
    sleepPlanInPlace: boolean;
    carePlanLinked: boolean;
    recordedPromptly: boolean;
    issuesFound: string[];
    actionsTaken: string[];
    sleepHours: number;
    nextReviewDate: string | null;
    notes: string | null;
  }>,
): Promise<ServiceResult<SleepQualityAssessmentRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.sleepQuality !== undefined) mapped.sleep_quality = updates.sleepQuality;
  if (updates.bedtimeRoutine !== undefined) mapped.bedtime_routine = updates.bedtimeRoutine;
  if (updates.sleepEnvironment !== undefined) mapped.sleep_environment = updates.sleepEnvironment;
  if (updates.wakingFrequency !== undefined) mapped.waking_frequency = updates.wakingFrequency;
  if (updates.sleepConcern !== undefined) mapped.sleep_concern = updates.sleepConcern;
  if (updates.assessmentDate !== undefined) mapped.assessment_date = updates.assessmentDate;
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.childId !== undefined) mapped.child_id = updates.childId;
  if (updates.assessedBy !== undefined) mapped.assessed_by = updates.assessedBy;
  if (updates.bedtimeConsistent !== undefined) mapped.bedtime_consistent = updates.bedtimeConsistent;
  if (updates.wakeTimeConsistent !== undefined) mapped.wake_time_consistent = updates.wakeTimeConsistent;
  if (updates.roomComfortable !== undefined) mapped.room_comfortable = updates.roomComfortable;
  if (updates.temperatureAppropriate !== undefined) mapped.temperature_appropriate = updates.temperatureAppropriate;
  if (updates.noiseMinimised !== undefined) mapped.noise_minimised = updates.noiseMinimised;
  if (updates.screenFreeBeforeBed !== undefined) mapped.screen_free_before_bed = updates.screenFreeBeforeBed;
  if (updates.relaxationSupported !== undefined) mapped.relaxation_supported = updates.relaxationSupported;
  if (updates.childPreferencesMet !== undefined) mapped.child_preferences_met = updates.childPreferencesMet;
  if (updates.gpReferralConsidered !== undefined) mapped.gp_referral_considered = updates.gpReferralConsidered;
  if (updates.sleepPlanInPlace !== undefined) mapped.sleep_plan_in_place = updates.sleepPlanInPlace;
  if (updates.carePlanLinked !== undefined) mapped.care_plan_linked = updates.carePlanLinked;
  if (updates.recordedPromptly !== undefined) mapped.recorded_promptly = updates.recordedPromptly;
  if (updates.issuesFound !== undefined) mapped.issues_found = updates.issuesFound;
  if (updates.actionsTaken !== undefined) mapped.actions_taken = updates.actionsTaken;
  if (updates.sleepHours !== undefined) mapped.sleep_hours = updates.sleepHours;
  if (updates.nextReviewDate !== undefined) mapped.next_review_date = updates.nextReviewDate;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  const { data, error } = await (s.from("cs_sleep_quality_assessment") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeSleepQualityMetrics,
  identifySleepQualityAlerts,
};
