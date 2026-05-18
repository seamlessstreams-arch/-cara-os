// ==============================================================================
// VISITOR & PARTNERSHIP QUALITY INTELLIGENCE ENGINE
//
// Pure deterministic engine for analysing the quality and effectiveness of
// external visits, multi-agency partnership working, and professional
// engagement with a children's residential care home.
//
// Regulatory basis:
//   - CHR 2015, Reg 44 — Independent person: visits and reports
//   - CHR 2015, Reg 45 — Review of quality of care
//   - SCCIF — Leadership and management (partnership working)
//   - NMS 18 — Monitoring the home
//   - Working Together 2023 — Multi-agency working
//   - UNCRC Article 3 — Best interests (professional oversight)
//   - CA 1989 s22(3)(a) — Duty to safeguard and promote welfare
//
// No AI. No external calls. Pure input → output.
// ==============================================================================

// ── Types ──────────────────────────────────────────────────────────────────

export type VisitorType =
  | "reg44_visitor"
  | "social_worker"
  | "iro"
  | "therapist"
  | "advocate"
  | "family_member"
  | "education_professional"
  | "health_professional"
  | "ofsted_inspector"
  | "police_liaison";

export type VisitPurpose =
  | "statutory_visit"
  | "review_meeting"
  | "therapy_session"
  | "care_planning"
  | "safeguarding"
  | "education_support"
  | "health_appointment"
  | "family_contact"
  | "inspection"
  | "general_support";

export type VisitOutcome =
  | "positive"
  | "constructive"
  | "concerns_raised"
  | "action_required"
  | "follow_up_needed"
  | "cancelled"
  | "no_show";

export type PartnershipRating =
  | "excellent"
  | "good"
  | "adequate"
  | "poor";

export type ActionStatus =
  | "completed"
  | "in_progress"
  | "overdue"
  | "not_started";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// ── Input Interfaces ───────────────────────────────────────────────────────

export interface VisitRecord {
  id: string;
  visitorType: VisitorType;
  visitorName: string;
  visitPurpose: VisitPurpose;
  date: string;
  childId: string | null;
  childName: string | null;
  outcome: VisitOutcome;
  reportProvided: boolean;
  recommendationsCount: number;
  childSeen: boolean;
  childSpokenToAlone: boolean | null;
  duration: number; // minutes
  followUpDate: string | null;
}

export interface PartnershipAssessment {
  id: string;
  partnerAgency: string;
  partnerType: VisitorType;
  assessmentDate: string;
  partnershipRating: PartnershipRating;
  informationSharingEffective: boolean;
  jointPlanningEvident: boolean;
  responsiveToRequests: boolean;
  attendsReviewMeetings: boolean;
  childFocused: boolean;
  challengeAccepted: boolean;
}

export interface Reg44Visit {
  id: string;
  visitDate: string;
  visitorName: string;
  childrenInterviewed: number;
  totalChildren: number;
  staffInterviewed: number;
  reportTimely: boolean;
  issuesRaised: number;
  issuesResolved: number;
  previousRecommendationsReviewed: boolean;
  overallPositive: boolean;
}

