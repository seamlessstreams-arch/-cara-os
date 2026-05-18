// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Handover & Communication Quality Intelligence Engine
//
// Pure deterministic engine — no AI, no external calls.
// Evaluates shift handovers, team communication, information sharing and
// information governance within a children's residential home.
//
// Maps to: CHR 2015 Reg 22, CHR 2015 Reg 24, SCCIF, NMS 19,
// Data Protection Act 2018 / UK GDPR, Working Together 2023, CA 1989 s22(3)(a)
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ────────────────────────────────────────────────────────────────────

export type HandoverType =
  | "shift_handover"
  | "on_call_handover"
  | "management_handover"
  | "emergency_handover"
  | "annual_leave_handover";

export type HandoverFormat =
  | "face_to_face"
  | "written_only"
  | "verbal_only"
  | "digital_record"
  | "combined";

export type CommunicationChannel =
  | "team_meeting"
  | "email"
  | "daily_log"
  | "handover_book"
  | "staff_message_board"
  | "phone"
  | "digital_system";

export type InformationPriority = "critical" | "high" | "medium" | "low";

export type CompletionQuality =
  | "thorough"
  | "adequate"
  | "incomplete"
  | "not_completed";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// ── Input Interfaces ────────────────────────────────────────────────────────

export interface HandoverRecord {
  id: string;
  date: string;
  handoverType: HandoverType;
  format: HandoverFormat;
  outgoingStaff: string;
  incomingStaff: string;
  childUpdatesIncluded: boolean;
  riskUpdatesIncluded: boolean;
  medicationUpdatesIncluded: boolean;
  appointmentsNoted: boolean;
  completionQuality: CompletionQuality;
  duration: number; // minutes
  timeliness: boolean; // on time
}

export interface CommunicationRecord {
  id: string;
  date: string;
  channel: CommunicationChannel;
  sender: string;
  priority: InformationPriority;
  acknowledged: boolean;
  actionRequired: boolean;
  actionCompleted: boolean | null;
  responseTime: number | null; // minutes
  relatedToChild: boolean;
}

export interface TeamMeetingRecord {
  id: string;
  date: string;
  facilitator: string;
  attendeeCount: number;
  totalStaff: number;
  agendaUsed: boolean;
  minutesTaken: boolean;
  actionPointsGenerated: number;
  actionPointsCompleted: number;
  childrenDiscussed: boolean;
  safeguardingDiscussed: boolean;
  duration: number; // minutes
}

export interface InformationGovernance {
  id: string;
  assessmentDate: string;
  assessor: string;
  dataProtectionCompliant: boolean;
  secureStorageUsed: boolean;
  needToKnowApplied: boolean;
  consentRecorded: boolean;
  thirdPartySharingProtocol: boolean;
  breachReportingProcess: boolean;
  staffTrainedIG: boolean;
}

// ── Result Interfaces ───────────────────────────────────────────────────────

export interface HandoverQualityResult {
  overallScore: number; // 0-25
  totalHandovers: number;
  thoroughRate: number; // %
  childUpdatesRate: number; // %
  riskUpdatesRate: number; // %
  medicationUpdatesRate: number; // %
  timelinessRate: number; // %
  averageDuration: number;
  formatDistribution: Record<HandoverFormat, number>;
}

export interface CommunicationEffectivenessResult {
  overallScore: number; // 0-25
  totalCommunications: number;
  acknowledgedRate: number; // %
  actionCompletionRate: number; // %
  criticalAcknowledgedRate: number; // %
  averageResponseTime: number | null;
  priorityDistribution: Record<InformationPriority, number>;
}

export interface TeamMeetingQualityResult {
  overallScore: number; // 0-25
  totalMeetings: number;
  averageAttendance: number; // %
  agendaUsedRate: number; // %
  minutesTakenRate: number; // %
  actionCompletionRate: number; // %
  childrenDiscussedRate: number; // %
  safeguardingRate: number; // %
}

