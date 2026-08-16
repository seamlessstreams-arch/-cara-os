// ══════════════════════════════════════════════════════════════════════════════
// CARA — REG 45 SECTION DRAFT (deterministic)
//
// The four "Request Cara Draft" buttons on /quality/reg-45 were the last of the
// #934 dead-button baseline still standing, held back because the tenant's AI
// credits are exhausted. They do not need AI. Regulation 45 asks the registered
// person to review the quality of care against the home's own records — which
// is an assembly problem, not a writing one.
//
// ── What this produces, and what it refuses to ──────────────────────────────
//
// It produces the EVIDENCE BASE for a section: what the home recorded in the
// period, counted, named, and paired with the questions the section must
// answer. Every line is traceable to a record.
//
// It does NOT produce the judgement. Reg 45(4) requires the registered person's
// OPINION on the quality of care and on whether children are safeguarded — and
// an opinion Cara wrote is not the registered person's opinion. So the draft
// ends at the evidence and hands over, in the same way the Reg 44 engine never
// auto-meets the protection standard.
//
// It also refuses to be encouraging about an empty record. A section with no
// evidence behind it produces "nothing recorded for this period" — which is
// itself the most useful thing the review can say, because a Reg 45 with no
// evidence base is the finding.
// ══════════════════════════════════════════════════════════════════════════════

/** The eight narrative sections and four stakeholder sections of a review. */
export type Reg45SectionKey =
  | "qualityOfCareSummary"
  | "childrenExperiencesSummary"
  | "outcomesSummary"
  | "safeguardingSummary"
  | "leadershipSummary"
  | "strengths"
  | "weaknesses"
  | "improvementActions"
  | "childrenViews"
  | "parentsViews"
  | "placingAuthorityViews"
  | "staffViews";

export interface EvidenceCategoryCount {
  category: string;
  count: number;
  examples: string[];
}

export interface Reg45DraftInput {
  homeName: string;
  periodStart: string;
  periodEnd: string;
  evidence: EvidenceCategoryCount[];
}

export interface Reg45SectionDraft {
  /** The assembled evidence base, ready to paste and write over. */
  text: string;
  /** True when at least one relevant record exists for this section. */
  hasEvidence: boolean;
  /** Evidence categories this section looks for and did not find. */
  missing: string[];
}

/**
 * Which recorded categories bear on which section.
 *
 * Matching is by exact category name, not substring: "Incident Records" must
 * not be pulled into a section because some other category happens to contain
 * the word "record". Categories the home does not record simply do not appear.
 */
const SECTION_EVIDENCE: Record<Reg45SectionKey, string[]> = {
  qualityOfCareSummary: ["Daily Logs", "Key-Work Sessions", "Health Assessments", "Education Records"],
  childrenExperiencesSummary: ["Voice of the Child", "Daily Logs", "Complaints & Compliments"],
  outcomesSummary: ["Education Records", "Health Assessments", "Key-Work Sessions"],
  safeguardingSummary: ["Incident Records", "Reg 44 Reports", "Complaints & Compliments"],
  leadershipSummary: ["Supervision Records", "Training Records", "Reg 44 Reports"],
  strengths: ["Daily Logs", "Key-Work Sessions", "Voice of the Child", "Complaints & Compliments"],
  weaknesses: ["Incident Records", "Complaints & Compliments", "Training Records"],
  improvementActions: ["Reg 44 Reports", "Incident Records"],
  childrenViews: ["Voice of the Child", "Complaints & Compliments"],
  parentsViews: ["Complaints & Compliments"],
  placingAuthorityViews: ["Reg 44 Reports"],
  staffViews: ["Supervision Records", "Training Records"],
};

/**
 * The questions each section must answer. These are prompts for the registered
 * person, never answers — which is the line between assembling evidence and
 * writing someone's professional opinion for them.
 */
