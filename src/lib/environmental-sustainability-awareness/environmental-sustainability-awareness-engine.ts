// Environmental Sustainability Awareness Intelligence Engine
// Pure deterministic — no AI, no external calls, no randomness, no Date.now()

// ── Type unions ──────────────────────────────────────────────────────────────

export type ActivityType =
  | "recycling_project"
  | "garden_maintenance"
  | "energy_conservation"
  | "nature_walk"
  | "wildlife_care"
  | "eco_workshop"
  | "sustainability_discussion"
  | "community_cleanup";

export type EngagementLevel =
  | "highly_engaged"
  | "engaged"
  | "moderate"
  | "minimal"
  | "disengaged";

export type Rating = "outstanding" | "good" | "requires_improvement" | "inadequate";

// ── Label maps ───────────────────────────────────────────────────────────────

const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  recycling_project: "Recycling Project",
  garden_maintenance: "Garden Maintenance",
  energy_conservation: "Energy Conservation",
  nature_walk: "Nature Walk",
  wildlife_care: "Wildlife Care",
  eco_workshop: "Eco Workshop",
  sustainability_discussion: "Sustainability Discussion",
  community_cleanup: "Community Cleanup",
};

const ENGAGEMENT_LEVEL_LABELS: Record<EngagementLevel, string> = {
  highly_engaged: "Highly Engaged",
  engaged: "Engaged",
  moderate: "Moderate",
  minimal: "Minimal",
  disengaged: "Disengaged",
};

const RATING_LABELS: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getActivityTypeLabel(v: ActivityType): string { return ACTIVITY_TYPE_LABELS[v]; }
export function getEngagementLevelLabel(v: EngagementLevel): string { return ENGAGEMENT_LEVEL_LABELS[v]; }
export function getRatingLabel(v: Rating): string { return RATING_LABELS[v]; }

// ── Input interfaces ─────────────────────────────────────────────────────────

export interface EcoActivity {
  id: string;
  childId: string;
  childName: string;
  activityDate: string;
  activityType: ActivityType;
  engagementLevel: EngagementLevel;
  knowledgeDemonstrated: boolean;
  initiativeTaken: boolean;
  habitsFormed: boolean;
  documentedInPlan: boolean;
  staffSupported: boolean;
  feedbackGiven: boolean;
}

export interface EnvironmentalPolicy {
  id: string;
  sustainabilityStrategy: boolean;
  recyclingProcedure: boolean;
  energyManagementPlan: boolean;
  gardenAndNaturePolicy: boolean;
  ecoEducationFramework: boolean;
  communityPartnership: boolean;
  regularReview: boolean;
}

export interface StaffEnvironmentalTraining {
  id: string;
  staffId: string;
  staffName: string;
  sustainabilityAwareness: boolean;
  ecoEducation: boolean;
  gardenManagement: boolean;
  energyConservation: boolean;
  wildlifeKnowledge: boolean;
  communityEngagement: boolean;
}

// ── Result interfaces ────────────────────────────────────────────────────────

export interface EcoQualityResult {
  overallScore: number;
  totalActivities: number;
  engagementRate: number;
  knowledgeRate: number;
  initiativeRate: number;
  habitsRate: number;
}

export interface EcoComplianceResult {
  overallScore: number;
  documentedRate: number;
  staffSupportedRate: number;
  feedbackRate: number;
  activityDiversityRatio: number;
}

export interface EnvironmentalPolicyResult {
  overallScore: number;
  sustainabilityStrategy: boolean;
  recyclingProcedure: boolean;
  energyManagementPlan: boolean;
  gardenAndNaturePolicy: boolean;
  ecoEducationFramework: boolean;
  communityPartnership: boolean;
  regularReview: boolean;
}