export interface InformationGovernanceResult {
  overallScore: number; // 0-25
  totalAssessments: number;
  dataProtectionRate: number; // %
  secureStorageRate: number; // %
  needToKnowRate: number; // %
  consentRate: number; // %
  staffTrainedRate: number; // %
  breachProcessRate: number; // %
}

export interface StaffCommunicationProfile {
  staffId: string;
  staffName: string;
  handoversGiven: number;
  thoroughRate: number;
  communicationsSent: number;
  acknowledgedRate: number;
  overallScore: number; // 0-10
}

export interface HandoverCommunicationQualityIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number; // 0-100, capped
  rating: Rating;
  handoverQuality: HandoverQualityResult;
  communicationEffectiveness: CommunicationEffectivenessResult;
  teamMeetingQuality: TeamMeetingQualityResult;
  informationGovernance: InformationGovernanceResult;
  staffProfiles: StaffCommunicationProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Calculate percentage, returning 0 if denominator is 0. */
export function pct(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return Math.round((numerator / denominator) * 100);
}

/** Map overall score (0-100) to Ofsted-style rating. */
export function getRating(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// ── Label Functions ─────────────────────────────────────────────────────────

export function getHandoverTypeLabel(type: HandoverType): string {
  const labels: Record<HandoverType, string> = {
    shift_handover: "Shift Handover",
    on_call_handover: "On-Call Handover",
    management_handover: "Management Handover",
    emergency_handover: "Emergency Handover",
    annual_leave_handover: "Annual Leave Handover",
  };
  return labels[type] || type;
}

export function getHandoverFormatLabel(format: HandoverFormat): string {
  const labels: Record<HandoverFormat, string> = {
    face_to_face: "Face to Face",
    written_only: "Written Only",
    verbal_only: "Verbal Only",
    digital_record: "Digital Record",
    combined: "Combined",
  };
  return labels[format] || format;
}

export function getCommunicationChannelLabel(
  channel: CommunicationChannel,
): string {
  const labels: Record<CommunicationChannel, string> = {
    team_meeting: "Team Meeting",
    email: "Email",
    daily_log: "Daily Log",
    handover_book: "Handover Book",
    staff_message_board: "Staff Message Board",
    phone: "Phone",
    digital_system: "Digital System",
  };
  return labels[channel] || channel;
}

export function getInformationPriorityLabel(
  priority: InformationPriority,
): string {
  const labels: Record<InformationPriority, string> = {
    critical: "Critical",
    high: "High",
    medium: "Medium",
    low: "Low",
  };
  return labels[priority] || priority;
}

export function getCompletionQualityLabel(
  quality: CompletionQuality,
): string {
  const labels: Record<CompletionQuality, string> = {
    thorough: "Thorough",
    adequate: "Adequate",
    incomplete: "Incomplete",
    not_completed: "Not Completed",
  };
  return labels[quality] || quality;
}

export function getRatingLabel(rating: Rating): string {
  const labels: Record<Rating, string> = {
    outstanding: "Outstanding",
    good: "Good",
    requires_improvement: "Requires Improvement",
    inadequate: "Inadequate",
  };
  return labels[rating] || rating;
}

// ── Evaluators ──────────────────────────────────────────────────────────────

/**
 * Evaluate handover quality (0-25).
 *
 * Scoring:
 *   thorough rate   → 0-7
 *   child updates   → 0-5
 *   risk updates    → 0-5
 *   medication updates → 0-4
 *   timeliness      → 0-4
 *
 * Empty data = 0.
 */
export function evaluateHandoverQuality(
  handovers: HandoverRecord[],
): HandoverQualityResult {
  const emptyFormat: Record<HandoverFormat, number> = {
    face_to_face: 0,
    written_only: 0,
    verbal_only: 0,
    digital_record: 0,
    combined: 0,
  };

  if (handovers.length === 0) {
    return {
      overallScore: 0,
      totalHandovers: 0,
      thoroughRate: 0,
      childUpdatesRate: 0,
      riskUpdatesRate: 0,
      medicationUpdatesRate: 0,
      timelinessRate: 0,
      averageDuration: 0,
      formatDistribution: { ...emptyFormat },
    };
  }

  const thorough = handovers.filter(
    (h) => h.completionQuality === "thorough",
  );
  const childUpdates = handovers.filter((h) => h.childUpdatesIncluded);
  const riskUpdates = handovers.filter((h) => h.riskUpdatesIncluded);
  const medicationUpdates = handovers.filter(
    (h) => h.medicationUpdatesIncluded,
  );
  const onTime = handovers.filter((h) => h.timeliness);

  const totalDuration = handovers.reduce((sum, h) => sum + h.duration, 0);

  const formatDist = { ...emptyFormat };
  for (const h of handovers) {
    formatDist[h.format] = (formatDist[h.format] || 0) + 1;
  }

  const thoroughRate = pct(thorough.length, handovers.length);
  const childUpdatesRate = pct(childUpdates.length, handovers.length);
  const riskUpdatesRate = pct(riskUpdates.length, handovers.length);
  const medicationUpdatesRate = pct(medicationUpdates.length, handovers.length);
  const timelinessRate = pct(onTime.length, handovers.length);
  const averageDuration =
    Math.round((totalDuration / handovers.length) * 10) / 10;

  // Scoring
  const thoroughScore = Math.round((thoroughRate / 100) * 7);
  const childScore = Math.round((childUpdatesRate / 100) * 5);
  const riskScore = Math.round((riskUpdatesRate / 100) * 5);
  const medScore = Math.round((medicationUpdatesRate / 100) * 4);
  const timeScore = Math.round((timelinessRate / 100) * 4);

  const overallScore = Math.min(
    25,
    Math.max(0, thoroughScore + childScore + riskScore + medScore + timeScore),
  );

  return {
    overallScore,
    totalHandovers: handovers.length,
    thoroughRate,
    childUpdatesRate,
    riskUpdatesRate,
    medicationUpdatesRate,
    timelinessRate,
    averageDuration,
    formatDistribution: formatDist,
  };
}

/**
 * Evaluate communication effectiveness (0-25).
 *
 * Scoring:
 *   acknowledged rate        → 0-7
 *   action completion        → 0-6
 *   critical acknowledged    → 0-6
 *   response time bonus      → 0-6 (under 30min=6, under 60=4, under 120=2)
 *
 * Empty data = 0.
 */
export function evaluateCommunicationEffectiveness(
  communications: CommunicationRecord[],
): CommunicationEffectivenessResult {
  const emptyPriority: Record<InformationPriority, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };

  if (communications.length === 0) {
    return {
      overallScore: 0,
      totalCommunications: 0,
      acknowledgedRate: 0,
      actionCompletionRate: 0,
      criticalAcknowledgedRate: 0,
      averageResponseTime: null,
      priorityDistribution: { ...emptyPriority },
    };
  }

  const acknowledged = communications.filter((c) => c.acknowledged);

  const actionRequired = communications.filter((c) => c.actionRequired);
  const actionCompleted = actionRequired.filter(
    (c) => c.actionCompleted === true,
  );

  const critical = communications.filter((c) => c.priority === "critical");
  const criticalAcknowledged = critical.filter((c) => c.acknowledged);

  // Average response time (only non-null values)
  const responseTimes = communications
    .map((c) => c.responseTime)
    .filter((t): t is number => t !== null);
  const averageResponseTime =
    responseTimes.length > 0
      ? Math.round(
          (responseTimes.reduce((sum, t) => sum + t, 0) /
            responseTimes.length) *
            10,
        ) / 10
      : null;

  const priorityDist = { ...emptyPriority };
  for (const c of communications) {
    priorityDist[c.priority] = (priorityDist[c.priority] || 0) + 1;
  }

  const acknowledgedRate = pct(acknowledged.length, communications.length);
  const actionCompletionRate = pct(actionCompleted.length, actionRequired.length);
  const criticalAcknowledgedRate = pct(
    criticalAcknowledged.length,
    critical.length,
  );

  // Scoring
  const ackScore = Math.round((acknowledgedRate / 100) * 7);
  const actionScore = Math.round((actionCompletionRate / 100) * 6);
  const criticalScore = Math.round((criticalAcknowledgedRate / 100) * 6);

  let responseBonus = 0;
  if (averageResponseTime !== null) {
    if (averageResponseTime < 30) responseBonus = 6;
    else if (averageResponseTime < 60) responseBonus = 4;
    else if (averageResponseTime < 120) responseBonus = 2;
  }

  const overallScore = Math.min(
    25,
    Math.max(0, ackScore + actionScore + criticalScore + responseBonus),
  );

  return {
    overallScore,
    totalCommunications: communications.length,
    acknowledgedRate,
    actionCompletionRate,
    criticalAcknowledgedRate,
    averageResponseTime,
    priorityDistribution: priorityDist,
  };
}

