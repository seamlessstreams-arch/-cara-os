// Social Media Online Safety Intelligence Engine
// Pure deterministic — no AI, no external calls, no randomness, no Date.now()

// ── Type unions ──────────────────────────────────────────────────────────────

export type OnlineSafetyTopic =
  | "cyberbullying_awareness"
  | "privacy_settings"
  | "screen_time_management"
  | "digital_footprint"
  | "online_grooming_awareness"
  | "safe_social_media_use"
  | "content_filtering"
  | "reporting_mechanisms";

export type ComprehensionLevel =
  | "excellent"
  | "good"
  | "developing"
  | "limited"
  | "not_assessed";

export type Rating = "outstanding" | "good" | "requires_improvement" | "inadequate";

// ── Label maps ───────────────────────────────────────────────────────────────

const ONLINE_SAFETY_TOPIC_LABELS: Record<OnlineSafetyTopic, string> = {
  cyberbullying_awareness: "Cyberbullying Awareness",
  privacy_settings: "Privacy Settings",
  screen_time_management: "Screen Time Management",
  digital_footprint: "Digital Footprint",
  online_grooming_awareness: "Online Grooming Awareness",
  safe_social_media_use: "Safe Social Media Use",
  content_filtering: "Content Filtering",
  reporting_mechanisms: "Reporting Mechanisms",
};

const COMPREHENSION_LEVEL_LABELS: Record<ComprehensionLevel, string> = {
  excellent: "Excellent",
  good: "Good",
  developing: "Developing",
  limited: "Limited",
  not_assessed: "Not Assessed",
};

const RATING_LABELS: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getOnlineSafetyTopicLabel(v: OnlineSafetyTopic): string { return ONLINE_SAFETY_TOPIC_LABELS[v]; }
export function getComprehensionLevelLabel(v: ComprehensionLevel): string { return COMPREHENSION_LEVEL_LABELS[v]; }
export function getRatingLabel(v: Rating): string { return RATING_LABELS[v]; }

// ── Input interfaces ─────────────────────────────────────────────────────────

export interface OnlineSafetySession {
  id: string;
  childId: string;
  childName: string;
  sessionDate: string;
  topic: OnlineSafetyTopic;
  comprehensionLevel: ComprehensionLevel;
  childEngaged: boolean;
  practicalDemonstration: boolean;
  safetyPlanUpdated: boolean;
  documentedInPlan: boolean;
  staffDelivered: boolean;
  feedbackGiven: boolean;
}

export interface OnlineSafetyPolicy {
  id: string;
  esafetyStrategy: boolean;
  socialMediaGuidance: boolean;
  screenTimeFramework: boolean;
  incidentReportingProtocol: boolean;
  contentFilteringPolicy: boolean;
  parentalEngagementPlan: boolean;
  regularReview: boolean;
}

export interface StaffOnlineSafetyTraining {
  id: string;
  staffId: string;
  staffName: string;
  esafetyKnowledge: boolean;
  socialMediaAwareness: boolean;
  onlineGroomingRecognition: boolean;
  incidentResponse: boolean;
  ageAppropriateGuidance: boolean;
  digitalToolsCompetency: boolean;
}

// ── Result interfaces ────────────────────────────────────────────────────────

export interface OnlineSafetyQualityResult {
  overallScore: number;
  totalSessions: number;
  comprehensionRate: number;
  engagementRate: number;
  practicalRate: number;
  safetyPlanRate: number;
}

export interface OnlineSafetyComplianceResult {
  overallScore: number;
  documentedRate: number;
  staffDeliveredRate: number;
  feedbackRate: number;
  topicDiversityRatio: number;
}

export interface OnlineSafetyPolicyResult {
  overallScore: number;
  esafetyStrategy: boolean;
  socialMediaGuidance: boolean;
  screenTimeFramework: boolean;
  incidentReportingProtocol: boolean;
  contentFilteringPolicy: boolean;
  parentalEngagementPlan: boolean;
  regularReview: boolean;
}

