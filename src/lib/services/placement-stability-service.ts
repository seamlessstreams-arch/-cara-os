// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — PLACEMENT STABILITY SERVICE
// Tracks placement moves, stability metrics, disruption meetings,
// and permanence planning for children in care.
// CHR 2015 Reg 36 (records — placement history),
// Reg 8 (placement plans — matching and stability),
// Reg 9 (quality of care — continuity and stability).
//
// Monitors placement history, reasons for moves, and ensures
// stability is maintained as a key outcome for children.
//
// SCCIF: Overall Experiences — "Children benefit from stable
// placements." "Placement moves are minimised and planned."
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

export type PlacementType =
  | "residential"
  | "foster_care"
  | "kinship_care"
  | "semi_independent"
  | "secure"
  | "hospital"
  | "parent_resumed"
  | "adoption"
  | "other";

export type MoveReason =
  | "planned_transition"
  | "placement_breakdown"
  | "safeguarding"
  | "matching_issues"
  | "childs_request"
  | "closer_to_family"
  | "escalation_of_need"
  | "service_closure"
  | "age_appropriate_move"
  | "court_directed"
  | "positive_move"
  | "other";

export type StabilityRisk =
  | "very_high"
  | "high"
  | "medium"
  | "low"
  | "stable";

export type DisruptionOutcome =
  | "placement_maintained"
  | "additional_support"
  | "planned_move"
  | "emergency_move"
  | "ongoing_monitoring"
  | "not_applicable";

