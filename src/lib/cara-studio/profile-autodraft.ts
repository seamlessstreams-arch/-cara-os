// ══════════════════════════════════════════════════════════════════════════════
// CARA STUDIO — LEARNING-PROFILE AUTO-DRAFT
//
// Staff rarely fill in a child's Cara learning profile by hand, so on a live
// tenant the profile is empty and every generated session/material is generic.
// This composes records the home ALREADY keeps into a DRAFT profile the staff
// member confirms or edits — never a silent write, never an inference Cara has
// no business making.
//
// ★ Live-safety is the whole point: every read here goes through the dual-mode
// `dal` (Supabase on a live tenant), never the in-memory store — otherwise the
// draft would be as empty as the profile it is meant to seed. getChildTwin is
// deliberately NOT used: it reads the store and returns null on live.
//
// ★ Doctrine: Cara drafts only FACTS already on record (age, risk themes from
// incidents, triggers + what-calms from the emotional-safety projection). It
// does NOT infer SEND, learning style, literacy, sensory or communication
// needs — those are professional assessments and stay blank for a human.
// ══════════════════════════════════════════════════════════════════════════════

import "server-only";
import { dal } from "@/lib/db/dal";
import { todayStr } from "@/lib/utils";
import { ageFromDob } from "./cara-context-builder";
import { buildEmotionalSafetyAnalysis } from "@/lib/emotional-safety/emotional-safety-engine";
import { containsAnyKeyword } from "@/lib/keyword-match";

/** A single drafted field: the suggested value plus where it came from. */
export interface ProfileDraftField<T> {
  value: T;
  source: string;
}

/** The subset of the learning profile Cara is willing to draft from records. */
export interface LearningProfileDraft {
  age?: ProfileDraftField<number>;
  risk_themes?: ProfileDraftField<string[]>;
  emotional_triggers?: ProfileDraftField<string>;
  calming_strategies?: ProfileDraftField<string>;
}

// Risk-theme signal vocabulary, keyed by the RISK_TO_DOMAINS theme keys the
// curriculum generator understands, so a drafted theme flows straight into the
// domain mapping. Word-boundary matched (containsAnyKeyword) — never substring.
const RISK_THEME_SIGNALS: { theme: string; keywords: string[] }[] = [
  { theme: "missing", keywords: ["missing", "absconded", "abscond", "went missing", "away without authorisation"] },
  { theme: "exploitation", keywords: ["exploitation", "exploited", "grooming", "groomed", "county lines", "cse", "cce"] },
  { theme: "online", keywords: ["online", "social media", "internet", "snapchat", "instagram"] },
  { theme: "self-harm", keywords: ["self-harm", "self harm", "selfharm", "cutting", "overdose", "ligature"] },
  { theme: "violence", keywords: ["assault", "assaulted", "violence", "violent", "weapon", "punched", "kicked"] },
  { theme: "aggression", keywords: ["aggression", "aggressive", "verbal abuse", "threatened", "threatening"] },
  { theme: "peer_conflict", keywords: ["peer conflict", "another child", "other young person", "altercation with"] },
  { theme: "substance", keywords: ["substance", "drugs", "alcohol", "intoxicated", "vaping", "vape"] },
  { theme: "cannabis", keywords: ["cannabis", "weed", "spice"] },
  { theme: "education", keywords: ["exclusion", "excluded", "suspension", "truant", "refusing school"] },
  { theme: "family", keywords: ["family contact", "contact session", "sibling contact"] },
];

/** Risk themes implied by a child's incidents, most frequent first. Exported for tests. */
export function draftRiskThemes(incidents: { type: string; description: string }[]): string[] {
  const counts = new Map<string, number>();
  for (const inc of incidents) {
    const hay = `${inc.type.replace(/_/g, " ")} ${inc.description}`.toLowerCase();
    for (const { theme, keywords } of RISK_THEME_SIGNALS) {
      if (containsAnyKeyword(hay, keywords)) counts.set(theme, (counts.get(theme) ?? 0) + 1);
    }
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([theme]) => theme);
}

/**
 * Build a DRAFT learning profile for a child from live-safe records. Returns
 * only the fields it could evidence; everything else is left for staff. Never
 * writes — the caller persists via the normal profile PUT after staff confirm.
 */
export async function draftLearningProfileFromRecords(childId: string): Promise<{ draft: LearningProfileDraft }> {
  const child = await dal.youngPeople.findById(childId);
  if (!child) return { draft: {} };

  const now = new Date().toISOString();
  const [behaviourLog, incidents, keyworkSessions] = await Promise.all([
    dal.behaviourLog.findAll(),
    dal.incidents.findAll({ child_id: childId }),
    dal.keyWorkingSessions.findByChild(childId),
  ]);
  const childIncidents = incidents ?? [];

  const draft: LearningProfileDraft = {};

  // Age — from date of birth.
  const age = ageFromDob(child.date_of_birth, todayStr());
  if (age != null) draft.age = { value: age, source: "From date of birth" };

  // Risk themes — from the child's own incidents.
  const themes = draftRiskThemes(childIncidents.map((i) => ({ type: String(i.type), description: i.description ?? "" })));
  if (themes.length) {
    draft.risk_themes = {
      value: themes,
      source: `From ${childIncidents.length} recorded incident${childIncidents.length === 1 ? "" : "s"}`,
    };
  }

  // Triggers + what calms — from the deterministic emotional-safety projection
  // over behaviour, incidents and key-work mood. PACE seeds are left empty on
  // purpose (store-only); the behaviour/incident-derived signals are live-safe.
  const es = buildEmotionalSafetyAnalysis({
    childId,
    childName: child.preferred_name || child.first_name,
    now,
    behaviourLog: behaviourLog ?? [],
    incidents: childIncidents,
    keyWorkingSessions: (keyworkSessions ?? []).map((k) => ({
      child_id: k.child_id,
      mood_before: k.mood_before,
      mood_after: k.mood_after,
    })),
    knownTriggers: [],
    calmingApproaches: [],
  });
  const triggers = es.triggers.slice(0, 6).map((t) => t.label).filter(Boolean);
  if (triggers.length) {
    draft.emotional_triggers = { value: triggers.join(", "), source: "From patterns in behaviour and incident records" };
  }
  const helps = es.whatHelps.slice(0, 6).map((h) => h.label).filter(Boolean);
  if (helps.length) {
    draft.calming_strategies = { value: helps.join(", "), source: "From strategies that preceded the child settling" };
  }

  return { draft };
}
