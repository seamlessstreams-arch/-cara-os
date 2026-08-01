// ══════════════════════════════════════════════════════════════════════════════
// CARA — ALLEGATION MANAGEMENT SERVICE
// Tracks allegations against staff/volunteers, LADO referrals,
// investigation progress, outcomes, and safeguarding actions.
// CHR 2015 Reg 12 (protection — abuse by staff),
// Reg 33 (employment — fitness of workers),
// Working Together to Safeguard Children 2023 (LADO procedures).
//
// Covers: allegation receipt, LADO referral, investigation,
// disciplinary link, DBS referral, and outcome tracking.
//
// SCCIF: Helped & Protected — "Allegations are managed swiftly
// and in line with safeguarding procedures."
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

export type AllegationType =
  | "physical_abuse"
  | "emotional_abuse"
  | "sexual_abuse"
  | "neglect"
  | "inappropriate_behaviour"
  | "inappropriate_relationship"
  | "failure_to_safeguard"
  | "misuse_of_authority"
  | "other";

export type AllegationSource =
  | "child"
  | "parent_carer"
  | "staff_member"
  | "social_worker"
  | "anonymous"
  | "police"
  | "external_professional"
  | "other";

export type InvestigationStage =
  | "received"
  | "lado_referral_made"
  | "lado_strategy_meeting"
  | "investigation_ongoing"
  | "disciplinary_hearing"
  | "outcome_reached"
  | "closed"
  | "withdrawn";

export type AllegationOutcome =
  | "substantiated"
  | "unsubstantiated"
  | "unfounded"
  | "malicious"
  | "false"
  | "pending";

