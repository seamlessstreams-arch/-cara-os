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
  /** Operational domains: health & safety, rota safety, wellbeing, reg 44. */
  ops?: AskCaraOpsIntelligence;
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
