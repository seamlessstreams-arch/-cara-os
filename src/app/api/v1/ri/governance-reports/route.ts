import { NextRequest, NextResponse } from "next/server";
import { intelligenceDb } from "@/lib/intelligence/store";

export async function GET(req: NextRequest) {
  const homeId = req.nextUrl.searchParams.get("home_id") ?? "home_oak";
  const reports = intelligenceDb.riGovernanceReports.findAll(homeId);
  return NextResponse.json({
    data: reports,
    meta: { total: reports.length, published: reports.filter((r) => r.status === "published").length },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const record = intelligenceDb.riGovernanceReports.create({
    home_id: body.home_id ?? "home_oak",
    report_type: body.report_type ?? "strategic_summary",
    generated_by_aria: body.generated_by_aria ?? true,
    content: body.content ?? {},
    status: body.status ?? "draft",
    created_by: body.created_by ?? "staff_darren",
    ...body,
  });
  return NextResponse.json({ data: record }, { status: 201 });
}
