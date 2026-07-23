// ══════════════════════════════════════════════════════════════════════════════
// PARENTAL ENGAGEMENT INTELLIGENCE ENGINE
//
// Pure deterministic engine for analysing parental engagement quality,
// contact patterns, family support effectiveness, and partnership working.
//
// Regulatory basis:
//   - CHR 2015, Reg 7 — Children's wishes and feelings (including family)
//   - CHR 2015, Reg 22 — Contact arrangements
//   - SCCIF — "Experiences and progress" — family engagement
//   - Working Together 2023 — Partnership with parents
//
// No AI. No external calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

import { withinPeriod } from "@/lib/date-period";
import { below, meets, rateOf, weightedMeanOf } from "@/lib/metrics/rate";

// ── Types ──────────────────────────────────────────────────────────────────

export type ContactType =
  | "face_to_face"
  | "phone"
  | "video_call"
  | "letter"
  | "email"
  | "supervised"
  | "community_outing";

export type ContactOutcome =
  | "positive"
  | "neutral"
  | "negative"
  | "child_refused"
  | "parent_no_show"
  | "cancelled_by_professional";

export type EngagementLevel =
  | "highly_engaged"
  | "engaged"
  | "inconsistent"
  | "disengaged"
  | "hostile"
  | "no_contact";

export type SupportType =
  | "transport"
  | "venue"
  | "mediation"
  | "parenting_support"
  | "therapeutic"
  | "financial"
  | "practical";

export type Relationship =
  | "mother"
  | "father"
  | "step_parent"
  | "grandparent"
  | "sibling"
  | "other";

export type SupportEffectiveness =
  | "effective"
  | "partially_effective"
  | "ineffective"
  | "too_early_to_tell";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface ContactRecord {
  id: string;
  homeId: string;
  childId: string;
  childName: string;
  parentId: string;
  parentName: string;
  relationship: Relationship;
  contactDate: string;
  contactType: ContactType;
  duration: number; // minutes
  supervisedBy?: string;
  location: string;
  outcome: ContactOutcome;
  childMoodBefore: number; // 1-10
  childMoodAfter: number; // 1-10
  parentEngagement: number; // 1-10
  staffObservations: string;
  issuesRaised: string[];
  positiveInteractions: string[];
  followUpNeeded: boolean;
  followUpCompleted?: boolean;
}

export interface ParentalSupportRecord {
  id: string;
  homeId: string;
  parentId: string;
  parentName: string;
  childId: string;
  childName: string;
  supportType: SupportType;
  description: string;
  startDate: string;
  endDate?: string;
  ongoing: boolean;
  effectiveness: SupportEffectiveness;
  referralMade: boolean;
  referralTo?: string;
}

export interface FamilyPlanRecord {
  id: string;
  homeId: string;
  childId: string;
  childName: string;
  planDate: string;
  reviewDate: string;
  nextReviewDate: string;
  goalsSet: number;
  goalsAchieved: number;
  goalsPartiallyAchieved: number;
  familyInvolved: boolean;
  childInvolved: boolean;
  professionalInvolved: boolean;
  barriers: string[];
  strengthsIdentified: string[];
}

export interface ParentalFeedbackRecord {
  id: string;
  homeId: string;
  parentId: string;
  parentName: string;
  childId: string;
  date: string;
  satisfactionScore: number; // 1-10
  communicationScore: number; // 1-10
  involvementScore: number; // 1-10
  comments: string;
  areasForImprovement: string[];
  positiveAspects: string[];
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface ContactQualityResult {
  totalContacts: number;
  contactsByType: Record<ContactType, number>;
  outcomeDistribution: Record<ContactOutcome, number>;
  positiveOutcomeRate: number;
  averageMoodBefore: number;
  averageMoodAfter: number;
  moodUpliftRate: number;
  averageParentEngagement: number;
  followUpNeededCount: number;
  followUpCompletedCount: number;
  followUpCompletionRate: number | null;   // null when no contact needed a follow-up
  childRefusalCount: number;
  childRefusalRate: number;
  parentNoShowCount: number;
  parentNoShowRate: number;
  averageDurationMinutes: number;
  contactFrequencyPerChild: Record<string, number>;
  score: number;
}

export interface ParentalSupportResult {
  totalSupports: number;
  supportsByType: Record<SupportType, number>;
  activeSupports: number;
  completedSupports: number;
  effectivenessBreakdown: Record<SupportEffectiveness, number>;
  effectiveRate: number;
  referralsMade: number;
  referralRate: number;
  parentsReceivingSupport: number;
  childrenCovered: number;
  score: number;
}

export interface FamilyPlanningResult {
  totalPlans: number;
  totalGoalsSet: number;
  totalGoalsAchieved: number;
  totalGoalsPartiallyAchieved: number;
  goalAchievementRate: number;
  familyInvolvementRate: number;
  childInvolvementRate: number;
  professionalInvolvementRate: number;
  currentPlans: number;
  overduePlans: number;
  commonBarriers: { barrier: string; count: number }[];
  commonStrengths: { strength: string; count: number }[];
  score: number;
}

export interface ParentalFeedbackResult {
  totalFeedbacks: number;
  averageSatisfaction: number;
  averageCommunication: number;
  averageInvolvement: number;
  overallAverageFeedback: number;
  commonImprovements: { area: string; count: number }[];
  commonPositives: { aspect: string; count: number }[];
  score: number;
}

export interface FamilyProfile {
  childId: string;
  childName: string;
  parents: {
    parentId: string;
    parentName: string;
    relationship: Relationship;
    engagementLevel: EngagementLevel;
    contactCount: number;
    positiveContactRate: number;
    averageEngagementScore: number;
    supportsProvided: number;
    feedbackGiven: number;
  }[];
  totalContacts: number;
  positiveContactRate: number;
  averageMoodUplift: number;
  activeFamilyPlan: boolean;
  goalAchievementRate: number;
}

export interface ParentalEngagementIntelligenceResult {
  homeId: string;
  assessedAt: string;
  periodStart: string;
  periodEnd: string;

