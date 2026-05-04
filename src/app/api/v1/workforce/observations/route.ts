import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const staffId = searchParams.get("staff_id");

  const results = staffId
    ? db.practiceObservations.findByStaff(staffId)
    : db.practiceObservations.findAll();

  return NextResponse.json({
    data: results.sort((a, b) => b.observation_date.localeCompare(a.observation_date)),
    meta: { total: results.length },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const obs = db.practiceObservations.create({
    ...body,
    home_id: body.home_id ?? "home_oak",
    domains_observed: body.domains_observed ?? [],
    strengths_noted: body.strengths_noted ?? [],
    areas_for_development: body.areas_for_development ?? [],
    score_adjustments: body.score_adjustments ?? [],
    signed_off_by_staff: false,
  });
  return NextResponse.json({ data: obs }, { status: 201 });
}
