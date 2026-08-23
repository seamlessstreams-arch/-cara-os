// ══════════════════════════════════════════════════════════════════════════════
// CARA — DAILY ROUTINE SERVICE
// Tracks structured daily routines for children, supporting normality,
// predictability, and wellbeing through consistent schedules.
// CHR 2015 Reg 6 (quality and purpose of care — meeting needs),
// Reg 9 (promoting positive behaviour through structure),
// Reg 14 (care planning — daily living plans).
//
// Covers: wake/sleep times, meal routines, school preparation,
// activities, homework, free time, personal care, and bedtime.
//
// SCCIF: Overall Experiences — "Children benefit from stable routines."
// "Daily life is well organised and supports children's needs."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type RoutineType =
  | "weekday"
  | "weekend"
  | "school_holiday"
  | "special_occasion"
  | "contact_day"
  | "transition_day";

export type RoutineSlot =
  | "wake_up"
  | "morning_care"
  | "breakfast"
  | "school_preparation"
  | "school_run"
  | "morning_activity"
  | "lunch"
  | "afternoon_activity"
  | "homework"
  | "after_school"
  | "dinner"
  | "evening_activity"
  | "free_time"
  | "personal_care"
  | "wind_down"
  | "bedtime"
  | "night_check";

export type ComplianceRating =
  | "fully_followed"
  | "mostly_followed"
  | "partially_followed"
  | "not_followed"
  | "not_applicable";

export type AdaptationReason =
  | "child_request"
  | "health_need"
  | "contact_visit"
  | "appointment"
  | "activity"
  | "behaviour"
  | "staff_decision"
  | "emergency"
  | "other";

