// ══════════════════════════════════════════════════════════════════════════════
// ARIA — HOME DYNAMICS SNAPSHOTTER
//
// Builds a deterministic point-in-time picture of a home's operational and
// relational climate from existing live records. The snapshot is a draft until
// an authorised manager reviews it; it is never auto-finalised.
//
// The snapshot rolls up:
//   - incidents (count, severity, oversight outstanding)
//   - restraints
//   - missing episodes (active + total in window)
//   - shifts (scheduled / completed / no-show / cancelled, stability %)
//   - overdue tasks
//
// Each row is graded green / amber / red against simple operational thresholds.
// The narrative summary is template-built (no LLM), so it is reproducible and
// safe to store as a "draft for manager review".
// ══════════════════════════════════════════════════════════════════════════════

import { db } from "@/lib/db/store";
import type {
  AriaHomeDynamicsSnapshot,
  AriaHomeDynamicsIndicator,
  AriaIndicatorStatus,
} from "@/types/aria-studio";

// ── Thresholds ───────────────────────────────────────────────────────────────
// These are intentionally conservative defaults. Real homes can override later
// via per-home configuration; for now they are baked in so behaviour is
// predictable and testable.
const THRESHOLDS = {
  incidentsAmber: 5,
  incidentsRed: 10,
  highSeverityAmber: 1,
  highSeverityRed: 3,
  oversightOutstandingAmber: 1,
  oversightOutstandingRed: 3,
  restraintsAmber: 1,
  restraintsRed: 3,
  missingActiveRed: 1, // any active missing episode is always red
  missingInWindowAmber: 1,
  missingInWindowRed: 3,
  staffingStabilityAmber: 90,
  staffingStabilityRed: 75,
  overdueTasksAmber: 3,
  overdueTasksRed: 8,
} as const;

const DEFAULT_WINDOW_DAYS = 28;

