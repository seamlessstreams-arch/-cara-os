// ==============================================================================
// Complaints & Advocacy Access Intelligence Engine
//
// Pure deterministic engine — no AI, no external calls, no randomness.
// Evaluates how well the home handles complaints and ensures advocacy access:
//   1. Complaints Handling (timeliness, resolution, child satisfaction)
//   2. Advocacy Access (availability, referral, independence)
//   3. Resolution Quality (outcomes, learning, policy changes)
//   4. Staff Awareness (complaints process, advocacy, child rights)
//
// Regulatory: CHR 2015 Reg 39, CHR 2015 Reg 45, SCCIF, UNCRC Article 12,
//             Children Act 1989, NMS 15, Advocacy Services & Representations
//             Procedure (England) Regulations 2004
// ==============================================================================

// -- Type unions ---------------------------------------------------------------

export type ComplaintType =
  | "care_quality"
  | "staff_conduct"
  | "food"
  | "activities"
  | "contact"
  | "privacy"
  | "safety"
  | "property"
  | "discrimination"
  | "other";

export type ComplaintStatus =
  | "open"
  | "investigating"
  | "resolved"
  | "escalated"
  | "withdrawn";

export type ResolutionOutcome =
  | "upheld"
  | "partially_upheld"
  | "not_upheld"
  | "withdrawn"
  | "pending";

export type AdvocacyType =
  | "independent_advocate"
  | "childrens_rights_officer"
  | "irp"
  | "ofsted_direct"
  | "childline"
  | "peer_advocacy";

export type SatisfactionLevel =
  | "very_satisfied"
  | "satisfied"
  | "neutral"
  | "dissatisfied"
  | "very_dissatisfied"
  | "not_recorded";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// -- Label maps ----------------------------------------------------------------

const complaintTypeLabels: Record<ComplaintType, string> = {
  care_quality: "Care Quality",
  staff_conduct: "Staff Conduct",
  food: "Food",
  activities: "Activities",
  contact: "Contact",
  privacy: "Privacy",
  safety: "Safety",
  property: "Property",
  discrimination: "Discrimination",
  other: "Other",
};

const complaintStatusLabels: Record<ComplaintStatus, string> = {
  open: "Open",
  investigating: "Investigating",
  resolved: "Resolved",
  escalated: "Escalated",
  withdrawn: "Withdrawn",
};

const resolutionOutcomeLabels: Record<ResolutionOutcome, string> = {
  upheld: "Upheld",
  partially_upheld: "Partially Upheld",
  not_upheld: "Not Upheld",
  withdrawn: "Withdrawn",
  pending: "Pending",
};

const advocacyTypeLabels: Record<AdvocacyType, string> = {
  independent_advocate: "Independent Advocate",
  childrens_rights_officer: "Children's Rights Officer",
  irp: "Independent Reviewing Panel",
  ofsted_direct: "Ofsted Direct",
  childline: "Childline",
  peer_advocacy: "Peer Advocacy",
};

const satisfactionLevelLabels: Record<SatisfactionLevel, string> = {
  very_satisfied: "Very Satisfied",
  satisfied: "Satisfied",
  neutral: "Neutral",
  dissatisfied: "Dissatisfied",
  very_dissatisfied: "Very Dissatisfied",
  not_recorded: "Not Recorded",
};

const ratingLabels: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

// -- Label getters -------------------------------------------------------------

export function getComplaintTypeLabel(t: ComplaintType): string {
  return complaintTypeLabels[t] ?? t;
}
export function getComplaintStatusLabel(s: ComplaintStatus): string {
  return complaintStatusLabels[s] ?? s;
}
export function getResolutionOutcomeLabel(o: ResolutionOutcome): string {
  return resolutionOutcomeLabels[o] ?? o;
}
export function getAdvocacyTypeLabel(t: AdvocacyType): string {
  return advocacyTypeLabels[t] ?? t;
}
export function getSatisfactionLevelLabel(l: SatisfactionLevel): string {
  return satisfactionLevelLabels[l] ?? l;
}
export function getRatingLabel(r: Rating): string {
  return ratingLabels[r] ?? r;
}

// -- Input interfaces ----------------------------------------------------------

