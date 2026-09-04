// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF WELLBEING SERVICE
// Manages staff mental health, wellbeing checks, stress levels,
// workload monitoring, debriefing records, and support access.
// CHR 2015 Reg 33 (employment of staff — support and welfare),
// Reg 34 (employment policies), Health and Safety at Work Act 1974.
//
// Tracks staff wellbeing assessments, debriefing after critical incidents,
// burnout indicators, access to EAP/counselling, and ensures staff are
// supported to deliver high-quality care.
//
// SCCIF: Well-Led — "Staff are well supported, feel valued, and are able
// to fulfil their roles effectively." "Staff wellbeing is prioritised."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type WellbeingRating =
  | "excellent"
  | "good"
  | "fair"
  | "struggling"
  | "crisis";

export type StressLevel =
  | "very_low"
  | "low"
  | "moderate"
  | "high"
  | "very_high";

export type SupportType =
  | "supervision"
  | "debrief"
  | "eap_referral"
  | "counselling"
  | "peer_support"
  | "occupational_health"
  | "time_off"
  | "workload_adjustment"
  | "training"
  | "other";

export type DebriefTrigger =
  | "critical_incident"
  | "restraint"
  | "safeguarding"
  | "bereavement"
  | "violence_aggression"
  | "missing_child"
  | "self_harm"
  | "complaint"
  | "other";

export interface WellbeingCheck {
  id: string;
  home_id: string;
  staff_member: string;
  check_date: string;
  checked_by: string;
  wellbeing_rating: WellbeingRating;
  stress_level: StressLevel;
  workload_manageable: boolean | null; // null = not recorded; judgements are tri-state — credit needs === true, breach needs === false
  sleep_quality: "good" | "fair" | "poor";
  feeling_supported: boolean | null;
  concerns: string | null;
  support_offered: SupportType[];
  support_accepted: boolean;
  follow_up_date: string | null;
  follow_up_completed: boolean;
  notes: string | null;
  created_at: string;
}

