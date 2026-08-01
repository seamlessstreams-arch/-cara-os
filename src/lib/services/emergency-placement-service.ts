// ══════════════════════════════════════════════════════════════════════════════
// CARA — EMERGENCY PLACEMENT SERVICE
// Manages emergency and unplanned admissions, out-of-hours placements,
// emergency protocols, and rapid response arrangements.
// CHR 2015 Reg 22 (arrangements when child is absent/goes missing),
// Reg 27 (fitness of premises), Reg 14 (assessment of children),
// Reg 36 (fitness of workers — emergency staffing).
//
// Tracks emergency admission records, placement decisions, risk
// assessments conducted under pressure, and post-admission reviews.
//
// SCCIF: Leadership & Management — "The home responds effectively
// to emergency situations." "Emergency placements are safe."
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

export type EmergencyReason =
  | "placement_breakdown"
  | "safeguarding_removal"
  | "parental_crisis"
  | "police_protection"
  | "court_order"
  | "asylum_seeker"
  | "hospital_discharge"
  | "homelessness"
  | "remand"
  | "other";

export type PlacementDecision =
  | "admitted"
  | "declined_capacity"
  | "declined_matching"
  | "declined_risk"
  | "referred_elsewhere"
  | "pending";

export type RiskAssessmentStatus =
  | "completed_pre_admission"
  | "completed_on_arrival"
  | "completed_within_24h"
  | "not_completed"
  | "partial";

export type PostAdmissionReview =
  | "completed_72h"
  | "completed_7_day"
  | "overdue"
  | "not_due"
  | "not_applicable";

export type EmergencyStatus =
  | "active"
  | "resolved"
  | "converted_planned"
  | "ended_early"
  | "ongoing_review";

