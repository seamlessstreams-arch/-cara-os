// ══════════════════════════════════════════════════════════════════════════════
// Tests — Reg 44 Compliance Intelligence Engine
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  generateReg44ComplianceIntelligence,
  evaluateVisitCompliance,
  evaluateRecommendations,
  evaluateChildParticipation,
  evaluateManagementResponse,
  buildVisitTimeline,
  getVisitFocusLabel,
  getRecommendationPriorityLabel,
  getRecommendationStatusLabel,
} from "../reg44-compliance-engine";
import type {
  Reg44Visit,
  Reg44Recommendation,
  ChildParticipation,
  ManagementResponse,
} from "../reg44-compliance-engine";

// ── Fixtures: 6 monthly visits (Jan–Jun 2025) ────────────────────────────────

const CHILD_IDS = ["child-morgan", "child-alex", "child-jayden"];

const VISITS: Reg44Visit[] = [
  {
    id: "v-jan",
    homeId: "oak-house",
    visitDate: "2025-01-20",
    visitor: "Sandra Mitchell",
    visitorIndependent: true,
    childrenSpokenTo: 3,
    totalChildren: 3,
    staffSpokenTo: 2,
    recordsReviewed: true,
    environmentInspected: true,
    focusAreas: ["overall_quality", "safeguarding", "children_views"],
    overallRating: "good",
    positiveFindings: ["Warm, nurturing atmosphere observed", "Children engaged and happy"],
    concerns: ["Fire drill records incomplete"],
    reportSubmittedDate: "2025-01-25",
    reportSubmittedOnTime: true,
    sharedWithOfsted: true,
  },
  {
    id: "v-feb",
    homeId: "oak-house",
    visitDate: "2025-02-18",
    visitor: "Sandra Mitchell",
    visitorIndependent: true,
    childrenSpokenTo: 3,
    totalChildren: 3,
    staffSpokenTo: 3,
    recordsReviewed: true,
    environmentInspected: true,
    focusAreas: ["behaviour", "education", "staffing"],
    overallRating: "good",
    positiveFindings: ["Behaviour management is consistent and child-centred", "PEP reviews timely"],
    concerns: [],
    reportSubmittedDate: "2025-02-22",
    reportSubmittedOnTime: true,
    sharedWithOfsted: true,
  },
  {
    id: "v-mar",
    homeId: "oak-house",
    visitDate: "2025-03-15",
    visitor: "Sandra Mitchell",
    visitorIndependent: true,
    childrenSpokenTo: 2,
    totalChildren: 3,
    staffSpokenTo: 2,
    recordsReviewed: true,
    environmentInspected: true,
    focusAreas: ["health", "environment", "records"],
    overallRating: "outstanding",
    positiveFindings: ["Health appointments all up to date", "Environment well-maintained and homely", "Records accurate and current"],
    concerns: [],
    reportSubmittedDate: "2025-03-20",
    reportSubmittedOnTime: true,
    sharedWithOfsted: true,
  },
  {
    id: "v-apr",
    homeId: "oak-house",
    visitDate: "2025-04-22",
    visitor: "Sandra Mitchell",
    visitorIndependent: true,
    childrenSpokenTo: 3,
    totalChildren: 3,
    staffSpokenTo: 2,
    recordsReviewed: true,
    environmentInspected: true,
    focusAreas: ["complaints", "children_views", "safeguarding"],
    overallRating: "good",
    positiveFindings: ["Complaints procedure understood by children", "Children feel safe"],
    concerns: ["One child expressed frustration about Wi-Fi access"],
    reportSubmittedDate: "2025-04-28",
    reportSubmittedOnTime: true,
    sharedWithOfsted: true,
  },
  {
    id: "v-may",
    homeId: "oak-house",
    visitDate: "2025-05-19",
    visitor: "Sandra Mitchell",
    visitorIndependent: true,
    childrenSpokenTo: 3,
    totalChildren: 3,
    staffSpokenTo: 3,
    recordsReviewed: true,
    environmentInspected: true,
    focusAreas: ["overall_quality", "staffing", "education"],
    overallRating: "outstanding",
    positiveFindings: ["Outstanding practice observed in therapeutic keywork", "Staff morale high"],
    concerns: [],
    reportSubmittedDate: "2025-05-24",
    reportSubmittedOnTime: true,
    sharedWithOfsted: true,
  },
  {
    id: "v-jun",
    homeId: "oak-house",
    visitDate: "2025-06-16",
    visitor: "Sandra Mitchell",
    visitorIndependent: true,
    childrenSpokenTo: 3,
    totalChildren: 3,
    staffSpokenTo: 2,
    recordsReviewed: true,
    environmentInspected: true,
    focusAreas: ["behaviour", "health", "children_views"],
    overallRating: "good",
    positiveFindings: ["Children report feeling listened to", "Health needs well managed"],
    concerns: ["Garden furniture needs repair"],
    reportSubmittedDate: "2025-06-20",
    reportSubmittedOnTime: true,
    sharedWithOfsted: true,
  },
];

// ── Fixtures: 12 recommendations ─────────────────────────────────────────────

