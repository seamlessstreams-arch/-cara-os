// ══════════════════════════════════════════════════════════════════════════════
// CARA — PET CARE RESPONSIBILITY SERVICE
// Tracks pet care activities, animal welfare responsibilities, and the
// therapeutic benefits of pet ownership for children in residential care.
// CHR 2015 Reg 6 (quality of care), Reg 9 (enjoyment and achievement),
// Reg 12 (promoting good health — emotional wellbeing through animals).
//
// Covers: pet type, care quality, child responsibility level,
// therapeutic impact, and animal welfare compliance.
//
// SCCIF: Experiences — "Children develop empathy and responsibility."
// "Activities promote positive emotional development."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type PetType =
  | "dog"
  | "cat"
  | "rabbit"
  | "fish"
  | "hamster"
  | "guinea_pig"
  | "bird"
  | "reptile"
  | "farm_animal"
  | "other";

export type CareQuality =
  | "excellent"
  | "good"
  | "adequate"
  | "poor"
  | "neglectful";

export type ResponsibilityLevel =
  | "fully_responsible"
  | "mostly_responsible"
  | "shared_responsibility"
  | "minimal_responsibility"
  | "not_involved";

export type TherapeuticImpact =
  | "very_positive"
  | "positive"
  | "neutral"
  | "minimal"
  | "negative";

