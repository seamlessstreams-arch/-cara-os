import { readJsonBody } from "@/lib/http/read-json";
import { getRequestIdentity } from "@/lib/auth-guard";
import { tenantHomeId } from "@/lib/supabase/tenant";
import { requireFields } from "@/lib/http/require-fields";
import { NextRequest, NextResponse } from "next/server";
import { intelligenceDb } from "@/lib/intelligence/store";

export async function GET(req: NextRequest) {
  const homeId = req.nextUrl.searchParams.get("home_id") ?? tenantHomeId();
  const gaps = intelligenceDb.knowledgeGaps.findAll(homeId);
  return NextResponse.json({
    data: gaps,
    meta: { total: gaps.length, critical: gaps.filter((g) => g.severity === "critical").length },
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
  const __missing = requireFields(body, ["gap_area"]);
  if (__missing) return __missing;
  const record = intelligenceDb.knowledgeGaps.create({
    home_id: body.home_id ?? tenantHomeId(),
    gap_area: body.gap_area ?? "",
    severity: body.severity ?? "moderate",
    identified_from: body.identified_from ?? "supervision",
    status: "open",
    ...body,
    created_by: recordedBy,
  });
  return NextResponse.json({ data: record }, { status: 201 });
}
