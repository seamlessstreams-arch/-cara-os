// ══════════════════════════════════════════════════════════════════════════════
// CARA — VISITOR MANAGEMENT SERVICE
// Tracks visitor registration, DBS verification, purpose of visits,
// safeguarding checks, and visitor impact on children.
// CHR 2015 Reg 22 (contact and access — visitor management),
// Reg 12 (protection of children — safeguarding visitors),
// Reg 36 (fitness of premises — visitor access).
//
// Covers: visitor logs, DBS checks, safeguarding vetting,
// professional visits, family contact, and frequency tracking.
//
// SCCIF: Helped & Protected — "Visitors are appropriately vetted
// and supervised." "Children's safety is maintained."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type VisitorType =
  | "family_member"
  | "social_worker"
  | "irp"
  | "therapist"
  | "health_professional"
  | "education_professional"
  | "ofsted_inspector"
  | "placing_authority"
  | "maintenance"
  | "advocate"
  | "friend"
  | "other";

export type VisitPurpose =
  | "family_contact"
  | "professional_review"
  | "inspection"
  | "therapy_session"
  | "health_appointment"
  | "maintenance_repair"
  | "advocacy"
  | "social_visit"
  | "assessment"
  | "other";

export type DbsStatus =
  | "enhanced_verified"
  | "standard_verified"
  | "not_required"
  | "pending"
  | "expired"
  | "not_checked";

export type SupervisionLevel =
  | "unsupervised"
  | "supervised"
  | "escorted"
  | "restricted_area_only";