export interface StaffEnvironmentalReadinessResult {
  overallScore: number;
  totalStaff: number;
  sustainabilityAwarenessRate: number;
  ecoEducationRate: number;
  gardenManagementRate: number;
  energyConservationRate: number;
  wildlifeKnowledgeRate: number;
  communityEngagementRate: number;
}

export interface ChildEnvironmentalProfile {
  childId: string;
  childName: string;
  totalActivities: number;
  engagementRate: number;
  knowledgeRate: number;
  overallScore: number;
}

export interface EnvironmentalSustainabilityAwarenessIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  ecoQuality: EcoQualityResult;
  ecoCompliance: EcoComplianceResult;
  environmentalPolicy: EnvironmentalPolicyResult;
  staffEnvironmentalReadiness: StaffEnvironmentalReadinessResult;
  childProfiles: ChildEnvironmentalProfile[];
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

export function evaluateEcoQuality(activities: EcoActivity[]): EcoQualityResult {
  if (activities.length === 0) {
    return { overallScore: 0, totalActivities: 0, engagementRate: 0, knowledgeRate: 0, initiativeRate: 0, habitsRate: 0 };
  }

  const total = activities.length;
  const engagedCount = activities.filter((a) => a.engagementLevel === "highly_engaged" || a.engagementLevel === "engaged").length;
  const knowledgeCount = activities.filter((a) => a.knowledgeDemonstrated).length;
  const initiativeCount = activities.filter((a) => a.initiativeTaken).length;
  const habitsCount = activities.filter((a) => a.habitsFormed).length;

  const engagementRate = pct(engagedCount, total);
  const knowledgeRate = pct(knowledgeCount, total);
  const initiativeRate = pct(initiativeCount, total);
  const habitsRate = pct(habitsCount, total);

  const enScore = Math.round((engagementRate / 100) * 7);
  const knScore = Math.round((knowledgeRate / 100) * 6);
  const inScore = Math.round((initiativeRate / 100) * 6);
  const haScore = Math.round((habitsRate / 100) * 6);

  const overallScore = Math.min(25, enScore + knScore + inScore + haScore);

  return { overallScore, totalActivities: total, engagementRate, knowledgeRate, initiativeRate, habitsRate };
}

export function evaluateEcoCompliance(activities: EcoActivity[]): EcoComplianceResult {
  if (activities.length === 0) {
    return { overallScore: 0, documentedRate: 0, staffSupportedRate: 0, feedbackRate: 0, activityDiversityRatio: 0 };
  }

  const total = activities.length;
  const documentedCount = activities.filter((a) => a.documentedInPlan).length;
  const staffCount = activities.filter((a) => a.staffSupported).length;
  const feedbackCount = activities.filter((a) => a.feedbackGiven).length;
  const uniqueTypes = new Set(activities.map((a) => a.activityType)).size;
  const diversityRatio = pct(uniqueTypes, 8);

  const documentedRate = pct(documentedCount, total);
  const staffSupportedRate = pct(staffCount, total);
  const feedbackRate = pct(feedbackCount, total);

  const docScore = Math.round((documentedRate / 100) * 8);
  const sfScore = Math.round((staffSupportedRate / 100) * 7);
  const fbScore = Math.round((feedbackRate / 100) * 5);
  const divScore = Math.round((diversityRatio / 100) * 5);

  const overallScore = Math.min(25, docScore + sfScore + fbScore + divScore);

  return { overallScore, documentedRate, staffSupportedRate, feedbackRate, activityDiversityRatio: diversityRatio };
}

