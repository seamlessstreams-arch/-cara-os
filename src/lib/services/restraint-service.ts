// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — PHYSICAL INTERVENTION & RESTRAINT SERVICE
// Manages records of physical interventions, restrictive practices, and
// de-escalation outcomes. Critical for Reg 19 (behaviour management),
// Reg 20 (restraint), Reg 35 (notifiable events). Body maps, injury
// records, debrief tracking, and pattern analysis for SCCIF evidence.
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ───────────────────────────────────────────────────────────────────

export interface RestraintRecord {
  id: string;
  home_id: string;
  child_id: string;
  child_name: string;
  incident_date: string;
  incident_time: string;
  restraint_type: string;
  technique_used: string;
  duration_minutes: number;
  staff_involved: StaffInvolved[];
  antecedent: string;
  behaviour_description: string;
  de_escalation_attempted: string[];
  outcome: string;
  injuries_child: InjuryRecord[];
  injuries_staff: InjuryRecord[];
  body_map_completed: boolean;
  child_views_obtained: boolean;
  child_views: string;
  debrief_completed: boolean;
  debrief_date?: string | null;
  debrief_notes?: string | null;
  manager_reviewed: boolean;
  manager_review_date?: string | null;
  manager_review_notes?: string | null;
  ofsted_notified: boolean;
  parent_carer_notified: boolean;
  social_worker_notified: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface StaffInvolved {
  staff_name: string;
  role_in_incident: string;
  trained: boolean;
}

export interface InjuryRecord {
  person_name: string;
  description: string;
  body_location: string;
  severity: "none" | "minor" | "moderate" | "serious";
  treatment_given: string;
  medical_attention_sought: boolean;
}

// ── Constants ───────────────────────────────────────────────────────────────

export const RESTRAINT_TYPES: { type: string; label: string; regulation: string }[] = [
  { type: "physical", label: "Physical Restraint", regulation: "Reg 20" },
  { type: "guided_away", label: "Guided Away / Escorted", regulation: "Reg 20" },
  { type: "holding", label: "Holding (Caring C)", regulation: "Reg 20" },
  { type: "separation", label: "Separation / Segregation", regulation: "Reg 19" },
  { type: "environmental", label: "Environmental Restriction", regulation: "Reg 19" },
];

export const APPROVED_TECHNIQUES: string[] = [
  "Team-Teach",
  "PRICE",
  "CPI (Crisis Prevention Institute)",
  "MAPA (Management of Actual or Potential Aggression)",
  "Verbal de-escalation only",
  "Other approved technique",
];

export const DE_ESCALATION_STRATEGIES: string[] = [
  "Verbal de-escalation",
  "Distraction",
  "Change of staff",
  "Change of environment",
  "Giving space / time out",
  "Active listening",
  "Offering choices",
  "Comfort items",
  "Sensory regulation tools",
  "Agreed safe space",
];

export const BODY_LOCATIONS: string[] = [
  "head", "face", "neck", "left_arm", "right_arm",
  "left_hand", "right_hand", "chest", "back", "abdomen",
  "left_leg", "right_leg", "left_foot", "right_foot",
];

// ── Pure functions (no DB) ──────────────────────────────────────────────────

/**
 * Compute restraint metrics for the home.
 */
function computeRestraintAnalysis(
  records: RestraintRecord[],
  dateFrom: string,
  dateTo: string,
): {
  total_incidents: number;
  by_type: Record<string, number>;
  by_child: Record<string, { name: string; count: number }>;
  avg_duration_minutes: number;
  with_injuries: number;
  injury_rate: number;
  de_escalation_success_rate: number;
  debrief_completion_rate: number;
  manager_review_rate: number;
  child_views_rate: number;
  body_map_rate: number;
  notification_compliance: number;
} {
  const from = new Date(dateFrom);
  const to = new Date(dateTo);

  const filtered = records.filter((r) => {
    const d = new Date(r.incident_date);
    return d >= from && d <= to;
  });

  const total = filtered.length;

  // By type
  const byType: Record<string, number> = {};
  for (const r of filtered) {
    byType[r.restraint_type] = (byType[r.restraint_type] ?? 0) + 1;
  }

  // By child
  const byChild: Record<string, { name: string; count: number }> = {};
  for (const r of filtered) {
    if (!byChild[r.child_id]) {
      byChild[r.child_id] = { name: r.child_name, count: 0 };
    }
    byChild[r.child_id].count++;
  }

  // Duration
  let totalDuration = 0;
  for (const r of filtered) totalDuration += r.duration_minutes;
  const avgDuration = total > 0 ? Math.round((totalDuration / total) * 10) / 10 : 0;

  // Injuries
  const withInjuries = filtered.filter(
    (r) => r.injuries_child.length > 0 || r.injuries_staff.length > 0,
  ).length;
  const injuryRate = total > 0 ? Math.round((withInjuries / total) * 100) : 0;

  // De-escalation: incidents that resolved WITHOUT restraint (not in this dataset,
  // but we track whether de-escalation was attempted). For now, rate of attempts.
  const withDeEscalation = filtered.filter(
    (r) => r.de_escalation_attempted.length > 0,
  ).length;
  const deEscalationRate = total > 0 ? Math.round((withDeEscalation / total) * 100) : 0;

  // Compliance rates
  const debriefed = filtered.filter((r) => r.debrief_completed).length;
  const debriefRate = total > 0 ? Math.round((debriefed / total) * 100) : 0;

  const reviewed = filtered.filter((r) => r.manager_reviewed).length;
  const reviewRate = total > 0 ? Math.round((reviewed / total) * 100) : 0;

  const childViews = filtered.filter((r) => r.child_views_obtained).length;
  const childViewsRate = total > 0 ? Math.round((childViews / total) * 100) : 0;

  const bodyMaps = filtered.filter((r) => r.body_map_completed).length;
  const bodyMapRate = total > 0 ? Math.round((bodyMaps / total) * 100) : 0;

  // Notification compliance (all 3 parties notified)
  const fullyNotified = filtered.filter(
    (r) => r.ofsted_notified && r.parent_carer_notified && r.social_worker_notified,
  ).length;
  const notificationCompliance = total > 0 ? Math.round((fullyNotified / total) * 100) : 0;

  return {
    total_incidents: total,
    by_type: byType,
    by_child: byChild,
    avg_duration_minutes: avgDuration,
    with_injuries: withInjuries,
    injury_rate: injuryRate,
    de_escalation_success_rate: deEscalationRate,
    debrief_completion_rate: debriefRate,
    manager_review_rate: reviewRate,
    child_views_rate: childViewsRate,
    body_map_rate: bodyMapRate,
    notification_compliance: notificationCompliance,
  };
}

/**
 * Identify restraint-related alerts.
 */
function identifyRestraintAlerts(
  records: RestraintRecord[],
): { type: string; severity: "critical" | "high" | "medium" | "low"; message: string }[] {
  const alerts: { type: string; severity: "critical" | "high" | "medium" | "low"; message: string }[] = [];

  for (const r of records) {
    // Serious injury
    const seriousInjuries = [
      ...r.injuries_child.filter((i) => i.severity === "serious"),
      ...r.injuries_staff.filter((i) => i.severity === "serious"),
    ];
    if (seriousInjuries.length > 0) {
      alerts.push({
        type: "serious_injury",
        severity: "critical",
        message: `Serious injury recorded during restraint of ${r.child_name} on ${r.incident_date}. Immediate management review required.`,
      });
    }

    // No de-escalation attempted
    if (r.de_escalation_attempted.length === 0) {
      alerts.push({
        type: "no_de_escalation",
        severity: "high",
        message: `No de-escalation strategies recorded for restraint of ${r.child_name} on ${r.incident_date}. Reg 19 requires de-escalation first.`,
      });
    }

    // Debrief not completed
    if (!r.debrief_completed) {
      alerts.push({
        type: "no_debrief",
        severity: "medium",
        message: `Post-incident debrief not completed for restraint of ${r.child_name} on ${r.incident_date}.`,
      });
    }

    // Child views not obtained
    if (!r.child_views_obtained) {
      alerts.push({
        type: "no_child_views",
        severity: "medium",
        message: `Child's views not obtained after restraint of ${r.child_name} on ${r.incident_date} (Reg 7).`,
      });
    }

    // Notification incomplete
    if (!r.ofsted_notified || !r.parent_carer_notified || !r.social_worker_notified) {
      const missing: string[] = [];
      if (!r.ofsted_notified) missing.push("Ofsted");
      if (!r.parent_carer_notified) missing.push("parent/carer");
      if (!r.social_worker_notified) missing.push("social worker");
      alerts.push({
        type: "incomplete_notification",
        severity: "high",
        message: `Restraint of ${r.child_name} on ${r.incident_date}: ${missing.join(", ")} not notified (Reg 35/40).`,
      });
    }

    // Untrained staff involved
    const untrainedStaff = r.staff_involved.filter((s) => !s.trained);
    if (untrainedStaff.length > 0) {
      alerts.push({
        type: "untrained_staff",
        severity: "critical",
        message: `Untrained staff (${untrainedStaff.map((s) => s.staff_name).join(", ")}) involved in restraint of ${r.child_name} on ${r.incident_date}.`,
      });
    }
  }

  // Pattern: child with 3+ incidents
  const childCounts: Record<string, { name: string; count: number }> = {};
  for (const r of records) {
    if (!childCounts[r.child_id]) {
      childCounts[r.child_id] = { name: r.child_name, count: 0 };
    }
    childCounts[r.child_id].count++;
  }
  for (const childId of Object.keys(childCounts)) {
    if (childCounts[childId].count >= 3) {
      alerts.push({
        type: "repeated_restraint",
        severity: "high",
        message: `${childCounts[childId].name} has ${childCounts[childId].count} restraint incidents — review behaviour support plan and consider referral to CAMHS/specialist.`,
      });
    }
  }

  return alerts;
}

// ── CRUD ────────────────────────────────────────────────────────────────────

export async function listRestraintRecords(
  homeId: string,
  filters?: {
    childId?: string;
    restraintType?: string;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
  },
): Promise<ServiceResult<RestraintRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [], persisted: false } as ServiceResult<RestraintRecord[]>;

  const s = sb();
  if (!s) return { ok: true, data: [], persisted: false } as ServiceResult<RestraintRecord[]>;

  let q = (s.from("cs_restraint_records") as SB).select("*").eq("home_id", homeId);
  if (filters?.childId) q = q.eq("child_id", filters.childId);
  if (filters?.restraintType) q = q.eq("restraint_type", filters.restraintType);
  if (filters?.dateFrom) q = q.gte("incident_date", filters.dateFrom);
  if (filters?.dateTo) q = q.lte("incident_date", filters.dateTo);
  q = q.order("incident_date", { ascending: false }).limit(filters?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRestraintRecord(
  input: Omit<RestraintRecord, "id" | "created_at" | "updated_at">,
): Promise<ServiceResult<RestraintRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_restraint_records") as SB)
    .insert({
      home_id: input.home_id,
      child_id: input.child_id,
      child_name: input.child_name,
      incident_date: input.incident_date,
      incident_time: input.incident_time,
      restraint_type: input.restraint_type,
      technique_used: input.technique_used,
      duration_minutes: input.duration_minutes,
      staff_involved: input.staff_involved,
      antecedent: input.antecedent,
      behaviour_description: input.behaviour_description,
      de_escalation_attempted: input.de_escalation_attempted,
      outcome: input.outcome,
      injuries_child: input.injuries_child,
      injuries_staff: input.injuries_staff,
      body_map_completed: input.body_map_completed,
      child_views_obtained: input.child_views_obtained,
      child_views: input.child_views,
      debrief_completed: input.debrief_completed,
      debrief_date: input.debrief_date ?? null,
      debrief_notes: input.debrief_notes ?? null,
      manager_reviewed: input.manager_reviewed,
      manager_review_date: input.manager_review_date ?? null,
      manager_review_notes: input.manager_review_notes ?? null,
      ofsted_notified: input.ofsted_notified,
      parent_carer_notified: input.parent_carer_notified,
      social_worker_notified: input.social_worker_notified,
      created_by: input.created_by,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateRestraintRecord(
  id: string,
  updates: Partial<RestraintRecord>,
): Promise<ServiceResult<RestraintRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_restraint_records") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ────────────────────────────────────────────────────────

export const _testing = {
  computeRestraintAnalysis,
  identifyRestraintAlerts,
};
