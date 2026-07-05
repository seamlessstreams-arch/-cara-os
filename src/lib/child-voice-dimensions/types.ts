// ══════════════════════════════════════════════════════════════════════════════
// CARA — CHILD VOICE INTELLIGENCE: DIMENSIONS & TRENDS (types)
//
// Per-child reads of HOW WELL the child's voice is being heard and acted on,
// across the records that already hold it. Two honest kinds of dimension:
//
//   • child_expressed — what the CHILD themselves said (their own sentiment on
//     feeling safe / being listened to). Cara reports it; it never infers it.
//   • practice — how well the SETTING captures and acts on that voice (recording
//     breadth, feedback-loop closure, advocacy access). These are about the
//     home's practice, never a judgement of the child.
//
// Everything is deterministic, source-cited, and honest about "insufficient
// data" / "not asked". Cara does NOT measure how a child feels inside — it
// surfaces what the records show and prompts the adults to ask the child.
// ══════════════════════════════════════════════════════════════════════════════

export const VOICE_DIMENSIONS_VERSION = "1.0.0";

export type VoiceDimensionKey =
  | "feeling_safe" // child_expressed — CHR 2015 Reg 12 / the child's own words
  | "feeling_listened_to" // child_expressed — UN CRC Article 12
  | "expressed_sentiment" // child_expressed — overall, across all feedback
  | "voice_captured" // practice — is the voice being recorded, and how widely
  | "voice_influence" // practice — is it acted on / are loops closed
  | "advocacy_access"; // practice — independent advocacy in place

export type VoiceDimensionKind = "child_expressed" | "practice";

export type VoiceTrend = "improving" | "steady" | "declining" | "insufficient_data";

/**
 * A critical-friend status. It is NEVER a red judgement of the child — for
 * child_expressed dimensions it describes what the child told us; for practice
 * dimensions it describes how the setting is doing.
 */
export type VoiceDimensionStatus =
  | "strong"
  | "developing"
  | "needs_attention"
  | "not_asked" // child_expressed only — the child has not been asked in-window
  | "insufficient_data";

export interface VoiceEvidenceRef {
  recordType: string;
  recordId: string;
}

export interface VoiceDimension {
  key: VoiceDimensionKey;
  label: string;
  kind: VoiceDimensionKind;
  /** 0–100, or null when there is not enough data to score honestly. */
  score: number | null;
  status: VoiceDimensionStatus;
  trend: VoiceTrend;
  /** How many contributing records fell in the recent vs prior window. */
  recentCount: number;
  priorCount: number;
  /** A plain-language, non-clinical line — always safe to show the child. */
  note: string;
  sources: VoiceEvidenceRef[];
}

export type VoiceHighlightSeverity = "priority" | "watch" | "strength";

export interface VoiceHighlight {
  id: string;
  severity: VoiceHighlightSeverity;
  title: string;
  detail: string;
  /** Which dimensions drove this highlight (for the UI to link back). */
  dimensions: VoiceDimensionKey[];
  sources: VoiceEvidenceRef[];
}

export interface ChildVoiceDimensionProfile {
  childId: string;
  childName: string;
  /** ISO date the profile was computed for (window anchor). */
  asOf: string;
  windowDays: number;
  dimensions: VoiceDimension[];
  highlights: VoiceHighlight[];
  /** True only when at least one dimension could be scored. */
  hasData: boolean;
  regulatoryLinks: string[];
  disclaimer: string;
  engineVersion: string;
}

// ── Input snapshots — the route reads the store; the engine stays pure ────────

export interface VoiceFeedbackInput {
  id: string;
  child_id: string;
  date: string;
  category: string; // YPFeedbackCategory (feeling_safe, being_listened_to, …)
  sentiment: string; // very_happy | happy | ok | unhappy | very_unhappy
  response_given_to_child: boolean;
  child_satisfied: boolean | null;
}

export interface VoiceKeyWorkInput {
  id: string;
  child_id: string;
  date: string;
  child_voice: string; // free text — non-empty means voice was captured
}

export interface VoiceLacReviewInput {
  id: string;
  child_id: string;
  date: string;
  child_participation: string; // attended | views_submitted | advocate_attended | did_not_participate
  child_views: string;
}

export interface VoiceFeedbackLoopInput {
  id: string;
  child_id: string;
  feedback_date: string;
  child_words: string;
  decision_made: string; // acted_on_in_full | acted_on_in_part | discussed_and_explored | cannot_do_explained | pending_consideration
  child_accepts: boolean;
}

export interface VoiceAdvocacyInput {
  id: string;
  child_id: string;
  status: string; // active | closed | …
  referral_date: string;
  visits: Array<{ date?: string }>;
  home_response: string;
}

export interface VoiceHouseMeetingInput {
  id: string;
  date: string;
  child_feedback: string[];
}

export interface ChildVoiceDimensionInput {
  childId: string;
  childName: string;
  /** Window anchor ("today"), injected so the engine stays pure/testable. */
  asOf: string;
  /** Sliding window; default 90 days. Recent = latest half, prior = older half. */
  windowDays?: number;
  feedback: VoiceFeedbackInput[];
  keyWork: VoiceKeyWorkInput[];
  lacReviews: VoiceLacReviewInput[];
  feedbackLoops: VoiceFeedbackLoopInput[];
  advocacy: VoiceAdvocacyInput[];
  houseMeetings: VoiceHouseMeetingInput[];
}
