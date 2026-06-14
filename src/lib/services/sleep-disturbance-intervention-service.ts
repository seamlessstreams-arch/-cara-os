// ══════════════════════════════════════════════════════════════════════════════
// CARA — SLEEP DISTURBANCE INTERVENTION SERVICE
// Night disturbance logging, intervention strategies, sleep hygiene plans,
// clinical referrals, trauma-linked sleep issues. Helps track patterns
// and improve sleep quality for children in residential care.
//
// CHR 2015 Reg 7  (protection of children — physical/emotional wellbeing
//                  including sleep)
// CHR 2015 Reg 10 (health and wellbeing — sleep as fundamental health need)
//
// SCCIF: Health — "Children's physical and emotional health needs are met."
// NICE guidelines on sleep in looked-after children.
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Enums ─────────────────────────────────────────────────────────────────

export const DISTURBANCE_TYPES = [
  "nightmares",
  "night_terrors",
  "sleep_walking",
  "insomnia",
  "hypervigilance",
  "bedtime_resistance",
  "early_waking",
  "restless_sleep",
  "trauma_flashback",
  "anxiety_related",
] as const;
export type DisturbanceType = (typeof DISTURBANCE_TYPES)[number];

export const INTERVENTION_TYPES = [
  "reassurance",
  "sleep_hygiene_plan",
  "therapeutic_support",
  "medication_review",
  "clinical_referral",
  "environmental_adjustment",
  "routine_modification",
  "sensory_support",
  "relaxation_techniques",
  "trauma_processing",
] as const;
export type InterventionType = (typeof INTERVENTION_TYPES)[number];

export const SEVERITY_LEVELS = [
  "mild",
  "moderate",
  "severe",
  "crisis",
] as const;
export type SeverityLevel = (typeof SEVERITY_LEVELS)[number];

export const OUTCOME_STATUSES = [
  "resolved_same_night",
  "improved",
  "ongoing",
  "escalated",
  "referral_made",
  "no_change",
] as const;
export type OutcomeStatus = (typeof OUTCOME_STATUSES)[number];

// ── Row interface ─────────────────────────────────────────────────────────