export function evaluateEnvironmentalPolicy(policy: EnvironmentalPolicy | null): EnvironmentalPolicyResult {
  if (!policy) {
    return { overallScore: 0, sustainabilityStrategy: false, recyclingProcedure: false, energyManagementPlan: false, gardenAndNaturePolicy: false, ecoEducationFramework: false, communityPartnership: false, regularReview: false };
  }

  let score = 0;
  if (policy.sustainabilityStrategy) score += 4;
  if (policy.recyclingProcedure) score += 4;
  if (policy.energyManagementPlan) score += 4;
  if (policy.gardenAndNaturePolicy) score += 4;
  if (policy.ecoEducationFramework) score += 3;
  if (policy.communityPartnership) score += 3;
  if (policy.regularReview) score += 3;

  return {
    overallScore: Math.min(25, score),
    sustainabilityStrategy: policy.sustainabilityStrategy, recyclingProcedure: policy.recyclingProcedure,
    energyManagementPlan: policy.energyManagementPlan, gardenAndNaturePolicy: policy.gardenAndNaturePolicy,
    ecoEducationFramework: policy.ecoEducationFramework, communityPartnership: policy.communityPartnership,
    regularReview: policy.regularReview,
  };
}

export function evaluateStaffEnvironmentalReadiness(training: StaffEnvironmentalTraining[]): StaffEnvironmentalReadinessResult {
  if (training.length === 0) {
    return { overallScore: 0, totalStaff: 0, sustainabilityAwarenessRate: 0, ecoEducationRate: 0, gardenManagementRate: 0, energyConservationRate: 0, wildlifeKnowledgeRate: 0, communityEngagementRate: 0 };
  }

  const total = training.length;
  const saRate = pct(training.filter((t) => t.sustainabilityAwareness).length, total);
  const eeRate = pct(training.filter((t) => t.ecoEducation).length, total);
  const gmRate = pct(training.filter((t) => t.gardenManagement).length, total);
  const ecRate = pct(training.filter((t) => t.energyConservation).length, total);
  const wkRate = pct(training.filter((t) => t.wildlifeKnowledge).length, total);
  const ceRate = pct(training.filter((t) => t.communityEngagement).length, total);

  const s1 = Math.round((saRate / 100) * 6);
  const s2 = Math.round((eeRate / 100) * 5);
  const s3 = Math.round((gmRate / 100) * 5);
  const s4 = Math.round((ecRate / 100) * 4);
  const s5 = Math.round((wkRate / 100) * 3);
  const s6 = Math.round((ceRate / 100) * 2);

  const overallScore = Math.min(25, s1 + s2 + s3 + s4 + s5 + s6);

  return { overallScore, totalStaff: total, sustainabilityAwarenessRate: saRate, ecoEducationRate: eeRate, gardenManagementRate: gmRate, energyConservationRate: ecRate, wildlifeKnowledgeRate: wkRate, communityEngagementRate: ceRate };
}

// ── Child profiles ───────────────────────────────────────────────────────────

export function buildChildEnvironmentalProfiles(activities: EcoActivity[]): ChildEnvironmentalProfile[] {
  if (activities.length === 0) return [];

  const grouped = new Map<string, EcoActivity[]>();
  for (const a of activities) {
    if (!grouped.has(a.childId)) grouped.set(a.childId, []);
    grouped.get(a.childId)!.push(a);
  }

  const profiles: ChildEnvironmentalProfile[] = [];

  for (const [childId, acts] of grouped) {
    const childName = acts[0].childName;
    const total = acts.length;
    const engagedCount = acts.filter((a) => a.engagementLevel === "highly_engaged" || a.engagementLevel === "engaged").length;
    const knowledgeCount = acts.filter((a) => a.knowledgeDemonstrated).length;

    const engagementRate = pct(engagedCount, total);
    const knowledgeRate = pct(knowledgeCount, total);

    let freqScore = 0;
    if (total >= 10) freqScore = 2;
    else if (total >= 5) freqScore = 1;

    let enScore = 0;
    if (engagementRate >= 80) enScore = 3;
    else if (engagementRate >= 60) enScore = 2;
    else if (engagementRate >= 40) enScore = 1;

    let knScore = 0;
    if (knowledgeRate >= 80) knScore = 3;
    else if (knowledgeRate >= 60) knScore = 2;
    else if (knowledgeRate >= 40) knScore = 1;

    const uniqueTypes = new Set(acts.map((a) => a.activityType)).size;
    let divScore = 0;
    if (uniqueTypes >= 4) divScore = 2;
    else if (uniqueTypes >= 2) divScore = 1;

    const overallScore = Math.min(10, freqScore + enScore + knScore + divScore);

    profiles.push({ childId, childName, totalActivities: total, engagementRate, knowledgeRate, overallScore });
  }

  return profiles;
}

