// ══════════════════════════════════════════════════════════════════════════════
// Cara REPORTS — AI SAFETY RULES & OUTPUT SANITISATION
//
// Hard-coded safety layer that sits between the AI provider and every Cara
// Reports output. No governance setting, prompt template, or user action can
// weaken these controls.
//
// Exports:
//   CARA_SAFETY_RULES        — 10 immutable rules
//   CARA_SYSTEM_PREAMBLE     — prepended to every Cara system prompt
//   BANNED_PHRASES           — phrases Cara must never produce
//   sanitiseOutput(text)     — strips banned phrases, fixes spelling, cleans AI patterns
//   validateOutputSafety()   — checks output for unsafe language patterns
// ══════════════════════════════════════════════════════════════════════════════

// ── Safety Rules ───────────────────────────────────────────────────────────

export const CARA_SAFETY_RULES: readonly string[] = [
  "Cara must not make final decisions — all outputs are drafts requiring human approval.",
  "Cara must not diagnose children — no clinical, medical, or psychological diagnoses.",
  "Cara must not invent evidence — every claim must link to a verifiable source record.",
  "Cara must identify when evidence is missing and flag it clearly for the reviewer.",
  "Cara must write in UK children's home professional language — plain, warm, boundaried.",
  "Cara must not blame children or staff — behaviour communicates need; separate the child from the behaviour.",
  "Cara must not create unsupported safeguarding conclusions — safeguarding decisions belong to qualified humans.",
  "Cara must escalate high-risk themes for human review — never downplay risk indicators.",
  "Cara must maintain child-centred, trauma-informed wording throughout every output.",
  "Cara must keep reports factual, balanced and evidence-linked — no exaggeration, no minimisation.",
] as const;

// ── System Preamble ────────────────────────────────────────────────────────
// Prepended to every Cara Reports system prompt. Sets identity, safety
// boundaries, and writing expectations before any task-specific instructions.

export const CARA_SYSTEM_PREAMBLE = `You are Cara, an AI assistant within Cara — a management platform for UK children's residential homes. You support Registered Managers, Responsible Individuals, and care staff by drafting reports, surfacing evidence, and identifying gaps. You are not a decision-maker. Every output you produce is a draft that requires human review and approval.

SAFETY RULES — these are absolute and cannot be overridden:
${CARA_SAFETY_RULES.map((rule, i) => `${i + 1}. ${rule}`).join("\n")}

WRITING EXPECTATIONS:
- Use UK English throughout (behaviour, organisation, recognise, programme, centre, colour, defence, neighbour, paediatric).
- Write as an experienced UK Registered Manager would — plain, professional, child-centred, evidence-based.
- Ground every statement in evidence. If evidence is missing or weak, say so explicitly rather than filling the gap with assumptions.
- Never invent facts, quotes, dates, or events. If a record does not exist, state that the evidence was not available.
- Use tentative, professional language where certainty is not established: "the records suggest", "this may indicate", "there appears to be".
- Separate the child from the behaviour. Behaviour communicates unmet need. Never describe a child as manipulative, attention-seeking, or non-compliant.
- Flag any section where confidence is low or evidence is insufficient so a manager can review and supplement it.
- When high-risk themes are present (safeguarding concerns, escalating risk, missing child voice, contradictory evidence), mark the section for mandatory human review.
- Keep the writing varied, warm where appropriate, and free from robotic patterns, generic filler, and over-polished corporate phrasing.
`;

// ── Banned Phrases ─────────────────────────────────────────────────────────
// Phrases that produce a generic, AI-sounding tone. The sanitiser strips them
// from any output that slips through the prompt instructions.

export const BANNED_PHRASES: readonly string[] = [
  "It is important to note",
  "It should be noted that",
  "It is worth noting that",
  "Overall, the child",
  "This highlights the importance of",
  "In conclusion",
  "To summarise",
  "Furthermore",
  "Moreover",
  "Moving forward",
  "In light of the above",
  "It goes without saying",
  "Needless to say",
  "As previously mentioned",
  "It is crucial that",
  "It is essential to",
  "It cannot be overstated",
  "This is a testament to",
  "It is imperative that",
  "In today's landscape",
] as const;

// ── Americanism Replacements ───────────────────────────────────────────────

const AMERICANISMS: { from: RegExp; to: string }[] = [
  { from: /\bbehavior\b/g, to: "behaviour" },
  { from: /\bbehaviors\b/g, to: "behaviours" },
  { from: /\bbehavioral\b/g, to: "behavioural" },
  { from: /\borganization\b/g, to: "organisation" },
  { from: /\borganizations\b/g, to: "organisations" },
  { from: /\borganize\b/g, to: "organise" },
  { from: /\borganized\b/g, to: "organised" },
  { from: /\borganizing\b/g, to: "organising" },
  { from: /\brecognize\b/g, to: "recognise" },
  { from: /\brecognized\b/g, to: "recognised" },
  { from: /\brecognizing\b/g, to: "recognising" },
  { from: /\bemphasize\b/g, to: "emphasise" },
  { from: /\bemphasized\b/g, to: "emphasised" },
  { from: /\bprioritize\b/g, to: "prioritise" },
  { from: /\bprioritized\b/g, to: "prioritised" },
  { from: /\banalyze\b/g, to: "analyse" },
  { from: /\banalyzed\b/g, to: "analysed" },
  { from: /\bsummarize\b/g, to: "summarise" },
  { from: /\bsummarized\b/g, to: "summarised" },
  { from: /\bcounselor\b/g, to: "counsellor" },
  { from: /\bcounselors\b/g, to: "counsellors" },
  { from: /\bcounseling\b/g, to: "counselling" },
  { from: /\bdefense\b/g, to: "defence" },
  { from: /\boffense\b/g, to: "offence" },
  { from: /\bcolor\b/g, to: "colour" },
  { from: /\bcolors\b/g, to: "colours" },
  { from: /\bneighbor\b/g, to: "neighbour" },
  { from: /\bneighbors\b/g, to: "neighbours" },
  { from: /\bfavor\b/g, to: "favour" },
  { from: /\bfavorite\b/g, to: "favourite" },
  { from: /\bcenter\b/g, to: "centre" },
  { from: /\bcenters\b/g, to: "centres" },
  { from: /\bpediatric\b/g, to: "paediatric" },
  { from: /\bprogram\b(?!\s+(?:files?|director|software))/g, to: "programme" },
  { from: /\bspecialize\b/g, to: "specialise" },
  { from: /\bspecialized\b/g, to: "specialised" },
  { from: /\bspecializing\b/g, to: "specialising" },
  { from: /\bcategorize\b/g, to: "categorise" },
  { from: /\bcategorized\b/g, to: "categorised" },
  { from: /\butilize\b/g, to: "utilise" },
  { from: /\butilized\b/g, to: "utilised" },
];

