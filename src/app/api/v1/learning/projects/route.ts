import { readJsonBody } from "@/lib/http/read-json";
import { getRequestIdentity } from "@/lib/auth-guard";
import { tenantHomeId } from "@/lib/supabase/tenant";
import { requireFields } from "@/lib/http/require-fields";
import { NextRequest, NextResponse } from "next/server";
import { intelligenceDb } from "@/lib/intelligence/store";

export async function GET(req: NextRequest) {
  const homeId = req.nextUrl.searchParams.get("home_id") ?? tenantHomeId();
  const projects = intelligenceDb.learningProjects.findAll(homeId);
  return NextResponse.json({
    data: projects,
    meta: { total: projects.length, active: projects.filter((p) => p.status === "active").length },
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
  const __missing = requireFields(body, ["project_name"]);
  if (__missing) return __missing;
  const record = intelligenceDb.learningProjects.create({
    home_id: body.home_id ?? tenantHomeId(),
    project_name: body.project_name ?? "New Project",
    pathway: body.pathway ?? "staff",
    topic: body.topic ?? "",
    risk_level: body.risk_level ?? "low",
    reading_level: body.reading_level ?? "standard",
    tone: body.tone ?? "professional",
    status: "active",
    ...body,
    created_by: recordedBy,
  });
  return NextResponse.json({ data: record }, { status: 201 });
}
