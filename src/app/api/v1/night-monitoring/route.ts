// ══════════════════════════════════════════════════════════════════════════════
// CARA — NIGHT MONITORING INTELLIGENCE API ROUTE
// GET /api/v1/night-monitoring
// Returns welfare check compliance, sleep patterns, security analysis,
// night staffing, and Cara night care intelligence.
// Reg 12/25/34 — health & safety, night staffing, welfare of children.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { dal } from "@/lib/db";
import {
  computeNightMonitoring,
  type ChildInput,
  type WelfareCheckInput,
  type WelfareRoundInput,
} from "@/lib/engines/night-monitoring-engine";

export async function GET() {
  const [welfareCheckRoundsList, welfareChecksList, youngPeopleList] = await Promise.all([
      dal.welfareCheckRounds.findAll(),
      dal.welfareChecks.findAll(),
      dal.youngPeople.findAll(),
    ]);

  // ── Map children ─────────────────────────────────────────────────────────
  const children: ChildInput[] = youngPeopleList.map((yp) => ({
    id: yp.id,
    name: yp.preferred_name ?? yp.first_name,
  }));

  // ── Map welfare checks ───────────────────────────────────────────────────
  const welfareChecks: WelfareCheckInput[] = welfareChecksList.map((c) => ({
    id: c.id,
    child_id: c.child_id,
    staff_id: c.staff_id,
    check_date: c.check_date,
    check_time: c.check_time,
    status: c.status,
    mood: c.mood ?? null,
    has_concern: c.status === "concern" || Boolean(c.concern_details),
    physical_marks_noted: c.physical_marks_noted ?? false,
  }));

  // ── Map welfare rounds ───────────────────────────────────────────────────
  const welfareRounds: WelfareRoundInput[] = welfareCheckRoundsList.map((r) => ({
    id: r.id,
    round_date: r.round_date,
    round_time: r.round_time,
    staff_id: r.staff_id,
    shift_type: r.shift_type,
    all_children_checked: r.all_children_checked,
    building_secure: r.building_secure,
    fire_exits_clear: r.fire_exits_clear,
    external_doors_locked: r.external_doors_locked,
    checks_count: r.checks.length,
    children_count: children.length,
  }));

  // ── Run engine ───────────────────────────────────────────────────────────
  const result = computeNightMonitoring({ children, welfareChecks, welfareRounds });

  return NextResponse.json({ data: result });
}
