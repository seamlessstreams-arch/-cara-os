// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME STATEMENT OF PURPOSE & CHILDREN'S GUIDE INTELLIGENCE ENGINE
// Monitors Statement of Purpose currency, Children's Guide accessibility,
// review cycle compliance, young person involvement in updates, Ofsted
// submission timeliness, and stakeholder awareness.
// Pure deterministic engine — no imports, no LLM, no external deps.
// CHR 2015 Reg 16 (Statement of Purpose), Reg 17 (Children's Guide).
// SCCIF: Leadership and management.
// Store keys: statementRecords, guideRecords, reviewCycleRecords,
//             involvementRecords, submissionRecords
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface StatementRecordInput {
  id: string;
  title: string;
  version: string;
  status: "current" | "draft" | "archived" | "expired" | "under_review";
  effective_date: string;
  expiry_date: string;
  last_reviewed_date: string;
  next_review_date: string;
  approved_by: string;
  approval_date: string;
  sections_complete: number;
  sections_total: number;
  covers_ethos: boolean;
  covers_range_of_needs: boolean;
  covers_accommodation: boolean;
  covers_staffing: boolean;
  covers_fire_safety: boolean;
  covers_behaviour_management: boolean;
  covers_education: boolean;
  covers_health: boolean;
  covers_contact: boolean;
  covers_complaints: boolean;
  covers_religious_cultural: boolean;
  covers_emergency_placement: boolean;
  covers_registered_manager: boolean;
  covers_responsible_individual: boolean;
  ofsted_notified: boolean;
  notification_date: string | null;
  distributed_to_stakeholders: boolean;
  distribution_date: string | null;
  distribution_method: "email" | "print" | "portal" | "hand_delivered" | "other" | null;
  notes: string;
  created_at: string;
}

export interface GuideRecordInput {
  id: string;
  title: string;
  version: string;
  status: "current" | "draft" | "archived" | "expired" | "under_review";
  effective_date: string;
  last_reviewed_date: string;
  next_review_date: string;
  age_appropriate: boolean;
  accessible_format: boolean;
  easy_read_version: boolean;
  translated: boolean;
  translation_languages: string[];
  covers_daily_routine: boolean;
  covers_house_rules: boolean;
  covers_complaints_process: boolean;
  covers_key_contacts: boolean;
  covers_rights: boolean;
  covers_advocacy: boolean;
  covers_leaving_care: boolean;
  covers_education: boolean;
  given_on_admission: boolean;
  child_feedback_collected: boolean;
  child_feedback_positive: boolean;
  sections_complete: number;
  sections_total: number;
  approved_by: string;
  notes: string;
  created_at: string;
}

export interface ReviewCycleRecordInput {
  id: string;
  document_type: "statement_of_purpose" | "children_guide";
  document_id: string;
  review_date: string;
  reviewer_name: string;
  reviewer_role: string;
  outcome: "approved" | "amendments_required" | "major_revision" | "rejected";
  sections_reviewed: number;
  sections_total: number;
  changes_identified: number;
  changes_implemented: number;
  completed_on_time: boolean;
  days_overdue: number;
  next_review_date: string;
  young_people_consulted: boolean;
  staff_consulted: boolean;
  placing_authority_consulted: boolean;
  notes: string;
  created_at: string;
}

export interface InvolvementRecordInput {
  id: string;
  child_id: string;
  child_name: string;
  document_type: "statement_of_purpose" | "children_guide";
  involvement_type: "consultation" | "feedback" | "co_production" | "review_participation" | "presentation" | "other";
  date: string;
  views_sought: boolean;
  views_recorded: boolean;
  views_actioned: boolean;
  feedback_positive: boolean;
  changes_made_from_feedback: boolean;
  change_description: string;
  supported_to_participate: boolean;
  accessible_format_used: boolean;
  duration_minutes: number;
  facilitator: string;
  notes: string;
  created_at: string;
}

export interface SubmissionRecordInput {
  id: string;
  document_type: "statement_of_purpose" | "children_guide";
  document_id: string;
  submission_date: string;
  submission_type: "initial" | "annual_update" | "amendment" | "variation" | "resubmission";
  submitted_to: "ofsted" | "placing_authority" | "ri" | "other";
  submitted_by: string;
  deadline_date: string;
  submitted_on_time: boolean;
  days_before_deadline: number;
  acknowledged: boolean;
  acknowledgement_date: string | null;
  feedback_received: boolean;
  feedback_positive: boolean;
  amendments_required: boolean;
  amendments_completed: boolean;
  amendments_completion_date: string | null;
  notes: string;
  created_at: string;
}

