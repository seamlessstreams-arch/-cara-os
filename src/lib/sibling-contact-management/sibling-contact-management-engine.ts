// ==============================================================================
// Sibling Contact Management Intelligence Engine
//
// Pure deterministic engine — no AI, no external calls, no randomness.
// Evaluates how well the home maintains sibling relationships:
//   1. Contact Quality (frequency, duration, warmth, child satisfaction)
//   2. Planning & Documentation (sibling assessment, contact plans, reviews)
//   3. Barrier Management (identifying and resolving obstacles to contact)
//   4. Staff Readiness (training, facilitation skills, regulatory knowledge)
//
// Regulatory: CHR 2015 Reg 10, CHR 2015 Reg 12, SCCIF, Children Act 1989
//             s34, NMS 3, Care Planning Regulations 2010, UNCRC Article 8
// ==============================================================================

// -- Type unions ---------------------------------------------------------------

export type ContactType =
  | "face_to_face"
  | "video_call"
  | "phone_call"
  | "letter_email"
  | "shared_activity"
  | "overnight_stay"
  | "supervised_visit"
  | "other";

export type ContactOutcome =
  | "very_positive"
  | "positive"
  | "mixed"
  | "difficult"
  | "did_not_happen";

export type BarrierType =
  | "distance"
  | "court_order"
  | "safeguarding_concern"
  | "placement_policy"
  | "child_refusal"
  | "sibling_refusal"
  | "scheduling_conflict"
  | "transport"
  | "other";

export type BarrierStatus =
  | "resolved"
  | "in_progress"
  | "unresolved"
  | "not_applicable";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// -- Label maps ----------------------------------------------------------------

const contactTypeLabels: Record<ContactType, string> = {
  face_to_face: "Face to Face",
  video_call: "Video Call",
  phone_call: "Phone Call",
  letter_email: "Letter / Email",
  shared_activity: "Shared Activity",
  overnight_stay: "Overnight Stay",
  supervised_visit: "Supervised Visit",
  other: "Other",
};

const contactOutcomeLabels: Record<ContactOutcome, string> = {
  very_positive: "Very Positive",
  positive: "Positive",
  mixed: "Mixed",
  difficult: "Difficult",
  did_not_happen: "Did Not Happen",
};

const barrierTypeLabels: Record<BarrierType, string> = {
  distance: "Distance",
  court_order: "Court Order",
  safeguarding_concern: "Safeguarding Concern",
  placement_policy: "Placement Policy",
  child_refusal: "Child Refusal",
  sibling_refusal: "Sibling Refusal",
  scheduling_conflict: "Scheduling Conflict",
  transport: "Transport",
  other: "Other",
};

const barrierStatusLabels: Record<BarrierStatus, string> = {
  resolved: "Resolved",
  in_progress: "In Progress",
  unresolved: "Unresolved",
  not_applicable: "Not Applicable",
};

const ratingLabels: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

// -- Label getters -------------------------------------------------------------

export function getContactTypeLabel(t: ContactType): string {
  return contactTypeLabels[t] ?? t;
}
export function getContactOutcomeLabel(o: ContactOutcome): string {
  return contactOutcomeLabels[o] ?? o;
}
export function getBarrierTypeLabel(b: BarrierType): string {
  return barrierTypeLabels[b] ?? b;
}
export function getBarrierStatusLabel(s: BarrierStatus): string {
  return barrierStatusLabels[s] ?? s;
}
export function getRatingLabel(r: Rating): string {
  return ratingLabels[r] ?? r;
}

// -- Input interfaces ----------------------------------------------------------

export interface SiblingContact {
  id: string;
  childId: string;
  childName: string;
  siblingId: string;
  siblingName: string;
  contactDate: string;
  contactType: ContactType;
  contactOutcome: ContactOutcome;
  durationMinutes: number;
  facilitatedBy: string;
  childSatisfied: boolean;
  recordedInCasefile: boolean;
}

export interface SiblingAssessment {
  id: string;
  childId: string;
  childName: string;
  assessmentDate: string;
  assessedBy: string;
  siblingRelationshipMapped: boolean;
  contactPlanInPlace: boolean;
  childViewsSought: boolean;
  siblingViewsSought: boolean;
  reviewScheduled: boolean;
  socialWorkerConsulted: boolean;
}

