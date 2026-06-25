// ══════════════════════════════════════════════════════════════════════════════
// CARA — CHILD EMOTIONAL WELLBEING INTELLIGENCE API ROUTE
// GET /api/v1/child-emotional-wellbeing-intelligence?childId=yp_alex
// Per-child engine synthesising mood, behaviour, keywork, therapy, and
// sanctions/rewards to assess emotional trajectory.
// CHR 2015 Reg 7, 10. SCCIF: "Experiences and progress."
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse, type NextRequest } from "next/server";
import { getRequestIdentity, assertChildHomeAccess } from "@/lib/auth-guard";
import { getStore } from "@/lib/db/store";
import {
  computeChildEmotionalWellbeing,
  type MoodEntryInput,
  type BehaviourEntryInput,
  type KeyworkSessionInput,
  type TherapySessionInput,
  type SanctionRewardInput,
} from "@/lib/engines/child-emotional-wellbeing-intelligence-engine";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const childId = searchParams.get("childId");

  const identity = await getRequestIdentity(request);
  if (identity instanceof NextResponse) return identity;
  const denied = assertChildHomeAccess(identity, childId);
  if (denied) return denied;
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
  const childName = (child.name ?? `${child.first_name ?? ""} ${child.last_name ?? ""}`.trim()) || childId;

  // ── Mood Entries (from daily log) ──────────────────────────────────────
  const mood_entries: MoodEntryInput[] = ((store.dailyLog ?? []) as any[])
    .filter((e: any) => e.child_id === childId)
    .map((e: any) => ({
      id: e.id,
      date: (e.date ?? today).toString().slice(0, 10),
      mood_score: typeof e.mood_score === "number" ? e.mood_score : null,
      time: e.time ?? "12:00",
    }));

  // ── Behaviour Entries ──────────────────────────────────────────────────
  const behaviour_entries: BehaviourEntryInput[] = ((store.behaviourLog ?? []) as any[])
    .filter((b: any) => b.child_id === childId)
    .map((b: any) => ({
      id: b.id,
      date: (b.date ?? today).toString().slice(0, 10),
      direction: b.direction ?? "concerning",
      intensity: b.intensity ?? "low",
      trigger: b.trigger ?? "",
      has_strategy_used: !!(b.strategy_used),
    }));

  // ── Keywork Sessions ───────────────────────────────────────────────────
  const keywork_sessions: KeyworkSessionInput[] = ((store.keyWorkingSessions ?? []) as any[])
    .filter((k: any) => k.child_id === childId)
    .map((k: any) => ({
      id: k.id,
      date: (k.date ?? today).toString().slice(0, 10),
      has_child_voice: !!(k.child_voice),
      mood_before: typeof k.mood_before === "number" ? k.mood_before : null,
      mood_after: typeof k.mood_after === "number" ? k.mood_after : null,
    }));

  // ── Therapy Sessions (from therapeuticInputRecords if available) ───────
  const therapy_sessions: TherapySessionInput[] = ((store.therapeuticInputRecords ?? []) as any[])
    .filter((t: any) => t.child_id === childId)
    .map((t: any) => ({
      id: t.id,
      date: (t.date ?? t.session_date ?? today).toString().slice(0, 10),
      attended: t.attended !== false,
      engagement_level: t.engagement_level ?? t.engagement ?? "good",
    }));

  // ── Sanctions/Rewards ──────────────────────────────────────────────────
  const sanction_rewards: SanctionRewardInput[] = ((store.sanctionRewards ?? []) as any[])
    .filter((sr: any) => sr.child_id === childId)
    .map((sr: any) => ({
      id: sr.id,
      date: (sr.date ?? today).toString().slice(0, 10),
      direction: sr.direction ?? "reward",
      child_response: sr.child_response ?? "",
    }));

  // ── Compute ────────────────────────────────────────────────────────────
  const result = computeChildEmotionalWellbeing({
    today,
    child_id: childId,
    child_name: childName,
    mood_entries,
    behaviour_entries,
    keywork_sessions,
    therapy_sessions,
    sanction_rewards,
  });

  return NextResponse.json({ data: result });
}
