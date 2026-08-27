import { NextResponse } from "next/server";
import { dal } from "@/lib/db";
import { OUTCOME_DOMAIN_LABELS } from "@/types/extended";
import { todayStr } from "@/lib/utils";

export async function GET() {
  try {
    const [outcomeTargetsList, youngPeopleList] = await Promise.all([
      dal.outcomeTargets.findAll(),
      dal.youngPeople.findAll(),
    ]);
    const today = todayStr();

    const youngPeople = ((youngPeopleList)) ?? [];
    const outcomeTargets = ((outcomeTargetsList)) ?? [];

    const activeYP = youngPeople.filter((yp) => yp.status === "current");
    const activeTargets = outcomeTargets.filter((t) => t.status === "active");

    const totalTargets = activeTargets.length;
    const improvingCount = activeTargets.filter((t) => t.direction === "improving").length;
    const stableCount = activeTargets.filter((t) => t.direction === "stable").length;
    const decliningCount = activeTargets.filter((t) => t.direction === "declining").length;
    const overdueReviews = activeTargets.filter((t) => t.review_date && t.review_date < today).length;

    // Domain breakdown
    const domainMap = new Map<string, { total: number; improving: number; stable: number; declining: number; ratingSum: number }>();
    for (const t of activeTargets) {
      const d = (t.domain as string) ?? "other";
      if (!domainMap.has(d)) domainMap.set(d, { total: 0, improving: 0, stable: 0, declining: 0, ratingSum: 0 });
      const e = domainMap.get(d)!;
      e.total++;
      if (t.direction === "improving") e.improving++;
      else if (t.direction === "stable") e.stable++;
      else if (t.direction === "declining") e.declining++;
      e.ratingSum += (t.current_rating as number) ?? 3;
    }
    const domainBreakdown = Array.from(domainMap.entries())
      .map(([domain, s]) => ({
        domain,
        label: (OUTCOME_DOMAIN_LABELS as Record<string, string>)[domain] ?? domain.replace(/_/g, " "),
        totalTargets: s.total,
        improving: s.improving,
        stable: s.stable,
        declining: s.declining,
        avgRating: Math.round((s.ratingSum / s.total) * 10) / 10,
      }))
      .sort((a, b) => b.totalTargets - a.totalTargets);

    // Per-child summaries
    const childrenWithVoiceSet = new Set(
      activeTargets.filter((t) => t.yp_voice && (t.yp_voice as string).length > 0).map((t) => t.child_id as string)
    );

    const childSummaries = activeYP.map((yp) => {
      const targets = activeTargets.filter((t) => t.child_id === yp.id);
      const improvC = targets.filter((t) => t.direction === "improving").length;
      const stableC = targets.filter((t) => t.direction === "stable").length;
      const declC = targets.filter((t) => t.direction === "declining").length;
      const overdue = targets.filter((t) => t.review_date && t.review_date < today).length;
      const voiceCount = targets.filter((t) => t.yp_voice && (t.yp_voice as string).length > 0).length;
      const domains = [...new Set(targets.map((t) => t.domain as string))];
      const avgRating =
        targets.length > 0
          ? Math.round((targets.reduce((s, t) => s + ((t.current_rating as number) ?? 3), 0) / targets.length) * 10) / 10
          : null;

      let signal: "green" | "amber" | "red" | "grey" = "grey";
      if (targets.length === 0) signal = "grey";
      else if (declC > 0 || overdue > 0) signal = "red";
      else if (stableC > improvC) signal = "amber";
      else signal = "green";

      return {
        childId: yp.id,
        childName: (yp.preferred_name ?? yp.first_name) as string,
        totalTargets: targets.length,
        improvingCount: improvC,
        stableCount: stableC,
        decliningCount: declC,
        overdueReviews: overdue,
        voiceCaptured: voiceCount > 0,
        voiceCount,
        domains,
        avgRating,
        signal,
      };
    });

    // Concerns
    const concerns: string[] = [];
    for (const t of activeTargets.filter((t) => t.direction === "declining")) {
      const yp = youngPeople.find((y) => y.id === t.child_id);
      const name = yp ? ((yp.preferred_name ?? yp.first_name) as string) : (t.child_id as string);
      const label = (OUTCOME_DOMAIN_LABELS as Record<string, string>)[t.domain as string] ?? (t.domain as string);
      concerns.push(`${name}: ${label} — ${(t.target_description as string)?.slice(0, 60) ?? "review required"}`);
    }
    if (overdueReviews > 0) {
      concerns.push(
        `${overdueReviews} outcome target review${overdueReviews === 1 ? "" : "s"} overdue — complete before next LAC review`
      );
    }

    // Insights
    const insights: string[] = [];
    if (totalTargets === 0) {
      insights.push(
        "No active outcome targets recorded. Outcome-focused care planning is a statutory requirement under the Care Planning, Placement and Case Review Regulations 2010."
      );
    } else {
      const improvePct = Math.round((improvingCount / totalTargets) * 100);
      if (improvePct >= 70) {
        insights.push(`${improvePct}% of active targets are improving — strong evidence of effective care planning and intervention.`);
      } else if (improvePct < 40) {
        insights.push(
          `Only ${improvePct}% of targets show improvement. Review intervention strategies and whether current targets remain appropriate.`
        );
      }
      const noVoice = totalTargets - activeTargets.filter((t) => t.yp_voice && (t.yp_voice as string).length > 0).length;
      if (noVoice > 0 && noVoice >= totalTargets * 0.5) {
        insights.push(
          `${noVoice} outcome target${noVoice === 1 ? "" : "s"} have no child voice recorded. Article 12 requires the young person's perspective to be sought and documented.`
        );
      }
      const bestDomain = [...domainBreakdown].sort((a, b) => b.improving - a.improving)[0];
      if (bestDomain && bestDomain.improving > 0) {
        insights.push(
          `Strongest progress in ${bestDomain.label} — ${bestDomain.improving} improving target${bestDomain.improving === 1 ? "" : "s"}, average rating ${bestDomain.avgRating}/5.`
        );
      }
    }

    let overallSignal: "green" | "amber" | "red" | "grey" = "grey";
    if (totalTargets === 0) overallSignal = "grey";
    else if (decliningCount >= 2 || overdueReviews >= 3) overallSignal = "red";
    else if (decliningCount > 0 || overdueReviews > 0 || improvingCount < totalTargets * 0.5) overallSignal = "amber";
    else overallSignal = "green";

    return NextResponse.json({
      data: {
        totalTargets,
        improvingCount,
        stableCount,
        decliningCount,
        overdueReviews,
        childrenWithVoice: childrenWithVoiceSet.size,
        totalChildren: activeYP.length,
        domainBreakdown,
        childSummaries,
        concerns,
        insights,
        overallSignal,
        regulatoryNote:
          "Care Planning, Placement and Case Review Regulations 2010 (Reg 36). Outcome targets should be reviewed at each LAC review — at least every 6 months — or more frequently when a child's circumstances change significantly.",
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to compute outcome progress" }, { status: 500 });
  }
}
