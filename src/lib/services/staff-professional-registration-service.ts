// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF PROFESSIONAL REGISTRATION SERVICE
// Tracks professional body registrations, PIN verification, renewal compliance,
// CPD hours, and fitness to practise for children's residential home staff.
//
// CHR 2015 Reg 32 (fitness of workers),
// CHR 2015 Sch 2 (information in respect of persons seeking to carry on,
// manage, or work at a children's home).
// Social Work England (Regulatory Reform) Order 2018.
//
// Covers: Professional body registration, PIN verification, CPD tracking,
// fitness to practise clearance, conditions monitoring, renewal compliance,
// multi-body registration, and regulatory status oversight.
//
// SCCIF: Leadership & Management — "Staff hold relevant professional
// registrations and meet conditions of their registration."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";

type SB = any;

export type ServiceResult<T> = { ok: boolean; data?: T; error?: string };

// ── Enums ─────────────────────────────────────────────────────────────────

export const PROFESSIONAL_BODIES = [
  "Social Work England",
  "HCPC",
  "NMC",
  "Ofsted",
  "DfE",
  "Other",
] as const;
export type ProfessionalBody = (typeof PROFESSIONAL_BODIES)[number];

export const REGISTRATION_STATUSES = [
  "Active",
  "Pending",
  "Suspended",
  "Lapsed",
  "Expired",
  "Revoked",
] as const;
export type RegistrationStatus = (typeof REGISTRATION_STATUSES)[number];

// ── Row Interface ─────────────────────────────────────────────────────────

