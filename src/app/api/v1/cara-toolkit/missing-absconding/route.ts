// ══════════════════════════════════════════════════════════════════════════════
// CARA VISUAL TOOLKIT — MISSING / ABSCONDING INTELLIGENCE
// GET /api/v1/cara-toolkit/missing-absconding
//
// The page at /cara-toolkit/missing-absconding has fetched this since it was
// written; the route never existed, so the page rendered its error state on
// every tenant. Deterministic: episodes, risk mix, return-interview completion
// and duration, from the home's own missing-episode records via the dal.
// Children's Homes Regulations 2015 Reg 6/12; DfE statutory guidance on
// children who run away or go missing (return interviews within 72 hours).
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { safeList } from "@/lib/api/safe-list";
import { dal } from "@/lib/db/dal";
import type { MissingAbscondingAnalysis, MissingEpisodeSummary, SignalColour } from "@/lib/cara-visual-toolkit/types";

const RISK_LABELS: Record<string, string> = { low: "Low", medium: "Medium", high: "High", critical: "Critical" };
const RISK_ORDER = ["critical", "high", "medium", "low"];

const initialsOf = (name: string): string =>
  (name || "").trim().split(/\s+/).filter(Boolean).map((p) => p[0]!.toUpperCase()).join(".") + ".";

function hoursBetween(d1: string, t1: string | null, d2: string | null, t2: string | null): number | null {
  if (!d1 || !d2) return null;
  const a = new Date(`${d1}T${t1 || "00:00"}:00`).getTime();
  const b = new Date(`${d2}T${t2 || "00:00"}:00`).getTime();
  if (Number.isNaN(a) || Number.isNaN(b) || b < a) return null;
  return Math.round(((b - a) / 36e5) * 10) / 10;
}

export async function GET() {
  const [episodesList, youngPeopleList] = await Promise.all([
    safeList(dal.missingEpisodes.findAll()),
    safeList(dal.youngPeople.findAll()),
  ]);
  const nameOf = new Map(youngPeopleList.map((c) => [String(c.id), String((c as { preferred_name?: string; first_name?: string }).preferred_name ?? (c as { first_name?: string }).first_name ?? "")]));

  const episodes: MissingEpisodeSummary[] = episodesList
    .map((e) => {
      const currentlyMissing = e.status === "active" || (!e.date_returned && e.status !== "closed");
      return {
        id: String(e.id),
        childId: String(e.child_id),
        childInitials: initialsOf(nameOf.get(String(e.child_id)) ?? ""),
        dateMissing: String(e.date_missing ?? ""),
        dateReturned: e.date_returned ?? null,
        durationHours: hoursBetween(String(e.date_missing ?? ""), e.time_missing ?? null, e.date_returned ?? null, e.time_returned ?? null),
        riskLevel: String(e.risk_level ?? "medium"),
        returnInterviewCompleted: !!e.return_interview_completed,
        reportedToPolice: !!e.reported_to_police,
        status: String(e.status ?? ""),
        currentlyMissing,
      };
    })
    .sort((a, b) => b.dateMissing.localeCompare(a.dateMissing));

  const returned = episodes.filter((e) => !e.currentlyMissing);
  const withInterview = returned.filter((e) => e.returnInterviewCompleted).length;
  const returnInterviewCompletionRate = returned.length ? Math.round((withInterview / returned.length) * 100) : 0;
  const incompleteReturnInterviews = returned.length - withInterview;
  const durations = episodes.map((e) => e.durationHours).filter((h): h is number => h !== null);
  const avgDurationHours = durations.length ? Math.round((durations.reduce((s, h) => s + h, 0) / durations.length) * 10) / 10 : null;
  const highRiskEpisodes = episodes.filter((e) => e.riskLevel === "high" || e.riskLevel === "critical").length;
  const currentlyMissing = episodes.filter((e) => e.currentlyMissing).length;

  const riskLevelBreakdown = RISK_ORDER.map((level) => ({ level, label: RISK_LABELS[level], count: episodes.filter((e) => e.riskLevel === level).length }));

  const insights: string[] = [];
  if (episodes.length === 0) insights.push("No missing episodes are recorded for this home. Nothing here is a judgement about the home; it is an absence of records.");
  if (currentlyMissing > 0) insights.push(`${currentlyMissing} child${currentlyMissing === 1 ? " is" : "ren are"} currently recorded as missing. Confirm the police report and the missing-person risk assessment are current.`);
  if (returned.length > 0 && incompleteReturnInterviews > 0) insights.push(`${incompleteReturnInterviews} of ${returned.length} returned episode${returned.length === 1 ? "" : "s"} ${incompleteReturnInterviews === 1 ? "has" : "have"} no return interview recorded. The independent return interview should be offered within 72 hours of return.`);
  if (returned.length > 0 && incompleteReturnInterviews === 0) insights.push("Every returned episode has a return interview recorded.");
  if (highRiskEpisodes > 0) insights.push(`${highRiskEpisodes} episode${highRiskEpisodes === 1 ? " was" : "s were"} assessed high or critical risk. Check each is reflected in the child's risk assessment and, where relevant, referred for exploitation screening.`);
  const notReported = episodes.filter((e) => !e.reportedToPolice && (e.riskLevel === "high" || e.riskLevel === "critical")).length;
  if (notReported > 0) insights.push(`${notReported} high/critical-risk episode${notReported === 1 ? "" : "s"} ${notReported === 1 ? "is" : "are"} not recorded as reported to the police. Record the report or the reason it was not made.`);
  const repeat = new Map<string, number>();
  for (const e of episodes) repeat.set(e.childId, (repeat.get(e.childId) ?? 0) + 1);
  const repeaters = [...repeat.values()].filter((n) => n >= 3).length;
  if (repeaters > 0) insights.push(`${repeaters} child${repeaters === 1 ? " has" : "ren have"} three or more episodes. A pattern of going missing is itself a safeguarding indicator; review the child's plan and any exploitation concerns.`);

  const overallSignal: SignalColour =
    episodes.length === 0 ? "grey"
    : currentlyMissing > 0 || notReported > 0 ? "red"
    : incompleteReturnInterviews > 0 || highRiskEpisodes > 0 ? "amber"
    : "green";

  const result: MissingAbscondingAnalysis = {
    totalEpisodes: episodes.length,
    currentlyMissing,
    highRiskEpisodes,
    returnInterviewCompletionRate,
    incompleteReturnInterviews,
    avgDurationHours,
    episodes,
    riskLevelBreakdown,
    insights,
    overallSignal,
    regulatoryNote:
      "Children's Homes (England) Regulations 2015, Reg 6 (quality and purpose of care) and Reg 12 (protection of children); DfE statutory guidance on children who run away or go missing from home or care (2014): a return interview should be offered within 72 hours of return, by someone independent of the home where possible.",
  };
  return NextResponse.json({ data: result });
}
