// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF GRIEVANCE SERVICE
// Tracks formal grievances, investigation process, outcomes,
// appeal handling, and learning from staff complaints.
// CHR 2015 Reg 33 (employment — grievance procedures),
// Reg 13 (leadership — staff management),
// ACAS Code of Practice (disciplinary and grievance).
//
// Covers: grievance submission, investigation, hearings,
// outcomes, appeals, and resolution timescales.
//
// SCCIF: Leadership & Management — "Staff grievances are handled
// fairly and promptly." "Learning from grievances improves practice."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type GrievanceCategory =
  | "bullying_harassment"
  | "discrimination"
  | "working_conditions"
  | "pay_benefits"
  | "management_conduct"
  | "workload"
  | "health_safety"
  | "unfair_treatment"
  | "contractual"
  | "other";

export type GrievanceStage =
  | "informal_raised"
  | "formal_submitted"
  | "acknowledged"
  | "investigating"
  | "hearing_scheduled"
  | "hearing_held"
  | "outcome_issued"
  | "appeal_lodged"
  | "appeal_heard"
  | "resolved"
  | "withdrawn";

export type GrievanceOutcome =
  | "upheld"
  | "partially_upheld"
  | "not_upheld"
  | "withdrawn"
  | "mediated"
  | "pending";

export type ResolutionMethod =
  | "formal_outcome"
  | "mediation"
  | "informal_resolution"
  | "withdrawn_by_staff"
  | "management_action"
  | "other";

