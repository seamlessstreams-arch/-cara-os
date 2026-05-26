// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME ACTIVITY & ENRICHMENT INTELLIGENCE API ROUTE
// GET /api/v1/home-activity-enrichment-intelligence
// Home-level engine: aggregates activity provision, participation rates,
// variety, new experiences, and enrichment quality across all children.
// CHR 2015 Reg 9 (enjoyment & achievement), Reg 6 (quality of care).
// SCCIF: "Children enjoy a range of activities and experiences."
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeHomeActivityEnrichment,
  type ChildRef,
  type ActivityEntryInput,
} from "@/lib/engines/home-activity-enrichment-intelligence-engine";

export async function GET() {
  const store = getStore();
  const today = new Date().toISOString().slice(0, 10);

  // ── Children ────────────────────────────────────────────────────────────
  const children: ChildRef[] = (store.youngPeople ?? []).map((yp: any) => ({
    id: yp.id,
    name: yp.name ?? `${yp.first_name ?? ""} ${yp.last_name ?? ""}`.trim() || yp.id,
  }));

  const childIds = new Set(children.map((c) => c.id));

  // ── Activities ─────────────────────────────────────────────────────────
  // Each Activity record in the store has a single child_id or a participants array.
  // We expand participants into per-child entries.
  const activities: ActivityEntryInput[] = [];

  for (const act of (store.activities ?? []) as any[]) {
    const date = typeof act.date === "string"
      ? act.date.slice(0, 10)
      : (act.start_date ?? act.created_at ?? today).toString().slice(0, 10);

    const base = {
      id: act.id,
      date,
      category: act.category ?? "social",
      title: act.title ?? "",
      duration_minutes: typeof act.duration_minutes === "number" ? act.duration_minutes : 60,
      engagement: act.engagement ?? "willing",
      is_new_experience: !!act.is_new_experience,
      yp_feedback: act.yp_feedback ?? null,
      staff_id: act.staff_id ?? "",
    };

    // Direct child_id
    if (act.child_id && childIds.has(act.child_id)) {
      activities.push({ ...base, child_id: act.child_id });
      continue;
    }

    // Participants array
    if (Array.isArray(act.participants)) {
      for (const pid of act.participants) {
        if (!childIds.has(pid)) continue;
        activities.push({
          ...base,
          id: `${act.id}_${pid}`,
          child_id: pid,
        });
      }
    }
  }

  // ── Compute ────────────────────────────────────────────────────────────
  const result = computeHomeActivityEnrichment({
    today,
    children,
    activities,
  });

  return NextResponse.json({ data: result });
}
