import { NextResponse } from "next/server";
import { dal } from "@/lib/db";
import type {
  ChildImpactSummary,
  ShowingImpactAnalysis,
  SignalColour,
} from "@/lib/cara-visual-toolkit/types";

export const dynamic = "force-dynamic";

function initials(yp: any): string {
  const f = ((yp.first_name || yp.preferred_name || "?")[0] ?? "?").toUpperCase();
  const l = ((yp.last_name || "?")[0] ?? "?").toUpperCase();
  return `${f}.${l}.`;
}

export async function GET() {
  const [incidentsList, keyWorkingSessionsList, riskAssessmentsList, youngPeopleList] = await Promise.all([
      dal.incidents.findAll(),
      dal.keyWorkingSessions.findAll(),
      dal.riskAssessments.findAll(),
      dal.youngPeople.findAll(),
    ]);
  const youngPeople = ((youngPeopleList)) ?? [];
  const keyWorkingSessions = ((keyWorkingSessionsList)) ?? [];
  const incidents = ((incidentsList)) ?? [];
  const riskAssessments = ((riskAssessmentsList)) ?? [];

  const sixMonthsAgo = new Date(
    new Date().getTime() - 180 * 86_400_000
  ).toISOString().slice(0, 10);
  const threeMonthsAgo = new Date(
    new Date().getTime() - 90 * 86_400_000
  ).toISOString().slice(0, 10);

  const activeChildren = youngPeople.filter(
    (y) => y.status === "current" || y.status === "emergency"
  );

  const childSummaries: ChildImpactSummary[] = activeChildren.map((yp) => {
    const childKW = keyWorkingSessions.filter((k) => k.child_id === yp.id);
    const childIncidents = incidents.filter((i) => i.child_id === yp.id);
    const recentIncidents = childIncidents.filter(
      (i) => (i.date ?? "") >= threeMonthsAgo
    ).length;
    const olderIncidents = childIncidents.filter(
      (i) => (i.date ?? "") >= sixMonthsAgo && (i.date ?? "") < threeMonthsAgo
    ).length;

    // Voice: key work sessions with child_voice field populated
    const voiceRecorded = childKW.some(
      (k) => k.child_voice && String(k.child_voice).trim().length > 10
    );

    // Incident trend
    let incidentTrend: ChildImpactSummary["incidentTrend"] = "insufficient_data";
    if (childIncidents.length >= 2) {
      if (recentIncidents < olderIncidents) incidentTrend = "improving";
      else if (recentIncidents > olderIncidents) incidentTrend = "worsening";
      else incidentTrend = "stable";
    }

    // Risk trend from risk assessments
    const childRAs = riskAssessments
      .filter((r) => r.child_id === yp.id)
      .sort((a, b) => (b.assessed_date ?? "").localeCompare(a.assessed_date ?? ""));
    const latestRA = childRAs[0];
    const riskTrend = latestRA?.trend ?? null;

    // Recent outcomes from key work
    const recentOutcomes = childKW
      .filter((k) => (k.date ?? "") >= threeMonthsAgo && k.worker_observations)
      .map((k) => k.worker_observations as string)
      .slice(0, 3);

    // Signal
    const overallSignal: SignalColour =
      incidentTrend === "worsening"
        ? "amber"
        : !voiceRecorded
        ? "amber"
        : incidentTrend === "improving"
        ? "green"
        : "green";

    return {
      childId: yp.id,
      childInitials: initials(yp),
      keyWorkCount: childKW.length,
      incidentTrend,
      voiceRecorded,
      riskTrend,
      recentOutcomes,
      overallSignal,
    } satisfies ChildImpactSummary;
  });

  const childrenWithVoice = childSummaries.filter((c) => c.voiceRecorded).length;
  const childrenWithKeyWork = childSummaries.filter((c) => c.keyWorkCount > 0).length;
  const childrenImproving = childSummaries.filter(
    (c) => c.incidentTrend === "improving"
  ).length;

  const insights: string[] = [];
  if (childrenWithVoice < activeChildren.length) {
    insights.push(
      `${activeChildren.length - childrenWithVoice} child${activeChildren.length - childrenWithVoice > 1 ? "ren do" : " does"} not have recorded voice in their key work. Article 12 of the UN CRC gives every child the right to express their views. Record the child's words, not just the worker's observations.`
    );
  }
  if (childrenImproving > 0) {
    insights.push(
      `${childrenImproving} child${childrenImproving > 1 ? "ren show" : " shows"} a declining incident trend — potential evidence of positive impact. Document what has changed and why in key work notes and the Reg 45 review.`
    );
  }
  const worsening = childSummaries.filter((c) => c.incidentTrend === "worsening").length;
  if (worsening > 0) {
    insights.push(
      `${worsening} child${worsening > 1 ? "ren show" : " shows"} an increasing incident trend. Review whether current support plans are meeting their needs and consider a multi-agency strategy meeting.`
    );
  }
  if (childrenWithKeyWork < activeChildren.length) {
    insights.push(
      `${activeChildren.length - childrenWithKeyWork} child${activeChildren.length - childrenWithKeyWork > 1 ? "ren have" : " has"} no key work sessions recorded. Key work is the foundation of the therapeutic relationship and cannot be evidenced without records.`
    );
  }

  const overallSignal: SignalColour =
    childrenWithVoice === 0 && activeChildren.length > 0
      ? "red"
      : worsening >= 2 || childrenWithVoice < activeChildren.length / 2
      ? "amber"
      : activeChildren.length === 0
      ? "grey"
      : "green";

  const result: ShowingImpactAnalysis = {
    totalChildren: activeChildren.length,
    childrenWithVoice,
    childrenWithKeyWork,
    childrenImproving,
    childSummaries: childSummaries.sort((a, b) => {
      const order: Record<string, number> = { worsening: 0, insufficient_data: 1, stable: 2, improving: 3 };
      return (order[a.incidentTrend] ?? 1) - (order[b.incidentTrend] ?? 1);
    }),
    insights,
    overallSignal,
    regulatoryNote:
      "CHR 2015 Reg 45 (quality of care review) and UN CRC Article 12 (child's right to be heard). Ofsted expects homes to demonstrate impact on children's lives — not just activity. Evidence must show change in outcomes, not just compliance with processes.",
  };

  return NextResponse.json({ data: result });
}
