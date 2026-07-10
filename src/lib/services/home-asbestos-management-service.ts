// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME ASBESTOS MANAGEMENT SERVICE
// Tracks asbestos surveys, management plans, and compliance with the
// Control of Asbestos Regulations 2012 for the residential home.
//
// Covers: asbestos surveys, asbestos type identification, condition ratings,
// risk scoring, management actions, management plans, register updates,
// staff awareness, labelling, reinspection scheduling, and compliance status.
//
// Control of Asbestos Regulations 2012 (CAR 2012),
// HSE Approved Code of Practice L143,
// CHR 2015 Reg 25 (health and safety — asbestos management),
// CHR 2015 Reg 36 (fitness of premises — building safety).
//
// SCCIF: Helped & Protected — "The home is safe and well maintained."
// "Children are protected from asbestos risks under CAR 2012."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

interface ServiceResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

// ── Enums (const arrays + types) ─────────────────────────────────────────

export const ASBESTOS_TYPES = [
  "Chrysotile",
  "Amosite",
  "Crocidolite",
  "Mixed",
  "Presumed ACM",
  "No Asbestos Found",
] as const;
export type AsbestosType = (typeof ASBESTOS_TYPES)[number];

export const CONDITION_RATINGS = [
  "Good",
  "Fair",
  "Poor",
  "Damaged",
  "Severely Damaged",
] as const;
export type ConditionRating = (typeof CONDITION_RATINGS)[number];

export const MANAGEMENT_ACTIONS = [
  "Monitor",
  "Encapsulate",
  "Enclose",
  "Remove",
  "No Action Required",
] as const;
export type ManagementAction = (typeof MANAGEMENT_ACTIONS)[number];

export const COMPLIANCE_STATUSES = [
  "Compliant",
  "Minor Non-Compliance",
  "Major Non-Compliance",
  "Critical Non-Compliance",
] as const;
export type ComplianceStatus = (typeof COMPLIANCE_STATUSES)[number];

// ── Row type ─────────────────────────────────────────────────────────────

