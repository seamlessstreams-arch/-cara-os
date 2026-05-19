// ==============================================================================
// Cornerstone Family Contact Quality Intelligence Engine
//
// Evaluates how well a children's residential home supports and manages family
// contact for looked-after children, including visit quality, phone contact,
// letterbox contact, and contact plan adherence.
//
// Regulatory basis:
//   CHR 2015 Reg 10 — contact between child and parents, relatives, friends
//   CHR 2015 Reg 12 — the duty to promote the child's welfare
//   SCCIF — experiences and progress of children, including family contact
//   Children Act 1989 s34 — contact with children in care
//   Care Planning Regulations 2010 — care plans including contact arrangements
//   NMS 9 — contact and access to family and friends
//   UNCRC Article 9 — right to maintain contact with both parents
//
// Pure deterministic engine — no AI, no external calls, no randomness, no Date.now().
// ==============================================================================

// -- Type Unions ---------------------------------------------------------------

export type ContactType =
  | "face_to_face"
  | "phone_call"
  | "video_call"
  | "letterbox"
  | "supervised_visit"
  | "unsupervised_visit"
  | "activity_based"
  | "family_event";

export type ContactOutcome =
  | "very_positive"
  | "positive"
  | "neutral"
  | "difficult"
  | "did_not_happen";

export type ContactPerson =
  | "parent_mother"
  | "parent_father"
  | "sibling"
  | "grandparent"
  | "extended_family"
  | "other_significant";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// -- Label Maps ----------------------------------------------------------------

const CONTACT_TYPE_LABELS: Record<ContactType, string> = {
  face_to_face: "Face to Face",
  phone_call: "Phone Call",
  video_call: "Video Call",
  letterbox: "Letterbox",
  supervised_visit: "Supervised Visit",
  unsupervised_visit: "Unsupervised Visit",
  activity_based: "Activity Based",
  family_event: "Family Event",
};

const CONTACT_OUTCOME_LABELS: Record<ContactOutcome, string> = {
  very_positive: "Very Positive",
  positive: "Positive",
  neutral: "Neutral",
  difficult: "Difficult",
  did_not_happen: "Did Not Happen",
};

const CONTACT_PERSON_LABELS: Record<ContactPerson, string> = {
  parent_mother: "Mother",
  parent_father: "Father",
  sibling: "Sibling",
  grandparent: "Grandparent",
  extended_family: "Extended Family",
  other_significant: "Other Significant Person",
};

const RATING_LABELS: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

// -- Label Getters -------------------------------------------------------------

export function getContactTypeLabel(t: ContactType): string {
  return CONTACT_TYPE_LABELS[t] ?? t;
}

export function getContactOutcomeLabel(o: ContactOutcome): string {
  return CONTACT_OUTCOME_LABELS[o] ?? o;
}

export function getContactPersonLabel(p: ContactPerson): string {
  return CONTACT_PERSON_LABELS[p] ?? p;
}

export function getRatingLabel(r: Rating): string {
  return RATING_LABELS[r] ?? r;
}

// -- Input Interfaces ----------------------------------------------------------

export interface FamilyContact {
  id: string;
  childId: string;
  childName: string;
  contactDate: string;
  contactType: ContactType;
  contactPerson: ContactPerson;
  contactOutcome: ContactOutcome;
  childPrepared: boolean;
  childViewsRecorded: boolean;
  supervisedAppropriately: boolean;
  recordedInCasefile: boolean;
  contactPlanFollowed: boolean;
  childSatisfied: boolean;
}

export interface ContactPolicy {
  id: string;
  contactPlanForEachChild: boolean;
  familyEngagementStrategy: boolean;
  supervisedContactGuidance: boolean;
  letterboxProcess: boolean;
  complaintsMechanism: boolean;
  culturalConsideration: boolean;
  regularReview: boolean;
}

export interface StaffContactTraining {
  id: string;
  staffId: string;
  staffName: string;
  familyEngagement: boolean;
  contactSupervision: boolean;
  childPreparation: boolean;
  conflictManagement: boolean;
  recordKeeping: boolean;
  culturalAwareness: boolean;
}

