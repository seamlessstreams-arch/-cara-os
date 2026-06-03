// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — MEDICATION ERROR TREND & REPEAT-PATTERN INTELLIGENCE ENGINE
//
// Pure deterministic engine — no DB calls, no side effects, no LLM calls.
//
// Distinct from the medication-error-PREVENTION engine (which scores current
// administration quality, storage, training and per-error management). This
// engine is TEMPORAL and PATTERN-focused:
//   1. Trend — error volume/rate over the last 30 days vs the preceding 30,
//      with direction and an administration-adjusted rate.
//   2. Repeat patterns — the same MEDICATION, CHILD, ERROR TYPE or TIME-OF-DAY
//      recurring over 90 days (system signals, not individuals).
//   3. Learning-loop closure — errors that RECUR DESPITE recorded lessons, plus
//      open remedial actions and incomplete duty-of-candour. The critical
//      Ofsted question: "you said you learned — why did it happen again?"
//
// SAFETY-CULTURE NOTE: repeat patterns are deliberately keyed on medication,
// child, error type and time — NEVER on the reporter. `reported_by` reflects a
// healthy reporting culture; surfacing reporters as "repeat offenders" would
// punish openness. This engine drives system fixes, not blame.
//
// Regulatory: CHR 2015 Reg 23 (medicines), Reg 13 (leadership — learning from
// mistakes), Reg 31/40 (notification of serious harm). SCCIF: "How well children
// are helped and protected" — safe medicines management & learning culture.
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ───────────────────────────────────────────────────────────────

export type MedErrorType =
  | "wrong_dose" | "wrong_medication" | "wrong_time" | "wrong_person"
  | "omission" | "wrong_route" | "expired_medication"
  | "documentation_error" | "near_miss" | "adverse_reaction";

export type MedErrorSeverity = "no_harm" | "low" | "moderate" | "severe" | "death";

export interface RemedialActionInput {
  status: string; // "completed" vs anything else (open)
}

export interface MedErrorInput {
  id: string;
  child_id: string;
  child_name: string;
  date_occurred: string;        // ISO date
  time_occurred: string;        // "HH:MM"
  error_type: MedErrorType;
  severity: MedErrorSeverity;
  medication: string;
  lessons_learned: string;      // free text; empty = none recorded
  remedial_actions: RemedialActionInput[];
  duty_of_candour: boolean;     // required?
  duty_of_candour_completed: string | null;
  status: string;               // "closed" etc.
}

export interface AdministrationInput {
  date: string;                 // ISO date
  status: string;
}

export interface MedErrorTrendInput {
  errors: MedErrorInput[];
  administrations: AdministrationInput[];
  today?: string;               // ISO date — injectable for deterministic tests
}

// ── Output Types ──────────────────────────────────────────────────────────────

export type TrendDirection = "rising" | "falling" | "stable";
export type RepeatDimension = "medication" | "child" | "error_type" | "time_of_day";

export interface TrendAnalysis {
  recent_30d: number;
  prior_30d: number;
  change: number;                 // recent - prior
  change_pct: number | null;      // null when prior is 0
  direction: TrendDirection;
  velocity_per_week: number;
  recent_rate_per_100_admin: number | null; // null when no administrations recorded
}

export interface RepeatPattern {
  dimension: RepeatDimension;
  key: string;                    // display label
  count: number;
  window_days: number;
  max_severity: MedErrorSeverity;
  recurred_after_lesson: boolean;
  detail: string;
}

export interface LearningGap {
  type: "recurrence_despite_learning" | "open_remedial_actions" | "candour_incomplete";
  detail: string;
  count: number;
  severity: "critical" | "high" | "medium";
}

export interface SeverityBreakdown {
  no_harm: number;
  low: number;
  moderate: number;
  severe: number;
  death: number;
  harm_events: number;            // moderate + severe + death
  harm_rate: number;              // % of errors causing harm (moderate+)
}

export interface MedTrendOverview {
  total_errors_90d: number;
  trend_direction: TrendDirection;
  repeat_pattern_count: number;
  learning_gap_count: number;
  harm_events: number;
  most_involved_medication: string | null;
  most_affected_child: string | null;
  recent_rate_per_100_admin: number | null;
}

export interface MedTrendAlert {
  severity: "critical" | "high" | "medium" | "low";
  message: string;
}

export interface AriaMedTrendInsight {
  severity: "critical" | "warning" | "positive";
  text: string;
}