export interface StaffGrievance {
  id: string;
  home_id: string;
  staff_name: string;
  staff_id: string;
  grievance_date: string;
  grievance_category: GrievanceCategory;
  grievance_stage: GrievanceStage;
  grievance_outcome: GrievanceOutcome;
  resolution_method: ResolutionMethod;
  acknowledged_within_5_days: boolean;
  hearing_within_28_days: boolean | null;
  days_to_resolution: number | null;
  investigating_officer: string;
  union_representative_present: boolean;
  appeal_lodged: boolean;
  appeal_outcome: GrievanceOutcome | null;
  learning_identified: boolean;
  learning_details: string | null;
  impact_on_children_assessed: boolean;
  acas_code_followed: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const GRIEVANCE_CATEGORIES: { category: GrievanceCategory; label: string }[] = [
  { category: "bullying_harassment", label: "Bullying/Harassment" },
  { category: "discrimination", label: "Discrimination" },
  { category: "working_conditions", label: "Working Conditions" },
  { category: "pay_benefits", label: "Pay/Benefits" },
  { category: "management_conduct", label: "Management Conduct" },
  { category: "workload", label: "Workload" },
  { category: "health_safety", label: "Health & Safety" },
  { category: "unfair_treatment", label: "Unfair Treatment" },
  { category: "contractual", label: "Contractual" },
  { category: "other", label: "Other" },
];

export const GRIEVANCE_STAGES: { stage: GrievanceStage; label: string }[] = [
  { stage: "informal_raised", label: "Informal Raised" },
  { stage: "formal_submitted", label: "Formal Submitted" },
  { stage: "acknowledged", label: "Acknowledged" },
  { stage: "investigating", label: "Investigating" },
  { stage: "hearing_scheduled", label: "Hearing Scheduled" },
  { stage: "hearing_held", label: "Hearing Held" },
  { stage: "outcome_issued", label: "Outcome Issued" },
  { stage: "appeal_lodged", label: "Appeal Lodged" },
  { stage: "appeal_heard", label: "Appeal Heard" },
  { stage: "resolved", label: "Resolved" },
  { stage: "withdrawn", label: "Withdrawn" },
];

export const GRIEVANCE_OUTCOMES: { outcome: GrievanceOutcome; label: string }[] = [
  { outcome: "upheld", label: "Upheld" },
  { outcome: "partially_upheld", label: "Partially Upheld" },
  { outcome: "not_upheld", label: "Not Upheld" },
  { outcome: "withdrawn", label: "Withdrawn" },
  { outcome: "mediated", label: "Mediated" },
  { outcome: "pending", label: "Pending" },
];

export const RESOLUTION_METHODS: { method: ResolutionMethod; label: string }[] = [
  { method: "formal_outcome", label: "Formal Outcome" },
  { method: "mediation", label: "Mediation" },
  { method: "informal_resolution", label: "Informal Resolution" },
  { method: "withdrawn_by_staff", label: "Withdrawn by Staff" },
  { method: "management_action", label: "Management Action" },
  { method: "other", label: "Other" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeGrievanceMetrics(
  grievances: StaffGrievance[],
): {
  total_grievances: number;
  open_grievances: number;
  resolved_grievances: number;
  upheld_count: number;
  partially_upheld_count: number;
  not_upheld_count: number;
  appeal_count: number;
  acknowledged_rate: number | null;
  hearing_within_28_days_rate: number | null;
  average_days_to_resolution: number | null;
  acas_code_followed_rate: number | null;
  learning_identified_rate: number | null;
  impact_assessed_rate: number | null;
  union_representation_rate: number | null;
  by_category: Record<string, number>;
  by_stage: Record<string, number>;
  by_outcome: Record<string, number>;
  by_resolution_method: Record<string, number>;
} {
  const open = grievances.filter(
    (g) => g.grievance_stage !== "resolved" && g.grievance_stage !== "withdrawn",
  ).length;
  const resolved = grievances.filter((g) => g.grievance_stage === "resolved").length;

  const upheld = grievances.filter((g) => g.grievance_outcome === "upheld").length;
  const partiallyUpheld = grievances.filter((g) => g.grievance_outcome === "partially_upheld").length;
  const notUpheld = grievances.filter((g) => g.grievance_outcome === "not_upheld").length;
  const appeals = grievances.filter((g) => g.appeal_lodged).length;

  const ackRate =
    grievances.length > 0
      ? Math.round((grievances.filter((g) => g.acknowledged_within_5_days).length / grievances.length) * 1000) / 10
      : null;

  const withHearing = grievances.filter((g) => g.hearing_within_28_days !== null);
  const hearingIn28 = withHearing.filter((g) => g.hearing_within_28_days === true).length;
  const hearingRate =
    withHearing.length > 0
      ? Math.round((hearingIn28 / withHearing.length) * 1000) / 10
      : null;

  const withDays = grievances.filter((g) => g.days_to_resolution !== null);
  const avgDays =
    withDays.length > 0
      ? Math.round((withDays.reduce((sum, g) => sum + (g.days_to_resolution ?? 0), 0) / withDays.length) * 10) / 10
      : null;

  const acasFollowed = grievances.filter((g) => g.acas_code_followed).length;
  const acasRate =
    grievances.length > 0
      ? Math.round((acasFollowed / grievances.length) * 1000) / 10
      : null;

  const learningFound = grievances.filter((g) => g.learning_identified).length;
  const learningRate =
    grievances.length > 0
      ? Math.round((learningFound / grievances.length) * 1000) / 10
      : null;

  const impactAssessed = grievances.filter((g) => g.impact_on_children_assessed).length;
  const impactRate =
    grievances.length > 0
      ? Math.round((impactAssessed / grievances.length) * 1000) / 10
      : null;

  const unionRep = grievances.filter((g) => g.union_representative_present).length;
  const unionRate =
    grievances.length > 0
      ? Math.round((unionRep / grievances.length) * 1000) / 10
      : null;

  const byCategory: Record<string, number> = {};
  for (const g of grievances) byCategory[g.grievance_category] = (byCategory[g.grievance_category] ?? 0) + 1;

  const byStage: Record<string, number> = {};
  for (const g of grievances) byStage[g.grievance_stage] = (byStage[g.grievance_stage] ?? 0) + 1;

  const byOutcome: Record<string, number> = {};
  for (const g of grievances) byOutcome[g.grievance_outcome] = (byOutcome[g.grievance_outcome] ?? 0) + 1;

  const byMethod: Record<string, number> = {};
  for (const g of grievances) byMethod[g.resolution_method] = (byMethod[g.resolution_method] ?? 0) + 1;

  return {
    total_grievances: grievances.length,
    open_grievances: open,
    resolved_grievances: resolved,
    upheld_count: upheld,
    partially_upheld_count: partiallyUpheld,
    not_upheld_count: notUpheld,
    appeal_count: appeals,
    acknowledged_rate: ackRate,
    hearing_within_28_days_rate: hearingRate,
    average_days_to_resolution: avgDays,
    acas_code_followed_rate: acasRate,
    learning_identified_rate: learningRate,
    impact_assessed_rate: impactRate,
    union_representation_rate: unionRate,
    by_category: byCategory,
    by_stage: byStage,
    by_outcome: byOutcome,
    by_resolution_method: byMethod,
  };
}

export function identifyGrievanceAlerts(
  grievances: StaffGrievance[],
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

  // Bullying/harassment or discrimination
  for (const g of grievances) {
    if ((g.grievance_category === "bullying_harassment" || g.grievance_category === "discrimination") &&
        g.grievance_stage !== "resolved" && g.grievance_stage !== "withdrawn") {
      alerts.push({
        type: "serious_grievance",
        severity: "critical",
        message: `Active ${g.grievance_category.replace(/_/g, " ")} grievance from ${g.staff_name} — prioritise investigation`,
        id: g.id,
      });
    }
  }

  // ACAS code not followed
  const noAcas = grievances.filter(
    (g) => !g.acas_code_followed && g.grievance_stage !== "informal_raised" && g.grievance_stage !== "withdrawn",
  ).length;
  if (noAcas >= 1) {
    alerts.push({
      type: "acas_not_followed",
      severity: "high",
      message: `${noAcas} ${noAcas === 1 ? "grievance" : "grievances"} not following ACAS Code of Practice — review process compliance`,
      id: "acas_not_followed",
    });
  }

  // Not acknowledged within 5 days
  const notAcked = grievances.filter(
    (g) => !g.acknowledged_within_5_days && g.grievance_stage !== "withdrawn",
  ).length;
  if (notAcked >= 1) {
    alerts.push({
      type: "late_acknowledgement",
      severity: "high",
      message: `${notAcked} ${notAcked === 1 ? "grievance was" : "grievances were"} not acknowledged within 5 working days`,
      id: "late_acknowledgement",
    });
  }

  // Impact on children not assessed
  const noImpact = grievances.filter(
    (g) => !g.impact_on_children_assessed && g.grievance_stage !== "withdrawn" && g.grievance_stage !== "informal_raised",
  ).length;
  if (noImpact >= 2) {
    alerts.push({
      type: "no_impact_assessment",
      severity: "medium",
      message: `${noImpact} grievances without assessment of impact on children — ensure safeguarding considerations are addressed`,
      id: "no_impact_assessment",
    });
  }

  // Multiple grievances from same category
  const categoryCount: Record<string, number> = {};
  for (const g of grievances) {
    if (g.grievance_stage !== "withdrawn") {
      categoryCount[g.grievance_category] = (categoryCount[g.grievance_category] ?? 0) + 1;
    }
  }
  for (const [cat, count] of Object.entries(categoryCount)) {
    if (count >= 3) {
      alerts.push({
        type: "pattern_grievance",
        severity: "medium",
        message: `${count} grievances in ${cat.replace(/_/g, " ")} category — investigate systemic issues`,
        id: `pattern_${cat}`,
      });
    }
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listGrievances(
  homeId: string,
  filters?: {
    staffId?: string;
    grievanceCategory?: GrievanceCategory;
    grievanceStage?: GrievanceStage;
    limit?: number;
  },
): Promise<ServiceResult<StaffGrievance[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_staff_grievances") as SB).select("*").eq("home_id", homeId);
  if (filters?.staffId) q = q.eq("staff_id", filters.staffId);
  if (filters?.grievanceCategory) q = q.eq("grievance_category", filters.grievanceCategory);
  if (filters?.grievanceStage) q = q.eq("grievance_stage", filters.grievanceStage);
  q = q.order("grievance_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createGrievance(
  input: {
    homeId: string;
    staffName: string;
    staffId: string;
    grievanceDate: string;
    grievanceCategory: GrievanceCategory;
    grievanceStage: GrievanceStage;
    grievanceOutcome: GrievanceOutcome;
    resolutionMethod: ResolutionMethod;
    acknowledgedWithin5Days: boolean;
    hearingWithin28Days?: boolean;
    daysToResolution?: number;
    investigatingOfficer: string;
    unionRepresentativePresent: boolean;
    appealLodged: boolean;
    appealOutcome?: GrievanceOutcome;
    learningIdentified: boolean;
    learningDetails?: string;
    impactOnChildrenAssessed: boolean;
    acasCodeFollowed: boolean;
    notes?: string;
  },
): Promise<ServiceResult<StaffGrievance>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_staff_grievances") as SB)
    .insert({
      home_id: input.homeId,
      staff_name: input.staffName,
      staff_id: input.staffId,
      grievance_date: input.grievanceDate,
      grievance_category: input.grievanceCategory,
      grievance_stage: input.grievanceStage,
      grievance_outcome: input.grievanceOutcome,
      resolution_method: input.resolutionMethod,
      acknowledged_within_5_days: input.acknowledgedWithin5Days,
      hearing_within_28_days: input.hearingWithin28Days ?? null,
      days_to_resolution: input.daysToResolution ?? null,
      investigating_officer: input.investigatingOfficer,
      union_representative_present: input.unionRepresentativePresent,
      appeal_lodged: input.appealLodged,
      appeal_outcome: input.appealOutcome ?? null,
      learning_identified: input.learningIdentified,
      learning_details: input.learningDetails ?? null,
      impact_on_children_assessed: input.impactOnChildrenAssessed,
      acas_code_followed: input.acasCodeFollowed,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateGrievance(
  id: string,
  updates: Partial<Record<string, unknown>>,
): Promise<ServiceResult<StaffGrievance>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_staff_grievances") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeGrievanceMetrics,
  identifyGrievanceAlerts,
};
