import { NextRequest, NextResponse } from "next/server";
import { intelligenceDb } from "@/lib/intelligence/store";

export async function GET(req: NextRequest) {
  const homeId = req.nextUrl.searchParams.get("home_id") ?? "home_oak";
  const records = intelligenceDb.riReg45Evidence.findAll(homeId);
  return NextResponse.json({
    data: records,
    meta: { total: records.length, submitted: records.filter((r) => r.submitted_to_ofsted).length },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const record = intelligenceDb.riReg45Evidence.create({
    home_id: body.home_id ?? "home_oak",
    report_period: body.report_period ?? "",
    period_start: body.period_start ?? new Date().toISOString().split("T")[0],
    period_end: body.period_end ?? new Date().toISOString().split("T")[0],
    evidence_items: body.evidence_items ?? [],
    status: body.status ?? "draft",
    submitted_to_ofsted: false,
    created_by: body.created_by ?? "staff_darren",
    ...body,
  });
  return NextResponse.json({ data: record }, { status: 201 });
}
