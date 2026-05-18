// ══════════════════════════════════════════════════════════════════════════════
// Tests — Governance & Leadership Intelligence Engine
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  generateGovernanceIntelligence,
  evaluateSoPCompliance,
  evaluateReg45Compliance,
  evaluatePolicyCompliance,
  evaluateNotificationCompliance,
  evaluateDevelopmentPlan,
  evaluateMeetingCompliance,
  evaluateManagementPresence,
  getPolicyCategoryLabel,
  getNotificationTypeLabel,
  getObjectiveStatusLabel,
} from "../governance-engine";
import type {
  StatementOfPurpose,
  Reg45Report,
  PolicyRecord,
  NotificationRecord,
  DevelopmentObjective,
  StaffMeetingRecord,
  ManagementPresence,
} from "../governance-engine";

// ── Fixtures ──────────────────────────────────────────────────────────────────

const PERIOD_START = "2026-01-01";
const PERIOD_END = "2026-05-18";
const CURRENT_DATE = "2026-05-18";

function makeSoP(overrides: Partial<StatementOfPurpose> = {}): StatementOfPurpose {
  return {
    lastReviewDate: "2026-01-10",
    nextReviewDue: "2027-01-10",
    sharedWithOfsted: true,
    lastSharedDate: "2026-01-15",
    accurateChildrenCount: true,
    accurateStaffDetails: true,
    accurateServiceDescription: true,
    childrenGuideAvailable: true,
    childrenGuideLastUpdated: "2026-01-10",
    childrenGuideAccessibleFormats: ["printed", "easy_read", "audio"],
    ...overrides,
  };
}

function makeReg45Reports(
  overrides: Partial<Reg45Report>[] = [],
): Reg45Report[] {
  const defaults: Reg45Report[] = [
    {
      id: "r45-jan",
      monthCovered: "2026-01",
      completedDate: "2026-02-10",
      dueDate: "2026-02-15",
      submittedToOfsted: true,
      submissionDate: "2026-02-12",
      areasReviewed: ["safeguarding", "health", "education"],
      actionsIdentified: 4,
      actionsCompleted: 4,
      childrenConsulted: true,
      staffConsulted: true,
      keyFindings: ["Strong safeguarding culture", "PEP review follow-up needed"],
    },
    {
      id: "r45-feb",
      monthCovered: "2026-02",
      completedDate: "2026-03-12",
      dueDate: "2026-03-15",
      submittedToOfsted: true,
      submissionDate: "2026-03-14",
      areasReviewed: ["behaviour", "activities", "contact"],
      actionsIdentified: 3,
      actionsCompleted: 3,
      childrenConsulted: true,
      staffConsulted: true,
      keyFindings: ["Positive behaviour trends", "Activity provision excellent"],
    },
    {
      id: "r45-mar",
      monthCovered: "2026-03",
      completedDate: "2026-04-08",
      dueDate: "2026-04-15",
      submittedToOfsted: true,
      submissionDate: "2026-04-10",
      areasReviewed: ["staffing", "training", "supervision"],
      actionsIdentified: 5,
      actionsCompleted: 4,
      childrenConsulted: true,
      staffConsulted: true,
      keyFindings: ["Supervision compliance improving", "One training gap identified"],
    },
    {
      id: "r45-apr",
      monthCovered: "2026-04",
      completedDate: "2026-05-10",
      dueDate: "2026-05-15",
      submittedToOfsted: true,
      submissionDate: "2026-05-12",
      areasReviewed: ["environment", "health_safety", "independence"],
      actionsIdentified: 3,
      actionsCompleted: 2,
      childrenConsulted: true,
      staffConsulted: false,
      keyFindings: ["Environment well maintained", "Independence skills improving"],
    },
    {
      id: "r45-may",
      monthCovered: "2026-05",
      dueDate: "2026-06-15",
      submittedToOfsted: false,
      areasReviewed: [],
      actionsIdentified: 0,
      actionsCompleted: 0,
      childrenConsulted: false,
      staffConsulted: false,
      keyFindings: [],
    },
  ];
  return defaults.map((d, i) =>
    overrides[i] ? { ...d, ...overrides[i] } : d,
  );
}

