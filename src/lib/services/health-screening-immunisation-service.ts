// ══════════════════════════════════════════════════════════════════════════════
// CARA — HEALTH SCREENING & IMMUNISATION SERVICE
// Tracks health screenings, immunisations, dental checks,
// optical appointments, and developmental assessments.
// CHR 2015 Reg 10 (health — regular screening and immunisation),
// Reg 7 (children's wishes — health matters).
//
// Covers: screening type, screening outcome, immunisation status,
// health risk level, and review tracking.
//
// SCCIF: Health — "Children's health needs are identified and met."
// "Immunisations and health screenings are up to date."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type ScreeningType =
  | "immunisation"
  | "dental_check"
  | "optical_check"
  | "hearing_test"
  | "developmental_assessment"
  | "mental_health_screening"
  | "bmi_growth_check"
  | "sexual_health"
  | "substance_screening"
  | "other";

export type ScreeningOutcome =
  | "all_clear"
  | "minor_issues"
  | "referral_needed"
  | "treatment_required"
  | "further_assessment";

export type ImmunisationStatus =
  | "fully_up_to_date"
  | "mostly_up_to_date"
  | "partially_complete"
  | "significantly_behind"
  | "not_assessed";

export type HealthRisk =
  | "low"
  | "moderate"
  | "elevated"
  | "high"
  | "critical";

