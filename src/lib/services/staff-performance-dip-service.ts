// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF PERFORMANCE DIP SERVICE
// Tracks staff performance dips using soft, human language — part of the
// Cara Staff Development, Support and Risk Intelligence layer.
// CHR 2015 Reg 33 (employment of staff — competence and support),
// Reg 34 (fitness of workers), Reg 13 (leadership and management).
//
// This is STRENGTHS-BASED and SUPPORTIVE, not punitive. Performance
// dips are identified to explore underlying causes, offer support,
// and help staff develop — never to discipline or blame.
//
// Covers: dip identification, severity assessment, trigger exploration,
// support planning, wellbeing checks, supervision linkage, and
// staff response tracking.
//
// SCCIF: Well-Led — "Leaders support staff to improve practice."
// "Staff feel valued and are helped to develop their skills."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type DipCategory =
  | "recording_quality"
  | "engagement_quality"
  | "timeliness"
  | "incident_response"
  | "care_plan_compliance"
  | "medication_accuracy"
  | "safeguarding_practice"
  | "communication"
  | "team_collaboration"
  | "child_relationship";

export type DipSeverity =
  | "possible_dip"
  | "pattern_emerging"
  | "needs_exploration"
  | "support_recommended"
  | "manager_review_required";

export type DipStatus =
  | "identified"
  | "exploring"
  | "supporting"
  | "resolved"
  | "escalated";

export type FrequencyPattern =
  | "one_off"
  | "occasional"
  | "recurring"
  | "persistent"
  | "unknown";

