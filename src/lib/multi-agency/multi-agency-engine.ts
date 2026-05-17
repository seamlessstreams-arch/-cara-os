// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Multi-Agency Working Engine
//
// Deterministic engine for tracking professional network coordination,
// communication quality, meeting attendance, and information sharing
// between the home and external agencies/professionals.
//
// Aligned to:
//   - CHR 2015 Reg 5 — Quality and purpose of care
//   - CHR 2015 Reg 14 — Care planning (multi-agency input)
//   - Working Together to Safeguard Children 2023
//   - SCCIF — Impact of leaders / Partnerships
//   - Children Act 1989/2004 — Duty to cooperate
//
// Key requirements:
//   - Professional network mapped for each child
//   - Regular communication with placing authority SW
//   - Attendance at LAC reviews, PEP meetings, CIN/CP conferences
//   - Timely referrals to CAMHS, education support, health
//   - Information sharing follows agreed protocols
//   - Escalation when agencies fail to respond
//   - Child's views represented at multi-agency meetings
//   - Coordination tracked and evidenced
//   - Outcomes from meetings actioned and followed up
//
// No AI. No external calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ──────────────────────────────────────────────────────────────────

export type AgencyType =
  | "placing_authority"       // LA social worker
  | "camhs"                   // mental health services
  | "education"               // school, virtual school, SENCO
  | "health_gp"              // GP surgery
  | "health_specialist"       // paediatrician, specialist nurse
  | "police"                  // YOT, community police
  | "iro"                     // Independent Reviewing Officer
  | "advocacy"               // children's advocate
  | "legal"                   // solicitor (child's/LA)
  | "family_support"          // family worker, contact supervisor
  | "therapist"              // private/commissioned therapist
  | "youth_offending"         // YOT worker
  | "housing"                 // leaving care housing
  | "immigration"             // UKVI/Home Office (UASC)
  | "other";

export type CommunicationStatus = "active" | "responsive" | "delayed" | "unresponsive" | "escalated";

export type MeetingType =
  | "lac_review"
  | "pep_meeting"
  | "child_protection_conference"
  | "cin_meeting"
  | "strategy_meeting"
  | "professionals_meeting"
  | "camhs_review"
  | "placement_planning"
  | "transition_planning"
  | "other";

export type ReferralStatus = "made" | "accepted" | "waiting_list" | "active" | "discharged" | "rejected" | "escalated";

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface ProfessionalContact {
  id: string;
  childId: string;
  agencyType: AgencyType;
  agencyName: string;
  professionalName: string;
  role: string;
  email?: string;
  phone?: string;
  communicationStatus: CommunicationStatus;
  lastContactDate: string;
  lastContactMethod: string;
  responseTimeDays: number;              // avg days to respond
  keyContact: boolean;                   // primary contact for this agency
  escalationNeeded: boolean;
}

export interface MultiAgencyMeeting {
  id: string;
  childId: string;
  meetingType: MeetingType;
  date: string;
  attendedByHome: boolean;
  homeRepresentative: string;
  childAttended: boolean;
  childViewsSubmitted: boolean;
  agenciesPresent: AgencyType[];
  agenciesAbsent: AgencyType[];
  actionsForHome: number;
  actionsCompleted: number;
  minutesReceived: boolean;
  minutesReceivedDate?: string;
  outcome: string;
}

export interface Referral {
  id: string;
  childId: string;
  agencyType: AgencyType;
  referredTo: string;
  referralDate: string;
  status: ReferralStatus;
  waitingDays: number;
  urgency: "routine" | "urgent" | "emergency";
  escalated: boolean;
  escalationDate?: string;
  outcome?: string;
}