export interface ComplaintRecord {
  id: string;
  childId: string;
  childName: string;
  complaintDate: string;
  complaintType: ComplaintType;
  description: string;
  status: ComplaintStatus;
  resolutionOutcome: ResolutionOutcome;
  resolvedWithinTimescale: boolean;
  daysToResolve: number;
  childSatisfaction: SatisfactionLevel;
  advocacyOffered: boolean;
  advocacyAccepted: boolean;
  learningIdentified: boolean;
  policyChangeRequired: boolean;
}

export interface AdvocacyRecord {
  id: string;
  childId: string;
  childName: string;
  advocacyType: AdvocacyType;
  referralDate: string;
  contactMade: boolean;
  independentFromHome: boolean;
  childInformed: boolean;
  accessWithinTimescale: boolean;
  ongoingSupport: boolean;
}

export interface ComplaintsPolicy {
  id: string;
  policyReviewDate: string;
  policyCurrent: boolean;
  childFriendlyVersion: boolean;
  displayedInHome: boolean;
  advocacyInfoDisplayed: boolean;
  complaintFormAccessible: boolean;
  externalContactsDisplayed: boolean;
  regularlyReviewedWithChildren: boolean;
}

export interface StaffComplaintsTraining {
  id: string;
  staffId: string;
  staffName: string;
  complaintsProcedure: boolean;
  advocacyReferral: boolean;
  childRightsAwareness: boolean;
  conflictResolution: boolean;
  recordKeeping: boolean;
  escalationProcess: boolean;
}

// -- Result interfaces ---------------------------------------------------------

export interface ComplaintsHandlingResult {
  overallScore: number;
  totalComplaints: number;
  resolvedRate: number;
  resolvedWithinTimescaleRate: number;
  advocacyOfferedRate: number;
  satisfactionRate: number;
  averageDaysToResolve: number;
}

export interface AdvocacyAccessResult {
  overallScore: number;
  totalReferrals: number;
  contactMadeRate: number;
  independentRate: number;
  childInformedRate: number;
  timelyAccessRate: number;
  ongoingSupportRate: number;
}

export interface ResolutionQualityResult {
  overallScore: number;
  policyCurrent: boolean;
  childFriendlyVersion: boolean;
  displayedInHome: boolean;
  advocacyInfoDisplayed: boolean;
  formAccessible: boolean;
  externalContacts: boolean;
  reviewedWithChildren: boolean;
}

export interface StaffComplaintsReadinessResult {
  overallScore: number;
  totalStaff: number;
  complaintsProcedureRate: number;
  advocacyReferralRate: number;
  childRightsRate: number;
  conflictResolutionRate: number;
  recordKeepingRate: number;
  escalationRate: number;
}

export interface ChildComplaintsSummary {
  childId: string;
  childName: string;
  totalComplaints: number;
  resolvedCount: number;
  advocacyAccessed: boolean;
  satisfactionPositive: boolean;
  overallScore: number;
}

export interface ComplaintsAdvocacyAccessIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  complaintsHandling: ComplaintsHandlingResult;
  advocacyAccess: AdvocacyAccessResult;
  resolutionQuality: ResolutionQualityResult;
  staffComplaintsReadiness: StaffComplaintsReadinessResult;
  childSummaries: ChildComplaintsSummary[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// -- Helpers -------------------------------------------------------------------

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

// -- Evaluators ----------------------------------------------------------------

/**
 * Evaluates complaints handling quality.
 * Empty (no complaints) = 25 (no complaints = excellent responsive environment).
 *
 *   Resolved rate                       → 0-7
 *   Resolved within timescale rate      → 0-6
 *   Advocacy offered rate               → 0-6
 *   Satisfaction rate (satisfied+)      → 0-6
 */
export function evaluateComplaintsHandling(
  complaints: ComplaintRecord[],
): ComplaintsHandlingResult {
  if (complaints.length === 0) {
    return {
      overallScore: 25,
      totalComplaints: 0,
      resolvedRate: 0,
      resolvedWithinTimescaleRate: 0,
      advocacyOfferedRate: 0,
      satisfactionRate: 0,
      averageDaysToResolve: 0,
    };
  }

  let score = 0;

  const resolved = complaints.filter(
    (c) => c.status === "resolved" || c.status === "withdrawn",
  ).length;
  const resolvedRate = pct(resolved, complaints.length);
  if (resolvedRate >= 90) score += 7;
  else if (resolvedRate >= 70) score += 5;
  else if (resolvedRate >= 50) score += 3;
  else if (resolvedRate > 0) score += 1;

  const timely = complaints.filter(
    (c) => c.resolvedWithinTimescale,
  ).length;
  const resolvedWithinTimescaleRate = pct(timely, complaints.length);
  if (resolvedWithinTimescaleRate >= 90) score += 6;
  else if (resolvedWithinTimescaleRate >= 70) score += 4;
  else if (resolvedWithinTimescaleRate >= 50) score += 3;
  else if (resolvedWithinTimescaleRate > 0) score += 1;

  const advocacyOffered = complaints.filter(
    (c) => c.advocacyOffered,
  ).length;
  const advocacyOfferedRate = pct(advocacyOffered, complaints.length);
  if (advocacyOfferedRate >= 90) score += 6;
  else if (advocacyOfferedRate >= 70) score += 4;
  else if (advocacyOfferedRate >= 50) score += 3;
  else if (advocacyOfferedRate > 0) score += 1;

  const satisfied = complaints.filter(
    (c) =>
      c.childSatisfaction === "very_satisfied" ||
      c.childSatisfaction === "satisfied",
  ).length;
  const satisfactionRate = pct(satisfied, complaints.length);
  if (satisfactionRate >= 80) score += 6;
  else if (satisfactionRate >= 60) score += 4;
  else if (satisfactionRate >= 40) score += 3;
  else if (satisfactionRate > 0) score += 1;

  const totalDays = complaints.reduce(
    (sum, c) => sum + c.daysToResolve,
    0,
  );
  const averageDaysToResolve = Math.round(totalDays / complaints.length);

  return {
    overallScore: Math.min(score, 25),
    totalComplaints: complaints.length,
    resolvedRate,
    resolvedWithinTimescaleRate,
    advocacyOfferedRate,
    satisfactionRate,
    averageDaysToResolve,
  };
}

/**
 * Evaluates advocacy access and provision.
 * Empty = 0 (no advocacy referrals = no evidence of access).
 *
 *   Contact made rate             → 0-7
 *   Independent from home rate    → 0-6
 *   Child informed rate           → 0-6
 *   Timely access rate            → 0-6
 */
export function evaluateAdvocacyAccess(
  records: AdvocacyRecord[],
): AdvocacyAccessResult {
  if (records.length === 0) {
    return {
      overallScore: 0,
      totalReferrals: 0,
      contactMadeRate: 0,
      independentRate: 0,
      childInformedRate: 0,
      timelyAccessRate: 0,
      ongoingSupportRate: 0,
    };
  }

  let score = 0;

  const contactMade = records.filter((r) => r.contactMade).length;
  const contactMadeRate = pct(contactMade, records.length);
  if (contactMadeRate >= 90) score += 7;
  else if (contactMadeRate >= 70) score += 5;
  else if (contactMadeRate >= 50) score += 3;
  else if (contactMadeRate > 0) score += 1;

  const independent = records.filter(
    (r) => r.independentFromHome,
  ).length;
  const independentRate = pct(independent, records.length);
  if (independentRate >= 90) score += 6;
  else if (independentRate >= 70) score += 4;
  else if (independentRate >= 50) score += 3;
  else if (independentRate > 0) score += 1;

  const childInformed = records.filter(
    (r) => r.childInformed,
  ).length;
  const childInformedRate = pct(childInformed, records.length);
  if (childInformedRate >= 90) score += 6;
  else if (childInformedRate >= 70) score += 4;
  else if (childInformedRate >= 50) score += 3;
  else if (childInformedRate > 0) score += 1;

  const timely = records.filter(
    (r) => r.accessWithinTimescale,
  ).length;
  const timelyAccessRate = pct(timely, records.length);
  if (timelyAccessRate >= 90) score += 6;
  else if (timelyAccessRate >= 70) score += 4;
  else if (timelyAccessRate >= 50) score += 3;
  else if (timelyAccessRate > 0) score += 1;

  const ongoing = records.filter((r) => r.ongoingSupport).length;
  const ongoingSupportRate = pct(ongoing, records.length);

  return {
    overallScore: Math.min(score, 25),
    totalReferrals: records.length,
    contactMadeRate,
    independentRate,
    childInformedRate,
    timelyAccessRate,
    ongoingSupportRate,
  };
}

/**
 * Evaluates policy quality and accessibility.
 * Empty = 0 (no policy = no framework for complaints).
 *
 *   Policy current                → 0-5
 *   Child-friendly version        → 0-4
 *   Displayed in home             → 0-4
 *   Advocacy info displayed       → 0-4
 *   Form accessible               → 0-3
 *   External contacts displayed   → 0-3
 *   Reviewed with children        → 0-2
 */
export function evaluateResolutionQuality(
  policies: ComplaintsPolicy[],
): ResolutionQualityResult {
  if (policies.length === 0) {
    return {
      overallScore: 0,
      policyCurrent: false,
      childFriendlyVersion: false,
      displayedInHome: false,
      advocacyInfoDisplayed: false,
      formAccessible: false,
      externalContacts: false,
      reviewedWithChildren: false,
    };
  }

  const latest = policies[policies.length - 1];
  let score = 0;

  if (latest.policyCurrent) score += 5;
  if (latest.childFriendlyVersion) score += 4;
  if (latest.displayedInHome) score += 4;
  if (latest.advocacyInfoDisplayed) score += 4;
  if (latest.complaintFormAccessible) score += 3;
  if (latest.externalContactsDisplayed) score += 3;
  if (latest.regularlyReviewedWithChildren) score += 2;

  return {
    overallScore: Math.min(score, 25),
    policyCurrent: latest.policyCurrent,
    childFriendlyVersion: latest.childFriendlyVersion,
    displayedInHome: latest.displayedInHome,
    advocacyInfoDisplayed: latest.advocacyInfoDisplayed,
    formAccessible: latest.complaintFormAccessible,
    externalContacts: latest.externalContactsDisplayed,
    reviewedWithChildren: latest.regularlyReviewedWithChildren,
  };
}

/**
 * Evaluates staff training on complaints and advocacy.
 * Empty = 0 (no trained staff = no readiness).
 *
 *   Complaints procedure          → 0-6
 *   Advocacy referral             → 0-5
 *   Child rights awareness        → 0-5
 *   Conflict resolution           → 0-4
 *   Record keeping                → 0-3
 *   Escalation process            → 0-2
 */
export function evaluateStaffComplaintsReadiness(
  training: StaffComplaintsTraining[],
): StaffComplaintsReadinessResult {
  if (training.length === 0) {
    return {
      overallScore: 0,
      totalStaff: 0,
      complaintsProcedureRate: 0,
      advocacyReferralRate: 0,
      childRightsRate: 0,
      conflictResolutionRate: 0,
      recordKeepingRate: 0,
      escalationRate: 0,
    };
  }

  let score = 0;

  const procedure = training.filter(
    (t) => t.complaintsProcedure,
  ).length;
  const complaintsProcedureRate = pct(procedure, training.length);
  if (complaintsProcedureRate >= 90) score += 6;
  else if (complaintsProcedureRate >= 70) score += 4;
  else if (complaintsProcedureRate >= 50) score += 3;
  else if (complaintsProcedureRate > 0) score += 1;

  const advocacy = training.filter((t) => t.advocacyReferral).length;
  const advocacyReferralRate = pct(advocacy, training.length);
  if (advocacyReferralRate >= 90) score += 5;
  else if (advocacyReferralRate >= 70) score += 3;
  else if (advocacyReferralRate >= 50) score += 2;
  else if (advocacyReferralRate > 0) score += 1;

  const rights = training.filter(
    (t) => t.childRightsAwareness,
  ).length;
  const childRightsRate = pct(rights, training.length);
  if (childRightsRate >= 90) score += 5;
  else if (childRightsRate >= 70) score += 3;
  else if (childRightsRate >= 50) score += 2;
  else if (childRightsRate > 0) score += 1;

  const conflict = training.filter(
    (t) => t.conflictResolution,
  ).length;
  const conflictResolutionRate = pct(conflict, training.length);
  if (conflictResolutionRate >= 90) score += 4;
  else if (conflictResolutionRate >= 70) score += 3;
  else if (conflictResolutionRate >= 50) score += 2;
  else if (conflictResolutionRate > 0) score += 1;

  const recordKeeping = training.filter(
    (t) => t.recordKeeping,
  ).length;
  const recordKeepingRate = pct(recordKeeping, training.length);
  if (recordKeepingRate >= 90) score += 3;
  else if (recordKeepingRate >= 70) score += 2;
  else if (recordKeepingRate >= 50) score += 1;

  const escalation = training.filter(
    (t) => t.escalationProcess,
  ).length;
  const escalationRate = pct(escalation, training.length);
  if (escalationRate >= 90) score += 2;
  else if (escalationRate >= 70) score += 1;

  return {
    overallScore: Math.min(score, 25),
    totalStaff: training.length,
    complaintsProcedureRate,
    advocacyReferralRate,
    childRightsRate,
    conflictResolutionRate,
    recordKeepingRate,
    escalationRate,
  };
}

// -- Child Summaries -----------------------------------------------------------

export function buildChildComplaintsSummaries(
  complaints: ComplaintRecord[],
  advocacyRecords: AdvocacyRecord[],
): ChildComplaintsSummary[] {
  const childMap = new Map<
    string,
    { childId: string; childName: string; complaints: ComplaintRecord[]; advocacy: AdvocacyRecord[] }
  >();

  for (const c of complaints) {
    if (!childMap.has(c.childId)) {
      childMap.set(c.childId, {
        childId: c.childId,
        childName: c.childName,
        complaints: [],
        advocacy: [],
      });
    }
    childMap.get(c.childId)!.complaints.push(c);
  }

  for (const a of advocacyRecords) {
    if (!childMap.has(a.childId)) {
      childMap.set(a.childId, {
        childId: a.childId,
        childName: a.childName,
        complaints: [],
        advocacy: [],
      });
    }
    childMap.get(a.childId)!.advocacy.push(a);
  }

  return Array.from(childMap.values()).map((entry) => {
    let score = 0;

    const resolved = entry.complaints.filter(
      (c) => c.status === "resolved" || c.status === "withdrawn",
    ).length;

    // No complaints or all resolved (0-3)
    if (entry.complaints.length === 0) {
      score += 3;
    } else if (resolved === entry.complaints.length) {
      score += 3;
    } else if (resolved > 0) {
      score += 1;
    }

    // Advocacy accessed (0-2)
    if (entry.advocacy.length > 0) score += 2;

    // Satisfaction positive (0-3)
    const satisfied = entry.complaints.filter(
      (c) =>
        c.childSatisfaction === "very_satisfied" ||
        c.childSatisfaction === "satisfied",
    ).length;
    if (entry.complaints.length === 0) {
      score += 3;
    } else if (pct(satisfied, entry.complaints.length) >= 80) {
      score += 3;
    } else if (pct(satisfied, entry.complaints.length) >= 50) {
      score += 2;
    } else if (satisfied > 0) {
      score += 1;
    }

    // Advocacy offered (0-2)
    const offered = entry.complaints.filter(
      (c) => c.advocacyOffered,
    ).length;
    if (entry.complaints.length === 0) {
      score += 2;
    } else if (offered === entry.complaints.length) {
      score += 2;
    } else if (offered > 0) {
      score += 1;
    }

    return {
      childId: entry.childId,
      childName: entry.childName,
      totalComplaints: entry.complaints.length,
      resolvedCount: resolved,
      advocacyAccessed: entry.advocacy.length > 0,
      satisfactionPositive:
        entry.complaints.length === 0 ||
        pct(satisfied, entry.complaints.length) >= 50,
      overallScore: Math.min(Math.max(score, 0), 10),
    };
  });
}

// -- Main generator ------------------------------------------------------------

export function generateComplaintsAdvocacyAccessIntelligence(
  complaints: ComplaintRecord[],
  advocacyRecords: AdvocacyRecord[],
  policies: ComplaintsPolicy[],
  training: StaffComplaintsTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): ComplaintsAdvocacyAccessIntelligence {
  const complaintsHandling = evaluateComplaintsHandling(complaints);
  const advocacyAccess = evaluateAdvocacyAccess(advocacyRecords);
  const resolutionQuality = evaluateResolutionQuality(policies);
  const staffComplaintsReadiness =
    evaluateStaffComplaintsReadiness(training);

  const rawScore =
    complaintsHandling.overallScore +
    advocacyAccess.overallScore +
    resolutionQuality.overallScore +
    staffComplaintsReadiness.overallScore;
  const overallScore = Math.min(rawScore, 100);
  const rating = getRating(overallScore);

  const childSummaries = buildChildComplaintsSummaries(
    complaints,
    advocacyRecords,
  );

  // -- Strengths ---------------------------------------------------------------
  const strengths: string[] = [];

  if (complaintsHandling.totalComplaints === 0) {
    strengths.push(
      "No complaints received during the assessment period — positive care environment",
    );
  }
  if (
    complaintsHandling.resolvedRate >= 90 &&
    complaints.length > 0
  ) {
    strengths.push(
      "Complaints consistently resolved to a high standard",
    );
  }
  if (
    complaintsHandling.advocacyOfferedRate >= 90 &&
    complaints.length > 0
  ) {
    strengths.push(
      "Advocacy consistently offered to all children making complaints",
    );
  }
  if (
    advocacyAccess.contactMadeRate >= 90 &&
    advocacyRecords.length > 0
  ) {
    strengths.push(
      "Strong advocacy contact rate — children accessing independent support",
    );
  }
  if (resolutionQuality.policyCurrent && policies.length > 0) {
    strengths.push(
      "Complaints policy current and comprehensive",
    );
  }
  if (
    resolutionQuality.childFriendlyVersion &&
    policies.length > 0
  ) {
    strengths.push(
      "Child-friendly version of complaints policy available",
    );
  }
  if (
    staffComplaintsReadiness.complaintsProcedureRate >= 90 &&
    training.length > 0
  ) {
    strengths.push(
      "Staff team fully trained in complaints procedures",
    );
  }
  if (
    complaintsHandling.satisfactionRate >= 80 &&
    complaints.length > 0
  ) {
    strengths.push(
      "High levels of child satisfaction with complaint resolution",
    );
  }

  // -- Areas for improvement ---------------------------------------------------
  const areasForImprovement: string[] = [];

  if (
    complaintsHandling.resolvedWithinTimescaleRate < 70 &&
    complaints.length > 0
  ) {
    areasForImprovement.push(
      "Complaint resolution timescales not consistently met",
    );
  }
  if (
    complaintsHandling.advocacyOfferedRate < 70 &&
    complaints.length > 0
  ) {
    areasForImprovement.push(
      "Advocacy not consistently offered when complaints are made",
    );
  }
  if (
    advocacyAccess.independentRate < 70 &&
    advocacyRecords.length > 0
  ) {
    areasForImprovement.push(
      "Advocacy provision not consistently independent from the home",
    );
  }
  if (
    !resolutionQuality.reviewedWithChildren &&
    policies.length > 0
  ) {
    areasForImprovement.push(
      "Complaints policy not regularly reviewed with children",
    );
  }
  if (
    staffComplaintsReadiness.childRightsRate < 70 &&
    training.length > 0
  ) {
    areasForImprovement.push(
      "Staff awareness of children's rights needs strengthening",
    );
  }
  if (
    complaintsHandling.satisfactionRate < 50 &&
    complaints.length > 0
  ) {
    areasForImprovement.push(
      "Child satisfaction with complaint outcomes below expected standard",
    );
  }

  // -- Actions -----------------------------------------------------------------
  const actions: string[] = [];

  if (policies.length === 0) {
    actions.push(
      "URGENT: No complaints policy in place — develop and implement immediately",
    );
  }
  if (training.length === 0) {
    actions.push(
      "URGENT: No staff complaints training records — deliver comprehensive training",
    );
  }
  if (advocacyRecords.length === 0 && complaints.length > 0) {
    actions.push(
      "URGENT: No advocacy referrals despite complaints — ensure advocacy access for all children",
    );
  }
  if (
    complaintsHandling.resolvedRate < 50 &&
    complaints.length > 0
  ) {
    actions.push(
      "URGENT: Low complaint resolution rate — review and address outstanding complaints immediately",
    );
  }
  const escalated = complaints.filter(
    (c) => c.status === "escalated",
  );
  if (escalated.length > 0) {
    actions.push(
      `${escalated.length} complaint(s) escalated — ensure senior management oversight and timely resolution`,
    );
  }
  if (
    !resolutionQuality.displayedInHome &&
    policies.length > 0
  ) {
    actions.push(
      "Display complaints information prominently within the home",
    );
  }
  if (
    !resolutionQuality.advocacyInfoDisplayed &&
    policies.length > 0
  ) {
    actions.push(
      "Display advocacy contact information where children can access it independently",
    );
  }

  // -- Regulatory links --------------------------------------------------------
  const regulatoryLinks: string[] = [
    "CHR 2015 Reg 39 — Complaints and representations",
    "CHR 2015 Reg 45 — Review of quality of care",
    "SCCIF — Social Care Common Inspection Framework (children's voice)",
    "UNCRC Article 12 — Right of the child to be heard",
    "Children Act 1989 — Representations procedure",
    "NMS 15 — National Minimum Standards (complaints and advocacy)",
    "Advocacy Services & Representations Procedure (England) Regulations 2004",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    complaintsHandling,
    advocacyAccess,
    resolutionQuality,
    staffComplaintsReadiness,
    childSummaries,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