export interface SleepDisturbanceInterventionRow {
  id: string;
  home_id: string;
  child_name: string;
  child_id: string | null;
  incident_date: string;
  disturbance_type: DisturbanceType;
  intervention_type: InterventionType;
  severity_level: SeverityLevel;
  outcome_status: OutcomeStatus;
  child_settled_within_hour: boolean;
  sleep_plan_in_place: boolean;
  clinical_referral_made: boolean;
  trauma_link_identified: boolean;
  parent_carer_informed: boolean;
  pattern_identified: boolean;
  environment_adapted: boolean;
  staff_debriefed: boolean;
  staff_on_duty: string | null;
  duration_minutes: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeSleepDisturbanceMetrics(
  rows: SleepDisturbanceInterventionRow[],
): {
  total_incidents: number;
  severe_count: number;
  crisis_count: number;
  trauma_linked_count: number;
  ongoing_count: number;
  settled_within_hour_rate: number;
  sleep_plan_rate: number;
  clinical_referral_rate: number;
  pattern_identified_rate: number;
  environment_adapted_rate: number;
  staff_debriefed_rate: number;
  parent_informed_rate: number;
  trauma_link_rate: number;
  disturbance_type_breakdown: Record<string, number>;
  severity_breakdown: Record<string, number>;
  unique_children: number;
} {
  const severeCount = rows.filter((r) => r.severity_level === "severe").length;
  const crisisCount = rows.filter((r) => r.severity_level === "crisis").length;
  const traumaLinkedCount = rows.filter((r) => r.trauma_link_identified).length;
  const ongoingCount = rows.filter((r) => r.outcome_status === "ongoing").length;

  const boolRate = (field: keyof SleepDisturbanceInterventionRow) => {
    const count = rows.filter((r) => r[field] === true).length;
    return rows.length > 0
      ? Math.round((count / rows.length) * 1000) / 10
      : 0;
  };

  const uniqueChildren = new Set(rows.map((r) => r.child_name)).size;

  const disturbanceTypeBreakdown: Record<string, number> = {};
  for (const r of rows)
    disturbanceTypeBreakdown[r.disturbance_type] =
      (disturbanceTypeBreakdown[r.disturbance_type] ?? 0) + 1;

  const severityBreakdown: Record<string, number> = {};
  for (const r of rows)
    severityBreakdown[r.severity_level] =
      (severityBreakdown[r.severity_level] ?? 0) + 1;

  return {
    total_incidents: rows.length,
    severe_count: severeCount,
    crisis_count: crisisCount,
    trauma_linked_count: traumaLinkedCount,
    ongoing_count: ongoingCount,
    settled_within_hour_rate: boolRate("child_settled_within_hour"),
    sleep_plan_rate: boolRate("sleep_plan_in_place"),
    clinical_referral_rate: boolRate("clinical_referral_made"),
    pattern_identified_rate: boolRate("pattern_identified"),
    environment_adapted_rate: boolRate("environment_adapted"),
    staff_debriefed_rate: boolRate("staff_debriefed"),
    parent_informed_rate: boolRate("parent_carer_informed"),
    trauma_link_rate: boolRate("trauma_link_identified"),
    disturbance_type_breakdown: disturbanceTypeBreakdown,
    severity_breakdown: severityBreakdown,
    unique_children: uniqueChildren,
  };
}

export function computeSleepDisturbanceAlerts(
  rows: SleepDisturbanceInterventionRow[],
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

  // Critical: crisis severity without clinical referral
  for (const r of rows) {
    if (r.severity_level === "crisis" && !r.clinical_referral_made) {
      alerts.push({
        type: "crisis_no_clinical_referral",
        severity: "critical",
        message: `${r.child_name} experienced a crisis-level sleep disturbance without clinical referral — urgent review required`,
        record_id: r.id,
      });
    }
  }

  // High: severe disturbance with no sleep plan in place
  for (const r of rows) {
    if (r.severity_level === "severe" && !r.sleep_plan_in_place) {
      alerts.push({
        type: "severe_no_sleep_plan",
        severity: "high",
        message: `${r.child_name} has severe sleep disturbance with no sleep plan in place — develop individualised sleep hygiene plan`,
        record_id: r.id,
      });
    }
  }

  // High: trauma link identified but no therapeutic support intervention
  for (const r of rows) {
    if (
      r.trauma_link_identified &&
      r.intervention_type !== "therapeutic_support"
    ) {
      alerts.push({
        type: "trauma_link_no_therapeutic_support",
        severity: "high",
        message: `${r.child_name} has trauma-linked sleep disturbance without therapeutic support intervention — consider trauma-informed therapeutic referral`,
        record_id: r.id,
      });
    }
  }

  // Medium: pattern identified but environment not adapted
  for (const r of rows) {
    if (r.pattern_identified && !r.environment_adapted) {
      alerts.push({
        type: "pattern_no_environment_adaptation",
        severity: "medium",
        message: `${r.child_name} has an identified sleep disturbance pattern but environment has not been adapted — review environmental adjustments`,
        record_id: r.id,
      });
    }
  }

  // Medium: 3+ incidents for same child in data set
  const childCounts: Record<string, string[]> = {};
  for (const r of rows) {
    if (!childCounts[r.child_name]) childCounts[r.child_name] = [];
    childCounts[r.child_name].push(r.id);
  }
  for (const [childName, ids] of Object.entries(childCounts)) {
    if (ids.length >= 3) {
      alerts.push({
        type: "repeat_incidents",
        severity: "medium",
        message: `${childName} has ${ids.length} sleep disturbance incidents recorded — review for recurring patterns and consider multi-agency involvement`,
      });
    }
  }

  return alerts;
}

export function generateSleepDisturbanceCaraInsights(
  rows: SleepDisturbanceInterventionRow[],
): string[] {
  const metrics = computeSleepDisturbanceMetrics(rows);
  const alerts = computeSleepDisturbanceAlerts(rows);
  const insights: string[] = [];

  // Insight 1: Summary stats (indigo-themed)
  insights.push(
    `[indigo] ${metrics.total_incidents} sleep disturbance incidents recorded across ${metrics.unique_children} ${metrics.unique_children === 1 ? "child" : "children"}. ` +
      `${metrics.severe_count} severe and ${metrics.crisis_count} crisis-level incidents. ` +
      `${metrics.trauma_linked_count} trauma-linked. ` +
      `Settled within hour rate: ${metrics.settled_within_hour_rate}%.`,
  );

  // Insight 2: Priority concerns (amber-themed)
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");
  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority alerts identified. ` +
        `Sleep plan rate: ${metrics.sleep_plan_rate}%. ` +
        `Clinical referral rate: ${metrics.clinical_referral_rate}%. ` +
        `Staff debriefed rate: ${metrics.staff_debriefed_rate}%.`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority alerts currently active. ` +
        `Sleep plan rate: ${metrics.sleep_plan_rate}%. ` +
        `Clinical referral rate: ${metrics.clinical_referral_rate}%. ` +
        `Continue monitoring sleep patterns and maintaining hygiene plans.`,
    );
  }

  // Insight 3: Reflective question
  if (metrics.trauma_linked_count > 0) {
    insights.push(
      `[reflect] ${metrics.trauma_linked_count} ${metrics.trauma_linked_count === 1 ? "incident has" : "incidents have"} an identified trauma link. ` +
        `Are therapeutic interventions and trauma-informed care approaches being consistently applied ` +
        `to support these children's sleep, and is the team accessing clinical supervision around trauma-related sleep disruption?`,
    );
  } else if (metrics.ongoing_count > 0) {
    insights.push(
      `[reflect] ${metrics.ongoing_count} ${metrics.ongoing_count === 1 ? "incident remains" : "incidents remain"} ongoing. ` +
        `What additional strategies could be explored to resolve persistent sleep disturbances, ` +
        `and are children's own views being sought about what helps them feel safe and settled at night?`,
    );
  } else {
    insights.push(
      `[reflect] No trauma-linked or ongoing sleep disturbances currently recorded. ` +
        `How can the home continue to promote good sleep hygiene, maintain consistent bedtime routines, ` +
        `and ensure every child's sleep environment is personalised to their needs and preferences?`,
    );
  }

  return insights;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listSleepDisturbanceInterventions(
  homeId: string,
): Promise<ServiceResult<SleepDisturbanceInterventionRow[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_sleep_disturbance_interventions") as SB)
    .select("*")
    .eq("home_id", homeId);
  q = q.order("incident_date", { ascending: false }).limit(200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createSleepDisturbanceIntervention(input: {
  homeId: string;
  childName: string;
  childId?: string | null;
  incidentDate: string;
  disturbanceType: DisturbanceType;
  interventionType: InterventionType;
  severityLevel: SeverityLevel;
  outcomeStatus: OutcomeStatus;
  childSettledWithinHour?: boolean;
  sleepPlanInPlace?: boolean;
  clinicalReferralMade?: boolean;
  traumaLinkIdentified?: boolean;
  parentCarerInformed?: boolean;
  patternIdentified?: boolean;
  environmentAdapted?: boolean;
  staffDebriefed?: boolean;
  staffOnDuty?: string | null;
  durationMinutes?: number | null;
  notes?: string | null;
}): Promise<ServiceResult<SleepDisturbanceInterventionRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_sleep_disturbance_interventions") as SB)
    .insert({
      home_id: input.homeId,
      child_name: input.childName,
      child_id: input.childId ?? null,
      incident_date: input.incidentDate,
      disturbance_type: input.disturbanceType,
      intervention_type: input.interventionType,
      severity_level: input.severityLevel,
      outcome_status: input.outcomeStatus,
      child_settled_within_hour: input.childSettledWithinHour ?? false,
      sleep_plan_in_place: input.sleepPlanInPlace ?? false,
      clinical_referral_made: input.clinicalReferralMade ?? false,
      trauma_link_identified: input.traumaLinkIdentified ?? false,
      parent_carer_informed: input.parentCarerInformed ?? true,
      pattern_identified: input.patternIdentified ?? false,
      environment_adapted: input.environmentAdapted ?? false,
      staff_debriefed: input.staffDebriefed ?? false,
      staff_on_duty: input.staffOnDuty ?? null,
      duration_minutes: input.durationMinutes ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeSleepDisturbanceMetrics,
  computeSleepDisturbanceAlerts,
  generateSleepDisturbanceCaraInsights,
};