export interface HealthScreeningImmunisationRecord {
  id: string;
  home_id: string;
  screening_type: ScreeningType;
  screening_outcome: ScreeningOutcome;
  immunisation_status: ImmunisationStatus;
  health_risk: HealthRisk;
  screening_date: string;
  child_name: string;
  child_id: string | null;
  conducted_by: string;
  child_consented: boolean;
  age_appropriate_explanation: boolean;
  parent_informed: boolean;
  gp_notified: boolean;
  follow_up_arranged: boolean;
  referral_made: boolean;
  care_plan_reflects: boolean;
  social_worker_informed: boolean;
  school_aware: boolean;
  records_updated: boolean;
  confidentiality_maintained: boolean;
  recorded_promptly: boolean;
  issues_found: string[];
  actions_taken: string[];
  next_review_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const SCREENING_TYPES: { type: ScreeningType; label: string }[] = [
  { type: "immunisation", label: "Immunisation" },
  { type: "dental_check", label: "Dental Check" },
  { type: "optical_check", label: "Optical Check" },
  { type: "hearing_test", label: "Hearing Test" },
  { type: "developmental_assessment", label: "Developmental Assessment" },
  { type: "mental_health_screening", label: "Mental Health Screening" },
  { type: "bmi_growth_check", label: "BMI/Growth Check" },
  { type: "sexual_health", label: "Sexual Health" },
  { type: "substance_screening", label: "Substance Screening" },
  { type: "other", label: "Other" },
];

export const SCREENING_OUTCOMES: { outcome: ScreeningOutcome; label: string }[] = [
  { outcome: "all_clear", label: "All Clear" },
  { outcome: "minor_issues", label: "Minor Issues" },
  { outcome: "referral_needed", label: "Referral Needed" },
  { outcome: "treatment_required", label: "Treatment Required" },
  { outcome: "further_assessment", label: "Further Assessment" },
];

export const IMMUNISATION_STATUSES: { status: ImmunisationStatus; label: string }[] = [
  { status: "fully_up_to_date", label: "Fully Up to Date" },
  { status: "mostly_up_to_date", label: "Mostly Up to Date" },
  { status: "partially_complete", label: "Partially Complete" },
  { status: "significantly_behind", label: "Significantly Behind" },
  { status: "not_assessed", label: "Not Assessed" },
];

export const HEALTH_RISKS: { risk: HealthRisk; label: string }[] = [
  { risk: "low", label: "Low" },
  { risk: "moderate", label: "Moderate" },
  { risk: "elevated", label: "Elevated" },
  { risk: "high", label: "High" },
  { risk: "critical", label: "Critical" },
];

// ── Pure compute ────────────────────────────────────────────────────────

export function computeHealthScreeningMetrics(
  records: HealthScreeningImmunisationRecord[],
): {
  total_screenings: number;
  treatment_required_count: number;
  referral_needed_count: number;
  behind_immunisation_count: number;
  high_risk_count: number;
  child_consented_rate: number | null;
  age_appropriate_rate: number | null;
  parent_informed_rate: number | null;
  gp_notified_rate: number | null;
  follow_up_rate: number | null;
  referral_rate: number | null;
  care_plan_rate: number | null;
  social_worker_rate: number | null;
  school_aware_rate: number | null;
  records_updated_rate: number | null;
  confidentiality_rate: number | null;
  recorded_promptly_rate: number | null;
  unique_children: number;
  by_screening_type: Record<string, number>;
  by_screening_outcome: Record<string, number>;
  by_immunisation_status: Record<string, number>;
  by_health_risk: Record<string, number>;
} {
  const treatmentRequired = records.filter((r) => r.screening_outcome === "treatment_required").length;
  const referralNeeded = records.filter((r) => r.screening_outcome === "referral_needed").length;
  const behindImmunisation = records.filter((r) => r.immunisation_status === "significantly_behind").length;
  const highRisk = records.filter((r) => r.health_risk === "high" || r.health_risk === "critical").length;

  const boolRate = (field: keyof HealthScreeningImmunisationRecord) => {
    const count = records.filter((r) => r[field] === true).length;
    return records.length > 0
      ? Math.round((count / records.length) * 1000) / 10
      : null;
  };

  const byType: Record<string, number> = {};
  for (const r of records) byType[r.screening_type] = (byType[r.screening_type] ?? 0) + 1;

  const byOutcome: Record<string, number> = {};
  for (const r of records) byOutcome[r.screening_outcome] = (byOutcome[r.screening_outcome] ?? 0) + 1;

  const byImmunisation: Record<string, number> = {};
  for (const r of records) byImmunisation[r.immunisation_status] = (byImmunisation[r.immunisation_status] ?? 0) + 1;

  const byRisk: Record<string, number> = {};
  for (const r of records) byRisk[r.health_risk] = (byRisk[r.health_risk] ?? 0) + 1;

  return {
    total_screenings: records.length,
    treatment_required_count: treatmentRequired,
    referral_needed_count: referralNeeded,
    behind_immunisation_count: behindImmunisation,
    high_risk_count: highRisk,
    child_consented_rate: boolRate("child_consented"),
    age_appropriate_rate: boolRate("age_appropriate_explanation"),
    parent_informed_rate: boolRate("parent_informed"),
    gp_notified_rate: boolRate("gp_notified"),
    follow_up_rate: boolRate("follow_up_arranged"),
    referral_rate: boolRate("referral_made"),
    care_plan_rate: boolRate("care_plan_reflects"),
    social_worker_rate: boolRate("social_worker_informed"),
    school_aware_rate: boolRate("school_aware"),
    records_updated_rate: boolRate("records_updated"),
    confidentiality_rate: boolRate("confidentiality_maintained"),
    recorded_promptly_rate: boolRate("recorded_promptly"),
    unique_children: new Set(records.map((r) => r.child_name)).size,
    by_screening_type: byType,
    by_screening_outcome: byOutcome,
    by_immunisation_status: byImmunisation,
    by_health_risk: byRisk,
  };
}

export function identifyHealthScreeningAlerts(
  records: HealthScreeningImmunisationRecord[],
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

  // High risk without follow-up — per-record
  for (const r of records) {
    if ((r.health_risk === "high" || r.health_risk === "critical") && !r.follow_up_arranged) {
      alerts.push({
        type: "high_risk_no_followup",
        severity: "critical",
        message: `${r.child_name} has ${r.health_risk} health risk from ${r.screening_type.replace(/_/g, " ")} without follow-up arranged — urgent action needed`,
        id: r.id,
      });
    }
  }

  // Behind immunisation
  const behindImm = records.filter((r) => r.immunisation_status === "significantly_behind").length;
  if (behindImm >= 1) {
    alerts.push({
      type: "immunisation_behind",
      severity: "high",
      message: `${behindImm} ${behindImm === 1 ? "screening has" : "screenings have"} children significantly behind on immunisations — arrange catch-up programme`,
      id: "immunisation_behind",
    });
  }

  // GP not notified
  const noGP = records.filter((r) => !r.gp_notified).length;
  if (noGP >= 1) {
    alerts.push({
      type: "gp_not_notified",
      severity: "high",
      message: `${noGP} ${noGP === 1 ? "screening has" : "screenings have"} GP not notified — ensure health professionals are informed`,
      id: "gp_not_notified",
    });
  }

  // Confidentiality not maintained
  const noConfidentiality = records.filter((r) => !r.confidentiality_maintained).length;
  if (noConfidentiality >= 2) {
    alerts.push({
      type: "confidentiality_breach",
      severity: "medium",
      message: `${noConfidentiality} screenings with confidentiality concerns — review data handling procedures`,
      id: "confidentiality_breach",
    });
  }

  // Records not updated
  const noRecords = records.filter((r) => !r.records_updated).length;
  if (noRecords >= 2) {
    alerts.push({
      type: "records_not_updated",
      severity: "medium",
      message: `${noRecords} screenings without health records updated — ensure comprehensive record keeping`,
      id: "records_not_updated",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    screeningType?: ScreeningType;
    screeningOutcome?: ScreeningOutcome;
    immunisationStatus?: ImmunisationStatus;
    healthRisk?: HealthRisk;
    limit?: number;
  },
): Promise<ServiceResult<HealthScreeningImmunisationRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };
  const client = sb()!;
  let q = (client.from("cs_health_screening_immunisation") as SB).select("*").eq("home_id", homeId);
  if (filters?.screeningType) q = q.eq("screening_type", filters.screeningType);
  if (filters?.screeningOutcome) q = q.eq("screening_outcome", filters.screeningOutcome);
  if (filters?.immunisationStatus) q = q.eq("immunisation_status", filters.immunisationStatus);
  if (filters?.healthRisk) q = q.eq("health_risk", filters.healthRisk);
  q = q.order("screening_date", { ascending: false });
  if (filters?.limit) q = q.limit(filters.limit);
  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as HealthScreeningImmunisationRecord[] };
}

