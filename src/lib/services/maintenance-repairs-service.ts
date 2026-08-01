// ══════════════════════════════════════════════════════════════════════════════
// CARA — MAINTENANCE & REPAIRS SERVICE
// Tracks building maintenance, repair requests, contractor management,
// PAT testing, planned maintenance, and premises compliance.
// CHR 2015 Reg 36 (fitness of premises — maintenance),
// Reg 25 (health and safety — safe environment),
// Reg 13 (leadership — premises oversight).
//
// Covers: repair requests, contractor visits, PAT testing,
// gas safety certificates, planned maintenance schedules, and compliance.
//
// SCCIF: Helped & Protected — "Premises are well maintained."
// "The home environment is safe and homely."
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

export type MaintenanceType =
  | "repair_request"
  | "planned_maintenance"
  | "pat_testing"
  | "gas_safety"
  | "electrical_inspection"
  | "plumbing"
  | "decorating"
  | "garden_grounds"
  | "appliance_repair"
  | "other";

export type MaintenancePriority =
  | "emergency"
  | "urgent"
  | "routine"
  | "low"
  | "planned";

export type MaintenanceStatus =
  | "reported"
  | "acknowledged"
  | "in_progress"
  | "awaiting_parts"
  | "completed"
  | "cancelled";

export type ContractorStatus =
  | "approved"
  | "pending_approval"
  | "dbs_checked"
  | "not_required"
  | "rejected";

