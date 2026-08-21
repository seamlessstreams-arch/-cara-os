// ══════════════════════════════════════════════════════════════════════════════
// CARA — ADVOCACY & CHILDREN'S RIGHTS SERVICE
// Manages independent advocacy referrals (Children Act 1989 s26), children's
// rights awareness and exercise tracking. CHR 2015 Reg 7 (quality of care),
// Reg 14 (care planning), Reg 45 (review of quality of care).
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import { todayStr, londonDayDiff } from "@/lib/utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type ReferralReason =
  | "lac_review"
  | "complaint"
  | "care_plan_disagreement"
  | "placement_change"
  | "child_request"
  | "safeguarding"
  | "restraint_incident"
  | "rights_concern"
  | "other";

export type ReferralStatus =
  | "referred"
  | "allocated"
  | "active"
  | "completed"
  | "declined"
  | "withdrawn";

export type RightType =
  | "complaint_process"
  | "advocacy_access"
  | "lac_review_participation"
  | "care_plan_input"
  | "contact_arrangements"
  | "privacy"
  | "cultural_identity"
  | "education_choice"
  | "health_decisions"
  | "recreation"
  | "religious_practice"
  | "independent_visitor"
  | "irp_access"
  | "ofsted_contact";

export interface AdvocacyReferral {
  id: string;
  home_id: string;
  child_id: string;
  child_name: string;
  referral_date: string;
  referral_reason: ReferralReason;
  advocate_service: string;
  advocate_name: string | null;
  advocate_contact: string | null;
  status: ReferralStatus;
  allocated_date: string | null;
  first_visit_date: string | null;
  last_contact_date: string | null;
  outcome: string | null;
  outcome_date: string | null;
  child_satisfied: boolean | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChildrensRightsRecord {
  id: string;
  home_id: string;
  child_id: string;
  child_name: string;
  record_date: string;
  recorded_by: string;
  right_type: RightType;
  child_informed: boolean;
  child_understands: boolean;
  child_exercised: boolean;
  support_provided: string | null;
  barriers_identified: string | null;
  actions_taken: string | null;
  review_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const REFERRAL_REASONS: { reason: ReferralReason; label: string }[] = [
  { reason: "lac_review", label: "LAC Review" },
  { reason: "complaint", label: "Complaint" },
  { reason: "care_plan_disagreement", label: "Care Plan Disagreement" },
  { reason: "placement_change", label: "Placement Change" },
  { reason: "child_request", label: "Child Request" },
  { reason: "safeguarding", label: "Safeguarding" },
  { reason: "restraint_incident", label: "Restraint Incident" },
  { reason: "rights_concern", label: "Rights Concern" },
  { reason: "other", label: "Other" },
];

export const REFERRAL_STATUSES: { status: ReferralStatus; label: string }[] = [
  { status: "referred", label: "Referred" },
  { status: "allocated", label: "Allocated" },
  { status: "active", label: "Active" },
  { status: "completed", label: "Completed" },
  { status: "declined", label: "Declined" },
  { status: "withdrawn", label: "Withdrawn" },
];

export const ADVOCATE_SERVICES: { service: string; label: string }[] = [
  { service: "nyas", label: "NYAS" },
  { service: "coram_voice", label: "Coram Voice" },
  { service: "barnardos", label: "Barnardo's" },
  { service: "the_childrens_society", label: "The Children's Society" },
  { service: "local_authority_advocacy", label: "Local Authority Advocacy" },
  { service: "other", label: "Other" },
];

export const CHILDRENS_RIGHTS: { right: RightType; label: string }[] = [
  { right: "complaint_process", label: "Complaint Process" },
  { right: "advocacy_access", label: "Access to Advocacy" },
  { right: "lac_review_participation", label: "LAC Review Participation" },
  { right: "care_plan_input", label: "Care Plan Input" },
  { right: "contact_arrangements", label: "Contact Arrangements" },
  { right: "privacy", label: "Privacy" },
  { right: "cultural_identity", label: "Cultural Identity" },
  { right: "education_choice", label: "Education Choice" },
  { right: "health_decisions", label: "Health Decisions" },
  { right: "recreation", label: "Recreation" },
  { right: "religious_practice", label: "Religious Practice" },
  { right: "independent_visitor", label: "Independent Visitor" },
  { right: "irp_access", label: "IRP Access" },
  { right: "ofsted_contact", label: "Ofsted Contact" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

/**
 * Compute advocacy and children's rights metrics from referrals and
 * rights records.
 *
 * Regulation references: CHR 2015 Reg 7 (quality of care), Reg 14 (care
 * planning), Reg 45 (review of quality), Children Act 1989 s26 (advocacy).
 */
export function computeAdvocacyMetrics(
  referrals: AdvocacyReferral[],
  rightsRecords: ChildrensRightsRecord[],
): {
  total_referrals: number;
  active_referrals: number;
  avg_days_to_allocation: number | null;
  children_with_advocates: number;
  by_reason: Record<string, number>;
  by_status: Record<string, number>;
  rights_awareness_rate: number | null;
  rights_exercise_rate: number | null;
  children_with_rights_records: number;
} {
  const byReason: Record<string, number> = {};
  const byStatus: Record<string, number> = {};

  let activeReferrals = 0;
  let totalAllocationDays = 0;
  let allocationCount = 0;
  const childrenWithActiveAdvocates = new Set<string>();

  for (const r of referrals) {
    // Count by reason
    byReason[r.referral_reason] = (byReason[r.referral_reason] ?? 0) + 1;

    // Count by status
    byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;

    // Active referrals
    if (r.status === "referred" || r.status === "allocated" || r.status === "active") {
      activeReferrals++;
    }

    // Children with advocates (allocated or active)
    if (r.status === "allocated" || r.status === "active") {
      childrenWithActiveAdvocates.add(r.child_id);
    }

    // Average days to allocation
    if (r.allocated_date) {
      const referralDate = new Date(r.referral_date).getTime();
      const allocatedDate = new Date(r.allocated_date).getTime();
      const days = (allocatedDate - referralDate) / (1000 * 60 * 60 * 24);
      totalAllocationDays += days;
      allocationCount++;
    }
  }

  const avgDaysToAllocation =
    allocationCount > 0
      ? Math.round((totalAllocationDays / allocationCount) * 10) / 10
      : null;

  // Rights awareness: % of records where child_informed is true
  let informedCount = 0;
  let exercisedCount = 0;
  const childrenWithRecords = new Set<string>();

  for (const rr of rightsRecords) {
    childrenWithRecords.add(rr.child_id);
    if (rr.child_informed) informedCount++;
    if (rr.child_exercised) exercisedCount++;
  }

  const rightsAwarenessRate =
    rightsRecords.length > 0
      ? Math.round((informedCount / rightsRecords.length) * 1000) / 10
      : null;

  const rightsExerciseRate =
    rightsRecords.length > 0
      ? Math.round((exercisedCount / rightsRecords.length) * 1000) / 10
      : null;

  return {
    total_referrals: referrals.length,
    active_referrals: activeReferrals,
    avg_days_to_allocation: avgDaysToAllocation,
    children_with_advocates: childrenWithActiveAdvocates.size,
    by_reason: byReason,
    by_status: byStatus,
    rights_awareness_rate: rightsAwarenessRate,
    rights_exercise_rate: rightsExerciseRate,
    children_with_rights_records: childrenWithRecords.size,
  };
}

/**
 * Identify advocacy and children's rights alerts that require attention.
 *
 * Alert categories:
 *   - Referral unallocated for more than 5 days (high)
 *   - No advocate contact in 30 days (medium)
 *   - Child not informed of key rights (high)
 *   - No advocacy referral for child making a complaint (medium)
 *   - Rights record not reviewed in 6+ months (medium)
 *   - Child dissatisfied with outcome (high)
 *
 * Regulation references: CHR 2015 Reg 7, Reg 14, Reg 45,
 * Children Act 1989 s26.
 */
export function identifyAdvocacyAlerts(
  referrals: AdvocacyReferral[],
  rightsRecords: ChildrensRightsRecord[],
  now: Date = new Date(),
): {
  severity: "critical" | "high" | "medium" | "low";
  category: string;
  message: string;
  related_id: string;
  related_type: "referral" | "rights_record";
}[] {
  const alerts: {
    severity: "critical" | "high" | "medium" | "low";
    category: string;
    message: string;
    related_id: string;
    related_type: "referral" | "rights_record";
  }[] = [];

  const fiveDaysMs = 5 * 24 * 60 * 60 * 1000;
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  const sixMonthsMs = 183 * 24 * 60 * 60 * 1000;

  // Build set of child IDs with active advocacy referrals
  const childrenWithAdvocacy = new Set<string>();
  for (const r of referrals) {
    if (r.status === "referred" || r.status === "allocated" || r.status === "active") {
      childrenWithAdvocacy.add(r.child_id);
    }
  }

  for (const r of referrals) {
    // Alert: unallocated referral > 5 days
    if (r.status === "referred" && !r.allocated_date) {
      const referralDate = new Date(r.referral_date).getTime();
      if (now.getTime() - referralDate > fiveDaysMs) {
        const daysElapsed = -londonDayDiff(new Date(referralDate), now);
        alerts.push({
          severity: "high",
          category: "unallocated_referral",
          message: `Advocacy referral for ${r.child_name} has been unallocated for ${daysElapsed} days — allocation expected within 5 days`,
          related_id: r.id,
          related_type: "referral",
        });
      }
    }

    // Alert: no contact in 30 days for active referrals
    if (r.status === "active" || r.status === "allocated") {
      const lastContact = r.last_contact_date
        ? new Date(r.last_contact_date).getTime()
        : new Date(r.referral_date).getTime();
      if (now.getTime() - lastContact > thirtyDaysMs) {
        const daysElapsed = -londonDayDiff(new Date(lastContact), now);
        alerts.push({
          severity: "medium",
          category: "no_recent_contact",
          message: `No advocate contact for ${r.child_name} in ${daysElapsed} days — regular contact required`,
          related_id: r.id,
          related_type: "referral",
        });
      }
    }

    // Alert: child dissatisfied with outcome
    if (r.child_satisfied === false && (r.status === "completed" || r.status === "declined")) {
      alerts.push({
        severity: "high",
        category: "child_dissatisfied",
        message: `${r.child_name} dissatisfied with advocacy outcome — review required under Reg 7 (quality of care)`,
        related_id: r.id,
        related_type: "referral",
      });
    }
  }

  // Alert: complaint referrals without advocacy
  const complaintReferrals = referrals.filter((r) => r.referral_reason === "complaint");

  // Check for children making complaints who have no advocacy referral
  // We detect this from referrals with reason "complaint" — if a child has a complaint
  // reason referral that was declined/withdrawn, and no active one, flag it
  const childrenWithDeclinedComplaintAdvocacy = complaintReferrals
    .filter((r) => r.status === "declined" || r.status === "withdrawn")
    .map((r) => r.child_id);

  for (const childId of childrenWithDeclinedComplaintAdvocacy) {
    const hasActiveComplaintAdvocacy = complaintReferrals.some(
      (r) => r.child_id === childId && (r.status === "referred" || r.status === "allocated" || r.status === "active"),
    );
    if (!hasActiveComplaintAdvocacy) {
      const declinedRef = complaintReferrals.find(
        (r) => r.child_id === childId && (r.status === "declined" || r.status === "withdrawn"),
      );
      if (declinedRef) {
        alerts.push({
          severity: "medium",
          category: "complaint_without_advocacy",
          message: `${declinedRef.child_name} has a complaint-related advocacy referral that was ${declinedRef.status} with no active replacement`,
          related_id: declinedRef.id,
          related_type: "referral",
        });
      }
    }
  }

  // Rights record alerts
  // Key rights that every child should be informed of
  const keyRights: RightType[] = ["complaint_process", "advocacy_access", "lac_review_participation", "care_plan_input"];

  // Build map: child_id -> set of rights they've been informed about
  const childRightsMap = new Map<string, Set<RightType>>();
  for (const rr of rightsRecords) {
    if (!childRightsMap.has(rr.child_id)) {
      childRightsMap.set(rr.child_id, new Set());
    }
    if (rr.child_informed) {
      childRightsMap.get(rr.child_id)!.add(rr.right_type);
    }
  }

  // Alert: child not informed of key rights
  for (const [childId, informedRights] of childRightsMap) {
    for (const keyRight of keyRights) {
      if (!informedRights.has(keyRight)) {
        const childRecord = rightsRecords.find((rr) => rr.child_id === childId);
        const rightLabel = CHILDRENS_RIGHTS.find((cr) => cr.right === keyRight)?.label ?? keyRight;
        if (childRecord) {
          alerts.push({
            severity: "high",
            category: "key_right_not_informed",
            message: `${childRecord.child_name} has not been informed of their right: ${rightLabel}`,
            related_id: childRecord.id,
            related_type: "rights_record",
          });
        }
      }
    }
  }

  // Alert: rights record not reviewed in 6+ months
  for (const rr of rightsRecords) {
    if (rr.review_date) {
      const reviewDate = new Date(rr.review_date).getTime();
      if (now.getTime() - reviewDate > sixMonthsMs) {
        const rightLabel = CHILDRENS_RIGHTS.find((cr) => cr.right === rr.right_type)?.label ?? rr.right_type;
        alerts.push({
          severity: "medium",
          category: "rights_review_overdue",
          message: `Rights record for ${rr.child_name} (${rightLabel}) not reviewed since ${rr.review_date} — 6-monthly review required under Reg 45`,
          related_id: rr.id,
          related_type: "rights_record",
        });
      }
    }
  }

  // Sort alerts: critical first, then high, then medium, then low
  const severityOrder: Record<string, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };
  alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return alerts;
}

// ── CRUD — Advocacy Referrals ──────────────────────────────────────────

export async function listReferrals(
  homeId: string,
  filters?: {
    childId?: string;
    status?: ReferralStatus;
    referralReason?: ReferralReason;
    limit?: number;
  },
): Promise<ServiceResult<AdvocacyReferral[]>> {
  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_advocacy_referrals") as SB).select("*").eq("home_id", homeId);
  if (filters?.childId) q = q.eq("child_id", filters.childId);
  if (filters?.status) q = q.eq("status", filters.status);
  if (filters?.referralReason) q = q.eq("referral_reason", filters.referralReason);
  q = q.order("created_at", { ascending: false }).limit(filters?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createReferral(
  input: {
    homeId: string;
    childId: string;
    childName: string;
    referralDate?: string;
    referralReason: ReferralReason;
    advocateService: string;
    advocateName?: string;
    advocateContact?: string;
    allocatedDate?: string;
    firstVisitDate?: string;
    lastContactDate?: string;
    outcome?: string;
    outcomeDate?: string;
    childSatisfied?: boolean;
    notes?: string;
  },
): Promise<ServiceResult<AdvocacyReferral>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_advocacy_referrals") as SB)
    .insert({
      home_id: input.homeId,
      child_id: input.childId,
      child_name: input.childName,
      referral_date: input.referralDate ?? todayStr(),
      referral_reason: input.referralReason,
      advocate_service: input.advocateService,
      advocate_name: input.advocateName ?? null,
      advocate_contact: input.advocateContact ?? null,
      status: "referred",
      allocated_date: input.allocatedDate ?? null,
      first_visit_date: input.firstVisitDate ?? null,
      last_contact_date: input.lastContactDate ?? null,
      outcome: input.outcome ?? null,
      outcome_date: input.outcomeDate ?? null,
      child_satisfied: input.childSatisfied ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateReferral(
  id: string,
  updates: Partial<Record<string, unknown>>,
): Promise<ServiceResult<AdvocacyReferral>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_advocacy_referrals") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── CRUD — Children's Rights Records ──────────────────────────────────

export async function listRightsRecords(
  homeId: string,
  filters?: {
    childId?: string;
    rightType?: RightType;
    limit?: number;
  },
): Promise<ServiceResult<ChildrensRightsRecord[]>> {
  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_childrens_rights_records") as SB).select("*").eq("home_id", homeId);
  if (filters?.childId) q = q.eq("child_id", filters.childId);
  if (filters?.rightType) q = q.eq("right_type", filters.rightType);
  q = q.order("created_at", { ascending: false }).limit(filters?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRightsRecord(
  input: {
    homeId: string;
    childId: string;
    childName: string;
    recordDate?: string;
    recordedBy: string;
    rightType: RightType;
    childInformed?: boolean;
    childUnderstands?: boolean;
    childExercised?: boolean;
    supportProvided?: string;
    barriersIdentified?: string;
    actionsTaken?: string;
    reviewDate?: string;
    notes?: string;
  },
): Promise<ServiceResult<ChildrensRightsRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_childrens_rights_records") as SB)
    .insert({
      home_id: input.homeId,
      child_id: input.childId,
      child_name: input.childName,
      record_date: input.recordDate ?? todayStr(),
      recorded_by: input.recordedBy,
      right_type: input.rightType,
      child_informed: input.childInformed ?? false,
      child_understands: input.childUnderstands ?? false,
      child_exercised: input.childExercised ?? false,
      support_provided: input.supportProvided ?? null,
      barriers_identified: input.barriersIdentified ?? null,
      actions_taken: input.actionsTaken ?? null,
      review_date: input.reviewDate ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateRightsRecord(
  id: string,
  updates: Partial<Record<string, unknown>>,
): Promise<ServiceResult<ChildrensRightsRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_childrens_rights_records") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeAdvocacyMetrics,
  identifyAdvocacyAlerts,
  REFERRAL_REASONS,
  REFERRAL_STATUSES,
  ADVOCATE_SERVICES,
  CHILDRENS_RIGHTS,
};