// -- Result Types --------------------------------------------------------------

export interface ContactQualityResult {
  score: number;
  positiveOutcomeRate: number;
  childPreparedRate: number;
  childViewsRecordedRate: number;
  satisfactionPlanRate: number;
}

export interface ContactConsistencyResult {
  score: number;
  recordedRate: number;
  planAdherenceRate: number;
  supervisedAppropriatelyRate: number;
}

export interface ContactPolicyResult {
  score: number;
  contactPlanForEachChild: boolean;
  familyEngagementStrategy: boolean;
  supervisedContactGuidance: boolean;
  letterboxProcess: boolean;
  complaintsMechanism: boolean;
  culturalConsideration: boolean;
  regularReview: boolean;
}

export interface StaffContactReadinessResult {
  score: number;
  totalStaff: number;
  familyEngagementRate: number;
  contactSupervisionRate: number;
  childPreparationRate: number;
  conflictManagementRate: number;
  recordKeepingRate: number;
  culturalAwarenessRate: number;
}

export interface ChildContactProfile {
  childId: string;
  childName: string;
  totalContacts: number;
  positiveRate: number;
  preparedRate: number;
  viewsRecordedRate: number;
  satisfiedRate: number;
  score: number; // 0-10
}

export interface FamilyContactQualityIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  contactQuality: ContactQualityResult;
  contactConsistency: ContactConsistencyResult;
  contactPolicy: ContactPolicyResult;
  staffContactReadiness: StaffContactReadinessResult;
  childProfiles: ChildContactProfile[];
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
 * Evaluator 1: Contact Quality (0-25, capped)
 *
 * Positive outcome rate (very_positive + positive) -> 0-7
 * Child prepared rate -> 0-6
 * Child views recorded rate -> 0-6
 * Combined satisfaction + plan followed rate -> 0-6
 */
export function evaluateContactQuality(contacts: FamilyContact[]): ContactQualityResult {
  if (contacts.length === 0) {
    return {
      score: 0,
      positiveOutcomeRate: 0,
      childPreparedRate: 0,
      childViewsRecordedRate: 0,
      satisfactionPlanRate: 0,
    };
  }

  const total = contacts.length;

  // Positive outcome rate
  const positiveCount = contacts.filter(
    (c) => c.contactOutcome === "very_positive" || c.contactOutcome === "positive",
  ).length;
  const positiveOutcomeRate = pct(positiveCount, total);

  // Child prepared rate
  const preparedCount = contacts.filter((c) => c.childPrepared).length;
  const childPreparedRate = pct(preparedCount, total);

  // Child views recorded rate
  const viewsCount = contacts.filter((c) => c.childViewsRecorded).length;
  const childViewsRecordedRate = pct(viewsCount, total);

  // Combined satisfaction + plan followed
  const satisfiedAndPlanCount = contacts.filter(
    (c) => c.childSatisfied && c.contactPlanFollowed,
  ).length;
  const satisfactionPlanRate = pct(satisfiedAndPlanCount, total);

  // Scoring
  let score = 0;

  // Positive outcome rate -> 0-7
  if (positiveOutcomeRate >= 90) score += 7;
  else if (positiveOutcomeRate >= 75) score += 5;
  else if (positiveOutcomeRate >= 60) score += 3;
  else if (positiveOutcomeRate >= 40) score += 1;

  // Child prepared -> 0-6
  if (childPreparedRate >= 90) score += 6;
  else if (childPreparedRate >= 75) score += 4;
  else if (childPreparedRate >= 50) score += 2;

  // Child views recorded -> 0-6
  if (childViewsRecordedRate >= 90) score += 6;
  else if (childViewsRecordedRate >= 75) score += 4;
  else if (childViewsRecordedRate >= 50) score += 2;

  // Combined satisfaction + plan followed -> 0-6
  if (satisfactionPlanRate >= 90) score += 6;
  else if (satisfactionPlanRate >= 75) score += 4;
  else if (satisfactionPlanRate >= 50) score += 2;

  return {
    score: Math.min(score, 25),
    positiveOutcomeRate,
    childPreparedRate,
    childViewsRecordedRate,
    satisfactionPlanRate,
  };
}

