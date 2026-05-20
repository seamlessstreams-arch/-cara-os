// Key Worker Relationship Intelligence Engine
// Pure deterministic — no AI, no external calls, no randomness, no Date.now()

// ── Type unions ──────────────────────────────────────────────────────────────

export type SessionType =
  | "one_to_one"
  | "activity_based"
  | "goal_review"
  | "crisis_support"
  | "advocacy"
  | "life_story_work"
  | "transition_planning"
  | "wellbeing_check";

export type RelationshipStrength =
  | "very_strong"
  | "strong"
  | "developing"
  | "fragile"
  | "disengaged";

export type Rating = "outstanding" | "good" | "requires_improvement" | "inadequate";

// ── Label maps ───────────────────────────────────────────────────────────────

const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  one_to_one: "One to One",
  activity_based: "Activity Based",
  goal_review: "Goal Review",
  crisis_support: "Crisis Support",
  advocacy: "Advocacy",
  life_story_work: "Life Story Work",
  transition_planning: "Transition Planning",
  wellbeing_check: "Wellbeing Check",
};

const RELATIONSHIP_STRENGTH_LABELS: Record<RelationshipStrength, string> = {
  very_strong: "Very Strong",
  strong: "Strong",
  developing: "Developing",
  fragile: "Fragile",
  disengaged: "Disengaged",
};

const RATING_LABELS: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getSessionTypeLabel(v: SessionType): string { return SESSION_TYPE_LABELS[v]; }
export function getRelationshipStrengthLabel(v: RelationshipStrength): string { return RELATIONSHIP_STRENGTH_LABELS[v]; }
export function getRatingLabel(v: Rating): string { return RATING_LABELS[v]; }

// ── Input interfaces ─────────────────────────────────────────────────────────

export interface KeyWorkerSession {
  id: string;
  childId: string;
  childName: string;
  keyWorkerId: string;
  keyWorkerName: string;
  sessionDate: string;
  sessionType: SessionType;
  relationshipStrength: RelationshipStrength;
  childEngaged: boolean;
  goalsDiscussed: boolean;
  progressRecorded: boolean;
  documentedInPlan: boolean;
  supervisorReviewed: boolean;
  feedbackGiven: boolean;
}

export interface KeyWorkerPolicy {
  id: string;
  keyWorkerAllocationStrategy: boolean;
  sessionFrequencyStandard: boolean;
  relationshipBuildingFramework: boolean;
  advocacyProtocol: boolean;
  handoverProcedure: boolean;
  supervisionRequirement: boolean;
  regularReview: boolean;
}

export interface StaffKeyWorkerTraining {
  id: string;
  staffId: string;
  staffName: string;
  relationshipBuilding: boolean;
  childAdvocacy: boolean;
  goalSettingSkills: boolean;
  lifeStoryWork: boolean;
  transitionSupport: boolean;
  reflectivePractice: boolean;
}

// ── Result interfaces ────────────────────────────────────────────────────────

export interface KeyWorkerQualityResult {
  overallScore: number;
  totalSessions: number;
  strongRelationshipRate: number;
  childEngagedRate: number;
  goalsDiscussedRate: number;
  progressRate: number;
}

export interface KeyWorkerComplianceResult {
  overallScore: number;
  documentedRate: number;
  supervisorReviewedRate: number;
  feedbackRate: number;
  sessionTypeDiversityRatio: number;
}

export interface KeyWorkerPolicyResult {
  overallScore: number;
  keyWorkerAllocationStrategy: boolean;
  sessionFrequencyStandard: boolean;
  relationshipBuildingFramework: boolean;
  advocacyProtocol: boolean;
  handoverProcedure: boolean;
  supervisionRequirement: boolean;
  regularReview: boolean;
}

export interface StaffKeyWorkerReadinessResult {
  overallScore: number;
  totalStaff: number;
  relationshipBuildingRate: number;
  childAdvocacyRate: number;
  goalSettingSkillsRate: number;
  lifeStoryWorkRate: number;
  transitionSupportRate: number;
  reflectivePracticeRate: number;
}

