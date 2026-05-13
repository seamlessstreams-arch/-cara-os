// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CULTURAL IDENTITY & DIVERSITY SERVICE
// Manages cultural identity profiles and diversity support actions for children
// in care. CHR 2015 Reg 7 (quality of care — promoting identity), Reg 11
// (positive relationships), Equality Act 2010 (protected characteristics),
// SCCIF Well-Led quality standard (inclusive leadership, equality & diversity).
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

export type IdentityActionType =
  | "cultural_activity"
  | "religious_practice"
  | "language_support"
  | "dietary_provision"
  | "community_engagement"
  | "festival_celebration"
  | "identity_discussion"
  | "hair_skin_care"
  | "clothing_provision"
  | "mentor_connection"
  | "heritage_exploration"
  | "other";

export type ChildSatisfaction =
  | "very_positive"
  | "positive"
  | "neutral"
  | "negative";

export type ProfileStatus = "active" | "archived";

export interface IdentityProfile {
  id: string;
  home_id: string;
  child_id: string;
  child_name: string;
  ethnicity: string | null;
  religion: string | null;
  first_language: string | null;
  additional_languages: string[];
  cultural_needs: string;
  dietary_requirements: string;
  religious_practices: string;
  identity_needs: string;
  hair_skin_care_needs: string;
  clothing_preferences: string;
  festivals_celebrated: string[];
  community_links: string[];
  child_views_on_identity: string | null;
  support_plan: string;
  last_reviewed_date: string | null;
  reviewed_by: string | null;
  next_review_date: string | null;
  status: ProfileStatus;
  created_at: string;
  updated_at: string;
}