export interface VisitorAction {
  id: string;
  visitId: string;
  visitorType: VisitorType;
  description: string;
  assignedTo: string;
  dueDate: string;
  status: ActionStatus;
  completedDate: string | null;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface VisitQualityResult {
  overallScore: number;
  totalVisits: number;
  positiveOutcomeRate: number;
  reportProvidedRate: number;
  childSeenRate: number;
  childSpokenAloneRate: number;
  cancellationRate: number;
  averageDuration: number;
  visitorDistribution: Record<VisitorType, number>;
  purposeDistribution: Record<VisitPurpose, number>;
}

export interface PartnershipEffectivenessResult {
  overallScore: number;
  totalAssessments: number;
  excellentGoodRate: number;
  informationSharingRate: number;
  jointPlanningRate: number;
  responsiveRate: number;
  attendsReviewsRate: number;
  childFocusedRate: number;
  challengeAcceptedRate: number;
}

export interface Reg44ComplianceResult {
  overallScore: number;
  totalVisits: number;
  childInterviewRate: number;
  reportTimelyRate: number;
  issueResolutionRate: number;
  previousRecsReviewedRate: number;
  overallPositiveRate: number;
  averageIssuesRaised: number;
}

export interface ActionResponseResult {
  overallScore: number;
  totalActions: number;
  completedRate: number;
  overdueCount: number;
  inProgressCount: number;
  completionByVisitorType: Record<VisitorType, number>;
}

export interface ChildVisitorProfile {
  childId: string;
  childName: string;
  totalVisits: number;
  socialWorkerVisits: number;
  therapistVisits: number;
  childSeenRate: number;
  positiveOutcomeRate: number;
  overallScore: number;
}

export interface VisitorPartnershipQualityIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  visitQuality: VisitQualityResult;
  partnershipEffectiveness: PartnershipEffectivenessResult;
  reg44Compliance: Reg44ComplianceResult;
  actionResponse: ActionResponseResult;
  childProfiles: ChildVisitorProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

export function pct(num: number, den: number): number {
  if (den === 0) return 0;
  return Math.round((num / den) * 100);
}

export function getRating(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// ── Label Functions ────────────────────────────────────────────────────────

const VISITOR_TYPE_LABELS: Record<VisitorType, string> = {
  reg44_visitor: "Reg 44 Visitor",
  social_worker: "Social Worker",
  iro: "IRO",
  therapist: "Therapist",
  advocate: "Advocate",
  family_member: "Family Member",
  education_professional: "Education Professional",
  health_professional: "Health Professional",
  ofsted_inspector: "Ofsted Inspector",
  police_liaison: "Police Liaison",
};

const VISIT_PURPOSE_LABELS: Record<VisitPurpose, string> = {
  statutory_visit: "Statutory Visit",
  review_meeting: "Review Meeting",
  therapy_session: "Therapy Session",
  care_planning: "Care Planning",
  safeguarding: "Safeguarding",
  education_support: "Education Support",
  health_appointment: "Health Appointment",
  family_contact: "Family Contact",
  inspection: "Inspection",
  general_support: "General Support",
};

const VISIT_OUTCOME_LABELS: Record<VisitOutcome, string> = {
  positive: "Positive",
  constructive: "Constructive",
  concerns_raised: "Concerns Raised",
  action_required: "Action Required",
  follow_up_needed: "Follow-Up Needed",
  cancelled: "Cancelled",
  no_show: "No Show",
};

const PARTNERSHIP_RATING_LABELS: Record<PartnershipRating, string> = {
  excellent: "Excellent",
  good: "Good",
  adequate: "Adequate",
  poor: "Poor",
};

const ACTION_STATUS_LABELS: Record<ActionStatus, string> = {
  completed: "Completed",
  in_progress: "In Progress",
  overdue: "Overdue",
  not_started: "Not Started",
};

const RATING_LABELS: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getVisitorTypeLabel(v: VisitorType): string { return VISITOR_TYPE_LABELS[v]; }
export function getVisitPurposeLabel(v: VisitPurpose): string { return VISIT_PURPOSE_LABELS[v]; }
export function getVisitOutcomeLabel(v: VisitOutcome): string { return VISIT_OUTCOME_LABELS[v]; }
export function getPartnershipRatingLabel(v: PartnershipRating): string { return PARTNERSHIP_RATING_LABELS[v]; }
export function getActionStatusLabel(v: ActionStatus): string { return ACTION_STATUS_LABELS[v]; }
export function getRatingLabel(v: Rating): string { return RATING_LABELS[v]; }

// ── Evaluators ─────────────────────────────────────────────────────────────

export function evaluateVisitQuality(visits: VisitRecord[]): VisitQualityResult {
  const visitorDistribution = {} as Record<VisitorType, number>;
  for (const t of [
    "reg44_visitor", "social_worker", "iro", "therapist", "advocate",
    "family_member", "education_professional", "health_professional",
    "ofsted_inspector", "police_liaison",
  ] as VisitorType[]) {
    visitorDistribution[t] = 0;
  }

  const purposeDistribution = {} as Record<VisitPurpose, number>;
  for (const p of [
    "statutory_visit", "review_meeting", "therapy_session", "care_planning",
    "safeguarding", "education_support", "health_appointment", "family_contact",
    "inspection", "general_support",
  ] as VisitPurpose[]) {
    purposeDistribution[p] = 0;
  }

  if (visits.length === 0) {
    return {
      overallScore: 0,
      totalVisits: 0,
      positiveOutcomeRate: 0,
      reportProvidedRate: 0,
      childSeenRate: 0,
      childSpokenAloneRate: 0,
      cancellationRate: 0,
      averageDuration: 0,
      visitorDistribution,
      purposeDistribution,
    };
  }

  let positive = 0;
  let reports = 0;
  let childSeen = 0;
  let childAlone = 0;
  let childAloneApplicable = 0;
  let cancelled = 0;
  let totalDuration = 0;

  for (const v of visits) {
    visitorDistribution[v.visitorType] = (visitorDistribution[v.visitorType] || 0) + 1;
    purposeDistribution[v.visitPurpose] = (purposeDistribution[v.visitPurpose] || 0) + 1;

    if (v.outcome === "positive" || v.outcome === "constructive") positive++;
    if (v.reportProvided) reports++;
    if (v.childSeen) childSeen++;
    if (v.childSpokenToAlone !== null) {
      childAloneApplicable++;
      if (v.childSpokenToAlone) childAlone++;
    }
    if (v.outcome === "cancelled" || v.outcome === "no_show") cancelled++;
    totalDuration += v.duration;
  }

  const positiveOutcomeRate = pct(positive, visits.length);
  const reportProvidedRate = pct(reports, visits.length);
  const childSeenRate = pct(childSeen, visits.length);
  const childSpokenAloneRate = pct(childAlone, childAloneApplicable);
  const cancellationRate = pct(cancelled, visits.length);
  const averageDuration = Math.round(totalDuration / visits.length);

  // Scoring: positive outcomes (0-7), child seen (0-5), child spoken alone (0-5),
  // reports provided (0-4), low cancellation bonus (0-4)
  let score = 0;
  score += Math.round((positiveOutcomeRate / 100) * 7);
  score += Math.round((childSeenRate / 100) * 5);
  score += Math.round((childSpokenAloneRate / 100) * 5);
  score += Math.round((reportProvidedRate / 100) * 4);
  // Low cancellation bonus: 4 if 0%, 3 if <10%, 2 if <20%, 1 if <30%, 0 otherwise
  if (cancellationRate === 0) score += 4;
  else if (cancellationRate < 10) score += 3;
  else if (cancellationRate < 20) score += 2;
  else if (cancellationRate < 30) score += 1;

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    totalVisits: visits.length,
    positiveOutcomeRate,
    reportProvidedRate,
    childSeenRate,
    childSpokenAloneRate,
    cancellationRate,
    averageDuration,
    visitorDistribution,
    purposeDistribution,
  };
}

export function evaluatePartnershipEffectiveness(
  assessments: PartnershipAssessment[],
): PartnershipEffectivenessResult {
  if (assessments.length === 0) {
    return {
      overallScore: 0,
      totalAssessments: 0,
      excellentGoodRate: 0,
      informationSharingRate: 0,
      jointPlanningRate: 0,
      responsiveRate: 0,
      attendsReviewsRate: 0,
      childFocusedRate: 0,
      challengeAcceptedRate: 0,
    };
  }

  let excellentGood = 0;
  let infoSharing = 0;
  let jointPlanning = 0;
  let responsive = 0;
  let attendsReviews = 0;
  let childFocused = 0;
  let challengeAccepted = 0;

  for (const a of assessments) {
    if (a.partnershipRating === "excellent" || a.partnershipRating === "good") excellentGood++;
    if (a.informationSharingEffective) infoSharing++;
    if (a.jointPlanningEvident) jointPlanning++;
    if (a.responsiveToRequests) responsive++;
    if (a.attendsReviewMeetings) attendsReviews++;
    if (a.childFocused) childFocused++;
    if (a.challengeAccepted) challengeAccepted++;
  }

  const excellentGoodRate = pct(excellentGood, assessments.length);
  const informationSharingRate = pct(infoSharing, assessments.length);
  const jointPlanningRate = pct(jointPlanning, assessments.length);
  const responsiveRate = pct(responsive, assessments.length);
  const attendsReviewsRate = pct(attendsReviews, assessments.length);
  const childFocusedRate = pct(childFocused, assessments.length);
  const challengeAcceptedRate = pct(challengeAccepted, assessments.length);

  // Scoring: excellent/good rate (0-7), child focused (0-5), info sharing (0-4),
  // responsive (0-4), joint planning (0-3), challenge accepted (0-2)
  let score = 0;
  score += Math.round((excellentGoodRate / 100) * 7);
  score += Math.round((childFocusedRate / 100) * 5);
  score += Math.round((informationSharingRate / 100) * 4);
  score += Math.round((responsiveRate / 100) * 4);
  score += Math.round((jointPlanningRate / 100) * 3);
  score += Math.round((challengeAcceptedRate / 100) * 2);

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    totalAssessments: assessments.length,
    excellentGoodRate,
    informationSharingRate,
    jointPlanningRate,
    responsiveRate,
    attendsReviewsRate,
    childFocusedRate,
    challengeAcceptedRate,
  };
}

