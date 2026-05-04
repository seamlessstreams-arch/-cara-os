import type {
  CandidateProfile,
  CandidateCheck,
  CandidateReference,
  GapExplanation,
  ConditionalOffer,
  RulesResult,
  RulesBlocker,
  RulesWarning,
} from "@/types/recruitment";

export function evaluateCandidateRules(
  candidate: CandidateProfile,
  checks: CandidateCheck[],
  references: CandidateReference[],
  gaps: GapExplanation[],
  offer: ConditionalOffer | null,
): RulesResult {
  const blockers: RulesBlocker[] = [];
  const warnings: RulesWarning[] = [];
  const autoTasks: RulesResult["auto_tasks"] = [];
  const ariaSuggestions: string[] = [];

  const ADVANCED_STAGES = ["conditional_offer", "pre_start_checks", "final_clearance", "onboarding", "appointed"];
  const isAdvancedStage = ADVANCED_STAGES.includes(candidate.current_stage);

  // RULE 1: References — need at least 2
  const receivedRefs = references.filter(r =>
    ["received", "satisfactory", "unsatisfactory", "concerns_noted", "verbal_only"].includes(r.status)
  );
  if (receivedRefs.length < 2 && isAdvancedStage) {
    blockers.push({
      code: "REF_INSUFFICIENT",
      message: `Only ${receivedRefs.length} of 2 required references received`,
      entity_type: "references",
      entity_id: null,
      severity: "blocker",
    });
    ariaSuggestions.push("Draft a reference chase email for outstanding references");
  } else if (receivedRefs.length < 2) {
    warnings.push({
      code: "REF_PENDING",
      message: `${2 - receivedRefs.length} reference(s) still outstanding`,
      recommended_action: "Request or chase outstanding references",
    });
  }

  // RULE 2: Most recent employer reference must be from most recent employer
  const mostRecentEmployerRef = references.find(r => r.is_most_recent_employer);
  if (!mostRecentEmployerRef && isAdvancedStage) {
    blockers.push({
      code: "REF_NO_MOST_RECENT_EMPLOYER",
      message: "Reference from most recent employer has not been received",
      entity_type: "references",
      entity_id: null,
      severity: "blocker",
    });
  }

  // RULE 3: DBS check
  const dbsCheck = checks.find(c => c.check_type === "enhanced_dbs");
  if (dbsCheck?.concern_flag) {
    blockers.push({
      code: "DBS_CONCERN",
      message: "DBS check has a concern flag — manager must review before any further progression",
      entity_type: "candidate_check",
      entity_id: dbsCheck.id,
      severity: "blocker",
    });
    ariaSuggestions.push("Flag this DBS concern to the Registered Manager for immediate review");
  }
  if (!dbsCheck || dbsCheck.status === "not_started") {
    if (isAdvancedStage) {
      warnings.push({
        code: "DBS_NOT_STARTED",
        message: "Enhanced DBS application has not been started",
        recommended_action: "Request DBS application immediately",
      });
    }
  }

  // RULE 4: Right to work — blocker if not verified before conditional offer
  const rtwCheck = checks.find(c => c.check_type === "right_to_work");
  if (isAdvancedStage && (!rtwCheck || rtwCheck.status !== "verified")) {
    blockers.push({
      code: "RTW_NOT_VERIFIED",
      message: "Right to work has not been verified — candidate cannot start employment",
      entity_type: "candidate_check",
      entity_id: rtwCheck?.id ?? null,
      severity: "blocker",
    });
  }

  // RULE 5: Unexplained gaps
  const unsatisfactoryGaps = gaps.filter(g =>
    ["detected", "explanation_requested"].includes(g.status)
  );
  if (unsatisfactoryGaps.length > 0) {
    if (isAdvancedStage) {
      blockers.push({
        code: "GAPS_UNEXPLAINED",
        message: `${unsatisfactoryGaps.length} unexplained employment gap(s) must be resolved before final clearance`,
        entity_type: "gap_explanation",
        entity_id: null,
        severity: "blocker",
      });
    } else {
      warnings.push({
        code: "GAPS_PENDING",
        message: `${unsatisfactoryGaps.length} employment gap(s) need explanation`,
        recommended_action: "Request written explanation from candidate",
      });
    }
    ariaSuggestions.push("Draft a gap explanation request letter for the candidate");
  }

  // RULE 6: Exceptional start without risk mitigation
  if (offer?.exceptional_start && !offer.exceptional_start_risk_mitigation) {
    blockers.push({
      code: "EXCEPTIONAL_START_NO_MITIGATION",
      message: "Exceptional start has been approved but no risk mitigation plan has been documented",
      entity_type: "conditional_offer",
      entity_id: offer.id,
      severity: "blocker",
    });
  }

  // RULE 7: Discrepancy flags
  const discrepancies = references.filter(r => r.discrepancy_flag);
  if (discrepancies.length > 0) {
    blockers.push({
      code: "REFERENCE_DISCREPANCY",
      message: `${discrepancies.length} reference discrepancy flag(s) require manager review`,
      entity_type: "references",
      entity_id: null,
      severity: "blocker",
    });
    ariaSuggestions.push("Review reference discrepancies and consider whether to probe at verbal verification stage");
  }

  // RULE 8: Unsatisfactory references
  const unsatisfactoryRefs = references.filter(r => r.status === "unsatisfactory");
  if (unsatisfactoryRefs.length > 0) {
    blockers.push({
      code: "REFERENCE_UNSATISFACTORY",
      message: "One or more references returned unsatisfactory — progression blocked pending manager decision",
      entity_type: "references",
      entity_id: null,
      severity: "blocker",
    });
  }

  // Permitted next stages
  const stageOrder = [
    "enquiry", "application_received", "sift", "interview_scheduled",
    "interview_completed", "references_requested", "references_received",
    "dbs_submitted", "dbs_received", "conditional_offer", "pre_start_checks",
    "final_clearance", "onboarding", "appointed",
  ];
  const currentIdx = stageOrder.indexOf(candidate.current_stage);
  const permitted = blockers.length === 0
    ? stageOrder.slice(currentIdx + 1, currentIdx + 2)
    : [];

  // Always allow marking unsuccessful or withdrawn
  const permittedNextStages = [
    ...permitted,
    "unsuccessful",
    "withdrawn",
  ] as RulesResult["permitted_next_stages"];

  return {
    candidate_id: candidate.id,
    can_progress: blockers.length === 0,
    permitted_next_stages: permittedNextStages,
    blockers,
    warnings,
    auto_tasks: autoTasks,
    aria_suggestions: ariaSuggestions,
  };
}

// Compute compliance score 0–100
export function computeComplianceScore(checks: CandidateCheck[]): number {
  if (checks.length === 0) return 0;
  const required = checks.filter(c => c.required);
  if (required.length === 0) return 0;
  const verified = required.filter(
    c => c.status === "verified" || c.status === "override_approved"
  ).length;
  return Math.round((verified / required.length) * 100);
}

// Check type to friendly label map
export const CHECK_TYPE_LABELS: Record<string, string> = {
  enhanced_dbs: "Enhanced DBS",
  barred_list: "Barred List",
  right_to_work: "Right to Work",
  identity: "Identity Verification",
  overseas_criminal_record: "Overseas Criminal Record",
  professional_qualifications: "Qualifications",
  employment_history: "Employment History",
  medical_fitness: "Medical Fitness",
  social_media: "Social Media",
  references: "References",
  driving_licence: "Driving Licence",
  safeguarding_training_check: "Safeguarding Training",
};

// Default required checks for a residential care worker role
export const DEFAULT_REQUIRED_CHECKS = [
  "enhanced_dbs",
  "barred_list",
  "right_to_work",
  "identity",
  "references",
  "employment_history",
  "medical_fitness",
];
