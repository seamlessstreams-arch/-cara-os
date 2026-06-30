import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listRecords, createRecord, updateRecord,
  OUTCOME_DOMAINS, PROGRESS_RATINGS, ASSESSMENT_TOOLS, REVIEW_PERIODS,
} from "@/lib/services/childrens-progress-tracking-service";
import type { OutcomeDomain, ProgressRating, AssessmentTool, ReviewPeriod } from "@/lib/services/childrens-progress-tracking-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");
  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });
  if (type === "outcome_domains") return NextResponse.json({ ok: true, data: OUTCOME_DOMAINS });
  if (type === "progress_ratings") return NextResponse.json({ ok: true, data: PROGRESS_RATINGS });
  if (type === "assessment_tools") return NextResponse.json({ ok: true, data: ASSESSMENT_TOOLS });
  if (type === "review_periods") return NextResponse.json({ ok: true, data: REVIEW_PERIODS });
  if (!isSupabaseEnabled()) return NextResponse.json({ ok: true, data: [], persisted: false });
  const result = await listRecords(homeId, {
    outcomeDomain: (searchParams.get("outcomeDomain") ?? undefined) as OutcomeDomain | undefined,
    progressRating: (searchParams.get("progressRating") ?? undefined) as ProgressRating | undefined,
    assessmentTool: (searchParams.get("assessmentTool") ?? undefined) as AssessmentTool | undefined,
    reviewPeriod: (searchParams.get("reviewPeriod") ?? undefined) as ReviewPeriod | undefined,
    limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json({ ok: true, data: result.data });
}

export async function POST(request: NextRequest) {
  const __parsed = await readJsonBody(request);
  if (!__parsed.ok) return __parsed.response;
  const body = __parsed.data;
  const { action, ...payload } = body;
  if (action === "create_record") {
    const result = await createRecord(payload);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
  }
  if (action === "update_record") {
    const { id, ...updates } = payload;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const result = await updateRecord(id, updates);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }
  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
