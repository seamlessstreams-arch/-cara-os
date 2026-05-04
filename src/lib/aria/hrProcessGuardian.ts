// ══════════════════════════════════════════════════════════════════════════════
// ARIA — HR PROCESS GUARDIAN
//
// Reviews a draft HR action (letter, meeting outcome, suspension decision,
// disciplinary outcome, grievance response, probation decision, sickness
// meeting outcome) BEFORE the manager approves it. Checks fairness, ACAS-
// aligned process, safeguarding linkage, proportionality, discrimination
// risk, evidence quality, representation rights, appeal rights, and the
// wording of the draft itself.
//
// Output is "Aria suggested draft" — never final until a human approves.
//
// Pipeline:
//   1. Deterministic rule-based analysis (audit-traceable, runs offline)
//   2. Optional LLM enhancement (Anthropic) for safer-wording suggestion
//   3. Returns the typed GuardianReview the API persists to Supabase
//
// Companion module to:
//   - managementOversightEngine.ts (single record oversight)
//   - voiceOfChildSummariser.ts (voice across many records)
//   - this engine (HR action fairness gate)
//
// All three share writingStyleRules.ts for the human tone.
// ══════════════════════════════════════════════════════════════════════════════

import Anthropic from "@anthropic-ai/sdk";
import {
  ARIA_WRITING_STYLE_PROMPT,
  applyAriaPostprocessor,
} from "@/lib/aria/writingStyleRules";

// ─── Public types ─────────────────────────────────────────────────────────────

export type GuardianActionType =
  | "investigation_invite"
  | "witness_invite"
  | "disciplinary_invite"
  | "grievance_invite"
  | "suspension"
  | "suspension_review"
  | "written_warning"
  | "final_written_warning"
  | "dismissal"
  | "appeal_outcome"
  | "probation_outcome"
  | "sickness_meeting"
  | "capability_meeting"
  | "no_further_action"
  | "safeguarding_allegation_response"
  | "generic_hr_action";

export type FairnessJudgement =
  | "safe_to_approve"
  | "review_recommended"
  | "do_not_approve_yet";

export interface GuardianInput {
  caseId?: string;
  staffId?: string;
  homeId?: string;
  draftSubject: string;
  draftActionType: GuardianActionType;
  draftBody: string;

  // Optional context that strengthens the analysis when provided.
  caseContext?: {
    safeguardingStatus?: string;
    childImpactStatus?: string;
    priorWarnings?: string[];
    investigationCompleted?: boolean;
    employeeMet?: boolean;
    representationOffered?: boolean;
    appealRightsCommunicated?: boolean;
    evidenceShared?: boolean;
    mitigationConsidered?: boolean;
    consistencyWithPriorCases?: string;
    medicalAdviceSought?: boolean;
    reasonableAdjustmentsConsidered?: boolean;
    stressAtWorkConsidered?: boolean;
    rotaImpactReviewed?: boolean;
    timeToImproveGiven?: boolean;
    standardsClear?: boolean;
    supportOffered?: boolean;
  };

  enableLlm?: boolean;
}

export type FlagSeverity = "info" | "advisory" | "warning" | "block";

export interface GuardianFlag {
  category:
    | "fairness_acas"
    | "safeguarding"
    | "discrimination"
    | "proportionality"
    | "rights"
    | "evidence"
    | "wording"
    | "prejudgment"
    | "consistency";
  severity: FlagSeverity;
  message: string;
  suggestion?: string;
}

export interface GuardianReview {
  generatedAt: string;
  status: "draft";
  ariaLabel: "Aria suggested draft";

  fairnessScore: number;
  fairnessJudgement: FairnessJudgement;

  acasAlignment: Record<string, boolean | string>;
  safeguardingAlignment: Record<string, boolean | string>;
  discriminationRisk: { score: number; signals: string[] };
  proportionality: { rating: "proportionate" | "borderline" | "disproportionate"; rationale: string };
  rightsCheck: {
    rightToBeAccompanied: boolean;
    appealRightsCommunicated: boolean;
    representationOffered: boolean;
    rationale: string;
  };
  evidenceQuality: {
    rating: "strong" | "adequate" | "thin" | "absent";
    notes: string[];
  };
  wordingRisk: {
    rating: "safe" | "review" | "rewrite";
    issues: string[];
  };
  prejudgmentSignals: string[];

  flags: GuardianFlag[];
  suggestedSaferWording?: string;
  suggestedActions: SuggestedAction[];
  regulatoryLinks: string[];