/**
 * Evaluate team meeting quality (0-25).
 *
 * Scoring:
 *   attendance rate        → 0-6
 *   agenda used            → 0-5
 *   minutes taken          → 0-4
 *   action completion      → 0-4
 *   children discussed     → 0-3
 *   safeguarding discussed → 0-3
 *
 * Empty data = 0.
 */
export function evaluateTeamMeetingQuality(
  meetings: TeamMeetingRecord[],
): TeamMeetingQualityResult {
  if (meetings.length === 0) {
    return {
      overallScore: 0,
      totalMeetings: 0,
      averageAttendance: 0,
      agendaUsedRate: 0,
      minutesTakenRate: 0,
      actionCompletionRate: 0,
      childrenDiscussedRate: 0,
      safeguardingRate: 0,
    };
  }

  // Average attendance percentage across meetings
  const attendancePcts = meetings.map((m) =>
    m.totalStaff > 0 ? (m.attendeeCount / m.totalStaff) * 100 : 0,
  );
  const averageAttendance = Math.round(
    attendancePcts.reduce((sum, p) => sum + p, 0) / meetings.length,
  );

  const agendaUsed = meetings.filter((m) => m.agendaUsed);
  const minutesTaken = meetings.filter((m) => m.minutesTaken);
  const childrenDiscussed = meetings.filter((m) => m.childrenDiscussed);
  const safeguardingDiscussed = meetings.filter(
    (m) => m.safeguardingDiscussed,
  );

  const totalGenerated = meetings.reduce(
    (sum, m) => sum + m.actionPointsGenerated,
    0,
  );
  const totalCompleted = meetings.reduce(
    (sum, m) => sum + m.actionPointsCompleted,
    0,
  );

  const agendaUsedRate = pct(agendaUsed.length, meetings.length);
  const minutesTakenRate = pct(minutesTaken.length, meetings.length);
  const actionCompletionRate = pct(totalCompleted, totalGenerated);
  const childrenDiscussedRate = pct(
    childrenDiscussed.length,
    meetings.length,
  );
  const safeguardingRate = pct(
    safeguardingDiscussed.length,
    meetings.length,
  );

  // Scoring
  const attendanceScore = Math.round((averageAttendance / 100) * 6);
  const agendaScore = Math.round((agendaUsedRate / 100) * 5);
  const minutesScore = Math.round((minutesTakenRate / 100) * 4);
  const actionScore = Math.round((actionCompletionRate / 100) * 4);
  const childrenScore = Math.round((childrenDiscussedRate / 100) * 3);
  const safeguardingScore = Math.round((safeguardingRate / 100) * 3);

  const overallScore = Math.min(
    25,
    Math.max(
      0,
      attendanceScore +
        agendaScore +
        minutesScore +
        actionScore +
        childrenScore +
        safeguardingScore,
    ),
  );

  return {
    overallScore,
    totalMeetings: meetings.length,
    averageAttendance,
    agendaUsedRate,
    minutesTakenRate,
    actionCompletionRate,
    childrenDiscussedRate,
    safeguardingRate,
  };
}

