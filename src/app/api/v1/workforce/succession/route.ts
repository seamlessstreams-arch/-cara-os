import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const homeId = searchParams.get("home_id");

  let results = db.successionPlans.findAll();
  if (homeId) results = results.filter((s) => s.home_id === homeId);

  return NextResponse.json({
    data: results.sort((a, b) => a.urgency.localeCompare(b.urgency)),
    meta: { total: results.length },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const plan = db.successionPlans.create({
    ...body,
    home_id: body.home_id ?? "home_oak",
    candidates: body.candidates ?? [],
    created_by: body.created_by ?? "staff_darren",
  });
  return NextResponse.json({ data: plan }, { status: 201 });
}
