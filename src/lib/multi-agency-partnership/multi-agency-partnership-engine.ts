// ══════════════════════════════════════════════════════════════════════════════
// MULTI-AGENCY PARTNERSHIP INTELLIGENCE ENGINE
//
// Pure deterministic engine for evaluating the quality and effectiveness of
// multi-agency working — how well the home collaborates with social workers,
// health professionals, education, CAMHS, police, voluntary sector, and other
// agencies. A critical area under SCCIF and Working Together 2023.
//
// Effective multi-agency partnership is the bedrock of good outcomes for
// looked-after children. Ofsted/SCCIF inspectors specifically examine whether
// homes proactively engage partners, attend and contribute to meetings,
// share information appropriately, and make timely and appropriate referrals.
//
// Regulatory basis:
//   - Working Together to Safeguard Children 2023
//   - CHR 2015, Reg 5 — Engaging with other professionals
//   - CHR 2015, Reg 22 — Review and monitoring of partnership working
//   - SCCIF — "The effectiveness of leaders and managers"
//   - Children Act 1989, s27 — Co-operation between authorities
//   - Information Sharing Advice for Safeguarding Practitioners (2018)
//
// No AI. No external calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ──────────────────────────────────────────────────────────────────

export type AgencyType =
  | "social_work"
  | "health"
  | "education"
  | "camhs"
  | "police"
  | "youth_justice"
  | "voluntary_sector"
  | "advocacy"
  | "irp"
  | "housing"
  | "substance_misuse"
  | "immigration";

export type EngagementQuality =
  | "excellent"
  | "good"
  | "adequate"
  | "poor"
  | "disengaged";

export type MeetingType =
  | "strategy"
  | "review"
  | "planning"
  | "professionals"
  | "safeguarding_conference"
  | "looked_after_review"
  | "education_review";

export type InformationSharingQuality =
  | "timely_comprehensive"
  | "timely_partial"
  | "delayed"
  | "not_shared"
  | "not_applicable";

export type ReferralOutcome =
  | "accepted"
  | "declined"
  | "waiting"
  | "completed"
  | "withdrawn";

export type PartnerFeedback =
  | "very_positive"
  | "positive"
  | "neutral"
  | "negative"
  | "very_negative";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface AgencyRelationship {
  id: string;
  agencyType: AgencyType;
  agencyName: string;
  namedContact: string;
  engagementQuality: EngagementQuality;
  lastContactDate: string; // ISO date
  contactFrequency: string;
  informationSharingAgreementInPlace: boolean;
  feedbackReceived?: PartnerFeedback;
}

export interface MultiAgencyMeeting {
  id: string;
  childId: string;
  meetingType: MeetingType;
  meetingDate: string; // ISO date
  agenciesInvited: AgencyType[];
  agenciesAttended: AgencyType[];
  homeRepresentativeAttended: boolean;
  minutesCirculated: boolean;
  actionsIdentified: number;
  actionsCompleted: number;
  childParticipated: boolean;
}

export interface AgencyReferral {
  id: string;
  childId: string;
  referredTo: AgencyType;
  referralDate: string; // ISO date
  outcome: ReferralOutcome;
  responseTimeDays: number;
  appropriateReferral: boolean;
  followUpCompleted: boolean;
}

export interface InformationSharingRecord {
  id: string;
  childId: string;
  sharedWith: AgencyType;
  shareDate: string; // ISO date
  quality: InformationSharingQuality;
  consentObtained: boolean;
  timeliness: boolean;
  relevantToChildPlan: boolean;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface PartnershipEngagementResult {
  score: number; // 0-25
  engagementCoverage: number; // percentage
  qualityRate: number; // percentage of excellent/good
  isaRate: number; // percentage with ISA in place
  positiveFeedbackRate: number; // percentage positive/very_positive
  recentContactRate: number; // percentage contacted within 30 days
}

export interface MeetingEffectivenessResult {
  score: number; // 0-25
  attendanceRate: number | null; // agencies attended / invited
  homeAttendanceRate: number; // percentage
  minutesCirculatedRate: number; // percentage
  actionsCompletionRate: number | null; // percentage
  childParticipationRate: number; // percentage
  meetingTypeVariety: number; // unique types count
}

export interface ReferralQualityResult {
  score: number; // 0-25
  appropriateRate: number; // percentage
  followUpRate: number; // percentage
  acceptanceRate: number; // percentage
  averageResponseDays: number;
  completionRate: number; // percentage
  totalReferrals: number;
}

export interface InformationSharingResult {
  score: number; // 0-25
  timelinessRate: number; // percentage
  comprehensiveRate: number; // percentage timely_comprehensive
  consentRate: number; // percentage
  relevanceRate: number; // percentage
  agencyTypeCoverage: number; // unique agency types shared with
}

export interface MultiAgencyPartnershipResult {
  homeId: string;
  assessedAt: string;
  periodStart: string;
  periodEnd: string;

