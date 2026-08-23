// ══════════════════════════════════════════════════════════════════════════════
// CARA — POLICIES & PROCEDURES REGISTER SERVICE
// Manages the home's policy register, staff acknowledgements, and review
// history under CHR 2015 Reg 38 (policies and procedures). Cross-references
// Reg 12 (safeguarding), Reg 19 (behaviour management), Reg 20 (restraint),
// Reg 23 (medication), Reg 25 (health & safety), Reg 32/33 (recruitment),
// Reg 34 (fitness of workers), Reg 36 (records), Reg 39 (complaints), and
// Reg 40 (missing children). Supports SCCIF Leadership & Management evidence.
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import { londonDayDiff } from "@/lib/utils";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ───────────────────────────────────────────────────────────────────

export type PolicyCategory =
  | "safeguarding"
  | "behaviour_management"
  | "health_safety"
  | "medication"
  | "missing_children"
  | "restraint"
  | "complaints"
  | "whistleblowing"
  | "recruitment"
  | "data_protection"
  | "fire_safety"
  | "lone_working"
  | "equality_diversity"
  | "anti_bullying"
  | "internet_safety"
  | "intimate_care"
  | "other";

export type PolicyStatus = "draft" | "active" | "under_review" | "archived" | "superseded";

export type ReviewFrequency = "quarterly" | "biannual" | "annual" | "biennial";

export type ReviewOutcome = "no_changes" | "minor_update" | "major_revision" | "superseded";

export interface Policy {
  id: string;
  home_id: string;
  policy_name: string;
  policy_reference: string | null;
  category: PolicyCategory;
  regulation_reference: string | null;
  description: string;
  version: string;
  status: PolicyStatus;
  owner: string;
  approved_by: string | null;
  approval_date: string | null;
  effective_date: string;
  review_date: string;
  last_reviewed_date: string | null;
  reviewed_by: string | null;
  review_frequency: ReviewFrequency;
  document_url: string | null;
  staff_acknowledgement_required: boolean;
  created_at: string;
  updated_at: string;
}

export interface PolicyAcknowledgement {
  id: string;
  home_id: string;
  policy_id: string;
  staff_id: string;
  staff_name: string;
  acknowledged_date: string;
  acknowledged: boolean;
  notes: string | null;
  created_at: string;
}

export interface PolicyReviewHistory {
  id: string;
  home_id: string;
  policy_id: string;
  review_date: string;
  reviewed_by: string;
  previous_version: string | null;
  new_version: string | null;
  changes_summary: string;
  outcome: ReviewOutcome;
  next_review_date: string | null;
  created_at: string;
}

// ── Constants ───────────────────────────────────────────────────────────────

export const POLICY_CATEGORIES: { category: PolicyCategory; label: string }[] = [
  { category: "safeguarding", label: "Safeguarding" },
  { category: "behaviour_management", label: "Behaviour Management" },
  { category: "health_safety", label: "Health & Safety" },
  { category: "medication", label: "Medication" },
  { category: "missing_children", label: "Missing Children" },
  { category: "restraint", label: "Restraint / Physical Intervention" },
  { category: "complaints", label: "Complaints & Representations" },
  { category: "whistleblowing", label: "Whistleblowing" },
  { category: "recruitment", label: "Recruitment & Selection" },
  { category: "data_protection", label: "Data Protection / GDPR" },
  { category: "fire_safety", label: "Fire Safety" },
  { category: "lone_working", label: "Lone Working" },
  { category: "equality_diversity", label: "Equality & Diversity" },
  { category: "anti_bullying", label: "Anti-Bullying" },
  { category: "internet_safety", label: "Internet Safety & Social Media" },
  { category: "intimate_care", label: "Intimate Care" },
  { category: "other", label: "Other" },
];

export const POLICY_STATUSES: { status: PolicyStatus; label: string }[] = [
  { status: "draft", label: "Draft" },
  { status: "active", label: "Active" },
  { status: "under_review", label: "Under Review" },
  { status: "archived", label: "Archived" },
  { status: "superseded", label: "Superseded" },
];

export const REVIEW_FREQUENCIES: { frequency: ReviewFrequency; label: string }[] = [
  { frequency: "quarterly", label: "Quarterly" },
  { frequency: "biannual", label: "Biannual (6-monthly)" },
  { frequency: "annual", label: "Annual" },
  { frequency: "biennial", label: "Biennial (2-yearly)" },
];

