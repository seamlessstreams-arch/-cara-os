// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Complaints & Feedback Quality Intelligence Engine
//
// Pure deterministic engine — no AI, no external calls.
// Analyses complaint handling, feedback culture, learning outcomes and policy
// compliance within a children's residential home.
//
// Maps to: CHR 2015 Reg 39 (complaints), Children Act 1989 s26
// (representations), SCCIF, UNCRC Article 12, NMS 15, Ofsted complaints
// guidance, Working Together 2023, PIDA 1998
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ────────────────────────────────────────────────────────────────────

export type ComplaintCategory =
  | "care_quality"
  | "staff_conduct"
  | "safeguarding"
  | "food_nutrition"
  | "environment"
  | "education"
  | "contact_family"
  | "bullying"
  | "medication"
  | "privacy"
  | "discrimination"
  | "other";

export type ComplaintStatus =
  | "open"
  | "investigating"
  | "resolved"
  | "escalated"
  | "withdrawn";

export type ComplaintStage =
  | "informal"
  | "stage_1"
  | "stage_2"
  | "stage_3_panel"
  | "ombudsman";

export type ResolutionOutcome =
  | "upheld"
  | "partially_upheld"
  | "not_upheld"
  | "withdrawn"
  | "ongoing";

export type ComplainantType =
  | "child"
  | "parent_carer"
  | "social_worker"
  | "advocate"
  | "staff"
  | "external";

export type FeedbackType =
  | "compliment"
  | "suggestion"
  | "concern"
  | "formal_complaint";

export type FeedbackSource =
  | "child"
  | "family"
  | "social_worker"
  | "visiting_professional"
  | "staff"
  | "reg44_visitor"
  | "anonymous";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// ── Input Interfaces ────────────────────────────────────────────────────────

export interface ComplaintRecord {
  id: string;
  childId: string | null;
  childName: string | null;
  complainantType: ComplainantType;
  feedbackType: FeedbackType;
  category: ComplaintCategory;
  stage: ComplaintStage;
  status: ComplaintStatus;
  outcome: ResolutionOutcome | null;
  dateReceived: string;
  dateResolved: string | null;
  targetResolutionDays: number;
  actualResolutionDays: number | null;
  childInformedOfOutcome: boolean;
  childSupportedToComplain: boolean;
  lessonsLearned: boolean;
  actionsTaken: string[];
  escalatedExternally: boolean;
}

export interface FeedbackRecord {
  id: string;
  source: FeedbackSource;
  feedbackType: FeedbackType;
  date: string;
  category: ComplaintCategory | null;
  acknowledged: boolean;
  actedUpon: boolean;
  responseWithinTimescale: boolean;
  childId: string | null;
  childName: string | null;
}

export interface ComplaintsPolicy {
  id: string;
  homeId: string;
  policyReviewedDate: string;
  childFriendlyVersionAvailable: boolean;
  displayedProminently: boolean;
  childrenAwareOfProcess: boolean;
  advocacyAccessible: boolean;
  independentPersonAvailable: boolean;
  regularAuditCompleted: boolean;
}

export interface LessonLearned {
  id: string;
  complaintId: string;
  description: string;
  implementedDate: string | null;
  impactAssessed: boolean;
  sharedWithTeam: boolean;
  policyChanged: boolean;
}

// ── Result Interfaces ───────────────────────────────────────────────────────

export interface ComplaintHandlingResult {
  overallScore: number; // 0-25
  totalComplaints: number;
  resolvedWithinTimescaleRate: number; // %
  upheldPartiallyRate: number; // %
  childInformedRate: number; // %
  childSupportedRate: number; // %
  averageResolutionDays: number;
  escalationCount: number;
}

export interface FeedbackCultureResult {
  overallScore: number; // 0-25
  totalFeedback: number;
  acknowledgedRate: number; // %
  actedUponRate: number; // %
  responseTimelyRate: number; // %
  childFeedbackCount: number;
  complimentCount: number;
  suggestionCount: number;
}

