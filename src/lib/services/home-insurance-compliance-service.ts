// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME INSURANCE COMPLIANCE SERVICE
// Insurance policy tracking, renewal management, coverage verification,
// claim tracking, gap analysis, and regulatory compliance.
// CHR 2015 Reg 25 (business continuity — insurance as operational requirement),
// Reg 13 (leadership — financial management including insurance).
// Employers' Liability (Compulsory Insurance) Act 1969.
// SCCIF: Leadership & Management — "The home is run as a business with
// proper governance."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";

type SB = ReturnType<typeof createServerClient> extends Promise<infer R> ? R : never;

export type ServiceResult<T> = { ok: boolean; data?: T; error?: string };

// ── Enums (const arrays + types) ─────────────────────────────────────────

export const INSURANCE_TYPES = [
  "employers_liability",
  "public_liability",
  "professional_indemnity",
  "building",
  "contents",
  "motor_fleet",
  "cyber",
  "directors_officers",
] as const;
export type InsuranceType = (typeof INSURANCE_TYPES)[number];

export const COMPLIANCE_STATUSES = [
  "compliant",
  "renewal_due",
  "expired",
  "gap_identified",
  "claim_pending",
  "under_review",
] as const;
export type ComplianceStatus = (typeof COMPLIANCE_STATUSES)[number];

export const COVERAGE_LEVELS = [
  "full",
  "partial",
  "minimum",
  "excess",
  "inadequate",
] as const;
export type CoverageLevel = (typeof COVERAGE_LEVELS)[number];

export const REVIEW_OUTCOMES = [
  "satisfactory",
  "action_required",
  "urgent_action",
  "non_compliant",
  "pending",
] as const;
export type ReviewOutcome = (typeof REVIEW_OUTCOMES)[number];

// ── Row type ─────────────────────────────────────────────────────────────