/**
 * Evaluator 2: Contact Consistency (0-25, capped)
 *
 * Recorded in casefile rate -> 0-8
 * Plan adherence rate (contactPlanFollowed) -> 0-9
 * Supervised appropriately rate -> 0-8
 */
export function evaluateContactConsistency(contacts: FamilyContact[]): ContactConsistencyResult {
  if (contacts.length === 0) {
    return {
      score: 0,
      recordedRate: 0,
      planAdherenceRate: 0,
      supervisedAppropriatelyRate: 0,
    };
  }

  const total = contacts.length;

  // Recorded rate
  const recordedCount = contacts.filter((c) => c.recordedInCasefile).length;
  const recordedRate = pct(recordedCount, total);

  // Plan adherence rate
  const planCount = contacts.filter((c) => c.contactPlanFollowed).length;
  const planAdherenceRate = pct(planCount, total);

  // Supervised appropriately rate
  const supervisedCount = contacts.filter((c) => c.supervisedAppropriately).length;
  const supervisedAppropriatelyRate = pct(supervisedCount, total);

  // Scoring
  let score = 0;

  // Recorded rate -> 0-8
  if (recordedRate >= 95) score += 8;
  else if (recordedRate >= 85) score += 6;
  else if (recordedRate >= 70) score += 4;
  else if (recordedRate >= 50) score += 2;

  // Plan adherence -> 0-9
  if (planAdherenceRate >= 95) score += 9;
  else if (planAdherenceRate >= 80) score += 7;
  else if (planAdherenceRate >= 65) score += 4;
  else if (planAdherenceRate >= 40) score += 2;

  // Supervised appropriately -> 0-8
  if (supervisedAppropriatelyRate >= 95) score += 8;
  else if (supervisedAppropriatelyRate >= 80) score += 6;
  else if (supervisedAppropriatelyRate >= 65) score += 4;
  else if (supervisedAppropriatelyRate >= 40) score += 2;

  return {
    score: Math.min(score, 25),
    recordedRate,
    planAdherenceRate,
    supervisedAppropriatelyRate,
  };
}

/**
 * Evaluator 3: Contact Policy (0-25, capped)
 *
 * Null policy = 0
 * 7 booleans: 4 + 4 + 4 + 4 + 3 + 3 + 3 = 25
 */
export function evaluateContactPolicy(policy: ContactPolicy | null): ContactPolicyResult {
  if (!policy) {
    return {
      score: 0,
      contactPlanForEachChild: false,
      familyEngagementStrategy: false,
      supervisedContactGuidance: false,
      letterboxProcess: false,
      complaintsMechanism: false,
      culturalConsideration: false,
      regularReview: false,
    };
  }

  let score = 0;

  if (policy.contactPlanForEachChild) score += 4;
  if (policy.familyEngagementStrategy) score += 4;
  if (policy.supervisedContactGuidance) score += 4;
  if (policy.letterboxProcess) score += 4;
  if (policy.complaintsMechanism) score += 3;
  if (policy.culturalConsideration) score += 3;
  if (policy.regularReview) score += 3;

  return {
    score: Math.min(score, 25),
    contactPlanForEachChild: policy.contactPlanForEachChild,
    familyEngagementStrategy: policy.familyEngagementStrategy,
    supervisedContactGuidance: policy.supervisedContactGuidance,
    letterboxProcess: policy.letterboxProcess,
    complaintsMechanism: policy.complaintsMechanism,
    culturalConsideration: policy.culturalConsideration,
    regularReview: policy.regularReview,
  };
}

/**
 * Evaluator 4: Staff Contact Readiness (0-25, capped)
 *
 * Empty = 0
 * 6 weighted booleans (per-staff rate): 6 + 5 + 5 + 4 + 3 + 2 = 25
 */