export function evaluateReg44Compliance(reg44s: Reg44Visit[]): Reg44ComplianceResult {
  if (reg44s.length === 0) {
    return {
      overallScore: 0,
      totalVisits: 0,
      childInterviewRate: 0,
      reportTimelyRate: 0,
      issueResolutionRate: 0,
      previousRecsReviewedRate: 0,
      overallPositiveRate: 0,
      averageIssuesRaised: 0,
    };
  }

  let totalInterviewed = 0;
  let totalChildrenPool = 0;
  let timely = 0;
  let totalIssues = 0;
  let totalResolved = 0;
  let prevsReviewed = 0;
  let overallPositive = 0;
  let totalIssuesRaised = 0;

  for (const r of reg44s) {
    totalInterviewed += r.childrenInterviewed;
    totalChildrenPool += r.totalChildren;
    if (r.reportTimely) timely++;
    totalIssues += r.issuesRaised;
    totalResolved += r.issuesResolved;
    if (r.previousRecommendationsReviewed) prevsReviewed++;
    if (r.overallPositive) overallPositive++;
    totalIssuesRaised += r.issuesRaised;
  }

  const childInterviewRate = pct(totalInterviewed, totalChildrenPool);
  const reportTimelyRate = pct(timely, reg44s.length);
  const issueResolutionRate = pct(totalResolved, totalIssues);
  const previousRecsReviewedRate = pct(prevsReviewed, reg44s.length);
  const overallPositiveRate = pct(overallPositive, reg44s.length);
  const averageIssuesRaised = Math.round((totalIssuesRaised / reg44s.length) * 10) / 10;

  // Scoring: child interview rate (0-7), report timely (0-5), issue resolution (0-5),
  // previous recs reviewed (0-4), overall positive (0-4)
  let score = 0;
  score += Math.round((childInterviewRate / 100) * 7);
  score += Math.round((reportTimelyRate / 100) * 5);
  score += Math.round((issueResolutionRate / 100) * 5);
  score += Math.round((previousRecsReviewedRate / 100) * 4);
  score += Math.round((overallPositiveRate / 100) * 4);

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    totalVisits: reg44s.length,
    childInterviewRate,
    reportTimelyRate,
    issueResolutionRate,
    previousRecsReviewedRate,
    overallPositiveRate,
    averageIssuesRaised,
  };
}

