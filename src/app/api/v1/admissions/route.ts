import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  let records = db.admissionReferrals.getAll();
  if (status) records = records.filter((r) => r.status === status);

  records = [...records].sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));

  const active = records.filter((r) => !["declined", "withdrawn", "placed"].includes(r.status)).length;
  const placedThisYear = records.filter((r) => r.status === "placed").length;

  return NextResponse.json({
    data: records,
    meta: { total: records.length, active, placed_this_year: placedThisYear },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.child_name) {
    return NextResponse.json({ error: "Missing required field: child_name" }, { status: 400 });
  }
  const record = db.admissionReferrals.create({
    child_name: body.child_name,
    date_of_birth: body.date_of_birth ?? "",
    age: body.age ?? 0,
    gender: body.gender ?? "prefer_not_to_say",
    ethnicity: body.ethnicity ?? "",
    referral_date: body.referral_date ?? new Date().toISOString().slice(0, 10),
    referral_source: body.referral_source ?? "local_authority",
    referred_by: body.referred_by ?? "",
    local_authority: body.local_authority ?? "",
    status: body.status ?? "new",
    presenting_needs: body.presenting_needs ?? [],
    risk_factors: body.risk_factors ?? [],
    placement_history: body.placement_history ?? "",
    impact_assessment_complete: body.impact_assessment_complete ?? false,
    impact_assessment_notes: body.impact_assessment_notes ?? "",
    matching_considerations: body.matching_considerations ?? "",
    decision_date: body.decision_date ?? "",
    decision_by: body.decision_by ?? "",
    decision_reason: body.decision_reason ?? "",
    estimated_placement_date: body.estimated_placement_date ?? "",
    notes: body.notes ?? "",
    staff_id: body.staff_id ?? "staff_darren",
    home_id: body.home_id ?? "home_oak",
  });
  return NextResponse.json({ data: record }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  if (!body.id) {
    return NextResponse.json({ error: "Missing required field: id" }, { status: 400 });
  }
  const { id, ...data } = body;
  const updated = db.admissionReferrals.update(id, data);
  if (!updated) {
    return NextResponse.json({ error: "Referral not found" }, { status: 404 });
  }
  return NextResponse.json({ data: updated });
}
