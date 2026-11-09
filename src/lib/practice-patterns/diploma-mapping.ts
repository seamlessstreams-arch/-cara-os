// ══════════════════════════════════════════════════════════════════════════════
// CARA — DIPLOMA EVIDENCE MAPPING  (pure · deterministic · SUGGESTION-ONLY)
//
// Practice-patterns brief D / pattern pp_learning_changes_practice:
// link a learning item or reflective entry to what it COULD evidence for a
// Level 3 / Level 5 diploma — flagged as a suggestion, NEVER a guarantee.
//
// Honesty: Cara's repo does not hold a verified catalogue of diploma UNIT codes,
// so this maps to broad, well-established competence AREAS of the Level 3/5
// Diploma for Residential Childcare — it never invents unit numbers. Every
// result carries a mandatory disclaimer: a suggestion to take to an assessor,
// not an achievement and not a guarantee. Pure: imports only the keyword matcher.
// ══════════════════════════════════════════════════════════════════════════════

import { matchedKeywords } from "@/lib/keyword-match";

export type DiplomaLevel = "L3" | "L5" | "both";

export interface DiplomaArea {
  id: string;
  level: DiplomaLevel;
  area: string;
  cues: readonly string[];
}

// Broad competence areas (not unit codes). Cue keywords are word-boundary matched.
const DIPLOMA_AREAS: readonly DiplomaArea[] = [
  {
    id: "safeguarding",
    level: "both",
    area: "Safeguarding and protection",
    cues: ["safeguard", "abuse", "disclosure", "disclosed", "allegation", "lado", "exploitation", "protect", "harm"],
  },
  {
    id: "communication",
    level: "both",
    area: "Communication and the child's voice",
    cues: ["communicat", "listen", "child's voice", "wishes and feelings", "non-verbal", "advocacy", "voice of the child"],
  },
  {
    id: "development",
    level: "both",
    area: "Child development, attachment and trauma",
    cues: ["development", "milestone", "attachment", "trauma", "adolescen", "brain", "regulation", "sensory"],
  },
  {
    id: "relationships",
    level: "both",
    area: "Positive relationships and behaviour support",
    cues: ["relationship", "de-escalat", "deescalat", "behaviour", "boundaries", "repair", "pace", "restorative", "co-regulat"],
  },
  {
    id: "health_wellbeing",
    level: "both",
    area: "Health, safety and wellbeing",
    cues: ["health", "medication", "first aid", "wellbeing", "nutrition", "fire", "risk assessment", "self-harm"],
  },
  {
    id: "professional_practice",
    level: "both",
    area: "Professional practice and reflection",
    cues: ["reflect", "supervision", "cpd", "professional boundaries", "record", "policy", "appraisal"],
  },
  {
    id: "leadership",
    level: "L5",
    area: "Leadership and management of the service",
    cues: ["leadership", "manage", "quality of care", "staff development", "deployment", "oversight", "registered manager"],
  },
  {
    id: "equality",
    level: "both",
    area: "Equality, diversity and identity",
    cues: ["equality", "diversity", "culture", "identity", "inclusion", "religion", "protected characteristic"],
  },
];

export interface DiplomaSuggestion {
  areaId: string;
  area: string;
  level: DiplomaLevel;
  matchedCues: string[];
}

export interface DiplomaMappingResult {
  suggestions: DiplomaSuggestion[];
  /** ALWAYS present — a suggestion is never an achievement or a guarantee. */
  disclaimer: string;
}

const DISCLAIMER =
  "Suggestion only: these are possible evidence AREAS, not confirmed diploma units and not an achievement. Confirm the exact unit and whether it meets the assessment criteria with your assessor/IQA. Never record as achieved on this basis alone.";

/**
 * Suggest the broad diploma areas a learning item / reflection could evidence.
 * `level` filters to L3-relevant, L5-relevant, or both (default).
 */
export function suggestDiplomaEvidence(text: string, level: DiplomaLevel = "both"): DiplomaMappingResult {
  const clean = (text ?? "").trim();
  const suggestions: DiplomaSuggestion[] = [];
  if (clean) {
    for (const area of DIPLOMA_AREAS) {
      if (level !== "both" && area.level !== "both" && area.level !== level) continue;
      const matchedCues = matchedKeywords(clean, area.cues);
      if (matchedCues.length > 0) {
        suggestions.push({ areaId: area.id, area: area.area, level: area.level, matchedCues });
      }
    }
  }
  return { suggestions, disclaimer: DISCLAIMER };
}
