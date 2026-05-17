// ══════════════════════════════════════════════════════════════════════════════
// Reg 44/45 Independent Visits Engine — Tests
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateVisitCompliance,
  calculateHomeReg44Metrics,
  getVisitAreaLabel,
  getVisitRatingLabel,
} from "../reg44-engine";
import type { Reg44Visit, HomeReg44Profile, Reg44Action } from "../reg44-engine";

// ── Fixtures ──────────────────────────────────────────────────────────────

const NOW = "2026-05-17T12:00:00Z";

function makeAreaAssessments() {
  return [
    { area: "welfare_of_children" as const, rating: "good" as const, observations: "Children appear happy and settled", evidenceReviewed: ["Daily logs", "Keywork records"] },
    { area: "safety" as const, rating: "good" as const, observations: "Home secure, fire equipment in date", evidenceReviewed: ["Fire log", "Risk assessments"] },
    { area: "staffing" as const, rating: "good" as const, observations: "Adequate staffing levels observed", evidenceReviewed: ["Rota", "Supervision records"] },
    { area: "environment" as const, rating: "good" as const, observations: "Clean, well-maintained, homely", evidenceReviewed: ["Maintenance log", "Visual inspection"] },
    { area: "complaints_and_concerns" as const, rating: "good" as const, observations: "No open complaints", evidenceReviewed: ["Complaints log"] },
    { area: "education" as const, rating: "good" as const, observations: "All children attending school", evidenceReviewed: ["PEPs", "Attendance data"] },
    { area: "health" as const, rating: "good" as const, observations: "Health appointments up to date", evidenceReviewed: ["Health records", "Medication log"] },
    { area: "contact_arrangements" as const, rating: "good" as const, observations: "Contact plans being followed", evidenceReviewed: ["Contact records"] },
    { area: "records_and_documentation" as const, rating: "adequate" as const, observations: "Records mostly up to date, minor gaps in daily log", evidenceReviewed: ["Daily logs", "Care plans"] },
    { area: "leadership_and_management" as const, rating: "good" as const, observations: "Strong leadership evident", evidenceReviewed: ["Team meeting minutes", "Supervision records"] },
  ];
}

function makeActions(visitId: string): Reg44Action[] {
  return [
    { id: `act-${visitId}-1`, visitId, description: "Ensure daily logs completed consistently", priority: "medium", assignedTo: "staff-rm-01", dueDate: "2026-05-20T10:00:00Z", status: "completed", completedDate: "2026-05-15T10:00:00Z" },
    { id: `act-${visitId}-2`, visitId, description: "Update fire evacuation signage in corridor", priority: "low", assignedTo: "staff-rm-01", dueDate: "2026-05-25T10:00:00Z", status: "in_progress" },
  ];
}

function makeVisit(overrides: Partial<Reg44Visit> = {}): Reg44Visit {
  return {
    id: "v44-001",
    homeId: "home-oak",
    visitDate: "2026-05-06T10:00:00Z",
    visitorName: "Margaret Thompson",
    visitorIndependent: true,
    visitDuration: 180,
    childrenSpokenTo: ["Alex", "Jordan", "Sam", "Casey"],
    childrenSpokenToPrivately: ["Alex", "Jordan", "Sam"],
    totalChildrenInHome: 4,
    areasAssessed: makeAreaAssessments(),
    reportCompletedDate: "2026-05-08T14:00:00Z",
    reportSentToOfstedDate: "2026-05-09T10:00:00Z",
    reportSentToManagerDate: "2026-05-08T15:00:00Z",
    reportSentToRIDate: "2026-05-09T10:00:00Z",
    overallRating: "good",
    keyFindings: ["Home well-run", "Children settled", "Strong relationships"],
    positiveObservations: ["Warm atmosphere", "Child-led activities evident"],
    areasForImprovement: ["Daily log consistency"],
    actionsRaised: makeActions("v44-001"),
    previousActionsReviewed: true,
    ...overrides,
  };
}

