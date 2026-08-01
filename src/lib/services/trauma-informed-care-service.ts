// ══════════════════════════════════════════════════════════════════════════════
// CARA — TRAUMA-INFORMED CARE SERVICE
// Tracks trauma-informed care practices, ACEs profiles, therapeutic
// environment assessments, and TIC competency across the home.
// CHR 2015 Reg 6 (quality and purpose of care — therapeutic care),
// Reg 14 (care planning — trauma-informed approach),
// Reg 16 (providing suitable staff — TIC training).
//
// Covers: ACEs scores, trauma triggers, therapeutic approaches,
// staff TIC competency, environmental audit, and outcomes.
//
// SCCIF: Overall Experiences — "Staff understand children's trauma
// and respond therapeutically." "The home operates a trauma-informed
// model that supports recovery."
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

export type TraumaType =
  | "physical_abuse"
  | "sexual_abuse"
  | "emotional_abuse"
  | "neglect"
  | "domestic_violence"
  | "parental_substance_misuse"
  | "parental_mental_health"
  | "bereavement"
  | "separation_loss"
  | "community_violence"
  | "institutional_abuse"
  | "multiple_placements"
  | "other";

export type TherapeuticModel =
  | "pace"
  | "dan_hughes"
  | "theraplay"
  | "dyrr"
  | "sensory_integration"
  | "cbt"
  | "emdr"
  | "art_therapy"
  | "play_therapy"
  | "life_story_work"
  | "dbt"
  | "psychodynamic"
  | "other";

export type TicCompetency =
  | "advanced"
  | "competent"
  | "developing"
  | "awareness"
  | "not_trained";

export type RecoveryProgress =
  | "significant_improvement"
  | "some_improvement"
  | "stable"
  | "deteriorating"
  | "not_assessed";

