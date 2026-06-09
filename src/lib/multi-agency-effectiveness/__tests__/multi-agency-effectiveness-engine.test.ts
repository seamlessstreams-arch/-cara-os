// ══════════════════════════════════════════════════════════════════════════════
// TESTS — Multi-Agency Effectiveness Intelligence Engine
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateMeetingEffectiveness,
  evaluateInformationSharing,
  evaluateProfessionalRelationships,
  evaluateEscalations,
  buildChildMultiAgencyProfile,
  generateMultiAgencyEffectivenessIntelligence,
} from "../multi-agency-effectiveness-engine";
import type {
  MultiAgencyMeeting,
  InformationSharingRecord,
  ProfessionalRelationship,
  Escalation,
  AgencyType,
  MeetingType,
  MeetingOutcome,
  InformationSharingQuality,
} from "../multi-agency-effectiveness-engine";

// ── Factory Helpers ───────────────────────────────────────────────────────

const makeMeeting = (
  overrides: Partial<MultiAgencyMeeting> = {},
): MultiAgencyMeeting => ({
  id: "mtg-1",
  childId: "child-alex",
  childName: "Alex",
  date: "2026-05-01",
  meetingType: "LAC_review",
  chairedBy: "IRO Jane Smith",
  agenciesInvited: ["social_worker", "CAMHS", "education"],
  agenciesAttended: ["social_worker", "CAMHS", "education"],
  childParticipated: true,
  parentParticipated: false,
  homeStaffAttended: true,
  outcome: "all_actions_agreed",
  actionsAgreed: 5,
  actionsCompleted: 4,
  minutesCirculated: true,
  minutesTimely: true,
  ...overrides,
});

const makeSharingRecord = (
  overrides: Partial<InformationSharingRecord> = {},
): InformationSharingRecord => ({
  id: "share-1",
  childId: "child-alex",
  childName: "Alex",
  date: "2026-05-02",
  fromAgency: "social_worker",
  toAgency: "CAMHS",
  informationType: "Placement stability update",
  quality: "timely_complete",
  ...overrides,
});

const makeRelationship = (
  overrides: Partial<ProfessionalRelationship> = {},
): ProfessionalRelationship => ({
  id: "rel-1",
  agencyType: "social_worker",
  contactName: "Jane Adams",
  relationship: "strong",
  lastContact: "2026-05-10",
  responsiveness: "excellent",
  ...overrides,
});

const makeEscalation = (
  overrides: Partial<Escalation> = {},
): Escalation => ({
  id: "esc-1",
  childId: "child-alex",
  childName: "Alex",
  date: "2026-05-05",
  escalatedTo: "social_worker",
  reason: "Social worker not responding to LAC review requests",
  responseReceived: true,
  responseTimelyDays: 2,
  outcomeAchieved: true,
  resolution: "Meeting rescheduled and attended",
  ...overrides,
});

// ── Demo Data: Chamberlain House ──────────────────────────────────────────────────

const CHILD_IDS = ["child-alex", "child-jordan", "child-morgan"];

const demoMeetings: MultiAgencyMeeting[] = [
  makeMeeting({
    id: "mtg-001",
    childId: "child-alex",
    childName: "Alex",
    date: "2026-04-15",
    meetingType: "LAC_review",
    chairedBy: "IRO Jane Smith",
    agenciesInvited: ["social_worker", "CAMHS", "education", "IRO"],
    agenciesAttended: ["social_worker", "CAMHS", "education", "IRO"],
    childParticipated: true,
    parentParticipated: false,
    homeStaffAttended: true,
    outcome: "all_actions_agreed",
    actionsAgreed: 6,
    actionsCompleted: 5,
    minutesCirculated: true,
    minutesTimely: true,
  }),
  makeMeeting({
    id: "mtg-002",
    childId: "child-alex",
    childName: "Alex",
    date: "2026-04-22",
    meetingType: "PEP",
    chairedBy: "Virtual Head Mrs Clarke",
    agenciesInvited: ["social_worker", "education"],
    agenciesAttended: ["social_worker", "education"],
    childParticipated: true,
    parentParticipated: false,
    homeStaffAttended: true,
    outcome: "all_actions_agreed",
    actionsAgreed: 4,
    actionsCompleted: 4,
    minutesCirculated: true,
    minutesTimely: true,
  }),
  makeMeeting({
    id: "mtg-003",
    childId: "child-jordan",
    childName: "Jordan",
    date: "2026-04-18",
    meetingType: "CIN",
    chairedBy: "SW Team Manager",
    agenciesInvited: ["social_worker", "CAMHS", "education", "YOT"],
    agenciesAttended: ["social_worker", "education", "YOT"],
    childParticipated: false,
    parentParticipated: true,
    homeStaffAttended: true,
    outcome: "partial_agreement",
    actionsAgreed: 5,
    actionsCompleted: 3,
    minutesCirculated: true,
    minutesTimely: false,
  }),
  makeMeeting({
    id: "mtg-004",
    childId: "child-jordan",
    childName: "Jordan",
    date: "2026-05-01",
    meetingType: "strategy",
    chairedBy: "MASH Manager",
    agenciesInvited: ["social_worker", "police", "CAMHS"],
    agenciesAttended: ["social_worker", "police"],
    childParticipated: false,
    parentParticipated: false,
    homeStaffAttended: true,
    outcome: "escalated",
    actionsAgreed: 3,
    actionsCompleted: 2,
    minutesCirculated: true,
    minutesTimely: true,
  }),
  makeMeeting({
    id: "mtg-005",
    childId: "child-morgan",
    childName: "Morgan",
    date: "2026-04-20",
    meetingType: "LAC_review",
    chairedBy: "IRO Dr Ahmed",
    agenciesInvited: ["social_worker", "CAMHS", "education", "health_visitor", "IRO"],
    agenciesAttended: ["social_worker", "CAMHS", "health_visitor", "IRO"],
    childParticipated: true,
    parentParticipated: true,
    homeStaffAttended: true,
    outcome: "all_actions_agreed",
    actionsAgreed: 7,
    actionsCompleted: 6,
    minutesCirculated: true,
    minutesTimely: true,
  }),
  makeMeeting({
    id: "mtg-006",
    childId: "child-morgan",
    childName: "Morgan",
    date: "2026-05-03",
    meetingType: "health_review",
    chairedBy: "Dr Patel",
    agenciesInvited: ["health_visitor", "CAMHS"],
    agenciesAttended: ["health_visitor", "CAMHS"],
    childParticipated: true,
    parentParticipated: false,
    homeStaffAttended: true,
    outcome: "all_actions_agreed",
    actionsAgreed: 3,
    actionsCompleted: 3,
    minutesCirculated: true,
    minutesTimely: true,
  }),
  makeMeeting({
    id: "mtg-007",
    childId: "child-alex",
    childName: "Alex",
    date: "2026-05-06",
    meetingType: "professionals",
    chairedBy: "Sarah Johnson",
    agenciesInvited: ["social_worker", "CAMHS", "education", "therapist"],
    agenciesAttended: ["social_worker", "CAMHS", "therapist"],
    childParticipated: false,
    parentParticipated: false,
    homeStaffAttended: true,
    outcome: "partial_agreement",
    actionsAgreed: 4,
    actionsCompleted: 2,
    minutesCirculated: false,
    minutesTimely: false,
  }),
  makeMeeting({
    id: "mtg-008",
    childId: "child-jordan",
    childName: "Jordan",
    date: "2026-05-10",
    meetingType: "risk_management",
    chairedBy: "Darren Laville",
    agenciesInvited: ["social_worker", "police", "YOT", "CAMHS"],
    agenciesAttended: ["social_worker", "police", "YOT", "CAMHS"],
    childParticipated: true,
    parentParticipated: false,
    homeStaffAttended: true,
    outcome: "all_actions_agreed",
    actionsAgreed: 5,
    actionsCompleted: 5,
    minutesCirculated: true,
    minutesTimely: true,
  }),
];