export function evaluateStaffContactReadiness(
  training: StaffContactTraining[],
): StaffContactReadinessResult {
  if (training.length === 0) {
    return {
      score: 0,
      totalStaff: 0,
      familyEngagementRate: 0,
      contactSupervisionRate: 0,
      childPreparationRate: 0,
      conflictManagementRate: 0,
      recordKeepingRate: 0,
      culturalAwarenessRate: 0,
    };
  }

  const total = training.length;

  const familyEngagementCount = training.filter((t) => t.familyEngagement).length;
  const familyEngagementRate = pct(familyEngagementCount, total);

  const contactSupervisionCount = training.filter((t) => t.contactSupervision).length;
  const contactSupervisionRate = pct(contactSupervisionCount, total);

  const childPreparationCount = training.filter((t) => t.childPreparation).length;
  const childPreparationRate = pct(childPreparationCount, total);

  const conflictManagementCount = training.filter((t) => t.conflictManagement).length;
  const conflictManagementRate = pct(conflictManagementCount, total);

  const recordKeepingCount = training.filter((t) => t.recordKeeping).length;
  const recordKeepingRate = pct(recordKeepingCount, total);

  const culturalAwarenessCount = training.filter((t) => t.culturalAwareness).length;
  const culturalAwarenessRate = pct(culturalAwarenessCount, total);

  // Scoring: weighted rates -> points
  let score = 0;
  score += (familyEngagementRate / 100) * 6;
  score += (contactSupervisionRate / 100) * 5;
  score += (childPreparationRate / 100) * 5;
  score += (conflictManagementRate / 100) * 4;
  score += (recordKeepingRate / 100) * 3;
  score += (culturalAwarenessRate / 100) * 2;

  score = Math.round(score * 10) / 10;

  return {
    score: Math.min(score, 25),
    totalStaff: total,
    familyEngagementRate,
    contactSupervisionRate,
    childPreparationRate,
    conflictManagementRate,
    recordKeepingRate,
    culturalAwarenessRate,
  };
}

// -- Child Contact Profiles ----------------------------------------------------

export function buildChildContactProfiles(
  contacts: FamilyContact[],
): ChildContactProfile[] {
  const childIds = new Set<string>();
  contacts.forEach((c) => childIds.add(c.childId));

  return Array.from(childIds).map((childId) => {
    const childContacts = contacts.filter((c) => c.childId === childId);
    const childName = childContacts[0]?.childName ?? childId;
    const total = childContacts.length;

    const positiveCount = childContacts.filter(
      (c) => c.contactOutcome === "very_positive" || c.contactOutcome === "positive",
    ).length;
    const positiveRate = pct(positiveCount, total);

    const preparedCount = childContacts.filter((c) => c.childPrepared).length;
    const preparedRate = pct(preparedCount, total);

    const viewsCount = childContacts.filter((c) => c.childViewsRecorded).length;
    const viewsRecordedRate = pct(viewsCount, total);

    const satisfiedCount = childContacts.filter((c) => c.childSatisfied).length;
    const satisfiedRate = pct(satisfiedCount, total);

    // Score 0-10
    let score = 0;

    // Positive outcome rate -> 0-3
    if (positiveRate >= 80) score += 3;
    else if (positiveRate >= 60) score += 2;
    else if (positiveRate >= 40) score += 1;

    // Prepared rate -> 0-2
    if (preparedRate >= 80) score += 2;
    else if (preparedRate >= 50) score += 1;

    // Views recorded -> 0-2
    if (viewsRecordedRate >= 80) score += 2;
    else if (viewsRecordedRate >= 50) score += 1;

    // Satisfied rate -> 0-3
    if (satisfiedRate >= 80) score += 3;
    else if (satisfiedRate >= 60) score += 2;
    else if (satisfiedRate >= 40) score += 1;

    return {
      childId,
      childName,
      totalContacts: total,
      positiveRate,
      preparedRate,
      viewsRecordedRate,
      satisfiedRate,
      score: Math.min(Math.max(score, 0), 10),
    };
  });
}

// -- Strengths / Areas / Actions -----------------------------------------------