function makeProfile(overrides: Partial<HomeReg44Profile> = {}): HomeReg44Profile {
  return {
    homeId: "home-oak",
    visits: [
      makeVisit({ id: "v44-001", visitDate: "2026-05-06T10:00:00Z" }),
      makeVisit({ id: "v44-002", visitDate: "2026-04-10T10:00:00Z" }),
      makeVisit({ id: "v44-003", visitDate: "2026-03-14T10:00:00Z" }),
      makeVisit({ id: "v44-004", visitDate: "2026-02-15T10:00:00Z" }),
      makeVisit({ id: "v44-005", visitDate: "2026-01-20T10:00:00Z" }),
      makeVisit({ id: "v44-006", visitDate: "2025-12-24T10:00:00Z" }),
    ],
    currentVisitorName: "Margaret Thompson",
    visitorAppointedDate: "2024-06-01T10:00:00Z",
    visitorDBSDate: "2024-05-15T10:00:00Z",
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// Single Visit Compliance Tests
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateVisitCompliance", () => {
  it("marks compliant visit", () => {
    const result = evaluateVisitCompliance(makeVisit(), NOW);
    expect(result.isCompliant).toBe(true);
    expect(result.issues).toHaveLength(0);
    expect(result.visitorIndependent).toBe(true);
    expect(result.allAreasAssessed).toBe(true);
    expect(result.reportCompleted).toBe(true);
    expect(result.reportSentToOfsted).toBe(true);
  });

  it("flags non-independent visitor", () => {
    const visit = makeVisit({ visitorIndependent: false });
    const result = evaluateVisitCompliance(visit, NOW);
    expect(result.visitorIndependent).toBe(false);
    expect(result.issues.some(i => i.includes("not independent"))).toBe(true);
  });

  it("flags no children spoken to privately", () => {
    const visit = makeVisit({ childrenSpokenToPrivately: [] });
    const result = evaluateVisitCompliance(visit, NOW);
    expect(result.childrenEngagementRate).toBe(0);
    expect(result.issues.some(i => i.includes("No children spoken to privately"))).toBe(true);
  });

  it("warns about low child engagement rate", () => {
    const visit = makeVisit({ childrenSpokenToPrivately: ["Alex"], totalChildrenInHome: 4 });
    const result = evaluateVisitCompliance(visit, NOW);
    expect(result.childrenEngagementRate).toBe(25);
    expect(result.warnings.some(w => w.includes("25%"))).toBe(true);
  });

  it("flags many areas not assessed", () => {
    const visit = makeVisit({ areasAssessed: makeAreaAssessments().slice(0, 5) });
    const result = evaluateVisitCompliance(visit, NOW);
    expect(result.allAreasAssessed).toBe(false);
    expect(result.issues.some(i => i.includes("areas not assessed"))).toBe(true);
  });

  it("flags report not completed", () => {
    const visit = makeVisit({ reportCompletedDate: undefined });
    const result = evaluateVisitCompliance(visit, NOW);
    expect(result.reportCompleted).toBe(false);
    expect(result.issues.some(i => i.includes("report not completed"))).toBe(true);
  });

  it("flags report not sent to Ofsted", () => {
    const visit = makeVisit({ reportSentToOfstedDate: undefined });
    const result = evaluateVisitCompliance(visit, NOW);
    expect(result.reportSentToOfsted).toBe(false);
    expect(result.issues.some(i => i.includes("not sent to Ofsted"))).toBe(true);
  });

  it("warns about late report completion", () => {
    const visit = makeVisit({ reportCompletedDate: "2026-05-20T10:00:00Z" }); // 14 days after visit
    const result = evaluateVisitCompliance(visit, NOW);
    expect(result.reportTimely).toBe(false);
    expect(result.warnings.some(w => w.includes("days after visit"))).toBe(true);
  });

  it("warns about previous actions not reviewed", () => {
    const visit = makeVisit({ previousActionsReviewed: false });
    const result = evaluateVisitCompliance(visit, NOW);
    expect(result.warnings.some(w => w.includes("Previous visit actions"))).toBe(true);
  });

  it("warns about short visit duration", () => {
    const visit = makeVisit({ visitDuration: 60 });
    const result = evaluateVisitCompliance(visit, NOW);
    expect(result.warnings.some(w => w.includes("duration short"))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Home Reg 44 Metrics Tests
// ══════════════════════════════════════════════════════════════════════════════

describe("calculateHomeReg44Metrics", () => {
  it("calculates metrics for well-run home", () => {
    const result = calculateHomeReg44Metrics(makeProfile(), NOW);
    expect(result.totalVisitsLast12Months).toBe(6);
    expect(result.frequencyCompliant).toBe(true);
    expect(result.reportCompletionRate).toBe(100);
    expect(result.ofstedSubmissionRate).toBe(100);
  });

  it("detects frequency non-compliance", () => {
    const profile = makeProfile({
      visits: [
        makeVisit({ id: "v1", visitDate: "2026-05-06T10:00:00Z" }),
        makeVisit({ id: "v2", visitDate: "2026-03-01T10:00:00Z" }), // 66 day gap
      ],
    });
    const result = calculateHomeReg44Metrics(profile, NOW);
    expect(result.frequencyCompliant).toBe(false);
    expect(result.visitGapDays).toBeGreaterThan(28);
  });

  it("calculates next visit due date", () => {
    const result = calculateHomeReg44Metrics(makeProfile(), NOW);
    expect(result.lastVisitDate).toBe("2026-05-06T10:00:00Z");
    expect(result.daysUntilNextDue).toBeLessThanOrEqual(28);
  });

  it("calculates average child engagement", () => {
    const result = calculateHomeReg44Metrics(makeProfile(), NOW);
    expect(result.averageChildEngagement).toBe(75); // 3/4 = 75%
  });

  it("calculates action completion rate", () => {
    const result = calculateHomeReg44Metrics(makeProfile(), NOW);
    // Each visit has 2 actions, 1 completed — so 6/12 = 50%
    expect(result.actionCompletionRate).toBe(50);
  });

  it("identifies areas never assessed", () => {
    const profile = makeProfile({
      visits: [
        makeVisit({ id: "v1", areasAssessed: makeAreaAssessments().slice(0, 5) }),
      ],
    });
    const result = calculateHomeReg44Metrics(profile, NOW);
    expect(result.areasNeverAssessed.length).toBe(5);
  });

  it("handles no visits", () => {
    const profile = makeProfile({ visits: [] });
    const result = calculateHomeReg44Metrics(profile, NOW);
    expect(result.totalVisitsLast12Months).toBe(0);
    expect(result.frequencyCompliant).toBe(false);
    expect(result.complianceIssues.some(i => i.includes("non-compliant"))).toBe(true);
  });

  it("identifies recurring issue areas", () => {
    const riVisit = makeVisit({
      areasAssessed: [
        ...makeAreaAssessments().slice(0, 8),
        { area: "records_and_documentation", rating: "requires_improvement", observations: "Gaps in records", evidenceReviewed: ["Daily logs"] },
        { area: "leadership_and_management", rating: "good", observations: "Good", evidenceReviewed: [] },
      ],
    });
    const profile = makeProfile({
      visits: [
        riVisit,
        { ...riVisit, id: "v2", visitDate: "2026-04-08T10:00:00Z" },
        { ...riVisit, id: "v3", visitDate: "2026-03-10T10:00:00Z" },
      ],
    });
    const result = calculateHomeReg44Metrics(profile, NOW);
    expect(result.recurringIssueAreas).toContain("records_and_documentation");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Helper Tests
// ══════════════════════════════════════════════════════════════════════════════

describe("Helper functions", () => {
  it("getVisitAreaLabel returns readable labels", () => {
    expect(getVisitAreaLabel("welfare_of_children")).toBe("Welfare of Children");
    expect(getVisitAreaLabel("complaints_and_concerns")).toBe("Complaints & Concerns");
  });

  it("getVisitRatingLabel returns readable labels", () => {
    expect(getVisitRatingLabel("good")).toBe("Good");
    expect(getVisitRatingLabel("requires_improvement")).toBe("Requires Improvement");
  });
});
