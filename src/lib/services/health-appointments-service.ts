// ══════════════════════════════════════════════════════════════════════════════
// CARA — HEALTH APPOINTMENTS SERVICE
// Tracks children's medical, dental, optician, and mental health appointments,
// ensuring timely healthcare access and follow-up.
// CHR 2015 Reg 7 (children's plan — health needs),
// Reg 10 (children's views — health decisions),
// Reg 33 (employment — health oversight duties).
//
// Covers: GP visits, dental checks, optician appointments, CAMHS,
// immunisations, health assessments, and specialist referrals.
//
// SCCIF: Health — "Children receive timely healthcare."
// "Health appointments are kept and outcomes recorded."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type AppointmentType =
  | "gp_visit"
  | "dental_check"
  | "optician"
  | "camhs"
  | "specialist"
  | "health_assessment"
  | "immunisation"
  | "hospital"
  | "sexual_health"
  | "other";

export type AppointmentStatus =
  | "attended"
  | "missed"
  | "cancelled_by_child"
  | "cancelled_by_service"
  | "rescheduled"
  | "pending";

export type AppointmentOutcome =
  | "no_concerns"
  | "treatment_given"
  | "referral_made"
  | "follow_up_needed"
  | "medication_prescribed"
  | "not_applicable";

export type ConsentStatus =
  | "consent_given"
  | "consent_refused"
  | "gillick_competent"
  | "delegated_authority"
  | "not_required";

