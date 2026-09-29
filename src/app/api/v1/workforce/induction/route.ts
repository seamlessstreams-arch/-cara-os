import { readJsonBody } from "@/lib/http/read-json";
import { getRequestIdentity } from "@/lib/auth-guard";
import { tenantHomeId } from "@/lib/supabase/tenant";
import { requireFields } from "@/lib/http/require-fields";
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
  // Statutory/formal record: the author must be the authenticated caller.
  // Reject rather than file it under a seed default or an anonymous author.
  const __identity = await getRequestIdentity(req);
  if (__identity instanceof NextResponse) return __identity;
  const __missing = requireFields(body, ["staff_id"]);
  if (__missing) return __missing;
  const record = db.inductionRecords.create({
    ...body,
    created_by: __identity.userId,
    home_id: body.home_id ?? tenantHomeId(),
    items: body.items ?? [],
    overall_status: body.overall_status ?? "not_started",
  });
  return NextResponse.json({ data: record }, { status: 201 });
}
