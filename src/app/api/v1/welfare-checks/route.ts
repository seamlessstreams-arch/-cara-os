// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — WELFARE CHECKS API
// Night-time and scheduled welfare check recording.
// Compliance: Reg 34 (adequate supervision), Quality Standards 6.3 (safe care).
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { todayStr, generateId } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const child_id = searchParams.get("child_id");
  const limit = parseInt(searchParams.get("limit") ?? "50");

  let rounds = db.welfareCheckRounds.findRecent(limit);

  if (date) {
    rounds = db.welfareCheckRounds.findByDate(date);
  }

  // Get all checks
  let checks = db.welfareChecks.findAll();
  if (child_id) {
    checks = db.welfareChecks.findByChild(child_id);
  }

  // Compute stats
  const today = todayStr();
  const todayRounds = db.welfareCheckRounds.findByDate(today);
  const concerns = db.welfareChecks.findConcerns();
  const allChecks = db.welfareChecks.findAll();

  // Streak: consecutive days with complete checks
  const dateSet = new Set(db.welfareCheckRounds.findAll().map((r) => r.round_date));
  let streak = 0;
  const d = new Date();
  d.setDate(d.getDate() - 1); // Start from yesterday
  while (dateSet.has(d.toISOString().slice(0, 10))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }

  return NextResponse.json({
    data: rounds,
    checks,
    meta: {
      total_rounds: db.welfareCheckRounds.findAll().length,
      today_rounds: todayRounds.length,
      total_checks: allChecks.length,
      concerns_flagged: concerns.length,
      consecutive_days: streak,
    },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const {
    staff_id,
    round_date,
    round_time,
    shift_type = "sleep_in",
    children_checks = [],
    building_secure = true,
    fire_exits_clear = true,
    external_doors_locked = true,
    alarm_set = false,
    additional_notes,
  } = body;

  if (!staff_id || !round_date || !round_time) {
    return NextResponse.json({ error: "staff_id, round_date, and round_time are required" }, { status: 400 });
  }

  const roundId = generateId("wcr");
  const checks = children_checks.map((c: {
    child_id: string;
    status: string;
    location?: string;
    mood?: string;
    notes?: string;
    concern_details?: string;
    physical_marks_noted?: boolean;
    marks_description?: string;
    door_locked?: boolean;
    window_secure?: boolean;
    room_temperature?: string;
  }) => ({
    id: generateId("wc"),
    child_id: c.child_id,
    staff_id,
    home_id: "home_oak",
    check_date: round_date,
    check_time: round_time,
    status: c.status ?? "ok",
    location: c.location ?? "bedroom",
    mood: c.mood,
    notes: c.notes,
    concern_details: c.concern_details,
    physical_marks_noted: c.physical_marks_noted ?? false,
    marks_description: c.marks_description,
    door_locked: c.door_locked ?? false,
    window_secure: c.window_secure ?? true,
    room_temperature: c.room_temperature ?? "comfortable",
    created_at: new Date().toISOString(),
  }));

  const allChildrenChecked = checks.length >= (db.youngPeople.findCurrent().length);

  const round = db.welfareCheckRounds.create({
    id: roundId,
    home_id: "home_oak",
    staff_id,
    round_date,
    round_time,
    shift_type,
    checks,
    all_children_checked: allChildrenChecked,
    building_secure,
    fire_exits_clear,
    external_doors_locked,
    alarm_set,
    additional_notes,
    completed_at: new Date().toISOString(),
  });

  return NextResponse.json({ data: round }, { status: 201 });
}