export interface StaffOnlineSafetyReadinessResult {
  overallScore: number;
  totalStaff: number;
  esafetyKnowledgeRate: number;
  socialMediaAwarenessRate: number;
  onlineGroomingRecognitionRate: number;
  incidentResponseRate: number;
  ageAppropriateGuidanceRate: number;
  digitalToolsCompetencyRate: number;
}

export interface ChildOnlineSafetyProfile {
  childId: string;
  childName: string;
  totalSessions: number;
  comprehensionRate: number;
  engagementRate: number;
  overallScore: number;
}

export interface SocialMediaOnlineSafetyIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  onlineSafetyQuality: OnlineSafetyQualityResult;
  onlineSafetyCompliance: OnlineSafetyComplianceResult;
  onlineSafetyPolicy: OnlineSafetyPolicyResult;
  staffOnlineSafetyReadiness: StaffOnlineSafetyReadinessResult;
  childProfiles: ChildOnlineSafetyProfile[];
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

export function evaluateOnlineSafetyQuality(sessions: OnlineSafetySession[]): OnlineSafetyQualityResult {
  if (sessions.length === 0) {
    return { overallScore: 0, totalSessions: 0, comprehensionRate: 0, engagementRate: 0, practicalRate: 0, safetyPlanRate: 0 };
  }

  const total = sessions.length;
  const comprehensionCount = sessions.filter((s) => s.comprehensionLevel === "excellent" || s.comprehensionLevel === "good").length;
  const engagementCount = sessions.filter((s) => s.childEngaged).length;
  const practicalCount = sessions.filter((s) => s.practicalDemonstration).length;
  const safetyPlanCount = sessions.filter((s) => s.safetyPlanUpdated).length;

  const comprehensionRate = pct(comprehensionCount, total);
  const engagementRate = pct(engagementCount, total);
  const practicalRate = pct(practicalCount, total);
  const safetyPlanRate = pct(safetyPlanCount, total);

  const cpScore = Math.round((comprehensionRate / 100) * 7);
  const enScore = Math.round((engagementRate / 100) * 6);
  const prScore = Math.round((practicalRate / 100) * 6);
  const spScore = Math.round((safetyPlanRate / 100) * 6);

  const overallScore = Math.min(25, cpScore + enScore + prScore + spScore);

  return { overallScore, totalSessions: total, comprehensionRate, engagementRate, practicalRate, safetyPlanRate };
}

export function evaluateOnlineSafetyCompliance(sessions: OnlineSafetySession[]): OnlineSafetyComplianceResult {
  if (sessions.length === 0) {
    return { overallScore: 0, documentedRate: 0, staffDeliveredRate: 0, feedbackRate: 0, topicDiversityRatio: 0 };
  }

  const total = sessions.length;
  const documentedCount = sessions.filter((s) => s.documentedInPlan).length;
  const staffCount = sessions.filter((s) => s.staffDelivered).length;
  const feedbackCount = sessions.filter((s) => s.feedbackGiven).length;
  const uniqueTopics = new Set(sessions.map((s) => s.topic)).size;
  const diversityRatio = pct(uniqueTopics, 8);

  const documentedRate = pct(documentedCount, total);
  const staffDeliveredRate = pct(staffCount, total);
  const feedbackRate = pct(feedbackCount, total);

  const docScore = Math.round((documentedRate / 100) * 8);
  const sdScore = Math.round((staffDeliveredRate / 100) * 7);
  const fbScore = Math.round((feedbackRate / 100) * 5);
  const divScore = Math.round((diversityRatio / 100) * 5);

  const overallScore = Math.min(25, docScore + sdScore + fbScore + divScore);

  return { overallScore, documentedRate, staffDeliveredRate, feedbackRate, topicDiversityRatio: diversityRatio };
}

