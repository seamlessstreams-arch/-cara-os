// ══════════════════════════════════════════════════════════════════════════════
// ARIA STUDIO — Types
//
// Canonical type definitions for the governed AI content creation system.
// ══════════════════════════════════════════════════════════════════════════════

// ── Generation Types ─────────────────────────────────────────────────────────

export const GENERATION_TYPES = [
  "KEYWORK_SESSION",
  "DIRECT_WORK_SESSION",
  "LIFE_STORY_SESSION",
  "MISSING_RETURN_HOME_SUPPORT",
  "STAFF_BRIEFING",
  "FLASHCARDS",
  "YOUNG_PERSON_EXPLAINER",
  "BEHAVIOUR_SUPPORT_IDEAS",
  "PLACEMENT_PLAN_DRAFT",
  "RISK_ASSESSMENT_DRAFT",
  "CARE_PLAN_DRAFT",
  "STAFF_MICRO_TRAINING",
  "TEAM_MEETING_PACK",
  "TEAM_DISCUSSION_GUIDE",
  "REG44_EVIDENCE_PREP",
  "REG45_EVIDENCE_PREP",
  "EDUCATION_SUPPORT_SESSION",
  "INDEPENDENCE_SESSION",
  "FAMILY_TIME_PREPARATION",
  "EMOTIONAL_REGULATION_SESSION",
  "RELATIONSHIP_REPAIR_SESSION",
  "MANAGER_OVERSIGHT_PROMPTS",
] as const;

export type GenerationType = (typeof GENERATION_TYPES)[number];

export const GENERATION_TYPE_LABELS: Record<GenerationType, string> = {
  KEYWORK_SESSION: "Key Work Session",
  DIRECT_WORK_SESSION: "Direct Work Session",
  LIFE_STORY_SESSION: "Life Story Work Session",
  MISSING_RETURN_HOME_SUPPORT: "Missing Return Home Support",
  STAFF_BRIEFING: "Staff Briefing",
  FLASHCARDS: "Flashcards",
  YOUNG_PERSON_EXPLAINER: "Young Person Explainer",
  BEHAVIOUR_SUPPORT_IDEAS: "Behaviour Support Ideas",
  PLACEMENT_PLAN_DRAFT: "Placement Plan Draft",
  RISK_ASSESSMENT_DRAFT: "Risk Assessment Draft",
  CARE_PLAN_DRAFT: "Care Plan Draft",
  STAFF_MICRO_TRAINING: "Staff Micro-Training",
  TEAM_MEETING_PACK: "Team Meeting Pack",
  TEAM_DISCUSSION_GUIDE: "Team Discussion Guide",
  REG44_EVIDENCE_PREP: "Reg 44 Evidence Prep",
  REG45_EVIDENCE_PREP: "Reg 45 Evidence Prep",
  EDUCATION_SUPPORT_SESSION: "Education Support Session",
  INDEPENDENCE_SESSION: "Independence Session",
  FAMILY_TIME_PREPARATION: "Family Time Preparation",
  EMOTIONAL_REGULATION_SESSION: "Emotional Regulation Session",
  RELATIONSHIP_REPAIR_SESSION: "Relationship Repair Session",
  MANAGER_OVERSIGHT_PROMPTS: "Manager Oversight Prompts",
};

// ── Tone & Audience ──────────────────────────────────────────────────────────

export const TONES = [
  "warm_professional",
  "playful",
  "calm_reassuring",
  "direct",
  "nurturing",
  "coaching",
  "formal",
] as const;

export type Tone = (typeof TONES)[number];

export const TONE_LABELS: Record<Tone, string> = {
  warm_professional: "Warm & Professional",
  playful: "Playful & Engaging",
  calm_reassuring: "Calm & Reassuring",
  direct: "Direct & Clear",
  nurturing: "Nurturing & Supportive",
  coaching: "Coaching & Motivational",
  formal: "Formal / Report Style",
};

export const AUDIENCES = [
  "staff",
  "young_person",
  "social_worker",
  "manager",
  "multi_agency",
  "family",
] as const;

export type Audience = (typeof AUDIENCES)[number];

export const AUDIENCE_LABELS: Record<Audience, string> = {
  staff: "Residential Staff",
  young_person: "Young Person",
  social_worker: "Social Worker",
  manager: "Registered Manager",
  multi_agency: "Multi-Agency",
  family: "Family Member",
};

// ── Status ───────────────────────────────────────────────────────────────────

export const STATUSES = [
  "DRAFT",
  "PENDING_APPROVAL",
  "APPROVED",
  "REJECTED",
  "COMMITTED",
  "ARCHIVED",
] as const;

export type GenerationStatus = (typeof STATUSES)[number];

// ── Child Profile (compiled for prompting) ───────────────────────────────────

export interface AriaChildProfile {
  childId: string;
  childName: string;
  preferredName?: string;
  age: number;
  gender?: string;
  pronouns?: string;
  placementStartDate?: string;
  keyWorker?: string;

