// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME SLEEP QUALITY INTELLIGENCE API ROUTE
// GET /api/v1/home-sleep-quality-intelligence
// Sleep disturbances, check compliance, pattern analysis, handover quality.
// CHR 2015 Reg 7/10: "Quality of care, positive relationships."
// SCCIF: "Children get a good night's sleep and feel rested."
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeHomeSleepQuality,
  type SleepLogInput,
  type SleepDisturbanceInput,
} from "@/lib/engines/home-sleep-quality-intelligence-engine";

export async function GET() {
  const store = getStore();
  const today = new Date().toISOString().slice(0, 10);

  // ── Sleep Logs ────────────────────────────────────────────────────────
  const sleepLogs: SleepLogInput[] = (
    (store.sleepLog ?? []) as any[]
  ).map((l: any) => ({
    id: l.id ?? "",
    date: (l.date ?? "").toString().slice(0, 10),
    shift_type: (l.shift_type ?? "waking_night").toString(),
    staff_id: (l.staff_id ?? "").toString(),
    start_time: (l.start_time ?? "22:00").toString(),
    end_time: (l.end_time ?? "07:00").toString(),
    disturbance_level: (l.disturbance_level ?? "none").toString(),
    disturbances: (Array.isArray(l.disturbances) ? l.disturbances : []).map(
      (d: any): SleepDisturbanceInput => ({
        time: (d.time ?? "").toString(),
        young_person: (d.young_person ?? "").toString(),
        description: (d.description ?? "").toString(),
        action_taken: (d.action_taken ?? "").toString(),
        duration: typeof d.duration === "number" ? d.duration : 0,
      }),
    ),
    checks_completed: Array.isArray(l.checks_completed) ? l.checks_completed : [],
    building_secure: !!(l.building_secure),
    alarms_set: !!(l.alarms_set),
    handover_notes: (l.handover_notes ?? "").toString(),
    morning_handover: (l.morning_handover ?? "").toString(),
  }));

  // ── Total children ────────────────────────────────────────────────────
  const totalChildren = (store.youngPeople ?? []).filter(
    (yp: any) => yp.status === "current",
  ).length;

  const result = computeHomeSleepQuality({
    today,
    sleep_logs: sleepLogs,
    total_children: totalChildren,
  });

  return NextResponse.json({ data: result });
}
