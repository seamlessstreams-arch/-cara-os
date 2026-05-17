// ══════════════════════════════════════════════════════════════════════════════
// API: /api/placement-stability — Placement Stability & Matching
//
// Returns placement stability assessments, matching recommendations,
// home-level metrics, and disruption risk analysis. Powers the placement
// dashboard, matching panels, and stability monitoring screens.
//
// CHR 2015 Reg 11/12/14 — Welfare, protection, care planning.
// Ofsted SCCIF — "Children are well matched to their placements."
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import {
  evaluatePlacementStability,
  calculateHomeStabilityMetrics,
  getMatchingRecommendations,
} from "@/lib/placement-stability";
import type { Placement, MatchingAssessmentItem } from "@/lib/placement-stability";

type SB = any;

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const homeId = url.searchParams.get("homeId") ?? "home-oak";
    const childId = url.searchParams.get("childId");
    const view = url.searchParams.get("view") ?? "overview";

    const sb = createServerClient();

    if (sb && isSupabaseEnabled()) {
      return await handleLiveData(sb, homeId, childId, view);
    }

    return NextResponse.json(getDemoData(homeId, childId, view));
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

// ── Live Data ──────────────────────────────────────────────────────────────

async function handleLiveData(sb: any, homeId: string, childId: string | null, view: string) {
  let query = (sb.from("placements") as SB)
    .select("*, matching_assessments(*), stability_milestones(*), disruption_events(*)")
    .eq("home_id", homeId)
    .order("admission_date", { ascending: false });

  if (childId) {
    query = query.eq("child_id", childId);
  }

  const { data: rows, error } = await query;
  if (error) throw error;

  const placements: Placement[] = (rows ?? []).map(mapToPlacement);

  switch (view) {
    case "overview":
      return NextResponse.json(calculateHomeStabilityMetrics(placements, homeId, "Oak House", 4));
    case "stability":
      return NextResponse.json({
        results: placements.map(p => evaluatePlacementStability(p)),
      });
    case "matching":
      if (!childId) {
        return NextResponse.json({ error: "childId required for matching view" }, { status: 400 });
      }
      const placement = placements[0];
      if (!placement) return NextResponse.json({ error: "Placement not found" }, { status: 404 });
      return NextResponse.json({
        stability: evaluatePlacementStability(placement),
        matchingRecommendations: getMatchingRecommendations(placement),
      });
    default:
      return NextResponse.json({ error: `Unknown view: ${view}` }, { status: 400 });
  }
}

function mapToPlacement(row: any): Placement {
  return {
    id: row.id,
    childId: row.child_id,
    childName: row.child_name,
    homeId: row.home_id,
    homeName: row.home_name ?? "",
    status: row.status,
    referralDate: row.referral_date,
    admissionDate: row.admission_date,
    plannedEndDate: row.planned_end_date,
    actualEndDate: row.actual_end_date,
    endReason: row.end_reason,
    matchingScore: row.matching_score ?? 70,
    matchingAssessment: (row.matching_assessments ?? []).map((m: any) => ({
      domain: m.domain,
      score: m.score,
      notes: m.notes ?? "",
      mitigationPlan: m.mitigation_plan,
    })),
    currentRiskIndicators: row.current_risk_indicators ?? [],
    stabilityMilestones: (row.stability_milestones ?? []).map((m: any) => ({
      name: m.name,
      targetDate: m.target_date,
      achievedDate: m.achieved_date,
      status: m.status,
    })),
    disruptionHistory: (row.disruption_events ?? []).map((d: any) => ({
      date: d.date,
      description: d.description,
      severity: d.severity,
      resolved: d.resolved ?? false,
      actionTaken: d.action_taken ?? "",
    })),
    keyworkerId: row.keyworker_id ?? "",
    keyworkerName: row.keyworker_name ?? "",
    socialWorkerId: row.social_worker_id ?? "",
    previousPlacements: row.previous_placements ?? 0,
  };
}

// ── Demo Data ─────────────────────────────────────────────────────────────

function getDemoData(homeId: string, childId: string | null, view: string) {
  const allPlacements = getDemoPlacements(homeId);
  const placements = childId ? allPlacements.filter(p => p.childId === childId) : allPlacements;

  switch (view) {
    case "overview":
      return calculateHomeStabilityMetrics(allPlacements, homeId, "Oak House", 4);
    case "stability":
      return { results: placements.map(p => evaluatePlacementStability(p)) };
    case "matching":
      if (!childId || placements.length === 0) return { error: "Placement not found" };
      return {
        stability: evaluatePlacementStability(placements[0]),
        matchingRecommendations: getMatchingRecommendations(placements[0]),
      };
    default:
      return { error: `Unknown view: ${view}` };
  }
}