export interface StaffProfessionalRegistrationRow {
  id: string;
  home_id: string;
  staff_name: string;
  professional_body: ProfessionalBody;
  registration_number: string;
  registration_status: RegistrationStatus;
  registration_date: string;
  expiry_date: string | null;
  pin_verified: boolean;
  pin_verification_date: string | null;
  cpd_hours_completed: number;
  cpd_hours_required: number;
  fitness_to_practise_clear: boolean;
  conditions_on_registration: boolean;
  renewal_submitted: boolean;
  renewal_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Supabase helper ───────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function sb(): any | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Metrics ───────────────────────────────────────────────────────────────

export function computeRegistrationMetrics(rows: StaffProfessionalRegistrationRow[]): {
  total_registrations: number;
  active_count: number;
  expired_count: number;
  lapsed_count: number;
  suspended_count: number;
  pin_verified_rate: number;
  cpd_compliance_rate: number;
  fitness_to_practise_rate: number;
  conditions_count: number;
  renewal_submitted_rate: number;
  unique_staff: number;
  unique_bodies: number;
} {
  const activeCount = rows.filter((r) => r.registration_status === "Active").length;
  const expiredCount = rows.filter((r) => r.registration_status === "Expired").length;
  const lapsedCount = rows.filter((r) => r.registration_status === "Lapsed").length;
  const suspendedCount = rows.filter((r) => r.registration_status === "Suspended").length;
  const conditionsCount = rows.filter((r) => r.conditions_on_registration === true).length;

  const boolRate = (field: keyof StaffProfessionalRegistrationRow) => {
    const count = rows.filter((r) => r[field] === true).length;
    return rows.length > 0 ? Math.round((count / rows.length) * 1000) / 10 : 0;
  };

  const cpdComplianceRate = (() => {
    const count = rows.filter((r) => r.cpd_hours_completed >= r.cpd_hours_required).length;
    return rows.length > 0 ? Math.round((count / rows.length) * 1000) / 10 : 0;
  })();

  return {
    total_registrations: rows.length,
    active_count: activeCount,
    expired_count: expiredCount,
    lapsed_count: lapsedCount,
    suspended_count: suspendedCount,
    pin_verified_rate: boolRate("pin_verified"),
    cpd_compliance_rate: cpdComplianceRate,
    fitness_to_practise_rate: boolRate("fitness_to_practise_clear"),
    conditions_count: conditionsCount,
    renewal_submitted_rate: boolRate("renewal_submitted"),
    unique_staff: new Set(rows.map((r) => r.staff_name)).size,
    unique_bodies: new Set(rows.map((r) => r.professional_body)).size,
  };
}

// ── Alerts ─────────────────────────────────────────────────────────────────

export function computeRegistrationAlerts(
  rows: StaffProfessionalRegistrationRow[],
): { type: string; severity: "critical" | "high" | "medium"; message: string; record_id?: string }[] {
  const alerts: { type: string; severity: "critical" | "high" | "medium"; message: string; record_id?: string }[] = [];

  // Critical: expired or revoked registration — staff must not practise
  for (const r of rows) {
    if (r.registration_status === "Expired") {
      alerts.push({
        type: "registration_expired",
        severity: "critical",
        message: `${r.staff_name} has an expired ${r.professional_body} registration (${r.registration_number}) — staff must not practise until renewed (Reg 32, Sch 2).`,
        record_id: r.id,
      });
    }
  }

  for (const r of rows) {
    if (r.registration_status === "Revoked") {
      alerts.push({
        type: "registration_revoked",
        severity: "critical",
        message: `${r.staff_name} has a revoked ${r.professional_body} registration (${r.registration_number}) — immediate action required under Reg 32.`,
        record_id: r.id,
      });
    }
  }

  // Critical: fitness to practise not clear
  for (const r of rows) {
    if (!r.fitness_to_practise_clear) {
      alerts.push({
        type: "fitness_to_practise_concern",
        severity: "critical",
        message: `${r.staff_name} has a fitness to practise concern on their ${r.professional_body} registration — review required under Reg 32.`,
        record_id: r.id,
      });
    }
  }

  // High: suspended or lapsed registration
  for (const r of rows) {
    if (r.registration_status === "Suspended") {
      alerts.push({
        type: "registration_suspended",
        severity: "high",
        message: `${r.staff_name} has a suspended ${r.professional_body} registration — staff must not practise unsupervised until reinstated.`,
        record_id: r.id,
      });
    }
  }

  for (const r of rows) {
    if (r.registration_status === "Lapsed") {
      alerts.push({
        type: "registration_lapsed",
        severity: "high",
        message: `${r.staff_name} has a lapsed ${r.professional_body} registration — renewal action required to maintain compliance.`,
        record_id: r.id,
      });
    }
  }

  // High: PIN not verified
  for (const r of rows) {
    if (!r.pin_verified) {
      alerts.push({
        type: "pin_not_verified",
        severity: "high",
        message: `${r.staff_name} has not had their ${r.professional_body} PIN verified — verification required to confirm registration validity.`,
        record_id: r.id,
      });
    }
  }

  // Medium: CPD hours incomplete
  for (const r of rows) {
    if (r.cpd_hours_completed < r.cpd_hours_required) {
      alerts.push({
        type: "cpd_hours_incomplete",
        severity: "medium",
        message: `${r.staff_name} has completed ${r.cpd_hours_completed} of ${r.cpd_hours_required} required CPD hours for ${r.professional_body} — CPD shortfall may affect renewal.`,
        record_id: r.id,
      });
    }
  }

  return alerts;
}

// ── Cara Insights ─────────────────────────────────────────────────────────

export function generateRegistrationCaraInsights(rows: StaffProfessionalRegistrationRow[]): string[] {
  const metrics = computeRegistrationMetrics(rows);
  const alerts = computeRegistrationAlerts(rows);
  const insights: string[] = [];

  // Insight 1: Summary stats (purple-themed)
  insights.push(
    `[purple] ${metrics.total_registrations} professional ${metrics.total_registrations === 1 ? "registration" : "registrations"} tracked across ${metrics.unique_staff} staff ${metrics.unique_staff === 1 ? "member" : "members"} and ${metrics.unique_bodies} professional ${metrics.unique_bodies === 1 ? "body" : "bodies"}. ` +
      `${metrics.active_count} active, ${metrics.expired_count} expired, ` +
      `${metrics.lapsed_count} lapsed, and ${metrics.suspended_count} suspended.`,
  );

  // Insight 2: Priority concerns (amber-themed)
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");
  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority alerts identified. ` +
        `${metrics.pin_verified_rate}% PIN verified, ${metrics.cpd_compliance_rate}% CPD compliant, ` +
        `and ${metrics.fitness_to_practise_rate}% fitness to practise clear.`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority alerts currently active. ` +
        `${metrics.pin_verified_rate}% PIN verified and ${metrics.cpd_compliance_rate}% CPD compliant. ` +
        `Continue monitoring registration cycles to maintain Reg 32 compliance.`,
    );
  }

  // Insight 3: Reflective question
  if (metrics.expired_count > 0) {
    insights.push(
      `[reflect] ${metrics.expired_count} ${metrics.expired_count === 1 ? "registration has" : "registrations have"} expired. ` +
        `What processes are in place to ensure timely renewal, and are staff with expired registrations ` +
        `being appropriately supervised pending renewal under Reg 32?`,
    );
  } else if (metrics.cpd_compliance_rate < 100) {
    insights.push(
      `[reflect] ${metrics.cpd_compliance_rate}% of staff meet their CPD hour requirements. ` +
        `Would implementing structured CPD planning improve compliance rates ` +
        `and support professional development under CHR 2015?`,
    );
  } else {
    insights.push(
      `[reflect] All registrations are current and CPD requirements are met. ` +
        `How can the home leverage this strong compliance position to support ` +
        `continuous professional development under CHR 2015?`,
    );
  }

  return insights;
}

