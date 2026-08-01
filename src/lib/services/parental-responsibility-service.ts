// ══════════════════════════════════════════════════════════════════════════════
// CARA — PARENTAL RESPONSIBILITY SERVICE
// Tracks parental responsibility (PR) for each child, care order status,
// who can exercise PR, and delegated consent arrangements.
// CHR 2015 Reg 14 (care planning — PR arrangements),
// Reg 21 (privacy and access — parental involvement),
// Children Act 1989 s33 (effect of care order on PR),
// s2/s4 (acquisition of parental responsibility).
//
// Covers: care order type, PR holders, birth parent involvement,
// consent delegation, and conflict resolution.
//
// SCCIF: Overall Experiences — "The home understands who holds
// parental responsibility and how decisions should be made."
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

export type CareOrderType =
  | "section_20"
  | "interim_care_order"
  | "full_care_order"
  | "special_guardianship"
  | "child_arrangement_order"
  | "placement_order"
  | "emergency_protection_order"
  | "police_protection"
  | "secure_order"
  | "other";

export type PrHolder =
  | "birth_mother"
  | "birth_father"
  | "step_parent"
  | "local_authority"
  | "special_guardian"
  | "adoptive_parent"
  | "other";

export type PrStatus =
  | "active"
  | "shared"
  | "restricted"
  | "suspended"
  | "terminated"
  | "under_review";

export type ConsentArrangement =
  | "la_consent_required"
  | "parent_consent_required"
  | "joint_consent"
  | "delegated_to_home"
  | "court_directed"
  | "not_applicable";

