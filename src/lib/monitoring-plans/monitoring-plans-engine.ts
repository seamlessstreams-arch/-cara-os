// ══════════════════════════════════════════════════════════════════════════════
// CARA — INDIVIDUAL MONITORING PLANS (Phase 5 · Home-Ops · Module 3)
//
// The audit's other confirmed Home-Ops gap: no standing per-child observation
// plan exists. Fragments only — a NIGHT-only check plan (night-monitoring), an
// ephemeral per-shift check_frequency on the daily risk briefing, and a bare
// observation_level_set boolean on self-harm records. Nothing captures the
// standing daytime answer to "how closely is this child observed, why, agreed by
// whom, reviewed when?".
//
// This module adds that record + a deterministic validator + a read board. It
// deliberately COMPLEMENTS the existing night-check plan (referenced by note,
// never duplicated) and the risk plans (rationale links to them, levels don't).
//
// RIGHTS RULE (deliberate, conservative): any level above "general" is a
// RESTRICTION on the child. The validator refuses such a plan unless the
// restriction is explicitly acknowledged, a rationale is given, the child's
// views are recorded (or a reason why not), and a review date within 28 days is
// set. Cara never sets or escalates a level itself — a human decides; this
// module records and surfaces.
// ══════════════════════════════════════════════════════════════════════════════

export const OBSERVATION_LEVELS = [
  "general",        // normal home routine — no enhanced observation
  "intermittent",   // timed checks at a set frequency (e.g. every 15/30 min)
  "line_of_sight",  // staff can always see the child (waking hours)
  "arms_length",    // staff within immediate reach at all times
] as const;
export type ObservationLevel = (typeof OBSERVATION_LEVELS)[number];

export const OBSERVATION_LEVEL_LABELS: Record<ObservationLevel, string> = {
  general: "General",
  intermittent: "Intermittent checks",
  line_of_sight: "Line of sight",
  arms_length: "Arm's length",
};

/** Restrictiveness order for the board (most restrictive first). */
const LEVEL_RANK: Record<ObservationLevel, number> = {
  arms_length: 0,
  line_of_sight: 1,
  intermittent: 2,
  general: 3,
};

