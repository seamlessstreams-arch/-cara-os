// ══════════════════════════════════════════════════════════════════════════════
// Cara — Advocacy & Representation Intelligence Engine
//
// Pure deterministic engine — no AI, no external calls.
// Analyses how effectively a children's home ensures children have access
// to independent advocacy, Independent Visitors, and representation.
//
// Maps to: Children Act 1989 s26A (advocacy), CHR 2015 Reg 7 (children's
// guide / information about advocacy), UNCRC Art 12 (right to be heard),
// SCCIF, IRO Handbook 2010, Advocacy Services and Representations Procedure
// (Children) Regs 2004
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ────────────────────────────────────────────────────────────────────

export type AdvocacyType =
  | "independent_advocate"
  | "childrens_commissioner"
  | "legal_representative"
  | "independent_visitor"
  | "irp_member"
  | "other";

export type AdvocacyStatus =
  | "active"
  | "requested"
  | "pending"
  | "declined_by_child"
  | "not_offered"
  | "ended";

export type ReferralReason =
  | "complaint"
  | "care_plan_disagreement"
  | "review_support"
  | "transition"
  | "safeguarding"
  | "general_support"
  | "placement_change"
  | "exclusion"
  | "other";

export type AwarenessFormat = "verbal" | "written" | "easy_read" | "pictorial";

export type Rating = "outstanding" | "good" | "requires_improvement" | "inadequate";

// ── Interfaces ───────────────────────────────────────────────────────────────

export interface AdvocacyReferral {
  id: string;
  childId: string;
  childName: string;
  type: AdvocacyType;
  reason: ReferralReason;
  referralDate: string;
  responseDate?: string;
  status: AdvocacyStatus;
  outcome?: string;
  childSatisfaction?: number; // 1-10
}

export interface IndependentVisitor {
  id: string;
  childId: string;
  childName: string;
  visitorName: string;
  appointedDate: string;
  visitFrequency: string;
  lastVisitDate?: string;
  visitsCompleted: number;
  visitsMissed: number;
  childEngagement?: number; // 1-10
  childWishes?: string;
}

export interface AdvocacyAwareness {
  id: string;
  childId: string;
  childName: string;
  understandsRights: boolean;
  informedOfAdvocacy: boolean;
  knowsHowToAccess: boolean;
  dateInformed?: string;
  format: AwarenessFormat;
}

export interface AdvocacyPolicy {
  lastReviewed?: string;
  advocacyProvider?: string;
  contractInPlace: boolean;
  complaintsProcess: boolean;
}

export interface ChildParentalContact {
  childId: string;
  childName: string;
  hasParentalContact: boolean;
}

// ── Result Types ─────────────────────────────────────────────────────────────

export interface AccessToAdvocacyResult {
  totalReferrals: number;
  activeAdvocacyCount: number;
  childrenWithActiveAdvocacy: number;
  totalChildren: number;
  activeAdvocacyRate: number | null;
  averageResponseTimeDays: number | null;
  childSatisfactionAverage: number | null;
  complaintSupportRate: number | null;
  typeBreakdown: Record<string, number>;
  reasonBreakdown: Record<string, number>;
  childrenWithoutAdvocacy: string[];
  score: number;
}

export interface IndependentVisitorResult {
  totalVisitors: number;
  childrenWithIV: number;
  totalChildren: number;
  visitComplianceRate: number | null;
  averageEngagement: number | null;
  childrenWithoutParentalContactMissingIV: string[];
  score: number;
}

export interface AwarenessAndUnderstandingResult {
  totalAssessments: number;
  childrenAssessed: number;
  totalChildren: number;
  understandsRightsRate: number | null;
  informedOfAdvocacyRate: number | null;
  knowsHowToAccessRate: number | null;
  childrenInformedOfRightsRate: number | null;
  formatBreakdown: Record<string, number>;
  childrenNotInformed: string[];
  score: number;
}

export interface PolicyAndProvisionResult {
  policyReviewed: boolean;
  providerNamed: boolean;
  contractInPlace: boolean;
  complaintsProcess: boolean;
  score: number;
}

