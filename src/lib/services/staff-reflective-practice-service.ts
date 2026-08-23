// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF REFLECTIVE PRACTICE SERVICE
// Tracks reflective practice sessions where staff reflect on their
// practice, learning, and professional development through structured
// reflection models (Gibbs, Kolb, Driscoll).
// CHR 2015 Reg 33 (employment practices — reflective practice),
// Reg 32 (fitness of workers — ongoing development),
// Reg 22 (supervision — reflective supervision).
//
// Covers: individual reflection, group reflection, critical incident
// reflection, supervision reflections, peer reflection, and
// reflective journals.
//
// SCCIF: Leadership — "Staff engage in reflective practice."
// "Reflection leads to improved outcomes for children."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type ReflectionType =
  | "individual_reflection"
  | "group_reflection"
  | "critical_incident"
  | "supervision_reflection"
  | "peer_reflection"
  | "reflective_journal"
  | "action_learning"
  | "case_study_reflection"
  | "training_reflection"
  | "other";

export type ReflectionModel =
  | "gibbs"
  | "kolb"
  | "driscoll"
  | "johns"
  | "schon"
  | "brookfield"
  | "rolfe"
  | "informal"
  | "structured_template"
  | "other";

export type ReflectionOutcome =
  | "practice_improved"
  | "learning_identified"
  | "action_planned"
  | "no_change_needed"
  | "further_support_needed";

export type ReflectionDepth =
  | "surface"
  | "moderate"
  | "deep"
  | "transformative"
  | "not_assessed";

