import { readJsonBody } from "@/lib/http/read-json";
import { getRequestIdentity } from "@/lib/auth-guard";
import { tenantHomeId } from "@/lib/supabase/tenant";
import { requireFields } from "@/lib/http/require-fields";
import { NextRequest, NextResponse } from "next/server";
import { intelligenceDb } from "@/lib/intelligence/store";

export async function GET(req: NextRequest) {
  const homeId = req.nextUrl.searchParams.get("home_id") ?? tenantHomeId();
  const logs = intelligenceDb.riChallengeLogs.findAll(homeId);
  return NextResponse.json({
    data: logs,
    meta: {
      total: logs.length,
      open: logs.filter((l) => l.status === "open").length,
      critical: logs.filter((l) => l.escalation_level === "critical" || l.escalation_level === "formal").length,
    },
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
  const __missing = requireFields(body, ["title"]);
  if (__missing) return __missing;
  const record = intelligenceDb.riChallengeLogs.create({
    home_id: body.home_id ?? tenantHomeId(),
    title: body.title ?? "Challenge",
    challenge_area: body.challenge_area ?? "oversight",
    evidence_summary: body.evidence_summary ?? "",
    challenge_text: body.challenge_text ?? "",
    escalation_level: body.escalation_level ?? "standard",
    status: body.status ?? "open",
    cara_generated: body.cara_generated ?? false,
    ...body,
    created_by: __identity.userId,
  });
  return NextResponse.json({ data: record }, { status: 201 });
}
