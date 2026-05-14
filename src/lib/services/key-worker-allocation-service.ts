// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — KEY WORKER ALLOCATION SERVICE
// Tracks key worker assignments, relationship quality, workload
// balance, and continuity of trusted adult relationships.
// CHR 2015 Reg 21 (privacy and dignity — trusted relationships),
// Reg 31 (workforce planning — appropriate allocation).
//
// Covers: allocation status, relationship quality, workload level,
// continuity rating, and key worker-child match.
//
// SCCIF: Experiences — "Children have a trusted key adult."
// "Key worker relationships are stable and meaningful."
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

export type AllocationStatus =
  | "active"
  | "temporary_cover"
  | "pending_allocation"
  | "recently_changed"
  | "under_review"
  | "on_leave_cover"
  | "supervision_only"
  | "dual_key_worker"
  | "unallocated"
  | "other";

export type KeyWorkerRelationship =
  | "excellent"
  | "good"
  | "developing"
  | "strained"
  | "broken_down";

export type WorkloadLevel =
  | "under_capacity"
  | "balanced"
  | "manageable"
  | "heavy"
  | "overloaded";

export type ContinuityRating =
  | "very_stable"
  | "stable"
  | "some_changes"
  | "frequent_changes"
  | "no_continuity";

export interface KeyWorkerAllocationRecord {
  id: string;
  home_id: string;
  allocation_status: AllocationStatus;
  relationship_quality: KeyWorkerRelationship;
  workload_level: WorkloadLevel;
  continuity_rating: ContinuityRating;
  review_date: string;
  child_name: string;
  child_id: string | null;
  key_worker_name: string;
  reviewed_by: string;
  child_views_sought: boolean;
  child_choice_considered: boolean;
  regular_sessions_held: boolean;
  care_plan_involvement: boolean;
  advocacy_role_fulfilled: boolean;
  training_appropriate: boolean;
  supervision_discussed: boolean;
  handover_plan_exists: boolean;
  backup_worker_identified: boolean;
  social_worker_informed: boolean;
  relationship_supported: boolean;
  recorded_promptly: boolean;
  issues_found: string[];
  actions_taken: string[];
  next_review_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const ALLOCATION_STATUSES: { status: AllocationStatus; label: string }[] = [
  { status: "active", label: "Active" },
  { status: "temporary_cover", label: "Temporary Cover" },
  { status: "pending_allocation", label: "Pending Allocation" },
  { status: "recently_changed", label: "Recently Changed" },
  { status: "under_review", label: "Under Review" },
  { status: "on_leave_cover", label: "On Leave Cover" },
  { status: "supervision_only", label: "Supervision Only" },
  { status: "dual_key_worker", label: "Dual Key Worker" },
  { status: "unallocated", label: "Unallocated" },
  { status: "other", label: "Other" },
];

export const KEY_WORKER_RELATIONSHIPS: { quality: KeyWorkerRelationship; label: string }[] = [
  { quality: "excellent", label: "Excellent" },
  { quality: "good", label: "Good" },
  { quality: "developing", label: "Developing" },
  { quality: "strained", label: "Strained" },
  { quality: "broken_down", label: "Broken Down" },
];

export const WORKLOAD_LEVELS: { level: WorkloadLevel; label: string }[] = [
  { level: "under_capacity", label: "Under Capacity" },
  { level: "balanced", label: "Balanced" },
  { level: "manageable", label: "Manageable" },
  { level: "heavy", label: "Heavy" },
  { level: "overloaded", label: "Overloaded" },
];

export const CONTINUITY_RATINGS: { rating: ContinuityRating; label: string }[] = [
  { rating: "very_stable", label: "Very Stable" },
  { rating: "stable", label: "Stable" },
  { rating: "some_changes", label: "Some Changes" },
  { rating: "frequent_changes", label: "Frequent Changes" },
  { rating: "no_continuity", label: "No Continuity" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeKeyWorkerAllocationMetrics(
  records: KeyWorkerAllocationRecord[],
): {
  total_allocations: number;
  unallocated_count: number;
  broken_down_count: number;
  overloaded_count: number;
  no_continuity_count: number;
  child_views_rate: number;
  child_choice_rate: number;
  regular_sessions_rate: number;
  care_plan_rate: number;
  advocacy_rate: number;
  training_rate: number;
  supervision_rate: number;
  handover_rate: number;
  backup_worker_rate: number;
  social_worker_rate: number;
  relationship_supported_rate: number;
  recorded_promptly_rate: number;
  unique_children: number;
  by_allocation_status: Record<string, number>;
  by_relationship_quality: Record<string, number>;
  by_workload_level: Record<string, number>;
  by_continuity_rating: Record<string, number>;
} {
  const unallocated = records.filter((r) => r.allocation_status === "unallocated").length;
  const brokenDown = records.filter((r) => r.relationship_quality === "broken_down").length;
  const overloaded = records.filter((r) => r.workload_level === "overloaded").length;
  const noContinuity = records.filter((r) => r.continuity_rating === "no_continuity").length;

  const boolRate = (field: keyof KeyWorkerAllocationRecord) => {
    const count = records.filter((r) => r[field] === true).length;
    return records.length > 0
      ? Math.round((count / records.length) * 1000) / 10
      : 0;
  };

  const byStatus: Record<string, number> = {};
  for (const r of records) byStatus[r.allocation_status] = (byStatus[r.allocation_status] ?? 0) + 1;

  const byQuality: Record<string, number> = {};
  for (const r of records) byQuality[r.relationship_quality] = (byQuality[r.relationship_quality] ?? 0) + 1;

  const byWorkload: Record<string, number> = {};
  for (const r of records) byWorkload[r.workload_level] = (byWorkload[r.workload_level] ?? 0) + 1;

  const byContinuity: Record<string, number> = {};
  for (const r of records) byContinuity[r.continuity_rating] = (byContinuity[r.continuity_rating] ?? 0) + 1;

  return {
    total_allocations: records.length,
    unallocated_count: unallocated,
    broken_down_count: brokenDown,
    overloaded_count: overloaded,
    no_continuity_count: noContinuity,
    child_views_rate: boolRate("child_views_sought"),
    child_choice_rate: boolRate("child_choice_considered"),
    regular_sessions_rate: boolRate("regular_sessions_held"),
    care_plan_rate: boolRate("care_plan_involvement"),
    advocacy_rate: boolRate("advocacy_role_fulfilled"),
    training_rate: boolRate("training_appropriate"),
    supervision_rate: boolRate("supervision_discussed"),
    handover_rate: boolRate("handover_plan_exists"),
    backup_worker_rate: boolRate("backup_worker_identified"),
    social_worker_rate: boolRate("social_worker_informed"),
    relationship_supported_rate: boolRate("relationship_supported"),
    recorded_promptly_rate: boolRate("recorded_promptly"),
    unique_children: new Set(records.map((r) => r.child_name)).size,
    by_allocation_status: byStatus,
    by_relationship_quality: byQuality,
    by_workload_level: byWorkload,
    by_continuity_rating: byContinuity,
  };
}

export function identifyKeyWorkerAllocationAlerts(
  records: KeyWorkerAllocationRecord[],
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

  // Unallocated with broken down relationship — per-record
  for (const r of records) {
    if (r.allocation_status === "unallocated" && r.relationship_quality === "broken_down") {
      alerts.push({
        type: "unallocated_broken_down",
        severity: "critical",
        message: `${r.child_name} is unallocated with broken down key worker relationship — urgently assign trusted adult`,
        id: r.id,
      });
    }
  }

  // Unallocated children
  const unalloc = records.filter((r) => r.allocation_status === "unallocated").length;
  if (unalloc >= 1) {
    alerts.push({
      type: "children_unallocated",
      severity: "high",
      message: `${unalloc} ${unalloc === 1 ? "child is" : "children are"} without key worker allocation — assign immediately`,
      id: "children_unallocated",
    });
  }

  // No regular sessions
  const noSessions = records.filter((r) => !r.regular_sessions_held).length;
  if (noSessions >= 1) {
    alerts.push({
      type: "no_regular_sessions",
      severity: "high",
      message: `${noSessions} ${noSessions === 1 ? "allocation has" : "allocations have"} no regular sessions — ensure consistent contact`,
      id: "no_regular_sessions",
    });
  }

  // No backup worker
  const noBackup = records.filter((r) => !r.backup_worker_identified).length;
  if (noBackup >= 2) {
    alerts.push({
      type: "no_backup_worker",
      severity: "medium",
      message: `${noBackup} allocations without backup worker identified — ensure continuity planning`,
      id: "no_backup_worker",
    });
  }

  // Handover plan missing
  const noHandover = records.filter((r) => !r.handover_plan_exists).length;
  if (noHandover >= 2) {
    alerts.push({
      type: "no_handover_plan",
      severity: "medium",
      message: `${noHandover} allocations without handover plan — prepare transition arrangements`,
      id: "no_handover_plan",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    allocationStatus?: AllocationStatus;
    relationshipQuality?: KeyWorkerRelationship;
    workloadLevel?: WorkloadLevel;
    continuityRating?: ContinuityRating;
    limit?: number;
  },
): Promise<ServiceResult<KeyWorkerAllocationRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_key_worker_allocation") as SB).select("*").eq("home_id", homeId);
  if (filters?.allocationStatus) q = q.eq("allocation_status", filters.allocationStatus);
  if (filters?.relationshipQuality) q = q.eq("relationship_quality", filters.relationshipQuality);
  if (filters?.workloadLevel) q = q.eq("workload_level", filters.workloadLevel);
  if (filters?.continuityRating) q = q.eq("continuity_rating", filters.continuityRating);
  q = q.order("review_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  payload: {
    homeId: string;
    allocationStatus: AllocationStatus;
    relationshipQuality: KeyWorkerRelationship;
    workloadLevel: WorkloadLevel;
    continuityRating: ContinuityRating;
    reviewDate: string;
    childName: string;
    childId?: string | null;
    keyWorkerName: string;
    reviewedBy: string;
    childViewsSought?: boolean;
    childChoiceConsidered?: boolean;
    regularSessionsHeld?: boolean;
    carePlanInvolvement?: boolean;
    advocacyRoleFulfilled?: boolean;
    trainingAppropriate?: boolean;
    supervisionDiscussed?: boolean;
    handoverPlanExists?: boolean;
    backupWorkerIdentified?: boolean;
    socialWorkerInformed?: boolean;
    relationshipSupported?: boolean;
    recordedPromptly?: boolean;
    issuesFound?: string[];
    actionsTaken?: string[];
    nextReviewDate?: string | null;
    notes?: string | null;
  },
): Promise<ServiceResult<KeyWorkerAllocationRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_key_worker_allocation") as SB)
    .insert({
      home_id: payload.homeId,
      allocation_status: payload.allocationStatus,
      relationship_quality: payload.relationshipQuality,
      workload_level: payload.workloadLevel,
      continuity_rating: payload.continuityRating,
      review_date: payload.reviewDate,
      child_name: payload.childName,
      child_id: payload.childId ?? null,
      key_worker_name: payload.keyWorkerName,
      reviewed_by: payload.reviewedBy,
      child_views_sought: payload.childViewsSought ?? true,
      child_choice_considered: payload.childChoiceConsidered ?? true,
      regular_sessions_held: payload.regularSessionsHeld ?? true,
      care_plan_involvement: payload.carePlanInvolvement ?? true,
      advocacy_role_fulfilled: payload.advocacyRoleFulfilled ?? true,
      training_appropriate: payload.trainingAppropriate ?? true,
      supervision_discussed: payload.supervisionDiscussed ?? true,
      handover_plan_exists: payload.handoverPlanExists ?? true,
      backup_worker_identified: payload.backupWorkerIdentified ?? true,
      social_worker_informed: payload.socialWorkerInformed ?? true,
      relationship_supported: payload.relationshipSupported ?? true,
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
    allocationStatus: AllocationStatus;
    relationshipQuality: KeyWorkerRelationship;
    workloadLevel: WorkloadLevel;
    continuityRating: ContinuityRating;
    reviewDate: string;
    childName: string;
    childId: string | null;
    keyWorkerName: string;
    reviewedBy: string;
    childViewsSought: boolean;
    childChoiceConsidered: boolean;
    regularSessionsHeld: boolean;
    carePlanInvolvement: boolean;
    advocacyRoleFulfilled: boolean;
    trainingAppropriate: boolean;
    supervisionDiscussed: boolean;
    handoverPlanExists: boolean;
    backupWorkerIdentified: boolean;
    socialWorkerInformed: boolean;
    relationshipSupported: boolean;
    recordedPromptly: boolean;
    issuesFound: string[];
    actionsTaken: string[];
    nextReviewDate: string | null;
    notes: string | null;
  }>,
): Promise<ServiceResult<KeyWorkerAllocationRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.allocationStatus !== undefined) mapped.allocation_status = updates.allocationStatus;
  if (updates.relationshipQuality !== undefined) mapped.relationship_quality = updates.relationshipQuality;
  if (updates.workloadLevel !== undefined) mapped.workload_level = updates.workloadLevel;
  if (updates.continuityRating !== undefined) mapped.continuity_rating = updates.continuityRating;
  if (updates.reviewDate !== undefined) mapped.review_date = updates.reviewDate;
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.childId !== undefined) mapped.child_id = updates.childId;
  if (updates.keyWorkerName !== undefined) mapped.key_worker_name = updates.keyWorkerName;
  if (updates.reviewedBy !== undefined) mapped.reviewed_by = updates.reviewedBy;
  if (updates.childViewsSought !== undefined) mapped.child_views_sought = updates.childViewsSought;
  if (updates.childChoiceConsidered !== undefined) mapped.child_choice_considered = updates.childChoiceConsidered;
  if (updates.regularSessionsHeld !== undefined) mapped.regular_sessions_held = updates.regularSessionsHeld;
  if (updates.carePlanInvolvement !== undefined) mapped.care_plan_involvement = updates.carePlanInvolvement;
  if (updates.advocacyRoleFulfilled !== undefined) mapped.advocacy_role_fulfilled = updates.advocacyRoleFulfilled;
  if (updates.trainingAppropriate !== undefined) mapped.training_appropriate = updates.trainingAppropriate;
  if (updates.supervisionDiscussed !== undefined) mapped.supervision_discussed = updates.supervisionDiscussed;
  if (updates.handoverPlanExists !== undefined) mapped.handover_plan_exists = updates.handoverPlanExists;
  if (updates.backupWorkerIdentified !== undefined) mapped.backup_worker_identified = updates.backupWorkerIdentified;
  if (updates.socialWorkerInformed !== undefined) mapped.social_worker_informed = updates.socialWorkerInformed;
  if (updates.relationshipSupported !== undefined) mapped.relationship_supported = updates.relationshipSupported;
  if (updates.recordedPromptly !== undefined) mapped.recorded_promptly = updates.recordedPromptly;
  if (updates.issuesFound !== undefined) mapped.issues_found = updates.issuesFound;
  if (updates.actionsTaken !== undefined) mapped.actions_taken = updates.actionsTaken;
  if (updates.nextReviewDate !== undefined) mapped.next_review_date = updates.nextReviewDate;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  const { data, error } = await (s.from("cs_key_worker_allocation") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeKeyWorkerAllocationMetrics,
  identifyKeyWorkerAllocationAlerts,
};
