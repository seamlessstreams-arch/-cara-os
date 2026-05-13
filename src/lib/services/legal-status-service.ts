// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — LEGAL STATUS SERVICE
// Manages children's legal status, court orders, care order conditions,
// placement orders, and legal milestone tracking.
// CHR 2015 Reg 8 (parental responsibility — legal framework),
// Reg 36 (records — legal status documentation),
// Children Act 1989 (s.20, s.31, s.38, s.44).
//
// Tracks current legal status, order types, conditions, court dates,
// solicitor details, and ensures staff understand the legal framework
// for each child.
//
// SCCIF: Well-Led — "Staff understand each child's legal status
// and its implications for their care."
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

export type LegalStatus =
  | "section_20"
  | "section_31_full"
  | "section_31_interim"
  | "section_38"
  | "section_44"
  | "section_46"
  | "placement_order"
  | "special_guardianship"
  | "child_arrangement"
  | "secure_order"
  | "remand"
  | "other";

export type OrderType =
  | "care_order"
  | "interim_care_order"
  | "emergency_protection"
  | "police_protection"
  | "placement_order"
  | "supervision_order"
  | "child_arrangement_order"
  | "special_guardianship_order"
  | "secure_accommodation"
  | "deprivation_of_liberty"
  | "other";

export type CourtType =
  | "family_court"
  | "high_court"
  | "crown_court"
  | "magistrates"
  | "youth_court"
  | "other";

export type HearingOutcome =
  | "order_granted"
  | "order_refused"
  | "order_varied"
  | "order_discharged"
  | "adjourned"
  | "directions_given"
  | "consent_order"
  | "pending";