  overallScore: number;
  rating: Rating;

  contactQuality: ContactQualityResult;
  parentalSupport: ParentalSupportResult;
  familyPlanning: FamilyPlanningResult;
  parentalFeedback: ParentalFeedbackResult;

  familyProfiles: FamilyProfile[];

  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Core: Evaluate Contact Quality ────────────────────────────────────────

export function evaluateContactQuality(contacts: ContactRecord[]): ContactQualityResult {
  if (contacts.length === 0) {
    return {
      totalContacts: 0,
      contactsByType: buildContactTypeMap(),
      outcomeDistribution: buildOutcomeMap(),
      positiveOutcomeRate: 0,
      averageMoodBefore: 0,
      averageMoodAfter: 0,
      moodUpliftRate: 0,
      averageParentEngagement: 0,
      followUpNeededCount: 0,
      followUpCompletedCount: 0,
      followUpCompletionRate: null,
      childRefusalCount: 0,
      childRefusalRate: 0,
      parentNoShowCount: 0,
      parentNoShowRate: 0,
      averageDurationMinutes: 0,
      contactFrequencyPerChild: {},
      score: 0,
    };
  }

  const contactsByType = buildContactTypeMap();
  for (const c of contacts) {
    contactsByType[c.contactType]++;
  }

  const outcomeDistribution = buildOutcomeMap();
  for (const c of contacts) {
    outcomeDistribution[c.outcome]++;
  }

  const positiveCount = contacts.filter((c) => c.outcome === "positive").length;
  const positiveOutcomeRate = Math.round((positiveCount / contacts.length) * 100);

  const averageMoodBefore = roundTo2(
    contacts.reduce((sum, c) => sum + c.childMoodBefore, 0) / contacts.length,
  );
  const averageMoodAfter = roundTo2(
    contacts.reduce((sum, c) => sum + c.childMoodAfter, 0) / contacts.length,
  );

  // Mood uplift: contacts where mood improved or stayed high (>=7)
  const moodUpliftContacts = contacts.filter(
    (c) => c.childMoodAfter > c.childMoodBefore || (c.childMoodBefore >= 7 && c.childMoodAfter >= 7),
  );
  const moodUpliftRate = Math.round((moodUpliftContacts.length / contacts.length) * 100);

  const averageParentEngagement = roundTo2(
    contacts.reduce((sum, c) => sum + c.parentEngagement, 0) / contacts.length,
  );

  // Null when no contact called for a follow-up — nothing was owed, which is
  // not the same as everything owed having been done.
  const followUpNeeded = contacts.filter((c) => c.followUpNeeded);
  const followUpCompleted = followUpNeeded.filter((c) => c.followUpCompleted === true);
  const followUpCompletionRate = rateOf(followUpCompleted, followUpNeeded);

  const childRefusalCount = contacts.filter((c) => c.outcome === "child_refused").length;
  const childRefusalRate = Math.round((childRefusalCount / contacts.length) * 100);

  const parentNoShowCount = contacts.filter((c) => c.outcome === "parent_no_show").length;
  const parentNoShowRate = Math.round((parentNoShowCount / contacts.length) * 100);

  const averageDurationMinutes = Math.round(
    contacts.reduce((sum, c) => sum + c.duration, 0) / contacts.length,
  );

  const contactFrequencyPerChild: Record<string, number> = {};
  for (const c of contacts) {
    contactFrequencyPerChild[c.childId] = (contactFrequencyPerChild[c.childId] || 0) + 1;
  }

  // Score (max 30 points)
  let score = 0;

  // Frequency: at least some contacts exist — up to 6 points
  const avgContactsPerChild = Object.keys(contactFrequencyPerChild).length > 0
    ? Object.values(contactFrequencyPerChild).reduce((s, v) => s + v, 0) / Object.keys(contactFrequencyPerChild).length
    : 0;
  score += Math.min(6, avgContactsPerChild * 1.5);

  // Positive outcomes, mood uplift and follow-up completion — 20 points between
  // them. Follow-up drops out when nothing needed following up, and the other
  // two carry the full 20 rather than the missing limb scoring as perfect.
  score += ((weightedMeanOf([
    { score: positiveOutcomeRate, weight: 8 },
    { score: moodUpliftRate, weight: 8 },
    { score: followUpCompletionRate, weight: 4 },
  ]) ?? 0) / 100) * 20;

  // Low refusal/no-show bonus — up to 4 points
  const problemRate = (childRefusalCount + parentNoShowCount) / contacts.length;
  score += Math.max(0, 4 - problemRate * 8);

  score = Math.max(0, Math.min(30, Math.round(score)));

  return {
    totalContacts: contacts.length,
    contactsByType,
    outcomeDistribution,
    positiveOutcomeRate,
    averageMoodBefore,
    averageMoodAfter,
    moodUpliftRate,
    averageParentEngagement,
    followUpNeededCount: followUpNeeded.length,
    followUpCompletedCount: followUpCompleted.length,
    followUpCompletionRate,
    childRefusalCount,
    childRefusalRate,
    parentNoShowCount,
    parentNoShowRate,
    averageDurationMinutes,
    contactFrequencyPerChild,
    score,
  };
}

// ── Core: Evaluate Parental Support ───────────────────────────────────────

export function evaluateParentalSupport(support: ParentalSupportRecord[]): ParentalSupportResult {
  if (support.length === 0) {
    return {
      totalSupports: 0,
      supportsByType: buildSupportTypeMap(),
      activeSupports: 0,
      completedSupports: 0,
      effectivenessBreakdown: buildEffectivenessMap(),
      effectiveRate: 0,
      referralsMade: 0,
      referralRate: 0,
      parentsReceivingSupport: 0,
      childrenCovered: 0,
      score: 0,
    };
  }

  const supportsByType = buildSupportTypeMap();
  for (const s of support) {
    supportsByType[s.supportType]++;
  }

  const activeSupports = support.filter((s) => s.ongoing).length;
  const completedSupports = support.filter((s) => !s.ongoing && s.endDate).length;

  const effectivenessBreakdown = buildEffectivenessMap();
  for (const s of support) {
    effectivenessBreakdown[s.effectiveness]++;
  }

  const effectiveCount = support.filter(
    (s) => s.effectiveness === "effective" || s.effectiveness === "partially_effective",
  ).length;
  const effectiveRate = Math.round((effectiveCount / support.length) * 100);

  const referralsMade = support.filter((s) => s.referralMade).length;
  const referralRate = Math.round((referralsMade / support.length) * 100);

  const uniqueParents = new Set(support.map((s) => s.parentId));
  const uniqueChildren = new Set(support.map((s) => s.childId));

  // Score (max 20 points)
  let score = 0;

  // Support coverage — up to 6 points
  const coverageRate = uniqueChildren.size > 0 ? 1 : 0;
  score += coverageRate * 6;

  // Effectiveness — up to 8 points
  score += (effectiveRate / 100) * 8;

  // Referral completion — up to 3 points
  score += (referralRate / 100) * 3;

  // Active vs completed balance — up to 3 points
  if (support.length > 0) {
    const hasActive = activeSupports > 0;
    const hasCompleted = completedSupports > 0;
    if (hasActive && hasCompleted) {
      score += 3;
    } else if (hasActive || hasCompleted) {
      score += 1.5;
    }
  }

  score = Math.max(0, Math.min(20, Math.round(score)));

  return {
    totalSupports: support.length,
    supportsByType,
    activeSupports,
    completedSupports,
    effectivenessBreakdown,
    effectiveRate,
    referralsMade,
    referralRate,
    parentsReceivingSupport: uniqueParents.size,
    childrenCovered: uniqueChildren.size,
    score,
  };
}

// ── Core: Evaluate Family Planning ────────────────────────────────────────

export function evaluateFamilyPlanning(
  plans: FamilyPlanRecord[],
  referenceDate?: string,
): FamilyPlanningResult {
  if (plans.length === 0) {
    return {
      totalPlans: 0,
      totalGoalsSet: 0,
      totalGoalsAchieved: 0,
      totalGoalsPartiallyAchieved: 0,
      goalAchievementRate: 0,
      familyInvolvementRate: 0,
      childInvolvementRate: 0,
      professionalInvolvementRate: 0,
      currentPlans: 0,
      overduePlans: 0,
      commonBarriers: [],
      commonStrengths: [],
      score: 0,
    };
  }

  const totalGoalsSet = plans.reduce((sum, p) => sum + p.goalsSet, 0);
  const totalGoalsAchieved = plans.reduce((sum, p) => sum + p.goalsAchieved, 0);
  const totalGoalsPartiallyAchieved = plans.reduce((sum, p) => sum + p.goalsPartiallyAchieved, 0);

  const goalAchievementRate =
    totalGoalsSet > 0
      ? Math.round(((totalGoalsAchieved + totalGoalsPartiallyAchieved * 0.5) / totalGoalsSet) * 100)
      : 0;

  const familyInvolvementRate = Math.round(
    (plans.filter((p) => p.familyInvolved).length / plans.length) * 100,
  );
  const childInvolvementRate = Math.round(
    (plans.filter((p) => p.childInvolved).length / plans.length) * 100,
  );
  const professionalInvolvementRate = Math.round(
    (plans.filter((p) => p.professionalInvolved).length / plans.length) * 100,
  );

  const refDate = referenceDate || new Date().toISOString().split("T")[0];

  const currentPlans = plans.filter((p) => p.nextReviewDate >= refDate).length;
  const overduePlans = plans.filter((p) => p.nextReviewDate < refDate).length;

  // Count barriers
  const barrierCounts = new Map<string, number>();
  for (const p of plans) {
    for (const b of p.barriers) {
      barrierCounts.set(b, (barrierCounts.get(b) || 0) + 1);
    }
  }
  const commonBarriers = [...barrierCounts.entries()]
    .map(([barrier, count]) => ({ barrier, count }))
    .sort((a, b) => b.count - a.count);

  // Count strengths
  const strengthCounts = new Map<string, number>();
  for (const p of plans) {
    for (const s of p.strengthsIdentified) {
      strengthCounts.set(s, (strengthCounts.get(s) || 0) + 1);
    }
  }
  const commonStrengths = [...strengthCounts.entries()]
    .map(([strength, count]) => ({ strength, count }))
    .sort((a, b) => b.count - a.count);

  // Score (max 25 points)
  let score = 0;

  // Goal achievement — up to 10 points
  score += (goalAchievementRate / 100) * 10;

  // Plan currency — up to 5 points
  const currencyRate = plans.length > 0 ? currentPlans / plans.length : 0;
  score += currencyRate * 5;

  // Family involvement — up to 5 points
  score += (familyInvolvementRate / 100) * 5;

  // Child involvement — up to 3 points
  score += (childInvolvementRate / 100) * 3;

  // Professional involvement — up to 2 points
  score += (professionalInvolvementRate / 100) * 2;

  score = Math.max(0, Math.min(25, Math.round(score)));

  return {
    totalPlans: plans.length,
    totalGoalsSet,
    totalGoalsAchieved,
    totalGoalsPartiallyAchieved,
    goalAchievementRate,
    familyInvolvementRate,
    childInvolvementRate,
    professionalInvolvementRate,
    currentPlans,
    overduePlans,
    commonBarriers,
    commonStrengths,
    score,
  };
}

// ── Core: Evaluate Parental Feedback ──────────────────────────────────────

export function evaluateParentalFeedback(
  feedback: ParentalFeedbackRecord[],
): ParentalFeedbackResult {
  if (feedback.length === 0) {
    return {
      totalFeedbacks: 0,
      averageSatisfaction: 0,
      averageCommunication: 0,
      averageInvolvement: 0,
      overallAverageFeedback: 0,
      commonImprovements: [],
      commonPositives: [],
      score: 0,
    };
  }

  const averageSatisfaction = roundTo2(
    feedback.reduce((sum, f) => sum + f.satisfactionScore, 0) / feedback.length,
  );
  const averageCommunication = roundTo2(
    feedback.reduce((sum, f) => sum + f.communicationScore, 0) / feedback.length,
  );
  const averageInvolvement = roundTo2(
    feedback.reduce((sum, f) => sum + f.involvementScore, 0) / feedback.length,
  );
  const overallAverageFeedback = roundTo2(
    (averageSatisfaction + averageCommunication + averageInvolvement) / 3,
  );

  // Count improvement areas
  const improvementCounts = new Map<string, number>();
  for (const f of feedback) {
    for (const area of f.areasForImprovement) {
      improvementCounts.set(area, (improvementCounts.get(area) || 0) + 1);
    }
  }
  const commonImprovements = [...improvementCounts.entries()]
    .map(([area, count]) => ({ area, count }))
    .sort((a, b) => b.count - a.count);

  // Count positive aspects
  const positiveCounts = new Map<string, number>();
  for (const f of feedback) {
    for (const aspect of f.positiveAspects) {
      positiveCounts.set(aspect, (positiveCounts.get(aspect) || 0) + 1);
    }
  }
  const commonPositives = [...positiveCounts.entries()]
    .map(([aspect, count]) => ({ aspect, count }))
    .sort((a, b) => b.count - a.count);

  // Score (max 25 points)
  let score = 0;

  // Satisfaction — up to 10 points
  score += (averageSatisfaction / 10) * 10;

  // Communication — up to 8 points
  score += (averageCommunication / 10) * 8;

  // Involvement — up to 7 points
  score += (averageInvolvement / 10) * 7;

  score = Math.max(0, Math.min(25, Math.round(score)));

  return {
    totalFeedbacks: feedback.length,
    averageSatisfaction,
    averageCommunication,
    averageInvolvement,
    overallAverageFeedback,
    commonImprovements,
    commonPositives,
    score,
  };
}

// ── Core: Build Family Profiles ───────────────────────────────────────────

export function buildFamilyProfiles(
  contacts: ContactRecord[],
  support: ParentalSupportRecord[],
  plans: FamilyPlanRecord[],
  feedback: ParentalFeedbackRecord[],
  childIds: string[],
): FamilyProfile[] {
  return childIds.map((childId) => {
    const childContacts = contacts.filter((c) => c.childId === childId);
    const childName =
      childContacts[0]?.childName ??
      plans.find((p) => p.childId === childId)?.childName ??
      support.find((s) => s.childId === childId)?.childName ??
      childId;

    // Build per-parent profiles
    const parentMap = new Map<
      string,
      {
        parentId: string;
        parentName: string;
        relationship: Relationship;
        contacts: ContactRecord[];
        supports: ParentalSupportRecord[];
        feedbacks: ParentalFeedbackRecord[];
      }
    >();

    for (const c of childContacts) {
      if (!parentMap.has(c.parentId)) {
        parentMap.set(c.parentId, {
          parentId: c.parentId,
          parentName: c.parentName,
          relationship: c.relationship,
          contacts: [],
          supports: [],
          feedbacks: [],
        });
      }
      parentMap.get(c.parentId)!.contacts.push(c);
    }

    // Add supports keyed by parent
    const childSupports = support.filter((s) => s.childId === childId);
    for (const s of childSupports) {
      if (!parentMap.has(s.parentId)) {
        parentMap.set(s.parentId, {
          parentId: s.parentId,
          parentName: s.parentName,
          relationship: "other",
          contacts: [],
          supports: [],
          feedbacks: [],
        });
      }
      parentMap.get(s.parentId)!.supports.push(s);
    }

    // Add feedback keyed by parent
    const childFeedback = feedback.filter((f) => f.childId === childId);
    for (const f of childFeedback) {
      if (!parentMap.has(f.parentId)) {
        parentMap.set(f.parentId, {
          parentId: f.parentId,
          parentName: f.parentName,
          relationship: "other",
          contacts: [],
          supports: [],
          feedbacks: [],
        });
      }
      parentMap.get(f.parentId)!.feedbacks.push(f);
    }

    const parents = [...parentMap.values()].map((p) => {
      const positiveContacts = p.contacts.filter((c) => c.outcome === "positive").length;
      const positiveContactRate =
        p.contacts.length > 0 ? Math.round((positiveContacts / p.contacts.length) * 100) : 0;
      const averageEngagementScore =
        p.contacts.length > 0
          ? roundTo2(p.contacts.reduce((sum, c) => sum + c.parentEngagement, 0) / p.contacts.length)
          : 0;

      return {
        parentId: p.parentId,
        parentName: p.parentName,
        relationship: p.relationship,
        engagementLevel: assessEngagementLevel(p.contacts, averageEngagementScore),
        contactCount: p.contacts.length,
        positiveContactRate,
        averageEngagementScore,
        supportsProvided: p.supports.length,
        feedbackGiven: p.feedbacks.length,
      };
    });

    const totalContacts = childContacts.length;
    const positiveContacts = childContacts.filter((c) => c.outcome === "positive").length;
    const positiveContactRate =
      totalContacts > 0 ? Math.round((positiveContacts / totalContacts) * 100) : 0;

    const moodDiffs = childContacts.map((c) => c.childMoodAfter - c.childMoodBefore);
    const averageMoodUplift =
      moodDiffs.length > 0
        ? roundTo2(moodDiffs.reduce((s, d) => s + d, 0) / moodDiffs.length)
        : 0;

    const childPlans = plans.filter((p) => p.childId === childId);
    const activeFamilyPlan = childPlans.length > 0;
    const totalGoals = childPlans.reduce((s, p) => s + p.goalsSet, 0);
    const achievedGoals = childPlans.reduce(
      (s, p) => s + p.goalsAchieved + p.goalsPartiallyAchieved * 0.5,
      0,
    );
    const goalAchievementRate =
      totalGoals > 0 ? Math.round((achievedGoals / totalGoals) * 100) : 0;

    return {
      childId,
      childName,
      parents,
      totalContacts,
      positiveContactRate,
      averageMoodUplift,
      activeFamilyPlan,
      goalAchievementRate,
    };
  });
}

// ── Core: Generate Intelligence ───────────────────────────────────────────

export function generateParentalEngagementIntelligence(
  contacts: ContactRecord[],
  support: ParentalSupportRecord[],
  plans: FamilyPlanRecord[],
  feedback: ParentalFeedbackRecord[],
  childIds: string[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
  referenceDate?: string,
): ParentalEngagementIntelligenceResult {
  const refDate = referenceDate || new Date().toISOString().split("T")[0];
  const assessedAt = refDate;

  // Filter contacts to period
  const periodContacts = contacts.filter(
    (c) => withinPeriod(c.contactDate, periodStart, periodEnd),
  );

  // Evaluate all four domains
  const contactQuality = evaluateContactQuality(periodContacts);
  const parentalSupport = evaluateParentalSupport(support);
  const familyPlanning = evaluateFamilyPlanning(plans, refDate);
  const parentalFeedback = evaluateParentalFeedback(feedback);

  // Build family profiles using all contacts (not just period)
  const familyProfiles = buildFamilyProfiles(contacts, support, plans, feedback, childIds);

  // Overall score (max 100)
  const overallScore = Math.max(
    0,
    Math.min(
      100,
      contactQuality.score + parentalSupport.score + familyPlanning.score + parentalFeedback.score,
    ),
  );

  const rating = getRating(overallScore);

  // Generate insights
  const strengths = generateStrengths(contactQuality, parentalSupport, familyPlanning, parentalFeedback, familyProfiles);
  const areasForImprovement = generateAreasForImprovement(
    contactQuality, parentalSupport, familyPlanning, parentalFeedback, familyProfiles,
  );
  const actions = generateActions(contactQuality, parentalSupport, familyPlanning, parentalFeedback, familyProfiles);
  const regulatoryLinks = generateRegulatoryLinks(contactQuality, familyPlanning, familyProfiles);

  return {
    homeId,
    assessedAt,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    contactQuality,
    parentalSupport,
    familyPlanning,
    parentalFeedback,
    familyProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}

// ── Scoring ───────────────────────────────────────────────────────────────

export function getRating(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// ── Engagement Assessment ─────────────────────────────────────────────────

function assessEngagementLevel(
  contacts: ContactRecord[],
  averageEngagement: number,
): EngagementLevel {
  if (contacts.length === 0) return "no_contact";

  const noShows = contacts.filter((c) => c.outcome === "parent_no_show").length;
  const noShowRate = noShows / contacts.length;
  const negativeCount = contacts.filter((c) => c.outcome === "negative").length;
  const negativeRate = negativeCount / contacts.length;

  if (negativeRate > 0.5 && averageEngagement < 3) return "hostile";
  if (noShowRate > 0.6) return "disengaged";
  if (noShowRate > 0.3 || averageEngagement < 4) return "inconsistent";
  if (averageEngagement >= 8 && noShowRate === 0) return "highly_engaged";
  if (averageEngagement >= 5) return "engaged";
  return "inconsistent";
}

// ── Insight Generation ────────────────────────────────────────────────────

function generateStrengths(
  cq: ContactQualityResult,
  ps: ParentalSupportResult,
  fp: FamilyPlanningResult,
  pf: ParentalFeedbackResult,
  profiles: FamilyProfile[],
): string[] {
  const strengths: string[] = [];

  if (cq.positiveOutcomeRate >= 70) {
    strengths.push("High proportion of positive contact outcomes demonstrates effective family engagement");
  }
  if (cq.moodUpliftRate >= 60) {
    strengths.push("Children consistently show mood improvement following family contact");
  }
  if (meets(cq.followUpCompletionRate, 90) && cq.followUpNeededCount > 0) {
    strengths.push("Follow-up actions from contact sessions are being completed promptly");
  }
  if (ps.effectiveRate >= 70) {
    strengths.push("Parental support interventions are showing positive effectiveness rates");
  }
  if (fp.goalAchievementRate >= 60) {
    strengths.push("Family plans are achieving or partially achieving the majority of set goals");
  }
  if (fp.familyInvolvementRate >= 80) {
    strengths.push("Families are consistently involved in the care planning process");
  }
  if (fp.childInvolvementRate >= 80) {
    strengths.push("Children are actively involved in their own family planning meetings");
  }
  if (pf.averageSatisfaction >= 7) {
    strengths.push("Parents report high satisfaction with the home's approach to family engagement");
  }
  if (pf.averageCommunication >= 7) {
    strengths.push("Communication with parents is rated highly, supporting partnership working");
  }

  const highlyEngaged = profiles.flatMap((p) => p.parents).filter((p) => p.engagementLevel === "highly_engaged");
  if (highlyEngaged.length > 0) {
    strengths.push(
      `${highlyEngaged.length} parent(s) rated as highly engaged, evidencing strong family relationships`,
    );
  }

  if (cq.parentNoShowRate === 0 && cq.totalContacts > 0) {
    strengths.push("No parent no-shows recorded — all parents are attending scheduled contact");
  }

  return strengths;
}

function generateAreasForImprovement(
  cq: ContactQualityResult,
  ps: ParentalSupportResult,
  fp: FamilyPlanningResult,
  pf: ParentalFeedbackResult,
  profiles: FamilyProfile[],
): string[] {
  const areas: string[] = [];

  if (cq.positiveOutcomeRate < 50 && cq.totalContacts > 0) {
    areas.push("Positive contact outcome rate below 50% — review contact arrangements and support strategies");
  }
  if (below(cq.followUpCompletionRate, 70) && cq.followUpNeededCount > 0) {
    areas.push("Follow-up completion rate below 70% — embed systematic follow-up tracking");
  }
  if (cq.childRefusalRate > 20) {
    areas.push(
      `Child refusal rate at ${cq.childRefusalRate}% — explore reasons sensitively and ensure wishes and feelings are documented`,
    );
  }
  if (cq.parentNoShowRate > 20) {
    areas.push(
      `Parent no-show rate at ${cq.parentNoShowRate}% — consider additional support to maintain contact commitment`,
    );
  }
  if (ps.effectiveRate < 50 && ps.totalSupports > 0) {
    areas.push("Support effectiveness below 50% — review and adjust support strategies");
  }
  if (fp.goalAchievementRate < 40) {
    areas.push("Family plan goal achievement rate below 40% — review goal-setting approach and barriers");
  }
  if (fp.overduePlans > 0) {
    areas.push(`${fp.overduePlans} family plan(s) overdue for review — prioritise scheduling`);
  }
  if (fp.familyInvolvementRate < 60) {
    areas.push("Family involvement in care planning below 60% — develop strategies to increase participation");
  }
  if (pf.averageSatisfaction < 5 && pf.totalFeedbacks > 0) {
    areas.push("Parental satisfaction scores below midpoint — conduct focused review of engagement approach");
  }
  if (pf.averageCommunication < 5 && pf.totalFeedbacks > 0) {
    areas.push("Communication scores below midpoint — review communication frequency and quality");
  }

  const disengaged = profiles.flatMap((p) => p.parents).filter(
    (p) => p.engagementLevel === "disengaged" || p.engagementLevel === "hostile",
  );
  if (disengaged.length > 0) {
    areas.push(
      `${disengaged.length} parent(s) assessed as disengaged or hostile — develop targeted re-engagement plans`,
    );
  }

  return areas;
}

function generateActions(
  cq: ContactQualityResult,
  ps: ParentalSupportResult,
  fp: FamilyPlanningResult,
  pf: ParentalFeedbackResult,
  profiles: FamilyProfile[],
): string[] {
  const actions: string[] = [];

  if (cq.parentNoShowCount >= 2) {
    actions.push(
      `HIGH: ${cq.parentNoShowCount} parent no-shows recorded. Assess barriers to attendance and consider whether contact arrangements need adjusting. Document in placement plan.`,
    );
  }

  if (cq.childRefusalCount > 1) {
    actions.push(
      `HIGH: ${cq.childRefusalCount} child refusal(s) — ensure wishes and feelings are explored and recorded per Reg 7. Consider therapeutic support if pattern persists.`,
    );
  }

  const hostile = profiles.flatMap((p) => p.parents).filter((p) => p.engagementLevel === "hostile");
  if (hostile.length > 0) {
    for (const h of hostile) {
      actions.push(
        `HIGH: ${h.parentName} assessed as hostile engagement level. Review risk assessment and consider professional mediation. Inform placing authority.`,
      );
    }
  }

  if (fp.overduePlans > 0) {
    actions.push(
      `MEDIUM: ${fp.overduePlans} family plan review(s) overdue. Schedule within 5 working days in partnership with placing authority.`,
    );
  }

  if (below(cq.followUpCompletionRate, 60) && cq.followUpNeededCount > 0) {
    actions.push(
      `MEDIUM: Only ${cq.followUpCompletionRate}% of follow-up actions completed. Implement tracking system and allocate responsibility to key workers.`,
    );
  }

  if (ps.effectiveRate < 40 && ps.totalSupports > 0) {
    actions.push(
      `MEDIUM: Parental support effectiveness below 40%. Review each support intervention and consider alternative approaches or specialist referrals.`,
    );
  }

  if (pf.averageInvolvement < 4 && pf.totalFeedbacks > 0) {
    actions.push(
      `MEDIUM: Parents reporting low involvement (avg ${pf.averageInvolvement}/10). Develop structured opportunities for parental participation in care decisions.`,
    );
  }

  if (actions.length === 0) {
    actions.push(
      "No immediate actions required. Parental engagement is well-managed with effective partnership working.",
    );
  }

  return actions;
}

function generateRegulatoryLinks(
  cq: ContactQualityResult,
  fp: FamilyPlanningResult,
  profiles: FamilyProfile[],
): string[] {
  const links = new Set<string>();

  links.add("CHR 2015, Reg 7 — Children's wishes and feelings (including family)");
  links.add("CHR 2015, Reg 22 — Contact arrangements");
  links.add("SCCIF: Experiences and progress — Family engagement");

  if (cq.childRefusalCount > 0) {
    links.add("CHR 2015, Reg 7(2)(a) — Ascertain and give due consideration to children's wishes");
  }

  if (fp.totalPlans > 0) {
    links.add("Working Together 2023 — Partnership with parents in care planning");
  }

  if (cq.parentNoShowCount > 0) {
    links.add("CHR 2015, Reg 22(1) — Promote contact between child and family");
  }

  const hasDisengaged = profiles.flatMap((p) => p.parents).some(
    (p) => p.engagementLevel === "disengaged" || p.engagementLevel === "hostile",
  );
  if (hasDisengaged) {
    links.add("Working Together 2023 — Multi-agency working to support resistant families");
    links.add("CHR 2015, Reg 34 — Review of quality of care");
  }

  if (fp.familyInvolvementRate < 100) {
    links.add("CHR 2015, Reg 14 — Placement plan: family involvement in review");
  }

  return [...links];
}

// ── Label Utilities ───────────────────────────────────────────────────────

export function getContactTypeLabel(type: ContactType): string {
  const labels: Record<ContactType, string> = {
    face_to_face: "Face-to-Face",
    phone: "Phone Call",
    video_call: "Video Call",
    letter: "Letter",
    email: "Email",
    supervised: "Supervised Contact",
    community_outing: "Community Outing",
  };
  return labels[type];
}

export function getContactOutcomeLabel(outcome: ContactOutcome): string {
  const labels: Record<ContactOutcome, string> = {
    positive: "Positive",
    neutral: "Neutral",
    negative: "Negative",
    child_refused: "Child Refused",
    parent_no_show: "Parent No-Show",
    cancelled_by_professional: "Cancelled (Professional)",
  };
  return labels[outcome];
}

export function getEngagementLevelLabel(level: EngagementLevel): string {
  const labels: Record<EngagementLevel, string> = {
    highly_engaged: "Highly Engaged",
    engaged: "Engaged",
    inconsistent: "Inconsistent",
    disengaged: "Disengaged",
    hostile: "Hostile",
    no_contact: "No Contact",
  };
  return labels[level];
}

export function getSupportTypeLabel(type: SupportType): string {
  const labels: Record<SupportType, string> = {
    transport: "Transport",
    venue: "Venue Provision",
    mediation: "Mediation",
    parenting_support: "Parenting Support",
    therapeutic: "Therapeutic Support",
    financial: "Financial Assistance",
    practical: "Practical Support",
  };
  return labels[type];
}

export function getRelationshipLabel(rel: Relationship): string {
  const labels: Record<Relationship, string> = {
    mother: "Mother",
    father: "Father",
    step_parent: "Step-Parent",
    grandparent: "Grandparent",
    sibling: "Sibling",
    other: "Other",
  };
  return labels[rel];
}

export function getEffectivenessLabel(eff: SupportEffectiveness): string {
  const labels: Record<SupportEffectiveness, string> = {
    effective: "Effective",
    partially_effective: "Partially Effective",
    ineffective: "Ineffective",
    too_early_to_tell: "Too Early to Tell",
  };
  return labels[eff];
}

// ── Internal Helpers ──────────────────────────────────────────────────────

function buildContactTypeMap(): Record<ContactType, number> {
  return {
    face_to_face: 0,
    phone: 0,
    video_call: 0,
    letter: 0,
    email: 0,
    supervised: 0,
    community_outing: 0,
  };
}

function buildOutcomeMap(): Record<ContactOutcome, number> {
  return {
    positive: 0,
    neutral: 0,
    negative: 0,
    child_refused: 0,
    parent_no_show: 0,
    cancelled_by_professional: 0,
  };
}

function buildSupportTypeMap(): Record<SupportType, number> {
  return {
    transport: 0,
    venue: 0,
    mediation: 0,
    parenting_support: 0,
    therapeutic: 0,
    financial: 0,
    practical: 0,
  };
}

function buildEffectivenessMap(): Record<SupportEffectiveness, number> {
  return {
    effective: 0,
    partially_effective: 0,
    ineffective: 0,
    too_early_to_tell: 0,
  };
}

function roundTo2(n: number): number {
  return Math.round(n * 100) / 100;
}