export interface VisitorRecord {
  id: string;
  home_id: string;
  visitor_name: string;
  visitor_type: VisitorType;
  visit_purpose: VisitPurpose;
  visit_date: string;
  arrival_time: string;
  departure_time: string | null;
  child_visited: string | null;
  dbs_status: DbsStatus;
  id_verified: boolean;
  supervision_level: SupervisionLevel;
  safeguarding_check_completed: boolean;
  signed_in: boolean;
  signed_out: boolean;
  visit_approved_by: string;
  child_informed: boolean;
  child_consent_given: boolean | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const VISITOR_TYPES: { type: VisitorType; label: string }[] = [
  { type: "family_member", label: "Family Member" },
  { type: "social_worker", label: "Social Worker" },
  { type: "irp", label: "IRP" },
  { type: "therapist", label: "Therapist" },
  { type: "health_professional", label: "Health Professional" },
  { type: "education_professional", label: "Education Professional" },
  { type: "ofsted_inspector", label: "Ofsted Inspector" },
  { type: "placing_authority", label: "Placing Authority" },
  { type: "maintenance", label: "Maintenance" },
  { type: "advocate", label: "Advocate" },
  { type: "friend", label: "Friend" },
  { type: "other", label: "Other" },
];

export const VISIT_PURPOSES: { purpose: VisitPurpose; label: string }[] = [
  { purpose: "family_contact", label: "Family Contact" },
  { purpose: "professional_review", label: "Professional Review" },
  { purpose: "inspection", label: "Inspection" },
  { purpose: "therapy_session", label: "Therapy Session" },
  { purpose: "health_appointment", label: "Health Appointment" },
  { purpose: "maintenance_repair", label: "Maintenance/Repair" },
  { purpose: "advocacy", label: "Advocacy" },
  { purpose: "social_visit", label: "Social Visit" },
  { purpose: "assessment", label: "Assessment" },
  { purpose: "other", label: "Other" },
];

export const DBS_STATUSES: { status: DbsStatus; label: string }[] = [
  { status: "enhanced_verified", label: "Enhanced — Verified" },
  { status: "standard_verified", label: "Standard — Verified" },
  { status: "not_required", label: "Not Required" },
  { status: "pending", label: "Pending" },
  { status: "expired", label: "Expired" },
  { status: "not_checked", label: "Not Checked" },
];

export const SUPERVISION_LEVELS: { level: SupervisionLevel; label: string }[] = [
  { level: "unsupervised", label: "Unsupervised" },
  { level: "supervised", label: "Supervised" },
  { level: "escorted", label: "Escorted" },
  { level: "restricted_area_only", label: "Restricted Area Only" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeVisitorMetrics(
  records: VisitorRecord[],
): {
  total_visits: number;
  unique_visitors: number;
  family_visits: number;
  professional_visits: number;
  dbs_verified_rate: number | null;
  id_verified_rate: number | null;
  safeguarding_check_rate: number | null;
  signed_in_rate: number | null;
  signed_out_rate: number | null;
  child_informed_rate: number | null;
  unsupervised_count: number;
  dbs_expired_count: number;
  dbs_not_checked_count: number;
  by_visitor_type: Record<string, number>;
  by_visit_purpose: Record<string, number>;
  by_dbs_status: Record<string, number>;
  by_supervision_level: Record<string, number>;
} {
  const uniqueVisitors = new Set(records.map((r) => r.visitor_name)).size;

  const family = records.filter(
    (r) => r.visitor_type === "family_member" || r.visitor_type === "friend",
  ).length;
  const professional = records.filter(
    (r) => r.visitor_type === "social_worker" || r.visitor_type === "irp" ||
           r.visitor_type === "therapist" || r.visitor_type === "health_professional" ||
           r.visitor_type === "education_professional" || r.visitor_type === "ofsted_inspector" ||
           r.visitor_type === "placing_authority" || r.visitor_type === "advocate",
  ).length;

  const dbsVerified = records.filter(
    (r) => r.dbs_status === "enhanced_verified" || r.dbs_status === "standard_verified",
  ).length;
  const dbsRate =
    records.length > 0
      ? Math.round((dbsVerified / records.length) * 1000) / 10
      : null;

  const idVerified = records.filter((r) => r.id_verified).length;
  const idRate =
    records.length > 0
      ? Math.round((idVerified / records.length) * 1000) / 10
      : null;

  const sgCheck = records.filter((r) => r.safeguarding_check_completed).length;
  const sgRate =
    records.length > 0
      ? Math.round((sgCheck / records.length) * 1000) / 10
      : null;

  const signedIn = records.filter((r) => r.signed_in).length;
  const siRate =
    records.length > 0
      ? Math.round((signedIn / records.length) * 1000) / 10
      : null;

  const signedOut = records.filter((r) => r.signed_out).length;
  const soRate =
    records.length > 0
      ? Math.round((signedOut / records.length) * 1000) / 10
      : null;

  const childInformed = records.filter((r) => r.child_informed).length;
  const ciRate =
    records.length > 0
      ? Math.round((childInformed / records.length) * 1000) / 10
      : null;

  const unsupervised = records.filter((r) => r.supervision_level === "unsupervised").length;
  const dbsExpired = records.filter((r) => r.dbs_status === "expired").length;
  const dbsNotChecked = records.filter((r) => r.dbs_status === "not_checked").length;

  const byType: Record<string, number> = {};
  for (const r of records) byType[r.visitor_type] = (byType[r.visitor_type] ?? 0) + 1;

  const byPurpose: Record<string, number> = {};
  for (const r of records) byPurpose[r.visit_purpose] = (byPurpose[r.visit_purpose] ?? 0) + 1;

  const byDbs: Record<string, number> = {};
  for (const r of records) byDbs[r.dbs_status] = (byDbs[r.dbs_status] ?? 0) + 1;

  const bySupervision: Record<string, number> = {};
  for (const r of records) bySupervision[r.supervision_level] = (bySupervision[r.supervision_level] ?? 0) + 1;

  return {
    total_visits: records.length,
    unique_visitors: uniqueVisitors,
    family_visits: family,
    professional_visits: professional,
    dbs_verified_rate: dbsRate,
    id_verified_rate: idRate,
    safeguarding_check_rate: sgRate,
    signed_in_rate: siRate,
    signed_out_rate: soRate,
    child_informed_rate: ciRate,
    unsupervised_count: unsupervised,
    dbs_expired_count: dbsExpired,
    dbs_not_checked_count: dbsNotChecked,
    by_visitor_type: byType,
    by_visit_purpose: byPurpose,
    by_dbs_status: byDbs,
    by_supervision_level: bySupervision,
  };
}

export function identifyVisitorAlerts(
  records: VisitorRecord[],
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

  // Unsupervised with expired/not-checked DBS
  for (const r of records) {
    if (r.supervision_level === "unsupervised" && (r.dbs_status === "expired" || r.dbs_status === "not_checked")) {
      alerts.push({
        type: "unsupervised_no_dbs",
        severity: "critical",
        message: `${r.visitor_name} had unsupervised access with ${r.dbs_status.replace(/_/g, " ")} DBS on ${r.visit_date} — safeguarding risk`,
        id: r.id,
      });
    }
  }

  // Not signed out
  const notSignedOut = records.filter((r) => r.signed_in && !r.signed_out).length;
  if (notSignedOut >= 1) {
    alerts.push({
      type: "not_signed_out",
      severity: "high",
      message: `${notSignedOut} ${notSignedOut === 1 ? "visitor has" : "visitors have"} not signed out — verify departure and update records`,
      id: "not_signed_out",
    });
  }

  // Safeguarding check not completed
  const noSgCheck = records.filter(
    (r) => !r.safeguarding_check_completed && r.supervision_level !== "restricted_area_only",
  ).length;
  if (noSgCheck >= 2) {
    alerts.push({
      type: "no_safeguarding_check",
      severity: "high",
      message: `${noSgCheck} visits without safeguarding check completed — all visitors must be vetted`,
      id: "no_safeguarding_check",
    });
  }

  // Child not informed
  const childNotInformed = records.filter(
    (r) => !r.child_informed && r.child_visited !== null,
  ).length;
  if (childNotInformed >= 2) {
    alerts.push({
      type: "child_not_informed",
      severity: "medium",
      message: `${childNotInformed} visits where the child was not informed — children should know who is visiting`,
      id: "child_not_informed",
    });
  }

  // DBS expired
  const dbsExpired = records.filter((r) => r.dbs_status === "expired").length;
  if (dbsExpired >= 1) {
    alerts.push({
      type: "dbs_expired",
      severity: "medium",
      message: `${dbsExpired} ${dbsExpired === 1 ? "visitor has" : "visitors have"} expired DBS — request renewal before next visit`,
      id: "dbs_expired",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    visitorType?: VisitorType;
    visitPurpose?: VisitPurpose;
    dbsStatus?: DbsStatus;
    limit?: number;
  },
): Promise<ServiceResult<VisitorRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_visitor_management") as SB).select("*").eq("home_id", homeId);
  if (filters?.visitorType) q = q.eq("visitor_type", filters.visitorType);
  if (filters?.visitPurpose) q = q.eq("visit_purpose", filters.visitPurpose);
  if (filters?.dbsStatus) q = q.eq("dbs_status", filters.dbsStatus);
  q = q.order("visit_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  input: {
    homeId: string;
    visitorName: string;
    visitorType: VisitorType;
    visitPurpose: VisitPurpose;
    visitDate: string;
    arrivalTime: string;
    departureTime?: string;
    childVisited?: string;
    dbsStatus: DbsStatus;
    idVerified: boolean;
    supervisionLevel: SupervisionLevel;
    safeguardingCheckCompleted: boolean;
    signedIn: boolean;
    signedOut: boolean;
    visitApprovedBy: string;
    childInformed: boolean;
    childConsentGiven?: boolean;
    notes?: string;
  },
): Promise<ServiceResult<VisitorRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_visitor_management") as SB)
    .insert({
      home_id: input.homeId,
      visitor_name: input.visitorName,
      visitor_type: input.visitorType,
      visit_purpose: input.visitPurpose,
      visit_date: input.visitDate,
      arrival_time: input.arrivalTime,
      departure_time: input.departureTime ?? null,
      child_visited: input.childVisited ?? null,
      dbs_status: input.dbsStatus,
      id_verified: input.idVerified,
      supervision_level: input.supervisionLevel,
      safeguarding_check_completed: input.safeguardingCheckCompleted,
      signed_in: input.signedIn,
      signed_out: input.signedOut,
      visit_approved_by: input.visitApprovedBy,
      child_informed: input.childInformed,
      child_consent_given: input.childConsentGiven ?? null,
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
): Promise<ServiceResult<VisitorRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_visitor_management") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeVisitorMetrics,
  identifyVisitorAlerts,
};
