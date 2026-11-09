// ══════════════════════════════════════════════════════════════════════════════
// CARA — "WHAT WOULD REMAIN?" LENS  (pure · deterministic · reflective)
//
// Practice-patterns brief B5 / pattern pp_beyond_documentation_human_layer:
// "There is a difference between protecting somebody from harm and protecting
// somebody from life." A compliant file can show a good service without showing
// a good LIFE. This lens asks, per child: if our service disappeared tomorrow,
// what would remain — lasting relationships, belonging, a life beyond paid
// support?
//
// REFUSAL DOCTRINE: this is a reflective lens, NOT a score. It never invents a
// pass/fail verdict. Where nothing is recorded it says so — a sparse result is
// a recording gap OR a real gap in the child's life, and the lens asks which
// rather than guessing. Cara's belonging/relationship signals feed it; the
// caller passes them in. Pure: no store, no AI, no imports.
// ══════════════════════════════════════════════════════════════════════════════

export interface PersonLink {
  /** e.g. "sibling", "parent", "grandparent", "friend", "mentor", "former_carer", "community". */
  relation: string;
  /** Is this a PAID professional relationship (staff, social worker, therapist)? */
  paid: boolean;
  /** Is the relationship currently active / maintained? */
  active: boolean;
}

export interface WhatWouldRemainInput {
  childRef: string;
  /** 0-100, if Cara has it (child_experience_snapshots.belonging_score). */
  belongingScore?: number | null;
  /** 0-100, if Cara has it (child_experience_snapshots.relationships_score). */
  relationshipsScore?: number | null;
  links: PersonLink[];
  /** Non-paid belonging: clubs, faith, hobbies, places, community. */
  communityTies: string[];
}

export interface WhatWouldRemainResult {
  childRef: string;
  /** What would remain beyond paid support (unpaid, active links + community ties). */
  enduring: string[];
  /** What is thin or relies on paid support — surfaced, never scored. */
  thin: string[];
  /** True only when there IS data and it shows what remains is all paid/inactive. */
  reliantOnPaidSupport: boolean;
  /** True when too little is recorded to answer — a gap to ask about, not a verdict. */
  insufficientlyRecorded: boolean;
  prompts: string[];
  summary: string;
}

const LENS_QUESTION = "If our service disappeared tomorrow, what would remain in this child's life?";
const LOW = 40;

export function whatWouldRemain(input: WhatWouldRemainInput): WhatWouldRemainResult {
  const enduringLinks = input.links.filter((l) => !l.paid && l.active);
  const enduring: string[] = [
    ...enduringLinks.map((l) => l.relation),
    ...input.communityTies,
  ];
  const thin: string[] = [];
  const prompts: string[] = [LENS_QUESTION];

  const nothingRecorded = input.links.length === 0 && input.communityTies.length === 0;
  if (nothingRecorded) {
    return {
      childRef: input.childRef,
      enduring: [],
      thin: ["Nothing is recorded about enduring relationships or community ties — this is a recording gap or a real gap in the child's life. Ask which."],
      reliantOnPaidSupport: false, // we don't know — do not assert it
      insufficientlyRecorded: true,
      prompts: [
        LENS_QUESTION,
        "What does this child have, or could have, that does not depend on us being here?",
      ],
      summary: "Not enough is recorded to say what would remain for this child — treat that as the finding.",
    };
  }

  const hasUnpaidActive = enduringLinks.length > 0;
  const hasCommunity = input.communityTies.length > 0;
  const reliantOnPaidSupport = !hasUnpaidActive && !hasCommunity;

  if (!hasUnpaidActive) thin.push("No unpaid, active relationships are recorded — connection relies on paid staff.");
  if (!hasCommunity) thin.push("No community ties (clubs, faith, hobbies, places) are recorded.");
  if (typeof input.belongingScore === "number" && input.belongingScore < LOW) {
    thin.push(`Belonging is thin (score ${input.belongingScore}).`);
  }
  if (typeof input.relationshipsScore === "number" && input.relationshipsScore < LOW) {
    thin.push(`Relationships are thin (score ${input.relationshipsScore}).`);
  }

  if (reliantOnPaidSupport) {
    prompts.push("What one lasting relationship or community connection could we help this child build this term?");
  }
  if (!hasCommunity) {
    prompts.push("What ordinary thing beyond the home could become part of this child's week?");
  }

  const summary = reliantOnPaidSupport
    ? "What would remain is thin — the child's recorded connection relies on paid support. This is a prompt to act, not a score."
    : `What would remain: ${enduring.join(", ")}. Protect and grow these alongside the paid support.`;

  return {
    childRef: input.childRef,
    enduring,
    thin,
    reliantOnPaidSupport,
    insufficientlyRecorded: false,
    prompts,
    summary,
  };
}
