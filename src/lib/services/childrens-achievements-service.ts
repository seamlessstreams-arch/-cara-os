// ══════════════════════════════════════════════════════════════════════════════
// CARA — CHILDREN'S ACHIEVEMENTS SERVICE
// Celebrates and records children's achievements, milestones, awards,
// and positive progress across all areas of their lives.
// CHR 2015 Reg 6 (quality and purpose of care — celebrating success),
// Reg 7 (children's views — recognising what matters to them),
// Reg 12 (promoting educational achievement).
//
// Tracks academic, personal, social, sporting, creative, and behavioural
// achievements. Records how achievements are celebrated and shared.
//
// SCCIF: Overall Experiences — "Children's achievements are celebrated."
// "Children feel valued and recognised for their progress."
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

export type AchievementCategory =
  | "academic"
  | "sporting"
  | "creative"
  | "social"
  | "personal_growth"
  | "behavioural"
  | "independence"
  | "health_wellbeing"
  | "community"
  | "employment"
  | "other";

export type AchievementSignificance =
  | "exceptional"
  | "significant"
  | "notable"
  | "everyday";

export type CelebrationMethod =
  | "verbal_praise"
  | "certificate"
  | "reward"
  | "display_board"
  | "shared_with_family"
  | "shared_with_social_worker"
  | "house_meeting"
  | "special_activity"
  | "added_to_life_story"
  | "photograph"
  | "other";

