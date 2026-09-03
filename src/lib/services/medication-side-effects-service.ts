// ══════════════════════════════════════════════════════════════════════════════
// CARA — MEDICATION SIDE EFFECTS SERVICE
// Tracks medication side effects, severity, GP responses, and
// impact on child wellbeing and daily functioning.
// CHR 2015 Reg 23 (health — medication management),
// Reg 12 (health and wellbeing — monitoring health).
//
// Covers: side effect type, severity, GP response, medication category,
// child wellbeing monitoring, and clinical follow-up.
//
// SCCIF: Experiences — "Medication side effects are identified promptly."
// "Children's health is monitored and concerns escalated appropriately."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type SideEffectType =
  | "drowsiness"
  | "appetite_change"
  | "nausea"
  | "headache"
  | "mood_change"
  | "sleep_disruption"
  | "weight_change"
  | "skin_reaction"
  | "behavioural_change"
  | "other";

export type SideEffectSeverity =
  | "mild"
  | "moderate"
  | "severe"
  | "life_threatening"
  | "not_assessed";

export type GpResponse =
  | "dose_adjusted"
  | "medication_changed"
  | "monitoring_increased"
  | "no_change_needed"
  | "referred_to_specialist"
  | "medication_stopped"
  | "awaiting_review"
  | "gp_not_contacted"
  | "advice_given"
  | "other";

export type MedicationCategory =
  | "antidepressant"
  | "antipsychotic"
  | "anxiolytic"
  | "stimulant"
  | "anticonvulsant"
  | "analgesic"
  | "antibiotic"
  | "antihistamine"
  | "hormone"
  | "other";