export interface AdvocacyChildProfile {
  childId: string;
  childName: string;
  hasActiveAdvocacy: boolean;
  advocacyTypes: AdvocacyType[];
  hasIndependentVisitor: boolean;
  // fab-0: null when the child has no IV or no visits recorded.
  ivVisitCompliance: number | null;
  informedOfRights: boolean;
  knowsHowToAccess: boolean;
  // fab-0: null when the child has no advocacy referrals to score.
  satisfaction: number | null;
  needsIV: boolean;
  overallScore: number;
  concerns: string[];
}

export interface AdvocacyRepresentationIntelligenceResult {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  referenceDate: string;
  overallScore: number;
  rating: Rating;
  accessToAdvocacy: AccessToAdvocacyResult;
  independentVisitors: IndependentVisitorResult;
  awarenessAndUnderstanding: AwarenessAndUnderstandingResult;
  policyAndProvision: PolicyAndProvisionResult;
  childProfiles: AdvocacyChildProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Scoring Weights ─────────────────────────────────────────────────────────

const WEIGHTS = {
  accessToAdvocacy: 30,
  independentVisitors: 25,
  awarenessAndUnderstanding: 25,
  policyAndProvision: 20,
} as const;

// ── Core Functions ──────────────────────────────────────────────────────────

export function evaluateAccessToAdvocacy(
  referrals: AdvocacyReferral[],
  childIds: string[],
): AccessToAdvocacyResult {
  const totalChildren = childIds.length;

  if (totalChildren === 0) {
    return {
      totalReferrals: 0,
      activeAdvocacyCount: 0,
      childrenWithActiveAdvocacy: 0,
      totalChildren: 0,
      activeAdvocacyRate: 0,
      averageResponseTimeDays: 0,
      childSatisfactionAverage: 0,
      complaintSupportRate: 0,
      typeBreakdown: {},
      reasonBreakdown: {},
      childrenWithoutAdvocacy: [],
      score: 0,
    };
  }

  const childrenWithActive = new Set<string>();
  let activeCount = 0;
  let responseTotalDays = 0;
  let responseCount = 0;
  let satisfactionTotal = 0;
  let satisfactionCount = 0;
  let complaintReferrals = 0;
  let complaintWithSupport = 0;
  const typeBreakdown: Record<string, number> = {};
  const reasonBreakdown: Record<string, number> = {};

  for (const r of referrals) {
    typeBreakdown[r.type] = (typeBreakdown[r.type] || 0) + 1;
    reasonBreakdown[r.reason] = (reasonBreakdown[r.reason] || 0) + 1;

    if (r.status === "active") {
      activeCount++;
      childrenWithActive.add(r.childId);
    }

    if (r.referralDate && r.responseDate) {
      const refDate = new Date(r.referralDate);
      const resDate = new Date(r.responseDate);
      const days = Math.max(0, Math.round((resDate.getTime() - refDate.getTime()) / (1000 * 60 * 60 * 24)));
      responseTotalDays += days;
      responseCount++;
    }

    if (r.childSatisfaction !== undefined && r.childSatisfaction >= 1 && r.childSatisfaction <= 10) {
      satisfactionTotal += r.childSatisfaction;
      satisfactionCount++;
    }

    if (r.reason === "complaint") {
      complaintReferrals++;
      if (r.status === "active" || r.status === "ended") {
        complaintWithSupport++;
      }
    }
  }

  const activeAdvocacyRate = totalChildren > 0
    ? Math.round((childrenWithActive.size / totalChildren) * 100)
    : null;

  const averageResponseTimeDays = responseCount > 0
    ? Math.round((responseTotalDays / responseCount) * 10) / 10
    : null;

  const childSatisfactionAverage = satisfactionCount > 0
    ? Math.round((satisfactionTotal / satisfactionCount) * 10) / 10
    : null;

  const complaintSupportRate = complaintReferrals > 0
    ? Math.round((complaintWithSupport / complaintReferrals) * 100)
    : 100; // No complaints = full compliance

  const childrenWithoutAdvocacy = childIds.filter(
    (id) => !referrals.some((r) => r.childId === id && (r.status === "active" || r.status === "ended" || r.status === "declined_by_child")),
  );

  // Score: active rate (30%) + response time (25%) + satisfaction (25%) + complaint support (20%)
  const activeRateNorm = Math.min((activeAdvocacyRate ?? 0) / 100, 1);
  // Response time: 0 days = 100%, ≥14 days = 0%
  const responseNorm = responseCount > 0
    ? Math.max(0, 1 - ((averageResponseTimeDays ?? 0) / 14))
    : 0.5; // No response data = neutral
  const satNorm = satisfactionCount > 0
    ? (childSatisfactionAverage ?? 0) / 10
    : 0.5;
  const complaintNorm = (complaintSupportRate ?? 0) / 100;

  const score = Math.round(
    (activeRateNorm * 0.30 + responseNorm * 0.25 + satNorm * 0.25 + complaintNorm * 0.20) * 100,
  );

  return {
    totalReferrals: referrals.length,
    activeAdvocacyCount: activeCount,
    childrenWithActiveAdvocacy: childrenWithActive.size,
    totalChildren,
    activeAdvocacyRate,
    averageResponseTimeDays,
    childSatisfactionAverage,
    complaintSupportRate,
    typeBreakdown,
    reasonBreakdown,
    childrenWithoutAdvocacy,
    score,
  };
}

export function evaluateIndependentVisitors(
  visitors: IndependentVisitor[],
  parentalContact: ChildParentalContact[],
  childIds: string[],
): IndependentVisitorResult {
  const totalChildren = childIds.length;

  if (totalChildren === 0) {
    return {
      totalVisitors: 0,
      childrenWithIV: 0,
      totalChildren: 0,
      visitComplianceRate: 0,
      averageEngagement: 0,
      childrenWithoutParentalContactMissingIV: [],
      score: 0,
    };
  }

  const childrenWithIV = new Set<string>();
  let totalCompliance = 0;
  let complianceCount = 0;
  let totalEngagement = 0;
  let engagementCount = 0;

  for (const v of visitors) {
    childrenWithIV.add(v.childId);

    const totalVisits = v.visitsCompleted + v.visitsMissed;
    if (totalVisits > 0) {
      const compliance = v.visitsCompleted / totalVisits;
      totalCompliance += compliance;
      complianceCount++;
    }

    if (v.childEngagement !== undefined && v.childEngagement >= 1 && v.childEngagement <= 10) {
      totalEngagement += v.childEngagement;
      engagementCount++;
    }
  }

  const visitComplianceRate = complianceCount > 0
    ? Math.round((totalCompliance / complianceCount) * 100)
    : null;

  const averageEngagement = engagementCount > 0
    ? Math.round((totalEngagement / engagementCount) * 10) / 10
    : null;

  // Find children without parental contact who don't have an IV
  const childrenWithoutParentalContactMissingIV = parentalContact
    .filter((pc) => !pc.hasParentalContact && !childrenWithIV.has(pc.childId))
    .map((pc) => pc.childName);

  // Score: IV coverage for those needing it (40%) + compliance (35%) + engagement (25%)
  const childrenNeedingIV = parentalContact.filter((pc) => !pc.hasParentalContact);
  const coverageRate = childrenNeedingIV.length > 0
    ? childrenNeedingIV.filter((pc) => childrenWithIV.has(pc.childId)).length / childrenNeedingIV.length
    : (visitors.length > 0 ? 1 : 0.5); // No children needing IV: if IVs exist = full, else neutral
  const complianceNorm = (visitComplianceRate ?? 0) / 100;
  const engagementNorm = engagementCount > 0 ? (averageEngagement ?? 0) / 10 : 0.5;

  const score = Math.round(
    (coverageRate * 0.40 + complianceNorm * 0.35 + engagementNorm * 0.25) * 100,
  );

  return {
    totalVisitors: visitors.length,
    childrenWithIV: childrenWithIV.size,
    totalChildren,
    visitComplianceRate,
    averageEngagement,
    childrenWithoutParentalContactMissingIV,
    score,
  };
}

export function evaluateAwarenessAndUnderstanding(
  awareness: AdvocacyAwareness[],
  childIds: string[],
): AwarenessAndUnderstandingResult {
  const totalChildren = childIds.length;

  if (totalChildren === 0) {
    return {
      totalAssessments: 0,
      childrenAssessed: 0,
      totalChildren: 0,
      understandsRightsRate: 0,
      informedOfAdvocacyRate: 0,
      knowsHowToAccessRate: 0,
      childrenInformedOfRightsRate: 0,
      formatBreakdown: {},
      childrenNotInformed: [],
      score: 0,
    };
  }

  // Latest assessment per child
  const latestByChild = new Map<string, AdvocacyAwareness>();
  for (const a of awareness) {
    const existing = latestByChild.get(a.childId);
    if (!existing || (a.dateInformed && existing.dateInformed && a.dateInformed > existing.dateInformed)) {
      latestByChild.set(a.childId, a);
    } else if (!existing) {
      latestByChild.set(a.childId, a);
    }
  }

  const childrenAssessed = latestByChild.size;
  let understandsRights = 0;
  let informedOfAdvocacy = 0;
  let knowsHowToAccess = 0;
  const formatBreakdown: Record<string, number> = {};

  for (const a of latestByChild.values()) {
    if (a.understandsRights) understandsRights++;
    if (a.informedOfAdvocacy) informedOfAdvocacy++;
    if (a.knowsHowToAccess) knowsHowToAccess++;
    formatBreakdown[a.format] = (formatBreakdown[a.format] || 0) + 1;
  }

  const n = Math.max(childrenAssessed, 1);
  const understandsRightsRate = Math.round((understandsRights / n) * 100);
  const informedOfAdvocacyRate = Math.round((informedOfAdvocacy / n) * 100);
  const knowsHowToAccessRate = Math.round((knowsHowToAccess / n) * 100);
  const childrenInformedOfRightsRate = Math.round((childrenAssessed / totalChildren) * 100);

  const childrenNotInformed = childIds.filter((id) => !latestByChild.has(id));
  const childrenNotInformedNames = childrenNotInformed.map((id) => {
    const record = awareness.find((a) => a.childId === id);
    return record ? record.childName : id;
  });

  // Score: coverage (25%) + understands rights (25%) + informed of advocacy (25%) + knows access (25%)
  const coverageNorm = childrenInformedOfRightsRate / 100;
  const rightsNorm = understandsRightsRate / 100;
  const informedNorm = informedOfAdvocacyRate / 100;
  const accessNorm = knowsHowToAccessRate / 100;

  const score = Math.round(
    (coverageNorm * 0.25 + rightsNorm * 0.25 + informedNorm * 0.25 + accessNorm * 0.25) * 100,
  );

  return {
    totalAssessments: awareness.length,
    childrenAssessed,
    totalChildren,
    understandsRightsRate,
    informedOfAdvocacyRate,
    knowsHowToAccessRate,
    childrenInformedOfRightsRate,
    formatBreakdown,
    childrenNotInformed: childrenNotInformedNames,
    score,
  };
}

export function evaluatePolicyAndProvision(
  policy: AdvocacyPolicy,
): PolicyAndProvisionResult {
  let score = 0;

  const policyReviewed = !!policy.lastReviewed;
  const providerNamed = !!policy.advocacyProvider;
  const contractInPlace = policy.contractInPlace;
  const complaintsProcess = policy.complaintsProcess;

  // Score: reviewed (25%) + provider (25%) + contract (25%) + complaints (25%)
  if (policyReviewed) score += 25;
  if (providerNamed) score += 25;
  if (contractInPlace) score += 25;
  if (complaintsProcess) score += 25;

  return {
    policyReviewed,
    providerNamed,
    contractInPlace,
    complaintsProcess,
    score,
  };
}

// ── Build Child Profiles ────────────────────────────────────────────────────

export function buildAdvocacyChildProfiles(
  referrals: AdvocacyReferral[],
  visitors: IndependentVisitor[],
  awareness: AdvocacyAwareness[],
  parentalContact: ChildParentalContact[],
  childIds: string[],
  childNames: Record<string, string>,
): AdvocacyChildProfile[] {
  return childIds.map((childId) => {
    const childName = childNames[childId] || childId;

    // Advocacy referrals for this child
    const childReferrals = referrals.filter((r) => r.childId === childId);
    const hasActiveAdvocacy = childReferrals.some((r) => r.status === "active");
    const advocacyTypes = [...new Set(childReferrals.map((r) => r.type))];

    // Satisfaction
    const satValues = childReferrals
      .filter((r) => r.childSatisfaction !== undefined && r.childSatisfaction >= 1 && r.childSatisfaction <= 10)
      .map((r) => r.childSatisfaction!);
    const satisfaction = satValues.length > 0
      ? Math.round((satValues.reduce((a, b) => a + b, 0) / satValues.length) * 10) / 10
      : null;

    // Independent Visitor
    const childVisitors = visitors.filter((v) => v.childId === childId);
    const hasIndependentVisitor = childVisitors.length > 0;
    let ivVisitCompliance: number | null = null;
    if (childVisitors.length > 0) {
      const totalVisits = childVisitors.reduce(
        (sum, v) => sum + v.visitsCompleted + v.visitsMissed, 0,
      );
      const completed = childVisitors.reduce(
        (sum, v) => sum + v.visitsCompleted, 0,
      );
      ivVisitCompliance = totalVisits > 0 ? Math.round((completed / totalVisits) * 100) : null;
    }

    // Awareness
    const childAwareness = awareness.filter((a) => a.childId === childId);
    const latestAwareness = childAwareness.length > 0
      ? childAwareness.reduce((latest, a) => {
          if (!latest.dateInformed) return a;
          if (!a.dateInformed) return latest;
          return a.dateInformed > latest.dateInformed ? a : latest;
        })
      : null;
    const informedOfRights = latestAwareness?.understandsRights ?? false;
    const knowsHowToAccess = latestAwareness?.knowsHowToAccess ?? false;

    // Does child need IV (no parental contact)?
    const contactRecord = parentalContact.find((pc) => pc.childId === childId);
    const needsIV = contactRecord ? !contactRecord.hasParentalContact : false;

    // Concerns
    const concerns: string[] = [];
    if (needsIV && !hasIndependentVisitor) {
      concerns.push("No Independent Visitor assigned despite no parental contact");
    }
    if (!informedOfRights) {
      concerns.push("Not informed of rights or does not understand them");
    }
    if (!knowsHowToAccess) {
      concerns.push("Does not know how to access advocacy services");
    }
    if (childReferrals.length === 0) {
      concerns.push("No advocacy referral on record");
    }
    if (hasIndependentVisitor && ivVisitCompliance !== null && ivVisitCompliance < 75) {
      concerns.push("Independent Visitor visit compliance below 75%");
    }

    // Overall score for child
    const advocacyScore = hasActiveAdvocacy ? 30 : (childReferrals.some((r) => r.status === "declined_by_child") ? 20 : 0);
    const ivScore = (() => {
      if (!needsIV) return 25; // Not required
      if (hasIndependentVisitor) return Math.round(((ivVisitCompliance ?? 0) / 100) * 25);
      return 0;
    })();
    const awarenessScore = ((informedOfRights ? 1 : 0) + (knowsHowToAccess ? 1 : 0)) / 2 * 25;
    const satScore = satisfaction !== null && satisfaction > 0 ? (satisfaction / 10) * 20 : 10; // Neutral if no data
    const overallScore = Math.round(advocacyScore + ivScore + awarenessScore + satScore);

    return {
      childId,
      childName,
      hasActiveAdvocacy,
      advocacyTypes,
      hasIndependentVisitor,
      ivVisitCompliance,
      informedOfRights,
      knowsHowToAccess,
      satisfaction,
      needsIV,
      overallScore,
      concerns,
    };
  });
}

// ── Main Intelligence Function ──────────────────────────────────────────────

export function generateAdvocacyRepresentationIntelligence(
  referrals: AdvocacyReferral[],
  visitors: IndependentVisitor[],
  awareness: AdvocacyAwareness[],
  policy: AdvocacyPolicy,
  parentalContact: ChildParentalContact[],
  childIds: string[],
  childNames: Record<string, string>,
  homeId: string,
  periodStart: string,
  periodEnd: string,
  referenceDate: string,
): AdvocacyRepresentationIntelligenceResult {
  const accessResult = evaluateAccessToAdvocacy(referrals, childIds);
  const ivResult = evaluateIndependentVisitors(visitors, parentalContact, childIds);
  const awarenessResult = evaluateAwarenessAndUnderstanding(awareness, childIds);
  const policyResult = evaluatePolicyAndProvision(policy);

  const profiles = buildAdvocacyChildProfiles(
    referrals, visitors, awareness, parentalContact, childIds, childNames,
  );

  // Weighted scoring: access(30) + IV(25) + awareness(25) + policy(20) = 100
  const overallScore = Math.round(
    (accessResult.score * WEIGHTS.accessToAdvocacy / 100) +
    (ivResult.score * WEIGHTS.independentVisitors / 100) +
    (awarenessResult.score * WEIGHTS.awarenessAndUnderstanding / 100) +
    (policyResult.score * WEIGHTS.policyAndProvision / 100),
  );

  const rating: Rating =
    overallScore >= 80 ? "outstanding"
    : overallScore >= 60 ? "good"
    : overallScore >= 40 ? "requires_improvement"
    : "inadequate";

  // Generate insights
  const strengths: string[] = [];
  const areasForImprovement: string[] = [];
  const actions: string[] = [];

  // Strengths
  if (accessResult.score >= 80) {
    strengths.push("Children have excellent access to independent advocacy services with high satisfaction rates");
  }
  if (ivResult.score >= 80) {
    strengths.push("Independent Visitor programme is well-established with strong visit compliance and child engagement");
  }
  if (awarenessResult.score >= 80) {
    strengths.push("Children demonstrate strong awareness of their rights and know how to access advocacy services");
  }
  if (policyResult.score >= 80) {
    strengths.push("Robust advocacy policy in place with named provider and active contract");
  }
  if ((accessResult.childSatisfactionAverage ?? 0) >= 8) {
    strengths.push("Child satisfaction with advocacy services is exceptionally high");
  }
  if ((accessResult.averageResponseTimeDays ?? 0) > 0 && (accessResult.averageResponseTimeDays ?? 0) <= 2) {
    strengths.push("Advocacy referrals receive rapid responses within expected timescales");
  }
  if ((ivResult.visitComplianceRate ?? 0) >= 90) {
    strengths.push("Independent Visitor visits are consistently maintained with high compliance");
  }
  if ((awarenessResult.childrenInformedOfRightsRate ?? 0) === 100) {
    strengths.push("All children have been informed of their advocacy rights");
  }
  if ((accessResult.complaintSupportRate ?? 0) === 100 && referrals.some((r) => r.reason === "complaint")) {
    strengths.push("All children making complaints are supported with advocacy");
  }

  // Areas for improvement
  if (accessResult.childrenWithoutAdvocacy.length > 0) {
    areasForImprovement.push(
      `${accessResult.childrenWithoutAdvocacy.length} child(ren) have no record of advocacy being offered or accessed`,
    );
  }
  if (ivResult.childrenWithoutParentalContactMissingIV.length > 0) {
    areasForImprovement.push(
      `${ivResult.childrenWithoutParentalContactMissingIV.length} child(ren) without parental contact do not have an Independent Visitor: ${ivResult.childrenWithoutParentalContactMissingIV.join(", ")}`,
    );
  }
  if (awarenessResult.childrenNotInformed.length > 0) {
    areasForImprovement.push(
      `${awarenessResult.childrenNotInformed.length} child(ren) have not been informed of their advocacy rights`,
    );
  }
  if ((accessResult.averageResponseTimeDays ?? 0) > 5) {
    areasForImprovement.push(
      `Average advocacy referral response time of ${accessResult.averageResponseTimeDays} days exceeds expected timescales`,
    );
  }
  if ((accessResult.childSatisfactionAverage ?? 0) > 0 && (accessResult.childSatisfactionAverage ?? 0) < 6) {
    areasForImprovement.push("Child satisfaction with advocacy services is below expectations");
  }
  if ((ivResult.visitComplianceRate ?? 0) < 75 && ivResult.totalVisitors > 0) {
    areasForImprovement.push(
      `Independent Visitor visit compliance at ${ivResult.visitComplianceRate}% is below the 75% target`,
    );
  }
  if (!policyResult.policyReviewed) {
    areasForImprovement.push("Advocacy policy has not been reviewed within the expected timescale");
  }
  if (!policyResult.contractInPlace) {
    areasForImprovement.push("No formal contract in place with advocacy provider");
  }

  // Actions
  if (ivResult.childrenWithoutParentalContactMissingIV.length > 0) {
    actions.push("Urgently arrange Independent Visitors for all children without parental contact who do not currently have one");
  }
  if (accessResult.score < 60) {
    actions.push("Review advocacy referral processes to ensure all children are offered and can access independent advocacy");
  }
  if (awarenessResult.score < 60) {
    actions.push("Deliver age-appropriate sessions to ensure all children understand their advocacy rights and how to access them");
  }
  if ((accessResult.averageResponseTimeDays ?? 0) > 5) {
    actions.push("Review advocacy provider response timescales and escalate delays");
  }
  if (!policyResult.policyReviewed) {
    actions.push("Review and update advocacy policy in line with current legislation and guidance");
  }
  if (!policyResult.contractInPlace) {
    actions.push("Establish a formal contract with an independent advocacy provider");
  }
  if ((ivResult.visitComplianceRate ?? 0) < 75 && ivResult.totalVisitors > 0) {
    actions.push("Work with Independent Visitors to improve visit consistency and address barriers to attendance");
  }
  if ((awarenessResult.knowsHowToAccessRate ?? 0) < 80) {
    actions.push("Provide all children with clear, accessible information on how to access advocacy services");
  }
  if ((accessResult.childSatisfactionAverage ?? 0) > 0 && (accessResult.childSatisfactionAverage ?? 0) < 6) {
    actions.push("Seek detailed feedback from children on how advocacy services can be improved");
  }

  const regulatoryLinks = [
    "Children Act 1989 s26A — Advocacy services for looked-after children and care leavers",
    "CHR 2015 Reg 7 — Children's guide must include information about advocacy and how to access it",
    "UNCRC Article 12 — The right of the child to be heard in all matters affecting them",
    "SCCIF — The experiences and progress of children and young people (voice of the child)",
    "IRO Handbook 2010 — Independent Reviewing Officers must ensure children are offered advocacy",
    "Advocacy Services and Representations Procedure (Children) Regs 2004 — Statutory advocacy provision",
    "Children Act 1989 s23ZB — Independent Visitors for looked-after children",
    "Care Planning, Placement and Case Review Regulations 2010 — Reg 21 (Independent Visitors)",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    referenceDate,
    overallScore,
    rating,
    accessToAdvocacy: accessResult,
    independentVisitors: ivResult,
    awarenessAndUnderstanding: awarenessResult,
    policyAndProvision: policyResult,
    childProfiles: profiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}

// ── Label Functions ─────────────────────────────────────────────────────────

export function getAdvocacyTypeLabel(type: AdvocacyType): string {
  const labels: Record<AdvocacyType, string> = {
    independent_advocate: "Independent Advocate",
    childrens_commissioner: "Children's Commissioner",
    legal_representative: "Legal Representative",
    independent_visitor: "Independent Visitor",
    irp_member: "IRP Member",
    other: "Other",
  };
  return labels[type] || type;
}

export function getAdvocacyStatusLabel(status: AdvocacyStatus): string {
  const labels: Record<AdvocacyStatus, string> = {
    active: "Active",
    requested: "Requested",
    pending: "Pending",
    declined_by_child: "Declined by Child",
    not_offered: "Not Offered",
    ended: "Ended",
  };
  return labels[status] || status;
}

export function getReferralReasonLabel(reason: ReferralReason): string {
  const labels: Record<ReferralReason, string> = {
    complaint: "Complaint",
    care_plan_disagreement: "Care Plan Disagreement",
    review_support: "Review Support",
    transition: "Transition",
    safeguarding: "Safeguarding",
    general_support: "General Support",
    placement_change: "Placement Change",
    exclusion: "Exclusion",
    other: "Other",
  };
  return labels[reason] || reason;
}

export function getAwarenessFormatLabel(format: AwarenessFormat): string {
  const labels: Record<AwarenessFormat, string> = {
    verbal: "Verbal",
    written: "Written",
    easy_read: "Easy Read",
    pictorial: "Pictorial",
  };
  return labels[format] || format;
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
