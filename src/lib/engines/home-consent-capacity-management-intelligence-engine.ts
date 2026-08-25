import { below, meets, rate } from "@/lib/metrics/rate";
// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME CONSENT & CAPACITY MANAGEMENT INTELLIGENCE ENGINE
// Tracks consent management quality — consent form completion, Gillick
// competence assessments, informed consent documentation, capacity reviews,
// and consent withdrawal handling. Critical for Ofsted under Children's Homes
// Regulations 2015 (Reg 5 quality of care, Reg 7 children's views, Reg 14
// health care, SCCIF voice of the child).
// HOME-LEVEL engine.
// Pure deterministic engine — no imports, no LLM, no external deps.
// CHR 2015 Reg 5 (Quality of care), Reg 7 (Children's views),
// Reg 14 (Health care), SCCIF voice of the child.
// Store keys: consentFormRecords, gillickAssessmentRecords,
//             capacityReviewRecords, informedConsentRecords,
//             consentWithdrawalRecords
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface ConsentFormInput {
  id: string;
  child_id: string;
  consent_type: "medical" | "dental" | "educational" | "photographic" | "travel" | "activities" | "research" | "general";
  date_requested: string;
  date_completed: string | null;
  completed: boolean;
  person_giving_consent: "parent" | "local_authority" | "child" | "guardian" | "social_worker";
  consent_granted: boolean;
  expiry_date: string | null;
  expired: boolean;
  reviewed: boolean;
  review_date: string | null;
  review_overdue: boolean;
  child_consulted: boolean;
  child_views_recorded: boolean;
  accessible_format_used: boolean;
  staff_name: string;
  created_at: string;
}

export interface GillickAssessmentInput {
  id: string;
  child_id: string;
  assessment_date: string;
  assessor_name: string;
  assessment_area: "medical" | "dental" | "contraception" | "mental_health" | "substance_misuse" | "general_health" | "other";
  child_age_at_assessment: number;
  competence_determined: boolean;
  competence_outcome: "competent" | "not_competent" | "partially_competent" | "deferred";
  evidence_documented: boolean;
  child_understanding_verified: boolean;
  information_provided_age_appropriate: boolean;
  multi_disciplinary_input: boolean;
  outcome_explained_to_child: boolean;
  review_date: string | null;
  review_overdue: boolean;
  created_at: string;
}

export interface CapacityReviewInput {
  id: string;
  child_id: string;
  review_date: string;
  reviewer_name: string;
  review_type: "initial" | "scheduled" | "triggered" | "annual" | "pre_decision";
  capacity_area: "medical" | "financial" | "placement" | "education" | "contact" | "legal" | "daily_living";
  capacity_outcome: "full_capacity" | "partial_capacity" | "lacks_capacity" | "fluctuating" | "developing";
  decision_specific: boolean;
  best_interests_considered: boolean;
  child_supported_to_participate: boolean;
  reasonable_adjustments_made: boolean;
  advocacy_offered: boolean;
  outcome_communicated_to_child: boolean;
  next_review_date: string | null;
  next_review_overdue: boolean;
  created_at: string;
}

export interface InformedConsentInput {
  id: string;
  child_id: string;
  consent_date: string;
  decision_type: "medical_treatment" | "therapy" | "medication_change" | "placement_move" | "education_change" | "contact_arrangement" | "assessment" | "information_sharing";
  information_provided: boolean;
  information_age_appropriate: boolean;
  risks_explained: boolean;
  benefits_explained: boolean;
  alternatives_discussed: boolean;
  questions_encouraged: boolean;
  child_understanding_confirmed: boolean;
  time_given_to_decide: boolean;
  consent_documented: boolean;
  witness_present: boolean;
  interpreter_needed: boolean;
  interpreter_provided: boolean;
  created_at: string;
}

export interface ConsentWithdrawalInput {
  id: string;
  child_id: string;
  withdrawal_date: string;
  original_consent_type: "medical" | "dental" | "educational" | "photographic" | "travel" | "activities" | "therapy" | "general";
  reason_recorded: boolean;
  child_views_sought: boolean;
  withdrawal_respected: boolean;
  action_taken_promptly: boolean;
  relevant_parties_notified: boolean;
  alternative_options_discussed: boolean;
  impact_assessment_completed: boolean;
  documentation_updated: boolean;
  manager_informed: boolean;
  follow_up_planned: boolean;
  created_at: string;
}

