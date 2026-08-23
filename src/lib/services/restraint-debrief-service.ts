// ══════════════════════════════════════════════════════════════════════════════
// CARA — RESTRAINT DEBRIEF SERVICE
// Tracks post-restraint debriefing sessions with children and staff,
// ensuring proportionate response, learning from incidents, and
// emotional recovery support.
// CHR 2015 Reg 20 (restraint — post-incident debrief required),
// Reg 35 (behaviour management — learning from restraint),
// Reg 12 (health and wellbeing — emotional recovery).
//
// Covers: child debriefs, staff debriefs, medical checks, witness
// statements, CCTV review, notification compliance, learning
// outcomes, and plan updates following restraint.
//
// SCCIF: Safety — "Post-restraint debriefs happen consistently."
// "Learning from incidents reduces future restraint."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type DebriefType =
  | "child_debrief"
  | "staff_debrief"
  | "combined_debrief"
  | "management_review"
  | "multi_agency_review"
  | "independent_review"
  | "follow_up_debrief"
  | "formal_investigation"
  | "learning_review"
  | "other";

export type RestraintType =
  | "planned_intervention"
  | "unplanned_intervention"
  | "emergency_response"
  | "guided_away"
  | "standing_hold"
  | "seated_hold"
  | "ground_hold"
  | "separation"
  | "seclusion"
  | "other";

export type DebriefOutcome =
  | "no_concerns"
  | "learning_identified"
  | "plan_updated"
  | "training_needed"
  | "investigation_required";

export type EmotionalState =
  | "calm"
  | "upset_but_recovering"
  | "distressed"
  | "angry"
  | "withdrawn";

