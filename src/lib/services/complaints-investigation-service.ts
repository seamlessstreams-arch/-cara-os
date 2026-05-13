// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — COMPLAINTS INVESTIGATION SERVICE
// Tracks formal complaints, investigations, outcomes, learning,
// and complainant satisfaction.
// CHR 2015 Reg 38 (complaints — investigation and resolution),
// Reg 13 (leadership — learning from complaints),
// Children Act 1989 s26 (representations and complaints).
//
// Covers: complaints received, investigation stages, outcomes,
// timescales, learning, and complainant satisfaction.
//
// SCCIF: Leadership & Management — "Complaints are investigated
// thoroughly and used as opportunities for learning."
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

export type ComplaintSource =
  | "child"
  | "parent_carer"
  | "social_worker"
  | "placing_authority"
  | "staff"
  | "advocate"
  | "irp"
  | "anonymous"
  | "other";

export type ComplaintCategory =
  | "care_quality"
  | "staff_conduct"
  | "safeguarding"
  | "medication"
  | "food_nutrition"
  | "activities"
  | "contact_arrangements"
  | "environment"
  | "communication"
  | "discrimination"
  | "other";

export type InvestigationStage =
  | "received"
  | "acknowledged"
  | "investigating"
  | "outcome_reached"
  | "resolved"
  | "escalated"
  | "withdrawn";

export type ComplaintOutcome =
  | "upheld"
  | "partially_upheld"
  | "not_upheld"
  | "withdrawn"
  | "pending"
  | "inconclusive";

