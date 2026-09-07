// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME IMPROVEMENT SERVICE
// Tracks renovation projects, accessibility modifications, room
// personalisation, environmental upgrades, and capital works.
// CHR 2015 Reg 25 (premises — maintained in good repair),
// Reg 36 (fitness of premises — suitable for purpose),
// Reg 15 (quality standards — homely environment).
//
// Covers: refurbishment projects, accessibility adaptations, children's
// room personalisation, garden improvements, energy upgrades,
// safety modifications, and decorative works.
//
// SCCIF: Overall Experiences — "The home is welcoming and homely."
// "Children's rooms reflect their personality and preferences."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import { todayStr } from "@/lib/utils";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type ProjectType =
  | "refurbishment"
  | "accessibility_adaptation"
  | "room_personalisation"
  | "garden_improvement"
  | "energy_upgrade"
  | "safety_modification"
  | "decorative_works"
  | "structural_repair"
  | "bathroom_kitchen_refit"
  | "other";

export type ProjectStatus =
  | "proposed"
  | "approved"
  | "in_progress"
  | "completed"
  | "on_hold"
  | "cancelled";

export type PriorityLevel =
  | "urgent"
  | "high"
  | "medium"
  | "low"
  | "cosmetic";

export type FundingSource =
  | "home_budget"
  | "local_authority"
  | "grant"
  | "fundraising"
  | "donation"
  | "mixed";