export async function createRecord(payload: {
  homeId: string;
  screeningType: ScreeningType;
  screeningOutcome: ScreeningOutcome;
  immunisationStatus: ImmunisationStatus;
  healthRisk: HealthRisk;
  screeningDate: string;
  childName: string;
  childId?: string | null;
  conductedBy: string;
  childConsented?: boolean;
  ageAppropriateExplanation?: boolean;
  parentInformed?: boolean;
  gpNotified?: boolean;
  followUpArranged?: boolean;
  referralMade?: boolean;
  carePlanReflects?: boolean;
  socialWorkerInformed?: boolean;
  schoolAware?: boolean;
  recordsUpdated?: boolean;
  confidentialityMaintained?: boolean;
  recordedPromptly?: boolean;
  issuesFound?: string[];
  actionsTaken?: string[];
  nextReviewDate?: string | null;
  notes?: string | null;
}): Promise<ServiceResult<HealthScreeningImmunisationRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };
  const client = sb()!;
  const { data, error } = await (client.from("cs_health_screening_immunisation") as SB)
    .insert({
      home_id: payload.homeId,
      screening_type: payload.screeningType,
      screening_outcome: payload.screeningOutcome,
      immunisation_status: payload.immunisationStatus,
      health_risk: payload.healthRisk,
      screening_date: payload.screeningDate,
      child_name: payload.childName,
      child_id: payload.childId ?? null,
      conducted_by: payload.conductedBy,
      child_consented: payload.childConsented ?? true,
      age_appropriate_explanation: payload.ageAppropriateExplanation ?? true,
      parent_informed: payload.parentInformed ?? true,
      gp_notified: payload.gpNotified ?? true,
      follow_up_arranged: payload.followUpArranged ?? true,
      referral_made: payload.referralMade ?? true,
      care_plan_reflects: payload.carePlanReflects ?? true,
      social_worker_informed: payload.socialWorkerInformed ?? true,
      school_aware: payload.schoolAware ?? true,
      records_updated: payload.recordsUpdated ?? true,
      confidentiality_maintained: payload.confidentialityMaintained ?? true,
      recorded_promptly: payload.recordedPromptly ?? true,
      issues_found: payload.issuesFound ?? [],
      actions_taken: payload.actionsTaken ?? [],
      next_review_date: payload.nextReviewDate ?? null,
      notes: payload.notes ?? null,
    })
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as HealthScreeningImmunisationRecord };
}