export interface PetCareResponsibilityRecord {
  id: string;
  home_id: string;
  pet_type: PetType;
  care_quality: CareQuality;
  responsibility_level: ResponsibilityLevel;
  therapeutic_impact: TherapeuticImpact;
  session_date: string;
  child_name: string;
  child_id: string | null;
  supported_by: string;
  animal_welfare_met: boolean;
  veterinary_care_current: boolean;
  child_chose_interaction: boolean;
  supervision_adequate: boolean;
  hygiene_maintained: boolean;
  allergy_checked: boolean;
  care_plan_reflects: boolean;
  social_worker_informed: boolean;
  parent_informed: boolean;
  risk_assessment_done: boolean;
  empathy_development_noted: boolean;
  recorded_promptly: boolean;
  issues_found: string[];
  actions_taken: string[];
  next_review_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ─────────────────────────────────────────────────────────────

export const PET_TYPES: { type: PetType; label: string }[] = [
  { type: "dog", label: "Dog" },
  { type: "cat", label: "Cat" },
  { type: "rabbit", label: "Rabbit" },
  { type: "fish", label: "Fish" },
  { type: "hamster", label: "Hamster" },
  { type: "guinea_pig", label: "Guinea Pig" },
  { type: "bird", label: "Bird" },
  { type: "reptile", label: "Reptile" },
  { type: "farm_animal", label: "Farm Animal" },
  { type: "other", label: "Other" },
];

export const CARE_QUALITIES: { quality: CareQuality; label: string }[] = [
  { quality: "excellent", label: "Excellent" },
  { quality: "good", label: "Good" },
  { quality: "adequate", label: "Adequate" },
  { quality: "poor", label: "Poor" },
  { quality: "neglectful", label: "Neglectful" },
];

export const RESPONSIBILITY_LEVELS: { level: ResponsibilityLevel; label: string }[] = [
  { level: "fully_responsible", label: "Fully Responsible" },
  { level: "mostly_responsible", label: "Mostly Responsible" },
  { level: "shared_responsibility", label: "Shared Responsibility" },
  { level: "minimal_responsibility", label: "Minimal Responsibility" },
  { level: "not_involved", label: "Not Involved" },
];

export const THERAPEUTIC_IMPACTS: { impact: TherapeuticImpact; label: string }[] = [
  { impact: "very_positive", label: "Very Positive" },
  { impact: "positive", label: "Positive" },
  { impact: "neutral", label: "Neutral" },
  { impact: "minimal", label: "Minimal" },
  { impact: "negative", label: "Negative" },
];

// ── Metrics ─────────────────────────────────────────────────────────────

export function computePetCareMetrics(records: PetCareResponsibilityRecord[]): {
  total_sessions: number;
  neglectful_count: number;
  not_involved_count: number;
  negative_impact_count: number;
  poor_care_count: number;
  animal_welfare_rate: number | null;
  veterinary_care_rate: number | null;
  child_chose_rate: number | null;
  supervision_rate: number | null;
  hygiene_rate: number | null;
  allergy_checked_rate: number | null;
  care_plan_rate: number | null;
  social_worker_rate: number | null;
  parent_informed_rate: number | null;
  risk_assessment_rate: number | null;
  empathy_development_rate: number | null;
  recorded_promptly_rate: number | null;
  unique_children: number;
  by_pet_type: Record<string, number>;
  by_care_quality: Record<string, number>;
  by_responsibility_level: Record<string, number>;
  by_therapeutic_impact: Record<string, number>;
} {
  const neglectful = records.filter((r) => r.care_quality === "neglectful").length;
  const notInvolved = records.filter((r) => r.responsibility_level === "not_involved").length;
  const negativeImpact = records.filter((r) => r.therapeutic_impact === "negative").length;
  const poorCare = records.filter((r) => r.care_quality === "poor" || r.care_quality === "neglectful").length;

  const boolRate = (field: keyof PetCareResponsibilityRecord) => {
    const count = records.filter((r) => r[field] === true).length;
    return records.length > 0
      ? Math.round((count / records.length) * 1000) / 10
      : null;
  };

  const byPetType: Record<string, number> = {};
  for (const r of records) byPetType[r.pet_type] = (byPetType[r.pet_type] ?? 0) + 1;

  const byCareQuality: Record<string, number> = {};
  for (const r of records) byCareQuality[r.care_quality] = (byCareQuality[r.care_quality] ?? 0) + 1;

  const byResponsibility: Record<string, number> = {};
  for (const r of records) byResponsibility[r.responsibility_level] = (byResponsibility[r.responsibility_level] ?? 0) + 1;

  const byImpact: Record<string, number> = {};
  for (const r of records) byImpact[r.therapeutic_impact] = (byImpact[r.therapeutic_impact] ?? 0) + 1;

  return {
    total_sessions: records.length,
    neglectful_count: neglectful,
    not_involved_count: notInvolved,
    negative_impact_count: negativeImpact,
    poor_care_count: poorCare,
    animal_welfare_rate: boolRate("animal_welfare_met"),
    veterinary_care_rate: boolRate("veterinary_care_current"),
    child_chose_rate: boolRate("child_chose_interaction"),
    supervision_rate: boolRate("supervision_adequate"),
    hygiene_rate: boolRate("hygiene_maintained"),
    allergy_checked_rate: boolRate("allergy_checked"),
    care_plan_rate: boolRate("care_plan_reflects"),
    social_worker_rate: boolRate("social_worker_informed"),
    parent_informed_rate: boolRate("parent_informed"),
    risk_assessment_rate: boolRate("risk_assessment_done"),
    empathy_development_rate: boolRate("empathy_development_noted"),
    recorded_promptly_rate: boolRate("recorded_promptly"),
    unique_children: new Set(records.map((r) => r.child_name)).size,
    by_pet_type: byPetType,
    by_care_quality: byCareQuality,
    by_responsibility_level: byResponsibility,
    by_therapeutic_impact: byImpact,
  };
}

// ── Alerts ──────────────────────────────────────────────────────────────

export interface PetCareAlert {
  type: string;
  severity: "critical" | "high" | "medium";
  message: string;
  record_id?: string;
}

export function identifyPetCareAlerts(records: PetCareResponsibilityRecord[]): PetCareAlert[] {
  const alerts: PetCareAlert[] = [];

  // Critical: neglectful care with negative therapeutic impact (per-record)
  for (const r of records) {
    if (r.care_quality === "neglectful" && r.therapeutic_impact === "negative") {
      alerts.push({
        type: "neglectful_negative",
        severity: "critical",
        message: `${r.child_name} experienced neglectful pet care with negative therapeutic impact — welfare review required.`,
        record_id: r.id,
      });
    }
  }

  // High: animal welfare not met (>= 1)
  const noWelfare = records.filter((r) => r.animal_welfare_met === false).length;
  if (noWelfare > 0) {
    alerts.push({
      type: "no_animal_welfare",
      severity: "high",
      message: `${noWelfare} session${noWelfare === 1 ? " has" : "s have"} animal welfare standards not met.`,
    });
  }

  // High: no risk assessment (>= 1)
  const noRisk = records.filter((r) => r.risk_assessment_done === false).length;
  if (noRisk > 0) {
    alerts.push({
      type: "no_risk_assessment",
      severity: "high",
      message: `${noRisk} session${noRisk === 1 ? " has" : "s have"} no risk assessment completed.`,
    });
  }

  // Medium: child didn't choose interaction (>= 2)
  const noChoice = records.filter((r) => r.child_chose_interaction === false).length;
  if (noChoice >= 2) {
    alerts.push({
      type: "no_child_choice",
      severity: "medium",
      message: `${noChoice} sessions have children not choosing their pet interaction.`,
    });
  }

  // Medium: hygiene not maintained (>= 2)
  const noHygiene = records.filter((r) => r.hygiene_maintained === false).length;
  if (noHygiene >= 2) {
    alerts.push({
      type: "no_hygiene",
      severity: "medium",
      message: `${noHygiene} sessions have hygiene not maintained during pet care.`,
    });
  }

  return alerts;
}

// ── CRUD ────────────────────────────────────────────────────────────────

export async function listPetCareResponsibilities(
  homeId: string,
): Promise<ServiceResult<PetCareResponsibilityRecord[]>> {
  const client = sb();
  if (!client) return { ok: true, data: [] };
  const { data, error } = await (client.from("cs_pet_care_responsibility") as SB)
    .select("*")
    .eq("home_id", homeId)
    .order("session_date", { ascending: false });
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as PetCareResponsibilityRecord[] };
}

