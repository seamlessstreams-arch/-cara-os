// ══════════════════════════════════════════════════════════════════════════════
// CARA — RELIGIOUS & CULTURAL OBSERVANCE SERVICE
// Monitors support for children's religious practices, cultural
// celebrations, dietary heritage, and identity expression.
// CHR 2015 Reg 10 (religion, language, culture),
// Reg 7 (children's wishes — cultural identity).
//
// Covers: observance type, accommodation level, cultural sensitivity,
// staff competence, and family involvement.
//
// SCCIF: Experiences — "Children's cultural and religious identity is valued."
// "Staff actively support heritage and faith practices."
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

export type ObservanceType =
  | "daily_prayer"
  | "weekly_worship"
  | "religious_festival"
  | "cultural_celebration"
  | "dietary_requirement"
  | "dress_code"
  | "language_support"
  | "heritage_activity"
  | "community_connection"
  | "other";

export type AccommodationLevel =
  | "fully_accommodated"
  | "mostly_accommodated"
  | "partially_accommodated"
  | "poorly_accommodated"
  | "not_accommodated";

export type CulturalSensitivity =
  | "excellent"
  | "good"
  | "adequate"
  | "poor"
  | "unaware";

export type StaffCompetence =
  | "highly_competent"
  | "competent"
  | "developing"
  | "limited"
  | "not_assessed";