export interface MedicationErrorTrendResult {
  overview: MedTrendOverview;
  trend: TrendAnalysis;
  repeat_patterns: RepeatPattern[];
  learning_gaps: LearningGap[];
  severity_breakdown: SeverityBreakdown;
  alerts: MedTrendAlert[];
  insights: AriaMedTrendInsight[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

export const ANALYSIS_WINDOW_DAYS = 90;
export const TREND_WINDOW_DAYS = 30;
export const REPEAT_THRESHOLD = 2;

export const SEVERITY_RANK: Record<MedErrorSeverity, number> = {
  no_harm: 0, low: 1, moderate: 2, severe: 3, death: 4,
};

const ERROR_TYPE_LABEL: Record<MedErrorType, string> = {
  wrong_dose: "Wrong dose",
  wrong_medication: "Wrong medication",
  wrong_time: "Wrong time",
  wrong_person: "Wrong person",
  omission: "Omission",
  wrong_route: "Wrong route",
  expired_medication: "Expired medication",
  documentation_error: "Documentation error",
  near_miss: "Near miss",
  adverse_reaction: "Adverse reaction",
};

// ── Helpers ─────────────────────────────────────────────────────────────────

export function daysAgo(date: string, today: string): number {
  const ms = new Date(today).getTime() - new Date(date).getTime();
  return Math.floor(ms / 86_400_000);
}

export function timeBand(time: string): string {
  const h = parseInt((time ?? "").slice(0, 2), 10);
  if (Number.isNaN(h)) return "Unknown time";
  if (h >= 6 && h < 12) return "Morning (06:00–11:59)";
  if (h >= 12 && h < 17) return "Midday (12:00–16:59)";
  if (h >= 17 && h < 22) return "Evening (17:00–21:59)";
  return "Night (22:00–05:59)";
}

export function maxSeverity(errors: { severity: MedErrorSeverity }[]): MedErrorSeverity {
  let worst: MedErrorSeverity = "no_harm";
  for (const e of errors) {
    if (SEVERITY_RANK[e.severity] > SEVERITY_RANK[worst]) worst = e.severity;
  }
  return worst;
}

function hasLesson(e: MedErrorInput): boolean {
  return (e.lessons_learned ?? "").trim().length > 0;
}

function isOpen(status: string): boolean {
  return (status ?? "").toLowerCase() !== "completed";
}

/** Chronological sort key for an error (date + time). */
function chronoKey(e: MedErrorInput): string {
  return `${e.date_occurred} ${e.time_occurred ?? "00:00"}`;
}

/** Did a later error occur after an earlier error that had a lesson recorded? */
function recurredAfterLesson(group: MedErrorInput[]): boolean {
  const sorted = [...group].sort((a, b) => chronoKey(a).localeCompare(chronoKey(b)));
  for (let i = 0; i < sorted.length - 1; i++) {
    if (hasLesson(sorted[i])) return true; // a lesson was recorded, yet a later error follows
  }
  return false;
}

// ── Main Computation ────────────────────────────────────────────────────────

export function computeMedicationErrorTrends(input: MedErrorTrendInput): MedicationErrorTrendResult {
  const today = input.today ?? new Date().toISOString().slice(0, 10);
  const { errors, administrations } = input;

  const within = (e: MedErrorInput, min: number, max: number) => {
    const d = daysAgo(e.date_occurred, today);
    return d >= min && d < max;
  };

  const analysisErrors = errors.filter((e) => within(e, 0, ANALYSIS_WINDOW_DAYS));
  const recentErrors = errors.filter((e) => within(e, 0, TREND_WINDOW_DAYS));
  const priorErrors = errors.filter((e) => within(e, TREND_WINDOW_DAYS, TREND_WINDOW_DAYS * 2));

  // ── Trend ──────────────────────────────────────────────────────────────
  const recentCount = recentErrors.length;
  const priorCount = priorErrors.length;
  const change = recentCount - priorCount;
  const direction: TrendDirection = change > 0 ? "rising" : change < 0 ? "falling" : "stable";
  const change_pct = priorCount > 0 ? Math.round((change / priorCount) * 100) : null;
  const velocity_per_week = Math.round((change / (TREND_WINDOW_DAYS / 7)) * 10) / 10;

  const recentAdmins = administrations.filter((a) => {
    const d = daysAgo(a.date, today);
    return d >= 0 && d < TREND_WINDOW_DAYS;
  }).length;
  const recent_rate_per_100_admin = recentAdmins > 0 ? Math.round((recentCount / recentAdmins) * 1000) / 10 : null;

  const trend: TrendAnalysis = {
    recent_30d: recentCount,
    prior_30d: priorCount,
    change,
    change_pct,
    direction,
    velocity_per_week,
    recent_rate_per_100_admin,
  };

  // ── Repeat patterns (90-day window) ────────────────────────────────────
  const repeat_patterns: RepeatPattern[] = [];

  const pushPatterns = (
    dimension: RepeatDimension,
    keyOf: (e: MedErrorInput) => string,
    labelOf: (e: MedErrorInput) => string,
    detailOf: (group: MedErrorInput[], label: string) => string,
  ) => {
    const groups = new Map<string, MedErrorInput[]>();
    for (const e of analysisErrors) {
      const k = keyOf(e);
      if (!k) continue;
      const arr = groups.get(k) ?? [];
      arr.push(e);
      groups.set(k, arr);
    }
    for (const [, group] of groups) {
      if (group.length < REPEAT_THRESHOLD) continue;
      const label = labelOf(group[0]);
      repeat_patterns.push({
        dimension,
        key: label,
        count: group.length,
        window_days: ANALYSIS_WINDOW_DAYS,
        max_severity: maxSeverity(group),
        recurred_after_lesson: recurredAfterLesson(group),
        detail: detailOf(group, label),
      });
    }
  };

  pushPatterns(
    "medication",
    (e) => (e.medication ?? "").trim().toLowerCase(),
    (e) => e.medication,
    (g, label) => `${label} involved in ${g.length} errors in 90 days`,
  );
  pushPatterns(
    "child",
    (e) => e.child_id,
    (e) => e.child_name,
    (g, label) => `${label} affected by ${g.length} medication errors in 90 days`,
  );
  pushPatterns(
    "error_type",
    (e) => e.error_type,
    (e) => ERROR_TYPE_LABEL[e.error_type] ?? e.error_type,
    (g, label) => `"${label}" recurred ${g.length} times in 90 days`,
  );
  pushPatterns(
    "time_of_day",
    (e) => timeBand(e.time_occurred),
    (e) => timeBand(e.time_occurred),
    (g, label) => `${g.length} errors cluster in the ${label} medication round`,
  );

  repeat_patterns.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return SEVERITY_RANK[b.max_severity] - SEVERITY_RANK[a.max_severity];
  });