export function evaluateActionResponse(actions: VisitorAction[]): ActionResponseResult {
  const completionByVisitorType = {} as Record<VisitorType, number>;
  for (const t of [
    "reg44_visitor", "social_worker", "iro", "therapist", "advocate",
    "family_member", "education_professional", "health_professional",
    "ofsted_inspector", "police_liaison",
  ] as VisitorType[]) {
    completionByVisitorType[t] = 0;
  }

  if (actions.length === 0) {
    return {
      overallScore: 0,
      totalActions: 0,
      completedRate: 0,
      overdueCount: 0,
      inProgressCount: 0,
      completionByVisitorType,
    };
  }

  let completed = 0;
  let overdue = 0;
  let inProgress = 0;

  // Count completed per visitor type
  const typeCompletedCounts = new Map<VisitorType, number>();
  const typeTotalCounts = new Map<VisitorType, number>();

  for (const a of actions) {
    if (a.status === "completed") completed++;
    if (a.status === "overdue") overdue++;
    if (a.status === "in_progress") inProgress++;

    typeTotalCounts.set(a.visitorType, (typeTotalCounts.get(a.visitorType) || 0) + 1);
    if (a.status === "completed") {
      typeCompletedCounts.set(a.visitorType, (typeCompletedCounts.get(a.visitorType) || 0) + 1);
    }
  }

  for (const [type, total] of typeTotalCounts) {
    completionByVisitorType[type] = pct(typeCompletedCounts.get(type) || 0, total);
  }

  const completedRate = pct(completed, actions.length);

  // Scoring: completed rate (0-10), low overdue bonus (0-8), in progress bonus (0-7)
  let score = 0;
  score += Math.round((completedRate / 100) * 10);
  // Overdue penalty: 0 overdue = 8, 1 = 5, 2 = 3, 3+ = 0
  if (overdue === 0) score += 8;
  else if (overdue === 1) score += 5;
  else if (overdue === 2) score += 3;
  // In progress bonus: some in progress shows engagement
  const inProgressRate = pct(inProgress, actions.length);
  score += Math.round((inProgressRate / 100) * 7);

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    totalActions: actions.length,
    completedRate,
    overdueCount: overdue,
    inProgressCount: inProgress,
    completionByVisitorType,
  };
}

