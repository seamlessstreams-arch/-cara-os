import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { todayStr } from "@/lib/utils";

// ── POST /api/v1/missing-episodes ────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { child_id, date_missing, time_missing, risk_level, location_last_seen } = body;

  if (!child_id) return NextResponse.json({ error: "child_id is required" }, { status: 400 });
  if (!date_missing) return NextResponse.json({ error: "date_missing is required" }, { status: 400 });
  if (!risk_level) return NextResponse.json({ error: "risk_level is required" }, { status: 400 });

  const episode = db.missingEpisodes.create({
    child_id,
    date_missing,
    time_missing: time_missing ?? null,
    risk_level,
    location_last_seen: location_last_seen ?? null,
    status: "active",
    reported_to_police: false,
    police_reference: null,
    reported_to_la: false,
    la_notified_at: null,
    return_interview_completed: false,
    return_interview_by: null,
    return_interview_date: null,
    return_interview_notes: null,
    date_returned: null,
    time_returned: null,
    duration_hours: null,
    return_location: null,
    contextual_safeguarding_risk: false,
    linked_incident_id: null,
    pattern_notes: null,
    home_id: "home_oak",
    created_by: body.created_by ?? "staff_darren",
  });

  return NextResponse.json({ data: episode }, { status: 201 });
}

const RISK_ORDER = ["low", "medium", "high", "critical"];

function highestRisk(risks: string[]): string {
  if (!risks.length) return "low";
  return risks.reduce((best, current) => {
    return RISK_ORDER.indexOf(current) > RISK_ORDER.indexOf(best) ? current : best;
  }, "low");
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const childIdFilter = searchParams.get("child_id");
  const statusFilter = searchParams.get("status") ?? "all";
  const riskLevelFilter = searchParams.get("risk_level");

  let episodes = db.missingEpisodes.findAll();

  if (childIdFilter) {
    episodes = episodes.filter((e) => e.child_id === childIdFilter);
  }
  if (statusFilter === "active") {
    episodes = episodes.filter((e) => e.status === "active");
  } else if (statusFilter === "closed") {
    episodes = episodes.filter((e) => e.status === "closed");
  }
  if (riskLevelFilter) {
    episodes = episodes.filter((e) => e.risk_level === riskLevelFilter);
  }

  // Sort newest first
  const sorted = [...episodes].sort((a, b) => b.date_missing.localeCompare(a.date_missing));

  // Meta calculations
  const today = todayStr();
  const thisMonthPrefix = today.slice(0, 7); // YYYY-MM
  const thisYearPrefix = today.slice(0, 4);  // YYYY

  const allEpisodes = db.missingEpisodes.findAll();
  const totalActive = allEpisodes.filter((e) => e.status === "active").length;
  const thisMonth = allEpisodes.filter((e) => e.date_missing.startsWith(thisMonthPrefix)).length;
  const thisYear = allEpisodes.filter((e) => e.date_missing.startsWith(thisYearPrefix)).length;
  const contextualRisk = allEpisodes.filter((e) => e.contextual_safeguarding_risk).length;
  const unresolved = allEpisodes.filter(
    (e) => e.status === "closed" && !e.return_interview_completed
  ).length;

  // Pattern analysis: group by child_id (from all episodes, not filtered set)
  const allEpisodesForPattern = childIdFilter
    ? allEpisodes.filter((e) => e.child_id === childIdFilter)
    : allEpisodes;

  const byChild = new Map<string, typeof allEpisodes>();
  for (const ep of allEpisodesForPattern) {
    if (!byChild.has(ep.child_id)) byChild.set(ep.child_id, []);
    byChild.get(ep.child_id)!.push(ep);
  }

  const youngPeople = db.youngPeople.findAll();

  const patternAnalysis = Array.from(byChild.entries()).map(([childId, eps]) => {
    const yp = youngPeople.find((y) => y.id === childId);
    const childName = yp
      ? `${yp.preferred_name ?? yp.first_name} ${yp.last_name}`
      : "Unknown";

    const durations = eps.filter((e) => e.duration_hours !== null).map((e) => e.duration_hours as number);
    const avgDurationHours = durations.length > 0
      ? Math.round((durations.reduce((a, b) => a + b, 0) / durations.length) * 10) / 10
      : 0;

    const risks = eps.map((e) => e.risk_level);
    const highest = highestRisk(risks);

    const hasContextualRisk = eps.some((e) => e.contextual_safeguarding_risk);
    const returnInterviewOutstanding = eps.some(
      (e) => e.status === "closed" && e.return_interview_completed === false
    );

    const dates = eps.map((e) => e.date_missing).sort((a, b) => b.localeCompare(a));
    const lastEpisodeDate = dates[0] ?? null;

    return {
      child_id: childId,
      child_name: childName,
      total_episodes: eps.length,
      avg_duration_hours: avgDurationHours,
      highest_risk: highest,
      contextual_risk: hasContextualRisk,
      return_interview_outstanding: returnInterviewOutstanding,
      last_episode_date: lastEpisodeDate,
    };
  });

  return NextResponse.json({
    data: sorted,
    meta: {
      total: allEpisodes.length,
      active: totalActive,
      this_month: thisMonth,
      this_year: thisYear,
      contextual_risk: contextualRisk,
      unresolved,
    },
    pattern_analysis: patternAnalysis,
  });
}
