// Community Engagement & Participation Intelligence Engine
// Pure deterministic — no AI, no external calls, no randomness, no Date.now()

// ── Type unions ──────────────────────────────────────────────────────────────

export type ActivityType =
  | "sports_club"
  | "youth_group"
  | "volunteering"
  | "cultural_event"
  | "religious_group"
  | "hobby_class"
  | "community_project"
  | "social_outing";

export type ParticipationLevel =
  | "highly_engaged"
  | "regular_participant"
  | "occasional"
  | "reluctant"
  | "non_participant";

export type Rating = "outstanding" | "good" | "requires_improvement" | "inadequate";

// ── Label maps ───────────────────────────────────────────────────────────────

const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  sports_club: "Sports Club",
  youth_group: "Youth Group",
  volunteering: "Volunteering",
  cultural_event: "Cultural Event",
  religious_group: "Religious Group",
  hobby_class: "Hobby Class",
  community_project: "Community Project",
  social_outing: "Social Outing",
};

const PARTICIPATION_LEVEL_LABELS: Record<ParticipationLevel, string> = {
  highly_engaged: "Highly Engaged",
  regular_participant: "Regular Participant",
  occasional: "Occasional",
  reluctant: "Reluctant",
  non_participant: "Non-Participant",
};

const RATING_LABELS: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getActivityTypeLabel(v: ActivityType): string { return ACTIVITY_TYPE_LABELS[v]; }
export function getParticipationLevelLabel(v: ParticipationLevel): string { return PARTICIPATION_LEVEL_LABELS[v]; }
export function getRatingLabel(v: Rating): string { return RATING_LABELS[v]; }

// ── Input interfaces ─────────────────────────────────────────────────────────

export interface CommunityActivity {
  id: string;
  childId: string;
  childName: string;
  activityDate: string;
  activityType: ActivityType;
  participationLevel: ParticipationLevel;
  childInitiated: boolean;
  socialSkillsDeveloped: boolean;
  communityLinksStrengthened: boolean;
  documentedInPlan: boolean;
  staffSupported: boolean;
  feedbackObtained: boolean;
}

export interface CommunityPolicy {
  id: string;
  communityEngagementStrategy: boolean;
  socialInclusionFramework: boolean;
  activityAccessPolicy: boolean;
  safeguardingInCommunity: boolean;
  transportArrangements: boolean;
  partnershipAgreements: boolean;
  regularReview: boolean;
}

export interface StaffCommunityTraining {
  id: string;
  staffId: string;
  staffName: string;
  communityEngagement: boolean;
  socialInclusion: boolean;
  safeguardingInCommunity: boolean;
  activityPlanning: boolean;
  partnershipWorking: boolean;
  documentationSkills: boolean;
}

// ── Result interfaces ────────────────────────────────────────────────────────

export interface EngagementQualityResult {
  overallScore: number;
  totalActivities: number;
  participationRate: number;
  childInitiatedRate: number;
  socialSkillsRate: number;
  communityLinksRate: number;
}

export interface EngagementComplianceResult {
  overallScore: number;
  documentedRate: number;
  staffSupportedRate: number;
  feedbackRate: number;
  activityDiversityRatio: number;
}

export interface CommunityPolicyResult {
  overallScore: number;
  communityEngagementStrategy: boolean;
  socialInclusionFramework: boolean;
  activityAccessPolicy: boolean;
  safeguardingInCommunity: boolean;
  transportArrangements: boolean;
  partnershipAgreements: boolean;
  regularReview: boolean;
}

export interface StaffCommunityReadinessResult {
  overallScore: number;
  totalStaff: number;
  communityEngagementRate: number;
  socialInclusionRate: number;
  safeguardingInCommunityRate: number;
  activityPlanningRate: number;
  partnershipWorkingRate: number;
  documentationRate: number;
}

export interface ChildCommunityProfile {
  childId: string;
  childName: string;
  totalActivities: number;
  participationRate: number;
  childInitiatedRate: number;
  overallScore: number;
}

export interface CommunityEngagementParticipationIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  engagementQuality: EngagementQualityResult;
  engagementCompliance: EngagementComplianceResult;
  communityPolicy: CommunityPolicyResult;
  staffCommunityReadiness: StaffCommunityReadinessResult;
  childProfiles: ChildCommunityProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

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

// ── Evaluators ───────────────────────────────────────────────────────────────

export function evaluateEngagementQuality(activities: CommunityActivity[]): EngagementQualityResult {
  if (activities.length === 0) {
    return { overallScore: 0, totalActivities: 0, participationRate: 0, childInitiatedRate: 0, socialSkillsRate: 0, communityLinksRate: 0 };
  }

  const total = activities.length;
  const participatingCount = activities.filter((a) => a.participationLevel === "highly_engaged" || a.participationLevel === "regular_participant").length;
  const childInitiatedCount = activities.filter((a) => a.childInitiated).length;
  const socialSkillsCount = activities.filter((a) => a.socialSkillsDeveloped).length;
  const linksCount = activities.filter((a) => a.communityLinksStrengthened).length;

  const participationRate = pct(participatingCount, total);
  const childInitiatedRate = pct(childInitiatedCount, total);
  const socialSkillsRate = pct(socialSkillsCount, total);
  const communityLinksRate = pct(linksCount, total);

  const partScore = Math.round((participationRate / 100) * 7);
  const initScore = Math.round((childInitiatedRate / 100) * 6);
  const socScore = Math.round((socialSkillsRate / 100) * 6);
  const linkScore = Math.round((communityLinksRate / 100) * 6);

  const overallScore = Math.min(25, partScore + initScore + socScore + linkScore);

  return { overallScore, totalActivities: total, participationRate, childInitiatedRate, socialSkillsRate, communityLinksRate };
}

