// ══════════════════════════════════════════════════════════════════════════════
// SEXUAL HEALTH & RELATIONSHIPS EDUCATION INTELLIGENCE ENGINE
//
// Pure deterministic engine for evaluating how effectively a children's home
// delivers Relationships and Sex Education (RSE), sexual health support,
// consent education, and staff readiness for age-appropriate conversations.
//
// Scoring model:
//   rse_delivery             25  — topic variety, age appropriateness, engagement, follow-up
//   sexual_health_access     25  — service access, confidentiality, consent, outcomes
//   rse_policy_quality       25  — boolean field scoring across policy attributes
//   staff_rse_readiness      25  — rate-based scoring across training competencies
//   TOTAL                   100
//
// Rating thresholds:
//   >= 80  outstanding
//   >= 60  good
//   >= 40  requires_improvement
//   <  40  inadequate
//
// Regulatory basis:
//   - CHR 2015 Reg 10 — Duty to promote health and wellbeing
//   - KCSIE 2024 — Keeping Children Safe in Education
//   - RSE Statutory Guidance 2019 — Relationships, Sex and Health Education
//   - SCCIF — Social Care Common Inspection Framework
//   - UNCRC Article 24 — Right to health and health services
//   - Working Together 2023 — Multi-agency safeguarding
//   - Equality Act 2010 — Protected characteristics and inclusivity
//
// No AI. No external calls. Pure input -> output.
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ──────────────────────────────────────────────────────────────────

export type TopicArea =
  | "consent"
  | "healthy_relationships"
  | "online_safety"
  | "contraception"
  | "sti_awareness"
  | "lgbtq_identity"
  | "body_autonomy"
  | "exploitation_awareness"
  | "emotional_wellbeing"
  | "boundaries";

export type DeliveryMethod =
  | "one_to_one"
  | "group_session"
  | "keyworker_session"
  | "external_professional"
  | "peer_education"
  | "resource_based";

export type AgeAppropriateness =
  | "fully_appropriate"
  | "mostly_appropriate"
  | "needs_adaptation"
  | "not_appropriate";

export type EngagementLevel =
  | "highly_engaged"
  | "engaged"
  | "partially_engaged"
  | "disengaged";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// ── Input Interfaces ───────────────────────────────────────────────────────

export interface RSESession {
  id: string;
  childId: string;
  childName: string;
  sessionDate: string;
  topicArea: TopicArea;
  deliveryMethod: DeliveryMethod;
  deliveredBy: string;
  ageAppropriateness: AgeAppropriateness;
  childEngagement: EngagementLevel;
  consentObtained: boolean;
  followUpRequired: boolean;
  followUpCompleted: boolean;
}

export interface SexualHealthReferral {
  id: string;
  childId: string;
  childName: string;
  referralDate: string;
  referralType: string;
  serviceAccessed: boolean;
  confidentialityMaintained: boolean;
  consentObtained: boolean;
  outcomeRecorded: boolean;
}

export interface RSEPolicy {
  id: string;
  policyReviewDate: string;
  policyCurrent: boolean;
  ageAppropriateResources: boolean;
  lgbtqInclusive: boolean;
  culturallySensitive: boolean;
  parentCarerConsulted: boolean;
  externalProfessionalsInvolved: boolean;
  childrenConsulted: boolean;
}

export interface StaffRSETraining {
  id: string;
  staffId: string;
  staffName: string;
  rseDeliveryTrained: boolean;
  safeguardingSexual: boolean;
  consentEducation: boolean;
  lgbtqAwareness: boolean;
  cseCseAwareness: boolean;
  ageAppropriateCommunication: boolean;
}

// ── Child RSE Summary ──────────────────────────────────────────────────────

export interface ChildRSESummary {
  childId: string;
  childName: string;
  sessionsAttended: number;
  topicsCovered: TopicArea[];
  averageEngagement: number;
  referralsMade: number;
  score: number; // 0-10
}

// ── Result Interface ───────────────────────────────────────────────────────