/**
 * Evaluate information governance (0-25).
 *
 * 7 boolean fields. Data protection + secure storage weighted slightly higher.
 * Weights: dataProtection=4, secureStorage=4, rest=3.4 each (~25 total).
 *
 * Empty data = 0.
 */
export function evaluateInformationGovernance(
  assessments: InformationGovernance[],
): InformationGovernanceResult {
  if (assessments.length === 0) {
    return {
      overallScore: 0,
      totalAssessments: 0,
      dataProtectionRate: 0,
      secureStorageRate: 0,
      needToKnowRate: 0,
      consentRate: 0,
      staffTrainedRate: 0,
      breachProcessRate: 0,
    };
  }

  const dataProtection = assessments.filter(
    (a) => a.dataProtectionCompliant,
  );
  const secureStorage = assessments.filter((a) => a.secureStorageUsed);
  const needToKnow = assessments.filter((a) => a.needToKnowApplied);
  const consent = assessments.filter((a) => a.consentRecorded);
  const thirdParty = assessments.filter(
    (a) => a.thirdPartySharingProtocol,
  );
  const breachProcess = assessments.filter(
    (a) => a.breachReportingProcess,
  );
  const staffTrained = assessments.filter((a) => a.staffTrainedIG);

  const n = assessments.length;
  const dataProtectionRate = pct(dataProtection.length, n);
  const secureStorageRate = pct(secureStorage.length, n);
  const needToKnowRate = pct(needToKnow.length, n);
  const consentRate = pct(consent.length, n);
  const staffTrainedRate = pct(staffTrained.length, n);
  const breachProcessRate = pct(breachProcess.length, n);
  const thirdPartyRate = pct(thirdParty.length, n);

  // Weighted scoring: dataProtection=4, secureStorage=4, rest=3.4 each (5 fields)
  // 4 + 4 + 3.4*5 = 25
  const dpScore = (dataProtectionRate / 100) * 4;
  const ssScore = (secureStorageRate / 100) * 4;
  const ntkScore = (needToKnowRate / 100) * 3.4;
  const conScore = (consentRate / 100) * 3.4;
  const tpScore = (thirdPartyRate / 100) * 3.4;
  const brScore = (breachProcessRate / 100) * 3.4;
  const stScore = (staffTrainedRate / 100) * 3.4;

  const overallScore = Math.min(
    25,
    Math.max(
      0,
      Math.round(
        dpScore + ssScore + ntkScore + conScore + tpScore + brScore + stScore,
      ),
    ),
  );

  return {
    overallScore,
    totalAssessments: assessments.length,
    dataProtectionRate,
    secureStorageRate,
    needToKnowRate,
    consentRate,
    staffTrainedRate,
    breachProcessRate,
  };
}

