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

  let results = db.developmentPlans.findAll();
  if (staffId) results = db.developmentPlans.findByStaff(staffId);
  if (status) results = results.filter((p) => p.status === status);

  return NextResponse.json({
    data: results.sort((a, b) => b.created_at.localeCompare(a.created_at)),
    meta: { total: results.length, active: results.filter((p) => p.status === "active").length },
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
  const plan = db.developmentPlans.create({
    ...body,
    created_by: __identity.userId,
    home_id: body.home_id ?? tenantHomeId(),
    status: body.status ?? "draft",
    actions: body.actions ?? [],
    cara_generated: body.cara_generated ?? false,
  });
  return NextResponse.json({ data: plan }, { status: 201 });
}
