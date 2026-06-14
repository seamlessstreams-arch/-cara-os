// ══════════════════════════════════════════════════════════════════════════════
// Cara — MANAGEMENT OVERSIGHT ENGINE
//
// Analyses completed care records and produces a draft management oversight
// review for Registered Managers, Deputies and Responsible Individuals.
//
// All output is "Cara suggested draft" — never final until a human approves.
//
// Pipeline:
//   1. Deterministic record analysis (rule-based, audit-traceable)
//   2. Optional LLM enhancement (Anthropic) — only when an API key is configured
//   3. Composes the typed OversightReview the API persists to Supabase
//
// Regulatory basis: Children's Homes (England) Regulations 2015
//   - Reg 5  (engaging the wider system to meet children's needs)
//   - Reg 13 (leadership and management — quality of oversight)
//   - Reg 31 (records — sufficient and accurate)
//   - Reg 34 (notifiable events to Ofsted)
//   - Reg 44 (independent person visits)
//   - Reg 45 (RI quarterly review of quality of care)
//   - SCCIF judgement areas: Children's Experience, Children's Progress,
//     Leadership & Management
// ══════════════════════════════════════════════════════════════════════════════

import { generateText } from "ai";
import {
  CARA_PROFESSIONAL_IDENTITY_PROMPT,
  CARA_WRITING_STYLE_PROMPT,
  applyCaraPostprocessor,
} from "@/lib/cara/writingStyleRules";

// ─── Public types ─────────────────────────────────────────────────────────────

export type RecordType =
  | "daily_log"
  | "shift_debrief"
  | "incident_report"
  | "missing_from_care"
  | "disclosure"
  | "safeguarding"
  | "medication"
  | "key_work"
  | "education"
  | "health"
  | "complaint"
  | "consequence_restorative"
  | "room_search"
  | "family_time";

export type RiskLevel = "low" | "medium" | "high" | "critical";

export type PracticeJudgement =
  | "strong"
  | "adequate"
  | "unclear"
  | "requires_improvement";

export type CaraConfidence = "high" | "possible" | "needs_human_review" | "insufficient_information";

export type LinkedPlanType =
  | "care_plan"
  | "placement_plan"
  | "risk_assessment"
  | "keeping_me_safe_plan"
  | "behaviour_support_plan"
  | "education_plan"
  | "health_plan"
  | "reg_44"
  | "reg_45";

export interface PlanLink {
  plan: LinkedPlanType;
  detected: boolean;
  evidenceQuote?: string;
}

export interface OversightInput {
  recordId: string;
  recordType: RecordType;
  recordText: string;
  recordDate?: string;
  childId?: string;
  childPseudonym?: string;
  homeId?: string;
  authorRole?: string;
  authorName?: string;
  knownChildContext?: string;
  enableLlm?: boolean;
}

export interface SuggestedAction {
  title: string;
  description: string;
  priority: "urgent" | "high" | "medium" | "low";
  dueDays: number;
  assignedRole: string;
}

export interface OversightReview {
  recordId: string;
  recordType: RecordType;
  generatedAt: string;
  status: "draft";
  caraLabel: "Cara suggested draft";

  oversightDraft: string;
  ofstedSummary: string;

  qualityScore: number;
  riskLevel: RiskLevel;
  practiceJudgement: PracticeJudgement;

  childVoiceVisible: boolean;
  planLinksVisible: boolean;
  planLinks: PlanLink[];

  requiresManagerEscalation: boolean;
  escalationReason?: string;

  missingEvidence: string[];
  strengths: string[];
  suggestedActions: SuggestedAction[];
  regulatoryLinks: string[];

  caraConfidence: number;
  llmUsed: boolean;
  engineVersion: string;
}

const ENGINE_VERSION = "1.0.0";

// ─── Detection rules ──────────────────────────────────────────────────────────

