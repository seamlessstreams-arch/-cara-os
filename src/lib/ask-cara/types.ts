// ══════════════════════════════════════════════════════════════════════════════
// CARA — ASK CARA (deterministic Q&A) types
//
// A real, working "Ask Cara" that answers questions from the home's LIVE RECORDS
// — no LLM, no external call (prod credits are exhausted). A question is
// classified to an intent, routed to a pure skill that reads a store snapshot,
// and answered with facts + the records behind them.
//
// HARD RULE: no falsities. Every answer is computed from the snapshot; if Cara
// can't answer, it says so honestly and shows what it CAN answer — it never
// invents a fact. Cara supports professional judgement; it never makes a
// safeguarding decision.
// ══════════════════════════════════════════════════════════════════════════════

export const ASK_CARA_VERSION = "1.0.0";

export type AskCaraIntent =
  | "greeting"
  | "child_summary"
  | "attention"
  | "incidents"
  | "missing"
  | "restraints"
  | "overdue_tasks"
  | "medication"
  | "safeguarding"
  | "children_list"
  | "staffing"
  | "key_work"
  | "events"
  | "reflector"
  | "shift_brief"
  | "whats_due"
  | "home_overview"
  | "contacts"
  | "supervision"
  | "training"
  | "policy_guidance"
  | "practice_guidance"
  | "child_progress"
  | "child_triggers"
  | "child_relationships"
  | "child_identity"
  | "inspection_readiness"
  | "health_safety"
  | "rota_safety"
  | "staff_wellbeing"
  | "reg44"
  | "org_learning"
  | "safer_recruitment"
  | "weekly_summary"
  | "lived_experience"
  | "care_language"
  | "child_voice"
  | "recording_gaps"
  | "cumulative_risk"
  | "child_calendar"
  | "child_feedback"
  | "prohibited"
  | "shadow_ai_route"
  | "access_denied"
  | "unknown";

/** Access tiers — answers are gated by the requester's role. */
export type AccessTier = "everyone" | "care_team" | "management";

export interface AskCaraSource {
  label: string;
  count: number;
  href?: string;
}

export interface AskCaraSuggestion {
  label: string; // the follow-up question text
}

export interface AskCaraAnswer {
  intent: AskCaraIntent;
  /** True when Cara answered from records; false = honest "I can't answer that". */
  answered: boolean;
  /** Markdown-ish plain text (newlines + "- " bullets rendered by the UI). */
  text: string;
  sources: AskCaraSource[];
  suggestions: AskCaraSuggestion[];
  disclaimer?: string;
  engineVersion: string;
}

// ── Snapshot (the route reads the store; the engine stays pure) ───────────────

export interface AskCaraChild {
  id: string;
  firstName: string;
  name: string;
  dob?: string;
  status: string;
  keyWorkerId?: string;
  legalStatus?: string;
  socialWorker?: string;
  iro?: string;
  school?: string;
  gp?: string;
  allergies?: string[];
  dietary?: string;
  placementStart?: string;
  nextReviewDate?: string;
}

/**
 * Compact per-child "read" distilled from the platform's deterministic
 * evaluation engines (Outcome Intelligence, Emotional Safety, Relational
 * Timeline) — computed where the store lives, narrated by the pure engine.
 */
export interface AskCaraChildEvaluation {
  childId: string;
  outcome?: {
    trajectory: string; // improving | stable | declining
    status: string; // on_track | progressing | needs_focus
    headline: string;
    improving: number;
    declining: number;
    focus: string[]; // domains needing focus
  };
  emotional?: {
    status: string; // secure | watch | concern
    reason: string;
    trend: string; // rising | steady | easing
    peakTime: string | null; // morning | afternoon | evening | night
    topTriggers: string[];
    whatHelps: string[];
  };
  relational?: {
    status: string; // secure | developing | fragile
    reason: string;
    trustedAdults: string[];
    keyConnector?: string;
    connections30d: number;
    repairs: number;
    ruptures: number;
  };
}

/**
 * Compact digest of the child-level PRACTICE-INTELLIGENCE engines — the
 * deterministic "critical friend" reads Ask CARA narrates so a question like
 * "is our language criminalising Alex?" / "who is at cumulative risk?" /
 * "whose voice is missing?" / "where are our recording gaps?" is answered from
 * the ENGINE'S findings on this home's records, not generic knowledge-base
 * theory. Each block is optional — built in try/catch, absent if the engine
 * couldn't read. Home-level summary + a compact per-child list for each.
 */