export const REVIEW_OUTCOMES: { outcome: ReviewOutcome; label: string }[] = [
  { outcome: "no_changes", label: "No Changes Required" },
  { outcome: "minor_update", label: "Minor Update" },
  { outcome: "major_revision", label: "Major Revision" },
  { outcome: "superseded", label: "Superseded" },
];

export const REQUIRED_POLICIES: { category: PolicyCategory; name: string; regulation: string }[] = [
  { category: "safeguarding", name: "Safeguarding Children Policy", regulation: "Reg 12" },
  { category: "behaviour_management", name: "Behaviour Management Policy", regulation: "Reg 19" },
  { category: "missing_children", name: "Missing from Care Policy", regulation: "Reg 40" },
  { category: "restraint", name: "Physical Intervention / Restraint Policy", regulation: "Reg 20" },
  { category: "complaints", name: "Complaints & Representations Policy", regulation: "Reg 39" },
  { category: "whistleblowing", name: "Whistleblowing Policy", regulation: "Reg 38" },
  { category: "medication", name: "Medication Administration Policy", regulation: "Reg 23" },
  { category: "health_safety", name: "Health & Safety Policy", regulation: "Reg 25" },
  { category: "fire_safety", name: "Fire Safety Policy", regulation: "Reg 25" },
  { category: "recruitment", name: "Safer Recruitment Policy", regulation: "Reg 32/33" },
  { category: "data_protection", name: "Data Protection / GDPR Policy", regulation: "Reg 36" },
  { category: "anti_bullying", name: "Anti-Bullying Policy", regulation: "Reg 12" },
];

// ── Pure functions (no DB) ──────────────────────────────────────────────────

/**
 * Compute policy register metrics including review status, category breakdown,
 * acknowledgement rates, and gap analysis against required policies.
 */
function computePolicyMetrics(
  policies: Policy[],
  acknowledgements: PolicyAcknowledgement[],
): {
  total_policies: number;
  active_policies: number;
  overdue_reviews: number;
  upcoming_reviews_30d: number;
  by_category: Record<string, number>;
  by_status: Record<string, number>;
  acknowledgement_rate: number | null;
  missing_required_policies: { category: PolicyCategory; name: string; regulation: string }[];
  avg_days_since_review: number | null;
} {
  const now = new Date();
  const thirtyDaysMs = 30 * 86400000;

  const active = policies.filter((p) => p.status === "active");

  // Overdue reviews: active policies whose review_date is in the past
  const overdue = active.filter((p) => new Date(p.review_date).getTime() < now.getTime());

  // Upcoming reviews within 30 days (not yet overdue)
  const upcoming = active.filter((p) => {
    const reviewTime = new Date(p.review_date).getTime();
    const diff = reviewTime - now.getTime();
    return diff >= 0 && diff <= thirtyDaysMs;
  });

  // By category
  const byCategory: Record<string, number> = {};
  for (const p of policies) {
    byCategory[p.category] = (byCategory[p.category] ?? 0) + 1;
  }

  // By status
  const byStatus: Record<string, number> = {};
  for (const p of policies) {
    byStatus[p.status] = (byStatus[p.status] ?? 0) + 1;
  }

  // Acknowledgement rate: across policies that require acknowledgement,
  // what % of expected acknowledgements have been completed
  const policiesRequiringAck = policies.filter((p) => p.staff_acknowledgement_required && p.status === "active");
  let totalExpected = 0;
  let totalAcknowledged = 0;
  for (const p of policiesRequiringAck) {
    const policyAcks = acknowledgements.filter((a) => a.policy_id === p.id);
    const acknowledgedCount = policyAcks.filter((a) => a.acknowledged).length;
    // Count all acknowledgement records for this policy as the expected count
    totalExpected += policyAcks.length > 0 ? policyAcks.length : 1;
    totalAcknowledged += acknowledgedCount;
  }
  const acknowledgementRate = totalExpected > 0
    ? Math.round((totalAcknowledged / totalExpected) * 100)
    : null;

  // Missing required policies: compare REQUIRED_POLICIES against active policy categories
  const activeCategories = new Set(active.map((p) => p.category));
  const missing = REQUIRED_POLICIES.filter((rp) => !activeCategories.has(rp.category));

  // Average days since last review (for policies that have been reviewed)
  const reviewedPolicies = policies.filter((p) => p.last_reviewed_date);
  let totalDaysSinceReview = 0;
  for (const p of reviewedPolicies) {
    const daysSince = -londonDayDiff(p.last_reviewed_date!, now);
    totalDaysSinceReview += daysSince;
  }
  const avgDaysSinceReview = reviewedPolicies.length > 0
    ? Math.round(totalDaysSinceReview / reviewedPolicies.length)
    : null;

  return {
    total_policies: policies.length,
    active_policies: active.length,
    overdue_reviews: overdue.length,
    upcoming_reviews_30d: upcoming.length,
    by_category: byCategory,
    by_status: byStatus,
    acknowledgement_rate: acknowledgementRate,
    missing_required_policies: missing,
    avg_days_since_review: avgDaysSinceReview,
  };
}

