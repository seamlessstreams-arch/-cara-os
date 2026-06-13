// ══════════════════════════════════════════════════════════════════════════════
// CARA — Staffing cover engine (pure, deterministic)
//
// The anti-rota-blindness brain. Across a forward range, per day AND per period
// (day / night), it computes EFFECTIVE cover — counting only staff who are
// actually available (subtracting anyone on approved leave or sickness, and
// ignoring open/unfilled shifts) — then compares against the home's policy:
//   • below MINIMUM            → under-cover (shortfall, severity)
//   • night without waking     → no-waking-night (when required)
//   • above the EXPECTED norm   → over-cover; needs a logged reason, else it's
//                                 flagged "unexplained" so the manager is prompted
//   • scheduled-but-unavailable → "phantom cover" (the hidden gap rota blindness
//                                 misses — a booked staffer who's actually off)
// `today` is injected; no clock. Fully unit-testable.
// ══════════════════════════════════════════════════════════════════════════════

export type CoverPeriod = "day" | "night";
export type CoverStatus = "under" | "no_waking_night" | "over_unexplained" | "over_explained" | "met";
export type CoverSeverity = "critical" | "high" | "attention" | "ok";

export interface StaffingPolicy {
  min_day: number;
  min_night: number;
  /** The "norm" the home usually runs; above this prompts for a reason. */
  expected_day: number;
  expected_night: number;
  waking_night_required: boolean;
}

export const DEFAULT_STAFFING_POLICY: StaffingPolicy = {
  min_day: 2,
  min_night: 1,
  expected_day: 2,
  expected_night: 1,
  waking_night_required: true,
};

export interface CoverAssignment {
  date: string; // YYYY-MM-DD (for nights, the date the night anchors to)
  period: CoverPeriod;
  staff_id: string;
  shift_type: string;
  is_open: boolean; // unfilled shift — not real cover
}
export interface CoverReasonNote {
  date: string;
  period: CoverPeriod;
  reason: string; // shadow_shift | induction | training | child_plan_adjustment | extra_support | higher_ratio | other
  comment: string;
}

export interface StaffingCoverInput {
  today: string;
  range: { from: string; to: string };
  assignments: CoverAssignment[];
  /** Staff unavailable on a date (approved leave or sickness) → key `${staff_id}|${date}`. */
  unavailable: Set<string>;
  policy: StaffingPolicy;
  coverNotes: CoverReasonNote[];
  /** Resolve a staff id to a display name (for phantom-cover detail). */
  resolveStaff?: (id: string) => string | null;
}

export interface PeriodCover {
  date: string;
  period: CoverPeriod;
  minimum: number;
  expected: number;
  effective: number; // available, filled staff
  open: number; // unfilled shifts
  phantom: number; // scheduled but on leave/sick
  phantom_names: string[];
  has_waking_night: boolean;
  status: CoverStatus;
  severity: CoverSeverity;
  shortfall: number;
  excess: number;
  reason: string | null; // logged cover reason when over
  message: string;
}

export interface StaffingCoverResult {
  range: { from: string; to: string };
  periods: PeriodCover[]; // every day×period in range, chronological
  attention: PeriodCover[]; // only those needing eyes (not "met"/"over_explained"), worst-first
  summary: {
    days_under: number;
    nights_no_waking: number;
    over_unexplained: number;
    phantom_days: number; // periods with a scheduled-but-unavailable staffer
    open_shift_periods: number;
  };
  headline: string;
}

const DAY = 864e5;
function eachDate(from: string, to: string): string[] {
  const out: string[] = [];
  const start = Date.parse(`${from}T00:00:00Z`);
  const end = Date.parse(`${to}T00:00:00Z`);
  for (let ms = start; ms <= end && out.length < 400; ms += DAY) out.push(new Date(ms).toISOString().slice(0, 10));
  return out;
}

const SEV_RANK: Record<CoverSeverity, number> = { critical: 0, high: 1, attention: 2, ok: 3 };