export interface AskCaraPracticeDigest {
  /** Care Language Audit — criminalising/moralising/labelling language scan. */
  careLanguage?: {
    hitRate: number; // flags per 100 records scanned (whole home)
    totalHits: number;
    childrenAffected: number;
    topCategoryLabel?: string; // most-flagged category (home)
    mostFlaggedPhrase?: string;
    perChild: { childId: string; totalHits: number; topCategoryLabel?: string }[]; // only children with ≥1 hit
  };
  /** Child Voice Presence — UN CRC Art.12 voice analysis across record types. */
  childVoice?: {
    overallPresenceRate: number | null; // % of records where the child's voice appears
    worstTypeLabel?: string; // record type with the least voice
    lacParticipationRate: number | null;
    perChild: { childId: string; score: number | null; hasData: boolean; topGapTypeLabel?: string }[];
  };
  /** Recording Gap Intelligence — safeguarding-critical recording gaps. */
  recordingGaps?: {
    childrenWithCriticalGap: number;
    childrenWithAnyGap: number;
    totalCriticalGaps: number;
    perChild: { childId: string; severity: string; criticalGapCount: number; topGapLabel?: string }[]; // gap children only, critical-first
  };
  /** Cumulative Risk Intelligence — 5-signal convergence per child. */
  cumulativeRisk?: {
    escalatingCount: number;
    urgentSupervisionCount: number;
    mostCommonWorseningSignal: string;
    perChild: { childId: string; signal: string; priority: string; worseningSignals: number; topWorseningLabel?: string }[]; // escalating/concerning first
  };
}

/** One row of a child's diary — projected by the shared calendar engine (#246). */
export interface AskCaraCalendarItem {
  date: string; // YYYY-MM-DD
  title: string;
  /** calendar | appointment | lac_review | family_time | key_working | task | interview … */
  source: string;
}

/** Per-child calendar picture: what's coming up and what they recently attended. */
export interface AskCaraChildCalendar {
  childId: string;
  upcoming: AskCaraCalendarItem[]; // next 14 days
  attended: AskCaraCalendarItem[]; // past 30 days
}

/** The child's own feedback (ypFeedback) — their words, how they felt, our response. */
export interface AskCaraFeedback {
  childId: string;
  date: string;
  sentiment: string; // very_happy | happy | ok | unhappy | very_unhappy
  category: string;
  text: string;
  actionTaken?: string;
  responded: boolean;
}

/** A health appointment on record (GP / CAMHS / dental …) — healthRecordEntries. */
export interface AskCaraHealthAppointment {
  childId: string;
  date: string;
  title: string;
  professional?: string;
  outcome?: string;
}

/**
 * Compact digest of the CPIE Digital Twin — the whole-child dimensions
 * (identity, strengths, aspirations, memories, voice) Ask CARA narrates so a
 * child is never defined by incidents alone. Full twin: src/lib/cpie.
 */
export interface AskCaraTwinDigest {
  childId: string;
  interests: string[];
  whatMakesThemHappy: string[];
  strengths: string[];
  recentAchievements: { title: string; date: string; celebratedHow?: string }[];
  aspirations: { aspiration: string; whyItMatters?: string }[];
  memories: { title: string; date: string; childVoice?: string }[];
  meaningfulMoments30d: number;
  missingInformation: string[];
  /** Good-parenting / lived-experience read (does life here feel like a childhood?). */
  livedExperienceRead: string;
  parentingPresent: string[];
  parentingThin: string[];
  /** Professional-curiosity synthesis — patterns noticed + questions to sit with. */
  curiosityPatterns: string[];
  curiosityQuestions: string[];
}

/**
 * Digest of the CPIE Weekly Intelligence Object — the deterministic pre-report
 * object for a child's week. Ask CARA narrates it so "what should be in Alex's
 * weekly summary?" is answered from the structured intelligence, not re-derived.
 */
export interface AskCaraWeeklyDigest {
  childId: string;
  weekStart: string;
  weekEnding: string;
  /** The flowing manager-summary narrative (third person) — CPIE narrator prose. */
  narrative?: string;
  picture: string;
  who: string;
  directionOfTravel: string;
  achievements: string[];
  celebrations: string[];
  childVoiceMoments: string[];
  emotionalWellbeing: string;
  qualityStandardsEvidence: { label: string; evidence: string }[];
  fiveOutcomesEvidence: { label: string; evidence: string }[];
  emergingThemes: string[];
  recommendations: string[];
  evidenceConfidence: string;
  missingInformation: string[];
}

/**
 * Operational intelligence for the orchestrator's non-child domains:
 * health & safety / premises, rota safety, staff wellbeing (aggregate only —
 * data-minimised, no individual health detail), and Regulation 44 actions.
 */
export interface AskCaraOpsIntelligence {
  healthSafety: {
    overdue: { label: string; dueDate?: string; area?: string }[];
    actionRequired: { label: string; action: string }[];
    openMaintenance: number;
    fireDrills90d: number;
    vehicleChecksOverdue: number;
  };
  rotaSafety?: {
    headline: string;
    daysUnder: number;
    nightsNoWaking: number;
    openShiftPeriods: number;
    phantomDays: number;
    worst: { date: string; period: string; message: string }[];
  };
  wellbeing: {
    openSickness: number;
    onLeaveToday: number;
    checkInsRecorded: number;
  };
  reg44: {
    outstanding: { label: string; due?: string; overdue: boolean }[];
  };
  /** Organisational learning — themes the home is learning from (§21 report digest). */
  orgLearning?: {
    headline: string;
    themes: { section: string; title: string; detail: string }[];
    totalEvidence: number;
  };
  /** Safer recruitment — STAFF FILE currency (compliance posture, never a
   * character judgement; suitability decisions stay human). */
  saferRecruitment: {
    staff: { staffId: string; name: string; hasDbs: boolean; dbsAgedOver3y: boolean; onUpdateService: boolean }[];
  };
}

