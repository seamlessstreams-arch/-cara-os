// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — WHISTLEBLOWING SERVICE
// Manages whistleblowing disclosures and policy compliance under
// CHR 2015 Reg 41 (whistleblowing) and the Public Interest Disclosure Act 1998.
//
// Tracks protected disclosures from receipt through investigation and outcome,
// including external referrals to Ofsted, LADO, police, local authority, and DBS.
// Monitors policy accessibility, staff awareness, and whistleblower protection
// from detriment — ensuring children's homes meet statutory whistleblowing duties.
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

export type DisclosureCategory =
  | "safeguarding_concern"
  | "staff_misconduct"
  | "regulatory_breach"
  | "health_safety"
  | "financial_irregularity"
  | "neglect_abuse"
  | "policy_violation"
  | "other";

export type DisclosureRiskLevel =
  | "critical"
  | "high"
  | "medium"
  | "low";

export type DisclosureStatus =
  | "received"
  | "acknowledged"
  | "under_investigation"
  | "referred_externally"
  | "resolved"
  | "closed"
  | "withdrawn";

export type DisclosureOutcome =
  | "substantiated"
  | "partially_substantiated"
  | "unsubstantiated"
  | "inconclusive"
  | "referred";

export type ReferralBody =
  | "ofsted"
  | "lado"
  | "police"
  | "local_authority"
  | "dbs"
  | "none";

