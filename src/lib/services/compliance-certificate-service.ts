// ══════════════════════════════════════════════════════════════════════════════
// CARA — COMPLIANCE CERTIFICATE TRACKING SERVICE
// Manages gas safety certificates, electrical installation reports,
// fire alarm service records, PAT testing, legionella risk assessments,
// insurance certificates, and other regulatory compliance documents
// with expiry date management and alerts.
// CHR 2015 Reg 25 (health and safety — premises compliance),
// Reg 36 (fitness of premises — regulatory certificates),
// Reg 13 (leadership — ensuring compliance oversight).
//
// Covers: certificate tracking, expiry management, renewal urgency,
// remedial actions, digital storage, Ofsted notification, and
// issuing body management.
//
// SCCIF: Helped & Protected — "The home maintains all required
// compliance certificates." "Regulatory documentation is current
// and children live in a safe, well-maintained environment."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient } from "@/lib/supabase/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";

type SB = ReturnType<typeof createServerClient> extends Promise<infer R> ? R : never;

export type ServiceResult<T> = { ok: boolean; data?: T; error?: string };

// ── Enums (const arrays + types) ─────────────────────────────────────────

export const CERTIFICATE_TYPES = [
  "gas_safety",
  "electrical_installation",
  "fire_alarm_service",
  "pat_testing",
  "legionella_risk",
  "asbestos_survey",
  "insurance_public_liability",
  "insurance_employers_liability",
  "water_hygiene",
  "lift_inspection",
] as const;
export type CertificateType = (typeof CERTIFICATE_TYPES)[number];

export const COMPLIANCE_STATUSES = [
  "valid",
  "expiring_soon",
  "expired",
  "renewal_in_progress",
  "not_applicable",
] as const;
export type ComplianceStatus = (typeof COMPLIANCE_STATUSES)[number];

export const ISSUING_BODIES = [
  "gas_safe_register",
  "niceic",
  "fire_service_provider",
  "pat_testing_company",
  "water_hygiene_specialist",
  "asbestos_surveyor",
  "insurance_provider",
  "local_authority",
  "hse_approved",
  "internal_audit",
] as const;
export type IssuingBody = (typeof ISSUING_BODIES)[number];

export const RENEWAL_URGENCIES = [
  "routine",
  "upcoming",
  "urgent",
  "overdue",
  "critical",
] as const;
export type RenewalUrgency = (typeof RENEWAL_URGENCIES)[number];

// ── Row type ─────────────────────────────────────────────────────────────