  ariaConfidence: number;
  llmUsed: boolean;
  engineVersion: string;
}

export interface SuggestedAction {
  title: string;
  description: string;
  priority: "urgent" | "high" | "medium" | "low";
  dueDays: number;
  assignedRole: string;
}

const ENGINE_VERSION = "1.0.0";

// ─── Detection rules ─────────────────────────────────────────────────────────

const PREJUDGMENT_PATTERNS: RegExp[] = [
  /\bclearly\b/i,
  /\bobviously\b/i,
  /\bwithout (?:any )?doubt\b/i,
  /\bproven (?:fact|guilty|misconduct)\b/i,
  /\bthere is no question\b/i,
  /\bbeyond dispute\b/i,
  /\bsimply (?:cannot|will not)\s+be\s+tolerated\b/i,
  /\beveryone (?:knows|agrees)\b/i,
  /\byou (?:always|never)\b/i,
];

const EMOTIONAL_PATTERNS: RegExp[] = [
  /\bdisgust(?:ed|ing)\b/i,
  /\bappalling\b/i,
  /\bunbelievable\b/i,
  /\bpathetic\b/i,
  /\bridiculous\b/i,
  /\boutrageous\b/i,
  /\bshameful\b/i,
];

const BLAME_PATTERNS: RegExp[] = [
  /\byou (?:failed|refused) to\b/i,
  /\byour (?:negligence|incompetence)\b/i,
  /\b(?:you are|you're) (?:lazy|disrespectful|unprofessional)\b/i,
];

const PROTECTED_CHARACTERISTIC_HINTS: { signal: RegExp; characteristic: string }[] = [
  { signal: /\b(?:pregnan(?:t|cy)|maternity)\b/i, characteristic: "pregnancy / maternity" },
  { signal: /\b(?:disabilit(?:y|ies)|disabled|long[\s-]*term\s+condition)\b/i, characteristic: "disability" },
  { signal: /\b(?:race|racial|ethnicity|nationality)\b/i, characteristic: "race" },
  { signal: /\b(?:religion|religious|faith|belief)\b/i, characteristic: "religion or belief" },
  { signal: /\b(?:gay|lesbian|bisexual|trans(?:gender)?|sexual\s+orientation|gender\s+reassignment)\b/i, characteristic: "sexual orientation / gender reassignment" },
  { signal: /\b(?:age(?:ing|d)?|too\s+old|too\s+young)\b/i, characteristic: "age" },
  { signal: /\bmarital\s+status\b/i, characteristic: "marriage and civil partnership" },
];

const ACAS_KEYWORDS_BY_TYPE: Partial<Record<GuardianActionType, string[]>> = {
  investigation_invite: ["investigate", "investigation", "fact", "find", "meet", "discuss"],
  disciplinary_invite: ["disciplinary", "hearing", "evidence", "outcome", "represent", "accompan"],
  grievance_invite: ["grievance", "concern", "raise", "investigate", "meeting", "outcome"],
  suspension: ["suspension", "neutral", "pending", "review"],
  written_warning: ["formal warning", "written warning", "improvement", "appeal"],
  final_written_warning: ["final written warning", "improvement", "appeal", "next stage"],
  dismissal: ["decision", "appeal", "right", "effective from"],
  appeal_outcome: ["appeal", "outcome", "considered", "decision"],
  probation_outcome: ["probation", "review", "feedback", "decision"],
  sickness_meeting: ["welfare", "support", "absence", "occupational health"],
  capability_meeting: ["capability", "improvement", "support", "review"],
  safeguarding_allegation_response: ["allegation", "neutral", "investigation", "support"],
};

// ─── Core checks ─────────────────────────────────────────────────────────────

function detectPrejudgment(text: string): { signals: string[]; matches: GuardianFlag[] } {
  const signals: string[] = [];
  const flags: GuardianFlag[] = [];

  for (const re of PREJUDGMENT_PATTERNS) {
    const m = re.exec(text);
    if (m) {
      const phrase = m[0];
      signals.push(phrase);
      flags.push({
        category: "prejudgment",
        severity: "warning",
        message: `Phrase "${phrase}" sounds like a conclusion has already been reached.`,
        suggestion:
          "Replace with neutral language such as 'It appears that', 'On the evidence available' or 'A view will be reached after the meeting'.",
      });
    }
  }
  for (const re of EMOTIONAL_PATTERNS) {
    const m = re.exec(text);
    if (m) {
      signals.push(m[0]);
      flags.push({
        category: "wording",
        severity: "warning",
        message: `Emotional language detected: "${m[0]}". HR drafts should be neutral.`,
        suggestion:
          "Re-state the concern in factual terms. Describe the behaviour, the standard expected, and the impact, without value judgements.",
      });
    }
  }
  for (const re of BLAME_PATTERNS) {
    const m = re.exec(text);
    if (m) {
      signals.push(m[0]);
      flags.push({
        category: "wording",
        severity: "warning",
        message: `Blame-style phrasing detected: "${m[0]}".`,
        suggestion:
          "Rephrase as an evidenced concern about specific behaviour and its impact, separated from the person.",
      });
    }
  }

  return { signals, matches: flags };
}

function checkAcasAlignment(input: GuardianInput): {
  alignment: Record<string, boolean | string>;
  flags: GuardianFlag[];
} {
  const flags: GuardianFlag[] = [];
  const alignment: Record<string, boolean | string> = {};
  const ctx = input.caseContext ?? {};

  // Common to all formal HR actions: representation rights and appeal rights.
  const formal: GuardianActionType[] = [
    "disciplinary_invite",
    "written_warning",
    "final_written_warning",
    "dismissal",
    "appeal_outcome",
    "grievance_invite",
    "capability_meeting",
  ];

  if (formal.includes(input.draftActionType)) {
    if (
      !/\b(?:right to be accompani|may be accompanied|colleague|trade\s+union|companion)\b/i.test(
        input.draftBody,
      ) &&
      !ctx.representationOffered
    ) {
      alignment.right_to_be_accompanied = false;
      flags.push({
        category: "rights",
        severity: "block",
        message:
          "The draft does not state the right to be accompanied. This is a statutory right at any formal disciplinary or grievance hearing.",
        suggestion:
          'Include wording such as: "You have the right to be accompanied at this meeting by a work colleague or a trade union representative."',
      });
    } else {
      alignment.right_to_be_accompanied = true;
    }
  }

  if (
    ["written_warning", "final_written_warning", "dismissal", "probation_outcome"].includes(
      input.draftActionType,
    )
  ) {
    if (
      !/\b(?:right of appeal|appeal\s+(?:this|the)\s+(?:decision|outcome)|to appeal)\b/i.test(
        input.draftBody,
      ) &&
      !ctx.appealRightsCommunicated
    ) {
      alignment.appeal_rights_communicated = false;
      flags.push({
        category: "rights",
        severity: "block",
        message: "The draft does not communicate the right of appeal.",
        suggestion:
          'Include wording such as: "You have the right to appeal this decision in writing within 5 working days of the date of this letter."',
      });
    } else {
      alignment.appeal_rights_communicated = true;
    }
  }

  if (
    input.draftActionType === "disciplinary_invite" ||
    input.draftActionType === "dismissal" ||
    input.draftActionType === "written_warning" ||
    input.draftActionType === "final_written_warning"
  ) {
    alignment.investigation_completed = ctx.investigationCompleted ?? false;
    if (!ctx.investigationCompleted) {
      flags.push({
        category: "fairness_acas",
        severity: "warning",
        message:
          "The case context does not confirm that an investigation has been completed. ACAS expects an investigation before formal action.",
        suggestion:
          "Confirm in the case record that the investigation is complete and the report has been shared with the employee.",
      });
    }
    alignment.evidence_shared_with_employee = ctx.evidenceShared ?? false;
    if (!ctx.evidenceShared) {
      flags.push({
        category: "fairness_acas",
        severity: "warning",
        message: "Evidence does not appear to have been shared with the employee in advance.",
        suggestion:
          "Make sure the employee has had reasonable time to review the evidence before any meeting where they may need to respond to it.",
      });
    }
    alignment.mitigation_considered = ctx.mitigationConsidered ?? false;
  }

  // Action-type-specific keyword presence.
  const expected = ACAS_KEYWORDS_BY_TYPE[input.draftActionType];
  if (expected) {
    const missing = expected.filter(
      (k) => !new RegExp(`\\b${k.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}`, "i").test(input.draftBody),
    );
    alignment.expected_terms_present = missing.length === 0
      ? "all_present"
      : `missing: ${missing.join(", ")}`;
    if (missing.length > 0) {
      flags.push({
        category: "fairness_acas",
        severity: "advisory",
        message: `Expected terms for a ${input.draftActionType.replace(/_/g, " ")} are missing: ${missing.join(", ")}.`,
      });
    }
  }

  return { alignment, flags };
}

function checkSafeguarding(input: GuardianInput): {
  alignment: Record<string, boolean | string>;
  flags: GuardianFlag[];
} {
  const flags: GuardianFlag[] = [];
  const alignment: Record<string, boolean | string> = {};
  const ctx = input.caseContext ?? {};

  const safeguardingFlagged =
    ctx.safeguardingStatus !== undefined &&
    ctx.safeguardingStatus !== "" &&
    ctx.safeguardingStatus !== "not_safeguarding";

  alignment.safeguarding_status = ctx.safeguardingStatus ?? "not_recorded";
  alignment.child_impact_status = ctx.childImpactStatus ?? "not_recorded";

  if (input.draftActionType === "suspension") {
    if (!/\bneutral\b/i.test(input.draftBody)) {
      flags.push({
        category: "safeguarding",
        severity: "block",
        message:
          "Suspension letters must state that suspension is a neutral act pending investigation.",
        suggestion:
          'Include wording such as: "This suspension is a neutral act and is not a disciplinary sanction. It is in place to allow a fair and proportionate investigation to take place."',
      });
    }
    if (!/\b(?:welfare|support|contact)\b/i.test(input.draftBody)) {
      flags.push({
        category: "safeguarding",
        severity: "warning",
        message:
          "Suspension letters should set out a welfare plan and a single point of contact for the staff member.",
        suggestion:
          "Add a paragraph naming the welfare contact and confirming that suspension reviews will take place at agreed intervals.",
      });
    }
  }

  if (
    input.draftActionType === "safeguarding_allegation_response" ||
    safeguardingFlagged
  ) {
    if (!/\bLADO\b/i.test(input.draftBody) && !ctx.safeguardingStatus?.startsWith("lado_")) {
      flags.push({
        category: "safeguarding",
        severity: "warning",
        message:
          "The case touches safeguarding. The draft does not reference LADO. Confirm whether LADO advice has been sought and recorded.",
        suggestion:
          "If LADO has been consulted, reflect the advice in the case file. If not, consider whether the threshold has been met before progressing.",
      });
    }
    if (input.caseContext?.childImpactStatus === undefined) {
      flags.push({
        category: "safeguarding",
        severity: "warning",
        message:
          "Child impact status has not been recorded. HR cases involving safeguarding must include a child impact view.",
      });
    }
  }

  return { alignment, flags };
}

function checkDiscrimination(text: string): {
  risk: { score: number; signals: string[] };
  flags: GuardianFlag[];
} {
  const flags: GuardianFlag[] = [];
  const signals: string[] = [];
  let score = 0;

  for (const { signal, characteristic } of PROTECTED_CHARACTERISTIC_HINTS) {
    if (signal.test(text)) {
      signals.push(characteristic);
      score += 1;
      flags.push({
        category: "discrimination",
        severity: "advisory",
        message: `Reference to ${characteristic} detected in the draft. Make sure the action is grounded in conduct or capability rather than the protected characteristic itself.`,
        suggestion:
          "Document why this reference is necessary, what objective justification supports it, and whether reasonable adjustments or proportionate alternatives have been considered.",
      });
    }
  }

  return { risk: { score, signals }, flags };
}

function checkProportionality(input: GuardianInput): {
  proportionality: GuardianReview["proportionality"];
  flags: GuardianFlag[];
} {
  const flags: GuardianFlag[] = [];
  const ctx = input.caseContext ?? {};
  const priorWarnings = ctx.priorWarnings ?? [];

  let rating: GuardianReview["proportionality"]["rating"] = "proportionate";
  let rationale = "Outcome appears proportionate based on the case context provided.";

  if (input.draftActionType === "dismissal") {
    if (priorWarnings.length === 0 && ctx.investigationCompleted !== true) {
      rating = "disproportionate";
      rationale =
        "Dismissal without prior warnings on file and without a completed investigation reads as disproportionate. Confirm the case is gross misconduct or that the disciplinary procedure has been followed in full.";
      flags.push({
        category: "proportionality",
        severity: "block",
        message: rationale,
      });
    } else if (priorWarnings.length === 0) {
      rating = "borderline";
      rationale =
        "Dismissal without prior warnings on file is borderline. This is only proportionate if the case is gross misconduct, and the rationale should make that explicit.";
      flags.push({
        category: "proportionality",
        severity: "warning",
        message: rationale,
      });
    }
  }

  if (input.draftActionType === "final_written_warning" && priorWarnings.length === 0) {
    rating = rating === "proportionate" ? "borderline" : rating;
    rationale =
      "Issuing a final written warning without a prior written warning on file is borderline. The case rationale must show why the seriousness justifies skipping the standard step.";
    flags.push({
      category: "proportionality",
      severity: "warning",
      message: rationale,
    });
  }

  return { proportionality: { rating, rationale }, flags };
}

function checkEvidence(input: GuardianInput): {
  evidence: GuardianReview["evidenceQuality"];
  flags: GuardianFlag[];
} {
  const flags: GuardianFlag[] = [];
  const notes: string[] = [];
  const wordCount = input.draftBody.trim().split(/\s+/).length;
  let rating: GuardianReview["evidenceQuality"]["rating"] = "adequate";

  if (wordCount < 80) {
    rating = "thin";
    notes.push("Draft is short. Formal HR letters should set out the basis for the action clearly.");
    flags.push({
      category: "evidence",
      severity: "warning",
      message: notes[notes.length - 1],
    });
  }
  if (!/\b(?:on|dated|date of)\s+\d|\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/i.test(input.draftBody)) {
    notes.push("No specific dates referenced. Decisions and meetings should be dated explicitly.");
  }
  if (
    /\b(?:dismiss(?:al)?|warning|sanction)\b/i.test(input.draftBody) &&
    !/\b(?:incident|behaviour|conduct|allegation|concern|matter)\b/i.test(input.draftBody)
  ) {
    notes.push("Outcome wording is present but the underlying concern is not described.");
    flags.push({
      category: "evidence",
      severity: "warning",
      message:
        "The outcome is described but the underlying concern is not. Set out what was alleged or observed before stating what the outcome is.",
    });
  }
  if (notes.length === 0) {
    rating = "strong";
    notes.push("Draft references the basis for the action clearly enough.");
  }

  return { evidence: { rating, notes }, flags };
}

function checkRights(input: GuardianInput): {
  rights: GuardianReview["rightsCheck"];
  flags: GuardianFlag[];
} {
  const flags: GuardianFlag[] = [];
  const ctx = input.caseContext ?? {};

  const rightToBeAccompanied =
    /\b(?:right to be accompani|may be accompanied|colleague|trade\s+union|companion)\b/i.test(
      input.draftBody,
    ) || ctx.representationOffered === true;

  const appealRightsCommunicated =
    /\b(?:right of appeal|appeal\s+(?:this|the)\s+(?:decision|outcome)|to appeal)\b/i.test(
      input.draftBody,
    ) || ctx.appealRightsCommunicated === true;

  const representationOffered =
    rightToBeAccompanied || ctx.representationOffered === true;

  let rationale = "Rights wording is present.";
  if (!rightToBeAccompanied) {
    rationale =
      "Right to be accompanied is not referenced. Add this where the action requires a meeting.";
  } else if (!appealRightsCommunicated) {
    rationale =
      "Right of appeal is not referenced. Add this for any decision letter that imposes a sanction.";
  }

  return {
    rights: {
      rightToBeAccompanied,
      appealRightsCommunicated,
      representationOffered,
      rationale,
    },
    flags,
  };
}

function checkConsistency(input: GuardianInput): GuardianFlag[] {
  const flags: GuardianFlag[] = [];
  if (input.caseContext?.consistencyWithPriorCases === undefined) {
    flags.push({
      category: "consistency",
      severity: "advisory",
      message:
        "No consistency check has been recorded. Confirm in the case file how this outcome compares with similar cases in the home or organisation.",
    });
  }
  return flags;
}

// ─── Suggested actions ───────────────────────────────────────────────────────

function buildSuggestedActions(
  input: GuardianInput,
  flags: GuardianFlag[],
  judgement: FairnessJudgement,
): SuggestedAction[] {
  const out: SuggestedAction[] = [];

  if (judgement === "do_not_approve_yet") {
    out.push({
      title: "Do not approve until blocking issues are resolved",
      description:
        "The Process Guardian has flagged at least one blocking issue. Address the items marked as block before re-running the Guardian.",
      priority: "urgent",
      dueDays: 1,
      assignedRole: "Registered Manager / HR Caseworker",
    });
  }

  if (flags.some((f) => f.category === "rights")) {
    out.push({
      title: "Add representation and appeal rights wording",
      description:
        "Make sure the right to be accompanied and the right of appeal are stated clearly in the letter, with timescales and how to lodge an appeal.",
      priority: "high",
      dueDays: 2,
      assignedRole: "HR Caseworker",
    });
  }

  if (flags.some((f) => f.category === "safeguarding")) {
    out.push({
      title: "Confirm safeguarding handling alongside HR action",
      description:
        "Where the case touches safeguarding, confirm that LADO advice has been sought, the child impact has been recorded, and any restrictions on duties are in place before the HR action proceeds.",
      priority: "urgent",
      dueDays: 1,
      assignedRole: "Designated Safeguarding Lead / Registered Manager",
    });
  }

  if (flags.some((f) => f.category === "wording" || f.category === "prejudgment")) {
    out.push({
      title: "Reword the draft using neutral, evidenced language",
      description:
        "The Guardian has flagged wording that reads as prejudged or emotional. Aria has produced a safer-wording suggestion, but the Registered Manager retains final authorship.",
      priority: "high",
      dueDays: 2,
      assignedRole: "Registered Manager",
    });
  }

  if (flags.some((f) => f.category === "discrimination")) {
    out.push({
      title: "Document objective justification",
      description:
        "Record why any reference to a protected characteristic is necessary, what reasonable adjustments have been considered, and whether the action remains proportionate.",
      priority: "high",
      dueDays: 3,
      assignedRole: "HR Admin / Registered Manager",
    });
  }

  return out;
}

// ─── Templated safer wording (deterministic fallback) ────────────────────────

function buildTemplatedSaferWording(
  input: GuardianInput,
  rights: GuardianReview["rightsCheck"],
  proportionality: GuardianReview["proportionality"],
): string {
  const lines: string[] = [];

  lines.push(`Aria suggested draft. Safer wording for ${input.draftActionType.replace(/_/g, " ")}.`);
  lines.push(``);
  lines.push(
    `This suggestion is a starting point. The Registered Manager remains the author of the final letter and must adapt the wording to the specifics of the case before sending.`,
  );
  lines.push(``);

  switch (input.draftActionType) {
    case "suspension":
      lines.push(
        `Following the concerns raised on [date], a decision has been taken to suspend you from work with effect from [date]. This suspension is a neutral act and is not a disciplinary sanction. It is in place to allow a fair and proportionate investigation to take place.`,
      );
      lines.push(
        `Your single point of contact during this period will be [name, role, contact]. Suspension will be reviewed at intervals of no more than [X] days, and the first review will take place on [date].`,
      );
      lines.push(
        `You may seek support from your trade union, a colleague, or an external source such as ACAS. We will treat your welfare as a priority during this period.`,
      );
      break;
    case "disciplinary_invite":
      lines.push(
        `You are invited to a disciplinary meeting on [date] at [time], to be held at [location] or by [video platform].`,
      );
      lines.push(
        `The purpose of the meeting is to consider the following concerns: [set out the specific concerns, with dates and a clear reference to the evidence].`,
      );
      lines.push(
        `Copies of the documents that will be relied on at the meeting are enclosed. Please review them in advance and bring any additional information you wish to be considered.`,
      );
      lines.push(
        `You have the right to be accompanied at this meeting by a work colleague or a trade union representative. Please let [name] know in advance who will accompany you.`,
      );
      lines.push(
        `If you are unable to attend on the date proposed, please contact [name] to agree an alternative within 5 working days.`,
      );
      break;
    case "written_warning":
    case "final_written_warning":
      lines.push(
        `Following the disciplinary meeting held on [date], a decision has been reached. The decision is to issue a ${input.draftActionType.replace(/_/g, " ")}.`,
      );
      lines.push(
        `The basis for this decision is: [set out the findings of fact, the standard expected, the impact, and what mitigation was considered].`,
      );
      lines.push(
        `The expectations going forward are: [set out the standard expected, the support that will be provided, and the period during which the warning will remain on your record].`,
      );
      lines.push(
        `You have the right to appeal this decision in writing within 5 working days of the date of this letter. Please address any appeal to [name].`,
      );
      break;
    case "dismissal":
      lines.push(
        `Following the disciplinary meeting held on [date], the decision has been reached that your employment will end with effect from [date].`,
      );
      lines.push(
        `The basis for this decision is: [set out the findings, the standard expected, the seriousness, and what mitigation was considered]. The decision has been reached after considering the available alternatives.`,
      );
      lines.push(
        `You have the right to appeal this decision in writing within 5 working days of the date of this letter. Please address any appeal to [name].`,
      );
      break;
    case "grievance_invite":
      lines.push(
        `Thank you for raising your grievance on [date]. We take your concerns seriously and will investigate them fairly and without delay.`,
      );
      lines.push(
        `You are invited to a meeting on [date] at [time], to be held at [location] or by [video platform], to discuss the points you have raised.`,
      );
      lines.push(
        `You have the right to be accompanied at this meeting by a work colleague or a trade union representative. Please let [name] know in advance who will accompany you.`,
      );
      break;
    case "no_further_action":
      lines.push(
        `Following the matters raised on [date] and the steps that have been taken since, the decision has been reached that no further action will be taken at this time.`,
      );
      lines.push(
        `This letter is being sent so that the position is clear on your record. We thank you for your engagement with the process.`,
      );
      break;
    default:
      lines.push(
        `[Set out the purpose of the letter, the relevant dates, the standard expected, the basis for any decision, the support available, and the rights that apply.]`,
      );
      lines.push(
        rights.rightToBeAccompanied
          ? `[Right to be accompanied wording confirmed.]`
          : `Add: "You have the right to be accompanied at this meeting by a work colleague or a trade union representative."`,
      );
      lines.push(
        rights.appealRightsCommunicated
          ? `[Right of appeal wording confirmed where applicable.]`
          : `Add (where applicable): "You have the right to appeal this decision in writing within 5 working days of the date of this letter."`,
      );
  }

  if (proportionality.rating !== "proportionate") {
    lines.push(``);
    lines.push(
      `Note on proportionality: the Process Guardian has rated the proposed outcome as ${proportionality.rating}. ${proportionality.rationale}`,
    );
  }

  lines.push(``);
  lines.push(
    `This wording is an Aria suggested draft. It must be reviewed, edited, and approved by the Registered Manager before it forms part of the regulatory record or is sent.`,
  );

  return applyAriaPostprocessor(lines.join("\n\n"));
}

// ─── Optional LLM enhancement ────────────────────────────────────────────────

async function enhanceWithLlm(
  input: GuardianInput,
  deterministic: GuardianReview,
): Promise<{ saferWording?: string } | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const client = new Anthropic({ apiKey });

  const system = [
    `You are Aria, the HR Process Guardian for a UK residential children's home. You are not the decision-maker. The Registered Manager remains the author and the decision-maker. Your role is to suggest safer wording for an HR letter that has been flagged for review.`,
    ``,
    `Hard rules:`,
    `- Label the wording clearly as an Aria suggested draft.`,
    `- Use only the case context provided. Do not invent facts.`,
    `- ACAS-aligned, neutral, evidence-led. No prejudgment.`,
    `- Always include the right to be accompanied where a meeting is involved.`,
    `- Always include the right of appeal where the action imposes a sanction.`,
    `- For suspension letters, state that suspension is a neutral act pending investigation.`,
    `- For safeguarding-touching matters, hold a neutral tone and do not pre-empt LADO findings.`,
    ``,
    ARIA_WRITING_STYLE_PROMPT,
  ].join("\n");

  const userMessage = [
    `ACTION TYPE: ${input.draftActionType}`,
    `SUBJECT: ${input.draftSubject}`,
    ``,
    `CURRENT DRAFT:`,
    input.draftBody,
    ``,
    `GUARDIAN ANALYSIS (your starting point — do not contradict):`,
    `- Fairness judgement: ${deterministic.fairnessJudgement}`,
    `- Proportionality: ${deterministic.proportionality.rating} — ${deterministic.proportionality.rationale}`,
    `- Right to be accompanied stated: ${deterministic.rightsCheck.rightToBeAccompanied}`,
    `- Appeal rights stated: ${deterministic.rightsCheck.appealRightsCommunicated}`,
    `- Evidence quality: ${deterministic.evidenceQuality.rating}`,
    `- Wording risk: ${deterministic.wordingRisk.rating}`,
    `- Prejudgment signals: ${deterministic.prejudgmentSignals.join(", ") || "(none)"}`,
    `- Discrimination signals: ${deterministic.discriminationRisk.signals.join(", ") || "(none)"}`,
    ``,
    `Return ONLY a JSON object — no prose, no code fences:`,
    `{`,
    `  "saferWording": string  // a redrafted version of the letter, labelled "Aria suggested draft" at the start, that resolves the issues identified above. Use [square brackets] for any specifics that cannot be inferred from the input.`,
    `}`,
  ].join("\n");

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      system,
      messages: [{ role: "user", content: userMessage }],
    });
    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") return null;
    const cleaned = textBlock.text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
    const parsed = JSON.parse(cleaned) as { saferWording?: string };
    if (!parsed.saferWording) return null;
    return { saferWording: applyAriaPostprocessor(parsed.saferWording) };
  } catch (err) {
    console.warn("[hrProcessGuardian] LLM enhancement failed:", err);
    return null;
  }
}

