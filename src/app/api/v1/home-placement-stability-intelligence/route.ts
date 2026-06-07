// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME PLACEMENT STABILITY INTELLIGENCE API ROUTE
// GET /api/v1/home-placement-stability-intelligence
// Synthesises placement tenure, incident patterns, missing episode trends,
// return interview compliance, and overall stability across all children.
// CHR 2015 Reg 36 (Record Keeping), Reg 44. SCCIF: "Impact on children's
// lives" / "How well children are helped and protected."
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeHomePlacementStability,
  type PlacementChildInput,
  type PlacementIncidentInput,
  type PlacementMissingInput,
} from "@/lib/engines/home-placement-stability-intelligence-engine";

export async function GET() {
  const store = getStore();
  const today = new Date().toISOString().slice(0, 10);

  // ── Children (current placements only) ──────────────────────────
  const children: PlacementChildInput[] = ((store.youngPeople ?? []) as any[])
    .filter((yp: any) => yp.status === "current")
    .map((yp: any) => ({
      child_id: yp.id ?? "",
      placement_start: (yp.placement_start ?? "").toString().slice(0, 10),
      risk_flag_count: Array.isArray(yp.risk_flags) ? yp.risk_flags.length : 0,
    }));

  // Only count events for the CURRENT cohort. Incidents/missing episodes from
  // discharged children remain in the store; counting them against children.length
  // (which is current-only) inflated incident_rate / episodes_per_child and fired
  // false instability concerns against settled children.
  const currentIds = new Set(children.map((c) => c.child_id));

  // ── Incidents ───────────────────────────────────────────────────
  const incidents: PlacementIncidentInput[] = ((store.incidents ?? []) as any[])
    .filter((inc: any) => currentIds.has(inc.child_id))
    .map((inc: any) => ({
      child_id: inc.child_id ?? "",
      date: (inc.date ?? "").toString().slice(0, 10),
      severity: (inc.severity ?? "low").toString(),
    }));

  // ── Missing Episodes ────────────────────────────────────────────
  const missing_episodes: PlacementMissingInput[] = ((store.missingEpisodes ?? []) as any[])
    .filter((ep: any) => currentIds.has(ep.child_id))
    .map((ep: any) => ({
      child_id: ep.child_id ?? "",
      date: (ep.date_missing ?? "").toString().slice(0, 10),
      risk_level: (ep.risk_level ?? "low").toString(),
      duration_hours: typeof ep.duration_hours === "number" ? ep.duration_hours : 0,
      return_interview_completed: !!(ep.return_interview_completed),
      contextual_safeguarding_risk: !!(ep.contextual_safeguarding_risk),
    }));

  const result = computeHomePlacementStability({
    today,
    children,
    incidents,
    missing_episodes,
  });

  return NextResponse.json({ data: result });
}