export interface DailyRoutineRecord {
  id: string;
  home_id: string;
  child_name: string;
  child_id: string;
  routine_date: string;
  routine_type: RoutineType;
  routine_slot: RoutineSlot;
  scheduled_time: string;
  actual_time: string | null;
  compliance_rating: ComplianceRating;
  adapted: boolean;
  adaptation_reason: AdaptationReason | null;
  child_engaged: boolean;
  child_mood: string | null;
  staff_supporting: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const ROUTINE_TYPES: { type: RoutineType; label: string }[] = [
  { type: "weekday", label: "Weekday" },
  { type: "weekend", label: "Weekend" },
  { type: "school_holiday", label: "School Holiday" },
  { type: "special_occasion", label: "Special Occasion" },
  { type: "contact_day", label: "Contact Day" },
  { type: "transition_day", label: "Transition Day" },
];

export const ROUTINE_SLOTS: { slot: RoutineSlot; label: string }[] = [
  { slot: "wake_up", label: "Wake Up" },
  { slot: "morning_care", label: "Morning Care" },
  { slot: "breakfast", label: "Breakfast" },
  { slot: "school_preparation", label: "School Preparation" },
  { slot: "school_run", label: "School Run" },
  { slot: "morning_activity", label: "Morning Activity" },
  { slot: "lunch", label: "Lunch" },
  { slot: "afternoon_activity", label: "Afternoon Activity" },
  { slot: "homework", label: "Homework" },
  { slot: "after_school", label: "After School" },
  { slot: "dinner", label: "Dinner" },
  { slot: "evening_activity", label: "Evening Activity" },
  { slot: "free_time", label: "Free Time" },
  { slot: "personal_care", label: "Personal Care" },
  { slot: "wind_down", label: "Wind Down" },
  { slot: "bedtime", label: "Bedtime" },
  { slot: "night_check", label: "Night Check" },
];

export const COMPLIANCE_RATINGS: { rating: ComplianceRating; label: string }[] = [
  { rating: "fully_followed", label: "Fully Followed" },
  { rating: "mostly_followed", label: "Mostly Followed" },
  { rating: "partially_followed", label: "Partially Followed" },
  { rating: "not_followed", label: "Not Followed" },
  { rating: "not_applicable", label: "Not Applicable" },
];

export const ADAPTATION_REASONS: { reason: AdaptationReason; label: string }[] = [
  { reason: "child_request", label: "Child Request" },
  { reason: "health_need", label: "Health Need" },
  { reason: "contact_visit", label: "Contact Visit" },
  { reason: "appointment", label: "Appointment" },
  { reason: "activity", label: "Activity" },
  { reason: "behaviour", label: "Behaviour" },
  { reason: "staff_decision", label: "Staff Decision" },
  { reason: "emergency", label: "Emergency" },
  { reason: "other", label: "Other" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeRoutineMetrics(
  records: DailyRoutineRecord[],
  totalChildren: number,
): {
  total_records: number;
  children_with_routines: number;
  routine_coverage: number | null;
  fully_followed_count: number;
  mostly_followed_count: number;
  partially_followed_count: number;
  not_followed_count: number;
  compliance_rate: number | null;
  adapted_count: number;
  adaptation_rate: number | null;
  child_engaged_rate: number | null;
  average_per_child: number | null;
  by_routine_type: Record<string, number>;
  by_routine_slot: Record<string, number>;
  by_compliance: Record<string, number>;
  by_adaptation_reason: Record<string, number>;
  by_child: Record<string, number>;
} {
  const uniqueChildren = new Set(records.map((r) => r.child_id)).size;
  const coverage =
    totalChildren > 0
      ? Math.round((uniqueChildren / totalChildren) * 1000) / 10
      : null;

  const applicable = records.filter((r) => r.compliance_rating !== "not_applicable");
  const fullyFollowed = records.filter((r) => r.compliance_rating === "fully_followed").length;
  const mostlyFollowed = records.filter((r) => r.compliance_rating === "mostly_followed").length;
  const partiallyFollowed = records.filter((r) => r.compliance_rating === "partially_followed").length;
  const notFollowed = records.filter((r) => r.compliance_rating === "not_followed").length;

  const compliant = applicable.filter(
    (r) => r.compliance_rating === "fully_followed" || r.compliance_rating === "mostly_followed",
  ).length;
  const complianceRate =
    applicable.length > 0
      ? Math.round((compliant / applicable.length) * 1000) / 10
      : null;

  const adapted = records.filter((r) => r.adapted).length;
  const adaptationRate =
    records.length > 0
      ? Math.round((adapted / records.length) * 1000) / 10
      : null;

  const engaged = records.filter((r) => r.child_engaged).length;
  const engagedRate =
    records.length > 0
      ? Math.round((engaged / records.length) * 1000) / 10
      : null;

  const avgPerChild =
    uniqueChildren > 0
      ? Math.round((records.length / uniqueChildren) * 10) / 10
      : null;

  const byType: Record<string, number> = {};
  for (const r of records) byType[r.routine_type] = (byType[r.routine_type] ?? 0) + 1;

  const bySlot: Record<string, number> = {};
  for (const r of records) bySlot[r.routine_slot] = (bySlot[r.routine_slot] ?? 0) + 1;

  const byCompliance: Record<string, number> = {};
  for (const r of records) byCompliance[r.compliance_rating] = (byCompliance[r.compliance_rating] ?? 0) + 1;

  const byReason: Record<string, number> = {};
  for (const r of records) {
    if (r.adaptation_reason) byReason[r.adaptation_reason] = (byReason[r.adaptation_reason] ?? 0) + 1;
  }

  const byChild: Record<string, number> = {};
  for (const r of records) byChild[r.child_name] = (byChild[r.child_name] ?? 0) + 1;

  return {
    total_records: records.length,
    children_with_routines: uniqueChildren,
    routine_coverage: coverage,
    fully_followed_count: fullyFollowed,
    mostly_followed_count: mostlyFollowed,
    partially_followed_count: partiallyFollowed,
    not_followed_count: notFollowed,
    compliance_rate: complianceRate,
    adapted_count: adapted,
    adaptation_rate: adaptationRate,
    child_engaged_rate: engagedRate,
    average_per_child: avgPerChild,
    by_routine_type: byType,
    by_routine_slot: bySlot,
    by_compliance: byCompliance,
    by_adaptation_reason: byReason,
    by_child: byChild,
  };
}

export function identifyRoutineAlerts(
  records: DailyRoutineRecord[],
  totalChildren: number,
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

  // Children with no routine records
  const childrenCovered = new Set(records.map((r) => r.child_id)).size;
  if (totalChildren > 0 && childrenCovered < totalChildren) {
    const gap = totalChildren - childrenCovered;
    alerts.push({
      type: "no_routine",
      severity: "high",
      message: `${gap} ${gap === 1 ? "child has" : "children have"} no daily routine records — structured routines support stability and wellbeing`,
      id: "routine_gap",
    });
  }

  // High not-followed rate for a child
  const byChild: Record<string, { total: number; notFollowed: number; name: string }> = {};
  for (const r of records) {
    if (r.compliance_rating === "not_applicable") continue;
    if (!byChild[r.child_id]) byChild[r.child_id] = { total: 0, notFollowed: 0, name: r.child_name };
    byChild[r.child_id].total++;
    if (r.compliance_rating === "not_followed") byChild[r.child_id].notFollowed++;
  }
  for (const [childId, data] of Object.entries(byChild)) {
    if (data.total >= 3 && data.notFollowed / data.total > 0.5) {
      alerts.push({
        type: "routine_not_followed",
        severity: "high",
        message: `${data.name}'s routine frequently not followed (${data.notFollowed}/${data.total}) — review routine suitability and support`,
        id: childId,
      });
    }
  }

  // Bedtime routines not followed
  const bedtimeNotFollowed = records.filter(
    (r) => r.routine_slot === "bedtime" && r.compliance_rating === "not_followed",
  );
  if (bedtimeNotFollowed.length >= 2) {
    alerts.push({
      type: "bedtime_disruption",
      severity: "medium",
      message: `${bedtimeNotFollowed.length} bedtime routines not followed — consistent bedtimes are essential for children's wellbeing`,
      id: "bedtime_disruption",
    });
  }

  // Low engagement
  const lowEngagement = records.filter((r) => !r.child_engaged && r.compliance_rating !== "not_applicable");
  if (lowEngagement.length >= 5) {
    alerts.push({
      type: "low_engagement",
      severity: "medium",
      message: `${lowEngagement.length} routine activities where children were not engaged — review whether routines reflect children's interests and preferences`,
      id: "low_engagement",
    });
  }

  // Emergency adaptations
  const emergencyAdaptations = records.filter((r) => r.adaptation_reason === "emergency");
  if (emergencyAdaptations.length >= 2) {
    alerts.push({
      type: "emergency_adaptations",
      severity: "medium",
      message: `${emergencyAdaptations.length} routine adaptations due to emergencies — review whether emergency planning can reduce routine disruption`,
      id: "emergency_adaptations",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    childId?: string;
    routineType?: RoutineType;
    routineSlot?: RoutineSlot;
    complianceRating?: ComplianceRating;
    limit?: number;
  },
): Promise<ServiceResult<DailyRoutineRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_daily_routines") as SB).select("*").eq("home_id", homeId);
  if (filters?.childId) q = q.eq("child_id", filters.childId);
  if (filters?.routineType) q = q.eq("routine_type", filters.routineType);
  if (filters?.routineSlot) q = q.eq("routine_slot", filters.routineSlot);
  if (filters?.complianceRating) q = q.eq("compliance_rating", filters.complianceRating);
  q = q.order("routine_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  input: {
    homeId: string;
    childName: string;
    childId: string;
    routineDate: string;
    routineType: RoutineType;
    routineSlot: RoutineSlot;
    scheduledTime: string;
    actualTime?: string;
    complianceRating: ComplianceRating;
    adapted: boolean;
    adaptationReason?: AdaptationReason;
    childEngaged: boolean;
    childMood?: string;
    staffSupporting: string;
    notes?: string;
  },
): Promise<ServiceResult<DailyRoutineRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_daily_routines") as SB)
    .insert({
      home_id: input.homeId,
      child_name: input.childName,
      child_id: input.childId,
      routine_date: input.routineDate,
      routine_type: input.routineType,
      routine_slot: input.routineSlot,
      scheduled_time: input.scheduledTime,
      actual_time: input.actualTime ?? null,
      compliance_rating: input.complianceRating,
      adapted: input.adapted,
      adaptation_reason: input.adaptationReason ?? null,
      child_engaged: input.childEngaged,
      child_mood: input.childMood ?? null,
      staff_supporting: input.staffSupporting,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateRecord(
  id: string,
  updates: Partial<Record<string, unknown>>,
): Promise<ServiceResult<DailyRoutineRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_daily_routines") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeRoutineMetrics,
  identifyRoutineAlerts,
};