  // ── Learning gaps (loop closure) ───────────────────────────────────────
  const learning_gaps: LearningGap[] = [];

  const recurAfterLearningGroups = repeat_patterns.filter(
    (p) => (p.dimension === "medication" || p.dimension === "error_type") && p.recurred_after_lesson,
  );
  if (recurAfterLearningGroups.length > 0) {
    learning_gaps.push({
      type: "recurrence_despite_learning",
      detail: `${recurAfterLearningGroups.length} pattern${recurAfterLearningGroups.length === 1 ? "" : "s"} recurred after a lesson was recorded (e.g. ${recurAfterLearningGroups
        .slice(0, 3)
        .map((p) => p.key)
        .join(", ")}) — recorded learning is not preventing recurrence`,
      count: recurAfterLearningGroups.length,
      severity: "critical",
    });
  }

  const openRemedial = analysisErrors.filter(
    (e) => isOpen(e.status) && (e.remedial_actions ?? []).some((a) => isOpen(a.status)),
  );
  if (openRemedial.length > 0) {
    learning_gaps.push({
      type: "open_remedial_actions",
      detail: `${openRemedial.length} error${openRemedial.length === 1 ? "" : "s"} still have open remedial actions`,
      count: openRemedial.length,
      severity: "high",
    });
  }

  const candourIncomplete = analysisErrors.filter(
    (e) => e.duty_of_candour && !e.duty_of_candour_completed,
  );
  if (candourIncomplete.length > 0) {
    learning_gaps.push({
      type: "candour_incomplete",
      detail: `${candourIncomplete.length} error${candourIncomplete.length === 1 ? "" : "s"} require duty of candour that is not yet completed`,
      count: candourIncomplete.length,
      severity: "medium",
    });
  }

  // ── Severity breakdown (90-day window) ─────────────────────────────────
  const sev = (s: MedErrorSeverity) => analysisErrors.filter((e) => e.severity === s).length;
  const harm_events = sev("moderate") + sev("severe") + sev("death");
  const severity_breakdown: SeverityBreakdown = {
    no_harm: sev("no_harm"),
    low: sev("low"),
    moderate: sev("moderate"),
    severe: sev("severe"),
    death: sev("death"),
    harm_events,
    harm_rate: analysisErrors.length > 0 ? Math.round((harm_events / analysisErrors.length) * 100) : 0,
  };

  // ── Most-involved medication / child ───────────────────────────────────
  const medPattern = repeat_patterns.find((p) => p.dimension === "medication") ?? null;
  const childPattern = repeat_patterns.find((p) => p.dimension === "child") ?? null;