export interface LearningOutcomesResult {
  overallScore: number; // 0-25
  totalLessons: number;
  implementedRate: number; // %
  impactAssessedRate: number; // %
  sharedWithTeamRate: number; // %
  policyChangedCount: number;
}

export interface PolicyComplianceResult {
  overallScore: number; // 0-25
  childFriendlyVersion: boolean;
  displayedProminently: boolean;
  childrenAware: boolean;
  advocacyAccessible: boolean;
  independentPerson: boolean;
  auditCompleted: boolean;
  complianceRate: number; // %
}

export interface ChildComplaintProfile {
  childId: string;
  childName: string;
  complaintCount: number;
  feedbackCount: number;
  supportedToComplain: boolean;
  informedOfOutcomes: boolean;
  overallScore: number; // 0-10
}

export interface ComplaintsFeedbackQualityIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  complaintHandling: ComplaintHandlingResult;
  feedbackCulture: FeedbackCultureResult;
  learningOutcomes: LearningOutcomesResult;
  policyCompliance: PolicyComplianceResult;
  childProfiles: ChildComplaintProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Calculate percentage, returning 0 if denominator is 0. */
export function pct(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return Math.round((numerator / denominator) * 100);
}

/** Map overall score (0-100) to Ofsted-style rating. */
export function getRating(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// ── Label Functions ─────────────────────────────────────────────────────────

export function getComplaintCategoryLabel(category: ComplaintCategory): string {
  const labels: Record<ComplaintCategory, string> = {
    care_quality: "Care Quality",
    staff_conduct: "Staff Conduct",
    safeguarding: "Safeguarding",
    food_nutrition: "Food & Nutrition",
    environment: "Environment",
    education: "Education",
    contact_family: "Contact & Family",
    bullying: "Bullying",
    medication: "Medication",
    privacy: "Privacy",
    discrimination: "Discrimination",
    other: "Other",
  };
  return labels[category] || category;
}

export function getComplaintStatusLabel(status: ComplaintStatus): string {
  const labels: Record<ComplaintStatus, string> = {
    open: "Open",
    investigating: "Investigating",
    resolved: "Resolved",
    escalated: "Escalated",
    withdrawn: "Withdrawn",
  };
  return labels[status] || status;
}

export function getComplaintStageLabel(stage: ComplaintStage): string {
  const labels: Record<ComplaintStage, string> = {
    informal: "Informal",
    stage_1: "Stage 1",
    stage_2: "Stage 2",
    stage_3_panel: "Stage 3 Panel",
    ombudsman: "Ombudsman",
  };
  return labels[stage] || stage;
}

export function getResolutionOutcomeLabel(outcome: ResolutionOutcome): string {
  const labels: Record<ResolutionOutcome, string> = {
    upheld: "Upheld",
    partially_upheld: "Partially Upheld",
    not_upheld: "Not Upheld",
    withdrawn: "Withdrawn",
    ongoing: "Ongoing",
  };
  return labels[outcome] || outcome;
}

export function getComplainantTypeLabel(type: ComplainantType): string {
  const labels: Record<ComplainantType, string> = {
    child: "Child",
    parent_carer: "Parent/Carer",
    social_worker: "Social Worker",
    advocate: "Advocate",
    staff: "Staff",
    external: "External",
  };
  return labels[type] || type;
}

export function getFeedbackTypeLabel(type: FeedbackType): string {
  const labels: Record<FeedbackType, string> = {
    compliment: "Compliment",
    suggestion: "Suggestion",
    concern: "Concern",
    formal_complaint: "Formal Complaint",
  };
  return labels[type] || type;
}

export function getFeedbackSourceLabel(source: FeedbackSource): string {
  const labels: Record<FeedbackSource, string> = {
    child: "Child",
    family: "Family",
    social_worker: "Social Worker",
    visiting_professional: "Visiting Professional",
    staff: "Staff",
    reg44_visitor: "Reg 44 Visitor",
    anonymous: "Anonymous",
  };
  return labels[source] || source;
}

export function getRatingLabel(rating: Rating): string {
  const labels: Record<Rating, string> = {
    outstanding: "Outstanding",
    good: "Good",
    requires_improvement: "Requires Improvement",
    inadequate: "Inadequate",
  };
  return labels[rating] || rating;
}

// ── Evaluators ──────────────────────────────────────────────────────────────

/**
 * Evaluate complaint handling quality (0-25).
 *
 * Empty complaints = 25 (no complaints is a good sign, assuming feedback
 * culture exists). Score from resolution timeliness, child informed/supported.
 * Penalty: -5 per unresolved safeguarding complaint.
 */
export function evaluateComplaintHandling(
  complaints: ComplaintRecord[],
): ComplaintHandlingResult {
  if (complaints.length === 0) {
    return {
      overallScore: 25,
      totalComplaints: 0,
      resolvedWithinTimescaleRate: 0,
      upheldPartiallyRate: 0,
      childInformedRate: 0,
      childSupportedRate: 0,
      averageResolutionDays: 0,
      escalationCount: 0,
    };
  }

  const resolved = complaints.filter(
    (c) => c.status === "resolved" || c.status === "withdrawn",
  );

  const resolvedInTime = resolved.filter(
    (c) =>
      c.actualResolutionDays !== null &&
      c.actualResolutionDays <= c.targetResolutionDays,
  );

  const withOutcome = complaints.filter((c) => c.outcome !== null);
  const upheldOrPartial = withOutcome.filter(
    (c) => c.outcome === "upheld" || c.outcome === "partially_upheld",
  );

  const childLinked = complaints.filter((c) => c.childId !== null);
  const childInformed = childLinked.filter((c) => c.childInformedOfOutcome);
  const childSupported = childLinked.filter((c) => c.childSupportedToComplain);

  let totalResolutionDays = 0;
  let resolutionDaysCount = 0;
  for (const c of complaints) {
    if (c.actualResolutionDays !== null) {
      totalResolutionDays += c.actualResolutionDays;
      resolutionDaysCount++;
    }
  }

  const escalationCount = complaints.filter((c) => c.escalatedExternally).length;

  const resolvedWithinTimescaleRate = pct(resolvedInTime.length, resolved.length);
  const upheldPartiallyRate = pct(upheldOrPartial.length, withOutcome.length);
  const childInformedRate = pct(childInformed.length, childLinked.length);
  const childSupportedRate = pct(childSupported.length, childLinked.length);
  const averageResolutionDays =
    resolutionDaysCount > 0
      ? Math.round((totalResolutionDays / resolutionDaysCount) * 10) / 10
      : 0;

  // Scoring (0-25 scale)
  // Resolution timeliness: 30% weight
  const timelinessNorm = resolvedWithinTimescaleRate / 100;
  // Child informed: 25% weight
  const informedNorm = childLinked.length > 0 ? childInformedRate / 100 : 1;
  // Child supported: 25% weight
  const supportedNorm = childLinked.length > 0 ? childSupportedRate / 100 : 1;
  // Low escalation: 20% weight (fewer escalations = better)
  const escalationNorm = Math.max(
    0,
    1 - escalationCount / Math.max(complaints.length, 1),
  );

  let score = Math.round(
    (timelinessNorm * 0.3 + informedNorm * 0.25 + supportedNorm * 0.25 + escalationNorm * 0.2) * 25,
  );

  // Penalty: -5 per unresolved safeguarding complaint
  const unresolvedSafeguarding = complaints.filter(
    (c) =>
      c.category === "safeguarding" &&
      c.status !== "resolved" &&
      c.status !== "withdrawn",
  );
  score = Math.max(0, score - unresolvedSafeguarding.length * 5);

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    totalComplaints: complaints.length,
    resolvedWithinTimescaleRate,
    upheldPartiallyRate,
    childInformedRate,
    childSupportedRate,
    averageResolutionDays,
    escalationCount,
  };
}