export function evaluateOnlineSafetyPolicy(policy: OnlineSafetyPolicy | null): OnlineSafetyPolicyResult {
  if (!policy) {
    return { overallScore: 0, esafetyStrategy: false, socialMediaGuidance: false, screenTimeFramework: false, incidentReportingProtocol: false, contentFilteringPolicy: false, parentalEngagementPlan: false, regularReview: false };
  }

  let score = 0;
  if (policy.esafetyStrategy) score += 4;
  if (policy.socialMediaGuidance) score += 4;
  if (policy.screenTimeFramework) score += 4;
  if (policy.incidentReportingProtocol) score += 4;
  if (policy.contentFilteringPolicy) score += 3;
  if (policy.parentalEngagementPlan) score += 3;
  if (policy.regularReview) score += 3;

  return {
    overallScore: Math.min(25, score),
    esafetyStrategy: policy.esafetyStrategy, socialMediaGuidance: policy.socialMediaGuidance,
    screenTimeFramework: policy.screenTimeFramework, incidentReportingProtocol: policy.incidentReportingProtocol,
    contentFilteringPolicy: policy.contentFilteringPolicy, parentalEngagementPlan: policy.parentalEngagementPlan,
    regularReview: policy.regularReview,
  };
}

export function evaluateStaffOnlineSafetyReadiness(training: StaffOnlineSafetyTraining[]): StaffOnlineSafetyReadinessResult {
  if (training.length === 0) {
    return { overallScore: 0, totalStaff: 0, esafetyKnowledgeRate: 0, socialMediaAwarenessRate: 0, onlineGroomingRecognitionRate: 0, incidentResponseRate: 0, ageAppropriateGuidanceRate: 0, digitalToolsCompetencyRate: 0 };
  }

  const total = training.length;
  const ekRate = pct(training.filter((t) => t.esafetyKnowledge).length, total);
  const smRate = pct(training.filter((t) => t.socialMediaAwareness).length, total);
  const ogRate = pct(training.filter((t) => t.onlineGroomingRecognition).length, total);
  const irRate = pct(training.filter((t) => t.incidentResponse).length, total);
  const agRate = pct(training.filter((t) => t.ageAppropriateGuidance).length, total);
  const dtRate = pct(training.filter((t) => t.digitalToolsCompetency).length, total);

  const s1 = Math.round((ekRate / 100) * 6);
  const s2 = Math.round((smRate / 100) * 5);
  const s3 = Math.round((ogRate / 100) * 5);
  const s4 = Math.round((irRate / 100) * 4);
  const s5 = Math.round((agRate / 100) * 3);
  const s6 = Math.round((dtRate / 100) * 2);

  const overallScore = Math.min(25, s1 + s2 + s3 + s4 + s5 + s6);

  return { overallScore, totalStaff: total, esafetyKnowledgeRate: ekRate, socialMediaAwarenessRate: smRate, onlineGroomingRecognitionRate: ogRate, incidentResponseRate: irRate, ageAppropriateGuidanceRate: agRate, digitalToolsCompetencyRate: dtRate };
}

// ── Child profiles ───────────────────────────────────────────────────────────

export function buildChildOnlineSafetyProfiles(sessions: OnlineSafetySession[]): ChildOnlineSafetyProfile[] {
  if (sessions.length === 0) return [];

  const grouped = new Map<string, OnlineSafetySession[]>();
  for (const s of sessions) {
    if (!grouped.has(s.childId)) grouped.set(s.childId, []);
    grouped.get(s.childId)!.push(s);
  }

  const profiles: ChildOnlineSafetyProfile[] = [];

  for (const [childId, acts] of grouped) {
    const childName = acts[0].childName;
    const total = acts.length;
    const comprehensionCount = acts.filter((s) => s.comprehensionLevel === "excellent" || s.comprehensionLevel === "good").length;
    const engagementCount = acts.filter((s) => s.childEngaged).length;

    const comprehensionRate = pct(comprehensionCount, total);
    const engagementRate = pct(engagementCount, total);

    let freqScore = 0;
    if (total >= 10) freqScore = 2;
    else if (total >= 5) freqScore = 1;

    let cpScore = 0;
    if (comprehensionRate >= 80) cpScore = 3;
    else if (comprehensionRate >= 60) cpScore = 2;
    else if (comprehensionRate >= 40) cpScore = 1;

    let enScore = 0;
    if (engagementRate >= 80) enScore = 3;
    else if (engagementRate >= 60) enScore = 2;
    else if (engagementRate >= 40) enScore = 1;

    const uniqueTopics = new Set(acts.map((s) => s.topic)).size;
    let divScore = 0;
    if (uniqueTopics >= 4) divScore = 2;
    else if (uniqueTopics >= 2) divScore = 1;

    const overallScore = Math.min(10, freqScore + cpScore + enScore + divScore);

    profiles.push({ childId, childName, totalSessions: total, comprehensionRate, engagementRate, overallScore });
  }

  return profiles;
}