function makePolicies(
  overrides: Partial<PolicyRecord>[] = [],
): PolicyRecord[] {
  const defaults: PolicyRecord[] = [
    {
      id: "pol-1",
      policyName: "Safeguarding Policy",
      category: "safeguarding" as const,
      lastReviewDate: "2026-01-15",
      nextReviewDue: "2027-01-15",
      reviewedBy: "Darren Laville",
      version: "4.2",
      approvedBy: "RI Board",
      staffAcknowledged: true,
      staffAcknowledgedCount: 4,
      totalStaff: 4,
    },
    {
      id: "pol-2",
      policyName: "Behaviour Management Policy",
      category: "behaviour_management" as const,
      lastReviewDate: "2025-11-01",
      nextReviewDue: "2026-11-01",
      reviewedBy: "Darren Laville",
      version: "3.1",
      approvedBy: "RI Board",
      staffAcknowledged: true,
      staffAcknowledgedCount: 4,
      totalStaff: 4,
    },
    {
      id: "pol-3",
      policyName: "Missing Children Policy",
      category: "missing_children" as const,
      lastReviewDate: "2025-09-01",
      nextReviewDue: "2026-09-01",
      reviewedBy: "Darren Laville",
      version: "2.5",
      approvedBy: "RI Board",
      staffAcknowledged: true,
      staffAcknowledgedCount: 3,
      totalStaff: 4,
    },
    {
      id: "pol-4",
      policyName: "Complaints Policy",
      category: "complaints" as const,
      lastReviewDate: "2026-02-01",
      nextReviewDue: "2027-02-01",
      reviewedBy: "Darren Laville",
      version: "2.0",
      approvedBy: "RI Board",
      staffAcknowledged: true,
      staffAcknowledgedCount: 4,
      totalStaff: 4,
    },
    {
      id: "pol-5",
      policyName: "Fire Safety Policy",
      category: "fire_safety" as const,
      lastReviewDate: "2025-12-01",
      nextReviewDue: "2026-12-01",
      reviewedBy: "Darren Laville",
      version: "3.0",
      approvedBy: "RI Board",
      staffAcknowledged: true,
      staffAcknowledgedCount: 4,
      totalStaff: 4,
    },
  ];
  return defaults.map((d, i) =>
    overrides[i] ? { ...d, ...overrides[i] } : d,
  );
}

function makeNotifications(
  overrides: Partial<NotificationRecord>[] = [],
): NotificationRecord[] {
  const defaults: NotificationRecord[] = [
    {
      id: "not-1",
      date: "2026-02-10",
      notificationType: "missing_child" as const,
      childId: "child-morgan",
      recipients: ["ofsted", "placing_authority", "police"],
      notifiedWithinTimescale: true,
      timescaleHours: 24,
      actualHours: 2,
      description: "Morgan absent from home without permission for 3 hours",
      ofstedReference: "SC123456",
    },
    {
      id: "not-2",
      date: "2026-03-15",
      notificationType: "restraint" as const,
      childId: "child-alex",
      recipients: ["ofsted", "placing_authority", "parent_carer"],
      notifiedWithinTimescale: true,
      timescaleHours: 24,
      actualHours: 4,
      description: "Physical intervention — Alex escalated, brief hold used",
    },
    {
      id: "not-3",
      date: "2026-04-20",
      notificationType: "allegation_against_staff" as const,
      recipients: ["ofsted", "placing_authority", "lado"],
      notifiedWithinTimescale: true,
      timescaleHours: 24,
      actualHours: 3,
      description: "Allegation against agency worker — LADO referral made",
    },
  ];
  return defaults.map((d, i) =>
    overrides[i] ? { ...d, ...overrides[i] } : d,
  );
}