function buildPeriod(
  date: string,
  period: CoverPeriod,
  input: StaffingCoverInput,
): PeriodCover {
  const minimum = period === "day" ? input.policy.min_day : input.policy.min_night;
  const expected = period === "day" ? input.policy.expected_day : input.policy.expected_night;

  const here = input.assignments.filter((a) => a.date === date && a.period === period);
  const open = here.filter((a) => a.is_open).length;
  const real = here.filter((a) => !a.is_open);
  const phantomAssignments = real.filter((a) => input.unavailable.has(`${a.staff_id}|${date}`));
  const filled = real.filter((a) => !input.unavailable.has(`${a.staff_id}|${date}`));
  const effective = filled.length;
  const phantom = phantomAssignments.length;
  const phantom_names = phantomAssignments.map((a) => (input.resolveStaff?.(a.staff_id) ?? a.staff_id));
  const has_waking_night = filled.some((a) => a.shift_type === "waking_night");

  const note = input.coverNotes.find((n) => n.date === date && n.period === period);
  const shortfall = Math.max(0, minimum - effective);
  const excess = Math.max(0, effective - expected);

  let status: CoverStatus;
  let severity: CoverSeverity;
  let message: string;

  if (effective < minimum) {
    status = "under";
    severity = effective === 0 || shortfall >= 2 ? "critical" : "high";
    message = `${effective} on ${period} vs ${minimum} required — short by ${shortfall}.${phantom ? ` ${phantom} scheduled but unavailable.` : ""}${open ? ` ${open} unfilled.` : ""}`;
  } else if (period === "night" && input.policy.waking_night_required && !has_waking_night) {
    status = "no_waking_night";
    severity = "high";
    message = `${effective} on night but no waking-night cover scheduled.`;
  } else if (effective > expected) {
    if (note) {
      status = "over_explained";
      severity = "ok";
      message = `${effective} on ${period} (norm ${expected}) — ${note.reason.replace(/_/g, " ")}${note.comment ? `: ${note.comment}` : ""}.`;
    } else {
      status = "over_unexplained";
      severity = "attention";
      message = `${effective} on ${period} vs norm of ${expected} — extra cover with no reason logged. Add a reason.`;
    }
  } else {
    status = "met";
    severity = "ok";
    message = `${effective} on ${period} — cover met.${phantom ? ` Note: ${phantom} scheduled but unavailable.` : ""}`;
  }

  // Phantom cover is a hidden gap even when the headline count looks ok — lift severity if it pushes us under.
  return { date, period, minimum, expected, effective, open, phantom, phantom_names, has_waking_night, status, severity, shortfall, excess, reason: note?.reason ?? null, message };
}

export function analyseStaffingCover(input: StaffingCoverInput): StaffingCoverResult {
  const dates = eachDate(input.range.from, input.range.to);
  const periods: PeriodCover[] = [];
  for (const date of dates) {
    periods.push(buildPeriod(date, "day", input));
    periods.push(buildPeriod(date, "night", input));
  }

  const attention = periods
    .filter((p) => p.status !== "met" && p.status !== "over_explained")
    .sort((a, b) => SEV_RANK[a.severity] - SEV_RANK[b.severity] || (a.date < b.date ? -1 : 1));

  const summary = {
    days_under: periods.filter((p) => p.status === "under").length,
    nights_no_waking: periods.filter((p) => p.status === "no_waking_night").length,
    over_unexplained: periods.filter((p) => p.status === "over_unexplained").length,
    phantom_days: periods.filter((p) => p.phantom > 0).length,
    open_shift_periods: periods.filter((p) => p.open > 0).length,
  };

  const bits: string[] = [];
  if (summary.days_under) bits.push(`${summary.days_under} under-covered`);
  if (summary.nights_no_waking) bits.push(`${summary.nights_no_waking} night(s) without waking cover`);
  if (summary.over_unexplained) bits.push(`${summary.over_unexplained} extra-cover to explain`);
  if (summary.phantom_days) bits.push(`${summary.phantom_days} with scheduled-but-unavailable staff`);
  const headline = bits.length ? bits.join(" · ") : "Cover looks complete across the range";

  return { range: input.range, periods, attention, summary, headline };
}
