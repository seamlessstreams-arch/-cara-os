/* ──────────────────────────────────────────────────────────────
   Substance Misuse Prevention Intelligence Engine
   Pure deterministic – no AI, no network, no randomness.
   ────────────────────────────────────────────────────────────── */

// ── Literal types ──────────────────────────────────────────────

export type PreventionTopic =
  | "drug_awareness"
  | "alcohol_awareness"
  | "smoking_vaping"
  | "peer_pressure_resistance"
  | "healthy_coping_strategies"
  | "support_signposting"
  | "risk_recognition"
  | "legal_consequences";

export type UnderstandingLevel =
  | "excellent"
  | "good"
  | "developing"
  | "limited"
  | "not_assessed";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// ── Input types ────────────────────────────────────────────────

export interface PreventionSession {
  id: string;
  childId: string;
  childName: string;
  sessionDate: string;
  topic: PreventionTopic;
  understandingLevel: UnderstandingLevel;
  childEngaged: boolean;
  scenarioPracticed: boolean;
  copingStrategyIdentified: boolean;
  documentedInPlan: boolean;
  staffDelivered: boolean;
  followUpPlanned: boolean;
}

export interface PreventionPolicy {
  id: string;
  substanceMisuseStrategy: boolean;
  ageAppropriateCurriculum: boolean;
  incidentResponseProtocol: boolean;
  externalAgencyPartnership: boolean;
  staffTrainingRequirement: boolean;
  parentCarerEngagement: boolean;
  regularReview: boolean;
}

export interface StaffPreventionTraining {
  id: string;
  staffId: string;
  staffName: string;
  substanceKnowledge: boolean;
  riskIndicatorRecognition: boolean;
  motivationalInterviewing: boolean;
  incidentManagement: boolean;
  safeguardingLinks: boolean;
  ageAppropriateDelivery: boolean;
}

// ── Result types ───────────────────────────────────────────────

export interface PreventionQualityResult {
  overallScore: number;
  totalSessions: number;
  understandingRate: number;
  engagementRate: number;
  scenarioRate: number;
  copingStrategyRate: number;
  rating: Rating;
}

export interface PreventionComplianceResult {
  overallScore: number;
  documentedRate: number;
  staffDeliveredRate: number;
  followUpRate: number;
  topicDiversityRatio: number;
  rating: Rating;
}

export interface PreventionPolicyResult {
  overallScore: number;
  substanceMisuseStrategy: boolean;
  ageAppropriateCurriculum: boolean;
  incidentResponseProtocol: boolean;
  externalAgencyPartnership: boolean;
  staffTrainingRequirement: boolean;
  parentCarerEngagement: boolean;
  regularReview: boolean;
  rating: Rating;
}

export interface StaffPreventionReadinessResult {
  overallScore: number;
  totalStaff: number;
  substanceKnowledgeRate: number;
  riskIndicatorRate: number;
  motivationalInterviewingRate: number;
  incidentManagementRate: number;
  safeguardingLinksRate: number;
  ageAppropriateDeliveryRate: number;
  rating: Rating;
}

export interface ChildPreventionProfile {
  childId: string;
  childName: string;
  totalSessions: number;
  understandingRate: number;
  engagementRate: number;
  topicsCovered: PreventionTopic[];
  overallScore: number;
}

export interface SubstanceMisusePreventionIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  preventionQuality: PreventionQualityResult;
  preventionCompliance: PreventionComplianceResult;
  preventionPolicy: PreventionPolicyResult;
  staffPreventionReadiness: StaffPreventionReadinessResult;
  childProfiles: ChildPreventionProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Helpers ────────────────────────────────────────────────────

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

const TOPIC_LABELS: Record<PreventionTopic, string> = {
  drug_awareness: "Drug Awareness",
  alcohol_awareness: "Alcohol Awareness",
  smoking_vaping: "Smoking & Vaping",
  peer_pressure_resistance: "Peer Pressure Resistance",
  healthy_coping_strategies: "Healthy Coping Strategies",
  support_signposting: "Support Signposting",
  risk_recognition: "Risk Recognition",
  legal_consequences: "Legal Consequences",
};