export interface HomeInsuranceComplianceRow {
  id: string;
  home_id: string;
  policy_name: string;
  policy_number: string | null;
  insurance_type: InsuranceType;
  compliance_status: ComplianceStatus;
  coverage_level: CoverageLevel;
  review_outcome: ReviewOutcome;
  renewal_date: string;
  last_review_date: string;
  premium_amount: number | null;
  policy_document_held: boolean;
  certificate_displayed: boolean;
  cover_adequate: boolean;
  excess_acceptable: boolean;
  broker_reviewed: boolean;
  claims_history_clear: boolean;
  regulatory_requirement_met: boolean;
  management_reviewed: boolean;
  reviewer_name: string | null;
  insurer_name: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listHomeInsuranceCompliance(
  homeId: string,
): Promise<ServiceResult<HomeInsuranceComplianceRow[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const sb = await createServerClient();
  if (!sb) return { ok: true, data: [] };

  const { data, error } = await (sb.from("cs_home_insurance_compliance") as any)
    .select("*")
    .eq("home_id", homeId)
    .order("renewal_date", { ascending: true });

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createHomeInsuranceCompliance(input: {
  homeId: string;
  policyName: string;
  policyNumber?: string | null;
  insuranceType: InsuranceType;
  complianceStatus: ComplianceStatus;
  coverageLevel: CoverageLevel;
  reviewOutcome: ReviewOutcome;
  renewalDate: string;
  lastReviewDate: string;
  premiumAmount?: number | null;
  policyDocumentHeld: boolean;
  certificateDisplayed: boolean;
  coverAdequate: boolean;
  excessAcceptable: boolean;
  brokerReviewed: boolean;
  claimsHistoryClear: boolean;
  regulatoryRequirementMet: boolean;
  managementReviewed: boolean;
  reviewerName?: string | null;
  insurerName?: string | null;
  notes?: string | null;
}): Promise<ServiceResult<HomeInsuranceComplianceRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const sb = await createServerClient();
  if (!sb) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (sb.from("cs_home_insurance_compliance") as any)
    .insert({
      home_id: input.homeId,
      policy_name: input.policyName,
      policy_number: input.policyNumber ?? null,
      insurance_type: input.insuranceType,
      compliance_status: input.complianceStatus,
      coverage_level: input.coverageLevel,
      review_outcome: input.reviewOutcome,
      renewal_date: input.renewalDate,
      last_review_date: input.lastReviewDate,
      premium_amount: input.premiumAmount ?? null,
      policy_document_held: input.policyDocumentHeld,
      certificate_displayed: input.certificateDisplayed,
      cover_adequate: input.coverAdequate,
      excess_acceptable: input.excessAcceptable,
      broker_reviewed: input.brokerReviewed,
      claims_history_clear: input.claimsHistoryClear,
      regulatory_requirement_met: input.regulatoryRequirementMet,
      management_reviewed: input.managementReviewed,
      reviewer_name: input.reviewerName ?? null,
      insurer_name: input.insurerName ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeInsuranceMetrics(
  rows: HomeInsuranceComplianceRow[],
): {
  total_policies: number;
  expired_count: number;
  renewal_due_count: number;
  gap_count: number;
  claim_pending_count: number;
  document_held_rate: number;
  certificate_displayed_rate: number;
  cover_adequate_rate: number;
  excess_acceptable_rate: number;
  broker_reviewed_rate: number;
  claims_clear_rate: number;
  regulatory_met_rate: number;
  management_reviewed_rate: number;
  total_premium: number;
  insurance_type_breakdown: Record<string, number>;
  status_breakdown: Record<string, number>;
  unique_policies: number;
} {
  const total = rows.length;

  const expiredCount = rows.filter((r) => r.compliance_status === "expired").length;
  const renewalDueCount = rows.filter((r) => r.compliance_status === "renewal_due").length;
  const gapCount = rows.filter((r) => r.compliance_status === "gap_identified").length;
  const claimPendingCount = rows.filter((r) => r.compliance_status === "claim_pending").length;

  const boolRate = (field: keyof HomeInsuranceComplianceRow) => {
    const count = rows.filter((r) => r[field] === true).length;
    return total > 0
      ? Math.round((count / total) * 1000) / 10
      : 0;
  };

  let totalPremium = 0;
  for (const r of rows) {
    if (r.premium_amount != null) totalPremium += r.premium_amount;
  }

  const insuranceTypeBreakdown: Record<string, number> = {};
  for (const r of rows) insuranceTypeBreakdown[r.insurance_type] = (insuranceTypeBreakdown[r.insurance_type] ?? 0) + 1;

  const statusBreakdown: Record<string, number> = {};
  for (const r of rows) statusBreakdown[r.compliance_status] = (statusBreakdown[r.compliance_status] ?? 0) + 1;

  const uniquePolicies = new Set(rows.map((r) => r.policy_name)).size;

  return {
    total_policies: total,
    expired_count: expiredCount,
    renewal_due_count: renewalDueCount,
    gap_count: gapCount,
    claim_pending_count: claimPendingCount,
    document_held_rate: boolRate("policy_document_held"),
    certificate_displayed_rate: boolRate("certificate_displayed"),
    cover_adequate_rate: boolRate("cover_adequate"),
    excess_acceptable_rate: boolRate("excess_acceptable"),
    broker_reviewed_rate: boolRate("broker_reviewed"),
    claims_clear_rate: boolRate("claims_history_clear"),
    regulatory_met_rate: boolRate("regulatory_requirement_met"),
    management_reviewed_rate: boolRate("management_reviewed"),
    total_premium: totalPremium,
    insurance_type_breakdown: insuranceTypeBreakdown,
    status_breakdown: statusBreakdown,
    unique_policies: uniquePolicies,
  };
}

export function computeInsuranceAlerts(
  rows: HomeInsuranceComplianceRow[],
): { type: string; severity: "critical" | "high" | "medium"; message: string; record_id?: string }[] {
  const alerts: { type: string; severity: "critical" | "high" | "medium"; message: string; record_id?: string }[] = [];
  const now = new Date(new Date().toISOString().split("T")[0]);
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

  for (const r of rows) {
    // Critical: employers_liability expired
    if (r.insurance_type === "employers_liability" && r.compliance_status === "expired") {
      alerts.push({
        type: "employers_liability_expired",
        severity: "critical",
        message: `Employers' liability policy "${r.policy_name}" has expired — this is a legal requirement under the Employers' Liability (Compulsory Insurance) Act 1969 and must be renewed immediately`,
        record_id: r.id,
      });
    }

    // Critical: employers_liability gap_identified
    if (r.insurance_type === "employers_liability" && r.compliance_status === "gap_identified") {
      alerts.push({
        type: "employers_liability_gap",
        severity: "critical",
        message: `Gap identified in employers' liability coverage "${r.policy_name}" — continuous cover is a statutory requirement and must be resolved immediately`,
        record_id: r.id,
      });
    }

    // Critical: regulatory requirement not met
    if (!r.regulatory_requirement_met) {
      alerts.push({
        type: "regulatory_requirement_not_met",
        severity: "critical",
        message: `Policy "${r.policy_name}" does not meet regulatory requirements — review against CHR 2015 Reg 25 and ensure compliance`,
        record_id: r.id,
      });
    }

    // High: renewal due within 30 days
    const renewalDate = new Date(r.renewal_date);
    const daysUntilRenewal = renewalDate.getTime() - now.getTime();
    if (daysUntilRenewal >= 0 && daysUntilRenewal <= thirtyDaysMs) {
      alerts.push({
        type: "renewal_due_soon",
        severity: "high",
        message: `Policy "${r.policy_name}" is due for renewal on ${r.renewal_date} — ensure renewal is progressed to avoid a gap in cover`,
        record_id: r.id,
      });
    }

    // High: public_liability expired
    if (r.insurance_type === "public_liability" && r.compliance_status === "expired") {
      alerts.push({
        type: "public_liability_expired",
        severity: "high",
        message: `Public liability policy "${r.policy_name}" has expired — this exposes the home to significant risk and should be renewed urgently`,
        record_id: r.id,
      });
    }

    // Medium: cover not adequate
    if (!r.cover_adequate) {
      alerts.push({
        type: "cover_not_adequate",
        severity: "medium",
        message: `Policy "${r.policy_name}" has been assessed as having inadequate cover — review cover levels and adjust as needed`,
        record_id: r.id,
      });
    }

    // Medium: certificate not displayed for employers_liability
    if (r.insurance_type === "employers_liability" && !r.certificate_displayed) {
      alerts.push({
        type: "certificate_not_displayed",
        severity: "medium",
        message: `Employers' liability certificate for "${r.policy_name}" is not displayed — the certificate must be displayed at the workplace as required by law`,
        record_id: r.id,
      });
    }
  }

  return alerts;
}

export function generateInsuranceCaraInsights(
  rows: HomeInsuranceComplianceRow[],
): string[] {
  const metrics = computeInsuranceMetrics(rows);
  const alerts = computeInsuranceAlerts(rows);
  const insights: string[] = [];

  // Insight 1: Summary stats (zinc-themed)
  insights.push(
    `[zinc] ${metrics.total_policies} insurance ${metrics.total_policies === 1 ? "policy" : "policies"} tracked across ${metrics.unique_policies} unique ${metrics.unique_policies === 1 ? "policy name" : "policy names"}. ` +
      `Document held ${metrics.document_held_rate}%, certificate displayed ${metrics.certificate_displayed_rate}%, ` +
      `cover adequate ${metrics.cover_adequate_rate}%, regulatory met ${metrics.regulatory_met_rate}%.`,
  );

  // Insight 2: Priority concerns (amber-themed)
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");
  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority alerts identified. ` +
        `${metrics.expired_count} expired, ${metrics.renewal_due_count} renewal due, ` +
        `${metrics.gap_count} gaps identified, and ${metrics.claim_pending_count} claims pending.`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority insurance alerts currently active. ` +
        `${metrics.total_policies} ${metrics.total_policies === 1 ? "policy" : "policies"} tracked with total premium of £${metrics.total_premium.toFixed(2)}. ` +
        `Continue regular insurance reviews to maintain compliance under CHR 2015 Reg 25.`,
    );
  }

  // Insight 3: Reflective question about insurance governance
  if (metrics.expired_count > 0) {
    insights.push(
      `[reflect] ${metrics.expired_count} ${metrics.expired_count === 1 ? "policy has" : "policies have"} expired. ` +
        `What steps are being taken to ensure continuous insurance coverage, and are renewal ` +
        `processes robust enough to prevent gaps that could leave the home exposed?`,
    );
  } else if (metrics.cover_adequate_rate < 100) {
    insights.push(
      `[reflect] Cover is assessed as adequate for ${metrics.cover_adequate_rate}% of policies. ` +
        `How can the home ensure all policies provide sufficient protection, and is there a regular ` +
        `process for reviewing cover levels against evolving risks and regulatory expectations?`,
    );
  } else {
    insights.push(
      `[reflect] All policies are current with adequate cover levels and no expired policies. ` +
        `How can the home build on this strong insurance governance to anticipate emerging risks ` +
        `and ensure the insurance portfolio continues to meet both regulatory and operational needs?`,
    );
  }

  return insights;
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeInsuranceMetrics,
  computeInsuranceAlerts,
  generateInsuranceCaraInsights,
};
