// ══════════════════════════════════════════════════════════════════════════════
// CARA — ROTA (weekly shifts + leave + staffing meta)
//
// GET   /api/v1/rota?week_start=YYYY-MM-DD  → { shifts, leave, meta }
// POST  /api/v1/rota                        → create a shift
// PATCH /api/v1/rota                        → assign/update a shift
//
// WHY THIS ROUTE EXISTS: `useRota` has always expected `{ shifts, leave, meta }`
// with `meta.open_shift_dates`, but there was no /api/v1/rota route — the
// request fell through to the catch-all dispatcher, which answers
// `{ data, meta: { total } }`. So `data.shifts` was always undefined, the rota
// grid rendered empty in BOTH demo and live, the open-shift panel never
// appeared, and "Fill Shift" PATCHed without the `id` the dispatcher requires
// (400). This route supplies the contract the page was written against.
//
// Everything reads/writes through the dual-mode dal: the shifts + leave_requests
// tables on a live tenant, the in-memory store in demo.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { dal } from "@/lib/db/dal";
import { readJsonBody } from "@/lib/http/read-json";

export const dynamic = "force-dynamic";

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Monday of the week containing `date` — the grid is Monday-first. */
function mondayOf(date: string): string {
  const d = new Date(date + "T00:00:00Z");
  const dow = d.getUTCDay(); // 0 = Sunday
  d.setUTCDate(d.getUTCDate() - (dow === 0 ? 6 : dow - 1));
  return d.toISOString().slice(0, 10);
}

function addDays(date: string, days: number): string {
  const d = new Date(date + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

async function safeList(p: Promise<unknown>): Promise<Row[]> {
  try {
    const r = await p;
    return Array.isArray(r) ? (r as Row[]) : [];
  } catch {
    return [];
  }
}

const isOpen = (s: Row) => Boolean(s.is_open_shift) || !s.staff_id;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const weekStart = mondayOf(searchParams.get("week_start") || todayStr());
  const weekEnd = addDays(weekStart, 6);
  const today = todayStr();

  const [shifts, leave] = await Promise.all([
    safeList(dal.shifts.findAll(weekStart)),
    safeList(dal.leave.findAll()),
  ]);

  const todayShifts = shifts.filter((s) => s.date === today);
  const openShifts = shifts.filter(isOpen);

  // A late arrival is a clock-in after the shift's own start time.
  const lateArrivals = todayShifts.filter((s) => {
    if (!s.clock_in_at || !s.start_time) return false;
    const clockIn = String(s.clock_in_at).slice(11, 16);
    return clockIn > String(s.start_time).slice(0, 5);
  }).length;

  const onLeaveToday = leave.filter(
    (l) => l.status === "approved" && l.start_date <= today && l.end_date >= today,
  ).length;

  return NextResponse.json({
    shifts,
    leave,
    meta: {
      week_start: weekStart,
      week_end: weekEnd,
      on_shift_today: todayShifts.filter((s) => !isOpen(s)).length,
      sleep_ins_tonight: todayShifts.filter((s) => s.shift_type === "sleep_in").length,
      open_shifts: openShifts.length,
      on_leave_today: onLeaveToday,
      late_arrivals: lateArrivals,
      open_shift_dates: openShifts.map((s) => ({
        date: s.date,
        start: s.start_time,
        end: s.end_time,
        type: s.shift_type,
      })),
    },
  });
}

export async function POST(req: NextRequest) {
  const parsed = await readJsonBody(req);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data as Row;
  try {
    const shift = await dal.shifts.create({
      status: "scheduled",
      is_open_shift: !body.staff_id,
      ...body,
    });
    return NextResponse.json({ data: shift }, { status: 201 });
  } catch (err) {
    console.error("[api/rota] create failed:", err);
    return NextResponse.json({ error: "Could not create the shift" }, { status: 500 });
  }
}

// Assign an open shift (or patch any shift). The rota page identifies an open
// shift by date + start time — it has no id to hand, because open shifts are
// surfaced through meta.open_shift_dates — so resolve one here when no id is
// given, rather than rejecting the request.
export async function PATCH(req: NextRequest) {
  const parsed = await readJsonBody(req);
  if (!parsed.ok) return parsed.response;
  const { id, shift_date, start_time, staff_id, ...rest } = parsed.data as Row;

  try {
    let shiftId = id as string | undefined;

    if (!shiftId) {
      if (!shift_date || !start_time) {
        return NextResponse.json(
          { error: "Provide an id, or shift_date and start_time to identify the shift" },
          { status: 400 },
        );
      }
      const weekShifts = await safeList(dal.shifts.findAll(mondayOf(String(shift_date))));
      const match =
        weekShifts.find(
          (s) =>
            s.date === shift_date &&
            String(s.start_time).slice(0, 5) === String(start_time).slice(0, 5) &&
            isOpen(s),
        ) ??
        weekShifts.find(
          (s) => s.date === shift_date && String(s.start_time).slice(0, 5) === String(start_time).slice(0, 5),
        );
      if (!match) {
        return NextResponse.json({ error: "No shift found for that date and time" }, { status: 404 });
      }
      shiftId = match.id as string;
    }

    const patch: Row = { ...rest };
    if (staff_id !== undefined) {
      patch.staff_id = staff_id;
      // Assigning someone closes the open shift.
      patch.is_open_shift = false;
      patch.status = rest.status ?? "confirmed";
    }

    const updated = await dal.shifts.update(shiftId, patch);
    if (!updated) return NextResponse.json({ error: "Shift not found" }, { status: 404 });
    return NextResponse.json({ data: updated });
  } catch (err) {
    console.error("[api/rota] update failed:", err);
    return NextResponse.json({ error: "Could not update the shift" }, { status: 500 });
  }
}
