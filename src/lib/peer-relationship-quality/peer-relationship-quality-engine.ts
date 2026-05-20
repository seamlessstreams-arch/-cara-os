// Peer Relationship Quality Intelligence Engine
// Pure deterministic — no AI, no external calls, no randomness, no Date.now()

// ── Type unions ──────────────────────────────────────────────────────────────

export type InteractionType =
  | "shared_activity"
  | "conflict_resolution"
  | "cooperative_play"
  | "peer_mentoring"
  | "group_project"
  | "social_event"
  | "team_sport"
  | "creative_collaboration";

export type RelationshipQualityLevel =
  | "thriving"
  | "positive"
  | "developing"
  | "strained"
  | "isolated";

export type Rating = "outstanding" | "good" | "requires_improvement" | "inadequate";

// ── Label maps ───────────────────────────────────────────────────────────────

const INTERACTION_TYPE_LABELS: Record<InteractionType, string> = {
  shared_activity: "Shared Activity",
  conflict_resolution: "Conflict Resolution",
  cooperative_play: "Cooperative Play",
  peer_mentoring: "Peer Mentoring",
  group_project: "Group Project",
  social_event: "Social Event",
  team_sport: "Team Sport",
  creative_collaboration: "Creative Collaboration",
};

const RELATIONSHIP_QUALITY_LABELS: Record<RelationshipQualityLevel, string> = {
  thriving: "Thriving",
  positive: "Positive",
  developing: "Developing",
  strained: "Strained",
  isolated: "Isolated",
};

const RATING_LABELS: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getInteractionTypeLabel(v: InteractionType): string { return INTERACTION_TYPE_LABELS[v]; }
export function getRelationshipQualityLabel(v: RelationshipQualityLevel): string { return RELATIONSHIP_QUALITY_LABELS[v]; }
export function getRatingLabel(v: Rating): string { return RATING_LABELS[v]; }

// ── Input interfaces ─────────────────────────────────────────────────────────

export interface PeerInteraction {
  id: string;
  childId: string;
  childName: string;
  interactionDate: string;
  interactionType: InteractionType;
  relationshipQuality: RelationshipQualityLevel;
  positiveEngagement: boolean;
  conflictResolvedConstructively: boolean;
  socialSkillsDemonstrated: boolean;
  documentedInPlan: boolean;
  staffFacilitated: boolean;
  feedbackGiven: boolean;
}

export interface PeerRelationshipPolicy {
  id: string;
  positiveRelationshipsStrategy: boolean;
  antibullyingPolicy: boolean;
  conflictResolutionFramework: boolean;
  socialSkillsProgramme: boolean;
  peerMentoringScheme: boolean;
  inclusionStrategy: boolean;
  regularReview: boolean;
}

export interface StaffPeerSupportTraining {
  id: string;
  staffId: string;
  staffName: string;
  relationshipBuilding: boolean;
  conflictMediation: boolean;
  antibullyingAwareness: boolean;
  socialSkillsFacilitation: boolean;
  therapeuticGroupWork: boolean;
  restorativePractice: boolean;
}

// ── Result interfaces ────────────────────────────────────────────────────────

export interface PeerQualityResult {
  overallScore: number;
  totalInteractions: number;
  positiveRelationshipRate: number;
  positiveEngagementRate: number;
  conflictResolutionRate: number;
  socialSkillsRate: number;
}

export interface PeerComplianceResult {
  overallScore: number;
  documentedRate: number;
  staffFacilitatedRate: number;
  feedbackRate: number;
  interactionDiversityRatio: number;
}

export interface PeerPolicyResult {
  overallScore: number;
  positiveRelationshipsStrategy: boolean;
  antibullyingPolicy: boolean;
  conflictResolutionFramework: boolean;
  socialSkillsProgramme: boolean;
  peerMentoringScheme: boolean;
  inclusionStrategy: boolean;
  regularReview: boolean;
}

export interface StaffPeerReadinessResult {
  overallScore: number;
  totalStaff: number;
  relationshipBuildingRate: number;
  conflictMediationRate: number;
  antibullyingAwarenessRate: number;
  socialSkillsFacilitationRate: number;
  therapeuticGroupWorkRate: number;
  restorativePracticeRate: number;
}