/**
 * Evaluate feedback culture (0-25).
 *
 * Empty feedback = 0 (no feedback means poor culture).
 * Score from acknowledged, acted upon, response timeliness, child feedback
 * proportion.
 */
export function evaluateFeedbackCulture(
  feedback: FeedbackRecord[],
): FeedbackCultureResult {
  if (feedback.length === 0) {
    return {
      overallScore: 0,
      totalFeedback: 0,
      acknowledgedRate: 0,
      actedUponRate: 0,
      responseTimelyRate: 0,
      childFeedbackCount: 0,
      complimentCount: 0,
      suggestionCount: 0,
    };
  }

  const acknowledged = feedback.filter((f) => f.acknowledged);
  const actedUpon = feedback.filter((f) => f.actedUpon);
  const timely = feedback.filter((f) => f.responseWithinTimescale);
  const childFeedback = feedback.filter((f) => f.source === "child");
  const compliments = feedback.filter((f) => f.feedbackType === "compliment");
  const suggestions = feedback.filter((f) => f.feedbackType === "suggestion");

  const acknowledgedRate = pct(acknowledged.length, feedback.length);
  const actedUponRate = pct(actedUpon.length, feedback.length);
  const responseTimelyRate = pct(timely.length, feedback.length);

  // Scoring (0-25 scale)
  // Acknowledged: 25% weight
  const ackNorm = acknowledgedRate / 100;
  // Acted upon: 30% weight
  const actedNorm = actedUponRate / 100;
  // Response timeliness: 25% weight
  const timelyNorm = responseTimelyRate / 100;
  // Child feedback proportion: 20% weight (target >=30% from children)
  const childProportion = feedback.length > 0 ? childFeedback.length / feedback.length : 0;
  const childNorm = Math.min(childProportion / 0.3, 1);

  const score = Math.round(
    (ackNorm * 0.25 + actedNorm * 0.3 + timelyNorm * 0.25 + childNorm * 0.2) * 25,
  );

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    totalFeedback: feedback.length,
    acknowledgedRate,
    actedUponRate,
    responseTimelyRate,
    childFeedbackCount: childFeedback.length,
    complimentCount: compliments.length,
    suggestionCount: suggestions.length,
  };
}