export interface EmergencyPlacement {
  id: string;
  home_id: string;
  child_name: string;
  child_id: string;
  referral_date: string;
  referral_time: string;
  emergency_reason: EmergencyReason;
  referring_authority: string;
  social_worker_name: string;
  placement_decision: PlacementDecision;
  decision_made_by: string;
  decision_date: string;
  admission_date: string | null;
  risk_assessment_status: RiskAssessmentStatus;
  existing_children_consulted: boolean;
  impact_assessment_completed: boolean;
  out_of_hours: boolean;
  emergency_staffing_arranged: boolean;
  essential_info_received: boolean;
  care_plan_received: boolean;
  post_admission_review: PostAdmissionReview;
  emergency_status: EmergencyStatus;
  child_views: string | null;
  existing_children_views: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const EMERGENCY_REASONS: { reason: EmergencyReason; label: string }[] = [
  { reason: "placement_breakdown", label: "Placement Breakdown" },
  { reason: "safeguarding_removal", label: "Safeguarding Removal" },
  { reason: "parental_crisis", label: "Parental Crisis" },
  { reason: "police_protection", label: "Police Protection" },
  { reason: "court_order", label: "Court Order" },
  { reason: "asylum_seeker", label: "Asylum Seeker" },
  { reason: "hospital_discharge", label: "Hospital Discharge" },
  { reason: "homelessness", label: "Homelessness" },
  { reason: "remand", label: "Remand" },
  { reason: "other", label: "Other" },
];

export const PLACEMENT_DECISIONS: { decision: PlacementDecision; label: string }[] = [
  { decision: "admitted", label: "Admitted" },
  { decision: "declined_capacity", label: "Declined — Capacity" },
  { decision: "declined_matching", label: "Declined — Matching" },
  { decision: "declined_risk", label: "Declined — Risk" },
  { decision: "referred_elsewhere", label: "Referred Elsewhere" },
  { decision: "pending", label: "Pending" },
];

export const RISK_ASSESSMENT_STATUSES: { status: RiskAssessmentStatus; label: string }[] = [
  { status: "completed_pre_admission", label: "Completed Pre-Admission" },
  { status: "completed_on_arrival", label: "Completed on Arrival" },
  { status: "completed_within_24h", label: "Completed Within 24h" },
  { status: "not_completed", label: "Not Completed" },
  { status: "partial", label: "Partial" },
];

export const POST_ADMISSION_REVIEWS: { review: PostAdmissionReview; label: string }[] = [
  { review: "completed_72h", label: "Completed (72h)" },
  { review: "completed_7_day", label: "Completed (7 Day)" },
  { review: "overdue", label: "Overdue" },
  { review: "not_due", label: "Not Yet Due" },
  { review: "not_applicable", label: "Not Applicable" },
];

export const EMERGENCY_STATUSES: { status: EmergencyStatus; label: string }[] = [
  { status: "active", label: "Active" },
  { status: "resolved", label: "Resolved" },
  { status: "converted_planned", label: "Converted to Planned" },
  { status: "ended_early", label: "Ended Early" },
  { status: "ongoing_review", label: "Ongoing Review" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeEmergencyMetrics(
  placements: EmergencyPlacement[],
): {
  total_referrals: number;
  admitted_count: number;
  declined_count: number;
  pending_count: number;
  admission_rate: number | null;
  out_of_hours_count: number;
  out_of_hours_rate: number | null;
  risk_completed_pre_admission: number;
  risk_not_completed: number;
  existing_children_consulted_rate: number | null;
  impact_assessed_rate: number | null;
  essential_info_rate: number | null;
  care_plan_rate: number | null;
  post_review_completed_rate: number | null;
  post_review_overdue: number;
  active_emergencies: number;
  child_views_rate: number | null;
  by_emergency_reason: Record<string, number>;
  by_placement_decision: Record<string, number>;
  by_risk_status: Record<string, number>;
  by_emergency_status: Record<string, number>;
} {
  const admitted = placements.filter((p) => p.placement_decision === "admitted").length;
  const declined = placements.filter(
    (p) => p.placement_decision === "declined_capacity" || p.placement_decision === "declined_matching" || p.placement_decision === "declined_risk",
  ).length;
  const pending = placements.filter((p) => p.placement_decision === "pending").length;

  const admissionRate =
    placements.length > 0
      ? Math.round((admitted / placements.length) * 1000) / 10
      : null;

  const outOfHours = placements.filter((p) => p.out_of_hours).length;
  const oohRate =
    placements.length > 0
      ? Math.round((outOfHours / placements.length) * 1000) / 10
      : null;

  const riskPre = placements.filter((p) => p.risk_assessment_status === "completed_pre_admission").length;
  const riskNot = placements.filter((p) => p.risk_assessment_status === "not_completed").length;

  const admittedPlacements = placements.filter((p) => p.placement_decision === "admitted");

  const consulted = admittedPlacements.filter((p) => p.existing_children_consulted).length;
  const consultedRate =
    admittedPlacements.length > 0
      ? Math.round((consulted / admittedPlacements.length) * 1000) / 10
      : null;

  const impactAssessed = admittedPlacements.filter((p) => p.impact_assessment_completed).length;
  const impactRate =
    admittedPlacements.length > 0
      ? Math.round((impactAssessed / admittedPlacements.length) * 1000) / 10
      : null;

  const essentialInfo = admittedPlacements.filter((p) => p.essential_info_received).length;
  const essentialRate =
    admittedPlacements.length > 0
      ? Math.round((essentialInfo / admittedPlacements.length) * 1000) / 10
      : null;

  const carePlan = admittedPlacements.filter((p) => p.care_plan_received).length;
  const carePlanRate =
    admittedPlacements.length > 0
      ? Math.round((carePlan / admittedPlacements.length) * 1000) / 10
      : null;

  const reviewable = admittedPlacements.filter(
    (p) => p.post_admission_review !== "not_applicable" && p.post_admission_review !== "not_due",
  );
  const reviewed = reviewable.filter(
    (p) => p.post_admission_review === "completed_72h" || p.post_admission_review === "completed_7_day",
  ).length;
  const reviewRate =
    reviewable.length > 0
      ? Math.round((reviewed / reviewable.length) * 1000) / 10
      : null;
  const reviewOverdue = admittedPlacements.filter((p) => p.post_admission_review === "overdue").length;

  const active = placements.filter((p) => p.emergency_status === "active").length;

  const childViews = placements.filter((p) => p.child_views !== null).length;
  const childRate =
    placements.length > 0
      ? Math.round((childViews / placements.length) * 1000) / 10
      : null;

  const byReason: Record<string, number> = {};
  for (const p of placements) byReason[p.emergency_reason] = (byReason[p.emergency_reason] ?? 0) + 1;

  const byDecision: Record<string, number> = {};
  for (const p of placements) byDecision[p.placement_decision] = (byDecision[p.placement_decision] ?? 0) + 1;

  const byRisk: Record<string, number> = {};
  for (const p of placements) byRisk[p.risk_assessment_status] = (byRisk[p.risk_assessment_status] ?? 0) + 1;

  const byStatus: Record<string, number> = {};
  for (const p of placements) byStatus[p.emergency_status] = (byStatus[p.emergency_status] ?? 0) + 1;

  return {
    total_referrals: placements.length,
    admitted_count: admitted,
    declined_count: declined,
    pending_count: pending,
    admission_rate: admissionRate,
    out_of_hours_count: outOfHours,
    out_of_hours_rate: oohRate,
    risk_completed_pre_admission: riskPre,
    risk_not_completed: riskNot,
    existing_children_consulted_rate: consultedRate,
    impact_assessed_rate: impactRate,
    essential_info_rate: essentialRate,
    care_plan_rate: carePlanRate,
    post_review_completed_rate: reviewRate,
    post_review_overdue: reviewOverdue,
    active_emergencies: active,
    child_views_rate: childRate,
    by_emergency_reason: byReason,
    by_placement_decision: byDecision,
    by_risk_status: byRisk,
    by_emergency_status: byStatus,
  };
}

export function identifyEmergencyAlerts(
  placements: EmergencyPlacement[],
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

  // Risk assessment not completed on admitted placements
  for (const p of placements) {
    if (p.placement_decision === "admitted" && p.risk_assessment_status === "not_completed") {
      alerts.push({
        type: "risk_not_completed",
        severity: "critical",
        message: `Risk assessment not completed for ${p.child_name}'s emergency admission — complete immediately`,
        id: p.id,
      });
    }
  }

  // Post-admission review overdue
  for (const p of placements) {
    if (p.post_admission_review === "overdue") {
      alerts.push({
        type: "review_overdue",
        severity: "high",
        message: `Post-admission review overdue for ${p.child_name} — complete 72-hour or 7-day review`,
        id: p.id,
      });
    }
  }

  // Existing children not consulted
  for (const p of placements) {
    if (p.placement_decision === "admitted" && !p.existing_children_consulted) {
      alerts.push({
        type: "children_not_consulted",
        severity: "high",
        message: `Existing children not consulted about ${p.child_name}'s emergency admission — record their views`,
        id: p.id,
      });
    }
  }

  // Essential information not received
  for (const p of placements) {
    if (p.placement_decision === "admitted" && !p.essential_info_received) {
      alerts.push({
        type: "no_essential_info",
        severity: "high",
        message: `Essential information not received for ${p.child_name}'s emergency placement — chase referring authority (${p.referring_authority})`,
        id: p.id,
      });
    }
  }

  // Pending decisions
  for (const p of placements) {
    if (p.placement_decision === "pending") {
      alerts.push({
        type: "decision_pending",
        severity: "medium",
        message: `Emergency placement decision pending for ${p.child_name} (referred by ${p.referring_authority}) — decide and respond`,
        id: p.id,
      });
    }
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listPlacements(
  homeId: string,
  filters?: {
    childId?: string;
    emergencyReason?: EmergencyReason;
    placementDecision?: PlacementDecision;
    emergencyStatus?: EmergencyStatus;
    limit?: number;
  },
): Promise<ServiceResult<EmergencyPlacement[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_emergency_placements") as SB).select("*").eq("home_id", homeId);
  if (filters?.childId) q = q.eq("child_id", filters.childId);
  if (filters?.emergencyReason) q = q.eq("emergency_reason", filters.emergencyReason);
  if (filters?.placementDecision) q = q.eq("placement_decision", filters.placementDecision);
  if (filters?.emergencyStatus) q = q.eq("emergency_status", filters.emergencyStatus);
  q = q.order("referral_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createPlacement(
  input: {
    homeId: string;
    childName: string;
    childId: string;
    referralDate: string;
    referralTime: string;
    emergencyReason: EmergencyReason;
    referringAuthority: string;
    socialWorkerName: string;
    placementDecision: PlacementDecision;
    decisionMadeBy: string;
    decisionDate: string;
    admissionDate?: string;
    riskAssessmentStatus: RiskAssessmentStatus;
    existingChildrenConsulted: boolean;
    impactAssessmentCompleted: boolean;
    outOfHours: boolean;
    emergencyStaffingArranged: boolean;
    essentialInfoReceived: boolean;
    carePlanReceived: boolean;
    postAdmissionReview: PostAdmissionReview;
    emergencyStatus: EmergencyStatus;
    childViews?: string;
    existingChildrenViews?: string;
    notes?: string;
  },
): Promise<ServiceResult<EmergencyPlacement>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_emergency_placements") as SB)
    .insert({
      home_id: input.homeId,
      child_name: input.childName,
      child_id: input.childId,
      referral_date: input.referralDate,
      referral_time: input.referralTime,
      emergency_reason: input.emergencyReason,
      referring_authority: input.referringAuthority,
      social_worker_name: input.socialWorkerName,
      placement_decision: input.placementDecision,
      decision_made_by: input.decisionMadeBy,
      decision_date: input.decisionDate,
      admission_date: input.admissionDate ?? null,
      risk_assessment_status: input.riskAssessmentStatus,
      existing_children_consulted: input.existingChildrenConsulted,
      impact_assessment_completed: input.impactAssessmentCompleted,
      out_of_hours: input.outOfHours,
      emergency_staffing_arranged: input.emergencyStaffingArranged,
      essential_info_received: input.essentialInfoReceived,
      care_plan_received: input.carePlanReceived,
      post_admission_review: input.postAdmissionReview,
      emergency_status: input.emergencyStatus,
      child_views: input.childViews ?? null,
      existing_children_views: input.existingChildrenViews ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updatePlacement(
  id: string,
  updates: Partial<Record<string, unknown>>,
): Promise<ServiceResult<EmergencyPlacement>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_emergency_placements") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeEmergencyMetrics,
  identifyEmergencyAlerts,
};
