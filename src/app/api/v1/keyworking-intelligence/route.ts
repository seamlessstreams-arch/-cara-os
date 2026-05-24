// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — KEYWORKING INTELLIGENCE API ROUTE
// GET /api/v1/keyworking-intelligence
// Returns keywork session analysis, mood impact, follow-up compliance,
// per-child profiles, topic coverage, and ARIA keyworking insights.
// Reg 9/14/22 — care quality, care plans, young person voice.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeKeyworkingIntelligence,
  type ChildInput,
  type KeyworkSessionInput,
} from "@/lib/engines/keyworking-intelligence-engine";

export async function GET() {
  const store = getStore();

  // ── Map children ─────────────────────────────────────────────────────────
  const children: ChildInput[] = store.youngPeople.map((yp) => ({
    id: yp.id,
    name: yp.preferred_name ?? yp.first_name,
  }));

  // ── Map key working sessions ─────────────────────────────────────────────
  const sessions: KeyworkSessionInput[] = store.keyWorkingSessions.map((s) => ({
    id: s.id,
    child_id: s.child_id,
    staff_id: s.staff_id,
    date: s.date,
    type: s.type,
    duration_minutes: s.duration,
    topics: s.topics,
    has_child_voice: Boolean(s.child_voice && s.child_voice.trim().length > 0),
    mood_before: s.mood_before,
    mood_after: s.mood_after,
    follow_up_date: s.follow_up_date ?? "",
    follow_up_completed: s.follow_up_completed,
    actions_agreed_count: s.actions_agreed.length,
    linked_goals_count: s.linked_goals.length,
  }));

  // ── Run engine ───────────────────────────────────────────────────────────
  const result = computeKeyworkingIntelligence({ children, sessions });

  return NextResponse.json({ data: result });
}
