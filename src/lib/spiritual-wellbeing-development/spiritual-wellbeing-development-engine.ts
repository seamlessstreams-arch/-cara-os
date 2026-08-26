import { below, meets, rate } from "@/lib/metrics/rate";
// Spiritual Wellbeing Development Intelligence Engine
// Pure deterministic — no AI, no external calls, no randomness, no Date.now()

// ── Type Unions ─────────────────────────────────────────────────────────────

export type SpiritualActivityType =
  | "faith_practice"
  | "meditation_mindfulness"
  | "philosophical_discussion"
  | "cultural_celebration"
  | "community_worship"
  | "values_exploration"
  | "nature_reflection"
  | "creative_spiritual_expression";

export type EngagementLevel =
  | "deeply_engaged"
  | "engaged"
  | "moderate"
  | "minimal"
  | "declined";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// ── Label Maps & Getters ────────────────────────────────────────────────────

const spiritualActivityTypeLabels: Record<SpiritualActivityType, string> = {
  faith_practice: "Faith Practice",
  meditation_mindfulness: "Meditation & Mindfulness",
  philosophical_discussion: "Philosophical Discussion",
  cultural_celebration: "Cultural Celebration",
  community_worship: "Community Worship",
  values_exploration: "Values Exploration",
  nature_reflection: "Nature Reflection",
  creative_spiritual_expression: "Creative Spiritual Expression",
};

const engagementLevelLabels: Record<EngagementLevel, string> = {
  deeply_engaged: "Deeply Engaged",
  engaged: "Engaged",
  moderate: "Moderate",
  minimal: "Minimal",
  declined: "Declined",
};

const ratingLabels: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getSpiritualActivityTypeLabel(type: SpiritualActivityType): string {
  return spiritualActivityTypeLabels[type] || type;
}

export function getEngagementLevelLabel(level: EngagementLevel): string {
  return engagementLevelLabels[level] || level;
}

export function getRatingLabel(rating: Rating): string {
  return ratingLabels[rating] || rating;
}

export function getSpiritualActivityTypeLabels(): Record<SpiritualActivityType, string> {
  return { ...spiritualActivityTypeLabels };
}

export function getEngagementLevelLabels(): Record<EngagementLevel, string> {
  return { ...engagementLevelLabels };
}

export function getRatingLabels(): Record<Rating, string> {
  return { ...ratingLabels };
}

// ── Input Interfaces ────────────────────────────────────────────────────────

export interface SpiritualActivity {
  id: string;
  childId: string;
  childName: string;
  activityDate: string;
  activityType: SpiritualActivityType;
  engagementLevel: EngagementLevel;
  childChoiceMade: boolean;
  culturalNeedsConsidered: boolean;
  wellbeingBenefitNoted: boolean;
  documentedInPlan: boolean;
  staffSupported: boolean;
  feedbackGiven: boolean;
}

export interface SpiritualWellbeingPolicy {
  id: string;
  spiritualDevelopmentStrategy: boolean;
  faithAndBeliefRespectPolicy: boolean;
  culturalCelebrationFramework: boolean;
  accessToWorshipPlaces: boolean;
  dietaryAndRitualAccommodation: boolean;
  staffGuidanceOnSpirituality: boolean;
  regularReview: boolean;
}

export interface StaffSpiritualWellbeingTraining {
  id: string;
  staffId: string;
  staffName: string;
  spiritualAwareness: boolean;
  culturalCompetency: boolean;
  faithDiversityKnowledge: boolean;
  childCentredSpiritualSupport: boolean;
  ethicalBoundaries: boolean;
  reflectivePractice: boolean;
}

// ── Result Interfaces ───────────────────────────────────────────────────────

export interface SpiritualQualityResult {
  overallScore: number;
  totalActivities: number;
  /** null when the population is empty — nothing measured, not 0%. */
  engagementRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  childChoiceRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  culturalConsiderationRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  wellbeingBenefitRate: number | null;
}