export interface Achievement {
  id: string;
  home_id: string;
  child_name: string;
  child_id: string;
  achievement_date: string;
  category: AchievementCategory;
  title: string;
  description: string;
  significance: AchievementSignificance;
  celebrations: CelebrationMethod[];
  recorded_by: string;
  child_views: string | null;
  child_proud: boolean;
  shared_with_family: boolean;
  shared_with_social_worker: boolean;
  added_to_life_story: boolean;
  photograph_taken: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const ACHIEVEMENT_CATEGORIES: { category: AchievementCategory; label: string }[] = [
  { category: "academic", label: "Academic" },
  { category: "sporting", label: "Sporting" },
  { category: "creative", label: "Creative" },
  { category: "social", label: "Social" },
  { category: "personal_growth", label: "Personal Growth" },
  { category: "behavioural", label: "Behavioural" },
  { category: "independence", label: "Independence" },
  { category: "health_wellbeing", label: "Health & Wellbeing" },
  { category: "community", label: "Community" },
  { category: "employment", label: "Employment" },
  { category: "other", label: "Other" },
];

export const ACHIEVEMENT_SIGNIFICANCES: { significance: AchievementSignificance; label: string }[] = [
  { significance: "exceptional", label: "Exceptional" },
  { significance: "significant", label: "Significant" },
  { significance: "notable", label: "Notable" },
  { significance: "everyday", label: "Everyday" },
];

export const CELEBRATION_METHODS: { method: CelebrationMethod; label: string }[] = [
  { method: "verbal_praise", label: "Verbal Praise" },
  { method: "certificate", label: "Certificate" },
  { method: "reward", label: "Reward" },
  { method: "display_board", label: "Display Board" },
  { method: "shared_with_family", label: "Shared with Family" },
  { method: "shared_with_social_worker", label: "Shared with Social Worker" },
  { method: "house_meeting", label: "House Meeting" },
  { method: "special_activity", label: "Special Activity" },
  { method: "added_to_life_story", label: "Added to Life Story" },
  { method: "photograph", label: "Photograph" },
  { method: "other", label: "Other" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeAchievementMetrics(
  achievements: Achievement[],
  totalChildren: number,
): {
  total_achievements: number;
  children_with_achievements: number;
  achievement_coverage: number | null;
  exceptional_count: number;
  significant_count: number;
  notable_count: number;
  everyday_count: number;
  shared_with_family_rate: number | null;
  shared_with_sw_rate: number | null;
  added_to_life_story_rate: number | null;
  photograph_rate: number | null;
  child_views_rate: number | null;
  child_proud_rate: number | null;
  average_per_child: number | null;
  by_category: Record<string, number>;
  by_significance: Record<string, number>;
  by_celebration: Record<string, number>;
  by_child: Record<string, number>;
} {
  const uniqueChildren = new Set(achievements.map((a) => a.child_id)).size;
  const coverage =
    totalChildren > 0
      ? Math.round((uniqueChildren / totalChildren) * 1000) / 10
      : null;

  const exceptional = achievements.filter((a) => a.significance === "exceptional").length;
  const significant = achievements.filter((a) => a.significance === "significant").length;
  const notable = achievements.filter((a) => a.significance === "notable").length;
  const everyday = achievements.filter((a) => a.significance === "everyday").length;

  const sharedFamily = achievements.filter((a) => a.shared_with_family).length;
  const familyRate =
    achievements.length > 0
      ? Math.round((sharedFamily / achievements.length) * 1000) / 10
      : null;

  const sharedSW = achievements.filter((a) => a.shared_with_social_worker).length;
  const swRate =
    achievements.length > 0
      ? Math.round((sharedSW / achievements.length) * 1000) / 10
      : null;

  const lifeStory = achievements.filter((a) => a.added_to_life_story).length;
  const lifeStoryRate =
    achievements.length > 0
      ? Math.round((lifeStory / achievements.length) * 1000) / 10
      : null;

  const photograph = achievements.filter((a) => a.photograph_taken).length;
  const photoRate =
    achievements.length > 0
      ? Math.round((photograph / achievements.length) * 1000) / 10
      : null;

  const childViews = achievements.filter((a) => a.child_views !== null).length;
  const viewsRate =
    achievements.length > 0
      ? Math.round((childViews / achievements.length) * 1000) / 10
      : null;

  const childProud = achievements.filter((a) => a.child_proud).length;
  const proudRate =
    achievements.length > 0
      ? Math.round((childProud / achievements.length) * 1000) / 10
      : null;

  const avgPerChild =
    uniqueChildren > 0
      ? Math.round((achievements.length / uniqueChildren) * 10) / 10
      : null;

  const byCat: Record<string, number> = {};
  for (const a of achievements) byCat[a.category] = (byCat[a.category] ?? 0) + 1;

  const bySig: Record<string, number> = {};
  for (const a of achievements) bySig[a.significance] = (bySig[a.significance] ?? 0) + 1;

  const byCelebration: Record<string, number> = {};
  for (const a of achievements) {
    for (const c of a.celebrations) byCelebration[c] = (byCelebration[c] ?? 0) + 1;
  }

  const byChild: Record<string, number> = {};
  for (const a of achievements) byChild[a.child_name] = (byChild[a.child_name] ?? 0) + 1;

  return {
    total_achievements: achievements.length,
    children_with_achievements: uniqueChildren,
    achievement_coverage: coverage,
    exceptional_count: exceptional,
    significant_count: significant,
    notable_count: notable,
    everyday_count: everyday,
    shared_with_family_rate: familyRate,
    shared_with_sw_rate: swRate,
    added_to_life_story_rate: lifeStoryRate,
    photograph_rate: photoRate,
    child_views_rate: viewsRate,
    child_proud_rate: proudRate,
    average_per_child: avgPerChild,
    by_category: byCat,
    by_significance: bySig,
    by_celebration: byCelebration,
    by_child: byChild,
  };
}

export function identifyAchievementAlerts(
  achievements: Achievement[],
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

  // Children with no achievements recorded
  const childrenWithAchievements = new Set(achievements.map((a) => a.child_id));
  if (totalChildren > 0 && childrenWithAchievements.size < totalChildren) {
    const gap = totalChildren - childrenWithAchievements.size;
    alerts.push({
      type: "no_achievements",
      severity: "high",
      message: `${gap} ${gap === 1 ? "child has" : "children have"} no achievements recorded — every child has something to celebrate`,
      id: "achievement_gap",
    });
  }

  // Achievements not shared with family
  const notSharedFamily = achievements.filter((a) => !a.shared_with_family && a.significance !== "everyday").length;
  if (notSharedFamily >= 3) {
    alerts.push({
      type: "not_shared_family",
      severity: "medium",
      message: `${notSharedFamily} notable achievements not shared with families — sharing successes strengthens family relationships`,
      id: "family_sharing",
    });
  }

  // Achievements not added to life story
  const notLifeStory = achievements.filter(
    (a) => !a.added_to_life_story && (a.significance === "exceptional" || a.significance === "significant"),
  ).length;
  if (notLifeStory >= 2) {
    alerts.push({
      type: "not_in_life_story",
      severity: "medium",
      message: `${notLifeStory} significant achievements not added to life story work — important milestones should be captured`,
      id: "life_story_gap",
    });
  }

  // Low achievement recording for specific children
  const byChild: Record<string, number> = {};
  for (const a of achievements) byChild[a.child_name] = (byChild[a.child_name] ?? 0) + 1;
  for (const [name, count] of Object.entries(byChild)) {
    if (count === 1 && achievements.length > 5) {
      alerts.push({
        type: "low_recording",
        severity: "medium",
        message: `Only 1 achievement recorded for ${name} — look for and celebrate more successes`,
        id: `low_${name}`,
      });
    }
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listAchievements(
  homeId: string,
  filters?: {
    childId?: string;
    category?: AchievementCategory;
    significance?: AchievementSignificance;
    limit?: number;
  },
): Promise<ServiceResult<Achievement[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_achievements") as SB).select("*").eq("home_id", homeId);
  if (filters?.childId) q = q.eq("child_id", filters.childId);
  if (filters?.category) q = q.eq("category", filters.category);
  if (filters?.significance) q = q.eq("significance", filters.significance);
  q = q.order("achievement_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createAchievement(
  input: {
    homeId: string;
    childName: string;
    childId: string;
    achievementDate: string;
    category: AchievementCategory;
    title: string;
    description: string;
    significance: AchievementSignificance;
    celebrations: CelebrationMethod[];
    recordedBy: string;
    childViews?: string;
    childProud: boolean;
    sharedWithFamily: boolean;
    sharedWithSocialWorker: boolean;
    addedToLifeStory: boolean;
    photographTaken: boolean;
    notes?: string;
  },
): Promise<ServiceResult<Achievement>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_achievements") as SB)
    .insert({
      home_id: input.homeId,
      child_name: input.childName,
      child_id: input.childId,
      achievement_date: input.achievementDate,
      category: input.category,
      title: input.title,
      description: input.description,
      significance: input.significance,
      celebrations: input.celebrations,
      recorded_by: input.recordedBy,
      child_views: input.childViews ?? null,
      child_proud: input.childProud,
      shared_with_family: input.sharedWithFamily,
      shared_with_social_worker: input.sharedWithSocialWorker,
      added_to_life_story: input.addedToLifeStory,
      photograph_taken: input.photographTaken,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateAchievement(
  id: string,
  updates: Partial<Record<string, unknown>>,
): Promise<ServiceResult<Achievement>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_achievements") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeAchievementMetrics,
  identifyAchievementAlerts,
};
