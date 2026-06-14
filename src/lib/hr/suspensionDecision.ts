// ══════════════════════════════════════════════════════════════════════════════
// HR — SUSPENSION DECISION TOOL
//
// Helps a Registered Manager (or RI / HR caseworker) think through whether
// suspension is the proportionate response, and produces a structured
// suspension risk assessment with a welfare plan and review date.
//
// Suspension is a neutral act pending investigation. The tool deliberately
// surfaces alternatives to suspension and forces written reasons where the
// manager chooses to proceed.
//
// Output is "Cara suggested draft" until a human approves it. The Process
// Guardian (src/lib/cara/hrProcessGuardian.ts) is run separately on the
// suspension letter itself — this tool sits one step earlier in the workflow.
// ══════════════════════════════════════════════════════════════════════════════

export type SuspensionRiskFactor =
  | "risk_to_children"
  | "risk_to_witnesses"
  | "risk_to_evidence"
  | "risk_to_staff_member"
  | "risk_of_repeat_incident";

export type SuspensionRiskRating = "low" | "medium" | "high" | "very_high";

export type SuspensionAlternative =
  | "adjusted_duties"
  | "increased_supervision"
  | "redeployment_within_home"
  | "redeployment_other_home"
  | "remote_or_admin_only"
  | "training_or_mentoring_first"
  | "no_change_required";

export interface SuspensionDecisionInput {
  caseId?: string;
  staffId: string;
  homeId?: string;

  // Subject and concern
  concernSummary: string;

  // Risk grading (manager-supplied, with rationale)
  riskFactors: Record<SuspensionRiskFactor, {
    rating: SuspensionRiskRating;
    rationale: string;
  }>;

  // Alternatives considered
  alternativesConsidered: SuspensionAlternative[];
  alternativeRejectionRationale: string;

  // Advice sought
  hrAdviceSought: boolean;
  hrAdviceSummary?: string;
  riAdviceSought: boolean;
  riAdviceSummary?: string;
  ladoAdviceSought: boolean;
  ladoAdviceSummary?: string;
  ladoAdviceDate?: string;
  policeOrSocialWorkerInvolved: boolean;
  policeOrSocialWorkerNotes?: string;

  // Welfare plan
  welfareSinglePointOfContact: string;
  welfareSupportOffered: string[];
  welfareReviewIntervalDays: number;
  firstReviewDate: string;

  // Decision proposed
  proposedDecision: "suspend" | "do_not_suspend" | "alternative_arrangement";
  alternativeArrangementDescription?: string;
  effectiveFromDate?: string;

  // Manager identity for audit
  decisionMakerUserId: string;
  decisionMakerRole: string;
}

export interface SuspensionDecisionAnalysis {
  generatedAt: string;
  status: "draft";
  caraLabel: "Cara suggested draft";

  overallRiskGrade: SuspensionRiskRating;
  highestRiskFactor: SuspensionRiskFactor;
  rationaleSummary: string;

  proportionalityRating: "proportionate" | "borderline" | "disproportionate";
  proportionalityRationale: string;

  flags: SuspensionFlag[];
  suggestedActions: SuspensionSuggestedAction[];
  writtenReasonsDraft: string;
  reviewSchedule: { reviewNumber: number; expectedDate: string }[];
  regulatoryLinks: string[];

  caraConfidence: number;
  engineVersion: string;
}

export interface SuspensionFlag {
  category:
    | "advice"
    | "alternatives"
    | "welfare"
    | "evidence"
    | "safeguarding"
    | "process";
  severity: "info" | "advisory" | "warning" | "block";
  message: string;
  suggestion?: string;
}

export interface SuspensionSuggestedAction {
  title: string;
  description: string;
  priority: "urgent" | "high" | "medium" | "low";
  dueDays: number;
  assignedRole: string;
}

const ENGINE_VERSION = "1.0.0";

const REGULATORY_LINKS = [
  "ACAS Code of Practice on Disciplinary and Grievance Procedures",
  "ACAS Guidance: Suspension during a workplace investigation",
  "Children's Homes (England) Regulations 2015 Reg 32 (employment of staff) and Reg 33 (fitness of workers)",
  "Working Together to Safeguard Children 2023",
  "Keeping Children Safe in Education 2024 (LADO and managing allegations principles)",
];

// ─── Pure helpers ────────────────────────────────────────────────────────────