const demoSharingRecords: InformationSharingRecord[] = [
  makeSharingRecord({
    id: "share-001",
    childId: "child-alex",
    childName: "Alex",
    date: "2026-04-16",
    fromAgency: "social_worker",
    toAgency: "CAMHS",
    informationType: "Care plan update",
    quality: "timely_complete",
  }),
  makeSharingRecord({
    id: "share-002",
    childId: "child-alex",
    childName: "Alex",
    date: "2026-04-20",
    fromAgency: "CAMHS",
    toAgency: "social_worker",
    informationType: "CAMHS assessment summary",
    quality: "timely_complete",
  }),
  makeSharingRecord({
    id: "share-003",
    childId: "child-jordan",
    childName: "Jordan",
    date: "2026-04-19",
    fromAgency: "education",
    toAgency: "social_worker",
    informationType: "School attendance report",
    quality: "timely_incomplete",
  }),
  makeSharingRecord({
    id: "share-004",
    childId: "child-jordan",
    childName: "Jordan",
    date: "2026-04-25",
    fromAgency: "YOT",
    toAgency: "social_worker",
    informationType: "YOT intervention report",
    quality: "delayed_complete",
  }),
  makeSharingRecord({
    id: "share-005",
    childId: "child-morgan",
    childName: "Morgan",
    date: "2026-04-21",
    fromAgency: "health_visitor",
    toAgency: "social_worker",
    informationType: "Health assessment",
    quality: "timely_complete",
  }),
  makeSharingRecord({
    id: "share-006",
    childId: "child-morgan",
    childName: "Morgan",
    date: "2026-05-01",
    fromAgency: "CAMHS",
    toAgency: "education",
    informationType: "Emotional wellbeing report",
    quality: "timely_complete",
  }),
  makeSharingRecord({
    id: "share-007",
    childId: "child-alex",
    childName: "Alex",
    date: "2026-05-03",
    fromAgency: "therapist",
    toAgency: "social_worker",
    informationType: "Therapy progress report",
    quality: "delayed_incomplete",
  }),
  makeSharingRecord({
    id: "share-008",
    childId: "child-jordan",
    childName: "Jordan",
    date: "2026-05-05",
    fromAgency: "police",
    toAgency: "social_worker",
    informationType: "Missing episode debrief",
    quality: "timely_complete",
  }),
  makeSharingRecord({
    id: "share-009",
    childId: "child-morgan",
    childName: "Morgan",
    date: "2026-05-07",
    fromAgency: "education",
    toAgency: "CAMHS",
    informationType: "EHCP review notes",
    quality: "delayed_complete",
  }),
  makeSharingRecord({
    id: "share-010",
    childId: "child-jordan",
    childName: "Jordan",
    date: "2026-05-08",
    fromAgency: "social_worker",
    toAgency: "YOT",
    informationType: "Placement plan update",
    quality: "not_shared",
  }),
  makeSharingRecord({
    id: "share-011",
    childId: "child-alex",
    childName: "Alex",
    date: "2026-05-10",
    fromAgency: "education",
    toAgency: "social_worker",
    informationType: "PEP follow-up",
    quality: "timely_complete",
  }),
];

const demoRelationships: ProfessionalRelationship[] = [
  makeRelationship({
    id: "rel-001",
    agencyType: "social_worker",
    contactName: "Jane Adams",
    relationship: "strong",
    lastContact: "2026-05-10",
    responsiveness: "excellent",
    jointWorkingQuality: "Excellent collaborative working on care plans",
  }),
  makeRelationship({
    id: "rel-002",
    agencyType: "CAMHS",
    contactName: "Dr Sarah Mitchell",
    relationship: "strong",
    lastContact: "2026-05-08",
    responsiveness: "good",
    jointWorkingQuality: "Regular joint sessions for children with complex needs",
  }),
  makeRelationship({
    id: "rel-003",
    agencyType: "education",
    contactName: "Mrs Helen Clarke",
    relationship: "adequate",
    lastContact: "2026-05-06",
    responsiveness: "good",
    jointWorkingQuality: "Good PEP attendance but follow-up could improve",
  }),
  makeRelationship({
    id: "rel-004",
    agencyType: "health_visitor",
    contactName: "Nurse Thompson",
    relationship: "developing",
    lastContact: "2026-04-28",
    responsiveness: "adequate",
  }),
  makeRelationship({
    id: "rel-005",
    agencyType: "IRO",
    contactName: "Dr Ahmed",
    relationship: "strong",
    lastContact: "2026-05-10",
    responsiveness: "excellent",
  }),
  makeRelationship({
    id: "rel-006",
    agencyType: "YOT",
    contactName: "Mark Davies",
    relationship: "adequate",
    lastContact: "2026-05-05",
    responsiveness: "adequate",
  }),
];

const demoEscalations: Escalation[] = [
  makeEscalation({
    id: "esc-001",
    childId: "child-jordan",
    childName: "Jordan",
    date: "2026-04-25",
    escalatedTo: "social_worker",
    reason: "Social worker not responding to CIN review requests",
    responseReceived: true,
    responseTimelyDays: 3,
    outcomeAchieved: true,
    resolution: "Meeting rescheduled within 5 working days",
  }),
  makeEscalation({
    id: "esc-002",
    childId: "child-alex",
    childName: "Alex",
    date: "2026-05-02",
    escalatedTo: "CAMHS",
    reason: "CAMHS appointment repeatedly cancelled",
    responseReceived: true,
    responseTimelyDays: 7,
    outcomeAchieved: true,
    resolution: "Priority appointment arranged",
  }),
  makeEscalation({
    id: "esc-003",
    childId: "child-jordan",
    childName: "Jordan",
    date: "2026-05-06",
    escalatedTo: "police",
    reason: "Inadequate response to missing episode",
    responseReceived: true,
    responseTimelyDays: 1,
    outcomeAchieved: false,
    resolution: "Under review with senior officer",
  }),
  makeEscalation({
    id: "esc-004",
    childId: "child-morgan",
    childName: "Morgan",
    date: "2026-05-09",
    escalatedTo: "education",
    reason: "EHCP provision not being delivered",
    responseReceived: false,
    outcomeAchieved: false,
  }),
];