export interface StaffPerformanceDipRecord {
  id: string;
  home_id: string;
  staff_name: string;
  staff_id: string | null;
  dip_category: DipCategory;
  dip_severity: DipSeverity;
  dip_status: DipStatus;
  frequency_pattern: FrequencyPattern;
  session_date: string;
  identified_by: string;
  description: string;
  evidence_summary: string;
  possible_triggers: string | null;
  support_offered_detail: string | null;
  manager_response: string | null;
  staff_response: string | null;
  evidence_documented: boolean;
  manager_aware: boolean;
  staff_informed: boolean;
  support_offered: boolean;
  triggers_explored: boolean;
  supervision_discussed: boolean;
  training_considered: boolean;
  wellbeing_assessed: boolean;
  action_plan_created: boolean;
  staff_responded: boolean;
  follow_up_scheduled: boolean;
  recorded_promptly: boolean;
  issues_found: string[];
  actions_taken: string[];
  next_review_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const DIP_CATEGORIES: { category: DipCategory; label: string }[] = [
  { category: "recording_quality", label: "Recording Quality" },
  { category: "engagement_quality", label: "Engagement Quality" },
  { category: "timeliness", label: "Timeliness" },
  { category: "incident_response", label: "Incident Response" },
  { category: "care_plan_compliance", label: "Care Plan Compliance" },
  { category: "medication_accuracy", label: "Medication Accuracy" },
  { category: "safeguarding_practice", label: "Safeguarding Practice" },
  { category: "communication", label: "Communication" },
  { category: "team_collaboration", label: "Team Collaboration" },
  { category: "child_relationship", label: "Child Relationship" },
];

export const DIP_SEVERITIES: { severity: DipSeverity; label: string }[] = [
  { severity: "possible_dip", label: "Possible Dip" },
  { severity: "pattern_emerging", label: "Pattern Emerging" },
  { severity: "needs_exploration", label: "Needs Exploration" },
  { severity: "support_recommended", label: "Support Recommended" },
  { severity: "manager_review_required", label: "Manager Review Required" },
];

export const DIP_STATUSES: { status: DipStatus; label: string }[] = [
  { status: "identified", label: "Identified" },
  { status: "exploring", label: "Exploring" },
  { status: "supporting", label: "Supporting" },
  { status: "resolved", label: "Resolved" },
  { status: "escalated", label: "Escalated" },
];

export const FREQUENCY_PATTERNS: { pattern: FrequencyPattern; label: string }[] = [
  { pattern: "one_off", label: "One-Off" },
  { pattern: "occasional", label: "Occasional" },
  { pattern: "recurring", label: "Recurring" },
  { pattern: "persistent", label: "Persistent" },
  { pattern: "unknown", label: "Unknown" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

/**
 * Compute staff performance dip metrics.
 */
export function computePerformanceDipMetrics(
  records: StaffPerformanceDipRecord[],
): {
  total_dips: number;
  manager_review_count: number;
  support_recommended_count: number;
  unresolved_count: number;
  escalated_count: number;
  evidence_documented_rate: number | null;
  manager_aware_rate: number | null;
  staff_informed_rate: number | null;
  support_offered_rate: number | null;
  triggers_explored_rate: number | null;
  supervision_discussed_rate: number | null;
  training_considered_rate: number | null;
  wellbeing_assessed_rate: number | null;
  action_plan_rate: number | null;
  staff_responded_rate: number | null;
  follow_up_scheduled_rate: number | null;
  recorded_promptly_rate: number | null;
  unique_staff: number;
  by_dip_category: Record<string, number>;
  by_dip_severity: Record<string, number>;
  by_dip_status: Record<string, number>;
  by_frequency_pattern: Record<string, number>;
} {
  const managerReviewCount = records.filter((r) => r.dip_severity === "manager_review_required").length;
  const supportRecommendedCount = records.filter((r) => r.dip_severity === "support_recommended").length;
  const unresolvedStatuses: DipStatus[] = ["identified", "exploring", "supporting"];
  const unresolvedCount = records.filter((r) => unresolvedStatuses.includes(r.dip_status)).length;
  const escalatedCount = records.filter((r) => r.dip_status === "escalated").length;

  // Rated over the records where the question was answered either way. With the
  // judgement columns tri-state (null = not recorded), an unrecorded answer in
  // the denominator would score silence as a "no" — the same fabrication the
  // old `?? true` creates made in the other direction. While every field is
  // still a strict boolean this is behaviour-identical.
  const boolRate = (field: keyof StaffPerformanceDipRecord) => {
    const recorded = records.filter((r) => r[field] !== null && r[field] !== undefined);
    const count = recorded.filter((r) => r[field] === true).length;
    return recorded.length > 0
      ? Math.round((count / recorded.length) * 1000) / 10
      : null;
  };

  const uniqueStaff = new Set(records.map((r) => r.staff_name)).size;

  const byDipCategory: Record<string, number> = {};
  for (const r of records) byDipCategory[r.dip_category] = (byDipCategory[r.dip_category] ?? 0) + 1;

  const byDipSeverity: Record<string, number> = {};
  for (const r of records) byDipSeverity[r.dip_severity] = (byDipSeverity[r.dip_severity] ?? 0) + 1;

  const byDipStatus: Record<string, number> = {};
  for (const r of records) byDipStatus[r.dip_status] = (byDipStatus[r.dip_status] ?? 0) + 1;

  const byFrequencyPattern: Record<string, number> = {};
  for (const r of records) byFrequencyPattern[r.frequency_pattern] = (byFrequencyPattern[r.frequency_pattern] ?? 0) + 1;

  return {
    total_dips: records.length,
    manager_review_count: managerReviewCount,
    support_recommended_count: supportRecommendedCount,
    unresolved_count: unresolvedCount,
    escalated_count: escalatedCount,
    evidence_documented_rate: boolRate("evidence_documented"),
    manager_aware_rate: boolRate("manager_aware"),
    staff_informed_rate: boolRate("staff_informed"),
    support_offered_rate: boolRate("support_offered"),
    triggers_explored_rate: boolRate("triggers_explored"),
    supervision_discussed_rate: boolRate("supervision_discussed"),
    training_considered_rate: boolRate("training_considered"),
    wellbeing_assessed_rate: boolRate("wellbeing_assessed"),
    action_plan_rate: boolRate("action_plan_created"),
    staff_responded_rate: boolRate("staff_responded"),
    follow_up_scheduled_rate: boolRate("follow_up_scheduled"),
    recorded_promptly_rate: boolRate("recorded_promptly"),
    unique_staff: uniqueStaff,
    by_dip_category: byDipCategory,
    by_dip_severity: byDipSeverity,
    by_dip_status: byDipStatus,
    by_frequency_pattern: byFrequencyPattern,
  };
}

/**
 * Identify performance dip alerts requiring management attention.
 */
export function identifyPerformanceDipAlerts(
  records: StaffPerformanceDipRecord[],
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

  // Unreviewed serious — per-record, critical
  const seriousSeverities: DipSeverity[] = ["support_recommended", "manager_review_required"];
  const unreviewedStatuses: DipStatus[] = ["identified", "exploring"];
  for (const r of records) {
    if (seriousSeverities.includes(r.dip_severity) && unreviewedStatuses.includes(r.dip_status)) {
      const severity = r.dip_severity.replace(/_/g, " ");
      alerts.push({
        type: "unreviewed_serious",
        severity: "critical",
        message: `${r.staff_name} has an unreviewed performance concern requiring ${severity} — manager action needed.`,
        id: r.id,
      });
    }
  }

  // Staff not informed — high, count >= 1
  const notInformedCount = records.filter((r) => r.staff_informed === false).length;
  if (notInformedCount >= 1) {
    alerts.push({
      type: "staff_not_informed",
      severity: "high",
      message: `${notInformedCount} ${notInformedCount === 1 ? "dip has" : "dips have"} staff not yet informed.`,
      id: "staff_not_informed",
    });
  }

  // No support offered — high, count >= 1
  const noSupportCount = records.filter((r) => r.support_offered === false).length;
  if (noSupportCount >= 1) {
    alerts.push({
      type: "no_support_offered",
      severity: "high",
      message: `${noSupportCount} ${noSupportCount === 1 ? "dip has" : "dips have"} no support offered.`,
      id: "no_support_offered",
    });
  }

  // Triggers not explored — medium, count >= 2
  const triggersNotExploredCount = records.filter((r) => r.triggers_explored === false).length;
  if (triggersNotExploredCount >= 2) {
    alerts.push({
      type: "triggers_not_explored",
      severity: "medium",
      message: `${triggersNotExploredCount} dips have underlying triggers not explored.`,
      id: "triggers_not_explored",
    });
  }

  // No wellbeing check — medium, count >= 2
  const noWellbeingCount = records.filter((r) => r.wellbeing_assessed === false).length;
  if (noWellbeingCount >= 2) {
    alerts.push({
      type: "no_wellbeing_check",
      severity: "medium",
      message: `${noWellbeingCount} dips have no wellbeing assessment completed.`,
      id: "no_wellbeing_check",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listPerformanceDips(
  homeId: string,
  filters?: {
    staffName?: string;
    dipCategory?: DipCategory;
    dipSeverity?: DipSeverity;
    dipStatus?: DipStatus;
    frequencyPattern?: FrequencyPattern;
    limit?: number;
  },
): Promise<ServiceResult<StaffPerformanceDipRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_staff_performance_dips") as SB).select("*").eq("home_id", homeId);
  if (filters?.staffName) q = q.eq("staff_name", filters.staffName);
  if (filters?.dipCategory) q = q.eq("dip_category", filters.dipCategory);
  if (filters?.dipSeverity) q = q.eq("dip_severity", filters.dipSeverity);
  if (filters?.dipStatus) q = q.eq("dip_status", filters.dipStatus);
  if (filters?.frequencyPattern) q = q.eq("frequency_pattern", filters.frequencyPattern);
  q = q.order("session_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createPerformanceDip(
  input: {
    homeId: string;
    staffName: string;
    staffId?: string | null;
    dipCategory: DipCategory;
    dipSeverity: DipSeverity;
    dipStatus?: DipStatus;
    frequencyPattern: FrequencyPattern;
    sessionDate: string;
    identifiedBy: string;
    description: string;
    evidenceSummary: string;
    possibleTriggers?: string | null;
    supportOfferedDetail?: string | null;
    managerResponse?: string | null;
    staffResponse?: string | null;
    evidenceDocumented?: boolean;
    managerAware?: boolean;
    staffInformed?: boolean;
    supportOffered?: boolean;
    triggersExplored?: boolean;
    supervisionDiscussed?: boolean;
    trainingConsidered?: boolean;
    wellbeingAssessed?: boolean;
    actionPlanCreated?: boolean;
    staffResponded?: boolean;
    followUpScheduled?: boolean;
    recordedPromptly?: boolean;
    issuesFound?: string[];
    actionsTaken?: string[];
    nextReviewDate?: string | null;
    notes?: string | null;
  },
): Promise<ServiceResult<StaffPerformanceDipRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_staff_performance_dips") as SB)
    .insert({
      home_id: input.homeId,
      staff_name: input.staffName,
      staff_id: input.staffId ?? null,
      dip_category: input.dipCategory,
      dip_severity: input.dipSeverity,
      dip_status: input.dipStatus ?? "identified",
      frequency_pattern: input.frequencyPattern,
      session_date: input.sessionDate,
      identified_by: input.identifiedBy,
      description: input.description,
      evidence_summary: input.evidenceSummary,
      possible_triggers: input.possibleTriggers ?? null,
      support_offered_detail: input.supportOfferedDetail ?? null,
      manager_response: input.managerResponse ?? null,
      staff_response: input.staffResponse ?? null,
      evidence_documented: input.evidenceDocumented ?? true,
      manager_aware: input.managerAware ?? true,
      staff_informed: input.staffInformed ?? false,
      support_offered: input.supportOffered ?? false,
      triggers_explored: input.triggersExplored ?? false,
      supervision_discussed: input.supervisionDiscussed ?? false,
      training_considered: input.trainingConsidered ?? false,
      wellbeing_assessed: input.wellbeingAssessed ?? false,
      action_plan_created: input.actionPlanCreated ?? false,
      staff_responded: input.staffResponded ?? false,
      follow_up_scheduled: input.followUpScheduled ?? false,
      recorded_promptly: input.recordedPromptly ?? true,
      issues_found: input.issuesFound ?? [],
      actions_taken: input.actionsTaken ?? [],
      next_review_date: input.nextReviewDate ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updatePerformanceDip(
  id: string,
  updates: Partial<{
    staffName: string;
    staffId: string | null;
    dipCategory: DipCategory;
    dipSeverity: DipSeverity;
    dipStatus: DipStatus;
    frequencyPattern: FrequencyPattern;
    sessionDate: string;
    identifiedBy: string;
    description: string;
    evidenceSummary: string;
    possibleTriggers: string | null;
    supportOfferedDetail: string | null;
    managerResponse: string | null;
    staffResponse: string | null;
    evidenceDocumented: boolean;
    managerAware: boolean;
    staffInformed: boolean;
    supportOffered: boolean;
    triggersExplored: boolean;
    supervisionDiscussed: boolean;
    trainingConsidered: boolean;
    wellbeingAssessed: boolean;
    actionPlanCreated: boolean;
    staffResponded: boolean;
    followUpScheduled: boolean;
    recordedPromptly: boolean;
    issuesFound: string[];
    actionsTaken: string[];
    nextReviewDate: string | null;
    notes: string | null;
  }>,
): Promise<ServiceResult<StaffPerformanceDipRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.staffName !== undefined) mapped.staff_name = updates.staffName;
  if (updates.staffId !== undefined) mapped.staff_id = updates.staffId;
  if (updates.dipCategory !== undefined) mapped.dip_category = updates.dipCategory;
  if (updates.dipSeverity !== undefined) mapped.dip_severity = updates.dipSeverity;
  if (updates.dipStatus !== undefined) mapped.dip_status = updates.dipStatus;
  if (updates.frequencyPattern !== undefined) mapped.frequency_pattern = updates.frequencyPattern;
  if (updates.sessionDate !== undefined) mapped.session_date = updates.sessionDate;
  if (updates.identifiedBy !== undefined) mapped.identified_by = updates.identifiedBy;
  if (updates.description !== undefined) mapped.description = updates.description;
  if (updates.evidenceSummary !== undefined) mapped.evidence_summary = updates.evidenceSummary;
  if (updates.possibleTriggers !== undefined) mapped.possible_triggers = updates.possibleTriggers;
  if (updates.supportOfferedDetail !== undefined) mapped.support_offered_detail = updates.supportOfferedDetail;
  if (updates.managerResponse !== undefined) mapped.manager_response = updates.managerResponse;
  if (updates.staffResponse !== undefined) mapped.staff_response = updates.staffResponse;
  if (updates.evidenceDocumented !== undefined) mapped.evidence_documented = updates.evidenceDocumented;
  if (updates.managerAware !== undefined) mapped.manager_aware = updates.managerAware;
  if (updates.staffInformed !== undefined) mapped.staff_informed = updates.staffInformed;
  if (updates.supportOffered !== undefined) mapped.support_offered = updates.supportOffered;
  if (updates.triggersExplored !== undefined) mapped.triggers_explored = updates.triggersExplored;
  if (updates.supervisionDiscussed !== undefined) mapped.supervision_discussed = updates.supervisionDiscussed;
  if (updates.trainingConsidered !== undefined) mapped.training_considered = updates.trainingConsidered;
  if (updates.wellbeingAssessed !== undefined) mapped.wellbeing_assessed = updates.wellbeingAssessed;
  if (updates.actionPlanCreated !== undefined) mapped.action_plan_created = updates.actionPlanCreated;
  if (updates.staffResponded !== undefined) mapped.staff_responded = updates.staffResponded;
  if (updates.followUpScheduled !== undefined) mapped.follow_up_scheduled = updates.followUpScheduled;
  if (updates.recordedPromptly !== undefined) mapped.recorded_promptly = updates.recordedPromptly;
  if (updates.issuesFound !== undefined) mapped.issues_found = updates.issuesFound;
  if (updates.actionsTaken !== undefined) mapped.actions_taken = updates.actionsTaken;
  if (updates.nextReviewDate !== undefined) mapped.next_review_date = updates.nextReviewDate;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  const { data, error } = await (s.from("cs_staff_performance_dips") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computePerformanceDipMetrics,
  identifyPerformanceDipAlerts,
};