const RISK_RANK: Record<SuspensionRiskRating, number> = {
  low: 1,
  medium: 2,
  high: 3,
  very_high: 4,
};

function aggregateRisk(input: SuspensionDecisionInput): {
  overall: SuspensionRiskRating;
  factor: SuspensionRiskFactor;
} {
  const factors = Object.entries(input.riskFactors) as [
    SuspensionRiskFactor,
    { rating: SuspensionRiskRating; rationale: string },
  ][];

  if (factors.length === 0) {
    return { overall: "low", factor: "risk_to_children" };
  }

  let overall: SuspensionRiskRating = "low";
  let factor: SuspensionRiskFactor = factors[0][0];
  for (const [name, data] of factors) {
    if (RISK_RANK[data.rating] > RISK_RANK[overall]) {
      overall = data.rating;
      factor = name;
    }
  }
  return { overall, factor };
}

function classifyProportionality(
  input: SuspensionDecisionInput,
  overallRisk: SuspensionRiskRating,
): { rating: SuspensionDecisionAnalysis["proportionalityRating"]; rationale: string } {
  if (input.proposedDecision === "do_not_suspend") {
    return {
      rating: overallRisk === "very_high" ? "borderline" : "proportionate",
      rationale:
        overallRisk === "very_high"
          ? "The aggregate risk grading is very high. The decision not to suspend is borderline and the rationale needs to be exceptionally clear, particularly around child safety."
          : "The decision not to suspend is proportionate to the assessed risk, provided the alternative arrangements remain in place and are reviewed.",
    };
  }

  if (input.proposedDecision === "suspend") {
    if (overallRisk === "low" && input.alternativesConsidered.includes("no_change_required")) {
      return {
        rating: "disproportionate",
        rationale:
          "The aggregate risk has been graded as low and 'no change required' was listed as a viable alternative. Suspension reads as disproportionate. Consider whether adjusted duties or increased supervision would address the concern adequately.",
      };
    }
    if (overallRisk === "low") {
      return {
        rating: "borderline",
        rationale:
          "The aggregate risk has been graded as low. Suspension is borderline. The written reasons must show why no lesser arrangement was sufficient.",
      };
    }
    if (overallRisk === "medium") {
      return {
        rating: "proportionate",
        rationale:
          "The risk grading and the alternatives review support suspension as a proportionate response, treated as a neutral act pending investigation.",
      };
    }
    return {
      rating: "proportionate",
      rationale:
        "The risk grading is high or very high and the alternatives have been considered. Suspension is proportionate. Welfare contact and review intervals must be honoured.",
    };
  }

  return {
    rating: "proportionate",
    rationale:
      "An alternative arrangement has been put in place rather than suspension. The arrangement must be reviewed at the agreed interval and the case file updated.",
  };
}

function checkAdvice(input: SuspensionDecisionInput): SuspensionFlag[] {
  const flags: SuspensionFlag[] = [];

  if (!input.hrAdviceSought) {
    flags.push({
      category: "advice",
      severity: "warning",
      message: "HR advice has not been recorded as sought before this decision.",
      suggestion:
        "Record the HR advice received, the date, and the name of the adviser. ACAS expects HR input on suspension decisions.",
    });
  }

  if (input.proposedDecision === "suspend" && !input.riAdviceSought) {
    flags.push({
      category: "advice",
      severity: "advisory",
      message:
        "RI advice has not been recorded. Suspension is a significant decision and RI awareness is normally expected.",
    });
  }

  // Safeguarding triage: certain concern shapes should always trigger LADO
  // consideration even where the manager has graded the risk lower.
  const concernLower = input.concernSummary.toLowerCase();
  const safeguardingHints = [
    /\b(?:harm|abuse|neglect|sexualis(?:ed|ing)|inappropriate\s+restraint|boundaries|grooming)\b/i,
    /\bmedication\s+error\b/i,
    /\bfailure\s+to\s+follow\s+(?:care\s+plan|plan)\b/i,
    /\bunsafe\s+conduct\b/i,
  ];

  if (safeguardingHints.some((re) => re.test(concernLower))) {
    if (!input.ladoAdviceSought) {
      flags.push({
        category: "safeguarding",
        severity: "block",
        message:
          "The concern includes safeguarding-relevant language. LADO advice has not been recorded as sought before this decision.",
        suggestion:
          "Consult LADO before progressing, and record the date, the LADO contact, and the advice received in the case file.",
      });
    } else if (!input.ladoAdviceSummary || !input.ladoAdviceDate) {
      flags.push({
        category: "safeguarding",
        severity: "warning",
        message: "LADO advice has been sought but the summary or date is missing.",
        suggestion:
          "Record what LADO advised and on what date, so the chronology shows the safeguarding pathway.",
      });
    }
  }

  return flags;
}