export interface ComplianceCertificateRow {
  id: string;
  home_id: string;
  certificate_type: CertificateType;
  certificate_reference: string;
  issuing_body: IssuingBody;
  compliance_status: ComplianceStatus;
  renewal_urgency: RenewalUrgency;
  issue_date: string;
  expiry_date: string;
  last_inspection_date: string | null;
  next_inspection_due: string | null;
  inspector_name: string | null;
  remedial_actions_required: boolean;
  remedial_actions_completed: boolean;
  digital_copy_stored: boolean;
  ofsted_notified: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listComplianceCertificates(
  homeId: string,
): Promise<ServiceResult<ComplianceCertificateRow[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const sb = await createServerClient();
  if (!sb) return { ok: true, data: [] };

  const { data, error } = await (sb.from("cs_compliance_certificates") as any)
    .select("*")
    .eq("home_id", homeId)
    .order("expiry_date", { ascending: true });

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createComplianceCertificate(input: {
  homeId: string;
  certificateType: CertificateType;
  certificateReference: string;
  issuingBody: IssuingBody;
  complianceStatus: ComplianceStatus;
  renewalUrgency: RenewalUrgency;
  issueDate: string;
  expiryDate: string;
  lastInspectionDate?: string | null;
  nextInspectionDue?: string | null;
  inspectorName?: string | null;
  remedialActionsRequired: boolean;
  remedialActionsCompleted: boolean;
  digitalCopyStored: boolean;
  ofstedNotified: boolean;
  notes?: string | null;
}): Promise<ServiceResult<ComplianceCertificateRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const sb = await createServerClient();
  if (!sb) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (sb.from("cs_compliance_certificates") as any)
    .insert({
      home_id: input.homeId,
      certificate_type: input.certificateType,
      certificate_reference: input.certificateReference,
      issuing_body: input.issuingBody,
      compliance_status: input.complianceStatus,
      renewal_urgency: input.renewalUrgency,
      issue_date: input.issueDate,
      expiry_date: input.expiryDate,
      last_inspection_date: input.lastInspectionDate ?? null,
      next_inspection_due: input.nextInspectionDue ?? null,
      inspector_name: input.inspectorName ?? null,
      remedial_actions_required: input.remedialActionsRequired,
      remedial_actions_completed: input.remedialActionsCompleted,
      digital_copy_stored: input.digitalCopyStored,
      ofsted_notified: input.ofstedNotified,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeComplianceCertificateMetrics(
  rows: ComplianceCertificateRow[],
): {
  total_certificates: number;
  expired_count: number;
  expiring_soon_count: number;
  remedial_required_count: number;
  overdue_renewal_count: number;
  valid_rate: number;
  digital_copy_rate: number;
  ofsted_notified_rate: number;
  remedial_completed_rate: number;
  certificate_type_breakdown: Record<string, number>;
  status_breakdown: Record<string, number>;
  unique_issuing_bodies: number;
} {
  const total = rows.length;

  const expired = rows.filter((r) => r.compliance_status === "expired").length;
  const expiringSoon = rows.filter((r) => r.compliance_status === "expiring_soon").length;
  const remedialRequired = rows.filter((r) => r.remedial_actions_required).length;
  const overdueRenewal = rows.filter((r) => r.renewal_urgency === "overdue" || r.renewal_urgency === "critical").length;

  const valid = rows.filter((r) => r.compliance_status === "valid").length;
  const validRate =
    total > 0
      ? Math.round((valid / total) * 1000) / 10
      : 0;

  const digitalCopy = rows.filter((r) => r.digital_copy_stored).length;
  const digitalCopyRate =
    total > 0
      ? Math.round((digitalCopy / total) * 1000) / 10
      : 0;

  const ofstedNotified = rows.filter((r) => r.ofsted_notified).length;
  const ofstedNotifiedRate =
    total > 0
      ? Math.round((ofstedNotified / total) * 1000) / 10
      : 0;

  const remedialRequiredRows = rows.filter((r) => r.remedial_actions_required);
  const remedialCompleted = remedialRequiredRows.filter((r) => r.remedial_actions_completed).length;
  const remedialCompletedRate =
    remedialRequiredRows.length > 0
      ? Math.round((remedialCompleted / remedialRequiredRows.length) * 1000) / 10
      : 0;

  const certTypeBreakdown: Record<string, number> = {};
  for (const r of rows) certTypeBreakdown[r.certificate_type] = (certTypeBreakdown[r.certificate_type] ?? 0) + 1;

  const statusBreakdown: Record<string, number> = {};
  for (const r of rows) statusBreakdown[r.compliance_status] = (statusBreakdown[r.compliance_status] ?? 0) + 1;

  const uniqueIssuingBodies = new Set(rows.map((r) => r.issuing_body)).size;

  return {
    total_certificates: total,
    expired_count: expired,
    expiring_soon_count: expiringSoon,
    remedial_required_count: remedialRequired,
    overdue_renewal_count: overdueRenewal,
    valid_rate: validRate,
    digital_copy_rate: digitalCopyRate,
    ofsted_notified_rate: ofstedNotifiedRate,
    remedial_completed_rate: remedialCompletedRate,
    certificate_type_breakdown: certTypeBreakdown,
    status_breakdown: statusBreakdown,
    unique_issuing_bodies: uniqueIssuingBodies,
  };
}

export function computeComplianceCertificateAlerts(
  rows: ComplianceCertificateRow[],
): { type: string; severity: "critical" | "high" | "medium"; message: string; record_id?: string }[] {
  const alerts: { type: string; severity: "critical" | "high" | "medium"; message: string; record_id?: string }[] = [];

  // Critical: expired safety-critical certificates (gas, electrical, fire alarm)
  const safetyCriticalTypes: CertificateType[] = ["gas_safety", "electrical_installation", "fire_alarm_service"];
  for (const r of rows) {
    if (r.compliance_status === "expired" && safetyCriticalTypes.includes(r.certificate_type)) {
      alerts.push({
        type: "safety_critical_expired",
        severity: "critical",
        message: `Safety-critical ${r.certificate_type.replace(/_/g, " ")} certificate (${r.certificate_reference}) has expired — arrange immediate renewal to protect children`,
        record_id: r.id,
      });
    }
  }

  // High: remedial actions required but not completed
  for (const r of rows) {
    if (r.remedial_actions_required && !r.remedial_actions_completed) {
      alerts.push({
        type: "remedial_actions_outstanding",
        severity: "high",
        message: `Remedial actions outstanding for ${r.certificate_type.replace(/_/g, " ")} certificate (${r.certificate_reference}) — complete actions to ensure compliance`,
        record_id: r.id,
      });
    }
  }

  // High: multiple certificates expiring soon
  const expiringSoon = rows.filter((r) => r.compliance_status === "expiring_soon");
  if (expiringSoon.length >= 2) {
    alerts.push({
      type: "multiple_expiring_soon",
      severity: "high",
      message: `${expiringSoon.length} compliance certificates are expiring soon — schedule renewals to avoid lapses in regulatory coverage`,
    });
  }

  // Medium: digital copies not stored for multiple certificates
  const noDigitalCopy = rows.filter((r) => !r.digital_copy_stored);
  if (noDigitalCopy.length >= 2) {
    alerts.push({
      type: "digital_copies_missing",
      severity: "medium",
      message: `${noDigitalCopy.length} certificates do not have digital copies stored — digitise records for secure backup and Ofsted readiness`,
    });
  }

  return alerts;
}

export function generateComplianceCertificateCaraInsights(
  metrics: ReturnType<typeof computeComplianceCertificateMetrics>,
  alerts: ReturnType<typeof computeComplianceCertificateAlerts>,
): string[] {
  const insights: string[] = [];

  // Insight 1: Summary stats (cyan-themed)
  insights.push(
    `[cyan] ${metrics.total_certificates} compliance certificates tracked across ${metrics.unique_issuing_bodies} issuing ${metrics.unique_issuing_bodies === 1 ? "body" : "bodies"}. ` +
      `${metrics.valid_rate}% are currently valid, ${metrics.digital_copy_rate}% have digital copies stored, ` +
      `and Ofsted has been notified for ${metrics.ofsted_notified_rate}% of certificates.`,
  );

  // Insight 2: Priority concerns (amber-themed)
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");
  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority alerts identified. ` +
        `${metrics.expired_count} expired certificates, ${metrics.expiring_soon_count} expiring soon, ` +
        `and ${metrics.remedial_required_count} requiring remedial actions (${metrics.remedial_completed_rate}% completed).`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority alerts currently active. ` +
        `${metrics.expired_count} expired and ${metrics.expiring_soon_count} expiring soon. ` +
        `Continue monitoring renewal dates to maintain full regulatory compliance.`,
    );
  }

  // Insight 3: Reflective question about property compliance and children's safety
  if (metrics.expired_count > 0) {
    insights.push(
      `[reflect] ${metrics.expired_count} compliance ${metrics.expired_count === 1 ? "certificate has" : "certificates have"} expired. ` +
        `Are there systemic barriers to timely renewal, and what impact could expired certificates ` +
        `have on the safety and wellbeing of children living in the home?`,
    );
  } else if (metrics.digital_copy_rate < 100) {
    insights.push(
      `[reflect] ${metrics.digital_copy_rate}% of certificates have digital copies stored. ` +
        `Could a missing physical certificate during an Ofsted inspection create compliance risk, ` +
        `and would a fully digital record system better protect the home's regulatory standing?`,
    );
  } else {
    insights.push(
      `[reflect] All compliance certificates are current and digitally stored. ` +
        `How can the home use this strong compliance foundation to drive further improvements ` +
        `in property safety and the living environment for children?`,
    );
  }

  return insights;
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeComplianceCertificateMetrics,
  computeComplianceCertificateAlerts,
  generateComplianceCertificateCaraInsights,
};
