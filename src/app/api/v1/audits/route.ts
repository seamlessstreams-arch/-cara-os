import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { todayStr } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const category = searchParams.get("category");

  let audits = db.audits.findAll();
  if (status) audits = audits.filter((a) => a.status === status);
  if (category) audits = audits.filter((a) => a.category === category);

  const today = todayStr();
  return NextResponse.json({
    data: audits,
    meta: {
      total: audits.length,
      completed: audits.filter((a) => a.status === "completed").length,
      scheduled: audits.filter((a) => a.status === "scheduled").length,
      in_progress: audits.filter((a) => a.status === "in_progress").length,
      overdue: audits.filter((a) => a.status === "scheduled" && a.date < today).length,
    },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const audit = db.audits.create({
    ...body,
    score: 0,
    max_score: 100,
    findings: 0,
    actions: 0,
    status: "scheduled",
    home_id: "home_oak",
    created_by: body.created_by || "staff_darren",
    updated_by: body.created_by || "staff_darren",
  });
  return NextResponse.json({ data: audit }, { status: 201 });
}
