import { readJsonBody } from "@/lib/http/read-json";
import { getRequestIdentity } from "@/lib/auth-guard";
import { tenantHomeId } from "@/lib/supabase/tenant";
import { requireFields } from "@/lib/http/require-fields";
import { NextRequest, NextResponse } from "next/server";
import { intelligenceDb } from "@/lib/intelligence/store";

export async function GET(req: NextRequest) {
  const homeId = req.nextUrl.searchParams.get("home_id") ?? tenantHomeId();
  const needs = intelligenceDb.trainingNeeds.findAll(homeId);
  return NextResponse.json({
    data: needs,
    meta: {
      total: needs.length,
      urgent: needs.filter((n) => n.priority === "urgent").length,
      open: needs.filter((n) => !["completed", "no_action"].includes(n.status)).length,
    },
  });
}

export async function POST(req: NextRequest) {
  const __parsed = await readJsonBody(req);
  if (!__parsed.ok) return __parsed.response;
  const body = __parsed.data;
  // Practice record: the author is the authenticated caller. An unresolved
  // live session records unattributed ('') rather than blocking or guessing.
  const __identity = await getRequestIdentity(req);
  const recordedBy = __identity instanceof NextResponse ? "" : __identity.userId;
  const __missing = requireFields(body, ["title"]);
  if (__missing) return __missing;
  const record = intelligenceDb.trainingNeeds.create({
    home_id: body.home_id ?? tenantHomeId(),
    identified_by: body.identified_by ?? "manual",
    need_type: body.need_type ?? "safeguarding",
    title: body.title ?? "Training Need",
    description: body.description ?? "",
    priority: body.priority ?? "medium",
    status: "identified",
    ...body,
    created_by: recordedBy,
  });
  return NextResponse.json({ data: record }, { status: 201 });
}
