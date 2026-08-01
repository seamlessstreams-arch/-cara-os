// ══════════════════════════════════════════════════════════════════════════════
// CARA — SENSORY PROFILE SERVICE
// Manages sensory profiles and environmental adaptations for children,
// tracking sensory needs, triggers, calming strategies, and environmental
// modifications to support each child's wellbeing.
// CHR 2015 Reg 6 (quality and purpose of care — meeting individual needs),
// Reg 14 (healthcare — sensory and therapeutic needs),
// Reg 15 (staffing — understanding sensory needs).
//
// Tracks sensory sensitivities, preferred environments, triggers,
// de-escalation strategies, and environmental adaptations.
//
// SCCIF: Overall Experiences — "The environment meets the individual
// needs of each child." "Staff understand children's sensory needs."
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

export type SensoryDomain =
  | "visual"
  | "auditory"
  | "tactile"
  | "olfactory"
  | "gustatory"
  | "vestibular"
  | "proprioceptive"
  | "interoceptive";

export type SensitivityLevel =
  | "hyper_sensitive"
  | "sensitive"
  | "typical"
  | "seeking"
  | "hypo_sensitive";

export type AdaptationType =
  | "lighting"
  | "noise_reduction"
  | "texture_modification"
  | "temperature_control"
  | "space_layout"
  | "colour_scheme"
  | "sensory_equipment"
  | "routine_adjustment"
  | "diet_modification"
  | "clothing_adaptation"
  | "transition_support"
  | "other";

export type ProfileStatus =
  | "current"
  | "under_review"
  | "outdated"
  | "initial_assessment";