export interface ChildKeyWorkerProfile {
  childId: string;
  childName: string;
  totalSessions: number;
  strongRelationshipRate: number;
  engagedRate: number;
  overallScore: number;
}

export interface KeyWorkerRelationshipIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  keyWorkerQuality: KeyWorkerQualityResult;
  keyWorkerCompliance: KeyWorkerComplianceResult;
  keyWorkerPolicy: KeyWorkerPolicyResult;
  staffKeyWorkerReadiness: StaffKeyWorkerReadinessResult;
  childProfiles: ChildKeyWorkerProfile[];
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

export function evaluateKeyWorkerQuality(sessions: KeyWorkerSession[]): KeyWorkerQualityResult {
  if (sessions.length === 0) {
    return { overallScore: 0, totalSessions: 0, strongRelationshipRate: 0, childEngagedRate: 0, goalsDiscussedRate: 0, progressRate: 0 };
  }

  const total = sessions.length;
  const strongCount = sessions.filter((s) => s.relationshipStrength === "very_strong" || s.relationshipStrength === "strong").length;
  const engagedCount = sessions.filter((s) => s.childEngaged).length;
  const goalsCount = sessions.filter((s) => s.goalsDiscussed).length;
  const progressCount = sessions.filter((s) => s.progressRecorded).length;

  const strongRelationshipRate = pct(strongCount, total);
  const childEngagedRate = pct(engagedCount, total);
  const goalsDiscussedRate = pct(goalsCount, total);
  const progressRate = pct(progressCount, total);

  const relScore = Math.round((strongRelationshipRate / 100) * 7);
  const engScore = Math.round((childEngagedRate / 100) * 6);
  const goalScore = Math.round((goalsDiscussedRate / 100) * 6);
  const progScore = Math.round((progressRate / 100) * 6);

  const overallScore = Math.min(25, relScore + engScore + goalScore + progScore);

  return { overallScore, totalSessions: total, strongRelationshipRate, childEngagedRate, goalsDiscussedRate, progressRate };
}

export function evaluateKeyWorkerCompliance(sessions: KeyWorkerSession[]): KeyWorkerComplianceResult {
  if (sessions.length === 0) {
    return { overallScore: 0, documentedRate: 0, supervisorReviewedRate: 0, feedbackRate: 0, sessionTypeDiversityRatio: 0 };
  }

  const total = sessions.length;
  const documentedCount = sessions.filter((s) => s.documentedInPlan).length;
  const supervisorCount = sessions.filter((s) => s.supervisorReviewed).length;
  const feedbackCount = sessions.filter((s) => s.feedbackGiven).length;
  const uniqueTypes = new Set(sessions.map((s) => s.sessionType)).size;
  const diversityRatio = pct(uniqueTypes, 8);

  const documentedRate = pct(documentedCount, total);
  const supervisorReviewedRate = pct(supervisorCount, total);
  const feedbackRate = pct(feedbackCount, total);

  const docScore = Math.round((documentedRate / 100) * 8);
  const supScore = Math.round((supervisorReviewedRate / 100) * 7);
  const fbScore = Math.round((feedbackRate / 100) * 5);
  const divScore = Math.round((diversityRatio / 100) * 5);

  const overallScore = Math.min(25, docScore + supScore + fbScore + divScore);

  return { overallScore, documentedRate, supervisorReviewedRate, feedbackRate, sessionTypeDiversityRatio: diversityRatio };
}

export function evaluateKeyWorkerPolicy(policy: KeyWorkerPolicy | null): KeyWorkerPolicyResult {
  if (!policy) {
    return {
      overallScore: 0,
      keyWorkerAllocationStrategy: false,
      sessionFrequencyStandard: false,
      relationshipBuildingFramework: false,
      advocacyProtocol: false,
      handoverProcedure: false,
      supervisionRequirement: false,
      regularReview: false,
    };
  }

  let score = 0;
  if (policy.keyWorkerAllocationStrategy) score += 4;
  if (policy.sessionFrequencyStandard) score += 4;
  if (policy.relationshipBuildingFramework) score += 4;
  if (policy.advocacyProtocol) score += 4;
  if (policy.handoverProcedure) score += 3;
  if (policy.supervisionRequirement) score += 3;
  if (policy.regularReview) score += 3;

  return {
    overallScore: Math.min(25, score),
    keyWorkerAllocationStrategy: policy.keyWorkerAllocationStrategy,
    sessionFrequencyStandard: policy.sessionFrequencyStandard,
    relationshipBuildingFramework: policy.relationshipBuildingFramework,
    advocacyProtocol: policy.advocacyProtocol,
    handoverProcedure: policy.handoverProcedure,
    supervisionRequirement: policy.supervisionRequirement,
    regularReview: policy.regularReview,
  };
}

