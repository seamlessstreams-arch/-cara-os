// ══════════════════════════════════════════════════════════════════════════════
// CARA INTELLIGENCE — PACE practice engine · TYPES
//
// PACE = Playfulness, Acceptance, Curiosity, Empathy — the relational stance from
// Dr Dan Hughes's Dyadic Developmental Practice (DDP). A way of thinking, feeling,
// communicating and behaving that helps a traumatised child feel safe, understood,
// and less defensive, so they can begin to trust adults.
//
// Cara's role (hard contract): ADVISE · DRAFT · RECOGNISE. Humans decide. Cara
// never diagnoses, never excuses unsafe behaviour, never replaces safeguarding
// escalation, never fabricates evidence. Acceptance is of the child's FEELINGS —
// never of unsafe behaviour. Where risk is present, professional judgement is
// always flagged. These types are pure data; the engines are deterministic.
// ══════════════════════════════════════════════════════════════════════════════

/** The four PACE elements (Dan Hughes / DDP). */
export type PACEElement = "PLAYFULNESS" | "ACCEPTANCE" | "CURIOSITY" | "EMPATHY";

/** The record / practice context PACE is being applied to or assessed within. */
export type PACEContext =
  | "DAILY_LOG"
  | "INCIDENT"
  | "MISSING_FROM_CARE"
  | "KEY_WORK"
  | "DEBRIEF"
  | "SANCTION"
  | "PHYSICAL_INTERVENTION"
  | "COMPLAINT"
  | "ROOM_SEARCH"
  | "FAMILY_CONTACT"
  | "EDUCATION"
  | "HEALTH"
  | "SESSION_PLAN"
  | "STAFF_SUPERVISION";

/** Risk / quality flags Cara can recognise in a record or response. */
export type PACERiskFlag =
  | "SHAMING_LANGUAGE"
  | "PUNITIVE_RESPONSE"
  | "ADULT_TRIGGER"
  | "MISSING_CHILD_VOICE"
  | "NO_REPAIR"
  | "NO_DEESCALATION"
  | "NO_REGULATION"
  | "UNSAFE_BOUNDARY"
  | "BLAME_BASED_RECORDING"
  | "BEHAVIOUR_WITHOUT_NEED"
  | "PROFESSIONAL_JUDGEMENT_REQUIRED";

export type PACESeverity = "low" | "medium" | "high" | "critical";
export type PACEBand = "strong" | "developing" | "emerging" | "needs_attention";

/** Evidence (or absence) of one PACE element in a record. */
export interface PACEElementEvidence {
  element: PACEElement;
  present: boolean;
  /** Exact phrases from the record that evidence this element (never invented). */
  evidence: string[];
  /** 0–1 confidence the element is genuinely present (deterministic heuristic). */
  confidence: number;
}

/** A flagged risk/quality concern with the evidence behind it. */
export interface PACEFlag {
  flag: PACERiskFlag;
  severity: PACESeverity;
  title: string;
  description: string;
  /** Matched phrases / cues from the record (never invented). */
  evidence: string[];
  recommendedAction: string;
}

/** An actionable recommendation Cara surfaces (it advises; humans decide). */
export interface PACERecommendation {
  priority: "immediate" | "soon" | "planned";
  area: PACEElement | "RECORDING" | "BOUNDARY" | "REPAIR" | "REGULATION" | "SAFEGUARDING" | "CHILD_VOICE";
  recommendation: string;
  rationale: string;
}

/** A short practice prompt for staff (reflective / in-the-moment). */
export interface PACEPracticePrompt {
  element: PACEElement | "GENERAL";
  prompt: string;
}

/** One dimension of the 0–100 PACE quality score. */
export interface PACEScoreDimension {
  key:
    | "connection"
    | "emotional_attunement"
    | "curiosity_meaning"
    | "boundaries_safety"
    | "child_voice"
    | "repair_followup"
    | "recording_objectivity"
    | "safeguarding_escalation";
  label: string;
  score: number; // 0–100
  weight: number; // contribution weight
}