/**
 * Identify policy governance alerts ranked by severity.
 */
function identifyPolicyAlerts(
  policies: Policy[],
  acknowledgements: PolicyAcknowledgement[],
): { type: string; severity: "critical" | "high" | "medium" | "low"; message: string }[] {
  const now = new Date();
  const fourteenDaysMs = 14 * 86400000;
  const thirtyDaysMs = 30 * 86400000;
  const alerts: { type: string; severity: "critical" | "high" | "medium" | "low"; message: string }[] = [];

  const active = policies.filter((p) => p.status === "active");
  const activeCategories = new Set(active.map((p) => p.category));

  // Missing required policies — critical
  const missingRequired = REQUIRED_POLICIES.filter((rp) => !activeCategories.has(rp.category));
  for (const m of missingRequired) {
    alerts.push({
      type: "missing_required_policy",
      severity: "critical",
      message: `Required policy missing: ${m.name} (${m.regulation}) — Reg 38 requires this policy to be in place.`,
    });
  }

  // Overdue reviews — high
  const overdueReviews = active.filter((p) => new Date(p.review_date).getTime() < now.getTime());
  for (const p of overdueReviews) {
    alerts.push({
      type: "overdue_review",
      severity: "high",
      message: `Policy "${p.policy_name}" review is overdue (due ${p.review_date}). Reg 38 requires policies to be kept under review.`,
    });
  }

  // Review due within 14 days — medium
  const reviewDueSoon = active.filter((p) => {
    const diff = new Date(p.review_date).getTime() - now.getTime();
    return diff >= 0 && diff <= fourteenDaysMs;
  });
  for (const p of reviewDueSoon) {
    alerts.push({
      type: "review_due_soon",
      severity: "medium",
      message: `Policy "${p.policy_name}" review is due within 14 days (${p.review_date}).`,
    });
  }

  // No acknowledgement records for a policy requiring acknowledgement — medium
  const policiesRequiringAck = active.filter((p) => p.staff_acknowledgement_required);
  for (const p of policiesRequiringAck) {
    const policyAcks = acknowledgements.filter((a) => a.policy_id === p.id);
    if (policyAcks.length === 0) {
      alerts.push({
        type: "no_acknowledgements",
        severity: "medium",
        message: `Policy "${p.policy_name}" requires staff acknowledgement but has no acknowledgement records.`,
      });
    }
  }

  // Acknowledgement rate below 80% for a policy — high
  for (const p of policiesRequiringAck) {
    const policyAcks = acknowledgements.filter((a) => a.policy_id === p.id);
    if (policyAcks.length === 0) continue; // Already caught above
    const ackRate = Math.round(
      (policyAcks.filter((a) => a.acknowledged).length / policyAcks.length) * 100,
    );
    if (ackRate < 80) {
      alerts.push({
        type: "low_acknowledgement_rate",
        severity: "high",
        message: `Policy "${p.policy_name}" acknowledgement rate is ${ackRate}% — below 80% threshold.`,
      });
    }
  }

  // Policy in draft for more than 30 days — medium
  const drafts = policies.filter((p) => p.status === "draft");
  for (const p of drafts) {
    const daysSinceCreated = now.getTime() - new Date(p.created_at).getTime();
    if (daysSinceCreated > thirtyDaysMs) {
      alerts.push({
        type: "draft_stale",
        severity: "medium",
        message: `Policy "${p.policy_name}" has been in draft for more than 30 days. Review and publish or discard.`,
      });
    }
  }

  // Superseded policy still active — high
  // (A policy marked superseded should not also be active; check for policies
  //  with same category where one is superseded and another is still active
  //  but with an older version — simplified: just flag any with status "superseded"
  //  that somehow have status "active" which is a contradiction caught by checking
  //  if there are active policies whose version is older than a superseded one.)
  const superseded = policies.filter((p) => p.status === "superseded");
  for (const sp of superseded) {
    const activeInCategory = active.filter(
      (p) => p.category === sp.category && p.version < sp.version,
    );
    for (const old of activeInCategory) {
      alerts.push({
        type: "superseded_still_active",
        severity: "high",
        message: `Policy "${old.policy_name}" (v${old.version}) is still active but has been superseded by v${sp.version}.`,
      });
    }
  }

  // No document URL — low
  for (const p of active) {
    if (!p.document_url) {
      alerts.push({
        type: "no_document_url",
        severity: "low",
        message: `Policy "${p.policy_name}" has no document URL linked. Attach the policy document for staff access.`,
      });
    }
  }

  return alerts;
}