  // ── Overview ───────────────────────────────────────────────────────────
  const overview: MedTrendOverview = {
    total_errors_90d: analysisErrors.length,
    trend_direction: direction,
    repeat_pattern_count: repeat_patterns.length,
    learning_gap_count: learning_gaps.length,
    harm_events,
    most_involved_medication: medPattern?.key ?? null,
    most_affected_child: childPattern?.key ?? null,
    recent_rate_per_100_admin,
  };

  // ── Alerts ─────────────────────────────────────────────────────────────
  const alerts: MedTrendAlert[] = [];

  const harmfulRecent = analysisErrors.filter((e) => SEVERITY_RANK[e.severity] >= 3); // severe/death
  for (const e of harmfulRecent) {
    alerts.push({
      severity: "critical",
      message: `${e.severity === "death" ? "A death" : "A severe-harm error"} involving ${e.medication} (${e.child_name}) is recorded — ensure notification (Reg 40) and a full review are complete`,
    });
  }

  if (recurAfterLearningGroups.length > 0) {
    alerts.push({
      severity: "critical",
      message: `${recurAfterLearningGroups.length} error pattern${recurAfterLearningGroups.length === 1 ? "" : "s"} recurred despite recorded learning — the learning loop is not closing`,
    });
  }

  if (direction === "rising" && harm_events > 0) {
    alerts.push({
      severity: "high",
      message: `Medication errors are rising (${recentCount} in 30d vs ${priorCount} prior) and include harm — review the medicines system now`,
    });
  } else if (direction === "rising") {
    alerts.push({
      severity: "high",
      message: `Medication errors are rising: ${recentCount} in the last 30 days vs ${priorCount} in the prior 30`,
    });
  }

  for (const p of repeat_patterns.filter((x) => x.dimension === "medication" && x.count >= 3)) {
    alerts.push({
      severity: "high",
      message: `${p.key} is involved in ${p.count} errors over 90 days — treat as a high-risk medication and review its system (storage, charting, double-checks)`,
    });
  }

  if (openRemedial.length > 0) {
    alerts.push({
      severity: "medium",
      message: `${openRemedial.length} medication error${openRemedial.length === 1 ? "" : "s"} have open remedial actions — close the loop`,
    });
  }

  const timeCluster = repeat_patterns.find((p) => p.dimension === "time_of_day" && p.count >= 3);
  if (timeCluster) {
    alerts.push({
      severity: "medium",
      message: `${timeCluster.key} accounts for ${timeCluster.count} errors — review staffing and process during that medication round`,
    });
  }

  // ── ARIA insights ──────────────────────────────────────────────────────
  const insights: AriaMedTrendInsight[] = [];

  if (harm_events > 0 || recurAfterLearningGroups.length > 0) {
    insights.push({
      severity: "critical",
      text: `${harm_events > 0 ? `${harm_events} medication error${harm_events === 1 ? "" : "s"} caused harm and ` : ""}${recurAfterLearningGroups.length > 0 ? "errors are recurring despite recorded learning. " : ""}Ofsted scrutinise whether a home learns from medicines mistakes. Move beyond per-incident fixes to a system change (independent double-checks, MAR redesign, competency re-assessment) and evidence the impact.`,
    });
  }

  if (direction === "rising" || repeat_patterns.length > 0) {
    const topMed = repeat_patterns.find((p) => p.dimension === "medication");
    insights.push({
      severity: "warning",
      text: `${direction === "rising" ? `Error volume is rising (${recentCount} vs ${priorCount}). ` : ""}${topMed ? `${topMed.key} is the most error-prone medication. ` : ""}Repeat patterns by medication, child and time of day point to system causes, not individual fault — focus improvement on the process, and keep encouraging open reporting.`,
    });
  }

  if (analysisErrors.length === 0) {
    insights.push({
      severity: "positive",
      text: `No medication errors recorded in the last 90 days. Maintain the safety routines (double-checks, MAR discipline) and keep near-miss reporting open — a steady flow of near-miss reports is a sign of a healthy, not a failing, system.`,
    });
  } else if (direction === "falling" && harm_events === 0 && learning_gaps.length === 0) {
    insights.push({
      severity: "positive",
      text: `Medication errors are falling (${recentCount} vs ${priorCount}) with no harm and a closed learning loop. This is exactly the trajectory and culture Ofsted looks for — record what changed so it is sustained.`,
    });
  }

  return {
    overview,
    trend,
    repeat_patterns,
    learning_gaps,
    severity_breakdown,
    alerts,
    insights,
  };
}