/**
 * Evaluate learning outcomes (0-25).
 *
 * Empty lessons = 0 if complaints exist, else 25.
 * Score from implemented, impact assessed, shared with team.
 */
export function evaluateLearningOutcomes(
  lessons: LessonLearned[],
  hasComplaints: boolean,
): LearningOutcomesResult {
  if (lessons.length === 0) {
    return {
      overallScore: hasComplaints ? 0 : 25,
      totalLessons: 0,
      implementedRate: 0,
      impactAssessedRate: 0,
      sharedWithTeamRate: 0,
      policyChangedCount: 0,
    };
  }

  const implemented = lessons.filter((l) => l.implementedDate !== null);
  const impactAssessed = lessons.filter((l) => l.impactAssessed);
  const sharedWithTeam = lessons.filter((l) => l.sharedWithTeam);
  const policyChanged = lessons.filter((l) => l.policyChanged);

  const implementedRate = pct(implemented.length, lessons.length);
  const impactAssessedRate = pct(impactAssessed.length, lessons.length);
  const sharedWithTeamRate = pct(sharedWithTeam.length, lessons.length);

  // Scoring (0-25 scale)
  // Implemented: 35% weight
  const implNorm = implementedRate / 100;
  // Impact assessed: 30% weight
  const impactNorm = impactAssessedRate / 100;
  // Shared with team: 35% weight
  const sharedNorm = sharedWithTeamRate / 100;

  const score = Math.round(
    (implNorm * 0.35 + impactNorm * 0.3 + sharedNorm * 0.35) * 25,
  );

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    totalLessons: lessons.length,
    implementedRate,
    impactAssessedRate,
    sharedWithTeamRate,
    policyChangedCount: policyChanged.length,
  };
}

