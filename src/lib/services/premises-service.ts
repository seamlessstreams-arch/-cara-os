// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — PREMISES & MAINTENANCE SERVICE
// Manages premises safety checks (CHR 2015 Reg 25), fire safety compliance,
// maintenance requests, and statutory inspection tracking.
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

export interface PremisesCheck {
  id: string;
  home_id: string;
  check_type: string;
  check_date: string;
  completed_by: string;
  result: string; // "pass", "fail", "partial", "not_applicable"
  notes?: string | null;
  issues_found: string[];
  follow_up_required: boolean;
  follow_up_date?: string | null;
  certificate_reference?: string | null;
  created_at: string;
}

export interface MaintenanceRequest {
  id: string;
  home_id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  location: string;
  reported_by: string;
  reported_date: string;
  assigned_to?: string | null;
  estimated_cost?: number | null;
  actual_cost?: number | null;
  completion_date?: string | null;
  status: string; // "open", "in_progress", "awaiting_parts", "completed", "cancelled"
  child_safety_risk: boolean;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const CHECK_TYPES: {
  type: string;
  label: string;
  frequency_days: number;
  statutory: boolean;
}[] = [
  { type: "fire_alarm_test", label: "Fire Alarm Test", frequency_days: 7, statutory: true },
  { type: "emergency_lighting", label: "Emergency Lighting Test", frequency_days: 30, statutory: true },
  { type: "fire_extinguisher", label: "Fire Extinguisher Check", frequency_days: 365, statutory: true },
  { type: "fire_risk_assessment", label: "Fire Risk Assessment", frequency_days: 365, statutory: true },
  { type: "fire_drill", label: "Fire Drill", frequency_days: 90, statutory: true },
  { type: "legionella", label: "Legionella Check", frequency_days: 30, statutory: true },
  { type: "pat_testing", label: "PAT Testing", frequency_days: 365, statutory: true },
  { type: "gas_safety", label: "Gas Safety Certificate", frequency_days: 365, statutory: true },
  { type: "electrical_inspection", label: "Electrical Inspection (EICR)", frequency_days: 1825, statutory: true },
  { type: "h_and_s_audit", label: "Health & Safety Audit", frequency_days: 90, statutory: false },
  { type: "vehicle_check", label: "Vehicle Check", frequency_days: 7, statutory: false },
  { type: "water_temperature", label: "Water Temperature Check", frequency_days: 30, statutory: false },
];

export const MAINTENANCE_PRIORITIES: string[] = ["urgent", "high", "medium", "low"];

export const MAINTENANCE_CATEGORIES: string[] = [
  "plumbing", "electrical", "structural", "decoration", "garden_grounds",
  "heating_cooling", "security", "fire_safety", "furniture", "appliances",
  "windows_doors", "roofing", "other",
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

/**
 * Compute premises compliance metrics from a set of checks.
 * Evaluates pass rates, overdue statutory checks, and pending follow-ups.
 */
export function computePremisesCompliance(checks: PremisesCheck[]): {
  total_checks: number;
  pass_rate: number;
  fail_count: number;
  overdue_checks: { check_type: string; label: string; last_done: string | null; days_overdue: number }[];
  statutory_compliance_rate: number;
  follow_ups_pending: number;
  issues_found_count: number;
} {
  const now = new Date();

  // Pass rate: pass / (pass + fail + partial) * 100, ignore not_applicable
  let passCount = 0;
  let failCount = 0;
  let partialCount = 0;
  let issuesFoundCount = 0;
  let followUpsPending = 0;

  for (const c of checks) {
    if (c.result === "pass") passCount++;
    else if (c.result === "fail") failCount++;
    else if (c.result === "partial") partialCount++;

    issuesFoundCount += c.issues_found.length;

    // Follow-up pending: follow_up_required and either no follow_up_date or follow_up_date in the future
    if (c.follow_up_required) {
      if (!c.follow_up_date || new Date(c.follow_up_date).getTime() > now.getTime()) {
        followUpsPending++;
      }
    }
  }

  const applicableDenominator = passCount + failCount + partialCount;
  const passRate =
    applicableDenominator > 0
      ? Math.round((passCount / applicableDenominator) * 1000) / 10
      : 100;

  // Overdue checks: for each CHECK_TYPES entry, find last check_date, check if overdue
  const overdueChecks: { check_type: string; label: string; last_done: string | null; days_overdue: number }[] = [];
  let statutoryUpToDate = 0;
  const statutoryTotal = CHECK_TYPES.filter((ct) => ct.statutory).length;

  for (const ct of CHECK_TYPES) {
    const matching = checks
      .filter((c) => c.check_type === ct.type)
      .sort((a, b) => new Date(b.check_date).getTime() - new Date(a.check_date).getTime());

    const lastDone = matching.length > 0 ? matching[0].check_date : null;

    if (!lastDone) {
      // Never done — overdue by definition
      overdueChecks.push({
        check_type: ct.type,
        label: ct.label,
        last_done: null,
        days_overdue: ct.frequency_days,
      });
    } else {
      const nextDue = new Date(lastDone);
      nextDue.setDate(nextDue.getDate() + ct.frequency_days);
      const daysUntil = Math.floor((nextDue.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntil < 0) {
        overdueChecks.push({
          check_type: ct.type,
          label: ct.label,
          last_done: lastDone,
          days_overdue: Math.abs(daysUntil),
        });
      } else if (ct.statutory) {
        // Up to date
        statutoryUpToDate++;
      }
    }
  }

  // Statutory checks that are overdue are NOT up to date, already excluded above
  const statutoryComplianceRate =
    statutoryTotal > 0
      ? Math.round((statutoryUpToDate / statutoryTotal) * 1000) / 10
      : 100;

  return {
    total_checks: checks.length,
    pass_rate: passRate,
    fail_count: failCount,
    overdue_checks: overdueChecks,
    statutory_compliance_rate: statutoryComplianceRate,
    follow_ups_pending: followUpsPending,
    issues_found_count: issuesFoundCount,
  };
}

/**
 * Compute maintenance request summary statistics.
 */
export function computeMaintenanceSummary(requests: MaintenanceRequest[]): {
  total_requests: number;
  open: number;
  in_progress: number;
  completed: number;
  by_priority: Record<string, number>;
  by_category: Record<string, number>;
  avg_resolution_days: number;
  safety_risks_open: number;
  total_cost: number;
  overdue_urgent: number;
} {
  const now = new Date();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

  let openCount = 0;
  let inProgressCount = 0;
  let completedCount = 0;
  let totalResolutionDays = 0;
  let resolvedCount = 0;
  let safetyRisksOpen = 0;
  let totalCost = 0;
  let overdueUrgent = 0;

  const byPriority: Record<string, number> = {};
  const byCategory: Record<string, number> = {};

  for (const r of requests) {
    // Count by status
    if (r.status === "open") openCount++;
    else if (r.status === "in_progress") inProgressCount++;
    else if (r.status === "completed") completedCount++;

    // Count by priority
    byPriority[r.priority] = (byPriority[r.priority] ?? 0) + 1;

    // Count by category
    byCategory[r.category] = (byCategory[r.category] ?? 0) + 1;

    // Average resolution days for completed requests
    if (r.status === "completed" && r.completion_date) {
      const reported = new Date(r.reported_date);
      const completed = new Date(r.completion_date);
      const days = (completed.getTime() - reported.getTime()) / (1000 * 60 * 60 * 24);
      totalResolutionDays += days;
      resolvedCount++;
    }

    // Safety risks: open or in_progress with child_safety_risk
    if ((r.status === "open" || r.status === "in_progress") && r.child_safety_risk) {
      safetyRisksOpen++;
    }

    // Total cost: sum actual_cost of completed
    if (r.status === "completed" && r.actual_cost != null) {
      totalCost += r.actual_cost;
    }

    // Overdue urgent: urgent priority, open or in_progress, reported > 7 days ago
    if (
      r.priority === "urgent" &&
      (r.status === "open" || r.status === "in_progress") &&
      now.getTime() - new Date(r.reported_date).getTime() > sevenDaysMs
    ) {
      overdueUrgent++;
    }
  }

  const avgResolutionDays =
    resolvedCount > 0
      ? Math.round((totalResolutionDays / resolvedCount) * 10) / 10
      : 0;

  return {
    total_requests: requests.length,
    open: openCount,
    in_progress: inProgressCount,
    completed: completedCount,
    by_priority: byPriority,
    by_category: byCategory,
    avg_resolution_days: avgResolutionDays,
    safety_risks_open: safetyRisksOpen,
    total_cost: Math.round(totalCost * 100) / 100,
    overdue_urgent: overdueUrgent,
  };
}

/**
 * Identify premises-related alerts from checks and maintenance requests.
 */
export function identifyPremisesAlerts(
  checks: PremisesCheck[],
  requests: MaintenanceRequest[],
): { type: string; severity: "critical" | "high" | "medium" | "low"; message: string }[] {
  const alerts: { type: string; severity: "critical" | "high" | "medium" | "low"; message: string }[] = [];
  const now = new Date();
  const threeDaysMs = 3 * 24 * 60 * 60 * 1000;

  const FIRE_RELATED_TYPES = [
    "fire_alarm_test", "emergency_lighting", "fire_extinguisher",
    "fire_risk_assessment", "fire_drill",
  ];

  // ── check_overdue: statutory check overdue ──────────────────────────────
  for (const ct of CHECK_TYPES) {
    if (!ct.statutory) continue;

    const matching = checks
      .filter((c) => c.check_type === ct.type)
      .sort((a, b) => new Date(b.check_date).getTime() - new Date(a.check_date).getTime());

    let overdue = false;

    if (matching.length === 0) {
      overdue = true;
    } else {
      const nextDue = new Date(matching[0].check_date);
      nextDue.setDate(nextDue.getDate() + ct.frequency_days);
      if (nextDue.getTime() < now.getTime()) overdue = true;
    }

    if (overdue) {
      const severity = FIRE_RELATED_TYPES.includes(ct.type) ? "critical" : "high";
      alerts.push({
        type: "check_overdue",
        severity,
        message: `${ct.label} is overdue — must be completed every ${ct.frequency_days} days`,
      });
    }
  }

  // ── check_failed: recent check with result "fail" ──────────────────────
  for (const c of checks) {
    if (c.result === "fail") {
      const ctConfig = CHECK_TYPES.find((ct) => ct.type === c.check_type);
      const label = ctConfig?.label ?? c.check_type;
      alerts.push({
        type: "check_failed",
        severity: "high",
        message: `${label} on ${c.check_date} resulted in a fail`,
      });
    }
  }

  // ── safety_risk: maintenance with child_safety_risk open ───────────────
  for (const r of requests) {
    if (
      r.child_safety_risk &&
      (r.status === "open" || r.status === "in_progress")
    ) {
      alerts.push({
        type: "safety_risk",
        severity: "critical",
        message: `Maintenance request "${r.title}" poses a child safety risk and is ${r.status}`,
      });
    }
  }

  // ── urgent_maintenance: urgent priority open > 3 days ──────────────────
  for (const r of requests) {
    if (
      r.priority === "urgent" &&
      (r.status === "open" || r.status === "in_progress") &&
      now.getTime() - new Date(r.reported_date).getTime() > threeDaysMs
    ) {
      const daysOpen = Math.round(
        (now.getTime() - new Date(r.reported_date).getTime()) / (1000 * 60 * 60 * 24),
      );
      alerts.push({
        type: "urgent_maintenance",
        severity: "high",
        message: `Urgent maintenance request "${r.title}" has been open for ${daysOpen} days`,
      });
    }
  }

  // ── high_maintenance_backlog: 5+ open requests ─────────────────────────
  const openRequests = requests.filter(
    (r) => r.status === "open" || r.status === "in_progress" || r.status === "awaiting_parts",
  );
  if (openRequests.length >= 5) {
    alerts.push({
      type: "high_maintenance_backlog",
      severity: "medium",
      message: `${openRequests.length} maintenance requests are currently outstanding`,
    });
  }

  return alerts;
}

/**
 * Compute upcoming check schedule from completed checks.
 * Returns all check types sorted by next due date (most urgent first).
 */
export function computeCheckSchedule(checks: PremisesCheck[]): {
  check_type: string;
  label: string;
  last_done: string | null;
  next_due: string;
  days_until: number;
  overdue: boolean;
}[] {
  const now = new Date();
  const schedule: {
    check_type: string;
    label: string;
    last_done: string | null;
    next_due: string;
    days_until: number;
    overdue: boolean;
  }[] = [];

  for (const ct of CHECK_TYPES) {
    const matching = checks
      .filter((c) => c.check_type === ct.type)
      .sort((a, b) => new Date(b.check_date).getTime() - new Date(a.check_date).getTime());

    const lastDone = matching.length > 0 ? matching[0].check_date : null;

    let nextDue: Date;
    if (lastDone) {
      nextDue = new Date(lastDone);
      nextDue.setDate(nextDue.getDate() + ct.frequency_days);
    } else {
      // Never done — due immediately (today)
      nextDue = new Date(now);
    }

    const daysUntil = Math.floor(
      (nextDue.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    schedule.push({
      check_type: ct.type,
      label: ct.label,
      last_done: lastDone,
      next_due: nextDue.toISOString().split("T")[0],
      days_until: daysUntil,
      overdue: daysUntil < 0,
    });
  }

  // Sort by days_until ascending (most urgent first)
  schedule.sort((a, b) => a.days_until - b.days_until);

  return schedule;
}

// ── CRUD — Premises Checks ──────────────────────────────────────────────

export async function listPremisesChecks(
  homeId: string,
  filters?: {
    checkType?: string;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
  },
): Promise<ServiceResult<PremisesCheck[]>> {
  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_premises_checks") as SB).select("*").eq("home_id", homeId);
  if (filters?.checkType) q = q.eq("check_type", filters.checkType);
  if (filters?.dateFrom) q = q.gte("check_date", filters.dateFrom);
  if (filters?.dateTo) q = q.lte("check_date", filters.dateTo);
  q = q.order("created_at", { ascending: false }).limit(filters?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createPremisesCheck(
  input: Omit<PremisesCheck, "id" | "created_at">,
): Promise<ServiceResult<PremisesCheck>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_premises_checks") as SB)
    .insert({
      home_id: input.home_id,
      check_type: input.check_type,
      check_date: input.check_date,
      completed_by: input.completed_by,
      result: input.result,
      notes: input.notes ?? null,
      issues_found: input.issues_found ?? [],
      follow_up_required: input.follow_up_required,
      follow_up_date: input.follow_up_date ?? null,
      certificate_reference: input.certificate_reference ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── CRUD — Maintenance Requests ─────────────────────────────────────────

export async function listMaintenanceRequests(
  homeId: string,
  filters?: {
    status?: string;
    priority?: string;
    category?: string;
    limit?: number;
  },
): Promise<ServiceResult<MaintenanceRequest[]>> {
  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_maintenance_requests") as SB).select("*").eq("home_id", homeId);
  if (filters?.status) q = q.eq("status", filters.status);
  if (filters?.priority) q = q.eq("priority", filters.priority);
  if (filters?.category) q = q.eq("category", filters.category);
  q = q.order("created_at", { ascending: false }).limit(filters?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createMaintenanceRequest(
  input: Omit<MaintenanceRequest, "id" | "status" | "created_at" | "updated_at">,
): Promise<ServiceResult<MaintenanceRequest>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_maintenance_requests") as SB)
    .insert({
      home_id: input.home_id,
      title: input.title,
      description: input.description,
      category: input.category,
      priority: input.priority,
      location: input.location,
      reported_by: input.reported_by,
      reported_date: input.reported_date,
      assigned_to: input.assigned_to ?? null,
      estimated_cost: input.estimated_cost ?? null,
      actual_cost: input.actual_cost ?? null,
      completion_date: input.completion_date ?? null,
      status: "open",
      child_safety_risk: input.child_safety_risk,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateMaintenanceRequest(
  id: string,
  updates: Partial<MaintenanceRequest>,
): Promise<ServiceResult<MaintenanceRequest>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_maintenance_requests") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function completeMaintenanceRequest(
  id: string,
  actualCost?: number,
): Promise<ServiceResult<MaintenanceRequest>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const updatePayload: Record<string, unknown> = {
    status: "completed",
    completion_date: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  if (actualCost !== undefined) {
    updatePayload.actual_cost = actualCost;
  }

  const { data, error } = await (s.from("cs_maintenance_requests") as SB)
    .update(updatePayload)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computePremisesCompliance,
  computeMaintenanceSummary,
  identifyPremisesAlerts,
  computeCheckSchedule,
};