// ── Child Profiles ─────────────────────────────────────────────────────────

export function buildChildVisitorProfiles(visits: VisitRecord[]): ChildVisitorProfile[] {
  const childVisits = new Map<string, VisitRecord[]>();
  const childNames = new Map<string, string>();

  for (const v of visits) {
    if (!v.childId) continue;
    if (!childVisits.has(v.childId)) childVisits.set(v.childId, []);
    childVisits.get(v.childId)!.push(v);
    childNames.set(v.childId, v.childName || "Unknown");
  }

  return Array.from(childVisits.entries()).map(([childId, cvs]) => {
    const swVisits = cvs.filter((v) => v.visitorType === "social_worker").length;
    const therapistVisits = cvs.filter((v) => v.visitorType === "therapist").length;
    const childSeenRate = pct(cvs.filter((v) => v.childSeen).length, cvs.length);
    const positiveOutcomeRate = pct(
      cvs.filter((v) => v.outcome === "positive" || v.outcome === "constructive").length,
      cvs.length,
    );

    // Score 0-10
    let score = 0;
    score += Math.min(3, Math.round((cvs.length / 5) * 3)); // visit frequency bonus
    score += Math.min(2, swVisits > 0 ? 2 : 0); // SW visits
    score += Math.min(2, therapistVisits > 0 ? 2 : 0); // therapy visits
    score += Math.round((childSeenRate / 100) * 2);
    score += Math.round((positiveOutcomeRate / 100) * 1);

    return {
      childId,
      childName: childNames.get(childId) || "Unknown",
      totalVisits: cvs.length,
      socialWorkerVisits: swVisits,
      therapistVisits,
      childSeenRate,
      positiveOutcomeRate,
      overallScore: Math.min(10, score),
    };
  });
}

// ── Main Function ──────────────────────────────────────────────────────────