export interface ParentalResponsibilityRecord {
  id: string;
  home_id: string;
  child_name: string;
  child_id: string;
  care_order_type: CareOrderType;
  care_order_date: string;
  care_order_expiry: string | null;
  pr_holder: PrHolder;
  pr_holder_name: string;
  pr_status: PrStatus;
  consent_arrangement: ConsentArrangement;
  contact_with_pr_holder: boolean;
  pr_holder_involved_in_decisions: boolean;
  pr_holder_informed_of_placement: boolean;
  conflict_between_pr_holders: boolean;
  conflict_details: string | null;
  legal_representation: boolean;
  social_worker_name: string;
  review_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const CARE_ORDER_TYPES: { type: CareOrderType; label: string }[] = [
  { type: "section_20", label: "Section 20 (Voluntary)" },
  { type: "interim_care_order", label: "Interim Care Order" },
  { type: "full_care_order", label: "Full Care Order" },
  { type: "special_guardianship", label: "Special Guardianship" },
  { type: "child_arrangement_order", label: "Child Arrangement Order" },
  { type: "placement_order", label: "Placement Order" },
  { type: "emergency_protection_order", label: "Emergency Protection Order" },
  { type: "police_protection", label: "Police Protection" },
  { type: "secure_order", label: "Secure Order" },
  { type: "other", label: "Other" },
];

export const PR_HOLDERS: { holder: PrHolder; label: string }[] = [
  { holder: "birth_mother", label: "Birth Mother" },
  { holder: "birth_father", label: "Birth Father" },
  { holder: "step_parent", label: "Step Parent" },
  { holder: "local_authority", label: "Local Authority" },
  { holder: "special_guardian", label: "Special Guardian" },
  { holder: "adoptive_parent", label: "Adoptive Parent" },
  { holder: "other", label: "Other" },
];

export const PR_STATUSES: { status: PrStatus; label: string }[] = [
  { status: "active", label: "Active" },
  { status: "shared", label: "Shared" },
  { status: "restricted", label: "Restricted" },
  { status: "suspended", label: "Suspended" },
  { status: "terminated", label: "Terminated" },
  { status: "under_review", label: "Under Review" },
];

export const CONSENT_ARRANGEMENTS: { arrangement: ConsentArrangement; label: string }[] = [
  { arrangement: "la_consent_required", label: "LA Consent Required" },
  { arrangement: "parent_consent_required", label: "Parent Consent Required" },
  { arrangement: "joint_consent", label: "Joint Consent" },
  { arrangement: "delegated_to_home", label: "Delegated to Home" },
  { arrangement: "court_directed", label: "Court Directed" },
  { arrangement: "not_applicable", label: "Not Applicable" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computePrMetrics(
  records: ParentalResponsibilityRecord[],
  totalChildren: number,
): {
  total_records: number;
  children_covered: number;
  coverage_rate: number | null;
  active_pr_count: number;
  shared_pr_count: number;
  restricted_pr_count: number;
  suspended_pr_count: number;
  section_20_count: number;
  full_care_order_count: number;
  interim_care_order_count: number;
  contact_with_pr_holder_rate: number | null;
  pr_holder_involved_rate: number | null;
  pr_holder_informed_rate: number | null;
  conflict_count: number;
  review_overdue_count: number;
  by_care_order_type: Record<string, number>;
  by_pr_holder: Record<string, number>;
  by_pr_status: Record<string, number>;
  by_consent_arrangement: Record<string, number>;
} {
  const uniqueChildren = new Set(records.map((r) => r.child_id)).size;
  const coverageRate =
    totalChildren > 0
      ? Math.round((uniqueChildren / totalChildren) * 1000) / 10
      : null;

  const active = records.filter((r) => r.pr_status === "active").length;
  const shared = records.filter((r) => r.pr_status === "shared").length;
  const restricted = records.filter((r) => r.pr_status === "restricted").length;
  const suspended = records.filter((r) => r.pr_status === "suspended").length;

  const s20 = records.filter((r) => r.care_order_type === "section_20").length;
  const fullCO = records.filter((r) => r.care_order_type === "full_care_order").length;
  const interimCO = records.filter((r) => r.care_order_type === "interim_care_order").length;

  const contactRate =
    records.length > 0
      ? Math.round((records.filter((r) => r.contact_with_pr_holder).length / records.length) * 1000) / 10
      : null;

  const involvedRate =
    records.length > 0
      ? Math.round((records.filter((r) => r.pr_holder_involved_in_decisions).length / records.length) * 1000) / 10
      : null;

  const informedRate =
    records.length > 0
      ? Math.round((records.filter((r) => r.pr_holder_informed_of_placement).length / records.length) * 1000) / 10
      : null;

  const conflicts = records.filter((r) => r.conflict_between_pr_holders).length;

  const now = new Date();
  const reviewOverdue = records.filter(
    (r) => r.review_date && new Date(r.review_date) < now && r.pr_status !== "terminated",
  ).length;

  const byOrder: Record<string, number> = {};
  for (const r of records) byOrder[r.care_order_type] = (byOrder[r.care_order_type] ?? 0) + 1;

  const byHolder: Record<string, number> = {};
  for (const r of records) byHolder[r.pr_holder] = (byHolder[r.pr_holder] ?? 0) + 1;

  const byStatus: Record<string, number> = {};
  for (const r of records) byStatus[r.pr_status] = (byStatus[r.pr_status] ?? 0) + 1;

  const byConsent: Record<string, number> = {};
  for (const r of records) byConsent[r.consent_arrangement] = (byConsent[r.consent_arrangement] ?? 0) + 1;

  return {
    total_records: records.length,
    children_covered: uniqueChildren,
    coverage_rate: coverageRate,
    active_pr_count: active,
    shared_pr_count: shared,
    restricted_pr_count: restricted,
    suspended_pr_count: suspended,
    section_20_count: s20,
    full_care_order_count: fullCO,
    interim_care_order_count: interimCO,
    contact_with_pr_holder_rate: contactRate,
    pr_holder_involved_rate: involvedRate,
    pr_holder_informed_rate: informedRate,
    conflict_count: conflicts,
    review_overdue_count: reviewOverdue,
    by_care_order_type: byOrder,
    by_pr_holder: byHolder,
    by_pr_status: byStatus,
    by_consent_arrangement: byConsent,
  };
}

export function identifyPrAlerts(
  records: ParentalResponsibilityRecord[],
  totalChildren: number,
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

  // Children with no PR records
  const childrenCovered = new Set(records.map((r) => r.child_id)).size;
  if (totalChildren > 0 && childrenCovered < totalChildren) {
    const gap = totalChildren - childrenCovered;
    alerts.push({
      type: "no_pr_record",
      severity: "critical",
      message: `${gap} ${gap === 1 ? "child has" : "children have"} no parental responsibility records — PR must be documented for every child`,
      id: "pr_gap",
    });
  }

  // PR holder not informed of placement
  for (const r of records) {
    if (!r.pr_holder_informed_of_placement && r.pr_status !== "terminated" && r.pr_status !== "suspended") {
      alerts.push({
        type: "pr_holder_not_informed",
        severity: "high",
        message: `PR holder (${r.pr_holder_name}) not informed of ${r.child_name}'s placement — legal obligation to inform`,
        id: r.id,
      });
    }
  }

  // Conflict between PR holders
  for (const r of records) {
    if (r.conflict_between_pr_holders) {
      alerts.push({
        type: "pr_conflict",
        severity: "high",
        message: `Conflict between PR holders for ${r.child_name} — ${r.conflict_details ?? "resolve with social worker and legal advice"}`,
        id: r.id,
      });
    }
  }

  // Care order expiring soon
  const now = new Date();
  const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  for (const r of records) {
    if (r.care_order_expiry) {
      const expiry = new Date(r.care_order_expiry);
      if (expiry > now && expiry <= thirtyDays) {
        alerts.push({
          type: "care_order_expiring",
          severity: "high",
          message: `Care order for ${r.child_name} (${r.care_order_type.replace(/_/g, " ")}) expires ${r.care_order_expiry} — ensure renewal or alternative arrangements`,
          id: r.id,
        });
      }
    }
  }

  // Section 20 — parent can withdraw at any time
  const s20Records = records.filter((r) => r.care_order_type === "section_20" && r.pr_status !== "terminated");
  if (s20Records.length > 0) {
    alerts.push({
      type: "section_20_notice",
      severity: "medium",
      message: `${s20Records.length} ${s20Records.length === 1 ? "child is" : "children are"} accommodated under Section 20 — parents can withdraw consent at any time`,
      id: "section_20",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    childId?: string;
    careOrderType?: CareOrderType;
    prStatus?: PrStatus;
    limit?: number;
  },
): Promise<ServiceResult<ParentalResponsibilityRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_parental_responsibility") as SB).select("*").eq("home_id", homeId);
  if (filters?.childId) q = q.eq("child_id", filters.childId);
  if (filters?.careOrderType) q = q.eq("care_order_type", filters.careOrderType);
  if (filters?.prStatus) q = q.eq("pr_status", filters.prStatus);
  q = q.order("created_at", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  input: {
    homeId: string;
    childName: string;
    childId: string;
    careOrderType: CareOrderType;
    careOrderDate: string;
    careOrderExpiry?: string;
    prHolder: PrHolder;
    prHolderName: string;
    prStatus: PrStatus;
    consentArrangement: ConsentArrangement;
    contactWithPrHolder: boolean;
    prHolderInvolvedInDecisions: boolean;
    prHolderInformedOfPlacement: boolean;
    conflictBetweenPrHolders: boolean;
    conflictDetails?: string;
    legalRepresentation: boolean;
    socialWorkerName: string;
    reviewDate?: string;
    notes?: string;
  },
): Promise<ServiceResult<ParentalResponsibilityRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_parental_responsibility") as SB)
    .insert({
      home_id: input.homeId,
      child_name: input.childName,
      child_id: input.childId,
      care_order_type: input.careOrderType,
      care_order_date: input.careOrderDate,
      care_order_expiry: input.careOrderExpiry ?? null,
      pr_holder: input.prHolder,
      pr_holder_name: input.prHolderName,
      pr_status: input.prStatus,
      consent_arrangement: input.consentArrangement,
      contact_with_pr_holder: input.contactWithPrHolder,
      pr_holder_involved_in_decisions: input.prHolderInvolvedInDecisions,
      pr_holder_informed_of_placement: input.prHolderInformedOfPlacement,
      conflict_between_pr_holders: input.conflictBetweenPrHolders,
      conflict_details: input.conflictDetails ?? null,
      legal_representation: input.legalRepresentation,
      social_worker_name: input.socialWorkerName,
      review_date: input.reviewDate ?? null,
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
): Promise<ServiceResult<ParentalResponsibilityRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_parental_responsibility") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computePrMetrics,
  identifyPrAlerts,
};
