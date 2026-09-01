// ══════════════════════════════════════════════════════════════════════════════
// CARA — OFSTED ACTION PLAN SERVICE
// Tracks Ofsted inspection findings, recommendations, requirements, and
// progress against action plans. Ensures all requirements are addressed
// within specified timeframes with evidence of improvement.
// CHR 2015 Reg 46 (review of quality of care — Ofsted compliance),
// Reg 40 (notification of events — Ofsted notifications),
// Reg 45 (review of quality of care — improvement planning).
//
// Covers: inspection findings, requirement notices, recommendations,
// action plan tracking, evidence gathering, progress monitoring,
// and compliance verification.
//
// SCCIF: Leadership — "Leaders respond effectively to feedback."
// "Action plans address all areas for improvement."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type FindingType =
  | "requirement"
  | "recommendation"
  | "area_for_improvement"
  | "strength_identified"
  | "national_minimum_standard"
  | "regulation_breach"
  | "safeguarding_concern"
  | "quality_of_care"
  | "leadership_management"
  | "other";

export type ActionStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "evidenced"
  | "overdue";

export type FindingPriority =
  | "immediate"
  | "high"
  | "medium"
  | "low"
  | "informational";

export type InspectionType =
  | "full_inspection"
  | "interim_inspection"
  | "monitoring_visit"
  | "unannounced_visit"
  | "complaint_investigation"
  | "regulatory_visit"
  | "assurance_visit"
  | "thematic_inspection"
  | "emergency_inspection"
  | "other";

