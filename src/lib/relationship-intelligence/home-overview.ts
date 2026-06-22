// ─────────────────────────────────────────────────────────────────────────────
// Home Relationship Overview
//
// The per-child cockpit, lifted to the whole home. For a manager or RI: every
// child's relational status, direction of travel and emotional-safety status on
// one screen, ranked by who needs us most — so relational attention goes where
// it's needed before it becomes a crisis. A pure projection that reuses the two
// deterministic engines per child; no new data, no LLM.
// ─────────────────────────────────────────────────────────────────────────────

import {
  buildRelationalTimeline,
  type RelationalTimelineInput,
  type RelationalStatus,
} from "@/lib/relational-timeline/relational-timeline-engine";
import {
  buildEmotionalSafetyAnalysis,
  type EmotionalSafetyInput,
  type EmotionalSafetyStatus,
} from "@/lib/emotional-safety/emotional-safety-engine";

export interface HomeOverviewChild {
  childId: string;
  childName: string;
  trustedAdults: string[];
  knownTriggers: string[];
  calmingApproaches: string[];
}

/** The shared store collections — each engine filters them by child internally. */
export interface HomeOverviewInput {
  children: HomeOverviewChild[];
  now: string;
  staffName: (id: string) => string;
  keyWorkingSessions: RelationalTimelineInput["keyWorkingSessions"];
  debriefRecords: RelationalTimelineInput["debriefRecords"];
  incidents: RelationalTimelineInput["incidents"];
  familyTimeSessions: RelationalTimelineInput["familyTimeSessions"];
  missingEpisodes: RelationalTimelineInput["missingEpisodes"];
  returnInterviews: RelationalTimelineInput["returnInterviews"];
  positiveAchievements: RelationalTimelineInput["positiveAchievements"];
  educationRecords: RelationalTimelineInput["educationRecords"];
  lacReviews: RelationalTimelineInput["lacReviews"];
  behaviourLog: EmotionalSafetyInput["behaviourLog"];
}

export interface ChildRelationshipSummary {
  childId: string;
  childName: string;
  relStatus: RelationalStatus;
  relDirection: "improving" | "stable" | "declining";
  esStatus: EmotionalSafetyStatus;
  trustedAdultCount: number;
  /** The single most pressing gap for this child, if any. */
  topGap: string | null;
  /** 0–6 priority — higher = needs us more. Drives the ranking. */
  priority: number;
}

export interface HomeRelationshipOverview {
  generatedAt: string;
  counts: {
    relationships: Record<RelationalStatus, number>;
    emotionalSafety: Record<EmotionalSafetyStatus, number>;
  };
  /** Children sorted by who needs us most (highest priority first). */
  children: ChildRelationshipSummary[];
  /** Plain-English headline for the home. */
  headline: string;
}

const REL_WEIGHT: Record<RelationalStatus, number> = { fragile: 3, developing: 1, secure: 0 };
const ES_WEIGHT: Record<EmotionalSafetyStatus, number> = { concern: 3, watch: 1, secure: 0 };

export function buildHomeRelationshipOverview(input: HomeOverviewInput): HomeRelationshipOverview {
  const counts = {
    relationships: { secure: 0, developing: 0, fragile: 0 } as Record<RelationalStatus, number>,
    emotionalSafety: { secure: 0, watch: 0, concern: 0 } as Record<EmotionalSafetyStatus, number>,
  };

  const children: ChildRelationshipSummary[] = input.children.map((c) => {
    const rel = buildRelationalTimeline({
      childId: c.childId,
      childName: c.childName,
      now: input.now,
      keyWorkingSessions: input.keyWorkingSessions,
      debriefRecords: input.debriefRecords,
      incidents: input.incidents,
      familyTimeSessions: input.familyTimeSessions,
      missingEpisodes: input.missingEpisodes,
      returnInterviews: input.returnInterviews,
      positiveAchievements: input.positiveAchievements,
      educationRecords: input.educationRecords,
      lacReviews: input.lacReviews,
      trustedAdults: c.trustedAdults,
      staffName: input.staffName,
    });
    const es = buildEmotionalSafetyAnalysis({
      childId: c.childId,
      childName: c.childName,
      now: input.now,
      behaviourLog: input.behaviourLog,
      incidents: input.incidents,
      keyWorkingSessions: input.keyWorkingSessions,
      knownTriggers: c.knownTriggers,
      calmingApproaches: c.calmingApproaches,
    });

    counts.relationships[rel.stability.status] += 1;
    counts.emotionalSafety[es.status] += 1;

    const gap =
      rel.insights.find((i) => i.tone === "gap") ?? es.insights.find((i) => i.tone === "gap");

    return {
      childId: c.childId,
      childName: c.childName,
      relStatus: rel.stability.status,
      relDirection: rel.trend.direction,
      esStatus: es.status,
      trustedAdultCount: rel.stability.trustedAdults.length,
      topGap: gap?.text ?? null,
      priority:
        REL_WEIGHT[rel.stability.status] +
        ES_WEIGHT[es.status] +
        (rel.trend.direction === "declining" ? 1 : 0),
    };
  });

  // Who needs us most, first. Stable tiebreak on name.
  children.sort((a, b) => b.priority - a.priority || a.childName.localeCompare(b.childName));

  const needing = children.filter((c) => c.priority >= 3).length;
  const headline =
    children.length === 0
      ? "No children to show."
      : needing === 0
        ? "Relationships across the home look settled — protect what's working."
        : `${needing} ${needing === 1 ? "child needs" : "children need"} relational or emotional support — see the priority list below.`;

  return { generatedAt: input.now, counts, children, headline };
}