/**
 * Evaluate policy compliance (0-25).
 *
 * Empty/null policy = 0. Score from boolean fields — each true = points.
 */
export function evaluatePolicyCompliance(
  policy: ComplaintsPolicy | null,
): PolicyComplianceResult {
  if (!policy) {
    return {
      overallScore: 0,
      childFriendlyVersion: false,
      displayedProminently: false,
      childrenAware: false,
      advocacyAccessible: false,
      independentPerson: false,
      auditCompleted: false,
      complianceRate: 0,
    };
  }

  const fields = [
    policy.childFriendlyVersionAvailable,
    policy.displayedProminently,
    policy.childrenAwareOfProcess,
    policy.advocacyAccessible,
    policy.independentPersonAvailable,
    policy.regularAuditCompleted,
  ];

  const trueCount = fields.filter(Boolean).length;
  const complianceRate = pct(trueCount, fields.length);

  // Each true field contributes equally: 25 / 6 ~ 4.17 per field
  const score = Math.round((trueCount / fields.length) * 25);

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    childFriendlyVersion: policy.childFriendlyVersionAvailable,
    displayedProminently: policy.displayedProminently,
    childrenAware: policy.childrenAwareOfProcess,
    advocacyAccessible: policy.advocacyAccessible,
    independentPerson: policy.independentPersonAvailable,
    auditCompleted: policy.regularAuditCompleted,
    complianceRate,
  };
}

// ── Build Child Profiles ────────────────────────────────────────────────────

export function buildChildComplaintProfiles(
  complaints: ComplaintRecord[],
  feedback: FeedbackRecord[],
  childIds: string[],
  childNames: Record<string, string>,
): ChildComplaintProfile[] {
  return childIds.map((childId) => {
    const childName = childNames[childId] || childId;

    const childComplaints = complaints.filter((c) => c.childId === childId);
    const childFeedback = feedback.filter((f) => f.childId === childId);

    const supportedToComplain =
      childComplaints.length === 0 ||
      childComplaints.some((c) => c.childSupportedToComplain);

    const informedOfOutcomes =
      childComplaints.length === 0 ||
      childComplaints.every((c) => c.childInformedOfOutcome || c.status === "open" || c.status === "investigating");

    // Score (0-10)
    let score = 5; // baseline
    if (childComplaints.length > 0) {
      const informedCount = childComplaints.filter((c) => c.childInformedOfOutcome).length;
      const supportedCount = childComplaints.filter((c) => c.childSupportedToComplain).length;
      const informedPct = informedCount / childComplaints.length;
      const supportedPct = supportedCount / childComplaints.length;
      score = Math.round((informedPct * 5 + supportedPct * 5) * 10) / 10;
    }
    if (childFeedback.length > 0) {
      // Bonus for actively giving feedback
      score = Math.min(10, score + 1);
    }

    return {
      childId,
      childName,
      complaintCount: childComplaints.length,
      feedbackCount: childFeedback.length,
      supportedToComplain,
      informedOfOutcomes,
      overallScore: Math.min(10, Math.max(0, score)),
    };
  });
}

// ── Main Intelligence Function ──────────────────────────────────────────────

