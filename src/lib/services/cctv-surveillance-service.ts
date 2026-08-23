// ══════════════════════════════════════════════════════════════════════════════
// CARA — CCTV & SURVEILLANCE SERVICE
// Tracks CCTV systems, data protection compliance, access logs,
// retention schedules, and privacy impact assessments.
// CHR 2015 Reg 36 (fitness of premises — surveillance),
// Reg 12 (protection — safeguarding evidence),
// ICO CCTV Code of Practice, GDPR Article 6.
//
// Covers: camera locations, recording schedules, data retention,
// access requests, footage reviews, and privacy compliance.
//
// SCCIF: Helped & Protected — "CCTV is used proportionately
// and in line with data protection law."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type CctvEventType =
  | "system_check"
  | "footage_review"
  | "access_request"
  | "retention_review"
  | "privacy_impact_assessment"
  | "signage_check"
  | "data_breach"
  | "maintenance"
  | "other";

export type CameraLocation =
  | "entrance"
  | "exit"
  | "communal_area"
  | "garden"
  | "car_park"
  | "corridor"
  | "kitchen"
  | "office"
  | "other";

export type ComplianceStatus =
  | "compliant"
  | "partially_compliant"
  | "non_compliant"
  | "not_assessed";

export type RetentionStatus =
  | "within_schedule"
  | "overdue_deletion"
  | "extended_retention"
  | "not_checked";