function makeObjectives(
  overrides: Partial<DevelopmentObjective>[] = [],
): DevelopmentObjective[] {
  const defaults: DevelopmentObjective[] = [
    {
      id: "obj-1",
      description: "Implement structured key-work programme",
      category: "quality_of_care",
      targetDate: "2026-06-01",
      status: "completed" as const,
      completedDate: "2026-04-15",
      progress: 100,
      measurableOutcome: "All children have weekly key-work sessions",
      evidence: "Key-work calendars show 100% compliance since March",
      lastReviewedDate: "2026-04-20",
    },
    {
      id: "obj-2",
      description: "Achieve Outstanding rating for safeguarding practice",
      category: "safeguarding",
      targetDate: "2026-09-01",
      status: "in_progress" as const,
      progress: 70,
      measurableOutcome: "All safeguarding KPIs at outstanding level",
      lastReviewedDate: "2026-05-01",
    },
    {
      id: "obj-3",
      description: "Develop therapeutic parenting training for all staff",
      category: "workforce",
      targetDate: "2026-03-31",
      status: "completed" as const,
      completedDate: "2026-03-20",
      progress: 100,
      measurableOutcome: "All permanent staff complete Level 3 therapeutic parenting",
      evidence: "Training records updated; certificates on file",
      lastReviewedDate: "2026-04-01",
    },
    {
      id: "obj-4",
      description: "Improve family contact quality metrics",
      category: "quality_of_care",
      targetDate: "2026-07-01",
      status: "in_progress" as const,
      progress: 55,
      measurableOutcome: "Contact quality score above 80% for all children",
      lastReviewedDate: "2026-05-10",
    },
    {
      id: "obj-5",
      description: "Establish children's council with elected representatives",
      category: "participation",
      targetDate: "2026-04-01",
      status: "completed" as const,
      completedDate: "2026-03-25",
      progress: 100,
      measurableOutcome: "Monthly children's council meetings with documented outcomes",
      evidence: "3 meetings held; children's council charter signed",
      lastReviewedDate: "2026-04-15",
    },
  ];
  return defaults.map((d, i) =>
    overrides[i] ? { ...d, ...overrides[i] } : d,
  );
}

function makeMeetings(
  overrides: Partial<StaffMeetingRecord>[] = [],
): StaffMeetingRecord[] {
  const defaults: StaffMeetingRecord[] = [
    {
      id: "mtg-1",
      date: "2026-01-15",
      meetingType: "staff_team" as const,
      attendeeCount: 4,
      expectedAttendees: 4,
      minutesRecorded: true,
      actionsAgreed: 5,
      actionsCompleted: 5,
      keyTopics: ["New year planning", "Training schedule", "Safeguarding update"],
    },
    {
      id: "mtg-2",
      date: "2026-02-12",
      meetingType: "staff_team" as const,
      attendeeCount: 3,
      expectedAttendees: 4,
      minutesRecorded: true,
      actionsAgreed: 4,
      actionsCompleted: 3,
      keyTopics: ["Reg 44 feedback", "Activity planning", "Key-work review"],
    },
    {
      id: "mtg-3",
      date: "2026-03-05",
      meetingType: "management" as const,
      attendeeCount: 2,
      expectedAttendees: 2,
      minutesRecorded: true,
      actionsAgreed: 3,
      actionsCompleted: 3,
      keyTopics: ["Budget review", "Ofsted preparation", "Staff wellbeing"],
    },
    {
      id: "mtg-4",
      date: "2026-03-19",
      meetingType: "staff_team" as const,
      attendeeCount: 4,
      expectedAttendees: 4,
      minutesRecorded: true,
      actionsAgreed: 6,
      actionsCompleted: 5,
      keyTopics: ["Therapeutic model", "Incident analysis", "Training feedback"],
    },
    {
      id: "mtg-5",
      date: "2026-04-16",
      meetingType: "staff_team" as const,
      attendeeCount: 4,
      expectedAttendees: 4,
      minutesRecorded: true,
      actionsAgreed: 4,
      actionsCompleted: 4,
      keyTopics: ["Peer dynamics update", "Missing protocol review", "Summer activities"],
    },
    {
      id: "mtg-6",
      date: "2026-05-07",
      meetingType: "children_meeting" as const,
      attendeeCount: 3,
      expectedAttendees: 3,
      minutesRecorded: true,
      actionsAgreed: 3,
      actionsCompleted: 2,
      keyTopics: ["Menu choices", "Activity requests", "House rules feedback"],
    },
    {
      id: "mtg-7",
      date: "2026-05-14",
      meetingType: "staff_team" as const,
      attendeeCount: 3,
      expectedAttendees: 4,
      minutesRecorded: true,
      actionsAgreed: 5,
      actionsCompleted: 3,
      keyTopics: ["Quality audit outcomes", "Supervision catch-up", "Forthcoming transitions"],
    },
  ];
  return defaults.map((d, i) =>
    overrides[i] ? { ...d, ...overrides[i] } : d,
  );
}

