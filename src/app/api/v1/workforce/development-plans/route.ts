import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const staffId = searchParams.get("staff_id");
  const status = searchParams.get("status");

  let results = db.developmentPlans.findAll();
  if (staffId) results = db.developmentPlans.findByStaff(staffId);
  if (status) results = results.filter((p) => p.status === status);

  return NextResponse.json({
    data: results.sort((a, b) => b.created_at.localeCompare(a.created_at)),
    meta: { total: results.length, active: results.filter((p) => p.status === "active").length },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const plan = db.developmentPlans.create({
    ...body,
    home_id: body.home_id ?? "home_oak",
    status: body.status ?? "draft",
    actions: body.actions ?? [],
    aria_generated: body.aria_generated ?? false,
    created_by: body.created_by ?? "staff_darren",
  });
  return NextResponse.json({ data: plan }, { status: 201 });
}
