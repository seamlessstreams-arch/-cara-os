// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME MISSING EPISODES INTELLIGENCE API ROUTE
// GET /api/v1/home-missing-episodes-intelligence
// Synthesises missing from care episodes across all children to produce an
// overall missing episodes and safeguarding response intelligence score.
// CHR 2015 Reg 12, 34. SCCIF: "Safe."
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeHomeMissingEpisodes,
  type MissingEpisodeInput,
} from "@/lib/engines/home-missing-episodes-intelligence-engine";

export async function GET() {
  const store = getStore();
  const today = new Date().toISOString().slice(0, 10);

  // ── Children ──────────────────────────────────────────────────────────
  const youngPeople = (store.youngPeople ?? []) as any[];
  const totalChildren = youngPeople.length;
  const childIds = youngPeople.map((yp: any) => yp.id as string);

  // ── Missing Episodes ──────────────────────────────────────────────────
  const missing_episodes: MissingEpisodeInput[] = ((store.missingEpisodes ?? []) as any[])
    .map((e: any) => ({
      id: e.id,
      child_id: e.child_id ?? "",
      date_missing: (e.date_missing ?? today).toString().slice(0, 10),
      duration_hours: typeof e.duration_hours === "number" ? e.duration_hours : 0,
      risk_level: e.risk_level ?? "low",
      reported_to_police: !!e.reported_to_police,
      reported_to_la: !!e.reported_to_la,
      return_interview_completed: !!e.return_interview_completed,
      contextual_safeguarding_risk: !!e.contextual_safeguarding_risk,
      status: e.status ?? "open",
    }));

  // ── Compute ───────────────────────────────────────────────────────────
  const result = computeHomeMissingEpisodes({
    today,
    total_children: totalChildren,
    child_ids: childIds,
    missing_episodes,
  });

  return NextResponse.json({ data: result });
}
