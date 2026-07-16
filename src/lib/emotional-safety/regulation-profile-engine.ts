// ─────────────────────────────────────────────────────────────────────────────
// Regulation Profile Engine (Practice Intelligence OS §5.7)
//
// A personalised, HUMAN-OWNED profile of how a child dysregulates and recovers,
// plus a way to reflect on ADULT regulation after an incident. It sits beside
// the existing emotional-safety ANALYSIS (which derives triggers and what-helps
// from records): the analysis observes; the profile is what the team agrees and
// writes down, in the child's terms where possible.
//
// Load-bearing principles from the brief:
//   • Regulation is NOT constant calm. The profile measures the ability to
//     return towards a manageable state and reconnect — recovery, not silence.
//   • CARA may SUGGEST profile content from evidence, but every suggestion is a
//     draft a person accepts, edits or rejects. The engine never fills a field
//     silently, and a suggestion always carries the records it came from.
//   • Pure and deterministic: no store import, no AI, caller supplies context.
// ─────────────────────────────────────────────────────────────────────────────

import type { EmotionalSafetyAnalysis } from "./emotional-safety-engine";

// ── The profile (human-owned, free text, the child's words where possible) ────

export interface RegulationProfile {
  id: string;
  child_id: string;
  home_id: string;

  /** How the child usually presents when settled — the baseline recovery aims for. */
  baseline: string;
  /** The first, quietest signs that something is changing. */
  early_signs: string;
  /** Signs the child is escalating. */
  escalation_signs: string;
  /** Signs the child is shutting down / withdrawing (not the same as calm). */
  shutdown_signs: string;

  /** Body cues, voice changes, movement, communication changes. */
  body_cues: string;
  sensory_preferences: string;
  environment_needs: string;

  helpful_adults: string;
  helpful_approaches: string;
  unhelpful_approaches: string;
  helpful_language: string;
  safe_places: string;
  grounding_activities: string;

  /** What recovery looks like FOR THIS CHILD, and roughly how long it takes. */
  recovery_signs: string;
  time_needed: string;
  /** Signs the child is ready to reflect — reflection before readiness re-escalates. */
  readiness_for_reflection: string;

  /** The child's own description of what happens and what helps. */
  child_own_words: string;

  review_date: string | null;
  updated_at: string;
  updated_by: string;
}

export type ProfileField = Exclude<
  keyof RegulationProfile,
  "id" | "child_id" | "home_id" | "review_date" | "updated_at" | "updated_by"
>;

/** A draft suggestion for one profile field, sourced from evidence. Advisory:
 *  a person accepts, edits or rejects it — the engine never writes it. */
export interface ProfileSuggestion {
  field: ProfileField;
  suggestion: string;
  /** Why CARA is proposing this — the analysis signals behind it. */
  whyShown: string;
}

/**
 * Propose profile content from the emotional-safety analysis. Only fields the
 * analysis can actually evidence are suggested (triggers → early_signs prompt,
 * what-helps → helpful_approaches, peak time → environment_needs). Everything
 * else is left for a person, because inventing a child's baseline or their own
 * words from incident data would be exactly the fabrication the brief forbids.
 */
export function suggestFromAnalysis(analysis: EmotionalSafetyAnalysis): ProfileSuggestion[] {
  const out: ProfileSuggestion[] = [];

  const triggers = analysis.triggers.slice(0, 4);
  if (triggers.length > 0) {
    out.push({
      field: "escalation_signs",
      suggestion:
        "Consider what tends to come before escalation: " +
        triggers.map((t) => t.label).join(", ") +
        ". These are recorded antecedents, not certainties — check them against what the child says.",
      whyShown:
        `Drawn from ${triggers.reduce((n, t) => n + t.count, 0)} recorded antecedent(s) across behaviour logs` +
        (triggers.some((t) => t.fromPace) ? " and the PACE profile." : "."),
    });
  }

  const helps = analysis.whatHelps.slice(0, 4);
  if (helps.length > 0) {
    out.push({
      field: "helpful_approaches",
      suggestion:
        "Approaches that have actually turned things around for this child: " +
        helps.map((h) => h.label).join(", ") + ".",
      whyShown:
        "Each of these was followed by the child regulating after an escalation — " +
        "credited only where a concern entry ended in recovery, never from routine good days.",
    });
  }

  if (analysis.escalation.peakTime) {
    const t = analysis.escalation.peakTime;
    out.push({
      field: "environment_needs",
      suggestion:
        `Escalations cluster in the ${t}. Consider what the ${t} is like for this child — ` +
        "handovers, noise, hunger, tiredness, transitions — and what could be softened then.",
      whyShown: `Time-of-day analysis shows the ${t} as the peak window for concern entries.`,
    });
  }

  return out;
}

