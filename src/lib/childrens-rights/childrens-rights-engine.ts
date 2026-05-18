// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Children's Rights & Advocacy Intelligence Engine
//
// Pure deterministic engine — no AI, no external calls.
// Maps to: CHR 2015 Reg 7 (children's guide), Reg 14 (care planning),
// Reg 45 (RI reviews), UNCRC Articles 12/13/17, SCCIF experience & progress
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ────────────────────────────────────────────────────────────────────

export type RightsCategory =
  | "know_your_rights"
  | "complaints_process"
  | "advocacy_access"
  | "participation_in_decisions"
  | "privacy"
  | "contact_with_family"
  | "education"
  | "health"
  | "cultural_identity"
  | "leisure_and_play"
  | "freedom_of_expression"
  | "protection_from_harm";

export type AdvocacyType =
  | "independent_advocate"
  | "childrens_commissioner"
  | "ofsted_contact"
  | "social_worker"
  | "irp" // Independent Reviewing Officer
  | "nyas" // National Youth Advocacy Service
  | "childline"
  | "reg44_visitor";

export type AdvocacyStatus =
  | "active"
  | "offered_declined"
  | "not_offered"
  | "completed"
  | "pending";

export type ChildrensGuideStatus =
  | "current"
  | "needs_update"
  | "not_provided"
  | "age_inappropriate";

export type ParticipationLevel =
  | "informed"       // Child told about decision
  | "consulted"      // Child asked for views
  | "involved"       // Child actively involved in process
  | "shared_decision" // Equal say in outcome
  | "child_led";     // Child drives decision

export type FeedbackMechanism =
  | "house_meeting"
  | "key_worker_session"
  | "complaints_form"
  | "suggestion_box"
  | "reg44_visit"
  | "review_meeting"
  | "exit_interview"
  | "survey"
  | "informal_chat";

// ── Interfaces ───────────────────────────────────────────────────────────────

export interface ChildrensGuide {
  id: string;
  childId: string;
  childName: string;
  providedDate: string;
  lastUpdatedDate: string;
  status: ChildrensGuideStatus;
  ageAppropriate: boolean;
  accessibleFormat: boolean; // easy read, translated, visual, etc.
  coversComplaints: boolean;
  coversAdvocacy: boolean;
  coversRights: boolean;
  coversOfstedContact: boolean;
  childConfirmedUnderstanding: boolean;
  reviewDate: string;
}

export interface AdvocacyRecord {
  id: string;
  childId: string;
  childName: string;
  advocacyType: AdvocacyType;
  status: AdvocacyStatus;
  offeredDate: string;
  engagedDate?: string;
  completedDate?: string;
  reason: string;
  outcome?: string;
  childSatisfied?: boolean;
}

export interface RightsAwarenessAssessment {
  id: string;
  childId: string;
  childName: string;
  assessmentDate: string;
  assessedBy: string;
  rightsUnderstood: RightsCategory[];
  rightsNotUnderstood: RightsCategory[];
  actionsPlanned: string[];
  followUpDate: string;
}

export interface ParticipationRecord {
  id: string;
  childId: string;
  childName: string;
  date: string;
  decisionArea: string;
  participationLevel: ParticipationLevel;
  childViewRecorded: boolean;
  viewInfluencedOutcome: boolean;
  feedbackMechanism: FeedbackMechanism;
  notes?: string;
}

export interface ComplaintAccessRecord {
  id: string;
  childId: string;
  childName: string;
  date: string;
  knowsHowToComplain: boolean;
  feelsAbleToComplain: boolean;
  complaintsFormAccessible: boolean;
  advocacyOfferedIfNeeded: boolean;
  previousComplaintHandledWell?: boolean;
  barrierIdentified?: string;
}

export interface FeedbackRecord {
  id: string;
  childId: string;
  childName: string;
  date: string;
  mechanism: FeedbackMechanism;
  feedbackGiven: string;
  acknowledged: boolean;
  actionTaken?: string;
  outcomeSharedWithChild: boolean;
  childSatisfied?: boolean;
}

// ── Result Types ─────────────────────────────────────────────────────────────

export interface GuideComplianceResult {
  totalChildren: number;
  guidesProvided: number;
  guidesCurrent: number;
  ageAppropriateRate: number;
  accessibleFormatRate: number;
  coversComplaintsRate: number;
  coversAdvocacyRate: number;
  coversRightsRate: number;
  coversOfstedRate: number;
  childUnderstandingRate: number;
  overallComplianceScore: number;
  childrenNeedingUpdate: string[];
}

