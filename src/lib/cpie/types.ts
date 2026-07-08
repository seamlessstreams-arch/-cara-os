// ══════════════════════════════════════════════════════════════════════════════
// CARA — CORE CHILD PROGRESS INTELLIGENCE ENGINE (CPIE) · types
//
// The Digital Twin: CARA's living, deterministic understanding of every child —
// the single source of truth every feature queries instead of re-reading raw
// records. NOT a report, NOT an AI summary: a structured, evidence-linked,
// confidence-scored profile that evolves as records are added.
//
// Philosophy (the spec's own words): no child is ever defined solely by
// incidents, behaviours or risk — the twin holds their whole lived experience:
// identity, strengths, aspirations, relationships, memories, progress, voice.
// Significance over frequency: one meaningful conversation may outweigh twenty
// routine observations. Missing information and contradictions are first-class
// intelligence, flagged rather than papered over.
// ══════════════════════════════════════════════════════════════════════════════

export const CPIE_VERSION = "1.0.0";

/** A traceable link from a conclusion back to the record(s) behind it. */
export interface TwinEvidence {
  source: string; // human label, e.g. "Key-work session" / "Positive achievement"
  recordId?: string;
  date?: string;
  /** Deterministic significance weight (impact/quality, NOT frequency). */
  weight: number;
  note?: string;
}

export type TwinConfidence = "high" | "moderate" | "low" | "none";

/** Every dimension carries its data, its confidence, its evidence and its gaps. */
export interface TwinDimension<T> {
  data: T;
  confidence: TwinConfidence;
  evidence: TwinEvidence[];
  gaps: string[];
}

export interface TwinAchievement {
  date: string;
  title: string;
  category?: string;
  celebratedHow?: string;
  childReaction?: string;
}

export interface TwinAspiration {
  domain: string;
  aspiration: string;
  whyItMatters?: string;
  nextSteps: string[];
}

export interface TwinMemory {
  date: string;
  title: string;
  type?: string;
  childVoice?: string;
}

export interface TwinQuote {
  date: string;
  quote: string;
  source: string;
}

export interface ChildTwin {
  childId: string;
  name: string;
  generatedAt: string;
  engineVersion: string;

  /** Who the child IS — never reduced to behaviour. */
  identity: TwinDimension<{
    age?: number;
    culture?: string;
    faith?: string;
    interests: string[];
    whatMakesThemHappy: string[];
    personality: string[];
    communicationPreferences: string[];
    sensoryNeeds: string[];
  }>;

  /** Strengths, talents and what they've achieved — celebrated, not counted. */
  strengths: TwinDimension<{
    strengths: string[];
    achievements: TwinAchievement[];
  }>;

  /** Who they are becoming. */
  aspirations: TwinDimension<{
    aspirations: TwinAspiration[];
  }>;

  /** Memories that may matter years into the future. */
  lifeStory: TwinDimension<{
    memories: TwinMemory[];
  }>;

  /** The child's own words, kept. */
  voice: TwinDimension<{
    recentQuotes: TwinQuote[];
  }>;

  /** Trusted adults, friendships, family — connection, repair, rupture. */
  relationships: TwinDimension<{
    trustedAdults: string[];
    keyConnector?: string;
    relationalStatus?: string; // secure | developing | fragile
    friendships: string[];
    friendshipConcerns: string[];
    connections30d?: number;
    repairs?: number;
    ruptures?: number;
  }>;

  /** How they feel and regulate — from the emotional-safety engine. */
  emotional: TwinDimension<{
    status?: string; // secure | watch | concern
    trend?: string;
    peakTime?: string | null;
    triggers: string[];
    whatHelps: string[];
    phrasesThatHelp: string[];
    phrasesThatEscalate: string[];
  }>;

  /** Direction of travel — from the outcome engine (5 SCCIF-aligned domains). */
  progress: TwinDimension<{
    trajectory?: string;
    headline?: string;
    improving?: number;
    declining?: number;
    focus: string[];
  }>;

  /** The live protective-factors model. */
  protectiveFactors: TwinDimension<{
    factors: { label: string; source: string }[];
  }>;

  /** Does life here feel like a childhood? Significance-weighted, never a count. */
  livedExperience: TwinDimension<{
    meaningfulMoments30d: number; // significance-weighted score, not a tally
    celebrations: string[];
    ordinarySignals: string[]; // fun, laughter, shared meals, outings — everyday life
  }>;

  /**
   * Good-parenting intelligence — does the care read like excellent parenting?
   * Detects warmth, praise, fun, choice, ordinary childhood and belonging in
   * the records. A child should experience a childhood, not simply receive
   * care. Thin signals are surfaced as prompts, never as blame.
   */
  goodParenting: TwinDimension<{
    livedExperienceRead: string; // the synthesised "how does life feel here" line
    signalsPresent: { label: string; count: number }[];
    signalsThin: string[]; // categories with little/no evidence — a prompt to notice
  }>;

  /** Risks and needs — held proportionately, never the headline. */
  risksAndNeeds: TwinDimension<{
    openRiskAreas: string[];
    knownTriggers: string[];
  }>;

  /**
   * Professional curiosity — patterns across the whole picture a practitioner
   * might have missed, and the reflective questions worth sitting with. The
   * critical friend: it NEVER diagnoses or concludes; it only helps the team
   * stay curious. Synthesised across every other dimension.
   */
  curiosity: TwinDimension<{
    noticedPatterns: string[]; // cross-dimension observations, framed as "worth noticing"
    reflectiveQuestions: string[]; // questions to think alongside, never leading
  }>;

  /** Where the picture disagrees with itself — review prompts, not verdicts. */
  contradictions: string[];

  /** What CARA does NOT know about this child — a gap is intelligence too. */
  missingInformation: string[];
}