export interface GenerateSnapshotOptions {
  windowDays?: number;
  asOf?: string; // ISO date (yyyy-mm-dd) — defaults to today
  generatedBy?: string;
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function severityRank(status: AriaIndicatorStatus): number {
  if (status === "red") return 2;
  if (status === "amber") return 1;
  return 0;
}

function worst(indicators: AriaHomeDynamicsIndicator[]): AriaIndicatorStatus {
  let worstStatus: AriaIndicatorStatus = "green";
  for (const ind of indicators) {
    if (severityRank(ind.status) > severityRank(worstStatus)) {
      worstStatus = ind.status;
    }
  }
  return worstStatus;
}

function gradeNumber(
  value: number,
  amberAt: number,
  redAt: number,
): AriaIndicatorStatus {
  if (value >= redAt) return "red";
  if (value >= amberAt) return "amber";
  return "green";
}

function gradeStability(pct: number): AriaIndicatorStatus {
  if (pct < THRESHOLDS.staffingStabilityRed) return "red";
  if (pct < THRESHOLDS.staffingStabilityAmber) return "amber";
  return "green";
}

function buildNarrative(
  homeId: string,
  windowDays: number,
  indicators: AriaHomeDynamicsIndicator[],
  overall: AriaIndicatorStatus,
): string {
  const concerns = indicators.filter((i) => i.status !== "green");
  const headline =
    overall === "red"
      ? `Home ${homeId} is showing one or more red indicators in the last ${windowDays} days.`
      : overall === "amber"
        ? `Home ${homeId} has some amber indicators in the last ${windowDays} days.`
        : `Home ${homeId} is operating within expected ranges in the last ${windowDays} days.`;

  if (concerns.length === 0) {
    return `${headline} No indicators are currently flagged. ARIA draft — manager review required before relying on this summary.`;
  }

  const bullets = concerns
    .map((c) => `- ${c.label}: ${c.value} (${c.status.toUpperCase()}) — ${c.detail}`)
    .join("\n");

  return [
    headline,
    "",
    "Indicators requiring attention:",
    bullets,
    "",
    "ARIA draft — manager review required before relying on this summary.",
  ].join("\n");
}

export function generateHomeDynamicsSnapshot(
  homeId: string,
  options: GenerateSnapshotOptions = {},
): AriaHomeDynamicsSnapshot {
  const windowDays = options.windowDays ?? DEFAULT_WINDOW_DAYS;
  const asOfDate = options.asOf ? new Date(options.asOf) : new Date();
  const windowEnd = isoDate(asOfDate);
  const windowStartDate = new Date(asOfDate);
  windowStartDate.setDate(windowStartDate.getDate() - windowDays);
  const windowStart = isoDate(windowStartDate);

  // Incidents in window for this home
  const incidents = db.incidents
    .findAll()
    .filter(
      (i) =>
        i.home_id === homeId &&
        i.date >= windowStart &&
        i.date <= windowEnd,
    );
  const incidentsTotal = incidents.length;
  const incidentsHigh = incidents.filter(
    (i) => i.severity === "high" || i.severity === "critical",
  ).length;
  const incidentsOpen = incidents.filter(
    (i) => i.status === "open" || i.status === "under_review",
  ).length;
  const oversightOutstanding = incidents.filter(
    (i) => i.requires_oversight && !i.oversight_by,
  ).length;

  // Restraints in window — restraints have no home_id; resolve via child.
  const childIdsInHome = new Set(
    db.youngPeople
      .findAll()
      .filter((yp) => yp.home_id === homeId)
      .map((yp) => yp.id),
  );
  const restraints = db.restraints.findAll().filter((r) => {
    if (!childIdsInHome.has(r.child_id)) return false;
    const d = (r.date ?? "").slice(0, 10);
    return d >= windowStart && d <= windowEnd;
  });
  const restraintsTotal = restraints.length;

  // Missing episodes — MissingEpisode carries home_id directly.
  const missingAll = db.missingEpisodes
    .findAll()
    .filter((m) => m.home_id === homeId);
  const missingInWindow = missingAll.filter((m) => {
    const d = (m.date_missing ?? "").slice(0, 10);
    return d >= windowStart && d <= windowEnd;
  });
  const missingActive = missingAll.filter((m) => m.status === "active").length;

  // Shifts in window
  const shifts = db.shifts
    .findAll()
    .filter(
      (s) =>
        s.home_id === homeId && s.date >= windowStart && s.date <= windowEnd,
    );
  const shiftsScheduled = shifts.length;
  const shiftsCompleted = shifts.filter((s) => s.status === "completed").length;
  const shiftsNoShow = shifts.filter((s) => s.status === "no_show").length;
  const shiftsCancelled = shifts.filter((s) => s.status === "cancelled").length;
  const stabilityPct =
    shiftsScheduled === 0
      ? 100
      : Math.round((shiftsCompleted / shiftsScheduled) * 100);

  // Overdue tasks (system-wide overdue list filtered by linked home)
  const overdueTasks = db.tasks.findOverdue().filter((t) => {
    // Tasks may not always carry home_id; treat untagged as belonging to home
    const taskHome = (t as { home_id?: string }).home_id;
    return !taskHome || taskHome === homeId;
  }).length;

  // ── Build indicators ──
  const indicators: AriaHomeDynamicsIndicator[] = [
    {
      key: "incidents_total",
      label: "Incidents in window",
      value: incidentsTotal,
      status: gradeNumber(
        incidentsTotal,
        THRESHOLDS.incidentsAmber,
        THRESHOLDS.incidentsRed,
      ),
      detail: `${incidentsTotal} incidents recorded in the last ${windowDays} days.`,
    },
    {
      key: "incidents_high",
      label: "High-severity incidents",
      value: incidentsHigh,
      status: gradeNumber(
        incidentsHigh,
        THRESHOLDS.highSeverityAmber,
        THRESHOLDS.highSeverityRed,
      ),
      detail: `${incidentsHigh} incidents graded high or critical.`,
    },
    {
      key: "oversight_outstanding",
      label: "Oversight outstanding",
      value: oversightOutstanding,
      status: gradeNumber(
        oversightOutstanding,
        THRESHOLDS.oversightOutstandingAmber,
        THRESHOLDS.oversightOutstandingRed,
      ),
      detail: `${oversightOutstanding} incidents require management oversight.`,
    },
    {
      key: "restraints_total",
      label: "Restraints in window",
      value: restraintsTotal,
      status: gradeNumber(
        restraintsTotal,
        THRESHOLDS.restraintsAmber,
        THRESHOLDS.restraintsRed,
      ),
      detail: `${restraintsTotal} restraints recorded in the last ${windowDays} days.`,
    },
    {
      key: "missing_active",
      label: "Active missing episodes",
      value: missingActive,
      status:
        missingActive >= THRESHOLDS.missingActiveRed ? "red" : "green",
      detail:
        missingActive > 0
          ? `${missingActive} child(ren) currently missing.`
          : "No active missing episodes.",
    },
    {
      key: "missing_in_window",
      label: "Missing episodes in window",
      value: missingInWindow.length,
      status: gradeNumber(
        missingInWindow.length,
        THRESHOLDS.missingInWindowAmber,
        THRESHOLDS.missingInWindowRed,
      ),
      detail: `${missingInWindow.length} missing episodes started in the last ${windowDays} days.`,
    },
    {
      key: "staffing_stability",
      label: "Staffing stability",
      value: `${stabilityPct}%`,
      status: gradeStability(stabilityPct),
      detail: `${shiftsCompleted} of ${shiftsScheduled} shifts completed (${shiftsNoShow} no-show, ${shiftsCancelled} cancelled).`,
    },
    {
      key: "tasks_overdue",
      label: "Overdue tasks",
      value: overdueTasks,
      status: gradeNumber(
        overdueTasks,
        THRESHOLDS.overdueTasksAmber,
        THRESHOLDS.overdueTasksRed,
      ),
      detail: `${overdueTasks} tasks past their due date.`,
    },
  ];

  const overall = worst(indicators);
  const narrative = buildNarrative(homeId, windowDays, indicators, overall);

  const snap = db.ariaHomeDynamicsSnapshots.create({
    home_id: homeId,
    snapshot_date: windowEnd,
    window_days: windowDays,
    window_start: windowStart,
    window_end: windowEnd,
    incidents_total: incidentsTotal,
    incidents_high_severity: incidentsHigh,
    incidents_open: incidentsOpen,
    incidents_oversight_outstanding: oversightOutstanding,
    restraints_total: restraintsTotal,
    missing_episodes_total: missingInWindow.length,
    missing_episodes_active: missingActive,
    shifts_scheduled: shiftsScheduled,
    shifts_completed: shiftsCompleted,
    shifts_no_show: shiftsNoShow,
    shifts_cancelled: shiftsCancelled,
    staffing_stability_pct: stabilityPct,
    tasks_overdue: overdueTasks,
    overall_status: overall,
    indicators,
    narrative_summary: narrative,
    generated_by: options.generatedBy ?? "system",
    generated_at: new Date().toISOString(),
    is_ai_draft: true,
  });

  return snap;
}
