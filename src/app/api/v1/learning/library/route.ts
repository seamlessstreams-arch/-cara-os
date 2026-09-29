import { readJsonBody } from "@/lib/http/read-json";
import { getRequestIdentity } from "@/lib/auth-guard";
import { tenantHomeId } from "@/lib/supabase/tenant";
import { requireFields } from "@/lib/http/require-fields";
import { NextRequest, NextResponse } from "next/server";
import { intelligenceDb } from "@/lib/intelligence/store";

export async function GET(req: NextRequest) {
  const homeId = req.nextUrl.searchParams.get("home_id") ?? tenantHomeId();
  const entries = intelligenceDb.resourceLibrary.findAll(homeId);
  return NextResponse.json({
    data: entries,
    meta: { total: entries.length, approved: entries.filter((e) => e.is_approved).length, pinned: entries.filter((e) => e.is_pinned).length },
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
  const record = intelligenceDb.resourceLibrary.create({
    home_id: body.home_id ?? tenantHomeId(),
    resource_id: body.resource_id ?? "",
    resource_type: body.resource_type ?? "guidance_note",
    title: body.title ?? "Resource",
    is_approved: body.is_approved ?? false,
    is_pinned: body.is_pinned ?? false,
    usage_count: 0,
    ...body,
    created_by: recordedBy,
  });
  return NextResponse.json({ data: record }, { status: 201 });
}