export interface AdvocacyResult {
  totalRecords: number;
  activeAdvocacy: number;
  advocacyOfferedRate: number;
  advocacyEngagedRate: number;
  advocacyTypeBreakdown: Record<string, number>;
  childrenWithoutAdvocacyOffer: string[];
  satisfactionRate: number;
  overallScore: number;
}

export interface RightsAwarenessResult {
  totalAssessments: number;
  childrenAssessed: number;
  averageRightsUnderstood: number;
  totalRightsCategories: number;
  categoryUnderstandingRates: Record<string, number>;
  leastUnderstoodRights: RightsCategory[];
  childrenWithLowAwareness: string[];
  overallScore: number;
}

export interface ParticipationResult {
  totalRecords: number;
  levelBreakdown: Record<string, number>;
  childViewRecordedRate: number;
  viewInfluencedOutcomeRate: number;
  mechanismBreakdown: Record<string, number>;
  childrenWithLowParticipation: string[];
  averageParticipationLevel: number;
  overallScore: number;
}

export interface ComplaintAccessResult {
  totalAssessments: number;
  knowsHowToComplainRate: number;
  feelsAbleToComplainRate: number;
  formsAccessibleRate: number;
  advocacyOfferedRate: number;
  barriersIdentified: string[];
  childrenWithBarriers: string[];
  overallScore: number;
}

export interface FeedbackResult {
  totalFeedback: number;
  acknowledgedRate: number;
  actionTakenRate: number;
  outcomeSharedRate: number;
  satisfactionRate: number;
  mechanismBreakdown: Record<string, number>;
  overallScore: number;
}

export interface ChildRightsProfile {
  childId: string;
  childName: string;
  guideStatus: ChildrensGuideStatus | "not_found";
  rightsAwarenessScore: number;
  participationLevel: string;
  advocacyStatus: string;
  complaintAccessScore: number;
  feedbackEngagement: number;
  overallRightsScore: number;
  areasForDevelopment: string[];
}