export interface ChildPeerProfile {
  childId: string;
  childName: string;
  totalInteractions: number;
  positiveRelationshipRate: number;
  positiveEngagementRate: number;
  overallScore: number;
}

export interface PeerRelationshipQualityIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  peerQuality: PeerQualityResult;
  peerCompliance: PeerComplianceResult;
  peerPolicy: PeerPolicyResult;
  staffPeerReadiness: StaffPeerReadinessResult;
  childProfiles: ChildPeerProfile[];
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

export function evaluatePeerQuality(interactions: PeerInteraction[]): PeerQualityResult {
  if (interactions.length === 0) {
    return { overallScore: 0, totalInteractions: 0, positiveRelationshipRate: 0, positiveEngagementRate: 0, conflictResolutionRate: 0, socialSkillsRate: 0 };
  }

  const total = interactions.length;
  const positiveCount = interactions.filter((i) => i.relationshipQuality === "thriving" || i.relationshipQuality === "positive").length;
  const engagementCount = interactions.filter((i) => i.positiveEngagement).length;
  const conflictCount = interactions.filter((i) => i.conflictResolvedConstructively).length;
  const socialCount = interactions.filter((i) => i.socialSkillsDemonstrated).length;

  const positiveRelationshipRate = pct(positiveCount, total);
  const positiveEngagementRate = pct(engagementCount, total);
  const conflictResolutionRate = pct(conflictCount, total);
  const socialSkillsRate = pct(socialCount, total);

  const prScore = Math.round((positiveRelationshipRate / 100) * 7);
  const peScore = Math.round((positiveEngagementRate / 100) * 6);
  const crScore = Math.round((conflictResolutionRate / 100) * 6);
  const ssScore = Math.round((socialSkillsRate / 100) * 6);

  const overallScore = Math.min(25, prScore + peScore + crScore + ssScore);

  return { overallScore, totalInteractions: total, positiveRelationshipRate, positiveEngagementRate, conflictResolutionRate, socialSkillsRate };
}

export function evaluatePeerCompliance(interactions: PeerInteraction[]): PeerComplianceResult {
  if (interactions.length === 0) {
    return { overallScore: 0, documentedRate: 0, staffFacilitatedRate: 0, feedbackRate: 0, interactionDiversityRatio: 0 };
  }

  const total = interactions.length;
  const documentedCount = interactions.filter((i) => i.documentedInPlan).length;
  const staffCount = interactions.filter((i) => i.staffFacilitated).length;
  const feedbackCount = interactions.filter((i) => i.feedbackGiven).length;
  const uniqueTypes = new Set(interactions.map((i) => i.interactionType)).size;
  const diversityRatio = pct(uniqueTypes, 8);

  const documentedRate = pct(documentedCount, total);
  const staffFacilitatedRate = pct(staffCount, total);
  const feedbackRate = pct(feedbackCount, total);

  const docScore = Math.round((documentedRate / 100) * 8);
  const sfScore = Math.round((staffFacilitatedRate / 100) * 7);
  const fbScore = Math.round((feedbackRate / 100) * 5);
  const divScore = Math.round((diversityRatio / 100) * 5);

  const overallScore = Math.min(25, docScore + sfScore + fbScore + divScore);

  return { overallScore, documentedRate, staffFacilitatedRate, feedbackRate, interactionDiversityRatio: diversityRatio };
}

