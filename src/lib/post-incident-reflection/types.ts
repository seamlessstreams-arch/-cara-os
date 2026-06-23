// ─────────────────────────────────────────────────────────────────────────────
// Post-Incident Reflection & Learning — data model
//
// Turns an incident into reflection, repair and safer future practice. This is a
// WORKFLOW, not a form: a fixed set of stages each carry their own status and
// manager comment, alongside the structured reflection itself. Connects to the
// incident it came from and prompts review of the child's linked plans.
//
// Standalone module (no store import) so the store and engine share the types
// without a circular dependency.
// ─────────────────────────────────────────────────────────────────────────────

export type YesNoUnknown = "yes" | "no" | "unknown";

export type StageStatus =
  | "not_started"
  | "in_progress"
  | "blocked"
  | "completed"
  | "overdue"
  | "signed_off";

export type StageKey =
  | "incident_recorded"
  | "immediate_safety"
  | "staff_reflection"
  | "child_debrief"
  | "staff_debrief"
  | "linked_plans_reviewed"
  | "actions_created"
  | "manager_oversight"
  | "final_sign_off"
  | "learning_captured";

export interface ReflectionStage {
  key: StageKey;
  status: StageStatus;
  manager_comment: string;
  updated_at: string | null;
}

/** The fixed, ordered workflow. */
export const STAGE_DEFS: { key: StageKey; label: string }[] = [
  { key: "incident_recorded", label: "Incident recorded" },
  { key: "immediate_safety", label: "Immediate safety actions completed" },
  { key: "staff_reflection", label: "Staff reflection completed" },
  { key: "child_debrief", label: "Child debrief offered / completed" },
  { key: "staff_debrief", label: "Staff debrief completed where needed" },
  { key: "linked_plans_reviewed", label: "Linked plans reviewed" },
  { key: "actions_created", label: "Actions created" },
  { key: "manager_oversight", label: "Manager oversight completed" },
  { key: "final_sign_off", label: "Final sign-off" },
  { key: "learning_captured", label: "Learning captured into dashboards" },
];

export type ReflectionActionStatus = "open" | "in_progress" | "done" | "blocked";

export interface ReflectionAction {
  id: string;
  description: string;
  owner: string;
  due_date: string | null;
  status: ReflectionActionStatus;
}

export type ReflectionStatus = "open" | "in_progress" | "completed" | "signed_off";

export interface PostIncidentReflection {
  id: string;
  incident_id: string;
  child_id: string;
  home_id: string;
  incident_date: string;
  severity: string; // copied from the incident for convenience

  // ── What happened ─────────────────────────────────────────────────────────
  what_happened: string;
  location: string;
  who_involved: string;

  // ── Impact ────────────────────────────────────────────────────────────────
  impact_on_child: string;
  impact_on_others: string;
  impact_on_staff: string;
  impact_on_environment: string;

  // ── Understanding it ──────────────────────────────────────────────────────
  likely_triggers: string;
  contributing_factors: string;
  communication_factors: string;
  sensory_environmental_factors: string;

  // ── The response ──────────────────────────────────────────────────────────
  staff_response: string;
  response_helped: YesNoUnknown;
  response_escalated: YesNoUnknown;
  what_went_well: string;
  what_could_be_different: string;

  // ── Voices & reflection ───────────────────────────────────────────────────
  child_view: string;
  staff_reflection: string;
  manager_reflection: string;

  // ── Learning & actions ────────────────────────────────────────────────────
  learning_points: string;
  actions: ReflectionAction[];
  support_needed: string;

  // ── Plan reviews triggered ────────────────────────────────────────────────
  staying_safe_plan_review: boolean;
  risk_assessment_review: boolean;
  behaviour_support_review: boolean;
  relationship_map_review: boolean;
  restrictive_practice_review: boolean;

  // ── Debriefs ──────────────────────────────────────────────────────────────
  staff_debrief_done: YesNoUnknown;
  child_debrief_done: YesNoUnknown;

  // ── Workflow ──────────────────────────────────────────────────────────────
  stages: ReflectionStage[];
  status: ReflectionStatus;
  manager_id: string | null;
  signed_off_by: string | null;
  signed_off_at: string | null;

  // ── Audit ─────────────────────────────────────────────────────────────────
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

/** A fresh stage list, all not-started (stage 1 marked complete since the
 *  incident is, by definition, already recorded). */
export function freshStages(now: string): ReflectionStage[] {
  return STAGE_DEFS.map((d, i) => ({
    key: d.key,
    status: i === 0 ? "completed" : "not_started",
    manager_comment: "",
    updated_at: i === 0 ? now : null,
  }));
}