// ── CRUD ──────────────────────────────────────────────────────────────────

export async function listStaffProfessionalRegistrations(
  homeId: string,
): Promise<ServiceResult<StaffProfessionalRegistrationRow[]>> {
  const client = sb();
  if (!client) return { ok: true, data: [] };
  const { data, error } = await (client.from("cs_staff_professional_registrations") as SB)
    .select("*")
    .eq("home_id", homeId)
    .order("registration_date", { ascending: false });
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as StaffProfessionalRegistrationRow[] };
}

export async function createStaffProfessionalRegistration(input: {
  homeId: string;
  staffName: string;
  professionalBody: ProfessionalBody;
  registrationNumber: string;
  registrationStatus: RegistrationStatus;
  registrationDate: string;
  expiryDate?: string | null;
  pinVerified: boolean;
  pinVerificationDate?: string | null;
  cpdHoursCompleted: number;
  cpdHoursRequired: number;
  fitnessToPractiseClear: boolean;
  conditionsOnRegistration: boolean;
  renewalSubmitted: boolean;
  renewalDate?: string | null;
  notes?: string | null;
}): Promise<ServiceResult<StaffProfessionalRegistrationRow>> {
  const client = sb();
  if (!client) return { ok: false, error: "Supabase not configured" };
  const { data, error } = await (client.from("cs_staff_professional_registrations") as SB)
    .insert({
      home_id: input.homeId,
      staff_name: input.staffName,
      professional_body: input.professionalBody,
      registration_number: input.registrationNumber,
      registration_status: input.registrationStatus,
      registration_date: input.registrationDate,
      expiry_date: input.expiryDate ?? null,
      pin_verified: input.pinVerified,
      pin_verification_date: input.pinVerificationDate ?? null,
      cpd_hours_completed: input.cpdHoursCompleted,
      cpd_hours_required: input.cpdHoursRequired,
      fitness_to_practise_clear: input.fitnessToPractiseClear,
      conditions_on_registration: input.conditionsOnRegistration,
      renewal_submitted: input.renewalSubmitted,
      renewal_date: input.renewalDate ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as StaffProfessionalRegistrationRow };
}

export async function updateStaffProfessionalRegistration(
  id: string,
  updates: Partial<Omit<StaffProfessionalRegistrationRow, "id" | "home_id" | "created_at">>,
): Promise<ServiceResult<StaffProfessionalRegistrationRow>> {
  const client = sb();
  if (!client) return { ok: false, error: "Supabase not configured" };
  const { data, error } = await (client.from("cs_staff_professional_registrations") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as StaffProfessionalRegistrationRow };
}

// ── Testing export ────────────────────────────────────────────────────────

export const _testing = { computeRegistrationMetrics, computeRegistrationAlerts, generateRegistrationCaraInsights };
