// ══════════════════════════════════════════════════════════════════════════════
// CARA — CULTURAL IDENTITY SUPPORT SERVICE
// Tracks cultural, religious, ethnic, and identity support provided
// to children in residential care, ensuring heritage is respected
// and identity development is actively promoted.
// CHR 2015 Reg 5 (identity — cultural, linguistic, religious),
// Reg 16 (diversity — respect for background and identity).
//
// Covers: identity area, support type, engagement level, cultural
// needs assessment, faith/religion support, language support.
//
// SCCIF: Experiences — "Children's cultural backgrounds are respected."
// "Identity needs are understood and actively supported."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type IdentityArea =
  | "cultural_heritage"
  | "religious_faith"
  | "language"
  | "ethnicity"
  | "gender_identity"
  | "sexuality"
  | "disability_identity"
  | "family_history"
  | "nationality"
  | "other";

export type SupportType =
  | "cultural_activity"
  | "religious_observance"
  | "language_support"
  | "food_dietary"
  | "celebration_festival"
  | "community_connection"
  | "identity_discussion"
  | "specialist_referral"
  | "resource_provision"
  | "other";

export type EngagementLevel =
  | "enthusiastic"
  | "engaged"
  | "neutral"
  | "reluctant"
  | "declined";

export type CulturalCompetency =
  | "highly_competent"
  | "competent"
  | "developing"
  | "needs_training"
  | "not_assessed";

