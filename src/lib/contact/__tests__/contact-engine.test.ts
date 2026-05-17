// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Contact & Family Time — Engine Tests
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateContactCompliance,
  calculateHomeContactMetrics,
  getRelationshipLabel,
  getContactTypeLabel,
  getSessionStatusLabel,
} from "../contact-engine";
import type {
  ContactArrangement,
  ContactSession,
  ContactFrequency,
  ChildMood,
} from "../contact-engine";

// ── Constants ──────────────────────────────────────────────────────────────

const FIXED_NOW = "2026-05-16T12:00:00Z";

// ── Factories ──────────────────────────────────────────────────────────────

function makeMood(overrides: Partial<ChildMood> = {}): ChildMood {
  return { before: 3, during: 4, after: 4, ...overrides };
}

function makeSession(overrides: Partial<ContactSession> = {}): ContactSession {
  return {
    id: "sess-001",
    scheduledDate: "2026-05-10T14:00:00Z",
    actualDate: "2026-05-10T14:05:00Z",
    duration: 60,
    actualDuration: 55,
    status: "attended",
    supervisorName: "Sarah Jones",
    venue: "contact_centre",
    outcome: "positive",
    childMood: makeMood(),
    observations: ["Good interaction"],
    concerns: [],
    positives: ["Warm greeting"],
    actionRequired: false,
    recordedBy: "Staff Member",
    recordedAt: "2026-05-10T15:30:00Z",
    ...overrides,
  };
}

function makeFrequency(overrides: Partial<ContactFrequency> = {}): ContactFrequency {
  return { timesPerWeek: 1, ...overrides };
}

