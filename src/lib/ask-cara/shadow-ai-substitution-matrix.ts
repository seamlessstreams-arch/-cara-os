// ══════════════════════════════════════════════════════════════════════════════
// CARA — SHADOW-AI SUBSTITUTION MATRIX (§3)
//
// Maps the things practitioners currently paste into ChatGPT/Gemini/Copilot to
// the SAFE, deterministic CARA route that already exists in the platform. Used by
// the Ask CARA router, the external-AI declaration flow, and the governance
// dashboard: when someone reaches for shadow AI, CARA offers the sanctioned
// alternative that keeps children's data inside CARA and produces a defensible
// audit trail.
//
// Every route here points at machinery that already exists (Writing Assistant,
// Reg 44/45 engines, chronology, Writing-to-the-Child, Management Oversight,
// Inspection Intelligence, Ask CARA). This module adds NO new engine — it routes.
// ══════════════════════════════════════════════════════════════════════════════

import { mentionsAny } from "@/lib/text/keyword-match";

export const SHADOW_AI_SUBSTITUTION_VERSION = "1.0.0";

export interface CaraRoute {
  /** Deterministic engine/intent this maps to. */
  engine: string;
  label: string;
  href?: string;
}

export interface Substitution {
  id: string;
  /** What a practitioner might type into an external AI tool. */
  shadowAiExamples: string[];
  /** Keywords/phrases that detect this intent (word-boundary). */
  patterns: string[];
  caraRoutes: CaraRoute[];
  saferMessage: string;
  why: string;
}