export interface SexualHealthRelationshipsEducationIntelligence {
  homeId: string;
  assessedAt: string;
  periodStart: string;
  periodEnd: string;

  overallScore: number; // 0-100
  rating: Rating;

  rseDeliveryScore: number; // 0-25
  sexualHealthAccessScore: number; // 0-25
  rsePolicyQualityScore: number; // 0-25
  staffRSEReadinessScore: number; // 0-25

  childRSESummaries: ChildRSESummary[];

  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

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

// ── Label Maps & Getters ───────────────────────────────────────────────────

const topicAreaLabels: Record<TopicArea, string> = {
  consent: "Consent",
  healthy_relationships: "Healthy Relationships",
  online_safety: "Online Safety",
  contraception: "Contraception",
  sti_awareness: "STI Awareness",
  lgbtq_identity: "LGBTQ+ Identity",
  body_autonomy: "Body Autonomy",
  exploitation_awareness: "Exploitation Awareness",
  emotional_wellbeing: "Emotional Wellbeing",
  boundaries: "Boundaries",
};

const deliveryMethodLabels: Record<DeliveryMethod, string> = {
  one_to_one: "One-to-One",
  group_session: "Group Session",
  keyworker_session: "Keyworker Session",
  external_professional: "External Professional",
  peer_education: "Peer Education",
  resource_based: "Resource-Based",
};

const ageAppropriatenessLabels: Record<AgeAppropriateness, string> = {
  fully_appropriate: "Fully Appropriate",
  mostly_appropriate: "Mostly Appropriate",
  needs_adaptation: "Needs Adaptation",
  not_appropriate: "Not Appropriate",
};

const engagementLevelLabels: Record<EngagementLevel, string> = {
  highly_engaged: "Highly Engaged",
  engaged: "Engaged",
  partially_engaged: "Partially Engaged",
  disengaged: "Disengaged",
};

const ratingLabels: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getTopicAreaLabel(topic: TopicArea): string {
  return topicAreaLabels[topic];
}

export function getDeliveryMethodLabel(method: DeliveryMethod): string {
  return deliveryMethodLabels[method];
}

export function getAgeAppropriatenessLabel(aa: AgeAppropriateness): string {
  return ageAppropriatenessLabels[aa];
}

export function getEngagementLevelLabel(level: EngagementLevel): string {
  return engagementLevelLabels[level];
}

export function getRatingLabel(rating: Rating): string {
  return ratingLabels[rating];
}

export function getTopicAreaLabels(): Record<TopicArea, string> {
  return { ...topicAreaLabels };
}

export function getDeliveryMethodLabels(): Record<DeliveryMethod, string> {
  return { ...deliveryMethodLabels };
}

export function getAgeAppropriatenessLabels(): Record<AgeAppropriateness, string> {
  return { ...ageAppropriatenessLabels };
}

export function getEngagementLevelLabels(): Record<EngagementLevel, string> {
  return { ...engagementLevelLabels };
}

export function getRatingLabels(): Record<Rating, string> {
  return { ...ratingLabels };
}

// ── Evaluator 1: RSE Delivery (0-25) ──────────────────────────────────────

export function evaluateRSEDelivery(sessions: RSESession[]): number {
  if (sessions.length === 0) return 0;

  let score = 0;

  // 1. Topics covered variety (0-7): unique topics out of 10
  const allTopics: TopicArea[] = [
    "consent",
    "healthy_relationships",
    "online_safety",
    "contraception",
    "sti_awareness",
    "lgbtq_identity",
    "body_autonomy",
    "exploitation_awareness",
    "emotional_wellbeing",
    "boundaries",
  ];
  const uniqueTopics = new Set(sessions.map((s) => s.topicArea));
  const topicVarietyRate = uniqueTopics.size / allTopics.length;
  score += Math.round(topicVarietyRate * 7);

  // 2. Age appropriateness rate (0-6): fully or mostly appropriate
  const ageAppropriate = sessions.filter(
    (s) =>
      s.ageAppropriateness === "fully_appropriate" ||
      s.ageAppropriateness === "mostly_appropriate",
  ).length;
  const ageRate = pct(ageAppropriate, sessions.length);
  score += Math.round((ageRate / 100) * 6);

  // 3. Engagement rate (0-6): highly engaged or engaged
  const engaged = sessions.filter(
    (s) =>
      s.childEngagement === "highly_engaged" ||
      s.childEngagement === "engaged",
  ).length;
  const engagementRate = pct(engaged, sessions.length);
  score += Math.round((engagementRate / 100) * 6);

  // 4. Follow-up completion rate (0-6): of those requiring follow-up, how many completed
  const needsFollowUp = sessions.filter((s) => s.followUpRequired);
  if (needsFollowUp.length > 0) {
    const followUpCompleted = needsFollowUp.filter((s) => s.followUpCompleted).length;
    const followUpRate = pct(followUpCompleted, needsFollowUp.length);
    score += Math.round((followUpRate / 100) * 6);
  } else {
    // No follow-up needed is a good thing — full marks
    score += 6;
  }

  return Math.max(0, Math.min(25, score));
}

// ── Evaluator 2: Sexual Health Access (0-25) ──────────────────────────────

export function evaluateSexualHealthAccess(referrals: SexualHealthReferral[]): number {
  if (referrals.length === 0) return 0;

  let score = 0;

  // 1. Service accessed rate (0-7)
  const accessed = referrals.filter((r) => r.serviceAccessed).length;
  const accessRate = pct(accessed, referrals.length);
  score += Math.round((accessRate / 100) * 7);

  // 2. Confidentiality maintained rate (0-6)
  const confidential = referrals.filter((r) => r.confidentialityMaintained).length;
  const confidentialityRate = pct(confidential, referrals.length);
  score += Math.round((confidentialityRate / 100) * 6);

  // 3. Consent obtained rate (0-6)
  const consented = referrals.filter((r) => r.consentObtained).length;
  const consentRate = pct(consented, referrals.length);
  score += Math.round((consentRate / 100) * 6);

  // 4. Outcome recorded rate (0-6)
  const recorded = referrals.filter((r) => r.outcomeRecorded).length;
  const outcomeRate = pct(recorded, referrals.length);
  score += Math.round((outcomeRate / 100) * 6);

  return Math.max(0, Math.min(25, score));
}

// ── Evaluator 3: RSE Policy Quality (0-25) ────────────────────────────────

export function evaluateRSEPolicyQuality(policies: RSEPolicy[]): number {
  if (policies.length === 0) return 0;

  // Use the most recent policy (or first if only one)
  const policy = policies[0];

  let score = 0;

  // Boolean scoring per field:
  // policyCurrent = 5
  if (policy.policyCurrent) score += 5;
  // ageAppropriateResources = 4
  if (policy.ageAppropriateResources) score += 4;
  // lgbtqInclusive = 4
  if (policy.lgbtqInclusive) score += 4;
  // culturallySensitive = 4
  if (policy.culturallySensitive) score += 4;
  // parentCarerConsulted = 3
  if (policy.parentCarerConsulted) score += 3;
  // externalProfessionalsInvolved = 3
  if (policy.externalProfessionalsInvolved) score += 3;
  // childrenConsulted = 2
  if (policy.childrenConsulted) score += 2;

  return Math.max(0, Math.min(25, score));
}

// ── Evaluator 4: Staff RSE Readiness (0-25) ──────────────────────────────

export function evaluateStaffRSEReadiness(training: StaffRSETraining[]): number {
  if (training.length === 0) return 0;

  let score = 0;
  const total = training.length;

  // Rate-based scoring for each field
  // rseDeliveryTrained (0-5)
  const rseDelivery = training.filter((t) => t.rseDeliveryTrained).length;
  score += Math.round((pct(rseDelivery, total) / 100) * 5);

  // safeguardingSexual (0-5)
  const safeguarding = training.filter((t) => t.safeguardingSexual).length;
  score += Math.round((pct(safeguarding, total) / 100) * 5);

  // consentEducation (0-4)
  const consent = training.filter((t) => t.consentEducation).length;
  score += Math.round((pct(consent, total) / 100) * 4);

  // lgbtqAwareness (0-4)
  const lgbtq = training.filter((t) => t.lgbtqAwareness).length;
  score += Math.round((pct(lgbtq, total) / 100) * 4);

  // cseCseAwareness (0-4)
  const cse = training.filter((t) => t.cseCseAwareness).length;
  score += Math.round((pct(cse, total) / 100) * 4);

  // ageAppropriateCommunication (0-3)
  const ageCom = training.filter((t) => t.ageAppropriateCommunication).length;
  score += Math.round((pct(ageCom, total) / 100) * 3);

  return Math.max(0, Math.min(25, score));
}

// ── Build Child RSE Summaries ──────────────────────────────────────────────

export function buildChildRSESummaries(
  sessions: RSESession[],
  referrals: SexualHealthReferral[],
): ChildRSESummary[] {
  // Gather unique children from sessions and referrals
  const childMap = new Map<string, { childId: string; childName: string }>();
  for (const s of sessions) {
    childMap.set(s.childId, { childId: s.childId, childName: s.childName });
  }
  for (const r of referrals) {
    childMap.set(r.childId, { childId: r.childId, childName: r.childName });
  }

  const summaries: ChildRSESummary[] = [];

  for (const [childId, child] of childMap) {
    const childSessions = sessions.filter((s) => s.childId === childId);
    const childReferrals = referrals.filter((r) => r.childId === childId);

    const topicsCovered = [...new Set(childSessions.map((s) => s.topicArea))];

    // Average engagement: highly_engaged=4, engaged=3, partially_engaged=2, disengaged=1
    const engagementValues: Record<EngagementLevel, number> = {
      highly_engaged: 4,
      engaged: 3,
      partially_engaged: 2,
      disengaged: 1,
    };
    const avgEngagement =
      childSessions.length > 0
        ? childSessions.reduce((sum, s) => sum + engagementValues[s.childEngagement], 0) /
          childSessions.length
        : 0;

    // Score 0-10: sessions breadth (0-4) + engagement quality (0-3) + referral support (0-3)
    let childScore = 0;

    // Sessions breadth: topics covered / 10 * 4
    childScore += Math.round((topicsCovered.length / 10) * 4);

    // Engagement quality: avgEngagement / 4 * 3
    childScore += Math.round((avgEngagement / 4) * 3);

    // Referral support: has referrals with service accessed
    if (childReferrals.length > 0) {
      const accessedReferrals = childReferrals.filter((r) => r.serviceAccessed).length;
      childScore += Math.round((accessedReferrals / childReferrals.length) * 3);
    } else if (childSessions.length > 0) {
      // No referrals needed, has sessions — partial credit
      childScore += 2;
    }

    childScore = Math.max(0, Math.min(10, childScore));

    summaries.push({
      childId: child.childId,
      childName: child.childName,
      sessionsAttended: childSessions.length,
      topicsCovered,
      averageEngagement: Math.round(avgEngagement * 100) / 100,
      referralsMade: childReferrals.length,
      score: childScore,
    });
  }

  return summaries;
}

// ── Insight Generation ─────────────────────────────────────────────────────

function generateStrengths(
  rseDeliveryScore: number,
  sexualHealthAccessScore: number,
  rsePolicyQualityScore: number,
  staffReadinessScore: number,
  sessions: RSESession[],
  referrals: SexualHealthReferral[],
  policies: RSEPolicy[],
  training: StaffRSETraining[],
): string[] {
  const strengths: string[] = [];

  if (rseDeliveryScore >= 20) {
    strengths.push(
      "RSE delivery is comprehensive, with strong topic variety, age-appropriate content, and high engagement from children",
    );
  }

  if (sexualHealthAccessScore >= 20) {
    strengths.push(
      "Sexual health referral pathways are effective, with services accessed, confidentiality maintained, and outcomes recorded",
    );
  }

  if (rsePolicyQualityScore >= 20) {
    strengths.push(
      "RSE policy is robust, inclusive, and reflects consultation with children, parents/carers, and external professionals",
    );
  }

  if (staffReadinessScore >= 20) {
    strengths.push(
      "Staff are well trained in RSE delivery, safeguarding, consent education, and LGBTQ+ awareness",
    );
  }

  // Topic variety
  if (sessions.length > 0) {
    const uniqueTopics = new Set(sessions.map((s) => s.topicArea));
    if (uniqueTopics.size >= 7) {
      strengths.push(
        "Excellent breadth of RSE topics covered, ensuring children receive well-rounded education",
      );
    }
  }

  // Consent in sessions
  if (sessions.length > 0) {
    const consentRate = pct(
      sessions.filter((s) => s.consentObtained).length,
      sessions.length,
    );
    if (consentRate >= 90) {
      strengths.push(
        "Consent is consistently obtained before RSE sessions, demonstrating respect for children's autonomy",
      );
    }
  }

  // Confidentiality in referrals
  if (referrals.length > 0) {
    const confidentialityRate = pct(
      referrals.filter((r) => r.confidentialityMaintained).length,
      referrals.length,
    );
    if (confidentialityRate === 100) {
      strengths.push(
        "Confidentiality is maintained in all sexual health referrals, building trust with children",
      );
    }
  }

  // LGBTQ+ inclusive policy
  if (policies.length > 0 && policies[0].lgbtqInclusive) {
    strengths.push(
      "RSE policy is LGBTQ+ inclusive, supporting all children regardless of sexual orientation or gender identity",
    );
  }

  return strengths;
}

function generateAreasForImprovement(
  rseDeliveryScore: number,
  sexualHealthAccessScore: number,
  rsePolicyQualityScore: number,
  staffReadinessScore: number,
  sessions: RSESession[],
  referrals: SexualHealthReferral[],
  policies: RSEPolicy[],
  training: StaffRSETraining[],
): string[] {
  const areas: string[] = [];

  if (rseDeliveryScore < 15) {
    areas.push(
      "RSE delivery needs improvement — increase topic variety, ensure age-appropriate content, and strengthen engagement strategies",
    );
  }

  if (sexualHealthAccessScore < 15) {
    areas.push(
      "Sexual health access pathways require strengthening — ensure referrals result in services being accessed with outcomes recorded",
    );
  }

  if (rsePolicyQualityScore < 15) {
    areas.push(
      "RSE policy requires review — ensure it is current, inclusive, culturally sensitive, and developed in consultation with stakeholders",
    );
  }

  if (staffReadinessScore < 15) {
    areas.push(
      "Staff RSE readiness is below expected standard — prioritise training in RSE delivery, safeguarding, and consent education",
    );
  }

  // Low engagement
  if (sessions.length > 0) {
    const engaged = sessions.filter(
      (s) => s.childEngagement === "highly_engaged" || s.childEngagement === "engaged",
    ).length;
    const engagementRate = pct(engaged, sessions.length);
    if (engagementRate < 60) {
      areas.push(
        `Only ${engagementRate}% of RSE sessions show good engagement — review delivery methods and consider children's preferences`,
      );
    }
  }

  // Follow-up gaps
  if (sessions.length > 0) {
    const needsFollowUp = sessions.filter((s) => s.followUpRequired);
    if (needsFollowUp.length > 0) {
      const completed = needsFollowUp.filter((s) => s.followUpCompleted).length;
      const followUpRate = pct(completed, needsFollowUp.length);
      if (followUpRate < 80) {
        areas.push(
          `Follow-up completion rate is ${followUpRate}% — all required follow-ups must be completed promptly`,
        );
      }
    }
  }

  // Service access gaps
  if (referrals.length > 0) {
    const accessRate = pct(
      referrals.filter((r) => r.serviceAccessed).length,
      referrals.length,
    );
    if (accessRate < 80) {
      areas.push(
        `Only ${accessRate}% of sexual health referrals resulted in service access — investigate and remove barriers`,
      );
    }
  }

  // Training gaps
  if (training.length > 0) {
    const lgbtqRate = pct(
      training.filter((t) => t.lgbtqAwareness).length,
      training.length,
    );
    if (lgbtqRate < 75) {
      areas.push(
        `Only ${lgbtqRate}% of staff have LGBTQ+ awareness training — all staff must be equipped to support LGBTQ+ young people`,
      );
    }
  }

  // Policy not current
  if (policies.length > 0 && !policies[0].policyCurrent) {
    areas.push(
      "RSE policy is not current — an immediate review is required to ensure statutory compliance",
    );
  }

  // No sessions at all
  if (sessions.length === 0) {
    areas.push(
      "No RSE sessions have been delivered — children are not receiving statutory RSE provision",
    );
  }

  return areas;
}

function generateActions(
  rseDeliveryScore: number,
  sexualHealthAccessScore: number,
  rsePolicyQualityScore: number,
  staffReadinessScore: number,
  sessions: RSESession[],
  referrals: SexualHealthReferral[],
  policies: RSEPolicy[],
  training: StaffRSETraining[],
): string[] {
  const actions: string[] = [];

  // No sessions
  if (sessions.length === 0) {
    actions.push(
      "URGENT: Establish an RSE delivery programme immediately. Children are not receiving statutory RSE as required by RSE Statutory Guidance 2019.",
    );
  }

  // Policy not current
  if (policies.length > 0 && !policies[0].policyCurrent) {
    actions.push(
      "HIGH: Review and update the RSE policy immediately to ensure it reflects current statutory guidance and best practice.",
    );
  }

  // No policy
  if (policies.length === 0) {
    actions.push(
      "URGENT: Develop an RSE policy. The home has no documented RSE policy, which is a regulatory requirement.",
    );
  }

  // Staff training gaps
  if (training.length > 0) {
    const rseDeliveryRate = pct(
      training.filter((t) => t.rseDeliveryTrained).length,
      training.length,
    );
    if (rseDeliveryRate < 80) {
      actions.push(
        `MEDIUM: Schedule RSE delivery training for staff — only ${rseDeliveryRate}% are currently trained.`,
      );
    }

    const safeguardingRate = pct(
      training.filter((t) => t.safeguardingSexual).length,
      training.length,
    );
    if (safeguardingRate < 80) {
      actions.push(
        `MEDIUM: Ensure all staff complete safeguarding (sexual) training — current compliance is ${safeguardingRate}%.`,
      );
    }
  }

  // No training records
  if (training.length === 0) {
    actions.push(
      "HIGH: Establish an RSE staff training programme. No training records exist for RSE competencies.",
    );
  }

  // Low engagement
  if (sessions.length > 0) {
    const engaged = sessions.filter(
      (s) => s.childEngagement === "highly_engaged" || s.childEngagement === "engaged",
    ).length;
    const engagementRate = pct(engaged, sessions.length);
    if (engagementRate < 50) {
      actions.push(
        "MEDIUM: Review RSE delivery methods to improve child engagement — consider one-to-one sessions, external professionals, or age-appropriate resources.",
      );
    }
  }

  // Referral access issues
  if (referrals.length > 0) {
    const accessRate = pct(
      referrals.filter((r) => r.serviceAccessed).length,
      referrals.length,
    );
    if (accessRate < 70) {
      actions.push(
        "HIGH: Investigate barriers to sexual health service access. Liaise with local health services to improve referral pathways.",
      );
    }
  }

  // LGBTQ+ inclusivity gap
  if (policies.length > 0 && !policies[0].lgbtqInclusive) {
    actions.push(
      "MEDIUM: Update RSE policy to ensure LGBTQ+ inclusivity as required by the Equality Act 2010.",
    );
  }

  // Children not consulted
  if (policies.length > 0 && !policies[0].childrenConsulted) {
    actions.push(
      "LOW: Consult children on RSE content and delivery to ensure their voices inform the programme.",
    );
  }

  if (actions.length === 0) {
    actions.push(
      "No immediate actions required. Continue delivering comprehensive RSE and maintain strong staff training and policy review cycles.",
    );
  }

  return actions;
}

function generateRegulatoryLinks(
  sessions: RSESession[],
  referrals: SexualHealthReferral[],
  policies: RSEPolicy[],
  training: StaffRSETraining[],
): string[] {
  const links = new Set<string>();

  // Always include core references
  links.add("CHR 2015 Reg 10 — Duty to promote health and wellbeing including sexual health education");
  links.add("KCSIE 2024 — Safeguarding in education settings, including RSE and exploitation awareness");
  links.add("RSE Statutory Guidance 2019 — Requirements for relationships, sex, and health education");
  links.add("SCCIF — How well children are helped and protected, including access to health education");

  // Health-related
  if (referrals.length > 0) {
    links.add("UNCRC Article 24 — Right to the highest attainable standard of health and health services");
  }

  // Multi-agency / safeguarding
  if (
    sessions.some((s) => s.topicArea === "exploitation_awareness") ||
    sessions.some((s) => s.deliveryMethod === "external_professional")
  ) {
    links.add("Working Together 2023 — Multi-agency safeguarding and partnership working");
  }

  // Equality / LGBTQ+
  if (
    sessions.some((s) => s.topicArea === "lgbtq_identity") ||
    (policies.length > 0 && policies[0].lgbtqInclusive) ||
    training.some((t) => t.lgbtqAwareness)
  ) {
    links.add("Equality Act 2010 — Protected characteristics including sexual orientation and gender identity");
  }

  return [...links];
}

// ── Main Orchestrator ──────────────────────────────────────────────────────

export function generateSexualHealthRelationshipsEducationIntelligence(
  sessions: RSESession[],
  referrals: SexualHealthReferral[],
  policies: RSEPolicy[],
  training: StaffRSETraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): SexualHealthRelationshipsEducationIntelligence {
  const assessedAt = new Date().toISOString();

  // Sub-scores
  const rseDeliveryScore = evaluateRSEDelivery(sessions);
  const sexualHealthAccessScore = evaluateSexualHealthAccess(referrals);
  const rsePolicyQualityScore = evaluateRSEPolicyQuality(policies);
  const staffRSEReadinessScore = evaluateStaffRSEReadiness(training);

  const overallScore = Math.max(
    0,
    Math.min(
      100,
      rseDeliveryScore + sexualHealthAccessScore + rsePolicyQualityScore + staffRSEReadinessScore,
    ),
  );
  const rating = getRating(overallScore);

  // Child summaries
  const childRSESummaries = buildChildRSESummaries(sessions, referrals);

  // Insights
  const strengths = generateStrengths(
    rseDeliveryScore,
    sexualHealthAccessScore,
    rsePolicyQualityScore,
    staffRSEReadinessScore,
    sessions,
    referrals,
    policies,
    training,
  );
  const areasForImprovement = generateAreasForImprovement(
    rseDeliveryScore,
    sexualHealthAccessScore,
    rsePolicyQualityScore,
    staffRSEReadinessScore,
    sessions,
    referrals,
    policies,
    training,
  );
  const actions = generateActions(
    rseDeliveryScore,
    sexualHealthAccessScore,
    rsePolicyQualityScore,
    staffRSEReadinessScore,
    sessions,
    referrals,
    policies,
    training,
  );
  const regulatoryLinks = generateRegulatoryLinks(sessions, referrals, policies, training);

  return {
    homeId,
    assessedAt,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    rseDeliveryScore,
    sexualHealthAccessScore,
    rsePolicyQualityScore,
    staffRSEReadinessScore,
    childRSESummaries,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