function makeArrangement(overrides: Partial<ContactArrangement> = {}): ContactArrangement {
  return {
    id: "arr-001",
    childId: "child-jordan",
    childName: "Jordan Williams",
    homeId: "home-oak",
    contactPersonName: "Lisa Williams",
    relationship: "birth_mother",
    contactType: "supervised",
    venue: "contact_centre",
    frequency: makeFrequency(),
    supervisorRequired: true,
    courtOrdered: false,
    careplanAgreed: true,
    riskLevel: "medium",
    lastRiskAssessmentDate: "2026-04-01T00:00:00Z",
    conditions: ["No discussion of court proceedings"],
    childWishesRecorded: true,
    childWishesDate: "2026-04-15T00:00:00Z",
    childWishesSummary: "Jordan happy to see mum weekly",
    placementStartDate: "2024-09-01T00:00:00Z",
    contactPlanDate: "2024-09-05T00:00:00Z",
    sessions: [
      makeSession({ id: "s1", scheduledDate: "2026-05-03T14:00:00Z" }),
      makeSession({ id: "s2", scheduledDate: "2026-05-10T14:00:00Z" }),
      makeSession({ id: "s3", scheduledDate: "2026-04-26T14:00:00Z" }),
      makeSession({ id: "s4", scheduledDate: "2026-04-19T14:00:00Z" }),
      makeSession({ id: "s5", scheduledDate: "2026-04-12T14:00:00Z" }),
    ],
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// evaluateContactCompliance
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateContactCompliance", () => {
  it("returns compliant for good arrangement", () => {
    const arrangement = makeArrangement();
    const result = evaluateContactCompliance(arrangement, FIXED_NOW);
    expect(result.isCompliant).toBe(true);
    expect(result.issues).toHaveLength(0);
    expect(result.contactPlanInPlace).toBe(true);
    expect(result.contactPlanTimely).toBe(true);
    expect(result.frequencyMet).toBe(true);
    expect(result.riskAssessmentCurrent).toBe(true);
    expect(result.childWishesCurrent).toBe(true);
    expect(result.supervisorCompliant).toBe(true);
  });

  it("flags missing contact plan after deadline", () => {
    const arrangement = makeArrangement({
      contactPlanDate: undefined,
      placementStartDate: "2026-04-01T00:00:00Z", // >5 working days ago
    });
    const result = evaluateContactCompliance(arrangement, FIXED_NOW);
    expect(result.contactPlanInPlace).toBe(false);
    expect(result.issues.some(i => i.includes("Contact plan not established"))).toBe(true);
  });

  it("flags late contact plan", () => {
    const arrangement = makeArrangement({
      placementStartDate: "2026-04-01T00:00:00Z",
      contactPlanDate: "2026-04-20T00:00:00Z", // 19 days later - well past 5 working day deadline
    });
    const result = evaluateContactCompliance(arrangement, FIXED_NOW);
    expect(result.contactPlanTimely).toBe(false);
    expect(result.issues.some(i => i.includes("after statutory deadline"))).toBe(true);
  });

  it("flags frequency not met", () => {
    const arrangement = makeArrangement({
      frequency: makeFrequency({ timesPerWeek: 3 }), // expect ~13/month
      sessions: [
        makeSession({ id: "s1", scheduledDate: "2026-05-10T14:00:00Z" }),
        makeSession({ id: "s2", scheduledDate: "2026-05-03T14:00:00Z" }),
      ],
    });
    const result = evaluateContactCompliance(arrangement, FIXED_NOW);
    expect(result.frequencyMet).toBe(false);
    expect(result.issues.some(i => i.includes("frequency not met"))).toBe(true);
  });

  it("marks frequency met when enough sessions attended", () => {
    const arrangement = makeArrangement({
      frequency: makeFrequency({ timesPerMonth: 4 }),
      sessions: [
        makeSession({ id: "s1", scheduledDate: "2026-05-10T14:00:00Z" }),
        makeSession({ id: "s2", scheduledDate: "2026-05-03T14:00:00Z" }),
        makeSession({ id: "s3", scheduledDate: "2026-04-26T14:00:00Z" }),
        makeSession({ id: "s4", scheduledDate: "2026-04-19T14:00:00Z" }),
      ],
    });
    const result = evaluateContactCompliance(arrangement, FIXED_NOW);
    expect(result.frequencyMet).toBe(true);
  });

  it("flags overdue risk assessment", () => {
    const arrangement = makeArrangement({
      lastRiskAssessmentDate: "2026-01-01T00:00:00Z", // >90 days ago
    });
    const result = evaluateContactCompliance(arrangement, FIXED_NOW);
    expect(result.riskAssessmentCurrent).toBe(false);
    expect(result.issues.some(i => i.includes("Risk assessment overdue"))).toBe(true);
  });

  it("flags no risk assessment date", () => {
    const arrangement = makeArrangement({
      lastRiskAssessmentDate: undefined,
    });
    const result = evaluateContactCompliance(arrangement, FIXED_NOW);
    expect(result.riskAssessmentCurrent).toBe(false);
  });

  it("flags overdue child wishes", () => {
    const arrangement = makeArrangement({
      childWishesDate: "2026-01-01T00:00:00Z", // >90 days ago
    });
    const result = evaluateContactCompliance(arrangement, FIXED_NOW);
    expect(result.childWishesCurrent).toBe(false);
    expect(result.issues.some(i => i.includes("wishes"))).toBe(true);
  });

  it("flags child wishes not recorded", () => {
    const arrangement = makeArrangement({
      childWishesRecorded: false,
    });
    const result = evaluateContactCompliance(arrangement, FIXED_NOW);
    expect(result.childWishesCurrent).toBe(false);
  });

  it("flags supervised sessions without named supervisor", () => {
    const arrangement = makeArrangement({
      supervisorRequired: true,
      sessions: [
        makeSession({ id: "s1", supervisorName: undefined }),
        makeSession({ id: "s2", supervisorName: "Sarah Jones" }),
      ],
    });
    const result = evaluateContactCompliance(arrangement, FIXED_NOW);
    expect(result.supervisorCompliant).toBe(false);
    expect(result.issues.some(i => i.includes("without named supervisor"))).toBe(true);
  });

  it("does not flag unsupervised arrangement for missing supervisor", () => {
    const arrangement = makeArrangement({
      supervisorRequired: false,
      sessions: [
        makeSession({ id: "s1", supervisorName: undefined }),
      ],
    });
    const result = evaluateContactCompliance(arrangement, FIXED_NOW);
    expect(result.supervisorCompliant).toBe(true);
  });

  it("calculates attendance rate", () => {
    const arrangement = makeArrangement({
      sessions: [
        makeSession({ id: "s1", status: "attended" }),
        makeSession({ id: "s2", status: "attended" }),
        makeSession({ id: "s3", status: "dna_family" }),
        makeSession({ id: "s4", status: "cancelled_by_family" }),
      ],
    });
    const result = evaluateContactCompliance(arrangement, FIXED_NOW);
    expect(result.attendanceRate).toBe(50);
  });

  it("calculates cancellation rate", () => {
    const arrangement = makeArrangement({
      sessions: [
        makeSession({ id: "s1", status: "attended" }),
        makeSession({ id: "s2", status: "cancelled_by_family" }),
        makeSession({ id: "s3", status: "dna_family" }),
        makeSession({ id: "s4", status: "attended" }),
      ],
    });
    const result = evaluateContactCompliance(arrangement, FIXED_NOW);
    expect(result.cancellationRate).toBe(50);
  });

  it("generates recommendation for high cancellation rate", () => {
    const arrangement = makeArrangement({
      sessions: [
        makeSession({ id: "s1", status: "cancelled_by_family", scheduledDate: "2026-05-10T14:00:00Z" }),
        makeSession({ id: "s2", status: "dna_family", scheduledDate: "2026-05-03T14:00:00Z" }),
        makeSession({ id: "s3", status: "attended", scheduledDate: "2026-04-26T14:00:00Z" }),
      ],
    });
    const result = evaluateContactCompliance(arrangement, FIXED_NOW);
    expect(result.recommendations.some(r => r.includes("cancellation rate"))).toBe(true);
  });

  it("calculates average outcome score", () => {
    const arrangement = makeArrangement({
      sessions: [
        makeSession({ id: "s1", outcome: "positive" }),  // 4
        makeSession({ id: "s2", outcome: "positive" }),  // 4
        makeSession({ id: "s3", outcome: "mixed" }),     // 3
        makeSession({ id: "s4", outcome: "negative" }),  // 1
      ],
    });
    const result = evaluateContactCompliance(arrangement, FIXED_NOW);
    expect(result.averageOutcomeScore).toBe(3);  // (4+4+3+1)/4
  });

  it("flags poor average outcome", () => {
    const arrangement = makeArrangement({
      sessions: [
        makeSession({ id: "s1", outcome: "negative" }),
        makeSession({ id: "s2", outcome: "negative" }),
        makeSession({ id: "s3", outcome: "neutral" }),
      ],
    });
    const result = evaluateContactCompliance(arrangement, FIXED_NOW);
    expect(result.recommendations.some(r => r.includes("poor outcomes"))).toBe(true);
  });

  it("detects improving mood trend", () => {
    const arrangement = makeArrangement({
      sessions: [
        makeSession({ id: "s1", scheduledDate: "2026-04-01T14:00:00Z", childMood: makeMood({ after: 2 }) }),
        makeSession({ id: "s2", scheduledDate: "2026-04-08T14:00:00Z", childMood: makeMood({ after: 2 }) }),
        makeSession({ id: "s3", scheduledDate: "2026-04-15T14:00:00Z", childMood: makeMood({ after: 4 }) }),
        makeSession({ id: "s4", scheduledDate: "2026-04-22T14:00:00Z", childMood: makeMood({ after: 5 }) }),
      ],
    });
    const result = evaluateContactCompliance(arrangement, FIXED_NOW);
    expect(result.moodTrend).toBe("improving");
  });

  it("detects declining mood trend", () => {
    const arrangement = makeArrangement({
      sessions: [
        makeSession({ id: "s1", scheduledDate: "2026-04-01T14:00:00Z", childMood: makeMood({ after: 5 }) }),
        makeSession({ id: "s2", scheduledDate: "2026-04-08T14:00:00Z", childMood: makeMood({ after: 4 }) }),
        makeSession({ id: "s3", scheduledDate: "2026-04-15T14:00:00Z", childMood: makeMood({ after: 2 }) }),
        makeSession({ id: "s4", scheduledDate: "2026-04-22T14:00:00Z", childMood: makeMood({ after: 1 }) }),
      ],
    });
    const result = evaluateContactCompliance(arrangement, FIXED_NOW);
    expect(result.moodTrend).toBe("declining");
    expect(result.recommendations.some(r => r.includes("mood declining"))).toBe(true);
  });

  it("returns insufficient_data for few sessions", () => {
    const arrangement = makeArrangement({
      sessions: [
        makeSession({ id: "s1" }),
        makeSession({ id: "s2" }),
      ],
    });
    const result = evaluateContactCompliance(arrangement, FIXED_NOW);
    expect(result.moodTrend).toBe("insufficient_data");
  });

  it("flags court-ordered contact frequency not met", () => {
    const arrangement = makeArrangement({
      courtOrdered: true,
      frequency: makeFrequency({ timesPerWeek: 3 }),
      sessions: [
        makeSession({ id: "s1", scheduledDate: "2026-05-10T14:00:00Z" }),
      ],
    });
    const result = evaluateContactCompliance(arrangement, FIXED_NOW);
    expect(result.issues.some(i => i.includes("Court-ordered"))).toBe(true);
    expect(result.recommendations.some(r => r.includes("URGENT"))).toBe(true);
  });

  it("handles arrangement with no sessions gracefully", () => {
    const arrangement = makeArrangement({
      sessions: [],
      frequency: makeFrequency({ timesPerYear: 4 }), // low frequency, won't trigger
    });
    const result = evaluateContactCompliance(arrangement, FIXED_NOW);
    expect(result.attendanceRate).toBe(100);
    expect(result.cancellationRate).toBe(0);
    expect(result.moodTrend).toBe("insufficient_data");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// calculateHomeContactMetrics
// ══════════════════════════════════════════════════════════════════════════════

describe("calculateHomeContactMetrics", () => {
  it("calculates overall compliance rate", () => {
    const arrangements = [
      makeArrangement({ id: "a1", childId: "c1" }), // compliant
      makeArrangement({ id: "a2", childId: "c2", lastRiskAssessmentDate: "2025-01-01T00:00:00Z" }), // non-compliant
    ];
    const result = calculateHomeContactMetrics(arrangements, "home-oak", FIXED_NOW);
    expect(result.overallComplianceRate).toBe(50);
  });

  it("counts total and active arrangements", () => {
    const arrangements = [
      makeArrangement({ id: "a1", childId: "c1" }),
      makeArrangement({ id: "a2", childId: "c2" }),
      makeArrangement({ id: "a3", childId: "c3" }),
    ];
    const result = calculateHomeContactMetrics(arrangements, "home-oak", FIXED_NOW);
    expect(result.totalArrangements).toBe(3);
    expect(result.activeArrangements).toBe(3);
  });

  it("lists upcoming sessions", () => {
    const arrangements = [
      makeArrangement({
        id: "a1",
        childId: "c1",
        sessions: [
          makeSession({ id: "s1", scheduledDate: "2026-05-20T14:00:00Z", status: "scheduled" }),
          makeSession({ id: "s2", scheduledDate: "2026-06-15T14:00:00Z", status: "scheduled" }), // >14 days
        ],
      }),
    ];
    const result = calculateHomeContactMetrics(arrangements, "home-oak", FIXED_NOW);
    expect(result.upcomingSessions).toHaveLength(1);
    expect(result.upcomingSessions[0].contactPerson).toBe("Lisa Williams");
  });

  it("aggregates concerns from all arrangements", () => {
    const arrangements = [
      makeArrangement({ id: "a1", childId: "c1", lastRiskAssessmentDate: "2025-01-01T00:00:00Z" }),
      makeArrangement({ id: "a2", childId: "c2", childWishesRecorded: false }),
    ];
    const result = calculateHomeContactMetrics(arrangements, "home-oak", FIXED_NOW);
    expect(result.concerns.length).toBeGreaterThanOrEqual(2);
  });

  it("filters to correct home", () => {
    const arrangements = [
      makeArrangement({ id: "a1", childId: "c1", homeId: "home-oak" }),
      makeArrangement({ id: "a2", childId: "c2", homeId: "home-elm" }),
    ];
    const result = calculateHomeContactMetrics(arrangements, "home-oak", FIXED_NOW);
    expect(result.totalArrangements).toBe(1);
  });

  it("calculates outcome breakdown", () => {
    const arrangements = [
      makeArrangement({
        id: "a1",
        sessions: [
          makeSession({ id: "s1", outcome: "positive" }),
          makeSession({ id: "s2", outcome: "positive" }),
          makeSession({ id: "s3", outcome: "mixed" }),
          makeSession({ id: "s4", outcome: "negative" }),
        ],
      }),
    ];
    const result = calculateHomeContactMetrics(arrangements, "home-oak", FIXED_NOW);
    expect(result.outcomeBreakdown.positive).toBe(2);
    expect(result.outcomeBreakdown.mixed).toBe(1);
    expect(result.outcomeBreakdown.negative).toBe(1);
  });

  it("returns defaults for no arrangements", () => {
    const result = calculateHomeContactMetrics([], "home-oak", FIXED_NOW);
    expect(result.totalArrangements).toBe(0);
    expect(result.overallComplianceRate).toBe(100);
    expect(result.averageAttendanceRate).toBe(100);
    expect(result.averageCancellationRate).toBe(0);
  });

  it("calculates sessions this month and last month", () => {
    const arrangements = [
      makeArrangement({
        id: "a1",
        sessions: [
          makeSession({ id: "s1", scheduledDate: "2026-05-10T14:00:00Z", status: "attended" }),
          makeSession({ id: "s2", scheduledDate: "2026-05-03T14:00:00Z", status: "attended" }),
          makeSession({ id: "s3", scheduledDate: "2026-04-15T14:00:00Z", status: "attended" }),
          makeSession({ id: "s4", scheduledDate: "2026-04-08T14:00:00Z", status: "attended" }),
          makeSession({ id: "s5", scheduledDate: "2026-04-01T14:00:00Z", status: "attended" }),
        ],
      }),
    ];
    const result = calculateHomeContactMetrics(arrangements, "home-oak", FIXED_NOW);
    expect(result.sessionsThisMonth).toBe(2);
    expect(result.sessionsLastMonth).toBe(3);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Helper functions
// ══════════════════════════════════════════════════════════════════════════════

describe("helper functions", () => {
  it("getRelationshipLabel returns labels", () => {
    expect(getRelationshipLabel("birth_mother")).toBe("Birth Mother");
    expect(getRelationshipLabel("sibling")).toBe("Sibling");
    expect(getRelationshipLabel("previous_carer")).toBe("Previous Carer");
  });

  it("getContactTypeLabel returns labels", () => {
    expect(getContactTypeLabel("supervised")).toBe("Supervised");
    expect(getContactTypeLabel("letterbox")).toBe("Letterbox");
    expect(getContactTypeLabel("video_call")).toBe("Video Call");
  });

  it("getSessionStatusLabel returns labels", () => {
    expect(getSessionStatusLabel("attended")).toBe("Attended");
    expect(getSessionStatusLabel("dna_family")).toBe("DNA (Family)");
    expect(getSessionStatusLabel("cut_short")).toBe("Cut Short");
  });
});
