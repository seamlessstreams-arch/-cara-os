// ══════════════════════════════════════════════════════════════════════════════
// Cara — practice-pattern domain cues (Phase 4)
//
// One list of plain-English cue phrases per pattern domain. The intake pipeline
// (4b) uses them to tag a candidate for the reviewer, and the watchlist model
// (4a) uses the domain list to validate what a practitioner speaks to.
//
// Keyed by PatternDomain, so a domain added to the Phase 1 union without cues
// here is a compile error rather than a silent gap. Tags are hints for the
// human reviewer, never judgements: matching uses the word-boundaried helpers
// (never substring `.includes`), so "impact" does not fire inside "impactful"
// and "lado" does not fire inside "colado".
// ══════════════════════════════════════════════════════════════════════════════

import { mentionsAny } from "@/lib/text/keyword-match";
import type { PatternDomain } from "./practice-patterns";

export const DOMAIN_CUES: Record<PatternDomain, readonly string[]> = {
  "reg-14": ["regulation 14", "reg 14", "reg14", "care planning standard", "placement plan", "care plan"],
  "reg-40": ["regulation 40", "reg 40", "reg40", "notifiable event", "notification to ofsted", "notify ofsted"],
  "reg-44": ["regulation 44", "reg 44", "reg44", "independent person", "independent visitor", "monthly visit"],
  "reg-45": ["regulation 45", "reg 45", "reg45", "quality of care review", "review of quality of care", "six-monthly review"],
  admissions: ["admission", "referral", "impact risk assessment", "placement request", "declined referral"],
  matching: ["matching", "compatibility", "impact assessment", "group dynamics"],
  "safer-recruitment": ["safer recruitment", "dbs check", "employment references", "pre-employment check", "employment gaps", "right to work"],
  safeguarding: ["safeguarding", "child protection", "lado", "allegation", "exploitation", "missing from care"],
  "rm-ri-oversight": ["registered manager", "responsible individual", "management oversight", "governance", "ri briefing"],
  "l-and-d": ["training", "learning and development", "induction", "diploma", "level 3", "level 5", "cpd"],
  "reflective-practice": ["reflective practice", "reflective", "reflection", "supervision", "debrief"],
  "recording-quality": ["recording", "daily log", "case notes", "record keeping", "write-up"],
  "document-control": ["document control", "version control", "policy review", "adoption date", "review date", "controlled document"],
  "placement-stability": ["placement stability", "placement breakdown", "disruption", "unplanned ending", "stability"],
  "evidence-vs-evaluation": [
    "evaluation",
    "evaluative",
    "evidence of impact",
    "impact on the child",
    "so what",
    "difference it made",
    "what changed",
  ],
  "human-outcomes": ["relationships", "belonging", "what would remain", "lived experience", "outcomes"],
  "connected-system": ["connected system", "join the dots", "whole system", "golden thread"],
};

/** Every pattern domain, in the order the cue table declares them. */
export const PATTERN_DOMAIN_LIST: readonly PatternDomain[] = Object.keys(DOMAIN_CUES) as PatternDomain[];

export function isPatternDomain(value: unknown): value is PatternDomain {
  return typeof value === "string" && (PATTERN_DOMAIN_LIST as readonly string[]).indexOf(value) !== -1;
}

/** The domains whose cues the text mentions, in table order. Empty when none fire. */
export function tagDomains(text: string): PatternDomain[] {
  return PATTERN_DOMAIN_LIST.filter((d) => mentionsAny(text, [...DOMAIN_CUES[d]]));
}