export interface SpiritualComplianceResult {
  overallScore: number;
  /** null when the population is empty — nothing measured, not 0%. */
  documentedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  staffSupportedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  feedbackRate: number | null;
  activityDiversityRatio: number;
}

export interface SpiritualPolicyResult {
  overallScore: number;
  spiritualDevelopmentStrategy: boolean;
  faithAndBeliefRespectPolicy: boolean;
  culturalCelebrationFramework: boolean;
  accessToWorshipPlaces: boolean;
  dietaryAndRitualAccommodation: boolean;
  staffGuidanceOnSpirituality: boolean;
  regularReview: boolean;
}

export interface StaffSpiritualReadinessResult {
  overallScore: number;
  totalStaff: number;
  /** null when the population is empty — nothing measured, not 0%. */
  spiritualAwarenessRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  culturalCompetencyRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  faithDiversityKnowledgeRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  childCentredSpiritualSupportRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  ethicalBoundariesRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  reflectivePracticeRate: number | null;
}

export interface ChildSpiritualProfile {
  childId: string;
  childName: string;
  totalActivities: number;
  engagementRate: number;
  childChoiceRate: number;
  overallScore: number;
}

export interface SpiritualWellbeingDevelopmentIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  spiritualQuality: SpiritualQualityResult;
  spiritualCompliance: SpiritualComplianceResult;
  spiritualPolicy: SpiritualPolicyResult;
  staffReadiness: StaffSpiritualReadinessResult;
  childProfiles: ChildSpiritualProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