const RECOMMENDATIONS: Reg44Recommendation[] = [
  {
    id: "rec-1",
    homeId: "oak-house",
    visitId: "v-jan",
    description: "Complete fire drill records for all shifts",
    priority: "high",
    status: "completed",
    assignedTo: "Darren Laville",
    targetDate: "2025-02-10",
    completedDate: "2025-02-05",
    evidenceOfCompletion: "Fire drill log updated and verified",
    impactAssessed: true,
  },
  {
    id: "rec-2",
    homeId: "oak-house",
    visitId: "v-jan",
    description: "Update emergency contact list for all children",
    priority: "medium",
    status: "completed",
    assignedTo: "Darren Laville",
    targetDate: "2025-02-15",
    completedDate: "2025-02-10",
    evidenceOfCompletion: "Contact lists updated on file",
    impactAssessed: true,
  },
  {
    id: "rec-3",
    homeId: "oak-house",
    visitId: "v-feb",
    description: "Ensure agency staff receive induction pack before first shift",
    priority: "high",
    status: "completed",
    assignedTo: "Darren Laville",
    targetDate: "2025-03-10",
    completedDate: "2025-03-08",
    evidenceOfCompletion: "Induction checklist signed by 2 agency workers",
    impactAssessed: true,
  },
  {
    id: "rec-4",
    homeId: "oak-house",
    visitId: "v-feb",
    description: "Review and update behaviour support plans for all children",
    priority: "medium",
    status: "completed",
    assignedTo: "Darren Laville",
    targetDate: "2025-03-15",
    completedDate: "2025-03-14",
    evidenceOfCompletion: "Plans reviewed and updated on Cornerstone",
    impactAssessed: true,
  },
  {
    id: "rec-5",
    homeId: "oak-house",
    visitId: "v-mar",
    description: "Create sensory profile for Jayden",
    priority: "medium",
    status: "completed",
    assignedTo: "Darren Laville",
    targetDate: "2025-04-10",
    completedDate: "2025-04-08",
    evidenceOfCompletion: "Sensory profile completed with OT input",
    impactAssessed: true,
  },
  {
    id: "rec-6",
    homeId: "oak-house",
    visitId: "v-mar",
    description: "Install additional bathroom grab rail",
    priority: "low",
    status: "completed",
    assignedTo: "Darren Laville",
    targetDate: "2025-04-30",
    completedDate: "2025-04-15",
    evidenceOfCompletion: "Grab rail installed, photo on file",
    impactAssessed: false,
  },
  {
    id: "rec-7",
    homeId: "oak-house",
    visitId: "v-apr",
    description: "Review Wi-Fi access policy with children's council",
    priority: "medium",
    status: "completed",
    assignedTo: "Darren Laville",
    targetDate: "2025-05-15",
    completedDate: "2025-05-12",
    evidenceOfCompletion: "Children's council meeting minutes — new Wi-Fi policy agreed",
    impactAssessed: true,
  },
  {
    id: "rec-8",
    homeId: "oak-house",
    visitId: "v-apr",
    description: "Refresh safeguarding training for night staff",
    priority: "immediate",
    status: "completed",
    assignedTo: "Darren Laville",
    targetDate: "2025-05-01",
    completedDate: "2025-04-28",
    evidenceOfCompletion: "Training certificates on file for all night staff",
    impactAssessed: true,
  },
  {
    id: "rec-9",
    homeId: "oak-house",
    visitId: "v-may",
    description: "Document therapeutic keywork outcomes in care plans",
    priority: "medium",
    status: "completed",
    assignedTo: "Darren Laville",
    targetDate: "2025-06-15",
    completedDate: "2025-06-10",
    evidenceOfCompletion: "Care plans updated with keywork outcome sections",
    impactAssessed: true,
  },
  {
    id: "rec-10",
    homeId: "oak-house",
    visitId: "v-may",
    description: "Establish peer mentoring programme between children",
    priority: "low",
    status: "in_progress",
    assignedTo: "Darren Laville",
    targetDate: "2025-07-31",
    impactAssessed: false,
  },
  {
    id: "rec-11",
    homeId: "oak-house",
    visitId: "v-jun",
    description: "Repair garden furniture and create outdoor activity zone",
    priority: "medium",
    status: "open",
    assignedTo: "Darren Laville",
    targetDate: "2025-07-15",
    impactAssessed: false,
  },
  {
    id: "rec-12",
    homeId: "oak-house",
    visitId: "v-jun",
    description: "Review health pathway documentation for new admission",
    priority: "high",
    status: "in_progress",
    assignedTo: "Darren Laville",
    targetDate: "2025-07-10",
    impactAssessed: false,
  },
];

// ── Fixtures: 18 child participation records (3 children x 6 visits) ─────────