export function evaluateStaffKeyWorkerReadiness(training: StaffKeyWorkerTraining[]): StaffKeyWorkerReadinessResult {
  if (training.length === 0) {
    return { overallScore: 0, totalStaff: 0, relationshipBuildingRate: 0, childAdvocacyRate: 0, goalSettingSkillsRate: 0, lifeStoryWorkRate: 0, transitionSupportRate: 0, reflectivePracticeRate: 0 };
  }

  const total = training.length;
  const rbCount = training.filter((t) => t.relationshipBuilding).length;
  const caCount = training.filter((t) => t.childAdvocacy).length;
  const gsCount = training.filter((t) => t.goalSettingSkills).length;
  const lsCount = training.filter((t) => t.lifeStoryWork).length;
  const tsCount = training.filter((t) => t.transitionSupport).length;
  const rpCount = training.filter((t) => t.reflectivePractice).length;

  const relationshipBuildingRate = pct(rbCount, total);
  const childAdvocacyRate = pct(caCount, total);
  const goalSettingSkillsRate = pct(gsCount, total);
  const lifeStoryWorkRate = pct(lsCount, total);
  const transitionSupportRate = pct(tsCount, total);
  const reflectivePracticeRate = pct(rpCount, total);

  const s1 = Math.round((relationshipBuildingRate / 100) * 6);
  const s2 = Math.round((childAdvocacyRate / 100) * 5);
  const s3 = Math.round((goalSettingSkillsRate / 100) * 5);
  const s4 = Math.round((lifeStoryWorkRate / 100) * 4);
  const s5 = Math.round((transitionSupportRate / 100) * 3);
  const s6 = Math.round((reflectivePracticeRate / 100) * 2);

  const overallScore = Math.min(25, s1 + s2 + s3 + s4 + s5 + s6);

  return { overallScore, totalStaff: total, relationshipBuildingRate, childAdvocacyRate, goalSettingSkillsRate, lifeStoryWorkRate, transitionSupportRate, reflectivePracticeRate };
}

// ── Child profiles ───────────────────────────────────────────────────────────

export function buildChildKeyWorkerProfiles(sessions: KeyWorkerSession[]): ChildKeyWorkerProfile[] {
  if (sessions.length === 0) return [];

  const grouped = new Map<string, KeyWorkerSession[]>();
  for (const s of sessions) {
    if (!grouped.has(s.childId)) grouped.set(s.childId, []);
    grouped.get(s.childId)!.push(s);
  }

  const profiles: ChildKeyWorkerProfile[] = [];

  for (const [childId, sess] of grouped) {
    const childName = sess[0].childName;
    const total = sess.length;
    const strongCount = sess.filter((s) => s.relationshipStrength === "very_strong" || s.relationshipStrength === "strong").length;
    const engagedCount = sess.filter((s) => s.childEngaged).length;

    const strongRelationshipRate = pct(strongCount, total);
    const engagedRate = pct(engagedCount, total);

    let freqScore = 0;
    if (total >= 10) freqScore = 2;
    else if (total >= 5) freqScore = 1;

    let relScore = 0;
    if (strongRelationshipRate >= 80) relScore = 3;
    else if (strongRelationshipRate >= 60) relScore = 2;
    else if (strongRelationshipRate >= 40) relScore = 1;

    let engScore = 0;
    if (engagedRate >= 80) engScore = 3;
    else if (engagedRate >= 60) engScore = 2;
    else if (engagedRate >= 40) engScore = 1;

    const uniqueTypes = new Set(sess.map((s) => s.sessionType)).size;
    let divScore = 0;
    if (uniqueTypes >= 4) divScore = 2;
    else if (uniqueTypes >= 2) divScore = 1;

    const overallScore = Math.min(10, freqScore + relScore + engScore + divScore);

    profiles.push({ childId, childName, totalSessions: total, strongRelationshipRate, engagedRate, overallScore });
  }

  return profiles;
}