export interface ReligiousCulturalObservanceRecord {
  id: string;
  home_id: string;
  observance_type: ObservanceType;
  accommodation_level: AccommodationLevel;
  cultural_sensitivity: CulturalSensitivity;
  staff_competence: StaffCompetence;
  observance_date: string;
  child_name: string;
  child_id: string | null;
  supported_by: string;
  child_views_sought: boolean;
  family_consulted: boolean;
  dietary_needs_met: boolean;
  resources_provided: boolean;
  community_links_used: boolean;
  staff_trained: boolean;
  care_plan_reflects: boolean;
  social_worker_informed: boolean;
  respectful_approach: boolean;
  celebration_supported: boolean;
  discrimination_addressed: boolean;
  recorded_promptly: boolean;
  issues_found: string[];
  actions_taken: string[];
  next_review_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const OBSERVANCE_TYPES: { type: ObservanceType; label: string }[] = [
  { type: "daily_prayer", label: "Daily Prayer" },
  { type: "weekly_worship", label: "Weekly Worship" },
  { type: "religious_festival", label: "Religious Festival" },
  { type: "cultural_celebration", label: "Cultural Celebration" },
  { type: "dietary_requirement", label: "Dietary Requirement" },
  { type: "dress_code", label: "Dress Code" },
  { type: "language_support", label: "Language Support" },
  { type: "heritage_activity", label: "Heritage Activity" },
  { type: "community_connection", label: "Community Connection" },
  { type: "other", label: "Other" },
];

export const ACCOMMODATION_LEVELS: { level: AccommodationLevel; label: string }[] = [
  { level: "fully_accommodated", label: "Fully Accommodated" },
  { level: "mostly_accommodated", label: "Mostly Accommodated" },
  { level: "partially_accommodated", label: "Partially Accommodated" },
  { level: "poorly_accommodated", label: "Poorly Accommodated" },
  { level: "not_accommodated", label: "Not Accommodated" },
];

export const CULTURAL_SENSITIVITIES: { sensitivity: CulturalSensitivity; label: string }[] = [
  { sensitivity: "excellent", label: "Excellent" },
  { sensitivity: "good", label: "Good" },
  { sensitivity: "adequate", label: "Adequate" },
  { sensitivity: "poor", label: "Poor" },
  { sensitivity: "unaware", label: "Unaware" },
];

export const STAFF_COMPETENCES: { competence: StaffCompetence; label: string }[] = [
  { competence: "highly_competent", label: "Highly Competent" },
  { competence: "competent", label: "Competent" },
  { competence: "developing", label: "Developing" },
  { competence: "limited", label: "Limited" },
  { competence: "not_assessed", label: "Not Assessed" },
];

// ── Pure compute ────────────────────────────────────────────────────────

export function computeReligiousCulturalMetrics(
  records: ReligiousCulturalObservanceRecord[],
): {
  total_observances: number;
  not_accommodated_count: number;
  poorly_accommodated_count: number;
  poor_sensitivity_count: number;
  unaware_count: number;
  child_views_rate: number | null;
  family_consulted_rate: number | null;
  dietary_needs_rate: number | null;
  resources_rate: number | null;
  community_links_rate: number | null;
  staff_trained_rate: number | null;
  care_plan_rate: number | null;
  social_worker_rate: number | null;
  respectful_rate: number | null;
  celebration_rate: number | null;
  discrimination_rate: number | null;
  recorded_promptly_rate: number | null;
  unique_children: number;
  by_observance_type: Record<string, number>;
  by_accommodation_level: Record<string, number>;
  by_cultural_sensitivity: Record<string, number>;
  by_staff_competence: Record<string, number>;
} {
  const notAccommodated = records.filter((r) => r.accommodation_level === "not_accommodated").length;
  const poorlyAccommodated = records.filter((r) => r.accommodation_level === "poorly_accommodated").length;
  const poorSensitivity = records.filter((r) => r.cultural_sensitivity === "poor").length;
  const unaware = records.filter((r) => r.cultural_sensitivity === "unaware").length;

  const boolRate = (field: keyof ReligiousCulturalObservanceRecord) => {
    const count = records.filter((r) => r[field] === true).length;
    return records.length > 0
      ? Math.round((count / records.length) * 1000) / 10
      : null;
  };

  const byType: Record<string, number> = {};
  for (const r of records) byType[r.observance_type] = (byType[r.observance_type] ?? 0) + 1;

  const byAccommodation: Record<string, number> = {};
  for (const r of records) byAccommodation[r.accommodation_level] = (byAccommodation[r.accommodation_level] ?? 0) + 1;

  const bySensitivity: Record<string, number> = {};
  for (const r of records) bySensitivity[r.cultural_sensitivity] = (bySensitivity[r.cultural_sensitivity] ?? 0) + 1;

  const byCompetence: Record<string, number> = {};
  for (const r of records) byCompetence[r.staff_competence] = (byCompetence[r.staff_competence] ?? 0) + 1;

  return {
    total_observances: records.length,
    not_accommodated_count: notAccommodated,
    poorly_accommodated_count: poorlyAccommodated,
    poor_sensitivity_count: poorSensitivity,
    unaware_count: unaware,
    child_views_rate: boolRate("child_views_sought"),
    family_consulted_rate: boolRate("family_consulted"),
    dietary_needs_rate: boolRate("dietary_needs_met"),
    resources_rate: boolRate("resources_provided"),
    community_links_rate: boolRate("community_links_used"),
    staff_trained_rate: boolRate("staff_trained"),
    care_plan_rate: boolRate("care_plan_reflects"),
    social_worker_rate: boolRate("social_worker_informed"),
    respectful_rate: boolRate("respectful_approach"),
    celebration_rate: boolRate("celebration_supported"),
    discrimination_rate: boolRate("discrimination_addressed"),
    recorded_promptly_rate: boolRate("recorded_promptly"),
    unique_children: new Set(records.map((r) => r.child_name)).size,
    by_observance_type: byType,
    by_accommodation_level: byAccommodation,
    by_cultural_sensitivity: bySensitivity,
    by_staff_competence: byCompetence,
  };
}

export function identifyReligiousCulturalAlerts(
  records: ReligiousCulturalObservanceRecord[],
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

  // Not accommodated with unaware sensitivity — per-record
  for (const r of records) {
    if (r.accommodation_level === "not_accommodated" && r.cultural_sensitivity === "unaware") {
      alerts.push({
        type: "not_accommodated_unaware",
        severity: "critical",
        message: `${r.child_name}'s ${r.observance_type.replace(/_/g, " ")} not accommodated with cultural unawareness — urgent Reg 10 action`,
        id: r.id,
      });
    }
  }

  // Dietary needs not met
  const noDietary = records.filter((r) => !r.dietary_needs_met).length;
  if (noDietary >= 1) {
    alerts.push({
      type: "dietary_needs_not_met",
      severity: "high",
      message: `${noDietary} ${noDietary === 1 ? "observance has" : "observances have"} dietary needs not met — review cultural dietary provision`,
      id: "dietary_needs_not_met",
    });
  }

  // Family not consulted
  const noFamily = records.filter((r) => !r.family_consulted).length;
  if (noFamily >= 1) {
    alerts.push({
      type: "family_not_consulted",
      severity: "high",
      message: `${noFamily} ${noFamily === 1 ? "observance has" : "observances have"} no family consultation — ensure cultural guidance`,
      id: "family_not_consulted",
    });
  }

  // Staff not trained
  const noTraining = records.filter((r) => !r.staff_trained).length;
  if (noTraining >= 2) {
    alerts.push({
      type: "staff_not_trained",
      severity: "medium",
      message: `${noTraining} observances with untrained staff — arrange cultural competence training`,
      id: "staff_not_trained",
    });
  }

  // Community links not used
  const noCommunity = records.filter((r) => !r.community_links_used).length;
  if (noCommunity >= 2) {
    alerts.push({
      type: "community_links_not_used",
      severity: "medium",
      message: `${noCommunity} observances without community links — strengthen external cultural connections`,
      id: "community_links_not_used",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    observanceType?: ObservanceType;
    accommodationLevel?: AccommodationLevel;
    culturalSensitivity?: CulturalSensitivity;
    staffCompetence?: StaffCompetence;
    limit?: number;
  },
): Promise<ServiceResult<ReligiousCulturalObservanceRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };
  const client = sb()!;
  let q = (client.from("cs_religious_cultural_observance") as SB).select("*").eq("home_id", homeId);
  if (filters?.observanceType) q = q.eq("observance_type", filters.observanceType);
  if (filters?.accommodationLevel) q = q.eq("accommodation_level", filters.accommodationLevel);
  if (filters?.culturalSensitivity) q = q.eq("cultural_sensitivity", filters.culturalSensitivity);
  if (filters?.staffCompetence) q = q.eq("staff_competence", filters.staffCompetence);
  q = q.order("observance_date", { ascending: false });
  if (filters?.limit) q = q.limit(filters.limit);
  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as ReligiousCulturalObservanceRecord[] };
}