export interface MedicationSideEffectsRecord {
  id: string;
  home_id: string;
  side_effect_type: SideEffectType;
  severity: SideEffectSeverity;
  gp_response: GpResponse;
  medication_category: MedicationCategory;
  reported_date: string;
  child_name: string;
  child_id: string | null;
  reported_by: string;
  child_informed: boolean | null; // null = not recorded; judgements are tri-state — credit needs === true, breach needs === false
  parent_informed: boolean;
  social_worker_informed: boolean | null;
  gp_contacted_promptly: boolean | null;
  pharmacy_consulted: boolean;
  medication_review_requested: boolean | null;
  daily_functioning_assessed: boolean | null;
  wellbeing_monitored: boolean | null;
  care_plan_updated: boolean | null;
  yellow_card_considered: boolean;
  staff_aware: boolean | null;
  recorded_promptly: boolean | null;
  issues_found: string[];
  actions_taken: string[];
  next_review_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const SIDE_EFFECT_TYPES: { type: SideEffectType; label: string }[] = [
  { type: "drowsiness", label: "Drowsiness" },
  { type: "appetite_change", label: "Appetite Change" },
  { type: "nausea", label: "Nausea" },
  { type: "headache", label: "Headache" },
  { type: "mood_change", label: "Mood Change" },
  { type: "sleep_disruption", label: "Sleep Disruption" },
  { type: "weight_change", label: "Weight Change" },
  { type: "skin_reaction", label: "Skin Reaction" },
  { type: "behavioural_change", label: "Behavioural Change" },
  { type: "other", label: "Other" },
];

export const SIDE_EFFECT_SEVERITIES: { severity: SideEffectSeverity; label: string }[] = [
  { severity: "mild", label: "Mild" },
  { severity: "moderate", label: "Moderate" },
  { severity: "severe", label: "Severe" },
  { severity: "life_threatening", label: "Life Threatening" },
  { severity: "not_assessed", label: "Not Assessed" },
];

export const GP_RESPONSES: { response: GpResponse; label: string }[] = [
  { response: "dose_adjusted", label: "Dose Adjusted" },
  { response: "medication_changed", label: "Medication Changed" },
  { response: "monitoring_increased", label: "Monitoring Increased" },
  { response: "no_change_needed", label: "No Change Needed" },
  { response: "referred_to_specialist", label: "Referred to Specialist" },
  { response: "medication_stopped", label: "Medication Stopped" },
  { response: "awaiting_review", label: "Awaiting Review" },
  { response: "gp_not_contacted", label: "GP Not Contacted" },
  { response: "advice_given", label: "Advice Given" },
  { response: "other", label: "Other" },
];

export const MEDICATION_CATEGORIES: { category: MedicationCategory; label: string }[] = [
  { category: "antidepressant", label: "Antidepressant" },
  { category: "antipsychotic", label: "Antipsychotic" },
  { category: "anxiolytic", label: "Anxiolytic" },
  { category: "stimulant", label: "Stimulant" },
  { category: "anticonvulsant", label: "Anticonvulsant" },
  { category: "analgesic", label: "Analgesic" },
  { category: "antibiotic", label: "Antibiotic" },
  { category: "antihistamine", label: "Antihistamine" },
  { category: "hormone", label: "Hormone" },
  { category: "other", label: "Other" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeMedicationSideEffectsMetrics(
  records: MedicationSideEffectsRecord[],
): {
  total_reports: number;
  severe_count: number;
  life_threatening_count: number;
  gp_not_contacted_count: number;
  awaiting_review_count: number;
  child_informed_rate: number | null;
  parent_informed_rate: number | null;
  social_worker_informed_rate: number | null;
  gp_contacted_promptly_rate: number | null;
  pharmacy_consulted_rate: number | null;
  medication_review_rate: number | null;
  daily_functioning_rate: number | null;
  wellbeing_monitored_rate: number | null;
  care_plan_updated_rate: number | null;
  yellow_card_rate: number | null;
  staff_aware_rate: number | null;
  recorded_promptly_rate: number | null;
  unique_children: number;
  by_side_effect_type: Record<string, number>;
  by_severity: Record<string, number>;
  by_gp_response: Record<string, number>;
  by_medication_category: Record<string, number>;
} {
  const severe = records.filter((r) => r.severity === "severe").length;
  const lifeThreatening = records.filter((r) => r.severity === "life_threatening").length;
  const gpNotContacted = records.filter((r) => r.gp_response === "gp_not_contacted").length;
  const awaitingReview = records.filter((r) => r.gp_response === "awaiting_review").length;

  // Rated over the records where the question was answered either way. With the
  // judgement columns tri-state (null = not recorded), an unrecorded answer in
  // the denominator would score silence as a "no" — the same fabrication the
  // old `?? true` creates made in the other direction. While every field is
  // still a strict boolean this is behaviour-identical.
  const boolRate = (field: keyof MedicationSideEffectsRecord) => {
    const recorded = records.filter((r) => r[field] !== null && r[field] !== undefined);
    const count = recorded.filter((r) => r[field] === true).length;
    return recorded.length > 0
      ? Math.round((count / recorded.length) * 1000) / 10
      : null;
  };

  const uniqueChildren = new Set(records.map((r) => r.child_name)).size;

  const byType: Record<string, number> = {};
  for (const r of records) byType[r.side_effect_type] = (byType[r.side_effect_type] ?? 0) + 1;

  const bySeverity: Record<string, number> = {};
  for (const r of records) bySeverity[r.severity] = (bySeverity[r.severity] ?? 0) + 1;

  const byGp: Record<string, number> = {};
  for (const r of records) byGp[r.gp_response] = (byGp[r.gp_response] ?? 0) + 1;

  const byCategory: Record<string, number> = {};
  for (const r of records) byCategory[r.medication_category] = (byCategory[r.medication_category] ?? 0) + 1;

  return {
    total_reports: records.length,
    severe_count: severe,
    life_threatening_count: lifeThreatening,
    gp_not_contacted_count: gpNotContacted,
    awaiting_review_count: awaitingReview,
    child_informed_rate: boolRate("child_informed"),
    parent_informed_rate: boolRate("parent_informed"),
    social_worker_informed_rate: boolRate("social_worker_informed"),
    gp_contacted_promptly_rate: boolRate("gp_contacted_promptly"),
    pharmacy_consulted_rate: boolRate("pharmacy_consulted"),
    medication_review_rate: boolRate("medication_review_requested"),
    daily_functioning_rate: boolRate("daily_functioning_assessed"),
    wellbeing_monitored_rate: boolRate("wellbeing_monitored"),
    care_plan_updated_rate: boolRate("care_plan_updated"),
    yellow_card_rate: boolRate("yellow_card_considered"),
    staff_aware_rate: boolRate("staff_aware"),
    recorded_promptly_rate: boolRate("recorded_promptly"),
    unique_children: uniqueChildren,
    by_side_effect_type: byType,
    by_severity: bySeverity,
    by_gp_response: byGp,
    by_medication_category: byCategory,
  };
}

export function identifyMedicationSideEffectsAlerts(
  records: MedicationSideEffectsRecord[],
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

  // Severe/life-threatening without GP contact
  for (const r of records) {
    if ((r.severity === "severe" || r.severity === "life_threatening") && r.gp_contacted_promptly !== true) {
      alerts.push({
        type: "severe_no_gp_contact",
        severity: "critical",
        message: r.gp_contacted_promptly === false
          ? `${r.child_name} has ${r.severity.replace(/_/g, " ")} side effect without prompt GP contact — escalate immediately`
          : `${r.child_name} has ${r.severity.replace(/_/g, " ")} side effect with no GP contact recorded — contact the GP and evidence it immediately`,
        id: r.id,
      });
    }
  }

  // GP not contacted
  const noGp = records.filter((r) => r.gp_response === "gp_not_contacted").length;
  if (noGp >= 1) {
    alerts.push({
      type: "gp_not_contacted",
      severity: "high",
      message: `${noGp} side effect ${noGp === 1 ? "report has" : "reports have"} GP not contacted — ensure clinical oversight`,
      id: "gp_not_contacted",
    });
  }

  // Medication review not requested
  const noReview = records.filter((r) => r.medication_review_requested !== true).length;
  if (noReview >= 1) {
    alerts.push({
      type: "no_medication_review",
      severity: "high",
      message: `${noReview} ${noReview === 1 ? "report has" : "reports have"} no medication-review request evidenced — consider clinical review`,
      id: "no_medication_review",
    });
  }

  // Wellbeing not monitored
  const noWellbeing = records.filter((r) => r.wellbeing_monitored !== true).length;
  if (noWellbeing >= 2) {
    alerts.push({
      type: "wellbeing_not_monitored",
      severity: "medium",
      message: `${noWellbeing} reports without evidenced wellbeing monitoring — strengthen side effect follow-up`,
      id: "wellbeing_not_monitored",
    });
  }

  // Daily functioning not assessed
  const noFunctioning = records.filter((r) => r.daily_functioning_assessed !== true).length;
  if (noFunctioning >= 2) {
    alerts.push({
      type: "functioning_not_assessed",
      severity: "medium",
      message: `${noFunctioning} reports without an evidenced daily-functioning assessment — review monitoring protocols`,
      id: "functioning_not_assessed",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    sideEffectType?: SideEffectType;
    severity?: SideEffectSeverity;
    gpResponse?: GpResponse;
    medicationCategory?: MedicationCategory;
    limit?: number;
  },
): Promise<ServiceResult<MedicationSideEffectsRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_medication_side_effects") as SB).select("*").eq("home_id", homeId);
  if (filters?.sideEffectType) q = q.eq("side_effect_type", filters.sideEffectType);
  if (filters?.severity) q = q.eq("severity", filters.severity);
  if (filters?.gpResponse) q = q.eq("gp_response", filters.gpResponse);
  if (filters?.medicationCategory) q = q.eq("medication_category", filters.medicationCategory);
  q = q.order("reported_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  payload: {
    homeId: string;
    sideEffectType: SideEffectType;
    severity: SideEffectSeverity;
    gpResponse: GpResponse;
    medicationCategory: MedicationCategory;
    reportedDate: string;
    childName: string;
    childId?: string | null;
    reportedBy: string;
    childInformed?: boolean;
    parentInformed?: boolean;
    socialWorkerInformed?: boolean;
    gpContactedPromptly?: boolean;
    pharmacyConsulted?: boolean;
    medicationReviewRequested?: boolean;
    dailyFunctioningAssessed?: boolean;
    wellbeingMonitored?: boolean;
    carePlanUpdated?: boolean;
    yellowCardConsidered?: boolean;
    staffAware?: boolean;
    recordedPromptly?: boolean;
    issuesFound?: string[];
    actionsTaken?: string[];
    nextReviewDate?: string | null;
    notes?: string | null;
  },
): Promise<ServiceResult<MedicationSideEffectsRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_medication_side_effects") as SB)
    .insert({
      home_id: payload.homeId,
      side_effect_type: payload.sideEffectType,
      severity: payload.severity,
      gp_response: payload.gpResponse,
      medication_category: payload.medicationCategory,
      reported_date: payload.reportedDate,
      child_name: payload.childName,
      child_id: payload.childId ?? null,
      reported_by: payload.reportedBy,
      child_informed: payload.childInformed ?? null,
      parent_informed: payload.parentInformed ?? false,
      social_worker_informed: payload.socialWorkerInformed ?? null,
      gp_contacted_promptly: payload.gpContactedPromptly ?? null,
      pharmacy_consulted: payload.pharmacyConsulted ?? false,
      medication_review_requested: payload.medicationReviewRequested ?? null,
      daily_functioning_assessed: payload.dailyFunctioningAssessed ?? null,
      wellbeing_monitored: payload.wellbeingMonitored ?? null,
      care_plan_updated: payload.carePlanUpdated ?? null,
      yellow_card_considered: payload.yellowCardConsidered ?? false,
      staff_aware: payload.staffAware ?? null,
      recorded_promptly: payload.recordedPromptly ?? null,
      issues_found: payload.issuesFound ?? [],
      actions_taken: payload.actionsTaken ?? [],
      next_review_date: payload.nextReviewDate ?? null,
      notes: payload.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateRecord(
  id: string,
  updates: Partial<{
    sideEffectType: SideEffectType;
    severity: SideEffectSeverity;
    gpResponse: GpResponse;
    medicationCategory: MedicationCategory;
    reportedDate: string;
    childName: string;
    childId: string | null;
    reportedBy: string;
    childInformed: boolean;
    parentInformed: boolean;
    socialWorkerInformed: boolean;
    gpContactedPromptly: boolean;
    pharmacyConsulted: boolean;
    medicationReviewRequested: boolean;
    dailyFunctioningAssessed: boolean;
    wellbeingMonitored: boolean;
    carePlanUpdated: boolean;
    yellowCardConsidered: boolean;
    staffAware: boolean;
    recordedPromptly: boolean;
    issuesFound: string[];
    actionsTaken: string[];
    nextReviewDate: string | null;
    notes: string | null;
  }>,
): Promise<ServiceResult<MedicationSideEffectsRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.sideEffectType !== undefined) mapped.side_effect_type = updates.sideEffectType;
  if (updates.severity !== undefined) mapped.severity = updates.severity;
  if (updates.gpResponse !== undefined) mapped.gp_response = updates.gpResponse;
  if (updates.medicationCategory !== undefined) mapped.medication_category = updates.medicationCategory;
  if (updates.reportedDate !== undefined) mapped.reported_date = updates.reportedDate;
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.childId !== undefined) mapped.child_id = updates.childId;
  if (updates.reportedBy !== undefined) mapped.reported_by = updates.reportedBy;
  if (updates.childInformed !== undefined) mapped.child_informed = updates.childInformed;
  if (updates.parentInformed !== undefined) mapped.parent_informed = updates.parentInformed;
  if (updates.socialWorkerInformed !== undefined) mapped.social_worker_informed = updates.socialWorkerInformed;
  if (updates.gpContactedPromptly !== undefined) mapped.gp_contacted_promptly = updates.gpContactedPromptly;
  if (updates.pharmacyConsulted !== undefined) mapped.pharmacy_consulted = updates.pharmacyConsulted;
  if (updates.medicationReviewRequested !== undefined) mapped.medication_review_requested = updates.medicationReviewRequested;
  if (updates.dailyFunctioningAssessed !== undefined) mapped.daily_functioning_assessed = updates.dailyFunctioningAssessed;
  if (updates.wellbeingMonitored !== undefined) mapped.wellbeing_monitored = updates.wellbeingMonitored;
  if (updates.carePlanUpdated !== undefined) mapped.care_plan_updated = updates.carePlanUpdated;
  if (updates.yellowCardConsidered !== undefined) mapped.yellow_card_considered = updates.yellowCardConsidered;
  if (updates.staffAware !== undefined) mapped.staff_aware = updates.staffAware;
  if (updates.recordedPromptly !== undefined) mapped.recorded_promptly = updates.recordedPromptly;
  if (updates.issuesFound !== undefined) mapped.issues_found = updates.issuesFound;
  if (updates.actionsTaken !== undefined) mapped.actions_taken = updates.actionsTaken;
  if (updates.nextReviewDate !== undefined) mapped.next_review_date = updates.nextReviewDate;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  const { data, error } = await (s.from("cs_medication_side_effects") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeMedicationSideEffectsMetrics,
  identifyMedicationSideEffectsAlerts,
};