export function generateVisitorPartnershipQualityIntelligence(
  visits: VisitRecord[],
  partnerships: PartnershipAssessment[],
  reg44s: Reg44Visit[],
  actions: VisitorAction[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): VisitorPartnershipQualityIntelligence {
  const visitQuality = evaluateVisitQuality(visits);
  const partnershipEffectiveness = evaluatePartnershipEffectiveness(partnerships);
  const reg44Compliance = evaluateReg44Compliance(reg44s);
  const actionResponse = evaluateActionResponse(actions);

  const rawScore =
    visitQuality.overallScore +
    partnershipEffectiveness.overallScore +
    reg44Compliance.overallScore +
    actionResponse.overallScore;

  const overallScore = Math.min(100, Math.max(0, rawScore));
  const rating = getRating(overallScore);

  const childProfiles = buildChildVisitorProfiles(visits);

  // ── Strengths ──
  const strengths: string[] = [];
  if (visitQuality.childSeenRate >= 90)
    strengths.push("Children seen in " + visitQuality.childSeenRate + "% of visits — strong oversight");
  if (visitQuality.childSpokenAloneRate >= 80)
    strengths.push("Children spoken to alone in " + visitQuality.childSpokenAloneRate + "% of applicable visits");
  if (visitQuality.positiveOutcomeRate >= 80)
    strengths.push("High positive outcome rate (" + visitQuality.positiveOutcomeRate + "%) from professional visits");
  if (partnershipEffectiveness.excellentGoodRate >= 80)
    strengths.push("Strong multi-agency partnership working — " + partnershipEffectiveness.excellentGoodRate + "% rated good or excellent");
  if (partnershipEffectiveness.childFocusedRate >= 90)
    strengths.push("Partnerships consistently child-focused");
  if (reg44Compliance.reportTimelyRate === 100)
    strengths.push("All Reg 44 reports submitted on time");
  if (reg44Compliance.issueResolutionRate >= 90)
    strengths.push("Excellent resolution rate for issues raised by Reg 44 visitor (" + reg44Compliance.issueResolutionRate + "%)");
  if (actionResponse.completedRate >= 85)
    strengths.push("Strong action completion rate (" + actionResponse.completedRate + "%) from visitor recommendations");
  if (visitQuality.cancellationRate === 0)
    strengths.push("No visit cancellations or no-shows during the period");

  // ── Areas for Improvement ──
  const areasForImprovement: string[] = [];
  if (visitQuality.childSeenRate < 80)
    areasForImprovement.push("Children not seen in " + (100 - visitQuality.childSeenRate) + "% of visits");
  if (visitQuality.cancellationRate > 10)
    areasForImprovement.push("Visit cancellation rate at " + visitQuality.cancellationRate + "% — investigate barriers");
  if (partnershipEffectiveness.informationSharingRate < 80)
    areasForImprovement.push("Information sharing with partners effective in only " + partnershipEffectiveness.informationSharingRate + "% of assessments");
  if (partnershipEffectiveness.jointPlanningRate < 70)
    areasForImprovement.push("Joint planning evident in only " + partnershipEffectiveness.jointPlanningRate + "% of partnerships");
  if (reg44Compliance.childInterviewRate < 80)
    areasForImprovement.push("Reg 44 visitor child interview rate at " + reg44Compliance.childInterviewRate + "% — children should be routinely spoken to");
  if (actionResponse.overdueCount > 0)
    areasForImprovement.push(actionResponse.overdueCount + " overdue action(s) from visitor recommendations");
  if (visitQuality.reportProvidedRate < 80)
    areasForImprovement.push("Reports provided for only " + visitQuality.reportProvidedRate + "% of visits");
  if (reg44Compliance.issueResolutionRate < 70)
    areasForImprovement.push("Issue resolution rate from Reg 44 visits at " + reg44Compliance.issueResolutionRate + "%");

  // ── Actions ──
  const actions_list: string[] = [];
  if (actionResponse.overdueCount >= 3)
    actions_list.push("URGENT: Address " + actionResponse.overdueCount + " overdue actions from visitor recommendations within 5 working days");
  if (reg44Compliance.totalVisits === 0)
    actions_list.push("URGENT: Ensure Reg 44 visits are being conducted monthly — statutory requirement");
  if (visitQuality.childSeenRate < 60)
    actions_list.push("URGENT: Review visitor protocols — children must be seen and heard during visits");
  if (partnershipEffectiveness.totalAssessments === 0 && visits.length > 0)
    actions_list.push("Complete partnership assessments for key agencies to track multi-agency working quality");
  if (actionResponse.overdueCount > 0 && actionResponse.overdueCount < 3)
    actions_list.push("Complete " + actionResponse.overdueCount + " overdue action(s) from visitor recommendations");
  if (visitQuality.cancellationRate > 15)
    actions_list.push("Develop strategy to reduce visit cancellations — consider booking confirmations and reminders");
  if (reg44Compliance.reportTimelyRate < 100 && reg44Compliance.totalVisits > 0)
    actions_list.push("Chase outstanding Reg 44 reports — required within 5 working days of visit");
  if (partnershipEffectiveness.challengeAcceptedRate < 60)
    actions_list.push("Develop professional challenge culture with partner agencies — improve constructive dialogue");

  const regulatoryLinks: string[] = [
    "CHR 2015, Reg 44 — Independent person: visits and reports to monitor quality of care",
    "CHR 2015, Reg 45 — Review of quality of care: ensuring external scrutiny informs improvement",
    "SCCIF — Leadership and management: effectiveness of partnership working and external oversight",
    "NMS 18 — Monitoring the home: ensuring robust independent monitoring and follow-up",
    "Working Together 2023 — Multi-agency working and information sharing to safeguard children",
    "UNCRC Article 3 — Best interests of the child must be a primary consideration in all actions",
    "CA 1989, s22(3)(a) — Duty to safeguard and promote the welfare of looked-after children",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    visitQuality,
    partnershipEffectiveness,
    reg44Compliance,
    actionResponse,
    childProfiles,
    strengths,
    areasForImprovement,
    actions: actions_list,
    regulatoryLinks,
  };
}
