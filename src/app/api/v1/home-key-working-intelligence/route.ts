// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME KEY WORKING INTELLIGENCE API ROUTE
// GET /api/v1/home-key-working-intelligence
// Synthesises key working sessions across all children to produce an
// overall key working quality and coverage intelligence score.
// CHR 2015 Reg 14, 44. SCCIF: "Experiences and progress of children."
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeHomeKeyWorking,
  type KeyWorkingSessionInput,
} from "@/lib/engines/home-key-working-intelligence-engine";

export async function GET() {
  const store = getStore();
  const today = new Date().toISOString().slice(0, 10);

  // ── Children ──────────────────────────────────────────────────────────
  const youngPeople = (store.youngPeople ?? []) as any[];
  const totalChildren = youngPeople.length;
  const childIds = youngPeople.map((yp: any) => yp.id as string);

  // ── Key Working Sessions ──────────────────────────────────────────────
  const sessions: KeyWorkingSessionInput[] = ((store.keyWorkingSessions ?? []) as any[])
    .map((s: any) => ({
      id: s.id,
      child_id: s.child_id ?? "",
      staff_id: s.staff_id ?? "",
      date: (s.date ?? today).toString().slice(0, 10),
      type: s.type ?? "one_to_one",
      duration_minutes: typeof s.duration === "number" ? s.duration : (typeof s.duration_minutes === "number" ? s.duration_minutes : 0),
      has_child_voice: !!(s.child_voice),
      actions_agreed_count: Array.isArray(s.actions_agreed) ? s.actions_agreed.length : (typeof s.actions_agreed_count === "number" ? s.actions_agreed_count : 0),
      mood_before: typeof s.mood_before === "number" ? s.mood_before : null,
      mood_after: typeof s.mood_after === "number" ? s.mood_after : null,
      has_follow_up: !!(s.follow_up && s.follow_up.length > 0) || !!(s.follow_up_date && s.follow_up_date.length > 0),
      follow_up_completed: !!(s.follow_up_completed),
      linked_goals_count: Array.isArray(s.linked_goals) ? s.linked_goals.length : (typeof s.linked_goals_count === "number" ? s.linked_goals_count : 0),
    }));

  // ── Compute ───────────────────────────────────────────────────────────
  const result = computeHomeKeyWorking({
    today,
    total_children: totalChildren,
    child_ids: childIds,
    sessions,
  });

  return NextResponse.json({ data: result });
}
