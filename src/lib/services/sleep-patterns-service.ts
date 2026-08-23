// ══════════════════════════════════════════════════════════════════════════════
// CARA — SLEEP & WAKING NIGHT SERVICE
// Manages children's sleep patterns, waking night checks, sleep concerns,
// night-time incidents, and sleep support plans.
// CHR 2015 Reg 6 (quality of care — rest and sleep),
// Reg 9 (promoting good health — sleep as health factor),
// Reg 10 (dignity — respecting bedtime routines and privacy).
//
// Tracks nightly checks, sleep quality, disturbances, night-time incidents,
// and ensures children get adequate rest in a safe and supportive
// night-time environment.
//
// SCCIF: Children's Experiences — "Children are well rested and have
// bedtime routines that meet their individual needs." "Night-time
// arrangements are safe and appropriate."
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

export type DisturbanceType =
  | "nightmare"
  | "night_terror"
  | "sleepwalking"
  | "bedwetting"
  | "anxiety"
  | "noise"
  | "illness"
  | "pain"
  | "medication_related"
  | "emotional_distress"
  | "other";

export type CheckOutcome =
  | "sleeping"
  | "awake_settled"
  | "awake_unsettled"
  | "not_in_room"
  | "required_support";

export type SleepConcernSeverity =
  | "low"
  | "medium"
  | "high"
  | "critical";

export interface NightCheck {
  id: string;
  home_id: string;
  check_date: string;
  check_time: string;
  checked_by: string;
  child_checks: {
    child_id: string;
    child_name: string;
    outcome: CheckOutcome;
    notes: string;
  }[];
  environment_ok: boolean;
  security_checked: boolean;
  temperature_ok: boolean;
  notes: string | null;
  created_at: string;
}