export interface DebriefRecord {
  id: string;
  home_id: string;
  debrief_date: string;
  staff_members: string[];
  facilitated_by: string;
  trigger: DebriefTrigger;
  incident_date: string;
  incident_summary: string;
  emotional_impact: string | null;
  lessons_learned: string | null;
  support_needs_identified: string | null;
  actions_agreed: string[];
  follow_up_required: boolean;
  follow_up_date: string | null;
  follow_up_completed: boolean;
  notes: string | null;
  created_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const WELLBEING_RATINGS: { rating: WellbeingRating; label: string }[] = [
  { rating: "excellent", label: "Excellent" },
  { rating: "good", label: "Good" },
  { rating: "fair", label: "Fair" },
  { rating: "struggling", label: "Struggling" },
  { rating: "crisis", label: "Crisis" },
];

export const STRESS_LEVELS: { level: StressLevel; label: string }[] = [
  { level: "very_low", label: "Very Low" },
  { level: "low", label: "Low" },
  { level: "moderate", label: "Moderate" },
  { level: "high", label: "High" },
  { level: "very_high", label: "Very High" },
];

export const SUPPORT_TYPES: { type: SupportType; label: string }[] = [
  { type: "supervision", label: "Supervision" },
  { type: "debrief", label: "Debrief" },
  { type: "eap_referral", label: "EAP Referral" },
  { type: "counselling", label: "Counselling" },
  { type: "peer_support", label: "Peer Support" },
  { type: "occupational_health", label: "Occupational Health" },
  { type: "time_off", label: "Time Off" },
  { type: "workload_adjustment", label: "Workload Adjustment" },
  { type: "training", label: "Training" },
  { type: "other", label: "Other" },
];

export const DEBRIEF_TRIGGERS: { trigger: DebriefTrigger; label: string }[] = [
  { trigger: "critical_incident", label: "Critical Incident" },
  { trigger: "restraint", label: "Restraint" },
  { trigger: "safeguarding", label: "Safeguarding" },
  { trigger: "bereavement", label: "Bereavement" },
  { trigger: "violence_aggression", label: "Violence/Aggression" },
  { trigger: "missing_child", label: "Missing Child" },
  { trigger: "self_harm", label: "Self-Harm" },
  { trigger: "complaint", label: "Complaint" },
  { trigger: "other", label: "Other" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

/**
 * Compute staff wellbeing metrics.
 */
export function computeWellbeingMetrics(
  checks: WellbeingCheck[],
  debriefs: DebriefRecord[],
  _totalStaff: number,
  now: Date = new Date(),
): {
  staff_checked: number;
  checks_this_quarter: number;
  avg_wellbeing_score: number | null;
  avg_stress_score: number | null;
  staff_struggling_or_crisis: number;
  high_stress_count: number;
  workload_manageable_rate: number | null;
  feeling_supported_rate: number | null;
  support_acceptance_rate: number | null;
  debriefs_this_quarter: number;
  by_wellbeing_rating: Record<string, number>;
  by_stress_level: Record<string, number>;
  overdue_follow_ups: number;
} {
  const quarterAgo = new Date(now.getTime() - 90 * 86400000);

  const staffChecked = new Set(checks.map((c) => c.staff_member)).size;

  const checksThisQuarter = checks.filter(
    (c) => new Date(c.check_date) >= quarterAgo,
  ).length;

  // Wellbeing score (excellent=5, good=4, fair=3, struggling=2, crisis=1)
  const wellbeingScores: Record<string, number> = {
    excellent: 5, good: 4, fair: 3, struggling: 2, crisis: 1,
  };
  let totalWellbeing = 0;
  let wellbeingCount = 0;
  let strugglingOrCrisis = 0;
  const byWellbeingRating: Record<string, number> = {};

  for (const c of checks) {
    byWellbeingRating[c.wellbeing_rating] =
      (byWellbeingRating[c.wellbeing_rating] ?? 0) + 1;
    if (wellbeingScores[c.wellbeing_rating] != null) {
      totalWellbeing += wellbeingScores[c.wellbeing_rating];
      wellbeingCount++;
    }
    if (c.wellbeing_rating === "struggling" || c.wellbeing_rating === "crisis") {
      strugglingOrCrisis++;
    }
  }
  const avgWellbeingScore =
    wellbeingCount > 0
      ? Math.round((totalWellbeing / wellbeingCount) * 10) / 10
      : null;

  // Stress score (very_low=1, low=2, moderate=3, high=4, very_high=5)
  const stressScores: Record<string, number> = {
    very_low: 1, low: 2, moderate: 3, high: 4, very_high: 5,
  };
  let totalStress = 0;
  let stressCount = 0;
  let highStressCount = 0;
  const byStressLevel: Record<string, number> = {};

  for (const c of checks) {
    byStressLevel[c.stress_level] = (byStressLevel[c.stress_level] ?? 0) + 1;
    if (stressScores[c.stress_level] != null) {
      totalStress += stressScores[c.stress_level];
      stressCount++;
    }
    if (c.stress_level === "high" || c.stress_level === "very_high") {
      highStressCount++;
    }
  }
  const avgStressScore =
    stressCount > 0
      ? Math.round((totalStress / stressCount) * 10) / 10
      : null;

  // Manageable workload
  let manageableCount = 0;
  let supportedCount = 0;
  let supportOffered = 0;
  let supportAccepted = 0;

  for (const c of checks) {
    if (c.workload_manageable) manageableCount++;
    if (c.feeling_supported) supportedCount++;
    if (c.support_offered.length > 0) {
      supportOffered++;
      if (c.support_accepted) supportAccepted++;
    }
  }

  const workloadManageableRate =
    checks.length > 0
      ? Math.round((manageableCount / checks.length) * 1000) / 10
      : null;

  const feelingSupportedRate =
    checks.length > 0
      ? Math.round((supportedCount / checks.length) * 1000) / 10
      : null;

  const supportAcceptanceRate =
    supportOffered > 0
      ? Math.round((supportAccepted / supportOffered) * 1000) / 10
      : null;

  // Debriefs
  const debriefsThisQuarter = debriefs.filter(
    (d) => new Date(d.debrief_date) >= quarterAgo,
  ).length;

  // Overdue follow-ups
  let overdueFollowUps = 0;
  for (const c of checks) {
    if (c.follow_up_date && !c.follow_up_completed && new Date(c.follow_up_date) < now) {
      overdueFollowUps++;
    }
  }
  for (const d of debriefs) {
    if (d.follow_up_required && d.follow_up_date && !d.follow_up_completed && new Date(d.follow_up_date) < now) {
      overdueFollowUps++;
    }
  }

  return {
    staff_checked: staffChecked,
    checks_this_quarter: checksThisQuarter,
    avg_wellbeing_score: avgWellbeingScore,
    avg_stress_score: avgStressScore,
    staff_struggling_or_crisis: strugglingOrCrisis,
    high_stress_count: highStressCount,
    workload_manageable_rate: workloadManageableRate,
    feeling_supported_rate: feelingSupportedRate,
    support_acceptance_rate: supportAcceptanceRate,
    debriefs_this_quarter: debriefsThisQuarter,
    by_wellbeing_rating: byWellbeingRating,
    by_stress_level: byStressLevel,
    overdue_follow_ups: overdueFollowUps,
  };
}

/**
 * Identify staff wellbeing alerts.
 */
export function identifyWellbeingAlerts(
  checks: WellbeingCheck[],
  debriefs: DebriefRecord[],
  totalStaff: number,
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

  for (const c of checks) {
    // Crisis
    if (c.wellbeing_rating === "crisis") {
      alerts.push({
        type: "staff_crisis",
        severity: "critical",
        message: `${c.staff_member} reported being in crisis on ${c.check_date} — immediate support required`,
        id: c.id,
      });
    }

    // Struggling
    if (c.wellbeing_rating === "struggling") {
      alerts.push({
        type: "staff_struggling",
        severity: "high",
        message: `${c.staff_member} reported struggling on ${c.check_date} — ensure support is in place`,
        id: c.id,
      });
    }

    // Very high stress
    if (c.stress_level === "very_high") {
      alerts.push({
        type: "very_high_stress",
        severity: "high",
        message: `${c.staff_member} reported very high stress on ${c.check_date} — review workload and support`,
        id: c.id,
      });
    }

    // Support declined
    if (c.support_offered.length > 0 && !c.support_accepted) {
      alerts.push({
        type: "support_declined",
        severity: "medium",
        message: `${c.staff_member} declined offered support on ${c.check_date} — check in again sensitively`,
        id: c.id,
      });
    }

    // Follow-up overdue
    if (c.follow_up_date && !c.follow_up_completed && new Date(c.follow_up_date) < now) {
      alerts.push({
        type: "follow_up_overdue",
        severity: "medium",
        message: `Wellbeing follow-up for ${c.staff_member} is overdue — was due ${c.follow_up_date}`,
        id: c.id,
      });
    }
  }

  // Debrief follow-ups overdue
  for (const d of debriefs) {
    if (d.follow_up_required && d.follow_up_date && !d.follow_up_completed && new Date(d.follow_up_date) < now) {
      alerts.push({
        type: "debrief_follow_up_overdue",
        severity: "high",
        message: `Debrief follow-up from ${d.debrief_date} (${d.trigger.replace(/_/g, " ")}) is overdue — ${d.staff_members.length} staff affected`,
        id: d.id,
      });
    }
  }

  // Staff not checked
  const checkedStaff = new Set(checks.map((c) => c.staff_member));
  if (totalStaff > 0 && checkedStaff.size < totalStaff) {
    const unchecked = totalStaff - checkedStaff.size;
    alerts.push({
      type: "staff_not_checked",
      severity: "medium",
      message: `${unchecked} staff member(s) have not had a wellbeing check — ensure all staff are regularly checked`,
      id: checks.length > 0 ? checks[0].id : "system",
    });
  }

  return alerts;
}

// ── CRUD — Wellbeing Checks ─────────────────────────────────────────────

export async function listChecks(
  homeId: string,
  filters?: {
    staffMember?: string;
    wellbeingRating?: WellbeingRating;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
  },
): Promise<ServiceResult<WellbeingCheck[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_wellbeing_checks") as SB).select("*").eq("home_id", homeId);
  if (filters?.staffMember) q = q.eq("staff_member", filters.staffMember);
  if (filters?.wellbeingRating) q = q.eq("wellbeing_rating", filters.wellbeingRating);
  if (filters?.dateFrom) q = q.gte("check_date", filters.dateFrom);
  if (filters?.dateTo) q = q.lte("check_date", filters.dateTo);
  q = q.order("check_date", { ascending: false }).limit(filters?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createCheck(
  input: {
    homeId: string;
    staffMember: string;
    checkDate: string;
    checkedBy: string;
    wellbeingRating: WellbeingRating;
    stressLevel: StressLevel;
    workloadManageable?: boolean;
    sleepQuality?: "good" | "fair" | "poor";
    feelingSupported?: boolean;
    concerns?: string;
    supportOffered?: SupportType[];
    supportAccepted?: boolean;
    followUpDate?: string;
    notes?: string;
  },
): Promise<ServiceResult<WellbeingCheck>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_wellbeing_checks") as SB)
    .insert({
      home_id: input.homeId,
      staff_member: input.staffMember,
      check_date: input.checkDate,
      checked_by: input.checkedBy,
      wellbeing_rating: input.wellbeingRating,
      stress_level: input.stressLevel,
      workload_manageable: input.workloadManageable ?? null,
      sleep_quality: input.sleepQuality ?? "good",
      feeling_supported: input.feelingSupported ?? null,
      concerns: input.concerns ?? null,
      support_offered: input.supportOffered ?? [],
      support_accepted: input.supportAccepted ?? false,
      follow_up_date: input.followUpDate ?? null,
      follow_up_completed: false,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── CRUD — Debrief Records ──────────────────────────────────────────────

export async function listDebriefs(
  homeId: string,
  filters?: {
    trigger?: DebriefTrigger;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
  },
): Promise<ServiceResult<DebriefRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_debrief_records") as SB).select("*").eq("home_id", homeId);
  if (filters?.trigger) q = q.eq("trigger", filters.trigger);
  if (filters?.dateFrom) q = q.gte("debrief_date", filters.dateFrom);
  if (filters?.dateTo) q = q.lte("debrief_date", filters.dateTo);
  q = q.order("debrief_date", { ascending: false }).limit(filters?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createDebrief(
  input: {
    homeId: string;
    debriefDate: string;
    staffMembers: string[];
    facilitatedBy: string;
    trigger: DebriefTrigger;
    incidentDate: string;
    incidentSummary: string;
    emotionalImpact?: string;
    lessonsLearned?: string;
    supportNeedsIdentified?: string;
    actionsAgreed?: string[];
    followUpRequired?: boolean;
    followUpDate?: string;
    notes?: string;
  },
): Promise<ServiceResult<DebriefRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_debrief_records") as SB)
    .insert({
      home_id: input.homeId,
      debrief_date: input.debriefDate,
      staff_members: input.staffMembers,
      facilitated_by: input.facilitatedBy,
      trigger: input.trigger,
      incident_date: input.incidentDate,
      incident_summary: input.incidentSummary,
      emotional_impact: input.emotionalImpact ?? null,
      lessons_learned: input.lessonsLearned ?? null,
      support_needs_identified: input.supportNeedsIdentified ?? null,
      actions_agreed: input.actionsAgreed ?? [],
      follow_up_required: input.followUpRequired ?? false,
      follow_up_date: input.followUpDate ?? null,
      follow_up_completed: false,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeWellbeingMetrics,
  identifyWellbeingAlerts,
};
