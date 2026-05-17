// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Staff Supervision — Engine Tests
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateSupervisionCompliance,
  calculateTeamMetrics,
  getSupervisionTypeLabel,
  getTopicLabel,
} from "../supervision-engine";
import type {
  StaffSupervisionProfile,
  SupervisionRecord,
  SupervisionAction,
  SupervisionType,
  SupervisionTopic,
} from "../supervision-engine";

// ── Constants ──────────────────────────────────────────────────────────────

const FIXED_NOW = "2026-05-16T12:00:00Z";

// ── Factories ──────────────────────────────────────────────────────────────

function makeAction(overrides: Partial<SupervisionAction> = {}): SupervisionAction {
  return {
    id: "act-001",
    description: "Complete safeguarding refresher",
    assignedTo: "staff-001",
    dueDate: "2026-06-01T00:00:00Z",
    status: "open",
    ...overrides,
  };
}

function makeRecord(overrides: Partial<SupervisionRecord> = {}): SupervisionRecord {
  return {
    id: "sv-001",
    staffId: "staff-001",
    staffName: "Sarah Mitchell",
    staffRole: "Senior Residential Worker",
    supervisorId: "staff-rm-001",
    supervisorName: "Claire Edwards (RM)",
    homeId: "home-oak",
    type: "formal",
    date: "2026-05-01T10:00:00Z",
    durationMinutes: 60,
    location: "Office",
    topicsCovered: ["caseload_review", "safeguarding", "staff_wellbeing", "practice_reflection"],
    keyDiscussionPoints: ["Jordan progress positive", "Alex exploitation concern", "Staff feeling supported"],
    staffWellbeingRating: 4,
    reflectivePracticeIncluded: true,
    safeguardingDiscussed: true,
    actions: [makeAction()],
    previousActionsReviewed: true,
    staffAgreed: true,
    staffAgreedAt: "2026-05-01T11:00:00Z",
    supervisorSignedAt: "2026-05-01T11:00:00Z",
    ...overrides,
  };
}

