// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — PROVIDER VISITS SERVICE
// Tracks all provider-related visits: local authority social worker visits,
// IRO visits, Reg 44 independent person visits, Ofsted inspections,
// local authority monitoring visits, and other professional visits.
// CHR 2015 Reg 44 (independent person — monthly visits),
// Reg 45 (review of quality of care),
// Care Planning Regulations 2010 (SW visiting requirements).
//
// Ensures visit schedules are maintained, outcomes tracked,
// and any actions from visits are followed up.
//
// SCCIF: Well-Led — "The registered person ensures that independent
// visits are conducted and acted upon."
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

export type VisitType =
  | "social_worker"
  | "iro"
  | "reg_44"
  | "ofsted"
  | "la_monitoring"
  | "placing_authority"
  | "health_professional"
  | "education_professional"
  | "therapist"
  | "advocate"
  | "other";

export type VisitOutcome =
  | "satisfactory"
  | "concerns_raised"
  | "actions_required"
  | "follow_up_needed"
  | "escalated"
  | "not_completed";

export type VisitStatus =
  | "scheduled"
  | "completed"
  | "cancelled"
  | "rescheduled"
  | "overdue"
  | "no_show";

export interface ProviderVisit {
  id: string;
  home_id: string;
  visit_type: VisitType;
  visitor_name: string;
  visitor_organisation: string;
  visit_date: string;
  visit_status: VisitStatus;
  outcome: VisitOutcome | null;
  children_seen: string[];
  children_spoken_privately: string[];
  staff_spoken_to: string[];
  premises_inspected: boolean;
  records_reviewed: boolean;
  actions_raised: string[];
  actions_completed: number;
  report_received: boolean;
  report_date: string | null;
  next_visit_due: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const VISIT_TYPES: { type: VisitType; label: string }[] = [
  { type: "social_worker", label: "Social Worker Visit" },
  { type: "iro", label: "IRO Visit" },
  { type: "reg_44", label: "Reg 44 Independent Visit" },
  { type: "ofsted", label: "Ofsted Inspection" },
  { type: "la_monitoring", label: "LA Monitoring Visit" },
  { type: "placing_authority", label: "Placing Authority Visit" },
  { type: "health_professional", label: "Health Professional" },
  { type: "education_professional", label: "Education Professional" },
  { type: "therapist", label: "Therapist" },
  { type: "advocate", label: "Advocate" },
  { type: "other", label: "Other" },
];

export const VISIT_OUTCOMES: { outcome: VisitOutcome; label: string }[] = [
  { outcome: "satisfactory", label: "Satisfactory" },
  { outcome: "concerns_raised", label: "Concerns Raised" },
  { outcome: "actions_required", label: "Actions Required" },
  { outcome: "follow_up_needed", label: "Follow-up Needed" },
  { outcome: "escalated", label: "Escalated" },
  { outcome: "not_completed", label: "Not Completed" },
];

export const VISIT_STATUSES: { status: VisitStatus; label: string }[] = [
  { status: "scheduled", label: "Scheduled" },
  { status: "completed", label: "Completed" },
  { status: "cancelled", label: "Cancelled" },
  { status: "rescheduled", label: "Rescheduled" },
  { status: "overdue", label: "Overdue" },
  { status: "no_show", label: "No Show" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

/**
 * Compute provider visit metrics.
 */
export function computeVisitMetrics(
  visits: ProviderVisit[],
  now: Date = new Date(),
): {
  total_visits: number;
  completed_visits: number;
  scheduled_visits: number;
  overdue_visits: number;
  cancelled_visits: number;
  satisfactory_rate: number;
  concerns_raised_count: number;
  actions_outstanding: number;
  reports_pending: number;
  children_seen_rate: number;
  premises_inspected_rate: number;
  records_reviewed_rate: number;
  reg_44_completed: number;
  reg_44_overdue: number;
  sw_visits_completed: number;
  by_visit_type: Record<string, number>;
  by_outcome: Record<string, number>;
  by_status: Record<string, number>;
} {
  const completed = visits.filter((v) => v.visit_status === "completed").length;
  const scheduled = visits.filter((v) => v.visit_status === "scheduled").length;
  const overdue = visits.filter((v) => v.visit_status === "overdue").length;
  const cancelled = visits.filter((v) => v.visit_status === "cancelled").length;

  // Also check for scheduled visits past their date
  const overdueByDate = visits.filter(
    (v) => v.visit_status === "scheduled" && new Date(v.visit_date) < now,
  ).length;

  const completedVisits = visits.filter((v) => v.visit_status === "completed");
  const satisfactory = completedVisits.filter((v) => v.outcome === "satisfactory").length;
  const satisfactoryRate =
    completedVisits.length > 0
      ? Math.round((satisfactory / completedVisits.length) * 1000) / 10
      : 0;

  const concernsRaised = visits.filter((v) => v.outcome === "concerns_raised").length;

  // Actions outstanding: total actions raised minus completed
  const actionsOutstanding = visits.reduce(
    (sum, v) => sum + Math.max(0, v.actions_raised.length - v.actions_completed),
    0,
  );

  // Reports pending for completed visits
  const reportsPending = completedVisits.filter((v) => !v.report_received).length;

  // Children spoken to privately rate
  const withChildren = completedVisits.filter((v) => v.children_spoken_privately.length > 0).length;
  const childrenSeenRate =
    completedVisits.length > 0
      ? Math.round((withChildren / completedVisits.length) * 1000) / 10
      : 0;

  const premisesInspected = completedVisits.filter((v) => v.premises_inspected).length;
  const premisesRate =
    completedVisits.length > 0
      ? Math.round((premisesInspected / completedVisits.length) * 1000) / 10
      : 0;

  const recordsReviewed = completedVisits.filter((v) => v.records_reviewed).length;
  const recordsRate =
    completedVisits.length > 0
      ? Math.round((recordsReviewed / completedVisits.length) * 1000) / 10
      : 0;

  const reg44Completed = visits.filter(
    (v) => v.visit_type === "reg_44" && v.visit_status === "completed",
  ).length;
  const reg44Overdue = visits.filter(
    (v) => v.visit_type === "reg_44" && (v.visit_status === "overdue" || (v.visit_status === "scheduled" && new Date(v.visit_date) < now)),
  ).length;

  const swCompleted = visits.filter(
    (v) => v.visit_type === "social_worker" && v.visit_status === "completed",
  ).length;

  // By visit type
  const byVisitType: Record<string, number> = {};
  for (const v of visits) {
    byVisitType[v.visit_type] = (byVisitType[v.visit_type] ?? 0) + 1;
  }

  // By outcome
  const byOutcome: Record<string, number> = {};
  for (const v of visits) {
    if (v.outcome) {
      byOutcome[v.outcome] = (byOutcome[v.outcome] ?? 0) + 1;
    }
  }

  // By status
  const byStatus: Record<string, number> = {};
  for (const v of visits) {
    byStatus[v.visit_status] = (byStatus[v.visit_status] ?? 0) + 1;
  }

  return {
    total_visits: visits.length,
    completed_visits: completed,
    scheduled_visits: scheduled,
    overdue_visits: overdue + overdueByDate,
    cancelled_visits: cancelled,
    satisfactory_rate: satisfactoryRate,
    concerns_raised_count: concernsRaised,
    actions_outstanding: actionsOutstanding,
    reports_pending: reportsPending,
    children_seen_rate: childrenSeenRate,
    premises_inspected_rate: premisesRate,
    records_reviewed_rate: recordsRate,
    reg_44_completed: reg44Completed,
    reg_44_overdue: reg44Overdue,
    sw_visits_completed: swCompleted,
    by_visit_type: byVisitType,
    by_outcome: byOutcome,
    by_status: byStatus,
  };
}

/**
 * Identify provider visit alerts.
 */
export function identifyVisitAlerts(
  visits: ProviderVisit[],
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

  // Reg 44 overdue
  for (const v of visits) {
    if (v.visit_type === "reg_44" && v.visit_status === "overdue") {
      alerts.push({
        type: "reg_44_overdue",
        severity: "critical",
        message: `Reg 44 independent visit is overdue (was due ${v.visit_date}) — this is a statutory requirement and must be arranged immediately`,
        id: v.id,
      });
    }
  }

  // Visits with concerns not followed up
  for (const v of visits) {
    if (
      v.outcome === "concerns_raised" &&
      v.actions_raised.length > 0 &&
      v.actions_completed < v.actions_raised.length
    ) {
      const outstanding = v.actions_raised.length - v.actions_completed;
      alerts.push({
        type: "actions_outstanding",
        severity: "high",
        message: `${outstanding} outstanding ${outstanding === 1 ? "action" : "actions"} from ${v.visitor_name}'s visit on ${v.visit_date} where concerns were raised — complete urgently`,
        id: v.id,
      });
    }
  }

  // Reports not received for completed visits (over 14 days)
  const fourteenDaysAgo = new Date(now);
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
  for (const v of visits) {
    if (
      v.visit_status === "completed" &&
      !v.report_received &&
      new Date(v.visit_date) < fourteenDaysAgo
    ) {
      alerts.push({
        type: "report_overdue",
        severity: "medium",
        message: `Report not received from ${v.visitor_name} for visit on ${v.visit_date} — chase with ${v.visitor_organisation}`,
        id: v.id,
      });
    }
  }

  // Scheduled visits overdue by date
  for (const v of visits) {
    if (v.visit_status === "scheduled" && new Date(v.visit_date) < now) {
      alerts.push({
        type: "visit_overdue_by_date",
        severity: v.visit_type === "reg_44" ? "critical" as const : "high" as const,
        message: `${v.visit_type.replace(/_/g, " ")} visit by ${v.visitor_name} was scheduled for ${v.visit_date} but not completed — update status`,
        id: v.id,
      });
    }
  }

  // Children not spoken to privately during visit
  for (const v of visits) {
    if (
      v.visit_status === "completed" &&
      v.children_seen.length > 0 &&
      v.children_spoken_privately.length === 0
    ) {
      alerts.push({
        type: "no_private_discussion",
        severity: "medium",
        message: `${v.visitor_name} saw children during visit on ${v.visit_date} but no private discussions recorded — ensure children have opportunity to speak privately`,
        id: v.id,
      });
    }
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listVisits(
  homeId: string,
  filters?: {
    visitType?: VisitType;
    visitStatus?: VisitStatus;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
  },
): Promise<ServiceResult<ProviderVisit[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_provider_visits") as SB).select("*").eq("home_id", homeId);
  if (filters?.visitType) q = q.eq("visit_type", filters.visitType);
  if (filters?.visitStatus) q = q.eq("visit_status", filters.visitStatus);
  if (filters?.dateFrom) q = q.gte("visit_date", filters.dateFrom);
  if (filters?.dateTo) q = q.lte("visit_date", filters.dateTo);
  q = q.order("visit_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createVisit(
  input: {
    homeId: string;
    visitType: VisitType;
    visitorName: string;
    visitorOrganisation: string;
    visitDate: string;
    visitStatus: VisitStatus;
    outcome?: VisitOutcome;
    childrenSeen: string[];
    childrenSpokenPrivately: string[];
    staffSpokenTo: string[];
    premisesInspected: boolean;
    recordsReviewed: boolean;
    actionsRaised: string[];
    reportReceived: boolean;
    reportDate?: string;
    nextVisitDue?: string;
    notes?: string;
  },
): Promise<ServiceResult<ProviderVisit>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_provider_visits") as SB)
    .insert({
      home_id: input.homeId,
      visit_type: input.visitType,
      visitor_name: input.visitorName,
      visitor_organisation: input.visitorOrganisation,
      visit_date: input.visitDate,
      visit_status: input.visitStatus,
      outcome: input.outcome ?? null,
      children_seen: input.childrenSeen,
      children_spoken_privately: input.childrenSpokenPrivately,
      staff_spoken_to: input.staffSpokenTo,
      premises_inspected: input.premisesInspected,
      records_reviewed: input.recordsReviewed,
      actions_raised: input.actionsRaised,
      actions_completed: 0,
      report_received: input.reportReceived,
      report_date: input.reportDate ?? null,
      next_visit_due: input.nextVisitDue ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateVisit(
  id: string,
  updates: Partial<Record<string, unknown>>,
): Promise<ServiceResult<ProviderVisit>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_provider_visits") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeVisitMetrics,
  identifyVisitAlerts,
};
