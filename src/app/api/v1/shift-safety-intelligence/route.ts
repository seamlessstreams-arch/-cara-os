// ══════════════════════════════════════════════════════════════════════════════
// CARA — SHIFT SAFETY & CONTINUITY INTELLIGENCE
// GET /api/v1/shift-safety-intelligence
//
// Analyses real seeded store.shifts to surface staffing risks that affect
// child safety: open shifts with no cover, long-shift fatigue risk, late
// arrivals, overtime accumulation, sleep-in distribution.
//
// Unlike home-staff-rota-adequate-staffing-intelligence which uses phantom
// collections (shiftCoverageRecords, ratioComplianceRecords, etc.), this
// route reads only real seeded data.
//
// Ofsted SCCIF: "Are there always enough staff on duty who are suitably
// qualified and experienced?" CHR 2015 Reg 32.
//
// All deterministic. No LLM calls.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { dal } from "@/lib/db/dal";

// ── Types ─────────────────────────────────────────────────────────────────────

type StaffShiftSignal = "at_risk" | "monitoring" | "good";

interface StaffShiftProfile {
  staffId: string;
  staffName: string;
  totalShifts: number;
  totalShiftMinutes: number;
  totalOvertimeMinutes: number;
  sleepInCount: number;
  dayShiftCount: number;
  longShiftCount: number;
  lateArrivalCount: number;
  noShowCount: number;
  openShiftCount: number;
  signal: StaffShiftSignal;
  supervisionNote: string;
}

interface OpenShift {
  shiftId: string;
  date: string;
  shiftType: string;
  startTime: string;
  endTime: string;
  notes: string | null;
}

interface ShiftSafetySummary {
  totalShifts: number;
  todayShifts: number;
  openShiftsToday: number;
  openShiftsTotal: number;
  totalOvertimeMinutes: number;
  longShiftsCount: number;
  lateArrivalsCount: number;
  uniqueStaffWorked: number;
  openShifts: OpenShift[];
  ofstedNote: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseHHMM(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + (m ?? 0);
}

function shiftDurationMinutes(startTime: string, endTime: string): number {
  const start = parseHHMM(startTime);
  let end = parseHHMM(endTime);
  if (end < start) end += 24 * 60;
  return end - start;
}

function isLate(startTime: string, actualStart: string | null, threshold = 10): boolean {
  if (!actualStart) return false;
  const planned = parseHHMM(startTime);
  const actual = parseHHMM(actualStart);
  return actual - planned > threshold;
}

function staffSignal(
  longShiftCount: number,
  totalOvertimeMinutes: number,
  lateArrivalCount: number,
  noShowCount: number,
): StaffShiftSignal {
  if (noShowCount > 0 || totalOvertimeMinutes > 180 || longShiftCount >= 3) return "at_risk";
  if (lateArrivalCount >= 2 || totalOvertimeMinutes > 60 || longShiftCount >= 2) return "monitoring";
  return "good";
}

function buildSupervisionNote(
  name: string,
  signal: StaffShiftSignal,
  longShiftCount: number,
  totalOvertimeMinutes: number,
  sleepInCount: number,
  lateArrivalCount: number,
  noShowCount: number,
): string {
  if (noShowCount > 0) {
    return `${name} has had ${noShowCount} no-show${noShowCount > 1 ? "s" : ""}. In supervision: what is the pattern? Is there an attendance concern that needs to be addressed?`;
  }
  if (totalOvertimeMinutes > 180) {
    return `${name} has accumulated ${Math.round(totalOvertimeMinutes / 60 * 10) / 10} hours of overtime. In supervision: is this voluntary or due to cover gaps? Sustained overtime raises fatigue and wellbeing concerns for staff working with children who have complex needs.`;
  }
  if (longShiftCount >= 2) {
    return `${name} is working ${longShiftCount} long shifts (10+ hours). In supervision: review whether the pattern of long shifts is manageable and whether ${name.split(" ")[0]} is getting adequate rest between shifts.`;
  }
  if (sleepInCount >= 2) {
    return `${name} has ${sleepInCount} sleep-in shifts in the recent period. In supervision: ensure ${name.split(" ")[0]} is not routinely doing day shifts followed by sleep-ins, as this affects quality of care and staff wellbeing.`;
  }
  if (lateArrivalCount >= 2) {
    return `${name} has been late starting ${lateArrivalCount} shifts. In supervision: explore whether there are practical barriers to punctual arrival and support to resolve them.`;
  }
  return `${name}'s shift pattern is within safe parameters. In supervision, explore how ${name.split(" ")[0]} is finding their current rota and whether any adjustments would better support them.`;
}

// Read a dal collection defensively: on a live tenant a transient query failure
// must degrade to an empty section, never 500 the whole dashboard.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function safeList(p: Promise<any[]>): Promise<any[]> {
  try {
    const r = await p;
    return Array.isArray(r) ? r : [];
  } catch {
    return [];
  }
}

// ── Route ──────────────────────────────────────────────────────────────────────

