// ══════════════════════════════════════════════════════════════════════════════
// API: /api/cara/placement-stability — Placement Stability Intelligence
//
// Analyses placement stability, disruption risk, belonging, and planning.
// Pure deterministic — no AI. Returns structured assessment.
// CHR 2015 Reg 11 alignment (Care Planning / Avoiding Disruption).
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { analysePlacementStability } from "@/lib/cara/placement-stability-intelligence";
import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { PlacementStabilityInput, PlacementHistory, DisruptionIndicator } from "@/lib/cara/placement-stability-intelligence";

type SB = any;

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const childId = url.searchParams.get("childId");

    if (!childId) {
      return NextResponse.json(
        { error: "childId query parameter is required" },
        { status: 400 },
      );
    }

    const sb = createServerClient();
    let input: PlacementStabilityInput;

    if (sb && isSupabaseEnabled()) {
      input = await fetchData(sb, childId);
    } else {
      input = buildDemoData(childId);
    }

    const assessment = analysePlacementStability(input);

    return NextResponse.json({ success: true, data: assessment });
  } catch (err) {
    console.error("[cara/placement-stability] Error:", err);
    return NextResponse.json(
      { error: "Placement stability intelligence failed", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}

// ── Supabase Fetch ──────────────────────────────────────────────────────────

async function fetchData(sb: any, childId: string): Promise<PlacementStabilityInput> {
  const { data: child } = await (sb.from("children") as SB)
    .select("id, first_name, last_name, date_of_birth")
    .eq("id", childId)
    .single();

  const childName = child ? `${child.first_name} ${child.last_name}` : "Unknown";
  const age = child?.date_of_birth
    ? Math.floor((Date.now() - new Date(child.date_of_birth).getTime()) / 31557600000)
    : 15;

  // Placement history
  const { data: rawPlacements } = await (sb.from("placements") as SB)
    .select("*")
    .eq("child_id", childId)
    .order("start_date", { ascending: true });

  const placementHistory: PlacementHistory[] = (rawPlacements ?? [])
    .filter((p: any) => p.end_date)
    .map((p: any) => ({
      id: p.id,
      startDate: p.start_date,
      endDate: p.end_date,
      type: p.type ?? "residential",
      durationDays: p.duration_days ?? 0,
      endReason: p.end_reason ?? undefined,
      planned: p.planned ?? true,
      matchingScore: p.matching_score ?? undefined,
    }));

  const currentPlacement = (rawPlacements ?? []).find((p: any) => !p.end_date);
  const currentStartDate = currentPlacement?.start_date ?? "2025-01-01";
  const currentDays = Math.floor((Date.now() - new Date(currentStartDate).getTime()) / 86400000);

  const { data: config } = await (sb.from("placement_stability_config") as SB)
    .select("*")
    .eq("child_id", childId)
    .single();

  const cutoff30 = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const { count: incidentCount } = await (sb.from("incidents") as SB)
    .select("id", { count: "exact" })
    .eq("child_id", childId)
    .gte("date", cutoff30);

  const { count: missingCount } = await (sb.from("missing_episodes") as SB)
    .select("id", { count: "exact" })
    .eq("child_id", childId)
    .gte("date", cutoff30);

  return {
    childId,
    childName,
    age,
    currentPlacementStartDate: currentStartDate,
    currentPlacementDays: currentDays,
    placementHistory,
    totalPlacementsEver: (rawPlacements ?? []).length,
    disruptionIndicators: (config?.disruption_indicators ?? []) as DisruptionIndicator[],
    indicatorTrend: config?.indicator_trend ?? "stable",
    incidentsLast30Days: incidentCount ?? 0,
    incidentsTrend: config?.incident_trend ?? "stable",
    missingEpisodesLast30Days: missingCount ?? 0,
    childFeelsSettled: config?.child_settled ?? true,
    childWantsToStay: config?.child_wants_stay ?? true,
    childHasRoomPersonalised: config?.room_personalised ?? true,
    regularRoutineEstablished: config?.routine_established ?? true,
    positiveStaffRelationships: config?.staff_relationships ?? true,
    peerRelationshipsGood: config?.peer_relationships ?? true,
    placementReviewCurrent: config?.review_current ?? true,
    placementReviewLastDate: config?.review_last_date ?? undefined,
    matchingAssessmentDone: config?.matching_done ?? true,
    impactRiskAssessmentDone: config?.impact_ra_done ?? true,
    contingencyPlanInPlace: config?.contingency_plan ?? true,
    stayingPutOptionExplored: config?.staying_put_explored ?? false,
  };
}

// ── Demo Data ───────────────────────────────────────────────────────────────

function buildDemoData(childId: string): PlacementStabilityInput {
  const isJordan = childId.includes("jordan") || childId === "child_1";

  if (!isJordan) {
    return {
      childId,
      childName: "Sam",
      age: 14,
      currentPlacementStartDate: "2025-02-01",
      currentPlacementDays: 470,
      placementHistory: [
        {
          id: "pl_1", startDate: "2024-06-01", endDate: "2025-01-31",
          type: "foster", durationDays: 245, endReason: "step_up",
          planned: true, matchingScore: 70,
        },
      ],
      totalPlacementsEver: 2,
      disruptionIndicators: [],
      indicatorTrend: "stable",
      incidentsLast30Days: 0,
      incidentsTrend: "stable",
      missingEpisodesLast30Days: 0,
      childFeelsSettled: true,
      childWantsToStay: true,
      childHasRoomPersonalised: true,
      regularRoutineEstablished: true,
      positiveStaffRelationships: true,
      peerRelationshipsGood: true,
      placementReviewCurrent: true,
      placementReviewLastDate: "2026-04-15",
      matchingAssessmentDone: true,
      impactRiskAssessmentDone: true,
      contingencyPlanInPlace: true,
      stayingPutOptionExplored: false,
    };
  }

  return {
    childId,
    childName: "Jordan",
    age: 15,
    currentPlacementStartDate: "2025-08-01",
    currentPlacementDays: 289,
    placementHistory: [
      {
        id: "pl_1", startDate: "2024-03-01", endDate: "2024-09-30",
        type: "foster", durationDays: 214, endReason: "carer_request",
        planned: false, matchingScore: 55,
      },
      {
        id: "pl_2", startDate: "2024-10-01", endDate: "2025-07-31",
        type: "residential", durationDays: 304, endReason: "planned_move",
        planned: true, matchingScore: 75,
      },
    ],
    totalPlacementsEver: 3,
    disruptionIndicators: [],
    indicatorTrend: "improving",
    incidentsLast30Days: 2,
    incidentsTrend: "decreasing",
    missingEpisodesLast30Days: 0,
    childFeelsSettled: true,
    childWantsToStay: true,
    childHasRoomPersonalised: true,
    regularRoutineEstablished: true,
    positiveStaffRelationships: true,
    peerRelationshipsGood: true,
    placementReviewCurrent: true,
    placementReviewLastDate: "2026-05-01",
    matchingAssessmentDone: true,
    impactRiskAssessmentDone: true,
    contingencyPlanInPlace: true,
    stayingPutOptionExplored: false,
  };
}
