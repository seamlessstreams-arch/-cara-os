// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME SHIFT PATTERN INTELLIGENCE API ROUTE
// GET /api/v1/home-shift-pattern-intelligence
// Cross-cutting: shifts × shiftSwaps for staffing pattern analysis.
// CHR 2015 Reg 33(4)(c). SCCIF: "Staffing arrangements."
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeHomeShiftPattern,
  type ShiftInput,
  type ShiftSwapInput,
} from "@/lib/engines/home-shift-pattern-intelligence-engine";

export async function GET() {
  const store = getStore();
  const today = new Date().toISOString().slice(0, 10);

  // ── Shifts ────────────────────────────────────────────────────────────
  const shifts: ShiftInput[] = (
    (store.shifts ?? []) as any[]
  ).map((s: any) => ({
    id: s.id ?? "",
    staff_id: s.staff_id ?? "",
    date: (s.date ?? "").toString().slice(0, 10),
    shift_type: (s.shift_type ?? "day").toString(),
    start_time: (s.start_time ?? "08:00").toString(),
    end_time: (s.end_time ?? "17:00").toString(),
    actual_start: s.actual_start ? s.actual_start.toString() : null,
    actual_end: s.actual_end ? s.actual_end.toString() : null,
    overtime_minutes: typeof s.overtime_minutes === "number" ? s.overtime_minutes : 0,
    status: (s.status ?? "scheduled").toString(),
    is_open_shift: !!(s.is_open_shift),
  }));

  // ── Shift Swaps ───────────────────────────────────────────────────────
  const shiftSwaps: ShiftSwapInput[] = (
    (store.shiftSwaps ?? []) as any[]
  ).map((sw: any) => ({
    id: sw.id ?? "",
    requester_id: sw.requester_id ?? "",
    target_staff_id: sw.target_staff_id ?? null,
    status: (sw.status ?? "pending").toString(),
  }));

  // ── Total staff ───────────────────────────────────────────────────────
  const totalStaff = (store.staff ?? []).filter(
    (s: any) => s.status === "active",
  ).length;

  const result = computeHomeShiftPattern({
    today,
    shifts,
    shift_swaps: shiftSwaps,
    total_staff: totalStaff,
  });

  return NextResponse.json({ data: result });
}
