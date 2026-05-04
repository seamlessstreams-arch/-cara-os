import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { todayStr } from "@/lib/utils";

// ── POST /api/v1/safeguarding  (chronology entry) ────────────────────────────

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { child_id, category, significance, title, description } = body;

  if (!child_id) return NextResponse.json({ error: "child_id is required" }, { status: 400 });
  if (!category) return NextResponse.json({ error: "category is required" }, { status: 400 });
  if (!title?.trim()) return NextResponse.json({ error: "title is required" }, { status: 400 });

  const entry = db.chronology.create({
    child_id,
    category,
    significance: significance ?? "routine",
    title: title.trim(),
    description: description?.trim() ?? null,
    date: todayStr(),
    time: new Date().toTimeString().slice(0, 5),
    recorded_by: body.recorded_by ?? "staff_darren",
    linked_incident_id: body.linked_incident_id ?? null,
    home_id: "home_oak",
  });

  return NextResponse.json({ data: entry }, { status: 201 });
}

const RISK_ORDER = ["low", "medium", "high", "critical"];

function highestRisk(risks: string[]): string {
  if (!risks.length) return "low";
  return risks.reduce((best, current) => {
    return RISK_ORDER.indexOf(current) > RISK_ORDER.indexOf(best) ? current : best;
  }, "low");
}

export async function GET(_req: NextRequest) {
  const allMissing = db.missingEpisodes.findAll();
  const allIncidents = db.incidents.findAll();
  const allYP = db.youngPeople.findAll();
  const allChronology = db.chronology.findAll();

  // Summary counts
  const activeMissing = allMissing.filter((m) => m.status === "active").length;
  const contextualRiskCount = allMissing.filter((m) => m.contextual_safeguarding_risk).length;
  const highRiskYP = allYP.filter((yp) => yp.risk_flags.length > 0).length;
  const incidentsRequiringOversight = allIncidents.filter(
    (i) => i.requires_oversight && !i.oversight_by
  ).length;
  const openIncidentsTotal = allIncidents.filter((i) => i.status === "open").length;
  const criticalIncidents = allIncidents.filter(
    (i) => i.severity === "critical" && i.status === "open"
  ).length;

  // Missing episodes sorted newest first
  const missingEpisodesSorted = [...allMissing].sort((a, b) =>
    b.date_missing.localeCompare(a.date_missing)
  );

  // Pattern analysis across all YPs
  const byChild = new Map<string, typeof allMissing>();
  for (const ep of allMissing) {
    if (!byChild.has(ep.child_id)) byChild.set(ep.child_id, []);
    byChild.get(ep.child_id)!.push(ep);
  }

  const patternAnalysis = Array.from(byChild.entries()).map(([childId, eps]) => {
    const yp = allYP.find((y) => y.id === childId);
    const childName = yp
      ? `${yp.preferred_name ?? yp.first_name} ${yp.last_name}`
      : "Unknown";

    const risks = eps.map((e) => e.risk_level);
    const hasCSRisk = eps.some((e) => e.contextual_safeguarding_risk);
    const dates = eps.map((e) => e.date_missing).sort((a, b) => b.localeCompare(a));

    return {
      child_id: childId,
      child_name: childName,
      total: eps.length,
      highest_risk: highestRisk(risks),
      cs_risk: hasCSRisk,
      last_date: dates[0] ?? null,
    };
  });

  // High-risk young people with open incidents and missing episode counts
  const highRiskYoungPeople = allYP
    .filter((yp) => yp.risk_flags.length > 0)
    .map((yp) => ({
      ...yp,
      open_incidents: allIncidents.filter((i) => i.child_id === yp.id && i.status === "open").length,
      missing_episodes: allMissing.filter((m) => m.child_id === yp.id).length,
    }));

  // Incidents needing oversight
  const incidentsNeedingOversight = allIncidents
    .filter((i) => i.requires_oversight && !i.oversight_by)
    .sort((a, b) => b.date.localeCompare(a.date));

  // Recent chronology — last 10 across all YPs, sorted by date desc
  const chronologyRecent = [...allChronology]
    .sort((a, b) => {
      const dateA = a.date + (a.time ? "T" + a.time : "T00:00");
      const dateB = b.date + (b.time ? "T" + b.time : "T00:00");
      return dateB.localeCompare(dateA);
    })
    .slice(0, 10);

  return NextResponse.json({
    data: {
      summary: {
        active_missing: activeMissing,
        contextual_risk_count: contextualRiskCount,
        high_risk_yp: highRiskYP,
        incidents_requiring_oversight: incidentsRequiringOversight,
        open_incidents_total: openIncidentsTotal,
        critical_incidents: criticalIncidents,
      },
      missing_episodes: missingEpisodesSorted,
      pattern_analysis: patternAnalysis,
      high_risk_young_people: highRiskYoungPeople,
      incidents_needing_oversight: incidentsNeedingOversight,
      chronology_recent: chronologyRecent,
    },
  });
}
