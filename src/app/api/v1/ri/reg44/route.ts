import { NextRequest, NextResponse } from "next/server";
import { intelligenceDb } from "@/lib/intelligence/store";

export async function GET(req: NextRequest) {
  const homeId = req.nextUrl.searchParams.get("home_id") ?? "home_oak";
  const records = intelligenceDb.reg44Visits.findAll(homeId);
  return NextResponse.json({
    data: records,
    meta: {
      total: records.length,
      scheduled: records.filter((r) => r.status === "scheduled").length,
      open_actions: records.reduce(
        (n, v) => n + v.findings.filter((f) => f.action_required && !f.action_completed).length,
        0,
      ),
    },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const record = intelligenceDb.reg44Visits.create({
    home_id: body.home_id ?? "home_oak",
    visit_number: body.visit_number ?? 1,
    visit_date: body.visit_date ?? null,
    scheduled_date: body.scheduled_date ?? new Date().toISOString().split("T")[0],
    visitor_name: body.visitor_name ?? "",
    visitor_organisation: body.visitor_organisation ?? null,
    status: body.status ?? "scheduled",
    report_received_date: null,
    report_document_id: null,
    findings: [],
    overall_finding: null,
    manager_response: null,
    manager_response_date: null,
    manager_response_by: null,
    ri_review_date: null,
    ri_review_by: null,
    ri_comments: null,
    cara_summary: null,
    created_by: body.created_by ?? "staff_darren",
    ...body,
  });
  return NextResponse.json({ data: record }, { status: 201 });
}
