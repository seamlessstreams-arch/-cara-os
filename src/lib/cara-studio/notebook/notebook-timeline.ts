// ══════════════════════════════════════════════════════════════════════════════
// CARA STUDIO NOTEBOOK — relational timeline (live-safe wrapper)
//
// Reuses the pure buildRelationalTimeline projection, fed from a child's
// LIVE-SAFE record spine. The store-only collections it can also read
// (debriefs, family time, return interviews, achievements) are not live-safe
// yet, so they are passed EMPTY — the timeline is honest about the sources it
// has rather than throwing or inventing moments. As each of those collections
// is made live-safe, add it here; the engine already projects it.
// ══════════════════════════════════════════════════════════════════════════════

import { buildRelationalTimeline, type RelationalTimeline } from "@/lib/relational-timeline/relational-timeline-engine";
import type { KeyWorkingSession, MissingEpisode, EducationRecord, LACReview } from "@/types/extended";
import type { Incident } from "@/types";

export interface NotebookTimelineInput {
  childId: string;
  childName: string;
  now: string;
  keyWorkingSessions: KeyWorkingSession[];
  incidents: Incident[];
  missingEpisodes: MissingEpisode[];
  educationRecords: EducationRecord[];
  lacReviews: LACReview[];
  trustedAdults?: string[];
  staffName: (id: string) => string;
}

export function buildNotebookTimeline(input: NotebookTimelineInput): RelationalTimeline {
  return buildRelationalTimeline({
    childId: input.childId,
    childName: input.childName,
    now: input.now,
    keyWorkingSessions: input.keyWorkingSessions,
    incidents: input.incidents,
    missingEpisodes: input.missingEpisodes,
    educationRecords: input.educationRecords,
    lacReviews: input.lacReviews,
    // Not live-safe yet (store-only passthroughs) — empty, not invented.
    debriefRecords: [],
    familyTimeSessions: [],
    returnInterviews: [],
    positiveAchievements: [],
    trustedAdults: input.trustedAdults ?? [],
    staffName: input.staffName,
  });
}