// ══════════════════════════════════════════════════════════════════════════════
// 1. evaluateMeetingEffectiveness
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateMeetingEffectiveness", () => {
  it("returns zero defaults for empty array", () => {
    const result = evaluateMeetingEffectiveness([]);
    expect(result.totalMeetings).toBe(0);
    expect(result.overallAttendanceRate).toBe(0);
    expect(result.agencyAttendanceRate).toBe(0);
    expect(result.childParticipationRate).toBe(0);
    expect(result.parentParticipationRate).toBe(0);
    expect(result.homeStaffAttendanceRate).toBe(0);
    expect(result.actionCompletionRate).toBe(0);
    expect(result.minutesCirculationRate).toBe(0);
    expect(result.minutesTimelinessRate).toBe(0);
  });

  it("returns zero outcome breakdown for empty array", () => {
    const result = evaluateMeetingEffectiveness([]);
    expect(result.outcomeBreakdown).toEqual({
      all_actions_agreed: 0,
      partial_agreement: 0,
      deferred: 0,
      escalated: 0,
    });
  });

  it("returns zero meeting type breakdown for empty array", () => {
    const result = evaluateMeetingEffectiveness([]);
    expect(result.meetingTypeBreakdown).toEqual({
      strategy: 0,
      CIN: 0,
      LAC_review: 0,
      PEP: 0,
      health_review: 0,
      professionals: 0,
      discharge_planning: 0,
      risk_management: 0,
      other: 0,
    });
  });

  it("counts total meetings correctly", () => {
    const result = evaluateMeetingEffectiveness(demoMeetings);
    expect(result.totalMeetings).toBe(8);
  });

  it("calculates agency attendance rate correctly", () => {
    // Single meeting: 3 invited, 3 attended = 100%
    const m = makeMeeting({
      agenciesInvited: ["social_worker", "CAMHS", "education"],
      agenciesAttended: ["social_worker", "CAMHS", "education"],
    });
    const result = evaluateMeetingEffectiveness([m]);
    expect(result.agencyAttendanceRate).toBe(100);
  });

  it("calculates partial agency attendance correctly", () => {
    const m = makeMeeting({
      agenciesInvited: ["social_worker", "CAMHS", "education", "IRO"],
      agenciesAttended: ["social_worker", "CAMHS"],
    });
    const result = evaluateMeetingEffectiveness([m]);
    expect(result.agencyAttendanceRate).toBe(50);
  });

  it("calculates child participation rate", () => {
    const meetings = [
      makeMeeting({ id: "m1", childParticipated: true }),
      makeMeeting({ id: "m2", childParticipated: false }),
      makeMeeting({ id: "m3", childParticipated: true }),
      makeMeeting({ id: "m4", childParticipated: true }),
    ];
    const result = evaluateMeetingEffectiveness(meetings);
    expect(result.childParticipationRate).toBe(75);
  });

  it("calculates parent participation rate", () => {
    const meetings = [
      makeMeeting({ id: "m1", parentParticipated: true }),
      makeMeeting({ id: "m2", parentParticipated: false }),
    ];
    const result = evaluateMeetingEffectiveness(meetings);
    expect(result.parentParticipationRate).toBe(50);
  });

  it("calculates home staff attendance rate", () => {
    const meetings = [
      makeMeeting({ id: "m1", homeStaffAttended: true }),
      makeMeeting({ id: "m2", homeStaffAttended: true }),
      makeMeeting({ id: "m3", homeStaffAttended: false }),
    ];
    const result = evaluateMeetingEffectiveness(meetings);
    expect(result.homeStaffAttendanceRate).toBeCloseTo(66.7, 0);
  });

  it("calculates action completion rate", () => {
    const meetings = [
      makeMeeting({ id: "m1", actionsAgreed: 10, actionsCompleted: 8 }),
      makeMeeting({ id: "m2", actionsAgreed: 5, actionsCompleted: 5 }),
    ];
    const result = evaluateMeetingEffectiveness(meetings);
    // 13/15 = 86.7%
    expect(result.actionCompletionRate).toBeCloseTo(86.7, 0);
  });

  it("handles zero actions agreed", () => {
    const meetings = [
      makeMeeting({ id: "m1", actionsAgreed: 0, actionsCompleted: 0 }),
    ];
    const result = evaluateMeetingEffectiveness(meetings);
    expect(result.actionCompletionRate).toBe(0);
  });

  it("calculates minutes circulation rate", () => {
    const meetings = [
      makeMeeting({ id: "m1", minutesCirculated: true }),
      makeMeeting({ id: "m2", minutesCirculated: false }),
      makeMeeting({ id: "m3", minutesCirculated: true }),
    ];
    const result = evaluateMeetingEffectiveness(meetings);
    expect(result.minutesCirculationRate).toBeCloseTo(66.7, 0);
  });

  it("calculates minutes timeliness rate (among circulated only)", () => {
    const meetings = [
      makeMeeting({ id: "m1", minutesCirculated: true, minutesTimely: true }),
      makeMeeting({ id: "m2", minutesCirculated: true, minutesTimely: false }),
      makeMeeting({ id: "m3", minutesCirculated: false, minutesTimely: false }),
    ];
    const result = evaluateMeetingEffectiveness(meetings);
    // 1 timely out of 2 circulated = 50%
    expect(result.minutesTimelinessRate).toBe(50);
  });

  it("counts outcome breakdown correctly", () => {
    const meetings = [
      makeMeeting({ id: "m1", outcome: "all_actions_agreed" }),
      makeMeeting({ id: "m2", outcome: "all_actions_agreed" }),
      makeMeeting({ id: "m3", outcome: "partial_agreement" }),
      makeMeeting({ id: "m4", outcome: "deferred" }),
      makeMeeting({ id: "m5", outcome: "escalated" }),
    ];
    const result = evaluateMeetingEffectiveness(meetings);
    expect(result.outcomeBreakdown.all_actions_agreed).toBe(2);
    expect(result.outcomeBreakdown.partial_agreement).toBe(1);
    expect(result.outcomeBreakdown.deferred).toBe(1);
    expect(result.outcomeBreakdown.escalated).toBe(1);
  });

  it("counts meeting type breakdown correctly", () => {
    const result = evaluateMeetingEffectiveness(demoMeetings);
    expect(result.meetingTypeBreakdown.LAC_review).toBe(2);
    expect(result.meetingTypeBreakdown.PEP).toBe(1);
    expect(result.meetingTypeBreakdown.CIN).toBe(1);
    expect(result.meetingTypeBreakdown.strategy).toBe(1);
    expect(result.meetingTypeBreakdown.health_review).toBe(1);
    expect(result.meetingTypeBreakdown.professionals).toBe(1);
    expect(result.meetingTypeBreakdown.risk_management).toBe(1);
  });

  it("handles single meeting with all perfect metrics", () => {
    const m = makeMeeting({
      agenciesInvited: ["social_worker"],
      agenciesAttended: ["social_worker"],
      childParticipated: true,
      parentParticipated: true,
      homeStaffAttended: true,
      actionsAgreed: 3,
      actionsCompleted: 3,
      minutesCirculated: true,
      minutesTimely: true,
      outcome: "all_actions_agreed",
    });
    const result = evaluateMeetingEffectiveness([m]);
    expect(result.agencyAttendanceRate).toBe(100);
    expect(result.childParticipationRate).toBe(100);
    expect(result.parentParticipationRate).toBe(100);
    expect(result.homeStaffAttendanceRate).toBe(100);
    expect(result.actionCompletionRate).toBe(100);
    expect(result.minutesCirculationRate).toBe(100);
    expect(result.minutesTimelinessRate).toBe(100);
  });

  it("handles demo meetings with expected total", () => {
    const result = evaluateMeetingEffectiveness(demoMeetings);
    expect(result.totalMeetings).toBe(8);
    expect(result.agencyAttendanceRate).toBeGreaterThan(0);
    expect(result.childParticipationRate).toBeGreaterThan(0);
    expect(result.actionCompletionRate).toBeGreaterThan(0);
  });

  it("overall attendance rate equals agency attendance rate", () => {
    const result = evaluateMeetingEffectiveness(demoMeetings);
    expect(result.overallAttendanceRate).toBe(result.agencyAttendanceRate);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. evaluateInformationSharing
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateInformationSharing", () => {
  it("returns zero defaults for empty array", () => {
    const result = evaluateInformationSharing([]);
    expect(result.totalRecords).toBe(0);
    expect(result.timelinessRate).toBe(0);
    expect(result.completenessRate).toBe(0);
    expect(result.perAgencyAnalysis).toEqual([]);
  });

  it("returns zero quality distribution for empty array", () => {
    const result = evaluateInformationSharing([]);
    expect(result.qualityDistribution).toEqual({
      timely_complete: 0,
      timely_incomplete: 0,
      delayed_complete: 0,
      delayed_incomplete: 0,
      not_shared: 0,
    });
  });

  it("counts total records", () => {
    const result = evaluateInformationSharing(demoSharingRecords);
    expect(result.totalRecords).toBe(11);
  });

  it("calculates timeliness rate (timely_complete + timely_incomplete)", () => {
    const records = [
      makeSharingRecord({ id: "s1", quality: "timely_complete" }),
      makeSharingRecord({ id: "s2", quality: "timely_incomplete" }),
      makeSharingRecord({ id: "s3", quality: "delayed_complete" }),
      makeSharingRecord({ id: "s4", quality: "delayed_incomplete" }),
    ];
    const result = evaluateInformationSharing(records);
    expect(result.timelinessRate).toBe(50);
  });

  it("calculates completeness rate (timely_complete + delayed_complete)", () => {
    const records = [
      makeSharingRecord({ id: "s1", quality: "timely_complete" }),
      makeSharingRecord({ id: "s2", quality: "timely_incomplete" }),
      makeSharingRecord({ id: "s3", quality: "delayed_complete" }),
      makeSharingRecord({ id: "s4", quality: "delayed_incomplete" }),
    ];
    const result = evaluateInformationSharing(records);
    expect(result.completenessRate).toBe(50);
  });

  it("counts quality distribution correctly", () => {
    const records = [
      makeSharingRecord({ id: "s1", quality: "timely_complete" }),
      makeSharingRecord({ id: "s2", quality: "timely_complete" }),
      makeSharingRecord({ id: "s3", quality: "delayed_incomplete" }),
      makeSharingRecord({ id: "s4", quality: "not_shared" }),
    ];
    const result = evaluateInformationSharing(records);
    expect(result.qualityDistribution.timely_complete).toBe(2);
    expect(result.qualityDistribution.delayed_incomplete).toBe(1);
    expect(result.qualityDistribution.not_shared).toBe(1);
  });

  it("generates per-agency analysis grouped by fromAgency", () => {
    const records = [
      makeSharingRecord({ id: "s1", fromAgency: "social_worker", quality: "timely_complete" }),
      makeSharingRecord({ id: "s2", fromAgency: "social_worker", quality: "delayed_complete" }),
      makeSharingRecord({ id: "s3", fromAgency: "CAMHS", quality: "timely_complete" }),
    ];
    const result = evaluateInformationSharing(records);
    expect(result.perAgencyAnalysis.length).toBe(2);

    const sw = result.perAgencyAnalysis.find((a) => a.agency === "social_worker");
    expect(sw).toBeDefined();
    expect(sw!.totalRecords).toBe(2);
    expect(sw!.timelinessRate).toBe(50);
    expect(sw!.completenessRate).toBe(100);

    const camhs = result.perAgencyAnalysis.find((a) => a.agency === "CAMHS");
    expect(camhs).toBeDefined();
    expect(camhs!.totalRecords).toBe(1);
    expect(camhs!.timelinessRate).toBe(100);
  });

  it("handles all timely_complete records", () => {
    const records = [
      makeSharingRecord({ id: "s1", quality: "timely_complete" }),
      makeSharingRecord({ id: "s2", quality: "timely_complete" }),
    ];
    const result = evaluateInformationSharing(records);
    expect(result.timelinessRate).toBe(100);
    expect(result.completenessRate).toBe(100);
  });

  it("handles all not_shared records", () => {
    const records = [
      makeSharingRecord({ id: "s1", quality: "not_shared" }),
      makeSharingRecord({ id: "s2", quality: "not_shared" }),
    ];
    const result = evaluateInformationSharing(records);
    expect(result.timelinessRate).toBe(0);
    expect(result.completenessRate).toBe(0);
  });

  it("handles demo sharing records", () => {
    const result = evaluateInformationSharing(demoSharingRecords);
    expect(result.totalRecords).toBe(11);
    expect(result.timelinessRate).toBeGreaterThan(0);
    expect(result.completenessRate).toBeGreaterThan(0);
    expect(result.perAgencyAnalysis.length).toBeGreaterThan(0);
  });

  it("single record returns correct timeliness for timely_incomplete", () => {
    const records = [
      makeSharingRecord({ id: "s1", quality: "timely_incomplete" }),
    ];
    const result = evaluateInformationSharing(records);
    expect(result.timelinessRate).toBe(100);
    expect(result.completenessRate).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. evaluateProfessionalRelationships
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateProfessionalRelationships", () => {
  it("returns zero defaults for empty array", () => {
    const result = evaluateProfessionalRelationships([]);
    expect(result.totalRelationships).toBe(0);
    expect(result.strongCount).toBe(0);
    expect(result.adequateCount).toBe(0);
    expect(result.developingCount).toBe(0);
    expect(result.poorCount).toBe(0);
  });

  it("returns uncovered key agencies for empty array", () => {
    const result = evaluateProfessionalRelationships([]);
    expect(result.coverageOfKeyAgencies.length).toBe(5);
    expect(result.coverageOfKeyAgencies.every((c) => !c.covered)).toBe(true);
  });

  it("returns zero responsiveness breakdown for empty array", () => {
    const result = evaluateProfessionalRelationships([]);
    expect(result.responsivenessBreakdown).toEqual({
      excellent: 0,
      good: 0,
      adequate: 0,
      poor: 0,
    });
  });

  it("counts relationship quality breakdown", () => {
    const rels = [
      makeRelationship({ id: "r1", relationship: "strong" }),
      makeRelationship({ id: "r2", relationship: "strong" }),
      makeRelationship({ id: "r3", relationship: "adequate" }),
      makeRelationship({ id: "r4", relationship: "developing" }),
      makeRelationship({ id: "r5", relationship: "poor" }),
    ];
    const result = evaluateProfessionalRelationships(rels);
    expect(result.totalRelationships).toBe(5);
    expect(result.strongCount).toBe(2);
    expect(result.adequateCount).toBe(1);
    expect(result.developingCount).toBe(1);
    expect(result.poorCount).toBe(1);
  });

  it("counts responsiveness breakdown", () => {
    const rels = [
      makeRelationship({ id: "r1", responsiveness: "excellent" }),
      makeRelationship({ id: "r2", responsiveness: "good" }),
      makeRelationship({ id: "r3", responsiveness: "adequate" }),
      makeRelationship({ id: "r4", responsiveness: "poor" }),
    ];
    const result = evaluateProfessionalRelationships(rels);
    expect(result.responsivenessBreakdown["excellent"]).toBe(1);
    expect(result.responsivenessBreakdown["good"]).toBe(1);
    expect(result.responsivenessBreakdown["adequate"]).toBe(1);
    expect(result.responsivenessBreakdown["poor"]).toBe(1);
  });

  it("identifies covered key agencies", () => {
    const rels = [
      makeRelationship({ id: "r1", agencyType: "social_worker", relationship: "strong" }),
      makeRelationship({ id: "r2", agencyType: "CAMHS", relationship: "adequate" }),
      makeRelationship({ id: "r3", agencyType: "education", relationship: "developing" }),
    ];
    const result = evaluateProfessionalRelationships(rels);

    const sw = result.coverageOfKeyAgencies.find((c) => c.agency === "social_worker");
    expect(sw!.covered).toBe(true);
    expect(sw!.quality).toBe("strong");

    const camhs = result.coverageOfKeyAgencies.find((c) => c.agency === "CAMHS");
    expect(camhs!.covered).toBe(true);

    const hv = result.coverageOfKeyAgencies.find((c) => c.agency === "health_visitor");
    expect(hv!.covered).toBe(false);
  });

  it("reports all key agencies as covered in demo data", () => {
    const result = evaluateProfessionalRelationships(demoRelationships);
    const covered = result.coverageOfKeyAgencies.filter((c) => c.covered);
    expect(covered.length).toBe(5);
  });

  it("handles demo relationships correctly", () => {
    const result = evaluateProfessionalRelationships(demoRelationships);
    expect(result.totalRelationships).toBe(6);
    expect(result.strongCount).toBe(3);
    expect(result.adequateCount).toBe(2);
    expect(result.developingCount).toBe(1);
    expect(result.poorCount).toBe(0);
  });

  it("handles non-key agency types", () => {
    const rels = [
      makeRelationship({ id: "r1", agencyType: "YOT", relationship: "strong" }),
    ];
    const result = evaluateProfessionalRelationships(rels);
    expect(result.totalRelationships).toBe(1);
    // YOT is not a key agency so coverage of key agencies should all be false
    expect(result.coverageOfKeyAgencies.every((c) => !c.covered)).toBe(true);
  });

  it("all strong relationships have correct count", () => {
    const rels = [
      makeRelationship({ id: "r1", relationship: "strong" }),
      makeRelationship({ id: "r2", relationship: "strong" }),
      makeRelationship({ id: "r3", relationship: "strong" }),
    ];
    const result = evaluateProfessionalRelationships(rels);
    expect(result.strongCount).toBe(3);
    expect(result.adequateCount).toBe(0);
    expect(result.developingCount).toBe(0);
    expect(result.poorCount).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. evaluateEscalations
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateEscalations", () => {
  it("returns zero defaults for empty array", () => {
    const result = evaluateEscalations([]);
    expect(result.totalEscalations).toBe(0);
    expect(result.responseRate).toBe(0);
    expect(result.timelinessRate).toBe(0);
    expect(result.outcomeAchievementRate).toBe(0);
    expect(result.averageResponseDays).toBe(0);
    expect(result.perAgencyBreakdown).toEqual([]);
  });

  it("counts total escalations", () => {
    const result = evaluateEscalations(demoEscalations);
    expect(result.totalEscalations).toBe(4);
  });

  it("calculates response rate", () => {
    const result = evaluateEscalations(demoEscalations);
    // 3 out of 4 responded
    expect(result.responseRate).toBe(75);
  });

  it("calculates timeliness rate (response <= 5 days among responded)", () => {
    const result = evaluateEscalations(demoEscalations);
    // 3 responded: days 3, 7, 1 — only 3 and 1 are <= 5
    // So 2 out of 3 = 66.7%
    expect(result.timelinessRate).toBeCloseTo(66.7, 0);
  });

  it("calculates outcome achievement rate", () => {
    const result = evaluateEscalations(demoEscalations);
    // 2 out of 4 achieved
    expect(result.outcomeAchievementRate).toBe(50);
  });

  it("calculates average response days", () => {
    const result = evaluateEscalations(demoEscalations);
    // (3 + 7 + 1) / 3 = 3.666...
    expect(result.averageResponseDays).toBeCloseTo(3.7, 0);
  });

  it("generates per-agency breakdown", () => {
    const result = evaluateEscalations(demoEscalations);
    expect(result.perAgencyBreakdown.length).toBeGreaterThan(0);
    const sw = result.perAgencyBreakdown.find((a) => a.agency === "social_worker");
    expect(sw).toBeDefined();
    expect(sw!.count).toBe(1);
    expect(sw!.responseRate).toBe(100);
  });

  it("handles all responded escalations", () => {
    const escalations = [
      makeEscalation({ id: "e1", responseReceived: true, responseTimelyDays: 2, outcomeAchieved: true }),
      makeEscalation({ id: "e2", responseReceived: true, responseTimelyDays: 4, outcomeAchieved: true }),
    ];
    const result = evaluateEscalations(escalations);
    expect(result.responseRate).toBe(100);
    expect(result.timelinessRate).toBe(100);
    expect(result.outcomeAchievementRate).toBe(100);
    expect(result.averageResponseDays).toBe(3);
  });

  it("handles no responses", () => {
    const escalations = [
      makeEscalation({ id: "e1", responseReceived: false, responseTimelyDays: undefined, outcomeAchieved: false }),
      makeEscalation({ id: "e2", responseReceived: false, responseTimelyDays: undefined, outcomeAchieved: false }),
    ];
    const result = evaluateEscalations(escalations);
    expect(result.responseRate).toBe(0);
    expect(result.timelinessRate).toBe(0);
    expect(result.outcomeAchievementRate).toBe(0);
    expect(result.averageResponseDays).toBe(0);
  });

  it("handles response without responseTimelyDays", () => {
    const escalations = [
      makeEscalation({ id: "e1", responseReceived: true, responseTimelyDays: undefined, outcomeAchieved: true }),
    ];
    const result = evaluateEscalations(escalations);
    expect(result.responseRate).toBe(100);
    // No recorded timely days means not counted as timely
    expect(result.timelinessRate).toBe(0);
    expect(result.averageResponseDays).toBe(0);
  });

  it("escalation exactly at 5 days is timely", () => {
    const escalations = [
      makeEscalation({ id: "e1", responseReceived: true, responseTimelyDays: 5, outcomeAchieved: true }),
    ];
    const result = evaluateEscalations(escalations);
    expect(result.timelinessRate).toBe(100);
  });

  it("escalation at 6 days is not timely", () => {
    const escalations = [
      makeEscalation({ id: "e1", responseReceived: true, responseTimelyDays: 6, outcomeAchieved: true }),
    ];
    const result = evaluateEscalations(escalations);
    expect(result.timelinessRate).toBe(0);
  });

  it("per-agency breakdown groups by escalatedTo", () => {
    const escalations = [
      makeEscalation({ id: "e1", escalatedTo: "CAMHS", responseReceived: true, outcomeAchieved: true }),
      makeEscalation({ id: "e2", escalatedTo: "CAMHS", responseReceived: false, outcomeAchieved: false }),
      makeEscalation({ id: "e3", escalatedTo: "police", responseReceived: true, outcomeAchieved: true }),
    ];
    const result = evaluateEscalations(escalations);
    const camhs = result.perAgencyBreakdown.find((a) => a.agency === "CAMHS");
    expect(camhs!.count).toBe(2);
    expect(camhs!.responseRate).toBe(50);
    expect(camhs!.outcomeRate).toBe(50);

    const police = result.perAgencyBreakdown.find((a) => a.agency === "police");
    expect(police!.count).toBe(1);
    expect(police!.responseRate).toBe(100);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. buildChildMultiAgencyProfile
// ══════════════════════════════════════════════════════════════════════════════

describe("buildChildMultiAgencyProfile", () => {
  it("returns profiles for all requested childIds", () => {
    const profiles = buildChildMultiAgencyProfile(
      demoMeetings,
      demoSharingRecords,
      demoEscalations,
      CHILD_IDS,
    );
    expect(profiles.length).toBe(3);
    expect(profiles.map((p) => p.childId)).toEqual(CHILD_IDS);
  });

  it("resolves child name from meetings", () => {
    const profiles = buildChildMultiAgencyProfile(
      demoMeetings,
      demoSharingRecords,
      demoEscalations,
      CHILD_IDS,
    );
    expect(profiles[0].childName).toBe("Alex");
    expect(profiles[1].childName).toBe("Jordan");
    expect(profiles[2].childName).toBe("Morgan");
  });

  it("falls back to childId when no records match", () => {
    const profiles = buildChildMultiAgencyProfile([], [], [], ["unknown-child"]);
    expect(profiles[0].childName).toBe("unknown-child");
  });

  it("counts meetings per child", () => {
    const profiles = buildChildMultiAgencyProfile(
      demoMeetings,
      demoSharingRecords,
      demoEscalations,
      CHILD_IDS,
    );
    // Alex: mtg-001, mtg-002, mtg-007 = 3
    expect(profiles[0].meetingCount).toBe(3);
    // Jordan: mtg-003, mtg-004, mtg-008 = 3
    expect(profiles[1].meetingCount).toBe(3);
    // Morgan: mtg-005, mtg-006 = 2
    expect(profiles[2].meetingCount).toBe(2);
  });

  it("derives unique meeting types per child", () => {
    const profiles = buildChildMultiAgencyProfile(
      demoMeetings,
      demoSharingRecords,
      demoEscalations,
      CHILD_IDS,
    );
    // Alex has LAC_review, PEP, professionals
    expect(profiles[0].meetingTypes).toContain("LAC_review");
    expect(profiles[0].meetingTypes).toContain("PEP");
    expect(profiles[0].meetingTypes).toContain("professionals");
  });

  it("collects agencies from meetings, sharing, and escalations", () => {
    const profiles = buildChildMultiAgencyProfile(
      demoMeetings,
      demoSharingRecords,
      demoEscalations,
      CHILD_IDS,
    );
    // Alex should have social_worker, CAMHS, education, IRO, therapist
    expect(profiles[0].agenciesInvolved).toContain("social_worker");
    expect(profiles[0].agenciesInvolved).toContain("CAMHS");
    expect(profiles[0].agenciesInvolved).toContain("education");
  });

  it("calculates information sharing quality score", () => {
    const profiles = buildChildMultiAgencyProfile(
      demoMeetings,
      demoSharingRecords,
      demoEscalations,
      CHILD_IDS,
    );
    // Alex has records: timely_complete (100), timely_complete (100), delayed_incomplete (25), timely_complete (100)
    // Average = (100+100+25+100)/4 = 81.25
    expect(profiles[0].informationSharingQuality).toBeCloseTo(81.3, 0);
  });

  it("returns 0 info sharing quality when no records exist", () => {
    const profiles = buildChildMultiAgencyProfile([], [], [], ["child-none"]);
    expect(profiles[0].informationSharingQuality).toBe(0);
  });

  it("counts escalations per child", () => {
    const profiles = buildChildMultiAgencyProfile(
      demoMeetings,
      demoSharingRecords,
      demoEscalations,
      CHILD_IDS,
    );
    // Jordan has 2 escalations
    expect(profiles[1].escalationCount).toBe(2);
    // Morgan has 1
    expect(profiles[2].escalationCount).toBe(1);
  });

  it("counts resolved escalations", () => {
    const profiles = buildChildMultiAgencyProfile(
      demoMeetings,
      demoSharingRecords,
      demoEscalations,
      CHILD_IDS,
    );
    // Alex: esc-002 achieved = 1
    expect(profiles[0].escalationsResolved).toBe(1);
    // Jordan: esc-001 achieved, esc-003 not = 1
    expect(profiles[1].escalationsResolved).toBe(1);
  });

  it("assigns engagement rating based on factors", () => {
    const profiles = buildChildMultiAgencyProfile(
      demoMeetings,
      demoSharingRecords,
      demoEscalations,
      CHILD_IDS,
    );
    // Each child should have a valid engagement rating
    for (const p of profiles) {
      expect(["strong", "adequate", "limited", "poor"]).toContain(
        p.overallEngagement,
      );
    }
  });

  it("child with no data gets poor engagement", () => {
    const profiles = buildChildMultiAgencyProfile([], [], [], ["child-none"]);
    expect(profiles[0].overallEngagement).toBe("poor");
    expect(profiles[0].meetingCount).toBe(0);
    expect(profiles[0].agenciesInvolved).toEqual([]);
    expect(profiles[0].escalationCount).toBe(0);
  });

  it("resolves child name from sharing records when no meetings", () => {
    const sharing = [
      makeSharingRecord({ childId: "child-test", childName: "TestChild" }),
    ];
    const profiles = buildChildMultiAgencyProfile([], sharing, [], ["child-test"]);
    expect(profiles[0].childName).toBe("TestChild");
  });

  it("resolves child name from escalations when no meetings or sharing", () => {
    const escalations = [
      makeEscalation({ childId: "child-test", childName: "EscChild" }),
    ];
    const profiles = buildChildMultiAgencyProfile([], [], escalations, ["child-test"]);
    expect(profiles[0].childName).toBe("EscChild");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. generateMultiAgencyEffectivenessIntelligence — Full report
// ══════════════════════════════════════════════════════════════════════════════

describe("generateMultiAgencyEffectivenessIntelligence", () => {
  const generate = () =>
    generateMultiAgencyEffectivenessIntelligence(
      demoMeetings,
      demoSharingRecords,
      demoRelationships,
      demoEscalations,
      CHILD_IDS,
      "oak-house",
      "2026-04-15",
      "2026-05-15",
      "2026-05-15",
    );

  it("returns correct homeId", () => {
    const result = generate();
    expect(result.homeId).toBe("oak-house");
  });

  it("returns correct period", () => {
    const result = generate();
    expect(result.periodStart).toBe("2026-04-15");
    expect(result.periodEnd).toBe("2026-05-15");
  });

  it("returns overall score between 0 and 100", () => {
    const result = generate();
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("returns a valid rating", () => {
    const result = generate();
    expect(["outstanding", "good", "requires_improvement", "inadequate"]).toContain(
      result.rating,
    );
  });

  it("includes meeting effectiveness sub-result", () => {
    const result = generate();
    expect(result.meetingEffectiveness.totalMeetings).toBe(8);
    expect(result.meetingEffectiveness.agencyAttendanceRate).toBeGreaterThan(0);
  });

  it("includes information sharing sub-result", () => {
    const result = generate();
    expect(result.informationSharing.totalRecords).toBe(11);
    expect(result.informationSharing.timelinessRate).toBeGreaterThan(0);
  });

  it("includes professional relationships sub-result", () => {
    const result = generate();
    expect(result.professionalRelationships.totalRelationships).toBe(6);
  });

  it("includes escalation management sub-result", () => {
    const result = generate();
    expect(result.escalationManagement.totalEscalations).toBe(4);
  });

  it("includes child profiles for all children", () => {
    const result = generate();
    expect(result.childProfiles.length).toBe(3);
  });

  it("scoring components sum to overall score", () => {
    const result = generate();
    const sum =
      result.scoring.meetingScore +
      result.scoring.informationSharingScore +
      result.scoring.relationshipScore +
      result.scoring.escalationScore;
    // Allow small floating point tolerance
    expect(Math.abs(sum - result.overallScore)).toBeLessThan(0.2);
  });

  it("scoring meeting component is <= 30", () => {
    const result = generate();
    expect(result.scoring.meetingScore).toBeLessThanOrEqual(30);
    expect(result.scoring.meetingScore).toBeGreaterThanOrEqual(0);
  });

  it("scoring information sharing component is <= 25", () => {
    const result = generate();
    expect(result.scoring.informationSharingScore).toBeLessThanOrEqual(25);
    expect(result.scoring.informationSharingScore).toBeGreaterThanOrEqual(0);
  });

  it("scoring relationship component is <= 20", () => {
    const result = generate();
    expect(result.scoring.relationshipScore).toBeLessThanOrEqual(20);
    expect(result.scoring.relationshipScore).toBeGreaterThanOrEqual(0);
  });

  it("scoring escalation component is <= 25", () => {
    const result = generate();
    expect(result.scoring.escalationScore).toBeLessThanOrEqual(25);
    expect(result.scoring.escalationScore).toBeGreaterThanOrEqual(0);
  });

  it("includes regulatory links", () => {
    const result = generate();
    expect(result.regulatoryLinks.length).toBeGreaterThanOrEqual(5);
    expect(result.regulatoryLinks.some((l) => l.includes("Reg 5"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Reg 14"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Working Together"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Section 11"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("SCCIF"))).toBe(true);
  });

  it("generates strengths array", () => {
    const result = generate();
    expect(Array.isArray(result.strengths)).toBe(true);
  });

  it("generates areas for improvement array", () => {
    const result = generate();
    expect(Array.isArray(result.areasForImprovement)).toBe(true);
  });

  it("generates actions array", () => {
    const result = generate();
    expect(Array.isArray(result.actions)).toBe(true);
  });

  // ── Rating thresholds ───────────────────────────────────────────────

  it("outstanding rating for score >= 80", () => {
    // Create perfect data
    const perfectMeetings = [
      makeMeeting({
        id: "p1",
        agenciesInvited: ["social_worker"],
        agenciesAttended: ["social_worker"],
        childParticipated: true,
        parentParticipated: true,
        homeStaffAttended: true,
        actionsAgreed: 5,
        actionsCompleted: 5,
        minutesCirculated: true,
        minutesTimely: true,
        outcome: "all_actions_agreed",
      }),
    ];
    const perfectSharing = [
      makeSharingRecord({ id: "ps1", quality: "timely_complete" }),
    ];
    const perfectRels: ProfessionalRelationship[] = [
      makeRelationship({ id: "pr1", agencyType: "social_worker", relationship: "strong", responsiveness: "excellent" }),
      makeRelationship({ id: "pr2", agencyType: "CAMHS", relationship: "strong", responsiveness: "excellent" }),
      makeRelationship({ id: "pr3", agencyType: "education", relationship: "strong", responsiveness: "excellent" }),
      makeRelationship({ id: "pr4", agencyType: "health_visitor", relationship: "strong", responsiveness: "excellent" }),
      makeRelationship({ id: "pr5", agencyType: "IRO", relationship: "strong", responsiveness: "excellent" }),
    ];
    const perfectEsc = [
      makeEscalation({ id: "pe1", responseReceived: true, responseTimelyDays: 1, outcomeAchieved: true }),
    ];
    const result = generateMultiAgencyEffectivenessIntelligence(
      perfectMeetings,
      perfectSharing,
      perfectRels,
      perfectEsc,
      ["child-alex"],
      "perfect-home",
      "2026-04-01",
      "2026-05-01",
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(80);
    expect(result.rating).toBe("outstanding");
  });

  it("inadequate rating for very poor data", () => {
    const poorMeetings = [
      makeMeeting({
        id: "p1",
        agenciesInvited: ["social_worker", "CAMHS", "education", "IRO"],
        agenciesAttended: [],
        childParticipated: false,
        parentParticipated: false,
        homeStaffAttended: false,
        actionsAgreed: 5,
        actionsCompleted: 0,
        minutesCirculated: false,
        minutesTimely: false,
        outcome: "deferred",
      }),
    ];
    const poorSharing = [
      makeSharingRecord({ id: "ps1", quality: "not_shared" }),
    ];
    const poorRels: ProfessionalRelationship[] = [
      makeRelationship({ id: "pr1", agencyType: "other", relationship: "poor", responsiveness: "poor" }),
    ];
    const poorEsc = [
      makeEscalation({ id: "pe1", responseReceived: false, outcomeAchieved: false }),
    ];
    const result = generateMultiAgencyEffectivenessIntelligence(
      poorMeetings,
      poorSharing,
      poorRels,
      poorEsc,
      ["child-alex"],
      "poor-home",
      "2026-04-01",
      "2026-05-01",
    );
    expect(result.overallScore).toBeLessThan(40);
    expect(result.rating).toBe("inadequate");
  });

  // ── Edge cases ──────────────────────────────────────────────────────

  it("handles empty data gracefully", () => {
    const result = generateMultiAgencyEffectivenessIntelligence(
      [],
      [],
      [],
      [],
      [],
      "empty-home",
      "2026-04-01",
      "2026-05-01",
    );
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
    expect(result.childProfiles).toEqual([]);
  });

  it("handles no children but with relationship data", () => {
    const result = generateMultiAgencyEffectivenessIntelligence(
      [],
      [],
      demoRelationships,
      [],
      [],
      "rels-only-home",
      "2026-04-01",
      "2026-05-01",
    );
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.professionalRelationships.totalRelationships).toBe(6);
  });

  it("referenceDate parameter does not affect output (reserved)", () => {
    const r1 = generateMultiAgencyEffectivenessIntelligence(
      demoMeetings,
      demoSharingRecords,
      demoRelationships,
      demoEscalations,
      CHILD_IDS,
      "oak-house",
      "2026-04-15",
      "2026-05-15",
      "2026-05-15",
    );
    const r2 = generateMultiAgencyEffectivenessIntelligence(
      demoMeetings,
      demoSharingRecords,
      demoRelationships,
      demoEscalations,
      CHILD_IDS,
      "oak-house",
      "2026-04-15",
      "2026-05-15",
      "2026-01-01",
    );
    expect(r1.overallScore).toBe(r2.overallScore);
  });

  it("strengths include attendance when rate is high", () => {
    const goodMeetings = Array.from({ length: 5 }, (_, i) =>
      makeMeeting({
        id: `gm-${i}`,
        agenciesInvited: ["social_worker", "CAMHS"],
        agenciesAttended: ["social_worker", "CAMHS"],
        childParticipated: true,
        parentParticipated: true,
        homeStaffAttended: true,
        actionsAgreed: 4,
        actionsCompleted: 4,
        minutesCirculated: true,
        minutesTimely: true,
      }),
    );
    const result = generateMultiAgencyEffectivenessIntelligence(
      goodMeetings,
      demoSharingRecords,
      demoRelationships,
      [makeEscalation({ id: "e1", responseReceived: true, responseTimelyDays: 1, outcomeAchieved: true })],
      CHILD_IDS,
      "oak-house",
      "2026-04-01",
      "2026-05-01",
    );
    expect(result.strengths.some((s) => s.includes("attendance"))).toBe(true);
  });

  it("areas for improvement include attendance when rate is low", () => {
    const poorMeetings = [
      makeMeeting({
        id: "pm1",
        agenciesInvited: ["social_worker", "CAMHS", "education", "IRO"],
        agenciesAttended: ["social_worker"],
        childParticipated: false,
        parentParticipated: false,
        homeStaffAttended: true,
        actionsAgreed: 5,
        actionsCompleted: 1,
      }),
    ];
    const result = generateMultiAgencyEffectivenessIntelligence(
      poorMeetings,
      [],
      [],
      [],
      [],
      "test-home",
      "2026-04-01",
      "2026-05-01",
    );
    expect(result.areasForImprovement.some((a) => a.includes("attendance"))).toBe(true);
  });

  it("actions include attendance protocol when attendance is low", () => {
    const poorMeetings = [
      makeMeeting({
        id: "pm1",
        agenciesInvited: ["social_worker", "CAMHS", "education", "IRO"],
        agenciesAttended: ["social_worker"],
        childParticipated: false,
        parentParticipated: false,
        homeStaffAttended: true,
        actionsAgreed: 5,
        actionsCompleted: 1,
      }),
    ];
    const result = generateMultiAgencyEffectivenessIntelligence(
      poorMeetings,
      [],
      [],
      [],
      [],
      "test-home",
      "2026-04-01",
      "2026-05-01",
    );
    expect(result.actions.some((a) => a.includes("attendance protocol"))).toBe(true);
  });

  it("areas mention poor relationships when they exist", () => {
    const poorRels = [
      makeRelationship({ id: "pr1", agencyType: "social_worker", relationship: "poor", responsiveness: "poor" }),
    ];
    const result = generateMultiAgencyEffectivenessIntelligence(
      [],
      [],
      poorRels,
      [],
      [],
      "test-home",
      "2026-04-01",
      "2026-05-01",
    );
    expect(result.areasForImprovement.some((a) => a.includes("poor"))).toBe(true);
  });

  it("areas mention child participation when low", () => {
    const meetings = [
      makeMeeting({ id: "m1", childParticipated: false }),
      makeMeeting({ id: "m2", childParticipated: false }),
      makeMeeting({ id: "m3", childParticipated: false }),
    ];
    const result = generateMultiAgencyEffectivenessIntelligence(
      meetings,
      [],
      [],
      [],
      [],
      "test-home",
      "2026-04-01",
      "2026-05-01",
    );
    expect(result.areasForImprovement.some((a) => a.includes("participation"))).toBe(true);
  });

  it("areas mention coverage when key agencies not covered", () => {
    // No relationships at all means 0 coverage
    const result = generateMultiAgencyEffectivenessIntelligence(
      [],
      [],
      [],
      [],
      [],
      "test-home",
      "2026-04-01",
      "2026-05-01",
    );
    expect(result.areasForImprovement.some((a) => a.includes("Coverage") || a.includes("coverage"))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Additional edge case tests
// ══════════════════════════════════════════════════════════════════════════════

describe("Edge cases & type coverage", () => {
  it("meeting with zero invitations yields 0 attendance rate", () => {
    const m = makeMeeting({
      agenciesInvited: [],
      agenciesAttended: [],
    });
    const result = evaluateMeetingEffectiveness([m]);
    expect(result.agencyAttendanceRate).toBe(0);
  });

  it("information sharing with single delayed_incomplete record", () => {
    const r = makeSharingRecord({ quality: "delayed_incomplete" });
    const result = evaluateInformationSharing([r]);
    expect(result.timelinessRate).toBe(0);
    expect(result.completenessRate).toBe(0);
    expect(result.qualityDistribution.delayed_incomplete).toBe(1);
  });

  it("all meeting types are represented in empty breakdown", () => {
    const result = evaluateMeetingEffectiveness([]);
    const types: MeetingType[] = [
      "strategy", "CIN", "LAC_review", "PEP", "health_review",
      "professionals", "discharge_planning", "risk_management", "other",
    ];
    for (const t of types) {
      expect(result.meetingTypeBreakdown[t]).toBe(0);
    }
  });

  it("all quality types are represented in empty sharing distribution", () => {
    const result = evaluateInformationSharing([]);
    const qualities: InformationSharingQuality[] = [
      "timely_complete", "timely_incomplete", "delayed_complete",
      "delayed_incomplete", "not_shared",
    ];
    for (const q of qualities) {
      expect(result.qualityDistribution[q]).toBe(0);
    }
  });

  it("meeting with other type is counted correctly", () => {
    const m = makeMeeting({ meetingType: "other" });
    const result = evaluateMeetingEffectiveness([m]);
    expect(result.meetingTypeBreakdown.other).toBe(1);
  });

  it("meeting with discharge_planning type", () => {
    const m = makeMeeting({ meetingType: "discharge_planning" });
    const result = evaluateMeetingEffectiveness([m]);
    expect(result.meetingTypeBreakdown.discharge_planning).toBe(1);
  });

  it("child profile with multiple agencies from different sources", () => {
    const meetings = [
      makeMeeting({
        childId: "child-x",
        childName: "X",
        agenciesAttended: ["social_worker"],
      }),
    ];
    const sharing = [
      makeSharingRecord({
        childId: "child-x",
        childName: "X",
        fromAgency: "CAMHS",
        toAgency: "education",
      }),
    ];
    const escalations = [
      makeEscalation({
        childId: "child-x",
        childName: "X",
        escalatedTo: "police",
      }),
    ];
    const profiles = buildChildMultiAgencyProfile(meetings, sharing, escalations, ["child-x"]);
    expect(profiles[0].agenciesInvolved).toContain("social_worker");
    expect(profiles[0].agenciesInvolved).toContain("CAMHS");
    expect(profiles[0].agenciesInvolved).toContain("education");
    expect(profiles[0].agenciesInvolved).toContain("police");
  });

  it("strong engagement for child with many meetings and agencies and good sharing", () => {
    const meetings = Array.from({ length: 4 }, (_, i) =>
      makeMeeting({
        id: `se-${i}`,
        childId: "child-strong",
        childName: "Strong",
        agenciesAttended: ["social_worker", "CAMHS", "education", "IRO"],
      }),
    );
    const sharing = Array.from({ length: 3 }, (_, i) =>
      makeSharingRecord({
        id: `ss-${i}`,
        childId: "child-strong",
        childName: "Strong",
        quality: "timely_complete",
      }),
    );
    const profiles = buildChildMultiAgencyProfile(meetings, sharing, [], ["child-strong"]);
    expect(profiles[0].overallEngagement).toBe("strong");
  });

  it("limited engagement for child with few meetings", () => {
    const meetings = [
      makeMeeting({
        childId: "child-limited",
        childName: "Limited",
        agenciesAttended: ["social_worker"],
      }),
    ];
    const sharing = [
      makeSharingRecord({
        childId: "child-limited",
        childName: "Limited",
        quality: "delayed_incomplete",
      }),
    ];
    const escalations = [
      makeEscalation({
        childId: "child-limited",
        childName: "Limited",
        outcomeAchieved: false,
      }),
    ];
    const profiles = buildChildMultiAgencyProfile(meetings, sharing, escalations, ["child-limited"]);
    expect(["limited", "poor"]).toContain(profiles[0].overallEngagement);
  });

  it("full report scoring components are non-negative", () => {
    const result = generateMultiAgencyEffectivenessIntelligence(
      demoMeetings,
      demoSharingRecords,
      demoRelationships,
      demoEscalations,
      CHILD_IDS,
      "oak-house",
      "2026-04-15",
      "2026-05-15",
    );
    expect(result.scoring.meetingScore).toBeGreaterThanOrEqual(0);
    expect(result.scoring.informationSharingScore).toBeGreaterThanOrEqual(0);
    expect(result.scoring.relationshipScore).toBeGreaterThanOrEqual(0);
    expect(result.scoring.escalationScore).toBeGreaterThanOrEqual(0);
  });

  it("escalation with zero days response is timely", () => {
    const esc = [makeEscalation({ responseReceived: true, responseTimelyDays: 0, outcomeAchieved: true })];
    const result = evaluateEscalations(esc);
    expect(result.timelinessRate).toBe(100);
    expect(result.averageResponseDays).toBe(0);
  });
});