function checkAlternatives(input: SuspensionDecisionInput): SuspensionFlag[] {
  const flags: SuspensionFlag[] = [];

  if (input.proposedDecision === "suspend") {
    if (input.alternativesConsidered.length === 0) {
      flags.push({
        category: "alternatives",
        severity: "block",
        message:
          "No alternatives to suspension have been recorded. ACAS guidance is clear that suspension should not be the default response.",
        suggestion:
          "Set out which alternatives were considered (adjusted duties, increased supervision, remote or admin-only work, redeployment) and why each was not sufficient.",
      });
    }
    if (
      !input.alternativeRejectionRationale ||
      input.alternativeRejectionRationale.trim().length < 20
    ) {
      flags.push({
        category: "alternatives",
        severity: "warning",
        message:
          "The rationale for rejecting alternatives is short or missing.",
        suggestion:
          "Explain in writing why each alternative considered was not adequate to manage the assessed risks.",
      });
    }
  }

  return flags;
}

function checkWelfare(input: SuspensionDecisionInput): SuspensionFlag[] {
  const flags: SuspensionFlag[] = [];

  if (input.proposedDecision !== "suspend") return flags;

  if (!input.welfareSinglePointOfContact) {
    flags.push({
      category: "welfare",
      severity: "block",
      message: "No single point of contact has been named for the suspended staff member.",
      suggestion:
        "Name a contact (usually the line manager or an HR caseworker) and make sure they have time set aside for regular check-ins.",
    });
  }

  if (input.welfareReviewIntervalDays > 28) {
    flags.push({
      category: "welfare",
      severity: "warning",
      message:
        "Suspension reviews are scheduled more than 28 days apart. ACAS guidance favours frequent review.",
      suggestion:
        "Reduce the interval, or record the rationale for a longer interval given the specific circumstances.",
    });
  }

  if (!input.firstReviewDate) {
    flags.push({
      category: "welfare",
      severity: "warning",
      message: "No first review date has been set.",
      suggestion: "Set a first review date (commonly within 7 to 14 days of the suspension start).",
    });
  }

  if (input.welfareSupportOffered.length === 0) {
    flags.push({
      category: "welfare",
      severity: "advisory",
      message:
        "No specific welfare support has been recorded.",
      suggestion:
        "Include access to occupational health, employee assistance, and trade union or external support such as ACAS as appropriate.",
    });
  }

  return flags;
}

function checkProcess(input: SuspensionDecisionInput): SuspensionFlag[] {
  const flags: SuspensionFlag[] = [];

  if (
    input.proposedDecision === "suspend" &&
    !input.effectiveFromDate
  ) {
    flags.push({
      category: "process",
      severity: "warning",
      message: "Suspension start date is not set.",
      suggestion: "Record the effective-from date so the chronology and any pay implications are clear.",
    });
  }

  if (input.proposedDecision === "alternative_arrangement") {
    if (
      !input.alternativeArrangementDescription ||
      input.alternativeArrangementDescription.trim().length < 20
    ) {
      flags.push({
        category: "process",
        severity: "warning",
        message: "The alternative arrangement is not described in enough detail.",
        suggestion:
          "Describe the arrangement (duties, hours, supervision, contact with children, review interval) so the staff member and the case file are clear on what is in place.",
      });
    }
  }

  return flags;
}

function buildReviewSchedule(input: SuspensionDecisionInput): {
  reviewNumber: number;
  expectedDate: string;
}[] {
  if (input.proposedDecision !== "suspend" || !input.firstReviewDate) return [];
  const out: { reviewNumber: number; expectedDate: string }[] = [];
  const interval = Math.max(1, input.welfareReviewIntervalDays || 14);
  const first = new Date(input.firstReviewDate);
  if (isNaN(first.getTime())) return [];
  for (let i = 0; i < 4; i++) {
    const d = new Date(first);
    d.setDate(d.getDate() + i * interval);
    out.push({ reviewNumber: i + 1, expectedDate: d.toISOString().slice(0, 10) });
  }
  return out;
}