// ── Build Staff Profiles ────────────────────────────────────────────────────

export function buildStaffCommunicationProfiles(
  handovers: HandoverRecord[],
  communications: CommunicationRecord[],
  staffIds: string[],
  staffNames: Record<string, string>,
): StaffCommunicationProfile[] {
  return staffIds.map((staffId) => {
    const staffName = staffNames[staffId] || staffId;

    const staffHandovers = handovers.filter(
      (h) => h.outgoingStaff === staffId,
    );
    const thoroughHandovers = staffHandovers.filter(
      (h) => h.completionQuality === "thorough",
    );
    const thoroughRate = pct(thoroughHandovers.length, staffHandovers.length);

    const staffComms = communications.filter((c) => c.sender === staffId);
    const staffAck = staffComms.filter((c) => c.acknowledged);
    const acknowledgedRate = pct(staffAck.length, staffComms.length);

    // Score (0-10): handover thoroughness (0-5) + communication acknowledged (0-5)
    const handoverScore =
      staffHandovers.length > 0 ? (thoroughRate / 100) * 5 : 5; // no handovers = neutral
    const commScore =
      staffComms.length > 0 ? (acknowledgedRate / 100) * 5 : 5; // no comms = neutral
    const overallScore =
      Math.round((handoverScore + commScore) * 10) / 10;

    return {
      staffId,
      staffName,
      handoversGiven: staffHandovers.length,
      thoroughRate,
      communicationsSent: staffComms.length,
      acknowledgedRate,
      overallScore: Math.min(10, Math.max(0, overallScore)),
    };
  });
}

