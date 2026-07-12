import { NextRequest, NextResponse } from "next/server";
import { getRequestIdentity, assertChildHomeAccess } from "@/lib/auth-guard";
import { intelligenceDb } from "@/lib/intelligence/store";
import type { ChildResource, ChildResourceType, ResourceWritingStyle, ChildResourceStatus } from "@/types/extended";
import { readJsonBody } from "@/lib/http/read-json";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const childId = searchParams.get("child_id");

  const identity = await getRequestIdentity(req);
  if (identity instanceof NextResponse) return identity;
  const denied = assertChildHomeAccess(identity, childId);
  if (denied) return denied;
  const homeId  = searchParams.get("home_id") ?? "home_oak";
  const status  = searchParams.get("status");

  let results = childId
    ? intelligenceDb.childResources.findByChild(childId)
    : intelligenceDb.childResources.findAll(homeId);

  if (status) results = results.filter((r) => r.status === status);

  return NextResponse.json({ data: results, meta: { total: results.length } });
}

export async function POST(req: NextRequest) {
  let body: Partial<ChildResource>;
  const __parsed = await readJsonBody(req);
  if (!__parsed.ok) return __parsed.response;
  try { body = __parsed.data; }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const required = ["child_id","title","resource_type","theme","age_range","reading_level","tone"] as const;
  for (const field of required) {
    if (!body[field]) return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
  }

  const resource = intelligenceDb.childResources.create({
    home_id:       body.home_id ?? "home_oak",
    child_id:      body.child_id!,
    title:         body.title!,
    resource_type: body.resource_type as ChildResourceType,
    theme:         body.theme!,
    age_range:     body.age_range!,
    reading_level: body.reading_level!,
    tone:          body.tone as ResourceWritingStyle,
    content:       body.content ?? null,
    printable_html:body.printable_html,
    pdf_url:       body.pdf_url,
    created_by:    body.created_by ?? "staff_darren",
    approved_by:   body.approved_by,
    status:        (body.status as ChildResourceStatus) ?? "draft",
    approved_at:   body.approved_at,
  });

  intelligenceDb.caraAuditTrail.create({
    home_id:      resource.home_id,
    user_id:      resource.created_by,
    child_id:     resource.child_id,
    action_type:  "child_resource_created",
    source_table: "child_resources",
    source_id:    resource.id,
  });

  return NextResponse.json({ data: resource }, { status: 201 });
}
