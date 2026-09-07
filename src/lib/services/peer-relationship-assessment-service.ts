// ══════════════════════════════════════════════════════════════════════════════
// CARA — PEER RELATIONSHIP ASSESSMENT SERVICE
// Assesses quality of peer relationships, friendship patterns,
// social skills development, and conflict resolution abilities.
// CHR 2015 Reg 7 (individual child — social development),
// Reg 9 (quality of care — nurturing relationships).
//
// Covers: relationship quality, social skill level, conflict style,
// friendship stability, and group dynamics.
//
// SCCIF: Experiences — "Children develop positive peer relationships."
// "Social skills are supported and friendships encouraged."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type RelationshipQuality =
  | "excellent"
  | "good"
  | "developing"
  | "poor"
  | "concerning";

export type SocialSkillLevel =
  | "advanced"
  | "age_appropriate"
  | "developing"
  | "below_expected"
  | "not_assessed";

export type ConflictStyle =
  | "collaborative"
  | "compromising"
  | "avoidant"
  | "aggressive"
  | "passive"
  | "assertive"
  | "manipulative"
  | "withdrawn"
  | "escalating"
  | "other";

export type FriendshipStability =
  | "very_stable"
  | "stable"
  | "fluctuating"
  | "unstable"
  | "no_friendships";