/**
 * Home-level read from the Inspection Intelligence engine (SCCIF projection):
 * evidence strength + gaps per judgement area. Describes readiness — NEVER a
 * predicted inspection grade (hard platform rule).
 */
export interface AskCaraHomeEvaluation {
  headline: string;
  areasStrong: number;
  areasDeveloping: number;
  areasLimited: number;
  areas: { label: string; strength: string; summary: string }[];
  priorities: { area: string; label: string; detail: string; childNames: string[] }[];
}

export interface AskCaraContactRec {
  childId: string;
  role: string; // social_worker | iro | camhs | education | ...
  name: string;
  organisation?: string;
  phone?: string;
}

export interface AskCaraSupervision {
  staffId: string;
  date: string; // when it last happened
  nextDate?: string; // next due / follow-up
  status?: string;
}

export interface AskCaraTraining {
  staffId: string;
  course: string;
  expiryDate?: string;
  status?: string; // compliant | expiring_soon | expired | not_started
  mandatory?: boolean;
}

export interface AskCaraIncident {
  id: string;
  type: string;
  severity: string;
  childId?: string;
  date: string;
  status: string;
  requiresOversight: boolean;
  hasOversight: boolean;
}

export interface AskCaraTask {
  id: string;
  title: string;
  dueDate: string;
  status: string;
  childId?: string;
}

export interface AskCaraRestraint {
  id: string;
  date: string;
  childId?: string;
  childDebriefed: boolean;
}

export interface AskCaraMissing {
  id: string;
  date: string;
  childId?: string;
  hasReturnInterview: boolean;
  status: string;
}

export interface AskCaraDailyLog {
  childId: string;
  date: string;
  content: string;
  significant?: boolean;
}

export interface AskCaraShift {
  id: string;
  staffId: string;
  date: string;
  shiftType?: string;
}

export interface AskCaraKeyWork {
  childId: string;
  date: string;
}

export interface AskCaraMedication {
  id: string;
  childId?: string;
  name: string;
}

export interface AskCaraReview {
  id: string;
  kind: string; // "Risk assessment" | "LAC review"
  childId?: string;
  nextReviewDate: string;
}

export interface AskCaraSnapshot {
  children: AskCaraChild[];
  staff: { id: string; name: string }[];
  incidents: AskCaraIncident[];
  tasks: AskCaraTask[];
  restraints: AskCaraRestraint[];
  missingEpisodes: AskCaraMissing[];
  dailyLogs: AskCaraDailyLog[];
  medications: AskCaraMedication[];
  reviews: AskCaraReview[];
  shifts: AskCaraShift[];
  keyWork: AskCaraKeyWork[];
  home?: { name?: string; maxBeds?: number; currentOccupancy?: number };
  contacts: AskCaraContactRec[];
  supervisions: AskCaraSupervision[];
  training: AskCaraTraining[];
  /** Approved home policies for deterministic policy-guidance (optional). */
  policies?: import("./policy-guidance-engine").PolicyDoc[];
  /** Per-child evaluation reads from the deterministic engines (optional). */
  evaluations?: AskCaraChildEvaluation[];
  /** Home-level read from the Inspection Intelligence engine (optional). */
  homeEvaluation?: AskCaraHomeEvaluation;
  /** CPIE Digital-Twin digests — the whole-child picture per child (optional). */
  twins?: AskCaraTwinDigest[];
  /** CPIE Weekly Intelligence Object digests — the structured weekly pre-report. */
  weekly?: AskCaraWeeklyDigest[];
  /** CPIE Monthly Intelligence Object digests — same shape, 30-day window. */
  monthly?: AskCaraWeeklyDigest[];
  /** Operational domains: health & safety, rota safety, wellbeing, reg 44. */
  ops?: AskCaraOpsIntelligence;
  /** Child-level practice-intelligence engine findings (care language, child
   *  voice, recording gaps, cumulative risk). */
  practice?: AskCaraPracticeDigest;
  /** Per-child diary from the shared calendar projection (#246): upcoming +
   *  recently attended meetings, reviews, family time, appointments. */
  childCalendar?: AskCaraChildCalendar[];
  /** The children's own feedback records — what they said, sentiment, response. */
  feedback?: AskCaraFeedback[];
  /** Health appointments on record per child (GP / CAMHS / dental …). */
  healthAppointments?: AskCaraHealthAppointment[];
}

export interface AskCaraContext {
  pageTitle?: string;
  childId?: string;
}

export interface AskCaraQuery {
  question: string;
  asOf: string; // ISO date (YYYY-MM-DD) — injected for determinism
  userName?: string;
  /** The requester's role (AppRole) — gates which answers Cara will give. */
  role?: string;
  snapshot: AskCaraSnapshot;
  context?: AskCaraContext;
}
