// ══════════════════════════════════════════════════════════════════════════════
// CARA — CPIE · Child-360 whole-child spine
//
// Consolidation (the platform-integration rule): the Child-360 view is CARA's
// whole-child page, but it computes its own reads. This distils the canonical
// Digital Twin into the compact "who is this child" spine the 360 view leads
// with — so identity, lived experience and curiosity come from the SAME
// deterministic layer everything else reads, not a parallel derivation.
//
// Pure: twin in → spine out. No store, no LLM.
// ══════════════════════════════════════════════════════════════════════════════

import type { ChildTwin } from "./types";

export interface Cpie360Spine {
  who: string; // interests / a defining strength — the person, first
  strengths: string[];
  directionOfTravel: string; // improving | stable | declining
  relationalStatus: string; // secure | developing | fragile
  emotionalStatus: string; // secure | watch | concern
  livedExperienceRead: string; // does life here feel like a childhood?
  childVoice?: string; // the child's own recent words
  curiosityPrompt?: string; // one reflective question worth sitting with
  engineVersion: string;
}

export function buildCpie360Spine(twin: ChildTwin): Cpie360Spine {
  return {
    who: twin.identity.data.interests.slice(0, 4).join(", ") || twin.strengths.data.strengths[0] || "—",
    strengths: twin.strengths.data.strengths.slice(0, 3),
    directionOfTravel: twin.progress.data.trajectory ?? "not yet readable",
    relationalStatus: twin.relationships.data.relationalStatus ?? "developing",
    emotionalStatus: twin.emotional.data.status ?? "unknown",
    livedExperienceRead: twin.goodParenting.data.livedExperienceRead,
    childVoice: twin.voice.data.recentQuotes[0]?.quote,
    curiosityPrompt: twin.curiosity.data.reflectiveQuestions[0],
    engineVersion: twin.engineVersion,
  };
}