export interface ContactBarrier {
  id: string;
  childId: string;
  childName: string;
  siblingName: string;
  barrierType: BarrierType;
  barrierStatus: BarrierStatus;
  identifiedDate: string;
  actionTaken: boolean;
  escalatedIfNeeded: boolean;
}

export interface StaffSiblingTraining {
  id: string;
  staffId: string;
  staffName: string;
  siblingRelationships: boolean;
  contactFacilitation: boolean;
  childViewsAdvocacy: boolean;
  safeguardingInContact: boolean;
  recordKeeping: boolean;
  barrierResolution: boolean;
}

// -- Result interfaces ---------------------------------------------------------

export interface ContactQualityResult {
  overallScore: number;
  totalContacts: number;
  positiveOutcomeRate: number;
  childSatisfactionRate: number;
  recordedRate: number;
  contactHappenedRate: number;
}

export interface PlanningDocumentationResult {
  overallScore: number;
  totalAssessments: number;
  relationshipMappedRate: number;
  contactPlanRate: number;
  childViewsRate: number;
  siblingViewsRate: number;
  reviewScheduledRate: number;
  socialWorkerConsultedRate: number;
}

export interface BarrierManagementResult {
  overallScore: number;
  totalBarriers: number;
  resolvedRate: number;
  actionTakenRate: number;
  escalatedRate: number;
}

export interface StaffSiblingReadinessResult {
  overallScore: number;
  totalStaff: number;
  siblingRelationshipsRate: number;
  contactFacilitationRate: number;
  childViewsAdvocacyRate: number;
  safeguardingRate: number;
  recordKeepingRate: number;
  barrierResolutionRate: number;
}

export interface ChildSiblingProfile {
  childId: string;
  childName: string;
  totalContacts: number;
  positiveOutcomeRate: number;
  satisfactionRate: number;
  hasContactPlan: boolean;
  overallScore: number;
}

export interface SiblingContactManagementIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  contactQuality: ContactQualityResult;
  planningDocumentation: PlanningDocumentationResult;
  barrierManagement: BarrierManagementResult;
  staffSiblingReadiness: StaffSiblingReadinessResult;
  childProfiles: ChildSiblingProfile[];
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
 * Evaluates sibling contact quality.
 * Empty = 0 (no contacts = no evidence of sibling relationship maintenance).
 *
 *   Positive outcome rate (very_positive + positive)  → 0-7
 *   Child satisfaction rate                           → 0-6
 *   Recorded in casefile rate                         → 0-6
 *   Contact happened rate (not did_not_happen)        → 0-6
 */
export function evaluateContactQuality(
  contacts: SiblingContact[],
): ContactQualityResult {
  if (contacts.length === 0) {
    return {
      overallScore: 0,
      totalContacts: 0,
      positiveOutcomeRate: 0,
      childSatisfactionRate: 0,
      recordedRate: 0,
      contactHappenedRate: 0,
    };
  }

  let score = 0;

  const positive = contacts.filter(
    (c) => c.contactOutcome === "very_positive" || c.contactOutcome === "positive",
  ).length;
  const positiveOutcomeRate = pct(positive, contacts.length);
  if (positiveOutcomeRate >= 80) score += 7;
  else if (positiveOutcomeRate >= 60) score += 5;
  else if (positiveOutcomeRate >= 40) score += 3;
  else if (positiveOutcomeRate > 0) score += 1;

  const satisfied = contacts.filter((c) => c.childSatisfied).length;
  const childSatisfactionRate = pct(satisfied, contacts.length);
  if (childSatisfactionRate >= 90) score += 6;
  else if (childSatisfactionRate >= 70) score += 4;
  else if (childSatisfactionRate >= 50) score += 3;
  else if (childSatisfactionRate > 0) score += 1;

  const recorded = contacts.filter((c) => c.recordedInCasefile).length;
  const recordedRate = pct(recorded, contacts.length);
  if (recordedRate >= 90) score += 6;
  else if (recordedRate >= 70) score += 4;
  else if (recordedRate >= 50) score += 3;
  else if (recordedRate > 0) score += 1;

  const happened = contacts.filter(
    (c) => c.contactOutcome !== "did_not_happen",
  ).length;
  const contactHappenedRate = pct(happened, contacts.length);
  if (contactHappenedRate >= 90) score += 6;
  else if (contactHappenedRate >= 70) score += 4;
  else if (contactHappenedRate >= 50) score += 3;
  else if (contactHappenedRate > 0) score += 1;

  return {
    overallScore: Math.min(score, 25),
    totalContacts: contacts.length,
    positiveOutcomeRate,
    childSatisfactionRate,
    recordedRate,
    contactHappenedRate,
  };
}

