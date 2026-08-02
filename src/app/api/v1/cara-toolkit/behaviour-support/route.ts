import { NextResponse } from "next/server";
import { dal } from "@/lib/db";
import type {
  BehaviourTrigger,
  BehaviourStrategy,
  ChildBehaviourProfile,
  BehaviourSupportAnalysis,
  SignalColour,
} from "@/lib/cara-visual-toolkit/types";

export const dynamic = "force-dynamic";

function initials(youngPeople: any[], childId: string): string {
  const yp = youngPeople.find((y: any) => y.id === childId);
  if (!yp) return "?";
  const f = ((yp.first_name || yp.preferred_name || "?")[0] ?? "?").toUpperCase();
  const l = ((yp.last_name || "?")[0] ?? "?").toUpperCase();
  return `${f}.${l}.`;
}

function topN<T extends { count: number }>(arr: T[], n = 5): T[] {
  return arr.sort((a, b) => b.count - a.count).slice(0, n);
}

export async function GET() {
  const [behaviourLogList, incidentsList, youngPeopleList] = await Promise.all([
      dal.behaviourLog.findAll(),
      dal.incidents.findAll(),
      dal.youngPeople.findAll(),
    ]);
  const behaviourLog = (behaviourLogList as any[]) ?? [];
  const incidents = (incidentsList as any[]) ?? [];
  const youngPeople = (youngPeopleList as any[]) ?? [];

  // Global trigger counts
  const triggerMap = new Map<string, number>();
  for (const entry of behaviourLog) {
    const t = (entry.trigger ?? "").trim();
    if (t) triggerMap.set(t, (triggerMap.get(t) ?? 0) + 1);
  }
  const topTriggers: BehaviourTrigger[] = topN(
    Array.from(triggerMap.entries()).map(([trigger, count]) => ({ trigger, count }))
  );

  // Global strategy counts + effectiveness
  const strategyMap = new Map<string, { count: number; positive: number }>();
  for (const entry of behaviourLog) {
    const s = (entry.strategy_used ?? "").trim();
    if (s) {
      const existing = strategyMap.get(s) ?? { count: 0, positive: 0 };
      existing.count++;
      const outcome = (entry.outcome ?? "").toLowerCase();
      if (outcome.includes("positive") || outcome.includes("calm") || outcome.includes("de-escalat") || outcome.includes("resolved")) {
        existing.positive++;
      }
      strategyMap.set(s, existing);
    }
  }
  const topStrategies: BehaviourStrategy[] = topN(
    Array.from(strategyMap.entries()).map(([strategy, data]) => ({
      strategy,
      count: data.count,
      positiveOutcomes: data.positive,
      effectivenessRate: data.count > 0 ? Math.round((data.positive / data.count) * 100) : null,
    }))
  );

  // Per-child profiles
  const childIds = Array.from(new Set(behaviourLog.map((e: any) => e.child_id).filter(Boolean)));

  const childProfiles: ChildBehaviourProfile[] = childIds.map((childId) => {
    const childEntries = behaviourLog.filter((e: any) => e.child_id === childId);
    const highIntensity = childEntries.filter(
      (e: any) => e.intensity === "high" || e.intensity === "severe"
    ).length;
    const linkedIncidents = incidents.filter(
      (i: any) => i.child_id === childId
    ).length;

    const childTriggers = new Map<string, number>();
    const childStrategies = new Map<string, { count: number; positive: number }>();
    for (const e of childEntries) {
      const t = (e.trigger ?? "").trim();
      if (t) childTriggers.set(t, (childTriggers.get(t) ?? 0) + 1);
      const s = (e.strategy_used ?? "").trim();
      if (s) {
        const ex = childStrategies.get(s) ?? { count: 0, positive: 0 };
        ex.count++;
        const out = (e.outcome ?? "").toLowerCase();
        if (out.includes("positive") || out.includes("calm") || out.includes("de-escalat") || out.includes("resolved")) ex.positive++;
        childStrategies.set(s, ex);
      }
    }

    const sorted = childEntries
      .map((e: any) => e.date ?? "")
      .filter(Boolean)
      .sort()
      .reverse();

    const signal: SignalColour =
      highIntensity >= 3
        ? "red"
        : highIntensity >= 1 || linkedIncidents >= 2
        ? "amber"
        : "green";

    return {
      childId,
      childInitials: initials(youngPeople, childId),
      totalEntries: childEntries.length,
      highIntensityCount: highIntensity,
      topTriggers: topN(
        Array.from(childTriggers.entries()).map(([trigger, count]) => ({
          trigger,
          count,
        })),
        3
      ),
      topStrategies: topN(
        Array.from(childStrategies.entries()).map(([strategy, data]) => ({
          strategy,
          count: data.count,
          positiveOutcomes: data.positive,
          effectivenessRate: data.count > 0 ? Math.round((data.positive / data.count) * 100) : null,
        })),
        3
      ),
      linkedIncidents,
      mostRecentEntry: sorted[0] ?? null,
      signal,
    } satisfies ChildBehaviourProfile;
  });

  const highIntensityTotal = behaviourLog.filter(
    (e: any) => e.intensity === "high" || e.intensity === "severe"
  ).length;

  const insights: string[] = [];
  const highIntensityProfiles = childProfiles.filter((p) => p.signal === "red");
  if (highIntensityProfiles.length > 0) {
    insights.push(
      `${highIntensityProfiles.length} child${highIntensityProfiles.length > 1 ? "ren" : ""} ${highIntensityProfiles.length > 1 ? "show" : "shows"} a pattern of high-intensity behaviour. Review whether their behaviour support plans reflect current understanding of triggers and communication.`
    );
  }
  if (topStrategies.length > 0 && (topStrategies[0].effectivenessRate ?? 0) < 50) {
    insights.push(
      `The most frequently used strategy — "${topStrategies[0].strategy}" — has a ${topStrategies[0].effectivenessRate}% positive outcome rate. Reflective supervision may help the team consider alternative approaches.`
    );
  }
  if (topTriggers.length > 0) {
    insights.push(
      `The most common trigger across all children is "${topTriggers[0].trigger}" (${topTriggers[0].count} instances). Consider whether environmental or structural adjustments can reduce this trigger.`
    );
  }
  const highEffective = topStrategies.filter((s) => (s.effectivenessRate ?? 0) >= 75);
  if (highEffective.length > 0) {
    insights.push(
      `${highEffective.map((s) => `"${s.strategy}"`).join(", ")} ${highEffective.length > 1 ? "are showing" : "is showing"} strong positive outcomes — share learning across the team through reflective supervision.`
    );
  }

  const overallSignal: SignalColour =
    childProfiles.filter((p) => p.signal === "red").length >= 2
      ? "red"
      : highIntensityTotal >= 5 || childProfiles.some((p) => p.signal === "red")
      ? "amber"
      : behaviourLog.length === 0
      ? "grey"
      : "green";

  const result: BehaviourSupportAnalysis = {
    totalEntries: behaviourLog.length,
    highIntensityEntries: highIntensityTotal,
    topTriggers,
    topStrategies,
    childProfiles: childProfiles.sort((a, b) => b.highIntensityCount - a.highIntensityCount),
    insights,
    overallSignal,
    regulatoryNote:
      "CHR 2015 Reg 7 and Reg 20 (support for children). Behaviour must be understood as communication of unmet need. Behaviour support plans must be individualised, trauma-informed, and regularly reviewed with the child and their network.",
  };

  return NextResponse.json({ data: result });
}
