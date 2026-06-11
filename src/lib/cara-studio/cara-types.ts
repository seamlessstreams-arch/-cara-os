// ══════════════════════════════════════════════════════════════════════════════
// CARA STUDIO — TYPES & ZOD SCHEMAS
//
// The learning-design engine for residential childcare: curriculum maps,
// session plans, interactive materials, conversation blueprints,
// incident-to-learning conversions, SEND adaptations and staff debriefs.
//
// Every output schema ends in the same safety spine: staff guidance,
// adaptation notes, safeguarding notes, signs to pause, follow-up actions,
// a recording prompt and a manager-review flag. Zod validates everything
// before guardrails run and before anything is saved.
// ══════════════════════════════════════════════════════════════════════════════

import { z } from "zod";

// ── Learning profile (mirror of cara_child_learning_profiles) ────────────────

export interface CaraLearningStyle {
  visual: boolean;
  audio: boolean;
  practical: boolean;
  movement_based: boolean;
  conversation_based: boolean;
  creative: boolean;
  low_literacy: boolean;
  short_bursts: boolean;
}

export interface CaraChildLearningProfile {
  id: string;
  child_id: string;
  age: number | null;
  developmental_age_notes: string | null;
  communication_needs: string | null;
  send_needs: string | null;
  learning_style: CaraLearningStyle;
  attention_profile: string | null;
  sensory_profile: string | null;
  emotional_triggers: string | null;
  calming_strategies: string | null;
  trauma_considerations: string | null;
  cultural_identity_notes: string | null;
  literacy_level: string | null;
  preferred_activities: string | null;
  avoided_topics: string | null;
  trusted_adults: string | null;
  known_strengths: string | null;
  current_goals: string | null;
  risk_themes: string[];
  review_notes: string | null;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
}

// ── Saved records (store/table mirrors) ───────────────────────────────────────

export type CaraRecordStatus = "draft" | "approved" | "changes_requested" | "archived";
export type CaraReviewStatus = "not_reviewed" | "review_required" | "approved" | "changes_requested";

