import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { getRequestIdentity, assertChildHomeAccess } from "@/lib/auth-guard";
import { intelligenceDb } from "@/lib/intelligence/store";
import type { ChildExperienceSnapshot } from "@/types/extended";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const childId = searchParams.get("child_id");

  const identity = await getRequestIdentity(req);
  if (identity instanceof NextResponse) return identity;
  const denied = assertChildHomeAccess(identity, childId);
  if (denied) return denied;
  const latest = searchParams.get("latest") === "true";

  if (!childId) {
    return NextResponse.json({ error: "child_id is required" }, { status: 400 });
  }

  if (latest) {
    const snapshot = intelligenceDb.childExperience.findLatest(childId);
    if (!snapshot) {
      return NextResponse.json({ error: "No snapshot found for this child" }, { status: 404 });
    }
    return NextResponse.json({ data: snapshot });
  }

  const snapshots = intelligenceDb.childExperience.findByChild(childId);
  return NextResponse.json({
    data: snapshots,
    meta: {
      total: snapshots.length,
      latest_score: snapshots[0]?.overall_score ?? null,
      latest_delta: snapshots[0]?.score_delta ?? null,
    },
  });
}

export async function POST(req: NextRequest) {

  const identity = await getRequestIdentity(req);
  if (identity instanceof NextResponse) return identity;
  const __parsed = await readJsonBody(req);
  if (!__parsed.ok) return __parsed.response;
  const body = __parsed.data as Partial<ChildExperienceSnapshot>;
  const denied = assertChildHomeAccess(identity, (body as { child_id?: string }).child_id);
  if (denied) return denied;

  const required = [
    "child_id", "home_id", "period_start", "period_end",
    "safety_score", "belonging_score", "regulation_score", "engagement_score",
    "relationships_score", "participation_score", "health_score", "education_score",
    "stability_score", "achievement_score", "overall_score", "narrative",
  ] as const;

  for (const field of required) {
    if (body[field] === undefined || body[field] === null) {
      return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
    }
  }

  // Validate scores are in range
  const scoreFields = [
    "safety_score", "belonging_score", "regulation_score", "engagement_score",
    "relationships_score", "participation_score", "health_score", "education_score",
    "stability_score", "achievement_score", "overall_score",
  ] as const;

  for (const field of scoreFields) {
    const val = body[field] as number;
    if (typeof val !== "number" || val < 0 || val > 100) {
      return NextResponse.json({ error: `${field} must be a number between 0 and 100` }, { status: 400 });
    }
  }

  const snapshot = intelligenceDb.childExperience.create({
    child_id: body.child_id!,
    home_id: body.home_id ?? "home_oak",
    period_start: body.period_start!,
    period_end: body.period_end!,
    safety_score: body.safety_score!,
    belonging_score: body.belonging_score!,
    regulation_score: body.regulation_score!,
    engagement_score: body.engagement_score!,
    relationships_score: body.relationships_score!,
    participation_score: body.participation_score!,
    health_score: body.health_score!,
    education_score: body.education_score!,
    stability_score: body.stability_score!,
    achievement_score: body.achievement_score!,
    overall_score: body.overall_score!,
    score_delta: body.score_delta ?? null,
    narrative: body.narrative!,
    trend: body.trend,
    strengths: body.strengths ?? [],
    concerns: body.concerns ?? [],
    evidence_refs: body.evidence_refs ?? [],
    computed_by: body.computed_by ?? "cara",
    reviewed_by: body.reviewed_by ?? null,
  });

  return NextResponse.json({ data: snapshot }, { status: 201 });
}