export function evaluateEngagementCompliance(activities: CommunityActivity[]): EngagementComplianceResult {
  if (activities.length === 0) {
    return { overallScore: 0, documentedRate: 0, staffSupportedRate: 0, feedbackRate: 0, activityDiversityRatio: 0 };
  }

  const total = activities.length;
  const documentedCount = activities.filter((a) => a.documentedInPlan).length;
  const staffCount = activities.filter((a) => a.staffSupported).length;
  const feedbackCount = activities.filter((a) => a.feedbackObtained).length;
  const uniqueTypes = new Set(activities.map((a) => a.activityType)).size;
  const diversityRatio = pct(uniqueTypes, 8);

  const documentedRate = pct(documentedCount, total);
  const staffSupportedRate = pct(staffCount, total);
  const feedbackRate = pct(feedbackCount, total);

  const docScore = Math.round((documentedRate / 100) * 8);
  const staffScore = Math.round((staffSupportedRate / 100) * 7);
  const fbScore = Math.round((feedbackRate / 100) * 5);
  const divScore = Math.round((diversityRatio / 100) * 5);

  const overallScore = Math.min(25, docScore + staffScore + fbScore + divScore);

  return { overallScore, documentedRate, staffSupportedRate, feedbackRate, activityDiversityRatio: diversityRatio };
}

export function evaluateCommunityPolicy(policy: CommunityPolicy | null): CommunityPolicyResult {
  if (!policy) {
    return {
      overallScore: 0,
      communityEngagementStrategy: false,
      socialInclusionFramework: false,
      activityAccessPolicy: false,
      safeguardingInCommunity: false,
      transportArrangements: false,
      partnershipAgreements: false,
      regularReview: false,
    };
  }

  let score = 0;
  if (policy.communityEngagementStrategy) score += 4;
  if (policy.socialInclusionFramework) score += 4;
  if (policy.activityAccessPolicy) score += 4;
  if (policy.safeguardingInCommunity) score += 4;
  if (policy.transportArrangements) score += 3;
  if (policy.partnershipAgreements) score += 3;
  if (policy.regularReview) score += 3;

  return {
    overallScore: Math.min(25, score),
    communityEngagementStrategy: policy.communityEngagementStrategy,
    socialInclusionFramework: policy.socialInclusionFramework,
    activityAccessPolicy: policy.activityAccessPolicy,
    safeguardingInCommunity: policy.safeguardingInCommunity,
    transportArrangements: policy.transportArrangements,
    partnershipAgreements: policy.partnershipAgreements,
    regularReview: policy.regularReview,
  };
}

export function evaluateStaffCommunityReadiness(training: StaffCommunityTraining[]): StaffCommunityReadinessResult {
  if (training.length === 0) {
    return { overallScore: 0, totalStaff: 0, communityEngagementRate: 0, socialInclusionRate: 0, safeguardingInCommunityRate: 0, activityPlanningRate: 0, partnershipWorkingRate: 0, documentationRate: 0 };
  }

  const total = training.length;
  const ceCount = training.filter((t) => t.communityEngagement).length;
  const siCount = training.filter((t) => t.socialInclusion).length;
  const sgCount = training.filter((t) => t.safeguardingInCommunity).length;
  const apCount = training.filter((t) => t.activityPlanning).length;
  const pwCount = training.filter((t) => t.partnershipWorking).length;
  const docCount = training.filter((t) => t.documentationSkills).length;

  const communityEngagementRate = pct(ceCount, total);
  const socialInclusionRate = pct(siCount, total);
  const safeguardingInCommunityRate = pct(sgCount, total);
  const activityPlanningRate = pct(apCount, total);
  const partnershipWorkingRate = pct(pwCount, total);
  const documentationRate = pct(docCount, total);

  const s1 = Math.round((communityEngagementRate / 100) * 6);
  const s2 = Math.round((socialInclusionRate / 100) * 5);
  const s3 = Math.round((safeguardingInCommunityRate / 100) * 5);
  const s4 = Math.round((activityPlanningRate / 100) * 4);
  const s5 = Math.round((partnershipWorkingRate / 100) * 3);
  const s6 = Math.round((documentationRate / 100) * 2);

  const overallScore = Math.min(25, s1 + s2 + s3 + s4 + s5 + s6);

  return { overallScore, totalStaff: total, communityEngagementRate, socialInclusionRate, safeguardingInCommunityRate, activityPlanningRate, partnershipWorkingRate, documentationRate };
}

