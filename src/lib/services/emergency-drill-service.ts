// ══════════════════════════════════════════════════════════════════════════════
// CARA — EMERGENCY DRILL RECORDS SERVICE
// Tracks fire drills, lockdown drills, evacuation exercises,
// missing child procedures, and emergency response practice.
// CHR 2015 Reg 25 (health and safety — emergency preparedness),
// Reg 36 (fitness of premises — fire safety),
// Regulatory Reform (Fire Safety) Order 2005.
//
// Covers: fire evacuation drills, lockdown exercises, missing child
// procedures, bomb threat drills, and emergency equipment checks.
//
// SCCIF: Helped & Protected — "Children know what to do in an emergency."
// "Staff are trained and drills are practised regularly."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type DrillType =
  | "fire_evacuation"
  | "lockdown"
  | "missing_child"
  | "bomb_threat"
  | "intruder"
  | "flood"
  | "power_failure"
  | "gas_leak"
  | "other";

export type DrillOutcome =
  | "successful"
  | "partial_success"
  | "failed"
  | "cancelled"
  | "not_assessed";

export type TimeOfDay =
  | "day_shift"
  | "evening_shift"
  | "night_shift"
  | "waking_night"
  | "weekend";

export type StaffReadiness =
  | "fully_prepared"
  | "mostly_prepared"
  | "partially_prepared"
  | "unprepared"
  | "not_assessed";