function buildSuggestedActions(
  input: SuspensionDecisionInput,
  flags: SuspensionFlag[],
): SuspensionSuggestedAction[] {
  const out: SuspensionSuggestedAction[] = [];

  if (flags.some((f) => f.severity === "block")) {
    out.push({
      title: "Resolve blocking issues before this decision is enacted",
      description:
        "At least one blocking issue has been raised. The decision should not proceed until those issues are addressed and the case file updated.",
      priority: "urgent",
      dueDays: 1,
      assignedRole: "Registered Manager",
    });
  }

  if (input.proposedDecision === "suspend") {
    out.push({
      title: "Run the suspension letter through the HR Process Guardian",
      description:
        "Draft the suspension letter and run it through the Process Guardian before sending. The letter must state that suspension is a neutral act pending investigation, name the welfare contact, and set out review dates.",
      priority: "urgent",
      dueDays: 1,
      assignedRole: "Registered Manager / HR Caseworker",
    });
    out.push({
      title: "Update the rota and inform affected staff",
      description:
        "Adjust the rota to maintain safe staffing and consistency of care, and brief the team on a need-to-know basis. Confidentiality must be maintained.",
      priority: "high",
      dueDays: 1,
      assignedRole: "Registered Manager",
    });
  }

  if (flags.some((f) => f.category === "safeguarding")) {
    out.push({
      title: "Confirm safeguarding pathway",
      description:
        "Confirm whether LADO, the local authority, the placing authority, the police, and Ofsted have been or should be notified. Record the advice received and the action taken in the case chronology.",
      priority: "urgent",
      dueDays: 1,
      assignedRole: "Designated Safeguarding Lead / Registered Manager",
    });
  }

  out.push({
    title: "Complete child impact reflection",
    description:
      "Record what the impact on the children in the home is likely to be, and what reassurance, routine continuity, and support is in place to maintain consistency of care.",
    priority: "high",
    dueDays: 2,
    assignedRole: "Registered Manager",
  });

  return out;
}

function buildWrittenReasonsDraft(
  input: SuspensionDecisionInput,
  overallRisk: SuspensionRiskRating,
  proportionality: SuspensionDecisionAnalysis["proportionalityRating"],
): string {
  if (input.proposedDecision === "do_not_suspend") {
    return [
      `Cara suggested draft. Written reasons for decision not to suspend.`,
      ``,
      `Following the concerns raised on [date] regarding ${input.concernSummary}, a decision has been taken not to suspend ${input.staffId}.`,
      ``,
      `The aggregate risk has been graded as ${overallRisk}. The alternatives considered were: ${input.alternativesConsidered.join(", ") || "[set out alternatives]"}. The arrangement now in place is set out separately and will be reviewed.`,
      ``,
      `HR advice was [sought / not sought]. ${input.ladoAdviceSought ? "LADO was consulted." : "LADO consultation was [considered / not required]."} The case file records the advice received.`,
      ``,
      `This wording is an Cara suggested draft. The Registered Manager remains the author and the decision-maker. Edit before signing.`,
    ].join("\n\n");
  }

  if (input.proposedDecision === "alternative_arrangement") {
    return [
      `Cara suggested draft. Written reasons for alternative arrangement in place of suspension.`,
      ``,
      `Following the concerns raised on [date] regarding ${input.concernSummary}, a decision has been taken to put an alternative arrangement in place rather than suspending ${input.staffId}.`,
      ``,
      `The arrangement is: ${input.alternativeArrangementDescription || "[describe arrangement]"}. The aggregate risk has been graded as ${overallRisk}. The arrangement will be reviewed on or before ${input.firstReviewDate || "[review date]"} and the welfare contact will be ${input.welfareSinglePointOfContact || "[name]"}.`,
      ``,
      `This wording is an Cara suggested draft. The Registered Manager remains the author and the decision-maker. Edit before signing.`,
    ].join("\n\n");
  }

  // suspend
  return [
    `Cara suggested draft. Written reasons for suspension.`,
    ``,
    `Following the concerns raised on [date] regarding ${input.concernSummary}, a decision has been taken to suspend ${input.staffId} with effect from ${input.effectiveFromDate || "[effective date]"}. This suspension is a neutral act and is not a disciplinary sanction. It is in place to allow a fair and proportionate investigation to take place.`,
    ``,
    `The aggregate risk has been graded as ${overallRisk}. The alternatives considered were: ${input.alternativesConsidered.join(", ") || "[set out alternatives]"}. ${input.alternativeRejectionRationale ? `The rationale for not proceeding with an alternative is: ${input.alternativeRejectionRationale}` : "[Set out the rationale for not proceeding with an alternative.]"}`,
    ``,
    `HR advice was ${input.hrAdviceSought ? `sought. ${input.hrAdviceSummary ?? ""}` : "[record HR advice]"}. ${input.riAdviceSought ? `RI advice was sought. ${input.riAdviceSummary ?? ""}` : "[record RI advice if applicable]"}. ${input.ladoAdviceSought ? `LADO was consulted on ${input.ladoAdviceDate ?? "[date]"}: ${input.ladoAdviceSummary ?? ""}` : "[record LADO consultation status]"}.`,
    ``,
    `Welfare arrangements: the single point of contact during the suspension period is ${input.welfareSinglePointOfContact || "[name]"}. Suspension will be reviewed at intervals of no more than ${input.welfareReviewIntervalDays || 14} days. The first review will take place on ${input.firstReviewDate || "[review date]"}. Support offered includes: ${input.welfareSupportOffered.join("; ") || "[occupational health, employee assistance, trade union or external support such as ACAS]"}.`,
    ``,
    `Proportionality: this decision has been considered against the available alternatives and graded as ${proportionality} on the evidence and the assessed risk.`,
    ``,
    `This wording is an Cara suggested draft. The Registered Manager remains the author and the decision-maker. The suspension letter itself must be drafted separately and run through the HR Process Guardian before sending.`,
  ].join("\n\n");
}