export interface StaffReflectivePracticeRecord {
  id: string;
  home_id: string;
  reflection_type: ReflectionType;
  reflection_model: ReflectionModel;
  reflection_outcome: ReflectionOutcome;
  reflection_depth: ReflectionDepth;
  reflection_date: string;
  staff_name: string;
  facilitator_name: string;
  child_focused: boolean;
  values_explored: boolean;
  emotions_acknowledged: boolean;
  learning_identified: boolean;
  action_plan_created: boolean;
  practice_changed: boolean;
  shared_with_team: boolean;
  linked_to_supervision: boolean;
  linked_to_training: boolean;
  evidence_documented: boolean;
  manager_reviewed: boolean;
  child_impact_considered: boolean;
  ethical_considerations: boolean;
  issues_found: string[];
  actions_taken: string[];
  session_duration_minutes: number;
  next_reflection_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const REFLECTION_TYPES: { type: ReflectionType; label: string }[] = [
  { type: "individual_reflection", label: "Individual Reflection" },
  { type: "group_reflection", label: "Group Reflection" },
  { type: "critical_incident", label: "Critical Incident" },
  { type: "supervision_reflection", label: "Supervision Reflection" },
  { type: "peer_reflection", label: "Peer Reflection" },
  { type: "reflective_journal", label: "Reflective Journal" },
  { type: "action_learning", label: "Action Learning" },
  { type: "case_study_reflection", label: "Case Study Reflection" },
  { type: "training_reflection", label: "Training Reflection" },
  { type: "other", label: "Other" },
];

export const REFLECTION_MODELS: { model: ReflectionModel; label: string }[] = [
  { model: "gibbs", label: "Gibbs" },
  { model: "kolb", label: "Kolb" },
  { model: "driscoll", label: "Driscoll" },
  { model: "johns", label: "Johns" },
  { model: "schon", label: "Schön" },
  { model: "brookfield", label: "Brookfield" },
  { model: "rolfe", label: "Rolfe" },
  { model: "informal", label: "Informal" },
  { model: "structured_template", label: "Structured Template" },
  { model: "other", label: "Other" },
];

export const REFLECTION_OUTCOMES: { outcome: ReflectionOutcome; label: string }[] = [
  { outcome: "practice_improved", label: "Practice Improved" },
  { outcome: "learning_identified", label: "Learning Identified" },
  { outcome: "action_planned", label: "Action Planned" },
  { outcome: "no_change_needed", label: "No Change Needed" },
  { outcome: "further_support_needed", label: "Further Support Needed" },
];

export const REFLECTION_DEPTHS: { depth: ReflectionDepth; label: string }[] = [
  { depth: "surface", label: "Surface" },
  { depth: "moderate", label: "Moderate" },
  { depth: "deep", label: "Deep" },
  { depth: "transformative", label: "Transformative" },
  { depth: "not_assessed", label: "Not Assessed" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeStaffReflectiveMetrics(
  records: StaffReflectivePracticeRecord[],
): {
  total_reflections: number;
  practice_improved_count: number;
  further_support_count: number;
  deep_count: number;
  surface_count: number;
  child_focused_rate: number | null;
  values_explored_rate: number | null;
  emotions_acknowledged_rate: number | null;
  learning_identified_rate: number | null;
  action_plan_created_rate: number | null;
  practice_changed_rate: number | null;
  shared_with_team_rate: number | null;
  linked_to_supervision_rate: number | null;
  linked_to_training_rate: number | null;
  evidence_documented_rate: number | null;
  manager_reviewed_rate: number | null;
  child_impact_rate: number | null;
  average_duration: number | null;
  unique_staff: number;
  by_reflection_type: Record<string, number>;
  by_reflection_model: Record<string, number>;
  by_reflection_outcome: Record<string, number>;
  by_reflection_depth: Record<string, number>;
} {
  const practiceImproved = records.filter((r) => r.reflection_outcome === "practice_improved").length;
  const furtherSupport = records.filter((r) => r.reflection_outcome === "further_support_needed").length;
  const deep = records.filter((r) => r.reflection_depth === "deep" || r.reflection_depth === "transformative").length;
  const surface = records.filter((r) => r.reflection_depth === "surface").length;

  const boolRate = (field: keyof StaffReflectivePracticeRecord) => {
    const count = records.filter((r) => r[field] === true).length;
    return records.length > 0
      ? Math.round((count / records.length) * 1000) / 10
      : null;
  };

  const avgDuration = records.length > 0
    ? Math.round((records.reduce((sum, r) => sum + r.session_duration_minutes, 0) / records.length) * 10) / 10
    : null;

  const uniqueStaff = new Set(records.map((r) => r.staff_name)).size;

  const byType: Record<string, number> = {};
  for (const r of records) byType[r.reflection_type] = (byType[r.reflection_type] ?? 0) + 1;

  const byModel: Record<string, number> = {};
  for (const r of records) byModel[r.reflection_model] = (byModel[r.reflection_model] ?? 0) + 1;

  const byOutcome: Record<string, number> = {};
  for (const r of records) byOutcome[r.reflection_outcome] = (byOutcome[r.reflection_outcome] ?? 0) + 1;

  const byDepth: Record<string, number> = {};
  for (const r of records) byDepth[r.reflection_depth] = (byDepth[r.reflection_depth] ?? 0) + 1;

  return {
    total_reflections: records.length,
    practice_improved_count: practiceImproved,
    further_support_count: furtherSupport,
    deep_count: deep,
    surface_count: surface,
    child_focused_rate: boolRate("child_focused"),
    values_explored_rate: boolRate("values_explored"),
    emotions_acknowledged_rate: boolRate("emotions_acknowledged"),
    learning_identified_rate: boolRate("learning_identified"),
    action_plan_created_rate: boolRate("action_plan_created"),
    practice_changed_rate: boolRate("practice_changed"),
    shared_with_team_rate: boolRate("shared_with_team"),
    linked_to_supervision_rate: boolRate("linked_to_supervision"),
    linked_to_training_rate: boolRate("linked_to_training"),
    evidence_documented_rate: boolRate("evidence_documented"),
    manager_reviewed_rate: boolRate("manager_reviewed"),
    child_impact_rate: boolRate("child_impact_considered"),
    average_duration: avgDuration,
    unique_staff: uniqueStaff,
    by_reflection_type: byType,
    by_reflection_model: byModel,
    by_reflection_outcome: byOutcome,
    by_reflection_depth: byDepth,
  };
}

export function identifyStaffReflectiveAlerts(
  records: StaffReflectivePracticeRecord[],
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

  // Critical incident not linked to supervision
  for (const r of records) {
    if (r.reflection_type === "critical_incident" && !r.linked_to_supervision) {
      alerts.push({
        type: "critical_incident_no_supervision",
        severity: "critical",
        message: `Critical incident reflection by ${r.staff_name} on ${r.reflection_date} not linked to supervision — escalate`,
        id: r.id,
      });
    }
  }

  // Child impact not considered
  const noImpact = records.filter((r) => !r.child_impact_considered).length;
  if (noImpact >= 1) {
    alerts.push({
      type: "no_child_impact",
      severity: "high",
      message: `${noImpact} ${noImpact === 1 ? "reflection has" : "reflections have"} not considered child impact — ensure child-centred practice`,
      id: "no_child_impact",
    });
  }

  // Learning not identified
  const noLearning = records.filter((r) => !r.learning_identified).length;
  if (noLearning >= 2) {
    alerts.push({
      type: "no_learning_identified",
      severity: "high",
      message: `${noLearning} reflections without learning identified — review reflection quality`,
      id: "no_learning_identified",
    });
  }

  // Evidence not documented
  const noEvidence = records.filter((r) => !r.evidence_documented).length;
  if (noEvidence >= 2) {
    alerts.push({
      type: "evidence_not_documented",
      severity: "medium",
      message: `${noEvidence} reflections without evidence documented — maintain records`,
      id: "evidence_not_documented",
    });
  }

  // Not shared with team
  const notShared = records.filter((r) => !r.shared_with_team).length;
  if (notShared >= 3) {
    alerts.push({
      type: "not_shared_with_team",
      severity: "medium",
      message: `${notShared} reflections not shared with team — encourage collective learning`,
      id: "not_shared_with_team",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    reflectionType?: ReflectionType;
    reflectionModel?: ReflectionModel;
    reflectionOutcome?: ReflectionOutcome;
    reflectionDepth?: ReflectionDepth;
    limit?: number;
  },
): Promise<ServiceResult<StaffReflectivePracticeRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_staff_reflective_practice") as SB).select("*").eq("home_id", homeId);
  if (filters?.reflectionType) q = q.eq("reflection_type", filters.reflectionType);
  if (filters?.reflectionModel) q = q.eq("reflection_model", filters.reflectionModel);
  if (filters?.reflectionOutcome) q = q.eq("reflection_outcome", filters.reflectionOutcome);
  if (filters?.reflectionDepth) q = q.eq("reflection_depth", filters.reflectionDepth);
  q = q.order("reflection_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  payload: {
    homeId: string;
    reflectionType: ReflectionType;
    reflectionModel: ReflectionModel;
    reflectionOutcome: ReflectionOutcome;
    reflectionDepth: ReflectionDepth;
    reflectionDate: string;
    staffName: string;
    facilitatorName: string;
    childFocused?: boolean;
    valuesExplored?: boolean;
    emotionsAcknowledged?: boolean;
    learningIdentified?: boolean;
    actionPlanCreated?: boolean;
    practiceChanged?: boolean;
    sharedWithTeam?: boolean;
    linkedToSupervision?: boolean;
    linkedToTraining?: boolean;
    evidenceDocumented?: boolean;
    managerReviewed?: boolean;
    childImpactConsidered?: boolean;
    ethicalConsiderations?: boolean;
    issuesFound?: string[];
    actionsTaken?: string[];
    sessionDurationMinutes: number;
    nextReflectionDate?: string | null;
    notes?: string | null;
  },
): Promise<ServiceResult<StaffReflectivePracticeRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_staff_reflective_practice") as SB)
    .insert({
      home_id: payload.homeId,
      reflection_type: payload.reflectionType,
      reflection_model: payload.reflectionModel,
      reflection_outcome: payload.reflectionOutcome,
      reflection_depth: payload.reflectionDepth,
      reflection_date: payload.reflectionDate,
      staff_name: payload.staffName,
      facilitator_name: payload.facilitatorName,
      child_focused: payload.childFocused ?? true,
      values_explored: payload.valuesExplored ?? true,
      emotions_acknowledged: payload.emotionsAcknowledged ?? true,
      learning_identified: payload.learningIdentified ?? true,
      action_plan_created: payload.actionPlanCreated ?? false,
      practice_changed: payload.practiceChanged ?? false,
      shared_with_team: payload.sharedWithTeam ?? false,
      linked_to_supervision: payload.linkedToSupervision ?? false,
      linked_to_training: payload.linkedToTraining ?? false,
      evidence_documented: payload.evidenceDocumented ?? true,
      manager_reviewed: payload.managerReviewed ?? false,
      child_impact_considered: payload.childImpactConsidered ?? true,
      ethical_considerations: payload.ethicalConsiderations ?? false,
      issues_found: payload.issuesFound ?? [],
      actions_taken: payload.actionsTaken ?? [],
      session_duration_minutes: payload.sessionDurationMinutes,
      next_reflection_date: payload.nextReflectionDate ?? null,
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
    reflectionType: ReflectionType;
    reflectionModel: ReflectionModel;
    reflectionOutcome: ReflectionOutcome;
    reflectionDepth: ReflectionDepth;
    reflectionDate: string;
    staffName: string;
    facilitatorName: string;
    childFocused: boolean;
    valuesExplored: boolean;
    emotionsAcknowledged: boolean;
    learningIdentified: boolean;
    actionPlanCreated: boolean;
    practiceChanged: boolean;
    sharedWithTeam: boolean;
    linkedToSupervision: boolean;
    linkedToTraining: boolean;
    evidenceDocumented: boolean;
    managerReviewed: boolean;
    childImpactConsidered: boolean;
    ethicalConsiderations: boolean;
    issuesFound: string[];
    actionsTaken: string[];
    sessionDurationMinutes: number;
    nextReflectionDate: string | null;
    notes: string | null;
  }>,
): Promise<ServiceResult<StaffReflectivePracticeRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.reflectionType !== undefined) mapped.reflection_type = updates.reflectionType;
  if (updates.reflectionModel !== undefined) mapped.reflection_model = updates.reflectionModel;
  if (updates.reflectionOutcome !== undefined) mapped.reflection_outcome = updates.reflectionOutcome;
  if (updates.reflectionDepth !== undefined) mapped.reflection_depth = updates.reflectionDepth;
  if (updates.reflectionDate !== undefined) mapped.reflection_date = updates.reflectionDate;
  if (updates.staffName !== undefined) mapped.staff_name = updates.staffName;
  if (updates.facilitatorName !== undefined) mapped.facilitator_name = updates.facilitatorName;
  if (updates.childFocused !== undefined) mapped.child_focused = updates.childFocused;
  if (updates.valuesExplored !== undefined) mapped.values_explored = updates.valuesExplored;
  if (updates.emotionsAcknowledged !== undefined) mapped.emotions_acknowledged = updates.emotionsAcknowledged;
  if (updates.learningIdentified !== undefined) mapped.learning_identified = updates.learningIdentified;
  if (updates.actionPlanCreated !== undefined) mapped.action_plan_created = updates.actionPlanCreated;
  if (updates.practiceChanged !== undefined) mapped.practice_changed = updates.practiceChanged;
  if (updates.sharedWithTeam !== undefined) mapped.shared_with_team = updates.sharedWithTeam;
  if (updates.linkedToSupervision !== undefined) mapped.linked_to_supervision = updates.linkedToSupervision;
  if (updates.linkedToTraining !== undefined) mapped.linked_to_training = updates.linkedToTraining;
  if (updates.evidenceDocumented !== undefined) mapped.evidence_documented = updates.evidenceDocumented;
  if (updates.managerReviewed !== undefined) mapped.manager_reviewed = updates.managerReviewed;
  if (updates.childImpactConsidered !== undefined) mapped.child_impact_considered = updates.childImpactConsidered;
  if (updates.ethicalConsiderations !== undefined) mapped.ethical_considerations = updates.ethicalConsiderations;
  if (updates.issuesFound !== undefined) mapped.issues_found = updates.issuesFound;
  if (updates.actionsTaken !== undefined) mapped.actions_taken = updates.actionsTaken;
  if (updates.sessionDurationMinutes !== undefined) mapped.session_duration_minutes = updates.sessionDurationMinutes;
  if (updates.nextReflectionDate !== undefined) mapped.next_reflection_date = updates.nextReflectionDate;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  const { data, error } = await (s.from("cs_staff_reflective_practice") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeStaffReflectiveMetrics,
  identifyStaffReflectiveAlerts,
};
