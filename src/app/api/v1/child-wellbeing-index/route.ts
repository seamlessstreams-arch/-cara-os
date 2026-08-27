import { NextResponse } from "next/server";
import { dal } from "@/lib/db";

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, n));
}

export async function GET() {
  try {
    const [incidentsList, keyWorkingSessionsList, missingEpisodesList, outcomeTargetsList, youngPeopleList] = await Promise.all([
      dal.incidents.findAll(),
      dal.keyWorkingSessions.findAll(),
      dal.missingEpisodes.findAll(),
      dal.outcomeTargets.findAll(),
      dal.youngPeople.findAll(),
    ]);
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyStr = thirtyDaysAgo.toISOString().split("T")[0];
    const ninetyDaysAgo = new Date(today);
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const ninetyStr = ninetyDaysAgo.toISOString().split("T")[0];

    const youngPeople = ((youngPeopleList)) ?? [];
    const outcomeTargets = ((outcomeTargetsList)) ?? [];
    const keyWorkingSessions = ((keyWorkingSessionsList)) ?? [];
    const incidents = ((incidentsList)) ?? [];
    const missingEpisodes = ((missingEpisodesList)) ?? [];

    const activeYP = youngPeople.filter((yp) => yp.status === "current");

    const childProfiles = activeYP.map((yp) => {
      const id = yp.id as string;

      // 1. Outcomes score — average current_rating normalised to 0-100
      const activeTargets = outcomeTargets.filter((t) => t.child_id === id && t.status === "active");
      let outcomesScore: number | null = null;
      if (activeTargets.length > 0) {
        const avgRating =
          activeTargets.reduce((s: number, t) => s + ((t.current_rating as number) ?? 3), 0) / activeTargets.length;
        outcomesScore = Math.round(((avgRating - 1) / 4) * 100);
      }

      // 2. Wellbeing score — avg mood_after from KW sessions (last 30 days)
      const recentKW = keyWorkingSessions.filter(
        (s) => s.child_id === id && s.date >= thirtyStr
      );
      let wellbeingScore: number | null = null;
      if (recentKW.length > 0) {
        const moodEntries = recentKW.filter((s) => s.mood_after != null);
        if (moodEntries.length > 0) {
          const avgMood = moodEntries.reduce((s: number, kw) => s + (kw.mood_after as number), 0) / moodEntries.length;
          wellbeingScore = Math.round(((avgMood - 1) / 4) * 100);
        }
      }

      // 3. Safety score — starts 100, deductions for recent incidents and missing
      let safetyScore = 100;
      const recentIncidents = incidents.filter(
        (inc) => inc.child_id === id && inc.date >= thirtyStr
      );
      for (const inc of recentIncidents) {
        const sev = (inc.severity as string) ?? "";
        if (sev === "critical") safetyScore -= 25;
        else if (sev === "high") safetyScore -= 15;
        else if (sev === "medium") safetyScore -= 8;
        else safetyScore -= 3;
      }
      const recentMissing = missingEpisodes.filter(
        (me) => me.child_id === id && me.date_missing >= thirtyStr
      );
      safetyScore -= recentMissing.length * 15;
      safetyScore = clamp(safetyScore);

      // 4. Engagement score — key work frequency (last 30 days)
      const kwCount = recentKW.length;
      let engagementScore: number;
      if (kwCount >= 4) engagementScore = 100;
      else if (kwCount === 3) engagementScore = 80;
      else if (kwCount === 2) engagementScore = 60;
      else if (kwCount === 1) engagementScore = 40;
      else engagementScore = 0;

      // 5. Progress score — % of active outcome targets improving
      let progressScore: number | null = null;
      if (activeTargets.length > 0) {
        const improving = activeTargets.filter((t) => t.direction === "improving").length;
        progressScore = Math.round((improving / activeTargets.length) * 100);
      }

      // Composite — average of non-null scores
      const scores = [outcomesScore, wellbeingScore, safetyScore, engagementScore, progressScore].filter(
        (s) => s !== null
      ) as number[];
      const composite = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;

      let signal: "green" | "amber" | "red" | "grey" = "grey";
      if (scores.length === 0) signal = "grey";
      else if ((composite ?? 0) >= 70) signal = "green";
      else if ((composite ?? 0) >= 50) signal = "amber";
      else signal = "red";

      // Strength and concern areas
      const domainScores: Array<{ label: string; score: number | null; key: string }> = [
        { key: "outcomes",   label: "Outcomes",   score: outcomesScore  },
        { key: "wellbeing",  label: "Wellbeing",  score: wellbeingScore },
        { key: "safety",     label: "Safety",     score: safetyScore    },
        { key: "engagement", label: "Engagement", score: engagementScore},
        { key: "progress",   label: "Progress",   score: progressScore  },
      ];
      const scoredDomains = domainScores.filter((d) => d.score !== null) as Array<{ label: string; score: number; key: string }>;
      const strengthArea = scoredDomains.length > 0
        ? scoredDomains.slice().sort((a, b) => b.score - a.score)[0]
        : null;
      const concernArea = scoredDomains.length > 0
        ? scoredDomains.slice().sort((a, b) => a.score - b.score)[0]
        : null;

      // Incident and missing counts for display
      const ninetyIncidents = incidents.filter((inc) => inc.child_id === id && inc.date >= ninetyStr).length;
      const keyWorkTotal = keyWorkingSessions.filter((s) => s.child_id === id).length;

      return {
        childId: id,
        childName: (yp.preferred_name ?? yp.first_name) as string,
        compositeScore: composite,
        signal,
        domainScores,
        strengthArea: strengthArea ? { label: strengthArea.label, score: strengthArea.score } : null,
        concernArea: concernArea ? { label: concernArea.label, score: concernArea.score } : null,
        recentIncidentCount: recentIncidents.length,
        recentMissingCount: recentMissing.length,
        keyWorkSessions30d: kwCount,
        activeTargets: activeTargets.length,
        ninetyIncidents,
        keyWorkTotal,
      };
    });

    // Home-level summary
    const scoredChildren = childProfiles.filter((c) => c.signal !== "grey");
    const avgComposite =
      scoredChildren.length > 0
        ? Math.round(scoredChildren.reduce((s, c) => s + (c.compositeScore ?? 0), 0) / scoredChildren.length)
        : null;
    const greenCount  = childProfiles.filter((c) => c.signal === "green").length;
    const amberCount  = childProfiles.filter((c) => c.signal === "amber").length;
    const redCount    = childProfiles.filter((c) => c.signal === "red").length;

    let overallSignal: "green" | "amber" | "red" | "grey" = "grey";
    if (activeYP.length === 0) overallSignal = "grey";
    else if (redCount >= 2 || (avgComposite ?? 0) < 50) overallSignal = "red";
    else if (redCount > 0 || (avgComposite ?? 0) < 70) overallSignal = "amber";
    else overallSignal = "green";

    // Insights
    const insights: string[] = [];
    const lowEngagement = childProfiles.filter((c) => c.keyWorkSessions30d === 0 && c.signal !== "grey");
    if (lowEngagement.length > 0) {
      insights.push(
        `${lowEngagement.length} child${lowEngagement.length === 1 ? " has" : "ren have"} had no key working sessions in the past 30 days. Regular one-to-one sessions are a cornerstone of relational care.`
      );
    }
    const noOutcomes = childProfiles.filter((c) => c.activeTargets === 0);
    if (noOutcomes.length > 0) {
      insights.push(
        `${noOutcomes.length} child${noOutcomes.length === 1 ? " has" : "ren have"} no active outcome targets — their wellbeing score cannot be fully computed until targets are set.`
      );
    }

    return NextResponse.json({
      data: {
        totalChildren: activeYP.length,
        avgCompositeScore: avgComposite,
        greenCount,
        amberCount,
        redCount,
        overallSignal,
        childProfiles,
        insights,
        regulatoryNote:
          "Children Act 1989 s22; Children and Young Persons Act 2008 s1. Wellbeing signals are derived from key work records, outcome targets, incident history and missing episodes. They supplement, not replace, direct professional observation.",
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to compute child wellbeing index" }, { status: 500 });
  }
}
