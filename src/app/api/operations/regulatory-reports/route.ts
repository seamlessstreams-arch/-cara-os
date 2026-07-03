import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listReports,
  getReport,
  createReport,
  updateReport,
  updateReportSection,
  submitReport,
  approveReport,
  REG44_SECTIONS,
  REG45_SECTIONS,
} from "@/lib/services/regulatory-reporting-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  // Static templates (no DB)
  if (type === "templates") {
    return NextResponse.json({
      ok: true,
      data: {
        reg44: REG44_SECTIONS,
        reg45: REG45_SECTIONS,
      },
    });
  }

  // Single report
  const id = searchParams.get("id");
  if (id) {
    const result = await getReport(id);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }

  // List reports
  const result = await listReports(homeId, {
    reportType: (searchParams.get("reportType") as "reg44" | "reg45") ?? undefined,
    status: (searchParams.get("status") as "draft" | "submitted") ?? undefined,
    limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
    offset: searchParams.get("offset") ? parseInt(searchParams.get("offset")!) : undefined,
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json({ ok: true, data: result.data });
}

export async function POST(request: NextRequest) {
  try {
    const __jb0 = await readJsonBody(request); if (!__jb0.ok) return __jb0.response; const body = __jb0.data;
    const { action, homeId } = body;

    if (!homeId) {
      return NextResponse.json({ error: "homeId required" }, { status: 400 });
    }

    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, persisted: false });
    }

    if (action === "create") {
      const result = await createReport({
        homeId,
        report_type: body.reportType,
        title: body.title,
        author_id: body.authorId,
        reporting_period_start: body.reportingPeriodStart,
        reporting_period_end: body.reportingPeriodEnd,
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    if (action === "update") {
      const { id, ...updates } = body;
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      const result = await updateReport(id, updates);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    if (action === "update_section") {
      const { reportId, sectionId, content, reviewedBy } = body;
      if (!reportId || !sectionId) return NextResponse.json({ error: "reportId and sectionId required" }, { status: 400 });
      const result = await updateReportSection(reportId, sectionId, content, reviewedBy);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    if (action === "submit") {
      const { id, submittedTo } = body;
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      const result = await submitReport(id, submittedTo);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    if (action === "approve") {
      const { id, reviewerId } = body;
      if (!id || !reviewerId) return NextResponse.json({ error: "id and reviewerId required" }, { status: 400 });
      const result = await approveReport(id, reviewerId);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    return NextResponse.json({ error: "action must be create, update, update_section, submit, or approve" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
