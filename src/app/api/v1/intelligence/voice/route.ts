import { NextRequest, NextResponse } from "next/server";
import { intelligenceDb } from "@/lib/intelligence/store";
import type { VoiceRecord } from "@/types/extended";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const childId = searchParams.get("child_id");
  const theme = searchParams.get("theme");

  if (!childId) {
    return NextResponse.json({ error: "child_id is required" }, { status: 400 });
  }

  let results = intelligenceDb.voice.findByChild(childId);
  if (theme) {
    results = results.filter((v) => v.theme === theme);
  }

  return NextResponse.json({
    data: results,
    meta: {
      total: results.length,
      heeded: results.filter((v) => v.voice_heeded === true).length,
      not_heeded: results.filter((v) => v.voice_heeded === false).length,
    },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json() as Partial<VoiceRecord>;

  const required = ["child_id", "recorded_at", "theme", "capture_method", "recorded_by"] as const;
  for (const field of required) {
    if (!body[field]) {
      return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
    }
  }

  if (!body.direct_quote && !body.paraphrase) {
    return NextResponse.json({ error: "At least one of direct_quote or paraphrase is required" }, { status: 400 });
  }

  const validThemes = [
    "wishes", "feelings", "concerns", "complaints", "compliments",
    "needs", "relationships", "plans", "activities", "education",
    "health", "identity", "culture", "future",
  ];
  if (!validThemes.includes(body.theme!)) {
    return NextResponse.json({ error: `theme must be one of: ${validThemes.join(", ")}` }, { status: 400 });
  }

  const validMethods = ["direct", "observed", "interpreted", "written", "advocate"];
  if (!validMethods.includes(body.capture_method!)) {
    return NextResponse.json({ error: `capture_method must be one of: ${validMethods.join(", ")}` }, { status: 400 });
  }

  const record = intelligenceDb.voice.create({
    home_id: body.home_id ?? "home_oak",
    child_id: body.child_id!,
    recorded_at: body.recorded_at!,
    theme: body.theme!,
    direct_quote: body.direct_quote ?? null,
    paraphrase: body.paraphrase ?? null,
    capture_method: body.capture_method!,
    action_taken: body.action_taken ?? null,
    action_owner: body.action_owner ?? null,
    action_outcome: body.action_outcome ?? null,
    voice_heeded: body.voice_heeded ?? null,
    source_ref_type: body.source_ref_type ?? null,
    source_ref_id: body.source_ref_id ?? null,
    recorded_by: body.recorded_by!,
  });

  return NextResponse.json({ data: record }, { status: 201 });
}