export interface OfstedActionPlanRecord {
  id: string;
  home_id: string;
  finding_type: FindingType;
  action_status: ActionStatus;
  finding_priority: FindingPriority;
  inspection_type: InspectionType;
  inspection_date: string;
  finding_description: string;
  action_plan: string;
  responsible_person: string;
  target_date: string;
  evidence_gathered: boolean;
  progress_documented: boolean;
  staff_briefed: boolean;
  training_provided: boolean;
  policy_updated: boolean;
  practice_changed: boolean;
  monitored_by_ri: boolean;
  children_informed: boolean;
  social_worker_notified: boolean;
  board_informed: boolean;
  follow_up_inspection_ready: boolean;
  regulation_referenced: boolean;
  issues_found: string[];
  actions_taken: string[];
  completed_by: string | null;
  completion_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const FINDING_TYPES: { type: FindingType; label: string }[] = [
  { type: "requirement", label: "Requirement" },
  { type: "recommendation", label: "Recommendation" },
  { type: "area_for_improvement", label: "Area for Improvement" },
  { type: "strength_identified", label: "Strength Identified" },
  { type: "national_minimum_standard", label: "National Minimum Standard" },
  { type: "regulation_breach", label: "Regulation Breach" },
  { type: "safeguarding_concern", label: "Safeguarding Concern" },
  { type: "quality_of_care", label: "Quality of Care" },
  { type: "leadership_management", label: "Leadership & Management" },
  { type: "other", label: "Other" },
];

export const ACTION_STATUSES: { status: ActionStatus; label: string }[] = [
  { status: "not_started", label: "Not Started" },
  { status: "in_progress", label: "In Progress" },
  { status: "completed", label: "Completed" },
  { status: "evidenced", label: "Evidenced" },
  { status: "overdue", label: "Overdue" },
];

export const FINDING_PRIORITIES: { priority: FindingPriority; label: string }[] = [
  { priority: "immediate", label: "Immediate" },
  { priority: "high", label: "High" },
  { priority: "medium", label: "Medium" },
  { priority: "low", label: "Low" },
  { priority: "informational", label: "Informational" },
];

export const INSPECTION_TYPES: { type: InspectionType; label: string }[] = [
  { type: "full_inspection", label: "Full Inspection" },
  { type: "interim_inspection", label: "Interim Inspection" },
  { type: "monitoring_visit", label: "Monitoring Visit" },
  { type: "unannounced_visit", label: "Unannounced Visit" },
  { type: "complaint_investigation", label: "Complaint Investigation" },
  { type: "regulatory_visit", label: "Regulatory Visit" },
  { type: "assurance_visit", label: "Assurance Visit" },
  { type: "thematic_inspection", label: "Thematic Inspection" },
  { type: "emergency_inspection", label: "Emergency Inspection" },
  { type: "other", label: "Other" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeOfstedActionPlanMetrics(
  records: OfstedActionPlanRecord[],
): {
  total_findings: number;
  not_started_count: number;
  in_progress_count: number;
  completed_count: number;
  evidenced_count: number;
  overdue_count: number;
  evidence_gathered_rate: number | null;
  progress_documented_rate: number | null;
  staff_briefed_rate: number | null;
  training_provided_rate: number | null;
  policy_updated_rate: number | null;
  practice_changed_rate: number | null;
  monitored_by_ri_rate: number | null;
  children_informed_rate: number | null;
  social_worker_notified_rate: number | null;
  board_informed_rate: number | null;
  follow_up_ready_rate: number | null;
  regulation_referenced_rate: number | null;
  completion_rate: number | null;
  by_finding_type: Record<string, number>;
  by_action_status: Record<string, number>;
  by_finding_priority: Record<string, number>;
  by_inspection_type: Record<string, number>;
} {
  const notStarted = records.filter((r) => r.action_status === "not_started").length;
  const inProgress = records.filter((r) => r.action_status === "in_progress").length;
  const completed = records.filter((r) => r.action_status === "completed").length;
  const evidenced = records.filter((r) => r.action_status === "evidenced").length;
  const overdue = records.filter((r) => r.action_status === "overdue").length;

  // Rated over the records where the question was answered either way. With the
  // judgement columns tri-state (null = not recorded), an unrecorded answer in
  // the denominator would score silence as a "no" — the same fabrication the
  // old `?? true` creates made in the other direction. While every field is
  // still a strict boolean this is behaviour-identical.
  const boolRate = (field: keyof OfstedActionPlanRecord) => {
    const recorded = records.filter((r) => r[field] !== null && r[field] !== undefined);
    const count = recorded.filter((r) => r[field] === true).length;
    return recorded.length > 0
      ? Math.round((count / recorded.length) * 1000) / 10
      : null;
  };

  const completionRate = records.length > 0
    ? Math.round(((completed + evidenced) / records.length) * 1000) / 10
    : null;

  const byFinding: Record<string, number> = {};
  for (const r of records) byFinding[r.finding_type] = (byFinding[r.finding_type] ?? 0) + 1;

  const byStatus: Record<string, number> = {};
  for (const r of records) byStatus[r.action_status] = (byStatus[r.action_status] ?? 0) + 1;

  const byPriority: Record<string, number> = {};
  for (const r of records) byPriority[r.finding_priority] = (byPriority[r.finding_priority] ?? 0) + 1;

  const byInspection: Record<string, number> = {};
  for (const r of records) byInspection[r.inspection_type] = (byInspection[r.inspection_type] ?? 0) + 1;

  return {
    total_findings: records.length,
    not_started_count: notStarted,
    in_progress_count: inProgress,
    completed_count: completed,
    evidenced_count: evidenced,
    overdue_count: overdue,
    evidence_gathered_rate: boolRate("evidence_gathered"),
    progress_documented_rate: boolRate("progress_documented"),
    staff_briefed_rate: boolRate("staff_briefed"),
    training_provided_rate: boolRate("training_provided"),
    policy_updated_rate: boolRate("policy_updated"),
    practice_changed_rate: boolRate("practice_changed"),
    monitored_by_ri_rate: boolRate("monitored_by_ri"),
    children_informed_rate: boolRate("children_informed"),
    social_worker_notified_rate: boolRate("social_worker_notified"),
    board_informed_rate: boolRate("board_informed"),
    follow_up_ready_rate: boolRate("follow_up_inspection_ready"),
    regulation_referenced_rate: boolRate("regulation_referenced"),
    completion_rate: completionRate,
    by_finding_type: byFinding,
    by_action_status: byStatus,
    by_finding_priority: byPriority,
    by_inspection_type: byInspection,
  };
}

export function identifyOfstedActionPlanAlerts(
  records: OfstedActionPlanRecord[],
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

  // Overdue requirements
  for (const r of records) {
    if (r.action_status === "overdue" && (r.finding_type === "requirement" || r.finding_type === "regulation_breach")) {
      alerts.push({
        type: "overdue_requirement",
        severity: "critical",
        message: `${r.finding_type.replace(/_/g, " ")} from ${r.inspection_date} is overdue — target date ${r.target_date} passed`,
        id: r.id,
      });
    }
  }

  // Not started findings
  const notStarted = records.filter((r) => r.action_status === "not_started").length;
  if (notStarted >= 1) {
    alerts.push({
      type: "not_started",
      severity: "high",
      message: `${notStarted} ${notStarted === 1 ? "finding has" : "findings have"} not been started — begin action plan implementation`,
      id: "not_started",
    });
  }

  // Evidence not gathered
  const noEvidence = records.filter((r) => !r.evidence_gathered && r.action_status !== "not_started").length;
  if (noEvidence >= 2) {
    alerts.push({
      type: "evidence_not_gathered",
      severity: "high",
      message: `${noEvidence} in-progress findings without evidence gathered — document improvements`,
      id: "evidence_not_gathered",
    });
  }

  // Staff not briefed
  const notBriefed = records.filter((r) => !r.staff_briefed).length;
  if (notBriefed >= 2) {
    alerts.push({
      type: "staff_not_briefed",
      severity: "medium",
      message: `${notBriefed} findings where staff not briefed — ensure team awareness`,
      id: "staff_not_briefed",
    });
  }

  // Practice not changed
  const noPracticeChange = records.filter((r) => !r.practice_changed).length;
  if (noPracticeChange >= 3) {
    alerts.push({
      type: "practice_not_changed",
      severity: "medium",
      message: `${noPracticeChange} findings without practice changes evidenced — review implementation`,
      id: "practice_not_changed",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    findingType?: FindingType;
    actionStatus?: ActionStatus;
    findingPriority?: FindingPriority;
    inspectionType?: InspectionType;
    limit?: number;
  },
): Promise<ServiceResult<OfstedActionPlanRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_ofsted_action_plans") as SB).select("*").eq("home_id", homeId);
  if (filters?.findingType) q = q.eq("finding_type", filters.findingType);
  if (filters?.actionStatus) q = q.eq("action_status", filters.actionStatus);
  if (filters?.findingPriority) q = q.eq("finding_priority", filters.findingPriority);
  if (filters?.inspectionType) q = q.eq("inspection_type", filters.inspectionType);
  q = q.order("inspection_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  payload: {
    homeId: string;
    findingType: FindingType;
    actionStatus: ActionStatus;
    findingPriority: FindingPriority;
    inspectionType: InspectionType;
    inspectionDate: string;
    findingDescription: string;
    actionPlan: string;
    responsiblePerson: string;
    targetDate: string;
    evidenceGathered?: boolean;
    progressDocumented?: boolean;
    staffBriefed?: boolean;
    trainingProvided?: boolean;
    policyUpdated?: boolean;
    practiceChanged?: boolean;
    monitoredByRi?: boolean;
    childrenInformed?: boolean;
    socialWorkerNotified?: boolean;
    boardInformed?: boolean;
    followUpInspectionReady?: boolean;
    regulationReferenced?: boolean;
    issuesFound?: string[];
    actionsTaken?: string[];
    completedBy?: string | null;
    completionDate?: string | null;
    notes?: string | null;
  },
): Promise<ServiceResult<OfstedActionPlanRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_ofsted_action_plans") as SB)
    .insert({
      home_id: payload.homeId,
      finding_type: payload.findingType,
      action_status: payload.actionStatus,
      finding_priority: payload.findingPriority,
      inspection_type: payload.inspectionType,
      inspection_date: payload.inspectionDate,
      finding_description: payload.findingDescription,
      action_plan: payload.actionPlan,
      responsible_person: payload.responsiblePerson,
      target_date: payload.targetDate,
      evidence_gathered: payload.evidenceGathered ?? false,
      progress_documented: payload.progressDocumented ?? false,
      staff_briefed: payload.staffBriefed ?? false,
      training_provided: payload.trainingProvided ?? false,
      policy_updated: payload.policyUpdated ?? false,
      practice_changed: payload.practiceChanged ?? false,
      monitored_by_ri: payload.monitoredByRi ?? false,
      children_informed: payload.childrenInformed ?? false,
      social_worker_notified: payload.socialWorkerNotified ?? false,
      board_informed: payload.boardInformed ?? false,
      follow_up_inspection_ready: payload.followUpInspectionReady ?? false,
      regulation_referenced: payload.regulationReferenced ?? false,
      issues_found: payload.issuesFound ?? [],
      actions_taken: payload.actionsTaken ?? [],
      completed_by: payload.completedBy ?? null,
      completion_date: payload.completionDate ?? null,
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
    findingType: FindingType;
    actionStatus: ActionStatus;
    findingPriority: FindingPriority;
    inspectionType: InspectionType;
    inspectionDate: string;
    findingDescription: string;
    actionPlan: string;
    responsiblePerson: string;
    targetDate: string;
    evidenceGathered: boolean;
    progressDocumented: boolean;
    staffBriefed: boolean;
    trainingProvided: boolean;
    policyUpdated: boolean;
    practiceChanged: boolean;
    monitoredByRi: boolean;
    childrenInformed: boolean;
    socialWorkerNotified: boolean;
    boardInformed: boolean;
    followUpInspectionReady: boolean;
    regulationReferenced: boolean;
    issuesFound: string[];
    actionsTaken: string[];
    completedBy: string | null;
    completionDate: string | null;
    notes: string | null;
  }>,
): Promise<ServiceResult<OfstedActionPlanRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.findingType !== undefined) mapped.finding_type = updates.findingType;
  if (updates.actionStatus !== undefined) mapped.action_status = updates.actionStatus;
  if (updates.findingPriority !== undefined) mapped.finding_priority = updates.findingPriority;
  if (updates.inspectionType !== undefined) mapped.inspection_type = updates.inspectionType;
  if (updates.inspectionDate !== undefined) mapped.inspection_date = updates.inspectionDate;
  if (updates.findingDescription !== undefined) mapped.finding_description = updates.findingDescription;
  if (updates.actionPlan !== undefined) mapped.action_plan = updates.actionPlan;
  if (updates.responsiblePerson !== undefined) mapped.responsible_person = updates.responsiblePerson;
  if (updates.targetDate !== undefined) mapped.target_date = updates.targetDate;
  if (updates.evidenceGathered !== undefined) mapped.evidence_gathered = updates.evidenceGathered;
  if (updates.progressDocumented !== undefined) mapped.progress_documented = updates.progressDocumented;
  if (updates.staffBriefed !== undefined) mapped.staff_briefed = updates.staffBriefed;
  if (updates.trainingProvided !== undefined) mapped.training_provided = updates.trainingProvided;
  if (updates.policyUpdated !== undefined) mapped.policy_updated = updates.policyUpdated;
  if (updates.practiceChanged !== undefined) mapped.practice_changed = updates.practiceChanged;
  if (updates.monitoredByRi !== undefined) mapped.monitored_by_ri = updates.monitoredByRi;
  if (updates.childrenInformed !== undefined) mapped.children_informed = updates.childrenInformed;
  if (updates.socialWorkerNotified !== undefined) mapped.social_worker_notified = updates.socialWorkerNotified;
  if (updates.boardInformed !== undefined) mapped.board_informed = updates.boardInformed;
  if (updates.followUpInspectionReady !== undefined) mapped.follow_up_inspection_ready = updates.followUpInspectionReady;
  if (updates.regulationReferenced !== undefined) mapped.regulation_referenced = updates.regulationReferenced;
  if (updates.issuesFound !== undefined) mapped.issues_found = updates.issuesFound;
  if (updates.actionsTaken !== undefined) mapped.actions_taken = updates.actionsTaken;
  if (updates.completedBy !== undefined) mapped.completed_by = updates.completedBy;
  if (updates.completionDate !== undefined) mapped.completion_date = updates.completionDate;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  const { data, error } = await (s.from("cs_ofsted_action_plans") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeOfstedActionPlanMetrics,
  identifyOfstedActionPlanAlerts,
};