export interface PeerRelationshipAssessmentRecord {
  id: string;
  home_id: string;
  relationship_quality: RelationshipQuality;
  social_skill_level: SocialSkillLevel;
  conflict_style: ConflictStyle;
  friendship_stability: FriendshipStability;
  assessment_date: string;
  child_name: string;
  child_id: string | null;
  assessed_by: string;
  child_views_sought: boolean;
  positive_interactions_observed: boolean;
  bullying_screened: boolean;
  social_skills_supported: boolean;
  group_activities_encouraged: boolean;
  conflict_resolution_taught: boolean;
  peer_mentoring_available: boolean;
  care_plan_reflects: boolean;
  social_worker_informed: boolean;
  parent_informed: boolean;
  school_liaison: boolean;
  recorded_promptly: boolean;
  issues_found: string[];
  actions_taken: string[];
  next_review_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const RELATIONSHIP_QUALITIES: { quality: RelationshipQuality; label: string }[] = [
  { quality: "excellent", label: "Excellent" },
  { quality: "good", label: "Good" },
  { quality: "developing", label: "Developing" },
  { quality: "poor", label: "Poor" },
  { quality: "concerning", label: "Concerning" },
];

export const SOCIAL_SKILL_LEVELS: { level: SocialSkillLevel; label: string }[] = [
  { level: "advanced", label: "Advanced" },
  { level: "age_appropriate", label: "Age Appropriate" },
  { level: "developing", label: "Developing" },
  { level: "below_expected", label: "Below Expected" },
  { level: "not_assessed", label: "Not Assessed" },
];

export const CONFLICT_STYLES: { style: ConflictStyle; label: string }[] = [
  { style: "collaborative", label: "Collaborative" },
  { style: "compromising", label: "Compromising" },
  { style: "avoidant", label: "Avoidant" },
  { style: "aggressive", label: "Aggressive" },
  { style: "passive", label: "Passive" },
  { style: "assertive", label: "Assertive" },
  { style: "manipulative", label: "Manipulative" },
  { style: "withdrawn", label: "Withdrawn" },
  { style: "escalating", label: "Escalating" },
  { style: "other", label: "Other" },
];

export const FRIENDSHIP_STABILITIES: { stability: FriendshipStability; label: string }[] = [
  { stability: "very_stable", label: "Very Stable" },
  { stability: "stable", label: "Stable" },
  { stability: "fluctuating", label: "Fluctuating" },
  { stability: "unstable", label: "Unstable" },
  { stability: "no_friendships", label: "No Friendships" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computePeerRelationshipMetrics(
  records: PeerRelationshipAssessmentRecord[],
): {
  total_assessments: number;
  poor_quality_count: number;
  concerning_quality_count: number;
  no_friendships_count: number;
  aggressive_conflict_count: number;
  child_views_rate: number | null;
  positive_interactions_rate: number | null;
  bullying_screened_rate: number | null;
  social_skills_rate: number | null;
  group_activities_rate: number | null;
  conflict_resolution_rate: number | null;
  peer_mentoring_rate: number | null;
  care_plan_reflects_rate: number | null;
  social_worker_rate: number | null;
  parent_informed_rate: number | null;
  school_liaison_rate: number | null;
  recorded_promptly_rate: number | null;
  unique_children: number;
  by_relationship_quality: Record<string, number>;
  by_social_skill_level: Record<string, number>;
  by_conflict_style: Record<string, number>;
  by_friendship_stability: Record<string, number>;
} {
  const poorQuality = records.filter((r) => r.relationship_quality === "poor").length;
  const concerningQuality = records.filter((r) => r.relationship_quality === "concerning").length;
  const noFriendships = records.filter((r) => r.friendship_stability === "no_friendships").length;
  const aggressiveConflict = records.filter((r) => r.conflict_style === "aggressive").length;

  // Rated over the records where the question was answered either way. With the
  // judgement columns tri-state (null = not recorded), an unrecorded answer in
  // the denominator would score silence as a "no" — the same fabrication the
  // old `?? true` creates made in the other direction. While every field is
  // still a strict boolean this is behaviour-identical.
  const boolRate = (field: keyof PeerRelationshipAssessmentRecord) => {
    const recorded = records.filter((r) => r[field] !== null && r[field] !== undefined);
    const count = recorded.filter((r) => r[field] === true).length;
    return recorded.length > 0
      ? Math.round((count / recorded.length) * 1000) / 10
      : null;
  };

  const uniqueChildren = new Set(records.map((r) => r.child_name)).size;

  const byQuality: Record<string, number> = {};
  for (const r of records) byQuality[r.relationship_quality] = (byQuality[r.relationship_quality] ?? 0) + 1;

  const bySkill: Record<string, number> = {};
  for (const r of records) bySkill[r.social_skill_level] = (bySkill[r.social_skill_level] ?? 0) + 1;

  const byConflict: Record<string, number> = {};
  for (const r of records) byConflict[r.conflict_style] = (byConflict[r.conflict_style] ?? 0) + 1;

  const byStability: Record<string, number> = {};
  for (const r of records) byStability[r.friendship_stability] = (byStability[r.friendship_stability] ?? 0) + 1;

  return {
    total_assessments: records.length,
    poor_quality_count: poorQuality,
    concerning_quality_count: concerningQuality,
    no_friendships_count: noFriendships,
    aggressive_conflict_count: aggressiveConflict,
    child_views_rate: boolRate("child_views_sought"),
    positive_interactions_rate: boolRate("positive_interactions_observed"),
    bullying_screened_rate: boolRate("bullying_screened"),
    social_skills_rate: boolRate("social_skills_supported"),
    group_activities_rate: boolRate("group_activities_encouraged"),
    conflict_resolution_rate: boolRate("conflict_resolution_taught"),
    peer_mentoring_rate: boolRate("peer_mentoring_available"),
    care_plan_reflects_rate: boolRate("care_plan_reflects"),
    social_worker_rate: boolRate("social_worker_informed"),
    parent_informed_rate: boolRate("parent_informed"),
    school_liaison_rate: boolRate("school_liaison"),
    recorded_promptly_rate: boolRate("recorded_promptly"),
    unique_children: uniqueChildren,
    by_relationship_quality: byQuality,
    by_social_skill_level: bySkill,
    by_conflict_style: byConflict,
    by_friendship_stability: byStability,
  };
}

export function identifyPeerRelationshipAlerts(
  records: PeerRelationshipAssessmentRecord[],
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

  // Concerning quality with no bullying screening
  for (const r of records) {
    if (r.relationship_quality === "concerning" && !r.bullying_screened) {
      alerts.push({
        type: "concerning_no_bullying_screen",
        severity: "critical",
        message: `${r.child_name} has concerning peer relationships without bullying screening — investigate immediately`,
        id: r.id,
      });
    }
  }

  // No friendships
  const noFriends = records.filter((r) => r.friendship_stability === "no_friendships").length;
  if (noFriends >= 1) {
    alerts.push({
      type: "no_friendships",
      severity: "high",
      message: `${noFriends} ${noFriends === 1 ? "assessment shows" : "assessments show"} child with no friendships — prioritise social support`,
      id: "no_friendships",
    });
  }

  // Social skills not supported
  const noSkills = records.filter((r) => !r.social_skills_supported).length;
  if (noSkills >= 1) {
    alerts.push({
      type: "social_skills_not_supported",
      severity: "high",
      message: `${noSkills} ${noSkills === 1 ? "assessment has" : "assessments have"} social skills not supported — review developmental plans`,
      id: "social_skills_not_supported",
    });
  }

  // Conflict resolution not taught
  const noConflict = records.filter((r) => !r.conflict_resolution_taught).length;
  if (noConflict >= 2) {
    alerts.push({
      type: "conflict_resolution_not_taught",
      severity: "medium",
      message: `${noConflict} assessments without conflict resolution teaching — strengthen social skills programme`,
      id: "conflict_resolution_not_taught",
    });
  }

  // Group activities not encouraged
  const noGroup = records.filter((r) => !r.group_activities_encouraged).length;
  if (noGroup >= 2) {
    alerts.push({
      type: "group_activities_not_encouraged",
      severity: "medium",
      message: `${noGroup} assessments without group activities encouraged — review activity planning`,
      id: "group_activities_not_encouraged",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    relationshipQuality?: RelationshipQuality;
    socialSkillLevel?: SocialSkillLevel;
    conflictStyle?: ConflictStyle;
    friendshipStability?: FriendshipStability;
    limit?: number;
  },
): Promise<ServiceResult<PeerRelationshipAssessmentRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_peer_relationship_assessment") as SB).select("*").eq("home_id", homeId);
  if (filters?.relationshipQuality) q = q.eq("relationship_quality", filters.relationshipQuality);
  if (filters?.socialSkillLevel) q = q.eq("social_skill_level", filters.socialSkillLevel);
  if (filters?.conflictStyle) q = q.eq("conflict_style", filters.conflictStyle);
  if (filters?.friendshipStability) q = q.eq("friendship_stability", filters.friendshipStability);
  q = q.order("assessment_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  payload: {
    homeId: string;
    relationshipQuality: RelationshipQuality;
    socialSkillLevel: SocialSkillLevel;
    conflictStyle: ConflictStyle;
    friendshipStability: FriendshipStability;
    assessmentDate: string;
    childName: string;
    childId?: string | null;
    assessedBy: string;
    childViewsSought?: boolean;
    positiveInteractionsObserved?: boolean;
    bullyingScreened?: boolean;
    socialSkillsSupported?: boolean;
    groupActivitiesEncouraged?: boolean;
    conflictResolutionTaught?: boolean;
    peerMentoringAvailable?: boolean;
    carePlanReflects?: boolean;
    socialWorkerInformed?: boolean;
    parentInformed?: boolean;
    schoolLiaison?: boolean;
    recordedPromptly?: boolean;
    issuesFound?: string[];
    actionsTaken?: string[];
    nextReviewDate?: string | null;
    notes?: string | null;
  },
): Promise<ServiceResult<PeerRelationshipAssessmentRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_peer_relationship_assessment") as SB)
    .insert({
      home_id: payload.homeId,
      relationship_quality: payload.relationshipQuality,
      social_skill_level: payload.socialSkillLevel,
      conflict_style: payload.conflictStyle,
      friendship_stability: payload.friendshipStability,
      assessment_date: payload.assessmentDate,
      child_name: payload.childName,
      child_id: payload.childId ?? null,
      assessed_by: payload.assessedBy,
      child_views_sought: payload.childViewsSought ?? true,
      positive_interactions_observed: payload.positiveInteractionsObserved ?? true,
      bullying_screened: payload.bullyingScreened ?? true,
      social_skills_supported: payload.socialSkillsSupported ?? true,
      group_activities_encouraged: payload.groupActivitiesEncouraged ?? true,
      conflict_resolution_taught: payload.conflictResolutionTaught ?? true,
      peer_mentoring_available: payload.peerMentoringAvailable ?? false,
      care_plan_reflects: payload.carePlanReflects ?? true,
      social_worker_informed: payload.socialWorkerInformed ?? true,
      parent_informed: payload.parentInformed ?? false,
      school_liaison: payload.schoolLiaison ?? true,
      recorded_promptly: payload.recordedPromptly ?? true,
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
    relationshipQuality: RelationshipQuality;
    socialSkillLevel: SocialSkillLevel;
    conflictStyle: ConflictStyle;
    friendshipStability: FriendshipStability;
    assessmentDate: string;
    childName: string;
    childId: string | null;
    assessedBy: string;
    childViewsSought: boolean;
    positiveInteractionsObserved: boolean;
    bullyingScreened: boolean;
    socialSkillsSupported: boolean;
    groupActivitiesEncouraged: boolean;
    conflictResolutionTaught: boolean;
    peerMentoringAvailable: boolean;
    carePlanReflects: boolean;
    socialWorkerInformed: boolean;
    parentInformed: boolean;
    schoolLiaison: boolean;
    recordedPromptly: boolean;
    issuesFound: string[];
    actionsTaken: string[];
    nextReviewDate: string | null;
    notes: string | null;
  }>,
): Promise<ServiceResult<PeerRelationshipAssessmentRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.relationshipQuality !== undefined) mapped.relationship_quality = updates.relationshipQuality;
  if (updates.socialSkillLevel !== undefined) mapped.social_skill_level = updates.socialSkillLevel;
  if (updates.conflictStyle !== undefined) mapped.conflict_style = updates.conflictStyle;
  if (updates.friendshipStability !== undefined) mapped.friendship_stability = updates.friendshipStability;
  if (updates.assessmentDate !== undefined) mapped.assessment_date = updates.assessmentDate;
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.childId !== undefined) mapped.child_id = updates.childId;
  if (updates.assessedBy !== undefined) mapped.assessed_by = updates.assessedBy;
  if (updates.childViewsSought !== undefined) mapped.child_views_sought = updates.childViewsSought;
  if (updates.positiveInteractionsObserved !== undefined) mapped.positive_interactions_observed = updates.positiveInteractionsObserved;
  if (updates.bullyingScreened !== undefined) mapped.bullying_screened = updates.bullyingScreened;
  if (updates.socialSkillsSupported !== undefined) mapped.social_skills_supported = updates.socialSkillsSupported;
  if (updates.groupActivitiesEncouraged !== undefined) mapped.group_activities_encouraged = updates.groupActivitiesEncouraged;
  if (updates.conflictResolutionTaught !== undefined) mapped.conflict_resolution_taught = updates.conflictResolutionTaught;
  if (updates.peerMentoringAvailable !== undefined) mapped.peer_mentoring_available = updates.peerMentoringAvailable;
  if (updates.carePlanReflects !== undefined) mapped.care_plan_reflects = updates.carePlanReflects;
  if (updates.socialWorkerInformed !== undefined) mapped.social_worker_informed = updates.socialWorkerInformed;
  if (updates.parentInformed !== undefined) mapped.parent_informed = updates.parentInformed;
  if (updates.schoolLiaison !== undefined) mapped.school_liaison = updates.schoolLiaison;
  if (updates.recordedPromptly !== undefined) mapped.recorded_promptly = updates.recordedPromptly;
  if (updates.issuesFound !== undefined) mapped.issues_found = updates.issuesFound;
  if (updates.actionsTaken !== undefined) mapped.actions_taken = updates.actionsTaken;
  if (updates.nextReviewDate !== undefined) mapped.next_review_date = updates.nextReviewDate;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  const { data, error } = await (s.from("cs_peer_relationship_assessment") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computePeerRelationshipMetrics,
  identifyPeerRelationshipAlerts,
};
