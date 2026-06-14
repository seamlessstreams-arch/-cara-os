// ══════════════════════════════════════════════════════════════════════════════
// CARA — Cara MANAGEMENT OVERSIGHT ENGINE
// Generates management oversight drafts for children's home records.
// Analyses record quality, detects risk levels, judges practice quality,
// identifies missing evidence, and produces Ofsted-ready oversight text.
//
// Regulatory basis: Children's Homes Regulations 2015 — Reg 13 (leadership
// and management), Reg 14 (care planning), SCCIF quality standards.
// ══════════════════════════════════════════════════════════════════════════════

export type RecordType =
  | "daily_log"
  | "shift_debrief"
  | "incident"
  | "missing_from_care"
  | "disclosure"
  | "safeguarding"
  | "medication"
  | "key_work"
  | "education"
  | "health"
  | "complaint"
  | "restorative"
  | "room_search"
  | "family_time"
  | "other";

export type PracticeJudgement =
  | "strong"
  | "adequate"
  | "unclear"
  | "requires_improvement";

export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface ManagementOversightInput {
  recordId: string;
  recordType: RecordType;
  childName: string;
  homeName?: string;
  createdByName?: string;
  recordDate?: string;
  recordText: string;

  knownRisks?: string[];
  currentPlans?: {
    carePlan?: string;
    placementPlan?: string;
    riskAssessment?: string;
    keepingMeSafePlan?: string;
    behaviourSupportPlan?: string;
    educationPlan?: string;
    healthPlan?: string;
  };

  recentPatterns?: string[];
}

export interface OversightAction {
  title: string;
  description: string;
  ownerRole: "registered_manager" | "deputy_manager" | "team_leader" | "key_worker" | "staff_member" | "ri";
  priority: "low" | "medium" | "high";
  dueInDays: number;
}

