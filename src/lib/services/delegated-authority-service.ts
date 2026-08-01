// ══════════════════════════════════════════════════════════════════════════════
// CARA — DELEGATED AUTHORITY SERVICE
// Tracks delegated authority agreements for looked-after children,
// recording which decisions staff can make day-to-day without
// needing specific permission from the local authority or parents.
// CHR 2015 Reg 21 (privacy and access — respecting children's autonomy),
// Reg 14 (care planning — delegated authority agreements),
// Children Act 1989 s33(3)(b) (parental responsibility delegation).
//
// Covers: sleepovers, haircuts, medical consent, school trips,
// social media, overnight stays, religious activities, etc.
//
// SCCIF: Overall Experiences — "Children are able to live as normal
// a life as possible." "Decision-making is not unnecessarily delayed."
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

export type DecisionArea =
  | "sleepovers"
  | "haircuts"
  | "medical_routine"
  | "medical_emergency"
  | "dental"
  | "school_trips"
  | "overnight_stays"
  | "social_media"
  | "mobile_phone"
  | "religious_activities"
  | "extracurricular"
  | "travel_abroad"
  | "photographs"
  | "piercing_tattoo"
  | "pocket_money"
  | "clothing"
  | "food_diet"
  | "contact_arrangements"
  | "education_decisions"
  | "other";

export type AuthorityLevel =
  | "home_staff"
  | "registered_manager"
  | "social_worker"
  | "parent_carer"
  | "local_authority"
  | "court_order"
  | "joint_decision"
  | "not_delegated";

export type AgreementStatus =
  | "agreed"
  | "pending"
  | "disputed"
  | "not_applicable"
  | "expired"
  | "under_review";