export interface IdentityAction {
  id: string;
  home_id: string;
  child_id: string;
  child_name: string;
  action_date: string;
  recorded_by: string;
  action_type: IdentityActionType;
  description: string;
  outcome: string | null;
  child_feedback: string | null;
  child_satisfaction: ChildSatisfaction | null;
  created_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const IDENTITY_ACTION_TYPES: { type: IdentityActionType; label: string }[] = [
  { type: "cultural_activity", label: "Cultural Activity" },
  { type: "religious_practice", label: "Religious Practice" },
  { type: "language_support", label: "Language Support" },
  { type: "dietary_provision", label: "Dietary Provision" },
  { type: "community_engagement", label: "Community Engagement" },
  { type: "festival_celebration", label: "Festival Celebration" },
  { type: "identity_discussion", label: "Identity Discussion" },
  { type: "hair_skin_care", label: "Hair & Skin Care" },
  { type: "clothing_provision", label: "Clothing Provision" },
  { type: "mentor_connection", label: "Mentor Connection" },
  { type: "heritage_exploration", label: "Heritage Exploration" },
  { type: "other", label: "Other" },
];

export const CHILD_SATISFACTION_LEVELS: { level: ChildSatisfaction; label: string }[] = [
  { level: "very_positive", label: "Very Positive" },
  { level: "positive", label: "Positive" },
  { level: "neutral", label: "Neutral" },
  { level: "negative", label: "Negative" },
];

export const PROTECTED_CHARACTERISTICS: { characteristic: string; label: string }[] = [
  { characteristic: "age", label: "Age" },
  { characteristic: "disability", label: "Disability" },
  { characteristic: "gender_reassignment", label: "Gender Reassignment" },
  { characteristic: "race", label: "Race" },
  { characteristic: "religion_belief", label: "Religion or Belief" },
  { characteristic: "sex", label: "Sex" },
  { characteristic: "sexual_orientation", label: "Sexual Orientation" },
];

export const COMMON_DIETARY_REQUIREMENTS: { requirement: string; label: string }[] = [
  { requirement: "halal", label: "Halal" },
  { requirement: "kosher", label: "Kosher" },
  { requirement: "vegetarian", label: "Vegetarian" },
  { requirement: "vegan", label: "Vegan" },
  { requirement: "no_pork", label: "No Pork" },
  { requirement: "no_beef", label: "No Beef" },
  { requirement: "gluten_free", label: "Gluten Free" },
  { requirement: "dairy_free", label: "Dairy Free" },
  { requirement: "nut_free", label: "Nut Free" },
  { requirement: "other", label: "Other" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

/**
 * Compute cultural identity and diversity metrics from profiles and actions.
 *
 * Regulation references: CHR 2015 Reg 7 (quality of care — promoting
 * identity), Reg 11 (positive relationships), Equality Act 2010,
 * SCCIF Well-Led quality standard.
 */
export function computeIdentityMetrics(
  profiles: IdentityProfile[],
  actions: IdentityAction[],
): {
  children_with_profiles: number;
  total_children: number;
  profile_review_rate: number;
  actions_this_quarter: number;
  by_action_type: Record<string, number>;
  satisfaction_rate: number;
  children_with_community_links: number;
  children_with_language_support: number;
  avg_actions_per_child: number;
} {
  const now = new Date();
  const quarterStartMs = new Date(
    now.getFullYear(),
    Math.floor(now.getMonth() / 3) * 3,
    1,
  ).getTime();

  const activeProfiles = profiles.filter((p) => p.status === "active");
  const childrenWithProfiles = new Set(activeProfiles.map((p) => p.child_id)).size;
  const totalChildren = profiles.length;

  // Profile review rate: % of active profiles reviewed within last 6 months
  const sixMonthsMs = 183 * 24 * 60 * 60 * 1000;
  let reviewedCount = 0;
  for (const p of activeProfiles) {
    if (p.last_reviewed_date) {
      const reviewDate = new Date(p.last_reviewed_date).getTime();
      if (now.getTime() - reviewDate <= sixMonthsMs) {
        reviewedCount++;
      }
    }
  }
  const profileReviewRate =
    activeProfiles.length > 0
      ? Math.round((reviewedCount / activeProfiles.length) * 1000) / 10
      : 0;

  // Actions this quarter
  let actionsThisQuarter = 0;
  const byActionType: Record<string, number> = {};

  for (const a of actions) {
    const actionDateMs = new Date(a.action_date).getTime();
    if (actionDateMs >= quarterStartMs) {
      actionsThisQuarter++;
    }
    byActionType[a.action_type] = (byActionType[a.action_type] ?? 0) + 1;
  }

  // Satisfaction rate: (positive + very_positive) / total with feedback
  let positiveFeedbackCount = 0;
  let totalWithFeedback = 0;
  for (const a of actions) {
    if (a.child_satisfaction) {
      totalWithFeedback++;
      if (a.child_satisfaction === "positive" || a.child_satisfaction === "very_positive") {
        positiveFeedbackCount++;
      }
    }
  }
  const satisfactionRate =
    totalWithFeedback > 0
      ? Math.round((positiveFeedbackCount / totalWithFeedback) * 1000) / 10
      : 0;

  // Children with community links
  const childrenWithCommunityLinks = activeProfiles.filter(
    (p) => Array.isArray(p.community_links) && p.community_links.length > 0,
  ).length;

  // Children with language support actions
  const childrenWithLanguageSupport = new Set(
    actions
      .filter((a) => a.action_type === "language_support")
      .map((a) => a.child_id),
  ).size;

  // Average actions per child
  const uniqueChildrenWithActions = new Set(actions.map((a) => a.child_id)).size;
  const avgActionsPerChild =
    uniqueChildrenWithActions > 0
      ? Math.round((actions.length / uniqueChildrenWithActions) * 10) / 10
      : 0;

  return {
    children_with_profiles: childrenWithProfiles,
    total_children: totalChildren,
    profile_review_rate: profileReviewRate,
    actions_this_quarter: actionsThisQuarter,
    by_action_type: byActionType,
    satisfaction_rate: satisfactionRate,
    children_with_community_links: childrenWithCommunityLinks,
    children_with_language_support: childrenWithLanguageSupport,
    avg_actions_per_child: avgActionsPerChild,
  };
}

/**
 * Identify cultural identity and diversity alerts requiring attention.
 *
 * Alert categories:
 *   - Child without identity profile (critical)
 *   - Profile not reviewed in 6+ months (high)
 *   - No cultural actions recorded for child in 3+ months (medium)
 *   - Child negative feedback (high)
 *   - No community links recorded (medium)
 *   - No dietary requirements documented when ethnicity suggests needs (low)
 *   - Language support needed but not recorded (medium)
 *
 * Regulation references: CHR 2015 Reg 7 (quality of care), Reg 11 (positive
 * relationships), Equality Act 2010, SCCIF Well-Led.
 */
export function identifyIdentityAlerts(
  profiles: IdentityProfile[],
  actions: IdentityAction[],
  now: Date = new Date(),
): {
  severity: "critical" | "high" | "medium" | "low";
  category: string;
  message: string;
  related_id: string;
  related_type: "profile" | "action";
}[] {
  const alerts: {
    severity: "critical" | "high" | "medium" | "low";
    category: string;
    message: string;
    related_id: string;
    related_type: "profile" | "action";
  }[] = [];

  const sixMonthsMs = 183 * 24 * 60 * 60 * 1000;
  const threeMonthsMs = 91 * 24 * 60 * 60 * 1000;

  // Build map: child_id -> latest action date
  const latestActionByChild = new Map<string, number>();
  for (const a of actions) {
    const actionDate = new Date(a.action_date).getTime();
    const existing = latestActionByChild.get(a.child_id) ?? 0;
    if (actionDate > existing) {
      latestActionByChild.set(a.child_id, actionDate);
    }
  }

  // Build set: child_ids with language_support actions
  const childrenWithLanguageActions = new Set(
    actions.filter((a) => a.action_type === "language_support").map((a) => a.child_id),
  );

  // Collect all known child IDs from actions that may not have profiles
  const childIdsFromActions = new Set(actions.map((a) => a.child_id));
  const childIdsFromProfiles = new Set(profiles.map((p) => p.child_id));

  // Alert: child in actions but no profile
  for (const a of actions) {
    if (!childIdsFromProfiles.has(a.child_id)) {
      // Only add one alert per child
      childIdsFromProfiles.add(a.child_id); // prevent duplicates
      alerts.push({
        severity: "critical",
        category: "no_identity_profile",
        message: `${a.child_name} has no cultural identity profile — Reg 7 requires promoting and supporting each child's identity`,
        related_id: a.id,
        related_type: "action",
      });
    }
  }

  for (const p of profiles) {
    if (p.status !== "active") continue;

    // Alert: profile not reviewed in 6+ months
    if (p.last_reviewed_date) {
      const reviewDate = new Date(p.last_reviewed_date).getTime();
      if (now.getTime() - reviewDate > sixMonthsMs) {
        alerts.push({
          severity: "high",
          category: "profile_review_overdue",
          message: `Identity profile for ${p.child_name} not reviewed since ${p.last_reviewed_date} — 6-monthly review required`,
          related_id: p.id,
          related_type: "profile",
        });
      }
    } else {
      // Never reviewed
      alerts.push({
        severity: "high",
        category: "profile_review_overdue",
        message: `Identity profile for ${p.child_name} has never been reviewed — review required under Reg 7`,
        related_id: p.id,
        related_type: "profile",
      });
    }

    // Alert: no cultural actions in 3+ months
    const latestAction = latestActionByChild.get(p.child_id);
    if (!latestAction || now.getTime() - latestAction > threeMonthsMs) {
      const detail = latestAction
        ? `last action over 3 months ago`
        : `no cultural actions recorded`;
      alerts.push({
        severity: "medium",
        category: "no_recent_actions",
        message: `${p.child_name} — ${detail}. Regular identity support activities expected under Reg 7`,
        related_id: p.id,
        related_type: "profile",
      });
    }

    // Alert: no community links recorded
    if (!Array.isArray(p.community_links) || p.community_links.length === 0) {
      alerts.push({
        severity: "medium",
        category: "no_community_links",
        message: `${p.child_name} has no community links recorded — Reg 11 requires supporting positive relationships and community connections`,
        related_id: p.id,
        related_type: "profile",
      });
    }

    // Alert: no dietary requirements documented when ethnicity suggests possible needs
    if (
      p.ethnicity &&
      p.ethnicity.trim() !== "" &&
      p.dietary_requirements.trim() === ""
    ) {
      alerts.push({
        severity: "low",
        category: "dietary_not_documented",
        message: `${p.child_name} has ethnicity recorded but no dietary requirements documented — consider whether cultural dietary needs apply`,
        related_id: p.id,
        related_type: "profile",
      });
    }

    // Alert: language support needed but not recorded
    if (
      p.first_language &&
      p.first_language.toLowerCase() !== "english" &&
      !childrenWithLanguageActions.has(p.child_id)
    ) {
      alerts.push({
        severity: "medium",
        category: "language_support_needed",
        message: `${p.child_name}'s first language is ${p.first_language} but no language support actions have been recorded`,
        related_id: p.id,
        related_type: "profile",
      });
    }
  }

  // Alert: child negative feedback
  for (const a of actions) {
    if (a.child_satisfaction === "negative") {
      alerts.push({
        severity: "high",
        category: "negative_feedback",
        message: `${a.child_name} gave negative feedback on ${a.action_type.replace(/_/g, " ")} activity on ${a.action_date} — review required under Reg 7`,
        related_id: a.id,
        related_type: "action",
      });
    }
  }

  // Sort alerts: critical first, then high, then medium, then low
  const severityOrder: Record<string, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };
  alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return alerts;
}

// ── CRUD — Identity Profiles ──────────────────────────────────────────────

export async function listProfiles(
  homeId: string,
  filters?: {
    childId?: string;
    status?: ProfileStatus;
    limit?: number;
  },
): Promise<ServiceResult<IdentityProfile[]>> {
  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_identity_profiles") as SB).select("*").eq("home_id", homeId);
  if (filters?.childId) q = q.eq("child_id", filters.childId);
  if (filters?.status) q = q.eq("status", filters.status);
  q = q.order("created_at", { ascending: false }).limit(filters?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createProfile(
  input: {
    homeId: string;
    childId: string;
    childName: string;
    ethnicity?: string;
    religion?: string;
    firstLanguage?: string;
    additionalLanguages?: string[];
    culturalNeeds?: string;
    dietaryRequirements?: string;
    religiousPractices?: string;
    identityNeeds?: string;
    hairSkinCareNeeds?: string;
    clothingPreferences?: string;
    festivalsCelebrated?: string[];
    communityLinks?: string[];
    childViewsOnIdentity?: string;
    supportPlan?: string;
    lastReviewedDate?: string;
    reviewedBy?: string;
    nextReviewDate?: string;
  },
): Promise<ServiceResult<IdentityProfile>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_identity_profiles") as SB)
    .insert({
      home_id: input.homeId,
      child_id: input.childId,
      child_name: input.childName,
      ethnicity: input.ethnicity ?? null,
      religion: input.religion ?? null,
      first_language: input.firstLanguage ?? null,
      additional_languages: input.additionalLanguages ?? [],
      cultural_needs: input.culturalNeeds ?? "",
      dietary_requirements: input.dietaryRequirements ?? "",
      religious_practices: input.religiousPractices ?? "",
      identity_needs: input.identityNeeds ?? "",
      hair_skin_care_needs: input.hairSkinCareNeeds ?? "",
      clothing_preferences: input.clothingPreferences ?? "",
      festivals_celebrated: input.festivalsCelebrated ?? [],
      community_links: input.communityLinks ?? [],
      child_views_on_identity: input.childViewsOnIdentity ?? null,
      support_plan: input.supportPlan ?? "",
      last_reviewed_date: input.lastReviewedDate ?? null,
      reviewed_by: input.reviewedBy ?? null,
      next_review_date: input.nextReviewDate ?? null,
      status: "active",
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateProfile(
  id: string,
  updates: Partial<Record<string, unknown>>,
): Promise<ServiceResult<IdentityProfile>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_identity_profiles") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── CRUD — Identity Actions ──────────────────────────────────────────────

export async function listActions(
  homeId: string,
  filters?: {
    childId?: string;
    actionType?: IdentityActionType;
    limit?: number;
  },
): Promise<ServiceResult<IdentityAction[]>> {
  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_identity_actions") as SB).select("*").eq("home_id", homeId);
  if (filters?.childId) q = q.eq("child_id", filters.childId);
  if (filters?.actionType) q = q.eq("action_type", filters.actionType);
  q = q.order("created_at", { ascending: false }).limit(filters?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createAction(
  input: {
    homeId: string;
    childId: string;
    childName: string;
    actionDate?: string;
    recordedBy: string;
    actionType: IdentityActionType;
    description?: string;
    outcome?: string;
    childFeedback?: string;
    childSatisfaction?: ChildSatisfaction;
  },
): Promise<ServiceResult<IdentityAction>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_identity_actions") as SB)
    .insert({
      home_id: input.homeId,
      child_id: input.childId,
      child_name: input.childName,
      action_date: input.actionDate ?? new Date().toISOString().split("T")[0],
      recorded_by: input.recordedBy,
      action_type: input.actionType,
      description: input.description ?? "",
      outcome: input.outcome ?? null,
      child_feedback: input.childFeedback ?? null,
      child_satisfaction: input.childSatisfaction ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeIdentityMetrics,
  identifyIdentityAlerts,
  IDENTITY_ACTION_TYPES,
  CHILD_SATISFACTION_LEVELS,
  PROTECTED_CHARACTERISTICS,
  COMMON_DIETARY_REQUIREMENTS,
};