export interface PlacementMove {
  id: string;
  home_id: string;
  child_name: string;
  child_id: string;
  move_date: string;
  placement_type: PlacementType;
  previous_placement_type: PlacementType | null;
  move_reason: MoveReason;
  planned: boolean;
  disruption_meeting_held: boolean;
  disruption_outcome: DisruptionOutcome;
  placement_duration_days: number;
  child_views_sought: boolean;
  child_views: string | null;
  social_worker_consulted: boolean;
  irp_updated: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const PLACEMENT_TYPES: { type: PlacementType; label: string }[] = [
  { type: "residential", label: "Residential" },
  { type: "foster_care", label: "Foster Care" },
  { type: "kinship_care", label: "Kinship Care" },
  { type: "semi_independent", label: "Semi-Independent" },
  { type: "secure", label: "Secure" },
  { type: "hospital", label: "Hospital" },
  { type: "parent_resumed", label: "Parent Resumed" },
  { type: "adoption", label: "Adoption" },
  { type: "other", label: "Other" },
];

export const MOVE_REASONS: { reason: MoveReason; label: string }[] = [
  { reason: "planned_transition", label: "Planned Transition" },
  { reason: "placement_breakdown", label: "Placement Breakdown" },
  { reason: "safeguarding", label: "Safeguarding" },
  { reason: "matching_issues", label: "Matching Issues" },
  { reason: "childs_request", label: "Child's Request" },
  { reason: "closer_to_family", label: "Closer to Family" },
  { reason: "escalation_of_need", label: "Escalation of Need" },
  { reason: "service_closure", label: "Service Closure" },
  { reason: "age_appropriate_move", label: "Age-Appropriate Move" },
  { reason: "court_directed", label: "Court Directed" },
  { reason: "positive_move", label: "Positive Move" },
  { reason: "other", label: "Other" },
];

export const STABILITY_RISKS: { risk: StabilityRisk; label: string }[] = [
  { risk: "very_high", label: "Very High" },
  { risk: "high", label: "High" },
  { risk: "medium", label: "Medium" },
  { risk: "low", label: "Low" },
  { risk: "stable", label: "Stable" },
];

export const DISRUPTION_OUTCOMES: { outcome: DisruptionOutcome; label: string }[] = [
  { outcome: "placement_maintained", label: "Placement Maintained" },
  { outcome: "additional_support", label: "Additional Support" },
  { outcome: "planned_move", label: "Planned Move" },
  { outcome: "emergency_move", label: "Emergency Move" },
  { outcome: "ongoing_monitoring", label: "Ongoing Monitoring" },
  { outcome: "not_applicable", label: "Not Applicable" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

/**
 * Compute placement stability metrics.
 */
export function computeStabilityMetrics(
  moves: PlacementMove[],
  totalChildren: number,
): {
  total_moves: number;
  children_with_moves: number;
  planned_moves: number;
  unplanned_moves: number;
  planned_rate: number;
  breakdowns: number;
  safeguarding_moves: number;
  average_placement_duration: number;
  disruption_meetings_held: number;
  disruption_meeting_rate: number;
  child_views_sought_rate: number;
  social_worker_consulted_rate: number;
  irp_updated_rate: number;
  children_with_multiple_moves: number;
  by_placement_type: Record<string, number>;
  by_move_reason: Record<string, number>;
  by_disruption_outcome: Record<string, number>;
} {
  const planned = moves.filter((m) => m.planned).length;
  const unplanned = moves.filter((m) => !m.planned).length;
  const plannedRate =
    moves.length > 0
      ? Math.round((planned / moves.length) * 1000) / 10
      : 0;

  const breakdowns = moves.filter((m) => m.move_reason === "placement_breakdown").length;
  const safeguardingMoves = moves.filter((m) => m.move_reason === "safeguarding").length;

  const totalDuration = moves.reduce((sum, m) => sum + m.placement_duration_days, 0);
  const avgDuration =
    moves.length > 0
      ? Math.round(totalDuration / moves.length)
      : 0;

  const disruptionHeld = moves.filter((m) => m.disruption_meeting_held).length;
  const disruptionRate =
    moves.length > 0
      ? Math.round((disruptionHeld / moves.length) * 1000) / 10
      : 0;

  const viewsSought = moves.filter((m) => m.child_views_sought).length;
  const viewsRate =
    moves.length > 0
      ? Math.round((viewsSought / moves.length) * 1000) / 10
      : 0;

  const swConsulted = moves.filter((m) => m.social_worker_consulted).length;
  const swRate =
    moves.length > 0
      ? Math.round((swConsulted / moves.length) * 1000) / 10
      : 0;

  const irpUpdated = moves.filter((m) => m.irp_updated).length;
  const irpRate =
    moves.length > 0
      ? Math.round((irpUpdated / moves.length) * 1000) / 10
      : 0;

  const uniqueChildren = new Set(moves.map((m) => m.child_id)).size;

  // Children with multiple moves
  const movesByChild: Record<string, number> = {};
  for (const m of moves) {
    movesByChild[m.child_id] = (movesByChild[m.child_id] ?? 0) + 1;
  }
  const multipleMovers = Object.values(movesByChild).filter((c) => c >= 2).length;

  // By placement type
  const byPlacementType: Record<string, number> = {};
  for (const m of moves) {
    byPlacementType[m.placement_type] = (byPlacementType[m.placement_type] ?? 0) + 1;
  }

  // By move reason
  const byMoveReason: Record<string, number> = {};
  for (const m of moves) {
    byMoveReason[m.move_reason] = (byMoveReason[m.move_reason] ?? 0) + 1;
  }

  // By disruption outcome
  const byDisruptionOutcome: Record<string, number> = {};
  for (const m of moves) {
    byDisruptionOutcome[m.disruption_outcome] = (byDisruptionOutcome[m.disruption_outcome] ?? 0) + 1;
  }

  return {
    total_moves: moves.length,
    children_with_moves: uniqueChildren,
    planned_moves: planned,
    unplanned_moves: unplanned,
    planned_rate: plannedRate,
    breakdowns,
    safeguarding_moves: safeguardingMoves,
    average_placement_duration: avgDuration,
    disruption_meetings_held: disruptionHeld,
    disruption_meeting_rate: disruptionRate,
    child_views_sought_rate: viewsRate,
    social_worker_consulted_rate: swRate,
    irp_updated_rate: irpRate,
    children_with_multiple_moves: multipleMovers,
    by_placement_type: byPlacementType,
    by_move_reason: byMoveReason,
    by_disruption_outcome: byDisruptionOutcome,
  };
}

/**
 * Identify placement stability alerts.
 */
export function identifyStabilityAlerts(
  moves: PlacementMove[],
  _totalChildren: number,
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

  // Placement breakdowns
  for (const m of moves) {
    if (m.move_reason === "placement_breakdown") {
      alerts.push({
        type: "placement_breakdown",
        severity: "high",
        message: `Placement breakdown for ${m.child_name} on ${m.move_date} — ensure disruption meeting is held and lessons learned are documented`,
        id: m.id,
      });
    }
  }

  // Unplanned moves without disruption meeting
  for (const m of moves) {
    if (!m.planned && !m.disruption_meeting_held) {
      alerts.push({
        type: "no_disruption_meeting",
        severity: "high",
        message: `Unplanned move for ${m.child_name} (${m.move_date}) without disruption meeting — arrange meeting to review circumstances`,
        id: m.id,
      });
    }
  }

  // Child views not sought
  for (const m of moves) {
    if (!m.child_views_sought) {
      alerts.push({
        type: "views_not_sought",
        severity: "medium",
        message: `Child's views not sought for placement move of ${m.child_name} (${m.move_date}) — children's wishes and feelings must be recorded`,
        id: m.id,
      });
    }
  }

  // Children with 3+ moves (instability pattern)
  const movesByChild: Record<string, { name: string; count: number }> = {};
  for (const m of moves) {
    if (!movesByChild[m.child_id]) {
      movesByChild[m.child_id] = { name: m.child_name, count: 0 };
    }
    movesByChild[m.child_id].count += 1;
  }
  for (const [id, data] of Object.entries(movesByChild)) {
    if (data.count >= 3) {
      alerts.push({
        type: "instability_pattern",
        severity: "critical",
        message: `${data.name} has had ${data.count} placement moves — significant instability, review permanence plan urgently`,
        id: `instability_${id}`,
      });
    }
  }

  // IRP not updated after move
  for (const m of moves) {
    if (!m.irp_updated) {
      alerts.push({
        type: "irp_not_updated",
        severity: "medium",
        message: `Individual risk plan not updated following placement move of ${m.child_name} (${m.move_date})`,
        id: m.id,
      });
    }
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listMoves(
  homeId: string,
  filters?: {
    childId?: string;
    placementType?: PlacementType;
    moveReason?: MoveReason;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
  },
): Promise<ServiceResult<PlacementMove[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_placement_moves") as SB).select("*").eq("home_id", homeId);
  if (filters?.childId) q = q.eq("child_id", filters.childId);
  if (filters?.placementType) q = q.eq("placement_type", filters.placementType);
  if (filters?.moveReason) q = q.eq("move_reason", filters.moveReason);
  if (filters?.dateFrom) q = q.gte("move_date", filters.dateFrom);
  if (filters?.dateTo) q = q.lte("move_date", filters.dateTo);
  q = q.order("move_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createMove(
  input: {
    homeId: string;
    childName: string;
    childId: string;
    moveDate: string;
    placementType: PlacementType;
    previousPlacementType?: PlacementType;
    moveReason: MoveReason;
    planned: boolean;
    disruptionMeetingHeld: boolean;
    disruptionOutcome: DisruptionOutcome;
    placementDurationDays: number;
    childViewsSought: boolean;
    childViews?: string;
    socialWorkerConsulted: boolean;
    irpUpdated: boolean;
    notes?: string;
  },
): Promise<ServiceResult<PlacementMove>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_placement_moves") as SB)
    .insert({
      home_id: input.homeId,
      child_name: input.childName,
      child_id: input.childId,
      move_date: input.moveDate,
      placement_type: input.placementType,
      previous_placement_type: input.previousPlacementType ?? null,
      move_reason: input.moveReason,
      planned: input.planned,
      disruption_meeting_held: input.disruptionMeetingHeld,
      disruption_outcome: input.disruptionOutcome,
      placement_duration_days: input.placementDurationDays,
      child_views_sought: input.childViewsSought,
      child_views: input.childViews ?? null,
      social_worker_consulted: input.socialWorkerConsulted,
      irp_updated: input.irpUpdated,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateMove(
  id: string,
  updates: Partial<Record<string, unknown>>,
): Promise<ServiceResult<PlacementMove>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_placement_moves") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeStabilityMetrics,
  identifyStabilityAlerts,
};
