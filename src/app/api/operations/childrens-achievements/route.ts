import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listAchievements,
  createAchievement,
  updateAchievement,
  ACHIEVEMENT_CATEGORIES,
  ACHIEVEMENT_SIGNIFICANCES,
  CELEBRATION_METHODS,
} from "@/lib/services/childrens-achievements-service";
import type {
  AchievementCategory,
  AchievementSignificance,
} from "@/lib/services/childrens-achievements-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "achievement_categories") return NextResponse.json({ ok: true, data: ACHIEVEMENT_CATEGORIES });
  if (type === "achievement_significances") return NextResponse.json({ ok: true, data: ACHIEVEMENT_SIGNIFICANCES });
  if (type === "celebration_methods") return NextResponse.json({ ok: true, data: CELEBRATION_METHODS });

  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }
  const result = await listAchievements(homeId, {
    childId: searchParams.get("childId") ?? undefined,
    category: (searchParams.get("category") ?? undefined) as AchievementCategory | undefined,
    significance: (searchParams.get("significance") ?? undefined) as AchievementSignificance | undefined,
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

  if (action === "create_achievement") {
    const result = await createAchievement(payload);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
  }
  if (action === "update_achievement") {
    const { id, ...updates } = payload;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const result = await updateAchievement(id, updates);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
