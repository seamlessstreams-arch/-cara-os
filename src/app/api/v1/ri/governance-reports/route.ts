import { readJsonBody } from "@/lib/http/read-json";
import { getRequestIdentity } from "@/lib/auth-guard";
import { tenantHomeId } from "@/lib/supabase/tenant";
import { requireFields } from "@/lib/http/require-fields";
import { NextRequest, NextResponse } from "next/server";
import { intelligenceDb } from "@/lib/intelligence/store";

export async function GET(req: NextRequest) {
  const homeId = req.nextUrl.searchParams.get("home_id") ?? tenantHomeId();
  const reports = intelligenceDb.riGovernanceReports.findAll(homeId);
  return NextResponse.json({
    data: reports,
    meta: { total: reports.length, published: reports.filter((r) => r.status === "published").length },
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
  const __missing = requireFields(body, ["content"]);
  if (__missing) return __missing;
  const record = intelligenceDb.riGovernanceReports.create({
    home_id: body.home_id ?? tenantHomeId(),
    report_type: body.report_type ?? "strategic_summary",
    // absence-ok: unstated provenance defaults to Cara-generated — over-declaring AI authorship is the safe direction for governance transparency
    generated_by_cara: body.generated_by_cara ?? true,
    content: body.content ?? {},
    status: body.status ?? "draft",
    ...body,
    created_by: __identity.userId,
  });
  return NextResponse.json({ data: record }, { status: 201 });
}