export function evaluatePeerPolicy(policy: PeerRelationshipPolicy | null): PeerPolicyResult {
  if (!policy) {
    return {
      overallScore: 0,
      positiveRelationshipsStrategy: false,
      antibullyingPolicy: false,
      conflictResolutionFramework: false,
      socialSkillsProgramme: false,
      peerMentoringScheme: false,
      inclusionStrategy: false,
      regularReview: false,
    };
  }

  let score = 0;
  if (policy.positiveRelationshipsStrategy) score += 4;
  if (policy.antibullyingPolicy) score += 4;
  if (policy.conflictResolutionFramework) score += 4;
  if (policy.socialSkillsProgramme) score += 4;
  if (policy.peerMentoringScheme) score += 3;
  if (policy.inclusionStrategy) score += 3;
  if (policy.regularReview) score += 3;

  return {
    overallScore: Math.min(25, score),
    positiveRelationshipsStrategy: policy.positiveRelationshipsStrategy,
    antibullyingPolicy: policy.antibullyingPolicy,
    conflictResolutionFramework: policy.conflictResolutionFramework,
    socialSkillsProgramme: policy.socialSkillsProgramme,
    peerMentoringScheme: policy.peerMentoringScheme,
    inclusionStrategy: policy.inclusionStrategy,
    regularReview: policy.regularReview,
  };
}

export function evaluateStaffPeerReadiness(training: StaffPeerSupportTraining[]): StaffPeerReadinessResult {
  if (training.length === 0) {
    return { overallScore: 0, totalStaff: 0, relationshipBuildingRate: 0, conflictMediationRate: 0, antibullyingAwarenessRate: 0, socialSkillsFacilitationRate: 0, therapeuticGroupWorkRate: 0, restorativePracticeRate: 0 };
  }

  const total = training.length;
  const rbCount = training.filter((t) => t.relationshipBuilding).length;
  const cmCount = training.filter((t) => t.conflictMediation).length;
  const abCount = training.filter((t) => t.antibullyingAwareness).length;
  const sfCount = training.filter((t) => t.socialSkillsFacilitation).length;
  const tgCount = training.filter((t) => t.therapeuticGroupWork).length;
  const rpCount = training.filter((t) => t.restorativePractice).length;

  const relationshipBuildingRate = pct(rbCount, total);
  const conflictMediationRate = pct(cmCount, total);
  const antibullyingAwarenessRate = pct(abCount, total);
  const socialSkillsFacilitationRate = pct(sfCount, total);
  const therapeuticGroupWorkRate = pct(tgCount, total);
  const restorativePracticeRate = pct(rpCount, total);

  const s1 = Math.round((relationshipBuildingRate / 100) * 6);
  const s2 = Math.round((conflictMediationRate / 100) * 5);
  const s3 = Math.round((antibullyingAwarenessRate / 100) * 5);
  const s4 = Math.round((socialSkillsFacilitationRate / 100) * 4);
  const s5 = Math.round((therapeuticGroupWorkRate / 100) * 3);
  const s6 = Math.round((restorativePracticeRate / 100) * 2);

  const overallScore = Math.min(25, s1 + s2 + s3 + s4 + s5 + s6);

  return { overallScore, totalStaff: total, relationshipBuildingRate, conflictMediationRate, antibullyingAwarenessRate, socialSkillsFacilitationRate, therapeuticGroupWorkRate, restorativePracticeRate };
}

// ── Child profiles ───────────────────────────────────────────────────────────

export function buildChildPeerProfiles(interactions: PeerInteraction[]): ChildPeerProfile[] {
  if (interactions.length === 0) return [];

  const grouped = new Map<string, PeerInteraction[]>();
  for (const i of interactions) {
    if (!grouped.has(i.childId)) grouped.set(i.childId, []);
    grouped.get(i.childId)!.push(i);
  }

  const profiles: ChildPeerProfile[] = [];

  for (const [childId, ints] of grouped) {
    const childName = ints[0].childName;
    const total = ints.length;
    const positiveCount = ints.filter((i) => i.relationshipQuality === "thriving" || i.relationshipQuality === "positive").length;
    const engagementCount = ints.filter((i) => i.positiveEngagement).length;

    const positiveRelationshipRate = pct(positiveCount, total);
    const positiveEngagementRate = pct(engagementCount, total);

    let freqScore = 0;
    if (total >= 10) freqScore = 2;
    else if (total >= 5) freqScore = 1;

    let prScore = 0;
    if (positiveRelationshipRate >= 80) prScore = 3;
    else if (positiveRelationshipRate >= 60) prScore = 2;
    else if (positiveRelationshipRate >= 40) prScore = 1;

    let peScore = 0;
    if (positiveEngagementRate >= 80) peScore = 3;
    else if (positiveEngagementRate >= 60) peScore = 2;
    else if (positiveEngagementRate >= 40) peScore = 1;

    const uniqueTypes = new Set(ints.map((i) => i.interactionType)).size;
    let divScore = 0;
    if (uniqueTypes >= 4) divScore = 2;
    else if (uniqueTypes >= 2) divScore = 1;

    const overallScore = Math.min(10, freqScore + prScore + peScore + divScore);

    profiles.push({ childId, childName, totalInteractions: total, positiveRelationshipRate, positiveEngagementRate, overallScore });
  }

  return profiles;
}

