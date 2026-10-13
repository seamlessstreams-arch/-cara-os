// ══════════════════════════════════════════════════════════════════════════════
// CARA STUDIO NOTEBOOK — outcomes & evidence (live-safe wrapper)
//
// Reuses the pure buildOutcomeIntelligence engine — the per-child SCCIF outcome
// areas (safety, education, wellbeing, relationships, voice) with status,
// direction and evidence. This is the child-level evidence that underpins Reg 44
// and inspection; it never predicts a grade and never shows a false red.
//
// The engine is a pure projection over records passed in, so it is fed the
// child's LIVE-SAFE spine; the store-only collections (achievements, family
// time, return interviews) are passed EMPTY — honest, never invented.
// ══════════════════════════════════════════════════════════════════════════════

import { buildOutcomeIntelligence, type OutcomeIntelligence } from "@/lib/outcome-intelligence/outcome-intelligence-engine";
import type { KeyWorkingSession, MissingEpisode, EducationRecord, LACReview } from "@/types/extended";
import type { Incident } from "@/types";

export interface NotebookOutcomesInput {
  childId: string;
  childName: string;
  now: string;
  keyWorkingSessions: KeyWorkingSession[];
  incidents: Incident[];
  missingEpisodes: MissingEpisode[];
  educationRecords: EducationRecord[];
  lacReviews: LACReview[];
  trustedAdults?: string[];
}

export function buildNotebookOutcomes(input: NotebookOutcomesInput): OutcomeIntelligence {
  return buildOutcomeIntelligence({
    childId: input.childId,
    childName: input.childName,
    now: input.now,
    keyWorkingSessions: input.keyWorkingSessions,
    incidents: input.incidents,
    missingEpisodes: input.missingEpisodes,
    educationRecords: input.educationRecords,
    lacReviews: input.lacReviews,
    // Not live-safe yet (store-only passthroughs) — empty, not invented.
    positiveAchievements: [],
    familyTimeSessions: [],
    returnInterviews: [],
    trustedAdults: input.trustedAdults ?? [],
  });
}