export interface AllegationRecord {
  id: string;
  home_id: string;
  allegation_date: string;
  allegation_type: AllegationType;
  allegation_source: AllegationSource;
  investigation_stage: InvestigationStage;
  allegation_outcome: AllegationOutcome;
  subject_name: string;
  subject_role: string;
  child_involved: string | null;
  lado_referral_made: boolean;
  lado_referral_date: string | null;
  lado_response_within_1_day: boolean | null;
  police_informed: boolean;
  ofsted_notified: boolean;
  dbs_referral_made: boolean;
  subject_suspended: boolean;
  risk_assessment_completed: boolean;
  child_safe_and_supported: boolean;
  support_for_subject: boolean;
  investigation_officer: string;
  days_to_resolution: number | null;
  learning_identified: boolean;
  learning_details: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const ALLEGATION_TYPES: { type: AllegationType; label: string }[] = [
  { type: "physical_abuse", label: "Physical Abuse" },
  { type: "emotional_abuse", label: "Emotional Abuse" },
  { type: "sexual_abuse", label: "Sexual Abuse" },
  { type: "neglect", label: "Neglect" },
  { type: "inappropriate_behaviour", label: "Inappropriate Behaviour" },
  { type: "inappropriate_relationship", label: "Inappropriate Relationship" },
  { type: "failure_to_safeguard", label: "Failure to Safeguard" },
  { type: "misuse_of_authority", label: "Misuse of Authority" },
  { type: "other", label: "Other" },
];

export const ALLEGATION_SOURCES: { source: AllegationSource; label: string }[] = [
  { source: "child", label: "Child" },
  { source: "parent_carer", label: "Parent/Carer" },
  { source: "staff_member", label: "Staff Member" },
  { source: "social_worker", label: "Social Worker" },
  { source: "anonymous", label: "Anonymous" },
  { source: "police", label: "Police" },
  { source: "external_professional", label: "External Professional" },
  { source: "other", label: "Other" },
];

export const INVESTIGATION_STAGES: { stage: InvestigationStage; label: string }[] = [
  { stage: "received", label: "Received" },
  { stage: "lado_referral_made", label: "LADO Referral Made" },
  { stage: "lado_strategy_meeting", label: "LADO Strategy Meeting" },
  { stage: "investigation_ongoing", label: "Investigation Ongoing" },
  { stage: "disciplinary_hearing", label: "Disciplinary Hearing" },
  { stage: "outcome_reached", label: "Outcome Reached" },
  { stage: "closed", label: "Closed" },
  { stage: "withdrawn", label: "Withdrawn" },
];

export const ALLEGATION_OUTCOMES: { outcome: AllegationOutcome; label: string }[] = [
  { outcome: "substantiated", label: "Substantiated" },
  { outcome: "unsubstantiated", label: "Unsubstantiated" },
  { outcome: "unfounded", label: "Unfounded" },
  { outcome: "malicious", label: "Malicious" },
  { outcome: "false", label: "False" },
  { outcome: "pending", label: "Pending" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeAllegationMetrics(
  records: AllegationRecord[],
): {
  total_allegations: number;
  open_allegations: number;
  substantiated_count: number;
  unsubstantiated_count: number;
  lado_referral_rate: number | null;
  lado_response_within_1_day_rate: number | null;
  police_informed_rate: number | null;
  ofsted_notified_rate: number | null;
  dbs_referral_count: number;
  suspension_count: number;
  risk_assessment_rate: number | null;
  child_safe_rate: number | null;
  subject_support_rate: number | null;
  learning_identified_rate: number | null;
  average_days_to_resolution: number | null;
  by_allegation_type: Record<string, number>;
  by_allegation_source: Record<string, number>;
  by_investigation_stage: Record<string, number>;
  by_allegation_outcome: Record<string, number>;
} {
  const open = records.filter(
    (r) => r.investigation_stage !== "closed" && r.investigation_stage !== "withdrawn",
  ).length;
  const substantiated = records.filter((r) => r.allegation_outcome === "substantiated").length;
  const unsubstantiated = records.filter((r) => r.allegation_outcome === "unsubstantiated").length;

  const ladoReferred = records.filter((r) => r.lado_referral_made).length;
  const ladoRate =
    records.length > 0
      ? Math.round((ladoReferred / records.length) * 1000) / 10
      : null;

  const withLadoResponse = records.filter((r) => r.lado_response_within_1_day !== null);
  const ladoWithin1 = withLadoResponse.filter((r) => r.lado_response_within_1_day === true).length;
  const ladoResponseRate =
    withLadoResponse.length > 0
      ? Math.round((ladoWithin1 / withLadoResponse.length) * 1000) / 10
      : null;

  const policeInformed = records.filter((r) => r.police_informed).length;
  const policeRate =
    records.length > 0
      ? Math.round((policeInformed / records.length) * 1000) / 10
      : null;

  const ofstedNotified = records.filter((r) => r.ofsted_notified).length;
  const ofstedRate =
    records.length > 0
      ? Math.round((ofstedNotified / records.length) * 1000) / 10
      : null;

  const dbsReferral = records.filter((r) => r.dbs_referral_made).length;
  const suspended = records.filter((r) => r.subject_suspended).length;

  const riskDone = records.filter((r) => r.risk_assessment_completed).length;
  const riskRate =
    records.length > 0
      ? Math.round((riskDone / records.length) * 1000) / 10
      : null;

  const childSafe = records.filter((r) => r.child_safe_and_supported).length;
  const childSafeRate =
    records.length > 0
      ? Math.round((childSafe / records.length) * 1000) / 10
      : null;

  const subjectSupport = records.filter((r) => r.support_for_subject).length;
  const supportRate =
    records.length > 0
      ? Math.round((subjectSupport / records.length) * 1000) / 10
      : null;

  const learningFound = records.filter((r) => r.learning_identified).length;
  const learningRate =
    records.length > 0
      ? Math.round((learningFound / records.length) * 1000) / 10
      : null;

  const withDays = records.filter((r) => r.days_to_resolution !== null);
  const avgDays =
    withDays.length > 0
      ? Math.round((withDays.reduce((sum, r) => sum + (r.days_to_resolution ?? 0), 0) / withDays.length) * 10) / 10
      : null;

  const byType: Record<string, number> = {};
  for (const r of records) byType[r.allegation_type] = (byType[r.allegation_type] ?? 0) + 1;

  const bySource: Record<string, number> = {};
  for (const r of records) bySource[r.allegation_source] = (bySource[r.allegation_source] ?? 0) + 1;

  const byStage: Record<string, number> = {};
  for (const r of records) byStage[r.investigation_stage] = (byStage[r.investigation_stage] ?? 0) + 1;

  const byOutcome: Record<string, number> = {};
  for (const r of records) byOutcome[r.allegation_outcome] = (byOutcome[r.allegation_outcome] ?? 0) + 1;

  return {
    total_allegations: records.length,
    open_allegations: open,
    substantiated_count: substantiated,
    unsubstantiated_count: unsubstantiated,
    lado_referral_rate: ladoRate,
    lado_response_within_1_day_rate: ladoResponseRate,
    police_informed_rate: policeRate,
    ofsted_notified_rate: ofstedRate,
    dbs_referral_count: dbsReferral,
    suspension_count: suspended,
    risk_assessment_rate: riskRate,
    child_safe_rate: childSafeRate,
    subject_support_rate: supportRate,
    learning_identified_rate: learningRate,
    average_days_to_resolution: avgDays,
    by_allegation_type: byType,
    by_allegation_source: bySource,
    by_investigation_stage: byStage,
    by_allegation_outcome: byOutcome,
  };
}

export function identifyAllegationAlerts(
  records: AllegationRecord[],
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

  // Sexual abuse or substantiated allegations
  for (const r of records) {
    if (r.allegation_type === "sexual_abuse" && r.investigation_stage !== "closed" && r.investigation_stage !== "withdrawn") {
      alerts.push({
        type: "sexual_abuse_allegation",
        severity: "critical",
        message: `Active sexual abuse allegation against ${r.subject_name} (${r.subject_role}) — ensure immediate safeguarding measures`,
        id: r.id,
      });
    }
  }

  // No LADO referral
  for (const r of records) {
    if (!r.lado_referral_made && r.investigation_stage !== "withdrawn") {
      alerts.push({
        type: "no_lado_referral",
        severity: "critical",
        message: `Allegation against ${r.subject_name} on ${r.allegation_date} without LADO referral — refer immediately`,
        id: r.id,
      });
    }
  }

  // Child not safe and supported
  for (const r of records) {
    if (!r.child_safe_and_supported && r.child_involved && r.investigation_stage !== "closed" && r.investigation_stage !== "withdrawn") {
      alerts.push({
        type: "child_not_safe",
        severity: "high",
        message: `Child safety and support not confirmed for allegation involving ${r.subject_name} — review safeguarding plan`,
        id: r.id,
      });
    }
  }

  // Risk assessment not completed
  const noRisk = records.filter(
    (r) => !r.risk_assessment_completed && r.investigation_stage !== "closed" && r.investigation_stage !== "withdrawn",
  ).length;
  if (noRisk >= 1) {
    alerts.push({
      type: "no_risk_assessment",
      severity: "high",
      message: `${noRisk} ${noRisk === 1 ? "allegation" : "allegations"} without risk assessment — complete promptly`,
      id: "no_risk_assessment",
    });
  }

  // Ofsted not notified
  const noOfsted = records.filter(
    (r) => !r.ofsted_notified && r.investigation_stage !== "withdrawn",
  ).length;
  if (noOfsted >= 1) {
    alerts.push({
      type: "ofsted_not_notified",
      severity: "medium",
      message: `${noOfsted} ${noOfsted === 1 ? "allegation" : "allegations"} where Ofsted has not been notified — review notification requirements`,
      id: "ofsted_not_notified",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    allegationType?: AllegationType;
    investigationStage?: InvestigationStage;
    allegationOutcome?: AllegationOutcome;
    limit?: number;
  },
): Promise<ServiceResult<AllegationRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_allegation_management") as SB).select("*").eq("home_id", homeId);
  if (filters?.allegationType) q = q.eq("allegation_type", filters.allegationType);
  if (filters?.investigationStage) q = q.eq("investigation_stage", filters.investigationStage);
  if (filters?.allegationOutcome) q = q.eq("allegation_outcome", filters.allegationOutcome);
  q = q.order("allegation_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  input: {
    homeId: string;
    allegationDate: string;
    allegationType: AllegationType;
    allegationSource: AllegationSource;
    investigationStage: InvestigationStage;
    allegationOutcome: AllegationOutcome;
    subjectName: string;
    subjectRole: string;
    childInvolved?: string;
    ladoReferralMade: boolean;
    ladoReferralDate?: string;
    ladoResponseWithin1Day?: boolean;
    policeInformed: boolean;
    ofstedNotified: boolean;
    dbsReferralMade: boolean;
    subjectSuspended: boolean;
    riskAssessmentCompleted: boolean;
    childSafeAndSupported: boolean;
    supportForSubject: boolean;
    investigationOfficer: string;
    daysToResolution?: number;
    learningIdentified: boolean;
    learningDetails?: string;
    notes?: string;
  },
): Promise<ServiceResult<AllegationRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_allegation_management") as SB)
    .insert({
      home_id: input.homeId,
      allegation_date: input.allegationDate,
      allegation_type: input.allegationType,
      allegation_source: input.allegationSource,
      investigation_stage: input.investigationStage,
      allegation_outcome: input.allegationOutcome,
      subject_name: input.subjectName,
      subject_role: input.subjectRole,
      child_involved: input.childInvolved ?? null,
      lado_referral_made: input.ladoReferralMade,
      lado_referral_date: input.ladoReferralDate ?? null,
      lado_response_within_1_day: input.ladoResponseWithin1Day ?? null,
      police_informed: input.policeInformed,
      ofsted_notified: input.ofstedNotified,
      dbs_referral_made: input.dbsReferralMade,
      subject_suspended: input.subjectSuspended,
      risk_assessment_completed: input.riskAssessmentCompleted,
      child_safe_and_supported: input.childSafeAndSupported,
      support_for_subject: input.supportForSubject,
      investigation_officer: input.investigationOfficer,
      days_to_resolution: input.daysToResolution ?? null,
      learning_identified: input.learningIdentified,
      learning_details: input.learningDetails ?? null,
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
): Promise<ServiceResult<AllegationRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_allegation_management") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeAllegationMetrics,
  identifyAllegationAlerts,
};