export interface RestraintDebriefRecord {
  id: string;
  home_id: string;
  debrief_type: DebriefType;
  restraint_type: RestraintType;
  debrief_outcome: DebriefOutcome;
  child_emotional_state: EmotionalState;
  debrief_date: string;
  child_name: string;
  child_id: string | null;
  staff_involved: string;
  child_debrief_completed: boolean;
  staff_debrief_completed: boolean;
  medical_check_done: boolean;
  body_map_completed: boolean;
  ofsted_notified: boolean;
  social_worker_notified: boolean;
  parent_notified: boolean;
  witness_statements_taken: boolean;
  cctv_reviewed: boolean;
  proportionate_response: boolean;
  learning_documented: boolean;
  plan_updated: boolean;
  issues_found: string[];
  actions_taken: string[];
  debriefed_by: string;
  restraint_duration_minutes: number;
  next_review_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const DEBRIEF_TYPES: { type: DebriefType; label: string }[] = [
  { type: "child_debrief", label: "Child Debrief" },
  { type: "staff_debrief", label: "Staff Debrief" },
  { type: "combined_debrief", label: "Combined Debrief" },
  { type: "management_review", label: "Management Review" },
  { type: "multi_agency_review", label: "Multi-Agency Review" },
  { type: "independent_review", label: "Independent Review" },
  { type: "follow_up_debrief", label: "Follow-Up Debrief" },
  { type: "formal_investigation", label: "Formal Investigation" },
  { type: "learning_review", label: "Learning Review" },
  { type: "other", label: "Other" },
];

export const RESTRAINT_TYPES: { type: RestraintType; label: string }[] = [
  { type: "planned_intervention", label: "Planned Intervention" },
  { type: "unplanned_intervention", label: "Unplanned Intervention" },
  { type: "emergency_response", label: "Emergency Response" },
  { type: "guided_away", label: "Guided Away" },
  { type: "standing_hold", label: "Standing Hold" },
  { type: "seated_hold", label: "Seated Hold" },
  { type: "ground_hold", label: "Ground Hold" },
  { type: "separation", label: "Separation" },
  { type: "seclusion", label: "Seclusion" },
  { type: "other", label: "Other" },
];

export const DEBRIEF_OUTCOMES: { outcome: DebriefOutcome; label: string }[] = [
  { outcome: "no_concerns", label: "No Concerns" },
  { outcome: "learning_identified", label: "Learning Identified" },
  { outcome: "plan_updated", label: "Plan Updated" },
  { outcome: "training_needed", label: "Training Needed" },
  { outcome: "investigation_required", label: "Investigation Required" },
];

export const EMOTIONAL_STATES: { state: EmotionalState; label: string }[] = [
  { state: "calm", label: "Calm" },
  { state: "upset_but_recovering", label: "Upset but Recovering" },
  { state: "distressed", label: "Distressed" },
  { state: "angry", label: "Angry" },
  { state: "withdrawn", label: "Withdrawn" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeRestraintDebriefMetrics(
  records: RestraintDebriefRecord[],
): {
  total_debriefs: number;
  no_concerns_count: number;
  learning_identified_count: number;
  investigation_count: number;
  distressed_count: number;
  child_debrief_rate: number | null;
  staff_debrief_rate: number | null;
  medical_check_rate: number | null;
  body_map_rate: number | null;
  ofsted_notified_rate: number | null;
  social_worker_notified_rate: number | null;
  parent_notified_rate: number | null;
  witness_statements_rate: number | null;
  cctv_reviewed_rate: number | null;
  proportionate_rate: number | null;
  learning_documented_rate: number | null;
  plan_updated_rate: number | null;
  average_restraint_duration: number | null;
  unique_children: number;
  by_debrief_type: Record<string, number>;
  by_restraint_type: Record<string, number>;
  by_debrief_outcome: Record<string, number>;
  by_emotional_state: Record<string, number>;
} {
  const noConcerns = records.filter((r) => r.debrief_outcome === "no_concerns").length;
  const learningId = records.filter((r) => r.debrief_outcome === "learning_identified").length;
  const investigation = records.filter((r) => r.debrief_outcome === "investigation_required").length;
  const distressed = records.filter((r) => r.child_emotional_state === "distressed").length;

  const boolRate = (field: keyof RestraintDebriefRecord) => {
    const count = records.filter((r) => r[field] === true).length;
    return records.length > 0
      ? Math.round((count / records.length) * 1000) / 10
      : null;
  };

  const avgDuration = records.length > 0
    ? Math.round((records.reduce((sum, r) => sum + r.restraint_duration_minutes, 0) / records.length) * 10) / 10
    : null;

  const uniqueChildren = new Set(records.map((r) => r.child_name)).size;

  const byDebType: Record<string, number> = {};
  for (const r of records) byDebType[r.debrief_type] = (byDebType[r.debrief_type] ?? 0) + 1;

  const byResType: Record<string, number> = {};
  for (const r of records) byResType[r.restraint_type] = (byResType[r.restraint_type] ?? 0) + 1;

  const byOutcome: Record<string, number> = {};
  for (const r of records) byOutcome[r.debrief_outcome] = (byOutcome[r.debrief_outcome] ?? 0) + 1;

  const byState: Record<string, number> = {};
  for (const r of records) byState[r.child_emotional_state] = (byState[r.child_emotional_state] ?? 0) + 1;

  return {
    total_debriefs: records.length,
    no_concerns_count: noConcerns,
    learning_identified_count: learningId,
    investigation_count: investigation,
    distressed_count: distressed,
    child_debrief_rate: boolRate("child_debrief_completed"),
    staff_debrief_rate: boolRate("staff_debrief_completed"),
    medical_check_rate: boolRate("medical_check_done"),
    body_map_rate: boolRate("body_map_completed"),
    ofsted_notified_rate: boolRate("ofsted_notified"),
    social_worker_notified_rate: boolRate("social_worker_notified"),
    parent_notified_rate: boolRate("parent_notified"),
    witness_statements_rate: boolRate("witness_statements_taken"),
    cctv_reviewed_rate: boolRate("cctv_reviewed"),
    proportionate_rate: boolRate("proportionate_response"),
    learning_documented_rate: boolRate("learning_documented"),
    plan_updated_rate: boolRate("plan_updated"),
    average_restraint_duration: avgDuration,
    unique_children: uniqueChildren,
    by_debrief_type: byDebType,
    by_restraint_type: byResType,
    by_debrief_outcome: byOutcome,
    by_emotional_state: byState,
  };
}

export function identifyRestraintDebriefAlerts(
  records: RestraintDebriefRecord[],
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

  // Disproportionate response
  for (const r of records) {
    if (!r.proportionate_response) {
      alerts.push({
        type: "disproportionate_response",
        severity: "critical",
        message: `Restraint of ${r.child_name} on ${r.debrief_date} assessed as disproportionate — investigate immediately`,
        id: r.id,
      });
    }
  }

  // Child debrief not completed
  const noChildDebrief = records.filter((r) => !r.child_debrief_completed).length;
  if (noChildDebrief >= 1) {
    alerts.push({
      type: "no_child_debrief",
      severity: "high",
      message: `${noChildDebrief} ${noChildDebrief === 1 ? "restraint has" : "restraints have"} no child debrief completed — essential for recovery`,
      id: "no_child_debrief",
    });
  }

  // Medical check not done
  const noMedical = records.filter((r) => !r.medical_check_done).length;
  if (noMedical >= 1) {
    alerts.push({
      type: "no_medical_check",
      severity: "high",
      message: `${noMedical} ${noMedical === 1 ? "restraint has" : "restraints have"} no medical check completed — ensure child safety`,
      id: "no_medical_check",
    });
  }

  // Ofsted not notified
  const noOfsted = records.filter((r) => !r.ofsted_notified).length;
  if (noOfsted >= 2) {
    alerts.push({
      type: "ofsted_not_notified",
      severity: "medium",
      message: `${noOfsted} restraints without Ofsted notification — review notification compliance`,
      id: "ofsted_not_notified",
    });
  }

  // Learning not documented
  const noLearning = records.filter((r) => !r.learning_documented).length;
  if (noLearning >= 2) {
    alerts.push({
      type: "learning_not_documented",
      severity: "medium",
      message: `${noLearning} restraints without learning documented — capture lessons for practice improvement`,
      id: "learning_not_documented",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    debriefType?: DebriefType;
    restraintType?: RestraintType;
    debriefOutcome?: DebriefOutcome;
    childEmotionalState?: EmotionalState;
    limit?: number;
  },
): Promise<ServiceResult<RestraintDebriefRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_restraint_debriefs") as SB).select("*").eq("home_id", homeId);
  if (filters?.debriefType) q = q.eq("debrief_type", filters.debriefType);
  if (filters?.restraintType) q = q.eq("restraint_type", filters.restraintType);
  if (filters?.debriefOutcome) q = q.eq("debrief_outcome", filters.debriefOutcome);
  if (filters?.childEmotionalState) q = q.eq("child_emotional_state", filters.childEmotionalState);
  q = q.order("debrief_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  payload: {
    homeId: string;
    debriefType: DebriefType;
    restraintType: RestraintType;
    debriefOutcome: DebriefOutcome;
    childEmotionalState: EmotionalState;
    debriefDate: string;
    childName: string;
    childId?: string | null;
    staffInvolved: string;
    childDebriefCompleted?: boolean;
    staffDebriefCompleted?: boolean;
    medicalCheckDone?: boolean;
    bodyMapCompleted?: boolean;
    ofstedNotified?: boolean;
    socialWorkerNotified?: boolean;
    parentNotified?: boolean;
    witnessStatementsTaken?: boolean;
    cctvReviewed?: boolean;
    proportionateResponse?: boolean;
    learningDocumented?: boolean;
    planUpdated?: boolean;
    issuesFound?: string[];
    actionsTaken?: string[];
    debriefedBy: string;
    restraintDurationMinutes: number;
    nextReviewDate?: string | null;
    notes?: string | null;
  },
): Promise<ServiceResult<RestraintDebriefRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_restraint_debriefs") as SB)
    .insert({
      home_id: payload.homeId,
      debrief_type: payload.debriefType,
      restraint_type: payload.restraintType,
      debrief_outcome: payload.debriefOutcome,
      child_emotional_state: payload.childEmotionalState,
      debrief_date: payload.debriefDate,
      child_name: payload.childName,
      child_id: payload.childId ?? null,
      staff_involved: payload.staffInvolved,
      child_debrief_completed: payload.childDebriefCompleted ?? true,
      staff_debrief_completed: payload.staffDebriefCompleted ?? true,
      medical_check_done: payload.medicalCheckDone ?? true,
      body_map_completed: payload.bodyMapCompleted ?? true,
      ofsted_notified: payload.ofstedNotified ?? true,
      social_worker_notified: payload.socialWorkerNotified ?? true,
      parent_notified: payload.parentNotified ?? true,
      witness_statements_taken: payload.witnessStatementsTaken ?? true,
      cctv_reviewed: payload.cctvReviewed ?? false,
      proportionate_response: payload.proportionateResponse ?? true,
      learning_documented: payload.learningDocumented ?? true,
      plan_updated: payload.planUpdated ?? true,
      issues_found: payload.issuesFound ?? [],
      actions_taken: payload.actionsTaken ?? [],
      debriefed_by: payload.debriefedBy,
      restraint_duration_minutes: payload.restraintDurationMinutes,
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
    debriefType: DebriefType;
    restraintType: RestraintType;
    debriefOutcome: DebriefOutcome;
    childEmotionalState: EmotionalState;
    debriefDate: string;
    childName: string;
    childId: string | null;
    staffInvolved: string;
    childDebriefCompleted: boolean;
    staffDebriefCompleted: boolean;
    medicalCheckDone: boolean;
    bodyMapCompleted: boolean;
    ofstedNotified: boolean;
    socialWorkerNotified: boolean;
    parentNotified: boolean;
    witnessStatementsTaken: boolean;
    cctvReviewed: boolean;
    proportionateResponse: boolean;
    learningDocumented: boolean;
    planUpdated: boolean;
    issuesFound: string[];
    actionsTaken: string[];
    debriefedBy: string;
    restraintDurationMinutes: number;
    nextReviewDate: string | null;
    notes: string | null;
  }>,
): Promise<ServiceResult<RestraintDebriefRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.debriefType !== undefined) mapped.debrief_type = updates.debriefType;
  if (updates.restraintType !== undefined) mapped.restraint_type = updates.restraintType;
  if (updates.debriefOutcome !== undefined) mapped.debrief_outcome = updates.debriefOutcome;
  if (updates.childEmotionalState !== undefined) mapped.child_emotional_state = updates.childEmotionalState;
  if (updates.debriefDate !== undefined) mapped.debrief_date = updates.debriefDate;
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.childId !== undefined) mapped.child_id = updates.childId;
  if (updates.staffInvolved !== undefined) mapped.staff_involved = updates.staffInvolved;
  if (updates.childDebriefCompleted !== undefined) mapped.child_debrief_completed = updates.childDebriefCompleted;
  if (updates.staffDebriefCompleted !== undefined) mapped.staff_debrief_completed = updates.staffDebriefCompleted;
  if (updates.medicalCheckDone !== undefined) mapped.medical_check_done = updates.medicalCheckDone;
  if (updates.bodyMapCompleted !== undefined) mapped.body_map_completed = updates.bodyMapCompleted;
  if (updates.ofstedNotified !== undefined) mapped.ofsted_notified = updates.ofstedNotified;
  if (updates.socialWorkerNotified !== undefined) mapped.social_worker_notified = updates.socialWorkerNotified;
  if (updates.parentNotified !== undefined) mapped.parent_notified = updates.parentNotified;
  if (updates.witnessStatementsTaken !== undefined) mapped.witness_statements_taken = updates.witnessStatementsTaken;
  if (updates.cctvReviewed !== undefined) mapped.cctv_reviewed = updates.cctvReviewed;
  if (updates.proportionateResponse !== undefined) mapped.proportionate_response = updates.proportionateResponse;
  if (updates.learningDocumented !== undefined) mapped.learning_documented = updates.learningDocumented;
  if (updates.planUpdated !== undefined) mapped.plan_updated = updates.planUpdated;
  if (updates.issuesFound !== undefined) mapped.issues_found = updates.issuesFound;
  if (updates.actionsTaken !== undefined) mapped.actions_taken = updates.actionsTaken;
  if (updates.debriefedBy !== undefined) mapped.debriefed_by = updates.debriefedBy;
  if (updates.restraintDurationMinutes !== undefined) mapped.restraint_duration_minutes = updates.restraintDurationMinutes;
  if (updates.nextReviewDate !== undefined) mapped.next_review_date = updates.nextReviewDate;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  const { data, error } = await (s.from("cs_restraint_debriefs") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeRestraintDebriefMetrics,
  identifyRestraintDebriefAlerts,
};