export interface ComplaintInvestigation {
  id: string;
  home_id: string;
  complaint_date: string;
  complaint_source: ComplaintSource;
  complaint_category: ComplaintCategory;
  investigation_stage: InvestigationStage;
  complaint_outcome: ComplaintOutcome;
  complainant_name: string;
  is_child_complaint: boolean;
  investigating_officer: string;
  acknowledged_within_24h: boolean;
  investigation_started_within_5_days: boolean;
  resolved_within_28_days: boolean | null;
  days_to_resolution: number | null;
  learning_identified: boolean;
  learning_details: string | null;
  actions_taken: string[];
  ofsted_notified: boolean;
  complainant_satisfaction: "satisfied" | "partially_satisfied" | "dissatisfied" | "not_recorded" | null;
  review_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const COMPLAINT_SOURCES: { source: ComplaintSource; label: string }[] = [
  { source: "child", label: "Child" },
  { source: "parent_carer", label: "Parent/Carer" },
  { source: "social_worker", label: "Social Worker" },
  { source: "placing_authority", label: "Placing Authority" },
  { source: "staff", label: "Staff" },
  { source: "advocate", label: "Advocate" },
  { source: "irp", label: "IRP" },
  { source: "anonymous", label: "Anonymous" },
  { source: "other", label: "Other" },
];

export const COMPLAINT_CATEGORIES: { category: ComplaintCategory; label: string }[] = [
  { category: "care_quality", label: "Care Quality" },
  { category: "staff_conduct", label: "Staff Conduct" },
  { category: "safeguarding", label: "Safeguarding" },
  { category: "medication", label: "Medication" },
  { category: "food_nutrition", label: "Food/Nutrition" },
  { category: "activities", label: "Activities" },
  { category: "contact_arrangements", label: "Contact Arrangements" },
  { category: "environment", label: "Environment" },
  { category: "communication", label: "Communication" },
  { category: "discrimination", label: "Discrimination" },
  { category: "other", label: "Other" },
];

export const INVESTIGATION_STAGES: { stage: InvestigationStage; label: string }[] = [
  { stage: "received", label: "Received" },
  { stage: "acknowledged", label: "Acknowledged" },
  { stage: "investigating", label: "Investigating" },
  { stage: "outcome_reached", label: "Outcome Reached" },
  { stage: "resolved", label: "Resolved" },
  { stage: "escalated", label: "Escalated" },
  { stage: "withdrawn", label: "Withdrawn" },
];

export const COMPLAINT_OUTCOMES: { outcome: ComplaintOutcome; label: string }[] = [
  { outcome: "upheld", label: "Upheld" },
  { outcome: "partially_upheld", label: "Partially Upheld" },
  { outcome: "not_upheld", label: "Not Upheld" },
  { outcome: "withdrawn", label: "Withdrawn" },
  { outcome: "pending", label: "Pending" },
  { outcome: "inconclusive", label: "Inconclusive" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeComplaintMetrics(
  complaints: ComplaintInvestigation[],
): {
  total_complaints: number;
  child_complaints: number;
  open_complaints: number;
  resolved_complaints: number;
  escalated_complaints: number;
  upheld_count: number;
  partially_upheld_count: number;
  not_upheld_count: number;
  acknowledged_rate: number;
  investigation_started_rate: number;
  resolved_within_28_days_rate: number;
  average_days_to_resolution: number;
  learning_identified_rate: number;
  ofsted_notified_count: number;
  satisfaction_rate: number;
  by_source: Record<string, number>;
  by_category: Record<string, number>;
  by_stage: Record<string, number>;
  by_outcome: Record<string, number>;
} {
  const childComplaints = complaints.filter((c) => c.is_child_complaint).length;

  const open = complaints.filter(
    (c) => c.investigation_stage !== "resolved" && c.investigation_stage !== "withdrawn",
  ).length;
  const resolved = complaints.filter((c) => c.investigation_stage === "resolved").length;
  const escalated = complaints.filter((c) => c.investigation_stage === "escalated").length;

  const upheld = complaints.filter((c) => c.complaint_outcome === "upheld").length;
  const partiallyUpheld = complaints.filter((c) => c.complaint_outcome === "partially_upheld").length;
  const notUpheld = complaints.filter((c) => c.complaint_outcome === "not_upheld").length;

  const ackRate =
    complaints.length > 0
      ? Math.round((complaints.filter((c) => c.acknowledged_within_24h).length / complaints.length) * 1000) / 10
      : 0;

  const invStarted = complaints.filter((c) => c.investigation_started_within_5_days).length;
  const invRate =
    complaints.length > 0
      ? Math.round((invStarted / complaints.length) * 1000) / 10
      : 0;

  const resolvedWithTimeline = complaints.filter((c) => c.resolved_within_28_days !== null);
  const resolvedIn28 = resolvedWithTimeline.filter((c) => c.resolved_within_28_days === true).length;
  const res28Rate =
    resolvedWithTimeline.length > 0
      ? Math.round((resolvedIn28 / resolvedWithTimeline.length) * 1000) / 10
      : 0;

  const withDays = complaints.filter((c) => c.days_to_resolution !== null);
  const avgDays =
    withDays.length > 0
      ? Math.round((withDays.reduce((sum, c) => sum + (c.days_to_resolution ?? 0), 0) / withDays.length) * 10) / 10
      : 0;

  const learningFound = complaints.filter((c) => c.learning_identified).length;
  const learningRate =
    complaints.length > 0
      ? Math.round((learningFound / complaints.length) * 1000) / 10
      : 0;

  const ofstedNotified = complaints.filter((c) => c.ofsted_notified).length;

  const withSatisfaction = complaints.filter((c) => c.complainant_satisfaction !== null && c.complainant_satisfaction !== "not_recorded");
  const satisfied = withSatisfaction.filter((c) => c.complainant_satisfaction === "satisfied").length;
  const satRate =
    withSatisfaction.length > 0
      ? Math.round((satisfied / withSatisfaction.length) * 1000) / 10
      : 0;

  const bySource: Record<string, number> = {};
  for (const c of complaints) bySource[c.complaint_source] = (bySource[c.complaint_source] ?? 0) + 1;

  const byCategory: Record<string, number> = {};
  for (const c of complaints) byCategory[c.complaint_category] = (byCategory[c.complaint_category] ?? 0) + 1;

  const byStage: Record<string, number> = {};
  for (const c of complaints) byStage[c.investigation_stage] = (byStage[c.investigation_stage] ?? 0) + 1;

  const byOutcome: Record<string, number> = {};
  for (const c of complaints) byOutcome[c.complaint_outcome] = (byOutcome[c.complaint_outcome] ?? 0) + 1;

  return {
    total_complaints: complaints.length,
    child_complaints: childComplaints,
    open_complaints: open,
    resolved_complaints: resolved,
    escalated_complaints: escalated,
    upheld_count: upheld,
    partially_upheld_count: partiallyUpheld,
    not_upheld_count: notUpheld,
    acknowledged_rate: ackRate,
    investigation_started_rate: invRate,
    resolved_within_28_days_rate: res28Rate,
    average_days_to_resolution: avgDays,
    learning_identified_rate: learningRate,
    ofsted_notified_count: ofstedNotified,
    satisfaction_rate: satRate,
    by_source: bySource,
    by_category: byCategory,
    by_stage: byStage,
    by_outcome: byOutcome,
  };
}

export function identifyComplaintAlerts(
  complaints: ComplaintInvestigation[],
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

  // Safeguarding complaints
  for (const c of complaints) {
    if (c.complaint_category === "safeguarding" && c.investigation_stage !== "resolved" && c.investigation_stage !== "withdrawn") {
      alerts.push({
        type: "safeguarding_complaint",
        severity: "critical",
        message: `Active safeguarding complaint from ${c.complaint_source.replace(/_/g, " ")} (${c.complaint_date}) — prioritise investigation`,
        id: c.id,
      });
    }
  }

  // Not acknowledged within 24h
  const notAcked = complaints.filter(
    (c) => !c.acknowledged_within_24h && c.investigation_stage !== "withdrawn",
  ).length;
  if (notAcked >= 1) {
    alerts.push({
      type: "late_acknowledgement",
      severity: "high",
      message: `${notAcked} ${notAcked === 1 ? "complaint was" : "complaints were"} not acknowledged within 24 hours — Reg 38 requires prompt acknowledgement`,
      id: "late_acknowledgement",
    });
  }

  // Escalated complaints
  const escalated = complaints.filter((c) => c.investigation_stage === "escalated").length;
  if (escalated >= 1) {
    alerts.push({
      type: "escalated",
      severity: "high",
      message: `${escalated} ${escalated === 1 ? "complaint has" : "complaints have"} been escalated — review investigation process`,
      id: "escalated",
    });
  }

  // No learning identified from upheld complaints
  const upheldNoLearning = complaints.filter(
    (c) => (c.complaint_outcome === "upheld" || c.complaint_outcome === "partially_upheld") && !c.learning_identified,
  ).length;
  if (upheldNoLearning >= 1) {
    alerts.push({
      type: "no_learning",
      severity: "medium",
      message: `${upheldNoLearning} upheld/partially upheld ${upheldNoLearning === 1 ? "complaint has" : "complaints have"} no learning identified — extract lessons to improve practice`,
      id: "no_learning",
    });
  }

  // Dissatisfied complainants
  const dissatisfied = complaints.filter((c) => c.complainant_satisfaction === "dissatisfied").length;
  if (dissatisfied >= 1) {
    alerts.push({
      type: "dissatisfied",
      severity: "medium",
      message: `${dissatisfied} ${dissatisfied === 1 ? "complainant is" : "complainants are"} dissatisfied with outcome — review and consider further resolution`,
      id: "dissatisfied",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listComplaints(
  homeId: string,
  filters?: {
    complaintSource?: ComplaintSource;
    complaintCategory?: ComplaintCategory;
    investigationStage?: InvestigationStage;
    limit?: number;
  },
): Promise<ServiceResult<ComplaintInvestigation[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_complaint_investigations") as SB).select("*").eq("home_id", homeId);
  if (filters?.complaintSource) q = q.eq("complaint_source", filters.complaintSource);
  if (filters?.complaintCategory) q = q.eq("complaint_category", filters.complaintCategory);
  if (filters?.investigationStage) q = q.eq("investigation_stage", filters.investigationStage);
  q = q.order("complaint_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createComplaint(
  input: {
    homeId: string;
    complaintDate: string;
    complaintSource: ComplaintSource;
    complaintCategory: ComplaintCategory;
    investigationStage: InvestigationStage;
    complaintOutcome: ComplaintOutcome;
    complainantName: string;
    isChildComplaint: boolean;
    investigatingOfficer: string;
    acknowledgedWithin24h: boolean;
    investigationStartedWithin5Days: boolean;
    resolvedWithin28Days?: boolean;
    daysToResolution?: number;
    learningIdentified: boolean;
    learningDetails?: string;
    actionsTaken: string[];
    ofstedNotified: boolean;
    complainantSatisfaction?: "satisfied" | "partially_satisfied" | "dissatisfied" | "not_recorded";
    reviewDate?: string;
    notes?: string;
  },
): Promise<ServiceResult<ComplaintInvestigation>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_complaint_investigations") as SB)
    .insert({
      home_id: input.homeId,
      complaint_date: input.complaintDate,
      complaint_source: input.complaintSource,
      complaint_category: input.complaintCategory,
      investigation_stage: input.investigationStage,
      complaint_outcome: input.complaintOutcome,
      complainant_name: input.complainantName,
      is_child_complaint: input.isChildComplaint,
      investigating_officer: input.investigatingOfficer,
      acknowledged_within_24h: input.acknowledgedWithin24h,
      investigation_started_within_5_days: input.investigationStartedWithin5Days,
      resolved_within_28_days: input.resolvedWithin28Days ?? null,
      days_to_resolution: input.daysToResolution ?? null,
      learning_identified: input.learningIdentified,
      learning_details: input.learningDetails ?? null,
      actions_taken: input.actionsTaken,
      ofsted_notified: input.ofstedNotified,
      complainant_satisfaction: input.complainantSatisfaction ?? null,
      review_date: input.reviewDate ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateComplaint(
  id: string,
  updates: Partial<Record<string, unknown>>,
): Promise<ServiceResult<ComplaintInvestigation>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_complaint_investigations") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeComplaintMetrics,
  identifyComplaintAlerts,
};
