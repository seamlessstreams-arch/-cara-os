import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const staffId = searchParams.get("staff_id");
  const expiring = searchParams.get("expiring_days");

  if (staffId) {
    const results = db.qualifications.findByStaff(staffId);
    return NextResponse.json({ data: results, meta: { total: results.length } });
  }

  if (expiring) {
    const results = db.qualifications.findExpiring(parseInt(expiring));
    return NextResponse.json({ data: results, meta: { total: results.length } });
  }

  const results = db.qualifications.findAll();
  return NextResponse.json({
    data: results,
    meta: {
      total: results.length,
      not_started: results.filter((q) => q.status === "not_started").length,
      in_progress: results.filter((q) => q.status === "in_progress").length,
      expired: results.filter((q) => q.status === "expired").length,
    },
  });
}

export async function POST(req: NextRequest) {
  const __parsed = await readJsonBody(req);
  if (!__parsed.ok) return __parsed.response;
  const body = __parsed.data;
  const qual = db.qualifications.create({
    ...body,
    home_id: body.home_id ?? "home_oak",
    mandatory: body.mandatory ?? false,
    created_by: body.created_by ?? "staff_darren",
  });
  return NextResponse.json({ data: qual }, { status: 201 });
}
