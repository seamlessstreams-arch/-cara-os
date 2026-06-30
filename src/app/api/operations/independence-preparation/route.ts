import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listSkills,
  createSkill,
  updateSkill,
  SKILL_AREAS,
  COMPETENCY_LEVELS,
  ASSESSMENT_FREQUENCIES,
} from "@/lib/services/independence-preparation-service";
import type {
  SkillArea,
  CompetencyLevel,
} from "@/lib/services/independence-preparation-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "skill_areas") return NextResponse.json({ ok: true, data: SKILL_AREAS });
  if (type === "competency_levels") return NextResponse.json({ ok: true, data: COMPETENCY_LEVELS });
  if (type === "assessment_frequencies") return NextResponse.json({ ok: true, data: ASSESSMENT_FREQUENCIES });

  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }
  const result = await listSkills(homeId, {
    childId: searchParams.get("childId") ?? undefined,
    skillArea: (searchParams.get("skillArea") ?? undefined) as SkillArea | undefined,
    competencyLevel: (searchParams.get("competencyLevel") ?? undefined) as CompetencyLevel | undefined,
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

  if (action === "create_skill") {
    const result = await createSkill(payload);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
  }
  if (action === "update_skill") {
    const { id, ...updates } = payload;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const result = await updateSkill(id, updates);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
