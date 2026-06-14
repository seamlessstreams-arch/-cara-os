// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF WHISTLEBLOWING MANAGEMENT SERVICE
// Tracks whistleblowing disclosures, investigations, outcomes, and
// whistleblower protection for staff in children's residential homes.
//
// Public Interest Disclosure Act 1998 — whistleblower protection obligations.
// CHR 2015 Reg 34 (employment practices — encouraging and protecting disclosures).
// Safeguarding Vulnerable Groups Act 2006 — duty to report concerns.
//
// Covers: Disclosure types, investigation tracking, whistleblower protection,
// anonymity, detriment monitoring, regulator notification, compliance status.
//
// SCCIF: Leadership & Management — "Effective whistleblowing procedures ensure
// staff feel safe to raise concerns about practice, safeguarding, or misconduct."
// ══════════════════════════════════════════════════════════════════════════════

"use client";

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";

type SB = any;

export type ServiceResult<T> = { ok: boolean; data?: T; error?: string };

// ── Enums ─────────────────────────────────────────────────────────────────

export const DISCLOSURE_TYPES = [
  "Safeguarding Concern",
  "Criminal Offence",
  "Health & Safety",
  "Environmental Damage",
  "Miscarriage of Justice",
  "Regulatory Breach",
  "Financial Misconduct",
  "Cover-Up",
  "Other",
] as const;
export type DisclosureType = (typeof DISCLOSURE_TYPES)[number];

export const DISCLOSURE_METHODS = [
  "Internal",
  "External Regulator",
  "Police",
  "CQC",
  "Ofsted",
  "Local Authority",
  "Other",
] as const;
export type DisclosureMethod = (typeof DISCLOSURE_METHODS)[number];

export const INVESTIGATION_OUTCOMES = [
  "Substantiated",
  "Partially Substantiated",
  "Unsubstantiated",
  "Inconclusive",
  "Ongoing",
] as const;
export type InvestigationOutcome = (typeof INVESTIGATION_OUTCOMES)[number];

export const COMPLIANCE_STATUSES = [
  "Open",
  "Under Investigation",
  "Closed",
  "Escalated",
] as const;
export type ComplianceStatus = (typeof COMPLIANCE_STATUSES)[number];

// ── Row Interface ─────────────────────────────────────────────────────────

