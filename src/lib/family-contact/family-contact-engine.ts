// ══════════════════════════════════════════════════════════════════════════════
// FAMILY CONTACT & COMMUNICATION INTELLIGENCE ENGINE
//
// Pure deterministic engine for analysing family contact arrangements,
// compliance with court-ordered contact, impact on children, and quality of
// communication with placing authorities, families, and professionals.
//
// Regulatory basis:
//   - CHR 2015, Reg 22 — Contact and access to communications
//   - CHR 2015, Reg 7 — Children's wishes and feelings
//   - CHR 2015, Reg 14 — Placement plan: contact arrangements
//   - Children Act 1989, Sch 2, Para 15 — Promote contact
//   - UNCRC Article 9 — Right to maintain contact with parents
//   - SCCIF — "Experiences and progress" — family relationships
//
// No AI. No external calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

// ─�� Types ──────────────────────────────────────────────────────────────────

export type ContactType =
  | "face_to_face"
  | "telephone"
  | "video_call"
  | "letter"
  | "supervised_visit"
  | "unsupervised_visit"
  | "overnight_stay"
  | "community_contact"
  | "indirect";

export type ContactOutcome =
  | "positive"
  | "mixed"
  | "negative"
  | "neutral"
  | "distressing"
  | "cancelled_by_family"
  | "cancelled_by_home"
  | "cancelled_by_authority"
  | "child_refused"
  | "no_show";

export type ContactFrequency =
  | "daily"
  | "twice_weekly"
  | "weekly"
  | "fortnightly"
  | "monthly"
  | "as_agreed"
  | "no_contact_order";

export type FamilyMember =
  | "mother"
  | "father"
  | "sibling"
  | "grandparent"
  | "extended_family"
  | "other_significant";

export type ImpactIndicator =
  | "settled_after"
  | "unsettled_after"
  | "dysregulated_after"
  | "positive_mood"
  | "withdrawn_after"
  | "aggressive_after"
  | "sleep_disrupted"
  | "absconding_risk"
  | "self_harm_risk"
  | "improved_engagement";

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface ContactArrangement {
  id: string;
  childId: string;
  childName: string;
  familyMemberId: string;
  familyMemberName: string;
  familyMemberType: FamilyMember;
  contactType: ContactType;
  agreedFrequency: ContactFrequency;
  isCourtOrdered: boolean;
  supervisedRequired: boolean;
  conditions?: string[];
  placingAuthorityAgreed: boolean;
  startDate: string;
  reviewDate?: string;
}

export interface ContactSession {
  id: string;
  arrangementId: string;
  childId: string;
  scheduledDate: string;
  scheduledTime?: string;
  actualDate?: string;
  duration?: number; // minutes
  contactType: ContactType;
  outcome: ContactOutcome;
  familyMemberPresent: boolean;
  supervisorPresent?: boolean;
  childPrepared: boolean;
  impactIndicators: ImpactIndicator[];
  childVoiceRecorded: boolean;
  childWishesFeelings?: string;
  staffObservations?: string;
  followUpActions?: string[];
  placingAuthorityInformed: boolean;
}

export interface ContactReview {
  id: string;
  arrangementId: string;
  reviewDate: string;
  reviewedBy: string;
  overallAssessment: "meeting_needs" | "partially_meeting" | "not_meeting" | "harmful";
  childViewConsidered: boolean;
  frequencyAppropriate: boolean;
  typeAppropriate: boolean;
  recommendedChanges?: string[];
  nextReviewDate: string;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface ContactComplianceResult {
  totalArrangements: number;
  courtOrderedCount: number;
  courtOrderedCompliant: number;
  courtOrderedComplianceRate: number;
  sessionsScheduled: number;
  sessionsCompleted: number;
  completionRate: number;
  cancellationsByFamily: number;
  cancellationsByHome: number;
  childRefusals: number;
  noShows: number;
}

export interface ContactQualityResult {
  totalSessions: number;
  positiveOutcomes: number;
  negativeOutcomes: number;
  distressingOutcomes: number;
  positiveRate: number;
  childPreparedRate: number;
  childVoiceRecordedRate: number;
  placingAuthorityInformedRate: number;
  averageDurationMinutes: number;
}

export interface ContactImpactResult {
  totalSessions: number;
  sessionsWithImpactData: number;
  settledAfterRate: number;
  dysregulatedAfterRate: number;
  highRiskImpacts: { indicator: ImpactIndicator; count: number }[];
  impactPatterns: {
    familyMember: string;
    contactType: ContactType;
    predominantImpact: "positive" | "mixed" | "negative";
    sessionCount: number;
  }[];
}

export interface FamilyContactIntelligenceResult {
  homeId: string;
  assessedAt: string;
  periodStart: string;
  periodEnd: string;