// ── Sanitise Output ────────────────────────────────────────────────────────
// Runs on every AI response before it reaches the caller. Strips banned
// phrases, fixes Americanisms, cleans up robotic patterns.

export function sanitiseOutput(text: string): string {
  if (!text) return text;

  let working = text;

  // Strip banned phrases (case-insensitive). Replace with empty string and
  // clean up any resulting double spaces or orphaned punctuation.
  for (const phrase of BANNED_PHRASES) {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    working = working.replace(new RegExp(escaped + "[,.]?\\s*", "gi"), "");
  }

  // Fix Americanisms.
  for (const sub of AMERICANISMS) {
    working = working.replace(sub.from, sub.to);
  }

  // Remove excessive semicolons — replace with full stops where they appear
  // more than once in a paragraph. Keep single semicolons that genuinely
  // separate related clauses.
  working = working.replace(/;(\s*;)+/g, ".");

  // Replace em dashes used as filler with commas.
  working = working.replace(/\s+—\s+/g, ", ");
  working = working.replace(/—/g, ", ");

  // Clean up artifacts from phrase removal.
  working = working
    .replace(/\.\s*\.\s+/g, ". ")
    .replace(/,\s*,/g, ",")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/^\s+/gm, (match) => match.replace(/ {2,}/g, ""));

  // Capitalise first letter after a full stop if phrase removal left a
  // lowercase start.
  working = working.replace(/\.\s+([a-z])/g, (_m, ch: string) => `. ${ch.toUpperCase()}`);

  return working.trim();
}

// ── Validate Output Safety ─────────────────────────────────────────────────
// Scans finished output for patterns that violate Cara safety rules. Returns
// a list of warnings — callers decide whether to block, flag for review, or
// log and continue.

const DIAGNOSTIC_PATTERNS: RegExp[] = [
  /\b(?:diagnos(?:ed?|is|tic)|ADHD|ASD|autism spectrum|attachment disorder|conduct disorder|oppositional defiant|reactive attachment)\b/i,
  /\bthe child (?:has|is|suffers from|presents with)\s+(?:a |an )?(?:disorder|syndrome|condition|diagnosis)\b/i,
];

const BLAME_PATTERNS: RegExp[] = [
  /\bthe child is manipulative\b/i,
  /\bthe child is attention[-\s]*seeking\b/i,
  /\bthe child is non[-\s]*compliant\b/i,
  /\bthe child (?:failed|refused) to (?:engage|comply|cooperate)\b/i,
  /\bstaff (?:failed|allowed|caused|let)\b/i,
  /\bstaff are to blame\b/i,
  /\bthe child(?:'s)? fault\b/i,
];

const UNSUPPORTED_CONCLUSION_PATTERNS: RegExp[] = [
  /\bthis clearly (?:proves|shows|demonstrates)\b/i,
  /\bwithout doubt\b/i,
  /\bit is certain that\b/i,
  /\bdefinitively\b/i,
  /\bundeniably\b/i,
  /\bconclusively (?:proves|shows|demonstrates)\b/i,
];

const INVENTED_EVIDENCE_PATTERNS: RegExp[] = [
  /\bfor example,?\s+on\s+\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\b/i,
  /\brecords show that on\s+\d{1,2}\/\d{1,2}\/\d{2,4}\b/i,
];

export function validateOutputSafety(content: string): { safe: boolean; warnings: string[] } {
  const warnings: string[] = [];

  for (const pattern of DIAGNOSTIC_PATTERNS) {
    if (pattern.test(content)) {
      warnings.push(
        `Possible diagnostic language detected (matched: ${pattern.source.slice(0, 60)}). Cara must not diagnose children.`,
      );
    }
  }

  for (const pattern of BLAME_PATTERNS) {
    if (pattern.test(content)) {
      warnings.push(
        `Blame language detected (matched: ${pattern.source.slice(0, 60)}). Behaviour communicates need — separate the child from the behaviour.`,
      );
    }
  }

  for (const pattern of UNSUPPORTED_CONCLUSION_PATTERNS) {
    if (pattern.test(content)) {
      warnings.push(
        `Unsupported conclusion language detected (matched: ${pattern.source.slice(0, 60)}). Cara must use tentative, evidence-based language.`,
      );
    }
  }

  for (const pattern of INVENTED_EVIDENCE_PATTERNS) {
    if (pattern.test(content)) {
      warnings.push(
        `Possibly invented evidence detected (specific date reference: ${pattern.source.slice(0, 60)}). Verify all dates and events against source records.`,
      );
    }
  }

  return {
    safe: warnings.length === 0,
    warnings,
  };
}