export interface CaraSavedOutput<T = unknown> {
  id: string;
  module: CaraModule;
  child_id: string | null;
  title: string;
  output: T;
  status: CaraRecordStatus;
  manager_review_status: CaraReviewStatus;
  manager_review_reasons: string[];
  guardrail_severity: GuardrailSeverity | null;
  guardrail_flags: GuardrailFlag[];
  llm_used: boolean;
  created_by: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface CaraAiRun {
  id: string;
  user_id: string;
  child_id: string | null;
  module: CaraModule;
  prompt_type: string;
  input_summary: string;
  output_id: string | null;
  safety_flags: string[];
  model_used: string;
  llm_used: boolean;
  human_review_required: boolean;
  created_at: string;
}

export interface CaraGuardrailEvent {
  id: string;
  user_id: string;
  child_id: string | null;
  module: CaraModule;
  risk_type: string;
  severity: GuardrailSeverity;
  flagged_text: string;
  action_taken: "rewritten" | "flagged_for_review" | "blocked_pending_review";
  created_at: string;
}

export interface CaraLibraryResource {
  id: string;
  title: string;
  resource_type: string;
  domain: string;
  age_range: string;
  send_tags: string[];
  trauma_tags: string[];
  content: string;
  source: string;
  source_type: "internal" | "ai_generated" | "external";
  approved: boolean;
  approved_by: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type CaraModule =
  | "curriculum"
  | "session_plan"
  | "material"
  | "conversation"
  | "incident_learning"
  | "adaptation"
  | "debrief";

// ── Guardrails ────────────────────────────────────────────────────────────────

export type GuardrailSeverity = "low" | "medium" | "high" | "critical";

export interface GuardrailFlag {
  risk_type: string;
  severity: GuardrailSeverity;
  matched_text: string;
  guidance: string;
}

export const CaraGuardrailResultSchema = z.object({
  passed: z.boolean(),
  severity: z.enum(["low", "medium", "high", "critical"]).nullable(),
  flags: z.array(
    z.object({
      risk_type: z.string(),
      severity: z.enum(["low", "medium", "high", "critical"]),
      matched_text: z.string(),
      guidance: z.string(),
    }),
  ),
  action: z.enum(["allow", "flag_for_review", "block_pending_review"]),
});
export type CaraGuardrailResult = z.infer<typeof CaraGuardrailResultSchema>;

// ── Shared safety spine (every output carries it) ─────────────────────────────

export const SafetySpineSchema = z.object({
  staffGuidance: z.string(),
  adaptationNotes: z.array(z.string()),
  safeguardingNotes: z.string(),
  signsToPause: z.array(z.string()),
  followUpActions: z.array(z.string()),
  recordingPrompt: z.string(),
  managerReviewNeeded: z.boolean(),
});

// ── Curriculum map ────────────────────────────────────────────────────────────

export const CaraCurriculumMapOutputSchema = z
  .object({
    title: z.string(),
    summary: z.string(),
    priorityNeeds: z.array(z.string()),
    curriculumDomains: z.array(z.string()),
    weeklyPlan: z.array(
      z.object({
        week: z.number(),
        focus: z.string(),
        why: z.string(),
        sessionIdeas: z.array(z.string()),
      }),
    ),
    suggestedSessionSequence: z.array(z.string()),
    outcomeMeasures: z.array(z.string()),
    reviewQuestions: z.array(z.string()),
  })
  .extend(SafetySpineSchema.shape);
export type CaraCurriculumMapOutput = z.infer<typeof CaraCurriculumMapOutputSchema>;

// ── Session plan ──────────────────────────────────────────────────────────────

export const CaraSessionPlanOutputSchema = z
  .object({
    title: z.string(),
    childFriendlyTitle: z.string(),
    purpose: z.string(),
    aims: z.array(z.string()),
    emotionalSafetyCheck: z.string(),
    resourcesNeeded: z.array(z.string()),
    sessionStructure: z.array(
      z.object({
        stepTitle: z.string(),
        durationMinutes: z.number(),
        staffAction: z.string(),
        childOption: z.string(),
        adaptationNote: z.string().optional(),
      }),
    ),
    openingScript: z.string(),
    mainActivity: z.string(),
    reflectiveQuestions: z.array(z.string()),
    regulationBreaks: z.array(z.string()),
    closingScript: z.string(),
    childFriendlySummary: z.string(),
  })
  .extend(SafetySpineSchema.shape);
export type CaraSessionPlanOutput = z.infer<typeof CaraSessionPlanOutputSchema>;

// ── Interactive material ──────────────────────────────────────────────────────

export const CARA_MATERIAL_TYPES = [
  "worksheet",
  "visual_card",
  "social_story",
  "quiz",
  "scenario_cards",
  "role_play",
  "reflection_cards",
  "feelings_cards",
  "safety_plan",
  "routine_builder",
  "decision_tree",
  "comic_strip",
  "audio_script",
  "staff_script",
  "restorative_conversation",
  "independence_task",
  "living_with_others_activity",
  "exploitation_awareness_activity",
  "digital_safety_activity",
] as const;
export type CaraMaterialType = (typeof CARA_MATERIAL_TYPES)[number];

export const CaraInteractiveMaterialOutputSchema = z
  .object({
    materialType: z.enum(CARA_MATERIAL_TYPES),
    title: z.string(),
    childFriendlyIntro: z.string(),
    // Generic structured body: ordered blocks the UI/print path renders.
    blocks: z.array(
      z.object({
        heading: z.string(),
        body: z.string(),
        childPrompt: z.string().optional(),
        options: z.array(z.string()).optional(),
      }),
    ),
    printableText: z.string(),
    audioScript: z.string().nullable(),
    visualPrompt: z.string().nullable(),
    lowWritingAlternative: z.string(),
  })
  .extend(SafetySpineSchema.shape);
export type CaraInteractiveMaterialOutput = z.infer<typeof CaraInteractiveMaterialOutputSchema>;

// ── Conversation blueprint ────────────────────────────────────────────────────

export const CaraConversationBlueprintOutputSchema = z
  .object({
    title: z.string(),
    bestTimeToApproach: z.string(),
    staffPreparation: z.array(z.string()),
    openingLines: z.array(z.string()),
    validationStatements: z.array(z.string()),
    curiosityQuestions: z.array(z.string()),
    reflectivePrompts: z.array(z.string()),
    safetyQuestions: z.array(z.string()),
    avoidPhrases: z.array(z.string()),
    ifChildShutsDown: z.string(),
    ifChildBecomesAngry: z.string(),
    ifChildBecomesUpset: z.string(),
    ifChildWalksAway: z.string(),
    closingLines: z.array(z.string()),
    staffRegulationReminders: z.array(z.string()),
  })
  .extend(SafetySpineSchema.shape);
export type CaraConversationBlueprintOutput = z.infer<typeof CaraConversationBlueprintOutputSchema>;

// ── Incident-to-learning ──────────────────────────────────────────────────────

export const CaraIncidentLearningOutputSchema = z
  .object({
    learningTheme: z.string(),
    nonShamingReframe: z.string(),
    possibleUnmetNeed: z.array(z.string()),
    staffReflection: z.string(),
    childConversationPlan: z.array(z.string()),
    microSession: z.object({
      title: z.string(),
      durationMinutes: z.number(),
      steps: z.array(z.string()),
    }),
    followUpSessionTheme: z.string(),
    interactiveMaterialSuggestions: z.array(z.string()),
  })
  .extend(SafetySpineSchema.shape);
export type CaraIncidentLearningOutput = z.infer<typeof CaraIncidentLearningOutputSchema>;

// ── SEND adaptation ───────────────────────────────────────────────────────────

export const CaraAdaptedContentOutputSchema = z
  .object({
    adaptedVersion: z.string(),
    changesMade: z.array(z.string()),
    visualSuggestions: z.array(z.string()),
    audioScript: z.string(),
    simplifiedLanguageVersion: z.string(),
    regulationAdjustments: z.array(z.string()),
    doNotDoList: z.array(z.string()),
  })
  .extend(SafetySpineSchema.shape);
export type CaraAdaptedContentOutput = z.infer<typeof CaraAdaptedContentOutputSchema>;

// ── Staff debrief ─────────────────────────────────────────────────────────────

export const CaraStaffDebriefOutputSchema = z
  .object({
    reflectiveSummary: z.string(),
    whatTheChildMayHaveBeenCommunicating: z.array(z.string()),
    whatWorkedWell: z.array(z.string()),
    whatCouldBeImproved: z.array(z.string()),
    relationalRepairPlan: z.array(z.string()),
    staffRegulationReminder: z.string(),
    supervisionQuestions: z.array(z.string()),
    recordingImprovements: z.array(z.string()),
  })
  .extend(SafetySpineSchema.shape);
export type CaraStaffDebriefOutput = z.infer<typeof CaraStaffDebriefOutputSchema>;

// ── Generation inputs (validated at the route boundary) ───────────────────────

export const SessionPlanRequestSchema = z.object({
  childId: z.string(),
  theme: z.string().min(2),
  aim: z.string().min(2),
  durationMinutes: z.number().min(5).max(90).default(20),
  childReadiness: z.enum(["low", "medium", "high"]).default("medium"),
  emotionalIntensity: z.enum(["low", "medium", "high"]).default("low"),
  staffConfidence: z.enum(["low", "medium", "high"]).default("medium"),
  preferredActivityType: z.string().optional(),
});

export const CurriculumRequestSchema = z.object({
  childId: z.string(),
  desiredOutcomes: z.array(z.string()).default([]),
  staffConcerns: z.string().optional(),
  timeframeWeeks: z.number().min(2).max(16).default(8),
});

export const MaterialRequestSchema = z.object({
  childId: z.string(),
  sessionPlanId: z.string().optional(),
  materialType: z.enum(CARA_MATERIAL_TYPES),
  theme: z.string().min(2),
  difficulty: z.enum(["gentle", "standard", "stretch"]).default("gentle"),
  formatPreference: z.string().optional(),
});

export const ConversationRequestSchema = z.object({
  childId: z.string(),
  conversationTopic: z.string().min(2),
  reasonForConversation: z.string().min(2),
  emotionalRisk: z.enum(["low", "medium", "high"]).default("medium"),
  desiredOutcome: z.string().optional(),
  staffConcern: z.string().optional(),
  recentContext: z.string().optional(),
});

export const IncidentLearningRequestSchema = z.object({
  childId: z.string(),
  incidentId: z.string().optional(),
  incidentSummary: z.string().min(5),
  staffResponse: z.string().optional(),
  childResponse: z.string().optional(),
  desiredLearning: z.string().optional(),
});

export const AdaptRequestSchema = z.object({
  childId: z.string().optional(),
  originalContent: z.string().min(5),
  adaptationNeeds: z.array(z.string()).min(1),
  format: z.enum(["text", "visual", "audio", "low_writing"]).default("text"),
});

export const DebriefRequestSchema = z.object({
  childId: z.string().optional(),
  incidentSummary: z.string().min(5),
  staffActions: z.string().optional(),
  childPresentation: z.string().optional(),
  outcome: z.string().optional(),
  staffFeelings: z.string().optional(),
  whatWorked: z.string().optional(),
  whatDidNotWork: z.string().optional(),
});