/**
 * Evaluates planning and documentation for sibling contact.
 * Empty = 0 (no assessments = no planning evidence).
 *
 *   Relationship mapped rate       → 0-6
 *   Contact plan in place rate     → 0-6
 *   Child views sought rate        → 0-5
 *   Sibling views sought rate      → 0-4
 *   Review scheduled rate          → 0-2
 *   Social worker consulted rate   → 0-2
 */
export function evaluatePlanningDocumentation(
  assessments: SiblingAssessment[],
): PlanningDocumentationResult {
  if (assessments.length === 0) {
    return {
      overallScore: 0,
      totalAssessments: 0,
      relationshipMappedRate: 0,
      contactPlanRate: 0,
      childViewsRate: 0,
      siblingViewsRate: 0,
      reviewScheduledRate: 0,
      socialWorkerConsultedRate: 0,
    };
  }

  let score = 0;

  const mapped = assessments.filter((a) => a.siblingRelationshipMapped).length;
  const relationshipMappedRate = pct(mapped, assessments.length);
  if (relationshipMappedRate >= 90) score += 6;
  else if (relationshipMappedRate >= 70) score += 4;
  else if (relationshipMappedRate >= 50) score += 3;
  else if (relationshipMappedRate > 0) score += 1;

  const plan = assessments.filter((a) => a.contactPlanInPlace).length;
  const contactPlanRate = pct(plan, assessments.length);
  if (contactPlanRate >= 90) score += 6;
  else if (contactPlanRate >= 70) score += 4;
  else if (contactPlanRate >= 50) score += 3;
  else if (contactPlanRate > 0) score += 1;

  const childViews = assessments.filter((a) => a.childViewsSought).length;
  const childViewsRate = pct(childViews, assessments.length);
  if (childViewsRate >= 90) score += 5;
  else if (childViewsRate >= 70) score += 3;
  else if (childViewsRate >= 50) score += 2;
  else if (childViewsRate > 0) score += 1;

  const sibViews = assessments.filter((a) => a.siblingViewsSought).length;
  const siblingViewsRate = pct(sibViews, assessments.length);
  if (siblingViewsRate >= 90) score += 4;
  else if (siblingViewsRate >= 70) score += 3;
  else if (siblingViewsRate >= 50) score += 2;
  else if (siblingViewsRate > 0) score += 1;

  const review = assessments.filter((a) => a.reviewScheduled).length;
  const reviewScheduledRate = pct(review, assessments.length);
  if (reviewScheduledRate >= 90) score += 2;
  else if (reviewScheduledRate >= 50) score += 1;

  const sw = assessments.filter((a) => a.socialWorkerConsulted).length;
  const socialWorkerConsultedRate = pct(sw, assessments.length);
  if (socialWorkerConsultedRate >= 90) score += 2;
  else if (socialWorkerConsultedRate >= 50) score += 1;

  return {
    overallScore: Math.min(score, 25),
    totalAssessments: assessments.length,
    relationshipMappedRate,
    contactPlanRate,
    childViewsRate,
    siblingViewsRate,
    reviewScheduledRate,
    socialWorkerConsultedRate,
  };
}

/**
 * Evaluates how well barriers to sibling contact are managed.
 * Empty = 25 (no barriers = ideal situation, no obstacles).
 *
 *   Resolved rate                  → 0-10
 *   Action taken rate              → 0-8
 *   Escalated if needed rate       → 0-7
 */
