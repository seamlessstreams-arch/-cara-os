// ══════════════════════════════════════════════════════════════════════════════
// CARA — PLACEMENT STABILITY INTELLIGENCE API ROUTE
// GET /api/v1/placement-stability
// Returns aggregated placement stability intelligence from the engine.
// Reg 5/12/14 — placement stability, protection, assessment.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { dal } from "@/lib/db";
import {
  computePlacementStability,
  type ChildInput,
  type DailyLogInput,
  type IncidentInput,
  type MissingEpisodeInput,
  type KeyworkSessionInput,
  type OutcomeTargetInput,
} from "@/lib/engines/placement-stability-engine";

export async function GET() {
  const [dailyLogList, incidentsList, keyWorkingSessionsList, missingEpisodesList, outcomeTargetsList, youngPeopleList] = await Promise.all([
      dal.dailyLog.findAll(),
      dal.incidents.findAll(),
      dal.keyWorkingSessions.findAll(),
      dal.missingEpisodes.findAll(),
      dal.outcomeTargets.findAll(),
      dal.youngPeople.findAll(),
    ]);

  // ── Map children ──────────────────────────────────────────────────────
  const children: ChildInput[] = youngPeopleList.map((yp) => ({
    id: yp.id,
    first_name: yp.first_name,
    preferred_name: yp.preferred_name ?? null,
    date_of_birth: yp.date_of_birth,
    placement_start: yp.placement_start,
    placement_end: yp.placement_end ?? null,
    key_worker_id: yp.key_worker_id ?? null,
    risk_flags: yp.risk_flags ?? [],
    status: yp.status,
  }));

  // ── Map daily logs ────────────────────────────────────────────────────
  const dailyLogs: DailyLogInput[] = dailyLogList.map((dl) => ({
    id: dl.id,
    child_id: dl.child_id,
    date: typeof dl.date === "string" ? dl.date : dl.date,
    mood_score: dl.mood_score ?? null,
    entry_type: dl.entry_type ?? "general",
    is_significant: dl.is_significant ?? false,
  }));

  // ── Map incidents ─────────────────────────────────────────────────────
  const incidents: IncidentInput[] = incidentsList.map((inc) => ({
    id: inc.id,
    child_id: inc.child_id,
    date: inc.date,
    type: inc.type ?? "general",
    severity: inc.severity ?? "medium",
  }));

  // ── Map missing episodes ──────────────────────────────────────────────
  const missingEpisodes: MissingEpisodeInput[] = missingEpisodesList.map((me) => ({
    id: me.id,
    child_id: me.child_id,
    date_missing: me.date_missing,
    status: me.status,
    risk_level: me.risk_level,
  }));

  // ── Map keywork sessions ──────────────────────────────────────────────
  const keyworkSessions: KeyworkSessionInput[] = keyWorkingSessionsList.map((kw) => ({
    id: kw.id,
    child_id: kw.child_id,
    date: kw.date,
    mood_before: kw.mood_before ?? 3,
    mood_after: kw.mood_after ?? 3,
    type: kw.type ?? "one_to_one",
  }));

  // ── Map outcome targets ───────────────────────────────────────────────
  const outcomeTargets: OutcomeTargetInput[] = outcomeTargetsList.map((ot) => ({
    id: ot.id,
    child_id: ot.child_id,
    domain: ot.domain,
    direction: ot.direction,
    current_rating: ot.current_rating,
    target_rating: ot.target_rating,
    baseline_rating: ot.baseline_rating,
    status: ot.status,
  }));

  // ── Run engine ────────────────────────────────────────────────────────
  const result = computePlacementStability({
    children,
    dailyLogs,
    incidents,
    missingEpisodes,
    keyworkSessions,
    outcomeTargets,
  });

  return NextResponse.json({ data: result });
}
