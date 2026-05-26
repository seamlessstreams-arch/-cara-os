// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CHILD PLACEMENT QUALITY INTELLIGENCE API ROUTE
// GET /api/v1/child-placement-quality?childId=yp_alex
// Per-child engine measuring placement experience quality: mood trajectory,
// daily log engagement, key work, welfare checks, activities, stability.
// CHR 2015 Reg 5, 6, 7, 9. SCCIF: "Experiences and progress of children."
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import { getStaffName } from "@/lib/seed-data";
import {
  computeChildPlacementQuality,
  type DailyLogInput,
  type KeyWorkInput,
  type WelfareCheckInput,
  type ActivityInput,
  type PlacementMoveInput,
} from "@/lib/engines/child-placement-quality-engine";

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
  const childAge = child.age ?? 15;
  const placementStart = typeof child.placement_start === "string" ? child.placement_start.slice(0, 10) : today;
  const keyWorkerId = child.key_worker_id ?? "";
  const keyWorkerName = keyWorkerId ? getStaffName(keyWorkerId) : "Key Worker";

  // ── Daily Logs ─────────────────────────────────────────────────────────
  const daily_logs: DailyLogInput[] = (store.dailyLog ?? [])
    .filter((l: any) => l.child_id === childId)
    .map((l: any) => ({
      id: l.id,
      date: typeof l.date === "string" ? l.date.slice(0, 10) : l.date,
      entry_type: l.entry_type ?? "general",
      mood_score: typeof l.mood_score === "number" ? l.mood_score : null,
      is_significant: !!l.is_significant,
      staff_id: l.staff_id ?? "",
    }));

  // ── Key Work Sessions ──────────────────────────────────────────────────
  const key_work_sessions: KeyWorkInput[] = (store.keyWorkingSessions ?? [])
    .filter((k: any) => k.child_id === childId)
    .map((k: any) => ({
      id: k.id,
      date: typeof k.date === "string" ? k.date.slice(0, 10) : k.date,
      child_engaged: k.child_engaged ?? (k.mood_after != null && k.mood_before != null ? k.mood_after >= k.mood_before : true),
      mood_before: k.mood_before ?? 3,
      mood_after: k.mood_after ?? 3,
      themes: Array.isArray(k.topics) ? k.topics : Array.isArray(k.themes) ? k.themes : [],
    }));

  // ── Welfare Checks ─────────────────────────────────────────────────────
  const welfare_checks: WelfareCheckInput[] = [];
  if (Array.isArray((store as any).welfareChecks)) {
    (store as any).welfareChecks
      .filter((w: any) => w.child_id === childId)
      .forEach((w: any) => {
        welfare_checks.push({
          id: w.id,
          date: typeof w.date === "string" ? w.date.slice(0, 10) : (w.created_at ?? today).toString().slice(0, 10),
          outcome: w.outcome ?? w.status ?? "ok",
        });
      });
  }
  // Also check welfare check rounds
  if (Array.isArray((store as any).welfareCheckRounds)) {
    (store as any).welfareCheckRounds.forEach((round: any) => {
      if (Array.isArray(round.checks)) {
        round.checks
          .filter((c: any) => c.child_id === childId)
          .forEach((c: any) => {
            welfare_checks.push({
              id: c.id ?? `${round.id}_${c.child_id}`,
              date: typeof round.date === "string" ? round.date.slice(0, 10) : (round.created_at ?? today).toString().slice(0, 10),
              outcome: c.outcome ?? c.status ?? "ok",
            });
          });
      }
    });
  }

  // ── Activities ─────────────────────────────────────────────────────────
  const activities: ActivityInput[] = [];
  if (Array.isArray(store.activities)) {
    store.activities
      .filter((a: any) => {
        // Check if child participated
        if (Array.isArray(a.participants)) return a.participants.includes(childId);
        if (a.child_id === childId) return true;
        return false;
      })
      .forEach((a: any) => {
        activities.push({
          id: a.id,
          date: typeof a.date === "string" ? a.date.slice(0, 10) : (a.start_date ?? a.created_at ?? today).toString().slice(0, 10),
          type: a.type ?? a.category ?? "general",
          child_participated: true, // If they're in participants, they participated
        });
      });
  }

  // ── Placement Moves ────────────────────────────────────────────────────
  const placement_moves: PlacementMoveInput[] = [];
  // Derive from placement history if available
  if (child.placement_history && typeof child.placement_history === "string" && child.placement_history.length > 0) {
    // Count mentions of "broke down" or "ended" as unplanned
    const breakdowns = (child.placement_history.match(/broke down|breakdown|disruption/gi) ?? []).length;
    for (let i = 0; i < breakdowns; i++) {
      placement_moves.push({
        id: `pm_${childId}_${i}`,
        date: placementStart,
        reason: "Previous placement breakdown",
        planned: false,
      });
    }
  }

  // ── Compute ────────────────────────────────────────────────────────────
  const result = computeChildPlacementQuality({
    today,
    child_id: childId,
    child_name: childName,
    child_age: childAge,
    placement_start: placementStart,
    key_worker_name: keyWorkerName,
    daily_logs,
    key_work_sessions,
    welfare_checks,
    activities,
    placement_moves,
  });

  return NextResponse.json({ data: result });
}
