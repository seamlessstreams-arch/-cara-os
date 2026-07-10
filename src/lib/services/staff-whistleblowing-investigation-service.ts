// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF WHISTLEBLOWING INVESTIGATION SERVICE
// Manages investigation records following whistleblowing disclosures,
// investigation outcomes, protection for whistleblowers, organisational
// learning, and regulatory notifications.
// CHR 2015 Reg 13 (leadership — open culture for raising concerns),
// Reg 34 (fitness of workers — duty to report),
// Reg 40 (notifications to Ofsted — notifiable events),
// Public Interest Disclosure Act 1998 (PIDA).
//
// Covers: whistleblowing disclosures, investigation management,
// whistleblower protection, regulatory body notifications,
// organisational learning, and policy improvement tracking.
//
// SCCIF: Leadership & Management — "Staff feel confident to raise concerns."
// "Whistleblowing procedures are effective and protective."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";

type SB = ReturnType<typeof createServerClient> extends Promise<infer R> ? R : never;

export type ServiceResult<T> = { ok: boolean; data?: T; error?: string };

// ── Enums (const arrays + types) ─────────────────────────────────────────

export const CONCERN_CATEGORIES = [
  "safeguarding_practice",
  "medication_error",
  "financial_irregularity",
  "bullying_harassment",
  "unsafe_practice",
  "regulatory_breach",
  "data_breach",
  "discriminatory_practice",
  "neglect_of_duty",
  "falsification_of_records",
] as const;
export type ConcernCategory = (typeof CONCERN_CATEGORIES)[number];

export const INVESTIGATION_OUTCOMES = [
  "substantiated",
  "partially_substantiated",
  "unsubstantiated",
  "inconclusive",
  "ongoing",
] as const;
export type InvestigationOutcome = (typeof INVESTIGATION_OUTCOMES)[number];

export const INVESTIGATION_STATUSES = [
  "received",
  "under_investigation",
  "concluded",
  "escalated",
  "closed",
] as const;
export type InvestigationStatus = (typeof INVESTIGATION_STATUSES)[number];

export const WHISTLEBLOWER_PROTECTIONS = [
  "full_anonymity",
  "confidential_disclosure",
  "open_disclosure",
  "protection_measures_applied",
  "external_disclosure",
] as const;
export type WhistleblowerProtection = (typeof WHISTLEBLOWER_PROTECTIONS)[number];

// ── Row type ─────────────────────────────────────────────────────────────

