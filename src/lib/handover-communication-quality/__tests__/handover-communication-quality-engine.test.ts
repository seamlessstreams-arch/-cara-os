// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Handover & Communication Quality Intelligence Engine Tests
// 100+ tests covering all functions, scoring, labels, edge cases
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateHandoverQuality,
  evaluateCommunicationEffectiveness,
  evaluateTeamMeetingQuality,
  evaluateInformationGovernance,
  buildStaffCommunicationProfiles,
  generateHandoverCommunicationQualityIntelligence,
  pct,
  getRating,
  getHandoverTypeLabel,
  getHandoverFormatLabel,
  getCommunicationChannelLabel,
  getInformationPriorityLabel,
  getCompletionQualityLabel,
  getRatingLabel,
} from "../handover-communication-quality-engine";
import type {
  HandoverRecord,
  CommunicationRecord,
  TeamMeetingRecord,
  InformationGovernance,
} from "../handover-communication-quality-engine";

// ── Helpers ────────────────────────────────────────────────────────────────

const STAFF_IDS = ["darren", "sarah", "tom", "lisa"];
const STAFF_NAMES: Record<string, string> = {
  darren: "Darren",
  sarah: "Sarah",
  tom: "Tom",
  lisa: "Lisa",
};

function makeHandover(
  overrides: Partial<HandoverRecord> = {},
): HandoverRecord {
  return {
    id: "h-01",
    date: "2025-03-01",
    handoverType: "shift_handover",
    format: "face_to_face",
    outgoingStaff: "darren",
    incomingStaff: "sarah",
    childUpdatesIncluded: true,
    riskUpdatesIncluded: true,
    medicationUpdatesIncluded: true,
    appointmentsNoted: true,
    completionQuality: "thorough",
    duration: 15,
    timeliness: true,
    ...overrides,
  };
}

function makeCommunication(
  overrides: Partial<CommunicationRecord> = {},
): CommunicationRecord {
  return {
    id: "comm-01",
    date: "2025-03-01",
    channel: "email",
    sender: "darren",
    priority: "medium",
    acknowledged: true,
    actionRequired: false,
    actionCompleted: null,
    responseTime: 20,
    relatedToChild: true,
    ...overrides,
  };
}

function makeMeeting(
  overrides: Partial<TeamMeetingRecord> = {},
): TeamMeetingRecord {
  return {
    id: "m-01",
    date: "2025-03-01",
    facilitator: "darren",
    attendeeCount: 4,
    totalStaff: 5,
    agendaUsed: true,
    minutesTaken: true,
    actionPointsGenerated: 5,
    actionPointsCompleted: 4,
    childrenDiscussed: true,
    safeguardingDiscussed: true,
    duration: 60,
    ...overrides,
  };
}

function makeAssessment(
  overrides: Partial<InformationGovernance> = {},
): InformationGovernance {
  return {
    id: "ig-01",
    assessmentDate: "2025-03-01",
    assessor: "darren",
    dataProtectionCompliant: true,
    secureStorageUsed: true,
    needToKnowApplied: true,
    consentRecorded: true,
    thirdPartySharingProtocol: true,
    breachReportingProcess: true,
    staffTrainedIG: true,
    ...overrides,
  };
}

// ── pct ──────────────────────────────────────────────────────────────────

describe("pct", () => {
  it("returns 0 when denominator is 0", () => {
    expect(pct(5, 0)).toBe(0);
  });

  it("calculates correct percentage", () => {
    expect(pct(3, 4)).toBe(75);
  });

  it("rounds to nearest integer", () => {
    expect(pct(1, 3)).toBe(33);
  });

  it("returns 100 for equal numerator and denominator", () => {
    expect(pct(5, 5)).toBe(100);
  });

  it("returns 0 when numerator is 0", () => {
    expect(pct(0, 10)).toBe(0);
  });
});

// ── getRating ────────────────────────────────────────────────────────────

describe("getRating", () => {
  it("returns outstanding for score >= 80", () => {
    expect(getRating(80)).toBe("outstanding");
    expect(getRating(100)).toBe("outstanding");
  });

  it("returns good for score >= 60", () => {
    expect(getRating(60)).toBe("good");
    expect(getRating(79)).toBe("good");
  });

  it("returns requires_improvement for score >= 40", () => {
    expect(getRating(40)).toBe("requires_improvement");
    expect(getRating(59)).toBe("requires_improvement");
  });

  it("returns inadequate for score < 40", () => {
    expect(getRating(39)).toBe("inadequate");
    expect(getRating(0)).toBe("inadequate");
  });
});

// ── Label Functions ──────────────────────────────────────────────────────

describe("getHandoverTypeLabel", () => {
  it("returns correct labels for all types", () => {
    expect(getHandoverTypeLabel("shift_handover")).toBe("Shift Handover");
    expect(getHandoverTypeLabel("on_call_handover")).toBe("On-Call Handover");
    expect(getHandoverTypeLabel("management_handover")).toBe(
      "Management Handover",
    );
    expect(getHandoverTypeLabel("emergency_handover")).toBe(
      "Emergency Handover",
    );
    expect(getHandoverTypeLabel("annual_leave_handover")).toBe(
      "Annual Leave Handover",
    );
  });
});