  // Overall
  overallScore: number; // 0-100
  rating: Rating;

  // Sub-scores
  partnershipEngagement: PartnershipEngagementResult;
  meetingEffectiveness: MeetingEffectivenessResult;
  referralQuality: ReferralQualityResult;
  informationSharing: InformationSharingResult;

  // Summary stats
  totalRelationships: number;
  totalMeetings: number;
  totalReferrals: number;
  totalInformationShares: number;

  // Insights
  strengths: string[];
  concerns: string[];
  immediateActions: string[];
  regulatoryLinks: string[];
}

// ── Sub-score 1: Partnership Engagement (0-25) ─────────────────────────────

export function evaluatePartnershipEngagement(
  relationships: AgencyRelationship[],
  totalAgencyTypes: number,
): PartnershipEngagementResult {
  if (relationships.length === 0) {
    return {
      score: 0,
      engagementCoverage: 0,
      qualityRate: 0,
      isaRate: 0,
      positiveFeedbackRate: 0,
      recentContactRate: 0,
    };
  }

  let score = 0;

  // Engagement coverage: % of key agency types with a relationship
  const uniqueAgencies = new Set(relationships.map((r) => r.agencyType));
  const coverageTarget = Math.max(totalAgencyTypes, 1);
  const engagementCoverage = Math.round((uniqueAgencies.size / coverageTarget) * 100);
  score += Math.min(8, Math.round((engagementCoverage / 100) * 8));

  // Quality: % excellent or good
  const excellentOrGood = relationships.filter(
    (r) => r.engagementQuality === "excellent" || r.engagementQuality === "good",
  ).length;
  const qualityRate = Math.round((excellentOrGood / relationships.length) * 100);
  score += qualityRate >= 80 ? 5 : Math.round((qualityRate / 80) * 5);

  // ISA in place >= 80%
  const isaCount = relationships.filter((r) => r.informationSharingAgreementInPlace).length;
  const isaRate = Math.round((isaCount / relationships.length) * 100);
  score += isaRate >= 80 ? 4 : Math.round((isaRate / 80) * 4);

  // Positive feedback >= 80%
  const withFeedback = relationships.filter((r) => r.feedbackReceived !== undefined);
  let positiveFeedbackRate = 0;
  if (withFeedback.length > 0) {
    const positiveFeedback = withFeedback.filter(
      (r) => r.feedbackReceived === "very_positive" || r.feedbackReceived === "positive",
    ).length;
    positiveFeedbackRate = Math.round((positiveFeedback / withFeedback.length) * 100);
  }
  score += positiveFeedbackRate >= 80 ? 4 : Math.round((positiveFeedbackRate / 80) * 4);

  // Recent contact: within 30 days
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const recentContact = relationships.filter((r) => {
    const contactDate = new Date(r.lastContactDate);
    return contactDate >= thirtyDaysAgo;
  }).length;
  const recentContactRate = Math.round((recentContact / relationships.length) * 100);
  score += recentContactRate >= 80 ? 4 : Math.round((recentContactRate / 80) * 4);

  return {
    score: Math.min(25, score),
    engagementCoverage,
    qualityRate,
    isaRate,
    positiveFeedbackRate,
    recentContactRate,
  };
}

// ── Sub-score 2: Meeting Effectiveness (0-25) ──────────────────────────────

export function evaluateMeetingEffectiveness(
  meetings: MultiAgencyMeeting[],
): MeetingEffectivenessResult {
  if (meetings.length === 0) {
    return {
      score: 0,
      attendanceRate: 0,
      homeAttendanceRate: 0,
      minutesCirculatedRate: 0,
      actionsCompletionRate: 0,
      childParticipationRate: 0,
      meetingTypeVariety: 0,
    };
  }

  let score = 0;

  // Attendance rate: agencies attended / invited across all meetings
  let totalInvited = 0;
  let totalAttended = 0;
  for (const m of meetings) {
    totalInvited += m.agenciesInvited.length;
    totalAttended += m.agenciesAttended.length;
  }
  const attendanceRate = totalInvited > 0
    ? Math.round((totalAttended / totalInvited) * 100)
    : null;
  score += (attendanceRate ?? 0) >= 80 ? 6 : Math.round(((attendanceRate ?? 0) / 80) * 6);

  // Home representative attendance >= 95%
  const homeAttended = meetings.filter((m) => m.homeRepresentativeAttended).length;
  const homeAttendanceRate = Math.round((homeAttended / meetings.length) * 100);
  score += homeAttendanceRate >= 95 ? 5 : Math.round((homeAttendanceRate / 95) * 5);

  // Minutes circulated >= 90%
  const minutesCirculated = meetings.filter((m) => m.minutesCirculated).length;
  const minutesCirculatedRate = Math.round((minutesCirculated / meetings.length) * 100);
  score += minutesCirculatedRate >= 90 ? 4 : Math.round((minutesCirculatedRate / 90) * 4);

  // Actions completion rate >= 80%
  let totalActions = 0;
  let totalCompleted = 0;
  for (const m of meetings) {
    totalActions += m.actionsIdentified;
    totalCompleted += m.actionsCompleted;
  }
  const actionsCompletionRate = totalActions > 0
    ? Math.round((totalCompleted / totalActions) * 100)
    : null;
  score += (actionsCompletionRate ?? 0) >= 80 ? 4 : Math.round(((actionsCompletionRate ?? 0) / 80) * 4);

  // Child participation >= 70%
  const childParticipated = meetings.filter((m) => m.childParticipated).length;
  const childParticipationRate = Math.round((childParticipated / meetings.length) * 100);
  score += childParticipationRate >= 70 ? 3 : Math.round((childParticipationRate / 70) * 3);

  // Meeting type variety
  const uniqueTypes = new Set(meetings.map((m) => m.meetingType));
  const meetingTypeVariety = uniqueTypes.size;
  score += meetingTypeVariety >= 4 ? 3 : meetingTypeVariety >= 3 ? 2 : meetingTypeVariety >= 2 ? 1 : 0;

  return {
    score: Math.min(25, score),
    attendanceRate,
    homeAttendanceRate,
    minutesCirculatedRate,
    actionsCompletionRate,
    childParticipationRate,
    meetingTypeVariety,
  };
}

// ── Sub-score 3: Referral Quality (0-25) ───────────────────────────────────

export function evaluateReferralQuality(
  referrals: AgencyReferral[],
): ReferralQualityResult {
  if (referrals.length === 0) {
    return {
      score: 15, // neutral when no referrals
      appropriateRate: 0,
      followUpRate: 0,
      acceptanceRate: 0,
      averageResponseDays: 0,
      completionRate: 0,
      totalReferrals: 0,
    };
  }

  let score = 0;

  // Appropriate referral >= 90%
  const appropriate = referrals.filter((r) => r.appropriateReferral).length;
  const appropriateRate = Math.round((appropriate / referrals.length) * 100);
  score += appropriateRate >= 90 ? 8 : Math.round((appropriateRate / 90) * 8);

  // Follow-up >= 90%
  const followedUp = referrals.filter((r) => r.followUpCompleted).length;
  const followUpRate = Math.round((followedUp / referrals.length) * 100);
  score += followUpRate >= 90 ? 5 : Math.round((followUpRate / 90) * 5);

  // Acceptance rate >= 70%
  const resolvedReferrals = referrals.filter(
    (r) => r.outcome === "accepted" || r.outcome === "declined" || r.outcome === "completed",
  );
  let acceptanceRate = 0;
  if (resolvedReferrals.length > 0) {
    const accepted = resolvedReferrals.filter(
      (r) => r.outcome === "accepted" || r.outcome === "completed",
    ).length;
    acceptanceRate = Math.round((accepted / resolvedReferrals.length) * 100);
  }
  score += acceptanceRate >= 70 ? 5 : Math.round((acceptanceRate / 70) * 5);

  // Average response time <= 7 days
  const avgResponseDays = referrals.reduce((sum, r) => sum + r.responseTimeDays, 0) / referrals.length;
  const averageResponseDays = Math.round(avgResponseDays * 10) / 10;
  score += averageResponseDays <= 7 ? 4 : averageResponseDays <= 14 ? 2 : 0;

  // Completion rate
  const completed = referrals.filter((r) => r.outcome === "completed").length;
  const completionRate = Math.round((completed / referrals.length) * 100);
  score += completionRate >= 70 ? 3 : Math.round((completionRate / 70) * 3);

  return {
    score: Math.min(25, score),
    appropriateRate,
    followUpRate,
    acceptanceRate,
    averageResponseDays,
    completionRate,
    totalReferrals: referrals.length,
  };
}

// ── Sub-score 4: Information Sharing (0-25) ────────────────────────────────

export function evaluateInformationSharing(
  records: InformationSharingRecord[],
): InformationSharingResult {
  if (records.length === 0) {
    return {
      score: 0,
      timelinessRate: 0,
      comprehensiveRate: 0,
      consentRate: 0,
      relevanceRate: 0,
      agencyTypeCoverage: 0,
    };
  }

  let score = 0;

  // Timeliness >= 90%
  const timely = records.filter((r) => r.timeliness).length;
  const timelinessRate = Math.round((timely / records.length) * 100);
  score += timelinessRate >= 90 ? 7 : Math.round((timelinessRate / 90) * 7);

  // Quality: timely_comprehensive >= 70%
  const comprehensive = records.filter((r) => r.quality === "timely_comprehensive").length;
  const comprehensiveRate = Math.round((comprehensive / records.length) * 100);
  score += comprehensiveRate >= 70 ? 6 : Math.round((comprehensiveRate / 70) * 6);

  // Consent obtained >= 100%
  const consented = records.filter((r) => r.consentObtained).length;
  const consentRate = Math.round((consented / records.length) * 100);
  score += consentRate >= 100 ? 5 : Math.round((consentRate / 100) * 5);

  // Relevance >= 90%
  const relevant = records.filter((r) => r.relevantToChildPlan).length;
  const relevanceRate = Math.round((relevant / records.length) * 100);
  score += relevanceRate >= 90 ? 4 : Math.round((relevanceRate / 90) * 4);

  // Coverage: sharing with >= 3 agency types
  const uniqueAgencies = new Set(records.map((r) => r.sharedWith));
  const agencyTypeCoverage = uniqueAgencies.size;
  score += agencyTypeCoverage >= 3 ? 3 : agencyTypeCoverage >= 2 ? 2 : agencyTypeCoverage >= 1 ? 1 : 0;

  return {
    score: Math.min(25, score),
    timelinessRate,
    comprehensiveRate,
    consentRate,
    relevanceRate,
    agencyTypeCoverage,
  };
}

// ── Rating ──────────────────────────────────────────────────────────────────

function getOverallRating(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// ── Insight Generation ─────────────────────────────────────────────────────

function generateStrengths(
  engagement: PartnershipEngagementResult,
  meetings: MeetingEffectivenessResult,
  referrals: ReferralQualityResult,
  infoSharing: InformationSharingResult,
): string[] {
  const strengths: string[] = [];

  if (engagement.engagementCoverage >= 80) {
    strengths.push("Comprehensive agency coverage: the home maintains relationships with a wide range of partner agencies");
  }
  if (engagement.qualityRate >= 80) {
    strengths.push("High-quality partnerships: the majority of agency relationships are rated excellent or good");
  }
  if (engagement.positiveFeedbackRate >= 80) {
    strengths.push("Positive partner feedback demonstrates the home is viewed as a collaborative and effective partner");
  }
  if (meetings.homeAttendanceRate >= 95) {
    strengths.push("Excellent home attendance at multi-agency meetings demonstrates commitment to partnership working");
  }
  if ((meetings.actionsCompletionRate ?? 0) >= 80) {
    strengths.push("Strong action completion rate shows the home follows through on multi-agency commitments");
  }
  if (meetings.childParticipationRate >= 70) {
    strengths.push("Good child participation in multi-agency meetings ensures their voice informs decision-making");
  }
  if (referrals.appropriateRate >= 90 && referrals.totalReferrals > 0) {
    strengths.push("Referrals are consistently appropriate, demonstrating sound professional judgement about when specialist support is needed");
  }
  if (infoSharing.consentRate >= 100) {
    strengths.push("Consent is consistently obtained before sharing information, demonstrating strong data governance practice");
  }
  if (infoSharing.timelinessRate >= 90) {
    strengths.push("Information is shared in a timely manner, enabling partner agencies to respond effectively");
  }
  if (infoSharing.comprehensiveRate >= 70) {
    strengths.push("Information shared is comprehensive and of high quality, supporting effective multi-agency decision-making");
  }

  return strengths;
}

function generateConcerns(
  engagement: PartnershipEngagementResult,
  meetings: MeetingEffectivenessResult,
  referrals: ReferralQualityResult,
  infoSharing: InformationSharingResult,
  relationships: AgencyRelationship[],
): string[] {
  const concerns: string[] = [];

  if (engagement.engagementCoverage < 50) {
    concerns.push(`Agency coverage at ${engagement.engagementCoverage}%: significant gaps in partnership network may leave children without access to specialist support`);
  }
  if (engagement.qualityRate < 60) {
    concerns.push(`Only ${engagement.qualityRate}% of partnerships rated as good or excellent — partnership quality requires improvement`);
  }

  const disengaged = relationships.filter((r) => r.engagementQuality === "disengaged");
  if (disengaged.length > 0) {
    concerns.push(`${disengaged.length} agency relationship(s) rated as disengaged: ${disengaged.map((r) => r.agencyName).join(", ")}`);
  }

  if ((meetings.attendanceRate ?? 0) < 60) {
    concerns.push(`Multi-agency meeting attendance at ${meetings.attendanceRate}%: poor attendance undermines collaborative working`);
  }
  if (meetings.homeAttendanceRate < 80) {
    concerns.push(`Home representative attendance at ${meetings.homeAttendanceRate}%: missing meetings risks children's needs not being effectively advocated for`);
  }
  if ((meetings.actionsCompletionRate ?? 0) < 60) {
    concerns.push(`Action completion rate at ${meetings.actionsCompletionRate}%: agreed actions are not being followed through`);
  }

  if (referrals.totalReferrals > 0 && referrals.appropriateRate < 70) {
    concerns.push(`Only ${referrals.appropriateRate}% of referrals deemed appropriate — staff may need training on referral thresholds`);
  }
  if (referrals.totalReferrals > 0 && referrals.averageResponseDays > 14) {
    concerns.push(`Average referral response time is ${referrals.averageResponseDays} days — delays may leave children without timely specialist support`);
  }

  if (infoSharing.consentRate < 100) {
    concerns.push(`Consent rate at ${infoSharing.consentRate}%: information is being shared without full consent — potential GDPR and safeguarding breach`);
  }
  if (infoSharing.timelinessRate < 70) {
    concerns.push(`Information timeliness at ${infoSharing.timelinessRate}%: delays in sharing critical information could compromise child safety`);
  }

  return concerns;
}

function generateImmediateActions(
  engagement: PartnershipEngagementResult,
  meetings: MeetingEffectivenessResult,
  referrals: ReferralQualityResult,
  infoSharing: InformationSharingResult,
  relationships: AgencyRelationship[],
): string[] {
  const actions: string[] = [];

  const disengaged = relationships.filter((r) => r.engagementQuality === "disengaged");
  if (disengaged.length > 0) {
    actions.push(
      `URGENT: Re-establish contact with ${disengaged.length} disengaged agency partner(s): ${disengaged.map((r) => r.agencyName).join(", ")}. Schedule introductory meeting within 5 working days.`,
    );
  }

  if (infoSharing.consentRate < 100) {
    actions.push(
      "HIGH: Review information sharing consent processes immediately. Ensure all sharing has documented consent or lawful basis under GDPR/Data Protection Act 2018.",
    );
  }

  const noISA = relationships.filter((r) => !r.informationSharingAgreementInPlace);
  if (noISA.length > 0) {
    actions.push(
      `HIGH: ${noISA.length} agency relationship(s) without an information sharing agreement. Establish ISAs with: ${noISA.map((r) => r.agencyName).join(", ")}.`,
    );
  }

  if (meetings.homeAttendanceRate < 80) {
    actions.push(
      `MEDIUM: Home attendance at multi-agency meetings is ${meetings.homeAttendanceRate}%. Review diary management and ensure a representative attends all future meetings.`,
    );
  }

  if ((meetings.actionsCompletionRate ?? 0) < 60) {
    actions.push(
      "MEDIUM: Action completion rate is critically low. Implement an action tracking system and assign named owners for all multi-agency meeting actions.",
    );
  }

  if (referrals.totalReferrals > 0 && referrals.followUpRate < 70) {
    actions.push(
      `MEDIUM: Referral follow-up rate at ${referrals.followUpRate}%. Establish a referral tracking log and ensure all referrals are followed up within 10 working days.`,
    );
  }

  if (engagement.engagementCoverage < 50) {
    actions.push(
      "MEDIUM: Expand partnership network. Map all agencies relevant to children in placement and establish working relationships with priority agencies.",
    );
  }

  if (actions.length === 0) {
    actions.push("No immediate actions required. Multi-agency partnership practice is effective. Continue to strengthen relationships and monitor partnership quality.");
  }

  return actions;
}

function generateRegulatoryLinks(
  engagement: PartnershipEngagementResult,
  meetings: MeetingEffectivenessResult,
  infoSharing: InformationSharingResult,
  relationships: AgencyRelationship[],
): string[] {
  const links = new Set<string>();

  // Always applicable
  links.add("Working Together to Safeguard Children 2023 — Multi-agency working and information sharing");
  links.add("CHR 2015, Reg 5 — Engaging with independent persons and other professionals");
  links.add("SCCIF — The effectiveness of leaders and managers: partnership working");
  links.add("Children Act 1989, s27 — Co-operation between authorities");

  // Conditional
  if (infoSharing.consentRate < 100 || infoSharing.timelinessRate < 70) {
    links.add("Information Sharing Advice for Safeguarding Practitioners (HM Government, 2018)");
    links.add("Data Protection Act 2018 / UK GDPR — Lawful basis for information sharing");
  }

  if (engagement.engagementCoverage < 50) {
    links.add("CHR 2015, Reg 22 — Review of quality of care: failure to engage partner agencies");
  }

  const disengaged = relationships.filter((r) => r.engagementQuality === "disengaged");
  if (disengaged.length > 0) {
    links.add("CHR 2015, Reg 5(a) — Requirement to proactively engage with professionals involved in child's care");
  }

  if (meetings.homeAttendanceRate < 80) {
    links.add("CHR 2015, Reg 22(3) — The registered person must actively participate in reviews and meetings");
  }

  if (meetings.childParticipationRate < 50) {
    links.add("UNCRC Article 12 — The right of the child to be heard in decisions affecting them");
    links.add("Children Act 1989, s22(4) — Duty to ascertain child's wishes and feelings");
  }

  return [...links];
}

// ── Main: Generate Multi-Agency Partnership Intelligence ───────────────────

export function generateMultiAgencyPartnershipIntelligence(
  relationships: AgencyRelationship[],
  meetings: MultiAgencyMeeting[],
  referrals: AgencyReferral[],
  informationSharing: InformationSharingRecord[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): MultiAgencyPartnershipResult {
  const assessedAt = new Date().toISOString();

  // Total key agency types for coverage calculation
  const totalAgencyTypes = 5; // social_work, health, education, camhs, police are "key"

  // Calculate sub-scores
  const partnershipEngagement = evaluatePartnershipEngagement(relationships, totalAgencyTypes);
  const meetingEffectiveness = evaluateMeetingEffectiveness(meetings);
  const referralQuality = evaluateReferralQuality(referrals);
  const informationSharingResult = evaluateInformationSharing(informationSharing);

  // Overall score = sum of sub-scores (0-100)
  const overallScore = Math.max(
    0,
    Math.min(
      100,
      partnershipEngagement.score +
        meetingEffectiveness.score +
        referralQuality.score +
        informationSharingResult.score,
    ),
  );

  const rating = getOverallRating(overallScore);

  // Insights
  const strengths = generateStrengths(
    partnershipEngagement,
    meetingEffectiveness,
    referralQuality,
    informationSharingResult,
  );
  const concerns = generateConcerns(
    partnershipEngagement,
    meetingEffectiveness,
    referralQuality,
    informationSharingResult,
    relationships,
  );
  const immediateActions = generateImmediateActions(
    partnershipEngagement,
    meetingEffectiveness,
    referralQuality,
    informationSharingResult,
    relationships,
  );
  const regulatoryLinks = generateRegulatoryLinks(
    partnershipEngagement,
    meetingEffectiveness,
    informationSharingResult,
    relationships,
  );

  return {
    homeId,
    assessedAt,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    partnershipEngagement,
    meetingEffectiveness,
    referralQuality,
    informationSharing: informationSharingResult,
    totalRelationships: relationships.length,
    totalMeetings: meetings.length,
    totalReferrals: referrals.length,
    totalInformationShares: informationSharing.length,
    strengths,
    concerns,
    immediateActions,
    regulatoryLinks,
  };
}

// ── Utility: Labels ────────────────────────────────────────────────────────

export function getAgencyTypeLabel(type: AgencyType): string {
  const labels: Record<AgencyType, string> = {
    social_work: "Social Work Team",
    health: "Health Services",
    education: "Education",
    camhs: "CAMHS",
    police: "Police",
    youth_justice: "Youth Justice",
    voluntary_sector: "Voluntary Sector",
    advocacy: "Advocacy Service",
    irp: "Independent Reviewing Officer",
    housing: "Housing",
    substance_misuse: "Substance Misuse",
    immigration: "Immigration",
  };
  return labels[type];
}

export function getEngagementQualityLabel(quality: EngagementQuality): string {
  const labels: Record<EngagementQuality, string> = {
    excellent: "Excellent",
    good: "Good",
    adequate: "Adequate",
    poor: "Poor",
    disengaged: "Disengaged",
  };
  return labels[quality];
}

export function getMeetingTypeLabel(type: MeetingType): string {
  const labels: Record<MeetingType, string> = {
    strategy: "Strategy Meeting",
    review: "Review Meeting",
    planning: "Planning Meeting",
    professionals: "Professionals Meeting",
    safeguarding_conference: "Safeguarding Conference",
    looked_after_review: "Looked After Review",
    education_review: "Education Review",
  };
  return labels[type];
}

export function getInformationSharingQualityLabel(quality: InformationSharingQuality): string {
  const labels: Record<InformationSharingQuality, string> = {
    timely_comprehensive: "Timely & Comprehensive",
    timely_partial: "Timely but Partial",
    delayed: "Delayed",
    not_shared: "Not Shared",
    not_applicable: "Not Applicable",
  };
  return labels[quality];
}

export function getReferralOutcomeLabel(outcome: ReferralOutcome): string {
  const labels: Record<ReferralOutcome, string> = {
    accepted: "Accepted",
    declined: "Declined",
    waiting: "Waiting",
    completed: "Completed",
    withdrawn: "Withdrawn",
  };
  return labels[outcome];
}

export function getPartnerFeedbackLabel(feedback: PartnerFeedback): string {
  const labels: Record<PartnerFeedback, string> = {
    very_positive: "Very Positive",
    positive: "Positive",
    neutral: "Neutral",
    negative: "Negative",
    very_negative: "Very Negative",
  };
  return labels[feedback];
}
