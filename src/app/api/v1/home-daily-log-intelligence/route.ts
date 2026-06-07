// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME DAILY LOG INTELLIGENCE API ROUTE
// GET /api/v1/home-daily-log-intelligence
// Recording patterns, mood tracking, entry types, staff participation.
// CHR 2015 Reg 36: "Records — maintain comprehensive records."
// SCCIF: "Records are clear, up to date, and stored safely."
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeHomeDailyLog,
  type DailyLogEntryInput,
} from "@/lib/engines/home-daily-log-intelligence-engine";

export async function GET() {
  const store = getStore();
  const today = new Date().toISOString().slice(0, 10);

  // ── Daily logs ───────────────────────────────────────────────────────
  const dailyLogs: DailyLogEntryInput[] = (
    (store.dailyLog ?? []) as any[]
  ).map((l: any) => ({
    id: (l.id ?? "").toString(),
    child_id: (l.child_id ?? "").toString(),
    date: (l.date ?? "").toString().slice(0, 10),
    time: (l.time ?? "").toString(),
    entry_type: (l.entry_type ?? "general").toString(),
    content: (l.content ?? "").toString(),
    mood_score: typeof l.mood_score === "number" ? l.mood_score : null,
    staff_id: (l.staff_id ?? "").toString(),
    linked_incident_id: l.linked_incident_id ? (l.linked_incident_id).toString() : null,
    is_significant: !!(l.is_significant),
  }));

  // ── Totals ───────────────────────────────────────────────────────────
  const totalChildren = (store.youngPeople ?? []).filter(
    (yp: any) => yp.status === "current",
  ).length;

  const totalStaff = (store.staff ?? []).filter(
    (s: any) => s.is_active,
  ).length;

  const result = computeHomeDailyLog({
    today,
    daily_logs: dailyLogs,
    total_children: totalChildren,
    total_staff: totalStaff,
  });

  return NextResponse.json({ data: result });
}
