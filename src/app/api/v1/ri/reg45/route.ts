import { readJsonBody } from "@/lib/http/read-json";
import { getRequestIdentity } from "@/lib/auth-guard";
import { tenantHomeId } from "@/lib/supabase/tenant";
import { requireFields } from "@/lib/http/require-fields";
import { NextRequest, NextResponse } from "next/server";
import { intelligenceDb } from "@/lib/intelligence/store";
import { todayStr } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const homeId = req.nextUrl.searchParams.get("home_id") ?? tenantHomeId();
  const records = intelligenceDb.riReg45Evidence.findAll(homeId);
  return NextResponse.json({
    data: records,
    meta: { total: records.length, submitted: records.filter((r) => r.submitted_to_ofsted).length },
  });
}

export async function POST(req: NextRequest) {
  const __parsed = await readJsonBody(req);
  if (!__parsed.ok) return __parsed.response;
  const body = __parsed.data;
  // Statutory/formal record: the author must be the authenticated caller.
  // Reject rather than file it under a seed default or an anonymous author.
  const __identity = await getRequestIdentity(req);
  if (__identity instanceof NextResponse) return __identity;
  const __missing = requireFields(body, ["report_period"]);
  if (__missing) return __missing;
  const record = intelligenceDb.riReg45Evidence.create({
    home_id: body.home_id ?? tenantHomeId(),
    report_period: body.report_period ?? "",
    period_start: body.period_start ?? todayStr(),
    period_end: body.period_end ?? todayStr(),
    evidence_items: body.evidence_items ?? [],
    status: body.status ?? "draft",
    submitted_to_ofsted: false,
    ...body,
    created_by: __identity.userId,
  });
  return NextResponse.json({ data: record }, { status: 201 });
}
