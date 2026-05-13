// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — ANTI-BULLYING SERVICE
// Manages bullying incident recording, anti-bullying strategies,
// peer relationship monitoring, and intervention tracking.
// CHR 2015 Reg 12 (safeguarding — protection from bullying),
// Reg 34 (staff — awareness of bullying dynamics),
// Reg 7 (children's views — reporting bullying).
//
// Tracks bullying incidents, types, interventions, outcomes,
// and ensures children feel safe and supported.
//
// SCCIF: Safety — "Children are protected from bullying."
// "Staff understand and address bullying effectively."
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

export type BullyingType =
  | "physical"
  | "verbal"
  | "emotional"
  | "cyber"
  | "social_exclusion"
  | "racial"
  | "homophobic"
  | "sexual"
  | "disability"
  | "other";

export type BullyingSeverity =
  | "critical"
  | "high"
  | "medium"
  | "low";

export type InterventionType =
  | "mediation"
  | "restorative_conversation"
  | "safety_plan"
  | "increased_supervision"
  | "education_session"
  | "individual_support"
  | "family_involvement"
  | "external_referral"
  | "consequence"
  | "environmental_change"
  | "other";

export type IncidentOutcome =
  | "resolved"
  | "ongoing_monitoring"
  | "escalated"
  | "safeguarding_referral"
  | "police_referral"
  | "pending";

