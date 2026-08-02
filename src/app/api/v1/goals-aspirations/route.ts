import { NextResponse } from "next/server";
import { dal } from "@/lib/db";
import { OUTCOME_DOMAIN_LABELS } from "@/types/extended";

export async function GET() {
  try {
    const [keyWorkingSessionsList, outcomeTargetsList, youngPeopleList] = await Promise.all([
      dal.keyWorkingSessions.findAll(),
      dal.outcomeTargets.findAll(),
      dal.youngPeople.findAll(),
    ]);
    const today = new Date().toISOString().split("T")[0];

    const youngPeople = (youngPeopleList as any[]) ?? [];
    const outcomeTargets = (outcomeTargetsList as any[]) ?? [];
    const keyWorkingSessions = (keyWorkingSessionsList as any[]) ?? [];

    const activeYP = youngPeople.filter((yp) => yp.status === "current");

    // Build per-child voice records
    const childVoiceProfiles = activeYP.map((yp) => {
      const id = yp.id as string;
      const displayName = (yp.preferred_name ?? yp.first_name) as string;

      // Voice from outcome targets
      const targetVoices = outcomeTargets
        .filter((t) => t.child_id === id && t.yp_voice && (t.yp_voice as string).trim().length > 0)
        .map((t) => ({
          source: "outcome_target" as const,
          date: (t.set_date ?? today) as string,
          domain: (t.domain as string) ?? null,
          domainLabel: t.domain
            ? ((OUTCOME_DOMAIN_LABELS as Record<string, string>)[t.domain as string] ?? (t.domain as string))
            : null,
          text: (t.yp_voice as string).trim(),
          targetDescription: (t.target_description as string) ?? null,
        }));

      // Voice from key working sessions
      const kwVoices = keyWorkingSessions
        .filter(
          (s) =>
            s.child_id === id &&
            s.child_voice &&
            (s.child_voice as string).trim().length > 10
        )
        .map((s) => ({
          source: "key_work" as const,
          date: (s.date ?? today) as string,
          domain: null as string | null,
          domainLabel: null as string | null,
          text: (s.child_voice as string).trim(),
          targetDescription: null as string | null,
        }));

      const allVoices = [...targetVoices, ...kwVoices].sort((a, b) => b.date.localeCompare(a.date));

      // Most recent voice
      const mostRecentVoice = allVoices[0] ?? null;

      // Domain coverage from targets
      const coveredDomains = new Set(targetVoices.map((v) => v.domain).filter(Boolean) as string[]);
      const allDomains = new Set(
        outcomeTargets.filter((t) => t.child_id === id && t.status === "active").map((t) => t.domain as string)
      );
      const domainsMissingVoice = [...allDomains].filter((d) => !coveredDomains.has(d));

      return {
        childId: id,
        childName: displayName,
        totalVoices: allVoices.length,
        targetVoiceCount: targetVoices.length,
        kwVoiceCount: kwVoices.length,
        hasVoice: allVoices.length > 0,
        allVoices: allVoices.slice(0, 6), // cap for display
        mostRecentVoice,
        domainsMissingVoice,
        coveredDomainCount: coveredDomains.size,
        totalDomainCount: allDomains.size,
      };
    });

    const totalVoices = childVoiceProfiles.reduce((s, c) => s + c.totalVoices, 0);
    const childrenWithVoice = childVoiceProfiles.filter((c) => c.hasVoice).length;
    const childrenWithoutVoice = childVoiceProfiles.filter((c) => !c.hasVoice);

    // Recent voices across all children (most recent 8)
    const recentVoices = childVoiceProfiles
      .flatMap((cp) =>
        cp.allVoices.map((v) => ({ ...v, childName: cp.childName, childId: cp.childId }))
      )
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 8);

    // Signal
    let overallSignal: "green" | "amber" | "red" | "grey" = "grey";
    if (activeYP.length === 0) overallSignal = "grey";
    else if (childrenWithVoice === 0) overallSignal = "red";
    else if (childrenWithoutVoice.length > 0 || totalVoices < activeYP.length * 2) overallSignal = "amber";
    else overallSignal = "green";

    // Insights
    const insights: string[] = [];
    if (childrenWithoutVoice.length > 0) {
      const names = childrenWithoutVoice.map((c) => c.childName).join(", ");
      insights.push(
        `No voice has been recorded for ${names}. Under Article 12 of the UNCRC, every child has the right to express their views on matters affecting them. This should be addressed at the next key work session.`
      );
    }
    if (totalVoices > 0 && childrenWithVoice < activeYP.length) {
      insights.push(
        `Voice has been recorded for ${childrenWithVoice} of ${activeYP.length} children. Capturing voice in outcome targets makes care plans child-centred and strengthens evidence for LAC reviews.`
      );
    }
    if (totalVoices > 0) {
      const kwVoiceTotal = childVoiceProfiles.reduce((s, c) => s + c.kwVoiceCount, 0);
      const targetVoiceTotal = childVoiceProfiles.reduce((s, c) => s + c.targetVoiceCount, 0);
      if (kwVoiceTotal > targetVoiceTotal * 2) {
        insights.push(
          `Most voice is captured in key work sessions rather than in outcome targets. Transferring relevant voice quotes to outcome targets strengthens the evidential record for reviews.`
        );
      }
    }

    return NextResponse.json({
      data: {
        totalChildren: activeYP.length,
        childrenWithVoice,
        childrenWithoutVoice: childrenWithoutVoice.length,
        totalVoices,
        overallSignal,
        childVoiceProfiles,
        recentVoices,
        insights,
        regulatoryNote:
          "UN Convention on the Rights of the Child (1989), Article 12. Children Act 1989 s22(4). Care Planning Regulations 2010. Children must be involved in all decisions about their care — their views should be actively sought, recorded, and evidenced.",
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to compute goals and aspirations data" }, { status: 500 });
  }
}