export interface ChildMultiAgencyProfile {
  childId: string;
  childName: string;
  homeId: string;
  placingAuthority: string;
  // Professional network
  professionals: ProfessionalContact[];
  // Meetings
  meetings: MultiAgencyMeeting[];
  // Referrals
  referrals: Referral[];
  // SW Contact
  lastSWVisitDate: string;
  swVisitFrequencyWeeks: number;        // how often SW should visit
  lastSWPhoneContact: string;
  // Child involvement
  childHasAdvocate: boolean;
  childViewsRoutinelyShared: boolean;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface MultiAgencyComplianceResult {
  childId: string;
  childName: string;
  isCompliant: boolean;
  issues: string[];
  warnings: string[];
  // Network
  totalProfessionals: number;
  agencyTypesEngaged: number;
  unresponsiveContacts: number;
  escalationsNeeded: number;
  // Communication
  communicationScore: number;            // 0-100
  averageResponseDays: number;
  swContactCurrent: boolean;
  daysSinceLastSWVisit: number;
  // Meetings
  meetingsAttendedRate: number;          // % home attended
  childViewsSubmittedRate: number;       // % where child views shared
  actionsCompletionRate: number;         // % actions completed
  meetingsLast6Months: number;
  // Referrals
  activeReferrals: number;
  waitingReferrals: number;
  escalatedReferrals: number;
  averageWaitDays: number;
  // Child involvement
  childHasAdvocate: boolean;
  childViewsShared: boolean;
}

export interface HomeMultiAgencyMetrics {
  homeId: string;
  totalChildren: number;
  // Network
  totalProfessionals: number;
  averageAgencyTypes: number;
  totalUnresponsive: number;
  totalEscalations: number;
  // Communication
  averageCommunicationScore: number;
  swContactCurrentRate: number;          // % children with current SW contact
  // Meetings
  averageMeetingAttendance: number;
  averageChildViewsRate: number;
  averageActionsCompletion: number;
  totalMeetingsLast6Months: number;
  // Referrals
  totalActiveReferrals: number;
  totalWaiting: number;
  totalEscalated: number;
  longestWaitDays: number;
  // Compliance
  complianceIssues: string[];
  overallScore: number;
}

// ── Configuration ──────────────────────────────────────────────────────────

const SW_VISIT_OVERDUE_DAYS = 42;         // 6 weeks — most placement plans require monthly
const RESPONSE_TIME_WARNING_DAYS = 7;
const RESPONSE_TIME_ISSUE_DAYS = 14;
const REFERRAL_WAIT_WARNING_DAYS = 28;
const REFERRAL_WAIT_ISSUE_DAYS = 56;

// ── Core: Evaluate Multi-Agency Compliance ──────────────────────────────────

export function evaluateMultiAgencyCompliance(
  profile: ChildMultiAgencyProfile,
  now?: string,
): MultiAgencyComplianceResult {
  const currentTime = now ? new Date(now).getTime() : Date.now();
  const issues: string[] = [];
  const warnings: string[] = [];

  // Network coverage
  const totalProfessionals = profile.professionals.length;
  const agencyTypes = new Set(profile.professionals.map(p => p.agencyType));
  const agencyTypesEngaged = agencyTypes.size;

  if (totalProfessionals === 0) {
    issues.push("No professional network mapped for this child");
  }
  if (!agencyTypes.has("placing_authority")) {
    issues.push("No placing authority social worker in professional network");
  }

  // Unresponsive contacts
  const unresponsiveContacts = profile.professionals.filter(
    p => p.communicationStatus === "unresponsive" || p.communicationStatus === "escalated"
  ).length;
  const escalationsNeeded = profile.professionals.filter(p => p.escalationNeeded).length;

  if (unresponsiveContacts > 0) {
    warnings.push(`${unresponsiveContacts} professional(s) unresponsive or requiring escalation`);
  }

  // Communication score
  const activeContacts = profile.professionals.filter(
    p => p.communicationStatus === "active" || p.communicationStatus === "responsive"
  ).length;
  const communicationScore = totalProfessionals > 0
    ? Math.round((activeContacts / totalProfessionals) * 100)
    : 0;

  // Average response time
  const responseTimes = profile.professionals.map(p => p.responseTimeDays);
  const averageResponseDays = responseTimes.length > 0
    ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
    : 0;

  if (averageResponseDays > RESPONSE_TIME_ISSUE_DAYS) {
    issues.push(`Average professional response time ${averageResponseDays} days — exceeds ${RESPONSE_TIME_ISSUE_DAYS}-day threshold`);
  } else if (averageResponseDays > RESPONSE_TIME_WARNING_DAYS) {
    warnings.push(`Average response time ${averageResponseDays} days — approaching threshold`);
  }

  // SW contact
  const daysSinceLastSWVisit = Math.round(
    (currentTime - new Date(profile.lastSWVisitDate).getTime()) / (24 * 60 * 60 * 1000)
  );
  const swContactCurrent = daysSinceLastSWVisit <= SW_VISIT_OVERDUE_DAYS;

  if (!swContactCurrent) {
    issues.push(`Social worker visit overdue — last visit ${daysSinceLastSWVisit} days ago`);
  }

  // Meetings
  const sixMonthsAgo = currentTime - 183 * 24 * 60 * 60 * 1000;
  const recentMeetings = profile.meetings.filter(
    m => new Date(m.date).getTime() > sixMonthsAgo
  );
  const meetingsLast6Months = recentMeetings.length;

  const attendedMeetings = recentMeetings.filter(m => m.attendedByHome);
  const meetingsAttendedRate = recentMeetings.length > 0
    ? Math.round((attendedMeetings.length / recentMeetings.length) * 100)
    : 100;

  if (meetingsAttendedRate < 90) {
    issues.push(`Home attended only ${meetingsAttendedRate}% of multi-agency meetings`);
  }

  const childViewsMeetings = recentMeetings.filter(m => m.childViewsSubmitted);
  const childViewsSubmittedRate = recentMeetings.length > 0
    ? Math.round((childViewsMeetings.length / recentMeetings.length) * 100)
    : 100;

  if (childViewsSubmittedRate < 80) {
    warnings.push(`Child views shared in only ${childViewsSubmittedRate}% of meetings`);
  }

  // Actions completion
  const totalActions = recentMeetings.reduce((s, m) => s + m.actionsForHome, 0);
  const completedActions = recentMeetings.reduce((s, m) => s + m.actionsCompleted, 0);
  const actionsCompletionRate = totalActions > 0
    ? Math.round((completedActions / totalActions) * 100)
    : 100;

  if (actionsCompletionRate < 80) {
    warnings.push(`Only ${actionsCompletionRate}% of multi-agency actions completed`);
  }

  // Referrals
  const activeReferrals = profile.referrals.filter(
    r => r.status === "made" || r.status === "accepted" || r.status === "waiting_list" || r.status === "active"
  ).length;
  const waitingReferrals = profile.referrals.filter(r => r.status === "waiting_list").length;
  const escalatedReferrals = profile.referrals.filter(r => r.escalated).length;

  const waitingDays = profile.referrals
    .filter(r => r.status === "waiting_list")
    .map(r => r.waitingDays);
  const averageWaitDays = waitingDays.length > 0
    ? Math.round(waitingDays.reduce((a, b) => a + b, 0) / waitingDays.length)
    : 0;

  if (averageWaitDays > REFERRAL_WAIT_ISSUE_DAYS) {
    issues.push(`Average referral wait ${averageWaitDays} days — escalation may be needed`);
  } else if (averageWaitDays > REFERRAL_WAIT_WARNING_DAYS) {
    warnings.push(`Average referral wait ${averageWaitDays} days — monitor closely`);
  }

  // Child involvement
  if (!profile.childHasAdvocate) {
    warnings.push("Child does not have an independent advocate");
  }
  if (!profile.childViewsRoutinelyShared) {
    warnings.push("Child views not routinely shared at multi-agency meetings");
  }

  return {
    childId: profile.childId,
    childName: profile.childName,
    isCompliant: issues.length === 0,
    issues,
    warnings,
    totalProfessionals,
    agencyTypesEngaged,
    unresponsiveContacts,
    escalationsNeeded,
    communicationScore,
    averageResponseDays,
    swContactCurrent,
    daysSinceLastSWVisit,
    meetingsAttendedRate,
    childViewsSubmittedRate,
    actionsCompletionRate,
    meetingsLast6Months,
    activeReferrals,
    waitingReferrals,
    escalatedReferrals,
    averageWaitDays,
    childHasAdvocate: profile.childHasAdvocate,
    childViewsShared: profile.childViewsRoutinelyShared,
  };
}

// ── Core: Calculate Home Multi-Agency Metrics ─────────────────────────────

export function calculateHomeMultiAgencyMetrics(
  profiles: ChildMultiAgencyProfile[],
  homeId: string,
  now?: string,
): HomeMultiAgencyMetrics {
  const homeProfiles = profiles.filter(p => p.homeId === homeId);
  const totalChildren = homeProfiles.length;

  if (totalChildren === 0) {
    return {
      homeId,
      totalChildren: 0,
      totalProfessionals: 0,
      averageAgencyTypes: 0,
      totalUnresponsive: 0,
      totalEscalations: 0,
      averageCommunicationScore: 0,
      swContactCurrentRate: 0,
      averageMeetingAttendance: 0,
      averageChildViewsRate: 0,
      averageActionsCompletion: 0,
      totalMeetingsLast6Months: 0,
      totalActiveReferrals: 0,
      totalWaiting: 0,
      totalEscalated: 0,
      longestWaitDays: 0,
      complianceIssues: [],
      overallScore: 0,
    };
  }

  const results = homeProfiles.map(p => evaluateMultiAgencyCompliance(p, now));

  const totalProfessionals = results.reduce((s, r) => s + r.totalProfessionals, 0);
  const averageAgencyTypes = Math.round(
    results.reduce((s, r) => s + r.agencyTypesEngaged, 0) / results.length
  );
  const totalUnresponsive = results.reduce((s, r) => s + r.unresponsiveContacts, 0);
  const totalEscalations = results.reduce((s, r) => s + r.escalationsNeeded, 0);

  const averageCommunicationScore = Math.round(
    results.reduce((s, r) => s + r.communicationScore, 0) / results.length
  );
  const swContactCurrentRate = Math.round(
    (results.filter(r => r.swContactCurrent).length / results.length) * 100
  );

  const averageMeetingAttendance = Math.round(
    results.reduce((s, r) => s + r.meetingsAttendedRate, 0) / results.length
  );
  const averageChildViewsRate = Math.round(
    results.reduce((s, r) => s + r.childViewsSubmittedRate, 0) / results.length
  );
  const averageActionsCompletion = Math.round(
    results.reduce((s, r) => s + r.actionsCompletionRate, 0) / results.length
  );
  const totalMeetingsLast6Months = results.reduce((s, r) => s + r.meetingsLast6Months, 0);

  const totalActiveReferrals = results.reduce((s, r) => s + r.activeReferrals, 0);
  const totalWaiting = results.reduce((s, r) => s + r.waitingReferrals, 0);
  const totalEscalated = results.reduce((s, r) => s + r.escalatedReferrals, 0);
  const allWaitDays = homeProfiles.flatMap(p => p.referrals.filter(r => r.status === "waiting_list").map(r => r.waitingDays));
  const longestWaitDays = allWaitDays.length > 0 ? Math.max(...allWaitDays) : 0;

  const complianceIssues = [...new Set(results.flatMap(r => r.issues))];

  // Overall score
  const commScore = averageCommunicationScore;
  const meetingScore = averageMeetingAttendance;
  const actionScore = averageActionsCompletion;
  const swScore = swContactCurrentRate;
  const overallScore = Math.round(
    (commScore * 0.25) + (meetingScore * 0.25) + (actionScore * 0.25) + (swScore * 0.25)
  );

  return {
    homeId,
    totalChildren,
    totalProfessionals,
    averageAgencyTypes,
    totalUnresponsive,
    totalEscalations,
    averageCommunicationScore,
    swContactCurrentRate,
    averageMeetingAttendance,
    averageChildViewsRate,
    averageActionsCompletion,
    totalMeetingsLast6Months,
    totalActiveReferrals,
    totalWaiting,
    totalEscalated,
    longestWaitDays,
    complianceIssues,
    overallScore,
  };
}

// ── Label Helpers ────────────────────────────────────────────────────────

export function getAgencyTypeLabel(type: AgencyType): string {
  const labels: Record<AgencyType, string> = {
    placing_authority: "Placing Authority (SW)",
    camhs: "CAMHS",
    education: "Education",
    health_gp: "GP",
    health_specialist: "Health Specialist",
    police: "Police/YOT",
    iro: "IRO",
    advocacy: "Advocate",
    legal: "Legal",
    family_support: "Family Support",
    therapist: "Therapist",
    youth_offending: "Youth Offending",
    housing: "Housing",
    immigration: "Immigration",
    other: "Other",
  };
  return labels[type] ?? type;
}

export function getMeetingTypeLabel(type: MeetingType): string {
  const labels: Record<MeetingType, string> = {
    lac_review: "LAC Review",
    pep_meeting: "PEP Meeting",
    child_protection_conference: "CP Conference",
    cin_meeting: "CIN Meeting",
    strategy_meeting: "Strategy Meeting",
    professionals_meeting: "Professionals Meeting",
    camhs_review: "CAMHS Review",
    placement_planning: "Placement Planning",
    transition_planning: "Transition Planning",
    other: "Other",
  };
  return labels[type] ?? type;
}
