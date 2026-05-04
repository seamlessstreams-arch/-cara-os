import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { todayStr, generateId } from "@/lib/utils";

function getMondayOfWeek(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const day = d.getDay(); // 0=Sun, 1=Mon...
  const diff = day === 0 ? -6 : 1 - day; // shift to Monday
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const weekStartParam = searchParams.get("week_start");
  const weekStart = getMondayOfWeek(weekStartParam ?? todayStr());
  const weekEnd = addDays(weekStart, 6);
  const today = todayStr();

  const allShifts = db.shifts.findAll();
  const allLeave = db.leave.findAll();

  // Shifts in the requested week
  const weekShifts = allShifts.filter((s) => s.date >= weekStart && s.date <= weekEnd);

  // Approved leave overlapping the requested week
  const weekLeave = allLeave.filter(
    (l) => l.status === "approved" && l.start_date <= weekEnd && l.end_date >= weekStart
  );

  // Today stats (always use actual today)
  const todayShifts = allShifts.filter((s) => s.date === today && !s.is_open_shift);
  const openShifts = allShifts.filter((s) => s.is_open_shift && s.date >= today);
  const onLeaveToday = allLeave.filter(
    (l) => l.status === "approved" && l.start_date <= today && l.end_date >= today
  );
  const lateArrivals = todayShifts.filter(
    (s) => s.status === "in_progress" && s.notes?.toLowerCase().includes("late")
  );
  const sleepIns = todayShifts.filter((s) => s.shift_type === "sleep_in");

  return NextResponse.json({
    shifts: weekShifts,
    leave: weekLeave,
    meta: {
      week_start: weekStart,
      week_end: weekEnd,
      on_shift_today: todayShifts.length,
      sleep_ins_tonight: sleepIns.length,
      open_shifts: openShifts.length,
      on_leave_today: onLeaveToday.length,
      late_arrivals: lateArrivals.length,
      open_shift_dates: openShifts.map((s) => ({ date: s.date, start: s.start_time, end: s.end_time, type: s.shift_type })),
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { staff_id, date, shift_type, start_time, end_time, notes, home_id } = body;

    if (!staff_id || !date || !shift_type || !start_time || !end_time) {
      return NextResponse.json({ error: "Missing required fields: staff_id, date, shift_type, start_time, end_time" }, { status: 400 });
    }

    const shift = db.shifts.create({
      staff_id,
      date,
      shift_type,
      start_time,
      end_time,
      break_minutes: 0,
      actual_start: null,
      actual_end: null,
      clock_in_at: null,
      clock_out_at: null,
      overtime_minutes: 0,
      notes: notes ?? null,
      status: "scheduled",
      is_open_shift: false,
      home_id: home_id ?? "home_oak",
      created_by: "staff_darren",
    });

    return NextResponse.json({ data: shift }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create shift" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { shift_date, start_time, staff_id } = body;

    if (!shift_date || !start_time || !staff_id) {
      return NextResponse.json({ error: "Missing required fields: shift_date, start_time, staff_id" }, { status: 400 });
    }

    const shift = db.shifts.findByDateAndTime(shift_date, start_time);
    if (!shift) {
      return NextResponse.json({ error: "Open shift not found" }, { status: 404 });
    }

    const updated = db.shifts.update(shift.id, { staff_id, is_open_shift: false, status: "scheduled" });
    return NextResponse.json({ data: updated });
  } catch {
    return NextResponse.json({ error: "Failed to assign shift" }, { status: 500 });
  }
}