export interface BullyingIncident {
  id: string;
  home_id: string;
  incident_date: string;
  reported_by: string;
  bullying_type: BullyingType;
  severity: BullyingSeverity;
  perpetrator_name: string;
  perpetrator_is_resident: boolean;
  victim_name: string;
  victim_id: string;
  description: string;
  location: string;
  witnesses: string[];
  intervention_type: InterventionType;
  outcome: IncidentOutcome;
  parent_carer_informed: boolean;
  social_worker_informed: boolean;
  follow_up_date: string | null;
  follow_up_completed: boolean;
  impact_on_victim: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const BULLYING_TYPES: { type: BullyingType; label: string }[] = [
  { type: "physical", label: "Physical" },
  { type: "verbal", label: "Verbal" },
  { type: "emotional", label: "Emotional" },
  { type: "cyber", label: "Cyber" },
  { type: "social_exclusion", label: "Social Exclusion" },
  { type: "racial", label: "Racial" },
  { type: "homophobic", label: "Homophobic" },
  { type: "sexual", label: "Sexual" },
  { type: "disability", label: "Disability" },
  { type: "other", label: "Other" },
];

export const BULLYING_SEVERITIES: { severity: BullyingSeverity; label: string }[] = [
  { severity: "critical", label: "Critical" },
  { severity: "high", label: "High" },
  { severity: "medium", label: "Medium" },
  { severity: "low", label: "Low" },
];

export const INTERVENTION_TYPES: { type: InterventionType; label: string }[] = [
  { type: "mediation", label: "Mediation" },
  { type: "restorative_conversation", label: "Restorative Conversation" },
  { type: "safety_plan", label: "Safety Plan" },
  { type: "increased_supervision", label: "Increased Supervision" },
  { type: "education_session", label: "Education Session" },
  { type: "individual_support", label: "Individual Support" },
  { type: "family_involvement", label: "Family Involvement" },
  { type: "external_referral", label: "External Referral" },
  { type: "consequence", label: "Consequence" },
  { type: "environmental_change", label: "Environmental Change" },
  { type: "other", label: "Other" },
];

export const INCIDENT_OUTCOMES: { outcome: IncidentOutcome; label: string }[] = [
  { outcome: "resolved", label: "Resolved" },
  { outcome: "ongoing_monitoring", label: "Ongoing Monitoring" },
  { outcome: "escalated", label: "Escalated" },
  { outcome: "safeguarding_referral", label: "Safeguarding Referral" },
  { outcome: "police_referral", label: "Police Referral" },
  { outcome: "pending", label: "Pending" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

/**
 * Compute anti-bullying metrics.
 */
export function computeBullyingMetrics(
  incidents: BullyingIncident[],
  totalChildren: number,
  now: Date = new Date(),
): {
  total_incidents: number;
  incidents_this_month: number;
  resolved_count: number;
  pending_count: number;
  escalated_count: number;
  safeguarding_referrals: number;
  follow_ups_pending: number;
  parent_informed_rate: number;
  unique_victims: number;
  repeat_victims: number;
  resident_perpetrator_rate: number;
  cyber_incidents: number;
  by_type: Record<string, number>;
  by_severity: Record<string, number>;
  by_intervention: Record<string, number>;
  by_outcome: Record<string, number>;
} {
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const thisMonth = incidents.filter(
    (i) => new Date(i.incident_date) >= thirtyDaysAgo && new Date(i.incident_date) <= now,
  ).length;

  const resolved = incidents.filter((i) => i.outcome === "resolved").length;
  const pending = incidents.filter((i) => i.outcome === "pending").length;
  const escalated = incidents.filter(
    (i) => i.outcome === "escalated" || i.outcome === "safeguarding_referral" || i.outcome === "police_referral",
  ).length;
  const safeguarding = incidents.filter((i) => i.outcome === "safeguarding_referral").length;

  const followUpsPending = incidents.filter(
    (i) => i.follow_up_date !== null && !i.follow_up_completed,
  ).length;

  const parentInformed = incidents.filter((i) => i.parent_carer_informed).length;
  const parentRate =
    incidents.length > 0 ? Math.round((parentInformed / incidents.length) * 1000) / 10 : 0;

  // Unique victims and repeat victims
  const victimCounts: Record<string, number> = {};
  for (const i of incidents) {
    victimCounts[i.victim_id] = (victimCounts[i.victim_id] ?? 0) + 1;
  }
  const uniqueVictims = Object.keys(victimCounts).length;
  const repeatVictims = Object.values(victimCounts).filter((c) => c > 1).length;

  // Resident perpetrator rate
  const residentPerp = incidents.filter((i) => i.perpetrator_is_resident).length;
  const residentRate =
    incidents.length > 0 ? Math.round((residentPerp / incidents.length) * 1000) / 10 : 0;

  const cyberIncidents = incidents.filter((i) => i.bullying_type === "cyber").length;

  // By type
  const byType: Record<string, number> = {};
  for (const i of incidents) {
    byType[i.bullying_type] = (byType[i.bullying_type] ?? 0) + 1;
  }

  // By severity
  const bySeverity: Record<string, number> = {};
  for (const i of incidents) {
    bySeverity[i.severity] = (bySeverity[i.severity] ?? 0) + 1;
  }

  // By intervention
  const byIntervention: Record<string, number> = {};
  for (const i of incidents) {
    byIntervention[i.intervention_type] = (byIntervention[i.intervention_type] ?? 0) + 1;
  }

  // By outcome
  const byOutcome: Record<string, number> = {};
  for (const i of incidents) {
    byOutcome[i.outcome] = (byOutcome[i.outcome] ?? 0) + 1;
  }

  return {
    total_incidents: incidents.length,
    incidents_this_month: thisMonth,
    resolved_count: resolved,
    pending_count: pending,
    escalated_count: escalated,
    safeguarding_referrals: safeguarding,
    follow_ups_pending: followUpsPending,
    parent_informed_rate: parentRate,
    unique_victims: uniqueVictims,
    repeat_victims: repeatVictims,
    resident_perpetrator_rate: residentRate,
    cyber_incidents: cyberIncidents,
    by_type: byType,
    by_severity: bySeverity,
    by_intervention: byIntervention,
    by_outcome: byOutcome,
  };
}

/**
 * Identify anti-bullying alerts.
 */
export function identifyBullyingAlerts(
  incidents: BullyingIncident[],
  totalChildren: number,
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

  // Critical/high severity pending incidents
  for (const i of incidents) {
    if (
      (i.severity === "critical" || i.severity === "high") &&
      i.outcome === "pending"
    ) {
      alerts.push({
        type: "high_severity_pending",
        severity: i.severity === "critical" ? "critical" as const : "high" as const,
        message: `${i.severity === "critical" ? "Critical" : "High"} bullying incident (${i.bullying_type}) involving ${i.victim_name} on ${i.incident_date} is still pending — immediate action required`,
        id: i.id,
      });
    }
  }

  // Follow-ups overdue
  for (const i of incidents) {
    if (
      i.follow_up_date &&
      !i.follow_up_completed &&
      new Date(i.follow_up_date) < now
    ) {
      alerts.push({
        type: "follow_up_overdue",
        severity: "medium",
        message: `Follow-up for bullying incident involving ${i.victim_name} overdue since ${i.follow_up_date} — check on victim wellbeing`,
        id: i.id,
      });
    }
  }

  // Repeat victims
  const victimCounts: Record<string, { name: string; count: number }> = {};
  for (const i of incidents) {
    if (!victimCounts[i.victim_id]) {
      victimCounts[i.victim_id] = { name: i.victim_name, count: 0 };
    }
    victimCounts[i.victim_id].count += 1;
  }
  for (const [id, v] of Object.entries(victimCounts)) {
    if (v.count >= 2) {
      alerts.push({
        type: "repeat_victim",
        severity: "high",
        message: `${v.name} has been a victim in ${v.count} bullying incidents — review safety plan and support arrangements`,
        id: `repeat_${id}`,
      });
    }
  }

  // Parent/carer not informed for high/critical
  for (const i of incidents) {
    if (
      (i.severity === "critical" || i.severity === "high") &&
      !i.parent_carer_informed
    ) {
      alerts.push({
        type: "parent_not_informed",
        severity: "high",
        message: `Parent/carer not informed about ${i.severity} bullying incident involving ${i.victim_name} on ${i.incident_date}`,
        id: i.id,
      });
    }
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listIncidents(
  homeId: string,
  filters?: {
    victimId?: string;
    bullyingType?: BullyingType;
    severity?: BullyingSeverity;
    outcome?: IncidentOutcome;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
  },
): Promise<ServiceResult<BullyingIncident[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_bullying_incidents") as SB).select("*").eq("home_id", homeId);
  if (filters?.victimId) q = q.eq("victim_id", filters.victimId);
  if (filters?.bullyingType) q = q.eq("bullying_type", filters.bullyingType);
  if (filters?.severity) q = q.eq("severity", filters.severity);
  if (filters?.outcome) q = q.eq("outcome", filters.outcome);
  if (filters?.dateFrom) q = q.gte("incident_date", filters.dateFrom);
  if (filters?.dateTo) q = q.lte("incident_date", filters.dateTo);
  q = q.order("incident_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createIncident(
  input: {
    homeId: string;
    incidentDate: string;
    reportedBy: string;
    bullyingType: BullyingType;
    severity: BullyingSeverity;
    perpetratorName: string;
    perpetratorIsResident: boolean;
    victimName: string;
    victimId: string;
    description: string;
    location: string;
    witnesses: string[];
    interventionType: InterventionType;
    parentCarerInformed: boolean;
    socialWorkerInformed: boolean;
    impactOnVictim?: string;
  },
): Promise<ServiceResult<BullyingIncident>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_bullying_incidents") as SB)
    .insert({
      home_id: input.homeId,
      incident_date: input.incidentDate,
      reported_by: input.reportedBy,
      bullying_type: input.bullyingType,
      severity: input.severity,
      perpetrator_name: input.perpetratorName,
      perpetrator_is_resident: input.perpetratorIsResident,
      victim_name: input.victimName,
      victim_id: input.victimId,
      description: input.description,
      location: input.location,
      witnesses: input.witnesses,
      intervention_type: input.interventionType,
      outcome: "pending",
      parent_carer_informed: input.parentCarerInformed,
      social_worker_informed: input.socialWorkerInformed,
      follow_up_date: null,
      follow_up_completed: false,
      impact_on_victim: input.impactOnVictim ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateIncident(
  id: string,
  updates: Partial<Record<string, unknown>>,
): Promise<ServiceResult<BullyingIncident>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_bullying_incidents") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeBullyingMetrics,
  identifyBullyingAlerts,
};