  // Overall
  overallScore: number; // 0-100
  rating: "outstanding" | "good" | "requires_improvement" | "inadequate";

  // Compliance
  compliance: ContactComplianceResult;

  // Quality
  quality: ContactQualityResult;

  // Impact
  impact: ContactImpactResult;

  // Per-child summary
  childSummaries: {
    childId: string;
    childName: string;
    arrangementsCount: number;
    sessionsCount: number;
    completionRate: number;
    positiveRate: number;
    primaryConcern?: string;
  }[];

  // Review compliance
  reviewsDue: number;
  reviewsOverdue: number;

  // Insights
  strengths: string[];
  areasForDevelopment: string[];
  immediateActions: string[];
  regulatoryLinks: string[];
}

// ── Core: Evaluate Compliance ──────────────────────────────────────────────

export function evaluateContactCompliance(
  arrangements: ContactArrangement[],
  sessions: ContactSession[],
  periodStart: string,
  periodEnd: string,
): ContactComplianceResult {
  const periodSessions = sessions.filter(
    (s) => s.scheduledDate >= periodStart && s.scheduledDate <= periodEnd,
  );

  const courtOrdered = arrangements.filter((a) => a.isCourtOrdered);

  // Check each court-ordered arrangement has been honoured
  let courtOrderedCompliant = 0;
  for (const arrangement of courtOrdered) {
    const arrangementSessions = periodSessions.filter((s) => s.arrangementId === arrangement.id);
    const completed = arrangementSessions.filter((s) =>
      s.outcome !== "cancelled_by_home" && s.outcome !== "no_show",
    );
    // Consider compliant if at least 75% of sessions not cancelled by home
    if (arrangementSessions.length === 0 || completed.length / arrangementSessions.length >= 0.75) {
      courtOrderedCompliant++;
    }
  }

  const sessionsCompleted = periodSessions.filter(
    (s) => s.outcome !== "cancelled_by_home" && s.outcome !== "cancelled_by_authority" && s.outcome !== "no_show",
  ).length;

  const cancellationsByFamily = periodSessions.filter((s) => s.outcome === "cancelled_by_family").length;
  const cancellationsByHome = periodSessions.filter((s) => s.outcome === "cancelled_by_home").length;
  const childRefusals = periodSessions.filter((s) => s.outcome === "child_refused").length;
  const noShows = periodSessions.filter((s) => s.outcome === "no_show").length;

  return {
    totalArrangements: arrangements.length,
    courtOrderedCount: courtOrdered.length,
    courtOrderedCompliant,
    courtOrderedComplianceRate: courtOrdered.length > 0
      ? Math.round((courtOrderedCompliant / courtOrdered.length) * 100) : 100,
    sessionsScheduled: periodSessions.length,
    sessionsCompleted,
    completionRate: periodSessions.length > 0
      ? Math.round((sessionsCompleted / periodSessions.length) * 100) : 100,
    cancellationsByFamily,
    cancellationsByHome,
    childRefusals,
    noShows,
  };
}

// ── Core: Evaluate Quality ─────────────────────────────────────────────────

export function evaluateContactQuality(
  sessions: ContactSession[],
  periodStart: string,
  periodEnd: string,
): ContactQualityResult {
  const periodSessions = sessions.filter(
    (s) => s.scheduledDate >= periodStart && s.scheduledDate <= periodEnd &&
      s.outcome !== "cancelled_by_family" && s.outcome !== "cancelled_by_home" &&
      s.outcome !== "cancelled_by_authority" && s.outcome !== "no_show",
  );

  const positiveOutcomes = periodSessions.filter((s) => s.outcome === "positive").length;
  const negativeOutcomes = periodSessions.filter((s) => s.outcome === "negative").length;
  const distressingOutcomes = periodSessions.filter((s) => s.outcome === "distressing").length;

  const childPrepared = periodSessions.filter((s) => s.childPrepared).length;
  const childVoiceRecorded = periodSessions.filter((s) => s.childVoiceRecorded).length;
  const paInformed = periodSessions.filter((s) => s.placingAuthorityInformed).length;

  const durations = periodSessions.filter((s) => s.duration).map((s) => s.duration!);
  const avgDuration = durations.length > 0
    ? Math.round(durations.reduce((s, d) => s + d, 0) / durations.length) : 0;

  return {
    totalSessions: periodSessions.length,
    positiveOutcomes,
    negativeOutcomes,
    distressingOutcomes,
    positiveRate: periodSessions.length > 0 ? Math.round((positiveOutcomes / periodSessions.length) * 100) : 0,
    childPreparedRate: periodSessions.length > 0 ? Math.round((childPrepared / periodSessions.length) * 100) : 0,
    childVoiceRecordedRate: periodSessions.length > 0 ? Math.round((childVoiceRecorded / periodSessions.length) * 100) : 0,
    placingAuthorityInformedRate: periodSessions.length > 0 ? Math.round((paInformed / periodSessions.length) * 100) : 0,
    averageDurationMinutes: avgDuration,
  };
}

// ── Core: Evaluate Impact ──────────────────────────────────────────────────

export function evaluateContactImpact(
  sessions: ContactSession[],
  arrangements: ContactArrangement[],
  periodStart: string,
  periodEnd: string,
): ContactImpactResult {
  const periodSessions = sessions.filter(
    (s) => s.scheduledDate >= periodStart && s.scheduledDate <= periodEnd &&
      s.outcome !== "cancelled_by_family" && s.outcome !== "cancelled_by_home" &&
      s.outcome !== "cancelled_by_authority" && s.outcome !== "no_show",
  );

  const sessionsWithImpact = periodSessions.filter((s) => s.impactIndicators.length > 0);

  // Impact indicator counts
  const indicatorCounts = new Map<ImpactIndicator, number>();
  for (const session of sessionsWithImpact) {
    for (const indicator of session.impactIndicators) {
      indicatorCounts.set(indicator, (indicatorCounts.get(indicator) || 0) + 1);
    }
  }

  const settledCount = indicatorCounts.get("settled_after") ?? 0;
  const dysregulatedCount = (indicatorCounts.get("dysregulated_after") ?? 0) +
    (indicatorCounts.get("aggressive_after") ?? 0);

  const highRiskIndicators: ImpactIndicator[] = [
    "dysregulated_after", "aggressive_after", "absconding_risk", "self_harm_risk", "sleep_disrupted",
  ];
  const highRiskImpacts = highRiskIndicators
    .map((indicator) => ({ indicator, count: indicatorCounts.get(indicator) ?? 0 }))
    .filter((h) => h.count > 0);

  // Impact patterns by family member + type
  const patternKey = (session: ContactSession) => {
    const arrangement = arrangements.find((a) => a.id === session.arrangementId);
    return arrangement ? `${arrangement.familyMemberName}|${session.contactType}` : null;
  };

  const patternGroups = new Map<string, ContactSession[]>();
  for (const session of sessionsWithImpact) {
    const key = patternKey(session);
    if (key) {
      const existing = patternGroups.get(key) || [];
      existing.push(session);
      patternGroups.set(key, existing);
    }
  }

  const impactPatterns = [...patternGroups.entries()].map(([key, group]) => {
    const [familyMember, contactType] = key.split("|") as [string, ContactType];
    const positiveCount = group.filter((s) =>
      s.impactIndicators.includes("settled_after") || s.impactIndicators.includes("positive_mood"),
    ).length;
    const negativeCount = group.filter((s) =>
      s.impactIndicators.some((i) => highRiskIndicators.includes(i)),
    ).length;

    const predominantImpact: "positive" | "mixed" | "negative" =
      positiveCount > negativeCount ? "positive" :
        negativeCount > positiveCount ? "negative" : "mixed";

    return { familyMember, contactType, predominantImpact, sessionCount: group.length };
  });

  return {
    totalSessions: periodSessions.length,
    sessionsWithImpactData: sessionsWithImpact.length,
    settledAfterRate: sessionsWithImpact.length > 0
      ? Math.round((settledCount / sessionsWithImpact.length) * 100) : 0,
    dysregulatedAfterRate: sessionsWithImpact.length > 0
      ? Math.round((dysregulatedCount / sessionsWithImpact.length) * 100) : 0,
    highRiskImpacts,
    impactPatterns,
  };
}

// ── Main: Generate Family Contact Intelligence ─────────────────────────────

export function generateFamilyContactIntelligence(
  arrangements: ContactArrangement[],
  sessions: ContactSession[],
  reviews: ContactReview[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
  currentDate: string,
): FamilyContactIntelligenceResult {
  const assessedAt = new Date().toISOString();

  // 1. Compliance
  const compliance = evaluateContactCompliance(arrangements, sessions, periodStart, periodEnd);

  // 2. Quality
  const quality = evaluateContactQuality(sessions, periodStart, periodEnd);

  // 3. Impact
  const impact = evaluateContactImpact(sessions, arrangements, periodStart, periodEnd);

  // 4. Review compliance
  const reviewsDue = arrangements.filter(
    (a) => a.reviewDate && a.reviewDate <= currentDate,
  ).length;
  const completedReviews = reviews.filter(
    (r) => r.reviewDate >= periodStart && r.reviewDate <= periodEnd,
  );
  const reviewsOverdue = arrangements.filter(
    (a) => a.reviewDate && a.reviewDate < currentDate &&
      !completedReviews.some((r) => r.arrangementId === a.id),
  ).length;

  // 5. Per-child summaries
  const childIds = [...new Set(arrangements.map((a) => a.childId))];
  const childSummaries = childIds.map((childId) => {
    const childArrangements = arrangements.filter((a) => a.childId === childId);
    const childSessions = sessions.filter(
      (s) => s.childId === childId && s.scheduledDate >= periodStart && s.scheduledDate <= periodEnd,
    );
    const completed = childSessions.filter(
      (s) => s.outcome !== "cancelled_by_home" && s.outcome !== "no_show" &&
        s.outcome !== "cancelled_by_authority",
    );
    const positive = completed.filter((s) => s.outcome === "positive");
    const distressing = completed.filter((s) => s.outcome === "distressing" || s.outcome === "negative");

    let primaryConcern: string | undefined;
    if (distressing.length > completed.length * 0.5 && completed.length >= 2) {
      primaryConcern = "Majority of contact outcomes are negative/distressing";
    } else if (childSessions.filter((s) => s.outcome === "child_refused").length >= 2) {
      primaryConcern = "Multiple contact refusals — explore child's wishes and feelings";
    }

    return {
      childId,
      childName: childArrangements[0]?.childName ?? childId,
      arrangementsCount: childArrangements.length,
      sessionsCount: childSessions.length,
      completionRate: childSessions.length > 0
        ? Math.round((completed.length / childSessions.length) * 100) : 100,
      positiveRate: completed.length > 0
        ? Math.round((positive.length / completed.length) * 100) : 0,
      primaryConcern,
    };
  });

  // 6. Overall score
  const overallScore = calculateFamilyContactScore(compliance, quality, impact, reviewsOverdue);
  const rating = getContactRating(overallScore);

  // 7. Insights
  const strengths = generateContactStrengths(compliance, quality, impact);
  const areasForDevelopment = generateContactDevelopment(compliance, quality, impact, reviewsOverdue);
  const immediateActions = generateContactActions(compliance, quality, childSummaries, reviewsOverdue);
  const regulatoryLinks = generateContactRegulatoryLinks(compliance, quality, childSummaries);

  return {
    homeId,
    assessedAt,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    compliance,
    quality,
    impact,
    childSummaries,
    reviewsDue,
    reviewsOverdue,
    strengths,
    areasForDevelopment,
    immediateActions,
    regulatoryLinks,
  };
}

// ── Scoring ────────────────────────────────────────────────────────────────

function calculateFamilyContactScore(
  compliance: ContactComplianceResult,
  quality: ContactQualityResult,
  impact: ContactImpactResult,
  reviewsOverdue: number,
): number {
  let score = 0;

  // Compliance (max 30)
  score += (compliance.courtOrderedComplianceRate / 100) * 15;
  score += (compliance.completionRate / 100) * 15;

  // Quality (max 35)
  score += (quality.positiveRate / 100) * 10;
  score += (quality.childPreparedRate / 100) * 10;
  score += (quality.childVoiceRecordedRate / 100) * 10;
  score += (quality.placingAuthorityInformedRate / 100) * 5;

  // Impact awareness (max 20)
  if (impact.sessionsWithImpactData > 0) {
    const impactRecordingRate = (impact.sessionsWithImpactData / impact.totalSessions) * 100;
    score += (impactRecordingRate / 100) * 10;
  }
  score += (impact.settledAfterRate / 100) * 10;

  // Review compliance (max 15)
  score += reviewsOverdue === 0 ? 15 : Math.max(0, 15 - reviewsOverdue * 5);

  // Penalties
  if (compliance.cancellationsByHome > 2) score -= (compliance.cancellationsByHome - 2) * 3;
  if (impact.dysregulatedAfterRate > 50) score -= 5;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function getContactRating(score: number): "outstanding" | "good" | "requires_improvement" | "inadequate" {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// ── Insight Generation ─────────────────────────────────────────────────────

function generateContactStrengths(
  compliance: ContactComplianceResult,
  quality: ContactQualityResult,
  impact: ContactImpactResult,
): string[] {
  const strengths: string[] = [];

  if (compliance.courtOrderedComplianceRate === 100 && compliance.courtOrderedCount > 0) {
    strengths.push("100% compliance with court-ordered contact arrangements");
  }
  if (quality.childPreparedRate >= 90) {
    strengths.push("Children consistently prepared for contact, supporting emotional regulation");
  }
  if (quality.childVoiceRecordedRate >= 85) {
    strengths.push("Children's wishes and feelings recorded in the majority of contact sessions");
  }
  if (quality.positiveRate >= 70) {
    strengths.push("High proportion of positive contact outcomes indicates well-managed arrangements");
  }
  if (compliance.cancellationsByHome === 0) {
    strengths.push("No contact cancelled by the home — demonstrates commitment to family relationships");
  }
  if (impact.settledAfterRate >= 60) {
    strengths.push("Children are predominantly settled after contact, indicating appropriate support");
  }

  return strengths;
}

function generateContactDevelopment(
  compliance: ContactComplianceResult,
  quality: ContactQualityResult,
  impact: ContactImpactResult,
  reviewsOverdue: number,
): string[] {
  const areas: string[] = [];

  if (compliance.courtOrderedComplianceRate < 100 && compliance.courtOrderedCount > 0) {
    areas.push("Court-ordered contact compliance below 100% — review barriers and document rationale");
  }
  if (quality.childPreparedRate < 70) {
    areas.push("Child preparation rate below 70% — develop consistent pre-contact routine");
  }
  if (quality.childVoiceRecordedRate < 60) {
    areas.push("Child voice captured in fewer than 60% of sessions — embed recording practice");
  }
  if (quality.placingAuthorityInformedRate < 80) {
    areas.push("Placing authority notification rate below 80% — review communication protocols");
  }
  if (impact.dysregulatedAfterRate > 40) {
    areas.push("High dysregulation rate post-contact (>40%) — review contact arrangements and support strategies");
  }
  if (reviewsOverdue > 0) {
    areas.push(`${reviewsOverdue} contact arrangement review(s) overdue — prioritise scheduling`);
  }
  if (compliance.childRefusals >= 2) {
    areas.push(`${compliance.childRefusals} child refusal(s) recorded — ensure wishes and feelings explored with sensitivity`);
  }

  return areas;
}

function generateContactActions(
  compliance: ContactComplianceResult,
  quality: ContactQualityResult,
  childSummaries: { childName: string; primaryConcern?: string }[],
  reviewsOverdue: number,
): string[] {
  const actions: string[] = [];

  if (compliance.cancellationsByHome > 0) {
    actions.push(
      `HIGH: ${compliance.cancellationsByHome} contact session(s) cancelled by the home. Document clear rationale and inform placing authority. Court-ordered contact must not be cancelled without lawful authority.`,
    );
  }

  const concernedChildren = childSummaries.filter((c) => c.primaryConcern);
  for (const child of concernedChildren) {
    actions.push(
      `MEDIUM: ${child.childName} — ${child.primaryConcern}. Schedule review of contact arrangement.`,
    );
  }

  if (reviewsOverdue > 0) {
    actions.push(
      `MEDIUM: ${reviewsOverdue} contact arrangement review(s) overdue. Schedule with placing authority within 5 working days.`,
    );
  }

  if (quality.childVoiceRecordedRate < 50) {
    actions.push(
      `MEDIUM: Child voice recorded in only ${quality.childVoiceRecordedRate}% of sessions. Implement post-contact check-in prompt in recording template.`,
    );
  }

  if (actions.length === 0) {
    actions.push("No immediate actions required. Contact arrangements are well-managed and child-centred.");
  }

  return actions;
}

function generateContactRegulatoryLinks(
  compliance: ContactComplianceResult,
  quality: ContactQualityResult,
  childSummaries: { primaryConcern?: string }[],
): string[] {
  const links = new Set<string>();

  links.add("CHR 2015, Reg 22 — Contact and access to communications");
  links.add("SCCIF: Experiences and progress — Quality of family relationships");

  if (compliance.courtOrderedCount > 0) {
    links.add("Children Act 1989, Schedule 2, Para 15 — Duty to promote contact");
    links.add("CHR 2015, Reg 14 — Placement plan: contact arrangements");
  }

  if (quality.childVoiceRecordedRate < 100) {
    links.add("CHR 2015, Reg 7 — Children's wishes and feelings");
    links.add("UNCRC Article 9 — Right to maintain contact with parents");
  }

  if (compliance.cancellationsByHome > 0) {
    links.add("CHR 2015, Reg 22(2) — Must not unreasonably restrict contact");
  }

  const hasDistressConcern = childSummaries.some((c) => c.primaryConcern?.includes("distressing"));
  if (hasDistressConcern) {
    links.add("CHR 2015, Reg 22(3) — Monitor impact of contact on welfare");
    links.add("CHR 2015, Reg 34 — Review quality of care when concerns arise");
  }

  return [...links];
}

// ── Utility: Labels ────────────────────────────────────────────────────────

export function getContactTypeLabel(type: ContactType): string {
  const labels: Record<ContactType, string> = {
    face_to_face: "Face-to-Face",
    telephone: "Telephone",
    video_call: "Video Call",
    letter: "Letter",
    supervised_visit: "Supervised Visit",
    unsupervised_visit: "Unsupervised Visit",
    overnight_stay: "Overnight Stay",
    community_contact: "Community Contact",
    indirect: "Indirect Contact",
  };
  return labels[type];
}

export function getContactOutcomeLabel(outcome: ContactOutcome): string {
  const labels: Record<ContactOutcome, string> = {
    positive: "Positive",
    mixed: "Mixed",
    negative: "Negative",
    neutral: "Neutral",
    distressing: "Distressing",
    cancelled_by_family: "Cancelled (Family)",
    cancelled_by_home: "Cancelled (Home)",
    cancelled_by_authority: "Cancelled (Authority)",
    child_refused: "Child Refused",
    no_show: "No Show",
  };
  return labels[outcome];
}

export function getFamilyMemberLabel(type: FamilyMember): string {
  const labels: Record<FamilyMember, string> = {
    mother: "Mother",
    father: "Father",
    sibling: "Sibling",
    grandparent: "Grandparent",
    extended_family: "Extended Family",
    other_significant: "Other Significant Person",
  };
  return labels[type];
}

export function getImpactIndicatorLabel(indicator: ImpactIndicator): string {
  const labels: Record<ImpactIndicator, string> = {
    settled_after: "Settled After Contact",
    unsettled_after: "Unsettled After Contact",
    dysregulated_after: "Dysregulated After Contact",
    positive_mood: "Positive Mood",
    withdrawn_after: "Withdrawn After Contact",
    aggressive_after: "Aggressive After Contact",
    sleep_disrupted: "Sleep Disrupted",
    absconding_risk: "Absconding Risk",
    self_harm_risk: "Self-Harm Risk",
    improved_engagement: "Improved Engagement",
  };
  return labels[indicator];
}
