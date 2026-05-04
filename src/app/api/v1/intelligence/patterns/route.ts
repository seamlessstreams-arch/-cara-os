import { NextRequest, NextResponse } from "next/server";
import { intelligenceDb } from "@/lib/intelligence/store";
import type { PatternAlert } from "@/types/extended";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const childId = searchParams.get("child_id");
  const homeId = searchParams.get("home_id") ?? "home_oak";
  const status = searchParams.get("status");

  let results: PatternAlert[];

  if (childId) {
    results = intelligenceDb.patterns.findByChild(childId);
  } else {
    results = intelligenceDb.patterns.findAll(homeId);
  }

  if (status) {
    results = results.filter((p) => p.status === status);
  }

  return NextResponse.json({
    data: results,
    meta: {
      total: results.length,
      active: results.filter((p) => p.status === "active").length,
      critical: results.filter((p) => p.severity === "critical").length,
      high: results.filter((p) => p.severity === "high").length,
    },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json() as Partial<PatternAlert>;

  const required = ["alert_type", "title", "description", "severity", "period_start", "period_end", "reflective_prompt"] as const;
  for (const field of required) {
    if (!body[field]) {
      return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
    }
  }

  const validSeverities = ["low", "medium", "high", "critical"];
  if (!validSeverities.includes(body.severity!)) {
    return NextResponse.json({ error: "severity must be one of: low, medium, high, critical" }, { status: 400 });
  }

  const alert = intelligenceDb.patterns.create({
    home_id: body.home_id ?? "home_oak",
    child_id: body.child_id ?? null,
    alert_type: body.alert_type!,
    title: body.title!,
    description: body.description!,
    severity: body.severity!,
    status: "active",
    evidence_refs: body.evidence_refs ?? [],
    reflective_prompt: body.reflective_prompt!,
    detected_at: body.detected_at ?? new Date().toISOString(),
    period_start: body.period_start!,
    period_end: body.period_end!,
    acknowledged_by: null,
    acknowledged_at: null,
    resolved_by: null,
    resolved_at: null,
  });

  return NextResponse.json({ data: alert }, { status: 201 });
}