export interface HealthAppointmentRecord {
  id: string;
  home_id: string;
  child_name: string;
  child_id: string | null;
  appointment_type: AppointmentType;
  appointment_date: string;
  appointment_status: AppointmentStatus;
  appointment_outcome: AppointmentOutcome;
  consent_status: ConsentStatus;
  child_accompanied: boolean;
  accompanied_by: string | null;
  child_views_captured: boolean;
  child_anxious: boolean;
  follow_up_date: string | null;
  follow_up_actions: string[];
  health_plan_updated: boolean;
  social_worker_informed: boolean;
  parent_carer_informed: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const APPOINTMENT_TYPES: { type: AppointmentType; label: string }[] = [
  { type: "gp_visit", label: "GP Visit" },
  { type: "dental_check", label: "Dental Check" },
  { type: "optician", label: "Optician" },
  { type: "camhs", label: "CAMHS" },
  { type: "specialist", label: "Specialist" },
  { type: "health_assessment", label: "Health Assessment" },
  { type: "immunisation", label: "Immunisation" },
  { type: "hospital", label: "Hospital" },
  { type: "sexual_health", label: "Sexual Health" },
  { type: "other", label: "Other" },
];

export const APPOINTMENT_STATUSES: { status: AppointmentStatus; label: string }[] = [
  { status: "attended", label: "Attended" },
  { status: "missed", label: "Missed" },
  { status: "cancelled_by_child", label: "Cancelled by Child" },
  { status: "cancelled_by_service", label: "Cancelled by Service" },
  { status: "rescheduled", label: "Rescheduled" },
  { status: "pending", label: "Pending" },
];

export const APPOINTMENT_OUTCOMES: { outcome: AppointmentOutcome; label: string }[] = [
  { outcome: "no_concerns", label: "No Concerns" },
  { outcome: "treatment_given", label: "Treatment Given" },
  { outcome: "referral_made", label: "Referral Made" },
  { outcome: "follow_up_needed", label: "Follow-Up Needed" },
  { outcome: "medication_prescribed", label: "Medication Prescribed" },
  { outcome: "not_applicable", label: "Not Applicable" },
];

export const CONSENT_STATUSES: { status: ConsentStatus; label: string }[] = [
  { status: "consent_given", label: "Consent Given" },
  { status: "consent_refused", label: "Consent Refused" },
  { status: "gillick_competent", label: "Gillick Competent" },
  { status: "delegated_authority", label: "Delegated Authority" },
  { status: "not_required", label: "Not Required" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeHealthAppointmentMetrics(
  records: HealthAppointmentRecord[],
): {
  total_appointments: number;
  gp_count: number;
  dental_count: number;
  optician_count: number;
  camhs_count: number;
  attended_rate: number | null;
  missed_count: number;
  cancelled_count: number;
  pending_count: number;
  child_accompanied_rate: number | null;
  child_views_captured_rate: number | null;
  child_anxious_count: number;
  health_plan_updated_rate: number | null;
  social_worker_informed_rate: number | null;
  parent_carer_informed_rate: number | null;
  follow_up_needed_count: number;
  follow_up_overdue_count: number;
  unique_children: number;
  by_appointment_type: Record<string, number>;
  by_appointment_status: Record<string, number>;
  by_appointment_outcome: Record<string, number>;
  by_consent_status: Record<string, number>;
} {
  const gp = records.filter((r) => r.appointment_type === "gp_visit").length;
  const dental = records.filter((r) => r.appointment_type === "dental_check").length;
  const optician = records.filter((r) => r.appointment_type === "optician").length;
  const camhs = records.filter((r) => r.appointment_type === "camhs").length;

  const attended = records.filter((r) => r.appointment_status === "attended").length;
  const attendedRate =
    records.length > 0
      ? Math.round((attended / records.length) * 1000) / 10
      : null;

  const missed = records.filter((r) => r.appointment_status === "missed").length;
  const cancelled = records.filter(
    (r) => r.appointment_status === "cancelled_by_child" || r.appointment_status === "cancelled_by_service",
  ).length;
  const pending = records.filter((r) => r.appointment_status === "pending").length;

  const accompanied = records.filter((r) => r.child_accompanied).length;
  const accompaniedRate =
    records.length > 0
      ? Math.round((accompanied / records.length) * 1000) / 10
      : null;

  const viewsCaptured = records.filter((r) => r.child_views_captured).length;
  const viewsRate =
    records.length > 0
      ? Math.round((viewsCaptured / records.length) * 1000) / 10
      : null;

  const anxious = records.filter((r) => r.child_anxious).length;

  const healthUpdated = records.filter((r) => r.health_plan_updated).length;
  const healthRate =
    records.length > 0
      ? Math.round((healthUpdated / records.length) * 1000) / 10
      : null;

  const swInformed = records.filter((r) => r.social_worker_informed).length;
  const swRate =
    records.length > 0
      ? Math.round((swInformed / records.length) * 1000) / 10
      : null;

  const parentInformed = records.filter((r) => r.parent_carer_informed).length;
  const parentRate =
    records.length > 0
      ? Math.round((parentInformed / records.length) * 1000) / 10
      : null;

  const followUp = records.filter((r) => r.appointment_outcome === "follow_up_needed").length;

  const now = new Date();
  const followUpOverdue = records.filter((r) => {
    if (!r.follow_up_date) return false;
    return new Date(r.follow_up_date) < now;
  }).length;

  const uniqueChildren = new Set(records.map((r) => r.child_name)).size;

  const byType: Record<string, number> = {};
  for (const r of records) byType[r.appointment_type] = (byType[r.appointment_type] ?? 0) + 1;

  const byStatus: Record<string, number> = {};
  for (const r of records) byStatus[r.appointment_status] = (byStatus[r.appointment_status] ?? 0) + 1;

  const byOutcome: Record<string, number> = {};
  for (const r of records) byOutcome[r.appointment_outcome] = (byOutcome[r.appointment_outcome] ?? 0) + 1;

  const byConsent: Record<string, number> = {};
  for (const r of records) byConsent[r.consent_status] = (byConsent[r.consent_status] ?? 0) + 1;

  return {
    total_appointments: records.length,
    gp_count: gp,
    dental_count: dental,
    optician_count: optician,
    camhs_count: camhs,
    attended_rate: attendedRate,
    missed_count: missed,
    cancelled_count: cancelled,
    pending_count: pending,
    child_accompanied_rate: accompaniedRate,
    child_views_captured_rate: viewsRate,
    child_anxious_count: anxious,
    health_plan_updated_rate: healthRate,
    social_worker_informed_rate: swRate,
    parent_carer_informed_rate: parentRate,
    follow_up_needed_count: followUp,
    follow_up_overdue_count: followUpOverdue,
    unique_children: uniqueChildren,
    by_appointment_type: byType,
    by_appointment_status: byStatus,
    by_appointment_outcome: byOutcome,
    by_consent_status: byConsent,
  };
}

export function identifyHealthAppointmentAlerts(
  records: HealthAppointmentRecord[],
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

  // Consent refused — safeguarding concern
  for (const r of records) {
    if (r.consent_status === "consent_refused" && r.appointment_status !== "attended") {
      alerts.push({
        type: "consent_refused",
        severity: "critical",
        message: `Consent refused for ${r.child_name}'s ${r.appointment_type.replace(/_/g, " ")} on ${r.appointment_date} — assess capacity and welfare`,
        id: r.id,
      });
    }
  }

  // Missed appointments
  const missed = records.filter((r) => r.appointment_status === "missed").length;
  if (missed >= 1) {
    alerts.push({
      type: "missed_appointments",
      severity: "high",
      message: `${missed} missed ${missed === 1 ? "appointment" : "appointments"} — rebook and investigate barriers`,
      id: "missed_appointments",
    });
  }

  // Follow-up overdue
  const now = new Date();
  const followUpOverdue = records.filter((r) => {
    if (!r.follow_up_date) return false;
    return new Date(r.follow_up_date) < now;
  }).length;
  if (followUpOverdue >= 1) {
    alerts.push({
      type: "follow_up_overdue",
      severity: "high",
      message: `${followUpOverdue} health ${followUpOverdue === 1 ? "follow-up is" : "follow-ups are"} overdue — arrange promptly`,
      id: "follow_up_overdue",
    });
  }

  // Child views not captured
  const noViews = records.filter((r) => !r.child_views_captured && r.appointment_status === "attended").length;
  if (noViews >= 3) {
    alerts.push({
      type: "views_not_captured",
      severity: "medium",
      message: `${noViews} attended appointments without child views captured — ensure participation`,
      id: "views_not_captured",
    });
  }

  // Health plan not updated
  const notUpdated = records.filter(
    (r) => !r.health_plan_updated && r.appointment_status === "attended" && r.appointment_outcome !== "no_concerns",
  ).length;
  if (notUpdated >= 2) {
    alerts.push({
      type: "health_plan_not_updated",
      severity: "medium",
      message: `${notUpdated} appointments where health plan not updated after treatment — review records`,
      id: "health_plan_not_updated",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    appointmentType?: AppointmentType;
    appointmentStatus?: AppointmentStatus;
    childName?: string;
    limit?: number;
  },
): Promise<ServiceResult<HealthAppointmentRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_health_appointments") as SB).select("*").eq("home_id", homeId);
  if (filters?.appointmentType) q = q.eq("appointment_type", filters.appointmentType);
  if (filters?.appointmentStatus) q = q.eq("appointment_status", filters.appointmentStatus);
  if (filters?.childName) q = q.eq("child_name", filters.childName);
  q = q.order("appointment_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  input: {
    homeId: string;
    childName: string;
    childId?: string;
    appointmentType: AppointmentType;
    appointmentDate: string;
    appointmentStatus: AppointmentStatus;
    appointmentOutcome: AppointmentOutcome;
    consentStatus: ConsentStatus;
    childAccompanied: boolean;
    accompaniedBy?: string;
    childViewsCaptured: boolean;
    childAnxious: boolean;
    followUpDate?: string;
    followUpActions: string[];
    healthPlanUpdated: boolean;
    socialWorkerInformed: boolean;
    parentCarerInformed: boolean;
    notes?: string;
  },
): Promise<ServiceResult<HealthAppointmentRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_health_appointments") as SB)
    .insert({
      home_id: input.homeId,
      child_name: input.childName,
      child_id: input.childId ?? null,
      appointment_type: input.appointmentType,
      appointment_date: input.appointmentDate,
      appointment_status: input.appointmentStatus,
      appointment_outcome: input.appointmentOutcome,
      consent_status: input.consentStatus,
      child_accompanied: input.childAccompanied,
      accompanied_by: input.accompaniedBy ?? null,
      child_views_captured: input.childViewsCaptured,
      child_anxious: input.childAnxious,
      follow_up_date: input.followUpDate ?? null,
      follow_up_actions: input.followUpActions,
      health_plan_updated: input.healthPlanUpdated,
      social_worker_informed: input.socialWorkerInformed,
      parent_carer_informed: input.parentCarerInformed,
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
): Promise<ServiceResult<HealthAppointmentRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_health_appointments") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeHealthAppointmentMetrics,
  identifyHealthAppointmentAlerts,
};