// ── Orchestrator ─────────────────────────────────────────────────────────────

export function generateSocialMediaOnlineSafetyIntelligence(
  sessions: OnlineSafetySession[],
  policy: OnlineSafetyPolicy | null,
  training: StaffOnlineSafetyTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): SocialMediaOnlineSafetyIntelligence {
  const onlineSafetyQuality = evaluateOnlineSafetyQuality(sessions);
  const onlineSafetyCompliance = evaluateOnlineSafetyCompliance(sessions);
  const onlineSafetyPolicy = evaluateOnlineSafetyPolicy(policy);
  const staffOnlineSafetyReadiness = evaluateStaffOnlineSafetyReadiness(training);

  const overallScore = Math.min(100, onlineSafetyQuality.overallScore + onlineSafetyCompliance.overallScore + onlineSafetyPolicy.overallScore + staffOnlineSafetyReadiness.overallScore);
  const rating = getRating(overallScore);

  const childProfiles = buildChildOnlineSafetyProfiles(sessions);

  const strengths: string[] = [];
  const areasForImprovement: string[] = [];
  const actions: string[] = [];

  if (onlineSafetyQuality.comprehensionRate >= 80) strengths.push("Children demonstrate strong understanding of online safety concepts");
  if (onlineSafetyQuality.engagementRate >= 80) strengths.push("High engagement levels in online safety education sessions");
  if (onlineSafetyQuality.practicalRate >= 80) strengths.push("Children are effectively applying online safety skills in practice");
  if (onlineSafetyCompliance.documentedRate >= 80) strengths.push("Online safety education is well documented in care plans");

  if (sessions.length > 0 && onlineSafetyQuality.comprehensionRate < 60) areasForImprovement.push("Online safety comprehension needs improvement — adapt teaching methods to individual needs");
  if (sessions.length > 0 && onlineSafetyQuality.safetyPlanRate < 60) areasForImprovement.push("Safety plan updates are insufficient — ensure each session feeds into individual safety plans");
  if (sessions.length > 0 && onlineSafetyQuality.engagementRate < 60) areasForImprovement.push("Engagement in online safety sessions needs strengthening");
  if (sessions.length > 0 && onlineSafetyCompliance.staffDeliveredRate < 60) areasForImprovement.push("Staff delivery of online safety sessions needs improvement");

  if (sessions.length === 0) actions.push("No online safety sessions recorded — begin tracking e-safety education immediately");
  if (!policy) actions.push("URGENT: No online safety policy in place — develop and implement immediately");
  if (training.length === 0) actions.push("URGENT: No staff online safety training recorded — arrange training for all staff");
  if (sessions.length > 0 && onlineSafetyQuality.practicalRate < 60) actions.push("Increase practical demonstrations in online safety sessions");
  if (sessions.length > 0 && onlineSafetyCompliance.feedbackRate < 60) actions.push("Improve feedback processes for online safety education");

  const regulatoryLinks: string[] = [
    "CHR 2015 Regulation 12 — Positive behaviour support (online safety)",
    "CHR 2015 Regulation 13 — Protection of children (online exploitation)",
    "SCCIF — Safety of children (online safety)",
    "NMS 4 — Safeguarding (e-safety)",
    "Children Act 1989 — Welfare of the child",
    "UNCRC Article 17 — Access to information (safe media)",
    "Keeping Children Safe in Education 2024 — Online safety",
  ];

  return {
    homeId, periodStart, periodEnd, overallScore, rating,
    onlineSafetyQuality, onlineSafetyCompliance, onlineSafetyPolicy, staffOnlineSafetyReadiness,
    childProfiles, strengths, areasForImprovement, actions, regulatoryLinks,
  };
}