// ── Child profiles ───────────────────────────────────────────────────────────

export function buildChildCommunityProfiles(activities: CommunityActivity[]): ChildCommunityProfile[] {
  if (activities.length === 0) return [];

  const grouped = new Map<string, CommunityActivity[]>();
  for (const a of activities) {
    if (!grouped.has(a.childId)) grouped.set(a.childId, []);
    grouped.get(a.childId)!.push(a);
  }

  const profiles: ChildCommunityProfile[] = [];

  for (const [childId, acts] of grouped) {
    const childName = acts[0].childName;
    const total = acts.length;
    const participatingCount = acts.filter((a) => a.participationLevel === "highly_engaged" || a.participationLevel === "regular_participant").length;
    const childInitiatedCount = acts.filter((a) => a.childInitiated).length;

    const participationRate = pct(participatingCount, total);
    const childInitiatedRate = pct(childInitiatedCount, total);

    let freqScore = 0;
    if (total >= 10) freqScore = 2;
    else if (total >= 5) freqScore = 1;

    let partScore = 0;
    if (participationRate >= 80) partScore = 3;
    else if (participationRate >= 60) partScore = 2;
    else if (participationRate >= 40) partScore = 1;

    let initScore = 0;
    if (childInitiatedRate >= 80) initScore = 3;
    else if (childInitiatedRate >= 60) initScore = 2;
    else if (childInitiatedRate >= 40) initScore = 1;

    const uniqueTypes = new Set(acts.map((a) => a.activityType)).size;
    let divScore = 0;
    if (uniqueTypes >= 4) divScore = 2;
    else if (uniqueTypes >= 2) divScore = 1;

    const overallScore = Math.min(10, freqScore + partScore + initScore + divScore);

    profiles.push({ childId, childName, totalActivities: total, participationRate, childInitiatedRate, overallScore });
  }

  return profiles;
}

// ── Orchestrator ─────────────────────────────────────────────────────────────

export function generateCommunityEngagementParticipationIntelligence(
  activities: CommunityActivity[],
  policy: CommunityPolicy | null,
  training: StaffCommunityTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): CommunityEngagementParticipationIntelligence {
  const engagementQuality = evaluateEngagementQuality(activities);
  const engagementCompliance = evaluateEngagementCompliance(activities);
  const communityPolicy = evaluateCommunityPolicy(policy);
  const staffCommunityReadiness = evaluateStaffCommunityReadiness(training);

  const overallScore = Math.min(100, engagementQuality.overallScore + engagementCompliance.overallScore + communityPolicy.overallScore + staffCommunityReadiness.overallScore);
  const rating = getRating(overallScore);

  const childProfiles = buildChildCommunityProfiles(activities);

  const strengths: string[] = [];
  const areasForImprovement: string[] = [];
  const actions: string[] = [];

  if (engagementQuality.participationRate >= 80) strengths.push("Strong community participation — children are actively engaged in community activities");
  if (engagementQuality.childInitiatedRate >= 80) strengths.push("Children are consistently initiating their own community engagement choices");
  if (engagementQuality.socialSkillsRate >= 80) strengths.push("Social skills development is consistently evidenced through community activities");
  if (engagementCompliance.documentedRate >= 80) strengths.push("Excellent documentation of community engagement in care plans");

  if (activities.length > 0 && engagementQuality.participationRate < 60) areasForImprovement.push("Community participation rates need improvement — review barriers to engagement");
  if (activities.length > 0 && engagementQuality.childInitiatedRate < 60) areasForImprovement.push("Children's own choices not consistently driving community engagement — embed voice");
  if (activities.length > 0 && engagementCompliance.feedbackRate < 60) areasForImprovement.push("Feedback on community activities not consistently obtained — improve review process");
  if (activities.length > 0 && engagementQuality.communityLinksRate < 60) areasForImprovement.push("Community links not consistently strengthened — develop partnership approach");

  if (activities.length === 0) actions.push("No community activity records found — develop and implement engagement programme");
  if (!policy) actions.push("URGENT: No community engagement policy in place — develop and implement immediately");
  if (training.length === 0) actions.push("URGENT: No staff community training recorded — arrange training for all staff");
  if (activities.length > 0 && engagementCompliance.staffSupportedRate < 60) actions.push("Improve staff support for community activities");
  if (activities.length > 0 && engagementQuality.socialSkillsRate < 60) actions.push("Strengthen social skills development through community engagement");

  const regulatoryLinks: string[] = [
    "CHR 2015 Regulation 6 — Health and well-being standard",
    "CHR 2015 Regulation 9 — Quality of care standard",
    "SCCIF — Experiences and progress of children",
    "NMS 7 — Leisure activities",
    "Children Act 1989 — Welfare and upbringing",
    "UNCRC Article 31 — Right to leisure and cultural activities",
    "Social inclusion guidance for residential care",
  ];

  return {
    homeId, periodStart, periodEnd, overallScore, rating,
    engagementQuality, engagementCompliance, communityPolicy, staffCommunityReadiness,
    childProfiles, strengths, areasForImprovement, actions, regulatoryLinks,
  };
}