export interface TraumaRecord {
  id: string;
  home_id: string;
  child_name: string;
  child_id: string;
  assessment_date: string;
  trauma_types: TraumaType[];
  aces_score: number | null;
  therapeutic_model: TherapeuticModel;
  recovery_progress: RecoveryProgress;
  tic_competency: TicCompetency;
  staff_trained_percentage: number;
  therapeutic_environment_score: number | null;
  key_triggers: string[];
  calming_strategies: string[];
  therapist_involved: boolean;
  therapist_name: string | null;
  child_engaged_in_therapy: boolean;
  trauma_informed_plan_in_place: boolean;
  staff_aware_of_triggers: boolean;
  review_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const TRAUMA_TYPES: { type: TraumaType; label: string }[] = [
  { type: "physical_abuse", label: "Physical Abuse" },
  { type: "sexual_abuse", label: "Sexual Abuse" },
  { type: "emotional_abuse", label: "Emotional Abuse" },
  { type: "neglect", label: "Neglect" },
  { type: "domestic_violence", label: "Domestic Violence" },
  { type: "parental_substance_misuse", label: "Parental Substance Misuse" },
  { type: "parental_mental_health", label: "Parental Mental Health" },
  { type: "bereavement", label: "Bereavement" },
  { type: "separation_loss", label: "Separation/Loss" },
  { type: "community_violence", label: "Community Violence" },
  { type: "institutional_abuse", label: "Institutional Abuse" },
  { type: "multiple_placements", label: "Multiple Placements" },
  { type: "other", label: "Other" },
];

export const THERAPEUTIC_MODELS: { model: TherapeuticModel; label: string }[] = [
  { model: "pace", label: "PACE" },
  { model: "dan_hughes", label: "Dan Hughes" },
  { model: "theraplay", label: "Theraplay" },
  { model: "dyrr", label: "DYRR" },
  { model: "sensory_integration", label: "Sensory Integration" },
  { model: "cbt", label: "CBT" },
  { model: "emdr", label: "EMDR" },
  { model: "art_therapy", label: "Art Therapy" },
  { model: "play_therapy", label: "Play Therapy" },
  { model: "life_story_work", label: "Life Story Work" },
  { model: "dbt", label: "DBT" },
  { model: "psychodynamic", label: "Psychodynamic" },
  { model: "other", label: "Other" },
];

export const TIC_COMPETENCIES: { competency: TicCompetency; label: string }[] = [
  { competency: "advanced", label: "Advanced" },
  { competency: "competent", label: "Competent" },
  { competency: "developing", label: "Developing" },
  { competency: "awareness", label: "Awareness" },
  { competency: "not_trained", label: "Not Trained" },
];

export const RECOVERY_PROGRESS_RATINGS: { progress: RecoveryProgress; label: string }[] = [
  { progress: "significant_improvement", label: "Significant Improvement" },
  { progress: "some_improvement", label: "Some Improvement" },
  { progress: "stable", label: "Stable" },
  { progress: "deteriorating", label: "Deteriorating" },
  { progress: "not_assessed", label: "Not Assessed" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeTraumaMetrics(
  records: TraumaRecord[],
  totalChildren: number,
): {
  total_records: number;
  children_assessed: number;
  assessment_coverage: number | null;
  average_aces_score: number | null;
  therapist_involved_rate: number | null;
  child_engaged_rate: number | null;
  plan_in_place_rate: number | null;
  staff_aware_rate: number | null;
  average_staff_trained: number | null;
  significant_improvement_count: number;
  some_improvement_count: number;
  stable_count: number;
  deteriorating_count: number;
  review_overdue_count: number;
  by_trauma_type: Record<string, number>;
  by_therapeutic_model: Record<string, number>;
  by_tic_competency: Record<string, number>;
  by_recovery_progress: Record<string, number>;
} {
  const uniqueChildren = new Set(records.map((r) => r.child_id)).size;
  const coverage =
    totalChildren > 0
      ? Math.round((uniqueChildren / totalChildren) * 1000) / 10
      : null;

  const acesRecords = records.filter((r) => r.aces_score !== null);
  const avgAces =
    acesRecords.length > 0
      ? Math.round((acesRecords.reduce((sum, r) => sum + (r.aces_score ?? 0), 0) / acesRecords.length) * 10) / 10
      : null;

  const therapistInvolved = records.filter((r) => r.therapist_involved).length;
  const therapistRate =
    records.length > 0
      ? Math.round((therapistInvolved / records.length) * 1000) / 10
      : null;

  const childEngaged = records.filter((r) => r.child_engaged_in_therapy).length;
  const engagedRate =
    records.length > 0
      ? Math.round((childEngaged / records.length) * 1000) / 10
      : null;

  const planInPlace = records.filter((r) => r.trauma_informed_plan_in_place).length;
  const planRate =
    records.length > 0
      ? Math.round((planInPlace / records.length) * 1000) / 10
      : null;

  const staffAware = records.filter((r) => r.staff_aware_of_triggers).length;
  const awareRate =
    records.length > 0
      ? Math.round((staffAware / records.length) * 1000) / 10
      : null;

  const avgStaffTrained =
    records.length > 0
      ? Math.round((records.reduce((sum, r) => sum + r.staff_trained_percentage, 0) / records.length) * 10) / 10
      : null;

  const sigImprove = records.filter((r) => r.recovery_progress === "significant_improvement").length;
  const someImprove = records.filter((r) => r.recovery_progress === "some_improvement").length;
  const stable = records.filter((r) => r.recovery_progress === "stable").length;
  const deteriorating = records.filter((r) => r.recovery_progress === "deteriorating").length;

  const now = new Date();
  const reviewOverdue = records.filter(
    (r) => r.review_date && new Date(r.review_date) < now,
  ).length;

  const byTrauma: Record<string, number> = {};
  for (const r of records) {
    for (const t of r.trauma_types) byTrauma[t] = (byTrauma[t] ?? 0) + 1;
  }

  const byModel: Record<string, number> = {};
  for (const r of records) byModel[r.therapeutic_model] = (byModel[r.therapeutic_model] ?? 0) + 1;

  const byCompetency: Record<string, number> = {};
  for (const r of records) byCompetency[r.tic_competency] = (byCompetency[r.tic_competency] ?? 0) + 1;

  const byProgress: Record<string, number> = {};
  for (const r of records) byProgress[r.recovery_progress] = (byProgress[r.recovery_progress] ?? 0) + 1;

  return {
    total_records: records.length,
    children_assessed: uniqueChildren,
    assessment_coverage: coverage,
    average_aces_score: avgAces,
    therapist_involved_rate: therapistRate,
    child_engaged_rate: engagedRate,
    plan_in_place_rate: planRate,
    staff_aware_rate: awareRate,
    average_staff_trained: avgStaffTrained,
    significant_improvement_count: sigImprove,
    some_improvement_count: someImprove,
    stable_count: stable,
    deteriorating_count: deteriorating,
    review_overdue_count: reviewOverdue,
    by_trauma_type: byTrauma,
    by_therapeutic_model: byModel,
    by_tic_competency: byCompetency,
    by_recovery_progress: byProgress,
  };
}

export function identifyTraumaAlerts(
  records: TraumaRecord[],
  totalChildren: number,
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

  // Deteriorating recovery
  for (const r of records) {
    if (r.recovery_progress === "deteriorating") {
      alerts.push({
        type: "deteriorating",
        severity: "critical",
        message: `${r.child_name}'s trauma recovery is deteriorating — review therapeutic approach and consider specialist referral`,
        id: r.id,
      });
    }
  }

  // No trauma-informed plan
  for (const r of records) {
    if (!r.trauma_informed_plan_in_place && r.aces_score !== null && r.aces_score >= 4) {
      alerts.push({
        type: "no_plan_high_aces",
        severity: "high",
        message: `${r.child_name} has ACEs score of ${r.aces_score} but no trauma-informed plan — develop plan with therapeutic team`,
        id: r.id,
      });
    }
  }

  // Staff not aware of triggers
  for (const r of records) {
    if (!r.staff_aware_of_triggers) {
      alerts.push({
        type: "staff_unaware",
        severity: "high",
        message: `Staff not aware of ${r.child_name}'s trauma triggers — brief all staff to prevent re-traumatisation`,
        id: r.id,
      });
    }
  }

  // Low staff training
  for (const r of records) {
    if (r.staff_trained_percentage < 50) {
      alerts.push({
        type: "low_training",
        severity: "medium",
        message: `Only ${r.staff_trained_percentage}% of staff trained in ${r.child_name}'s therapeutic model (${r.therapeutic_model.replace(/_/g, " ")}) — increase TIC training`,
        id: r.id,
      });
    }
  }

  // Children not assessed
  const childrenAssessed = new Set(records.map((r) => r.child_id)).size;
  if (totalChildren > 0 && childrenAssessed < totalChildren) {
    const gap = totalChildren - childrenAssessed;
    alerts.push({
      type: "not_assessed",
      severity: "medium",
      message: `${gap} ${gap === 1 ? "child has" : "children have"} no trauma assessment — all children should have trauma-informed assessment`,
      id: "assessment_gap",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    childId?: string;
    therapeuticModel?: TherapeuticModel;
    recoveryProgress?: RecoveryProgress;
    limit?: number;
  },
): Promise<ServiceResult<TraumaRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_trauma_records") as SB).select("*").eq("home_id", homeId);
  if (filters?.childId) q = q.eq("child_id", filters.childId);
  if (filters?.therapeuticModel) q = q.eq("therapeutic_model", filters.therapeuticModel);
  if (filters?.recoveryProgress) q = q.eq("recovery_progress", filters.recoveryProgress);
  q = q.order("assessment_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  input: {
    homeId: string;
    childName: string;
    childId: string;
    assessmentDate: string;
    traumaTypes: TraumaType[];
    acesScore?: number;
    therapeuticModel: TherapeuticModel;
    recoveryProgress: RecoveryProgress;
    ticCompetency: TicCompetency;
    staffTrainedPercentage: number;
    therapeuticEnvironmentScore?: number;
    keyTriggers: string[];
    calmingStrategies: string[];
    therapistInvolved: boolean;
    therapistName?: string;
    childEngagedInTherapy: boolean;
    traumaInformedPlanInPlace: boolean;
    staffAwareOfTriggers: boolean;
    reviewDate?: string;
    notes?: string;
  },
): Promise<ServiceResult<TraumaRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_trauma_records") as SB)
    .insert({
      home_id: input.homeId,
      child_name: input.childName,
      child_id: input.childId,
      assessment_date: input.assessmentDate,
      trauma_types: input.traumaTypes,
      aces_score: input.acesScore ?? null,
      therapeutic_model: input.therapeuticModel,
      recovery_progress: input.recoveryProgress,
      tic_competency: input.ticCompetency,
      staff_trained_percentage: input.staffTrainedPercentage,
      therapeutic_environment_score: input.therapeuticEnvironmentScore ?? null,
      key_triggers: input.keyTriggers,
      calming_strategies: input.calmingStrategies,
      therapist_involved: input.therapistInvolved,
      therapist_name: input.therapistName ?? null,
      child_engaged_in_therapy: input.childEngagedInTherapy,
      trauma_informed_plan_in_place: input.traumaInformedPlanInPlace,
      staff_aware_of_triggers: input.staffAwareOfTriggers,
      review_date: input.reviewDate ?? null,
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
): Promise<ServiceResult<TraumaRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_trauma_records") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeTraumaMetrics,
  identifyTraumaAlerts,
};
