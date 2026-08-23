// ══════════════════════════════════════════════════════════════════════════════
// CARA — GIFTS & HOSPITALITY REGISTER SERVICE
// Tracks gifts received/given, hospitality offered, declarations of interest,
// and compliance with anti-bribery and professional conduct policies.
// CHR 2015 Reg 13 (leadership — governance),
// Reg 33 (employment of staff — conduct),
// Bribery Act 2010, NMS 19.
//
// Covers: gift declarations, hospitality records, value thresholds,
// approval workflows, and conflict of interest management.
//
// SCCIF: Leadership & Management — "Transparent and ethical governance."
// "Staff conduct is professionally managed."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type GiftDirection =
  | "received"
  | "given"
  | "offered_declined"
  | "hospitality_received"
  | "hospitality_given";

export type GiftSource =
  | "parent_carer"
  | "child_young_person"
  | "professional"
  | "contractor"
  | "placing_authority"
  | "charity"
  | "supplier"
  | "other";

export type ApprovalStatus =
  | "approved"
  | "pending"
  | "declined"
  | "returned"
  | "not_required";

export type DeclarationStatus =
  | "declared"
  | "not_declared"
  | "late_declaration"
  | "under_review";

export interface GiftRecord {
  id: string;
  home_id: string;
  gift_date: string;
  direction: GiftDirection;
  source: GiftSource;
  description: string;
  estimated_value: number;
  approval_status: ApprovalStatus;
  declaration_status: DeclarationStatus;
  staff_name: string;
  approved_by: string | null;
  conflict_of_interest: boolean;
  child_involved: boolean;
  receipt_kept: boolean;
  policy_compliant: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const GIFT_DIRECTIONS: { direction: GiftDirection; label: string }[] = [
  { direction: "received", label: "Received" },
  { direction: "given", label: "Given" },
  { direction: "offered_declined", label: "Offered & Declined" },
  { direction: "hospitality_received", label: "Hospitality Received" },
  { direction: "hospitality_given", label: "Hospitality Given" },
];

export const GIFT_SOURCES: { source: GiftSource; label: string }[] = [
  { source: "parent_carer", label: "Parent/Carer" },
  { source: "child_young_person", label: "Child/Young Person" },
  { source: "professional", label: "Professional" },
  { source: "contractor", label: "Contractor" },
  { source: "placing_authority", label: "Placing Authority" },
  { source: "charity", label: "Charity" },
  { source: "supplier", label: "Supplier" },
  { source: "other", label: "Other" },
];

export const APPROVAL_STATUSES: { status: ApprovalStatus; label: string }[] = [
  { status: "approved", label: "Approved" },
  { status: "pending", label: "Pending" },
  { status: "declined", label: "Declined" },
  { status: "returned", label: "Returned" },
  { status: "not_required", label: "Not Required" },
];

export const DECLARATION_STATUSES: { status: DeclarationStatus; label: string }[] = [
  { status: "declared", label: "Declared" },
  { status: "not_declared", label: "Not Declared" },
  { status: "late_declaration", label: "Late Declaration" },
  { status: "under_review", label: "Under Review" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeGiftMetrics(
  records: GiftRecord[],
): {
  total_records: number;
  received_count: number;
  given_count: number;
  declined_count: number;
  hospitality_count: number;
  total_value: number;
  average_value: number | null;
  approved_rate: number | null;
  pending_count: number;
  declared_rate: number | null;
  not_declared_count: number;
  late_declaration_count: number;
  conflict_of_interest_count: number;
  child_involved_count: number;
  receipt_kept_rate: number | null;
  policy_compliant_rate: number | null;
  by_direction: Record<string, number>;
  by_source: Record<string, number>;
  by_approval_status: Record<string, number>;
  by_declaration_status: Record<string, number>;
} {
  const received = records.filter((r) => r.direction === "received").length;
  const given = records.filter((r) => r.direction === "given").length;
  const declined = records.filter((r) => r.direction === "offered_declined").length;
  const hospitality = records.filter(
    (r) => r.direction === "hospitality_received" || r.direction === "hospitality_given",
  ).length;

  const totalValue = Math.round(
    records.reduce((sum, r) => sum + r.estimated_value, 0) * 100,
  ) / 100;

  const avgValue =
    records.length > 0
      ? Math.round((totalValue / records.length) * 100) / 100
      : null;

  const approved = records.filter((r) => r.approval_status === "approved").length;
  const approvedRate =
    records.length > 0
      ? Math.round((approved / records.length) * 1000) / 10
      : null;

  const pending = records.filter((r) => r.approval_status === "pending").length;

  const declared = records.filter((r) => r.declaration_status === "declared").length;
  const declaredRate =
    records.length > 0
      ? Math.round((declared / records.length) * 1000) / 10
      : null;

  const notDeclared = records.filter((r) => r.declaration_status === "not_declared").length;
  const lateDec = records.filter((r) => r.declaration_status === "late_declaration").length;

  const conflict = records.filter((r) => r.conflict_of_interest).length;
  const childInvolved = records.filter((r) => r.child_involved).length;

  const receiptKept = records.filter((r) => r.receipt_kept).length;
  const receiptRate =
    records.length > 0
      ? Math.round((receiptKept / records.length) * 1000) / 10
      : null;

  const compliant = records.filter((r) => r.policy_compliant).length;
  const compliantRate =
    records.length > 0
      ? Math.round((compliant / records.length) * 1000) / 10
      : null;

  const byDirection: Record<string, number> = {};
  for (const r of records) byDirection[r.direction] = (byDirection[r.direction] ?? 0) + 1;

  const bySource: Record<string, number> = {};
  for (const r of records) bySource[r.source] = (bySource[r.source] ?? 0) + 1;

  const byApproval: Record<string, number> = {};
  for (const r of records) byApproval[r.approval_status] = (byApproval[r.approval_status] ?? 0) + 1;

  const byDeclaration: Record<string, number> = {};
  for (const r of records) byDeclaration[r.declaration_status] = (byDeclaration[r.declaration_status] ?? 0) + 1;

  return {
    total_records: records.length,
    received_count: received,
    given_count: given,
    declined_count: declined,
    hospitality_count: hospitality,
    total_value: totalValue,
    average_value: avgValue,
    approved_rate: approvedRate,
    pending_count: pending,
    declared_rate: declaredRate,
    not_declared_count: notDeclared,
    late_declaration_count: lateDec,
    conflict_of_interest_count: conflict,
    child_involved_count: childInvolved,
    receipt_kept_rate: receiptRate,
    policy_compliant_rate: compliantRate,
    by_direction: byDirection,
    by_source: bySource,
    by_approval_status: byApproval,
    by_declaration_status: byDeclaration,
  };
}

export function identifyGiftAlerts(
  records: GiftRecord[],
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

  // Conflict of interest
  for (const r of records) {
    if (r.conflict_of_interest) {
      alerts.push({
        type: "conflict_of_interest",
        severity: "critical",
        message: `Conflict of interest declared by ${r.staff_name} on ${r.gift_date} — investigate and manage`,
        id: r.id,
      });
    }
  }

  // Not declared
  const notDeclared = records.filter((r) => r.declaration_status === "not_declared").length;
  if (notDeclared >= 1) {
    alerts.push({
      type: "not_declared",
      severity: "high",
      message: `${notDeclared} undeclared ${notDeclared === 1 ? "gift" : "gifts"} — all gifts must be declared per policy`,
      id: "not_declared",
    });
  }

  // Policy non-compliant
  const nonCompliant = records.filter((r) => !r.policy_compliant).length;
  if (nonCompliant >= 1) {
    alerts.push({
      type: "policy_non_compliant",
      severity: "high",
      message: `${nonCompliant} ${nonCompliant === 1 ? "gift is" : "gifts are"} non-compliant with policy — review and take action`,
      id: "policy_non_compliant",
    });
  }

  // Pending approval
  const pending = records.filter((r) => r.approval_status === "pending").length;
  if (pending >= 2) {
    alerts.push({
      type: "pending_approval",
      severity: "medium",
      message: `${pending} gifts awaiting approval — review and approve or decline promptly`,
      id: "pending_approval",
    });
  }

  // High value gifts (over £50)
  const highValue = records.filter((r) => r.estimated_value > 50).length;
  if (highValue >= 1) {
    alerts.push({
      type: "high_value",
      severity: "medium",
      message: `${highValue} high-value ${highValue === 1 ? "gift" : "gifts"} (over £50) — ensure proper governance`,
      id: "high_value",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    direction?: GiftDirection;
    source?: GiftSource;
    approvalStatus?: ApprovalStatus;
    limit?: number;
  },
): Promise<ServiceResult<GiftRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_gifts_hospitality") as SB).select("*").eq("home_id", homeId);
  if (filters?.direction) q = q.eq("direction", filters.direction);
  if (filters?.source) q = q.eq("source", filters.source);
  if (filters?.approvalStatus) q = q.eq("approval_status", filters.approvalStatus);
  q = q.order("gift_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  input: {
    homeId: string;
    giftDate: string;
    direction: GiftDirection;
    source: GiftSource;
    description: string;
    estimatedValue: number;
    approvalStatus: ApprovalStatus;
    declarationStatus: DeclarationStatus;
    staffName: string;
    approvedBy?: string;
    conflictOfInterest: boolean;
    childInvolved: boolean;
    receiptKept: boolean;
    policyCompliant: boolean;
    notes?: string;
  },
): Promise<ServiceResult<GiftRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_gifts_hospitality") as SB)
    .insert({
      home_id: input.homeId,
      gift_date: input.giftDate,
      direction: input.direction,
      source: input.source,
      description: input.description,
      estimated_value: input.estimatedValue,
      approval_status: input.approvalStatus,
      declaration_status: input.declarationStatus,
      staff_name: input.staffName,
      approved_by: input.approvedBy ?? null,
      conflict_of_interest: input.conflictOfInterest,
      child_involved: input.childInvolved,
      receipt_kept: input.receiptKept,
      policy_compliant: input.policyCompliant,
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
): Promise<ServiceResult<GiftRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_gifts_hospitality") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeGiftMetrics,
  identifyGiftAlerts,
};