export interface SensoryProfile {
  id: string;
  home_id: string;
  child_name: string;
  child_id: string;
  sensory_domain: SensoryDomain;
  sensitivity_level: SensitivityLevel;
  triggers: string[];
  calming_strategies: string[];
  adaptations: AdaptationType[];
  adaptation_details: string | null;
  profile_status: ProfileStatus;
  assessed_by: string;
  assessed_date: string;
  next_review_date: string | null;
  occupational_therapist_input: boolean;
  staff_trained: boolean;
  child_views: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const SENSORY_DOMAINS: { domain: SensoryDomain; label: string }[] = [
  { domain: "visual", label: "Visual" },
  { domain: "auditory", label: "Auditory" },
  { domain: "tactile", label: "Tactile" },
  { domain: "olfactory", label: "Olfactory" },
  { domain: "gustatory", label: "Gustatory" },
  { domain: "vestibular", label: "Vestibular" },
  { domain: "proprioceptive", label: "Proprioceptive" },
  { domain: "interoceptive", label: "Interoceptive" },
];

export const SENSITIVITY_LEVELS: { level: SensitivityLevel; label: string }[] = [
  { level: "hyper_sensitive", label: "Hyper-Sensitive" },
  { level: "sensitive", label: "Sensitive" },
  { level: "typical", label: "Typical" },
  { level: "seeking", label: "Seeking" },
  { level: "hypo_sensitive", label: "Hypo-Sensitive" },
];

export const ADAPTATION_TYPES: { type: AdaptationType; label: string }[] = [
  { type: "lighting", label: "Lighting" },
  { type: "noise_reduction", label: "Noise Reduction" },
  { type: "texture_modification", label: "Texture Modification" },
  { type: "temperature_control", label: "Temperature Control" },
  { type: "space_layout", label: "Space Layout" },
  { type: "colour_scheme", label: "Colour Scheme" },
  { type: "sensory_equipment", label: "Sensory Equipment" },
  { type: "routine_adjustment", label: "Routine Adjustment" },
  { type: "diet_modification", label: "Diet Modification" },
  { type: "clothing_adaptation", label: "Clothing Adaptation" },
  { type: "transition_support", label: "Transition Support" },
  { type: "other", label: "Other" },
];

export const PROFILE_STATUSES: { status: ProfileStatus; label: string }[] = [
  { status: "current", label: "Current" },
  { status: "under_review", label: "Under Review" },
  { status: "outdated", label: "Outdated" },
  { status: "initial_assessment", label: "Initial Assessment" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeSensoryMetrics(
  profiles: SensoryProfile[],
  totalChildren: number,
): {
  total_profiles: number;
  children_assessed: number;
  assessment_coverage: number | null;
  current_profiles: number;
  outdated_profiles: number;
  under_review_count: number;
  hyper_sensitive_count: number;
  hypo_sensitive_count: number;
  seeking_count: number;
  staff_trained_rate: number | null;
  ot_input_rate: number | null;
  child_views_rate: number | null;
  adaptations_in_place: number;
  by_sensory_domain: Record<string, number>;
  by_sensitivity_level: Record<string, number>;
  by_adaptation_type: Record<string, number>;
} {
  const uniqueChildren = new Set(profiles.map((p) => p.child_id)).size;
  const coverage =
    totalChildren > 0
      ? Math.round((uniqueChildren / totalChildren) * 1000) / 10
      : null;

  const current = profiles.filter((p) => p.profile_status === "current").length;
  const outdated = profiles.filter((p) => p.profile_status === "outdated").length;
  const underReview = profiles.filter((p) => p.profile_status === "under_review").length;

  const hyperSensitive = profiles.filter((p) => p.sensitivity_level === "hyper_sensitive").length;
  const hypoSensitive = profiles.filter((p) => p.sensitivity_level === "hypo_sensitive").length;
  const seeking = profiles.filter((p) => p.sensitivity_level === "seeking").length;

  const staffTrained = profiles.filter((p) => p.staff_trained).length;
  const staffRate =
    profiles.length > 0
      ? Math.round((staffTrained / profiles.length) * 1000) / 10
      : null;

  const otInput = profiles.filter((p) => p.occupational_therapist_input).length;
  const otRate =
    profiles.length > 0
      ? Math.round((otInput / profiles.length) * 1000) / 10
      : null;

  const childViews = profiles.filter((p) => p.child_views !== null).length;
  const childRate =
    profiles.length > 0
      ? Math.round((childViews / profiles.length) * 1000) / 10
      : null;

  const adaptationsInPlace = profiles.filter((p) => p.adaptations.length > 0).length;

  const byDomain: Record<string, number> = {};
  for (const p of profiles) {
    byDomain[p.sensory_domain] = (byDomain[p.sensory_domain] ?? 0) + 1;
  }

  const byLevel: Record<string, number> = {};
  for (const p of profiles) {
    byLevel[p.sensitivity_level] = (byLevel[p.sensitivity_level] ?? 0) + 1;
  }

  const byAdaptation: Record<string, number> = {};
  for (const p of profiles) {
    for (const a of p.adaptations) {
      byAdaptation[a] = (byAdaptation[a] ?? 0) + 1;
    }
  }

  return {
    total_profiles: profiles.length,
    children_assessed: uniqueChildren,
    assessment_coverage: coverage,
    current_profiles: current,
    outdated_profiles: outdated,
    under_review_count: underReview,
    hyper_sensitive_count: hyperSensitive,
    hypo_sensitive_count: hypoSensitive,
    seeking_count: seeking,
    staff_trained_rate: staffRate,
    ot_input_rate: otRate,
    child_views_rate: childRate,
    adaptations_in_place: adaptationsInPlace,
    by_sensory_domain: byDomain,
    by_sensitivity_level: byLevel,
    by_adaptation_type: byAdaptation,
  };
}

export function identifySensoryAlerts(
  profiles: SensoryProfile[],
  totalChildren: number,
  now: Date = new Date(),
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

  // Children without sensory profiles
  const childrenAssessed = new Set(profiles.map((p) => p.child_id));
  if (totalChildren > 0 && childrenAssessed.size < totalChildren) {
    const gap = totalChildren - childrenAssessed.size;
    alerts.push({
      type: "no_profile",
      severity: "high",
      message: `${gap} ${gap === 1 ? "child has" : "children have"} no sensory profile — assess sensory needs to inform care`,
      id: "profile_gap",
    });
  }

  // Outdated profiles
  for (const p of profiles) {
    if (p.profile_status === "outdated") {
      alerts.push({
        type: "profile_outdated",
        severity: "medium",
        message: `Sensory profile for ${p.child_name} (${p.sensory_domain}) is outdated — schedule reassessment`,
        id: p.id,
      });
    }
  }

  // Staff not trained on sensory needs
  for (const p of profiles) {
    if (!p.staff_trained && (p.sensitivity_level === "hyper_sensitive" || p.sensitivity_level === "hypo_sensitive")) {
      alerts.push({
        type: "staff_not_trained",
        severity: "high",
        message: `Staff not trained on ${p.child_name}'s ${p.sensory_domain} ${p.sensitivity_level.replace(/_/g, " ")} needs — training required`,
        id: p.id,
      });
    }
  }

  // Review overdue
  for (const p of profiles) {
    if (p.next_review_date && new Date(p.next_review_date) < now) {
      alerts.push({
        type: "review_overdue",
        severity: "medium",
        message: `Sensory profile review for ${p.child_name} (${p.sensory_domain}) overdue since ${p.next_review_date}`,
        id: p.id,
      });
    }
  }

  // Hyper-sensitive without adaptations
  for (const p of profiles) {
    if (p.sensitivity_level === "hyper_sensitive" && p.adaptations.length === 0) {
      alerts.push({
        type: "no_adaptations",
        severity: "high",
        message: `${p.child_name} is hyper-sensitive (${p.sensory_domain}) but no environmental adaptations recorded — implement adaptations`,
        id: p.id,
      });
    }
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listProfiles(
  homeId: string,
  filters?: {
    childId?: string;
    sensoryDomain?: SensoryDomain;
    sensitivityLevel?: SensitivityLevel;
    profileStatus?: ProfileStatus;
    limit?: number;
  },
): Promise<ServiceResult<SensoryProfile[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_sensory_profiles") as SB).select("*").eq("home_id", homeId);
  if (filters?.childId) q = q.eq("child_id", filters.childId);
  if (filters?.sensoryDomain) q = q.eq("sensory_domain", filters.sensoryDomain);
  if (filters?.sensitivityLevel) q = q.eq("sensitivity_level", filters.sensitivityLevel);
  if (filters?.profileStatus) q = q.eq("profile_status", filters.profileStatus);
  q = q.order("assessed_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createProfile(
  input: {
    homeId: string;
    childName: string;
    childId: string;
    sensoryDomain: SensoryDomain;
    sensitivityLevel: SensitivityLevel;
    triggers: string[];
    calmingStrategies: string[];
    adaptations: AdaptationType[];
    adaptationDetails?: string;
    profileStatus: ProfileStatus;
    assessedBy: string;
    assessedDate: string;
    nextReviewDate?: string;
    occupationalTherapistInput: boolean;
    staffTrained: boolean;
    childViews?: string;
    notes?: string;
  },
): Promise<ServiceResult<SensoryProfile>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_sensory_profiles") as SB)
    .insert({
      home_id: input.homeId,
      child_name: input.childName,
      child_id: input.childId,
      sensory_domain: input.sensoryDomain,
      sensitivity_level: input.sensitivityLevel,
      triggers: input.triggers,
      calming_strategies: input.calmingStrategies,
      adaptations: input.adaptations,
      adaptation_details: input.adaptationDetails ?? null,
      profile_status: input.profileStatus,
      assessed_by: input.assessedBy,
      assessed_date: input.assessedDate,
      next_review_date: input.nextReviewDate ?? null,
      occupational_therapist_input: input.occupationalTherapistInput,
      staff_trained: input.staffTrained,
      child_views: input.childViews ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateProfile(
  id: string,
  updates: Partial<Record<string, unknown>>,
): Promise<ServiceResult<SensoryProfile>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_sensory_profiles") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeSensoryMetrics,
  identifySensoryAlerts,
};
