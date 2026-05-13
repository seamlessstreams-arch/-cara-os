// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — DEPRIVATION OF LIBERTY & RESTRICTIONS SERVICE
// Manages Deprivation of Liberty (DoL) orders and the restrictions register
// for children in residential care. Covers court orders, inherent jurisdiction,
// secure accommodation orders, and Liberty Protection Safeguards. Tracks all
// restrictions on children's liberty, movement, communication, and association
// with full proportionality assessment, child consultation, and review cycles.
//
// Regulatory framework:
//   - CHR 2015 Reg 20 — Restraint and deprivation of liberty
//   - CHR 2015 Reg 21 — Privacy and access
//   - SCCIF — Helped & Protected judgement area
//   - Children Act 1989 s25 — Secure accommodation
//   - Mental Capacity Act 2005 / LPS — Liberty Protection Safeguards
//   - Re X / Re D (Inherent Jurisdiction) — High Court DoL orders
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ───────────────────────────────────────────────────────────────────

export type DoLOrderType =
  | "court_order"
  | "inherent_jurisdiction"
  | "secure_accommodation"
  | "liberty_protection_safeguards";

export type AuthorisingBody =
  | "high_court"
  | "family_court"
  | "local_authority"
  | "secretary_of_state";

export type DoLStatus =
  | "active"
  | "expired"
  | "revoked"
  | "under_review"
  | "pending";

export type RestrictionType =
  | "movement"
  | "communication"
  | "association"
  | "internet"
  | "mobile_phone"
  | "bedroom_door_lock"
  | "bathroom_lock"
  | "kitchen_access"
  | "leave_home"
  | "contact_with_person";

export type LegalBasis =
  | "court_order"
  | "risk_assessment"
  | "placement_plan"
  | "behaviour_support_plan"
  | "safeguarding";

export type ReviewFrequency =
  | "daily"
  | "weekly"
  | "fortnightly"
  | "monthly";

export type RestrictionStatus =
  | "active"
  | "ended"
  | "under_review";

export interface DoLOrder {
  id: string;
  home_id: string;
  child_id: string;
  child_name: string;
  order_type: DoLOrderType;
  authorising_body: AuthorisingBody;
  order_reference: string;
  start_date: string;
  end_date: string;
  review_date: string;
  conditions: string[];
  justification: string;
  legal_representative: string;
  irm_notified: boolean;
  ofsted_notified: boolean;
  status: DoLStatus;
  reviewed_by: string;
  review_notes: string;
  created_at: string;
  updated_at: string;
}

export interface RestrictionRecord {
  id: string;
  home_id: string;
  child_id: string;
  child_name: string;
  restriction_type: RestrictionType;
  description: string;
  justification: string;
  legal_basis: LegalBasis;
  start_date: string;
  end_date: string | null;
  review_frequency: ReviewFrequency;
  last_review_date: string;
  next_review_date: string;
  reviewed_by: string;
  child_consulted: boolean;
  child_views: string;
  social_worker_informed: boolean;
  social_worker_informed_date: string | null;
  parent_informed: boolean;
  proportionate: boolean;
  status: RestrictionStatus;
  created_at: string;
  updated_at: string;
}

// ── Constants ───────────────────────────────────────────────────────────────

export const DOL_ORDER_TYPES: { type: DoLOrderType; label: string }[] = [
  { type: "court_order", label: "Court Order" },
  { type: "inherent_jurisdiction", label: "Inherent Jurisdiction (High Court)" },
  { type: "secure_accommodation", label: "Secure Accommodation (s25 CA 1989)" },
  { type: "liberty_protection_safeguards", label: "Liberty Protection Safeguards" },
];

export const AUTHORISING_BODIES: { body: AuthorisingBody; label: string }[] = [
  { body: "high_court", label: "High Court" },
  { body: "family_court", label: "Family Court" },
  { body: "local_authority", label: "Local Authority" },
  { body: "secretary_of_state", label: "Secretary of State" },
];

export const DOL_STATUS: { status: DoLStatus; label: string }[] = [
  { status: "active", label: "Active" },
  { status: "expired", label: "Expired" },
  { status: "revoked", label: "Revoked" },
  { status: "under_review", label: "Under Review" },
  { status: "pending", label: "Pending" },
];

