import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const childId = searchParams.get("child_id");
  const type = searchParams.get("type");

  let records = db.healthRecordEntries.getAll();
  if (childId) records = records.filter((r) => r.child_id === childId);
  if (type) records = records.filter((r) => r.record_type === type);

  records = [...records].sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));

  const today = new Date().toISOString().slice(0, 10);
  const overdue = records.filter((r) => r.follow_up_date && r.follow_up_date < today && r.status !== "resolved").length;
  const upcoming7d = records.filter((r) => {
    if (!r.follow_up_date) return false;
    const diff = (new Date(r.follow_up_date).getTime() - Date.now()) / 86400000;
    return diff >= 0 && diff <= 7;
  }).length;

  return NextResponse.json({
    data: records,
    meta: { total: records.length, overdue, upcoming_7d: upcoming7d },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.child_id || !body.record_type || !body.title) {
    return NextResponse.json({ error: "Missing required fields: child_id, record_type, title" }, { status: 400 });
  }
  const record = db.healthRecordEntries.create({
    child_id: body.child_id,
    date: body.date ?? new Date().toISOString().slice(0, 10),
    record_type: body.record_type,
    title: body.title,
    details: body.details ?? "",
    professional: body.professional ?? "",
    status: body.status ?? "current",
    follow_up_date: body.follow_up_date ?? null,
    outcome: body.outcome ?? null,
    staff_id: body.staff_id ?? "staff_darren",
    home_id: body.home_id ?? "home_oak",
  });
  return NextResponse.json({ data: record }, { status: 201 });
}