export function getRating(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// ── Evaluator 1: Spiritual Quality (0-25) ──────────────────────────────────

export function evaluateSpiritualQuality(activities: SpiritualActivity[]): SpiritualQualityResult {
  if (activities.length === 0) {
    return {
      overallScore: 0,
      totalActivities: 0,
      engagementRate: null,
      childChoiceRate: null,
      culturalConsiderationRate: null,
      wellbeingBenefitRate: null,
    };
  }

  const total = activities.length;
  const engagedCount = activities.filter(
    a => a.engagementLevel === "deeply_engaged" || a.engagementLevel === "engaged",
  ).length;
  const childChoiceCount = activities.filter(a => a.childChoiceMade).length;
  const culturalCount = activities.filter(a => a.culturalNeedsConsidered).length;
  const wellbeingCount = activities.filter(a => a.wellbeingBenefitNoted).length;

  const engagementRate = rate(engagedCount, total);
  const childChoiceRate = rate(childChoiceCount, total);
  const culturalConsiderationRate = rate(culturalCount, total);
  const wellbeingBenefitRate = rate(wellbeingCount, total);

  // Weighted scoring: engagement 0-7, childChoice 0-6, cultural 0-6, wellbeing 0-6
  const engagementScore = Math.min(Math.round(((engagementRate ?? 0) / 100) * 7), 7);
  const childChoiceScore = Math.min(Math.round(((childChoiceRate ?? 0) / 100) * 6), 6);
  const culturalScore = Math.min(Math.round(((culturalConsiderationRate ?? 0) / 100) * 6), 6);
  const wellbeingScore = Math.min(Math.round(((wellbeingBenefitRate ?? 0) / 100) * 6), 6);

  const overallScore = Math.min(engagementScore + childChoiceScore + culturalScore + wellbeingScore, 25);

  return {
    overallScore,
    totalActivities: total,
    engagementRate,
    childChoiceRate,
    culturalConsiderationRate,
    wellbeingBenefitRate,
  };
}

// ── Evaluator 2: Spiritual Compliance (0-25) ───────────────────────────────

export function evaluateSpiritualCompliance(activities: SpiritualActivity[]): SpiritualComplianceResult {
  if (activities.length === 0) {
    return {
      overallScore: 0,
      documentedRate: null,
      staffSupportedRate: null,
      feedbackRate: null,
      activityDiversityRatio: 0,
    };
  }

  const total = activities.length;
  const documentedCount = activities.filter(a => a.documentedInPlan).length;
  const staffSupportedCount = activities.filter(a => a.staffSupported).length;
  const feedbackCount = activities.filter(a => a.feedbackGiven).length;

  const documentedRate = rate(documentedCount, total);
  const staffSupportedRate = rate(staffSupportedCount, total);
  const feedbackRate = rate(feedbackCount, total);

  const uniqueTypes = new Set(activities.map(a => a.activityType)).size;
  const activityDiversityRatio = uniqueTypes / 8;

  // Weighted scoring: documented 0-8, staffSupported 0-7, feedback 0-5, diversity 0-5
  const documentedScore = Math.min(Math.round(((documentedRate ?? 0) / 100) * 8), 8);
  const staffSupportedScore = Math.min(Math.round(((staffSupportedRate ?? 0) / 100) * 7), 7);
  const feedbackScore = Math.min(Math.round(((feedbackRate ?? 0) / 100) * 5), 5);
  const diversityScore = Math.min(Math.round(activityDiversityRatio * 5), 5);

  const overallScore = Math.min(documentedScore + staffSupportedScore + feedbackScore + diversityScore, 25);

  return {
    overallScore,
    documentedRate,
    staffSupportedRate,
    feedbackRate,
    activityDiversityRatio,
  };
}

// ── Evaluator 3: Spiritual Policy (0-25) ───────────────────────────────────

export function evaluateSpiritualPolicy(policy: SpiritualWellbeingPolicy | null): SpiritualPolicyResult {
  if (policy === null) {
    return {
      overallScore: 0,
      spiritualDevelopmentStrategy: false,
      faithAndBeliefRespectPolicy: false,
      culturalCelebrationFramework: false,
      accessToWorshipPlaces: false,
      dietaryAndRitualAccommodation: false,
      staffGuidanceOnSpirituality: false,
      regularReview: false,
    };
  }

  let score = 0;
  if (policy.spiritualDevelopmentStrategy) score += 4;
  if (policy.faithAndBeliefRespectPolicy) score += 4;
  if (policy.culturalCelebrationFramework) score += 4;
  if (policy.accessToWorshipPlaces) score += 4;
  if (policy.dietaryAndRitualAccommodation) score += 3;
  if (policy.staffGuidanceOnSpirituality) score += 3;
  if (policy.regularReview) score += 3;

  const overallScore = Math.min(score, 25);

  return {
    overallScore,
    spiritualDevelopmentStrategy: policy.spiritualDevelopmentStrategy,
    faithAndBeliefRespectPolicy: policy.faithAndBeliefRespectPolicy,
    culturalCelebrationFramework: policy.culturalCelebrationFramework,
    accessToWorshipPlaces: policy.accessToWorshipPlaces,
    dietaryAndRitualAccommodation: policy.dietaryAndRitualAccommodation,
    staffGuidanceOnSpirituality: policy.staffGuidanceOnSpirituality,
    regularReview: policy.regularReview,
  };
}

// ── Evaluator 4: Staff Spiritual Readiness (0-25) ──────────────────────────

export function evaluateStaffSpiritualReadiness(training: StaffSpiritualWellbeingTraining[]): StaffSpiritualReadinessResult {
  if (training.length === 0) {
    return {
      overallScore: 0,
      totalStaff: 0,
      spiritualAwarenessRate: null,
      culturalCompetencyRate: null,
      faithDiversityKnowledgeRate: null,
      childCentredSpiritualSupportRate: null,
      ethicalBoundariesRate: null,
      reflectivePracticeRate: null,
    };
  }

  const total = training.length;
  const spiritualAwarenessRate = rate(training.filter(t => t.spiritualAwareness).length, total);
  const culturalCompetencyRate = rate(training.filter(t => t.culturalCompetency).length, total);
  const faithDiversityKnowledgeRate = rate(training.filter(t => t.faithDiversityKnowledge).length, total);
  const childCentredSpiritualSupportRate = rate(training.filter(t => t.childCentredSpiritualSupport).length, total);
  const ethicalBoundariesRate = rate(training.filter(t => t.ethicalBoundaries).length, total);
  const reflectivePracticeRate = rate(training.filter(t => t.reflectivePractice).length, total);

  // Weighted scoring: spiritualAwareness=6, culturalCompetency=5, faithDiversity=5,
  // childCentred=4, ethicalBoundaries=3, reflectivePractice=2
  const spiritualScore = Math.min(Math.round(((spiritualAwarenessRate ?? 0) / 100) * 6), 6);
  const culturalScore = Math.min(Math.round(((culturalCompetencyRate ?? 0) / 100) * 5), 5);
  const faithScore = Math.min(Math.round(((faithDiversityKnowledgeRate ?? 0) / 100) * 5), 5);
  const childCentredScore = Math.min(Math.round(((childCentredSpiritualSupportRate ?? 0) / 100) * 4), 4);
  const ethicalScore = Math.min(Math.round(((ethicalBoundariesRate ?? 0) / 100) * 3), 3);
  const reflectiveScore = Math.min(Math.round(((reflectivePracticeRate ?? 0) / 100) * 2), 2);

  const overallScore = Math.min(spiritualScore + culturalScore + faithScore + childCentredScore + ethicalScore + reflectiveScore, 25);

  return {
    overallScore,
    totalStaff: total,
    spiritualAwarenessRate,
    culturalCompetencyRate,
    faithDiversityKnowledgeRate,
    childCentredSpiritualSupportRate,
    ethicalBoundariesRate,
    reflectivePracticeRate,
  };
}

// ── Child Spiritual Profiles ───────────────────────────────────────────────

export function buildChildSpiritualProfiles(activities: SpiritualActivity[]): ChildSpiritualProfile[] {
  const childIds = new Set<string>();
  for (const a of activities) childIds.add(a.childId);

  if (childIds.size === 0) return [];

  return Array.from(childIds).map(childId => {
    const childActivities = activities.filter(a => a.childId === childId);
    const childName = childActivities[0]?.childName || childId;

    const totalActivities = childActivities.length;
    const engagedCount = childActivities.filter(
      a => a.engagementLevel === "deeply_engaged" || a.engagementLevel === "engaged",
    ).length;
    const engagementRate = rate(engagedCount, totalActivities)!;
    const childChoiceCount = childActivities.filter(a => a.childChoiceMade).length;
    const childChoiceRate = rate(childChoiceCount, totalActivities)!;

    const uniqueTypes = new Set(childActivities.map(a => a.activityType)).size;

    // Score 0-10
    let score = 0;
    // Frequency: >=10 activities -> 2, >=5 -> 1
    if (totalActivities >= 10) score += 2;
    else if (totalActivities >= 5) score += 1;
    // Engagement: >=80% -> 3, >=60% -> 2, >=40% -> 1
    if (meets(engagementRate, 80)) score += 3;
    else if (meets(engagementRate, 60)) score += 2;
    else if (meets(engagementRate, 40)) score += 1;
    // Child choice: >=80% -> 3, >=60% -> 2, >=40% -> 1
    if (meets(childChoiceRate, 80)) score += 3;
    else if (meets(childChoiceRate, 60)) score += 2;
    else if (meets(childChoiceRate, 40)) score += 1;
    // Diversity: >=4 types -> 2, >=2 types -> 1
    if (uniqueTypes >= 4) score += 2;
    else if (uniqueTypes >= 2) score += 1;

    const overallScore = Math.min(score, 10);

    return {
      childId,
      childName,
      totalActivities,
      engagementRate,
      childChoiceRate,
      overallScore,
    };
  });
}

// ── Main Orchestrator ───────────────────────────────────────────────────────

export function generateSpiritualWellbeingDevelopmentIntelligence(
  activities: SpiritualActivity[],
  policy: SpiritualWellbeingPolicy | null,
  training: StaffSpiritualWellbeingTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): SpiritualWellbeingDevelopmentIntelligence {
  const spiritualQuality = evaluateSpiritualQuality(activities);
  const spiritualCompliance = evaluateSpiritualCompliance(activities);
  const spiritualPolicy = evaluateSpiritualPolicy(policy);
  const staffReadiness = evaluateStaffSpiritualReadiness(training);
  const childProfiles = buildChildSpiritualProfiles(activities);

  // Sum 4 evaluators (each 0-25, total 0-100)
  const rawScore = spiritualQuality.overallScore + spiritualCompliance.overallScore + spiritualPolicy.overallScore + staffReadiness.overallScore;
  const overallScore = Math.min(rawScore, 100);
  const rating = getRating(overallScore);

  // Strengths
  const strengths: string[] = [];
  if (meets(spiritualQuality.engagementRate, 80)) strengths.push("High engagement with spiritual activities demonstrates children are benefiting from meaningful experiences");
  if (meets(spiritualQuality.childChoiceRate, 80)) strengths.push("Children's choices are consistently respected in spiritual activities, supporting autonomy and identity");
  if (meets(spiritualQuality.culturalConsiderationRate, 80)) strengths.push("Cultural needs are well considered across spiritual activities, reflecting inclusive practice");
  if (meets(spiritualQuality.wellbeingBenefitRate, 80)) strengths.push("Wellbeing benefits are regularly noted, evidencing positive impact of spiritual development work");
  if (meets(spiritualCompliance.documentedRate, 80)) strengths.push("Spiritual activities are well documented in care plans, supporting regulatory compliance");
  if (meets(spiritualCompliance.staffSupportedRate, 80)) strengths.push("Staff consistently support children's spiritual development activities");
  if (meets(spiritualCompliance.feedbackRate, 80)) strengths.push("Feedback is regularly given following spiritual activities, supporting reflective practice");
  if (spiritualCompliance.activityDiversityRatio >= 0.5) strengths.push("Diverse range of spiritual activities offered, supporting varied beliefs and interests");
  if (spiritualPolicy.overallScore >= 20) strengths.push("Comprehensive spiritual wellbeing policy covering development strategy, faith respect, and cultural celebration");
  if (staffReadiness.overallScore >= 20) strengths.push("Strong staff readiness across spiritual awareness, cultural competency, and faith diversity knowledge");
  if (meets(staffReadiness.spiritualAwarenessRate, 80)) strengths.push("Majority of staff have spiritual awareness training, supporting consistent practice");

  // Areas for improvement
  const areasForImprovement: string[] = [];
  if (spiritualQuality.totalActivities > 0 && below(spiritualQuality.engagementRate, 60)) areasForImprovement.push("Engagement with spiritual activities is low — consider exploring activities that better match children's interests and beliefs");
  if (spiritualQuality.totalActivities > 0 && below(spiritualQuality.childChoiceRate, 80)) areasForImprovement.push("Children's choice in spiritual activities could be improved — ensure children are offered genuine options");
  if (spiritualQuality.totalActivities > 0 && below(spiritualQuality.culturalConsiderationRate, 80)) areasForImprovement.push("Cultural needs are not consistently considered — review how cultural backgrounds inform spiritual activity planning");
  if (spiritualQuality.totalActivities > 0 && below(spiritualQuality.wellbeingBenefitRate, 80)) areasForImprovement.push("Wellbeing benefits are not consistently noted — staff should record observed benefits of spiritual activities");
  if (below(spiritualCompliance.documentedRate, 80) && activities.length > 0) areasForImprovement.push("Spiritual activities are not consistently documented in care plans — documentation supports continuity and review");
  if (below(spiritualCompliance.staffSupportedRate, 80) && activities.length > 0) areasForImprovement.push("Staff support for spiritual activities is inconsistent — ensure staff are available and prepared");
  if (below(spiritualCompliance.feedbackRate, 80) && activities.length > 0) areasForImprovement.push("Feedback following spiritual activities is lacking — children benefit from reflective conversations");
  if (spiritualCompliance.activityDiversityRatio < 0.375 && activities.length > 0) areasForImprovement.push("Limited variety of spiritual activities — children benefit from exposure to diverse spiritual and cultural experiences");
  if (policy === null) areasForImprovement.push("No spiritual wellbeing policy in place — a policy is needed to guide practice and meet regulatory expectations");
  if (policy !== null && !policy.spiritualDevelopmentStrategy) areasForImprovement.push("Policy lacks a spiritual development strategy — this should outline the home's approach to spiritual wellbeing");
  if (policy !== null && !policy.faithAndBeliefRespectPolicy) areasForImprovement.push("Policy does not include faith and belief respect — children's religious persuasion must be respected");
  if (policy !== null && !policy.culturalCelebrationFramework) areasForImprovement.push("Policy lacks a cultural celebration framework — cultural identity is integral to spiritual wellbeing");
  if (policy !== null && !policy.accessToWorshipPlaces) areasForImprovement.push("Policy does not address access to places of worship — children should be supported to attend if they wish");
  if (below(staffReadiness.spiritualAwarenessRate, 80) && training.length > 0) areasForImprovement.push("Spiritual awareness training coverage is insufficient — all staff need foundational understanding");
  if (below(staffReadiness.culturalCompetencyRate, 80) && training.length > 0) areasForImprovement.push("Cultural competency training is lacking — staff need skills to support diverse spiritual needs");
  if (below(staffReadiness.faithDiversityKnowledgeRate, 80) && training.length > 0) areasForImprovement.push("Faith diversity knowledge is low — staff should understand the range of beliefs children may hold");

  // Actions
  const actions: string[] = [];
  if (activities.length === 0) actions.push("Introduce a programme of spiritual wellbeing activities tailored to children's individual beliefs and interests");
  if (spiritualQuality.totalActivities > 0 && below(spiritualQuality.engagementRate, 60)) actions.push("Review spiritual activity programme and consult children about preferred activities and formats");
  if (spiritualQuality.totalActivities > 0 && below(spiritualQuality.childChoiceRate, 80)) actions.push("Embed child choice into spiritual activity planning — record each child's preferences and decisions");
  if (below(spiritualCompliance.documentedRate, 80) && activities.length > 0) actions.push("Ensure all spiritual activities are documented in children's care plans within 5 working days");
  if (below(spiritualCompliance.feedbackRate, 80) && activities.length > 0) actions.push("Implement routine feedback conversations with children following spiritual activities");
  if (policy === null) actions.push("Develop and implement a spiritual wellbeing development policy covering all regulatory requirements");
  if (policy !== null && !policy.regularReview) actions.push("Schedule regular review of the spiritual wellbeing policy to ensure it remains current");
  if (policy !== null && !policy.dietaryAndRitualAccommodation) actions.push("Add dietary and ritual accommodation guidance to the spiritual wellbeing policy");
  if (policy !== null && !policy.staffGuidanceOnSpirituality) actions.push("Include staff guidance on supporting children's spirituality within the policy");
  if (below(staffReadiness.spiritualAwarenessRate, 100) && training.length > 0) actions.push("Schedule spiritual awareness training for all staff who have not yet completed it");
  if (below(staffReadiness.culturalCompetencyRate, 80) && training.length > 0) actions.push("Provide cultural competency training to increase staff confidence in supporting diverse spiritual needs");
  if (below(staffReadiness.faithDiversityKnowledgeRate, 80) && training.length > 0) actions.push("Deliver faith diversity training to broaden staff understanding of children's beliefs");
  if (training.length === 0) actions.push("Establish a staff training programme covering spiritual awareness, cultural competency, and faith diversity");

  const regulatoryLinks = [
    "CHR 2015 Regulation 6 — Health and well-being standard (spiritual needs)",
    "CHR 2015 Regulation 7 — Contact with family (religious and cultural)",
    "SCCIF — Experiences and progress of children (identity and belonging)",
    "NMS 15 — Promoting and protecting the child's rights (spiritual)",
    "Children Act 1989 Section 22(5) — Religious persuasion",
    "UNCRC Article 14 — Freedom of thought, conscience and religion",
    "Equality Act 2010 — Religion or belief protected characteristic",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    spiritualQuality,
    spiritualCompliance,
    spiritualPolicy,
    staffReadiness,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
