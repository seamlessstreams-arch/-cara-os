// ══════════════════════════════════════════════════════════════════════════════
// CARA — Shift generation (pure / deterministic)
//
// Turns staff shift PATTERNS into concrete dated shifts to publish in advance.
// It expands every active pattern across a forward range, then drops two classes
// of occurrence so the published rota tells the truth:
//   • already-published — a real shift already exists for that staff + date
//   • unavailable        — the staffer is on approved leave or off sick that date
// What remains is the proposal: review it, then publish. No clock, no store —
// the route supplies existing-shift keys + unavailability and persists the result.
// ══════════════════════════════════════════════════════════════════════════════

import { expandPatterns, shiftTypeToPeriod, type ShiftPattern } from "./shift-patterns";

export interface GeneratedShift {
  date: string; // YYYY-MM-DD
  staff_id: string;
  pattern_id: string;
  shift_type: string;
  period: "day" | "night";
  start_time: string;
  end_time: string;
}

export interface ShiftGenerationInput {
  patterns: ShiftPattern[];
  range: { from: string; to: string };
  /** Keys `${staff_id}|${date}` that already have a (non-cancelled) published shift. */
  existingKeys: Set<string>;
  /** Keys `${staff_id}|${date}` where the staffer is on approved leave or off sick. */
  unavailable: Set<string>;
}

export interface ShiftGenerationResult {
  range: { from: string; to: string };
  /** The shifts that would be (or were) created. */
  candidates: GeneratedShift[];
  total: number;
  skipped_existing: number;
  skipped_unavailable: number;
  by_staff: { staff_id: string; count: number }[];
  by_date: { date: string; day: number; night: number }[];
}

/**
 * Plan the shifts to generate from patterns over a range. Pure — deterministic
 * for a given (patterns, range, existingKeys, unavailable), so a preview on one
 * instance and a publish on another propose the same rota.
 */
export function planShiftGeneration(input: ShiftGenerationInput): ShiftGenerationResult {
  const occurrences = expandPatterns(input.patterns, input.range);

  let skipped_existing = 0;
  let skipped_unavailable = 0;
  const candidates: GeneratedShift[] = [];
  const seen = new Set<string>(); // one shift per staff+date even if patterns overlap

  for (const o of occurrences) {
    const key = `${o.staff_id}|${o.date}`;
    if (input.existingKeys.has(key)) {
      skipped_existing += 1;
      continue;
    }
    if (input.unavailable.has(key)) {
      skipped_unavailable += 1;
      continue;
    }
    if (seen.has(key)) continue;
    seen.add(key);
    candidates.push({
      date: o.date,
      staff_id: o.staff_id,
      pattern_id: o.pattern_id,
      shift_type: o.shift_type,
      period: shiftTypeToPeriod(o.shift_type),
      start_time: o.start_time,
      end_time: o.end_time,
    });
  }

  // Sort chronologically, then by staff, for a stable, readable proposal.
  candidates.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.staff_id < b.staff_id ? -1 : 1));

  const staffMap = new Map<string, number>();
  const dateMap = new Map<string, { day: number; night: number }>();
  for (const c of candidates) {
    staffMap.set(c.staff_id, (staffMap.get(c.staff_id) ?? 0) + 1);
    const d = dateMap.get(c.date) ?? { day: 0, night: 0 };
    if (c.period === "night") d.night += 1;
    else d.day += 1;
    dateMap.set(c.date, d);
  }

  return {
    range: input.range,
    candidates,
    total: candidates.length,
    skipped_existing,
    skipped_unavailable,
    by_staff: [...staffMap.entries()].map(([staff_id, count]) => ({ staff_id, count })),
    by_date: [...dateMap.entries()].map(([date, v]) => ({ date, day: v.day, night: v.night })),
  };
}