// ─── Public entry point ──────────────────────────────────────────────────────

const REGULATORY_LINKS = [
  "ACAS Code of Practice on Disciplinary and Grievance Procedures",
  "Employment Rights Act 1996",
  "Equality Act 2010",
  "Working Together to Safeguard Children 2023",
  "Children's Homes (England) Regulations 2015 Reg 32 (employment of staff) and Reg 33 (fitness of workers)",
  "Keeping Children Safe in Education 2024 (LADO and managing allegations principles)",
];

export async function reviewHrAction(input: GuardianInput): Promise<GuardianReview> {
  if (!input.draftBody || input.draftBody.trim().length === 0) {
    throw new Error("draftBody is required");
  }
  if (!input.draftSubject || input.draftSubject.trim().length === 0) {
    throw new Error("draftSubject is required");
  }

  const flags: GuardianFlag[] = [];

  const { signals: prejudgmentSignals, matches: prejudgmentFlags } = detectPrejudgment(input.draftBody);
  flags.push(...prejudgmentFlags);

  const { alignment: acasAlignment, flags: acasFlags } = checkAcasAlignment(input);
  flags.push(...acasFlags);

  const { alignment: safeguardingAlignment, flags: safeguardingFlags } = checkSafeguarding(input);
  flags.push(...safeguardingFlags);

  const { risk: discriminationRisk, flags: discFlags } = checkDiscrimination(input.draftBody);
  flags.push(...discFlags);

  const { proportionality, flags: propFlags } = checkProportionality(input);
  flags.push(...propFlags);

  const { evidence: evidenceQuality, flags: evFlags } = checkEvidence(input);
  flags.push(...evFlags);

  const { rights: rightsCheck, flags: rightsFlags } = checkRights(input);
  flags.push(...rightsFlags);

  flags.push(...checkConsistency(input));

  // Wording risk summary derived from flags.
  const wordingFlags = flags.filter((f) => f.category === "wording" || f.category === "prejudgment");
  const wordingIssues = wordingFlags.map((f) => f.message);
  const wordingRating: GuardianReview["wordingRisk"]["rating"] =
    wordingFlags.some((f) => f.severity === "block")
      ? "rewrite"
      : wordingFlags.length > 0
        ? "review"
        : "safe";

  // Score and judgement.
  const blockCount = flags.filter((f) => f.severity === "block").length;
  const warningCount = flags.filter((f) => f.severity === "warning").length;
  const advisoryCount = flags.filter((f) => f.severity === "advisory").length;

  let fairnessScore = 100 - (blockCount * 25 + warningCount * 10 + advisoryCount * 3);
  fairnessScore = Math.max(0, Math.min(100, fairnessScore));

  const fairnessJudgement: FairnessJudgement =
    blockCount > 0
      ? "do_not_approve_yet"
      : warningCount > 0
        ? "review_recommended"
        : "safe_to_approve";

  // Templated safer wording. The LLM may overwrite below.
  const templatedSaferWording = buildTemplatedSaferWording(input, rightsCheck, proportionality);

  const ariaConfidence = Math.max(
    0.1,
    Math.min(0.9, 0.5 + (blockCount === 0 ? 0.1 : -0.2) + (warningCount === 0 ? 0.1 : 0) + (advisoryCount === 0 ? 0.05 : 0)),
  );

  const suggestedActions = buildSuggestedActions(input, flags, fairnessJudgement);

  const review: GuardianReview = {
    generatedAt: new Date().toISOString(),
    status: "draft",
    ariaLabel: "Aria suggested draft",
    fairnessScore,
    fairnessJudgement,
    acasAlignment,
    safeguardingAlignment,
    discriminationRisk,
    proportionality,
    rightsCheck,
    evidenceQuality,
    wordingRisk: { rating: wordingRating, issues: wordingIssues },
    prejudgmentSignals,
    flags,
    suggestedSaferWording: templatedSaferWording,
    suggestedActions,
    regulatoryLinks: REGULATORY_LINKS,
    ariaConfidence: Math.round(ariaConfidence * 100) / 100,
    llmUsed: false,
    engineVersion: ENGINE_VERSION,
  };

  if (input.enableLlm !== false) {
    const enhanced = await enhanceWithLlm(input, review);
    if (enhanced?.saferWording) {
      review.suggestedSaferWording = enhanced.saferWording;
      review.llmUsed = true;
    }
  }

  return review;
}

export { ENGINE_VERSION };