// ── Orchestrator ─────────────────────────────────────────────────────────────

export function generatePeerRelationshipQualityIntelligence(
  interactions: PeerInteraction[],
  policy: PeerRelationshipPolicy | null,
  training: StaffPeerSupportTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): PeerRelationshipQualityIntelligence {
  const peerQuality = evaluatePeerQuality(interactions);
  const peerCompliance = evaluatePeerCompliance(interactions);
  const peerPolicy = evaluatePeerPolicy(policy);
  const staffPeerReadiness = evaluateStaffPeerReadiness(training);

  const overallScore = Math.min(100, peerQuality.overallScore + peerCompliance.overallScore + peerPolicy.overallScore + staffPeerReadiness.overallScore);
  const rating = getRating(overallScore);

  const childProfiles = buildChildPeerProfiles(interactions);

  const strengths: string[] = [];
  const areasForImprovement: string[] = [];
  const actions: string[] = [];

  if (peerQuality.positiveRelationshipRate >= 80) strengths.push("Children are forming thriving and positive peer relationships consistently");
  if (peerQuality.positiveEngagementRate >= 80) strengths.push("High levels of positive engagement observed across peer interactions");
  if (peerQuality.conflictResolutionRate >= 80) strengths.push("Conflicts are being resolved constructively, demonstrating strong social skills");
  if (peerCompliance.documentedRate >= 80) strengths.push("Peer interactions and relationship progress are well documented in care plans");

  if (interactions.length > 0 && peerQuality.positiveRelationshipRate < 60) areasForImprovement.push("Peer relationship quality needs improvement — review social skills support strategies");
  if (interactions.length > 0 && peerQuality.conflictResolutionRate < 60) areasForImprovement.push("Conflict resolution skills need strengthening — consider restorative practice approaches");
  if (interactions.length > 0 && peerQuality.socialSkillsRate < 60) areasForImprovement.push("Social skills demonstration is below expected levels — embed targeted interventions");
  if (interactions.length > 0 && peerCompliance.staffFacilitatedRate < 60) areasForImprovement.push("Staff facilitation of peer interactions needs improvement");

  if (interactions.length === 0) actions.push("No peer interaction records found — begin tracking peer relationships and social engagement");
  if (!policy) actions.push("URGENT: No peer relationship policy in place — develop and implement immediately");
  if (training.length === 0) actions.push("URGENT: No staff peer support training recorded — arrange training for all staff");
  if (interactions.length > 0 && peerQuality.positiveEngagementRate < 60) actions.push("Develop structured peer engagement activities to improve positive interaction rates");
  if (interactions.length > 0 && peerCompliance.feedbackRate < 60) actions.push("Improve feedback processes for peer interaction observations");

  const regulatoryLinks: string[] = [
    "CHR 2015 Regulation 7 — The children's wishes and feelings standard",
    "CHR 2015 Regulation 11 — The positive relationships standard",
    "SCCIF — Relationships and social development",
    "NMS 11 — Provision and preparation for the child",
    "Children Act 1989 — Welfare of the child paramount",
    "UNCRC Article 15 — Freedom of association",
    "NICE Guideline CG76 — Social and emotional wellbeing",
  ];

  return {
    homeId, periodStart, periodEnd, overallScore, rating,
    peerQuality, peerCompliance, peerPolicy, staffPeerReadiness,
    childProfiles, strengths, areasForImprovement, actions, regulatoryLinks,
  };
}