export interface StaffWhistleblowingDisclosureRow {
  id: string;
  home_id: string;
  disclosure_date: string;
  handler_name: string;
  discloser_name: string;
  disclosure_type: DisclosureType;
  disclosure_method: DisclosureMethod;
  investigation_opened: boolean;
  investigation_outcome: InvestigationOutcome | null;
  action_taken: boolean;
  whistleblower_protected: boolean;
  anonymity_maintained: boolean;
  detriment_reported: boolean;
  feedback_provided: boolean;
  regulator_notified: boolean;
  compliance_status: ComplianceStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Supabase helper ───────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function sb(): any | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Metrics ───────────────────────────────────────────────────────────────

export function computeMetrics(rows: StaffWhistleblowingDisclosureRow[]): {
  total_disclosures: number;
  open_count: number;
  under_investigation_count: number;
  closed_count: number;
  escalated_count: number;
  investigation_opened_rate: number;
  substantiated_count: number;
  whistleblower_protected_rate: number;
  anonymity_rate: number;
  detriment_count: number;
  feedback_rate: number;
  regulator_notified_rate: number;
  action_taken_rate: number;
  unique_disclosers: number;
  unique_handlers: number;
} {
  const total = rows.length;

  const openCount = rows.filter((r) => r.compliance_status === "Open").length;
  const underInvestigationCount = rows.filter((r) => r.compliance_status === "Under Investigation").length;
  const closedCount = rows.filter((r) => r.compliance_status === "Closed").length;
  const escalatedCount = rows.filter((r) => r.compliance_status === "Escalated").length;

  const boolRate = (field: keyof StaffWhistleblowingDisclosureRow) => {
    const count = rows.filter((r) => r[field] === true).length;
    return total > 0 ? Math.round((count / total) * 1000) / 10 : 0;
  };

  const substantiatedCount = rows.filter((r) => r.investigation_outcome === "Substantiated").length;
  const detrimentCount = rows.filter((r) => r.detriment_reported === true).length;

  return {
    total_disclosures: total,
    open_count: openCount,
    under_investigation_count: underInvestigationCount,
    closed_count: closedCount,
    escalated_count: escalatedCount,
    investigation_opened_rate: boolRate("investigation_opened"),
    substantiated_count: substantiatedCount,
    whistleblower_protected_rate: boolRate("whistleblower_protected"),
    anonymity_rate: boolRate("anonymity_maintained"),
    detriment_count: detrimentCount,
    feedback_rate: boolRate("feedback_provided"),
    regulator_notified_rate: boolRate("regulator_notified"),
    action_taken_rate: boolRate("action_taken"),
    unique_disclosers: new Set(rows.map((r) => r.discloser_name)).size,
    unique_handlers: new Set(rows.map((r) => r.handler_name)).size,
  };
}

// ── Alerts ─────────────────────────────────────────────────────────────────

export function computeAlerts(
  rows: StaffWhistleblowingDisclosureRow[],
): { type: string; severity: "critical" | "high" | "medium"; message: string; record_id?: string }[] {
  const alerts: { type: string; severity: "critical" | "high" | "medium"; message: string; record_id?: string }[] = [];

  // Critical: Detriment reported — whistleblower harmed
  for (const r of rows) {
    if (r.detriment_reported) {
      alerts.push({
        type: "detriment_reported",
        severity: "critical",
        message: `${r.discloser_name} has reported detriment following their whistleblowing disclosure — the home must act immediately to protect the whistleblower and investigate any retaliatory action in line with the Public Interest Disclosure Act 1998.`,
        record_id: r.id,
      });
    }
  }

  // Critical: Safeguarding concern not investigated
  for (const r of rows) {
    if (r.disclosure_type === "Safeguarding Concern" && !r.investigation_opened) {
      alerts.push({
        type: "safeguarding_not_investigated",
        severity: "critical",
        message: `${r.discloser_name} raised a safeguarding concern that has not been investigated — this must be addressed immediately to protect children and young people in the home.`,
        record_id: r.id,
      });
    }
  }

  // High: No investigation opened
  for (const r of rows) {
    if (!r.investigation_opened && r.disclosure_type !== "Safeguarding Concern") {
      alerts.push({
        type: "no_investigation",
        severity: "high",
        message: `${r.discloser_name} made a disclosure that has not been investigated — all whistleblowing disclosures must be properly examined to maintain regulatory compliance and staff confidence in the process.`,
        record_id: r.id,
      });
    }
  }

  // High: Escalated without regulator notification
  for (const r of rows) {
    if (r.compliance_status === "Escalated" && !r.regulator_notified) {
      alerts.push({
        type: "escalated_no_regulator",
        severity: "high",
        message: `${r.discloser_name}'s disclosure has been escalated but the regulator has not been notified — escalated concerns typically require regulatory notification to ensure proper oversight and accountability.`,
        record_id: r.id,
      });
    }
  }

  // Medium: Feedback not provided
  for (const r of rows) {
    if (!r.feedback_provided) {
      alerts.push({
        type: "feedback_not_provided",
        severity: "medium",
        message: `${r.discloser_name} has not received feedback on their disclosure — providing timely feedback is essential to maintain trust in the whistleblowing process and encourage future reporting.`,
        record_id: r.id,
      });
    }
  }

  // Medium: Anonymity not maintained
  for (const r of rows) {
    if (!r.anonymity_maintained) {
      alerts.push({
        type: "anonymity_not_maintained",
        severity: "medium",
        message: `${r.discloser_name}'s anonymity has not been maintained — protecting the identity of whistleblowers is a fundamental obligation under the Public Interest Disclosure Act 1998.`,
        record_id: r.id,
      });
    }
  }

  return alerts;
}

// ── Cara Insights ─────────────────────────────────────────────────────────

export function computeCaraInsights(rows: StaffWhistleblowingDisclosureRow[]): string[] {
  const metrics = computeMetrics(rows);
  const alerts = computeAlerts(rows);
  const insights: string[] = [];

  // Insight 1: Summary stats
  insights.push(
    `[violet] ${metrics.total_disclosures} whistleblowing ${metrics.total_disclosures === 1 ? "disclosure" : "disclosures"} recorded across ${metrics.unique_disclosers} ${metrics.unique_disclosers === 1 ? "discloser" : "disclosers"} handled by ${metrics.unique_handlers} ${metrics.unique_handlers === 1 ? "handler" : "handlers"}. ` +
      `${metrics.open_count} open, ${metrics.under_investigation_count} under investigation, ${metrics.closed_count} closed, and ${metrics.escalated_count} escalated.`,
  );

  // Insight 2: Priority concerns
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");
  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority alerts identified. ` +
        `Investigation opened: ${metrics.investigation_opened_rate}%, whistleblower protected: ${metrics.whistleblower_protected_rate}%, ` +
        `anonymity maintained: ${metrics.anonymity_rate}%.`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority alerts currently active. ` +
        `Investigation opened: ${metrics.investigation_opened_rate}%, whistleblower protected: ${metrics.whistleblower_protected_rate}%. ` +
        `Continue monitoring whistleblowing compliance to maintain safeguarding standards.`,
    );
  }

  // Insight 3: Reflective question
  if (criticalAlerts.length > 0) {
    insights.push(
      `[reflect] ${criticalAlerts.length} critical ${criticalAlerts.length === 1 ? "alert requires" : "alerts require"} immediate attention. ` +
        `How is the home ensuring whistleblowers are protected from detriment ` +
        `and that all safeguarding concerns are investigated promptly to protect children and young people?`,
    );
  } else if (metrics.investigation_opened_rate < 100) {
    insights.push(
      `[reflect] ${metrics.investigation_opened_rate}% of disclosures have had investigations opened. ` +
        `How is the home ensuring all whistleblowing disclosures are properly examined, ` +
        `and are processes in place to encourage staff to raise concerns without fear of reprisal?`,
    );
  } else {
    insights.push(
      `[reflect] All whistleblowing processes are in good standing. ` +
        `How can the home build on this strong whistleblowing practice to ensure ` +
        `continued compliance with the Public Interest Disclosure Act and safeguarding obligations?`,
    );
  }

  return insights;
}

