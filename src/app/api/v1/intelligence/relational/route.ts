import { NextRequest, NextResponse } from "next/server";
import { getRequestIdentity, assertChildHomeAccess } from "@/lib/auth-guard";
import { intelligenceDb } from "@/lib/intelligence/store";
import type { RelationalRecord } from "@/types/extended";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const childId = searchParams.get("child_id");

  const identity = await getRequestIdentity(req);
  if (identity instanceof NextResponse) return identity;
  const denied = assertChildHomeAccess(identity, childId);
  if (denied) return denied;
  const type = searchParams.get("type") ?? undefined;

  if (!childId) {
    return NextResponse.json({ error: "child_id is required" }, { status: 400 });
  }

  const results = intelligenceDb.relational.findByChild(childId, type);

  return NextResponse.json({
    data: results,
    meta: {
      total: results.length,
      positive: results.filter((r) => r.is_positive).length,
      to_avoid: results.filter((r) => !r.is_positive).length,
    },
  });
}

export async function POST(req: NextRequest) {

  const identity = await getRequestIdentity(req);
  if (identity instanceof NextResponse) return identity;
  const body = await req.json() as Partial<RelationalRecord>;
  const denied = assertChildHomeAccess(identity, (body as { child_id?: string }).child_id);
  if (denied) return denied;

  const required = ["child_id", "record_type", "title", "description", "created_by"] as const;
  for (const field of required) {
    if (!body[field]) {
      return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
    }
  }

  const validTypes = [
    "trust_moment", "rupture_repair", "de_escalation", "regulation_strategy",
    "preferred_adult", "what_helps", "what_to_avoid", "attachment_indicator",
    "sensory_need", "voice_indicator",
  ];
  if (!validTypes.includes(body.record_type!)) {
    return NextResponse.json({ error: `record_type must be one of: ${validTypes.join(", ")}` }, { status: 400 });
  }

  const validConfidences = ["low", "medium", "high"];
  if (body.confidence && !validConfidences.includes(body.confidence)) {
    return NextResponse.json({ error: "confidence must be one of: low, medium, high" }, { status: 400 });
  }

  const record = intelligenceDb.relational.create({
    home_id: body.home_id ?? "home_oak",
    child_id: body.child_id!,
    record_type: body.record_type!,
    title: body.title!,
    description: body.description!,
    staff_id: body.staff_id ?? null,
    is_positive: body.is_positive ?? true,
    confidence: body.confidence ?? "medium",
    source_ref_type: body.source_ref_type ?? null,
    source_ref_id: body.source_ref_id ?? null,
    created_by: body.created_by!,
  });

  return NextResponse.json({ data: record }, { status: 201 });
}
