// ══════════════════════════════════════════════════════════════════════════════
// MULTI-AGENCY EFFECTIVENESS INTELLIGENCE ENGINE
//
// Deterministic engine for measuring the effectiveness of multi-agency
// working: meetings, information sharing, joint decision-making quality,
// professional relationship quality, and escalation management.
//
// This module is distinct from the multi-agency directory module which
// tracks contacts and partners. This module measures how WELL agencies
// work together and the IMPACT on children's outcomes.
//
// Regulatory basis:
//   - CHR 2015 Reg 5  — Engaging with the local authority
//   - CHR 2015 Reg 14 — Care planning (multi-agency input)
//   - Working Together to Safeguard Children 2023
//   - Children Act 2004, Section 11 — Duty to cooperate
//   - SCCIF — Impact of leaders & managers / Partnership working
//
// No AI. No external calls. Pure input -> output.
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ──────────────────────────────────────────────────────────────────

export type AgencyType =
  | "social_worker"
  | "CAMHS"
  | "education"
  | "health_visitor"
  | "police"
  | "YOT"
  | "LADO"
  | "IRO"
  | "therapist"
  | "substance_misuse"
  | "housing"
  | "other";

export type MeetingType =
  | "strategy"
  | "CIN"
  | "LAC_review"
  | "PEP"
  | "health_review"
  | "professionals"
  | "discharge_planning"
  | "risk_management"
  | "other";

export type MeetingOutcome =
  | "all_actions_agreed"
  | "partial_agreement"
  | "deferred"
  | "escalated";

export type InformationSharingQuality =
  | "timely_complete"
  | "timely_incomplete"
  | "delayed_complete"
  | "delayed_incomplete"
  | "not_shared";

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface MultiAgencyMeeting {
  id: string;
  childId: string;
  childName: string;
  date: string;
  meetingType: MeetingType;
  chairedBy: string;
  agenciesInvited: AgencyType[];
  agenciesAttended: AgencyType[];
  childParticipated: boolean;
  parentParticipated: boolean;
  homeStaffAttended: boolean;
  outcome: MeetingOutcome;
  actionsAgreed: number;
  actionsCompleted: number;
  minutesCirculated: boolean;
  minutesTimely: boolean;
}

export interface InformationSharingRecord {
  id: string;
  childId: string;
  childName: string;
  date: string;
  fromAgency: AgencyType;
  toAgency: AgencyType;
  informationType: string;
  quality: InformationSharingQuality;
  impactOnCare?: string;
}

export interface ProfessionalRelationship {
  id: string;
  agencyType: AgencyType;
  contactName: string;
  relationship: "strong" | "adequate" | "developing" | "poor";
  lastContact: string;
  responsiveness: "excellent" | "good" | "adequate" | "poor";
  jointWorkingQuality?: string;
}