export function evaluateBarrierManagement(
  barriers: ContactBarrier[],
): BarrierManagementResult {
  if (barriers.length === 0) {
    return {
      overallScore: 25,
      totalBarriers: 0,
      resolvedRate: 0,
      actionTakenRate: 0,
      escalatedRate: 0,
    };
  }

  let score = 0;

  const resolved = barriers.filter(
    (b) => b.barrierStatus === "resolved" || b.barrierStatus === "not_applicable",
  ).length;
  const resolvedRate = pct(resolved, barriers.length);
  if (resolvedRate >= 80) score += 10;
  else if (resolvedRate >= 60) score += 7;
  else if (resolvedRate >= 40) score += 4;
  else if (resolvedRate > 0) score += 2;

  const actioned = barriers.filter((b) => b.actionTaken).length;
  const actionTakenRate = pct(actioned, barriers.length);
  if (actionTakenRate >= 90) score += 8;
  else if (actionTakenRate >= 70) score += 6;
  else if (actionTakenRate >= 50) score += 4;
  else if (actionTakenRate > 0) score += 2;

  const escalated = barriers.filter((b) => b.escalatedIfNeeded).length;
  const escalatedRate = pct(escalated, barriers.length);
  if (escalatedRate >= 90) score += 7;
  else if (escalatedRate >= 70) score += 5;
  else if (escalatedRate >= 50) score += 3;
  else if (escalatedRate > 0) score += 1;

  return {
    overallScore: Math.min(score, 25),
    totalBarriers: barriers.length,
    resolvedRate,
    actionTakenRate,
    escalatedRate,
  };
}

/**
 * Evaluates staff training on sibling contact facilitation.
 * Empty = 0 (no trained staff = no readiness).
 *
 *   Sibling relationships rate      → 0-6
 *   Contact facilitation rate       → 0-5
 *   Child views advocacy rate       → 0-5
 *   Safeguarding in contact rate    → 0-4
 *   Record keeping rate             → 0-3
 *   Barrier resolution rate         → 0-2
 */
export function evaluateStaffSiblingReadiness(
  training: StaffSiblingTraining[],
): StaffSiblingReadinessResult {
  if (training.length === 0) {
    return {
      overallScore: 0,
      totalStaff: 0,
      siblingRelationshipsRate: 0,
      contactFacilitationRate: 0,
      childViewsAdvocacyRate: 0,
      safeguardingRate: 0,
      recordKeepingRate: 0,
      barrierResolutionRate: 0,
    };
  }

  let score = 0;

  const sibRel = training.filter((t) => t.siblingRelationships).length;
  const siblingRelationshipsRate = pct(sibRel, training.length);
  if (siblingRelationshipsRate >= 90) score += 6;
  else if (siblingRelationshipsRate >= 70) score += 4;
  else if (siblingRelationshipsRate >= 50) score += 3;
  else if (siblingRelationshipsRate > 0) score += 1;

  const fac = training.filter((t) => t.contactFacilitation).length;
  const contactFacilitationRate = pct(fac, training.length);
  if (contactFacilitationRate >= 90) score += 5;
  else if (contactFacilitationRate >= 70) score += 3;
  else if (contactFacilitationRate >= 50) score += 2;
  else if (contactFacilitationRate > 0) score += 1;

  const views = training.filter((t) => t.childViewsAdvocacy).length;
  const childViewsAdvocacyRate = pct(views, training.length);
  if (childViewsAdvocacyRate >= 90) score += 5;
  else if (childViewsAdvocacyRate >= 70) score += 3;
  else if (childViewsAdvocacyRate >= 50) score += 2;
  else if (childViewsAdvocacyRate > 0) score += 1;

  const safeguarding = training.filter((t) => t.safeguardingInContact).length;
  const safeguardingRate = pct(safeguarding, training.length);
  if (safeguardingRate >= 90) score += 4;
  else if (safeguardingRate >= 70) score += 3;
  else if (safeguardingRate >= 50) score += 2;
  else if (safeguardingRate > 0) score += 1;

  const records = training.filter((t) => t.recordKeeping).length;
  const recordKeepingRate = pct(records, training.length);
  if (recordKeepingRate >= 90) score += 3;
  else if (recordKeepingRate >= 70) score += 2;
  else if (recordKeepingRate >= 50) score += 1;

  const barrier = training.filter((t) => t.barrierResolution).length;
  const barrierResolutionRate = pct(barrier, training.length);
  if (barrierResolutionRate >= 90) score += 2;
  else if (barrierResolutionRate >= 70) score += 1;

  return {
    overallScore: Math.min(score, 25),
    totalStaff: training.length,
    siblingRelationshipsRate,
    contactFacilitationRate,
    childViewsAdvocacyRate,
    safeguardingRate,
    recordKeepingRate,
    barrierResolutionRate,
  };
}

