// ─────────────────────────────────────────────────────────────────────────────
// Child-Friendly Staying Safe Plan — data model
//
// A child-centred, zone-based safety plan (green / amber / red) written so the
// child can understand it, with a professional view and a print view. It tells
// staff what helps and what makes things worse, and how to repair afterwards.
//
// Standalone module (no store import) so store + engine share types without a
// circular dependency.
// ─────────────────────────────────────────────────────────────────────────────

export type SafePlanStatus = "draft" | "active" | "needs_review" | "archived";

/** A green/amber/red zone: how the child presents, and what helps / doesn't. */
export interface ZonePlan {
  signs: string; // how I look / feel in this zone
  staff_do: string; // what staff should do
  staff_dont: string; // what staff should NOT do
}

export interface StayingSafePlan {
  id: string;
  child_id: string;
  home_id: string;

  // ── Personalisation ───────────────────────────────────────────────────────
  preferred_name: string;
  communication_style: string; // e.g. "short sentences, visual cues"
  theme: string; // a colour/visual theme key for the child-friendly view

  // ── Framing ───────────────────────────────────────────────────────────────
  when_to_use: string;
  early_warning_signs: string;

  // ── The zones ─────────────────────────────────────────────────────────────
  green: ZonePlan; // when I'm okay
  amber: ZonePlan; // when I'm starting to struggle
  red: ZonePlan; // when I need urgent help

  // ── What helps / what doesn't ─────────────────────────────────────────────
  helpful_words: string;
  unhelpful_words: string; // words / actions that make things worse
  calming_tools: string;
  trusted_people: string;
  safe_spaces: string;
  sensory_needs: string;
  contact_preferences: string;

  // ── Repair & recovery ─────────────────────────────────────────────────────
  repair_recovery: string;
  what_helps_feel_safe_again: string;
  my_choices: string;

  // ── Contributions & approval ──────────────────────────────────────────────
  child_contribution: string; // the child's own voice in the plan
  staff_contribution: string;
  manager_approved: boolean;
  manager_id: string | null;
  approved_at: string | null;

  review_date: string | null;
  status: SafePlanStatus;

  // ── Audit ─────────────────────────────────────────────────────────────────
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

export const ZONE_META: Record<"green" | "amber" | "red", { label: string; emoji: string }> = {
  green: { label: "When I'm okay", emoji: "🟢" },
  amber: { label: "When I'm starting to struggle", emoji: "🟠" },
  red: { label: "When I need urgent help", emoji: "🔴" },
};

export function emptyZone(): ZonePlan {
  return { signs: "", staff_do: "", staff_dont: "" };
}