export async function updateRecord(
  id: string,
  updates: Partial<{
    screeningType: ScreeningType;
    screeningOutcome: ScreeningOutcome;
    immunisationStatus: ImmunisationStatus;
    healthRisk: HealthRisk;
    screeningDate: string;
    childName: string;
    childId: string | null;
    conductedBy: string;
    childConsented: boolean;
    ageAppropriateExplanation: boolean;
    parentInformed: boolean;
    gpNotified: boolean;
    followUpArranged: boolean;
    referralMade: boolean;
    carePlanReflects: boolean;
    socialWorkerInformed: boolean;
    schoolAware: boolean;
    recordsUpdated: boolean;
    confidentialityMaintained: boolean;
    recordedPromptly: boolean;
    issuesFound: string[];
    actionsTaken: string[];
    nextReviewDate: string | null;
    notes: string | null;
  }>,
): Promise<ServiceResult<HealthScreeningImmunisationRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };
  const client = sb()!;
  const mapped: Record<string, unknown> = {};
  if (updates.screeningType !== undefined) mapped.screening_type = updates.screeningType;
  if (updates.screeningOutcome !== undefined) mapped.screening_outcome = updates.screeningOutcome;
  if (updates.immunisationStatus !== undefined) mapped.immunisation_status = updates.immunisationStatus;
  if (updates.healthRisk !== undefined) mapped.health_risk = updates.healthRisk;
  if (updates.screeningDate !== undefined) mapped.screening_date = updates.screeningDate;
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.childId !== undefined) mapped.child_id = updates.childId;
  if (updates.conductedBy !== undefined) mapped.conducted_by = updates.conductedBy;
  if (updates.childConsented !== undefined) mapped.child_consented = updates.childConsented;
  if (updates.ageAppropriateExplanation !== undefined) mapped.age_appropriate_explanation = updates.ageAppropriateExplanation;
  if (updates.parentInformed !== undefined) mapped.parent_informed = updates.parentInformed;
  if (updates.gpNotified !== undefined) mapped.gp_notified = updates.gpNotified;
  if (updates.followUpArranged !== undefined) mapped.follow_up_arranged = updates.followUpArranged;
  if (updates.referralMade !== undefined) mapped.referral_made = updates.referralMade;
  if (updates.carePlanReflects !== undefined) mapped.care_plan_reflects = updates.carePlanReflects;
  if (updates.socialWorkerInformed !== undefined) mapped.social_worker_informed = updates.socialWorkerInformed;
  if (updates.schoolAware !== undefined) mapped.school_aware = updates.schoolAware;
  if (updates.recordsUpdated !== undefined) mapped.records_updated = updates.recordsUpdated;
  if (updates.confidentialityMaintained !== undefined) mapped.confidentiality_maintained = updates.confidentialityMaintained;
  if (updates.recordedPromptly !== undefined) mapped.recorded_promptly = updates.recordedPromptly;
  if (updates.issuesFound !== undefined) mapped.issues_found = updates.issuesFound;
  if (updates.actionsTaken !== undefined) mapped.actions_taken = updates.actionsTaken;
  if (updates.nextReviewDate !== undefined) mapped.next_review_date = updates.nextReviewDate;
  if (updates.notes !== undefined) mapped.notes = updates.notes;
  mapped.updated_at = new Date().toISOString();
  const { data, error } = await (client.from("cs_health_screening_immunisation") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as HealthScreeningImmunisationRecord };
}

export const _testing = { computeHealthScreeningMetrics, identifyHealthScreeningAlerts };