export async function GET() {
  const today = new Date().toISOString().slice(0, 10);

  const [staffMembers, shifts] = await Promise.all([
    safeList(dal.staff.findAll()),
    safeList(dal.shifts.findAll()),
  ]);

  const staffNames = new Map(staffMembers.map((s) => [s.id, s.full_name]));

  // Index shifts by staff
  const shiftsByStaff = new Map<string, typeof shifts>();
  const openShifts: OpenShift[] = [];

  for (const s of shifts) {
    if (s.is_open_shift || !s.staff_id) {
      openShifts.push({
        shiftId: s.id,
        date: s.date,
        shiftType: s.shift_type,
        startTime: s.start_time,
        endTime: s.end_time,
        notes: s.notes,
      });
      continue;
    }
    const arr = shiftsByStaff.get(s.staff_id) ?? [];
    arr.push(s);
    shiftsByStaff.set(s.staff_id, arr);
  }

  // ── Per-staff profiles ────────────────────────────────────────────────────
  const staffProfiles: StaffShiftProfile[] = [...shiftsByStaff.entries()]
    .map(([staffId, staffShifts]) => {
      let totalShiftMinutes = 0;
      let totalOvertimeMinutes = 0;
      let sleepInCount = 0;
      let dayShiftCount = 0;
      let longShiftCount = 0;
      let lateArrivalCount = 0;
      let noShowCount = 0;

      for (const s of staffShifts) {
        if (s.status === "no_show") {
          noShowCount++;
          continue;
        }
        const duration = shiftDurationMinutes(s.start_time, s.end_time);
        totalShiftMinutes += duration;
        totalOvertimeMinutes += s.overtime_minutes ?? 0;

        if (s.shift_type === "sleep_in") sleepInCount++;
        else dayShiftCount++;

        if (duration >= 600) longShiftCount++;

        if (isLate(s.start_time, s.actual_start, 10)) lateArrivalCount++;
      }

      const signal = staffSignal(longShiftCount, totalOvertimeMinutes, lateArrivalCount, noShowCount);

      return {
        staffId,
        staffName: staffNames.get(staffId) ?? staffId,
        totalShifts: staffShifts.length,
        totalShiftMinutes,
        totalOvertimeMinutes,
        sleepInCount,
        dayShiftCount,
        longShiftCount,
        lateArrivalCount,
        noShowCount,
        openShiftCount: 0,
        signal,
        supervisionNote: buildSupervisionNote(
          staffNames.get(staffId) ?? staffId,
          signal,
          longShiftCount,
          totalOvertimeMinutes,
          sleepInCount,
          lateArrivalCount,
          noShowCount,
        ),
      };
    })
    .sort((a, b) => {
      const ORDER: Record<StaffShiftSignal, number> = { at_risk: 0, monitoring: 1, good: 2 };
      return ORDER[a.signal] - ORDER[b.signal];
    });

  // ── Home summary ──────────────────────────────────────────────────────────
  const todayShifts = shifts.filter((s) => s.date === today);
  const openShiftsToday = todayShifts.filter((s) => s.is_open_shift || !s.staff_id).length;

  const totalOvertimeMinutes = staffProfiles.reduce((s, p) => s + p.totalOvertimeMinutes, 0);
  const longShiftsCount = staffProfiles.reduce((s, p) => s + p.longShiftCount, 0);
  const lateArrivalsCount = staffProfiles.reduce((s, p) => s + p.lateArrivalCount, 0);
  const uniqueStaffWorked = staffProfiles.length;

  // Ofsted note
  const ofstedNote =
    openShiftsToday > 0
      ? `${openShiftsToday} open shift${openShiftsToday > 1 ? "s" : ""} today with no staff allocated. An inspector will ask how the home ensures minimum staffing ratios are maintained at all times — who covered this shift and how was it managed?`
      : openShifts.length > 0
      ? `${openShifts.length} open shift${openShifts.length > 1 ? "s" : ""} without cover in the rota period. Ensure each is covered before the shift begins and that this is tracked in the rota management system.`
      : longShiftsCount >= 2
      ? `${longShiftsCount} long shifts (10+ hours) recorded. Inspectors may ask whether sustained long shifts are manageable and whether staff fatigue is considered in safer staffing decisions.`
      : lateArrivalsCount >= 2
      ? `${lateArrivalsCount} late shift starts recorded. Consider whether this pattern indicates a systemic barrier or a pattern for individual staff that should be explored in supervision.`
      : "Shift coverage appears adequate across the recorded period. Continue ensuring minimum ratios are met at all times, particularly during school runs, mealtimes, and evening routines.";

  const summary: ShiftSafetySummary = {
    totalShifts: shifts.length,
    todayShifts: todayShifts.length,
    openShiftsToday,
    openShiftsTotal: openShifts.length,
    totalOvertimeMinutes,
    longShiftsCount,
    lateArrivalsCount,
    uniqueStaffWorked,
    openShifts,
    ofstedNote,
  };

  return NextResponse.json({ data: { staffProfiles, summary } });
}
