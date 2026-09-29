import { readJsonBody } from "@/lib/http/read-json";
import { getRequestIdentity } from "@/lib/auth-guard";
import { tenantHomeId } from "@/lib/supabase/tenant";
import { rejectFutureDates } from "@/lib/http/retrospective-dates";
import { requireFields } from "@/lib/http/require-fields";
import { NextRequest, NextResponse } from "next/server";
import { intelligenceDb } from "@/lib/intelligence/store";
import { todayStr } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const homeId = req.nextUrl.searchParams.get("home_id") ?? tenantHomeId();
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
  const __parsed = await readJsonBody(req);
  if (!__parsed.ok) return __parsed.response;
  const body = __parsed.data;
  // A Reg 44 independent-visit report is a statutory record; who authored it
  // must be the authenticated caller, not a seed default. Reject rather than
  // file it under a guessed or anonymous author.
  const __identity = await getRequestIdentity(req);
  if (__identity instanceof NextResponse) return __identity;
  const __missing = requireFields(body, ["visitor_name"]);
  if (__missing) return __missing;
  const __fd = rejectFutureDates(body, ["visit_date"]); if (__fd) return __fd;
  const record = intelligenceDb.reg44Visits.create({
    home_id: body.home_id ?? tenantHomeId(),
    visit_number: body.visit_number ?? 1,
    visit_date: body.visit_date ?? null,
    scheduled_date: body.scheduled_date ?? todayStr(),
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
    ...body,
    created_by: __identity.userId, // after ...body: the authenticated caller is authoritative
  });
  return NextResponse.json({ data: record }, { status: 201 });
}