export interface StatementPurposeChildrenGuideInput {
  today: string;
  total_children: number;
  statement_records: StatementRecordInput[];
  guide_records: GuideRecordInput[];
  review_cycle_records: ReviewCycleRecordInput[];
  involvement_records: InvolvementRecordInput[];
  submission_records: SubmissionRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type StatementPurposeRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface StatementPurposeInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface StatementPurposeRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface StatementPurposeChildrenGuideResult {
  statement_rating: StatementPurposeRating;
  statement_score: number;
  headline: string;
  total_statement_records: number;
  total_guide_records: number;
  total_review_cycle_records: number;
  total_involvement_records: number;
  total_submission_records: number;
  statement_currency_rate: number;
  guide_accessibility_rate: number;
  review_cycle_rate: number;
  young_person_involvement_rate: number;
  ofsted_submission_rate: number;
  stakeholder_awareness_rate: number;
  strengths: string[];
  concerns: string[];
  recommendations: StatementPurposeRecommendation[];
  insights: StatementPurposeInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): StatementPurposeRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

function daysBetween(a: string, b: string): number {
  const msA = Date.parse(a);
  const msB = Date.parse(b);
  if (isNaN(msA) || isNaN(msB)) return 0;
  return Math.round((msB - msA) / 86_400_000);
}

// ── Empty Result Factory ────────────────────────────────────────────────────

function emptyResult(
  rating: StatementPurposeRating,
  score: number,
  headline: string,
): StatementPurposeChildrenGuideResult {
  return {
    statement_rating: rating,
    statement_score: score,
    headline,
    total_statement_records: 0,
    total_guide_records: 0,
    total_review_cycle_records: 0,
    total_involvement_records: 0,
    total_submission_records: 0,
    statement_currency_rate: 0,
    guide_accessibility_rate: 0,
    review_cycle_rate: 0,
    young_person_involvement_rate: 0,
    ofsted_submission_rate: 0,
    stakeholder_awareness_rate: 0,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeStatementPurposeChildrenGuide(
  input: StatementPurposeChildrenGuideInput,
): StatementPurposeChildrenGuideResult {
  const {
    today,
    total_children,
    statement_records,
    guide_records,
    review_cycle_records,
    involvement_records,
    submission_records,
  } = input;

  // ── Special case: all empty + 0 children → insufficient_data ──────────
  const allEmpty =
    statement_records.length === 0 &&
    guide_records.length === 0 &&
    review_cycle_records.length === 0 &&
    involvement_records.length === 0 &&
    submission_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement — insufficient data to assess Statement of Purpose and Children's Guide compliance.",
    );
  }

  // ── Special case: all empty + children > 0 → inadequate ───────────────
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No Statement of Purpose or Children's Guide data recorded despite children on placement — regulatory compliance requires urgent attention.",
      ),
      concerns: [
        "No Statement of Purpose, Children's Guide, review cycle, young person involvement, or Ofsted submission records exist despite children being on placement — the home cannot evidence compliance with CHR 2015 Reg 16 and Reg 17.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Urgently create and approve a Statement of Purpose that covers all Schedule 1 requirements under CHR 2015 Reg 16, and ensure it is submitted to Ofsted and distributed to all relevant stakeholders.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 16 — Statement of Purpose",
        },
        {
          rank: 2,
          recommendation:
            "Develop an accessible, age-appropriate Children's Guide that covers daily routine, house rules, complaints process, key contacts, rights, and advocacy, and ensure every child receives a copy on admission per CHR 2015 Reg 17.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 17 — Children's Guide",
        },
      ],
      insights: [
        {
          text: "The complete absence of Statement of Purpose and Children's Guide records means the home cannot demonstrate compliance with CHR 2015 Reg 16 and Reg 17. This is a fundamental regulatory failing that would be identified in any Ofsted inspection as a significant shortfall in leadership and management.",
          severity: "critical",
        },
      ],
    };
  }

  // ── Compute core metrics ──────────────────────────────────────────────

  // --- Statement of Purpose currency metrics ---
  const totalStatementRecords = statement_records.length;
  const currentStatements = statement_records.filter(
    (s) => s.status === "current",
  );
  const currentStatementCount = currentStatements.length;

  // Check currency: a statement is "currency-valid" if its expiry date is in the future
  // and it was reviewed within the last 12 months
  const currencyValidStatements = currentStatements.filter((s) => {
    const expiryDays = daysBetween(today, s.expiry_date);
    const daysSinceReview = daysBetween(s.last_reviewed_date, today);
    return expiryDays > 0 && daysSinceReview <= 365;
  });
  const statementCurrencyRate = pct(currencyValidStatements.length, Math.max(currentStatementCount, 1));

  // Section completeness
  const totalSectionsComplete = statement_records.reduce(
    (sum, s) => sum + s.sections_complete,
    0,
  );
  const totalSectionsTotal = statement_records.reduce(
    (sum, s) => sum + s.sections_total,
    0,
  );
  const sectionCompletenessRate = pct(totalSectionsComplete, totalSectionsTotal);

  // Schedule 1 coverage — 14 mandatory areas
  const schedule1Fields = [
    "covers_ethos",
    "covers_range_of_needs",
    "covers_accommodation",
    "covers_staffing",
    "covers_fire_safety",
    "covers_behaviour_management",
    "covers_education",
    "covers_health",
    "covers_contact",
    "covers_complaints",
    "covers_religious_cultural",
    "covers_emergency_placement",
    "covers_registered_manager",
    "covers_responsible_individual",
  ] as const;

  let schedule1CoveredTotal = 0;
  let schedule1CheckedTotal = 0;
  for (const s of currentStatements) {
    for (const field of schedule1Fields) {
      schedule1CheckedTotal++;
      if (s[field]) schedule1CoveredTotal++;
    }
  }
  const schedule1CoverageRate = pct(schedule1CoveredTotal, schedule1CheckedTotal);

  // Distribution to stakeholders
  const distributedStatements = statement_records.filter(
    (s) => s.distributed_to_stakeholders,
  );
  const distributionRate = pct(distributedStatements.length, totalStatementRecords);

  // Ofsted notification rate for statements
  const notifiedStatements = statement_records.filter(
    (s) => s.ofsted_notified,
  );
  const statementNotificationRate = pct(notifiedStatements.length, totalStatementRecords);

  // Expired statements
  const expiredStatements = statement_records.filter((s) => {
    const expiryDays = daysBetween(today, s.expiry_date);
    return expiryDays <= 0 && s.status !== "archived";
  });
  const hasExpiredStatements = expiredStatements.length > 0;

  // --- Children's Guide accessibility metrics ---
  const totalGuideRecords = guide_records.length;
  const currentGuides = guide_records.filter((g) => g.status === "current");
  const currentGuideCount = currentGuides.length;

  const ageAppropriateGuides = guide_records.filter((g) => g.age_appropriate);
  const ageAppropriateRate = pct(ageAppropriateGuides.length, totalGuideRecords);

  const accessibleFormatGuides = guide_records.filter((g) => g.accessible_format);
  const accessibleFormatRate = pct(accessibleFormatGuides.length, totalGuideRecords);

  const easyReadGuides = guide_records.filter((g) => g.easy_read_version);
  const easyReadRate = pct(easyReadGuides.length, totalGuideRecords);

  const translatedGuides = guide_records.filter((g) => g.translated);
  const translatedRate = pct(translatedGuides.length, totalGuideRecords);

  // Guide section coverage
  const guideCoverageFields = [
    "covers_daily_routine",
    "covers_house_rules",
    "covers_complaints_process",
    "covers_key_contacts",
    "covers_rights",
    "covers_advocacy",
    "covers_leaving_care",
    "covers_education",
  ] as const;

  let guideCoverageTotal = 0;
  let guideCheckedTotal = 0;
  for (const g of currentGuides) {
    for (const field of guideCoverageFields) {
      guideCheckedTotal++;
      if (g[field]) guideCoverageTotal++;
    }
  }
  const guideSectionCoverageRate = pct(guideCoverageTotal, guideCheckedTotal);

  // Given on admission
  const givenOnAdmission = guide_records.filter((g) => g.given_on_admission);
  const admissionDistributionRate = pct(givenOnAdmission.length, totalGuideRecords);

  // Child feedback on guides
  const feedbackCollected = guide_records.filter((g) => g.child_feedback_collected);
  const feedbackCollectedRate = pct(feedbackCollected.length, totalGuideRecords);

  const feedbackPositive = guide_records.filter(
    (g) => g.child_feedback_collected && g.child_feedback_positive,
  );
  const feedbackPositiveRate = pct(feedbackPositive.length, feedbackCollected.length);

  // Guide section completeness
  const guideSectionsComplete = guide_records.reduce(
    (sum, g) => sum + g.sections_complete,
    0,
  );
  const guideSectionsTotal = guide_records.reduce(
    (sum, g) => sum + g.sections_total,
    0,
  );
  const guideSectionCompletenessRate = pct(guideSectionsComplete, guideSectionsTotal);

  // Composite guide accessibility rate
  // Average of age-appropriate, accessible format, easy-read, section coverage, admission distribution
  const guideAccessibilityComponents: number[] = [];
  if (totalGuideRecords > 0) {
    guideAccessibilityComponents.push(ageAppropriateRate);
    guideAccessibilityComponents.push(accessibleFormatRate);
    guideAccessibilityComponents.push(guideSectionCoverageRate);
    guideAccessibilityComponents.push(admissionDistributionRate);
    guideAccessibilityComponents.push(guideSectionCompletenessRate);
  }
  const guideAccessibilityRate =
    guideAccessibilityComponents.length > 0
      ? Math.round(
          guideAccessibilityComponents.reduce((a, b) => a + b, 0) /
            guideAccessibilityComponents.length,
        )
      : 0;

  // --- Review cycle compliance metrics ---
  const totalReviewCycleRecords = review_cycle_records.length;
  const completedOnTime = review_cycle_records.filter(
    (r) => r.completed_on_time,
  );
  const reviewOnTimeRate = pct(completedOnTime.length, totalReviewCycleRecords);

  const approvedReviews = review_cycle_records.filter(
    (r) => r.outcome === "approved",
  );
  const reviewApprovalRate = pct(approvedReviews.length, totalReviewCycleRecords);

  const reviewsWithAmendments = review_cycle_records.filter(
    (r) => r.outcome === "amendments_required" || r.outcome === "major_revision",
  );
  const amendmentRate = pct(reviewsWithAmendments.length, totalReviewCycleRecords);

  const reviewChangesIdentified = review_cycle_records.reduce(
    (sum, r) => sum + r.changes_identified,
    0,
  );
  const reviewChangesImplemented = review_cycle_records.reduce(
    (sum, r) => sum + r.changes_implemented,
    0,
  );
  const changeImplementationRate = pct(reviewChangesImplemented, reviewChangesIdentified);

  const reviewSectionsReviewed = review_cycle_records.reduce(
    (sum, r) => sum + r.sections_reviewed,
    0,
  );
  const reviewSectionsTotal = review_cycle_records.reduce(
    (sum, r) => sum + r.sections_total,
    0,
  );
  const reviewCoverageRate = pct(reviewSectionsReviewed, reviewSectionsTotal);

  // Young people consulted during reviews
  const ypConsultedReviews = review_cycle_records.filter(
    (r) => r.young_people_consulted,
  );
  const ypConsultedRate = pct(ypConsultedReviews.length, totalReviewCycleRecords);

  // Staff consulted during reviews
  const staffConsultedReviews = review_cycle_records.filter(
    (r) => r.staff_consulted,
  );
  const staffConsultedRate = pct(staffConsultedReviews.length, totalReviewCycleRecords);

  // Placing authority consulted
  const placingAuthConsulted = review_cycle_records.filter(
    (r) => r.placing_authority_consulted,
  );
  const placingAuthConsultedRate = pct(placingAuthConsulted.length, totalReviewCycleRecords);

  // Overdue days
  const overdueReviews = review_cycle_records.filter(
    (r) => !r.completed_on_time && r.days_overdue > 0,
  );
  const totalOverdueDays = overdueReviews.reduce(
    (sum, r) => sum + r.days_overdue,
    0,
  );
  const avgOverdueDays =
    overdueReviews.length > 0
      ? Math.round(totalOverdueDays / overdueReviews.length)
      : 0;

  // Composite review cycle rate
  const reviewCycleComponents: number[] = [];
  if (totalReviewCycleRecords > 0) {
    reviewCycleComponents.push(reviewOnTimeRate);
    reviewCycleComponents.push(reviewCoverageRate);
    reviewCycleComponents.push(changeImplementationRate);
  }
  const reviewCycleRate =
    reviewCycleComponents.length > 0
      ? Math.round(
          reviewCycleComponents.reduce((a, b) => a + b, 0) /
            reviewCycleComponents.length,
        )
      : 0;

  // --- Young person involvement metrics ---
  const totalInvolvementRecords = involvement_records.length;

  const viewsSought = involvement_records.filter((i) => i.views_sought);
  const viewsSoughtRate = pct(viewsSought.length, totalInvolvementRecords);

  const viewsRecorded = involvement_records.filter((i) => i.views_recorded);
  const viewsRecordedRate = pct(viewsRecorded.length, totalInvolvementRecords);

  const viewsActioned = involvement_records.filter((i) => i.views_actioned);
  const viewsActionedRate = pct(viewsActioned.length, totalInvolvementRecords);

  const changesMadeFromFeedback = involvement_records.filter(
    (i) => i.changes_made_from_feedback,
  );
  const changesMadeRate = pct(changesMadeFromFeedback.length, totalInvolvementRecords);

  const supportedToParticipate = involvement_records.filter(
    (i) => i.supported_to_participate,
  );
  const supportedRate = pct(supportedToParticipate.length, totalInvolvementRecords);

  const accessibleFormatUsed = involvement_records.filter(
    (i) => i.accessible_format_used,
  );
  const accessibleInvolvementRate = pct(accessibleFormatUsed.length, totalInvolvementRecords);

  const positiveFeedback = involvement_records.filter(
    (i) => i.feedback_positive,
  );
  const positiveFeedbackInvolvementRate = pct(positiveFeedback.length, totalInvolvementRecords);

  // Unique children involved
  const uniqueChildrenInvolved = new Set(
    involvement_records.map((i) => i.child_id),
  ).size;
  const childInvolvementCoverage =
    total_children > 0 ? pct(uniqueChildrenInvolved, total_children) : 0;

  // Co-production count
  const coProductionRecords = involvement_records.filter(
    (i) => i.involvement_type === "co_production",
  );
  const coProductionRate = pct(coProductionRecords.length, totalInvolvementRecords);

  // Composite young person involvement rate
  const involvementComponents: number[] = [];
  if (totalInvolvementRecords > 0) {
    involvementComponents.push(viewsSoughtRate);
    involvementComponents.push(viewsRecordedRate);
    involvementComponents.push(viewsActionedRate);
    involvementComponents.push(supportedRate);
  }
  const youngPersonInvolvementRate =
    involvementComponents.length > 0
      ? Math.round(
          involvementComponents.reduce((a, b) => a + b, 0) /
            involvementComponents.length,
        )
      : 0;

  // --- Ofsted submission timeliness metrics ---
  const totalSubmissionRecords = submission_records.length;

  const ofstedSubmissions = submission_records.filter(
    (s) => s.submitted_to === "ofsted",
  );
  const totalOfstedSubmissions = ofstedSubmissions.length;

  const timelySubmissions = submission_records.filter(
    (s) => s.submitted_on_time,
  );
  const timelySubmissionRate = pct(timelySubmissions.length, totalSubmissionRecords);

  const ofstedTimelySubmissions = ofstedSubmissions.filter(
    (s) => s.submitted_on_time,
  );
  const ofstedTimelyRate = pct(ofstedTimelySubmissions.length, totalOfstedSubmissions);

  const acknowledgedSubmissions = submission_records.filter(
    (s) => s.acknowledged,
  );
  const acknowledgedRate = pct(acknowledgedSubmissions.length, totalSubmissionRecords);

  const feedbackReceivedSubmissions = submission_records.filter(
    (s) => s.feedback_received,
  );
  const submissionFeedbackRate = pct(feedbackReceivedSubmissions.length, totalSubmissionRecords);

  const positiveFeedbackSubmissions = submission_records.filter(
    (s) => s.feedback_received && s.feedback_positive,
  );
  const submissionPositiveFeedbackRate = pct(
    positiveFeedbackSubmissions.length,
    feedbackReceivedSubmissions.length,
  );

  const amendmentsRequiredSubmissions = submission_records.filter(
    (s) => s.amendments_required,
  );
  const submissionAmendmentRate = pct(
    amendmentsRequiredSubmissions.length,
    totalSubmissionRecords,
  );

  const amendmentsCompletedSubmissions = submission_records.filter(
    (s) => s.amendments_required && s.amendments_completed,
  );
  const submissionAmendmentCompletionRate = pct(
    amendmentsCompletedSubmissions.length,
    amendmentsRequiredSubmissions.length,
  );

  // Composite Ofsted submission rate
  const submissionComponents: number[] = [];
  if (totalSubmissionRecords > 0) {
    submissionComponents.push(timelySubmissionRate);
    if (totalOfstedSubmissions > 0) {
      submissionComponents.push(ofstedTimelyRate);
    }
    if (amendmentsRequiredSubmissions.length > 0) {
      submissionComponents.push(submissionAmendmentCompletionRate);
    }
  }
  const ofstedSubmissionRate =
    submissionComponents.length > 0
      ? Math.round(
          submissionComponents.reduce((a, b) => a + b, 0) /
            submissionComponents.length,
        )
      : 0;

  // --- Stakeholder awareness composite ---
  // Combines distribution, notification, admission distribution, stakeholder consultation
  const awarenessComponents: number[] = [];
  if (totalStatementRecords > 0) {
    awarenessComponents.push(distributionRate);
    awarenessComponents.push(statementNotificationRate);
  }
  if (totalGuideRecords > 0) {
    awarenessComponents.push(admissionDistributionRate);
    awarenessComponents.push(feedbackCollectedRate);
  }
  if (totalReviewCycleRecords > 0) {
    awarenessComponents.push(staffConsultedRate);
    awarenessComponents.push(placingAuthConsultedRate);
  }
  const stakeholderAwarenessRate =
    awarenessComponents.length > 0
      ? Math.round(
          awarenessComponents.reduce((a, b) => a + b, 0) /
            awarenessComponents.length,
        )
      : 0;

  // ── Scoring: base 52 ─────────────────────────────────────────────────

  let score = 52;

  // --- Bonus 1: statementCurrencyRate (>=95: +5, >=80: +3) ---
  if (statementCurrencyRate >= 95) score += 5;
  else if (statementCurrencyRate >= 80) score += 3;

  // --- Bonus 2: guideAccessibilityRate (>=90: +5, >=70: +3) ---
  if (guideAccessibilityRate >= 90) score += 5;
  else if (guideAccessibilityRate >= 70) score += 3;

  // --- Bonus 3: reviewCycleRate (>=90: +4, >=70: +2) ---
  if (reviewCycleRate >= 90) score += 4;
  else if (reviewCycleRate >= 70) score += 2;

  // --- Bonus 4: youngPersonInvolvementRate (>=90: +4, >=70: +2) ---
  if (youngPersonInvolvementRate >= 90) score += 4;
  else if (youngPersonInvolvementRate >= 70) score += 2;

  // --- Bonus 5: ofstedSubmissionRate (>=95: +4, >=80: +2) ---
  if (ofstedSubmissionRate >= 95) score += 4;
  else if (ofstedSubmissionRate >= 80) score += 2;

  // --- Bonus 6: stakeholderAwarenessRate (>=90: +3, >=70: +1) ---
  if (stakeholderAwarenessRate >= 90) score += 3;
  else if (stakeholderAwarenessRate >= 70) score += 1;

  // --- Bonus 7: schedule1CoverageRate (>=100: +3, >=85: +1) ---
  if (schedule1CoverageRate >= 100) score += 3;
  else if (schedule1CoverageRate >= 85) score += 1;

  // ── Penalties ─────────────────────────────────────────────────────────

  // statementCurrencyRate < 50 → -5 (guarded)
  if (statementCurrencyRate < 50 && totalStatementRecords > 0) score -= 5;

  // guideAccessibilityRate < 40 → -5 (guarded)
  if (guideAccessibilityRate < 40 && totalGuideRecords > 0) score -= 5;

  // reviewOnTimeRate < 50 → -4 (guarded)
  if (reviewOnTimeRate < 50 && totalReviewCycleRecords > 0) score -= 4;

  // youngPersonInvolvementRate < 30 → -4 (guarded)
  if (youngPersonInvolvementRate < 30 && totalInvolvementRecords > 0) score -= 4;

  score = clamp(score, 0, 100);

  const statement_rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────

  const strengths: string[] = [];

  if (statementCurrencyRate >= 95 && totalStatementRecords > 0) {
    strengths.push(`${statementCurrencyRate}% Statement of Purpose currency — the home maintains a current, reviewed, and in-date Statement of Purpose demonstrating strong regulatory compliance.`);
  } else if (statementCurrencyRate >= 80 && totalStatementRecords > 0) {
    strengths.push(`${statementCurrencyRate}% Statement of Purpose currency — the home generally maintains its Statement of Purpose within review and expiry dates.`);
  }

  if (guideAccessibilityRate >= 90 && totalGuideRecords > 0) {
    strengths.push(`${guideAccessibilityRate}% Children's Guide accessibility — guides are age-appropriate, accessible, comprehensive, and distributed to children on admission.`);
  } else if (guideAccessibilityRate >= 70 && totalGuideRecords > 0) {
    strengths.push(`${guideAccessibilityRate}% Children's Guide accessibility — the home provides accessible guides with good content coverage.`);
  }

  if (reviewCycleRate >= 90 && totalReviewCycleRecords > 0) {
    strengths.push(`${reviewCycleRate}% review cycle compliance — documents are reviewed on time with comprehensive section coverage and changes implemented promptly.`);
  } else if (reviewCycleRate >= 70 && totalReviewCycleRecords > 0) {
    strengths.push(`${reviewCycleRate}% review cycle compliance — the home maintains a regular review cycle with good implementation of identified changes.`);
  }

  if (youngPersonInvolvementRate >= 90 && totalInvolvementRecords > 0) {
    strengths.push(`${youngPersonInvolvementRate}% young person involvement — children's views are consistently sought, recorded, actioned, and they are supported to participate in document reviews.`);
  } else if (youngPersonInvolvementRate >= 70 && totalInvolvementRecords > 0) {
    strengths.push(`${youngPersonInvolvementRate}% young person involvement — the home actively seeks and records young people's views on the Statement of Purpose and Children's Guide.`);
  }

  if (ofstedSubmissionRate >= 95 && totalSubmissionRecords > 0) {
    strengths.push(`${ofstedSubmissionRate}% Ofsted submission compliance — all submissions are timely with amendments completed promptly when required.`);
  } else if (ofstedSubmissionRate >= 80 && totalSubmissionRecords > 0) {
    strengths.push(`${ofstedSubmissionRate}% Ofsted submission compliance — submissions are generally on time and amendment requirements are addressed.`);
  }

  if (stakeholderAwarenessRate >= 90 && awarenessComponents.length > 0) {
    strengths.push(`${stakeholderAwarenessRate}% stakeholder awareness — documents are distributed effectively, stakeholders are consulted, and children's feedback is actively collected.`);
  } else if (stakeholderAwarenessRate >= 70 && awarenessComponents.length > 0) {
    strengths.push(`${stakeholderAwarenessRate}% stakeholder awareness — the home ensures key stakeholders are informed about and consulted on document content.`);
  }

  if (schedule1CoverageRate >= 100 && schedule1CheckedTotal > 0) {
    strengths.push("Statement of Purpose achieves full Schedule 1 coverage — all 14 mandatory areas are addressed, demonstrating comprehensive compliance with CHR 2015 Reg 16.");
  } else if (schedule1CoverageRate >= 85 && schedule1CheckedTotal > 0) {
    strengths.push(`${schedule1CoverageRate}% Schedule 1 coverage in Statement of Purpose — the majority of mandatory areas are addressed with only minor gaps.`);
  }

  if (viewsActionedRate >= 90 && totalInvolvementRecords > 0) {
    strengths.push(`${viewsActionedRate}% of young people's views actioned — children's input genuinely shapes the documents that describe their care.`);
  } else if (viewsActionedRate >= 70 && totalInvolvementRecords > 0) {
    strengths.push(`${viewsActionedRate}% of young people's views actioned — the home generally translates children's feedback into meaningful changes.`);
  }

  if (changeImplementationRate >= 90 && reviewChangesIdentified > 0) {
    strengths.push(`${changeImplementationRate}% of review-identified changes implemented — the home follows through on review findings, keeping documents accurate and current.`);
  } else if (changeImplementationRate >= 70 && reviewChangesIdentified > 0) {
    strengths.push(`${changeImplementationRate}% of review-identified changes implemented — most changes identified during reviews are acted upon.`);
  }

  if (childInvolvementCoverage >= 100 && total_children > 0) {
    strengths.push("Every child has been involved in Statement of Purpose or Children's Guide reviews — inclusive participation is embedded in the home's governance approach.");
  } else if (childInvolvementCoverage >= 80 && total_children > 0) {
    strengths.push(`${childInvolvementCoverage}% of children involved in document reviews — strong coverage ensuring most children have a voice in the documents that describe their care.`);
  }

  if (coProductionRate >= 30 && totalInvolvementRecords > 0) {
    strengths.push(`${coProductionRate}% of involvement activities are co-production — the home goes beyond consultation to genuinely co-produce documents with young people.`);
  }

  if (admissionDistributionRate >= 100 && totalGuideRecords > 0) {
    strengths.push("Children's Guide is given to every child on admission — ensuring children immediately know their rights, routines, and how to raise concerns.");
  }

  if (easyReadRate >= 80 && totalGuideRecords > 0) {
    strengths.push(`${easyReadRate}% of Children's Guides have easy-read versions available — accessible to children with additional communication needs.`);
  }

  // ── Concerns ──────────────────────────────────────────────────────────

  const concerns: string[] = [];

  if (statementCurrencyRate < 50 && totalStatementRecords > 0) {
    concerns.push(`Only ${statementCurrencyRate}% Statement of Purpose currency — the Statement of Purpose is not current, has expired, or has not been reviewed within required timescales. This is a direct breach of CHR 2015 Reg 16.`);
  } else if (statementCurrencyRate >= 50 && statementCurrencyRate < 80 && totalStatementRecords > 0) {
    concerns.push(`Statement of Purpose currency at ${statementCurrencyRate}% — review and currency gaps mean it may not accurately reflect the home's current operation.`);
  }

  if (guideAccessibilityRate < 40 && totalGuideRecords > 0) {
    concerns.push(`Only ${guideAccessibilityRate}% Children's Guide accessibility — guides are not adequately age-appropriate, accessible, or comprehensive. Children may not understand their rights or how to raise concerns.`);
  } else if (guideAccessibilityRate >= 40 && guideAccessibilityRate < 70 && totalGuideRecords > 0) {
    concerns.push(`Children's Guide accessibility at ${guideAccessibilityRate}% — improvements needed in age-appropriateness, accessible formats, or content coverage.`);
  }

  if (reviewOnTimeRate < 50 && totalReviewCycleRecords > 0) {
    concerns.push(`Only ${reviewOnTimeRate}% of reviews completed on time${avgOverdueDays > 0 ? `, averaging ${avgOverdueDays} days overdue` : ""}. This undermines the currency and accuracy of both documents.`);
  } else if (reviewOnTimeRate >= 50 && reviewOnTimeRate < 80 && totalReviewCycleRecords > 0) {
    concerns.push(`Review on-time rate at ${reviewOnTimeRate}% — not all reviews completed within required timescales, risking document currency.`);
  }

  if (youngPersonInvolvementRate < 30 && totalInvolvementRecords > 0) {
    concerns.push(`Only ${youngPersonInvolvementRate}% young person involvement — children's views are not being adequately sought, recorded, or actioned. This contradicts the voice of the child principle central to SCCIF.`);
  } else if (youngPersonInvolvementRate >= 30 && youngPersonInvolvementRate < 70 && totalInvolvementRecords > 0) {
    concerns.push(`Young person involvement at ${youngPersonInvolvementRate}% — young people's participation in document updates is inconsistent.`);
  }

  if (ofstedSubmissionRate < 50 && totalSubmissionRecords > 0) {
    concerns.push(`Only ${ofstedSubmissionRate}% Ofsted submission compliance — submissions are frequently late or amendment requirements not completed, creating regulatory risk.`);
  } else if (ofstedSubmissionRate >= 50 && ofstedSubmissionRate < 80 && totalSubmissionRecords > 0) {
    concerns.push(`Ofsted submission compliance at ${ofstedSubmissionRate}% — some submissions late or post-submission amendments remain incomplete.`);
  }

  if (stakeholderAwarenessRate < 50 && awarenessComponents.length > 0) {
    concerns.push(`Only ${stakeholderAwarenessRate}% stakeholder awareness — documents are not being effectively distributed and stakeholders are not consulted.`);
  } else if (stakeholderAwarenessRate >= 50 && stakeholderAwarenessRate < 70 && awarenessComponents.length > 0) {
    concerns.push(`Stakeholder awareness at ${stakeholderAwarenessRate}% — gaps in distribution or consultation mean some stakeholders may not be fully informed.`);
  }

  if (hasExpiredStatements) {
    concerns.push(`${expiredStatements.length} expired Statement${expiredStatements.length !== 1 ? "s" : ""} of Purpose identified — expired statements must be replaced with current versions or formally archived.`);
  }

  if (totalStatementRecords > 0 && currentStatementCount === 0) {
    concerns.push("No current Statement of Purpose — all recorded statements are in draft, under review, archived, or expired status. A current, approved statement is required at all times under CHR 2015 Reg 16.");
  }

  if (totalGuideRecords > 0 && currentGuideCount === 0) {
    concerns.push("No current Children's Guide — a current guide must be available for every child under CHR 2015 Reg 17.");
  }

  if (schedule1CoverageRate < 70 && schedule1CheckedTotal > 0) {
    concerns.push(`Schedule 1 coverage at only ${schedule1CoverageRate}% — the Statement of Purpose does not address all mandatory areas required by CHR 2015 Reg 16.`);
  }

  if (viewsActionedRate < 40 && totalInvolvementRecords > 0) {
    concerns.push(`Only ${viewsActionedRate}% of young people's views actioned — children's input is collected but not translated into meaningful changes, risking tokenistic participation.`);
  }

  if (changeImplementationRate < 50 && reviewChangesIdentified > 0) {
    concerns.push(`Only ${changeImplementationRate}% of review-identified changes implemented — changes are not being acted upon, undermining the review cycle.`);
  }

  if (childInvolvementCoverage < 50 && total_children > 0 && totalInvolvementRecords > 0) {
    concerns.push(`Only ${childInvolvementCoverage}% of children involved in document reviews — many children have had no opportunity to contribute their views.`);
  }

  if (admissionDistributionRate < 50 && totalGuideRecords > 0) {
    concerns.push(`Only ${admissionDistributionRate}% of Children's Guides given on admission — children are not consistently receiving the guide on arrival.`);
  }

  if (totalInvolvementRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push("No young person involvement records despite children being on placement — children's views must be sought and recorded when updating the Statement of Purpose and Children's Guide.");
  }

  if (totalReviewCycleRecords === 0 && (totalStatementRecords > 0 || totalGuideRecords > 0)) {
    concerns.push("No review cycle records despite documents existing — documents must be reviewed regularly to ensure they remain accurate and current.");
  }

  // ── Recommendations ───────────────────────────────────────────────────

  const recommendations: StatementPurposeRecommendation[] = [];
  let rank = 0;

  if (statementCurrencyRate < 50 && totalStatementRecords > 0) {
    recommendations.push({ rank: ++rank, recommendation: "Urgently review and update the Statement of Purpose to ensure it is current, within its review date, and accurately reflects the home's operation. An expired or out-of-date Statement of Purpose is a direct breach of CHR 2015 Reg 16.", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 16 — Statement of Purpose" });
  }

  if (totalStatementRecords > 0 && currentStatementCount === 0) {
    recommendations.push({ rank: ++rank, recommendation: "Ensure a current, approved Statement of Purpose is in place immediately — the home must have a Statement of Purpose in 'current' status at all times. Finalise any draft or under-review versions without delay.", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 16 — Statement of Purpose" });
  }

  if (guideAccessibilityRate < 40 && totalGuideRecords > 0) {
    recommendations.push({ rank: ++rank, recommendation: "Urgently improve Children's Guide accessibility — ensure guides are age-appropriate, available in accessible formats, cover all required sections, and are given to every child on admission.", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 17 — Children's Guide" });
  }

  if (reviewOnTimeRate < 50 && totalReviewCycleRecords > 0) {
    recommendations.push({ rank: ++rank, recommendation: "Implement a structured review calendar with automated reminders to ensure all document reviews are completed on time. Late reviews undermine document currency and regulatory compliance.", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 16 — Statement of Purpose" });
  }

  if (youngPersonInvolvementRate < 30 && totalInvolvementRecords > 0) {
    recommendations.push({ rank: ++rank, recommendation: "Develop meaningful mechanisms for young people's involvement in document reviews — seek their views, record them, and demonstrate how their input has shaped the documents.", urgency: "immediate", regulatory_ref: "SCCIF — Voice of the child, Leadership and management" });
  }

  if (totalInvolvementRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({ rank: ++rank, recommendation: "Begin recording young people's involvement in document reviews immediately — children's views must be sought, recorded, and actioned to evidence genuine participation.", urgency: "immediate", regulatory_ref: "SCCIF — Voice of the child" });
  }

  if (totalReviewCycleRecords === 0 && (totalStatementRecords > 0 || totalGuideRecords > 0)) {
    recommendations.push({ rank: ++rank, recommendation: "Establish a formal review cycle for both documents — reviews should be scheduled at least annually, with records of who reviewed, what was covered, and what changes were made.", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 16 — Statement of Purpose" });
  }

  if (schedule1CoverageRate < 70 && schedule1CheckedTotal > 0) {
    recommendations.push({ rank: ++rank, recommendation: "Review the Statement of Purpose against all 14 Schedule 1 requirements and address the gaps — covering ethos, range of needs, accommodation, staffing, fire safety, behaviour management, education, health, contact, complaints, religious/cultural needs, emergency placement, registered manager, and responsible individual.", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 16, Schedule 1" });
  }

  if (ofstedSubmissionRate < 50 && totalSubmissionRecords > 0) {
    recommendations.push({ rank: ++rank, recommendation: "Review and improve the Ofsted submission process to ensure timely submissions — set up a tracking system with deadline reminders and ensure amendment requests are actioned promptly.", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 16 — Statement of Purpose" });
  }

  if (statementCurrencyRate >= 50 && statementCurrencyRate < 80 && totalStatementRecords > 0) {
    recommendations.push({ rank: ++rank, recommendation: "Improve Statement of Purpose currency by establishing a proactive review schedule — review at least annually or when significant changes occur, and update expiry dates.", urgency: "soon", regulatory_ref: "CHR 2015 Reg 16 — Statement of Purpose" });
  }

  if (guideAccessibilityRate >= 40 && guideAccessibilityRate < 70 && totalGuideRecords > 0) {
    recommendations.push({ rank: ++rank, recommendation: "Enhance Children's Guide accessibility by developing easy-read versions, ensuring age-appropriate language, and confirming all required sections are covered.", urgency: "soon", regulatory_ref: "CHR 2015 Reg 17 — Children's Guide" });
  }

  if (youngPersonInvolvementRate >= 30 && youngPersonInvolvementRate < 70 && totalInvolvementRecords > 0) {
    recommendations.push({ rank: ++rank, recommendation: "Strengthen young person involvement through co-production workshops, feedback sessions, and child-friendly review formats. Ensure all children have the opportunity to contribute.", urgency: "soon", regulatory_ref: "SCCIF — Voice of the child" });
  }

  if (viewsActionedRate < 40 && totalInvolvementRecords > 0) {
    recommendations.push({ rank: ++rank, recommendation: "Implement a 'you said, we did' approach — document how young people's views have been actioned and feed back to children so they see their contributions make a difference.", urgency: "soon", regulatory_ref: "SCCIF — Voice of the child" });
  }

  if (changeImplementationRate < 50 && reviewChangesIdentified > 0) {
    recommendations.push({ rank: ++rank, recommendation: "Create an action tracker for review-identified changes with assigned owners and deadlines — changes must be implemented to maintain document accuracy.", urgency: "soon", regulatory_ref: "CHR 2015 Reg 16 — Statement of Purpose" });
  }

  if (stakeholderAwarenessRate >= 50 && stakeholderAwarenessRate < 70 && awarenessComponents.length > 0) {
    recommendations.push({ rank: ++rank, recommendation: "Improve stakeholder engagement by establishing a distribution checklist, collecting feedback from placing authorities, and ensuring the Children's Guide is discussed with every child on admission.", urgency: "planned", regulatory_ref: "CHR 2015 Reg 16 — Statement of Purpose" });
  }

  if (reviewOnTimeRate >= 50 && reviewOnTimeRate < 80 && totalReviewCycleRecords > 0) {
    recommendations.push({ rank: ++rank, recommendation: "Improve review timeliness by setting calendar reminders at least 4 weeks before review due dates and assigning responsibility for initiating each review cycle.", urgency: "planned", regulatory_ref: "CHR 2015 Reg 16 — Statement of Purpose" });
  }

  if (childInvolvementCoverage >= 50 && childInvolvementCoverage < 80 && total_children > 0 && totalInvolvementRecords > 0) {
    recommendations.push({ rank: ++rank, recommendation: "Extend involvement opportunities to all children — identify those who have not yet participated and create accessible, supported opportunities for them to share their views.", urgency: "planned", regulatory_ref: "SCCIF — Voice of the child" });
  }

  if (easyReadRate < 50 && totalGuideRecords > 0) {
    recommendations.push({ rank: ++rank, recommendation: "Develop easy-read versions of the Children's Guide to ensure accessibility for children with additional communication needs or learning difficulties.", urgency: "planned", regulatory_ref: "CHR 2015 Reg 17 — Children's Guide" });
  }

  if (ofstedSubmissionRate >= 50 && ofstedSubmissionRate < 80 && totalSubmissionRecords > 0) {
    recommendations.push({ rank: ++rank, recommendation: "Tighten submission tracking with a submission log, automated deadline reminders, and a post-submission follow-up process for acknowledgements and feedback.", urgency: "planned", regulatory_ref: "CHR 2015 Reg 16 — Statement of Purpose" });
  }

  if (admissionDistributionRate < 80 && admissionDistributionRate >= 50 && totalGuideRecords > 0) {
    recommendations.push({ rank: ++rank, recommendation: "Include Children's Guide distribution in the admission checklist to ensure every child receives the guide on arrival.", urgency: "planned", regulatory_ref: "CHR 2015 Reg 17 — Children's Guide" });
  }

  // ── Insights ──────────────────────────────────────────────────────────

  const insights: StatementPurposeInsight[] = [];

  // -- Critical insights --

  if (statementCurrencyRate < 50 && totalStatementRecords > 0) {
    insights.push({ text: `Only ${statementCurrencyRate}% Statement of Purpose currency. An out-of-date or expired Statement of Purpose means the home cannot evidence its documented purpose reflects current operation. Ofsted inspectors will check currency — failure signals poor leadership and governance.`, severity: "critical" });
  }

  if (guideAccessibilityRate < 40 && totalGuideRecords > 0) {
    insights.push({ text: `Only ${guideAccessibilityRate}% Children's Guide accessibility. If children cannot access and understand the guide, they cannot know their rights, routines, or how to raise concerns. This directly impacts safeguarding.`, severity: "critical" });
  }

  if (reviewOnTimeRate < 50 && totalReviewCycleRecords > 0) {
    insights.push({ text: `Only ${reviewOnTimeRate}% of reviews completed on time${avgOverdueDays > 0 ? `, averaging ${avgOverdueDays} days overdue` : ""}. Late reviews mean documents may contain inaccurate information — this creates regulatory and safeguarding risks.`, severity: "critical" });
  }

  if (youngPersonInvolvementRate < 30 && totalInvolvementRecords > 0) {
    insights.push({ text: `Only ${youngPersonInvolvementRate}% young person involvement. Children are not meaningfully contributing to documents that describe their care. SCCIF places significant weight on the voice of the child.`, severity: "critical" });
  }

  if (totalStatementRecords > 0 && currentStatementCount === 0) {
    insights.push({ text: "No current Statement of Purpose is in place. This is a fundamental regulatory breach under CHR 2015 Reg 16 — every children's home must have a current Statement of Purpose.", severity: "critical" });
  }

  if (totalGuideRecords > 0 && currentGuideCount === 0) {
    insights.push({ text: "No current Children's Guide is in place. Under CHR 2015 Reg 17, every child must receive a guide that helps them understand routines, rights, and how to raise concerns.", severity: "critical" });
  }

  if (totalInvolvementRecords === 0 && total_children > 0 && !allEmpty) {
    insights.push({ text: "No young person involvement records exist despite children on placement. Without evidence that children's views are sought and incorporated, the home cannot demonstrate child-centred leadership.", severity: "critical" });
  }

  if (schedule1CoverageRate < 70 && schedule1CheckedTotal > 0) {
    insights.push({ text: `Schedule 1 coverage at only ${schedule1CoverageRate}%. The Statement of Purpose does not address significant mandatory areas — an incomplete statement fails to meet regulatory requirements.`, severity: "critical" });
  }

  // -- Warning insights --

  if (statementCurrencyRate >= 50 && statementCurrencyRate < 80 && totalStatementRecords > 0) {
    insights.push({ text: `Statement of Purpose currency at ${statementCurrencyRate}% — review or expiry dates indicate it may not fully reflect current operation. Proactive reviews would strengthen currency.`, severity: "warning" });
  }

  if (guideAccessibilityRate >= 40 && guideAccessibilityRate < 70 && totalGuideRecords > 0) {
    insights.push({ text: `Children's Guide accessibility at ${guideAccessibilityRate}% — age-appropriateness, format accessibility, or content coverage need attention.`, severity: "warning" });
  }

  if (reviewOnTimeRate >= 50 && reviewOnTimeRate < 80 && totalReviewCycleRecords > 0) {
    insights.push({ text: `Review on-time rate at ${reviewOnTimeRate}% — some reviews are overdue. A proactive review calendar with advance reminders would improve timeliness.`, severity: "warning" });
  }

  if (youngPersonInvolvementRate >= 30 && youngPersonInvolvementRate < 70 && totalInvolvementRecords > 0) {
    insights.push({ text: `Young person involvement at ${youngPersonInvolvementRate}% — scope to deepen participation through co-production approaches and demonstrating how views influenced changes.`, severity: "warning" });
  }

  if (ofstedSubmissionRate >= 50 && ofstedSubmissionRate < 80 && totalSubmissionRecords > 0) {
    insights.push({ text: `Ofsted submission compliance at ${ofstedSubmissionRate}% — some submissions late or amendments outstanding. Consistent timeliness is essential for a positive regulatory relationship.`, severity: "warning" });
  }

  if (stakeholderAwarenessRate >= 50 && stakeholderAwarenessRate < 70 && awarenessComponents.length > 0) {
    insights.push({ text: `Stakeholder awareness at ${stakeholderAwarenessRate}% — not all stakeholders being effectively reached. Placing authorities, staff, and children should all be consulted.`, severity: "warning" });
  }

  if (changeImplementationRate >= 50 && changeImplementationRate < 70 && reviewChangesIdentified > 0) {
    insights.push({ text: `Change implementation at ${changeImplementationRate}% — some review-identified changes not actioned. Unimplemented changes mean documents may not reflect current practice.`, severity: "warning" });
  }

  if (childInvolvementCoverage >= 50 && childInvolvementCoverage < 80 && total_children > 0 && totalInvolvementRecords > 0) {
    insights.push({ text: `${childInvolvementCoverage}% of children involved in document reviews — some children have not yet had the opportunity. Extending involvement demonstrates inclusive governance.`, severity: "warning" });
  }

  if (schedule1CoverageRate >= 70 && schedule1CoverageRate < 85 && schedule1CheckedTotal > 0) {
    insights.push({ text: `Schedule 1 coverage at ${schedule1CoverageRate}% — most mandatory areas addressed but gaps remain. Full coverage is required for comprehensive compliance.`, severity: "warning" });
  }

  if (amendmentRate >= 40 && totalReviewCycleRecords > 0) {
    insights.push({ text: `${amendmentRate}% of reviews required amendments — frequent amendments may indicate documents are not maintained proactively between reviews.`, severity: "warning" });
  }

  if (viewsActionedRate >= 40 && viewsActionedRate < 70 && totalInvolvementRecords > 0) {
    insights.push({ text: `${viewsActionedRate}% of young people's views actioned — not all views translated into changes. Consider structural barriers to acting on children's feedback.`, severity: "warning" });
  }

  // -- Positive insights --

  if (statement_rating === "outstanding") {
    insights.push({ text: "The home demonstrates outstanding management of its Statement of Purpose and Children's Guide — documents are current, accessible, regularly reviewed, and shaped by genuine young person involvement. This evidences strong leadership.", severity: "positive" });
  }

  if (statementCurrencyRate >= 95 && schedule1CoverageRate >= 100 && totalStatementRecords > 0 && schedule1CheckedTotal > 0) {
    insights.push({ text: `${statementCurrencyRate}% Statement of Purpose currency with full Schedule 1 coverage — the home maintains a comprehensive, current document that accurately describes its purpose and approach to care.`, severity: "positive" });
  }

  if (guideAccessibilityRate >= 90 && admissionDistributionRate >= 100 && totalGuideRecords > 0) {
    insights.push({ text: `${guideAccessibilityRate}% Children's Guide accessibility with 100% admission distribution — every child receives an accessible, comprehensive guide on arrival.`, severity: "positive" });
  }

  if (reviewCycleRate >= 90 && changeImplementationRate >= 90 && totalReviewCycleRecords > 0 && reviewChangesIdentified > 0) {
    insights.push({ text: `${reviewCycleRate}% review cycle compliance with ${changeImplementationRate}% change implementation — a rigorous and responsive review process keeps documents accurate and current.`, severity: "positive" });
  }

  if (youngPersonInvolvementRate >= 90 && viewsActionedRate >= 90 && totalInvolvementRecords > 0) {
    insights.push({ text: `${youngPersonInvolvementRate}% young person involvement with ${viewsActionedRate}% of views actioned — children's voices genuinely shape the documents that describe their care.`, severity: "positive" });
  }

  if (childInvolvementCoverage >= 100 && total_children > 0 && totalInvolvementRecords > 0) {
    insights.push({ text: "Every child has been involved in document reviews — inclusive participation is embedded in the home's governance.", severity: "positive" });
  }

  if (ofstedSubmissionRate >= 95 && totalSubmissionRecords > 0) {
    insights.push({ text: `${ofstedSubmissionRate}% Ofsted submission compliance — timely, accurate submissions with prompt amendment completion demonstrate strong governance.`, severity: "positive" });
  }

  if (stakeholderAwarenessRate >= 90 && awarenessComponents.length > 0) {
    insights.push({ text: `${stakeholderAwarenessRate}% stakeholder awareness — documents widely distributed, stakeholders consulted, and children's feedback actively sought.`, severity: "positive" });
  }

  if (coProductionRate >= 30 && totalInvolvementRecords > 0) {
    insights.push({ text: `${coProductionRate}% of involvement activities use co-production — the home goes beyond consultation to genuinely co-produce documents with young people.`, severity: "positive" });
  }

  // ── Headline ──────────────────────────────────────────────────────────

  let headline: string;

  if (statement_rating === "outstanding") {
    headline =
      "Outstanding Statement of Purpose and Children's Guide management — documents are current, accessible, regularly reviewed, and shaped by genuine young person involvement with timely Ofsted submissions.";
  } else if (statement_rating === "good") {
    headline = `Good Statement of Purpose and Children's Guide management — ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (statement_rating === "adequate") {
    headline = `Adequate Statement of Purpose and Children's Guide management — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure regulatory compliance and effective governance.`;
  } else {
    headline = `Statement of Purpose and Children's Guide management is inadequate — ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to achieve compliance with CHR 2015 Reg 16 and Reg 17.`;
  }

  // ── Return ────────────────────────────────────────────────────────────

  return {
    statement_rating,
    statement_score: score,
    headline,
    total_statement_records: totalStatementRecords,
    total_guide_records: totalGuideRecords,
    total_review_cycle_records: totalReviewCycleRecords,
    total_involvement_records: totalInvolvementRecords,
    total_submission_records: totalSubmissionRecords,
    statement_currency_rate: statementCurrencyRate,
    guide_accessibility_rate: guideAccessibilityRate,
    review_cycle_rate: reviewCycleRate,
    young_person_involvement_rate: youngPersonInvolvementRate,
    ofsted_submission_rate: ofstedSubmissionRate,
    stakeholder_awareness_rate: stakeholderAwarenessRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
