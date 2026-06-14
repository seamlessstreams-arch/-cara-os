// ══════════════════════════════════════════════════════════════════════════════
// Reg 40 keyword detection — fail-safe surfacing of notifiable events
//
// The category-based Reg 40 gate only flags safeguarding / missing / physical-
// intervention / restraint events. Several legally-notifiable events (CHR 2015
// Reg 40) are recorded under other categories and would otherwise never reach the
// triage queue: a child's death, a serious illness or accident, an allegation
// against a member of staff, and police involvement.
//
// This detector scans an event's free text for HIGH-PRECISION indicators of those
// events so they are SURFACED for a human to triage (notify Ofsted or dismiss with
// a reason). It never auto-notifies — it only decides what a manager sees.
//
// Fail-safe by design: a false positive costs a human a few seconds to dismiss;
// a false negative could mean an unreported death. Patterns are kept specific
// (whole-word / phrase) to keep the queue signal high, but when in doubt we surface.
// ══════════════════════════════════════════════════════════════════════════════

import type { Reg40SuggestedCategory } from "@/types/cara-studio";

// Ordered by severity / specificity — the first match wins, so death is checked
// before everything, and an allegation against staff is preferred over the more
// generic serious-incident framing.
const REG40_PATTERNS: { category: Reg40SuggestedCategory; pattern: RegExp }[] = [
  {
    category: "death_of_child",
    pattern: /\b(died|passed away|deceased|fatality|fatalities|found dead|loss of life|pronounced dead|life[-\s]?threatening)\b/i,
  },
  {
    category: "allegation_against_staff",
    pattern:
      /\ballegation[s]?\b[^.!?]{0,60}\b(staff|worker|carer|key[-\s]?worker|employee|colleague|member of staff|manager)\b|\b(staff|worker|carer|key[-\s]?worker|employee|colleague|member of staff|manager)\b[^.!?]{0,60}\ballegation[s]?\b/i,
  },
  {
    category: "serious_illness_or_accident",
    pattern:
      /\b(hospitalis(?:ed|ation)|hospitaliz(?:ed|ation)|admitted to hospital|taken to hospital|blue[-\s]?lighted|a\s?&\s?e|999|ambulance|paramedic|overdose|unconscious|unresponsive|resuscitat\w*|cardiac arrest|seizure|serious(?:ly)? (?:injured|ill|unwell|harmed)|broken (?:bone|arm|leg|wrist|ankle|hip|collarbone)|fractured?|head injury|concussion)\b/i,
  },
  {
    category: "police_involvement",
    pattern:
      /\b(police|arrested|under arrest|in custody|charged with|crime reference|cad number|sectioned under|999 call to police)\b/i,
  },
];

/**
 * Returns the most serious Reg 40 category indicated by the event text, or null
 * if no high-precision notifiable indicator is present.
 */
export function detectReg40Category(title: string, content: string): Reg40SuggestedCategory | null {
  const text = `${title ?? ""}\n${content ?? ""}`;
  for (const { category, pattern } of REG40_PATTERNS) {
    if (pattern.test(text)) return category;
  }
  return null;
}

/** True when the event text indicates a notifiable event that should be triaged. */
export function requiresReg40FromText(title: string, content: string): boolean {
  return detectReg40Category(title, content) !== null;
}