export interface HomeImprovementRecord {
  id: string;
  home_id: string;
  project_type: ProjectType;
  project_status: ProjectStatus;
  priority_level: PriorityLevel;
  funding_source: FundingSource;
  project_name: string;
  description: string;
  location_in_home: string;
  start_date: string | null;
  target_completion_date: string | null;
  actual_completion_date: string | null;
  estimated_cost: number | null;
  actual_cost: number | null;
  contractor_name: string | null;
  children_consulted: boolean;
  children_involved: boolean;
  child_room_personalisation: boolean;
  accessibility_improvement: boolean;
  energy_efficiency_improvement: boolean;
  safety_improvement: boolean;
  planning_permission_required: boolean;
  planning_permission_obtained: boolean;
  building_regs_compliant: boolean;
  fire_safety_maintained: boolean;
  disruption_minimised: boolean;
  issues_found: string[];
  actions_taken: string[];
  managed_by: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const PROJECT_TYPES: { type: ProjectType; label: string }[] = [
  { type: "refurbishment", label: "Refurbishment" },
  { type: "accessibility_adaptation", label: "Accessibility Adaptation" },
  { type: "room_personalisation", label: "Room Personalisation" },
  { type: "garden_improvement", label: "Garden Improvement" },
  { type: "energy_upgrade", label: "Energy Upgrade" },
  { type: "safety_modification", label: "Safety Modification" },
  { type: "decorative_works", label: "Decorative Works" },
  { type: "structural_repair", label: "Structural Repair" },
  { type: "bathroom_kitchen_refit", label: "Bathroom/Kitchen Refit" },
  { type: "other", label: "Other" },
];

export const PROJECT_STATUSES: { status: ProjectStatus; label: string }[] = [
  { status: "proposed", label: "Proposed" },
  { status: "approved", label: "Approved" },
  { status: "in_progress", label: "In Progress" },
  { status: "completed", label: "Completed" },
  { status: "on_hold", label: "On Hold" },
  { status: "cancelled", label: "Cancelled" },
];

export const PRIORITY_LEVELS: { level: PriorityLevel; label: string }[] = [
  { level: "urgent", label: "Urgent" },
  { level: "high", label: "High" },
  { level: "medium", label: "Medium" },
  { level: "low", label: "Low" },
  { level: "cosmetic", label: "Cosmetic" },
];

export const FUNDING_SOURCES: { source: FundingSource; label: string }[] = [
  { source: "home_budget", label: "Home Budget" },
  { source: "local_authority", label: "Local Authority" },
  { source: "grant", label: "Grant" },
  { source: "fundraising", label: "Fundraising" },
  { source: "donation", label: "Donation" },
  { source: "mixed", label: "Mixed" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeHomeImprovementMetrics(
  records: HomeImprovementRecord[],
): {
  total_projects: number;
  completed_count: number;
  in_progress_count: number;
  proposed_count: number;
  on_hold_count: number;
  completion_rate: number | null;
  urgent_count: number;
  overdue_count: number;
  total_estimated_cost: number;
  total_actual_cost: number;
  children_consulted_rate: number | null;
  children_involved_rate: number | null;
  personalisation_count: number;
  accessibility_count: number;
  safety_improvement_rate: number | null;
  fire_safety_maintained_rate: number | null;
  building_regs_compliant_rate: number | null;
  by_project_type: Record<string, number>;
  by_project_status: Record<string, number>;
  by_priority_level: Record<string, number>;
  by_funding_source: Record<string, number>;
} {
  const completed = records.filter((r) => r.project_status === "completed").length;
  const inProgress = records.filter((r) => r.project_status === "in_progress").length;
  const proposed = records.filter((r) => r.project_status === "proposed").length;
  const onHold = records.filter((r) => r.project_status === "on_hold").length;

  const completionRate =
    records.length > 0
      ? Math.round((completed / records.length) * 1000) / 10
      : null;

  const urgent = records.filter((r) => r.priority_level === "urgent").length;

  const today = todayStr();
  const overdue = records.filter(
    (r) =>
      r.target_completion_date &&
      r.target_completion_date < today &&
      r.project_status !== "completed" &&
      r.project_status !== "cancelled",
  ).length;

  const estCosts = records
    .filter((r) => r.estimated_cost !== null)
    .map((r) => r.estimated_cost!);
  const totalEstCost = Math.round(estCosts.reduce((a, b) => a + b, 0) * 100) / 100;

  const actCosts = records
    .filter((r) => r.actual_cost !== null)
    .map((r) => r.actual_cost!);
  const totalActCost = Math.round(actCosts.reduce((a, b) => a + b, 0) * 100) / 100;

  // Rated over the records where the question was answered either way. With the
  // judgement columns tri-state (null = not recorded), an unrecorded answer in
  // the denominator would score silence as a "no" — the same fabrication the
  // old `?? true` creates made in the other direction. While every field is
  // still a strict boolean this is behaviour-identical.
  const boolRate = (field: keyof HomeImprovementRecord) => {
    const recorded = records.filter((r) => r[field] !== null && r[field] !== undefined);
    const count = recorded.filter((r) => r[field] === true).length;
    return recorded.length > 0
      ? Math.round((count / recorded.length) * 1000) / 10
      : null;
  };

  const personalisation = records.filter((r) => r.child_room_personalisation).length;
  const accessibility = records.filter((r) => r.accessibility_improvement).length;

  const byType: Record<string, number> = {};
  for (const r of records) byType[r.project_type] = (byType[r.project_type] ?? 0) + 1;

  const byStatus: Record<string, number> = {};
  for (const r of records) byStatus[r.project_status] = (byStatus[r.project_status] ?? 0) + 1;

  const byPriority: Record<string, number> = {};
  for (const r of records) byPriority[r.priority_level] = (byPriority[r.priority_level] ?? 0) + 1;

  const byFunding: Record<string, number> = {};
  for (const r of records) byFunding[r.funding_source] = (byFunding[r.funding_source] ?? 0) + 1;

  return {
    total_projects: records.length,
    completed_count: completed,
    in_progress_count: inProgress,
    proposed_count: proposed,
    on_hold_count: onHold,
    completion_rate: completionRate,
    urgent_count: urgent,
    overdue_count: overdue,
    total_estimated_cost: totalEstCost,
    total_actual_cost: totalActCost,
    children_consulted_rate: boolRate("children_consulted"),
    children_involved_rate: boolRate("children_involved"),
    personalisation_count: personalisation,
    accessibility_count: accessibility,
    safety_improvement_rate: boolRate("safety_improvement"),
    fire_safety_maintained_rate: boolRate("fire_safety_maintained"),
    building_regs_compliant_rate: boolRate("building_regs_compliant"),
    by_project_type: byType,
    by_project_status: byStatus,
    by_priority_level: byPriority,
    by_funding_source: byFunding,
  };
}

export function identifyHomeImprovementAlerts(
  records: HomeImprovementRecord[],
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

  // Fire safety not maintained during works
  for (const r of records) {
    if (!r.fire_safety_maintained && r.project_status === "in_progress") {
      alerts.push({
        type: "fire_safety_risk",
        severity: "critical",
        message: `Fire safety not maintained during "${r.project_name}" — address immediately`,
        id: r.id,
      });
    }
  }

  // Overdue projects
  const today = todayStr();
  const overdue = records.filter(
    (r) =>
      r.target_completion_date &&
      r.target_completion_date < today &&
      r.project_status !== "completed" &&
      r.project_status !== "cancelled",
  ).length;
  if (overdue >= 1) {
    alerts.push({
      type: "overdue_project",
      severity: "high",
      message: `${overdue} ${overdue === 1 ? "project is" : "projects are"} overdue — review timelines and prioritise`,
      id: "overdue_project",
    });
  }

  // Urgent projects not started
  const urgentNotStarted = records.filter(
    (r) => r.priority_level === "urgent" && r.project_status === "proposed",
  ).length;
  if (urgentNotStarted >= 1) {
    alerts.push({
      type: "urgent_not_started",
      severity: "high",
      message: `${urgentNotStarted} urgent ${urgentNotStarted === 1 ? "project has" : "projects have"} not been started — commence work immediately`,
      id: "urgent_not_started",
    });
  }

  // Children not consulted
  const notConsulted = records.filter(
    (r) => !r.children_consulted && r.project_status !== "cancelled",
  ).length;
  if (notConsulted >= 3) {
    alerts.push({
      type: "children_not_consulted",
      severity: "medium",
      message: `${notConsulted} projects without children being consulted — involve young people in decisions`,
      id: "children_not_consulted",
    });
  }

  // Building regs not compliant
  const nonCompliant = records.filter(
    (r) => !r.building_regs_compliant && r.project_status === "in_progress",
  ).length;
  if (nonCompliant >= 1) {
    alerts.push({
      type: "building_regs_non_compliant",
      severity: "medium",
      message: `${nonCompliant} in-progress ${nonCompliant === 1 ? "project is" : "projects are"} not building regulations compliant — obtain approval`,
      id: "building_regs_non_compliant",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    projectType?: ProjectType;
    projectStatus?: ProjectStatus;
    priorityLevel?: PriorityLevel;
    limit?: number;
  },
): Promise<ServiceResult<HomeImprovementRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_home_improvements") as SB).select("*").eq("home_id", homeId);
  if (filters?.projectType) q = q.eq("project_type", filters.projectType);
  if (filters?.projectStatus) q = q.eq("project_status", filters.projectStatus);
  if (filters?.priorityLevel) q = q.eq("priority_level", filters.priorityLevel);
  q = q.order("created_at", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  input: {
    homeId: string;
    projectType: ProjectType;
    projectStatus: ProjectStatus;
    priorityLevel: PriorityLevel;
    fundingSource: FundingSource;
    projectName: string;
    description: string;
    locationInHome: string;
    startDate?: string;
    targetCompletionDate?: string;
    actualCompletionDate?: string;
    estimatedCost?: number;
    actualCost?: number;
    contractorName?: string;
    childrenConsulted: boolean;
    childrenInvolved: boolean;
    childRoomPersonalisation: boolean;
    accessibilityImprovement: boolean;
    energyEfficiencyImprovement: boolean;
    safetyImprovement: boolean;
    planningPermissionRequired: boolean;
    planningPermissionObtained: boolean;
    buildingRegsCompliant: boolean;
    fireSafetyMaintained: boolean;
    disruptionMinimised: boolean;
    issuesFound: string[];
    actionsTaken: string[];
    managedBy: string;
    notes?: string;
  },
): Promise<ServiceResult<HomeImprovementRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_home_improvements") as SB)
    .insert({
      home_id: input.homeId,
      project_type: input.projectType,
      project_status: input.projectStatus,
      priority_level: input.priorityLevel,
      funding_source: input.fundingSource,
      project_name: input.projectName,
      description: input.description,
      location_in_home: input.locationInHome,
      start_date: input.startDate ?? null,
      target_completion_date: input.targetCompletionDate ?? null,
      actual_completion_date: input.actualCompletionDate ?? null,
      estimated_cost: input.estimatedCost ?? null,
      actual_cost: input.actualCost ?? null,
      contractor_name: input.contractorName ?? null,
      children_consulted: input.childrenConsulted,
      children_involved: input.childrenInvolved,
      child_room_personalisation: input.childRoomPersonalisation,
      accessibility_improvement: input.accessibilityImprovement,
      energy_efficiency_improvement: input.energyEfficiencyImprovement,
      safety_improvement: input.safetyImprovement,
      planning_permission_required: input.planningPermissionRequired,
      planning_permission_obtained: input.planningPermissionObtained,
      building_regs_compliant: input.buildingRegsCompliant,
      fire_safety_maintained: input.fireSafetyMaintained,
      disruption_minimised: input.disruptionMinimised,
      issues_found: input.issuesFound,
      actions_taken: input.actionsTaken,
      managed_by: input.managedBy,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateRecord(
  id: string,
  updates: Partial<Record<string, unknown>>,
): Promise<ServiceResult<HomeImprovementRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_home_improvements") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeHomeImprovementMetrics,
  identifyHomeImprovementAlerts,
};