export function generateComplaintsFeedbackQualityIntelligence(
  complaints: ComplaintRecord[],
  feedback: FeedbackRecord[],
  lessons: LessonLearned[],
  policy: ComplaintsPolicy | null,
  childIds: string[],
  childNames: Record<string, string>,
  homeId: string,
  periodStart: string,
  periodEnd: string,
): ComplaintsFeedbackQualityIntelligence {
  const complaintHandling = evaluateComplaintHandling(complaints);
  const feedbackCulture = evaluateFeedbackCulture(feedback);
  const learningOutcomes = evaluateLearningOutcomes(lessons, complaints.length > 0);
  const policyCompliance = evaluatePolicyCompliance(policy);

  const childProfiles = buildChildComplaintProfiles(
    complaints,
    feedback,
    childIds,
    childNames,
  );

  // Overall score: sum of 4 evaluators (each 0-25) = 0-100
  const overallScore = Math.min(
    100,
    Math.max(
      0,
      complaintHandling.overallScore +
        feedbackCulture.overallScore +
        learningOutcomes.overallScore +
        policyCompliance.overallScore,
    ),
  );

  const rating = getRating(overallScore);

  // ── Strengths ──
  const strengths: string[] = [];

  if (complaintHandling.overallScore >= 20) {
    strengths.push(
      "Complaint handling processes are robust with strong resolution timeliness and child participation",
    );
  }
  if (feedbackCulture.overallScore >= 20) {
    strengths.push(
      "Positive feedback culture with high acknowledgement and response rates",
    );
  }
  if (learningOutcomes.overallScore >= 20) {
    strengths.push(
      "Lessons learned from complaints are effectively implemented and shared across the team",
    );
  }
  if (policyCompliance.overallScore >= 20) {
    strengths.push(
      "Complaints policy is comprehensive, child-friendly and well-communicated",
    );
  }
  if (complaintHandling.totalComplaints === 0 && feedbackCulture.totalFeedback > 0) {
    strengths.push(
      "No formal complaints received during the period, alongside active feedback engagement",
    );
  }
  if (feedbackCulture.complimentCount > 0) {
    strengths.push(
      `${feedbackCulture.complimentCount} compliment(s) received, reflecting positive care experiences`,
    );
  }
  if (complaintHandling.childSupportedRate === 100 && complaintHandling.totalComplaints > 0) {
    strengths.push(
      "All children are supported to make complaints, demonstrating a child-centred approach",
    );
  }
  if (complaintHandling.resolvedWithinTimescaleRate === 100 && complaintHandling.totalComplaints > 0) {
    strengths.push(
      "All complaints resolved within target timescales",
    );
  }
  if (feedbackCulture.childFeedbackCount > 0) {
    strengths.push(
      "Children actively contribute feedback, indicating they feel safe to share their views",
    );
  }

  // ── Areas for Improvement ──
  const areasForImprovement: string[] = [];

  if (complaintHandling.resolvedWithinTimescaleRate < 80 && complaintHandling.totalComplaints > 0) {
    areasForImprovement.push(
      `Only ${complaintHandling.resolvedWithinTimescaleRate}% of complaints resolved within target timescales`,
    );
  }
  if (complaintHandling.childInformedRate < 80 && complaintHandling.totalComplaints > 0) {
    areasForImprovement.push(
      `Only ${complaintHandling.childInformedRate}% of children informed of complaint outcomes`,
    );
  }
  if (complaintHandling.childSupportedRate < 80 && complaintHandling.totalComplaints > 0) {
    areasForImprovement.push(
      `Only ${complaintHandling.childSupportedRate}% of children supported to make complaints`,
    );
  }
  if (feedbackCulture.totalFeedback === 0) {
    areasForImprovement.push(
      "No feedback recorded — this suggests children and stakeholders may not feel able to share views",
    );
  }
  if (feedbackCulture.acknowledgedRate < 80 && feedbackCulture.totalFeedback > 0) {
    areasForImprovement.push(
      `Only ${feedbackCulture.acknowledgedRate}% of feedback acknowledged — all feedback should receive a response`,
    );
  }
  if (feedbackCulture.actedUponRate < 60 && feedbackCulture.totalFeedback > 0) {
    areasForImprovement.push(
      `Only ${feedbackCulture.actedUponRate}% of feedback acted upon`,
    );
  }
  if (feedbackCulture.childFeedbackCount === 0 && feedbackCulture.totalFeedback > 0) {
    areasForImprovement.push(
      "No feedback recorded directly from children — their voice must be actively sought",
    );
  }
  if (learningOutcomes.implementedRate < 80 && learningOutcomes.totalLessons > 0) {
    areasForImprovement.push(
      `Only ${learningOutcomes.implementedRate}% of lessons learned have been implemented`,
    );
  }
  if (learningOutcomes.totalLessons === 0 && complaints.length > 0) {
    areasForImprovement.push(
      "No lessons learned recorded despite complaints — learning from complaints is essential",
    );
  }
  if (policyCompliance.complianceRate < 80 && policy !== null) {
    areasForImprovement.push(
      `Policy compliance at ${policyCompliance.complianceRate}% — gaps in complaints procedure need addressing`,
    );
  }
  if (complaintHandling.escalationCount > 0) {
    areasForImprovement.push(
      `${complaintHandling.escalationCount} complaint(s) escalated externally — review whether earlier resolution was possible`,
    );
  }

  // ── Actions ──
  const actions: string[] = [];

  if (complaintHandling.resolvedWithinTimescaleRate < 80 && complaintHandling.totalComplaints > 0) {
    actions.push(
      "Review complaint handling timescales and implement tracking to ensure all complaints are resolved promptly",
    );
  }
  if (complaintHandling.childInformedRate < 100 && complaintHandling.totalComplaints > 0) {
    actions.push(
      "Ensure all children are informed of complaint outcomes in an age-appropriate way",
    );
  }
  if (complaintHandling.childSupportedRate < 100 && complaintHandling.totalComplaints > 0) {
    actions.push(
      "Provide all children with access to advocacy and support when making complaints",
    );
  }
  if (feedbackCulture.totalFeedback === 0) {
    actions.push(
      "Implement regular feedback mechanisms including children's meetings, suggestion boxes and key-worker sessions",
    );
  }
  if (feedbackCulture.acknowledgedRate < 100 && feedbackCulture.totalFeedback > 0) {
    actions.push(
      "Acknowledge all feedback promptly and communicate how it will be used",
    );
  }
  if (feedbackCulture.childFeedbackCount === 0 && feedbackCulture.totalFeedback > 0) {
    actions.push(
      "Actively seek children's views through age-appropriate feedback methods",
    );
  }
  if (learningOutcomes.totalLessons === 0 && complaints.length > 0) {
    actions.push(
      "Document lessons learned from all complaints and develop action plans for implementation",
    );
  }
  if (learningOutcomes.sharedWithTeamRate < 100 && learningOutcomes.totalLessons > 0) {
    actions.push(
      "Share lessons learned from complaints with the whole staff team through team meetings and supervision",
    );
  }
  if (!policyCompliance.childFriendlyVersion && policy !== null) {
    actions.push(
      "Create a child-friendly version of the complaints procedure",
    );
  }
  if (!policyCompliance.displayedProminently && policy !== null) {
    actions.push(
      "Display the complaints procedure prominently in the home where children can see it",
    );
  }
  if (!policyCompliance.advocacyAccessible && policy !== null) {
    actions.push(
      "Ensure children know how to access independent advocacy when making complaints",
    );
  }
  if (!policyCompliance.auditCompleted && policy !== null) {
    actions.push(
      "Complete a regular audit of the complaints and feedback process",
    );
  }

  const regulatoryLinks = [
    "CHR 2015 Reg 39 — Complaints and representations procedure for children's homes",
    "Children Act 1989 s26 — Representations and complaints procedure for looked-after children",
    "SCCIF — Social Care Common Inspection Framework: quality of care and leadership",
    "UNCRC Article 12 — The right of the child to express views and be heard",
    "NMS 15 — National Minimum Standards: complaints and representation",
    "Ofsted Complaints Guidance — Handling complaints about children's homes",
    "Working Together 2023 — Inter-agency working to safeguard and promote welfare of children",
    "PIDA 1998 — Public Interest Disclosure Act: whistleblowing protections for staff",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    complaintHandling,
    feedbackCulture,
    learningOutcomes,
    policyCompliance,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