function generateStrengths(
  cq: ContactQualityResult,
  cc: ContactConsistencyResult,
  cp: ContactPolicyResult,
  sr: StaffContactReadinessResult,
  contacts: FamilyContact[],
): string[] {
  const strengths: string[] = [];

  if (cq.positiveOutcomeRate >= 80 && contacts.length > 0) {
    strengths.push(
      "High proportion of family contacts have positive outcomes for children",
    );
  }
  if (cq.childPreparedRate >= 90 && contacts.length > 0) {
    strengths.push(
      "Children are consistently well-prepared before family contact sessions",
    );
  }
  if (cq.childViewsRecordedRate >= 90 && contacts.length > 0) {
    strengths.push(
      "Child views are routinely recorded for family contact — strong UNCRC Article 9 compliance",
    );
  }
  if (cq.satisfactionPlanRate >= 80 && contacts.length > 0) {
    strengths.push(
      "High child satisfaction with contact arrangements and strong plan adherence",
    );
  }
  if (cc.recordedRate >= 95 && contacts.length > 0) {
    strengths.push(
      "Excellent contact recording — nearly all contacts recorded in casefiles",
    );
  }
  if (cc.planAdherenceRate >= 90 && contacts.length > 0) {
    strengths.push(
      "Contact plans consistently followed — maintaining reliable family relationships",
    );
  }
  if (cc.supervisedAppropriatelyRate >= 90 && contacts.length > 0) {
    strengths.push(
      "Supervision arrangements are appropriate and consistently applied",
    );
  }
  if (cp.score >= 22) {
    strengths.push(
      "Comprehensive contact policy covering all key areas including cultural consideration",
    );
  }
  if (sr.familyEngagementRate >= 90 && sr.totalStaff > 0) {
    strengths.push(
      "Staff are well-trained in family engagement — supporting quality contact",
    );
  }
  if (sr.culturalAwarenessRate >= 80 && sr.totalStaff > 0) {
    strengths.push(
      "Good cultural awareness among staff supporting family contact",
    );
  }

  return strengths;
}

function generateAreasForImprovement(
  cq: ContactQualityResult,
  cc: ContactConsistencyResult,
  cp: ContactPolicyResult,
  sr: StaffContactReadinessResult,
  contacts: FamilyContact[],
): string[] {
  const areas: string[] = [];

  if (contacts.length === 0) {
    areas.push(
      "No family contact records found — contact recording needs urgent attention",
    );
  }
  if (cq.positiveOutcomeRate < 60 && contacts.length > 0) {
    areas.push(
      `Only ${cq.positiveOutcomeRate}% of contacts have positive outcomes — review contact support arrangements`,
    );
  }
  if (cq.childPreparedRate < 75 && contacts.length > 0) {
    areas.push(
      `Children prepared for contact in only ${cq.childPreparedRate}% of cases — preparation reduces distress`,
    );
  }
  if (cq.childViewsRecordedRate < 75 && contacts.length > 0) {
    areas.push(
      `Child views recorded in only ${cq.childViewsRecordedRate}% of contacts — UNCRC Article 9 requires this`,
    );
  }
  if (cc.recordedRate < 85 && contacts.length > 0) {
    areas.push(
      `Contact recording at ${cc.recordedRate}% — all contacts must be recorded per CHR 2015 Reg 10`,
    );
  }
  if (cc.planAdherenceRate < 80 && contacts.length > 0) {
    areas.push(
      `Contact plan adherence at ${cc.planAdherenceRate}% — plans must be followed as per Care Planning Regulations`,
    );
  }
  if (cc.supervisedAppropriatelyRate < 80 && contacts.length > 0) {
    areas.push(
      `Supervision appropriateness at ${cc.supervisedAppropriatelyRate}% — supervision levels need review`,
    );
  }
  if (cp.score < 15) {
    areas.push(
      "Contact policy has significant gaps — review against CHR 2015 Reg 10 requirements",
    );
  }
  if (!cp.culturalConsideration) {
    areas.push(
      "No cultural consideration in contact policy — cultural identity must be promoted",
    );
  }
  if (sr.totalStaff > 0 && sr.familyEngagementRate < 70) {
    areas.push(
      `Only ${sr.familyEngagementRate}% of staff trained in family engagement — training gap identified`,
    );
  }
  if (sr.totalStaff > 0 && sr.conflictManagementRate < 60) {
    areas.push(
      `Conflict management training at ${sr.conflictManagementRate}% — staff need support managing difficult contacts`,
    );
  }

  return areas;
}