export interface Escalation {
  id: string;
  childId: string;
  childName: string;
  date: string;
  escalatedTo: AgencyType;
  reason: string;
  responseReceived: boolean;
  responseTimelyDays?: number;
  outcomeAchieved: boolean;
  resolution?: string;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface MeetingEffectivenessResult {
  totalMeetings: number;
  overallAttendanceRate: number;
  agencyAttendanceRate: number;
  childParticipationRate: number;
  parentParticipationRate: number;
  homeStaffAttendanceRate: number;
  actionCompletionRate: number;
  minutesCirculationRate: number;
  minutesTimelinessRate: number;
  outcomeBreakdown: Record<MeetingOutcome, number>;
  meetingTypeBreakdown: Record<MeetingType, number>;
}

export interface InformationSharingResult {
  totalRecords: number;
  timelinessRate: number;
  completenessRate: number;
  qualityDistribution: Record<InformationSharingQuality, number>;
  perAgencyAnalysis: {
    agency: AgencyType;
    totalRecords: number;
    timelinessRate: number;
    completenessRate: number;
  }[];
}

export interface ProfessionalRelationshipResult {
  totalRelationships: number;
  strongCount: number;
  adequateCount: number;
  developingCount: number;
  poorCount: number;
  responsivenessBreakdown: Record<string, number>;
  coverageOfKeyAgencies: {
    agency: AgencyType;
    covered: boolean;
    quality?: string;
  }[];
}

export interface EscalationManagementResult {
  totalEscalations: number;
  responseRate: number;
  timelinessRate: number;
  outcomeAchievementRate: number;
  averageResponseDays: number;
  perAgencyBreakdown: {
    agency: AgencyType;
    count: number;
    responseRate: number;
    outcomeRate: number;
  }[];
}

export interface ChildMultiAgencyProfile {
  childId: string;
  childName: string;
  meetingCount: number;
  meetingTypes: MeetingType[];
  agenciesInvolved: AgencyType[];
  informationSharingQuality: number;
  escalationCount: number;
  escalationsResolved: number;
  overallEngagement: "strong" | "adequate" | "limited" | "poor";
}

export interface MultiAgencyEffectivenessIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: "outstanding" | "good" | "requires_improvement" | "inadequate";
  meetingEffectiveness: MeetingEffectivenessResult;
  informationSharing: InformationSharingResult;
  professionalRelationships: ProfessionalRelationshipResult;
  escalationManagement: EscalationManagementResult;
  childProfiles: ChildMultiAgencyProfile[];
  scoring: {
    meetingScore: number;
    informationSharingScore: number;
    relationshipScore: number;
    escalationScore: number;
  };
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Key agency list (for coverage check) ──────────────────────────────────

const KEY_AGENCIES: AgencyType[] = [
  "social_worker",
  "CAMHS",
  "education",
  "health_visitor",
  "IRO",
];

// ── Helper: clamp to 0..100 ───────────────────────────────────────────────

function clamp0100(n: number): number {
  return Math.max(0, Math.min(100, n));
}

// ── Helper: round to 1 decimal ────────────────────────────────────────────

function r1(n: number): number {
  return Math.round(n * 10) / 10;
}

// ══════════════════════════════════════════════════════════════════════════════
// 1. evaluateMeetingEffectiveness
// ══════════════════════════════════════════════════════════════════════════════

export function evaluateMeetingEffectiveness(
  meetings: MultiAgencyMeeting[],
): MeetingEffectivenessResult {
  if (meetings.length === 0) {
    return {
      totalMeetings: 0,
      overallAttendanceRate: 0,
      agencyAttendanceRate: 0,
      childParticipationRate: 0,
      parentParticipationRate: 0,
      homeStaffAttendanceRate: 0,
      actionCompletionRate: 0,
      minutesCirculationRate: 0,
      minutesTimelinessRate: 0,
      outcomeBreakdown: {
        all_actions_agreed: 0,
        partial_agreement: 0,
        deferred: 0,
        escalated: 0,
      },
      meetingTypeBreakdown: {
        strategy: 0,
        CIN: 0,
        LAC_review: 0,
        PEP: 0,
        health_review: 0,
        professionals: 0,
        discharge_planning: 0,
        risk_management: 0,
        other: 0,
      },
    };
  }

  const total = meetings.length;

  // Agency attendance rate: attended / invited across all meetings
  let totalInvited = 0;
  let totalAttended = 0;
  for (const m of meetings) {
    totalInvited += m.agenciesInvited.length;
    totalAttended += m.agenciesAttended.length;
  }
  const agencyAttendanceRate = totalInvited > 0
    ? r1((totalAttended / totalInvited) * 100)
    : 0;

  // Overall attendance: agencies that attended at least (same metric, kept as alias)
  const overallAttendanceRate = agencyAttendanceRate;

  // Child participation
  const childParticipationRate = r1(
    (meetings.filter((m) => m.childParticipated).length / total) * 100,
  );

  // Parent participation
  const parentParticipationRate = r1(
    (meetings.filter((m) => m.parentParticipated).length / total) * 100,
  );

  // Home staff attendance
  const homeStaffAttendanceRate = r1(
    (meetings.filter((m) => m.homeStaffAttended).length / total) * 100,
  );

  // Action completion
  let totalActions = 0;
  let totalCompleted = 0;
  for (const m of meetings) {
    totalActions += m.actionsAgreed;
    totalCompleted += m.actionsCompleted;
  }
  const actionCompletionRate = totalActions > 0
    ? r1((totalCompleted / totalActions) * 100)
    : 0;

  // Minutes
  const minutesCirculationRate = r1(
    (meetings.filter((m) => m.minutesCirculated).length / total) * 100,
  );
  const circulatedMeetings = meetings.filter((m) => m.minutesCirculated);
  const minutesTimelinessRate = circulatedMeetings.length > 0
    ? r1(
        (circulatedMeetings.filter((m) => m.minutesTimely).length /
          circulatedMeetings.length) *
          100,
      )
    : 0;

  // Outcome breakdown
  const outcomeBreakdown: Record<MeetingOutcome, number> = {
    all_actions_agreed: 0,
    partial_agreement: 0,
    deferred: 0,
    escalated: 0,
  };
  for (const m of meetings) {
    outcomeBreakdown[m.outcome]++;
  }

  // Meeting type breakdown
  const meetingTypeBreakdown: Record<MeetingType, number> = {
    strategy: 0,
    CIN: 0,
    LAC_review: 0,
    PEP: 0,
    health_review: 0,
    professionals: 0,
    discharge_planning: 0,
    risk_management: 0,
    other: 0,
  };
  for (const m of meetings) {
    meetingTypeBreakdown[m.meetingType]++;
  }

  return {
    totalMeetings: total,
    overallAttendanceRate,
    agencyAttendanceRate,
    childParticipationRate,
    parentParticipationRate,
    homeStaffAttendanceRate,
    actionCompletionRate,
    minutesCirculationRate,
    minutesTimelinessRate,
    outcomeBreakdown,
    meetingTypeBreakdown,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// 2. evaluateInformationSharing
// ══════════════════════════════════════════════════════════════════════════════

export function evaluateInformationSharing(
  records: InformationSharingRecord[],
): InformationSharingResult {
  if (records.length === 0) {
    return {
      totalRecords: 0,
      timelinessRate: 0,
      completenessRate: 0,
      qualityDistribution: {
        timely_complete: 0,
        timely_incomplete: 0,
        delayed_complete: 0,
        delayed_incomplete: 0,
        not_shared: 0,
      },
      perAgencyAnalysis: [],
    };
  }

  const total = records.length;

  // Timeliness: timely_complete or timely_incomplete
  const timelyCount = records.filter(
    (r) =>
      r.quality === "timely_complete" || r.quality === "timely_incomplete",
  ).length;
  const timelinessRate = r1((timelyCount / total) * 100);

  // Completeness: timely_complete or delayed_complete
  const completeCount = records.filter(
    (r) =>
      r.quality === "timely_complete" || r.quality === "delayed_complete",
  ).length;
  const completenessRate = r1((completeCount / total) * 100);

  // Quality distribution
  const qualityDistribution: Record<InformationSharingQuality, number> = {
    timely_complete: 0,
    timely_incomplete: 0,
    delayed_complete: 0,
    delayed_incomplete: 0,
    not_shared: 0,
  };
  for (const r of records) {
    qualityDistribution[r.quality]++;
  }

  // Per-agency analysis: group by fromAgency
  const agencyMap = new Map<
    AgencyType,
    { total: number; timely: number; complete: number }
  >();
  for (const r of records) {
    const key = r.fromAgency;
    if (!agencyMap.has(key)) {
      agencyMap.set(key, { total: 0, timely: 0, complete: 0 });
    }
    const entry = agencyMap.get(key)!;
    entry.total++;
    if (
      r.quality === "timely_complete" ||
      r.quality === "timely_incomplete"
    ) {
      entry.timely++;
    }
    if (
      r.quality === "timely_complete" ||
      r.quality === "delayed_complete"
    ) {
      entry.complete++;
    }
  }

  const perAgencyAnalysis = Array.from(agencyMap.entries()).map(
    ([agency, stats]) => ({
      agency,
      totalRecords: stats.total,
      timelinessRate: r1((stats.timely / stats.total) * 100),
      completenessRate: r1((stats.complete / stats.total) * 100),
    }),
  );

  return {
    totalRecords: total,
    timelinessRate,
    completenessRate,
    qualityDistribution,
    perAgencyAnalysis,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// 3. evaluateProfessionalRelationships
// ══════════════════════════════════════════════════════════════════════════════

export function evaluateProfessionalRelationships(
  relationships: ProfessionalRelationship[],
): ProfessionalRelationshipResult {
  if (relationships.length === 0) {
    return {
      totalRelationships: 0,
      strongCount: 0,
      adequateCount: 0,
      developingCount: 0,
      poorCount: 0,
      responsivenessBreakdown: {
        excellent: 0,
        good: 0,
        adequate: 0,
        poor: 0,
      },
      coverageOfKeyAgencies: KEY_AGENCIES.map((a) => ({
        agency: a,
        covered: false,
      })),
    };
  }

  const total = relationships.length;
  let strongCount = 0;
  let adequateCount = 0;
  let developingCount = 0;
  let poorCount = 0;

  const responsivenessBreakdown: Record<string, number> = {
    excellent: 0,
    good: 0,
    adequate: 0,
    poor: 0,
  };

  for (const rel of relationships) {
    switch (rel.relationship) {
      case "strong":
        strongCount++;
        break;
      case "adequate":
        adequateCount++;
        break;
      case "developing":
        developingCount++;
        break;
      case "poor":
        poorCount++;
        break;
    }
    responsivenessBreakdown[rel.responsiveness]++;
  }

  // Key agency coverage
  const agencyTypeSet = new Set(relationships.map((r) => r.agencyType));
  const coverageOfKeyAgencies = KEY_AGENCIES.map((agency) => {
    const rel = relationships.find((r) => r.agencyType === agency);
    return {
      agency,
      covered: agencyTypeSet.has(agency),
      quality: rel?.relationship,
    };
  });

  return {
    totalRelationships: total,
    strongCount,
    adequateCount,
    developingCount,
    poorCount,
    responsivenessBreakdown,
    coverageOfKeyAgencies,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// 4. evaluateEscalations
// ══════════════════════════════════════════════════════════════════════════════

export function evaluateEscalations(
  escalations: Escalation[],
): EscalationManagementResult {
  if (escalations.length === 0) {
    return {
      totalEscalations: 0,
      responseRate: 0,
      timelinessRate: 0,
      outcomeAchievementRate: 0,
      averageResponseDays: 0,
      perAgencyBreakdown: [],
    };
  }

  const total = escalations.length;

  // Response rate
  const responseCount = escalations.filter((e) => e.responseReceived).length;
  const responseRate = r1((responseCount / total) * 100);

  // Timeliness: response received AND responseTimelyDays <= 5
  const responded = escalations.filter((e) => e.responseReceived);
  const timelyCount = responded.filter(
    (e) => e.responseTimelyDays !== undefined && e.responseTimelyDays <= 5,
  ).length;
  const timelinessRate =
    responded.length > 0 ? r1((timelyCount / responded.length) * 100) : 0;

  // Outcome achievement
  const outcomeCount = escalations.filter((e) => e.outcomeAchieved).length;
  const outcomeAchievementRate = r1((outcomeCount / total) * 100);

  // Average response days (only for those that responded with a recorded time)
  const withDays = escalations.filter(
    (e) => e.responseReceived && e.responseTimelyDays !== undefined,
  );
  const averageResponseDays =
    withDays.length > 0
      ? r1(
          withDays.reduce((sum, e) => sum + (e.responseTimelyDays ?? 0), 0) /
            withDays.length,
        )
      : 0;

  // Per-agency breakdown
  const agencyMap = new Map<
    AgencyType,
    { count: number; responded: number; outcomeAchieved: number }
  >();
  for (const e of escalations) {
    if (!agencyMap.has(e.escalatedTo)) {
      agencyMap.set(e.escalatedTo, {
        count: 0,
        responded: 0,
        outcomeAchieved: 0,
      });
    }
    const entry = agencyMap.get(e.escalatedTo)!;
    entry.count++;
    if (e.responseReceived) entry.responded++;
    if (e.outcomeAchieved) entry.outcomeAchieved++;
  }

  const perAgencyBreakdown = Array.from(agencyMap.entries()).map(
    ([agency, stats]) => ({
      agency,
      count: stats.count,
      responseRate: r1((stats.responded / stats.count) * 100),
      outcomeRate: r1((stats.outcomeAchieved / stats.count) * 100),
    }),
  );

  return {
    totalEscalations: total,
    responseRate,
    timelinessRate,
    outcomeAchievementRate,
    averageResponseDays,
    perAgencyBreakdown,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// 5. buildChildMultiAgencyProfile
// ══════════════════════════════════════════════════════════════════════════════

export function buildChildMultiAgencyProfile(
  meetings: MultiAgencyMeeting[],
  sharing: InformationSharingRecord[],
  escalations: Escalation[],
  childIds: string[],
): ChildMultiAgencyProfile[] {
  return childIds.map((childId) => {
    const childMeetings = meetings.filter((m) => m.childId === childId);
    const childSharing = sharing.filter((s) => s.childId === childId);
    const childEscalations = escalations.filter((e) => e.childId === childId);

    // Derive child name from any matching record
    const childName =
      childMeetings[0]?.childName ??
      childSharing[0]?.childName ??
      childEscalations[0]?.childName ??
      childId;

    // Meeting types involved
    const meetingTypes = Array.from(
      new Set(childMeetings.map((m) => m.meetingType)),
    );

    // Agencies involved (from meetings + sharing)
    const agencySet = new Set<AgencyType>();
    for (const m of childMeetings) {
      for (const a of m.agenciesAttended) {
        agencySet.add(a);
      }
    }
    for (const s of childSharing) {
      agencySet.add(s.fromAgency);
      agencySet.add(s.toAgency);
    }
    for (const e of childEscalations) {
      agencySet.add(e.escalatedTo);
    }
    const agenciesInvolved = Array.from(agencySet);

    // Info sharing quality score (0-100)
    let informationSharingQuality = 0;
    if (childSharing.length > 0) {
      const qualityScoreMap: Record<InformationSharingQuality, number> = {
        timely_complete: 100,
        timely_incomplete: 60,
        delayed_complete: 50,
        delayed_incomplete: 25,
        not_shared: 0,
      };
      const totalQuality = childSharing.reduce(
        (sum, s) => sum + qualityScoreMap[s.quality],
        0,
      );
      informationSharingQuality = r1(totalQuality / childSharing.length);
    }

    // Escalation resolution
    const escalationsResolved = childEscalations.filter(
      (e) => e.outcomeAchieved,
    ).length;

    // Overall engagement rating
    let overallEngagement: ChildMultiAgencyProfile["overallEngagement"];
    const factors = [
      childMeetings.length >= 3 ? 1 : childMeetings.length >= 1 ? 0.5 : 0,
      agenciesInvolved.length >= 4
        ? 1
        : agenciesInvolved.length >= 2
          ? 0.5
          : 0,
      informationSharingQuality >= 70
        ? 1
        : informationSharingQuality >= 40
          ? 0.5
          : 0,
      childEscalations.length === 0
        ? 1
        : escalationsResolved === childEscalations.length
          ? 0.8
          : 0.3,
    ];
    const engagementScore =
      factors.reduce((a, b) => a + b, 0) / factors.length;
    if (engagementScore >= 0.8) overallEngagement = "strong";
    else if (engagementScore >= 0.55) overallEngagement = "adequate";
    else if (engagementScore >= 0.3) overallEngagement = "limited";
    else overallEngagement = "poor";

    return {
      childId,
      childName,
      meetingCount: childMeetings.length,
      meetingTypes,
      agenciesInvolved,
      informationSharingQuality,
      escalationCount: childEscalations.length,
      escalationsResolved,
      overallEngagement,
    };
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// 6. generateMultiAgencyEffectivenessIntelligence — Full report
// ══════════════════════════════════════════════════════════════════════════════

export function generateMultiAgencyEffectivenessIntelligence(
  meetings: MultiAgencyMeeting[],
  sharing: InformationSharingRecord[],
  relationships: ProfessionalRelationship[],
  escalations: Escalation[],
  childIds: string[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
  _referenceDate?: string,
): MultiAgencyEffectivenessIntelligence {
  // Evaluate each domain
  const meetingEffectiveness = evaluateMeetingEffectiveness(meetings);
  const informationSharingResult = evaluateInformationSharing(sharing);
  const professionalRelationships =
    evaluateProfessionalRelationships(relationships);
  const escalationManagement = evaluateEscalations(escalations);
  const childProfiles = buildChildMultiAgencyProfile(
    meetings,
    sharing,
    escalations,
    childIds,
  );

  // ── Scoring ────────────────────────────────────────────────────────────

  // Meeting effectiveness: 30 points
  // 10 for attendance, 10 for participation, 10 for action completion
  const attendanceScore =
    (meetingEffectiveness.agencyAttendanceRate / 100) * 10;
  const participationAvg =
    (meetingEffectiveness.childParticipationRate +
      meetingEffectiveness.parentParticipationRate +
      meetingEffectiveness.homeStaffAttendanceRate) /
    3;
  const participationScore = (participationAvg / 100) * 10;
  const actionScore =
    (meetingEffectiveness.actionCompletionRate / 100) * 10;
  const meetingScore = r1(
    clamp0100(
      ((attendanceScore + participationScore + actionScore) / 30) * 100,
    ) *
      0.3,
  );

  // Information sharing: 25 points
  // 10 for timeliness, 8 for completeness, 7 for quality (% timely_complete)
  const timelinessScore =
    (informationSharingResult.timelinessRate / 100) * 10;
  const completenessScore =
    (informationSharingResult.completenessRate / 100) * 8;
  const topQualityRate =
    informationSharingResult.totalRecords > 0
      ? (informationSharingResult.qualityDistribution.timely_complete /
          informationSharingResult.totalRecords) *
        100
      : 0;
  const qualityScore = (topQualityRate / 100) * 7;
  const informationSharingScore = r1(
    clamp0100(
      ((timelinessScore + completenessScore + qualityScore) / 25) * 100,
    ) *
      0.25,
  );

  // Professional relationships: 20 points
  // 8 for quality, 6 for responsiveness, 6 for coverage
  const relTotal = professionalRelationships.totalRelationships;
  const qualityBreakdownScore =
    relTotal > 0
      ? ((professionalRelationships.strongCount * 100 +
          professionalRelationships.adequateCount * 70 +
          professionalRelationships.developingCount * 40 +
          professionalRelationships.poorCount * 10) /
          relTotal /
          100) *
        8
      : 0;
  const responsivenessTotal =
    (professionalRelationships.responsivenessBreakdown["excellent"] ?? 0) +
    (professionalRelationships.responsivenessBreakdown["good"] ?? 0) +
    (professionalRelationships.responsivenessBreakdown["adequate"] ?? 0) +
    (professionalRelationships.responsivenessBreakdown["poor"] ?? 0);
  const responsivenessAvg =
    responsivenessTotal > 0
      ? ((professionalRelationships.responsivenessBreakdown["excellent"] ??
          0) *
          100 +
          (professionalRelationships.responsivenessBreakdown["good"] ?? 0) *
            75 +
          (professionalRelationships.responsivenessBreakdown["adequate"] ??
            0) *
            50 +
          (professionalRelationships.responsivenessBreakdown["poor"] ?? 0) *
            20) /
        responsivenessTotal
      : 0;
  const responsivenessScore = (responsivenessAvg / 100) * 6;
  const coveredCount = professionalRelationships.coverageOfKeyAgencies.filter(
    (c) => c.covered,
  ).length;
  const coverageRate =
    KEY_AGENCIES.length > 0
      ? (coveredCount / KEY_AGENCIES.length) * 100
      : 0;
  const coverageScore = (coverageRate / 100) * 6;
  const relationshipScore = r1(
    clamp0100(
      ((qualityBreakdownScore + responsivenessScore + coverageScore) / 20) *
        100,
    ) *
      0.2,
  );

  // Escalation management: 25 points
  // 10 for response, 8 for timeliness, 7 for outcomes
  const escResponseScore =
    (escalationManagement.responseRate / 100) * 10;
  const escTimelinessScore =
    (escalationManagement.timelinessRate / 100) * 8;
  const escOutcomeScore =
    (escalationManagement.outcomeAchievementRate / 100) * 7;
  const escalationScore = r1(
    clamp0100(
      ((escResponseScore + escTimelinessScore + escOutcomeScore) / 25) * 100,
    ) *
      0.25,
  );

  const overallScore = r1(
    meetingScore + informationSharingScore + relationshipScore + escalationScore,
  );

  // ── Rating ─────────────────────────────────────────────────────────────

  let rating: MultiAgencyEffectivenessIntelligence["rating"];
  if (overallScore >= 80) rating = "outstanding";
  else if (overallScore >= 60) rating = "good";
  else if (overallScore >= 40) rating = "requires_improvement";
  else rating = "inadequate";

  // ── Strengths ──────────────────────────────────────────────────────────

  const strengths: string[] = [];
  if (meetingEffectiveness.agencyAttendanceRate >= 80) {
    strengths.push(
      "Strong multi-agency attendance at meetings demonstrates effective partnership working",
    );
  }
  if (meetingEffectiveness.childParticipationRate >= 70) {
    strengths.push(
      "Children's voices are well represented in multi-agency meetings",
    );
  }
  if (meetingEffectiveness.actionCompletionRate >= 80) {
    strengths.push(
      "Agreed actions from multi-agency meetings are consistently completed",
    );
  }
  if (informationSharingResult.timelinessRate >= 80) {
    strengths.push(
      "Information is shared in a timely manner between agencies, supporting effective care",
    );
  }
  if (
    professionalRelationships.strongCount >
    professionalRelationships.totalRelationships / 2
  ) {
    strengths.push(
      "Majority of professional relationships are strong, enabling responsive joint working",
    );
  }
  if (escalationManagement.responseRate >= 90) {
    strengths.push(
      "Escalations receive a high response rate from partner agencies",
    );
  }
  if (escalationManagement.outcomeAchievementRate >= 80) {
    strengths.push(
      "Escalation processes are effective in achieving desired outcomes for children",
    );
  }
  if (coverageRate >= 80) {
    strengths.push(
      "Good coverage of key agencies ensures comprehensive support for children",
    );
  }

  // ── Areas for Improvement ──────────────────────────────────────────────

  const areasForImprovement: string[] = [];
  if (meetingEffectiveness.agencyAttendanceRate < 70) {
    areasForImprovement.push(
      "Agency attendance at multi-agency meetings needs improvement to ensure effective coordination",
    );
  }
  if (meetingEffectiveness.childParticipationRate < 50) {
    areasForImprovement.push(
      "Children's participation in multi-agency meetings should be increased (Reg 7 — child's wishes)",
    );
  }
  if (meetingEffectiveness.actionCompletionRate < 70) {
    areasForImprovement.push(
      "Action completion from multi-agency meetings is below expected standard",
    );
  }
  if (informationSharingResult.timelinessRate < 70) {
    areasForImprovement.push(
      "Timeliness of information sharing between agencies requires improvement",
    );
  }
  if (informationSharingResult.completenessRate < 70) {
    areasForImprovement.push(
      "Completeness of shared information needs strengthening to support holistic care planning",
    );
  }
  if (professionalRelationships.poorCount > 0) {
    areasForImprovement.push(
      "Some professional relationships are rated poor and require active development",
    );
  }
  if (escalationManagement.responseRate < 80) {
    areasForImprovement.push(
      "Response rate to escalations from partner agencies is below acceptable level",
    );
  }
  if (escalationManagement.outcomeAchievementRate < 70) {
    areasForImprovement.push(
      "Escalation outcomes are not consistently achieved, risking children's welfare",
    );
  }
  if (coverageRate < 60) {
    areasForImprovement.push(
      "Coverage of key agencies is insufficient — gaps may leave children without needed support",
    );
  }

  // ── Actions ────────────────────────────────────────────────────────────

  const actions: string[] = [];
  if (meetingEffectiveness.agencyAttendanceRate < 70) {
    actions.push(
      "Implement a multi-agency attendance protocol with escalation for non-attendance",
    );
  }
  if (meetingEffectiveness.childParticipationRate < 50) {
    actions.push(
      "Develop age-appropriate mechanisms for children to contribute to meetings (e.g. views forms, advocates)",
    );
  }
  if (meetingEffectiveness.actionCompletionRate < 70) {
    actions.push(
      "Introduce an action tracker with named owners and review dates for each meeting",
    );
  }
  if (informationSharingResult.timelinessRate < 70) {
    actions.push(
      "Establish information-sharing agreements with timescales for each agency type",
    );
  }
  if (professionalRelationships.poorCount > 0) {
    actions.push(
      "Schedule relationship-building sessions with agencies rated as poor",
    );
  }
  if (escalationManagement.responseRate < 80) {
    actions.push(
      "Review escalation pathways and engage senior managers where response rates are low",
    );
  }
  if (coverageRate < 60) {
    actions.push(
      "Map missing agency relationships and proactively establish contacts for key services",
    );
  }

  // ── Regulatory Links ───────────────────────────────────────────────────

  const regulatoryLinks: string[] = [
    "CHR 2015 Reg 5 — Engaging with the local authority and relevant persons",
    "CHR 2015 Reg 14 — Care planning: multi-agency input to placement plans",
    "Working Together to Safeguard Children 2023 — Multi-agency safeguarding arrangements",
    "Children Act 2004 Section 11 — Duty to cooperate to improve well-being",
    "SCCIF — Leaders and managers: effectiveness of partnership working",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    meetingEffectiveness,
    informationSharing: informationSharingResult,
    professionalRelationships,
    escalationManagement,
    childProfiles,
    scoring: {
      meetingScore: r1(meetingScore),
      informationSharingScore: r1(informationSharingScore),
      relationshipScore: r1(relationshipScore),
      escalationScore: r1(escalationScore),
    },
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