// ── Orchestrator ─────────────────────────────────────────────────────────────

export function generateKeyWorkerRelationshipIntelligence(
  sessions: KeyWorkerSession[],
  policy: KeyWorkerPolicy | null,
  training: StaffKeyWorkerTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): KeyWorkerRelationshipIntelligence {
  const keyWorkerQuality = evaluateKeyWorkerQuality(sessions);
  const keyWorkerCompliance = evaluateKeyWorkerCompliance(sessions);
  const keyWorkerPolicy = evaluateKeyWorkerPolicy(policy);
  const staffKeyWorkerReadiness = evaluateStaffKeyWorkerReadiness(training);

  const overallScore = Math.min(100, keyWorkerQuality.overallScore + keyWorkerCompliance.overallScore + keyWorkerPolicy.overallScore + staffKeyWorkerReadiness.overallScore);
  const rating = getRating(overallScore);

  const childProfiles = buildChildKeyWorkerProfiles(sessions);

  const strengths: string[] = [];
  const areasForImprovement: string[] = [];
  const actions: string[] = [];

  if (keyWorkerQuality.strongRelationshipRate >= 80) strengths.push("Strong key worker relationships — children have trusting bonds with their key workers");
  if (keyWorkerQuality.childEngagedRate >= 80) strengths.push("Children are consistently engaged in key worker sessions, demonstrating meaningful connection");
  if (keyWorkerQuality.goalsDiscussedRate >= 80) strengths.push("Goals are regularly discussed in key worker sessions, supporting purposeful planning");
  if (keyWorkerCompliance.documentedRate >= 80) strengths.push("Excellent documentation of key worker sessions in care plans");

  if (sessions.length > 0 && keyWorkerQuality.strongRelationshipRate < 60) areasForImprovement.push("Key worker relationship strength needs improvement — review allocation and consistency");
  if (sessions.length > 0 && keyWorkerQuality.childEngagedRate < 60) areasForImprovement.push("Child engagement in key worker sessions is low — review session approach and child voice");
  if (sessions.length > 0 && keyWorkerCompliance.feedbackRate < 60) areasForImprovement.push("Feedback not consistently given in key worker sessions — improve reflective practice");
  if (sessions.length > 0 && keyWorkerQuality.progressRate < 60) areasForImprovement.push("Progress recording in key worker sessions needs strengthening — embed outcome tracking");

  if (sessions.length === 0) actions.push("No key worker session records found — establish regular key worker sessions immediately");
  if (!policy) actions.push("URGENT: No key worker policy in place — develop and implement immediately");
  if (training.length === 0) actions.push("URGENT: No staff key worker training recorded — arrange training for all staff");
  if (sessions.length > 0 && keyWorkerCompliance.supervisorReviewedRate < 60) actions.push("Improve supervisor oversight of key worker sessions");
  if (sessions.length > 0 && keyWorkerQuality.goalsDiscussedRate < 60) actions.push("Ensure goals are discussed and reviewed in every key worker session");

  const regulatoryLinks: string[] = [
    "CHR 2015 Regulation 5 — Engaging with the wider community",
    "CHR 2015 Regulation 11 — Positive relationships (key worker)",
    "SCCIF — Leadership and management (key worker allocation)",
    "NMS 20 — Staffing (key worker relationships)",
    "Children Act 1989 — Welfare of the child",
    "UNCRC Article 12 — Right to be heard (key worker advocacy)",
    "Care Planning Regulations 2010 — Key worker responsibilities",
  ];

  return {
    homeId, periodStart, periodEnd, overallScore, rating,
    keyWorkerQuality, keyWorkerCompliance, keyWorkerPolicy, staffKeyWorkerReadiness,
    childProfiles, strengths, areasForImprovement, actions, regulatoryLinks,
  };
}