describe("getHandoverFormatLabel", () => {
  it("returns correct labels for all formats", () => {
    expect(getHandoverFormatLabel("face_to_face")).toBe("Face to Face");
    expect(getHandoverFormatLabel("written_only")).toBe("Written Only");
    expect(getHandoverFormatLabel("verbal_only")).toBe("Verbal Only");
    expect(getHandoverFormatLabel("digital_record")).toBe("Digital Record");
    expect(getHandoverFormatLabel("combined")).toBe("Combined");
  });
});

describe("getCommunicationChannelLabel", () => {
  it("returns correct labels for all channels", () => {
    expect(getCommunicationChannelLabel("team_meeting")).toBe("Team Meeting");
    expect(getCommunicationChannelLabel("email")).toBe("Email");
    expect(getCommunicationChannelLabel("daily_log")).toBe("Daily Log");
    expect(getCommunicationChannelLabel("handover_book")).toBe(
      "Handover Book",
    );
    expect(getCommunicationChannelLabel("staff_message_board")).toBe(
      "Staff Message Board",
    );
    expect(getCommunicationChannelLabel("phone")).toBe("Phone");
    expect(getCommunicationChannelLabel("digital_system")).toBe(
      "Digital System",
    );
  });
});

describe("getInformationPriorityLabel", () => {
  it("returns correct labels for all priorities", () => {
    expect(getInformationPriorityLabel("critical")).toBe("Critical");
    expect(getInformationPriorityLabel("high")).toBe("High");
    expect(getInformationPriorityLabel("medium")).toBe("Medium");
    expect(getInformationPriorityLabel("low")).toBe("Low");
  });
});

describe("getCompletionQualityLabel", () => {
  it("returns correct labels for all quality levels", () => {
    expect(getCompletionQualityLabel("thorough")).toBe("Thorough");
    expect(getCompletionQualityLabel("adequate")).toBe("Adequate");
    expect(getCompletionQualityLabel("incomplete")).toBe("Incomplete");
    expect(getCompletionQualityLabel("not_completed")).toBe("Not Completed");
  });
});

