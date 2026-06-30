import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const staffId = searchParams.get("staff_id");
  const status = searchParams.get("status");

  if (staffId) {
    const record = db.inductionRecords.findByStaff(staffId);
    return NextResponse.json({ data: record ?? null });
  }

  let results = db.inductionRecords.findAll();
  if (status) results = db.inductionRecords.findByStatus(status);

  return NextResponse.json({
    data: results,
    meta: { total: results.length, in_progress: results.filter((r) => r.overall_status === "in_progress").length },
  });
}

export async function POST(req: NextRequest) {
  const __parsed = await readJsonBody(req);
  if (!__parsed.ok) return __parsed.response;
  const body = __parsed.data;
  const record = db.inductionRecords.create({
    ...body,
    home_id: body.home_id ?? "home_oak",
    items: body.items ?? [],
    overall_status: body.overall_status ?? "not_started",
    created_by: body.created_by ?? "staff_darren",
  });
  return NextResponse.json({ data: record }, { status: 201 });
}