export interface MonitoringPlan {
  id: string;
  child_id: string;
  observation_level: ObservationLevel;
  /** Required for intermittent (5–120); null for the other levels. */
  check_frequency_minutes: number | null;
  /** Why this level — links the reasoning to the risk picture. */
  rationale: string;
  /** Above "general" is a restriction; the author must acknowledge that. */
  restriction_acknowledged: boolean;
  /** The child's views on the plan (or why they could not be sought). */
  child_views: string;
  agreed_by: string;
  start_date: string; // YYYY-MM-DD
  review_date: string; // YYYY-MM-DD
  /** Free-text pointer to the night arrangements (NightCheckPlan owns nights). */
  night_provision_note?: string | null;
  status: "active" | "ended";
  end_date?: string | null;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

// ── Validation (pure, conservative) ─────────────────────────────────────────

export interface PlanValidation {
  valid: boolean;
  errors: string[];
}

const RESTRICTIVE_REVIEW_MAX_DAYS = 28;

function daysBetween(a: string, b: string): number {
  const ms = Date.parse(`${b.slice(0, 10)}T00:00:00.000Z`) - Date.parse(`${a.slice(0, 10)}T00:00:00.000Z`);
  return Math.round(ms / 86_400_000);
}

/** Validate a draft plan. Every failing rule is named — nothing silent. */
export function validateMonitoringPlan(p: {
  child_id?: string;
  observation_level?: string;
  check_frequency_minutes?: number | null;
  rationale?: string;
  restriction_acknowledged?: boolean;
  child_views?: string;
  agreed_by?: string;
  start_date?: string;
  review_date?: string;
}): PlanValidation {
  const errors: string[] = [];

  if (!p.child_id) errors.push("child_id is required");
  const level = p.observation_level as ObservationLevel | undefined;
  if (!level || !OBSERVATION_LEVELS.includes(level)) {
    errors.push(`observation_level must be one of: ${OBSERVATION_LEVELS.join(", ")}`);
  }
  if (!p.agreed_by) errors.push("agreed_by is required — a named person owns this decision");
  if (!p.start_date) errors.push("start_date is required");
  if (!p.review_date) errors.push("review_date is required — a monitoring plan is never open-ended");
  if (p.start_date && p.review_date && daysBetween(p.start_date, p.review_date) < 0) {
    errors.push("review_date cannot be before start_date");
  }

  if (level === "intermittent") {
    const f = p.check_frequency_minutes;
    if (typeof f !== "number" || !Number.isFinite(f)) {
      errors.push("intermittent checks need check_frequency_minutes");
    } else if (f < 5 || f > 120) {
      errors.push("check_frequency_minutes must be between 5 and 120");
    }
  } else if (level && p.check_frequency_minutes != null) {
    errors.push(`check_frequency_minutes only applies to intermittent checks (got level "${level}")`);
  }

  // The rights rule: above "general" is a restriction.
  if (level && level !== "general") {
    if (!p.restriction_acknowledged) {
      errors.push(
        `"${OBSERVATION_LEVEL_LABELS[level]}" restricts the child — restriction_acknowledged must be true`,
      );
    }
    if (!p.rationale?.trim()) {
      errors.push("A restrictive level requires a rationale");
    }
    if (!p.child_views?.trim()) {
      errors.push("A restrictive level requires the child's views (or the reason they could not be sought)");
    }
    if (p.start_date && p.review_date && daysBetween(p.start_date, p.review_date) > RESTRICTIVE_REVIEW_MAX_DAYS) {
      errors.push(`A restrictive level must be reviewed within ${RESTRICTIVE_REVIEW_MAX_DAYS} days of starting`);
    }
  }

  return { valid: errors.length === 0, errors };
}

// ── The board (pure, read-only) ──────────────────────────────────────────────

export interface MonitoringBoardRow {
  child_id: string;
  child_name: string;
  plan_id: string;
  observation_level: ObservationLevel;
  level_label: string;
  check_frequency_minutes: number | null;
  rationale: string;
  agreed_by: string;
  start_date: string;
  review_date: string;
  review_overdue: boolean;
  is_restrictive: boolean;
  night_provision_note?: string | null;
}

export interface MonitoringBoard {
  date: string;
  active_plans: number;
  /** Resident children with NO active plan — stated, never given an invented level. */
  children_without_plan: number;
  restrictive_count: number;
  reviews_overdue: number;
  rows: MonitoringBoardRow[];
}

export function computeMonitoringBoard(input: {
  plans: readonly MonitoringPlan[];
  youngPeople: readonly { id: string; first_name: string; last_name: string; status?: string }[];
  nowIso: string;
}): MonitoringBoard {
  const today = input.nowIso.slice(0, 10);
  const residents = input.youngPeople.filter((y) => (y.status ?? "current") === "current");
  const nameById = new Map(residents.map((y) => [y.id, `${y.first_name} ${y.last_name}`.trim()]));

  // One active plan per child — latest start_date wins (ties: latest updated_at).
  const activeByChild = new Map<string, MonitoringPlan>();
  for (const p of input.plans) {
    if (p.status !== "active") continue;
    if (!nameById.has(p.child_id)) continue; // only resident children board
    const cur = activeByChild.get(p.child_id);
    if (
      !cur ||
      p.start_date > cur.start_date ||
      (p.start_date === cur.start_date && p.updated_at > cur.updated_at)
    ) {
      activeByChild.set(p.child_id, p);
    }
  }

  const rows: MonitoringBoardRow[] = Array.from(activeByChild.values())
    .map((p) => ({
      child_id: p.child_id,
      child_name: nameById.get(p.child_id) ?? p.child_id,
      plan_id: p.id,
      observation_level: p.observation_level,
      level_label: OBSERVATION_LEVEL_LABELS[p.observation_level],
      check_frequency_minutes: p.check_frequency_minutes,
      rationale: p.rationale,
      agreed_by: p.agreed_by,
      start_date: p.start_date,
      review_date: p.review_date,
      review_overdue: p.review_date.slice(0, 10) < today,
      is_restrictive: p.observation_level !== "general",
      night_provision_note: p.night_provision_note ?? null,
    }))
    .sort(
      (a, b) =>
        LEVEL_RANK[a.observation_level] - LEVEL_RANK[b.observation_level] ||
        a.child_name.localeCompare(b.child_name),
    );

  return {
    date: today,
    active_plans: rows.length,
    children_without_plan: residents.length - rows.length,
    restrictive_count: rows.filter((r) => r.is_restrictive).length,
    reviews_overdue: rows.filter((r) => r.review_overdue).length,
    rows,
  };
}