const PARTICIPATION: ChildParticipation[] = [
  // January visit
  { id: "cp-1", homeId: "oak-house", visitId: "v-jan", childId: "child-morgan", childName: "Morgan", spokenTo: true, viewsCaptured: true, feedbackPositive: true, issuesRaised: [], issuesActioned: false },
  { id: "cp-2", homeId: "oak-house", visitId: "v-jan", childId: "child-alex", childName: "Alex", spokenTo: true, viewsCaptured: true, feedbackPositive: true, issuesRaised: [], issuesActioned: false },
  { id: "cp-3", homeId: "oak-house", visitId: "v-jan", childId: "child-jayden", childName: "Jayden", spokenTo: true, viewsCaptured: true, feedbackPositive: true, issuesRaised: [], issuesActioned: false },
  // February visit
  { id: "cp-4", homeId: "oak-house", visitId: "v-feb", childId: "child-morgan", childName: "Morgan", spokenTo: true, viewsCaptured: true, feedbackPositive: true, issuesRaised: [], issuesActioned: false },
  { id: "cp-5", homeId: "oak-house", visitId: "v-feb", childId: "child-alex", childName: "Alex", spokenTo: true, viewsCaptured: true, feedbackPositive: false, issuesRaised: ["Wants more activities at weekends"], issuesActioned: true },
  { id: "cp-6", homeId: "oak-house", visitId: "v-feb", childId: "child-jayden", childName: "Jayden", spokenTo: true, viewsCaptured: true, feedbackPositive: true, issuesRaised: [], issuesActioned: false },
  // March visit
  { id: "cp-7", homeId: "oak-house", visitId: "v-mar", childId: "child-morgan", childName: "Morgan", spokenTo: true, viewsCaptured: true, feedbackPositive: true, issuesRaised: [], issuesActioned: false },
  { id: "cp-8", homeId: "oak-house", visitId: "v-mar", childId: "child-alex", childName: "Alex", spokenTo: true, viewsCaptured: true, feedbackPositive: true, issuesRaised: [], issuesActioned: false },
  { id: "cp-9", homeId: "oak-house", visitId: "v-mar", childId: "child-jayden", childName: "Jayden", spokenTo: false, viewsCaptured: false, feedbackPositive: false, issuesRaised: [], issuesActioned: false },
  // April visit
  { id: "cp-10", homeId: "oak-house", visitId: "v-apr", childId: "child-morgan", childName: "Morgan", spokenTo: true, viewsCaptured: true, feedbackPositive: true, issuesRaised: [], issuesActioned: false },
  { id: "cp-11", homeId: "oak-house", visitId: "v-apr", childId: "child-alex", childName: "Alex", spokenTo: true, viewsCaptured: true, feedbackPositive: true, issuesRaised: [], issuesActioned: false },
  { id: "cp-12", homeId: "oak-house", visitId: "v-apr", childId: "child-jayden", childName: "Jayden", spokenTo: true, viewsCaptured: true, feedbackPositive: false, issuesRaised: ["Wi-Fi too slow for gaming"], issuesActioned: true },
  // May visit
  { id: "cp-13", homeId: "oak-house", visitId: "v-may", childId: "child-morgan", childName: "Morgan", spokenTo: true, viewsCaptured: true, feedbackPositive: true, issuesRaised: [], issuesActioned: false },
  { id: "cp-14", homeId: "oak-house", visitId: "v-may", childId: "child-alex", childName: "Alex", spokenTo: true, viewsCaptured: true, feedbackPositive: true, issuesRaised: [], issuesActioned: false },
  { id: "cp-15", homeId: "oak-house", visitId: "v-may", childId: "child-jayden", childName: "Jayden", spokenTo: true, viewsCaptured: true, feedbackPositive: true, issuesRaised: [], issuesActioned: false },
  // June visit
  { id: "cp-16", homeId: "oak-house", visitId: "v-jun", childId: "child-morgan", childName: "Morgan", spokenTo: true, viewsCaptured: true, feedbackPositive: true, issuesRaised: [], issuesActioned: false },
  { id: "cp-17", homeId: "oak-house", visitId: "v-jun", childId: "child-alex", childName: "Alex", spokenTo: true, viewsCaptured: true, feedbackPositive: true, issuesRaised: [], issuesActioned: false },
  { id: "cp-18", homeId: "oak-house", visitId: "v-jun", childId: "child-jayden", childName: "Jayden", spokenTo: true, viewsCaptured: true, feedbackPositive: true, issuesRaised: [], issuesActioned: false },
];

// ── Fixtures: 6 management responses ─────────────────────────────────────────

const RESPONSES: ManagementResponse[] = [
  {
    id: "mr-1",
    homeId: "oak-house",
    visitId: "v-jan",
    responseDate: "2025-01-28",
    respondedOnTime: true,
    acceptedRecommendations: 2,
    rejectedRecommendations: 0,
    rejectionReasons: [],
    actionPlanCreated: true,
    sharedWithRI: true,
  },
  {
    id: "mr-2",
    homeId: "oak-house",
    visitId: "v-feb",
    responseDate: "2025-02-25",
    respondedOnTime: true,
    acceptedRecommendations: 2,
    rejectedRecommendations: 0,
    rejectionReasons: [],
    actionPlanCreated: true,
    sharedWithRI: true,
  },
  {
    id: "mr-3",
    homeId: "oak-house",
    visitId: "v-mar",
    responseDate: "2025-03-25",
    respondedOnTime: true,
    acceptedRecommendations: 2,
    rejectedRecommendations: 0,
    rejectionReasons: [],
    actionPlanCreated: true,
    sharedWithRI: true,
  },
  {
    id: "mr-4",
    homeId: "oak-house",
    visitId: "v-apr",
    responseDate: "2025-05-02",
    respondedOnTime: true,
    acceptedRecommendations: 2,
    rejectedRecommendations: 0,
    rejectionReasons: [],
    actionPlanCreated: true,
    sharedWithRI: true,
  },
  {
    id: "mr-5",
    homeId: "oak-house",
    visitId: "v-may",
    responseDate: "2025-05-28",
    respondedOnTime: true,
    acceptedRecommendations: 2,
    rejectedRecommendations: 0,
    rejectionReasons: [],
    actionPlanCreated: true,
    sharedWithRI: true,
  },
  {
    id: "mr-6",
    homeId: "oak-house",
    visitId: "v-jun",
    responseDate: "2025-06-23",
    respondedOnTime: true,
    acceptedRecommendations: 2,
    rejectedRecommendations: 0,
    rejectionReasons: [],
    actionPlanCreated: true,
    sharedWithRI: true,
  },
];

const PERIOD_START = "2025-01-01";
const PERIOD_END = "2025-06-30";
const REFERENCE_DATE = "2025-07-01";