// -- Child Profiles ------------------------------------------------------------

export function buildChildSiblingProfiles(
  contacts: SiblingContact[],
  assessments: SiblingAssessment[],
): ChildSiblingProfile[] {
  const childMap = new Map<
    string,
    { childId: string; childName: string; contacts: SiblingContact[]; hasContactPlan: boolean }
  >();

  for (const c of contacts) {
    if (!childMap.has(c.childId)) {
      childMap.set(c.childId, {
        childId: c.childId,
        childName: c.childName,
        contacts: [],
        hasContactPlan: false,
      });
    }
    childMap.get(c.childId)!.contacts.push(c);
  }

  for (const a of assessments) {
    if (!childMap.has(a.childId)) {
      childMap.set(a.childId, {
        childId: a.childId,
        childName: a.childName,
        contacts: [],
        hasContactPlan: false,
      });
    }
    if (a.contactPlanInPlace) {
      childMap.get(a.childId)!.hasContactPlan = true;
    }
  }

  return Array.from(childMap.values()).map((entry) => {
    let score = 0;

    // Contacts frequency (0-3)
    if (entry.contacts.length >= 6) score += 3;
    else if (entry.contacts.length >= 3) score += 2;
    else if (entry.contacts.length >= 1) score += 1;

    // Positive outcome rate (0-3)
    const positive = entry.contacts.filter(
      (c) => c.contactOutcome === "very_positive" || c.contactOutcome === "positive",
    ).length;
    const positiveOutcomeRate = pct(positive, entry.contacts.length);
    if (positiveOutcomeRate >= 80) score += 3;
    else if (positiveOutcomeRate >= 50) score += 2;
    else if (positiveOutcomeRate > 0) score += 1;

    // Child satisfaction (0-2)
    const satisfied = entry.contacts.filter((c) => c.childSatisfied).length;
    const satisfactionRate = pct(satisfied, entry.contacts.length);
    if (satisfactionRate >= 80) score += 2;
    else if (satisfactionRate >= 50) score += 1;

    // Contact plan in place (0-2)
    if (entry.hasContactPlan) score += 2;

    return {
      childId: entry.childId,
      childName: entry.childName,
      totalContacts: entry.contacts.length,
      positiveOutcomeRate,
      satisfactionRate,
      hasContactPlan: entry.hasContactPlan,
      overallScore: Math.min(Math.max(score, 0), 10),
    };
  });
}

// -- Main generator ------------------------------------------------------------