export interface ManagementOversightOutput {
  oversightDraft: string;
  ofstedSummary: string;
  qualityScore: number;
  riskLevel: RiskLevel;
  practiceJudgement: PracticeJudgement;
  childVoiceVisible: boolean;
  planLinksVisible: boolean;
  requiresManagerEscalation: boolean;
  missingEvidence: string[];
  strengths: string[];
  suggestedActions: OversightAction[];
  regulatoryLinks: string[];
  caraConfidence: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function includesAny(text: string, words: string[]): boolean {
  const lower = text.toLowerCase();
  return words.some((word) => lower.includes(word.toLowerCase()));
}

// ── Quality Score ────────────────────────────────────────────────────────────

function calculateQualityScore(input: ManagementOversightInput): number {
  let score = 40;
  const text = input.recordText.toLowerCase();

  if (input.recordText.length > 600) score += 10;
  if (includesAny(text, ["said", "stated", "told staff", "explained", "shared"])) score += 10;
  if (includesAny(text, ["felt", "feelings", "wishes", "views", "voice"])) score += 10;
  if (includesAny(text, ["risk", "safety", "keeping me safe", "plan"])) score += 10;
  if (includesAny(text, ["staff supported", "reassured", "de-escalated", "pace", "arc"])) score += 10;
  if (includesAny(text, ["action", "follow up", "manager", "social worker", "school", "health"])) score += 10;
  if (includesAny(text, ["outcome", "impact", "progress", "reflection"])) score += 10;

  return Math.min(score, 100);
}

// ── Risk Detection ───────────────────────────────────────────────────────────

function detectRiskLevel(input: ManagementOversightInput): RiskLevel {
  const text = input.recordText.toLowerCase();

  const criticalIndicators = [
    "weapon",
    "sexual exploitation",
    "cse",
    "criminal exploitation",
    "overdose",
    "self-harm with injury",
    "suicide",
    "assaulted",
    "police attended",
    "missing overnight",
    "hospital",
  ];

  const highIndicators = [
    "missing",
    "disclosure",
    "safeguarding",
    "allegation",
    "physical intervention",
    "restraint",
    "absconded",
    "substance",
    "threat",
    "violence",
    "medication error",
  ];

  const mediumIndicators = [
    "refused",
    "distressed",
    "argument",
    "triggered",
    "boundary",
    "education refusal",
    "family contact",
    "health concern",
  ];

  if (includesAny(text, criticalIndicators)) return "critical";
  if (includesAny(text, highIndicators)) return "high";
  if (includesAny(text, mediumIndicators)) return "medium";

  return "low";
}

// ── Child Voice & Plan Links ─────────────────────────────────────────────────

function detectChildVoice(text: string): boolean {
  return includesAny(text, [
    "said",
    "stated",
    "told",
    "asked",
    "shared",
    "explained",
    "reported",
    "wishes",
    "feelings",
    "views",
    "voice",
  ]);
}

function detectPlanLinks(text: string): boolean {
  return includesAny(text, [
    "care plan",
    "placement plan",
    "risk assessment",
    "keeping me safe",
    "behaviour support",
    "education plan",
    "health plan",
    "arc",
    "pace",
  ]);
}

// ── Missing Evidence ─────────────────────────────────────────────────────────

function detectMissingEvidence(input: ManagementOversightInput): string[] {
  const missing: string[] = [];
  const text = input.recordText.toLowerCase();

  if (!detectChildVoice(text)) {
    missing.push("The child's voice, words, wishes or feelings are not clearly evidenced.");
  }

  if (!detectPlanLinks(text)) {
    missing.push("The record does not clearly link practice to the child's plans or risk documents.");
  }

  if (!includesAny(text, ["outcome", "impact", "progress", "settled", "regulated", "resolved"])) {
    missing.push("The outcome or impact for the child is not clearly recorded.");
  }

  if (!includesAny(text, ["staff supported", "staff responded", "reassured", "de-escalated", "listened"])) {
    missing.push("The staff response is not described in enough detail.");
  }

  if (
    ["incident", "missing_from_care", "disclosure", "safeguarding", "medication"].includes(
      input.recordType
    ) &&
    !includesAny(text, ["manager", "social worker", "edt", "police", "placing authority", "ofsted"])
  ) {
    missing.push("The record should clarify whether management or external professionals were notified.");
  }

  return missing;
}

// ── Practice Judgement ───────────────────────────────────────────────────────

function judgePractice(score: number, missingEvidence: string[], riskLevel: RiskLevel): PracticeJudgement {
  if (score >= 80 && missingEvidence.length <= 1) return "strong";
  if (score >= 65 && missingEvidence.length <= 2) return "adequate";
  if (riskLevel === "high" || riskLevel === "critical") return "requires_improvement";
  return "unclear";
}

// ── Regulatory Links ─────────────────────────────────────────────────────────

function getRegulatoryLinks(input: ManagementOversightInput): string[] {
  const links = [
    "Children's Homes Regulations 2015 - Regulation 13: Leadership and management standard",
    "Children's Homes Regulations 2015 - Regulation 14: Care planning standard",
    "SCCIF - The experiences and progress of children",
    "SCCIF - How well children are helped and protected",
    "SCCIF - The effectiveness of leaders and managers",
  ];

  if (["incident", "missing_from_care", "safeguarding", "disclosure"].includes(input.recordType)) {
    links.push("Children's Homes Regulations 2015 - Regulation 12: Protection of children standard");
  }

  if (input.recordType === "medication" || input.recordType === "health") {
    links.push("Children's Homes Regulations 2015 - Regulation 10: Health and well-being standard");
  }

  if (input.recordType === "education") {
    links.push("Children's Homes Regulations 2015 - Regulation 8: Education standard");
  }

  return links;
}

// ── Suggested Actions ────────────────────────────────────────────────────────

function buildActions(
  input: ManagementOversightInput,
  missingEvidence: string[],
  riskLevel: RiskLevel
): OversightAction[] {
  const actions: OversightAction[] = [];

  if (missingEvidence.length > 0) {
    actions.push({
      title: "Improve record quality",
      description:
        "Team leader or manager to review the recording gaps with the staff member and ensure future records include child voice, staff response, plan links and outcomes.",
      ownerRole: "team_leader",
      priority: "medium",
      dueInDays: 3,
    });
  }

  if (riskLevel === "high" || riskLevel === "critical") {
    actions.push({
      title: "Management review required",
      description:
        "Registered Manager to review the incident, consider safeguarding thresholds, update risk documents if required and ensure relevant professionals have been informed.",
      ownerRole: "registered_manager",
      priority: "high",
      dueInDays: 1,
    });
  }

  if (["missing_from_care", "safeguarding", "disclosure"].includes(input.recordType)) {
    actions.push({
      title: "Consider multi-agency follow-up",
      description:
        "Manager to consider whether the placing authority, social worker, police, education or health professionals need to be updated or challenged.",
      ownerRole: "registered_manager",
      priority: "high",
      dueInDays: 1,
    });
  }

  return actions;
}

// ── Oversight Draft Builder ──────────────────────────────────────────────────

function buildOversightDraft(
  input: ManagementOversightInput,
  score: number,
  riskLevel: RiskLevel,
  judgement: PracticeJudgement,
  childVoiceVisible: boolean,
  planLinksVisible: boolean,
  missingEvidence: string[]
): string {
  const child = input.childName || "the child";

  const opening = `This record has been reviewed by management. The record relates to ${child} and has been considered in relation to their lived experience, safety, progress and the quality of staff practice.`;

  const riskSentence =
    riskLevel === "low"
      ? `No immediate safeguarding concerns are identified from the information recorded.`
      : riskLevel === "medium"
      ? `The record identifies some presenting concerns which require continued monitoring and reflective follow-up by the team.`
      : riskLevel === "high"
      ? `The record identifies significant concerns which require clear management oversight, follow-up actions and consideration of professional notifications.`
      : `The record identifies serious safeguarding concerns and requires immediate management review, professional escalation and evidence of decisive action.`;

  const practiceSentence =
    judgement === "strong"
      ? `Staff practice appears child-centred, proportionate and supportive, with evidence that staff responded in a way that promoted safety, regulation and relational care.`
      : judgement === "adequate"
      ? `Staff practice appears broadly appropriate, although the record would be strengthened by clearer analysis of impact, plan links and the child's voice.`
      : judgement === "unclear"
      ? `The quality of staff practice is not fully clear from the recording and further detail is required to evidence what staff did, why they did it and what impact this had for ${child}.`
      : `The record indicates areas requiring improvement. Management will need to ensure that practice is reviewed, learning is captured and any risks or shortfalls are addressed without delay.`;

  const voiceSentence = childVoiceVisible
    ? `The child's voice appears to be present within the record, which supports a clearer understanding of their wishes, feelings and presentation.`
    : `The child's voice is not clearly evidenced and this should be strengthened, as Ofsted will expect records to show how the child experienced the event and how adults responded to this.`;

  const planSentence = planLinksVisible
    ? `There is some evidence that the record links to the child's plans or known support needs.`
    : `The record should be strengthened by making clearer links to the care plan, placement plan, risk assessment, Keeping Me Safe Plan or other relevant documents.`;

  const missingSentence =
    missingEvidence.length > 0
      ? `The following recording gaps have been identified: ${missingEvidence.join(" ")}`
      : `No significant recording gaps have been identified from Cara's review.`;

  const closing = `Management will ensure that any required actions are followed through, learning is shared with the team where needed, and this record is used to support ongoing monitoring of ${child}'s progress, safety and care experience.`;

  return [
    opening,
    riskSentence,
    practiceSentence,
    voiceSentence,
    planSentence,
    missingSentence,
    closing,
    `Cara quality score: ${score}/100. This is an AI-supported draft and must be reviewed and approved by a manager before being saved as final oversight.`,
  ].join("\n\n");
}

// ── Main Export ──────────────────────────────────────────────────────────────

export function generateManagementOversight(
  input: ManagementOversightInput
): ManagementOversightOutput {
  const qualityScore = calculateQualityScore(input);
  const riskLevel = detectRiskLevel(input);
  const childVoiceVisible = detectChildVoice(input.recordText);
  const planLinksVisible = detectPlanLinks(input.recordText);
  const missingEvidence = detectMissingEvidence(input);
  const practiceJudgement = judgePractice(qualityScore, missingEvidence, riskLevel);
  const requiresManagerEscalation = riskLevel === "high" || riskLevel === "critical";

  const strengths: string[] = [];

  if (childVoiceVisible) strengths.push("The child's voice appears to be visible.");
  if (planLinksVisible) strengths.push("The record contains some links to plans or known needs.");
  if (qualityScore >= 75) strengths.push("The record has a good level of detail and reflection.");
  if (strengths.length === 0) strengths.push("The record has been submitted for review and can now be strengthened through management oversight.");

  const oversightDraft = buildOversightDraft(
    input,
    qualityScore,
    riskLevel,
    practiceJudgement,
    childVoiceVisible,
    planLinksVisible,
    missingEvidence
  );

  const ofstedSummary = `${input.childName}'s record has been reviewed through management oversight. Cara identified a ${riskLevel} level of risk, a practice judgement of ${practiceJudgement}, and a recording quality score of ${qualityScore}/100. Key areas considered include child voice, plan links, staff response, risk, impact and follow-up actions.`;

  return {
    oversightDraft,
    ofstedSummary,
    qualityScore,
    riskLevel,
    practiceJudgement,
    childVoiceVisible,
    planLinksVisible,
    requiresManagerEscalation,
    missingEvidence,
    strengths,
    suggestedActions: buildActions(input, missingEvidence, riskLevel),
    regulatoryLinks: getRegulatoryLinks(input),
    caraConfidence: 0.78,
  };
}
