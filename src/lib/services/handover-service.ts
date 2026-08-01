// ══════════════════════════════════════════════════════════════════════════════
// CARA — SHIFT HANDOVER SERVICE
// Manages shift handover records between outgoing and incoming staff.
// Critical for continuity of care — covers child status, incidents, tasks,
// medication, safeguarding, and risk changes (CHR 2015 Reg 12, 13, 34).
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

export interface ChildUpdate {
  child_id: string;
  child_name: string;
  status: string;
  mood_notes: string;
  medication_notes?: string;
  behaviour_notes?: string;
  risk_changes?: string;
  tasks_outstanding?: string[];
}

export interface Handover {
  id: string;
  home_id: string;
  handover_type: string;
  shift_date: string;
  outgoing_staff: string[];
  incoming_staff: string[];
  child_updates: ChildUpdate[];
  incidents_summary: string[];
  tasks_carried_forward: string[];
  safeguarding_flags: string[];
  general_notes?: string;
  priority: string;
  completed: boolean;
  completed_at?: string;
  created_by: string;
  created_at: string;
}

// ── Constants ──────────────────────────────────────────────────────────────

export const HANDOVER_TYPES: { type: string; label: string }[] = [
  { type: "shift_change", label: "Shift Change Handover" },
  { type: "sleep_in_waking", label: "Sleep-In to Waking" },
  { type: "waking_day", label: "Waking Night to Day" },
  { type: "emergency", label: "Emergency Handover" },
];

export const CHILD_STATUS_OPTIONS: string[] = [
  "settled", "unsettled", "distressed", "sleeping",
  "absent", "in_school", "with_family",
];

export const PRIORITY_FLAGS: string[] = [
  "routine", "important", "urgent", "critical",
];

// ── Pure functions (no DB) ─────────────────────────────────────────────────

/**
 * Compute handover compliance metrics for a date range.
 */
function computeHandoverCompliance(
  handovers: Handover[],
  dateFrom: string,
  dateTo: string,
): {
  total_handovers: number;
  completed_count: number;
  completion_rate: number | null;
  by_type: Record<string, number>;
  avg_children_covered: number | null;
  with_safeguarding_flags: number;
  with_incidents: number;
  avg_tasks_carried_forward: number | null;
} {
  const fromDate = new Date(dateFrom);
  const toDate = new Date(dateTo);

  const filtered = handovers.filter((h) => {
    const d = new Date(h.shift_date);
    return d >= fromDate && d <= toDate;
  });

  const total = filtered.length;
  const completedCount = filtered.filter((h) => h.completed).length;

  const byType: Record<string, number> = {};
  let totalChildUpdates = 0;
  let withSafeguarding = 0;
  let withIncidents = 0;
  let totalTasksCarried = 0;

  for (const h of filtered) {
    byType[h.handover_type] = (byType[h.handover_type] ?? 0) + 1;
    totalChildUpdates += h.child_updates.length;
    if (h.safeguarding_flags.length > 0) withSafeguarding++;
    if (h.incidents_summary.length > 0) withIncidents++;
    totalTasksCarried += h.tasks_carried_forward.length;
  }

  return {
    total_handovers: total,
    completed_count: completedCount,
    completion_rate: total > 0 ? Math.round((completedCount / total) * 100) : null,
    by_type: byType,
    avg_children_covered: total > 0
      ? Math.round((totalChildUpdates / total) * 10) / 10
      : null,
    with_safeguarding_flags: withSafeguarding,
    with_incidents: withIncidents,
    avg_tasks_carried_forward: total > 0
      ? Math.round((totalTasksCarried / total) * 10) / 10
      : null,
  };
}

/**
 * Compute quality metrics across handovers based on note completeness.
 */
function computeHandoverQuality(handovers: Handover[]): {
  total: number;
  with_mood_notes_rate: number | null;
  with_medication_notes_rate: number | null;
  with_behaviour_notes_rate: number | null;
  with_risk_changes_rate: number | null;
  fully_detailed_rate: number | null;
  priority_breakdown: Record<string, number>;
} {
  const total = handovers.length;

  // Collect all child updates across all handovers
  const allUpdates = handovers.flatMap((h) => h.child_updates);
  const updateCount = allUpdates.length;

  let withMood = 0;
  let withMedication = 0;
  let withBehaviour = 0;
  let withRisk = 0;

  for (const u of allUpdates) {
    if (u.mood_notes && u.mood_notes.trim().length > 0) withMood++;
    if (u.medication_notes && u.medication_notes.trim().length > 0) withMedication++;
    if (u.behaviour_notes && u.behaviour_notes.trim().length > 0) withBehaviour++;
    if (u.risk_changes && u.risk_changes.trim().length > 0) withRisk++;
  }

  // Fully detailed: every child update in a handover has all 4 note types
  let fullyDetailedCount = 0;
  for (const h of handovers) {
    if (h.child_updates.length === 0) continue;
    const allDetailed = h.child_updates.every(
      (u) =>
        u.mood_notes && u.mood_notes.trim().length > 0 &&
        u.medication_notes && u.medication_notes.trim().length > 0 &&
        u.behaviour_notes && u.behaviour_notes.trim().length > 0 &&
        u.risk_changes && u.risk_changes.trim().length > 0,
    );
    if (allDetailed) fullyDetailedCount++;
  }

  const priorityBreakdown: Record<string, number> = {};
  for (const h of handovers) {
    priorityBreakdown[h.priority] = (priorityBreakdown[h.priority] ?? 0) + 1;
  }

  return {
    total,
    with_mood_notes_rate: updateCount > 0
      ? Math.round((withMood / updateCount) * 100)
      : null,
    with_medication_notes_rate: updateCount > 0
      ? Math.round((withMedication / updateCount) * 100)
      : null,
    with_behaviour_notes_rate: updateCount > 0
      ? Math.round((withBehaviour / updateCount) * 100)
      : null,
    with_risk_changes_rate: updateCount > 0
      ? Math.round((withRisk / updateCount) * 100)
      : null,
    fully_detailed_rate: total > 0
      ? Math.round((fullyDetailedCount / total) * 100)
      : null,
    priority_breakdown: priorityBreakdown,
  };
}