export async function createRecord(payload: {
  homeId: string;
  observanceType: ObservanceType;
  accommodationLevel: AccommodationLevel;
  culturalSensitivity: CulturalSensitivity;
  staffCompetence: StaffCompetence;
  observanceDate: string;
  childName: string;
  childId?: string | null;
  supportedBy: string;
  childViewsSought?: boolean;
  familyConsulted?: boolean;
  dietaryNeedsMet?: boolean;
  resourcesProvided?: boolean;
  communityLinksUsed?: boolean;
  staffTrained?: boolean;
  carePlanReflects?: boolean;
  socialWorkerInformed?: boolean;
  respectfulApproach?: boolean;
  celebrationSupported?: boolean;
  discriminationAddressed?: boolean;
  recordedPromptly?: boolean;
  issuesFound?: string[];
  actionsTaken?: string[];
  nextReviewDate?: string | null;
  notes?: string | null;
}): Promise<ServiceResult<ReligiousCulturalObservanceRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };
  const client = sb()!;
  const { data, error } = await (client.from("cs_religious_cultural_observance") as SB)
    .insert({
      home_id: payload.homeId,
      observance_type: payload.observanceType,
      accommodation_level: payload.accommodationLevel,
      cultural_sensitivity: payload.culturalSensitivity,
      staff_competence: payload.staffCompetence,
      observance_date: payload.observanceDate,
      child_name: payload.childName,
      child_id: payload.childId ?? null,
      supported_by: payload.supportedBy,
      child_views_sought: payload.childViewsSought ?? true,
      family_consulted: payload.familyConsulted ?? true,
      dietary_needs_met: payload.dietaryNeedsMet ?? true,
      resources_provided: payload.resourcesProvided ?? true,
      community_links_used: payload.communityLinksUsed ?? true,
      staff_trained: payload.staffTrained ?? true,
      care_plan_reflects: payload.carePlanReflects ?? true,
      social_worker_informed: payload.socialWorkerInformed ?? true,
      respectful_approach: payload.respectfulApproach ?? true,
      celebration_supported: payload.celebrationSupported ?? true,
      discrimination_addressed: payload.discriminationAddressed ?? true,
      recorded_promptly: payload.recordedPromptly ?? true,
      issues_found: payload.issuesFound ?? [],
      actions_taken: payload.actionsTaken ?? [],
      next_review_date: payload.nextReviewDate ?? null,
      notes: payload.notes ?? null,
    })
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as ReligiousCulturalObservanceRecord };
}