export interface PACEQualityScore {
  overall: number; // 0–100
  band: PACEBand;
  dimensions: PACEScoreDimension[];
  /** Banner-level triggers, e.g. "Needs manager review". */
  triggers: string[];
}

/** Full result of analysing a single record/response. */
export interface PACEAnalysisResult {
  context: PACEContext;
  elements: PACEElementEvidence[];
  flags: PACEFlag[];
  /** Elements / facets the record is missing (need, feeling, trigger, repair…). */
  missing: string[];
  /** Does the record evidence connect-before-correct? */
  connectBeforeCorrect: boolean;
  childVoicePresent: boolean;
  /** Did the record explore the need beneath behaviour, not just the behaviour? */
  exploresNeed: boolean;
  score: PACEQualityScore;
  recommendations: PACERecommendation[];
  prompts: PACEPracticePrompt[];
  managerReviewRequired: boolean;
  /** True whenever risk is present — Cara never makes the call alone. */
  professionalJudgementRequired: boolean;
  summary: string;
  /** Cara's safety contract, surfaced on every result. */
  disclaimer: string;
}

/** A suggested recording improvement (never fabricates events). */
export interface PACERecordingImprovement {
  area:
    | "objective_wording"
    | "child_presentation"
    | "possible_trigger"
    | "staff_response"
    | "pace_intervention"
    | "child_voice"
    | "outcome"
    | "repair_followup"
    | "manager_notification";
  label: string;
  /** What's missing OR a rewrite of wording the staff member actually provided. */
  suggestion: string;
  /** If this is a rewrite, the original phrase it rewrites (else null). */
  rewriteOf: string | null;
}

export interface PACERecordingAssistantResult {
  improvements: PACERecordingImprovement[];
  /** Reassembled draft from the staff's own content + structure (no invention). */
  draftSkeleton: string;
  managerNotificationRequired: boolean;
  disclaimer: string;
}

/** Per-scenario guidance from the guidance engine. */
export interface PACEGuidance {
  context: PACEContext;
  scenario: string;
  whatMayBeUnderneath: string[];
  howToRespond: string[];
  whatToSay: string[];
  whatNotToSay: string[];
  holdBoundarySafely: string[];
  howToRecord: string[];
  managerShouldCheck: string[];
  whenToEscalate: string[];
  disclaimer: string;
}

/** Aggregated supervision insight for one staff member over many records. */
export interface PACESupervisionInsight {
  staffId: string;
  recordsReviewed: number;
  averageScore: number;
  strengths: string[];
  patterns: { flag: PACERiskFlag; occurrences: number; note: string }[];
  supervisionQuestions: string[];
  learningGoals: string[];
  reflectiveExercises: string[];
  managerReviewRecommended: boolean;
}

/** A micro-learning training module. */
export interface PACETrainingModule {
  id: string;
  title: string;
  explanation: string;
  scenario: string;
  goodResponse: string;
  poorResponse: string;
  reflectionQuestion: string;
  managerDiscussionPrompt: string;
  relatedContexts: PACEContext[];
}

/** Child-specific PACE profile — what works for this child (permission-controlled). */
export interface ChildPACEProfile {
  childId: string;
  homeId: string;
  knownTriggers: string[];
  calmingApproaches: string[];
  trustedAdults: string[];
  phrasesThatHelp: string[];
  phrasesThatEscalate: string[];
  sensoryNeeds: string[];
  repairApproaches: string[];
  preferredDebriefStyle: string | null;
  traumaInformedStrategies: string[];
  riskLinkedEscalationRules: string[];
  updatedBy: string;
  updatedAt: string;
}

/** Input to the analyzer. `today` injected for deterministic tests. */
export interface PACEAnalysisInput {
  text: string;
  context: PACEContext;
  childId?: string | null;
  staffId?: string | null;
  homeId?: string | null;
  /** Whether the record describes unsafe behaviour / risk (caller may hint). */
  riskPresentHint?: boolean;
}