export async function createPetCareResponsibility(input: {
  homeId: string;
  petType: PetType;
  careQuality: CareQuality;
  responsibilityLevel: ResponsibilityLevel;
  therapeuticImpact: TherapeuticImpact;
  sessionDate: string;
  childName: string;
  childId?: string | null;
  supportedBy: string;
  animalWelfareMet: boolean;
  veterinaryCareCurrent: boolean;
  childChoseInteraction: boolean;
  supervisionAdequate: boolean;
  hygieneMaintained: boolean;
  allergyChecked: boolean;
  carePlanReflects: boolean;
  socialWorkerInformed: boolean;
  parentInformed: boolean;
  riskAssessmentDone: boolean;
  empathyDevelopmentNoted: boolean;
  recordedPromptly: boolean;
  issuesFound?: string[];
  actionsTaken?: string[];
  nextReviewDate?: string | null;
  notes?: string | null;
}): Promise<ServiceResult<PetCareResponsibilityRecord>> {
  const client = sb();
  if (!client) return { ok: false, error: "Supabase not configured" };
  const { data, error } = await (client.from("cs_pet_care_responsibility") as SB)
    .insert({
      home_id: input.homeId,
      pet_type: input.petType,
      care_quality: input.careQuality,
      responsibility_level: input.responsibilityLevel,
      therapeutic_impact: input.therapeuticImpact,
      session_date: input.sessionDate,
      child_name: input.childName,
      child_id: input.childId ?? null,
      supported_by: input.supportedBy,
      animal_welfare_met: input.animalWelfareMet,
      veterinary_care_current: input.veterinaryCareCurrent,
      child_chose_interaction: input.childChoseInteraction,
      supervision_adequate: input.supervisionAdequate,
      hygiene_maintained: input.hygieneMaintained,
      allergy_checked: input.allergyChecked,
      care_plan_reflects: input.carePlanReflects,
      social_worker_informed: input.socialWorkerInformed,
      parent_informed: input.parentInformed,
      risk_assessment_done: input.riskAssessmentDone,
      empathy_development_noted: input.empathyDevelopmentNoted,
      recorded_promptly: input.recordedPromptly,
      issues_found: input.issuesFound ?? [],
      actions_taken: input.actionsTaken ?? [],
      next_review_date: input.nextReviewDate ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as PetCareResponsibilityRecord };
}

export async function updatePetCareResponsibility(
  id: string,
  updates: Partial<Omit<PetCareResponsibilityRecord, "id" | "home_id" | "created_at">>,
): Promise<ServiceResult<PetCareResponsibilityRecord>> {
  const client = sb();
  if (!client) return { ok: false, error: "Supabase not configured" };
  const { data, error } = await (client.from("cs_pet_care_responsibility") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as PetCareResponsibilityRecord };
}

// ── Testing export ─────────────────────────────────────────────────────

export const _testing = { computePetCareMetrics, identifyPetCareAlerts };