export interface StaffWhistleblowingInvestigationRow {
  id: string;
  home_id: string;
  staff_name: string;
  staff_id: string | null;
  disclosure_date: string;
  concern_category: ConcernCategory;
  investigation_outcome: InvestigationOutcome;
  investigation_status: InvestigationStatus;
  whistleblower_protection: WhistleblowerProtection;
  investigating_officer: string | null;
  whistleblower_supported: boolean;
  no_detriment_confirmed: boolean;
  regulatory_body_notified: boolean;
  organisational_learning_identified: boolean;
  learning_shared_with_team: boolean;
  policy_change_required: boolean;
  completion_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listStaffWhistleblowingInvestigations(
  homeId: string,
): Promise<ServiceResult<StaffWhistleblowingInvestigationRow[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const sb = await createServerClient();
  if (!sb) return { ok: true, data: [] };

  const { data, error } = await (sb.from("cs_staff_whistleblowing_investigations") as any)
    .select("*")
    .eq("home_id", homeId)
    .order("disclosure_date", { ascending: false });

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createStaffWhistleblowingInvestigation(input: {
  homeId: string;
  staffName: string;
  staffId?: string | null;
  disclosureDate: string;
  concernCategory: ConcernCategory;
  investigationOutcome: InvestigationOutcome;
  investigationStatus: InvestigationStatus;
  whistleblowerProtection: WhistleblowerProtection;
  investigatingOfficer?: string | null;
  whistleblowerSupported: boolean;
  noDetrimentConfirmed: boolean;
  regulatoryBodyNotified: boolean;
  organisationalLearningIdentified: boolean;
  learningSharedWithTeam: boolean;
  policyChangeRequired: boolean;
  completionDate?: string | null;
  notes?: string | null;
}): Promise<ServiceResult<StaffWhistleblowingInvestigationRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const sb = await createServerClient();
  if (!sb) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (sb.from("cs_staff_whistleblowing_investigations") as any)
    .insert({
      home_id: input.homeId,
      staff_name: input.staffName,
      staff_id: input.staffId ?? null,
      disclosure_date: input.disclosureDate,
      concern_category: input.concernCategory,
      investigation_outcome: input.investigationOutcome,
      investigation_status: input.investigationStatus,
      whistleblower_protection: input.whistleblowerProtection,
      investigating_officer: input.investigatingOfficer ?? null,
      whistleblower_supported: input.whistleblowerSupported,
      no_detriment_confirmed: input.noDetrimentConfirmed,
      regulatory_body_notified: input.regulatoryBodyNotified,
      organisational_learning_identified: input.organisationalLearningIdentified,
      learning_shared_with_team: input.learningSharedWithTeam,
      policy_change_required: input.policyChangeRequired,
      completion_date: input.completionDate ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeStaffWhistleblowingMetrics(
  rows: StaffWhistleblowingInvestigationRow[],
): {
  total_investigations: number;
  substantiated_count: number;
  ongoing_count: number;
  escalated_count: number;
  policy_change_count: number;
  whistleblower_supported_rate: number;
  no_detriment_rate: number;
  regulatory_notified_rate: number;
  learning_identified_rate: number;
  learning_shared_rate: number;
  category_breakdown: Record<string, number>;
  outcome_breakdown: Record<string, number>;
  unique_staff: number;
} {
  const total = rows.length;

  const substantiated = rows.filter((r) => r.investigation_outcome === "substantiated").length;
  const ongoing = rows.filter((r) => r.investigation_outcome === "ongoing").length;
  const escalated = rows.filter((r) => r.investigation_status === "escalated").length;
  const policyChange = rows.filter((r) => r.policy_change_required).length;

  const boolRate = (field: keyof StaffWhistleblowingInvestigationRow) => {
    const count = rows.filter((r) => r[field] === true).length;
    return total > 0
      ? Math.round((count / total) * 1000) / 10
      : 0;
  };

  const categoryBreakdown: Record<string, number> = {};
  for (const r of rows) categoryBreakdown[r.concern_category] = (categoryBreakdown[r.concern_category] ?? 0) + 1;

  const outcomeBreakdown: Record<string, number> = {};
  for (const r of rows) outcomeBreakdown[r.investigation_outcome] = (outcomeBreakdown[r.investigation_outcome] ?? 0) + 1;

  const uniqueStaff = new Set(rows.map((r) => r.staff_name)).size;

  return {
    total_investigations: total,
    substantiated_count: substantiated,
    ongoing_count: ongoing,
    escalated_count: escalated,
    policy_change_count: policyChange,
    whistleblower_supported_rate: boolRate("whistleblower_supported"),
    no_detriment_rate: boolRate("no_detriment_confirmed"),
    regulatory_notified_rate: boolRate("regulatory_body_notified"),
    learning_identified_rate: boolRate("organisational_learning_identified"),
    learning_shared_rate: boolRate("learning_shared_with_team"),
    category_breakdown: categoryBreakdown,
    outcome_breakdown: outcomeBreakdown,
    unique_staff: uniqueStaff,
  };
}

export function computeStaffWhistleblowingAlerts(
  rows: StaffWhistleblowingInvestigationRow[],
): { type: string; severity: "critical" | "high" | "medium"; message: string; record_id?: string }[] {
  const alerts: { type: string; severity: "critical" | "high" | "medium"; message: string; record_id?: string }[] = [];

  // Critical: substantiated + regulatory body not notified
  for (const r of rows) {
    if (r.investigation_outcome === "substantiated" && !r.regulatory_body_notified) {
      alerts.push({
        type: "substantiated_not_notified",
        severity: "critical",
        message: `Substantiated whistleblowing investigation for disclosure by ${r.staff_name} but regulatory body has not been notified — immediate notification required under Reg 40`,
        record_id: r.id,
      });
    }
  }

  // High: whistleblower not supported or no detriment not confirmed
  for (const r of rows) {
    if (!r.whistleblower_supported || !r.no_detriment_confirmed) {
      const issues: string[] = [];
      if (!r.whistleblower_supported) issues.push("whistleblower not supported");
      if (!r.no_detriment_confirmed) issues.push("no detriment not confirmed");
      alerts.push({
        type: "whistleblower_protection_gap",
        severity: "high",
        message: `Whistleblowing disclosure by ${r.staff_name} has protection gaps: ${issues.join(", ")} — review PIDA obligations`,
        record_id: r.id,
      });
    }
  }

  // High: multiple investigations ongoing without resolution
  const ongoingRows = rows.filter(
    (r) => r.investigation_status === "under_investigation" || r.investigation_status === "received",
  );
  if (ongoingRows.length >= 2) {
    alerts.push({
      type: "multiple_ongoing_investigations",
      severity: "high",
      message: `${ongoingRows.length} whistleblowing investigations ongoing without resolution — review investigation capacity and timescales`,
    });
  }

  // Medium: organisational learning identified but not shared with team
  for (const r of rows) {
    if (r.organisational_learning_identified && !r.learning_shared_with_team) {
      alerts.push({
        type: "learning_not_shared",
        severity: "medium",
        message: `Organisational learning identified from ${r.staff_name}'s disclosure but not yet shared with the team — ensure lessons are disseminated`,
        record_id: r.id,
      });
    }
  }

  return alerts;
}

export function generateStaffWhistleblowingCaraInsights(
  metrics: ReturnType<typeof computeStaffWhistleblowingMetrics>,
  alerts: ReturnType<typeof computeStaffWhistleblowingAlerts>,
): string[] {
  const insights: string[] = [];

  // Insight 1: Summary stats (cyan-themed)
  insights.push(
    `[cyan] ${metrics.total_investigations} whistleblowing ${metrics.total_investigations === 1 ? "investigation" : "investigations"} tracked across ${metrics.unique_staff} unique staff ${metrics.unique_staff === 1 ? "member" : "members"}. ` +
      `Whistleblower supported rate is ${metrics.whistleblower_supported_rate}%, no detriment confirmed at ${metrics.no_detriment_rate}%, ` +
      `and organisational learning identified in ${metrics.learning_identified_rate}% of cases.`,
  );

  // Insight 2: Priority concerns (amber-themed)
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");
  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority alerts identified. ` +
        `${metrics.substantiated_count} substantiated ${metrics.substantiated_count === 1 ? "outcome" : "outcomes"}, ` +
        `${metrics.ongoing_count} ongoing ${metrics.ongoing_count === 1 ? "investigation" : "investigations"}, ` +
        `and ${metrics.escalated_count} escalated ${metrics.escalated_count === 1 ? "case" : "cases"} requiring management attention.`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority alerts currently active. ` +
        `${metrics.substantiated_count} substantiated and ${metrics.escalated_count} escalated. ` +
        `Continue fostering an open culture where staff feel confident raising concerns.`,
    );
  }

  // Insight 3: Reflective question
  if (metrics.policy_change_count > 0) {
    insights.push(
      `[reflect] ${metrics.policy_change_count} ${metrics.policy_change_count === 1 ? "investigation has" : "investigations have"} identified policy changes as required. ` +
        `Are these policy changes being implemented promptly and communicated effectively ` +
        `to ensure that the issues raised through whistleblowing lead to lasting improvements in practice?`,
    );
  } else if (metrics.learning_shared_rate < 100) {
    insights.push(
      `[reflect] Organisational learning has been shared with the team in ${metrics.learning_shared_rate}% of investigations. ` +
        `Could gaps in sharing lessons from whistleblowing disclosures ` +
        `undermine the home's ability to learn and improve safeguarding practice?`,
    );
  } else {
    insights.push(
      `[reflect] All whistleblowing investigations have been handled with learning shared effectively. ` +
        `How can the home build on this strong whistleblowing culture to further encourage ` +
        `staff confidence in raising concerns without fear of detriment?`,
    );
  }

  return insights;
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeStaffWhistleblowingMetrics,
  computeStaffWhistleblowingAlerts,
  generateStaffWhistleblowingCaraInsights,
};