function generateActions(
  cq: ContactQualityResult,
  cc: ContactConsistencyResult,
  cp: ContactPolicyResult,
  sr: StaffContactReadinessResult,
  contacts: FamilyContact[],
): string[] {
  const actions: string[] = [];

  if (contacts.length === 0) {
    actions.push(
      "URGENT: Establish family contact recording system — CHR 2015 Reg 10 requires promotion and monitoring of contact",
    );
  }
  if (cq.childViewsRecordedRate < 75 && contacts.length > 0) {
    actions.push(
      "Implement routine child-voice capture before and after every contact session",
    );
  }
  if (cq.childPreparedRate < 75 && contacts.length > 0) {
    actions.push(
      "Develop age-appropriate contact preparation protocol to reduce child anxiety",
    );
  }
  if (cc.recordedRate < 85 && contacts.length > 0) {
    actions.push(
      "Audit and strengthen contact recording procedures — every contact must be on file",
    );
  }
  if (cc.planAdherenceRate < 80 && contacts.length > 0) {
    actions.push(
      "Review contact plan adherence — identify and address barriers to following plans",
    );
  }
  if (cp.score === 0) {
    actions.push(
      "URGENT: Develop a comprehensive family contact policy covering all regulatory requirements",
    );
  }
  if (!cp.contactPlanForEachChild && cp.score > 0) {
    actions.push(
      "Ensure every child has an individual contact plan as required by Care Planning Regulations 2010",
    );
  }
  if (!cp.culturalConsideration && cp.score > 0) {
    actions.push(
      "Add cultural consideration to contact policy — children must maintain cultural and identity links",
    );
  }
  if (sr.totalStaff === 0) {
    actions.push(
      "URGENT: Implement staff training programme for family contact support",
    );
  }
  if (sr.totalStaff > 0 && sr.familyEngagementRate < 70) {
    actions.push(
      "Prioritise family engagement training for all staff — key to quality contact",
    );
  }
  if (sr.totalStaff > 0 && sr.childPreparationRate < 70) {
    actions.push(
      "Train staff in child preparation techniques for family contact",
    );
  }
  if (sr.totalStaff > 0 && sr.conflictManagementRate < 60) {
    actions.push(
      "Deliver conflict management training to support staff during difficult contacts",
    );
  }

  return actions;
}

// -- Main Function -------------------------------------------------------------

export function generateFamilyContactQualityIntelligence(
  contacts: FamilyContact[],
  policy: ContactPolicy | null,
  training: StaffContactTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): FamilyContactQualityIntelligence {
  const contactQuality = evaluateContactQuality(contacts);
  const contactConsistency = evaluateContactConsistency(contacts);
  const contactPolicy = evaluateContactPolicy(policy);
  const staffContactReadiness = evaluateStaffContactReadiness(training);

  const overallScore = Math.min(
    contactQuality.score +
      contactConsistency.score +
      contactPolicy.score +
      staffContactReadiness.score,
    100,
  );

  const childProfiles = buildChildContactProfiles(contacts);
  const strengths = generateStrengths(
    contactQuality, contactConsistency, contactPolicy, staffContactReadiness, contacts,
  );
  const areasForImprovement = generateAreasForImprovement(
    contactQuality, contactConsistency, contactPolicy, staffContactReadiness, contacts,
  );
  const actions = generateActions(
    contactQuality, contactConsistency, contactPolicy, staffContactReadiness, contacts,
  );

  const regulatoryLinks = [
    "CHR 2015 Reg 10 — contact between child and parents, relatives, friends",
    "CHR 2015 Reg 12 — the duty to promote the child's welfare",
    "SCCIF — experiences and progress of children, quality of family contact",
    "Children Act 1989 s34 — contact with children in care",
    "Care Planning Regulations 2010 — care plans including contact arrangements",
    "NMS 9 — contact and access to family and friends",
    "UNCRC Article 9 — right to maintain contact with both parents",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating: getRating(overallScore),
    contactQuality,
    contactConsistency,
    contactPolicy,
    staffContactReadiness,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