export const RESTRICTION_TYPES: { type: RestrictionType; label: string }[] = [
  { type: "movement", label: "Movement Restriction" },
  { type: "communication", label: "Communication Restriction" },
  { type: "association", label: "Association Restriction" },
  { type: "internet", label: "Internet Access Restriction" },
  { type: "mobile_phone", label: "Mobile Phone Restriction" },
  { type: "bedroom_door_lock", label: "Bedroom Door Lock" },
  { type: "bathroom_lock", label: "Bathroom Lock" },
  { type: "kitchen_access", label: "Kitchen Access Restriction" },
  { type: "leave_home", label: "Leave Home Restriction" },
  { type: "contact_with_person", label: "Contact with Named Person" },
];

export const LEGAL_BASIS_OPTIONS: { basis: LegalBasis; label: string }[] = [
  { basis: "court_order", label: "Court Order" },
  { basis: "risk_assessment", label: "Risk Assessment" },
  { basis: "placement_plan", label: "Placement Plan" },
  { basis: "behaviour_support_plan", label: "Behaviour Support Plan" },
  { basis: "safeguarding", label: "Safeguarding" },
];

export const REVIEW_FREQUENCY: { frequency: ReviewFrequency; label: string }[] = [
  { frequency: "daily", label: "Daily" },
  { frequency: "weekly", label: "Weekly" },
  { frequency: "fortnightly", label: "Fortnightly" },
  { frequency: "monthly", label: "Monthly" },
];

export const RESTRICTION_STATUS: { status: RestrictionStatus; label: string }[] = [
  { status: "active", label: "Active" },
  { status: "ended", label: "Ended" },
  { status: "under_review", label: "Under Review" },
];

// ── Pure functions (no DB) ──────────────────────────────────────────────────

/**
 * Compute DoL and restriction metrics for dashboard display and SCCIF evidence.
 */
function computeDoLMetrics(
  orders: DoLOrder[],
  restrictions: RestrictionRecord[],
): {
  active_orders: number;
  active_restrictions: number;
  overdue_reviews: number;
  child_consultation_rate: number;
  proportionality_rate: number;
  restrictions_by_type: Record<string, number>;
} {
  const now = new Date();

  // Active orders
  const activeOrders = orders.filter((o) => o.status === "active").length;

  // Active restrictions
  const activeRestrictions = restrictions.filter((r) => r.status === "active");
  const activeRestrictionsCount = activeRestrictions.length;

  // Overdue reviews — orders past review_date that are still active
  let overdueReviews = 0;
  for (const o of orders) {
    if (o.status === "active" && o.review_date) {
      const reviewDate = new Date(o.review_date);
      if (reviewDate < now) overdueReviews++;
    }
  }
  // Restrictions past next_review_date that are still active
  for (const r of activeRestrictions) {
    if (r.next_review_date) {
      const nextReview = new Date(r.next_review_date);
      if (nextReview < now) overdueReviews++;
    }
  }

  // Child consultation rate (active restrictions only)
  const consulted = activeRestrictions.filter((r) => r.child_consulted).length;
  const childConsultationRate =
    activeRestrictionsCount > 0
      ? Math.round((consulted / activeRestrictionsCount) * 100)
      : 100;

  // Proportionality rate (active restrictions only)
  const proportionate = activeRestrictions.filter((r) => r.proportionate).length;
  const proportionalityRate =
    activeRestrictionsCount > 0
      ? Math.round((proportionate / activeRestrictionsCount) * 100)
      : 100;

  // Restrictions by type (active only)
  const byType: Record<string, number> = {};
  for (const r of activeRestrictions) {
    byType[r.restriction_type] = (byType[r.restriction_type] ?? 0) + 1;
  }

  return {
    active_orders: activeOrders,
    active_restrictions: activeRestrictionsCount,
    overdue_reviews: overdueReviews,
    child_consultation_rate: childConsultationRate,
    proportionality_rate: proportionalityRate,
    restrictions_by_type: byType,
  };
}

/**
 * Identify DoL and restriction alerts requiring management attention.
 * Covers regulatory compliance, child rights, and review deadlines.
 */
