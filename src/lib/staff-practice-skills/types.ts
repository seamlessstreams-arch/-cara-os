// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF PRACTICE SKILLS (types)
//
// One per-practitioner view that UNIFIES signals that already exist in pieces —
// competency scores, practice observations, reflective supervision, recording
// quality and relational (key-work) practice — into a single developmental
// picture: what this person is strong at, where they're growing, and what to
// bring to their next supervision.
//
// This is a critical friend for the workforce, not performance management: it
// never ranks staff, never produces a punitive score, and surfaces wellbeing
// with care. It reads existing records; it does not recompute the competency
// pathway or the recording-quality pathway — it brings their signals together.
// ══════════════════════════════════════════════════════════════════════════════

export const STAFF_SKILLS_VERSION = "1.0.0";

export type SkillSignal = "strong" | "developing" | "needs_support" | "no_data";

export type PracticeLensKey =
  | "competency"
  | "observed_practice"
  | "recording_quality"
  | "reflective_supervision"
  | "relational_practice";

export interface SkillEvidenceRef {
  recordType: string;
  recordId: string;
}

export interface PracticeLens {
  key: PracticeLensKey;
  label: string;
  signal: SkillSignal;
  detail: string;
  sources: SkillEvidenceRef[];
}

export interface StaffSupervisionPrompt {
  id: string;
  /** developmental / wellbeing — shapes tone, never punitive. */
  kind: "development" | "strength" | "wellbeing";
  prompt: string;
}

export interface StaffPracticeSkillsProfile {
  staffId: string;
  staffName: string;
  asOf: string;
  windowDays: number;
  /** false when no practice signal of any kind is on record in-window. */
  hasData: boolean;
  lenses: PracticeLens[];
  strengths: string[];
  developmentAreas: string[];
  supervisionPrompts: StaffSupervisionPrompt[];
  /** An honest, non-numeric read — never a rank or a grade. */
  overallPicture: "emerging" | "developing_well" | "well_established" | "insufficient_data";
  disclaimer: string;
  engineVersion: string;
}

// ── Input snapshots (the route reads the store; the engine stays pure) ────────

export interface StaffCompetencyScoreInput {
  id: string;
  staff_id: string;
  domain: string;
  score: number; // 0–5
  assessed_at: string;
}

export interface StaffObservationInput {
  id: string;
  staff_id: string;
  observation_date: string;
  outcome: string; // outstanding | meets_standard | developing | requires_support
  strengths_noted: string[];
  areas_for_development: string[];
}

export interface StaffSupervisionInput {
  id: string;
  staff_id: string;
  date: string;
  wellbeing_score: number; // 1–5
  confidence_level: number; // 1–5
  training_needs: string[];
}

export interface StaffRecordingAuditInput {
  id: string;
  staff_id: string;
  action: string; // accepted | dismissed | …
  created_at: string;
}

export interface StaffKeyWorkInput {
  id: string;
  staff_id: string;
  date: string;
  child_voice: string;
}

export interface StaffPracticeSkillsInput {
  staffId: string;
  staffName: string;
  asOf: string;
  windowDays?: number;
  competencyScores: StaffCompetencyScoreInput[];
  observations: StaffObservationInput[];
  supervisions: StaffSupervisionInput[];
  recordingAudits: StaffRecordingAuditInput[];
  keyWork: StaffKeyWorkInput[];
  domainLabels?: Record<string, string>;
}