/**
 * Identify alerts from handover records requiring attention.
 */
function identifyHandoverAlerts(
  handovers: Handover[],
  expectedChildCount?: number,
): { type: string; severity: string; message: string }[] {
  const alerts: { type: string; severity: string; message: string }[] = [];

  for (const h of handovers) {
    // Incomplete handover — not completed within 2 hours of creation
    if (!h.completed) {
      const created = new Date(h.created_at).getTime();
      const now = Date.now();
      const twoHoursMs = 2 * 60 * 60 * 1000;
      if (now - created > twoHoursMs) {
        alerts.push({
          type: "incomplete_handover",
          severity: "high",
          message: `Handover on ${h.shift_date} (${h.handover_type}) has not been completed within 2 hours of creation.`,
        });
      }
    }

    // Safeguarding flags present
    if (h.safeguarding_flags.length > 0) {
      alerts.push({
        type: "safeguarding_flag",
        severity: "critical",
        message: `Handover on ${h.shift_date} contains ${h.safeguarding_flags.length} safeguarding flag(s): ${h.safeguarding_flags.join(", ")}.`,
      });
    }

    // Missing child coverage
    if (
      expectedChildCount !== undefined &&
      h.completed &&
      h.child_updates.length < expectedChildCount
    ) {
      alerts.push({
        type: "missing_child",
        severity: "medium",
        message: `Completed handover on ${h.shift_date} covers ${h.child_updates.length} of ${expectedChildCount} children.`,
      });
    }

    // High tasks carried forward
    if (h.tasks_carried_forward.length >= 5) {
      alerts.push({
        type: "high_tasks_carried",
        severity: "medium",
        message: `Handover on ${h.shift_date} has ${h.tasks_carried_forward.length} tasks carried forward.`,
      });
    }

    // No medication notes when medication was apparently relevant
    for (const cu of h.child_updates) {
      if (
        (!cu.medication_notes || cu.medication_notes.trim().length === 0) &&
        cu.tasks_outstanding &&
        cu.tasks_outstanding.some(
          (t) => t.toLowerCase().includes("medication") || t.toLowerCase().includes("meds"),
        )
      ) {
        alerts.push({
          type: "no_medication_notes",
          severity: "medium",
          message: `Child ${cu.child_name} in handover on ${h.shift_date} has medication-related tasks but no medication notes.`,
        });
      }
    }
  }

  return alerts;
}

// ── CRUD ────────────────────────────────────────────────────────────────────

export async function listHandovers(
  homeId: string,
  filters?: {
    dateFrom?: string;
    dateTo?: string;
    handoverType?: string;
    completed?: boolean;
    limit?: number;
  },
): Promise<ServiceResult<Handover[]>> {
  const s = sb();
  if (!s) return { ok: true, data: [], persisted: false } as ServiceResult<Handover[]>;

  let q = (s.from("cs_handovers") as SB).select("*").eq("home_id", homeId);

  if (filters?.dateFrom) q = q.gte("shift_date", filters.dateFrom);
  if (filters?.dateTo) q = q.lte("shift_date", filters.dateTo);
  if (filters?.handoverType) q = q.eq("handover_type", filters.handoverType);
  if (filters?.completed !== undefined) q = q.eq("completed", filters.completed);

  q = q.order("shift_date", { ascending: false }).limit(filters?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createHandover(
  input: Omit<Handover, "id" | "created_at">,
): Promise<ServiceResult<Handover>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_handovers") as SB)
    .insert({
      home_id: input.home_id,
      handover_type: input.handover_type,
      shift_date: input.shift_date,
      outgoing_staff: input.outgoing_staff,
      incoming_staff: input.incoming_staff,
      child_updates: input.child_updates,
      incidents_summary: input.incidents_summary,
      tasks_carried_forward: input.tasks_carried_forward,
      safeguarding_flags: input.safeguarding_flags,
      general_notes: input.general_notes ?? null,
      priority: input.priority,
      completed: input.completed ?? false,
      completed_at: input.completed_at ?? null,
      created_by: input.created_by,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateHandover(
  id: string,
  updates: Partial<Handover>,
): Promise<ServiceResult<Handover>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_handovers") as SB)
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function completeHandover(
  id: string,
): Promise<ServiceResult<Handover>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_handovers") as SB)
    .update({
      completed: true,
      completed_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ────────────────────────────────────────────────────────

export const _testing = {
  computeHandoverCompliance,
  computeHandoverQuality,
  identifyHandoverAlerts,
};