function identifyDoLAlerts(
  orders: DoLOrder[],
  restrictions: RestrictionRecord[],
): { type: string; severity: "critical" | "high" | "medium" | "low"; message: string }[] {
  const alerts: { type: string; severity: "critical" | "high" | "medium" | "low"; message: string }[] = [];
  const now = new Date();

  // ── Order alerts ──

  for (const o of orders) {
    if (o.status !== "active") continue;

    // Expiring orders — within 14 days of end_date
    if (o.end_date) {
      const endDate = new Date(o.end_date);
      const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntilExpiry <= 0) {
        alerts.push({
          type: "order_expired",
          severity: "critical",
          message: `DoL order ${o.order_reference} for ${o.child_name} expired on ${o.end_date}. Immediate legal review required — continued deprivation without authority is unlawful (Reg 20).`,
        });
      } else if (daysUntilExpiry <= 14) {
        alerts.push({
          type: "order_expiring",
          severity: "high",
          message: `DoL order ${o.order_reference} for ${o.child_name} expires in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? "" : "s"}. Renewal application must be submitted to ${o.authorising_body}.`,
        });
      }
    }

    // Overdue review
    if (o.review_date) {
      const reviewDate = new Date(o.review_date);
      if (reviewDate < now) {
        const daysOverdue = Math.ceil((now.getTime() - reviewDate.getTime()) / (1000 * 60 * 60 * 24));
        alerts.push({
          type: "order_review_overdue",
          severity: "high",
          message: `DoL order ${o.order_reference} for ${o.child_name} review is ${daysOverdue} day${daysOverdue === 1 ? "" : "s"} overdue. Reg 20 requires timely review of all deprivation orders.`,
        });
      }
    }

    // IRM not notified
    if (!o.irm_notified) {
      alerts.push({
        type: "irm_not_notified",
        severity: "high",
        message: `Independent Reviewing Mechanism not notified for DoL order ${o.order_reference} (${o.child_name}). IRM notification is a legal requirement.`,
      });
    }

    // Ofsted not notified
    if (!o.ofsted_notified) {
      alerts.push({
        type: "ofsted_not_notified",
        severity: "high",
        message: `Ofsted not notified of DoL order ${o.order_reference} for ${o.child_name} (Reg 40 notifiable event).`,
      });
    }

    // Missing justification
    if (!o.justification || o.justification.trim() === "") {
      alerts.push({
        type: "missing_justification",
        severity: "critical",
        message: `DoL order ${o.order_reference} for ${o.child_name} has no recorded justification. Reg 20 requires deprivation to be necessary and proportionate with clear rationale.`,
      });
    }
  }

  // ── Restriction alerts ──

  for (const r of restrictions) {
    if (r.status !== "active") continue;

    // Overdue review
    if (r.next_review_date) {
      const nextReview = new Date(r.next_review_date);
      if (nextReview < now) {
        const daysOverdue = Math.ceil((now.getTime() - nextReview.getTime()) / (1000 * 60 * 60 * 24));
        alerts.push({
          type: "restriction_review_overdue",
          severity: "high",
          message: `Restriction (${r.restriction_type}) for ${r.child_name} review is ${daysOverdue} day${daysOverdue === 1 ? "" : "s"} overdue. Restrictions must be regularly reviewed (Reg 20/21).`,
        });
      }
    }

    // Child not consulted
    if (!r.child_consulted) {
      alerts.push({
        type: "child_not_consulted",
        severity: "medium",
        message: `Child (${r.child_name}) not consulted about ${r.restriction_type} restriction. Children Act 1989 requires the child's wishes and feelings to be ascertained.`,
      });
    }

    // Social worker not informed
    if (!r.social_worker_informed) {
      alerts.push({
        type: "social_worker_not_informed",
        severity: "medium",
        message: `Social worker not informed about ${r.restriction_type} restriction for ${r.child_name}. Placing authority must be notified of all restrictions on liberty.`,
      });
    }

    // Not proportionate
    if (!r.proportionate) {
      alerts.push({
        type: "disproportionate_restriction",
        severity: "critical",
        message: `Restriction (${r.restriction_type}) for ${r.child_name} is flagged as not proportionate. Disproportionate restrictions are unlawful under Reg 20. Immediate review required.`,
      });
    }

    // Missing justification
    if (!r.justification || r.justification.trim() === "") {
      alerts.push({
        type: "missing_restriction_justification",
        severity: "high",
        message: `No justification recorded for ${r.restriction_type} restriction on ${r.child_name}. All restrictions must be justified as necessary and proportionate (Reg 20).`,
      });
    }
  }

  return alerts;
}

