// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CHILD KEYWORKING INTELLIGENCE API ROUTE
// GET /api/v1/child-keyworking-intelligence?childId=yp_alex
// Per-child engine analysing keyworking session frequency, quality,
// mood impact, thematic coverage, follow-up completion.
// CHR 2015 Reg 5, 6, 7, 10. SCCIF: "Quality of care."
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeChildKeyworking,
  type KeyworkSessionInput,
} from "@/lib/engines/child-keyworking-intelligence-engine";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const childId = searchParams.get("childId");
  if (!childId) {
    return NextResponse.json({ error: "childId is required" }, { status: 400 });
  }

  const store = getStore();
  const today = new Date().toISOString().slice(0, 10);

  // ── Child info ─────────────────────────────────────────────────────────
  const child = (store.youngPeople ?? []).find((yp: any) => yp.id === childId) as any;
  if (!child) {
    return NextResponse.json({ error: "Child not found" }, { status: 404 });
  }
  const childName = child.name ?? `${child.first_name ?? ""} ${child.last_name ?? ""}`.trim() || childId;

  // ── Keyworking Sessions ────────────────────────────────────────────────
  const sessions: KeyworkSessionInput[] = ((store.keyWorkingSessions ?? []) as any[])
    .filter((s: any) => s.child_id === childId)
    .map((s: any) => ({
      id: s.id,
      date: (s.date ?? today).toString().slice(0, 10),
      type: s.type ?? "one_to_one",
      duration_minutes: typeof s.duration === "number" ? s.duration : 30,
      topics: Array.isArray(s.topics) ? s.topics : [],
      has_child_voice: !!(s.child_voice && s.child_voice.trim().length > 0),
      mood_before: typeof s.mood_before === "number" ? s.mood_before : 3,
      mood_after: typeof s.mood_after === "number" ? s.mood_after : 3,
      actions_count: Array.isArray(s.actions_agreed) ? s.actions_agreed.length : 0,
      follow_up_completed: !!s.follow_up_completed,
      has_follow_up: !!(s.follow_up && s.follow_up.trim().length > 0),
      staff_id: s.staff_id ?? "unknown",
    }));

  // ── Compute ────────────────────────────────────────────────────────────
  const result = computeChildKeyworking({
    today,
    child_id: childId,
    child_name: childName,
    sessions,
  });

  return NextResponse.json({ data: result });
}