// ─── Public entry point ──────────────────────────────────────────────────────

export function analyseSuspensionDecision(
  input: SuspensionDecisionInput,
): SuspensionDecisionAnalysis {
  if (!input.staffId || input.staffId.trim().length === 0) {
    throw new Error("staffId is required");
  }
  if (!input.concernSummary || input.concernSummary.trim().length < 10) {
    throw new Error("concernSummary must be at least 10 characters");
  }

  const { overall, factor } = aggregateRisk(input);
  const proportionality = classifyProportionality(input, overall);

  const flags: SuspensionFlag[] = [
    ...checkAdvice(input),
    ...checkAlternatives(input),
    ...checkWelfare(input),
    ...checkProcess(input),
  ];

  const suggestedActions = buildSuggestedActions(input, flags);
  const writtenReasonsDraft = buildWrittenReasonsDraft(input, overall, proportionality.rating);
  const reviewSchedule = buildReviewSchedule(input);

  const blockCount = flags.filter((f) => f.severity === "block").length;
  const warningCount = flags.filter((f) => f.severity === "warning").length;
  const advisoryCount = flags.filter((f) => f.severity === "advisory").length;

  const caraConfidence = Math.max(
    0.2,
    Math.min(0.9, 0.5 + (blockCount === 0 ? 0.15 : -0.2) + (warningCount === 0 ? 0.1 : 0) + (advisoryCount === 0 ? 0.05 : 0)),
  );

  const rationaleSummary = `Aggregate risk graded as ${overall}, driven by ${factor.replace(/_/g, " ")}. Proposed decision: ${input.proposedDecision.replace(/_/g, " ")}. Proportionality: ${proportionality.rating}.`;

  return {
    generatedAt: new Date().toISOString(),
    status: "draft",
    caraLabel: "Cara suggested draft",
    overallRiskGrade: overall,
    highestRiskFactor: factor,
    rationaleSummary,
    proportionalityRating: proportionality.rating,
    proportionalityRationale: proportionality.rationale,
    flags,
    suggestedActions,
    writtenReasonsDraft,
    reviewSchedule,
    regulatoryLinks: REGULATORY_LINKS,
    caraConfidence: Math.round(caraConfidence * 100) / 100,
    engineVersion: ENGINE_VERSION,
  };
}

export { ENGINE_VERSION };

// ─── Helper for managers — risk factors map skeleton ─────────────────────────

export function emptyRiskFactors(): SuspensionDecisionInput["riskFactors"] {
  return {
    risk_to_children: { rating: "low", rationale: "" },
    risk_to_witnesses: { rating: "low", rationale: "" },
    risk_to_evidence: { rating: "low", rationale: "" },
    risk_to_staff_member: { rating: "low", rationale: "" },
    risk_of_repeat_incident: { rating: "low", rationale: "" },
  };
}
