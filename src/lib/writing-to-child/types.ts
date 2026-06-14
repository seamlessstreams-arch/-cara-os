// ═══════════════════════════════════════════════════════════════════════════
// CARA — WRITING TO THE CHILD  ·  types
//
// Child-readable recording intelligence. Helps staff write records that are
// evidence for professionals AND memory for the child: trauma-informed,
// rights-based, anti-oppressive, emotionally safe and safeguarding-clear.
//
// Hard contract: Cara ADVISES — it never invents facts, never adds emotional
// meaning as fact, never minimises risk, and never replaces the practitioner's
// judgement. Every rewrite is a suggestion for human review before recording.
// ═══════════════════════════════════════════════════════════════════════════

export type WritingRecordType =
  | "daily_log"
  | "incident"
  | "missing_episode"
  | "key_work"
  | "manager_oversight"
  | "room_search"
  | "education"
  | "family_time"
  | "health"
  | "medication"
  | "exploitation"
  | "risk_assessment"
  | "professional_meeting";

export type WritingTone = "warm" | "clear" | "formal" | "child_readable" | "professional";

export interface WritingToChildInput {
  recordType: WritingRecordType;
  rawText: string;
  childAge?: number;
  /** e.g. ["non-verbal", "EAL", "learning disability", "uses Makaton"] */
  childCommunicationNeeds?: string[];
  /** Facts the practitioner has confirmed — used to avoid inventing detail. */
  knownFacts?: string[];
  /** Verbatim things the child said — surfaced as the child's own voice. */
  childDirectQuotes?: string[];
  practitionerConcern?: string;
  desiredTone?: WritingTone;
  /** Child's preferred name / words (e.g. "Mum", "my brother") — never assumed. */
  childPreferredName?: string;
}

/** A single 0–100 dimension check with explainable feedback. */
export interface DimensionCheck {
  score: number;
  feedback: string[];
}

/** A flagged word/phrase, why it's a concern, and a careful alternative. */
export interface FlaggedTerm {
  term: string;
  reason: string;
  suggestedAlternative: string;
}

/** The transparent per-dimension score contributions (sum = overallScore). */
export interface ScoreBreakdown {
  childVoice: number;        // /15
  factualClarity: number;    // /15
  safeguardingClarity: number; // /15
  traumaInformed: number;    // /15
  dignityAndLanguage: number;  // /15
  adultAccountability: number; // /10
  futureReaderValue: number;   // /10
  nextSteps: number;         // /5
}

export interface WritingToChildReview {
  overallScore: number;
  summary: string;
  strengths: string[];
  concerns: string[];
  flaggedLanguage: FlaggedTerm[];
  reflectiveQuestions: string[];
  /** Labelled "Suggested child-conscious wording for practitioner review." */
  childReadableSuggestion: string;
  professionalRecordingSuggestion: string;
  safeguardingClarityNotes: string[];
  /** What information is missing — Cara names gaps rather than inventing detail. */
  missingInformation: string[];
  futureReaderCheck: DimensionCheck;
  adultAccountabilityCheck: DimensionCheck;
  childVoiceCheck: DimensionCheck;
  riskClarityCheck: DimensionCheck;
  scoreBreakdown: ScoreBreakdown;
  generatedBy: "deterministic" | "ai";
  /** The standing reminder that the practitioner owns the final record. */
  disclaimer: string;
}