function makeProfile(overrides: Partial<StaffSupervisionProfile> = {}): StaffSupervisionProfile {
  // Generate 9 sessions over 6 months (every ~3 weeks)
  const sessions: SupervisionRecord[] = Array.from({ length: 9 }, (_, i) => {
    const date = new Date(new Date(FIXED_NOW).getTime() - i * 21 * 24 * 60 * 60 * 1000);
    return makeRecord({
      id: `sv-${String(i + 1).padStart(3, "0")}`,
      date: date.toISOString(),
      staffWellbeingRating: (4 - (i > 6 ? 1 : 0)) as 1 | 2 | 3 | 4 | 5,
    });
  });

  return {
    staffId: "staff-001",
    staffName: "Sarah Mitchell",
    staffRole: "Senior Residential Worker",
    homeId: "home-oak",
    startDate: "2023-03-01T00:00:00Z",
    isInProbation: false,
    supervisorId: "staff-rm-001",
    supervisorName: "Claire Edwards (RM)",
    supervisionHistory: sessions,
    nextScheduledDate: "2026-05-22T10:00:00Z",
    annualAppraisalDue: "2026-09-01T00:00:00Z",
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// evaluateSupervisionCompliance
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateSupervisionCompliance", () => {
  it("returns compliant for well-supervised staff", () => {
    const profile = makeProfile();
    const result = evaluateSupervisionCompliance(profile, FIXED_NOW);
    expect(result.isCompliant).toBe(true);
    expect(result.issues).toHaveLength(0);
    expect(result.isOverdue).toBe(false);
    expect(result.frequencyMet).toBe(true);
  });

  it("calculates days since last supervision", () => {
    const profile = makeProfile({
      supervisionHistory: [
        makeRecord({ date: "2026-05-01T10:00:00Z" }),
      ],
    });
    const result = evaluateSupervisionCompliance(profile, FIXED_NOW);
    expect(result.daysSinceLastSupervision).toBe(15); // May 1 → May 16
    expect(result.lastSupervisionDate).toBe("2026-05-01T10:00:00Z");
  });

  it("flags overdue supervision (>42 days)", () => {
    const profile = makeProfile({
      supervisionHistory: [
        makeRecord({ date: "2026-03-20T10:00:00Z" }), // 57 days ago
      ],
    });
    const result = evaluateSupervisionCompliance(profile, FIXED_NOW);
    expect(result.isOverdue).toBe(true);
    expect(result.isCompliant).toBe(false);
    expect(result.issues.some(i => i.includes("overdue"))).toBe(true);
  });

  it("uses stricter gap for probation staff (14 days)", () => {
    const profile = makeProfile({
      isInProbation: true,
      supervisionHistory: [
        makeRecord({ type: "probation", date: "2026-04-28T10:00:00Z" }), // 18 days ago
      ],
    });
    const result = evaluateSupervisionCompliance(profile, FIXED_NOW);
    expect(result.isOverdue).toBe(true);
    expect(result.issues.some(i => i.includes("max: 14"))).toBe(true);
  });

  it("flags no supervision record found", () => {
    const profile = makeProfile({ supervisionHistory: [] });
    const result = evaluateSupervisionCompliance(profile, FIXED_NOW);
    expect(result.isOverdue).toBe(true);
    expect(result.daysSinceLastSupervision).toBeNull();
    expect(result.issues.some(i => i.includes("No supervision record"))).toBe(true);
  });

  it("counts supervisions in last 6 months", () => {
    const profile = makeProfile();
    const result = evaluateSupervisionCompliance(profile, FIXED_NOW);
    expect(result.supervisionsInPeriod).toBe(9);
    expect(result.frequencyMet).toBe(true);
  });

  it("flags insufficient frequency", () => {
    const profile = makeProfile({
      supervisionHistory: [
        makeRecord({ date: "2026-05-01T10:00:00Z" }),
        makeRecord({ id: "sv-2", date: "2026-03-01T10:00:00Z" }),
        makeRecord({ id: "sv-3", date: "2026-01-01T10:00:00Z" }),
      ],
    });
    const result = evaluateSupervisionCompliance(profile, FIXED_NOW);
    expect(result.frequencyMet).toBe(false);
    expect(result.issues.some(i => i.includes("Only 3"))).toBe(true);
  });

  it("calculates reflective practice rate", () => {
    const profile = makeProfile({
      supervisionHistory: [
        makeRecord({ date: "2026-05-01T10:00:00Z", reflectivePracticeIncluded: true }),
        makeRecord({ id: "sv-2", date: "2026-04-10T10:00:00Z", reflectivePracticeIncluded: false }),
      ],
    });
    const result = evaluateSupervisionCompliance(profile, FIXED_NOW);
    expect(result.reflectivePracticeRate).toBe(50);
  });

  it("flags low reflective practice rate (<50%)", () => {
    const profile = makeProfile({
      supervisionHistory: Array.from({ length: 9 }, (_, i) =>
        makeRecord({
          id: `sv-${i}`,
          date: new Date(new Date(FIXED_NOW).getTime() - i * 21 * 24 * 60 * 60 * 1000).toISOString(),
          reflectivePracticeIncluded: i === 0, // only 1 out of 9
        }),
      ),
    });
    const result = evaluateSupervisionCompliance(profile, FIXED_NOW);
    expect(result.reflectivePracticeRate).toBeLessThan(50);
    expect(result.issues.some(i => i.includes("Reflective practice"))).toBe(true);
  });

  it("flags low safeguarding discussion rate (<75%)", () => {
    const profile = makeProfile({
      supervisionHistory: Array.from({ length: 9 }, (_, i) =>
        makeRecord({
          id: `sv-${i}`,
          date: new Date(new Date(FIXED_NOW).getTime() - i * 21 * 24 * 60 * 60 * 1000).toISOString(),
          safeguardingDiscussed: i < 3, // only 3 out of 9
        }),
      ),
    });
    const result = evaluateSupervisionCompliance(profile, FIXED_NOW);
    expect(result.safeguardingDiscussionRate).toBeLessThan(75);
    expect(result.issues.some(i => i.includes("Safeguarding"))).toBe(true);
  });

  it("counts overdue actions", () => {
    const profile = makeProfile({
      supervisionHistory: [
        makeRecord({
          date: "2026-05-01T10:00:00Z",
          actions: [
            makeAction({ status: "overdue" }),
            makeAction({ id: "act-2", status: "open", dueDate: "2026-04-01T00:00:00Z" }), // past due
            makeAction({ id: "act-3", status: "completed" }),
          ],
        }),
      ],
    });
    const result = evaluateSupervisionCompliance(profile, FIXED_NOW);
    expect(result.actionsOverdue).toBe(2);
    expect(result.issues.some(i => i.includes("2 supervision action"))).toBe(true);
  });

  it("detects declining wellbeing trend", () => {
    const profile = makeProfile({
      supervisionHistory: [
        makeRecord({ id: "sv-1", date: "2026-05-01T10:00:00Z", staffWellbeingRating: 2 }),
        makeRecord({ id: "sv-2", date: "2026-04-10T10:00:00Z", staffWellbeingRating: 2 }),
        makeRecord({ id: "sv-3", date: "2026-03-20T10:00:00Z", staffWellbeingRating: 3 }),
        makeRecord({ id: "sv-4", date: "2026-03-01T10:00:00Z", staffWellbeingRating: 4 }),
        makeRecord({ id: "sv-5", date: "2026-02-10T10:00:00Z", staffWellbeingRating: 4 }),
        makeRecord({ id: "sv-6", date: "2026-01-20T10:00:00Z", staffWellbeingRating: 5 }),
      ],
    });
    const result = evaluateSupervisionCompliance(profile, FIXED_NOW);
    expect(result.wellbeingTrend).toBe("declining");
    expect(result.issues.some(i => i.includes("declining trend"))).toBe(true);
  });

  it("detects improving wellbeing trend", () => {
    const profile = makeProfile({
      supervisionHistory: [
        makeRecord({ id: "sv-1", date: "2026-05-01T10:00:00Z", staffWellbeingRating: 5 }),
        makeRecord({ id: "sv-2", date: "2026-04-10T10:00:00Z", staffWellbeingRating: 4 }),
        makeRecord({ id: "sv-3", date: "2026-03-20T10:00:00Z", staffWellbeingRating: 4 }),
        makeRecord({ id: "sv-4", date: "2026-03-01T10:00:00Z", staffWellbeingRating: 3 }),
        makeRecord({ id: "sv-5", date: "2026-02-10T10:00:00Z", staffWellbeingRating: 2 }),
        makeRecord({ id: "sv-6", date: "2026-01-20T10:00:00Z", staffWellbeingRating: 2 }),
      ],
    });
    const result = evaluateSupervisionCompliance(profile, FIXED_NOW);
    expect(result.wellbeingTrend).toBe("improving");
  });

  it("flags overdue annual appraisal", () => {
    const profile = makeProfile({ annualAppraisalDue: "2026-04-01T00:00:00Z" });
    const result = evaluateSupervisionCompliance(profile, FIXED_NOW);
    expect(result.appraisalDue).toBe(true);
    expect(result.issues.some(i => i.includes("appraisal"))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// calculateTeamMetrics
// ══════════════════════════════════════════════════════════════════════════════

describe("calculateTeamMetrics", () => {
  function makeTeam(): StaffSupervisionProfile[] {
    return [
      makeProfile({ staffId: "staff-001", staffName: "Sarah Mitchell" }),
      makeProfile({
        staffId: "staff-002",
        staffName: "Tom Richards",
        supervisionHistory: [makeRecord({ id: "sv-t1", date: "2026-03-01T10:00:00Z", staffId: "staff-002", staffName: "Tom Richards" })],
      }),
      makeProfile({ staffId: "staff-003", staffName: "Lisa Park", nextScheduledDate: "2026-05-20T10:00:00Z" }),
    ];
  }

  it("counts staff and compliance rate", () => {
    const team = makeTeam();
    const result = calculateTeamMetrics(team, "home-oak", FIXED_NOW);
    expect(result.staffCount).toBe(3);
    // Sarah compliant, Tom overdue, Lisa compliant
    expect(result.complianceRate).toBe(67); // 2/3
  });

  it("counts overdue staff", () => {
    const team = makeTeam();
    const result = calculateTeamMetrics(team, "home-oak", FIXED_NOW);
    expect(result.overdueCount).toBe(1); // Tom
  });

  it("calculates average days since last", () => {
    const team = [
      makeProfile({ staffId: "s1", supervisionHistory: [makeRecord({ date: "2026-05-06T10:00:00Z" })] }), // 10 days
      makeProfile({ staffId: "s2", supervisionHistory: [makeRecord({ date: "2026-04-16T10:00:00Z" })] }), // 30 days
    ];
    const result = calculateTeamMetrics(team, "home-oak", FIXED_NOW);
    expect(result.averageDaysSinceLast).toBe(20);
  });

  it("calculates average wellbeing", () => {
    const team = [
      makeProfile({
        staffId: "s1",
        supervisionHistory: [makeRecord({ staffWellbeingRating: 4 })],
      }),
      makeProfile({
        staffId: "s2",
        supervisionHistory: [makeRecord({ id: "sv-2", staffWellbeingRating: 2 })],
      }),
    ];
    const result = calculateTeamMetrics(team, "home-oak", FIXED_NOW);
    expect(result.averageWellbeing).toBe(3);
  });

  it("counts open and overdue actions", () => {
    const team = [
      makeProfile({
        staffId: "s1",
        supervisionHistory: [makeRecord({
          actions: [
            makeAction({ status: "open" }),
            makeAction({ id: "a2", status: "overdue" }),
            makeAction({ id: "a3", status: "completed" }),
          ],
        })],
      }),
    ];
    const result = calculateTeamMetrics(team, "home-oak", FIXED_NOW);
    expect(result.totalOpenActions).toBe(1);
    expect(result.totalOverdueActions).toBe(1);
  });

  it("identifies staff at risk (overdue or declining)", () => {
    const team = makeTeam(); // Tom is overdue
    const result = calculateTeamMetrics(team, "home-oak", FIXED_NOW);
    expect(result.staffAtRisk.length).toBeGreaterThanOrEqual(1);
    expect(result.staffAtRisk.some(s => s.staffName === "Tom Richards")).toBe(true);
  });

  it("lists upcoming due supervisions", () => {
    const team = makeTeam(); // Lisa due May 20
    const result = calculateTeamMetrics(team, "home-oak", FIXED_NOW);
    expect(result.upcomingDue.some(s => s.staffName === "Lisa Park")).toBe(true);
  });

  it("filters to correct home", () => {
    const team = [
      makeProfile({ staffId: "s1", homeId: "home-oak" }),
      makeProfile({ staffId: "s2", homeId: "home-elm" }),
    ];
    const result = calculateTeamMetrics(team, "home-oak", FIXED_NOW);
    expect(result.staffCount).toBe(1);
  });

  it("returns defaults for empty team", () => {
    const result = calculateTeamMetrics([], "home-oak", FIXED_NOW);
    expect(result.staffCount).toBe(0);
    expect(result.complianceRate).toBe(100);
    expect(result.averageWellbeing).toBe(3);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Helper functions
// ══════════════════════════════════════════════════════════════════════════════

describe("helper functions", () => {
  it("getSupervisionTypeLabel returns labels", () => {
    expect(getSupervisionTypeLabel("formal")).toBe("Formal 1:1 Supervision");
    expect(getSupervisionTypeLabel("reflective")).toBe("Reflective Practice");
    expect(getSupervisionTypeLabel("probation")).toBe("Probation Supervision");
  });

  it("getTopicLabel returns labels", () => {
    expect(getTopicLabel("caseload_review")).toBe("Caseload Review");
    expect(getTopicLabel("safeguarding")).toBe("Safeguarding");
    expect(getTopicLabel("staff_wellbeing")).toBe("Staff Wellbeing");
  });
});