export interface MaintenanceRecord {
  id: string;
  home_id: string;
  maintenance_type: MaintenanceType;
  reported_date: string;
  completed_date: string | null;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  description: string;
  location: string;
  contractor_used: boolean;
  contractor_name: string | null;
  contractor_status: ContractorStatus;
  cost: number | null;
  children_impact_assessed: boolean;
  safeguarding_check_completed: boolean;
  certificate_obtained: boolean;
  days_to_completion: number | null;
  reported_by: string;
  completed_by: string | null;
  issues_found: string[];
  actions_taken: string[];
  next_due_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const MAINTENANCE_TYPES: { type: MaintenanceType; label: string }[] = [
  { type: "repair_request", label: "Repair Request" },
  { type: "planned_maintenance", label: "Planned Maintenance" },
  { type: "pat_testing", label: "PAT Testing" },
  { type: "gas_safety", label: "Gas Safety" },
  { type: "electrical_inspection", label: "Electrical Inspection" },
  { type: "plumbing", label: "Plumbing" },
  { type: "decorating", label: "Decorating" },
  { type: "garden_grounds", label: "Garden & Grounds" },
  { type: "appliance_repair", label: "Appliance Repair" },
  { type: "other", label: "Other" },
];

export const MAINTENANCE_PRIORITIES: { priority: MaintenancePriority; label: string }[] = [
  { priority: "emergency", label: "Emergency" },
  { priority: "urgent", label: "Urgent" },
  { priority: "routine", label: "Routine" },
  { priority: "low", label: "Low" },
  { priority: "planned", label: "Planned" },
];

export const MAINTENANCE_STATUSES: { status: MaintenanceStatus; label: string }[] = [
  { status: "reported", label: "Reported" },
  { status: "acknowledged", label: "Acknowledged" },
  { status: "in_progress", label: "In Progress" },
  { status: "awaiting_parts", label: "Awaiting Parts" },
  { status: "completed", label: "Completed" },
  { status: "cancelled", label: "Cancelled" },
];

export const CONTRACTOR_STATUSES: { status: ContractorStatus; label: string }[] = [
  { status: "approved", label: "Approved" },
  { status: "pending_approval", label: "Pending Approval" },
  { status: "dbs_checked", label: "DBS Checked" },
  { status: "not_required", label: "Not Required" },
  { status: "rejected", label: "Rejected" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeMaintenanceMetrics(
  records: MaintenanceRecord[],
): {
  total_records: number;
  repair_request_count: number;
  planned_maintenance_count: number;
  pat_testing_count: number;
  completed_count: number;
  open_count: number;
  completion_rate: number | null;
  emergency_count: number;
  urgent_count: number;
  average_days_to_completion: number | null;
  total_cost: number;
  contractor_used_rate: number | null;
  children_impact_assessed_rate: number | null;
  safeguarding_check_rate: number | null;
  certificate_obtained_rate: number | null;
  overdue_count: number;
  by_maintenance_type: Record<string, number>;
  by_priority: Record<string, number>;
  by_status: Record<string, number>;
  by_contractor_status: Record<string, number>;
} {
  const repair = records.filter((r) => r.maintenance_type === "repair_request").length;
  const planned = records.filter((r) => r.maintenance_type === "planned_maintenance").length;
  const pat = records.filter((r) => r.maintenance_type === "pat_testing").length;

  const completed = records.filter((r) => r.status === "completed").length;
  const open = records.filter(
    (r) => r.status !== "completed" && r.status !== "cancelled",
  ).length;
  const completionRate =
    records.length > 0
      ? Math.round((completed / records.length) * 1000) / 10
      : null;

  const emergency = records.filter((r) => r.priority === "emergency").length;
  const urgent = records.filter((r) => r.priority === "urgent").length;

  const daysRecords = records.filter((r) => r.days_to_completion !== null);
  const avgDays =
    daysRecords.length > 0
      ? Math.round(
          (daysRecords.reduce((sum, r) => sum + r.days_to_completion!, 0) / daysRecords.length) * 10,
        ) / 10
      : null;

  const totalCost = Math.round(
    records.filter((r) => r.cost !== null).reduce((sum, r) => sum + r.cost!, 0) * 100,
  ) / 100;

  const contractorUsed = records.filter((r) => r.contractor_used).length;
  const contractorRate =
    records.length > 0
      ? Math.round((contractorUsed / records.length) * 1000) / 10
      : null;

  const childImpact = records.filter((r) => r.children_impact_assessed).length;
  const childImpactRate =
    records.length > 0
      ? Math.round((childImpact / records.length) * 1000) / 10
      : null;

  const sgCheck = records.filter((r) => r.safeguarding_check_completed).length;
  const sgRate =
    records.length > 0
      ? Math.round((sgCheck / records.length) * 1000) / 10
      : null;

  const cert = records.filter((r) => r.certificate_obtained).length;
  const certRate =
    records.length > 0
      ? Math.round((cert / records.length) * 1000) / 10
      : null;

  const now = new Date();
  const overdue = records.filter((r) => {
    if (!r.next_due_date) return false;
    return new Date(r.next_due_date) < now;
  }).length;

  const byType: Record<string, number> = {};
  for (const r of records) byType[r.maintenance_type] = (byType[r.maintenance_type] ?? 0) + 1;

  const byPriority: Record<string, number> = {};
  for (const r of records) byPriority[r.priority] = (byPriority[r.priority] ?? 0) + 1;

  const byStatus: Record<string, number> = {};
  for (const r of records) byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;

  const byContractor: Record<string, number> = {};
  for (const r of records) byContractor[r.contractor_status] = (byContractor[r.contractor_status] ?? 0) + 1;

  return {
    total_records: records.length,
    repair_request_count: repair,
    planned_maintenance_count: planned,
    pat_testing_count: pat,
    completed_count: completed,
    open_count: open,
    completion_rate: completionRate,
    emergency_count: emergency,
    urgent_count: urgent,
    average_days_to_completion: avgDays,
    total_cost: totalCost,
    contractor_used_rate: contractorRate,
    children_impact_assessed_rate: childImpactRate,
    safeguarding_check_rate: sgRate,
    certificate_obtained_rate: certRate,
    overdue_count: overdue,
    by_maintenance_type: byType,
    by_priority: byPriority,
    by_status: byStatus,
    by_contractor_status: byContractor,
  };
}

export function identifyMaintenanceAlerts(
  records: MaintenanceRecord[],
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

  // Emergency repairs not completed
  for (const r of records) {
    if (r.priority === "emergency" && r.status !== "completed" && r.status !== "cancelled") {
      alerts.push({
        type: "emergency_outstanding",
        severity: "critical",
        message: `Emergency repair outstanding: ${r.description} reported on ${r.reported_date} — resolve immediately`,
        id: r.id,
      });
    }
  }

  // Contractor without safeguarding check
  for (const r of records) {
    if (r.contractor_used && !r.safeguarding_check_completed && r.status !== "cancelled") {
      alerts.push({
        type: "contractor_no_safeguarding",
        severity: "critical",
        message: `Contractor ${r.contractor_name ?? "unknown"} used without safeguarding check on ${r.reported_date}`,
        id: r.id,
      });
    }
  }

  // Urgent repairs outstanding
  const urgentOpen = records.filter(
    (r) => r.priority === "urgent" && r.status !== "completed" && r.status !== "cancelled",
  ).length;
  if (urgentOpen >= 1) {
    alerts.push({
      type: "urgent_outstanding",
      severity: "high",
      message: `${urgentOpen} urgent ${urgentOpen === 1 ? "repair" : "repairs"} outstanding — prioritise completion`,
      id: "urgent_outstanding",
    });
  }

  // Children impact not assessed
  const noImpact = records.filter(
    (r) => !r.children_impact_assessed && r.status !== "cancelled",
  ).length;
  if (noImpact >= 3) {
    alerts.push({
      type: "no_impact_assessment",
      severity: "medium",
      message: `${noImpact} maintenance jobs without children impact assessment — ensure safety considered`,
      id: "no_impact_assessment",
    });
  }

  // Overdue maintenance
  const now = new Date();
  const overdue = records.filter((r) => {
    if (!r.next_due_date) return false;
    return new Date(r.next_due_date) < now;
  }).length;
  if (overdue >= 1) {
    alerts.push({
      type: "maintenance_overdue",
      severity: "medium",
      message: `${overdue} planned maintenance ${overdue === 1 ? "item is" : "items are"} overdue — schedule promptly`,
      id: "maintenance_overdue",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    maintenanceType?: MaintenanceType;
    priority?: MaintenancePriority;
    status?: MaintenanceStatus;
    limit?: number;
  },
): Promise<ServiceResult<MaintenanceRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_maintenance_repairs") as SB).select("*").eq("home_id", homeId);
  if (filters?.maintenanceType) q = q.eq("maintenance_type", filters.maintenanceType);
  if (filters?.priority) q = q.eq("priority", filters.priority);
  if (filters?.status) q = q.eq("status", filters.status);
  q = q.order("reported_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  input: {
    homeId: string;
    maintenanceType: MaintenanceType;
    reportedDate: string;
    completedDate?: string;
    priority: MaintenancePriority;
    status: MaintenanceStatus;
    description: string;
    location: string;
    contractorUsed: boolean;
    contractorName?: string;
    contractorStatus: ContractorStatus;
    cost?: number;
    childrenImpactAssessed: boolean;
    safeguardingCheckCompleted: boolean;
    certificateObtained: boolean;
    daysToCompletion?: number;
    reportedBy: string;
    completedBy?: string;
    issuesFound: string[];
    actionsTaken: string[];
    nextDueDate?: string;
    notes?: string;
  },
): Promise<ServiceResult<MaintenanceRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_maintenance_repairs") as SB)
    .insert({
      home_id: input.homeId,
      maintenance_type: input.maintenanceType,
      reported_date: input.reportedDate,
      completed_date: input.completedDate ?? null,
      priority: input.priority,
      status: input.status,
      description: input.description,
      location: input.location,
      contractor_used: input.contractorUsed,
      contractor_name: input.contractorName ?? null,
      contractor_status: input.contractorStatus,
      cost: input.cost ?? null,
      children_impact_assessed: input.childrenImpactAssessed,
      safeguarding_check_completed: input.safeguardingCheckCompleted,
      certificate_obtained: input.certificateObtained,
      days_to_completion: input.daysToCompletion ?? null,
      reported_by: input.reportedBy,
      completed_by: input.completedBy ?? null,
      issues_found: input.issuesFound,
      actions_taken: input.actionsTaken,
      next_due_date: input.nextDueDate ?? null,
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
): Promise<ServiceResult<MaintenanceRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_maintenance_repairs") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeMaintenanceMetrics,
  identifyMaintenanceAlerts,
};
