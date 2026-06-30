import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { intelligenceDb } from "@/lib/intelligence/store";

export async function GET(req: NextRequest) {
  const homeId = req.nextUrl.searchParams.get("home_id") ?? "home_oak";
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
  const record = intelligenceDb.riChallengeLogs.create({
    home_id: body.home_id ?? "home_oak",
    title: body.title ?? "Challenge",
    challenge_area: body.challenge_area ?? "oversight",
    evidence_summary: body.evidence_summary ?? "",
    challenge_text: body.challenge_text ?? "",
    escalation_level: body.escalation_level ?? "standard",
    status: body.status ?? "open",
    cara_generated: body.cara_generated ?? false,
    created_by: body.created_by ?? "staff_darren",
    ...body,
  });
  return NextResponse.json({ data: record }, { status: 201 });
}