export function generateSiblingContactManagementIntelligence(
  contacts: SiblingContact[],
  assessments: SiblingAssessment[],
  barriers: ContactBarrier[],
  training: StaffSiblingTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): SiblingContactManagementIntelligence {
  const contactQuality = evaluateContactQuality(contacts);
  const planningDocumentation = evaluatePlanningDocumentation(assessments);
  const barrierManagement = evaluateBarrierManagement(barriers);
  const staffSiblingReadiness = evaluateStaffSiblingReadiness(training);

  const rawScore =
    contactQuality.overallScore +
    planningDocumentation.overallScore +
    barrierManagement.overallScore +
    staffSiblingReadiness.overallScore;
  const overallScore = Math.min(rawScore, 100);
  const rating = getRating(overallScore);

  const childProfiles = buildChildSiblingProfiles(contacts, assessments);

  // -- Strengths ---------------------------------------------------------------
  const strengths: string[] = [];

  if (contactQuality.positiveOutcomeRate >= 80 && contacts.length > 0) {
    strengths.push(
      "Sibling contacts consistently producing positive outcomes for children",
    );
  }
  if (contactQuality.childSatisfactionRate >= 90 && contacts.length > 0) {
    strengths.push(
      "Children report high satisfaction with sibling contact arrangements",
    );
  }
  if (planningDocumentation.contactPlanRate >= 90 && assessments.length > 0) {
    strengths.push(
      "Contact plans in place for all children with siblings",
    );
  }
  if (planningDocumentation.childViewsRate >= 90 && assessments.length > 0) {
    strengths.push(
      "Children's views consistently sought in sibling contact planning",
    );
  }
  if (barrierManagement.resolvedRate >= 80 && barriers.length > 0) {
    strengths.push(
      "Barriers to sibling contact effectively identified and resolved",
    );
  }
  if (staffSiblingReadiness.siblingRelationshipsRate >= 90 && training.length > 0) {
    strengths.push(
      "Staff team fully trained in supporting sibling relationships",
    );
  }
  if (staffSiblingReadiness.contactFacilitationRate >= 90 && training.length > 0) {
    strengths.push(
      "Staff team skilled in facilitating sibling contact sessions",
    );
  }
  if (contactQuality.recordedRate >= 90 && contacts.length > 0) {
    strengths.push(
      "Sibling contact consistently recorded in casefiles",
    );
  }

  // -- Areas for improvement ---------------------------------------------------
  const areasForImprovement: string[] = [];

  if (contactQuality.positiveOutcomeRate < 60 && contacts.length > 0) {
    areasForImprovement.push(
      "Sibling contact outcomes below expected standard — review facilitation approach",
    );
  }
  if (contactQuality.childSatisfactionRate < 70 && contacts.length > 0) {
    areasForImprovement.push(
      "Children's satisfaction with sibling contact needs improvement",
    );
  }
  if (planningDocumentation.contactPlanRate < 70 && assessments.length > 0) {
    areasForImprovement.push(
      "Contact plans not consistently in place for all children with siblings",
    );
  }
  if (planningDocumentation.childViewsRate < 70 && assessments.length > 0) {
    areasForImprovement.push(
      "Children's views not consistently sought in contact planning",
    );
  }
  if (barrierManagement.actionTakenRate < 70 && barriers.length > 0) {
    areasForImprovement.push(
      "Action not consistently taken to address barriers to sibling contact",
    );
  }
  if (staffSiblingReadiness.contactFacilitationRate < 70 && training.length > 0) {
    areasForImprovement.push(
      "Staff contact facilitation training needs strengthening",
    );
  }

  // -- Actions -----------------------------------------------------------------
  const actions: string[] = [];

  if (contacts.length === 0) {
    actions.push(
      "No sibling contacts recorded — review whether children have siblings and establish contact arrangements",
    );
  }
  if (assessments.length === 0 && contacts.length > 0) {
    actions.push(
      "URGENT: No sibling assessments recorded — complete sibling relationship mapping for all children",
    );
  }
  if (training.length === 0) {
    actions.push(
      "URGENT: No staff sibling contact training records — deliver training on sibling relationship support",
    );
  }
  const unresolvedBarriers = barriers.filter(
    (b) => b.barrierStatus === "unresolved",
  );
  if (unresolvedBarriers.length > 0) {
    actions.push(
      `URGENT: ${unresolvedBarriers.length} unresolved barrier(s) to sibling contact — take action to address immediately`,
    );
  }
  if (contactQuality.recordedRate < 70 && contacts.length > 0) {
    actions.push(
      "Improve recording of sibling contacts in casefiles",
    );
  }
  if (contactQuality.contactHappenedRate < 80 && contacts.length > 0) {
    actions.push(
      "Review why scheduled sibling contacts are not taking place",
    );
  }
  if (planningDocumentation.socialWorkerConsultedRate < 70 && assessments.length > 0) {
    actions.push(
      "Ensure social workers are consulted in sibling contact planning",
    );
  }

  // -- Regulatory links --------------------------------------------------------
  const regulatoryLinks: string[] = [
    "CHR 2015 Reg 10 — The health and wellbeing standard (emotional wellbeing through family contact)",
    "CHR 2015 Reg 12 — The positive relationships standard",
    "SCCIF — Social Care Common Inspection Framework (maintaining family connections)",
    "Children Act 1989 s34 — Contact with children in care",
    "NMS 3 — National Minimum Standards (positive relationships and family contact)",
    "Care Planning Regulations 2010 — Contact arrangements for looked-after children",
    "UNCRC Article 8 — Right to preserve family relations",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    contactQuality,
    planningDocumentation,
    barrierManagement,
    staffSiblingReadiness,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