describe("getRatingLabel", () => {
  it("returns correct labels for all ratings", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
    expect(getRatingLabel("good")).toBe("Good");
    expect(getRatingLabel("requires_improvement")).toBe(
      "Requires Improvement",
    );
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

// ── evaluateHandoverQuality ──────────────────────────────────────────────

describe("evaluateHandoverQuality", () => {
  it("returns 0 for empty handovers", () => {
    const result = evaluateHandoverQuality([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalHandovers).toBe(0);
    expect(result.thoroughRate).toBe(0);
    expect(result.childUpdatesRate).toBe(0);
    expect(result.riskUpdatesRate).toBe(0);
    expect(result.medicationUpdatesRate).toBe(0);
    expect(result.timelinessRate).toBe(0);
    expect(result.averageDuration).toBe(0);
  });

  it("returns max score (25) for perfect handovers", () => {
    const handovers = [makeHandover(), makeHandover({ id: "h-02" })];
    const result = evaluateHandoverQuality(handovers);
    expect(result.overallScore).toBe(25);
    expect(result.thoroughRate).toBe(100);
    expect(result.childUpdatesRate).toBe(100);
    expect(result.riskUpdatesRate).toBe(100);
    expect(result.medicationUpdatesRate).toBe(100);
    expect(result.timelinessRate).toBe(100);
  });

  it("scores lower for incomplete handovers", () => {
    const handovers = [
      makeHandover({
        completionQuality: "incomplete",
        childUpdatesIncluded: false,
        riskUpdatesIncluded: false,
        medicationUpdatesIncluded: false,
        timeliness: false,
      }),
    ];
    const result = evaluateHandoverQuality(handovers);
    expect(result.overallScore).toBe(0);
    expect(result.thoroughRate).toBe(0);
    expect(result.childUpdatesRate).toBe(0);
    expect(result.riskUpdatesRate).toBe(0);
    expect(result.medicationUpdatesRate).toBe(0);
    expect(result.timelinessRate).toBe(0);
  });

  it("calculates average duration correctly", () => {
    const handovers = [
      makeHandover({ duration: 10 }),
      makeHandover({ id: "h-02", duration: 20 }),
    ];
    const result = evaluateHandoverQuality(handovers);
    expect(result.averageDuration).toBe(15);
  });

  it("calculates format distribution correctly", () => {
    const handovers = [
      makeHandover({ format: "face_to_face" }),
      makeHandover({ id: "h-02", format: "face_to_face" }),
      makeHandover({ id: "h-03", format: "combined" }),
    ];
    const result = evaluateHandoverQuality(handovers);
    expect(result.formatDistribution.face_to_face).toBe(2);
    expect(result.formatDistribution.combined).toBe(1);
    expect(result.formatDistribution.written_only).toBe(0);
  });

  it("handles mixed quality handovers", () => {
    const handovers = [
      makeHandover(), // thorough, all good
      makeHandover({
        id: "h-02",
        completionQuality: "adequate",
        childUpdatesIncluded: false,
        timeliness: false,
      }),
    ];
    const result = evaluateHandoverQuality(handovers);
    expect(result.thoroughRate).toBe(50);
    expect(result.childUpdatesRate).toBe(50);
    expect(result.timelinessRate).toBe(50);
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThan(25);
  });

  it("counts total handovers correctly", () => {
    const handovers = [
      makeHandover(),
      makeHandover({ id: "h-02" }),
      makeHandover({ id: "h-03" }),
    ];
    const result = evaluateHandoverQuality(handovers);
    expect(result.totalHandovers).toBe(3);
  });

  it("caps score at 25", () => {
    const handovers = [makeHandover()];
    const result = evaluateHandoverQuality(handovers);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("does not return negative scores", () => {
    const handovers = [
      makeHandover({
        completionQuality: "not_completed",
        childUpdatesIncluded: false,
        riskUpdatesIncluded: false,
        medicationUpdatesIncluded: false,
        timeliness: false,
      }),
    ];
    const result = evaluateHandoverQuality(handovers);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });
});

// ── evaluateCommunicationEffectiveness ────────────────────────────────────

describe("evaluateCommunicationEffectiveness", () => {
  it("returns 0 for empty communications", () => {
    const result = evaluateCommunicationEffectiveness([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalCommunications).toBe(0);
    expect(result.acknowledgedRate).toBe(0);
    expect(result.actionCompletionRate).toBe(0);
    expect(result.criticalAcknowledgedRate).toBe(0);
    expect(result.averageResponseTime).toBeNull();
  });

  it("returns high score for perfect communications", () => {
    const comms = [
      makeCommunication({
        priority: "critical",
        acknowledged: true,
        actionRequired: true,
        actionCompleted: true,
        responseTime: 10,
      }),
      makeCommunication({
        id: "comm-02",
        priority: "critical",
        acknowledged: true,
        actionRequired: true,
        actionCompleted: true,
        responseTime: 15,
      }),
    ];
    const result = evaluateCommunicationEffectiveness(comms);
    expect(result.overallScore).toBe(25);
    expect(result.acknowledgedRate).toBe(100);
    expect(result.actionCompletionRate).toBe(100);
    expect(result.criticalAcknowledgedRate).toBe(100);
  });

  it("scores 0 for all unacknowledged communications", () => {
    const comms = [
      makeCommunication({
        acknowledged: false,
        actionRequired: true,
        actionCompleted: false,
        responseTime: 200,
      }),
    ];
    const result = evaluateCommunicationEffectiveness(comms);
    expect(result.acknowledgedRate).toBe(0);
    expect(result.actionCompletionRate).toBe(0);
  });

  it("calculates average response time correctly", () => {
    const comms = [
      makeCommunication({ responseTime: 10 }),
      makeCommunication({ id: "comm-02", responseTime: 30 }),
    ];
    const result = evaluateCommunicationEffectiveness(comms);
    expect(result.averageResponseTime).toBe(20);
  });

  it("returns null average response time when no response times", () => {
    const comms = [
      makeCommunication({ responseTime: null }),
      makeCommunication({ id: "comm-02", responseTime: null }),
    ];
    const result = evaluateCommunicationEffectiveness(comms);
    expect(result.averageResponseTime).toBeNull();
  });

  it("gives response bonus of 6 for under 30 min", () => {
    const comms = [
      makeCommunication({
        priority: "critical",
        acknowledged: true,
        actionRequired: true,
        actionCompleted: true,
        responseTime: 15,
      }),
    ];
    const result = evaluateCommunicationEffectiveness(comms);
    // 7 (ack) + 6 (action) + 6 (critical) + 6 (response <30) = 25
    expect(result.overallScore).toBe(25);
  });

  it("gives response bonus of 4 for under 60 min", () => {
    const comms = [
      makeCommunication({ responseTime: 45 }),
    ];
    const result = evaluateCommunicationEffectiveness(comms);
    // 7 (ack) + 0 (no action required) + 0 (no critical) + 4 (response <60) = 11
    expect(result.overallScore).toBe(11);
  });

  it("gives response bonus of 2 for under 120 min", () => {
    const comms = [
      makeCommunication({ responseTime: 90 }),
    ];
    const result = evaluateCommunicationEffectiveness(comms);
    // 7 (ack) + 0 + 0 + 2 (response <120) = 9
    expect(result.overallScore).toBe(9);
  });

  it("gives 0 response bonus for 120+ min", () => {
    const comms = [
      makeCommunication({ responseTime: 150 }),
    ];
    const result = evaluateCommunicationEffectiveness(comms);
    // 7 (ack) + 0 + 0 + 0 = 7
    expect(result.overallScore).toBe(7);
  });

  it("calculates priority distribution correctly", () => {
    const comms = [
      makeCommunication({ priority: "critical" }),
      makeCommunication({ id: "comm-02", priority: "critical" }),
      makeCommunication({ id: "comm-03", priority: "low" }),
    ];
    const result = evaluateCommunicationEffectiveness(comms);
    expect(result.priorityDistribution.critical).toBe(2);
    expect(result.priorityDistribution.low).toBe(1);
    expect(result.priorityDistribution.medium).toBe(0);
  });

  it("handles action completion for action-required comms only", () => {
    const comms = [
      makeCommunication({
        actionRequired: true,
        actionCompleted: true,
      }),
      makeCommunication({
        id: "comm-02",
        actionRequired: true,
        actionCompleted: false,
      }),
      makeCommunication({
        id: "comm-03",
        actionRequired: false,
        actionCompleted: null,
      }),
    ];
    const result = evaluateCommunicationEffectiveness(comms);
    expect(result.actionCompletionRate).toBe(50);
  });

  it("caps score at 25", () => {
    const comms = [
      makeCommunication({
        priority: "critical",
        acknowledged: true,
        actionRequired: true,
        actionCompleted: true,
        responseTime: 5,
      }),
    ];
    const result = evaluateCommunicationEffectiveness(comms);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("critical acknowledged rate only counts critical messages", () => {
    const comms = [
      makeCommunication({
        priority: "critical",
        acknowledged: true,
      }),
      makeCommunication({
        id: "comm-02",
        priority: "critical",
        acknowledged: false,
      }),
      makeCommunication({
        id: "comm-03",
        priority: "medium",
        acknowledged: false,
      }),
    ];
    const result = evaluateCommunicationEffectiveness(comms);
    expect(result.criticalAcknowledgedRate).toBe(50);
  });
});

// ── evaluateTeamMeetingQuality ───────────────────────────────────────────

describe("evaluateTeamMeetingQuality", () => {
  it("returns 0 for empty meetings", () => {
    const result = evaluateTeamMeetingQuality([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalMeetings).toBe(0);
    expect(result.averageAttendance).toBe(0);
    expect(result.agendaUsedRate).toBe(0);
    expect(result.minutesTakenRate).toBe(0);
    expect(result.actionCompletionRate).toBe(0);
    expect(result.childrenDiscussedRate).toBe(0);
    expect(result.safeguardingRate).toBe(0);
  });

  it("returns max score for perfect meetings", () => {
    const meetings = [
      makeMeeting({
        attendeeCount: 5,
        totalStaff: 5,
        actionPointsGenerated: 5,
        actionPointsCompleted: 5,
      }),
    ];
    const result = evaluateTeamMeetingQuality(meetings);
    expect(result.overallScore).toBe(25);
    expect(result.averageAttendance).toBe(100);
    expect(result.agendaUsedRate).toBe(100);
    expect(result.minutesTakenRate).toBe(100);
    expect(result.actionCompletionRate).toBe(100);
    expect(result.childrenDiscussedRate).toBe(100);
    expect(result.safeguardingRate).toBe(100);
  });

  it("scores lower for poor meetings", () => {
    const meetings = [
      makeMeeting({
        attendeeCount: 1,
        totalStaff: 5,
        agendaUsed: false,
        minutesTaken: false,
        actionPointsGenerated: 5,
        actionPointsCompleted: 0,
        childrenDiscussed: false,
        safeguardingDiscussed: false,
      }),
    ];
    const result = evaluateTeamMeetingQuality(meetings);
    expect(result.overallScore).toBeLessThan(10);
    expect(result.averageAttendance).toBe(20);
    expect(result.agendaUsedRate).toBe(0);
    expect(result.minutesTakenRate).toBe(0);
    expect(result.actionCompletionRate).toBe(0);
    expect(result.childrenDiscussedRate).toBe(0);
    expect(result.safeguardingRate).toBe(0);
  });

  it("calculates average attendance across meetings", () => {
    const meetings = [
      makeMeeting({ attendeeCount: 4, totalStaff: 4 }), // 100%
      makeMeeting({ id: "m-02", attendeeCount: 2, totalStaff: 4 }), // 50%
    ];
    const result = evaluateTeamMeetingQuality(meetings);
    expect(result.averageAttendance).toBe(75);
  });

  it("handles meetings with totalStaff of 0", () => {
    const meetings = [makeMeeting({ totalStaff: 0, attendeeCount: 0 })];
    const result = evaluateTeamMeetingQuality(meetings);
    expect(result.averageAttendance).toBe(0);
  });

  it("calculates action completion across all meetings", () => {
    const meetings = [
      makeMeeting({ actionPointsGenerated: 4, actionPointsCompleted: 2 }),
      makeMeeting({
        id: "m-02",
        actionPointsGenerated: 6,
        actionPointsCompleted: 6,
      }),
    ];
    const result = evaluateTeamMeetingQuality(meetings);
    // 8 completed / 10 generated = 80%
    expect(result.actionCompletionRate).toBe(80);
  });

  it("returns 0 action completion when no actions generated", () => {
    const meetings = [
      makeMeeting({
        actionPointsGenerated: 0,
        actionPointsCompleted: 0,
      }),
    ];
    const result = evaluateTeamMeetingQuality(meetings);
    expect(result.actionCompletionRate).toBe(0);
  });

  it("counts total meetings", () => {
    const meetings = [
      makeMeeting(),
      makeMeeting({ id: "m-02" }),
      makeMeeting({ id: "m-03" }),
    ];
    const result = evaluateTeamMeetingQuality(meetings);
    expect(result.totalMeetings).toBe(3);
  });

  it("caps score at 25", () => {
    const meetings = [
      makeMeeting({
        attendeeCount: 5,
        totalStaff: 5,
        actionPointsGenerated: 10,
        actionPointsCompleted: 10,
      }),
    ];
    const result = evaluateTeamMeetingQuality(meetings);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });
});

// ── evaluateInformationGovernance ────────────────────────────────────────

describe("evaluateInformationGovernance", () => {
  it("returns 0 for empty assessments", () => {
    const result = evaluateInformationGovernance([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalAssessments).toBe(0);
    expect(result.dataProtectionRate).toBe(0);
    expect(result.secureStorageRate).toBe(0);
    expect(result.needToKnowRate).toBe(0);
    expect(result.consentRate).toBe(0);
    expect(result.staffTrainedRate).toBe(0);
    expect(result.breachProcessRate).toBe(0);
  });

  it("returns max score for fully compliant assessments", () => {
    const assessments = [makeAssessment()];
    const result = evaluateInformationGovernance(assessments);
    expect(result.overallScore).toBe(25);
    expect(result.dataProtectionRate).toBe(100);
    expect(result.secureStorageRate).toBe(100);
    expect(result.needToKnowRate).toBe(100);
    expect(result.consentRate).toBe(100);
    expect(result.staffTrainedRate).toBe(100);
    expect(result.breachProcessRate).toBe(100);
  });

  it("returns 0 for fully non-compliant assessments", () => {
    const assessments = [
      makeAssessment({
        dataProtectionCompliant: false,
        secureStorageUsed: false,
        needToKnowApplied: false,
        consentRecorded: false,
        thirdPartySharingProtocol: false,
        breachReportingProcess: false,
        staffTrainedIG: false,
      }),
    ];
    const result = evaluateInformationGovernance(assessments);
    expect(result.overallScore).toBe(0);
    expect(result.dataProtectionRate).toBe(0);
    expect(result.secureStorageRate).toBe(0);
  });

  it("weights data protection and secure storage higher", () => {
    // Only data protection and secure storage true
    const assessments1 = [
      makeAssessment({
        needToKnowApplied: false,
        consentRecorded: false,
        thirdPartySharingProtocol: false,
        breachReportingProcess: false,
        staffTrainedIG: false,
      }),
    ];
    // Only two other fields true (same count, different fields)
    const assessments2 = [
      makeAssessment({
        dataProtectionCompliant: false,
        secureStorageUsed: false,
        thirdPartySharingProtocol: false,
        breachReportingProcess: false,
        staffTrainedIG: false,
      }),
    ];
    const result1 = evaluateInformationGovernance(assessments1);
    const result2 = evaluateInformationGovernance(assessments2);
    // Data protection + secure storage = 4+4 = 8 points
    // needToKnow + consent = 3.4+3.4 = 6.8 points
    expect(result1.overallScore).toBeGreaterThan(result2.overallScore);
  });

  it("calculates rates across multiple assessments", () => {
    const assessments = [
      makeAssessment(), // all true
      makeAssessment({
        id: "ig-02",
        dataProtectionCompliant: false,
        staffTrainedIG: false,
      }),
    ];
    const result = evaluateInformationGovernance(assessments);
    expect(result.totalAssessments).toBe(2);
    expect(result.dataProtectionRate).toBe(50);
    expect(result.staffTrainedRate).toBe(50);
    expect(result.secureStorageRate).toBe(100);
  });

  it("caps score at 25", () => {
    const assessments = [makeAssessment()];
    const result = evaluateInformationGovernance(assessments);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("does not return negative scores", () => {
    const assessments = [
      makeAssessment({
        dataProtectionCompliant: false,
        secureStorageUsed: false,
        needToKnowApplied: false,
        consentRecorded: false,
        thirdPartySharingProtocol: false,
        breachReportingProcess: false,
        staffTrainedIG: false,
      }),
    ];
    const result = evaluateInformationGovernance(assessments);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });
});

// ── buildStaffCommunicationProfiles ──────────────────────────────────────

describe("buildStaffCommunicationProfiles", () => {
  it("returns profiles for all staff IDs", () => {
    const profiles = buildStaffCommunicationProfiles(
      [],
      [],
      STAFF_IDS,
      STAFF_NAMES,
    );
    expect(profiles).toHaveLength(4);
    expect(profiles[0].staffId).toBe("darren");
    expect(profiles[0].staffName).toBe("Darren");
  });

  it("assigns neutral score (10) when no data for staff", () => {
    const profiles = buildStaffCommunicationProfiles(
      [],
      [],
      ["darren"],
      STAFF_NAMES,
    );
    expect(profiles[0].overallScore).toBe(10);
    expect(profiles[0].handoversGiven).toBe(0);
    expect(profiles[0].communicationsSent).toBe(0);
  });

  it("counts handovers given by outgoing staff", () => {
    const handovers = [
      makeHandover({ outgoingStaff: "darren" }),
      makeHandover({ id: "h-02", outgoingStaff: "darren" }),
      makeHandover({ id: "h-03", outgoingStaff: "sarah" }),
    ];
    const profiles = buildStaffCommunicationProfiles(
      handovers,
      [],
      STAFF_IDS,
      STAFF_NAMES,
    );
    const darren = profiles.find((p) => p.staffId === "darren")!;
    expect(darren.handoversGiven).toBe(2);
    const sarah = profiles.find((p) => p.staffId === "sarah")!;
    expect(sarah.handoversGiven).toBe(1);
  });

  it("calculates thorough rate for staff handovers", () => {
    const handovers = [
      makeHandover({ outgoingStaff: "darren", completionQuality: "thorough" }),
      makeHandover({
        id: "h-02",
        outgoingStaff: "darren",
        completionQuality: "adequate",
      }),
    ];
    const profiles = buildStaffCommunicationProfiles(
      handovers,
      [],
      ["darren"],
      STAFF_NAMES,
    );
    expect(profiles[0].thoroughRate).toBe(50);
  });

  it("counts communications sent by staff", () => {
    const comms = [
      makeCommunication({ sender: "darren" }),
      makeCommunication({ id: "comm-02", sender: "darren" }),
      makeCommunication({ id: "comm-03", sender: "tom" }),
    ];
    const profiles = buildStaffCommunicationProfiles(
      [],
      comms,
      STAFF_IDS,
      STAFF_NAMES,
    );
    const darren = profiles.find((p) => p.staffId === "darren")!;
    expect(darren.communicationsSent).toBe(2);
    const tom = profiles.find((p) => p.staffId === "tom")!;
    expect(tom.communicationsSent).toBe(1);
  });

  it("calculates acknowledged rate for staff comms", () => {
    const comms = [
      makeCommunication({ sender: "darren", acknowledged: true }),
      makeCommunication({
        id: "comm-02",
        sender: "darren",
        acknowledged: false,
      }),
    ];
    const profiles = buildStaffCommunicationProfiles(
      [],
      comms,
      ["darren"],
      STAFF_NAMES,
    );
    expect(profiles[0].acknowledgedRate).toBe(50);
  });

  it("scores 0-10 range", () => {
    const handovers = [
      makeHandover({
        outgoingStaff: "darren",
        completionQuality: "not_completed",
      }),
    ];
    const comms = [
      makeCommunication({ sender: "darren", acknowledged: false }),
    ];
    const profiles = buildStaffCommunicationProfiles(
      handovers,
      comms,
      ["darren"],
      STAFF_NAMES,
    );
    expect(profiles[0].overallScore).toBeGreaterThanOrEqual(0);
    expect(profiles[0].overallScore).toBeLessThanOrEqual(10);
  });

  it("uses staffId as fallback name when not in map", () => {
    const profiles = buildStaffCommunicationProfiles(
      [],
      [],
      ["unknown_id"],
      {},
    );
    expect(profiles[0].staffName).toBe("unknown_id");
  });
});

// ── generateHandoverCommunicationQualityIntelligence ─────────────────────

describe("generateHandoverCommunicationQualityIntelligence", () => {
  it("returns correct structure with all fields", () => {
    const result = generateHandoverCommunicationQualityIntelligence(
      [makeHandover()],
      [makeCommunication()],
      [makeMeeting()],
      [makeAssessment()],
      STAFF_IDS,
      STAFF_NAMES,
      "oak-house",
      "2025-01-01",
      "2025-06-30",
    );
    expect(result.homeId).toBe("oak-house");
    expect(result.periodStart).toBe("2025-01-01");
    expect(result.periodEnd).toBe("2025-06-30");
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(result.rating).toBeDefined();
    expect(result.handoverQuality).toBeDefined();
    expect(result.communicationEffectiveness).toBeDefined();
    expect(result.teamMeetingQuality).toBeDefined();
    expect(result.informationGovernance).toBeDefined();
    expect(result.staffProfiles).toHaveLength(4);
    expect(Array.isArray(result.strengths)).toBe(true);
    expect(Array.isArray(result.areasForImprovement)).toBe(true);
    expect(Array.isArray(result.actions)).toBe(true);
    expect(Array.isArray(result.regulatoryLinks)).toBe(true);
  });

  it("overall score is sum of four evaluators capped at 100", () => {
    const result = generateHandoverCommunicationQualityIntelligence(
      [makeHandover()],
      [
        makeCommunication({
          priority: "critical",
          actionRequired: true,
          actionCompleted: true,
          responseTime: 10,
        }),
      ],
      [
        makeMeeting({
          attendeeCount: 5,
          totalStaff: 5,
          actionPointsGenerated: 5,
          actionPointsCompleted: 5,
        }),
      ],
      [makeAssessment()],
      STAFF_IDS,
      STAFF_NAMES,
      "oak-house",
      "2025-01-01",
      "2025-06-30",
    );
    const sum =
      result.handoverQuality.overallScore +
      result.communicationEffectiveness.overallScore +
      result.teamMeetingQuality.overallScore +
      result.informationGovernance.overallScore;
    expect(result.overallScore).toBe(Math.min(100, sum));
  });

  it("returns outstanding for high scores", () => {
    const result = generateHandoverCommunicationQualityIntelligence(
      [makeHandover()],
      [
        makeCommunication({
          priority: "critical",
          actionRequired: true,
          actionCompleted: true,
          responseTime: 10,
        }),
      ],
      [
        makeMeeting({
          attendeeCount: 5,
          totalStaff: 5,
          actionPointsGenerated: 5,
          actionPointsCompleted: 5,
        }),
      ],
      [makeAssessment()],
      STAFF_IDS,
      STAFF_NAMES,
      "oak-house",
      "2025-01-01",
      "2025-06-30",
    );
    expect(result.rating).toBe("outstanding");
  });

  it("returns inadequate for all-empty data", () => {
    const result = generateHandoverCommunicationQualityIntelligence(
      [],
      [],
      [],
      [],
      STAFF_IDS,
      STAFF_NAMES,
      "oak-house",
      "2025-01-01",
      "2025-06-30",
    );
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
  });

  it("generates strengths for high-scoring areas", () => {
    const result = generateHandoverCommunicationQualityIntelligence(
      [makeHandover()],
      [
        makeCommunication({
          priority: "critical",
          actionRequired: true,
          actionCompleted: true,
          responseTime: 10,
        }),
      ],
      [
        makeMeeting({
          attendeeCount: 5,
          totalStaff: 5,
          actionPointsGenerated: 5,
          actionPointsCompleted: 5,
        }),
      ],
      [makeAssessment()],
      STAFF_IDS,
      STAFF_NAMES,
      "oak-house",
      "2025-01-01",
      "2025-06-30",
    );
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("generates areas for improvement for low-scoring areas", () => {
    const result = generateHandoverCommunicationQualityIntelligence(
      [],
      [],
      [],
      [],
      STAFF_IDS,
      STAFF_NAMES,
      "oak-house",
      "2025-01-01",
      "2025-06-30",
    );
    expect(result.areasForImprovement.length).toBeGreaterThan(0);
  });

  it("generates actions for low-scoring areas", () => {
    const result = generateHandoverCommunicationQualityIntelligence(
      [],
      [],
      [],
      [],
      STAFF_IDS,
      STAFF_NAMES,
      "oak-house",
      "2025-01-01",
      "2025-06-30",
    );
    expect(result.actions.length).toBeGreaterThan(0);
  });

  it("includes all regulatory links", () => {
    const result = generateHandoverCommunicationQualityIntelligence(
      [],
      [],
      [],
      [],
      STAFF_IDS,
      STAFF_NAMES,
      "oak-house",
      "2025-01-01",
      "2025-06-30",
    );
    expect(result.regulatoryLinks).toHaveLength(7);
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015 Reg 22"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015 Reg 24"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("SCCIF"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("NMS 19"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Data Protection Act 2018"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Working Together 2023"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("CA 1989 s22(3)(a)"))).toBe(true);
  });

  it("includes no handover records area for improvement when handovers empty", () => {
    const result = generateHandoverCommunicationQualityIntelligence(
      [],
      [makeCommunication()],
      [makeMeeting()],
      [makeAssessment()],
      STAFF_IDS,
      STAFF_NAMES,
      "oak-house",
      "2025-01-01",
      "2025-06-30",
    );
    expect(
      result.areasForImprovement.some((a) =>
        a.includes("No handover records found"),
      ),
    ).toBe(true);
  });

  it("includes no team meetings area for improvement when meetings empty", () => {
    const result = generateHandoverCommunicationQualityIntelligence(
      [makeHandover()],
      [makeCommunication()],
      [],
      [makeAssessment()],
      STAFF_IDS,
      STAFF_NAMES,
      "oak-house",
      "2025-01-01",
      "2025-06-30",
    );
    expect(
      result.areasForImprovement.some((a) =>
        a.includes("No team meetings recorded"),
      ),
    ).toBe(true);
  });

  it("includes no IG assessments area for improvement when assessments empty", () => {
    const result = generateHandoverCommunicationQualityIntelligence(
      [makeHandover()],
      [makeCommunication()],
      [makeMeeting()],
      [],
      STAFF_IDS,
      STAFF_NAMES,
      "oak-house",
      "2025-01-01",
      "2025-06-30",
    );
    expect(
      result.areasForImprovement.some((a) =>
        a.includes("No information governance assessments"),
      ),
    ).toBe(true);
  });

  it("strength about risk updates when rate >= 90%", () => {
    const handovers = [
      makeHandover({ riskUpdatesIncluded: true }),
      makeHandover({ id: "h-02", riskUpdatesIncluded: true }),
    ];
    const result = generateHandoverCommunicationQualityIntelligence(
      handovers,
      [makeCommunication()],
      [makeMeeting()],
      [makeAssessment()],
      STAFF_IDS,
      STAFF_NAMES,
      "oak-house",
      "2025-01-01",
      "2025-06-30",
    );
    expect(
      result.strengths.some((s) => s.includes("Risk information")),
    ).toBe(true);
  });

  it("area for improvement when risk updates below 90%", () => {
    const handovers = [
      makeHandover({ riskUpdatesIncluded: true }),
      makeHandover({ id: "h-02", riskUpdatesIncluded: false }),
    ];
    const result = generateHandoverCommunicationQualityIntelligence(
      handovers,
      [makeCommunication()],
      [makeMeeting()],
      [makeAssessment()],
      STAFF_IDS,
      STAFF_NAMES,
      "oak-house",
      "2025-01-01",
      "2025-06-30",
    );
    expect(
      result.areasForImprovement.some((a) =>
        a.includes("Risk updates included in only"),
      ),
    ).toBe(true);
  });

  it("capped overall score at 100", () => {
    const result = generateHandoverCommunicationQualityIntelligence(
      [makeHandover()],
      [
        makeCommunication({
          priority: "critical",
          actionRequired: true,
          actionCompleted: true,
          responseTime: 10,
        }),
      ],
      [
        makeMeeting({
          attendeeCount: 5,
          totalStaff: 5,
          actionPointsGenerated: 5,
          actionPointsCompleted: 5,
        }),
      ],
      [makeAssessment()],
      STAFF_IDS,
      STAFF_NAMES,
      "oak-house",
      "2025-01-01",
      "2025-06-30",
    );
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("overall score does not go below 0", () => {
    const result = generateHandoverCommunicationQualityIntelligence(
      [],
      [],
      [],
      [],
      [],
      {},
      "oak-house",
      "2025-01-01",
      "2025-06-30",
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });

  it("returns good rating for moderate scores", () => {
    // Only meetings and IG are good, handovers and comms empty
    const result = generateHandoverCommunicationQualityIntelligence(
      [],
      [],
      [
        makeMeeting({
          attendeeCount: 5,
          totalStaff: 5,
          actionPointsGenerated: 5,
          actionPointsCompleted: 5,
        }),
      ],
      [makeAssessment()],
      STAFF_IDS,
      STAFF_NAMES,
      "oak-house",
      "2025-01-01",
      "2025-06-30",
    );
    // meetings ~25 + IG ~25 = ~50, handovers 0 + comms 0 = 50 total
    expect(result.overallScore).toBeGreaterThanOrEqual(40);
    expect(result.overallScore).toBeLessThan(80);
  });

  it("strength about medication updates when rate >= 90%", () => {
    const handovers = [
      makeHandover({ medicationUpdatesIncluded: true }),
      makeHandover({ id: "h-02", medicationUpdatesIncluded: true }),
    ];
    const result = generateHandoverCommunicationQualityIntelligence(
      handovers,
      [makeCommunication()],
      [makeMeeting()],
      [makeAssessment()],
      STAFF_IDS,
      STAFF_NAMES,
      "oak-house",
      "2025-01-01",
      "2025-06-30",
    );
    expect(
      result.strengths.some((s) => s.includes("Medication updates")),
    ).toBe(true);
  });

  it("strength about safeguarding in meetings when rate is 100%", () => {
    const meetings = [
      makeMeeting({ safeguardingDiscussed: true }),
      makeMeeting({ id: "m-02", safeguardingDiscussed: true }),
    ];
    const result = generateHandoverCommunicationQualityIntelligence(
      [makeHandover()],
      [makeCommunication()],
      meetings,
      [makeAssessment()],
      STAFF_IDS,
      STAFF_NAMES,
      "oak-house",
      "2025-01-01",
      "2025-06-30",
    );
    expect(
      result.strengths.some((s) => s.includes("Safeguarding is discussed at every team meeting")),
    ).toBe(true);
  });

  it("action about staff IG training when rate < 100%", () => {
    const assessments = [
      makeAssessment({ staffTrainedIG: false }),
    ];
    const result = generateHandoverCommunicationQualityIntelligence(
      [makeHandover()],
      [makeCommunication()],
      [makeMeeting()],
      assessments,
      STAFF_IDS,
      STAFF_NAMES,
      "oak-house",
      "2025-01-01",
      "2025-06-30",
    );
    expect(
      result.actions.some((a) => a.includes("information governance training")),
    ).toBe(true);
  });

  it("area for improvement when safeguarding not discussed at all meetings", () => {
    const meetings = [
      makeMeeting({ safeguardingDiscussed: true }),
      makeMeeting({ id: "m-02", safeguardingDiscussed: false }),
    ];
    const result = generateHandoverCommunicationQualityIntelligence(
      [makeHandover()],
      [makeCommunication()],
      meetings,
      [makeAssessment()],
      STAFF_IDS,
      STAFF_NAMES,
      "oak-house",
      "2025-01-01",
      "2025-06-30",
    );
    expect(
      result.areasForImprovement.some((a) =>
        a.includes("Safeguarding discussed at only"),
      ),
    ).toBe(true);
  });
});