function makePresence(
  overrides: Partial<ManagementPresence>[] = [],
): ManagementPresence[] {
  const defaults: ManagementPresence[] = [
    { weekCommencing: "2026-04-07", rmHoursInHome: 28, rmTotalHours: 40, drmHoursInHome: 20, drmTotalHours: 40, shiftsCoveredByManagement: 1, childInteractionEvents: 6 },
    { weekCommencing: "2026-04-14", rmHoursInHome: 25, rmTotalHours: 40, drmHoursInHome: 22, drmTotalHours: 40, shiftsCoveredByManagement: 0, childInteractionEvents: 5 },
    { weekCommencing: "2026-04-21", rmHoursInHome: 30, rmTotalHours: 40, drmHoursInHome: 18, drmTotalHours: 40, shiftsCoveredByManagement: 2, childInteractionEvents: 7 },
    { weekCommencing: "2026-04-28", rmHoursInHome: 22, rmTotalHours: 40, drmHoursInHome: 24, drmTotalHours: 40, shiftsCoveredByManagement: 0, childInteractionEvents: 5 },
    { weekCommencing: "2026-05-05", rmHoursInHome: 26, rmTotalHours: 40, drmHoursInHome: 20, drmTotalHours: 40, shiftsCoveredByManagement: 1, childInteractionEvents: 6 },
    { weekCommencing: "2026-05-12", rmHoursInHome: 24, rmTotalHours: 40, drmHoursInHome: 22, drmTotalHours: 40, shiftsCoveredByManagement: 0, childInteractionEvents: 5 },
  ];
  return defaults.map((d, i) =>
    overrides[i] ? { ...d, ...overrides[i] } : d,
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// STATEMENT OF PURPOSE COMPLIANCE
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateSoPCompliance", () => {
  it("reports SoP as reviewed and not overdue when current", () => {
    const result = evaluateSoPCompliance(makeSoP(), CURRENT_DATE);
    expect(result.isReviewed).toBe(true);
    expect(result.isOverdue).toBe(false);
    expect(result.sharedWithOfsted).toBe(true);
  });

  it("reports overdue SoP", () => {
    const result = evaluateSoPCompliance(
      makeSoP({ nextReviewDue: "2026-04-01" }),
      CURRENT_DATE,
    );
    expect(result.isOverdue).toBe(true);
  });

  it("calculates accuracy rate correctly", () => {
    const result = evaluateSoPCompliance(makeSoP(), CURRENT_DATE);
    expect(result.accuracyRate).toBe(100);

    const partial = evaluateSoPCompliance(
      makeSoP({ accurateStaffDetails: false }),
      CURRENT_DATE,
    );
    expect(partial.accuracyRate).toBe(67); // 2/3
  });

  it("reports children's guide details", () => {
    const result = evaluateSoPCompliance(makeSoP(), CURRENT_DATE);
    expect(result.childrenGuide.available).toBe(true);
    expect(result.childrenGuide.accessibleFormats).toBe(3);
  });

  it("reports children's guide unavailable", () => {
    const result = evaluateSoPCompliance(
      makeSoP({ childrenGuideAvailable: false, childrenGuideAccessibleFormats: [] }),
      CURRENT_DATE,
    );
    expect(result.childrenGuide.available).toBe(false);
    expect(result.childrenGuide.accessibleFormats).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// REG 45 COMPLIANCE
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateReg45Compliance", () => {
  it("counts expected reports for period", () => {
    const result = evaluateReg45Compliance(
      makeReg45Reports(),
      PERIOD_START,
      PERIOD_END,
    );
    // Jan–May = 5 months expected
    expect(result.totalExpected).toBe(5);
  });

  it("calculates completion rate correctly", () => {
    const result = evaluateReg45Compliance(
      makeReg45Reports(),
      PERIOD_START,
      PERIOD_END,
    );
    // 4 completed (Jan–Apr), May not yet completed
    expect(result.completed).toBe(4);
    expect(result.completionRate).toBe(80); // 4/5
  });

  it("calculates Ofsted submission rate", () => {
    const result = evaluateReg45Compliance(
      makeReg45Reports(),
      PERIOD_START,
      PERIOD_END,
    );
    // All 4 completed reports submitted
    expect(result.ofstedSubmissionRate).toBe(100);
  });

  it("calculates action completion rate", () => {
    const result = evaluateReg45Compliance(
      makeReg45Reports(),
      PERIOD_START,
      PERIOD_END,
    );
    // Total actions: 4+3+5+3 = 15, completed: 4+3+4+2 = 13
    expect(result.actionCompletionRate).toBe(87); // 13/15
  });

  it("tracks children consulted rate", () => {
    const result = evaluateReg45Compliance(
      makeReg45Reports(),
      PERIOD_START,
      PERIOD_END,
    );
    // All 4 completed reports consulted children
    expect(result.childrenConsultedRate).toBe(100);
  });

  it("identifies overdue reports", () => {
    const result = evaluateReg45Compliance(
      makeReg45Reports(),
      PERIOD_START,
      PERIOD_END,
    );
    // May report not yet completed
    expect(result.overdueReports).toContain("2026-05");
  });

  it("handles no reports", () => {
    const result = evaluateReg45Compliance([], PERIOD_START, PERIOD_END);
    expect(result.completed).toBe(0);
    expect(result.completionRate).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// POLICY COMPLIANCE
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluatePolicyCompliance", () => {
  it("reports all policies up to date", () => {
    const result = evaluatePolicyCompliance(makePolicies(), CURRENT_DATE);
    expect(result.totalPolicies).toBe(5);
    expect(result.upToDate).toBe(5);
    expect(result.overdue).toBe(0);
    expect(result.complianceRate).toBe(100);
  });

  it("detects overdue policies", () => {
    const policies = makePolicies();
    policies[1] = { ...policies[1], nextReviewDue: "2026-03-01" };
    const result = evaluatePolicyCompliance(policies, CURRENT_DATE);
    expect(result.overdue).toBe(1);
    expect(result.complianceRate).toBe(80);
  });

  it("calculates average staff acknowledgement rate", () => {
    const result = evaluatePolicyCompliance(makePolicies(), CURRENT_DATE);
    // 4/4 + 4/4 + 3/4 + 4/4 + 4/4 = 19/20 → avg 95%
    expect(result.averageStaffAcknowledgementRate).toBe(95);
  });

  it("identifies policies nearing review within 30 days", () => {
    const policies = makePolicies();
    policies[2] = { ...policies[2], nextReviewDue: "2026-06-01" }; // Within 30 days of May 18
    const result = evaluatePolicyCompliance(policies, CURRENT_DATE);
    expect(result.policiesNearingReview.length).toBe(1);
    expect(result.policiesNearingReview[0].policyName).toBe("Missing Children Policy");
  });

  it("groups overdue by category", () => {
    const policies = makePolicies();
    policies[0] = { ...policies[0], nextReviewDue: "2026-04-01" }; // Safeguarding overdue
    policies[4] = { ...policies[4], nextReviewDue: "2026-05-01" }; // Fire safety overdue
    const result = evaluatePolicyCompliance(policies, CURRENT_DATE);
    expect(result.overdueByCategory).toHaveLength(2);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// NOTIFICATION COMPLIANCE
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateNotificationCompliance", () => {
  it("reports all notifications within timescale", () => {
    const result = evaluateNotificationCompliance(
      makeNotifications(),
      PERIOD_START,
      PERIOD_END,
    );
    expect(result.totalNotifications).toBe(3);
    expect(result.withinTimescale).toBe(3);
    expect(result.timelinesRate).toBe(100);
  });

  it("detects late notifications", () => {
    const notifications = makeNotifications();
    notifications[1] = {
      ...notifications[1],
      notifiedWithinTimescale: false,
      actualHours: 30,
    };
    const result = evaluateNotificationCompliance(
      notifications,
      PERIOD_START,
      PERIOD_END,
    );
    expect(result.outsideTimescale).toBe(1);
    expect(result.timelinesRate).toBe(67); // 2/3
  });

  it("calculates average response hours", () => {
    const result = evaluateNotificationCompliance(
      makeNotifications(),
      PERIOD_START,
      PERIOD_END,
    );
    // 2 + 4 + 3 = 9 / 3 = 3
    expect(result.averageResponseHours).toBe(3);
  });

  it("provides type breakdown", () => {
    const result = evaluateNotificationCompliance(
      makeNotifications(),
      PERIOD_START,
      PERIOD_END,
    );
    expect(result.typeBreakdown).toHaveLength(3);
  });

  it("counts Ofsted notifications", () => {
    const result = evaluateNotificationCompliance(
      makeNotifications(),
      PERIOD_START,
      PERIOD_END,
    );
    // All 3 include ofsted as recipient
    expect(result.ofstedNotifications).toBe(3);
  });

  it("handles zero notifications", () => {
    const result = evaluateNotificationCompliance(
      [],
      PERIOD_START,
      PERIOD_END,
    );
    expect(result.totalNotifications).toBe(0);
    expect(result.timelinesRate).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// DEVELOPMENT PLAN
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateDevelopmentPlan", () => {
  it("calculates completion rate", () => {
    const result = evaluateDevelopmentPlan(makeObjectives(), CURRENT_DATE);
    // 3 completed out of 5
    expect(result.completed).toBe(3);
    expect(result.completionRate).toBe(60);
  });

  it("identifies in-progress objectives", () => {
    const result = evaluateDevelopmentPlan(makeObjectives(), CURRENT_DATE);
    expect(result.inProgress).toBe(2); // obj-2 and obj-4
  });

  it("detects overdue objectives by target date", () => {
    const objectives = makeObjectives();
    objectives[3] = {
      ...objectives[3],
      targetDate: "2026-04-01", // Past, still in_progress
      status: "in_progress",
    };
    const result = evaluateDevelopmentPlan(objectives, CURRENT_DATE);
    expect(result.overdue).toBe(1);
  });

  it("calculates average progress", () => {
    const result = evaluateDevelopmentPlan(makeObjectives(), CURRENT_DATE);
    // (100 + 70 + 100 + 55 + 100) / 5 = 85
    expect(result.averageProgress).toBe(85);
  });

  it("provides category breakdown", () => {
    const result = evaluateDevelopmentPlan(makeObjectives(), CURRENT_DATE);
    expect(result.categories.length).toBeGreaterThan(0);
    const qocCategory = result.categories.find(
      (c) => c.category === "quality_of_care",
    );
    expect(qocCategory).toBeDefined();
    expect(qocCategory!.count).toBe(2); // obj-1 and obj-4
  });

  it("handles no objectives", () => {
    const result = evaluateDevelopmentPlan([], CURRENT_DATE);
    expect(result.totalObjectives).toBe(0);
    expect(result.completionRate).toBe(0);
    expect(result.averageProgress).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// MEETING COMPLIANCE
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateMeetingCompliance", () => {
  it("counts total meetings in period", () => {
    const result = evaluateMeetingCompliance(
      makeMeetings(),
      PERIOD_START,
      PERIOD_END,
    );
    expect(result.totalMeetings).toBe(7);
  });

  it("counts staff team meetings", () => {
    const result = evaluateMeetingCompliance(
      makeMeetings(),
      PERIOD_START,
      PERIOD_END,
    );
    expect(result.staffMeetings).toBe(5);
  });

  it("calculates average attendance rate", () => {
    const result = evaluateMeetingCompliance(
      makeMeetings(),
      PERIOD_START,
      PERIOD_END,
    );
    // Attendance: 4/4, 3/4, 2/2, 4/4, 4/4, 3/3, 3/4
    // = 1 + 0.75 + 1 + 1 + 1 + 1 + 0.75 = 6.5 / 7 = 0.928 → 93%
    expect(result.averageAttendanceRate).toBe(93);
  });

  it("calculates minutes recorded rate", () => {
    const result = evaluateMeetingCompliance(
      makeMeetings(),
      PERIOD_START,
      PERIOD_END,
    );
    // All 7 have minutes
    expect(result.minutesRecordedRate).toBe(100);
  });

  it("calculates action completion rate", () => {
    const result = evaluateMeetingCompliance(
      makeMeetings(),
      PERIOD_START,
      PERIOD_END,
    );
    // Total actions: 5+4+3+6+4+3+5 = 30, completed: 5+3+3+5+4+2+3 = 25
    expect(result.actionCompletionRate).toBe(83); // 25/30
  });

  it("handles no meetings", () => {
    const result = evaluateMeetingCompliance([], PERIOD_START, PERIOD_END);
    expect(result.totalMeetings).toBe(0);
    expect(result.averageAttendanceRate).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// MANAGEMENT PRESENCE
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateManagementPresence", () => {
  it("calculates average RM hours in home", () => {
    const result = evaluateManagementPresence(makePresence());
    // (28+25+30+22+26+24) / 6 = 155/6 = 25.8
    expect(result.averageRmHoursInHome).toBe(25.8);
  });

  it("calculates RM presence rate", () => {
    const result = evaluateManagementPresence(makePresence());
    // Total RM in home: 155, total RM hours: 240
    expect(result.averageRmPresenceRate).toBe(65); // 155/240
  });

  it("reports no weeks with low presence when all above threshold", () => {
    const result = evaluateManagementPresence(makePresence());
    // All weeks have RM >= 15 hours
    expect(result.weeksWithLowPresence).toBe(0);
  });

  it("detects weeks with low RM presence", () => {
    const presence = makePresence();
    presence[0] = { ...presence[0], rmHoursInHome: 10 };
    presence[3] = { ...presence[3], rmHoursInHome: 8 };
    const result = evaluateManagementPresence(presence);
    expect(result.weeksWithLowPresence).toBe(2);
  });

  it("calculates average child interaction events", () => {
    const result = evaluateManagementPresence(makePresence());
    // (6+5+7+5+6+5) / 6 = 34/6 = 5.7
    expect(result.averageChildInteractions).toBe(5.7);
  });

  it("handles no presence records", () => {
    const result = evaluateManagementPresence([]);
    expect(result.totalWeeksTracked).toBe(0);
    expect(result.averageRmHoursInHome).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// INTEGRATION: generateGovernanceIntelligence
// ══════════════════════════════════════════════════════════════════════════════

describe("generateGovernanceIntelligence", () => {
  it("returns complete result structure", () => {
    const result = generateGovernanceIntelligence(
      makeSoP(),
      makeReg45Reports(),
      makePolicies(),
      makeNotifications(),
      makeObjectives(),
      makeMeetings(),
      makePresence(),
      "oak-house",
      PERIOD_START,
      PERIOD_END,
    );
    expect(result.homeId).toBe("oak-house");
    expect(result.periodStart).toBe(PERIOD_START);
    expect(result.periodEnd).toBe(PERIOD_END);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(["outstanding", "good", "requires_improvement", "inadequate"]).toContain(
      result.rating,
    );
    expect(result.sopCompliance).toBeDefined();
    expect(result.reg45Compliance).toBeDefined();
    expect(result.policyCompliance).toBeDefined();
    expect(result.notificationCompliance).toBeDefined();
    expect(result.developmentPlan).toBeDefined();
    expect(result.meetingCompliance).toBeDefined();
    expect(result.managementPresence).toBeDefined();
    expect(result.strengths.length).toBeGreaterThan(0);
    expect(result.regulatoryLinks.length).toBeGreaterThan(0);
  });

  it("scores well for strong governance", () => {
    const result = generateGovernanceIntelligence(
      makeSoP(),
      makeReg45Reports(),
      makePolicies(),
      makeNotifications(),
      makeObjectives(),
      makeMeetings(),
      makePresence(),
      "oak-house",
      PERIOD_START,
      PERIOD_END,
    );
    // Good SoP, mostly good Reg 45, all policies current, notifications timely
    expect(result.overallScore).toBeGreaterThanOrEqual(60);
    expect(["outstanding", "good"]).toContain(result.rating);
  });

  it("scores lower with poor governance", () => {
    const goodResult = generateGovernanceIntelligence(
      makeSoP(),
      makeReg45Reports(),
      makePolicies(),
      makeNotifications(),
      makeObjectives(),
      makeMeetings(),
      makePresence(),
      "oak-house",
      PERIOD_START,
      PERIOD_END,
    );
    const poorResult = generateGovernanceIntelligence(
      makeSoP({ nextReviewDue: "2025-12-01", sharedWithOfsted: false, accurateStaffDetails: false }),
      [], // No Reg 45 reports
      makePolicies([{ nextReviewDue: "2025-01-01" }]), // overdue policies
      makeNotifications([{ notifiedWithinTimescale: false, actualHours: 48 }]),
      makeObjectives(),
      [],
      [],
      "oak-house",
      PERIOD_START,
      PERIOD_END,
    );
    expect(poorResult.overallScore).toBeLessThan(goodResult.overallScore);
  });

  it("includes regulatory links for key regulations", () => {
    const result = generateGovernanceIntelligence(
      makeSoP(),
      makeReg45Reports(),
      makePolicies(),
      makeNotifications(),
      makeObjectives(),
      makeMeetings(),
      makePresence(),
      "oak-house",
      PERIOD_START,
      PERIOD_END,
    );
    expect(result.regulatoryLinks.some((l) => l.includes("Reg 16"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Reg 45"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Reg 39"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("SCCIF"))).toBe(true);
  });

  it("generates urgent actions for overdue SoP", () => {
    const result = generateGovernanceIntelligence(
      makeSoP({ nextReviewDue: "2026-04-01" }),
      makeReg45Reports(),
      makePolicies(),
      makeNotifications(),
      makeObjectives(),
      makeMeetings(),
      makePresence(),
      "oak-house",
      PERIOD_START,
      PERIOD_END,
    );
    expect(
      result.immediateActions.some((a) => a.includes("URGENT") && a.includes("Statement of Purpose")),
    ).toBe(true);
  });

  it("generates urgent actions for late notifications", () => {
    const result = generateGovernanceIntelligence(
      makeSoP(),
      makeReg45Reports(),
      makePolicies(),
      makeNotifications([{ notifiedWithinTimescale: false, actualHours: 36 }]),
      makeObjectives(),
      makeMeetings(),
      makePresence(),
      "oak-house",
      PERIOD_START,
      PERIOD_END,
    );
    expect(
      result.immediateActions.some((a) => a.includes("URGENT") && a.includes("notification")),
    ).toBe(true);
  });

  it("notes strengths for good governance", () => {
    const result = generateGovernanceIntelligence(
      makeSoP(),
      makeReg45Reports(),
      makePolicies(),
      makeNotifications(),
      makeObjectives(),
      makeMeetings(),
      makePresence(),
      "oak-house",
      PERIOD_START,
      PERIOD_END,
    );
    expect(
      result.strengths.some((s) => s.includes("notification")),
    ).toBe(true);
    expect(
      result.strengths.some((s) => s.includes("polic")),
    ).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// LABELS
// ══════════════════════════════════════════════════════════════════════════════

describe("labels", () => {
  it("returns correct policy category label", () => {
    expect(getPolicyCategoryLabel("safeguarding")).toBe("Safeguarding");
    expect(getPolicyCategoryLabel("fire_safety")).toBe("Fire Safety");
  });

  it("returns correct notification type label", () => {
    expect(getNotificationTypeLabel("missing_child")).toBe("Missing Child");
    expect(getNotificationTypeLabel("allegation_against_staff")).toBe("Allegation Against Staff");
  });

  it("returns correct objective status label", () => {
    expect(getObjectiveStatusLabel("in_progress")).toBe("In Progress");
    expect(getObjectiveStatusLabel("completed")).toBe("Completed");
  });
});
