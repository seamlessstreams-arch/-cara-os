import { NextResponse } from "next/server";
import { dal } from "@/lib/db/dal";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function safeList(p: Promise<any[]>): Promise<any[]> {
  try {
    const r = await p;
    return Array.isArray(r) ? r : [];
  } catch {
    return [];
  }
}

export async function GET() {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenStr = sevenDaysAgo.toISOString().split("T")[0];

    const [youngPeople, handovers] = await Promise.all([
      safeList(dal.youngPeople.findAll()),
      safeList(dal.handovers.findAll()),
    ]);

    const activeYP = youngPeople.filter((yp) => yp.status === "current");
    const recentHandovers = handovers.filter((h) => (h.shift_date as string) >= sevenStr);

    const totalHandovers = recentHandovers.length;
    const completedHandovers = recentHandovers.filter((h) => h.completed_at !== null).length;
    const unsignedHandovers = recentHandovers.filter(
      (h) => h.completed_at !== null && (!h.sign_offs || (h.sign_offs as any[]).length === 0)
    ).length;
    const handoversWithFlags = recentHandovers.filter((h) => (h.flags as string[])?.length > 0).length;
    const handoversWithIncidents = recentHandovers.filter(
      (h) => (h.linked_incident_ids as string[])?.length > 0
    ).length;
    const completionRate = totalHandovers > 0 ? Math.round((completedHandovers / totalHandovers) * 100) : null;

    // Flag frequency analysis
    const flagCounts = new Map<string, number>();
    for (const h of recentHandovers) {
      for (const flag of (h.flags as string[]) ?? []) {
        flagCounts.set(flag, (flagCounts.get(flag) ?? 0) + 1);
      }
    }
    const topFlags = Array.from(flagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([flag, count]) => ({
        flag: flag.replace(/_/g, " "),
        count,
        formattedFlag: flag
          .split("_")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" "),
      }));

    // Per-child handover alert summary
    const childAlertMap = new Map<string, { alerts: string[]; moodScores: number[]; name: string }>();
    for (const yp of activeYP) {
      childAlertMap.set(yp.id as string, {
        alerts: [],
        moodScores: [],
        name: (yp.preferred_name ?? yp.first_name) as string,
      });
    }
    for (const h of recentHandovers) {
      for (const update of (h.child_updates as any[]) ?? []) {
        const entry = childAlertMap.get(update.child_id as string);
        if (!entry) continue;
        entry.alerts.push(...((update.alerts as string[]) ?? []));
        if (update.mood_score !== null && update.mood_score !== undefined) {
          entry.moodScores.push(update.mood_score as number);
        }
      }
    }
    const childProfiles = Array.from(childAlertMap.entries()).map(([childId, data]) => {
      const avgMood =
        data.moodScores.length > 0
          ? Math.round((data.moodScores.reduce((s, m) => s + m, 0) / data.moodScores.length) * 10) / 10
          : null;
      const deduped = [...new Set(data.alerts)];
      let signal: "green" | "amber" | "red" | "grey" = "grey";
      if (data.moodScores.length === 0) signal = "grey";
      else if (deduped.length >= 3 || (avgMood !== null && avgMood < 4)) signal = "red";
      else if (deduped.length > 0 || (avgMood !== null && avgMood < 6)) signal = "amber";
      else signal = "green";

      return {
        childId,
        childName: data.name,
        alertCount: deduped.length,
        topAlerts: deduped.slice(0, 3),
        avgMoodScore: avgMood,
        handoverCount: data.moodScores.length,
        signal,
      };
    });

    // Recent handover summaries (for display)
    const recentSummaries = recentHandovers
      .slice()
      .sort((a, b) =>
        ((b.shift_date as string) + (b.handover_time as string)).localeCompare(
          (a.shift_date as string) + (a.handover_time as string)
        )
      )
      .slice(0, 5)
      .map((h) => ({
        id: h.id as string,
        date: h.shift_date as string,
        time: h.handover_time as string,
        from: h.shift_from as string,
        to: h.shift_to as string,
        completed: h.completed_at !== null,
        flagCount: (h.flags as string[])?.length ?? 0,
        signOffCount: (h.sign_offs as any[])?.length ?? 0,
        linkedIncidents: (h.linked_incident_ids as string[])?.length ?? 0,
        generalNotes: (h.general_notes as string)?.slice(0, 80) ?? null,
      }));

    // Insights
    const insights: string[] = [];
    if (unsignedHandovers > 0) {
      insights.push(
        `${unsignedHandovers} completed handover${unsignedHandovers === 1 ? "" : "s"} ${unsignedHandovers === 1 ? "has" : "have"} not been signed off by incoming staff. Sign-off confirms information has been received and understood.`
      );
    }
    if (handoversWithFlags > 0) {
      const flagRate = Math.round((handoversWithFlags / totalHandovers) * 100);
      insights.push(
        `${flagRate}% of handovers contain operational flags. Review whether recurring flags are being actioned and closed, or are remaining open across shifts.`
      );
    }
    const incompleteHandovers = totalHandovers - completedHandovers;
    if (incompleteHandovers > 0) {
      insights.push(
        `${incompleteHandovers} handover${incompleteHandovers === 1 ? "" : "s"} recorded but not completed. Incomplete handovers create gaps in shift-to-shift communication and are a safeguarding concern.`
      );
    }

    let overallSignal: "green" | "amber" | "red" | "grey" = "grey";
    if (totalHandovers === 0) overallSignal = "grey";
    else if (incompleteHandovers > 0 || unsignedHandovers > totalHandovers * 0.5) overallSignal = "red";
    else if (unsignedHandovers > 0 || handoversWithFlags > totalHandovers * 0.5) overallSignal = "amber";
    else overallSignal = "green";

    return NextResponse.json({
      data: {
        totalHandovers,
        completedHandovers,
        completionRate,
        unsignedHandovers,
        handoversWithFlags,
        handoversWithIncidents,
        topFlags,
        childProfiles,
        recentSummaries,
        insights,
        overallSignal,
        regulatoryNote:
          "Children's Homes Regulations 2015, Reg 12 (records). A thorough handover process is essential for continuity of care, risk management, and safeguarding. Every handover should be completed, signed off by incoming staff, and retained as a record.",
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to compute handover quality data" }, { status: 500 });
  }
}