const PLAN_PATTERNS: Record<LinkedPlanType, RegExp[]> = {
  care_plan: [/\bcare\s*plan\b/i],
  placement_plan: [/\bplacement\s*plan\b/i],
  risk_assessment: [/\brisk\s*assessment\b/i, /\brisk\s*management\s*plan\b/i],
  keeping_me_safe_plan: [/\bkeeping\s*me\s*safe\b/i, /\bsafety\s*plan\b/i],
  behaviour_support_plan: [/\bbehaviour\s*support\s*plan\b/i, /\bBSP\b/],
  education_plan: [
    /\bpersonal\s*education\s*plan\b/i,
    /\bPEP\b/,
    /\bEHCP\b/,
    /\beducation\s*plan\b/i,
  ],
  health_plan: [/\bhealth\s*plan\b/i, /\bhealth\s*assessment\b/i, /\bLAC\s*health\b/i],
  reg_44: [/\bReg(?:ulation)?\s*44\b/i],
  reg_45: [/\bReg(?:ulation)?\s*45\b/i],
};

// Words/phrases that indicate the child's voice was captured.
const CHILD_VOICE_PATTERNS: RegExp[] = [
  /["“][^"”]{4,}["”]/, // quoted speech
  /\bthe\s+(?:young\s+person|child)\s+(?:said|told|asked|expressed|stated|shared|wanted|disclosed)\b/i,
  /\b(?:said|told|asked)\s+(?:me|us|staff)\b/i,
  /\b(?:in\s+(?:their|her|his)\s+own\s+words)\b/i,
  /\b(?:I\s+want|I\s+feel|I\s+don'?t|I\s+need)\b/, // first-person voice quoted
];

// Words/phrases that escalate risk independent of record type.
const CRITICAL_RISK_PATTERNS: RegExp[] = [
  /\b(?:suicide|suicidal|overdose|ligature|hanging)\b/i,
  /\bself[\s-]*harm(?:ed|ing)?\b/i,
  /\bweapon|knife|blade\b/i,
  /\bsexual(?:ly)?\s*(?:assaulted|abused|exploited)\b/i,
  /\bgrooming\b/i,
  /\bcounty[\s-]*line(?:s)?\b/i,
  /\btrafficking\b/i,
  /\bunconscious\b/i,
  /\b999\b|\bemergency\s+services\b/i,
];

const HIGH_RISK_PATTERNS: RegExp[] = [
  /\bmissing\s+from\s+care\b/i,
  /\bsubstance\s+(?:misuse|use)\b/i,
  /\bphysical\s+restraint\b/i,
  /\ballegation\s+(?:against|made)\b/i,
  /\bdisclosure\b/i,
  /\bAandE\b|\bA&E\b|\baccident\s+and\s+emergency\b/i,
];

const MEDIUM_RISK_PATTERNS: RegExp[] = [
  /\baltercation\b/i,
  /\bargument\b/i,
  /\bdamage\s+to\s+property\b/i,
  /\babsconded?\b/i,
  /\brefused\s+medication\b/i,
];

// ─── Per-record-type oversight prompts ────────────────────────────────────────

const REQUIRED_EVIDENCE_BY_TYPE: Record<RecordType, string[]> = {
  daily_log: [
    "Significant events of the shift",
    "Child's mood, presentation and voice",
    "Linkage to care planning where relevant",
  ],
  shift_debrief: [
    "Reflective summary of the shift",
    "What went well / what was difficult",
    "Handover actions for the next shift",
  ],
  incident_report: [
    "Antecedent / behaviour / consequence (ABC)",
    "Child's voice during and after the incident",
    "De-escalation strategies attempted",
    "Notifications: SW, parents, Ofsted (if Reg 34)",
    "Post-incident review and plan update",
  ],
  missing_from_care: [
    "Date / time / circumstances of going missing",
    "Risk-grading and contextual safeguarding factors",
    "Independent Return Home Interview offered (statutory)",
    "Child's voice on reasons and where they went",
    "Plan update following return",
  ],
  disclosure: [
    "Verbatim record of what the child said (in their own words)",
    "Who the disclosure was made to and witnessed by",
    "Immediate safeguarding action taken",
    "Notifications: DSL / LADO / police / SW",
    "Child's wellbeing and ongoing support",
  ],
  safeguarding: [
    "Clear concern statement and source",
    "Risk grading and threshold decision",
    "Strategy meeting / referral status",
    "Multi-agency action plan and review date",
  ],
  medication: [
    "Medication name, dose, route, time and prescriber",
    "Reason for administration / variance from MAR",
    "Witness signature where required",
    "Child consent and child's experience of medication",
  ],
  key_work: [
    "Aim of the session and link to care plan goals",
    "Child's engagement and voice",
    "Reflective summary and follow-up actions",
  ],
  education: [
    "Attendance, attainment and engagement",
    "PEP linkage and Virtual School involvement where relevant",
    "Child's voice on their education",
  ],
  health: [
    "Presenting issue and clinical action",
    "Consent and child's voice",
    "Health plan / LAC health assessment linkage",
  ],
  complaint: [
    "Verbatim concern from the child or person making the complaint",
    "Investigation steps and findings",
    "Resolution offered and child's view of resolution",
    "Reg 39 / advocate involvement",
  ],
  consequence_restorative: [
    "Behaviour, impact, and harm caused",
    "Restorative conversation and child's reflection",
    "Proportionality of any consequence (Reg 19)",
    "Repair plan and review",
  ],
  room_search: [
    "Justification (proportionate, lawful, least intrusive)",
    "Child present / informed where appropriate",
    "What was searched, what was found, who witnessed",
    "Child's voice on the search",
    "Notifications and plan update",
  ],
  family_time: [
    "Purpose, location, duration, and supervision level",
    "Child's experience before, during and after",
    "Quality of relationship and any concerns observed",
    "Plan update and next contact arrangements",
  ],
};

const REGULATORY_LINKS_BY_TYPE: Record<RecordType, string[]> = {
  daily_log: [
    "Children's Homes Regs 2015 Reg 31 (records)",
    "SCCIF: Children's Experience",
  ],
  shift_debrief: [
    "Children's Homes Regs 2015 Reg 13 (leadership and management)",
    "SCCIF: Leadership & Management",
  ],
  incident_report: [
    "Children's Homes Regs 2015 Reg 19 (behaviour management, restraint)",
    "Children's Homes Regs 2015 Reg 34 (notification of significant events)",
    "Working Together to Safeguard Children 2023",
  ],
  missing_from_care: [
    "Statutory Guidance on Children Who Run Away or Go Missing (DfE 2014)",
    "Children's Homes Regs 2015 Reg 34",
    "Working Together to Safeguard Children 2023",
  ],
  disclosure: [
    "Working Together to Safeguard Children 2023",
    "KCSIE 2024",
    "Children's Homes Regs 2015 Reg 12 (protection from harm)",
  ],
  safeguarding: [
    "Working Together to Safeguard Children 2023",
    "Children's Homes Regs 2015 Reg 12",
    "Local Safeguarding Partnership procedures",
  ],
  medication: [
    "Children's Homes Regs 2015 Reg 23 (medicines)",
    "NICE NG5 (Medicines optimisation)",
    "CQC / Royal Pharmaceutical Society standards",
  ],
  key_work: [
    "Children's Homes Regs 2015 Reg 7 (keyworker duty)",
    "SCCIF: Children's Progress",
    "UNCRC Article 12 (voice)",
  ],
  education: [
    "Statutory Guidance on Promoting the Education of LAC (DfE 2018)",
    "Children's Homes Regs 2015 Reg 8 (education)",
    "Virtual School Head duty (s.20 CYPA 2008)",
  ],
  health: [
    "Children's Homes Regs 2015 Reg 10 (health and wellbeing)",
    "Promoting the Health and Wellbeing of LAC (DH/DfE 2015)",
  ],
  complaint: [
    "Children's Homes Regs 2015 Reg 39 (complaints procedure)",
    "Children Act 1989 s.26",
    "UNCRC Articles 12 + 13",
  ],
  consequence_restorative: [
    "Children's Homes Regs 2015 Reg 19 (no use of corporal punishment, proportionate measures)",
    "UNCRC Article 28(2)",
  ],
  room_search: [
    "Children's Homes Regs 2015 Reg 21 (searches must be proportionate, lawful and dignified)",
    "Statement of Purpose authorisation required",
  ],
  family_time: [
    "Children Act 1989 s.34 (contact)",
    "Children's Homes Regs 2015 Reg 9 (positive relationships)",
    "UNCRC Article 9",
  ],
};

// ─── Core analysis ────────────────────────────────────────────────────────────

function detectChildVoice(text: string): boolean {
  return CHILD_VOICE_PATTERNS.some((re) => re.test(text));
}

function detectPlanLinks(text: string): PlanLink[] {
  const planTypes: LinkedPlanType[] = [
    "care_plan",
    "placement_plan",
    "risk_assessment",
    "keeping_me_safe_plan",
    "behaviour_support_plan",
    "education_plan",
    "health_plan",
    "reg_44",
    "reg_45",
  ];

  return planTypes.map((plan) => {
    const patterns = PLAN_PATTERNS[plan];
    let evidence: string | undefined;
    const detected = patterns.some((re) => {
      const match = re.exec(text);
      if (match) {
        const start = Math.max(0, match.index - 30);
        const end = Math.min(text.length, match.index + match[0].length + 30);
        evidence = text.slice(start, end).trim();
        return true;
      }
      return false;
    });
    return { plan, detected, evidenceQuote: evidence };
  });
}

function detectRiskLevel(text: string, recordType: RecordType): RiskLevel {
  if (CRITICAL_RISK_PATTERNS.some((re) => re.test(text))) return "critical";

  // Some record types have an inherent baseline risk.
  if (
    recordType === "missing_from_care" ||
    recordType === "disclosure" ||
    recordType === "safeguarding"
  ) {
    if (HIGH_RISK_PATTERNS.some((re) => re.test(text))) return "high";
    return "high";
  }

  if (HIGH_RISK_PATTERNS.some((re) => re.test(text))) return "high";
  if (MEDIUM_RISK_PATTERNS.some((re) => re.test(text))) return "medium";
  return "low";
}

function detectMissingEvidence(
  text: string,
  recordType: RecordType,
  planLinks: PlanLink[],
  childVoice: boolean,
): string[] {
  const missing: string[] = [];
  const required = REQUIRED_EVIDENCE_BY_TYPE[recordType];

  // Length heuristic — very short records cannot evidence required content.
  if (text.trim().split(/\s+/).length < 60) {
    missing.push(
      "Record narrative is short — consider whether all required evidence is captured.",
    );
  }

  if (!childVoice) {
    missing.push(
      "Child's voice is not visible in the record (no quoted speech or first-person expression).",
    );
  }

  if (!planLinks.some((p) => p.detected)) {
    missing.push(
      "No linkage to a care plan, placement plan, risk assessment, or other relevant plan.",
    );
  }

  // Record-type specific markers.
  for (const item of required) {
    const stem = item.split(/[—:/]/)[0].trim().toLowerCase();
    const stemWords = stem.split(/\s+/).filter((w) => w.length > 3);
    if (stemWords.length === 0) continue;
    const found = stemWords.every((w) =>
      new RegExp(`\\b${escapeRegex(w)}`, "i").test(text),
    );
    if (!found) missing.push(`Consider explicitly evidencing: ${item}`);
  }

  return missing;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function judgePractice(
  qualityScore: number,
  childVoice: boolean,
  planLinked: boolean,
  riskLevel: RiskLevel,
): PracticeJudgement {
  if (qualityScore >= 80 && childVoice && planLinked) return "strong";
  if (qualityScore < 40) return "requires_improvement";
  if (riskLevel === "critical" && (!childVoice || !planLinked)) {
    return "requires_improvement";
  }
  if (qualityScore >= 60) return "adequate";
  return "unclear";
}

function scoreQuality(
  text: string,
  childVoice: boolean,
  planLinks: PlanLink[],
  missingCount: number,
): number {
  let score = 50;
  const wordCount = text.trim().split(/\s+/).length;

  // Length signal.
  if (wordCount > 250) score += 10;
  else if (wordCount > 120) score += 5;
  else if (wordCount < 40) score -= 20;

  // Voice and plans.
  if (childVoice) score += 12;
  const planHits = planLinks.filter((p) => p.detected).length;
  score += Math.min(planHits * 6, 18);

  // Action / outcome language.
  if (/\b(?:next\s+steps|follow\s*up|action(?:s)?\s+(?:agreed|taken)|will\s+review|escalated\s+to)\b/i.test(text)) {
    score += 8;
  }

  // Reflective language.
  if (/\b(?:I\s+(?:wonder|reflected|considered)|on\s+reflection|what\s+helped|what\s+didn'?t\s+work)\b/i.test(text)) {
    score += 5;
  }

  // Penalise vague closure phrases.
  if (/\breviewed,?\s+no\s+concerns\b/i.test(text)) score -= 10;
  if (/\bnothing\s+to\s+report\b/i.test(text)) score -= 5;

  // Missing evidence drag.
  score -= Math.min(missingCount * 4, 25);

  return Math.max(0, Math.min(100, Math.round(score)));
}

function suggestActions(
  recordType: RecordType,
  riskLevel: RiskLevel,
  childVoice: boolean,
  planLinks: PlanLink[],
): SuggestedAction[] {
  const actions: SuggestedAction[] = [];

  if (!childVoice) {
    actions.push({
      title: "Capture the child's voice in their own words",
      description:
        "Return to the record and add a direct quote or paraphrase that reflects what the child said, expressed or showed through behaviour. Date the addition and sign it.",
      priority: "high",
      dueDays: 2,
      assignedRole: "Author / Key Worker",
    });
  }

  if (!planLinks.some((p) => p.detected)) {
    actions.push({
      title: "Cross-reference relevant plans",
      description:
        "Update the record to explicitly link to the Care Plan, Placement Plan, Risk Assessment or Keeping Me Safe Plan — confirm whether the plans need updating in light of this record.",
      priority: "high",
      dueDays: 5,
      assignedRole: "Registered Manager / Deputy",
    });
  }

  if (riskLevel === "critical") {
    actions.push({
      title: "Notify Ofsted under Reg 34 if applicable",
      description:
        "Confirm whether this incident is a notifiable event under Children's Homes Regulations 2015 Reg 34 (within 24 hours) and ensure local authority and parents are informed.",
      priority: "urgent",
      dueDays: 1,
      assignedRole: "Registered Manager",
    });
    actions.push({
      title: "Convene strategy / professionals meeting",
      description:
        "Consider whether multi-agency strategy or professionals' meeting is required to risk-assess and plan next steps.",
      priority: "urgent",
      dueDays: 2,
      assignedRole: "Registered Manager",
    });
  }

  if (riskLevel === "high") {
    actions.push({
      title: "Manager oversight follow-up within 48 hours",
      description:
        "Schedule a follow-up review of the child within 48 hours to confirm safety, plan adherence, and supports in place.",
      priority: "high",
      dueDays: 2,
      assignedRole: "Registered Manager",
    });
  }

  if (recordType === "missing_from_care") {
    actions.push({
      title: "Independent Return Home Interview",
      description:
        "Confirm the statutory Independent Return Home Interview has been offered within 72 hours and findings used to update planning.",
      priority: "high",
      dueDays: 3,
      assignedRole: "Local Authority / Independent Person",
    });
  }

  if (recordType === "complaint") {
    actions.push({
      title: "Reg 39 complaints log + advocate offer",
      description:
        "Ensure the complaint is logged on the Reg 39 register and that the child has been offered access to an advocate.",
      priority: "high",
      dueDays: 2,
      assignedRole: "Registered Manager",
    });
  }

  if (recordType === "medication") {
    actions.push({
      title: "MAR reconciliation and witness check",
      description:
        "Reconcile the record against the MAR sheet and confirm a witness signature (where required), particularly for any controlled or PRN medication.",
      priority: "medium",
      dueDays: 1,
      assignedRole: "Registered Manager / Medication Lead",
    });
  }

  if (recordType === "room_search") {
    actions.push({
      title: "Reg 21 proportionality reflection",
      description:
        "Document the proportionality reflection: was the search the least intrusive option, was the child informed, and what does the Statement of Purpose say about searches?",
      priority: "high",
      dueDays: 2,
      assignedRole: "Registered Manager",
    });
  }

  return actions;
}

function detectStrengths(text: string, childVoice: boolean, planLinks: PlanLink[]): string[] {
  const strengths: string[] = [];
  if (childVoice) strengths.push("Child's voice is visible in the record.");
  const planHits = planLinks.filter((p) => p.detected);
  if (planHits.length > 0) {
    strengths.push(
      `Linkage to plan(s) detected: ${planHits.map((p) => p.plan.replace(/_/g, " ")).join(", ")}.`,
    );
  }
  if (/\b(?:de-?escalat|co-?regulat|sensory|trauma|attachment|PACE)\b/i.test(text)) {
    strengths.push("Trauma-informed / relational language is present.");
  }
  if (/\b(?:next\s+steps|follow\s*up|action(?:s)?\s+(?:agreed|taken))\b/i.test(text)) {
    strengths.push("Record articulates next steps / follow-up actions.");
  }
  if (/\b(?:I\s+(?:wonder|reflected|considered)|on\s+reflection)\b/i.test(text)) {
    strengths.push("Reflective practice language is evident.");
  }
  return strengths;
}

// ─── Templated draft (deterministic fallback) ─────────────────────────────────

function buildTemplatedDraft(input: OversightInput, partial: {
  riskLevel: RiskLevel;
  practiceJudgement: PracticeJudgement;
  childVoiceVisible: boolean;
  planLinksVisible: boolean;
  missingEvidence: string[];
  strengths: string[];
}): { oversightDraft: string; ofstedSummary: string } {
  const child = input.childPseudonym ?? input.childId ?? "the young person";
  const recordTypeLabel = input.recordType.replace(/_/g, " ");
  const dateLine = input.recordDate ? ` dated ${input.recordDate}` : "";

  const paragraphs: string[] = [];

  paragraphs.push(`Cara suggested draft. Management oversight of the ${recordTypeLabel} for ${child}.`);

  paragraphs.push(
    `I have read the record${dateLine}. On the evidence presented, the assessed risk sits at ${partial.riskLevel} and the practice on show reads as ${partial.practiceJudgement.replace(/_/g, " ")}. I have set that out below alongside what I think the team has done well, what is missing, and what I expect to happen next.`,
  );

  if (partial.strengths.length) {
    paragraphs.push(
      `What I want to acknowledge first. ${partial.strengths.join(" ")} These elements should not be lost when we look at what still needs to be addressed.`,
    );
  } else {
    paragraphs.push(
      `I have not yet been able to identify evidenced strengths in this record. That is itself a finding. The team should be invited to surface what worked, so that practice can be recognised as well as developed.`,
    );
  }

  if (partial.missingEvidence.length) {
    paragraphs.push(
      `Where the record needs strengthening. ${partial.missingEvidence.join(" ")} I would like these gaps closed before this record is treated as complete.`,
    );
  } else {
    paragraphs.push(
      `On the evidence I have, the record covers the elements I would expect for a record of this type.`,
    );
  }

  if (partial.childVoiceVisible) {
    paragraphs.push(
      `${child}'s voice is present in the record, which is the standard I expect across daily practice.`,
    );
  } else {
    paragraphs.push(
      `${child}'s voice is not yet visible in this record. Without their words, the record is incomplete. I am asking the author to revisit it and capture what ${child} said, expressed, or showed through behaviour.`,
    );
  }

  if (partial.planLinksVisible) {
    paragraphs.push(
      `The record links to the relevant plans, which suggests that planning is being held alongside the day-to-day work rather than running on a parallel track.`,
    );
  } else {
    paragraphs.push(
      `The record does not connect to the Care Plan, Placement Plan, Risk Assessment, or Keeping Me Safe Plan. The plan reference should be added. Where this record changes the picture, the plan itself should be updated and the change noted.`,
    );
  }

  paragraphs.push(
    `Next steps for me. I will revisit this record in the next supervision and confirm the actions set above have been completed. This wording is an Cara suggested draft. It must be reviewed, edited, and approved by the Registered Manager before it forms part of the regulatory record.`,
  );

  const oversightDraft = applyCaraPostprocessor(paragraphs.join("\n\n"));

  const summaryParts: string[] = [];
  summaryParts.push(
    `Practice on this ${recordTypeLabel} reads as ${partial.practiceJudgement.replace(/_/g, " ")} on the evidence presented, with the risk graded at ${partial.riskLevel}.`,
  );
  summaryParts.push(
    partial.childVoiceVisible
      ? `${child}'s voice is captured.`
      : `${child}'s voice is not yet captured. The author has been asked to revisit the record.`,
  );
  summaryParts.push(
    partial.planLinksVisible
      ? `The record links to the relevant planning.`
      : `Plan linkage is missing and has been flagged for completion.`,
  );

  const ofstedSummary = applyCaraPostprocessor(summaryParts.join(" "));

  return { oversightDraft, ofstedSummary };
}

// ─── Optional LLM enhancement ─────────────────────────────────────────────────

async function enhanceWithLlm(
  input: OversightInput,
  deterministic: OversightReview,
): Promise<{ oversightDraft: string; ofstedSummary: string } | null> {
  // Uses Vercel AI Gateway — routes through openai for management oversight
  // Fallback: if no gateway is available, try direct Anthropic key
  const hasGateway = !!process.env.VERCEL_OIDC_TOKEN;
  const hasAnthropicKey = !!process.env.ANTHROPIC_API_KEY;
  if (!hasGateway && !hasAnthropicKey) return null;

  const system = [
    `You are Cara, the intelligent professional assistant built into Cara, the operating system for UK residential children's homes. You are drafting a management oversight comment for a Registered Manager to review and approve.`,
    ``,
    CARA_PROFESSIONAL_IDENTITY_PROMPT,
    ``,
    `Hard rules for this draft:`,
    `- Label the wording clearly as an Cara suggested draft.`,
    `- Reflective, evidence-based, accountable. Do not duplicate the record narrative. Comment on it.`,
    `- Use only what the record provides. Do not invent facts.`,
    `- No blame-based language about staff or the child.`,
    ``,
    CARA_WRITING_STYLE_PROMPT,
  ].join("\n");

  const userMessage = [
    `RECORD METADATA:`,
    `- Type: ${input.recordType}`,
    `- Child reference: ${input.childPseudonym ?? input.childId ?? "[anonymous]"}`,
    `- Author: ${input.authorRole ?? input.authorName ?? "[unknown]"}`,
    `- Record date: ${input.recordDate ?? "[not stated]"}`,
    ``,
    `RECORD NARRATIVE:`,
    input.recordText,
    ``,
    input.knownChildContext ? `CONTEXT FROM CHILD'S FILE:\n${input.knownChildContext}\n` : "",
    `DETERMINISTIC ANALYSIS (your starting point — do not contradict):`,
    `- Risk level: ${deterministic.riskLevel}`,
    `- Practice judgement: ${deterministic.practiceJudgement}`,
    `- Child voice visible: ${deterministic.childVoiceVisible}`,
    `- Plan links visible: ${deterministic.planLinksVisible}`,
    `- Quality score: ${deterministic.qualityScore}/100`,
    `- Missing evidence flagged:\n  - ${deterministic.missingEvidence.join("\n  - ")}`,
    `- Strengths flagged:\n  - ${deterministic.strengths.join("\n  - ")}`,
    ``,
    `Return ONLY a JSON object — no prose, no code fences:`,
    `{`,
    `  "oversightDraft": string  // 4-8 sentence reflective Registered Manager draft, labelled "Cara suggested draft" at the start`,
    `  "ofstedSummary": string   // single-paragraph Ofsted-ready summary`,
    `}`,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    // Claude (Anthropic) only — OpenAI removed. Uses the gateway when available.
    const model = "anthropic/claude-sonnet-4-6";

    const result = await generateText({
      model: model as any,
      system,
      prompt: userMessage,
      maxOutputTokens: 1500,
      temperature: 0.3,
    });

    const raw = result.text;
    const cleaned = raw
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
    const parsed = JSON.parse(cleaned) as {
      oversightDraft?: string;
      ofstedSummary?: string;
    };
    if (!parsed.oversightDraft || !parsed.ofstedSummary) return null;
    return {
      oversightDraft: applyCaraPostprocessor(parsed.oversightDraft),
      ofstedSummary: applyCaraPostprocessor(parsed.ofstedSummary),
    };
  } catch (err) {
    console.warn("[managementOversightEngine] AI Gateway enhancement failed:", err);
    return null;
  }
}

// ─── Public entry point ───────────────────────────────────────────────────────

export async function analyseRecord(input: OversightInput): Promise<OversightReview> {
  if (!input.recordText || input.recordText.trim().length === 0) {
    throw new Error("recordText is required");
  }

  const text = input.recordText;
  const childVoice = detectChildVoice(text);
  const planLinks = detectPlanLinks(text);
  const planLinkedAny = planLinks.some((p) => p.detected);
  const riskLevel = detectRiskLevel(text, input.recordType);
  const missingEvidence = detectMissingEvidence(text, input.recordType, planLinks, childVoice);
  const qualityScore = scoreQuality(text, childVoice, planLinks, missingEvidence.length);
  const practiceJudgement = judgePractice(qualityScore, childVoice, planLinkedAny, riskLevel);
  const strengths = detectStrengths(text, childVoice, planLinks);
  const suggestedActions = suggestActions(input.recordType, riskLevel, childVoice, planLinks);
  const regulatoryLinks = REGULATORY_LINKS_BY_TYPE[input.recordType];

  const requiresEscalation =
    riskLevel === "critical" ||
    (riskLevel === "high" && (!childVoice || !planLinkedAny)) ||
    practiceJudgement === "requires_improvement";

  const escalationReason = requiresEscalation
    ? riskLevel === "critical"
      ? "Critical risk indicators detected in the record — manager and Ofsted/local authority notification likely required."
      : practiceJudgement === "requires_improvement"
        ? "Record quality requires improvement — manager review needed before sign-off."
        : "High-risk record without evidenced child voice or plan link — requires manager review."
    : undefined;

  const caraConfidence = Math.max(
    0.1,
    Math.min(
      0.95,
      qualityScore / 100 -
        (missingEvidence.length > 5 ? 0.2 : 0) +
        (childVoice ? 0.05 : 0) +
        (planLinkedAny ? 0.05 : 0),
    ),
  );

  const partial = {
    riskLevel,
    practiceJudgement,
    childVoiceVisible: childVoice,
    planLinksVisible: planLinkedAny,
    missingEvidence,
    strengths,
  };

  const templated = buildTemplatedDraft(input, partial);

  const review: OversightReview = {
    recordId: input.recordId,
    recordType: input.recordType,
    generatedAt: new Date().toISOString(),
    status: "draft",
    caraLabel: "Cara suggested draft",
    oversightDraft: templated.oversightDraft,
    ofstedSummary: templated.ofstedSummary,
    qualityScore,
    riskLevel,
    practiceJudgement,
    childVoiceVisible: childVoice,
    planLinksVisible: planLinkedAny,
    planLinks,
    requiresManagerEscalation: requiresEscalation,
    escalationReason,
    missingEvidence,
    strengths,
    suggestedActions,
    regulatoryLinks,
    caraConfidence: Math.round(caraConfidence * 100) / 100,
    llmUsed: false,
    engineVersion: ENGINE_VERSION,
  };

  if (input.enableLlm !== false) {
    const enhanced = await enhanceWithLlm(input, review);
    if (enhanced) {
      review.oversightDraft = enhanced.oversightDraft;
      review.ofstedSummary = enhanced.ofstedSummary;
      review.llmUsed = true;
    }
  }

  return review;
}

// Re-export the engine version for tooling / audit logs.
export { ENGINE_VERSION };