export async function updateRecord(
  id: string,
  updates: Partial<{
    observanceType: ObservanceType;
    accommodationLevel: AccommodationLevel;
    culturalSensitivity: CulturalSensitivity;
    staffCompetence: StaffCompetence;
    observanceDate: string;
    childName: string;
    childId: string | null;
    supportedBy: string;
    childViewsSought: boolean;
    familyConsulted: boolean;
    dietaryNeedsMet: boolean;
    resourcesProvided: boolean;
    communityLinksUsed: boolean;
    staffTrained: boolean;
    carePlanReflects: boolean;
    socialWorkerInformed: boolean;
    respectfulApproach: boolean;
    celebrationSupported: boolean;
    discriminationAddressed: boolean;
    recordedPromptly: boolean;
    issuesFound: string[];
    actionsTaken: string[];
    nextReviewDate: string | null;
    notes: string | null;
  }>,
): Promise<ServiceResult<ReligiousCulturalObservanceRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };
  const client = sb()!;
  const mapped: Record<string, unknown> = {};
  if (updates.observanceType !== undefined) mapped.observance_type = updates.observanceType;
  if (updates.accommodationLevel !== undefined) mapped.accommodation_level = updates.accommodationLevel;
  if (updates.culturalSensitivity !== undefined) mapped.cultural_sensitivity = updates.culturalSensitivity;
  if (updates.staffCompetence !== undefined) mapped.staff_competence = updates.staffCompetence;
  if (updates.observanceDate !== undefined) mapped.observance_date = updates.observanceDate;
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.childId !== undefined) mapped.child_id = updates.childId;
  if (updates.supportedBy !== undefined) mapped.supported_by = updates.supportedBy;
  if (updates.childViewsSought !== undefined) mapped.child_views_sought = updates.childViewsSought;
  if (updates.familyConsulted !== undefined) mapped.family_consulted = updates.familyConsulted;
  if (updates.dietaryNeedsMet !== undefined) mapped.dietary_needs_met = updates.dietaryNeedsMet;
  if (updates.resourcesProvided !== undefined) mapped.resources_provided = updates.resourcesProvided;
  if (updates.communityLinksUsed !== undefined) mapped.community_links_used = updates.communityLinksUsed;
  if (updates.staffTrained !== undefined) mapped.staff_trained = updates.staffTrained;
  if (updates.carePlanReflects !== undefined) mapped.care_plan_reflects = updates.carePlanReflects;
  if (updates.socialWorkerInformed !== undefined) mapped.social_worker_informed = updates.socialWorkerInformed;
  if (updates.respectfulApproach !== undefined) mapped.respectful_approach = updates.respectfulApproach;
  if (updates.celebrationSupported !== undefined) mapped.celebration_supported = updates.celebrationSupported;
  if (updates.discriminationAddressed !== undefined) mapped.discrimination_addressed = updates.discriminationAddressed;
  if (updates.recordedPromptly !== undefined) mapped.recorded_promptly = updates.recordedPromptly;
  if (updates.issuesFound !== undefined) mapped.issues_found = updates.issuesFound;
  if (updates.actionsTaken !== undefined) mapped.actions_taken = updates.actionsTaken;
  if (updates.nextReviewDate !== undefined) mapped.next_review_date = updates.nextReviewDate;
  if (updates.notes !== undefined) mapped.notes = updates.notes;
  mapped.updated_at = new Date().toISOString();
  const { data, error } = await (client.from("cs_religious_cultural_observance") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as ReligiousCulturalObservanceRecord };
}

export const _testing = { computeReligiousCulturalMetrics, identifyReligiousCulturalAlerts };