// ── CRUD ──────────────────────────────────────────────────────────────────

export async function listStaffWhistleblowingDisclosures(
  homeId: string,
  filters?: { complianceStatus?: ComplianceStatus; disclosureType?: DisclosureType },
): Promise<ServiceResult<StaffWhistleblowingDisclosureRow[]>> {
  const client = sb();
  if (!client) return { ok: true, data: [] };
  let query = (client.from("cs_staff_whistleblowing_disclosures") as SB)
    .select("*")
    .eq("home_id", homeId);
  if (filters?.complianceStatus) {
    query = query.eq("compliance_status", filters.complianceStatus);
  }
  if (filters?.disclosureType) {
    query = query.eq("disclosure_type", filters.disclosureType);
  }
  const { data, error } = await query.order("disclosure_date", { ascending: false });
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as StaffWhistleblowingDisclosureRow[] };
}

export async function createStaffWhistleblowingDisclosure(input: {
  homeId: string;
  disclosureDate: string;
  handlerName: string;
  discloserName: string;
  disclosureType: DisclosureType;
  disclosureMethod: DisclosureMethod;
  investigationOpened?: boolean;
  investigationOutcome?: InvestigationOutcome | null;
  actionTaken?: boolean;
  whistleblowerProtected?: boolean;
  anonymityMaintained?: boolean;
  detrimentReported?: boolean;
  feedbackProvided?: boolean;
  regulatorNotified?: boolean;
  complianceStatus?: ComplianceStatus;
  notes?: string | null;
}): Promise<ServiceResult<StaffWhistleblowingDisclosureRow>> {
  const client = sb();
  if (!client) return { ok: false, error: "Supabase not configured" };
  const { data, error } = await (client.from("cs_staff_whistleblowing_disclosures") as SB)
    .insert({
      home_id: input.homeId,
      disclosure_date: input.disclosureDate,
      handler_name: input.handlerName,
      discloser_name: input.discloserName,
      disclosure_type: input.disclosureType,
      disclosure_method: input.disclosureMethod,
      investigation_opened: input.investigationOpened ?? false,
      investigation_outcome: input.investigationOutcome ?? null,
      action_taken: input.actionTaken ?? false,
      whistleblower_protected: input.whistleblowerProtected ?? true,
      anonymity_maintained: input.anonymityMaintained ?? true,
      detriment_reported: input.detrimentReported ?? false,
      feedback_provided: input.feedbackProvided ?? false,
      regulator_notified: input.regulatorNotified ?? false,
      compliance_status: input.complianceStatus ?? "Open",
      notes: input.notes ?? null,
    })
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as StaffWhistleblowingDisclosureRow };
}

export async function updateStaffWhistleblowingDisclosure(
  id: string,
  updates: Partial<Omit<StaffWhistleblowingDisclosureRow, "id" | "home_id" | "created_at">>,
): Promise<ServiceResult<StaffWhistleblowingDisclosureRow>> {
  const client = sb();
  if (!client) return { ok: false, error: "Supabase not configured" };
  const { data, error } = await (client.from("cs_staff_whistleblowing_disclosures") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as StaffWhistleblowingDisclosureRow };
}

// ── Testing export ────────────────────────────────────────────────────────

export const _testing = { computeMetrics, computeAlerts, computeCaraInsights };
