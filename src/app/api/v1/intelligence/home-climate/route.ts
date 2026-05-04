import { NextRequest, NextResponse } from "next/server";
import { intelligenceDb } from "@/lib/intelligence/store";
import type { HomeClimateSnapshot } from "@/types/extended";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const homeId = searchParams.get("home_id") ?? "home_oak";

  const latest = intelligenceDb.homeClimate.findLatest(homeId);
  const history = intelligenceDb.homeClimate.findHistory(homeId, 8);

  return NextResponse.json({
    data: {
      latest,
      history,
    },
    meta: {
      weeks_of_history: history.length,
      trend: history.length >= 2
        ? (history[0].overall_climate_score > history[1].overall_climate_score ? "improving" : "declining")
        : "insufficient_data",
    },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json() as Partial<HomeClimateSnapshot>;

  const required = ["period_start", "period_end", "overall_climate_score", "narrative"] as const;
  for (const field of required) {
    if (body[field] === undefined || body[field] === null) {
      return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
    }
  }

  const snapshot = intelligenceDb.homeClimate.create({
    home_id: body.home_id ?? "home_oak",
    period_start: body.period_start!,
    period_end: body.period_end!,
    staffing_consistency_score: body.staffing_consistency_score ?? 75,
    incident_frequency_score: body.incident_frequency_score ?? 75,
    missing_episode_score: body.missing_episode_score ?? 75,
    complaints_score: body.complaints_score ?? 90,
    safeguarding_score: body.safeguarding_score ?? 80,
    peer_tension_score: body.peer_tension_score ?? 70,
    training_compliance_score: body.training_compliance_score ?? 82,
    maintenance_score: body.maintenance_score ?? 78,
    overall_climate_score: body.overall_climate_score!,
    climate_delta: body.climate_delta ?? null,
    narrative: body.narrative!,
    hotspot_times: body.hotspot_times ?? [],
    risk_flags: body.risk_flags ?? [],
    computed_by: body.computed_by ?? "aria",
  });

  return NextResponse.json({ data: snapshot }, { status: 201 });
}