const SECTION_QUESTIONS: Record<Reg45SectionKey, string[]> = {
  qualityOfCareSummary: [
    "What did care actually look like for each child this period?",
    "Where did the home's practice differ from its Statement of Purpose?",
  ],
  childrenExperiencesSummary: [
    "What did children say, in their own words?",
    "What changed as a result of something a child said?",
  ],
  outcomesSummary: [
    "Which outcomes moved, and what does the home attribute that to?",
    "Where has progress stalled, and what is being done?",
  ],
  safeguardingSummary: [
    "Were children protected from harm this period, and how is that evidenced?",
    "What did the home learn from each incident, and what changed?",
  ],
  leadershipSummary: [
    "How did leaders know what was happening in the home?",
    "What did management oversight change?",
  ],
  strengths: ["What is this home doing well that another home could learn from?"],
  weaknesses: ["What is not good enough yet, stated plainly?"],
  improvementActions: [
    "What will be done, by whom, and by when?",
    "How will the home know it worked?",
  ],
  childrenViews: ["Recorded in children's own words — not paraphrased into adult language."],
  parentsViews: ["Who was asked, who replied, and who did not?"],
  placingAuthorityViews: ["What did placing authorities say about this placement?"],
  staffViews: ["What did staff raise, and what happened to it?"],
};

const SECTION_LABELS: Record<Reg45SectionKey, string> = {
  qualityOfCareSummary: "Quality of Care",
  childrenExperiencesSummary: "Children's Experiences",
  outcomesSummary: "Outcomes",
  safeguardingSummary: "Safeguarding",
  leadershipSummary: "Leadership & Management",
  strengths: "Strengths",
  weaknesses: "Areas for Improvement",
  improvementActions: "Improvement Actions",
  childrenViews: "Children's Views",
  parentsViews: "Parents & Carers Views",
  placingAuthorityViews: "Placing Authority Views",
  staffViews: "Staff Views",
};

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/**
 * Assemble the evidence base for one section of a Reg 45 review.
 *
 * Deterministic: the same records and period always produce the same text, so
 * two people drafting the same section see the same evidence.
 */
export function buildReg45SectionDraft(
  section: Reg45SectionKey,
  input: Reg45DraftInput,
): Reg45SectionDraft {
  const wanted = SECTION_EVIDENCE[section];
  const byCategory = new Map(input.evidence.map((e) => [e.category, e]));

  // Only categories with something actually recorded count as evidence. A
  // category present with count 0 is a gap, not a source.
  const found = wanted
    .map((c) => byCategory.get(c))
    .filter((e): e is EvidenceCategoryCount => !!e && e.count > 0);
  const missing = wanted.filter((c) => (byCategory.get(c)?.count ?? 0) === 0);

  const header = `${SECTION_LABELS[section]} — ${input.homeName}, ${input.periodStart} to ${input.periodEnd}`;
  const lines: string[] = [header, ""];

  if (found.length === 0) {
    lines.push(
      "No records were found for this section in this period.",
      "",
      `Cara looked for: ${wanted.join(", ")}.`,
      "",
      "An empty evidence base is itself a finding for the review — it does not mean nothing happened, " +
        "it means nothing was recorded, and Regulation 45 has to be written from records.",
    );
    return { text: lines.join("\n"), hasEvidence: false, missing };
  }

  lines.push("Recorded in this period:");
  for (const e of found) {
    const examples = e.examples.filter((x) => x.trim());
    lines.push(
      `  • ${plural(e.count, e.category.replace(/s$/, ""), e.category)}` +
        (examples.length ? ` — including: ${examples.join("; ")}` : ""),
    );
  }

  if (missing.length > 0) {
    lines.push(
      "",
      `Nothing recorded under: ${missing.join(", ")}. ` +
        "That gap belongs in the review as much as the evidence does.",
    );
  }

  lines.push(
    "",
    "The review must answer:",
    ...SECTION_QUESTIONS[section].map((q) => `  • ${q}`),
    "",
    "— Cara has assembled the evidence above from the home's own records. The judgement, and the " +
      "words it is written in, are the registered person's. Regulation 45 asks for their opinion, " +
      "and an opinion Cara wrote would not be it.",
  );

  return { text: lines.join("\n"), hasEvidence: true, missing };
}

/** Whether a section has any evidence behind it — for showing the gap up front. */
export function reg45SectionHasEvidence(
  section: Reg45SectionKey,
  evidence: EvidenceCategoryCount[],
): boolean {
  const byCategory = new Map(evidence.map((e) => [e.category, e]));
  return SECTION_EVIDENCE[section].some((c) => (byCategory.get(c)?.count ?? 0) > 0);
}
