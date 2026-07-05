// ══════════════════════════════════════════════════════════════════════════════
// CARA — UNIFIED NEURODIVERSITY PROFILE (types)
//
// One per-child view that pulls together what already lives in three silos —
// the Autism plan, the ADHD plan, the sensory profile, and the EHCP — so that at
// the point of work (recording an incident, a restraint, a behaviour) the person
// writing can SEE the child's known triggers, what helps, what makes it worse,
// and how they communicate. Cara unifies and surfaces; it never re-diagnoses,
// and where nothing is on record it says so and points to the gap.
// ══════════════════════════════════════════════════════════════════════════════

export const NEURO_PROFILE_VERSION = "1.0.0";

export type NeuroSourceKind = "autism_plan" | "adhd_plan" | "sensory_profile" | "ehcp";

export type NeuroConditionKind = "autism" | "adhd" | "sensory_processing" | "other";

export interface UnifiedCondition {
  kind: NeuroConditionKind;
  label: string;
  /** e.g. diagnosed / awaiting_assessment / suspected — as recorded, never inferred. */
  status: string;
  date?: string;
  clinician?: string;
  source: NeuroSourceKind;
}

export interface NeuroSensoryEntry {
  domain: string; // visual, auditory, tactile, …
  pattern: string; // hyper_responsive, seeking, …
  triggers: string[];
  calming: string[];
  notes: string;
  source: NeuroSourceKind;
}

export interface NeuroEhcp {
  status: string;
  primaryNeed: string;
  secondaryNeeds: string[];
  outstandingActions: string[];
  nextReviewDue: string | null;
}

/** Where the profile is being surfaced — shapes which prompts lead. */
export type NeuroRecordingContext =
  | "incident"
  | "behaviour"
  | "restraint"
  | "daily_log"
  | "key_work"
  | "care_plan"
  | "overview";

export type NeuroPromptPriority = "critical" | "important" | "helpful";

export interface NeuroPrompt {
  id: string;
  priority: NeuroPromptPriority;
  label: string;
  items: string[];
  source: NeuroSourceKind;
}

export type NeuroReviewGapSeverity = "overdue" | "due_soon" | "missing";

export interface NeuroReviewGap {
  id: string;
  severity: NeuroReviewGapSeverity;
  message: string;
}

export interface UnifiedNeuroProfile {
  childId: string;
  childName: string;
  /** false when no neurodiversity record of any kind is on file. */
  hasProfile: boolean;
  conditions: UnifiedCondition[];
  sensory: { entries: NeuroSensoryEntry[]; adaptations: string[] };
  communication: { preferences: string[] };
  behaviour: {
    triggers: string[];
    meltdownSupport: string[];
    shutdownIndicators: string[];
    staffDo: string[];
    staffDoNot: string[];
    predictabilityNeeds: string[];
    transitionSupport: string[];
  };
  specialInterests: string[];
  ehcp: NeuroEhcp | null;
  childVoice: string;
  keyWorker: string;
  reviewGaps: NeuroReviewGap[];
  sources: NeuroSourceKind[];
  regulatoryLinks: string[];
  disclaimer: string;
  engineVersion: string;
}

// ── Input snapshots (the route reads the store; the engine stays pure) ────────

export interface NeuroAutismPlanInput {
  id: string;
  child_id: string;
  plan_date: string;
  diagnosis_status: string;
  diagnosis_date?: string;
  diagnosing_clinician?: string;
  special_interests: string[];
  communication_preferences: string[];
  sensory_profile: Array<{ sense: string; seeking_or_avoiding: string; specific_notes: string }>;
  predictability_needs: string[];
  meltdown_triggers: string[];
  meltdown_support: string[];
  shutdown_indicators: string[];
  shutdown_support: string[];
  transition_support: string[];
  staff_do_strategies: string[];
  staff_do_not_strategies: string[];
  child_voice: string;
  review_date: string;
  key_worker: string;
}

export interface NeuroAdhdPlanInput {
  id: string;
  child_id: string;
  plan_date: string;
  diagnosis_status: string;
  diagnosis_date?: string;
  strengths: string[];
  challenges: string[];
  executive_function_support: string[];
  time_blindness_strategies: string[];
  school_adjustments: string[];
  home_adjustments: string[];
  staff_do_strategies: string[];
  staff_do_not_strategies: string[];
  child_voice: string;
  review_date: string;
  key_worker: string;
}

export interface NeuroSensoryProfileInput {
  id: string;
  child_id: string;
  status: string;
  diagnosis: string[];
  entries: Array<{ domain: string; response_pattern: string; triggers: string[]; calming: string[]; notes: string }>;
  environmental_adaptations: string[];
  communication_preferences: string[];
  child_views: string;
  review_date: string;
}

export interface NeuroEhcpInput {
  id: string;
  child_id: string;
  plan_status: string;
  primary_need: string;
  secondary_needs: string[];
  outstanding_actions: string[];
  next_annual_review_due: string;
}

export interface UnifyNeuroInput {
  childId: string;
  childName: string;
  /** Window anchor ("today"), injected so the engine stays pure/testable. */
  asOf: string;
  autismPlans: NeuroAutismPlanInput[];
  adhdPlans: NeuroAdhdPlanInput[];
  sensoryProfiles: NeuroSensoryProfileInput[];
  ehcps: NeuroEhcpInput[];
}
