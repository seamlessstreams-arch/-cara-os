// ══════════════════════════════════════════════════════════════════════════════
// CARA — CHILD PLACEMENT QUALITY INTELLIGENCE API ROUTE
// GET /api/v1/child-placement-quality?childId=yp_alex
// Per-child engine measuring placement experience quality: mood trajectory,
// daily log engagement, key work, welfare checks, activities, stability.
// CHR 2015 Reg 5, 6, 7, 9. SCCIF: "Experiences and progress of children."
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse, type NextRequest } from "next/server";
import { getRequestIdentity, assertChildHomeAccess } from "@/lib/auth-guard";
import { dal } from "@/lib/db";
import { getStaffName } from "@/lib/seed-data";
import { todayStr } from "@/lib/utils";
import { ageFromDob } from "@/lib/cara-studio/cara-context-builder";
import {
  computeChildPlacementQuality,
  type DailyLogInput,
  type KeyWorkInput,
  type WelfareCheckInput,
  type ActivityInput,
  type PlacementMoveInput,
} from "@/lib/engines/child-placement-quality-engine";

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

  const [youngPeopleList, dailyLogList, keyWorkingSessionsList, welfareChecksList, welfareCheckRoundsList, activitiesList] = await Promise.all([
    dal.youngPeople.findAll(),
    dal.dailyLog.findAll(),
    dal.keyWorkingSessions.findAll(),
    dal.welfareChecks.findAll(),
    dal.welfareCheckRounds.findAll(),
    dal.activities.findAll(),
  ]);
  const today = todayStr();

  // ── Child info ─────────────────────────────────────────────────────────
  const child = (youngPeopleList ?? []).find((yp) => yp.id === childId);
  if (!child) {
    return NextResponse.json({ error: "Child not found" }, { status: 404 });
  }
  const childName = `${child.first_name ?? ""} ${child.last_name ?? ""}`.trim() || childId;
  // YoungPerson has no age field — derive from date_of_birth (the old phantom
  // `.age` read meant every child was assessed as 15); 15 only if DOB unparseable
  const childAge = ageFromDob(child.date_of_birth, today) ?? 15;
  const placementStart = typeof child.placement_start === "string" ? child.placement_start.slice(0, 10) : today;
  const keyWorkerId = child.key_worker_id ?? "";
  const keyWorkerName = keyWorkerId ? getStaffName(keyWorkerId) : "Key Worker";

  // ── Daily Logs ─────────────────────────────────────────────────────────
  const daily_logs: DailyLogInput[] = (dailyLogList ?? [])
    .filter((l) => l.child_id === childId)
    .map((l) => ({
      id: l.id,
      date: typeof l.date === "string" ? l.date.slice(0, 10) : l.date,
      entry_type: l.entry_type ?? "general",
      mood_score: typeof l.mood_score === "number" ? l.mood_score : null,
      is_significant: !!l.is_significant,
      staff_id: l.staff_id ?? "",
    }));

  // ── Key Work Sessions ──────────────────────────────────────────────────
  const key_work_sessions: KeyWorkInput[] = (keyWorkingSessionsList ?? [])
    .filter((k) => k.child_id === childId)
    .map((k) => ({
      id: k.id,
      date: typeof k.date === "string" ? k.date.slice(0, 10) : k.date,
      child_engaged: k.mood_after != null && k.mood_before != null ? k.mood_after >= k.mood_before : true,
      mood_before: k.mood_before ?? 3,
      mood_after: k.mood_after ?? 3,
      themes: Array.isArray(k.topics) ? k.topics : [],
    }));

  // ── Welfare Checks ─────────────────────────────────────────────────────
  // WelfareCheck records a status, not an outcome; the engine's vocabulary is
  // ok / concern / not_checked. Asleep and awake are completed checks with
  // nothing raised; refused and not_in_room mean the child was not seen — an
  // unknown status makes no claim either way.
  const WELFARE_STATUS_TO_OUTCOME: Record<string, string> = {
    ok: "ok",
    asleep: "ok",
    awake: "ok",
    concern: "concern",
    refused: "not_checked",
    not_in_room: "not_checked",
  };
  const welfare_checks: WelfareCheckInput[] = [];
  if (Array.isArray(welfareChecksList)) {
    welfareChecksList
      .filter((w) => w.child_id === childId)
      .forEach((w) => {
        welfare_checks.push({
          id: w.id,
          date: (w.check_date ?? "").slice(0, 10),
          outcome: WELFARE_STATUS_TO_OUTCOME[w.status] ?? "not_checked",
        });
      });
  }
  // Also check welfare check rounds
  if (Array.isArray(welfareCheckRoundsList)) {
    welfareCheckRoundsList.forEach((round) => {
      if (Array.isArray(round.checks)) {
        round.checks
          .filter((c) => c.child_id === childId)
          .forEach((c) => {
            welfare_checks.push({
              id: c.id ?? `${round.id}_${c.child_id}`,
              date: (round.round_date ?? "").slice(0, 10),
              outcome: WELFARE_STATUS_TO_OUTCOME[c.status] ?? "not_checked",
            });
          });
      }
    });
  }

  // ── Activities ─────────────────────────────────────────────────────────
  const activities: ActivityInput[] = [];
  if (Array.isArray(activitiesList)) {
    activitiesList
      .filter((a) => a.child_id === childId)
      .forEach((a) => {
        activities.push({
          id: a.id,
          date: (a.date ?? "").slice(0, 10),
          type: a.category ?? "general",
          child_participated: true, // an Activity record is per-child by shape
        });
      });
  }

  // ── Placement Moves ────────────────────────────────────────────────────
  // YoungPerson records no placement history, so prior moves are unmeasured —
  // the input stays empty rather than being invented from text matching.
  const placement_moves: PlacementMoveInput[] = [];

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
