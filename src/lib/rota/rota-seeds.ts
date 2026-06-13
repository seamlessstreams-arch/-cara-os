// ══════════════════════════════════════════════════════════════════════════════
// CARA — Rota demo seeds: shift patterns + staffing policy + cover notes
//
// Realistic, staggered patterns anchored to real seeded staff so the forward
// cover view shows a mix of met / under / over / no-waking-night across the
// fortnight. Dates are relative to "now" so the rota stays current.
// ══════════════════════════════════════════════════════════════════════════════

import type { ShiftPattern } from "./shift-patterns";
import type { StaffingPolicy } from "./staffing-cover-engine";
import { DEFAULT_STAFFING_POLICY } from "./staffing-cover-engine";

export interface ShiftCoverNote {
  id: string;
  date: string; // YYYY-MM-DD
  period: "day" | "night";
  reason: string; // shadow_shift | induction | training | child_plan_adjustment | extra_support | higher_ratio | other
  comment: string;
  recorded_by: string;
  created_at: string;
  home_id: string;
}

const DAY = 864e5;
function ago(n: number): string {
  return new Date(Date.now() - n * DAY).toISOString().slice(0, 10);
}

export function seedShiftPatterns(): ShiftPattern[] {
  const day = { shift_type: "day", start_time: "08:00", end_time: "20:00", active: true, home_id: "home_oak" } as const;
  const night = { shift_type: "waking_night", start_time: "20:00", end_time: "08:00", active: true, home_id: "home_oak" } as const;
  const rot = (cycle_on: number, cycle_off: number, anchorDaysAgo: number) =>
    ({ kind: "rotating" as const, cycle_on, cycle_off, anchor_date: ago(anchorDaysAgo) });

  return [
    // Registered manager — Mon–Fri days
    { id: "sp_olivia", staff_id: "staff_darren", name: "RM — Mon–Fri", kind: "weekly", weekdays: [1, 2, 3, 4, 5], ...day, start_time: "09:00", end_time: "17:00" },
    // Day team — staggered 2 on / 4 off so ~2–3 cover each day
    { id: "sp_marcus", staff_id: "staff_ryan", name: "Deputy — 2 on / 4 off", ...rot(2, 4, 0), ...day },
    { id: "sp_priya", staff_id: "staff_anna", name: "RSW — 2 on / 4 off", ...rot(2, 4, 2), ...day },
    { id: "sp_maria", staff_id: "staff_diane", name: "RSW — 2 on / 4 off", ...rot(2, 4, 4), ...day },
    { id: "sp_samuel", staff_id: "staff_lackson", name: "RSW — 2 on / 4 off", ...rot(2, 4, 1), ...day },
    // Night team — 4 on / 4 off waking nights, offset so cover alternates
    { id: "sp_elena", staff_id: "staff_mirela", name: "Waking night — 4 on / 4 off", ...rot(4, 4, 0), ...night },
    { id: "sp_naomi", staff_id: "staff_chervelle", name: "Waking night — 4 on / 4 off", ...rot(4, 4, 4), ...night },
  ];
}

export function seedStaffingPolicy(): StaffingPolicy {
  return { ...DEFAULT_STAFFING_POLICY };
}

export function seedShiftCoverNotes(): ShiftCoverNote[] {
  return [];
}