export interface DelegatedAuthority {
  id: string;
  home_id: string;
  child_name: string;
  child_id: string;
  decision_area: DecisionArea;
  authority_level: AuthorityLevel;
  agreement_status: AgreementStatus;
  agreed_by: string | null;
  agreed_date: string | null;
  review_date: string | null;
  specific_conditions: string | null;
  child_views_sought: boolean;
  child_agrees: boolean | null;
  social_worker_approved: boolean;
  documented_in_care_plan: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const DECISION_AREAS: { area: DecisionArea; label: string }[] = [
  { area: "sleepovers", label: "Sleepovers" },
  { area: "haircuts", label: "Haircuts" },
  { area: "medical_routine", label: "Routine Medical" },
  { area: "medical_emergency", label: "Emergency Medical" },
  { area: "dental", label: "Dental" },
  { area: "school_trips", label: "School Trips" },
  { area: "overnight_stays", label: "Overnight Stays" },
  { area: "social_media", label: "Social Media" },
  { area: "mobile_phone", label: "Mobile Phone" },
  { area: "religious_activities", label: "Religious Activities" },
  { area: "extracurricular", label: "Extracurricular" },
  { area: "travel_abroad", label: "Travel Abroad" },
  { area: "photographs", label: "Photographs" },
  { area: "piercing_tattoo", label: "Piercing/Tattoo" },
  { area: "pocket_money", label: "Pocket Money" },
  { area: "clothing", label: "Clothing" },
  { area: "food_diet", label: "Food & Diet" },
  { area: "contact_arrangements", label: "Contact Arrangements" },
  { area: "education_decisions", label: "Education Decisions" },
  { area: "other", label: "Other" },
];

export const AUTHORITY_LEVELS: { level: AuthorityLevel; label: string }[] = [
  { level: "home_staff", label: "Home Staff" },
  { level: "registered_manager", label: "Registered Manager" },
  { level: "social_worker", label: "Social Worker" },
  { level: "parent_carer", label: "Parent/Carer" },
  { level: "local_authority", label: "Local Authority" },
  { level: "court_order", label: "Court Order" },
  { level: "joint_decision", label: "Joint Decision" },
  { level: "not_delegated", label: "Not Delegated" },
];

export const AGREEMENT_STATUSES: { status: AgreementStatus; label: string }[] = [
  { status: "agreed", label: "Agreed" },
  { status: "pending", label: "Pending" },
  { status: "disputed", label: "Disputed" },
  { status: "not_applicable", label: "Not Applicable" },
  { status: "expired", label: "Expired" },
  { status: "under_review", label: "Under Review" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeDelegatedAuthorityMetrics(
  records: DelegatedAuthority[],
  totalChildren: number,
): {
  total_records: number;
  children_covered: number;
  coverage_rate: number | null;
  agreed_count: number;
  pending_count: number;
  disputed_count: number;
  expired_count: number;
  not_delegated_count: number;
  child_views_sought_rate: number | null;
  social_worker_approved_rate: number | null;
  documented_in_care_plan_rate: number | null;
  review_overdue_count: number;
  decisions_by_home_staff: number;
  decisions_needing_escalation: number;
  average_per_child: number | null;
  by_decision_area: Record<string, number>;
  by_authority_level: Record<string, number>;
  by_agreement_status: Record<string, number>;
} {
  const uniqueChildren = new Set(records.map((r) => r.child_id)).size;
  const coverageRate =
    totalChildren > 0
      ? Math.round((uniqueChildren / totalChildren) * 1000) / 10
      : null;

  const agreed = records.filter((r) => r.agreement_status === "agreed").length;
  const pending = records.filter((r) => r.agreement_status === "pending").length;
  const disputed = records.filter((r) => r.agreement_status === "disputed").length;
  const expired = records.filter((r) => r.agreement_status === "expired").length;
  const notDelegated = records.filter((r) => r.authority_level === "not_delegated").length;

  const viewsSought = records.filter((r) => r.child_views_sought).length;
  const viewsRate =
    records.length > 0
      ? Math.round((viewsSought / records.length) * 1000) / 10
      : null;

  const swApproved = records.filter((r) => r.social_worker_approved).length;
  const swRate =
    records.length > 0
      ? Math.round((swApproved / records.length) * 1000) / 10
      : null;

  const documented = records.filter((r) => r.documented_in_care_plan).length;
  const docRate =
    records.length > 0
      ? Math.round((documented / records.length) * 1000) / 10
      : null;

  const now = new Date();
  const reviewOverdue = records.filter(
    (r) => r.review_date && new Date(r.review_date) < now && r.agreement_status !== "expired" && r.agreement_status !== "not_applicable",
  ).length;

  const homeStaff = records.filter((r) => r.authority_level === "home_staff").length;
  const needsEscalation = records.filter(
    (r) => r.authority_level === "local_authority" || r.authority_level === "court_order" || r.authority_level === "social_worker",
  ).length;

  const avgPerChild =
    uniqueChildren > 0
      ? Math.round((records.length / uniqueChildren) * 10) / 10
      : null;

  const byArea: Record<string, number> = {};
  for (const r of records) byArea[r.decision_area] = (byArea[r.decision_area] ?? 0) + 1;

  const byLevel: Record<string, number> = {};
  for (const r of records) byLevel[r.authority_level] = (byLevel[r.authority_level] ?? 0) + 1;

  const byStatus: Record<string, number> = {};
  for (const r of records) byStatus[r.agreement_status] = (byStatus[r.agreement_status] ?? 0) + 1;

  return {
    total_records: records.length,
    children_covered: uniqueChildren,
    coverage_rate: coverageRate,
    agreed_count: agreed,
    pending_count: pending,
    disputed_count: disputed,
    expired_count: expired,
    not_delegated_count: notDelegated,
    child_views_sought_rate: viewsRate,
    social_worker_approved_rate: swRate,
    documented_in_care_plan_rate: docRate,
    review_overdue_count: reviewOverdue,
    decisions_by_home_staff: homeStaff,
    decisions_needing_escalation: needsEscalation,
    average_per_child: avgPerChild,
    by_decision_area: byArea,
    by_authority_level: byLevel,
    by_agreement_status: byStatus,
  };
}

export function identifyDelegatedAuthorityAlerts(
  records: DelegatedAuthority[],
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

  // Children with no delegated authority records
  const childrenCovered = new Set(records.map((r) => r.child_id)).size;
  if (totalChildren > 0 && childrenCovered < totalChildren) {
    const gap = totalChildren - childrenCovered;
    alerts.push({
      type: "no_delegation",
      severity: "high",
      message: `${gap} ${gap === 1 ? "child has" : "children have"} no delegated authority agreements — children cannot live normally without clear decision-making authority`,
      id: "delegation_gap",
    });
  }

  // Disputed delegated authority
  for (const r of records) {
    if (r.agreement_status === "disputed") {
      alerts.push({
        type: "disputed_authority",
        severity: "high",
        message: `Delegated authority for ${r.child_name} (${r.decision_area.replace(/_/g, " ")}) is disputed — resolve with social worker to prevent delays`,
        id: r.id,
      });
    }
  }

  // Child views not sought
  const noViews = records.filter((r) => !r.child_views_sought && r.agreement_status !== "not_applicable").length;
  if (noViews >= 3) {
    alerts.push({
      type: "child_views_missing",
      severity: "medium",
      message: `${noViews} delegated authority decisions made without seeking the child's views — children should be involved in decisions affecting them`,
      id: "views_missing",
    });
  }

  // Expired agreements
  const expiredCount = records.filter((r) => r.agreement_status === "expired").length;
  if (expiredCount >= 2) {
    alerts.push({
      type: "expired_agreements",
      severity: "high",
      message: `${expiredCount} delegated authority agreements have expired — renew to ensure staff can make timely decisions`,
      id: "expired_agreements",
    });
  }

  // Not documented in care plan
  const notDocumented = records.filter(
    (r) => !r.documented_in_care_plan && r.agreement_status === "agreed",
  ).length;
  if (notDocumented >= 2) {
    alerts.push({
      type: "not_documented",
      severity: "medium",
      message: `${notDocumented} agreed delegated authority decisions not documented in care plans — care plans must reflect current agreements`,
      id: "not_documented",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    childId?: string;
    decisionArea?: DecisionArea;
    authorityLevel?: AuthorityLevel;
    agreementStatus?: AgreementStatus;
    limit?: number;
  },
): Promise<ServiceResult<DelegatedAuthority[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_delegated_authority") as SB).select("*").eq("home_id", homeId);
  if (filters?.childId) q = q.eq("child_id", filters.childId);
  if (filters?.decisionArea) q = q.eq("decision_area", filters.decisionArea);
  if (filters?.authorityLevel) q = q.eq("authority_level", filters.authorityLevel);
  if (filters?.agreementStatus) q = q.eq("agreement_status", filters.agreementStatus);
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
    decisionArea: DecisionArea;
    authorityLevel: AuthorityLevel;
    agreementStatus: AgreementStatus;
    agreedBy?: string;
    agreedDate?: string;
    reviewDate?: string;
    specificConditions?: string;
    childViewsSought: boolean;
    childAgrees?: boolean;
    socialWorkerApproved: boolean;
    documentedInCarePlan: boolean;
    notes?: string;
  },
): Promise<ServiceResult<DelegatedAuthority>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_delegated_authority") as SB)
    .insert({
      home_id: input.homeId,
      child_name: input.childName,
      child_id: input.childId,
      decision_area: input.decisionArea,
      authority_level: input.authorityLevel,
      agreement_status: input.agreementStatus,
      agreed_by: input.agreedBy ?? null,
      agreed_date: input.agreedDate ?? null,
      review_date: input.reviewDate ?? null,
      specific_conditions: input.specificConditions ?? null,
      child_views_sought: input.childViewsSought,
      child_agrees: input.childAgrees ?? null,
      social_worker_approved: input.socialWorkerApproved,
      documented_in_care_plan: input.documentedInCarePlan,
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
): Promise<ServiceResult<DelegatedAuthority>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_delegated_authority") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeDelegatedAuthorityMetrics,
  identifyDelegatedAuthorityAlerts,
};