function getDemoPlacements(homeId: string): Placement[] {
  const matchingBase: MatchingAssessmentItem[] = [
    { domain: "age_appropriateness", score: 8, notes: "Within age range of current group" },
    { domain: "peer_dynamics", score: 7, notes: "Generally positive dynamics" },
    { domain: "risk_compatibility", score: 7, notes: "Compatible risk profile" },
    { domain: "therapeutic_needs", score: 8, notes: "CAMHS accessible locally" },
    { domain: "education_provision", score: 9, notes: "School placement secured" },
    { domain: "location_suitability", score: 7, notes: "40 min from family" },
    { domain: "cultural_identity", score: 8, notes: "Staff culturally aware" },
    { domain: "contact_arrangements", score: 7, notes: "Weekly contact agreed" },
    { domain: "staff_capability", score: 8, notes: "Experienced team" },
    { domain: "physical_environment", score: 8, notes: "Suitable room allocated" },
  ];

  return [
    // ── Jordan — Stable, established placement ──
    {
      id: "pl-001",
      childId: "child-jordan",
      childName: "Jordan Williams",
      homeId,
      homeName: "Oak House",
      status: "established",
      referralDate: "2024-08-15T00:00:00Z",
      admissionDate: "2024-09-01T00:00:00Z",
      matchingScore: 78,
      matchingAssessment: matchingBase,
      currentRiskIndicators: [],
      stabilityMilestones: [
        { name: "Settled in school", targetDate: "2024-10-01", achievedDate: "2024-09-25", status: "achieved" },
        { name: "Established keyworker relationship", targetDate: "2024-10-15", achievedDate: "2024-10-10", status: "achieved" },
        { name: "Regular family contact", targetDate: "2024-11-01", achievedDate: "2024-11-01", status: "achieved" },
        { name: "Community activity engaged", targetDate: "2026-06-01", status: "pending" },
      ],
      disruptionHistory: [],
      keyworkerId: "staff-001",
      keyworkerName: "Sarah Mitchell",
      socialWorkerId: "sw-001",
      previousPlacements: 2,
    },

    // ── Alex — At risk, exploitation concerns ──
    {
      id: "pl-002",
      childId: "child-alex",
      childName: "Alex Reeves",
      homeId,
      homeName: "Oak House",
      status: "at_risk",
      referralDate: "2025-06-01T00:00:00Z",
      admissionDate: "2025-06-15T00:00:00Z",
      matchingScore: 62,
      matchingAssessment: [
        { domain: "age_appropriateness", score: 7, notes: "Oldest in group" },
        { domain: "peer_dynamics", score: 5, notes: "Tension with younger peers. Influence concern.", mitigationPlan: "Structured separate activities. Monitor closely." },
        { domain: "risk_compatibility", score: 5, notes: "Higher risk profile than peers", mitigationPlan: "Enhanced safety plan. Staff awareness training." },
        { domain: "therapeutic_needs", score: 6, notes: "Exploitation support needed" },
        { domain: "education_provision", score: 7, notes: "Alternative provision in place" },
        { domain: "location_suitability", score: 5, notes: "Known associates nearby", mitigationPlan: "Disruption strategy with police." },
        { domain: "cultural_identity", score: 8, notes: "Good cultural match" },
        { domain: "contact_arrangements", score: 6, notes: "Complex family dynamics" },
        { domain: "staff_capability", score: 7, notes: "Staff trained in exploitation" },
        { domain: "physical_environment", score: 8, notes: "Room on ground floor for monitoring" },
      ],
      currentRiskIndicators: ["frequent_missing", "exploitation_risk", "peer_conflict"],
      stabilityMilestones: [
        { name: "School engagement", targetDate: "2025-09-01", achievedDate: "2025-09-15", status: "achieved" },
        { name: "Reduced missing episodes", targetDate: "2026-03-01", status: "overdue" },
        { name: "MACE safety plan", targetDate: "2026-04-01", achievedDate: "2026-03-20", status: "achieved" },
      ],
      disruptionHistory: [
        { date: "2026-04-28T00:00:00Z", description: "Missing 35 hours — exploitation concern", severity: "high", resolved: true, actionTaken: "Strategy meeting held. NRM referral." },
        { date: "2026-03-10T00:00:00Z", description: "Refused to return to home after contact", severity: "medium", resolved: true, actionTaken: "Police located. Stability meeting." },
      ],
      keyworkerId: "staff-002",
      keyworkerName: "Tom Richards",
      socialWorkerId: "sw-002",
      previousPlacements: 4,
    },

    // ── Mia — Settling in, new placement ──
    {
      id: "pl-003",
      childId: "child-mia",
      childName: "Mia Chen",
      homeId,
      homeName: "Oak House",
      status: "settling_in",
      referralDate: "2026-04-20T00:00:00Z",
      admissionDate: "2026-05-01T00:00:00Z",
      matchingScore: 82,
      matchingAssessment: [
        { domain: "age_appropriateness", score: 9, notes: "Age-appropriate peer group" },
        { domain: "peer_dynamics", score: 8, notes: "Positive early interactions" },
        { domain: "risk_compatibility", score: 8, notes: "Lower risk — good balance for group" },
        { domain: "therapeutic_needs", score: 7, notes: "CAMHS referral in progress" },
        { domain: "education_provision", score: 9, notes: "School place confirmed, strong PEP" },
        { domain: "location_suitability", score: 8, notes: "Close to school and family" },
        { domain: "cultural_identity", score: 9, notes: "Diverse staff team, community links" },
        { domain: "contact_arrangements", score: 8, notes: "Twice weekly contact agreed" },
        { domain: "staff_capability", score: 8, notes: "Keyworker experienced with similar presentations" },
        { domain: "physical_environment", score: 9, notes: "Room personalised before arrival" },
      ],
      currentRiskIndicators: [],
      stabilityMilestones: [
        { name: "First school week completed", targetDate: "2026-05-10", achievedDate: "2026-05-09", status: "achieved" },
        { name: "Keyworker relationship established", targetDate: "2026-05-29", status: "pending" },
        { name: "First family contact from home", targetDate: "2026-05-15", achievedDate: "2026-05-14", status: "achieved" },
        { name: "Engaged in house activity", targetDate: "2026-06-01", status: "pending" },
      ],
      disruptionHistory: [],
      keyworkerId: "staff-003",
      keyworkerName: "Lisa Park",
      socialWorkerId: "sw-003",
      previousPlacements: 1,
    },
  ];
}