// ── CRUD — DoL Orders ───────────────────────────────────────────────────────

export async function listDoLOrders(
  homeId: string,
  filters?: {
    childId?: string;
    status?: DoLStatus;
    orderType?: DoLOrderType;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
  },
): Promise<ServiceResult<DoLOrder[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [], persisted: false } as ServiceResult<DoLOrder[]>;

  const s = sb();
  if (!s) return { ok: true, data: [], persisted: false } as ServiceResult<DoLOrder[]>;

  let q = (s.from("cs_dol_orders") as SB).select("*").eq("home_id", homeId);
  if (filters?.childId) q = q.eq("child_id", filters.childId);
  if (filters?.status) q = q.eq("status", filters.status);
  if (filters?.orderType) q = q.eq("order_type", filters.orderType);
  if (filters?.dateFrom) q = q.gte("start_date", filters.dateFrom);
  if (filters?.dateTo) q = q.lte("start_date", filters.dateTo);
  q = q.order("start_date", { ascending: false }).limit(filters?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createDoLOrder(
  input: Omit<DoLOrder, "id" | "created_at" | "updated_at">,
): Promise<ServiceResult<DoLOrder>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_dol_orders") as SB)
    .insert({
      home_id: input.home_id,
      child_id: input.child_id,
      child_name: input.child_name,
      order_type: input.order_type,
      authorising_body: input.authorising_body,
      order_reference: input.order_reference,
      start_date: input.start_date,
      end_date: input.end_date,
      review_date: input.review_date,
      conditions: input.conditions,
      justification: input.justification,
      legal_representative: input.legal_representative,
      irm_notified: input.irm_notified,
      ofsted_notified: input.ofsted_notified,
      status: input.status,
      reviewed_by: input.reviewed_by,
      review_notes: input.review_notes,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateDoLOrder(
  id: string,
  updates: Partial<DoLOrder>,
): Promise<ServiceResult<DoLOrder>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_dol_orders") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── CRUD — Restrictions Register ────────────────────────────────────────────

export async function listRestrictions(
  homeId: string,
  filters?: {
    childId?: string;
    restrictionType?: RestrictionType;
    status?: RestrictionStatus;
    legalBasis?: LegalBasis;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
  },
): Promise<ServiceResult<RestrictionRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [], persisted: false } as ServiceResult<RestrictionRecord[]>;

  const s = sb();
  if (!s) return { ok: true, data: [], persisted: false } as ServiceResult<RestrictionRecord[]>;

  let q = (s.from("cs_restrictions_register") as SB).select("*").eq("home_id", homeId);
  if (filters?.childId) q = q.eq("child_id", filters.childId);
  if (filters?.restrictionType) q = q.eq("restriction_type", filters.restrictionType);
  if (filters?.status) q = q.eq("status", filters.status);
  if (filters?.legalBasis) q = q.eq("legal_basis", filters.legalBasis);
  if (filters?.dateFrom) q = q.gte("start_date", filters.dateFrom);
  if (filters?.dateTo) q = q.lte("start_date", filters.dateTo);
  q = q.order("start_date", { ascending: false }).limit(filters?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRestriction(
  input: Omit<RestrictionRecord, "id" | "created_at" | "updated_at">,
): Promise<ServiceResult<RestrictionRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_restrictions_register") as SB)
    .insert({
      home_id: input.home_id,
      child_id: input.child_id,
      child_name: input.child_name,
      restriction_type: input.restriction_type,
      description: input.description,
      justification: input.justification,
      legal_basis: input.legal_basis,
      start_date: input.start_date,
      end_date: input.end_date ?? null,
      review_frequency: input.review_frequency,
      last_review_date: input.last_review_date,
      next_review_date: input.next_review_date,
      reviewed_by: input.reviewed_by,
      child_consulted: input.child_consulted,
      child_views: input.child_views,
      social_worker_informed: input.social_worker_informed,
      social_worker_informed_date: input.social_worker_informed_date ?? null,
      parent_informed: input.parent_informed,
      proportionate: input.proportionate,
      status: input.status,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateRestriction(
  id: string,
  updates: Partial<RestrictionRecord>,
): Promise<ServiceResult<RestrictionRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_restrictions_register") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ────────────────────────────────────────────────────────

export const _testing = {
  computeDoLMetrics,
  identifyDoLAlerts,
};