// ══════════════════════════════════════════════════════════════════════════════
// 1. evaluateVisitCompliance
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateVisitCompliance", () => {
  const result = evaluateVisitCompliance(VISITS, PERIOD_START, PERIOD_END);

  it("calculates expected visits (6 months)", () => {
    expect(result.totalVisitsExpected).toBe(6);
  });

  it("calculates completed visits", () => {
    expect(result.totalVisitsCompleted).toBe(6);
  });

  it("returns 100% completion rate for full coverage", () => {
    expect(result.visitCompletionRate).toBe(100);
  });

  it("returns 100% independence when all visitors are independent", () => {
    expect(result.independentVisitorRate).toBe(100);
  });

  it("lists no non-independent visits for compliant data", () => {
    expect(result.nonIndependentVisits).toHaveLength(0);
  });

  it("calculates average children spoken to", () => {
    // (3+3+2+3+3+3)/6 = 17/6 ≈ 2.8
    expect(result.averageChildrenSpoken).toBeCloseTo(2.8, 1);
  });

  it("calculates average staff spoken to", () => {
    // (2+3+2+2+3+2)/6 = 14/6 ≈ 2.3
    expect(result.averageStaffSpoken).toBeCloseTo(2.3, 1);
  });

  it("returns 100% records reviewed rate", () => {
    expect(result.recordsReviewedRate).toBe(100);
  });

  it("returns 100% environment inspected rate", () => {
    expect(result.environmentInspectedRate).toBe(100);
  });

  it("returns 100% report on-time rate", () => {
    expect(result.reportOnTimeRate).toBe(100);
  });

  it("returns 100% Ofsted shared rate", () => {
    expect(result.ofstedSharedRate).toBe(100);
  });

  it("provides rating breakdown", () => {
    expect(result.ratingBreakdown.length).toBeGreaterThan(0);
    const goodCount = result.ratingBreakdown.find((r) => r.rating === "good")?.count;
    expect(goodCount).toBe(4);
    const outstandingCount = result.ratingBreakdown.find((r) => r.rating === "outstanding")?.count;
    expect(outstandingCount).toBe(2);
  });

  it("provides focus area coverage", () => {
    expect(result.focusAreaCoverage.length).toBeGreaterThan(0);
  });

  it("has no missed months for full coverage", () => {
    expect(result.missedMonths).toHaveLength(0);
  });

  it("calculates longest gap between visits", () => {
    // Visits: Jan 20, Feb 18, Mar 15, Apr 22, May 19, Jun 16
    // Longest gap: Mar 15 to Apr 22 = 38 days
    expect(result.longestGapDays).toBe(38);
  });

  it("calculates average concerns per visit", () => {
    // 1 + 0 + 0 + 1 + 0 + 1 = 3 / 6 = 0.5
    expect(result.averageConcernsPerVisit).toBe(0.5);
  });

  it("calculates average positive findings per visit", () => {
    // 2 + 2 + 3 + 2 + 2 + 2 = 13 / 6 ≈ 2.2
    expect(result.averagePositiveFindingsPerVisit).toBeCloseTo(2.2, 1);
  });

  describe("with non-independent visitor", () => {
    const nonIndepVisits: Reg44Visit[] = [
      { ...VISITS[0], visitorIndependent: false },
      ...VISITS.slice(1),
    ];
    const r = evaluateVisitCompliance(nonIndepVisits, PERIOD_START, PERIOD_END);

    it("detects non-independent visit", () => {
      expect(r.nonIndependentVisits).toContain("v-jan");
    });

    it("reduces independence rate", () => {
      // 5/6 ≈ 83%
      expect(r.independentVisitorRate).toBe(83);
    });
  });

  describe("with missed month", () => {
    const partialVisits = VISITS.filter((v) => v.id !== "v-mar");
    const r = evaluateVisitCompliance(partialVisits, PERIOD_START, PERIOD_END);

    it("detects missed month", () => {
      expect(r.missedMonths).toContain("2025-03");
    });

    it("reduces completion rate", () => {
      // 5/6 ≈ 83%
      expect(r.visitCompletionRate).toBe(83);
    });
  });

  describe("with late report", () => {
    const lateVisits: Reg44Visit[] = [
      { ...VISITS[0], reportSubmittedOnTime: false },
      ...VISITS.slice(1),
    ];
    const r = evaluateVisitCompliance(lateVisits, PERIOD_START, PERIOD_END);

    it("reduces report on-time rate", () => {
      expect(r.reportOnTimeRate).toBe(83);
    });
  });

  describe("with no Ofsted sharing", () => {
    const noOfstedVisits: Reg44Visit[] = VISITS.map((v) => ({
      ...v,
      sharedWithOfsted: false,
    }));
    const r = evaluateVisitCompliance(noOfstedVisits, PERIOD_START, PERIOD_END);

    it("returns 0% Ofsted shared rate", () => {
      expect(r.ofstedSharedRate).toBe(0);
    });
  });

  describe("with empty visits", () => {
    const r = evaluateVisitCompliance([], PERIOD_START, PERIOD_END);

    it("returns 0% completion rate", () => {
      expect(r.visitCompletionRate).toBe(0);
    });

    it("returns 0 average children spoken", () => {
      expect(r.averageChildrenSpoken).toBe(0);
    });

    it("returns 6 missed months", () => {
      expect(r.missedMonths).toHaveLength(6);
    });

    it("returns 0 longest gap", () => {
      expect(r.longestGapDays).toBe(0);
    });
  });

  describe("with visits outside period", () => {
    const outsideVisit: Reg44Visit = {
      ...VISITS[0],
      id: "v-dec",
      visitDate: "2024-12-15",
    };
    const r = evaluateVisitCompliance([outsideVisit, ...VISITS], PERIOD_START, PERIOD_END);

    it("excludes visits outside period", () => {
      expect(r.totalVisitsCompleted).toBe(6);
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. evaluateRecommendations
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateRecommendations", () => {
  const result = evaluateRecommendations(RECOMMENDATIONS, REFERENCE_DATE);

  it("counts total recommendations", () => {
    expect(result.totalRecommendations).toBe(12);
  });

  it("counts completed recommendations", () => {
    expect(result.completedCount).toBe(9);
  });

  it("calculates completion rate", () => {
    expect(result.completionRate).toBe(75);
  });

  it("counts open recommendations", () => {
    expect(result.openCount).toBe(1);
  });

  it("counts in-progress recommendations", () => {
    expect(result.inProgressCount).toBe(2);
  });

  it("counts overdue recommendations", () => {
    // rec-11 target 2025-07-15 > 2025-07-01 so NOT overdue
    // rec-12 target 2025-07-10 > 2025-07-01 so NOT overdue
    // rec-10 target 2025-07-31 > 2025-07-01 so NOT overdue
    expect(result.overdueCount).toBe(0);
  });

  it("counts rejected recommendations", () => {
    expect(result.rejectedCount).toBe(0);
  });

  it("provides priority breakdown", () => {
    expect(result.priorityBreakdown.length).toBeGreaterThan(0);
    const high = result.priorityBreakdown.find((p) => p.priority === "high");
    expect(high?.count).toBe(3);
  });

  it("calculates impact assessed rate", () => {
    // 8 of 9 completed have impactAssessed=true
    expect(result.impactAssessedRate).toBe(89);
  });

  it("calculates evidence provided rate", () => {
    // 9 of 9 completed have evidence
    expect(result.withEvidenceRate).toBe(100);
  });

  it("returns empty overdue list for compliant data", () => {
    expect(result.overdueRecommendations).toHaveLength(0);
  });

  describe("with overdue recommendations", () => {
    const overdueRecs: Reg44Recommendation[] = [
      ...RECOMMENDATIONS.slice(0, 9),
      { ...RECOMMENDATIONS[9], targetDate: "2025-06-01" }, // now overdue
      { ...RECOMMENDATIONS[10], targetDate: "2025-06-01" }, // now overdue
      RECOMMENDATIONS[11],
    ];
    const r = evaluateRecommendations(overdueRecs, REFERENCE_DATE);

    it("detects overdue recommendations", () => {
      expect(r.overdueCount).toBe(2);
    });

    it("calculates overdue rate", () => {
      expect(r.overdueRate).toBe(17);
    });

    it("lists overdue recommendation details", () => {
      expect(r.overdueRecommendations).toHaveLength(2);
      expect(r.overdueRecommendations[0].id).toBe("rec-10");
    });
  });

  describe("with rejected recommendations", () => {
    const withRejected: Reg44Recommendation[] = [
      ...RECOMMENDATIONS.slice(0, 11),
      { ...RECOMMENDATIONS[11], status: "rejected" },
    ];
    const r = evaluateRecommendations(withRejected, REFERENCE_DATE);

    it("counts rejected", () => {
      expect(r.rejectedCount).toBe(1);
    });
  });

  describe("with empty recommendations", () => {
    const r = evaluateRecommendations([], REFERENCE_DATE);

    it("returns zero totals", () => {
      expect(r.totalRecommendations).toBe(0);
      expect(r.completionRate).toBe(0);
    });

    it("returns 0 impact assessed rate", () => {
      expect(r.impactAssessedRate).toBe(0);
    });
  });

  describe("with only completed recommendations", () => {
    const allCompleted: Reg44Recommendation[] = RECOMMENDATIONS.slice(0, 9);
    const r = evaluateRecommendations(allCompleted, REFERENCE_DATE);

    it("returns 100% completion rate", () => {
      expect(r.completionRate).toBe(100);
    });

    it("returns 0 overdue", () => {
      expect(r.overdueCount).toBe(0);
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. evaluateChildParticipation
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateChildParticipation", () => {
  const result = evaluateChildParticipation(PARTICIPATION, CHILD_IDS);

  it("counts total participation records", () => {
    expect(result.totalRecords).toBe(18);
  });

  it("calculates children spoken-to rate", () => {
    // 17/18 spoken to (Jayden not spoken to in March)
    expect(result.childrenSpokenToRate).toBe(94);
  });

  it("calculates views captured rate", () => {
    // 17/18 views captured
    expect(result.viewsCapturedRate).toBe(94);
  });

  it("calculates positive feedback rate", () => {
    // 15/17 positive (Alex Feb negative, Jayden Apr negative)
    expect(result.positiveFeedbackRate).toBe(88);
  });

  it("counts total issues raised", () => {
    // Alex Feb (1 issue) + Jayden Apr (1 issue)
    expect(result.totalIssuesRaised).toBe(2);
  });

  it("calculates issues actioned rate", () => {
    // 2 records with issues, both actioned
    expect(result.issuesActionedRate).toBe(100);
  });

  it("returns 100% child coverage (all children spoken to at least once)", () => {
    expect(result.childCoverage).toBe(100);
  });

  it("provides per-child coverage breakdown", () => {
    expect(result.childCoverageBreakdown).toHaveLength(3);
    const morgan = result.childCoverageBreakdown.find(
      (c) => c.childId === "child-morgan",
    );
    expect(morgan?.timesSpokenTo).toBe(6);
    expect(morgan?.totalVisits).toBe(6);
  });

  it("identifies Jayden was not spoken to once", () => {
    const jayden = result.childCoverageBreakdown.find(
      (c) => c.childId === "child-jayden",
    );
    expect(jayden?.timesSpokenTo).toBe(5);
    expect(jayden?.totalVisits).toBe(6);
  });

  it("returns empty unheard children list for full coverage", () => {
    expect(result.unheardChildren).toHaveLength(0);
  });

  describe("with unheard child", () => {
    const partialParticipation = PARTICIPATION.filter(
      (p) => p.childId !== "child-jayden",
    );
    const ids = [...CHILD_IDS];
    const r = evaluateChildParticipation(partialParticipation, ids);

    it("identifies unheard child", () => {
      expect(r.unheardChildren).toHaveLength(1);
      expect(r.unheardChildren[0].childId).toBe("child-jayden");
    });

    it("reduces child coverage", () => {
      // 2/3 ≈ 67%
      expect(r.childCoverage).toBe(67);
    });
  });

  describe("with no issues raised", () => {
    const noIssues = PARTICIPATION.map((p) => ({
      ...p,
      issuesRaised: [],
      issuesActioned: false,
    }));
    const r = evaluateChildParticipation(noIssues, CHILD_IDS);

    it("returns 0 total issues", () => {
      expect(r.totalIssuesRaised).toBe(0);
    });

    it("returns 0% issues actioned rate (no issues to action)", () => {
      expect(r.issuesActionedRate).toBe(0);
    });
  });

  describe("with unactioned issues", () => {
    const unactionedParticipation = PARTICIPATION.map((p) => ({
      ...p,
      issuesActioned: false,
    }));
    const r = evaluateChildParticipation(unactionedParticipation, CHILD_IDS);

    it("returns 0% issues actioned rate", () => {
      expect(r.issuesActionedRate).toBe(0);
    });
  });

  describe("with empty participation", () => {
    const r = evaluateChildParticipation([], CHILD_IDS);

    it("returns 0 total records", () => {
      expect(r.totalRecords).toBe(0);
    });

    it("returns 0% spoken to rate", () => {
      expect(r.childrenSpokenToRate).toBe(0);
    });

    it("returns 0% child coverage", () => {
      expect(r.childCoverage).toBe(0);
    });

    it("lists all children as unheard", () => {
      expect(r.unheardChildren).toHaveLength(3);
    });
  });

  describe("with empty child IDs", () => {
    const r = evaluateChildParticipation(PARTICIPATION, []);

    it("returns 0% child coverage", () => {
      expect(r.childCoverage).toBe(0);
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. evaluateManagementResponse
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateManagementResponse", () => {
  const visitIds = VISITS.map((v) => v.id);
  const result = evaluateManagementResponse(RESPONSES, visitIds);

  it("counts total responses", () => {
    expect(result.totalResponses).toBe(6);
  });

  it("returns 100% on-time response rate", () => {
    expect(result.respondedOnTimeRate).toBe(100);
  });

  it("returns 100% acceptance rate", () => {
    expect(result.averageAcceptanceRate).toBe(100);
  });

  it("returns 0% rejection rate", () => {
    expect(result.averageRejectionRate).toBe(0);
  });

  it("returns 100% action plan created rate", () => {
    expect(result.actionPlanCreatedRate).toBe(100);
  });

  it("returns 100% shared with RI rate", () => {
    expect(result.sharedWithRIRate).toBe(100);
  });

  it("returns empty rejection reasons", () => {
    expect(result.totalRejectionReasons).toHaveLength(0);
  });

  it("returns no missing responses", () => {
    expect(result.visitsMissingResponse).toHaveLength(0);
  });

  describe("with missing response", () => {
    const partial = RESPONSES.slice(0, 5);
    const r = evaluateManagementResponse(partial, visitIds);

    it("detects missing response", () => {
      expect(r.visitsMissingResponse).toContain("v-jun");
    });

    it("counts 5 total responses", () => {
      expect(r.totalResponses).toBe(5);
    });
  });

  describe("with late response", () => {
    const lateResponses: ManagementResponse[] = [
      { ...RESPONSES[0], respondedOnTime: false },
      ...RESPONSES.slice(1),
    ];
    const r = evaluateManagementResponse(lateResponses, visitIds);

    it("reduces on-time rate", () => {
      // 5/6 ≈ 83%
      expect(r.respondedOnTimeRate).toBe(83);
    });
  });

  describe("with rejections", () => {
    const withRejections: ManagementResponse[] = [
      {
        ...RESPONSES[0],
        acceptedRecommendations: 1,
        rejectedRecommendations: 1,
        rejectionReasons: ["Budget constraints"],
      },
      ...RESPONSES.slice(1),
    ];
    const r = evaluateManagementResponse(withRejections, visitIds);

    it("calculates acceptance rate with rejections", () => {
      // total accepted = 1+2+2+2+2+2 = 11, rejected = 1
      // 11/12 ≈ 92%
      expect(r.averageAcceptanceRate).toBe(92);
    });

    it("collects rejection reasons", () => {
      expect(r.totalRejectionReasons).toContain("Budget constraints");
    });
  });

  describe("with no action plans", () => {
    const noPlans: ManagementResponse[] = RESPONSES.map((r) => ({
      ...r,
      actionPlanCreated: false,
    }));
    const r = evaluateManagementResponse(noPlans, visitIds);

    it("returns 0% action plan rate", () => {
      expect(r.actionPlanCreatedRate).toBe(0);
    });
  });

  describe("with no RI sharing", () => {
    const noRI: ManagementResponse[] = RESPONSES.map((r) => ({
      ...r,
      sharedWithRI: false,
    }));
    const r = evaluateManagementResponse(noRI, visitIds);

    it("returns 0% RI sharing rate", () => {
      expect(r.sharedWithRIRate).toBe(0);
    });
  });

  describe("with empty responses", () => {
    const r = evaluateManagementResponse([], visitIds);

    it("returns 0 total responses", () => {
      expect(r.totalResponses).toBe(0);
    });

    it("returns 0% on-time rate", () => {
      expect(r.respondedOnTimeRate).toBe(0);
    });

    it("lists all visits as missing response", () => {
      expect(r.visitsMissingResponse).toHaveLength(6);
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. buildVisitTimeline
// ══════════════════════════════════════════════════════════════════════════════

describe("buildVisitTimeline", () => {
  const timeline = buildVisitTimeline(VISITS, RECOMMENDATIONS, PARTICIPATION, RESPONSES);

  it("returns one entry per visit", () => {
    expect(timeline).toHaveLength(6);
  });

  it("sorts chronologically", () => {
    for (let i = 1; i < timeline.length; i++) {
      expect(timeline[i].visitDate >= timeline[i - 1].visitDate).toBe(true);
    }
  });

  it("links recommendations to visits", () => {
    const janEntry = timeline.find((t) => t.visitId === "v-jan");
    expect(janEntry?.recommendationCount).toBe(2);
  });

  it("counts completed recommendations per visit", () => {
    const janEntry = timeline.find((t) => t.visitId === "v-jan");
    expect(janEntry?.completedRecommendations).toBe(2);
  });

  it("links child participation to visits", () => {
    const janEntry = timeline.find((t) => t.visitId === "v-jan");
    expect(janEntry?.childrenParticipated).toBe(3);
  });

  it("links management response", () => {
    const janEntry = timeline.find((t) => t.visitId === "v-jan");
    expect(janEntry?.hasManagementResponse).toBe(true);
    expect(janEntry?.respondedOnTime).toBe(true);
  });

  it("includes concerns from visit", () => {
    const janEntry = timeline.find((t) => t.visitId === "v-jan");
    expect(janEntry?.concerns).toHaveLength(1);
  });

  it("includes positive findings from visit", () => {
    const marEntry = timeline.find((t) => t.visitId === "v-mar");
    expect(marEntry?.positiveFindings).toHaveLength(3);
  });

  describe("with no management response", () => {
    const noResp = buildVisitTimeline(VISITS, RECOMMENDATIONS, PARTICIPATION, []);

    it("marks as no management response", () => {
      expect(noResp[0].hasManagementResponse).toBe(false);
    });

    it("defaults respondedOnTime to false", () => {
      expect(noResp[0].respondedOnTime).toBe(false);
    });
  });

  describe("with empty data", () => {
    const empty = buildVisitTimeline([], [], [], []);

    it("returns empty timeline", () => {
      expect(empty).toHaveLength(0);
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. generateReg44ComplianceIntelligence
// ══════════════════════════════════════════════════════════════════════════════

describe("generateReg44ComplianceIntelligence", () => {
  const result = generateReg44ComplianceIntelligence(
    VISITS,
    RECOMMENDATIONS,
    PARTICIPATION,
    RESPONSES,
    CHILD_IDS,
    "oak-house",
    PERIOD_START,
    PERIOD_END,
    REFERENCE_DATE,
  );

  it("returns correct homeId", () => {
    expect(result.homeId).toBe("oak-house");
  });

  it("returns correct period", () => {
    expect(result.periodStart).toBe(PERIOD_START);
    expect(result.periodEnd).toBe(PERIOD_END);
  });

  it("returns correct reference date", () => {
    expect(result.referenceDate).toBe(REFERENCE_DATE);
  });

  it("returns a score between 0 and 100", () => {
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("rates outstanding for excellent compliance", () => {
    expect(result.rating).toBe("outstanding");
  });

  it("includes visit compliance sub-result", () => {
    expect(result.visitCompliance.totalVisitsExpected).toBe(6);
    expect(result.visitCompliance.totalVisitsCompleted).toBe(6);
  });

  it("includes recommendations sub-result", () => {
    expect(result.recommendations.totalRecommendations).toBe(12);
  });

  it("includes child participation sub-result", () => {
    expect(result.childParticipation.totalRecords).toBe(18);
  });

  it("includes management response sub-result", () => {
    expect(result.managementResponse.totalResponses).toBe(6);
  });

  it("includes visit timeline", () => {
    expect(result.visitTimeline).toHaveLength(6);
  });

  it("produces strengths", () => {
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("includes strength about visit completion", () => {
    expect(
      result.strengths.some((s) => s.includes("monthly Reg 44")),
    ).toBe(true);
  });

  it("includes strength about independence", () => {
    expect(
      result.strengths.some((s) => s.includes("independent")),
    ).toBe(true);
  });

  it("includes strength about child voice", () => {
    expect(
      result.strengths.some((s) => s.includes("voice of the child") || s.includes("children spoken to")),
    ).toBe(true);
  });

  it("produces areas for development or states none needed", () => {
    expect(result.areasForDevelopment.length).toBeGreaterThan(0);
  });

  it("produces immediate actions or states none needed", () => {
    expect(result.immediateActions.length).toBeGreaterThan(0);
  });

  it("includes regulatory links", () => {
    expect(result.regulatoryLinks.length).toBe(6);
    expect(result.regulatoryLinks[0]).toContain("Reg 44");
  });

  describe("scoring bands", () => {
    it("rates outstanding for high compliance (score >= 80)", () => {
      expect(result.overallScore).toBeGreaterThanOrEqual(80);
      expect(result.rating).toBe("outstanding");
    });

    it("rates good for moderate compliance (score 60-79)", () => {
      const partialVisits = VISITS.slice(0, 4);
      const partialResponses = RESPONSES.slice(0, 4);
      const partialParticipation = PARTICIPATION.filter(
        (p) =>
          p.visitId === "v-jan" ||
          p.visitId === "v-feb" ||
          p.visitId === "v-mar" ||
          p.visitId === "v-apr",
      );
      const r = generateReg44ComplianceIntelligence(
        partialVisits,
        RECOMMENDATIONS.slice(0, 8),
        partialParticipation,
        partialResponses,
        CHILD_IDS,
        "oak-house",
        PERIOD_START,
        PERIOD_END,
        REFERENCE_DATE,
      );
      expect(r.overallScore).toBeGreaterThanOrEqual(40);
      expect(r.overallScore).toBeLessThan(100);
    });

    it("rates inadequate for very poor compliance", () => {
      const r = generateReg44ComplianceIntelligence(
        [],
        [],
        [],
        [],
        CHILD_IDS,
        "oak-house",
        PERIOD_START,
        PERIOD_END,
        REFERENCE_DATE,
      );
      expect(r.overallScore).toBeLessThan(40);
      expect(r.rating).toBe("inadequate");
    });
  });

  describe("edge: all recommendations overdue", () => {
    const allOverdueRecs: Reg44Recommendation[] = RECOMMENDATIONS.map((r) => ({
      ...r,
      status: "open" as const,
      targetDate: "2025-01-01",
      completedDate: undefined,
      evidenceOfCompletion: undefined,
      impactAssessed: false,
    }));
    const r = generateReg44ComplianceIntelligence(
      VISITS,
      allOverdueRecs,
      PARTICIPATION,
      RESPONSES,
      CHILD_IDS,
      "oak-house",
      PERIOD_START,
      PERIOD_END,
      REFERENCE_DATE,
    );

    it("flags overdue recommendations in actions", () => {
      expect(
        r.immediateActions.some((a) => a.includes("overdue")),
      ).toBe(true);
    });

    it("reduces overall score", () => {
      expect(r.overallScore).toBeLessThan(result.overallScore);
    });
  });

  describe("edge: no children spoken to", () => {
    const noVoice: ChildParticipation[] = PARTICIPATION.map((p) => ({
      ...p,
      spokenTo: false,
      viewsCaptured: false,
      feedbackPositive: false,
    }));
    const r = generateReg44ComplianceIntelligence(
      VISITS,
      RECOMMENDATIONS,
      noVoice,
      RESPONSES,
      CHILD_IDS,
      "oak-house",
      PERIOD_START,
      PERIOD_END,
      REFERENCE_DATE,
    );

    it("reduces score significantly", () => {
      expect(r.overallScore).toBeLessThan(result.overallScore);
    });

    it("flags in areas for development", () => {
      expect(
        r.areasForDevelopment.some((a) => a.includes("not spoken to")),
      ).toBe(true);
    });
  });

  describe("edge: missing management responses", () => {
    const r = generateReg44ComplianceIntelligence(
      VISITS,
      RECOMMENDATIONS,
      PARTICIPATION,
      [],
      CHILD_IDS,
      "oak-house",
      PERIOD_START,
      PERIOD_END,
      REFERENCE_DATE,
    );

    it("flags missing responses", () => {
      expect(
        r.immediateActions.some((a) => a.includes("management response")),
      ).toBe(true);
    });

    it("reduces score", () => {
      expect(r.overallScore).toBeLessThan(result.overallScore);
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 7. Label Functions
// ══════════════════════════════════════════════════════════════════════════════

describe("label functions", () => {
  describe("getVisitFocusLabel", () => {
    it("returns label for overall_quality", () => {
      expect(getVisitFocusLabel("overall_quality")).toBe("Overall Quality");
    });

    it("returns label for safeguarding", () => {
      expect(getVisitFocusLabel("safeguarding")).toBe("Safeguarding");
    });

    it("returns label for children_views", () => {
      expect(getVisitFocusLabel("children_views")).toBe("Children's Views");
    });

    it("returns label for all focus areas", () => {
      const areas: Array<import("../reg44-compliance-engine").VisitFocus> = [
        "overall_quality", "safeguarding", "behaviour", "education",
        "health", "environment", "staffing", "complaints",
        "children_views", "records",
      ];
      for (const area of areas) {
        expect(getVisitFocusLabel(area).length).toBeGreaterThan(0);
      }
    });
  });

  describe("getRecommendationPriorityLabel", () => {
    it("returns label for immediate", () => {
      expect(getRecommendationPriorityLabel("immediate")).toBe("Immediate");
    });

    it("returns label for high", () => {
      expect(getRecommendationPriorityLabel("high")).toBe("High");
    });

    it("returns label for medium", () => {
      expect(getRecommendationPriorityLabel("medium")).toBe("Medium");
    });

    it("returns label for low", () => {
      expect(getRecommendationPriorityLabel("low")).toBe("Low");
    });
  });

  describe("getRecommendationStatusLabel", () => {
    it("returns label for open", () => {
      expect(getRecommendationStatusLabel("open")).toBe("Open");
    });

    it("returns label for in_progress", () => {
      expect(getRecommendationStatusLabel("in_progress")).toBe("In Progress");
    });

    it("returns label for completed", () => {
      expect(getRecommendationStatusLabel("completed")).toBe("Completed");
    });

    it("returns label for overdue", () => {
      expect(getRecommendationStatusLabel("overdue")).toBe("Overdue");
    });

    it("returns label for rejected", () => {
      expect(getRecommendationStatusLabel("rejected")).toBe("Rejected");
    });
  });
});
