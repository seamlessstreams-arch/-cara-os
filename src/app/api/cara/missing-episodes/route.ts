// ══════════════════════════════════════════════════════════════════════════════
// API: /api/cara/missing-episodes — Missing Episodes Intelligence
//
// Analyses missing/absent episodes, RHI compliance, patterns, and risk.
// Pure deterministic — no AI. Returns structured assessment.
// CHR 2015 Reg 34 alignment (Missing Children).
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { analyseMissingEpisodes } from "@/lib/cara/missing-episodes-intelligence";
import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { MissingInput, MissingEpisode } from "@/lib/cara/missing-episodes-intelligence";

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

    // ── Fetch or demo ───────────────────────────────────────────────────────
    const sb = createServerClient();
    let input: MissingInput;

    if (sb && isSupabaseEnabled()) {
      input = await fetchMissingData(sb, childId);
    } else {
      input = buildDemoData(childId);
    }

    // ── Run intelligence engine ─────────────────────────────────────────────
    const assessment = analyseMissingEpisodes(input);

    return NextResponse.json({
      success: true,
      data: assessment,
    });
  } catch (err) {
    console.error("[cara/missing-episodes] Error:", err);
    return NextResponse.json(
      { error: "Missing episodes intelligence failed", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}

// ── Supabase Fetch ──────────────────────────────────────────────────────────

async function fetchMissingData(sb: any, childId: string): Promise<MissingInput> {
  const { data: child } = await (sb.from("children") as SB)
    .select("id, first_name, last_name, date_of_birth, placement_type")
    .eq("id", childId)
    .single();

  const childName = child ? `${child.first_name} ${child.last_name}` : "Unknown";
  const age = child?.date_of_birth
    ? Math.floor((Date.now() - new Date(child.date_of_birth).getTime()) / 31557600000)
    : 15;

  // Fetch risk profile
  const { data: riskProfile } = await (sb.from("risk_profiles") as SB)
    .select("*")
    .eq("child_id", childId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();

  // Fetch episodes (last 6 months)
  const cutoff = new Date(Date.now() - 180 * 86400000).toISOString().slice(0, 10);
  const { data: rawEpisodes } = await (sb.from("missing_episodes") as SB)
    .select("*")
    .eq("child_id", childId)
    .gte("date", cutoff)
    .order("date", { ascending: true });

  const episodes: MissingEpisode[] = (rawEpisodes ?? []).map((e: any) => ({
    id: e.id,
    date: e.date,
    startTime: e.start_time ?? "18:00",
    endDate: e.end_date ?? undefined,
    endTime: e.end_time ?? undefined,
    category: e.category ?? "absent",
    durationMinutes: e.duration_minutes ?? undefined,
    outcome: e.outcome ?? "returned_self",
    policeNotified: e.police_notified ?? false,
    policeRefNumber: e.police_ref ?? undefined,
    socialWorkerNotified: e.sw_notified ?? true,
    ofstedNotified: e.ofsted_notified ?? undefined,
    returnHomeInterview: {
      offered: e.rhi_offered ?? false,
      completed: e.rhi_completed ?? false,
      within72Hours: e.rhi_within_72h ?? undefined,
      conductedBy: e.rhi_conducted_by ?? undefined,
      pushFactors: e.push_factors ?? [],
      pullFactors: e.pull_factors ?? [],
      safetyPlanUpdated: e.safety_plan_updated ?? undefined,
    },
    riskFactorsIdentified: e.risk_factors ?? [],
    locationIfKnown: e.location ?? undefined,
    withWhom: e.with_whom ?? undefined,
    triggers: e.triggers ?? [],
    staffResponse: e.staff_response ?? undefined,
  }));

  return {
    childId,
    childName,
    age,
    episodes,
    hasRiskAssessment: riskProfile?.has_missing_risk_assessment ?? false,
    riskAssessmentUpToDate: riskProfile?.missing_ra_up_to_date ?? false,
    hasMissingProtocol: riskProfile?.has_missing_protocol ?? false,
    missingProtocolReviewDate: riskProfile?.missing_protocol_review ?? undefined,
    knownCSERisk: riskProfile?.cse_risk ?? false,
    knownCCERisk: riskProfile?.cce_risk ?? false,
    knownGangAssociation: riskProfile?.gang_association ?? false,
    placementType: child?.placement_type ?? "residential",
  };
}

// ── Demo Data ───────────────────────────────────────────────────────────────

function buildDemoData(childId: string): MissingInput {
  const isJordan = childId.includes("jordan") || childId === "child_1";

  if (!isJordan) {
    // Sam: no episodes
    return {
      childId,
      childName: "Sam",
      age: 14,
      episodes: [],
      hasRiskAssessment: false,
      riskAssessmentUpToDate: false,
      hasMissingProtocol: false,
      knownCSERisk: false,
      knownCCERisk: false,
      knownGangAssociation: false,
      placementType: "residential",
    };
  }

  // Jordan: some episodes with improving trend
  const episodes: MissingEpisode[] = [
    {
      id: "me_1",
      date: "2026-03-05",
      startTime: "19:30",
      endTime: "23:45",
      category: "absent",
      durationMinutes: 255,
      outcome: "returned_self",
      policeNotified: false,
      socialWorkerNotified: true,
      returnHomeInterview: { offered: true, completed: true, within72Hours: true, pushFactors: ["argument with peer"], pullFactors: ["wanted to see friend"] },
      triggers: ["argument in home"],
    },
    {
      id: "me_2",
      date: "2026-03-18",
      startTime: "16:00",
      endDate: "2026-03-19",
      endTime: "02:30",
      category: "missing",
      durationMinutes: 630,
      outcome: "found_by_police",
      policeNotified: true,
      policeRefNumber: "PC/2026/4421",
      socialWorkerNotified: true,
      returnHomeInterview: { offered: true, completed: true, within72Hours: true, pushFactors: ["contact with mum cancelled"], pullFactors: ["city centre with mates"] },
      triggers: ["family contact cancelled"],
      locationIfKnown: "City Centre",
    },
    {
      id: "me_3",
      date: "2026-04-02",
      startTime: "20:00",
      endTime: "22:15",
      category: "absent",
      durationMinutes: 135,
      outcome: "returned_self",
      policeNotified: false,
      socialWorkerNotified: true,
      returnHomeInterview: { offered: true, completed: false },
      triggers: ["refused key work session"],
    },
    {
      id: "me_4",
      date: "2026-04-20",
      startTime: "18:30",
      endTime: "20:00",
      category: "away_without_permission",
      durationMinutes: 90,
      outcome: "returned_self",
      policeNotified: false,
      socialWorkerNotified: true,
      returnHomeInterview: { offered: true, completed: true, within72Hours: true },
    },
  ];

  return {
    childId,
    childName: "Jordan",
    age: 15,
    episodes,
    hasRiskAssessment: true,
    riskAssessmentUpToDate: true,
    hasMissingProtocol: true,
    missingProtocolReviewDate: "2026-04-01",
    knownCSERisk: false,
    knownCCERisk: false,
    knownGangAssociation: false,
    placementType: "residential",
  };
}
