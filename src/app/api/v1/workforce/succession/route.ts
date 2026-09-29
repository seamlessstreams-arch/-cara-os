import { readJsonBody } from "@/lib/http/read-json";
import { getRequestIdentity } from "@/lib/auth-guard";
import { tenantHomeId } from "@/lib/supabase/tenant";
import { requireFields } from "@/lib/http/require-fields";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const homeId = searchParams.get("home_id");

  let results = db.successionPlans.findAll();
  if (homeId) results = results.filter((s) => s.home_id === homeId);

  return NextResponse.json({
    data: results.sort((a, b) => a.urgency.localeCompare(b.urgency)),
    meta: { total: results.length },
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
  const plan = db.successionPlans.create({
    ...body,
    created_by: __identity.userId,
    home_id: body.home_id ?? tenantHomeId(),
    candidates: body.candidates ?? [],
  });
  return NextResponse.json({ data: plan }, { status: 201 });
}