export interface HomeAsbestosManagementRow {
  id: string;
  home_id: string;
  survey_date: string;
  surveyor_name: string;
  location: string;
  asbestos_type: AsbestosType;
  condition_rating: ConditionRating;
  risk_score: number;
  management_action: ManagementAction;
  management_plan_in_place: boolean;
  register_updated: boolean;
  staff_awareness_confirmed: boolean;
  labelling_in_place: boolean;
  reinspection_date: string | null;
  compliance_status: ComplianceStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Supabase helpers ─────────────────────────────────────────────────────

function isSupabaseEnabled(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listHomeAsbestosManagement(
  homeId: string,
): Promise<ServiceResult<HomeAsbestosManagementRow[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const client = sb();
  if (!client) return { ok: true, data: [] };

  const { data, error } = await (client.from("cs_home_asbestos_management") as any)
    .select("*")
    .eq("home_id", homeId)
    .order("survey_date", { ascending: false });

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createHomeAsbestosManagement(input: {
  homeId: string;
  surveyDate: string;
  surveyorName: string;
  location: string;
  asbestosType: AsbestosType;
  conditionRating: ConditionRating;
  riskScore: number;
  managementAction: ManagementAction;
  managementPlanInPlace: boolean;
  registerUpdated: boolean;
  staffAwarenessConfirmed: boolean;
  labellingInPlace: boolean;
  reinspectionDate?: string | null;
  complianceStatus: ComplianceStatus;
  notes?: string | null;
}): Promise<ServiceResult<HomeAsbestosManagementRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = sb();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (client.from("cs_home_asbestos_management") as any)
    .insert({
      home_id: input.homeId,
      survey_date: input.surveyDate,
      surveyor_name: input.surveyorName,
      location: input.location,
      asbestos_type: input.asbestosType,
      condition_rating: input.conditionRating,
      risk_score: input.riskScore,
      management_action: input.managementAction,
      management_plan_in_place: input.managementPlanInPlace,
      register_updated: input.registerUpdated,
      staff_awareness_confirmed: input.staffAwarenessConfirmed,
      labelling_in_place: input.labellingInPlace,
      reinspection_date: input.reinspectionDate ?? null,
      compliance_status: input.complianceStatus,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateHomeAsbestosManagement(
  id: string,
  homeId: string,
  updates: Partial<Record<string, unknown>>,
): Promise<ServiceResult<HomeAsbestosManagementRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = sb();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (client.from("cs_home_asbestos_management") as any)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("home_id", homeId)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeMetrics(
  rows: HomeAsbestosManagementRow[],
): {
  total_surveys: number;
  damaged_count: number;
  removal_required_count: number;
  non_compliant_count: number;
  management_plan_rate: number;
  register_update_rate: number;
  staff_awareness_rate: number;
  labelling_rate: number;
  reinspection_scheduled_rate: number;
  avg_risk_score: number;
  unique_surveyors: number;
} {
  const total = rows.length;

  const damaged = rows.filter(
    (r) =>
      r.condition_rating === "Poor" ||
      r.condition_rating === "Damaged" ||
      r.condition_rating === "Severely Damaged",
  ).length;

  const removalRequired = rows.filter(
    (r) => r.management_action === "Remove",
  ).length;

  const nonCompliant = rows.filter(
    (r) => r.compliance_status !== "Compliant",
  ).length;

  const boolRate = (field: keyof HomeAsbestosManagementRow) => {
    const count = rows.filter((r) => r[field] === true).length;
    return total > 0 ? Math.round((count / total) * 1000) / 10 : 0;
  };

  const reinspectionScheduled = rows.filter(
    (r) => r.reinspection_date !== null,
  ).length;
  const reinspectionScheduledRate =
    total > 0 ? Math.round((reinspectionScheduled / total) * 1000) / 10 : 0;

  const avgRiskScore =
    total > 0
      ? Math.round((rows.reduce((sum, r) => sum + r.risk_score, 0) / total) * 10) / 10
      : 0;

  const uniqueSurveyors = new Set(rows.map((r) => r.surveyor_name)).size;

  return {
    total_surveys: total,
    damaged_count: damaged,
    removal_required_count: removalRequired,
    non_compliant_count: nonCompliant,
    management_plan_rate: boolRate("management_plan_in_place"),
    register_update_rate: boolRate("register_updated"),
    staff_awareness_rate: boolRate("staff_awareness_confirmed"),
    labelling_rate: boolRate("labelling_in_place"),
    reinspection_scheduled_rate: reinspectionScheduledRate,
    avg_risk_score: avgRiskScore,
    unique_surveyors: uniqueSurveyors,
  };
}

export function computeAlerts(
  rows: HomeAsbestosManagementRow[],
): { type: string; severity: "critical" | "high" | "medium"; message: string; record_id?: string }[] {
  const alerts: { type: string; severity: "critical" | "high" | "medium"; message: string; record_id?: string }[] = [];

  // Critical: any "Severely Damaged" condition
  for (const r of rows) {
    if (r.condition_rating === "Severely Damaged") {
      alerts.push({
        type: "severely_damaged_asbestos",
        severity: "critical",
        message: `Severely damaged asbestos (${r.asbestos_type}) found at ${r.location} surveyed on ${r.survey_date} — immediate action required under CAR 2012`,
        record_id: r.id,
      });
    }
  }

  // High: any "Damaged" without management_action "Remove"
  for (const r of rows) {
    if (r.condition_rating === "Damaged" && r.management_action !== "Remove") {
      alerts.push({
        type: "damaged_not_removal",
        severity: "high",
        message: `Damaged asbestos (${r.asbestos_type}) at ${r.location} surveyed on ${r.survey_date} is not scheduled for removal — review management action under CAR 2012`,
        record_id: r.id,
      });
    }
  }

  // High: any without management_plan_in_place when asbestos found
  for (const r of rows) {
    if (r.asbestos_type !== "No Asbestos Found" && !r.management_plan_in_place) {
      alerts.push({
        type: "no_management_plan",
        severity: "high",
        message: `No management plan in place for asbestos (${r.asbestos_type}) at ${r.location} surveyed on ${r.survey_date} — a written plan is required under CAR 2012 Regulation 4`,
        record_id: r.id,
      });
    }
  }

  // Medium: any without staff_awareness_confirmed
  for (const r of rows) {
    if (!r.staff_awareness_confirmed) {
      alerts.push({
        type: "staff_not_aware",
        severity: "medium",
        message: `Staff awareness not confirmed for asbestos survey at ${r.location} surveyed on ${r.survey_date} — all staff must be made aware of asbestos locations and risks`,
        record_id: r.id,
      });
    }
  }

  // Medium: any without labelling_in_place when asbestos found
  for (const r of rows) {
    if (r.asbestos_type !== "No Asbestos Found" && !r.labelling_in_place) {
      alerts.push({
        type: "no_labelling",
        severity: "medium",
        message: `Asbestos labelling not in place for ${r.asbestos_type} at ${r.location} surveyed on ${r.survey_date} — labelling is required to warn of asbestos presence`,
        record_id: r.id,
      });
    }
  }

  return alerts;
}

export function computeCaraInsights(
  metrics: ReturnType<typeof computeMetrics>,
): string[] {
  const insights: string[] = [];

  // Insight 1: Summary stats
  insights.push(
    `${metrics.total_surveys} asbestos ${metrics.total_surveys === 1 ? "survey" : "surveys"} recorded across ${metrics.unique_surveyors} ${metrics.unique_surveyors === 1 ? "surveyor" : "surveyors"}. ` +
      `Management plan rate at ${metrics.management_plan_rate}%, staff awareness at ${metrics.staff_awareness_rate}%, ` +
      `and labelling in place for ${metrics.labelling_rate}% of surveys.`,
  );

  // Insight 2: Priority items
  if (metrics.damaged_count > 0 || metrics.removal_required_count > 0) {
    insights.push(
      `${metrics.damaged_count} ${metrics.damaged_count === 1 ? "survey" : "surveys"} with poor or damaged condition and ${metrics.removal_required_count} ${metrics.removal_required_count === 1 ? "location" : "locations"} requiring removal. ` +
        `${metrics.non_compliant_count} ${metrics.non_compliant_count === 1 ? "survey" : "surveys"} with non-compliant status. ` +
        `Average risk score is ${metrics.avg_risk_score}.`,
    );
  } else {
    insights.push(
      `No surveys with poor or damaged condition currently recorded. ` +
        `${metrics.non_compliant_count} ${metrics.non_compliant_count === 1 ? "survey" : "surveys"} with non-compliant status and average risk score is ${metrics.avg_risk_score}. ` +
        `Continue regular monitoring to maintain CAR 2012 compliance.`,
    );
  }

  // Insight 3: Reflective question about asbestos safety and duty holder responsibilities
  if (metrics.damaged_count > 0 || metrics.removal_required_count > 0) {
    insights.push(
      `${metrics.damaged_count + metrics.removal_required_count} ${(metrics.damaged_count + metrics.removal_required_count) === 1 ? "survey has" : "surveys have"} damaged asbestos or removal requirements. ` +
        `What immediate steps are being taken to protect children and staff from exposure, ` +
        `and is the home's asbestos management plan under CAR 2012 Regulation 4 up to date?`,
    );
  } else if (metrics.staff_awareness_rate < 100 || metrics.labelling_rate < 100) {
    insights.push(
      `Staff awareness is at ${metrics.staff_awareness_rate}% and labelling compliance is at ${metrics.labelling_rate}%. ` +
        `How can the home improve asbestos awareness and labelling to ensure full compliance with CAR 2012, ` +
        `and are all duty holders aware of their responsibilities under Regulation 4?`,
    );
  } else {
    insights.push(
      `All surveys show good compliance with no damaged asbestos or removal requirements. ` +
        `How can the home build on this strong asbestos management culture to continually improve, ` +
        `and is the asbestos register reviewed at the frequency required by CAR 2012?`,
    );
  }

  return insights;
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeMetrics,
  computeAlerts,
  computeCaraInsights,
};