// ── Orchestrator ─────────────────────────────────────────────────────────────

export function generateEnvironmentalSustainabilityAwarenessIntelligence(
  activities: EcoActivity[],
  policy: EnvironmentalPolicy | null,
  training: StaffEnvironmentalTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): EnvironmentalSustainabilityAwarenessIntelligence {
  const ecoQuality = evaluateEcoQuality(activities);
  const ecoCompliance = evaluateEcoCompliance(activities);
  const environmentalPolicy = evaluateEnvironmentalPolicy(policy);
  const staffEnvironmentalReadiness = evaluateStaffEnvironmentalReadiness(training);

  const overallScore = Math.min(100, ecoQuality.overallScore + ecoCompliance.overallScore + environmentalPolicy.overallScore + staffEnvironmentalReadiness.overallScore);
  const rating = getRating(overallScore);

  const childProfiles = buildChildEnvironmentalProfiles(activities);

  const strengths: string[] = [];
  const areasForImprovement: string[] = [];
  const actions: string[] = [];

  if (ecoQuality.engagementRate >= 80) strengths.push("Children are highly engaged in environmental and sustainability activities");
  if (ecoQuality.knowledgeRate >= 80) strengths.push("Strong environmental knowledge demonstrated across activities");
  if (ecoQuality.initiativeRate >= 80) strengths.push("Children are showing initiative in eco-friendly behaviours and projects");
  if (ecoCompliance.documentedRate >= 80) strengths.push("Environmental activities are well documented in care plans");

  if (activities.length > 0 && ecoQuality.engagementRate < 60) areasForImprovement.push("Environmental engagement needs improvement — diversify activities to increase participation");
  if (activities.length > 0 && ecoQuality.habitsRate < 60) areasForImprovement.push("Sustainable habit formation is below expected levels — embed eco-routines into daily life");
  if (activities.length > 0 && ecoQuality.knowledgeRate < 60) areasForImprovement.push("Environmental knowledge development needs strengthening across the cohort");
  if (activities.length > 0 && ecoCompliance.staffSupportedRate < 60) areasForImprovement.push("Staff support for environmental activities needs improvement");

  if (activities.length === 0) actions.push("No environmental activity records found — begin tracking eco-engagement and sustainability education");
  if (!policy) actions.push("URGENT: No environmental sustainability policy in place — develop and implement immediately");
  if (training.length === 0) actions.push("URGENT: No staff environmental training recorded — arrange training for all staff");
  if (activities.length > 0 && ecoQuality.initiativeRate < 60) actions.push("Encourage children to take more initiative in environmental projects");
  if (activities.length > 0 && ecoCompliance.feedbackRate < 60) actions.push("Improve feedback processes for environmental activities");

  const regulatoryLinks: string[] = [
    "CHR 2015 Regulation 5 — Engaging with the wider community",
    "CHR 2015 Regulation 9 — Quality of care standard (environment)",
    "SCCIF — Experiences and progress of children",
    "NMS 10 — Enjoying and achieving",
    "UNCRC Article 29 — Education directed to respect for the natural environment",
    "Environment Act 2021 — Environmental duties",
    "DfE Sustainability and Climate Change Strategy 2022",
  ];

  return {
    homeId, periodStart, periodEnd, overallScore, rating,
    ecoQuality, ecoCompliance, environmentalPolicy, staffEnvironmentalReadiness,
    childProfiles, strengths, areasForImprovement, actions, regulatoryLinks,
  };
}