export interface CctvRecord {
  id: string;
  home_id: string;
  event_type: CctvEventType;
  event_date: string;
  camera_location: CameraLocation;
  compliance_status: ComplianceStatus;
  retention_status: RetentionStatus;
  gdpr_compliant: boolean;
  signage_visible: boolean;
  children_informed: boolean;
  staff_informed: boolean;
  footage_accessed: boolean;
  accessed_by: string | null;
  access_reason: string | null;
  privacy_impact_completed: boolean;
  data_protection_officer_consulted: boolean;
  issues_found: string[];
  actions_taken: string[];
  reviewed_by: string;
  next_review_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const CCTV_EVENT_TYPES: { type: CctvEventType; label: string }[] = [
  { type: "system_check", label: "System Check" },
  { type: "footage_review", label: "Footage Review" },
  { type: "access_request", label: "Access Request" },
  { type: "retention_review", label: "Retention Review" },
  { type: "privacy_impact_assessment", label: "Privacy Impact Assessment" },
  { type: "signage_check", label: "Signage Check" },
  { type: "data_breach", label: "Data Breach" },
  { type: "maintenance", label: "Maintenance" },
  { type: "other", label: "Other" },
];

export const CAMERA_LOCATIONS: { location: CameraLocation; label: string }[] = [
  { location: "entrance", label: "Entrance" },
  { location: "exit", label: "Exit" },
  { location: "communal_area", label: "Communal Area" },
  { location: "garden", label: "Garden" },
  { location: "car_park", label: "Car Park" },
  { location: "corridor", label: "Corridor" },
  { location: "kitchen", label: "Kitchen" },
  { location: "office", label: "Office" },
  { location: "other", label: "Other" },
];

export const COMPLIANCE_STATUSES: { status: ComplianceStatus; label: string }[] = [
  { status: "compliant", label: "Compliant" },
  { status: "partially_compliant", label: "Partially Compliant" },
  { status: "non_compliant", label: "Non-Compliant" },
  { status: "not_assessed", label: "Not Assessed" },
];

export const RETENTION_STATUSES: { status: RetentionStatus; label: string }[] = [
  { status: "within_schedule", label: "Within Schedule" },
  { status: "overdue_deletion", label: "Overdue Deletion" },
  { status: "extended_retention", label: "Extended Retention" },
  { status: "not_checked", label: "Not Checked" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeCctvMetrics(
  records: CctvRecord[],
): {
  total_records: number;
  system_check_count: number;
  footage_review_count: number;
  access_request_count: number;
  data_breach_count: number;
  compliant_rate: number | null;
  non_compliant_count: number;
  gdpr_compliant_rate: number | null;
  signage_visible_rate: number | null;
  children_informed_rate: number | null;
  staff_informed_rate: number | null;
  privacy_impact_completed_rate: number | null;
  overdue_deletion_count: number;
  review_overdue_count: number;
  by_event_type: Record<string, number>;
  by_camera_location: Record<string, number>;
  by_compliance_status: Record<string, number>;
  by_retention_status: Record<string, number>;
} {
  const systemCheck = records.filter((r) => r.event_type === "system_check").length;
  const footageReview = records.filter((r) => r.event_type === "footage_review").length;
  const accessRequest = records.filter((r) => r.event_type === "access_request").length;
  const dataBreach = records.filter((r) => r.event_type === "data_breach").length;

  const compliant = records.filter((r) => r.compliance_status === "compliant").length;
  const compliantRate =
    records.length > 0
      ? Math.round((compliant / records.length) * 1000) / 10
      : null;

  const nonCompliant = records.filter((r) => r.compliance_status === "non_compliant").length;

  const gdpr = records.filter((r) => r.gdpr_compliant).length;
  const gdprRate =
    records.length > 0
      ? Math.round((gdpr / records.length) * 1000) / 10
      : null;

  const signage = records.filter((r) => r.signage_visible).length;
  const signageRate =
    records.length > 0
      ? Math.round((signage / records.length) * 1000) / 10
      : null;

  const childrenInformed = records.filter((r) => r.children_informed).length;
  const childrenRate =
    records.length > 0
      ? Math.round((childrenInformed / records.length) * 1000) / 10
      : null;

  const staffInformed = records.filter((r) => r.staff_informed).length;
  const staffRate =
    records.length > 0
      ? Math.round((staffInformed / records.length) * 1000) / 10
      : null;

  const piaCompleted = records.filter((r) => r.privacy_impact_completed).length;
  const piaRate =
    records.length > 0
      ? Math.round((piaCompleted / records.length) * 1000) / 10
      : null;

  const overdueDeletion = records.filter((r) => r.retention_status === "overdue_deletion").length;

  const now = new Date();
  const reviewOverdue = records.filter((r) => {
    if (!r.next_review_date) return false;
    return new Date(r.next_review_date) < now;
  }).length;

  const byType: Record<string, number> = {};
  for (const r of records) byType[r.event_type] = (byType[r.event_type] ?? 0) + 1;

  const byLocation: Record<string, number> = {};
  for (const r of records) byLocation[r.camera_location] = (byLocation[r.camera_location] ?? 0) + 1;

  const byCompliance: Record<string, number> = {};
  for (const r of records) byCompliance[r.compliance_status] = (byCompliance[r.compliance_status] ?? 0) + 1;

  const byRetention: Record<string, number> = {};
  for (const r of records) byRetention[r.retention_status] = (byRetention[r.retention_status] ?? 0) + 1;

  return {
    total_records: records.length,
    system_check_count: systemCheck,
    footage_review_count: footageReview,
    access_request_count: accessRequest,
    data_breach_count: dataBreach,
    compliant_rate: compliantRate,
    non_compliant_count: nonCompliant,
    gdpr_compliant_rate: gdprRate,
    signage_visible_rate: signageRate,
    children_informed_rate: childrenRate,
    staff_informed_rate: staffRate,
    privacy_impact_completed_rate: piaRate,
    overdue_deletion_count: overdueDeletion,
    review_overdue_count: reviewOverdue,
    by_event_type: byType,
    by_camera_location: byLocation,
    by_compliance_status: byCompliance,
    by_retention_status: byRetention,
  };
}

export function identifyCctvAlerts(
  records: CctvRecord[],
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

  // Data breach
  for (const r of records) {
    if (r.event_type === "data_breach") {
      alerts.push({
        type: "data_breach",
        severity: "critical",
        message: `CCTV data breach on ${r.event_date} at ${r.camera_location.replace(/_/g, " ")} — report to ICO if required`,
        id: r.id,
      });
    }
  }

  // Non-compliant
  for (const r of records) {
    if (r.compliance_status === "non_compliant") {
      alerts.push({
        type: "non_compliant",
        severity: "high",
        message: `Non-compliant CCTV finding at ${r.camera_location.replace(/_/g, " ")} on ${r.event_date} — address immediately`,
        id: r.id,
      });
    }
  }

  // Overdue data deletion
  const overdue = records.filter((r) => r.retention_status === "overdue_deletion").length;
  if (overdue >= 1) {
    alerts.push({
      type: "overdue_deletion",
      severity: "high",
      message: `${overdue} CCTV ${overdue === 1 ? "recording" : "recordings"} overdue for deletion — GDPR breach risk`,
      id: "overdue_deletion",
    });
  }

  // Children not informed
  const notInformed = records.filter((r) => !r.children_informed).length;
  if (notInformed >= 2) {
    alerts.push({
      type: "children_not_informed",
      severity: "medium",
      message: `${notInformed} CCTV records where children were not informed — ensure transparency`,
      id: "children_not_informed",
    });
  }

  // Review overdue
  const now = new Date();
  const reviewOverdue = records.filter((r) => {
    if (!r.next_review_date) return false;
    return new Date(r.next_review_date) < now;
  }).length;
  if (reviewOverdue >= 1) {
    alerts.push({
      type: "review_overdue",
      severity: "medium",
      message: `${reviewOverdue} CCTV ${reviewOverdue === 1 ? "review is" : "reviews are"} overdue — schedule promptly`,
      id: "review_overdue",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    eventType?: CctvEventType;
    cameraLocation?: CameraLocation;
    complianceStatus?: ComplianceStatus;
    limit?: number;
  },
): Promise<ServiceResult<CctvRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_cctv_surveillance") as SB).select("*").eq("home_id", homeId);
  if (filters?.eventType) q = q.eq("event_type", filters.eventType);
  if (filters?.cameraLocation) q = q.eq("camera_location", filters.cameraLocation);
  if (filters?.complianceStatus) q = q.eq("compliance_status", filters.complianceStatus);
  q = q.order("event_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  input: {
    homeId: string;
    eventType: CctvEventType;
    eventDate: string;
    cameraLocation: CameraLocation;
    complianceStatus: ComplianceStatus;
    retentionStatus: RetentionStatus;
    gdprCompliant: boolean;
    signageVisible: boolean;
    childrenInformed: boolean;
    staffInformed: boolean;
    footageAccessed: boolean;
    accessedBy?: string;
    accessReason?: string;
    privacyImpactCompleted: boolean;
    dataProtectionOfficerConsulted: boolean;
    issuesFound: string[];
    actionsTaken: string[];
    reviewedBy: string;
    nextReviewDate?: string;
    notes?: string;
  },
): Promise<ServiceResult<CctvRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_cctv_surveillance") as SB)
    .insert({
      home_id: input.homeId,
      event_type: input.eventType,
      event_date: input.eventDate,
      camera_location: input.cameraLocation,
      compliance_status: input.complianceStatus,
      retention_status: input.retentionStatus,
      gdpr_compliant: input.gdprCompliant,
      signage_visible: input.signageVisible,
      children_informed: input.childrenInformed,
      staff_informed: input.staffInformed,
      footage_accessed: input.footageAccessed,
      accessed_by: input.accessedBy ?? null,
      access_reason: input.accessReason ?? null,
      privacy_impact_completed: input.privacyImpactCompleted,
      data_protection_officer_consulted: input.dataProtectionOfficerConsulted,
      issues_found: input.issuesFound,
      actions_taken: input.actionsTaken,
      reviewed_by: input.reviewedBy,
      next_review_date: input.nextReviewDate ?? null,
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
): Promise<ServiceResult<CctvRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_cctv_surveillance") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeCctvMetrics,
  identifyCctvAlerts,
};