export interface LegalRecord {
  id: string;
  home_id: string;
  child_name: string;
  child_id: string;
  legal_status: LegalStatus;
  order_type: OrderType | null;
  order_date: string | null;
  order_expiry: string | null;
  court_type: CourtType | null;
  court_name: string | null;
  conditions: string[];
  solicitor_name: string | null;
  solicitor_contact: string | null;
  guardian_name: string | null;
  parental_responsibility: string[];
  contact_conditions: string | null;
  next_hearing_date: string | null;
  last_hearing_outcome: HearingOutcome | null;
  staff_briefed: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const LEGAL_STATUSES: { status: LegalStatus; label: string }[] = [
  { status: "section_20", label: "Section 20 (Voluntary)" },
  { status: "section_31_full", label: "Section 31 (Full Care Order)" },
  { status: "section_31_interim", label: "Section 31 (Interim Care Order)" },
  { status: "section_38", label: "Section 38 (Interim Care Order)" },
  { status: "section_44", label: "Section 44 (Emergency Protection)" },
  { status: "section_46", label: "Section 46 (Police Protection)" },
  { status: "placement_order", label: "Placement Order" },
  { status: "special_guardianship", label: "Special Guardianship" },
  { status: "child_arrangement", label: "Child Arrangement Order" },
  { status: "secure_order", label: "Secure Accommodation Order" },
  { status: "remand", label: "Remand" },
  { status: "other", label: "Other" },
];

export const ORDER_TYPES: { type: OrderType; label: string }[] = [
  { type: "care_order", label: "Care Order" },
  { type: "interim_care_order", label: "Interim Care Order" },
  { type: "emergency_protection", label: "Emergency Protection Order" },
  { type: "police_protection", label: "Police Protection" },
  { type: "placement_order", label: "Placement Order" },
  { type: "supervision_order", label: "Supervision Order" },
  { type: "child_arrangement_order", label: "Child Arrangement Order" },
  { type: "special_guardianship_order", label: "Special Guardianship Order" },
  { type: "secure_accommodation", label: "Secure Accommodation Order" },
  { type: "deprivation_of_liberty", label: "Deprivation of Liberty" },
  { type: "other", label: "Other" },
];

export const COURT_TYPES: { type: CourtType; label: string }[] = [
  { type: "family_court", label: "Family Court" },
  { type: "high_court", label: "High Court" },
  { type: "crown_court", label: "Crown Court" },
  { type: "magistrates", label: "Magistrates Court" },
  { type: "youth_court", label: "Youth Court" },
  { type: "other", label: "Other" },
];

export const HEARING_OUTCOMES: { outcome: HearingOutcome; label: string }[] = [
  { outcome: "order_granted", label: "Order Granted" },
  { outcome: "order_refused", label: "Order Refused" },
  { outcome: "order_varied", label: "Order Varied" },
  { outcome: "order_discharged", label: "Order Discharged" },
  { outcome: "adjourned", label: "Adjourned" },
  { outcome: "directions_given", label: "Directions Given" },
  { outcome: "consent_order", label: "Consent Order" },
  { outcome: "pending", label: "Pending" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

/**
 * Compute legal status metrics.
 */
export function computeLegalMetrics(
  records: LegalRecord[],
  totalChildren: number,
  now: Date = new Date(),
): {
  total_records: number;
  children_with_records: number;
  legal_coverage: number;
  section_20_count: number;
  full_care_order_count: number;
  interim_care_order_count: number;
  placement_order_count: number;
  staff_briefed_rate: number;
  upcoming_hearings: number;
  orders_expiring_soon: number;
  with_conditions: number;
  with_solicitor: number;
  by_legal_status: Record<string, number>;
  by_order_type: Record<string, number>;
  by_hearing_outcome: Record<string, number>;
} {
  const uniqueChildren = new Set(records.map((r) => r.child_id)).size;
  const coverage =
    totalChildren > 0
      ? Math.round((uniqueChildren / totalChildren) * 1000) / 10
      : 0;

  const s20 = records.filter((r) => r.legal_status === "section_20").length;
  const fullCare = records.filter((r) => r.legal_status === "section_31_full").length;
  const interimCare = records.filter(
    (r) => r.legal_status === "section_31_interim" || r.legal_status === "section_38",
  ).length;
  const placementOrder = records.filter((r) => r.legal_status === "placement_order").length;

  const staffBriefed = records.filter((r) => r.staff_briefed).length;
  const briefedRate =
    records.length > 0
      ? Math.round((staffBriefed / records.length) * 1000) / 10
      : 0;

  // Upcoming hearings (within 30 days)
  const thirtyDaysAhead = new Date(now);
  thirtyDaysAhead.setDate(thirtyDaysAhead.getDate() + 30);
  const upcomingHearings = records.filter(
    (r) =>
      r.next_hearing_date &&
      new Date(r.next_hearing_date) >= now &&
      new Date(r.next_hearing_date) <= thirtyDaysAhead,
  ).length;

  // Orders expiring within 30 days
  const ordersExpiring = records.filter(
    (r) =>
      r.order_expiry &&
      new Date(r.order_expiry) >= now &&
      new Date(r.order_expiry) <= thirtyDaysAhead,
  ).length;

  const withConditions = records.filter((r) => r.conditions.length > 0).length;
  const withSolicitor = records.filter((r) => r.solicitor_name !== null).length;

  // By legal status
  const byLegalStatus: Record<string, number> = {};
  for (const r of records) {
    byLegalStatus[r.legal_status] = (byLegalStatus[r.legal_status] ?? 0) + 1;
  }

  // By order type
  const byOrderType: Record<string, number> = {};
  for (const r of records) {
    if (r.order_type) {
      byOrderType[r.order_type] = (byOrderType[r.order_type] ?? 0) + 1;
    }
  }

  // By hearing outcome
  const byHearingOutcome: Record<string, number> = {};
  for (const r of records) {
    if (r.last_hearing_outcome) {
      byHearingOutcome[r.last_hearing_outcome] =
        (byHearingOutcome[r.last_hearing_outcome] ?? 0) + 1;
    }
  }

  return {
    total_records: records.length,
    children_with_records: uniqueChildren,
    legal_coverage: coverage,
    section_20_count: s20,
    full_care_order_count: fullCare,
    interim_care_order_count: interimCare,
    placement_order_count: placementOrder,
    staff_briefed_rate: briefedRate,
    upcoming_hearings: upcomingHearings,
    orders_expiring_soon: ordersExpiring,
    with_conditions: withConditions,
    with_solicitor: withSolicitor,
    by_legal_status: byLegalStatus,
    by_order_type: byOrderType,
    by_hearing_outcome: byHearingOutcome,
  };
}

/**
 * Identify legal status alerts.
 */
export function identifyLegalAlerts(
  records: LegalRecord[],
  totalChildren: number,
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

  // Children without legal records
  const childrenWithRecords = new Set(records.map((r) => r.child_id));
  if (totalChildren > 0 && childrenWithRecords.size < totalChildren) {
    const gap = totalChildren - childrenWithRecords.size;
    alerts.push({
      type: "no_legal_record",
      severity: "critical",
      message: `${gap} ${gap === 1 ? "child does" : "children do"} not have a legal status record — all children must have their legal framework documented`,
      id: "legal_gap",
    });
  }

  // Staff not briefed
  for (const r of records) {
    if (!r.staff_briefed) {
      alerts.push({
        type: "staff_not_briefed",
        severity: "high",
        message: `Staff not briefed on legal status for ${r.child_name} (${r.legal_status.replace(/_/g, " ")}) — all staff must understand the legal framework`,
        id: r.id,
      });
    }
  }

  // Upcoming court hearings within 7 days
  const sevenDaysAhead = new Date(now);
  sevenDaysAhead.setDate(sevenDaysAhead.getDate() + 7);
  for (const r of records) {
    if (
      r.next_hearing_date &&
      new Date(r.next_hearing_date) >= now &&
      new Date(r.next_hearing_date) <= sevenDaysAhead
    ) {
      alerts.push({
        type: "hearing_imminent",
        severity: "high",
        message: `Court hearing for ${r.child_name} on ${r.next_hearing_date} at ${r.court_name ?? "court"} — ensure preparation is complete`,
        id: r.id,
      });
    }
  }

  // Order expiring soon (within 14 days)
  const fourteenDaysAhead = new Date(now);
  fourteenDaysAhead.setDate(fourteenDaysAhead.getDate() + 14);
  for (const r of records) {
    if (
      r.order_expiry &&
      new Date(r.order_expiry) >= now &&
      new Date(r.order_expiry) <= fourteenDaysAhead
    ) {
      alerts.push({
        type: "order_expiring",
        severity: "critical",
        message: `${r.order_type?.replace(/_/g, " ") ?? "Order"} for ${r.child_name} expires ${r.order_expiry} — ensure renewal or alternative arrangements`,
        id: r.id,
      });
    }
  }

  // Section 20 without parental responsibility clarity
  for (const r of records) {
    if (r.legal_status === "section_20" && r.parental_responsibility.length === 0) {
      alerts.push({
        type: "pr_not_documented",
        severity: "high",
        message: `${r.child_name} is accommodated under s.20 but parental responsibility holders not documented — clarify and record`,
        id: r.id,
      });
    }
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    childId?: string;
    legalStatus?: LegalStatus;
    limit?: number;
  },
): Promise<ServiceResult<LegalRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_legal_records") as SB).select("*").eq("home_id", homeId);
  if (filters?.childId) q = q.eq("child_id", filters.childId);
  if (filters?.legalStatus) q = q.eq("legal_status", filters.legalStatus);
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
    legalStatus: LegalStatus;
    orderType?: OrderType;
    orderDate?: string;
    orderExpiry?: string;
    courtType?: CourtType;
    courtName?: string;
    conditions: string[];
    solicitorName?: string;
    solicitorContact?: string;
    guardianName?: string;
    parentalResponsibility: string[];
    contactConditions?: string;
    nextHearingDate?: string;
    notes?: string;
  },
): Promise<ServiceResult<LegalRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_legal_records") as SB)
    .insert({
      home_id: input.homeId,
      child_name: input.childName,
      child_id: input.childId,
      legal_status: input.legalStatus,
      order_type: input.orderType ?? null,
      order_date: input.orderDate ?? null,
      order_expiry: input.orderExpiry ?? null,
      court_type: input.courtType ?? null,
      court_name: input.courtName ?? null,
      conditions: input.conditions,
      solicitor_name: input.solicitorName ?? null,
      solicitor_contact: input.solicitorContact ?? null,
      guardian_name: input.guardianName ?? null,
      parental_responsibility: input.parentalResponsibility,
      contact_conditions: input.contactConditions ?? null,
      next_hearing_date: input.nextHearingDate ?? null,
      last_hearing_outcome: null,
      staff_briefed: false,
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
): Promise<ServiceResult<LegalRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_legal_records") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeLegalMetrics,
  identifyLegalAlerts,
};