export interface EmergencyDrillRecord {
  id: string;
  home_id: string;
  drill_type: DrillType;
  drill_date: string;
  drill_outcome: DrillOutcome;
  time_of_day: TimeOfDay;
  staff_readiness: StaffReadiness;
  evacuation_time_seconds: number | null;
  all_children_accounted: boolean;
  all_staff_participated: boolean;
  assembly_point_used: boolean;
  equipment_working: boolean;
  children_informed_beforehand: boolean;
  children_distressed: boolean;
  learning_points: string[];
  actions_required: string[];
  staff_present: number;
  children_present: number;
  conducted_by: string;
  next_drill_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const DRILL_TYPES: { type: DrillType; label: string }[] = [
  { type: "fire_evacuation", label: "Fire Evacuation" },
  { type: "lockdown", label: "Lockdown" },
  { type: "missing_child", label: "Missing Child" },
  { type: "bomb_threat", label: "Bomb Threat" },
  { type: "intruder", label: "Intruder" },
  { type: "flood", label: "Flood" },
  { type: "power_failure", label: "Power Failure" },
  { type: "gas_leak", label: "Gas Leak" },
  { type: "other", label: "Other" },
];

export const DRILL_OUTCOMES: { outcome: DrillOutcome; label: string }[] = [
  { outcome: "successful", label: "Successful" },
  { outcome: "partial_success", label: "Partial Success" },
  { outcome: "failed", label: "Failed" },
  { outcome: "cancelled", label: "Cancelled" },
  { outcome: "not_assessed", label: "Not Assessed" },
];

export const TIMES_OF_DAY: { time: TimeOfDay; label: string }[] = [
  { time: "day_shift", label: "Day Shift" },
  { time: "evening_shift", label: "Evening Shift" },
  { time: "night_shift", label: "Night Shift" },
  { time: "waking_night", label: "Waking Night" },
  { time: "weekend", label: "Weekend" },
];

export const STAFF_READINESS_LEVELS: { level: StaffReadiness; label: string }[] = [
  { level: "fully_prepared", label: "Fully Prepared" },
  { level: "mostly_prepared", label: "Mostly Prepared" },
  { level: "partially_prepared", label: "Partially Prepared" },
  { level: "unprepared", label: "Unprepared" },
  { level: "not_assessed", label: "Not Assessed" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeDrillMetrics(
  records: EmergencyDrillRecord[],
): {
  total_drills: number;
  fire_evacuation_count: number;
  lockdown_count: number;
  missing_child_count: number;
  successful_rate: number | null;
  failed_count: number;
  cancelled_count: number;
  all_children_accounted_rate: number | null;
  all_staff_participated_rate: number | null;
  assembly_point_used_rate: number | null;
  equipment_working_rate: number | null;
  children_distressed_count: number;
  average_evacuation_time: number | null;
  fully_prepared_rate: number | null;
  unprepared_count: number;
  drill_overdue_count: number;
  by_drill_type: Record<string, number>;
  by_drill_outcome: Record<string, number>;
  by_time_of_day: Record<string, number>;
  by_staff_readiness: Record<string, number>;
} {
  const fireEvac = records.filter((r) => r.drill_type === "fire_evacuation").length;
  const lockdown = records.filter((r) => r.drill_type === "lockdown").length;
  const missingChild = records.filter((r) => r.drill_type === "missing_child").length;

  const successful = records.filter((r) => r.drill_outcome === "successful").length;
  const successRate =
    records.length > 0
      ? Math.round((successful / records.length) * 1000) / 10
      : null;

  const failed = records.filter((r) => r.drill_outcome === "failed").length;
  const cancelled = records.filter((r) => r.drill_outcome === "cancelled").length;

  const childrenAccounted = records.filter((r) => r.all_children_accounted).length;
  const childrenRate =
    records.length > 0
      ? Math.round((childrenAccounted / records.length) * 1000) / 10
      : null;

  const staffParticipated = records.filter((r) => r.all_staff_participated).length;
  const staffRate =
    records.length > 0
      ? Math.round((staffParticipated / records.length) * 1000) / 10
      : null;

  const assemblyUsed = records.filter((r) => r.assembly_point_used).length;
  const assemblyRate =
    records.length > 0
      ? Math.round((assemblyUsed / records.length) * 1000) / 10
      : null;

  const equipWorking = records.filter((r) => r.equipment_working).length;
  const equipRate =
    records.length > 0
      ? Math.round((equipWorking / records.length) * 1000) / 10
      : null;

  const distressed = records.filter((r) => r.children_distressed).length;

  const evacTimes = records.filter((r) => r.evacuation_time_seconds !== null).map((r) => r.evacuation_time_seconds!);
  const avgEvacTime =
    evacTimes.length > 0
      ? Math.round((evacTimes.reduce((a, b) => a + b, 0) / evacTimes.length) * 10) / 10
      : null;

  const fullyPrepared = records.filter((r) => r.staff_readiness === "fully_prepared").length;
  const preparedRate =
    records.length > 0
      ? Math.round((fullyPrepared / records.length) * 1000) / 10
      : null;

  const unprepared = records.filter((r) => r.staff_readiness === "unprepared").length;

  const now = new Date();
  const drillOverdue = records.filter((r) => {
    if (!r.next_drill_date) return false;
    return new Date(r.next_drill_date) < now;
  }).length;

  const byType: Record<string, number> = {};
  for (const r of records) byType[r.drill_type] = (byType[r.drill_type] ?? 0) + 1;

  const byOutcome: Record<string, number> = {};
  for (const r of records) byOutcome[r.drill_outcome] = (byOutcome[r.drill_outcome] ?? 0) + 1;

  const byTime: Record<string, number> = {};
  for (const r of records) byTime[r.time_of_day] = (byTime[r.time_of_day] ?? 0) + 1;

  const byReadiness: Record<string, number> = {};
  for (const r of records) byReadiness[r.staff_readiness] = (byReadiness[r.staff_readiness] ?? 0) + 1;

  return {
    total_drills: records.length,
    fire_evacuation_count: fireEvac,
    lockdown_count: lockdown,
    missing_child_count: missingChild,
    successful_rate: successRate,
    failed_count: failed,
    cancelled_count: cancelled,
    all_children_accounted_rate: childrenRate,
    all_staff_participated_rate: staffRate,
    assembly_point_used_rate: assemblyRate,
    equipment_working_rate: equipRate,
    children_distressed_count: distressed,
    average_evacuation_time: avgEvacTime,
    fully_prepared_rate: preparedRate,
    unprepared_count: unprepared,
    drill_overdue_count: drillOverdue,
    by_drill_type: byType,
    by_drill_outcome: byOutcome,
    by_time_of_day: byTime,
    by_staff_readiness: byReadiness,
  };
}

export function identifyDrillAlerts(
  records: EmergencyDrillRecord[],
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

  // Children not accounted during drill
  for (const r of records) {
    if (!r.all_children_accounted && r.drill_outcome !== "cancelled") {
      alerts.push({
        type: "children_not_accounted",
        severity: "critical",
        message: `Children not all accounted for during ${r.drill_type.replace(/_/g, " ")} drill on ${r.drill_date} — review procedures immediately`,
        id: r.id,
      });
    }
  }

  // Failed drill
  for (const r of records) {
    if (r.drill_outcome === "failed") {
      alerts.push({
        type: "drill_failed",
        severity: "high",
        message: `${r.drill_type.replace(/_/g, " ")} drill failed on ${r.drill_date} — retrain staff and repeat drill`,
        id: r.id,
      });
    }
  }

  // Staff unprepared
  const unprepared = records.filter((r) => r.staff_readiness === "unprepared").length;
  if (unprepared >= 1) {
    alerts.push({
      type: "staff_unprepared",
      severity: "high",
      message: `${unprepared} ${unprepared === 1 ? "drill shows" : "drills show"} staff unprepared — arrange refresher training`,
      id: "staff_unprepared",
    });
  }

  // Equipment not working
  const equipFault = records.filter((r) => !r.equipment_working && r.drill_outcome !== "cancelled").length;
  if (equipFault >= 1) {
    alerts.push({
      type: "equipment_fault",
      severity: "high",
      message: `${equipFault} ${equipFault === 1 ? "drill" : "drills"} with equipment not working — repair or replace immediately`,
      id: "equipment_fault",
    });
  }

  // Drill overdue
  const now = new Date();
  const drillOverdue = records.filter((r) => {
    if (!r.next_drill_date) return false;
    return new Date(r.next_drill_date) < now;
  }).length;
  if (drillOverdue >= 1) {
    alerts.push({
      type: "drill_overdue",
      severity: "medium",
      message: `${drillOverdue} ${drillOverdue === 1 ? "drill is" : "drills are"} overdue — schedule promptly`,
      id: "drill_overdue",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    drillType?: DrillType;
    drillOutcome?: DrillOutcome;
    timeOfDay?: TimeOfDay;
    limit?: number;
  },
): Promise<ServiceResult<EmergencyDrillRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_emergency_drills") as SB).select("*").eq("home_id", homeId);
  if (filters?.drillType) q = q.eq("drill_type", filters.drillType);
  if (filters?.drillOutcome) q = q.eq("drill_outcome", filters.drillOutcome);
  if (filters?.timeOfDay) q = q.eq("time_of_day", filters.timeOfDay);
  q = q.order("drill_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  input: {
    homeId: string;
    drillType: DrillType;
    drillDate: string;
    drillOutcome: DrillOutcome;
    timeOfDay: TimeOfDay;
    staffReadiness: StaffReadiness;
    evacuationTimeSeconds?: number;
    allChildrenAccounted: boolean;
    allStaffParticipated: boolean;
    assemblyPointUsed: boolean;
    equipmentWorking: boolean;
    childrenInformedBeforehand: boolean;
    childrenDistressed: boolean;
    learningPoints: string[];
    actionsRequired: string[];
    staffPresent: number;
    childrenPresent: number;
    conductedBy: string;
    nextDrillDate?: string;
    notes?: string;
  },
): Promise<ServiceResult<EmergencyDrillRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_emergency_drills") as SB)
    .insert({
      home_id: input.homeId,
      drill_type: input.drillType,
      drill_date: input.drillDate,
      drill_outcome: input.drillOutcome,
      time_of_day: input.timeOfDay,
      staff_readiness: input.staffReadiness,
      evacuation_time_seconds: input.evacuationTimeSeconds ?? null,
      all_children_accounted: input.allChildrenAccounted,
      all_staff_participated: input.allStaffParticipated,
      assembly_point_used: input.assemblyPointUsed,
      equipment_working: input.equipmentWorking,
      children_informed_beforehand: input.childrenInformedBeforehand,
      children_distressed: input.childrenDistressed,
      learning_points: input.learningPoints,
      actions_required: input.actionsRequired,
      staff_present: input.staffPresent,
      children_present: input.childrenPresent,
      conducted_by: input.conductedBy,
      next_drill_date: input.nextDrillDate ?? null,
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
): Promise<ServiceResult<EmergencyDrillRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_emergency_drills") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeDrillMetrics,
  identifyDrillAlerts,
};