export interface ChildrensRightsIntelligenceResult {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  referenceDate: string;
  overallScore: number;
  rating: "outstanding" | "good" | "requires_improvement" | "inadequate";
  guideCompliance: GuideComplianceResult;
  advocacy: AdvocacyResult;
  rightsAwareness: RightsAwarenessResult;
  participation: ParticipationResult;
  complaintAccess: ComplaintAccessResult;
  feedback: FeedbackResult;
  childProfiles: ChildRightsProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Constants ────────────────────────────────────────────────────────────────

const ALL_RIGHTS_CATEGORIES: RightsCategory[] = [
  "know_your_rights", "complaints_process", "advocacy_access",
  "participation_in_decisions", "privacy", "contact_with_family",
  "education", "health", "cultural_identity", "leisure_and_play",
  "freedom_of_expression", "protection_from_harm",
];

const PARTICIPATION_LEVEL_SCORES: Record<ParticipationLevel, number> = {
  informed: 1,
  consulted: 2,
  involved: 3,
  shared_decision: 4,
  child_led: 5,
};

// ── Core Functions ───────────────────────────────────────────────────────────

export function evaluateGuideCompliance(
  guides: ChildrensGuide[],
  childIds: string[],
): GuideComplianceResult {
  const totalChildren = childIds.length;

  if (totalChildren === 0) {
    return {
      totalChildren: 0, guidesProvided: 0, guidesCurrent: 0,
      ageAppropriateRate: 0, accessibleFormatRate: 0,
      coversComplaintsRate: 0, coversAdvocacyRate: 0,
      coversRightsRate: 0, coversOfstedRate: 0,
      childUnderstandingRate: 0, overallComplianceScore: 0,
      childrenNeedingUpdate: [],
    };
  }

  // Latest guide per child
  const latestGuides = new Map<string, ChildrensGuide>();
  for (const g of guides) {
    const existing = latestGuides.get(g.childId);
    if (!existing || g.providedDate > existing.providedDate) {
      latestGuides.set(g.childId, g);
    }
  }

  const guidesProvided = latestGuides.size;
  let guidesCurrent = 0;
  let ageAppropriate = 0;
  let accessibleFormat = 0;
  let coversComplaints = 0;
  let coversAdvocacy = 0;
  let coversRights = 0;
  let coversOfsted = 0;
  let childUnderstands = 0;
  const childrenNeedingUpdate: string[] = [];

  for (const g of latestGuides.values()) {
    if (g.status === "current") guidesCurrent++;
    else childrenNeedingUpdate.push(g.childName);

    if (g.ageAppropriate) ageAppropriate++;
    if (g.accessibleFormat) accessibleFormat++;
    if (g.coversComplaints) coversComplaints++;
    if (g.coversAdvocacy) coversAdvocacy++;
    if (g.coversRights) coversRights++;
    if (g.coversOfstedContact) coversOfsted++;
    if (g.childConfirmedUnderstanding) childUnderstands++;
  }

  // Children without any guide
  for (const id of childIds) {
    if (!latestGuides.has(id)) {
      childrenNeedingUpdate.push(id);
    }
  }

  const n = Math.max(guidesProvided, 1);
  const provisionRate = guidesProvided / totalChildren;
  const currencyRate = guidesCurrent / n;
  const ageRate = ageAppropriate / n;
  const accessRate = accessibleFormat / n;
  const complaintsRate = coversComplaints / n;
  const advocacyRate = coversAdvocacy / n;
  const rightsRate = coversRights / n;
  const ofstedRate = coversOfsted / n;
  const understandRate = childUnderstands / n;

  // Score: provision (20) + currency (15) + content coverage (40) + understanding (25)
  const provisionScore = provisionRate * 20;
  const currencyScore = currencyRate * 15;
  const contentScore =
    ((complaintsRate + advocacyRate + rightsRate + ofstedRate + ageRate + accessRate) / 6) * 40;
  const understandScore = understandRate * 25;
  const overallComplianceScore = Math.round(
    provisionScore + currencyScore + contentScore + understandScore,
  );

  return {
    totalChildren,
    guidesProvided,
    guidesCurrent,
    ageAppropriateRate: Math.round(ageRate * 100),
    accessibleFormatRate: Math.round(accessRate * 100),
    coversComplaintsRate: Math.round(complaintsRate * 100),
    coversAdvocacyRate: Math.round(advocacyRate * 100),
    coversRightsRate: Math.round(rightsRate * 100),
    coversOfstedRate: Math.round(ofstedRate * 100),
    childUnderstandingRate: Math.round(understandRate * 100),
    overallComplianceScore,
    childrenNeedingUpdate,
  };
}

export function evaluateAdvocacy(
  records: AdvocacyRecord[],
  childIds: string[],
): AdvocacyResult {
  if (childIds.length === 0) {
    return {
      totalRecords: 0, activeAdvocacy: 0, advocacyOfferedRate: 0,
      advocacyEngagedRate: 0, advocacyTypeBreakdown: {},
      childrenWithoutAdvocacyOffer: [], satisfactionRate: 0,
      overallScore: 0,
    };
  }

  const childrenOffered = new Set<string>();
  const childrenEngaged = new Set<string>();
  let activeCount = 0;
  const typeBreakdown: Record<string, number> = {};
  let satisfiedCount = 0;
  let satisfiedTotal = 0;

  for (const r of records) {
    if (r.status !== "not_offered") {
      childrenOffered.add(r.childId);
    }
    if (r.status === "active" || r.status === "completed") {
      childrenEngaged.add(r.childId);
    }
    if (r.status === "active") activeCount++;

    typeBreakdown[r.advocacyType] = (typeBreakdown[r.advocacyType] || 0) + 1;

    if (r.childSatisfied !== undefined) {
      satisfiedTotal++;
      if (r.childSatisfied) satisfiedCount++;
    }
  }

  const childrenWithoutOffer = childIds.filter((id) => !childrenOffered.has(id));
  const offeredRate = childrenOffered.size / childIds.length;
  const engagedRate = childrenOffered.size > 0
    ? childrenEngaged.size / childrenOffered.size
    : 0;
  const satisfactionRate = satisfiedTotal > 0
    ? satisfiedCount / satisfiedTotal
    : 0;

  // Score: offered rate (30) + engaged rate (25) + type variety (20) + satisfaction (25)
  const offeredScore = offeredRate * 30;
  const engagedScore = engagedRate * 25;
  const typeVariety = Math.min(Object.keys(typeBreakdown).length / 4, 1);
  const varietyScore = typeVariety * 20;
  const satScore = satisfactionRate * 25;
  const overallScore = Math.round(offeredScore + engagedScore + varietyScore + satScore);

  return {
    totalRecords: records.length,
    activeAdvocacy: activeCount,
    advocacyOfferedRate: Math.round(offeredRate * 100),
    advocacyEngagedRate: Math.round(engagedRate * 100),
    advocacyTypeBreakdown: typeBreakdown,
    childrenWithoutAdvocacyOffer: childrenWithoutOffer,
    satisfactionRate: Math.round(satisfactionRate * 100),
    overallScore,
  };
}

export function evaluateRightsAwareness(
  assessments: RightsAwarenessAssessment[],
  childIds: string[],
): RightsAwarenessResult {
  if (childIds.length === 0 || assessments.length === 0) {
    return {
      totalAssessments: assessments.length,
      childrenAssessed: 0,
      averageRightsUnderstood: 0,
      totalRightsCategories: ALL_RIGHTS_CATEGORIES.length,
      categoryUnderstandingRates: {},
      leastUnderstoodRights: [...ALL_RIGHTS_CATEGORIES],
      childrenWithLowAwareness: [],
      overallScore: 0,
    };
  }

  // Latest assessment per child
  const latestAssessments = new Map<string, RightsAwarenessAssessment>();
  for (const a of assessments) {
    const existing = latestAssessments.get(a.childId);
    if (!existing || a.assessmentDate > existing.assessmentDate) {
      latestAssessments.set(a.childId, a);
    }
  }

  const childrenAssessed = latestAssessments.size;
  const categoryCount: Record<string, number> = {};
  let totalRightsUnderstood = 0;
  const childrenWithLowAwareness: string[] = [];

  for (const a of latestAssessments.values()) {
    const understood = a.rightsUnderstood.length;
    const total = understood + a.rightsNotUnderstood.length;
    totalRightsUnderstood += understood;

    if (total > 0 && understood / total < 0.5) {
      childrenWithLowAwareness.push(a.childName);
    }

    for (const r of a.rightsUnderstood) {
      categoryCount[r] = (categoryCount[r] || 0) + 1;
    }
  }

  const averageRightsUnderstood = totalRightsUnderstood / childrenAssessed;

  const categoryRates: Record<string, number> = {};
  for (const cat of ALL_RIGHTS_CATEGORIES) {
    categoryRates[cat] = Math.round(((categoryCount[cat] || 0) / childrenAssessed) * 100);
  }

  // Sort categories by understanding rate to find least understood
  const sorted = ALL_RIGHTS_CATEGORIES
    .map((cat) => ({ cat, rate: categoryRates[cat] || 0 }))
    .sort((a, b) => a.rate - b.rate);

  const leastUnderstood = sorted
    .filter((s) => s.rate < 75)
    .map((s) => s.cat);

  // Score: coverage (25) + awareness depth (40) + low-awareness children (35)
  const coverageRate = childrenAssessed / childIds.length;
  const coverageScore = coverageRate * 25;
  const awarenessRate = averageRightsUnderstood / ALL_RIGHTS_CATEGORIES.length;
  const awarenessScore = awarenessRate * 40;
  const lowAwarenessRate = 1 - (childrenWithLowAwareness.length / Math.max(childrenAssessed, 1));
  const lowAwarenessScore = lowAwarenessRate * 35;
  const overallScore = Math.round(coverageScore + awarenessScore + lowAwarenessScore);

  return {
    totalAssessments: assessments.length,
    childrenAssessed,
    averageRightsUnderstood: Math.round(averageRightsUnderstood * 10) / 10,
    totalRightsCategories: ALL_RIGHTS_CATEGORIES.length,
    categoryUnderstandingRates: categoryRates,
    leastUnderstoodRights: leastUnderstood,
    childrenWithLowAwareness,
    overallScore,
  };
}

export function evaluateParticipation(
  records: ParticipationRecord[],
  childIds: string[],
): ParticipationResult {
  if (records.length === 0 || childIds.length === 0) {
    return {
      totalRecords: 0, levelBreakdown: {},
      childViewRecordedRate: 0, viewInfluencedOutcomeRate: 0,
      mechanismBreakdown: {}, childrenWithLowParticipation: [],
      averageParticipationLevel: 0, overallScore: 0,
    };
  }

  const levelBreakdown: Record<string, number> = {};
  const mechanismBreakdown: Record<string, number> = {};
  let viewRecorded = 0;
  let viewInfluenced = 0;
  let totalLevel = 0;

  const childParticipation = new Map<string, number[]>();

  for (const r of records) {
    levelBreakdown[r.participationLevel] =
      (levelBreakdown[r.participationLevel] || 0) + 1;
    mechanismBreakdown[r.feedbackMechanism] =
      (mechanismBreakdown[r.feedbackMechanism] || 0) + 1;

    if (r.childViewRecorded) viewRecorded++;
    if (r.viewInfluencedOutcome) viewInfluenced++;

    const score = PARTICIPATION_LEVEL_SCORES[r.participationLevel] || 0;
    totalLevel += score;

    if (!childParticipation.has(r.childId)) {
      childParticipation.set(r.childId, []);
    }
    childParticipation.get(r.childId)!.push(score);
  }

  const viewRecordedRate = viewRecorded / records.length;
  const viewInfluencedRate = viewInfluenced / records.length;
  const averageLevel = totalLevel / records.length;

  // Children with low participation: average level < 2 (below "consulted")
  const childrenWithLowParticipation: string[] = [];
  for (const [childId, scores] of childParticipation.entries()) {
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    if (avg < 2) {
      childrenWithLowParticipation.push(childId);
    }
  }

  // Children not participating at all
  for (const id of childIds) {
    if (!childParticipation.has(id) && !childrenWithLowParticipation.includes(id)) {
      childrenWithLowParticipation.push(id);
    }
  }

  // Score: level quality (30) + view recording (25) + influence (25) + coverage (20)
  const levelScore = (averageLevel / 5) * 30;
  const viewScore = viewRecordedRate * 25;
  const influenceScore = viewInfluencedRate * 25;
  const coverageRate = childParticipation.size / childIds.length;
  const coverageScore = coverageRate * 20;
  const overallScore = Math.round(levelScore + viewScore + influenceScore + coverageScore);

  return {
    totalRecords: records.length,
    levelBreakdown,
    childViewRecordedRate: Math.round(viewRecordedRate * 100),
    viewInfluencedOutcomeRate: Math.round(viewInfluencedRate * 100),
    mechanismBreakdown,
    childrenWithLowParticipation,
    averageParticipationLevel: Math.round(averageLevel * 10) / 10,
    overallScore,
  };
}

export function evaluateComplaintAccess(
  records: ComplaintAccessRecord[],
  childIds: string[],
): ComplaintAccessResult {
  if (records.length === 0 || childIds.length === 0) {
    return {
      totalAssessments: 0, knowsHowToComplainRate: 0,
      feelsAbleToComplainRate: 0, formsAccessibleRate: 0,
      advocacyOfferedRate: 0, barriersIdentified: [],
      childrenWithBarriers: [], overallScore: 0,
    };
  }

  // Latest assessment per child
  const latest = new Map<string, ComplaintAccessRecord>();
  for (const r of records) {
    const existing = latest.get(r.childId);
    if (!existing || r.date > existing.date) {
      latest.set(r.childId, r);
    }
  }

  let knows = 0;
  let feelsAble = 0;
  let accessible = 0;
  let advocacyOffered = 0;
  const barriers: string[] = [];
  const childrenWithBarriers: string[] = [];

  for (const r of latest.values()) {
    if (r.knowsHowToComplain) knows++;
    if (r.feelsAbleToComplain) feelsAble++;
    if (r.complaintsFormAccessible) accessible++;
    if (r.advocacyOfferedIfNeeded) advocacyOffered++;
    if (r.barrierIdentified) {
      barriers.push(r.barrierIdentified);
      childrenWithBarriers.push(r.childName);
    }
  }

  const n = latest.size;
  const knowsRate = knows / n;
  const feelsRate = feelsAble / n;
  const accessibleRate = accessible / n;
  const advocacyRate = advocacyOffered / n;

  // Score: knows (25) + feels able (30) + accessible (20) + advocacy (25)
  const overallScore = Math.round(
    knowsRate * 25 + feelsRate * 30 + accessibleRate * 20 + advocacyRate * 25,
  );

  return {
    totalAssessments: records.length,
    knowsHowToComplainRate: Math.round(knowsRate * 100),
    feelsAbleToComplainRate: Math.round(feelsRate * 100),
    formsAccessibleRate: Math.round(accessibleRate * 100),
    advocacyOfferedRate: Math.round(advocacyRate * 100),
    barriersIdentified: barriers,
    childrenWithBarriers,
    overallScore,
  };
}

export function evaluateFeedback(
  records: FeedbackRecord[],
): FeedbackResult {
  if (records.length === 0) {
    return {
      totalFeedback: 0, acknowledgedRate: 0, actionTakenRate: 0,
      outcomeSharedRate: 0, satisfactionRate: 0,
      mechanismBreakdown: {}, overallScore: 0,
    };
  }

  let acknowledged = 0;
  let actionTaken = 0;
  let outcomeShared = 0;
  let satisfied = 0;
  let satisfiedTotal = 0;
  const mechanismBreakdown: Record<string, number> = {};

  for (const r of records) {
    if (r.acknowledged) acknowledged++;
    if (r.actionTaken) actionTaken++;
    if (r.outcomeSharedWithChild) outcomeShared++;
    mechanismBreakdown[r.mechanism] = (mechanismBreakdown[r.mechanism] || 0) + 1;

    if (r.childSatisfied !== undefined) {
      satisfiedTotal++;
      if (r.childSatisfied) satisfied++;
    }
  }

  const n = records.length;
  const ackRate = acknowledged / n;
  const actionRate = actionTaken / n;
  const sharedRate = outcomeShared / n;
  const satRate = satisfiedTotal > 0 ? satisfied / satisfiedTotal : 0;

  // Score: acknowledged (20) + action taken (30) + outcome shared (25) + satisfaction (25)
  const overallScore = Math.round(
    ackRate * 20 + actionRate * 30 + sharedRate * 25 + satRate * 25,
  );

  return {
    totalFeedback: n,
    acknowledgedRate: Math.round(ackRate * 100),
    actionTakenRate: Math.round(actionRate * 100),
    outcomeSharedRate: Math.round(sharedRate * 100),
    satisfactionRate: Math.round(satRate * 100),
    mechanismBreakdown,
    overallScore,
  };
}

// ── Build Child Profiles ─────────────────────────────────────────────────────

export function buildChildRightsProfiles(
  guides: ChildrensGuide[],
  advocacy: AdvocacyRecord[],
  awareness: RightsAwarenessAssessment[],
  participation: ParticipationRecord[],
  complaintAccess: ComplaintAccessRecord[],
  feedback: FeedbackRecord[],
  childIds: string[],
  childNames: Record<string, string>,
): ChildRightsProfile[] {
  return childIds.map((childId) => {
    const childName = childNames[childId] || childId;

    // Guide status
    const childGuides = guides.filter((g) => g.childId === childId);
    const latestGuide = childGuides.sort((a, b) =>
      b.providedDate.localeCompare(a.providedDate),
    )[0];
    const guideStatus: ChildrensGuideStatus | "not_found" = latestGuide
      ? latestGuide.status
      : "not_found";

    // Rights awareness
    const childAwareness = awareness.filter((a) => a.childId === childId);
    const latestAwareness = childAwareness.sort((a, b) =>
      b.assessmentDate.localeCompare(a.assessmentDate),
    )[0];
    const rightsScore = latestAwareness
      ? Math.round(
          (latestAwareness.rightsUnderstood.length /
            (latestAwareness.rightsUnderstood.length +
              latestAwareness.rightsNotUnderstood.length)) *
            100,
        )
      : 0;

    // Participation level
    const childParticipation = participation.filter((p) => p.childId === childId);
    const avgLevel = childParticipation.length > 0
      ? childParticipation.reduce(
          (sum, p) => sum + (PARTICIPATION_LEVEL_SCORES[p.participationLevel] || 0),
          0,
        ) / childParticipation.length
      : 0;
    const levelLabel = avgLevel >= 4
      ? "excellent"
      : avgLevel >= 3
        ? "good"
        : avgLevel >= 2
          ? "developing"
          : "limited";

    // Advocacy
    const childAdvocacy = advocacy.filter((a) => a.childId === childId);
    const hasActive = childAdvocacy.some((a) => a.status === "active");
    const offered = childAdvocacy.some(
      (a) => a.status !== "not_offered",
    );
    const advocacyLabel = hasActive
      ? "active"
      : offered
        ? "offered"
        : "not_offered";

    // Complaint access
    const childComplaints = complaintAccess.filter((c) => c.childId === childId);
    const latestComplaint = childComplaints.sort((a, b) =>
      b.date.localeCompare(a.date),
    )[0];
    const complaintScore = latestComplaint
      ? Math.round(
          ((latestComplaint.knowsHowToComplain ? 25 : 0) +
            (latestComplaint.feelsAbleToComplain ? 30 : 0) +
            (latestComplaint.complaintsFormAccessible ? 20 : 0) +
            (latestComplaint.advocacyOfferedIfNeeded ? 25 : 0)),
        )
      : 0;

    // Feedback engagement
    const childFeedback = feedback.filter((f) => f.childId === childId);
    const feedbackEngagement = childFeedback.length;

    // Overall score
    const guideScore = guideStatus === "current" ? 100 : guideStatus === "needs_update" ? 50 : 0;
    const overallRightsScore = Math.round(
      (guideScore * 0.15) +
      (rightsScore * 0.25) +
      ((avgLevel / 5) * 100 * 0.25) +
      (complaintScore * 0.2) +
      (Math.min(feedbackEngagement / 3, 1) * 100 * 0.15),
    );

    // Areas for development
    const areas: string[] = [];
    if (guideStatus !== "current") areas.push("Children's guide needs updating");
    if (rightsScore < 60) areas.push("Rights awareness below target");
    if (avgLevel < 3) areas.push("Participation level needs strengthening");
    if (advocacyLabel === "not_offered") areas.push("Advocacy not yet offered");
    if (complaintScore < 60) areas.push("Complaint access needs improvement");
    if (feedbackEngagement < 2) areas.push("Low feedback engagement");

    return {
      childId,
      childName,
      guideStatus,
      rightsAwarenessScore: rightsScore,
      participationLevel: levelLabel,
      advocacyStatus: advocacyLabel,
      complaintAccessScore: complaintScore,
      feedbackEngagement,
      overallRightsScore,
      areasForDevelopment: areas,
    };
  });
}

// ── Main Intelligence Function ───────────────────────────────────────────────

export function generateChildrensRightsIntelligence(
  guides: ChildrensGuide[],
  advocacy: AdvocacyRecord[],
  awareness: RightsAwarenessAssessment[],
  participation: ParticipationRecord[],
  complaintAccess: ComplaintAccessRecord[],
  feedback: FeedbackRecord[],
  childIds: string[],
  childNames: Record<string, string>,
  homeId: string,
  periodStart: string,
  periodEnd: string,
  referenceDate: string,
): ChildrensRightsIntelligenceResult {
  const guideResult = evaluateGuideCompliance(guides, childIds);
  const advocacyResult = evaluateAdvocacy(advocacy, childIds);
  const awarenessResult = evaluateRightsAwareness(awareness, childIds);
  const participationResult = evaluateParticipation(participation, childIds);
  const complaintResult = evaluateComplaintAccess(complaintAccess, childIds);
  const feedbackResult = evaluateFeedback(feedback);

  const profiles = buildChildRightsProfiles(
    guides, advocacy, awareness, participation,
    complaintAccess, feedback, childIds, childNames,
  );

  // Weighted scoring (100 points):
  // Guide compliance: 15
  // Advocacy: 15
  // Rights awareness: 20
  // Participation: 25
  // Complaint access: 15
  // Feedback: 10
  const overallScore = Math.round(
    (guideResult.overallComplianceScore * 0.15) +
    (advocacyResult.overallScore * 0.15) +
    (awarenessResult.overallScore * 0.20) +
    (participationResult.overallScore * 0.25) +
    (complaintResult.overallScore * 0.15) +
    (feedbackResult.overallScore * 0.10),
  );

  const rating: ChildrensRightsIntelligenceResult["rating"] =
    overallScore >= 80 ? "outstanding"
    : overallScore >= 60 ? "good"
    : overallScore >= 40 ? "requires_improvement"
    : "inadequate";

  // Generate insights
  const strengths: string[] = [];
  const areasForImprovement: string[] = [];
  const actions: string[] = [];

  // Strengths
  if (guideResult.overallComplianceScore >= 80) {
    strengths.push("Children's guides are comprehensive, current, and well understood by all children");
  }
  if (advocacyResult.overallScore >= 80) {
    strengths.push("Advocacy services are proactively offered and children engage effectively with advocates");
  }
  if (awarenessResult.overallScore >= 80) {
    strengths.push("Children demonstrate strong understanding of their rights across all categories");
  }
  if (participationResult.overallScore >= 80) {
    strengths.push("Children meaningfully participate in decisions about their care with views influencing outcomes");
  }
  if (complaintResult.overallScore >= 80) {
    strengths.push("Children feel confident and able to raise complaints with accessible processes in place");
  }
  if (feedbackResult.overallScore >= 80) {
    strengths.push("Child feedback is consistently acknowledged, acted upon, and outcomes shared");
  }
  if (participationResult.viewInfluencedOutcomeRate >= 70) {
    strengths.push("Children's views demonstrably influence care decisions and outcomes");
  }

  // Areas for improvement
  if (guideResult.childrenNeedingUpdate.length > 0) {
    areasForImprovement.push(
      `${guideResult.childrenNeedingUpdate.length} children's guide(s) need updating or providing`,
    );
  }
  if (advocacyResult.childrenWithoutAdvocacyOffer.length > 0) {
    areasForImprovement.push(
      `${advocacyResult.childrenWithoutAdvocacyOffer.length} child(ren) not yet offered advocacy services`,
    );
  }
  if (awarenessResult.leastUnderstoodRights.length > 0) {
    areasForImprovement.push(
      `Rights awareness gaps in: ${awarenessResult.leastUnderstoodRights.slice(0, 3).map(getRightsCategoryLabel).join(", ")}`,
    );
  }
  if (participationResult.childrenWithLowParticipation.length > 0) {
    areasForImprovement.push(
      `${participationResult.childrenWithLowParticipation.length} child(ren) have low participation levels in decision-making`,
    );
  }
  if (complaintResult.childrenWithBarriers.length > 0) {
    areasForImprovement.push(
      `Barriers to complaint access identified for: ${complaintResult.childrenWithBarriers.join(", ")}`,
    );
  }
  if (feedbackResult.outcomeSharedRate < 70) {
    areasForImprovement.push("Outcomes of feedback not consistently shared back with children");
  }

  // Actions
  if (guideResult.overallComplianceScore < 80) {
    actions.push("Review and update all children's guides ensuring they cover complaints, advocacy, rights, and Ofsted contact");
  }
  if (advocacyResult.overallScore < 70) {
    actions.push("Ensure all children are offered independent advocacy and understand how to access it");
  }
  if (awarenessResult.overallScore < 70) {
    actions.push("Deliver age-appropriate rights awareness sessions covering least understood areas");
  }
  if (participationResult.averageParticipationLevel < 3) {
    actions.push("Develop strategies to increase children's participation from consultation to shared decision-making");
  }
  if (complaintResult.feelsAbleToComplainRate < 80) {
    actions.push("Address barriers to complaint access and ensure children feel empowered to raise concerns");
  }
  if (feedbackResult.actionTakenRate < 70) {
    actions.push("Implement 'you said, we did' feedback loop to demonstrate responsiveness to children's views");
  }

  const regulatoryLinks = [
    "CHR 2015 Reg 7 — Children's guide (provision, content, accessibility)",
    "CHR 2015 Reg 14 — Care planning (child's participation in decisions)",
    "CHR 2015 Reg 45 — Independent person (reviews, consultation with children)",
    "UNCRC Article 12 — Right to be heard in all matters affecting them",
    "UNCRC Article 13 — Freedom of expression and access to information",
    "UNCRC Article 17 — Access to appropriate information",
    "SCCIF — Experiences and progress of children and young people",
    "Children Act 1989 Section 26 — Representations and complaints procedures",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    referenceDate,
    overallScore,
    rating,
    guideCompliance: guideResult,
    advocacy: advocacyResult,
    rightsAwareness: awarenessResult,
    participation: participationResult,
    complaintAccess: complaintResult,
    feedback: feedbackResult,
    childProfiles: profiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}

// ── Label Functions ──────────────────────────────────────────────────────────

export function getRightsCategoryLabel(category: RightsCategory): string {
  const labels: Record<RightsCategory, string> = {
    know_your_rights: "Know Your Rights",
    complaints_process: "Complaints Process",
    advocacy_access: "Advocacy Access",
    participation_in_decisions: "Participation in Decisions",
    privacy: "Privacy",
    contact_with_family: "Contact with Family",
    education: "Education",
    health: "Health",
    cultural_identity: "Cultural Identity",
    leisure_and_play: "Leisure & Play",
    freedom_of_expression: "Freedom of Expression",
    protection_from_harm: "Protection from Harm",
  };
  return labels[category] || category;
}

export function getAdvocacyTypeLabel(type: AdvocacyType): string {
  const labels: Record<AdvocacyType, string> = {
    independent_advocate: "Independent Advocate",
    childrens_commissioner: "Children's Commissioner",
    ofsted_contact: "Ofsted Contact",
    social_worker: "Social Worker",
    irp: "Independent Reviewing Officer",
    nyas: "NYAS",
    childline: "Childline",
    reg44_visitor: "Reg 44 Visitor",
  };
  return labels[type] || type;
}

export function getParticipationLevelLabel(level: ParticipationLevel): string {
  const labels: Record<ParticipationLevel, string> = {
    informed: "Informed",
    consulted: "Consulted",
    involved: "Involved",
    shared_decision: "Shared Decision",
    child_led: "Child-Led",
  };
  return labels[level] || level;
}

export function getFeedbackMechanismLabel(mechanism: FeedbackMechanism): string {
  const labels: Record<FeedbackMechanism, string> = {
    house_meeting: "House Meeting",
    key_worker_session: "Key Worker Session",
    complaints_form: "Complaints Form",
    suggestion_box: "Suggestion Box",
    reg44_visit: "Reg 44 Visit",
    review_meeting: "Review Meeting",
    exit_interview: "Exit Interview",
    survey: "Survey",
    informal_chat: "Informal Chat",
  };
  return labels[mechanism] || mechanism;
}

export function getAdvocacyStatusLabel(status: AdvocacyStatus): string {
  const labels: Record<AdvocacyStatus, string> = {
    active: "Active",
    offered_declined: "Offered — Declined",
    not_offered: "Not Offered",
    completed: "Completed",
    pending: "Pending",
  };
  return labels[status] || status;
}