// ── Main Intelligence Function ──────────────────────────────────────────────

export function generateHandoverCommunicationQualityIntelligence(
  handovers: HandoverRecord[],
  communications: CommunicationRecord[],
  meetings: TeamMeetingRecord[],
  assessments: InformationGovernance[],
  staffIds: string[],
  staffNames: Record<string, string>,
  homeId: string,
  periodStart: string,
  periodEnd: string,
): HandoverCommunicationQualityIntelligence {
  const handoverQuality = evaluateHandoverQuality(handovers);
  const communicationEffectiveness =
    evaluateCommunicationEffectiveness(communications);
  const teamMeetingQuality = evaluateTeamMeetingQuality(meetings);
  const informationGovernance =
    evaluateInformationGovernance(assessments);

  const staffProfiles = buildStaffCommunicationProfiles(
    handovers,
    communications,
    staffIds,
    staffNames,
  );

  // Overall score: sum of 4 evaluators (each 0-25) = 0-100
  const overallScore = Math.min(
    100,
    Math.max(
      0,
      handoverQuality.overallScore +
        communicationEffectiveness.overallScore +
        teamMeetingQuality.overallScore +
        informationGovernance.overallScore,
    ),
  );

  const rating = getRating(overallScore);

  // ── Strengths ──
  const strengths: string[] = [];

  if (handoverQuality.overallScore >= 20) {
    strengths.push(
      "Handover processes are thorough and consistent, ensuring continuity of care across shifts",
    );
  }
  if (communicationEffectiveness.overallScore >= 20) {
    strengths.push(
      "Team communication is effective with high acknowledgement and action completion rates",
    );
  }
  if (teamMeetingQuality.overallScore >= 20) {
    strengths.push(
      "Team meetings are well-structured with strong attendance, agendas and recorded minutes",
    );
  }
  if (informationGovernance.overallScore >= 20) {
    strengths.push(
      "Information governance practices are robust with strong data protection and secure storage compliance",
    );
  }
  if (handoverQuality.childUpdatesRate >= 90 && handovers.length > 0) {
    strengths.push(
      "Child updates are consistently included in handovers, supporting individualised care",
    );
  }
  if (handoverQuality.riskUpdatesRate >= 90 && handovers.length > 0) {
    strengths.push(
      "Risk information is reliably communicated during handovers, supporting safeguarding",
    );
  }
  if (handoverQuality.medicationUpdatesRate >= 90 && handovers.length > 0) {
    strengths.push(
      "Medication updates are consistently shared during handovers, reducing risk of medication errors",
    );
  }
  if (handoverQuality.timelinessRate === 100 && handovers.length > 0) {
    strengths.push(
      "All handovers completed on time, demonstrating strong professional discipline",
    );
  }
  if (
    communicationEffectiveness.criticalAcknowledgedRate === 100 &&
    communicationEffectiveness.totalCommunications > 0
  ) {
    strengths.push(
      "All critical communications are acknowledged promptly, ensuring safeguarding information is not missed",
    );
  }
  if (teamMeetingQuality.safeguardingRate === 100 && meetings.length > 0) {
    strengths.push(
      "Safeguarding is discussed at every team meeting, reflecting a strong safeguarding culture",
    );
  }

  // ── Areas for Improvement ──
  const areasForImprovement: string[] = [];

  if (handoverQuality.totalHandovers === 0) {
    areasForImprovement.push(
      "No handover records found — structured handover processes must be implemented",
    );
  }
  if (
    handoverQuality.thoroughRate < 80 &&
    handoverQuality.totalHandovers > 0
  ) {
    areasForImprovement.push(
      `Only ${handoverQuality.thoroughRate}% of handovers rated as thorough — consistency needs improvement`,
    );
  }
  if (
    handoverQuality.childUpdatesRate < 90 &&
    handoverQuality.totalHandovers > 0
  ) {
    areasForImprovement.push(
      `Child updates included in only ${handoverQuality.childUpdatesRate}% of handovers`,
    );
  }
  if (
    handoverQuality.riskUpdatesRate < 90 &&
    handoverQuality.totalHandovers > 0
  ) {
    areasForImprovement.push(
      `Risk updates included in only ${handoverQuality.riskUpdatesRate}% of handovers — this is a safeguarding concern`,
    );
  }
  if (
    handoverQuality.medicationUpdatesRate < 90 &&
    handoverQuality.totalHandovers > 0
  ) {
    areasForImprovement.push(
      `Medication updates included in only ${handoverQuality.medicationUpdatesRate}% of handovers`,
    );
  }
  if (
    communicationEffectiveness.acknowledgedRate < 80 &&
    communicationEffectiveness.totalCommunications > 0
  ) {
    areasForImprovement.push(
      `Only ${communicationEffectiveness.acknowledgedRate}% of communications acknowledged — important information may be missed`,
    );
  }
  if (
    communicationEffectiveness.actionCompletionRate < 80 &&
    communicationEffectiveness.totalCommunications > 0
  ) {
    areasForImprovement.push(
      `Action completion rate at ${communicationEffectiveness.actionCompletionRate}% — follow-through on tasks needs strengthening`,
    );
  }
  if (
    communicationEffectiveness.criticalAcknowledgedRate < 100 &&
    communicationEffectiveness.totalCommunications > 0
  ) {
    areasForImprovement.push(
      "Not all critical communications are being acknowledged — this poses a safeguarding risk",
    );
  }
  if (teamMeetingQuality.totalMeetings === 0) {
    areasForImprovement.push(
      "No team meetings recorded — regular team meetings are essential for effective communication",
    );
  }
  if (
    teamMeetingQuality.averageAttendance < 75 &&
    teamMeetingQuality.totalMeetings > 0
  ) {
    areasForImprovement.push(
      `Average team meeting attendance at ${teamMeetingQuality.averageAttendance}% — higher participation needed`,
    );
  }
  if (
    teamMeetingQuality.safeguardingRate < 100 &&
    teamMeetingQuality.totalMeetings > 0
  ) {
    areasForImprovement.push(
      `Safeguarding discussed at only ${teamMeetingQuality.safeguardingRate}% of meetings — should be a standing agenda item`,
    );
  }
  if (informationGovernance.totalAssessments === 0) {
    areasForImprovement.push(
      "No information governance assessments completed — compliance cannot be evidenced",
    );
  }
  if (
    informationGovernance.dataProtectionRate < 100 &&
    informationGovernance.totalAssessments > 0
  ) {
    areasForImprovement.push(
      `Data protection compliance at ${informationGovernance.dataProtectionRate}% — all records must be GDPR compliant`,
    );
  }
  if (
    informationGovernance.staffTrainedRate < 100 &&
    informationGovernance.totalAssessments > 0
  ) {
    areasForImprovement.push(
      `Only ${informationGovernance.staffTrainedRate}% of assessments show staff trained in information governance`,
    );
  }

  // ── Actions ──
  const actions: string[] = [];

  if (handoverQuality.totalHandovers === 0) {
    actions.push(
      "Implement a structured handover process with a standard template covering child updates, risks, medication and appointments",
    );
  }
  if (
    handoverQuality.thoroughRate < 80 &&
    handoverQuality.totalHandovers > 0
  ) {
    actions.push(
      "Provide staff training on completing thorough handovers and audit handover quality monthly",
    );
  }
  if (
    handoverQuality.riskUpdatesRate < 90 &&
    handoverQuality.totalHandovers > 0
  ) {
    actions.push(
      "Add a mandatory risk update section to the handover template and monitor compliance",
    );
  }
  if (
    handoverQuality.medicationUpdatesRate < 90 &&
    handoverQuality.totalHandovers > 0
  ) {
    actions.push(
      "Ensure medication updates are a mandatory component of every handover",
    );
  }
  if (
    communicationEffectiveness.acknowledgedRate < 100 &&
    communicationEffectiveness.totalCommunications > 0
  ) {
    actions.push(
      "Introduce a communication acknowledgement protocol requiring staff to confirm receipt of all messages",
    );
  }
  if (
    communicationEffectiveness.criticalAcknowledgedRate < 100 &&
    communicationEffectiveness.totalCommunications > 0
  ) {
    actions.push(
      "Implement an escalation process for unacknowledged critical communications within 30 minutes",
    );
  }
  if (
    communicationEffectiveness.actionCompletionRate < 80 &&
    communicationEffectiveness.totalCommunications > 0
  ) {
    actions.push(
      "Track action items from communications in a central log and review completion in team meetings",
    );
  }
  if (teamMeetingQuality.totalMeetings === 0) {
    actions.push(
      "Schedule regular team meetings with a standing agenda including safeguarding, child updates and action review",
    );
  }
  if (
    teamMeetingQuality.averageAttendance < 75 &&
    teamMeetingQuality.totalMeetings > 0
  ) {
    actions.push(
      "Review team meeting scheduling to maximise attendance and consider catch-up mechanisms for absent staff",
    );
  }
  if (
    teamMeetingQuality.agendaUsedRate < 100 &&
    teamMeetingQuality.totalMeetings > 0
  ) {
    actions.push(
      "Use a standard agenda template for all team meetings to ensure consistency",
    );
  }
  if (
    teamMeetingQuality.minutesTakenRate < 100 &&
    teamMeetingQuality.totalMeetings > 0
  ) {
    actions.push(
      "Ensure minutes are taken at every team meeting and distributed to all staff",
    );
  }
  if (informationGovernance.totalAssessments === 0) {
    actions.push(
      "Conduct an information governance assessment and develop an improvement plan",
    );
  }
  if (
    informationGovernance.staffTrainedRate < 100 &&
    informationGovernance.totalAssessments > 0
  ) {
    actions.push(
      "Deliver information governance training to all staff and record completion",
    );
  }
  if (
    informationGovernance.dataProtectionRate < 100 &&
    informationGovernance.totalAssessments > 0
  ) {
    actions.push(
      "Review data protection practices and address any non-compliance immediately",
    );
  }

  const regulatoryLinks = [
    "CHR 2015 Reg 22 — Contact between children and relevant persons, access to communication",
    "CHR 2015 Reg 24 — Staffing: sufficient staff with appropriate qualifications, skills and experience",
    "SCCIF — Social Care Common Inspection Framework: leadership and management",
    "NMS 19 — National Minimum Standards: staffing and organisation",
    "Data Protection Act 2018 / UK GDPR — Lawful processing and security of personal data",
    "Working Together 2023 — Information sharing for safeguarding and promoting welfare of children",
    "CA 1989 s22(3)(a) — Duty to safeguard and promote the welfare of looked-after children",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    handoverQuality,
    communicationEffectiveness,
    teamMeetingQuality,
    informationGovernance,
    staffProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