  // Intelligence summaries (distilled, not raw)
  strengths: string[];
  needs: string[];
  riskFlags: string[];
  interests: string[];
  triggers: string[];
  copingStrategies: string[];
  communicationPreferences?: string;
  culturalConsiderations?: string;

  // Care plan context
  carePlanObjectives: { title: string; status: string }[];
  recentProgress?: string;

  // Relationships
  familyContext?: string;
  peerRelationships?: string;

  // Evidence references (for traceability)
  evidenceRefs: EvidenceRef[];
}

export interface EvidenceRef {
  type: string;   // "daily_log", "incident", "care_plan", "key_work", "assessment"
  id: string;
  date: string;
  summary: string;
}

// ── Generation Request ───────────────────────────────────────────────────────

export interface GenerationRequest {
  organisationId: string;
  homeId: string;
  childId?: string;         // Optional — some types don't require a child (e.g., staff briefing)
  generationType: GenerationType;
  title: string;
  brief: string;            // User's free-text description of what they want
  tone: Tone;
  audience: Audience;
  additionalContext?: string;
  userId: string;
}

// ── Generation Output ────────────────────────────────────────────────────────

export interface GenerationOutput {
  title: string;
  summary: string;
  sections: GenerationSection[];
  metadata: {
    generationType: GenerationType;
    model: string;
    tokenCount?: number;
    generatedAt: string;
    profileVersion?: number;
  };
}

export interface GenerationSection {
  heading: string;
  content: string;
  type: "narrative" | "list" | "prompt_questions" | "activity" | "checklist" | "table" | "guidance";
  items?: string[];           // For list/checklist types
  duration?: string;          // For session-based types
  resources?: string[];       // Materials needed
}

// ── Safety Assessment ────────────────────────────────────────────────────────

export interface SafetyAssessment {
  passed: boolean;
  score: number;              // 0-100
  flags: SafetyFlag[];
  warnings: string[];
  blockers: string[];         // Hard blocks that prevent generation
  recommendations: string[];
}

export interface SafetyFlag {
  code: string;
  severity: "info" | "warning" | "critical";
  message: string;
  field?: string;
}

// ── Database Row Types ───────────────────────────────────────────────────────

export interface AriaStudioGeneration {
  id: string;
  organisation_id: string;
  home_id: string;
  child_id: string | null;
  profile_id: string | null;
  generation_type: GenerationType;
  title: string;
  brief: string;
  tone: Tone;
  audience: Audience;
  status: GenerationStatus;
  output_json: GenerationOutput;
  safety_json: SafetyAssessment;
  evidence_refs: EvidenceRef[];
  model: string | null;
  created_by: string;
  approved_by: string | null;
  approved_at: string | null;
  committed_by: string | null;
  committed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

// ── Approval/Commit ──────────────────────────────────────────────────────────

export interface ApprovalRequest {
  generationId: string;
  action: "approve" | "reject";
  reason?: string;            // Required for rejection
  userId: string;
}

export interface CommitRequest {
  generationId: string;
  targetType: string;         // "care_plan", "key_work", "risk_assessment", etc.
  targetId?: string;          // Existing record to link/update
  userId: string;
}

// ── Category groupings for UI ────────────────────────────────────────────────

export interface GenerationCategory {
  label: string;
  types: GenerationType[];
}

export const GENERATION_CATEGORIES: GenerationCategory[] = [
  {
    label: "Direct Practice",
    types: [
      "KEYWORK_SESSION",
      "DIRECT_WORK_SESSION",
      "LIFE_STORY_SESSION",
      "EMOTIONAL_REGULATION_SESSION",
      "RELATIONSHIP_REPAIR_SESSION",
      "MISSING_RETURN_HOME_SUPPORT",
    ],
  },
  {
    label: "Education & Independence",
    types: [
      "EDUCATION_SUPPORT_SESSION",
      "INDEPENDENCE_SESSION",
      "FAMILY_TIME_PREPARATION",
    ],
  },
  {
    label: "Staff & Team",
    types: [
      "STAFF_BRIEFING",
      "STAFF_MICRO_TRAINING",
      "TEAM_MEETING_PACK",
      "MANAGER_OVERSIGHT_PROMPTS",
    ],
  },
  {
    label: "Statutory & Compliance",
    types: [
      "CARE_PLAN_DRAFT",
      "PLACEMENT_PLAN_DRAFT",
      "RISK_ASSESSMENT_DRAFT",
      "REG44_EVIDENCE_PREP",
      "REG45_EVIDENCE_PREP",
    ],
  },
  {
    label: "Young Person Resources",
    types: [
      "FLASHCARDS",
      "YOUNG_PERSON_EXPLAINER",
      "BEHAVIOUR_SUPPORT_IDEAS",
    ],
  },
];