export const SHADOW_AI_SUBSTITUTIONS: Substitution[] = [
  {
    id: "make_professional",
    shadowAiExamples: ["Make this incident report sound professional", "Make my daily log more professional"],
    patterns: ["make this professional", "make it professional", "sound professional", "more professional", "make this sound better", "professionalise"],
    caraRoutes: [
      { engine: "RECORD_IMPROVEMENT", label: "Improve this record (Writing Assistant)", href: "/cara/recording-assistant" },
      { engine: "RECORD_COMPLETENESS_CHECK", label: "Check this record before submission" },
    ],
    saferMessage: "CARA's Writing Assistant can improve tone and structure deterministically and check nothing important is missing — without your record ever leaving CARA.",
    why: "An external tool sees the child's real details. CARA improves the same text locally and logs it.",
  },
  {
    id: "spelling_grammar",
    shadowAiExamples: ["Fix the spelling and grammar", "Check my grammar"],
    patterns: ["spelling", "grammar", "spellcheck", "check my writing", "typos", "punctuation"],
    caraRoutes: [{ engine: "SPELLING_GRAMMAR_CHECK", label: "Correct spelling & grammar (Writing Assistant)", href: "/cara/recording-assistant" }],
    saferMessage: "CARA checks spelling and grammar with a local rule set — no need to paste the record anywhere external.",
    why: "Even 'just spelling' means the child's name and details leave CARA. The local check avoids that entirely.",
  },
  {
    id: "simplify",
    shadowAiExamples: ["Make this simpler", "Explain this in plain English"],
    patterns: ["simplify", "make this simpler", "plain english", "make it easier to understand", "less jargon"],
    caraRoutes: [{ engine: "SIMPLIFY_LANGUAGE", label: "Simplify this language (Writing Assistant)", href: "/cara/recording-assistant" }],
    saferMessage: "CARA can simplify language locally while preserving the meaning and any safeguarding detail.",
    why: "Keeps the content inside CARA and preserves the record's integrity.",
  },
  {
    id: "write_to_child",
    shadowAiExamples: ["Write to the child about their behaviour", "Explain this to the child"],
    patterns: ["write to the child", "write this to the child", "explain to the child", "child friendly", "letter to the child", "message to the child"],
    caraRoutes: [{ engine: "CHILD_FRIENDLY_REWRITE", label: "Write to the child (Writing to the Child)" }],
    saferMessage: "CARA's Writing-to-the-Child engine drafts warm, boundaried, non-blaming wording that preserves the child's own words — child-centred by design.",
    why: "External tools often produce shaming or adultified language. CARA applies anti-oppressive language rules.",
  },
  {
    id: "reg44",
    shadowAiExamples: ["Write a Reg 44 report", "Draft the independent visitor report"],
    patterns: ["reg 44", "reg44", "regulation 44", "independent visitor report"],
    caraRoutes: [{ engine: "REG44_EVIDENCE", label: "Prepare Reg 44 evidence (source-linked)" }],
    saferMessage: "CARA's Reg 44 engine assembles source-linked evidence against the Quality Standards — the visitor's opinions stay theirs, and protection is never auto-marked met.",
    why: "A Reg 44 report must be grounded in real records and the visitor's judgement, not a generated narrative.",
  },
  {
    id: "reg45",
    shadowAiExamples: ["Write the quality of care review", "Summarise the last 6 months for Reg 45"],
    patterns: ["reg 45", "reg45", "regulation 45", "quality of care review"],
    caraRoutes: [{ engine: "REG45_EVIDENCE", label: "Prepare Reg 45 review evidence" }],
    saferMessage: "CARA builds a source-linked Reg 45 evidence base from the home's own records — trends, incidents, child voice — for the manager to review.",
    why: "Quality-of-care judgements must be evidenced from real practice, not invented.",
  },
  {
    id: "summarise_child",
    shadowAiExamples: ["Summarise this child's last month", "Give me a summary of everything that happened"],
    patterns: ["summarise this child", "summarise the last", "summary of the last", "summarise everything", "monthly summary", "sum up the month"],
    caraRoutes: [{ engine: "CHRONOLOGY_BUILDER", label: "Build a chronology / summary (authorised records only)" }],
    saferMessage: "CARA's chronology engine summarises from the child's authorised CARA records only, with source links and gaps flagged — no invented continuity.",
    why: "External summaries invent connective tissue. CARA only summarises what's actually recorded.",
  },
  {
    id: "voice_note",
    shadowAiExamples: ["Turn this voice note into a daily log", "Tidy up my dictation"],
    patterns: ["voice note", "dictation", "turn this into a log", "tidy up my notes", "rough notes into", "clean up my notes"],
    caraRoutes: [
      { engine: "DICTATION_CLEANUP", label: "Clean up a dictated note (Writing Assistant)", href: "/cara/recording-assistant" },
      { engine: "RECORD_COMPLETENESS_CHECK", label: "Check the record is complete" },
    ],
    saferMessage: "CARA can structure a dictated note deterministically and prompt for anything missing — without sending audio or text to an external service.",
    why: "Keeps raw, unredacted detail inside CARA and prompts for the facts, never inventing them.",
  },
  {
    id: "professional_update",
    shadowAiExamples: ["Prepare a social worker update", "Draft an email to the IRO"],
    patterns: ["social worker update", "iro update", "email to the social worker", "update for camhs", "professional update", "letter to the social worker", "email to the iro"],
    caraRoutes: [{ engine: "PROFESSIONAL_UPDATE", label: "Prepare a professional update (with information-sharing prompts)" }],
    saferMessage: "CARA drafts professional updates from structured inputs and source records, with information-sharing prompts (is it necessary, proportionate, authorised?).",
    why: "Sharing the child's information externally needs governance prompts, not a generic AI draft.",
  },
  {
    id: "management_oversight",
    shadowAiExamples: ["Write my management oversight", "Draft the manager's review of this incident"],
    patterns: ["write my oversight", "write my management oversight", "draft the oversight", "manager's review", "do my oversight"],
    caraRoutes: [{ engine: "MANAGEMENT_OVERSIGHT_PREP", label: "Prepare management oversight (manager reviews & signs)" }],
    saferMessage: "CARA pulls the workflow evidence together and structures oversight prompts — but the manager writes, reviews and signs the final oversight.",
    why: "Oversight is the manager's accountable judgement. CARA evidences it; it does not author it.",
  },
  {
    id: "justify_restraint",
    shadowAiExamples: ["Help me justify why staff restrained the child", "Make the restraint sound justified"],
    patterns: ["justify the restraint", "justify why staff", "justify the physical intervention", "make the restraint sound", "justify restraining"],
    caraRoutes: [{ engine: "PHYSICAL_INTERVENTION_SUPPORT", label: "Complete the physical-intervention workflow + oversight prompts" }],
    saferMessage: "CARA doesn't justify a restraint — it helps you evidence what happened before, during and after, whether de-escalation was tried, the child's voice, and the debrief, for manager oversight.",
    why: "The record must evidence proportionality and necessity from facts — justification is a management judgement, not a narrative.",
  },
  {
    id: "chronology",
    shadowAiExamples: ["Create a chronology from these logs", "Build me a timeline"],
    patterns: ["create a chronology", "build a chronology", "build a timeline", "make a timeline", "chronology from"],
    caraRoutes: [{ engine: "CHRONOLOGY_BUILDER", label: "Build a chronology from CARA source records" }],
    saferMessage: "CARA builds the chronology from authorised CARA records with source links and flags any gaps — it won't fill gaps with assumptions.",
    why: "A chronology used in safeguarding/court must be traceable to real records.",
  },
];

export interface SubstitutionMatch {
  matched: boolean;
  substitution?: Substitution;
  version: string;
}

/** Detect a shadow-AI-style request and return the safe CARA route. */
export function findSubstitution(text: string): SubstitutionMatch {
  const q = (text ?? "").toLowerCase();
  for (const sub of SHADOW_AI_SUBSTITUTIONS) {
    if (mentionsAny(q, sub.patterns)) return { matched: true, substitution: sub, version: SHADOW_AI_SUBSTITUTION_VERSION };
  }
  return { matched: false, version: SHADOW_AI_SUBSTITUTION_VERSION };
}

/** Given a free-text description of what someone used external AI for, return the
 *  safer CARA route (used by the external-AI declaration flow). */
export function saferRouteForDeclaredTask(taskDescription: string): SubstitutionMatch {
  return findSubstitution(taskDescription);
}