const UNDERSTANDING_LABELS: Record<UnderstandingLevel, string> = {
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

export function getPreventionTopicLabel(t: PreventionTopic): string {
  return TOPIC_LABELS[t];
}
export function getUnderstandingLevelLabel(l: UnderstandingLevel): string {
  return UNDERSTANDING_LABELS[l];
}
export function getRatingLabel(r: Rating): string {
  return RATING_LABELS[r];
}

// ── Evaluators ─────────────────────────────────────────────────

const TOTAL_TOPICS = 8;

/** Quality evaluator — max 25. Weights: understanding 7, engagement 6, scenario 6, coping 6. */
export function evaluatePreventionQuality(
  sessions: PreventionSession[],
): PreventionQualityResult {
  const n = sessions.length;
  if (n === 0)
    return {
      overallScore: 0,
      totalSessions: 0,
      understandingRate: 0,
      engagementRate: 0,
      scenarioRate: 0,
      copingStrategyRate: 0,
      rating: "inadequate",
    };

  const understood = sessions.filter(
    (s) =>
      s.understandingLevel === "excellent" ||
      s.understandingLevel === "good",
  ).length;
  const engaged = sessions.filter((s) => s.childEngaged).length;
  const scenario = sessions.filter((s) => s.scenarioPracticed).length;
  const coping = sessions.filter((s) => s.copingStrategyIdentified).length;

  const understandingRate = pct(understood, n);
  const engagementRate = pct(engaged, n);
  const scenarioRate = pct(scenario, n);
  const copingStrategyRate = pct(coping, n);

  const raw =
    (understandingRate / 100) * 7 +
    (engagementRate / 100) * 6 +
    (scenarioRate / 100) * 6 +
    (copingStrategyRate / 100) * 6;

  const overallScore = Math.min(25, Math.round(raw));
  return {
    overallScore,
    totalSessions: n,
    understandingRate,
    engagementRate,
    scenarioRate,
    copingStrategyRate,
    rating: getRating(overallScore * 4),
  };
}

/** Compliance evaluator — max 25. Weights: documented 8, staffDelivered 7, followUp 5, diversity 5. */
export function evaluatePreventionCompliance(
  sessions: PreventionSession[],
): PreventionComplianceResult {
  const n = sessions.length;
  if (n === 0)
    return {
      overallScore: 0,
      documentedRate: 0,
      staffDeliveredRate: 0,
      followUpRate: 0,
      topicDiversityRatio: 0,
      rating: "inadequate",
    };

  const documented = sessions.filter((s) => s.documentedInPlan).length;
  const staffDel = sessions.filter((s) => s.staffDelivered).length;
  const followUp = sessions.filter((s) => s.followUpPlanned).length;
  const uniqueTopics = new Set(sessions.map((s) => s.topic)).size;

  const documentedRate = pct(documented, n);
  const staffDeliveredRate = pct(staffDel, n);
  const followUpRate = pct(followUp, n);
  const topicDiversityRatio = pct(uniqueTopics, TOTAL_TOPICS);

  const raw =
    (documentedRate / 100) * 8 +
    (staffDeliveredRate / 100) * 7 +
    (followUpRate / 100) * 5 +
    (topicDiversityRatio / 100) * 5;

  const overallScore = Math.min(25, Math.round(raw));
  return {
    overallScore,
    documentedRate,
    staffDeliveredRate,
    followUpRate,
    topicDiversityRatio,
    rating: getRating(overallScore * 4),
  };
}

/** Policy evaluator — max 25. 7 booleans: first 4 → 4pts each (16), last 3 → 3pts each (9) = 25. */
export function evaluatePreventionPolicy(
  policy: PreventionPolicy | null,
): PreventionPolicyResult {
  if (!policy)
    return {
      overallScore: 0,
      substanceMisuseStrategy: false,
      ageAppropriateCurriculum: false,
      incidentResponseProtocol: false,
      externalAgencyPartnership: false,
      staffTrainingRequirement: false,
      parentCarerEngagement: false,
      regularReview: false,
      rating: "inadequate",
    };

  let score = 0;
  if (policy.substanceMisuseStrategy) score += 4;
  if (policy.ageAppropriateCurriculum) score += 4;
  if (policy.incidentResponseProtocol) score += 4;
  if (policy.externalAgencyPartnership) score += 4;
  if (policy.staffTrainingRequirement) score += 3;
  if (policy.parentCarerEngagement) score += 3;
  if (policy.regularReview) score += 3;

  const overallScore = Math.min(25, score);
  return {
    overallScore,
    substanceMisuseStrategy: policy.substanceMisuseStrategy,
    ageAppropriateCurriculum: policy.ageAppropriateCurriculum,
    incidentResponseProtocol: policy.incidentResponseProtocol,
    externalAgencyPartnership: policy.externalAgencyPartnership,
    staffTrainingRequirement: policy.staffTrainingRequirement,
    parentCarerEngagement: policy.parentCarerEngagement,
    regularReview: policy.regularReview,
    rating: getRating(overallScore * 4),
  };
}

/** Staff readiness evaluator — max 25. 6 skills: 6+5+5+4+3+2 = 25. */
export function evaluateStaffPreventionReadiness(
  training: StaffPreventionTraining[],
): StaffPreventionReadinessResult {
  const n = training.length;
  if (n === 0)
    return {
      overallScore: 0,
      totalStaff: 0,
      substanceKnowledgeRate: 0,
      riskIndicatorRate: 0,
      motivationalInterviewingRate: 0,
      incidentManagementRate: 0,
      safeguardingLinksRate: 0,
      ageAppropriateDeliveryRate: 0,
      rating: "inadequate",
    };

  const sk = training.filter((t) => t.substanceKnowledge).length;
  const ri = training.filter((t) => t.riskIndicatorRecognition).length;
  const mi = training.filter((t) => t.motivationalInterviewing).length;
  const im = training.filter((t) => t.incidentManagement).length;
  const sl = training.filter((t) => t.safeguardingLinks).length;
  const ad = training.filter((t) => t.ageAppropriateDelivery).length;

  const substanceKnowledgeRate = pct(sk, n);
  const riskIndicatorRate = pct(ri, n);
  const motivationalInterviewingRate = pct(mi, n);
  const incidentManagementRate = pct(im, n);
  const safeguardingLinksRate = pct(sl, n);
  const ageAppropriateDeliveryRate = pct(ad, n);

  const raw =
    (substanceKnowledgeRate / 100) * 6 +
    (riskIndicatorRate / 100) * 5 +
    (motivationalInterviewingRate / 100) * 5 +
    (incidentManagementRate / 100) * 4 +
    (safeguardingLinksRate / 100) * 3 +
    (ageAppropriateDeliveryRate / 100) * 2;

  const overallScore = Math.min(25, Math.round(raw));
  return {
    overallScore,
    totalStaff: n,
    substanceKnowledgeRate,
    riskIndicatorRate,
    motivationalInterviewingRate,
    incidentManagementRate,
    safeguardingLinksRate,
    ageAppropriateDeliveryRate,
    rating: getRating(overallScore * 4),
  };
}

/** Child profiles — max 10 per child. freq [>=10→2,>=5→1] + rate1 [>=80→3,>=60→2,>=40→1] + rate2 [same] + diversity [>=4→2,>=2→1] */
export function buildChildPreventionProfiles(
  sessions: PreventionSession[],
): ChildPreventionProfile[] {
  if (sessions.length === 0) return [];

  const map = new Map<
    string,
    { childName: string; sessions: PreventionSession[] }
  >();
  for (const s of sessions) {
    let entry = map.get(s.childId);
    if (!entry) {
      entry = { childName: s.childName, sessions: [] };
      map.set(s.childId, entry);
    }
    entry.sessions.push(s);
  }

  const profiles: ChildPreventionProfile[] = [];
  for (const [childId, { childName, sessions: cs }] of map) {
    const n = cs.length;
    const understood = cs.filter(
      (s) =>
        s.understandingLevel === "excellent" ||
        s.understandingLevel === "good",
    ).length;
    const engaged = cs.filter((s) => s.childEngaged).length;
    const topics = [...new Set(cs.map((s) => s.topic))] as PreventionTopic[];

    const understandingRate = pct(understood, n);
    const engagementRate = pct(engaged, n);

    // Frequency score
    let freq = 0;
    if (n >= 10) freq = 2;
    else if (n >= 5) freq = 1;

    // Rate1: understanding
    let r1 = 0;
    if (understandingRate >= 80) r1 = 3;
    else if (understandingRate >= 60) r1 = 2;
    else if (understandingRate >= 40) r1 = 1;

    // Rate2: engagement
    let r2 = 0;
    if (engagementRate >= 80) r2 = 3;
    else if (engagementRate >= 60) r2 = 2;
    else if (engagementRate >= 40) r2 = 1;

    // Diversity
    let div = 0;
    if (topics.length >= 4) div = 2;
    else if (topics.length >= 2) div = 1;

    const overallScore = Math.min(10, freq + r1 + r2 + div);

    profiles.push({
      childId,
      childName,
      totalSessions: n,
      understandingRate,
      engagementRate,
      topicsCovered: topics,
      overallScore,
    });
  }

  return profiles;
}

// ── Master generator ───────────────────────────────────────────

export function generateSubstanceMisusePreventionIntelligence(
  sessions: PreventionSession[],
  policy: PreventionPolicy | null,
  training: StaffPreventionTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): SubstanceMisusePreventionIntelligence {
  const preventionQuality = evaluatePreventionQuality(sessions);
  const preventionCompliance = evaluatePreventionCompliance(sessions);
  const preventionPolicy = evaluatePreventionPolicy(policy);
  const staffPreventionReadiness =
    evaluateStaffPreventionReadiness(training);
  const childProfiles = buildChildPreventionProfiles(sessions);

  const overallScore = Math.min(
    100,
    preventionQuality.overallScore +
      preventionCompliance.overallScore +
      preventionPolicy.overallScore +
      staffPreventionReadiness.overallScore,
  );
  const rating = getRating(overallScore);

  // Strengths (score >= 80% of max for that evaluator)
  const strengths: string[] = [];
  if (preventionQuality.overallScore >= 20)
    strengths.push(
      "Excellent substance misuse prevention education quality with strong child understanding",
    );
  if (preventionCompliance.overallScore >= 20)
    strengths.push(
      "Strong compliance with prevention session documentation and delivery standards",
    );
  if (preventionPolicy.overallScore >= 20)
    strengths.push(
      "Comprehensive substance misuse prevention policy and governance framework",
    );
  if (staffPreventionReadiness.overallScore >= 20)
    strengths.push(
      "Well-trained staff with strong substance misuse prevention competencies",
    );

  // Areas for improvement (score < 60% of max)
  const areasForImprovement: string[] = [];
  if (preventionQuality.overallScore < 15)
    areasForImprovement.push(
      "Substance misuse prevention session quality needs improvement — focus on child understanding and engagement",
    );
  if (preventionCompliance.overallScore < 15)
    areasForImprovement.push(
      "Prevention session compliance requires attention — ensure documentation and staff delivery consistency",
    );
  if (preventionPolicy.overallScore < 15)
    areasForImprovement.push(
      "Substance misuse prevention policy framework needs strengthening",
    );
  if (staffPreventionReadiness.overallScore < 15)
    areasForImprovement.push(
      "Staff substance misuse prevention training and readiness needs development",
    );

  // Actions
  const actions: string[] = [];
  if (preventionPolicy.overallScore === 0)
    actions.push(
      "URGENT: Develop and implement a substance misuse prevention policy immediately",
    );
  if (staffPreventionReadiness.overallScore === 0)
    actions.push(
      "URGENT: Arrange substance misuse prevention training for all staff",
    );
  if (preventionQuality.understandingRate < 50)
    actions.push(
      "Review and improve prevention session delivery methods to increase child understanding",
    );
  if (preventionCompliance.topicDiversityRatio < 50)
    actions.push(
      "Expand topic coverage to include all substance misuse prevention areas",
    );
  if (preventionQuality.scenarioRate < 50)
    actions.push(
      "Increase use of scenario-based learning in prevention sessions",
    );
  if (preventionQuality.copingStrategyRate < 50)
    actions.push(
      "Ensure coping strategies are identified and practiced in every prevention session",
    );

  const regulatoryLinks: string[] = [
    "Children's Homes (England) Regulations 2015 — Regulation 36 (Substance Misuse)",
    "Working Together to Safeguard Children 2023",
    "NICE Guidelines — Drug Misuse Prevention (PH4)",
    "DfE Guide to the Children's Homes Regulations and Quality Standards",
    "Ofsted Social Care Common Inspection Framework",
    "KCSIE 2024 — Keeping Children Safe in Education",
    "PHE/OHID Guidance — Young People's Substance Misuse",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    preventionQuality,
    preventionCompliance,
    preventionPolicy,
    staffPreventionReadiness,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