// ── CRUD — Policies ────────────────────────────────────────────────────────

export async function listPolicies(
  homeId: string,
  filters?: {
    category?: string;
    status?: string;
    owner?: string;
    limit?: number;
  },
): Promise<ServiceResult<Policy[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_policies") as SB).select("*").eq("home_id", homeId);
  if (filters?.category) q = q.eq("category", filters.category);
  if (filters?.status) q = q.eq("status", filters.status);
  if (filters?.owner) q = q.eq("owner", filters.owner);
  q = q.order("policy_name", { ascending: true }).limit(filters?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createPolicy(
  input: Omit<Policy, "id" | "created_at" | "updated_at">,
): Promise<ServiceResult<Policy>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_policies") as SB)
    .insert({
      home_id: input.home_id,
      policy_name: input.policy_name,
      policy_reference: input.policy_reference ?? null,
      category: input.category,
      regulation_reference: input.regulation_reference ?? null,
      description: input.description,
      version: input.version,
      status: input.status,
      owner: input.owner,
      approved_by: input.approved_by ?? null,
      approval_date: input.approval_date ?? null,
      effective_date: input.effective_date,
      review_date: input.review_date,
      last_reviewed_date: input.last_reviewed_date ?? null,
      reviewed_by: input.reviewed_by ?? null,
      review_frequency: input.review_frequency,
      document_url: input.document_url ?? null,
      staff_acknowledgement_required: input.staff_acknowledgement_required,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updatePolicy(
  id: string,
  updates: Partial<Policy>,
): Promise<ServiceResult<Policy>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_policies") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── CRUD — Acknowledgements ────────────────────────────────────────────────

export async function listAcknowledgements(
  homeId: string,
  filters?: {
    policyId?: string;
    staffId?: string;
    limit?: number;
  },
): Promise<ServiceResult<PolicyAcknowledgement[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_policy_acknowledgements") as SB).select("*").eq("home_id", homeId);
  if (filters?.policyId) q = q.eq("policy_id", filters.policyId);
  if (filters?.staffId) q = q.eq("staff_id", filters.staffId);
  q = q.order("acknowledged_date", { ascending: false }).limit(filters?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createAcknowledgement(
  input: Omit<PolicyAcknowledgement, "id" | "created_at">,
): Promise<ServiceResult<PolicyAcknowledgement>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_policy_acknowledgements") as SB)
    .insert({
      home_id: input.home_id,
      policy_id: input.policy_id,
      staff_id: input.staff_id,
      staff_name: input.staff_name,
      acknowledged_date: input.acknowledged_date,
      acknowledged: input.acknowledged,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── CRUD — Review History ──────────────────────────────────────────────────

export async function listReviewHistory(
  homeId: string,
  filters?: {
    policyId?: string;
    reviewedBy?: string;
    outcome?: string;
    limit?: number;
  },
): Promise<ServiceResult<PolicyReviewHistory[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_policy_review_history") as SB).select("*").eq("home_id", homeId);
  if (filters?.policyId) q = q.eq("policy_id", filters.policyId);
  if (filters?.reviewedBy) q = q.eq("reviewed_by", filters.reviewedBy);
  if (filters?.outcome) q = q.eq("outcome", filters.outcome);
  q = q.order("review_date", { ascending: false }).limit(filters?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createReviewHistory(
  input: Omit<PolicyReviewHistory, "id" | "created_at">,
): Promise<ServiceResult<PolicyReviewHistory>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_policy_review_history") as SB)
    .insert({
      home_id: input.home_id,
      policy_id: input.policy_id,
      review_date: input.review_date,
      reviewed_by: input.reviewed_by,
      previous_version: input.previous_version ?? null,
      new_version: input.new_version ?? null,
      changes_summary: input.changes_summary,
      outcome: input.outcome,
      next_review_date: input.next_review_date ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ────────────────────────────────────────────────────────

export const _testing = {
  computePolicyMetrics,
  identifyPolicyAlerts,
};