export interface SleepRecord {
  id: string;
  home_id: string;
  child_id: string;
  child_name: string;
  record_date: string;
  bedtime: string;
  settled_time: string | null;
  wake_time: string | null;
  sleep_quality: SleepQuality;
  disturbances: {
    time: string;
    type: DisturbanceType;
    duration_minutes: number;
    intervention: string;
    resolved: boolean;
  }[];
  total_sleep_hours: number | null;
  sleep_concern_flagged: boolean;
  concern_severity: SleepConcernSeverity | null;
  concern_details: string | null;
  support_provided: string | null;
  notes: string | null;
  recorded_by: string;
  created_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const SLEEP_QUALITIES: { quality: SleepQuality; label: string }[] = [
  { quality: "excellent", label: "Excellent" },
  { quality: "good", label: "Good" },
  { quality: "fair", label: "Fair" },
  { quality: "poor", label: "Poor" },
  { quality: "very_poor", label: "Very Poor" },
];

export const DISTURBANCE_TYPES: { type: DisturbanceType; label: string }[] = [
  { type: "nightmare", label: "Nightmare" },
  { type: "night_terror", label: "Night Terror" },
  { type: "sleepwalking", label: "Sleepwalking" },
  { type: "bedwetting", label: "Bedwetting" },
  { type: "anxiety", label: "Anxiety" },
  { type: "noise", label: "Noise" },
  { type: "illness", label: "Illness" },
  { type: "pain", label: "Pain" },
  { type: "medication_related", label: "Medication Related" },
  { type: "emotional_distress", label: "Emotional Distress" },
  { type: "other", label: "Other" },
];

export const CHECK_OUTCOMES: { outcome: CheckOutcome; label: string }[] = [
  { outcome: "sleeping", label: "Sleeping" },
  { outcome: "awake_settled", label: "Awake — Settled" },
  { outcome: "awake_unsettled", label: "Awake — Unsettled" },
  { outcome: "not_in_room", label: "Not in Room" },
  { outcome: "required_support", label: "Required Support" },
];

export const CONCERN_SEVERITIES: { severity: SleepConcernSeverity; label: string }[] = [
  { severity: "low", label: "Low" },
  { severity: "medium", label: "Medium" },
  { severity: "high", label: "High" },
  { severity: "critical", label: "Critical" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

/**
 * Compute sleep and waking night metrics.
 */
export function computeSleepMetrics(
  checks: NightCheck[],
  records: SleepRecord[],
  _totalChildren: number,
): {
  total_night_checks: number;
  checks_this_week: number;
  avg_checks_per_night: number | null;
  environment_compliance_rate: number | null;
  avg_sleep_quality_score: number | null;
  children_with_concerns: number;
  total_disturbances_this_week: number;
  by_sleep_quality: Record<string, number>;
  by_disturbance_type: Record<string, number>;
  avg_sleep_hours: number | null;
  poor_sleep_rate: number | null;
} {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86400000);

  // Night checks
  const checksThisWeek = checks.filter(
    (c) => new Date(c.check_date) >= weekAgo,
  ).length;

  // Unique nights this week
  const nightsThisWeek = new Set(
    checks
      .filter((c) => new Date(c.check_date) >= weekAgo)
      .map((c) => c.check_date),
  ).size;

  const avgChecksPerNight =
    nightsThisWeek > 0
      ? Math.round((checksThisWeek / nightsThisWeek) * 10) / 10
      : null;

  // Environment compliance
  let envOk = 0;
  for (const c of checks) {
    if (c.environment_ok && c.security_checked && c.temperature_ok) envOk++;
  }
  const envComplianceRate =
    checks.length > 0
      ? Math.round((envOk / checks.length) * 1000) / 10
      : null;

  // Sleep quality score (excellent=5, good=4, fair=3, poor=2, very_poor=1)
  const qualityScores: Record<string, number> = {
    excellent: 5,
    good: 4,
    fair: 3,
    poor: 2,
    very_poor: 1,
  };
  let totalQuality = 0;
  let qualityCount = 0;
  const bySleepQuality: Record<string, number> = {};
  let poorSleepCount = 0;

  for (const r of records) {
    bySleepQuality[r.sleep_quality] = (bySleepQuality[r.sleep_quality] ?? 0) + 1;
    if (qualityScores[r.sleep_quality] != null) {
      totalQuality += qualityScores[r.sleep_quality];
      qualityCount++;
    }
    if (r.sleep_quality === "poor" || r.sleep_quality === "very_poor") {
      poorSleepCount++;
    }
  }
  const avgSleepQualityScore =
    qualityCount > 0
      ? Math.round((totalQuality / qualityCount) * 10) / 10
      : null;

  const poorSleepRate =
    records.length > 0
      ? Math.round((poorSleepCount / records.length) * 1000) / 10
      : null;

  // Children with concerns
  const childrenWithConcerns = new Set(
    records.filter((r) => r.sleep_concern_flagged).map((r) => r.child_id),
  ).size;

  // Disturbances this week
  let disturbancesThisWeek = 0;
  const byDisturbanceType: Record<string, number> = {};
  for (const r of records) {
    for (const d of r.disturbances) {
      byDisturbanceType[d.type] = (byDisturbanceType[d.type] ?? 0) + 1;
      if (new Date(r.record_date) >= weekAgo) {
        disturbancesThisWeek++;
      }
    }
  }

  // Average sleep hours
  let totalHours = 0;
  let hoursCount = 0;
  for (const r of records) {
    if (r.total_sleep_hours != null) {
      totalHours += r.total_sleep_hours;
      hoursCount++;
    }
  }
  const avgSleepHours =
    hoursCount > 0
      ? Math.round((totalHours / hoursCount) * 10) / 10
      : null;

  return {
    total_night_checks: checks.length,
    checks_this_week: checksThisWeek,
    avg_checks_per_night: avgChecksPerNight,
    environment_compliance_rate: envComplianceRate,
    avg_sleep_quality_score: avgSleepQualityScore,
    children_with_concerns: childrenWithConcerns,
    total_disturbances_this_week: disturbancesThisWeek,
    by_sleep_quality: bySleepQuality,
    by_disturbance_type: byDisturbanceType,
    avg_sleep_hours: avgSleepHours,
    poor_sleep_rate: poorSleepRate,
  };
}

/**
 * Identify sleep and waking night alerts.
 */
export function identifySleepAlerts(
  checks: NightCheck[],
  records: SleepRecord[],
  _totalChildren: number,
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

  // ── Night check alerts ──────────────────────────────────────────────

  // No checks last night
  const yesterday = new Date(now.getTime() - 86400000);
  const yesterdayStr = yesterday.toISOString().split("T")[0];
  const lastNightChecks = checks.filter((c) => c.check_date === yesterdayStr);
  if (checks.length > 0 && lastNightChecks.length === 0) {
    alerts.push({
      type: "no_checks_last_night",
      severity: "high",
      message: "No waking night checks recorded for last night — ensure checks are completed and logged",
      id: checks[0].id,
    });
  }

  // Environment issues
  for (const c of checks) {
    if (!c.environment_ok || !c.security_checked || !c.temperature_ok) {
      const issues: string[] = [];
      if (!c.environment_ok) issues.push("environment");
      if (!c.security_checked) issues.push("security");
      if (!c.temperature_ok) issues.push("temperature");
      alerts.push({
        type: "environment_issue",
        severity: "medium",
        message: `Night check on ${c.check_date} at ${c.check_time}: ${issues.join(", ")} issues identified`,
        id: c.id,
      });
    }

    // Child not in room
    for (const cc of c.child_checks) {
      if (cc.outcome === "not_in_room") {
        alerts.push({
          type: "child_not_in_room",
          severity: "critical",
          message: `${cc.child_name} was not in their room during night check on ${c.check_date} at ${c.check_time}`,
          id: c.id,
        });
      }
    }
  }

  // ── Sleep record alerts ─────────────────────────────────────────────

  // Persistent poor sleep (3+ poor/very_poor in last 7 days per child)
  const recentRecords = records.filter(
    (r) => new Date(r.record_date) >= new Date(now.getTime() - 7 * 86400000),
  );
  const childPoorSleep = new Map<string, number>();
  for (const r of recentRecords) {
    if (r.sleep_quality === "poor" || r.sleep_quality === "very_poor") {
      childPoorSleep.set(r.child_name, (childPoorSleep.get(r.child_name) ?? 0) + 1);
    }
  }
  for (const [childName, count] of childPoorSleep) {
    if (count >= 3) {
      alerts.push({
        type: "persistent_poor_sleep",
        severity: "high",
        message: `${childName} has had ${count} nights of poor sleep in the last week — consider referral to health professional`,
        id: recentRecords[0]?.id ?? "system",
      });
    }
  }

  // High-severity concerns
  for (const r of records) {
    if (r.sleep_concern_flagged && (r.concern_severity === "high" || r.concern_severity === "critical")) {
      alerts.push({
        type: "sleep_concern",
        severity: r.concern_severity === "critical" ? "critical" : "high",
        message: `${r.child_name} has a ${r.concern_severity} sleep concern flagged on ${r.record_date}: ${r.concern_details ?? "no details"}`,
        id: r.id,
      });
    }
  }

  return alerts;
}

// ── CRUD — Night Checks ─────────────────────────────────────────────────

export async function listChecks(
  homeId: string,
  filters?: {
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
  },
): Promise<ServiceResult<NightCheck[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_night_checks") as SB).select("*").eq("home_id", homeId);
  if (filters?.dateFrom) q = q.gte("check_date", filters.dateFrom);
  if (filters?.dateTo) q = q.lte("check_date", filters.dateTo);
  q = q.order("check_date", { ascending: false }).order("check_time", { ascending: false }).limit(filters?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createCheck(
  input: {
    homeId: string;
    checkDate: string;
    checkTime: string;
    checkedBy: string;
    childChecks?: NightCheck["child_checks"];
    environmentOk?: boolean;
    securityChecked?: boolean;
    temperatureOk?: boolean;
    notes?: string;
  },
): Promise<ServiceResult<NightCheck>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_night_checks") as SB)
    .insert({
      home_id: input.homeId,
      check_date: input.checkDate,
      check_time: input.checkTime,
      checked_by: input.checkedBy,
      child_checks: input.childChecks ?? [],
      environment_ok: input.environmentOk ?? true,
      security_checked: input.securityChecked ?? true,
      temperature_ok: input.temperatureOk ?? true,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── CRUD — Sleep Records ────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    childId?: string;
    sleepQuality?: SleepQuality;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
  },
): Promise<ServiceResult<SleepRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_sleep_records") as SB).select("*").eq("home_id", homeId);
  if (filters?.childId) q = q.eq("child_id", filters.childId);
  if (filters?.sleepQuality) q = q.eq("sleep_quality", filters.sleepQuality);
  if (filters?.dateFrom) q = q.gte("record_date", filters.dateFrom);
  if (filters?.dateTo) q = q.lte("record_date", filters.dateTo);
  q = q.order("record_date", { ascending: false }).limit(filters?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  input: {
    homeId: string;
    childId: string;
    childName: string;
    recordDate: string;
    bedtime: string;
    settledTime?: string;
    wakeTime?: string;
    sleepQuality: SleepQuality;
    disturbances?: SleepRecord["disturbances"];
    totalSleepHours?: number;
    sleepConcernFlagged?: boolean;
    concernSeverity?: SleepConcernSeverity;
    concernDetails?: string;
    supportProvided?: string;
    notes?: string;
    recordedBy: string;
  },
): Promise<ServiceResult<SleepRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_sleep_records") as SB)
    .insert({
      home_id: input.homeId,
      child_id: input.childId,
      child_name: input.childName,
      record_date: input.recordDate,
      bedtime: input.bedtime,
      settled_time: input.settledTime ?? null,
      wake_time: input.wakeTime ?? null,
      sleep_quality: input.sleepQuality,
      disturbances: input.disturbances ?? [],
      total_sleep_hours: input.totalSleepHours ?? null,
      sleep_concern_flagged: input.sleepConcernFlagged ?? false,
      concern_severity: input.concernSeverity ?? null,
      concern_details: input.concernDetails ?? null,
      support_provided: input.supportProvided ?? null,
      notes: input.notes ?? null,
      recorded_by: input.recordedBy,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeSleepMetrics,
  identifySleepAlerts,
};