// ── Adult co-regulation reflection (per incident) ─────────────────────────────
//
// The brief is explicit: after an incident, reflect on the ADULT's regulation,
// because the adult's state shapes the child's. These are the questions, and a
// place to answer them — not a score of the staff member.

export interface AdultRegulationReflection {
  id: string;
  incident_id: string;
  child_id: string;
  staff_id: string;

  adult_calm_enough: "yes" | "partly" | "no" | "unsure";
  adult_behaviour_effect: "reduced_pressure" | "neutral" | "increased_pressure" | "unsure";
  language_proportionate: "yes" | "partly" | "no" | "unsure";
  processing_time_given: "yes" | "partly" | "no" | "unsure";
  sensory_needs_considered: "yes" | "partly" | "no" | "unsure";
  co_regulation_attempted: "yes" | "partly" | "no" | "unsure";

  what_worked: string;
  what_i_would_change: string;
  support_i_need: string;

  created_at: string;
  created_by: string;
}

export const ADULT_REFLECTION_QUESTIONS: { field: keyof AdultRegulationReflection; question: string }[] = [
  { field: "adult_calm_enough", question: "Was I calm enough to help the child regulate?" },
  { field: "adult_behaviour_effect", question: "Did my behaviour reduce or increase the pressure?" },
  { field: "language_proportionate", question: "Was my language proportionate?" },
  { field: "processing_time_given", question: "Was the child given time to process?" },
  { field: "sensory_needs_considered", question: "Were the child's sensory needs considered?" },
  { field: "co_regulation_attempted", question: "Was co-regulation attempted before anything else?" },
];

/**
 * A gentle, non-scoring read of a completed reflection. This is a MIRROR for
 * the practitioner and their supervisor, never a rating: it counts how many of
 * the six practice questions point to increased pressure, and frames that as
 * a support and learning prompt — with the person's own "what I need" alongside.
 */
export interface ReflectionRead {
  answered: number;
  pressureIndicators: number;
  tone: "affirming" | "reflective" | "support";
  summary: string;
}

export function readReflection(r: AdultRegulationReflection): ReflectionRead {
  const qs = ADULT_REFLECTION_QUESTIONS.map((q) => r[q.field]);
  const answered = qs.filter((v) => v && v !== "unsure").length;

  // A "pressure indicator" is a place the adult themselves marked something
  // that likely made regulation harder. It is their reflection, not a verdict.
  const pressureIndicators =
    (r.adult_calm_enough === "no" || r.adult_calm_enough === "partly" ? 1 : 0) +
    (r.adult_behaviour_effect === "increased_pressure" ? 1 : 0) +
    (r.language_proportionate === "no" || r.language_proportionate === "partly" ? 1 : 0) +
    (r.processing_time_given === "no" ? 1 : 0) +
    (r.sensory_needs_considered === "no" ? 1 : 0) +
    (r.co_regulation_attempted === "no" ? 1 : 0);

  const tone: ReflectionRead["tone"] =
    pressureIndicators === 0 ? "affirming" : pressureIndicators <= 2 ? "reflective" : "support";

  const summary =
    tone === "affirming"
      ? "This reflection describes calm, proportionate, co-regulating adult support. Worth naming in supervision as practice to keep."
      : tone === "reflective"
        ? "This reflection notes a couple of moments where a different adult response might have helped — ordinary, honest practice reflection to talk through in supervision."
        : "This reflection is candid about several moments under pressure. That honesty is the point — it signals a practitioner who may need support and reflective time, not a performance concern.";

  return { answered, pressureIndicators, tone, summary };
}
