// ══════════════════════════════════════════════════════════════════════════════
// CARA — Shift patterns (pure)
//
// A staff member's working pattern, and the logic to expand it into concrete
// dated occurrences over any range. Two kinds:
//   • weekly   — fixed weekdays (e.g. a manager Mon–Fri)
//   • rotating — an "N on / M off" cycle anchored to a start date (e.g. a deputy
//                or RSW on 2 on / 4 off). The anchor date is day 0 of the first
//                "on" block, so future state is always computable.
// Deterministic — date maths via Date.UTC; no clock. Generating real shifts and
// the cover analysis build on top of this.
// ══════════════════════════════════════════════════════════════════════════════

export type ShiftPatternKind = "weekly" | "rotating";

export interface ShiftPattern {
  id: string;
  staff_id: string;
  name: string;
  kind: ShiftPatternKind;
  /** weekly: days of week to work. 0 = Sunday … 6 = Saturday. */
  weekdays?: number[];
  /** rotating: consecutive shifts ON. */
  cycle_on?: number;
  /** rotating: consecutive shifts OFF. */
  cycle_off?: number;
  /** rotating: YYYY-MM-DD that is day 0 (first ON day) of the cycle. */
  anchor_date?: string | null;
  /** The shift this pattern generates. */
  shift_type: string; // day | sleep_in | waking_night | short | handover | on_call | training_day
  start_time: string; // HH:MM
  end_time: string; // HH:MM (may be < start_time when the shift spans midnight)
  active: boolean;
  home_id: string;
  notes?: string;
}

export interface PatternOccurrence {
  date: string; // YYYY-MM-DD
  staff_id: string;
  pattern_id: string;
  shift_type: string;
  start_time: string;
  end_time: string;
}

function toUTC(date: string): number {
  return Date.parse(`${date.slice(0, 10)}T00:00:00Z`);
}
function dayKeyFromUTC(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}
function weekdayOf(date: string): number {
  return new Date(`${date.slice(0, 10)}T00:00:00Z`).getUTCDay();
}
function daysBetween(from: string, to: string): number {
  return Math.round((toUTC(to) - toUTC(from)) / 864e5);
}

/** Is this pattern "on" (scheduled to work) on the given date? */
export function patternWorksOn(pattern: ShiftPattern, date: string): boolean {
  if (!pattern.active) return false;
  if (pattern.kind === "weekly") {
    return Array.isArray(pattern.weekdays) && pattern.weekdays.includes(weekdayOf(date));
  }
  // rotating
  const on = Math.max(0, pattern.cycle_on ?? 0);
  const off = Math.max(0, pattern.cycle_off ?? 0);
  const cycle = on + off;
  if (cycle === 0 || on === 0 || !pattern.anchor_date) return false;
  const idx = daysBetween(pattern.anchor_date, date);
  if (idx < 0) return false; // before the cycle started
  return idx % cycle < on;
}

/** Expand a pattern into dated occurrences across an inclusive [from, to] range. */
export function expandPattern(pattern: ShiftPattern, range: { from: string; to: string }): PatternOccurrence[] {
  const out: PatternOccurrence[] = [];
  const start = toUTC(range.from);
  const end = toUTC(range.to);
  if (!(start <= end)) return out;
  for (let ms = start; ms <= end; ms += 864e5) {
    const date = dayKeyFromUTC(ms);
    if (patternWorksOn(pattern, date)) {
      out.push({
        date,
        staff_id: pattern.staff_id,
        pattern_id: pattern.id,
        shift_type: pattern.shift_type,
        start_time: pattern.start_time,
        end_time: pattern.end_time,
      });
    }
  }
  return out;
}

/** Expand many patterns at once. */
export function expandPatterns(patterns: ShiftPattern[], range: { from: string; to: string }): PatternOccurrence[] {
  return patterns.flatMap((p) => expandPattern(p, range));
}

const NIGHT_TYPES = new Set(["sleep_in", "waking_night", "night"]);
/** Which staffing period a shift type covers. */
export function shiftTypeToPeriod(shiftType: string): "day" | "night" {
  return NIGHT_TYPES.has(shiftType) ? "night" : "day";
}

const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Human description for the UI, e.g. "Mon–Fri" or "2 on / 4 off". */
export function describePattern(pattern: ShiftPattern): string {
  if (pattern.kind === "weekly") {
    const days = (pattern.weekdays ?? []).slice().sort((a, b) => a - b);
    if (days.length === 0) return "No days set";
    if (days.length === 5 && days.every((d, i) => d === i + 1)) return "Mon–Fri";
    if (days.length === 7) return "Every day";
    return days.map((d) => WD[d]).join(", ");
  }
  return `${pattern.cycle_on ?? 0} on / ${pattern.cycle_off ?? 0} off`;
}