export interface CulturalIdentitySupportRecord {
  id: string;
  home_id: string;
  identity_area: IdentityArea;
  support_type: SupportType;
  engagement_level: EngagementLevel;
  cultural_competency: CulturalCompetency;
  support_date: string;
  child_name: string;
  child_id: string | null;
  staff_name: string;
  child_views_sought: boolean | null; // null = not recorded; judgements are tri-state — credit needs === true, breach needs === false
  culturally_appropriate: boolean | null;
  family_consulted: boolean | null;
  identity_celebrated: boolean | null;
  resources_available: boolean | null;
  staff_trained: boolean | null;
  care_plan_reflects_identity: boolean | null;
  social_worker_informed: boolean;
  community_links_made: boolean;
  dietary_needs_met: boolean | null;
  language_supported: boolean | null;
  recorded_promptly: boolean | null;
  issues_found: string[];
  actions_taken: string[];
  next_review_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const IDENTITY_AREAS: { area: IdentityArea; label: string }[] = [
  { area: "cultural_heritage", label: "Cultural Heritage" },
  { area: "religious_faith", label: "Religious Faith" },
  { area: "language", label: "Language" },
  { area: "ethnicity", label: "Ethnicity" },
  { area: "gender_identity", label: "Gender Identity" },
  { area: "sexuality", label: "Sexuality" },
  { area: "disability_identity", label: "Disability Identity" },
  { area: "family_history", label: "Family History" },
  { area: "nationality", label: "Nationality" },
  { area: "other", label: "Other" },
];

export const SUPPORT_TYPES: { type: SupportType; label: string }[] = [
  { type: "cultural_activity", label: "Cultural Activity" },
  { type: "religious_observance", label: "Religious Observance" },
  { type: "language_support", label: "Language Support" },
  { type: "food_dietary", label: "Food/Dietary" },
  { type: "celebration_festival", label: "Celebration/Festival" },
  { type: "community_connection", label: "Community Connection" },
  { type: "identity_discussion", label: "Identity Discussion" },
  { type: "specialist_referral", label: "Specialist Referral" },
  { type: "resource_provision", label: "Resource Provision" },
  { type: "other", label: "Other" },
];

export const ENGAGEMENT_LEVELS: { level: EngagementLevel; label: string }[] = [
  { level: "enthusiastic", label: "Enthusiastic" },
  { level: "engaged", label: "Engaged" },
  { level: "neutral", label: "Neutral" },
  { level: "reluctant", label: "Reluctant" },
  { level: "declined", label: "Declined" },
];

export const CULTURAL_COMPETENCIES: { competency: CulturalCompetency; label: string }[] = [
  { competency: "highly_competent", label: "Highly Competent" },
  { competency: "competent", label: "Competent" },
  { competency: "developing", label: "Developing" },
  { competency: "needs_training", label: "Needs Training" },
  { competency: "not_assessed", label: "Not Assessed" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeCulturalIdentityMetrics(
  records: CulturalIdentitySupportRecord[],
): {
  total_supports: number;
  enthusiastic_count: number;
  declined_count: number;
  needs_training_count: number;
  not_assessed_count: number;
  child_views_sought_rate: number | null;
  culturally_appropriate_rate: number | null;
  family_consulted_rate: number | null;
  identity_celebrated_rate: number | null;
  resources_available_rate: number | null;
  staff_trained_rate: number | null;
  care_plan_reflects_rate: number | null;
  social_worker_informed_rate: number | null;
  community_links_rate: number | null;
  dietary_needs_rate: number | null;
  language_supported_rate: number | null;
  recorded_promptly_rate: number | null;
  unique_children: number;
  by_identity_area: Record<string, number>;
  by_support_type: Record<string, number>;
  by_engagement_level: Record<string, number>;
  by_cultural_competency: Record<string, number>;
} {
  const enthusiastic = records.filter((r) => r.engagement_level === "enthusiastic").length;
  const declined = records.filter((r) => r.engagement_level === "declined").length;
  const needsTraining = records.filter((r) => r.cultural_competency === "needs_training").length;
  const notAssessed = records.filter((r) => r.cultural_competency === "not_assessed").length;

  // Rated over the records where the question was answered either way. With the
  // judgement columns tri-state (null = not recorded), an unrecorded answer in
  // the denominator would score silence as a "no" — the same fabrication the
  // old `?? true` creates made in the other direction. While every field is
  // still a strict boolean this is behaviour-identical.
  const boolRate = (field: keyof CulturalIdentitySupportRecord) => {
    const recorded = records.filter((r) => r[field] !== null && r[field] !== undefined);
    const count = recorded.filter((r) => r[field] === true).length;
    return recorded.length > 0
      ? Math.round((count / recorded.length) * 1000) / 10
      : null;
  };

  const uniqueChildren = new Set(records.map((r) => r.child_name)).size;

  const byArea: Record<string, number> = {};
  for (const r of records) byArea[r.identity_area] = (byArea[r.identity_area] ?? 0) + 1;

  const byType: Record<string, number> = {};
  for (const r of records) byType[r.support_type] = (byType[r.support_type] ?? 0) + 1;

  const byEngagement: Record<string, number> = {};
  for (const r of records) byEngagement[r.engagement_level] = (byEngagement[r.engagement_level] ?? 0) + 1;

  const byCompetency: Record<string, number> = {};
  for (const r of records) byCompetency[r.cultural_competency] = (byCompetency[r.cultural_competency] ?? 0) + 1;

  return {
    total_supports: records.length,
    enthusiastic_count: enthusiastic,
    declined_count: declined,
    needs_training_count: needsTraining,
    not_assessed_count: notAssessed,
    child_views_sought_rate: boolRate("child_views_sought"),
    culturally_appropriate_rate: boolRate("culturally_appropriate"),
    family_consulted_rate: boolRate("family_consulted"),
    identity_celebrated_rate: boolRate("identity_celebrated"),
    resources_available_rate: boolRate("resources_available"),
    staff_trained_rate: boolRate("staff_trained"),
    care_plan_reflects_rate: boolRate("care_plan_reflects_identity"),
    social_worker_informed_rate: boolRate("social_worker_informed"),
    community_links_rate: boolRate("community_links_made"),
    dietary_needs_rate: boolRate("dietary_needs_met"),
    language_supported_rate: boolRate("language_supported"),
    recorded_promptly_rate: boolRate("recorded_promptly"),
    unique_children: uniqueChildren,
    by_identity_area: byArea,
    by_support_type: byType,
    by_engagement_level: byEngagement,
    by_cultural_competency: byCompetency,
  };
}

export function identifyCulturalIdentityAlerts(
  records: CulturalIdentitySupportRecord[],
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

  // Declined and child views not sought
  for (const r of records) {
    if (r.engagement_level === "declined" && r.child_views_sought !== true) {
      alerts.push({
        type: "declined_views_not_sought",
        severity: "critical",
        message: r.child_views_sought === false
          ? `${r.child_name} declined ${r.identity_area.replace(/_/g, " ")} support and their views were not sought — ensure child participation`
          : `${r.child_name} declined ${r.identity_area.replace(/_/g, " ")} support and there is no record their views were sought — seek and evidence them`,
        id: r.id,
      });
    }
  }

  // Care plan does not reflect identity
  const noCareReflects = records.filter((r) => r.care_plan_reflects_identity !== true).length;
  if (noCareReflects >= 1) {
    alerts.push({
      type: "care_plan_not_reflecting",
      severity: "high",
      message: `${noCareReflects} ${noCareReflects === 1 ? "record shows" : "records show"} no evidence the care plan reflects identity needs — update care plans`,
      id: "care_plan_not_reflecting",
    });
  }

  // Not culturally appropriate
  const notAppropriate = records.filter((r) => r.culturally_appropriate !== true).length;
  if (notAppropriate >= 1) {
    alerts.push({
      type: "not_culturally_appropriate",
      severity: "high",
      message: `${notAppropriate} ${notAppropriate === 1 ? "support session was" : "support sessions were"} without evidenced cultural appropriateness — review practice`,
      id: "not_culturally_appropriate",
    });
  }

  // Staff not trained
  const notTrained = records.filter((r) => r.staff_trained !== true).length;
  if (notTrained >= 2) {
    alerts.push({
      type: "staff_not_trained",
      severity: "medium",
      message: `${notTrained} sessions without evidenced cultural-competency training for staff — arrange training`,
      id: "staff_not_trained",
    });
  }

  // Family not consulted
  const noFamily = records.filter((r) => r.family_consulted !== true).length;
  if (noFamily >= 2) {
    alerts.push({
      type: "family_not_consulted",
      severity: "medium",
      message: `${noFamily} identity support sessions without evidenced family consultation — strengthen family links`,
      id: "family_not_consulted",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    identityArea?: IdentityArea;
    supportType?: SupportType;
    engagementLevel?: EngagementLevel;
    culturalCompetency?: CulturalCompetency;
    limit?: number;
  },
): Promise<ServiceResult<CulturalIdentitySupportRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_cultural_identity_support") as SB).select("*").eq("home_id", homeId);
  if (filters?.identityArea) q = q.eq("identity_area", filters.identityArea);
  if (filters?.supportType) q = q.eq("support_type", filters.supportType);
  if (filters?.engagementLevel) q = q.eq("engagement_level", filters.engagementLevel);
  if (filters?.culturalCompetency) q = q.eq("cultural_competency", filters.culturalCompetency);
  q = q.order("support_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  payload: {
    homeId: string;
    identityArea: IdentityArea;
    supportType: SupportType;
    engagementLevel: EngagementLevel;
    culturalCompetency: CulturalCompetency;
    supportDate: string;
    childName: string;
    childId?: string | null;
    staffName: string;
    childViewsSought?: boolean;
    culturallyAppropriate?: boolean;
    familyConsulted?: boolean;
    identityCelebrated?: boolean;
    resourcesAvailable?: boolean;
    staffTrained?: boolean;
    carePlanReflectsIdentity?: boolean;
    socialWorkerInformed?: boolean;
    communityLinksMade?: boolean;
    dietaryNeedsMet?: boolean;
    languageSupported?: boolean;
    recordedPromptly?: boolean;
    issuesFound?: string[];
    actionsTaken?: string[];
    nextReviewDate?: string | null;
    notes?: string | null;
  },
): Promise<ServiceResult<CulturalIdentitySupportRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_cultural_identity_support") as SB)
    .insert({
      home_id: payload.homeId,
      identity_area: payload.identityArea,
      support_type: payload.supportType,
      engagement_level: payload.engagementLevel,
      cultural_competency: payload.culturalCompetency,
      support_date: payload.supportDate,
      child_name: payload.childName,
      child_id: payload.childId ?? null,
      staff_name: payload.staffName,
      child_views_sought: payload.childViewsSought ?? null,
      culturally_appropriate: payload.culturallyAppropriate ?? null,
      family_consulted: payload.familyConsulted ?? null,
      identity_celebrated: payload.identityCelebrated ?? null,
      resources_available: payload.resourcesAvailable ?? null,
      staff_trained: payload.staffTrained ?? null,
      care_plan_reflects_identity: payload.carePlanReflectsIdentity ?? null,
      social_worker_informed: payload.socialWorkerInformed ?? false,
      community_links_made: payload.communityLinksMade ?? false,
      dietary_needs_met: payload.dietaryNeedsMet ?? null,
      language_supported: payload.languageSupported ?? null,
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
    identityArea: IdentityArea;
    supportType: SupportType;
    engagementLevel: EngagementLevel;
    culturalCompetency: CulturalCompetency;
    supportDate: string;
    childName: string;
    childId: string | null;
    staffName: string;
    childViewsSought: boolean;
    culturallyAppropriate: boolean;
    familyConsulted: boolean;
    identityCelebrated: boolean;
    resourcesAvailable: boolean;
    staffTrained: boolean;
    carePlanReflectsIdentity: boolean;
    socialWorkerInformed: boolean;
    communityLinksMade: boolean;
    dietaryNeedsMet: boolean;
    languageSupported: boolean;
    recordedPromptly: boolean;
    issuesFound: string[];
    actionsTaken: string[];
    nextReviewDate: string | null;
    notes: string | null;
  }>,
): Promise<ServiceResult<CulturalIdentitySupportRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.identityArea !== undefined) mapped.identity_area = updates.identityArea;
  if (updates.supportType !== undefined) mapped.support_type = updates.supportType;
  if (updates.engagementLevel !== undefined) mapped.engagement_level = updates.engagementLevel;
  if (updates.culturalCompetency !== undefined) mapped.cultural_competency = updates.culturalCompetency;
  if (updates.supportDate !== undefined) mapped.support_date = updates.supportDate;
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.childId !== undefined) mapped.child_id = updates.childId;
  if (updates.staffName !== undefined) mapped.staff_name = updates.staffName;
  if (updates.childViewsSought !== undefined) mapped.child_views_sought = updates.childViewsSought;
  if (updates.culturallyAppropriate !== undefined) mapped.culturally_appropriate = updates.culturallyAppropriate;
  if (updates.familyConsulted !== undefined) mapped.family_consulted = updates.familyConsulted;
  if (updates.identityCelebrated !== undefined) mapped.identity_celebrated = updates.identityCelebrated;
  if (updates.resourcesAvailable !== undefined) mapped.resources_available = updates.resourcesAvailable;
  if (updates.staffTrained !== undefined) mapped.staff_trained = updates.staffTrained;
  if (updates.carePlanReflectsIdentity !== undefined) mapped.care_plan_reflects_identity = updates.carePlanReflectsIdentity;
  if (updates.socialWorkerInformed !== undefined) mapped.social_worker_informed = updates.socialWorkerInformed;
  if (updates.communityLinksMade !== undefined) mapped.community_links_made = updates.communityLinksMade;
  if (updates.dietaryNeedsMet !== undefined) mapped.dietary_needs_met = updates.dietaryNeedsMet;
  if (updates.languageSupported !== undefined) mapped.language_supported = updates.languageSupported;
  if (updates.recordedPromptly !== undefined) mapped.recorded_promptly = updates.recordedPromptly;
  if (updates.issuesFound !== undefined) mapped.issues_found = updates.issuesFound;
  if (updates.actionsTaken !== undefined) mapped.actions_taken = updates.actionsTaken;
  if (updates.nextReviewDate !== undefined) mapped.next_review_date = updates.nextReviewDate;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  const { data, error } = await (s.from("cs_cultural_identity_support") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeCulturalIdentityMetrics,
  identifyCulturalIdentityAlerts,
};
