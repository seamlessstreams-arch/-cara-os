// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE API — /api/v1/education-records
// Education Records: attendance, exclusions, PEP meetings, achievements, concerns.
// GET   — list records (optionally filtered by child_id or type)
// POST  — create a new record
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const childId = searchParams.get("child_id");
  const type = searchParams.get("type");

  let records = db.educationRecords.findAll();
  if (childId) records = records.filter((r) => r.child_id === childId);
  if (type) records = records.filter((r) => r.record_type === type);

  // Sort newest first
  records = [...records].sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));

  const exclusionsThisTerm = records.filter((r) => r.record_type === "exclusion").length;
  const attendanceRecords = records.filter((r) => r.record_type === "attendance");
  const attendancePct = attendanceRecords.length > 0 ? 100 : 0;

  return NextResponse.json({
    data: records,
    meta: {
      total: records.length,
      exclusions_term: exclusionsThisTerm,
      attendance_pct: attendancePct,
    },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (!body.child_id || !body.record_type || !body.title) {
    return NextResponse.json(
      { error: "Missing required fields: child_id, record_type, title" },
      { status: 400 },
    );
  }

  const record = db.educationRecords.create({
    child_id: body.child_id,
    record_type: body.record_type,
    title: body.title,
    date: body.date || new Date().toISOString().slice(0, 10),
    school: body.school || undefined,
    details: body.details || undefined,
    outcome: body.outcome || undefined,
    follow_up_date: body.follow_up_date || undefined,
    staff_id: body.staff_id || "staff_darren",
    status: body.status || "open",
    home_id: body.home_id || "home_oak",
  });

  return NextResponse.json({ data: record }, { status: 201 });
}