export interface WhistleblowingReport {
  id: string;
  home_id: string;
  reporter_id: string | null;
  reporter_name: string | null;
  reporter_role: string;
  is_anonymous: boolean;
  disclosure_date: string;
  received_by: string;
  category: DisclosureCategory;
  description: string;
  persons_involved: unknown[];
  evidence_provided: string | null;
  location: string | null;
  risk_level: DisclosureRiskLevel;
  status: DisclosureStatus;
  acknowledged_date: string | null;
  acknowledged_by: string | null;
  investigating_officer: string | null;
  investigation_start_date: string | null;
  investigation_end_date: string | null;
  outcome: DisclosureOutcome | null;
  outcome_details: string | null;
  actions_taken: unknown[];
  referred_to: ReferralBody | null;
  referral_date: string | null;
  referral_reference: string | null;
  whistleblower_protected: boolean;
  detriment_reported: boolean;
  detriment_details: string | null;
  follow_up_date: string | null;
  follow_up_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface WhistleblowingPolicyReview {
  id: string;
  home_id: string;
  review_date: string;
  reviewed_by: string;
  policy_accessible: boolean;
  policy_displayed: boolean;
  staff_trained_count: number;
  total_staff_count: number;
  external_contacts_displayed: boolean;
  children_informed: boolean;
  review_notes: string | null;
  next_review_date: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const DISCLOSURE_CATEGORIES: { category: DisclosureCategory; label: string }[] = [
  { category: "safeguarding_concern", label: "Safeguarding Concern" },
  { category: "staff_misconduct", label: "Staff Misconduct" },
  { category: "regulatory_breach", label: "Regulatory Breach" },
  { category: "health_safety", label: "Health & Safety" },
  { category: "financial_irregularity", label: "Financial Irregularity" },
  { category: "neglect_abuse", label: "Neglect or Abuse" },
  { category: "policy_violation", label: "Policy Violation" },
  { category: "other", label: "Other" },
];

export const DISCLOSURE_RISK_LEVELS: { level: DisclosureRiskLevel; label: string }[] = [
  { level: "critical", label: "Critical" },
  { level: "high", label: "High" },
  { level: "medium", label: "Medium" },
  { level: "low", label: "Low" },
];

export const DISCLOSURE_STATUS: { status: DisclosureStatus; label: string }[] = [
  { status: "received", label: "Received" },
  { status: "acknowledged", label: "Acknowledged" },
  { status: "under_investigation", label: "Under Investigation" },
  { status: "referred_externally", label: "Referred Externally" },
  { status: "resolved", label: "Resolved" },
  { status: "closed", label: "Closed" },
  { status: "withdrawn", label: "Withdrawn" },
];

export const DISCLOSURE_OUTCOMES: { outcome: DisclosureOutcome; label: string }[] = [
  { outcome: "substantiated", label: "Substantiated" },
  { outcome: "partially_substantiated", label: "Partially Substantiated" },
  { outcome: "unsubstantiated", label: "Unsubstantiated" },
  { outcome: "inconclusive", label: "Inconclusive" },
  { outcome: "referred", label: "Referred" },
];

export const REFERRAL_BODIES: { body: ReferralBody; label: string }[] = [
  { body: "ofsted", label: "Ofsted" },
  { body: "lado", label: "LADO" },
  { body: "police", label: "Police" },
  { body: "local_authority", label: "Local Authority" },
  { body: "dbs", label: "DBS" },
  { body: "none", label: "None" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

/**
 * Compute summary metrics across whistleblowing reports and policy reviews.
 */
export function computeWhistleblowingMetrics(
  reports: WhistleblowingReport[],
  policyReviews: WhistleblowingPolicyReview[],
): {
  total_reports: number;
  open_reports: number;
  avg_resolution_days: number;
  by_category: Record<string, number>;
  by_risk_level: Record<string, number>;
  by_outcome: Record<string, number>;
  external_referrals_count: number;
  detriment_reported_count: number;
  policy_compliance_rate: number;
  staff_training_rate: number;
} {
  const openStatuses: DisclosureStatus[] = [
    "received",
    "acknowledged",
    "under_investigation",
    "referred_externally",
  ];

  let openReports = 0;
  let totalResolutionDays = 0;
  let resolutionCount = 0;
  let externalReferralsCount = 0;
  let detrimentReportedCount = 0;

  const byCategory: Record<string, number> = {};
  const byRiskLevel: Record<string, number> = {};
  const byOutcome: Record<string, number> = {};

  for (const r of reports) {
    // Open reports
    if (openStatuses.includes(r.status)) {
      openReports++;
    }

    // By category
    byCategory[r.category] = (byCategory[r.category] ?? 0) + 1;

    // By risk level
    byRiskLevel[r.risk_level] = (byRiskLevel[r.risk_level] ?? 0) + 1;

    // By outcome (only where outcome has been determined)
    if (r.outcome) {
      byOutcome[r.outcome] = (byOutcome[r.outcome] ?? 0) + 1;
    }

    // Average resolution days (resolved/closed with investigation dates)
    if (
      (r.status === "resolved" || r.status === "closed") &&
      r.investigation_start_date &&
      r.investigation_end_date
    ) {
      const started = new Date(r.investigation_start_date).getTime();
      const ended = new Date(r.investigation_end_date).getTime();
      const days = (ended - started) / (1000 * 60 * 60 * 24);
      totalResolutionDays += days;
      resolutionCount++;
    }

    // External referrals
    if (r.referred_to && r.referred_to !== "none") {
      externalReferralsCount++;
    }

    // Detriment reported
    if (r.detriment_reported) {
      detrimentReportedCount++;
    }
  }

  const avgResolutionDays =
    resolutionCount > 0
      ? Math.round((totalResolutionDays / resolutionCount) * 10) / 10
      : 0;

  // Policy compliance — percentage of reviews where policy is accessible AND displayed
  let compliantReviews = 0;
  for (const pr of policyReviews) {
    if (pr.policy_accessible && pr.policy_displayed) {
      compliantReviews++;
    }
  }
  const policyComplianceRate =
    policyReviews.length > 0
      ? Math.round((compliantReviews / policyReviews.length) * 1000) / 10
      : 0;

  // Staff training rate — from the most recent policy review
  let staffTrainingRate = 0;
  if (policyReviews.length > 0) {
    const sorted = [...policyReviews].sort(
      (a, b) => new Date(b.review_date).getTime() - new Date(a.review_date).getTime(),
    );
    const latest = sorted[0];
    if (latest.total_staff_count > 0) {
      staffTrainingRate =
        Math.round((latest.staff_trained_count / latest.total_staff_count) * 1000) / 10;
    }
  }

  return {
    total_reports: reports.length,
    open_reports: openReports,
    avg_resolution_days: avgResolutionDays,
    by_category: byCategory,
    by_risk_level: byRiskLevel,
    by_outcome: byOutcome,
    external_referrals_count: externalReferralsCount,
    detriment_reported_count: detrimentReportedCount,
    policy_compliance_rate: policyComplianceRate,
    staff_training_rate: staffTrainingRate,
  };
}

/**
 * Identify alerts requiring management attention from whistleblowing reports
 * and policy reviews.
 */
export function identifyWhistleblowingAlerts(
  reports: WhistleblowingReport[],
  policyReviews: WhistleblowingPolicyReview[],
  now: Date = new Date(),
): {
  type: string;
  severity: "critical" | "high" | "medium" | "low";
  message: string;
  id: string;
}[] {
  const alerts: {
    type: string;
    severity: "critical" | "high" | "medium" | "low";
    message: string;
    id: string;
  }[] = [];

  const fortyEightHoursMs = 48 * 60 * 60 * 1000;
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  const sixMonthsMs = 180 * 24 * 60 * 60 * 1000;

  // ── Report alerts ───────────────────────────────────────────────────

  for (const r of reports) {
    // Unacknowledged reports > 48 hours — critical
    if (r.status === "received" && !r.acknowledged_date) {
      const disclosureDate = new Date(r.disclosure_date).getTime();
      if (now.getTime() - disclosureDate > fortyEightHoursMs) {
        const hoursElapsed = Math.round(
          (now.getTime() - disclosureDate) / (1000 * 60 * 60),
        );
        alerts.push({
          type: "unacknowledged_disclosure",
          severity: "critical",
          message: `Whistleblowing disclosure received ${hoursElapsed}h ago has not been acknowledged — PIDA 1998 requires prompt acknowledgement`,
          id: r.id,
        });
      }
    }

    // High/critical risk open > 7 days — high
    if (
      (r.risk_level === "high" || r.risk_level === "critical") &&
      r.status !== "resolved" &&
      r.status !== "closed" &&
      r.status !== "withdrawn"
    ) {
      const disclosureDate = new Date(r.disclosure_date).getTime();
      if (now.getTime() - disclosureDate > sevenDaysMs) {
        const daysElapsed = Math.round(
          (now.getTime() - disclosureDate) / (1000 * 60 * 60 * 24),
        );
        alerts.push({
          type: "high_risk_open",
          severity: "high",
          message: `${r.risk_level.charAt(0).toUpperCase() + r.risk_level.slice(1)}-risk disclosure open for ${daysElapsed} days — requires urgent resolution`,
          id: r.id,
        });
      }
    }

    // Investigation ongoing > 30 days — medium
    if (
      r.status === "under_investigation" &&
      r.investigation_start_date &&
      !r.investigation_end_date
    ) {
      const startDate = new Date(r.investigation_start_date).getTime();
      if (now.getTime() - startDate > thirtyDaysMs) {
        const daysElapsed = Math.round(
          (now.getTime() - startDate) / (1000 * 60 * 60 * 24),
        );
        alerts.push({
          type: "investigation_prolonged",
          severity: "medium",
          message: `Whistleblowing investigation has been running for ${daysElapsed} days — review whether case can be concluded`,
          id: r.id,
        });
      }
    }

    // Follow-up overdue — high
    if (
      r.follow_up_date &&
      !r.follow_up_completed
    ) {
      const followUpDate = new Date(r.follow_up_date).getTime();
      if (now.getTime() > followUpDate) {
        const daysOverdue = Math.round(
          (now.getTime() - followUpDate) / (1000 * 60 * 60 * 24),
        );
        alerts.push({
          type: "follow_up_overdue",
          severity: "high",
          message: `Whistleblowing follow-up is ${daysOverdue} days overdue — whistleblower welfare check required`,
          id: r.id,
        });
      }
    }

    // Detriment reported — critical
    if (r.detriment_reported && r.status !== "closed") {
      alerts.push({
        type: "detriment_reported",
        severity: "critical",
        message: `Whistleblower has reported suffering detriment — PIDA 1998 protection breach requires immediate action`,
        id: r.id,
      });
    }
  }

  // ── Policy review alerts ────────────────────────────────────────────

  if (policyReviews.length > 0) {
    const sorted = [...policyReviews].sort(
      (a, b) => new Date(b.review_date).getTime() - new Date(a.review_date).getTime(),
    );
    const latest = sorted[0];

    // Policy not reviewed in 6+ months — high
    const latestReviewDate = new Date(latest.review_date).getTime();
    if (now.getTime() - latestReviewDate > sixMonthsMs) {
      const monthsElapsed = Math.round(
        (now.getTime() - latestReviewDate) / (1000 * 60 * 60 * 24 * 30),
      );
      alerts.push({
        type: "policy_review_overdue",
        severity: "high",
        message: `Whistleblowing policy has not been reviewed for ${monthsElapsed} months — Reg 41 requires regular review`,
        id: latest.id,
      });
    }

    // Staff training below 90% — medium
    if (latest.total_staff_count > 0) {
      const trainingRate = latest.staff_trained_count / latest.total_staff_count;
      if (trainingRate < 0.9) {
        const percentage = Math.round(trainingRate * 1000) / 10;
        alerts.push({
          type: "staff_training_low",
          severity: "medium",
          message: `Only ${percentage}% of staff trained on whistleblowing policy — target is 90% (Reg 41)`,
          id: latest.id,
        });
      }
    }

    // External contacts not displayed — high
    if (!latest.external_contacts_displayed) {
      alerts.push({
        type: "external_contacts_not_displayed",
        severity: "high",
        message: `Ofsted, LADO, and police contact details are not displayed — staff and children must have access to external reporting routes`,
        id: latest.id,
      });
    }
  } else {
    // No policy reviews at all — high
    alerts.push({
      type: "no_policy_review",
      severity: "high",
      message: `No whistleblowing policy review on record — Reg 41 requires policy to be maintained and reviewed`,
      id: "none",
    });
  }

  return alerts;
}

// ── CRUD — Whistleblowing Reports ───────────────────────────────────────

export async function listReports(
  homeId: string,
  filters?: {
    category?: DisclosureCategory;
    status?: DisclosureStatus;
    riskLevel?: DisclosureRiskLevel;
    limit?: number;
  },
): Promise<ServiceResult<WhistleblowingReport[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_whistleblowing_reports") as SB)
    .select("*")
    .eq("home_id", homeId);
  if (filters?.category) q = q.eq("category", filters.category);
  if (filters?.status) q = q.eq("status", filters.status);
  if (filters?.riskLevel) q = q.eq("risk_level", filters.riskLevel);
  q = q.order("created_at", { ascending: false }).limit(filters?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createReport(
  input: {
    homeId: string;
    reporterId?: string;
    reporterName?: string;
    reporterRole: string;
    isAnonymous?: boolean;
    disclosureDate: string;
    receivedBy: string;
    category: DisclosureCategory;
    description: string;
    personsInvolved?: unknown[];
    evidenceProvided?: string;
    location?: string;
    riskLevel: DisclosureRiskLevel;
    referredTo?: ReferralBody;
    referralDate?: string;
    referralReference?: string;
  },
): Promise<ServiceResult<WhistleblowingReport>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const isAnonymous = input.isAnonymous ?? false;

  const { data, error } = await (s.from("cs_whistleblowing_reports") as SB)
    .insert({
      home_id: input.homeId,
      reporter_id: isAnonymous ? null : (input.reporterId ?? null),
      reporter_name: isAnonymous ? null : (input.reporterName ?? null),
      reporter_role: input.reporterRole,
      is_anonymous: isAnonymous,
      disclosure_date: input.disclosureDate,
      received_by: input.receivedBy,
      category: input.category,
      description: input.description,
      persons_involved: input.personsInvolved ?? [],
      evidence_provided: input.evidenceProvided ?? null,
      location: input.location ?? null,
      risk_level: input.riskLevel,
      status: "received",
      acknowledged_date: null,
      acknowledged_by: null,
      investigating_officer: null,
      investigation_start_date: null,
      investigation_end_date: null,
      outcome: null,
      outcome_details: null,
      actions_taken: [],
      referred_to: input.referredTo ?? null,
      referral_date: input.referralDate ?? null,
      referral_reference: input.referralReference ?? null,
      whistleblower_protected: true,
      detriment_reported: false,
      detriment_details: null,
      follow_up_date: null,
      follow_up_completed: false,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateReport(
  id: string,
  updates: Partial<WhistleblowingReport>,
): Promise<ServiceResult<WhistleblowingReport>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_whistleblowing_reports") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── CRUD — Policy Reviews ───────────────────────────────────────────────

export async function listPolicyReviews(
  homeId: string,
  filters?: {
    limit?: number;
  },
): Promise<ServiceResult<WhistleblowingPolicyReview[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_whistleblowing_policy_reviews") as SB)
    .select("*")
    .eq("home_id", homeId);
  q = q.order("created_at", { ascending: false }).limit(filters?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createPolicyReview(
  input: {
    homeId: string;
    reviewDate: string;
    reviewedBy: string;
    policyAccessible?: boolean;
    policyDisplayed?: boolean;
    staffTrainedCount?: number;
    totalStaffCount?: number;
    externalContactsDisplayed?: boolean;
    childrenInformed?: boolean;
    reviewNotes?: string;
    nextReviewDate?: string;
  },
): Promise<ServiceResult<WhistleblowingPolicyReview>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_whistleblowing_policy_reviews") as SB)
    .insert({
      home_id: input.homeId,
      review_date: input.reviewDate,
      reviewed_by: input.reviewedBy,
      policy_accessible: input.policyAccessible ?? true,
      policy_displayed: input.policyDisplayed ?? true,
      staff_trained_count: input.staffTrainedCount ?? 0,
      total_staff_count: input.totalStaffCount ?? 0,
      external_contacts_displayed: input.externalContactsDisplayed ?? true,
      children_informed: input.childrenInformed ?? false,
      review_notes: input.reviewNotes ?? null,
      next_review_date: input.nextReviewDate ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updatePolicyReview(
  id: string,
  updates: Partial<WhistleblowingPolicyReview>,
): Promise<ServiceResult<WhistleblowingPolicyReview>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_whistleblowing_policy_reviews") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeWhistleblowingMetrics,
  identifyWhistleblowingAlerts,
};