export interface ConsentCapacityInput {
  today: string;
  total_children: number;
  consent_form_records: ConsentFormInput[];
  gillick_assessment_records: GillickAssessmentInput[];
  capacity_review_records: CapacityReviewInput[];
  informed_consent_records: InformedConsentInput[];
  consent_withdrawal_records: ConsentWithdrawalInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type ConsentCapacityRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface ConsentCapacityInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface ConsentCapacityRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface ConsentCapacityResult {
  consent_rating: ConsentCapacityRating;
  consent_score: number | null;
  headline: string;
  total_consent_forms: number;
  consent_coverage_rate: number | null;
  gillick_assessment_rate: number | null;
  capacity_review_rate: number | null;
  informed_consent_rate: number | null;
  withdrawal_handling_rate: number | null;
  child_understanding_rate: number | null;
  consent_review_compliance_rate: number | null;
  gillick_evidence_rate: number | null;
  strengths: string[];
  concerns: string[];
  recommendations: ConsentCapacityRecommendation[];
  insights: ConsentCapacityInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): ConsentCapacityRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Empty Result Factory ────────────────────────────────────────────────────

function emptyResult(
  rating: ConsentCapacityRating,
  score: number,
  headline: string,
): ConsentCapacityResult {
  return {
    consent_rating: rating,
    consent_score: score,
    headline,
    total_consent_forms: 0,
    consent_coverage_rate: null,
    gillick_assessment_rate: null,
    capacity_review_rate: null,
    informed_consent_rate: null,
    withdrawal_handling_rate: null,
    child_understanding_rate: null,
    consent_review_compliance_rate: null,
    gillick_evidence_rate: null,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeConsentCapacityManagement(
  input: ConsentCapacityInput,
): ConsentCapacityResult {
  const {
    total_children,
    consent_form_records,
    gillick_assessment_records,
    capacity_review_records,
    informed_consent_records,
    consent_withdrawal_records,
  } = input;

  // ── Special case: all empty + 0 children → insufficient_data ──────────
  const allEmpty =
    consent_form_records.length === 0 &&
    gillick_assessment_records.length === 0 &&
    capacity_review_records.length === 0 &&
    informed_consent_records.length === 0 &&
    consent_withdrawal_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement — insufficient data to assess consent and capacity management.",
    );
  }

  // ── Special case: all empty + children > 0 → inadequate ───────────────
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No consent or capacity data recorded despite children on placement — consent management requires urgent attention.",
      ),
      concerns: [
        "No consent forms, Gillick competence assessments, capacity reviews, informed consent records, or consent withdrawal records exist despite children being on placement — the home cannot evidence that children's consent rights are being respected or that capacity is being properly assessed.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement a structured consent management framework immediately, ensuring all children have appropriate consent forms in place for medical, dental, educational, and other key areas of their care.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
        },
        {
          rank: 2,
          recommendation:
            "Establish a Gillick competence assessment process for all children under 16, ensuring their evolving capacity to make decisions is formally assessed and documented in line with best practice.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 7 — Children's views",
        },
        {
          rank: 3,
          recommendation:
            "Develop informed consent procedures that ensure children and young people are given age-appropriate information, have their understanding checked, and are supported to participate in decisions about their care.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 14 — Health care",
        },
      ],
      insights: [
        {
          text: "The complete absence of consent and capacity records means the home cannot demonstrate that children's consent rights are being upheld or that their evolving capacity is being respected. Ofsted expects homes to evidence that children are consulted, their views are sought, and consent is properly obtained and documented. This represents a fundamental gap in children's rights and participation.",
          severity: "critical",
        },
      ],
    };
  }

  // ── Compute core metrics ──────────────────────────────────────────────

  // --- Consent form coverage ---
  const totalConsentForms = consent_form_records.length;
  const completedConsentForms = consent_form_records.filter(
    (f) => f.completed,
  ).length;
  const consentCompletionRate = rate(completedConsentForms, totalConsentForms);

  const uniqueChildrenWithConsent = new Set(
    consent_form_records.map((f) => f.child_id),
  ).size;
  const consentCoverageRate =
    total_children > 0 ? rate(uniqueChildrenWithConsent, total_children) : 0;

  const consentFormsAccessibleFormat = consent_form_records.filter(
    (f) => f.accessible_format_used,
  ).length;
  const accessibleFormatRate = rate(consentFormsAccessibleFormat, totalConsentForms);

  const overdueConsentReviews = consent_form_records.filter(
    (f) => f.review_overdue,
  ).length;
  const consentReviewComplianceRate =
    totalConsentForms > 0
      ? rate(totalConsentForms - overdueConsentReviews, totalConsentForms)
      : null;

  const expiredConsents = consent_form_records.filter(
    (f) => f.expired && !f.reviewed,
  ).length;

  // --- Gillick competence assessments ---
  const totalGillickAssessments = gillick_assessment_records.length;
  const uniqueChildrenWithGillick = new Set(
    gillick_assessment_records.map((g) => g.child_id),
  ).size;
  const gillickAssessmentRate =
    total_children > 0 ? rate(uniqueChildrenWithGillick, total_children) : 0;

  const gillickEvidenceDocumented = gillick_assessment_records.filter(
    (g) => g.evidence_documented,
  ).length;
  const gillickEvidenceRate = rate(gillickEvidenceDocumented, totalGillickAssessments);

  const gillickChildUnderstandingVerified = gillick_assessment_records.filter(
    (g) => g.child_understanding_verified,
  ).length;

  const gillickMultiDisciplinary = gillick_assessment_records.filter(
    (g) => g.multi_disciplinary_input,
  ).length;
  const gillickMultiDisciplinaryRate = rate(gillickMultiDisciplinary, totalGillickAssessments);

  const overdueGillickReviews = gillick_assessment_records.filter(
    (g) => g.review_overdue,
  ).length;

  // --- Capacity reviews ---
  const totalCapacityReviews = capacity_review_records.length;
  const uniqueChildrenWithCapacityReview = new Set(
    capacity_review_records.map((c) => c.child_id),
  ).size;
  const capacityReviewRate =
    total_children > 0 ? rate(uniqueChildrenWithCapacityReview, total_children) : 0;

  const capacityBestInterests = capacity_review_records.filter(
    (c) => c.best_interests_considered,
  ).length;
  const bestInterestsRate = rate(capacityBestInterests, totalCapacityReviews);

  const capacityReasonableAdjustments = capacity_review_records.filter(
    (c) => c.reasonable_adjustments_made,
  ).length;
  const reasonableAdjustmentsRate = rate(capacityReasonableAdjustments, totalCapacityReviews);

  const capacityAdvocacyOffered = capacity_review_records.filter(
    (c) => c.advocacy_offered,
  ).length;
  const advocacyOfferedRate = rate(capacityAdvocacyOffered, totalCapacityReviews);

  const overdueCapacityReviews = capacity_review_records.filter(
    (c) => c.next_review_overdue,
  ).length;

  // --- Informed consent documentation ---
  const totalInformedConsents = informed_consent_records.length;
  const uniqueChildrenWithInformedConsent = new Set(
    informed_consent_records.map((ic) => ic.child_id),
  ).size;
  const informedConsentRate =
    total_children > 0 ? rate(uniqueChildrenWithInformedConsent, total_children) : 0;

  const informedConsentAgeAppropriate = informed_consent_records.filter(
    (ic) => ic.information_age_appropriate,
  ).length;
  const infoAgeAppropriateRate = rate(informedConsentAgeAppropriate, totalInformedConsents);

  const informedConsentRisksExplained = informed_consent_records.filter(
    (ic) => ic.risks_explained,
  ).length;
  const risksExplainedRate = rate(informedConsentRisksExplained, totalInformedConsents);

  const informedConsentUnderstandingConfirmed = informed_consent_records.filter(
    (ic) => ic.child_understanding_confirmed,
  ).length;

  const informedConsentTimeGiven = informed_consent_records.filter(
    (ic) => ic.time_given_to_decide,
  ).length;
  const timeGivenRate = rate(informedConsentTimeGiven, totalInformedConsents);

  const informedConsentDocumented = informed_consent_records.filter(
    (ic) => ic.consent_documented,
  ).length;
  const consentDocumentedRate = rate(informedConsentDocumented, totalInformedConsents);

  const interpreterNeeded = informed_consent_records.filter(
    (ic) => ic.interpreter_needed,
  ).length;
  const interpreterProvided = informed_consent_records.filter(
    (ic) => ic.interpreter_needed && ic.interpreter_provided,
  ).length;
  const interpreterProvisionRate = rate(interpreterProvided, interpreterNeeded);

  // --- Consent withdrawal handling ---
  const totalWithdrawals = consent_withdrawal_records.length;
  const withdrawalsRespected = consent_withdrawal_records.filter(
    (w) => w.withdrawal_respected,
  ).length;
  const withdrawalRespectedRate = rate(withdrawalsRespected, totalWithdrawals);

  const withdrawalsPrompt = consent_withdrawal_records.filter(
    (w) => w.action_taken_promptly,
  ).length;
  const withdrawalPromptRate = rate(withdrawalsPrompt, totalWithdrawals);

  const withdrawalsReasonRecorded = consent_withdrawal_records.filter(
    (w) => w.reason_recorded,
  ).length;
  const withdrawalReasonRate = rate(withdrawalsReasonRecorded, totalWithdrawals);

  const withdrawalsChildViewsSought = consent_withdrawal_records.filter(
    (w) => w.child_views_sought,
  ).length;
  const withdrawalChildViewsRate = rate(withdrawalsChildViewsSought, totalWithdrawals);

  const withdrawalsDocUpdated = consent_withdrawal_records.filter(
    (w) => w.documentation_updated,
  ).length;
  const withdrawalDocRate = rate(withdrawalsDocUpdated, totalWithdrawals);

  // --- Composite withdrawal handling rate ---
  const withdrawalHandlingRate =
    totalWithdrawals > 0 ? Math.round(
          (withdrawalRespectedRate! + withdrawalPromptRate! + withdrawalReasonRate! + withdrawalChildViewsRate! + withdrawalDocRate!) / 5) : null;

  // --- Child understanding rate (composite across Gillick + informed consent) ---
  const totalUnderstandingOpportunities = totalGillickAssessments + totalInformedConsents;
  const totalUnderstandingConfirmed =
    gillickChildUnderstandingVerified + informedConsentUnderstandingConfirmed;
  const childUnderstandingRate = rate(totalUnderstandingConfirmed, totalUnderstandingOpportunities);

  // ── Scoring: base 52 ─────────────────────────────────────────────────

  let score = 52;

  // --- Bonus 1: consentCoverageRate (>=100: +4, >=80: +2) ---
  if (meets(consentCoverageRate, 100)) score += 4;
  else if (meets(consentCoverageRate, 80)) score += 2;

  // --- Bonus 2: gillickAssessmentRate (>=80: +4, >=60: +2) ---
  if (meets(gillickAssessmentRate, 80)) score += 4;
  else if (meets(gillickAssessmentRate, 60)) score += 2;

  // --- Bonus 3: capacityReviewRate (>=80: +3, >=60: +1) ---
  if (meets(capacityReviewRate, 80)) score += 3;
  else if (meets(capacityReviewRate, 60)) score += 1;

  // --- Bonus 4: informedConsentRate (>=80: +3, >=60: +1) ---
  if (meets(informedConsentRate, 80)) score += 3;
  else if (meets(informedConsentRate, 60)) score += 1;

  // --- Bonus 5: withdrawalHandlingRate (>=90: +3, >=70: +2) ---
  if ((withdrawalHandlingRate ?? 0) >= 90) score += 3;
  else if ((withdrawalHandlingRate ?? 0) >= 70) score += 2;

  // --- Bonus 6: childUnderstandingRate (>=90: +3, >=70: +1) ---
  if (meets(childUnderstandingRate, 90)) score += 3;
  else if (meets(childUnderstandingRate, 70)) score += 1;

  // --- Bonus 7: consentReviewComplianceRate (>=100: +3, >=80: +1) ---
  if ((consentReviewComplianceRate ?? 0) >= 100) score += 3;
  else if ((consentReviewComplianceRate ?? 0) >= 80) score += 1;

  // --- Bonus 8: gillickEvidenceRate (>=90: +3, >=70: +1) ---
  if (meets(gillickEvidenceRate, 90)) score += 3;
  else if (meets(gillickEvidenceRate, 70)) score += 1;

  // --- Bonus 9: consentDocumentedRate (>=95: +2, >=80: +1) ---
  if (meets(consentDocumentedRate, 95)) score += 2;
  else if (meets(consentDocumentedRate, 80)) score += 1;

  // Total max bonuses: 4+4+3+3+3+3+3+3+2 = 28 → 52+28 = 80 = outstanding threshold

  // ── Penalties ─────────────────────────────────────────────────────────

  // Penalty 1: consentCoverageRate < 50 → -5 (guarded by records)
  if (below(consentCoverageRate, 50) && consent_form_records.length > 0 && total_children > 0) {
    score -= 5;
  }

  // Penalty 2: gillickAssessmentRate < 40 → -5 (guarded by records)
  if (below(gillickAssessmentRate, 40) && gillick_assessment_records.length > 0 && total_children > 0) {
    score -= 5;
  }

  // Penalty 3: childUnderstandingRate < 40 → -4 (guarded by records)
  if (below(childUnderstandingRate, 40) && totalUnderstandingOpportunities > 0) {
    score -= 4;
  }

  // Penalty 4: withdrawalHandlingRate < 50 → -4 (guarded by records)
  if ((withdrawalHandlingRate ?? 0) < 50 && consent_withdrawal_records.length > 0) {
    score -= 4;
  }

  score = clamp(score, 0, 100);

  const consent_rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────

  const strengths: string[] = [];

  if (meets(consentCoverageRate, 100) && total_children > 0) {
    strengths.push(
      "Every child has consent forms in place — the home demonstrates comprehensive consent management ensuring all children's care activities are properly authorised.",
    );
  } else if (meets(consentCoverageRate, 80) && total_children > 0) {
    strengths.push(
      `${consentCoverageRate}% of children have consent forms in place — strong coverage in obtaining and documenting consent for children's care.`,
    );
  }

  if (meets(consentCompletionRate, 95) && totalConsentForms > 0) {
    strengths.push(
      `${consentCompletionRate}% consent form completion rate — the home ensures that consent processes are followed through to completion, providing a robust evidence base for care decisions.`,
    );
  } else if (meets(consentCompletionRate, 80) && totalConsentForms > 0) {
    strengths.push(
      `${consentCompletionRate}% of consent forms completed — the majority of consent requests are properly processed and documented.`,
    );
  }

  if (meets(gillickAssessmentRate, 80) && total_children > 0) {
    strengths.push(
      `${gillickAssessmentRate}% of children have Gillick competence assessments — the home proactively assesses children's evolving capacity to make their own decisions, promoting autonomy and rights.`,
    );
  } else if (meets(gillickAssessmentRate, 60) && total_children > 0) {
    strengths.push(
      `${gillickAssessmentRate}% Gillick assessment coverage — the home is actively assessing children's competence to make decisions about their care.`,
    );
  }

  if (meets(gillickEvidenceRate, 90) && totalGillickAssessments > 0) {
    strengths.push(
      `${gillickEvidenceRate}% of Gillick assessments are evidenced with documented rationale — the home provides a strong audit trail demonstrating how competence decisions are reached.`,
    );
  } else if (meets(gillickEvidenceRate, 70) && totalGillickAssessments > 0) {
    strengths.push(
      `${gillickEvidenceRate}% Gillick assessment evidence documentation — most competence assessments include documented rationale.`,
    );
  }

  if (meets(capacityReviewRate, 80) && total_children > 0) {
    strengths.push(
      `${capacityReviewRate}% of children have capacity reviews — the home systematically assesses and reviews children's decision-making capacity across relevant areas of their lives.`,
    );
  } else if (meets(capacityReviewRate, 60) && total_children > 0) {
    strengths.push(
      `${capacityReviewRate}% capacity review coverage — the home regularly reviews children's capacity to participate in key decisions.`,
    );
  }

  if (meets(informedConsentRate, 80) && total_children > 0) {
    strengths.push(
      `${informedConsentRate}% of children have informed consent documentation — the home ensures children are given sufficient information to make genuine, informed choices about their care.`,
    );
  } else if (meets(informedConsentRate, 60) && total_children > 0) {
    strengths.push(
      `${informedConsentRate}% informed consent coverage — the home provides information to support children's decision-making for most care decisions.`,
    );
  }

  if (meets(childUnderstandingRate, 90) && totalUnderstandingOpportunities > 0) {
    strengths.push(
      `${childUnderstandingRate}% child understanding verification rate — the home consistently checks that children genuinely understand what they are consenting to, going beyond simply obtaining a signature.`,
    );
  } else if (meets(childUnderstandingRate, 70) && totalUnderstandingOpportunities > 0) {
    strengths.push(
      `${childUnderstandingRate}% child understanding confirmed — the home generally verifies children's comprehension before proceeding with consent.`,
    );
  }

  if ((withdrawalHandlingRate ?? 0) >= 90 && totalWithdrawals > 0) {
    strengths.push(
      `Consent withdrawal handling at ${withdrawalHandlingRate}% — the home demonstrates excellent practice in respecting and processing children's decisions to withdraw consent, reinforcing children's agency and rights.`,
    );
  } else if ((withdrawalHandlingRate ?? 0) >= 70 && totalWithdrawals > 0) {
    strengths.push(
      `${withdrawalHandlingRate}% withdrawal handling compliance — the home responds appropriately when consent is withdrawn.`,
    );
  }

  if ((consentReviewComplianceRate ?? 0) >= 100 && totalConsentForms > 0) {
    strengths.push(
      "All consent reviews are up to date — the home ensures consent remains current and reflective of children's evolving wishes and circumstances.",
    );
  } else if ((consentReviewComplianceRate ?? 0) >= 80 && totalConsentForms > 0) {
    strengths.push(
      `${consentReviewComplianceRate}% consent review compliance — strong adherence to consent review timescales.`,
    );
  }

  if (meets(bestInterestsRate, 90) && totalCapacityReviews > 0) {
    strengths.push(
      `Best interests are considered in ${bestInterestsRate}% of capacity reviews — the home ensures that where a child lacks capacity, decisions are made with their best interests as the paramount concern.`,
    );
  }

  if (meets(advocacyOfferedRate, 80) && totalCapacityReviews > 0) {
    strengths.push(
      `Advocacy is offered in ${advocacyOfferedRate}% of capacity reviews — children are supported to have their voices heard through independent advocacy when needed.`,
    );
  }

  if (meets(accessibleFormatRate, 80) && totalConsentForms > 0) {
    strengths.push(
      `${accessibleFormatRate}% of consent forms use accessible formats — the home tailors consent materials to children's individual communication needs.`,
    );
  }

  if (meets(timeGivenRate, 90) && totalInformedConsents > 0) {
    strengths.push(
      `${timeGivenRate}% of informed consent processes provide adequate time to decide — children are not rushed into decisions about their care.`,
    );
  }

  if (meets(gillickMultiDisciplinaryRate, 70) && totalGillickAssessments > 0) {
    strengths.push(
      `${gillickMultiDisciplinaryRate}% of Gillick assessments include multi-disciplinary input — competence determinations draw on a range of professional perspectives.`,
    );
  }

  if (meets(interpreterProvisionRate, 100) && interpreterNeeded > 0) {
    strengths.push(
      "Interpreters are provided in all cases where needed — the home ensures language is never a barrier to informed consent.",
    );
  }

  // ── Concerns ──────────────────────────────────────────────────────────

  const concerns: string[] = [];

  if (below(consentCoverageRate, 50) && total_children > 0) {
    concerns.push(
      `Only ${consentCoverageRate}% of children have consent forms in place — the majority of children's care activities may be proceeding without properly documented consent, creating significant safeguarding and regulatory risk.`,
    );
  } else if (below(consentCoverageRate, 80) && meets(consentCoverageRate, 50) && total_children > 0) {
    concerns.push(
      `Consent form coverage at ${consentCoverageRate}% — some children do not have all necessary consent forms in place, which may delay or complicate care delivery.`,
    );
  }

  if (below(gillickAssessmentRate, 40) && total_children > 0 && totalGillickAssessments > 0) {
    concerns.push(
      `Only ${gillickAssessmentRate}% of children have Gillick competence assessments — the home is not systematically assessing children's evolving capacity to make their own decisions, which undermines their right to participate in care decisions.`,
    );
  } else if (below(gillickAssessmentRate, 60) && meets(gillickAssessmentRate, 40) && total_children > 0) {
    concerns.push(
      `Gillick assessment coverage at ${gillickAssessmentRate}% — not all children have been assessed for their competence to make decisions, potentially limiting their autonomy.`,
    );
  }

  if (below(capacityReviewRate, 40) && total_children > 0 && totalCapacityReviews > 0) {
    concerns.push(
      `Only ${capacityReviewRate}% of children have capacity reviews — decisions may be being made about children without proper assessment of their ability to participate, which undermines their rights under Reg 7.`,
    );
  } else if (below(capacityReviewRate, 60) && meets(capacityReviewRate, 40) && total_children > 0) {
    concerns.push(
      `Capacity review coverage at ${capacityReviewRate}% — gaps in capacity assessment mean some children's decision-making abilities may not be properly recognised.`,
    );
  }

  if (below(childUnderstandingRate, 40) && totalUnderstandingOpportunities > 0) {
    concerns.push(
      `Child understanding verification at only ${childUnderstandingRate}% — consent may be obtained without ensuring children genuinely understand what they are agreeing to, raising questions about whether consent is truly informed.`,
    );
  } else if (below(childUnderstandingRate, 70) && meets(childUnderstandingRate, 40) && totalUnderstandingOpportunities > 0) {
    concerns.push(
      `Child understanding confirmed in ${childUnderstandingRate}% of cases — the home should more consistently verify children's comprehension before accepting consent.`,
    );
  }

  if ((withdrawalHandlingRate ?? 0) < 50 && totalWithdrawals > 0) {
    concerns.push(
      `Consent withdrawal handling at ${withdrawalHandlingRate}% — when children or their representatives withdraw consent, the process is not consistently followed, potentially meaning withdrawn consent is not being respected or appropriate action is not being taken.`,
    );
  } else if ((withdrawalHandlingRate ?? 0) < 70 && (withdrawalHandlingRate ?? 0) >= 50 && totalWithdrawals > 0) {
    concerns.push(
      `Withdrawal handling at ${withdrawalHandlingRate}% — some consent withdrawals are not being fully processed, which may undermine children's trust in the consent process.`,
    );
  }

  if (overdueConsentReviews > 0 && totalConsentForms > 0) {
    const overdueRate = rate(overdueConsentReviews, totalConsentForms);
    if (meets(overdueRate, 30)) {
      concerns.push(
        `${overdueConsentReviews} consent reviews are overdue (${overdueRate}% of all forms) — consent may no longer reflect children's current wishes or circumstances, and the home cannot demonstrate that consent remains valid.`,
      );
    } else if (meets(overdueRate, 10)) {
      concerns.push(
        `${overdueConsentReviews} consent reviews are overdue — the home should ensure all consent is reviewed within scheduled timescales to maintain currency.`,
      );
    }
  }

  if (below(gillickEvidenceRate, 50) && totalGillickAssessments > 0) {
    concerns.push(
      `Only ${gillickEvidenceRate}% of Gillick assessments have documented evidence — without clear rationale, competence decisions cannot be justified and are vulnerable to challenge.`,
    );
  } else if (below(gillickEvidenceRate, 70) && meets(gillickEvidenceRate, 50) && totalGillickAssessments > 0) {
    concerns.push(
      `Gillick evidence documentation at ${gillickEvidenceRate}% — some competence assessments lack the documented reasoning needed to support the conclusions reached.`,
    );
  }

  if (expiredConsents > 0) {
    concerns.push(
      `${expiredConsents} consent form${expiredConsents > 1 ? "s have" : " has"} expired without being reviewed — care activities may be continuing under consent that is no longer valid.`,
    );
  }

  if (below(infoAgeAppropriateRate, 60) && totalInformedConsents > 0) {
    concerns.push(
      `Only ${infoAgeAppropriateRate}% of informed consent processes use age-appropriate information — children may not be receiving information in a way they can understand, undermining the quality of their consent.`,
    );
  }

  if (below(risksExplainedRate, 60) && totalInformedConsents > 0) {
    concerns.push(
      `Risks are explained in only ${risksExplainedRate}% of informed consent cases — children and their representatives may not have a full picture of potential consequences when giving consent.`,
    );
  }

  if (overdueGillickReviews > 0 && totalGillickAssessments > 0) {
    concerns.push(
      `${overdueGillickReviews} Gillick competence review${overdueGillickReviews > 1 ? "s are" : " is"} overdue — children's competence should be reassessed regularly as they develop, and overdue reviews may mean outdated assessments are being relied upon.`,
    );
  }

  if (overdueCapacityReviews > 0 && totalCapacityReviews > 0) {
    concerns.push(
      `${overdueCapacityReviews} capacity review${overdueCapacityReviews > 1 ? "s are" : " is"} overdue — capacity should be reassessed to reflect changes in children's abilities and circumstances.`,
    );
  }

  // ── Recommendations ───────────────────────────────────────────────────

  const recommendations: ConsentCapacityRecommendation[] = [];
  let recRank = 0;

  if (below(consentCoverageRate, 80) && total_children > 0) {
    recommendations.push({
      rank: ++recRank,
      recommendation:
        below(consentCoverageRate, 50)
          ? "Urgently audit all children's consent records and ensure every child has the full suite of required consent forms in place — medical, dental, educational, photographic, and activity consents must be obtained and documented as a priority."
          : "Review consent form coverage and address gaps — ensure that all children have comprehensive, up-to-date consent forms across all required areas of their care.",
      urgency: below(consentCoverageRate, 50) ? "immediate" : "soon",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
    });
  }

  if (below(gillickAssessmentRate, 60) && total_children > 0) {
    recommendations.push({
      rank: ++recRank,
      recommendation:
        below(gillickAssessmentRate, 40)
          ? "Implement a Gillick competence assessment programme for all children under 16, ensuring their evolving capacity to make healthcare and other decisions is formally assessed, documented, and regularly reviewed."
          : "Expand Gillick competence assessments to all eligible children — regular assessment ensures that children's growing autonomy is recognised and respected in care decisions.",
      urgency: below(gillickAssessmentRate, 40) ? "immediate" : "soon",
      regulatory_ref: "CHR 2015 Reg 7 — Children's views",
    });
  }

  if (below(childUnderstandingRate, 70) && totalUnderstandingOpportunities > 0) {
    recommendations.push({
      rank: ++recRank,
      recommendation:
        below(childUnderstandingRate, 40)
          ? "Introduce mandatory checks on children's understanding before consent is accepted — staff should be trained to verify comprehension using age-appropriate methods and document that the child genuinely understands what they are agreeing to."
          : "Strengthen child understanding verification — ensure that in all consent and competence situations, children's comprehension is actively confirmed rather than assumed.",
      urgency: below(childUnderstandingRate, 40) ? "immediate" : "soon",
      regulatory_ref: "SCCIF — Voice of the child",
    });
  }

  if (below(capacityReviewRate, 60) && total_children > 0) {
    recommendations.push({
      rank: ++recRank,
      recommendation:
        "Establish a systematic capacity review schedule for all children, ensuring decision-specific capacity assessments are conducted before significant decisions affecting children's care, placement, health, or education.",
      urgency: below(capacityReviewRate, 40) ? "immediate" : "soon",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
    });
  }

  if (below(informedConsentRate, 60) && total_children > 0) {
    recommendations.push({
      rank: ++recRank,
      recommendation:
        "Strengthen informed consent processes — ensure all children receive age-appropriate information about risks, benefits, and alternatives before consent is sought, and that their understanding is confirmed and documented.",
      urgency: below(informedConsentRate, 40) ? "immediate" : "soon",
      regulatory_ref: "CHR 2015 Reg 14 — Health care",
    });
  }

  if ((withdrawalHandlingRate ?? 0) < 70 && totalWithdrawals > 0) {
    recommendations.push({
      rank: ++recRank,
      recommendation:
        (withdrawalHandlingRate ?? 0) < 50
          ? "Overhaul consent withdrawal procedures — when consent is withdrawn, the home must ensure the withdrawal is respected immediately, the reason is recorded, the child's views are sought, relevant parties are notified, and documentation is updated promptly."
          : "Improve consent withdrawal handling to ensure all withdrawal steps are consistently completed — particularly notification of relevant parties and impact assessment.",
      urgency: (withdrawalHandlingRate ?? 0) < 50 ? "immediate" : "soon",
      regulatory_ref: "CHR 2015 Reg 7 — Children's views",
    });
  }

  if ((consentReviewComplianceRate ?? 0) < 80 && totalConsentForms > 0) {
    recommendations.push({
      rank: ++recRank,
      recommendation:
        "Establish a rolling consent review schedule to ensure all consent forms are reviewed within their scheduled timescales — expired or overdue consents should be prioritised to maintain the validity of the home's consent framework.",
      urgency: (consentReviewComplianceRate ?? 0) < 60 ? "immediate" : "planned",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
    });
  }

  if (below(gillickEvidenceRate, 70) && totalGillickAssessments > 0) {
    recommendations.push({
      rank: ++recRank,
      recommendation:
        "Improve documentation of Gillick competence assessment evidence — assessors should record detailed rationale for competence decisions, including the factors considered, the child's responses, and the basis for the conclusion reached.",
      urgency: below(gillickEvidenceRate, 50) ? "immediate" : "planned",
      regulatory_ref: "CHR 2015 Reg 7 — Children's views",
    });
  }

  if (below(accessibleFormatRate, 60) && totalConsentForms > 0) {
    recommendations.push({
      rank: ++recRank,
      recommendation:
        "Develop accessible consent materials for all children — consent forms and information should be available in formats appropriate to each child's age, understanding, communication needs, and any disabilities.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Voice of the child",
    });
  }

  if (below(advocacyOfferedRate, 60) && totalCapacityReviews > 0) {
    recommendations.push({
      rank: ++recRank,
      recommendation:
        "Ensure advocacy is routinely offered during capacity reviews — children should know they can access independent support to help them participate in and understand decisions being made about their care.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 7 — Children's views",
    });
  }

  if (below(risksExplainedRate, 70) && totalInformedConsents > 0) {
    recommendations.push({
      rank: ++recRank,
      recommendation:
        "Ensure risks and benefits are consistently explained during informed consent processes — children and their representatives should receive balanced information that enables them to weigh up their options before making a decision.",
      urgency: below(risksExplainedRate, 50) ? "soon" : "planned",
      regulatory_ref: "CHR 2015 Reg 14 — Health care",
    });
  }

  if (overdueGillickReviews > 2) {
    recommendations.push({
      rank: ++recRank,
      recommendation:
        `Address the ${overdueGillickReviews} overdue Gillick competence reviews — children's competence develops over time and assessments must be kept current to ensure their evolving autonomy is recognised.`,
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 7 — Children's views",
    });
  }

  if (overdueCapacityReviews > 2) {
    recommendations.push({
      rank: ++recRank,
      recommendation:
        `Clear the ${overdueCapacityReviews} overdue capacity reviews — capacity fluctuates and must be reassessed to ensure decisions are made in line with children's current abilities and needs.`,
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
    });
  }

  // ── Insights ──────────────────────────────────────────────────────────

  const insights: ConsentCapacityInsight[] = [];

  // Critical insights
  if (below(consentCoverageRate, 50) && total_children > 0) {
    insights.push({
      text: `With consent form coverage at only ${consentCoverageRate}%, the majority of children's care activities may be proceeding without properly documented consent. This creates significant regulatory risk under Reg 5 and Reg 14, and fundamentally undermines the home's ability to evidence that care is delivered with proper authorisation. Immediate action is required to audit and complete all children's consent records.`,
      severity: "critical",
    });
  }

  if (below(childUnderstandingRate, 40) && totalUnderstandingOpportunities > 0) {
    insights.push({
      text: `Child understanding is verified in only ${childUnderstandingRate}% of consent and competence situations. Consent obtained without confirming the child's understanding cannot be considered genuinely informed. The SCCIF emphasises that children's views should be central to their care, and this requires that they truly understand the decisions being made. The home should implement structured comprehension checks as part of all consent processes.`,
      severity: "critical",
    });
  }

  if (below(gillickAssessmentRate, 40) && total_children > 0 && totalGillickAssessments > 0) {
    insights.push({
      text: `Gillick competence assessment coverage stands at ${gillickAssessmentRate}%, meaning most children's capacity to make their own decisions has not been formally assessed. Without these assessments, the home cannot demonstrate that it recognises and respects children's evolving autonomy — a core expectation under Reg 7 and the SCCIF's focus on children's participation.`,
      severity: "critical",
    });
  }

  if ((withdrawalHandlingRate ?? 0) < 50 && totalWithdrawals > 0) {
    insights.push({
      text: `Consent withdrawal handling falls below acceptable standards at ${withdrawalHandlingRate}%. When a child or their representative withdraws consent, the failure to process this properly and promptly could mean that care activities continue without valid consent — a serious safeguarding concern and potential regulatory breach.`,
      severity: "critical",
    });
  }

  // Warning insights
  if (meets(consentCoverageRate, 50) && below(consentCoverageRate, 80) && total_children > 0) {
    insights.push({
      text: `Consent coverage at ${consentCoverageRate}% shows the home has established consent processes, but gaps remain. Until every child has comprehensive consent forms in place, some care activities may lack proper authorisation. Prioritise completing consent documentation for the remaining children.`,
      severity: "warning",
    });
  }

  if (below(gillickEvidenceRate, 70) && meets(gillickEvidenceRate, 50) && totalGillickAssessments > 0) {
    insights.push({
      text: `Gillick evidence documentation at ${gillickEvidenceRate}% means some competence assessments lack the audit trail needed to justify decisions. If a competence determination is challenged — for example, by a parent or social worker — inadequate evidence could undermine the assessment. Strengthening documentation protects both the child and the home.`,
      severity: "warning",
    });
  }

  if (expiredConsents > 0) {
    insights.push({
      text: `${expiredConsents} consent form${expiredConsents > 1 ? "s have" : " has"} expired without review. Expired consent is effectively no consent — care activities continuing under expired authority require urgent attention to either renew consent or cease the activity until fresh consent is obtained.`,
      severity: "warning",
    });
  }

  if (overdueConsentReviews > 3 && totalConsentForms > 0) {
    insights.push({
      text: `${overdueConsentReviews} consent reviews are overdue. Children's circumstances, wishes, and capacity change over time, and consent must be reviewed regularly to remain valid. A backlog of overdue reviews suggests the consent management system needs dedicated administrative resource.`,
      severity: "warning",
    });
  }

  if (below(infoAgeAppropriateRate, 70) && meets(infoAgeAppropriateRate, 40) && totalInformedConsents > 0) {
    insights.push({
      text: `Age-appropriate information is provided in ${infoAgeAppropriateRate}% of informed consent cases. Children who do not receive information they can understand cannot give genuinely informed consent. The home should develop a range of age-appropriate and developmentally-appropriate information resources for different consent scenarios.`,
      severity: "warning",
    });
  }

  if (below(advocacyOfferedRate, 50) && totalCapacityReviews > 0) {
    insights.push({
      text: `Advocacy is offered in only ${advocacyOfferedRate}% of capacity reviews. Children going through capacity assessment processes should routinely be offered advocacy to ensure they understand the process and can participate meaningfully. Low advocacy rates may indicate that children's voices are not being sufficiently prioritised.`,
      severity: "warning",
    });
  }

  // Positive insights
  if (meets(consentCoverageRate, 95) && meets(gillickAssessmentRate, 80) && total_children > 0) {
    insights.push({
      text: `The combination of ${consentCoverageRate}% consent coverage and ${gillickAssessmentRate}% Gillick assessment coverage represents an exemplary approach to consent and capacity management. The home demonstrates that it takes children's consent rights seriously and actively assesses their evolving capacity — exactly the practice Ofsted looks for under Reg 7 and the SCCIF voice of the child standard.`,
      severity: "positive",
    });
  }

  if (meets(childUnderstandingRate, 90) && totalUnderstandingOpportunities > 0) {
    insights.push({
      text: `Child understanding is verified in ${childUnderstandingRate}% of consent and competence situations — this demonstrates genuinely child-centred practice where consent goes beyond paperwork to ensure children truly understand and are empowered to make informed choices about their own care.`,
      severity: "positive",
    });
  }

  if ((withdrawalHandlingRate ?? 0) >= 90 && totalWithdrawals > 0) {
    insights.push({
      text: `The home handles consent withdrawals at ${withdrawalHandlingRate}% compliance — demonstrating that children's right to change their minds is genuinely respected and properly actioned. This builds trust and reinforces that consent is an ongoing, dynamic process rather than a one-off event.`,
      severity: "positive",
    });
  }

  if (meets(bestInterestsRate, 95) && meets(reasonableAdjustmentsRate, 80) && totalCapacityReviews > 0) {
    insights.push({
      text: `Best interests considerations at ${bestInterestsRate}% and reasonable adjustments at ${reasonableAdjustmentsRate}% in capacity reviews show the home takes a thorough, rights-based approach to capacity assessment — ensuring that where children lack capacity, their interests are protected and every effort is made to support their participation.`,
      severity: "positive",
    });
  }

  if ((consentReviewComplianceRate ?? 0) >= 95 && totalConsentForms > 0) {
    insights.push({
      text: `Consent review compliance at ${consentReviewComplianceRate}% demonstrates the home treats consent as a living process — regularly reviewing and updating consent to ensure it remains current, valid, and reflective of children's evolving wishes and circumstances.`,
      severity: "positive",
    });
  }

  if (meets(interpreterProvisionRate, 100) && interpreterNeeded > 0) {
    insights.push({
      text: "Interpreter provision stands at 100% where needed — the home ensures that language barriers never prevent children from giving or withholding genuine informed consent, demonstrating a commitment to equitable access to consent processes.",
      severity: "positive",
    });
  }

  if (meets(accessibleFormatRate, 90) && totalConsentForms > 0) {
    insights.push({
      text: `${accessibleFormatRate}% of consent forms use accessible formats — the home demonstrates inclusive practice by ensuring consent materials are adapted to each child's communication needs, enabling meaningful participation in consent decisions.`,
      severity: "positive",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────────

  let headline: string;
  if (consent_rating === "outstanding") {
    headline =
      "Consent and capacity management is outstanding — the home demonstrates exemplary practice in obtaining, documenting, and reviewing consent, with strong Gillick assessments and genuine child participation in decision-making.";
  } else if (consent_rating === "good") {
    headline =
      "Consent and capacity management is good — consent processes are well-established with room for targeted improvement in coverage or documentation quality.";
  } else if (consent_rating === "adequate") {
    headline =
      "Consent and capacity management is adequate — basic consent processes are in place but significant gaps exist in coverage, quality, or child participation that require attention.";
  } else {
    headline =
      "Consent and capacity management is inadequate — fundamental gaps in consent coverage, capacity assessment, or child participation require urgent remedial action to meet regulatory standards.";
  }

  // ── Return ────────────────────────────────────────────────────────────

  return {
    consent_rating,
    consent_score: score,
    headline,
    total_consent_forms: totalConsentForms,
    consent_coverage_rate: consentCoverageRate,
    gillick_assessment_rate: gillickAssessmentRate,
    capacity_review_rate: capacityReviewRate,
    informed_consent_rate: informedConsentRate,
    withdrawal_handling_rate: withdrawalHandlingRate,
    child_understanding_rate: childUnderstandingRate,
    consent_review_compliance_rate: consentReviewComplianceRate,
    gillick_evidence_rate: gillickEvidenceRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
